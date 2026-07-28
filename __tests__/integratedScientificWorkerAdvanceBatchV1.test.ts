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
  MainWireIntegratedV3LiveLaneDriverV1,
} from "@/studio/adapters/mainWire/MainWireIntegratedV3LiveLaneDriverV1";

const BATCH_BOUND =
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
    .maximumPresentationOrdinalCountPerAdvanceCommand;

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

  it("produces sample-for-sample identical singular and batched runs, including boundary diagnostics", async () => {
    const finalPresentationOrdinal = 416;
    const singularWorker = new KernelBackedWorkerV1();
    const singularHost = hostForV1("singular-host", singularWorker);
    let singularSession =
      await singularHost.createWorkerOwnedPreset("singular-session");
    const singularAdvances: SuccessfulAdvanceV1[] = [];
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
      singularAdvances.push(receipt);
      singularSession = receipt.session;
    }

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
      expect(receipt.advances).toHaveLength(count);
      batchedAdvances.push(...receipt.advances);
      batchedSession = receipt.session;
    }

    expect(batchedAdvances).toHaveLength(finalPresentationOrdinal);
    expect(
      batchedAdvances.map(comparableAdvanceV1),
    ).toEqual(
      singularAdvances.map(comparableAdvanceV1),
    );
    expect(
      comparableAdvanceV1(batchedAdvances[406]!),
    ).toMatchObject({
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
    ).toEqual([401, 402, 403, 404, 405, 406]);
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
      1, 2, 3, 4, 5, 6, 7, 8,
      9, 10, 11, 12, 13, 14, 15, 16,
    ]);
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

function comparableAdvanceV1(receipt: SuccessfulAdvanceV1) {
  return Object.freeze({
    status: receipt.status,
    presentationOrdinal: receipt.presentationOrdinal,
    presentationTimeSec: receipt.presentationTimeSec,
    acceptedRevision: receipt.session.acceptedRevision,
    acceptedTimeSec: receipt.session.acceptedTimeSec,
    acceptedRevisionSpanFromPrevious:
      receipt.acceptedRevisionSpanFromPrevious,
    internalAcceptedSubstepCount:
      receipt.internalAcceptedSubstepCount,
    boundaryClippedSubstepCount:
      receipt.boundaryClippedSubstepCount,
    substeps: receipt.substeps,
    emittedPresentationSample: receipt.emittedPresentationSample,
    observableFrame: receipt.observableFrame,
  });
}

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
