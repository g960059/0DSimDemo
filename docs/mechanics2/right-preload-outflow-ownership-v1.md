# Right Preload Outflow Ownership V1

Status: MechanicsCore2 sidecar source-surface probe, not runtime or
four-chamber acceptance.

Artifacts:

- `data/mechanics2/reports/right-preload-outflow-ownership-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runRightPreloadOutflowOwnershipBench.ts`

## Purpose

`SourceSurfaceContractV1` left the selected right source surface at 6/7 because
`right-heart-preload-low` failed beat repeatability and `dt-half` output parity
despite clean phase-aligned TVF shape. This bench tests whether the residual is
owned by pulmonary valve / PA outflow pressure-flow loss rather than reservoir
gain, broad PA pressure feedback, AV-plane, or atrial active law.

## Boundary

This is sidecar evidence only. It is not runtime wiring, true four-chamber
dynamics, morphology acceptance, reservoir tuning re-entry, AV-plane readiness,
LandAtrial readiness, CircAdapt equivalence, or clinical validation.

The PV loss/opening variants are source-surface architecture leads. They do not
establish final RV/PV/PA magnitude calibration or pulmonary-hypertension
readiness.

## Result

Decision: `right-preload-outflow-contract-signal`.

- Best candidate: `pv-resistance150`.
- Best pass count: 7/7.
- Full-pass candidates: 3.
- Long-epoch pass candidates: 5.
- Reference pass count: 6/7.
- Reference `right-heart-preload-low` failures:
  `beat-repeatability-failed`, `dt-half-output-parity-failed`.

The best `pv-resistance150` candidate keeps the full right source envelope at
7/7 and makes the right preload-low long-epoch probe settle cleanly through
56 beats. The 56-beat right preload-low repeatability delta is effectively zero
and `dt-half` output delta is small, with no safety pressure contribution.

Negative controls are important:

- `pv-resistance200-negative-control` also stabilizes preload-low but
  over-damps pulmonary-afterload-high output.
- `pa-drive050-negative-control` stabilizes preload-low but fails the broad
  envelope. This keeps the conclusion focused on PV pressure-flow/loss
  ownership, not broad PA runoff feedback.

Next work should rerun the source/four-chamber residual review using this PV
outflow ownership lead before any runtime wiring, reservoir retuning, AV-plane,
or LandAtrial work.
