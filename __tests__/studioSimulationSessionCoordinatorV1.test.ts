import { describe, expect, it } from "vitest";

import {
  STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
  type OpenSimulationSessionCommandV1,
  type PromoteSteadyCandidateCommandV1,
  type RuntimeCandidatePromotedV1,
  type RuntimeExecutionIdentityV1,
  type RuntimeLiveIntentResultV1,
  type RuntimePresentationFrameV1,
  type RuntimeSessionOpenedV1,
  type RuntimeStrictIntentResultV1,
  type RuntimeTargetIntentCommandV1,
  type RuntimeTargetIntentExecutionV1,
  type SimulationRuntimePortV1,
  type StudioArtifactKindV1,
  type StudioArtifactRefV1,
} from "@/studio/contracts/v1";
import {
  SimulationSessionCoordinatorV1,
} from "@/studio/application/runtime/SimulationSessionCoordinatorV1";
import {
  InMemoryContentAddressedArtifactStoreV1,
} from "@/studio/infrastructure/artifacts/InMemoryContentAddressedArtifactStoreV1";

describe("Studio SimulationSession coordinator V1", () => {
  it("opens N branches at one point and submits one atomic live+strict intent", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    await coordinator.open(openCommandV1());

    expect(coordinator.current.branches).toHaveLength(2);
    for (const branch of coordinator.current.branches) {
      expect(branch.targetGeneration).toBe(0);
      expect(branch.presentationRevision).toBe(0);
      expect(branch.display).toMatchObject({
        pointCount: 1,
        windowMetrics: {
          status: "collecting",
          collectedPointCount: 1,
          completedCycleCount: 0,
        },
      });
      expect(branch.display.firstPoint).toBe(branch.display.latestPoint);
    }

    const receipt = coordinator.applyControlIntent({
      intentId: "intent/shared-svr",
      targets: [
        targetV1("baseline", "3", 1.25),
        targetV1("hfrEF", "4", 1.25),
      ],
    });

    expect(receipt).toEqual({
      intentId: "intent/shared-svr",
      targetGenerations: [
        {
          scenarioId: "baseline",
          targetGeneration: 1,
          presentationRevision: 1,
        },
        {
          scenarioId: "hfrEF",
          targetGeneration: 1,
          presentationRevision: 1,
        },
      ],
    });
    expect(runtime.submissions).toHaveLength(1);
    expect(runtime.submissions[0]?.targets).toHaveLength(2);
    expect(Object.isFrozen(runtime.submissions[0])).toBe(true);
    expect(coordinator.branch("baseline").targetGeneration).toBe(1);
    expect(coordinator.branch("hfrEF").targetGeneration).toBe(1);
    expect(() => coordinator.applyControlIntent({
      intentId: "intent/shared-svr",
      targets: [targetV1("baseline", "5", 1.5)],
    })).toThrow(/already been submitted/);
    expect(runtime.submissions).toHaveLength(1);

    runtime.resolveStrict("intent/shared-svr");
    await flushV1();
    for (const branch of coordinator.current.branches) {
      expect(branch.latestSteadyCandidate).toMatchObject({
        targetGeneration: 1,
        steadyStatus: "converged",
        numericalHealth: "passed",
      });
      // Strict completion creates a candidate; it never changes presentation.
      expect(branch.display.origin.kind).toBe("opened-run");
      expect(branch.display.pointCount).toBe(1);
    }

    runtime.resolveLive("intent/shared-svr");
    await flushV1();
    for (const branch of coordinator.current.branches) {
      expect(branch.display.origin).toEqual({
        kind: "live-transition",
        targetGeneration: 1,
      });
      expect(branch.display.pointCount).toBe(2);
      expect(branch.display.windowMetrics.status).toBe("complete");
    }
  });

  it("discards stale branch results while retaining valid subset work", async () => {
    const runtime = new FakeRuntimePortV1();
    const artifacts = new InMemoryContentAddressedArtifactStoreV1();
    const coordinator = new SimulationSessionCoordinatorV1({
      runtime,
      artifacts,
    });
    await coordinator.open(await storedOpenCommandV1(artifacts));

    coordinator.applyControlIntent({
      intentId: "intent/both-generation-one",
      targets: [
        targetV1("baseline", "3", 1.25),
        targetV1("hfrEF", "4", 1.25),
      ],
    });
    coordinator.applyControlIntent({
      intentId: "intent/baseline-generation-two",
      targets: [targetV1("baseline", "5", 1.5)],
    });

    expect(runtime.submissions).toHaveLength(2);
    expect(coordinator.branch("baseline").targetGeneration).toBe(2);
    expect(coordinator.branch("hfrEF").targetGeneration).toBe(1);

    runtime.resolveStrict("intent/both-generation-one");
    runtime.resolveLive("intent/both-generation-one");
    await flushV1();

    expect(coordinator.branch("baseline")).toMatchObject({
      targetGeneration: 2,
      latestSteadyCandidate: null,
      display: { pointCount: 1, origin: { kind: "opened-run" } },
    });
    expect(coordinator.branch("hfrEF")).toMatchObject({
      targetGeneration: 1,
      latestSteadyCandidate: { targetGeneration: 1 },
      display: {
        pointCount: 2,
        origin: { kind: "live-transition", targetGeneration: 1 },
      },
    });

    runtime.setStrictSnapshotRef(
      "intent/baseline-generation-two",
      "baseline",
      await artifacts.putJson({
        kind: "snapshot-envelope",
        mediaType: "application/json",
        content: { fixture: "baseline-generation-two-snapshot" },
      }),
    );
    runtime.resolveStrict("intent/baseline-generation-two");
    await flushV1();
    const candidate = coordinator.branch("baseline").latestSteadyCandidate;
    expect(candidate).toMatchObject({
      targetGeneration: 2,
      targetInputSha256: "5".repeat(64),
    });
    expect(coordinator.branch("baseline").display.origin.kind).toBe(
      "opened-run",
    );

    const pinned = await coordinator.pinSteadyCandidate("baseline");
    const pinnedContent = await artifacts.readJson(pinned);
    expect(pinnedContent).toMatchObject({
      targetInputSha256: "5".repeat(64),
      claims: {
        steadyStatus: "converged",
        numericalHealth: "passed",
        canonicalSignalSamplesStored: false,
        canonicalWindowMetricsStored: false,
      },
    });
    expect(pinnedContent).not.toHaveProperty("targetGeneration");
    expect(pinnedContent).not.toHaveProperty("scenarioId");
    expect(coordinator.branch("baseline").display.pointCount).toBe(1);

    await coordinator.promoteSteadyCandidate("baseline");
    expect(runtime.promotions).toHaveLength(1);
    expect(coordinator.branch("baseline").display).toMatchObject({
      origin: {
        kind: "promoted-steady-candidate",
        targetGeneration: 2,
        candidateId: candidate?.candidateId,
      },
      pointCount: 1,
      windowMetrics: {
        status: "collecting",
        collectedPointCount: 1,
        completedCycleCount: 0,
      },
    });
    expect(coordinator.branch("hfrEF").display.pointCount).toBe(2);
    expect(
      Object.prototype.hasOwnProperty.call(
        coordinator.branch("baseline"),
        "steadyStatus",
      ),
    ).toBe(false);
  });

  it("isolates a strict failure to one branch and retains sibling candidates", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    await coordinator.open(openCommandV1());
    coordinator.applyControlIntent({
      intentId: "intent/partially-failing-strict",
      targets: [
        targetV1("baseline", "3", 1.25),
        targetV1("hfrEF", "4", 1.25),
      ],
    });

    runtime.resolveStrict(
      "intent/partially-failing-strict",
      "baseline",
    );
    await flushV1();

    expect(coordinator.branch("baseline")).toMatchObject({
      latestSteadyCandidate: null,
      lastRuntimeFailure: {
        lane: "strict",
        intentId: "intent/partially-failing-strict",
        targetGeneration: 1,
        message: "strict solver failed for baseline",
      },
    });
    expect(coordinator.branch("hfrEF")).toMatchObject({
      latestSteadyCandidate: {
        scenarioId: "hfrEF",
        targetGeneration: 1,
        steadyStatus: "converged",
      },
      lastRuntimeFailure: null,
    });
  });

  it("serializes a promotion against mutation of the same branch", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    await coordinator.open(openCommandV1());
    coordinator.applyControlIntent({
      intentId: "intent/promotion-source",
      targets: [targetV1("baseline", "3", 1.25)],
    });
    runtime.resolveStrict("intent/promotion-source");
    await flushV1();

    const candidate =
      coordinator.branch("baseline").latestSteadyCandidate;
    const gate = runtime.delayNextPromotion();
    const promotion = coordinator.promoteSteadyCandidate("baseline");
    expect(runtime.promotions).toHaveLength(1);

    expect(() => coordinator.applyControlIntent({
      intentId: "intent/racing-baseline-update",
      targets: [targetV1("baseline", "4", 1.5)],
    })).toThrow(/baseline is being promoted/);
    expect(runtime.submissions).toHaveLength(1);

    const sibling = coordinator.applyControlIntent({
      intentId: "intent/sibling-update",
      targets: [targetV1("hfrEF", "5", 1.5)],
    });
    expect(sibling.targetGenerations).toEqual([
      {
        scenarioId: "hfrEF",
        targetGeneration: 1,
        presentationRevision: 1,
      },
    ]);

    gate.resolve(undefined);
    await promotion;
    expect(coordinator.branch("baseline")).toMatchObject({
      targetGeneration: 1,
      targetInputSha256: candidate?.targetInputSha256,
      display: {
        origin: {
          kind: "promoted-steady-candidate",
          candidateId: candidate?.candidateId,
        },
        pointCount: 1,
      },
      presentationRevision: 2,
    });
  });

  it("does not let a same-generation late live result overwrite promotion", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    await coordinator.open(openCommandV1());
    coordinator.applyControlIntent({
      intentId: "intent/strict-before-live",
      targets: [targetV1("baseline", "3", 1.25)],
    });
    runtime.resolveStrict("intent/strict-before-live");
    await flushV1();

    await coordinator.promoteSteadyCandidate("baseline");
    const promoted = coordinator.branch("baseline");
    expect(promoted).toMatchObject({
      targetGeneration: 1,
      presentationRevision: 2,
      display: {
        origin: { kind: "promoted-steady-candidate" },
        pointCount: 1,
      },
    });

    runtime.resolveLive("intent/strict-before-live");
    await flushV1();
    expect(coordinator.branch("baseline").display).toEqual(promoted.display);
    expect(coordinator.branch("baseline").presentationRevision).toBe(2);
  });

  it("keeps the prior presentation revision when promotion fails", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    await coordinator.open(openCommandV1());
    coordinator.applyControlIntent({
      intentId: "intent/failed-promotion",
      targets: [targetV1("baseline", "3", 1.25)],
    });
    runtime.resolveStrict("intent/failed-promotion");
    await flushV1();
    runtime.rejectNextPromotion(new Error("runtime promotion failed"));

    await expect(coordinator.promoteSteadyCandidate("baseline"))
      .rejects.toThrow(/runtime promotion failed/);
    expect(coordinator.branch("baseline")).toMatchObject({
      presentationRevision: 1,
      display: { origin: { kind: "opened-run" } },
    });

    runtime.resolveLive("intent/failed-promotion");
    await flushV1();
    expect(coordinator.branch("baseline")).toMatchObject({
      presentationRevision: 1,
      display: { origin: { kind: "live-transition" } },
    });
  });

  it("rejects a pin when either authoritative artifact edge is dangling", async () => {
    const runtime = new FakeRuntimePortV1();
    const artifacts = new InMemoryContentAddressedArtifactStoreV1();
    const coordinator = new SimulationSessionCoordinatorV1({
      runtime,
      artifacts,
    });
    await coordinator.open(openCommandV1());
    coordinator.applyControlIntent({
      intentId: "intent/dangling-candidate",
      targets: [targetV1("baseline", "3", 1.25)],
    });
    runtime.resolveStrict("intent/dangling-candidate");
    await flushV1();

    await expect(coordinator.pinSteadyCandidate("baseline"))
      .rejects.toThrow(/snapshot artifact .* does not exist/);
    expect(artifacts.entryCount).toBe(0);
    expect(coordinator.branch("baseline").pinnedRunRefs).toEqual([]);

    const sourceRuntime = new FakeRuntimePortV1();
    const sourceArtifacts = new InMemoryContentAddressedArtifactStoreV1();
    const sourceCoordinator = new SimulationSessionCoordinatorV1({
      runtime: sourceRuntime,
      artifacts: sourceArtifacts,
    });
    await sourceCoordinator.open(openCommandV1());
    sourceCoordinator.applyControlIntent({
      intentId: "intent/dangling-source-run",
      targets: [targetV1("baseline", "4", 1.5)],
    });
    sourceRuntime.setStrictSnapshotRef(
      "intent/dangling-source-run",
      "baseline",
      await sourceArtifacts.putJson({
        kind: "snapshot-envelope",
        mediaType: "application/json",
        content: { fixture: "existing-candidate-snapshot" },
      }),
    );
    sourceRuntime.resolveStrict("intent/dangling-source-run");
    await flushV1();

    await expect(sourceCoordinator.pinSteadyCandidate("baseline"))
      .rejects.toThrow(/source run artifact .* does not exist/);
    expect(sourceArtifacts.entryCount).toBe(1);
    expect(sourceCoordinator.branch("baseline").pinnedRunRefs).toEqual([]);
  });

  it("requires exactly one collecting point when opening and promoting", async () => {
    const invalidOpenRuntime = new FakeRuntimePortV1();
    invalidOpenRuntime.openedCollectingPointCount = 2;
    const invalidOpenCoordinator = coordinatorV1(invalidOpenRuntime);
    await expect(invalidOpenCoordinator.open(openCommandV1()))
      .rejects.toThrow(/exactly one collected point/);

    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    await coordinator.open(openCommandV1());
    coordinator.applyControlIntent({
      intentId: "intent/invalid-promotion-frame",
      targets: [targetV1("baseline", "3", 1.25)],
    });
    runtime.resolveStrict("intent/invalid-promotion-frame");
    await flushV1();
    runtime.promotedCollectingPointCount = 2;

    await expect(coordinator.promoteSteadyCandidate("baseline"))
      .rejects.toThrow(/exactly one collected point/);
    expect(coordinator.branch("baseline").display.origin.kind)
      .toBe("opened-run");
  });
});

