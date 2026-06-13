# Starling low-preload period-2 model-team handoff

Date: 2026-06-10

This note summarizes the current status of the low-preload Starling period-2 investigation for model reviewers who only inspect remote `main`.

## Current status

The adaptive Starling sweep exposed a non-monotone low-preload LV branch in the default active-stress model. Around large negative TBV deltas, the LV can alternate between high-output and low-output beats. This is now handled honestly in measurement, but the model-level cause is still under investigation.

Relevant merged work before the current diagnostic PR:

- Period-aware settling and metrics detect period-2 same-phase convergence and use a two-beat average for Starling CO/RAP/LAP/SV style metrics.
- Adaptive Starling sweep and relaxed display reliability keep low-preload points visible instead of hiding them behind a strict period-1 settle requirement.
- Low-preload debug reports include active-stress terms, clamp attribution, valve flow summaries, beat traces, and an EDV-section return-map diagnostic.

The current PR adds two pieces:

- A return-map v2 diagnostic with one-beat and two-beat same-phase signed slopes, branch amplitudes, and clamp/nonsmooth flags.
- An off-by-default `lambdaAct` lag experiment that tests whether filtering only the active-stretch input to `Kd` and `fIso` suppresses the low-preload alternans.

## Working hypothesis

The leading hypothesis is excessive low-stretch active gain rather than plotting, warm-start, valve reverse flow, or simple integration artifact.

The active target path is effectively:

```text
low preload
  -> LV lambda variation
  -> Kd / aInf and fIso variation
  -> sigmaActTarget variation
  -> SV variation
  -> next-beat EDV variation
  -> one-beat Poincare multiplier near or below -1
  -> period-2 alternans
```

Valve and clamp behavior can amplify or shape the branch, but current evidence does not support nominal valve reverse flow as the primary cause.

## What `lambdaAct` changes

`lambdaAct` is off by default. With `tauLambdaActSec = 0`, shipped dynamics are intended to remain unchanged.

When `tauLambdaActSec > 0`, each active chamber has an internal state:

```text
d(lambdaAct)/dt = (lambdaRaw - lambdaAct) / tauLambdaActSec
```

Only the active-stretch inputs to `Kd` and `fIso` use `lambdaAct`.

Still using instantaneous `lambdaRaw`:

- passive pressure
- geometry and wall stress conversion
- `gOver`
- force-velocity scaling
- valve and vascular coupling

The intent is to reduce beat-to-beat low-stretch active gain while preserving period-1 DC behavior as much as possible. It is an experiment, not a default model change.

## Reproduction command

```bash
npm run debug:starling-low-preload -- \
  --out=artifacts/starling-low-preload-debug/lambda-act \
  --deltas=0,-1200,-1250,-1300,-1400 \
  --dt=0.001,0.0005 \
  --lambda-act-tau=0,0.15,0.25,0.4
```

Generated files:

- `report.json`
- `report.md`
- `beat-trace.csv`

## Branch-first matrix command

PR #115 adds a lighter matrix workflow for tau/scope comparisons. It avoids computing EDV-section return maps at every delta:

```bash
npm run verify:starling-low-preload-matrix -- \
  --out=artifacts/starling-low-preload-debug/manual-matrix \
  --deltas=0,-900,-1000,-1100,-1200,-1250,-1300,-1400,-1500,-1600 \
  --dt=0.001,0.0005 \
  --lambda-act-tau=0,0.05,0.10,0.15,0.20,0.40 \
  --lambda-act-scope=lv,ventricles \
  --max-return-map-points=6
```

The first pass records branch amplitude, clamp, valve, period, and active-stress diagnostics with return maps disabled. The second pass replays each selected scenario for seeded-state continuity, but computes EDV-section diagnostics only for selected suspicious deltas with both `volumeLambdaActFixed` and `volumeLambdaActReset` return-map modes. This is the preferred handoff artifact for comparing `tauLambdaActSec` scopes before any default model change.

PR #118 adds a clamp/TBV projection contamination axis to that same matrix workflow:

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

`tbv-correction=on` is the shipped behavior. `off` disables continuous TBV projection after the target-volume retarget step and is a negative-control diagnostic, not a runtime proposal. `low` keeps projection enabled with debug-only low gain/caps. The report adds per-point `tbvAudit` fields for sanitize repair and TBV projection movement, plus correction-mode summaries for branch amplitude and contamination counts.

Interpretation:

