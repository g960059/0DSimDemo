import {
  MainWireScientificWorkerClientV1,
  createDefaultMainWireScientificWorkerV1,
  type MainWireScientificWorkerClientOptionsV1,
  type MainWireScientificWorkerLikeV1,
  type MainWireScientificWorkerResponseV1,
} from "@/engine/scientificBrowser/MainWireScientificWorkerClientV1";
import {
  MAIN_WIRE_SCIENTIFIC_PERFORMANCE_SIDEBAND_CONNECT_V0,
  MAIN_WIRE_SCIENTIFIC_PERFORMANCE_SIDEBAND_V0_ID,
  type MainWireScientificPerformanceSidebandMessageV0,
} from "@/engine/scientificBrowser/performance/mainWireScientificPerformanceSidebandV0";
import type {
  ScientificCommandKindV1,
  ScientificCommandV1,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import {
  SCIENTIFIC_COMMAND_KINDS_V1,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";

export const MAIN_WIRE_SCIENTIFIC_BROWSER_PERFORMANCE_PROBE_V0_ID =
  "main-wire-scientific-browser-performance-probe-v0" as const;

type ClockV0 = () => number;
type MessageListenerV0 = (event: MessageEvent<unknown>) => void;
type ErrorListenerV0 = (event: ErrorEvent) => void;

export type MainWireScientificRawRequestTimingV0 = Readonly<{
  sequence: number;
  requestId: string;
  commandKind: ScientificCommandKindV1;
  requestedStepCount: number | null;
  observationStride: number | null;
  requestStartedAtHostMs: number;
  requestCallReturnedAtHostMs: number;
  scientificPostMessageStartedAtHostMs: number | null;
  scientificPostMessageReturnedAtHostMs: number | null;
  responseEventArrivedAtHostMs: number | null;
  clientHandlerReturnedAtHostMs: number | null;
  promiseState: "pending" | "fulfilled" | "rejected";
  scientificResponseReceived: boolean;
  promiseSettledAtHostMs: number | null;
  roundTripMs: number | null;
  scientificPostMessageCallMs: number | null;
  clientMessageHandlerMs: number | null;
  responseOk: boolean | null;
  responsePayloadKind: string | null;
  responseErrorCode: string | null;
  observableFrameCount: number;
  worker: Readonly<{
    receivedAtWorkerMs: number;
    kernelStartedAtWorkerMs: number;
    kernelSettledAtWorkerMs: number;
    scientificResponsePostStartedAtWorkerMs: number;
    scientificResponsePostReturnedAtWorkerMs: number;
    kernelHandleMs: number;
    scientificResponsePostCallMs: number;
  }> | null;
}>;

export type MainWireScientificBrowserPerformanceProbeSnapshotV0 = Readonly<{
  probeId: typeof MAIN_WIRE_SCIENTIFIC_BROWSER_PERFORMANCE_PROBE_V0_ID;
  status: "raw-measurement-only";
  workerConstructionStartedAtHostMs: number;
  workerConstructionReturnedAtHostMs: number;
  workerConstructionCallMs: number;
  sidebandConnectPostStartedAtHostMs: number;
  sidebandConnectPostReturnedAtHostMs: number;
  sidebandConnectPostCallMs: number;
  workerProtocolReadyArrivedAtHostMs: number | null;
  workerProtocolReadyWorkerMs: number | null;
  workerConstructionToProtocolReadyHostMs: number | null;
  requests: readonly MainWireScientificRawRequestTimingV0[];
  counts: Readonly<{
    totalRequestCount: number;
    settledPromiseCount: number;
    scientificResponseCount: number;
    captureRequestCount: number;
    captureScientificResponseCount: number;
    captureAcceptedStepFrameCount: number;
    workerCommandTimingMessageCount: number;
    joinedWorkerTimingRequestCount: number;
    duplicateWorkerTimingMessageCount: number;
  }>;
  audit: Readonly<{
    timingFieldsAddedToScientificCommand: false;
    timingFieldsAddedToScientificResponse: false;
    commandObjectForwardedByIdentity: true;
    responseObjectReturnedByIdentity: true;
    scientificProtocolUsedAsTelemetryChannel: false;
    performanceSidebandOptIn: true;
  }>;
}>;

type MutableRequestTimingV0 = {
  sequence: number;
  requestId: string;
  commandKind: ScientificCommandKindV1;
  requestedStepCount: number | null;
  observationStride: number | null;
  requestStartedAtHostMs: number;
  requestCallReturnedAtHostMs: number;
  scientificPostMessageStartedAtHostMs: number | null;
  scientificPostMessageReturnedAtHostMs: number | null;
  responseEventArrivedAtHostMs: number | null;
  clientHandlerReturnedAtHostMs: number | null;
  promiseState: "pending" | "fulfilled" | "rejected";
  scientificResponseReceived: boolean;
  promiseSettledAtHostMs: number | null;
  responseOk: boolean | null;
  responsePayloadKind: string | null;
  responseErrorCode: string | null;
  observableFrameCount: number;
  worker: Extract<
    MainWireScientificPerformanceSidebandMessageV0,
    Readonly<{ kind: "worker-command-timing" }>
  > | null;
};

export type MainWireScientificPerformanceMessagePortV0 = {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  start(): void;
  close(): void;
  postMessage?(message: unknown): void;
};

export type MainWireScientificPerformanceMessageChannelV0 = Readonly<{
  port1: MainWireScientificPerformanceMessagePortV0;
  port2: unknown;
}>;

export type MainWireScientificBrowserPerformanceProbeOptionsV0 = Readonly<{
  clock?: ClockV0;
  workerFactory?: () => MainWireScientificWorkerLikeV1;
  messageChannelFactory?: () => MainWireScientificPerformanceMessageChannelV0;
  clientOptions?: Omit<
    MainWireScientificWorkerClientOptionsV1,
    "workerFactory"
  >;
}>;

/**
 * Browser-only raw timing probe. It decorates the Worker transport and request
 * Promise out of band, and returns the exact scientific response object it
 * received. Snapshot values are diagnostic observations, not a canonical
 * artifact or pass/fail result.
 */
export class MainWireScientificBrowserPerformanceProbeV0 {
  readonly client: Pick<MainWireScientificWorkerClientV1, "request">;
  readonly protocolReady: Promise<void>;

  private readonly clock: ClockV0;
  private readonly requests = new Map<string, MutableRequestTimingV0>();
  private readonly requestOrder: MutableRequestTimingV0[] = [];
  private readonly messagePort: MainWireScientificPerformanceMessagePortV0;
  private readonly ownedClient: MainWireScientificWorkerClientV1;
  private readonly workerConstructionStartedAtHostMs: number;
  private readonly workerConstructionReturnedAtHostMs: number;
  private readonly sidebandConnectPostStartedAtHostMs: number;
  private readonly sidebandConnectPostReturnedAtHostMs: number;
  private workerProtocolReadyArrivedAtHostMs: number | null = null;
  private workerProtocolReadyWorkerMs: number | null = null;
  private protocolReadyResolve!: () => void;
  private protocolReadyReject!: (error: Error) => void;
  private readonly workerTimingWaiters: Array<{
    expectedCount: number;
    resolve: () => void;
    reject: (error: Error) => void;
    timeoutId: ReturnType<typeof setTimeout>;
  }> = [];
  private workerCommandTimingMessageCount = 0;
  private duplicateWorkerTimingMessageCount = 0;
  private terminated = false;

  constructor(options: MainWireScientificBrowserPerformanceProbeOptionsV0 = {}) {
    this.clock = options.clock ?? defaultClock;
    const workerFactory = options.workerFactory
      ?? createDefaultMainWireScientificWorkerV1;
    const messageChannelFactory = options.messageChannelFactory
      ?? defaultMessageChannelFactory;

    this.workerConstructionStartedAtHostMs = this.clock();
    const rawWorker = workerFactory();
    this.workerConstructionReturnedAtHostMs = this.clock();

    const channel = messageChannelFactory();
    this.messagePort = channel.port1;
    this.protocolReady = new Promise<void>((resolve, reject) => {
      this.protocolReadyResolve = resolve;
      this.protocolReadyReject = reject;
    });
    this.messagePort.onmessage = (event) => {
      this.consumeSidebandMessage(event.data);
    };
    this.messagePort.start();

    this.sidebandConnectPostStartedAtHostMs = this.clock();
    try {
      postWithTransfer(rawWorker, channel.port2);
    } catch (error) {
      this.protocolReadyReject(asError(error));
      throw error;
    }
    this.sidebandConnectPostReturnedAtHostMs = this.clock();

    const timedWorker = new HostTimingWorkerProxyV0(
      rawWorker,
      this.clock,
      (command, startMs, endMs) => {
        const record = this.requests.get(command.requestId);
        if (record === undefined) return;
        record.scientificPostMessageStartedAtHostMs = startMs;
        record.scientificPostMessageReturnedAtHostMs = endMs;
      },
      (response, arrivedAtMs, handlerReturnedAtMs) => {
        const requestId = responseRequestId(response);
        if (requestId === null) return;
        const record = this.requests.get(requestId);
        if (record === undefined) return;
        record.responseEventArrivedAtHostMs = arrivedAtMs;
        record.clientHandlerReturnedAtHostMs = handlerReturnedAtMs;
        record.scientificResponseReceived = true;
      },
    );
    this.ownedClient = new MainWireScientificWorkerClientV1({
      ...options.clientOptions,
      workerFactory: () => timedWorker,
    });
    this.client = Object.freeze({
      request: (command: ScientificCommandV1) => this.request(command),
    });
  }

  terminate(): void {
    if (this.terminated) return;
    this.terminated = true;
    this.ownedClient.terminate();
    this.messagePort.onmessage = null;
    this.messagePort.close();
    const error = new Error("performance probe terminated");
    while (this.workerTimingWaiters.length > 0) {
      const waiter = this.workerTimingWaiters.pop()!;
      clearTimeout(waiter.timeoutId);
      waiter.reject(error);
    }
    this.protocolReadyReject(error);
  }

  async waitForWorkerTimingCount(
    expectedCount: number,
    timeoutMs = 2_000,
  ): Promise<void> {
    if (!Number.isSafeInteger(expectedCount) || expectedCount < 0) {
      throw new Error("expected Worker timing count must be a non-negative integer");
    }
    if (this.workerTimingCount() >= expectedCount) return;
    if (this.terminated) throw new Error("performance probe terminated");
    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const index = this.workerTimingWaiters.findIndex((candidate) =>
          candidate.timeoutId === timeoutId);
        if (index >= 0) this.workerTimingWaiters.splice(index, 1);
        reject(new Error(
          `performance sideband joined ${this.workerTimingCount()}/${expectedCount} command timing records`,
        ));
      }, timeoutMs);
      this.workerTimingWaiters.push({
        expectedCount,
        resolve,
        reject,
        timeoutId,
      });
    });
  }

  snapshot(): MainWireScientificBrowserPerformanceProbeSnapshotV0 {
    const requests = Object.freeze(this.requestOrder.map((record) =>
      freezeRequestRecord(record)));
    const settled = requests.filter(({ promiseState }) =>
      promiseState !== "pending");
    const scientificResponses = requests.filter(
      ({ scientificResponseReceived }) => scientificResponseReceived,
    );
    const capture = requests.filter(({ commandKind }) =>
      commandKind === "runTransient");
    return Object.freeze({
      probeId: MAIN_WIRE_SCIENTIFIC_BROWSER_PERFORMANCE_PROBE_V0_ID,
      status: "raw-measurement-only" as const,
      workerConstructionStartedAtHostMs:
        this.workerConstructionStartedAtHostMs,
      workerConstructionReturnedAtHostMs:
        this.workerConstructionReturnedAtHostMs,
      workerConstructionCallMs:
        this.workerConstructionReturnedAtHostMs
          - this.workerConstructionStartedAtHostMs,
      sidebandConnectPostStartedAtHostMs:
        this.sidebandConnectPostStartedAtHostMs,
      sidebandConnectPostReturnedAtHostMs:
        this.sidebandConnectPostReturnedAtHostMs,
      sidebandConnectPostCallMs:
        this.sidebandConnectPostReturnedAtHostMs
          - this.sidebandConnectPostStartedAtHostMs,
      workerProtocolReadyArrivedAtHostMs:
        this.workerProtocolReadyArrivedAtHostMs,
      workerProtocolReadyWorkerMs: this.workerProtocolReadyWorkerMs,
      workerConstructionToProtocolReadyHostMs:
        this.workerProtocolReadyArrivedAtHostMs === null
          ? null
          : this.workerProtocolReadyArrivedAtHostMs
            - this.workerConstructionStartedAtHostMs,
      requests,
      counts: Object.freeze({
        totalRequestCount: requests.length,
        settledPromiseCount: settled.length,
        scientificResponseCount: scientificResponses.length,
        captureRequestCount: capture.length,
        captureScientificResponseCount: capture.filter(
          ({ scientificResponseReceived }) => scientificResponseReceived,
        ).length,
        captureAcceptedStepFrameCount: capture.reduce(
          (sum, { observableFrameCount, responseOk }) =>
            responseOk === true ? sum + observableFrameCount : sum,
          0,
        ),
        workerCommandTimingMessageCount:
          this.workerCommandTimingMessageCount,
        joinedWorkerTimingRequestCount: requests.filter(({ worker }) =>
          worker !== null).length,
        duplicateWorkerTimingMessageCount:
          this.duplicateWorkerTimingMessageCount,
      }),
      audit: Object.freeze({
        timingFieldsAddedToScientificCommand: false as const,
        timingFieldsAddedToScientificResponse: false as const,
        commandObjectForwardedByIdentity: true as const,
        responseObjectReturnedByIdentity: true as const,
        scientificProtocolUsedAsTelemetryChannel: false as const,
        performanceSidebandOptIn: true as const,
      }),
    });
  }

  private request(
    command: ScientificCommandV1,
  ): Promise<MainWireScientificWorkerResponseV1> {
    const startedAt = this.clock();
    const record: MutableRequestTimingV0 = {
      sequence: this.requestOrder.length + 1,
      requestId: command.requestId,
      commandKind: command.kind,
      requestedStepCount: command.kind === "runTransient"
        ? command.stepCount
        : null,
      observationStride: command.kind === "runTransient"
        ? command.observationStride
        : null,
      requestStartedAtHostMs: startedAt,
      requestCallReturnedAtHostMs: startedAt,
      scientificPostMessageStartedAtHostMs: null,
      scientificPostMessageReturnedAtHostMs: null,
      responseEventArrivedAtHostMs: null,
      clientHandlerReturnedAtHostMs: null,
      promiseState: "pending",
      scientificResponseReceived: false,
      promiseSettledAtHostMs: null,
      responseOk: null,
      responsePayloadKind: null,
      responseErrorCode: null,
      observableFrameCount: 0,
      worker: null,
    };
    this.requests.set(command.requestId, record);
    this.requestOrder.push(record);
    const responsePromise = this.ownedClient.request(command);
    record.requestCallReturnedAtHostMs = this.clock();
    return responsePromise.then(
      (response) => {
        record.promiseSettledAtHostMs = this.clock();
        record.promiseState = "fulfilled";
        record.responseOk = response.ok;
        if (response.ok) {
          record.responsePayloadKind = response.payload.kind;
          record.observableFrameCount = responseObservableFrameCount(response);
        } else {
          record.responseErrorCode = response.error.code;
        }
        return response;
      },
      (error: unknown) => {
        record.promiseSettledAtHostMs = this.clock();
        record.promiseState = "rejected";
        record.responseOk = false;
        record.responseErrorCode = error instanceof Error
          ? error.name
          : "transport-rejection";
        throw error;
      },
    );
  }

  private consumeSidebandMessage(value: unknown): void {
    if (!isSidebandMessage(value)) return;
    if (value.kind === "worker-protocol-ready") {
      if (this.workerProtocolReadyArrivedAtHostMs !== null) return;
      this.workerProtocolReadyArrivedAtHostMs = this.clock();
      this.workerProtocolReadyWorkerMs = value.workerNowMs;
      this.protocolReadyResolve();
      return;
    }
    const record = this.requests.get(value.requestId);
    if (record === undefined || record.commandKind !== value.commandKind) return;
    this.workerCommandTimingMessageCount += 1;
    if (record.worker !== null) {
      this.duplicateWorkerTimingMessageCount += 1;
      return;
    }
    record.worker = value;
    this.resolveWorkerTimingWaiters();
  }

  private workerTimingCount(): number {
    return this.requestOrder.filter(({ worker }) => worker !== null).length;
  }

  private resolveWorkerTimingWaiters(): void {
    const joinedCount = this.workerTimingCount();
    for (
      let index = this.workerTimingWaiters.length - 1;
      index >= 0;
      index -= 1
    ) {
      const waiter = this.workerTimingWaiters[index]!;
      if (joinedCount < waiter.expectedCount) continue;
      this.workerTimingWaiters.splice(index, 1);
      clearTimeout(waiter.timeoutId);
      waiter.resolve();
    }
  }
}

