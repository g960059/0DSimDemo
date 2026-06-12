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
- `returnMap`: an EDV-section, volume-preserving LV/PVein central-difference diagnostic that estimates local one-beat slopes for `EDV_L`, `ESV_L`, `CO_L`, and `LAPMean`.
- `beat-trace.csv`: a compact table for plotting LV active-stress terms against beat output.

Useful focused runs:

```bash
npm run debug:starling-low-preload -- --out=artifacts/starling-low-preload-debug/manual --deltas=0,-1200,-1300,-1400 --trace-beats=12
npm run debug:starling-low-preload -- --out=artifacts/starling-low-preload-debug/dt-only --deltas=0,-1250 --dt=0.001,0.0005,0.002
npm run debug:starling-low-preload -- --out=artifacts/starling-low-preload-debug/lambda-act --deltas=0,-1200,-1250,-1300,-1400 --dt=0.001,0.0005 --lambda-act-tau=0,0.15,0.25,0.4
```

Interpretation:

- If the period-2 branch disappears or shifts strongly when `dt` is halved, explicit coupling / numerical integration is implicated.
- If the period-2 branch persists at smaller `dt`, active-stress model dynamics are implicated.
- Valve reverse volume near zero keeps reverse-flow artifacts low on the suspect list.
- Node-specific clamp hits identify whether the low-preload edge is being shaped by LA / pulmonary venous / other low-volume bounds.
- Return-map slopes first advance to the next LV EDV section, perturb the serialized state by `LV +/- 0.5 mL` and `PVein -/+ 0.5 mL`, then measure the next complete beat. EDV/ESV slopes are one-coordinate section slopes; CO/LAP slopes are response slopes with their own units. Values near or above unit magnitude for volume slopes should be read as a reason to inspect local gain, not as proof of a specific fix.

After PR #113 the same report adds a v2 return-map and an off-by-default `lambdaAct` experiment:

- `oneBeat` and `twoBeatSamePhase` central differences are both reported. `oneBeat` estimates the next-beat Poincare response; `twoBeatSamePhase` measures the response two beats later, which is the more relevant same-phase map once a period-2 attractor is present.
- `branchAmplitude` reports the last two-beat high/low amplitude for `EDV_L`, `ESV_L`, `CO_L`, and `LAPMean`.
- `clampCrossing` / `nonsmooth` mark return-map points where the finite-difference perturbation passes through clamp activity; these slopes should be treated as diagnostic context rather than primary calibration targets.
- `--lambda-act-tau` injects `tauLambdaActSec` through `nodeOverrides.*.active` for debug runs only. The shipped model is `tau=0`. Positive tau values add a chamber internal `lambdaAct` state and use it only as the length input to `Kd` and `fIso`; passive pressure, raw geometry, `gOver`, force-velocity coupling, and valves continue to use instantaneous `lambda`.
- The report includes `lambdaRaw`, `lambdaAct`, `tauLambdaActSec`, `dLogAInf_dLambda`, `dLogFIso_dLambda`, `dLogGOver_dLambda`, and `dLogCompositeActive_dLambda` so reviewers can see whether a tau value reduces low-stretch active gain without hiding clamp or valve diagnostics.

This is still not a default model change. `lambdaAct` is an experiment designed to test the external model-team hypothesis that low-preload period-2 is driven by excessive beat-to-beat active-stretch gain. Default adoption requires a separate PR with normal/default, HR100, Guyton/Starling, clamp, valve, and return-map acceptance checks.

After PR #114 the same report tightens the evaluation gate without changing model dynamics:

- Report schema v5 treats last-two-beat `branchAmplitude` and `branchAmplitudeFraction` as the primary classifier-independent signal. A lower `period-2 count` is not considered improvement if adjacent-beat amplitude remains large.
- Active-stress static-gain fields are also emitted as `dLogAInf_dLambdaAct`, `dLogFIso_dLambdaAct`, `dLogGOver_dLambdaRaw`, and `dLogCompositeActive_dLambdaAct`. The `lambdaAct` composite intentionally covers the `Kd/aInf + fIso` path only; `gOver` remains a raw-lambda gain and is reported separately. The older `...dLambda` aliases remain for compatibility, but reviewers should read the new names when `tauLambdaActSec > 0`.
- Return-map output now contains two modes:
  - `volumeLambdaActFixed`: the original volume-preserving LV/PVein perturbation with active-stretch memory held fixed.
  - `volumeLambdaActReset`: the same perturbation, but LV `lambdaAct` is reset to the post-perturbation raw LV stretch before the Poincare march. This is a quasi-static consistency check for `lambdaAct` experiments.
