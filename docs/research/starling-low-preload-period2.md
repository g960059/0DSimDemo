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

## Root-cause synthesis after PR #108

External model reviews and local subagent reviews converged on the same interpretation: the low-preload dip/re-rise is best viewed as a beat-to-beat Poincare map crossing a flip bifurcation, not as a plotting or interpolation bug.

The leading mechanism is:

```text
low preload -> LV lambda changes -> Kd/aInf and active force change ->
stroke volume changes -> next-beat LV preload changes
```

At low preload this one-beat delayed feedback can have gain below `-1`, producing a stable period-2 alternans. The strongest code-level suspects are in `engine/chambers.ts`:

- `Kd = Kd0 * exp(-betaLambda * (lambda - 1) + betaKd * betaDrive)`.
- `f_iso = clamp((lambda - lambdaPas0 + 0.3) / 0.35, 0, 1)`.
- LV/RV default tension filtering is effectively off (`tauTensionRiseSec = 0`, `tauTensionFallSec = 0`, `tensionInstantMix = 1`).
- Dynamic AoV flow/inertance and the `1500 mL/s` flow clamp shape the high-output half of the alternans, but current evidence suggests they are not the initiating cause.

The valve-flow review found no evidence that nominal valves are producing true reverse flow. Default valves have `Aleak = 0`, and the dynamic valve predictor clamps no-leak reverse flow to zero. A low-preload probe around `-1250 mL` showed period-2 behavior and many clamp hits, but all four nominal valve reverse volumes were zero or near-zero. Therefore reverse flow should remain a diagnostic check, not the primary hypothesis.

The most likely root-cause classes are:

1. Excess low-stretch length-dependent activation gain.
2. Non-smooth or overly steep low-stretch force-length gating.
3. Lack of active tension dynamics / damping.
4. Valve-flow and pressure coupling amplifying an already marginal alternans.
5. Node-specific low-volume clamps, especially pulmonary venous nodes, shaping the edge cases.

## Diagnostic tool

`npm run debug:starling-low-preload` generates a compact low-preload march report under `artifacts/starling-low-preload-debug/<timestamp>/`.

The report compares period-aware metrics with last-single-beat metrics at the same point:

- `CO_L period`: the period-aware Starling value.
- `CO_L last beat`: the old period-1-style measurement for contrast.
- `period`, `adjacentDelta`, `periodDelta`, `worstSignal`.
- nominal valve forward/reverse volumes.
- aggregate health clamp count.

Example:

```bash
npm run debug:starling-low-preload -- --out=artifacts/starling-low-preload-debug/manual
```

After PR #110, the same command also emits root-cause diagnostics:

- `dtScenarios`: the same low-preload march at `dt=0.001`, `0.0005`, and `0.002` by default.
- `beatTrace`: the last complete beats at each delta, including `CO_L/R`, `EDV/ESV`, `LAP/RAP`, `LVPmax`, and `QAoMax`.
- active-stress terms by chamber: `lambda`, `Kd`, `aInf`, `tauA`, `c`, `a`, `sigmaActTarget`, `sigmaAct`, `sigmaPas`, `fIso`, `gOver`, and `forceVelocityScale`.
- clamp attribution: node clamp hits, dynamic-flow clamp hits, and valve diode clamp hits.
- valve trace summaries: min/max flow, forward volume, reverse volume, and negative sample count.
- `beat-trace.csv`: a compact table for plotting LV active-stress terms against beat output.

Useful focused runs:

```bash
npm run debug:starling-low-preload -- --out=artifacts/starling-low-preload-debug/manual --deltas=0,-1200,-1300,-1400 --trace-beats=12
npm run debug:starling-low-preload -- --out=artifacts/starling-low-preload-debug/dt-only --deltas=0,-1250 --dt=0.001,0.0005,0.002
```

Interpretation:

- If the period-2 branch disappears or shifts strongly when `dt` is halved, explicit coupling / numerical integration is implicated.
- If the period-2 branch persists at smaller `dt`, active-stress model dynamics are implicated.
- Valve reverse volume near zero keeps reverse-flow artifacts low on the suspect list.
- Node-specific clamp hits identify whether the low-preload edge is being shaped by LA / pulmonary venous / other low-volume bounds.

This is intentionally not a solver or model fix. It is a reproducible handoff artifact for model review.

## Recommended root-fix experiments

The next model-level PR should be evidence-first. Do not start by hiding points, changing the Starling fit, or lowering `betaLambda` globally.

Recommended order:

1. Build a low-preload return-map/Floquet diagnostic: perturb LV EDV around a settled point and estimate `dEDV(n+1)/dEDV(n)`. The target criterion is keeping the relevant multiplier within `(-1, 1)` over the intended physiologic preload range.
2. Run a dt sensitivity experiment (`0.001`, `0.0005`, possibly `0.002`) at the period-2 point. Strong dt dependence points to numerical coupling; weak dt dependence points to a continuous-model attractor.
3. Add active-stress internal diagnostics: `lambda`, `Kd`, `aInf`, `fIso`, `gOver`, `forceVelocityScale`, `sigmaAct`, `sigmaPas`, and pressure-floor hits per beat.
4. Add node-specific clamp attribution instead of relying on aggregate `clampHitCount`.
5. Only after those diagnostics, test candidate model changes.

Candidate model changes, in increasing blast radius:

- Enable a modest LV/RV active-tension filter so active stress is not an instantaneous function of stretch and activation.
- Smooth the low-stretch `f_iso` ramp with a C1/C2 force-length gate.
- Saturate or filter length-dependent Ca sensitivity at low `lambda`, preserving the normal-preload slope while reducing low-preload dynamic gain.
- Revisit AoV/MV dynamic coupling only if active-stress smoothing leaves a residual alternans.

Several reviewers independently warned against a simple global `betaLambda` reduction. It can remove the period-2 point but also changes low-volume contractility and can introduce clamp/overcontraction artifacts.

## Candidate experiments after PR #110

Follow-up local experiments tested active-stress force-length and activation changes without changing valve equations, dt defaults, Starling sweep display, or settle policy. The baseline comparison is the PR #110 default low-preload march:

| Candidate | Dynamics change | dt=0.001 period-2 | max adjacent delta | max valve reverse mL | Result |
| --- | --- | ---: | ---: | ---: | --- |
| PR #110 baseline | none | 7 / 9 | 0.6057 | 0 | reference |
| Full C2 `fIso` smootherstep | Replace the linear/clamped force-length gate with smootherstep over the same support | 3 / 9 | 0.4052 | 0 | Improves low-preload alternans, but fails the HR100 re-arm settling test (`reason=cap`, `worstSignal=svL`, large L/R CO split). Do not merge. |
| Low-lambda `Kd` saturation | Smoothly saturate the lambda term used by length-dependent calcium sensitivity | 4 / 9 | 0.4372 | 0 | Worse than full C2 `fIso`, still changes activation dynamics. Do not merge. |
| LV/RV active tension filter | Enable short first-order active-tension filtering with rise/fall 0.035/0.070 s | not completed | n/a | n/a | Produces large LV low-volume clamp activity during the march. Do not merge in this form. |
| 35-60% linear/smooth `fIso` blends | Blend the current linear gate with smootherstep | 6 / 9 | 0.5527-0.4920 | 0 | Preserves settling at <=60% blend but improvement is too weak for a root-fix PR. |
| Non-monotone localized blend | Blend back to linear around the normal range | 6 / 9 | 0.7632 | 0 | Can become locally non-monotone in force-length response and worsens the march. Do not merge. |
| Monotone low-stretch C1 gate | Preserve the existing linear gate above a join point and lower only low-stretch active force | 5 / 9 | 0.2796 | 0 | Reduces alternans amplitude and passes settling, but shifts default validation metrics enough that it needs explicit recalibration review before merge. |

The most important negative result is that the only simple `fIso` change with strong low-preload benefit also destabilizes an ordinary HR increase. That suggests the issue is not just the discontinuity of the force-length gate; it is the coupled gain from stretch-sensitive active force, length-dependent calcium sensitivity, and valve/vascular loading.

At this point, a model-fix PR should not ship a hidden force-length curve change by trial and error. The next credible model-level step is one of:

1. A true return-map/Floquet diagnostic around the low-preload branch, with a target multiplier before/after the candidate change.
2. A constrained monotone Hermite `fIso` redesign that is explicitly calibrated to keep normal and HR100 operating points within tolerance while reducing the low-preload return-map gain.
3. A low-stretch active-gain limiter that constrains local gain (`d log active force / d lambda` or the equivalent Poincare-map gain) rather than changing `betaLambda` or `Kd` values globally.

## Candidate root fixes

- Extend period-k handling beyond period-2 only if future model review shows higher-period attractors.
- Add ESPVR-specific period-2 handling: show separate beat-specific ES points or exclude/label them, rather than averaging into a single ES point.
- Separately review active-stress low-preload formulation:
  - LV `betaLambda`
  - low-volume active stress target / `f_iso`
  - AoV dynamic coupling and flow inertia
  - whether period-2 should be accepted as physiological alternans or treated as model artifact

The adaptive sweep runtime is merged before resolving this because it exposes the issue and is useful for further model review. The period-2 problem remains a known open modeling task.
