import { describe, expect, it } from "vitest";

import {
  MainWireIntegratedScientificWorkerKernelV1,
} from "@/engine/myocardium/MainWireIntegratedScientificWorkerKernelV1";
import {
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
} from "@/engine/myocardium/MainWireIntegratedScientificWorkerProtocolV1";
import {
  MainWireIntegratedScientificSession,
  integratedLanePresentationTargetTimeSecV1,
} from "@/engine/myocardium/MainWireIntegratedScientificSession";
import {
  canonicalJsonStringify,
} from "@/engine/scientific/release";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
  type MainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  MainWireIntegratedScientificWorkerClientV1,
  type MainWireIntegratedScientificWorkerLikeV1,
} from "@/engine/scientificBrowser/MainWireIntegratedScientificWorkerClientV1";
import {
  MainWireIntegratedScientificBrowserHostV1Impl,
  type MainWireIntegratedBrowserAdvanceReceiptV1,
} from "@/engine/scientificBrowser/MainWireIntegratedScientificBrowserHostV1";
import {
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1,
} from "@/engine/scientificBrowser/mainWireIntegratedScientificBrowserRuntimeLimitsV1";
import {
  MAIN_WIRE_INTEGRATED_V3_PRESENTATION_OBSERVATION_STRIDE_V1,
  MainWireIntegratedV3LiveLaneDriverV1,
} from "@/studio/adapters/mainWire/MainWireIntegratedV3LiveLaneDriverV1";
import {
  RUNTIME_PRESENTATION_OBSERVATION_STRIDE_V1,
} from "@/studio/contracts/v1/runtime";

const BATCH_BOUND =
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
    .maximumPresentationOrdinalCountPerAdvanceCommand;
const EXPECTED_TRANSPORTED_ORDINALS_1_THROUGH_416 = Object.freeze([
  4, 8, 12, 16, 20, 24, 28, 32,
  36, 40, 44, 48, 52, 56, 60, 64,
  68, 72, 76, 80, 84, 88, 92, 96,
  100, 104, 108, 112, 116, 120, 124, 128,
  132, 136, 140, 144, 148, 152, 156, 160,
  164, 168, 172, 176, 180, 184, 188, 192,
  196, 200, 204, 208, 212, 216, 220, 224,
  228, 232, 236, 240, 244, 248, 252, 256,
  260, 264, 268, 272, 276, 280, 284, 288,
  292, 296, 300, 304, 308, 312, 316, 320,
  324, 328, 332, 336, 340, 344, 348, 352,
  356, 360, 364, 368, 372, 376, 380, 384,
  388, 392, 396, 400, 404, 408, 412, 416,
] as const);

