import { describe, expect, it } from "vitest";

import {
  ScientificProductStudioScenarioControllerV1,
} from "@/components/scientificProduct/ScientificProductStudioScenarioControllerV1";
import type {
  ScientificProductStudioBootstrapResultV1,
} from "@/components/scientificProduct/ScientificProductStudioBootstrapV1";
import {
  projectRuntimeObservablePointToMainWireScientificObservableFrameV1,
} from "@/components/scientificProduct/ScientificProductStudioObservableFrameProjectionV1";
import {
  createMainWireScientificResearchControlBaselineTargetStateV0,
} from "@/engine/scientific/controls";
import {
  SimulationSessionCoordinatorV1,
} from "@/studio/application/runtime/SimulationSessionCoordinatorV1";
import {
  InMemoryContentAddressedArtifactStoreV1,
} from "@/studio/infrastructure/artifacts/InMemoryContentAddressedArtifactStoreV1";
import type {
  OpenSimulationSessionCommandV1,
  PromoteSteadyCandidateCommandV1,
  RuntimeCandidatePromotedV1,
  RuntimeExecutionIdentityV1,
  RuntimeLiveIntentResultV1,
  RuntimePresentationFrameV1,
  RuntimeSessionOpenedV1,
  RuntimeSignalChannelRefV1,
  RuntimeSignalEventV1,
  RuntimeStrictIntentResultV1,
  RuntimeTargetIntentCommandV1,
  RuntimeTargetIntentExecutionV1,
  SimulationRuntimePortV1,
} from "@/studio/contracts/v1";

