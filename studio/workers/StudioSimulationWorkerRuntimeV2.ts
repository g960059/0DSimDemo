import type {
  RegisteredModelSimulationAdapterV2,
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import {
  validateStudioSimulationFrameV2,
  validateStudioSimulationPortableIdV2,
} from "@/studio/contracts/v2/simulation";
import {
  STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
  type StudioSimulationWorkerRequestV2,
  type StudioSimulationWorkerResponseV2,
  studioSimulationWorkerRequestIdFromUnknownV2,
  validateStudioSimulationWorkerRequestV2,
  validateStudioSimulationWorkerResponseV2,
} from "@/studio/workers/StudioSimulationWorkerProtocolV2";

const DEFAULT_WORKER_QUEUE_CAPACITY_V2 = 2;

export type StudioSimulationWorkerRuntimeStateV2 =
  | "uninitialized"
  | "initializing"
  | "active"
  | "disposing"
  | "closed"
  | "failed";

export type StudioSimulationWorkerPortV2 = Readonly<{
  postMessage(message: StudioSimulationWorkerResponseV2): void;
  close(): void;
}>;

export type StudioSimulationWorkerRuntimeDependenciesV2 = Readonly<{
  loadSimulationAdapter(): Promise<RegisteredModelSimulationAdapterV2>;
  port: StudioSimulationWorkerPortV2;
  queueCapacity?: number;
}>;

/**
 * Single-session, bounded worker controller. Every message is decoded before
 * admission and every adapter-produced frame is decoded again before posting.
 */
export class StudioSimulationWorkerRuntimeV2 {
  readonly #loadSimulationAdapter:
    () => Promise<RegisteredModelSimulationAdapterV2>;
  readonly #port: StudioSimulationWorkerPortV2;
  readonly #queueCapacity: number;
  readonly #queue: StudioSimulationWorkerRequestV2[] = [];
  readonly #idleWaiters: Array<() => void> = [];
  #state: StudioSimulationWorkerRuntimeStateV2 = "uninitialized";
  #processing = false;
  #disposeEnqueued = false;
  #highestRequestId = 0;
  #adapter: RegisteredModelSimulationAdapterV2 | undefined;
  #runtimeSessionId: string | undefined;
  #scenarioId: string | undefined;
  #lastFrame: StudioSimulationFrameV2 | undefined;
  #portClosed = false;

  constructor(dependencies: StudioSimulationWorkerRuntimeDependenciesV2) {
    if (typeof dependencies.loadSimulationAdapter !== "function") {
      throw new Error("simulation worker adapter loader is required");
    }
    if (
      dependencies.port === null
      || typeof dependencies.port !== "object"
      || typeof dependencies.port.postMessage !== "function"
      || typeof dependencies.port.close !== "function"
    ) {
      throw new Error("simulation worker port is invalid");
    }
    const queueCapacity = dependencies.queueCapacity
      ?? DEFAULT_WORKER_QUEUE_CAPACITY_V2;
    if (
      !Number.isSafeInteger(queueCapacity)
      || queueCapacity < 1
      || queueCapacity > 32
    ) {
      throw new Error("simulation worker queue capacity must be within [1, 32]");
    }
    this.#loadSimulationAdapter = dependencies.loadSimulationAdapter;
    this.#port = dependencies.port;
    this.#queueCapacity = queueCapacity;
  }

  get state(): StudioSimulationWorkerRuntimeStateV2 {
    return this.#state;
  }

  enqueue(value: unknown): void {
    if (this.#portClosed) return;
    const correlationId = studioSimulationWorkerRequestIdFromUnknownV2(value);
    let request: StudioSimulationWorkerRequestV2;
    try {
      request = validateStudioSimulationWorkerRequestV2(value);
    } catch (error) {
      if (correlationId > this.#highestRequestId) {
        this.#highestRequestId = correlationId;
      }
      this.#safePostError(correlationId, errorMessageV2(error));
      return;
    }

    if (request.requestId <= this.#highestRequestId) {
      this.#safePostError(
        request.requestId,
        "simulation worker requestId must increase strictly",
      );
      return;
    }
    this.#highestRequestId = request.requestId;
    if (this.#disposeEnqueued) {
      this.#safePostError(
        request.requestId,
        "simulation worker is disposing and accepts no further requests",
      );
      return;
    }
    const outstanding = (this.#processing ? 1 : 0) + this.#queue.length;
    if (outstanding >= this.#queueCapacity) {
      this.#safePostError(
        request.requestId,
        "simulation worker queue capacity exceeded",
      );
      return;
    }
    if (request.kind === "dispose") this.#disposeEnqueued = true;
    this.#queue.push(request);
    void this.#drain();
  }

  async whenIdle(): Promise<void> {
    if (!this.#processing && this.#queue.length === 0) return;
    await new Promise<void>((resolve) => this.#idleWaiters.push(resolve));
  }

  terminate(): void {
    if (this.#portClosed) return;
    this.#failClosed("simulation worker terminated", "closed");
  }

  async #drain(): Promise<void> {
    if (this.#processing || this.#portClosed) return;
    this.#processing = true;
    try {
      while (this.#queue.length > 0 && !this.#portClosed) {
        const request = this.#queue.shift()!;
        try {
          await this.#handleRequest(request);
        } catch (error) {
          this.#safePostError(request.requestId, errorMessageV2(error));
          if (error instanceof FatalWorkerStateErrorV2) {
            this.#failClosed(error.message, "failed");
          }
        }
      }
    } finally {
      this.#processing = false;
      if (this.#queue.length === 0 || this.#portClosed) this.#resolveIdle();
    }
  }

  async #handleRequest(request: StudioSimulationWorkerRequestV2): Promise<void> {
    switch (request.kind) {
      case "initialize":
        await this.#initialize(request);
        return;
      case "advance":
        await this.#advance(request);
        return;
      case "dispose":
        this.#dispose(request);
    }
  }

  async #initialize(
    request: Extract<StudioSimulationWorkerRequestV2, { kind: "initialize" }>,
  ): Promise<void> {
    if (this.#state !== "uninitialized") {
      throw new Error("simulation worker is already initialized");
    }
    this.#state = "initializing";
    let adapter: RegisteredModelSimulationAdapterV2 | undefined;
    let sessionCreationAttempted = false;
    try {
      adapter = await this.#loadSimulationAdapter();
      if (this.#portClosed || this.#state !== "initializing") return;
      assertSimulationAdapterV2(adapter);
      sessionCreationAttempted = true;
      await adapter.createSession(Object.freeze({
        runtimeSessionId: request.runtimeSessionId,
        scenarios: Object.freeze([Object.freeze({
          scenarioId: request.scenarioId,
          fixture: request.fixture,
          ...(request.checkpoint === undefined
            ? {}
            : { checkpoint: request.checkpoint }),
        })]),
      }));
      if (this.#portClosed || this.#state !== "initializing") {
        bestEffortDisposeV2(adapter, request.runtimeSessionId);
        return;
      }
      this.#adapter = adapter;
      this.#runtimeSessionId = request.runtimeSessionId;
      this.#scenarioId = request.scenarioId;
      this.#state = "active";
      const frame = this.#validateAdapterFrame(adapter.currentFrame({
        runtimeSessionId: request.runtimeSessionId,
        scenarioId: request.scenarioId,
      }));
      this.#lastFrame = frame;
      this.#postResponse({
        protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
        requestId: request.requestId,
        status: "ok",
        kind: "initialized",
        frame,
      });
    } catch (error) {
      if (adapter !== undefined && sessionCreationAttempted) {
        bestEffortDisposeV2(adapter, request.runtimeSessionId);
      }
      if (this.#portClosed) return;
      this.#clearSession();
      this.#state = "failed";
      throw new FatalWorkerStateErrorV2(
        `simulation worker initialization failed: ${errorMessageV2(error)}`,
      );
    }
  }

  async #advance(
    request: Extract<StudioSimulationWorkerRequestV2, { kind: "advance" }>,
  ): Promise<void> {
    const adapter = this.#requiredActiveAdapter(
      request.runtimeSessionId,
      request.scenarioId,
    );
    try {
      const frames: StudioSimulationFrameV2[] = [];
      for (let index = 0; index < request.stepCount; index += 1) {
        const frame = this.#validateAdapterFrame(
          await adapter.advanceOnePresentationStep({
            runtimeSessionId: request.runtimeSessionId,
            scenarioId: request.scenarioId,
          }),
        );
        assertNonRegressingFrameV2(this.#lastFrame, frame);
        this.#lastFrame = frame;
        frames.push(frame);
      }
      this.#postResponse({
        protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
        requestId: request.requestId,
        status: "ok",
        kind: "advanced",
        frames: Object.freeze(frames),
      });
    } catch (error) {
      throw new FatalWorkerStateErrorV2(
        `simulation worker advance failed: ${errorMessageV2(error)}`,
      );
    }
  }

  #dispose(
    request: Extract<StudioSimulationWorkerRequestV2, { kind: "dispose" }>,
  ): void {
    let adapter: RegisteredModelSimulationAdapterV2;
    try {
      adapter = this.#requiredActiveAdapter(request.runtimeSessionId);
    } catch (error) {
      throw new FatalWorkerStateErrorV2(
        `simulation worker disposal failed: ${errorMessageV2(error)}`,
      );
    }
    this.#state = "disposing";
    try {
      adapter.disposeSession(request.runtimeSessionId);
      this.#clearSession();
      this.#postResponse({
        protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
        requestId: request.requestId,
        status: "ok",
        kind: "disposed",
      });
      this.#state = "closed";
      this.#closePort();
    } catch (error) {
      this.#clearSession();
      this.#state = "failed";
      throw new FatalWorkerStateErrorV2(
        `simulation worker disposal failed: ${errorMessageV2(error)}`,
      );
    }
  }

  #requiredActiveAdapter(
    runtimeSessionId: string,
    scenarioId?: string,
  ): RegisteredModelSimulationAdapterV2 {
    if (
      this.#state !== "active"
      || this.#adapter === undefined
      || this.#runtimeSessionId !== runtimeSessionId
      || (scenarioId !== undefined && this.#scenarioId !== scenarioId)
    ) {
      throw new Error("simulation worker session identity mismatch");
    }
    return this.#adapter;
  }

  #validateAdapterFrame(value: unknown): StudioSimulationFrameV2 {
    const adapter = this.#adapter;
    const runtimeSessionId = this.#runtimeSessionId;
    const scenarioId = this.#scenarioId;
    if (
      adapter === undefined
      || runtimeSessionId === undefined
      || scenarioId === undefined
    ) {
      throw new Error("simulation worker has no active frame identity");
    }
    const frame = validateStudioSimulationFrameV2(value);
    if (
      frame.modelId !== adapter.modelId
      || frame.runtimeSessionId !== runtimeSessionId
      || frame.scenarioId !== scenarioId
      || frame.inputEpoch !== adapter.currentInputEpoch({
        runtimeSessionId,
        scenarioId,
      })
    ) {
      throw new Error("simulation worker adapter frame identity mismatch");
    }
    return frame;
  }

  #postResponse(value: unknown): void {
    const response = validateStudioSimulationWorkerResponseV2(value);
    this.#port.postMessage(response);
  }

  #safePostError(requestId: number, message: string): void {
    if (this.#portClosed) return;
    try {
      this.#postResponse({
        protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
        requestId,
        status: "error",
        message: portableErrorMessageV2(message),
      });
    } catch {
      this.#failClosed("simulation worker could not post an error", "failed");
    }
  }

  #failClosed(
    message: string,
    state: "closed" | "failed",
  ): void {
    if (this.#portClosed) return;
    const adapter = this.#adapter;
    const runtimeSessionId = this.#runtimeSessionId;
    if (adapter !== undefined && runtimeSessionId !== undefined) {
      bestEffortDisposeV2(adapter, runtimeSessionId);
    }
    this.#clearSession();
    this.#state = state;
    while (this.#queue.length > 0) {
      const request = this.#queue.shift()!;
      try {
        const response = validateStudioSimulationWorkerResponseV2({
          protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
          requestId: request.requestId,
          status: "error",
          message: portableErrorMessageV2(message),
        });
        this.#port.postMessage(response);
      } catch {
        break;
      }
    }
    this.#closePort();
    if (!this.#processing) this.#resolveIdle();
  }

  #clearSession(): void {
    this.#adapter = undefined;
    this.#runtimeSessionId = undefined;
    this.#scenarioId = undefined;
    this.#lastFrame = undefined;
  }

  #closePort(): void {
    if (this.#portClosed) return;
    this.#portClosed = true;
    try {
      this.#port.close();
    } catch {
      // The port is already terminal from the controller's perspective.
    }
  }

  #resolveIdle(): void {
    while (this.#idleWaiters.length > 0) this.#idleWaiters.shift()!();
  }
}

