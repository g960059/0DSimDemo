import type {
  MainWireScientificFastTbvLvEventStatusV1,
  MainWireScientificFastTbvPreviewLaneV1,
  MainWireScientificFastTbvTerminalObservationV1,
} from "@/engine/scientific/protocols/MainWireScientificFastTbvPreviewV1";

/**
 * Scheduling policy for the rapid TBV preview only.
 *
 * The policy deliberately consumes scalar, beat-level evidence rather than a
 * transaction-specific state layout.  A future coronary, reflex, device, or
 * multipatch state can therefore extend the accepted-state comparator without
 * changing this scheduler.  None of the thresholds below is a periodicity
 * criterion and no result from this policy may be promoted to P1/P2 evidence.
 */
export const MAIN_WIRE_SCIENTIFIC_FAST_TBV_REFINEMENT_POLICY_V1 = Object.freeze({
  policyId: "main-wire-scientific-fast-tbv-refinement-policy-v1" as const,
  policyVersion: "1.0.0" as const,
  globalSoftWallTimeBudgetMs: 10_000,
  initialNaturalBeatCount: 2 as const,
  baselineRefinementNaturalBeatCount: 3 as const,
  maximumNaturalBeatCount: 5 as const,
  resultTransportReserveMs: 120,
  nextBeatWallTimeSafetyFactor: 1.3,
  stabilizationReferences: Object.freeze({
    fullStateMaximumNormalizedDelta: 5e-2,
    meanRapTransmuralMmHg: 0.15,
    meanLapTransmuralMmHg: 0.25,
    netCardiacOutputLMin: 0.15,
    forwardCardiacOutputLMin: 0.15,
    lvEndDiastolicVolumeMl: 2,
    lvEndDiastolicTransmuralPressureMmHg: 0.5,
    lvEndSystolicVolumeMl: 2,
    lvEndSystolicTransmuralPressureMmHg: 2,
    lvStrokeWorkAbsoluteMmHgMl: 250,
    lvStrokeWorkRelativeFraction: 0.03,
  }),
  optionalRefinementNormalizedDrift: 0.5,
  highPriorityRefinementNormalizedDrift: 1,
  maximumFinitePriorityScore: 1e6,
});

export type MainWireScientificFastTbvNaturalBeatEvidenceV1 = Readonly<{
  naturalBeatOrdinal: number;
  /** Full accepted-state delta from the preceding natural beat. */
  fullStateMaximumNormalizedDelta: number;
  observation: MainWireScientificFastTbvTerminalObservationV1;
}>;

export type MainWireScientificFastTbvBeatDriftV1 = Readonly<{
  fullStateMaximumNormalizedDelta: number;
  fullStateResidualRatio: number;
  fullStateResidualTrend: "contracting" | "flat" | "growing";
  meanRapTransmuralMmHg: number;
  meanLapTransmuralMmHg: number;
  netCardiacOutputLMin: number;
  forwardCardiacOutputLMin: number;
  lvPressureVolume: Readonly<{
    endpointAvailabilityChanged: boolean;
    endDiastolicVolumeMl: number | null;
    endDiastolicTransmuralPressureMmHg: number | null;
    endSystolicVolumeMl: number | null;
    endSystolicTransmuralPressureMmHg: number | null;
    strokeWorkMmHgMl: number | null;
  }>;
}>;

export type MainWireScientificFastTbvNormalizedDriftV1 = Readonly<{
  fullState: number;
  meanRap: number;
  meanLap: number;
  netCardiacOutput: number;
  forwardCardiacOutput: number;
  lvPressureVolume: number;
  maximum: number;
}>;

export type MainWireScientificFastTbvEventQcAssessmentV1 = Readonly<{
  previousStatus: MainWireScientificFastTbvLvEventStatusV1;
  latestStatus: MainWireScientificFastTbvLvEventStatusV1;
  statusChanged: boolean;
  latestEndpointDisplayEligible: boolean;
  refinementPriorityContribution: number;
}>;

