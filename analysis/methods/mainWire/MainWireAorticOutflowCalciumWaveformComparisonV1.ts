import {
  countMainWireStrictLocalMaximaV1,
  mainWirePeriodicSpectralEnergyFractionV1,
  measureMainWireLocalMaximumProminencesV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveAblationComparisonV1";
import {
  measureMainWireAorticPressureFlowCouplingV1,
  type MainWireAorticPressureFlowCouplingV1,
} from "@/analysis/methods/mainWire/MainWireAorticPressureFlowCouplingV1";
import {
  measurePeriodicBiexponentialCalciumPulseShapeV1,
  measurePeriodicBiexponentialDelayedMixtureShapeV1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumWaveformParamsV1,
  resolveMainWireVentricularCalciumWaveformProfileV1,
  type MainWireVentricularCalciumWaveformProfileIdV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumWaveformAblationV1";
import {
  measureMainWireValveDiseaseCycleMetricsV1,
} from "@/engine/myocardium/diagnostics/MainWireValveDiseaseCycleMetricsV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_COMPARISON_V1_ID =
  "main-wire-aortic-outflow-calcium-waveform-comparison-v1" as const;

export const MAIN_WIRE_AORTIC_FLOW_DISTINCT_PEAK_MINIMUM_PROMINENCE_FRACTION_V1 =
  0.01 as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_REFERENCE_CONTEXT_V1 =
  Object.freeze({
    leftVentricularEjectionTime: Object.freeze({
      measurementContext: "healthy-adult-TDI-M-mode-AVO-to-AVC" as const,
      meanSec: 0.292,
      standardDeviationSec: 0.023,
      predictionInterval95Sec: Object.freeze([0.248, 0.336] as const),
      sampleCount: 1_969,
      doi: "10.1007/s00392-023-02269-2" as const,
    }),
    ascendingAorticPeakVelocity: Object.freeze({
      measurementContext:
        "healthy-young-adult-ascending-aorta-MRI-and-echocardiography" as const,
      meanMPerSec: 1.2,
      standardDeviationMPerSec: 0.2,
      sampleCount: 8,
      doi: "10.3978/j.issn.2223-4292.2015.08.08" as const,
      usedAsAcceptanceThreshold: false as const,
      reason:
        "ascending-aorta-and-vena-contracta-pressure-stations-are-not-interchangeable" as const,
    }),
    healthyAorticWaveIntensity: Object.freeze({
      measurementContext:
        "healthy-adult-central-pressure-plus-ascending-aortic-CMR-velocity" as const,
      sampleCount: 206,
      doi: "10.1093/ehjci/jez227" as const,
      earlySystolicInterpretation:
        "forward-compression-wave-associated-with-myocardial-contractility" as const,
      lateSystolicInterpretation:
        "forward-decompression-wave-associated-with-LV-relaxation-time-constant" as const,
      usedAsAcceptanceThreshold: false as const,
    }),
  });

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_SCREEN_V1 =
  Object.freeze({
    role: "candidate-retention-screen-not-clinical-validation" as const,
    maximumRelativeAorticStrokeVolumeChange: 0.05,
    maximumRelativeCardiacOutputChange: 0.05,
    maximumRelativeMeanAorticPressureChange: 0.05,
    maximumAbsoluteLeftVentricularEjectionFractionChange: 0.03,
    maximumAbsoluteRightVentricularEjectionFractionChange: 0.03,
    maximumRelativePeakLeftVentricularPressureChange: 0.05,
    maximumRelativeLeftVentricularEndDiastolicVolumeChange: 0.05,
    requiresSingleAorticFlowPeak: true as const,
    requiresLowerPeakDopplerGradient: true as const,
    requiresLowerPeakAorticFlow: true as const,
    requiresEjectionTimeWithinReferenceContext: true as const,
    parameterOptimizationOrFitting: false as const,
  });

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_COMPARISON_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat" as const,
    exactFrameMutation: false as const,
    aorticEjectionTimeProxy:
      "one-percent-peak-flow-thresholded-forward-episode-duration" as const,
    velocityStation:
      "EOA-derived-vena-contracta-not-ascending-aorta" as const,
    forwardFlowContinuityEquivalentEoa:
      "forward-volume-divided-by-integrated-modeled-vena-contracta-velocity-not-imaged-anatomic-area" as const,
    meanGradientEquivalentEoa:
      "mean-forward-flow-divided-by-rms-modeled-vena-contracta-velocity-includes-area-and-waveform-penalties" as const,
    calciumExposure:
      "sampled-cycle-integral-above-configured-diastolic-calcium" as const,
    activeStressImpulse:
      "accepted-step-positive-Land-active-stress-cycle-integral" as const,
    activeStressRelaxationTiming:
      "first-accepted-endpoint-at-or-below-post-peak-fraction-no-interpolation" as const,
    leftVentricularPerformanceTiming:
      "shared-one-percent-flow-threshold-direct-MVC-AVO-AVC-MVO-event-analogue" as const,
    leftVentricularTeiIndexIsClinicalMeasurement: false as const,
    leftVentricularPressureRate:
      "unsmoothed-accepted-step-backward-difference-of-absolute-cavity-pressure" as const,
    aorticRootStorageFlow:
      "accepted-AoV-flow-minus-graph-owned-Ao-SA-flow" as const,
    pressureFlowCoupling:
      "Ao-pressure-and-Ao-SA-flow-backward-difference-product-not-clinical-WIA" as const,
    flowPeakCounting: "strict-unsmoothed-local-maxima" as const,
    distinctFlowPeakCounting:
      "unsmoothed-local-maximum-plateaus-above-five-percent-with-one-percent-global-maximum-prominence" as const,
    spectralBandHz: Object.freeze([10, 50] as const),
    factorialContrast:
      "one-sided-two-by-two-difference-of-differences" as const,
    screenIsClinicalValidation: false as const,
    screenEstablishesCanonicalAdoption: false as const,
    pressureStationDifferencePreserved: true as const,
    smoothingApplied: false as const,
    parameterSearchOrFitting: false as const,
  });

