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
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOAD_CONTEXT_IDS_V1,
  resolveMainWireAorticOutflowEjectionTimingCandidateV1,
  resolveMainWireAorticOutflowEjectionTimingLoadContextV1,
  type MainWireAorticOutflowEjectionTimingCandidateIdV1,
  type MainWireAorticOutflowEjectionTimingCandidateV1,
  type MainWireAorticOutflowEjectionTimingLoadContextIdV1,
  type MainWireAorticOutflowEjectionTimingLoadContextV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowEjectionTimingCandidateLoadEnvelopeV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  createFixedResearchMainWireNormalAdultFiveWallProviderV1,
  resolveMainWireNormalAdultVentricularMaterialResearchPointV1,
  type MainWireNormalAdultVentricularMaterialResearchPointV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_LOAD_ENVELOPE_ANALYSIS_V1_ID =
  "main-wire-aortic-outflow-ejection-timing-candidate-load-envelope-analysis-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    design: "paired-canonical-comparator-at-seven-fixed-load-contexts" as const,
    primaryEndpoint:
      "one-percent-peak-flow-thresholded-aortic-ejection-time" as const,
    normalIntervalsUsedAsDescriptiveFalsificationScreens: true as const,
    exactFrameMutation: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterOptimizationOrFitApplied: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowEjectionTimingCandidateLoadInputV1 =
  Readonly<{
    candidateId: MainWireAorticOutflowEjectionTimingCandidateIdV1;
    contextId: MainWireAorticOutflowEjectionTimingLoadContextIdV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  }>;

export type MainWireAorticOutflowEjectionTimingCandidateLoadArmV1 =
  Readonly<{
    candidate: MainWireAorticOutflowEjectionTimingCandidateV1;
    context: MainWireAorticOutflowEjectionTimingLoadContextV1;
    materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
    protocolIdentityHash: string;
    cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
    meanRightAtrialAbsolutePressureMmHg: number;
    meanLeftAtrialAbsolutePressureMmHg: number;
    lvfwActiveStressDistinctPeakCountAboveFivePercent: number;
    morphologyPreserved: boolean;
    relativeAorticForwardVolumeChangeFromContextCanonical: number;
    relativeMeanAorticPressureChangeFromContextCanonical: number;
  }>;

type NumericRangeV1 = Readonly<{ minimum: number; maximum: number }>;

export type MainWireAorticOutflowEjectionTimingCandidateLoadEnvelopeV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_LOAD_ENVELOPE_ANALYSIS_V1_ID;
    arms: readonly MainWireAorticOutflowEjectionTimingCandidateLoadArmV1[];
    candidateEnvelope: Readonly<{
      ejectionTimeSec: NumericRangeV1;
      accelerationTimeSec: NumericRangeV1;
      peakVenaContractaVelocityMPerSec: NumericRangeV1;
      meanDopplerGradientMmHg: NumericRangeV1;
      peakDopplerGradientMmHg: NumericRangeV1;
      aorticForwardVolumeMl: NumericRangeV1;
      meanAorticPressureMmHg: NumericRangeV1;
      meanRightAtrialPressureMmHg: NumericRangeV1;
      meanLeftAtrialPressureMmHg: NumericRangeV1;
      leftVentricularEjectionFraction01: NumericRangeV1;
      allRunsPeriod1AndIntegrated: boolean;
      morphologyPreservedAcrossEnvelope: boolean;
      ejectionTimeWithinHealthyComparisonIntervalAcrossEnvelope: boolean;
      peakVelocityWithinHealthyComparisonIntervalAcrossEnvelope: boolean;
      meanGradientWithinHealthyComparisonIntervalAcrossEnvelope: boolean;
      accelerationTimeWithinHealthyComparisonIntervalAcrossEnvelope: boolean;
      maximumAbsoluteRelativeAorticForwardVolumeChangeFromContextCanonical:
        number;
      maximumAbsoluteRelativeMeanAorticPressureChangeFromContextCanonical:
        number;
    }>;
    allProtocolIdentitiesDistinct: boolean;
    claim:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1;
  }>;

