# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check (`tsc -b`) then production build via Vite
- `npm run lint` — run ESLint over the project
- `npm run preview` — preview the production build locally

There is no test runner configured in this project (no test script, no test framework in `package.json`).

## Environment

The app reads `VITE_UNSPLASH_ACCESS_KEY` from `.env` (Vite env var, exposed via `import.meta.env`). It's the Unsplash API "Client-ID" used to fetch photos as pins. Without it, `fetchPins` requests will fail.

## Architecture

React 19 + TypeScript + Vite app using Redux Toolkit for state, structured by feature under `src/features/`:

- `src/app/store.ts` — the single Redux store; feature reducers are registered here (`pins` currently).
- `src/shared/hooks/redux.ts` — typed `useAppDispatch`/`useAppSelector`, used instead of the plain react-redux hooks everywhere.
- `src/types/index.ts` — shared domain types (`Pin`, `Board`, `User`) used across features and API mapping code.
- `src/features/pins/` — the only fully implemented feature:
  - `pinsSlice.ts` — `fetchPins` is a `createAsyncThunk` that calls the Unsplash API directly (`https://api.unsplash.com/photos`) and maps the response into the app's `Pin` shape. State tracks `items`, `status`, `page`, and `hasMore` for pagination, and dedupes pins by `id` when merging new pages.
  - `PinFeed.tsx` — renders the masonry feed. Column count is responsive (2/3/4 columns by window width, computed in JS, applied via CSS `columnCount`). Infinite scroll is done with an `IntersectionObserver` on a sentinel div at the bottom of the feed, gated so it only fires a new fetch when `status === 'succeeded'` (prevents duplicate/overlapping fetches). Loading state renders skeleton placeholders using a fixed array of heights (`SKELETON_HEIGHTS`) to mimic masonry layout before real content arrives.
  - `PinCard.tsx` — individual pin card with hover-to-reveal save button.
- `src/features/auth/` and `src/features/boards/` — scaffolded but currently empty (`authSlice.ts`, `LoginForm.ts`, `boardsSlice.ts`, `BoardList.ts` have no content yet); not wired into the store.

`react-router-dom` and `axios` are dependencies but not yet used anywhere in `src/` — routing and API calls (besides the raw `fetch` in `pinsSlice.ts`) haven't been introduced yet.

Styling throughout is inline `style` objects per component (no CSS modules/styled-components), except for `App.css`/`index.css`/global styles.
