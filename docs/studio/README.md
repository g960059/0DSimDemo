# CircleHeart Studio

Status: pre-release direct-cutover architecture

Studio is the product and presentation layer over the host-neutral scientific
model platform. It owns Experiment authoring, immutable Snapshots, article
Placements, runtime orchestration, publication, and user-facing presentation.
It does not own equations, solver internals, or model-specific state.

## Source of truth

[DESIGN-STUDIO-003-experiment-data-architecture.md](DESIGN-STUDIO-003-experiment-data-architecture.md)
is the canonical Experiment/Snapshot persistence and capture contract.

[DESIGN-STUDIO-004-reader-briefing-experiment-ia.md](DESIGN-STUDIO-004-reader-briefing-experiment-ia.md)
is its active product-IA companion for standalone Experiments, article
Placements, role-specific Briefings, responsive Reader presentation, and
canonical routes. It does not redefine numerical identity or persistence.

[DESIGN-STUDIO-005-live-graph-performance.md](DESIGN-STUDIO-005-live-graph-performance.md)
defines the scientific-safe presentation pipeline, opt-in browser diagnostics,
and cadence A/B contract for Workbench and Reader graphs.

[DESIGN-STUDIO-006-model-surface-release-and-model-lab.md](DESIGN-STUDIO-006-model-surface-release-and-model-lab.md)
defines the exact numerical kernel/Model Surface split, the `dev | stable |
retired` lifecycle, the atomic active model/Surface bundle, common Snapshot
admission, ordinary-content AI assistance, explicit succession, and Model Lab.

[DESIGN-STUDIO-007-flat-numerical-kernel.md](DESIGN-STUDIO-007-flat-numerical-kernel.md)
defines the no-compatibility flat-kernel cutover, typed Compute Worker ABI,
physical-phone performance gates, and the ordered path through coupled solves,
WASM, multipatch, autonomic reflexes, oxygen delivery, and multirate domains.

[DESIGN-STUDIO-008-public-content-delivery.md](DESIGN-STUDIO-008-public-content-delivery.md)
defines canonical server-rendered public Article HTML, Markdown, JSON,
discovery metadata, caching and deployment while private authoring and the
simulation runtime remain client-rendered.

Superseded Studio V1 design and vertical-slice specifications were removed
from the working tree. They remain available in Git history, but must not be
used as implementation context.

## Pre-release cutover

There is no production user data and no compatibility obligation. The product
therefore has one direct cutover. The exact integrated V3 development package
is registered, resolved from the active bundle, and running through persistent Scenario
Workers. Workbench Save, non-blocking reuse of shared post-control candidates
for structural analysis and Snapshot capture, common one-cycle Snapshot admission, repeated pinned
Snapshot placement with Placement-owned Briefing, role-specific Article Editor,
canonical resource routes, the ID-less `/experiments/new` first-Save transition,
on-demand background Worker pool, dynamic exact-model registry resolution, and
the pinned-Snapshot Reader are connected. New Sessions resolve the active
model/Surface pair once;
saved Experiments, Snapshots, Article Reader placements, and Snapshot Reader
sessions resolve their stored `modelId` and send a hash-free release ticket to
the Worker. A historical load failure never falls back to the active model.
Reader now includes borderless inflow, graph-count right peek/fullscreen,
mobile graph swipe, one-live scheduling, play/pause, and explicit control
binding. The remaining release-spine sequence is:

1. measure Snapshot candidate/admission p50 and p95, tune only from evidence,
   and keep local/linked Supabase migration parity as a deploy gate;
2. make the backend validate the complete portable Studio envelope and keep
   public publication admin-only until the public trust boundary is server-
   authoritative;
3. exercise multi-release retention with the next standard-ABI numerical
   release before atomically replacing the active bundle;
4. configure production OAuth redirects, Turnstile/anonymous-save abuse
   controls, paginated management UI, and scheduled unreferenced-Snapshot GC;
5. perform bounded contract-preserving refactors and rename formal multi-load
   PV analysis claims where the UI currently overstates ESPVR/EDPVR; and
6. author a few bounded Scenario Presets, Experiments and Articles through the
   normal UI with AI assistance, then automate only demonstrated repetition.

The Git recipe/runner path was removed. Official content uses the same
Experiment, Snapshot, Article Editor, Reader and Supabase authority as all
other content; only ownership/publication policy differs.

The Supabase release/content spine, semantic RPCs, anonymous-first Save, and
server publication/access-control boundary are connected. A configured build
uses that repository exclusively. Browser persistence remains only as an
unconfigured test/development fallback and is never a second write target.

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
