# Atrial Pressure Parity Attribution V1

This bench classifies the LA pressure-parity residual from
`AtrialFiberPackClosedLoopReplayV1` without substituting atrial fiber pressure
back into the source surfaces.

Report:

- `data/mechanics2/reports/atrial-pressure-parity-attribution-report-v1.json`

Result:

- Decision: `la-pressure-parity-attribution-signal`.
- Focused residual rows: 3/3 (`preload-high`, `afterload-high`,
  `contractility-low`).
- Baseline offset dominant: 3/3.
- Wall pulse scale mismatch: 3/3.
- Wall pressure decoupled from current waveform: 3/3.
- Current v-wave / reservoir component: 1/3.
- Late A-wave phase aligned: 3/3.

Interpretation:

- The residual is not primarily an AV-delay problem; the fiber active peak and
  current late pressure peak remain aligned.
- Raw atrial fiber wall pressure is not ready to replace the existing LA
  pressure signal.
- The next model surface should test a decomposed LA pressure contract that
  separates filling-pressure baseline / reservoir state from atrial wall pulse
  scaling.

Claim boundary:

- No atrial pressure substitution.
- No AV-plane geometry.
- No piston-volume mode.
- No morphology acceptance.
- No runtime wiring.
- No LandAtrial unlock.
