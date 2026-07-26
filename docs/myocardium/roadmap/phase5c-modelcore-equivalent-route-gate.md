# Phase 5C-H/I/J/K/L/M/N/O/P/Q/R ModelCore-equivalent Route Gate

Status: paired experimental LV source-provider evidence recorded through Phase 5C-L; qDot clamp-threshold attribution recorded through Phase 5C-M; output-match not-overlapped diagnostic recorded through Phase 5C-N; activation/source-interface audit recorded through Phase 5C-O; calcium/source forcing bracket recorded through Phase 5C-P; calcium unit/source-interface audit recorded through Phase 5C-Q; provider-local Land SDIRK2 commit-solver evidence recorded through Phase 5C-R; final no-alternans remains unclaimed

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

Phase 5C-M adds same-closure qDot clamp-threshold attribution for that paired
result. It records that the legacy trace engages the AoV qDot clamp
(`hitFraction=0.0521`, `qAoCapRatioMax=0.997`), while the Land trace does not
(`hitFraction=0`, `qAoCapRatioMax=0.112`) and also runs at lower output. This
supports `clamp-threshold-avoidance-risk-supported`: Land period-1 is still a
positive interpretable signal, but structural alternans removal is not
established. Output-matched paired evidence, SDIRK2 reference evidence, and a
preload-domain sweep remain required before any stronger no-alternans claim.

Phase 5C-N runs the output-match diagnostic as a predeclared TBV-axis matrix,
not as preload tuning. Each same effective-TBV point is independently
initialized, settles by convergence before the 45s cap, and preserves
`sourceProviderDifferenceOnly=true` within that point. The cross-TBV output-match
analysis is explicitly not source-provider-only. The diagnostic status is
`not-overlapped`: the best Land point reaches only 0.376 of pinned legacy CO/SV
and 0.091 of pinned legacy QAo peak. Therefore the preload/TBV axis did not move
Land into the pinned legacy qDot clamp-engaged output regime; clamp-threshold
avoidance remains unresolved and structural alternans removal is not established.

Phase 5C-O audits the activation/source interface at the pinned low-preload point
and the Phase 5C-N best-Land point. Both points preserve same-closure
source-provider-only pairing within point and converge with zero Land solve
failures. The result records `land-source-interface-underactivation-gap-observed`:
the settled Land trace active-stress target is orders of magnitude below legacy
at both diagnostic points, even though provider source/commit path transients can
be higher during the full run. This redirects the next experiment to calcium
input scale/unit audit and explicit matched-regime forcing, not to acceptance.

Phase 5C-P runs that calcium/source forcing bracket under the same non-provider
closure. The explicit source-provider forcing scenarios are not runtime tuning:
qDot, valves, afterload, preload, sampling, and beat selection remain unchanged
within each diagnostic point. All 18 forced Land points converge. Calcium-input
forcing reaches the legacy output and AoV qDot clamp regime while Land remains
period-1. The matched regime is only the predeclared coarse output/qDot regime,
not waveform or morphology acceptance; this is a forcing attribution signal and
a calcium-unit/source-interface audit target, not final no-alternans acceptance.

Phase 5C-Q runs that calcium unit/source-interface audit at the pinned point and
the Phase 5C-N best-Land point under the same non-provider closure. The pinned
legacy LV `c` peak is 0.1523, so a Phase 2B absolute peak free-calcium mapping
uses scale 6.70 and a Land CaT50Ref peak mapping uses scale 5.28. The simple
unit-style calcium mapping `phase2b-absolute-peak-ca` reaches the coarse legacy
output/qDot regime at the pinned point while Land remains period-1. Phase 5C-P's
scale-30 result therefore stays a positive control rather than a required scale.
This is source-interface evidence only: structural alternans removal, final
no-alternans, runtime replacement, and morphology acceptance remain unclaimed.

Phase 5C-R runs the provider-local Land SDIRK2 commit-solver reference check.
It reruns the pinned low-preload point and the Phase 5C-N best-Land point with
legacy source-only, raw Land BE/SDIRK2, and Phase 5C-Q
`phase2b-absolute-peak-ca` Land BE/SDIRK2 cells. ModelCore's global stepper and
non-provider closure are unchanged; SDIRK2 stage inputs are provider-local
interpolation from before/after ModelCore snapshots, not true global ModelCore
stage states. At the pinned mapped point, provider-local SDIRK2 preserves
period-1 and the coarse legacy output/qDot regime with score delta 0.0017 vs
BE, but SDIRK2 stage1 solve failures remain high. The robustness status is
`sdirk2-reference-inconclusive`, so Phase 5C-R cannot be used as final
no-alternans, structural alternans-removal, or global ModelCore SDIRK2 evidence.
It is not a global ModelCore SDIRK2 reference.

Machine-readable gate:

```text
data/myocardium/gates/phase5c-post-fidelity-entry-gate-v1.json
```

Required verifier:

