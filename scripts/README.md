# Workflow Scripts (GitHub provider)

These scripts implement the harness verb contract for GitHub, keeping the issue → branch → PR
workflow in versioned repo code instead of personal `gh` aliases. They are pure `bash` + `git` +
`gh`; Jacob and every agent run the same entry points.

Skills call these verbs, never `gh` directly — so swapping in another provider needs no skill edits.

## `./scripts/workon`

`./scripts/workon <issue-number>` starts work on an existing issue. It refuses a dirty tree, reads
the issue title, slugifies it into `<issue-id>-<kebab-slug>`, and links the branch to the issue via
`gh issue develop --checkout`. If the branch already exists locally or on `origin`, it switches to it.

`./scripts/workon -t "scratch title"` exists only for non-development scratch issues; it prints a
loud warning because it skips the structured issue template.

## `./scripts/done`

`./scripts/done` opens a PR for the current feature branch and stops. It refuses to run on `main`,
pushes with upstream tracking, derives the issue id from the branch prefix, and defaults the body to
`Closes #<id>`. If a PR already exists it prints that URL. Extra args pass through to `gh pr create`.

Review and merge are separate by design. Agents open PRs; Jacob reviews and merges.

## `./scripts/land`

`./scripts/land` is the Jacob-only merge path. It refuses `main`, refuses non-interactive contexts,
prompts for confirmation, runs `gh pr merge --admin --merge`, returns to `main`, and fast-forwards.
Agents never run it (also enforced by the repo's command policy).

## Other verbs

- `./scripts/create-item` — create a tracker item (`--group` maps to a GitHub milestone).
- `./scripts/review <pr>` — print a PR's checks and diff.
- `./scripts/comment-review <pr> --body-file <path>` — post a review comment.
