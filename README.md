# ReviewStream

Recent iOS App Store reviews viewer — take-home assignment.

- **Backend**: Node.js + TypeScript + Express. Polls the iTunes customer reviews RSS feed for a configurable list of app IDs and persists reviews to SQLite (stdlib `node:sqlite`, zero third-party storage dependencies).
- **Frontend**: Vite + React + TypeScript. Displays reviews from the last 48 hours, newest first.

See [docs/PLAN.md](docs/PLAN.md) for the architecture and implementation plan. Work is tracked in GitHub issues, one per plan step.

> Run instructions, design decisions, and dependency justifications will be completed as the implementation lands.