type WallId = "LVFW" | "SEP" | "RVFW";

export type MainWireAorticOutflowCalciumWaveformArmInputV1 = Readonly<{
  profileId: MainWireVentricularCalciumWaveformProfileIdV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
}>;

export type MainWireAorticOutflowCalciumWaveformArmMetricsV1 = Readonly<{
  profileId: MainWireVentricularCalciumWaveformProfileIdV1;
  protocolIdentityHash: string;
  calciumDriveStableHash: string;
  riseTimeFactor: "baseline" | "high";
  decayTimeFactor: "baseline" | "high";
  ventricularRiseTimeScaleFromPrior: number;
  ventricularPeakAmplitudeScaleFromPrior: number;
  ventricularDecayTimeScaleFromPrior: number;
  configuredCalciumPulseTimeToPeakSec: number;
  configuredCalciumPulsePeakPhase01: number;
  configuredSupradiastolicCalciumCycleExposureUMSec: number;
  sampledSupradiastolicCalciumCycleExposureUMSec: number;
  terminationReason:
    MainWireNormalAdultFiveWallPeriodicResultV1["terminationReason"];
  periodicSteadyStateClaimed: boolean;
  integrationCompletedWithoutFailure: boolean;
  completedBeatCount: number;
  dtSec: number;
  sampleCount: number;
  aorticForwardVolumeMl: number;
  aorticMaximumFlowMlPerSec: number;
  aorticStrictlyPositiveFlowTimeSec: number;
  aorticEjectionTimeProxySec: number;
  aorticFlowOnsetPhase01: number;
  aorticFlowPeakPhase01: number;
  aorticFlowLastThresholdActivePhase01: number;
  timeFromAorticFlowOnsetToPeakSec: number;
  signedTimeFromConfiguredCalciumPeakToAorticFlowOnsetSec: number;
  aorticPeakToMeanForwardFlowRatio: number;
  aorticConfiguredMaximumForwardEoaCm2: number;
  aorticForwardFlowContinuityEquivalentEoaCm2: number;
  aorticMeanGradientEquivalentEoaCm2: number;
  aorticFullyOpenUniformFlowDopplerGradientLowerBoundMmHg: number;
  aorticDynamicAreaDopplerPenaltyFactor: number;
  aorticJetVelocityWaveformNonuniformityFactor: number;
  aorticMeanDopplerExcessOverFullyOpenUniformFlowFactor: number;
  aorticFlowPeakCountAboveFivePercent: number;
  aorticFlowDistinctPeakCountAboveFivePercent: number;
  maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum: number;
  aorticFlowAcEnergyFraction10To50Hz: number;
  meanDopplerGradientMmHg: number;
  peakDopplerGradientMmHg: number;
  peakVenaContractaVelocityMPerSec: number;
  meanNodeGradientMmHg: number;
  peakNodeGradientMmHg: number;
  minimumAorticRootPressureMmHg: number;
  maximumAorticRootPressureMmHg: number;
  minimumSystemicArterialPressureMmHg: number;
  maximumSystemicArterialPressureMmHg: number;
  peakAorticRootToSystemicArterialGradientMmHg: number;
  rmsAorticRootStorageFlowMlPerSec: number;
  aorticPressureFlowCoupling: MainWireAorticPressureFlowCouplingV1;
  peakLeftVentricularPressureMmHg: number;
  peakLeftVentricularPressurePhase01: number;
  leftVentricularIsovolumicContractionTimeSec: number | null;
  leftVentricularValveEventEjectionTimeSec: number | null;
  leftVentricularIsovolumicRelaxationTimeSec: number | null;
  leftVentricularTeiIndex: number | null;
  maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec: number;
  minimumNegativeLeftVentricularPressureFallRateMmHgPerSec: number;
  maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec: number;
  leftVentricularEjectionFraction01: number;
  rightVentricularEjectionFraction01: number;
  netAorticCardiacOutputLPerMin: number;
  cardiacIndexLPerMinPerM2: number;
  meanAorticAbsolutePressureMmHg: number;
  minimumLeftVentricularVolumeMl: number;
  maximumLeftVentricularVolumeMl: number;
  peakActiveStressPaByWall: Readonly<Record<WallId, number>>;
  peakActiveStressPhase01ByWall: Readonly<Record<WallId, number>>;
  timeFromVentricularCalciumOnsetToPeakActiveStressSecByWall:
    Readonly<Record<WallId, number>>;
  postPeakActiveStressRelaxationTimeToHalfPeakSecByWall:
    Readonly<Record<WallId, number | null>>;
  postPeakActiveStressRelaxationTimeToTenPercentPeakSecByWall:
    Readonly<Record<WallId, number | null>>;
  positiveActiveStressCycleIntegralPaSecByWall:
    Readonly<Record<WallId, number>>;
  activeStressDurationAboveHalfPeakSecByWall:
    Readonly<Record<WallId, number>>;
  candidateScreen: null | Readonly<{
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
    allRetentionConditionsPassed: boolean;
    allDirectionalImprovementConditionsPassed: boolean;
    retainedDirectionalCandidate: boolean;
    ejectionTimeWithinReferenceContext: boolean;
    referenceNormalizedCandidate: boolean;
  }>;
}>;

