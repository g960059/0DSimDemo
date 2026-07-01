# Four-Chamber Subsystem Residual Review V1

Status: MechanicsCore2 sidecar residual/numerics review for the first
epoch-level four-chamber subsystem smoke.

Artifacts:

- `data/mechanics2/reports/four-chamber-subsystem-residual-review-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runFourChamberSubsystemResidualReviewBench.ts`

## Purpose

The first subsystem smoke passed under the selected scaffold. This review checks
whether that signal survives two cheap numerics/residual probes:

- doubled left/right subsystem sample rates (`dt-half`)
- longer reservoir epoch history (`long-epochs`)

## Boundary

This is diagnostic sidecar evidence only. It is not runtime wiring, true
four-chamber physiology acceptance, morphology acceptance, AV-plane readiness,
LandAtrial readiness, CircAdapt equivalence, or clinical validation.

## Result

Decision: `four-chamber-subsystem-residual-review-mixed`.

- Nominal selected scaffold: 7/7 pass.
- `dt-half`: 4/7 pass.
- `long-epochs`: 6/7 pass.
- Max `dt-half` mismatch delta: ~6.73 mL, driven by `preload-low`.
- Max `long-epochs` mismatch delta: ~0.45 mL.
- Max `long-epochs` reservoir volume: ~28.51 mL.

The residuals are not random:

- `dt-half preload-low` loses both left and right surface preservation.
- `dt-half afterload-high` loses left surface preservation.
- `dt-half contractility-low` loses right surface preservation and phenotype
  scope.
- `long-epochs preload-low` hits persistent reservoir shuttle.

Next work should address the `preload-low` reservoir/numerics residual and
dt-half surface-preservation failures before runtime/default wiring, AV-plane,
LandAtrial, or morphology acceptance.
