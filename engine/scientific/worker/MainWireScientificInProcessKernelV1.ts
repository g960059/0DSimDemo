import {
  projectMainWireScientificObservationV1,
  type MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import {
  canonicalJsonStringify,
  deepFreezeCanonicalJson,
  SHA256_HEX_PATTERN,
  type CanonicalJsonValue,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  MainWireScientificSessionV1,
  createMainWireScientificSessionV1,
  initializeMainWireScientificSessionFromResolvedInputV1,
} from "@/engine/scientific/runtime";
import type {
  BundledOfficialHealthyPeriodicPresetIdentityV1,
  LoadedBundledOfficialHealthyPeriodicPresetV1,
} from "@/engine/scientific/presets";
import {
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING,
  OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_SCHEMA_ID,
} from "@/engine/scientific/presets";
import {
  OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_BINDING,
  OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_SCHEMA_ID,
  type LoadedOfficialHealthyPeriodicDocumentChainV1,
  type OfficialHealthyPeriodicDocumentChainIdentityV1,
} from "@/engine/scientific/documents";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1_SCHEMA_ID,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_IDS_V1,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION,
} from "@/engine/scientific/presets/mainWireScientificResearchPresetCatalogV1";
import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_INITIALIZATION_PROTOCOL_V1_ID,
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_TRANSIENT_POLICY_V1,
} from "@/engine/scientific/assembly";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CLOSED_LOOP_V1_ID,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  SCIENTIFIC_COMMAND_KINDS_V1,
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificCommandErrorCodeV1,
  type ScientificCommandErrorResponseV1,
  type ScientificCommandKindV1,
  type ScientificCommandResponseV1,
  type ScientificCommandSuccessPayloadByKindV1,
  type ScientificCommandSuccessResponseForKindV1,
  type ScientificSessionOriginV1,
  type ScientificSuccessfulCommandKindV1,
  type ScientificTransientExecutionProtocolV1,
  type ScientificTransientPartialProgressV1,
  type ScientificPeriodicSettlementPartialProgressV1,
  type ScientificCommandV1,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import {
  resolveMainWireScientificResearchPresetV1,
} from "@/engine/scientific/worker/MainWireScientificResearchPresetResolverV1";

export const MAIN_WIRE_SCIENTIFIC_IN_PROCESS_KERNEL_V1_ID =
  "main-wire-scientific-in-process-kernel-v1" as const;

export const MAIN_WIRE_SCIENTIFIC_IN_PROCESS_KERNEL_V1_CLAIM = Object.freeze({
  hostNeutral: true as const,
  transportOwnedHere: false as const,
  boundedSessionOwnership: true as const,
  boundedCommandQueue: true as const,
  boundedCommandPayload: true as const,
  boundedOutputFrames: true as const,
  requestReplayRejected: true as const,
  retiredSessionIdReuseRejected: true as const,
  commandSubmissionOrderSerialized: true as const,
  randomIdentifiersGenerated: false as const,
  wallClockIdentifiersGenerated: false as const,
  internalSessionObjectsReturned: false as const,
  silentFallbackApplied: false as const,
  legacyBackendFallbackAvailable: false as const,
  periodicSettlementCapability:
    "release-bound-one-beat-progress-per-command" as const,
  periodicSettlementHostCancellationBoundary: "between-commands" as const,
  officialPresetCapability:
    "host-injected-bundled-catalog-identity-only-exact-checkpoint-restore" as const,
  officialPresetArbitraryAssetInputAccepted: false as const,
  officialDocumentCaseCapability:
    "host-injected-pinned-document-chain-identity-only-v3-restore" as const,
  officialDocumentCaseArbitraryAssetInputAccepted: false as const,
  officialDocumentCaseSilentV2SubstitutionApplied: false as const,
  researchPresetCapability:
    "built-in-catalog-id-version-only-cold-start" as const,
  researchPresetOfficialTrustClaimed: false as const,
  researchPresetClinicalDiagnosisClaimed: false as const,
  researchPresetPeriodicSteadyStateClaimedAtCreation: false as const,
  researchPresetArbitraryParameterPatchAccepted: false as const,
  resolvedSessionInputCapability:
    "complete-input-release-bound-revalidation" as const,
  resolvedSessionArbitraryParameterPatchAccepted: false as const,
  genericExactCheckpointCapability:
    "v3-exact-release-and-session-input-bound" as const,
  genericExactRestoreCallerSuppliedReleaseAccepted: false as const,
  legacyV2RestoreCapability:
    "official-fixed-canonical-preset-internal-only" as const,
});

export type MainWireScientificCommandResponseV1 =
  ScientificCommandResponseV1<MainWireScientificObservableFrameV1>;

export type MainWireScientificInProcessKernelOptionsV1 = Readonly<{
  maximumSessionCount?: number;
  maximumTransientStepCountPerCommand?: number;
  maximumOutputFrameCountPerCommand?: number;
  maximumQueuedCommandCount?: number;
  maximumRequestCountPerKernelLifetime?: number;
  maximumSessionIdentityCountPerKernelLifetime?: number;
  maximumCommandJsonBytes?: number;
  maximumCommandJsonNodeCount?: number;
  officialPresetLoader?: MainWireScientificOfficialPresetLoaderV1;
  officialDocumentCaseLoader?: MainWireScientificOfficialDocumentCaseLoaderV1;
}>;

export type MainWireScientificOfficialPresetLoaderV1 = (
  identity: BundledOfficialHealthyPeriodicPresetIdentityV1,
) => Promise<LoadedBundledOfficialHealthyPeriodicPresetV1>;

export type MainWireScientificOfficialDocumentCaseLoaderV1 = (
  identity: OfficialHealthyPeriodicDocumentChainIdentityV1,
) => Promise<LoadedOfficialHealthyPeriodicDocumentChainV1>;

type CapturedInput = Readonly<{
  value: CanonicalJsonValue | null;
  captureError: string | null;
  identity: ReturnType<typeof partialIdentity>;
}>;

type ParseResult =
  | Readonly<{ ok: true; command: ScientificCommandV1 }>
  | Readonly<{
    ok: false;
    requestId: string | null;
    sessionId: string | null;
    commandKind: ScientificCommandKindV1 | null;
    message: string;
  }>;

