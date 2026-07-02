# Preload-Low dt-half Reservoir Parity Attribution V1

This attribution classifies the localized `preload-low` reservoir magnitude
parity residual from the smooth reservoir assembled numerics review.

Report:

- `data/mechanics2/reports/preload-low-dthalf-reservoir-parity-attribution-report-v1.json`

Result:

- Attribution status: `preload-low-dthalf-reservoir-parity-classified`.
- Owner: `source-surface-dt-input-not-reservoir-feedback`.
- Nominal max reservoir volume: ~19.45 mL.
- `dt-half` max reservoir volume: ~4.06 mL.
- `dt-half` max reservoir delta: ~15.39 mL.
- Nominal feedback duty: 0.
- `dt-half` feedback duty: 0.
- Nominal hard-limiter duty: 0.
- `dt-half` hard-limiter duty: 0.
- `dt-half` raw residual is source-owned and effective-pass.

Interpretation:

- The residual is not caused by the smooth reservoir feedback or hard limiter.
- The next work should target `preload-low` source-surface dt input parity /
  normalization rather than reservoir feedback retuning.

Claim boundary:

- This is not runtime wiring, true four-chamber dynamics, morphology
  acceptance, reservoir retuning, AV-plane work, or LandAtrial work.
