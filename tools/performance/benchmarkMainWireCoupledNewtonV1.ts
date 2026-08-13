import { defaultParams } from "@/engine/core/params";
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
  solveMainWireFiveWallCoupledNewtonShadowV1,
} from "@/engine/vnext/coupled/MainWireFiveWallCoupledNewtonShadowV1";

const measuredIterations = integerArgument("--iterations", 20);
const warmupIterations = integerArgument("--warmup", 5);
const dtSec = numericArgument("--dt", 0.002);
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
const context = prepareMainWireFiveWallCoupledResidualContextV1(
  provider,
  cold.acceptedState,
  stepInput,
);

const analyticSamplesMs: number[] = [];
const finiteDifferenceSamplesMs: number[] = [];
const legacySamplesMs: number[] = [];
let analyticJacobianResidualEvaluations = 0;
let finiteDifferenceJacobianResidualEvaluations = 0;

for (
  let iteration = -warmupIterations;
  iteration < measuredIterations;
  iteration += 1
) {
  const record = iteration >= 0;
  const analyticStartedAtMs = performance.now();
  const analytic = solveMainWireFiveWallCoupledNewtonShadowV1(context);
  const analyticWallTimeMs = performance.now() - analyticStartedAtMs;
  if (analytic.result.status !== "converged") {
    throw new Error(`analytic coupled solve failed: ${analytic.result.message}`);
  }

  const legacyStartedAtMs = performance.now();
  const legacy = stepMainWireFiveWallCoronaryV2(
    provider,
    cold.acceptedState,
    stepInput,
  );
  const legacyWallTimeMs = performance.now() - legacyStartedAtMs;
  if (legacy.converged === false) {
    throw new Error(`legacy nested solve failed: ${legacy.message}`);
  }

  const finiteDifferenceStartedAtMs = performance.now();
  const finiteDifference = solveMainWireFiveWallCoupledNewtonShadowV1(
    context,
    { jacobianMode: "central-difference" },
  );
  const finiteDifferenceWallTimeMs =
    performance.now() - finiteDifferenceStartedAtMs;
  if (finiteDifference.result.status !== "converged") {
    throw new Error(
      `finite-difference coupled solve failed: ${finiteDifference.result.message}`,
    );
  }

  if (record) {
    analyticSamplesMs.push(analyticWallTimeMs);
    legacySamplesMs.push(legacyWallTimeMs);
    finiteDifferenceSamplesMs.push(finiteDifferenceWallTimeMs);
    analyticJacobianResidualEvaluations +=
      analytic.jacobianResidualEvaluationCount;
    finiteDifferenceJacobianResidualEvaluations +=
      finiteDifference.jacobianResidualEvaluationCount;
  }
}

const analytic = summarize(analyticSamplesMs);
const finiteDifference = summarize(finiteDifferenceSamplesMs);
const legacy = summarize(legacySamplesMs);
process.stdout.write(`${JSON.stringify(Object.freeze({
  benchmarkId: "main-wire-coupled-newton-v1",
  claim: "local-development-diagnostic-not-supported-hardware-gate",
  dtSec,
  warmupIterations,
  measuredIterations,
  analytic,
  finiteDifference,
  legacy,
  speedup: Object.freeze({
    analyticOverFiniteDifference:
      finiteDifference.medianWallTimeMs / analytic.medianWallTimeMs,
    analyticOverLegacyNested:
      legacy.medianWallTimeMs / analytic.medianWallTimeMs,
  }),
  work: Object.freeze({
    analyticMeanJacobianResidualEvaluations:
      analyticJacobianResidualEvaluations / measuredIterations,
    finiteDifferenceMeanJacobianResidualEvaluations:
      finiteDifferenceJacobianResidualEvaluations / measuredIterations,
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

function argumentValue(name: string): string | null {
  const prefix = `${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length) ?? null;
}