class HostTimingWorkerProxyV0 implements MainWireScientificWorkerLikeV1 {
  private readonly messageListeners = new Map<MessageListenerV0, MessageListenerV0>();
  private readonly messageErrorListeners = new Map<MessageListenerV0, MessageListenerV0>();
  private readonly errorListeners = new Map<ErrorListenerV0, ErrorListenerV0>();

  constructor(
    private readonly worker: MainWireScientificWorkerLikeV1,
    private readonly clock: ClockV0,
    private readonly onPostMessage: (
      command: ScientificCommandV1,
      startMs: number,
      endMs: number,
    ) => void,
    private readonly onResponseHandled: (
      response: unknown,
      arrivedAtMs: number,
      handlerReturnedAtMs: number,
    ) => void,
  ) {}

  postMessage(message: unknown): void {
    const startedAt = this.clock();
    this.worker.postMessage(message);
    const returnedAt = this.clock();
    if (isScientificCommand(message)) {
      safely(() => this.onPostMessage(message, startedAt, returnedAt));
    }
  }

  terminate(): void {
    this.worker.terminate();
  }

  addEventListener(type: "message", listener: MessageListenerV0): void;
  addEventListener(type: "messageerror", listener: MessageListenerV0): void;
  addEventListener(type: "error", listener: ErrorListenerV0): void;
  addEventListener(
    type: "message" | "messageerror" | "error",
    listener: MessageListenerV0 | ErrorListenerV0,
  ): void {
    if (type === "message") {
      const messageListener = listener as MessageListenerV0;
      const wrapped = (event: MessageEvent<unknown>) => {
        const arrivedAt = this.clock();
        messageListener(event);
        const returnedAt = this.clock();
        safely(() => this.onResponseHandled(event.data, arrivedAt, returnedAt));
      };
      this.messageListeners.set(messageListener, wrapped);
      this.worker.addEventListener(type, wrapped);
      return;
    }
    if (type === "messageerror") {
      const messageListener = listener as MessageListenerV0;
      this.messageErrorListeners.set(messageListener, messageListener);
      this.worker.addEventListener(type, messageListener);
      return;
    }
    const errorListener = listener as ErrorListenerV0;
    this.errorListeners.set(errorListener, errorListener);
    this.worker.addEventListener(type, errorListener);
  }

