# Project documentation

The working tree contains current specifications, implementation-facing
evidence, and a small number of explicitly classified historical documents.
Git history is the archive for superseded experiments, generated debug output,
assistant transcripts, and plans that no longer constrain the implementation.

## Current canonical entry points

| Area | Entry point | Status |
|---|---|---|
| Studio v1 | [studio/README.md](studio/README.md) | Active greenfield application lane |
| Scientific runtime | [scientific-runtime/ADR-0001-single-scientific-core.md](scientific-runtime/ADR-0001-single-scientific-core.md) | Active Model Platform boundary |
| Four-chamber mechanics | [myocardium/README.md](myocardium/README.md) | As-implemented boundary plus target specification |
| Cross-lane routing | [status/current-lanes.md](status/current-lanes.md) | Compact pointer index |
| Repository archaeology | [history/README.md](history/README.md) | Recovery index |

## Recovery policy for removed docs

Use git history when an older document is needed for archaeology:

```bash
git show <commit>:<path>
```

Do not restore old docs into the working tree as archives unless they are
actively reviewed and marked as non-canonical. Keeping stale docs locally makes
future implementation context ambiguous.
