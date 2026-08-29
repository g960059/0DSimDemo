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
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_ARM_IDS_V1,
  resolveMainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmV1,
  type MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmIdV1,
  type MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowEjectionTimingLocalInertanceInteractionV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  createFixedResearchMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  resolveMainWireAorticValveLocalInertanceProfileV1,
  resolveMainWireAorticValveLocalInertanceValueV1,
} from "@/engine/valves/MainWireAorticValveLocalInertanceAblationV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_ANALYSIS_V1_ID =
  "main-wire-aortic-outflow-ejection-timing-local-inertance-interaction-analysis-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_ANALYSIS_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    design: "two-fixed-mechanics-by-three-fixed-local-inertance-levels" as const,
    primaryQuestion:
      "whether-the-ET-candidate-removes-the-prior-local-inertance-morphology-failure" as const,
    ejectionAndAccelerationTiming:
      "one-percent-peak-flow-thresholded-accepted-samples" as const,
    morphology:
      "one-strict-flow-peak-and-one-prominent-LVFW-active-stress-peak" as const,
    normalIntervalsUsedAsDescriptiveFalsificationScreens: true as const,
    exactFrameMutation: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterOptimizationOrFitApplied: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowEjectionTimingLocalInertanceInteractionInputV1 =
  Readonly<{
    armId:
      MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmIdV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  }>;

export type MainWireAorticOutflowEjectionTimingLocalInertanceInteractionMeasuredArmV1 =
  Readonly<{
    arm: MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmV1;
    protocolIdentityHash: string;
    localInertanceMmHgSec2PerMl: number;
    cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
    lvfwActiveStressDistinctPeakCountAboveFivePercent: number;
    morphologyPreserved: boolean;
    etWithinReference: boolean;
    atWithinReference: boolean;
    peakVelocityWithinReference: boolean;
    meanGradientWithinReference: boolean;
    allPrimaryScreensPassed: boolean;
  }>;

export type MainWireAorticOutflowEjectionTimingLocalInertanceInteractionV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_ANALYSIS_V1_ID;
    arms:
      readonly MainWireAorticOutflowEjectionTimingLocalInertanceInteractionMeasuredArmV1[];
    allProtocolIdentitiesDistinct: boolean;
    priorCanonicalPhysicalInertanceFailureReproduced: boolean;
    etCandidatePhysicalInertanceInteraction: Readonly<{
      morphologyPreserved: boolean;
      allPrimaryScreensPassed: boolean;
      accelerationTimeGainFromCandidateWithoutInertanceSec: number;
      ejectionTimeGainFromCandidateWithoutInertanceSec: number;
      peakGradientChangeFromCandidateWithoutInertanceMmHg: number;
    }>;
    claim:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_ANALYSIS_CLAIM_V1;
  }>;