function coordinatorV1(
  runtime: FakeRuntimePortV1,
): SimulationSessionCoordinatorV1 {
  return new SimulationSessionCoordinatorV1({
    runtime,
    artifacts: new InMemoryContentAddressedArtifactStoreV1(),
  });
}

function openCommandV1(): OpenSimulationSessionCommandV1 {
  return {
    sessionId: "session/studio-v1",
    branches: [
      {
        scenarioId: "baseline",
        sourceRunRef: refV1("run-artifact", "a"),
        sourceSnapshotRef: refV1("snapshot-envelope", "b"),
        initialTargetInputSha256: "1".repeat(64),
      },
      {
        scenarioId: "hfrEF",
        sourceRunRef: refV1("run-artifact", "c"),
        sourceSnapshotRef: refV1("snapshot-envelope", "d"),
        initialTargetInputSha256: "2".repeat(64),
      },
    ],
  };
}

async function storedOpenCommandV1(
  artifacts: InMemoryContentAddressedArtifactStoreV1,
): Promise<OpenSimulationSessionCommandV1> {
  const [
    baselineRun,
    baselineSnapshot,
    hfrEfRun,
    hfrEfSnapshot,
  ] = await Promise.all([
    artifacts.putJson({
      kind: "run-artifact",
      mediaType: "application/json",
      content: { fixture: "baseline-source-run" },
    }),
    artifacts.putJson({
      kind: "snapshot-envelope",
      mediaType: "application/json",
      content: { fixture: "baseline-source-snapshot" },
    }),
    artifacts.putJson({
      kind: "run-artifact",
      mediaType: "application/json",
      content: { fixture: "hfref-source-run" },
    }),
    artifacts.putJson({
      kind: "snapshot-envelope",
      mediaType: "application/json",
      content: { fixture: "hfref-source-snapshot" },
    }),
  ]);
  return {
    sessionId: "session/studio-v1",
    branches: [
      {
        scenarioId: "baseline",
        sourceRunRef: baselineRun,
        sourceSnapshotRef: baselineSnapshot,
        initialTargetInputSha256: "1".repeat(64),
      },
      {
        scenarioId: "hfrEF",
        sourceRunRef: hfrEfRun,
        sourceSnapshotRef: hfrEfSnapshot,
        initialTargetInputSha256: "2".repeat(64),
      },
    ],
  };
}

