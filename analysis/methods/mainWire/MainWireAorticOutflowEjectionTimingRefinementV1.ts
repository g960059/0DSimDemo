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
  measureMainWireVentricularLandIsometricTwitchAuditV1,
  type MainWireVentricularLandIsometricTwitchAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CANDIDATE_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CONTEXT_IDS_V1,
  resolveMainWireAorticOutflowEjectionTimingRefinementContextV1,
  type MainWireAorticOutflowEjectionTimingRefinementCandidateIdV1,
  type MainWireAorticOutflowEjectionTimingRefinementContextIdV1,
  type MainWireAorticOutflowEjectionTimingRefinementContextV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowEjectionTimingRefinementV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  createMainWireNormalAdultFiveWallProviderWithVentricularLandEtRefinementCandidateV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  resolveMainWireVentricularLandEtRefinementCandidateV1,
  resolveMainWireVentricularLandEtRefinementWallMaterialV1,
  type MainWireVentricularLandEtRefinementCandidateV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandEtRefinementCandidatesV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_ANALYSIS_V1_ID =
  "main-wire-aortic-outflow-ejection-timing-refinement-analysis-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_ANALYSIS_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    design: "fixed-eight-candidate-by-two-context-refinement" as const,
    selectionRule:
      "minimum-Aeff-noncanonical-candidate-passing-ET-velocity-gradient-periodicity-and-morphology-at-both-contexts" as const,
    isometricTimingMeasuredIndependentlyAtSourceRestingStretch: true as const,
    accelerationTimeReportedButExcludedFromEtFirstSelection: true as const,
    exactFrameMutation: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    continuousOptimizationApplied: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowEjectionTimingRefinementInputV1 = Readonly<{
  candidateId: MainWireAorticOutflowEjectionTimingRefinementCandidateIdV1;
  contextId: MainWireAorticOutflowEjectionTimingRefinementContextIdV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
}>;

export type MainWireAorticOutflowEjectionTimingRefinementArmV1 = Readonly<{
  candidate: MainWireVentricularLandEtRefinementCandidateV1;
  context: MainWireAorticOutflowEjectionTimingRefinementContextV1;
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  protocolIdentityHash: string;
  lvfwActiveStressDistinctPeakCountAboveFivePercent: number;
  morphologyPreserved: boolean;
  relativeAorticForwardVolumeChangeFromContextCanonical: number;
  relativeMeanAorticPressureChangeFromContextCanonical: number;
}>;

export type MainWireAorticOutflowEjectionTimingRefinementCandidateSummaryV1 =
  Readonly<{
    candidate: MainWireVentricularLandEtRefinementCandidateV1;
    isometricAtSourceRestingStretch:
      MainWireVentricularLandIsometricTwitchAuditV1;
    allRunsPeriod1AndIntegrated: boolean;
    morphologyPreservedAtBothContexts: boolean;
    ejectionTimeWithinReferenceAtBothContexts: boolean;
    peakVelocityWithinReferenceAtBothContexts: boolean;
    meanGradientWithinReferenceAtBothContexts: boolean;
    accelerationTimeWithinReferenceAtBothContexts: boolean;
    minimumEjectionTimeSec: number;
    maximumEjectionTimeSec: number;
    maximumAbsoluteRelativeAorticForwardVolumeChangeFromContextCanonical:
      number;
    maximumAbsoluteRelativeMeanAorticPressureChangeFromContextCanonical:
      number;
    etFirstSelectionPassed: boolean;
  }>;

export type MainWireAorticOutflowEjectionTimingRefinementV1 = Readonly<{
  methodId:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_ANALYSIS_V1_ID;
  arms: readonly MainWireAorticOutflowEjectionTimingRefinementArmV1[];
  candidateSummaries:
    readonly MainWireAorticOutflowEjectionTimingRefinementCandidateSummaryV1[];
  etFirstDecision: Readonly<{
    eligibleCandidateIds:
      readonly MainWireAorticOutflowEjectionTimingRefinementCandidateIdV1[];
    preferredMinimumAeffCandidateId:
      MainWireAorticOutflowEjectionTimingRefinementCandidateIdV1 | null;
    canonicalAdoptionEstablished: false;
  }>;
  allProtocolIdentitiesDistinct: boolean;
  claim:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_ANALYSIS_CLAIM_V1;
}>;

