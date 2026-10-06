import type { Config } from '@netlify/functions'
import { getDatabase } from '@netlify/database'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

// API de la app (auth, boards, pins) como una sola Netlify Function.
// Errores con shape { detail } y respuestas con los shapes de src/types,
// que es lo que espera el frontend.
// El schema de la base vive en netlify/database/migrations/ (Netlify las aplica en cada deploy).

const ACCESS_TOKEN_EXPIRE = '7d'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

class HttpError extends Error {
  status: number
  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
  }
}

type Sql = ReturnType<typeof getDatabase>['sql']

interface IdRow {
  id: number
}

let sqlClient: Sql | null = null

function getSql(): Sql {
  sqlClient ??= getDatabase().sql
  return sqlClient
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET_KEY
  if (!secret) {
    throw new Error('JWT_SECRET_KEY is not set')
  }
  return new TextEncoder().encode(secret)
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status })
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json()
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      return body as Record<string, unknown>
    }
  } catch {
    // cae al error de abajo
  }
  throw new HttpError(422, 'Invalid JSON body')
}

function requireString(body: Record<string, unknown>, field: string): string {
  const value = body[field]
  if (typeof value !== 'string' || value.length === 0) {
    throw new HttpError(422, `Field "${field}" is required`)
  }
  return value
}

function optionalString(body: Record<string, unknown>, field: string): string | null {
  const value = body[field]
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') {
    throw new HttpError(422, `Field "${field}" must be a string`)
  }
  return value
}

function readCredentials(body: Record<string, unknown>) {
  const email = requireString(body, 'email').trim()
  const password = requireString(body, 'password')
  if (!EMAIL_RE.test(email)) {
    throw new HttpError(422, 'Invalid email address')
  }
  return { email, password }
}

async function createAccessToken(userId: number): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setExpirationTime(ACCESS_TOKEN_EXPIRE)
    .sign(getSecret())
}

async function getCurrentUserId(req: Request, sql: Sql): Promise<number> {
  const credentialsError = new HttpError(401, 'Could not validate credentials')
  const header = req.headers.get('authorization') ?? ''
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) throw credentialsError

  let userId: number
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })
    userId = Number(payload.sub)
  } catch {
    throw credentialsError
  }
  if (!Number.isInteger(userId)) throw credentialsError

  const rows = await sql<IdRow>`SELECT id FROM users WHERE id = ${userId}`
  if (rows.length === 0) throw credentialsError
  return userId
}

// 404 si el board no existe, 403 si es de otro usuario
async function getOwnedBoardId(sql: Sql, boardId: number, userId: number): Promise<number> {
  const rows = await sql<{ owner_id: number }>`SELECT owner_id FROM boards WHERE id = ${boardId}`
  if (rows.length === 0) throw new HttpError(404, 'Board not found')
  if (rows[0].owner_id !== userId) throw new HttpError(403, 'Not your board')
  return boardId
}

// Devuelve boards con sus pins embebidos, igual que BoardOut
async function selectBoards(sql: Sql, where: { ownerId?: number; boardId?: number }) {
  return sql`
    SELECT b.id, b.name, b.description, b.owner_id, b.created_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', p.id, 'board_id', p.board_id, 'unsplash_id', p.unsplash_id,
            'image_url', p.image_url, 'title', p.title, 'author', p.author,
            'created_at', p.created_at
          ) ORDER BY p.id
        ) FILTER (WHERE p.id IS NOT NULL),
        '[]'
      ) AS pins
    FROM boards b
    LEFT JOIN pins p ON p.board_id = b.id
    WHERE (${where.ownerId ?? null}::int IS NULL OR b.owner_id = ${where.ownerId ?? null})
      AND (${where.boardId ?? null}::int IS NULL OR b.id = ${where.boardId ?? null})
    GROUP BY b.id
    ORDER BY b.id
  `
}