describe("Scientific Product Studio scenario controller V1", () => {
  it("holds a deferred Workbench presentation at one settled point until resume", async () => {
    const { controller, coordinator, runtime } =
      await controllerFixtureV1(4, true);
    const initial = controller.controlStore.getSnapshot();

    expect(initial).toMatchObject({
      phase: "live-paused",
      frames: [expect.any(Object)],
      parameterGenerationHistory: [],
      liveTransitionOriginAcceptedTimeSec: null,
      provenance: {
        displayedEvidence: "settled-snapshot-one-point",
      },
    });
    expect(coordinator.branch("scenario/controller").livePlayback).toBe(
      "suspended",
    );
    expect(runtime.signalLifecycle).toEqual([]);

    controller.controlStore.actions.resumeLive();
    await waitForV1(() =>
      coordinator.branch("scenario/controller").livePlayback === "running"
    );
    expect(runtime.signalLifecycle).toEqual([
      "resume:start:scenario/controller:0",
      "resume:complete:scenario/controller:0",
    ]);

    runtime.emitSignal(101, 2);
    await waitForV1(() =>
      controller.controlStore.getSnapshot().frames.length === 2
    );
    expect(controller.controlStore.getSnapshot()).toMatchObject({
      liveTransitionOriginAcceptedTimeSec:
        initial.frames[0]!.acceptedTimeSec,
      provenance: {
        displayedEvidence: "open-transient-no-periodic-claim",
      },
    });
    await controller.dispose();
  });

  it("changes a settled one-point seed to an open transient on the first live append", async () => {
    const { controller, runtime } = await controllerFixtureV1(4);
    const initial = controller.controlStore.getSnapshot();
    expect(initial.frames).toHaveLength(1);
    expect(initial.provenance.displayedEvidence).toBe(
      "settled-snapshot-one-point",
    );
    expect(initial.liveTransitionOriginAcceptedTimeSec).toBeNull();

    runtime.emitSignal(101, 2);
    await waitForV1(() =>
      controller.controlStore.getSnapshot().frames.length === 2
    );
    const appended = controller.controlStore.getSnapshot();
    expect(appended.provenance.displayedEvidence).toBe(
      "open-transient-no-periodic-claim",
    );
    expect(appended.liveTransitionOriginAcceptedTimeSec).toBe(
      initial.frames[0]!.acceptedTimeSec,
    );

    await controller.dispose();
  });

  it("fails visibly on malformed projection, freezes appends, and recovers only from a valid reset", async () => {
    const { controller, runtime } = await controllerFixtureV1(4);
    const actions = controller.controlStore.actions;
    const acceptedBeforeFailure = controller.controlStore.getSnapshot().frames;

    runtime.emitProjectionInvalidSignal(101, 2);
    await waitForV1(() =>
      controller.status.lastFailure?.lane === "presentation"
    );
    expect(controller.status.lastFailure).toMatchObject({
      lane: "presentation",
      message:
        expect.stringContaining("contains unknown observable"),
    });
    expect(controller.controlStore.getSnapshot()).toMatchObject({
      phase: "failed",
      frames: acceptedBeforeFailure,
      errorMessage:
        expect.stringContaining("presentation projection failed"),
    });

    runtime.emitSignal(102, 3);
    expect(
      controller.controlStore.getSnapshot().frames.map(({ revision }) =>
        revision
      ),
    ).toEqual([100]);

    actions.resetLiveOrFailure();
    await waitForV1(() => runtime.submissions.length === 1);
    runtime.resolveLive(0);
    await waitForV1(() => controller.status.lastFailure === null);
    const recovered = controller.controlStore.getSnapshot();
    expect(recovered.frames.map(({ revision }) => revision)).toEqual([201]);
    expect(recovered.phase).not.toBe("failed");
    expect(recovered.errorMessage).toBeNull();

    runtime.resolveStrict(0);
    await controller.dispose();
  });

  it("serializes rapid complete targets and keeps displayed epoch provenance exact", async () => {
    const fixture = await controllerFixtureV1(7);
    const { controller, coordinator, runtime } = fixture;

    await expect(controller.promoteSteadyCandidate()).resolves.toBeUndefined();
    await expect(controller.pinSteadyCandidate()).resolves.toBeNull();
    expect(runtime.promotions).toHaveLength(0);
    expect(controller.settledAnalysisSource).toMatchObject({
      scenarioId: "scenario/controller",
      targetGeneration: 0,
      targetInputSha256: "c".repeat(64),
    });

    const actions = controller.controlStore.actions;
    actions.commitSystemicScale(1.5);
    actions.commitPulmonaryScale(2);
    actions.commitControlValue("circulation.venous-tone", 0.3);

    await waitForV1(() => runtime.submissions.length === 3);
    expect(controller.settledAnalysisSource).toBeNull();
    expect(runtime.submissions.map((command) =>
      command.targets[0]?.patch.values
    )).toMatchObject([
      {
        "circulation.systemic-vascular-resistance-scale": 1.5,
        "circulation.pulmonary-vascular-resistance-scale": 1,
        "circulation.venous-tone": 0.15,
      },
      {
        "circulation.systemic-vascular-resistance-scale": 1.5,
        "circulation.pulmonary-vascular-resistance-scale": 2,
        "circulation.venous-tone": 0.15,
      },
      {
        "circulation.systemic-vascular-resistance-scale": 1.5,
        "circulation.pulmonary-vascular-resistance-scale": 2,
        "circulation.venous-tone": 0.3,
      },
    ]);
    expect(coordinator.branch("scenario/controller").targetGeneration).toBe(3);

    const beforeLive = controller.controlStore.getSnapshot();
    expect(beforeLive.inFlight).toBe(true);
    expect(beforeLive.provenance.displayedParameterEpoch).toBe(7);
    expect(beforeLive.provenance.displayedControlStateSha256).toBe(
      fixture.initialTargetStateSha256,
    );

    runtime.resolveLive(2);
    await waitForV1(() =>
      coordinator.branch("scenario/controller").display.origin.kind
        === "live-transition"
    );
    const afterLive = controller.controlStore.getSnapshot();
    expect(afterLive.provenance.displayedParameterEpoch).toBe(10);
    expect(afterLive.provenance.displayedControlStateSha256).toBe(
      afterLive.targetControlStateSha256,
    );

    runtime.resolveStrict(2);
    await waitForV1(() => controller.status.strictCandidateAvailable);
    expect(controller.settledAnalysisSource).toMatchObject({
      scenarioId: "scenario/controller",
      targetGeneration: 3,
      targetInputSha256:
        coordinator.branch("scenario/controller").targetInputSha256,
    });
    expect(controller.status).toMatchObject({
      strictPhase: "candidate-ready",
      strictCandidateAvailable: true,
      strictCandidatePinned: false,
      pinnedRunCount: 0,
      pinInFlight: false,
    });

    await expect(controller.pinSteadyCandidate()).resolves.not.toBeNull();
    expect(controller.status).toMatchObject({
      strictPhase: "candidate-ready",
      strictCandidateAvailable: true,
      strictCandidatePinned: true,
      pinnedRunCount: 1,
    });

    actions.commitControlValue("ventilation.peep-cm-h2o", 5);
    await waitForV1(() => runtime.submissions.length === 4);
    expect(controller.settledAnalysisSource).toBeNull();
    expect(controller.status).toMatchObject({
      targetGeneration: 4,
      strictPhase: "running",
      strictCandidateAvailable: false,
      strictCandidatePinned: false,
      pinnedRunCount: 1,
    });

    runtime.resolveStrict(3);
    await waitForV1(() => controller.status.strictCandidateAvailable);
    const fourthGenerationAnalysisSource =
      controller.settledAnalysisSource;
    expect(fourthGenerationAnalysisSource).toMatchObject({
      scenarioId: "scenario/controller",
      targetGeneration: 4,
    });
    await controller.promoteSteadyCandidate();
    expect(controller.settledAnalysisSource).toEqual({
      ...fourthGenerationAnalysisSource,
      sourceRole: "promoted-settled-source",
    });
    const promoted = controller.controlStore.getSnapshot();
    expect(promoted.source.context.parameterEpoch).toBe(11);
    expect(promoted.provenance.displayedParameterEpoch).toBe(11);
    expect(promoted.source.context.parameterEpoch).not.toBe(14);
    expect(controller.status).toMatchObject({
      strictPhase: "settled-in-use",
      strictCandidateAvailable: false,
      strictCandidatePinned: false,
      pinnedRunCount: 1,
    });

    await controller.dispose();
  });

  it("retains at most six useful previous parameter-generation traces", async () => {
    const { controller, runtime } = await controllerFixtureV1(20);
    const actions = controller.controlStore.actions;

    runtime.emitSignal(101, 2);
    await waitForV1(() =>
      controller.controlStore.getSnapshot().frames.length === 2
    );

    for (let generation = 1; generation <= 7; generation += 1) {
      actions.commitControlValue(
        "circulation.venous-tone",
        generation % 2 === 1 ? 0.3 : 0.5,
      );
      await waitForV1(() =>
        runtime.submissions.length === generation
        || controller.controlStore.getSnapshot().errorMessage !== null
      );
      expect(controller.controlStore.getSnapshot().errorMessage).toBeNull();
      runtime.resolveLive(generation - 1);
      await waitForV1(() =>
        controller.controlStore.getSnapshot()
          .provenance.displayedParameterEpoch === 20 + generation
      );
      const target = runtime.submissions[generation - 1]!.targets[0]!;
      runtime.emitSignal(
        201 + generation,
        2,
        target.targetGeneration,
        target.presentationRevision,
      );
      await waitForV1(() =>
        controller.controlStore.getSnapshot().frames.length === 2
      );
    }

    const history =
      controller.controlStore.getSnapshot().parameterGenerationHistory;
    expect(history).toHaveLength(6);
    expect(history?.map(({ targetGeneration }) => targetGeneration)).toEqual([
      6,
      5,
      4,
      3,
      2,
      1,
    ]);
    expect(history?.map(({ parameterEpoch }) => parameterEpoch)).toEqual([
      26,
      25,
      24,
      23,
      22,
      21,
    ]);
    expect(history?.every(({ frames }) => frames.length === 2)).toBe(true);
    expect(Object.isFrozen(history)).toBe(true);
    expect(Object.isFrozen(history?.[0]?.frames)).toBe(true);

    await controller.dispose();
  });

  it("publishes paused only after the final in-flight batch reaches the runtime boundary", async () => {
    const { controller, coordinator, runtime } =
      await controllerFixtureV1(0);
    const suspendGate = runtime.delayNextSuspend();

    controller.controlStore.actions.pauseLive();
    await waitForV1(() =>
      runtime.signalLifecycle.includes("suspend:start:scenario/controller")
    );
    expect(coordinator.branch("scenario/controller").livePlayback).toBe(
      "suspended",
    );
    expect(controller.status.livePlayback).toBe("running");
    expect(controller.controlStore.getSnapshot().phase).toBe("live-running");

    runtime.emitSignal(101, 2);
    await waitForV1(() =>
      controller.controlStore.getSnapshot().frames.at(-1)?.revision === 101
    );
    expect(controller.controlStore.getSnapshot().phase).toBe("live-running");

    suspendGate.resolve(undefined);
    await waitForV1(() =>
      controller.status.livePlayback === "suspended"
      && controller.controlStore.getSnapshot().phase === "live-paused"
    );
    const pausedFrames = controller.controlStore.getSnapshot().frames;

    runtime.emitSignal(102, 3);
    await new Promise((resolve) => globalThis.setTimeout(resolve, 30));
    expect(controller.controlStore.getSnapshot().frames).toBe(pausedFrames);

    await controller.dispose();
  });

  it("orders pause/resume and recovers a failed suspended branch with one reset intent", async () => {
    const { controller, coordinator, runtime } =
      await controllerFixtureV1(0);
    const actions = controller.controlStore.actions;
    const suspendGate = runtime.delayNextSuspend();

    actions.pauseLive();
    await waitForV1(() =>
      runtime.signalLifecycle.includes("suspend:start:scenario/controller")
    );
    actions.resumeLive();
    expect(runtime.signalLifecycle.filter((event) =>
      event.startsWith("resume:start:scenario/controller")
    )).toHaveLength(1);

    suspendGate.resolve(undefined);
    await waitForV1(() =>
      coordinator.branch("scenario/controller").livePlayback === "running"
      && runtime.signalLifecycle.filter((event) =>
        event.startsWith("resume:start:scenario/controller")
      ).length === 2
    );

    actions.pauseLive();
    await waitForV1(() =>
      coordinator.branch("scenario/controller").livePlayback === "suspended"
    );
    runtime.rejectNextResume(new Error("resume transport failed"));
    actions.resumeLive();
    await waitForV1(() =>
      controller.controlStore.getSnapshot().errorMessage
        ?.includes("resume transport failed") === true
    );
    expect(coordinator.branch("scenario/controller").livePlayback).toBe(
      "suspended",
    );
    expect(controller.controlStore.getSnapshot().phase).toBe("failed");

    actions.resetLiveOrFailure();
    await waitForV1(() =>
      runtime.submissions.length === 1
      && coordinator.branch("scenario/controller").livePlayback === "running"
    );
    expect(coordinator.branch("scenario/controller").lastRuntimeFailure)
      .toBeNull();
    expect(controller.controlStore.getSnapshot().errorMessage).toBeNull();

    await controller.dispose();
  });

  it("drops a queued resume after a newer pause request", async () => {
    const { controller, coordinator, runtime } =
      await controllerFixtureV1(0);
    const actions = controller.controlStore.actions;
    const suspendGate = runtime.delayNextSuspend();
    const initialResumeCount = runtime.signalLifecycle.filter((event) =>
      event.startsWith("resume:start:scenario/controller")
    ).length;

    actions.pauseLive();
    await waitForV1(() =>
      runtime.signalLifecycle.includes("suspend:start:scenario/controller")
    );
    actions.resumeLive();
    actions.pauseLive();
    actions.commitSystemicScale(1.5);
    suspendGate.resolve(undefined);
    await waitForV1(() => runtime.submissions.length === 1);

    expect(coordinator.branch("scenario/controller").livePlayback).toBe(
      "suspended",
    );
    expect(runtime.signalLifecycle.filter((event) =>
      event.startsWith("resume:start:scenario/controller")
    )).toHaveLength(initialResumeCount);

    runtime.resolveLive(0);
    runtime.resolveStrict(0);
    await controller.dispose();
  });

  it("preserves an intentional pause while retrying a strict failure", async () => {
    const { controller, coordinator, runtime } =
      await controllerFixtureV1(0);
    const actions = controller.controlStore.actions;
    const resumeStartCount = (): number =>
      runtime.signalLifecycle.filter((event) =>
        event.startsWith("resume:start:scenario/controller")
      ).length;

    actions.commitSystemicScale(1.5);
    await waitForV1(() => runtime.submissions.length === 1);
    runtime.resolveStrict(0, true);
    await waitForV1(() => controller.status.strictPhase === "failed");

    actions.pauseLive();
    await waitForV1(() =>
      coordinator.branch("scenario/controller").livePlayback === "suspended"
    );
    const resumeStartsBeforeRetry = resumeStartCount();

    actions.resetLiveOrFailure();
    await waitForV1(() => runtime.submissions.length === 2);
    expect(coordinator.branch("scenario/controller").livePlayback).toBe(
      "suspended",
    );
    expect(resumeStartCount()).toBe(resumeStartsBeforeRetry);

    runtime.resolveLive(1);
    await waitForV1(() => {
      const branch = coordinator.branch("scenario/controller");
      return branch.display.origin.kind === "live-transition"
        && branch.display.origin.targetGeneration === 2;
    });
    expect(coordinator.branch("scenario/controller").livePlayback).toBe(
      "suspended",
    );
    expect(resumeStartCount()).toBe(resumeStartsBeforeRetry);

    runtime.resolveStrict(1);
    await controller.dispose();
  });

  it("keeps live controls editable when only strict settlement fails", async () => {
    const { controller, coordinator, runtime } =
      await controllerFixtureV1(2);
    const actions = controller.controlStore.actions;

    actions.commitSystemicScale(1.5);
    await waitForV1(() => runtime.submissions.length === 1);
    runtime.resolveStrict(0, true);
    await waitForV1(() => controller.status.strictPhase === "failed");

    expect(controller.status.lastFailure).toMatchObject({
      lane: "strict",
      message: "strict settlement failed",
    });
    expect(controller.controlStore.getSnapshot()).toMatchObject({
      phase: "live-retargeting",
      periodicStatus: "automatic-strict-failed",
      errorMessage: null,
    });

    actions.commitPulmonaryScale(2);
    await waitForV1(() => runtime.submissions.length === 2);
    expect(coordinator.branch("scenario/controller")).toMatchObject({
      targetGeneration: 2,
      lastRuntimeFailure: null,
    });
    expect(controller.status.strictPhase).toBe("running");

    await controller.dispose();
  });

  it("aborts and closes an in-flight runtime open without returning a controller", async () => {
    const fixture = await controllerOpeningFixtureV1(4);
    fixture.runtime.delayNextOpen();
    const abortController = new AbortController();

    const opening = ScientificProductStudioScenarioControllerV1.create({
      bootstrap: fixture.bootstrap,
      coordinator: fixture.coordinator,
      sessionId: "session/controller-aborted-open",
      signal: abortController.signal,
    });
    const openingResult = expect(opening).rejects.toThrow(/opening aborted/);
    await waitForV1(() => fixture.runtime.openedSessionIds.length === 1);

    abortController.abort();
    await openingResult;

    expect(fixture.runtime.closedSessionIds).toEqual([
      "session/controller-aborted-open",
    ]);
    expect(fixture.coordinator.getSnapshot()).toBeNull();
  });
});

