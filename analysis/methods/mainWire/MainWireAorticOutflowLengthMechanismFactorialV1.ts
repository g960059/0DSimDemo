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
  MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_ARM_IDS_V1,
  resolveMainWireAorticOutflowLengthMechanismArmV1,
  type MainWireAorticOutflowLengthMechanismArmIdV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowLengthMechanismAblationV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  createFixedResearchMainWireNormalAdultFiveWallProviderV1,
  resolveMainWireNormalAdultVentricularMaterialResearchPointV1,
  resolveMainWireNormalAdultVentricularWallMaterialResearchV1,
  type MainWireNormalAdultVentricularMaterialResearchPointV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_FACTORIAL_V1_ID =
  "main-wire-aortic-outflow-length-mechanism-factorial-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_FACTORIAL_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    design:
      "fixed-one-sided-two-by-two-plus-split-half-scale-Land-beta0-beta1-envelope" as const,
    beta0Factor: "three-quarters-peak-tension-length-factor" as const,
    beta1Factor: "three-quarters-calcium-sensitivity-length-factor" as const,
    exactFrameMutation: false as const,
    referenceLengthIsometricInvariant: true as const,
    existingLandStateCountChanged: false as const,
    calciumDriveChanged: false as const,
    ventricularTrefChanged: false as const,
    velocityDistortionChanged: false as const,
    passiveOrSlsChanged: false as const,
    circulationRuntimeChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowLengthMechanismInputV1 = Readonly<{
  armId: MainWireAorticOutflowLengthMechanismArmIdV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
}>;

export type MainWireAorticOutflowLengthMechanismArmV1 = Readonly<{
  armId: MainWireAorticOutflowLengthMechanismArmIdV1;
  materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
  protocolIdentityHash: string;
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  aorticPulsePressureMmHg: number;
  referenceLengthIsometric: MainWireVentricularLandIsometricTwitchAuditV1;
  loadedShortening: MainWireVentricularLoadedShorteningAuditV1;
  morphologyPreserved: boolean;
  candidateScreen: MainWireAorticOutflowCalciumCandidateScreenResultV1 | null;
}>;

export type MainWireAorticOutflowLengthMechanismMetricIdV1 =
  | "aortic-maximum-flow"
  | "aortic-onset-to-peak-time"
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
  | "lvfw-loaded-active-stress-impulse";

export type MainWireAorticOutflowLengthMechanismContrastV1 = Readonly<{
  metricId: MainWireAorticOutflowLengthMechanismMetricIdV1;
  canonicalValue: number;
  lowBeta0MainEffectAtCanonicalBeta1: number;
  lowBeta1MainEffectAtCanonicalBeta0: number;
  interactionDifferenceOfDifferences: number;
  lowBeta0EffectAtLowBeta1: number;
  lowBeta1EffectAtLowBeta0: number;
  combinedValue: number;
}>;

export type MainWireAorticOutflowLengthMechanismFactorialV1 = Readonly<{
  methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_FACTORIAL_V1_ID;
  arms: readonly MainWireAorticOutflowLengthMechanismArmV1[];
  factorialContrasts: readonly MainWireAorticOutflowLengthMechanismContrastV1[];
  referenceLengthIsometricInvariance: Readonly<{
    maximumAbsoluteActiveTwitchMetricDifference: number;
    exactAtFloatingPointAcrossFactorial: boolean;
  }>;
  allRunsPeriod1AndIntegrated: boolean;
  morphologyPreservedAcrossFactorial: boolean;
  lowBeta0DirectionalCandidateRetained: boolean;
  lowBeta1DirectionalCandidateRetained: boolean;
  combinedDirectionalCandidateRetained: boolean;
  halfBeta0DirectionalCandidateRetained: boolean;
  halfBeta1DirectionalCandidateRetained: boolean;
  combinedHalfDirectionalCandidateRetained: boolean;
  claim: typeof MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_FACTORIAL_CLAIM_V1;
}>;

