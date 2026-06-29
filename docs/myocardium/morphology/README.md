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

1. Use the current-main baseline snapshot in
   [`pv-loop-current-main-baseline-snapshot-v1.md`](../verification/pv-loop-current-main-baseline-snapshot-v1.md)
   as the post-PR #196 morphology reference.
2. Derive or emit the missing diagnostic-only E/A-like inflow proxy for the
   three residual dobutamine RV filling groups.
3. Use Phase 5X style normal-floor and user-knob sweeps for LV Land default
   candidate decisions before detailed official-case tuning.
4. Keep filling jaggedness/figure-eight work in the atrial A1/refined atrial
   lane and ejection squareness/incisura work in the arterial Zc/root lane; do
   not tune myocardium parameters to hide those blockers.
5. Define and run an isolated arterial bench for direct Zc/reflection signal
   generation.
6. Feed BLOCKER/ADVISORY/OUT-OF-SCOPE results to the myocardium roadmap.

## Handoff rule

Morphology can block myocardium interpretation, but it cannot make myocardium claims pass. A myocardium result becomes accepted only when the required myocardium gate also passes.
