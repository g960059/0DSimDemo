import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import type {
  MainWireIntegratedModelCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  INTEGRATED_V3_LANE_CAPABILITY_KEYS_V1,
  INTEGRATED_V3_LANE_KIND_V1,
} from "@/engine/myocardium/MainWireIntegratedLaneIdentityV1";
import type {
  MainWireIntegratedLaneObservableFrameV1,
} from "@/engine/myocardium/MainWireIntegratedLaneObservableRegistryV1";
import type {
  MainWireIntegratedBrowserAdvanceReceiptV1,
  MainWireIntegratedBrowserHostedSessionV1,
  MainWireIntegratedScientificBrowserHostV1,
} from "@/engine/scientificBrowser/MainWireIntegratedScientificBrowserHostV1";
import {
  MAIN_WIRE_INTEGRATED_V3_LANE_DESCRIPTOR_V1,
  MAIN_WIRE_INTEGRATED_V3_LIVE_HOST_ROTATION_POLICY_V1,
  MAIN_WIRE_INTEGRATED_V3_LIVE_HOST_ROTATION_REQUEST_COUNT_V1,
} from "@/studio/adapters/mainWire/MainWireIntegratedV3LiveLaneDriverV1";
import {
  createMainWireStudioLiveLaneDriverV1,
} from "@/studio/adapters/mainWire/MainWireStudioLiveLaneFactoryV1";
import {
  STUDIO_INTEGRATED_V3_PRESENTATION_COVERAGE_V1,
  STUDIO_NONCORONARY_LANE_KIND_V1,
  type StudioIntegratedV3PresentationSampleBatchV1,
  type StudioIntegratedV3PresentationSignalEventV1,
} from "@/studio/adapters/mainWire/StudioLiveLaneV1";
import type {
  RuntimePresentationSignalSubscriptionV1,
  SimulationRuntimePortV1,
} from "@/studio/contracts/v1/ports";
import type {
  RuntimePresentationSignalChannelRefV1,
  RuntimePresentationSignalFailureV1,
  RuntimeSessionOpenedV1,
} from "@/studio/contracts/v1/runtime";

