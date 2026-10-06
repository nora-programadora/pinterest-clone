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
- `netlify/db/schema.ts` — Postgres tables, created automatically (idempotently) on the function's first request.

The frontend talks to the Unsplash API directly for the pin feed, and to `/api` (same origin) for auth and boards.

## Setup

```bash
npm install
npx netlify login
npx netlify link        # connect this folder to your Netlify site
npx netlify db init     # only if the site doesn't have a database yet
```

Create a `.env` in the repo root:

```
VITE_UNSPLASH_ACCESS_KEY=your-unsplash-access-key
JWT_SECRET_KEY=some-long-random-string
```

Get an Unsplash access key from https://unsplash.com/developers (create an app, use its "Access Key" as the Client-ID). `NETLIFY_DATABASE_URL` is injected by Netlify, no need to set it.

```bash
npx netlify dev
```

The app and the API run together at http://localhost:8888 (use that, not Vite's 5173 — `/api` only exists behind Netlify Dev). Note that local development uses the same Netlify DB database as the deployed site.

## Deploy

Import the repo in Netlify — build settings come from `netlify.toml`. Set `JWT_SECRET_KEY` and `VITE_UNSPLASH_ACCESS_KEY` in Site settings → Environment variables, then redeploy.

## Commands

- `npx netlify dev` — run app + API locally
- `npm run build` — type-check (`tsc -b`, including `netlify/`) then production build
- `npm run lint` — run ESLint
- `npm run preview` — preview the production build (frontend only)
