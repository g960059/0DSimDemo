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

1. Is `lambdaAct` the right first root-fix candidate, or should the first model-level intervention be a constrained low-stretch `fIso` gate or composite active-gain limiter?
2. Which acceptance metric should gate default adoption: period-2 count, branch amplitude, signed one-beat slope, two-beat same-phase slope, clamp activity, or a combination?
3. Should `lambdaAct` apply to all active chambers or initially only ventricles?
4. What tau range is physiologically defensible for length-dependent activation filtering?
5. Should slopes marked `nonsmooth` or `clampCrossing` be excluded entirely from model calibration decisions?

## Proposed next step

Do not adopt `lambdaAct` as a default in this PR. Use this report to choose a model-fix branch with explicit gates:

- default baseline metrics remain within tolerance
- HR100 re-arm still settles without increased clamp activity
- Guyton/Starling residuals do not regress
- nominal valve reverse volumes do not increase
- low-preload period-2 branch amplitude and clamp activity decrease
- signed return-map slopes move away from the flip threshold where the dynamics are smooth enough to interpret
