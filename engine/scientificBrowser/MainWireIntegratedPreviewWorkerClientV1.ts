import type {
  MainWireIntegratedPreviewMcsPresetIdV1,
} from "@/engine/scientific/integratedPreview";
import {
  INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
  type IntegratedPreviewCommandResponseV1,
  type IntegratedPreviewCommandV1,
} from "@/engine/scientific/worker/integratedPreviewCommandProtocolV1";

type MessageListenerV1 = (event: MessageEvent<unknown>) => void;
type ErrorListenerV1 = (event: ErrorEvent) => void;

export interface MainWireIntegratedPreviewWorkerLikeV1 {
  postMessage(message: unknown): void;
  terminate(): void;
  addEventListener(
    type: "message",
    listener: MessageListenerV1,
  ): void;
  addEventListener(
    type: "messageerror",
    listener: MessageListenerV1,
  ): void;
  addEventListener(type: "error", listener: ErrorListenerV1): void;
  removeEventListener(
    type: "message",
    listener: MessageListenerV1,
  ): void;
  removeEventListener(
    type: "messageerror",
    listener: MessageListenerV1,
  ): void;
  removeEventListener(type: "error", listener: ErrorListenerV1): void;
}

export type MainWireIntegratedPreviewWorkerClientOptionsV1 = Readonly<{
  workerFactory?: () => MainWireIntegratedPreviewWorkerLikeV1;
  requestTimeoutMs?: number;
}>;

type Pending = Readonly<{
  requestId: string;
  sessionId: string;
  commandKind: IntegratedPreviewCommandV1["kind"];
  resolve(response: IntegratedPreviewCommandResponseV1): void;
  reject(error: Error): void;
  timeout: ReturnType<typeof setTimeout>;
}>;

export class MainWireIntegratedPreviewWorkerClientV1 {
  private readonly worker: MainWireIntegratedPreviewWorkerLikeV1;
  private readonly requestTimeoutMs: number;
  private readonly pending = new Map<string, Pending>();
  private requestSequence = 0;
  private terminated = false;

  private readonly onMessage = (event: MessageEvent<unknown>): void => {
    if (!isResponse(event.data)) {
      this.quarantine(
        new Error("integrated preview Worker response is invalid"),
      );
      return;
    }
    const pending = this.pending.get(event.data.requestId ?? "");
    if (pending === undefined) {
      this.quarantine(
        new Error("integrated preview Worker response is unsolicited"),
      );
      return;
    }
    if (
      event.data.requestId !== pending.requestId
      || event.data.sessionId !== pending.sessionId
      || event.data.commandKind !== pending.commandKind
    ) {
      this.quarantine(
        new Error(
          "integrated preview Worker response identity does not match "
            + `pending request ${pending.requestId}`,
        ),
      );
      return;
    }
    clearTimeout(pending.timeout);
    this.pending.delete(pending.requestId);
    pending.resolve(event.data);
  };

  private readonly onMessageError = (
    _event: MessageEvent<unknown>,
  ): void => {
    this.quarantine(
      new Error("integrated preview Worker emitted a messageerror event"),
    );
  };

  private readonly onWorkerError = (event: ErrorEvent): void => {
    event.preventDefault?.();
    this.quarantine(
      new Error(
        event.message || "integrated preview Worker emitted an error event",
      ),
    );
  };

  constructor(options: MainWireIntegratedPreviewWorkerClientOptionsV1 = {}) {
    this.requestTimeoutMs = options.requestTimeoutMs ?? 90_000;
    this.worker = (options.workerFactory ?? createDefaultWorker)();
    this.worker.addEventListener("message", this.onMessage);
    this.worker.addEventListener("messageerror", this.onMessageError);
    this.worker.addEventListener("error", this.onWorkerError);
  }

  createSession(
    sessionId: string,
    mcsPresetId: MainWireIntegratedPreviewMcsPresetIdV1,
  ): Promise<IntegratedPreviewCommandResponseV1> {
    return this.send({
      protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
      kind: "createSession",
      requestId: this.nextRequestId(),
      sessionId,
      mcsPresetId,
    });
  }

  runNextBeat(sessionId: string):
  Promise<IntegratedPreviewCommandResponseV1> {
    return this.send({
      protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
      kind: "runNextBeat",
      requestId: this.nextRequestId(),
      sessionId,
    });
  }

  disposeSession(sessionId: string):
  Promise<IntegratedPreviewCommandResponseV1> {
    return this.send({
      protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
      kind: "disposeSession",
      requestId: this.nextRequestId(),
      sessionId,
    });
  }

