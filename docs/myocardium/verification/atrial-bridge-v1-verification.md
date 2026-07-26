---
title: "Atrial bridge v1 — Verification and shootout plan"
status: "Proposed"
date: "2026-06-27"
source_adr: "../adr/ADR-MYO-002-atrial-bridge.md"
---

# Atrial bridge v1 — Verification and shootout plan


> **Some paths below are retired.** This document names tools, tests, and
> artifacts from lanes that were removed from the working tree. They are
> recoverable from git history (`git show <commit>:<path>`); do not read
> them as commands you can run today.

## 1. Objective

Select a Phase 6 atrial bridge that supports LV/RV Land closed-loop evaluation without introducing non-physiologic atrial PV loops, pressure oscillations, preload artifacts, or valve/qDot contamination.

The bridge shootout is not an atrial myofilament validation. It is a gating test for temporary LV/RV closed-loop support.

## 2. Candidate set

```text
E0: atrial-elastance-negative-control-v0
A0: legacy-atrial-active-bridge-v0
A1: atrial-reservoir-booster-bridge-v1
```

A1 is the preferred new bridge candidate. A0 is a comparator/fallback. E0 is a negative control.

## 3. Tier F0 — atrial bridge shootout

Tier F0 is inserted before the current closed-loop Tier F.

```text
Tier E: solver comparison
Tier F0: atrial bridge shootout
Tier F: LV/RV closed loop with selected atrial bridge
```

## 4. Protocols

### 4.1 Isolated LA protocol

Inputs:

- prescribed pulmonary venous pressure/flow family;
- prescribed LV pressure or mitral-valve pressure boundary;
- LA activation event schedule;
- no LV/RV Land state dependency.

Readouts:

- mean LA pressure;
- a/v wave timing;
- PV loop smoothness;
- booster pressure fraction;
- venous-to-mitral flow timing;
- dP/dt spike count.

### 4.2 Isolated RA protocol

Inputs:

- prescribed systemic venous pressure/flow family;
- prescribed RV pressure or tricuspid-valve pressure boundary;
- RA activation event schedule.

Readouts mirror LA protocol.

### 4.3 Paired filling protocol

```text
LA + LV filling-only
RA + RV filling-only
```

Use a prescribed ventricular compliance/relaxation boundary. Do not use full Land closed-loop yet.

Readouts:

- E/A-like inflow proxy;
- ventricular preload stability;
- atrial pressure oscillation;
- AV-valve event contamination.

### 4.4 Full closed-loop smoke

Run each candidate in a short closed-loop smoke set:

```text
normal
preload low
preload high
HR high
```

The ventricular side must be fixed and identical across bridge candidates. Until LV/RV Land is validated for this purpose, this smoke test should use a prescribed or previously accepted ventricular boundary/fixture rather than an unvalidated Land closed-loop state. This prevents the atrial bridge shootout from reintroducing the LV/RV interaction confounder that Tier F0 is intended to remove.

No candidate receives special tuning not allowed by its provenance.

## 5. Metrics

### 5.1 PV loop roughness

A provisional roughness metric may be:

```text
PVLoopRoughness = integral(abs(d2P/dV2)) / (integral(abs(dP/dV)) + epsilon)
```

Implementation may use a numerically stable discrete approximation. The exact formula must be recorded in the target pack.

Because this metric uses a curvature-like quantity, it is sampling-sensitive. The verification script must compute it under at least two sampling rates or resampling grids and report whether candidate ordering is preserved. A candidate cannot be selected solely from a roughness advantage that disappears under the configured sampling-invariance check.

### 5.2 Pressure high-frequency energy

Compute the fraction of beat-aligned atrial pressure energy above a configured frequency band after beat alignment.

This detects the observed failure mode where time-varying elastance produces pressure wobble or jagged PV loops.

### 5.3 A-loop and V-loop metrics

At minimum:

- A-loop area proxy;
- V-loop area proxy;
- A/V loop ratio;
- sign/orientation sanity check;
- loop self-intersection / kink count.

The metrics do not need to be perfect clinical measurements in v1, but they must be deterministic and applied consistently to all candidates.

A smooth bridge is not necessarily a good bridge. A-loop or booster contribution lower bounds must accompany roughness metrics so that an over-damped candidate cannot win by suppressing the atrial kick. The target pack should record either absolute lower bounds or a comparator-based rule relative to A0.

### 5.4 Valve and qDot contamination

Report:

- AV-valve open/close timing;
- qDot clamp hit fraction;
- reverse flow volume;
- event-surface crossings;
- closure residual in clean windows.

A candidate that looks smooth only by increasing clamp or valve-event contamination fails.

## 6. Selection rules

### PASS for Phase 6 selection

A candidate can be selected when it satisfies all of:

- PV roughness is no worse than A0 or passes a predeclared absolute smoothness target; merely being better than E0 is not enough;
- PV roughness candidate ranking is stable under the configured sampling-invariance check;
- A-loop/booster contribution is not suppressed below the configured lower bound;
- no worse LV/RV preload stability than A0;
- no increase in qDot/valve contamination vs A0;
- beat-to-beat repeatability in all smoke protocols;
- finite state and no silent clamp/projection;
- plausible reservoir/conduit/booster separation;
- provenance and claim-boundary metadata present.

### CONDITIONAL FALLBACK

A0 may be used as temporary fallback only when:

- A1 does not pass;
- A0 clearly outperforms E0;
- owner accepts `legacyComparator=true` provenance;
- Phase 7 replacement remains planned.

### FAIL

E0 cannot be selected by default if it shows any of:

- jagged PV loop;
- high pressure high-frequency energy;
- beat-to-beat preload instability;
- valve/qDot contamination;
- poor a/v wave timing.

Any A1-like candidate also fails if its apparent smoothness is achieved primarily by overdamping and loss of booster/A-loop structure.

## 7. Required artifacts

```text
data/myocardium/protocols/atrial-bridge-shootout-phase5p5-protocols.json
data/myocardium/targets/atrial-bridge-targets-v1.json
data/myocardium/decisions/atrial-bridge-decision21-phase6-selection-v1.json
```

The decision artifact remains `PENDING_OWNER` until the shootout is run.

## 8. Script expectation

Future implementation should add:

```text
npm run verify:myocardium-atrial-bridge-shootout
```

The script should emit:

- per-candidate metrics;
- per-protocol pass/fail;
- sampling-invariance results for roughness metrics;
- booster/A-loop lower-bound results;
- provenance;
- recommendation only, not automatic owner selection.

## 9. Claim boundary

Passing Tier F0 means only:

```text
candidate is acceptable as a temporary atrial bridge for LV/RV Land closed-loop evaluation
```

It does not mean:

- atrial Land/RDQ validated;
- AF/atrial myopathy validated;
- atrial SR calcium cycling validated;
- regional atrial disease validated.

## 10. Forward-compatible AF substrate note

The reservoir/conduit/booster decomposition is intentionally compatible with future AF work, because loss of atrial kick can be represented by disabling or attenuating the booster component while preserving reservoir and conduit behavior. This is a structural benefit only. It is not an AF validation claim.
