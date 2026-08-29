import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireAorticOutflowClosureMechanismAuditV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowClosureMechanismAuditV1";
import {
  countMainWireStrictLocalMaximaV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveAblationComparisonV1";
import {
  measureMainWireVentricularLandIsometricTwitchAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowIndependentActivationCohortWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_ACTIVATION_COHORT_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_LAND_ACTIVATION_COHORT_PROFILE_IDS_V1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandActivationCohortHomogenizationV1";
import {
  resolveMainWireVentricularLandWholeOrganKuwWallMaterialV1,
  type MainWireVentricularLandWholeOrganKuwProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandWholeOrganKuwBracketV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_INDEPENDENT_ACTIVATION_COHORT_WINDKESSEL_V1_ID =
  "main-wire-aortic-outflow-independent-activation-cohort-windkessel-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const kuwProfileIds = Object.freeze([
  "land-whole-organ-kuw-nu4",
  "land-whole-organ-kuw-nu7",
] as const satisfies readonly MainWireVentricularLandWholeOrganKuwProfileIdV1[]);

const arms =
  MAIN_WIRE_VENTRICULAR_LAND_ACTIVATION_COHORT_PROFILE_IDS_V1.flatMap(
    (activationCohortProfileId) => kuwProfileIds.map((kuwProfileId) => {
      const run =
        runMainWireNormalAdultFiveWallAorticOutflowIndependentActivationCohortWindkesselResearchV1(
          { dtSec, maximumBeatCount },
          activationCohortProfileId,
          kuwProfileId,
          "arterial-stiffness-twofold",
          "three-quarters-Ao-SA-resistance-upstream-of-root-compliance",
          "aortic-root-inertance-half",
        );
      const armId = `${activationCohortProfileId}__${kuwProfileId}`;
      const beat = run.periodicResult.retainedCompleteBeats.at(-1)!;
      const activeStress = beat.samples.map((sample) =>
        Math.max(0, sample.wallStressPa.LVFW.active));
      const material =
        resolveMainWireVentricularLandWholeOrganKuwWallMaterialV1(
          kuwProfileId,
        );
      return Object.freeze({
        armId,
        activationCohortProfile: run.activationCohortProfile,
        kuwProfile: run.kuwProfile,
        localCellIsometric: measureMainWireVentricularLandIsometricTwitchAuditV1(
          FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
          { dtSec, fixedLandStretch: 1 },
          material,
        ),
        cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
          run.periodicResult,
          run.calciumDriveParams,
          armId,
        ),
        closureMechanism:
          measureMainWireAorticOutflowClosureMechanismAuditV1(
            run.periodicResult,
          ),
        morphology: Object.freeze({
          lvfwActiveStressStrictLocalPeakCountAboveFivePercent:
            countMainWireStrictLocalMaximaV1(
              activeStress,
              0.05 * Math.max(...activeStress),
            ),
        }),
        runnerClaim: run.claim,
      });
    }),
  );

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_INDEPENDENT_ACTIVATION_COHORT_WINDKESSEL_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    activationCohortProfileIds:
      MAIN_WIRE_VENTRICULAR_LAND_ACTIVATION_COHORT_PROFILE_IDS_V1,
    kuwProfileIds,
    complianceProfileId: "arterial-stiffness-twofold" as const,
    placementProfileId:
      "three-quarters-Ao-SA-resistance-upstream-of-root-compliance" as const,
    rootInertanceProfileId: "aortic-root-inertance-half" as const,
    activationCohortClaim:
      MAIN_WIRE_VENTRICULAR_LAND_ACTIVATION_COHORT_CLAIM_V1,
    independentCanonicalColdStartPerArm: true as const,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    localCellTwitchMustRemainCanonical: true as const,
    directNormalElectricalBracketEndsAt80ms: true as const,
    explicitContractileCohortStatesAdded: true as const,
    aggregateStressIsNotOneLocalCellTrace: true as const,
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
      supportDurationMs: arm.activationCohortProfile.supportDurationSec * 1000,
      localIsometricTimeToPeakMs:
        arm.localCellIsometric.activeTwitch.timeToPeakSec * 1000,
      localIsometricRelaxationTime50Ms:
        arm.localCellIsometric.activeTwitch.relaxationTime50Sec! * 1000,
      localIsometricRelaxationTime95Ms:
        arm.localCellIsometric.activeTwitch.relaxationTime95Sec! * 1000,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        arm.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      strokeVolumeMl: arm.cycle.aorticForwardVolumeMl,
      peakFlowMlPerSec: arm.cycle.aorticMaximumFlowMlPerSec,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      leftVentricularEjectionFraction01:
        arm.cycle.leftVentricularEjectionFraction01,
      activeStressPeakCount:
        arm.morphology.lvfwActiveStressStrictLocalPeakCountAboveFivePercent,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
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