export type MainWireAorticOutflowCalciumWaveformCycleMetricsV1 = Omit<
  MainWireAorticOutflowCalciumWaveformArmMetricsV1,
  | "profileId"
  | "riseTimeFactor"
  | "decayTimeFactor"
  | "ventricularRiseTimeScaleFromPrior"
  | "ventricularPeakAmplitudeScaleFromPrior"
  | "ventricularDecayTimeScaleFromPrior"
  | "candidateScreen"
>;

export type MainWireAorticOutflowCalciumCandidateScreenResultV1 =
  NonNullable<
    MainWireAorticOutflowCalciumWaveformArmMetricsV1["candidateScreen"]
  >;

export type MainWireAorticOutflowCalciumWaveformFactorialMetricIdV1 =
  | "aortic-maximum-flow"
  | "aortic-ejection-time-proxy"
  | "mean-doppler-gradient"
  | "peak-doppler-gradient"
  | "aortic-forward-volume"
  | "left-ventricular-ejection-fraction"
  | "right-ventricular-ejection-fraction"
  | "cardiac-output"
  | "mean-aortic-pressure"
  | "peak-left-ventricular-pressure"
  | "lvfw-active-stress-integral"
  | "aortic-flow-ac-energy-fraction-10-to-50-hz";

export type MainWireAorticOutflowCalciumWaveformFactorialContrastV1 =
  Readonly<{
    metricId: MainWireAorticOutflowCalciumWaveformFactorialMetricIdV1;
    canonicalValue: number;
    riseMainEffectAtBaselineDecay: number;
    decayMainEffectAtBaselineRise: number;
    interactionDifferenceOfDifferences: number;
    riseEffectAtHighDecay: number;
    decayEffectAtHighRise: number;
  }>;

export type MainWireAorticOutflowCalciumWaveformComparisonV1 = Readonly<{
  methodId:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_COMPARISON_V1_ID;
  referenceContext:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_REFERENCE_CONTEXT_V1;
  candidateScreenDefinition:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_SCREEN_V1;
  arms: readonly MainWireAorticOutflowCalciumWaveformArmMetricsV1[];
  factorialContrasts:
    readonly MainWireAorticOutflowCalciumWaveformFactorialContrastV1[];
  claim:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_COMPARISON_CLAIM_V1;
}>;

