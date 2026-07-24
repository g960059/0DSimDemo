import type { MainWireScientificObservableFrameV1 } from "@/engine/scientific/observables";
import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificCommandKindV1,
  type ScientificCommandResponseV1,
  type ScientificCommandV1,
  type ScientificSessionOriginV1,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import {
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING,
} from "@/engine/scientific/presets";
import {
  OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_BINDING,
  OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_SCHEMA_ID,
} from "@/engine/scientific/documents";
import {
  canonicalJsonStringify,
} from "@/engine/scientific/release";
import {
  loadMainWireScientificSessionExactCheckpointV4,
  type MainWireScientificSessionStateCodecIdentityV4,
} from "@/engine/scientific/runtime";
import {
  loadMainWireScientificResolvedSessionInputEnvelopeV1,
} from "@/engine/scientific/inputs/MainWireScientificResolvedSessionInputEnvelopeV1";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_ID,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_SCHEMA_ID,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_VERSION,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_SHA256_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlCatalogV0";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_TARGET_STATE_SHA256_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_TARGET_STATE_RESOLVER_V0_ID,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_TARGET_STATE_V0_SCHEMA_ID,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";
import type {
  SimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1_SCHEMA_ID,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_IDS_V1,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION,
  type MainWireScientificResearchPresetIdV1,
} from "@/engine/scientific/presets/mainWireScientificResearchPresetCatalogV1";

export const MAIN_WIRE_SCIENTIFIC_WORKER_CLIENT_V1_ID =
  "main-wire-scientific-worker-client-v1" as const;

export type MainWireScientificWorkerTransportErrorCodeV1 =
  | "client-terminated"
  | "duplicate-request-id"
  | "duplicate-response"
  | "message-deserialization-error"
  | "pending-request-capacity-exceeded"
  | "post-message-failed"
  | "protocol-mismatch"
  | "request-capacity-exceeded"
  | "request-id-reused"
  | "request-timeout"
  | "unsolicited-response"
  | "worker-error";

export class MainWireScientificWorkerTransportErrorV1 extends Error {
  readonly code: MainWireScientificWorkerTransportErrorCodeV1;
  readonly detail: unknown;

  constructor(
    code: MainWireScientificWorkerTransportErrorCodeV1,
    message: string,
    detail: unknown = null,
  ) {
    super(message);
    this.name = "MainWireScientificWorkerTransportErrorV1";
    this.code = code;
    this.detail = detail;
  }
}

export type MainWireScientificWorkerClientStatusV1 =
  | "open"
  | "failed"
  | "terminated";

type MessageListener = (event: MessageEvent<unknown>) => void;
type ErrorListener = (event: ErrorEvent) => void;

/**
 * The minimal Worker surface owned by this transport. Keeping this structural
 * makes the browser boundary directly testable without importing a DOM shim.
 */
export interface MainWireScientificWorkerLikeV1 {
  postMessage(message: unknown): void;
  terminate(): void;
  addEventListener(type: "message", listener: MessageListener): void;
  addEventListener(type: "messageerror", listener: MessageListener): void;
  addEventListener(type: "error", listener: ErrorListener): void;
  removeEventListener(type: "message", listener: MessageListener): void;
  removeEventListener(type: "messageerror", listener: MessageListener): void;
  removeEventListener(type: "error", listener: ErrorListener): void;
}

export type MainWireScientificWorkerFactoryV1 =
  () => MainWireScientificWorkerLikeV1;

export type MainWireScientificWorkerResponseV1 =
  ScientificCommandResponseV1<MainWireScientificObservableFrameV1>;

export type MainWireScientificWorkerClientOptionsV1 = Readonly<{
  workerFactory?: MainWireScientificWorkerFactoryV1;
  maximumPendingRequestCount?: number;
  maximumRequestCountPerClientLifetime?: number;
  requestTimeoutMs?: number;
}>;

/** Vite-recognized production Worker factory. */
export function createDefaultMainWireScientificWorkerV1():
  MainWireScientificWorkerLikeV1 {
  return new Worker(
    new URL("./mainWireScientificWorkerV1.ts", import.meta.url),
    { type: "module" },
  ) as unknown as MainWireScientificWorkerLikeV1;
}

type PendingRequest = Readonly<{
  requestId: string;
  sessionId: string;
  commandKind: ScientificCommandKindV1;
  submittedCommand: PendingCommandIdentityV1;
  timeoutHandle: ReturnType<typeof setTimeout>;
  resolve: (response: MainWireScientificWorkerResponseV1) => void;
  reject: (error: MainWireScientificWorkerTransportErrorV1) => void;
}>;

type PendingCommandIdentityV1 = Readonly<{
  kind: ScientificCommandKindV1;
  requestId: string;
  sessionId: string;
  resolvedSessionInput: Readonly<{
    sessionInputSha256: string;
    releaseRef: SimulationReleaseRef;
  }> | null;
  exactCheckpoint: Readonly<{
    checkpointSha256: string;
    sessionInputSha256: string;
    releaseRef: SimulationReleaseRef;
  }> | null;
  exactCheckpointV4: Readonly<{
    checkpointSha256: string;
    baseSessionInputSha256: string;
    controlTargetStateSha256: string;
    parameterEpoch: number;
    releaseRef: SimulationReleaseRef;
    checkpointCandidate: unknown;
  }> | null;
  officialPreset: Readonly<{
    presetId: "circleheart/official-healthy-periodic";
    presetVersion: "1.0.0";
  }> | null;
  officialDocumentCase: Readonly<{
    presetId: "circleheart/official-healthy-periodic";
    presetVersion: "1.0.0";
  }> | null;
  researchPreset: Readonly<{
    presetId: MainWireScientificResearchPresetIdV1;
    presetVersion: typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION;
  }> | null;
  researchDocumentCase: Readonly<{
    presetId: MainWireScientificResearchPresetIdV1;
    presetVersion: typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION;
  }> | null;
  researchControlFork: Readonly<{
    sourceSessionId: string;
    expectedRevision: number;
    expectedAcceptedTimeSec: number;
    expectedTotalBloodVolumeMl: number;
    expectedControlStateSha256: string;
    expectedParameterEpoch: number;
    targetControlStateSha256: string;
    targetControlStateCanonicalJson: string;
  }> | null;
}>;

type ResearchDocumentCaseOriginV1 = Extract<
  ScientificSessionOriginV1,
  Readonly<{ kind: "research-document-case-cold-start" }>
>;

type ResearchDocumentSessionBindingV1 = Readonly<{
  releaseRef: SimulationReleaseRef;
  origin: ResearchDocumentCaseOriginV1;
}>;

type ResearchControlForkOriginV0 = Extract<
  ScientificSessionOriginV1,
  Readonly<{ kind: "research-control-state-preserving-fork-v0" }>
>;

type ResearchControlRestoreOriginV4 = Extract<
  ScientificSessionOriginV1,
  Readonly<{ kind: "control-aware-exact-checkpoint-v4-restore" }>
>;

type ResearchControlSessionBindingV0 = Readonly<{
  releaseRef: SimulationReleaseRef;
  origin: ResearchControlForkOriginV0 | ResearchControlRestoreOriginV4;
}>;

/**
 * Browser transport only. It does not interpret scientific payloads and owns
 * no backend selection, fallback, identifiers, or simulation state.
 */
export class MainWireScientificWorkerClientV1 {
  readonly clientId = MAIN_WIRE_SCIENTIFIC_WORKER_CLIENT_V1_ID;
  readonly maximumPendingRequestCount: number;
  readonly maximumRequestCountPerClientLifetime: number;
  readonly requestTimeoutMs: number;

  private readonly worker: MainWireScientificWorkerLikeV1;
  private readonly pending = new Map<string, PendingRequest>();
  private readonly completedRequestIds = new Set<string>();
  private readonly researchDocumentSessionBindings =
    new Map<string, ResearchDocumentSessionBindingV1>();
  private readonly researchControlSessionBindings =
    new Map<string, ResearchControlSessionBindingV0>();
  private readonly researchControlSourceInputSha256Bindings =
    new Map<string, string>();
  private readonly validatingResponseIds = new Set<string>();
  private responseProcessingTail: Promise<void> = Promise.resolve();
  private currentStatus: MainWireScientificWorkerClientStatusV1 = "open";
  private terminalError: MainWireScientificWorkerTransportErrorV1 | null = null;

  private readonly onMessage = (event: MessageEvent<unknown>): void => {
    const value = event.data;
    const requestId = responseRequestId(value);
    if (
      requestId !== null
      && (
        this.completedRequestIds.has(requestId)
        || this.validatingResponseIds.has(requestId)
      )
    ) {
      this.failClosed(newTransportError(
        "duplicate-response",
        `scientific Worker repeated response requestId ${requestId}`,
      ));
      return;
    }
    this.responseProcessingTail = this.responseProcessingTail.then(
      async () => {
        try {
          await this.handleMessage(value);
        } catch (error) {
          this.failClosed(new MainWireScientificWorkerTransportErrorV1(
            "protocol-mismatch",
            "scientific Worker response validation failed unexpectedly",
            error,
          ));
        }
      },
    );
  };

  private readonly onMessageError = (event: MessageEvent<unknown>): void => {
    this.failClosed(new MainWireScientificWorkerTransportErrorV1(
      "message-deserialization-error",
      "scientific Worker emitted a messageerror event",
      event.data,
    ));
  };

  private readonly onWorkerError = (event: ErrorEvent): void => {
    event.preventDefault?.();
    this.failClosed(new MainWireScientificWorkerTransportErrorV1(
      "worker-error",
      event.message || "scientific Worker emitted an error event",
      event.error ?? null,
    ));
  };

