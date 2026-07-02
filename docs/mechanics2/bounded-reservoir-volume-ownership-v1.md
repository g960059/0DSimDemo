# Bounded Reservoir Volume Ownership V1

This diagnostic tests whether the remaining preload-low long-epoch reservoir
repeatability blocker can be owned as an accepted reservoir-volume constraint,
without reopening broad reservoir gain/compliance tuning.

Report:

- `data/mechanics2/reports/bounded-reservoir-volume-ownership-report-v1.json`

Result:

- Decision: `bounded-volume-ownership-targeted-signal`
- Reference unbounded scaffold: 0/3 pass across 22, 40, and 56 epochs.
- `hard-volume-bound28`: 3/3 pass, source surfaces preserved, max reservoir
  volume 28 mL.
- `hard-volume-bound24`: 3/3 pass, source surfaces preserved, max reservoir
  volume 24 mL.
- Best selected variant: `hard-volume-bound24`.

Interpretation:

- Explicit reservoir-volume ownership can prevent the preload-low reservoir
  load accumulation that eventually breaks the right source surface.
- The signal is targeted only. The volume limiter is active for many epochs and
  rejects transfer explicitly, so this is not true four-chamber dynamics or
  morphology acceptance.

Claim boundary:

- This is not runtime wiring, true four-chamber dynamics, morphology
  acceptance, reservoir broad retuning, AV-plane work, or LandAtrial work.
- Next work should promote bounded reservoir-volume ownership into the full
  source-aware four-chamber contract smoke and rerun nominal, `dt-half`, and
  long-epoch envelope checks.
