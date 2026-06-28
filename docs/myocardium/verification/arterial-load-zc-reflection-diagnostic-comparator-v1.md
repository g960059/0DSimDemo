---
title: "Arterial-load Zc/reflection diagnostic comparator v1"
status: "Proposed"
claim_boundary: "off-by-default-diagnostic-comparison-only"
---

# Arterial-load Zc/reflection diagnostic comparator v1

## 1. Objective

This artifact contract defines an explicit-CLI comparator for existing
PV-loop morphology diagnostic output. It consumes `summary.json` and
`per-case-metrics.csv` from `tools/myocardium/verifyPvLoopMorphologyQuality.ts`
and writes an arterial-load ejection-limb comparison summary.

The comparator is diagnostic-only and off by default. It does not change
ModelCore equations, solver behavior, official cases, official-case
parameters, default runtime behavior, UI/runtime wiring, package scripts, or
morphology-runner signal availability. It is not a root-cause acceptance, fix
acceptance, morphology acceptance, production validation, or runtime adoption
claim.

## 2. Invocation

```bash
npx vite-node tools/myocardium/buildArterialLoadZcReflectionDiagnosticComparator.ts -- \
  --input=artifacts/myocardium/pv-loop-morphology/latest \
  --out=artifacts/myocardium/pv-loop-morphology/latest/arterial-load-zc-reflection-diagnostic-comparator
```

No `package.json` script is added for this command. The explicit invocation is
part of the diagnostic boundary.

## 3. Inputs And Outputs

Inputs:

- `summary.json`
- `per-case-metrics.csv`

Outputs:

- `summary.json`
- `summary.md`
- `arterial-load-zc-reflection-comparator-groups.csv`
- `command.txt`

Each group is keyed by `caseId`, `branchId`, `beatIndex`, and chamber (`LV` or
`RV`). Within each group, the artifact records raw transition-excluded
ejection evidence, raw transition-inclusive evidence, resampled evidence,
classification labels, explicit missing/no-proxy Zc/reflection records, and
anti-gaming readout availability.

## 4. Primary Ejection Evidence

Primary ejection metrics:

- `semilunarOpenEjectionSquareness`
- `ejectionPlateauFraction`
- `ejectionTopCurvature`
- `cornerSharpnessAtOpen`
- `cornerSharpnessAtClose`
- `incisuraPresenceScore`
- `arterialPressureIncisuraDepth`
- `peakPressureTimingAsFractionOfEjection`
- `eventCorrelationWindowHitFraction`, when emitted

A raw-core row means `samplingMode=raw` and
`transitionPolicy=transition-excluded-core`. Resampled evidence must include
matched `uniformBeatGrid`, `eventAlignedCore`, and `coarseSensitivity` rows.

## 5. Interpretability Rule

A group is interpretable only when all of the following are true:

- required identity fields are present;
- raw transition-excluded ejection evidence exists before resampling;
- matched resampled ejection evidence exists for all required resampled modes;
- transition-inclusive and transition-excluded-core evidence both exist;
- explicit missing/no-proxy records are present for every unavailable
  Zc/reflection signal;
- all required anti-gaming readouts are available from raw-core rows.

Missing readouts are reported as missing. The comparator must not infer
`characteristicImpedancePaSecPerM3`, `arterialReflectionCoefficient`, or
`arterialReflectionDelaySec` from resistance, inertance, compliance, pressure,
flow, root compliance, or waveform shape. Those unavailable signals remain
missing/no-proxy records and must not promote hypotheses.

## 6. Anti-Gaming Readouts

Required readouts:

- `strokeVolumeM3`
- `cardiacOutputM3PerSec`
- `strokeWorkJ`
- `peakPressurePa`
- `ejectionDurationSec`
- `semilunarForwardVolumeM3`
- `semilunarReverseVolumeM3`
- `qDotClampHitFraction`
- `valveDiodeClampHitFraction`
- `dynamicFlowClampHitFraction`

Conversions are fixed at artifact build time: mL to m3, L/min to m3/s, and
mmHg to Pa. `strokeWork` is already emitted in J. The comparator must assert
the source unit before converting a readout; a unit mismatch is reported as a
missing readout, not silently converted.

`ejectionDurationSec` is the observed ejection-core sample span from raw-core
diagnostic rows. It is not a physiologic semilunar valve-open duration claim.
Older morphology artifacts may not emit every readout needed for a fully
interpretable group; missingness remains expected diagnostic output, not a
value to fill by proxy.

## 7. Readiness Boundary Reference

This comparator treats
`arterial-load-zc-reflection-comparator-v1` as a future readiness reference
only. It does not satisfy that future boundary and does not claim that Zc or
reflection signals are modeled.

## 8. Machine-Readable Artifact

```text
data/myocardium/protocols/arterial-load-zc-reflection-diagnostic-comparator-v1.json
```