  constructor(options: MainWireScientificWorkerClientOptionsV1 = {}) {
    this.maximumPendingRequestCount = boundedPositiveInteger(
      options.maximumPendingRequestCount ?? DEFAULT_MAXIMUM_PENDING_REQUEST_COUNT,
      MAXIMUM_CONFIGURED_PENDING_REQUEST_COUNT,
      "maximumPendingRequestCount",
    );
    this.maximumRequestCountPerClientLifetime = boundedPositiveInteger(
      options.maximumRequestCountPerClientLifetime
        ?? DEFAULT_MAXIMUM_REQUEST_COUNT_PER_CLIENT_LIFETIME,
      MAXIMUM_CONFIGURED_REQUEST_COUNT_PER_CLIENT_LIFETIME,
      "maximumRequestCountPerClientLifetime",
    );
    this.requestTimeoutMs = boundedPositiveInteger(
      options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
      MAXIMUM_CONFIGURED_REQUEST_TIMEOUT_MS,
      "requestTimeoutMs",
    );
    this.worker = (options.workerFactory
      ?? createDefaultMainWireScientificWorkerV1)();
    this.worker.addEventListener("message", this.onMessage);
    this.worker.addEventListener("messageerror", this.onMessageError);
    this.worker.addEventListener("error", this.onWorkerError);
  }

  get status(): MainWireScientificWorkerClientStatusV1 {
    return this.currentStatus;
  }

  get pendingRequestCount(): number {
    return this.pending.size;
  }

  request(
    command: ScientificCommandV1,
  ): Promise<MainWireScientificWorkerResponseV1> {
    if (this.currentStatus !== "open") {
      return Promise.reject(this.terminalError ?? newTransportError(
        "client-terminated",
        "scientific Worker client is not open",
      ));
    }
    if (command.protocolId !== SCIENTIFIC_COMMAND_PROTOCOL_V1_ID) {
      return Promise.reject(newTransportError(
        "protocol-mismatch",
        "command protocolId does not match the scientific Worker protocol",
      ));
    }
    if (this.pending.has(command.requestId)) {
      return Promise.reject(newTransportError(
        "duplicate-request-id",
        `requestId ${command.requestId} is already pending`,
      ));
    }
    if (this.completedRequestIds.has(command.requestId)) {
      return Promise.reject(newTransportError(
        "request-id-reused",
        `requestId ${command.requestId} was already completed by this client`,
      ));
    }
    if (
      this.completedRequestIds.size + this.pending.size
        >= this.maximumRequestCountPerClientLifetime
    ) {
      const used = this.completedRequestIds.size + this.pending.size;
      const recoveryCommand = command.kind === "getExactCheckpoint"
        || command.kind === "getExactCheckpointV4"
        || command.kind === "disposeSession";
      if (
        !recoveryCommand
        || used >= this.maximumRequestCountPerClientLifetime
          + RESERVED_RECOVERY_REQUEST_COUNT
      ) {
        return Promise.reject(newTransportError(
          "request-capacity-exceeded",
          "client request identity capacity is exhausted; checkpoint/dispose or create a fresh Worker client",
        ));
      }
    }
    if (this.pending.size >= this.maximumPendingRequestCount) {
      return Promise.reject(newTransportError(
        "pending-request-capacity-exceeded",
        `pending request capacity ${this.maximumPendingRequestCount} is exhausted`,
      ));
    }

    return new Promise<MainWireScientificWorkerResponseV1>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        if (!this.pending.has(command.requestId)) return;
        this.failClosed(new MainWireScientificWorkerTransportErrorV1(
          "request-timeout",
          `scientific Worker did not answer ${command.kind} request ${command.requestId} within ${this.requestTimeoutMs} ms`,
          Object.freeze({
            requestId: command.requestId,
            sessionId: command.sessionId,
            commandKind: command.kind,
            timeoutMs: this.requestTimeoutMs,
          }),
        ));
      }, this.requestTimeoutMs);
      const pending = Object.freeze({
        requestId: command.requestId,
        sessionId: command.sessionId,
        commandKind: command.kind,
        submittedCommand: capturePendingCommandIdentity(command),
        timeoutHandle,
        resolve,
        reject,
      });
      this.pending.set(command.requestId, pending);
      try {
        this.worker.postMessage(command);
      } catch (error) {
        this.failClosed(new MainWireScientificWorkerTransportErrorV1(
          "post-message-failed",
          "scientific Worker postMessage failed",
          error,
        ));
      }
    });
  }

  terminate(): void {
    if (this.currentStatus !== "open") return;
    this.close(
      "terminated",
      newTransportError(
        "client-terminated",
        "scientific Worker client was terminated",
      ),
    );
  }

  private async handleMessage(value: unknown): Promise<void> {
    if (this.currentStatus !== "open") return;
    const requestId = responseRequestId(value);
    if (requestId !== null && this.completedRequestIds.has(requestId)) {
      this.failClosed(newTransportError(
        "duplicate-response",
        `scientific Worker repeated response requestId ${requestId}`,
      ));
      return;
    }
    if (!isProtocolEnvelope(value)) {
      this.failClosed(newTransportError(
        "protocol-mismatch",
        "scientific Worker response does not match protocol V1",
      ));
      return;
    }
    const pending = this.pending.get(value.requestId);
    if (pending === undefined) {
      this.failClosed(newTransportError(
        "unsolicited-response",
        `scientific Worker returned unknown requestId ${value.requestId}`,
      ));
      return;
    }
    if (
      value.sessionId !== pending.sessionId
      || value.commandKind !== pending.commandKind
    ) {
      this.failClosed(newTransportError(
        "protocol-mismatch",
        `scientific Worker response identity does not match requestId ${value.requestId}`,
      ));
      return;
    }
    if (requiresExactCheckpointV4IntegrityValidationV1(value, pending)) {
      this.validatingResponseIds.add(value.requestId);
      let integrityValid = false;
      try {
        integrityValid =
          await isExactCheckpointV4IntegrityValidV1(
            value,
            pending.submittedCommand,
          );
      } finally {
        this.validatingResponseIds.delete(value.requestId);
      }
      if (
        this.currentStatus !== "open"
        || this.pending.get(value.requestId) !== pending
      ) return;
      if (!integrityValid) {
        this.failClosed(newTransportError(
          "protocol-mismatch",
          `scientific Worker V4 checkpoint integrity does not match requestId ${value.requestId}`,
        ));
        return;
      }
    }
    const forkSourceInputSha256 =
      pending.submittedCommand.researchControlFork === null
        ? null
        : this.researchControlSourceInputSha256Bindings.get(
          pending.submittedCommand.researchControlFork.sourceSessionId,
        ) ?? null;
    if (!isResponseCompatibleWithSubmittedCommand(
      value,
      pending.submittedCommand,
      forkSourceInputSha256,
    )) {
      this.failClosed(newTransportError(
        "protocol-mismatch",
        `scientific Worker response payload/origin does not match requestId ${value.requestId}`,
      ));
      return;
    }
    const existingResearchBinding =
      this.researchDocumentSessionBindings.get(pending.sessionId);
    if (
      existingResearchBinding !== undefined
      && !isResponseBoundToResearchDocumentSession(
        value,
        existingResearchBinding,
      )
    ) {
      this.failClosed(newTransportError(
        "protocol-mismatch",
        `scientific Worker response escaped the research document session binding for requestId ${value.requestId}`,
      ));
      return;
    }
    const existingControlBinding =
      this.researchControlSessionBindings.get(pending.sessionId);
    if (
      existingControlBinding !== undefined
      && !isResponseBoundToResearchControlSession(
        value,
        existingControlBinding,
      )
    ) {
      this.failClosed(newTransportError(
        "protocol-mismatch",
        `scientific Worker response escaped the research control session binding for requestId ${value.requestId}`,
      ));
      return;
    }
    if (
      value.ok
      && pending.commandKind === "createResearchDocumentCaseSession"
    ) {
      const binding = captureResearchDocumentSessionBinding(value);
      if (binding === null) {
        this.failClosed(newTransportError(
          "protocol-mismatch",
          `scientific Worker did not establish a research document session binding for requestId ${value.requestId}`,
        ));
        return;
      }
      this.researchDocumentSessionBindings.set(pending.sessionId, binding);
    }
    if (
      value.ok
      && pending.commandKind === "createOfficialDocumentCaseSession"
    ) {
      const sessionInputSha256 =
        captureOfficialDocumentSessionInputSha256(value);
      if (sessionInputSha256 === null) {
        this.failClosed(newTransportError(
          "protocol-mismatch",
          `scientific Worker did not establish an official control-source input binding for requestId ${value.requestId}`,
        ));
        return;
      }
      this.researchControlSourceInputSha256Bindings.set(
        pending.sessionId,
        sessionInputSha256,
      );
    }
    if (value.ok && pending.commandKind === "forkResearchControlSession") {
      const binding = captureResearchControlSessionBinding(value);
      if (binding === null) {
        this.failClosed(newTransportError(
          "protocol-mismatch",
          `scientific Worker did not establish a research control session binding for requestId ${value.requestId}`,
        ));
        return;
      }
      this.researchControlSessionBindings.set(pending.sessionId, binding);
      this.researchControlSourceInputSha256Bindings.set(
        pending.sessionId,
        binding.origin.baseSessionInputSha256,
      );
    }
    if (value.ok && pending.commandKind === "restoreExactSessionV4") {
      const binding = captureResearchControlSessionBinding(value);
      if (
        binding === null
        || binding.origin.kind
          !== "control-aware-exact-checkpoint-v4-restore"
      ) {
        this.failClosed(newTransportError(
          "protocol-mismatch",
          `scientific Worker did not establish a V4 control checkpoint binding for requestId ${value.requestId}`,
        ));
        return;
      }
      this.researchControlSessionBindings.set(pending.sessionId, binding);
      this.researchControlSourceInputSha256Bindings.set(
        pending.sessionId,
        binding.origin.baseSessionInputSha256,
      );
    }
    if (value.ok && pending.commandKind === "disposeSession") {
      this.researchDocumentSessionBindings.delete(pending.sessionId);
      this.researchControlSessionBindings.delete(pending.sessionId);
      this.researchControlSourceInputSha256Bindings.delete(pending.sessionId);
    }
    clearTimeout(pending.timeoutHandle);
    this.pending.delete(value.requestId);
    this.completedRequestIds.add(value.requestId);
    pending.resolve(value);
  }

  private failClosed(error: MainWireScientificWorkerTransportErrorV1): void {
    this.close("failed", error);
  }

  private close(
    status: Exclude<MainWireScientificWorkerClientStatusV1, "open">,
    error: MainWireScientificWorkerTransportErrorV1,
  ): void {
    if (this.currentStatus !== "open") return;
    this.currentStatus = status;
    this.terminalError = error;
    this.detachListeners();
    try {
      this.worker.terminate();
    } catch {
      // The transport is already terminal; a host terminate failure cannot
      // reopen it or enable a fallback.
    }
    const pending = [...this.pending.values()];
    this.pending.clear();
    this.validatingResponseIds.clear();
    for (const request of pending) {
      clearTimeout(request.timeoutHandle);
      request.reject(error);
    }
  }

  private detachListeners(): void {
    this.worker.removeEventListener("message", this.onMessage);
    this.worker.removeEventListener("messageerror", this.onMessageError);
    this.worker.removeEventListener("error", this.onWorkerError);
  }
}

