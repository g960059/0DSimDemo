---
title: "Filling-limb diagnostic comparator v1"
status: "Proposed"
claim_boundary: "off-by-default-diagnostic-comparison-only"
---

# Filling-limb diagnostic comparator v1

## 1. Objective

This artifact contract defines an explicit-CLI comparator for existing
PV-loop morphology diagnostic output. It consumes `summary.json` and
`per-case-metrics.csv` from `tools/myocardium/verifyPvLoopMorphologyQuality.ts`
and writes a filling-limb comparison summary.

The comparator is off by default. It does not change ModelCore equations,
solver behavior, official cases, official-case parameters, default runtime
behavior, UI/runtime wiring, package scripts, or morphology-runner signal
availability.

## 2. Invocation

```bash
npx vite-node tools/myocardium/buildFillingLimbDiagnosticComparator.ts -- \
  --input=artifacts/myocardium/pv-loop-morphology/latest \
  --out=artifacts/myocardium/pv-loop-morphology/latest/filling-limb-diagnostic-comparator
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
- `filling-limb-comparator-groups.csv`
- `command.txt`

Each group is keyed by `caseId`, `branchId`, `beatIndex`, and `chamber`.
Within each group, the artifact records raw transition-excluded evidence, raw
transition-inclusive evidence, resampled evidence, classification labels, and
anti-gaming readout availability.

## 4. Interpretability Rule

A group is interpretable only when all of the following are true:

- required identity fields are present;
- raw transition-excluded filling-limb evidence exists before resampling;
- matched resampled filling-limb evidence exists;
- transition-inclusive and transition-excluded-core evidence both exist;
- all required anti-gaming readouts are available.

Missing readouts are reported as missing. The comparator must not infer qDot,
valve-diode, dynamic-flow, or atrial-booster readouts from unrelated pressure,
flow, or shape metrics.

## 5. Anti-Gaming Readouts

Required readouts:

- `endDiastolicVolumeM3`
- `strokeVolumeM3`
- `cardiacOutputM3PerSec`
- `meanLeftAtrialPressurePa`
- `meanRightAtrialPressurePa`
- `eaLikeInflowProxy`
- `inletForwardVolumeM3`
- `inletReverseVolumeM3`
- `qDotClampHitFraction`
- `valveDiodeClampHitFraction`
- `dynamicFlowClampHitFraction`
- `pressureFloorHitFraction`
- `atrialKickBoosterPreservation`

The current morphology runner does not emit every readout needed for a fully
interpretable group. That missingness is expected diagnostic output, not a
failure to be hidden.

## 6. Claim Boundary

This comparator output is diagnostic comparison evidence only. It makes no
acceptance decision for any root-cause candidate or remediation candidate.
Morphology acceptance, production adoption, default runtime adoption, and
official-case wiring are out of scope.

## 7. Machine-Readable Artifact

```text
data/myocardium/protocols/filling-limb-diagnostic-comparator-v1.json
```
