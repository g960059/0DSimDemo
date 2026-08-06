# CircleHeart Studio

Status: pre-release direct-cutover architecture

Studio is the product and presentation layer over the host-neutral scientific
model platform. It owns Experiment authoring, immutable Snapshots, article
Placements, runtime orchestration, publication, and user-facing presentation.
It does not own equations, solver internals, or model-specific state.

## Source of truth

[DESIGN-STUDIO-003-experiment-data-architecture.md](DESIGN-STUDIO-003-experiment-data-architecture.md)
is the only active Studio data-architecture document.

Superseded Studio V1 design and vertical-slice specifications were removed
from the working tree. They remain available in Git history, but must not be
used as implementation context.

## Pre-release cutover

There is no production user data and no compatibility obligation. The product
therefore has one direct cutover. The exact integrated V3 development package
is now registered, resolved as the default, and running through the generic
Workbench Worker. The remaining sequence is:

1. admit portable controls beyond the fixed canonical fixture;
2. bridge accepted-boundary capture from the one Worker owner into the V2
   authoring application, then connect Workbench Save, Snapshot, Placement,
   and Reader presentation;
3. add the one-live article scheduler and disposable previews; and
4. only then author official Scenario Presets, Experiments, and Lesson pages.

Do not add a legacy reader, migration, dual-write, fallback model, or sample
content encoded with the superseded structure.

## Dependency rule

```text
Studio presentation
  → Studio application
    → Studio contracts and ports
      → registered model adapter
        → scientific model platform
```

Studio contracts/application/infrastructure do not import React,
engine internals, preview controllers, or legacy case persistence. Exact
model integrations belong in adapters.