async function controllerFixtureV1(
  initialParameterEpoch: number,
  deferInitialLivePresentation = false,
) {
  const fixture = await controllerOpeningFixtureV1(initialParameterEpoch);
  const controller = await ScientificProductStudioScenarioControllerV1.create({
    bootstrap: fixture.bootstrap,
    coordinator: fixture.coordinator,
    sessionId: "session/controller",
    deferInitialLivePresentation,
  });
  return {
    controller,
    coordinator: fixture.coordinator,
    runtime: fixture.runtime,
    initialTargetStateSha256: fixture.initialTargetStateSha256,
  };
}

async function controllerOpeningFixtureV1(initialParameterEpoch: number) {
  const artifacts = new InMemoryContentAddressedArtifactStoreV1();
  const [sourceRunRef, sourceInputRef, sourceSnapshotRef] = await Promise.all([
    artifacts.putJson({
      kind: "run-artifact",
      mediaType: "application/json",
      content: { fixture: "source-run" },
    }),
    artifacts.putJson({
      kind: "simulation-input",
      mediaType: "application/json",
      content: { fixture: "source-input" },
    }),
    artifacts.putJson({
      kind: "snapshot-envelope",
      mediaType: "application/json",
      content: { fixture: "source-snapshot" },
    }),
  ]);
  const targetState =
    await createMainWireScientificResearchControlBaselineTargetStateV0();
  const point = runtimeFrameV1(100).point;
  const seedFrame =
    projectRuntimeObservablePointToMainWireScientificObservableFrameV1({
      point,
      releaseRef: targetState.releaseRef,
    });
  const bootstrap = Object.freeze({
    workspaceDocument: Object.freeze({}),
    baseSessionInputSha256: "b".repeat(64),
    source: Object.freeze({
      sessionId: "source/controller",
      context: Object.freeze({
        stateIdentity: Object.freeze({
          revision: seedFrame.revision,
          acceptedTimeSec: seedFrame.acceptedTimeSec,
          totalBloodVolumeMl: 5_000,
        }),
        controlState: targetState,
        parameterEpoch: initialParameterEpoch,
      }),
      seedFrame,
    }),
    branch: Object.freeze({
      scenarioId: "scenario/controller",
      sourceRunRef,
      sourceInputRef,
      sourceSnapshotRef,
      initialTargetInputSha256: "c".repeat(64),
    }),
  }) as unknown as ScientificProductStudioBootstrapResultV1;
  const runtime = new ControllerFakeRuntimeV1();
  const coordinator = new SimulationSessionCoordinatorV1({
    runtime,
    artifacts,
  });
  return {
    bootstrap,
    coordinator,
    runtime,
    initialTargetStateSha256: targetState.targetStateSha256,
  };
}

