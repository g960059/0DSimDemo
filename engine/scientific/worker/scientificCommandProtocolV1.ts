import type {
  MainWireScientificSessionExactCheckpointV1,
} from "@/engine/scientific/runtime";
import type {
  SimulationReleaseRef,
} from "@/engine/scientific/release";

export const SCIENTIFIC_COMMAND_PROTOCOL_V1_ID =
  "circleheart-scientific-command-protocol-v1" as const;

export const SCIENTIFIC_COMMAND_KINDS_V1 = Object.freeze([
  "createCanonicalSession",
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
    kind: "exact-checkpoint-restore";
    checkpointSha256: string;
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

export type ScientificCommandSuccessPayloadByKindV1<TObservableFrame> =
  Readonly<{
    createCanonicalSession: Readonly<{
      kind: "sessionCreated";
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
      checkpoint: MainWireScientificSessionExactCheckpointV1;
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
    partialProgress: ScientificTransientPartialProgressV1<TObservableFrame>
      | null;
  }>;
}>;

export type ScientificCommandResponseV1<TObservableFrame> =
  | ScientificCommandSuccessResponseV1<TObservableFrame>
  | ScientificCommandErrorResponseV1<TObservableFrame>;