  removeEventListener(type: "message", listener: MessageListenerV0): void;
  removeEventListener(type: "messageerror", listener: MessageListenerV0): void;
  removeEventListener(type: "error", listener: ErrorListenerV0): void;
  removeEventListener(
    type: "message" | "messageerror" | "error",
    listener: MessageListenerV0 | ErrorListenerV0,
  ): void {
    if (type === "message") {
      const original = listener as MessageListenerV0;
      const wrapped = this.messageListeners.get(original);
      if (wrapped !== undefined) {
        this.worker.removeEventListener(type, wrapped);
        this.messageListeners.delete(original);
      }
      return;
    }
    if (type === "messageerror") {
      const original = listener as MessageListenerV0;
      const wrapped = this.messageErrorListeners.get(original);
      if (wrapped !== undefined) {
        this.worker.removeEventListener(type, wrapped);
        this.messageErrorListeners.delete(original);
      }
      return;
    }
    const original = listener as ErrorListenerV0;
    const wrapped = this.errorListeners.get(original);
    if (wrapped !== undefined) {
      this.worker.removeEventListener(type, wrapped);
      this.errorListeners.delete(original);
    }
  }
}

function freezeRequestRecord(
  record: MutableRequestTimingV0,
): MainWireScientificRawRequestTimingV0 {
  const settledAt = record.promiseSettledAtHostMs;
  const postStart = record.scientificPostMessageStartedAtHostMs;
  const postEnd = record.scientificPostMessageReturnedAtHostMs;
  const handlerStart = record.responseEventArrivedAtHostMs;
  const handlerEnd = record.clientHandlerReturnedAtHostMs;
  const worker = record.worker === null
    ? null
    : Object.freeze({
      receivedAtWorkerMs: record.worker.receivedAtWorkerMs,
      kernelStartedAtWorkerMs: record.worker.kernelStartedAtWorkerMs,
      kernelSettledAtWorkerMs: record.worker.kernelSettledAtWorkerMs,
      scientificResponsePostStartedAtWorkerMs:
        record.worker.scientificResponsePostStartedAtWorkerMs,
      scientificResponsePostReturnedAtWorkerMs:
        record.worker.scientificResponsePostReturnedAtWorkerMs,
      kernelHandleMs:
        record.worker.kernelSettledAtWorkerMs
          - record.worker.kernelStartedAtWorkerMs,
      scientificResponsePostCallMs:
        record.worker.scientificResponsePostReturnedAtWorkerMs
          - record.worker.scientificResponsePostStartedAtWorkerMs,
    });
  return Object.freeze({
    sequence: record.sequence,
    requestId: record.requestId,
    commandKind: record.commandKind,
    requestedStepCount: record.requestedStepCount,
    observationStride: record.observationStride,
    requestStartedAtHostMs: record.requestStartedAtHostMs,
    requestCallReturnedAtHostMs: record.requestCallReturnedAtHostMs,
    scientificPostMessageStartedAtHostMs: postStart,
    scientificPostMessageReturnedAtHostMs: postEnd,
    responseEventArrivedAtHostMs: handlerStart,
    clientHandlerReturnedAtHostMs: handlerEnd,
    promiseState: record.promiseState,
    scientificResponseReceived: record.scientificResponseReceived,
    promiseSettledAtHostMs: settledAt,
    roundTripMs: settledAt === null
      ? null
      : settledAt - record.requestStartedAtHostMs,
    scientificPostMessageCallMs:
      postStart === null || postEnd === null ? null : postEnd - postStart,
    clientMessageHandlerMs:
      handlerStart === null || handlerEnd === null
        ? null
        : handlerEnd - handlerStart,
    responseOk: record.responseOk,
    responsePayloadKind: record.responsePayloadKind,
    responseErrorCode: record.responseErrorCode,
    observableFrameCount: record.observableFrameCount,
    worker,
  });
}

