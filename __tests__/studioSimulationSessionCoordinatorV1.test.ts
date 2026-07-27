import { describe, expect, it } from "vitest";

import {
  INITIAL_RUNTIME_LIVE_PACING_STATE_V1,
  STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
  type OpenSimulationSessionCommandV1,
  type PromoteSteadyCandidateCommandV1,
  type RuntimeCandidatePromotedV1,
  type RuntimeExecutionIdentityV1,
  type RuntimeLiveIntentResultV1,
  type RuntimePresentationEventV1,
  type RuntimePresentationFrameV1,
  type RuntimeSessionOpenedV1,
  type RuntimeSignalBatchV1,
  type RuntimeSignalChannelRefV1,
  type RuntimeSignalEventV1,
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
      expect(branch.livePlayback).toBe("running");
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
      expect(branch.display.pointCount).toBe(1);
      expect(branch.display.windowMetrics.status).toBe("collecting");
    }
  });

  it("publishes stable nullable snapshots for accepted state replacements only", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    const getSnapshot = coordinator.getSnapshot;
    const subscribe = coordinator.subscribe;
    const notifications: string[] = [];

    expect(getSnapshot()).toBeNull();
    expect(coordinator.getSnapshot).toBe(getSnapshot);
    expect(coordinator.subscribe).toBe(subscribe);
    const unsubscribe = subscribe(() => {
      const snapshot = getSnapshot();
      if (snapshot === null) return;
      const branch = snapshot.branches.find(({ scenarioId }) =>
        scenarioId === "baseline"
      )!;
      notifications.push([
        snapshot.status,
        `g${branch.targetGeneration}`,
        `r${branch.presentationRevision}`,
        `e${branch.streamEpoch}`,
        branch.display.origin.kind,
        `points:${branch.display.pointCount}`,
        branch.livePlayback,
        `candidate:${branch.latestSteadyCandidate !== null}`,
        `intent:${snapshot.lastAppliedIntentId ?? "none"}`,
      ].join("|"));
    });

    await coordinator.open(openCommandV1());
    expect(notifications).toHaveLength(1);
    expect(getSnapshot()).toBe(getSnapshot());

    coordinator.applyControlIntent({
      intentId: "intent/observable-state",
      targets: [targetV1("baseline", "3", 1.25)],
    });
    expect(notifications).toHaveLength(2);

    runtime.resolveStrict("intent/observable-state");
    await flushV1();
    expect(notifications).toHaveLength(3);

    runtime.resolveLive("intent/observable-state");
    await flushV1();
    expect(notifications).toHaveLength(4);

    const nextSequence =
      coordinator.branch("baseline").display.latestPoint.sequence + 1;
    runtime.emitSignal("baseline", {
      kind: "samples",
      targetGeneration: 0,
      presentationRevision: 1,
      streamEpoch: 1,
      points: [frameV1(nextSequence).point],
      windowMetrics: {
        status: "collecting",
        collectedPointCount: 2,
        completedCycleCount: 0,
      },
    });
    expect(notifications).toHaveLength(4);

    runtime.emitSignal("baseline", {
      kind: "samples",
      targetGeneration: 1,
      presentationRevision: 1,
      streamEpoch: 1,
      points: [frameV1(nextSequence).point],
      windowMetrics: {
        status: "collecting",
        collectedPointCount: 2,
        completedCycleCount: 0,
      },
    });
    expect(notifications).toHaveLength(5);

    await coordinator.suspendBranch("baseline");
    expect(notifications).toHaveLength(6);
    await coordinator.suspendBranch("baseline");
    expect(notifications).toHaveLength(6);

    await coordinator.resumeBranch("baseline");
    expect(notifications).toHaveLength(7);
    await coordinator.resumeBranch("baseline");
    expect(notifications).toHaveLength(7);

    await coordinator.promoteSteadyCandidate("baseline");
    expect(notifications).toHaveLength(8);

    const closing = coordinator.close();
    expect(notifications).toHaveLength(9);
    expect(notifications.at(-1)).toMatch(/^closing\|/);
    await closing;
    expect(notifications).toHaveLength(10);
    await coordinator.close();
    expect(notifications).toHaveLength(10);
    unsubscribe();

    expect(notifications).toEqual([
      "live|g0|r0|e0|opened-run|points:1|running|candidate:false|intent:none",
      "live|g1|r1|e0|opened-run|points:1|running|candidate:false|intent:intent/observable-state",
      "live|g1|r1|e0|opened-run|points:1|running|candidate:true|intent:intent/observable-state",
      "live|g1|r1|e1|live-transition|points:1|running|candidate:true|intent:intent/observable-state",
      "live|g1|r1|e1|live-transition|points:2|running|candidate:true|intent:intent/observable-state",
      "live|g1|r1|e1|live-transition|points:2|suspended|candidate:true|intent:intent/observable-state",
      "live|g1|r1|e1|live-transition|points:2|running|candidate:true|intent:intent/observable-state",
      "live|g1|r2|e2|promoted-steady-candidate|points:1|running|candidate:false|intent:intent/observable-state",
      "closing|g1|r2|e2|promoted-steady-candidate|points:1|running|candidate:false|intent:intent/observable-state",
      "closed|g1|r2|e2|promoted-steady-candidate|points:1|running|candidate:false|intent:intent/observable-state",
    ]);
  });

  it("publishes only coordinator-validated presentation resets and appends", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    const events: RuntimePresentationEventV1[] = [];
    const coherentAtDelivery: boolean[] = [];
    const unsubscribe = coordinator.subscribePresentation((event) => {
      events.push(event);
      const snapshot = coordinator.getSnapshot();
      const branch = snapshot?.branches.find(({ scenarioId }) =>
        scenarioId === event.scenarioId
      );
      const latestSequence = event.kind === "reset"
        ? event.frame.point.sequence
        : event.points.at(-1)?.sequence;
      coherentAtDelivery.push(
        snapshot?.sessionId === event.sessionId
        && branch?.liveBranchId === event.liveBranchId
        && branch.targetGeneration === event.targetGeneration
        && branch.presentationRevision === event.presentationRevision
        && branch.streamEpoch === event.streamEpoch
        && branch.display.latestPoint.sequence === latestSequence,
      );
    });

    await coordinator.open(openCommandV1());
    expect(events).toHaveLength(2);

    coordinator.applyControlIntent({
      intentId: "intent/presentation-events",
      targets: [targetV1("baseline", "3", 1.25)],
    });
    expect(events).toHaveLength(2);

    runtime.resolveStrict("intent/presentation-events");
    await flushV1();
    expect(events).toHaveLength(2);

    runtime.resolveLive("intent/presentation-events");
    await flushV1();
    expect(events).toHaveLength(3);

    const firstSequence =
      coordinator.branch("baseline").display.latestPoint.sequence + 1;
    runtime.emitSignal("baseline", {
      kind: "samples",
      targetGeneration: 0,
      presentationRevision: 1,
      streamEpoch: 1,
      points: [frameV1(firstSequence).point],
      windowMetrics: {
        status: "collecting",
        collectedPointCount: 2,
        completedCycleCount: 0,
      },
    });
    expect(events).toHaveLength(3);

    runtime.emitSignal("baseline", {
      kind: "samples",
      targetGeneration: 1,
      presentationRevision: 1,
      streamEpoch: 1,
      points: [
        frameV1(firstSequence).point,
        frameV1(firstSequence + 1).point,
      ],
      windowMetrics: {
        status: "collecting",
        collectedPointCount: 3,
        completedCycleCount: 0,
      },
    });
    expect(events).toHaveLength(4);

    runtime.emitRawSignal("baseline", {
      kind: "samples",
      targetGeneration: 1,
      presentationRevision: 1,
      streamEpoch: 1,
      points: [],
      windowMetrics: {
        status: "collecting",
        collectedPointCount: 3,
        completedCycleCount: 0,
      },
      livePacing: INITIAL_RUNTIME_LIVE_PACING_STATE_V1,
    });
    expect(events).toHaveLength(4);
    expect(coordinator.branch("baseline").livePlayback).toBe("suspended");

    await coordinator.promoteSteadyCandidate("baseline");
    expect(events).toHaveLength(5);
    unsubscribe();

    expect(events.map((event) => {
      const eventPointCount = event.kind === "reset"
        ? event.frame.windowMetrics.collectedPointCount
        : event.points.length;
      const totalPointCount = event.kind === "reset"
        ? event.frame.windowMetrics.collectedPointCount
        : event.windowMetrics.collectedPointCount;
      return [
        event.kind,
        event.scenarioId,
        `g${event.targetGeneration}`,
        `r${event.presentationRevision}`,
        `e${event.streamEpoch}`,
        event.kind === "reset" ? event.origin.kind : "same-trace",
        `event:${eventPointCount}`,
        `total:${totalPointCount}`,
      ].join("|");
    })).toEqual([
      "reset|baseline|g0|r0|e0|opened-run|event:1|total:1",
      "reset|hfrEF|g0|r0|e0|opened-run|event:1|total:1",
      "reset|baseline|g1|r1|e1|live-transition|event:1|total:1",
      "append|baseline|g1|r1|e1|same-trace|event:2|total:3",
      "reset|baseline|g1|r2|e2|promoted-steady-candidate|event:1|total:1",
    ]);
    expect(coherentAtDelivery).toEqual([true, true, true, true, true]);
    for (const event of events) {
      expect(Object.isFrozen(event)).toBe(true);
      if (event.kind === "reset") {
        expect(Object.isFrozen(event.frame)).toBe(true);
      } else {
        expect(Object.isFrozen(event.points)).toBe(true);
      }
    }
  });

  it("isolates throwing state and presentation listeners from later delivery and numerical progression", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    let throwingStateCallCount = 0;
    let throwingPresentationCallCount = 0;
    const stateDeliveries: string[] = [];
    const presentationDeliveries: string[] = [];
    const unsubscribeThrowingState = coordinator.subscribe(() => {
      throwingStateCallCount += 1;
      throw new Error("synthetic state listener failure");
    });
    const unsubscribeState = coordinator.subscribe(() => {
      const snapshot = coordinator.getSnapshot();
      const branch = snapshot?.branches.find(({ scenarioId }) =>
        scenarioId === "baseline"
      );
      if (snapshot === null || branch === undefined) return;
      stateDeliveries.push([
        snapshot.status,
        `g${branch.targetGeneration}`,
        `points:${branch.display.pointCount}`,
        `candidate:${branch.latestSteadyCandidate !== null}`,
      ].join("|"));
    });
    const unsubscribeThrowingPresentation =
      coordinator.subscribePresentation(() => {
        throwingPresentationCallCount += 1;
        throw new Error("synthetic presentation listener failure");
      });
    const unsubscribePresentation = coordinator.subscribePresentation(
      (event) => {
        presentationDeliveries.push([
          event.kind,
          event.scenarioId,
          `g${event.targetGeneration}`,
        ].join("|"));
      },
    );

    await expect(coordinator.open(openCommandV1())).resolves.toMatchObject({
      status: "live",
    });
    expect(stateDeliveries).toEqual([
      "live|g0|points:1|candidate:false",
    ]);
    expect(presentationDeliveries).toEqual([
      "reset|baseline|g0",
      "reset|hfrEF|g0",
    ]);

    coordinator.applyControlIntent({
      intentId: "intent/listener-isolation",
      targets: [targetV1("baseline", "3", 1.25)],
    });
    expect(runtime.submissions).toHaveLength(1);
    runtime.resolveLive("intent/listener-isolation");
    await flushV1();

    const firstSequence =
      coordinator.branch("baseline").display.latestPoint.sequence + 1;
    expect(() =>
      runtime.emitSignal("baseline", {
        kind: "samples",
        targetGeneration: 1,
        presentationRevision: 1,
        streamEpoch: 1,
        points: [frameV1(firstSequence).point],
        windowMetrics: {
          status: "collecting",
          collectedPointCount: 2,
          completedCycleCount: 0,
        },
      })
    ).not.toThrow();
    runtime.resolveStrict("intent/listener-isolation");
    await flushV1();

    expect(coordinator.branch("baseline")).toMatchObject({
      targetGeneration: 1,
      display: {
        pointCount: 2,
        latestPoint: { sequence: firstSequence },
      },
      latestSteadyCandidate: {
        targetGeneration: 1,
      },
    });
    expect(stateDeliveries).toEqual([
      "live|g0|points:1|candidate:false",
      "live|g1|points:1|candidate:false",
      "live|g1|points:1|candidate:false",
      "live|g1|points:2|candidate:false",
      "live|g1|points:2|candidate:true",
    ]);
    expect(presentationDeliveries).toEqual([
      "reset|baseline|g0",
      "reset|hfrEF|g0",
      "reset|baseline|g1",
      "append|baseline|g1",
    ]);
    expect(throwingStateCallCount).toBe(stateDeliveries.length);
    expect(throwingPresentationCallCount).toBe(
      presentationDeliveries.length,
    );

    unsubscribeThrowingState();
    unsubscribeState();
    unsubscribeThrowingPresentation();
    unsubscribePresentation();
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
        pointCount: 1,
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
    expect(coordinator.branch("baseline").latestSteadyCandidate).toBeNull();
    await expect(coordinator.promoteSteadyCandidate("baseline"))
      .rejects.toThrow(/no steady candidate exists/);
    expect(runtime.promotions).toHaveLength(1);
    expect(coordinator.branch("hfrEF").display.pointCount).toBe(1);
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

  it("treats branch supersession as an expected terminal result", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    await coordinator.open(openCommandV1());
    coordinator.applyControlIntent({
      intentId: "intent/both-before-supersede",
      targets: [
        targetV1("baseline", "3", 1.25),
        targetV1("hfrEF", "4", 1.25),
      ],
    });
    coordinator.applyControlIntent({
      intentId: "intent/baseline-superseding",
      targets: [targetV1("baseline", "5", 1.5)],
    });

    runtime.resolveStrict(
      "intent/both-before-supersede",
      undefined,
      "baseline",
    );
    await flushV1();

    expect(coordinator.branch("baseline")).toMatchObject({
      targetGeneration: 2,
      latestSteadyCandidate: null,
      lastRuntimeFailure: null,
    });
    expect(coordinator.branch("hfrEF")).toMatchObject({
      targetGeneration: 1,
      latestSteadyCandidate: {
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
      latestSteadyCandidate: {
        candidateId: "candidate/baseline/1",
      },
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

  it.each(["modelRef", "runtimeRef"] as const)(
    "rejects a strict candidate whose %s escapes the opened execution lineage",
    async (executionField) => {
      const runtime = new FakeRuntimePortV1();
      runtime.strictExecutionOverride = Object.freeze({
        ...EXECUTION_V1,
        [executionField]: `forged/${executionField}@1.0.0`,
      });
      const coordinator = coordinatorV1(runtime);
      await coordinator.open(openCommandV1());
      const intentId = `intent/mismatched-${executionField}`;
      coordinator.applyControlIntent({
        intentId,
        targets: [targetV1("baseline", "3", 1.25)],
      });

      runtime.resolveStrict(intentId);
      await flushV1();

      expect(coordinator.branch("baseline")).toMatchObject({
        latestSteadyCandidate: null,
        lastRuntimeFailure: {
          lane: "strict",
          message: expect.stringMatching(/candidate lineage mismatch/),
        },
      });
      await expect(coordinator.promoteSteadyCandidate("baseline"))
        .rejects.toThrow(/no steady candidate exists/);
      expect(runtime.promotions).toEqual([]);
    },
  );

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

  it("rejects a concurrent open before the first runtime open resolves", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    const gate = runtime.delayNextOpen();
    const opening = coordinator.open(openCommandV1());

    await expect(coordinator.open({
      ...openCommandV1(),
      sessionId: "session/concurrent-open",
    })).rejects.toThrow(/already open or opening/);

    gate.resolve(undefined);
    await expect(opening).resolves.toMatchObject({
      status: "live",
      sessionId: "session/studio-v1",
    });
    expect(runtime.openedSessionIds).toEqual(["session/studio-v1"]);
  });

  it("closes a runtime allocation when close races an in-flight open", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    const gate = runtime.delayNextOpen();
    const opening = coordinator.open(openCommandV1());
    const openingResult = expect(opening).rejects.toThrow(/aborted by close/);
    const closing = coordinator.close();

    gate.resolve(undefined);
    await Promise.all([openingResult, closing]);
    expect(runtime.closedSessionIds).toEqual(["session/studio-v1"]);
    expect(() => coordinator.current).toThrow(/has not been opened/);
  });

  it("closes runtime allocation when its open receipt escapes source binding", async () => {
    const runtime = new FakeRuntimePortV1();
    runtime.openedBindingMismatch = true;
    const coordinator = coordinatorV1(runtime);

    await expect(coordinator.open(openCommandV1()))
      .rejects.toThrow(/source binding mismatch/);
    expect(runtime.closedSessionIds).toEqual(["session/studio-v1"]);
    expect(() => coordinator.current).toThrow(/has not been opened/);
  });

  it("blocks new intents while close is in flight and deduplicates close", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    await coordinator.open(openCommandV1());
    const gate = runtime.delayNextClose();

    const firstClose = coordinator.close();
    const secondClose = coordinator.close();
    expect(coordinator.current.status).toBe("closing");
    expect(() => coordinator.applyControlIntent({
      intentId: "intent/during-close",
      targets: [targetV1("baseline", "3", 1.25)],
    })).toThrow(/not live/);
    expect(runtime.closedSessionIds).toEqual(["session/studio-v1"]);

    gate.resolve(undefined);
    await Promise.all([firstClose, secondClose]);
    expect(coordinator.current.status).toBe("closed");
    expect(runtime.closedSessionIds).toEqual(["session/studio-v1"]);
  });

  it("returns to live when runtime close fails", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    await coordinator.open(openCommandV1());
    runtime.rejectNextClose(new Error("transport close failed"));

    await expect(coordinator.close()).rejects.toThrow(/transport close failed/);
    expect(coordinator.current.status).toBe("live");
    expect(coordinator.applyControlIntent({
      intentId: "intent/after-close-retry",
      targets: [targetV1("baseline", "3", 1.25)],
    })).toMatchObject({ intentId: "intent/after-close-retry" });
  });

  it("keeps a force-close terminal when runtime close fails", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    await coordinator.open(openCommandV1());
    runtime.rejectNextClose(new Error("transport close failed"));

    await expect(coordinator.close({ force: true }))
      .rejects.toThrow(/transport close failed/);
    expect(coordinator.current.status).toBe("closed");
    expect(() => coordinator.applyControlIntent({
      intentId: "intent/after-failed-force-close",
      targets: [targetV1("baseline", "3", 1.25)],
    })).toThrow(/not live/);
  });

  it("accepts immediate samples only after each signal epoch is installed", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    runtime.queueImmediateSignalOnResume("baseline", {
      kind: "samples",
      targetGeneration: 0,
      presentationRevision: 0,
      streamEpoch: 0,
      points: [frameV1(2).point],
      windowMetrics: {
        status: "collecting",
        collectedPointCount: 2,
        completedCycleCount: 0,
      },
    });

    await coordinator.open(openCommandV1());
    expect(coordinator.branch("baseline").display).toMatchObject({
      pointCount: 2,
      latestPoint: { sequence: 2 },
    });

    coordinator.applyControlIntent({
      intentId: "intent/immediate-activation",
      targets: [targetV1("baseline", "3", 1.25)],
    });
    runtime.queueImmediateSignalOnResume("baseline", {
      kind: "samples",
      targetGeneration: 1,
      presentationRevision: 1,
      streamEpoch: 1,
      points: [frameV1(102).point],
      windowMetrics: {
        status: "collecting",
        collectedPointCount: 2,
        completedCycleCount: 0,
      },
    });
    runtime.resolveLive("intent/immediate-activation");
    runtime.resolveStrict("intent/immediate-activation");
    await flushV1();
    expect(coordinator.branch("baseline").display).toMatchObject({
      origin: { kind: "live-transition" },
      pointCount: 2,
      latestPoint: { sequence: 102 },
    });

    runtime.queueImmediateSignalOnResume("baseline", {
      kind: "samples",
      targetGeneration: 1,
      presentationRevision: 2,
      streamEpoch: 2,
      points: [frameV1(1_002).point],
      windowMetrics: {
        status: "collecting",
        collectedPointCount: 2,
        completedCycleCount: 0,
      },
    });
    await coordinator.promoteSteadyCandidate("baseline");
    expect(coordinator.branch("baseline").display).toMatchObject({
      origin: { kind: "promoted-steady-candidate" },
      pointCount: 2,
      latestPoint: { sequence: 1_002 },
    });
    expect(runtime.resumedSignalEpochs.filter(({ scenarioId }) =>
      scenarioId === "baseline"
    ).map(({ streamEpoch }) => streamEpoch)).toEqual([0, 1, 2]);
  });

  it("ignores stale signal failures and fails closed on a current failure", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    await coordinator.open(openCommandV1());

    runtime.emitSignalFailure("baseline", {
      targetGeneration: 99,
      presentationRevision: 0,
      streamEpoch: 0,
      message: "stale loop failed",
    });
    expect(coordinator.branch("baseline").livePlayback).toBe("running");

    runtime.emitSignalFailure("baseline", {
      targetGeneration: 0,
      presentationRevision: 0,
      streamEpoch: 0,
      message: "continuous live loop failed",
    });
    expect(coordinator.branch("baseline")).toMatchObject({
      livePlayback: "suspended",
      lastRuntimeFailure: {
        lane: "live",
        targetGeneration: 0,
        message: "continuous live loop failed",
      },
    });
  });

  it("fails closed on malformed current samples and regressing metrics", async () => {
    const malformedRuntime = new FakeRuntimePortV1();
    const malformedCoordinator = coordinatorV1(malformedRuntime);
    await malformedCoordinator.open(openCommandV1());
    malformedRuntime.emitRawSignal("baseline", {
      targetGeneration: 0,
      presentationRevision: 0,
      streamEpoch: 0,
      points: [frameV1(2).point],
      windowMetrics: {
        status: "collecting",
        collectedPointCount: 2,
        completedCycleCount: 0,
      },
    });
    expect(malformedCoordinator.branch("baseline")).toMatchObject({
      livePlayback: "suspended",
      lastRuntimeFailure: {
        message: "runtime signal channel emitted an invalid batch",
      },
    });

    // Pacing is part of the batch contract, so a batch that omits it or
    // reports an impossible value is rejected like any other malformed batch.
    for (const livePacing of [
      undefined,
      { mode: "sprinting", epochLagMs: 0, recentAchievedRate: null, cumulativeRebasedDeficitMs: 0 },
      { mode: "degraded", epochLagMs: -1, recentAchievedRate: null, cumulativeRebasedDeficitMs: 0 },
      { mode: "degraded", epochLagMs: 0, recentAchievedRate: Number.NaN, cumulativeRebasedDeficitMs: 0 },
      { mode: "realtime-1x", epochLagMs: 0, recentAchievedRate: null, cumulativeRebasedDeficitMs: -5 },
    ]) {
      const pacingRuntime = new FakeRuntimePortV1();
      const pacingCoordinator = coordinatorV1(pacingRuntime);
      await pacingCoordinator.open(openCommandV1());
      pacingRuntime.emitRawSignal("baseline", {
        kind: "samples",
        targetGeneration: 0,
        presentationRevision: 0,
        streamEpoch: 0,
        points: [frameV1(2).point],
        windowMetrics: {
          status: "collecting",
          collectedPointCount: 2,
          completedCycleCount: 0,
        },
        ...(livePacing === undefined ? {} : { livePacing }),
      });
      expect(pacingCoordinator.branch("baseline")).toMatchObject({
        livePlayback: "suspended",
        lastRuntimeFailure: {
          message: "runtime signal channel emitted an invalid batch",
        },
      });
    }

    const metricRuntime = new FakeRuntimePortV1();
    const metricCoordinator = coordinatorV1(metricRuntime);
    await metricCoordinator.open(openCommandV1());
    metricRuntime.emitSignal("baseline", {
      kind: "samples",
      targetGeneration: 0,
      presentationRevision: 0,
      streamEpoch: 0,
      points: [frameV1(2).point],
      windowMetrics: {
        status: "complete",
        collectedPointCount: 2,
        completedCycleCount: 2,
        values: { "metric.stroke-volume": 70 },
      },
    });
    metricRuntime.emitSignal("baseline", {
      kind: "samples",
      targetGeneration: 0,
      presentationRevision: 0,
      streamEpoch: 0,
      points: [frameV1(3).point],
      windowMetrics: {
        status: "complete",
        collectedPointCount: 3,
        completedCycleCount: 1,
        values: { "metric.stroke-volume": 70 },
      },
    });
    expect(metricCoordinator.branch("baseline").livePlayback)
      .toBe("suspended");

    metricRuntime.emitSignal("hfrEF", {
      kind: "samples",
      targetGeneration: 0,
      presentationRevision: 0,
      streamEpoch: 0,
      points: [frameV1(1).point],
      windowMetrics: {
        status: "complete",
        collectedPointCount: 2,
        completedCycleCount: 1,
        values: { "metric.stroke-volume": 70 },
      },
    });
    metricRuntime.emitSignal("hfrEF", {
      kind: "samples",
      targetGeneration: 0,
      presentationRevision: 0,
      streamEpoch: 0,
      points: [frameV1(2).point],
      windowMetrics: {
        status: "collecting",
        collectedPointCount: 3,
        completedCycleCount: 0,
      },
    });
    expect(metricCoordinator.branch("hfrEF").livePlayback)
      .toBe("suspended");
  });

  it("rolls back a rejected resume and suspends a live lane failure", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    await coordinator.open(openCommandV1());
    await coordinator.suspendBranch("baseline");
    runtime.rejectNextResume("baseline", new Error("resume transport failed"));

    await expect(coordinator.resumeBranch("baseline"))
      .rejects.toThrow(/resume transport failed/);
    expect(coordinator.branch("baseline")).toMatchObject({
      livePlayback: "suspended",
      lastRuntimeFailure: {
        lane: "live",
        message: "runtime signal channel resume failed: resume transport failed",
      },
    });

    coordinator.applyControlIntent({
      intentId: "intent/live-failure",
      targets: [targetV1("hfrEF", "3", 1.25)],
    });
    runtime.resolveLive("intent/live-failure", "hfrEF");
    await flushV1();
    expect(coordinator.branch("hfrEF")).toMatchObject({
      livePlayback: "suspended",
      lastRuntimeFailure: {
        lane: "live",
        intentId: "intent/live-failure",
        message: "live solver failed for hfrEF",
      },
    });
  });

  it("records live-transition and promotion epoch activation failures", async () => {
    const liveRuntime = new FakeRuntimePortV1();
    const liveCoordinator = coordinatorV1(liveRuntime);
    await liveCoordinator.open(openCommandV1());
    liveCoordinator.applyControlIntent({
      intentId: "intent/rejected-live-activation",
      targets: [targetV1("baseline", "3", 1.25)],
    });
    liveRuntime.rejectNextResume(
      "baseline",
      new Error("new live epoch rejected"),
    );
    liveRuntime.resolveLive("intent/rejected-live-activation");
    await flushV1();
    expect(liveCoordinator.branch("baseline")).toMatchObject({
      streamEpoch: 1,
      livePlayback: "suspended",
      display: { origin: { kind: "live-transition" } },
      lastRuntimeFailure: {
        message:
          "live transition signal epoch activation failed: new live epoch rejected",
      },
    });

    const promotionRuntime = new FakeRuntimePortV1();
    const promotionCoordinator = coordinatorV1(promotionRuntime);
    await promotionCoordinator.open(openCommandV1());
    promotionCoordinator.applyControlIntent({
      intentId: "intent/rejected-promotion-activation",
      targets: [targetV1("baseline", "3", 1.25)],
    });
    promotionRuntime.resolveStrict("intent/rejected-promotion-activation");
    await flushV1();
    promotionRuntime.rejectNextResume(
      "baseline",
      new Error("promoted epoch rejected"),
    );
    await promotionCoordinator.promoteSteadyCandidate("baseline");
    await flushV1();
    expect(promotionCoordinator.branch("baseline")).toMatchObject({
      streamEpoch: 2,
      livePlayback: "suspended",
      display: { origin: { kind: "promoted-steady-candidate" } },
      lastRuntimeFailure: {
        message:
          "promoted signal epoch activation failed: promoted epoch rejected",
      },
    });
  });

  it("fences a delayed automatic resume before manual suspension completes", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    await coordinator.open(openCommandV1());
    coordinator.applyControlIntent({
      intentId: "intent/delayed-resume-before-suspend",
      targets: [targetV1("baseline", "3", 1.25)],
    });
    const resumeGate = runtime.delayNextResume("baseline");
    runtime.resolveLive("intent/delayed-resume-before-suspend");
    await flushV1();

    const suspending = coordinator.suspendBranch("baseline");
    expect(coordinator.branch("baseline").livePlayback).toBe("suspended");
    resumeGate.resolve(undefined);
    await suspending;

    expect(runtime.isSignalChannelSuspended("baseline")).toBe(true);
    const activated = runtime.signalLifecycle.lastIndexOf(
      "resume:active:baseline:1",
    );
    const suspended = runtime.signalLifecycle.lastIndexOf("suspend:baseline");
    expect(activated).toBeGreaterThan(-1);
    expect(suspended).toBeGreaterThan(activated);
  });

  it("serializes a newer target epoch behind delayed stale activation cleanup", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    await coordinator.open(openCommandV1());
    coordinator.applyControlIntent({
      intentId: "intent/delayed-generation-one",
      targets: [targetV1("baseline", "3", 1.25)],
    });
    const resumeGate = runtime.delayNextResume("baseline");
    runtime.resolveLive("intent/delayed-generation-one");
    await flushV1();

    coordinator.applyControlIntent({
      intentId: "intent/generation-two-during-resume",
      targets: [targetV1("baseline", "4", 1.5)],
    });
    runtime.resolveLive("intent/generation-two-during-resume");
    await flushV1();
    expect(runtime.resumedSignalEpochs.filter(({ scenarioId }) =>
      scenarioId === "baseline"
    ).map(({ streamEpoch }) => streamEpoch)).toEqual([0, 1]);

    resumeGate.resolve(undefined);
    for (let index = 0; index < 4; index += 1) await flushV1();

    expect(runtime.resumedSignalEpochs.filter(({ scenarioId }) =>
      scenarioId === "baseline"
    ).map(({ streamEpoch }) => streamEpoch)).toEqual([0, 1, 2]);
    expect(runtime.isSignalChannelSuspended("baseline")).toBe(false);
    const staleActive = runtime.signalLifecycle.lastIndexOf(
      "resume:active:baseline:1",
    );
    const fence = runtime.signalLifecycle.findIndex(
      (event, index) => index > staleActive && event === "suspend:baseline",
    );
    const currentStart = runtime.signalLifecycle.lastIndexOf(
      "resume:start:baseline:2",
    );
    expect(staleActive).toBeGreaterThan(-1);
    expect(fence).toBeGreaterThan(staleActive);
    expect(currentStart).toBeGreaterThan(fence);
  });

  it("waits for delayed automatic activation cleanup before runtime close", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    await coordinator.open(openCommandV1());
    coordinator.applyControlIntent({
      intentId: "intent/delayed-resume-before-close",
      targets: [targetV1("baseline", "3", 1.25)],
    });
    const resumeGate = runtime.delayNextResume("baseline");
    runtime.resolveLive("intent/delayed-resume-before-close");
    await flushV1();

    const closing = coordinator.close();
    expect(coordinator.current.status).toBe("closing");
    expect(runtime.closedSessionIds).toEqual([]);
    resumeGate.resolve(undefined);
    await closing;

    expect(coordinator.current.status).toBe("closed");
    const activated = runtime.signalLifecycle.lastIndexOf(
      "resume:active:baseline:1",
    );
    const fenced = runtime.signalLifecycle.findIndex(
      (event, index) => index > activated && event === "suspend:baseline",
    );
    const closed = runtime.signalLifecycle.lastIndexOf(
      "close:session/studio-v1",
    );
    expect(activated).toBeGreaterThan(-1);
    expect(fenced).toBeGreaterThan(activated);
    expect(closed).toBeGreaterThan(fenced);
  });

  it("force-closes the runtime without waiting for a delayed signal activation", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    await coordinator.open(openCommandV1());
    coordinator.applyControlIntent({
      intentId: "intent/force-close-during-resume",
      targets: [targetV1("baseline", "3", 1.25)],
    });
    const resumeGate = runtime.delayNextResume("baseline");
    runtime.resolveLive("intent/force-close-during-resume");
    await flushV1();

    await coordinator.close({ force: true });

    expect(runtime.closedSessionIds).toEqual(["session/studio-v1"]);
    expect(coordinator.current.status).toBe("closed");
    expect(runtime.signalLifecycle).toContain("resume:start:baseline:1");
    expect(runtime.signalLifecycle).not.toContain("resume:active:baseline:1");

    // Let the fenced adapter operation settle so this test does not leave a
    // deliberately blocked promise behind.
    resumeGate.resolve(undefined);
    await flushV1();
    expect(coordinator.current.status).toBe("closed");
  });

  it("appends monotonic signal batches and suspends without advancing", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    await coordinator.open(openCommandV1());
    const before = coordinator.branch("baseline");
    const nextSequence = before.display.latestPoint.sequence + 1;

    runtime.emitSignal("baseline", {
      kind: "samples",
      targetGeneration: 0,
      presentationRevision: 0,
      streamEpoch: 0,
      points: [
        frameV1(nextSequence).point,
        frameV1(nextSequence + 1).point,
      ],
      windowMetrics: {
        status: "collecting",
        collectedPointCount: 3,
        completedCycleCount: 0,
      },
    });
    expect(coordinator.branch("baseline").display).toMatchObject({
      pointCount: 3,
      latestPoint: { sequence: nextSequence + 1 },
    });

    await coordinator.suspendBranch("baseline");
    expect(coordinator.branch("baseline").livePlayback).toBe("suspended");
    runtime.emitSignal("baseline", {
      kind: "samples",
      targetGeneration: 0,
      presentationRevision: 0,
      streamEpoch: 0,
      points: [frameV1(nextSequence + 2).point],
      windowMetrics: {
        status: "collecting",
        collectedPointCount: 4,
        completedCycleCount: 0,
      },
    });
    expect(coordinator.branch("baseline").display.latestPoint.sequence)
      .toBe(nextSequence + 1);

    await coordinator.resumeBranch("baseline");
    expect(coordinator.branch("baseline").livePlayback).toBe("running");
    expect(coordinator.branch("baseline").signalChannelRef)
      .toEqual(before.signalChannelRef);
  });

  it("accepts the final in-flight batch at a suspend boundary and resumes contiguously", async () => {
    const runtime = new FakeRuntimePortV1();
    const coordinator = coordinatorV1(runtime);
    await coordinator.open(openCommandV1());
    const before = coordinator.branch("baseline");
    const boundarySequence = before.display.latestPoint.sequence + 1;
    const suspendGate = runtime.delayNextSuspend("baseline");

    const suspending = coordinator.suspendBranch("baseline");
    expect(coordinator.branch("baseline").livePlayback).toBe("suspended");
    runtime.emitRawSignal("baseline", {
      kind: "samples",
      targetGeneration: 0,
      presentationRevision: 0,
      streamEpoch: 0,
      points: [frameV1(boundarySequence).point],
      windowMetrics: {
        status: "collecting",
        collectedPointCount: 2,
        completedCycleCount: 0,
      },
      livePacing: INITIAL_RUNTIME_LIVE_PACING_STATE_V1,
    });
    expect(coordinator.branch("baseline")).toMatchObject({
      livePlayback: "suspended",
      display: {
        pointCount: 2,
        latestPoint: { sequence: boundarySequence },
      },
      lastRuntimeFailure: null,
    });

    suspendGate.resolve(undefined);
    await suspending;
    await coordinator.resumeBranch("baseline");
    runtime.emitSignal("baseline", {
      kind: "samples",
      targetGeneration: 0,
      presentationRevision: 0,
      streamEpoch: 0,
      points: [frameV1(boundarySequence + 1).point],
      windowMetrics: {
        status: "collecting",
        collectedPointCount: 3,
        completedCycleCount: 0,
      },
    });
    expect(coordinator.branch("baseline")).toMatchObject({
      livePlayback: "running",
      display: {
        pointCount: 3,
        latestPoint: { sequence: boundarySequence + 1 },
      },
      lastRuntimeFailure: null,
    });
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
        sourceInputRef: refV1("simulation-input", "e"),
        sourceSnapshotRef: refV1("snapshot-envelope", "b"),
        initialTargetInputSha256: "1".repeat(64),
      },
      {
        scenarioId: "hfrEF",
        sourceRunRef: refV1("run-artifact", "c"),
        sourceInputRef: refV1("simulation-input", "f"),
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
    baselineInput,
    baselineSnapshot,
    hfrEfRun,
    hfrEfInput,
    hfrEfSnapshot,
  ] = await Promise.all([
    artifacts.putJson({
      kind: "run-artifact",
      mediaType: "application/json",
      content: { fixture: "baseline-source-run" },
    }),
    artifacts.putJson({
      kind: "simulation-input",
      mediaType: "application/json",
      content: { fixture: "baseline-source-input" },
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
      kind: "simulation-input",
      mediaType: "application/json",
      content: { fixture: "hfref-source-input" },
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
        sourceInputRef: baselineInput,
        sourceSnapshotRef: baselineSnapshot,
        initialTargetInputSha256: "1".repeat(64),
      },
      {
        scenarioId: "hfrEF",
        sourceRunRef: hfrEfRun,
        sourceInputRef: hfrEfInput,
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
      values: {
        "circulation.systemic-vascular-resistance-scale": value,
      },
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
  readonly openedSessionIds: string[] = [];
  readonly submissions: RuntimeTargetIntentCommandV1[] = [];
  readonly promotions: PromoteSteadyCandidateCommandV1[] = [];
  readonly closedSessionIds: string[] = [];
  readonly resumedSignalEpochs: {
    scenarioId: string;
    streamEpoch: number;
  }[] = [];
  readonly signalLifecycle: string[] = [];
  openedCollectingPointCount = 1;
  promotedCollectingPointCount = 1;
  openedBindingMismatch = false;
  strictExecutionOverride: RuntimeExecutionIdentityV1 | null = null;
  private opened: OpenSimulationSessionCommandV1 | null = null;
  private nextOpenGate: DeferredV1<void> | null = null;
  private nextCloseGate: DeferredV1<void> | null = null;
  private nextCloseError: Error | null = null;
  private nextPromotionGate: DeferredV1<void> | null = null;
  private nextPromotionError: Error | null = null;
  private readonly signalObservers = new Map<
    string,
    (event: RuntimeSignalEventV1) => void
  >();
  private readonly signalChannelsByScenario =
    new Map<string, RuntimeSignalChannelRefV1>();
  private readonly suspendedSignalChannelIds = new Set<string>();
  private readonly immediateResumeEvents =
    new Map<string, Array<Omit<
      RuntimeSignalBatchV1,
      "channelId" | "sessionId" | "scenarioId" | "liveBranchId" | "livePacing"
    > & Partial<Pick<RuntimeSignalBatchV1, "livePacing">>>>();
  private readonly nextResumeErrors = new Map<string, Error>();
  private readonly nextResumeGates = new Map<string, DeferredV1<void>>();
  private readonly nextSuspendGates = new Map<string, DeferredV1<void>>();
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
    this.openedSessionIds.push(command.sessionId);
    this.opened = command;
    const gate = this.nextOpenGate;
    this.nextOpenGate = null;
    if (gate !== null) await gate.promise;
    // Deliberately reverse adapter order; the coordinator owns stable order.
    return {
      sessionId: command.sessionId,
      branches: [...command.branches].reverse().map((branch, index) => ({
        scenarioId: branch.scenarioId,
        liveBranchId: `branch/${branch.scenarioId}`,
        sourceRunRef: this.openedBindingMismatch
          ? refV1("run-artifact", "0")
          : branch.sourceRunRef,
        sourceInputRef: branch.sourceInputRef,
        sourceSnapshotRef: branch.sourceSnapshotRef,
        initialTargetInputSha256: branch.initialTargetInputSha256,
        signalChannelRef: this.signalChannelV1(
          command.sessionId,
          branch.scenarioId,
        ),
        streamEpoch: 0,
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
      streamEpoch: command.presentationRevision,
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

  delayNextOpen(): DeferredV1<void> {
    const gate = deferredV1<void>();
    this.nextOpenGate = gate;
    return gate;
  }

  delayNextClose(): DeferredV1<void> {
    const gate = deferredV1<void>();
    this.nextCloseGate = gate;
    return gate;
  }

  rejectNextClose(error: Error): void {
    this.nextCloseError = error;
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
    this.signalLifecycle.push(`close:${sessionId}`);
    const gate = this.nextCloseGate;
    this.nextCloseGate = null;
    if (gate !== null) await gate.promise;
    const error = this.nextCloseError;
    this.nextCloseError = null;
    if (error !== null) throw error;
  }

  subscribeSignalChannel(
    channel: RuntimeSignalChannelRefV1,
    observer: (event: RuntimeSignalEventV1) => void,
  ) {
    this.signalObservers.set(channel.channelId, observer);
    return Object.freeze({
      unsubscribe: () => {
        if (this.signalObservers.get(channel.channelId) === observer) {
          this.signalObservers.delete(channel.channelId);
        }
      },
    });
  }

  async suspendSignalChannel(
    channel: RuntimeSignalChannelRefV1,
  ): Promise<void> {
    this.suspendedSignalChannelIds.add(channel.channelId);
    this.signalLifecycle.push(`suspend:${channel.scenarioId}`);
    const gate = this.nextSuspendGates.get(channel.scenarioId);
    if (gate !== undefined) {
      this.nextSuspendGates.delete(channel.scenarioId);
      await gate.promise;
    }
  }

  async resumeSignalChannel(
    channel: RuntimeSignalChannelRefV1,
    expectedStreamEpoch: number,
  ): Promise<void> {
    this.resumedSignalEpochs.push({
      scenarioId: channel.scenarioId,
      streamEpoch: expectedStreamEpoch,
    });
    this.signalLifecycle.push(
      `resume:start:${channel.scenarioId}:${expectedStreamEpoch}`,
    );
    const gate = this.nextResumeGates.get(channel.scenarioId);
    if (gate !== undefined) {
      this.nextResumeGates.delete(channel.scenarioId);
      await gate.promise;
    }
    this.suspendedSignalChannelIds.delete(channel.channelId);
    this.signalLifecycle.push(
      `resume:active:${channel.scenarioId}:${expectedStreamEpoch}`,
    );
    const queue = this.immediateResumeEvents.get(channel.scenarioId);
    const event = queue?.shift();
    if (queue?.length === 0) {
      this.immediateResumeEvents.delete(channel.scenarioId);
    }
    if (event !== undefined) {
      this.signalObservers.get(channel.channelId)?.({
        livePacing: INITIAL_RUNTIME_LIVE_PACING_STATE_V1,
        ...event,
        channelId: channel.channelId,
        sessionId: channel.sessionId,
        scenarioId: channel.scenarioId,
        liveBranchId: channel.liveBranchId,
      });
    }
    const error = this.nextResumeErrors.get(channel.scenarioId);
    if (error !== undefined) {
      this.nextResumeErrors.delete(channel.scenarioId);
      throw error;
    }
  }

  emitSignal(
    scenarioId: string,
    input: Omit<
      RuntimeSignalBatchV1,
      "channelId" | "sessionId" | "scenarioId" | "liveBranchId" | "livePacing"
    > & Partial<Pick<RuntimeSignalBatchV1, "livePacing">>,
  ): void {
    const channel = this.signalChannelsByScenario.get(scenarioId);
    if (
      channel === undefined
      || this.suspendedSignalChannelIds.has(channel.channelId)
    ) return;
    this.signalObservers.get(channel.channelId)?.({
      livePacing: INITIAL_RUNTIME_LIVE_PACING_STATE_V1,
      ...input,
      channelId: channel.channelId,
      sessionId: channel.sessionId,
      scenarioId: channel.scenarioId,
      liveBranchId: channel.liveBranchId,
    });
  }

  queueImmediateSignalOnResume(
    scenarioId: string,
    input: Omit<
      RuntimeSignalBatchV1,
      "channelId" | "sessionId" | "scenarioId" | "liveBranchId" | "livePacing"
    > & Partial<Pick<RuntimeSignalBatchV1, "livePacing">>,
  ): void {
    const queue = this.immediateResumeEvents.get(scenarioId) ?? [];
    queue.push(input);
    this.immediateResumeEvents.set(scenarioId, queue);
  }

  rejectNextResume(scenarioId: string, error: Error): void {
    this.nextResumeErrors.set(scenarioId, error);
  }

  delayNextResume(scenarioId: string): DeferredV1<void> {
    const gate = deferredV1<void>();
    this.nextResumeGates.set(scenarioId, gate);
    return gate;
  }

  delayNextSuspend(scenarioId: string): DeferredV1<void> {
    const gate = deferredV1<void>();
    this.nextSuspendGates.set(scenarioId, gate);
    return gate;
  }

  isSignalChannelSuspended(scenarioId: string): boolean {
    const channel = this.signalChannelsByScenario.get(scenarioId);
    if (channel === undefined) throw new Error(`unknown scenario ${scenarioId}`);
    return this.suspendedSignalChannelIds.has(channel.channelId);
  }

  emitSignalFailure(
    scenarioId: string,
    input: Omit<
      Extract<RuntimeSignalEventV1, { kind: "failure" }>,
      "kind" | "channelId" | "sessionId" | "scenarioId" | "liveBranchId"
    >,
  ): void {
    const channel = this.signalChannelsByScenario.get(scenarioId);
    if (channel === undefined) throw new Error(`unknown scenario ${scenarioId}`);
    this.signalObservers.get(channel.channelId)?.({
      kind: "failure",
      ...input,
      channelId: channel.channelId,
      sessionId: channel.sessionId,
      scenarioId: channel.scenarioId,
      liveBranchId: channel.liveBranchId,
    });
  }

  emitRawSignal(
    scenarioId: string,
    input: Readonly<Record<string, unknown>>,
  ): void {
    const channel = this.signalChannelsByScenario.get(scenarioId);
    if (channel === undefined) throw new Error(`unknown scenario ${scenarioId}`);
    this.signalObservers.get(channel.channelId)?.({
      channelId: channel.channelId,
      sessionId: channel.sessionId,
      scenarioId: channel.scenarioId,
      liveBranchId: channel.liveBranchId,
      ...input,
    } as RuntimeSignalEventV1);
  }

  resolveLive(intentId: string, failedScenarioId?: string): void {
    const execution = this.requiredExecutionV1(intentId);
    execution.live.resolve({
      sessionId: execution.command.sessionId,
      intentId,
      branches: execution.command.targets.map((target) =>
        target.scenarioId === failedScenarioId
          ? {
            status: "failure" as const,
            scenarioId: target.scenarioId,
            targetGeneration: target.targetGeneration,
            targetInputSha256: target.patch.targetInputSha256,
            message: `live solver failed for ${target.scenarioId}`,
          }
          : {
            status: "success" as const,
            scenarioId: target.scenarioId,
            targetGeneration: target.targetGeneration,
            result: {
              scenarioId: target.scenarioId,
              targetGeneration: target.targetGeneration,
              presentationRevision: target.presentationRevision,
              targetInputSha256: target.patch.targetInputSha256,
              streamEpoch: target.presentationRevision,
              frame: frameV1(100 + target.targetGeneration),
            },
          }
      ),
    });
  }

  resolveStrict(
    intentId: string,
    failedScenarioId?: string,
    supersededScenarioId?: string,
  ): void {
    const execution = this.requiredExecutionV1(intentId);
    const opened = this.opened;
    if (opened === null) throw new Error("fake runtime was not opened");
    execution.strict.resolve({
      sessionId: execution.command.sessionId,
      intentId,
      branches: execution.command.targets.map((target, index) =>
        target.scenarioId === supersededScenarioId
          ? {
            status: "superseded" as const,
            scenarioId: target.scenarioId,
            targetGeneration: target.targetGeneration,
            targetInputSha256: target.patch.targetInputSha256,
            reason: `strict generation superseded for ${target.scenarioId}`,
          }
          : target.scenarioId === failedScenarioId
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
              simulationInputRef: opened.branches.find(({ scenarioId }) =>
                scenarioId === target.scenarioId
              )!.sourceInputRef,
              targetInputSha256: target.patch.targetInputSha256,
              snapshotRef: this.strictSnapshotRefs.get(
                strictSnapshotKeyV1(intentId, target.scenarioId),
              ) ?? refV1(
                "snapshot-envelope",
                ["6", "7", "8", "9"][
                  index + target.targetGeneration - 1
                ] ?? "e",
              ),
              execution: this.strictExecutionOverride ?? EXECUTION_V1,
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

  private signalChannelV1(
    sessionId: string,
    scenarioId: string,
  ): RuntimeSignalChannelRefV1 {
    const channel = Object.freeze({
      protocolId: "circleheart-studio-runtime-signal-channel-v1" as const,
      channelId: `channel/${scenarioId}`,
      sessionId,
      scenarioId,
      liveBranchId: `branch/${scenarioId}`,
    });
    this.signalChannelsByScenario.set(scenarioId, channel);
    return channel;
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