function targetV1(
  scenarioId: string,
  hashDigit: string,
  value: number,
) {
  return {
    scenarioId,
    patch: {
      targetInputSha256: hashDigit.repeat(64),
      values: { "circulation.svr-scale": value },
    },
  };
}

function frameV1(
  sequence: number,
  metricStatus: "collecting" | "complete" = "collecting",
  collectingPointCount = 1,
): RuntimePresentationFrameV1 {
  return {
    point: {
      sequence,
      simulationTimeSec: sequence * 0.01,
      phase01: (sequence % 100) / 100,
      values: { "pressure.lv": 100 + sequence },
    },
    windowMetrics: metricStatus === "collecting"
      ? {
        status: "collecting",
        collectedPointCount: collectingPointCount,
        completedCycleCount: 0,
      }
      : {
        status: "complete",
        collectedPointCount: 101,
        completedCycleCount: 1,
        values: { "metric.stroke-volume": 70 },
      },
  };
}

const EXECUTION_V1: RuntimeExecutionIdentityV1 = Object.freeze({
  modelRef: "model/main-wire@1.0.0",
  runtimeRef: "runtime/browser-worker@1.0.0",
  solverRef: "solver/strict@1.0.0",
  stateCodecRef: "codec/exact@1.0.0",
  protocolRef: "protocol/automatic-dual-path@1.0.0",
});

