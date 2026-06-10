# Workflow — orchestrated (default)

Default to orchestration: the parent agent plans, gets Jacob sign-off, delegates implementation to a
worker, reviews the diff, verifies, handles docs, and opens the PR.

1. **Branch.** Run `./scripts/workon <issue-number>`. Refuses on a dirty tree — commit, stash, or
   discard first.
2. **Plan.** Use Plan mode when available. Otherwise produce the plan as a single chat message and do
   not run any tools that modify state. The plan must cover: acceptance criteria mapping, edge cases,
   likely files, non-goals, verification commands, documentation impact, and any decisions you must
   make.
3. **Get plan sign-off.** Share the plan with Jacob in chat. Wait for explicit approval before
   implementing. Iterate the plan if asked.
4. **Delegate implementation.** Launch an implementation subagent using the most capable
   implementation model your agent tool offers. Build its prompt by including the full contents of
   [`../assets/worker-prompt.md`](../assets/worker-prompt.md) verbatim, then appending the issue
   body/comments, the approved plan, relevant rules/ADRs, and the acceptance criteria.
5. **Review returned work.** Inspect the diff yourself; do not trust the subagent summary. Check
   acceptance criteria, non-goals, conventions, bugs, tests, and whether documentation may be needed.
   If incomplete or poor, launch another implementation subagent with precise corrective
   instructions. Repeat until satisfied.
6. **Verify.** Run `npm test --workspaces --if-present` plus any verification commands listed in the
   Acceptance criteria. Verification is the orchestrator's responsibility, not the worker's.
7. **Update documentation.** Use the `write-docs` skill to:
   - Add a feature README if the implemented feature crossed the size trigger (≥3 source files OR
     non-obvious cross-module interaction).
   - Update any spec under `docs/<area>/` whose factual content this change made stale.
   - Write or amend an ADR if the change involved an irreversible decision.
   - Add or update package-level READMEs, `AGENTS.md` files, and inline comments where the change
     introduces new conventions or non-obvious intent.

   If documentation updates touched anything other than pure markdown, re-run step 6.

8. **Get final sign-off.** Present the implementation summary, documentation decision, verification
   results, deviations, and known residual risks. Wait for an explicit "OK" from Jacob, then
   continue.
9. **Commit and open the PR.** Commit implementation and docs together, then run `./scripts/done`
   with `--body-file` containing:
   - `Closes #<issue-number>`.
   - A `## Plan` section with your implementation plan (the reasoning, not the code).
   - A `## Deviations` section listing each deviation bullet from the worker's final handoff
     verbatim; if missing write your own.
   - A `## Verification` section with the commands you ran and their outcomes.
10. **Stop.** End your session after `./scripts/done`. Jacob owns the merge step.
