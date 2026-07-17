import type { MainWireScientificObservableFrameV1 } from "@/engine/scientific/observables";
import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificCommandKindV1,
  type ScientificCommandResponseV1,
  type ScientificCommandV1,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import {
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING,
} from "@/engine/scientific/presets";
import type {
  SimulationReleaseRef,
} from "@/engine/scientific/release";

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
  officialPreset: Readonly<{
    presetId: "circleheart/official-healthy-periodic";
    presetVersion: "1.0.0";
  }> | null;
}>;

/**
 * Browser transport only. It does not interpret scientific payloads and owns
 * no backend selection, fallback, identifiers, or simulation state.
 */
export class MainWireScientificWorkerClientV1 {
  readonly clientId = MAIN_WIRE_SCIENTIFIC_WORKER_CLIENT_V1_ID;
  readonly maximumPendingRequestCount: number;
  readonly maximumRequestCountPerClientLifetime: number;

  private readonly worker: MainWireScientificWorkerLikeV1;
  private readonly pending = new Map<string, PendingRequest>();
  private readonly completedRequestIds = new Set<string>();
  private currentStatus: MainWireScientificWorkerClientStatusV1 = "open";
  private terminalError: MainWireScientificWorkerTransportErrorV1 | null = null;

  private readonly onMessage = (event: MessageEvent<unknown>): void => {
    this.handleMessage(event.data);
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
      const pending = Object.freeze({
        requestId: command.requestId,
        sessionId: command.sessionId,
        commandKind: command.kind,
        submittedCommand: capturePendingCommandIdentity(command),
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

  private handleMessage(value: unknown): void {
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
    if (!isResponseCompatibleWithSubmittedCommand(
      value,
      pending.submittedCommand,
    )) {
      this.failClosed(newTransportError(
        "protocol-mismatch",
        `scientific Worker response payload/origin does not match requestId ${value.requestId}`,
      ));
      return;
    }
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
    for (const request of pending) request.reject(error);
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
    return hasExactKeys(value, ["kind", "checkpointSha256"])
      && typeof value.checkpointSha256 === "string"
      && /^[0-9a-f]{64}$/.test(value.checkpointSha256);
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
      ? captureResolvedSessionInputIdentity(command.resolvedSessionInput)
      : null,
    officialPreset: command.kind === "createOfficialPresetSession"
      ? Object.freeze({
        presetId: command.presetId,
        presetVersion: command.presetVersion,
      })
      : null,
  });
}

function isResponseCompatibleWithSubmittedCommand(
  response: ProtocolEnvelope,
  submitted: PendingCommandIdentityV1,
): boolean {
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
  return true;
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

function sameReleaseRef(left: unknown, right: unknown): boolean {
  return isRecord(left) && isRecord(right)
    && left.id === right.id
    && left.version === right.version
    && left.sha256 === right.sha256;
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
