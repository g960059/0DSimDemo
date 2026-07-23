import type {
  MainWireIntegratedPreviewMcsPresetIdV1,
} from "@/engine/scientific/integratedPreview";
import {
  INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
  type IntegratedPreviewCommandResponseV1,
  type IntegratedPreviewCommandV1,
} from "@/engine/scientific/worker/integratedPreviewCommandProtocolV1";

export type MainWireIntegratedPreviewWorkerLikeV1 = Readonly<{
  postMessage(message: unknown): void;
  terminate(): void;
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  removeEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
}>;

export type MainWireIntegratedPreviewWorkerClientOptionsV1 = Readonly<{
  workerFactory?: () => MainWireIntegratedPreviewWorkerLikeV1;
  requestTimeoutMs?: number;
}>;

type Pending = Readonly<{
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
      this.failAll(new Error("integrated preview Worker response is invalid"));
      return;
    }
    const pending = this.pending.get(event.data.requestId ?? "");
    if (pending === undefined) {
      this.failAll(new Error("integrated preview Worker response is unsolicited"));
      return;
    }
    clearTimeout(pending.timeout);
    this.pending.delete(event.data.requestId!);
    pending.resolve(event.data);
  };

  constructor(options: MainWireIntegratedPreviewWorkerClientOptionsV1 = {}) {
    this.requestTimeoutMs = options.requestTimeoutMs ?? 90_000;
    this.worker = (options.workerFactory ?? createDefaultWorker)();
    this.worker.addEventListener("message", this.onMessage);
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
    if (this.terminated) return;
    this.terminated = true;
    this.worker.removeEventListener("message", this.onMessage);
    this.worker.terminate();
    this.failAll(new Error("integrated preview Worker client terminated"));
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
        this.pending.delete(command.requestId);
        reject(new Error("integrated preview Worker request timed out"));
      }, this.requestTimeoutMs);
      this.pending.set(command.requestId, { resolve, reject, timeout });
      try {
        this.worker.postMessage(command);
      } catch (error) {
        clearTimeout(timeout);
        this.pending.delete(command.requestId);
        reject(error instanceof Error ? error : new Error(String(error)));
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
}

function createDefaultWorker(): MainWireIntegratedPreviewWorkerLikeV1 {
  return new Worker(
    new URL("./mainWireIntegratedPreviewWorkerV1.ts", import.meta.url),
    { type: "module" },
  );
}

function isResponse(
  value: unknown,
): value is IntegratedPreviewCommandResponseV1 {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Partial<IntegratedPreviewCommandResponseV1>;
  return candidate.protocolId === INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID
    && typeof candidate.ok === "boolean"
    && (typeof candidate.requestId === "string"
      || candidate.requestId === null)
    && (typeof candidate.sessionId === "string"
      || candidate.sessionId === null);
}