class FakeRuntimePortV1 implements SimulationRuntimePortV1 {
  readonly submissions: RuntimeTargetIntentCommandV1[] = [];
  readonly promotions: PromoteSteadyCandidateCommandV1[] = [];
  readonly closedSessionIds: string[] = [];
  openedCollectingPointCount = 1;
  promotedCollectingPointCount = 1;
  private opened: OpenSimulationSessionCommandV1 | null = null;
  private nextPromotionGate: DeferredV1<void> | null = null;
  private nextPromotionError: Error | null = null;
  private readonly strictSnapshotRefs =
    new Map<string, StudioArtifactRefV1<"snapshot-envelope">>();
  private readonly executions = new Map<string, Readonly<{
    command: RuntimeTargetIntentCommandV1;
    live: DeferredV1<RuntimeLiveIntentResultV1>;
    strict: DeferredV1<RuntimeStrictIntentResultV1>;
  }>>();

  async openSession(
    command: OpenSimulationSessionCommandV1,
  ): Promise<RuntimeSessionOpenedV1> {
    this.opened = command;
    // Deliberately reverse adapter order; the coordinator owns stable order.
    return {
      sessionId: command.sessionId,
      branches: [...command.branches].reverse().map((branch, index) => ({
        scenarioId: branch.scenarioId,
        liveBranchId: `branch/${branch.scenarioId}`,
        execution: EXECUTION_V1,
        initialFrame: frameV1(
          index,
          "collecting",
          this.openedCollectingPointCount,
        ),
      })),
    };
  }