export type MainWireScientificFastTbvRefinementTierV1 =
  | "baseline-third-beat"
  | "high-uncertainty"
  | "opportunistic"
  | "stop";

export type MainWireScientificFastTbvRefinementAssessmentV1 = Readonly<{
  policyId: typeof MAIN_WIRE_SCIENTIFIC_FAST_TBV_REFINEMENT_POLICY_V1.policyId;
  completedNaturalBeatCount: number;
  tier: MainWireScientificFastTbvRefinementTierV1;
  priorityScore: number;
  drift: MainWireScientificFastTbvBeatDriftV1;
  normalizedDrift: MainWireScientificFastTbvNormalizedDriftV1;
  eventQc: MainWireScientificFastTbvEventQcAssessmentV1;
  numericalQcPassed: boolean;
  stopReason:
    | "none"
    | "numerical-qc-failed"
    | "maximum-natural-beat-count-reached"
    | "beat-level-drift-small";
  claimBoundary: Readonly<{
    periodicityClaim: "none";
    mayEnterSettledP1OrP2Evidence: false;
    maySeedCanonicalContinuation: false;
    mayEnterEspvrEdpvrPrswFit: false;
  }>;
}>;

export type MainWireScientificFastTbvRefinementCandidateV1 = Readonly<{
  targetId: string;
  lane: MainWireScientificFastTbvPreviewLaneV1;
  completedNaturalBeatCount: number;
  assessment: MainWireScientificFastTbvRefinementAssessmentV1;
  estimatedNextBeatWallTimeMs: number;
  initialTargetsRemainingInLane: number;
  inFlight: boolean;
}>;

export type MainWireScientificFastTbvRefinementDispatchV1 = Readonly<{
  targetId: string;
  lane: MainWireScientificFastTbvPreviewLaneV1;
  requestedNaturalBeatCount: 3 | 4 | 5;
  estimatedProtectedWallTimeMs: number;
  priorityScore: number;
  tier: Exclude<MainWireScientificFastTbvRefinementTierV1, "stop">;
}>;

export type MainWireScientificFastTbvRefinementPlanV1 = Readonly<{
  policyId: typeof MAIN_WIRE_SCIENTIFIC_FAST_TBV_REFINEMENT_POLICY_V1.policyId;
  remainingWallTimeMs: number;
  dispatches: readonly MainWireScientificFastTbvRefinementDispatchV1[];
  budgetExhausted: boolean;
  claimBoundary: Readonly<{
    periodicityClaim: "none";
    dispatchesAreRapidPreviewOnly: true;
  }>;
}>;

/** Presentation/worker metadata for replacing, rather than duplicating, a point. */
export type MainWireScientificFastTbvRefinementStageV1 = Readonly<{
  targetId: string;
  completedNaturalBeatCount: 2 | 3 | 4 | 5;
  stageKind:
    | "initial-two-beat"
    | "baseline-third-beat"
    | "adaptive-refinement";
  revision: 1 | 2 | 3 | 4;
  supersedesRevision: 1 | 2 | 3 | null;
  assessment: MainWireScientificFastTbvRefinementAssessmentV1;
  measuredLatestBeatWallTimeMs: number;
  presentation: Readonly<{
    replaceEvidenceForSameTarget: true;
    preserveFirstEmissionTimestamp: true;
  }>;
  claimBoundary: Readonly<{
    periodicityClaim: "none";
    stageMayEnterCanonicalEvidence: false;
  }>;
}>;

const CLAIM_BOUNDARY = Object.freeze({
  periodicityClaim: "none" as const,
  mayEnterSettledP1OrP2Evidence: false as const,
  maySeedCanonicalContinuation: false as const,
  mayEnterEspvrEdpvrPrswFit: false as const,
});

