# Starling low-preload period-2 investigation

Date: 2026-06-10

This note records a known limitation in the adaptive Starling sweep work. It is intentionally merged with the runtime changes so math-model reviewers who only inspect `main` can reproduce the current context.

## Symptom

In the default active-stress model, low-preload Starling sweep points can show a dip/re-rise pattern on the LV/LAP side. The issue is most visible near large negative TBV deltas such as about `-1250 mL`.

Representative low-preload chain values from debug runs:

| delta mL | LAP mmHg | RAP mmHg | CO_L L/min | CO_R L/min | pulmonary VR L/min | settle |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 0 | 6.87 | 3.53 | 5.38 | 5.53 | 5.38 | converged |
| -1000 | 1.60 | 1.14 | 3.99 | 4.28 | 4.30 | cap |
| -1125 | 1.35 | 1.00 | 2.93 | 4.05 | 4.04 | cap |
| -1250 | 1.31 | 0.91 | 5.35 | 3.85 | 3.84 | cap |
| -1375 | 0.95 | 0.81 | 4.84 | 3.59 | 3.59 | cap |
| -1500 | 0.70 | 0.75 | 3.01 | 3.35 | 3.38 | cap |

## Main finding

The `-1250 mL` region is not a simple display, interpolation, or warm-start artifact. The active-stress LV enters a period-2 alternans:

| beat type | CO_L L/min | CO_R L/min | VLVmin mL | QAoMax mL/s | LVPmax mmHg |
| --- | ---: | ---: | ---: | ---: | ---: |
| low-output beat | ~2.29 | ~3.80 | ~56.6 | ~859 | ~68 |
| high-output beat | ~5.32 | ~3.81 | ~31.5 | 1500 clamp | ~82.5 |

Two-beat averages are much more balanced:

| two-beat average | value |
| --- | ---: |
| CO_L | ~3.805 L/min |
| CO_R | ~3.805 L/min |
| LAP | ~1.25 mmHg |

Before PR #108, the steady-state and metrics path was period-1 oriented. `settling.ts` compared consecutive beat fingerprints and `ModelCore.metrics()` read the last complete beat window. For a period-2 limit cycle, this meant settle reached cap and the Starling point could represent only one of the alternating beats.

PR #108 adds period-2 detection and period-aware metrics. When same-phase beats repeat stably, Starling points use a two-beat mean and carry `period-2` metadata. This is a measurement fix only; it does not decide whether the low-preload alternans is physiological or a model artifact.

## Negative controls

Observed during local debug work:

- `heartModel: "elastance"` is stable at the same low-preload target.
- Disabling dynamic flow clamp does not remove the problem; it increases amplitude.
- Main valve reverse flow does not explain the apparent CO rise.
- Warm-start state carryover is not sufficient to explain it. Cold start also reaches the same period-2 attractor.
- Resetting valve flow/opening state or LV active internal state after retarget does not remove the period-2 attractor.
- Disabling force-velocity coupling alone does not remove it.
- AoV inertance changes alter the amplitude but do not remove it.
- Septal/pericardial coupling is not the initiating cause.
- Lowering LV `betaLambda` reduces or removes the alternans around this point, but naive retuning can introduce other low-volume clamp/overcontractility artifacts.

## Working interpretation

There are two separate issues:

1. Measurement/steady-state semantics: period-2 Starling points now use two-beat average metrics and are labeled as period-2. ESPVR still needs separate handling because end-systolic points should not be averaged into one synthetic beat.
2. Active-stress low-preload dynamics: the LV active-stress equations can enter a period-2 attractor at low preload. This may be physiological alternans, a model artifact, or a parameterization problem. The current strongest candidate is the low-volume interaction of length-dependent activation (`betaLambda`), active stress target shape, thick-sphere geometry, and dynamic AoV coupling.

## Candidate root fixes

- Extend period-k handling beyond period-2 only if future model review shows higher-period attractors.
- Add ESPVR-specific period-2 handling: show separate beat-specific ES points or exclude/label them, rather than averaging into a single ES point.
- Separately review active-stress low-preload formulation:
  - LV `betaLambda`
  - low-volume active stress target / `f_iso`
  - AoV dynamic coupling and flow inertia
  - whether period-2 should be accepted as physiological alternans or treated as model artifact

The adaptive sweep runtime is merged before resolving this because it exposes the issue and is useful for further model review. The period-2 problem remains a known open modeling task.