const DEFAULT_MAXIMUM_SESSION_COUNT = 4;
const DEFAULT_MAXIMUM_TRANSIENT_STEP_COUNT = 4;
const DEFAULT_MAXIMUM_OUTPUT_FRAME_COUNT = 4;
const DEFAULT_MAXIMUM_QUEUED_COMMAND_COUNT = 8;
const DEFAULT_MAXIMUM_REQUEST_COUNT = 8_192;
const DEFAULT_MAXIMUM_SESSION_IDENTITY_COUNT = 256;
const DEFAULT_MAXIMUM_COMMAND_JSON_BYTES = 2 * 1024 * 1024;
const DEFAULT_MAXIMUM_COMMAND_JSON_NODE_COUNT = 200_000;
const MAXIMUM_CONFIGURED_SESSION_COUNT = 64;
const MAXIMUM_CONFIGURED_TRANSIENT_STEP_COUNT = 64;
const MAXIMUM_CONFIGURED_OUTPUT_FRAME_COUNT = 64;
const MAXIMUM_CONFIGURED_QUEUED_COMMAND_COUNT = 64;
const MAXIMUM_CONFIGURED_REQUEST_COUNT = 100_000;
const MAXIMUM_CONFIGURED_SESSION_IDENTITY_COUNT = 4_096;
const MAXIMUM_CONFIGURED_COMMAND_JSON_BYTES = 16 * 1024 * 1024;
const MAXIMUM_CONFIGURED_COMMAND_JSON_NODE_COUNT = 1_000_000;
const CANONICAL_COLD_SESSION_ORIGIN = Object.freeze({
  kind: "canonical-cold-start" as const,
  initializationProtocolId:
    MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_INITIALIZATION_PROTOCOL_V1_ID,
  initializationProtocolVersion: "1.0.0" as const,
});
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export class MainWireScientificInProcessKernelV1 {
  readonly kernelId = MAIN_WIRE_SCIENTIFIC_IN_PROCESS_KERNEL_V1_ID;
  readonly claim = MAIN_WIRE_SCIENTIFIC_IN_PROCESS_KERNEL_V1_CLAIM;
  readonly maximumSessionCount: number;
  readonly maximumTransientStepCountPerCommand: number;
  readonly maximumOutputFrameCountPerCommand: number;
  readonly maximumQueuedCommandCount: number;
  readonly maximumRequestCountPerKernelLifetime: number;
  readonly maximumSessionIdentityCountPerKernelLifetime: number;
  readonly maximumCommandJsonBytes: number;
  readonly maximumCommandJsonNodeCount: number;
  private readonly officialPresetLoader:
    MainWireScientificOfficialPresetLoaderV1 | null;
  private readonly officialDocumentCaseLoader:
    MainWireScientificOfficialDocumentCaseLoaderV1 | null;

  private readonly sessions = new Map<string, MainWireScientificSessionV1>();
  private readonly sessionOrigins = new Map<string, ScientificSessionOriginV1>();
  private readonly allocatedSessionIds = new Set<string>();
  private readonly seenRequestIds = new Set<string>();
  private queuedCommandCount = 0;
  private commandTail: Promise<void> = Promise.resolve();

  constructor(options: MainWireScientificInProcessKernelOptionsV1 = {}) {
    this.officialPresetLoader = options.officialPresetLoader ?? null;
    this.officialDocumentCaseLoader =
      options.officialDocumentCaseLoader ?? null;
    this.maximumSessionCount = boundedPositiveInteger(
      options.maximumSessionCount ?? DEFAULT_MAXIMUM_SESSION_COUNT,
      MAXIMUM_CONFIGURED_SESSION_COUNT,
      "maximumSessionCount",
    );
    this.maximumTransientStepCountPerCommand = boundedPositiveInteger(
      options.maximumTransientStepCountPerCommand
        ?? DEFAULT_MAXIMUM_TRANSIENT_STEP_COUNT,
      MAXIMUM_CONFIGURED_TRANSIENT_STEP_COUNT,
      "maximumTransientStepCountPerCommand",
    );
    this.maximumOutputFrameCountPerCommand = boundedPositiveInteger(
      options.maximumOutputFrameCountPerCommand
        ?? DEFAULT_MAXIMUM_OUTPUT_FRAME_COUNT,
      MAXIMUM_CONFIGURED_OUTPUT_FRAME_COUNT,
      "maximumOutputFrameCountPerCommand",
    );
    this.maximumQueuedCommandCount = boundedPositiveInteger(
      options.maximumQueuedCommandCount ?? DEFAULT_MAXIMUM_QUEUED_COMMAND_COUNT,
      MAXIMUM_CONFIGURED_QUEUED_COMMAND_COUNT,
      "maximumQueuedCommandCount",
    );
    this.maximumRequestCountPerKernelLifetime = boundedPositiveInteger(
      options.maximumRequestCountPerKernelLifetime
        ?? DEFAULT_MAXIMUM_REQUEST_COUNT,
      MAXIMUM_CONFIGURED_REQUEST_COUNT,
      "maximumRequestCountPerKernelLifetime",
    );
    this.maximumSessionIdentityCountPerKernelLifetime = boundedPositiveInteger(
      options.maximumSessionIdentityCountPerKernelLifetime
        ?? DEFAULT_MAXIMUM_SESSION_IDENTITY_COUNT,
      MAXIMUM_CONFIGURED_SESSION_IDENTITY_COUNT,
      "maximumSessionIdentityCountPerKernelLifetime",
    );
    this.maximumCommandJsonBytes = boundedPositiveInteger(
      options.maximumCommandJsonBytes ?? DEFAULT_MAXIMUM_COMMAND_JSON_BYTES,
      MAXIMUM_CONFIGURED_COMMAND_JSON_BYTES,
      "maximumCommandJsonBytes",
    );
    this.maximumCommandJsonNodeCount = boundedPositiveInteger(
      options.maximumCommandJsonNodeCount
        ?? DEFAULT_MAXIMUM_COMMAND_JSON_NODE_COUNT,
      MAXIMUM_CONFIGURED_COMMAND_JSON_NODE_COUNT,
      "maximumCommandJsonNodeCount",
    );
  }

  activeSessionCount(): number {
    return this.sessions.size;
  }

  handle(untrustedCommand: unknown): Promise<MainWireScientificCommandResponseV1> {
    const identity = captureOuterIdentity(untrustedCommand);
    const admissionError = this.requestAdmissionError(identity);
    if (admissionError !== null) return Promise.resolve(admissionError);
    if (this.queuedCommandCount >= this.maximumQueuedCommandCount) {
      return Promise.resolve(errorResponse(
        identity.requestId,
        identity.sessionId,
        this.releaseRefForSession(identity.sessionId),
        this.originForSession(identity.sessionId),
        identity.commandKind,
        "command-queue-capacity-exceeded",
        `command queue capacity ${this.maximumQueuedCommandCount} is exhausted`,
      ));
    }
    const captured = captureInput(
      untrustedCommand,
      identity,
      this.maximumCommandJsonBytes,
      this.maximumCommandJsonNodeCount,
    );
    this.queuedCommandCount += 1;
    const operation = this.commandTail.then(async () => {
      try {
        return await this.dispatch(captured);
      } catch (error) {
        return errorResponse(
          captured.identity.requestId,
          captured.identity.sessionId,
          this.releaseRefForSession(captured.identity.sessionId),
          this.originForSession(captured.identity.sessionId),
          captured.identity.commandKind,
          "command-failed",
          errorMessage(error),
        );
      }
    }).finally(() => {
      this.queuedCommandCount -= 1;
    });
    this.commandTail = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }

  private async dispatch(
    captured: CapturedInput,
  ): Promise<MainWireScientificCommandResponseV1> {
    if (captured.captureError !== null) {
      return errorResponse(
        captured.identity.requestId,
        captured.identity.sessionId,
        this.releaseRefForSession(captured.identity.sessionId),
        this.originForSession(captured.identity.sessionId),
        captured.identity.commandKind,
        "invalid-command",
        captured.captureError,
      );
    }
    const parsed = parseCommand(
      captured.value,
      this.maximumTransientStepCountPerCommand,
      this.maximumOutputFrameCountPerCommand,
    );
    if (parsed.ok === false) {
      return errorResponse(
        parsed.requestId,
        parsed.sessionId,
        this.releaseRefForSession(parsed.sessionId),
        this.originForSession(parsed.sessionId),
        parsed.commandKind,
        "invalid-command",
        parsed.message,
      );
    }
    const command = parsed.command;
    switch (command.kind) {
      case "createCanonicalSession":
        return this.createCanonical(command);
      case "createResolvedSession":
        return this.createResolved(command);
      case "createOfficialPresetSession":
        return this.createOfficialPreset(command);
      case "createOfficialDocumentCaseSession":
        return this.createOfficialDocumentCase(command);
      case "createResearchPresetSession":
        return this.createResearchPreset(command);
      case "runTransient":
        return this.runTransient(command);
      case "observe":
        return this.observe(command);
      case "getExactCheckpoint":
        return this.getExactCheckpoint(command);
      case "restoreExactSession":
        return this.restoreExact(command);
      case "disposeSession":
        return this.dispose(command);
      case "settlePeriodic":
        return this.settlePeriodic(command);
    }
  }

  private async createCanonical(
    command: Extract<ScientificCommandV1, { kind: "createCanonicalSession" }>,
  ): Promise<MainWireScientificCommandResponseV1> {
    const allocationError = this.sessionAllocationError(command);
    if (allocationError !== null) return allocationError;
    try {
      const session = await createMainWireScientificSessionV1();
      const observableFrame = project(session);
      const response = successResponse(
        command,
        session.releaseRef,
        CANONICAL_COLD_SESSION_ORIGIN,
        Object.freeze({
          kind: "sessionCreated" as const,
          observableFrame,
        }),
      );
      this.sessions.set(command.sessionId, session);
      this.sessionOrigins.set(command.sessionId, CANONICAL_COLD_SESSION_ORIGIN);
      this.allocatedSessionIds.add(command.sessionId);
      return response;
    } catch (error) {
      return errorResponseForCommand(
        command,
        "session-creation-failed",
        errorMessage(error),
      );
    }
  }

  private async createResolved(
    command: Extract<ScientificCommandV1, { kind: "createResolvedSession" }>,
  ): Promise<MainWireScientificCommandResponseV1> {
    const allocationError = this.sessionAllocationError(command);
    if (allocationError !== null) return allocationError;
    try {
      // The command never selects or supplies a release. The Worker owns the
      // immutable artifact and the session initializer revalidates the whole
      // untrusted input by release-bound semantic re-resolution.
      const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
      const session =
        await initializeMainWireScientificSessionFromResolvedInputV1(
          release,
          command.resolvedSessionInput,
        );
      const observableFrame = project(session);
      const sessionOrigin = Object.freeze({
        kind: "resolved-session-input-cold-start" as const,
        sessionInputSchemaId: session.sessionInput.schemaId,
        sessionInputSchemaVersion: session.sessionInput.schemaVersion,
        sessionInputSha256: session.sessionInputSha256,
        initializationProtocolId:
          session.sessionInput.initialization.protocolId,
        initializationProtocolVersion:
          session.sessionInput.initialization.protocolVersion,
      });
      const response = successResponse(
        command,
        session.releaseRef,
        sessionOrigin,
        Object.freeze({
          kind: "resolvedSessionCreated" as const,
          sessionInputSha256: session.sessionInputSha256,
          observableFrame,
        }),
      );
      this.sessions.set(command.sessionId, session);
      this.sessionOrigins.set(command.sessionId, sessionOrigin);
      this.allocatedSessionIds.add(command.sessionId);
      return response;
    } catch (error) {
      return errorResponseForCommand(
        command,
        "resolved-session-input-rejected",
        errorMessage(error),
      );
    }
  }

  private async createOfficialPreset(
    command: Extract<ScientificCommandV1, {
      kind: "createOfficialPresetSession";
    }>,
  ): Promise<MainWireScientificCommandResponseV1> {
    const allocationError = this.sessionAllocationError(command);
    if (allocationError !== null) return allocationError;
    if (this.officialPresetLoader === null) {
      return errorResponseForCommand(
        command,
        "capability-unavailable",
        "official preset assets are not bound to this host-neutral kernel",
      );
    }
    try {
      const loaded = await this.officialPresetLoader({
        presetId: command.presetId,
        presetVersion: command.presetVersion,
      });
      assertOfficialPresetLoadMatchesCommand(command, loaded);
      const session = await MainWireScientificSessionV1
        .restoreLegacyCanonicalExactV2(
          loaded.release,
          loaded.checkpoint,
        );
      const observableFrame = project(session);
      const sessionOrigin = Object.freeze({
        kind: "official-preset-exact-checkpoint-restore" as const,
        presetId: loaded.identity.presetId,
        presetVersion: loaded.identity.presetVersion,
        catalogSchemaId: OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_SCHEMA_ID,
        catalogSchemaVersion: 1 as const,
        manifestRawFileSha256:
          OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING
            .manifestRawFileSha256,
        checkpointRawFileSha256:
          OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING
            .checkpointRawFileSha256,
        checkpointSha256:
          OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING
            .checkpointSha256,
        parameterization: "fixed-canonical-only" as const,
      });
      const response = successResponse(
        command,
        session.releaseRef,
        sessionOrigin,
        Object.freeze({
          kind: "officialPresetSessionCreated" as const,
          presetId: loaded.identity.presetId,
          presetVersion: loaded.identity.presetVersion,
          observableFrame,
        }),
      );
      this.sessions.set(command.sessionId, session);
      this.sessionOrigins.set(command.sessionId, sessionOrigin);
      this.allocatedSessionIds.add(command.sessionId);
      return response;
    } catch (error) {
      return errorResponseForCommand(
        command,
        "official-preset-restore-rejected",
        errorMessage(error),
      );
    }
  }

  private async createOfficialDocumentCase(
    command: Extract<ScientificCommandV1, {
      kind: "createOfficialDocumentCaseSession";
    }>,
  ): Promise<MainWireScientificCommandResponseV1> {
    const allocationError = this.sessionAllocationError(command);
    if (allocationError !== null) return allocationError;
    if (this.officialDocumentCaseLoader === null) {
      return errorResponseForCommand(
        command,
        "capability-unavailable",
        "official V3 document-chain assets are not bound to this host-neutral kernel",
      );
    }
    try {
      const loaded = await this.officialDocumentCaseLoader({
        presetId: command.presetId,
        presetVersion: command.presetVersion,
      });
      assertOfficialDocumentCaseLoadMatchesCommand(command, loaded);
      const session = await MainWireScientificSessionV1.restoreExactV3(
        loaded.release,
        loaded.caseDocument.content.resolvedSessionInput,
        loaded.checkpoint,
      );
      if (
        session.sessionInputSha256 !== loaded.provenance.sessionInputSha256
        || !sameReleaseRef(session.releaseRef, loaded.release.ref)
      ) throw new Error("restored V3 session identity does not match its official case");
      const terminal = session.settlePeriodic();
      if (
        !terminal.completed
        || terminal.status !== "period1-converged"
        || !terminal.periodicSteadyStateClaimed
        || terminal.period2OrbitSuspected
        || terminal.beatCompletedThisCall
        || terminal.completedStepCountThisCall !== 0
      ) throw new Error("restored V3 case did not preserve terminal P1 state");

      const observableFrame = project(session);
      const binding =
        OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_BINDING;
      const sessionOrigin = Object.freeze({
        kind:
          "official-document-case-v3-exact-checkpoint-restore" as const,
        presetId: loaded.identity.presetId,
        presetVersion: loaded.identity.presetVersion,
        catalogSchemaId:
          OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_SCHEMA_ID,
        catalogSchemaVersion: 1 as const,
        catalogRawFileSha256: binding.rawFileSha256,
        checkpointRawFileSha256: binding.checkpointRawFileSha256,
        checkpointSha256: binding.checkpointSha256,
        sessionInputSha256: binding.sessionInputSha256,
        caseRef: Object.freeze({ ...binding.caseRef }),
        workspaceRef: Object.freeze({ ...binding.workspaceRef }),
        periodicSteadyStateClaimed: true as const,
        clinicalValidationClaimed: false as const,
      });
      const response = successResponse(
        command,
        session.releaseRef,
        sessionOrigin,
        Object.freeze({
          kind: "officialDocumentCaseSessionCreated" as const,
          presetId: loaded.identity.presetId,
          presetVersion: loaded.identity.presetVersion,
          checkpointSha256: binding.checkpointSha256,
          sessionInputSha256: binding.sessionInputSha256,
          caseRef: Object.freeze({ ...binding.caseRef }),
          workspaceRef: Object.freeze({ ...binding.workspaceRef }),
          periodicSteadyStateClaimed: true as const,
          observableFrame,
        }),
      );
      this.sessions.set(command.sessionId, session);
      this.sessionOrigins.set(command.sessionId, sessionOrigin);
      this.allocatedSessionIds.add(command.sessionId);
      return response;
    } catch (error) {
      return errorResponseForCommand(
        command,
        "official-document-case-restore-rejected",
        errorMessage(error),
      );
    }
  }

  private async createResearchPreset(
    command: Extract<ScientificCommandV1, {
      kind: "createResearchPresetSession";
    }>,
  ): Promise<MainWireScientificCommandResponseV1> {
    const allocationError = this.sessionAllocationError(command);
    if (allocationError !== null) return allocationError;
    try {
      const resolved = await resolveMainWireScientificResearchPresetV1({
        presetId: command.presetId,
        presetVersion: command.presetVersion,
      });
      // The Worker, never the browser command, owns the immutable release.
      const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
      if (!sameReleaseRef(release.ref, resolved.releaseRef)) {
        throw new Error("research preset resolver release does not match the immutable Worker release");
      }
      const session =
        await initializeMainWireScientificSessionFromResolvedInputV1(
          release,
          resolved.resolvedSessionInput,
        );
      if (
        session.sessionInputSha256
          !== resolved.resolvedSessionInput.sessionInputSha256
        || !sameReleaseRef(session.releaseRef, resolved.releaseRef)
      ) {
        throw new Error("research preset session identity does not match its resolved input");
      }
      const observableFrame = project(session);
      const sessionOrigin = Object.freeze({
        kind: "research-preset-cold-start" as const,
        presetId: resolved.preset.presetId,
        presetVersion: resolved.preset.presetVersion,
        catalogSchemaId:
          MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1_SCHEMA_ID,
        catalogSchemaVersion: 1 as const,
        classification: "research-bracket-not-clinical" as const,
        officialTrustClaimed: false as const,
        clinicalDiagnosisClaimed: false as const,
        periodicSteadyStateClaimed: false as const,
        releaseRef: copyReleaseRef(session.releaseRef),
        sessionInputSha256: session.sessionInputSha256,
        initializationProtocolId:
          session.sessionInput.initialization.protocolId,
        initializationProtocolVersion:
          session.sessionInput.initialization.protocolVersion,
      });
      const response = successResponse(
        command,
        session.releaseRef,
        sessionOrigin,
        Object.freeze({
          kind: "researchPresetSessionCreated" as const,
          presetId: resolved.preset.presetId,
          presetVersion: resolved.preset.presetVersion,
          classification: "research-bracket-not-clinical" as const,
          officialTrustClaimed: false as const,
          clinicalDiagnosisClaimed: false as const,
          periodicSteadyStateClaimed: false as const,
          sessionInputSha256: session.sessionInputSha256,
          observableFrame,
        }),
      );
      this.sessions.set(command.sessionId, session);
      this.sessionOrigins.set(command.sessionId, sessionOrigin);
      this.allocatedSessionIds.add(command.sessionId);
      return response;
    } catch (error) {
      return errorResponseForCommand(
        command,
        "research-preset-resolution-rejected",
        errorMessage(error),
      );
    }
  }

  private runTransient(
    command: Extract<ScientificCommandV1, { kind: "runTransient" }>,
  ): MainWireScientificCommandResponseV1 {
    const session = this.sessions.get(command.sessionId);
    if (session === undefined) return unknownSession(command);
    const sessionOrigin = this.requiredSessionOrigin(command.sessionId);
    const executionProtocol = transientExecutionProtocol(command);
    const observableFrames: MainWireScientificObservableFrameV1[] = [];
    for (let index = 0; index < command.stepCount; index += 1) {
      const stepped = session.step(command.dtSec);
      if (stepped.converged === false) {
        const finalObservableFrame = project(session);
        return errorResponseForCommand(
          command,
          "simulation-step-failed",
          stepped.message,
          {
            releaseRef: session.releaseRef,
            sessionOrigin,
            observableFrames:
              appendDistinctFinalFrame(observableFrames, finalObservableFrame),
            partialProgress: Object.freeze({
              kind: "transient-partial-progress" as const,
              requestedStepCount: command.stepCount,
              completedStepCount: index,
              executionProtocol,
              finalObservableFrame,
            }),
          },
        );
      }
      const completedStepCount = index + 1;
      if (
        completedStepCount % command.observationStride === 0
        || completedStepCount === command.stepCount
      ) observableFrames.push(projectObservation(stepped.observation));
    }
    const finalObservableFrame = project(session);
    return successResponse(command, session.releaseRef, sessionOrigin, Object.freeze({
      kind: "transientCompleted" as const,
      requestedStepCount: command.stepCount,
      completedStepCount: command.stepCount,
      executionProtocol,
      observableFrames: Object.freeze(observableFrames),
      finalObservableFrame,
    }));
  }

  private observe(
    command: Extract<ScientificCommandV1, { kind: "observe" }>,
  ): MainWireScientificCommandResponseV1 {
    const session = this.sessions.get(command.sessionId);
    if (session === undefined) return unknownSession(command);
    return successResponse(
      command,
      session.releaseRef,
      this.requiredSessionOrigin(command.sessionId),
      Object.freeze({
        kind: "observation" as const,
        observableFrame: project(session),
      }),
    );
  }

  private async getExactCheckpoint(
    command: Extract<ScientificCommandV1, { kind: "getExactCheckpoint" }>,
  ): Promise<MainWireScientificCommandResponseV1> {
    const session = this.sessions.get(command.sessionId);
    if (session === undefined) return unknownSession(command);
    try {
      const checkpoint = await session.checkpointExact();
      return successResponse(
        command,
        session.releaseRef,
        this.requiredSessionOrigin(command.sessionId),
        Object.freeze({
          kind: "exactCheckpoint" as const,
          checkpoint,
          observableFrame: project(session),
        }),
      );
    } catch (error) {
      return errorResponseForCommand(
        command,
        "checkpoint-failed",
        errorMessage(error),
        {
          releaseRef: session.releaseRef,
          sessionOrigin: this.requiredSessionOrigin(command.sessionId),
        },
      );
    }
  }

  private async restoreExact(
    command: Extract<ScientificCommandV1, { kind: "restoreExactSession" }>,
  ): Promise<MainWireScientificCommandResponseV1> {
    const allocationError = this.sessionAllocationError(command);
    if (allocationError !== null) return allocationError;
    try {
      const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
      const session = await MainWireScientificSessionV1.restoreExact(
        release,
        command.resolvedSessionInput,
        command.checkpoint,
      );
      const observableFrame = project(session);
      const sessionOrigin = exactRestoreOrigin(command, session);
      const response = successResponse(
        command,
        session.releaseRef,
        sessionOrigin,
        Object.freeze({
          kind: "sessionRestored" as const,
          observableFrame,
        }),
      );
      this.sessions.set(command.sessionId, session);
      this.sessionOrigins.set(command.sessionId, sessionOrigin);
      this.allocatedSessionIds.add(command.sessionId);
      return response;
    } catch (error) {
      return errorResponseForCommand(
        command,
        "exact-restore-rejected",
        errorMessage(error),
      );
    }
  }

  private dispose(
    command: Extract<ScientificCommandV1, { kind: "disposeSession" }>,
  ): MainWireScientificCommandResponseV1 {
    const session = this.sessions.get(command.sessionId);
    if (session === undefined) return unknownSession(command);
    const sessionOrigin = this.requiredSessionOrigin(command.sessionId);
    const response = successResponse(
      command,
      session.releaseRef,
      sessionOrigin,
      Object.freeze({
        kind: "sessionDisposed" as const,
        disposedSessionId: command.sessionId,
      }),
    );
    this.sessions.delete(command.sessionId);
    this.sessionOrigins.delete(command.sessionId);
    return response;
  }

  private settlePeriodic(
    command: Extract<ScientificCommandV1, { kind: "settlePeriodic" }>,
  ): MainWireScientificCommandResponseV1 {
    const session = this.sessions.get(command.sessionId);
    if (session === undefined) return unknownSession(command);
    const sessionOrigin = this.requiredSessionOrigin(command.sessionId);
    const settlement = session.settlePeriodic();
    const finalObservableFrame = project(session);
    if (settlement.completed === false) {
      return errorResponseForCommand(
        command,
        "simulation-step-failed",
        settlement.message,
        {
          releaseRef: session.releaseRef,
          sessionOrigin,
          observableFrames: Object.freeze([finalObservableFrame]),
          partialProgress: Object.freeze({
            kind: "periodic-settlement-partial-progress" as const,
            status: settlement.status,
            completedStepCountThisCall: settlement.completedStepCountThisCall,
            completedBeatCount: 0 as const,
            periodicTrackerReset: true as const,
            acceptedStateUnchangedForFailedStep: true as const,
            finalObservableFrame,
          }),
        },
      );
    }
    return successResponse(
      command,
      session.releaseRef,
      sessionOrigin,
      Object.freeze({
        kind: "periodic-settlement-progress" as const,
        status: settlement.status,
        periodicSteadyStateClaimed: settlement.periodicSteadyStateClaimed,
        period2OrbitSuspected: settlement.period2OrbitSuspected,
        trackerStartedThisCall: settlement.trackerStartedThisCall,
        beatCompletedThisCall: settlement.beatCompletedThisCall,
        completedStepCountThisCall: settlement.completedStepCountThisCall,
        completedBeatCount: settlement.completedBeatCount,
        anchorAcceptedTimeSec: settlement.anchorAcceptedTimeSec,
        anchorPhase01: settlement.anchorPhase01,
        periodicity: settlement.periodicity,
        retainedBeatClosure: settlement.retainedBeatClosure,
        executionProtocol: settlement.executionProtocol,
        finalObservableFrame,
      }),
    );
  }

  private sessionAllocationError(
    command: Extract<ScientificCommandV1, {
      kind:
        | "createCanonicalSession"
        | "createResolvedSession"
        | "createOfficialPresetSession"
        | "createOfficialDocumentCaseSession"
        | "createResearchPresetSession"
        | "restoreExactSession";
    }>,
  ): MainWireScientificCommandResponseV1 | null {
    if (this.sessions.has(command.sessionId)) {
      const releaseRef = this.sessions.get(command.sessionId)!.releaseRef;
      return errorResponseForCommand(
        command,
        "duplicate-session-id",
        `sessionId ${command.sessionId} is already active`,
        {
          releaseRef,
          sessionOrigin: this.requiredSessionOrigin(command.sessionId),
        },
      );
    }
    if (this.allocatedSessionIds.has(command.sessionId)) {
      return errorResponseForCommand(
        command,
        "retired-session-id",
        `sessionId ${command.sessionId} was already used in this kernel lifetime`,
      );
    }
    if (this.sessions.size >= this.maximumSessionCount) {
      return errorResponseForCommand(
        command,
        "session-capacity-exceeded",
        `session capacity ${this.maximumSessionCount} is exhausted`,
      );
    }
    if (
      this.allocatedSessionIds.size
        >= this.maximumSessionIdentityCountPerKernelLifetime
    ) {
      return errorResponseForCommand(
        command,
        "session-capacity-exceeded",
        "session identity capacity is exhausted; create a fresh worker kernel",
      );
    }
    return null;
  }

  private releaseRefForSession(
    sessionId: string | null,
  ): MainWireScientificSessionV1["releaseRef"] | null {
    return sessionId === null
      ? null
      : this.sessions.get(sessionId)?.releaseRef ?? null;
  }

  private originForSession(sessionId: string | null): ScientificSessionOriginV1 | null {
    return sessionId === null ? null : this.sessionOrigins.get(sessionId) ?? null;
  }

  private requiredSessionOrigin(sessionId: string): ScientificSessionOriginV1 {
    const origin = this.sessionOrigins.get(sessionId);
    if (origin === undefined) throw new Error(`sessionId ${sessionId} lacks origin`);
    return origin;
  }

  private requestAdmissionError(
    identity: ReturnType<typeof partialIdentity>,
  ): MainWireScientificCommandResponseV1 | null {
    if (identity.requestId === null) return null;
    if (this.seenRequestIds.has(identity.requestId)) {
      return errorResponse(
        identity.requestId,
        identity.sessionId,
        this.releaseRefForSession(identity.sessionId),
        this.originForSession(identity.sessionId),
        identity.commandKind,
        "duplicate-request-id",
        `requestId ${identity.requestId} was already submitted`,
      );
    }
    if (this.seenRequestIds.size >= this.maximumRequestCountPerKernelLifetime) {
      const recoveryCommand = (
        identity.commandKind === "getExactCheckpoint"
        || identity.commandKind === "disposeSession"
      ) && this.releaseRefForSession(identity.sessionId) !== null;
      const recoveryCapacity = this.maximumRequestCountPerKernelLifetime
        + 2 * this.maximumSessionCount;
      if (!recoveryCommand || this.seenRequestIds.size >= recoveryCapacity) {
        return errorResponse(
          identity.requestId,
          identity.sessionId,
          this.releaseRefForSession(identity.sessionId),
          this.originForSession(identity.sessionId),
          identity.commandKind,
          "request-capacity-exceeded",
          "request identity capacity is exhausted; checkpoint/dispose or create a fresh worker kernel",
        );
      }
    }
    this.seenRequestIds.add(identity.requestId);
    return null;
  }
}

