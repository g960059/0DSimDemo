# Four-Chamber dt-Half Source Attribution V1

Status: MechanicsCore2 sidecar attribution for the selected four-chamber
subsystem scaffold under `dt-half` residuals.

Artifacts:

- `data/mechanics2/reports/four-chamber-dthalf-source-attribution-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runFourChamberDtHalfSourceAttributionBench.ts`

## Purpose

The preload-low reservoir scan bounded long-epoch reservoir shuttle but did
not fix the `dt-half` surface-preservation failures. This attribution checks
whether the failing `dt-half` surfaces are already broken as standalone
left/right source surfaces, are broken only after the subsystem reservoir
pressure perturbation, or are subsystem-coupling residuals.

## Boundary

This is diagnostic sidecar evidence only. It is not runtime wiring, true
four-chamber physiology acceptance, morphology acceptance, AV-plane readiness,
LandAtrial readiness, CircAdapt equivalence, or clinical validation.

## Result

Decision: `dt-half-source-attribution-standalone-source`.

- Profiles checked: 3 (`preload-low`, `afterload-high`, `contractility-low`).
- Subsystem-failed sides: 4.
- Standalone `dt-half` source failures: 4.
- Reservoir pressure perturbation failures: 0.
- Subsystem-coupling-only failures: 0.

The failure mapping is specific:

- `preload-low` left: standalone left surface fails through
  `dt-half-shape-parity-failed`.
- `preload-low` right: standalone right surface fails through
  `beat-repeatability-failed` and `dt-half-output-parity-failed`.
- `afterload-high` left: standalone left surface fails through
  `output-aov-ejected-volume-too-low`.
- `contractility-low` right: standalone right surface fails through
  `output-stroke-volume-too-low`, `output-pv-ejected-volume-too-low`, and
  `dt-half-shape-parity-failed`.

The next work should focus on standalone left/right source-surface `dt-half`
numerics and output/parity ownership. Do not tune reservoir gain/compliance,
start runtime wiring, AV-plane work, LandAtrial work, or morphology acceptance
from this result.
