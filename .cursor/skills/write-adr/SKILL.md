---
name: write-adr
description:
  Author or amend an ADR (Architecture Decision Record) under docs/decisions/. Use when capturing an
  irreversible decision, when the user asks to write or update an ADR, or when an issue's References
  section needs a new ADR before the issue can be picked up.
---

# Writing an ADR

ADRs in `docs/decisions/` follow a slim template. Target: ~50 lines per ADR.

## Required sections

1. **Header** — `Status`, `Date`, `Deciders`. Add `Last updated:` line if amended in-place.
2. **Decision** — what we are doing. Imperative voice. 3–10 lines.
3. **Why** — actual reasoning, including 1-line dismissals of rejected alternatives. 5–15 lines.

## Optional sections (only if they earn their tokens)

- **Implementation notes** — only when there is a real gotcha (e.g. a subtle library quirk, a
  build-system caveat).
- **Re-evaluation triggers** — only if the trigger is concrete and measurable (not "consider
  revisiting if needs change").

## What ADRs do NOT contain

- Exact dependency versions, runtime versions, or package-manager majors — unless the version number
  **is** the decision. When readers need a version, point at the live source of truth (the manifest,
  lockfile, or version files) instead of copying numbers into prose.
- Long "Considered options" RFC sections — collapse rejected alternatives into 1-line dismissals
  inside **Why**.
- "Easier / Harder / Consequences" padding that restates the obvious.
- Speculative re-evaluation triggers nobody will measure against.
- Restatements of code, rule, or doc content that lives elsewhere — link, don't duplicate.

## Numbering

ADRs are numbered sequentially: `NNNN-short-kebab-title.md`. Find the highest existing number with
`ls docs/decisions/` and increment by one. Never skip numbers.

## Amendments

Factual corrections to a binding ADR are made **in-place** with a `Last updated:` line in the header
explaining the correction. Decision changes require a new ADR that supersedes the old one (mark the
old one's status `Superseded by NNNN`).

## Example header

```markdown
# 0007 — Short kebab title

- **Status:** Accepted
- **Date:** YYYY-MM-DD
- **Deciders:** Maintainer

## Decision

…

## Why

…
```
