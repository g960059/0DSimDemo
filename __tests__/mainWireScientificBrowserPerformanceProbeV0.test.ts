import { describe, expect, it } from "vitest";

import {
  MainWireScientificBrowserPerformanceProbeV0,
  type MainWireScientificPerformanceMessageChannelV0,
  type MainWireScientificPerformanceMessagePortV0,
} from "@/engine/scientificBrowser/performance/MainWireScientificBrowserPerformanceProbeV0";
import {
  MAIN_WIRE_SCIENTIFIC_PERFORMANCE_SIDEBAND_V0_ID,
  isMainWireScientificPerformanceSidebandConnectV0,
} from "@/engine/scientificBrowser/performance/mainWireScientificPerformanceSidebandV0";
import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificCommandV1,
} from "@/engine/scientific/worker";
import type {
  MainWireScientificWorkerLikeV1,
} from "@/engine/scientificBrowser";

describe("scientific browser performance probe V0", () => {
  it("uses an opt-in sideband while preserving command and response identity", async () => {
    const channel = new FakeMessageChannel();
    const worker = new FakePerformanceWorker(channel.remotePort);
    let nowMs = 10;
    const probe = new MainWireScientificBrowserPerformanceProbeV0({
      clock: () => {
        nowMs += 0.25;
        return nowMs;
      },
      workerFactory: () => worker.port(),
      messageChannelFactory: () => channel.channel(),
      clientOptions: { maximumPendingRequestCount: 1 },
    });

    await probe.protocolReady;
    const command = Object.freeze({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "observe" as const,
      requestId: "performance-observe-1",
      sessionId: "performance-session-1",
    });
    const commandKeys = Object.keys(command);
    const response = await probe.client.request(command);
    await probe.waitForWorkerTimingCount(1);

    expect(worker.scientificPosted).toHaveLength(1);
    expect(worker.scientificPosted[0]).toBe(command);
    expect(response).toBe(worker.lastScientificResponse);
    expect(Object.keys(command)).toEqual(commandKeys);
    expect(response).not.toHaveProperty("performanceTiming");
    expect(response.payload).not.toHaveProperty("performanceTiming");

    const snapshot = probe.snapshot();
    expect(snapshot.counts).toEqual({
      totalRequestCount: 1,
      settledPromiseCount: 1,
      scientificResponseCount: 1,
      captureRequestCount: 0,
      captureScientificResponseCount: 0,
      captureAcceptedStepFrameCount: 0,
      workerCommandTimingMessageCount: 1,
      joinedWorkerTimingRequestCount: 1,
      duplicateWorkerTimingMessageCount: 0,
    });
    expect(snapshot.workerConstructionToProtocolReadyHostMs).not.toBeNull();
    expect(snapshot.requests[0]).toMatchObject({
      requestId: command.requestId,
      commandKind: "observe",
      responseOk: true,
      responsePayloadKind: "observation",
    });
    expect(snapshot.requests[0]!.worker?.kernelHandleMs).toBe(0.5);
    expect(snapshot.audit).toEqual({
      timingFieldsAddedToScientificCommand: false,
      timingFieldsAddedToScientificResponse: false,
      commandObjectForwardedByIdentity: true,
      responseObjectReturnedByIdentity: true,
      scientificProtocolUsedAsTelemetryChannel: false,
      performanceSidebandOptIn: true,
    });

    probe.terminate();
    expect(worker.terminateCount).toBe(1);
    expect(channel.hostPort.closed).toBe(true);
  });

  it("keeps capture messages and accepted-step observations as separate counts", async () => {
    const channel = new FakeMessageChannel();
    const worker = new FakePerformanceWorker(channel.remotePort);
    const probe = new MainWireScientificBrowserPerformanceProbeV0({
      workerFactory: () => worker.port(),
      messageChannelFactory: () => channel.channel(),
    });
    await probe.protocolReady;

    for (let index = 0; index < 2; index += 1) {
      const command = Object.freeze({
        protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
        kind: "runTransient" as const,
        requestId: `capture-${index}`,
        sessionId: "performance-session",
        dtSec: 0.002,
        stepCount: 4,
        observationStride: 1,
      });
      await probe.client.request(command);
    }
    await probe.waitForWorkerTimingCount(2);

    expect(probe.snapshot().counts).toMatchObject({
      captureRequestCount: 2,
      captureScientificResponseCount: 2,
      captureAcceptedStepFrameCount: 8,
    });
    probe.terminate();
  });

  it("recognizes only the exact sideband bootstrap envelope", () => {
    expect(isMainWireScientificPerformanceSidebandConnectV0({
      protocolId: MAIN_WIRE_SCIENTIFIC_PERFORMANCE_SIDEBAND_V0_ID,
      kind: "connect-performance-sideband",
    })).toBe(true);
    expect(isMainWireScientificPerformanceSidebandConnectV0({
      protocolId: MAIN_WIRE_SCIENTIFIC_PERFORMANCE_SIDEBAND_V0_ID,
      kind: "connect-performance-sideband",
      timing: true,
    })).toBe(false);
    expect(isMainWireScientificPerformanceSidebandConnectV0({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "connect-performance-sideband",
    })).toBe(false);
  });

  it("does not fabricate a response or round trip for a pending request", async () => {
    const channel = new FakeMessageChannel();
    const worker = new FakePerformanceWorker(channel.remotePort, false);
    const probe = new MainWireScientificBrowserPerformanceProbeV0({
      workerFactory: () => worker.port(),
      messageChannelFactory: () => channel.channel(),
    });
    await probe.protocolReady;
    const pending = probe.client.request(Object.freeze({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "observe" as const,
      requestId: "pending-observe",
      sessionId: "performance-session",
    }));
    void pending.catch(() => undefined);

    const snapshot = probe.snapshot();
    expect(snapshot.counts).toMatchObject({
      totalRequestCount: 1,
      settledPromiseCount: 0,
      scientificResponseCount: 0,
      joinedWorkerTimingRequestCount: 0,
    });
    expect(snapshot.requests[0]).toMatchObject({
      promiseState: "pending",
      scientificResponseReceived: false,
      promiseSettledAtHostMs: null,
      roundTripMs: null,
      responseOk: null,
    });
    probe.terminate();
  });
});

