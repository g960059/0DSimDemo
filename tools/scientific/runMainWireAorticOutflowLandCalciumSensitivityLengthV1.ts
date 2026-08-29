import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireAorticOutflowClosureMechanismAuditV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowClosureMechanismAuditV1";
import {
  measureMainWireVentricularLandAcceptedBeatTermBalanceV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandAcceptedBeatTermBalanceV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SENSITIVITY_LENGTH_BRACKET_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SENSITIVITY_LENGTH_PROFILE_IDS_V1,
  resolveMainWireVentricularLandCalciumSensitivityLengthWallMaterialV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandCalciumSensitivityLengthBracketV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LAND_CALCIUM_SENSITIVITY_LENGTH_V1_ID =
  "main-wire-aortic-outflow-land-calcium-sensitivity-length-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const kuwProfileId = "land-whole-organ-kuw-nu4" as const;
const sarcomereReferenceProfileId =
  "land-sarcomere-reference-plus-5-percent" as const;
const complianceProfileId = "arterial-stiffness-twofold" as const;
const placementProfileId =
  "three-quarters-Ao-SA-resistance-upstream-of-root-compliance" as const;
const rootInertanceProfileId = "aortic-root-inertance-half" as const;

const arms = MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SENSITIVITY_LENGTH_PROFILE_IDS_V1
  .map((calciumSensitivityLengthProfileId) => {
    const run =
      runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
        { dtSec, maximumBeatCount },
        kuwProfileId,
        complianceProfileId,
        placementProfileId,
        rootInertanceProfileId,
        sarcomereReferenceProfileId,
        calciumSensitivityLengthProfileId,
      );
    const material =
      resolveMainWireVentricularLandCalciumSensitivityLengthWallMaterialV1(
        calciumSensitivityLengthProfileId,
        sarcomereReferenceProfileId,
        kuwProfileId,
      );
    return Object.freeze({
      armId: calciumSensitivityLengthProfileId,
      calciumSensitivityLengthProfile:
        run.calciumSensitivityLengthProfile,
      cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
        run.periodicResult,
        run.calciumDriveParams,
        calciumSensitivityLengthProfileId,
      ),
      closureMechanism: measureMainWireAorticOutflowClosureMechanismAuditV1(
        run.periodicResult,
      ),
      landTermBalance:
        measureMainWireVentricularLandAcceptedBeatTermBalanceV1(
          run.periodicResult,
          material,
          run.periodicResult.protocolIdentity.mechanicsProvider
            .parameterIdentityHash,
        ),
      runnerClaim: run.claim,
    });
  });

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_LAND_CALCIUM_SENSITIVITY_LENGTH_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    calciumSensitivityLengthProfileIds:
      MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SENSITIVITY_LENGTH_PROFILE_IDS_V1,
    calciumProfileId:
      "main-wire-ventricular-calcium-land-coppini-source-trace-v1" as const,
    kuwProfileId,
    sarcomereReferenceProfileId,
    complianceProfileId,
    placementProfileId,
    rootInertanceProfileId,
    bracketClaim:
      MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SENSITIVITY_LENGTH_BRACKET_CLAIM_V1,
    independentCanonicalColdStartPerArm: true as const,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    primaryRepositoryNumericCalciumTraceHeldExactly: true as const,
    LandBeta0AndAllSourceParametersExceptBeta1HeldExactly: true as const,
    referenceLengthIsometricTwitchInvariantExactly: true as const,
    aorticValveAreaOrOpeningLawChanged: false as const,
    macroHemodynamicRecalibrationApplied: false as const,
    clinicalValidationClaimed: false as const,
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
      beta1ScaleFromSource:
        arm.calciumSensitivityLengthProfile.beta1ScaleFromSource,
      resolvedBeta1UM:
        arm.calciumSensitivityLengthProfile.resolvedBeta1UM,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        arm.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      strokeVolumeMl: arm.cycle.aorticForwardVolumeMl,
      peakFlowMlPerSec: arm.cycle.aorticMaximumFlowMlPerSec,
      peakVenaContractaVelocityMPerSec:
        arm.cycle.peakVenaContractaVelocityMPerSec,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      leftVentricularEjectionFraction01:
        arm.cycle.leftVentricularEjectionFraction01,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      peakLandStretch: arm.landTermBalance.atAorticFlowPeak.landStretch,
      endLandStretch: arm.landTermBalance.atAorticFlowEnd.landStretch,
      endCaTrpn: arm.landTermBalance.atAorticFlowEnd.CaTRPN,
      endStrongPopulation:
        arm.landTermBalance.atAorticFlowEnd.strongPopulationS,
      endLengthFactorH: arm.landTermBalance.atAorticFlowEnd.lengthFactorH,
      endNetActiveKirchhoffStressKPa:
        arm.landTermBalance.atAorticFlowEnd.netActiveKirchhoffStressKPa,
      finalTwentyMsActivePressureChangeMmHg:
        arm.closureMechanism.finalTwentyMillisecondsToThresholdEnd
          .triSegPressureChangeByComponentMmHg.active,
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
