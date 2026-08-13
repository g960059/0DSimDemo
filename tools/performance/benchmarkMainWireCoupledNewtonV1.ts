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
import {
  buildCoronaryTopologyV2,
} from "@/engine/coronary/topologyPriorV2";
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
  advanceMainWireFiveWallCoupledNewtonV1,
  createMainWireFiveWallCoupledNewtonShadowWorkspaceV1,
  solveMainWireFiveWallCoupledNewtonShadowV1,
} from "@/engine/vnext/coupled/MainWireFiveWallCoupledNewtonShadowV1";

const measuredIterations = integerArgument("--iterations", 20);
const warmupIterations = integerArgument("--warmup", 5);
const dtSec = numericArgument("--dt", 0.002);
const maximumAcceptedStepsPerJacobian = integerArgument(
  "--jacobian-reuse",
  1,
);
const benchmarkMode = enumArgument(
  "--mode",
  ["all", "production", "analytic", "finite-difference", "legacy"] as const,
  "all",
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
const cold = initializeMainWireFiveWallCoronaryV2({
  provider,
  runtime,
  calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  pericardium,
});
const stepInput = Object.freeze({
  dtSec,
  runtime,
  calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  pericardium,
});
const createContext = () => prepareMainWireFiveWallCoupledResidualContextV1(
  provider,
  cold.acceptedState,
  stepInput,
);
const analyticWorkspace =
  createMainWireFiveWallCoupledNewtonShadowWorkspaceV1();
const authorityWorkspace =
  createMainWireFiveWallCoupledNewtonShadowWorkspaceV1();
const finiteDifferenceWorkspace =
  createMainWireFiveWallCoupledNewtonShadowWorkspaceV1();
const legacyCoronaryWorkspace = createCoronaryBackwardEulerScratchWorkspaceV2(
  buildCoronaryTopologyV2(
    MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
  ),
);
const legacyNonCoronaryWorkspace =
  createNonCoronaryBackwardEulerScratchWorkspaceV1();

const analyticSamplesMs: number[] = [];
const authoritySamplesMs: number[] = [];
const analyticPreparationSamplesMs: number[] = [];
const analyticSolveSamplesMs: number[] = [];
const finiteDifferenceSamplesMs: number[] = [];
const legacySamplesMs: number[] = [];
let analyticJacobianResidualEvaluations = 0;
let finiteDifferenceJacobianResidualEvaluations = 0;
let analyticNewtonIterations = 0;
let analyticResidualEvaluations = 0;
let analyticJacobianEvaluations = 0;
let analyticLineSearchBacktracks = 0;

for (
  let iteration = -warmupIterations;
  iteration < measuredIterations;
  iteration += 1
) {
  const record = iteration >= 0;
  const runAnalytic = benchmarkMode === "all"
    || benchmarkMode === "production"
    || benchmarkMode === "analytic";
  const runLegacy = benchmarkMode === "all"
    || benchmarkMode === "production"
    || benchmarkMode === "legacy";
  const runFiniteDifference = benchmarkMode === "all"
    || benchmarkMode === "finite-difference";
  const runAuthority = benchmarkMode === "all"
    || benchmarkMode === "production";
  const analyticStartedAtMs = performance.now();
  const analyticContext = runAnalytic ? createContext() : null;
  const analyticPreparedAtMs = performance.now();
  const analytic = analyticContext === null
    ? null
    : solveMainWireFiveWallCoupledNewtonShadowV1(
      analyticContext,
      Object.freeze({ maximumAcceptedStepsPerJacobian }),
      analyticWorkspace,
    );
  const analyticSolvedAtMs = performance.now();
  const analyticWallTimeMs = analyticSolvedAtMs - analyticStartedAtMs;
  if (analytic !== null && analytic.result.status !== "converged") {
    throw new Error(`analytic coupled solve failed: ${analytic.result.message}`);
  }

  const authorityStartedAtMs = performance.now();
  const authority = runAuthority
    ? advanceMainWireFiveWallCoupledNewtonV1(
      createContext(),
      Object.freeze({ maximumAcceptedStepsPerJacobian }),
      authorityWorkspace,
    )
    : null;
  const authorityWallTimeMs = performance.now() - authorityStartedAtMs;
  if (authority !== null && authority.status !== "accepted") {
    throw new Error(
      `coupled authority failed: ${authority.status}`,
    );
  }

  const legacyStartedAtMs = performance.now();
  const legacy = runLegacy
    ? stepMainWireFiveWallCoronaryV2(
      provider,
      cold.acceptedState,
      stepInput,
      legacyCoronaryWorkspace,
      legacyNonCoronaryWorkspace,
    )
    : null;
  const legacyWallTimeMs = performance.now() - legacyStartedAtMs;
  if (legacy !== null && legacy.converged === false) {
    throw new Error(`legacy nested solve failed: ${legacy.message}`);
  }

  const finiteDifferenceStartedAtMs = performance.now();
  const finiteDifference = runFiniteDifference
    ? solveMainWireFiveWallCoupledNewtonShadowV1(
      createContext(),
      { jacobianMode: "central-difference" },
      finiteDifferenceWorkspace,
    )
    : null;
  const finiteDifferenceWallTimeMs =
    performance.now() - finiteDifferenceStartedAtMs;
  if (
    finiteDifference !== null
    && finiteDifference.result.status !== "converged"
  ) {
    throw new Error(
      `finite-difference coupled solve failed: ${finiteDifference.result.message}`,
    );
  }

  if (record) {
    if (analytic !== null) {
      analyticSamplesMs.push(analyticWallTimeMs);
      analyticPreparationSamplesMs.push(
        analyticPreparedAtMs - analyticStartedAtMs,
      );
      analyticSolveSamplesMs.push(analyticSolvedAtMs - analyticPreparedAtMs);
      analyticJacobianResidualEvaluations +=
        analytic.jacobianResidualEvaluationCount;
      analyticNewtonIterations += analytic.result.iterations;
      analyticResidualEvaluations += analytic.result.residualEvaluationCount;
      analyticJacobianEvaluations += analytic.result.jacobianEvaluationCount;
      analyticLineSearchBacktracks +=
        analytic.result.lineSearchBacktrackCount;
    }
    if (authority !== null) authoritySamplesMs.push(authorityWallTimeMs);
    if (legacy !== null) legacySamplesMs.push(legacyWallTimeMs);
    if (finiteDifference !== null) {
      finiteDifferenceSamplesMs.push(finiteDifferenceWallTimeMs);
      finiteDifferenceJacobianResidualEvaluations +=
        finiteDifference.jacobianResidualEvaluationCount;
    }
  }
}

const analytic = summarizeOrNull(analyticSamplesMs);
const authority = summarizeOrNull(authoritySamplesMs);
const analyticPreparation = summarizeOrNull(analyticPreparationSamplesMs);
const analyticSolve = summarizeOrNull(analyticSolveSamplesMs);
const finiteDifference = summarizeOrNull(finiteDifferenceSamplesMs);
const legacy = summarizeOrNull(legacySamplesMs);
process.stdout.write(`${JSON.stringify(Object.freeze({
  benchmarkId: "main-wire-coupled-newton-v1",
  claim: "local-development-diagnostic-not-supported-hardware-gate",
  benchmarkMode,
  dtSec,
  maximumAcceptedStepsPerJacobian,
  warmupIterations,
  measuredIterations,
  analytic,
  authority,
  analyticPreparation,
  analyticSolve,
  finiteDifference,
  legacy,
  speedup: Object.freeze({
    analyticOverFiniteDifference: analytic === null || finiteDifference === null
      ? null
      : finiteDifference.medianWallTimeMs / analytic.medianWallTimeMs,
    analyticOverLegacyNested: analytic === null || legacy === null
      ? null
      : legacy.medianWallTimeMs / analytic.medianWallTimeMs,
    authorityOverLegacyNested: authority === null || legacy === null
      ? null
      : legacy.medianWallTimeMs / authority.medianWallTimeMs,
  }),
  work: Object.freeze({
    analyticMeanNewtonIterations: analytic === null
      ? null
      : analyticNewtonIterations / measuredIterations,
    analyticMeanResidualEvaluations: analytic === null
      ? null
      : analyticResidualEvaluations / measuredIterations,
    analyticMeanJacobianEvaluations: analytic === null
      ? null
      : analyticJacobianEvaluations / measuredIterations,
    analyticMeanLineSearchBacktracks: analytic === null
      ? null
      : analyticLineSearchBacktracks / measuredIterations,
    analyticMeanJacobianResidualEvaluations: analytic === null
      ? null
      : analyticJacobianResidualEvaluations / measuredIterations,
    finiteDifferenceMeanJacobianResidualEvaluations:
      finiteDifference === null
        ? null
        : finiteDifferenceJacobianResidualEvaluations / measuredIterations,
  }),
}), null, 2)}\n`);

function summarize(samples: readonly number[]): Readonly<{
  meanWallTimeMs: number;
  medianWallTimeMs: number;
  p95WallTimeMs: number;
  minimumWallTimeMs: number;
  maximumWallTimeMs: number;
}> {
  if (samples.length === 0) throw new Error("benchmark has no samples");
  const sorted = [...samples].sort((left, right) => left - right);
  const mean = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
  return Object.freeze({
    meanWallTimeMs: mean,
    medianWallTimeMs: percentile(sorted, 0.5),
    p95WallTimeMs: percentile(sorted, 0.95),
    minimumWallTimeMs: sorted[0]!,
    maximumWallTimeMs: sorted.at(-1)!,
  });
}

function summarizeOrNull(
  samples: readonly number[],
): ReturnType<typeof summarize> | null {
  return samples.length === 0 ? null : summarize(samples);
}

function percentile(sorted: readonly number[], quantile: number): number {
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(quantile * sorted.length) - 1),
  );
  return sorted[index]!;
}

function numericArgument(name: string, fallback: number): number {
  const value = argumentValue(name);
  const parsed = value === null ? fallback : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be positive and finite`);
  }
  return parsed;
}

function integerArgument(name: string, fallback: number): number {
  const parsed = numericArgument(name, fallback);
  if (!Number.isInteger(parsed)) throw new Error(`${name} must be an integer`);
  return parsed;
}

function enumArgument<const TValues extends readonly string[]>(
  name: string,
  values: TValues,
  fallback: TValues[number],
): TValues[number] {
  const value = argumentValue(name) ?? fallback;
  if (!values.includes(value)) {
    throw new Error(`${name} must be one of ${values.join(", ")}`);
  }
  return value as TValues[number];
}

function argumentValue(name: string): string | null {
  const prefix = `${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length) ?? null;
}