function assertOfficialPresetLoadMatchesCommand(
  command: Extract<ScientificCommandV1, {
    kind: "createOfficialPresetSession";
  }>,
  loaded: LoadedBundledOfficialHealthyPeriodicPresetV1,
): void {
  const entry = loaded.catalog.entries[0];
  const checkpointDescriptor = loaded.presetDocument.initialization.checkpoint;
  if (
    loaded.identity.presetId !== command.presetId
    || loaded.identity.presetVersion !== command.presetVersion
    || entry.presetId !== command.presetId
    || entry.presetVersion !== command.presetVersion
    || loaded.presetDocument.preset.id !== command.presetId
    || loaded.presetDocument.preset.version !== command.presetVersion
    || loaded.provenance.catalogSchemaId
      !== OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_SCHEMA_ID
    || loaded.provenance.catalogSchemaVersion !== 1
    || loaded.provenance.manifestRawFileSha256
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING
        .manifestRawFileSha256
    || entry.manifest.rawFileSha256
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING
        .manifestRawFileSha256
    || loaded.provenance.checkpointRawFileSha256
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING
        .checkpointRawFileSha256
    || checkpointDescriptor.rawFileSha256
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING
        .checkpointRawFileSha256
    || loaded.provenance.checkpointSha256
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING
        .checkpointSha256
    || checkpointDescriptor.checkpointEnvelopeSha256
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING
        .checkpointSha256
    || loaded.checkpoint.checkpointSha256
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING
        .checkpointSha256
    || loaded.release.ref.id
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING.releaseRef.id
    || loaded.release.ref.version
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING.releaseRef.version
    || loaded.release.ref.sha256
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING.releaseRef.sha256
  ) throw new Error("official preset loader result does not match the command trust anchor");
}

