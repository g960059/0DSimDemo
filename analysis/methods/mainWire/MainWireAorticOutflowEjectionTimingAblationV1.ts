import {
  MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_REFERENCE_CONTEXT_V1,
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1,
  type MainWireVentricularCalciumSourceTraceFitDiastolicFlowReadbackV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1";
import {
  measureMainWireVentricularLandIsometricTwitchAuditV1,
  type MainWireVentricularLandIsometricTwitchAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  measureMainWireVentricularLoadedShorteningAuditV1,
  type MainWireVentricularLoadedShorteningAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLoadedShorteningAuditV1";
import type {
  MainWireNormalAdultFiveWallAorticOutflowEjectionTimingResearchRunV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_ARM_IDS_V1,
  type MainWireAorticOutflowEjectionTimingArmIdV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowEjectionTimingAblationV1";
import {
  resolveMainWireNormalAdultVentricularGammaWWallMaterialV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_COMPARISON_V1_ID =
  "main-wire-aortic-outflow-ejection-timing-comparison-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_COMPARISON_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat" as const,
    primaryReadout:
      "one-percent-peak-flow-thresholded-aortic-ejection-time" as const,
    accelerationTime:
      "thresholded-flow-onset-to-unsmoothed-peak-sample" as const,
    cvpReadback:
      "cycle-mean-right-atrial-absolute-pressure-proxy-not-clinical-CVP-measurement" as const,
    macroReadbacksAreInitialMonitoringNotAcceptanceTargets: true as const,
    meanAndPeakDopplerGradientsAreReadbacksNotSelectionObjectives: true as const,
    longestEtArmDoesNotEstablishCanonicalAdoption: true as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterSearchOrFitting: false as const,
    exactModelStateOrCheckpointChangedByAnalysis: false as const,
  });

export type MainWireAorticOutflowEjectionTimingArmMetricsV1 = Readonly<{
  armId: MainWireAorticOutflowEjectionTimingArmIdV1;
  causalAxis:
    MainWireNormalAdultFiveWallAorticOutflowEjectionTimingResearchRunV1[
      "arm"
    ]["causalAxis"];
  calciumDecayScaleFromBaseline: number;
  calciumPeakAmplitudeScaleFromBaseline: number;
  calciumExposureScaleFromBaseline: number;
  gammaWScaleFromBaseline: number;
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  isometricAtSourceRestingStretch:
    MainWireVentricularLandIsometricTwitchAuditV1;
  loadedShortening: MainWireVentricularLoadedShorteningAuditV1;
  diastolicFlow:
    MainWireVentricularCalciumSourceTraceFitDiastolicFlowReadbackV1;
  monitoring: Readonly<{
    meanRightAtrialAbsolutePressureMmHg: number;
    meanLeftAtrialAbsolutePressureMmHg: number;
    aorticRootPulsePressureMmHg: number;
    ejectionTimeGapToHealthyReferenceLowerSec: number;
  }>;
}>;

export type MainWireAorticOutflowEjectionTimingArmContrastV1 = Readonly<{
  armId: MainWireAorticOutflowEjectionTimingArmIdV1;
  deltaEjectionTimeMs: number;
  deltaAccelerationTimeMs: number;
  relativeAorticForwardVolumeChange: number;
  relativeMeanAorticPressureChange: number;
  deltaMeanRightAtrialPressureMmHg: number;
  deltaMeanLeftAtrialPressureMmHg: number;
  deltaLeftVentricularEjectionFraction01: number;
  relativePeakAorticFlowChange: number;
  relativeMeanDopplerGradientChange: number;
  relativePeakDopplerGradientChange: number;
}>;

export type MainWireAorticOutflowEjectionTimingComparisonV1 = Readonly<{
  methodId:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_COMPARISON_V1_ID;
  referenceContext:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_REFERENCE_CONTEXT_V1;
  arms: readonly MainWireAorticOutflowEjectionTimingArmMetricsV1[];
  contrastsToCanonical:
    readonly MainWireAorticOutflowEjectionTimingArmContrastV1[];
  summary: Readonly<{
    longestEjectionTimeArmId:
      MainWireAorticOutflowEjectionTimingArmIdV1;
    longestEjectionTimeSec: number;
    longestEjectionTimeWithinHealthyReferenceContext: boolean;
    allArmsIntegratedWithoutFailure: boolean;
    allArmsPeriod1: boolean;
    allArmsSingleAorticFlowPeak: boolean;
    gammaWArmIsometricMaximumAbsoluteTwitchTimingDifferenceSec: number;
  }>;
  claim:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_COMPARISON_CLAIM_V1;
}>;

export function measureMainWireAorticOutflowEjectionTimingArmV1(
  run: MainWireNormalAdultFiveWallAorticOutflowEjectionTimingResearchRunV1,
): MainWireAorticOutflowEjectionTimingArmMetricsV1 {
  const material = resolveMainWireNormalAdultVentricularGammaWWallMaterialV1(
    run.arm.gammaWProfileId,
  );
  const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    run.periodicResult,
    run.calciumDriveParams,
    run.arm.armId,
  );
  const beat = run.periodicResult.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${run.arm.armId} requires a retained complete beat`);
  }
  const samples = beat.samples;
  const referenceLower =
    MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_REFERENCE_CONTEXT_V1
      .leftVentricularEjectionTime.predictionInterval95Sec[0];
  return Object.freeze({
    armId: run.arm.armId,
    causalAxis: run.arm.causalAxis,
    calciumDecayScaleFromBaseline:
      run.calciumProfile.ventricularDecayTimeScaleFromPrior,
    calciumPeakAmplitudeScaleFromBaseline:
      run.calciumProfile.ventricularPeakAmplitudeScaleFromPrior,
    calciumExposureScaleFromBaseline:
      run.calciumProfile
        .ventricularSupradiastolicCalciumCycleExposureScaleFromPrior,
    gammaWScaleFromBaseline: run.gammaWProfile.gammaWScaleFromBaseline,
    cycle,
    isometricAtSourceRestingStretch:
      measureMainWireVentricularLandIsometricTwitchAuditV1(
        run.calciumDriveParams,
        { dtSec: run.periodicResult.dtSec, fixedLandStretch: 1 },
        material,
      ),
    loadedShortening: measureMainWireVentricularLoadedShorteningAuditV1(
      run.periodicResult,
      run.calciumDriveParams,
      {
        wallMaterialParams: material,
        expectedMechanicsProviderParameterIdentityHash:
          run.periodicResult.protocolIdentity.mechanicsProvider
            .parameterIdentityHash,
      },
    ),
    diastolicFlow:
      measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1(
        run.periodicResult,
      ),
    monitoring: Object.freeze({
      meanRightAtrialAbsolutePressureMmHg: mean(samples.map((sample) =>
        sample.circulationNodeAbsolutePressureMmHg.RA)),
      meanLeftAtrialAbsolutePressureMmHg: mean(samples.map((sample) =>
        sample.circulationNodeAbsolutePressureMmHg.LA)),
      aorticRootPulsePressureMmHg:
        cycle.maximumAorticRootPressureMmHg
        - cycle.minimumAorticRootPressureMmHg,
      ejectionTimeGapToHealthyReferenceLowerSec:
        Math.max(0, referenceLower - cycle.aorticEjectionTimeProxySec),
    }),
  });
}

export function compareMainWireAorticOutflowEjectionTimingArmsV1(
  arms: readonly MainWireAorticOutflowEjectionTimingArmMetricsV1[],
): MainWireAorticOutflowEjectionTimingComparisonV1 {
  assertCompleteArmSet(arms);
  const canonical = arms.find((arm) => arm.armId === "canonical")!;
  const contrasts = arms.map((arm) => Object.freeze({
    armId: arm.armId,
    deltaEjectionTimeMs:
      (arm.cycle.aorticEjectionTimeProxySec
        - canonical.cycle.aorticEjectionTimeProxySec) * 1000,
    deltaAccelerationTimeMs:
      (arm.cycle.timeFromAorticFlowOnsetToPeakSec
        - canonical.cycle.timeFromAorticFlowOnsetToPeakSec) * 1000,
    relativeAorticForwardVolumeChange: relativeChange(
      arm.cycle.aorticForwardVolumeMl,
      canonical.cycle.aorticForwardVolumeMl,
    ),
    relativeMeanAorticPressureChange: relativeChange(
      arm.cycle.meanAorticAbsolutePressureMmHg,
      canonical.cycle.meanAorticAbsolutePressureMmHg,
    ),
    deltaMeanRightAtrialPressureMmHg:
      arm.monitoring.meanRightAtrialAbsolutePressureMmHg
      - canonical.monitoring.meanRightAtrialAbsolutePressureMmHg,
    deltaMeanLeftAtrialPressureMmHg:
      arm.monitoring.meanLeftAtrialAbsolutePressureMmHg
      - canonical.monitoring.meanLeftAtrialAbsolutePressureMmHg,
    deltaLeftVentricularEjectionFraction01:
      arm.cycle.leftVentricularEjectionFraction01
      - canonical.cycle.leftVentricularEjectionFraction01,
    relativePeakAorticFlowChange: relativeChange(
      arm.cycle.aorticMaximumFlowMlPerSec,
      canonical.cycle.aorticMaximumFlowMlPerSec,
    ),
    relativeMeanDopplerGradientChange: relativeChange(
      arm.cycle.meanDopplerGradientMmHg,
      canonical.cycle.meanDopplerGradientMmHg,
    ),
    relativePeakDopplerGradientChange: relativeChange(
      arm.cycle.peakDopplerGradientMmHg,
      canonical.cycle.peakDopplerGradientMmHg,
    ),
  }));
  const longest = arms.reduce((best, arm) =>
    arm.cycle.aorticEjectionTimeProxySec
        > best.cycle.aorticEjectionTimeProxySec
      ? arm
      : best,
  );
  const gammaArms = arms.filter((arm) => arm.causalAxis === "land-gamma-w");
  const canonicalTwitch = canonical.isometricAtSourceRestingStretch.activeTwitch;
  const maximumGammaWIsometricTimingDifference = Math.max(
    0,
    ...gammaArms.flatMap((arm) => {
      const twitch = arm.isometricAtSourceRestingStretch.activeTwitch;
      return [
        Math.abs(twitch.timeToPeakSec - canonicalTwitch.timeToPeakSec),
        nullableAbsoluteDifference(
          twitch.relaxationTime50Sec,
          canonicalTwitch.relaxationTime50Sec,
        ),
        nullableAbsoluteDifference(
          twitch.relaxationTime95Sec,
          canonicalTwitch.relaxationTime95Sec,
        ),
      ];
    }),
  );
  const [referenceLower, referenceUpper] =
    MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_REFERENCE_CONTEXT_V1
      .leftVentricularEjectionTime.predictionInterval95Sec;
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_COMPARISON_V1_ID,
    referenceContext:
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_REFERENCE_CONTEXT_V1,
    arms: Object.freeze([...arms]),
    contrastsToCanonical: Object.freeze(contrasts),
    summary: Object.freeze({
      longestEjectionTimeArmId: longest.armId,
      longestEjectionTimeSec: longest.cycle.aorticEjectionTimeProxySec,
      longestEjectionTimeWithinHealthyReferenceContext:
        longest.cycle.aorticEjectionTimeProxySec >= referenceLower
        && longest.cycle.aorticEjectionTimeProxySec <= referenceUpper,
      allArmsIntegratedWithoutFailure: arms.every((arm) =>
        arm.cycle.integrationCompletedWithoutFailure),
      allArmsPeriod1: arms.every((arm) =>
        arm.cycle.periodicSteadyStateClaimed),
      allArmsSingleAorticFlowPeak: arms.every((arm) =>
        arm.cycle.aorticFlowPeakCountAboveFivePercent === 1),
      gammaWArmIsometricMaximumAbsoluteTwitchTimingDifferenceSec:
        maximumGammaWIsometricTimingDifference,
    }),
    claim: MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_COMPARISON_CLAIM_V1,
  });
}

function assertCompleteArmSet(
  arms: readonly MainWireAorticOutflowEjectionTimingArmMetricsV1[],
): void {
  if (arms.length !== MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_ARM_IDS_V1.length) {
    throw new Error("ejection-timing comparison requires the complete arm set");
  }
  const ids = new Set(arms.map((arm) => arm.armId));
  for (const armId of MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_ARM_IDS_V1) {
    if (!ids.has(armId)) {
      throw new Error(`ejection-timing comparison missing arm: ${armId}`);
    }
  }
}

function mean(values: readonly number[]): number {
  if (values.length === 0) throw new Error("mean requires at least one value");
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function relativeChange(value: number, baseline: number): number {
  if (baseline === 0) throw new Error("relative change requires nonzero baseline");
  return value / baseline - 1;
}

function nullableAbsoluteDifference(
  value: number | null,
  baseline: number | null,
): number {
  if (value === null || baseline === null) return Number.POSITIVE_INFINITY;
  return Math.abs(value - baseline);
}
