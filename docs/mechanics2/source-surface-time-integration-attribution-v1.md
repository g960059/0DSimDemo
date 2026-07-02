# Source-Surface Time Integration Attribution V1

Status: MechanicsCore2 sidecar attribution artifact, not a runtime or
four-chamber acceptance surface.

Artifacts:

- `data/mechanics2/reports/source-surface-time-integration-attribution-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runSourceSurfaceTimeIntegrationAttributionBench.ts`

## Purpose

The source-surface `dt-half` stability scan found no left or right full-pass
candidate from small parameter perturbations. This attribution bench replays the
best partial candidates and classifies the remaining residuals into separate
owners before any reservoir, four-chamber, AV-plane, or LandAtrial work resumes.

## Boundary

This is diagnostic sidecar evidence only. It is not runtime wiring, true
four-chamber dynamics, morphology acceptance, reservoir tuning re-entry,
AV-plane readiness, LandAtrial readiness, CircAdapt equivalence, or clinical
validation.

## Result

Decision: `source-time-integration-attribution-classified`.

- Residual points: 4.
- Failing residual points: 3.
- Passing clean phenotype point: 1.
- Shape dt-parity residuals: 1.
- Output-reserve residuals: 1.
- Repeatability-before-dt-output residuals: 1.

Classified residuals:

- `left-heart-preload-low`: `shape-dt-parity`. The final MV inflow C1 score is
  0.105442, while the `dt-half` score is 0.310388; output parity is otherwise
  close. Next owner: source-shape time integration.
- `left-heart-afterload-high`: `output-reserve`. AoV ejected volume remains
  34.726848 mL with small repeatability and `dt-half` output deltas. Next owner:
  source-output reserve calibration.
- `right-heart-preload-low`: `repeatability-before-dt-output`. PV ejection
  changes from 49.713359 mL on the previous beat to 33.641749 mL on the final
  beat, and `dt-half` falls to 19.652697 mL. Next owner: source settling /
  repeatability before output parity.
- `right-heart-contractility-low`: clean accepted low-output phenotype remains
  clamp-free and is not a residual target.

The result splits the source-surface work into three owner classes. It does not
support more reservoir gain/compliance tuning or another broad small-parameter
scan.
