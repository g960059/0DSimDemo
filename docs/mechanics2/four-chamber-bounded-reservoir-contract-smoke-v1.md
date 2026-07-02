# Four-Chamber Bounded Reservoir Contract Smoke V1

This smoke promotes the targeted bounded reservoir-volume ownership law into
the full source-aware four-chamber contract scaffold and reruns nominal,
`dt-half`, and long-epoch envelope checks.

Report:

- `data/mechanics2/reports/four-chamber-bounded-reservoir-contract-smoke-report-v1.json`

Result:

- Decision: `source-aware-bounded-reservoir-contract-smoke-pass`
- Raw pass count: 18/21.
- Source-aware effective pass count: 21/21.
- Nominal: effective 7/7, no reservoir-volume ownership limiter hits.
- `dt-half`: effective 7/7, no reservoir-volume ownership limiter hits.
- Long-epochs: effective 7/7, max reservoir volume 24 mL.
- Preload-low 56-epoch stress probe: pass, left/right source surfaces preserved,
  max reservoir volume 24 mL, final reservoir step 0 mL.

Interpretation:

- Bounded reservoir-volume ownership resolves the selected preload-low
  long-epoch reservoir shuttle inside the full source-aware smoke scaffold.
- The ownership limiter remains explicit and active, so this is still a
  contract-smoke result rather than true four-chamber dynamics.

Claim boundary:

- This is not runtime wiring, morphology acceptance, reservoir broad retuning,
  AV-plane work, or LandAtrial work.
- Next work should review bounded-reservoir dynamics/numerics and limiter duty
  before any runtime or atrial unlock.
