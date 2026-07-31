import type {
  ScenarioCheckpointV2,
} from "@/studio/contracts/v2/content";
import type {
  StudioJsonValueV2,
} from "@/studio/contracts/v2/json";
import type {
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import {
  type StudioSimulationWorkerRequestV2,
  type StudioSimulationWorkerResponseV2,
  createStudioSimulationAdvanceRequestV2,
  createStudioSimulationDisposeRequestV2,
  createStudioSimulationInitializeRequestV2,
  validateStudioSimulationWorkerResponseV2,
} from "@/studio/workers/StudioSimulationWorkerProtocolV2";

const WORKER_RESPONSE_TIMEOUT_MS_V2 = 30_000;

export interface StudioSimulationWorkerTransportV2 {
  postMessage(message: unknown): void;
  terminate(): void;
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  addEventListener(
    type: "error",
    listener: (event: ErrorEvent) => void,
  ): void;
  removeEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  removeEventListener(
    type: "error",
    listener: (event: ErrorEvent) => void,
  ): void;
}

export type StudioSimulationWorkerClientOptionsV2 = Readonly<{
  transport?: StudioSimulationWorkerTransportV2;
  responseTimeoutMs?: number;
}>;

type ExpectedResponseV2 =
  | Readonly<{
      kind: "initialized";
      runtimeSessionId: string;
      scenarioId: string;
    }>
  | Readonly<{
      kind: "advanced";
      modelId: string;
      runtimeSessionId: string;
      scenarioId: string;
      inputEpoch: number;
      minimumAcceptedRevision: number;
      minimumAcceptedTimeSec: number;
      stepCount: number;
    }>
  | Readonly<{
      kind: "disposed";
    }>;

type PendingRequestV2 = Readonly<{
  resolve(response: StudioSimulationWorkerResponseV2): void;
  reject(error: Error): void;
  timeout: ReturnType<typeof setTimeout>;
  expected: ExpectedResponseV2;
}>;

type ClientStateV2 =
  | "new"
  | "initializing"
  | "active"
  | "disposing"
  | "terminated";

export class StudioSimulationWorkerClientV2 {
  readonly #worker: StudioSimulationWorkerTransportV2;
  readonly #responseTimeoutMs: number;
  readonly #pending = new Map<number, PendingRequestV2>();
  #nextRequestId = 1;
  #state: ClientStateV2 = "new";
  #runtimeSessionId: string | undefined;
  #scenarioId: string | undefined;
  #modelId: string | undefined;
  #inputEpoch: number | undefined;
  #acceptedRevision: number | undefined;
  #acceptedTimeSec: number | undefined;
  #advanceInFlight = false;
  #disposePromise: Promise<void> | undefined;

  constructor(options: StudioSimulationWorkerClientOptionsV2 = {}) {
    const responseTimeoutMs = options.responseTimeoutMs
      ?? WORKER_RESPONSE_TIMEOUT_MS_V2;
    if (
      !Number.isSafeInteger(responseTimeoutMs)
      || responseTimeoutMs < 1
      || responseTimeoutMs > 300_000
    ) {
      throw new Error("simulation worker response timeout must be within [1, 300000]");
    }
    this.#responseTimeoutMs = responseTimeoutMs;
    this.#worker = options.transport ?? new Worker(
      new URL("./StudioSimulationWorkerV2.ts", import.meta.url),
      { type: "module", name: "circleheart-studio-v2-simulation" },
    );
    this.#worker.addEventListener("message", this.#onMessage);
    this.#worker.addEventListener("error", this.#onWorkerError);
  }

  async initialize(input: Readonly<{
    runtimeSessionId: string;
    scenarioId: string;
    fixture: StudioJsonValueV2;
    checkpoint?: ScenarioCheckpointV2;
  }>): Promise<StudioSimulationFrameV2> {
    if (this.#state !== "new") {
      throw new Error("simulation worker client cannot initialize twice");
    }
    const request = createStudioSimulationInitializeRequestV2(
      this.#allocateRequestId(),
      input,
    );
    this.#state = "initializing";
    try {
      const response = await this.#postRequest(request, {
        kind: "initialized",
        runtimeSessionId: request.runtimeSessionId,
        scenarioId: request.scenarioId,
      });
      if (response.status !== "ok" || response.kind !== "initialized") {
        throw new Error("simulation worker returned another initialize response");
      }
      this.#runtimeSessionId = request.runtimeSessionId;
      this.#scenarioId = request.scenarioId;
      this.#modelId = response.frame.modelId;
      this.#inputEpoch = response.frame.inputEpoch;
      this.#acceptedRevision = response.frame.acceptedRevision;
      this.#acceptedTimeSec = response.frame.acceptedTimeSec;
      this.#state = "active";
      return response.frame;
    } catch (error) {
      this.#terminateWith(errorAsErrorV2(error));
      throw error;
    }
  }

  async advance(input: Readonly<{
    runtimeSessionId: string;
    scenarioId: string;
    stepCount: number;
  }>): Promise<readonly StudioSimulationFrameV2[]> {
    if (
      this.#state !== "active"
      || this.#runtimeSessionId === undefined
      || this.#scenarioId === undefined
      || this.#modelId === undefined
      || this.#inputEpoch === undefined
      || this.#acceptedRevision === undefined
      || this.#acceptedTimeSec === undefined
    ) {
      throw new Error("simulation worker client is not active");
    }
    if (this.#advanceInFlight) {
      throw new Error("simulation worker client already has an advance in flight");
    }
    const request = createStudioSimulationAdvanceRequestV2(
      this.#allocateRequestId(),
      input,
    );
    if (
      request.runtimeSessionId !== this.#runtimeSessionId
      || request.scenarioId !== this.#scenarioId
    ) {
      throw new Error("simulation worker client session identity mismatch");
    }

    this.#advanceInFlight = true;
    try {
      const response = await this.#postRequest(request, {
        kind: "advanced",
        modelId: this.#modelId,
        runtimeSessionId: this.#runtimeSessionId,
        scenarioId: this.#scenarioId,
        inputEpoch: this.#inputEpoch,
        minimumAcceptedRevision: this.#acceptedRevision,
        minimumAcceptedTimeSec: this.#acceptedTimeSec,
        stepCount: request.stepCount,
      });
      if (response.status !== "ok" || response.kind !== "advanced") {
        throw new Error("simulation worker returned another advance response");
      }
      const last = response.frames[response.frames.length - 1]!;
      this.#inputEpoch = last.inputEpoch;
      this.#acceptedRevision = last.acceptedRevision;
      this.#acceptedTimeSec = last.acceptedTimeSec;
      return response.frames;
    } catch (error) {
      this.#terminateWith(errorAsErrorV2(error));
      throw error;
    } finally {
      this.#advanceInFlight = false;
    }
  }

  dispose(runtimeSessionId: string): Promise<void> {
    if (this.#disposePromise !== undefined) return this.#disposePromise;
    if (this.#state === "terminated") return Promise.resolve();
    if (this.#state === "new" || this.#state === "initializing") {
      this.#terminateWith(new Error("simulation worker client disposed before activation"));
      return Promise.resolve();
    }
    if (this.#advanceInFlight) {
      this.#terminateWith(new Error("simulation worker client disposed during advance"));
      return Promise.resolve();
    }
    if (
      this.#state !== "active"
      || this.#runtimeSessionId !== runtimeSessionId
    ) {
      return Promise.reject(
        new Error("simulation worker client dispose identity mismatch"),
      );
    }
    const request = createStudioSimulationDisposeRequestV2(
      this.#allocateRequestId(),
      runtimeSessionId,
    );
    this.#state = "disposing";
    const disposePromise = this.#postRequest(request, { kind: "disposed" })
      .then((response) => {
        if (response.status !== "ok" || response.kind !== "disposed") {
          throw new Error("simulation worker returned another dispose response");
        }
      })
      .finally(() => {
        this.#terminateWith(new Error("simulation worker client disposed"));
      });
    this.#disposePromise = disposePromise;
    return disposePromise;
  }

  terminate(): void {
    this.#terminateWith(new Error("simulation worker client terminated"));
  }

  #allocateRequestId(): number {
    if (!Number.isSafeInteger(this.#nextRequestId)) {
      this.#terminateWith(new Error("simulation worker requestId space exhausted"));
      throw new Error("simulation worker requestId space exhausted");
    }
    const requestId = this.#nextRequestId;
    this.#nextRequestId += 1;
    return requestId;
  }

  #postRequest(
    request: StudioSimulationWorkerRequestV2,
    expected: ExpectedResponseV2,
  ): Promise<StudioSimulationWorkerResponseV2> {
    if (this.#state === "terminated") {
      return Promise.reject(new Error("simulation worker client is terminated"));
    }
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!this.#pending.has(request.requestId)) return;
        this.#terminateWith(new Error(
          `simulation worker request ${request.requestId} timed out`,
        ));
      }, this.#responseTimeoutMs);
      this.#pending.set(request.requestId, {
        resolve,
        reject,
        timeout,
        expected,
      });
      try {
        this.#worker.postMessage(request);
      } catch (error) {
        this.#terminateWith(errorAsErrorV2(error));
      }
    });
  }

  readonly #onMessage = (event: MessageEvent<unknown>): void => {
    let response: StudioSimulationWorkerResponseV2;
    try {
      response = validateStudioSimulationWorkerResponseV2(event.data);
    } catch (error) {
      this.#terminateWith(errorAsErrorV2(error));
      return;
    }
    const pending = this.#pending.get(response.requestId);
    if (pending === undefined) {
      this.#terminateWith(new Error(
        `simulation worker response ${response.requestId} has no pending request`,
      ));
      return;
    }
    if (response.status === "error") {
      this.#settlePending(response.requestId);
      pending.reject(new Error(response.message));
      return;
    }
    try {
      assertExpectedResponseV2(response, pending.expected);
    } catch (error) {
      this.#terminateWith(errorAsErrorV2(error));
      return;
    }
    this.#settlePending(response.requestId);
    pending.resolve(response);
  };

  readonly #onWorkerError = (event: ErrorEvent): void => {
    let message = "simulation worker terminated with an error";
    try {
      if (typeof event.message === "string" && event.message.length > 0) {
        message = event.message;
      }
    } catch {
      // An invalid transport event is still terminal.
    }
    this.#terminateWith(new Error(message));
  };

  #settlePending(requestId: number): void {
    const pending = this.#pending.get(requestId);
    if (pending === undefined) return;
    this.#pending.delete(requestId);
    clearTimeout(pending.timeout);
  }

  #terminateWith(error: Error): void {
    if (this.#state === "terminated") return;
    this.#state = "terminated";
    try {
      this.#worker.removeEventListener("message", this.#onMessage);
    } catch {
      // Continue terminal cleanup even if an injected transport is malformed.
    }
    try {
      this.#worker.removeEventListener("error", this.#onWorkerError);
    } catch {
      // Continue terminal cleanup even if an injected transport is malformed.
    }
    try {
      this.#worker.terminate();
    } finally {
      for (const pending of this.#pending.values()) {
        clearTimeout(pending.timeout);
        pending.reject(error);
      }
      this.#pending.clear();
    }
  }
}

