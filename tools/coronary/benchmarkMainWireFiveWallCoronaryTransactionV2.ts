import { defaultParams } from "@/engine/core/params";
import {
  initializeMainWireFiveWallCoronaryV2,
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

const dtSec = numericArgument("--dt", 0.002);
const stepCount = integerArgument("--steps", 1);
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
const initializedAtMs = performance.now();
const cold = initializeMainWireFiveWallCoronaryV2({
  provider,
  runtime,
  calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  pericardium,
});
const initializationWallTimeMs = performance.now() - initializedAtMs;
let state = cold.acceptedState;
const samples: Array<Readonly<{
  stepIndex: number;
  wallTimeMs: number;
  outerNewtonIterations: number;
  outerJacobianMode: string;
  outerFiniteDifferenceAssemblyCount: number;
  mechanicsUniqueCandidateCount: number;
  finalCandidateCoronaryNewtonIterations: number;
  finalCandidateCoronaryLineSearchBacktracks: number;
}>> = [];

for (let stepIndex = 0; stepIndex < stepCount; stepIndex += 1) {
  const startedAtMs = performance.now();
  const stepped = stepMainWireFiveWallCoronaryV2(provider, state, {
    dtSec,
    runtime,
    calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    pericardium,
  });
  const wallTimeMs = performance.now() - startedAtMs;
  if (stepped.converged === false) {
    throw new Error(
      `V2 coupled step ${stepIndex} failed (${stepped.circulationFailureReason}): ${stepped.message}`,
    );
  }
  state = stepped.acceptedState;
  samples.push(Object.freeze({
    stepIndex,
    wallTimeMs,
    outerNewtonIterations: stepped.circulationTrial.diagnostics.iterations,
    outerJacobianMode: stepped.circulationTrial.diagnostics.jacobianMode,
    outerFiniteDifferenceAssemblyCount:
      stepped.circulationTrial.diagnostics.finiteDifferenceJacobianFallbackCount,
    mechanicsUniqueCandidateCount:
      stepped.circulationTrial.diagnostics.mechanicsCallbackUniqueCandidateCount,
    finalCandidateCoronaryNewtonIterations:
      stepped.coronaryTrial.diagnostics.newtonIterations,
    finalCandidateCoronaryLineSearchBacktracks:
      stepped.coronaryTrial.diagnostics.totalLineSearchBacktracks,
  }));
}

const totalStepWallTimeMs = samples.reduce(
  (sum, sample) => sum + sample.wallTimeMs,
  0,
);
process.stdout.write(`${JSON.stringify(Object.freeze({
  benchmarkId: "main-wire-five-wall-coronary-v2-atomic-step-v1",
  claim: "local-development-profile-not-supported-hardware-benchmark",
  dtSec,
  stepCount,
  initializationWallTimeMs,
  totalStepWallTimeMs,
  meanStepWallTimeMs: totalStepWallTimeMs / stepCount,
  projectedWallTimeSecPerOneSecondSimulation:
    totalStepWallTimeMs / stepCount / dtSec / 1000,
  finalAcceptedRevision: state.revision,
  finalAcceptedTimeSec: state.acceptedTimeSec,
  samples,
}), null, 2)}\n`);

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