class FakeHostPort implements MainWireScientificPerformanceMessagePortV0 {
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
  closed = false;

  start(): void {}

  close(): void {
    this.closed = true;
  }

  deliver(value: unknown): void {
    this.onmessage?.({ data: value } as MessageEvent<unknown>);
  }
}

class FakeRemotePort {
  constructor(private readonly host: FakeHostPort) {}

  deliver(value: unknown): void {
    this.host.deliver(value);
  }
}

class FakeMessageChannel {
  readonly hostPort = new FakeHostPort();
  readonly remotePort = new FakeRemotePort(this.hostPort);

  channel(): MainWireScientificPerformanceMessageChannelV0 {
    return {
      port1: this.hostPort,
      port2: this.remotePort,
    };
  }
}

class FakePerformanceWorker {
  scientificPosted: ScientificCommandV1[] = [];
  lastScientificResponse: any = null;
  terminateCount = 0;
  private readonly messageListeners = new Set<
    (event: MessageEvent<unknown>) => void
  >();
  private readonly messageErrorListeners = new Set<
    (event: MessageEvent<unknown>) => void
  >();
  private readonly errorListeners = new Set<(event: ErrorEvent) => void>();

  constructor(
    private readonly remotePort: FakeRemotePort,
    private readonly respondToScientificCommands = true,
  ) {}

  port(): MainWireScientificWorkerLikeV1 {
    const owner = this;
    return {
      postMessage(message: unknown, transfer?: readonly unknown[]): void {
        owner.postMessage(message, transfer);
      },
      terminate(): void {
        owner.terminateCount += 1;
      },
      addEventListener(type, listener): void {
        if (type === "message") owner.messageListeners.add(listener as any);
        if (type === "messageerror") {
          owner.messageErrorListeners.add(listener as any);
        }
        if (type === "error") owner.errorListeners.add(listener as any);
      },
      removeEventListener(type, listener): void {
        if (type === "message") owner.messageListeners.delete(listener as any);
        if (type === "messageerror") {
          owner.messageErrorListeners.delete(listener as any);
        }
        if (type === "error") owner.errorListeners.delete(listener as any);
      },
    } as MainWireScientificWorkerLikeV1;
  }

  private postMessage(
    value: unknown,
    transfer: readonly unknown[] | undefined,
  ): void {
    if (isMainWireScientificPerformanceSidebandConnectV0(value)) {
      expect(transfer).toEqual([this.remotePort]);
      this.remotePort.deliver({
        protocolId: MAIN_WIRE_SCIENTIFIC_PERFORMANCE_SIDEBAND_V0_ID,
        kind: "worker-protocol-ready",
        workerNowMs: 2,
      });
      return;
    }
    const command = value as ScientificCommandV1;
    this.scientificPosted.push(command);
    if (!this.respondToScientificCommands) return;
    const response = successResponse(command);
    this.lastScientificResponse = response;
    for (const listener of this.messageListeners) {
      listener({ data: response } as MessageEvent<unknown>);
    }
    this.remotePort.deliver({
      protocolId: MAIN_WIRE_SCIENTIFIC_PERFORMANCE_SIDEBAND_V0_ID,
      kind: "worker-command-timing",
      requestId: command.requestId,
      commandKind: command.kind,
      receivedAtWorkerMs: 3,
      kernelStartedAtWorkerMs: 3.25,
      kernelSettledAtWorkerMs: 3.75,
      scientificResponsePostStartedAtWorkerMs: 3.75,
      scientificResponsePostReturnedAtWorkerMs: 4,
    });
  }
}

function successResponse(command: ScientificCommandV1): any {
  const releaseRef = Object.freeze({
    id: "test-release",
    version: "1.0.0",
    sha256: "a".repeat(64),
  });
  const sessionOrigin = Object.freeze({
    kind: "canonical-cold-start" as const,
    initializationProtocolId: "test-initialization",
    initializationProtocolVersion: "1.0.0",
  });
  const payload = command.kind === "runTransient"
    ? Object.freeze({
      kind: "transientCompleted" as const,
      requestedStepCount: command.stepCount,
      completedStepCount: command.stepCount,
      executionProtocol: {},
      observableFrames: Object.freeze(
        Array.from({ length: command.stepCount }, (_, index) => ({ index })),
      ),
      finalObservableFrame: { index: command.stepCount },
    })
    : Object.freeze({
      kind: "observation" as const,
      observableFrame: { revision: 1 },
    });
  return Object.freeze({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    requestId: command.requestId,
    sessionId: command.sessionId,
    commandKind: command.kind,
    ok: true as const,
    releaseRef,
    sessionOrigin,
    payload,
    error: null,
  });
}
