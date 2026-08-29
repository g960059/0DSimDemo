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
  measureMainWireVentricularLandIsometricTwitchFromCalciumInputV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  measureMainWireVentricularLandAcceptedBeatTermBalanceV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandAcceptedBeatTermBalanceV1";
import {
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_PROFILE_V1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumLandCoppiniSourceTraceV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  resolveMainWireVentricularLandWholeOrganKuwWallMaterialV1,
  type MainWireVentricularLandWholeOrganKuwProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandWholeOrganKuwBracketV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LAND_COPPINI_SOURCE_TRACE_WINDKESSEL_V1_ID =
  "main-wire-aortic-outflow-land-coppini-source-trace-windkessel-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const kuwProfileIds = Object.freeze([
  "land-whole-organ-kuw-nu4",
  "land-whole-organ-kuw-nu7",
] as const satisfies readonly MainWireVentricularLandWholeOrganKuwProfileIdV1[]);
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
]);

const arms = contexts.flatMap((context) => kuwProfileIds.map((kuwProfileId) => {
  const run =
    runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
      { dtSec, maximumBeatCount },
      kuwProfileId,
      context.complianceProfileId,
      context.placementProfileId,
      context.rootInertanceProfileId,
    );
  const armId = `${context.contextId}__${kuwProfileId}`;
  const beat = run.periodicResult.retainedCompleteBeats.at(-1)!;
  const activeStress = beat.samples.map((sample) =>
    Math.max(0, sample.wallStressPa.LVFW.active));
  const material =
    resolveMainWireVentricularLandWholeOrganKuwWallMaterialV1(kuwProfileId);
  const calciumInput = Object.freeze({
    calciumInputId: run.sourceTraceProfile.profileId,
    calciumInputKind: "primary-repository-numeric-source-trace" as const,
    cycleLengthSec: run.calciumDriveParams.cycleLengthSec,
    diastolicCalciumUM:
      run.calciumDriveParams.ventricular.diastolicCalciumUM,
    electricalToCalciumDelaySec:
      run.calciumDriveParams.ventricular.electricalToCalciumDelaySec,
    sourceDoi: run.sourceTraceProfile.sourceDoi,
    sourceDescription:
      "Land repository humanCai numeric vector from generate_figures.m",
    originalNumericSourceTraceUsed: true as const,
    figureDigitizationUsed: false as const,
    smoothingApplied: false as const,
    fittingApplied: false as const,
    evaluateFreeCalciumUM: (timeSec: number) =>
      evaluateFiveWallNormalCalciumDriveV1(
        timeSec,
        run.calciumDriveParams,
      ).freeCalciumUMByWall.LVFW,
  });
  return Object.freeze({
    armId,
    context,
    kuwProfile: run.kuwProfile,
    sourceTraceProfile: run.sourceTraceProfile,
    isometric:
      measureMainWireVentricularLandIsometricTwitchFromCalciumInputV1(
        calciumInput,
        { dtSec, fixedLandStretch: 1 },
        material,
      ),
    cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
      run.periodicResult,
      run.calciumDriveParams,
      armId,
    ),
    closureMechanism: measureMainWireAorticOutflowClosureMechanismAuditV1(
      run.periodicResult,
    ),
    landTermBalance: measureMainWireVentricularLandAcceptedBeatTermBalanceV1(
      run.periodicResult,
      material,
      run.periodicResult.protocolIdentity.mechanicsProvider
        .parameterIdentityHash,
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
}));

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_LAND_COPPINI_SOURCE_TRACE_WINDKESSEL_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    contexts,
    kuwProfileIds,
    sourceTraceProfile:
      MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_PROFILE_V1,
    sourceTraceClaim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_CLAIM_V1,
    independentCanonicalColdStartPerArm: true as const,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    primaryRepositoryNumericTraceUsed: true as const,
    digitizationOrWaveformFitApplied: false as const,
    sourceFittedAeffChanged: false as const,
    sourceWholeOrganTrefChanged: false as const,
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
      nu: arm.kuwProfile.intactToSkinnedUnboundToWeakRateScaleNu,
      calciumTimeToPeakMs:
        arm.isometric.calcium.timeToPeakSec * 1000,
      calciumRelaxationTime50Ms:
        arm.isometric.calcium.relaxationTime50Sec! * 1000,
      calciumRelaxationTime95Ms:
        arm.isometric.calcium.relaxationTime95Sec! * 1000,
      isometricTimeToPeakMs:
        arm.isometric.activeTwitch.timeToPeakSec * 1000,
      isometricRelaxationTime50Ms:
        arm.isometric.activeTwitch.relaxationTime50Sec! * 1000,
      isometricRelaxationTime95Ms:
        arm.isometric.activeTwitch.relaxationTime95Sec! * 1000,
      isometricPeakStressKPa: arm.isometric.activeTwitch.peakKPa,
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
      activeStressPeakCount:
        arm.morphology.lvfwActiveStressStrictLocalPeakCountAboveFivePercent,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      finalTwentyMsActivePressureChangeMmHg:
        arm.closureMechanism.finalTwentyMillisecondsToThresholdEnd
          .triSegPressureChangeByComponentMmHg.active,
      onsetLandStretch: arm.landTermBalance.atAorticFlowOnset.landStretch,
      peakLandStretch: arm.landTermBalance.atAorticFlowPeak.landStretch,
      endLandStretch: arm.landTermBalance.atAorticFlowEnd.landStretch,
      peakToEndLengthFactorChange:
        arm.landTermBalance.atAorticFlowEnd.lengthFactorH
        - arm.landTermBalance.atAorticFlowPeak.lengthFactorH,
      endDistortionStateFractionOfUndistortedStrong:
        arm.landTermBalance.atAorticFlowEnd
          .netActiveStateTermFractionOfUndistortedStrong,
      minimumEjectionDistortionStateFractionOfUndistortedStrong:
        arm.landTermBalance.aorticEjectionEpisode
          .minimumNetActiveStateTermFractionOfUndistortedStrong,
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
