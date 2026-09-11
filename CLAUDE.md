# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project layout

This is a two-part app: a Vite/React frontend at the repo root and a FastAPI backend in `backend/`. Both must be running for the app to work end to end (auth and boards hit the backend; the pin feed hits Unsplash directly from the browser).

## Commands

### Frontend (repo root)

- `npm run dev` — start the Vite dev server (http://localhost:5173)
- `npm run build` — type-check (`tsc -b`) then production build via Vite
- `npm run lint` — run ESLint over the project
- `npm run preview` — preview the production build locally

There is no test runner configured in the frontend (no test script, no test framework in `package.json`).

### Backend (`backend/`)

- Create/activate a venv (`backend/.venv` is gitignored) and `pip install -r requirements.txt`
- `uvicorn main:app --reload` — start the API (http://localhost:8000), run from inside `backend/`
- No test suite, no linter configured for the backend.

## Environment

Two separate `.env` files, neither committed:

- Repo root `.env` (Vite):
  - `VITE_UNSPLASH_ACCESS_KEY` — Unsplash API "Client-ID" used by `fetchPins` to pull photos as pins. Without it, pin fetches fail.
  - `VITE_API_URL` — base URL of the backend API (e.g. `http://localhost:8000`), used by `apiClient` (axios) for auth and boards requests.
- `backend/.env` (see `backend/.env.example`):
  - `DATABASE_URL` — SQLAlchemy URL, defaults to `sqlite:///./pinterest_clone.db` if unset.
  - `JWT_SECRET_KEY` — required; `security.py` raises at import time if it's missing.

CORS on the backend is hardcoded to allow `http://localhost:5173` / `http://127.0.0.1:5173` (see `backend/main.py`).

## Architecture

### Frontend

React 19 + TypeScript + Vite app using Redux Toolkit for state, structured by feature under `src/features/`:

- `src/app/store.ts` — the Redux store; registers `pins`, `auth`, and `boards` reducers.
- `src/shared/hooks/redux.ts` — typed `useAppDispatch`/`useAppSelector`, used instead of the plain react-redux hooks everywhere.
- `src/shared/api/client.ts` — shared axios instance (`apiClient`), baseURL from `VITE_API_URL`, with a request interceptor that attaches `Authorization: Bearer <token>` from `shared/api/token.ts`.
- `src/shared/api/token.ts` — localStorage-backed get/set/clear for the JWT.
- `src/types/index.ts` — shared domain types (`Pin`, `Board`, `BoardPin`, `User`) used across features and API mapping code. Note: `User` declares `username`/`avatarUrl`, but the backend `User` model only has `email` — those fields aren't actually populated anywhere yet.
- `src/features/pins/` — the pin feed, backed by the Unsplash API (not the FastAPI backend):
  - `pinsSlice.ts` — `fetchPins` is a `createAsyncThunk` that calls `https://api.unsplash.com/photos` directly and maps the response into the app's `Pin` shape. State tracks `items`, `status`, `page`, and `hasMore` for pagination, and dedupes pins by `id` when merging new pages.
  - `PinFeed.tsx` — renders the masonry feed. Column count is responsive (2/3/4 columns by window width, computed in JS, applied via CSS `columnCount`). Infinite scroll is done with an `IntersectionObserver` on a sentinel div at the bottom of the feed, gated so it only fires a new fetch when `status === 'succeeded'` (prevents duplicate/overlapping fetches). Loading state renders skeleton placeholders using a fixed array of heights (`SKELETON_HEIGHTS`) to mimic masonry layout before real content arrives.
  - `PinCard.tsx` — individual pin card with hover-to-reveal save button. The save button opens a small menu (backed by `boardsSlice`) to save the pin into an existing board or create a new board on the fly. Pins themselves aren't clickable — there's no pin detail view.
- `src/features/auth/` — fully implemented, talks to the backend:
  - `authSlice.ts` — `login`/`register` thunks POST to `/auth/login` / `/auth/register` via `apiClient`, store the JWT (via `shared/api/token.ts`) and the user's email (in `localStorage`) on success. `logout` reducer clears both.
  - `LoginForm.tsx` — single form that toggles between login/register mode.
  - `App.tsx` gates the whole app on `state.auth.token`: no token renders `LoginForm`, otherwise renders the header (email + logout) and `PinFeed`.
- `src/features/boards/` — mostly implemented, talks to the backend:
  - `boardsSlice.ts` — `fetchBoards`, `createBoard`, `savePinToBoard` thunks against `/boards` endpoints. Wired into `PinCard`, not used anywhere else.
  - `BoardList.ts` — empty/unused stub. There is **no page or view to browse boards** — you can only save pins into a board from the pin card's menu; nothing lists a user's boards, shows a board's contents, or lets you rename/delete a board or remove a pin from one, even though the backend supports all of that.

`react-router-dom` is a dependency but is **not used anywhere** — the app has no routing/URLs, it's a single view that swaps between login and feed based on auth state.

Styling throughout is inline `style` objects per component (no CSS modules/styled-components), except for `App.css`/`index.css`/global styles.

### Backend (`backend/`)

FastAPI + SQLAlchemy + SQLite app, no async DB driver (plain `sqlalchemy.create_engine`).

- `main.py` — app entrypoint; creates tables via `Base.metadata.create_all` on startup (no migration tool, e.g. Alembic, is used), wires CORS, and includes the three routers.
- `database.py` — engine/session setup, `get_db` dependency.
- `security.py` — password hashing (bcrypt via passlib), JWT creation/decoding (`python-jose`, HS256, 7-day expiry), and `get_current_user` dependency (decodes the bearer token, loads the user by id from `sub`).
- `dependencies.py` — `get_owned_board` dependency: loads a board by path `board_id` and 404s/403s if it doesn't exist or isn't owned by the current user. Used by both the boards and pins routers.
- `models/` — SQLAlchemy models: `User` (email + hashed_password only — no username/avatar), `Board` (owned by a user, cascade-deletes its pins), `Pin` (a saved Unsplash photo attached to a board: `unsplash_id`, `image_url`, `title`, `author`).
- `schemas/` — Pydantic request/response models per resource, matched 1:1 with the frontend's `types/index.ts` shapes (`BoardOut`/`PinOut` field names line up with `Board`/`BoardPin` in the frontend).
- `routers/auth.py` — `POST /auth/register`, `POST /auth/login`; both return a `Token`.
- `routers/boards.py` — `GET/POST /boards`, `PUT/DELETE /boards/{board_id}`, all scoped to the current user. No pagination.
- `routers/pins.py` — `POST /boards/{board_id}/pins`, `DELETE /boards/{board_id}/pins/{pin_id}` (a "pin" here is a row linking a board to an Unsplash photo, not a generic uploaded image — there's no image upload anywhere in the app).
- `GET /health` — trivial health check.

No tests, no CI, on either side of the app.