- `nonsmooth` / `clampCrossing` slopes remain reportable context but should be excluded from model calibration objectives. Clamp activity itself remains an independent rejection/stress signal.

This is intentionally not a solver or model fix. It is a reproducible handoff artifact for model review.

After PR #115 the diagnostic workflow is split into a fast branch-first pass and a selected return-map pass:

- `--return-map-mode=none|fixed|reset|both` controls whether EDV-section return-map diagnostics are computed. The default remains `both` for compatibility.
- `--branch-only` is an alias for `--return-map-mode=none`; it keeps period, branch-amplitude, clamp, valve, and active-stress diagnostics while skipping expensive return maps.
- `--max-return-map-points=N` limits return-map diagnostics to suspicious points selected by branch amplitude, clamp activity, lowest finite preload, and the `-1250 mL` baseline representative when present.
- `--lambda-act-scope=lv|ventricles|all` applies off-by-default `tauLambdaActSec` only to the selected active chamber set. The default is `all`, matching the earlier report behavior.
- `--lambda-act-terms=kd|fiso|kd+fiso` chooses which active-stress length inputs use the lagged `lambdaAct` state. `kd` lags only length-dependent calcium sensitivity, `fiso` lags only the force-length gate, and `kd+fiso` preserves the original comparator behavior.
- `--quiet-clamp-log` suppresses console clamp spam during debug runs while preserving clamp counters in `report.json`.

For broad model-team comparisons, prefer the matrix runner:

```bash
npm run verify:starling-low-preload-matrix -- \
  --out=artifacts/starling-low-preload-debug/manual-matrix \
  --deltas=0,-900,-1000,-1100,-1200,-1250,-1300,-1400,-1500,-1600 \
  --dt=0.001,0.0005 \
  --lambda-act-tau=0,0.05,0.10,0.15,0.20,0.40 \
  --lambda-act-scope=lv,ventricles \
  --lambda-act-terms=kd,fiso,kd+fiso \
  --max-return-map-points=6
```

The matrix runner first performs branch-only marches across the full grid, then replays each selected scenario with `return-map-mode=both` while computing EDV-section return maps only for the selected suspicious deltas. `tau=0` is term/scope independent and is run once per dt. Positive tau values expand across scope and term. The report also includes normal and HR100 waveform gates so low-preload improvement can be checked against ordinary waveform distortion before any model-fix candidate is promoted. It writes:

- `matrix-report.json`
- `matrix-report.md`
- `branch-table.csv`

This keeps the default debug command available for deep single-scenario investigation, while making tau/scope sweeps cheap enough to run routinely.

Interpretation guardrails:

- A strong `kd` result does not prove Kd is the root cause. It means the low-preload active-stretch gain is sensitive to the length-dependent calcium path under this comparator.
- A strong `fiso` result does not license a hidden force-length reshape. Any fIso/composite-gain change still needs normal/HR100 waveform gates and validation.
- Treat branch amplitude, clamp activity, and normal/HR100 waveform deltas together. Reducing period-2 while increasing clamp hits or distorting LVP/QAo/dPdt is not a root fix.

After PR #118 the same workflow adds a clamp/TBV projection contamination audit:

- `sanitizeState()` now reports quantitative signed and absolute volume/pressure repair deltas, aggregated by node for the last step, current beat, and last beat.
- TBV projection now reports requested and applied correction, before/after TBV error, and node-level applied deltas.
- `--tbv-correction=on|off|low` lets debug and matrix runs compare the current default projection, a projection-off negative control after retargeting, and a low-gain diagnostic projection mode. The default model remains `on`.
- Each point includes a `tbvAudit` block and a `clean` / `contaminated` classification. Contamination means clamp repair or TBV projection moved volume by a non-negligible amount during the measured settle window.
- Matrix summaries include `maxSanitizeAbsMl`, `maxProjectionAppliedMl`, `contaminatedPointCount`, and correction-mode comparisons of branch amplitude.

