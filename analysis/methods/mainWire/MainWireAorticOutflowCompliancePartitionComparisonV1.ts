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
  MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_BASELINE_CAPACITY_SNAPSHOT_V1,
  MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_RESEARCH_PROFILE_IDS_V1,
  resolveMainWireAorticCompliancePartitionCapacitySnapshotV1,
  resolveMainWireAorticCompliancePartitionResearchProfileV1,
  type MainWireAorticCompliancePartitionCapacitySnapshotV1,
  type MainWireAorticCompliancePartitionResearchProfileIdV1,
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
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  normalAdultMainWireRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_COMPLIANCE_PARTITION_COMPARISON_V1_ID =
  "main-wire-aortic-outflow-compliance-partition-comparison-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_COMPLIANCE_PARTITION_ARM_IDS_V1 =
  Object.freeze([
    "canonical",
    ...MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_RESEARCH_PROFILE_IDS_V1,
  ] as const);

export type MainWireAorticOutflowCompliancePartitionArmIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_COMPLIANCE_PARTITION_ARM_IDS_V1)[number];

export const MAIN_WIRE_AORTIC_OUTFLOW_COMPLIANCE_PARTITION_COMPARISON_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    design:
      "fixed-one-dimensional-Ao-to-SA-capacity-redistribution-bracket" as const,
    exactFrameMutation: false as const,
    totalAoSaExponentialPvCapacityPreservedExactly: true as const,
    equalPressureCombinedAoSaTangentCompliancePreservedExactly: true as const,
    observedPressureCombinedAoSaTangentComplianceReportedNotConstrained:
      true as const,
    aorticValveConstitutiveLawChanged: false as const,
    globalArterialStiffnessChanged: false as const,
    arterialResistanceOrInertanceChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    candidateScreen:
      "shared-aortic-outflow-candidate-retention-screen" as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveBracket: false as const,
    anatomicalSupportLengthIdentified: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowCompliancePartitionInputV1 = Readonly<{
  armId: MainWireAorticOutflowCompliancePartitionArmIdV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
}>;

export type MainWireAorticOutflowCompliancePartitionArmV1 = Readonly<{
  armId: MainWireAorticOutflowCompliancePartitionArmIdV1;
  profile: MainWireAorticCompliancePartitionResearchProfileV1 | null;
  capacity: MainWireAorticCompliancePartitionCapacitySnapshotV1;
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  compliance: MainWireArterialTangentComplianceReadbackV1;
  arithmeticMeanAorticRootFractionOfAoSaTangentCompliance01: number;
  candidateScreen: MainWireAorticOutflowCalciumCandidateScreenResultV1 | null;
}>;

export type MainWireAorticOutflowCompliancePartitionContrastV1 = Readonly<{
  armId: MainWireAorticCompliancePartitionResearchProfileIdV1;
  aorticRootVsChangeMl: number;
  systemicArteryVsChangeMl: number;
  aorticMaximumFlowChangeMlPerSec: number;
  aorticEjectionTimeProxyChangeSec: number;
  meanDopplerGradientChangeMmHg: number;
  peakDopplerGradientChangeMmHg: number;
  aorticForwardVolumeChangeMl: number;
  netAorticCardiacOutputChangeLPerMin: number;
  meanAorticPressureChangeMmHg: number;
  aorticPulsePressureChangeMmHg: number;
  aorticRootStorageAtFlowPeakChangeMlPerSec: number;
  meanAoSaTangentComplianceChangeMlPerMmHg: number;
}>;

export type MainWireAorticOutflowCompliancePartitionComparisonV1 = Readonly<{
  methodId:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_COMPLIANCE_PARTITION_COMPARISON_V1_ID;
  arms: readonly MainWireAorticOutflowCompliancePartitionArmV1[];
  contrastsFromCanonical:
    readonly MainWireAorticOutflowCompliancePartitionContrastV1[];
  allRunsPeriod1AndIntegrated: boolean;
  peakFlowStrictlyIncreasesWithAorticRootCapacity: boolean;
  meanDopplerGradientStrictlyIncreasesWithAorticRootCapacity: boolean;
  peakDopplerGradientStrictlyIncreasesWithAorticRootCapacity: boolean;
  ejectionTimeStrictlyDecreasesWithAorticRootCapacity: boolean;
  claim:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_COMPLIANCE_PARTITION_COMPARISON_CLAIM_V1;
}>;

