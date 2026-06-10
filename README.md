# ReviewStream

Recent iOS App Store reviews viewer — take-home assignment.

- **Backend**: Node.js + TypeScript + Express. Polls the iTunes customer reviews RSS feed for a configured app ID and persists reviews to SQLite (stdlib `node:sqlite`, zero third-party storage dependencies).
- **Frontend**: Vite + React + TypeScript. Displays reviews from the last 48 hours, newest first.

See [docs/PLAN.md](docs/PLAN.md) for the architecture and implementation plan. Work is tracked in GitHub issues, one per plan step.

## Prerequisites

- Node.js 24.14 or newer. The backend targets Node 24 LTS because `node:sqlite` is Release Candidate there.
- npm, bundled with Node.

If you use `nvm`:

```sh
nvm install 24
nvm use 24
```

## Install

Install dependencies from the repository root. npm workspaces will install both `backend/` and `frontend/`.

```sh
npm install
```

## Run Locally

Start the backend:

```sh
npm run dev --workspace backend
```

The backend listens on `http://localhost:3000` and polls immediately on startup. Runtime configuration comes from process environment variables:

- `APP_ID`: App Store app ID to poll. Defaults to `595068606`.
- `POLL_INTERVAL`: polling interval in milliseconds. Defaults to `300000`.

The current scaffold exposes:

```sh
curl http://localhost:3000/health
```

Start the frontend in a second terminal:

```sh
npm run dev --workspace frontend
```

The Vite dev server prints the local frontend URL, typically `http://localhost:5173`.

## Useful Commands

```sh
npm run build --workspace backend
npm run build --workspace frontend
npm test --workspaces --if-present
```

Design decisions and dependency justifications live in [docs/decisions/](docs/decisions/).
