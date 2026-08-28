import {
  measureMainWireArterialTangentComplianceReadbackV1,
  type MainWireArterialTangentComplianceReadbackV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowArterialStiffnessAblationV1";
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
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1,
  resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1,
  type MainWireNormalAdultFiveWallCirculatoryLoadPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_ARM_IDS_V1,
  resolveMainWireAorticOutflowVelocityStiffnessArmV1,
  type MainWireAorticOutflowVelocityStiffnessArmIdV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowVelocityStiffnessAblationV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  createFixedResearchMainWireNormalAdultFiveWallProviderV1,
  resolveMainWireNormalAdultVentricularMaterialResearchPointV1,
  resolveMainWireNormalAdultVentricularWallMaterialResearchV1,
  type MainWireNormalAdultVentricularMaterialResearchPointV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_FACTORIAL_V1_ID =
  "main-wire-aortic-outflow-velocity-stiffness-factorial-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_FACTORIAL_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    design: "fixed-one-sided-two-by-two-mechanism-load-factorial" as const,
    velocityFactor: "Land-Aeff-four-thirds-scale" as const,
    stiffnessFactor:
      "global-Ao-SA-Art-exponential-PV-stiffness-four-thirds-scale" as const,
    velocityFixedLengthInvariant: true as const,
    complianceReadback:
      "exact-PV-law-tangent-at-accepted-endpoint-pressure" as const,
    exactFrameMutation: false as const,
    existingLandStateCountChanged: false as const,
    calciumDriveChanged: false as const,
    ventricularTrefChanged: false as const,
    passiveOrSlsChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    outcomeInformedFactorCombination: true as const,
    numericParameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowVelocityStiffnessInputV1 = Readonly<{
  armId: MainWireAorticOutflowVelocityStiffnessArmIdV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
}>;

export type MainWireAorticOutflowVelocityStiffnessArmV1 = Readonly<{
  armId: MainWireAorticOutflowVelocityStiffnessArmIdV1;
  materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
  circulatoryLoadPoint: MainWireNormalAdultFiveWallCirculatoryLoadPointV1;
  protocolIdentityHash: string;
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  aorticPulsePressureMmHg: number;
  arterialCompliance: MainWireArterialTangentComplianceReadbackV1;
  referenceLengthIsometric: MainWireVentricularLandIsometricTwitchAuditV1;
  loadedShortening: MainWireVentricularLoadedShorteningAuditV1;
  singlePeakMorphologyPreserved: boolean;
  candidateScreen: MainWireAorticOutflowCalciumCandidateScreenResultV1 | null;
}>;

export type MainWireAorticOutflowVelocityStiffnessMetricIdV1 =
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
  | "lvfw-net-ejection-shortening"
  | "summed-arterial-mean-tangent-compliance";

export type MainWireAorticOutflowVelocityStiffnessContrastV1 = Readonly<{
  metricId: MainWireAorticOutflowVelocityStiffnessMetricIdV1;
  canonicalValue: number;
  highVelocityDistortionMainEffectAtBaselineStiffness: number;
  highArterialStiffnessMainEffectAtBaselineVelocity: number;
  interactionDifferenceOfDifferences: number;
  highVelocityDistortionEffectAtHighStiffness: number;
  highArterialStiffnessEffectAtHighVelocityDistortion: number;
  combinedValue: number;
}>;

export type MainWireAorticOutflowVelocityStiffnessFactorialV1 = Readonly<{
  methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_FACTORIAL_V1_ID;
  arms: readonly MainWireAorticOutflowVelocityStiffnessArmV1[];
  factorialContrasts: readonly MainWireAorticOutflowVelocityStiffnessContrastV1[];
  referenceLengthIsometricInvariance: Readonly<{
    maximumAbsoluteActiveTwitchMetricDifference: number;
    exactAtFloatingPointAcrossFactorial: boolean;
  }>;
  allRunsPeriod1AndIntegrated: boolean;
  morphologyPreservedAcrossFactorial: boolean;
  combinedDirectionalCandidateRetained: boolean;
  combinedReferenceNormalizedCandidate: boolean;
  claim: typeof MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_FACTORIAL_CLAIM_V1;
}>;

export function compareMainWireAorticOutflowVelocityStiffnessFactorialV1(
  inputs: readonly MainWireAorticOutflowVelocityStiffnessInputV1[],
): MainWireAorticOutflowVelocityStiffnessFactorialV1 {
  const byId = new Map<
    MainWireAorticOutflowVelocityStiffnessArmIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >();
  for (const input of inputs) {
    if (byId.has(input.armId)) {
      throw new Error(`duplicate velocity/stiffness arm: ${input.armId}`);
    }
    byId.set(input.armId, input.periodicResult);
  }
  for (const armId of MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_ARM_IDS_V1) {
    if (!byId.has(armId)) {
      throw new Error(`missing velocity/stiffness arm: ${armId}`);
    }
  }
  if (byId.size !== MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_ARM_IDS_V1.length) {
    throw new Error("velocity/stiffness factorial accepts exactly four arms");
  }
  assertFactorialAxes(byId);
  const canonicalCycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    byId.get("canonical")!,
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    "canonical velocity/stiffness arm",
  );
  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_ARM_IDS_V1.map((armId) =>
      measureArm(armId, byId.get(armId)!, canonicalCycle)),
  );
  const canonical = arms[0]!;
  const velocity = arms[1]!;
  const stiffness = arms[2]!;
  const combined = arms[3]!;
  const contrast = (
    metricId: MainWireAorticOutflowVelocityStiffnessMetricIdV1,
    read: (arm: MainWireAorticOutflowVelocityStiffnessArmV1) => number,
  ): MainWireAorticOutflowVelocityStiffnessContrastV1 => {
    const base = read(canonical);
    const velocityValue = read(velocity);
    const stiffnessValue = read(stiffness);
    const both = read(combined);
    return Object.freeze({
      metricId,
      canonicalValue: base,
      highVelocityDistortionMainEffectAtBaselineStiffness:
        velocityValue - base,
      highArterialStiffnessMainEffectAtBaselineVelocity:
        stiffnessValue - base,
      interactionDifferenceOfDifferences:
        both - velocityValue - stiffnessValue + base,
      highVelocityDistortionEffectAtHighStiffness: both - stiffnessValue,
      highArterialStiffnessEffectAtHighVelocityDistortion:
        both - velocityValue,
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
    contrast("lvfw-net-ejection-shortening", (arm) =>
      arm.loadedShortening.walls.LVFW.strainHistory.netEjectionShortening),
    contrast("summed-arterial-mean-tangent-compliance", (arm) =>
      arm.arterialCompliance.summedAllThreeArterialNodes
        .arithmeticMeanMlPerMmHg),
  ]);
  const reference = activeTwitchVector(canonical.referenceLengthIsometric);
  const maximumAbsoluteActiveTwitchMetricDifference = maximum(
    arms.flatMap((arm) => {
      const values = activeTwitchVector(arm.referenceLengthIsometric);
      return values.map((value, index) => Math.abs(value - reference[index]!));
    }),
  );
  return Object.freeze({
    methodId: MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_FACTORIAL_V1_ID,
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
    claim: MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_FACTORIAL_CLAIM_V1,
  });
}