export function compareMainWireAorticOutflowCompliancePartitionV1(
  inputs: readonly MainWireAorticOutflowCompliancePartitionInputV1[],
): MainWireAorticOutflowCompliancePartitionComparisonV1 {
  const byId = new Map<
    MainWireAorticOutflowCompliancePartitionArmIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >();
  for (const input of inputs) {
    if (byId.has(input.armId)) {
      throw new Error(`duplicate aortic compliance partition arm: ${input.armId}`);
    }
    byId.set(input.armId, input.periodicResult);
  }
  for (const armId of MAIN_WIRE_AORTIC_OUTFLOW_COMPLIANCE_PARTITION_ARM_IDS_V1) {
    if (!byId.has(armId)) {
      throw new Error(`missing aortic compliance partition arm: ${armId}`);
    }
  }
  if (
    byId.size !== MAIN_WIRE_AORTIC_OUTFLOW_COMPLIANCE_PARTITION_ARM_IDS_V1.length
  ) {
    throw new Error("aortic compliance partition accepts exactly three arms");
  }
  const canonicalResult = byId.get("canonical")!;
  const rawArms = MAIN_WIRE_AORTIC_OUTFLOW_COMPLIANCE_PARTITION_ARM_IDS_V1.map(
    (armId) => measureArm(armId, byId.get(armId)!, canonicalResult),
  );
  const canonicalRaw = rawArms[0]!;
  const arms = Object.freeze(rawArms.map((arm) => Object.freeze({
    ...arm,
    candidateScreen: arm.armId === "canonical"
      ? null
      : screenMainWireAorticOutflowCalciumCandidateV1(
        arm.cycle,
        canonicalRaw.cycle,
      ),
  })));
  const canonical = arms[0]!;
  const low = arms[1]!;
  const high = arms[2]!;
  const contrast = (
    arm: typeof low | typeof high,
  ): MainWireAorticOutflowCompliancePartitionContrastV1 => Object.freeze({
    armId: arm.armId as MainWireAorticCompliancePartitionResearchProfileIdV1,
    aorticRootVsChangeMl:
      arm.capacity.resolvedAorticRootVsMl
      - canonical.capacity.resolvedAorticRootVsMl,
    systemicArteryVsChangeMl:
      arm.capacity.resolvedSystemicArteryVsMl
      - canonical.capacity.resolvedSystemicArteryVsMl,
    aorticMaximumFlowChangeMlPerSec:
      arm.cycle.aorticMaximumFlowMlPerSec
      - canonical.cycle.aorticMaximumFlowMlPerSec,
    aorticEjectionTimeProxyChangeSec:
      arm.cycle.aorticEjectionTimeProxySec
      - canonical.cycle.aorticEjectionTimeProxySec,
    meanDopplerGradientChangeMmHg:
      arm.cycle.meanDopplerGradientMmHg
      - canonical.cycle.meanDopplerGradientMmHg,
    peakDopplerGradientChangeMmHg:
      arm.cycle.peakDopplerGradientMmHg
      - canonical.cycle.peakDopplerGradientMmHg,
    aorticForwardVolumeChangeMl:
      arm.cycle.aorticForwardVolumeMl
      - canonical.cycle.aorticForwardVolumeMl,
    netAorticCardiacOutputChangeLPerMin:
      arm.cycle.netAorticCardiacOutputLPerMin
      - canonical.cycle.netAorticCardiacOutputLPerMin,
    meanAorticPressureChangeMmHg:
      arm.cycle.meanAorticAbsolutePressureMmHg
      - canonical.cycle.meanAorticAbsolutePressureMmHg,
    aorticPulsePressureChangeMmHg:
      pulsePressure(arm.cycle) - pulsePressure(canonical.cycle),
    aorticRootStorageAtFlowPeakChangeMlPerSec:
      arm.cycle.aorticPressureFlowCoupling.summary.aorticRootStorage
        .flowAtAorticValveFlowPeakMlPerSec
      - canonical.cycle.aorticPressureFlowCoupling.summary.aorticRootStorage
        .flowAtAorticValveFlowPeakMlPerSec,
    meanAoSaTangentComplianceChangeMlPerMmHg:
      arm.compliance.summedAorticRootAndSystemicArtery
        .arithmeticMeanMlPerMmHg
      - canonical.compliance.summedAorticRootAndSystemicArtery
        .arithmeticMeanMlPerMmHg,
  });
  return Object.freeze({
    methodId: MAIN_WIRE_AORTIC_OUTFLOW_COMPLIANCE_PARTITION_COMPARISON_V1_ID,
    arms,
    contrastsFromCanonical: Object.freeze([contrast(low), contrast(high)]),
    allRunsPeriod1AndIntegrated: arms.every((arm) =>
      arm.cycle.periodicSteadyStateClaimed
      && arm.cycle.integrationCompletedWithoutFailure),
    peakFlowStrictlyIncreasesWithAorticRootCapacity:
      low.cycle.aorticMaximumFlowMlPerSec
        < canonical.cycle.aorticMaximumFlowMlPerSec
      && canonical.cycle.aorticMaximumFlowMlPerSec
        < high.cycle.aorticMaximumFlowMlPerSec,
    meanDopplerGradientStrictlyIncreasesWithAorticRootCapacity:
      low.cycle.meanDopplerGradientMmHg
        < canonical.cycle.meanDopplerGradientMmHg
      && canonical.cycle.meanDopplerGradientMmHg
        < high.cycle.meanDopplerGradientMmHg,
    peakDopplerGradientStrictlyIncreasesWithAorticRootCapacity:
      low.cycle.peakDopplerGradientMmHg
        < canonical.cycle.peakDopplerGradientMmHg
      && canonical.cycle.peakDopplerGradientMmHg
        < high.cycle.peakDopplerGradientMmHg,
    ejectionTimeStrictlyDecreasesWithAorticRootCapacity:
      low.cycle.aorticEjectionTimeProxySec
        > canonical.cycle.aorticEjectionTimeProxySec
      && canonical.cycle.aorticEjectionTimeProxySec
        > high.cycle.aorticEjectionTimeProxySec,
    claim: MAIN_WIRE_AORTIC_OUTFLOW_COMPLIANCE_PARTITION_COMPARISON_CLAIM_V1,
  });
}