  startTargetIntent(
    command: RuntimeTargetIntentCommandV1,
  ): RuntimeTargetIntentExecutionV1 {
    this.submissions.push(command);
    const live = deferredV1<RuntimeLiveIntentResultV1>();
    const strict = deferredV1<RuntimeStrictIntentResultV1>();
    this.executions.set(command.intentId, { command, live, strict });
    return Object.freeze({
      live: live.promise,
      strict: strict.promise,
    });
  }

  async promoteSteadyCandidate(
    command: PromoteSteadyCandidateCommandV1,
  ): Promise<RuntimeCandidatePromotedV1> {
    this.promotions.push(command);
    const gate = this.nextPromotionGate;
    this.nextPromotionGate = null;
    if (gate !== null) await gate.promise;
    const error = this.nextPromotionError;
    this.nextPromotionError = null;
    if (error !== null) throw error;
    return {
      sessionId: command.sessionId,
      scenarioId: command.scenarioId,
      targetGeneration: command.targetGeneration,
      presentationRevision: command.presentationRevision,
      candidateId: command.candidate.candidateId,
      initialFrame: frameV1(
        1_000 + command.targetGeneration,
        "collecting",
        this.promotedCollectingPointCount,
      ),
    };
  }

  delayNextPromotion(): DeferredV1<void> {
    const gate = deferredV1<void>();
    this.nextPromotionGate = gate;
    return gate;
  }

