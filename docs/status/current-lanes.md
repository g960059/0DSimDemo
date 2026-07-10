# Current Development Frontier

Status: active routing summary
Updated: 2026-07-10

This file is not a Codex bootstrap instruction. Do not load it automatically for
ordinary repository work. Read it only when a task needs current cross-lane
routing, ownership, blockers, or merge ordering. For implementation and model
questions, inspect the relevant code and current artifact directly.

Detailed lane and experiment history through 2026-07-10 is frozen in
[the status archive](archive/current-lanes-through-2026-07-10.md). PRs, git
history, reports, and generated visuals remain the evidence sources.

## Execution Policy

- Production is unpublished with zero users. Use an internal staged-replacement
  bar without claiming physiology acceptance prematurely.
- Oracle direction checks remain disabled by owner instruction. Use measured
  local evidence, focused review, and owner-provided reviews.
- Diagnostic evidence is not runtime adoption, morphology acceptance, or
  scientific/clinical validation.
- Strict raw morphology and owner visual review remain authoritative for
  user-visible model quality. Borderline automated atrial figure-eight results
  require direct SVG/trace inspection.
- New diagnostics are disposable by default. Promote only checks that protect a
  forward invariant.
- Store experiment histories and variant tables in reports, PRs, or archive
  documents, not in this frontier summary.

## Active Lanes

### Physiology Audit Gate

Objective: maintain a report-only physiology-aware morphology audit layer.

Ownership: `engine/diagnostics/morphology`, `tools/diagnostics`, and associated
audit artifacts. This lane does not own MechanicsCore2 source/reservoir
contracts, runtime wiring, AV-plane mechanics, LandAtrial, or existing strict
acceptance gates.

Current frontier: connect the shadow audit to current trace artifacts and visual
review packs without changing strict gate outcomes. Disease profiles remain
report-only until a normal baseline passes strict morphology and owner review.

### MechanicsCore2 / CircAdapt-lite Sidecar

Objective: develop the sidecar chamber/valve/load architecture without claiming
CircAdapt equivalence or runtime adoption.

Current atrial pivot: use the isolated normal-HR75
`MinimalAtrialFiberAVPlaneContractBench V1` rather than extending the historical
`LeftHeartSubsystemV2` residual stack. `AtrialFiberPackV1` owns LA wall pressure
and the booster/A-loop, `FlowStateValveV1` owns MV q-state, and pulmonary venous
inflow plus MV outflow exclusively own LA blood volume. AV-plane displacement
is a geometry/reference input to atrial wall pressure, not hidden blood volume
or an additive pressure-relief state.

Current evidence: the five-variant report is a minimal-contract research signal.
It keeps the sampled mass ledger and hidden-volume checks clean, but does not
establish runtime wiring, broad-envelope morphology acceptance, an
effective-cavity acceptance axis, prime/x-descent acceptance, or LandAtrial
unlock. The owner-facing SVG uses blood-volume PV only.

Next action: visually review the normal-HR75 blood-volume PV, MV/PV flow, and
LAP/LVP panels before broad-envelope tuning. If the morphology is rejected,
change the responsible wall/valve/AV-plane mechanism rather than add scalar
reference, pressure-memory, or relief states.

Blocked routes:

- `P_mem`, `P_relief`, and `P_LV_recv` additive pressure corrections.
- Hidden-volume or display-axis routes to an apparent figure-eight loop.
- Further scalar reference/capacity residual-stack extensions.
- Runtime AV-plane enablement and LandAtrial tuning before accepted morphology.

Primary evidence:

- `data/mechanics2/reports/minimal-atrial-fiber-av-plane-contract-report-v1.json`
- `data/mechanics2/visuals/minimal-atrial-fiber-av-plane-normal-hr75-review.svg`
- `docs/mechanics2/MechanicsCore2_CircAdaptLite_ExecutionPlan_v3.md`

## Stopped Lane

The `ModelCore + Land` boundary-contract patch lane is stopped unless the owner
explicitly reopens it. Its historical ModelCore-equivalent positive-control
closure route, paired Land source-provider experiments, and Phase 5C follow-ups
are retained only in the archive and dedicated myocardium evidence. Reusable QA
includes strict morphology checks, accepted-boundary qDot/valve readbacks,
pressure decomposition, visual review bundles, and frozen comparators.

## Owner Release Posture

- Land remains a possible replacement direction only after it receives accepted
  geometry and velocity states.
- A1/A2 remain frozen diagnostic comparators.
- LandAtrial remains a long-term active-mechanics target; tuning stays blocked
  while chamber PV and inflow morphology are unresolved.
- Official cases remain smoke and teaching checks until model closure and
  morphology stabilize.
