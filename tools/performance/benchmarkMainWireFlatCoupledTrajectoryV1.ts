import { defaultParams } from "@/engine/core/params";
import {
  createNonCoronaryBackwardEulerScratchWorkspaceV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  createCoronaryBackwardEulerScratchWorkspaceV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
} from "@/engine/coronary/mainWireNormalAdultCoronaryV2";
import { buildCoronaryTopologyV2 } from "@/engine/coronary/topologyPriorV2";
import {
  initializeMainWireFiveWallCoronaryV2,
  prepareMainWireFiveWallCoupledResidualContextV1,
  stepMainWireFiveWallCoronaryV2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import {
  createMainWireFiveWallCoupledPredictorWorkspaceV1,
  recordAcceptedMainWireFiveWallCoupledSolutionV1,
  reportMainWireFiveWallCoupledPredictorV1,
} from "@/engine/vnext/coupled/MainWireFiveWallCoupledPredictorV1";
import {
  createMainWireFiveWallCoupledNewtonShadowWorkspaceV1,
  solveMainWireFiveWallCoupledNewtonPredictedV1,
  solveMainWireFiveWallCoupledNewtonShadowV1,
} from "@/engine/vnext/coupled/MainWireFiveWallCoupledNewtonShadowV1";
import {
  MainWireFlatCoupledAcceptedStateV1,
} from "@/engine/vnext/coupled/MainWireFlatCoupledAcceptedStateV1";

const measuredSteps = integerArgument("--steps", 1_000);
const warmupSteps = integerArgument("--warmup", 100);
const initialGuessPolicy = stringArgument(
  "--initial-guess",
  ["context", "linear-predictor"] as const,
  "context",
);
const base = defaultParams();
const runtime = Object.freeze({
  vascular: Object.freeze({
    venousTone: base.venousTone,
    arterialStiffness: base.arterialStiffness,
  }),
  losses: Object.freeze({
    systemicResistance: base.systemicResistance,
    pulmonaryResistance: base.pulmonaryResistance,
  }),
  respiratory: Object.freeze({
    PEEP: 0,
    Pth0: 0,
    respAmpTh: 0,
    respAmpAlv: 0,
    respRate: 0,
  }),
  valveResearchInput: MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
});
const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
const pericardium = createMainWireNormalAdultCommonPericardiumV1();
const stepInput = Object.freeze({
  dtSec: 0.002,
  runtime,
  calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  pericardium,
});
const flatCold = initializeMainWireFiveWallCoronaryV2({
  provider,
  runtime,
  calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  pericardium,
});
const nestedCold = initializeMainWireFiveWallCoronaryV2({
  provider,
  runtime,
  calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  pericardium,
});
const flat = new MainWireFlatCoupledAcceptedStateV1(flatCold.acceptedState);
let nested = nestedCold.acceptedState;
const coupledWorkspace = createMainWireFiveWallCoupledNewtonShadowWorkspaceV1();
const predictorWorkspace =
  createMainWireFiveWallCoupledPredictorWorkspaceV1();
const coronaryWorkspace = createCoronaryBackwardEulerScratchWorkspaceV2(
  buildCoronaryTopologyV2(MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2),
);
const nonCoronaryWorkspace =
  createNonCoronaryBackwardEulerScratchWorkspaceV1();
const flatTotalMs: number[] = [];
const bridgeMs: number[] = [];
const contextMs: number[] = [];
const solveMs: number[] = [];
const admissionMs: number[] = [];
const nestedTotalMs: number[] = [];
const coupledIterations: number[] = [];
const coupledResidualEvaluations: number[] = [];
const coupledJacobianEvaluations: number[] = [];
const coupledLineSearchBacktracks: number[] = [];
let predictorFallbackCount = 0;

for (let step = -warmupSteps; step < measuredSteps; step += 1) {
  const record = step >= 0;
  const flatStarted = performance.now();
  const previous = flat.materializeAcceptedObjectBridge(provider);
  const bridgedAt = performance.now();
  const context = prepareMainWireFiveWallCoupledResidualContextV1(
    provider,
    previous,
    stepInput,
  );
  const preparedAt = performance.now();
  const solverOptions = Object.freeze({
    maximumAcceptedStepsPerJacobian: 2,
    analyticJacobianPolicy: "require-complete" as const,
  });
  const predicted = initialGuessPolicy === "linear-predictor"
    ? solveMainWireFiveWallCoupledNewtonPredictedV1(
      context,
      solverOptions,
      coupledWorkspace,
      predictorWorkspace,
    )
    : null;
  if (predicted?.fallbackUsed === true) predictorFallbackCount += 1;
  const coupled = predicted?.solver
    ?? solveMainWireFiveWallCoupledNewtonShadowV1(
      context,
      solverOptions,
      coupledWorkspace,
    );
  const solvedAt = performance.now();
  if (coupled.result.status !== "converged") {
    throw new Error(`flat step ${step}: ${coupled.result.message}`);
  }
  flat.stageConvergedSolution(context, coupled.result.solution);
  flat.promote();
  if (initialGuessPolicy === "linear-predictor") {
    recordAcceptedMainWireFiveWallCoupledSolutionV1(
      context,
      coupled.result.solution,
      predictorWorkspace,
    );
  }
  const admittedAt = performance.now();

  const nestedStarted = performance.now();
  const nestedStep = stepMainWireFiveWallCoronaryV2(
    provider,
    nested,
    stepInput,
    coronaryWorkspace,
    nonCoronaryWorkspace,
  );
  const nestedEnded = performance.now();
  if (nestedStep.converged === false) {
    throw new Error(`nested step ${step}: ${nestedStep.message}`);
  }
  nested = nestedStep.acceptedState;
  if (record) {
    flatTotalMs.push(admittedAt - flatStarted);
    bridgeMs.push(bridgedAt - flatStarted);
    contextMs.push(preparedAt - bridgedAt);
    solveMs.push(solvedAt - preparedAt);
    admissionMs.push(admittedAt - solvedAt);
    nestedTotalMs.push(nestedEnded - nestedStarted);
    coupledIterations.push(coupled.result.iterations);
    coupledResidualEvaluations.push(coupled.result.residualEvaluationCount);
    coupledJacobianEvaluations.push(coupled.result.jacobianEvaluationCount);
    coupledLineSearchBacktracks.push(
      coupled.result.lineSearchBacktrackCount,
    );
  }
}

const flatSummary = summarize(flatTotalMs);
const nestedSummary = summarize(nestedTotalMs);
process.stdout.write(`${JSON.stringify(Object.freeze({
  benchmarkId: "main-wire-flat-coupled-trajectory-v1",
  claim: "local-development-diagnostic-not-supported-hardware-gate",
  warmupSteps,
  measuredSteps,
  initialGuessPolicy,
  flat: flatSummary,
  flatBridge: summarize(bridgeMs),
  flatContext: summarize(contextMs),
  flatSolve: summarize(solveMs),
  flatAdmissionAndPromotion: summarize(admissionMs),
  nested: nestedSummary,
  solver: Object.freeze({
    iterations: summarizeCounts(coupledIterations),
    residualEvaluations: summarizeCounts(coupledResidualEvaluations),
    jacobianEvaluations: summarizeCounts(coupledJacobianEvaluations),
    lineSearchBacktracks: summarizeCounts(coupledLineSearchBacktracks),
  }),
  predictor: initialGuessPolicy === "linear-predictor"
    ? Object.freeze({
      ...reportMainWireFiveWallCoupledPredictorV1(predictorWorkspace),
      solverFallbackCount: predictorFallbackCount,
    })
    : null,
  medianSpeedup: nestedSummary.medianMs / flatSummary.medianMs,
  terminal: Object.freeze({
    flatRevision: flat.snapshot().revision,
    nestedRevision: nested.revision,
  }),
}), null, 2)}\n`);

function summarize(samples: readonly number[]): Readonly<{
  meanMs: number;
  medianMs: number;
  p95Ms: number;
  maximumMs: number;
}> {
  const sorted = [...samples].sort((left, right) => left - right);
  if (sorted.length === 0) throw new Error("benchmark has no samples");
  return Object.freeze({
    meanMs: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
    medianMs: percentile(sorted, 0.5),
    p95Ms: percentile(sorted, 0.95),
    maximumMs: sorted.at(-1)!,
  });
}

function percentile(sorted: readonly number[], quantile: number): number {
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(quantile * sorted.length) - 1),
  );
  return sorted[index]!;
}

function summarizeCounts(samples: readonly number[]): Readonly<{
  mean: number;
  median: number;
  p95: number;
  maximum: number;
}> {
  const sorted = [...samples].sort((left, right) => left - right);
  if (sorted.length === 0) throw new Error("benchmark has no count samples");
  return Object.freeze({
    mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
    median: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    maximum: sorted.at(-1)!,
  });
}

function integerArgument(name: string, fallback: number): number {
  const prefix = `${name}=`;
  const raw = process.argv.find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length);
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function stringArgument<TValue extends string>(
  name: string,
  values: readonly TValue[],
  fallback: TValue,
): TValue {
  const prefix = `${name}=`;
  const raw = process.argv.find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length);
  if (raw === undefined) return fallback;
  if (!values.includes(raw as TValue)) {
    throw new Error(`${name} must be one of ${values.join(", ")}`);
  }
  return raw as TValue;
}
