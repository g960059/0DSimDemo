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
therefore has one direct cutover:

1. finish the portable V3 runtime/control/capture adapter;
2. register `MainWireIntegratedModelTransactionV3` as one exact immutable
   `modelId`;
3. set that registered release as the default model;
4. connect Workbench Save, Snapshot, Placement, and Reader runtime to the new
   contracts;
5. only then author official Scenario Presets, Experiments, and Lesson pages.

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