type ProtocolEnvelope = MainWireScientificWorkerResponseV1 & Readonly<{
  requestId: string;
  sessionId: string;
  commandKind: ScientificCommandKindV1;
}>;

/** Validate transport fields only; scientific payloads remain opaque. */
function isProtocolEnvelope(value: unknown): value is ProtocolEnvelope {
  if (!isRecord(value)) return false;
  if (value.protocolId !== SCIENTIFIC_COMMAND_PROTOCOL_V1_ID) return false;
  if (typeof value.requestId !== "string") return false;
  if (typeof value.sessionId !== "string") return false;
  if (typeof value.commandKind !== "string") return false;
  if (typeof value.ok !== "boolean") return false;
  if (value.ok === true) {
    return value.error === null
      && isReleaseRef(value.releaseRef)
      && isSessionOrigin(value.sessionOrigin)
      && isRecord(value.payload);
  }
  const nullableProvenance = (
    value.releaseRef === null && value.sessionOrigin === null
  ) || (
    isReleaseRef(value.releaseRef) && isSessionOrigin(value.sessionOrigin)
  );
  return value.payload === null && nullableProvenance && isRecord(value.error)
    && typeof value.error.code === "string"
    && typeof value.error.message === "string"
    && value.error.retryable === false
    && value.error.silentFallbackApplied === false
    && Array.isArray(value.error.observableFrames)
    && (
      value.error.partialProgress === null
      || isRecord(value.error.partialProgress)
    );
}

function isReleaseRef(value: unknown): value is SimulationReleaseRef {
  return isRecord(value)
    && hasExactKeys(value, ["id", "version", "sha256"])
    && typeof value.id === "string"
    && value.id.length > 0
    && typeof value.version === "string"
    && value.version.length > 0
    && typeof value.sha256 === "string"
    && /^[0-9a-f]{64}$/.test(value.sha256);
}

function isSessionOrigin(value: unknown): boolean {
  if (!isRecord(value) || typeof value.kind !== "string") return false;
  if (value.kind === "canonical-cold-start") {
    return hasExactKeys(value, [
      "kind",
      "initializationProtocolId",
      "initializationProtocolVersion",
    ])
      && typeof value.initializationProtocolId === "string"
      && value.initializationProtocolId.length > 0
      && typeof value.initializationProtocolVersion === "string"
      && value.initializationProtocolVersion.length > 0;
  }
  if (value.kind === "resolved-session-input-cold-start") {
    return hasExactKeys(value, [
      "kind",
      "sessionInputSchemaId",
      "sessionInputSchemaVersion",
      "sessionInputSha256",
      "initializationProtocolId",
      "initializationProtocolVersion",
    ])
      && value.sessionInputSchemaId
        === "circleheart-main-wire-resolved-session-input-v1"
      && value.sessionInputSchemaVersion === 1
      && typeof value.sessionInputSha256 === "string"
      && /^[0-9a-f]{64}$/.test(value.sessionInputSha256)
      && typeof value.initializationProtocolId === "string"
      && value.initializationProtocolId.length > 0
      && typeof value.initializationProtocolVersion === "string"
      && value.initializationProtocolVersion.length > 0;
  }
  if (value.kind === "exact-checkpoint-restore") {
    return hasExactKeys(value, [
      "kind",
      "checkpointSchemaVersion",
      "checkpointSha256",
      "sessionInputSha256",
    ])
      && value.checkpointSchemaVersion === 3
      && typeof value.checkpointSha256 === "string"
      && /^[0-9a-f]{64}$/.test(value.checkpointSha256)
      && typeof value.sessionInputSha256 === "string"
      && /^[0-9a-f]{64}$/.test(value.sessionInputSha256);
  }
  if (value.kind === "control-aware-exact-checkpoint-v4-restore") {
    return hasExactKeys(value, [
      "kind",
      "checkpointSchemaVersion",
      "checkpointSha256",
      "baseSessionInputSha256",
      "controlTargetStateSha256",
      "parameterEpoch",
    ])
      && value.checkpointSchemaVersion === 4
      && isSha256(value.checkpointSha256)
      && isSha256(value.baseSessionInputSha256)
      && isSha256(value.controlTargetStateSha256)
      && Number.isSafeInteger(value.parameterEpoch)
      && (value.parameterEpoch as number) >= 0;
  }
  if (value.kind === "official-preset-exact-checkpoint-restore") {
    return hasExactKeys(value, [
      "kind",
      "presetId",
      "presetVersion",
      "catalogSchemaId",
      "catalogSchemaVersion",
      "manifestRawFileSha256",
      "checkpointRawFileSha256",
      "checkpointSha256",
      "parameterization",
    ])
      && value.presetId === "circleheart/official-healthy-periodic"
      && value.presetVersion === "1.0.0"
      && value.catalogSchemaId === "circleheart-official-preset-catalog-v1"
      && value.catalogSchemaVersion === 1
      && typeof value.manifestRawFileSha256 === "string"
      && value.manifestRawFileSha256
        === OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING
          .manifestRawFileSha256
      && typeof value.checkpointRawFileSha256 === "string"
      && value.checkpointRawFileSha256
        === OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING
          .checkpointRawFileSha256
      && typeof value.checkpointSha256 === "string"
      && value.checkpointSha256
        === OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING
          .checkpointSha256
      && value.parameterization === "fixed-canonical-only";
  }
  if (value.kind
    === "official-document-case-v3-exact-checkpoint-restore") {
    const binding =
      OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_BINDING;
    return hasExactKeys(value, [
      "kind",
      "presetId",
      "presetVersion",
      "catalogSchemaId",
      "catalogSchemaVersion",
      "catalogRawFileSha256",
      "checkpointRawFileSha256",
      "checkpointSha256",
      "sessionInputSha256",
      "caseRef",
      "workspaceRef",
      "periodicSteadyStateClaimed",
      "clinicalValidationClaimed",
    ])
      && value.presetId === "circleheart/official-healthy-periodic"
      && value.presetVersion === "1.0.0"
      && value.catalogSchemaId
        === OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_SCHEMA_ID
      && value.catalogSchemaVersion === 1
      && value.catalogRawFileSha256 === binding.rawFileSha256
      && value.checkpointRawFileSha256 === binding.checkpointRawFileSha256
      && value.checkpointSha256 === binding.checkpointSha256
      && value.sessionInputSha256 === binding.sessionInputSha256
      && sameDocumentRef(value.caseRef, binding.caseRef)
      && sameDocumentRef(value.workspaceRef, binding.workspaceRef)
      && value.periodicSteadyStateClaimed === true
      && value.clinicalValidationClaimed === false;
  }
  if (value.kind === "research-preset-cold-start") {
    return hasExactKeys(value, [
      "kind",
      "presetId",
      "presetVersion",
      "catalogSchemaId",
      "catalogSchemaVersion",
      "classification",
      "officialTrustClaimed",
      "clinicalDiagnosisClaimed",
      "periodicSteadyStateClaimed",
      "releaseRef",
      "sessionInputSha256",
      "initializationProtocolId",
      "initializationProtocolVersion",
    ])
      && typeof value.presetId === "string"
      && MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_IDS_V1.includes(
        value.presetId as MainWireScientificResearchPresetIdV1,
      )
      && value.presetVersion
        === MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION
      && value.catalogSchemaId
        === MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1_SCHEMA_ID
      && value.catalogSchemaVersion === 1
      && value.classification === "research-bracket-not-clinical"
      && value.officialTrustClaimed === false
      && value.clinicalDiagnosisClaimed === false
      && value.periodicSteadyStateClaimed === false
      && exactResearchReleaseRef(value.releaseRef)
      && typeof value.sessionInputSha256 === "string"
      && /^[0-9a-f]{64}$/.test(value.sessionInputSha256)
      && typeof value.initializationProtocolId === "string"
      && value.initializationProtocolId.length > 0
      && typeof value.initializationProtocolVersion === "string"
      && value.initializationProtocolVersion.length > 0;
  }
  if (value.kind === "research-document-case-cold-start") {
    return hasExactKeys(value, [
      "kind",
      "presetId",
      "presetVersion",
      "catalogSchemaId",
      "catalogSchemaVersion",
      "classification",
      "officialTrustClaimed",
      "clinicalDiagnosisClaimed",
      "periodicSteadyStateClaimed",
      "releaseRef",
      "sessionInputSha256",
      "presetRef",
      "caseRef",
      "workspaceRef",
      "initializationProtocolId",
      "initializationProtocolVersion",
    ])
      && isResearchPresetIdentity(value.presetId, value.presetVersion)
      && value.catalogSchemaId
        === MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1_SCHEMA_ID
      && value.catalogSchemaVersion === 1
      && value.classification === "research-bracket-not-clinical"
      && value.officialTrustClaimed === false
      && value.clinicalDiagnosisClaimed === false
      && value.periodicSteadyStateClaimed === false
      && exactResearchReleaseRef(value.releaseRef)
      && isSha256(value.sessionInputSha256)
      && isPresetDocumentRef(value.presetRef)
      && isCaseDocumentRef(value.caseRef)
      && isWorkspaceDocumentRef(value.workspaceRef)
      && typeof value.initializationProtocolId === "string"
      && value.initializationProtocolId.length > 0
      && typeof value.initializationProtocolVersion === "string"
      && value.initializationProtocolVersion.length > 0;
  }
  if (value.kind === "research-control-state-preserving-fork-v0") {
    return hasExactKeys(value, [
      "kind",
      "classification",
      "releaseRef",
      "sourceSessionId",
      "baseSessionInputSha256",
      "sourceControlStateSha256",
      "targetControlStateSha256",
      "parameterEpoch",
      "transitionProtocolId",
      "transitionProtocolVersion",
      "acceptedStatePreservedAtFork",
      "periodicTrackerResetAtFork",
      "sourceSessionRetainedAtFork",
      "exactCheckpointCapability",
      "periodicSteadyStateClaimed",
      "officialTrustClaimed",
      "clinicalDiagnosisClaimed",
      "clinicalValidationClaimed",
    ])
      && value.classification
        === "research-only-experimental-not-clinical"
      && exactResearchReleaseRef(value.releaseRef)
      && typeof value.sourceSessionId === "string"
      && value.sourceSessionId.length > 0
      && isSha256(value.baseSessionInputSha256)
      && isSha256(value.sourceControlStateSha256)
      && isSha256(value.targetControlStateSha256)
      && Number.isSafeInteger(value.parameterEpoch)
      && (value.parameterEpoch as number) > 0
      && value.transitionProtocolId
        === "main-wire-research-control-state-preserving-fork-v0"
      && value.transitionProtocolVersion === "0.0.0"
      && value.acceptedStatePreservedAtFork === true
      && value.periodicTrackerResetAtFork === true
      && value.sourceSessionRetainedAtFork === true
      && value.exactCheckpointCapability
        === "control-aware-exact-checkpoint-v4"
      && value.periodicSteadyStateClaimed === false
      && value.officialTrustClaimed === false
      && value.clinicalDiagnosisClaimed === false
      && value.clinicalValidationClaimed === false;
  }
  return false;
}