function assertOfficialDocumentCaseLoadMatchesCommand(
  command: Extract<ScientificCommandV1, {
    kind: "createOfficialDocumentCaseSession";
  }>,
  loaded: LoadedOfficialHealthyPeriodicDocumentChainV1,
): void {
  const binding =
    OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_BINDING;
  if (
    loaded.identity.presetId !== command.presetId
    || loaded.identity.presetVersion !== command.presetVersion
    || loaded.catalog.entry.presetId !== command.presetId
    || loaded.catalog.entry.presetVersion !== command.presetVersion
    || loaded.provenance.catalogSchemaId
      !== OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_SCHEMA_ID
    || loaded.provenance.catalogSchemaVersion !== 1
    || loaded.provenance.catalogRawFileSha256 !== binding.rawFileSha256
    || loaded.provenance.checkpointRawFileSha256
      !== binding.checkpointRawFileSha256
    || loaded.provenance.checkpointSha256 !== binding.checkpointSha256
    || loaded.provenance.sessionInputSha256 !== binding.sessionInputSha256
    || canonicalJsonStringify(loaded.provenance.caseRef)
      !== canonicalJsonStringify(binding.caseRef)
    || canonicalJsonStringify(loaded.provenance.workspaceRef)
      !== canonicalJsonStringify(binding.workspaceRef)
    || loaded.checkpoint.schemaVersion !== 3
    || loaded.checkpoint.checkpointSha256 !== binding.checkpointSha256
    || loaded.checkpoint.sessionInputSha256 !== binding.sessionInputSha256
    || canonicalJsonStringify(loaded.caseDocument.ref)
      !== canonicalJsonStringify(binding.caseRef)
    || canonicalJsonStringify(loaded.workspaceDocument.ref)
      !== canonicalJsonStringify(binding.workspaceRef)
    || !sameReleaseRef(loaded.release.ref, binding.releaseRef)
  ) {
    throw new Error(
      "official V3 document-case loader result does not match the command trust anchor",
    );
  }
}