- If period-2 and branch amplitude remain in clamp-clean points with projection off, prioritize active-stretch gain fixes such as Kd/aInf or fIso/composite-gain shaping.
- If branch amplitude changes mostly with projection mode, or high-amplitude points are contaminated by hard repair/projection movement, inspect soft floors, conservative repair, and projection timing before changing active-stress gain.

PR #119 adds an off-by-default low-stretch limiter comparison axis to the same matrix:

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

This does not change default dynamics. It deliberately implements conservative arms only:

- `aInfCap`: low-raw-lambda activation ceiling. It can only reduce `aInf`; it does not lower `Kd`.
- `activeReserveCap`: low-raw-lambda active-target multiplier. By default it directly caps low-stretch target force; if an activation threshold is configured, it becomes high-activation gated. It can only reduce `sigmaActTarget`.

We are not testing the unguarded `phi(lambda)` Kd slope-limiter as a merge candidate because it can make `phi(lambda) > lambda` at low stretch, lower `Kd`, and raise calcium sensitivity/active force. If a Kd slope-cap arm is revisited, it needs a level/active-reserve guard and separate validation.

PR #120 expands this into an activeReserveCap tuning matrix. It adds `directMild`, `directMedium`, `thresholdMild`, and `thresholdMedium` presets, plus shape-preservation gates:

- mean CO/SV error versus the no-limiter baseline at matching deltas
- low-preload monotonicity violations and dip/re-rise score
- low-preload slope ratio versus baseline
- active-reserve hit fraction, minimum active scale, and sigmaActTarget reduction fraction

This is meant to answer the model-team concern that activeReserveCap might simply reduce pump output instead of stabilizing the branch. A good candidate should reduce CO/ESV branch amplitude while preserving period-mean CO/SV and the low-preload Starling limb, with minimal normal/HR100 waveform delta and no increase in sanitize/TBV projection contamination, valve reverse volume, or dynamic-flow clamp activity.

Representative PR #120 smoke (`deltas=0,-1200,-1250,-1300,-1400`, `dt=0.001`, `tbv-correction=on,off`, LV scope) showed:

| limiter | preset | TBV correction | CO branch frac | ESV branch frac | mean CO err | dip/re-rise | active hit frac | min scale | normal/HR100 max delta | contaminated |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| none | none | on | 0.5978 | 0.4602 | 0.0000 | 1.6648 | 0.000 | 1.000 | 0.0000 | 0 |
| activeReserveCap | directMild | on | 0.5448 | 0.3761 | 0.0036 | 0.0000 | 0.750 | 0.880 | 0.0132 | 0 |
| activeReserveCap | directMedium | on | 0.2945 | 0.1823 | 0.0041 | 0.0000 | 0.729 | 0.780 | 0.0099 | 0 |
| activeReserveCap | thresholdMild/Medium | on | 0.5978 | 0.4602 | 0.0000 | 1.6648 | 0.000 | 1.000 | 0.0000 | 0 |
| none | none | off | 0.6085 | 0.4662 | 0.0000 | 0.0000 | 0.000 | 1.000 | 0.0000 | 0 |
| activeReserveCap | directMedium | off | 0.2935 | 0.1816 | 0.0041 | 0.0000 | 0.729 | 0.780 | 0.0099 | 0 |

This is not a default-adoption decision. It means direct activeReserveCap remains the leading comparator to send into a wider matrix; threshold presets may need lower thresholds or a different trigger if they are intended to act in this low-preload branch.

PR #121 tightens the framing. `activeReserveCap directMedium` should be called a leading mitigator/comparator, not a root fix. The representative smoke still has residual beat-level alternans (`CO branch fraction` around `0.29`), even though the period-mean Starling curve is much cleaner (`dip/re-rise = 0`, small mean CO error).

The matrix report now classifies each scenario:

- `fail`: unsafe or shape-breaking candidate.
- `mitigator`: branch amplitude is reduced and the mean curve is usable, but residual branch envelope or return-map slope remains.
- `root-fix-candidate`: per-delta branch fractions are small and clean selected one-beat/two-beat EDV slopes are away from the flip threshold.

Read the new `Per-delta primary branch / slope view` table before relying on max summary numbers. The table shows whether a candidate stabilizes the whole low-preload branch or only moves the alternans envelope to a different delta. Clean selected return-map slopes are secondary but important: branch fraction can improve by amplitude clipping or curve flattening, so a root-fix candidate should also move clean signed EDV slopes away from the flip threshold.

PR #122 adds a guard against false root-fix promotion. The worst branch delta must be covered by a clean scalar EDV return-map slope; if that worst point is nonsmooth, clamp-crossing, contaminated, skipped, or missing a slope, the report downgrades the scenario to mitigator/inconclusive. The report also marks the evidence level explicitly as scalar EDV return-map evidence. This is useful but is not a full-state Floquet/Poincare Jacobian, so any root-fix candidate remains provisional until broader validation and, for default adoption, full-state confirmation if needed.

