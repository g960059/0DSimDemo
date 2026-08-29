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
  measureMainWireVentricularLandAcceptedBeatTermBalanceV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandAcceptedBeatTermBalanceV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_ACTIVATION_DISTRIBUTION_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_ACTIVATION_DISTRIBUTION_PROFILE_IDS_V1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumActivationDistributionV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowActivationDistributionWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  resolveMainWireVentricularLandWholeOrganKuwWallMaterialV1,
  type MainWireVentricularLandWholeOrganKuwProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandWholeOrganKuwBracketV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_ACTIVATION_DISTRIBUTION_WINDKESSEL_V1_ID =
  "main-wire-aortic-outflow-activation-distribution-windkessel-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const kuwProfileIds = Object.freeze([
  "land-whole-organ-kuw-nu4",
  "land-whole-organ-kuw-nu7",
] as const satisfies readonly MainWireVentricularLandWholeOrganKuwProfileIdV1[]);

const arms =
  MAIN_WIRE_VENTRICULAR_CALCIUM_ACTIVATION_DISTRIBUTION_PROFILE_IDS_V1.flatMap(
    (activationDistributionProfileId) => kuwProfileIds.map((kuwProfileId) => {
      const run =
        runMainWireNormalAdultFiveWallAorticOutflowActivationDistributionWindkesselResearchV1(
          { dtSec, maximumBeatCount },
          activationDistributionProfileId,
          kuwProfileId,
          "arterial-stiffness-twofold",
          "three-quarters-Ao-SA-resistance-upstream-of-root-compliance",
          "aortic-root-inertance-half",
        );
      const armId = `${activationDistributionProfileId}__${kuwProfileId}`;
      const beat = run.periodicResult.retainedCompleteBeats.at(-1)!;
      const calcium = beat.samples.map((sample) => Math.max(
        0,
        sample.freeCalciumUM.LVFW
          - run.calciumDriveParams.ventricular.diastolicCalciumUM,
      ));
      const activeStress = beat.samples.map((sample) =>
        Math.max(0, sample.wallStressPa.LVFW.active));
      const material =
        resolveMainWireVentricularLandWholeOrganKuwWallMaterialV1(
          kuwProfileId,
        );
      return Object.freeze({
        armId,
        activationDistributionProfile: run.activationDistributionProfile,
        kuwProfile: run.kuwProfile,
        cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
          run.periodicResult,
          run.calciumDriveParams,
          armId,
        ),
        closureMechanism:
          measureMainWireAorticOutflowClosureMechanismAuditV1(
            run.periodicResult,
          ),
        lvfwTermBalance:
          measureMainWireVentricularLandAcceptedBeatTermBalanceV1(
            run.periodicResult,
            material,
            run.periodicResult.protocolIdentity.mechanicsProvider
              .parameterIdentityHash,
          ),
        morphology: Object.freeze({
          ventricularEffectiveCalciumStrictLocalPeakCountAboveFivePercent:
            countMainWireStrictLocalMaximaV1(
              calcium,
              0.05 * Math.max(...calcium),
            ),
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
    MAIN_WIRE_AORTIC_OUTFLOW_ACTIVATION_DISTRIBUTION_WINDKESSEL_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    activationDistributionProfileIds:
      MAIN_WIRE_VENTRICULAR_CALCIUM_ACTIVATION_DISTRIBUTION_PROFILE_IDS_V1,
    kuwProfileIds,
    complianceProfileId: "arterial-stiffness-twofold" as const,
    placementProfileId:
      "three-quarters-Ao-SA-resistance-upstream-of-root-compliance" as const,
    rootInertanceProfileId: "aortic-root-inertance-half" as const,
    activationDistributionClaim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_ACTIVATION_DISTRIBUTION_CLAIM_V1,
    independentCanonicalColdStartPerArm: true as const,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    effectiveWallInputIsOneMeasuredCellCalciumTrace: false as const,
    directNormalElectricalBracketEndsAt80ms: true as const,
    profiles100And120msAreBoundarySensitivityOnly: true as const,
    explicitContractileCohortStatesAdded: false as const,
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
      supportDurationMs:
        arm.activationDistributionProfile.supportDurationSec * 1000,
      withinDirectNormalElectricalBracket:
        arm.activationDistributionProfile
          .withinDirectNormalElectricalActivationDurationBracket,
      effectiveCalciumTimeToPeakMs:
        arm.activationDistributionProfile.effectiveTimeToPeakSec * 1000,
      effectiveCalciumPeakScale:
        arm.activationDistributionProfile
          .ventricularPeakAmplitudeScaleFromPrior,
      effectiveCalciumExposureScale:
        arm.activationDistributionProfile
          .ventricularSupradiastolicCalciumCycleExposureScaleFromPrior,
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
      effectiveCalciumPeakCount:
        arm.morphology
          .ventricularEffectiveCalciumStrictLocalPeakCountAboveFivePercent,
      activeStressPeakCount:
        arm.morphology.lvfwActiveStressStrictLocalPeakCountAboveFivePercent,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      flowEndCalciumUM:
        arm.lvfwTermBalance.atAorticFlowEnd.freeCalciumUM,
      flowEndStrongPopulation:
        arm.lvfwTermBalance.atAorticFlowEnd.strongPopulationS,
      flowEndNetActiveStressKPa:
        arm.lvfwTermBalance.atAorticFlowEnd.netActiveKirchhoffStressKPa,
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