function captureInput(
  value: unknown,
  identity: ReturnType<typeof partialIdentity>,
  maximumJsonBytes: number,
  maximumJsonNodeCount: number,
): CapturedInput {
  try {
    assertBoundedCanonicalInput(
      value,
      maximumJsonBytes,
      maximumJsonNodeCount,
    );
    const serialized = canonicalJsonStringify(value);
    const byteLength = utf8ByteLength(serialized);
    if (byteLength > maximumJsonBytes) {
      throw new Error(
        `command canonical JSON is ${byteLength} bytes; maximum is ${maximumJsonBytes}`,
      );
    }
    return Object.freeze({
      value: deepFreezeCanonicalJson(
        JSON.parse(serialized) as CanonicalJsonValue,
      ),
      captureError: null,
      identity,
    });
  } catch (error) {
    return Object.freeze({
      value: null,
      captureError: errorMessage(error),
      identity,
    });
  }
}

function assertBoundedCanonicalInput(
  root: unknown,
  maximumBytes: number,
  maximumNodeCount: number,
): void {
  const stack: Array<Readonly<{
    value: unknown;
    depth: number;
    exiting: boolean;
  }>> = [
    Object.freeze({ value: root, depth: 0, exiting: false }),
  ];
  const ancestors = new Set<object>();
  let nodeCount = 0;
  let minimumBytes = 0;
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current.exiting) {
      ancestors.delete(current.value as object);
      continue;
    }
    nodeCount += 1;
    if (nodeCount > maximumNodeCount) {
      throw new Error(`command exceeds ${maximumNodeCount} JSON nodes`);
    }
    if (current.depth > 256) throw new Error("command nesting exceeds 256");
    const value = current.value;
    if (value === null) {
      minimumBytes += 4;
    } else if (typeof value === "boolean") {
      minimumBytes += value ? 4 : 5;
    } else if (typeof value === "number") {
      minimumBytes += 1;
    } else if (typeof value === "string") {
      minimumBytes += value.length + 2;
    } else if (typeof value !== "object") {
      throw new Error(`${typeof value} is outside the JSON data model`);
    } else {
      if (ancestors.has(value)) throw new Error("cyclic command input is rejected");
      ancestors.add(value);
      stack.push(Object.freeze({
        value,
        depth: current.depth,
        exiting: true,
      }));
      minimumBytes += 2;
      const descriptors = Object.getOwnPropertyDescriptors(value);
      for (const key of Reflect.ownKeys(descriptors)) {
        if (typeof key !== "string") {
          throw new Error("symbol command properties are rejected");
        }
        if (Array.isArray(value) && key === "length") continue;
        const descriptor = descriptors[key]!;
        if (!("value" in descriptor) || !descriptor.enumerable) {
          throw new Error("command accessors and hidden properties are rejected");
        }
        minimumBytes += key.length + 3;
        stack.push(Object.freeze({
          value: descriptor.value,
          depth: current.depth + 1,
          exiting: false,
        }));
      }
    }
    if (minimumBytes > maximumBytes) {
      throw new Error(
        `command exceeds ${maximumBytes} canonical JSON bytes before serialization`,
      );
    }
  }
}