describe("integrated V3 Worker presentation-ordinal batching", () => {
  it("rejects a batch above the explicit V3-only bound", async () => {
    const kernel = new MainWireIntegratedScientificWorkerKernelV1({
      maximumPresentationOrdinalCountPerAdvanceCommand: BATCH_BOUND,
    });
    const created = await kernel.handle({
      protocolId:
        MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
      kind: "createWorkerOwnedPresetSession",
      requestId: "bounded-create",
      sessionId: "bounded-session",
    });
    expect(created.ok).toBe(true);
    const rejected = await kernel.handle({
      protocolId:
        MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
      kind: "advanceToPresentationOrdinal",
      requestId: "bounded-advance",
      sessionId: "bounded-session",
      presentationOrdinal: 1,
      presentationOrdinalCount: BATCH_BOUND + 1,
    });
    expect(rejected).toMatchObject({
      ok: false,
      error: {
        code: "invalid-command",
        partialProgress: null,
      },
    });
  });

  // This test previously asserted that every ordinal was transported. That
  // encoded full-rate transport even though the lane descriptor already
  // claimed decimated presentation; the two are reconciled here in favour of
  // the descriptor, while accepted-state identity becomes the stronger
  // scientific invariant.
  it("preserves the complete accepted state while transporting the explicit decimated ordinal sequence", async () => {
    const finalPresentationOrdinal = 416;
    const singularWorker = new KernelBackedWorkerV1();
    const singularHost = hostForV1("singular-host", singularWorker);
    let singularSession =
      await singularHost.createWorkerOwnedPreset("singular-session");
    let singularBoundaryAdvance: SuccessfulAdvanceV1 | null = null;
    for (
      let presentationOrdinal = 1;
      presentationOrdinal <= finalPresentationOrdinal;
      presentationOrdinal += 1
    ) {
      const receipt = await singularHost.advanceToPresentationOrdinal(
        singularSession,
        presentationOrdinal,
      );
      if (receipt.status === "failed") {
        throw new Error(
          `singular ordinal ${presentationOrdinal} failed: ${receipt.message}`,
        );
      }
      if (presentationOrdinal === 407) {
        singularBoundaryAdvance = receipt;
      }
      singularSession = receipt.session;
    }
    const singularAcceptedState = singularWorker
      .scientificSession("singular-session")
      .currentAcceptedState();

    const batchedWorker = new KernelBackedWorkerV1();
    const batchedHost = hostForV1("batched-host", batchedWorker);
    let batchedSession =
      await batchedHost.createWorkerOwnedPreset("batched-session");
    const batchedAdvances: SuccessfulAdvanceV1[] = [];
    for (
      let firstPresentationOrdinal = 1;
      firstPresentationOrdinal <= finalPresentationOrdinal;
      firstPresentationOrdinal += BATCH_BOUND
    ) {
      const count = Math.min(
        BATCH_BOUND,
        finalPresentationOrdinal - firstPresentationOrdinal + 1,
      );
      const receipt =
        await batchedHost.advanceConsecutivePresentationOrdinals(
          batchedSession,
          firstPresentationOrdinal,
          count,
        );
      if (receipt.status === "failed") {
        throw new Error(
          `batch failed at ordinal ${receipt.failedPresentationOrdinal}: ${receipt.message}`,
        );
      }
      batchedAdvances.push(...receipt.advances);
      batchedSession = receipt.session;
    }
    const batchedAcceptedState = batchedWorker
      .scientificSession("batched-session")
      .currentAcceptedState();

    expect(batchedAdvances.map(({ presentationOrdinal }) =>
      presentationOrdinal)).toEqual(
      EXPECTED_TRANSPORTED_ORDINALS_1_THROUGH_416,
    );
    expect(batchedSession.acceptedRevision)
      .toBe(singularSession.acceptedRevision);
    expect(batchedSession.acceptedTimeSec)
      .toBe(singularSession.acceptedTimeSec);
    expect(batchedAcceptedState.revision)
      .toBe(singularAcceptedState.revision);
    expect(batchedAcceptedState.acceptedTimeSec)
      .toBe(singularAcceptedState.acceptedTimeSec);
    expect(batchedAcceptedState).toStrictEqual(singularAcceptedState);
    expect(canonicalAcceptedStateV1(batchedAcceptedState))
      .toBe(canonicalAcceptedStateV1(singularAcceptedState));
    expect(singularBoundaryAdvance).toMatchObject({
      presentationOrdinal: 407,
      presentationTimeSec:
        integratedLanePresentationTargetTimeSecV1(407),
      acceptedRevisionSpanFromPrevious: 2,
      internalAcceptedSubstepCount: 2,
      boundaryClippedSubstepCount: 1,
      substeps: [
        {
          acceptedTimeSec: 0.8125,
          clippedByRhythmBoundary: true,
          landedOnPresentationTarget: false,
        },
        {
          acceptedTimeSec:
            integratedLanePresentationTargetTimeSecV1(407),
          landedOnPresentationTarget: true,
        },
      ],
    });
    expect(singularWorker.posted).toHaveLength(
      1 + finalPresentationOrdinal,
    );
    expect(batchedWorker.posted).toHaveLength(
      1 + Math.ceil(finalPresentationOrdinal / BATCH_BOUND),
    );
    singularHost.terminate();
    batchedHost.terminate();
  }, 60_000);

  it("returns a genuinely completed prefix and the true off-grid state when an ordinal partway through a batch fails", async () => {
    const worker = new KernelBackedWorkerV1();
    const host = hostForV1("partial-host", worker);
    let session = await host.createWorkerOwnedPreset("partial-session");
    for (let presentationOrdinal = 1; presentationOrdinal <= 400; presentationOrdinal += 1) {
      const receipt = await host.advanceToPresentationOrdinal(
        session,
        presentationOrdinal,
      );
      if (receipt.status === "failed") {
        throw new Error(
          `setup ordinal ${presentationOrdinal} failed: ${receipt.message}`,
        );
      }
      session = receipt.session;
    }

    const acceptedRevisionBeforeBatch = session.acceptedRevision;
    const scientificSession = worker.scientificSession("partial-session");
    installProviderV1(
      scientificSession,
      failingProviderV1(
        (candidateTimeSec) => candidateTimeSec > 0.8125,
      ),
    );
    const failed = await host.advanceConsecutivePresentationOrdinals(
      session,
      401,
      BATCH_BOUND,
    );
    expect(failed).toMatchObject({
      status: "failed",
      firstPresentationOrdinal: 401,
      requestedPresentationOrdinalCount: 16,
      failedPresentationOrdinal: 407,
      failedPresentationTimeSec:
        integratedLanePresentationTargetTimeSecV1(407),
      failedOrdinalPartiallyAdvanced: true,
      failedOrdinalInternalAcceptedSubstepCount: 1,
      failedOrdinalBoundaryClippedSubstepCount: 1,
      session: {
        presentationOrdinal: 406,
        acceptedRevision: acceptedRevisionBeforeBatch + 7,
        acceptedTimeSec: 0.8125,
      },
    });
    if (failed.status !== "failed") {
      throw new Error("forced batch unexpectedly succeeded");
    }
    expect(
      failed.completedAdvances.map(({ presentationOrdinal }) =>
        presentationOrdinal),
    ).toEqual([404, 406]);
    expect(failed.completedAdvances.map((advance) => ({
      presentationOrdinal: advance.presentationOrdinal,
      acceptedRevisionSpanFromPrevious:
        advance.acceptedRevisionSpanFromPrevious,
      internalAcceptedSubstepCount:
        advance.internalAcceptedSubstepCount,
    }))).toEqual([
      {
        presentationOrdinal: 404,
        acceptedRevisionSpanFromPrevious: 4,
        internalAcceptedSubstepCount: 4,
      },
      {
        presentationOrdinal: 406,
        acceptedRevisionSpanFromPrevious: 2,
        internalAcceptedSubstepCount: 2,
      },
    ]);
    expect(failed.failedOrdinalSubsteps).toEqual([
      expect.objectContaining({
        acceptedRevision: acceptedRevisionBeforeBatch + 7,
        acceptedTimeSec: 0.8125,
        clippedByRhythmBoundary: true,
        rhythmBoundaryTimeSec: 0.8125,
        landedOnPresentationTarget: false,
      }),
    ]);

    installProviderV1(
      scientificSession,
      createCanonicalMainWireNormalAdultFiveWallProviderV1(),
    );
    const retry = await host.advanceToPresentationOrdinal(
      failed.session,
      407,
    );
    expect(retry).toMatchObject({
      status: "advanced",
      presentationOrdinal: 407,
      acceptedRevisionSpanFromPrevious: 2,
      internalAcceptedSubstepCount: 1,
      boundaryClippedSubstepCount: 0,
      session: {
        presentationOrdinal: 407,
        acceptedRevision: acceptedRevisionBeforeBatch + 8,
        acceptedTimeSec:
          integratedLanePresentationTargetTimeSecV1(407),
      },
    });
    host.terminate();
  }, 60_000);

  it("makes one Worker request for the driver's next 16 UI samples", async () => {
    const worker = new KernelBackedWorkerV1();
    const host = hostForV1("driver-batch-host", worker);
    const driver = new MainWireIntegratedV3LiveLaneDriverV1({
      hostFactory: () => host,
    });
    const opened = await driver.openSession({
      laneKind: "integrated-v3-experimental",
      sessionId: "driver-batch-session",
      branches: Object.freeze([
        { scenarioId: "driver-batch-scenario" },
      ]),
    });
    let closePromise: Promise<void> | null = null;
    const samples = await new Promise<readonly {
      presentationOrdinal: number;
    }[]>((resolve, reject) => {
      driver.subscribePresentationSignalChannel(
        opened.branches[0]!.presentationSignalChannelRef,
        (event) => {
          if (event.kind === "failure") {
            reject(new Error(event.message));
            return;
          }
          closePromise = driver.closeSession(opened.sessionId);
          resolve(event.samples);
        },
      );
    });
    await closePromise;

    expect(samples.map(({ presentationOrdinal }) =>
      presentationOrdinal)).toEqual([
      4, 8, 12, 16,
    ]);
    expect(
      opened.laneDescriptor.capabilities.decimatedLivePresentation
        .observationStride,
    ).toBe(
      MAIN_WIRE_INTEGRATED_V3_PRESENTATION_OBSERVATION_STRIDE_V1,
    );
    expect(
      MAIN_WIRE_INTEGRATED_V3_PRESENTATION_OBSERVATION_STRIDE_V1,
    ).toBe(RUNTIME_PRESENTATION_OBSERVATION_STRIDE_V1);
    const advanceCommands = worker.posted.filter(
      (command): command is {
        kind: "advanceToPresentationOrdinal";
        presentationOrdinal: number;
        presentationOrdinalCount: number;
      } => (
        typeof command === "object"
        && command !== null
        && "kind" in command
        && command.kind === "advanceToPresentationOrdinal"
      ),
    );
    expect(advanceCommands).toEqual([
      expect.objectContaining({
        presentationOrdinal: 1,
        presentationOrdinalCount: BATCH_BOUND,
      }),
    ]);
  }, 20_000);
});

