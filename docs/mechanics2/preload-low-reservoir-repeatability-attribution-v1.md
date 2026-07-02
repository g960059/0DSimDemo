# Preload-Low Reservoir Repeatability Attribution V1

This diagnostic classifies the remaining `long-epochs/preload-low` blocker from
the source-aware four-chamber contract smoke without scanning reservoir tuning
parameters.

Report:

- `data/mechanics2/reports/preload-low-reservoir-repeatability-attribution-report-v1.json`

Result:

- Decision:
  `reservoir-load-breaks-right-surface-after-volume-accumulation`
- Epoch counts reviewed: 14, 22, 40, 56.
- 14 epochs: passes with max reservoir volume ~19.45 mL.
- 22 epochs: fails only persistent reservoir shuttle with both source surfaces
  preserved; max reservoir volume ~28.51 mL.
- 40 epochs: same failure mode with both source surfaces preserved; max
  reservoir volume ~46.16 mL.
- 56 epochs: reservoir step falls to ~0.35 mL, but accumulated reservoir load
  reaches ~48.94 mL and the right surface fails.

Interpretation:

- The blocker is not just slow convergence.
- The selected preload-low scaffold accumulates reservoir volume until the
  right source surface becomes incompatible with the reservoir load.

Claim boundary:

- This is not runtime wiring, true four-chamber dynamics, morphology
  acceptance, reservoir broad retuning, AV-plane work, or LandAtrial work.
- Next work should design a bounded reservoir-volume ownership contract for
  preload-low rather than widening reservoir gain/compliance tuning.
