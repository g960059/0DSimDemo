import type {
  HotPathIntegrityTierV1,
} from "@/engine/hotPathIntegrityTierV1";
import {
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_CAPABILITY_KEYS_V1,
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1,
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
  type MainWireIntegratedScientificWorkerCommandKindV1,
  type MainWireIntegratedScientificWorkerCommandV1,
  type MainWireIntegratedScientificWorkerResponseV1,
} from "@/engine/myocardium/MainWireIntegratedScientificWorkerProtocolV1";
import {
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1,
} from "@/engine/scientificBrowser/mainWireIntegratedScientificBrowserRuntimeLimitsV1";

export const MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_CLIENT_V1_ID =
  "main-wire-integrated-scientific-worker-client-v1" as const;

export type MainWireIntegratedScientificWorkerTransportErrorCodeV1 =
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

export class MainWireIntegratedScientificWorkerTransportErrorV1
extends Error {
  readonly code: MainWireIntegratedScientificWorkerTransportErrorCodeV1;
  readonly detail: unknown;

  constructor(
    code: MainWireIntegratedScientificWorkerTransportErrorCodeV1,
    message: string,
    detail: unknown = null,
  ) {
    super(message);
    this.name = "MainWireIntegratedScientificWorkerTransportErrorV1";
    this.code = code;
    this.detail = detail;
  }
}

export type MainWireIntegratedScientificWorkerClientStatusV1 =
  | "open"
  | "failed"
  | "terminated";

type MessageListener = (event: MessageEvent<unknown>) => void;
type ErrorListener = (event: ErrorEvent) => void;

export interface MainWireIntegratedScientificWorkerLikeV1 {
  postMessage(message: unknown): void;
  terminate(): void;
  addEventListener(type: "message", listener: MessageListener): void;
  addEventListener(type: "messageerror", listener: MessageListener): void;
  addEventListener(type: "error", listener: ErrorListener): void;
  removeEventListener(type: "message", listener: MessageListener): void;
  removeEventListener(type: "messageerror", listener: MessageListener): void;
  removeEventListener(type: "error", listener: ErrorListener): void;
}

export type MainWireIntegratedScientificWorkerFactoryV1 =
  () => MainWireIntegratedScientificWorkerLikeV1;

export type MainWireIntegratedScientificWorkerClientOptionsV1 = Readonly<{
  workerFactory?: MainWireIntegratedScientificWorkerFactoryV1;
  maximumPendingRequestCount?: number;
  maximumRequestCountPerClientLifetime?: number;
  requestTimeoutMs?: number;
}>;

/**
 * Production Worker factory. Direct callers default to the conservative tier;
 * the live-only browser host opts into `hot-path-lean` explicitly.
 */
export function createDefaultMainWireIntegratedScientificWorkerV1(
  integrityTier: HotPathIntegrityTierV1 = "full-invariant",
): MainWireIntegratedScientificWorkerLikeV1 {
  return new Worker(
    new URL("./mainWireIntegratedScientificWorkerV1.ts", import.meta.url),
    { type: "module", name: integrityTier },
  ) as unknown as MainWireIntegratedScientificWorkerLikeV1;
}

type PendingRequest = Readonly<{
  requestId: string;
  sessionId: string;
  commandKind: MainWireIntegratedScientificWorkerCommandKindV1;
  command: MainWireIntegratedScientificWorkerCommandV1;
  timeoutHandle: ReturnType<typeof setTimeout>;
  resolve: (
    response: MainWireIntegratedScientificWorkerResponseV1,
  ) => void;
  reject: (
    error: MainWireIntegratedScientificWorkerTransportErrorV1,
  ) => void;
}>;

const MAXIMUM_CONFIGURED_PENDING_REQUEST_COUNT = 64;
const MAXIMUM_CONFIGURED_REQUEST_COUNT_PER_CLIENT_LIFETIME = 100_000;
const MAXIMUM_CONFIGURED_REQUEST_TIMEOUT_MS = 60_000;
const RESERVED_RECOVERY_REQUEST_COUNT = 2;
const OBSERVABLE_IDS_V1 = Object.freeze([
  "hemodynamics.volume.LV",
  "hemodynamics.pressure.absolute.LV",
  "hemodynamics.pressure.absolute.Ao",
  "coronary.flow.total",
  "coronary.flow.inlet.LAD",
  "coronary.flow.inlet.LCx",
  "coronary.flow.inlet.RCA",
  "device.LVAD.flow",
] as const);
const SCIENTIFIC_ERROR_CODES_V1 = new Set([
  "invalid-command",
  "duplicate-request-id",
  "request-capacity-exceeded",
  "command-queue-capacity-exceeded",
  "duplicate-session-id",
  "retired-session-id",
  "unknown-session-id",
  "session-capacity-exceeded",
  "presentation-ordinal-mismatch",
  "simulation-step-failed",
  "session-creation-failed",
  "checkpoint-failed",
  "operational-restore-rejected",
  "command-failed",
]);