/** Assess whether another natural beat is worth the remaining rapid budget. */
export function assessMainWireScientificFastTbvRefinementV1(input: Readonly<{
  previousBeat: MainWireScientificFastTbvNaturalBeatEvidenceV1;
  latestBeat: MainWireScientificFastTbvNaturalBeatEvidenceV1;
}>): MainWireScientificFastTbvRefinementAssessmentV1 {
  const { previousBeat, latestBeat } = input;
  if (
    latestBeat.naturalBeatOrdinal < 2
    || previousBeat.naturalBeatOrdinal !== latestBeat.naturalBeatOrdinal - 1
  ) {
    throw new Error("rapid TBV refinement requires consecutive natural beats from beat 2 onward");
  }

  const policy = MAIN_WIRE_SCIENTIFIC_FAST_TBV_REFINEMENT_POLICY_V1;
  const previous = previousBeat.observation;
  const latest = latestBeat.observation;
  const drift = beatDrift(
    previous,
    latest,
    previousBeat.fullStateMaximumNormalizedDelta,
    latestBeat.fullStateMaximumNormalizedDelta,
  );
  const normalizedDrift = normalizeBeatDrift(drift, previous, latest);
  const eventQc = assessEventQc(
    previous.quality.lvEvents.status,
    latest.quality.lvEvents.status,
    latest.quality.lvEvents.endpointDisplayEligible,
  );
  const numericalQcPassed = previous.quality.numerics.passed
    && latest.quality.numerics.passed
    && finiteDrift(drift);
  const completedNaturalBeatCount = latestBeat.naturalBeatOrdinal;

  let tier: MainWireScientificFastTbvRefinementTierV1;
  let stopReason: MainWireScientificFastTbvRefinementAssessmentV1["stopReason"] = "none";
  if (!numericalQcPassed) {
    tier = "stop";
    stopReason = "numerical-qc-failed";
  } else if (completedNaturalBeatCount >= policy.maximumNaturalBeatCount) {
    tier = "stop";
    stopReason = "maximum-natural-beat-count-reached";
  } else if (completedNaturalBeatCount < policy.baselineRefinementNaturalBeatCount) {
    tier = "baseline-third-beat";
  } else if (
    eventQc.statusChanged
    || (
      drift.fullStateResidualTrend === "growing"
      && normalizedDrift.fullState > policy.optionalRefinementNormalizedDrift
    )
    || normalizedDrift.maximum > policy.highPriorityRefinementNormalizedDrift
  ) {
    tier = "high-uncertainty";
  } else if (
    normalizedDrift.maximum > policy.optionalRefinementNormalizedDrift
    || eventQc.refinementPriorityContribution > 0
  ) {
    tier = "opportunistic";
  } else {
    tier = "stop";
    stopReason = "beat-level-drift-small";
  }

  const rawPriority = Math.max(
    normalizedDrift.maximum,
    eventQc.refinementPriorityContribution,
    tier === "baseline-third-beat" ? 1 : 0,
  );
  return Object.freeze({
    policyId: policy.policyId,
    completedNaturalBeatCount,
    tier,
    priorityScore: Math.min(
      Number.isFinite(rawPriority) ? rawPriority : policy.maximumFinitePriorityScore,
      policy.maximumFinitePriorityScore,
    ),
    drift,
    normalizedDrift,
    eventQc,
    numericalQcPassed,
    stopReason,
    claimBoundary: CLAIM_BOUNDARY,
  });
}

/**
 * Selects at most one next-beat dispatch per idle persistent worker lane.
 * The budget is global wall time: concurrently dispatched lane costs are not
 * summed.  Deep (beat 4/5) refinement waits until that lane has exposed all
 * initial two/three-beat points, preserving a fast first complete locus.
 */
