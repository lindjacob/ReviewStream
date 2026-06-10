---
name: write-issue
description:
  Create a well-formed issue using the project's issue template. Use when the user asks to create,
  draft, or write an issue; when scoping new work for the backlog; or when a discussion produces
  issue-shaped follow-ups.
---

# Writing an Issue

Prefer the project's structured issue template. If creating from the command line, the `create-item`
verb's body must mirror the same structure (see "Creating from the CLI" below).

## Required fields

| Field | Content |
| --- | --- |
| **Goal** | One sentence — what does "done" look like at the user/system level? |
| **Acceptance criteria** | Checkbox list. Each item must be testable. Verification commands (e.g. `npm test --workspaces --if-present`) belong directly in the AC list. |

## Optional fields — only when material

| Field | When to use |
| --- | --- |
| **Type / labels** | If your project uses labels, set the primary type at creation. Labels are project-defined; don't invent new ones — surface the need to Jacob. |
| **Non-goals** | When there's real drift risk — explicitly fence off later work the agent might drift into. Skip if the AC already constrains scope. |
| **References** | Links to ADRs (`docs/decisions/NNNN-…md`) or rules the implementer must read. Skip if there are no architectural pre-reads. |
| **Notes** | Context that doesn't fit Goal / AC: linked downstream issues, gotchas, things worth knowing. |

## Hard rules

- **Plans never go in the issue body.** The implementer writes the plan in chat, gets Jacob
  sign-off, then inlines it into the PR body at `./scripts/done` time. The issue body is the spec,
  not the plan.
- **Decisions don't go in the issue body either.** Irreversible → an ADR, linked in References.
  Reversible → it lives in the implementation or a code comment.
- **No "Prerequisites" checkbox section.** Use the tracker's native "Blocked by" relation instead —
  the structured relation is the single source of truth. See
  [`references/blocked-by.md`](references/blocked-by.md).
- **Labels are not auto-applied by issue templates.** Set them at creation time or immediately after.

## Creating from the CLI

Save the body to a file using this shape. Omit `Non-goals`, `References`, or `Notes` when they have
no material content.

```markdown
## Goal

<one sentence — what does done look like at the user/system level?>

## Acceptance criteria

- [ ] <testable deliverable>

## Non-goals

<optional; include only when there is real drift risk>

## References

<optional; ADRs, rules, or docs the implementer must read>

## Notes

<optional; context that does not fit Goal / AC>
```

Then create the item via the verb (provider-agnostic):

```bash
./scripts/create-item --title "<short imperative — becomes the branch name>" --body-file <path>
```

For multi-line bodies always use `--body-file`; inline `--body "..."` will eat your escaping.