const EXECUTION_V1: RuntimeExecutionIdentityV1 = Object.freeze({
  modelRef: "model/main-wire@1.0.0",
  runtimeRef: "runtime/test@1.0.0",
  solverRef: "solver/test@1.0.0",
  stateCodecRef: "codec/test@1.0.0",
  protocolRef: "protocol/test@1.0.0",
});

class ControllerFakeRuntimeV1 implements SimulationRuntimePortV1 {
  readonly submissions: RuntimeTargetIntentCommandV1[] = [];
  readonly promotions: PromoteSteadyCandidateCommandV1[] = [];
  readonly signalLifecycle: string[] = [];
  readonly openedSessionIds: string[] = [];
  readonly closedSessionIds: string[] = [];

  private opened: OpenSimulationSessionCommandV1 | null = null;
  private nextOpenGate: DeferredV1<void> | null = null;
  private activeOpenGate: DeferredV1<void> | null = null;
  private readonly cancelledOpeningSessionIds = new Set<string>();
  private readonly executions: Array<Readonly<{
    command: RuntimeTargetIntentCommandV1;
    live: DeferredV1<RuntimeLiveIntentResultV1>;
    strict: DeferredV1<RuntimeStrictIntentResultV1>;
  }>> = [];
  private nextSuspendGate: DeferredV1<void> | null = null;
  private nextResumeError: Error | null = null;
  private signalChannel: RuntimeSignalChannelRefV1 | null = null;
  private signalObserver:
    ((event: RuntimeSignalEventV1) => void) | null = null;