export function planMainWireScientificFastTbvRefinementDispatchesV1(input: Readonly<{
  remainingWallTimeMs: number;
  idleLanes: readonly MainWireScientificFastTbvPreviewLaneV1[];
  candidates: readonly MainWireScientificFastTbvRefinementCandidateV1[];
}>): MainWireScientificFastTbvRefinementPlanV1 {
  const policy = MAIN_WIRE_SCIENTIFIC_FAST_TBV_REFINEMENT_POLICY_V1;
  const remainingWallTimeMs = Math.max(0, input.remainingWallTimeMs);
  const idleLaneSet = new Set(input.idleLanes);
  const eligibleCandidates = input.candidates.filter((candidate) =>
    idleLaneSet.has(candidate.lane)
    && refinementCandidateIsDispatchable(candidate)
  );
  const dispatches = input.idleLanes.flatMap((lane) => {
    const candidate = eligibleCandidates
      .filter((entry) => entry.lane === lane)
      .sort(compareCandidates)[0];
    if (candidate === undefined) return [];
    const estimatedProtectedWallTimeMs =
      candidate.estimatedNextBeatWallTimeMs * policy.nextBeatWallTimeSafetyFactor
      + policy.resultTransportReserveMs;
    if (estimatedProtectedWallTimeMs > remainingWallTimeMs) return [];
    return [Object.freeze({
      targetId: candidate.targetId,
      lane: candidate.lane,
      requestedNaturalBeatCount: (candidate.completedNaturalBeatCount + 1) as 3 | 4 | 5,
      estimatedProtectedWallTimeMs,
      priorityScore: candidate.assessment.priorityScore,
      tier: candidate.assessment.tier as Exclude<MainWireScientificFastTbvRefinementTierV1, "stop">,
    })];
  });
  return Object.freeze({
    policyId: policy.policyId,
    remainingWallTimeMs,
    dispatches: Object.freeze(dispatches),
    budgetExhausted:
      dispatches.length === 0
      && eligibleCandidates.length > 0,
    claimBoundary: Object.freeze({
      periodicityClaim: "none" as const,
      dispatchesAreRapidPreviewOnly: true as const,
    }),
  });
}

export function createMainWireScientificFastTbvRefinementStageV1(input: Readonly<{
  targetId: string;
  assessment: MainWireScientificFastTbvRefinementAssessmentV1;
  measuredLatestBeatWallTimeMs: number;
}>): MainWireScientificFastTbvRefinementStageV1 {
  const completed = input.assessment.completedNaturalBeatCount;
  if (completed < 2 || completed > 5 || !Number.isInteger(completed)) {
    throw new Error("rapid TBV refinement stage beat count must be an integer from 2 through 5");
  }
  if (
    !(input.measuredLatestBeatWallTimeMs > 0)
    || !Number.isFinite(input.measuredLatestBeatWallTimeMs)
  ) {
    throw new Error("rapid TBV refinement stage wall time must be positive and finite");
  }
  const revision = (completed - 1) as 1 | 2 | 3 | 4;
  return Object.freeze({
    targetId: input.targetId,
    completedNaturalBeatCount: completed as 2 | 3 | 4 | 5,
    stageKind: completed === 2
      ? "initial-two-beat" as const
      : completed === 3
        ? "baseline-third-beat" as const
        : "adaptive-refinement" as const,
    revision,
    supersedesRevision: revision === 1
      ? null
      : (revision - 1) as 1 | 2 | 3,
    assessment: input.assessment,
    measuredLatestBeatWallTimeMs: input.measuredLatestBeatWallTimeMs,
    presentation: Object.freeze({
      replaceEvidenceForSameTarget: true as const,
      preserveFirstEmissionTimestamp: true as const,
    }),
    claimBoundary: Object.freeze({
      periodicityClaim: "none" as const,
      stageMayEnterCanonicalEvidence: false as const,
    }),
  });
}

function refinementCandidateIsDispatchable(
  candidate: MainWireScientificFastTbvRefinementCandidateV1,
): boolean {
  const policy = MAIN_WIRE_SCIENTIFIC_FAST_TBV_REFINEMENT_POLICY_V1;
  return !candidate.inFlight
    && candidate.assessment.tier !== "stop"
    && candidate.completedNaturalBeatCount >= policy.initialNaturalBeatCount
    && candidate.completedNaturalBeatCount < policy.maximumNaturalBeatCount
    && (
      candidate.completedNaturalBeatCount < policy.baselineRefinementNaturalBeatCount
      || candidate.initialTargetsRemainingInLane === 0
    )
    && Number.isFinite(candidate.estimatedNextBeatWallTimeMs)
    && candidate.estimatedNextBeatWallTimeMs > 0;
}