Avoid mitigator stacking as a shortcut. If activeReserveCap, Kd/aInf limiting, geometry regularization, and clamp smoothing have to be combined to pass the matrix, the result should be called a stabilization bundle, not a single-mechanism root fix.

Recommended next matrix for model-team review:

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

## Preliminary local result

The run above completed with `points=5 period2=4 maxAdjacentDelta=0.592 maxReverseMl=0`. Scenario summary from the local report:

| tau s | dt s | period-2 count | max adjacent delta | max one-beat EDV slope | max two-beat EDV slope |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 0.001 | 4 | 0.5920 | 1.0000 | 1.8894 |
| 0 | 0.0005 | 4 | 0.6114 | 0.7376 | 0.7339 |
| 0.15 | 0.001 | 0 | 1.0000 | 1.0619 | 1.0313 |
| 0.15 | 0.0005 | 0 | 1.0000 | 1.0448 | 2.1219 |
| 0.25 | 0.001 | 0 | 1.0000 | 3.5340 | 3.3322 |
| 0.25 | 0.0005 | 1 | 1.0000 | 6.1021 | 1.7687 |
| 0.4 | 0.001 | 0 | 1.0000 | 1.0000 | 0.4931 |
| 0.4 | 0.0005 | 0 | 1.0000 | 1.0777 | 0.4457 |

Interpretation:

- Positive `tauLambdaActSec` often suppresses period-2 classification in this focused march, supporting the active-stretch-gain hypothesis.
- This should not be read as proof of stabilization. `max adjacent delta = 1.0000` means adjacent beats are still maximally different under the settle fingerprint normalization, so positive tau can also be moving the system into a non-period-2/non-converged regime.
- The result is not yet sufficient for default adoption. Some tau/dt combinations still show large adjacent deltas or large local slopes.
- Clamp/nonsmooth flags should be considered before using return-map slopes as calibration targets.

PR #114 updates the report so reviewers can avoid this misread:

- branch amplitude and branch amplitude fraction are displayed as the primary low-preload stabilization signal
- `dLog...dLambdaAct` names clarify that static active-gain diagnostics are derivatives with respect to the filtered active-stretch input, not raw instantaneous geometry
- the return-map diagnostic includes both `volumeLambdaActFixed` and `volumeLambdaActReset` modes

## Review questions for model team

1. Do `aInfCap` or activeReserveCap presets reduce clean-point branch amplitude without increasing dynamic-flow clamp, valve reverse volume, sanitize/projection contamination, or normal/HR100 waveform deltas?
2. Which acceptance metric should gate default adoption: period-2 count, branch amplitude, signed one-beat slope, two-beat same-phase slope, clamp activity, or a combination?
3. Should `lambdaAct` apply to all active chambers or initially only ventricles?
4. What tau range is physiologically defensible for length-dependent activation filtering?
5. Should slopes marked `nonsmooth` or `clampCrossing` be excluded entirely from model calibration decisions?
6. Should a static active-geometry regularization arm be compared in parallel, separately from Kd/aInf limiter arms?

## Proposed next step

Do not adopt `lambdaAct` or the low-stretch limiter arms as defaults in this PR. Use this report to choose a model-fix branch with explicit gates:

- default baseline metrics remain within tolerance
- HR100 re-arm still settles without increased clamp activity
- Guyton/Starling residuals do not regress
- nominal valve reverse volumes do not increase
- low-preload period-2 branch amplitude and clamp activity decrease
- low-preload period-mean CO/SV and curve shape are preserved; branch suppression by flattening the whole limb is not acceptable
- signed return-map slopes move away from the flip threshold where the dynamics are smooth enough to interpret

## PR #127: beat-pair overlay divergence summary

PR #127 is diagnostic-only. It adds a structured summary for the existing beat-pair overlay so model reviewers do not need to manually inspect the raw phase-aligned CSV for every representative run.

New output when `--beat-pair-overlay` is enabled:

- `beat-pair-overlay.csv`: unchanged raw phase-aligned rows.
- `beat-pair-overlay-summary.csv`: high-output minus low-output summary rows.
- `report.md`: compact `Beat-pair overlay divergence summary` section.

