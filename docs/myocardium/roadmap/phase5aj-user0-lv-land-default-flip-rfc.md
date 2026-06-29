# Phase 5AJ User-0 LV Land Default-Flip RFC

Status: draft, owner decision needed

Artifact:
`data/myocardium/protocols/user0-lv-land-default-flip-rfc-phase5aj-result-v1.json`

Verifier:
`npm run verify:myocardium-user0-lv-land-default-flip-rfc`

## Decision Question

Authorize a user-0 staged LV Land runtime default flip in a separate
implementation PR, with legacy active-stress kept as frozen reference and
rollback?

## Recommendation

Recommended path: `owner-go-user0-staged-default-flip-next-pr`.

This RFC does not itself flip the runtime default. It records that the current
evidence is ready for owner decision because production is unpublished with zero
users, the normal-floor LVEDP excess is bounded by Phase 5AI, and the remaining
root/Zc, atrial figure-eight, official-case tuning, and alternans science lanes
are separable from LV default migration.

## Evidence Inputs

- Phase 5U defines the developer-only LV Land runtime flag contract without
  production runtime, case, Workbench, schema, UI, or registry wiring.
- Phase 5V measures the developer-only helper suite: 3/3 points measured,
  `pointsCapOrNonOk=0`, `landSolveFailureCount=0`, and main-domain output
  reproduces Phase 5S.
- Phase 5X records the default-candidate user-knob preflight. Its original
  readiness is `blocked-before-default-flip` because the normal-floor LVEDP
  blocker was not yet attributed, while Land solve failure count is zero.
- Phase 5AH keeps discharge-path and boundary/root evidence diagnostic-only:
  root/Zc adoption and qDot clamp removal remain blocked.
- Phase 5AI bounds normal-floor LVEDP as
  `bounded-small-lvedp-excess-diagnostic-only`: Land current normal LVEDP is
  `17.276729` mmHg, `1.276729` mmHg above the floor, with no other floor
  failures. The diagnostic resolved runs are `land-lv-bpas-0p90`,
  `land-lv-bpas-0p85`, and `land-ca-release-1p10`.

## Owner Options

1. GO: accept the bounded Phase 5AI LVEDP excess as sufficient for a user-0
   staged default-flip implementation PR.
2. DEFER: require a separate explicit passive/geometry calibration PR before
   any default flip.
3. NO-GO: keep LV Land developer-only and continue morphology or operating-point
   work first.

## Next PR If GO

Include:

- Wire LV Land as the staged runtime default path behind explicit rollback and
  reference controls.
- Keep legacy active-stress selectable for frozen reference, debug, and
  rollback.
- Add baseline smoke/readback evidence proving the selected default and rollback
  path.
- Record user-0 and no-clinical-validation boundary if a visible surface is
  touched.

Exclude:

- Legacy active-stress deletion.
- Root/Zc or boundary/root inertance production adoption.
- Atrial figure-eight model selection.
- Official case reauthoring or per-case tuning.
- Accepted passive, geometry, source-calcium, preload, or venous-tone tuning.
- Tref, qDot, valve, or source-stress tuning.
- Official morphology, no-alternans, clinical, or scientific validation
  acceptance.

## Rollback Conditions

- Normal HR75/90 or preload-envelope solve failure.
- Non-settling or new period instability in the user-0 main domain.
- Severe PV-loop morphology artifact regression relative to current diagnostic
  baseline.
- Simulation health regression in baseline smoke or official teaching-surface
  smoke.
- Missing legacy active-stress rollback or reference path after implementation.

## Boundary

This phase is RFC-only: no runtime default flip in this phase, no legacy
active-stress deletion, no root/Zc adoption, no atrial figure-eight gate, no
official case reauthoring, no Workbench runtime wiring, no state schema
migration, no accepted tuning, no Tref fudge, no qDot or valve tuning, no
official morphology acceptance, no final no-alternans acceptance, and no
clinical/scientific validation claim.