export function compareMainWireAorticOutflowCalciumWaveformV1(
  inputs: readonly MainWireAorticOutflowCalciumWaveformArmInputV1[],
): MainWireAorticOutflowCalciumWaveformComparisonV1 {
  const byId = new Map<
    MainWireVentricularCalciumWaveformProfileIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >();
  for (const input of inputs) {
    if (byId.has(input.profileId)) {
      throw new Error(`duplicate ventricular calcium arm: ${input.profileId}`);
    }
    byId.set(input.profileId, input.periodicResult);
  }
  for (const profileId of MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1) {
    if (!byId.has(profileId)) {
      throw new Error(`missing ventricular calcium arm: ${profileId}`);
    }
  }
  if (byId.size !== MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1.length) {
    throw new Error("ventricular calcium comparison accepts exactly four arms");
  }
  const rawArms = MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1.map(
    (profileId) => measureArm(profileId, byId.get(profileId)!),
  );
  const rawCanonical = rawArms[0]!;
  const arms = Object.freeze(rawArms.map((arm) => Object.freeze({
    ...arm,
    candidateScreen: arm.profileId === "canonical"
      ? null
      : screenMainWireAorticOutflowCalciumCandidateV1(arm, rawCanonical),
  })));
  const canonical = arms[0]!;
  const rise = arms[1]!;
  const decay = arms[2]!;
  const combined = arms[3]!;
  const contrast = (
    metricId: MainWireAorticOutflowCalciumWaveformFactorialMetricIdV1,
    read: (arm: MainWireAorticOutflowCalciumWaveformArmMetricsV1) => number,
  ): MainWireAorticOutflowCalciumWaveformFactorialContrastV1 => {
    const base = read(canonical);
    const riseValue = read(rise);
    const decayValue = read(decay);
    const combinedValue = read(combined);
    return Object.freeze({
      metricId,
      canonicalValue: base,
      riseMainEffectAtBaselineDecay: riseValue - base,
      decayMainEffectAtBaselineRise: decayValue - base,
      interactionDifferenceOfDifferences:
        combinedValue - riseValue - decayValue + base,
      riseEffectAtHighDecay: combinedValue - decayValue,
      decayEffectAtHighRise: combinedValue - riseValue,
    });
  };
  const factorialContrasts = Object.freeze([
    contrast("aortic-maximum-flow", (arm) => arm.aorticMaximumFlowMlPerSec),
    contrast("aortic-ejection-time-proxy", (arm) =>
      arm.aorticEjectionTimeProxySec),
    contrast("mean-doppler-gradient", (arm) => arm.meanDopplerGradientMmHg),
    contrast("peak-doppler-gradient", (arm) => arm.peakDopplerGradientMmHg),
    contrast("aortic-forward-volume", (arm) => arm.aorticForwardVolumeMl),
    contrast("left-ventricular-ejection-fraction", (arm) =>
      arm.leftVentricularEjectionFraction01),
    contrast("right-ventricular-ejection-fraction", (arm) =>
      arm.rightVentricularEjectionFraction01),
    contrast("cardiac-output", (arm) => arm.netAorticCardiacOutputLPerMin),
    contrast("mean-aortic-pressure", (arm) =>
      arm.meanAorticAbsolutePressureMmHg),
    contrast("peak-left-ventricular-pressure", (arm) =>
      arm.peakLeftVentricularPressureMmHg),
    contrast("lvfw-active-stress-integral", (arm) =>
      arm.positiveActiveStressCycleIntegralPaSecByWall.LVFW),
    contrast("aortic-flow-ac-energy-fraction-10-to-50-hz", (arm) =>
      arm.aorticFlowAcEnergyFraction10To50Hz),
  ]);
  return Object.freeze({
    methodId: MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_COMPARISON_V1_ID,
    referenceContext:
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_REFERENCE_CONTEXT_V1,
    candidateScreenDefinition:
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_SCREEN_V1,
    arms,
    factorialContrasts,
    claim: MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_COMPARISON_CLAIM_V1,
  });
}

function measureArm(
  profileId: MainWireVentricularCalciumWaveformProfileIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): Omit<MainWireAorticOutflowCalciumWaveformArmMetricsV1, "candidateScreen"> {
  const profile = resolveMainWireVentricularCalciumWaveformProfileV1(profileId);
  const calciumParams =
    resolveMainWireVentricularCalciumWaveformParamsV1(profileId);
  const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    result,
    calciumParams,
    profileId,
  );
  return Object.freeze({
    profileId,
    riseTimeFactor: profile.riseTimeFactor,
    decayTimeFactor: profile.decayTimeFactor,
    ventricularRiseTimeScaleFromPrior:
      profile.ventricularRiseTimeScaleFromPrior,
    ventricularPeakAmplitudeScaleFromPrior:
      profile.ventricularPeakAmplitudeScaleFromPrior,
    ventricularDecayTimeScaleFromPrior:
      profile.ventricularDecayTimeScaleFromPrior,
    ...cycle,
  });
}