function responseObservableFrameCount(
  response: Extract<MainWireScientificWorkerResponseV1, { ok: true }>,
): number {
  const payload = response.payload;
  if (payload.kind === "transientCompleted") {
    return payload.observableFrames.length;
  }
  return 0;
}

function isScientificCommand(value: unknown): value is ScientificCommandV1 {
  return typeof value === "object"
    && value !== null
    && "protocolId" in value
    && value.protocolId === "circleheart-scientific-command-protocol-v1"
    && "requestId" in value
    && typeof value.requestId === "string"
    && "kind" in value
    && typeof value.kind === "string";
}

function responseRequestId(value: unknown): string | null {
  return typeof value === "object"
    && value !== null
    && "requestId" in value
    && typeof value.requestId === "string"
    ? value.requestId
    : null;
}

function isSidebandMessage(
  value: unknown,
): value is MainWireScientificPerformanceSidebandMessageV0 {
  if (typeof value !== "object" || value === null) return false;
  if (!("protocolId" in value)
    || value.protocolId !== MAIN_WIRE_SCIENTIFIC_PERFORMANCE_SIDEBAND_V0_ID) {
    return false;
  }
  if (!("kind" in value) || typeof value.kind !== "string") return false;
  if (value.kind === "worker-protocol-ready") {
    return hasExactKeys(value, ["kind", "protocolId", "workerNowMs"])
      && "workerNowMs" in value
      && Number.isFinite(value.workerNowMs);
  }
  return value.kind === "worker-command-timing"
    && hasExactKeys(value, [
      "commandKind",
      "kernelSettledAtWorkerMs",
      "kernelStartedAtWorkerMs",
      "kind",
      "protocolId",
      "receivedAtWorkerMs",
      "requestId",
      "scientificResponsePostReturnedAtWorkerMs",
      "scientificResponsePostStartedAtWorkerMs",
    ])
    && "requestId" in value
    && typeof value.requestId === "string"
    && "commandKind" in value
    && typeof value.commandKind === "string"
    && (SCIENTIFIC_COMMAND_KINDS_V1 as readonly string[])
      .includes(value.commandKind)
    && timingFieldsFiniteAndMonotonic(value);
}

