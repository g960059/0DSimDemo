import { describe, expect, it, vi } from "vitest";

import {
  SCIENTIFIC_PRODUCT_HEMODYNAMIC_ANALYSIS_PROVENANCE_V1,
  ScientificProductHemodynamicAnalysisCoordinatorV1,
  type ScientificProductHemodynamicAnalysisClientV1,
  type ScientificProductHemodynamicAnalysisErrorEventV1,
  type ScientificProductHemodynamicAnalysisSnapshotEventV1,
} from "@/components/scientificProduct/ScientificProductHemodynamicAnalysisCoordinatorV1";
import {
  SCIENTIFIC_PRODUCT_CASE_CATALOG_V1,
} from "@/components/scientificProduct/scientificProductCaseCatalogV1";
import {
  createMainWireScientificResearchControlBaselineTargetStateV0,
  createMainWireScientificResearchControlTargetStateV0,
  type MainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";
import type {
  MainWireScientificHemodynamicJobSnapshotV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import type {
  ScientificCommandV1,
  ScientificResearchControlContextV0,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import type {
  MainWireScientificWorkerResponseV1,
} from "@/engine/scientificBrowser/MainWireScientificWorkerClientV1";

describe("scientific product hidden hemodynamic analysis coordinator V1", () => {
  it("coalesces a target change at the settlement boundary and never publishes stale work", async () => {
    const fixture = await targetFixture();
    const client = new FakeAnalysisClientV1(fixture.baseline);
    const settlementGate = deferredV1<void>();
    client.nextSettlementGate = settlementGate;
    const snapshots: ScientificProductHemodynamicAnalysisSnapshotEventV1[] = [];
    const errors: ScientificProductHemodynamicAnalysisErrorEventV1[] = [];
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
      provenance:
        SCIENTIFIC_PRODUCT_HEMODYNAMIC_ANALYSIS_PROVENANCE_V1,
    });

    await coordinator.dispose();
    expect(client.terminate).toHaveBeenCalledOnce();
  });

  it("uses the previous hidden P1 as the next warm source", async () => {
    const fixture = await targetFixture();
    const client = new FakeAnalysisClientV1(fixture.baseline);
    const snapshots: ScientificProductHemodynamicAnalysisSnapshotEventV1[] = [];
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

  it("reports a failed new target without publishing over the retained snapshot", async () => {
    const fixture = await targetFixture();
    const client = new FakeAnalysisClientV1(fixture.baseline);
    const snapshots: ScientificProductHemodynamicAnalysisSnapshotEventV1[] = [];
    const errors: ScientificProductHemodynamicAnalysisErrorEventV1[] = [];
    const coordinator = coordinatorV1(client, snapshots, errors);

    coordinator.requestLatest(requestV1("target-a", 1, fixture.targetA));
    await waitForV1(() => snapshots.some(({ requestToken }) =>
      requestToken === "target-a"
    ));
    client.nextSettlementStatus = "period2-suspect";
    coordinator.requestLatest(requestV1("target-b", 2, fixture.targetB));
    await waitForV1(() => errors.some(({ requestToken }) =>
      requestToken === "target-b"
    ));

    expect(snapshots.map(({ requestToken }) => requestToken)).toEqual([
      "target-a",
    ]);
    expect(errors.at(-1)).toMatchObject({
      requestToken: "target-b",
      phase: "settlement",
      previousSnapshotRetained: true,
      provenance:
        SCIENTIFIC_PRODUCT_HEMODYNAMIC_ANALYSIS_PROVENANCE_V1,
    });
    expect(errors.at(-1)?.message).toContain("period-2-suspect");

    // A manual retry may deliberately reuse the visible generation token.
    coordinator.requestLatest(requestV1("target-b", 2, fixture.targetB));
    await waitForV1(() => snapshots.some(({ requestToken }) =>
      requestToken === "target-b"
    ));
    expect(snapshots.map(({ requestToken }) => requestToken)).toEqual([
      "target-a",
      "target-b",
    ]);

    await coordinator.dispose();
  });

  it("cancels an uncorrelated start response and publishes only the latest request", async () => {
    const fixture = await targetFixture();
    const client = new FakeAnalysisClientV1(fixture.baseline);
    const startGate = deferredV1<void>();
    client.nextStartGate = startGate;
    client.nextStartStatus = "running";
    const snapshots: ScientificProductHemodynamicAnalysisSnapshotEventV1[] = [];
    const coordinator = coordinatorV1(client, snapshots, []);

    coordinator.requestLatest(requestV1("target-a", 1, fixture.targetA));
    await waitForV1(() => client.commands.some(({ kind }) =>
      kind === "startGuytonStarlingProtocolJob"
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
      kind === "cancelGuytonStarlingProtocolJob"
    )).toBe(true);

    await coordinator.dispose();
  });
});

function coordinatorV1(
  client: FakeAnalysisClientV1,
  snapshots: ScientificProductHemodynamicAnalysisSnapshotEventV1[],
  errors: ScientificProductHemodynamicAnalysisErrorEventV1[],
): ScientificProductHemodynamicAnalysisCoordinatorV1 {
  return new ScientificProductHemodynamicAnalysisCoordinatorV1({
    caseEntry: SCIENTIFIC_PRODUCT_CASE_CATALOG_V1[0]!,
    createClient: () => client,
    loadBootstrapSource: async (_caseEntry, loadedClient) => {
      expect(loadedClient).toBe(client);
      return client.bootstrapSource;
    },
    onJobSnapshot: (event) => snapshots.push(event),
    onError: (event) => errors.push(event),
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
    detailMode: "standard" as const,
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

class FakeAnalysisClientV1
implements ScientificProductHemodynamicAnalysisClientV1 {
  status = "open" as const;
  readonly terminate = vi.fn(() => {
    (this as { status: "open" | "terminated" }).status = "terminated";
  });
  readonly commands: ScientificCommandV1[] = [];
  readonly startedTargetDigests: string[] = [];
  readonly startedOwnerSessionIds: string[] = [];
  readonly disposedTargetDigests: string[] = [];
  nextSettlementGate: DeferredV1<void> | null = null;
  nextStartGate: DeferredV1<void> | null = null;
  nextStartStatus: "running" | "complete" = "complete";
  nextSettlementStatus: "period1-converged" | "period2-suspect" =
    "period1-converged";
  private jobOrdinal = 0;
  private readonly contexts = new Map<string, ScientificResearchControlContextV0>();

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
    if (command.kind === "startGuytonStarlingProtocolJob") {
      const gate = this.nextStartGate;
      this.nextStartGate = null;
      await gate?.promise;
      const context = this.contexts.get(command.sessionId)!;
      const jobId = `hidden-job-${++this.jobOrdinal}`;
      const status = this.nextStartStatus;
      this.nextStartStatus = "complete";
      this.startedTargetDigests.push(
        context.controlState.targetStateSha256,
      );
      this.startedOwnerSessionIds.push(command.sessionId);
      return responseV1({
        ok: true,
        commandKind: command.kind,
        payload: {
          kind: "guytonStarlingProtocolJobStarted",
          job: {
            jobId,
            suggestedPollIntervalMs: 250,
            snapshot: snapshotV1(
              jobId,
              context,
              command.detailMode ?? "compare",
              status,
            ),
          },
        },
      });
    }
    if (command.kind === "cancelGuytonStarlingProtocolJob") {
      return responseV1({
        ok: true,
        commandKind: command.kind,
        payload: {
          kind: "guytonStarlingProtocolJobCancelled",
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
  detailMode: "standard" | "settled-reference" | "compare",
  status: "running" | "complete" = "complete",
): MainWireScientificHemodynamicJobSnapshotV2 {
  return {
    jobId,
    detailMode,
    sequence: 1,
    status,
    stage: status === "complete" ? "complete" : "vascular-ready",
    source: {
      revision: context.stateIdentity.revision,
      acceptedTimeSec: context.stateIdentity.acceptedTimeSec,
      fixedTotalBloodVolumeMl: context.stateIdentity.totalBloodVolumeMl,
    },
    baselinePeriodicity: "period1-converged",
    rightVascularFunction: {} as never,
    leftVascularFunction: {} as never,
    preloadPointEvidence: [],
    fastPreloadPreview: {} as never,
    progress: {
      completedPointCount: 9,
      plannedPointCountLowerBound: 9,
      activeDirections: [],
      completedBeatCount: 27,
      fastPreviewCompletedPointCount: 9,
      fastPreviewPlannedPointCount: 9,
    },
    result: null,
    errorMessage: null,
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

async function waitForV1(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error("timed out waiting for hidden analysis test state");
}