function beatDrift(
  previous: MainWireScientificFastTbvTerminalObservationV1,
  latest: MainWireScientificFastTbvTerminalObservationV1,
  previousFullStateMaximumNormalizedDelta: number,
  fullStateMaximumNormalizedDelta: number,
): MainWireScientificFastTbvBeatDriftV1 {
  const fullStateResidualRatio = fullStateMaximumNormalizedDelta
    / Math.max(previousFullStateMaximumNormalizedDelta, 1e-12);
  const previousPv = previous.lvPressureVolume;
  const latestPv = latest.lvPressureVolume;
  return Object.freeze({
    fullStateMaximumNormalizedDelta,
    fullStateResidualRatio,
    fullStateResidualTrend: fullStateResidualRatio < 0.95
      ? "contracting" as const
      : fullStateResidualRatio <= 1.05
        ? "flat" as const
        : "growing" as const,
    meanRapTransmuralMmHg: absoluteDelta(
      latest.meanRapTransmuralMmHg,
      previous.meanRapTransmuralMmHg,
    ),
    meanLapTransmuralMmHg: absoluteDelta(
      latest.meanLapTransmuralMmHg,
      previous.meanLapTransmuralMmHg,
    ),
    netCardiacOutputLMin: absoluteDelta(
      latest.netCardiacOutputLMin,
      previous.netCardiacOutputLMin,
    ),
    forwardCardiacOutputLMin: absoluteDelta(
      latest.forwardCardiacOutputLMin,
      previous.forwardCardiacOutputLMin,
    ),
    lvPressureVolume: Object.freeze({
      endpointAvailabilityChanged: (previousPv === null) !== (latestPv === null),
      endDiastolicVolumeMl: nullableAbsoluteDelta(
        latestPv?.endDiastolicVolumeMl,
        previousPv?.endDiastolicVolumeMl,
      ),
      endDiastolicTransmuralPressureMmHg: nullableAbsoluteDelta(
        latestPv?.endDiastolicTransmuralPressureMmHg,
        previousPv?.endDiastolicTransmuralPressureMmHg,
      ),
      endSystolicVolumeMl: nullableAbsoluteDelta(
        latestPv?.endSystolicVolumeMl,
        previousPv?.endSystolicVolumeMl,
      ),
      endSystolicTransmuralPressureMmHg: nullableAbsoluteDelta(
        latestPv?.endSystolicTransmuralPressureMmHg,
        previousPv?.endSystolicTransmuralPressureMmHg,
      ),
      strokeWorkMmHgMl: nullableAbsoluteDelta(
        latestPv?.strokeWorkMmHgMl,
        previousPv?.strokeWorkMmHgMl,
      ),
    }),
  });
}

function normalizeBeatDrift(
  drift: MainWireScientificFastTbvBeatDriftV1,
  previous: MainWireScientificFastTbvTerminalObservationV1,
  latest: MainWireScientificFastTbvTerminalObservationV1,
): MainWireScientificFastTbvNormalizedDriftV1 {
  const reference = MAIN_WIRE_SCIENTIFIC_FAST_TBV_REFINEMENT_POLICY_V1
    .stabilizationReferences;
  const pv = drift.lvPressureVolume;
  const strokeWorkScale = Math.max(
    reference.lvStrokeWorkAbsoluteMmHgMl,
    reference.lvStrokeWorkRelativeFraction * Math.max(
      Math.abs(previous.lvPressureVolume?.strokeWorkMmHgMl ?? 0),
      Math.abs(latest.lvPressureVolume?.strokeWorkMmHgMl ?? 0),
    ),
  );
  const pvNormalized = pv.endpointAvailabilityChanged
    ? Number.POSITIVE_INFINITY
    : Math.max(
        ratioOrZero(pv.endDiastolicVolumeMl, reference.lvEndDiastolicVolumeMl),
        ratioOrZero(
          pv.endDiastolicTransmuralPressureMmHg,
          reference.lvEndDiastolicTransmuralPressureMmHg,
        ),
        ratioOrZero(pv.endSystolicVolumeMl, reference.lvEndSystolicVolumeMl),
        ratioOrZero(
          pv.endSystolicTransmuralPressureMmHg,
          reference.lvEndSystolicTransmuralPressureMmHg,
        ),
        ratioOrZero(pv.strokeWorkMmHgMl, strokeWorkScale),
      );
  const normalized = {
    fullState: drift.fullStateMaximumNormalizedDelta
      / reference.fullStateMaximumNormalizedDelta,
    meanRap: drift.meanRapTransmuralMmHg / reference.meanRapTransmuralMmHg,
    meanLap: drift.meanLapTransmuralMmHg / reference.meanLapTransmuralMmHg,
    netCardiacOutput:
      drift.netCardiacOutputLMin / reference.netCardiacOutputLMin,
    forwardCardiacOutput:
      drift.forwardCardiacOutputLMin / reference.forwardCardiacOutputLMin,
    lvPressureVolume: pvNormalized,
  };
  return Object.freeze({
    ...normalized,
    maximum: Math.max(...Object.values(normalized)),
  });
}