export class MainWireIntegratedScientificWorkerClientV1 {
  readonly clientId =
    MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_CLIENT_V1_ID;
  readonly maximumPendingRequestCount: number;
  readonly maximumRequestCountPerClientLifetime: number;
  readonly requestTimeoutMs: number;

  private readonly worker: MainWireIntegratedScientificWorkerLikeV1;
  private readonly pending = new Map<string, PendingRequest>();
  private readonly completedRequestIds = new Set<string>();
  private currentStatus:
    MainWireIntegratedScientificWorkerClientStatusV1 = "open";
  private terminalError:
    MainWireIntegratedScientificWorkerTransportErrorV1 | null = null;

  private readonly onMessage = (event: MessageEvent<unknown>): void => {
    const requestId = responseRequestIdV1(event.data);
    if (
      requestId !== null
      && this.completedRequestIds.has(requestId)
    ) {
      this.failClosed(newTransportErrorV1(
        "duplicate-response",
        `integrated Worker repeated response requestId ${requestId}`,
      ));
      return;
    }
    this.handleMessage(event.data);
  };

  private readonly onMessageError = (
    event: MessageEvent<unknown>,
  ): void => {
    this.failClosed(
      new MainWireIntegratedScientificWorkerTransportErrorV1(
        "message-deserialization-error",
        "integrated Worker emitted a messageerror event",
        event.data,
      ),
    );
  };

  private readonly onWorkerError = (event: ErrorEvent): void => {
    event.preventDefault?.();
    this.failClosed(
      new MainWireIntegratedScientificWorkerTransportErrorV1(
        "worker-error",
        event.message || "integrated Worker emitted an error event",
        event.error ?? null,
      ),
    );
  };

  constructor(
    options: MainWireIntegratedScientificWorkerClientOptionsV1 = {},
  ) {
    this.maximumPendingRequestCount = boundedPositiveIntegerV1(
      options.maximumPendingRequestCount
        ?? MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
          .maximumPendingRequestCount,
      MAXIMUM_CONFIGURED_PENDING_REQUEST_COUNT,
      "maximumPendingRequestCount",
    );
    this.maximumRequestCountPerClientLifetime = boundedPositiveIntegerV1(
      options.maximumRequestCountPerClientLifetime
        ?? MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
          .maximumRequestCountPerLifetime,
      MAXIMUM_CONFIGURED_REQUEST_COUNT_PER_CLIENT_LIFETIME,
      "maximumRequestCountPerClientLifetime",
    );
    this.requestTimeoutMs = boundedPositiveIntegerV1(
      options.requestTimeoutMs
        ?? MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
          .requestTimeoutMs,
      MAXIMUM_CONFIGURED_REQUEST_TIMEOUT_MS,
      "requestTimeoutMs",
    );
    this.worker = (options.workerFactory
      ?? createDefaultMainWireIntegratedScientificWorkerV1)();
    this.worker.addEventListener("message", this.onMessage);
    this.worker.addEventListener("messageerror", this.onMessageError);
    this.worker.addEventListener("error", this.onWorkerError);
  }

  get status(): MainWireIntegratedScientificWorkerClientStatusV1 {
    return this.currentStatus;
  }

  get pendingRequestCount(): number {
    return this.pending.size;
  }

  get requestCount(): number {
    return this.completedRequestIds.size + this.pending.size;
  }

