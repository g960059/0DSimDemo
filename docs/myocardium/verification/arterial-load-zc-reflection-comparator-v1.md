---
title: "Arterial-load Zc/reflection comparator readiness boundary v1"
status: "Proposed"
claim_boundary: "zc-reflection-comparator-readiness-only"
---

# Arterial-load Zc/reflection comparator readiness boundary v1

## 1. Objective

This document defines a future off-by-default readiness boundary for an
arterial-load Zc/reflection comparator. It is not the comparator implementation.
It does not change ModelCore equations, solver behavior, official cases,
default runtime behavior, UI/runtime wiring, package scripts, or
`tools/myocardium/verifyPvLoopMorphologyQuality.ts` signal availability.

The boundary is deliberately narrow: a future comparator may only become
interpretable when it reports comparative raw-vs-resampled morphology evidence
and the anti-gaming readouts listed below. Candidate fields alone must not
promote arterial-load hypotheses.

## 2. Current PR #181-base evidence snapshot

The current evidence is recorded as historical non-acceptance context only:

- max raw-core squareness `0.328 < 0.55`
- max raw-core plateau `0.229 < 0.45`
- min raw-core incisura score `0.188 > 0.1`
- the PR #181-base runner snapshot emits no
  `arterial-load-structure-hypothesis`; it carries only the
  `ejection-limb-arterial-load-signal-gap` handoff for Zc/reflection
- provenance: base commit
  `543b74434bbb42de629cccb760153ddcc06407ee`, runner command
  `npx vite-node tools/myocardium/verifyPvLoopMorphologyQuality.ts --out=artifacts/myocardium/pv-loop-morphology/zc-reflection-baseline-2026-06-28`,
  summary artifact
  `artifacts/myocardium/pv-loop-morphology/zc-reflection-baseline-2026-06-28/summary.json`,
  summary SHA-256
  `0c6c3c52a7799f8df712b76de4a3be0399089c251a4ed4e389a7353e78dcb1e4`

These values do not prove comparator validity, acceptance, production
readiness, or official-case readiness. They only preserve the starting context
that future work must not inflate into an acceptance claim.

## 3. No-proxy runtime boundary

Current runtime Zc/reflection signals are unavailable/no-proxy:

- `characteristicImpedancePaSecPerM3` is unavailable/no-proxy
- `arterialReflectionCoefficient` is unavailable/no-proxy
- `arterialReflectionDelaySec` is unavailable/no-proxy

Do not infer those values from resistance, inertance, compliance, pressure,
flow, root compliance, or waveform shape. Future candidate fields alone must
not promote hypotheses. Only comparative raw-vs-resampled metrics plus
anti-gaming readouts can make a future comparator interpretable.

## 4. Future comparator requirements

A future comparator must remain off-by-default. It must not be wired into
official cases, default runtime paths, package scripts, production validation,
or accepted morphology outcomes.

Minimum future evidence:

- raw-core metrics before any interpolation, smoothing, or resampling;
- matched resampled/event-aligned sensitivity metrics;
- transition-inclusive and transition-excluded-core readouts;
- per-case/per-branch/per-beat chamber and arterial-bed identity;
- explicit missing-signal records for unavailable Zc/reflection signals;
- anti-gaming output/work/pressure/duration/reverse-flow/clamp readouts.

Future candidate fields alone must not promote hypotheses. A finding becomes
interpretable only when raw and resampled metrics agree enough to localize the
effect and the anti-gaming readouts show that the apparent improvement was not
created by suppressing output, work, pressure, duration, or flow.

## 5. Anti-gaming outputs

Every future comparator result must carry:

- SV / `strokeVolumeM3`
- CO / `cardiacOutputM3PerSec`
- work / `strokeWorkJ`
- peak pressure / `peakPressurePa`
- ejection duration / `ejectionDurationSec`
- forward and reverse semilunar volume, including
  `semilunarReverseVolumeM3`
- qDot clamp fraction / `qDotClampHitFraction`
- valve diode and dynamic flow clamp fractions

A future candidate fails the readiness boundary if morphology improves by
collapsing SV, CO, work, peak pressure, or ejection duration; by creating
nonphysiologic reverse volume; by relying on qDot/clamp events; or by showing
improvement only in resampled views without raw-core support.

## 6. Forbidden claims

This boundary makes no production, default, accepted, official-case, official
morphology pass, or production morphology pass claim. It does not authorize
runtime Zc/reflection availability, proxy-derived hypotheses, ModelCore
changes, solver changes, official-case parameter changes, or default/runtime
package wiring.

## 7. Machine-readable artifact

```text
data/myocardium/protocols/arterial-load-zc-reflection-comparator-v1.json
```

The artifact uses `schemaVersion=1`, `status=proposed`, and
`claimBoundary=zc-reflection-comparator-readiness-only`.
