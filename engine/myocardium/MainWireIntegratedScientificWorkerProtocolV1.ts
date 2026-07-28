import type {
  MainWireIntegratedModelCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import type {
  StudioLaneCapabilitiesV1,
  StudioLaneDescriptorV1,
} from "@/engine/myocardium/MainWireIntegratedLaneIdentityV1";
import type {
  MainWireIntegratedLaneObservableFrameV1,
} from "@/engine/myocardium/MainWireIntegratedLaneObservableRegistryV1";
import type {
  MainWireIntegratedLaneSubstepRecordV1,
} from "@/engine/myocardium/MainWireIntegratedScientificSession";

export const MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID =
  "main-wire-integrated-scientific-worker-command-protocol-v1" as const;

/**
 * Exact development identity served by this protocol version. A different
 * preset, registry, or manifest requires a different protocol binding.
 */
export const MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1 =
  Object.freeze({
    laneKind: "integrated-v3-experimental" as const,
    laneId:
      "integrated-coronary-sinus-hmii-9000-experimental-v1" as const,
    releaseRef: Object.freeze({
      id:
        "main-wire-integrated-coronary-sinus-hmii-experimental" as const,
      version: "0.0.1" as const,
      sha256:
        "4753c81aa3635af0723b88afa0a6f567ecb8f31f0d5df2a8f074bf87eed23a86" as const,
    }),
    observableCatalogId:
      "main-wire-integrated-v3-experimental-observable-registry-v1" as const,
    observableCatalogSha256:
      "ae5ebba68482b2410e47d102ca94d2105688ab747bf562136bcb7ee4c13b4913" as const,
    presentationDtSec: 0.002 as const,
  });

export const MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_COMMAND_KINDS_V1 =
  Object.freeze([
    "createWorkerOwnedPresetSession",
    "observe",
    "advanceToPresentationOrdinal",
    "getOperationalCheckpoint",
    "restoreOperationalCheckpoint",
    "disposeSession",
  ] as const);

export type MainWireIntegratedScientificWorkerCommandKindV1 =
  (typeof MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_COMMAND_KINDS_V1)[number];

/**
 * Kept beside the transport schema so the main-thread client can reject an
 * incomplete capability record without importing the Worker-owned preset.
 */
export const MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_CAPABILITY_KEYS_V1 =
  Object.freeze([
    "liveWorkerExecution",
    "decimatedLivePresentation",
    "livePacingReporting",
    "suspendResumePresentation",
    "operationalWorkerRotationCheckpoint",
    "interactiveResearchControls",
    "strictPeriodicSettlement",
    "steadyCandidatePromotion",
    "candidatePinning",
    "persistedWarmSnapshot",
    "exactSignalExport",
    "presentationBeatEstimates",
    "hemodynamicSideAnalysis",
    "pvRelationsSideAnalysis",
    "tbvContinuationSeedPrediction",
    "externalAfRhythm",
    "iabpSupport",
    "releaseOrCandidateIdentity",
  ] as const satisfies readonly (keyof StudioLaneCapabilitiesV1)[]);

type CommandBaseV1<
  TKind extends MainWireIntegratedScientificWorkerCommandKindV1,
> = Readonly<{
  protocolId:
    typeof MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID;
  kind: TKind;
  requestId: string;
  sessionId: string;
}>;

export type CreateWorkerOwnedPresetSessionCommandV1 =
  CommandBaseV1<"createWorkerOwnedPresetSession">;

export type ObserveIntegratedSessionCommandV1 =
  CommandBaseV1<"observe">;

export type AdvanceToPresentationOrdinalCommandV1 =
  CommandBaseV1<"advanceToPresentationOrdinal"> & Readonly<{
    presentationOrdinal: number;
  }> & (
    | Readonly<{
      presentationOrdinalCount?: never;
    }>
    | Readonly<{
      presentationOrdinalCount: number;
    }>
  );

export type GetOperationalCheckpointCommandV1 =
  CommandBaseV1<"getOperationalCheckpoint">;

export type RestoreOperationalCheckpointCommandV1 =
  CommandBaseV1<"restoreOperationalCheckpoint"> & Readonly<{
    checkpoint: unknown;
  }>;

export type DisposeIntegratedSessionCommandV1 =
  CommandBaseV1<"disposeSession">;

export type MainWireIntegratedScientificWorkerCommandV1 =
  | CreateWorkerOwnedPresetSessionCommandV1
  | ObserveIntegratedSessionCommandV1
  | AdvanceToPresentationOrdinalCommandV1
  | GetOperationalCheckpointCommandV1
  | RestoreOperationalCheckpointCommandV1
  | DisposeIntegratedSessionCommandV1;

export type MainWireIntegratedScientificWorkerSessionSnapshotV1 = Readonly<{
  /**
   * Null means the accepted model clock is off the presentation grid. This is
   * expected after restoring a checkpoint captured inside an interval.
   */
  presentationOrdinal: number | null;
  acceptedRevision: number;
  acceptedTimeSec: number;
  observableFrame: MainWireIntegratedLaneObservableFrameV1;
}>;

export type MainWireIntegratedScientificWorkerAdvancePayloadV1 = Readonly<{
  kind: "presentation-advance";
  status: "advanced" | "already-at-target";
  presentationOrdinal: number;
  presentationTimeSec: number;
  acceptedRevision: number;
  acceptedTimeSec: number;
  acceptedRevisionSpanFromPrevious: number;
  internalAcceptedSubstepCount: number;
  boundaryClippedSubstepCount: number;
  substeps: readonly MainWireIntegratedLaneSubstepRecordV1[];
  emittedPresentationSample: boolean;
  observableFrame: MainWireIntegratedLaneObservableFrameV1;
}>;

export type MainWireIntegratedScientificWorkerAdvanceBatchPayloadV1 =
  Readonly<{
    kind: "presentation-advance-batch";
    /**
     * Terminal fields mirror `advances.at(-1)`. Keeping the final per-ordinal
     * receipt at the top level preserves the response's advance summary while
     * `advances` remains the authoritative ordered sample collection.
     */
    status: "advanced";
    presentationOrdinal: number;
    presentationTimeSec: number;
    acceptedRevision: number;
    acceptedTimeSec: number;
    acceptedRevisionSpanFromPrevious: number;
    internalAcceptedSubstepCount: number;
    boundaryClippedSubstepCount: number;
    substeps: readonly MainWireIntegratedLaneSubstepRecordV1[];
    emittedPresentationSample: true;
    observableFrame: MainWireIntegratedLaneObservableFrameV1;
    firstPresentationOrdinal: number;
    lastPresentationOrdinal: number;
    requestedPresentationOrdinalCount: number;
    advances:
      readonly MainWireIntegratedScientificWorkerAdvancePayloadV1[];
  }>;

export type MainWireIntegratedScientificWorkerSuccessPayloadByKindV1 =
  Readonly<{
    createWorkerOwnedPresetSession: Readonly<{
      kind: "worker-owned-preset-session-created";
      session: MainWireIntegratedScientificWorkerSessionSnapshotV1;
    }>;
    observe: Readonly<{
      kind: "observation";
      session: MainWireIntegratedScientificWorkerSessionSnapshotV1;
    }>;
    advanceToPresentationOrdinal:
      | MainWireIntegratedScientificWorkerAdvancePayloadV1
      | MainWireIntegratedScientificWorkerAdvanceBatchPayloadV1;
    getOperationalCheckpoint: Readonly<{
      kind: "operational-checkpoint";
      checkpoint: MainWireIntegratedModelCheckpointV3;
      session: MainWireIntegratedScientificWorkerSessionSnapshotV1;
    }>;
    restoreOperationalCheckpoint: Readonly<{
      kind: "operational-checkpoint-session-restored";
      session: MainWireIntegratedScientificWorkerSessionSnapshotV1;
    }>;
    disposeSession: Readonly<{
      kind: "session-disposed";
      disposedSessionId: string;
    }>;
  }>;

export type MainWireIntegratedScientificWorkerErrorCodeV1 =
  | "invalid-command"
  | "duplicate-request-id"
  | "request-capacity-exceeded"
  | "command-queue-capacity-exceeded"
  | "duplicate-session-id"
  | "retired-session-id"
  | "unknown-session-id"
  | "session-capacity-exceeded"
  | "presentation-ordinal-mismatch"
  | "simulation-step-failed"
  | "session-creation-failed"
  | "checkpoint-failed"
  | "operational-restore-rejected"
  | "command-failed";

export type MainWireIntegratedScientificWorkerAdvancePartialProgressV1 =
  Readonly<{
    kind: "presentation-advance-partial-progress";
    requestedPresentationOrdinal: number;
    requestedPresentationTimeSec: number;
    acceptedRevision: number;
    acceptedTimeSec: number;
    lastPresentationOrdinal: number | null;
    partiallyAdvanced: boolean;
    internalAcceptedSubstepCount: number;
    emittedPresentationSample: false;
    observableFrame: null;
    failureReason: string;
  }>;

export type MainWireIntegratedScientificWorkerAdvanceBatchPartialProgressV1 =
  Readonly<{
    kind: "presentation-advance-batch-partial-progress";
    firstPresentationOrdinal: number;
    requestedPresentationOrdinalCount: number;
    completedAdvances:
      readonly MainWireIntegratedScientificWorkerAdvancePayloadV1[];
    failedPresentationOrdinal: number;
    failedPresentationTimeSec: number;
    acceptedRevision: number;
    acceptedTimeSec: number;
    lastPresentationOrdinal: number | null;
    failedOrdinalPartiallyAdvanced: boolean;
    failedOrdinalInternalAcceptedSubstepCount: number;
    failedOrdinalBoundaryClippedSubstepCount: number;
    failedOrdinalSubsteps:
      readonly MainWireIntegratedLaneSubstepRecordV1[];
    failureReason: string;
  }>;

export type MainWireIntegratedScientificWorkerSuccessResponseForKindV1<
  TKind extends MainWireIntegratedScientificWorkerCommandKindV1,
> = Readonly<{
  protocolId:
    typeof MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID;
  ok: true;
  requestId: string;
  sessionId: string;
  commandKind: TKind;
  laneDescriptor: StudioLaneDescriptorV1;
  payload: MainWireIntegratedScientificWorkerSuccessPayloadByKindV1[TKind];
  error: null;
}>;

export type MainWireIntegratedScientificWorkerSuccessResponseV1 = {
  [TKind in MainWireIntegratedScientificWorkerCommandKindV1]:
    MainWireIntegratedScientificWorkerSuccessResponseForKindV1<TKind>;
}[MainWireIntegratedScientificWorkerCommandKindV1];

export type MainWireIntegratedScientificWorkerErrorResponseV1 = Readonly<{
  protocolId:
    typeof MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID;
  ok: false;
  requestId: string | null;
  sessionId: string | null;
  commandKind: MainWireIntegratedScientificWorkerCommandKindV1 | null;
  laneDescriptor: StudioLaneDescriptorV1 | null;
  payload: null;
  error: Readonly<{
    code: MainWireIntegratedScientificWorkerErrorCodeV1;
    message: string;
    retryable: false;
    silentFallbackApplied: false;
    partialProgress:
      | MainWireIntegratedScientificWorkerAdvancePartialProgressV1
      | MainWireIntegratedScientificWorkerAdvanceBatchPartialProgressV1
      | null;
  }>;
}>;

export type MainWireIntegratedScientificWorkerResponseV1 =
  | MainWireIntegratedScientificWorkerSuccessResponseV1
  | MainWireIntegratedScientificWorkerErrorResponseV1;