function capturePendingCommandIdentity(
  command: ScientificCommandV1,
): PendingCommandIdentityV1 {
  return Object.freeze({
    kind: command.kind,
    requestId: command.requestId,
    sessionId: command.sessionId,
    resolvedSessionInput: command.kind === "createResolvedSession"
      || command.kind === "restoreExactSession"
      || command.kind === "restoreExactSessionV4"
      ? captureResolvedSessionInputIdentity(command.resolvedSessionInput)
      : null,
    exactCheckpoint: command.kind === "restoreExactSession"
      ? captureExactCheckpointIdentity(command.checkpoint)
      : null,
    exactCheckpointV4: command.kind === "restoreExactSessionV4"
      ? captureExactCheckpointV4Identity(command.checkpoint)
      : null,
    officialPreset: command.kind === "createOfficialPresetSession"
      ? Object.freeze({
        presetId: command.presetId,
        presetVersion: command.presetVersion,
      })
      : null,
    officialDocumentCase:
      command.kind === "createOfficialDocumentCaseSession"
        ? Object.freeze({
          presetId: command.presetId,
          presetVersion: command.presetVersion,
        })
        : null,
    researchPreset: command.kind === "createResearchPresetSession"
      ? Object.freeze({
        presetId: command.presetId,
        presetVersion: command.presetVersion,
      })
      : null,
    researchDocumentCase:
      command.kind === "createResearchDocumentCaseSession"
        ? Object.freeze({
          presetId: command.presetId,
          presetVersion: command.presetVersion,
        })
        : null,
    researchControlFork: command.kind === "forkResearchControlSession"
      ? Object.freeze({
        sourceSessionId: command.sourceSessionId,
        expectedRevision: command.expectedSource.revision,
        expectedAcceptedTimeSec: command.expectedSource.acceptedTimeSec,
        expectedTotalBloodVolumeMl:
          command.expectedSource.totalBloodVolumeMl,
        expectedControlStateSha256:
          command.expectedSource.controlStateSha256,
        expectedParameterEpoch: command.expectedSource.parameterEpoch,
        targetControlStateSha256:
          command.targetControlState.targetStateSha256,
        targetControlStateCanonicalJson:
          canonicalJsonStringify(command.targetControlState),
      })
      : null,
  });
}

