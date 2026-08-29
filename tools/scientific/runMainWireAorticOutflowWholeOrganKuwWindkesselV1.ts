import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireAorticOutflowClosureMechanismAuditV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowClosureMechanismAuditV1";
import {
  measureMainWireVentricularLandIsometricTwitchAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1 as FIXED_CALCIUM,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_WHOLE_ORGAN_KUW_PROFILE_IDS_V1,
  resolveMainWireVentricularLandWholeOrganKuwWallMaterialV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandWholeOrganKuwBracketV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowWholeOrganKuwWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_WHOLE_ORGAN_KUW_WINDKESSEL_V1_ID =
  "main-wire-aortic-outflow-whole-organ-kuw-windkessel-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const contexts = Object.freeze([
  Object.freeze({
    contextId: "canonical-circulation",
    complianceProfileId: "canonical" as const,
    placementProfileId: null,
    rootInertanceProfileId: null,
  }),
  Object.freeze({
    contextId: "source-like-c2-zc-r75-lhalf",
    complianceProfileId: "arterial-stiffness-twofold" as const,
    placementProfileId:
      "three-quarters-Ao-SA-resistance-upstream-of-root-compliance" as const,
    rootInertanceProfileId: "aortic-root-inertance-half" as const,
  }),
  Object.freeze({
    contextId: "source-like-c2-zc-r75-lquarter",
    complianceProfileId: "arterial-stiffness-twofold" as const,
    placementProfileId:
      "three-quarters-Ao-SA-resistance-upstream-of-root-compliance" as const,
    rootInertanceProfileId: "aortic-root-inertance-one-quarter" as const,
  }),
]);

const isometricByProfile = Object.fromEntries(
  MAIN_WIRE_VENTRICULAR_LAND_WHOLE_ORGAN_KUW_PROFILE_IDS_V1.map(
    (profileId) => [profileId, measureMainWireVentricularLandIsometricTwitchAuditV1(
      // Every profile deliberately retains this exact calcium drive.
      // The runner verifies the same identity in closed loop below.
      FIXED_CALCIUM,
      { dtSec, fixedLandStretch: 1 },
      resolveMainWireVentricularLandWholeOrganKuwWallMaterialV1(profileId),
    )],
  ),
);

const arms = contexts.flatMap((context) =>
  MAIN_WIRE_VENTRICULAR_LAND_WHOLE_ORGAN_KUW_PROFILE_IDS_V1.map(
    (kuwProfileId) => {
      const run =
        runMainWireNormalAdultFiveWallAorticOutflowWholeOrganKuwWindkesselResearchV1(
          { dtSec, maximumBeatCount },
          kuwProfileId,
          context.complianceProfileId,
          context.placementProfileId,
          context.rootInertanceProfileId,
        );
      const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
        run.periodicResult,
        run.calciumDriveParams,
        `${context.contextId}__${kuwProfileId}`,
      );
      return Object.freeze({
        armId: `${context.contextId}__${kuwProfileId}`,
        context,
        kuwProfile: run.kuwProfile,
        complianceProfile: run.complianceProfile,
        placementProfile: run.placementProfile,
        rootInertanceProfile: run.rootInertanceProfile,
        isometric: isometricByProfile[kuwProfileId]!,
        cycle,
        closureMechanism:
          measureMainWireAorticOutflowClosureMechanismAuditV1(
            run.periodicResult,
          ),
        runnerClaim: run.claim,
      });
    },
  ));

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_WHOLE_ORGAN_KUW_WINDKESSEL_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    contexts,
    kuwProfileIds:
      MAIN_WIRE_VENTRICULAR_LAND_WHOLE_ORGAN_KUW_PROFILE_IDS_V1,
    sourcePaperDoi: "10.1016/j.yjmcc.2017.03.008" as const,
    sourceWindkesselContext: Object.freeze({
      totalPeripheralResistanceMmHgSecPerMl: 0.852,
      complianceMlPerMmHg: 2.73,
      characteristicImpedanceMmHgSecPerMl: 0.035,
    }),
    sourceFittedAeffChanged: false as const,
    sourceWholeOrganTrefChanged: false as const,
    calciumDriveChanged: false as const,
    bloodVolumeChanged: false as const,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    summedModelNodeTangentComplianceEqualsSourceWindkesselCClaimed:
      false as const,
    sourceWindkesselContainsExplicitInertance: false as const,
    modelInertanceQuarterAndHalfAreFixedSensitivityContexts: true as const,
    hemodynamicTargetUsedToChooseKuwArm: false as const,
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
    arms: arms.map((entry) => ({
      armId: entry.armId,
      nu: entry.kuwProfile.intactToSkinnedUnboundToWeakRateScaleNu,
      kuwPerSec: entry.kuwProfile.resolvedWholeOrganKuwPerSec,
      isometricTimeToPeakMs:
        entry.isometric.activeTwitch.timeToPeakSec * 1000,
      isometricRelaxationTime50Ms:
        entry.isometric.activeTwitch.relaxationTime50Sec * 1000,
      isometricRelaxationTime95Ms:
        entry.isometric.activeTwitch.relaxationTime95Sec * 1000,
      isometricPeakStressKPa: entry.isometric.activeTwitch.peakKPa,
      ejectionTimeMs: entry.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        entry.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      aorticForwardVolumeMl: entry.cycle.aorticForwardVolumeMl,
      peakAorticFlowMlPerSec: entry.cycle.aorticMaximumFlowMlPerSec,
      meanDopplerGradientMmHg: entry.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: entry.cycle.peakDopplerGradientMmHg,
      meanNodeGradientMmHg: entry.cycle.meanNodeGradientMmHg,
      meanAorticPressureMmHg: entry.cycle.meanAorticAbsolutePressureMmHg,
      peakLeftVentricularPressureMmHg:
        entry.cycle.peakLeftVentricularPressureMmHg,
      leftVentricularEjectionFraction01:
        entry.cycle.leftVentricularEjectionFraction01,
      flowPeakCount: entry.cycle.aorticFlowPeakCountAboveFivePercent,
      peakToEndLvPressureChangeMmHg:
        entry.closureMechanism.peakToThresholdEnd
          .leftVentricularAbsolutePressureChangeMmHg,
      peakToEndAorticPressureChangeMmHg:
        entry.closureMechanism.peakToThresholdEnd
          .aorticAbsolutePressureChangeMmHg,
      peakToEndActiveTriSegPressureChangeMmHg:
        entry.closureMechanism.peakToThresholdEnd
          .triSegPressureChangeByComponentMmHg.active,
      peakToEndPassiveTriSegPressureChangeMmHg:
        entry.closureMechanism.peakToThresholdEnd
          .triSegPressureChangeByComponentMmHg.passive,
      peakToEndSlsTriSegPressureChangeMmHg:
        entry.closureMechanism.peakToThresholdEnd
          .triSegPressureChangeByComponentMmHg.sls,
      endActiveTriSegPressureMmHg:
        entry.closureMechanism.atThresholdEnd
          .triSegPressureContributionMmHg.active,
      endLeftVentricularFreeCalciumUM:
        entry.closureMechanism.atThresholdEnd.leftVentricularFreeCalciumUM,
      terminationReason: entry.cycle.terminationReason,
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