  request(
    command: MainWireIntegratedScientificWorkerCommandV1,
  ): Promise<MainWireIntegratedScientificWorkerResponseV1> {
    if (this.currentStatus !== "open") {
      return Promise.reject(
        this.terminalError
          ?? newTransportErrorV1(
            "client-terminated",
            "integrated Worker client is not open",
          ),
      );
    }
    if (
      command.protocolId
        !== MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID
    ) {
      return Promise.reject(newTransportErrorV1(
        "protocol-mismatch",
        "command protocolId does not match the integrated Worker protocol",
      ));
    }
    if (this.pending.has(command.requestId)) {
      return Promise.reject(newTransportErrorV1(
        "duplicate-request-id",
        `requestId ${command.requestId} is already pending`,
      ));
    }
    if (this.completedRequestIds.has(command.requestId)) {
      return Promise.reject(newTransportErrorV1(
        "request-id-reused",
        `requestId ${command.requestId} was already completed`,
      ));
    }
    const used = this.completedRequestIds.size + this.pending.size;
    if (used >= this.maximumRequestCountPerClientLifetime) {
      const recoveryCommand =
        command.kind === "getOperationalCheckpoint"
        || command.kind === "disposeSession";
      if (
        !recoveryCommand
        || used
          >= this.maximumRequestCountPerClientLifetime
            + RESERVED_RECOVERY_REQUEST_COUNT
      ) {
        return Promise.reject(newTransportErrorV1(
          "request-capacity-exceeded",
          "integrated Worker client request capacity is exhausted",
        ));
      }
    }
    if (this.pending.size >= this.maximumPendingRequestCount) {
      return Promise.reject(newTransportErrorV1(
        "pending-request-capacity-exceeded",
        "integrated Worker client pending request capacity is exhausted",
      ));
    }

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        if (!this.pending.has(command.requestId)) return;
        this.failClosed(
          new MainWireIntegratedScientificWorkerTransportErrorV1(
            "request-timeout",
            `integrated Worker did not answer ${command.kind} request ${command.requestId} within ${this.requestTimeoutMs} ms`,
            Object.freeze({
              requestId: command.requestId,
              sessionId: command.sessionId,
              commandKind: command.kind,
              timeoutMs: this.requestTimeoutMs,
            }),
          ),
        );
      }, this.requestTimeoutMs);
      this.pending.set(command.requestId, Object.freeze({
        requestId: command.requestId,
        sessionId: command.sessionId,
        commandKind: command.kind,
        command,
        timeoutHandle,
        resolve,
        reject,
      }));
      try {
        this.worker.postMessage(command);
      } catch (error) {
        this.failClosed(
          new MainWireIntegratedScientificWorkerTransportErrorV1(
            "post-message-failed",
            "integrated Worker postMessage failed",
            error,
          ),
        );
      }
    });
  }

  terminate(): void {
    if (this.currentStatus !== "open") return;
    this.close(
      "terminated",
      newTransportErrorV1(
        "client-terminated",
        "integrated Worker client was terminated",
      ),
    );
  }

  private handleMessage(value: unknown): void {
    if (this.currentStatus !== "open") return;
    const requestId = responseRequestIdV1(value);
    if (!isResponseEnvelopeV1(value)) {
      const detail = isRecordV1(value)
        && value.kind === "main-wire-integrated-worker-fatal-v1"
        && typeof value.message === "string"
        ? `: ${value.message}`
        : "";
      this.failClosed(
        new MainWireIntegratedScientificWorkerTransportErrorV1(
          "protocol-mismatch",
          `integrated Worker response does not match protocol V1${detail}`,
          value,
        ),
      );
      return;
    }
    const pending = this.pending.get(value.requestId);
    if (pending === undefined) {
      this.failClosed(newTransportErrorV1(
        "unsolicited-response",
        `integrated Worker returned unknown requestId ${value.requestId}`,
      ));
      return;
    }
    if (
      requestId !== pending.requestId
      || value.sessionId !== pending.sessionId
      || value.commandKind !== pending.commandKind
      || !isResponseCompatibleWithCommandV1(value, pending.command)
    ) {
      this.failClosed(
        new MainWireIntegratedScientificWorkerTransportErrorV1(
          "protocol-mismatch",
          `integrated Worker response identity or payload does not match requestId ${pending.requestId}`,
          value,
        ),
      );
      return;
    }
    clearTimeout(pending.timeoutHandle);
    this.pending.delete(pending.requestId);
    this.completedRequestIds.add(pending.requestId);
    pending.resolve(value);
  }

  private failClosed(
    error: MainWireIntegratedScientificWorkerTransportErrorV1,
  ): void {
    if (this.currentStatus !== "open") return;
    this.close("failed", error);
  }

  private close(
    status: "failed" | "terminated",
    error: MainWireIntegratedScientificWorkerTransportErrorV1,
  ): void {
    this.currentStatus = status;
    this.terminalError = error;
    this.worker.removeEventListener("message", this.onMessage);
    this.worker.removeEventListener("messageerror", this.onMessageError);
    this.worker.removeEventListener("error", this.onWorkerError);
    this.worker.terminate();
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeoutHandle);
      pending.reject(error);
    }
    this.pending.clear();
  }
}

