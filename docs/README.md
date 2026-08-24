# Documentation

This tree retains only current boundaries, cross-cutting design decisions, and
scientific evidence that is expensive to reconstruct from code. Source and
tests remain authoritative for IDs, catalogs, equations, algorithms, and UI
behavior.

Open only the area needed for the task:

- [Studio](studio/README.md): identity, persistence, runtime composition, and
  publication boundaries.
- [Integrated model](scientific-runtime/INTEGRATED-MODEL-0001-current-state.md):
  model scope, runtime ownership, and scientific claim limits.
- [Literature traceability](scientific-runtime/INTEGRATED-MODEL-0002-literature-traceability.md):
  source roles, held-out evidence, and non-claims.
- [Numerical model evidence](myocardium/README.md): specifications and retained
  verification material.
- [AI-assisted authoring](../tools/authoring/README.md): machine discovery,
  numerical authoring, retries, and trust boundaries.
- [Testing](testing/test-suite-strategy.md): suite ownership and execution.
- [Supabase operations](../supabase/README.md): registry and durable-content
  operations.

Completed research notes, release diaries, rejected approaches, and superseded
architecture live in Git history. Do not restore them as an in-tree archive;
recover a specific historical file with `git show <commit>:<path>` when a task
actually needs it.