function isResponseCompatibleWithSubmittedCommand(
  response: ProtocolEnvelope,
  submitted: PendingCommandIdentityV1,
  forkSourceInputSha256: string | null,
): boolean {
  if (
    (
      response.sessionOrigin?.kind === "research-preset-cold-start"
      || response.sessionOrigin?.kind === "research-document-case-cold-start"
    )
    && !sameReleaseRef(
      response.releaseRef,
      response.sessionOrigin.releaseRef,
    )
  ) return false;
  if (response.ok === false) return true;
  if (submitted.kind === "createResolvedSession") {
    const expected = submitted.resolvedSessionInput;
    if (expected === null) return false;
    const origin = response.sessionOrigin;
    const payload = response.payload;
    return origin.kind === "resolved-session-input-cold-start"
      && sameReleaseRef(response.releaseRef, expected.releaseRef)
      && origin.sessionInputSha256 === expected.sessionInputSha256
      && isRecord(payload)
      && hasExactKeys(payload, [
        "kind",
        "sessionInputSha256",
        "observableFrame",
      ])
      && payload.kind === "resolvedSessionCreated"
      && payload.sessionInputSha256 === expected.sessionInputSha256
      && isRecord(payload.observableFrame)
      && sameReleaseRef(payload.observableFrame.releaseRef, expected.releaseRef);
  }
  if (submitted.kind === "getExactCheckpoint") {
    return isExactCheckpointResponseCompatible(response);
  }
  if (submitted.kind === "getExactCheckpointV4") {
    return isExactCheckpointV4ResponseCompatible(response);
  }
  if (submitted.kind === "restoreExactSession") {
    const expectedInput = submitted.resolvedSessionInput;
    const expectedCheckpoint = submitted.exactCheckpoint;
    if (
      expectedInput === null
      || expectedCheckpoint === null
      || expectedInput.sessionInputSha256
        !== expectedCheckpoint.sessionInputSha256
      || !sameReleaseRef(
        expectedInput.releaseRef,
        expectedCheckpoint.releaseRef,
      )
    ) return false;
    const origin = response.sessionOrigin;
    const payload = response.payload;
    return origin.kind === "exact-checkpoint-restore"
      && origin.checkpointSchemaVersion === 3
      && origin.checkpointSha256 === expectedCheckpoint.checkpointSha256
      && origin.sessionInputSha256 === expectedInput.sessionInputSha256
      && sameReleaseRef(response.releaseRef, expectedInput.releaseRef)
      && isRecord(payload)
      && hasExactKeys(payload, ["kind", "observableFrame"])
      && payload.kind === "sessionRestored"
      && isRecord(payload.observableFrame)
      && sameReleaseRef(
        payload.observableFrame.releaseRef,
        expectedInput.releaseRef,
      );
  }
  if (submitted.kind === "restoreExactSessionV4") {
    const expectedInput = submitted.resolvedSessionInput;
    const expectedCheckpoint = submitted.exactCheckpointV4;
    if (
      expectedInput === null
      || expectedCheckpoint === null
      || expectedInput.sessionInputSha256
        !== expectedCheckpoint.baseSessionInputSha256
      || !sameReleaseRef(
        expectedInput.releaseRef,
        expectedCheckpoint.releaseRef,
      )
    ) return false;
    const origin = response.sessionOrigin;
    const payload = response.payload;
    return origin.kind === "control-aware-exact-checkpoint-v4-restore"
      && origin.checkpointSchemaVersion === 4
      && origin.checkpointSha256 === expectedCheckpoint.checkpointSha256
      && origin.baseSessionInputSha256
        === expectedInput.sessionInputSha256
      && origin.controlTargetStateSha256
        === expectedCheckpoint.controlTargetStateSha256
      && origin.parameterEpoch === expectedCheckpoint.parameterEpoch
      && sameReleaseRef(response.releaseRef, expectedInput.releaseRef)
      && isRecord(payload)
      && hasExactKeys(payload, [
        "kind",
        "researchControlContext",
        "observableFrame",
      ])
      && payload.kind === "sessionRestoredV4"
      && isRecord(payload.observableFrame)
      && sameReleaseRef(
        payload.observableFrame.releaseRef,
        expectedInput.releaseRef,
      )
      && isResearchControlContextV4(
        payload.researchControlContext,
        payload.observableFrame,
        expectedCheckpoint.controlTargetStateSha256,
        expectedCheckpoint.parameterEpoch,
      );
  }
  if (submitted.kind === "createOfficialPresetSession") {
    const expected = submitted.officialPreset;
    if (expected === null) return false;
    const origin = response.sessionOrigin;
    const payload = response.payload;
    return origin.kind === "official-preset-exact-checkpoint-restore"
      && exactOfficialReleaseRef(response.releaseRef)
      && origin.presetId === expected.presetId
      && origin.presetVersion === expected.presetVersion
      && isRecord(payload)
      && hasExactKeys(payload, [
        "kind",
        "presetId",
        "presetVersion",
        "observableFrame",
      ])
      && payload.kind === "officialPresetSessionCreated"
      && payload.presetId === expected.presetId
      && payload.presetVersion === expected.presetVersion
      && isRecord(payload.observableFrame)
      && exactOfficialReleaseRef(payload.observableFrame.releaseRef);
  }
  if (submitted.kind === "createOfficialDocumentCaseSession") {
    const expected = submitted.officialDocumentCase;
    if (expected === null) return false;
    const binding =
      OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_BINDING;
    const origin = response.sessionOrigin;
    const payload = response.payload;
    return origin.kind
      === "official-document-case-v3-exact-checkpoint-restore"
      && exactOfficialDocumentChainReleaseRef(response.releaseRef)
      && origin.presetId === expected.presetId
      && origin.presetVersion === expected.presetVersion
      && isRecord(payload)
      && hasExactKeys(payload, [
        "kind",
        "presetId",
        "presetVersion",
        "checkpointSha256",
        "sessionInputSha256",
        "caseRef",
        "workspaceRef",
        "periodicSteadyStateClaimed",
        "researchControlContext",
        "observableFrame",
      ])
      && payload.kind === "officialDocumentCaseSessionCreated"
      && payload.presetId === expected.presetId
      && payload.presetVersion === expected.presetVersion
      && payload.checkpointSha256 === binding.checkpointSha256
      && payload.sessionInputSha256 === binding.sessionInputSha256
      && sameDocumentRef(payload.caseRef, binding.caseRef)
      && sameDocumentRef(payload.workspaceRef, binding.workspaceRef)
      && sameDocumentRef(payload.caseRef, origin.caseRef)
      && sameDocumentRef(payload.workspaceRef, origin.workspaceRef)
      && payload.periodicSteadyStateClaimed === true
      && isRecord(payload.observableFrame)
      && isOfficialBaselineResearchControlContextV0(
        payload.researchControlContext,
        payload.observableFrame,
      )
      && exactOfficialDocumentChainReleaseRef(
        payload.observableFrame.releaseRef,
      );
  }
  if (submitted.kind === "createResearchPresetSession") {
    const expected = submitted.researchPreset;
    if (expected === null) return false;
    const origin = response.sessionOrigin;
    const payload = response.payload;
    return origin.kind === "research-preset-cold-start"
      && origin.presetId === expected.presetId
      && origin.presetVersion === expected.presetVersion
      && exactResearchReleaseRef(response.releaseRef)
      && exactResearchReleaseRef(origin.releaseRef)
      && isRecord(payload)
      && hasExactKeys(payload, [
        "kind",
        "presetId",
        "presetVersion",
        "classification",
        "officialTrustClaimed",
        "clinicalDiagnosisClaimed",
        "periodicSteadyStateClaimed",
        "sessionInputSha256",
        "observableFrame",
      ])
      && payload.kind === "researchPresetSessionCreated"
      && payload.presetId === expected.presetId
      && payload.presetVersion === expected.presetVersion
      && payload.classification === "research-bracket-not-clinical"
      && payload.officialTrustClaimed === false
      && payload.clinicalDiagnosisClaimed === false
      && payload.periodicSteadyStateClaimed === false
      && payload.sessionInputSha256 === origin.sessionInputSha256
      && isRecord(payload.observableFrame)
      && sameReleaseRef(
        payload.observableFrame.releaseRef,
        origin.releaseRef,
      );
  }
  if (submitted.kind === "createResearchDocumentCaseSession") {
    const expected = submitted.researchDocumentCase;
    if (expected === null) return false;
    const catalogEntry =
      MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.entries.find(
        (entry) => entry.presetId === expected.presetId,
      );
    if (catalogEntry === undefined) return false;
    const documentBinding = catalogEntry.documentChainBinding;
    const origin = response.sessionOrigin;
    const payload = response.payload;
    return origin.kind === "research-document-case-cold-start"
      && origin.presetId === expected.presetId
      && origin.presetVersion === expected.presetVersion
      && exactResearchReleaseRef(response.releaseRef)
      && exactResearchReleaseRef(origin.releaseRef)
      && isRecord(payload)
      && hasExactKeys(payload, [
        "kind",
        "presetId",
        "presetVersion",
        "classification",
        "officialTrustClaimed",
        "clinicalDiagnosisClaimed",
        "periodicSteadyStateClaimed",
        "sessionInputSha256",
        "presetRef",
        "caseRef",
        "workspaceRef",
        "workspaceDocument",
        "researchControlContext",
        "observableFrame",
      ])
      && payload.kind === "researchDocumentCaseSessionCreated"
      && payload.presetId === expected.presetId
      && payload.presetVersion === expected.presetVersion
      && payload.classification === "research-bracket-not-clinical"
      && payload.officialTrustClaimed === false
      && payload.clinicalDiagnosisClaimed === false
      && payload.periodicSteadyStateClaimed === false
      && payload.sessionInputSha256 === origin.sessionInputSha256
      && payload.sessionInputSha256 === documentBinding.sessionInputSha256
      && sameDocumentRef(payload.presetRef, origin.presetRef)
      && sameDocumentRef(payload.caseRef, origin.caseRef)
      && sameDocumentRef(payload.workspaceRef, origin.workspaceRef)
      && documentRefHasSha256(
        payload.presetRef,
        documentBinding.presetDocumentSha256,
      )
      && documentRefHasSha256(
        payload.caseRef,
        documentBinding.caseDocumentSha256,
      )
      && documentRefHasSha256(
        payload.workspaceRef,
        documentBinding.workspaceDocumentSha256,
      )
      && isWorkspaceDocumentTransportV1(
        payload.workspaceDocument,
        origin.caseRef,
        origin.workspaceRef,
      )
      && isRecord(payload.observableFrame)
      && exactResearchReleaseRef(payload.observableFrame.releaseRef)
      && isOfficialBaselineResearchControlContextV0(
        payload.researchControlContext,
        payload.observableFrame,
      );
  }
  if (submitted.kind === "forkResearchControlSession") {
    const expected = submitted.researchControlFork;
    if (expected === null) return false;
    const origin = response.sessionOrigin;
    const payload = response.payload;
    if (
      origin.kind !== "research-control-state-preserving-fork-v0"
      || !exactResearchReleaseRef(response.releaseRef)
      || forkSourceInputSha256 === null
      || origin.baseSessionInputSha256 !== forkSourceInputSha256
      || origin.sourceControlStateSha256
        !== expected.expectedControlStateSha256
      || origin.targetControlStateSha256
        !== expected.targetControlStateSha256
      || origin.parameterEpoch !== expected.expectedParameterEpoch + 1
      || !isRecord(payload)
      || !hasExactKeys(payload, [
        "kind",
        "sourceSessionId",
        "sourceStateIdentity",
        "targetStateIdentity",
        "sourceControlStateSha256",
        "targetControlState",
        "parameterEpoch",
        "acceptedStatePreservedAtFork",
        "periodicTrackerResetAtFork",
        "sourceSessionRetainedAtFork",
        "exactCheckpointAvailable",
        "periodicSteadyStateClaimed",
        "observableFrame",
      ])
      || payload.kind !== "researchControlSessionForked"
      || payload.sourceSessionId !== expected.sourceSessionId
      || origin.sourceSessionId !== expected.sourceSessionId
      || payload.sourceControlStateSha256
        !== expected.expectedControlStateSha256
      || payload.parameterEpoch !== expected.expectedParameterEpoch + 1
      || payload.acceptedStatePreservedAtFork !== true
      || payload.periodicTrackerResetAtFork !== true
      || payload.sourceSessionRetainedAtFork !== true
      || payload.exactCheckpointAvailable !== true
      || payload.periodicSteadyStateClaimed !== false
      || !isAcceptedStateIdentityV0(payload.sourceStateIdentity)
      || !isAcceptedStateIdentityV0(payload.targetStateIdentity)
      || !sameAcceptedStateIdentityV0(
        payload.sourceStateIdentity,
        payload.targetStateIdentity,
      )
      || payload.sourceStateIdentity.revision !== expected.expectedRevision
      || payload.sourceStateIdentity.acceptedTimeSec
        !== expected.expectedAcceptedTimeSec
      || payload.sourceStateIdentity.totalBloodVolumeMl
        !== expected.expectedTotalBloodVolumeMl
      || !isResearchControlTargetStateIdentityV0(
        payload.targetControlState,
        expected.targetControlStateSha256,
      )
      || canonicalJsonStringify(payload.targetControlState)
        !== expected.targetControlStateCanonicalJson
      || !isRecord(payload.observableFrame)
      || !sameReleaseRef(
        payload.observableFrame.releaseRef,
        response.releaseRef,
      )
      || payload.observableFrame.revision !== expected.expectedRevision
      || payload.observableFrame.acceptedTimeSec
        !== expected.expectedAcceptedTimeSec
      || payload.observableFrame.source !== "research-control-state-fork"
    ) return false;
    return true;
  }
  return true;
}