function isResponseEnvelopeV1(
  value: unknown,
): value is MainWireIntegratedScientificWorkerResponseV1 {
  if (
    !isRecordV1(value)
    || value.protocolId
      !== MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID
    || typeof value.ok !== "boolean"
    || typeof value.requestId !== "string"
    || typeof value.sessionId !== "string"
    || typeof value.commandKind !== "string"
    || !hasExactKeysV1(value, [
      "protocolId",
      "ok",
      "requestId",
      "sessionId",
      "commandKind",
      "laneDescriptor",
      "payload",
      "error",
    ])
  ) return false;
  if (value.ok) {
    return value.error === null
      && isLaneDescriptorV1(value.laneDescriptor)
      && value.payload !== null;
  }
  return value.payload === null
    && (value.laneDescriptor === null
      || isLaneDescriptorV1(value.laneDescriptor))
    && isErrorPayloadV1(value.error);
}

function isResponseCompatibleWithCommandV1(
  response: MainWireIntegratedScientificWorkerResponseV1,
  command: MainWireIntegratedScientificWorkerCommandV1,
): boolean {
  if (response.ok === false) {
    if (
      command.kind === "advanceToPresentationOrdinal"
      && response.error.partialProgress !== null
    ) {
      const progress = response.error.partialProgress;
      return progress.kind === "presentation-advance-partial-progress"
        && progress.requestedPresentationOrdinal
          === command.presentationOrdinal
        && progress.emittedPresentationSample === false
        && progress.observableFrame === null;
    }
    return response.error.partialProgress === null;
  }
  if (response.commandKind !== command.kind) return false;
  const payload = response.payload;
  switch (command.kind) {
    case "createWorkerOwnedPresetSession":
      return payload.kind === "worker-owned-preset-session-created"
        && isSessionSnapshotV1(payload.session);
    case "observe":
      return payload.kind === "observation"
        && isSessionSnapshotV1(payload.session);
    case "advanceToPresentationOrdinal":
      return payload.kind === "presentation-advance"
        && payload.presentationOrdinal === command.presentationOrdinal
        && payload.presentationTimeSec
          === command.presentationOrdinal
            * MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1
              .presentationDtSec
        && payload.acceptedTimeSec === payload.presentationTimeSec
        && Number.isSafeInteger(payload.acceptedRevision)
        && payload.acceptedRevision >= 0
        && Number.isSafeInteger(
          payload.acceptedRevisionSpanFromPrevious,
        )
        && payload.acceptedRevisionSpanFromPrevious >= 0
        && Number.isSafeInteger(payload.internalAcceptedSubstepCount)
        && payload.internalAcceptedSubstepCount >= 0
        && payload.internalAcceptedSubstepCount
          <= MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
            .maximumSubstepCountPerPresentationCommand
        && Number.isSafeInteger(payload.boundaryClippedSubstepCount)
        && payload.boundaryClippedSubstepCount >= 0
        && payload.boundaryClippedSubstepCount
          <= payload.internalAcceptedSubstepCount
        && Array.isArray(payload.substeps)
        && payload.substeps.length
          === payload.internalAcceptedSubstepCount
        && payload.substeps.every(isSubstepRecordV1)
        && (
          payload.status === "advanced"
            ? payload.internalAcceptedSubstepCount >= 1
              && payload.acceptedRevisionSpanFromPrevious
                === payload.internalAcceptedSubstepCount
            : payload.status === "already-at-target"
              && payload.internalAcceptedSubstepCount === 0
              && payload.acceptedRevisionSpanFromPrevious === 0
              && payload.boundaryClippedSubstepCount === 0
        )
        && payload.emittedPresentationSample
          === (payload.status === "advanced")
        && isObservableFrameV1(payload.observableFrame);
    case "getOperationalCheckpoint":
      return payload.kind === "operational-checkpoint"
        && isRecordV1(payload.checkpoint)
        && isSessionSnapshotV1(payload.session);
    case "restoreOperationalCheckpoint":
      return payload.kind
        === "operational-checkpoint-session-restored"
        && isSessionSnapshotV1(payload.session);
    case "disposeSession":
      return payload.kind === "session-disposed"
        && payload.disposedSessionId === command.sessionId;
  }
}

