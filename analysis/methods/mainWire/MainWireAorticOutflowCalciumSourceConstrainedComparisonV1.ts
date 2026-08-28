import {
  MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_REFERENCE_CONTEXT_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_SCREEN_V1,
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  evaluateMainWireVentricularCalciumSourceProtocolV1,
  resolveMainWireVentricularCalciumSourceProtocolV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceProtocolsV1";
import {
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumSourceConstrainedParamsV1,
  resolveMainWireVentricularCalciumSourceConstrainedProfileV1,
  type MainWireVentricularCalciumSourceConstrainedProfileIdV1,
  type MainWireVentricularCalciumSourceConstrainedProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceConstrainedPriorV1";
import type {
  MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1,
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_SOURCE_CONSTRAINED_COMPARISON_V1_ID =
  "main-wire-aortic-outflow-calcium-source-constrained-comparison-v1" as const;

export type MainWireAorticOutflowCalciumSourceConstrainedArmInputV1 =
  Readonly<{
    profileId: MainWireVentricularCalciumSourceConstrainedProfileIdV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  }>;

export type MainWireAorticOutflowCalciumSourceConstrainedArmV1 = Readonly<{
  profileId: MainWireVentricularCalciumSourceConstrainedProfileIdV1;
  profile: MainWireVentricularCalciumSourceConstrainedProfileV1;
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
}>;

export type MainWireAorticOutflowCalciumSourceConstrainedScreenV1 = Readonly<{
  period1AndIntegrationPassed: boolean;
  aorticStrokeVolumePreserved: boolean;
  cardiacOutputPreserved: boolean;
  meanAorticPressurePreserved: boolean;
  leftVentricularEjectionFractionPreserved: boolean;
  rightVentricularEjectionFractionPreserved: boolean;
  peakLeftVentricularPressurePreserved: boolean;
  leftVentricularEndDiastolicVolumePreserved: boolean;
  singleAorticFlowPeakPreserved: boolean;
  peakDopplerGradientLowered: boolean;
  peakAorticFlowLowered: boolean;
  ejectionTimeWithinReferenceContext: boolean;
  allMacroPreservationConditionsPassed: boolean;
  retainedDirectionalCandidate: boolean;
  referenceNormalizedCandidate: boolean;
}>;

export type MainWireAorticOutflowCalciumSourceConstrainedComparisonV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_SOURCE_CONSTRAINED_COMPARISON_V1_ID;
    arms: readonly MainWireAorticOutflowCalciumSourceConstrainedArmV1[];
    nonCalciumProtocolComponentsCommon: boolean;
    sourceApproximation: Readonly<{
      alignment:
        "source-phase-zero-to-analytic-calcium-onset";
      sampleIntervalSec: 0.001;
      sampleCount: 1000;
      rootMeanSquareErrorUM: number;
      normalizedRootMeanSquareErrorBySourceAmplitude: number;
      maximumAbsoluteErrorUM: number;
      sourceSupradiastolicCycleExposureUMSec: number;
      analyticSupradiastolicCycleExposureUMSec: number;
      relativeExposureError: number;
    }>;
    candidateVsCanonical: Readonly<{
      relativeAorticForwardVolumeChange: number;
      relativeAorticMaximumFlowChange: number;
      relativeAorticEjectionTimeChange: number;
      relativeMeanDopplerGradientChange: number;
      relativePeakDopplerGradientChange: number;
      relativeCardiacOutputChange: number;
      relativeMeanAorticPressureChange: number;
      relativePeakLeftVentricularPressureChange: number;
      absoluteLeftVentricularEjectionFractionChange: number;
      absoluteRightVentricularEjectionFractionChange: number;
    }>;
    candidateScreen: MainWireAorticOutflowCalciumSourceConstrainedScreenV1;
    claim: typeof MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_SOURCE_CONSTRAINED_COMPARISON_CLAIM_V1;
  }>;

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_SOURCE_CONSTRAINED_COMPARISON_CLAIM_V1 =
  Object.freeze({
    role: "source-constrained-upstream-driver-identifiability-test" as const,
    exactFrameMutation: false as const,
    commonAorticValveLawAndCirculatoryLoad: true as const,
    commonMechanicalMaterialParams: true as const,
    sourceMetricMatchingUsesHemodynamics: false as const,
    sourceApproximationUsesHemodynamics: false as const,
    sourceApproximationSmoothingApplied: false as const,
    candidateScreenIsClinicalValidation: false as const,
    candidateScreenEstablishesCanonicalAdoption: false as const,
    parameterOptimizationAgainstHemodynamics: false as const,
  });

const NON_CALCIUM_COMPONENT_KEYS = Object.freeze([
  "mechanicsProviderMetadataStableHash",
  "circulationTopologyGraphStableHash",
  "circulationRuntimeStableHash",
  "bloodVolumeOperatingPointStableHash",
  "commonPericardiumStableHash",
  "periodicPolicyStableHash",
] as const satisfies readonly (keyof
  MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1)[]);

export function compareMainWireAorticOutflowCalciumSourceConstrainedV1(
  inputs: readonly MainWireAorticOutflowCalciumSourceConstrainedArmInputV1[],
): MainWireAorticOutflowCalciumSourceConstrainedComparisonV1 {
  const byId = new Map<
    MainWireVentricularCalciumSourceConstrainedProfileIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >();
  for (const input of inputs) {
    if (byId.has(input.profileId)) {
      throw new Error(`duplicate source-constrained calcium arm: ${input.profileId}`);
    }
    byId.set(input.profileId, input.periodicResult);
  }
  for (const profileId of
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PROFILE_IDS_V1) {
    if (!byId.has(profileId)) {
      throw new Error(`missing source-constrained calcium arm: ${profileId}`);
    }
  }
  if (byId.size
    !== MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PROFILE_IDS_V1.length) {
    throw new Error("source-constrained calcium comparison accepts two arms");
  }
  const arms = Object.freeze(
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PROFILE_IDS_V1.map(
      (profileId) => {
        const periodicResult = byId.get(profileId)!;
        return Object.freeze({
          profileId,
          profile:
            resolveMainWireVentricularCalciumSourceConstrainedProfileV1(
              profileId,
            ),
          cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
            periodicResult,
            resolveMainWireVentricularCalciumSourceConstrainedParamsV1(
              profileId,
            ),
            profileId,
          ),
        });
      },
    ),
  );
  const canonical = arms[0]!.cycle;
  const candidate = arms[1]!.cycle;
  const nonCalciumProtocolComponentsCommon = NON_CALCIUM_COMPONENT_KEYS.every(
    (key) => inputs.every((input) =>
      input.periodicResult.protocolComponentHashes[key]
        === inputs[0]!.periodicResult.protocolComponentHashes[key]),
  );
  const candidateVsCanonical = Object.freeze({
    relativeAorticForwardVolumeChange: relativeChange(
      candidate.aorticForwardVolumeMl,
      canonical.aorticForwardVolumeMl,
    ),
    relativeAorticMaximumFlowChange: relativeChange(
      candidate.aorticMaximumFlowMlPerSec,
      canonical.aorticMaximumFlowMlPerSec,
    ),
    relativeAorticEjectionTimeChange: relativeChange(
      candidate.aorticEjectionTimeProxySec,
      canonical.aorticEjectionTimeProxySec,
    ),
    relativeMeanDopplerGradientChange: relativeChange(
      candidate.meanDopplerGradientMmHg,
      canonical.meanDopplerGradientMmHg,
    ),
    relativePeakDopplerGradientChange: relativeChange(
      candidate.peakDopplerGradientMmHg,
      canonical.peakDopplerGradientMmHg,
    ),
    relativeCardiacOutputChange: relativeChange(
      candidate.netAorticCardiacOutputLPerMin,
      canonical.netAorticCardiacOutputLPerMin,
    ),
    relativeMeanAorticPressureChange: relativeChange(
      candidate.meanAorticAbsolutePressureMmHg,
      canonical.meanAorticAbsolutePressureMmHg,
    ),
    relativePeakLeftVentricularPressureChange: relativeChange(
      candidate.peakLeftVentricularPressureMmHg,
      canonical.peakLeftVentricularPressureMmHg,
    ),
    absoluteLeftVentricularEjectionFractionChange:
      candidate.leftVentricularEjectionFraction01
      - canonical.leftVentricularEjectionFraction01,
    absoluteRightVentricularEjectionFractionChange:
      candidate.rightVentricularEjectionFraction01
      - canonical.rightVentricularEjectionFraction01,
  });
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_SOURCE_CONSTRAINED_COMPARISON_V1_ID,
    arms,
    nonCalciumProtocolComponentsCommon,
    sourceApproximation: measureSourceApproximation(),
    candidateVsCanonical,
    candidateScreen: screen(candidate, canonical),
    claim:
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_SOURCE_CONSTRAINED_COMPARISON_CLAIM_V1,
  });
}