function captureResearchDocumentSessionBinding(
  response: ProtocolEnvelope,
): ResearchDocumentSessionBindingV1 | null {
  if (
    !response.ok
    || response.commandKind !== "createResearchDocumentCaseSession"
    || response.sessionOrigin.kind !== "research-document-case-cold-start"
  ) return null;
  const origin = response.sessionOrigin;
  return Object.freeze({
    releaseRef: Object.freeze({ ...response.releaseRef }),
    origin: Object.freeze({
      ...origin,
      releaseRef: Object.freeze({ ...origin.releaseRef }),
      presetRef: Object.freeze({ ...origin.presetRef }),
      caseRef: Object.freeze({ ...origin.caseRef }),
      workspaceRef: Object.freeze({ ...origin.workspaceRef }),
    }),
  });
}

function captureResearchControlSessionBinding(
  response: ProtocolEnvelope,
): ResearchControlSessionBindingV0 | null {
  if (!response.ok) return null;
  const origin = response.sessionOrigin;
  if (
    !(
      response.commandKind === "forkResearchControlSession"
      && origin.kind === "research-control-state-preserving-fork-v0"
    )
    && !(
      response.commandKind === "restoreExactSessionV4"
      && origin.kind === "control-aware-exact-checkpoint-v4-restore"
    )
  ) return null;
  return Object.freeze({
    releaseRef: Object.freeze({ ...response.releaseRef }),
    origin: origin.kind === "research-control-state-preserving-fork-v0"
      ? Object.freeze({
        ...origin,
        releaseRef: Object.freeze({ ...origin.releaseRef }),
      })
      : Object.freeze({ ...origin }),
  });
}

function captureOfficialDocumentSessionInputSha256(
  response: ProtocolEnvelope,
): string | null {
  if (
    !response.ok
    || response.commandKind !== "createOfficialDocumentCaseSession"
    || response.sessionOrigin.kind
      !== "official-document-case-v3-exact-checkpoint-restore"
    || !isRecord(response.payload)
    || response.payload.kind !== "officialDocumentCaseSessionCreated"
    || !isSha256(response.payload.sessionInputSha256)
    || response.payload.sessionInputSha256
      !== response.sessionOrigin.sessionInputSha256
  ) return null;
  return response.payload.sessionInputSha256;
}

function isResponseBoundToResearchControlSession(
  response: ProtocolEnvelope,
  binding: ResearchControlSessionBindingV0,
): boolean {
  if (
    !sameReleaseRef(response.releaseRef, binding.releaseRef)
    || !sameResearchControlOriginV0(response.sessionOrigin, binding.origin)
  ) return false;
  if (response.ok && response.commandKind === "getExactCheckpoint") {
    return false;
  }
  const frames: unknown[] = [];
  if (response.ok) {
    const payload = response.payload;
    if (isRecord(payload)) {
      const payloadRecord = payload as unknown as Record<string, unknown>;
      if ("observableFrame" in payloadRecord) {
        frames.push(payloadRecord.observableFrame);
      }
      if ("finalObservableFrame" in payloadRecord) {
        frames.push(payloadRecord.finalObservableFrame);
      }
      if (Array.isArray(payloadRecord.observableFrames)) {
        frames.push(...payloadRecord.observableFrames);
      }
      if ("checkpoint" in payloadRecord) {
        const checkpoint = captureExactCheckpointV4Identity(
          payloadRecord.checkpoint,
        );
        if (
          response.commandKind !== "getExactCheckpointV4"
          || checkpoint === null
          || !checkpointMatchesResearchControlBinding(
            checkpoint,
            binding,
          )
        ) return false;
      }
    }
  } else {
    frames.push(...response.error.observableFrames);
    const partial = response.error.partialProgress;
    if (isRecord(partial) && "finalObservableFrame" in partial) {
      frames.push(partial.finalObservableFrame);
    }
  }
  return frames.every((frame) =>
    isRecord(frame) && sameReleaseRef(frame.releaseRef, binding.releaseRef));
}

function sameResearchControlOriginV0(
  value: unknown,
  expected: ResearchControlForkOriginV0 | ResearchControlRestoreOriginV4,
): boolean {
  if (!isRecord(value) || value.kind !== expected.kind) return false;
  if (expected.kind === "control-aware-exact-checkpoint-v4-restore") {
    return value.checkpointSchemaVersion === 4
      && value.checkpointSha256 === expected.checkpointSha256
      && value.baseSessionInputSha256 === expected.baseSessionInputSha256
      && value.controlTargetStateSha256
        === expected.controlTargetStateSha256
      && value.parameterEpoch === expected.parameterEpoch;
  }
  return value.kind === "research-control-state-preserving-fork-v0"
    && value.classification === expected.classification
    && sameReleaseRef(value.releaseRef, expected.releaseRef)
    && value.sourceSessionId === expected.sourceSessionId
    && value.baseSessionInputSha256 === expected.baseSessionInputSha256
    && value.sourceControlStateSha256
      === expected.sourceControlStateSha256
    && value.targetControlStateSha256
      === expected.targetControlStateSha256
    && value.parameterEpoch === expected.parameterEpoch
    && value.transitionProtocolId === expected.transitionProtocolId
    && value.transitionProtocolVersion === expected.transitionProtocolVersion
    && value.acceptedStatePreservedAtFork === true
    && value.periodicTrackerResetAtFork === true
    && value.sourceSessionRetainedAtFork === true
    && value.exactCheckpointCapability
      === "control-aware-exact-checkpoint-v4"
    && value.periodicSteadyStateClaimed === false
    && value.officialTrustClaimed === false
    && value.clinicalDiagnosisClaimed === false
    && value.clinicalValidationClaimed === false;
}

function checkpointMatchesResearchControlBinding(
  checkpoint: NonNullable<PendingCommandIdentityV1["exactCheckpointV4"]>,
  binding: ResearchControlSessionBindingV0,
): boolean {
  if (!sameReleaseRef(checkpoint.releaseRef, binding.releaseRef)) return false;
  const origin = binding.origin;
  if (origin.kind === "research-control-state-preserving-fork-v0") {
    return checkpoint.baseSessionInputSha256
      === origin.baseSessionInputSha256
      && checkpoint.controlTargetStateSha256
        === origin.targetControlStateSha256
      && checkpoint.parameterEpoch === origin.parameterEpoch;
  }
  return checkpoint.baseSessionInputSha256
    === origin.baseSessionInputSha256
    && checkpoint.controlTargetStateSha256
      === origin.controlTargetStateSha256
    && checkpoint.parameterEpoch === origin.parameterEpoch;
}

/** Every response for a created research Case remains bound to that exact
 * release, resolved input, and content-addressed document chain. */
function isResponseBoundToResearchDocumentSession(
  response: ProtocolEnvelope,
  binding: ResearchDocumentSessionBindingV1,
): boolean {
  if (
    !sameReleaseRef(response.releaseRef, binding.releaseRef)
    || !sameResearchDocumentOrigin(response.sessionOrigin, binding.origin)
  ) return false;

  const frames: unknown[] = [];
  if (response.ok) {
    const payload = response.payload;
    if (isRecord(payload)) {
      const payloadRecord = payload as unknown as Record<string, unknown>;
      if ("observableFrame" in payloadRecord) {
        frames.push(payloadRecord.observableFrame);
      }
      if ("finalObservableFrame" in payloadRecord) {
        frames.push(payloadRecord.finalObservableFrame);
      }
      if (Array.isArray(payloadRecord.observableFrames)) {
        frames.push(...payloadRecord.observableFrames);
      }
      if (isRecord(payloadRecord.checkpoint)) {
        if (!sameReleaseRef(
          payloadRecord.checkpoint.releaseRef,
          binding.releaseRef,
        )) {
          return false;
        }
        const checkpointInputSha256 =
          payloadRecord.checkpoint.schemaVersion === 4
            ? payloadRecord.checkpoint.baseSessionInputSha256
            : payloadRecord.checkpoint.sessionInputSha256;
        if (
          checkpointInputSha256
            !== binding.origin.sessionInputSha256
        ) return false;
      }
    }
  } else {
    frames.push(...response.error.observableFrames);
    const partial = response.error.partialProgress;
    if (isRecord(partial) && "finalObservableFrame" in partial) {
      frames.push(partial.finalObservableFrame);
    }
  }
  return frames.every((frame) =>
    isRecord(frame) && sameReleaseRef(frame.releaseRef, binding.releaseRef));
}

function sameResearchDocumentOrigin(
  value: unknown,
  expected: ResearchDocumentCaseOriginV1,
): boolean {
  if (!isRecord(value) || value.kind !== expected.kind) return false;
  return value.presetId === expected.presetId
    && value.presetVersion === expected.presetVersion
    && value.catalogSchemaId === expected.catalogSchemaId
    && value.catalogSchemaVersion === expected.catalogSchemaVersion
    && value.classification === expected.classification
    && value.officialTrustClaimed === false
    && value.clinicalDiagnosisClaimed === false
    && value.periodicSteadyStateClaimed === false
    && sameReleaseRef(value.releaseRef, expected.releaseRef)
    && value.sessionInputSha256 === expected.sessionInputSha256
    && sameDocumentRef(value.presetRef, expected.presetRef)
    && sameDocumentRef(value.caseRef, expected.caseRef)
    && sameDocumentRef(value.workspaceRef, expected.workspaceRef)
    && value.initializationProtocolId === expected.initializationProtocolId
    && value.initializationProtocolVersion
      === expected.initializationProtocolVersion;
}

function captureResolvedSessionInputIdentity(
  value: unknown,
): PendingCommandIdentityV1["resolvedSessionInput"] {
  if (!isRecord(value)) return null;
  if (typeof value.sessionInputSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(value.sessionInputSha256)
    || !isReleaseRef(value.releaseRef)) return null;
  const releaseRef = value.releaseRef;
  return Object.freeze({
    sessionInputSha256: value.sessionInputSha256,
    releaseRef: Object.freeze({
      id: releaseRef.id,
      version: releaseRef.version,
      sha256: releaseRef.sha256,
    }),
  });
}