describe("Studio live-lane stream seam V1", () => {
  it("resolves both lane members through one factory and leaves non-coronary calls and values unchanged", async () => {
    const opened = Object.freeze({
      sessionId: "existing-session",
      branches: Object.freeze([]),
    }) satisfies RuntimeSessionOpenedV1;
    const subscription = Object.freeze({
      unsubscribe: vi.fn(),
    }) satisfies RuntimePresentationSignalSubscriptionV1;
    const signal = failureEventV1("existing-channel");
    const intentExecution = Object.freeze({
      live: Promise.resolve({}),
      strict: Promise.resolve({}),
    });
    const promoted = Object.freeze({ receipt: "existing" });
    const openSession = vi.fn(async () => opened);
    const subscribePresentationSignalChannel = vi.fn(
      (
        _channel: RuntimePresentationSignalChannelRefV1,
        observer: (event: RuntimePresentationSignalFailureV1) => void,
      ) => {
        observer(signal);
        return subscription;
      },
    );
    const suspendPresentationSignalChannel =
      vi.fn(async () => undefined);
    const resumePresentationSignalChannel =
      vi.fn(async () => undefined);
    const startTargetIntent = vi.fn(() => intentExecution);
    const promoteSteadyCandidate = vi.fn(async () => promoted);
    const closeSession = vi.fn(async () => undefined);
    const runtimePort = {
      openSession,
      subscribePresentationSignalChannel,
      suspendPresentationSignalChannel,
      resumePresentationSignalChannel,
      startTargetIntent,
      promoteSteadyCandidate,
      closeSession,
    } as unknown as SimulationRuntimePortV1;

    const nonCoronary = createMainWireStudioLiveLaneDriverV1({
      laneKind: STUDIO_NONCORONARY_LANE_KIND_V1,
      runtimePort,
    });
    const integrated = createMainWireStudioLiveLaneDriverV1({
      laneKind: INTEGRATED_V3_LANE_KIND_V1,
      options: {
        hostFactory: () => new FakeIntegratedHost(new FakeClock()),
      },
    });

    expect(nonCoronary.laneKind).toBe("noncoronary-v1");
    expect(integrated.laneKind).toBe("integrated-v3-experimental");
    expect("presentationScheduling" in nonCoronary).toBe(true);
    expect("researchTransitions" in nonCoronary).toBe(true);
    expect("presentationScheduling" in integrated).toBe(false);
    expect("researchTransitions" in integrated).toBe(false);

    const openCommand = Object.freeze({
      sessionId: "existing-session",
      branches: Object.freeze([]),
    });
    const openResult = await nonCoronary.openSession({
      laneKind: STUDIO_NONCORONARY_LANE_KIND_V1,
      command: openCommand,
    });
    expect(openSession).toHaveBeenCalledOnce();
    expect(openSession).toHaveBeenCalledWith(openCommand);
    expect(openResult.session).toBe(opened);

    const channel = channelV1("existing-channel");
    const observed: unknown[] = [];
    expect(
      nonCoronary.subscribePresentationSignalChannel(
        channel,
        (event) => observed.push(event),
      ),
    ).toBe(subscription);
    expect(observed).toEqual([signal]);
    expect(observed[0]).toBe(signal);
    expect(subscribePresentationSignalChannel)
      .toHaveBeenCalledWith(channel, expect.any(Function));

    await nonCoronary.presentationScheduling
      .suspendPresentationSignalChannel(channel);
    await nonCoronary.presentationScheduling
      .resumePresentationSignalChannel(channel, 3);
    expect(suspendPresentationSignalChannel)
      .toHaveBeenCalledWith(channel);
    expect(resumePresentationSignalChannel)
      .toHaveBeenCalledWith(channel, 3);

    const intentCommand = { sessionId: "existing-session" };
    const promotionCommand = {
      sessionId: "existing-session",
      candidateId: "candidate",
    };
    expect(nonCoronary.researchTransitions.startTargetIntent(
      intentCommand as never,
    )).toBe(intentExecution);
    await expect(
      nonCoronary.researchTransitions.promoteSteadyCandidate(
        promotionCommand as never,
      ),
    ).resolves.toBe(promoted);
    expect(startTargetIntent).toHaveBeenCalledWith(intentCommand);
    expect(promoteSteadyCandidate).toHaveBeenCalledWith(
      promotionCommand,
    );

    await nonCoronary.closeSession("existing-session");
    expect(closeSession).toHaveBeenCalledWith("existing-session");
  });

  it("T4/T5/T6/T14/T15 — streams 500 V3 samples, measures below-realtime pacing, and keeps model revisions distinct from ordinals", async () => {
    const clock = new FakeClock();
    const host = new FakeIntegratedHost(clock, {
      activeWallMsPerAcceptedSubstep: 2 / 0.37,
    });
    const driver = createMainWireStudioLiveLaneDriverV1({
      laneKind: INTEGRATED_V3_LANE_KIND_V1,
      options: {
        hostFactory: () => host,
        nowMs: () => clock.nowMs,
        delayMs: async (durationMs) => {
          clock.nowMs += durationMs;
        },
      },
    });
    const opened = await driver.openSession({
      laneKind: INTEGRATED_V3_LANE_KIND_V1,
      sessionId: "integrated-session",
      branches: Object.freeze([{ scenarioId: "fixed-v3" }]),
    });
    const initial = opened.branches[0]!.initialPresentation;
    expect(initial.livePacing).toEqual({
      mode: "degraded",
      epochLagMs: 0,
      recentAchievedRate: null,
      cumulativeRebasedDeficitMs: 0,
    });
    expect(initial.sample).not.toHaveProperty("phase");
    expect(initial.sample.coverage).toBe(
      STUDIO_INTEGRATED_V3_PRESENTATION_COVERAGE_V1,
    );

    const batches = await collectBatchesV1(
      driver,
      opened.branches[0]!.presentationSignalChannelRef,
      500,
      "integrated-session",
    );
    expect(batches).toHaveLength(500);
    expect(batches.every(({ samples }) => samples.length === 1)).toBe(
      true,
    );
    expect(batches[0]!.livePacing).toMatchObject({
      mode: "degraded",
      recentAchievedRate: expect.closeTo(0.37, 10),
    });
    expect(batches[0]!.samples[0]).not.toHaveProperty("phase");
    expect(batches[0]!.samples[0]).not.toHaveProperty(
      "retentionReason",
    );
    expect(batches[0]!.samples[0]!.coverage).toBe(
      "integrated-v3-live-presentation",
    );

    const eventBoundarySample = batches[406]!.samples[0]!;
    expect(eventBoundarySample).toMatchObject({
      presentationOrdinal: 407,
      presentationTimeSec: 0.8140000000000001,
      acceptedRevision: 408,
      acceptedRevisionSpanFromPrevious: 2,
      internalAcceptedSubstepCount: 2,
      boundaryClippedSubstepCount: 1,
    });
    expect(batches[405]!.samples[0]).toMatchObject({
      presentationOrdinal: 406,
      acceptedRevision: 406,
    });
    expect(batches[407]!.samples[0]).toMatchObject({
      presentationOrdinal: 408,
      acceptedRevision: 409,
    });
    expect(host.checkpointCount).toBe(0);
    expect(host.persistedArtifactWriteCount).toBe(0);
    expect(host.disposeCount).toBe(1);
    expect(host.terminateCount).toBe(1);

    expect(
      driver.laneDescriptor.capabilities.persistedWarmSnapshot,
    ).toMatchObject({ available: false });
    expect(
      driver.laneDescriptor.capabilities
        .operationalWorkerRotationCheckpoint,
    ).toEqual({ available: true });
  });

  it("uses the provisional 75,000-request threshold for private operational rotation without changing stream identity", async () => {
    const clock = new FakeClock();
    const oldHost = new FakeIntegratedHost(clock, {
      requestCountAfterCreate:
        MAIN_WIRE_INTEGRATED_V3_LIVE_HOST_ROTATION_REQUEST_COUNT_V1,
    });
    const newHost = new FakeIntegratedHost(clock);
    const hosts = [oldHost, newHost];
    const driver = createMainWireStudioLiveLaneDriverV1({
      laneKind: INTEGRATED_V3_LANE_KIND_V1,
      options: {
        hostFactory: () => hosts.shift()!,
        nowMs: () => clock.nowMs,
        delayMs: async (durationMs) => {
          clock.nowMs += durationMs;
        },
      },
    });
    const opened = await driver.openSession({
      laneKind: INTEGRATED_V3_LANE_KIND_V1,
      sessionId: "rotation-session",
      branches: Object.freeze([{ scenarioId: "rotation-scenario" }]),
    });
    const channel =
      opened.branches[0]!.presentationSignalChannelRef;
    const batches = await collectBatchesV1(
      driver,
      channel,
      1,
      "rotation-session",
    );

    expect(
      MAIN_WIRE_INTEGRATED_V3_LIVE_HOST_ROTATION_REQUEST_COUNT_V1,
    ).toBe(75_000);
    expect(
      MAIN_WIRE_INTEGRATED_V3_LIVE_HOST_ROTATION_POLICY_V1.status,
    ).toBe("provisional");
    expect(oldHost.checkpointCount).toBe(1);
    expect(oldHost.terminateCount).toBe(1);
    expect(newHost.restoreCount).toBe(1);
    expect(newHost.disposeCount).toBe(1);
    expect(newHost.terminateCount).toBe(1);
    expect(batches[0]).toMatchObject({
      channelId: channel.channelId,
      sessionId: channel.sessionId,
      scenarioId: channel.scenarioId,
      liveBranchId: channel.liveBranchId,
      samples: [{ presentationOrdinal: 1 }],
    });
    expect(oldHost.persistedArtifactWriteCount).toBe(0);
    expect(newHost.persistedArtifactWriteCount).toBe(0);
  });

  it("retries a partially advanced ordinal without publishing an internal substep as a sample", async () => {
    const clock = new FakeClock();
    const host = new FakeIntegratedHost(clock, {
      partialFailureOrdinal: 1,
    });
    const driver = createMainWireStudioLiveLaneDriverV1({
      laneKind: INTEGRATED_V3_LANE_KIND_V1,
      options: {
        hostFactory: () => host,
        nowMs: () => clock.nowMs,
        delayMs: async (durationMs) => {
          clock.nowMs += durationMs;
        },
      },
    });
    const opened = await driver.openSession({
      laneKind: INTEGRATED_V3_LANE_KIND_V1,
      sessionId: "retry-session",
      branches: Object.freeze([{ scenarioId: "retry-scenario" }]),
    });
    const batches = await collectBatchesV1(
      driver,
      opened.branches[0]!.presentationSignalChannelRef,
      1,
      "retry-session",
    );

    expect(host.advanceCount).toBe(2);
    expect(batches).toHaveLength(1);
    expect(batches[0]!.samples).toHaveLength(1);
    expect(batches[0]!.samples[0]).toMatchObject({
      presentationOrdinal: 1,
      acceptedRevision: 2,
      acceptedRevisionSpanFromPrevious: 2,
      internalAcceptedSubstepCount: 2,
      boundaryClippedSubstepCount: 1,
    });
  });

  it("T9 — exposes no optional action surface denied by the V3 capability descriptor", () => {
    const driver = createMainWireStudioLiveLaneDriverV1({
      laneKind: INTEGRATED_V3_LANE_KIND_V1,
      options: {
        hostFactory: () => new FakeIntegratedHost(new FakeClock()),
      },
    });
    const capabilities = driver.laneDescriptor.capabilities;

    for (const key of INTEGRATED_V3_LANE_CAPABILITY_KEYS_V1) {
      const capability = capabilities[key];
      if (capability.available === false) {
        expect(capability.explanation.trim(), key).not.toBe("");
      }
    }
    expect(capabilities.suspendResumePresentation.available).toBe(false);
    expect(capabilities.interactiveResearchControls.available).toBe(false);
    expect(capabilities.steadyCandidatePromotion.available).toBe(false);
    expect("presentationScheduling" in driver).toBe(false);
    expect("researchTransitions" in driver).toBe(false);
  });

  it("keeps every forbidden V3 seam claim absent from the additive Studio source", () => {
    const source = [
      "../studio/adapters/mainWire/StudioLiveLaneV1.ts",
      "../studio/adapters/mainWire/MainWireIntegratedV3LiveLaneDriverV1.ts",
      "../studio/adapters/mainWire/MainWireStudioLiveLaneFactoryV1.ts",
    ].map((path) =>
      readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");
    const driverSource = readFileSync(
      new URL(
        "../studio/adapters/mainWire/MainWireIntegratedV3LiveLaneDriverV1.ts",
        import.meta.url,
      ),
      "utf8",
    );

    expect(driverSource).not.toMatch(
      /StudioRunArtifactContentV1|STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID|artifactStore/,
    );
    expect(driverSource).not.toMatch(/ExactSignalExport|EXACT_SIGNAL/);
    expect(driverSource).not.toMatch(
      /runtimePresentationCanonicalPhaseV1|runtimePresentationStepsToNextCanonicalBoundaryV1/,
    );
    expect(driverSource).not.toContain("\"realtime-1x\"");
    expect(driverSource).not.toContain(
      "checkpointMainWireIntegratedModelV3",
    );
    expect(
      driverSource.match(/getOperationalCheckpoint/g) ?? [],
    ).toHaveLength(1);
    expect(source).not.toMatch(
      /advanceToPresentationOrdinal\s*\([^)]*\)\s*:/,
    );
    expect(source).not.toMatch(
      /getOperationalCheckpoint\s*\([^)]*\)\s*:/,
    );
  });
});