function measureArm(
  armId: MainWireAorticOutflowCompliancePartitionArmIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  canonicalResult: MainWireNormalAdultFiveWallPeriodicResultV1,
): Omit<MainWireAorticOutflowCompliancePartitionArmV1, "candidateScreen"> {
  assertSharedNonRuntimeProtocol(armId, result, canonicalResult);
  const profile = armId === "canonical"
    ? null
    : resolveMainWireAorticCompliancePartitionResearchProfileV1(armId);
  const capacity = profile === null
    ? MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_BASELINE_CAPACITY_SNAPSHOT_V1
    : resolveMainWireAorticCompliancePartitionCapacitySnapshotV1(profile);
  const runtime = runtimeFor(profile);
  if (
    result.protocolComponentHashes.circulationRuntimeStableHash
      !== stableHash(sanitizeForStableHash(runtime))
  ) {
    throw new Error(`${armId} result does not match its fixed runtime`);
  }
  const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    result,
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    armId,
  );
  const compliance = measureMainWireArterialTangentComplianceReadbackV1(
    result,
    runtime.vascular,
  );
  return Object.freeze({
    armId,
    profile,
    capacity,
    cycle,
    compliance,
    arithmeticMeanAorticRootFractionOfAoSaTangentCompliance01:
      compliance.byNode.Ao.arithmeticMeanMlPerMmHg
      / compliance.summedAorticRootAndSystemicArtery.arithmeticMeanMlPerMmHg,
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

function assertSharedNonRuntimeProtocol(
  armId: MainWireAorticOutflowCompliancePartitionArmIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  canonical: MainWireNormalAdultFiveWallPeriodicResultV1,
): void {
  for (const key of [
    "mechanicsProviderMetadataStableHash",
    "calciumDriveFixedParamsStableHash",
    "circulationTopologyGraphStableHash",
    "bloodVolumeOperatingPointStableHash",
    "commonPericardiumStableHash",
    "periodicPolicyStableHash",
  ] as const) {
    if (
      result.protocolComponentHashes[key]
        !== canonical.protocolComponentHashes[key]
    ) {
      throw new Error(`${armId} protocol mismatch outside runtime: ${key}`);
    }
  }
}

function pulsePressure(
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
): number {
  return cycle.maximumAorticRootPressureMmHg
    - cycle.minimumAorticRootPressureMmHg;
}
