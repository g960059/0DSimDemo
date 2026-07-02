# LA Late-Peak Residual Attribution V1

This bench classifies the non-focused late-peak residuals left by
`DecomposedLaPressureContractV1`.

Report:

- `data/mechanics2/reports/la-late-peak-residual-attribution-report-v1.json`

Result:

- Decision: `la-late-peak-residual-attribution-signal`.
- Residual rows: 3/3 (`normal-hr75`, `normal-hr90`, `contractility-high`).
- Boundary-tail dominant: 3/3.
- Pressure parity clean despite phase label: 3/3.

Interpretation:

- The non-focused failures are not large pressure-parity failures.
- The current late peak in these rows sits at the late-window boundary while
  the decomposed atrial active pulse remains late.
- The next permissible step is a shadow source-surface substitution smoke only.

Claim boundary:

- No source-surface substitution in this PR.
- No runtime wiring.
- No morphology acceptance.
- No AV-plane geometry.
- No piston-volume mode.
- No LandAtrial unlock.
