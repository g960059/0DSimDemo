# Four-Chamber Bounded Reservoir Dynamics Review V1

This diagnostic reviews limiter duty after bounded reservoir-volume ownership
passes the source-aware four-chamber contract smoke.

Reports:

- `data/mechanics2/reports/four-chamber-bounded-reservoir-contract-smoke-report-v1.json`
- `data/mechanics2/reports/four-chamber-bounded-reservoir-dynamics-review-report-v1.json`

Result:

- Contract smoke status:
  `source-aware-bounded-reservoir-contract-smoke-pass`
- Dynamics review status:
  `bounded-reservoir-smoke-pass-stress-limiter-dominant`
- Full nominal / `dt-half` / long-epoch envelope limiter duty:
  5 / 350 epochs = 0.014286.
- Preload-low 56-epoch stress-probe limiter duty:
  39 / 56 epochs = 0.696429.
- Max accepted reservoir volume: 24 mL.
- Max rejected transfer: ~1.11 mL.

Interpretation:

- Bounded reservoir-volume ownership is a useful source-aware four-chamber
  scaffold.
- The hard compatibility bound is not a final reservoir law. The long
  preload-low stress probe is limiter-dominant, so a smoother compatibility /
  energy ownership law is needed before any runtime or atrial unlock.

Claim boundary:

- This is not runtime wiring, true four-chamber dynamics, morphology
  acceptance, a final hard-bound law, AV-plane work, or LandAtrial work.
