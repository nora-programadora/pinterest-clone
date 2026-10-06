# Pinterest Clone

A Pinterest-style app: a masonry feed of photos (from the Unsplash API) that a logged-in user can save into personal boards. React/Redux frontend, TypeScript API on Netlify Functions, Postgres via Netlify DB.

## Current state

Working end to end:

- Infinite-scroll masonry feed of Unsplash photos.
- Email/password register & login (JWT, persisted in `localStorage`).
- Saving a pin into a board from the pin card, including creating a new board on the fly.
- Routing with `react-router-dom`: feed (`/`), boards list (`/boards`) and board detail (`/boards/:boardId`).
- Boards page: browse your boards with a preview of their pins, and create new ones.
- Board detail: see a board's pins, remove a pin from it, rename the board and delete it.

Not implemented yet:

- No way to edit a board's description from the UI — the API supports it (`PUT /api/boards/{board_id}`).
- No pin detail view — pins aren't clickable.
- No image upload — pins are Unsplash photos only, users can't add their own images.
- No user profile (username/avatar) — only email/password exist.
- No tests, no CI.

## Project structure

- `/` — Vite + React + TypeScript frontend (Redux Toolkit for state).
- `netlify/functions/api.ts` — the API (auth + boards + pins), a single Netlify Function served at `/api/*`.
- `netlify/database/migrations/` — SQL migrations for the Postgres tables. Netlify applies them automatically on each deploy.

The frontend talks to the Unsplash API directly for the pin feed, and to `/api` (same origin) for auth and boards.

## Setup

```bash
npm install
npm install -g netlify-cli@latest   # Netlify Database needs a recent CLI
npx netlify login
npx netlify link        # connect this folder to your Netlify site
```

Create a `.env` in the repo root:

```
VITE_UNSPLASH_ACCESS_KEY=your-unsplash-access-key
JWT_SECRET_KEY=some-long-random-string
```

Get an Unsplash access key from https://unsplash.com/developers (create an app, use its "Access Key" as the Client-ID).

```bash
npx netlify dev
```

The app, the API and a local Postgres run together at http://localhost:8888 (use that, not Vite's 5173 — `/api` only exists behind Netlify Dev). The local database is separate from production.

The first time (and whenever a new migration is added), with `netlify dev` running, apply the migrations to the local database in another terminal:

```bash
npx netlify database migrations apply
```

## Deploy

Import the repo in Netlify — build settings come from `netlify.toml`. Set `JWT_SECRET_KEY` and `VITE_UNSPLASH_ACCESS_KEY` in Site settings → Environment variables, then redeploy.

## Commands

- `npx netlify dev` — run app + API + local database
- `npx netlify database migrations apply` — apply migrations to the local database
- `npm run build` — type-check (`tsc -b`, including `netlify/`) then production build
- `npm run lint` — run ESLint
- `npm run preview` — preview the production build (frontend only)