function captureOuterIdentity(value: unknown): ReturnType<typeof partialIdentity> {
  return partialIdentity(value);
}

function parseCommand(
  value: CanonicalJsonValue | null,
  maximumTransientStepCount: number,
  maximumOutputFrameCount: number,
): ParseResult {
  const identity = partialIdentity(value);
  if (!isRecord(value)) return invalid(identity, "command must be an object");
  if (value.protocolId !== SCIENTIFIC_COMMAND_PROTOCOL_V1_ID) {
    return invalid(identity, "command protocolId is unsupported");
  }
  if (!isIdentifier(value.requestId)) {
    return invalid(identity, "requestId is invalid");
  }
  if (!isIdentifier(value.sessionId)) {
    return invalid(identity, "sessionId is invalid");
  }
  if (!isCommandKind(value.kind)) {
    return invalid(identity, "command kind is unsupported");
  }
  const common = ["protocolId", "kind", "requestId", "sessionId"];
  const expectedKeys = value.kind === "runTransient"
    ? [...common, "dtSec", "stepCount", "observationStride"]
    : value.kind === "restoreExactSession"
      ? [...common, "resolvedSessionInput", "checkpoint"]
      : value.kind === "createResolvedSession"
        ? [...common, "resolvedSessionInput"]
        : value.kind === "createOfficialPresetSession"
          || value.kind === "createOfficialDocumentCaseSession"
          ? [...common, "presetId", "presetVersion"]
          : value.kind === "createResearchPresetSession"
            ? [...common, "presetId", "presetVersion"]
          : common;
  if (!hasExactKeys(value, expectedKeys)) {
    return invalid(identity, "command fields do not match its kind");
  }
  if (value.kind === "runTransient") {
    if (!(typeof value.dtSec === "number" && value.dtSec > 0)) {
      return invalid(identity, "dtSec must be positive and finite");
    }
    if (
      !Number.isSafeInteger(value.stepCount)
      || (value.stepCount as number) < 0
      || (value.stepCount as number) > maximumTransientStepCount
    ) {
      return invalid(
        identity,
        `stepCount must be an integer from 0 to ${maximumTransientStepCount}`,
      );
    }
    if (
      !Number.isSafeInteger(value.observationStride)
      || (value.observationStride as number) < 1
    ) return invalid(identity, "observationStride must be a positive integer");
    const outputFrameCount = Math.ceil(
      (value.stepCount as number) / (value.observationStride as number),
    );
    if (outputFrameCount > maximumOutputFrameCount) {
      return invalid(
        identity,
        `observation policy would exceed ${maximumOutputFrameCount} output frames`,
      );
    }
  }
  if (
    value.kind === "createOfficialPresetSession"
    || value.kind === "createOfficialDocumentCaseSession"
  ) {
    if (value.presetId !== "circleheart/official-healthy-periodic") {
      return invalid(identity, "presetId is not present in the bundled catalog");
    }
    if (value.presetVersion !== "1.0.0") {
      return invalid(identity, "presetVersion is not present in the bundled catalog");
    }
  }
  if (value.kind === "createResearchPresetSession") {
    if (
      typeof value.presetId !== "string"
      || !MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_IDS_V1.includes(
        value.presetId as (typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_IDS_V1)[number],
      )
    ) {
      return invalid(identity, "presetId is not present in the research catalog");
    }
    if (value.presetVersion !== MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION) {
      return invalid(identity, "presetVersion is not present in the research catalog");
    }
  }
  return Object.freeze({
    ok: true as const,
    command: value as unknown as ScientificCommandV1,
  });
}

