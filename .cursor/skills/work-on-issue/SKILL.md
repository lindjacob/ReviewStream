---
name: work-on-issue
description:
  Implement a tracked issue end-to-end — branch, plan, code, verify, doc, PR. Use when starting or
  continuing work on an issue, when running the workon verb, or when on a branch named
  `<issue-number>-<slug>`.
---

# Work on an Issue

## At session start, read

- `AGENTS.md` at the repo root, plus any nested `AGENTS.md` for directories you intend to touch
- `docs/index.md`
- The assigned issue body and all comments in full
- Any rules matching files you intend to touch
- Any ADRs the issue's References section links to

## Workflow selection

Three workflows. Walk these rules top-to-bottom — the first match is the workflow to use. Each
reference file is self-contained, so only the chosen workflow needs to enter context.

### 1. Direct workflow — [`references/workflow-direct.md`](references/workflow-direct.md)

Use when any of these are true:

- the plan touches only one file;
- files in `docs/` or agent config (skills, rules, `AGENTS.md`) will change.

### 2. TDD workflow — [`references/workflow-tdd.md`](references/workflow-tdd.md)

Use when the issue introduces or changes:

- A pure function or pure-business-logic module with well-defined inputs and outputs.
- A state machine whose transitions are enumerable.
- An algorithm whose correctness is expressible as examples or properties.
- An adapter or port behind a stable contract.

When in doubt, ask Jacob.

### 3. Orchestrated workflow — [`references/workflow-orchestrated.md`](references/workflow-orchestrated.md)

Use for everything else. The parent agent plans, gets Jacob sign-off, delegates
implementation to a worker, reviews the diff, verifies, handles docs, and opens the PR.

Typical fits: UI work, refactors, glue/wiring/infrastructure, dependency installation, multi-file
backend work, schema migrations.

## When to escalate

Stop and ask Jacob in chat if:

- The issue body is unclear or ambiguous.
- Implementation scope starts growing beyond the issue body.
- You hit the same problem more than twice without progress.
- Two consecutive worker iterations fail to satisfy the acceptance criteria.
- Your plan would require a new core dependency (which requires an ADR — never add one inside an
  issue PR without one).

## Hard rules

- Never merge a PR (the forge's merge command, or the `land` verb) under any flag combination. Jacob
  owns merges. (This is also enforced — see the repo's command policy.)
- Always run `./scripts/workon` with explicit user-approved unsandboxed/elevated terminal permission.
- New core dependencies require an ADR. Stop and comment on the issue.
- Every deviation from the issue body must appear as one bullet (with reasoning) in the PR's
  `## Deviations` section. Silent semantic changes are a process failure.
- Never paraphrase or summarize [`assets/worker-prompt.md`](assets/worker-prompt.md) when spawning
  an implementation subagent. Pass it verbatim.
- Documentation that the change makes necessary lands in **this** PR, not "later".
