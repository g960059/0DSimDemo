# Fitting and Verification Mode Plan

Date: 2026-06-05

This note describes the intended foundation for faster parameter fitting without
letting fast approximations become acceptance criteria.

## Modes

- `preview`: interactive UI mode. It prioritizes responsiveness and should not
  be used as the final source of truth for parameter acceptance.
- `fitFast`: headless candidate triage. It uses coarser integration and a looser
  settle policy to reject obviously bad candidates before expensive morphology
  review.
- `verifyAccurate`: final acceptance. It uses stricter convergence, a denser
  sample rate, a longer beat window, projector-quiet checks, and normal-baseline
  morphology gates.

## Verification Contract

Each gate returns `{ id, severity, status, value, threshold, score, message }`.
Hard gates decide whether a candidate can be accepted. Soft gates contribute to
ranking and review but do not alone reject a candidate.

Hard gates are reserved for numerical validity and required baseline morphology:
steady convergence, finite samples, health not failed, flow balance, quiet TBV
projection when required, pressure-floor avoidance, competent-valve
regurgitation limits, LA/RA figure-eight loops, biphasic MV/TV inflow, readable
PVF S/D/Ar, and normal right-heart physiology.

Soft gates are for closeness to clinical targets and model-comparison shape
quality, such as apparent elastance width and exact pressure/flow target
matching.

## Fitting Workflow

1. Define a bounded parameter space with physiologically interpretable ranges.
2. Generate candidates using one-at-a-time scans or small constrained grids.
3. Run `fitFast` on each candidate.
4. Reject candidates on hard failures before expensive shape or literature
   review.
5. Rank surviving candidates by soft score and target residual.
6. Re-run only the top candidates with `verifyAccurate`.
7. Promote the accepted parameter set into tests and durable documentation.

## Physiological Review

After parameter fitting, the accepted candidate still needs explicit
physiology/literature review. The report should capture the realised metrics and
shape summaries, then compare them with normal adult ranges and the model's own
intended teaching morphology.

Important interpretation limits:

- `ELV_active` and `ERV_active` are apparent elastance waveforms, not Ees
  regression values.
- Active-stress passive parameters and legacy time-varying-elastance
  `alpha/beta` are not directly comparable because their pressure laws differ.
- `PVF` is model flow in mL/s, not Doppler velocity. S/D/Ar morphology and
  fractions are more portable than raw velocity cutoffs.
- Normal-baseline gates must be opt-in. Pathologic case verification should use
  case-specific gates and directionality checks, not healthy adult gates.

## Initial Implementation Scope

The first branch should implement reusable verification profiles, morphology
metrics, a report API, and a thin candidate evaluator. It should not yet build a
full optimizer or user-facing fitting UI.