function partialIdentity(value: unknown): Readonly<{
  requestId: string | null;
  sessionId: string | null;
  commandKind: ScientificCommandKindV1 | null;
}> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return Object.freeze({ requestId: null, sessionId: null, commandKind: null });
  }
  try {
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const requestId = ownDataValue(descriptors.requestId);
    const sessionId = ownDataValue(descriptors.sessionId);
    const kind = ownDataValue(descriptors.kind);
    return Object.freeze({
      requestId: isIdentifier(requestId) ? requestId : null,
      sessionId: isIdentifier(sessionId) ? sessionId : null,
      commandKind: isCommandKind(kind) ? kind : null,
    });
  } catch {
    return Object.freeze({ requestId: null, sessionId: null, commandKind: null });
  }
}

function ownDataValue(
  descriptor: PropertyDescriptor | undefined,
): unknown {
  return descriptor !== undefined && "value" in descriptor
    ? descriptor.value
    : undefined;
}

function invalid(
  identity: ReturnType<typeof partialIdentity>,
  message: string,
): ParseResult {
  return Object.freeze({ ok: false as const, ...identity, message });
}

function project(
  session: MainWireScientificSessionV1,
): MainWireScientificObservableFrameV1 {
  return projectObservation(session.observe());
}

function projectObservation(
  observation: Parameters<typeof projectMainWireScientificObservationV1>[0],
): MainWireScientificObservableFrameV1 {
  return projectMainWireScientificObservationV1(observation);
}

function appendDistinctFinalFrame(
  frames: readonly MainWireScientificObservableFrameV1[],
  finalFrame: MainWireScientificObservableFrameV1,
): readonly MainWireScientificObservableFrameV1[] {
  const last = frames.at(-1);
  if (
    last?.revision === finalFrame.revision
    && last.acceptedTimeSec === finalFrame.acceptedTimeSec
  ) return frames;
  return Object.freeze([...frames, finalFrame]);
}

