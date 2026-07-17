# VALIDATION-0002: circulatory load sensitivity

Status: implemented structural response screen; not a calibration or cutover
gate.

## Purpose

This screen asks whether the canonical five-wall closed loop responds in the
expected direction when systemic or pulmonary vascular resistance is changed.
It is deliberately a five-point, one-factor-at-a-time experiment rather than a
parameter search:

- baseline;
- systemic resistance ×0.75 and ×4/3; and
- pulmonary resistance ×0.75 and ×4/3.

The low and high scales are reciprocal in log space. Every point starts from
the same independent fixed-TBV canonical cold state. Heart rate, calcium,
Land/passive material, common pericardium, valves, respiratory forcing, total
blood volume, and initialization policy remain fixed. No warm start is shared
between points and the runner accepts no generic parameter patch.

## Numerical protocol

- time step: 4 ms;
- maximum beats: 32;
- termination: the existing fixed groupwise period-1 policy;
- retained measurement: the terminal complete accepted cycle; and
- digest: SHA-256 over canonical JSON.

The 4 ms screen is a development-speed response probe. The official healthy
reference remains the separate 2 ms checkpoint measurement in
`VALIDATION-0001`; absolute values from the two protocols must not be silently
substituted for each other.

## Result

All five points converged to period 1 without a step failure. The generated
artifact is
`data/scientific/validation/circulatory-load-sensitivity-envelope-v1.json`
with envelope SHA-256
`6437e9a410b554056ba211bee91aff61c9c9fd5d0e7d2f46a4bda18a4b68c739`.

| Point | P1 beat | MAP (mmHg) | mPAP (mmHg) | LV EF | RV EF | CO (L/min) |
|---|---:|---:|---:|---:|---:|---:|
| baseline | 27 | 88.35 | 17.17 | 0.579 | 0.543 | 5.303 |
| systemic R ×0.75 | 24 | 75.87 | 16.91 | 0.631 | 0.550 | 5.561 |
| systemic R ×4/3 | 30 | 103.28 | 17.76 | 0.516 | 0.531 | 4.995 |
| pulmonary R ×0.75 | 27 | 88.68 | 16.64 | 0.578 | 0.550 | 5.326 |
| pulmonary R ×4/3 | 27 | 87.94 | 17.89 | 0.579 | 0.535 | 5.275 |

The systemic response is coherent: lower SVR lowers MAP and raises output and
LV EF, while higher SVR does the reverse. The pulmonary response is also
coherent when mean pressure and RV performance are evaluated together: higher
PVR raises mPAP and lowers RV EF; lower PVR does the reverse.

Pulmonary systolic pressure alone is not a monotone PVR readout in this
closed-loop experiment. At high PVR, PASP falls from 36.45 to 36.09 mmHg while
mPAP rises, because RV stroke output and pulse pressure also fall. Interpreting
that isolated PASP change as a sign error would be incorrect; PASP, PADP, mPAP,
RV volume, and RV output must be reviewed as one response.

## Interpretation and limits

This result supports the load coupling and fixed-TBV transaction, but does not
repair the healthy operating-point blockers. The baseline LV EDV and ESV at
4 ms remain 152.77 and 64.38 mL, respectively. Changing SVR alone produces the
expected MAP/output tradeoff rather than identifying a satisfactory global
operating point. Therefore resistance should not be used as a hidden surrogate
for passive stiffness, contractility, or blood volume.

The next broad screens should separately own:

- ventricular passive/EDPVR material;
- ventricular active force and relaxation;
- fixed total blood volume/preload distribution; and
- vascular compliance apart from resistance.

Those axes require typed, release-resolved research operations before they can
become browser controls or saved-case content. This report makes no patient
fit, disease-severity, clinical-validation, or production-cutover claim.

## Reproduction

```bash
npm run generate:scientific:circulatory-load-envelope
npm run verify:scientific:circulatory-load-envelope
```
