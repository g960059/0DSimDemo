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

1. Use the current-main baseline snapshot in
   [`pv-loop-current-main-baseline-snapshot-v1.md`](../verification/pv-loop-current-main-baseline-snapshot-v1.md)
   as the post-PR #196 morphology reference.
2. Derive or emit the missing diagnostic-only E/A-like inflow proxy for the
   three residual dobutamine RV filling groups.
3. Run a paired stock-active versus developer-only LV Land morphology matrix
   under the same official-case diagnostic runner.
4. Define and run an isolated arterial bench for direct Zc/reflection signal
   generation.
5. Feed BLOCKER/ADVISORY/OUT-OF-SCOPE results to the myocardium roadmap.

## Handoff rule

Morphology can block myocardium interpretation, but it cannot make myocardium claims pass. A myocardium result becomes accepted only when the required myocardium gate also passes.
