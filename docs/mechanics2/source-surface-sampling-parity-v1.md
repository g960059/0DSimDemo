# Source-Surface Sampling Parity V1

Status: MechanicsCore2 sidecar sampling-grid attribution, not a runtime or
four-chamber acceptance surface.

Artifacts:

- `data/mechanics2/reports/source-surface-sampling-parity-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runSourceSurfaceSamplingParityBench.ts`

## Purpose

The source-surface time-integration attribution split residuals into shape
dt-parity, output reserve, and repeatability owners. This bench checks whether
the shape dt-parity residual remains when the `dt-half` waveform is compared on
the same phase grid as the base waveform.

## Boundary

This is diagnostic sidecar evidence only. It is not runtime wiring, true
four-chamber dynamics, morphology acceptance, reservoir tuning re-entry,
AV-plane readiness, LandAtrial readiness, CircAdapt equivalence, or clinical
validation.

## Result

Decision: `sampling-parity-shape-owner-found`.

- Points reviewed: 3.
- Sampling-grid explains shape residuals: 1.
- Sampling-grid not-owner residuals: 2.
- Remaining output-reserve residuals: 1.
- Remaining repeatability residuals: 1.

Classified points:

- `left-heart-preload-low`: raw MV inflow C1 changes from 0.105442 to 0.310388
  at `dt-half`, but phase-aligned `dt-half` C1 is 0.081549 and aligned delta is
  0.023893. Both raw and aligned waveforms remain single-peaked. This supports
  phase-aligned shape parity for source-surface dt checks.
- `left-heart-afterload-high`: sampling grid is not the owner; the point remains
  output-reserve limited.
- `right-heart-preload-low`: sampling grid is not the owner; output and
  repeatability remain the blocker.

This result does not reopen reservoir tuning. The next source-surface contract
should use phase-aligned shape parity and then separately address left output
reserve and right repeatability/output parity.
