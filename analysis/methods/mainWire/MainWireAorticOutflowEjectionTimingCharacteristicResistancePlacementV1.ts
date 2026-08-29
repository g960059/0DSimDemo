import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_EXTERNAL_REFERENCE_CONTEXT_V1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowExternalReferenceCompatibilityV1";
import {
  measureMainWireAorticOutflowMechanismStressPeaksV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowMechanismCandidateLoadEnvelopeV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_ARM_IDS_V1,
  resolveMainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmV1,
  type MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmIdV1,
  type MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  createFixedResearchMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  validateMainWireAorticCharacteristicResistancePlacementProfileV1,
  type MainWireAorticCharacteristicResistancePlacementProfileV1,
} from "@/engine/valves/MainWireAorticCharacteristicResistancePlacementV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_ANALYSIS_V1_ID =
  "main-wire-aortic-outflow-ejection-timing-characteristic-resistance-placement-analysis-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_ANALYSIS_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    design:
      "two-fixed-mechanics-by-three-fixed-characteristic-resistance-placements" as const,
    primaryQuestion:
      "whether-moving-existing-proximal-resistance-ahead-of-root-compliance-delays-early-flow-peak-without-losing-normal-ET-and-gradient" as const,
    resistanceAccounting:
      "AoV-background-linear-R-plus-Ao-SA-topology-linear-R" as const,
    topologyResistanceSumExpectedPreservedExactly: true as const,
    pulsatileEquivalenceClaimed: false as const,
    ejectionAndAccelerationTiming:
      "one-percent-peak-flow-thresholded-accepted-samples" as const,
    accelerationTimeIsModelFlowProxyNotClinicalDopplerEnvelope: true as const,
    morphology:
      "one-strict-flow-peak-and-one-prominent-LVFW-active-stress-peak" as const,
    ETIsPrimaryAtThisStage: true as const,
    normalIntervalsUsedAsDescriptiveFalsificationScreens: true as const,
    exactFrameMutation: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterOptimizationOrFitApplied: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementInputV1 =
  Readonly<{
    armId:
      MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmIdV1;
    placementProfile:
      MainWireAorticCharacteristicResistancePlacementProfileV1 | null;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  }>;

export type MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementMeasuredArmV1 =
  Readonly<{
    arm:
      MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmV1;
    protocolIdentityHash: string;
    placementProfile:
      MainWireAorticCharacteristicResistancePlacementProfileV1 | null;
    sourceAorticValveLinearResistanceMmHgSecPerMl: number;
    sourceAoSaLinearResistanceMmHgSecPerMl: number;
    resolvedAorticValveLinearResistanceMmHgSecPerMl: number;
    resolvedAoSaLinearResistanceMmHgSecPerMl: number;
    sourceLinearResistanceSumMmHgSecPerMl: number;
    resolvedLinearResistanceSumMmHgSecPerMl: number;
    linearResistanceSumResidualMmHgSecPerMl: number;
    cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
    lvfwActiveStressDistinctPeakCountAboveFivePercent: number;
    morphologyPreserved: boolean;
    etWithinReference: boolean;
    atProxyWithinReference: boolean;
    peakVelocityWithinReference: boolean;
    meanGradientWithinReference: boolean;
    retainedForEtPriority: boolean;
  }>;

export type MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementContrastV1 =
  Readonly<{
    armId:
      MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmIdV1;
    referenceArmId: "canonical" | "et-candidate";
    movedFraction01: number;
    ejectionTimeChangeSec: number;
    accelerationTimeProxyChangeSec: number;
    peakFlowChangeMlPerSec: number;
    peakVelocityChangeMPerSec: number;
    meanGradientChangeMmHg: number;
    peakGradientChangeMmHg: number;
    strokeVolumeChangeMl: number;
    meanAorticPressureChangeMmHg: number;
    retainedForEtPriority: boolean;
    atProxyImproved: boolean;
  }>;

export type MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_ANALYSIS_V1_ID;
    arms:
      readonly MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementMeasuredArmV1[];
    contrastsFromSameMechanicsCanonicalPlacement:
      readonly MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementContrastV1[];
    allProtocolIdentitiesDistinct: boolean;
    allRunsPeriod1Integrated: boolean;
    allLinearResistanceSumsPreservedWithinRoundoff: boolean;
    anyPlacementRetainedForEtPriorityAndImprovesAtProxy: boolean;
    claim:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_ANALYSIS_CLAIM_V1;
  }>;