  terminate(): void {
    this.quarantine(
      new Error("integrated preview Worker client terminated"),
    );
  }

  private send(
    command: IntegratedPreviewCommandV1,
  ): Promise<IntegratedPreviewCommandResponseV1> {
    if (this.terminated) {
      return Promise.reject(
        new Error("integrated preview Worker client is terminated"),
      );
    }
    return new Promise<IntegratedPreviewCommandResponseV1>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.quarantine(
          new Error(
            "integrated preview Worker request timed out; "
              + "the session outcome is unknown and was quarantined",
          ),
        );
      }, this.requestTimeoutMs);
      this.pending.set(command.requestId, {
        requestId: command.requestId,
        sessionId: command.sessionId,
        commandKind: command.kind,
        resolve,
        reject,
        timeout,
      });
      try {
        this.worker.postMessage(command);
      } catch (error) {
        this.quarantine(
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }).then((response) => {
      if (response.ok === false) {
        throw new Error(
          `${response.error.code}: ${response.error.message}`,
        );
      }
      return response;
    });
  }

  private nextRequestId(): string {
    this.requestSequence += 1;
    return `integrated-preview-request-${this.requestSequence}`;
  }

  private failAll(error: Error): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pending.clear();
  }

  private quarantine(error: Error): void {
    if (!this.terminated) {
      this.terminated = true;
      try {
        this.worker.removeEventListener("message", this.onMessage);
        this.worker.removeEventListener("messageerror", this.onMessageError);
        this.worker.removeEventListener("error", this.onWorkerError);
      } catch {
        // The transport is already terminal. Listener-detach failure cannot
        // make any response trustworthy again.
      }
      try {
        this.worker.terminate();
      } catch {
        // Preserve the original terminal cause for every pending request.
      }
    }
    this.failAll(error);
  }
}

function createDefaultWorker(): MainWireIntegratedPreviewWorkerLikeV1 {
  return new Worker(
    new URL("./mainWireIntegratedPreviewWorkerV1.ts", import.meta.url),
    { type: "module" },
  ) as unknown as MainWireIntegratedPreviewWorkerLikeV1;
}

function isResponse(
  value: unknown,
): value is IntegratedPreviewCommandResponseV1 {
  if (!isRecord(value)
    || value.protocolId !== INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID
    || typeof value.ok !== "boolean") return false;
  if (value.ok === true) {
    return hasExactKeys(value, [
      "protocolId",
      "ok",
      "requestId",
      "sessionId",
      "commandKind",
      "releaseRef",
      "runRecord",
      "presentation",
      "disposed",
    ])
      && typeof value.requestId === "string"
      && typeof value.sessionId === "string"
      && isCommandKind(value.commandKind)
      && isReleaseRef(value.releaseRef)
      && isSuccessPayloadPair(
        value.commandKind,
        value.releaseRef,
        value.runRecord,
        value.presentation,
        value.disposed,
      );
  }
  return hasExactKeys(value, [
    "protocolId",
    "ok",
    "requestId",
    "sessionId",
    "commandKind",
    "releaseRef",
    "error",
  ])
    && (typeof value.requestId === "string" || value.requestId === null)
    && (typeof value.sessionId === "string" || value.sessionId === null)
    && (isCommandKind(value.commandKind) || value.commandKind === null)
    && (isReleaseRef(value.releaseRef) || value.releaseRef === null)
    && isErrorPayload(value.error);
}

