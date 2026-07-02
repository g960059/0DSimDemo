# LA Active-Pulse MV Replay Refinement V1

This bench follows `LaPressureShadowSubstitutionV1` by testing whether the
decomposed LA active pulse can preserve MV replay when the pulse shape is
bounded before any source-surface substitution.

Mode:

- replay the selected left-heart source trace,
- keep chamber volumes, source surfaces, and runtime untouched,
- compare active-pulse shaping variants only inside shadow MV valve replay.

Variants:

- raw fiber active pulse,
- empirical A-window positive control,
- fiber active pulse gated by the current A-window,
- fiber active pulse gated around its own peak,
- fiber active pulse with late onset,
- fiber active pulse with tail subtraction.

Report:

- `data/mechanics2/reports/la-active-pulse-mv-replay-refinement-report-v1.json`

Result:

- Decision: `la-active-pulse-mv-replay-refinement-signal`.
- Selected mode: `fiber-active-a-window-gated`.
- Selected mode pass: 7/7.
- Selected mode shadow MVF clean: 7/7.
- Selected mode single-peak collapse: 0/7.
- Selected mode forward-volume wide: 0/7.
- Selected mode mean QMV RMS delta: ~1.58 mL/s.
- Selected mode mean forward-volume ratio: ~0.997.
- Selected mode max adverse-gradient excess during forward flow: ~0.02.

Interpretation:

- The raw atrial fiber active pulse is too broad for MV replay and reproduces
  the E/A single-peak collapse from the previous shadow substitution smoke.
- The empirical A-window positive control passes 7/7, confirming the replay
  path itself can preserve MVF.
- Gating the fiber active pulse by the existing A-window preserves MV replay
  while still using the atrial fiber active-pulse amplitude.
- This is a shadow shape-contract signal only. It does not substitute LAP in
  the source surface or unlock runtime, AV-plane, or LandAtrial.

Claim boundary:

- No source-surface substitution.
- No runtime wiring.
- No morphology acceptance.
- No AV-plane geometry.
- No piston-volume mode.
- No LandAtrial unlock.