export function measureMainWireAorticOutflowEjectionTimingLocalInertanceInteractionV1(
  inputs:
    readonly MainWireAorticOutflowEjectionTimingLocalInertanceInteractionInputV1[],
): MainWireAorticOutflowEjectionTimingLocalInertanceInteractionV1 {
  const byId = new Map<
    MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >();
  for (const input of inputs) {
    if (byId.has(input.armId)) {
      throw new Error(`duplicate ET/local-inertance arm: ${input.armId}`);
    }
    byId.set(input.armId, input.periodicResult);
  }
  for (const armId of
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_ARM_IDS_V1) {
    if (!byId.has(armId)) {
      throw new Error(`missing ET/local-inertance arm: ${armId}`);
    }
  }
  if (
    byId.size
      !== MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_ARM_IDS_V1.length
  ) throw new Error("ET/local-inertance interaction accepts exactly six arms");

  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_ARM_IDS_V1
      .map((armId) => measureArm(armId, byId.get(armId)!)),
  );
  const byMeasuredId = new Map(arms.map((arm) => [arm.arm.armId, arm]));
  const canonicalPhysical = byMeasuredId.get("physical-local-inertance-7cm")!;
  const candidateOff = byMeasuredId.get("et-candidate")!;
  const candidatePhysical = byMeasuredId.get(
    "et-candidate-plus-physical-local-inertance-7cm",
  )!;
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_ANALYSIS_V1_ID,
    arms,
    allProtocolIdentitiesDistinct:
      new Set(arms.map((arm) => arm.protocolIdentityHash)).size === arms.length,
    priorCanonicalPhysicalInertanceFailureReproduced:
      !canonicalPhysical.morphologyPreserved
      || !canonicalPhysical.peakVelocityWithinReference
      || !canonicalPhysical.meanGradientWithinReference,
    etCandidatePhysicalInertanceInteraction: Object.freeze({
      morphologyPreserved: candidatePhysical.morphologyPreserved,
      allPrimaryScreensPassed: candidatePhysical.allPrimaryScreensPassed,
      accelerationTimeGainFromCandidateWithoutInertanceSec:
        candidatePhysical.cycle.timeFromAorticFlowOnsetToPeakSec
        - candidateOff.cycle.timeFromAorticFlowOnsetToPeakSec,
      ejectionTimeGainFromCandidateWithoutInertanceSec:
        candidatePhysical.cycle.aorticEjectionTimeProxySec
        - candidateOff.cycle.aorticEjectionTimeProxySec,
      peakGradientChangeFromCandidateWithoutInertanceMmHg:
        candidatePhysical.cycle.peakDopplerGradientMmHg
        - candidateOff.cycle.peakDopplerGradientMmHg,
    }),
    claim:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_ANALYSIS_CLAIM_V1,
  });
}

function measureArm(
  armId: MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireAorticOutflowEjectionTimingLocalInertanceInteractionMeasuredArmV1 {
  const arm =
    resolveMainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmV1(
      armId,
    );
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    arm.ventricularMaterialPointId,
  );
  if (
    result.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== provider.parameterIdentityHash
  ) throw new Error(`${armId} mechanics provider identity mismatch`);
  const audit = result.aorticValveLocalInertanceResearchAudit ?? null;
  if ((arm.localInertanceProfileId === null) !== (audit === null)) {
    throw new Error(`${armId} local-inertance audit mismatch`);
  }
  if (
    arm.localInertanceProfileId !== null
    && audit?.profileId !== arm.localInertanceProfileId
  ) throw new Error(`${armId} local-inertance profile identity mismatch`);
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length < 3) {
    throw new Error(`${armId} requires a retained complete beat`);
  }
  const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    result,
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    armId,
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
  const atWithinReference = within(
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
    localInertanceMmHgSec2PerMl: resolveLocalInertance(arm, result),
    cycle,
    lvfwActiveStressDistinctPeakCountAboveFivePercent: stressPeakCount,
    morphologyPreserved,
    etWithinReference,
    atWithinReference,
    peakVelocityWithinReference,
    meanGradientWithinReference,
    allPrimaryScreensPassed:
      cycle.periodicSteadyStateClaimed
      && cycle.integrationCompletedWithoutFailure
      && morphologyPreserved
      && etWithinReference
      && atWithinReference
      && peakVelocityWithinReference
      && meanGradientWithinReference,
  });
}

function resolveLocalInertance(
  arm: MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): number {
  if (arm.localInertanceProfileId === null) return 0;
  const topologyAoV = result.protocolIdentity.circulation.topologyGraphSnapshot
    .edges.find((edge) => edge.name === "AoV");
  if (
    topologyAoV === undefined
    || topologyAoV.kind !== "valve"
    || !(topologyAoV.L !== undefined && topologyAoV.L > 0)
  ) throw new Error(`${arm.armId} requires positive topology AoV L`);
  return resolveMainWireAorticValveLocalInertanceValueV1(
    resolveMainWireAorticValveLocalInertanceProfileV1(
      arm.localInertanceProfileId,
    ),
    topologyAoV.L,
  );
}

function within(value: number, interval: readonly [number, number]): boolean {
  return value >= interval[0] && value <= interval[1];
}
