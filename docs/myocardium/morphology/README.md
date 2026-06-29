# Myocardium morphology lane

Status: diagnostic lane; Phase M1 current-main residual blocker classification recorded
Scope: PV-loop and waveform morphology diagnostics; no runtime replacement authority

## Purpose

The morphology lane owns PV-loop and waveform evidence. It measures what the
user sees and classifies likely artifact sources. It makes no official
morphology pass claim and no runtime replacement claim; no-alternans remains
outside this lane.

This separation exists to prevent PV-loop appearance problems from being pushed into Land parameters or myocardial source-stress decisions.

## Owned artifacts

The morphology lane owns or coordinates:

```text
pv-loop-morphology-quality
filling-limb-artifact-audit
filling-limb-correlation-readiness
filling-limb-diagnostic-comparator
arterial-load-morphology
arterial-load-zc-reflection-comparator
PV-loop debug overlay
valve/qDot/clamp marker exports
```

## Outputs to the myocardium lane

Morphology produces evidence packages, not acceptance conclusions.

Required handoff fields:

```text
caseId
branchId
chamber
phaseLabel
metricId
metricValue
comparisonTarget
confidence
suspectedLane
claimBoundary
nextRecommendedExperiment
artifactPaths
```

## Result classes

### BLOCKER

Morphology evidence makes a myocardium interpretation unsafe.

Examples:

- qDot/valve event windows dominate a reported low-preload branch;
- pressure floor or clamp use coincides with an apparent morphology improvement;
- raw vs resampled metrics reverse a candidate ranking.

### ADVISORY

Morphology issue is present but does not block the current myocardium claim.

Examples:

- mild ejection-limb squareness with no effect on source-stress or solver-readiness claims;
- PV-loop display issue isolated to resampling or overlay only.

### OUT-OF-SCOPE-FOR-MYOCARDIUM

The issue belongs to another lane and should not be fitted away by myocardium parameters.

Examples:

- aortic-root/Zc/reflection signal gap;
- valve closure/incisura morphology;
- atrial bridge roughness contaminating filling.

## Not owned by this lane

Morphology lane must not claim or change:

- Land equation correctness;
- source stress scale acceptance;
- myocardial homogenization acceptance;
- no runtime replacement;
- official case acceptance;
- no final no-alternans;
- qDot/valve/afterload fixes;
- parameter tuning as a hidden morphology fix.

## Current next actions

Phase M1 records the compact post-PR #219 current-main blocker bundle in
[`../../../data/myocardium/protocols/morphology-blocker-bundle-phase-m1-result-v1.json`](../../../data/myocardium/protocols/morphology-blocker-bundle-phase-m1-result-v1.json).
Run `npm run verify:myocardium-morphology-blocker-bundle` to verify it.

The Phase M1 bundle reruns the PV-loop morphology diagnostic and both existing
diagnostic comparators. It records 7 branches, 17,304 metric rows, and 60,572
sample rows. The filling comparator is now 39/42 interpretable; the only
remaining uninterpretable groups are `lv-failure-dobutamine` branch 1 RV beats
1-3, each missing only `eaLikeInflowProxy` while all other residual
anti-gaming readouts are available. The arterial-load comparator remains 42/42
internally interpretable, but direct Zc/reflection signals remain
`missing-no-proxy` with proxy use forbidden and no hypothesis promotion.

Phase M1 is a current-main residual blocker classification. It does not clear
the full morphology blocker set, does not run a paired LV Land-vs-stock
morphology matrix, and does not run an isolated arterial bench.

Phase 5X adds the first user-knob robustness preflight for an early LV Land
default-candidate posture:
[`../../../data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json`](../../../data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json).
Run `npm run verify:myocardium-lv-land-default-candidate-preflight` to check it.
It uses synthetic one-axis sweep points instead of tuning official cases. The
current result blocks default flip because the normal operating floor and
absolute morphology checks are not yet clear, while keeping legacy active-stress
frozen as reference and keeping SDIRK2 alternans closure parallel to product
migration.

Phase 5Y localizes the Phase 5X LV qDot blocker:
[`../../../data/myocardium/protocols/lv-land-qdot-blocker-localization-phase5y-result-v1.json`](../../../data/myocardium/protocols/lv-land-qdot-blocker-localization-phase5y-result-v1.json).
Run `npm run verify:myocardium-lv-land-qdot-blocker-localization` to check it.
All 14 Land points show direct AoV qDot raw/post clamp engagement, but the
Phase 5X morphology `qDotClampHitFraction=1` signal is amplified by the short
morphology-classified ejection core relative to the broader AoV-open window.
This is diagnostic-only blocker localization, not qDot/valve tuning or
official morphology acceptance.

