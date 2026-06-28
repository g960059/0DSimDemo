# Phase 5C-H/I/J/K ModelCore-equivalent Route Gate

Status: defined-but-unsatisfied route plus partial experimental evidence through Phase 5C-K

This phase records `modelcore-equivalent-closure-positive-control` as a
defined-but-unsatisfied route in
`phase5c-post-fidelity-entry-gate-v1`. Phase 5C-I adds owner-approved
experimental source-provider-limited ModelCore wiring and legacy activeStress
positive-control evidence. The route remains partial because the paired Land
source-provider run under the same closure has not been performed, so this does
not satisfy an entry route or change the inherited no-go.

Phase 5C-J adds the missing state lifecycle boundary needed before Land can be
paired through that hook. ModelCore owns experimental provider state, passes
cloned state snapshots into RHS/pressure/debug calls, restores independent
provider state into read-only measurement clones, and commits provider state
only through an explicit once-per-step lifecycle callback. Public
`unpackState()` resets experimental provider state because provider state is not
part of the production serialized state schema; read-only measurement clones use
a private provider-state snapshot restore. This is a
prerequisite for stateful Land wiring, not a Land result.

Phase 5C-K adds the source-only pressure adapter needed before paired Land
evaluation. The adapter provider supplies only `sourceActiveStressPa`; ModelCore
then routes that source stress through the existing active-stress geometry,
passive pressure, pressure-floor, and clamp path. The Phase 5C-K evidence is
LV-only legacy positive-control readiness: it compares the legacy full-pressure
provider against the legacy LV source-only adapter under the pinned low-preload
protocol and records zero selected trace/metric difference. ModelCore rejects
source-only providers that also define `pressure`, `passivePressure`, or
`debugPressureTerms`; source-only providers must supply source-specific
`debugActiveStressTerms` so later Land evidence cannot inherit legacy
diagnostics by accident. Future Land providers must keep mutable solver state in
`providerState`, not provider-object closures shared with read-only clones. This
is adapter readiness only: the paired Land run has not been performed, and
`sourceProviderDifferenceOnly=true` has not been evaluated for Land.

Machine-readable gate:

```text
data/myocardium/gates/phase5c-post-fidelity-entry-gate-v1.json
```

Required verifier:

```text
npm run verify:myocardium-phase5c-post-fidelity-entry-gate
npm run verify:myocardium-modelcore-active-provider-state-lifecycle
npm run verify:myocardium-modelcore-active-source-pressure-adapter
```

Source no-go evidence:

```text
data/myocardium/protocols/land-new-myocardium-low-preload-phase5c-fidelity-audit-v1.json
```

Closure protocol descriptor:

```text
data/myocardium/protocols/modelcore-equivalent-positive-control-closure-v1.json
```

Current partial evidence:

```text
data/myocardium/protocols/modelcore-equivalent-positive-control-closure-evidence-v1.json
```

Provider-state lifecycle evidence:

```text
data/myocardium/protocols/modelcore-active-provider-state-lifecycle-v1.json
```

Source-only pressure adapter evidence:

```text
data/myocardium/protocols/modelcore-active-source-pressure-adapter-v1.json
```

## Route Set

Entry route ids recorded in the gate:

```text
same-closure-period2-positive-control
modelcore-equivalent-closure-positive-control
owner-approved-replacement-criterion
```

The new route has `status=defined-not-satisfied`. It keeps
`blocked-until-positive-control-period2` as the active advancement state until
the paired source-provider evidence is complete.

Future evidence fields required for the ModelCore-equivalent route include:

```text
closureProtocolId=modelcore-equivalent-positive-control-closure-v1
closureImplementationStatus=experimental-source-provider-hook-implemented
routeSatisfactionStatus=partial-legacy-positive-control-pass-land-pairing-not-run
legacyPositiveControlStatus=period-2-positive-control-pass
positiveControlObservedPeriodBeats=2
sameProtocolOrExplicitEquivalence=true
eventSurfacePreservationRequired=true
sourceProviderDifferenceOnly=true
secondOrderReferenceStillRequired=true
```

Event-surface evidence list: qDot, valve timing, afterload, preload,
TBV/projection, pressure-floor, beat-selection, and sampling behavior preserved
or explicitly matched. Phase 5C-I shows the legacy positive control through the
experimental ModelCore source-provider hook. Phase 5C-J makes stateful provider
wiring possible without hidden mutable provider state, but it still does not run
Land and does not evaluate `sourceProviderDifferenceOnly=true`. Phase 5C-K shows
that the legacy source-only adapter is pressure-equivalent to the legacy
full-pressure provider through ModelCore's pressure assembly for the LV legacy
positive control, but it still does not run Land and does not evaluate
`sourceProviderDifferenceOnly=true`. The route
remains unsatisfied until Land is run through the same closure and
`sourceProviderDifferenceOnly=true` is actually evaluated under that closure.

## Boundary

This phase has no runtime replacement, no chamber/case/official-case/Workbench/
state-schema wiring, no production ModelCore adoption beyond the artifact-only
constructor hook, no qDot/valve/afterload tuning, no Land parameter tuning, no
official morphology acceptance, no final no-alternans, no calcium-cycling
alternans acceptance, no RV pressure-overload coverage, no ventricular
interdependence coverage, no right-heart failure coverage, and no TriSeg
adoption.