function timingFieldsFiniteAndMonotonic(value: object): boolean {
  const keys = [
    "receivedAtWorkerMs",
    "kernelStartedAtWorkerMs",
    "kernelSettledAtWorkerMs",
    "scientificResponsePostStartedAtWorkerMs",
    "scientificResponsePostReturnedAtWorkerMs",
  ] as const;
  for (const key of keys) {
    if (!(key in value) || !Number.isFinite(value[key])) return false;
  }
  const record = value as Record<(typeof keys)[number], number>;
  return record.receivedAtWorkerMs <= record.kernelStartedAtWorkerMs
    && record.kernelStartedAtWorkerMs <= record.kernelSettledAtWorkerMs
    && record.kernelSettledAtWorkerMs
      <= record.scientificResponsePostStartedAtWorkerMs
    && record.scientificResponsePostStartedAtWorkerMs
      <= record.scientificResponsePostReturnedAtWorkerMs;
}

function hasExactKeys(value: object, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index]);
}

function postWithTransfer(
  worker: MainWireScientificWorkerLikeV1,
  port: unknown,
): void {
  const transferableWorker = worker as unknown as Readonly<{
    postMessage: (message: unknown, transfer: readonly unknown[]) => void;
  }>;
  transferableWorker.postMessage(
    MAIN_WIRE_SCIENTIFIC_PERFORMANCE_SIDEBAND_CONNECT_V0,
    [port],
  );
}

function defaultClock(): number {
  return performance.now();
}

function defaultMessageChannelFactory(): MainWireScientificPerformanceMessageChannelV0 {
  return new MessageChannel() as unknown as
    MainWireScientificPerformanceMessageChannelV0;
}

function safely(action: () => void): void {
  try {
    action();
  } catch {
    // A timing observer is never allowed to fail scientific transport.
  }
}

function asError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}