async function route(req: Request): Promise<Response> {
  const method = req.method
  const path = new URL(req.url).pathname.replace(/^\/api/, '').replace(/\/$/, '') || '/'

  if (method === 'GET' && path === '/health') {
    return json({ status: 'ok' })
  }

  const sql = getSql()

  // --- auth ---
  if (method === 'POST' && path === '/auth/register') {
    const { email, password } = readCredentials(await readJson(req))
    const existing = await sql<IdRow>`SELECT id FROM users WHERE email = ${email}`
    if (existing.length > 0) throw new HttpError(400, 'Email already registered')

    // Falla antes del INSERT si falta JWT_SECRET_KEY, para no dejar un usuario creado sin token
    getSecret()
    const hashed = await bcrypt.hash(password, 10)
    const [user] = await sql<IdRow>`
      INSERT INTO users (email, hashed_password) VALUES (${email}, ${hashed}) RETURNING id
    `
    return json({ access_token: await createAccessToken(user.id), token_type: 'bearer' }, 201)
  }

  if (method === 'POST' && path === '/auth/login') {
    const { email, password } = readCredentials(await readJson(req))
    const [user] = await sql<IdRow & { hashed_password: string }>`SELECT id, hashed_password FROM users WHERE email = ${email}`
    if (!user || !(await bcrypt.compare(password, user.hashed_password))) {
      throw new HttpError(401, 'Invalid email or password')
    }
    return json({ access_token: await createAccessToken(user.id), token_type: 'bearer' })
  }

  // --- boards ---
  if (path === '/boards') {
    const userId = await getCurrentUserId(req, sql)

    if (method === 'GET') {
      return json(await selectBoards(sql, { ownerId: userId }))
    }
    if (method === 'POST') {
      const body = await readJson(req)
      const name = requireString(body, 'name')
      const description = optionalString(body, 'description')
      const [board] = await sql`
        INSERT INTO boards (name, description, owner_id)
        VALUES (${name}, ${description}, ${userId})
        RETURNING id, name, description, owner_id, created_at
      `
      return json({ ...board, pins: [] }, 201)
    }
  }

  const boardMatch = path.match(/^\/boards\/(\d+)$/)
  if (boardMatch) {
    const userId = await getCurrentUserId(req, sql)
    const boardId = await getOwnedBoardId(sql, Number(boardMatch[1]), userId)

    if (method === 'PUT') {
      const body = await readJson(req)
      const name = optionalString(body, 'name')
      const description = optionalString(body, 'description')
      await sql`
        UPDATE boards
        SET name = COALESCE(${name}, name), description = COALESCE(${description}, description)
        WHERE id = ${boardId}
      `
      const [board] = await selectBoards(sql, { boardId })
      return json(board)
    }
    if (method === 'DELETE') {
      await sql`DELETE FROM boards WHERE id = ${boardId}`
      return new Response(null, { status: 204 })
    }
  }

  // --- pins ---
  const pinsMatch = path.match(/^\/boards\/(\d+)\/pins$/)
  if (pinsMatch && method === 'POST') {
    const userId = await getCurrentUserId(req, sql)
    const boardId = await getOwnedBoardId(sql, Number(pinsMatch[1]), userId)
    const body = await readJson(req)
    const [pin] = await sql`
      INSERT INTO pins (board_id, unsplash_id, image_url, title, author)
      VALUES (
        ${boardId},
        ${requireString(body, 'unsplash_id')},
        ${requireString(body, 'image_url')},
        ${optionalString(body, 'title')},
        ${optionalString(body, 'author')}
      )
      RETURNING id, board_id, unsplash_id, image_url, title, author, created_at
    `
    return json(pin, 201)
  }

  const pinMatch = path.match(/^\/boards\/(\d+)\/pins\/(\d+)$/)
  if (pinMatch && method === 'DELETE') {
    const userId = await getCurrentUserId(req, sql)
    const boardId = await getOwnedBoardId(sql, Number(pinMatch[1]), userId)
    const deleted = await sql<IdRow>`
      DELETE FROM pins WHERE id = ${Number(pinMatch[2])} AND board_id = ${boardId} RETURNING id
    `
    if (deleted.length === 0) throw new HttpError(404, 'Pin not found')
    return new Response(null, { status: 204 })
  }

  throw new HttpError(404, 'Not Found')
}

export default async (req: Request): Promise<Response> => {
  try {
    return await route(req)
  } catch (error) {
    if (error instanceof HttpError) {
      return json({ detail: error.message }, error.status)
    }
    console.error(error)
    return json({ detail: 'Internal server error' }, 500)
  }
}

export const config: Config = {
  path: '/api/*',
}
