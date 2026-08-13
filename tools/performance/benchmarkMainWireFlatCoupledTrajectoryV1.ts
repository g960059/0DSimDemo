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
  prepareMainWireFiveWallCoupledResidualContextV1,
  stepMainWireFiveWallCoronaryV2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  mainWireFiveWallCoronaryBaseStateV2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV3";
import {
  MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_CASES_V1,
} from "@/engine/vnext/MainWireSolverReplacementCorpusV1";
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
const maximumAcceptedStepsPerJacobian = integerArgument(
  "--max-accepted-steps-per-jacobian",
  2,
);
const initialGuessPolicy = stringArgument(
  "--initial-guess",
  ["context", "accepted-history"] as const,
  "context",
);
const predictionOrder = stringArgument(
  "--prediction-order",
  ["linear", "quadratic"] as const,
  "linear",
);
const componentProfileEnabled = stringArgument(
  "--profile-components",
  ["off", "on"] as const,
  "off",
) === "on";
const nestedOracleEnabled = stringArgument(
  "--nested-oracle",
  ["off", "on"] as const,
  "on",
) === "on";
const mechanicsCandidatePath = stringArgument(
  "--mechanics-candidate-path",
  ["generic-contract", "provider-owned"] as const,
  "provider-owned",
);
const corpusCaseId = stringArgument(
  "--case",
  MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_CASES_V1.map(
    (corpusCase) => corpusCase.caseId,
  ),
  "baseline",
);
const corpusCase = MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_CASES_V1.find(
  (candidate) => candidate.caseId === corpusCaseId,
);
if (corpusCase === undefined) throw new Error("benchmark case is unavailable");
const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3(
  corpusCase.hemodynamicResearchInputs,
  corpusCase.ventricularContractilityScale,
);
const providerProfile = {
  mechanicsMs: 0,
  mechanicsCalls: 0,
};
const candidatePathProvider = mechanicsCandidatePath === "generic-contract"
  ? Object.freeze({ ...fixture.provider })
  : fixture.provider;
const provider = componentProfileEnabled
  && mechanicsCandidatePath === "generic-contract"
  ? Object.freeze({
    ...candidatePathProvider,
    evaluateTrial: (
      input: Parameters<typeof fixture.provider.evaluateTrial>[0],
    ): ReturnType<typeof fixture.provider.evaluateTrial> => {
      const started = performance.now();
      const result = candidatePathProvider.evaluateTrial(input);
      providerProfile.mechanicsMs += performance.now() - started;
      providerProfile.mechanicsCalls += 1;
      return result;
    },
  })
  : candidatePathProvider;
const stepInput = Object.freeze({
  ...fixture.coronaryStepInput,
  dtSec: 0.002,
});
const cold = mainWireFiveWallCoronaryBaseStateV2(
  fixture.cold.acceptedState.coronary,
);
const flat = new MainWireFlatCoupledAcceptedStateV1(cold);
let nested = cold;
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
const componentProfile = {
  residualMs: 0,
  residualCalls: 0,
  convergenceMs: 0,
  convergenceCalls: 0,
  jacobianComponentsMs: 0,
  jacobianComponentsCalls: 0,
  dependentSvMs: 0,
  dependentSvCalls: 0,
};