async function collectBatchesV1(
  driver: ReturnType<typeof createMainWireStudioLiveLaneDriverV1>,
  channel: RuntimePresentationSignalChannelRefV1,
  count: number,
  sessionId: string,
): Promise<readonly StudioIntegratedV3PresentationSampleBatchV1[]> {
  const batches: StudioIntegratedV3PresentationSampleBatchV1[] = [];
  let closePromise: Promise<void> | null = null;
  await new Promise<void>((resolve, reject) => {
    (
      driver as Extract<
        typeof driver,
        { laneKind: "integrated-v3-experimental" }
      >
    ).subscribePresentationSignalChannel(channel, (event) => {
      if (event.kind === "failure") {
        reject(new Error(event.message));
        return;
      }
      batches.push(event);
      if (batches.length === count) {
        closePromise = driver.closeSession(sessionId);
        resolve();
      }
    });
  });
  await closePromise;
  return Object.freeze(batches);
}

class FakeClock {
  nowMs = 0;
}

type FakeHostOptions = Readonly<{
  activeWallMsPerAcceptedSubstep?: number;
  requestCountAfterCreate?: number;
  partialFailureOrdinal?: number;
}>;

class FakeIntegratedHost
implements MainWireIntegratedScientificBrowserHostV1 {
  readonly hostId: string;
  requestCount = 0;
  checkpointCount = 0;
  restoreCount = 0;
  advanceCount = 0;
  disposeCount = 0;
  terminateCount = 0;
  persistedArtifactWriteCount = 0;
  private current: MainWireIntegratedBrowserHostedSessionV1 | null = null;
  private partialFailureIssued = false;
  private static nextHostOrdinal = 0;

  constructor(
    private readonly clock: FakeClock,
    private readonly options: FakeHostOptions = {},
  ) {
    FakeIntegratedHost.nextHostOrdinal += 1;
    this.hostId = `fake-integrated-host-${FakeIntegratedHost.nextHostOrdinal}`;
  }

  async createWorkerOwnedPreset(
    sessionId: string,
  ): Promise<MainWireIntegratedBrowserHostedSessionV1> {
    this.requestCount = this.options.requestCountAfterCreate ?? 1;
    this.current = hostedSessionV1(
      this.hostId,
      sessionId,
      0,
      0,
      0,
    );
    return this.current;
  }

  async observe(
    session: MainWireIntegratedBrowserHostedSessionV1,
  ): Promise<MainWireIntegratedBrowserHostedSessionV1> {
    this.assertCurrent(session);
    this.requestCount += 1;
    return session;
  }

  async advanceToPresentationOrdinal(
    session: MainWireIntegratedBrowserHostedSessionV1,
    presentationOrdinal: number,
  ): Promise<MainWireIntegratedBrowserAdvanceReceiptV1> {
    this.assertCurrent(session);
    this.requestCount += 1;
    this.advanceCount += 1;
    const nominalTargetTimeSec = presentationOrdinal * 0.002;
    if (
      presentationOrdinal === this.options.partialFailureOrdinal
      && !this.partialFailureIssued
    ) {
      this.partialFailureIssued = true;
      this.clock.nowMs +=
        this.options.activeWallMsPerAcceptedSubstep ?? 5;
      this.current = hostedSessionV1(
        this.hostId,
        session.sessionId,
        session.presentationOrdinal,
        session.acceptedRevision + 1,
        nominalTargetTimeSec - 0.0005,
      );
      return Object.freeze({
        status: "failed" as const,
        session: this.current,
        requestedPresentationOrdinal: presentationOrdinal,
        requestedPresentationTimeSec: nominalTargetTimeSec,
        partiallyAdvanced: true,
        internalAcceptedSubstepCount: 1,
        emittedPresentationSample: false as const,
        observableFrame: null,
        failureReason: "synthetic-partial-boundary",
        message: "synthetic partial boundary",
      });
    }

    const eventBoundarySpan = presentationOrdinal === 407 ? 2 : 1;
    this.clock.nowMs +=
      (this.options.activeWallMsPerAcceptedSubstep ?? 5)
      * eventBoundarySpan;
    this.current = hostedSessionV1(
      this.hostId,
      session.sessionId,
      presentationOrdinal,
      session.acceptedRevision + eventBoundarySpan,
      nominalTargetTimeSec,
    );
    return Object.freeze({
      status: "advanced" as const,
      session: this.current,
      presentationOrdinal,
      presentationTimeSec: nominalTargetTimeSec,
      acceptedRevisionSpanFromPrevious: eventBoundarySpan,
      internalAcceptedSubstepCount: eventBoundarySpan,
      boundaryClippedSubstepCount:
        eventBoundarySpan === 1 ? 0 : 1,
      substeps: Object.freeze([]),
      emittedPresentationSample: true,
      observableFrame: this.current.observableFrame,
    });
  }

  async getOperationalCheckpoint(
    session: MainWireIntegratedBrowserHostedSessionV1,
  ) {
    this.assertCurrent(session);
    this.requestCount += 1;
    this.checkpointCount += 1;
    return Object.freeze({
      session,
      checkpoint: Object.freeze({
        fakeHostedSession: session,
      }) as unknown as MainWireIntegratedModelCheckpointV3,
    });
  }

  async restoreOperationalCheckpoint(input: Readonly<{
    sessionId: string;
    checkpoint: unknown;
  }>): Promise<MainWireIntegratedBrowserHostedSessionV1> {
    this.requestCount += 1;
    this.restoreCount += 1;
    const checkpoint = input.checkpoint as {
      fakeHostedSession: MainWireIntegratedBrowserHostedSessionV1;
    };
    const prior = checkpoint.fakeHostedSession;
    this.current = hostedSessionV1(
      this.hostId,
      input.sessionId,
      prior.presentationOrdinal,
      prior.acceptedRevision,
      prior.acceptedTimeSec,
      prior.observableFrame,
    );
    return this.current;
  }

  async dispose(
    session: MainWireIntegratedBrowserHostedSessionV1,
  ): Promise<void> {
    this.assertCurrent(session);
    this.requestCount += 1;
    this.disposeCount += 1;
    this.current = null;
  }

  terminate(): void {
    this.terminateCount += 1;
    this.current = null;
  }

  private assertCurrent(
    session: MainWireIntegratedBrowserHostedSessionV1,
  ): void {
    if (this.current !== session) throw new Error("fake session is stale");
  }
}