Use this audit before interpreting `lambdaAct`, Kd/aInf, or fIso changes as root fixes. If period-2 branch amplitude persists with `tbv-correction=off` and clamp-clean points, the active-stretch gain hypothesis remains the leading next target. If branch amplitude changes mainly with projection mode or clamp contamination, first inspect soft floors, conservative state repair, or projection timing before changing active-stress gain.

Example:

```bash
npm run verify:starling-low-preload-matrix -- \
  --out=artifacts/starling-low-preload-debug/clamp-tbv \
  --deltas=0,-1200,-1250,-1300,-1400 \
  --dt=0.001 \
  --lambda-act-tau=0 \
  --tbv-correction=on,off,low \
  --max-return-map-points=3 \
  --trace-beats=4 \
  --sample-hz=60
```

After PR #119 the same branch/matrix workflow can compare off-by-default low-stretch active-gain limiter candidates:

- `--low-stretch-limiter=none|aInfCap|activeReserveCap`
- `--low-stretch-limiter-scope=lv|ventricles|all`
- `--active-reserve-preset=directMild|directMedium|thresholdMild|thresholdMedium`

These are diagnostic comparator arms only. They do not change shipped dynamics unless explicitly enabled through debug parameters:

- `aInfCap` applies a low-raw-lambda activation ceiling. It can only reduce `aInf`; it never lowers `Kd` or increases calcium sensitivity.
- `activeReserveCap` applies a low-raw-lambda active-target multiplier `<= 1`. By default it is a direct low-stretch target cap; if `lowStretchLimiterActivationThreshold` is provided, it becomes high-activation gated. It can only reduce `sigmaActTarget`.

This intentionally avoids the unguarded `phi(lambda)` Kd slope-limiter proposal where low-lambda `phi(lambda) > lambda` could lower `Kd`, raise calcium sensitivity, and worsen low-volume overcontraction/clamp activity. The first acceptance screen for these comparator arms is branch-amplitude reduction with no increase in sanitize/projection contamination, dynamic-flow clamp activity, valve reverse volume, or normal/HR100 waveform distortion.

After PR #120 the matrix also reports whether the branch reduction preserves the actual Starling shape:

- `meanCOLErrorFractionVsBaseline` and `meanSVLErrorFractionVsBaseline` compare each candidate to the no-limiter baseline at matching deltas.
- `lowPreloadMonotonicityViolations`, `dipReRiseScoreLMin`, and `lowPreloadSlopeRatioVsBaseline` check whether the low-preload limb remains interpretable rather than merely flattening or hiding the oscillation.
- `maxActiveReserveHitFraction`, `minActiveReserveScale`, and `maxSigmaActTargetReductionFraction` show how often and how strongly `activeReserveCap` is actually cutting `sigmaActTarget`.

The intended interpretation is strict: a candidate should not be accepted only because `maxBranchAmplitudeFraction` drops. It should reduce branch amplitude while keeping two-beat mean CO/SV and the low-preload curve shape close to baseline, and it should hit mainly in the problematic low-preload/high-output beat rather than ordinary normal or HR100 systole.

PR #121 adds an explicit report classification layer for this interpretation:

- `baseline`: tau=0/no-limiter reference rows.
- `fail`: contamination, waveform regression, mean CO/SV regression, monotonicity breaks, or residual dip/re-rise.
- `mitigator`: branch envelope improves or the mean curve is preserved, but beat-level branch amplitude or clean return-map slopes are still not root-fixed.
- `root-fix-candidate`: small per-delta CO/EDV/ESV branch envelope plus clean selected return-map slopes away from the flip threshold.

This is deliberately conservative. The PR #120 `activeReserveCap directMedium` smoke is a strong leading comparator, but its representative CO branch fraction around `0.29` is still residual alternans. It should be read as a mitigator until a wider matrix shows that per-delta branch fractions are small and clean one-beat/two-beat EDV slopes move away from the flip threshold across the low-preload branch.