function isLaneDescriptorV1(value: unknown): boolean {
  if (
    !isRecordV1(value)
    || value.laneKind
      !== MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1
        .laneKind
    || value.laneId
      !== MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1
        .laneId
    || typeof value.displayName !== "string"
    || typeof value.badge !== "string"
    || value.lifecycleStatus !== "development"
    || value.evidenceStatus !== "unverified"
    || value.observableCatalogId
      !== MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1
        .observableCatalogId
    || value.observableCatalogSha256
      !== MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1
        .observableCatalogSha256
    || !sameReleaseRefV1(
      value.releaseRef,
      MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1.releaseRef,
    )
    || !Array.isArray(value.limitations)
    || value.limitations.some((item) => typeof item !== "string")
    || !isRecordV1(value.capabilities)
    || !hasExactKeysV1(value, [
      "laneKind",
      "laneId",
      "displayName",
      "badge",
      "releaseRef",
      "lifecycleStatus",
      "evidenceStatus",
      "observableCatalogId",
      "observableCatalogSha256",
      "limitations",
      "capabilities",
    ])
  ) return false;
  const capabilities = value.capabilities;
  if (!hasExactKeysV1(
    capabilities,
    MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_CAPABILITY_KEYS_V1,
  )) return false;
  const availableKeys = new Set([
    "liveWorkerExecution",
    "decimatedLivePresentation",
    "livePacingReporting",
    "operationalWorkerRotationCheckpoint",
  ]);
  for (
    const key
    of MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_CAPABILITY_KEYS_V1
  ) {
    const capability = capabilities[key];
    if (!isRecordV1(capability)) return false;
    if (availableKeys.has(key)) {
      if (
        capability.available !== true
        || !hasExactKeysV1(capability, ["available"])
      ) return false;
    } else if (
      capability.available !== false
      || typeof capability.reason !== "string"
      || typeof capability.explanation !== "string"
      || capability.explanation.trim() === ""
      || !hasExactKeysV1(
        capability,
        ["available", "reason", "explanation"],
      )
    ) return false;
  }
  return true;
}

function isSessionSnapshotV1(value: unknown): boolean {
  return isRecordV1(value)
    && (
      value.presentationOrdinal === null
      || (
        Number.isSafeInteger(value.presentationOrdinal)
        && (value.presentationOrdinal as number) >= 0
      )
    )
    && Number.isSafeInteger(value.acceptedRevision)
    && (value.acceptedRevision as number) >= 0
    && typeof value.acceptedTimeSec === "number"
    && Number.isFinite(value.acceptedTimeSec)
    && value.acceptedTimeSec >= 0
    && isObservableFrameV1(value.observableFrame)
    && hasExactKeysV1(value, [
      "presentationOrdinal",
      "acceptedRevision",
      "acceptedTimeSec",
      "observableFrame",
    ]);
}

function isObservableFrameV1(value: unknown): boolean {
  if (
    !isRecordV1(value)
    || value.frameId
      !== "main-wire-integrated-v3-experimental-observable-frame-v1"
    || value.registryId
      !== "main-wire-integrated-v3-experimental-observable-registry-v1"
    || value.schemaVersion !== 1
    || !isRecordV1(value.values)
  ) return false;
  if (!hasExactKeysV1(value, [
    "frameId",
    "registryId",
    "schemaVersion",
    "values",
  ])) return false;
  if (!hasExactKeysV1(value.values, OBSERVABLE_IDS_V1)) return false;
  return OBSERVABLE_IDS_V1.every((observableId) =>
    isObservableValueV1(value.values[observableId], observableId));
}

function isErrorPayloadV1(value: unknown): boolean {
  return isRecordV1(value)
    && SCIENTIFIC_ERROR_CODES_V1.has(value.code)
    && typeof value.message === "string"
    && value.retryable === false
    && value.silentFallbackApplied === false
    && (
      value.partialProgress === null
      || isAdvancePartialProgressV1(value.partialProgress)
    )
    && hasExactKeysV1(value, [
      "code",
      "message",
      "retryable",
      "silentFallbackApplied",
      "partialProgress",
    ]);
}