export function measureMainWireAorticOutflowEjectionTimingCandidateLoadEnvelopeV1(
  inputs: readonly MainWireAorticOutflowEjectionTimingCandidateLoadInputV1[],
): MainWireAorticOutflowEjectionTimingCandidateLoadEnvelopeV1 {
  const byKey = new Map<string, MainWireNormalAdultFiveWallPeriodicResultV1>();
  for (const input of inputs) {
    const key = armKey(input.contextId, input.candidateId);
    if (byKey.has(key)) throw new Error(`duplicate ET candidate-load arm: ${key}`);
    byKey.set(key, input.periodicResult);
  }
  const expectedCount =
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOAD_CONTEXT_IDS_V1.length
    * MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_IDS_V1.length;
  for (const contextId of
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOAD_CONTEXT_IDS_V1) {
    for (const candidateId of
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_IDS_V1) {
      const key = armKey(contextId, candidateId);
      if (!byKey.has(key)) throw new Error(`missing ET candidate-load arm: ${key}`);
    }
  }
  if (byKey.size !== expectedCount) {
    throw new Error(`ET candidate-load envelope accepts exactly ${expectedCount} arms`);
  }
  assertPairedProtocolAxes(byKey);

  const arms: MainWireAorticOutflowEjectionTimingCandidateLoadArmV1[] = [];
  for (const contextId of
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOAD_CONTEXT_IDS_V1) {
    const canonicalResult = byKey.get(armKey(contextId, "canonical"))!;
    const canonicalCycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
      canonicalResult,
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      `${contextId}-canonical`,
    );
    for (const candidateId of
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_IDS_V1) {
      const result = byKey.get(armKey(contextId, candidateId))!;
      const cycle = candidateId === "canonical"
        ? canonicalCycle
        : measureMainWireAorticOutflowCalciumWaveformCycleV1(
          result,
          FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
          `${contextId}-${candidateId}`,
        );
      arms.push(measureArm(
        contextId,
        candidateId,
        result,
        cycle,
        canonicalCycle,
      ));
    }
  }
  const frozenArms = Object.freeze(arms);
  const candidateArms = frozenArms.filter((arm) =>
    arm.candidate.candidateId
      === "velocity-distortion-threefold-tref-three-halves");
  const reference = MAIN_WIRE_AORTIC_OUTFLOW_EXTERNAL_REFERENCE_CONTEXT_V1;
  const etInterval = reference.leftVentricularEjectionTime.comparisonIntervalSec;
  const velocityInterval = reference.waseHealthyAdultAorticValve.peakVelocity
    .comparisonIntervalMPerSec;
  const gradientInterval = reference.waseHealthyAdultAorticValve.meanGradient
    .comparisonIntervalMmHg;
  const accelerationInterval = reference.waseHealthyAdultAorticValve
    .accelerationTime.comparisonIntervalSec;
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_LOAD_ENVELOPE_ANALYSIS_V1_ID,
    arms: frozenArms,
    candidateEnvelope: Object.freeze({
      ejectionTimeSec: range(candidateArms.map((arm) =>
        arm.cycle.aorticEjectionTimeProxySec)),
      accelerationTimeSec: range(candidateArms.map((arm) =>
        arm.cycle.timeFromAorticFlowOnsetToPeakSec)),
      peakVenaContractaVelocityMPerSec: range(candidateArms.map((arm) =>
        arm.cycle.peakVenaContractaVelocityMPerSec)),
      meanDopplerGradientMmHg: range(candidateArms.map((arm) =>
        arm.cycle.meanDopplerGradientMmHg)),
      peakDopplerGradientMmHg: range(candidateArms.map((arm) =>
        arm.cycle.peakDopplerGradientMmHg)),
      aorticForwardVolumeMl: range(candidateArms.map((arm) =>
        arm.cycle.aorticForwardVolumeMl)),
      meanAorticPressureMmHg: range(candidateArms.map((arm) =>
        arm.cycle.meanAorticAbsolutePressureMmHg)),
      meanRightAtrialPressureMmHg: range(candidateArms.map((arm) =>
        arm.meanRightAtrialAbsolutePressureMmHg)),
      meanLeftAtrialPressureMmHg: range(candidateArms.map((arm) =>
        arm.meanLeftAtrialAbsolutePressureMmHg)),
      leftVentricularEjectionFraction01: range(candidateArms.map((arm) =>
        arm.cycle.leftVentricularEjectionFraction01)),
      allRunsPeriod1AndIntegrated: candidateArms.every((arm) =>
        arm.cycle.periodicSteadyStateClaimed
        && arm.cycle.integrationCompletedWithoutFailure),
      morphologyPreservedAcrossEnvelope:
        candidateArms.every((arm) => arm.morphologyPreserved),
      ejectionTimeWithinHealthyComparisonIntervalAcrossEnvelope:
        candidateArms.every((arm) => within(
          arm.cycle.aorticEjectionTimeProxySec,
          etInterval,
        )),
      peakVelocityWithinHealthyComparisonIntervalAcrossEnvelope:
        candidateArms.every((arm) => within(
          arm.cycle.peakVenaContractaVelocityMPerSec,
          velocityInterval,
        )),
      meanGradientWithinHealthyComparisonIntervalAcrossEnvelope:
        candidateArms.every((arm) => within(
          arm.cycle.meanDopplerGradientMmHg,
          gradientInterval,
        )),
      accelerationTimeWithinHealthyComparisonIntervalAcrossEnvelope:
        candidateArms.every((arm) => within(
          arm.cycle.timeFromAorticFlowOnsetToPeakSec,
          accelerationInterval,
        )),
      maximumAbsoluteRelativeAorticForwardVolumeChangeFromContextCanonical:
        Math.max(...candidateArms.map((arm) =>
          arm.relativeAorticForwardVolumeChangeFromContextCanonical)),
      maximumAbsoluteRelativeMeanAorticPressureChangeFromContextCanonical:
        Math.max(...candidateArms.map((arm) =>
          arm.relativeMeanAorticPressureChangeFromContextCanonical)),
    }),
    allProtocolIdentitiesDistinct:
      new Set(frozenArms.map((arm) => arm.protocolIdentityHash)).size
        === expectedCount,
    claim:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1,
  });
}

