# Phase 5C-D Positive-Control Fidelity Audit Plan

## Context

Phase 5C-C added a standalone selected-v2 + Land low-preload artifact that
generates its own LV trajectory under
`phase5c-c-standalone-preload-afterload-surrogate-v1`. The verifier currently
passes structural validation, but its artifact gate remains failed because the
same-closure legacy `ActiveStressChamberModel/defaultActiveLV` positive-control
provider settles to period-1 instead of reproducing the fixed Phase 5C-A
period-2 branch.

This is a useful no-go result. It means the Phase 5C-C surrogate closure has
not proven that it can express the legacy low-preload bifurcation. Therefore
the Land generated trajectory cannot be interpreted as evidence that alternans
disappeared.

## Recommended Default

Keep Phase 5C-D as a fidelity audit over the existing Phase 5C-C artifact, not
as a new standalone engine or duplicated verifier. The existing verifier remains
the canonical command:

```text
npm run verify:myocardium-land-new-myocardium-low-preload-check
```

The audit should make the current branch explicit and machine-checkable:

- Phase 5C-A read-only legacy reproduction remains period-2 and pinned.
- Phase 5C-C positive control is finite and same-closure, but currently
  `settled-period-1`.
- Phase 5C-C artifact gate is expected to remain failed while the positive
  control fails period-2 thresholds.
- The Land generated run is not interpretable as no-alternans evidence while
  the positive control fails.
- Same-protocol second-order advancement is blocked until the same closure can
  reproduce the legacy period-2 positive control or a later owner-approved
  replacement criterion supersedes it.

The descriptor and verifier should reject any strengthened advancement claim
that attempts to treat Phase 5B read-only SDIRK2 pins, Phase 5C-C BE smoke, or
report-only morphology as final no-alternans evidence.

## Non-Goals

- Do not add another surrogate implementation.
- Do not duplicate Phase 5C-C branch metrics in a parallel verifier.
- Do not wire ModelCore, chambers, cases, official cases, Workbench, or runtime
  schema.
- Do not tune qDot, valve thresholds, arterial compliance, characteristic
  impedance, reflections, Land parameters, or preload/afterload closure
  settings in this audit phase.
- Do not claim official morphology acceptance, final robust no-alternans,
  calcium-cycling alternans validation, RV pressure-overload coverage,
  ventricular interdependence, right-heart failure coverage, or TriSeg adoption.

## Validation Targets

- `npm run verify:myocardium-land-new-myocardium-low-preload-check`
- `npm run verify:myocardium-land-shadow-alternans-comparator-readiness`
- `npm run verify:myocardium-local-monolithic-coupling-readiness`
- `npm run verify:myocardium-local-monolithic-sdirk2-readiness`
- `npx vitest run __tests__/myocardiumPhase5LandNewMyocardiumLowPreloadCheck.test.ts`
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
