# ADR-MYO-003: MechanicsCore2 / CircAdapt-lite Sidecar

Status: accepted for user-0 sidecar experiments

## Context

The `ModelCore + Land boundary-contract patch` lane has exhausted the cheap
patch surfaces. Strict morphology V1.1 still rejects LV/RV PV dome and AV
inflow artifacts after pressure-flow, source-pressure, work-conjugate pressure,
semilunar, substep, and accepted-volume smoke screens.

The next work moves to an isolated `MechanicsCore2` sidecar. CircAdapt informs
the architecture, but no CircAdapt source code or runtime dependency is copied.

## Decision

Start `MechanicsCore2` with a gated fail-fast path:

1. Prescribed-length `HillSeriesFiberV1` replay gate.
2. OneFiberChamber prescribed-volume bench only if the replay gate passes.
3. Left-heart closed-loop strategic gate before any full four-chamber work.

The first active law is `HillSeriesFiberV1`, not Land. The public activation
state is `a`, a mechanical activation state. It is not calcium and not a
crossbridge-density claim.

The initial replay fixture pack is procedural. It is used to lock schema,
hidden-clamp metrics, and gate behavior before importing runtime-extracted or
external qualitative traces.

## Non-Goals

- Runtime/default adoption.
- Clinical validation.
- CircAdapt equivalence.
- LandAtrial tuning unlock.
- Another ModelCore boundary patch sweep.

## Required QA

- Strict morphology V1.1 remains the gross artifact guard.
- Owner visual review remains required for closed-loop strategic gates.
- Hidden-clamp metrics must prevent `lSe` from absorbing all deformation.
- New diagnostics are disposable unless they protect a forward invariant.