export function measureMainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementV1(
  inputs:
    readonly MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementInputV1[],
): MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementV1 {
  const byId = new Map<
    MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmIdV1,
    MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementInputV1
  >();
  for (const input of inputs) {
    if (byId.has(input.armId)) {
      throw new Error(
        `duplicate ET/characteristic-resistance placement arm: ${input.armId}`,
      );
    }
    byId.set(input.armId, input);
  }
  for (const armId of
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_ARM_IDS_V1) {
    if (!byId.has(armId)) {
      throw new Error(
        `missing ET/characteristic-resistance placement arm: ${armId}`,
      );
    }
  }
  if (
    byId.size
      !== MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_ARM_IDS_V1.length
  ) {
    throw new Error(
      "ET/characteristic-resistance placement accepts exactly six arms",
    );
  }
  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_ARM_IDS_V1
      .map((armId) => measureArm(byId.get(armId)!)),
  );
  const measuredById = new Map(arms.map((arm) => [arm.arm.armId, arm]));
  const contrasts = Object.freeze(arms
    .filter((arm) => arm.arm.placementFactor !== "canonical")
    .map((arm) => {
      const referenceArmId = arm.arm.mechanicsFactor === "canonical"
        ? "canonical" as const
        : "et-candidate" as const;
      const reference = measuredById.get(referenceArmId)!;
      return Object.freeze({
        armId: arm.arm.armId,
        referenceArmId,
        movedFraction01:
          arm.placementProfile!
            .fractionMovedUpstreamOfAorticRootCompliance01,
        ejectionTimeChangeSec:
          arm.cycle.aorticEjectionTimeProxySec
          - reference.cycle.aorticEjectionTimeProxySec,
        accelerationTimeProxyChangeSec:
          arm.cycle.timeFromAorticFlowOnsetToPeakSec
          - reference.cycle.timeFromAorticFlowOnsetToPeakSec,
        peakFlowChangeMlPerSec:
          arm.cycle.aorticMaximumFlowMlPerSec
          - reference.cycle.aorticMaximumFlowMlPerSec,
        peakVelocityChangeMPerSec:
          arm.cycle.peakVenaContractaVelocityMPerSec
          - reference.cycle.peakVenaContractaVelocityMPerSec,
        meanGradientChangeMmHg:
          arm.cycle.meanDopplerGradientMmHg
          - reference.cycle.meanDopplerGradientMmHg,
        peakGradientChangeMmHg:
          arm.cycle.peakDopplerGradientMmHg
          - reference.cycle.peakDopplerGradientMmHg,
        strokeVolumeChangeMl:
          arm.cycle.aorticForwardVolumeMl
          - reference.cycle.aorticForwardVolumeMl,
        meanAorticPressureChangeMmHg:
          arm.cycle.meanAorticAbsolutePressureMmHg
          - reference.cycle.meanAorticAbsolutePressureMmHg,
        retainedForEtPriority: arm.retainedForEtPriority,
        atProxyImproved:
          arm.cycle.timeFromAorticFlowOnsetToPeakSec
          > reference.cycle.timeFromAorticFlowOnsetToPeakSec,
      });
    }));
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_ANALYSIS_V1_ID,
    arms,
    contrastsFromSameMechanicsCanonicalPlacement: contrasts,
    allProtocolIdentitiesDistinct:
      new Set(arms.map((arm) => arm.protocolIdentityHash)).size === arms.length,
    allRunsPeriod1Integrated: arms.every((arm) =>
      arm.cycle.periodicSteadyStateClaimed
      && arm.cycle.integrationCompletedWithoutFailure),
    allLinearResistanceSumsPreservedWithinRoundoff: arms.every((arm) =>
      Math.abs(arm.linearResistanceSumResidualMmHgSecPerMl) <= 1e-12),
    anyPlacementRetainedForEtPriorityAndImprovesAtProxy: contrasts.some(
      (contrast) => contrast.retainedForEtPriority && contrast.atProxyImproved,
    ),
    claim:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_ANALYSIS_CLAIM_V1,
  });
}