type SuccessfulAdvanceV1 = Extract<
  MainWireIntegratedBrowserAdvanceReceiptV1,
  { status: "advanced" | "already-at-target" }
>;

class KernelBackedWorkerV1
implements MainWireIntegratedScientificWorkerLikeV1 {
  readonly kernel =
    new MainWireIntegratedScientificWorkerKernelV1({
      maximumPresentationOrdinalCountPerAdvanceCommand: BATCH_BOUND,
    });
  readonly posted: unknown[] = [];
  private readonly listeners =
    new Map<string, Set<(event: any) => void>>();

  postMessage(message: unknown): void {
    this.posted.push(structuredClone(message));
    queueMicrotask(() => {
      void this.kernel.handle(structuredClone(message)).then((response) => {
        this.emit("message", { data: structuredClone(response) });
      });
    });
  }

  terminate(): void {
    this.listeners.clear();
  }

  addEventListener(
    type: "message" | "messageerror" | "error",
    listener: (event: any) => void,
  ): void {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(
    type: "message" | "messageerror" | "error",
    listener: (event: any) => void,
  ): void {
    this.listeners.get(type)?.delete(listener);
  }

  scientificSession(sessionId: string): MainWireIntegratedScientificSession {
    const sessions = (
      this.kernel as unknown as {
        sessions: Map<
          string,
          { session: MainWireIntegratedScientificSession }
        >;
      }
    ).sessions;
    const hosted = sessions.get(sessionId);
    if (hosted === undefined) {
      throw new Error(`missing kernel session ${sessionId}`);
    }
    return hosted.session;
  }

  private emit(type: string, event: unknown): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      listener(event);
    }
  }
}