  async openSession(
    command: OpenSimulationSessionCommandV1,
  ): Promise<RuntimeSessionOpenedV1> {
    this.openedSessionIds.push(command.sessionId);
    this.opened = command;
    const openGate = this.nextOpenGate;
    this.nextOpenGate = null;
    if (openGate !== null) {
      this.activeOpenGate = openGate;
      await openGate.promise;
      if (this.activeOpenGate === openGate) this.activeOpenGate = null;
    }
    if (this.cancelledOpeningSessionIds.delete(command.sessionId)) {
      throw new Error(`runtime opening aborted for ${command.sessionId}`);
    }
    return {
      sessionId: command.sessionId,
      branches: command.branches.map((branch) => ({
        ...branch,
        liveBranchId: `branch/${branch.scenarioId}`,
        signalChannelRef: signalChannelV1(command.sessionId, branch.scenarioId),
        streamEpoch: 0,
        execution: EXECUTION_V1,
        initialFrame: runtimeFrameV1(100),
      })),
    };
  }

  startTargetIntent(
    command: RuntimeTargetIntentCommandV1,
  ): RuntimeTargetIntentExecutionV1 {
    this.submissions.push(command);
    const live = deferredV1<RuntimeLiveIntentResultV1>();
    const strict = deferredV1<RuntimeStrictIntentResultV1>();
    this.executions.push({ command, live, strict });
    return Object.freeze({ live: live.promise, strict: strict.promise });
  }