export function measureMainWireAorticOutflowCalciumWaveformCycleV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  calciumParams: FiveWallNormalCalciumDriveParamsV1,
  sourceLabel = "calcium waveform run",
): MainWireAorticOutflowCalciumWaveformCycleMetricsV1 {
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${sourceLabel} requires a retained complete beat`);
  }
  if (
    result.protocolIdentity.calciumDrive.parameterSetId
      !== calciumParams.parameterSetId
  ) {
    throw new Error(`${sourceLabel} calcium protocol identity mismatch`);
  }
  const pulseShape = configuredVentricularPulseShape(calciumParams);
  const valveMetrics = measureMainWireValveDiseaseCycleMetricsV1(result)
    .valves.AoV;
  const summary = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(result);
  const aorticPressureFlowCoupling =
    measureMainWireAorticPressureFlowCouplingV1(result);
  const samples = beat.samples;
  const flows = samples.map((sample) =>
    Math.max(0, sample.circulationEdgeFlowMlPerSec.AoV));
  const maximumFlow = maximum(flows);
  const maximumFlowIndex = indexOfMaximum(flows);
  const episodeThreshold = valveMetrics.episodeFlowThresholdMlPerSec;
  const thresholdActive = flows.map((flow) => flow >= episodeThreshold);
  const onsetIndex = thresholdActive.findIndex((active, index) =>
    active && !thresholdActive[
      (index - 1 + thresholdActive.length) % thresholdActive.length
    ]);
  if (onsetIndex < 0 || valveMetrics.forwardEpisodeCount !== 1) {
    throw new Error(
      `${sourceLabel} requires one thresholded aortic flow episode`,
    );
  }
  const activeSampleCount = thresholdActive.filter(Boolean).length;
  const lastThresholdActiveIndex =
    (onsetIndex + activeSampleCount - 1) % thresholdActive.length;
  const lvPressures = samples.map((sample) =>
    sample.circulationNodeAbsolutePressureMmHg.LV);
  const peakLvPressureIndex = indexOfMaximum(lvPressures);
  const aorticRootPressures = samples.map((sample) =>
    sample.circulationNodeAbsolutePressureMmHg.Ao);
  const systemicArterialPressures = samples.map((sample) =>
    sample.circulationNodeAbsolutePressureMmHg.SA);
  const aorticRootToSystemicArterialGradients = samples.map((sample) =>
    sample.circulationNodeAbsolutePressureMmHg.Ao
    - sample.circulationNodeAbsolutePressureMmHg.SA);
  const aorticRootStorageFlows = samples.map((sample) =>
    sample.circulationEdgeFlowMlPerSec.AoV
    - sample.circulationEdgeFlowMlPerSec.Ao_SA);
  const previousLvPressure = result.retainedCompleteBeats.at(-2)?.samples.at(-1)
    ?.circulationNodeAbsolutePressureMmHg.LV ?? lvPressures.at(-1)!;
  const lvPressureDerivatives = backwardDifferences(
    lvPressures,
    result.dtSec,
    previousLvPressure,
  );
  const leftVentricularPerformance =
    summary.cyclePhysiology?.leftVentricularPerformance ?? null;
  const aorticFlowPeaks = measureMainWireLocalMaximumProminencesV1(
    flows,
    0.05 * maximumFlow,
  );
  const primaryFlowPeakArrayIndex = aorticFlowPeaks.length === 0
    ? -1
    : indexOfMaximum(aorticFlowPeaks.map((peak) => peak.value));
  const secondaryFlowPeaks = aorticFlowPeaks.filter((_, index) =>
    index !== primaryFlowPeakArrayIndex);
  const sampledCalciumExposure = samples.reduce((sum, sample) =>
    sum + Math.max(
      0,
      sample.freeCalciumUM.LVFW
        - calciumParams.ventricular.diastolicCalciumUM,
    ) * result.dtSec, 0);
  const configuredCalciumExposure =
    calciumParams.ventricular.peakAmplitudeUM
    * pulseShape.normalizedPulseCycleIntegralSec;
  const peakActiveStressPaByWall = wallRecord((wallId) => maximum(
    samples.map((sample) => sample.wallStressPa[wallId].active),
  ));
  const peakActiveStressPhase01ByWall = wallRecord((wallId) => {
    const index = indexOfMaximum(samples.map((sample) =>
      sample.wallStressPa[wallId].active));
    return samples[index]!.cyclePhase01;
  });
  const timeFromVentricularCalciumOnsetToPeakActiveStressSecByWall =
    wallRecord((wallId) => positiveModulo01(
      peakActiveStressPhase01ByWall[wallId]
      - calciumParams.ventricular.electricalToCalciumDelaySec
        / calciumParams.cycleLengthSec,
    ) * calciumParams.cycleLengthSec);
  const postPeakActiveStressRelaxationTimeToHalfPeakSecByWall =
    nullableWallRecord((wallId) => {
      const activeStress = samples.map((sample) =>
        sample.wallStressPa[wallId].active);
      return cyclicPostPeakTimeToFraction(
        activeStress,
        indexOfMaximum(activeStress),
        0.5,
        result.dtSec,
      );
    });
  const postPeakActiveStressRelaxationTimeToTenPercentPeakSecByWall =
    nullableWallRecord((wallId) => {
      const activeStress = samples.map((sample) =>
        sample.wallStressPa[wallId].active);
      return cyclicPostPeakTimeToFraction(
        activeStress,
        indexOfMaximum(activeStress),
        0.1,
        result.dtSec,
      );
    });
  const positiveActiveStressCycleIntegralPaSecByWall = wallRecord((wallId) =>
    samples.reduce((sum, sample) =>
      sum + Math.max(0, sample.wallStressPa[wallId].active) * result.dtSec, 0));
  const activeStressDurationAboveHalfPeakSecByWall = wallRecord((wallId) => {
    const threshold = 0.5 * peakActiveStressPaByWall[wallId];
    return samples.filter((sample) =>
      sample.wallStressPa[wallId].active >= threshold).length * result.dtSec;
  });
  const forwardDuration = valveMetrics.forwardEpisodeDurationSec;
  const meanForwardFlow =
    valveMetrics.forwardVolumeMl / valveMetrics.forwardFlowTimeSec;
  const forwardFlowContinuityEquivalentEoaCm2 =
    valveMetrics.forwardFlowTimeMeanJetVelocityMPerSec > 0
      ? meanForwardFlow
        / (100 * valveMetrics.forwardFlowTimeMeanJetVelocityMPerSec)
      : 0;
  const meanGradientEquivalentEoaCm2 =
    valveMetrics.forwardFlowRmsJetVelocityMPerSec > 0
      ? meanForwardFlow
        / (100 * valveMetrics.forwardFlowRmsJetVelocityMPerSec)
      : 0;
  const configuredCalciumPulsePeakPhase01 = positiveModulo01(
    (
      calciumParams.ventricular.electricalToCalciumDelaySec
      + pulseShape.timeToPeakSec
    ) / calciumParams.cycleLengthSec,
  );
  return Object.freeze({
    protocolIdentityHash: result.protocolIdentityHash,
    calciumDriveStableHash:
      result.protocolComponentHashes.calciumDriveFixedParamsStableHash,
    configuredCalciumPulseTimeToPeakSec: pulseShape.timeToPeakSec,
    configuredCalciumPulsePeakPhase01,
    configuredSupradiastolicCalciumCycleExposureUMSec:
      configuredCalciumExposure,
    sampledSupradiastolicCalciumCycleExposureUMSec: sampledCalciumExposure,
    terminationReason: result.terminationReason,
    periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
    integrationCompletedWithoutFailure: result.integrationCompletedWithoutFailure,
    completedBeatCount: result.completedBeatCount,
    dtSec: result.dtSec,
    sampleCount: samples.length,
    aorticForwardVolumeMl: valveMetrics.forwardVolumeMl,
    aorticMaximumFlowMlPerSec: maximumFlow,
    aorticStrictlyPositiveFlowTimeSec: valveMetrics.forwardFlowTimeSec,
    aorticEjectionTimeProxySec: forwardDuration,
    aorticFlowOnsetPhase01: samples[onsetIndex]!.cyclePhase01,
    aorticFlowPeakPhase01: samples[maximumFlowIndex]!.cyclePhase01,
    aorticFlowLastThresholdActivePhase01:
      samples[lastThresholdActiveIndex]!.cyclePhase01,
    timeFromAorticFlowOnsetToPeakSec:
      cyclicForwardIndexDistance(onsetIndex, maximumFlowIndex, flows.length)
      * result.dtSec,
    signedTimeFromConfiguredCalciumPeakToAorticFlowOnsetSec:
      signedShortestPhaseDifference01(
        samples[onsetIndex]!.cyclePhase01
        - configuredCalciumPulsePeakPhase01,
      ) * calciumParams.cycleLengthSec,
    aorticPeakToMeanForwardFlowRatio: maximumFlow / meanForwardFlow,
    aorticConfiguredMaximumForwardEoaCm2:
      valveMetrics.configuredMaximumForwardEoaCm2,
    aorticForwardFlowContinuityEquivalentEoaCm2:
      forwardFlowContinuityEquivalentEoaCm2,
    aorticMeanGradientEquivalentEoaCm2:
      meanGradientEquivalentEoaCm2,
    aorticFullyOpenUniformFlowDopplerGradientLowerBoundMmHg:
      valveMetrics.fullyOpenUniformFlowDopplerGradientLowerBoundMmHg,
    aorticDynamicAreaDopplerPenaltyFactor:
      valveMetrics.dynamicAreaDopplerPenaltyFactor,
    aorticJetVelocityWaveformNonuniformityFactor:
      valveMetrics.jetVelocityWaveformNonuniformityFactor,
    aorticMeanDopplerExcessOverFullyOpenUniformFlowFactor:
      valveMetrics.meanDopplerExcessOverFullyOpenUniformFlowFactor,
    aorticFlowPeakCountAboveFivePercent:
      countMainWireStrictLocalMaximaV1(flows, 0.05 * maximumFlow),
    aorticFlowDistinctPeakCountAboveFivePercent:
      aorticFlowPeaks.filter((peak) =>
        peak.prominenceFractionOfGlobalMaximum
          >= MAIN_WIRE_AORTIC_FLOW_DISTINCT_PEAK_MINIMUM_PROMINENCE_FRACTION_V1)
        .length,
    maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum:
      secondaryFlowPeaks.length === 0
        ? 0
        : maximum(secondaryFlowPeaks.map((peak) =>
          peak.prominenceFractionOfGlobalMaximum)),
    aorticFlowAcEnergyFraction10To50Hz:
      mainWirePeriodicSpectralEnergyFractionV1(
        flows,
        result.dtSec,
        10,
        50,
      ),
    meanDopplerGradientMmHg:
      valveMetrics.forwardFlowTimeMeanSimplifiedDopplerGradientMmHg,
    peakDopplerGradientMmHg:
      valveMetrics.peakSimplifiedDopplerGradientMmHg,
    peakVenaContractaVelocityMPerSec:
      valveMetrics.peakForwardJetVelocityMPerSec,
    meanNodeGradientMmHg: valveMetrics.forwardFlowTimeMeanGradientMmHg,
    peakNodeGradientMmHg: valveMetrics.peakForwardGradientMmHg,
    minimumAorticRootPressureMmHg: minimum(aorticRootPressures),
    maximumAorticRootPressureMmHg: maximum(aorticRootPressures),
    minimumSystemicArterialPressureMmHg:
      minimum(systemicArterialPressures),
    maximumSystemicArterialPressureMmHg:
      maximum(systemicArterialPressures),
    peakAorticRootToSystemicArterialGradientMmHg:
      maximum(aorticRootToSystemicArterialGradients),
    rmsAorticRootStorageFlowMlPerSec: rootMeanSquare(aorticRootStorageFlows),
    aorticPressureFlowCoupling,
    peakLeftVentricularPressureMmHg: maximum(lvPressures),
    peakLeftVentricularPressurePhase01:
      samples[peakLvPressureIndex]!.cyclePhase01,
    leftVentricularIsovolumicContractionTimeSec:
      leftVentricularPerformance?.isovolumicContractionTimeSec ?? null,
    leftVentricularValveEventEjectionTimeSec:
      leftVentricularPerformance?.ejectionTimeSec ?? null,
    leftVentricularIsovolumicRelaxationTimeSec:
      leftVentricularPerformance?.isovolumicRelaxationTimeSec ?? null,
    leftVentricularTeiIndex:
      leftVentricularPerformance?.teiIndex ?? null,
    maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec:
      Math.max(0, maximum(lvPressureDerivatives)),
    minimumNegativeLeftVentricularPressureFallRateMmHgPerSec:
      Math.min(0, minimum(lvPressureDerivatives)),
    maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec:
      -Math.min(0, minimum(lvPressureDerivatives)),
    leftVentricularEjectionFraction01:
      summary.hemodynamics.leftVentricularEjectionFraction01,
    rightVentricularEjectionFraction01:
      summary.hemodynamics.rightVentricularEjectionFraction01,
    netAorticCardiacOutputLPerMin:
      summary.hemodynamics.netAorticCardiacOutputLPerMin,
    cardiacIndexLPerMinPerM2:
      summary.hemodynamics.cardiacIndexLPerMinPerM2,
    meanAorticAbsolutePressureMmHg:
      summary.hemodynamics.meanAorticAbsolutePressureMmHg,
    minimumLeftVentricularVolumeMl:
      summary.ranges.chamberVolumeMl.LV.minimum,
    maximumLeftVentricularVolumeMl:
      summary.ranges.chamberVolumeMl.LV.maximum,
    peakActiveStressPaByWall,
    peakActiveStressPhase01ByWall,
    timeFromVentricularCalciumOnsetToPeakActiveStressSecByWall,
    postPeakActiveStressRelaxationTimeToHalfPeakSecByWall,
    postPeakActiveStressRelaxationTimeToTenPercentPeakSecByWall,
    positiveActiveStressCycleIntegralPaSecByWall,
    activeStressDurationAboveHalfPeakSecByWall,
  });
}

export function screenMainWireAorticOutflowCalciumCandidateV1(
  candidate: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
  canonical: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
): MainWireAorticOutflowCalciumCandidateScreenResultV1 {
  const definition = MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_SCREEN_V1;
  const period1AndIntegrationPassed =
    candidate.periodicSteadyStateClaimed
    && candidate.integrationCompletedWithoutFailure;
  const aorticStrokeVolumePreserved = relativeChange(
    candidate.aorticForwardVolumeMl,
    canonical.aorticForwardVolumeMl,
  ) <= definition.maximumRelativeAorticStrokeVolumeChange;
  const cardiacOutputPreserved = relativeChange(
    candidate.netAorticCardiacOutputLPerMin,
    canonical.netAorticCardiacOutputLPerMin,
  ) <= definition.maximumRelativeCardiacOutputChange;
  const meanAorticPressurePreserved = relativeChange(
    candidate.meanAorticAbsolutePressureMmHg,
    canonical.meanAorticAbsolutePressureMmHg,
  ) <= definition.maximumRelativeMeanAorticPressureChange;
  const leftVentricularEjectionFractionPreserved = Math.abs(
    candidate.leftVentricularEjectionFraction01
      - canonical.leftVentricularEjectionFraction01,
  ) <= definition.maximumAbsoluteLeftVentricularEjectionFractionChange;
  const rightVentricularEjectionFractionPreserved = Math.abs(
    candidate.rightVentricularEjectionFraction01
      - canonical.rightVentricularEjectionFraction01,
  ) <= definition.maximumAbsoluteRightVentricularEjectionFractionChange;
  const peakLeftVentricularPressurePreserved = relativeChange(
    candidate.peakLeftVentricularPressureMmHg,
    canonical.peakLeftVentricularPressureMmHg,
  ) <= definition.maximumRelativePeakLeftVentricularPressureChange;
  const leftVentricularEndDiastolicVolumePreserved = relativeChange(
    candidate.maximumLeftVentricularVolumeMl,
    canonical.maximumLeftVentricularVolumeMl,
  ) <= definition.maximumRelativeLeftVentricularEndDiastolicVolumeChange;
  const singleAorticFlowPeakPreserved =
    candidate.aorticFlowPeakCountAboveFivePercent === 1;
  const peakDopplerGradientLowered =
    candidate.peakDopplerGradientMmHg < canonical.peakDopplerGradientMmHg;
  const peakAorticFlowLowered =
    candidate.aorticMaximumFlowMlPerSec < canonical.aorticMaximumFlowMlPerSec;
  const [minimumEjectionTime, maximumEjectionTime] =
    MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_REFERENCE_CONTEXT_V1
      .leftVentricularEjectionTime.predictionInterval95Sec;
  const ejectionTimeWithinReferenceContext =
    candidate.aorticEjectionTimeProxySec >= minimumEjectionTime
    && candidate.aorticEjectionTimeProxySec <= maximumEjectionTime;
  const allRetentionConditionsPassed = [
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
  const allDirectionalImprovementConditionsPassed = [
    peakDopplerGradientLowered,
    peakAorticFlowLowered,
  ].every(Boolean);
  const retainedDirectionalCandidate =
    allRetentionConditionsPassed
    && allDirectionalImprovementConditionsPassed;
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
    allRetentionConditionsPassed,
    allDirectionalImprovementConditionsPassed,
    retainedDirectionalCandidate,
    ejectionTimeWithinReferenceContext,
    referenceNormalizedCandidate:
      retainedDirectionalCandidate && ejectionTimeWithinReferenceContext,
  });
}

function configuredVentricularPulseShape(
  calciumParams: FiveWallNormalCalciumDriveParamsV1,
): Readonly<{
  timeToPeakSec: number;
  normalizedPulseCycleIntegralSec: number;
}> {
  const sampledTrace = calciumParams.ventricularSampledTrace;
  if (sampledTrace !== undefined) {
    const normalized = sampledTrace.samplesUM.map((calciumUM) =>
      (calciumUM - sampledTrace.minimumCalciumUM) / sampledTrace.amplitudeUM);
    const peakIndex = indexOfMaximum(normalized);
    let normalizedPulseCycleIntegralSec = 0;
    for (let index = 0; index + 1 < normalized.length; index += 1) {
      normalizedPulseCycleIntegralSec += 0.5
        * (normalized[index]! + normalized[index + 1]!)
        * sampledTrace.sampleIntervalSec;
    }
    return Object.freeze({
      timeToPeakSec: peakIndex * sampledTrace.sampleIntervalSec,
      normalizedPulseCycleIntegralSec,
    });
  }
  const ventricular = calciumParams.ventricular;
  const mixture = calciumParams.ventricularDelayedMixture;
  if (mixture === undefined) {
    return measurePeriodicBiexponentialCalciumPulseShapeV1(
      calciumParams.cycleLengthSec,
      ventricular.riseTimeConstantSec,
      ventricular.decayTimeConstantSec,
    );
  }
  const measured = measurePeriodicBiexponentialDelayedMixtureShapeV1(
    calciumParams.cycleLengthSec,
    ventricular.riseTimeConstantSec,
    ventricular.decayTimeConstantSec,
    mixture.delayedWeight01,
    mixture.delaySec,
  );
  if (
    Math.abs(
      measured.unnormalizedMixturePeak01
      - mixture.unnormalizedMixturePeak01,
    ) > 1e-14
  ) {
    throw new Error(
      "configured delayed-mixture normalization differs from analytic peak",
    );
  }
  return Object.freeze({
    timeToPeakSec: measured.timeToPeakSec,
    normalizedPulseCycleIntegralSec:
      measured.normalizedMixtureCycleIntegralSec,
  });
}

function backwardDifferences(
  values: readonly number[],
  dtSec: number,
  precedingValue: number,
): readonly number[] {
  return Object.freeze(values.map((value, index) =>
    (value - (index === 0 ? precedingValue : values[index - 1]!)) / dtSec));
}

function cyclicForwardIndexDistance(
  startIndex: number,
  endIndex: number,
  count: number,
): number {
  return endIndex >= startIndex
    ? endIndex - startIndex
    : count - startIndex + endIndex;
}

function relativeChange(value: number, reference: number): number {
  return Math.abs(value - reference) / Math.max(Math.abs(reference), 1e-12);
}

function positiveModulo01(value: number): number {
  const result = value % 1;
  return result < 0 ? result + 1 : result;
}

function signedShortestPhaseDifference01(value: number): number {
  return positiveModulo01(value + 0.5) - 0.5;
}

function cyclicPostPeakTimeToFraction(
  values: readonly number[],
  peakIndex: number,
  fraction01: number,
  dtSec: number,
): number | null {
  const threshold = fraction01 * values[peakIndex]!;
  for (let offset = 1; offset < values.length; offset += 1) {
    if (values[(peakIndex + offset) % values.length]! <= threshold) {
      return offset * dtSec;
    }
  }
  return null;
}

function rootMeanSquare(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)
    / values.length);
}

function maximum(values: readonly number[]): number {
  let result = Number.NEGATIVE_INFINITY;
  for (const value of values) result = Math.max(result, value);
  return result === Number.NEGATIVE_INFINITY ? 0 : result;
}

function minimum(values: readonly number[]): number {
  let result = Number.POSITIVE_INFINITY;
  for (const value of values) result = Math.min(result, value);
  return result === Number.POSITIVE_INFINITY ? 0 : result;
}

function indexOfMaximum(values: readonly number[]): number {
  let index = 0;
  for (let candidate = 1; candidate < values.length; candidate += 1) {
    if (values[candidate]! > values[index]!) index = candidate;
  }
  return index;
}

function wallRecord(
  build: (wallId: WallId) => number,
): Readonly<Record<WallId, number>> {
  return Object.freeze(Object.fromEntries(
    (["LVFW", "SEP", "RVFW"] as const).map((wallId) =>
      [wallId, build(wallId)]),
  )) as Readonly<Record<WallId, number>>;
}

function nullableWallRecord(
  build: (wallId: WallId) => number | null,
): Readonly<Record<WallId, number | null>> {
  return Object.freeze(Object.fromEntries(
    (["LVFW", "SEP", "RVFW"] as const).map((wallId) =>
      [wallId, build(wallId)]),
  )) as Readonly<Record<WallId, number | null>>;
}