The summary labels the last two complete beats as high-output / low-output by `CO_L`, then computes normalized high-minus-low differences for `LV.c`, `LV.a`, `sigmaActTarget`, `sigmaAct`, `QAo`, `AoV open`, `AoP`, `VLV`, `QMV`, `MV open`, and `LAP-LVP`. It reports the first sustained divergence phase and the phase window (`early filling`, `diastasis / mid-diastole`, `atrial systole`, `isovolumic contraction`, `ejection`, `relaxation`) where that divergence appears.

Use this as a trigger-order aid, not a causality proof. The intended question is whether active/ejection signals diverge before MV/filling morphology, or whether filling morphology leads the alternans. Current representative interpretation remains that MV morphology is less likely to be the initiating trigger, while the active-stress/ejection loop remains the stronger driver/amplifier hypothesis.

## Afterload / ejection diagnostics and AoV soft-clamp comparator

The current diagnostic branch adds report-only afterload/ejection features and an off-by-default AoV flow-clamp comparator. It does not change default app dynamics.

New return-map / branch features:

- `QAoMax`
- `AoPMax`
- `AoPMean`
- `LVPMax`
- `sigmaActTargetMax`
- `sigmaActMean`

New comparator axis:

```bash
--aortic-flow-clamp=hard,soft-tanh,soft-rational
```

`hard` is the current default. `soft-tanh` and `soft-rational` are diagnostic-only alternatives for testing whether QAoMax/AoV dynamic-flow clamp shaping is downstream, amplifying, or mechanistically necessary for the low-preload alternans envelope. Treat these as controls, not proposed defaults.

Suggested handoff artifact command:

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

The global `soft-tanh` / `soft-rational` comparators are positive controls: they can collapse the low-preload branch envelope, but they also reshape normal / HR100 waveforms. They should not be read as default candidates.

The localized comparator family is narrower:

```bash
--aortic-flow-clamp=hard,local-c1-0.95,local-c1-0.98,local-c2-0.95,local-c2-0.98
```

Each localized mode is exactly identity below its configured fraction of the existing QAo dynamic-flow cap, then smoothly approaches the cap over the remaining band. The report adds:

- low-preload max `QAo / cap`
- sample fraction above 90%, 95%, and 98% of cap
- sample fraction at cap
- localized cap active fraction
- normal / HR100 candidate and baseline QAo cap proximity in waveform gates

Use this to decide whether there is a default-safe localized AoV/QAo regularization path. A useful candidate should affect the low-preload high-output beat but remain nearly inactive for normal, HR100, and HR100-rearm waveforms.

Suggested handoff artifact command:

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

## AoV_B physical-loss sweep and AS sanity comparator

The latest diagnostic axis tests whether the aortic valve pressure-loss calibration is forcing the hard QAo cap to act as the effective ejection envelope. This is still diagnostic-only. Default app dynamics remain unchanged.

New CLI axes:

```bash
--aov-b=0.000001,0.000003,0.00001,0.00003,0.00005
--as-aov-amax=3.5,2,1.5,1,0.75
```

`--aov-b` varies normal-valve loss. `--as-aov-amax` is an aortic-stenosis sanity comparator: it keeps `AoV_Aref = 3.5` fixed and varies only `AoV_Amax`, so normal calibration and disease comparison are not conflated.

The matrix report now carries the valve comparator parameters through every scenario and adds normal / HR100 / HR100-rearm valve sanity fields:

- `AoVMeanGradient`
- `AoVPeakGradient`
- `QAoPeakMeanRatio`
- ejection duration
- QAo/cap proximity

Suggested handoff artifact command:

```bash
npm run verify:starling-low-preload-matrix -- \
  --out=artifacts/starling-low-preload-debug/aov-loss-smoke \
  --deltas=0,-1250,-1300 \
  --dt=0.001 \
  --lambda-act-tau=0 \
  --tbv-correction=on \
  --aortic-flow-clamp=hard \
  --aov-b=0.000001,0.000003,0.00001,0.00003 \
  --as-aov-amax=3.5,2,1.5 \
  --max-return-map-points=2 \
  --trace-beats=4 \
  --sample-hz=60
```

Review questions:

1. Does any plausible `AoV_B` reduce QAo cap proximity and branch amplitude without producing implausible normal or HR100 aortic gradients?
2. Do AS sanity cases behave monotonically with smaller `AoV_Amax` while preserving the distinction between `Aref` and `Amax`?
3. If plausible `AoV_B` values do not materially change the branch envelope, should the next root-fix effort return to active-stress low-stretch gain rather than further QAo cap tuning?

## AoV_B x activeReserveCap bundle comparison

Current interpretation from the model-review discussion:

