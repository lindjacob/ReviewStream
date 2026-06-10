# 0001 — Core stack: Node/TypeScript + Express backend, Vite + React frontend

- **Status:** Accepted
- **Date:** 2026-06-10
- **Deciders:** Jacob

## Decision

Build the backend as a Node.js (24 LTS) + TypeScript package using Express for HTTP and `tsx` for
dev-time execution. Use the built-in `node:sqlite` module for storage — no third-party database
driver. Build the frontend as a Vite + React + TypeScript app. Organize both as npm workspaces in a
single monorepo with one root lockfile. The backend declares an `engines` floor of Node >= 24.14,
the first LTS release where `node:sqlite` reached Release Candidate status (no experimental
warning).

## Why

- **TypeScript over Go**: the assignment permits JS/TS for those not fluent in Go; one language
  across backend and frontend reduces context switching in a small repo.
- **`node:sqlite` over `better-sqlite3`/`sqlite3`**: zero native-build dependency and one fewer
  third-party package, which the assignment explicitly rewards. Performance is irrelevant at this
  scale. This is what drives the Node 24.14 floor — on Node 22.x the module still prints an
  experimental warning. The issue tracker originally specified >= 22.5; raised with Jacob's
  approval.
- **Express over Fastify or bare `node:http`**: a handful of JSON routes need nothing more;
  Express is the most widely understood option and costs one small dependency. Bare `node:http`
  would mean hand-rolling routing for no benefit.
- **Vite (react-ts) over CRA or Next.js**: CRA is deprecated; Next.js is a full-stack framework and
  overkill for a client-only viewer with a separate backend.
- **npm workspaces over separate repos or turborepo/nx**: two packages need a shared lockfile and
  `--workspaces` commands, nothing more. Extra monorepo tooling is unjustifiable at this size.

Dependency versions live in the package manifests and root `package-lock.json`, not here.
