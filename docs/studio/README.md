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
| [DESIGN-STUDIO-002-cell-document-architecture.md](DESIGN-STUDIO-002-cell-document-architecture.md) | Reviewed complete target; implementation readiness is gated by §19 |
| [STUDIO-V1-TARGET-ARCHITECTURE.md](STUDIO-V1-TARGET-ARCHITECTURE.md) | Implementation digest; the complete design above is authoritative |
| [specs/STUDIO-RUNTIME-001-foundation-vertical-slice.md](specs/STUDIO-RUNTIME-001-foundation-vertical-slice.md) | Active implementation contract for the first vertical slice |

## Superseded planning

The v0.1 mock-first ADR and roadmap were removed from the working tree. They
remain at base commit `efb85f281db20df632b471e3d0d59d9667cbe475` for
archaeology and no longer constrain implementation.

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
