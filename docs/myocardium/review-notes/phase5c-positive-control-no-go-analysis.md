# Phase 5C positive-control no-go analysis

Status: proposed review note  
Scope: interpretation only; no runtime/model/solver/official-case change

## Summary

Phase 5C-C/D currently records a useful no-go result, not a Land pass/fail result.

```text
Phase 5C-A:
  fixed legacy activeStress low-preload replay remains period-2 and pinned

Phase 5C-C:
  same-closure legacy activeStress positive control is finite
  but settles to period-1

Therefore:
  the Land generated trajectory under that closure is not interpretable
  as no-alternans evidence
```

The current evidence says the Phase 5C-C assay is not yet faithful enough to test the Land/no-alternans question. A positive-control assay that cannot reproduce the known positive control cannot support a negative conclusion.

## What this means

This is an assay-fidelity finding.

It means:

- the Phase 5C-C surrogate closure does not currently reproduce the pinned legacy period-2 branch;
- the Land run under that closure is not evidence that Land removes alternans;
- same-protocol second-order advancement remains blocked;
- final no-alternans remains not claimed.

It does **not** mean:

- Land fixed alternans;
- Land failed;
- active stress is the root cause;
- qDot, valve, afterload, or arterial load are proven root causes;
- official morphology acceptance is available;
- runtime replacement is available.

## Working hypothesis

The leading working hypothesis is:

```text
low-preload period-2 is closure-sensitive
```

The relevant closure may include:

- qDot clamp behavior;
- valve event surfaces;
- arterial afterload loop;
- venous/preload feedback;
- TBV/projection behavior;
- pressure floors or flow limiters;
- beat selection and sampling policy;
- active-stress length feedback under the actual ModelCore loop.

This should not be shortened to "alternans is closure" as a conclusion. Current evidence is more precise:

```text
the surrogate closure fails the positive control
```

## Required next step

Add a ModelCore-equivalent positive-control closure route.

The goal is to run legacy activeStress and new myocardium under a closure that preserves the relevant event surfaces well enough that the legacy positive control reproduces the period-2 branch.

A route can advance only if it shows:

- same or explicitly equivalent protocol as the pinned legacy low-preload branch;
- legacy activeStress positive control returns period-2 under that closure;
- qDot, valve, afterload, and preload event-surface behavior is preserved or explicitly matched;
- BE-only disappearance is not treated as robust no-alternans;
- SDIRK2 or equivalent second-order reference remains required for final interpretation.

## Suggested route name

```text
modelcore-equivalent-closure-positive-control
```

## Boundary

This review note does not authorize:

- runtime replacement;
- official morphology acceptance;
- Land no-alternans claim;
- qDot/valve/afterload tuning as a hidden fix;
- TriSeg adoption;
- RV pressure-overload/interdependence/RHF coverage.

## Handoff to teams

### Myocardium lane

Owns the positive-control closure fidelity question and Land/new-myocardium interpretation.

### Morphology lane

Provides event-surface and morphology evidence that can explain why a closure is or is not equivalent.

### Owner decision

If the pinned legacy period-2 branch cannot be reproduced under any practical equivalent closure, owner must approve an explicit replacement criterion. That criterion must state why the legacy period-2 positive control is no longer the acceptance target and what supersedes it.