function measureArm(
  armId: MainWireAorticOutflowVelocityStiffnessArmIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  canonicalCycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
): MainWireAorticOutflowVelocityStiffnessArmV1 {
  const arm = resolveMainWireAorticOutflowVelocityStiffnessArmV1(armId);
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      arm.ventricularMaterialPointId,
    );
  const loadPoint = resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1(
    arm.circulatoryLoadPointId,
  );
  const runtime = resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1(
    arm.circulatoryLoadPointId,
  );
  const expectedRuntimeHash = stableHash(sanitizeForStableHash(runtime));
  if (
    result.protocolComponentHashes.circulationRuntimeStableHash
    !== expectedRuntimeHash
  ) {
    throw new Error(`${armId} circulation runtime identity mismatch`);
  }
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    arm.ventricularMaterialPointId,
  );
  if (
    result.protocolIdentity.mechanicsProvider.parameterIdentityHash
    !== provider.parameterIdentityHash
  ) {
    throw new Error(`${armId} mechanics provider identity mismatch`);
  }
  const wallMaterial =
    resolveMainWireNormalAdultVentricularWallMaterialResearchV1(
      arm.ventricularMaterialPointId,
    );
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
    circulatoryLoadPoint: loadPoint,
    protocolIdentityHash: result.protocolIdentityHash,
    cycle,
    aorticPulsePressureMmHg:
      cycle.maximumAorticRootPressureMmHg
      - cycle.minimumAorticRootPressureMmHg,
    arterialCompliance: measureMainWireArterialTangentComplianceReadbackV1(
      result,
      runtime.vascular,
    ),
    referenceLengthIsometric:
      measureMainWireVentricularLandIsometricTwitchAuditV1(
        FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        { dtSec: result.dtSec, fixedLandStretch: 1 },
        wallMaterial,
      ),
    loadedShortening,
    singlePeakMorphologyPreserved:
      cycle.aorticFlowPeakCountAboveFivePercent === 1
      && Object.values(loadedShortening.walls).every((wall) =>
        wall.recordedWholeHeart.localPeakCountAboveFivePercentPeak === 1),
    candidateScreen,
  });
}

function assertFactorialAxes(
  byId: ReadonlyMap<
    MainWireAorticOutflowVelocityStiffnessArmIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >,
): void {
  const canonical = byId.get("canonical")!;
  const velocity = byId.get("ventricular-velocity-distortion-high")!;
  const stiffness = byId.get("arterial-stiffness-high")!;
  const combined = byId.get(
    "ventricular-velocity-distortion-high-plus-arterial-stiffness-high",
  )!;
  const mechanics = (result: MainWireNormalAdultFiveWallPeriodicResultV1) =>
    result.protocolComponentHashes.mechanicsProviderMetadataStableHash;
  const runtime = (result: MainWireNormalAdultFiveWallPeriodicResultV1) =>
    result.protocolComponentHashes.circulationRuntimeStableHash;
  if (
    mechanics(canonical) !== mechanics(stiffness)
    || mechanics(velocity) !== mechanics(combined)
    || mechanics(canonical) === mechanics(velocity)
    || runtime(canonical) !== runtime(velocity)
    || runtime(stiffness) !== runtime(combined)
    || runtime(canonical) === runtime(stiffness)
  ) {
    throw new Error("velocity/stiffness exact identities do not form a factorial");
  }
  const calciumHashes = new Set([...byId.values()].map((result) =>
    result.protocolComponentHashes.calciumDriveFixedParamsStableHash));
  if (calciumHashes.size !== 1) {
    throw new Error("velocity/stiffness factorial changed calcium drive");
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

function maximum(values: readonly number[]): number {
  if (values.length === 0) throw new Error("maximum requires values");
  return Math.max(...values);
}

function required(value: number | null, label: string): number {
  if (value === null) throw new Error(`${label} was not resolved`);
  return value;
}
