# Four-Chamber Smooth Reservoir Ownership V1

This diagnostic replaces the hard reservoir-volume projection scaffold with a
small set of smooth reservoir-volume compatibility feedback candidates.

Report:

- `data/mechanics2/reports/four-chamber-smooth-reservoir-ownership-report-v1.json`

Result:

- Selected candidate: `smooth-knee20-gain035-bound24`.
- Decision: `smooth-reservoir-ownership-signal`.
- Source-aware full smoke: effective 21/21.
- Nominal / `dt-half` / long-epoch effective pass: 7/7 each.
- Preload-low 56-epoch stress probe: pass.
- Hard-bound baseline stress hard-limiter duty: 39 / 56 epochs = 0.696429.
- Selected smooth-knee stress hard-limiter duty: 0 / 56 epochs = 0.
- Selected full-envelope hard-limiter duty: 0 / 350 epochs = 0.
- Selected max feedback transfer: ~1.07 mL.

Interpretation:

- A near-bound smooth compatibility feedback can preserve the source-aware
  four-chamber smoke while removing hard-bound fallback duty from the
  preload-low stress probe.
- This is a better scaffold than the hard projection, but it is still not a
  final reservoir law. The selected surface needs a focused dynamics/numerics
  review before any runtime, AV-plane, or LandAtrial unlock.

Claim boundary:

- This is not runtime wiring, true four-chamber dynamics, morphology
  acceptance, reservoir broad retuning, a final hard-bound law, AV-plane work,
  or LandAtrial work.
