import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  compareMainWireAorticOutflowLengthDependenceRootResistanceFactorialV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowLengthDependenceRootResistanceFactorialV1";
import {
  MAIN_WIRE_AORTIC_ROOT_RESISTANCE_RESEARCH_CLAIM_V1,
} from "@/engine/core/MainWireAorticRootResistanceResearchProfileV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_CLAIM_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowLengthDependenceRootResistanceAblationV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  runMainWireNormalAdultFiveWallAorticOutflowLengthDependenceRootResistanceResearchArmV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_EXPERIMENT_V1_ID =
  "main-wire-aortic-outflow-length-dependence-root-resistance-experiment-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument(
  "--maximum-beats",
  Math.max(
    48,
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1
      .defaultMaximumBeatCount,
  ),
);
const outputPath = optionalArgument("--output");
const runs =
  MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_ARM_IDS_V1.map(
    (armId) =>
      runMainWireNormalAdultFiveWallAorticOutflowLengthDependenceRootResistanceResearchArmV1(
        { dtSec, maximumBeatCount },
        armId,
      ),
  );
const comparison =
  compareMainWireAorticOutflowLengthDependenceRootResistanceFactorialV1(
    runs.map((run) => Object.freeze({
      armId: run.arm.armId,
      periodicResult: run.periodicResult,
    })),
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    armOrder:
      MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_ARM_IDS_V1,
    ablationClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_CLAIM_V1,
    rootResistanceClaim:
      MAIN_WIRE_AORTIC_ROOT_RESISTANCE_RESEARCH_CLAIM_V1,
  }),
  exactProtocolIdentityHashes: Object.freeze(Object.fromEntries(
    runs.map((run) => [
      run.arm.armId,
      run.periodicResult.protocolIdentityHash,
    ]),
  )),
  resolvedArms: Object.freeze(runs.map((run) => Object.freeze({
    arm: run.arm,
    materialPoint: run.materialPoint,
    aorticRootResistanceProfile: run.aorticRootResistanceProfile,
    runnerClaim: run.claim,
  }))),
  comparison,
  interpretationBoundary: Object.freeze({
    sourceLengthDependenceRecalibrationEstablished: false as const,
    proximalCharacteristicImpedanceIdentificationEstablished: false as const,
    clinicalValidationEstablished: false as const,
    canonicalAdoptionEstablished: false as const,
    dtRefinementRequiredBeforeAdoption: true as const,
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
    referenceLengthIsometricInvariance:
      report.comparison.referenceLengthIsometricInvariance,
    arms: report.comparison.arms.map((arm) => ({
      armId: arm.armId,
      terminationReason: arm.cycle.terminationReason,
      periodicSteadyStateClaimed: arm.cycle.periodicSteadyStateClaimed,
      lengthDependenceScale:
        arm.lengthDependenceScaleFromBaseline,
      rootResistanceScale: arm.rootResistanceScaleFromTopology,
      aorticMaximumFlowMlPerSec: arm.cycle.aorticMaximumFlowMlPerSec,
      aorticEjectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      aorticForwardVolumeMl: arm.cycle.aorticForwardVolumeMl,
      cardiacOutputLPerMin: arm.cycle.netAorticCardiacOutputLPerMin,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      aorticPulsePressureMmHg: arm.aorticPulsePressureMmHg,
      peakLeftVentricularPressureMmHg:
        arm.cycle.peakLeftVentricularPressureMmHg,
      lvfwActiveStressAtAorticFlowPeakKPa:
        arm.loadedWallTimingByWall.LVFW
          .activeStressAtAorticFlowPeakPa / 1000,
      lvfwLandStretchAtAorticFlowPeak:
        arm.loadedWallTimingByWall.LVFW.landStretchAtAorticFlowPeak,
      aorticFlowPeakCount:
        arm.cycle.aorticFlowPeakCountAboveFivePercent,
      maximumRootPressureBalanceResidualMmHg:
        arm.rootResistanceBalance
          .maximumAbsolutePressureBalanceResidualMmHg,
      candidateScreen: arm.candidateScreen,
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
