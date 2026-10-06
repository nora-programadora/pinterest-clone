# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project layout

A Vite/React frontend at the repo root plus a TypeScript API that runs as a single Netlify Function (`netlify/functions/api.ts`), backed by Postgres via Netlify DB (Neon). Everything deploys to Netlify. Auth and boards hit the API at `/api` (same origin); the pin feed hits Unsplash directly from the browser.

## Commands

- `npx netlify dev` — run the app and the API together at http://localhost:8888. Requires `npx netlify link` once (`@netlify/neon` needs a linked site). Use 8888, not Vite's 5173 — `/api` only exists behind Netlify Dev.
- `npm run dev` — Vite alone (http://localhost:5173), frontend only; API calls will 404 unless `VITE_API_URL` points somewhere.
- `npm run build` — type-check (`tsc -b`, which includes `netlify/` via `tsconfig.netlify.json`) then production build via Vite
- `npm run lint` — run ESLint over the project
- `npm run preview` — preview the production build locally (frontend only)

There is no test runner configured (no test script, no test framework in `package.json`).

## Environment

Repo root `.env` (not committed), also loaded by `netlify dev`:

- `VITE_UNSPLASH_ACCESS_KEY` — Unsplash API "Client-ID" used by `fetchPins`. Without it, pin fetches fail.
- `JWT_SECRET_KEY` — required by the API to sign/verify tokens; requests that need it 500 if it's missing.
- `VITE_API_URL` — optional; `apiClient` defaults to `/api`. Only set it to point the frontend at a different API.

`NETLIFY_DATABASE_URL` is injected by Netlify (site env), read automatically by `neon()` from `@netlify/neon`. Local dev uses the same database as the deployed site.

In production, `JWT_SECRET_KEY` and `VITE_UNSPLASH_ACCESS_KEY` are set in the Netlify site's environment variables (`VITE_*` are baked in at build time, so changing them requires a redeploy).

## Architecture

### Frontend

React 19 + TypeScript + Vite app using Redux Toolkit for state and `react-router-dom` for routing, structured by feature under `src/features/`:

- `src/main.tsx` — wraps `App` in the Redux `Provider` and `BrowserRouter`.
- `src/App.tsx` — gates the whole app on `state.auth.token`: no token renders `LoginForm`; otherwise renders the header (nav links, email, logout) and the routes: `/` → `PinFeed`, `/boards` → `BoardsPage`, `/boards/:boardId` → `BoardDetail`. SPA fallback for deep links is in `netlify.toml`.
- `src/app/store.ts` — the Redux store; registers `pins`, `auth`, and `boards` reducers.
- `src/shared/hooks/redux.ts` — typed `useAppDispatch`/`useAppSelector`, used instead of the plain react-redux hooks everywhere.
- `src/shared/api/client.ts` — shared axios instance (`apiClient`), baseURL `VITE_API_URL || '/api'`, with a request interceptor that attaches `Authorization: Bearer <token>` from `shared/api/token.ts`.
- `src/shared/api/token.ts` — localStorage-backed get/set/clear for the JWT.
- `src/types/index.ts` — shared domain types (`Pin`, `Board`, `BoardPin`, `User`). `Board`/`BoardPin` match the API's JSON (snake_case fields, integer ids). Note: `User` declares `username`/`avatarUrl`, but the `users` table only has `email` — those fields aren't populated anywhere.
- `src/features/pins/` — the pin feed, backed by the Unsplash API (not our API):
  - `pinsSlice.ts` — `fetchPins` is a `createAsyncThunk` that calls `https://api.unsplash.com/photos` directly and maps the response into the app's `Pin` shape. State tracks `items`, `status`, `page`, and `hasMore` for pagination, and dedupes pins by `id` when merging new pages.
  - `PinFeed.tsx` — renders the masonry feed. Column count is responsive (2/3/4 columns by window width, computed in JS, applied via CSS `columnCount`). Infinite scroll is done with an `IntersectionObserver` on a sentinel div at the bottom of the feed, gated so it only fires a new fetch when `status === 'succeeded'` (prevents duplicate/overlapping fetches). Loading state renders skeleton placeholders using a fixed array of heights (`SKELETON_HEIGHTS`).
  - `PinCard.tsx` — individual pin card with hover-to-reveal save button. The save button opens a small menu (backed by `boardsSlice`) to save the pin into an existing board or create a new board on the fly. Pins aren't clickable — there's no pin detail view.
- `src/features/auth/`:
  - `authSlice.ts` — `login`/`register` thunks POST to `/auth/login` / `/auth/register` via `apiClient`, store the JWT (via `shared/api/token.ts`) and the user's email (in `localStorage`) on success. `logout` reducer clears both.
  - `LoginForm.tsx` — single form that toggles between login/register mode.
- `src/features/boards/`:
  - `boardsSlice.ts` — `fetchBoards`, `createBoard`, `updateBoard`, `deleteBoard`, `savePinToBoard`, `removePinFromBoard` thunks against the `/boards` endpoints.
  - `BoardsPage.tsx` — grid of the user's boards with a 4-pin preview each, plus an inline "create board" form.
  - `BoardDetail.tsx` — a board's pins; rename the board inline, delete it (with `window.confirm`), remove pins. Errors from these actions share one `actionError` message.

API errors come back as `{ detail: string }`; each slice's `getErrorMessage` reads that.

Styling throughout is inline `style` objects per component (no CSS modules/styled-components), except for `App.css`/`index.css`/global styles.

### API (`netlify/`)

- `functions/api.ts` — a single Netlify Function (v2 handler, `config.path = '/api/*'`) with a small hand-rolled router on the pathname. Endpoints:
  - `GET /api/health`
  - `POST /api/auth/register`, `POST /api/auth/login` — return `{ access_token, token_type: 'bearer' }`. Passwords hashed with `bcryptjs`; JWTs via `jose` (HS256, `sub` = user id, 7-day expiry).
  - `GET/POST /api/boards`, `PUT/DELETE /api/boards/:boardId` — scoped to the current user; boards are returned with their `pins` embedded (aggregated with `json_agg`). No pagination.
  - `POST /api/boards/:boardId/pins`, `DELETE /api/boards/:boardId/pins/:pinId` — a "pin" here is a row linking a board to an Unsplash photo; there's no image upload.
  - `getOwnedBoardId` gives 404 for a missing board, 403 for someone else's. Errors are thrown as `HttpError` and turned into `{ detail }` responses; anything else is a logged 500.
  - Input validation is manual (`requireString`/`optionalString`/`readCredentials`), 422 on bad input.
- `db/schema.ts` — `CREATE TABLE/INDEX IF NOT EXISTS` statements for `users`, `boards`, `pins` (integer `SERIAL` ids, `ON DELETE CASCADE` from users → boards → pins). There's no migration tool: `getSql()` runs these once per function instance (cold start). Schema changes that aren't additive/idempotent need to be handled by hand.
- DB access uses `neon()` from `@netlify/neon` (Neon's HTTP driver): tagged-template queries, one statement per call, no interactive transactions.

No tests, no CI.