function measureSourceApproximation():
  MainWireAorticOutflowCalciumSourceConstrainedComparisonV1[
    "sourceApproximation"
  ] {
  const source = resolveMainWireVentricularCalciumSourceProtocolV1(
    "land2017-figure6-coppini-digitized",
  );
  const analytic =
    resolveMainWireVentricularCalciumSourceConstrainedParamsV1(
      "land2017-figure6-source-constrained-biexponential",
    );
  const sampleIntervalSec = 0.001 as const;
  const sampleCount = 1000 as const;
  let squaredErrorSum = 0;
  let maximumAbsoluteErrorUM = 0;
  let sourceExposure = 0;
  let analyticExposure = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    const sourceTimeSec = index * sampleIntervalSec;
    const sourceCalcium = evaluateMainWireVentricularCalciumSourceProtocolV1(
      sourceTimeSec,
      source.protocolId,
    );
    const analyticCalcium = evaluateFiveWallNormalCalciumDriveV1(
      sourceTimeSec + analytic.ventricular.electricalToCalciumDelaySec,
      analytic,
    ).freeCalciumUMByWall.LVFW;
    const error = analyticCalcium - sourceCalcium;
    squaredErrorSum += error * error;
    maximumAbsoluteErrorUM = Math.max(
      maximumAbsoluteErrorUM,
      Math.abs(error),
    );
    sourceExposure += Math.max(
      0,
      sourceCalcium - source.diastolicCalciumUM,
    ) * sampleIntervalSec;
    analyticExposure += Math.max(
      0,
      analyticCalcium - analytic.ventricular.diastolicCalciumUM,
    ) * sampleIntervalSec;
  }
  const rootMeanSquareErrorUM = Math.sqrt(
    squaredErrorSum / sampleCount,
  );
  const sourceAmplitude =
    resolveMainWireVentricularCalciumSourceConstrainedProfileV1(
      "land2017-figure6-source-constrained-biexponential",
    ).ventricularPeakCalciumUM - source.diastolicCalciumUM;
  return Object.freeze({
    alignment: "source-phase-zero-to-analytic-calcium-onset" as const,
    sampleIntervalSec,
    sampleCount,
    rootMeanSquareErrorUM,
    normalizedRootMeanSquareErrorBySourceAmplitude:
      rootMeanSquareErrorUM / sourceAmplitude,
    maximumAbsoluteErrorUM,
    sourceSupradiastolicCycleExposureUMSec: sourceExposure,
    analyticSupradiastolicCycleExposureUMSec: analyticExposure,
    relativeExposureError: relativeChange(analyticExposure, sourceExposure),
  });
}

