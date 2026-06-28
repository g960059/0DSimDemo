# Myocardium morphology lane

Status: proposed lane index
Scope: PV-loop and waveform morphology diagnostics; no myocardium runtime replacement authority

## Purpose

The morphology lane owns PV-loop and waveform evidence. It measures what the user sees and classifies likely artifact sources, but it does not by itself accept a myocardial model, official morphology pass, no-alternans result, or runtime replacement.

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
- runtime replacement;
- official case acceptance;
- final no-alternans;
- qDot/valve/afterload fixes;
- parameter tuning as a hidden morphology fix.

## Current next actions

1. Freeze the latest post-PR morphology baseline artifact.
2. Run off-by-default filling-limb comparator experiments.
3. Define and run an isolated arterial bench for Zc/reflection signal generation.
4. Feed BLOCKER/ADVISORY/OUT-OF-SCOPE results to the myocardium roadmap.

## Handoff rule

Morphology can block myocardium interpretation, but it cannot make myocardium claims pass. A myocardium result becomes accepted only when the required myocardium gate also passes.