function captureExactCheckpointIdentity(
  value: unknown,
): PendingCommandIdentityV1["exactCheckpoint"] {
  if (!isRecord(value)
    || value.checkpointId
      !== "main-wire-scientific-session-exact-checkpoint-v3"
    || value.schemaVersion !== 3
    || typeof value.checkpointSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(value.checkpointSha256)
    || typeof value.sessionInputSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(value.sessionInputSha256)
    || !isReleaseRef(value.releaseRef)) return null;
  return Object.freeze({
    checkpointSha256: value.checkpointSha256,
    sessionInputSha256: value.sessionInputSha256,
    releaseRef: Object.freeze({ ...value.releaseRef }),
  });
}

function captureExactCheckpointV4Identity(
  value: unknown,
): PendingCommandIdentityV1["exactCheckpointV4"] {
  if (!isRecord(value)
    || value.checkpointId
      !== "main-wire-scientific-session-exact-checkpoint-v4"
    || value.schemaVersion !== 4
    || !isSha256(value.checkpointSha256)
    || !isSha256(value.baseSessionInputSha256)
    || !isSha256(value.controlTargetStateSha256)
    || !Number.isSafeInteger(value.parameterEpoch)
    || (value.parameterEpoch as number) < 0
    || !isReleaseRef(value.releaseRef)
    || !isRecord(value.controlTargetState)
    || value.controlTargetState.targetStateSha256
      !== value.controlTargetStateSha256) return null;
  let checkpointCandidate: unknown;
  try {
    checkpointCandidate = JSON.parse(canonicalJsonStringify(value)) as unknown;
  } catch {
    return null;
  }
  return Object.freeze({
    checkpointSha256: value.checkpointSha256,
    baseSessionInputSha256: value.baseSessionInputSha256,
    controlTargetStateSha256: value.controlTargetStateSha256,
    parameterEpoch: value.parameterEpoch as number,
    releaseRef: Object.freeze({ ...value.releaseRef }),
    checkpointCandidate,
  });
}

function requiresExactCheckpointV4IntegrityValidationV1(
  response: ProtocolEnvelope,
  pending: PendingRequest,
): boolean {
  return response.ok
    && (
      pending.commandKind === "getExactCheckpointV4"
      || pending.commandKind === "restoreExactSessionV4"
    );
}

async function isExactCheckpointV4IntegrityValidV1(
  response: ProtocolEnvelope,
  submitted: PendingCommandIdentityV1,
): Promise<boolean> {
  if (!response.ok) return true;
  let checkpointCandidate: unknown;
  let expectedBaseSessionInputSha256: string | null;
  if (submitted.kind === "getExactCheckpointV4") {
    const payload = response.payload;
    if (
      !isRecord(payload)
      || !("checkpoint" in payload)
      || !("resolvedSessionInput" in payload)
    ) return false;
    checkpointCandidate = payload.checkpoint;
    expectedBaseSessionInputSha256 =
      exactCheckpointV4BaseSessionInputForOriginV1(response.sessionOrigin);
    if (expectedBaseSessionInputSha256 === null) return false;
    try {
      const resolvedInput =
        await loadMainWireScientificResolvedSessionInputEnvelopeV1(
          payload.resolvedSessionInput,
          response.releaseRef,
        );
      if (
        resolvedInput.sessionInputSha256
          !== expectedBaseSessionInputSha256
      ) return false;
    } catch {
      return false;
    }
  } else if (submitted.kind === "restoreExactSessionV4") {
    checkpointCandidate =
      submitted.exactCheckpointV4?.checkpointCandidate ?? null;
    expectedBaseSessionInputSha256 =
      submitted.resolvedSessionInput?.sessionInputSha256 ?? null;
  } else {
    return true;
  }
  if (
    expectedBaseSessionInputSha256 === null
    || !isRecord(checkpointCandidate)
    || !isRecord(checkpointCandidate.stateCodec)
  ) return false;

  try {
    await loadMainWireScientificSessionExactCheckpointV4(
      {
        releaseRef: response.releaseRef,
        baseSessionInputSha256: expectedBaseSessionInputSha256,
        stateCodec: checkpointCandidate.stateCodec as MainWireScientificSessionStateCodecIdentityV4,
      },
      checkpointCandidate,
    );
    return true;
  } catch {
    return false;
  }
}

function exactCheckpointV4BaseSessionInputForOriginV1(
  origin: ScientificSessionOriginV1,
): string | null {
  if (
    origin.kind === "resolved-session-input-cold-start"
    || origin.kind === "exact-checkpoint-restore"
    || origin.kind === "research-preset-cold-start"
    || origin.kind === "research-document-case-cold-start"
    || origin.kind
      === "official-document-case-v3-exact-checkpoint-restore"
  ) return origin.sessionInputSha256;
  if (
    origin.kind === "research-control-state-preserving-fork-v0"
    || origin.kind === "control-aware-exact-checkpoint-v4-restore"
  ) return origin.baseSessionInputSha256;
  return null;
}

function isExactCheckpointResponseCompatible(
  response: ProtocolEnvelope,
): boolean {
  const payload = response.payload;
  if (!isRecord(payload)
    || !hasExactKeys(payload, ["kind", "checkpoint", "observableFrame"])
    || payload.kind !== "exactCheckpoint"
    || !isRecord(payload.observableFrame)) return false;
  const checkpoint = captureExactCheckpointIdentity(payload.checkpoint);
  if (checkpoint === null
    || !sameReleaseRef(response.releaseRef, checkpoint.releaseRef)
    || !sameReleaseRef(
      payload.observableFrame.releaseRef,
      checkpoint.releaseRef,
    )) return false;
  const origin = response.sessionOrigin;
  if (origin.kind === "resolved-session-input-cold-start") {
    return origin.sessionInputSha256 === checkpoint.sessionInputSha256;
  }
  if (origin.kind === "exact-checkpoint-restore") {
    return origin.sessionInputSha256 === checkpoint.sessionInputSha256;
  }
  if (origin.kind === "research-preset-cold-start") {
    return origin.sessionInputSha256 === checkpoint.sessionInputSha256
      && sameReleaseRef(origin.releaseRef, checkpoint.releaseRef);
  }
  if (origin.kind === "research-document-case-cold-start") {
    return origin.sessionInputSha256 === checkpoint.sessionInputSha256
      && exactResearchReleaseRef(checkpoint.releaseRef)
      && sameReleaseRef(origin.releaseRef, checkpoint.releaseRef);
  }
  if (origin.kind
    === "official-document-case-v3-exact-checkpoint-restore") {
    return origin.sessionInputSha256 === checkpoint.sessionInputSha256
      && exactOfficialDocumentChainReleaseRef(checkpoint.releaseRef);
  }
  return true;
}

function isExactCheckpointV4ResponseCompatible(
  response: ProtocolEnvelope,
): boolean {
  const payload = response.payload;
  if (!isRecord(payload)
    || !hasExactKeys(payload, [
      "kind",
      "resolvedSessionInput",
      "checkpoint",
      "observableFrame",
    ])
    || payload.kind !== "exactCheckpointV4"
    || !isRecord(payload.observableFrame)) return false;
  const checkpoint = captureExactCheckpointV4Identity(payload.checkpoint);
  if (checkpoint === null
    || !sameReleaseRef(response.releaseRef, checkpoint.releaseRef)
    || !sameReleaseRef(
      payload.observableFrame.releaseRef,
      checkpoint.releaseRef,
    )) return false;
  const origin = response.sessionOrigin;
  if (origin.kind === "research-control-state-preserving-fork-v0") {
    return checkpoint.baseSessionInputSha256
      === origin.baseSessionInputSha256
      && checkpoint.controlTargetStateSha256
        === origin.targetControlStateSha256
      && checkpoint.parameterEpoch === origin.parameterEpoch;
  }
  if (origin.kind === "control-aware-exact-checkpoint-v4-restore") {
    return checkpoint.baseSessionInputSha256
      === origin.baseSessionInputSha256
      && checkpoint.controlTargetStateSha256
        === origin.controlTargetStateSha256
      && checkpoint.parameterEpoch === origin.parameterEpoch;
  }
  if (origin.kind === "resolved-session-input-cold-start") {
    return origin.sessionInputSha256
      === checkpoint.baseSessionInputSha256;
  }
  if (origin.kind === "exact-checkpoint-restore") {
    return origin.sessionInputSha256
      === checkpoint.baseSessionInputSha256;
  }
  if (origin.kind === "research-preset-cold-start") {
    return origin.sessionInputSha256
      === checkpoint.baseSessionInputSha256
      && sameReleaseRef(origin.releaseRef, checkpoint.releaseRef);
  }
  if (origin.kind === "research-document-case-cold-start") {
    return origin.sessionInputSha256
      === checkpoint.baseSessionInputSha256
      && sameReleaseRef(origin.releaseRef, checkpoint.releaseRef);
  }
  if (origin.kind
    === "official-document-case-v3-exact-checkpoint-restore") {
    return origin.sessionInputSha256
      === checkpoint.baseSessionInputSha256;
  }
  return false;
}

function sameReleaseRef(left: unknown, right: unknown): boolean {
  return isRecord(left) && isRecord(right)
    && left.id === right.id
    && left.version === right.version
    && left.sha256 === right.sha256;
}

function sameDocumentRef(left: unknown, right: unknown): boolean {
  return isRecord(left) && isRecord(right)
    && hasExactKeys(left, ["schemaId", "sha256"])
    && hasExactKeys(right, ["schemaId", "sha256"])
    && left.schemaId === right.schemaId
    && left.sha256 === right.sha256
    && typeof left.sha256 === "string"
    && /^[0-9a-f]{64}$/.test(left.sha256);
}