PR #122 adds two false-positive guards to that classification:

- A `root-fix-candidate` must have clean scalar EDV return-map slope coverage at the worst branch delta. If the worst delta is contaminated, nonsmooth, clamp-crossing, skipped, or otherwise lacks a clean slope, the row remains a mitigator/inconclusive even when the summary branch envelope looks small.
- The report now labels return-map evidence as scalar EDV evidence, not full-state Floquet evidence. A `root-fix-candidate` is therefore provisional until broader validation, and ideally a full-state Poincare Jacobian, confirms that no off-EDV mode is unstable.

Do not stack mitigators simply to satisfy the classifier. If multiple low-stretch limiters or clamp regularizers are required, label the result as a stabilization bundle rather than a single-mechanism root fix.

The matrix markdown now includes a `Per-delta primary branch / slope view` table. Use that table before the scenario summary when making model-fix decisions. The scenario summary is useful for triage, but the per-delta table shows whether improvement is uniform or only moves the problem to another preload point.

Example:

```bash
npm run verify:starling-low-preload-matrix -- \
  --out=artifacts/starling-low-preload-debug/kd-limiter \
  --deltas=0,-1200,-1250,-1300,-1400 \
  --dt=0.001,0.0005 \
  --tbv-correction=on,off \
  --low-stretch-limiter=none,aInfCap,activeReserveCap \
  --low-stretch-limiter-scope=lv \
  --active-reserve-preset=directMild,directMedium,thresholdMild,thresholdMedium \
  --max-return-map-points=4 \
  --trace-beats=4 \
  --sample-hz=60
```

Recommended slope-primary follow-up matrix:

```bash
npm run verify:starling-low-preload-matrix -- \
  --out=artifacts/starling-low-preload-debug/active-reserve-full-slope-primary \
  --deltas=0,-900,-1000,-1100,-1200,-1250,-1300,-1400,-1500,-1600 \
  --dt=0.001,0.0005 \
  --lambda-act-tau=0 \
  --tbv-correction=on,off,low \
  --low-stretch-limiter=none,activeReserveCap \
  --low-stretch-limiter-scope=lv,ventricles \
  --active-reserve-preset=directMild,directMedium \
  --max-return-map-points=8 \
  --trace-beats=6 \
  --sample-hz=120
```

## Recommended root-fix experiments

The next model-level PR should be evidence-first. Do not start by hiding points, changing the Starling fit, or lowering `betaLambda` globally.

Recommended order:

1. Build a low-preload return-map/Floquet diagnostic: perturb LV EDV around a settled point and estimate `dEDV(n+1)/dEDV(n)`. The target criterion is keeping the relevant multiplier within `(-1, 1)` over the intended physiologic preload range. This is now available in the debug report as a local central-difference diagnostic; a full Floquet analysis can still refine the perturbation basis later.
2. Run a dt sensitivity experiment (`0.001`, `0.0005`, possibly `0.002`) at the period-2 point. Strong dt dependence points to numerical coupling; weak dt dependence points to a continuous-model attractor.
3. Add active-stress internal diagnostics: `lambda`, `Kd`, `aInf`, `fIso`, `gOver`, `forceVelocityScale`, `sigmaAct`, `sigmaPas`, and pressure-floor hits per beat.
4. Add node-specific clamp attribution instead of relying on aggregate `clampHitCount`.
5. Only after those diagnostics, test candidate model changes.

Candidate model changes, in increasing blast radius:

- Enable a modest LV/RV active-tension filter so active stress is not an instantaneous function of stretch and activation.
- Compare low-stretch `aInfCap` / `activeReserveCap` candidates that can only reduce low-stretch activation or active target force.
- Smooth the low-stretch `f_iso` ramp with a C1/C2 force-length gate only after Kd/aInf candidates fail or require a secondary trim.
- Saturate or filter length-dependent Ca sensitivity at low `lambda` only with a level/active-reserve guard; avoid any candidate that lowers low-lambda `Kd` and increases active force.
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

## Beat-pair overlay summary added in PR #127

PR #127 adds a report-only summary on top of the raw phase-aligned `beat-pair-overlay.csv`. It does not change model dynamics, settle policy, Starling rendering, or limiter candidates.

