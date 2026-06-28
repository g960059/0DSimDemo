---
title: "Filling-limb correlation readiness boundary v1"
status: "Proposed"
claim_boundary: "filling-limb-correlation-readiness-only"
---

# Filling-limb correlation readiness boundary v1

## 1. Objective

This document defines a docs/data/verifier/test-only readiness boundary for a
future off-by-default filling-limb valve/qDot diagnostic comparator. It is not a
fix, not root-cause acceptance, and not an official morphology pass. It does
not change ModelCore equations, solver behavior, official cases, official-case
parameters, default runtime behavior, UI/runtime wiring, package scripts,
production validation, or `tools/myocardium/verifyPvLoopMorphologyQuality.ts`
signal availability.

The boundary is deliberately narrow. Current correlations are
supported-correlation only, medium confidence; they do not accept a root cause
or fix. Candidate fields alone must not promote root-cause or fix hypotheses.

## 2. Current evidence snapshot

The current evidence is recorded as historical non-acceptance context only.
It pins the runner-supported-correlation snapshot without depending on the
ignored artifact at runtime:

- base commit:
  `77d7cd7aa2ff4306a9a4841cb6c7d14d0f940251`
- runner command:
  `npx vite-node tools/myocardium/verifyPvLoopMorphologyQuality.ts --out=artifacts/myocardium/pv-loop-morphology/filling-limb-correlation-baseline-2026-06-28`
- summary artifact:
  `artifacts/myocardium/pv-loop-morphology/filling-limb-correlation-baseline-2026-06-28/summary.json`
- summary SHA-256:
  `7e570a3116eadd4d51c2a64af9f383a45475c64b2a7c0e1b39997a4a90046338`
- `scoringProfile.maxConfidence=medium`

Pinned `morphologyEvidence` observations:

- `filling-limb-roughness`, lane `filling-limb`, score `1`, supportCount 45,
  metric IDs `lowerLimbKinkCount`, `tvOpenLowerLimbRoughness`, and
  `valveOpenCloseChatterCount`
- `event-window-correlation`, lane `filling-limb`, score `1`, supportCount 42,
  metric ID `eventCorrelationWindowHitFraction`, labels `event-sensitive` and
  `event-window-correlation`

Pinned `morphologyEvidence` hypotheses:

- `filling-event-window-correlation`, lane `filling-limb`,
  `evidenceStatus=supported-correlation`, confidence `medium`, score `1`,
  observations `filling-limb-roughness` and `event-window-correlation`, with
  next evidence: off-by-default valve/qDot diagnostic comparator with unchanged
  official defaults
- `rv-filling-valve-chatter-correlation`, lane `filling-limb`,
  `evidenceStatus=supported-correlation`, confidence `medium`, score `1`,
  observation `filling-limb-roughness`, with next evidence: check TV marker
  density and add per-sample dynamic clamp evidence before changing valve
  dynamics

These facts are not an accepted root cause and are not fix acceptance. They
only preserve the starting context that future work must not inflate into an
acceptance claim.

## 3. Runtime boundary

A future comparator must remain off-by-default. It must use explicit diagnostic
invocation only, with no package script, no official-case/default wiring, no
production wiring, no UI/runtime wiring, and unchanged official defaults.

This readiness boundary forbids:

- implementation changes;
- default runtime changes;
- official-case changes;
- package script wiring;
- UI or production wiring;
- model equation changes;
- solver behavior changes;
- official case parameter changes;
- signal availability changes.

## 4. Future comparator evidence

Minimum future evidence must include:

- raw-before-resampled filling-limb evidence;
- comparative raw-vs-resampled evidence;
- transition-inclusive and transition-excluded-core evidence;
- same case/branch/beatIndex/chamber/samplingMode/transition policy identity;
- explicit chamber and beat identity for every comparator row;
- unchanged official defaults.

A candidate result is interpretable only when raw-before-resampled evidence,
comparative raw-vs-resampled evidence, and transition-inclusive plus
transition-excluded-core primary evidence point to the same effect under the
same case/branch/beatIndex/chamber/samplingMode/transition policy identity.
The E/A-like inflow proxy is the only anti-gaming readout exception: it may
source raw transition-inclusive `EAInflowProxy` because late A-wave inlet flow
can be partial-open transition evidence. This exception does not relax the
primary comparator evidence identity rule.

## 5. Anti-gaming readouts

Every future comparator result must carry these anti-gaming readouts:

- EDV / `endDiastolicVolumeM3`
- SV / `strokeVolumeM3`
- CO / `cardiacOutputM3PerSec`
- mean LA pressure / `meanLeftAtrialPressurePa`
- mean RA pressure / `meanRightAtrialPressurePa`
- E/A-like inflow proxy / `eaLikeInflowProxy`
- inlet forward volume / `inletForwardVolumeM3`
- inlet reverse volume / `inletReverseVolumeM3`
- qDot clamp hit fraction / `qDotClampHitFraction`
- valve diode clamp hit fraction / `valveDiodeClampHitFraction`
- dynamic flow clamp hit fraction / `dynamicFlowClampHitFraction`
- pressure floor hit fraction / `pressureFloorHitFraction`
- atrial kick/booster preservation / `atrialKickBoosterPreservation`

A future candidate fails this readiness boundary if morphology improves by
collapsing EDV, SV, CO, atrial pressure context, E/A-like inflow, inlet forward
volume, or atrial booster preservation; by creating reverse inlet volume; by
leaning on qDot, valve diode, dynamic flow clamp, or pressure floor hits; or by
showing improvement only in resampled views without raw-before-resampled
support.

## 6. Forbidden claims

Not accepted root cause.

Not production ready, not runtime ready, and not default ready.

Not an official morphology pass.

Not official-case ready.

Not valve/qDot fix accepted.

Not pressure-floor tuning accepted.

Not smoothing accepted.

This boundary also does not authorize model equation changes, solver changes,
official-case parameter changes, official-case/default wiring, production
validation, or package-script wiring.

## 7. Machine-readable artifact

```text
data/myocardium/protocols/filling-limb-correlation-readiness-v1.json
```

The artifact uses `schemaVersion=1`, `status=proposed`, and
`claimBoundary=filling-limb-correlation-readiness-only`.
