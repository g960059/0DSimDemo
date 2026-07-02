# Decomposed LA Pressure Contract V1

This bench tests a shadow-only decomposed LA pressure shape after
`AtrialPressureParityAttributionV1`.

Contract:

- keep the source/reservoir filling baseline from the selected left-heart source
  surface,
- remove the empirical source A-wave from that baseline,
- add a normalized AtrialFiberPack active-pressure pulse scaled to the existing
  LA A-wave target.

Report:

- `data/mechanics2/reports/decomposed-la-pressure-contract-report-v1.json`

Result:

- Decision: `decomposed-la-pressure-contract-focused-shadow-signal`.
- Focused residual rows pass: 3/3.
- Total rows pass: 4/7.
- Mean raw fiber pressure delta: ~8.16 mmHg.
- Mean decomposed pressure delta: ~0.25 mmHg.
- Mean improvement fraction: ~0.97.

Residual:

- `normal-hr75`, `normal-hr90`, and `contractility-high` retain non-focused
  late-peak phase residuals.
- This blocks any source-surface substitution smoke.

Interpretation:

- The focused LA parity residual is better treated as a decomposed pressure
  contract problem than as a raw atrial wall pressure substitution problem.
- The result is useful as a shadow signal only; it does not unlock AV-plane,
  runtime wiring, morphology acceptance, or LandAtrial.

Claim boundary:

- No source-surface substitution.
- No runtime wiring.
- No morphology acceptance.
- No AV-plane geometry.
- No piston-volume mode.
- No LandAtrial unlock.