function measureArm(
  contextId: MainWireAorticOutflowEjectionTimingLoadContextIdV1,
  candidateId: MainWireAorticOutflowEjectionTimingCandidateIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
  canonicalCycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
): MainWireAorticOutflowEjectionTimingCandidateLoadArmV1 {
  const candidate = resolveMainWireAorticOutflowEjectionTimingCandidateV1(
    candidateId,
  );
  const context = resolveMainWireAorticOutflowEjectionTimingLoadContextV1(
    contextId,
  );
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      candidate.ventricularMaterialPointId,
    );
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    candidate.ventricularMaterialPointId,
  );
  if (
    result.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== provider.parameterIdentityHash
  ) throw new Error(`${contextId}/${candidateId} provider identity mismatch`);
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length < 3) {
    throw new Error(`${contextId}/${candidateId} requires a complete beat`);
  }
  const stressPeaks = measureMainWireAorticOutflowMechanismStressPeaksV1(
    beat.samples.map((sample) => Math.max(0, sample.wallStressPa.LVFW.active)),
    beat.samples.map((sample) => sample.cyclePhase01),
  ).filter((peak) => peak.distinctAtFixedProminence);
  const morphologyPreserved = stressPeaks.length === 1
    && cycle.aorticFlowPeakCountAboveFivePercent === 1;
  return Object.freeze({
    candidate,
    context,
    materialPoint,
    protocolIdentityHash: result.protocolIdentityHash,
    cycle,
    meanRightAtrialAbsolutePressureMmHg: mean(beat.samples.map((sample) =>
      sample.circulationNodeAbsolutePressureMmHg.RA)),
    meanLeftAtrialAbsolutePressureMmHg: mean(beat.samples.map((sample) =>
      sample.circulationNodeAbsolutePressureMmHg.LA)),
    lvfwActiveStressDistinctPeakCountAboveFivePercent: stressPeaks.length,
    morphologyPreserved,
    relativeAorticForwardVolumeChangeFromContextCanonical: relativeChange(
      cycle.aorticForwardVolumeMl,
      canonicalCycle.aorticForwardVolumeMl,
    ),
    relativeMeanAorticPressureChangeFromContextCanonical: relativeChange(
      cycle.meanAorticAbsolutePressureMmHg,
      canonicalCycle.meanAorticAbsolutePressureMmHg,
    ),
  });
}

function assertPairedProtocolAxes(
  byKey: ReadonlyMap<string, MainWireNormalAdultFiveWallPeriodicResultV1>,
): void {
  for (const contextId of
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOAD_CONTEXT_IDS_V1) {
    const results = MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_IDS_V1
      .map((candidateId) => byKey.get(armKey(contextId, candidateId))!);
    for (const key of [
      "calciumDriveFixedParamsStableHash",
      "circulationTopologyGraphStableHash",
      "circulationRuntimeStableHash",
      "bloodVolumeOperatingPointStableHash",
      "commonPericardiumStableHash",
      "periodicPolicyStableHash",
    ] as const) {
      if (new Set(results.map((result) =>
        result.protocolComponentHashes[key])).size !== 1) {
        throw new Error(`${contextId} ET candidate pairing changed ${key}`);
      }
    }
    if (new Set(results.map((result) => result.protocolComponentHashes
      .mechanicsProviderMetadataStableHash)).size !== results.length) {
      throw new Error(`${contextId} ET candidate mechanics identities not distinct`);
    }
  }
}

function armKey(
  contextId: MainWireAorticOutflowEjectionTimingLoadContextIdV1,
  candidateId: MainWireAorticOutflowEjectionTimingCandidateIdV1,
): string {
  return `${contextId}::${candidateId}`;
}

function range(values: readonly number[]): NumericRangeV1 {
  if (values.length === 0) throw new Error("range requires values");
  return Object.freeze({ minimum: Math.min(...values), maximum: Math.max(...values) });
}

function within(value: number, interval: readonly [number, number]): boolean {
  return value >= interval[0] && value <= interval[1];
}

function mean(values: readonly number[]): number {
  if (values.length === 0) throw new Error("mean requires values");
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function relativeChange(value: number, reference: number): number {
  return Math.abs(value - reference) / Math.max(Math.abs(reference), 1e-12);
}
