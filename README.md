# Pinterest Clone

A Pinterest-style app: a masonry feed of photos (from the Unsplash API) that a logged-in user can save into personal boards. React/Redux frontend, FastAPI backend.

## Current state

Working end to end:

- Infinite-scroll masonry feed of Unsplash photos.
- Email/password register & login (JWT, persisted in `localStorage`).
- Saving a pin into a board from the pin card, including creating a new board on the fly.
- Routing with `react-router-dom`: feed (`/`), boards list (`/boards`) and board detail (`/boards/:boardId`).
- Boards page: browse your boards with a preview of their pins, and create new ones.
- Board detail: see a board's pins, remove a pin from it, and delete the board.

Not implemented yet:

- No way to rename or edit a board's description — the backend supports it (`PUT /boards/{board_id}`), but there's no UI or thunk for it.
- No pin detail view — pins aren't clickable.
- No image upload — pins are Unsplash photos only, users can't add their own images.
- No user profile (username/avatar) — only email/password exist.
- No tests, no CI, on either side.

## Project structure

- `/` — Vite + React + TypeScript frontend (Redux Toolkit for state).
- `backend/` — FastAPI + SQLAlchemy + SQLite API (auth + boards).

The frontend talks to the Unsplash API directly for the pin feed, and to the local FastAPI backend for auth and boards. Both need to be running.

## Setup

### 1. Frontend

```bash
npm install
```

Create a `.env` in the repo root:

```
VITE_UNSPLASH_ACCESS_KEY=your-unsplash-access-key
VITE_API_URL=http://localhost:8000
```

Get an Unsplash access key from https://unsplash.com/developers (create an app, use its "Access Key" as the Client-ID).

```bash
npm run dev
```

The app runs at http://localhost:5173.

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` (see `backend/.env.example`):

```
DATABASE_URL=sqlite:///./pinterest_clone.db
JWT_SECRET_KEY=some-long-random-string
```

```bash
uvicorn main:app --reload
```

The API runs at http://localhost:8000 and creates the SQLite database file on first run. CORS is preconfigured for `http://localhost:5173`.

## Commands

Frontend (repo root):

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check (`tsc -b`) then production build
- `npm run lint` — run ESLint
- `npm run preview` — preview the production build locally

Backend (`backend/`, with the venv active):

- `uvicorn main:app --reload` — start the API with auto-reload