- `AoV_B` / orifice loss is a strong control axis for the low-preload alternans loop.
- `AoV_B` alone suppresses the branch but can fail normal / HR waveform gates, so it is not a default fix by itself.
- `activeReserveCap` remains a leading mitigator. Combining modest valve-loss recalibration with low-stretch active-reserve suppression is worth testing as a stabilization bundle.
- Passing this bundle would not prove a single root mechanism. Treat it as an off-by-default candidate bundle until broader validation and clean return-map coverage support adoption.

The matrix report now includes AoV gradient decomposition for the waveform gates:

- flow-weighted total `LVP - AoP`
- flow-weighted orifice `Rq + Bq|q|`
- resistive `Rq`
- Bernoulli `Bq|q|`
- inertial `L dq/dt`
- residual

AS-like conclusions should primarily use the orifice/quasi-steady columns. The total transient gradient can be high because of inertial or residual terms and should be interpreted separately.

Suggested handoff artifact command:

```bash
npm run verify:starling-low-preload-matrix -- \
  --out=artifacts/starling-low-preload-debug/aov-active-bundle-smoke \
  --deltas=0,-1250,-1300 \
  --dt=0.001 \
  --lambda-act-tau=0 \
  --tbv-correction=on \
  --aortic-flow-clamp=hard \
  --aov-b=0.000001,0.000003,0.00001 \
  --low-stretch-limiter=none,activeReserveCap \
  --low-stretch-limiter-scope=lv \
  --active-reserve-preset=directMild,directMedium \
  --max-return-map-points=2 \
  --trace-beats=4 \
  --sample-hz=60
```

Review questions:

1. Does a modest `AoV_B` plus `directMild` or `directMedium` reduce CO/ESV/QAo branch fractions more than either axis alone?
2. Does QAo/cap move away from the hard cap without making normal / HR100 orifice gradients implausible?
3. Are failures driven by quasi-steady orifice loss, inertial loss, or residual transient pressure?
4. If a combination looks good, is it best described as a stabilization bundle, or is there enough evidence for a more focused model change?

## fIso low-stretch slope comparator and ejection audit v2

The current branch adds a focused comparator for the model-team hypothesis that the remaining low-preload alternans is driven by excessive low-stretch active-force gain rather than by a pure valve-loss defect.

New off-by-default axis:

- `--low-stretch-limiter=fIsoSlopeRelax`
- Scope remains controlled by `--low-stretch-limiter-scope=lv|ventricles|all`.
- The comparator does not change default app dynamics. It only applies when requested by debug/matrix options.

Mechanically, `fIsoSlopeRelax` keeps raw geometry, passive pressure, Kd/aInf, gOver, force-velocity, valves, and default parameters unchanged. It multiplies the low-stretch `fIso` ramp by a C1 gate `<= 1` below the join point, leaving the upper normal-stretch side unchanged. It is designed to test whether reducing low-stretch force-length gain moves clean ESV-section slopes away from the flip threshold without the pump-output clipping seen in `activeReserveCap`.

The waveform gate now also reports:

- ejection duration as QAo positive, QAo above 5% peak, SV 5-95%, and the older high-flow/open-window duration.
- sampled effective AoV orifice loss.
- full-open AoV orifice loss.
- extra area-loss while the valve is not fully open.
- inertial loss and residual loss.
- AoV opening fraction at peak QAo, mean opening during ejection, and time to near-full opening.

Suggested handoff artifact command:

```bash
npm run verify:starling-low-preload-matrix -- \
  --out=artifacts/starling-low-preload-debug/fiso-ejection-smoke \
  --deltas=0,-1250,-1300 \
  --dt=0.001 \
  --lambda-act-tau=0 \
  --tbv-correction=on \
  --aortic-flow-clamp=hard \
  --aov-b=0.000001,0.000003 \
  --low-stretch-limiter=none,fIsoSlopeRelax,activeReserveCap \
  --low-stretch-limiter-scope=lv \
  --active-reserve-preset=directMedium \
  --max-return-map-points=2 \
  --trace-beats=4 \
  --sample-hz=60
```

Review questions:

1. Does `fIsoSlopeRelax` improve clean ESV-section slope, not just branch amplitude?
2. Does it preserve period-mean CO/SV and low-preload Starling shape better than `activeReserveCap`?
3. Does it reduce QAo/cap and branch amplitude without moving normal / HR100 waveform gates?
4. Is the remaining AoV gradient driven by full-open orifice loss, valve-opening area-loss extra, inertial loss, or residual?
5. If `fIsoSlopeRelax` helps but does not fully stabilize, should the next comparator be a refined force-length gate, a Kd/aInf gain limiter with level guard, or an ejection-path regularization?