function hostedSessionV1(
  hostId: string,
  sessionId: string,
  presentationOrdinal: number | null,
  acceptedRevision: number,
  acceptedTimeSec: number,
  observableFrame: MainWireIntegratedLaneObservableFrameV1 =
    observableFrameV1(),
): MainWireIntegratedBrowserHostedSessionV1 {
  return Object.freeze({
    hostId,
    sessionId,
    hotPathIntegrityTier: "full-invariant",
    laneDescriptor: MAIN_WIRE_INTEGRATED_V3_LANE_DESCRIPTOR_V1,
    presentationOrdinal,
    acceptedRevision,
    acceptedTimeSec,
    observableFrame,
  });
}

function observableFrameV1(): MainWireIntegratedLaneObservableFrameV1 {
  return Object.freeze({
    frameId: "main-wire-integrated-v3-experimental-observable-frame-v1",
    registryId:
      "main-wire-integrated-v3-experimental-observable-registry-v1",
    schemaVersion: 1,
    values: Object.freeze({}),
  }) as unknown as MainWireIntegratedLaneObservableFrameV1;
}

function channelV1(
  channelId: string,
): RuntimePresentationSignalChannelRefV1 {
  return Object.freeze({
    protocolId: "circleheart-studio-runtime-signal-channel-v1",
    channelId,
    sessionId: "existing-session",
    scenarioId: "existing-scenario",
    liveBranchId: "existing-branch",
  });
}

function failureEventV1(
  channelId: string,
): RuntimePresentationSignalFailureV1 {
  return Object.freeze({
    kind: "failure",
    channelId,
    sessionId: "existing-session",
    scenarioId: "existing-scenario",
    liveBranchId: "existing-branch",
    targetGeneration: 0,
    presentationRevision: 0,
    streamEpoch: 0,
    message: "existing event",
  });
}
