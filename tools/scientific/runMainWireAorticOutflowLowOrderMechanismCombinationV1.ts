import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLowOrderMechanismCombinationResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LOW_ORDER_MECHANISM_COMBINATION_V1_ID =
  "main-wire-aortic-outflow-low-order-mechanism-combination-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const complianceProfileIds = Object.freeze([
  "canonical",
  "arterial-stiffness-twofold",
] as const);
const placementProfileIds = Object.freeze([
  null,
  "all-Ao-SA-resistance-upstream-of-root-compliance",
] as const);
const timingCandidateIds = Object.freeze([
  "canonical",
  "land-rw-three-quarters-trpn50-six-fifths",
] as const);

const arms = complianceProfileIds.flatMap((complianceProfileId) =>
  placementProfileIds.flatMap((placementProfileId) =>
    timingCandidateIds.map((timingCandidateId) => {
      const run =
        runMainWireNormalAdultFiveWallAorticOutflowLowOrderMechanismCombinationResearchV1(
          { dtSec, maximumBeatCount },
          complianceProfileId,
          placementProfileId,
          timingCandidateId,
        );
      const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
        run.periodicResult,
        run.calciumDriveParams,
        `${complianceProfileId}__${placementProfileId ?? "canonical-placement"}__${timingCandidateId}`,
      );
      return Object.freeze({
        armId:
          `${complianceProfileId}__${placementProfileId ?? "canonical-placement"}__${timingCandidateId}`,
        complianceProfile: run.complianceProfile,
        placementProfile: run.placementProfile,
        twitchTimingCandidate: run.twitchTimingCandidate,
        cycle,
        runnerClaim: run.claim,
      });
    })),
);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_AORTIC_OUTFLOW_LOW_ORDER_MECHANISM_COMBINATION_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    complianceProfileIds,
    placementProfileIds,
    timingCandidateIds,
    fullTwoByTwoByTwoFactorial: true as const,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    etIsPrimaryReadback: true as const,
    characteristicResistancePlacementChangesPressureStationMeaning:
      true as const,
    movedResistanceIsNotAValveLossClaim: true as const,
    proximalPressureStationReconstructionImplemented: false as const,
    loadEnvelopeTested: false as const,
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
    arms: arms.map((arm) => ({
      armId: arm.armId,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        arm.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      aorticForwardVolumeMl: arm.cycle.aorticForwardVolumeMl,
      peakAorticFlowMlPerSec: arm.cycle.aorticMaximumFlowMlPerSec,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      meanNodeGradientMmHg: arm.cycle.meanNodeGradientMmHg,
      peakNodeGradientMmHg: arm.cycle.peakNodeGradientMmHg,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      aorticPulsePressureMmHg:
        arm.cycle.maximumAorticRootPressureMmHg
        - arm.cycle.minimumAorticRootPressureMmHg,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      terminationReason: arm.cycle.terminationReason,
    })),
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
