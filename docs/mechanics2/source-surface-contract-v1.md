# Source-Surface Contract V1

Status: MechanicsCore2 sidecar source-surface contract probe, not runtime or
four-chamber acceptance.

Artifacts:

- `data/mechanics2/reports/source-surface-contract-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runSourceSurfaceContractBench.ts`

## Purpose

Previous source-surface attribution split the four-chamber `dt-half` residuals
into sampling-grid shape parity, left afterload output reserve, and right
preload settling/repeatability. This bench turns that split into a compact
source-side contract probe:

- use phase-aligned shape parity instead of raw sample-count-sensitive shape
  parity for source-surface `dt-half` checks;
- test whether left afterload-high output reserve can be recovered without
  changing the normal/preload/contractility points;
- test whether right preload-low is merely short warmup or a persistent
  source-surface settling/repeatability blocker.

## Boundary

This is sidecar evidence only. It is not runtime wiring, true four-chamber
dynamics, morphology acceptance, reservoir tuning re-entry, AV-plane readiness,
LandAtrial readiness, CircAdapt equivalence, or clinical validation.

The load-conditioned left reserve probes are diagnostic leads. They do not
establish a final geometry-derived pressure/magnitude calibration and should
not be treated as runtime policy.

## Result

Decision: `left-contract-pass-right-source-blocked`.

- Left best candidate: `left-afterload-active-reserve103`.
- Left best pass count: 7/7.
- Left full-pass candidates: 2.
- Right pass count: 6/7.
- Right full pass: false.
- Right preload settling blocker: true.

Left source surface:

- `left-reference-phase-aligned` passes 6/7. The prior preload-low raw
  `dt-half` shape failure is accepted by phase-aligned shape parity, but
  afterload-high remains output-limited.
- `left-afterload-active-reserve103` passes 7/7 by applying the active reserve
  only when root downstream pressure or root resistance indicates high
  afterload.
- `left-afterload-pressure-reserve102` also passes 7/7, but this remains a
  magnitude-calibration probe rather than an adoption path.

Right source surface:

- `right-reference-phase-aligned` passes 6/7.
- `right-heart-preload-low` still fails with `beat-repeatability-failed` and
  `dt-half-output-parity-failed` despite phase-aligned shape parity.
- Longer right preload-low epochs do not settle the point; by 56 beats the
  repeatability delta remains >70 mL. This classifies the residual as a
  persistent right-source settling/repeatability blocker, not a short-warmup
  artifact.

Next work should focus on the right preload-low source-surface settling and
volume-output contract before returning to four-chamber residual review,
runtime wiring, AV-plane work, or LandAtrial.
