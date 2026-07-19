import type {
  MainWireFiveWallPeriodicClassificationStatusV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import type {
  NonCoronaryCirculationRuntimeParamsV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import type {
  MainWireFiveWallNonCoronaryCheckpointV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import type {
  FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import type {
  MainWireCommonPericardiumBindingV1,
} from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import type {
  MainWireScientificPreloadOperatingLocusV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicAnalysisV1";
import type {
  MainWireScientificPreloadOperatingPointV1,
  MainWireScientificProtocolSourceIdentityV1,
  MainWireScientificVascularFunctionCurveV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicProtocolV1";

export const MAIN_WIRE_SCIENTIFIC_GUYTON_STARLING_PROTOCOL_V2_ID =
  "main-wire-scientific-guyton-starling-protocol-v2" as const;

export const MAIN_WIRE_SCIENTIFIC_HEMODYNAMIC_JOB_V2_ID =
  "main-wire-scientific-hemodynamic-job-v2" as const;

export type MainWireScientificPreloadSweepDirectionV2 =
  | "source-baseline"
  | "lower-volume"
  | "higher-volume"
  | "independent-audit";

export type MainWireScientificPreloadPointProvenanceV2 = Readonly<{
  pointId: string;
  direction: MainWireScientificPreloadSweepDirectionV2;
  targetScale: number;
  seedScale: number;
  seedKind: "source-baseline" | "previous-period1";
  adaptiveStepScale: number;
  attemptOrdinal: number;
  continuationAcceptedAsSeed: boolean;
  refinementReason:
    | "initial"
    | "easy-convergence"
    | "routine-continuation"
    | "high-curvature"
    | "slow-convergence"
    | "periodicity-boundary"
    | "solver-boundary"
    | "independent-audit";
  auditStatus:
    | "not-scheduled"
    | "pending"
    | "matched"
    | "path-dependence-suspect"
    | "audit-failed";
  auditMaximumNormalizedStateDelta: number | null;
}>;

export type MainWireScientificPreloadPointEvidenceV2 = Readonly<{
  point: MainWireScientificPreloadOperatingPointV1;
  provenance: MainWireScientificPreloadPointProvenanceV2;
}>;

export type MainWireScientificGuytonStarlingProtocolResultV2 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_GUYTON_STARLING_PROTOCOL_V2_ID;
  protocolVersion: "2.0.0";
  source: MainWireScientificProtocolSourceIdentityV1;
  claim: Readonly<{
    totalBloodVolumeSweepIsOneDimensionalPreloadOperatingLocus: true;
    totalBloodVolumeSweepIsNotGuytonPumpExperiment: true;
    totalBloodVolumeSweepIsNotEspvrOrEdpvr: true;
    vascularCurveMethod:
      "cycle-mean-fixed-volume-vascular-pv-law-volume-constrained";
    preloadInitialization:
      "bidirectional-adaptive-continuation-with-sparse-independent-audit";
    frozenAutonomicRenalAndVascularControls: true;
    period2PointsAveragedIntoPeriod1Locus: false;
    interpolationAcrossPeriod2FailureOrUnresolvedBoundary: false;
  }>;
  baselinePeriodicity: MainWireFiveWallPeriodicClassificationStatusV1;
  rightVascularFunction: MainWireScientificVascularFunctionCurveV1;
  leftVascularFunction: MainWireScientificVascularFunctionCurveV1;
  preloadPointEvidence: readonly MainWireScientificPreloadPointEvidenceV2[];
  preloadOperatingPoints: readonly MainWireScientificPreloadOperatingPointV1[];
  preloadOperatingLocus: MainWireScientificPreloadOperatingLocusV1;
  exploration: Readonly<{
    normalizedTotalBloodVolumeEnvelope: readonly [number, number];
    hardMinimumTotalBloodVolumeMl: number;
    hardMaximumTotalBloodVolumeMl: number;
    minimumAdaptiveStepScale: number;
    maximumAdaptiveStepScale: number;
    lowerBoundaryStatus: "reached" | "unresolved" | "cancelled";
    higherBoundaryStatus: "reached" | "unresolved" | "cancelled";
    sourceSessionMutated: false;
  }>;
}>;

export type MainWireScientificHemodynamicJobStatusV2 =
  | "running"
  | "complete"
  | "cancelled"
  | "error";

export type MainWireScientificHemodynamicJobStageV2 =
  | "vascular-ready"
  | "continuation"
  | "independent-audit"
  | "complete"
  | "cancelled"
  | "error";

/**
 * Immutable polling snapshot. Heavy accepted-state/checkpoint data never
 * crosses this presentation boundary.
 */
export type MainWireScientificHemodynamicJobSnapshotV2 = Readonly<{
  jobId: string;
  sequence: number;
  status: MainWireScientificHemodynamicJobStatusV2;
  stage: MainWireScientificHemodynamicJobStageV2;
  source: MainWireScientificProtocolSourceIdentityV1;
  baselinePeriodicity: MainWireFiveWallPeriodicClassificationStatusV1;
  rightVascularFunction: MainWireScientificVascularFunctionCurveV1;
  leftVascularFunction: MainWireScientificVascularFunctionCurveV1;
  preloadPointEvidence: readonly MainWireScientificPreloadPointEvidenceV2[];
  progress: Readonly<{
    completedPointCount: number;
    plannedPointCountLowerBound: number;
    activeDirections: readonly MainWireScientificPreloadSweepDirectionV2[];
    completedBeatCount: number;
  }>;
  result: MainWireScientificGuytonStarlingProtocolResultV2 | null;
  errorMessage: string | null;
}>;

export type MainWireScientificHemodynamicJobStartV2 = Readonly<{
  jobId: string;
  snapshot: MainWireScientificHemodynamicJobSnapshotV2;
  suggestedPollIntervalMs: number;
}>;

/**
 * Trusted worker-internal capsule. The browser UI never receives it. A branch
 * worker reconstructs the canonical provider and validates these identities
 * before restoring the transaction checkpoint.
 */
export type MainWireScientificHemodynamicJobCapsuleV2 = Readonly<{
  capsuleId: "main-wire-scientific-hemodynamic-job-capsule-v2";
  source: MainWireScientificProtocolSourceIdentityV1;
  providerIdentity: Readonly<{
    providerId: string;
    parameterSetId: string;
    parameterIdentityHash: string;
  }>;
  transactionCheckpoint: MainWireFiveWallNonCoronaryCheckpointV1;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  pericardium: MainWireCommonPericardiumBindingV1;
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
}>;