for (let step = -warmupSteps; step < measuredSteps; step += 1) {
  const record = step >= 0;
  const flatStarted = performance.now();
  const previous = flat.materializeAcceptedObjectBridge(provider);
  const bridgedAt = performance.now();
  const rawContext = prepareMainWireFiveWallCoupledResidualContextV1(
    provider,
    previous,
    stepInput,
  );
  const context = componentProfileEnabled
    ? Object.freeze({
      ...rawContext,
      evaluateResidualMl: (
        unknownsMl: Float64Array,
        destinationResidualMl: Float64Array,
      ): void => {
        const started = performance.now();
        rawContext.evaluateResidualMl(unknownsMl, destinationResidualMl);
        componentProfile.residualMs += performance.now() - started;
        componentProfile.residualCalls += 1;
      },
      isResidualConverged: (
        unknownsMl: Float64Array,
        destinationResidualMl: Float64Array,
      ): boolean => {
        const started = performance.now();
        const converged = rawContext.isResidualConverged(
          unknownsMl,
          destinationResidualMl,
        );
        componentProfile.convergenceMs += performance.now() - started;
        componentProfile.convergenceCalls += 1;
        return converged;
      },
      evaluateDependentSvContinuityResidualMl: (
        unknownsMl: Float64Array,
      ): number => {
        const started = performance.now();
        const residual = rawContext.evaluateDependentSvContinuityResidualMl(
          unknownsMl,
        );
        componentProfile.dependentSvMs += performance.now() - started;
        componentProfile.dependentSvCalls += 1;
        return residual;
      },
      writeCoupledLinearizations: (
        ...args: Parameters<typeof rawContext.writeCoupledLinearizations>
      ): boolean => {
        const started = performance.now();
        const complete = rawContext.writeCoupledLinearizations(...args);
        componentProfile.jacobianComponentsMs += performance.now() - started;
        componentProfile.jacobianComponentsCalls += 1;
        return complete;
      },
    })
    : rawContext;
  const preparedAt = performance.now();
  const solverOptions = Object.freeze({
    maximumAcceptedStepsPerJacobian,
    analyticJacobianPolicy: "require-complete" as const,
  });
  const predicted = initialGuessPolicy === "accepted-history"
    ? solveMainWireFiveWallCoupledNewtonPredictedV1(
      context,
      solverOptions,
      coupledWorkspace,
      predictorWorkspace,
      predictionOrder,
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
  if (initialGuessPolicy === "accepted-history") {
    recordAcceptedMainWireFiveWallCoupledSolutionV1(
      context,
      coupled.result.solution,
      predictorWorkspace,
    );
  }
  const admittedAt = performance.now();

  const nestedStarted = performance.now();
  if (nestedOracleEnabled) {
    const nestedStep = stepMainWireFiveWallCoronaryV2(
      fixture.provider,
      nested,
      stepInput,
      coronaryWorkspace,
      nonCoronaryWorkspace,
    );
    if (nestedStep.converged === false) {
      throw new Error(`nested step ${step}: ${nestedStep.message}`);
    }
    nested = nestedStep.acceptedState;
  }
  const nestedEnded = performance.now();
  if (record) {
    flatTotalMs.push(admittedAt - flatStarted);
    bridgeMs.push(bridgedAt - flatStarted);
    contextMs.push(preparedAt - bridgedAt);
    solveMs.push(solvedAt - preparedAt);
    admissionMs.push(admittedAt - solvedAt);
    if (nestedOracleEnabled) {
      nestedTotalMs.push(nestedEnded - nestedStarted);
    }
    coupledIterations.push(coupled.result.iterations);
    coupledResidualEvaluations.push(coupled.result.residualEvaluationCount);
    coupledJacobianEvaluations.push(coupled.result.jacobianEvaluationCount);
    coupledLineSearchBacktracks.push(
      coupled.result.lineSearchBacktrackCount,
    );
  }
}

const flatSummary = summarize(flatTotalMs);
const nestedSummary = nestedOracleEnabled ? summarize(nestedTotalMs) : null;
process.stdout.write(`${JSON.stringify(Object.freeze({
  benchmarkId: "main-wire-flat-coupled-trajectory-v1",
  claim: "local-development-diagnostic-not-supported-hardware-gate",
  warmupSteps,
  measuredSteps,
  corpusCaseId,
  maximumAcceptedStepsPerJacobian,
  initialGuessPolicy,
  predictionOrder,
  mechanicsCandidatePath,
  componentProfileEnabled,
  nestedOracleEnabled,
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
  predictor: initialGuessPolicy === "accepted-history"
    ? Object.freeze({
      ...reportMainWireFiveWallCoupledPredictorV1(predictorWorkspace),
      solverFallbackCount: predictorFallbackCount,
    })
    : null,
  componentProfile: componentProfileEnabled
    ? Object.freeze({
      ...componentProfile,
      residualMeanMs: componentProfile.residualMs
        / componentProfile.residualCalls,
      convergenceMeanMs: componentProfile.convergenceMs
        / componentProfile.convergenceCalls,
      jacobianComponentsMeanMs: componentProfile.jacobianComponentsMs
        / componentProfile.jacobianComponentsCalls,
      dependentSvMeanMs: componentProfile.dependentSvMs
        / componentProfile.dependentSvCalls,
      ...(mechanicsCandidatePath === "generic-contract"
        ? {
          mechanicsProviderMs: providerProfile.mechanicsMs,
          mechanicsProviderCalls: providerProfile.mechanicsCalls,
          mechanicsProviderMeanMs: providerProfile.mechanicsCalls === 0
            ? 0
            : providerProfile.mechanicsMs / providerProfile.mechanicsCalls,
        }
        : {}),
    })
    : null,
  medianSpeedup: nestedSummary === null
    ? null
    : nestedSummary.medianMs / flatSummary.medianMs,
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
