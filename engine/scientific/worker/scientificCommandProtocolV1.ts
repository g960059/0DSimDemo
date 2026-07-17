import type {
  MainWireScientificPeriodicBeatSummaryV1,
  MainWireScientificPeriodicSettlementStatusV1,
  MainWireScientificSessionExactCheckpointV2,
} from "@/engine/scientific/runtime";
import type {
  MainWireFiveWallPeriodicClassificationV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import type {
  SimulationReleaseRef,
} from "@/engine/scientific/release";

export const SCIENTIFIC_COMMAND_PROTOCOL_V1_ID =
  "circleheart-scientific-command-protocol-v1" as const;

export const SCIENTIFIC_COMMAND_KINDS_V1 = Object.freeze([
  "createCanonicalSession",
  "createResolvedSession",
  "createOfficialPresetSession",
  "runTransient",
  "observe",
  "getExactCheckpoint",
  "restoreExactSession",
  "disposeSession",
  "settlePeriodic",
] as const);

export type ScientificCommandKindV1 =
  (typeof SCIENTIFIC_COMMAND_KINDS_V1)[number];

type CommandBaseV1<TKind extends ScientificCommandKindV1> = Readonly<{
  protocolId: typeof SCIENTIFIC_COMMAND_PROTOCOL_V1_ID;
  kind: TKind;
  requestId: string;
  sessionId: string;
}>;

export type CreateCanonicalSessionCommandV1 =
  CommandBaseV1<"createCanonicalSession">;

/**
 * Starts a cold session from one complete, release-resolved input document.
 * The Worker treats this field as untrusted and revalidates it against the
 * immutable bundled release; this command intentionally has no patch field.
 */
export type CreateResolvedSessionCommandV1 =
  CommandBaseV1<"createResolvedSession"> & Readonly<{
    resolvedSessionInput: unknown;
  }>;

export type CreateOfficialPresetSessionCommandV1 =
  CommandBaseV1<"createOfficialPresetSession"> & Readonly<{
    presetId: "circleheart/official-healthy-periodic";
    presetVersion: "1.0.0";
  }>;

export type RunTransientCommandV1 = CommandBaseV1<"runTransient"> & Readonly<{
  dtSec: number;
  stepCount: number;
  observationStride: number;
}>;

export type ObserveCommandV1 = CommandBaseV1<"observe">;

export type GetExactCheckpointCommandV1 =
  CommandBaseV1<"getExactCheckpoint">;

export type RestoreExactSessionCommandV1 =
  CommandBaseV1<"restoreExactSession"> & Readonly<{
    release: unknown;
    checkpoint: unknown;
  }>;

export type DisposeSessionCommandV1 = CommandBaseV1<"disposeSession">;

export type SettlePeriodicCommandV1 = CommandBaseV1<"settlePeriodic">;

export type ScientificCommandV1 =
  | CreateCanonicalSessionCommandV1
  | CreateResolvedSessionCommandV1
  | CreateOfficialPresetSessionCommandV1
  | RunTransientCommandV1
  | ObserveCommandV1
  | GetExactCheckpointCommandV1
  | RestoreExactSessionCommandV1
  | DisposeSessionCommandV1
  | SettlePeriodicCommandV1;

export type ScientificCommandErrorCodeV1 =
  | "invalid-command"
  | "duplicate-request-id"
  | "request-capacity-exceeded"
  | "command-queue-capacity-exceeded"
  | "duplicate-session-id"
  | "retired-session-id"
  | "unknown-session-id"
  | "session-capacity-exceeded"
  | "capability-unavailable"
  | "simulation-step-failed"
  | "session-creation-failed"
  | "resolved-session-input-rejected"
  | "official-preset-restore-rejected"
  | "checkpoint-failed"
  | "exact-restore-rejected"
  | "command-failed";

export type ScientificSessionOriginV1 =
  | Readonly<{
    kind: "canonical-cold-start";
    initializationProtocolId: string;
    initializationProtocolVersion: string;
  }>
  | Readonly<{
    kind: "resolved-session-input-cold-start";
    sessionInputSchemaId:
      "circleheart-main-wire-resolved-session-input-v1";
    sessionInputSchemaVersion: 1;
    sessionInputSha256: string;
    initializationProtocolId: string;
    initializationProtocolVersion: string;
  }>
  | Readonly<{
    kind: "exact-checkpoint-restore";
    checkpointSha256: string;
  }>
  | Readonly<{
    kind: "official-preset-exact-checkpoint-restore";
    presetId: "circleheart/official-healthy-periodic";
    presetVersion: "1.0.0";
    catalogSchemaId: "circleheart-official-preset-catalog-v1";
    catalogSchemaVersion: 1;
    manifestRawFileSha256: string;
    checkpointRawFileSha256: string;
    checkpointSha256: string;
    parameterization: "fixed-canonical-only";
  }>;

export type ScientificTransientExecutionProtocolV1 = Readonly<{
  protocolId: string;
  protocolVersion: string;
  classification: "approved-release-protocol" | "exploratory-parameterization";
  dtSec: number;
  stepCount: number;
  observationPolicy: Readonly<{
    kind: "accepted-step-stride";
    stride: number;
    finalAcceptedStateAlwaysIncluded: true;
  }>;
  commitPolicy: "each-step-atomic-partial-progress-retained";
}>;

export type ScientificPeriodicSettlementProgressV1<TObservableFrame> =
  Readonly<{
    kind: "periodic-settlement-progress";
    status: MainWireScientificPeriodicSettlementStatusV1;
    periodicSteadyStateClaimed: boolean;
    period2OrbitSuspected: boolean;
    trackerStartedThisCall: boolean;
    beatCompletedThisCall: boolean;
    completedStepCountThisCall: number;
    completedBeatCount: number;
    anchorAcceptedTimeSec: number;
    anchorPhase01: number;
    periodicity: MainWireFiveWallPeriodicClassificationV1;
    retainedBeatClosure: readonly MainWireScientificPeriodicBeatSummaryV1[];
    executionProtocol: Readonly<{
      protocolId: string;
      protocolVersion: string;
      cycleLengthSec: number;
      dtSec: number;
      stepsPerBeat: number;
      maximumBeatCount: number;
      maximumStepsPerCall: number;
      maximumBeatCountPerCall: 1;
      retainedBeatBoundaryCount: number;
      retainedClosureCount: number;
      commandProgression: string;
      hostCancellationBoundary: "between-calls";
      commitPolicy: "each-step-atomic-partial-progress-retained";
      failedTrialPromotion: false;
      trackerCheckpointPolicy: string;
    }>;
    finalObservableFrame: TObservableFrame;
  }>;

export type ScientificCommandSuccessPayloadByKindV1<TObservableFrame> =
  Readonly<{
    createCanonicalSession: Readonly<{
      kind: "sessionCreated";
      observableFrame: TObservableFrame;
    }>;
    createResolvedSession: Readonly<{
      kind: "resolvedSessionCreated";
      sessionInputSha256: string;
      observableFrame: TObservableFrame;
    }>;
    createOfficialPresetSession: Readonly<{
      kind: "officialPresetSessionCreated";
      presetId: "circleheart/official-healthy-periodic";
      presetVersion: "1.0.0";
      observableFrame: TObservableFrame;
    }>;
    runTransient: Readonly<{
      kind: "transientCompleted";
      requestedStepCount: number;
      completedStepCount: number;
      executionProtocol: ScientificTransientExecutionProtocolV1;
      observableFrames: readonly TObservableFrame[];
      finalObservableFrame: TObservableFrame;
    }>;
    observe: Readonly<{
      kind: "observation";
      observableFrame: TObservableFrame;
    }>;
    getExactCheckpoint: Readonly<{
      kind: "exactCheckpoint";
      checkpoint: MainWireScientificSessionExactCheckpointV2;
      observableFrame: TObservableFrame;
    }>;
    restoreExactSession: Readonly<{
      kind: "sessionRestored";
      observableFrame: TObservableFrame;
    }>;
    disposeSession: Readonly<{
      kind: "sessionDisposed";
      disposedSessionId: string;
    }>;
    settlePeriodic: ScientificPeriodicSettlementProgressV1<TObservableFrame>;
  }>;

export type ScientificSuccessfulCommandKindV1 =
  keyof ScientificCommandSuccessPayloadByKindV1<unknown>;

export type ScientificCommandSuccessPayloadV1<TObservableFrame> =
  ScientificCommandSuccessPayloadByKindV1<TObservableFrame>[
    ScientificSuccessfulCommandKindV1
  ];

export type ScientificCommandSuccessResponseForKindV1<
  TObservableFrame,
  TKind extends ScientificSuccessfulCommandKindV1,
> = Readonly<{
  protocolId: typeof SCIENTIFIC_COMMAND_PROTOCOL_V1_ID;
  ok: true;
  requestId: string;
  sessionId: string;
  releaseRef: SimulationReleaseRef;
  sessionOrigin: ScientificSessionOriginV1;
  commandKind: TKind;
  payload: ScientificCommandSuccessPayloadByKindV1<TObservableFrame>[TKind];
  error: null;
}>;

export type ScientificCommandSuccessResponseV1<TObservableFrame> = {
  [TKind in ScientificSuccessfulCommandKindV1]:
    ScientificCommandSuccessResponseForKindV1<TObservableFrame, TKind>;
}[ScientificSuccessfulCommandKindV1];

export type ScientificTransientPartialProgressV1<TObservableFrame> = Readonly<{
  kind: "transient-partial-progress";
  requestedStepCount: number;
  completedStepCount: number;
  executionProtocol: ScientificTransientExecutionProtocolV1;
  finalObservableFrame: TObservableFrame;
}>;

export type ScientificPeriodicSettlementPartialProgressV1<TObservableFrame> =
  Readonly<{
    kind: "periodic-settlement-partial-progress";
    status: "step-failure";
    completedStepCountThisCall: number;
    completedBeatCount: 0;
    periodicTrackerReset: true;
    acceptedStateUnchangedForFailedStep: true;
    finalObservableFrame: TObservableFrame;
  }>;

export type ScientificCommandErrorResponseV1<TObservableFrame> = Readonly<{
  protocolId: typeof SCIENTIFIC_COMMAND_PROTOCOL_V1_ID;
  ok: false;
  requestId: string | null;
  sessionId: string | null;
  releaseRef: SimulationReleaseRef | null;
  sessionOrigin: ScientificSessionOriginV1 | null;
  commandKind: ScientificCommandKindV1 | null;
  payload: null;
  error: Readonly<{
    code: ScientificCommandErrorCodeV1;
    message: string;
    retryable: false;
    silentFallbackApplied: false;
    observableFrames: readonly TObservableFrame[];
    partialProgress:
      | ScientificTransientPartialProgressV1<TObservableFrame>
      | ScientificPeriodicSettlementPartialProgressV1<TObservableFrame>
      | null;
  }>;
}>;

export type ScientificCommandResponseV1<TObservableFrame> =
  | ScientificCommandSuccessResponseV1<TObservableFrame>
  | ScientificCommandErrorResponseV1<TObservableFrame>;