function isSuccessPayloadPair(
  commandKind: IntegratedPreviewCommandV1["kind"],
  releaseRef: Readonly<{ id: string; version: string; sha256: string }>,
  runRecord: unknown,
  presentation: unknown,
  disposed: unknown,
): boolean {
  if (commandKind === "disposeSession") {
    return disposed === true && runRecord === null && presentation === null;
  }
  if (
    disposed !== false
    || !isRecord(runRecord)
    || !isRecord(presentation)
    || !hasExactKeys(runRecord, [
      "artifactId",
      "schemaVersion",
      "releaseRef",
      "simulationInputSpec",
      "simulationInputSpecSha256",
      "sourceSeed",
      "run",
      "startModelState",
      "terminalModelState",
      "replayCompleteness",
      "recordSha256",
    ])
    || !hasExactKeys(presentation, [
      "artifactId",
      "schemaVersion",
      "recordSha256",
      "releaseRef",
      "simulationInputSpec",
      "simulationInputSpecSha256",
      "sourceSeed",
      "run",
      "trace",
      "startModelStateRef",
      "terminalModelStateRef",
    ])
  ) return false;
  return runRecord.artifactId
      === "circleheart-main-wire-integrated-preview-run-record-v2"
    && runRecord.schemaVersion === 2
    && presentation.artifactId === runRecord.artifactId
    && presentation.schemaVersion === runRecord.schemaVersion
    && isSha256(runRecord.recordSha256)
    && presentation.recordSha256 === runRecord.recordSha256
    && isSha256(runRecord.simulationInputSpecSha256)
    && presentation.simulationInputSpecSha256
      === runRecord.simulationInputSpecSha256
    && sameReleaseRef(runRecord.releaseRef, releaseRef)
    && sameReleaseRef(presentation.releaseRef, releaseRef)
    && isRecord(runRecord.simulationInputSpec)
    && isRecord(presentation.simulationInputSpec)
    && isRecord(runRecord.sourceSeed)
    && isRecord(presentation.sourceSeed)
    && isRecord(runRecord.run)
    && Array.isArray(runRecord.run.trace)
    && isRecord(presentation.run)
    && Array.isArray(presentation.trace)
    && isRecord(runRecord.startModelState)
    && isRecord(runRecord.terminalModelState)
    && isRecord(runRecord.replayCompleteness)
    && hasExactKeys(runRecord.replayCompleteness, [
      "stateTransitionInputIdentitiesIncluded",
      "exactStartCheckpointIncluded",
      "exactTerminalCheckpointIncluded",
      "executableBuildProvenanceAttached",
      "standaloneReplayCompleteArtifactClaimed",
      "upgradePath",
    ])
    && runRecord.replayCompleteness
      .stateTransitionInputIdentitiesIncluded === true
    && runRecord.replayCompleteness.exactStartCheckpointIncluded === true
    && runRecord.replayCompleteness.exactTerminalCheckpointIncluded === true
    && runRecord.replayCompleteness.executableBuildProvenanceAttached === false
    && runRecord.replayCompleteness
      .standaloneReplayCompleteArtifactClaimed === false
    && runRecord.replayCompleteness.upgradePath
      === "createMainWireIntegratedPreviewRunArtifactV1-with-external-BuildArtifactRefV1"
    && isRecord(presentation.startModelStateRef)
    && isRecord(presentation.terminalModelStateRef)
    && sameCheckpointProjection(
      runRecord.startModelState,
      presentation.startModelStateRef,
    )
    && sameCheckpointProjection(
      runRecord.terminalModelState,
      presentation.terminalModelStateRef,
    )
    && typeof runRecord.run.startAcceptedTimeSec === "number"
    && runRecord.run.startAcceptedTimeSec
      === runRecord.startModelState.acceptedTimeSec
    && typeof runRecord.run.endAcceptedTimeSec === "number"
    && runRecord.run.endAcceptedTimeSec
      === runRecord.terminalModelState.acceptedTimeSec;
}

function sameCheckpointProjection(
  checkpoint: Record<string, unknown>,
  projection: Record<string, unknown>,
): boolean {
  return hasExactKeys(projection, [
    "checkpointId",
    "schemaVersion",
    "checkpointSha256",
    "acceptedTimeSec",
    "revision",
  ])
    && checkpoint.checkpointId === projection.checkpointId
    && checkpoint.schemaVersion === projection.schemaVersion
    && checkpoint.checkpointSha256 === projection.checkpointSha256
    && checkpoint.acceptedTimeSec === projection.acceptedTimeSec
    && checkpoint.revision === projection.revision
    && isSha256(projection.checkpointSha256);
}

function isErrorPayload(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, ["code", "message"])
    && (
      value.code === "invalid-command"
      || value.code === "duplicate-session-id"
      || value.code === "unknown-session-id"
      || value.code === "session-capacity-exceeded"
      || value.code === "command-failed"
    )
    && typeof value.message === "string";
}

function isReleaseRef(
  value: unknown,
): value is Readonly<{ id: string; version: string; sha256: string }> {
  return isRecord(value)
    && hasExactKeys(value, ["id", "version", "sha256"])
    && typeof value.id === "string"
    && value.id.length > 0
    && typeof value.version === "string"
    && value.version.length > 0
    && isSha256(value.sha256);
}

function sameReleaseRef(
  value: unknown,
  expected: Readonly<{ id: string; version: string; sha256: string }>,
): boolean {
  return isReleaseRef(value)
    && value.id === expected.id
    && value.version === expected.version
    && value.sha256 === expected.sha256;
}

function isCommandKind(
  value: unknown,
): value is IntegratedPreviewCommandV1["kind"] {
  return value === "createSession"
    || value === "runNextBeat"
    || value === "disposeSession";
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