function transientExecutionProtocol(
  command: Extract<ScientificCommandV1, { kind: "runTransient" }>,
): ScientificTransientExecutionProtocolV1 {
  return Object.freeze({
    protocolId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CLOSED_LOOP_V1_ID,
    protocolVersion:
      MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_TRANSIENT_POLICY_V1.protocolVersion,
    classification:
      MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_TRANSIENT_POLICY_V1
        .approvedDtSec.some((approved) => approved === command.dtSec)
      ? "approved-release-protocol" as const
      : "exploratory-parameterization" as const,
    dtSec: command.dtSec,
    stepCount: command.stepCount,
    observationPolicy: Object.freeze({
      kind: "accepted-step-stride" as const,
      stride: command.observationStride,
      finalAcceptedStateAlwaysIncluded: true as const,
    }),
    commitPolicy: "each-step-atomic-partial-progress-retained" as const,
  });
}

function exactRestoreOrigin(
  command: Extract<ScientificCommandV1, { kind: "restoreExactSession" }>,
  session: MainWireScientificSessionV1,
): ScientificSessionOriginV1 {
  if (
    !isRecord(command.checkpoint)
    || command.checkpoint.checkpointId
      !== "main-wire-scientific-session-exact-checkpoint-v3"
    || command.checkpoint.schemaVersion !== 3
    || typeof command.checkpoint.checkpointSha256 !== "string"
    || !SHA256_HEX_PATTERN.test(command.checkpoint.checkpointSha256)
    || typeof command.checkpoint.sessionInputSha256 !== "string"
    || !SHA256_HEX_PATTERN.test(command.checkpoint.sessionInputSha256)
    || command.checkpoint.sessionInputSha256 !== session.sessionInputSha256
  ) throw new Error("validated exact V3 checkpoint lacks its bound identities");
  return Object.freeze({
    kind: "exact-checkpoint-restore" as const,
    checkpointSchemaVersion: 3 as const,
    checkpointSha256: command.checkpoint.checkpointSha256,
    sessionInputSha256: session.sessionInputSha256,
  });
}

function successResponse<TKind extends ScientificSuccessfulCommandKindV1>(
  command: ScientificCommandV1 & Readonly<{
    kind: TKind;
    requestId: string;
    sessionId: string;
  }>,
  releaseRef: SimulationReleaseRef,
  sessionOrigin: ScientificSessionOriginV1,
  payload: ScientificCommandSuccessPayloadByKindV1<
    MainWireScientificObservableFrameV1
  >[TKind],
): ScientificCommandSuccessResponseForKindV1<
  MainWireScientificObservableFrameV1,
  TKind
> {
  return Object.freeze({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    ok: true as const,
    requestId: command.requestId,
    sessionId: command.sessionId,
    releaseRef: copyReleaseRef(releaseRef),
    sessionOrigin: copySessionOrigin(sessionOrigin),
    commandKind: command.kind,
    payload,
    error: null,
  });
}

function unknownSession(command: ScientificCommandV1):
  ScientificCommandErrorResponseV1<MainWireScientificObservableFrameV1> {
  return errorResponseForCommand(
    command,
    "unknown-session-id",
    `sessionId ${command.sessionId} is not active`,
  );
}

function errorResponseForCommand(
  command: ScientificCommandV1,
  code: ScientificCommandErrorCodeV1,
  message: string,
  options: Readonly<{
    releaseRef?: SimulationReleaseRef | null;
    sessionOrigin?: ScientificSessionOriginV1 | null;
    observableFrames?: readonly MainWireScientificObservableFrameV1[];
    partialProgress?:
      | ScientificTransientPartialProgressV1<
        MainWireScientificObservableFrameV1
      >
      | ScientificPeriodicSettlementPartialProgressV1<
        MainWireScientificObservableFrameV1
      >
      | null;
  }> = {},
): ScientificCommandErrorResponseV1<MainWireScientificObservableFrameV1> {
  return errorResponse(
    command.requestId,
    command.sessionId,
    options.releaseRef ?? null,
    options.sessionOrigin ?? null,
    command.kind,
    code,
    message,
    options.observableFrames ?? Object.freeze([]),
    options.partialProgress ?? null,
  );
}

function errorResponse(
  requestId: string | null,
  sessionId: string | null,
  releaseRef: SimulationReleaseRef | null,
  sessionOrigin: ScientificSessionOriginV1 | null,
  commandKind: ScientificCommandKindV1 | null,
  code: ScientificCommandErrorCodeV1,
  message: string,
  observableFrames: readonly MainWireScientificObservableFrameV1[] =
    Object.freeze([]),
  partialProgress:
    | ScientificTransientPartialProgressV1<
      MainWireScientificObservableFrameV1
    >
    | ScientificPeriodicSettlementPartialProgressV1<
      MainWireScientificObservableFrameV1
    >
    | null = null,
): ScientificCommandErrorResponseV1<MainWireScientificObservableFrameV1> {
  return Object.freeze({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    ok: false as const,
    requestId,
    sessionId,
    releaseRef: releaseRef === null ? null : copyReleaseRef(releaseRef),
    sessionOrigin:
      sessionOrigin === null ? null : copySessionOrigin(sessionOrigin),
    commandKind,
    payload: null,
    error: Object.freeze({
      code,
      message,
      retryable: false as const,
      silentFallbackApplied: false as const,
      observableFrames: Object.freeze([...observableFrames]),
      partialProgress,
    }),
  });
}

function copyReleaseRef(ref: SimulationReleaseRef): SimulationReleaseRef {
  return Object.freeze({
    id: ref.id,
    version: ref.version,
    sha256: ref.sha256,
  });
}

function copySessionOrigin(
  origin: ScientificSessionOriginV1,
): ScientificSessionOriginV1 {
  if (origin.kind === "research-preset-cold-start") {
    return Object.freeze({
      ...origin,
      releaseRef: copyReleaseRef(origin.releaseRef),
    });
  }
  if (origin.kind
    === "official-document-case-v3-exact-checkpoint-restore") {
    return Object.freeze({
      ...origin,
      caseRef: Object.freeze({ ...origin.caseRef }),
      workspaceRef: Object.freeze({ ...origin.workspaceRef }),
    });
  }
  return Object.freeze({ ...origin });
}

function sameReleaseRef(
  left: SimulationReleaseRef,
  right: SimulationReleaseRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.sha256 === right.sha256;
}

function boundedPositiveInteger(
  value: number,
  maximum: number,
  label: string,
): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${label} must be an integer from 1 to ${maximum}`);
  }
  return value;
}

function utf8ByteLength(value: string): number {
  let length = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0)!;
    length += codePoint <= 0x7f
      ? 1
      : codePoint <= 0x7ff
        ? 2
        : codePoint <= 0xffff
          ? 3
          : 4;
  }
  return length;
}

function isIdentifier(value: unknown): value is string {
  return typeof value === "string" && IDENTIFIER_PATTERN.test(value);
}

function isCommandKind(value: unknown): value is ScientificCommandKindV1 {
  return SCIENTIFIC_COMMAND_KINDS_V1.includes(value as ScientificCommandKindV1);
}

function isRecord(value: unknown): value is Record<string, CanonicalJsonValue> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, CanonicalJsonValue>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index]);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
