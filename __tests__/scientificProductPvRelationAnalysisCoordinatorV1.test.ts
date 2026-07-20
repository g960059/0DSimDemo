import { describe, expect, it, vi } from "vitest";

import {
  SCIENTIFIC_PRODUCT_PV_RELATION_ANALYSIS_PROVENANCE_V1,
  ScientificProductPvRelationAnalysisCoordinatorV1,
  type ScientificProductPvRelationAnalysisErrorEventV1,
  type ScientificProductPvRelationAnalysisSnapshotEventV1,
} from "@/components/scientificProduct/ScientificProductPvRelationAnalysisCoordinatorV1";
import {
  SCIENTIFIC_PRODUCT_CASE_CATALOG_V1,
} from "@/components/scientificProduct/scientificProductCaseCatalogV1";
import {
  createMainWireScientificResearchControlBaselineTargetStateV0,
  createMainWireScientificResearchControlTargetStateV0,
  type MainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";
import type {
  MainWireScientificPvRelationJobSnapshotV1,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationJobV1";
import type {
  ScientificCommandV1,
  ScientificResearchControlContextV0,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import type {
  MainWireScientificWorkerResponseV1,
} from "@/engine/scientificBrowser/MainWireScientificWorkerClientV1";

describe("scientific product hidden PV relation analysis coordinator V1", () => {
  it("coalesces a target change at the settlement boundary and never publishes stale work", async () => {
    const fixture = await targetFixture();
    const client = new FakePvAnalysisClientV1(fixture.baseline);
    const settlementGate = deferredV1<void>();
    client.nextSettlementGate = settlementGate;
    const snapshots: ScientificProductPvRelationAnalysisSnapshotEventV1[] = [];
    const errors: ScientificProductPvRelationAnalysisErrorEventV1[] = [];
    const coordinator = coordinatorV1(client, snapshots, errors);

    coordinator.requestLatest(requestV1("target-a", 1, fixture.targetA));
    await waitForV1(() => client.commands.some(({ kind }) =>
      kind === "settlePeriodic"
    ));
    coordinator.requestLatest(requestV1("target-b", 2, fixture.targetB));
    settlementGate.resolve();

    await waitForV1(() => snapshots.some(({ requestToken, snapshot }) =>
      requestToken === "target-b" && snapshot.status === "complete"
    ));

    expect(snapshots.map(({ requestToken }) => requestToken)).toEqual([
      "target-b",
    ]);
    expect(errors).toEqual([]);
    expect(client.startedTargetDigests).toEqual([
      fixture.targetB.targetStateSha256,
    ]);
    const forks = client.commands.filter((command) =>
      command.kind === "forkResearchControlSession"
    );
    expect(forks).toHaveLength(2);
    expect(client.disposedTargetDigests).toContain(
      fixture.targetA.targetStateSha256,
    );
    expect(snapshots[0]).toMatchObject({
      visibleParameterEpoch: 2,
      visibleControlStateSha256: fixture.targetB.targetStateSha256,
      provenance: SCIENTIFIC_PRODUCT_PV_RELATION_ANALYSIS_PROVENANCE_V1,
    });

    await coordinator.dispose();
    expect(client.terminate).toHaveBeenCalledOnce();
  });

  it("cancels an uncorrelated start response and publishes only the latest target", async () => {
    const fixture = await targetFixture();
    const client = new FakePvAnalysisClientV1(fixture.baseline);
    const startGate = deferredV1<void>();
    client.nextStartGate = startGate;
    client.nextStartStatus = "running";
    const snapshots: ScientificProductPvRelationAnalysisSnapshotEventV1[] = [];
    const coordinator = coordinatorV1(client, snapshots, []);

    coordinator.requestLatest(requestV1("target-a", 1, fixture.targetA));
    await waitForV1(() => client.commands.some(({ kind }) =>
      kind === "startPvRelationsProtocolJob"
    ));
    coordinator.requestLatest(requestV1("target-b", 2, fixture.targetB));
    startGate.resolve();

    await waitForV1(() => snapshots.some(({ requestToken }) =>
      requestToken === "target-b"
    ));
    expect(snapshots.map(({ requestToken }) => requestToken)).toEqual([
      "target-b",
    ]);
    expect(client.commands.some(({ kind }) =>
      kind === "cancelPvRelationsProtocolJob"
    )).toBe(true);

    await coordinator.dispose();
  });

  it("uses the previous hidden P1 as the next target's warm source", async () => {
    const fixture = await targetFixture();
    const client = new FakePvAnalysisClientV1(fixture.baseline);
    const snapshots: ScientificProductPvRelationAnalysisSnapshotEventV1[] = [];
    const coordinator = coordinatorV1(client, snapshots, []);

    coordinator.requestLatest(requestV1("target-a", 1, fixture.targetA));
    await waitForV1(() => snapshots.some(({ requestToken }) =>
      requestToken === "target-a"
    ));
    const firstTargetSession = client.startedOwnerSessionIds.at(-1)!;

    coordinator.requestLatest(requestV1("target-b", 2, fixture.targetB));
    await waitForV1(() => snapshots.some(({ requestToken }) =>
      requestToken === "target-b"
    ));

    const forkCommands = client.commands.filter((command): command is Extract<
      ScientificCommandV1,
      { kind: "forkResearchControlSession" }
    > => command.kind === "forkResearchControlSession");
    expect(forkCommands).toHaveLength(2);
    expect(forkCommands[1]?.sourceSessionId).toBe(firstTargetSession);
    expect(client.startedTargetDigests).toEqual([
      fixture.targetA.targetStateSha256,
      fixture.targetB.targetStateSha256,
    ]);

    await coordinator.dispose();
  });

  it("reports P2 and job errors without publishing over the retained result", async () => {
    const fixture = await targetFixture();
    const client = new FakePvAnalysisClientV1(fixture.baseline);
    const snapshots: ScientificProductPvRelationAnalysisSnapshotEventV1[] = [];
    const errors: ScientificProductPvRelationAnalysisErrorEventV1[] = [];
    const coordinator = coordinatorV1(client, snapshots, errors);

    coordinator.requestLatest(requestV1("target-a", 1, fixture.targetA));
    await waitForV1(() => snapshots.some(({ requestToken }) =>
      requestToken === "target-a"
    ));

    client.nextSettlementStatus = "period2-suspect";
    coordinator.requestLatest(requestV1("target-b-p2", 2, fixture.targetB));
    await waitForV1(() => errors.some(({ requestToken }) =>
      requestToken === "target-b-p2"
    ));
    expect(snapshots.map(({ requestToken }) => requestToken)).toEqual([
      "target-a",
    ]);
    expect(errors.at(-1)).toMatchObject({
      requestToken: "target-b-p2",
      phase: "settlement",
      previousSnapshotRetained: true,
      provenance: SCIENTIFIC_PRODUCT_PV_RELATION_ANALYSIS_PROVENANCE_V1,
    });

    client.nextStartStatus = "error";
    coordinator.requestLatest(requestV1("target-b-error", 2, fixture.targetB));
    await waitForV1(() => errors.some(({ requestToken }) =>
      requestToken === "target-b-error"
    ));
    expect(snapshots.map(({ requestToken }) => requestToken)).toEqual([
      "target-a",
    ]);
    expect(errors.at(-1)).toMatchObject({
      requestToken: "target-b-error",
      phase: "job-start",
      previousSnapshotRetained: true,
    });

    await coordinator.dispose();
  });

  it("re-publishes a running same-target job for a new token and keeps polling", async () => {
    const fixture = await targetFixture();
    const client = new FakePvAnalysisClientV1(fixture.baseline);
    client.nextStartStatus = "running";
    client.nextPollStatuses.push("complete");
    const snapshots: ScientificProductPvRelationAnalysisSnapshotEventV1[] = [];
    const errors: ScientificProductPvRelationAnalysisErrorEventV1[] = [];
    const coordinator = coordinatorV1(client, snapshots, errors, 100);

    coordinator.requestLatest(requestV1("target-a:1", 1, fixture.targetA));
    await waitForV1(() => snapshots.some(({ requestToken, snapshot }) =>
      requestToken === "target-a:1" && snapshot.status === "running"
    ));

    coordinator.requestLatest(requestV1("target-a:2", 2, fixture.targetA));
    await waitForV1(() => snapshots.some(({ requestToken, snapshot }) =>
      requestToken === "target-a:2" && snapshot.status === "running"
    ));
    await waitForV1(() => snapshots.some(({ requestToken, snapshot }) =>
      requestToken === "target-a:2" && snapshot.status === "complete"
    ), 500);

    expect(client.commands.filter(({ kind }) =>
      kind === "startPvRelationsProtocolJob"
    )).toHaveLength(1);
    expect(client.commands.filter(({ kind }) =>
      kind === "pollPvRelationsProtocolJob"
    )).toHaveLength(1);
    expect(snapshots[0]?.requestToken).toBe("target-a:1");
    expect(snapshots.at(-1)).toMatchObject({
      requestToken: "target-a:2",
      snapshot: { status: "complete" },
    });
    expect(errors).toEqual([]);

    await coordinator.dispose();
  });
});

function coordinatorV1(
  client: FakePvAnalysisClientV1,
  snapshots: ScientificProductPvRelationAnalysisSnapshotEventV1[],
  errors: ScientificProductPvRelationAnalysisErrorEventV1[],
  pollIntervalMs?: number,
): ScientificProductPvRelationAnalysisCoordinatorV1 {
  return new ScientificProductPvRelationAnalysisCoordinatorV1({
    caseEntry: SCIENTIFIC_PRODUCT_CASE_CATALOG_V1[0]!,
    createClient: () => client,
    loadBootstrapSource: async (_caseEntry, loadedClient) => {
      expect(loadedClient).toBe(client);
      return client.bootstrapSource;
    },
    onJobSnapshot: (event) => snapshots.push(event),
    onError: (event) => errors.push(event),
    pollIntervalMs,
  });
}

function requestV1(
  requestToken: string,
  visibleParameterEpoch: number,
  targetControlState: MainWireScientificResearchControlTargetStateV0,
) {
  return Object.freeze({
    requestToken,
    targetControlState,
    visibleParameterEpoch,
    visibleControlStateSha256: targetControlState.targetStateSha256,
  });
}

async function targetFixture() {
  const baseline =
    await createMainWireScientificResearchControlBaselineTargetStateV0();
  const targetA = await createMainWireScientificResearchControlTargetStateV0({
    ...baseline.controls,
    "circulation.systemic-vascular-resistance-scale": 1.5,
  });
  const targetB = await createMainWireScientificResearchControlTargetStateV0({
    ...baseline.controls,
    "circulation.pulmonary-vascular-resistance-scale": 1.5,
  });
  return { baseline, targetA, targetB };
}

class FakePvAnalysisClientV1 {
  status = "open" as const;
  readonly terminate = vi.fn(() => {
    (this as { status: "open" | "terminated" }).status = "terminated";
  });
  readonly commands: ScientificCommandV1[] = [];
  readonly startedTargetDigests: string[] = [];
  readonly startedOwnerSessionIds: string[] = [];
  readonly disposedTargetDigests: string[] = [];
  readonly nextPollStatuses: Array<"running" | "complete" | "error"> = [];
  nextSettlementGate: DeferredV1<void> | null = null;
  nextStartGate: DeferredV1<void> | null = null;
  nextStartStatus: "running" | "complete" | "error" = "complete";
  nextSettlementStatus: "period1-converged" | "period2-suspect" =
    "period1-converged";
  private jobOrdinal = 0;
  private readonly contexts = new Map<string, ScientificResearchControlContextV0>();
  private readonly jobs = new Map<string, Readonly<{
    ownerSessionId: string;
    sequence: number;
  }>>();

  readonly bootstrapSource: Readonly<{
    sessionId: string;
    context: ScientificResearchControlContextV0;
  }>;

  constructor(baseline: MainWireScientificResearchControlTargetStateV0) {
    const context = contextV1(baseline, 0, 10, 1_000);
    this.bootstrapSource = Object.freeze({
      sessionId: "hidden-bootstrap-source",
      context,
    });
    this.contexts.set(this.bootstrapSource.sessionId, context);
  }

  async request(
    command: ScientificCommandV1,
  ): Promise<MainWireScientificWorkerResponseV1> {
    this.commands.push(command);
    if (command.kind === "forkResearchControlSession") {
      const source = this.contexts.get(command.sourceSessionId)!;
      const context = contextV1(
        command.targetControlState,
        source.parameterEpoch + 1,
        source.stateIdentity.acceptedTimeSec,
        source.stateIdentity.revision,
      );
      this.contexts.set(command.sessionId, context);
      return responseV1({
        ok: true,
        commandKind: command.kind,
        payload: {
          kind: "researchControlSessionForked",
          sourceSessionId: command.sourceSessionId,
          targetStateIdentity: context.stateIdentity,
          targetControlState: context.controlState,
          parameterEpoch: context.parameterEpoch,
          observableFrame: frameV1(context),
        },
      });
    }
    if (command.kind === "settlePeriodic") {
      const gate = this.nextSettlementGate;
      this.nextSettlementGate = null;
      await gate?.promise;
      const status = this.nextSettlementStatus;
      this.nextSettlementStatus = "period1-converged";
      const previous = this.contexts.get(command.sessionId)!;
      const context = Object.freeze({
        ...previous,
        stateIdentity: Object.freeze({
          ...previous.stateIdentity,
          revision: previous.stateIdentity.revision + 500,
          acceptedTimeSec: previous.stateIdentity.acceptedTimeSec + 1,
        }),
      });
      this.contexts.set(command.sessionId, context);
      return responseV1({
        ok: true,
        commandKind: command.kind,
        payload: {
          kind: "periodic-settlement-progress",
          status,
          periodicSteadyStateClaimed: status === "period1-converged",
          period2OrbitSuspected: status === "period2-suspect",
          finalObservableFrame: frameV1(context),
        },
      });
    }
    if (command.kind === "startPvRelationsProtocolJob") {
      const gate = this.nextStartGate;
      this.nextStartGate = null;
      await gate?.promise;
      const context = this.contexts.get(command.sessionId)!;
      const jobId = `hidden-pv-job-${++this.jobOrdinal}`;
      const status = this.nextStartStatus;
      this.nextStartStatus = "complete";
      this.startedTargetDigests.push(context.controlState.targetStateSha256);
      this.startedOwnerSessionIds.push(command.sessionId);
      this.jobs.set(jobId, Object.freeze({
        ownerSessionId: command.sessionId,
        sequence: 1,
      }));
      return responseV1({
        ok: true,
        commandKind: command.kind,
        payload: {
          kind: "pvRelationsProtocolJobStarted",
          job: {
            jobId,
            suggestedPollIntervalMs: 100,
            snapshot: snapshotV1(jobId, context, 1, status),
          },
        },
      });
    }
    if (command.kind === "pollPvRelationsProtocolJob") {
      const job = this.jobs.get(command.jobId)!;
      const context = this.contexts.get(job.ownerSessionId)!;
      const status = this.nextPollStatuses.shift() ?? "complete";
      const sequence = job.sequence + 1;
      this.jobs.set(command.jobId, Object.freeze({
        ...job,
        sequence,
      }));
      return responseV1({
        ok: true,
        commandKind: command.kind,
        payload: {
          kind: "pvRelationsProtocolJobProgress",
          snapshot: snapshotV1(command.jobId, context, sequence, status),
        },
      });
    }
    if (command.kind === "cancelPvRelationsProtocolJob") {
      const job = this.jobs.get(command.jobId)!;
      const context = this.contexts.get(job.ownerSessionId)!;
      return responseV1({
        ok: true,
        commandKind: command.kind,
        payload: {
          kind: "pvRelationsProtocolJobCancelled",
          snapshot: snapshotV1(
            command.jobId,
            context,
            job.sequence + 1,
            "cancelled",
          ),
        },
      });
    }
    if (command.kind === "disposeSession") {
      const context = this.contexts.get(command.sessionId);
      if (context !== undefined) {
        this.disposedTargetDigests.push(
          context.controlState.targetStateSha256,
        );
      }
      this.contexts.delete(command.sessionId);
      return responseV1({
        ok: true,
        commandKind: command.kind,
        payload: {
          kind: "sessionDisposed",
          disposedSessionId: command.sessionId,
        },
      });
    }
    throw new Error(`unexpected fake command ${command.kind}`);
  }
}

function contextV1(
  controlState: MainWireScientificResearchControlTargetStateV0,
  parameterEpoch: number,
  acceptedTimeSec: number,
  revision: number,
): ScientificResearchControlContextV0 {
  return Object.freeze({
    stateIdentity: Object.freeze({
      revision,
      acceptedTimeSec,
      totalBloodVolumeMl: 5_000,
    }),
    controlState,
    parameterEpoch,
  });
}

function frameV1(context: ScientificResearchControlContextV0) {
  return {
    revision: context.stateIdentity.revision,
    acceptedTimeSec: context.stateIdentity.acceptedTimeSec,
  };
}

function snapshotV1(
  jobId: string,
  context: ScientificResearchControlContextV0,
  sequence: number,
  status: "running" | "complete" | "cancelled" | "error",
): MainWireScientificPvRelationJobSnapshotV1 {
  return {
    jobId,
    sequence,
    status,
    stage: status === "complete"
      ? "complete"
      : status === "cancelled"
        ? "cancelled"
        : status === "error"
          ? "error"
          : "lower-loading",
    source: {
      revision: context.stateIdentity.revision,
      acceptedTimeSec: context.stateIdentity.acceptedTimeSec,
      fixedTotalBloodVolumeMl: context.stateIdentity.totalBloodVolumeMl,
    },
    sourceFingerprint: "f".repeat(64),
    cacheStatus: "miss",
    beats: [],
    progress: null,
    result: null,
    errorMessage: status === "error" ? "synthetic PV job failure" : null,
  };
}

function responseV1(value: unknown): MainWireScientificWorkerResponseV1 {
  return value as MainWireScientificWorkerResponseV1;
}

type DeferredV1<T> = Readonly<{
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
}>;

function deferredV1<T>(): DeferredV1<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

async function waitForV1(
  predicate: () => boolean,
  timeoutMs = 250,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() <= deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
  throw new Error("timed out waiting for hidden PV analysis test state");
}
