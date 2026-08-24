# Documentation

This tree retains only current boundaries, cross-cutting design decisions, and
scientific evidence that is expensive to reconstruct from code. Source and
tests remain authoritative for IDs, catalogs, equations, algorithms, and UI
behavior.

Open only the area needed for the task:

- [Studio](studio/README.md): identity, persistence, runtime composition, and
  publication boundaries.
- [Integrated model](scientific-runtime/README.md): model scope, scientific
  claim limits, and evidence routing.
- [Numerical model evidence](myocardium/README.md): specifications and retained
  verification material.
- [Testing](testing/test-suite-strategy.md): suite ownership and execution.
- [Supabase operations](../supabase/README.md): registry and durable-content
  operations.

Completed research notes, release diaries, rejected approaches, and superseded
architecture live in Git history. Do not restore them as an in-tree archive;
recover a specific historical file with `git show <commit>:<path>` when a task
actually needs it.