export function measureMainWireAorticOutflowEjectionTimingRefinementV1(
  inputs: readonly MainWireAorticOutflowEjectionTimingRefinementInputV1[],
): MainWireAorticOutflowEjectionTimingRefinementV1 {
  const byKey = new Map<string, MainWireNormalAdultFiveWallPeriodicResultV1>();
  for (const input of inputs) {
    const key = armKey(input.contextId, input.candidateId);
    if (byKey.has(key)) throw new Error(`duplicate ET refinement arm: ${key}`);
    byKey.set(key, input.periodicResult);
  }
  const expectedCount =
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CONTEXT_IDS_V1.length
    * MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CANDIDATE_IDS_V1.length;
  for (const contextId of
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CONTEXT_IDS_V1) {
    for (const candidateId of
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CANDIDATE_IDS_V1) {
      const key = armKey(contextId, candidateId);
      if (!byKey.has(key)) throw new Error(`missing ET refinement arm: ${key}`);
    }
  }
  if (byKey.size !== expectedCount) {
    throw new Error(`ET refinement accepts exactly ${expectedCount} arms`);
  }

  const arms: MainWireAorticOutflowEjectionTimingRefinementArmV1[] = [];
  for (const contextId of
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CONTEXT_IDS_V1) {
    const canonicalResult = byKey.get(armKey(contextId, "canonical"))!;
    const canonicalCycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
      canonicalResult,
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      `${contextId}-canonical`,
    );
    for (const candidateId of
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CANDIDATE_IDS_V1) {
      const result = byKey.get(armKey(contextId, candidateId))!;
      const cycle = candidateId === "canonical"
        ? canonicalCycle
        : measureMainWireAorticOutflowCalciumWaveformCycleV1(
          result,
          FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
          `${contextId}-${candidateId}`,
        );
      arms.push(measureArm(
        candidateId,
        contextId,
        result,
        cycle,
        canonicalCycle,
      ));
    }
  }
  const frozenArms = Object.freeze(arms);
  const dtSec = inputs[0]!.periodicResult.dtSec;
  if (!inputs.every((input) => input.periodicResult.dtSec === dtSec)) {
    throw new Error("ET refinement requires one common dt");
  }
  const candidateSummaries = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CANDIDATE_IDS_V1
      .map((candidateId) => summarizeCandidate(candidateId, frozenArms, dtSec)),
  );
  const eligible = candidateSummaries.filter((summary) =>
    summary.candidate.candidateId !== "canonical"
    && summary.etFirstSelectionPassed);
  const minimumAeff = eligible.length === 0
    ? null
    : Math.min(...eligible.map((summary) =>
      summary.candidate.aeffScaleFromBaseline));
  const preferred = minimumAeff === null
    ? null
    : eligible.find((summary) =>
      summary.candidate.aeffScaleFromBaseline === minimumAeff)!
      .candidate.candidateId;
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_ANALYSIS_V1_ID,
    arms: frozenArms,
    candidateSummaries,
    etFirstDecision: Object.freeze({
      eligibleCandidateIds: Object.freeze(eligible.map((summary) =>
        summary.candidate.candidateId)),
      preferredMinimumAeffCandidateId: preferred,
      canonicalAdoptionEstablished: false as const,
    }),
    allProtocolIdentitiesDistinct:
      new Set(frozenArms.map((arm) => arm.protocolIdentityHash)).size
        === expectedCount,
    claim:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_ANALYSIS_CLAIM_V1,
  });
}