function hostForV1(
  hostId: string,
  worker: KernelBackedWorkerV1,
): MainWireIntegratedScientificBrowserHostV1Impl {
  return new MainWireIntegratedScientificBrowserHostV1Impl({
    hostId,
    client: new MainWireIntegratedScientificWorkerClientV1({
      workerFactory: () => worker,
    }),
  });
}

function installProviderV1(
  session: MainWireIntegratedScientificSession,
  provider: MainWireNormalAdultFiveWallProviderV1,
): void {
  (
    session as unknown as {
      provider: MainWireNormalAdultFiveWallProviderV1;
    }
  ).provider = provider;
}

function failingProviderV1(
  shouldFail: (candidateTimeSec: number) => boolean,
): MainWireNormalAdultFiveWallProviderV1 {
  const base = createCanonicalMainWireNormalAdultFiveWallProviderV1();
  return Object.freeze({
    ...base,
    evaluateTrial(input) {
      if (shouldFail(input.candidateTimeSec)) {
        throw new Error("forced batched-ordinal failure");
      }
      return base.evaluateTrial(input);
    },
  });
}

function canonicalAcceptedStateV1(value: unknown): string {
  return canonicalJsonStringify(plainDataProjectionV1(value));
}

function plainDataProjectionV1(
  value: unknown,
  path = "$",
  seen = new WeakSet<object>(),
): unknown {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) {
    throw new Error(`accepted state contains a cycle at ${path}`);
  }
  seen.add(value);
  let projected: unknown;
  if (ArrayBuffer.isView(value)) {
    projected = value instanceof DataView
      ? Array.from(new Uint8Array(
        value.buffer,
        value.byteOffset,
        value.byteLength,
      ))
      : Array.from(value as unknown as ArrayLike<number>);
  } else if (Array.isArray(value)) {
    projected = value.map((child, index) =>
      plainDataProjectionV1(child, `${path}[${index}]`, seen));
  } else {
    projected = Object.fromEntries(Object.keys(value).map((key) => [
      key,
      plainDataProjectionV1(
        (value as Record<string, unknown>)[key],
        `${path}.${key}`,
        seen,
      ),
    ]));
  }
  seen.delete(value);
  return projected;
}
