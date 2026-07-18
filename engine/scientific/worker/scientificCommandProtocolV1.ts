import type {
  MainWireScientificPeriodicBeatSummaryV1,
  MainWireScientificPeriodicSettlementStatusV1,
  MainWireScientificSessionExactCheckpointV3,
} from "@/engine/scientific/runtime";
import type {
  MainWireFiveWallPeriodicClassificationV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import type {
  SimulationReleaseRef,
} from "@/engine/scientific/release";
import type {
  MainWireScientificCaseDocumentRefV1,
} from "@/engine/scientific/documents/MainWireScientificCaseDocumentV1";
import type {
  MainWireScientificPresetDocumentRefV1,
} from "@/engine/scientific/documents/MainWireScientificPresetDocumentV1";
import type {
  MainWireScientificWorkspaceDocumentV1,
  MainWireScientificWorkspaceDocumentRefV1,
} from "@/engine/scientific/documents/MainWireScientificWorkspaceDocumentV1";
import type {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1_SCHEMA_ID,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION,
  MainWireScientificResearchPresetIdV1,
} from "@/engine/scientific/presets/mainWireScientificResearchPresetCatalogV1";
import type {
  MainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";

export const SCIENTIFIC_COMMAND_PROTOCOL_V1_ID =
  "circleheart-scientific-command-protocol-v1" as const;

export const SCIENTIFIC_COMMAND_KINDS_V1 = Object.freeze([
  "createCanonicalSession",
  "createResolvedSession",
  "createOfficialPresetSession",
  "createOfficialDocumentCaseSession",
  "createResearchPresetSession",
  "createResearchDocumentCaseSession",
  "forkResearchControlSession",
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

/**
 * Starts the separately catalogued V3 official case. As with the retained V2
 * command, the browser may select only the exact identity/version; all bytes
 * and trust anchors are Worker-owned.
 */
export type CreateOfficialDocumentCaseSessionCommandV1 =
  CommandBaseV1<"createOfficialDocumentCaseSession"> & Readonly<{
    presetId: "circleheart/official-healthy-periodic";
    presetVersion: "1.0.0";
  }>;

/**
 * Starts one built-in research bracket by exact browser-safe catalog identity.
 * There is deliberately no parameter patch or caller-supplied release field.
 */
export type CreateResearchPresetSessionCommandV1 =
  CommandBaseV1<"createResearchPresetSession"> & Readonly<{
    presetId: MainWireScientificResearchPresetIdV1;
    presetVersion: typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION;
  }>;

/**
 * Starts one built-in research bracket through its content-addressed
 * Preset/Case/Workspace chain. The browser may submit identity and version
 * only; release, documents, and resolved parameters remain Worker-owned.
 */
export type CreateResearchDocumentCaseSessionCommandV1 =
  CommandBaseV1<"createResearchDocumentCaseSession"> & Readonly<{
    presetId: MainWireScientificResearchPresetIdV1;
    presetVersion: typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION;
  }>;

export type MainWireScientificAcceptedStateIdentityV0 = Readonly<{
  revision: number;
  acceptedTimeSec: number;
  totalBloodVolumeMl: number;
}>;

export type ScientificResearchControlContextV0 = Readonly<{
  stateIdentity: MainWireScientificAcceptedStateIdentityV0;
  controlState: MainWireScientificResearchControlTargetStateV0;
  parameterEpoch: number;
}>;

/**
 * Experimental release-bound state-preserving parameter transition. The
 * target receives a new sessionId while sourceSessionId remains active, so a
 * host can either promote the target after P1 or discard it during live reset.
 */
export type ForkResearchControlSessionCommandV0 =
  CommandBaseV1<"forkResearchControlSession"> & Readonly<{
    sourceSessionId: string;
    expectedSource: MainWireScientificAcceptedStateIdentityV0 & Readonly<{
      controlStateSha256: string;
      parameterEpoch: number;
    }>;
    targetControlState: MainWireScientificResearchControlTargetStateV0;
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
    resolvedSessionInput: unknown;
    checkpoint: unknown;
  }>;

export type DisposeSessionCommandV1 = CommandBaseV1<"disposeSession">;

export type SettlePeriodicCommandV1 = CommandBaseV1<"settlePeriodic">;

export type ScientificCommandV1 =
  | CreateCanonicalSessionCommandV1
  | CreateResolvedSessionCommandV1
  | CreateOfficialPresetSessionCommandV1
  | CreateOfficialDocumentCaseSessionCommandV1
  | CreateResearchPresetSessionCommandV1
  | CreateResearchDocumentCaseSessionCommandV1
  | ForkResearchControlSessionCommandV0
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
  | "official-document-case-restore-rejected"
  | "research-preset-resolution-rejected"
  | "research-document-case-resolution-rejected"
  | "research-control-fork-rejected"
  | "state-precondition-failed"
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
    checkpointSchemaVersion: 3;
    checkpointSha256: string;
    sessionInputSha256: string;
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
  }>
  | Readonly<{
    kind: "official-document-case-v3-exact-checkpoint-restore";
    presetId: "circleheart/official-healthy-periodic";
    presetVersion: "1.0.0";
    catalogSchemaId:
      "circleheart-official-scientific-document-chain-catalog-v1";
    catalogSchemaVersion: 1;
    catalogRawFileSha256: string;
    checkpointRawFileSha256: string;
    checkpointSha256: string;
    sessionInputSha256: string;
    caseRef: MainWireScientificCaseDocumentRefV1;
    workspaceRef: MainWireScientificWorkspaceDocumentRefV1;
    periodicSteadyStateClaimed: true;
    clinicalValidationClaimed: false;
  }>
  | Readonly<{
    kind: "research-preset-cold-start";
    presetId: MainWireScientificResearchPresetIdV1;
    presetVersion: typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION;
    catalogSchemaId:
      typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1_SCHEMA_ID;
    catalogSchemaVersion: 1;
    classification: "research-bracket-not-clinical";
    officialTrustClaimed: false;
    clinicalDiagnosisClaimed: false;
    periodicSteadyStateClaimed: false;
    releaseRef: SimulationReleaseRef;
    sessionInputSha256: string;
    initializationProtocolId: string;
    initializationProtocolVersion: string;
  }>
  | Readonly<{
    kind: "research-document-case-cold-start";
    presetId: MainWireScientificResearchPresetIdV1;
    presetVersion: typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION;
    catalogSchemaId:
      typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1_SCHEMA_ID;
    catalogSchemaVersion: 1;
    classification: "research-bracket-not-clinical";
    officialTrustClaimed: false;
    clinicalDiagnosisClaimed: false;
    periodicSteadyStateClaimed: false;
    releaseRef: SimulationReleaseRef;
    sessionInputSha256: string;
    presetRef: MainWireScientificPresetDocumentRefV1;
    caseRef: MainWireScientificCaseDocumentRefV1;
    workspaceRef: MainWireScientificWorkspaceDocumentRefV1;
    initializationProtocolId: string;
    initializationProtocolVersion: string;
  }>
  | Readonly<{
    kind: "research-control-state-preserving-fork-v0";
    classification: "research-only-experimental-not-clinical";
    releaseRef: SimulationReleaseRef;
    sourceSessionId: string;
    baseSessionInputSha256: string;
    sourceControlStateSha256: string;
    targetControlStateSha256: string;
    parameterEpoch: number;
    transitionProtocolId:
      "main-wire-research-control-state-preserving-fork-v0";
    transitionProtocolVersion: "0.0.0";
    acceptedStatePreservedAtFork: true;
    periodicTrackerResetAtFork: true;
    sourceSessionRetainedAtFork: true;
    exactCheckpointCapability:
      "unavailable-until-control-aware-checkpoint-v4";
    periodicSteadyStateClaimed: false;
    officialTrustClaimed: false;
    clinicalDiagnosisClaimed: false;
    clinicalValidationClaimed: false;
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
    createOfficialDocumentCaseSession: Readonly<{
      kind: "officialDocumentCaseSessionCreated";
      presetId: "circleheart/official-healthy-periodic";
      presetVersion: "1.0.0";
      checkpointSha256: string;
      sessionInputSha256: string;
      caseRef: MainWireScientificCaseDocumentRefV1;
      workspaceRef: MainWireScientificWorkspaceDocumentRefV1;
      periodicSteadyStateClaimed: true;
      researchControlContext: ScientificResearchControlContextV0;
      observableFrame: TObservableFrame;
    }>;
    createResearchPresetSession: Readonly<{
      kind: "researchPresetSessionCreated";
      presetId: MainWireScientificResearchPresetIdV1;
      presetVersion: typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION;
      classification: "research-bracket-not-clinical";
      officialTrustClaimed: false;
      clinicalDiagnosisClaimed: false;
      periodicSteadyStateClaimed: false;
      sessionInputSha256: string;
      observableFrame: TObservableFrame;
    }>;
    createResearchDocumentCaseSession: Readonly<{
      kind: "researchDocumentCaseSessionCreated";
      presetId: MainWireScientificResearchPresetIdV1;
      presetVersion: typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION;
      classification: "research-bracket-not-clinical";
      officialTrustClaimed: false;
      clinicalDiagnosisClaimed: false;
      periodicSteadyStateClaimed: false;
      sessionInputSha256: string;
      presetRef: MainWireScientificPresetDocumentRefV1;
      caseRef: MainWireScientificCaseDocumentRefV1;
      workspaceRef: MainWireScientificWorkspaceDocumentRefV1;
      workspaceDocument: MainWireScientificWorkspaceDocumentV1;
      observableFrame: TObservableFrame;
    }>;
    forkResearchControlSession: Readonly<{
      kind: "researchControlSessionForked";
      sourceSessionId: string;
      sourceStateIdentity: MainWireScientificAcceptedStateIdentityV0;
      targetStateIdentity: MainWireScientificAcceptedStateIdentityV0;
      sourceControlStateSha256: string;
      targetControlState:
        MainWireScientificResearchControlTargetStateV0;
      parameterEpoch: number;
      acceptedStatePreservedAtFork: true;
      periodicTrackerResetAtFork: true;
      sourceSessionRetainedAtFork: true;
      exactCheckpointAvailable: false;
      periodicSteadyStateClaimed: false;
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
      checkpoint: MainWireScientificSessionExactCheckpointV3;
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
