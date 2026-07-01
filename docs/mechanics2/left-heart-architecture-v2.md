# MechanicsCore2 Left-Heart Architecture V2

Status: measured sidecar architecture scaffold, not runtime adoption.

This note records the first MechanicsCore2 V2 transaction comparison after the
initial `LeftHeartSubsystemV1` mixed Gate B signal. The purpose is to test
whether a chamber-owned accepted-state transaction and volume-safety semantics
clarify the remaining left-heart residuals before any right-heart,
four-chamber, or LandAtrial work resumes.

## What Changed

- Added `MechanicsTransactionV2`, a small same-step fixed-point transaction
  helper for MechanicsCore2 sidecar experiments.
- Added `LeftHeartSubsystemV2`, which evaluates LA/LV/root candidate states,
  FlowStateValve MV/AoV boundaries, one-fiber LV pressure, pulmonary venous
  return, root outflow, mass residuals, and transaction residuals inside one
  accepted-state contract.
- Added a soft-pressure volume safety mode. This keeps absolute emergency
  bounds, but converts the physiological V1 volume window into a pressure-side
  penalty instead of a morphology-shaping hard clamp.
- Hardened early sidecar gates:
  - Hill-series replay now fails closed on duplicate fixture IDs,
    inconclusive required fixtures, and non-normalized `lSUnits`.
  - One-fiber chamber prescribed-volume bench now reports local `dP/dV` and
    fails closed for the valve/left-heart progression decision.

## Measured Result

Artifact:
`data/mechanics2/reports/left-heart-architecture-comparison-report-v1.json`

Focused runner:
`npx vite-node --script tools/mechanics2/runLeftHeartArchitectureComparisonBench.ts`

| Surface | Pass | LV PV OK | MVF OK | Output OK | Key residual |
| --- | ---: | ---: | ---: | ---: | --- |
| V1 baseline | 4/7 | 7/7 | 5/7 | 5/7 | afterload/low-contractility low SV, high-contractility MVF kink |
| V2 explicit hard | 3/7 | 7/7 | 5/7 | 3/7 | stricter AoV-ejection output gate exposes additional low-output points |
| V2 fixed2 hard | 2/7 | 7/7 | 4/7 | 2/7 | fixed point worsens preload-low |
| V2 fixed2 soft | 3/7 | 7/7 | 6/7 | 3/7 | low-contractility becomes morphology-clean low-output; high-contractility is flow-decoupled with MVF kink |

The useful signal is not a higher total pass count. The useful signal is that
`v2-fixed2-soft` keeps LV PV 7/7 and converts the low-contractility point from
`low SV + MVF failure + mass residual + clamp` into morphology-clean low output,
with bounded soft pressure (`maxSafetyPressureMmHg` ~3.24). The stricter output
gate also records AoV forward ejection, which exposes that high-contractility
has large LV volume range but nearly absent AoV ejection. This isolates the next
left-heart question: output-reserve acceptance/recalibration and the
high-contractility MVF/root-flow causality problem.

## Interpretation

This is architecture-scaffold evidence:

- The same-step transaction readbacks are useful and should be kept.
- Soft pressure safety is a better diagnostic surface than hard physiological
  clamping for separating artifact failures from low-output physiology.
- Fixed-point iteration by itself is not a solution; the hard fixed-point
  variant worsens the envelope.
- The current frontier remains left-heart Gate B, not right-heart,
  four-chamber, runtime wiring, or LandAtrial.

Do not over-interpret the result:

- No runtime/default wiring.
- No closed-loop morphology acceptance.
- No CircAdapt equivalence claim.
- No clinical validation.
- No LandAtrial tuning unlock.

## Next Question

The next phase should stay inside left-heart attribution:

1. Classify afterload-high and contractility-low low stroke volume as either
   expected profile-dependent low output or pressure/force reserve failure.
2. Root-cause the high-contractility MVF kink without returning to scalar
   valve, qDot, root/Zc, Tref, or source-stress tuning.
3. Keep the 7-point left-heart envelope as the Gate B surface until the mixed
   signal is explained or improved.
