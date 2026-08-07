# Project documentation

The working tree contains current specifications, implementation-facing
evidence, and a small number of explicitly classified historical documents.
Git history is the archive for superseded experiments, generated debug output,
assistant transcripts, and plans that no longer constrain the implementation.

## Current canonical entry points

| Area | Entry point | Status |
|---|---|---|
| Studio V2 | [studio/README.md](studio/README.md) | Authoritative pre-release Experiment architecture |
| Official content | [CONTENT-0001](content/CONTENT-0001-pv-loop-basics-pilot.md) | First vertical-slice acceptance plan |
| Scientific runtime | [scientific-runtime/README.md](scientific-runtime/README.md) | Active Model Platform boundary |
| Myocardium model | [myocardium/README.md](myocardium/README.md) | Current V3 contracts and numerical evidence |
| Cross-lane routing | [status/current-lanes.md](status/current-lanes.md) | Compact pointer index |

## Recovery policy for removed docs

Use git history when an older document is needed for archaeology:

```bash
git show <commit>:<path>
```

Do not restore old docs into the working tree as archives unless they are
actively reviewed and marked as non-canonical. Keeping stale docs locally makes
future implementation context ambiguous.
