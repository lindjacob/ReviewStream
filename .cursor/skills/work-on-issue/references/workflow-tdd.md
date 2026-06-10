# Workflow — TDD-shaped issue

For TDD-shaped issues the orchestrator authors the test suite before delegating implementation, and
the worker's job is to make those tests pass. The pattern compresses review (read the tests, not
every line) and prevents the worker from silently shipping unverified code.

1. **Branch.** Run `./scripts/workon <issue-number>`. Refuses on a dirty tree — commit, stash, or
   discard first.
2. **Plan.** Use Plan mode when available. Otherwise produce the plan as a single chat message and do
   not run any tools that modify state. The plan must cover: acceptance criteria mapping, edge cases,
   likely files, non-goals, verification commands, documentation impact, and any decisions you must
   make. The plan must also include a test plan: which cases, which property invariants, which edge
   cases.
3. **Get plan + tests signed off.** Share the plan with Jacob in chat. Share the test suite alongside
   the plan. Wait for explicit approval before implementing. Iterate the plan and the tests on
   feedback before any implementation begins.
4. **Commit the tests as the first commit on the branch**, ahead of the implementation. The
   orchestrator does this directly (not via the worker) so the tests are durable, inspectable in the
   PR, and visible to reviewers as the executable spec.
5. **Delegate implementation.** Launch an implementation subagent using the most capable
   implementation model your agent tool offers. Build its prompt by including the full contents of
   [`../assets/worker-prompt.md`](../assets/worker-prompt.md) verbatim, then appending the issue
   body/comments, the approved plan, relevant rules/ADRs, and the acceptance criteria. Explicitly add
   a green test run as a worker success criterion alongside the acceptance criteria.
6. **Review returned work.** Inspect the diff yourself; do not trust the subagent summary. Check
   acceptance criteria, non-goals, conventions, bugs, tests, and whether documentation may be needed.
   If incomplete or poor, launch another implementation subagent with precise corrective
   instructions. Repeat until satisfied. The worker may extend tests for cases the orchestrator
   missed — encourage this. The worker may not weaken, skip, `.skip()`-flag, comment out, delete, or
   otherwise neuter any orchestrator-authored test. Any such change in the worker's diff is a
   deviation that requires explicit orchestrator approval before commit; if the test is genuinely
   wrong, fix the test in a follow-up commit on the branch.
7. **Verify.** Run `npm test --workspaces --if-present` plus any verification commands listed in the
   Acceptance criteria. Verification is the orchestrator's responsibility, not the worker's. A green
   test run is mandatory, not nice-to-have.
8. **Update documentation.** Use the `write-docs` skill to:
   - Add a feature README if the implemented feature crossed the size trigger (≥3 source files OR
     non-obvious cross-module interaction).
   - Update any spec under `docs/<area>/` whose factual content this change made stale.
   - Write or amend an ADR if the change involved an irreversible decision.
   - Add or update package-level READMEs, `AGENTS.md` files, and inline comments where the change
     introduces new conventions or non-obvious intent.

   If documentation updates touched anything other than pure markdown, re-run step 7.

9. **Get final sign-off.** Present the implementation summary, documentation decision, verification
   results, deviations, and known residual risks. Wait for an explicit "OK" from Jacob, then
   continue.
10. **Commit and open the PR.** Commit implementation and docs together, then run `./scripts/done`
    with `--body-file` containing:
    - `Closes #<issue-number>`.
    - A `## Plan` section with your implementation plan (the reasoning, not the code).
    - A `## Deviations` section. Copy each deviation bullet from the worker's final handoff verbatim
      if you delegated; otherwise list your own.
    - A `## Verification` section with the commands you ran and their outcomes.
11. **Stop.** End your session after `./scripts/done`. Jacob owns the merge step.
