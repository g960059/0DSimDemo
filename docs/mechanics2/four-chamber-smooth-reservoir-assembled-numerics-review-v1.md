# Four-Chamber Smooth Reservoir Assembled Numerics Review V1

This review checks the selected smooth reservoir scaffold as an assembled
source/reservoir numerical surface, rather than only as a limiter/passivity
surface.

Reports:

- `data/mechanics2/reports/four-chamber-smooth-reservoir-dynamics-review-report-v1.json`
- `data/mechanics2/reports/four-chamber-smooth-reservoir-assembled-numerics-review-report-v1.json`

Result:

- Review status: `assembled-source-reservoir-numerics-mixed`.
- Smooth dynamics review: pass.
- Effective envelope pass: true.
- Hard limiter free: true.
- Feedback dissipative: true.
- `dt-half` reservoir magnitude parity: 6/7.
- Failed profile: `preload-low`.
- `preload-low` nominal max reservoir volume: ~19.45 mL.
- `preload-low` `dt-half` max reservoir volume: ~4.06 mL.
- `preload-low` `dt-half` max-reservoir delta: ~15.39 mL.
- Raw source-owned residual profiles remain separated:
  `preload-low`, `afterload-high`, and `contractility-low`.

Interpretation:

- The smooth reservoir scaffold remains a useful current scaffold, but
  assembled source/reservoir numerics are not fully certified.
- The next blocker is localized: `preload-low` has a large reservoir magnitude
  difference between nominal and `dt-half`, despite effective pass status and
  clean limiter/passivity behavior.

Claim boundary:

- This is not runtime wiring, true four-chamber dynamics, morphology
  acceptance, AV-plane work, or LandAtrial work.