function assertSimulationAdapterV2(
  adapter: RegisteredModelSimulationAdapterV2,
): void {
  if (
    adapter === null
    || typeof adapter !== "object"
    || typeof adapter.createSession !== "function"
    || typeof adapter.disposeSession !== "function"
    || typeof adapter.currentFrame !== "function"
    || typeof adapter.advanceOnePresentationStep !== "function"
    || typeof adapter.replaceFixture !== "function"
    || typeof adapter.currentInputEpoch !== "function"
  ) {
    throw new Error("registered simulation adapter is invalid");
  }
  validateStudioSimulationPortableIdV2(adapter.modelId, "$.adapter.modelId");
  validateStudioSimulationPortableIdV2(
    adapter.fixtureSchemaId,
    "$.adapter.fixtureSchemaId",
  );
  validateStudioSimulationPortableIdV2(
    adapter.checkpointCodecId,
    "$.adapter.checkpointCodecId",
  );
}

function assertNonRegressingFrameV2(
  prior: StudioSimulationFrameV2 | undefined,
  next: StudioSimulationFrameV2,
): void {
  if (
    prior !== undefined
    && (
      next.acceptedRevision < prior.acceptedRevision
      || next.acceptedTimeSec < prior.acceptedTimeSec
      || next.inputEpoch < prior.inputEpoch
    )
  ) {
    throw new Error("simulation worker frame clock regressed");
  }
}

function bestEffortDisposeV2(
  adapter: RegisteredModelSimulationAdapterV2,
  runtimeSessionId: string,
): void {
  try {
    adapter.disposeSession(runtimeSessionId);
  } catch {
    // A fatal path still closes the worker even if model cleanup itself fails.
  }
}

function portableErrorMessageV2(message: string): string {
  if (message.length === 0 || message.length > 4_096 || hasUnpairedSurrogateV2(message)) {
    return "simulation worker request failed";
  }
  return message;
}

function hasUnpairedSurrogateV2(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return true;
    }
  }
  return false;
}

function errorMessageV2(error: unknown): string {
  try {
    if (error instanceof Error) {
      const descriptor = Object.getOwnPropertyDescriptor(error, "message");
      if (
        descriptor !== undefined
        && "value" in descriptor
        && typeof descriptor.value === "string"
      ) {
        return descriptor.value;
      }
    }
    if (typeof error === "string") return error;
  } catch {
    // Hostile thrown values must not interrupt terminal cleanup.
  }
  return "simulation worker request failed";
}

class FatalWorkerStateErrorV2 extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FatalWorkerStateErrorV2";
  }
}
