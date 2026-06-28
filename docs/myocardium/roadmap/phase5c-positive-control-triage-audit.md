# Phase 5C-F Positive-Control Triage Audit

Status: proposed triage plan after the Phase 5C-E post-fidelity entry gate

This phase is a docs/data/verifier/test-only triage audit plan. It does not
run a new engine closure, does not tune qDot/valve/afterload settings, does not
change Land parameters, and does not satisfy either Phase 5C-E entry route.

Machine-readable gate:

```text
data/myocardium/gates/phase5c-positive-control-triage-audit-v1.json
```

Required verifier:

```text
npm run verify:myocardium-phase5c-positive-control-triage-audit
```

Source entry gate:

```text
data/myocardium/gates/phase5c-post-fidelity-entry-gate-v1.json
```

Source audit evidence:

```text
land-new-myocardium-low-preload-phase5c-fidelity-audit-v1
```

## Current Boundary

The inherited state remains `entry-blocked-until-route-satisfied`. The
same-closure legacy activeStress positive control is still
`positive-control-failed`, `settled-period-1`, and
`blocked-until-positive-control-period2`. The Land generated run remains
`not-interpretable-positive-control-failed`, artifactGate remains expected to
fail, and final no-alternans remains not claimed.

## Diagnostic Lanes

`same-closure-source-provider-audit` is a report-only lane for comparing source
provider provenance, generated trajectory health, branch-window metrics,
same-closure hashes, and event-surface summaries. It must preserve
`usesSameClosureAsLandRun=true`, `sourceProviderDifferenceOnly=true`, and
`closureEquivalenceToModelCore=not-claimed`.

`closure-event-surface-diagnostic` keeps qDot, valve thresholds, arterial load,
preload/afterload closure, and Land parameters as mandatory diagnostic control
axes. This is not qDot/valve/afterload tuning, not Land parameter tuning, and
not an adoption route.

`owner-replacement-criterion-prep` records the shape required for a later
owner-approved replacement criterion. It still requires owner provenance and a
replacement criterion artifact; this triage gate does not self-authorize that
criterion.

## Non-Goals

This phase has no runtime replacement, no ModelCore/chamber/case/official-case/
Workbench/state-schema wiring, no qDot/valve/afterload tuning, no Land parameter
tuning, no official morphology acceptance, no final no-alternans, no
calcium-cycling alternans acceptance, no RV pressure-overload coverage, no
ventricular interdependence coverage, no right-heart failure coverage, and no
TriSeg adoption.