function assessEventQc(
  previousStatus: MainWireScientificFastTbvLvEventStatusV1,
  latestStatus: MainWireScientificFastTbvLvEventStatusV1,
  latestEndpointDisplayEligible: boolean,
): MainWireScientificFastTbvEventQcAssessmentV1 {
  const statusChanged = previousStatus !== latestStatus;
  const refinementPriorityContribution = statusChanged
    ? 2
    : latestStatus === "missing-end-diastolic-event"
        || latestStatus === "missing-end-systolic-event"
      ? 0.75
      : latestStatus === "non-ejecting-beat"
        ? 0.25
        : 0;
  return Object.freeze({
    previousStatus,
    latestStatus,
    statusChanged,
    latestEndpointDisplayEligible,
    refinementPriorityContribution,
  });
}

function compareCandidates(
  left: MainWireScientificFastTbvRefinementCandidateV1,
  right: MainWireScientificFastTbvRefinementCandidateV1,
): number {
  if (left.completedNaturalBeatCount !== right.completedNaturalBeatCount) {
    return left.completedNaturalBeatCount - right.completedNaturalBeatCount;
  }
  const tierRank: Record<MainWireScientificFastTbvRefinementTierV1, number> = {
    "baseline-third-beat": 3,
    "high-uncertainty": 2,
    opportunistic: 1,
    stop: 0,
  };
  const tierDelta = tierRank[right.assessment.tier] - tierRank[left.assessment.tier];
  if (tierDelta !== 0) return tierDelta;
  const priorityDelta = right.assessment.priorityScore - left.assessment.priorityScore;
  return priorityDelta !== 0 ? priorityDelta : left.targetId.localeCompare(right.targetId);
}

function absoluteDelta(latest: number, previous: number): number {
  return Math.abs(latest - previous);
}

function nullableAbsoluteDelta(
  latest: number | undefined,
  previous: number | undefined,
): number | null {
  if (latest === undefined || previous === undefined) return null;
  return absoluteDelta(latest, previous);
}

function ratioOrZero(value: number | null, scale: number): number {
  return value === null ? 0 : value / scale;
}

function finiteDrift(drift: MainWireScientificFastTbvBeatDriftV1): boolean {
  return drift.fullStateMaximumNormalizedDelta >= 0
    && drift.fullStateResidualRatio >= 0
    && [
    drift.fullStateMaximumNormalizedDelta,
    drift.fullStateResidualRatio,
    drift.meanRapTransmuralMmHg,
    drift.meanLapTransmuralMmHg,
    drift.netCardiacOutputLMin,
    drift.forwardCardiacOutputLMin,
    drift.lvPressureVolume.endDiastolicVolumeMl,
    drift.lvPressureVolume.endDiastolicTransmuralPressureMmHg,
    drift.lvPressureVolume.endSystolicVolumeMl,
    drift.lvPressureVolume.endSystolicTransmuralPressureMmHg,
    drift.lvPressureVolume.strokeWorkMmHgMl,
    ].every((value) => value === null || Number.isFinite(value));
}
