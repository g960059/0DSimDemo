---
title: "Filling-limb artifact audit v1"
status: "Proposed"
claim_boundary: "diagnostic-only-no-model-change"
---

# Filling-limb artifact audit v1

## 1. Objective

Audit lower PV-loop limb roughness while the AV valves are open:

```text
LV: mitral valve open lower limb
RV: tricuspid valve open lower limb
```

This audit is diagnostic-only. It does not change model equations, solver
behavior, official case parameters, UI display smoothing, package scripts,
runtime wiring, or official morphology acceptance.

The future runner should inspect the canonical read-only official case ids:

```text
normal-sinus
acute-anterior-mi
systolic-heart-failure
lv-failure-dobutamine
```

## 2. Scope

The filling-limb audit uses the common phase labels from
[pv-loop-morphology-quality.md](pv-loop-morphology-quality.md), especially:

```text
filling
atrial-kick
transition
uncertain
```

The lower limb is defined by AV valve open and semilunar valve closed. The
report should split early filling, diastasis if detectable, atrial kick, and
event-adjacent transition windows. If the runner cannot split those subregions
reliably, it must report the missing evidence rather than inventing labels.

## 3. Required signals

Core LV/MV signals:

- `lvPressurePa`, `lvVolumeM3`
- `mitralValveOpen`, `mitralFlowM3PerSec`
- `aorticValveOpen`
- `leftAtrialPressurePa`
- optional `pulmonaryVenousPressurePa`

Core RV/TV signals:

- `rvPressurePa`, `rvVolumeM3`
- `tricuspidValveOpen`, `tricuspidFlowM3PerSec`
- `pulmonaryValveOpen`
- `rightAtrialPressurePa`
- optional `systemicVenousPressurePa`

Artifact-correlation signals:

- AV open/close event times or valve event ids;
- valve diode clamp hits, including per-valve `MV` and `TV` counts when
  available from `valveDiodeClampHits`;
- dynamic flow clamp hits and per-edge counts when available from
  `dynamicFlowClampHits`;
- qDot raw/post values, qDot clamp hit01, and qDot clamp impulse when available;
- `pressureFloorActive`, `pressureFloorHit01`, and `pressureFloorPressurePa`
  when available;
- AV-plane displacement/velocity proxies when available;
- reservoir-sleeve guard signals when that branch is enabled;
- atrial activation event id;
- solver substep count.

Optional signals are not required to exist in the current runtime. If absent,
the future runner should mark the corresponding classification evidence as
`unavailable`, not silently drop the classification category.

## 4. Metrics

Primary metrics:

- `openAvLowerLimbRoughness`
- `mvOpenLowerLimbRoughness`
- `tvOpenLowerLimbRoughness`
- `lowerLimbKinkCount`
- `lowerLimbMonotonicityViolationFraction`
- `eventCorrelationWindowHitFraction`
- `transitionDependenceRatio`
- `mvTvAsymmetryIndex`

Attribution metrics:

- `clampCoincidenceFraction`
- `valveDiodeClampHitFraction`
- `dynamicFlowClampHitFraction`
- `qDotClampHitFraction`
- `pressureFloorCoincidenceFraction`
- `atrialPressureCouplingScore`
- `venousPressureCouplingScore`
- `avPlaneCouplingScore`
- `flowChatterCount`
- `valveOpenCloseChatterCount`
- `samplingOnlyScore`

Every metric must be reported by chamber, valve, beat, sampling mode, and
transition policy. It must also carry `caseId` and `branchId` so multi-instance
official cases remain unambiguous. The runner must preserve both
`transition-inclusive` and `transition-excluded-core` values.

## 5. Classification labels

The audit may classify a finding as:

```text
filling-limb-artifact
mv-open-lower-limb
tv-open-lower-limb
event-correlated
clamp-correlated
valve-clamp-correlated
dynamic-flow-clamp-correlated
qdot-correlated
pressure-floor-correlated
av-plane-correlated
atrial-pressure-correlated
venous-pressure-correlated
fixed-volume-kink
fixed-phase-kink
sampling-only
transition-dominated
unclassified
```

These are diagnostic labels. They do not imply the correct fix. In particular,
`pressure-floor-correlated` does not authorize pressure-floor tuning, and
`clamp-correlated` does not authorize qDot clamp changes.

## 6. Event-correlation policy

The report should compute roughness and kink outlier samples first, then ask
whether those outliers fall inside configured windows around:

- AV valve open or close;
- qDot clamp activation or qDot discontinuity;
- pressure-floor activation or pressure pinning;
- atrial activation;
- solver substep discontinuities;
- AV-plane proxy extrema when available.

If an apparent artifact exists only in transition-inclusive metrics, classify it
as `transition-dominated`. If it persists in the transition-excluded core, keep
it as a core lower-limb finding and continue attribution.

## 7. Anti-gaming guards

The audit is specifically designed to avoid easy false improvement:

- do not change official case parameters;
- do not change valve thresholds, qDot clamp policy, pressure floors, solver
  settings, or model equations;
- do not smooth or decimate the primary pressure/volume/qDot/valve traces;
- do not report only transition-excluded values;
- do not classify an artifact as `sampling-only` unless raw event evidence is
  absent and sampling sensitivity is documented;
- do not use different formulas for MV/LV and TV/RV lower limbs.

The report must always carry output-suppression readouts: EDV, SV, CO, mean
LA/RA pressure, E/A-like inflow proxy, inlet forward volume, and inlet reverse
volume. A later candidate fix fails this audit if roughness improves by
collapsing EDV/SV/CO, increasing qDot/clamp events, or eliminating atrial kick.

## 8. Machine-readable artifact

```text
data/myocardium/protocols/filling-limb-artifact-audit-v1.json
```

The artifact uses `schemaVersion=1`, `status=proposed`, and
`claimBoundary=diagnostic-only-no-model-change`.