  async promoteSteadyCandidate(
    command: PromoteSteadyCandidateCommandV1,
  ): Promise<RuntimeCandidatePromotedV1> {
    this.promotions.push(command);
    return {
      sessionId: command.sessionId,
      scenarioId: command.scenarioId,
      targetGeneration: command.targetGeneration,
      presentationRevision: command.presentationRevision,
      candidateId: command.candidate.candidateId,
      streamEpoch: command.presentationRevision,
      initialFrame: runtimeFrameV1(1_000 + command.targetGeneration),
    };
  }

  subscribeSignalChannel(
    channel: RuntimeSignalChannelRefV1,
    observer: (event: RuntimeSignalEventV1) => void,
  ) {
    this.signalChannel = channel;
    this.signalObserver = observer;
    return Object.freeze({
      unsubscribe: () => {
        if (this.signalObserver === observer) {
          this.signalChannel = null;
          this.signalObserver = null;
        }
      },
    });
  }

  async suspendSignalChannel(
    channel: RuntimeSignalChannelRefV1,
  ): Promise<void> {
    this.signalLifecycle.push(`suspend:start:${channel.scenarioId}`);
    const gate = this.nextSuspendGate;
    this.nextSuspendGate = null;
    if (gate !== null) await gate.promise;
    this.signalLifecycle.push(`suspend:complete:${channel.scenarioId}`);
  }

