# Repository guidance

Source code and tests are authoritative. Documentation should explain boundaries
or system-wide intent that would otherwise require reading many files; do not
duplicate catalogs, formulas, worker mechanics, or implementation detail that
is easy to discover with `rg`.

Read progressively:

- start at `docs/README.md` only when a repository-wide boundary matters;
- use `docs/scientific-runtime/README.md` for integrated-model claims;
- use `docs/studio/README.md` for Studio identity and persistence;
- open evidence documents only for scientific-source or validation work.

Keep these ownership layers distinct:

- the exact model owns numerical semantics, checkpoints, primitive outputs,
  and model-accumulated metrics;
- an analysis method owns results such as PE, PVA, and estimated MVO2;
- the Model Surface owns product exposure and presentation composition.

Git history is the archive for completed research lanes, superseded plans, and
release narratives. Keep only current, reusable context in the working tree.