function assertExpectedResponseV2(
  response: Exclude<StudioSimulationWorkerResponseV2, { status: "error" }>,
  expected: ExpectedResponseV2,
): void {
  if (response.kind !== expected.kind) {
    throw new Error(
      `simulation worker response kind mismatch: expected ${expected.kind}`,
    );
  }
  if (response.kind === "initialized" && expected.kind === "initialized") {
    assertFrameIdentityV2(
      response.frame,
      expected.runtimeSessionId,
      expected.scenarioId,
    );
    return;
  }
  if (response.kind === "advanced" && expected.kind === "advanced") {
    if (response.frames.length !== expected.stepCount) {
      throw new Error("simulation worker advance frame count mismatch");
    }
    let acceptedRevision = expected.minimumAcceptedRevision;
    let acceptedTimeSec = expected.minimumAcceptedTimeSec;
    for (const frame of response.frames) {
      assertFrameIdentityV2(
        frame,
        expected.runtimeSessionId,
        expected.scenarioId,
        expected.modelId,
      );
      if (
        frame.inputEpoch !== expected.inputEpoch
        || frame.acceptedRevision < acceptedRevision
        || frame.acceptedTimeSec < acceptedTimeSec
      ) {
        throw new Error("simulation worker advance frame sequence regressed");
      }
      acceptedRevision = frame.acceptedRevision;
      acceptedTimeSec = frame.acceptedTimeSec;
    }
  }
}

function assertFrameIdentityV2(
  frame: StudioSimulationFrameV2,
  runtimeSessionId: string,
  scenarioId: string,
  modelId?: string,
): void {
  if (
    frame.runtimeSessionId !== runtimeSessionId
    || frame.scenarioId !== scenarioId
    || (modelId !== undefined && frame.modelId !== modelId)
  ) {
    throw new Error("simulation worker response frame identity mismatch");
  }
}

function errorAsErrorV2(error: unknown): Error {
  try {
    if (error instanceof Error) return error;
    if (typeof error === "string") return new Error(error);
  } catch {
    // Hostile thrown values must not interrupt terminal cleanup.
  }
  return new Error("simulation worker request failed");
}
