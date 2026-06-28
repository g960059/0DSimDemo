# Phase 5C-H/I/J/K/L ModelCore-equivalent Route Gate

Status: paired experimental LV source-provider evidence recorded through Phase 5C-L; final no-alternans remains unclaimed

This route was recorded as `modelcore-equivalent-closure-positive-control` in
`phase5c-post-fidelity-entry-gate-v1` before implementation evidence existed.
Phase 5C-I adds owner-approved
experimental source-provider-limited ModelCore wiring and legacy activeStress
positive-control evidence.

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

Phase 5C-L runs the paired experiment that Phase 5C-I/J/K were built to enable.
Under the same pinned low-preload ModelCore closure, the legacy LV source-only
provider reproduces the period-2 positive control, while the Land 2017 LV
source-only provider runs finite and settles to period-1. The live evidence
records `outcomeClass=A`: a positive interpretable signal for this experimental
closure, not official morphology acceptance and not final no-alternans. The
paired evidence also records `sourceProviderDifferenceOnly=true` for the
experimental LV source-only pair. The next requirement is robustness and
interpretation under the same closure, including second-order/reference checks,
without tuning qDot, valves, afterload, preload, or Land parameters.

Machine-readable gate:

```text
data/myocardium/gates/phase5c-post-fidelity-entry-gate-v1.json
```

Required verifier:

```text
npm run verify:myocardium-phase5c-post-fidelity-entry-gate
npm run verify:myocardium-modelcore-active-provider-state-lifecycle
npm run verify:myocardium-modelcore-active-source-pressure-adapter
npm run verify:myocardium-modelcore-paired-land-source-provider
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

Paired Land source-provider evidence:

```text
data/myocardium/protocols/modelcore-paired-land-source-provider-run-v1.json
data/myocardium/protocols/modelcore-paired-land-source-provider-run-result-v1.json
```

## Route Set

Entry route ids recorded in the gate:

```text
same-closure-period2-positive-control
modelcore-equivalent-closure-positive-control
owner-approved-replacement-criterion
```

The ModelCore-equivalent route was `defined-not-satisfied` through Phase 5C-H
and remained partial through Phase 5C-I/K while the experimental hook and
source-only adapter preconditions were built. Phase 5C-L now records
`status=satisfied-experimental-paired-land-run` and
`routeSatisfactionStatus=satisfied-paired-land-provider-run-finite` for the
paired-result interpretation route only. This unlocks interpretation of the
paired evidence; it does not unlock final no-alternans acceptance, official
morphology acceptance, runtime replacement, schema migration, or case/workbench
wiring. It supersedes the earlier `blocked-until-positive-control-period2`
advancement block for this route; advancement is now constrained by
`second-order-reference-required` before any stronger physiology claim.

Evidence fields required for the ModelCore-equivalent paired route include:

```text
closureProtocolId=modelcore-equivalent-positive-control-closure-v1
closureImplementationStatus=experimental-source-provider-hook-implemented
routeSatisfactionStatus=satisfied-paired-land-provider-run-finite
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
`sourceProviderDifferenceOnly=true`. Phase 5C-L runs Land through that same
closure, records finite period-1 behavior with zero Land solver failures, and
evaluates `sourceProviderDifferenceOnly=true` for the experimental LV
source-only pair. This advances the route from readiness to first
interpretable paired measurement, but second-order/reference robustness and
result interpretation remain required before any final no-alternans claim.

## Boundary

This phase has no runtime replacement, no chamber/case/official-case/Workbench/
state-schema wiring, no production ModelCore adoption beyond the artifact-only
constructor hook, no qDot/valve/afterload tuning, no Land parameter tuning, no
official morphology acceptance, no final no-alternans, no calcium-cycling
alternans acceptance, no RV pressure-overload coverage, no ventricular
interdependence coverage, no right-heart failure coverage, and no TriSeg
adoption.

## PR Granularity

Phase 5C PRs should not become documentation or audit preparation work by
default. The review gate is large enough that excessively small PRs create a
process bias toward readiness artifacts and away from measurement. For this
route, a normal phase PR should include the implementation needed to run the
experiment, the experiment result, focused verifier/test coverage, and only the
docs needed to preserve the claim boundary. If an experiment can be run in the
same PR, it should be run in that PR.
