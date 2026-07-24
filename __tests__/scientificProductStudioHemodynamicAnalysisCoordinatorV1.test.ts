import { describe, expect, it } from "vitest";

import {
  ScientificProductStudioHemodynamicAnalysisCoordinatorV1,
  type ScientificProductStudioHemodynamicAnalysisHostV1,
} from "@/components/scientificProduct/ScientificProductStudioHemodynamicAnalysisCoordinatorV1";
import type {
  MainWireScientificHemodynamicCalculationDetailV2,
  MainWireScientificHemodynamicJobSnapshotV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import type {
  MainWireStudioHemodynamicAnalysisJobStartV1,
  MainWireStudioHemodynamicAnalysisSessionV1,
} from "@/studio/adapters/mainWire/MainWireStudioHemodynamicAnalysisHostV1";
import {
  STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
  type StudioArtifactKindV1,
  type StudioArtifactRefV1,
  type StudioSettledAnalysisSourceV1,
} from "@/studio/contracts/v1";

describe("Scientific Product Studio hemodynamic analysis coordinator V1", () => {
  it("publishes only the latest settled source and cancels/disposes without terminating the persistent host", async () => {
    const host = new DeferredAnalysisHostV1();
    const snapshots: string[] = [];
    const errors: string[] = [];
    const coordinator =
      new ScientificProductStudioHemodynamicAnalysisCoordinatorV1({
        host,
        onSnapshot: ({ requestToken }) => snapshots.push(requestToken),
        onError: ({ requestToken }) => errors.push(requestToken),
      });
    const sourceA = settledSourceV1(1, "1");
    const sourceB = settledSourceV1(2, "2");
    const sourceC = settledSourceV1(3, "3");

    coordinator.requestLatest({
      requestToken: "request-a",
      source: sourceA,
      detailMode: "standard",
    });
    await waitForV1(() => host.restoreCalls.length === 1);
    coordinator.requestLatest({
      requestToken: "request-b",
      source: sourceB,
      detailMode: "compare",
    });
    host.resolveRestore(0);

    await waitForV1(() => host.restoreCalls.length === 2);
    expect(host.startCalls).toEqual([]);
    expect(host.disposedSessionIds).toEqual([
      "analysis-session-1",
    ]);

    host.resolveRestore(1);
    await waitForV1(() => snapshots.length === 1);
    expect(snapshots).toEqual(["request-b"]);
    expect(errors).toEqual([]);
    expect(host.startCalls).toEqual([
      {
        scenarioId: sourceB.scenarioId,
        targetGeneration: 2,
        detailMode: "compare",
      },
    ]);

    coordinator.clearDemand();
    await waitForV1(() =>
      host.cancelledJobIds.includes("analysis-job-2")
      && host.disposedSessionIds.includes("analysis-session-2")
    );
    expect(host.terminateCount).toBe(0);

    coordinator.requestLatest({
      requestToken: "request-c",
      source: sourceC,
      detailMode: "settled-reference",
    });
    await waitForV1(() => host.restoreCalls.length === 3);
    host.resolveRestore(2);
    await waitForV1(() => snapshots.includes("request-c"));
    expect(host.terminateCount).toBe(0);

    await coordinator.dispose();
    expect(host.cancelledJobIds).toContain("analysis-job-3");
    expect(host.disposedSessionIds).toContain("analysis-session-3");
    expect(host.terminateCount).toBe(1);
  });

  it("keeps polling a compatible running job after a request-token hand-off", async () => {
    const host = new DeferredAnalysisHostV1();
    host.suggestedPollIntervalMs = 50;
    const snapshots: string[] = [];
    const coordinator =
      new ScientificProductStudioHemodynamicAnalysisCoordinatorV1({
        host,
        onSnapshot: ({ requestToken }) => snapshots.push(requestToken),
        onError: () => undefined,
        pollIntervalMs: 50,
      });
    const source = settledSourceV1(1, "4");

    coordinator.requestLatest({
      requestToken: "first-token",
      source,
      detailMode: "compare",
    });
    await waitForV1(() => host.restoreCalls.length === 1);
    host.resolveRestore(0);
    await waitForV1(() => snapshots.includes("first-token"));

    coordinator.requestLatest({
      requestToken: "second-token",
      source,
      detailMode: "standard",
    });
    await waitForV1(() => snapshots.includes("second-token"));
    await waitForV1(() => host.pollCalls.length > 0);

    expect(host.startCalls).toHaveLength(1);
    expect(host.pollCalls[0]).toBe("analysis-job-1");
    await coordinator.dispose();
  });

  it("reuses the same numerical sweep when a strict candidate is promoted", async () => {
    const host = new DeferredAnalysisHostV1();
    const source = settledSourceV1(1, "5");
    const promoted = Object.freeze({
      ...source,
      sourceRole: "promoted-settled-source" as const,
    });
    const snapshots: string[] = [];
    const coordinator =
      new ScientificProductStudioHemodynamicAnalysisCoordinatorV1({
        host,
        onSnapshot: ({ requestToken }) => snapshots.push(requestToken),
        onError: () => undefined,
      });

    coordinator.requestLatest({
      requestToken: "candidate-token",
      source,
      detailMode: "compare",
    });
    await waitForV1(() => host.restoreCalls.length === 1);
    host.resolveRestore(0);
    await waitForV1(() => snapshots.includes("candidate-token"));

    coordinator.requestLatest({
      requestToken: "promoted-token",
      source: promoted,
      detailMode: "compare",
    });
    await waitForV1(() => snapshots.includes("promoted-token"));

    expect(host.restoreCalls).toHaveLength(1);
    expect(host.startCalls).toHaveLength(1);
    await coordinator.dispose();
  });

  it("keeps polling when a presentation callback throws", async () => {
    const host = new DeferredAnalysisHostV1();
    host.suggestedPollIntervalMs = 50;
    const coordinator =
      new ScientificProductStudioHemodynamicAnalysisCoordinatorV1({
        host,
        onSnapshot: () => {
          throw new Error("presentation listener failed");
        },
        onError: () => undefined,
        pollIntervalMs: 50,
      });

    coordinator.requestLatest({
      requestToken: "throwing-listener-token",
      source: settledSourceV1(1, "6"),
      detailMode: "standard",
    });
    await waitForV1(() => host.restoreCalls.length === 1);
    host.resolveRestore(0);
    await waitForV1(() => host.pollCalls.length > 0);

    expect(host.startCalls).toHaveLength(1);
    await coordinator.dispose();
  });
});

class DeferredAnalysisHostV1
implements ScientificProductStudioHemodynamicAnalysisHostV1 {
  readonly restoreCalls: StudioSettledAnalysisSourceV1[] = [];
  readonly startCalls: Array<Readonly<{
    scenarioId: string;
    targetGeneration: number;
    detailMode: MainWireScientificHemodynamicCalculationDetailV2;
  }>> = [];
  readonly cancelledJobIds: string[] = [];
  readonly disposedSessionIds: string[] = [];
  readonly pollCalls: string[] = [];
  suggestedPollIntervalMs = 2_000;
  terminateCount = 0;

  private readonly restoreGates: Array<
    DeferredV1<MainWireStudioHemodynamicAnalysisSessionV1>
  > = [];

  restoreSettledSource(
    source: StudioSettledAnalysisSourceV1,
  ): Promise<MainWireStudioHemodynamicAnalysisSessionV1> {
    this.restoreCalls.push(source);
    const gate = deferredV1<MainWireStudioHemodynamicAnalysisSessionV1>();
    this.restoreGates.push(gate);
    return gate.promise;
  }

  resolveRestore(index: number): void {
    const source = this.restoreCalls[index];
    const gate = this.restoreGates[index];
    if (source === undefined || gate === undefined) {
      throw new Error(`missing restore ${index}`);
    }
    gate.resolve(Object.freeze({
      sessionId: `analysis-session-${source.targetGeneration}`,
      source,
      sourceIdentity: Object.freeze({
        revision: 100 + source.targetGeneration,
        acceptedTimeSec: 10 + source.targetGeneration,
        totalBloodVolumeMl: 5_000,
        parameterEpoch: source.targetGeneration,
        controlStateSha256: source.targetInputSha256,
      }),
    }));
  }

  async startGuytonStarlingJob(
    session: MainWireStudioHemodynamicAnalysisSessionV1,
    detailMode: MainWireScientificHemodynamicCalculationDetailV2,
  ): Promise<MainWireStudioHemodynamicAnalysisJobStartV1> {
    this.startCalls.push({
      scenarioId: session.source.scenarioId,
      targetGeneration: session.source.targetGeneration,
      detailMode,
    });
    const jobId = `analysis-job-${session.source.targetGeneration}`;
    return Object.freeze({
      session,
      jobId,
      detailMode,
      snapshot: jobSnapshotV1(jobId, detailMode),
      suggestedPollIntervalMs: this.suggestedPollIntervalMs,
    });
  }

  async pollGuytonStarlingJob(
    job: MainWireStudioHemodynamicAnalysisJobStartV1,
  ): Promise<MainWireScientificHemodynamicJobSnapshotV2> {
    this.pollCalls.push(job.jobId);
    return {
      ...job.snapshot,
      sequence: job.snapshot.sequence + this.pollCalls.length,
    };
  }

  async cancelGuytonStarlingJob(
    job: MainWireStudioHemodynamicAnalysisJobStartV1,
  ): Promise<void> {
    this.cancelledJobIds.push(job.jobId);
  }

  async disposeSession(
    session: MainWireStudioHemodynamicAnalysisSessionV1,
  ): Promise<void> {
    this.disposedSessionIds.push(session.sessionId);
  }

  terminate(): void {
    this.terminateCount += 1;
  }
}

function settledSourceV1(
  generation: number,
  digit: string,
): StudioSettledAnalysisSourceV1 {
  return Object.freeze({
    scenarioId: "scenario/analysis",
    targetGeneration: generation,
    sourceRole: generation === 0
      ? "initial-settled-source" as const
      : "automatic-strict-candidate" as const,
    targetInputSha256: digit.repeat(64),
    sourceRunRef: artifactRefV1("run-artifact", `${digit}a`),
    simulationInputRef: artifactRefV1("simulation-input", `${digit}b`),
    snapshotRef: artifactRefV1("snapshot-envelope", `${digit}c`),
    execution: Object.freeze({
      modelRef: "model/main-wire@1",
      runtimeRef: "runtime/browser-worker@1",
      solverRef: "solver/main-wire@1",
      stateCodecRef: "codec/main-wire@1",
      protocolRef: "protocol/settled@1",
    }),
  });
}

function artifactRefV1<TKind extends StudioArtifactKindV1>(
  kind: TKind,
  seed: string,
): StudioArtifactRefV1<TKind> {
  const normalized = seed.repeat(64).slice(0, 64).replace(
    /[^0-9a-f]/g,
    "a",
  );
  return Object.freeze({
    schemaId: STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
    kind,
    sha256: normalized,
    mediaType: "application/json",
    byteLength: 1,
  });
}

function jobSnapshotV1(
  jobId: string,
  detailMode: MainWireScientificHemodynamicCalculationDetailV2,
): MainWireScientificHemodynamicJobSnapshotV2 {
  return {
    jobId,
    detailMode,
    sequence: 1,
    status: "running",
  } as unknown as MainWireScientificHemodynamicJobSnapshotV2;
}

type DeferredV1<T> = Readonly<{
  promise: Promise<T>;
  resolve(value: T): void;
}>;

function deferredV1<T>(): DeferredV1<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((accept) => {
    resolve = accept;
  });
  return Object.freeze({ promise, resolve });
}

async function waitForV1(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 1_000;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error("timed out waiting for state");
    await new Promise((resolve) => globalThis.setTimeout(resolve, 1));
  }
}
