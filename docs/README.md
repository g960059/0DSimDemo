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
- [Calibration and identifiability](scientific-runtime/CALIBRATION-0001-identifiability-first-fitting.md):
  frozen-study, parameter-role, fitting, and model-form boundaries.
- [AI-assisted authoring](../tools/authoring/README.md): machine discovery and
  authoring trust boundaries.
- [Supabase boundary](../supabase/README.md): backend trust, registry, and
  durable-content lifecycle.

Completed research notes, release diaries, rejected approaches, and superseded
architecture live in Git history. Do not restore them as an in-tree archive;
recover a specific historical file with `git show <commit>:<path>` when a task
actually needs it.
