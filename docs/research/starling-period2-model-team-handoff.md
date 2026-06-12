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
