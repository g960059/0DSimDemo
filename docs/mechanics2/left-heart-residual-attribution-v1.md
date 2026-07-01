# MechanicsCore2 Left-Heart Residual Attribution V1

Status: measured Gate B attribution, not model acceptance.

This report classifies the three remaining `v2-fixed2-soft` left-heart
residuals from the architecture V2 comparison.

Artifact:
`data/mechanics2/reports/left-heart-residual-attribution-report-v1.json`

Runner:
`npx vite-node --script tools/mechanics2/runLeftHeartResidualAttributionBench.ts`

## Result

The source surface remains mixed:

- target surface: `v2-fixed2-soft`
- pass: 3/7
- LV PV OK: 7/7
- MVF OK: 6/7
- output OK: 3/7

Attribution:

| Point | Classification | Interpretation |
| --- | --- | --- |
| `left-heart-afterload-high` | `afterload-output-reserve` | MVF is clean and no clamp/mass artifact is present, but SV and AoV forward ejection remain below the current Gate B output floor. |
| `left-heart-contractility-low` | `contractility-low-output-reserve` | Soft-pressure V2 separates the previous artifact bundle: MVF is biphasic, no mass residual, no hard clamp; remaining failure is low SV/AoV ejection with bounded soft safety pressure. |
| `left-heart-contractility-high` | `contractility-high-flow-decoupled-mvf-kink` | LV volume range is large, but AoV forward ejection is near zero and the MVF C1/kink artifact remains. |

## Decision

This is a useful narrowing of the left-heart Gate B problem:

- Low-contractility is no longer a mixed morphology/mass/clamp artifact under
  `v2-fixed2-soft`; it is now an output-reserve classification question.
- Afterload-high is also an output-reserve question under the current floor.
- High-contractility remains a true artifact: LV volume-range stroke looks
  large, but AoV forward ejection is nearly absent and MVF has a C1/kink
  artifact.

Do not start right-heart, four-chamber, or LandAtrial work from this result. The
next MechanicsCore2 phase should stay in left-heart Gate B and address:

1. whether afterload-high and contractility-low low SV are profile-expected or
   require pressure/force reserve recalibration;
2. the high-contractility MVF kink root cause.

## Claim Boundary

Not claimed:

- runtime/default wiring;
- morphology acceptance;
- output-reserve acceptance;
- right-heart or four-chamber unlock;
- LandAtrial unlock;
- CircAdapt equivalence.
