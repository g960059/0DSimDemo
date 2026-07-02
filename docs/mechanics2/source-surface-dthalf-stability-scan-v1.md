# Source-Surface dt-Half Stability Scan V1

Status: MechanicsCore2 sidecar source-surface candidate scan, not a runtime or
four-chamber acceptance surface.

Artifacts:

- `data/mechanics2/reports/source-surface-dthalf-stability-scan-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runSourceSurfaceDtHalfStabilityScanBench.ts`

## Purpose

The four-chamber dt-half attribution showed that the selected subsystem's
dt-half failures already exist in standalone left/right source surfaces. This
scan tests a small set of source-surface candidate perturbations before any
reservoir, four-chamber, AV-plane, or LandAtrial work resumes.

## Boundary

This is diagnostic sidecar evidence only. It is not runtime wiring, true
four-chamber physiology acceptance, morphology acceptance, AV-plane readiness,
LandAtrial readiness, CircAdapt equivalence, or clinical validation.

## Result

Decision: `source-dthalf-scan-partial`.

- Candidates scanned: 20.
- Left candidates: 10.
- Right candidates: 10.
- Left full-pass candidates: 0.
- Right full-pass candidates: 0.
- Best left candidate: `left-mv-closure075`, 5/7 pass.
- Best right candidate: `right-lowt30000-safety018`, 6/7 pass.

Best-left residuals:

- `left-heart-preload-low`: `dt-half-shape-parity-failed`.
- `left-heart-afterload-high`: `output-aov-ejected-volume-too-low`.

Best-right residual:

- `right-heart-preload-low`: `beat-repeatability-failed` and
  `dt-half-output-parity-failed`.

This is a partial source-surface signal only. The scan improves the right
low-contractility source behavior with a clean accepted phenotype, but it does
not clear the left source surface or right preload-low `dt-half` output parity.
The next work should address source-surface time integration and output/parity
ownership directly, not reservoir gain/compliance.
