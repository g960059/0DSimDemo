import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  screenMainWireAorticOutflowCalciumCandidateV1,
  type MainWireAorticOutflowCalciumCandidateScreenResultV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireVentricularLandDistortionProtocolAuditV1,
  type MainWireVentricularLandDistortionProtocolAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandDistortionProtocolAuditV1";
import {
  measureMainWireVentricularLandIsometricTwitchAuditV1,
  type MainWireVentricularLandIsometricTwitchAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  measureMainWireVentricularLoadedShorteningAuditV1,
  type MainWireVentricularLoadedShorteningAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLoadedShorteningAuditV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_ARM_IDS_V1,
  resolveMainWireAorticOutflowDistortionTransientArmV1,
  type MainWireAorticOutflowDistortionTransientArmIdV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowDistortionTransientAblationV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  createFixedResearchMainWireNormalAdultFiveWallProviderV1,
  resolveMainWireNormalAdultVentricularMaterialResearchPointV1,
  resolveMainWireNormalAdultVentricularWallMaterialResearchV1,
  type MainWireNormalAdultVentricularMaterialResearchPointV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_FACTORIAL_V1_ID =
  "main-wire-aortic-outflow-distortion-transient-factorial-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_FACTORIAL_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    design: "fixed-one-sided-two-by-two-existing-Land-state-factorial" as const,
    amplitudeFactor: "Aeff-four-thirds-scale-with-derived-Aw-and-As" as const,
    recoveryFactor: "phi-four-thirds-scale-with-derived-cw-and-cs" as const,
    combinedConstruction:
      "equal-Aeff-and-phi-scale-preserves-Aw-over-cw-and-As-over-cs" as const,
    combinedInterpretation:
      "faster-distortion-transient-at-preserved-constant-rate-steady-gain" as const,
    quickStretchCalibrationPreserved: false as const,
    loadedShorteningCalibrationPreserved: false as const,
    exactFrameMutation: false as const,
    existingLandStateCountChanged: false as const,
    calciumDriveChanged: false as const,
    ventricularTrefChanged: false as const,
    lengthDependenceChanged: false as const,
    passiveOrSlsChanged: false as const,
    circulationRuntimeChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    outcomeInformedFactorSelection: true as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowDistortionTransientInputV1 = Readonly<{
  armId: MainWireAorticOutflowDistortionTransientArmIdV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
}>;

export type MainWireLandDistortionDynamicsReadbackV1 = Readonly<{
  Aeff: number;
  phi: number;
  Aw: number;
  As: number;
  cwPerSec: number;
  csPerSec: number;
  weakRecoveryTimeConstantSec: number;
  strongRecoveryTimeConstantSec: number;
  weakConstantRateSteadyGainSec: number;
  strongConstantRateSteadyGainSec: number;
}>;

export type MainWireAorticOutflowDistortionTransientArmV1 = Readonly<{
  armId: MainWireAorticOutflowDistortionTransientArmIdV1;
  materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
  protocolIdentityHash: string;
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  aorticPulsePressureMmHg: number;
  distortionDynamics: MainWireLandDistortionDynamicsReadbackV1;
  distortionProtocolAudit:
    MainWireVentricularLandDistortionProtocolAuditV1;
  referenceLengthIsometric: MainWireVentricularLandIsometricTwitchAuditV1;
  loadedShortening: MainWireVentricularLoadedShorteningAuditV1;
  singlePeakMorphologyPreserved: boolean;
  candidateScreen: MainWireAorticOutflowCalciumCandidateScreenResultV1 | null;
}>;

export type MainWireAorticOutflowDistortionTransientMetricIdV1 =
  | "aortic-maximum-flow"
  | "aortic-ejection-time-proxy"
  | "mean-doppler-gradient"
  | "peak-doppler-gradient"
  | "aortic-forward-volume"
  | "cardiac-output"
  | "mean-aortic-pressure"
  | "aortic-pulse-pressure"
  | "left-ventricular-ejection-fraction"
  | "right-ventricular-ejection-fraction"
  | "peak-left-ventricular-pressure"
  | "left-ventricular-end-diastolic-volume"
  | "lvfw-loaded-peak-active-stress"
  | "lvfw-loaded-active-stress-at-aortic-flow-peak"
  | "lvfw-loaded-active-stress-impulse";

export type MainWireAorticOutflowDistortionTransientContrastV1 = Readonly<{
  metricId: MainWireAorticOutflowDistortionTransientMetricIdV1;
  canonicalValue: number;
  highAmplitudeMainEffectAtBaselineRecovery: number;
  highRecoveryMainEffectAtBaselineAmplitude: number;
  interactionDifferenceOfDifferences: number;
  highAmplitudeEffectAtHighRecovery: number;
  highRecoveryEffectAtHighAmplitude: number;
  combinedValue: number;
}>;

export type MainWireAorticOutflowDistortionTransientFactorialV1 = Readonly<{
  methodId:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_FACTORIAL_V1_ID;
  arms: readonly MainWireAorticOutflowDistortionTransientArmV1[];
  factorialContrasts:
    readonly MainWireAorticOutflowDistortionTransientContrastV1[];
  referenceLengthIsometricInvariance: Readonly<{
    maximumAbsoluteActiveTwitchMetricDifference: number;
    exactAtFloatingPointAcrossFactorial: boolean;
  }>;
  combinedConstantRateSteadyGainPreservation: Readonly<{
    maximumRelativeGainDifferenceFromCanonical: number;
    preservedWithinFloatingPointTolerance: boolean;
    weakRecoveryTimeConstantScaleFromCanonical: number;
    strongRecoveryTimeConstantScaleFromCanonical: number;
  }>;
  proportionalTransientEnvelope: Readonly<{
    points: readonly Readonly<{
      armId: MainWireAorticOutflowDistortionTransientArmIdV1;
      commonAeffAndPhiScaleFromCanonical: number;
      aorticMaximumFlowMlPerSec: number;
      aorticEjectionTimeSec: number;
      meanDopplerGradientMmHg: number;
      peakDopplerGradientMmHg: number;
      aorticForwardVolumeMl: number;
      retainedDirectionalCandidate: boolean | null;
    }>[];
    aorticMaximumFlowStrictlyDecreasesWithFasterTransient: boolean;
    peakDopplerGradientStrictlyDecreasesWithFasterTransient: boolean;
    aorticEjectionTimeStrictlyIncreasesWithFasterTransient: boolean;
  }>;
  proportionalDistortionProtocolAudit: Readonly<{
    quickEndRampStressFractionStrictlyDecreasesWithFasterTransient: boolean;
    maximumAbsoluteConstantVelocityEndRampStressFractionDifference:
      number;
    maximumAbsoluteQuickRecoveryEndHoldStressFractionDifference: number;
  }>;
  allRunsPeriod1AndIntegrated: boolean;
  morphologyPreservedAcrossFactorial: boolean;
  combinedDirectionalCandidateRetained: boolean;
  combinedReferenceNormalizedCandidate: boolean;
  claim:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_FACTORIAL_CLAIM_V1;
}>;

export function compareMainWireAorticOutflowDistortionTransientFactorialV1(
  inputs: readonly MainWireAorticOutflowDistortionTransientInputV1[],
): MainWireAorticOutflowDistortionTransientFactorialV1 {
  const byId = new Map<
    MainWireAorticOutflowDistortionTransientArmIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >();
  for (const input of inputs) {
    if (byId.has(input.armId)) {
      throw new Error(`duplicate distortion-transient arm: ${input.armId}`);
    }
    byId.set(input.armId, input.periodicResult);
  }
  for (const armId of
    MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_ARM_IDS_V1) {
    if (!byId.has(armId)) {
      throw new Error(`missing distortion-transient arm: ${armId}`);
    }
  }
  if (
    byId.size
    !== MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_ARM_IDS_V1.length
  ) {
    throw new Error(
      "distortion-transient factorial/envelope requires its six fixed arms",
    );
  }
  assertProtocolAxes(byId);
  const canonicalCycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    byId.get("canonical")!,
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    "canonical distortion-transient arm",
  );
  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_ARM_IDS_V1.map((armId) =>
      measureArm(armId, byId.get(armId)!, canonicalCycle)),
  );
  const canonical = arms[0]!;
  const amplitude = arms[1]!;
  const recovery = arms[2]!;
  const combined = arms[3]!;
  const contrast = (
    metricId: MainWireAorticOutflowDistortionTransientMetricIdV1,
    read: (arm: MainWireAorticOutflowDistortionTransientArmV1) => number,
  ): MainWireAorticOutflowDistortionTransientContrastV1 => {
    const base = read(canonical);
    const amplitudeValue = read(amplitude);
    const recoveryValue = read(recovery);
    const both = read(combined);
    return Object.freeze({
      metricId,
      canonicalValue: base,
      highAmplitudeMainEffectAtBaselineRecovery: amplitudeValue - base,
      highRecoveryMainEffectAtBaselineAmplitude: recoveryValue - base,
      interactionDifferenceOfDifferences:
        both - amplitudeValue - recoveryValue + base,
      highAmplitudeEffectAtHighRecovery: both - recoveryValue,
      highRecoveryEffectAtHighAmplitude: both - amplitudeValue,
      combinedValue: both,
    });
  };
  const factorialContrasts = Object.freeze([
    contrast("aortic-maximum-flow", (arm) =>
      arm.cycle.aorticMaximumFlowMlPerSec),
    contrast("aortic-ejection-time-proxy", (arm) =>
      arm.cycle.aorticEjectionTimeProxySec),
    contrast("mean-doppler-gradient", (arm) =>
      arm.cycle.meanDopplerGradientMmHg),
    contrast("peak-doppler-gradient", (arm) =>
      arm.cycle.peakDopplerGradientMmHg),
    contrast("aortic-forward-volume", (arm) =>
      arm.cycle.aorticForwardVolumeMl),
    contrast("cardiac-output", (arm) =>
      arm.cycle.netAorticCardiacOutputLPerMin),
    contrast("mean-aortic-pressure", (arm) =>
      arm.cycle.meanAorticAbsolutePressureMmHg),
    contrast("aortic-pulse-pressure", (arm) => arm.aorticPulsePressureMmHg),
    contrast("left-ventricular-ejection-fraction", (arm) =>
      arm.cycle.leftVentricularEjectionFraction01),
    contrast("right-ventricular-ejection-fraction", (arm) =>
      arm.cycle.rightVentricularEjectionFraction01),
    contrast("peak-left-ventricular-pressure", (arm) =>
      arm.cycle.peakLeftVentricularPressureMmHg),
    contrast("left-ventricular-end-diastolic-volume", (arm) =>
      arm.cycle.maximumLeftVentricularVolumeMl),
    contrast("lvfw-loaded-peak-active-stress", (arm) =>
      arm.loadedShortening.walls.LVFW.recordedWholeHeart.peakActiveStressKPa),
    contrast("lvfw-loaded-active-stress-at-aortic-flow-peak", (arm) =>
      arm.loadedShortening.walls.LVFW.recordedWholeHeart
        .activeStressAtAorticFlowPeakKPa),
    contrast("lvfw-loaded-active-stress-impulse", (arm) =>
      arm.loadedShortening.walls.LVFW.recordedWholeHeart
        .positiveActiveStressCycleIntegralKPaSec),
  ]);
  const reference = activeTwitchVector(canonical.referenceLengthIsometric);
  const maximumAbsoluteActiveTwitchMetricDifference = maximum(
    arms.flatMap((arm) => {
      const values = activeTwitchVector(arm.referenceLengthIsometric);
      return values.map((value, index) => Math.abs(value - reference[index]!));
    }),
  );
  const maximumRelativeGainDifferenceFromCanonical = maximum([
    relativeDifference(
      combined.distortionDynamics.weakConstantRateSteadyGainSec,
      canonical.distortionDynamics.weakConstantRateSteadyGainSec,
    ),
    relativeDifference(
      combined.distortionDynamics.strongConstantRateSteadyGainSec,
      canonical.distortionDynamics.strongConstantRateSteadyGainSec,
    ),
  ]);
  const proportionalArms = Object.freeze([
    canonical,
    combined,
    arms[4]!,
    arms[5]!,
  ]);
  const proportionalPoints = Object.freeze(proportionalArms.map((arm) =>
    Object.freeze({
      armId: arm.armId,
      commonAeffAndPhiScaleFromCanonical:
        arm.materialPoint
          .ventricularLandVelocityDistortionScaleFromBaseline,
      aorticMaximumFlowMlPerSec: arm.cycle.aorticMaximumFlowMlPerSec,
      aorticEjectionTimeSec: arm.cycle.aorticEjectionTimeProxySec,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      aorticForwardVolumeMl: arm.cycle.aorticForwardVolumeMl,
      retainedDirectionalCandidate:
        arm.candidateScreen?.retainedDirectionalCandidate ?? null,
    })));
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_FACTORIAL_V1_ID,
    arms,
    factorialContrasts,
    referenceLengthIsometricInvariance: Object.freeze({
      maximumAbsoluteActiveTwitchMetricDifference,
      exactAtFloatingPointAcrossFactorial:
        maximumAbsoluteActiveTwitchMetricDifference === 0,
    }),
    combinedConstantRateSteadyGainPreservation: Object.freeze({
      maximumRelativeGainDifferenceFromCanonical,
      preservedWithinFloatingPointTolerance:
        maximumRelativeGainDifferenceFromCanonical <= 1e-14,
      weakRecoveryTimeConstantScaleFromCanonical:
        combined.distortionDynamics.weakRecoveryTimeConstantSec
        / canonical.distortionDynamics.weakRecoveryTimeConstantSec,
      strongRecoveryTimeConstantScaleFromCanonical:
        combined.distortionDynamics.strongRecoveryTimeConstantSec
        / canonical.distortionDynamics.strongRecoveryTimeConstantSec,
    }),
    proportionalTransientEnvelope: Object.freeze({
      points: proportionalPoints,
      aorticMaximumFlowStrictlyDecreasesWithFasterTransient:
        strictlyDecreases(proportionalPoints.map((point) =>
          point.aorticMaximumFlowMlPerSec)),
      peakDopplerGradientStrictlyDecreasesWithFasterTransient:
        strictlyDecreases(proportionalPoints.map((point) =>
          point.peakDopplerGradientMmHg)),
      aorticEjectionTimeStrictlyIncreasesWithFasterTransient:
        strictlyIncreases(proportionalPoints.map((point) =>
          point.aorticEjectionTimeSec)),
    }),
    proportionalDistortionProtocolAudit: Object.freeze({
      quickEndRampStressFractionStrictlyDecreasesWithFasterTransient:
        strictlyDecreases(proportionalArms.map((arm) =>
          arm.distortionProtocolAudit.quickShortening
            .endRampActiveStressFractionOfInitial)),
      maximumAbsoluteConstantVelocityEndRampStressFractionDifference:
        maximum(proportionalArms.map((arm) => Math.abs(
          arm.distortionProtocolAudit.constantVelocityShortening
            .endRampActiveStressFractionOfInitial
          - canonical.distortionProtocolAudit.constantVelocityShortening
            .endRampActiveStressFractionOfInitial,
        ))),
      maximumAbsoluteQuickRecoveryEndHoldStressFractionDifference:
        maximum(proportionalArms.map((arm) => Math.abs(
          arm.distortionProtocolAudit.quickShortening
            .endHoldActiveStressFractionOfInitial
          - canonical.distortionProtocolAudit.quickShortening
            .endHoldActiveStressFractionOfInitial,
        ))),
    }),
    allRunsPeriod1AndIntegrated: arms.every((arm) =>
      arm.cycle.periodicSteadyStateClaimed
      && arm.cycle.integrationCompletedWithoutFailure),
    morphologyPreservedAcrossFactorial:
      arms.every((arm) => arm.singlePeakMorphologyPreserved),
    combinedDirectionalCandidateRetained:
      combined.candidateScreen!.retainedDirectionalCandidate,
    combinedReferenceNormalizedCandidate:
      combined.candidateScreen!.referenceNormalizedCandidate,
    claim:
      MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_FACTORIAL_CLAIM_V1,
  });
}

