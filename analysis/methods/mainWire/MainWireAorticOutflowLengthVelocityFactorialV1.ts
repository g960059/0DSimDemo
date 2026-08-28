import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  screenMainWireAorticOutflowCalciumCandidateV1,
  type MainWireAorticOutflowCalciumCandidateScreenResultV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
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
  MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_ARM_IDS_V1,
  resolveMainWireAorticOutflowLengthVelocityArmV1,
  type MainWireAorticOutflowLengthVelocityArmIdV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowLengthVelocityAblationV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  createFixedResearchMainWireNormalAdultFiveWallProviderV1,
  resolveMainWireNormalAdultVentricularMaterialResearchPointV1,
  resolveMainWireNormalAdultVentricularWallMaterialResearchV1,
  type MainWireNormalAdultVentricularMaterialResearchPointV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_FACTORIAL_V1_ID =
  "main-wire-aortic-outflow-length-velocity-factorial-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_FACTORIAL_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    design: "fixed-one-sided-two-by-two-existing-Land-mechanism-factorial" as const,
    lengthFactor: "beta0-and-beta1-three-quarter-scale" as const,
    velocityFactor: "Aeff-four-thirds-scale-with-derived-Aw-and-As" as const,
    fixedLengthReference:
      "lambda-one-periodic-isometric-twitch-exactly-invariant" as const,
    loadedSeparation:
      "full-kinematics-versus-zero-zeta-drive-versus-fixed-onset-length-offline-replays" as const,
    exactFrameMutation: false as const,
    existingLandStateCountChanged: false as const,
    calciumDriveChanged: false as const,
    ventricularTrefChanged: false as const,
    passiveOrSlsChanged: false as const,
    circulationRuntimeChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    outcomeInformedFactorSelection: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowLengthVelocityInputV1 = Readonly<{
  armId: MainWireAorticOutflowLengthVelocityArmIdV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
}>;

export type MainWireAorticOutflowLengthVelocityArmV1 = Readonly<{
  armId: MainWireAorticOutflowLengthVelocityArmIdV1;
  materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
  protocolIdentityHash: string;
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  aorticPulsePressureMmHg: number;
  referenceLengthIsometric: MainWireVentricularLandIsometricTwitchAuditV1;
  loadedShortening: MainWireVentricularLoadedShorteningAuditV1;
  singlePeakMorphologyPreserved: boolean;
  candidateScreen: MainWireAorticOutflowCalciumCandidateScreenResultV1 | null;
}>;

export type MainWireAorticOutflowLengthVelocityMetricIdV1 =
  | "aortic-maximum-flow"
  | "aortic-ejection-time-proxy"
  | "mean-doppler-gradient"
  | "peak-doppler-gradient"
  | "aortic-forward-volume"
  | "cardiac-output"
  | "mean-aortic-pressure"
  | "aortic-pulse-pressure"
  | "left-ventricular-ejection-fraction"
  | "peak-left-ventricular-pressure"
  | "lvfw-loaded-peak-active-stress"
  | "lvfw-loaded-active-stress-at-aortic-flow-peak"
  | "lvfw-loaded-active-stress-impulse"
  | "lvfw-loaded-peak-fraction-of-distortion-suppressed";

export type MainWireAorticOutflowLengthVelocityContrastV1 = Readonly<{
  metricId: MainWireAorticOutflowLengthVelocityMetricIdV1;
  canonicalValue: number;
  lowLengthDependenceMainEffectAtBaselineVelocity: number;
  highVelocityDistortionMainEffectAtBaselineLength: number;
  interactionDifferenceOfDifferences: number;
  lowLengthDependenceEffectAtHighVelocityDistortion: number;
  highVelocityDistortionEffectAtLowLengthDependence: number;
  combinedValue: number;
}>;

export type MainWireAorticOutflowLengthVelocityFactorialV1 = Readonly<{
  methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_FACTORIAL_V1_ID;
  arms: readonly MainWireAorticOutflowLengthVelocityArmV1[];
  factorialContrasts: readonly MainWireAorticOutflowLengthVelocityContrastV1[];
  referenceLengthIsometricInvariance: Readonly<{
    maximumAbsoluteActiveTwitchMetricDifference: number;
    exactAtFloatingPointAcrossFactorial: boolean;
  }>;
  allRunsPeriod1AndIntegrated: boolean;
  morphologyPreservedAcrossFactorial: boolean;
  combinedDirectionalCandidateRetained: boolean;
  combinedReferenceNormalizedCandidate: boolean;
  claim: typeof MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_FACTORIAL_CLAIM_V1;
}>;

