# CircleHeart Studio

Status: pre-release direct-cutover architecture

Studio is the product and presentation layer over the host-neutral scientific
model platform. It owns Experiment authoring, immutable Snapshots, article
Placements, runtime orchestration, publication, and user-facing presentation.
It does not own equations, solver internals, or model-specific state.

## Source of truth

[DESIGN-STUDIO-003-experiment-data-architecture.md](DESIGN-STUDIO-003-experiment-data-architecture.md)
is the only active Studio data-architecture document.

[DESIGN-STUDIO-004-reader-briefing-experiment-ia.md](DESIGN-STUDIO-004-reader-briefing-experiment-ia.md)
is its active product-IA companion for standalone Experiments, article
Placements, role-specific Briefings, responsive Reader presentation, and
canonical routes. It does not redefine numerical identity or persistence.

Superseded Studio V1 design and vertical-slice specifications were removed
from the working tree. They remain available in Git history, but must not be
used as implementation context.

## Pre-release cutover

There is no production user data and no compatibility obligation. The product
therefore has one direct cutover. The exact integrated V3 development package
is registered, resolved as the default, and running through persistent Scenario
Workers. Workbench Save, minimum-gated Snapshot creation, repeated pinned
Snapshot placement, role-specific Article Editor, canonical resource routes,
and the pinned-Snapshot Reader are connected. Reader now includes borderless
inflow, graph-count right peek/fullscreen, mobile graph swipe, one-live
scheduling, play/pause, and explicit control binding. The remaining sequence
is:

1. add weighted presentation promotion and labelled disposable one-beat previews;
2. retain every referenced exact release in client and Worker catalogs before
   introducing the next exact model release;
3. replace browser persistence with server publication/collaboration; and
4. only then author official Scenario Presets, Experiments, published articles,
   and Lesson pages.

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