function measureArm(
  armId: MainWireAorticOutflowDistortionTransientArmIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  canonicalCycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
): MainWireAorticOutflowDistortionTransientArmV1 {
  const arm = resolveMainWireAorticOutflowDistortionTransientArmV1(armId);
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      arm.ventricularMaterialPointId,
    );
  const wallMaterial =
    resolveMainWireNormalAdultVentricularWallMaterialResearchV1(
      arm.ventricularMaterialPointId,
    );
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    arm.ventricularMaterialPointId,
  );
  if (
    result.protocolIdentity.mechanicsProvider.parameterIdentityHash
    !== provider.parameterIdentityHash
  ) {
    throw new Error(`${armId} mechanics provider identity mismatch`);
  }
  const cycle = armId === "canonical"
    ? canonicalCycle
    : measureMainWireAorticOutflowCalciumWaveformCycleV1(
      result,
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      armId,
    );
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${armId} requires a retained complete beat`);
  }
  const aorticPressures = beat.samples.map((sample) =>
    sample.circulationNodeAbsolutePressureMmHg.Ao);
  const derived = wallMaterial.landEquationParameters.derived;
  const distortionDynamics = Object.freeze({
    Aeff: wallMaterial.landEquationParameters.values.Aeff,
    phi: wallMaterial.landEquationParameters.values.phi,
    Aw: derived.Aw,
    As: derived.As,
    cwPerSec: derived.cw,
    csPerSec: derived.cs,
    weakRecoveryTimeConstantSec: 1 / derived.cw,
    strongRecoveryTimeConstantSec: 1 / derived.cs,
    weakConstantRateSteadyGainSec: derived.Aw / derived.cw,
    strongConstantRateSteadyGainSec: derived.As / derived.cs,
  });
  const referenceLengthIsometric =
    measureMainWireVentricularLandIsometricTwitchAuditV1(
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      { dtSec: result.dtSec, fixedLandStretch: 1 },
      wallMaterial,
    );
  const loadedShortening = measureMainWireVentricularLoadedShorteningAuditV1(
    result,
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    Object.freeze({
      wallMaterialParams: wallMaterial,
      expectedMechanicsProviderParameterIdentityHash:
        provider.parameterIdentityHash,
    }),
  );
  const candidateScreen = armId === "canonical"
    ? null
    : screenMainWireAorticOutflowCalciumCandidateV1(cycle, canonicalCycle);
  return Object.freeze({
    armId,
    materialPoint,
    protocolIdentityHash: result.protocolIdentityHash,
    cycle,
    aorticPulsePressureMmHg:
      maximum(aorticPressures) - minimum(aorticPressures),
    distortionDynamics,
    distortionProtocolAudit:
      measureMainWireVentricularLandDistortionProtocolAuditV1(wallMaterial),
    referenceLengthIsometric,
    loadedShortening,
    singlePeakMorphologyPreserved:
      cycle.aorticFlowPeakCountAboveFivePercent === 1
      && loadedShortening.walls.LVFW.recordedWholeHeart
        .localPeakCountAboveFivePercentPeak === 1,
    candidateScreen,
  });
}

function assertProtocolAxes(
  byId: ReadonlyMap<
    MainWireAorticOutflowDistortionTransientArmIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >,
): void {
  const results = [...byId.values()];
  const runtimeHashes = new Set(results.map((result) =>
    result.protocolComponentHashes.circulationRuntimeStableHash));
  const calciumHashes = new Set(results.map((result) =>
    result.protocolComponentHashes.calciumDriveFixedParamsStableHash));
  const mechanicsHashes = new Set(results.map((result) =>
    result.protocolComponentHashes.mechanicsProviderMetadataStableHash));
  if (
    runtimeHashes.size !== 1
    || calciumHashes.size !== 1
    || mechanicsHashes.size
      !== MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_ARM_IDS_V1.length
  ) {
    throw new Error("distortion-transient factorial protocol axes are not isolated");
  }
}

function activeTwitchVector(
  audit: MainWireVentricularLandIsometricTwitchAuditV1,
): readonly number[] {
  const twitch = audit.activeTwitch;
  return Object.freeze([
    twitch.minimum,
    twitch.maximum,
    twitch.amplitude,
    twitch.timeToPeakSec,
    required(twitch.relaxationTime50Sec, "isometric RT50"),
    required(twitch.relaxationTime90Sec, "isometric RT90"),
    required(twitch.relaxationTime95Sec, "isometric RT95"),
    required(twitch.durationAboveHalfMaximumSec, "isometric half duration"),
    twitch.minimumKPa,
    twitch.peakKPa,
    twitch.amplitudeKPa,
  ]);
}

function required(value: number | null, label: string): number {
  if (value === null) throw new Error(`${label} was not resolved`);
  return value;
}

function relativeDifference(value: number, reference: number): number {
  return Math.abs(value - reference) / Math.max(Math.abs(reference), 1e-12);
}

function strictlyDecreases(values: readonly number[]): boolean {
  return values.slice(1).every((value, index) => value < values[index]!);
}

function strictlyIncreases(values: readonly number[]): boolean {
  return values.slice(1).every((value, index) => value > values[index]!);
}

function minimum(values: readonly number[]): number {
  if (values.length === 0) throw new Error("minimum requires values");
  return Math.min(...values);
}

function maximum(values: readonly number[]): number {
  if (values.length === 0) throw new Error("maximum requires values");
  return Math.max(...values);
}
