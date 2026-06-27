---
title: "ADR-MYO-002 — Phase 6 atrial bridge selection"
status: "Proposed"
date: "2026-06-27"
repository: "g960059/0DSimDemo"
supersedes: "ADR-MYO-001 clean atrial elastance bridge assumption"
related:
  - "docs/myocardium/adr/ADR-MYO-001.md"
  - "docs/myocardium/model-spec/atrial-bridge-v1.md"
  - "docs/myocardium/verification/atrial-bridge-v1-verification.md"
  - "docs/myocardium/roadmap/atrial-bridge-shootout-roadmap.md"
---

# ADR-MYO-002 — Phase 6 atrial bridge selection

## Context

ADR-MYO-001 currently plans Phase 6 as:

```text
LV/RV: new Land-based myocardium
LA/RA: clean atrial elastance bridge
```

Subsequent model review and observed behavior show that the current time-varying atrial elastance can produce non-physiologic pressure oscillations and uneven PV loops. In contrast, the existing RA/LA active-stress implementation can produce a comparatively smooth figure-eight atrial PV loop. This does not make the legacy atrial active-stress model the final scientific model, but it means a time-fixed elastance bridge must not be promoted to the Phase 6 default without validation.

The immediate goal of Phase 6 is to evaluate LV/RV Land integration. A poor atrial bridge would contaminate preload, venous pressure, AV-valve flow, qDot/clamp diagnostics, and the ventricular morphology gate. Therefore atrial bridge choice must become an explicit gate before closed-loop LV/RV interpretation.

## Decision

1. Do not assume that a time-varying elastance model is an acceptable atrial bridge.
2. Insert **Phase 5.5 — Atrial bridge shootout** before Phase 6.
3. Evaluate at least three atrial bridge candidates:

```text
E0: atrial-elastance-negative-control-v0
A0: legacy-atrial-active-bridge-v0
A1: atrial-reservoir-booster-bridge-v1
```

4. Use the selected bridge in Phase 6 only after it passes the atrial-bridge verification gate.
5. Treat time-varying elastance as a negative control, not as the default bridge.
6. Treat legacy atrial active-stress as a quarantined comparator and conditional fallback, not as runtime backward compatibility.
7. Introduce `AtrialReservoirBoosterBridgeV1` as the preferred bridge candidate:

```text
P_A = P_passive(V_A)
    + P_viscous(dV_A/dt)
    + P_booster(x_A, V_A)
    + P_external
```

8. Keep Land/RDQ atrial myofilament models as later research phases. They should be judged against the frozen legacy atrial-active baseline and the reservoir-booster bridge, not adopted merely because they are more mechanistic.
9. Phase 6 is renamed conceptually from:

```text
LV/RV closed loop with clean atrial elastance bridge
```

to:

```text
LV/RV closed loop with validated atrial bridge
```

## Candidate semantics

### E0 — atrial-elastance-negative-control-v0

Use for comparison only. It may demonstrate the failure mode of time-fixed elastance when AV-valve events and venous return are not phase-aligned with the imposed elastance curve.

### A0 — legacy-atrial-active-bridge-v0

Allowed only as a quarantined comparator or temporary fallback.

Constraints:

- LA/RA only.
- Frozen parameters.
- No LV/RV legacy active-stress.
- No old knob semantics.
- No official final physiological claim.
- Provenance must state `legacyComparator=true`.
- Must remain replaceable by A1/Land/RDQ atrial models.

### A1 — atrial-reservoir-booster-bridge-v1

Preferred Phase 6 bridge candidate.

Responsibilities:

- passive reservoir pressure
- conduit/flow damping
- stateful booster contraction
- external pressure coupling
- smooth atrial PV loop support
- explicit limitation statement: not a Land/RDQ atrial myofilament model

## Acceptance

A bridge can be selected for Phase 6 only if it passes `Tier F0 — atrial bridge shootout` in `docs/myocardium/verification/atrial-bridge-v1-verification.md`.

Minimum criteria:

- smooth LA/RA PV loop compared with E0
- no increase in qDot/valve event contamination
- stable LV/RV preload support
- beat-to-beat repeatability
- plausible a/v wave timing
- plausible reservoir/conduit/booster separation
- no silent clamp/projection
- provenance and claim-boundary metadata present

## Consequences

- Phase 6 cannot rely on a time-varying elastance bridge by assumption.
- A new Phase 5.5 data artifact and verification script are required.
- Legacy atrial active-stress is not deleted before it is measured and archived as a comparator.
- Current docs that mention `clean atrial elastance bridge` should be interpreted as superseded by this ADR once accepted.
- Mechanistic atrial Land/RDQ remains future work; this ADR does not implement atrial Land/RDQ.