  async resumeSignalChannel(
    channel: RuntimeSignalChannelRefV1,
    expectedStreamEpoch: number,
  ): Promise<void> {
    this.signalLifecycle.push(
      `resume:start:${channel.scenarioId}:${expectedStreamEpoch}`,
    );
    const error = this.nextResumeError;
    this.nextResumeError = null;
    if (error !== null) throw error;
    this.signalLifecycle.push(
      `resume:complete:${channel.scenarioId}:${expectedStreamEpoch}`,
    );
  }

  async closeSession(sessionId: string): Promise<void> {
    this.closedSessionIds.push(sessionId);
    if (this.activeOpenGate !== null) {
      this.cancelledOpeningSessionIds.add(sessionId);
      this.activeOpenGate.resolve(undefined);
    }
  }

  delayNextOpen(): void {
    this.nextOpenGate = deferredV1<void>();
  }

  delayNextSuspend(): DeferredV1<void> {
    const gate = deferredV1<void>();
    this.nextSuspendGate = gate;
    return gate;
  }

  rejectNextResume(error: Error): void {
    this.nextResumeError = error;
  }

  emitSignal(
    sequence: number,
    collectedPointCount: number,
    targetGeneration = 0,
    presentationRevision = 0,
  ): void {
    this.emitSignalPointV1(
      runtimeFrameV1(sequence).point,
      collectedPointCount,
      targetGeneration,
      presentationRevision,
    );
  }

  emitProjectionInvalidSignal(
    sequence: number,
    collectedPointCount: number,
  ): void {
    const point = runtimeFrameV1(sequence).point;
    this.emitSignalPointV1(Object.freeze({
      ...point,
      values: Object.freeze({
        "unknown.presentation.value": 1,
      }),
    }), collectedPointCount, 0, 0);
  }

  private emitSignalPointV1(
    point: RuntimePresentationFrameV1["point"],
    collectedPointCount: number,
    targetGeneration: number,
    presentationRevision: number,
  ): void {
    const channel = this.signalChannel;
    const observer = this.signalObserver;
    if (channel === null || observer === null) {
      throw new Error("fake signal channel is not subscribed");
    }
    observer(Object.freeze({
      kind: "samples" as const,
      channelId: channel.channelId,
      sessionId: channel.sessionId,
      scenarioId: channel.scenarioId,
      liveBranchId: channel.liveBranchId,
      targetGeneration,
      presentationRevision,
      streamEpoch: presentationRevision,
      points: Object.freeze([point]),
      windowMetrics: Object.freeze({
        status: "collecting" as const,
        collectedPointCount,
        completedCycleCount: 0 as const,
      }),
    }));
  }