## 2026-06-12 update: fIso negative comparator and AoV/ejection physicality

The 2026-06-12 matrix weakens the simple `fIsoSlopeRelax` hypothesis. It is useful negative evidence, but not a root-fix candidate: branch fractions remain close to baseline while mean CO/SV shifts substantially. The next question is whether the remaining ESV/ejection alternans is controlled by dynamic ejection/afterload coupling rather than static active-stress level.

New report-only axes and columns:

- `--aov-l=...`
- `--aov-tau-open=...`
- `--aov-tau-close=...`
- `--systemic-resistance=...`
- `--arterial-stiffness=...`
- AoV ODE closure residual: `LVP-AoP-(Rq+Bq|q|+LqDot)`
- QAo physicality: positive-flow mean, time-to-peak, and max dQAo/dt

Recommended handoff artifact commands:

```bash
npm run verify:starling-low-preload-matrix -- \
  --out=artifacts/starling-low-preload-debug/aov-closure-smoke \
  --deltas=0,-1250,-1300 \
  --dt=0.001 \
  --lambda-act-tau=0 \
  --tbv-correction=on \
  --aortic-flow-clamp=hard \
  --aov-b=0.000001,0.0000015,0.000002,0.0000025,0.000003,0.000005 \
  --max-return-map-points=2 \
  --trace-beats=4 \
  --sample-hz=60
```

```bash
npm run verify:starling-low-preload-matrix -- \
  --out=artifacts/starling-low-preload-debug/aov-l-smoke \
  --deltas=0,-1250,-1300 \
  --dt=0.001 \
  --lambda-act-tau=0 \
  --tbv-correction=on \
  --aortic-flow-clamp=hard \
  --aov-l=0.00025,0.000375,0.0005 \
  --max-return-map-points=2 \
  --trace-beats=4 \
  --sample-hz=60
```

Readout discipline:

- Primary stabilization evidence is clean ESV-section slope, not branch amplitude alone.
- AS-like sanity should use sampled/full-open orifice loss, not total transient `LVP-AoP`.
- Large closure residual means the valve/coupling accounting is not closed and should be investigated before making stenosis-like claims.
- Run AoV_B, AoV_L, tauOpen/tauClose, systemicResistance, and arterialStiffness as separate single-axis sweeps before trying bundles. Bundles remain stabilization comparators, not single-mechanism root fixes.

## 2026-06-12 update: qDot clamp audit and tension-rise negative comparator

The latest diagnostic branch adds report-only AoV flow-update accounting:

- solver pre-event / post-event / post-clamp AoV `qDot`
- qDot clamp hit fraction and clamp impulse
- diode and flow-clamp impulses
- continuous closure residual using post-clamp `qDot`
- solver closure residual before diode / flow / qDot clamps
- discrete closure residual using raw solver `qDot` after diode and flow clamp but before qDot clamp
- clean-window closure residual restricted to near-full-open, positive-flow, SV 5-95% samples without diode, flow, or qDot clamp activity

Default runtime behavior is unchanged. The qDot clamp remains 40000 mL/s^2 unless a debug runner passes `--aov-qdot-clamp`, and tension filtering remains off unless a debug runner passes `--tension-rise`.

Current artifact to share:

- `artifacts/starling-low-preload-debug/aov-closure-pr134-smoke/matrix-report.json`
- `artifacts/starling-low-preload-debug/aov-closure-pr134-smoke/matrix-report.md`
- `artifacts/starling-low-preload-debug/aov-closure-pr134-smoke/branch-table.csv`

Command:

```bash
npm run verify:starling-low-preload-matrix -- \
  --out=artifacts/starling-low-preload-debug/aov-closure-pr134-smoke \
  --deltas=0,-1250 \
  --dt=0.001 \
  --lambda-act-tau=0 \
  --tbv-correction=on \
  --tension-rise=0,0.02 \
  --aov-qdot-clamp=40000,80000 \
  --max-return-map-points=2 \
  --trace-beats=4 \
  --sample-hz=60 \
  --quiet-progress
```

Smoke interpretation:

- Baseline low-preload raw AoV qDot demand is far above the default qDot clamp, and the qDot clamp is active across the sampled SV 5-95% window.
- Raising the qDot clamp to 80000 mL/s^2 strongly changes branch behavior. Treat this as a positive control showing that the qDot clamp is a dominant event surface in this low-preload smoke, not as a default-safe model fix.
- A 20 ms tension-rise comparator is not a root-fix candidate in this smoke. With the default qDot clamp it worsens branch/waveform gates; with the higher qDot clamp it can create clean closure samples but still fails waveform gates.
- Large whole-window closure residual should be read as a non-clean/clamp-dominated interval signal. Clean-window closure residual is the better check for whether the fully open AoV equation is internally consistent.
- Pre-event solver closure can be small while clean-window samples are absent. That should be read as "the solver-side equation is internally consistent before events, but the realized ejection waveform is event-surface dominated", not as proof that the full ejection waveform is ODE-clean.