function measureArm(
  input:
    MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementInputV1,
): MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementMeasuredArmV1 {
  const arm =
    resolveMainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmV1(
      input.armId,
    );
  if ((arm.placementProfileId === null) !== (input.placementProfile === null)) {
    throw new Error(`${arm.armId} placement profile presence mismatch`);
  }
  if (input.placementProfile !== null) {
    const issues =
      validateMainWireAorticCharacteristicResistancePlacementProfileV1(
        input.placementProfile,
      );
    if (issues.length > 0) {
      throw new Error(`${arm.armId} invalid placement profile: ${issues.join("; ")}`);
    }
    if (input.placementProfile.profileId !== arm.placementProfileId) {
      throw new Error(`${arm.armId} placement profile identity mismatch`);
    }
  }
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    arm.ventricularMaterialPointId,
  );
  const result = input.periodicResult;
  if (
    result.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== provider.parameterIdentityHash
  ) throw new Error(`${arm.armId} mechanics provider identity mismatch`);
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length < 3) {
    throw new Error(`${arm.armId} requires a retained complete beat`);
  }
  const topologyAoSa = result.protocolIdentity.circulation.topologyGraphSnapshot
    .edges.find((edge) => edge.name === "Ao_SA");
  if (
    topologyAoSa === undefined
    || topologyAoSa.kind !== "dynamic"
    || !(topologyAoSa.R > 0)
  ) throw new Error(`${arm.armId} requires positive topology Ao_SA R`);
  const sourceAorticValveLinearResistanceMmHgSecPerMl =
    result.valveResearchInput.valves.AoV
      .backgroundLinearResistanceMmHgSecPerMl;
  const sourceAoSaLinearResistanceMmHgSecPerMl = topologyAoSa.R;
  const resolvedAorticValveLinearResistanceMmHgSecPerMl =
    sourceAorticValveLinearResistanceMmHgSecPerMl
    + (input.placementProfile
      ?.upstreamValveLinearResistanceAdditionMmHgSecPerMl ?? 0);
  const resolvedAoSaLinearResistanceMmHgSecPerMl =
    sourceAoSaLinearResistanceMmHgSecPerMl
    * (input.placementProfile
      ?.downstreamDynamicEdgeResistanceScaleFromTopology ?? 1);
  const sourceLinearResistanceSumMmHgSecPerMl =
    sourceAorticValveLinearResistanceMmHgSecPerMl
    + sourceAoSaLinearResistanceMmHgSecPerMl;
  const resolvedLinearResistanceSumMmHgSecPerMl =
    resolvedAorticValveLinearResistanceMmHgSecPerMl
    + resolvedAoSaLinearResistanceMmHgSecPerMl;
  const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    result,
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    arm.armId,
  );
  const stressPeakCount = measureMainWireAorticOutflowMechanismStressPeaksV1(
    beat.samples.map((sample) => Math.max(0, sample.wallStressPa.LVFW.active)),
    beat.samples.map((sample) => sample.cyclePhase01),
  ).filter((peak) => peak.distinctAtFixedProminence).length;
  const reference = MAIN_WIRE_AORTIC_OUTFLOW_EXTERNAL_REFERENCE_CONTEXT_V1;
  const etWithinReference = within(
    cycle.aorticEjectionTimeProxySec,
    reference.leftVentricularEjectionTime.comparisonIntervalSec,
  );
  const atProxyWithinReference = within(
    cycle.timeFromAorticFlowOnsetToPeakSec,
    reference.waseHealthyAdultAorticValve.accelerationTime
      .comparisonIntervalSec,
  );
  const peakVelocityWithinReference = within(
    cycle.peakVenaContractaVelocityMPerSec,
    reference.waseHealthyAdultAorticValve.peakVelocity
      .comparisonIntervalMPerSec,
  );
  const meanGradientWithinReference = within(
    cycle.meanDopplerGradientMmHg,
    reference.waseHealthyAdultAorticValve.meanGradient
      .comparisonIntervalMmHg,
  );
  const morphologyPreserved =
    cycle.aorticFlowPeakCountAboveFivePercent === 1 && stressPeakCount === 1;
  return Object.freeze({
    arm,
    protocolIdentityHash: result.protocolIdentityHash,
    placementProfile: input.placementProfile,
    sourceAorticValveLinearResistanceMmHgSecPerMl,
    sourceAoSaLinearResistanceMmHgSecPerMl,
    resolvedAorticValveLinearResistanceMmHgSecPerMl,
    resolvedAoSaLinearResistanceMmHgSecPerMl,
    sourceLinearResistanceSumMmHgSecPerMl,
    resolvedLinearResistanceSumMmHgSecPerMl,
    linearResistanceSumResidualMmHgSecPerMl:
      resolvedLinearResistanceSumMmHgSecPerMl
      - sourceLinearResistanceSumMmHgSecPerMl,
    cycle,
    lvfwActiveStressDistinctPeakCountAboveFivePercent: stressPeakCount,
    morphologyPreserved,
    etWithinReference,
    atProxyWithinReference,
    peakVelocityWithinReference,
    meanGradientWithinReference,
    retainedForEtPriority:
      cycle.periodicSteadyStateClaimed
      && cycle.integrationCompletedWithoutFailure
      && morphologyPreserved
      && etWithinReference
      && peakVelocityWithinReference
      && meanGradientWithinReference,
  });
}

function within(value: number, interval: readonly [number, number]): boolean {
  return value >= interval[0] && value <= interval[1];
}
