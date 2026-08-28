import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  compareMainWireAorticValveAreaControlV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveAreaControlComparisonV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  runMainWireNormalAdultFiveWallAorticValveAreaControlV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_CLAIM_V1,
  MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_POINT_IDS_V1,
} from "@/engine/valves/MainWireAorticValveAreaControlV1";

export const MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_EXPERIMENT_V1_ID =
  "main-wire-aortic-valve-area-control-experiment-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument(
  "--maximum-beats",
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.defaultMaximumBeatCount,
);
const outputPath = optionalArgument("--output");

const runs = MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_POINT_IDS_V1.map((pointId) =>
  runMainWireNormalAdultFiveWallAorticValveAreaControlV1(
    { dtSec, maximumBeatCount },
    pointId,
  ));
const comparison = compareMainWireAorticValveAreaControlV1(runs.map((run) => ({
  pointId: run.point.pointId,
  periodicResult: run.periodicResult,
})));
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    pointOrder: MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_POINT_IDS_V1,
    independentCanonicalColdStartPerPoint: true as const,
    commonAorticValveLawAndOpeningKinetics: true as const,
    commonDriverAndCirculatoryLoad: true as const,
    parameterSearchOrFitting: false as const,
    controlClaim: MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_CLAIM_V1,
  }),
  exactProtocolIdentityHashes: Object.freeze(Object.fromEntries(runs.map(
    (run) => [run.point.pointId, run.periodicResult.protocolIdentityHash],
  ))),
  comparison,
  interpretationBoundary: Object.freeze({
    identifiabilityControlOnly: true as const,
    clinicalNormalityPassFailApplied: false as const,
    areaCausalityBeyondBracketEstablished: false as const,
    canonicalAdoptionEstablished: false as const,
  }),
});
const serialized = `${JSON.stringify(report, null, 2)}\n`;

if (outputPath === null) {
  process.stdout.write(serialized);
} else {
  const absoluteOutputPath = path.resolve(outputPath);
  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, serialized, "utf8");
  process.stdout.write(`${JSON.stringify({
    experimentId: report.experimentId,
    outputPath: absoluteOutputPath,
    byteLength: Buffer.byteLength(serialized),
    allArmsPeriod1AndIntegrated:
      report.comparison.allArmsPeriod1AndIntegrated,
    arms: report.comparison.arms.map((arm) => ({
      pointId: arm.pointId,
      maximumForwardEoaCm2: arm.maximumForwardEoaCm2,
      aorticForwardVolumeMl: arm.aorticForwardVolumeMl,
      aorticMaximumFlowMlPerSec: arm.aorticMaximumFlowMlPerSec,
      aorticForwardFlowTimeMs: arm.aorticForwardFlowTimeSec * 1000,
      meanDopplerGradientMmHg: arm.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.peakDopplerGradientMmHg,
      kinematicGradientFloorMmHg:
        arm.kinematicFloor.meanAndPeakGradientFloorMmHg,
      flowNonuniformityFactor:
        arm.kinematicFloor.flowNonuniformityFactor,
      openingPenaltyFactor:
        arm.kinematicFloor.timeVaryingOpeningPenaltyFactor,
    })),
    contrastsToCanonical: report.comparison.contrastsToCanonical,
  })}\n`);
}

function optionalArgument(name: string): string | null {
  const equalsArgument = process.argv.find((argument) =>
    argument.startsWith(`${name}=`));
  if (equalsArgument !== undefined) {
    const value = equalsArgument.slice(name.length + 1);
    if (value === "") throw new Error(`${name} requires a value`);
    return value;
  }
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function numericArgument(name: string, fallback: number): number {
  const value = optionalArgument(name);
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!(parsed > 0) || !Number.isFinite(parsed)) {
    throw new Error(`${name} must be positive and finite`);
  }
  return parsed;
}

function integerArgument(name: string, fallback: number): number {
  const value = numericArgument(name, fallback);
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`);
  return value;
}
