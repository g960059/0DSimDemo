# Left-Heart Pulmonary Boundary Contract V1

Status: measured Gate B boundary-attribution surface, not model acceptance.

Artifacts:

- `data/mechanics2/reports/left-heart-pulmonary-boundary-contract-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runLeftHeartPulmonaryBoundaryContractBench.ts`

## Question

The previous outflow repair surface removed large AoV beat alternans but left a
high-contractility MVF kink/clamp. This bench asks whether that residual is
driven by the fixed pulmonary venous pressure source or by lower-volume safety
suction plus semilunar/load balance.

## Result

- Finite pulmonary venous compliance-node variants are broad no-go surfaces in
  this provisional left-heart subsystem: they reduce source overdrive but damage
  normal/preload MVF and do not improve Gate B pass count.
- The broad best remains `semilunar-loss2-root-runoff70`: 4/7 pass, preserving
  the previous outflow repair frontier.
- A high-drive component probe,
  `semilunar-loss5-inertance4-root-runoff110-low-suction`, makes the
  `left-heart-contractility-high` point pass locally: LV PV, MVF shape, output,
  repeatability, dt sensitivity, flow coupling, and clamp-free status are all OK.
- That high-drive rescue is not a broad surface: normal/HR90/preload/afterload
  output reserve becomes too low. Treat it as a mechanism signal, not an
  adoption candidate.

## Claim Boundary

This does not unlock runtime wiring, right-heart/four-chamber work,
LandAtrial tuning, official morphology acceptance, or output-reserve acceptance.
The next left-heart work should turn the lower-bound safety suction plus
semilunar/load signal into a broad output-reserve calibration rather than
reopening fixed-pressure/PV-node tuning.
