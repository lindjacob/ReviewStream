# Agent orientation

ReviewStream — Backend that polls the iTunes customer-reviews RSS feed into SQLite, plus a React app
showing reviews from the last 48 hours, newest first. This file is the entry point for any agent
(Cursor, CLI, cloud) picking up work in this repo.

## 1. Read first

[`docs/index.md`](docs/index.md) — the entry point into product context, architecture, decisions,
and anything else the repo documents.

## 2. Repository layout

- `docs/` — product and system documentation; `docs/decisions/` holds ADRs.
- `scripts/` — workflow scripts (`workon`, `done`, `land`).

Subtree-specific conventions, when they arise, live in nested `AGENTS.md` files (see §3).

## 3. Per-subtree conventions

A subtree may have its own `AGENTS.md` with rules specific to it. When editing files inside such a
subtree, read the nearest `AGENTS.md` first — tools walk the directory tree and load each on the way
down, so nested files need not restate root content.

Add a nested `AGENTS.md` when the subtree gains its first stack- or workflow-specific rule worth
encoding for an agent — not preemptively.

## 4. Top-level commands

- `./scripts/workon <issue-number>` — start work on an issue (branch + checkout).
- `./scripts/done` — push branch and open a PR. Stop after this; Jacob owns merges.
- `npm test --workspaces --if-present` — required before claiming a task done.
- `./scripts/land` — Jacob-only merge step. Agents never run it.

## 5. Skills

Invoke the relevant skill at the start of a task:

- `work-on-issue` — implement an issue end-to-end (branch, plan, code, verify, doc, PR).
- `write-issue` — author a well-formed issue.
- `write-adr` — write or amend an ADR.
- `write-docs` — decide what to document and where.

## 6. Hard rules

- Never merge a PR — neither the forge's merge command nor the `./scripts/land` verb — under any
  flag combination. Jacob owns the merge step. (Also enforced by the repo's command policy.)
- New core dependencies require an ADR. Stop and comment on the issue if your plan needs one.
- Documentation the change makes necessary lands in the same PR, not "later".