export function compareMainWireAorticOutflowLengthVelocityFactorialV1(
  inputs: readonly MainWireAorticOutflowLengthVelocityInputV1[],
): MainWireAorticOutflowLengthVelocityFactorialV1 {
  const byId = new Map<
    MainWireAorticOutflowLengthVelocityArmIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >();
  for (const input of inputs) {
    if (byId.has(input.armId)) {
      throw new Error(`duplicate length/velocity arm: ${input.armId}`);
    }
    byId.set(input.armId, input.periodicResult);
  }
  for (const armId of MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_ARM_IDS_V1) {
    if (!byId.has(armId)) throw new Error(`missing length/velocity arm: ${armId}`);
  }
  if (byId.size !== MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_ARM_IDS_V1.length) {
    throw new Error("length/velocity factorial accepts exactly four arms");
  }
  assertProtocolAxes(byId);
  const canonicalCycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    byId.get("canonical")!,
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    "canonical length/velocity arm",
  );
  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_ARM_IDS_V1.map((armId) =>
      measureArm(armId, byId.get(armId)!, canonicalCycle)),
  );
  const canonical = arms[0]!;
  const length = arms[1]!;
  const velocity = arms[2]!;
  const combined = arms[3]!;
  const contrast = (
    metricId: MainWireAorticOutflowLengthVelocityMetricIdV1,
    read: (arm: MainWireAorticOutflowLengthVelocityArmV1) => number,
  ): MainWireAorticOutflowLengthVelocityContrastV1 => {
    const base = read(canonical);
    const lengthValue = read(length);
    const velocityValue = read(velocity);
    const both = read(combined);
    return Object.freeze({
      metricId,
      canonicalValue: base,
      lowLengthDependenceMainEffectAtBaselineVelocity: lengthValue - base,
      highVelocityDistortionMainEffectAtBaselineLength: velocityValue - base,
      interactionDifferenceOfDifferences:
        both - lengthValue - velocityValue + base,
      lowLengthDependenceEffectAtHighVelocityDistortion: both - velocityValue,
      highVelocityDistortionEffectAtLowLengthDependence: both - lengthValue,
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
    contrast("peak-left-ventricular-pressure", (arm) =>
      arm.cycle.peakLeftVentricularPressureMmHg),
    contrast("lvfw-loaded-peak-active-stress", (arm) =>
      arm.loadedShortening.walls.LVFW.recordedWholeHeart.peakActiveStressKPa),
    contrast("lvfw-loaded-active-stress-at-aortic-flow-peak", (arm) =>
      arm.loadedShortening.walls.LVFW.recordedWholeHeart
        .activeStressAtAorticFlowPeakKPa),
    contrast("lvfw-loaded-active-stress-impulse", (arm) =>
      arm.loadedShortening.walls.LVFW.recordedWholeHeart
        .positiveActiveStressCycleIntegralKPaSec),
    contrast("lvfw-loaded-peak-fraction-of-distortion-suppressed", (arm) =>
      arm.loadedShortening.walls.LVFW.distortionContribution
        .loadedPeakStressFractionOfDistortionSuppressedReplay),
  ]);
  const reference = activeTwitchVector(canonical.referenceLengthIsometric);
  const maximumAbsoluteActiveTwitchMetricDifference = maximum(
    arms.flatMap((arm) => {
      const values = activeTwitchVector(arm.referenceLengthIsometric);
      return values.map((value, index) => Math.abs(value - reference[index]!));
    }),
  );
  return Object.freeze({
    methodId: MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_FACTORIAL_V1_ID,
    arms,
    factorialContrasts,
    referenceLengthIsometricInvariance: Object.freeze({
      maximumAbsoluteActiveTwitchMetricDifference,
      exactAtFloatingPointAcrossFactorial:
        maximumAbsoluteActiveTwitchMetricDifference === 0,
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
    claim: MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_FACTORIAL_CLAIM_V1,
  });
}

function measureArm(
  armId: MainWireAorticOutflowLengthVelocityArmIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  canonicalCycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
): MainWireAorticOutflowLengthVelocityArmV1 {
  const arm = resolveMainWireAorticOutflowLengthVelocityArmV1(armId);
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
  const referenceLengthIsometric =
    measureMainWireVentricularLandIsometricTwitchAuditV1(
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      { dtSec: result.dtSec, fixedLandStretch: 1 },
      wallMaterial,
    );
  const loadedShortening = measureMainWireVentricularLoadedShorteningAuditV1(
    result,
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    {
      wallMaterialParams: wallMaterial,
      expectedMechanicsProviderParameterIdentityHash:
        provider.parameterIdentityHash,
    },
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
    referenceLengthIsometric,
    loadedShortening,
    singlePeakMorphologyPreserved:
      cycle.aorticFlowPeakCountAboveFivePercent === 1
      && Object.values(loadedShortening.walls).every((wall) =>
        wall.recordedWholeHeart.localPeakCountAboveFivePercentPeak === 1),
    candidateScreen,
  });
}

function assertProtocolAxes(
  byId: ReadonlyMap<
    MainWireAorticOutflowLengthVelocityArmIdV1,
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
  if (runtimeHashes.size !== 1 || calciumHashes.size !== 1 || mechanicsHashes.size !== 4) {
    throw new Error("length/velocity factorial protocol axes are not isolated");
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

function minimum(values: readonly number[]): number {
  if (values.length === 0) throw new Error("minimum requires values");
  return Math.min(...values);
}

function maximum(values: readonly number[]): number {
  if (values.length === 0) throw new Error("maximum requires values");
  return Math.max(...values);
}

function required(value: number | null, label: string): number {
  if (value === null) throw new Error(`${label} was not resolved`);
  return value;
}