function screen(
  candidate: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
  canonical: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
): MainWireAorticOutflowCalciumSourceConstrainedScreenV1 {
  const definition = MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_SCREEN_V1;
  const withinRelative = (
    value: number,
    reference: number,
    tolerance: number,
  ): boolean => Math.abs(relativeChange(value, reference)) <= tolerance;
  const period1AndIntegrationPassed =
    candidate.periodicSteadyStateClaimed
    && candidate.integrationCompletedWithoutFailure;
  const aorticStrokeVolumePreserved = withinRelative(
    candidate.aorticForwardVolumeMl,
    canonical.aorticForwardVolumeMl,
    definition.maximumRelativeAorticStrokeVolumeChange,
  );
  const cardiacOutputPreserved = withinRelative(
    candidate.netAorticCardiacOutputLPerMin,
    canonical.netAorticCardiacOutputLPerMin,
    definition.maximumRelativeCardiacOutputChange,
  );
  const meanAorticPressurePreserved = withinRelative(
    candidate.meanAorticAbsolutePressureMmHg,
    canonical.meanAorticAbsolutePressureMmHg,
    definition.maximumRelativeMeanAorticPressureChange,
  );
  const leftVentricularEjectionFractionPreserved = Math.abs(
    candidate.leftVentricularEjectionFraction01
    - canonical.leftVentricularEjectionFraction01,
  ) <= definition.maximumAbsoluteLeftVentricularEjectionFractionChange;
  const rightVentricularEjectionFractionPreserved = Math.abs(
    candidate.rightVentricularEjectionFraction01
    - canonical.rightVentricularEjectionFraction01,
  ) <= definition.maximumAbsoluteRightVentricularEjectionFractionChange;
  const peakLeftVentricularPressurePreserved = withinRelative(
    candidate.peakLeftVentricularPressureMmHg,
    canonical.peakLeftVentricularPressureMmHg,
    definition.maximumRelativePeakLeftVentricularPressureChange,
  );
  const leftVentricularEndDiastolicVolumePreserved = withinRelative(
    candidate.maximumLeftVentricularVolumeMl,
    canonical.maximumLeftVentricularVolumeMl,
    definition.maximumRelativeLeftVentricularEndDiastolicVolumeChange,
  );
  const singleAorticFlowPeakPreserved =
    candidate.aorticFlowPeakCountAboveFivePercent === 1;
  const peakDopplerGradientLowered =
    candidate.peakDopplerGradientMmHg < canonical.peakDopplerGradientMmHg;
  const peakAorticFlowLowered =
    candidate.aorticMaximumFlowMlPerSec < canonical.aorticMaximumFlowMlPerSec;
  const ejectionTimeRange =
    MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_REFERENCE_CONTEXT_V1
      .leftVentricularEjectionTime.predictionInterval95Sec;
  const ejectionTimeWithinReferenceContext =
    candidate.aorticEjectionTimeProxySec >= ejectionTimeRange[0]
    && candidate.aorticEjectionTimeProxySec <= ejectionTimeRange[1];
  const allMacroPreservationConditionsPassed = [
    period1AndIntegrationPassed,
    aorticStrokeVolumePreserved,
    cardiacOutputPreserved,
    meanAorticPressurePreserved,
    leftVentricularEjectionFractionPreserved,
    rightVentricularEjectionFractionPreserved,
    peakLeftVentricularPressurePreserved,
    leftVentricularEndDiastolicVolumePreserved,
    singleAorticFlowPeakPreserved,
  ].every(Boolean);
  const retainedDirectionalCandidate =
    allMacroPreservationConditionsPassed
    && peakDopplerGradientLowered
    && peakAorticFlowLowered;
  return Object.freeze({
    period1AndIntegrationPassed,
    aorticStrokeVolumePreserved,
    cardiacOutputPreserved,
    meanAorticPressurePreserved,
    leftVentricularEjectionFractionPreserved,
    rightVentricularEjectionFractionPreserved,
    peakLeftVentricularPressurePreserved,
    leftVentricularEndDiastolicVolumePreserved,
    singleAorticFlowPeakPreserved,
    peakDopplerGradientLowered,
    peakAorticFlowLowered,
    ejectionTimeWithinReferenceContext,
    allMacroPreservationConditionsPassed,
    retainedDirectionalCandidate,
    referenceNormalizedCandidate:
      retainedDirectionalCandidate && ejectionTimeWithinReferenceContext,
  });
}

function relativeChange(value: number, reference: number): number {
  if (reference === 0) throw new Error("relative change reference is zero");
  return value / reference - 1;
}
