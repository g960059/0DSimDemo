import {
  measureMainWireArterialTangentComplianceReadbackV1,
  type MainWireArterialTangentComplianceReadbackV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowArterialStiffnessAblationV1";
import {
  measureMainWireAorticOutflowKinematicFloorV1,
  type MainWireAorticOutflowKinematicFloorV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowKinematicFloorV1";
import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  screenMainWireAorticOutflowCalciumCandidateV1,
  type MainWireAorticOutflowCalciumCandidateScreenResultV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  countMainWireStrictLocalMaximaV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveAblationComparisonV1";
import {
  MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_BASELINE_CAPACITY_SNAPSHOT_V1,
  resolveMainWireAorticCompliancePartitionCapacitySnapshotV1,
  resolveMainWireAorticCompliancePartitionResearchProfileV1,
  type MainWireAorticCompliancePartitionCapacitySnapshotV1,
  type MainWireAorticCompliancePartitionResearchProfileV1,
} from "@/engine/core/MainWireAorticCompliancePartitionResearchProfileV1";
import type {
  NonCoronaryCirculationRuntimeParamsV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  resolveMainWireVentricularCalciumDelayedMixtureParamsV1,
  resolveMainWireVentricularCalciumDelayedMixtureProfileV1,
  type MainWireVentricularCalciumDelayedMixtureProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumDelayedMixtureAblationV1";
import {
  normalAdultMainWireRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_FACTORIAL_V1_ID =
  "main-wire-aortic-outflow-calcium-compliance-factorial-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_CALCIUM_PROFILE_ID_V1 =
  "ventricular-calcium-half-delayed-by-rise-time-exposure-preserving" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_PARTITION_PROFILE_ID_V1 =
  "aortic-root-exponential-pv-capacity-low" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_ARM_IDS_V1 =
  Object.freeze([
    "canonical",
    "delayed-calcium-only",
    "low-root-capacity-only",
    "delayed-calcium-plus-low-root-capacity",
  ] as const);

export type MainWireAorticOutflowCalciumComplianceArmIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_ARM_IDS_V1)[number];

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_FACTORIAL_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    design: "fixed-two-by-two-mechanism-factorial" as const,
    calciumFactor:
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_CALCIUM_PROFILE_ID_V1,
    complianceFactor:
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_PARTITION_PROFILE_ID_V1,
    selectedAfterSeparateFixedBrackets: true as const,
    outcomeInformedFactorSelection: true as const,
    numericParameterFittingOrOptimization: false as const,
    calciumCycleExposurePreservedExactly: true as const,
    totalAoSaExponentialPvCapacityPreservedExactly: true as const,
    aorticValveConstitutiveLawChanged: false as const,
    globalArterialStiffnessChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    morphologyRequirement:
      "single-calcium-single-LVFW-active-stress-single-aortic-flow-peak" as const,
    interaction:
      "difference-of-differences-on-the-fixed-two-by-two-grid" as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowCalciumComplianceInputV1 = Readonly<{
  armId: MainWireAorticOutflowCalciumComplianceArmIdV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
}>;

export type MainWireAorticOutflowCalciumComplianceArmV1 = Readonly<{
  armId: MainWireAorticOutflowCalciumComplianceArmIdV1;
  delayedCalciumActive: boolean;
  lowRootCapacityActive: boolean;
  calciumProfile: MainWireVentricularCalciumDelayedMixtureProfileV1 | null;
  compliancePartitionProfile:
    MainWireAorticCompliancePartitionResearchProfileV1 | null;
  capacity: MainWireAorticCompliancePartitionCapacitySnapshotV1;
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  kinematicFloor: MainWireAorticOutflowKinematicFloorV1;
  compliance: MainWireArterialTangentComplianceReadbackV1;
  aorticPulsePressureMmHg: number;
  ventricularCalciumPeakCountAboveFivePercent: number;
  lvfwActiveStressPeakCountAboveFivePercent: number;
  aorticFlowPeakCountAboveFivePercent: number;
  morphologyPreserved: boolean;
  candidateScreen: MainWireAorticOutflowCalciumCandidateScreenResultV1 | null;
  morphologySafeDirectionalCandidate: boolean;
  referenceNormalizedMorphologySafeCandidate: boolean;
}>;

export type MainWireAorticOutflowCalciumComplianceMetricIdV1 =
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
  | "aortic-root-storage-at-aortic-flow-peak"
  | "mean-aortic-root-tangent-compliance";

export type MainWireAorticOutflowCalciumComplianceFactorialContrastV1 =
  Readonly<{
    metricId: MainWireAorticOutflowCalciumComplianceMetricIdV1;
    canonicalValue: number;
    delayedCalciumMainEffectAtBaselineCapacity: number;
    lowRootCapacityMainEffectAtCanonicalCalcium: number;
    interactionDifferenceOfDifferences: number;
    delayedCalciumEffectAtLowRootCapacity: number;
    lowRootCapacityEffectAtDelayedCalcium: number;
    combinedValue: number;
  }>;

export type MainWireAorticOutflowCalciumComplianceFactorialV1 = Readonly<{
  methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_FACTORIAL_V1_ID;
  arms: readonly MainWireAorticOutflowCalciumComplianceArmV1[];
  factorialContrasts:
    readonly MainWireAorticOutflowCalciumComplianceFactorialContrastV1[];
  allRunsPeriod1AndIntegrated: boolean;
  morphologyPreservedAcrossFactorial: boolean;
  combinedMorphologySafeDirectionalCandidate: boolean;
  combinedReferenceNormalizedCandidate: boolean;
  claim:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_FACTORIAL_CLAIM_V1;
}>;

export function compareMainWireAorticOutflowCalciumComplianceFactorialV1(
  inputs: readonly MainWireAorticOutflowCalciumComplianceInputV1[],
): MainWireAorticOutflowCalciumComplianceFactorialV1 {
  const byId = new Map<
    MainWireAorticOutflowCalciumComplianceArmIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >();
  for (const input of inputs) {
    if (byId.has(input.armId)) {
      throw new Error(`duplicate calcium-compliance arm: ${input.armId}`);
    }
    byId.set(input.armId, input.periodicResult);
  }
  for (const armId of MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_ARM_IDS_V1) {
    if (!byId.has(armId)) {
      throw new Error(`missing calcium-compliance arm: ${armId}`);
    }
  }
  if (byId.size !== MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_ARM_IDS_V1.length) {
    throw new Error("calcium-compliance factorial accepts exactly four arms");
  }
  const canonicalResult = byId.get("canonical")!;
  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_ARM_IDS_V1.map((armId) =>
      measureArm(armId, byId.get(armId)!, canonicalResult)),
  );
  assertFactorialIdentity(arms);
  const canonical = arms[0]!;
  const calcium = arms[1]!;
  const capacity = arms[2]!;
  const combined = arms[3]!;
  const contrast = (
    metricId: MainWireAorticOutflowCalciumComplianceMetricIdV1,
    read: (arm: MainWireAorticOutflowCalciumComplianceArmV1) => number,
  ): MainWireAorticOutflowCalciumComplianceFactorialContrastV1 => {
    const base = read(canonical);
    const calciumValue = read(calcium);
    const capacityValue = read(capacity);
    const combinedValue = read(combined);
    return Object.freeze({
      metricId,
      canonicalValue: base,
      delayedCalciumMainEffectAtBaselineCapacity: calciumValue - base,
      lowRootCapacityMainEffectAtCanonicalCalcium: capacityValue - base,
      interactionDifferenceOfDifferences:
        combinedValue - calciumValue - capacityValue + base,
      delayedCalciumEffectAtLowRootCapacity: combinedValue - capacityValue,
      lowRootCapacityEffectAtDelayedCalcium: combinedValue - calciumValue,
      combinedValue,
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
    contrast("aortic-root-storage-at-aortic-flow-peak", (arm) =>
      arm.cycle.aorticPressureFlowCoupling.summary.aorticRootStorage
        .flowAtAorticValveFlowPeakMlPerSec),
    contrast("mean-aortic-root-tangent-compliance", (arm) =>
      arm.compliance.byNode.Ao.arithmeticMeanMlPerMmHg),
  ]);
  return Object.freeze({
    methodId: MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_FACTORIAL_V1_ID,
    arms,
    factorialContrasts,
    allRunsPeriod1AndIntegrated: arms.every((arm) =>
      arm.cycle.periodicSteadyStateClaimed
      && arm.cycle.integrationCompletedWithoutFailure),
    morphologyPreservedAcrossFactorial:
      arms.every((arm) => arm.morphologyPreserved),
    combinedMorphologySafeDirectionalCandidate:
      combined.morphologySafeDirectionalCandidate,
    combinedReferenceNormalizedCandidate:
      combined.referenceNormalizedMorphologySafeCandidate,
    claim: MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_FACTORIAL_CLAIM_V1,
  });
}

function measureArm(
  armId: MainWireAorticOutflowCalciumComplianceArmIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  canonicalResult: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireAorticOutflowCalciumComplianceArmV1 {
  assertSharedProtocolAxes(armId, result, canonicalResult);
  const delayedCalciumActive = armId === "delayed-calcium-only"
    || armId === "delayed-calcium-plus-low-root-capacity";
  const lowRootCapacityActive = armId === "low-root-capacity-only"
    || armId === "delayed-calcium-plus-low-root-capacity";
  const calciumProfile = delayedCalciumActive
    ? resolveMainWireVentricularCalciumDelayedMixtureProfileV1(
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_CALCIUM_PROFILE_ID_V1,
    )
    : null;
  const compliancePartitionProfile = lowRootCapacityActive
    ? resolveMainWireAorticCompliancePartitionResearchProfileV1(
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_PARTITION_PROFILE_ID_V1,
    )
    : null;
  const calciumParams = calciumProfile === null
    ? FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1
    : resolveMainWireVentricularCalciumDelayedMixtureParamsV1(
      calciumProfile.profileId,
    );
  const runtime = runtimeFor(compliancePartitionProfile);
  assertExpectedAxisHashes(armId, result, calciumParams, runtime);
  const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    result,
    calciumParams,
    armId,
  );
  const canonicalCycle = armId === "canonical"
    ? cycle
    : measureMainWireAorticOutflowCalciumWaveformCycleV1(
      canonicalResult,
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      "canonical",
    );
  const candidateScreen = armId === "canonical"
    ? null
    : screenMainWireAorticOutflowCalciumCandidateV1(cycle, canonicalCycle);
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${armId} calcium-compliance arm requires a beat`);
  }
  const ventricularCalcium = beat.samples.map((sample) => Math.max(
    0,
    sample.freeCalciumUM.LVFW
      - calciumParams.ventricular.diastolicCalciumUM,
  ));
  const activeStress = beat.samples.map((sample) =>
    Math.max(0, sample.wallStressPa.LVFW.active));
  const ventricularCalciumPeakCount = countMainWireStrictLocalMaximaV1(
    ventricularCalcium,
    0.05 * maximum(ventricularCalcium),
  );
  const activeStressPeakCount = countMainWireStrictLocalMaximaV1(
    activeStress,
    0.05 * maximum(activeStress),
  );
  const flowPeakCount = cycle.aorticFlowPeakCountAboveFivePercent;
  const morphologyPreserved = ventricularCalciumPeakCount === 1
    && activeStressPeakCount === 1
    && flowPeakCount === 1;
  const compliance = measureMainWireArterialTangentComplianceReadbackV1(
    result,
    runtime.vascular,
  );
  return Object.freeze({
    armId,
    delayedCalciumActive,
    lowRootCapacityActive,
    calciumProfile,
    compliancePartitionProfile,
    capacity: compliancePartitionProfile === null
      ? MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_BASELINE_CAPACITY_SNAPSHOT_V1
      : resolveMainWireAorticCompliancePartitionCapacitySnapshotV1(
        compliancePartitionProfile,
      ),
    cycle,
    kinematicFloor: measureMainWireAorticOutflowKinematicFloorV1(result),
    compliance,
    aorticPulsePressureMmHg:
      cycle.maximumAorticRootPressureMmHg
      - cycle.minimumAorticRootPressureMmHg,
    ventricularCalciumPeakCountAboveFivePercent: ventricularCalciumPeakCount,
    lvfwActiveStressPeakCountAboveFivePercent: activeStressPeakCount,
    aorticFlowPeakCountAboveFivePercent: flowPeakCount,
    morphologyPreserved,
    candidateScreen,
    morphologySafeDirectionalCandidate:
      candidateScreen !== null
      && morphologyPreserved
      && candidateScreen.retainedDirectionalCandidate,
    referenceNormalizedMorphologySafeCandidate:
      morphologyPreserved
      && (candidateScreen?.referenceNormalizedCandidate ?? false),
  });
}

function runtimeFor(
  profile: MainWireAorticCompliancePartitionResearchProfileV1 | null,
): NonCoronaryCirculationRuntimeParamsV1 {
  const baseline = normalAdultMainWireRuntimeV1();
  if (profile === null) return baseline;
  return Object.freeze({
    ...baseline,
    vascular: Object.freeze({
      ...baseline.vascular,
      aorticCompliancePartitionResearchProfile: profile,
    }),
  });
}

function assertExpectedAxisHashes(
  armId: MainWireAorticOutflowCalciumComplianceArmIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  calciumParams: FiveWallNormalCalciumDriveParamsV1,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
): void {
  if (
    result.protocolComponentHashes.calciumDriveFixedParamsStableHash
      !== stableHash(sanitizeForStableHash(calciumParams))
  ) throw new Error(`${armId} calcium identity mismatch`);
  if (
    result.protocolComponentHashes.circulationRuntimeStableHash
      !== stableHash(sanitizeForStableHash(runtime))
  ) throw new Error(`${armId} circulation runtime mismatch`);
}

function assertSharedProtocolAxes(
  armId: MainWireAorticOutflowCalciumComplianceArmIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  canonical: MainWireNormalAdultFiveWallPeriodicResultV1,
): void {
  for (const key of [
    "mechanicsProviderMetadataStableHash",
    "circulationTopologyGraphStableHash",
    "bloodVolumeOperatingPointStableHash",
    "commonPericardiumStableHash",
    "periodicPolicyStableHash",
  ] as const) {
    if (
      result.protocolComponentHashes[key]
        !== canonical.protocolComponentHashes[key]
    ) throw new Error(`${armId} protocol mismatch outside factorial: ${key}`);
  }
}

function assertFactorialIdentity(
  arms: readonly MainWireAorticOutflowCalciumComplianceArmV1[],
): void {
  const [canonical, calcium, capacity, combined] = arms;
  if (
    canonical!.cycle.calciumDriveStableHash
      !== capacity!.cycle.calciumDriveStableHash
    || calcium!.cycle.calciumDriveStableHash
      !== combined!.cycle.calciumDriveStableHash
  ) throw new Error("calcium-compliance factorial calcium pairing mismatch");
  if (
    new Set(arms.map((arm) => arm.cycle.protocolIdentityHash)).size
      !== arms.length
  ) throw new Error("calcium-compliance factorial arm identities collapsed");
}

function maximum(values: readonly number[]): number {
  let result = Number.NEGATIVE_INFINITY;
  for (const value of values) result = Math.max(result, value);
  return result === Number.NEGATIVE_INFINITY ? 0 : result;
}
