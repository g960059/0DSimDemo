import { performance } from "node:perf_hooks";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  limitMainWireIntegratedModelCandidateTimeV3,
  stepMainWireIntegratedModelV3,
  type MainWireIntegratedModelAcceptedStateV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type {
  MainWireFiveWallCoronaryEvaluationCountersV2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";

const NOMINAL_DT_SEC = 0.002;
const DEFAULT_WARM_UP_STEP_COUNT = 250;
const DEFAULT_MEASURED_STEP_COUNT = 100;

type AcceptedState = MainWireIntegratedModelAcceptedStateV3<
  MainWireNormalAdultFiveWallMechanicsStateV1
>;

export type DistributionV3 = Readonly<{
  mean: number;
  min: number;
  max: number;
}>;

type CounterSampleV3 = Readonly<{
  hydraulicResidualEvaluationCount: number;
  trialLoopHydraulicResidualEvaluationCount: number;
  implicitSensitivityHydraulicResidualEvaluationCount: number;
  coronaryNewtonIterationCount: number;
  outerCirculationCandidateCount: number;
  mechanicsTotalEvaluationCount: number;
  mechanicsCandidateCenterEvaluationCount: number;
  mechanicsLvRvProbeEvaluationCount: number;
  triSegSolveInternalCoordinatesCallCount: number;
  triSegEvaluateCandidateCallCount: number;
  triSegEvaluateCandidateCallsPerSolve: number;
  laMaterialEvaluationCount: number;
  raMaterialEvaluationCount: number;
  laStrainChangeCount: number;
  raStrainChangeCount: number;
  laDistinctStrainInputCount: number;
  raDistinctStrainInputCount: number;
  laCacheableRepeatMaterialEvaluationCount: number;
  raCacheableRepeatMaterialEvaluationCount: number;
  sensitivityBaseResidualProbeEvaluationCount: number;
  sensitivityVolumeJacobianProbeEvaluationCount: number;
  sensitivityBoundaryResidualProbeEvaluationCount: number;
  sensitivityObservableProbeEvaluationCount: number;
  sensitivityImplicitLinearSolveCount: number;
}>;

export type V3EvaluationCounterMeasurement = Readonly<{
  measurementId: "main-wire-integrated-v3-evaluation-counters-v1";
  nominalDtSec: number;
  warmUpAcceptedStepCount: number;
  measuredAcceptedStepCount: number;
  distributions: Readonly<Record<keyof CounterSampleV3, DistributionV3>>;
  counterCollectionCost: Readonly<{
    timingAcceptedStepCountPerRun: number;
    defaultOffMsPerAcceptedStep: DistributionV3;
    enabledMsPerAcceptedStep: DistributionV3;
    enabledOverheadPercentFromMean: number;
  }>;
}>;

export function measureV3EvaluationCounters(
  warmUpAcceptedStepCount = DEFAULT_WARM_UP_STEP_COUNT,
  measuredAcceptedStepCount = DEFAULT_MEASURED_STEP_COUNT,
): V3EvaluationCounterMeasurement {
  requireAcceptedStepCount(
    warmUpAcceptedStepCount,
    200,
    "warm-up accepted step count",
  );
  requireAcceptedStepCount(
    measuredAcceptedStepCount,
    50,
    "measured accepted step count",
  );

  const defaultOffTimings: number[] = [];
  const enabledTimings: number[] = [];
  let counterSamples: CounterSampleV3[] | null = null;
  for (const enabled of [false, true, true, false] as const) {
    const measured = runMeasuredSteps(
      enabled,
      warmUpAcceptedStepCount,
      measuredAcceptedStepCount,
      counterSamples === null && enabled,
    );
    (enabled ? enabledTimings : defaultOffTimings).push(
      measured.msPerAcceptedStep,
    );
    if (measured.counterSamples !== null) {
      counterSamples = measured.counterSamples;
    }
  }
  if (counterSamples === null) {
    throw new Error("enabled V3 counter measurement produced no samples");
  }

  const defaultOff = distribution(defaultOffTimings);
  const enabled = distribution(enabledTimings);
  return Object.freeze({
    measurementId: "main-wire-integrated-v3-evaluation-counters-v1" as const,
    nominalDtSec: NOMINAL_DT_SEC,
    warmUpAcceptedStepCount,
    measuredAcceptedStepCount,
    distributions: distributions(counterSamples),
    counterCollectionCost: Object.freeze({
      timingAcceptedStepCountPerRun: measuredAcceptedStepCount,
      defaultOffMsPerAcceptedStep: defaultOff,
      enabledMsPerAcceptedStep: enabled,
      enabledOverheadPercentFromMean:
        100 * (enabled.mean / defaultOff.mean - 1),
    }),
  });
}

function runMeasuredSteps(
  enabled: boolean,
  warmUpAcceptedStepCount: number,
  measuredAcceptedStepCount: number,
  collectCounterSamples: boolean,
): Readonly<{
  msPerAcceptedStep: number;
  counterSamples: CounterSampleV3[] | null;
}> {
  const runner = createRunner(enabled);
  for (let index = 0; index < warmUpAcceptedStepCount; index += 1) {
    runner.step();
  }
  const counterSamples = collectCounterSamples ? [] : null;
  const startedAt = performance.now();
  for (let index = 0; index < measuredAcceptedStepCount; index += 1) {
    const counters = runner.step();
    if (counterSamples !== null) {
      if (counters === null) {
        throw new Error("enabled V3 step omitted evaluation counters");
      }
      counterSamples.push(counterSample(counters));
    }
  }
  const elapsedMs = performance.now() - startedAt;
  return Object.freeze({
    msPerAcceptedStep: elapsedMs / measuredAcceptedStepCount,
    counterSamples,
  });
}

function createRunner(evaluationCounterCollection: boolean) {
  const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
  let accepted: AcceptedState = fixture.cold.acceptedState;
  let nominalGridIndex = 1;

  return Object.freeze({
    step(): MainWireFiveWallCoronaryEvaluationCountersV2 | null {
      let nominalTargetTimeSec = nominalGridIndex * NOMINAL_DT_SEC;
      while (!(nominalTargetTimeSec > accepted.acceptedTimeSec)) {
        nominalGridIndex += 1;
        nominalTargetTimeSec = nominalGridIndex * NOMINAL_DT_SEC;
      }
      const maximum = limitMainWireIntegratedModelCandidateTimeV3(
        accepted,
        nominalTargetTimeSec,
        {
          configuration: fixture.rhythm.configuration,
          externalAfNextBoundaryTimeSec: null,
        },
        fixture.profile,
        fixture.config,
      );
      const result = stepMainWireIntegratedModelV3(
        fixture.provider,
        accepted,
        Object.freeze({
          candidateTimeSec: maximum.candidateTimeSec,
          coronary: evaluationCounterCollection
            ? Object.freeze({
              ...fixture.coronaryStepInput,
              evaluationCounterCollection: "enabled" as const,
            })
            : fixture.coronaryStepInput,
          rhythm: Object.freeze({
            configuration: fixture.rhythm.configuration,
            externalAfNextBoundaryTimeSec: null,
            externalAtrialSourceBatch: null,
          }),
          dynamicMechanicalSupport: fixture.dynamicMechanicalSupport,
        }),
      );
      if (result.converged === false) {
        throw new Error(
          `V3 evaluation-counter driver failed at `
          + `${accepted.acceptedTimeSec}s: ${result.message}`,
        );
      }
      accepted = result.acceptedState;
      if (accepted.acceptedTimeSec === nominalTargetTimeSec) {
        nominalGridIndex += 1;
      }
      return result.coronaryStep.baseStep.circulationTrial.diagnostics
        .evaluationCounters ?? null;
    },
  });
}

function counterSample(
  counters: MainWireFiveWallCoronaryEvaluationCountersV2,
): CounterSampleV3 {
  const trial = counters.coronaryTrial;
  const sensitivity = counters.coronaryImplicitSensitivities;
  const mechanics = counters.mechanics;
  const solveCount = mechanics.solveInternalCoordinatesCallCount;
  if (solveCount <= 0) {
    throw new Error("V3 counter sample has no TriSeg solve");
  }
  return Object.freeze({
    hydraulicResidualEvaluationCount:
      trial.hydraulicResidualEvaluationCount
      + sensitivity.hydraulicResidualEvaluationCount,
    trialLoopHydraulicResidualEvaluationCount:
      trial.hydraulicResidualEvaluationCount,
    implicitSensitivityHydraulicResidualEvaluationCount:
      sensitivity.hydraulicResidualEvaluationCount,
    coronaryNewtonIterationCount: trial.newtonIterationCount,
    outerCirculationCandidateCount:
      counters.outerCirculationCandidateCount,
    mechanicsTotalEvaluationCount: mechanics.totalEvaluationCount,
    mechanicsCandidateCenterEvaluationCount:
      mechanics.candidateCenterEvaluationCount,
    mechanicsLvRvProbeEvaluationCount:
      mechanics.lvRvProbeEvaluationCount,
    triSegSolveInternalCoordinatesCallCount: solveCount,
    triSegEvaluateCandidateCallCount: mechanics.evaluateCandidateCallCount,
    triSegEvaluateCandidateCallsPerSolve:
      mechanics.evaluateCandidateCallCount / solveCount,
    laMaterialEvaluationCount:
      mechanics.atrialMaterialEvaluationCountByWall.LA,
    raMaterialEvaluationCount:
      mechanics.atrialMaterialEvaluationCountByWall.RA,
    laStrainChangeCount:
      mechanics.atrialFiberLogStrainChangeCountByWall.LA,
    raStrainChangeCount:
      mechanics.atrialFiberLogStrainChangeCountByWall.RA,
    laDistinctStrainInputCount:
      mechanics.atrialFiberLogStrainDistinctInputCountByWall.LA,
    raDistinctStrainInputCount:
      mechanics.atrialFiberLogStrainDistinctInputCountByWall.RA,
    laCacheableRepeatMaterialEvaluationCount:
      mechanics.atrialMaterialEvaluationCountByWall.LA
      - mechanics.atrialFiberLogStrainDistinctInputCountByWall.LA,
    raCacheableRepeatMaterialEvaluationCount:
      mechanics.atrialMaterialEvaluationCountByWall.RA
      - mechanics.atrialFiberLogStrainDistinctInputCountByWall.RA,
    sensitivityBaseResidualProbeEvaluationCount:
      sensitivity.baseResidualProbeEvaluationCount,
    sensitivityVolumeJacobianProbeEvaluationCount:
      sensitivity.volumeJacobianProbeEvaluationCount,
    sensitivityBoundaryResidualProbeEvaluationCount:
      sensitivity.boundaryResidualProbeEvaluationCount,
    sensitivityObservableProbeEvaluationCount:
      sensitivity.observableProbeEvaluationCount,
    sensitivityImplicitLinearSolveCount:
      sensitivity.implicitLinearSolveCount,
  });
}

function distributions(
  samples: readonly CounterSampleV3[],
): Readonly<Record<keyof CounterSampleV3, DistributionV3>> {
  const keys = Object.keys(samples[0]!) as (keyof CounterSampleV3)[];
  return Object.freeze(Object.fromEntries(keys.map((key) => [
    key,
    distribution(samples.map((sample) => sample[key])),
  ]))) as Readonly<Record<keyof CounterSampleV3, DistributionV3>>;
}

function distribution(values: readonly number[]): DistributionV3 {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("distribution requires finite samples");
  }
  return Object.freeze({
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  });
}

function requireAcceptedStepCount(
  value: number,
  minimum: number,
  label: string,
): void {
  if (!Number.isInteger(value) || value < minimum) {
    throw new RangeError(`${label} must be an integer >= ${minimum}`);
  }
}

function integerArgument(name: string, fallback: number): number {
  const prefix = `${name}=`;
  const raw = process.argv.find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`);
  return value;
}

if (
  process.argv[1] !== undefined
  && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const result = measureV3EvaluationCounters(
    integerArgument("--warmup", DEFAULT_WARM_UP_STEP_COUNT),
    integerArgument("--steps", DEFAULT_MEASURED_STEP_COUNT),
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