Phase 5Z then localizes the short ejection-window denominator:
[`../../../data/myocardium/protocols/lv-land-ejection-window-localization-phase5z-result-v1.json`](../../../data/myocardium/protocols/lv-land-ejection-window-localization-phase5z-result-v1.json).
Run `npm run verify:myocardium-lv-land-ejection-window-localization` to check
it. After per-beat normalization, 13/14 Land points classify as
`no-phase5x-window-amplification` and only HR120 remains
`classifier-window-denominator-amplification-dominant`; the physical high-flow
core qDot fraction remains below the predeclared dominance threshold. This does
not support a dominant short-window denominator explanation and points next to
arterial root/Zc/inertance plus valve/load diagnostics before qDot, valve, load,
or runtime-default changes. This is a next diagnostic hypothesis, not
root-cause acceptance. Contractility-low/high Land branches match normal-floor
in this artifact, so those points record matrix coverage rather than independent
Land contractility sensitivity.

Phase 5AA records the first arterial root inertance bench:
[`../../../data/myocardium/protocols/arterial-root-inertance-bench-phase5aa-result-v1.json`](../../../data/myocardium/protocols/arterial-root-inertance-bench-phase5aa-result-v1.json).
Run `npm run verify:myocardium-arterial-root-inertance-bench` to check it. The
bench is an offline prescribed-pressure AoV/root replay over the Phase 5X
synthetic user-knob matrix for stock active and developer-only LV Land. qDot
and valve thresholds are fixed, no myocardium or load parameters are tuned, and
no ModelCore equation is changed. Lower-clamp root inertance candidates are
found without severe forward-volume or duration loss in 27/27 health-ok
stock/Land runs, including 14/14 health-ok Land runs. The raw replay signal is
28/28, but the failed-health stock HR120 run is tracked separately rather than
used in the headline. Median current replay AoV-open clamp fraction is
`0.518773`, and median best-candidate clamp reduction is `1`. This is a
diagnostic signal for a narrower arterial root/Zc/inertance candidate, not
closed-loop adoption, direct Ao_SA calibration, valve-timing evidence,
Zc/reflection availability, root-cause acceptance, or official morphology
acceptance. `bestCandidateId` is clamp-reduction prioritized diagnostic
ranking, not a direct physical adoption choice; closed-loop follow-up should
treat lower inertance values as a Pareto region against output preservation.

Phase 5AB records that closed-loop follow-up:
[`../../../data/myocardium/protocols/arterial-root-inertance-closed-loop-phase5ab-result-v1.json`](../../../data/myocardium/protocols/arterial-root-inertance-closed-loop-phase5ab-result-v1.json).
Run `npm run verify:myocardium-arterial-root-inertance-closed-loop` to check it.
The diagnostic uses the existing `AoV_L` carrier as an effective AoV/root
boundary inertance sweep over the full Phase 5X synthetic matrix plus a bounded
low-preload edge, for stock active and developer-only LV Land. It keeps qDot
clamps, valve thresholds, valve loss terms, load/preload, Tref,
source-stress scale, and Land parameters fixed. The current result finds
72/83 health-ok output-preserved candidate comparisons with lower AoV-open
qDot clamp engagement, out of 90 total candidate comparisons, including 36
health-ok Land comparisons. 67 health-ok candidate comparisons show at least
one positive morphology proxy, with 70 raw morphology proxy signals tracked
separately. Median Pareto clamp reduction is `0.829895`, and median Pareto
forward-volume ratio is `1.007398`. This supports carrying a narrow effective
root-inertance Pareto region into a separate off-by-default prototype or
impedance bench, not qDot clamp removal, direct Ao_SA adoption, valve-timing
acceptance, root-cause/fix acceptance, or official morphology acceptance. The
low-preload edge remains bounded edge evidence and does not unlock final
no-alternans.

Phase 5AC records the direct isolated arterial root/Zc impedance bench:
[`../../../data/myocardium/protocols/arterial-root-zc-impedance-bench-phase5ac-result-v1.json`](../../../data/myocardium/protocols/arterial-root-zc-impedance-bench-phase5ac-result-v1.json).
Run `npm run verify:myocardium-arterial-root-zc-impedance-bench` to check it.
The bench linearizes the current systemic arterial load and computes direct
input impedance spectra for current `AoV_L` plus the Phase 5AB total 2x/3x/4x
effective AoV/root inertance candidates under a prescribed 70mL/250ms ejection
flow. DC resistance stays invariant at `0.875537` mmHg*s/mL, while the 20Hz
direct high-frequency bench readout rises from `3429400.81599` Pa*s/m^3 to a
candidate range of `7617834.189257`-`15994702.168151` Pa*s/m^3. This fills a
direct isolated-bench input impedance readout for the root/Zc lane, but
reflection coefficient remains `unavailable-no-proxy` because the 0D lumped
bench does not model wave travel/reflection. Phase 5AC is not a closed-loop
runtime change, not physical Zc calibration, not direct Ao_SA adoption, not
qDot clamp removal, not root-cause/fix acceptance, and not official morphology
acceptance. The next morphology step is an off-by-default root/Zc prototype
or a sourced calibration pass, not qDot/valve tuning.

