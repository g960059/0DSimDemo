# Phase 5C-E Post-Fidelity Entry Gate

Status: proposed gate snapshot after the Phase 5C-D positive-control fidelity audit

This gate records the only allowed ways to move beyond the Phase 5C-D no-go
state. It does not change runtime behavior, does not replace the Phase 5C-C
artifact, and does not reinterpret the Land generated trajectory as evidence
while the positive control remains failed.

Machine-readable gate:

```text
data/myocardium/gates/phase5c-post-fidelity-entry-gate-v1.json
```

Required verifier:

```text
npm run verify:myocardium-phase5c-post-fidelity-entry-gate
```

Source audit evidence:

```text
data/myocardium/protocols/land-new-myocardium-low-preload-phase5c-fidelity-audit-v1.json
```

## Current No-Go State

The source audit evidence is
`land-new-myocardium-low-preload-phase5c-fidelity-audit-v1`. It keeps the
Phase 5C-C same-closure legacy activeStress positive control at
`positive-control-failed`, `settled-period-1`, and
`blocked-until-positive-control-period2`. The artifact gate remains failed, the
Land run remains `not-interpretable-positive-control-failed`, and final
no-alternans remains not claimed.

## Allowed Entry Routes

`same-closure-period2-positive-control` is the direct entry route. It requires
the same Phase 5C-C closure model to reproduce the legacy positive control as
`period-2-positive-control-pass` / `settled-period-2`, with
`positiveControlObservedPeriodBeats=2`, adjacent delta `> 0.1`, period delta
`< 0.05`, TBV projection and max reverse volume equivalents each `<= 0.05 mL`,
no pressure floor use, finite selected-domain coverage, and source-provider
difference only.

`modelcore-equivalent-closure-positive-control` is the PR #193 route now
recorded in this gate as `defined-not-satisfied`. It references
`modelcore-equivalent-positive-control-closure-v1`. Phase 5C-I updates that
route to `closureImplementationStatus=experimental-source-provider-hook-implemented`
and
`routeSatisfactionStatus=partial-legacy-positive-control-pass-land-pairing-not-run`,
while preserving `blocked-until-positive-control-period2`. Its current partial
evidence records legacy activeStress period-2 positive-control reproduction
through the owner-approved experimental ModelCore source-provider hook. It still
requires the paired Land source-provider run, same protocol or explicit
equivalence, event-surface preservation or explicit matching,
source-provider-difference only, and second-order reference evidence.

`owner-approved-replacement-criterion` is the alternative route. It requires a
later owner approval artifact that explicitly references the superseded
positive-control criterion and describes the replacement acceptance criterion.
That artifact must carry owner provenance fields for `acceptedBy`, `acceptedAt`,
`acceptedSourceType`, `acceptedSourceRef`, and `acceptedSourceText`, plus a
criterion id, superseded criterion id, replacement acceptance criterion, and
decision boundary. The gate itself records
`owner-approved-replacement-required`; it does not act as that approval.

## Non-Goals

This phase has no runtime replacement, no chamber/case/official-case/Workbench/
state-schema wiring, no production ModelCore adoption beyond the artifact-only
constructor hook, no qDot/valve/afterload tuning, no Land parameter tuning, no
official morphology acceptance, no final no-alternans, no calcium-cycling
alternans acceptance, no RV pressure-overload coverage, no ventricular
interdependence coverage, no right-heart failure coverage, and no TriSeg
adoption.
