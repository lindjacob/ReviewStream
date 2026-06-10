# "Blocked by" / "Blocking" relations (GitHub)

> GitHub implementation of the dependency-tracking seam. A different provider supplies its own
> version. This is the single source of truth for issue dependencies — never list prerequisites in
> an issue body.

These relations are **not** exposed via any `gh issue` flag. Use raw GraphQL.

## Read relations

```bash
gh api graphql -f query='query {
  repository(owner:"lindjacob", name:"ReviewStream") {
    issue(number: <N>) {
      blockedBy(first: 20) { nodes { number title state } }
      blocking(first: 20)  { nodes { number title state } }
    }
  }
}'
```

For a repo-wide view, replace `issue(number: ...)` with `issues(first: 50, states: OPEN)` and request
`nodes { number title blockedBy { ... } blocking { ... } }`.

## Set a relation

Fastest for one-offs: the issue's Development sidebar → "Add a relationship" → "Blocked by".

For batch/scripted setup, use the `addBlockedBy` mutation. Inputs are GraphQL **node IDs**, not issue
numbers — fetch them first:

```bash
gh api graphql -f query='{
  repository(owner:"lindjacob", name:"ReviewStream") {
    a: issue(number:24) { id }
    b: issue(number:36) { id }
  }
}'
```

Then (`issueId` is the blocked one, `blockingIssueId` is what blocks it):

```bash
gh api graphql -f query='mutation {
  addBlockedBy(input: {
    issueId:         "<node-id-of-blocked-issue>",
    blockingIssueId: "<node-id-of-blocking-issue>"
  }) {
    issue         { number }
    blockingIssue { number }
  }
}'
```

The inverse (`removeBlockedBy`) takes the same input shape.
