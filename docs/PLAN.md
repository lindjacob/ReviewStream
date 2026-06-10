# App Store Reviews Viewer — Take-Home Plan

## Language decision

Go is explicitly ruled out by the assignment for non-Go-familiar candidates. We use **TypeScript end-to-end**: Node + Express on the backend, Vite + React on the frontend. Justification of each dependency goes in the README (Express: routing ergonomics, universally readable; everything else is Node stdlib — `fetch`, `node:test`, and `node:sqlite` included).

## Storage decision

**SQLite via the stdlib `node:sqlite` module** (zero third-party deps; a SQLite db is still "just a file" per the assignment). Dedupe via `INSERT OR IGNORE` on review id primary key, newest-first via `ORDER BY`, 48h window via `WHERE`, crash safety from SQLite's journal. Caveat: `node:sqlite` is experimental on Node 22 (works, emits a warning; verified locally on v22.22.3) and stable on Node 24 — Docker pins `node:24`, `engines` documents the requirement, and the thin `ReviewStore` interface keeps a swap to better-sqlite3/Postgres trivial.

## Process: issues + commit waves

One GitHub issue per plan step with acceptance criteria; each wave of work is committed referencing its issue (`Closes #N`) so the history demonstrates planned, incremental delivery.

## Architecture

```mermaid
flowchart LR
    rss["iTunes RSS feed (configured appId)"]
    subgraph backend [Backend - Express + TS]
        poller[Poller - startup poll and interval]
        store["SqliteReviewStore (node:sqlite, dedupe by review id PK)"]
        api["GET /api/apps and GET /api/apps/:appId/reviews"]
    end
    subgraph frontend [Frontend - Vite + React]
        ui[Review list - newest first, 48h window]
    end
    rss --> poller --> store --> api --> ui
```

## Repo layout

- `backend/src/itunesReviews.ts` — fetch + parse the iTunes JSON feed into a `Review` model (`id, appId, author, title, content, rating, submittedAt`)
- `backend/src/reviewStore.ts` — small interface; `createSqliteReviewStore` returns a SQLite-backed store using a single file in `data/` (`reviews` table: `id` PK, indexed `app_id`, `author`, `title`, `content`, `rating`, `submitted_at`). The interface is our "swap in Postgres" answer for scaling.
- `backend/src/polling.ts` — polls the configured app on startup and then every `POLL_INTERVAL` (default 5 min), fetches page 1, merges into store
- `backend/src/server.ts` — Express app; `GET /api/apps` lists configured apps, `GET /api/apps/:appId/reviews?hours=48` returns reviews newest-first filtered to the window (hours configurable per the assignment's "increase the window" note)
- `backend/src/index.ts` — Express app startup; `APP_ID` selects the single app to poll, `POLL_INTERVAL` controls the polling cadence
- `frontend/` — Vite + React + TS: app selector (if multiple apps), review cards with content, author, star rating, relative + absolute timestamp; loading/empty/error states; Vite dev proxy to backend so no CORS handling needed
- `docker-compose.yml` — backend service with `./data` volume (persists across restarts), frontend served by nginx proxying `/api` to backend
- `README.md` — run instructions (compose + bare npm), runtime configuration, design decisions, dependency justifications

## Key behaviors mapped to assessment criteria

- **Stores review data / survives restart**: SQLite file persistence + `INSERT OR IGNORE` dedupe; on restart the poller resumes without duplicating rows. Docker volume proves it under compose.
- **48h window, newest first**: filtering and sorting on the backend endpoint; window configurable.
- **Current app selection**: one app ID is configured via `APP_ID`; stored review rows remain keyed by `appId` so broader multi-app support can be added without changing the storage shape.
- **Bonus tests (`node:test`)**: RSS parsing from a fixture of the real feed JSON, store dedupe + persistence round-trip, 48h filter edge cases.

## Time budget (~2.5h)

- Scaffold + backend core (rss, store, poller, API): ~70 min
- Frontend: ~40 min
- Tests: ~25 min
- Docker + compose: ~20 min
- README polish: ~15 min
