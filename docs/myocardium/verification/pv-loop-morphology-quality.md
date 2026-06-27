---
title: "PV-loop morphology quality v1 - diagnostic audit"
status: "Proposed"
claim_boundary: "diagnostic-only-no-model-change"
---

# PV-loop morphology quality v1

## 1. Objective

Define the common LV/RV PV-loop phase segmentation and morphology-quality
readouts used by the filling-limb and arterial-load audits.

This audit contract was established as a docs/data-only diagnostic plan. The
runner implementation remains tooling-only: it does not change model equations,
solver behavior, official case parameters, UI display smoothing, package
scripts, runtime wiring, or official morphology acceptance.

The runner should use the canonical official case ids below as read-only
diagnostic subjects:

```text
normal-sinus
acute-anterior-mi
systolic-heart-failure
lv-failure-dobutamine
```

Those ids identify the cases to inspect. They are not permission to re-author
case parameters or to add official-case wiring.

## 2. Runner entrypoint

The diagnostic runner is invoked directly rather than through a package script:

```bash
npx vite-node tools/myocardium/verifyPvLoopMorphologyQuality.ts
```

By default it writes the following files under
`artifacts/myocardium/pv-loop-morphology/<timestamp>/`:

```text
summary.md
summary.json
per-case-metrics.csv
per-beat-phase-samples.csv
valve-event-markers.csv
clamp-event-markers.csv
command.txt
traces/*.csv
```

Use `--out=DIR` for a stable artifact directory and `--cases=id,id` for focused
debugging.

## 3. Common phase labels

Each beat and chamber uses the same labels:

```text
filling
atrial-kick
isovolumic-contraction
ejection
isovolumic-relaxation
transition
uncertain
```

The labels are diagnostic bins, not new model states. Valve-state evidence is
primary when available; pressure and volume derivatives are supporting evidence
or fallback. Event-adjacent samples belong in `transition` before they are used
for core phase metrics. Missing, contradictory, or non-finite evidence belongs
in `uncertain`, not in a forced physiologic phase.

LV inputs:

- `lvPressurePa`, `lvVolumeM3`
- `mitralValveOpen`, `aorticValveOpen`
- `mitralFlowM3PerSec`, `aorticFlowM3PerSec`
- `leftAtrialPressurePa`, `aorticPressurePa`

RV inputs:

- `rvPressurePa`, `rvVolumeM3`
- `tricuspidValveOpen`, `pulmonaryValveOpen`
- `tricuspidFlowM3PerSec`, `pulmonaryFlowM3PerSec`
- `rightAtrialPressurePa`, `pulmonaryArteryPressurePa`

Common inputs include `timeSec`, `dtSec`, and `beatIndex`. Recommended
artifact-correlation fields include valve event ids, qDot, qDot clamp state,
pressure-floor state, active stress, activation events, and solver substep
counts.

The normalized names above are the runner contract. Current ModelCore
evidence should be mapped without changing runtime semantics. Useful current
aliases include `xiMV`, `xiAoV`, `xiTV`, `xiPV`, `QMV`, `QAo`, `QTV`, `QPV`,
`LVPressureFloorHit01`, `RVPressureFloorHit01`, and valve-prefixed qDot
diagnostics such as `MV_qDotRaw`, `AoV_qDotPost`, `TV_qDotClampHit01`,
`PV_qDotClampImpulse`, `*_diodeImpulse`, and `*_flowClampImpulse`. The
runner-derived `perSampleValveDiodeClampHits` and
`perSampleDynamicFlowClampHits` markers are last-step sample readouts derived
from emitted valve impulse fields; they are separate from cumulative
`debugClampDiagnostics()` counters such as `dynamicFlowClampHits` and
`valveDiodeClampHits`.

The per-sample phase artifact should include pressure, volume,
`caseId`, `branchId`, `dPressurePaPerSec`, `dVolumeM3PerSec`, inlet/outlet
valve open01 values, and inlet/outlet flow values. `branchId` identifies the
official-case instance or comparator branch inside multi-instance cases such as
`acute-anterior-mi` and `lv-failure-dobutamine`. The derivative method is not
prescribed here, but the runner must record the stencil and units it used.

## 4. Transition reporting policy

Every primary morphology metric must be reported twice:

```text
transition-inclusive
transition-excluded-core
```

The report must also include `transitionSampleFraction` and
`uncertainSampleFraction` per beat and chamber. If a conclusion changes when
transition samples are excluded, classify it as `event-sensitive` or
`sampling-sensitive` rather than as a stable morphology finding.

This policy prevents valve-event artifacts from being hidden by a single smooth
summary number and prevents aggressive transition-window widening from making a
problem disappear without being visible in the report.

## 5. Required common readouts

The runner emits:

- phase coverage fraction for each label;
- transition and uncertain sample fractions;
- signed PV-loop area;
- phase-normalized roughness;
- phase kink count;
- sampling-invariance delta across raw and resampled modes;
- event-correlation hit fraction;
- LV/RV asymmetry index for paired metrics.

Exact derivative stencils and robust thresholds are runner details, but the
runner must record them in the output artifact. Raw-sample metrics are
mandatory. Resampled metrics are sensitivity reports only.

## 6. Sampling modes

The common sampling modes are:

```text
raw
uniformBeatGrid
eventAlignedCore
coarseSensitivity
```

`raw` preserves emitted samples. `uniformBeatGrid` and `coarseSensitivity`
expose derivative and sampling sensitivity. `eventAlignedCore` excludes the
configured transition guard windows so the report can separate core morphology
from valve-event artifacts.

## 7. Guardrails

The guardrails are intentionally stronger than the metrics:

- no model-equation, solver, official-case-parameter, package-script, or UI
  display-smoothing change;
- no raw artifact deletion or smoothing before metric computation;
- no LV/RV formula divergence without a missing-signal exception;
- no single-metric pass/fail claim;
- no conversion of this diagnostic plan into official morphology acceptance;
- input artifact hashes and signal availability must be recorded before metric
  computation.

## 8. Machine-readable artifacts

```text
data/myocardium/protocols/pv-loop-morphology-quality-v1.json
data/myocardium/targets/pv-loop-morphology-quality-v1.json
```

Both artifacts use `schemaVersion=1`, `status=proposed`, and
`claimBoundary=diagnostic-only-no-model-change`.

The tooling-only runner for this contract is implemented at
`tools/myocardium/verifyPvLoopMorphologyQuality.ts`. It consumes the artifacts
above as read-only inputs, records their hashes in `summary.json`, and emits
diagnostic evidence without changing model equations, solver behavior, official
case parameters, package scripts, runtime wiring, UI smoothing, or official
morphology acceptance.
