import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireArterialTangentComplianceReadbackV1,
  type MainWireArterialTangentComplianceReadbackV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowArterialStiffnessAblationV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_BRACKET_CLAIM_V1,
  MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_PROFILE_IDS_V1,
  resolveMainWireArterialCompliancePhysiologyRuntimeV1,
  type MainWireArterialCompliancePhysiologyProfileIdV1,
  type MainWireArterialCompliancePhysiologyProfileV1,
} from "@/engine/myocardium/experiments/MainWireArterialCompliancePhysiologyBracketV1";
import type {
  MainWireNormalAdultFiveWallArterialCompliancePhysiologyResearchRunV1,
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";

export const MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_BRACKET_ANALYSIS_V1_ID =
  "main-wire-arterial-compliance-physiology-bracket-analysis-v1" as const;

export const MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_SOURCE_CONTEXT_V1 =
  Object.freeze({
    framinghamReferenceSample: Object.freeze({
      totalArterialComplianceMeanMlPerMmHg: 1.71,
      totalArterialComplianceStandardDeviationMlPerMmHg: 0.53,
      methodContext: "noninvasive-pressure-flow-analysis" as const,
      doi: "10.1161/CIRCULATIONAHA.110.937805" as const,
    }),
    land2017WholeOrganWindkessel: Object.freeze({
      complianceMlPerMmHg: 2.73,
      modelContext: "three-element-Windkessel" as const,
      doi: "10.1016/j.yjmcc.2017.03.008" as const,
    }),
    comparisonBoundary: Object.freeze({
      summedModelNodeTangentComplianceIsClinicalTac: false as const,
      strokeVolumeOverCentralPulsePressureIsExactCompliance: false as const,
      valuesUsedAsMagnitudeContextNotFitTargets: true as const,
    }),
  });

export type MainWireArterialCompliancePhysiologyBracketInputV1 = Readonly<{
  profile: MainWireArterialCompliancePhysiologyProfileV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
}>;

export type MainWireArterialCompliancePhysiologyArmV1 = Readonly<{
  profile: MainWireArterialCompliancePhysiologyProfileV1;
  protocolIdentityHash: string;
  arterialStiffness: number;
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  aorticPulsePressureMmHg: number;
  strokeVolumeOverAorticPulsePressureMlPerMmHg: number;
  tangentCompliance: MainWireArterialTangentComplianceReadbackV1;
  positiveAorticRootAccumulationVolumeMl: number;
  singlePeakMorphologyPreserved: boolean;
}>;

export type MainWireArterialCompliancePhysiologyBracketAnalysisV1 = Readonly<{
  methodId:
    typeof MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_BRACKET_ANALYSIS_V1_ID;
  arms: readonly MainWireArterialCompliancePhysiologyArmV1[];
  contrastsFromCanonical: readonly Readonly<{
    profileId: Exclude<
      MainWireArterialCompliancePhysiologyProfileIdV1,
      "canonical"
    >;
    ejectionTimeChangeSec: number;
    maximumFlowChangeMlPerSec: number;
    meanDopplerGradientChangeMmHg: number;
    peakDopplerGradientChangeMmHg: number;
    strokeVolumeChangeMl: number;
    meanAorticPressureChangeMmHg: number;
    pulsePressureChangeMmHg: number;
    rootAccumulationChangeMl: number;
  }>[];
  allRunsPeriod1AndIntegrated: boolean;
  morphologyPreservedAcrossBracket: boolean;
  ejectionTimeStrictlyIncreasesWithStiffness: boolean;
  maximumFlowStrictlyDecreasesWithStiffness: boolean;
  summedMeanTangentComplianceStrictlyDecreasesWithStiffness: boolean;
  sourceContext:
    typeof MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_SOURCE_CONTEXT_V1;
  claim: typeof MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_BRACKET_CLAIM_V1;
}>;

export function measureMainWireArterialCompliancePhysiologyBracketV1(
  inputs:
    readonly MainWireArterialCompliancePhysiologyBracketInputV1[],
): MainWireArterialCompliancePhysiologyBracketAnalysisV1 {
  const byId = new Map<
    MainWireArterialCompliancePhysiologyProfileIdV1,
    MainWireArterialCompliancePhysiologyBracketInputV1
  >();
  for (const input of inputs) {
    if (byId.has(input.profile.profileId)) {
      throw new Error(
        `duplicate arterial compliance physiology profile: ${input.profile.profileId}`,
      );
    }
    byId.set(input.profile.profileId, input);
  }
  for (const profileId of
    MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_PROFILE_IDS_V1) {
    if (!byId.has(profileId)) {
      throw new Error(
        `missing arterial compliance physiology profile: ${profileId}`,
      );
    }
  }
  if (
    byId.size
      !== MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_PROFILE_IDS_V1.length
  ) {
    throw new Error(
      "arterial compliance physiology bracket requires its fixed profile set",
    );
  }
  const canonicalResult = byId.get("canonical")!.periodicResult;
  const arms = Object.freeze(
    MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_PROFILE_IDS_V1.map(
      (profileId) => measureArm(byId.get(profileId)!, canonicalResult),
    ),
  );
  const canonical = arms[0]!;
  const contrastsFromCanonical = Object.freeze(arms.slice(1).map((arm) =>
    Object.freeze({
      profileId: arm.profile.profileId as Exclude<
        MainWireArterialCompliancePhysiologyProfileIdV1,
        "canonical"
      >,
      ejectionTimeChangeSec:
        arm.cycle.aorticEjectionTimeProxySec
        - canonical.cycle.aorticEjectionTimeProxySec,
      maximumFlowChangeMlPerSec:
        arm.cycle.aorticMaximumFlowMlPerSec
        - canonical.cycle.aorticMaximumFlowMlPerSec,
      meanDopplerGradientChangeMmHg:
        arm.cycle.meanDopplerGradientMmHg
        - canonical.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientChangeMmHg:
        arm.cycle.peakDopplerGradientMmHg
        - canonical.cycle.peakDopplerGradientMmHg,
      strokeVolumeChangeMl:
        arm.cycle.aorticForwardVolumeMl
        - canonical.cycle.aorticForwardVolumeMl,
      meanAorticPressureChangeMmHg:
        arm.cycle.meanAorticAbsolutePressureMmHg
        - canonical.cycle.meanAorticAbsolutePressureMmHg,
      pulsePressureChangeMmHg:
        arm.aorticPulsePressureMmHg - canonical.aorticPulsePressureMmHg,
      rootAccumulationChangeMl:
        arm.positiveAorticRootAccumulationVolumeMl
        - canonical.positiveAorticRootAccumulationVolumeMl,
    })));
  return Object.freeze({
    methodId:
      MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_BRACKET_ANALYSIS_V1_ID,
    arms,
    contrastsFromCanonical,
    allRunsPeriod1AndIntegrated: arms.every((arm) =>
      arm.cycle.periodicSteadyStateClaimed
      && arm.cycle.integrationCompletedWithoutFailure),
    morphologyPreservedAcrossBracket:
      arms.every((arm) => arm.singlePeakMorphologyPreserved),
    ejectionTimeStrictlyIncreasesWithStiffness:
      strictlyIncreases(arms.map((arm) =>
        arm.cycle.aorticEjectionTimeProxySec)),
    maximumFlowStrictlyDecreasesWithStiffness:
      strictlyDecreases(arms.map((arm) =>
        arm.cycle.aorticMaximumFlowMlPerSec)),
    summedMeanTangentComplianceStrictlyDecreasesWithStiffness:
      strictlyDecreases(arms.map((arm) =>
        arm.tangentCompliance.summedAllThreeArterialNodes
          .arithmeticMeanMlPerMmHg)),
    sourceContext:
      MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_SOURCE_CONTEXT_V1,
    claim: MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_BRACKET_CLAIM_V1,
  });
}

function measureArm(
  input: MainWireArterialCompliancePhysiologyBracketInputV1,
  canonicalResult: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireArterialCompliancePhysiologyArmV1 {
  assertSharedNonRuntimeProtocol(
    input.profile.profileId,
    input.periodicResult,
    canonicalResult,
  );
  const runtime = resolveMainWireArterialCompliancePhysiologyRuntimeV1(
    input.profile.profileId,
  );
  const expectedRuntimeHash = stableHash(sanitizeForStableHash(runtime));
  if (
    input.periodicResult.protocolComponentHashes.circulationRuntimeStableHash
      !== expectedRuntimeHash
  ) {
    throw new Error(
      `${input.profile.profileId} result does not match fixed runtime`,
    );
  }
  const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    input.periodicResult,
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    input.profile.profileId,
  );
  const aorticPulsePressureMmHg =
    cycle.maximumAorticRootPressureMmHg
    - cycle.minimumAorticRootPressureMmHg;
  return Object.freeze({
    profile: input.profile,
    protocolIdentityHash: input.periodicResult.protocolIdentityHash,
    arterialStiffness: runtime.vascular.arterialStiffness
      * (runtime.vascular.systemicArterialStiffnessScaleFromGlobal ?? 1),
    cycle,
    aorticPulsePressureMmHg,
    strokeVolumeOverAorticPulsePressureMlPerMmHg:
      cycle.aorticForwardVolumeMl / aorticPulsePressureMmHg,
    tangentCompliance: measureMainWireArterialTangentComplianceReadbackV1(
      input.periodicResult,
      runtime.vascular,
    ),
    positiveAorticRootAccumulationVolumeMl:
      cycle.aorticPressureFlowCoupling.summary.aorticRootStorage
        .positiveAccumulationVolumeDuringEjectionMl,
    singlePeakMorphologyPreserved:
      cycle.aorticFlowPeakCountAboveFivePercent === 1,
  });
}

function assertSharedNonRuntimeProtocol(
  profileId: MainWireArterialCompliancePhysiologyProfileIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  baseline: MainWireNormalAdultFiveWallPeriodicResultV1,
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
        !== baseline.protocolComponentHashes[key]
    ) {
      throw new Error(`${profileId} protocol mismatch outside runtime: ${key}`);
    }
  }
}

function strictlyIncreases(values: readonly number[]): boolean {
  return values.every((value, index) =>
    index === 0 || value > values[index - 1]!);
}

function strictlyDecreases(values: readonly number[]): boolean {
  return values.every((value, index) =>
    index === 0 || value < values[index - 1]!);
}

export function inputsFromMainWireArterialCompliancePhysiologyRunsV1(
  runs:
    readonly MainWireNormalAdultFiveWallArterialCompliancePhysiologyResearchRunV1[],
): readonly MainWireArterialCompliancePhysiologyBracketInputV1[] {
  return Object.freeze(runs.map((run) => Object.freeze({
    profile: run.profile,
    periodicResult: run.periodicResult,
  })));
}