```text
npm run verify:myocardium-modelcore-equivalent-positive-control-closure
npm run verify:myocardium-modelcore-active-provider-state-lifecycle
npm run verify:myocardium-modelcore-active-source-pressure-adapter
npm run verify:myocardium-modelcore-paired-land-source-provider
npm run verify:myocardium-modelcore-paired-land-qdot-clamp-attribution
npm run verify:myocardium-modelcore-paired-land-output-matched-qdot-attribution
npm run verify:myocardium-modelcore-land-activation-interface-audit
npm run verify:myocardium-modelcore-land-calcium-source-forcing-bracket
npm run verify:myocardium-modelcore-land-calcium-unit-interface-audit
npm run verify:myocardium-modelcore-land-sdirk2-reference
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

Paired Land qDot clamp attribution evidence:

```text
data/myocardium/protocols/modelcore-paired-land-qdot-clamp-attribution-result-v1.json
```

Paired Land output-match qDot attribution evidence:

```text
data/myocardium/protocols/modelcore-paired-land-output-matched-qdot-attribution-result-v1.json
```

Land activation/source-interface evidence:

```text
data/myocardium/protocols/modelcore-land-activation-interface-audit-result-v1.json
```

Land calcium/source forcing bracket evidence:

```text
data/myocardium/protocols/modelcore-land-calcium-source-forcing-bracket-result-v1.json
```

Land calcium unit/source-interface evidence:

```text
data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json
```

Land provider-local SDIRK2 commit-solver evidence:

```text
data/myocardium/protocols/modelcore-land-sdirk2-reference-result-v1.json
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
`second-order-reference-required` before any stronger physiology claim. Phase
5C-M further constrains interpretation: qDot clamp-threshold avoidance is a
supported attribution risk until output-matched paired evidence is run. Phase
5C-N records that the predeclared TBV-axis output-match diagnostic is
not-overlapped, so structural attribution still requires SDIRK2 reference
evidence and either explicit output forcing or another owner-approved match axis.
Phase 5C-O records that the settled Land trace active-stress target is orders
below legacy at the pinned and best-Land diagnostic points, so the immediate next
attribution work is calcium/source-scale and explicit matched-regime diagnostics
rather than acceptance. Phase 5C-P runs that diagnostic and records that
calcium-input scaling recovered the legacy output/qDot regime while Land
remains period-1. Phase 5C-Q records that a simple unit-style calcium mapping,
anchored to the Phase 2B absolute peak calcium target, reaches the coarse legacy
output/qDot regime at the pinned point while Land remains period-1. The Phase
5C-R provider-local SDIRK2 commit-solver reference preserves that pinned mapped
output/qDot and period-1 signal, but remains inconclusive because SDIRK2 stage1
commit solves fail. The immediate next work is Level 1-4 operating-point
calibration and an education-tool Definition of Done checkpoint before runtime
design. Further SDIRK2 solver hardening should stay narrow and should not
extend alternans-mechanism subphases unless final no-alternans acceptance is
explicitly in scope.

Phase 5S runs that operating-point calibration diagnostic as a separate
diagnostic-only handoff. The Phase 5C-Q calcium-mapped Land BE provider runs
cleanly at fixed `-1250`, `0`, and `1000` mL points. The `0` and `1000` mL
main-domain points are a coarse legacy output/stress signal and the education
DoD checkpoint is ready for owner review, while low preload remains report-only
edge evidence. This does not change the Phase 5C boundary: no Level 3/4
acceptance, no runtime replacement, no official morphology acceptance, no final
no-alternans, and no structural alternans removal are claimed.

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
Phase 5C-M records the first same-closure attribution measurement and shows that
Land avoids AoV qDot clamp engagement at a lower-output operating point; that
narrows the next experiment to output matching rather than acceptance. Phase
5C-N runs that first output-match diagnostic and records output-match
not-overlapped, which keeps clamp-threshold avoidance unresolved rather than
accepting structural alternans removal. Phase 5C-O records the activation/source
interface gap that explains why the TBV-axis output-match route did not overlap.
Phase 5C-P records that explicit calcium-input forcing placed Land in the
legacy output/qDot regime while Land remains period-1, so pure low-output
clamp-avoidance is weakened but final structural interpretation still waits for
calcium-unit audit and SDIRK2. Phase 5C-Q records that the Phase 2B absolute
peak calcium mapping is already sufficient to enter that coarse regime at the
pinned point, while scale 30 remains a positive-control reference only. Phase
5C-R records provider-local SDIRK2 commit-solver evidence, not global ModelCore
SDIRK2 evidence; its stage1 solve failures keep second-order robustness
inconclusive.

## Boundary

This phase has no runtime replacement, no chamber/case/official-case/Workbench/
state-schema wiring, no production ModelCore adoption beyond the artifact-only
constructor hook, no global ModelCore SDIRK2 claim, no qDot/valve/afterload
tuning, no Land parameter tuning, no official morphology acceptance, no final
no-alternans, no calcium-cycling alternans acceptance, no RV pressure-overload
coverage, no ventricular interdependence coverage, no right-heart failure
coverage, and no TriSeg adoption.

## PR Granularity

Phase 5C PRs should not become documentation or audit preparation work by
default. The review gate is large enough that excessively small PRs create a
process bias toward readiness artifacts and away from measurement. For this
route, a normal phase PR should include the implementation needed to run the
experiment, the experiment result, focused verifier/test coverage, and only the
docs needed to preserve the claim boundary. If an experiment can be run in the
same PR, it should be run in that PR.

Oracle GPT Pro/extended is not a per-PR review gate. Roughly every 3-5 Phase 5C
PRs, ask the `循環動態シミュレーター` project for a broad, flat current-state and
future-direction review, without framing it as a PR review or narrowing the
answer space. If a PR-specific oracle escalation is still needed, cap it at two
oracle interactions for that PR/session.