  rejectNextPromotion(error: Error): void {
    this.nextPromotionError = error;
  }

  setStrictSnapshotRef(
    intentId: string,
    scenarioId: string,
    ref: StudioArtifactRefV1<"snapshot-envelope">,
  ): void {
    this.strictSnapshotRefs.set(
      strictSnapshotKeyV1(intentId, scenarioId),
      ref,
    );
  }

  async closeSession(sessionId: string): Promise<void> {
    this.closedSessionIds.push(sessionId);
  }

  resolveLive(intentId: string): void {
    const execution = this.requiredExecutionV1(intentId);
    execution.live.resolve({
      sessionId: execution.command.sessionId,
      intentId,
      branches: execution.command.targets.map((target) => ({
        status: "success" as const,
        scenarioId: target.scenarioId,
        targetGeneration: target.targetGeneration,
        result: {
          scenarioId: target.scenarioId,
          targetGeneration: target.targetGeneration,
          presentationRevision: target.presentationRevision,
          targetInputSha256: target.patch.targetInputSha256,
          frame: frameV1(100 + target.targetGeneration, "complete"),
        },
      })),
    });
  }

  resolveStrict(
    intentId: string,
    failedScenarioId?: string,
  ): void {
    const execution = this.requiredExecutionV1(intentId);
    const opened = this.opened;
    if (opened === null) throw new Error("fake runtime was not opened");
    execution.strict.resolve({
      sessionId: execution.command.sessionId,
      intentId,
      branches: execution.command.targets.map((target, index) =>
        target.scenarioId === failedScenarioId
          ? {
            status: "failure" as const,
            scenarioId: target.scenarioId,
            targetGeneration: target.targetGeneration,
            targetInputSha256: target.patch.targetInputSha256,
            message: `strict solver failed for ${target.scenarioId}`,
          }
          : {
            status: "success" as const,
            scenarioId: target.scenarioId,
            targetGeneration: target.targetGeneration,
            candidate: {
              candidateId:
                `candidate/${target.scenarioId}/${target.targetGeneration}`,
              sessionId: execution.command.sessionId,
              scenarioId: target.scenarioId,
              targetGeneration: target.targetGeneration,
              sourceRunRef: opened.branches.find(({ scenarioId }) =>
                scenarioId === target.scenarioId
              )!.sourceRunRef,
              targetInputSha256: target.patch.targetInputSha256,
              snapshotRef: this.strictSnapshotRefs.get(
                strictSnapshotKeyV1(intentId, target.scenarioId),
              ) ?? refV1(
                "snapshot-envelope",
                ["6", "7", "8", "9"][
                  index + target.targetGeneration - 1
                ] ?? "e",
              ),
              execution: EXECUTION_V1,
              steadyStatus: "converged" as const,
              numericalHealth: "passed" as const,
            },
          }
      ),
    });
  }

  private requiredExecutionV1(intentId: string) {
    const execution = this.executions.get(intentId);
    if (execution === undefined) throw new Error(`unknown intent ${intentId}`);
    return execution;
  }
}

function strictSnapshotKeyV1(
  intentId: string,
  scenarioId: string,
): string {
  return `${intentId}\0${scenarioId}`;
}

function refV1<TKind extends StudioArtifactKindV1>(
  kind: TKind,
  digit: string,
): StudioArtifactRefV1<TKind> {
  return Object.freeze({
    schemaId: STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
    kind,
    sha256: digit.repeat(64),
    mediaType: "application/json",
    byteLength: 1,
  });
}

type DeferredV1<T> = Readonly<{
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}>;

function deferredV1<T>(): DeferredV1<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function flushV1(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
