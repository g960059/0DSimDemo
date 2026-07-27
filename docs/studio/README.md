# CircleHeart Studio

Status: active greenfield application lane

Studio is the presentation and product layer built on the existing
host-neutral Model Platform under `engine/scientific`. It owns projects,
experiments, documents, session orchestration, certification policy,
publication, and user-facing presentation. It does not own model equations or
solver internals.

## Canonical documents

| Document | Classification |
|---|---|
| [DESIGN-STUDIO-002-cell-document-architecture.md](DESIGN-STUDIO-002-cell-document-architecture.md) | Authoritative target and decisions; remaining companion specifications are tracked in §19 |
| [STUDIO-V1-TARGET-ARCHITECTURE.md](STUDIO-V1-TARGET-ARCHITECTURE.md) | Implementation digest; the complete design above is authoritative |
| [specs/STUDIO-RUNTIME-001-foundation-vertical-slice.md](specs/STUDIO-RUNTIME-001-foundation-vertical-slice.md) | Implemented headless runtime contract for the first vertical slice |
| [specs/STUDIO-RUNTIME-002-product-workbench-bridge.md](specs/STUDIO-RUNTIME-002-product-workbench-bridge.md) | Implemented bridge from the Studio runtime into the existing product Workbench |
| [specs/STUDIO-CONTENT-001-reader-preview-vertical-slice.md](specs/STUDIO-CONTENT-001-reader-preview-vertical-slice.md) | Implemented session-only Author → Reader Preview slice and its explicit non-publication boundary |

## Current implementation boundary

The repository contains the Studio v1 contracts, coordinator,
content-addressed JSON artifact store, exact MainWire V4 snapshot envelope,
target resolver, Worker host, MainWire runtime adapter, and an initial product
Workbench bridge. That bridge opens from one settled seed point, streams live
data at 1× (its ceiling, with degraded pacing reported when compute cannot
sustain it), starts live and strict work automatically for every committed
parameter intent, discards superseded generations internally, and exposes
explicit steady-candidate promotion and pinning.

The first greenfield Author → Reader Preview slice is also present. It
materializes a detached `draft-preview-uncertified`, session-only preview
manifest containing a publication-neutral resolved document plus external
preview runtime bindings. It renders that document through the shared Reader
seam, starts its experiment from one point at 1× or, when compute cannot sustain it, at a reported degraded pace, and keeps Reader
controls revision-neutral. It supports one placement and one scenario only.
Its preview-bootstrap refs are not certification or publication lineage.

These are real browser product slices, but they are not the final Reader,
Study Lab, or Document Editor. The Workbench bridge deliberately reuses its
existing shell and some legacy presentation DTOs and controller-store shapes.
It also creates one Studio session per presented scenario; it does not yet
implement the target single aggregate `SimulationSession` with N branches and
atomic multi-scenario intent. V&V reports, Guyton/load-series analysis, and
advanced PV relation/load-series analysis are explicitly unavailable rather
than falling back to the old numerical path.

Viewport scheduling, target Reset semantics, browser performance
qualification, durable authoring, certification, publication, and the complete
product contexts remain target work. The exact implemented and unsupported
boundaries are recorded in STUDIO-RUNTIME-002 and STUDIO-CONTENT-001.

## Superseded planning

The v0.1 mock-first ADR and roadmap were removed from the working tree. They
remain at base commit `efb85f281db20df632b471e3d0d59d9667cbe475` for
archaeology and no longer constrain implementation. Studio v1 has no
backward-compatible reader, dual write, or migration layer.

## Dependency rule

```text
Studio presentation
  → Studio application
    → Studio contracts and ports
      → Model Platform adapter
        → engine/scientific
```

New Studio domain code must not import React, Firebase, `ModelCore`, preview
controllers, or legacy case persistence. Engine-specific imports are confined
to adapters.