function isObservableValueV1(
  value: unknown,
  observableId: string,
): boolean {
  if (
    !isRecordV1(value)
    || value.observableId !== observableId
    || !hasExactKeysV1(value, [
      "observableId",
      "value",
      "availability",
      "quality",
    ])
  ) return false;
  if (value.availability === "available") {
    return typeof value.value === "number"
      && Number.isFinite(value.value)
      && (
        value.quality === "authoritative-state"
        || value.quality === "accepted-derived"
      );
  }
  return value.availability === "not-evaluated-at-accepted-state"
    && value.value === null
    && value.quality === "not-assessed";
}

function isSubstepRecordV1(value: unknown): boolean {
  return isRecordV1(value)
    && Number.isSafeInteger(value.acceptedRevision)
    && value.acceptedRevision >= 1
    && typeof value.acceptedTimeSec === "number"
    && Number.isFinite(value.acceptedTimeSec)
    && value.acceptedTimeSec >= 0
    && typeof value.landedOnPresentationTarget === "boolean"
    && typeof value.clippedByCoronaryWindow === "boolean"
    && typeof value.clippedByRhythmBoundary === "boolean"
    && (
      value.rhythmBoundaryTimeSec === null
      || (
        typeof value.rhythmBoundaryTimeSec === "number"
        && Number.isFinite(value.rhythmBoundaryTimeSec)
      )
    )
    && Array.isArray(value.rhythmBoundaryOwners)
    && value.rhythmBoundaryOwners.every(
      (owner: unknown) => typeof owner === "string",
    )
    && hasExactKeysV1(value, [
      "acceptedRevision",
      "acceptedTimeSec",
      "landedOnPresentationTarget",
      "clippedByCoronaryWindow",
      "clippedByRhythmBoundary",
      "rhythmBoundaryTimeSec",
      "rhythmBoundaryOwners",
    ]);
}

function isAdvancePartialProgressV1(value: unknown): boolean {
  return isRecordV1(value)
    && value.kind === "presentation-advance-partial-progress"
    && Number.isSafeInteger(value.requestedPresentationOrdinal)
    && value.requestedPresentationOrdinal >= 0
    && value.requestedPresentationTimeSec
      === value.requestedPresentationOrdinal
        * MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1
          .presentationDtSec
    && Number.isSafeInteger(value.acceptedRevision)
    && value.acceptedRevision >= 0
    && typeof value.acceptedTimeSec === "number"
    && Number.isFinite(value.acceptedTimeSec)
    && value.acceptedTimeSec >= 0
    && (
      value.lastPresentationOrdinal === null
      || (
        Number.isSafeInteger(value.lastPresentationOrdinal)
        && value.lastPresentationOrdinal >= 0
      )
    )
    && typeof value.partiallyAdvanced === "boolean"
    && Number.isSafeInteger(value.internalAcceptedSubstepCount)
    && value.internalAcceptedSubstepCount >= 0
    && value.internalAcceptedSubstepCount
      <= MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
        .maximumSubstepCountPerPresentationCommand
    && value.emittedPresentationSample === false
    && value.observableFrame === null
    && typeof value.failureReason === "string"
    && hasExactKeysV1(value, [
      "kind",
      "requestedPresentationOrdinal",
      "requestedPresentationTimeSec",
      "acceptedRevision",
      "acceptedTimeSec",
      "lastPresentationOrdinal",
      "partiallyAdvanced",
      "internalAcceptedSubstepCount",
      "emittedPresentationSample",
      "observableFrame",
      "failureReason",
    ]);
}

function sameReleaseRefV1(
  left: unknown,
  right: Readonly<{ id: string; version: string; sha256: string }>,
): boolean {
  return isRecordV1(left)
    && left.id === right.id
    && left.version === right.version
    && left.sha256 === right.sha256
    && hasExactKeysV1(left, ["id", "version", "sha256"]);
}

function responseRequestIdV1(value: unknown): string | null {
  return isRecordV1(value) && typeof value.requestId === "string"
    ? value.requestId
    : null;
}

function isRecordV1(
  value: unknown,
): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeysV1(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index]);
}

function boundedPositiveIntegerV1(
  value: number,
  maximum: number,
  label: string,
): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${label} must be an integer from 1 through ${maximum}`);
  }
  return value;
}

function newTransportErrorV1(
  code: MainWireIntegratedScientificWorkerTransportErrorCodeV1,
  message: string,
): MainWireIntegratedScientificWorkerTransportErrorV1 {
  return new MainWireIntegratedScientificWorkerTransportErrorV1(
    code,
    message,
  );
}