Phase 5AD records that off-by-default root/Zc prototype smoke:
[`../../../data/myocardium/protocols/arterial-root-zc-prototype-smoke-phase5ad-result-v1.json`](../../../data/myocardium/protocols/arterial-root-zc-prototype-smoke-phase5ad-result-v1.json).
Run `npm run verify:myocardium-arterial-root-zc-prototype-smoke` to check it.
The selected stock/Land smoke points compare current closure, the Phase 5AB
`AoV_L` 2x boundary carrier reference, direct `Ao_SA.L` 1.5x/2x edge overrides,
and a combined `AoV_L` 2x + `Ao_SA.L` 1.5x candidate while keeping qDot,
valves, load/preload, Tref, source-stress, and Land parameters fixed. The
artifact records 5 measured-health-ok lower-clamp output-preserved comparisons
for the AoV-boundary carrier reference, 0 for direct `Ao_SA.L`-only candidates,
and 3 for the combined candidate, with the combined path classified as not
robust.
This blocks direct `Ao_SA.L` adoption as the root/Zc fix from this smoke
evidence; it is a routing diagnostic, not root-cause/fix acceptance or official
morphology acceptance.

Phase 5AE records an experimental boundary/root inertance mechanism:
[`../../../data/myocardium/protocols/arterial-root-boundary-inertance-phase5ae-result-v1.json`](../../../data/myocardium/protocols/arterial-root-boundary-inertance-phase5ae-result-v1.json).
Run `npm run verify:myocardium-arterial-root-boundary-inertance` to check it.
The mechanism keeps the same selected stock/Land smoke points and carries the
Phase 5AD AoV-boundary signal without direct `Ao_SA.L` adoption: 5
measured-health-ok signal comparisons for the boundary/root mechanism, 5 for
the AoV-boundary carrier reference, and 7 measured-health-ok carrier/mechanism
matches. This is an experimental hook using the existing AoV flow state, not a
new topology edge, production adoption, sourced Zc calibration, qDot clamp
removal, root-cause/fix acceptance, or official morphology acceptance.

Phase 5AF records the sourced Zc calibration pass:
[`../../../data/myocardium/protocols/arterial-root-zc-calibration-phase5af-result-v1.json`](../../../data/myocardium/protocols/arterial-root-zc-calibration-phase5af-result-v1.json).
Run `npm run verify:myocardium-arterial-root-zc-calibration` to check it. The
artifact compares the Phase 5AC 20Hz direct high-frequency bench readouts
against a sourced `Zao` anchor of mean `0.056` and SD `0.012` mmHg*s/mL
(`0.044`-`0.068` preferred sourced Zc range; `0.032`-`0.080` broad range).
Current closure is below the broad range, the total 2x AoV/root candidate that
matches the Phase 5AE boundary/root mechanism is inside the preferred range,
and total 3x/4x candidates are above the broad range. This is diagnostic
calibration for the next closed-loop valve/load timing experiment, not
production/default root/Zc adoption, qDot clamp removal, reflection coefficient
claim, root-cause/fix acceptance, or official morphology acceptance.

1. Use the current-main baseline snapshot in
   [`pv-loop-current-main-baseline-snapshot-v1.md`](../verification/pv-loop-current-main-baseline-snapshot-v1.md)
   as the post-PR #196 morphology reference.
2. Derive or emit the missing diagnostic-only E/A-like inflow proxy for the
   three residual dobutamine RV filling groups.
3. Carry the sourced-calibrated total 2x boundary/root mechanism into a
   closed-loop valve/load timing diagnostic with qDot and valve thresholds still
   fixed before treating LV `qDotClampHitFraction=1` as a qDot/valve-threshold
   blocker.
4. Use Phase 5X style normal-floor and user-knob sweeps for LV Land default
   candidate decisions before detailed official-case tuning.
5. Keep filling jaggedness/figure-eight work in the atrial A1/refined atrial
   lane and ejection squareness/incisura work in the arterial Zc/root lane; do
   not tune myocardium parameters to hide those blockers.
6. Keep direct Zc/reflection signal generation separate; Phase 5AB does not
   make Zc/reflection availability claims.
7. Feed BLOCKER/ADVISORY/OUT-OF-SCOPE results to the myocardium roadmap.

## Handoff rule

Morphology can block myocardium interpretation, but it cannot make myocardium claims pass. A myocardium result becomes accepted only when the required myocardium gate also passes.