function documentRefHasSha256(value: unknown, sha256: string): boolean {
  return isRecord(value) && value.sha256 === sha256;
}

function isResearchPresetIdentity(
  presetId: unknown,
  presetVersion: unknown,
): boolean {
  return typeof presetId === "string"
    && MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_IDS_V1.includes(
      presetId as MainWireScientificResearchPresetIdV1,
    )
    && presetVersion === MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION;
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

function isAcceptedStateIdentityV0(value: unknown): value is Readonly<{
  revision: number;
  acceptedTimeSec: number;
  totalBloodVolumeMl: number;
}> {
  return isRecord(value)
    && hasExactKeys(value, [
      "revision",
      "acceptedTimeSec",
      "totalBloodVolumeMl",
    ])
    && Number.isSafeInteger(value.revision)
    && (value.revision as number) >= 0
    && Number.isFinite(value.acceptedTimeSec)
    && (value.acceptedTimeSec as number) >= 0
    && Number.isFinite(value.totalBloodVolumeMl)
    && (value.totalBloodVolumeMl as number) > 0;
}

function sameAcceptedStateIdentityV0(
  left: Readonly<{
    revision: number;
    acceptedTimeSec: number;
    totalBloodVolumeMl: number;
  }>,
  right: Readonly<{
    revision: number;
    acceptedTimeSec: number;
    totalBloodVolumeMl: number;
  }>,
): boolean {
  return left.revision === right.revision
    && left.acceptedTimeSec === right.acceptedTimeSec
    && left.totalBloodVolumeMl === right.totalBloodVolumeMl;
}

function isResearchControlTargetStateIdentityV0(
  value: unknown,
  expectedSha256?: string,
): boolean {
  if (!isRecord(value) || !hasExactKeys(value, [
    "schemaId",
    "schemaVersion",
    "releaseRef",
    "catalogRef",
    "classification",
    "controls",
    "provenance",
    "claims",
    "targetStateSha256",
  ])) return false;
  if (
    value.schemaId
      !== MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_TARGET_STATE_V0_SCHEMA_ID
    || value.schemaVersion !== 0
    || !exactResearchReleaseRef(value.releaseRef)
    || value.classification !== "research-only-experimental-not-clinical"
    || !isSha256(value.targetStateSha256)
    || (
      expectedSha256 !== undefined
      && value.targetStateSha256 !== expectedSha256
    )
    || !isRecord(value.controls)
    || !hasExactKeys(
      value.controls,
      MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0,
    )
  ) return false;
  return MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0.every((controlId) => (
    (MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[
      controlId
    ].allowedValues as readonly number[]).includes(
      value.controls[controlId] as number,
    )
  ));
}

function isOfficialBaselineResearchControlContextV0(
  value: unknown,
  observableFrame: Readonly<Record<string, unknown>>,
): boolean {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      "stateIdentity",
      "controlState",
      "parameterEpoch",
    ])
    || !isAcceptedStateIdentityV0(value.stateIdentity)
    || value.parameterEpoch !== 0
    || value.stateIdentity.revision !== observableFrame.revision
    || value.stateIdentity.acceptedTimeSec !== observableFrame.acceptedTimeSec
    || !isResearchControlTargetStateIdentityV0(
      value.controlState,
      MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_TARGET_STATE_SHA256_V0,
    )
  ) return false;

  const controlState = value.controlState as Record<string, unknown>;
  const catalogRef = controlState.catalogRef;
  const controls = controlState.controls;
  const provenance = controlState.provenance;
  const claims = controlState.claims;
  return isRecord(catalogRef)
    && hasExactKeys(catalogRef, [
      "schemaId",
      "catalogId",
      "catalogVersion",
      "catalogSha256",
    ])
    && catalogRef.schemaId
      === MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_SCHEMA_ID
    && catalogRef.catalogId
      === MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_ID
    && catalogRef.catalogVersion
      === MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_VERSION
    && catalogRef.catalogSha256
      === MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_SHA256_V0
    && isRecord(controls)
    && MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0.every((controlId) => (
      controls[controlId]
        === MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0[controlId]
    ))
    && isRecord(provenance)
    && hasExactKeys(provenance, [
      "resolverId",
      "resolverVersion",
      "resolution",
      "digestSemantics",
    ])
    && provenance.resolverId
      === MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_TARGET_STATE_RESOLVER_V0_ID
    && provenance.resolverVersion === "0.1.0"
    && provenance.resolution === "complete-target-state-not-patch"
    && provenance.digestSemantics
      === "sha256-canonical-json-payload-without-targetStateSha256"
    && isRecord(claims)
    && hasExactKeys(claims, [
      "completeTargetState",
      "baselineValuesExplicit",
      "partialPatchAccepted",
      "arbitraryParameterPatchAccepted",
      "implicitLastWriteWinsApplied",
      "researchOnly",
      "experimental",
      "clinicalDiagnosisClaimed",
      "clinicalValidationClaimed",
      "patientSpecificFitClaimed",
    ])
    && claims.completeTargetState === true
    && claims.baselineValuesExplicit === true
    && claims.partialPatchAccepted === false
    && claims.arbitraryParameterPatchAccepted === false
    && claims.implicitLastWriteWinsApplied === false
    && claims.researchOnly === true
    && claims.experimental === true
    && claims.clinicalDiagnosisClaimed === false
    && claims.clinicalValidationClaimed === false
    && claims.patientSpecificFitClaimed === false;
}

function isResearchControlContextV4(
  value: unknown,
  observableFrame: Readonly<Record<string, unknown>>,
  expectedControlTargetStateSha256: string,
  expectedParameterEpoch: number,
): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      "stateIdentity",
      "controlState",
      "parameterEpoch",
    ])
    && isAcceptedStateIdentityV0(value.stateIdentity)
    && value.stateIdentity.revision === observableFrame.revision
    && value.stateIdentity.acceptedTimeSec
      === observableFrame.acceptedTimeSec
    && value.parameterEpoch === expectedParameterEpoch
    && isResearchControlTargetStateIdentityV0(
      value.controlState,
      expectedControlTargetStateSha256,
    );
}

function isPresetDocumentRef(value: unknown): boolean {
  return isExactDocumentRef(
    value,
    "circleheart-main-wire-scientific-preset-document-ref-v1",
  );
}

function isCaseDocumentRef(value: unknown): boolean {
  return isExactDocumentRef(
    value,
    "circleheart-main-wire-scientific-case-document-ref-v1",
  );
}

function isWorkspaceDocumentRef(value: unknown): boolean {
  return isExactDocumentRef(
    value,
    "circleheart-main-wire-scientific-workspace-document-ref-v1",
  );
}

function isExactDocumentRef(value: unknown, schemaId: string): boolean {
  return isRecord(value)
    && hasExactKeys(value, ["schemaId", "sha256"])
    && value.schemaId === schemaId
    && isSha256(value.sha256);
}

/**
 * Synchronous transport validation only. Content-address verification remains
 * owned by the Worker document loader; here we require the exact envelope and
 * both reference links before presentation data can cross into browser UI.
 */
function isWorkspaceDocumentTransportV1(
  value: unknown,
  caseRef: unknown,
  workspaceRef: unknown,
): boolean {
  if (!isRecord(value) || !hasExactKeys(value, ["ref", "content"])) {
    return false;
  }
  if (
    !sameDocumentRef(value.ref, workspaceRef)
    || !isWorkspaceDocumentRef(value.ref)
    || !isRecord(value.content)
    || !hasExactKeys(value.content, [
      "schemaId",
      "schemaVersion",
      "revision",
      "caseDocumentRef",
      "panels",
      "notes",
    ])
  ) return false;
  return value.content.schemaId
      === "circleheart-main-wire-scientific-workspace-document-content-v1"
    && value.content.schemaVersion === 1
    && Number.isSafeInteger(value.content.revision)
    && (value.content.revision as number) >= 0
    && sameDocumentRef(value.content.caseDocumentRef, caseRef)
    && Array.isArray(value.content.panels)
    && (
      value.content.notes === null
      || typeof value.content.notes === "string"
    );
}

function exactOfficialReleaseRef(value: unknown): boolean {
  return isRecord(value)
    && value.id
      === OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING.releaseRef.id
    && value.version
      === OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING.releaseRef.version
    && value.sha256
      === OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING.releaseRef.sha256;
}

function exactOfficialDocumentChainReleaseRef(value: unknown): boolean {
  const releaseRef =
    OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_BINDING.releaseRef;
  return isRecord(value)
    && value.id === releaseRef.id
    && value.version === releaseRef.version
    && value.sha256 === releaseRef.sha256;
}

function exactResearchReleaseRef(value: unknown): boolean {
  return sameReleaseRef(
    value,
    MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.releaseRef,
  );
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index]);
}

function responseRequestId(value: unknown): string | null {
  return isRecord(value) && typeof value.requestId === "string"
    ? value.requestId
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function newTransportError(
  code: MainWireScientificWorkerTransportErrorCodeV1,
  message: string,
): MainWireScientificWorkerTransportErrorV1 {
  return new MainWireScientificWorkerTransportErrorV1(code, message);
}

const DEFAULT_MAXIMUM_PENDING_REQUEST_COUNT = 8;
const MAXIMUM_CONFIGURED_PENDING_REQUEST_COUNT = 64;
const DEFAULT_MAXIMUM_REQUEST_COUNT_PER_CLIENT_LIFETIME = 8_192;
const MAXIMUM_CONFIGURED_REQUEST_COUNT_PER_CLIENT_LIFETIME = 100_000;
const DEFAULT_REQUEST_TIMEOUT_MS = 60_000;
const MAXIMUM_CONFIGURED_REQUEST_TIMEOUT_MS = 10 * 60_000;
const RESERVED_RECOVERY_REQUEST_COUNT = 16;

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