Current interpretation:

- `qDotClamp=80000` is a positive control, not a root fix.
- `tensionRise=0.02` is a negative / weak comparator, not a root fix.
- The current best localization is "qDot clamp / acceleration limiting is a dominant event surface in the low-preload period-2 branch".
- The next diagnostic objective is not simply to remove period-2; it is to reduce qDot clamp hit fraction and qDot clamp impulse while preserving normal / HR100 / HR100-rearm waveform gates.

Recommended staged sweeps:

```bash
npm run verify:starling-low-preload-matrix -- \
  --out=artifacts/starling-low-preload-debug/qdot-threshold-dt-smoke \
  --deltas=0,-1250 \
  --dt=0.001,0.0005 \
  --lambda-act-tau=0 \
  --tbv-correction=on \
  --tension-rise=0 \
  --aov-qdot-clamp=40000,80000 \
  --max-return-map-points=2 \
  --trace-beats=4 \
  --sample-hz=60 \
  --quiet-progress
```

```bash
npm run verify:starling-low-preload-matrix -- \
  --out=artifacts/starling-low-preload-debug/tension-rise-qdot-primary-smoke \
  --deltas=0,-1250 \
  --dt=0.001 \
  --lambda-act-tau=0 \
  --tbv-correction=on \
  --tension-rise=0,0.005,0.01,0.015,0.02 \
  --aov-qdot-clamp=40000 \
  --max-return-map-points=2 \
  --trace-beats=4 \
  --sample-hz=60 \
  --quiet-progress
```

```bash
npm run verify:starling-low-preload-matrix -- \
  --out=artifacts/starling-low-preload-debug/modest-aov-b-qdot-primary-smoke \
  --deltas=0,-1250 \
  --dt=0.001 \
  --lambda-act-tau=0 \
  --tbv-correction=on \
  --aov-b=0.000001,0.0000015,0.000002,0.000003 \
  --aov-qdot-clamp=40000 \
  --max-return-map-points=2 \
  --trace-beats=4 \
  --sample-hz=60 \
  --quiet-progress
```

Primary readouts for the staged sweeps:

- `AoVQDotClampHitFractionSV5To95`
- `AoVQDotClampHitFractionCleanCandidate`
- `AoVQDotRawMaxAbs`
- `AoVQDotPostMaxAbs`
- `AoVFlowWeightedQDotClampImpulseGradient`
- `AoVFlowWeightedCleanClosureResidual`
- `AoVFlowWeightedSolverClosureResidual`

PR #134 now also reports a qDot target estimator. This is report-only range-finding for the next tension/B sweep, not a model change:

- `AoVQDotRawToClampRatioMax`
- `AoVQDotRawToClampRatioSV5To95Max`
- `AoVQDotRawToClampRatioCleanCandidateMax`
- `AoVQDotRequiredReductionFractionMax`
- `AoVQDotRequiredReductionFractionSV5To95Max`
- `AoVQDotPressureExcessOverClampMaxMmHg`
- `AoVQDotPressureExcessOverClampSV5To95MaxMmHg`
- `AoVQDotEquivalentExtraBAtMaxExcess`
- `AoVQDotEquivalentExtraBAtSV5To95MaxExcess`

Interpretation: if raw qDot is, for example, `10x` the configured clamp, a physical comparator should be judged by whether it reduces that ratio and qDot-clamp impulse in the SV 5-95% / clean-candidate windows while preserving normal / HR waveform gates. `equiv extra B` is only a scale estimate for how much additional Bernoulli loss would create the same instantaneous pressure excess at the sampled QAo; it is not a recommended default parameter.

Secondary / safety readouts:

- CO / ESV / QAo branch fractions and selected ESV-section slopes
- normal / HR100 / HR100-rearm waveform gates
- period-mean CO/SV preservation
- sampled/full-open AoV orifice gradient, not total transient gradient
- QAo peak/mean and ejection duration definitions

Local staged smoke observations from the current PR branch:

- `qdot-threshold-dt-smoke`: raising qDot clamp from `40000` to `80000` collapses the low-preload branch at both `dt=0.001` and `dt=0.0005`, so the result is not an obvious single-dt artifact. It remains a positive control, not a fix, because waveform gates still fail.
- `tension-rise-qdot-primary-smoke`: small tension-rise values (`0.005` to `0.02` s) do not reliably reduce qDot clamp involvement at the default clamp. The `0.02` s case worsens the CO/ESV branch envelope in this smoke, so tension-rise should remain a weak / negative comparator until a different formulation is justified.
- `modest-aov-b-qdot-primary-smoke`: increasing `AoV_B` from `1e-6` to `1.5e-6` / `2e-6` / `3e-6` reduces branch amplitude, but qDot clamp hit fraction in clean-candidate / SV5-95 windows can remain high. This is consistent with AoV_B acting as a stabilizing/clip axis without proving that the realized waveform is qDot-event-clean.

Questions for the model team:

1. Is qDot clamp activity in normal / low-preload ejection acceptable as a numerical stabilizer, or should default ejection be required to have low qDot clamp hit fraction in the SV 5-95% window?
2. If qDot clamp suppression improves branch but damages waveform gates, should the next comparison target the upstream upstroke shape, the valve update scheme, or afterload memory?
3. Should clean-window closure residual become a hard acceptance gate for future AoV/ejection comparator branches?

## 2026-06-13 update: AoV low-open qDot split and q-state update comparators

The newest report-only layer separates the qDot target estimator by AoV opening fraction:

- `open-lt-0.2`
- `open-0.2-0.8`
- `open-0.8-0.95`
- `open-gte-0.95`

This addresses a key interpretation problem from the qDot target estimator: the headline maximum can be dominated by a low-open-fraction AoV event when `open01` is very low. Do not assume that this is always an opening-side acceleration spike. In the current smoke artifact, the largest normal sample is low-open, adverse-gradient, and negative-qDot, which is more consistent with a closing-side / pressure-reversal deceleration transient than a true opening-from-rest spike. The near-full-open bin is the better first readout for the ejection body; the low-open bin is only the first localization layer.

The matrix runner now also accepts:

```bash
--aov-q-update=current-loss,qnext-loss,substep-2,substep-4
```

`current-loss` is the current model and remains the default. `qnext-loss` uses a qNext-consistent quadratic loss for AoV, while `substep-2` and `substep-4` substep the AoV q-state update within the outer model step. These are comparator modes only. They are intended to test whether the current-q loss update or coarse q-state integration materially changes low-open qDot pathology. They are diagnostic comparators, not root-fix or default candidates.

Recommended smoke for the next handoff artifact:

```bash
npm run verify:starling-low-preload-matrix -- \
  --out=artifacts/starling-low-preload-debug/low-open-event-direction-smoke \
  --deltas=0,-1250 \
  --dt=0.001 \
  --lambda-act-tau=0 \
  --tbv-correction=on \
  --aov-b=0.000001,0.000002 \
  --aov-tau-open=0.006,0.012 \
  --aov-q-update=current-loss,qnext-loss,substep-2 \
  --aov-qdot-clamp=40000 \
  --max-return-map-points=2 \
  --trace-beats=4 \
  --sample-hz=60 \
  --quiet-progress
```

Primary readout discipline:

- Low-open event: `open-lt-0.2` raw/clamp, pressure excess, qCurrent, qNext pre-diode, and qDot pre-clamp. Interpret this only after checking the sign of dP and qDot; it may represent opening acceleration, closing deceleration, or forward-flow coast against adverse pressure.
- Ejection body: `open-gte-0.95`, SV 5-95, and clean-candidate raw/clamp plus clean-window closure residual.
- Safety: normal / HR100 / HR100-rearm waveform gates, full-open/sampled orifice gradient, QAo peak/mean, and ejection duration definitions.

The matrix report now also splits low-open samples by event direction:

- `open01 < 0.2 && dP > 0 && qDot > 0`: opening acceleration.
- `open01 < 0.2 && dP < 0 && qDot < 0`: pressure-reversal / closing-side deceleration.
- `open01 < 0.2 && q > 0 && dP < 0`: forward-flow coast against adverse pressure.
- `open01 < 0.2 && q ~= 0 && dP > 0`: true opening from rest.

These bins may overlap. They are attribution readouts, not mutually exclusive physiology classes. The report also includes max positive and max negative qDot separately, plus local open01 delta at the max-excess sample. `equiv extra B` remains range-finding only; it is not a recommended parameter.

Do not interpret a successful q-state update comparator as a model fix by itself. It is evidence about q-update ordering and low-open event numerics. Default adoption would require a later model-design PR and broad validation.
