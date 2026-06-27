---
title: "Phase 2B / Level 3 review deltas"
status: "Proposed"
date: "2026-06-27"
related_pr: 166
---

# Phase 2B / Level 3 review deltas

This note records the plan changes accepted from the recent Phase 2B / Level 3 review. It is docs/data-only and does not change runtime behavior.

## 1. Phase 2B mechanistic report fields

Phase 2B isometric Ca+Land reports must include:

```text
fixedFiberEngineeringStrain
lambda
h(lambda)
diastolicCaUM
targetPeakAmplitudeUM
targetAbsolutePeakCaUM
measuredPeakCaUM
caPeakTimeMs
stressPeakTimeMs
caToStressPeakDelayMs
CaT50AtFixedStrainUM
CaAtStressPeakUM
```

Clarification:

```text
peakAmplitudeUM=0.9 is amplitude above diastolic Ca, not absolute peak Ca.
With diastolic Ca=0.12 uM, targetAbsolutePeakCaUM≈1.02 uM.
A measured peak near 1.016 uM is close to the absolute target and must not be interpreted as a 13% overshoot.
```

Machine-readable artifact:

```text
data/myocardium/protocols/phase2b-mechanistic-report-fields-v1.json
```

## 2. Level 3 source-stress transfer entry gate

Phase 2B source twitch is encouraging:

```text
FWHM ≈ 234 ms
TTP ≈ 187 ms
Ca peak ≈ 94 ms
stress peak ≈ 187 ms
source stress peak ≈ 37 kPa
```

But Level 3 must verify that source stress transfers to chamber-realized stress and pressure scale without hidden gains:

```text
source stress around 37 kPa
→ chamber-realized stress expected around 10–16 kPa
→ approximately 120 mmHg-class loaded morphology
```

No Level 3 pass may rely on:

- Tref rescaling;
- free homogenization gain;
- geomChi-like pressure gain;
- arbitrary tension filter;
- morphology-only viscosity.

Machine-readable artifact:

```text
data/myocardium/protocols/level3-source-stress-transfer-gate-v1.json
```

## 3. Land absolute-scale check

Before calibration can hide scale errors, compare the Phase 2B source twitch peak against the Land 2017 intact-human reference/expected scale at the same lambda/Ca condition.

Purpose:

- catch nominal/Cauchy mistakes;
- catch missing constant factors;
- catch source-to-wall or homogenization errors;
- prevent pressure morphology fitting from hiding a source scale error.

## 4. Layer-consistency gate

The following metrics must be re-reported across layers:

```text
FWHM
time-to-peak
relaxation tau
Ca-to-stress peak delay
peak stress
work / pressure morphology
```

Layers:

```text
Phase 2B isometric source stress
→ Level 3 minimal loaded chamber
→ production single chamber
→ partitioned coupling
→ closed-loop integration
```

Goal: detect cases where coupling, afterload, or velocity feedback destroys the Level 2 mechanism.

Machine-readable artifact:

```text
data/myocardium/protocols/layer-consistency-and-alternans-policy-v1.json
```

## 5. Alternans policy

- Reproduce legacy activeStress alternans under a fixed protocol.
- Run new myocardium under the same protocol.
- Do not treat alternans disappearance as robust based on BE alone.
- SDIRK2 or an equivalent second-order reference must exist before final no-alternans interpretation.

BE-only disappearance may be reported as smoke evidence only.

## 6. Atrial bridge cross-reference

ADR-MYO-002 now supersedes the unqualified Phase 6 assumption that LA/RA should use a clean time-varying elastance bridge. Primary README and roadmap should direct readers to ADR-MYO-002 before Phase 6 planning.
