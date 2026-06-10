# Workflow — direct

Direct workflow. Use when the change is small enough that orchestration and worker delegation would
add overhead without value: single-file plans, docs-only edits, or first-time convention
introductions where the parent agent is the right author.

1. **Branch.** Run `./scripts/workon <issue-number>`. Refuses on a dirty tree — commit, stash, or
   discard first.
2. **Implement directly.** Make the change yourself in this session — no plan share, no plan
   sign-off, no delegation to a worker subagent.
3. **Verify.** Run `npm test --workspaces --if-present` plus any verification commands listed in the
   Acceptance criteria.
4. **Update documentation.** Use the `write-docs` skill to:
   - Add a feature README if the implemented feature crossed the size trigger (≥3 source files OR
     non-obvious cross-module interaction).
   - Update any spec under `docs/<area>/` whose factual content this change made stale.
   - Write or amend an ADR if the change involved an irreversible decision.
   - Add or update package-level READMEs, `AGENTS.md` files, and inline comments where the change
     introduces new conventions or non-obvious intent.

   If documentation updates touched anything other than pure markdown (e.g. rules, code-adjacent
   config, source files cited by docs), re-run step 3.

5. **Get final sign-off.** Present the implementation summary, documentation decision, verification
   results, deviations, and known residual risks. Wait for an explicit "OK" from Jacob, then
   continue.
6. **Commit and open the PR.** Commit implementation and docs together, then run `./scripts/done`
   with `--body-file` containing:
   - `Closes #<issue-number>`.
   - A `## Plan` section with your implementation plan (the reasoning, not the code).
   - A `## Deviations` section listing each deviation from the issue body with reasoning.
   - A `## Verification` section with the commands you ran and their outcomes.
7. **Stop.** End your session after `./scripts/done`. Jacob owns the merge step.