  resolveLive(index: number): void {
    const execution = this.requiredExecutionV1(index);
    execution.live.resolve({
      sessionId: execution.command.sessionId,
      intentId: execution.command.intentId,
      branches: execution.command.targets.map((target) => ({
        status: "success" as const,
        scenarioId: target.scenarioId,
        targetGeneration: target.targetGeneration,
        result: {
          scenarioId: target.scenarioId,
          targetGeneration: target.targetGeneration,
          presentationRevision: target.presentationRevision,
          targetInputSha256: target.patch.targetInputSha256,
          streamEpoch: target.presentationRevision,
          frame: runtimeFrameV1(200 + target.targetGeneration),
        },
      })),
    });
  }

  resolveStrict(index: number, fail = false): void {
    const execution = this.requiredExecutionV1(index);
    const opened = this.opened;
    if (opened === null) throw new Error("fake runtime is not open");
    execution.strict.resolve({
      sessionId: execution.command.sessionId,
      intentId: execution.command.intentId,
      branches: execution.command.targets.map((target) => {
        if (fail) {
          return {
            status: "failure" as const,
            scenarioId: target.scenarioId,
            targetGeneration: target.targetGeneration,
            targetInputSha256: target.patch.targetInputSha256,
            message: "strict settlement failed",
          };
        }
        const source = opened.branches.find(({ scenarioId }) =>
          scenarioId === target.scenarioId
        );
        if (source === undefined) throw new Error("fake source branch missing");
        return {
          status: "success" as const,
          scenarioId: target.scenarioId,
          targetGeneration: target.targetGeneration,
          candidate: {
            candidateId:
              `candidate/${target.scenarioId}/${target.targetGeneration}`,
            sessionId: execution.command.sessionId,
            scenarioId: target.scenarioId,
            targetGeneration: target.targetGeneration,
            sourceRunRef: source.sourceRunRef,
            simulationInputRef: source.sourceInputRef,
            targetInputSha256: target.patch.targetInputSha256,
            snapshotRef: source.sourceSnapshotRef,
            execution: EXECUTION_V1,
            steadyStatus: "converged" as const,
            numericalHealth: "passed" as const,
          },
        };
      }),
    });
  }

  private requiredExecutionV1(index: number) {
    const execution = this.executions[index];
    if (execution === undefined) {
      throw new Error(`missing fake execution ${index}`);
    }
    return execution;
  }
}

function signalChannelV1(
  sessionId: string,
  scenarioId: string,
): RuntimeSignalChannelRefV1 {
  return Object.freeze({
    protocolId: "circleheart-studio-runtime-signal-channel-v1",
    channelId: `channel/${scenarioId}`,
    sessionId,
    scenarioId,
    liveBranchId: `branch/${scenarioId}`,
  });
}

function runtimeFrameV1(sequence: number): RuntimePresentationFrameV1 {
  return Object.freeze({
    point: Object.freeze({
      sequence,
      simulationTimeSec: sequence * 0.01,
      phase01: (sequence % 100) / 100,
      values: Object.freeze({
        "hemodynamics.volume.LV": 120 + sequence,
      }),
    }),
    windowMetrics: Object.freeze({
      status: "collecting" as const,
      collectedPointCount: 1,
      completedCycleCount: 0 as const,
    }),
  });
}

type DeferredV1<T> = Readonly<{
  promise: Promise<T>;
  resolve: (value: T) => void;
}>;

function deferredV1<T>(): DeferredV1<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return Object.freeze({ promise, resolve });
}

async function waitForV1(
  predicate: () => boolean,
  timeoutMs = 5_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) {
      throw new Error("timed out waiting for controller state");
    }
    await new Promise((resolve) => globalThis.setTimeout(resolve, 5));
  }
}