The summary labels the final two complete beats as high-output versus low-output using `CO_L`, then computes high-minus-low differences at matched phase for:

- `LV.c`
- `LV.a`
- `sigmaActTarget`
- `sigmaAct`
- `QAo`
- `AoV open`
- `AoP`
- `VLV`
- `QMV`
- `MV open`
- `LAP-LVP`

For each signal it reports the first phase where normalized high-low difference exceeds the configured threshold for consecutive samples. It also reports window-level differences for early filling, diastasis / mid-diastole, atrial systole, isovolumic contraction, ejection, and relaxation.

The goal is to let model reviewers answer a narrower question without manually scanning the raw overlay CSV:

```text
Does MV/filling morphology diverge before active/ejection state,
or does active/ejection state diverge first and then shape the next filling beat?
```

Representative current interpretation remains conservative. MV morphology switching is still tracked, but the stronger hypothesis is that the active-stress/ejection loop is the driver or amplifier, with MV/filling morphology more likely downstream or coupled rather than the primary trigger.

## Afterload/ejection return-map and AoV clamp comparator

The next diagnostic branch extends the low-preload report without changing default dynamics or UI behavior:

- return-map and branch-amplitude features now include `QAoMax`, `AoPMax`, `AoPMean`, `LVPMax`, `sigmaActTargetMax`, and `sigmaActMean`, in addition to `EDV_L`, `ESV_L`, `CO_L`, and `LAPMean`.
- `debug:starling-low-preload` and `verify:starling-low-preload-matrix` accept `--aortic-flow-clamp=hard|soft-tanh|soft-rational`.
- `hard` is the default and is the only runtime behavior used by the app.
- `soft-tanh` and `soft-rational` are off-by-default comparators for testing whether the current AoV/QAo dynamic flow clamp is merely shaping the high-output beat or participating in the alternans loop.

This branch should be read as diagnostic evidence only. A soft clamp mode is not a proposed model fix unless it also passes normal, HR100, HR100-rearm, valve reverse, TBV contamination, and Starling-shape gates.

Suggested smoke:

```bash
npm run verify:starling-low-preload-matrix -- \
  --out=artifacts/starling-low-preload-debug/soft-qao-smoke \
  --deltas=0,-1250,-1300 \
  --dt=0.001 \
  --lambda-act-tau=0 \
  --tbv-correction=on \
  --aortic-flow-clamp=hard,soft-tanh,soft-rational \
  --max-return-map-points=2 \
  --trace-beats=4 \
  --sample-hz=60
```

## QAo cap proximity and localized soft-cap comparator

The next diagnostic layer keeps the `hard` AoV clamp as the default but adds a more conservative report-only comparator family:

- `local-c1-0.90`
- `local-c1-0.95`
- `local-c1-0.98`
- `local-c2-0.95`
- `local-c2-0.98`

Unlike `soft-tanh` and `soft-rational`, these localized comparators are exactly identity below their configured fraction of `QAoMax` and only smooth the last part of the approach to the existing dynamic-flow cap. They are designed to answer a narrower question:

```text
Can the AoV/QAo clamp corner be smoothed near the cap without touching normal and HR100 ejection?
```

The reports now include QAo cap proximity fields:

- max `QAo / cap`
- fraction of positive QAo samples above 90%, 95%, and 98% of the cap
- fraction of samples at the cap
- fraction of samples above the localized comparator's identity threshold

These fields are emitted for low-preload traces and for normal / HR100 waveform gates. A localized comparator should only be considered further if normal and HR100 are nearly identity while the low-preload high-output beat is affected.

Suggested smoke:

```bash
npm run verify:starling-low-preload-matrix -- \
  --out=artifacts/starling-low-preload-debug/local-qao-smoke \
  --deltas=0,-1250,-1300 \
  --dt=0.001 \
  --lambda-act-tau=0 \
  --tbv-correction=on \
  --aortic-flow-clamp=hard,local-c1-0.95,local-c2-0.98,soft-tanh \
  --max-return-map-points=2 \
  --trace-beats=4 \
  --sample-hz=60
```