export function compareMainWireAorticOutflowLengthMechanismFactorialV1(
  inputs: readonly MainWireAorticOutflowLengthMechanismInputV1[],
): MainWireAorticOutflowLengthMechanismFactorialV1 {
  const byId = new Map<
    MainWireAorticOutflowLengthMechanismArmIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >();
  for (const input of inputs) {
    if (byId.has(input.armId)) {
      throw new Error(`duplicate length-mechanism arm: ${input.armId}`);
    }
    byId.set(input.armId, input.periodicResult);
  }
  for (const armId of MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_ARM_IDS_V1) {
    if (!byId.has(armId)) {
      throw new Error(`missing length-mechanism arm: ${armId}`);
    }
  }
  if (byId.size !== MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_ARM_IDS_V1.length) {
    throw new Error(
      `length-mechanism factorial accepts exactly ${
        MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_ARM_IDS_V1.length
      } arms`,
    );
  }
  assertProtocolAxes(byId);
  const canonicalCycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    byId.get("canonical")!,
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    "canonical length-mechanism arm",
  );
  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_ARM_IDS_V1.map((armId) =>
      measureArm(armId, byId.get(armId)!, canonicalCycle)),
  );
  const canonical = arms[0]!;
  const lowBeta0 = arms[1]!;
  const lowBeta1 = arms[2]!;
  const combined = arms[3]!;
  const halfBeta0 = arms[4]!;
  const halfBeta1 = arms[5]!;
  const combinedHalf = arms[6]!;
  const contrast = (
    metricId: MainWireAorticOutflowLengthMechanismMetricIdV1,
    read: (arm: MainWireAorticOutflowLengthMechanismArmV1) => number,
  ): MainWireAorticOutflowLengthMechanismContrastV1 => {
    const base = read(canonical);
    const beta0 = read(lowBeta0);
    const beta1 = read(lowBeta1);
    const both = read(combined);
    return Object.freeze({
      metricId,
      canonicalValue: base,
      lowBeta0MainEffectAtCanonicalBeta1: beta0 - base,
      lowBeta1MainEffectAtCanonicalBeta0: beta1 - base,
      interactionDifferenceOfDifferences: both - beta0 - beta1 + base,
      lowBeta0EffectAtLowBeta1: both - beta1,
      lowBeta1EffectAtLowBeta0: both - beta0,
      combinedValue: both,
    });
  };
  const factorialContrasts = Object.freeze([
    contrast("aortic-maximum-flow", (arm) =>
      arm.cycle.aorticMaximumFlowMlPerSec),
    contrast("aortic-onset-to-peak-time", (arm) =>
      arm.cycle.timeFromAorticFlowOnsetToPeakSec),
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
  return Object.freeze({
    methodId: MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_FACTORIAL_V1_ID,
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
      arms.every((arm) => arm.morphologyPreserved),
    lowBeta0DirectionalCandidateRetained:
      lowBeta0.candidateScreen!.retainedDirectionalCandidate,
    lowBeta1DirectionalCandidateRetained:
      lowBeta1.candidateScreen!.retainedDirectionalCandidate,
    combinedDirectionalCandidateRetained:
      combined.candidateScreen!.retainedDirectionalCandidate,
    halfBeta0DirectionalCandidateRetained:
      halfBeta0.candidateScreen!.retainedDirectionalCandidate,
    halfBeta1DirectionalCandidateRetained:
      halfBeta1.candidateScreen!.retainedDirectionalCandidate,
    combinedHalfDirectionalCandidateRetained:
      combinedHalf.candidateScreen!.retainedDirectionalCandidate,
    claim: MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_FACTORIAL_CLAIM_V1,
  });
}

function assertProtocolAxes(
  byId: ReadonlyMap<
    MainWireAorticOutflowLengthMechanismArmIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >,
): void {
  const results = [...byId.values()];
  for (const key of [
    "circulationRuntimeStableHash",
    "calciumDriveFixedParamsStableHash",
    "circulationTopologyGraphStableHash",
    "bloodVolumeOperatingPointStableHash",
    "commonPericardiumStableHash",
    "periodicPolicyStableHash",
  ] as const) {
    if (new Set(results.map((result) =>
      result.protocolComponentHashes[key])).size !== 1) {
      throw new Error(`length-mechanism factorial changed ${key}`);
    }
  }
  if (
    new Set(results.map((result) =>
      result.protocolComponentHashes.mechanicsProviderMetadataStableHash)).size
      !== MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_ARM_IDS_V1.length
  ) {
    throw new Error(
      "length-mechanism factorial mechanics identities are not distinct",
    );
  }
}

function measureArm(
  armId: MainWireAorticOutflowLengthMechanismArmIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  canonicalCycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
): MainWireAorticOutflowLengthMechanismArmV1 {
  const arm = resolveMainWireAorticOutflowLengthMechanismArmV1(armId);
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
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
  const wallMaterial =
    resolveMainWireNormalAdultVentricularWallMaterialResearchV1(
      arm.ventricularMaterialPointId,
    );
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
  const morphologyPreserved = cycle.aorticFlowPeakCountAboveFivePercent === 1
    && loadedShortening.walls.LVFW.recordedWholeHeart
      .localPeakCountAboveFivePercentPeak === 1;
  return Object.freeze({
    armId,
    materialPoint,
    protocolIdentityHash: result.protocolIdentityHash,
    cycle,
    aorticPulsePressureMmHg:
      cycle.maximumAorticRootPressureMmHg
      - cycle.minimumAorticRootPressureMmHg,
    referenceLengthIsometric,
    loadedShortening,
    morphologyPreserved,
    candidateScreen: armId === "canonical"
      ? null
      : screenMainWireAorticOutflowCalciumCandidateV1(cycle, canonicalCycle),
  });
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

function maximum(values: readonly number[]): number {
  if (values.length === 0) throw new Error("maximum requires values");
  return Math.max(...values);
}