function measureArm(
  candidateId: MainWireAorticOutflowEjectionTimingRefinementCandidateIdV1,
  contextId: MainWireAorticOutflowEjectionTimingRefinementContextIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
  canonicalCycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
): MainWireAorticOutflowEjectionTimingRefinementArmV1 {
  const candidate = resolveMainWireVentricularLandEtRefinementCandidateV1(
    candidateId,
  );
  const context = resolveMainWireAorticOutflowEjectionTimingRefinementContextV1(
    contextId,
  );
  const provider =
    createMainWireNormalAdultFiveWallProviderWithVentricularLandEtRefinementCandidateV1(
      candidateId,
    );
  if (
    result.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== provider.parameterIdentityHash
  ) throw new Error(`${contextId}/${candidateId} provider identity mismatch`);
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length < 3) {
    throw new Error(`${contextId}/${candidateId} requires a complete beat`);
  }
  const stressPeakCount = measureMainWireAorticOutflowMechanismStressPeaksV1(
    beat.samples.map((sample) => Math.max(0, sample.wallStressPa.LVFW.active)),
    beat.samples.map((sample) => sample.cyclePhase01),
  ).filter((peak) => peak.distinctAtFixedProminence).length;
  return Object.freeze({
    candidate,
    context,
    cycle,
    protocolIdentityHash: result.protocolIdentityHash,
    lvfwActiveStressDistinctPeakCountAboveFivePercent: stressPeakCount,
    morphologyPreserved:
      stressPeakCount === 1
      && cycle.aorticFlowPeakCountAboveFivePercent === 1,
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

function summarizeCandidate(
  candidateId: MainWireAorticOutflowEjectionTimingRefinementCandidateIdV1,
  arms: readonly MainWireAorticOutflowEjectionTimingRefinementArmV1[],
  dtSec: number,
): MainWireAorticOutflowEjectionTimingRefinementCandidateSummaryV1 {
  const candidate = resolveMainWireVentricularLandEtRefinementCandidateV1(
    candidateId,
  );
  const candidateArms = arms.filter((arm) =>
    arm.candidate.candidateId === candidateId);
  if (
    candidateArms.length
      !== MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CONTEXT_IDS_V1.length
  ) throw new Error(`missing measured ET refinement candidate: ${candidateId}`);
  const reference = MAIN_WIRE_AORTIC_OUTFLOW_EXTERNAL_REFERENCE_CONTEXT_V1;
  const etOk = candidateArms.every((arm) => within(
    arm.cycle.aorticEjectionTimeProxySec,
    reference.leftVentricularEjectionTime.comparisonIntervalSec,
  ));
  const velocityOk = candidateArms.every((arm) => within(
    arm.cycle.peakVenaContractaVelocityMPerSec,
    reference.waseHealthyAdultAorticValve.peakVelocity
      .comparisonIntervalMPerSec,
  ));
  const gradientOk = candidateArms.every((arm) => within(
    arm.cycle.meanDopplerGradientMmHg,
    reference.waseHealthyAdultAorticValve.meanGradient.comparisonIntervalMmHg,
  ));
  const accelerationOk = candidateArms.every((arm) => within(
    arm.cycle.timeFromAorticFlowOnsetToPeakSec,
    reference.waseHealthyAdultAorticValve.accelerationTime
      .comparisonIntervalSec,
  ));
  const period1 = candidateArms.every((arm) =>
    arm.cycle.periodicSteadyStateClaimed
    && arm.cycle.integrationCompletedWithoutFailure);
  const morphology = candidateArms.every((arm) => arm.morphologyPreserved);
  const ejectionTimes = candidateArms.map((arm) =>
    arm.cycle.aorticEjectionTimeProxySec);
  return Object.freeze({
    candidate,
    isometricAtSourceRestingStretch:
      measureMainWireVentricularLandIsometricTwitchAuditV1(
        FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        { dtSec, fixedLandStretch: 1 },
        resolveMainWireVentricularLandEtRefinementWallMaterialV1(candidateId),
      ),
    allRunsPeriod1AndIntegrated: period1,
    morphologyPreservedAtBothContexts: morphology,
    ejectionTimeWithinReferenceAtBothContexts: etOk,
    peakVelocityWithinReferenceAtBothContexts: velocityOk,
    meanGradientWithinReferenceAtBothContexts: gradientOk,
    accelerationTimeWithinReferenceAtBothContexts: accelerationOk,
    minimumEjectionTimeSec: Math.min(...ejectionTimes),
    maximumEjectionTimeSec: Math.max(...ejectionTimes),
    maximumAbsoluteRelativeAorticForwardVolumeChangeFromContextCanonical:
      Math.max(...candidateArms.map((arm) =>
        arm.relativeAorticForwardVolumeChangeFromContextCanonical)),
    maximumAbsoluteRelativeMeanAorticPressureChangeFromContextCanonical:
      Math.max(...candidateArms.map((arm) =>
        arm.relativeMeanAorticPressureChangeFromContextCanonical)),
    etFirstSelectionPassed:
      period1 && morphology && etOk && velocityOk && gradientOk,
  });
}

function armKey(
  contextId: MainWireAorticOutflowEjectionTimingRefinementContextIdV1,
  candidateId: MainWireAorticOutflowEjectionTimingRefinementCandidateIdV1,
): string {
  return `${contextId}::${candidateId}`;
}

function within(value: number, interval: readonly [number, number]): boolean {
  return value >= interval[0] && value <= interval[1];
}

function relativeChange(value: number, reference: number): number {
  return Math.abs(value - reference) / Math.max(Math.abs(reference), 1e-12);
}
