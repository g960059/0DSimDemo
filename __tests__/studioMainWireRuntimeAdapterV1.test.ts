import { beforeAll, describe, expect, it, vi } from "vitest";

import {
  createMainWireScientificResearchControlTargetStateV0,
  type MainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls";
import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  projectMainWireScientificObservationV1,
  type MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import {
  MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1,
} from "@/engine/scientific/metrics";
import {
  emptyMainWireScientificFastTbvPreviewV1,
} from "@/engine/scientific/protocols/MainWireScientificFastTbvPreviewV1";
import type {
  MainWireScientificHemodynamicJobSnapshotV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import type {
  MainWireScientificProtocolSourceIdentityV1,
  MainWireScientificVascularFunctionCurveV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicProtocolV1";
import {
  createMainWireScientificSessionExactCheckpointV4,
  createMainWireScientificSessionV1,
  MainWireScientificSessionV1,
  type MainWireScientificSessionExactCheckpointV4,
} from "@/engine/scientific/runtime";
import {
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";
import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificCommandV1,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import {
  MainWireScientificInProcessKernelV1,
} from "@/engine/scientific/worker/MainWireScientificInProcessKernelV1";
import type {
  MainWireScientificWorkerResponseV1,
} from "@/engine/scientificBrowser/MainWireScientificWorkerClientV1";
import {
  MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1,
} from "@/engine/scientificBrowser/mainWireScientificBrowserRuntimeLimitsV1";
import {
  MainWireBrowserWorkerSessionHostV1,
  MainWireSimulationRuntimeAdapterV1,
  MainWireStudioTransientPartialProgressErrorV1,
  createMainWirePresentationBeatAccumulatorV1,
  MAIN_WIRE_STUDIO_MAXIMUM_LIVE_PACING_LAG_MS_V1,
  loadMainWireStudioSnapshotEnvelopeV1,
  mainWireStudioExecutionIdentityV1,
  mainWireStudioInitialLivePacingEpochStateV1,
  mainWireStudioLivePacingDecisionV1,
  mainWireStudioTargetInputSha256V1,
  putMainWireStudioSnapshotEnvelopeV1,
  resolveMainWireStudioTargetInputV1,
  type MainWireStudioCheckpointReceiptV1,
  type MainWireStudioHostedSessionV1,
  type MainWireStudioPeriodicSettlementChunkV1,
  type MainWirePresentationEstimatorInstrumentationV1,
  type MainWireStudioSessionHostFactoryV1,
  type MainWireStudioSessionHostV1,
  type MainWireStudioTransientChunkV1,
} from "@/studio/adapters/mainWire";
import {
  MainWireStudioHemodynamicAnalysisHostV1,
} from "@/studio/adapters/mainWire/MainWireStudioHemodynamicAnalysisHostV1";
import type {
  OpenScenarioRuntimeBranchV1,
  ExactSignalReplayRecipeV1,
  ReplayOriginArtifactRefV1,
  RuntimeControlPatchV1,
  RuntimePresentationSampleBatchV1,
  RuntimePresentationSignalEventV1,
  RuntimeSteadyCandidateV1,
  StudioArtifactRefV1,
  StudioRunArtifactContentV1,
  StudioSettledAnalysisSourceV1,
  StudioJsonWriteV1,
  StudioJsonValueV1,
} from "@/studio/contracts/v1";
import {
  runtimePresentationCanonicalPhaseV1,
} from "@/studio/contracts/v1";
import {
  loadExactSignalExportContentV1,
} from "@/studio";
import {
  STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID,
} from "@/studio/contracts/v1";
import {
  InMemoryContentAddressedArtifactStoreV1,
} from "@/studio/infrastructure/artifacts/InMemoryContentAddressedArtifactStoreV1";
import {
  studioCanonicalJsonStringifyV1,
} from "@/studio/infrastructure/artifacts/studioCanonicalJsonV1";
import {
  buildOfficialHealthyPeriodicDocumentChainV1,
} from "@/tools/scientific/officialHealthyPeriodicDocumentChainV1";

type BaseFixtureV1 = Awaited<ReturnType<typeof createBaseFixtureV1>>;
type StoredSourceV1 = Awaited<ReturnType<typeof storeSourceV1>>;

let baseFixture: BaseFixtureV1;

beforeAll(async () => {
  baseFixture = await createBaseFixtureV1();
}, 30_000);

describe("MainWire Studio snapshot and target input boundaries", () => {
  it("accepts one exact seed point and rejects history claims or tampering", async () => {
    const stored = await storeSourceV1(baseFixture);
    const value = await stored.artifacts.readJson(stored.snapshotRef);
    const expectedIdentity = {
      simulationInputRef: stored.inputRef,
      baseSessionInputSha256: baseFixture.sessionInputSha256,
    };
    const loaded = await loadMainWireStudioSnapshotEnvelopeV1(
      value,
      expectedIdentity,
    );

    expect(loaded.claims).toEqual({
      exactCheckpointStored: true,
      seedObservablePointCount: 1,
      beatSampleHistoryStored: false,
      windowMetricsStored: false,
      presentationStateStored: false,
    });
    expect(loaded.seedObservableFrame).toMatchObject({
      revision: loaded.checkpointV4.transaction.revision,
      acceptedTimeSec: loaded.checkpointV4.transaction.acceptedTimeSec,
    });
    expect(loaded).not.toHaveProperty("beatSamples");

    const selfConsistentForeignCodec = mutableCloneV1(value);
    selfConsistentForeignCodec.checkpointV4.stateCodec.stateSchemaVersion += 1;
    const {
      checkpointSha256: _priorCheckpointSha256,
      ...foreignCodecPayload
    } = selfConsistentForeignCodec.checkpointV4;
    selfConsistentForeignCodec.checkpointV4.checkpointSha256 =
      await sha256CanonicalJsonHex(foreignCodecPayload);
    await expect(
      loadMainWireStudioSnapshotEnvelopeV1(
        selfConsistentForeignCodec,
        expectedIdentity,
      ),
    ).rejects.toThrow(/state-codec identity mismatch/);

    const historyClaim = mutableCloneV1(value);
    historyClaim.claims.seedObservablePointCount = 2;
    await expect(
      loadMainWireStudioSnapshotEnvelopeV1(historyClaim, expectedIdentity),
    ).rejects.toThrow(/snapshot claims mismatch/);

    const shiftedSeed = mutableCloneV1(value);
    shiftedSeed.seedObservableFrame.acceptedTimeSec += 0.002;
    await expect(
      loadMainWireStudioSnapshotEnvelopeV1(shiftedSeed, expectedIdentity),
    ).rejects.toThrow(/revision\/time does not match checkpoint/);

    const wrongSeedSource = mutableCloneV1(value);
    wrongSeedSource.seedObservableFrame.source = "exact-checkpoint-restore";
    await expect(
      loadMainWireStudioSnapshotEnvelopeV1(wrongSeedSource, expectedIdentity),
    ).rejects.toThrow(/seed observable frame identity is invalid/);

    const wrongSeedQuality = mutableCloneV1(value);
    wrongSeedQuality.seedObservableFrame.values[
      "hemodynamics.volume.LV"
    ].quality = "accepted-derived";
    await expect(
      loadMainWireStudioSnapshotEnvelopeV1(wrongSeedQuality, expectedIdentity),
    ).rejects.toThrow(/observable hemodynamics\.volume\.LV is invalid/);

    const extraHistory = mutableCloneV1(value);
    extraHistory.beatSamples = [];
    await expect(
      loadMainWireStudioSnapshotEnvelopeV1(extraHistory, expectedIdentity),
    ).rejects.toThrow(/field set mismatch/);

    const alteredCheckpoint = mutableCloneV1(value);
    alteredCheckpoint.checkpointV4.parameterEpoch += 1;
    await expect(
      loadMainWireStudioSnapshotEnvelopeV1(
        alteredCheckpoint,
        expectedIdentity,
      ),
    ).rejects.toThrow(/outer SHA-256 mismatch/);
  });

  it("accepts only exact model control IDs and binds the complete target identity", async () => {
    const source = baseFixture.checkpoint.controlTargetState;
    const first = await resolveMainWireStudioTargetInputV1(
      source,
      baseFixture.sessionInputSha256,
      {
        "circulation.systemic-vascular-resistance-scale": 1.5,
        "ventilation.peep-cm-h2o": 5,
      },
    );
    const reordered = await resolveMainWireStudioTargetInputV1(
      source,
      baseFixture.sessionInputSha256,
      {
        "ventilation.peep-cm-h2o": 5,
        "circulation.systemic-vascular-resistance-scale": 1.5,
      },
    );

    expect(reordered.patch.targetInputSha256)
      .toBe(first.patch.targetInputSha256);
    expect(first.targetState.controls).toMatchObject({
      "circulation.systemic-vascular-resistance-scale": 1.5,
      "ventilation.peep-cm-h2o": 5,
    });
    expect(first.patch.values).toEqual(first.targetState.controls);
    expect(
      await mainWireStudioTargetInputSha256V1(
        first.targetState,
        "f".repeat(64),
      ),
    ).not.toBe(first.patch.targetInputSha256);
    await expect(resolveMainWireStudioTargetInputV1(
      source,
      baseFixture.sessionInputSha256,
      { systemicResistanceScale: 1.5 },
    )).rejects.toThrow(/unknown control ID systemicResistanceScale/);
    await expect(resolveMainWireStudioTargetInputV1(
      source,
      baseFixture.sessionInputSha256,
      {},
    )).rejects.toThrow(/at least one control value/);
  });
});

describe("MainWire browser Worker host seam", () => {
  it("routes V4 restore through its exclusive client and fails closed on foreign sessions", async () => {
    const request = vi.fn(async (command: {
      kind: string;
      requestId: string;
      sessionId: string;
    }) => ({
      protocolId: "circleheart-scientific-command-v1",
      requestId: command.requestId,
      sessionId: command.sessionId,
      commandKind: "restoreExactSessionV4",
      ok: true,
      releaseRef: baseFixture.checkpoint.releaseRef,
      sessionOrigin: {
        kind: "control-aware-exact-checkpoint-v4-restore",
        checkpointSchemaVersion: 4,
        checkpointSha256: baseFixture.checkpoint.checkpointSha256,
        baseSessionInputSha256: baseFixture.sessionInputSha256,
        controlTargetStateSha256:
          baseFixture.checkpoint.controlTargetStateSha256,
        parameterEpoch: baseFixture.checkpoint.parameterEpoch,
      },
      payload: {
        kind: "sessionRestoredV4",
        researchControlContext: {
          stateIdentity: {
            revision: baseFixture.frame.revision,
            acceptedTimeSec: baseFixture.frame.acceptedTimeSec,
            totalBloodVolumeMl:
              baseFixture.stateIdentity.totalBloodVolumeMl,
          },
          controlState: baseFixture.checkpoint.controlTargetState,
          parameterEpoch: baseFixture.checkpoint.parameterEpoch,
        },
        observableFrame: {
          ...baseFixture.frame,
          source: "exact-checkpoint-restore",
        },
      },
      error: null,
    }));
    const terminate = vi.fn();
    const host = new MainWireBrowserWorkerSessionHostV1({
      hostId: "exclusive-worker",
      client: { request, terminate } as never,
    });

    const restored = await host.restoreV4({
      sessionId: "worker-session",
      resolvedSessionInput: baseFixture.sessionInput,
      checkpointV4: baseFixture.checkpoint,
    });

    expect(restored).toMatchObject({
      hostId: "exclusive-worker",
      sessionId: "worker-session",
      baseSessionInputSha256: baseFixture.sessionInputSha256,
      parameterEpoch: 0,
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0]![0]).toMatchObject({
      kind: "restoreExactSessionV4",
      sessionId: "worker-session",
      resolvedSessionInput: baseFixture.sessionInput,
      checkpoint: baseFixture.checkpoint,
    });

    await expect(host.runTransient({
      session: { ...restored, hostId: "another-worker" },
      dtSec: 0.002,
      stepCount: 1,
      observationStride: 1,
    })).rejects.toThrow(/belongs to another-worker/);
    expect(request).toHaveBeenCalledTimes(1);

    host.terminate();
    host.terminate();
    expect(terminate).toHaveBeenCalledTimes(1);
  });
});

describe("MainWire Studio runtime adapter", () => {
  it("measures normal pacing and catches up transient lag against one fake clock", () => {
    const clock = new FakeMonotonicClockV1();
    let state = mainWireStudioInitialLivePacingEpochStateV1({
      wallNowMs: 0,
      acceptedSimulationNowSec: 0,
      mode: "realtime-1x",
      cumulativeRebasedDeficitMs: 0,
    });
    clock.advance(20);
    const normal = mainWireStudioLivePacingDecisionV1({
      state,
      wallNowMs: clock.nowMs(),
      acceptedSimulationNowSec: 0.032,
      activeWallDurationMs: 20,
    });
    expect(normal.delayMs).toBe(12);
    expect(normal.livePacing).toEqual({
      mode: "realtime-1x",
      epochLagMs: 0,
      // 32 ms of accepted simulation for 20 ms of compute. The rate reports
      // from the partial window rather than withholding a number until a full
      // cycle exists.
      recentAchievedRate: 1.6,
      cumulativeRebasedDeficitMs: 0,
    });
    expect(normal.didRebase).toBe(false);
    state = normal.nextState;
    clock.advance(normal.delayMs);

    clock.advance(40);
    const lagging = mainWireStudioLivePacingDecisionV1({
      state,
      wallNowMs: clock.nowMs(),
      acceptedSimulationNowSec: 0.064,
      activeWallDurationMs: 40,
    });
    expect(lagging.delayMs).toBe(0);
    expect(lagging.livePacing.epochLagMs).toBe(8);
    expect(lagging.livePacing.mode).toBe("realtime-1x");
    expect(lagging.didRebase).toBe(false);
    state = lagging.nextState;

    // The next fast chunk catches up the prior 8 ms deficit and waits only
    // until the cumulative 96 ms deadline. Lag is not a one-way ratchet.
    clock.advance(10);
    const recovered = mainWireStudioLivePacingDecisionV1({
      state,
      wallNowMs: clock.nowMs(),
      acceptedSimulationNowSec: 0.096,
      activeWallDurationMs: 10,
    });
    expect(recovered.delayMs).toBe(14);
    expect(recovered.livePacing.epochLagMs).toBe(0);
    expect(recovered.didRebase).toBe(false);
  });

  it("matches stride-1 pacing mode, achieved rate, and deficit under a fake clock", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    harness.yieldRunToTimer = true;
    const clock = new FakeMonotonicClockV1();
    const activeDurationsMs: number[] = [];
    const durationScheduleMs = [20, 40, 10, 100];
    harness.onRunTransient = () => {
      const duration = durationScheduleMs[
        Math.min(activeDurationsMs.length, durationScheduleMs.length - 1)
      ]!;
      activeDurationsMs.push(duration);
      clock.advance(duration);
    };
    const adapter = runtimeAdapterV1(stored, harness, {
      liveStepCountPerChunk: 16,
      nowMs: clock.nowMs,
      delayMs: clock.delayMs,
    });
    const opened = await adapter.openSession({
      sessionId: "stride-independent-pacing-session",
      branches: [sourceBranchV1(stored, "stride-independent-pacing-scenario")],
    });
    const branch = opened.branches[0]!;
    const batches: RuntimePresentationSampleBatchV1[] = [];
    adapter.subscribePresentationSignalChannel(
      branch.presentationSignalChannelRef,
      (event) => {
        if (event.kind === "samples") batches.push(event);
      },
    );

    await adapter.resumePresentationSignalChannel(
      branch.presentationSignalChannelRef,
      0,
    );
    await waitForV1(() => batches.length >= 3);
    await adapter.suspendPresentationSignalChannel(
      branch.presentationSignalChannelRef,
    );

    let referenceWallNowMs = 0;
    let referenceState = mainWireStudioInitialLivePacingEpochStateV1({
      wallNowMs: referenceWallNowMs,
      acceptedSimulationNowSec: baseFixture.frame.acceptedTimeSec,
      mode: "realtime-1x",
      cumulativeRebasedDeficitMs: 0,
    });
    for (const [index, batch] of batches.entries()) {
      const activeWallDurationMs = activeDurationsMs[index]!;
      referenceWallNowMs += activeWallDurationMs;
      // A stride-1 observer would retain all 16 accepted steps, but pacing is
      // driven by the same accepted endpoint and fake-clock duration.
      const strideOneReference = mainWireStudioLivePacingDecisionV1({
        state: referenceState,
        wallNowMs: referenceWallNowMs,
        acceptedSimulationNowSec:
          batch.samples.at(-1)!.acceptedTimeSec,
        activeWallDurationMs,
      });
      expect(batch.samples).toHaveLength(1);
      expect(batch.livePacing).toEqual(strideOneReference.livePacing);
      referenceState = strideOneReference.nextState;
      referenceWallNowMs += strideOneReference.delayMs;
    }
    expect(harness.hosts[0]!.runTransientInputs.slice(0, batches.length))
      .toEqual(batches.map(() => ({
        stepCount: 16,
        observationStride: 16,
      })));
    await adapter.closeSession("stride-independent-pacing-session");
  });

  it("re-anchors past one cycle of lag instead of failing, and only recovers after a full cycle at 1x", () => {
    // Each chunk advances 32 ms of model time but costs 100 ms of wall time,
    // so the epoch deficit grows by 68 ms per chunk.
    let state = mainWireStudioInitialLivePacingEpochStateV1({
      wallNowMs: 0,
      acceptedSimulationNowSec: 0,
      mode: "realtime-1x",
      cumulativeRebasedDeficitMs: 0,
    });
    let wallNowMs = 0;
    let acceptedSimulationNowSec = 0;
    let rebaseCount = 0;
    let cumulativeAfterFirstRebase = 0;
    let lastDecision: ReturnType<typeof mainWireStudioLivePacingDecisionV1>
      | null = null;
    // Run overload until the second re-anchor, then stop exactly there so the
    // recovery window starts empty and its horizon is unambiguous.
    for (let chunk = 0; chunk < 200 && rebaseCount < 2; chunk += 1) {
      wallNowMs += 100;
      acceptedSimulationNowSec += 0.032;
      lastDecision = mainWireStudioLivePacingDecisionV1({
        state,
        wallNowMs,
        acceptedSimulationNowSec,
        activeWallDurationMs: 100,
      });
      expect(lastDecision.delayMs).toBe(0);
      // Post-decision lag stays inside one cycle: that is what re-anchoring buys.
      expect(lastDecision.livePacing.epochLagMs)
        .toBeLessThanOrEqual(MAIN_WIRE_STUDIO_MAXIMUM_LIVE_PACING_LAG_MS_V1);
      if (lastDecision.didRebase) {
        rebaseCount += 1;
        expect(lastDecision.rebasedDeficitMs)
          .toBeGreaterThan(MAIN_WIRE_STUDIO_MAXIMUM_LIVE_PACING_LAG_MS_V1);
        if (rebaseCount === 1) {
          cumulativeAfterFirstRebase =
            lastDecision.livePacing.cumulativeRebasedDeficitMs;
        }
      }
      state = lastDecision.nextState;
    }
    expect(rebaseCount).toBe(2);
    expect(state.mode).toBe("degraded");
    // A re-anchor clears recovery evidence but never the reported rate, so the
    // lane can still say how slow it is while it is too slow to ever recover.
    expect(state.recoveryRateWindow).toHaveLength(0);
    expect(state.reportingRateWindow.length).toBeGreaterThan(0);
    expect(lastDecision!.livePacing.recentAchievedRate).toBeGreaterThan(0);
    expect(lastDecision!.livePacing.recentAchievedRate).toBeLessThan(1);
    // Cumulative slowdown stays explicit rather than being absorbed.
    expect(lastDecision!.livePacing.cumulativeRebasedDeficitMs)
      .toBeGreaterThan(cumulativeAfterFirstRebase);

    // Compute recovers to 16 ms per 32 ms chunk (2x realtime). Recovery waits
    // for a whole canonical cycle of that, not merely a small instantaneous lag.
    let recoveredAt: number | null = null;
    for (let chunk = 0; chunk < 64 && recoveredAt === null; chunk += 1) {
      wallNowMs += 32;
      acceptedSimulationNowSec += 0.032;
      const decision = mainWireStudioLivePacingDecisionV1({
        state,
        wallNowMs,
        acceptedSimulationNowSec,
        activeWallDurationMs: 16,
      });
      state = decision.nextState;
      if (decision.livePacing.mode === "realtime-1x") {
        recoveredAt = chunk + 1;
        expect(decision.livePacing.recentAchievedRate).toBeGreaterThanOrEqual(1);
      }
    }
    // 1,000 ms of accepted simulation at 32 ms per chunk needs 32 chunks.
    // Recovery cannot be claimed before the window holds a complete cycle,
    // however small the instantaneous lag has become.
    expect(recoveredAt).toBe(32);
  });

  it("carries outstanding lag across a loop re-anchor instead of forgiving it", () => {
    let state = mainWireStudioInitialLivePacingEpochStateV1({
      wallNowMs: 0,
      acceptedSimulationNowSec: 0,
      mode: "realtime-1x",
      cumulativeRebasedDeficitMs: 0,
    });
    // 32 ms of model time took 140 ms, so the lane owes 108 ms.
    const lagging = mainWireStudioLivePacingDecisionV1({
      state,
      wallNowMs: 140,
      acceptedSimulationNowSec: 0.032,
      activeWallDurationMs: 140,
    });
    expect(lagging.livePacing.epochLagMs).toBe(108);

    // A loop restart re-anchors. The debt must survive it: a resumed lane that
    // silently starts from zero would absorb lag the contract says is never
    // absorbed.
    state = mainWireStudioInitialLivePacingEpochStateV1({
      wallNowMs: 500,
      acceptedSimulationNowSec: 0.032,
      mode: lagging.livePacing.mode,
      cumulativeRebasedDeficitMs:
        lagging.livePacing.cumulativeRebasedDeficitMs,
      epochLagMs: lagging.livePacing.epochLagMs,
    });
    const afterRestart = mainWireStudioLivePacingDecisionV1({
      state,
      wallNowMs: 532,
      acceptedSimulationNowSec: 0.064,
      activeWallDurationMs: 32,
    });
    expect(afterRestart.livePacing.epochLagMs).toBe(108);
    expect(afterRestart.delayMs).toBe(0);
  });

  it("does not re-anchor at exactly the declared lag budget", () => {
    const state = mainWireStudioInitialLivePacingEpochStateV1({
      wallNowMs: 0,
      acceptedSimulationNowSec: 0,
      mode: "realtime-1x",
      cumulativeRebasedDeficitMs: 0,
    });
    const atBudget = mainWireStudioLivePacingDecisionV1({
      state,
      wallNowMs: 32 + MAIN_WIRE_STUDIO_MAXIMUM_LIVE_PACING_LAG_MS_V1,
      acceptedSimulationNowSec: 0.032,
      activeWallDurationMs: 1,
    });
    expect(atBudget.didRebase).toBe(false);
    expect(atBudget.livePacing.mode).toBe("realtime-1x");
    expect(atBudget.livePacing.epochLagMs)
      .toBe(MAIN_WIRE_STUDIO_MAXIMUM_LIVE_PACING_LAG_MS_V1);

    const pastBudget = mainWireStudioLivePacingDecisionV1({
      state,
      wallNowMs: 33 + MAIN_WIRE_STUDIO_MAXIMUM_LIVE_PACING_LAG_MS_V1,
      acceptedSimulationNowSec: 0.032,
      activeWallDurationMs: 1,
    });
    expect(pastBudget.didRebase).toBe(true);
    expect(pastBudget.livePacing.mode).toBe("degraded");
    expect(pastBudget.livePacing.epochLagMs).toBe(0);
    expect(pastBudget.livePacing.cumulativeRebasedDeficitMs)
      .toBe(MAIN_WIRE_STUDIO_MAXIMUM_LIVE_PACING_LAG_MS_V1 + 1);
  });

  it("keeps the live lane running under sustained overload and reports degraded pacing", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    harness.yieldRunToTimer = true;
    const clock = new FakeMonotonicClockV1();
    const adapter = runtimeAdapterV1(stored, harness, {
      liveStepCountPerChunk: 16,
      nowMs: clock.nowMs,
      delayMs: clock.delayMs,
    });
    const opened = await adapter.openSession({
      sessionId: "live-pacing-overload-session",
      branches: [sourceBranchV1(stored, "live-pacing-overload-scenario")],
    });
    const branch = opened.branches[0]!;
    const events: RuntimePresentationSignalEventV1[] = [];
    adapter.subscribePresentationSignalChannel(branch.presentationSignalChannelRef, (event) => {
      events.push(event);
    });
    // Each command advances only 32 ms of model time but consumes 100 ms of
    // fake wall time. The cumulative deficit therefore grows by 68 ms/chunk,
    // so the old 1,000 ms fatal cap is crossed after ~15 chunks. The lane must
    // survive far past that, across more than one re-anchor.
    harness.onRunTransient = () => clock.advance(100);

    const rebaseTotalsV1 = (): readonly number[] => [
      ...new Set(
        events
          .filter((event) => event.kind === "samples")
          .map((event) => event.livePacing.cumulativeRebasedDeficitMs)
          .filter((total) => total > 0),
      ),
    ];
    await adapter.resumePresentationSignalChannel(branch.presentationSignalChannelRef, 0);
    // Each distinct nonzero cumulative total is one re-anchor, so this waits
    // for the lane to survive two of them rather than merely reach degraded.
    await waitForV1(() => rebaseTotalsV1().length >= 2);

    const batches = events.filter((event) => event.kind === "samples");
    expect(events.some(({ kind }) => kind === "failure")).toBe(false);
    // Crossing the old cap must be demonstrated, not assumed. At 68 ms of
    // deficit per chunk the retired 1,000 ms cap would have fired on chunk 15,
    // so reaching a second re-anchor is twice the lifetime the old lane had.
    expect(batches.length).toBeGreaterThanOrEqual(30);

    let previousOrdinal: number | null = null;
    let previousTimeSec: number | null = null;
    for (const batch of batches) {
      for (const sample of batch.samples) {
        if (previousOrdinal !== null) {
          expect(sample.presentationOrdinal).toBe(previousOrdinal + 1);
          expect(sample.acceptedTimeSec).toBeGreaterThan(previousTimeSec!);
        }
        previousOrdinal = sample.presentationOrdinal;
        previousTimeSec = sample.acceptedTimeSec;
      }
      expect(batch.livePacing.epochLagMs)
        .toBeLessThanOrEqual(MAIN_WIRE_STUDIO_MAXIMUM_LIVE_PACING_LAG_MS_V1);
    }

    const degraded = batches.filter(
      (batch) => batch.livePacing.mode === "degraded",
    );
    expect(degraded.length).toBeGreaterThanOrEqual(2);
    // Each re-anchor adds its discarded deficit, so the reported total grows.
    expect(degraded.at(-1)!.livePacing.cumulativeRebasedDeficitMs)
      .toBeGreaterThan(degraded[0]!.livePacing.cumulativeRebasedDeficitMs);

    // The lane is still streaming, not merely alive: commands keep being
    // issued and batches keep arriving well past the second re-anchor.
    const observedCallCount = harness.hosts[0]!.runTransientCallCount;
    const observedBatchCount = batches.length;
    await waitForV1(() =>
      harness.hosts[0]!.runTransientCallCount > observedCallCount
      && events.filter((event) => event.kind === "samples").length
        > observedBatchCount);
    expect(events.some(({ kind }) => kind === "failure")).toBe(false);
    await adapter.closeSession("live-pacing-overload-session");
  });

  it("retains and finalizes canonical beat boundaries through the production adapter and Worker emission path", async () => {
    const productionFixture = Object.freeze({
      ...baseFixture,
      checkpoint: baseFixture.strictCheckpoint,
      frame: baseFixture.strictFrame,
    });
    const stored = await storeSourceV1(productionFixture);
    let hostOrdinal = 0;
    const transientCommands: Array<Readonly<{
      stepCount: number;
      observationStride: number;
    }>> = [];
    const adapter = new MainWireSimulationRuntimeAdapterV1({
      artifacts: stored.artifacts,
      liveStepCountPerChunk: 16,
      nowMs: () => 0,
      delayMs: () => delayV1(0),
      hostFactory: () => {
        const kernel = new MainWireScientificInProcessKernelV1({
          maximumRequestCountPerKernelLifetime:
            MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
              .maximumRequestCountPerLifetime,
          maximumSessionIdentityCountPerKernelLifetime:
            MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
              .maximumSessionIdentityCountPerLifetime,
          maximumTransientStepCountPerCommand:
            MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
              .maximumTransientStepCountPerCommand,
          maximumOutputFrameCountPerCommand:
            MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
              .maximumOutputFrameCountPerCommand,
        });
        hostOrdinal += 1;
        return new MainWireBrowserWorkerSessionHostV1({
          hostId: `production-path-host-${hostOrdinal}`,
          client: {
            request: (command: ScientificCommandV1) => {
              if (command.kind === "runTransient") {
                transientCommands.push(Object.freeze({
                  stepCount: command.stepCount,
                  observationStride: command.observationStride,
                }));
              }
              return kernel.handle(command);
            },
            terminate: vi.fn(),
          } as never,
        });
      },
    });
    const opened = await adapter.openSession({
      sessionId: "production-boundary-retention-session",
      branches: [sourceBranchV1(
        stored,
        "production-boundary-retention-scenario",
      )],
    });
    const branch = opened.branches[0]!;
    expect(branch.initialPresentation.sample).toMatchObject({
      acceptedRevision:
        productionFixture.checkpoint.transaction.revision,
      acceptedTimeSec:
        productionFixture.checkpoint.transaction.acceptedTimeSec,
      phase: 0,
      retentionReason: "stream-boundary",
    });
    const events: RuntimePresentationSignalEventV1[] = [];
    adapter.subscribePresentationSignalChannel(
      branch.presentationSignalChannelRef,
      (event) => events.push(event),
    );

    await adapter.resumePresentationSignalChannel(
      branch.presentationSignalChannelRef,
      0,
    );
    await waitForV1(() =>
      events.some(({ kind }) => kind === "failure")
      || events.some((event) =>
        event.kind === "samples"
        && event.metricState.completedBeatCount >= 2
      ));
    await adapter.suspendPresentationSignalChannel(
      branch.presentationSignalChannelRef,
    );

    const failure = events.find(({ kind }) => kind === "failure");
    expect(failure).toBeUndefined();
    const batches = events.filter((event) => event.kind === "samples");
    const firstTwoCycles = transientCommands.slice(0, 64);
    expect(firstTwoCycles).toHaveLength(64);
    expect(firstTwoCycles.every(({ observationStride }) =>
      observationStride === 16
    )).toBe(true);
    expect(firstTwoCycles.map(({ stepCount }) => stepCount)).toEqual([
      ...Array.from({ length: 31 }, () => 16),
      4,
      ...Array.from({ length: 31 }, () => 16),
      4,
    ]);
    const samples = batches.flatMap((batch) => batch.samples);
    for (const acceptedRevision of [
      productionFixture.checkpoint.transaction.revision + 500,
      productionFixture.checkpoint.transaction.revision + 1_000,
    ]) {
      expect(samples.find((sample) =>
        sample.acceptedRevision === acceptedRevision
      )).toMatchObject({
        phase: 0,
        retentionReason: "canonical-beat-boundary",
      });
    }
    expect(batches.at(-1)!.samples.at(-1)!.acceptedRevision)
      .toBeGreaterThanOrEqual(
        productionFixture.checkpoint.transaction.revision + 1_000,
      );
    expect(batches.at(-1)!.metricState).toMatchObject({
      status: "complete",
      completedBeatCount: 2,
      latestBeatEstimate: {
        startAcceptedRevision:
          productionFixture.checkpoint.transaction.revision + 500,
        endAcceptedRevision:
          productionFixture.checkpoint.transaction.revision + 1_000,
        evidence: {
          bothCanonicalBeatBoundariesRetained: true,
          exportEquivalent: false,
        },
      },
    });
    const exactResult = await adapter.exportExactSignals({
      sessionId: "production-boundary-retention-session",
      scenarioId: "production-boundary-retention-scenario",
      liveBranchId: branch.liveBranchId,
      targetGeneration: 0,
      presentationRevision: 0,
      intervalStartOffsetSec: 0,
      intervalDurationSec: 1,
    });
    const exactContent = await loadExactSignalExportContentV1(
      await stored.artifacts.readJson(exactResult.artifactRef),
    );
    const exactAccumulator =
      createMainWirePresentationBeatAccumulatorV1();
    let exactEstimate = null;
    for (const [ordinal, sample] of exactContent.samples.entries()) {
      // Exact restore has no kernel read command for reconstructing the
      // observable vector at the restore point. Use the production-projected
      // source boundary that the live adapter actually opened; every accepted
      // interval after it comes from the stride-1 exact replay artifact.
      const values = ordinal === 0
        ? branch.initialPresentation.sample.values
        : Object.fromEntries(
          Object.entries(sample.values).flatMap(([id, value]) =>
            value.availability === "available" && value.value !== null
              ? [[id, value.value]]
              : []
          ),
        );
      exactEstimate = exactAccumulator.update(Object.freeze({
        coverage: "decimated-presentation" as const,
        presentationOrdinal: ordinal,
        acceptedRevision: sample.revision,
        acceptedTimeSec: sample.simulationTimeSec,
        acceptedStepSpanFromPrevious: ordinal === 0 ? 0 : 1,
        phase: runtimePresentationCanonicalPhaseV1(sample.revision),
        values: Object.freeze(values),
        retentionReason: ordinal === 0
          ? "stream-boundary" as const
          : runtimePresentationCanonicalPhaseV1(sample.revision) === 0
            ? "canonical-beat-boundary" as const
            : "observation-stride" as const,
      }));
    }
    const decimatedEstimate = batches.find((batch) =>
      batch.metricState.completedBeatCount === 1
    )?.metricState.latestBeatEstimate;
    expect(decimatedEstimate).toMatchObject({
      retainedSampleCount: 33,
      evidence: {
        exportEquivalent: false,
      },
    });
    const firstCycleSamples = samples.filter(({ acceptedRevision }) =>
      acceptedRevision
        <= productionFixture.checkpoint.transaction.revision + 500
    );
    expect(firstCycleSamples).toHaveLength(32);
    expect(Math.max(...samples.map(
      ({ acceptedStepSpanFromPrevious }) => acceptedStepSpanFromPrevious,
    ))).toBe(16);
    expect(exactContent.samples).toHaveLength(501);
    expect(
      100 * (1 - firstCycleSamples.length / 500),
    ).toBeCloseTo(93.6, 12);

    for (const definition of
      MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1) {
      const exact = exactEstimate!.values[definition.metricId]!;
      const decimated = decimatedEstimate!.values[definition.metricId]!;
      const unsupported =
        definition.quantityKind === "reverse-cycle-volume"
        || definition.quantityKind === "same-valve-regurgitant-fraction"
        || definition.quantityKind === "forward-flow-peak-gradient"
        || definition.quantityKind === "forward-flow-time-mean-gradient";
      if (unsupported) {
        expect(decimated).toMatchObject({
          value: null,
          availability: "not-measurable",
          unavailableReason: "presentation-decimation-unsupported",
        });
        continue;
      }
      expect(exact.value, definition.metricId).not.toBeNull();
      expect(decimated.availability).toBe("available");
      const relativeErrorPercent =
        100 * Math.abs(decimated.value! - exact.value!)
          / Math.abs(exact.value!);
      expect(relativeErrorPercent).toBeLessThanOrEqual(8);
    }

    const internal = internalAdapterBranchV1(
      adapter,
      "production-boundary-retention-session",
      "production-boundary-retention-scenario",
    );
    const liveCheckpoint = await internal.host.checkpointV4(
      internal.hostedSession,
    );
    const referenceKernel = new MainWireScientificInProcessKernelV1({
      maximumRequestCountPerKernelLifetime:
        MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
          .maximumRequestCountPerLifetime,
      maximumSessionIdentityCountPerKernelLifetime:
        MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
          .maximumSessionIdentityCountPerLifetime,
      maximumTransientStepCountPerCommand:
        MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
          .maximumTransientStepCountPerCommand,
      maximumOutputFrameCountPerCommand:
        MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
          .maximumOutputFrameCountPerCommand,
    });
    const referenceHost = new MainWireBrowserWorkerSessionHostV1({
      hostId: "production-stride-one-reference-host",
      client: {
        request: (command: ScientificCommandV1) =>
          referenceKernel.handle(command),
        terminate: vi.fn(),
      } as never,
    });
    let referenceSession = await referenceHost.restoreV4({
      sessionId: "production-stride-one-reference-session",
      resolvedSessionInput: productionFixture.sessionInput,
      checkpointV4: productionFixture.checkpoint,
    });
    let remainingReferenceSteps =
      liveCheckpoint.session.stateIdentity.revision
      - productionFixture.checkpoint.transaction.revision;
    while (remainingReferenceSteps > 0) {
      const stepCount = Math.min(16, remainingReferenceSteps);
      const chunk = await referenceHost.runTransient({
        session: referenceSession,
        dtSec: 0.002,
        stepCount,
        observationStride: 1,
      });
      referenceSession = chunk.session;
      remainingReferenceSteps -= stepCount;
    }
    const referenceCheckpoint =
      await referenceHost.checkpointV4(referenceSession);
    expect(liveCheckpoint.checkpointV4)
      .toEqual(referenceCheckpoint.checkpointV4);
    referenceHost.terminate();
    await adapter.closeSession("production-boundary-retention-session");
  }, 30_000);

  it("keeps streaming when the clock is too coarse to resolve the pacing delay", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    harness.yieldRunToTimer = true;
    // A clock that never advances is the limiting case of the real browser one:
    // once compute outruns realtime the residual delay falls below the host
    // clock's granularity, so a wait can return with the reading unchanged.
    // The lane must publish and continue rather than treat that as a fault.
    const adapter = runtimeAdapterV1(stored, harness, {
      liveStepCountPerChunk: 16,
      nowMs: () => 1_000,
      delayMs: async () => {
        await delayV1(0);
      },
    });
    const opened = await adapter.openSession({
      sessionId: "live-pacing-coarse-clock-session",
      branches: [sourceBranchV1(stored, "live-pacing-coarse-clock-scenario")],
    });
    const branch = opened.branches[0]!;
    const events: RuntimePresentationSignalEventV1[] = [];
    adapter.subscribePresentationSignalChannel(branch.presentationSignalChannelRef, (event) => {
      events.push(event);
    });

    await adapter.resumePresentationSignalChannel(branch.presentationSignalChannelRef, 0);
    await waitForV1(() =>
      events.filter((event) => event.kind === "samples").length >= 4);
    expect(events.some(({ kind }) => kind === "failure")).toBe(false);

    const observed = events.filter((event) => event.kind === "samples").length;
    await waitForV1(() =>
      events.filter((event) => event.kind === "samples").length > observed);
    expect(events.some(({ kind }) => kind === "failure")).toBe(false);
    await adapter.closeSession("live-pacing-coarse-clock-session");
  });

  it("waits before publishing so presentation never runs ahead of 1x", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    harness.yieldRunToTimer = true;
    const clock = new FakeMonotonicClockV1();
    const adapter = runtimeAdapterV1(stored, harness, {
      liveStepCountPerChunk: 16,
      nowMs: clock.nowMs,
      delayMs: clock.delayMs,
    });
    const opened = await adapter.openSession({
      sessionId: "live-pacing-delay-session",
      branches: [sourceBranchV1(stored, "live-pacing-delay-scenario")],
    });
    const branch = opened.branches[0]!;
    const publishedAtMs: number[] = [];
    adapter.subscribePresentationSignalChannel(branch.presentationSignalChannelRef, (event) => {
      if (event.kind === "samples") publishedAtMs.push(clock.nowMs());
    });
    // Compute is far faster than realtime: 1 ms of wall time per 32 ms chunk.
    harness.onRunTransient = () => clock.advance(1);

    await adapter.resumePresentationSignalChannel(branch.presentationSignalChannelRef, 0);
    await waitForV1(() => publishedAtMs.length >= 4);

    // Every batch is released at or after its 1x deadline. Publishing first and
    // sleeping afterwards would let presentation run a whole chunk ahead.
    for (const [index, atMs] of publishedAtMs.slice(0, 4).entries()) {
      expect(atMs).toBeGreaterThanOrEqual((index + 1) * 32);
    }
    await adapter.closeSession("live-pacing-delay-session");
  });

  it("reports a throwing live observer through the signal failure channel without detaching it", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    harness.yieldRunToTimer = true;
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "throwing-live-observer-session",
      branches: [sourceBranchV1(stored, "throwing-live-observer-scenario")],
    });
    const branch = opened.branches[0]!;
    const throwingObserverKinds: RuntimePresentationSignalEventV1["kind"][] = [];
    const healthyObserverEvents: RuntimePresentationSignalEventV1[] = [];
    adapter.subscribePresentationSignalChannel(branch.presentationSignalChannelRef, (event) => {
      throwingObserverKinds.push(event.kind);
      throw new Error("synthetic live observer failure");
    });
    adapter.subscribePresentationSignalChannel(branch.presentationSignalChannelRef, (event) => {
      healthyObserverEvents.push(event);
    });

    await adapter.resumePresentationSignalChannel(branch.presentationSignalChannelRef, 0);
    await waitForV1(() =>
      healthyObserverEvents.some(({ kind }) => kind === "failure"));

    expect(throwingObserverKinds).toEqual(["samples", "failure"]);
    expect(healthyObserverEvents.map(({ kind }) => kind))
      .toEqual(["samples", "failure"]);
    expect(healthyObserverEvents.at(-1)).toMatchObject({
      kind: "failure",
      message: expect.stringMatching(
        /live signal observer callback failed: synthetic live observer failure/,
      ),
    });
    const stoppedCallCount = harness.hosts[0]!.runTransientCallCount;
    await delayV1(5);
    expect(harness.hosts[0]!.runTransientCallCount).toBe(stoppedCallCount);
    await expect(
      adapter.resumePresentationSignalChannel(branch.presentationSignalChannelRef, 0),
    ).rejects.toThrow(/live signal observer callback failed/);
    await adapter.closeSession("throwing-live-observer-session");
  });

  it("terminates every opening host when close wins a blocked restore", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    const restoreGate = deferredV1<void>();
    harness.restoreGatesByHostOrdinal.set(0, restoreGate);
    const adapter = runtimeAdapterV1(stored, harness);
    const command = {
      sessionId: "cancelled-open-session",
      branches: [sourceBranchV1(stored, "scenario")],
    };

    const opening = adapter.openSession(command);
    const openingResult = expect(opening).rejects.toThrow(
      /opening was aborted|is terminated/,
    );
    await waitForV1(() => harness.hosts.length === 1);

    await adapter.closeSession(command.sessionId);
    expect(harness.hosts[0]!.terminated).toBe(true);

    restoreGate.resolve();
    await openingResult;
    expect(harness.hosts[0]!.sessions.size).toBe(0);

    await expect(adapter.openSession(command)).resolves.toMatchObject({
      sessionId: command.sessionId,
    });
    await adapter.closeSession(command.sessionId);
    expect(harness.hosts[1]!.terminated).toBe(true);
  });

  it("streams fixed-stride presentation samples and suspends/resumes at host command boundaries", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    const onSampleUpdate = vi.fn();
    const onBeatFinalized = vi.fn();
    const adapter = runtimeAdapterV1(stored, harness, {
      presentationEstimatorInstrumentation: {
        onSampleUpdate,
        onBeatFinalized,
      },
    });
    const opened = await adapter.openSession({
      sessionId: "signal-session",
      branches: [sourceBranchV1(stored, "signal-scenario")],
    });
    const branch = opened.branches[0]!;
    const batches: RuntimePresentationSampleBatchV1[] = [];
    const subscription = adapter.subscribePresentationSignalChannel(
      branch.presentationSignalChannelRef,
      (event) => {
        if (event.kind === "samples") batches.push(event);
      },
    );

    await adapter.resumePresentationSignalChannel(branch.presentationSignalChannelRef, 0);
    await waitForV1(() => batches.length >= 1);
    await adapter.suspendPresentationSignalChannel(branch.presentationSignalChannelRef);
    const countAtSuspend = harness.hosts[0]!.runTransientCallCount;
    await delayV1(5);

    expect(harness.hosts[0]!.runTransientCallCount).toBe(countAtSuspend);
    expect(batches[0]).toMatchObject({
      channelId: branch.presentationSignalChannelRef.channelId,
      sessionId: "signal-session",
      scenarioId: "signal-scenario",
      liveBranchId: branch.liveBranchId,
      targetGeneration: 0,
      presentationRevision: 0,
      streamEpoch: 0,
    });
    expect(batches[0]!.samples).toHaveLength(1);
    expect(batches[0]!.samples[0]).toMatchObject({
      acceptedStepSpanFromPrevious: 2,
      retentionReason: "observation-stride",
    });

    await adapter.resumePresentationSignalChannel(branch.presentationSignalChannelRef, 0);
    await waitForV1(
      () => harness.hosts[0]!.runTransientCallCount > countAtSuspend,
    );
    await adapter.suspendPresentationSignalChannel(branch.presentationSignalChannelRef);
    expect(onSampleUpdate).toHaveBeenCalledTimes(
      1 + batches.reduce(
        (count, batch) => count + batch.samples.length,
        0,
      ),
    );
    expect(onBeatFinalized).toHaveBeenCalledTimes(
      batches.at(-1)!.metricState.completedBeatCount,
    );
    subscription.unsubscribe();
    await adapter.closeSession("signal-session");
    expect(harness.hosts[0]!.terminated).toBe(true);
  });

  it("rotates a live Worker before its bounded request lifetime is exhausted", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "live-host-rotation-session",
      branches: [sourceBranchV1(stored, "live-host-rotation-scenario")],
    });
    const branch = opened.branches[0]!;
    const batches: RuntimePresentationSampleBatchV1[] = [];
    adapter.subscribePresentationSignalChannel(branch.presentationSignalChannelRef, (event) => {
      if (event.kind === "samples") batches.push(event);
    });
    harness.hosts[0]!.requestCount = 90_000;

    await adapter.resumePresentationSignalChannel(branch.presentationSignalChannelRef, 0);
    await waitForV1(() => batches.length > 0);
    await adapter.suspendPresentationSignalChannel(branch.presentationSignalChannelRef);

    expect(harness.hosts).toHaveLength(2);
    expect(harness.hosts[0]).toMatchObject({
      terminated: true,
      checkpointV4CallCount: 1,
    });
    expect(harness.hosts[1]!.terminated).toBe(false);
    // The rotated host owns the live lane from here. Pacing delays the
    // presentation of a chunk, not its computation, so the loop may already
    // have issued the next command by the time the first batch is observed.
    expect(harness.hosts[1]!.runTransientCallCount).toBeGreaterThanOrEqual(1);
    expect(batches[0]!.samples[0]).toMatchObject({
      acceptedRevision: baseFixture.frame.revision + 2,
      acceptedStepSpanFromPrevious: 2,
      retentionReason: "observation-stride",
    });
    await adapter.closeSession("live-host-rotation-session");
    expect(harness.hosts[1]!.terminated).toBe(true);
  });

  it("does not allocate a replacement Worker after close wins a rotation checkpoint", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "closed-live-host-rotation-session",
      branches: [
        sourceBranchV1(stored, "closed-live-host-rotation-scenario"),
      ],
    });
    const branch = opened.branches[0]!;
    const checkpointGate = deferredV1<void>();
    harness.hosts[0]!.requestCount = 90_000;
    harness.checkpointGatesByHostOrdinal.set(0, checkpointGate);

    await adapter.resumePresentationSignalChannel(branch.presentationSignalChannelRef, 0);
    await waitForV1(() =>
      harness.hosts[0]!.checkpointV4CallCount === 1
      && !harness.checkpointGatesByHostOrdinal.has(0));
    await adapter.closeSession("closed-live-host-rotation-session");
    expect(harness.hosts[0]!.terminated).toBe(true);

    checkpointGate.resolve();
    await waitForV1(() =>
      harness.hosts[0]!.checkpointV4CompletedCount === 1);
    await delayV1(0);
    expect(harness.hosts).toHaveLength(1);
  });

  it("quarantines a live host when source-session disposal is not acknowledged", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    harness.failDisposeAtHostOrdinals.add(0);
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "live-disposal-quarantine-session",
      branches: [
        sourceBranchV1(stored, "live-disposal-quarantine-scenario"),
      ],
    });
    const branch = opened.branches[0]!;
    const patch = await targetPatchV1(
      baseFixture,
      "circulation.systemic-vascular-resistance-scale",
      1.5,
    );

    const execution = adapter.startTargetIntent({
      sessionId: "live-disposal-quarantine-session",
      intentId: "live-disposal-quarantine-intent",
      targets: [{
        scenarioId: branch.scenarioId,
        liveBranchId: branch.liveBranchId,
        targetGeneration: 1,
        presentationRevision: 1,
        patch,
      }],
    });
    const [live] = await Promise.all([execution.live, execution.strict]);

    expect(live.branches[0]).toMatchObject({
      status: "failure",
      message: expect.stringMatching(
        /live host disposal failed and was quarantined/,
      ),
    });
    expect(harness.hosts[0]!.terminated).toBe(true);
    await expect(
      adapter.resumePresentationSignalChannel(branch.presentationSignalChannelRef, 1),
    ).rejects.toThrow(/live host disposal failed and was quarantined/);
    await adapter.closeSession("live-disposal-quarantine-session");
  });

  it("does not advance any target branch before the aggregate clone barrier", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "barrier-session",
      branches: [
        sourceBranchV1(stored, "left"),
        sourceBranchV1(stored, "right"),
      ],
    });
    const leftPatch = await targetPatchV1(
      baseFixture,
      "circulation.systemic-vascular-resistance-scale",
      1.5,
    );
    const rightPatch = await targetPatchV1(
      baseFixture,
      "circulation.pulmonary-vascular-resistance-scale",
      1.5,
    );
    const gate = deferredV1<void>();
    harness.gateForkTargetSha256 = rightPatch.targetInputSha256;
    harness.forkGate = gate;

    const execution = adapter.startTargetIntent({
      sessionId: "barrier-session",
      intentId: "aggregate-intent",
      targets: [
        {
          scenarioId: "left",
          liveBranchId: opened.branches[0]!.liveBranchId,
          targetGeneration: 1,
          presentationRevision: 1,
          patch: leftPatch,
        },
        {
          scenarioId: "right",
          liveBranchId: opened.branches[1]!.liveBranchId,
          targetGeneration: 1,
          presentationRevision: 1,
          patch: rightPatch,
        },
      ],
    });

    await waitForV1(
      () => harness.events.filter((event) =>
        event.kind === "fork-start"
        && event.targetStateSha256 === rightPatch.targetInputSha256
      ).length === 2,
    );
    expect(harness.events.filter((event) => event.kind === "run")).toEqual([]);
    expect(harness.hosts.slice(0, 2).map(
      (host) => host.runTransientCallCount,
    )).toEqual([0, 0]);

    gate.resolve();
    const [live, strict] = await Promise.all([
      execution.live,
      execution.strict,
    ]);
    expect(live.branches.map(({ status }) => status))
      .toEqual(["success", "success"]);
    expect(strict.branches.map(({ status }) => status))
      .toEqual(["failure", "failure"]);
    expect(harness.hosts.slice(0, 2).map(
      (host) => host.runTransientCallCount,
    )).toEqual([1, 1]);
    await adapter.closeSession("barrier-session");
  });

  it("settles an overtaken generation as superseded and runs the replacement", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "supersession-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;
    const firstPatch = await targetPatchV1(
      baseFixture,
      "circulation.systemic-vascular-resistance-scale",
      1.5,
    );
    const replacementPatch = await targetPatchV1(
      baseFixture,
      "circulation.systemic-vascular-resistance-scale",
      2,
    );
    const gate = deferredV1<void>();
    harness.gateForkTargetSha256 = firstPatch.targetInputSha256;
    harness.forkGate = gate;
    const first = adapter.startTargetIntent({
      sessionId: "supersession-session",
      intentId: "first",
      targets: [{
        scenarioId: "scenario",
        liveBranchId: branch.liveBranchId,
        targetGeneration: 1,
        presentationRevision: 1,
        patch: firstPatch,
      }],
    });
    await waitForV1(
      () => harness.events.filter((event) =>
        event.kind === "fork-start"
        && event.targetStateSha256 === firstPatch.targetInputSha256
      ).length === 2,
    );

    const replacement = adapter.startTargetIntent({
      sessionId: "supersession-session",
      intentId: "replacement",
      targets: [{
        scenarioId: "scenario",
        liveBranchId: branch.liveBranchId,
        targetGeneration: 2,
        presentationRevision: 2,
        patch: replacementPatch,
      }],
    });
    harness.gateForkTargetSha256 = null;
    gate.resolve();

    const [firstLive, firstStrict, replacementLive, replacementStrict] =
      await Promise.all([
        first.live,
        first.strict,
        replacement.live,
        replacement.strict,
      ]);
    expect(firstLive.branches[0]!.status).toBe("superseded");
    expect(firstStrict.branches[0]!.status).toBe("superseded");
    expect(replacementLive.branches[0]!.status).toBe("success");
    expect(replacementStrict.branches[0]!.status).toBe("failure");
    await adapter.closeSession("supersession-session");
  });

  it("aborts strict snapshot staging before CAS commit when superseded", async () => {
    const artifacts = new GatedSnapshotArtifactStoreV1();
    const stored = await storeSourceV1(baseFixture, artifacts);
    const baselineEntryCount = artifacts.entryCount;
    const harness = new FakeHostHarnessV1(baseFixture);
    harness.strictConvergesWithoutAdvance = true;
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "strict-artifact-supersession-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;
    const unchangedPatch = await targetPatchV1(
      baseFixture,
      "circulation.systemic-vascular-resistance-scale",
      baseFixture.checkpoint.controlTargetState.controls[
        "circulation.systemic-vascular-resistance-scale"
      ],
    );
    artifacts.delayNextSnapshotBatch();
    const first = adapter.startTargetIntent({
      sessionId: "strict-artifact-supersession-session",
      intentId: "strict-artifact-first",
      targets: [{
        scenarioId: "scenario",
        liveBranchId: branch.liveBranchId,
        targetGeneration: 1,
        presentationRevision: 1,
        patch: unchangedPatch,
      }],
    });
    await artifacts.waitForDelayedSnapshotBatch();

    const replacementPatch = await targetPatchV1(
      baseFixture,
      "circulation.systemic-vascular-resistance-scale",
      1.5,
    );
    const replacement = adapter.startTargetIntent({
      sessionId: "strict-artifact-supersession-session",
      intentId: "strict-artifact-replacement",
      targets: [{
        scenarioId: "scenario",
        liveBranchId: branch.liveBranchId,
        targetGeneration: 2,
        presentationRevision: 2,
        patch: replacementPatch,
      }],
    });
    artifacts.releaseDelayedSnapshotBatch();

    const [firstStrict, replacementStrict] = await Promise.all([
      first.strict,
      replacement.strict,
    ]);
    await Promise.all([first.live, replacement.live]);
    expect(firstStrict.branches[0]!.status).toBe("superseded");
    expect(replacementStrict.branches[0]!.status).toBe("failure");
    // Opening and both accepted live preparations materialize one
    // content-addressed origin; each preparation also stores its checkpoint.
    // The cancelled strict candidate adds no snapshot.
    expect(artifacts.entryCount).toBe(baselineEntryCount + 5);
    await adapter.closeSession("strict-artifact-supersession-session");
  });

  it("rechecks supersession after strict checkpoint validation and before CAS staging", async () => {
    const artifacts = new GatedSnapshotArtifactStoreV1();
    const stored = await storeSourceV1(baseFixture, artifacts);
    const baselineEntryCount = artifacts.entryCount;
    const baselineSnapshotBatchCount =
      artifacts.successfulSnapshotBatchCount;
    const harness = new FakeHostHarnessV1(baseFixture);
    harness.strictConvergesWithoutAdvance = true;
    const checkpointGate = deferredV1<void>();
    harness.checkpointGatesByHostOrdinal.set(1, checkpointGate);
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "strict-precommit-supersession-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;
    const unchangedPatch = await targetPatchV1(
      baseFixture,
      "circulation.systemic-vascular-resistance-scale",
      baseFixture.checkpoint.controlTargetState.controls[
        "circulation.systemic-vascular-resistance-scale"
      ],
    );
    const first = adapter.startTargetIntent({
      sessionId: "strict-precommit-supersession-session",
      intentId: "strict-precommit-first",
      targets: [{
        scenarioId: "scenario",
        liveBranchId: branch.liveBranchId,
        targetGeneration: 1,
        presentationRevision: 1,
        patch: unchangedPatch,
      }],
    });
    await waitForV1(() =>
      harness.hosts[1]?.checkpointV4CallCount === 1
      && !harness.checkpointGatesByHostOrdinal.has(1));

    const replacementPatch = await targetPatchV1(
      baseFixture,
      "circulation.systemic-vascular-resistance-scale",
      1.5,
    );
    const replacement = adapter.startTargetIntent({
      sessionId: "strict-precommit-supersession-session",
      intentId: "strict-precommit-replacement",
      targets: [{
        scenarioId: "scenario",
        liveBranchId: branch.liveBranchId,
        targetGeneration: 2,
        presentationRevision: 2,
        patch: replacementPatch,
      }],
    });
    checkpointGate.resolve();

    const [firstStrict, replacementStrict] = await Promise.all([
      first.strict,
      replacement.strict,
    ]);
    await Promise.all([first.live, replacement.live]);
    expect(firstStrict.branches[0]!.status).toBe("superseded");
    expect(replacementStrict.branches[0]!.status).toBe("failure");
    // Opening contributes one origin and each live preparation contributes
    // its replay checkpoint plus origin; no strict-candidate snapshot leaks.
    expect(artifacts.entryCount).toBe(baselineEntryCount + 5);
    expect(artifacts.successfulSnapshotBatchCount)
      .toBe(baselineSnapshotBatchCount);
    await adapter.closeSession("strict-precommit-supersession-session");
  });

  it("publishes a strict candidate only after one admitted P1 checkpoint", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    harness.strictConvergesWithoutAdvance = true;
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "strict-success-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;
    const controlId =
      "circulation.systemic-vascular-resistance-scale" as const;
    const unchangedPatch = await targetPatchV1(
      baseFixture,
      controlId,
      baseFixture.checkpoint.controlTargetState.controls[controlId],
    );
    const execution = adapter.startTargetIntent({
      sessionId: "strict-success-session",
      intentId: "strict-success",
      targets: [{
        scenarioId: "scenario",
        liveBranchId: branch.liveBranchId,
        targetGeneration: 1,
        presentationRevision: 1,
        patch: unchangedPatch,
      }],
    });

    const [live, strict] = await Promise.all([
      execution.live,
      execution.strict,
    ]);
    expect(live.branches[0]!.status).toBe("success");
    expect(live.branches[0]).toMatchObject({
      status: "success",
      result: {
        initialPresentation: {
          sample: {
            acceptedStepSpanFromPrevious: 0,
            retentionReason: "stream-boundary",
          },
        },
      },
    });
    expect(harness.hosts[0]!.runTransientInputs[0]).toEqual({
      stepCount: 1,
      observationStride: 16,
    });
    expect(strict.branches[0]!.status).toBe("success");
    if (strict.branches[0]!.status !== "success") {
      throw new Error("strict fixture did not create a candidate");
    }
    const candidateEnvelope = await loadMainWireStudioSnapshotEnvelopeV1(
      await stored.artifacts.readJson(
        strict.branches[0]!.candidate.snapshotRef,
      ),
      {
        simulationInputRef:
          strict.branches[0]!.candidate.simulationInputRef,
        baseSessionInputSha256: baseFixture.sessionInputSha256,
      },
    );
    expect(candidateEnvelope.claims).toMatchObject({
      seedObservablePointCount: 1,
      beatSampleHistoryStored: false,
      windowMetricsStored: false,
    });
    expect(candidateEnvelope.checkpointV4.periodicSettlementTracker)
      .toMatchObject({
        completedBeatCount:
          baseFixture.strictSettlement.completedBeatCount,
        anchorAcceptedTimeSec:
          baseFixture.strictSettlement.anchorAcceptedTimeSec,
      });
    expect(harness.hosts[1]).toMatchObject({
      runTransientCallCount: 0,
      settlePeriodicCallCount: 1,
      checkpointV4CallCount: 1,
    });
    await adapter.closeSession("strict-success-session");
  });

  it.each([
    {
      name: "claimed period-1 with zero completed beats",
      configure: (harness: FakeHostHarnessV1) => {
        harness.forgeStrictZeroBeatClaim = true;
      },
      message: /strict period-1 evidence mismatch/,
    },
    {
      name: "tracker terminal that is not the checkpoint terminal",
      configure: (harness: FakeHostHarnessV1) => {
        harness.forgeStrictTrackerTerminal = true;
      },
      message: /strict period-1 tracker terminal mismatch/,
    },
  ])("rejects $name", async ({ configure, message }) => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    harness.strictConvergesWithoutAdvance = true;
    configure(harness);
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "forged-strict-evidence-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;
    const controlId =
      "circulation.systemic-vascular-resistance-scale" as const;
    const patch = await targetPatchV1(
      baseFixture,
      controlId,
      baseFixture.checkpoint.controlTargetState.controls[controlId],
    );
    const execution = adapter.startTargetIntent({
      sessionId: "forged-strict-evidence-session",
      intentId: "forged-strict-evidence",
      targets: [{
        scenarioId: "scenario",
        liveBranchId: branch.liveBranchId,
        targetGeneration: 1,
        presentationRevision: 1,
        patch,
      }],
    });

    const [live, strict] = await Promise.all([
      execution.live,
      execution.strict,
    ]);
    expect(live.branches[0]!.status).toBe("success");
    expect(strict.branches[0]).toMatchObject({
      status: "failure",
      message: expect.stringMatching(message),
    });
    expect(harness.hosts[1]).toMatchObject({
      settlePeriodicCallCount: 1,
      checkpointV4CallCount: 1,
    });
    await adapter.closeSession("forged-strict-evidence-session");
  });

  it("rolls a failed promotion back to the running live host", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    harness.strictConvergesWithoutAdvance = true;
    harness.failRestoreAtHostOrdinals.add(2);
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "rollback-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;
    const issued = await issueStrictCandidateV1(
      adapter,
      baseFixture,
      branch,
      "rollback-session",
      "rollback-candidate-intent",
    );
    const candidate = issued.candidate;
    const batches: RuntimePresentationSampleBatchV1[] = [];
    adapter.subscribePresentationSignalChannel(
      branch.presentationSignalChannelRef,
      (event) => {
        if (event.kind === "samples") batches.push(event);
      },
    );
    await adapter.resumePresentationSignalChannel(
      branch.presentationSignalChannelRef,
      issued.streamEpoch,
    );
    await waitForV1(() => batches.length >= 1);
    const beforePromotion = batches.length;

    await expect(adapter.promoteSteadyCandidate({
      sessionId: "rollback-session",
      scenarioId: "scenario",
      liveBranchId: branch.liveBranchId,
      targetGeneration: 1,
      presentationRevision: 2,
      candidate,
    })).rejects.toThrow(/synthetic restore failure/);

    expect(harness.hosts).toHaveLength(3);
    expect(harness.hosts[0]!.terminated).toBe(false);
    expect(harness.hosts[1]!.terminated).toBe(true);
    expect(harness.hosts[2]!.terminated).toBe(true);
    await waitForV1(() => batches.length > beforePromotion);
    await adapter.suspendPresentationSignalChannel(branch.presentationSignalChannelRef);
    await adapter.closeSession("rollback-session");
  });

  it("pointer-swaps a valid promotion once and replays its idempotent receipt", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    harness.strictConvergesWithoutAdvance = true;
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "promotion-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;
    const issued = await issueStrictCandidateV1(
      adapter,
      baseFixture,
      branch,
      "promotion-session",
      "promotion-candidate-intent",
    );
    const candidate = issued.candidate;
    const command = {
      sessionId: "promotion-session",
      scenarioId: "scenario",
      liveBranchId: branch.liveBranchId,
      targetGeneration: 1,
      presentationRevision: 2,
      candidate,
    };

    const first = await adapter.promoteSteadyCandidate(command);
    const replay = await adapter.promoteSteadyCandidate(command);

    expect(replay).toBe(first);
    expect(first).toMatchObject({
      candidateId: candidate.candidateId,
      presentationRevision: 2,
      streamEpoch: 2,
      initialPresentation: {
        metricState: {
          status: "collecting",
          retainedSampleCount: 1,
          completedBeatCount: 0,
        },
      },
    });
    expect(harness.hosts).toHaveLength(3);
    expect(harness.hosts[0]!.terminated).toBe(true);
    expect(harness.hosts[1]!.terminated).toBe(true);
    expect(harness.hosts[2]!.terminated).toBe(false);
    await expect(adapter.promoteSteadyCandidate({
      ...command,
      candidate: {
        ...candidate,
        snapshotRef: {
          ...candidate.snapshotRef,
          sha256: "f".repeat(64),
        },
      },
    })).rejects.toThrow(/precondition mismatch/);
    await adapter.closeSession("promotion-session");

    await adapter.openSession({
      sessionId: "promotion-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    await expect(adapter.promoteSteadyCandidate(command))
      .rejects.toThrow(/precondition mismatch/);
    await adapter.closeSession("promotion-session");
  });

  it("rejects a forged current-target candidate that strict never issued", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "forged-candidate-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;

    await expect(adapter.promoteSteadyCandidate({
      sessionId: "forged-candidate-session",
      scenarioId: "scenario",
      liveBranchId: branch.liveBranchId,
      targetGeneration: 0,
      presentationRevision: 1,
      candidate: candidateV1(
        stored,
        branch.execution,
        "forged-candidate-session",
        "scenario",
        "forged-candidate",
      ),
    })).rejects.toThrow(/precondition mismatch/);

    expect(harness.hosts).toHaveLength(1);
    expect(harness.hosts[0]!.terminated).toBe(false);
    await adapter.closeSession("forged-candidate-session");
  });

  it("rejects a run artifact whose content does not bind the open source", async () => {
    const stored = await storeSourceV1(baseFixture);
    const runContent = mutableCloneV1(
      await stored.artifacts.readJson(stored.runRef),
    );
    runContent.targetInputSha256 = "f".repeat(64);
    const mismatchedRunRef = await stored.artifacts.putJson({
      kind: "run-artifact",
      mediaType:
        "application/vnd.circleheart.studio-run-artifact.v1+json",
      content: runContent,
    });
    const harness = new FakeHostHarnessV1(baseFixture);
    const adapter = runtimeAdapterV1(stored, harness);

    await expect(adapter.openSession({
      sessionId: "mismatched-run-session",
      branches: [{
        ...sourceBranchV1(stored, "scenario"),
        sourceRunRef: mismatchedRunRef,
      }],
    })).rejects.toThrow(/source run artifact binding mismatch/);
    expect(harness.hosts).toHaveLength(0);
  });

  it.each(["modelRef", "runtimeRef"] as const)(
    "rejects a run artifact whose %s does not bind the open source before allocating a Worker",
    async (executionField) => {
      const stored = await storeSourceV1(baseFixture);
      const runContent = mutableCloneV1(
        await stored.artifacts.readJson(stored.runRef),
      );
      runContent.execution[executionField] =
        `forged/${executionField}@1.0.0`;
      const mismatchedRunRef = await stored.artifacts.putJson({
        kind: "run-artifact",
        mediaType:
          "application/vnd.circleheart.studio-run-artifact.v1+json",
        content: runContent,
      });
      const harness = new FakeHostHarnessV1(baseFixture);
      const adapter = runtimeAdapterV1(stored, harness);

      await expect(adapter.openSession({
        sessionId: `mismatched-${executionField}-session`,
        branches: [{
          ...sourceBranchV1(stored, "scenario"),
          sourceRunRef: mismatchedRunRef,
        }],
      })).rejects.toThrow(/source run artifact binding mismatch/);
      expect(harness.hosts).toHaveLength(0);
    },
  );

  it("keeps complete desired controls across rapid supersession", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "complete-supersession-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;
    const systemicId =
      "circulation.systemic-vascular-resistance-scale" as const;
    const pulmonaryId =
      "circulation.pulmonary-vascular-resistance-scale" as const;
    const firstResolved = await resolveMainWireStudioTargetInputV1(
      baseFixture.checkpoint.controlTargetState,
      baseFixture.sessionInputSha256,
      { [systemicId]: 1.5 },
    );
    const replacementResolved = await resolveMainWireStudioTargetInputV1(
      firstResolved.targetState,
      baseFixture.sessionInputSha256,
      { [pulmonaryId]: 2 },
    );
    const gate = deferredV1<void>();
    harness.gateForkTargetSha256 =
      firstResolved.patch.targetInputSha256;
    harness.forkGate = gate;
    const first = adapter.startTargetIntent({
      sessionId: "complete-supersession-session",
      intentId: "partial-first",
      targets: [{
        scenarioId: "scenario",
        liveBranchId: branch.liveBranchId,
        targetGeneration: 1,
        presentationRevision: 1,
        patch: firstResolved.patch,
      }],
    });
    await waitForV1(() => harness.events.some((event) =>
      event.kind === "fork-start"
      && event.targetStateSha256
        === firstResolved.patch.targetInputSha256));
    const replacement = adapter.startTargetIntent({
      sessionId: "complete-supersession-session",
      intentId: "complete-replacement",
      targets: [{
        scenarioId: "scenario",
        liveBranchId: branch.liveBranchId,
        targetGeneration: 2,
        presentationRevision: 2,
        patch: replacementResolved.patch,
      }],
    });
    harness.gateForkTargetSha256 = null;
    gate.resolve();

    const [firstLive, replacementLive] = await Promise.all([
      first.live,
      replacement.live,
    ]);
    await Promise.all([first.strict, replacement.strict]);
    expect(firstLive.branches[0]!.status).toBe("superseded");
    expect(replacementLive.branches[0]!.status).toBe("success");
    const accepted = [...harness.hosts[0]!.sessions.values()].find(
      ({ controlState }) =>
        controlState.targetStateSha256
          === replacementResolved.targetState.targetStateSha256,
    );
    expect(accepted?.controlState.controls).toMatchObject({
      [systemicId]: 1.5,
      [pulmonaryId]: 2,
    });
    await adapter.closeSession("complete-supersession-session");
  });

  it("flushes the accepted in-flight chunk across overlapping suspend/resume", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    const runGate = deferredV1<void>();
    harness.runGatesByHostOrdinal.set(0, runGate);
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "overlap-playback-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;
    const batches: RuntimePresentationSampleBatchV1[] = [];
    adapter.subscribePresentationSignalChannel(branch.presentationSignalChannelRef, (event) => {
      if (event.kind === "samples") batches.push(event);
    });
    await adapter.resumePresentationSignalChannel(branch.presentationSignalChannelRef, 0);
    await waitForV1(() => harness.hosts[0]!.runTransientCallCount === 1);

    const suspending =
      adapter.suspendPresentationSignalChannel(branch.presentationSignalChannelRef);
    const resuming =
      adapter.resumePresentationSignalChannel(branch.presentationSignalChannelRef, 0);
    runGate.resolve();
    await Promise.all([suspending, resuming]);
    await waitForV1(() =>
      harness.hosts[0]!.runTransientCallCount >= 2 && batches.length >= 2);
    await adapter.suspendPresentationSignalChannel(branch.presentationSignalChannelRef);

    const ordinals = batches.flatMap(({ samples }) =>
      samples.map(({ presentationOrdinal }) => presentationOrdinal));
    expect(ordinals.length).toBeGreaterThanOrEqual(2);
    for (let index = 1; index < ordinals.length; index += 1) {
      expect(ordinals[index]).toBe(ordinals[index - 1]! + 1);
    }
    await adapter.closeSession("overlap-playback-session");
  });

  it("emits a current-epoch failure when continuous live advancement fails", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    harness.failNextRunAtHostOrdinals.add(0);
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "live-failure-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;
    const events: RuntimePresentationSignalEventV1[] = [];
    adapter.subscribePresentationSignalChannel(
      branch.presentationSignalChannelRef,
      (event) => events.push(event),
    );
    await adapter.resumePresentationSignalChannel(branch.presentationSignalChannelRef, 0);
    await waitForV1(() => events.some(({ kind }) => kind === "failure"));

    expect(events.find(({ kind }) => kind === "failure")).toMatchObject({
      kind: "failure",
      targetGeneration: 0,
      presentationRevision: 0,
      streamEpoch: 0,
      message: expect.stringMatching(/synthetic transient failure/),
    });
    await expect(adapter.resumePresentationSignalChannel(branch.presentationSignalChannelRef, 0))
      .rejects.toThrow(/synthetic transient failure/);
    await adapter.closeSession("live-failure-session");
  });

  it("retains accepted Worker partial progress before failing the live branch closed", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    harness.partialProgressFailureNextRunAtHostOrdinals.set(0, 1);
    const adapter = runtimeAdapterV1(stored, harness, {
      liveStepCountPerChunk: 2,
    });
    const opened = await adapter.openSession({
      sessionId: "live-partial-failure-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;
    const events: RuntimePresentationSignalEventV1[] = [];
    adapter.subscribePresentationSignalChannel(
      branch.presentationSignalChannelRef,
      (event) => events.push(event),
    );

    await adapter.resumePresentationSignalChannel(branch.presentationSignalChannelRef, 0);
    await waitForV1(() => events.some(({ kind }) => kind === "failure"));

    const workerAccepted = [...harness.hosts[0]!.sessions.values()][0]!;
    expect(workerAccepted.stateIdentity).toMatchObject({
      revision: baseFixture.frame.revision + 1,
      acceptedTimeSec: baseFixture.frame.acceptedTimeSec + 0.002,
    });
    expect(events.map(({ kind }) => kind)).toEqual(["samples", "failure"]);
    expect(events[0]).toMatchObject({
      kind: "samples",
      samples: [{
        acceptedRevision: baseFixture.frame.revision + 1,
        acceptedStepSpanFromPrevious: 1,
      }],
      metricState: {
        retainedSampleCount: 2,
      },
    });
    expect(events.find(({ kind }) => kind === "failure")).toMatchObject({
      kind: "failure",
      message: expect.stringMatching(
        /synthetic accepted partial transient failure/,
      ),
    });
    const failedRunCount = harness.hosts[0]!.runTransientCallCount;
    await delayV1(5);
    expect(harness.hosts[0]!.runTransientCallCount).toBe(failedRunCount);
    await expect(adapter.resumePresentationSignalChannel(branch.presentationSignalChannelRef, 0))
      .rejects.toThrow(/synthetic accepted partial transient failure/);

    const patch = await targetPatchV1(
      baseFixture,
      "circulation.systemic-vascular-resistance-scale",
      1.5,
    );
    const recovery = adapter.startTargetIntent({
      sessionId: "live-partial-failure-session",
      intentId: "recover-after-partial-progress",
      targets: [{
        scenarioId: "scenario",
        liveBranchId: branch.liveBranchId,
        targetGeneration: 1,
        presentationRevision: 1,
        patch,
      }],
    });
    await Promise.all([recovery.live, recovery.strict]);
    expect(harness.hosts[0]!.checkpointV4Inputs[0]!.stateIdentity)
      .toEqual(workerAccepted.stateIdentity);
    expect(harness.hosts[0]!.checkpointV4Inputs[0]!.observableFrame)
      .toEqual(workerAccepted.observableFrame);
    await adapter.closeSession("live-partial-failure-session");
  });

  it("retains superseded initial-live partial progress before preparing its replacement", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    const runGate = deferredV1<void>();
    harness.partialProgressFailureNextRunAtHostOrdinals.set(0, 1);
    harness.runGatesByHostOrdinal.set(0, runGate);
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "superseded-partial-progress-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;
    const firstPatch = await targetPatchV1(
      baseFixture,
      "circulation.systemic-vascular-resistance-scale",
      1.5,
    );
    const replacementPatch = await targetPatchV1(
      baseFixture,
      "circulation.systemic-vascular-resistance-scale",
      2,
    );
    const first = adapter.startTargetIntent({
      sessionId: "superseded-partial-progress-session",
      intentId: "partial-progress-first",
      targets: [{
        scenarioId: "scenario",
        liveBranchId: branch.liveBranchId,
        targetGeneration: 1,
        presentationRevision: 1,
        patch: firstPatch,
      }],
    });
    await waitForV1(() => harness.hosts[0]!.runTransientCallCount === 1);

    const replacement = adapter.startTargetIntent({
      sessionId: "superseded-partial-progress-session",
      intentId: "partial-progress-replacement",
      targets: [{
        scenarioId: "scenario",
        liveBranchId: branch.liveBranchId,
        targetGeneration: 2,
        presentationRevision: 2,
        patch: replacementPatch,
      }],
    });
    runGate.resolve();

    const [firstLive, replacementLive] = await Promise.all([
      first.live,
      replacement.live,
    ]);
    await Promise.all([first.strict, replacement.strict]);
    expect(firstLive.branches[0]!.status).toBe("superseded");
    expect(replacementLive.branches[0]!.status).toBe("success");
    expect(harness.hosts[0]!.checkpointV4Inputs).toHaveLength(4);
    // Source checkpoints are now interleaved with post-fork replay
    // checkpoints. The replacement source must still include partial progress.
    expect(harness.hosts[0]!.checkpointV4Inputs[2]!.stateIdentity)
      .toMatchObject({
        revision: baseFixture.frame.revision + 1,
        acceptedTimeSec: baseFixture.frame.acceptedTimeSec + 0.002,
      });
    await adapter.closeSession("superseded-partial-progress-session");
  });

  it("terminates a transient promotion host when close wins the race", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    harness.strictConvergesWithoutAdvance = true;
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "promotion-close-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;
    const issued = await issueStrictCandidateV1(
      adapter,
      baseFixture,
      branch,
      "promotion-close-session",
      "promotion-close-candidate",
    );
    const restoreGate = deferredV1<void>();
    harness.restoreGatesByHostOrdinal.set(2, restoreGate);
    const promotion = adapter.promoteSteadyCandidate({
      sessionId: "promotion-close-session",
      scenarioId: "scenario",
      liveBranchId: branch.liveBranchId,
      targetGeneration: 1,
      presentationRevision: 2,
      candidate: issued.candidate,
    });
    await waitForV1(() =>
      harness.hosts.length === 3
      && !harness.restoreGatesByHostOrdinal.has(2));

    await adapter.closeSession("promotion-close-session");
    expect(harness.hosts[2]!.terminated).toBe(true);
    restoreGate.resolve();
    await expect(promotion).rejects.toThrow(/terminated|closed/);
    expect(harness.hosts.every(({ terminated }) => terminated)).toBe(true);
  });

  it("phase-aligns a running live trace before installing the candidate point", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    harness.strictConvergesWithoutAdvance = true;
    harness.yieldRunToTimer = true;
    let syntheticNowMs = 0;
    const adapter = runtimeAdapterV1(stored, harness, {
      liveStepCountPerChunk: 16,
      nowMs: () => {
        syntheticNowMs += 100;
        return syntheticNowMs;
      },
    });
    const opened = await adapter.openSession({
      sessionId: "phase-promotion-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;
    const issued = await issueStrictCandidateV1(
      adapter,
      baseFixture,
      branch,
      "phase-promotion-session",
      "phase-promotion-candidate",
    );
    const batches: RuntimePresentationSampleBatchV1[] = [];
    adapter.subscribePresentationSignalChannel(branch.presentationSignalChannelRef, (event) => {
      if (event.kind === "samples") batches.push(event);
    });
    await adapter.resumePresentationSignalChannel(
      branch.presentationSignalChannelRef,
      issued.streamEpoch,
    );
    await waitForV1(() => batches.length >= 1);

    const promoted = await adapter.promoteSteadyCandidate({
      sessionId: "phase-promotion-session",
      scenarioId: "scenario",
      liveBranchId: branch.liveBranchId,
      targetGeneration: 1,
      presentationRevision: 2,
      candidate: issued.candidate,
    });
    const finalLivePhase = batches.at(-1)?.samples.at(-1)?.phase;
    const candidatePhase = promoted.initialPresentation.sample.phase;
    expect(finalLivePhase).not.toBeNull();
    expect(candidatePhase).not.toBeNull();
    const phaseDistance = Math.abs(
      (finalLivePhase as number) - (candidatePhase as number),
    );
    expect(Math.min(phaseDistance, 1 - phaseDistance)).toBeLessThan(1e-9);
    expect(harness.hosts[0]!.runTransientInputs.length).toBeGreaterThan(1);
    expect(harness.hosts[0]!.runTransientInputs.every((input) =>
      input.observationStride === 16 && input.stepCount <= 16
    )).toBe(true);
    await adapter.closeSession("phase-promotion-session");
  });

  it("exports one exact second with 500 contiguous intervals and the stride-1 reference endpoint", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "exact-one-second-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;
    const internal = internalAdapterBranchV1(
      adapter,
      "exact-one-second-session",
      "scenario",
    );
    const before = Object.freeze({
      host: internal.host,
      hostedSession: internal.hostedSession,
      liveBranchId: internal.liveBranchId,
      streamEpoch: internal.streamEpoch,
      livePacing: internal.livePacing,
      tracePointCount: internal.tracePointCount,
      replayOrigins: internal.replayOrigins,
      liveRequestCount: internal.host.requestCount,
    });
    const presentationEvents: RuntimePresentationSignalEventV1[] = [];
    adapter.subscribePresentationSignalChannel(
      branch.presentationSignalChannelRef,
      (event) => presentationEvents.push(event),
    );
    const command = Object.freeze({
      sessionId: "exact-one-second-session",
      scenarioId: "scenario",
      liveBranchId: branch.liveBranchId,
      targetGeneration: 0,
      presentationRevision: 0,
      intervalStartOffsetSec: 0,
      intervalDurationSec: 1,
    });

    const firstExport = await adapter.exportExactSignals(command);
    const firstValue =
      await stored.artifacts.readJson(firstExport.artifactRef);
    const firstContent =
      await loadExactSignalExportContentV1(firstValue);
    expect(firstExport.artifactRef.kind).toBe("exact-signal-export");
    expect(firstContent.manifest.coverage).toEqual({
      kind: "exact-signal-replay-v1",
      dtSec: 0.002,
      observationStride: 1,
      intervalCount: 500,
      sampleCount: 501,
    });
    expect(firstContent.samples).toHaveLength(501);
    expect(firstContent.samples[0]!.provenance)
      .toBe("checkpoint-boundary");
    expect(firstContent.samples.slice(1).every((sample) =>
      sample.provenance === "accepted-step"
    )).toBe(true);
    for (let index = 2; index < firstContent.samples.length; index += 1) {
      const previous = firstContent.samples[index - 1]!;
      const sample = firstContent.samples[index]!;
      expect(sample.revision).toBe(previous.revision + 1);
      expect(sample.simulationTimeSec - previous.simulationTimeSec)
        .toBeCloseTo(0.002, 12);
    }

    const referenceHost = harness.factory();
    const referenceRestored = await referenceHost.restoreV4({
      sessionId: "stride-one-reference",
      resolvedSessionInput: baseFixture.sessionInput,
      checkpointV4: baseFixture.checkpoint,
    });
    const reference = await referenceHost.runTransient({
      session: referenceRestored,
      dtSec: 0.002,
      stepCount: 500,
      observationStride: 1,
    });
    const finalSample = firstContent.samples.at(-1)!;
    const finalReference = reference.observableFrames.at(-1)!;
    expect(finalSample.revision).toBe(finalReference.revision);
    expect(finalSample.simulationTimeSec)
      .toBeCloseTo(finalReference.acceptedTimeSec, 12);
    for (const observableId of [
      "hemodynamics.volume.LV",
      "hemodynamics.pressure.absolute.Ao",
      "valve.AoV.flow",
    ] as const) {
      expect(finalSample.values[observableId])
        .toEqual(finalReference.values[observableId]);
    }
    referenceHost.terminate();

    const secondExport = await adapter.exportExactSignals(command);
    const secondValue =
      await stored.artifacts.readJson(secondExport.artifactRef);
    expect(secondExport.artifactRef.sha256)
      .toBe(firstExport.artifactRef.sha256);
    expect(secondExport.manifest.dataSha256)
      .toBe(firstExport.manifest.dataSha256);
    expect(studioCanonicalJsonStringifyV1(secondValue))
      .toBe(studioCanonicalJsonStringifyV1(firstValue));
    const assertedWithoutEvidence = mutableCloneV1(firstValue);
    assertedWithoutEvidence.manifest.claims
      .durableReplayLedgerAvailable = true;
    await expect(
      loadExactSignalExportContentV1(assertedWithoutEvidence),
    ).rejects.toThrow(/claims mismatch/);

    const fastForwarded = await adapter.exportExactSignals({
      ...command,
      intervalStartOffsetSec: 0.01,
      intervalDurationSec: 0.004,
    });
    const fastForwardedContent = await loadExactSignalExportContentV1(
      await stored.artifacts.readJson(fastForwarded.artifactRef),
    );
    expect(fastForwardedContent.samples).toHaveLength(3);
    expect(fastForwardedContent.samples[0]).toMatchObject({
      provenance: "accepted-step",
      revision: baseFixture.frame.revision + 5,
    });
    expect(fastForwardedContent.samples[0]!.simulationTimeSec)
      .toBeCloseTo(baseFixture.frame.acceptedTimeSec + 0.01, 12);
    expect(fastForwardedContent.manifest).toMatchObject({
      checkpointBoundarySampleCount: 0,
      acceptedStepSampleCount: 3,
      claims: {
        fastForwardIntermediateObservationsRetained: false,
      },
    });

    // The replay hosts are exclusive and disposable. Nothing on the source
    // branch, its pacing epoch, or its presentation history is touched.
    expect(internal.host).toBe(before.host);
    expect(internal.hostedSession).toBe(before.hostedSession);
    expect(internal.liveBranchId).toBe(before.liveBranchId);
    expect(internal.streamEpoch).toBe(before.streamEpoch);
    expect(internal.livePacing).toBe(before.livePacing);
    expect(internal.tracePointCount).toBe(before.tracePointCount);
    expect(internal.replayOrigins).toBe(before.replayOrigins);
    expect(internal.host.requestCount).toBe(before.liveRequestCount);
    expect(presentationEvents).toEqual([]);
    expect(harness.hosts.slice(1).every(({ terminated }) => terminated))
      .toBe(true);

    const runContent = await stored.artifacts.readJson(
      stored.runRef,
    ) as unknown as StudioRunArtifactContentV1;
    expect(runContent.claims.canonicalSignalSamplesStored).toBe(false);
    await adapter.closeSession("exact-one-second-session");
  });

  it("reloads the content-addressed origin and rejects a forged source-run binding before replay", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "forged-replay-origin-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;
    const internal = internalAdapterBranchV1(
      adapter,
      "forged-replay-origin-session",
      "scenario",
    );
    const retained = internal.replayOrigins[0]!;
    const foreignInputRef = await stored.artifacts.putJson({
      kind: "simulation-input",
      mediaType: "application/vnd.circleheart.foreign-input.v1+json",
      content: { foreign: true },
    });
    const foreignRunContent = mutableCloneV1(
      await stored.artifacts.readJson(stored.runRef),
    );
    foreignRunContent.simulationInputRef = foreignInputRef;
    const foreignRunRef = await stored.artifacts.putJson({
      kind: "run-artifact",
      mediaType:
        "application/vnd.circleheart.studio-run-artifact.v1+json",
      content: foreignRunContent,
    });
    const forgedEnvelope = mutableCloneV1(
      await stored.artifacts.readJson(retained.originRef),
    );
    forgedEnvelope.sourceRunRef = foreignRunRef;
    const forgedOriginRef = await stored.artifacts.putJson({
      kind: "replay-origin",
      mediaType: retained.originRef.mediaType,
      content: forgedEnvelope,
    });
    (
      internal as unknown as {
        replayOrigins: readonly unknown[];
      }
    ).replayOrigins = Object.freeze([Object.freeze({
      ...retained,
      originRef: forgedOriginRef,
    })]);

    await expect(adapter.exportExactSignals({
      sessionId: "forged-replay-origin-session",
      scenarioId: "scenario",
      liveBranchId: branch.liveBranchId,
      targetGeneration: 0,
      presentationRevision: 0,
      intervalStartOffsetSec: 0,
      intervalDurationSec: 0.002,
    })).rejects.toThrow(/source run and retained origin do not match/);
    expect(harness.hosts).toHaveLength(2);
    expect(harness.hosts[1]!.runTransientCallCount).toBe(0);
    await adapter.closeSession("forged-replay-origin-session");
  });

  it("bounds, serializes, and cancels export work while the isolated live lane keeps paced advancement", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    harness.yieldRunToTimer = true;
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "bounded-export-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;
    const command = Object.freeze({
      sessionId: "bounded-export-session",
      scenarioId: "scenario",
      liveBranchId: branch.liveBranchId,
      targetGeneration: 0,
      presentationRevision: 0,
      intervalStartOffsetSec: 0,
      intervalDurationSec: 0.032,
    });

    await expect(adapter.exportExactSignals({
      ...command,
      intervalDurationSec: 3_600,
    })).rejects.toThrow(/resource budget|invalid/);
    expect(harness.hosts).toHaveLength(1);

    const replayRunGate = deferredV1<void>();
    harness.runGatesByHostOrdinal.set(1, replayRunGate);
    const controller = new AbortController();
    const exportPromise = adapter.exportExactSignals(
      command,
      { signal: controller.signal },
    );
    await waitForV1(() =>
      harness.hosts[1]?.runTransientCallCount === 1
    );
    await expect(adapter.exportExactSignals({
      ...command,
      intervalDurationSec: 0.002,
    })).rejects.toThrow(/concurrency budget/);

    const liveBatches: RuntimePresentationSampleBatchV1[] = [];
    const subscription = adapter.subscribePresentationSignalChannel(
      branch.presentationSignalChannelRef,
      (event) => {
        if (event.kind === "samples") liveBatches.push(event);
      },
    );
    await adapter.resumePresentationSignalChannel(branch.presentationSignalChannelRef, 0);
    await waitForV1(() => liveBatches.length >= 1);
    await adapter.suspendPresentationSignalChannel(branch.presentationSignalChannelRef);
    expect(harness.hosts[0]!.runTransientCallCount).toBeGreaterThan(0);
    expect(harness.hosts[1]!.runTransientCallCount).toBe(1);
    expect(liveBatches[0]!.livePacing.mode).toBe("realtime-1x");

    controller.abort();
    replayRunGate.resolve();
    await expect(exportPromise).rejects.toThrow(/cancelled/);
    expect(harness.hosts[1]!.terminated).toBe(true);
    subscription.unsubscribe();

    const afterCancellation = await adapter.exportExactSignals({
      ...command,
      intervalDurationSec: 0.002,
    });
    expect(afterCancellation.manifest.coverage.sampleCount).toBe(2);
    await adapter.closeSession("bounded-export-session");
  });

  it("commits a live transition even when the replay origin cannot be stored", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "replay-origin-failure-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;
    const beforeOriginCount =
      internalAdapterBranchV1(
        adapter,
        "replay-origin-failure-session",
        "scenario",
      ).replayOrigins.length;

    // Export availability must not be part of live-lane correctness. A store
    // that refuses the replay checkpoint makes this generation
    // non-exportable; it must not suspend a numerically healthy lane.
    const putJson = stored.artifacts.putJson.bind(stored.artifacts);
    let refusals = 0;
    (stored.artifacts as unknown as {
      putJson: typeof stored.artifacts.putJson;
    }).putJson = ((...args: Parameters<typeof putJson>) => {
      const request = args[0] as Readonly<{ mediaType?: unknown }>;
      if (String(request?.mediaType ?? "").includes("replay-checkpoint")) {
        refusals += 1;
        return Promise.reject(new Error("artifact store is unavailable"));
      }
      return putJson(...args);
    }) as typeof putJson;

    const execution = adapter.startTargetIntent({
      sessionId: "replay-origin-failure-session",
      intentId: "replay-origin-failure-intent",
      targets: [{
        scenarioId: "scenario",
        liveBranchId: branch.liveBranchId,
        targetGeneration: 1,
        presentationRevision: 1,
        patch: await targetPatchV1(
          baseFixture,
          "circulation.systemic-vascular-resistance-scale",
          1.5,
        ),
      }],
    });
    const [live] = await Promise.all([execution.live, execution.strict]);

    expect(live.branches[0]!.status).toBe("success");
    const internal = internalAdapterBranchV1(
      adapter,
      "replay-origin-failure-session",
      "scenario",
    );
    expect((internal as unknown as {
      liveFailure: Error | null;
    }).liveFailure).toBeNull();
    // The lane advanced without gaining an origin, so the generation is
    // simply not exportable.
    expect(internal.replayOrigins).toHaveLength(beforeOriginCount);
    expect(refusals).toBeGreaterThan(0);
    await adapter.closeSession("replay-origin-failure-session");
  });

  it("produces identical artifacts for the same recipe and build across fresh adapters while claiming no durable ledger", async () => {
    const stored = await storeSourceV1(baseFixture);
    const firstHarness = new FakeHostHarnessV1(baseFixture);
    const firstAdapter = runtimeAdapterV1(stored, firstHarness);
    const firstOpened = await firstAdapter.openSession({
      sessionId: "recipe-scope-first-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const firstBranch = firstOpened.branches[0]!;
    const firstOrigin = internalAdapterBranchV1(
      firstAdapter,
      "recipe-scope-first-session",
      "scenario",
    ).replayOrigins[0]!;
    const firstExport = await firstAdapter.exportExactSignals({
      sessionId: "recipe-scope-first-session",
      scenarioId: "scenario",
      liveBranchId: firstBranch.liveBranchId,
      targetGeneration: 0,
      presentationRevision: 0,
      intervalStartOffsetSec: 0,
      intervalDurationSec: 0.004,
    });
    await firstAdapter.closeSession("recipe-scope-first-session");

    const secondHarness = new FakeHostHarnessV1(baseFixture);
    const secondAdapter = runtimeAdapterV1(stored, secondHarness);
    const secondOpened = await secondAdapter.openSession({
      sessionId: "recipe-scope-second-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const secondBranch = secondOpened.branches[0]!;
    const secondOrigin = internalAdapterBranchV1(
      secondAdapter,
      "recipe-scope-second-session",
      "scenario",
    ).replayOrigins[0]!;
    const secondExport = await secondAdapter.exportExactSignals({
      sessionId: "recipe-scope-second-session",
      scenarioId: "scenario",
      liveBranchId: secondBranch.liveBranchId,
      targetGeneration: 0,
      presentationRevision: 0,
      intervalStartOffsetSec: 0,
      intervalDurationSec: 0.004,
    });

    expect(secondOrigin.originRef.sha256)
      .not.toBe(firstOrigin.originRef.sha256);
    expect(secondOrigin.recipe).toEqual(firstOrigin.recipe);
    expect(secondExport.artifactRef.sha256)
      .toBe(firstExport.artifactRef.sha256);
    expect(secondExport.manifest).toMatchObject({
      determinismScope: "same-recipe-same-build-v1",
      claims: {
        sameRecipeSameBuildSampleDeterminism: true,
        durableReplayLedgerAvailable: false,
        crossBuildDeterminismClaimed: false,
      },
    });
    expect(secondExport.manifest).not.toHaveProperty("sessionId");
    expect(secondExport.manifest).not.toHaveProperty("liveBranchId");
    expect(secondExport.manifest).not.toHaveProperty("candidateId");
    expect(secondExport.manifest).not.toHaveProperty("targetGeneration");
    expect(secondExport.manifest).not.toHaveProperty(
      "presentationRevision",
    );
    await secondAdapter.closeSession("recipe-scope-second-session");
  });

  it("retains every presentation origin in the last seven target-generation groups", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    harness.strictConvergesWithoutAdvance = true;
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "replay-origin-retention-session",
      branches: [sourceBranchV1(stored, "scenario")],
    });
    const branch = opened.branches[0]!;
    const issued = await issueStrictCandidateV1(
      adapter,
      baseFixture,
      branch,
      "replay-origin-retention-session",
      "replay-origin-candidate",
    );
    await adapter.promoteSteadyCandidate({
      sessionId: "replay-origin-retention-session",
      scenarioId: "scenario",
      liveBranchId: branch.liveBranchId,
      targetGeneration: 1,
      presentationRevision: 2,
      candidate: issued.candidate,
    });

    for (let targetGeneration = 2; targetGeneration <= 7; targetGeneration += 1) {
      const targetScale = [1.5, 2, 3, 4, 0.25, 0.75][
        targetGeneration - 2
      ]!;
      const execution = adapter.startTargetIntent({
        sessionId: "replay-origin-retention-session",
        intentId: `replay-origin-intent-${targetGeneration}`,
        targets: [{
          scenarioId: "scenario",
          liveBranchId: branch.liveBranchId,
          targetGeneration,
          presentationRevision: targetGeneration + 1,
          patch: await targetPatchV1(
            baseFixture,
            "circulation.systemic-vascular-resistance-scale",
            targetScale,
          ),
        }],
      });
      const [live] = await Promise.all([
        execution.live,
        execution.strict,
      ]);
      if (live.branches[0]!.status !== "success") {
        const failure = live.branches[0]!;
        throw new Error(
          `generation ${targetGeneration}: ${
            failure.status === "failure"
              ? failure.message
              : failure.reason
          }`,
        );
      }
    }

    const internal = internalAdapterBranchV1(
      adapter,
      "replay-origin-retention-session",
      "scenario",
    );
    expect(internal.replayOrigins).toHaveLength(8);
    expect(internal.replayOrigins.map(({ correlation }) => [
      correlation.targetGeneration,
      correlation.presentationRevision,
    ])).toEqual([
      [1, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
    ]);
    expect(internal.replayOrigins[0]!.correlation.originKind)
      .toBe("live-transition");
    expect(internal.replayOrigins[1]!.correlation).toMatchObject({
      originKind: "promoted-steady-candidate",
      candidateId: issued.candidate.candidateId,
    });
    expect(internal.replayOrigins.at(-1)!.correlation).toMatchObject({
      originKind: "live-transition",
      targetGeneration: 7,
      presentationRevision: 8,
    });
    // For generation 1, checkpoint input 0 is the source and input 1 is the
    // control-fork target captured before its first accepted-step command.
    expect(harness.hosts[0]!.checkpointV4Inputs[1]!.stateIdentity)
      .toEqual({
        revision: internal.replayOrigins[0]!.recipe.boundaryRevision,
        acceptedTimeSec:
          internal.replayOrigins[0]!.recipe.boundaryTimeSec,
        totalBloodVolumeMl:
          harness.hosts[0]!.checkpointV4Inputs[1]!.stateIdentity
            .totalBloodVolumeMl,
      });

    await expect(adapter.exportExactSignals({
      sessionId: "replay-origin-retention-session",
      scenarioId: "scenario",
      liveBranchId: branch.liveBranchId,
      targetGeneration: 0,
      presentationRevision: 0,
      intervalStartOffsetSec: 0,
      intervalDurationSec: 0.002,
    })).rejects.toThrow(/outside retention/);
    const retainedExport = await adapter.exportExactSignals({
      sessionId: "replay-origin-retention-session",
      scenarioId: "scenario",
      liveBranchId: branch.liveBranchId,
      targetGeneration: 1,
      presentationRevision: 1,
      intervalStartOffsetSec: 0,
      intervalDurationSec: 0.002,
    });
    expect(retainedExport.manifest.recipe)
      .toEqual(internal.replayOrigins[0]!.recipe);
    const retainedPromotionExport = await adapter.exportExactSignals({
      sessionId: "replay-origin-retention-session",
      scenarioId: "scenario",
      liveBranchId: branch.liveBranchId,
      targetGeneration: 1,
      presentationRevision: 2,
      intervalStartOffsetSec: 0,
      intervalDurationSec: 0.002,
    });
    expect(retainedPromotionExport.manifest.recipe)
      .toEqual(internal.replayOrigins[1]!.recipe);
    await adapter.closeSession("replay-origin-retention-session");
  });
});

describe("MainWire Studio hemodynamic analysis artifact boundary", () => {
  it.each([
    {
      label: "target digest",
      mutate: (
        source: StudioSettledAnalysisSourceV1,
      ): StudioSettledAnalysisSourceV1 => Object.freeze({
        ...source,
        targetInputSha256: alternateSha256V1(source.targetInputSha256),
      }),
      expected: /settled target input identity mismatch/,
    },
    {
      label: "execution/checkpoint binding",
      mutate: (
        source: StudioSettledAnalysisSourceV1,
      ): StudioSettledAnalysisSourceV1 => Object.freeze({
        ...source,
        execution: Object.freeze({
          ...source.execution,
          protocolRef: `${source.execution.protocolRef}:foreign`,
        }),
      }),
      expected: /settled execution identity mismatch/,
    },
  ])(
    "rejects a mismatched $label before creating a Worker and keeps the rejection handled",
    async ({ mutate, expected }) => {
      const stored = await storeSourceV1(baseFixture);
      const createClient = vi.fn(() => Object.freeze({
        status: "open" as const,
        request: async () => {
          throw new Error("artifact validation must precede Worker requests");
        },
        terminate: vi.fn(),
      }));
      const host = new MainWireStudioHemodynamicAnalysisHostV1({
        artifacts: stored.artifacts,
        createClient,
        hostId: "artifact-boundary-test",
      });
      const source: StudioSettledAnalysisSourceV1 = Object.freeze({
        scenarioId: "artifact-boundary-scenario",
        targetGeneration: 0,
        sourceRole: "initial-settled-source",
        targetInputSha256: stored.targetInputSha256,
        sourceRunRef: stored.runRef,
        simulationInputRef: stored.inputRef,
        snapshotRef: stored.snapshotRef,
        execution: mainWireStudioExecutionIdentityV1(baseFixture.checkpoint),
      });

      try {
        const error = await caughtWithoutUnhandledRejectionV1(
          () => host.restoreSettledSource(mutate(source)),
        );
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toMatch(expected);
        expect(createClient).not.toHaveBeenCalled();
      } finally {
        host.terminate();
      }
    },
  );

  it("rejects an unrelated existing run artifact before creating a Worker", async () => {
    const stored = await storeSourceV1(baseFixture);
    const foreignRun = mutableCloneV1(
      await stored.artifacts.readJson(stored.runRef),
    );
    foreignRun.simulationInputRef.sha256 = alternateSha256V1(
      foreignRun.simulationInputRef.sha256,
    );
    const foreignRunRef = await stored.artifacts.putJson({
      kind: "run-artifact",
      mediaType:
        "application/vnd.circleheart.studio-run-artifact.v1+json",
      content: foreignRun as unknown as StudioJsonValueV1,
    });
    const createClient = vi.fn(() => {
      throw new Error("run lineage validation must precede Worker allocation");
    });
    const host = new MainWireStudioHemodynamicAnalysisHostV1({
      artifacts: stored.artifacts,
      createClient,
      hostId: "run-lineage-boundary-test",
    });

    await expect(host.restoreSettledSource(Object.freeze({
      scenarioId: "artifact-boundary-scenario",
      targetGeneration: 0,
      sourceRole: "initial-settled-source",
      targetInputSha256: stored.targetInputSha256,
      sourceRunRef: foreignRunRef,
      simulationInputRef: stored.inputRef,
      snapshotRef: stored.snapshotRef,
      execution: mainWireStudioExecutionIdentityV1(baseFixture.checkpoint),
    }))).rejects.toThrow(/settled source run lineage mismatch/);
    expect(createClient).not.toHaveBeenCalled();
    host.terminate();
  });

  it("restores, starts, polls, cancels, disposes, and terminates one real Host job lifecycle", async () => {
    const stored = await storeSourceV1(baseFixture);
    const sourceIdentity = hemodynamicSourceIdentityV1(baseFixture);
    const runningStart = hemodynamicJobSnapshotV1(
      sourceIdentity,
      0,
      "running",
      "vascular-ready",
    );
    const runningPoll = hemodynamicJobSnapshotV1(
      sourceIdentity,
      1,
      "running",
      "continuation",
    );
    const {
      detailMode: _omittedPollDetailMode,
      ...runningPollWithoutDetailMode
    } = runningPoll;
    const cancelled = hemodynamicJobSnapshotV1(
      sourceIdentity,
      2,
      "cancelled",
      "cancelled",
    );
    let omitDetailModeOnPoll = false;
    const request = vi.fn(async (
      command: ScientificCommandV1,
    ): Promise<MainWireScientificWorkerResponseV1> => {
      const common = analysisSuccessResponseBaseV1(command, baseFixture);
      switch (command.kind) {
        case "restoreExactSessionV4":
          return {
            ...common,
            commandKind: command.kind,
            payload: {
              kind: "sessionRestoredV4",
              researchControlContext: {
                stateIdentity: {
                  revision: sourceIdentity.revision,
                  acceptedTimeSec: sourceIdentity.acceptedTimeSec,
                  totalBloodVolumeMl: sourceIdentity.fixedTotalBloodVolumeMl,
                },
                controlState: baseFixture.checkpoint.controlTargetState,
                parameterEpoch: baseFixture.checkpoint.parameterEpoch,
              },
              observableFrame: exactRestoreFrameV1(baseFixture),
            },
          } as MainWireScientificWorkerResponseV1;
        case "startGuytonStarlingProtocolJob":
          return {
            ...common,
            commandKind: command.kind,
            payload: {
              kind: "guytonStarlingProtocolJobStarted",
              job: {
                jobId: runningStart.jobId,
                snapshot: runningStart,
                suggestedPollIntervalMs: 25,
              },
              sourceSessionUnchanged: true,
              observableFrame: exactRestoreFrameV1(baseFixture),
            },
          } as MainWireScientificWorkerResponseV1;
        case "pollGuytonStarlingProtocolJob":
          return {
            ...common,
            commandKind: command.kind,
            payload: {
              kind: "guytonStarlingProtocolJobProgress",
              snapshot: omitDetailModeOnPoll
                ? runningPollWithoutDetailMode as unknown as
                    MainWireScientificHemodynamicJobSnapshotV2
                : runningPoll,
              sourceSessionUnchanged: true,
              observableFrame: exactRestoreFrameV1(baseFixture),
            },
          } as MainWireScientificWorkerResponseV1;
        case "cancelGuytonStarlingProtocolJob":
          return {
            ...common,
            commandKind: command.kind,
            payload: {
              kind: "guytonStarlingProtocolJobCancelled",
              snapshot: cancelled,
              sourceSessionUnchanged: true,
              observableFrame: exactRestoreFrameV1(baseFixture),
            },
          } as MainWireScientificWorkerResponseV1;
        case "disposeSession":
          return {
            ...common,
            commandKind: command.kind,
            payload: {
              kind: "sessionDisposed",
              disposedSessionId: command.sessionId,
            },
          } as MainWireScientificWorkerResponseV1;
        default:
          throw new Error(`unexpected analysis command ${command.kind}`);
      }
    });
    const terminate = vi.fn();
    const createClient = vi.fn(() => ({
      status: "open" as const,
      request,
      terminate,
    }));
    const host = new MainWireStudioHemodynamicAnalysisHostV1({
      artifacts: stored.artifacts,
      createClient,
      hostId: "job-lifecycle/reader-scenario",
    });
    expect(host.hostId).toBe("job-lifecycle-reader-scenario");

    const session = await host.restoreSettledSource(Object.freeze({
      scenarioId: "job-lifecycle-scenario",
      targetGeneration: 0,
      sourceRole: "initial-settled-source",
      targetInputSha256: stored.targetInputSha256,
      sourceRunRef: stored.runRef,
      simulationInputRef: stored.inputRef,
      snapshotRef: stored.snapshotRef,
      execution: mainWireStudioExecutionIdentityV1(baseFixture.checkpoint),
    }));
    const job = await host.startGuytonStarlingJob(session, "compare");
    expect(job).toMatchObject({
      jobId: "host-job-1",
      detailMode: "compare",
      suggestedPollIntervalMs: 25,
      snapshot: {
        status: "running",
        stage: "vascular-ready",
        sequence: 0,
      },
    });
    await expect(host.pollGuytonStarlingJob(job)).resolves.toMatchObject({
      status: "running",
      stage: "continuation",
      sequence: 1,
    });
    omitDetailModeOnPoll = true;
    await expect(host.pollGuytonStarlingJob(job))
      .rejects.toThrow(/job source identity mismatch/);
    await expect(host.cancelGuytonStarlingJob(job)).resolves.toBeUndefined();
    await expect(host.disposeSession(session)).resolves.toBeUndefined();

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(request.mock.calls.map(([command]) => command.kind)).toEqual([
      "restoreExactSessionV4",
      "startGuytonStarlingProtocolJob",
      "pollGuytonStarlingProtocolJob",
      "pollGuytonStarlingProtocolJob",
      "cancelGuytonStarlingProtocolJob",
      "disposeSession",
    ]);
    expect(request.mock.calls.every(
      ([command]) => command.sessionId === session.sessionId,
    )).toBe(true);
    expect(request.mock.calls.every(
      ([command]) =>
        /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(command.requestId)
        && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(command.sessionId),
    )).toBe(true);

    host.terminate();
    host.terminate();
    expect(terminate).toHaveBeenCalledTimes(1);
    await expect(host.startGuytonStarlingJob(session, "compare"))
      .rejects.toThrow(/analysis host is terminated/);
    expect(request).toHaveBeenCalledTimes(6);
  });

  it("quarantines a client after a mismatched disposal receipt and restores with a fresh client", async () => {
    const stored = await storeSourceV1(baseFixture);
    const source = Object.freeze({
      scenarioId: "dispose-quarantine-scenario",
      targetGeneration: 0,
      sourceRole: "initial-settled-source" as const,
      targetInputSha256: stored.targetInputSha256,
      sourceRunRef: stored.runRef,
      simulationInputRef: stored.inputRef,
      snapshotRef: stored.snapshotRef,
      execution: mainWireStudioExecutionIdentityV1(baseFixture.checkpoint),
    });
    const firstTerminate = vi.fn();
    const firstRequest = vi.fn(async (
      command: ScientificCommandV1,
    ): Promise<MainWireScientificWorkerResponseV1> => {
      if (command.kind === "restoreExactSessionV4") {
        return analysisRestoreResponseV1(command, baseFixture);
      }
      if (command.kind === "disposeSession") {
        return analysisDisposeResponseV1(
          command,
          baseFixture,
          "foreign-session",
        );
      }
      throw new Error(`unexpected first client command ${command.kind}`);
    });
    const secondTerminate = vi.fn();
    const secondRequest = vi.fn(async (
      command: ScientificCommandV1,
    ): Promise<MainWireScientificWorkerResponseV1> => {
      if (command.kind === "restoreExactSessionV4") {
        return analysisRestoreResponseV1(command, baseFixture);
      }
      if (command.kind === "disposeSession") {
        return analysisDisposeResponseV1(command, baseFixture);
      }
      throw new Error(`unexpected second client command ${command.kind}`);
    });
    const clients = [
      Object.freeze({
        status: "open" as const,
        request: firstRequest,
        terminate: firstTerminate,
      }),
      Object.freeze({
        status: "open" as const,
        request: secondRequest,
        terminate: secondTerminate,
      }),
    ] as const;
    let clientIndex = 0;
    const createClient = vi.fn(() => clients[clientIndex++]!);
    const host = new MainWireStudioHemodynamicAnalysisHostV1({
      artifacts: stored.artifacts,
      createClient,
      hostId: "dispose-quarantine-host",
    });

    const firstSession = await host.restoreSettledSource(source);
    await expect(host.disposeSession(firstSession))
      .rejects.toThrow(/analysis source disposal receipt mismatch/);
    expect(firstTerminate).toHaveBeenCalledTimes(1);

    const secondSession = await host.restoreSettledSource(source);
    expect(secondSession.sessionId).not.toBe(firstSession.sessionId);
    expect(createClient).toHaveBeenCalledTimes(2);
    await expect(host.disposeSession(secondSession)).resolves.toBeUndefined();

    host.terminate();
    expect(firstTerminate).toHaveBeenCalledTimes(1);
    expect(secondTerminate).toHaveBeenCalledTimes(1);
    expect(firstRequest.mock.calls.map(([command]) => command.kind)).toEqual([
      "restoreExactSessionV4",
      "disposeSession",
    ]);
    expect(secondRequest.mock.calls.map(([command]) => command.kind)).toEqual([
      "restoreExactSessionV4",
      "disposeSession",
    ]);
  });
});

async function createBaseFixtureV1() {
  const session = await createMainWireScientificSessionV1();
  const step = session.step(0.002);
  if (step.converged === false) throw new Error(step.message);
  const checkpoint = await session.checkpointExactV4();
  const official = await buildOfficialHealthyPeriodicDocumentChainV1();
  const strictCheckpoint =
    await createMainWireScientificSessionExactCheckpointV4(
      {
        releaseRef: checkpoint.releaseRef,
        baseSessionInputSha256: session.sessionInputSha256,
        stateCodec: checkpoint.stateCodec,
      },
      {
        controlTargetState: checkpoint.controlTargetState,
        parameterEpoch: checkpoint.parameterEpoch,
        transaction: official.checkpoint.transaction,
        periodicSettlementTracker:
          official.checkpoint.periodicSettlementTracker,
      },
    );
  const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
  const strictSession = await MainWireScientificSessionV1.restoreExactV4(
    release,
    session.sessionInput,
    strictCheckpoint,
  );
  const strictSettlement = strictSession.settlePeriodic();
  if (strictSettlement.completed === false) {
    throw new Error(strictSettlement.message);
  }
  const strictBoundaryReferenceSession =
    await MainWireScientificSessionV1.restoreExactV4(
      release,
      session.sessionInput,
      strictCheckpoint,
    );
  const strictBoundaryReference = strictBoundaryReferenceSession.runTransient({
    dtSec: 0.002,
    stepCount: 500,
  });
  if (!strictBoundaryReference.completed) {
    throw new Error("strict boundary reference cycle failed");
  }
  const frame = projectMainWireScientificObservationV1(step.observation);
  const strictStateIdentity = strictSession.stateIdentity();
  return Object.freeze({
    sessionInput: session.sessionInput,
    sessionInputSha256: session.sessionInputSha256,
    stateIdentity: session.stateIdentity(),
    checkpoint,
    frame,
    strictCheckpoint,
    strictStateIdentity,
    strictFrame: frameAtV1(
      projectMainWireScientificObservationV1(
        strictBoundaryReference.finalObservation,
      ),
      strictStateIdentity.revision,
      strictStateIdentity.acceptedTimeSec,
    ),
    strictSettlement,
  });
}

async function storeSourceV1(
  base: BaseFixtureV1,
  artifacts = new InMemoryContentAddressedArtifactStoreV1(),
) {
  const inputRef = await artifacts.putJson({
    kind: "simulation-input",
    mediaType: "application/json",
    content: base.sessionInput as unknown as StudioJsonValueV1,
  });
  const snapshotRef = await putMainWireStudioSnapshotEnvelopeV1(artifacts, {
    simulationInputRef: inputRef,
    checkpointV4: base.checkpoint,
    seedObservableFrame: base.frame,
  });
  const targetInputSha256 = await mainWireStudioTargetInputSha256V1(
    base.checkpoint.controlTargetState,
    base.sessionInputSha256,
  );
  const parentRunRef = await artifacts.putJson({
    kind: "run-artifact",
    mediaType: "application/json",
    content: { source: "test-fixture-parent" },
  });
  const runRef = await artifacts.putJson({
    kind: "run-artifact",
    mediaType:
      "application/vnd.circleheart.studio-run-artifact.v1+json",
    content: {
      schemaId: STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID,
      sourceRunRef: parentRunRef,
      simulationInputRef: inputRef,
      targetInputSha256,
      snapshotRef,
      execution: mainWireStudioExecutionIdentityV1(base.checkpoint),
      claims: {
        steadyStatus: "converged",
        numericalHealth: "passed",
        snapshotIsWarmRestartable: true,
        canonicalSignalSamplesStored: false,
        canonicalWindowMetricsStored: false,
      },
    } as unknown as StudioJsonValueV1,
  });
  return Object.freeze({
    artifacts,
    inputRef,
    snapshotRef,
    runRef,
    targetInputSha256,
  });
}

class GatedSnapshotArtifactStoreV1
  extends InMemoryContentAddressedArtifactStoreV1 {
  private delayNextSnapshot = false;
  private readonly snapshotBatchStarted = deferredV1<void>();
  private readonly snapshotBatchRelease = deferredV1<void>();
  successfulSnapshotBatchCount = 0;

  delayNextSnapshotBatch(): void {
    this.delayNextSnapshot = true;
  }

  async waitForDelayedSnapshotBatch(): Promise<void> {
    await this.snapshotBatchStarted.promise;
  }

  releaseDelayedSnapshotBatch(): void {
    this.snapshotBatchRelease.resolve();
  }

  override async putJsonBatch(
    writes: readonly StudioJsonWriteV1[],
    options: Readonly<{ signal?: AbortSignal }> = {},
  ): Promise<readonly StudioArtifactRefV1[]> {
    if (
      this.delayNextSnapshot
      && writes.some(({ kind }) => kind === "snapshot-envelope")
    ) {
      this.delayNextSnapshot = false;
      this.snapshotBatchStarted.resolve();
      await this.snapshotBatchRelease.promise;
    }
    const refs = await super.putJsonBatch(writes, options);
    if (writes.some(({ kind }) => kind === "snapshot-envelope")) {
      this.successfulSnapshotBatchCount += 1;
    }
    return refs;
  }
}

function sourceBranchV1(
  stored: StoredSourceV1,
  scenarioId: string,
): OpenScenarioRuntimeBranchV1 {
  return Object.freeze({
    scenarioId,
    sourceRunRef: stored.runRef,
    sourceInputRef: stored.inputRef,
    sourceSnapshotRef: stored.snapshotRef,
    initialTargetInputSha256: stored.targetInputSha256,
  });
}

async function targetPatchV1(
  base: BaseFixtureV1,
  controlId: string,
  value: number,
): Promise<RuntimeControlPatchV1> {
  return (
    await resolveMainWireStudioTargetInputV1(
      base.checkpoint.controlTargetState,
      base.sessionInputSha256,
      { [controlId]: value },
    )
  ).patch;
}

async function issueStrictCandidateV1(
  adapter: MainWireSimulationRuntimeAdapterV1,
  base: BaseFixtureV1,
  branch: Readonly<{
    scenarioId: string;
    liveBranchId: string;
  }>,
  sessionId: string,
  intentId: string,
): Promise<Readonly<{
  candidate: RuntimeSteadyCandidateV1;
  streamEpoch: number;
}>> {
  const controlId =
    "circulation.systemic-vascular-resistance-scale" as const;
  const patch = await targetPatchV1(
    base,
    controlId,
    base.checkpoint.controlTargetState.controls[controlId],
  );
  const execution = adapter.startTargetIntent({
    sessionId,
    intentId,
    targets: [{
      scenarioId: branch.scenarioId,
      liveBranchId: branch.liveBranchId,
      targetGeneration: 1,
      presentationRevision: 1,
      patch,
    }],
  });
  const [live, strict] = await Promise.all([
    execution.live,
    execution.strict,
  ]);
  const liveBranch = live.branches[0];
  const strictBranch = strict.branches[0];
  if (
    liveBranch?.status !== "success"
    || strictBranch?.status !== "success"
  ) throw new Error("strict candidate fixture did not converge");
  return Object.freeze({
    candidate: strictBranch.candidate,
    streamEpoch: liveBranch.result.streamEpoch,
  });
}

function candidateV1(
  stored: StoredSourceV1,
  execution: RuntimeSteadyCandidateV1["execution"],
  sessionId: string,
  scenarioId: string,
  candidateId: string,
): RuntimeSteadyCandidateV1 {
  return Object.freeze({
    candidateId,
    sessionId,
    scenarioId,
    targetGeneration: 0,
    sourceRunRef: stored.runRef,
    simulationInputRef: stored.inputRef,
    targetInputSha256: stored.targetInputSha256,
    snapshotRef: stored.snapshotRef,
    execution,
    steadyStatus: "converged",
    numericalHealth: "passed",
  });
}

function runtimeAdapterV1(
  stored: StoredSourceV1,
  harness: FakeHostHarnessV1,
  overrides: Readonly<{
    liveStepCountPerChunk?: number;
    nowMs?: () => number;
    delayMs?: (durationMs: number) => Promise<void>;
    presentationEstimatorInstrumentation?:
      MainWirePresentationEstimatorInstrumentationV1;
  }> = {},
): MainWireSimulationRuntimeAdapterV1 {
  return new MainWireSimulationRuntimeAdapterV1({
    artifacts: stored.artifacts,
    hostFactory: harness.factory,
    liveStepCountPerChunk: overrides.liveStepCountPerChunk ?? 2,
    strictMaximumBeatCount: 1,
    nowMs: overrides.nowMs,
    delayMs: overrides.delayMs ?? delayV1,
    presentationEstimatorInstrumentation:
      overrides.presentationEstimatorInstrumentation,
  });
}

type InternalAdapterBranchForTestV1 = Readonly<{
  host: MainWireStudioSessionHostV1;
  hostedSession: MainWireStudioHostedSessionV1;
  liveBranchId: string;
  streamEpoch: number;
  livePacing: unknown;
  tracePointCount: number;
  replayOrigins: readonly Readonly<{
    originRef: ReplayOriginArtifactRefV1;
    correlation: Readonly<{
      originKind:
        | "opened-run"
        | "live-transition"
        | "promoted-steady-candidate";
      sessionId: string;
      scenarioId: string;
      liveBranchId: string;
      targetGeneration: number;
      presentationRevision: number;
      candidateId: string | null;
    }>;
    recipe: ExactSignalReplayRecipeV1;
  }>[];
}>;

function internalAdapterBranchV1(
  adapter: MainWireSimulationRuntimeAdapterV1,
  sessionId: string,
  scenarioId: string,
): InternalAdapterBranchForTestV1 {
  const sessions = (
    adapter as unknown as Readonly<{
      sessions: Map<string, Readonly<{
        branches: Map<string, InternalAdapterBranchForTestV1>;
      }>>;
    }>
  ).sessions;
  const branch = sessions.get(sessionId)?.branches.get(scenarioId);
  if (branch === undefined) {
    throw new Error("test could not find internal adapter branch");
  }
  return branch;
}

type FakeHostEventV1 =
  | Readonly<{
    kind: "fork-start" | "fork-complete";
    hostId: string;
    targetStateSha256: string;
  }>
  | Readonly<{
    kind: "run";
    hostId: string;
    sessionId: string;
  }>;

class FakeHostHarnessV1 {
  readonly hosts: FakeSessionHostV1[] = [];
  readonly events: FakeHostEventV1[] = [];
  readonly failRestoreAtHostOrdinals = new Set<number>();
  readonly failNextRunAtHostOrdinals = new Set<number>();
  readonly failDisposeAtHostOrdinals = new Set<number>();
  readonly partialProgressFailureNextRunAtHostOrdinals =
    new Map<number, number>();
  readonly restoreGatesByHostOrdinal =
    new Map<number, DeferredV1<void>>();
  readonly checkpointGatesByHostOrdinal =
    new Map<number, DeferredV1<void>>();
  readonly runGatesByHostOrdinal =
    new Map<number, DeferredV1<void>>();
  gateForkTargetSha256: string | null = null;
  forkGate: DeferredV1<void> | null = null;
  strictConvergesWithoutAdvance = false;
  forgeStrictZeroBeatClaim = false;
  forgeStrictTrackerTerminal = false;
  yieldRunToTimer = false;
  onRunTransient: (() => void) | null = null;

  constructor(readonly fixture: BaseFixtureV1) {}

  readonly factory: MainWireStudioSessionHostFactoryV1 = () => {
    const ordinal = this.hosts.length;
    const host = new FakeSessionHostV1(
      `fake-host-${ordinal}`,
      this,
      ordinal,
      this.failRestoreAtHostOrdinals.has(ordinal),
    );
    this.hosts.push(host);
    return host;
  };
}

class FakeSessionHostV1 implements MainWireStudioSessionHostV1 {
  readonly sessions = new Map<string, MainWireStudioHostedSessionV1>();
  readonly checkpointV4Inputs: MainWireStudioHostedSessionV1[] = [];
  readonly runTransientInputs: Array<Readonly<{
    stepCount: number;
    observationStride: number;
  }>> = [];
  private readonly strictSettledSessionIds = new Set<string>();
  requestCount = 0;
  runTransientCallCount = 0;
  settlePeriodicCallCount = 0;
  checkpointV4CallCount = 0;
  checkpointV4CompletedCount = 0;
  terminated = false;

  constructor(
    readonly hostId: string,
    private readonly harness: FakeHostHarnessV1,
    private readonly hostOrdinal: number,
    private readonly failRestore: boolean,
  ) {}

  async restoreV4(input: Readonly<{
    sessionId: string;
    resolvedSessionInput: unknown;
    checkpointV4: MainWireScientificSessionExactCheckpointV4;
  }>): Promise<MainWireStudioHostedSessionV1> {
    this.requestCount += 1;
    this.assertOpenV1();
    if (this.failRestore) throw new Error("synthetic restore failure");
    const restoreGate =
      this.harness.restoreGatesByHostOrdinal.get(this.hostOrdinal);
    if (restoreGate !== undefined) {
      this.harness.restoreGatesByHostOrdinal.delete(this.hostOrdinal);
      await restoreGate.promise;
      this.assertOpenV1();
    }
    const resolved = input.resolvedSessionInput as {
      sessionInputSha256: string;
    };
    const restoredFrame = Object.freeze({
      ...frameAtV1(
        this.harness.fixture.frame,
        input.checkpointV4.transaction.revision,
        input.checkpointV4.transaction.acceptedTimeSec,
      ),
      source: "exact-checkpoint-restore" as const,
    });
    const hosted = Object.freeze({
      ...hostedSessionV1({
      hostId: this.hostId,
      sessionId: input.sessionId,
      baseSessionInputSha256: resolved.sessionInputSha256,
      controlState: input.checkpointV4.controlTargetState,
      parameterEpoch: input.checkpointV4.parameterEpoch,
      revision: input.checkpointV4.transaction.revision,
      acceptedTimeSec: input.checkpointV4.transaction.acceptedTimeSec,
      frame: this.harness.fixture.frame,
      }),
      observableFrame: restoredFrame,
    });
    this.sessions.set(hosted.sessionId, hosted);
    return hosted;
  }

  async forkControl(input: Readonly<{
    source: MainWireStudioHostedSessionV1;
    targetSessionId: string;
    targetControlState: MainWireScientificResearchControlTargetStateV0;
  }>): Promise<MainWireStudioHostedSessionV1> {
    this.requestCount += 1;
    this.assertOwnedV1(input.source);
    const digest = await mainWireStudioTargetInputSha256V1(
      input.targetControlState,
      input.source.baseSessionInputSha256,
    );
    this.harness.events.push({
      kind: "fork-start",
      hostId: this.hostId,
      targetStateSha256: digest,
    });
    if (
      this.harness.gateForkTargetSha256 === digest
      && this.harness.forkGate !== null
    ) await this.harness.forkGate.promise;
    this.assertOpenV1();
    const hosted = hostedSessionV1({
      ...input.source,
      hostId: this.hostId,
      sessionId: input.targetSessionId,
      controlState: input.targetControlState,
      parameterEpoch:
        this.harness.strictConvergesWithoutAdvance
        && input.targetControlState.targetStateSha256
          === input.source.controlState.targetStateSha256
          ? input.source.parameterEpoch
          : input.source.parameterEpoch + 1,
      frame: input.source.observableFrame,
      revision: input.source.stateIdentity.revision,
      acceptedTimeSec: input.source.stateIdentity.acceptedTimeSec,
    });
    this.sessions.set(hosted.sessionId, hosted);
    this.harness.events.push({
      kind: "fork-complete",
      hostId: this.hostId,
      targetStateSha256: digest,
    });
    return hosted;
  }

  async runTransient(input: Readonly<{
    session: MainWireStudioHostedSessionV1;
    dtSec: number;
    stepCount: number;
    observationStride: number;
  }>): Promise<MainWireStudioTransientChunkV1> {
    this.requestCount += 1;
    this.assertOwnedV1(input.session);
    this.runTransientCallCount += 1;
    this.runTransientInputs.push(Object.freeze({
      stepCount: input.stepCount,
      observationStride: input.observationStride,
    }));
    this.harness.onRunTransient?.();
    this.harness.events.push({
      kind: "run",
      hostId: this.hostId,
      sessionId: input.session.sessionId,
    });
    if (this.harness.yieldRunToTimer) await delayV1(0);
    const runGate =
      this.harness.runGatesByHostOrdinal.get(this.hostOrdinal);
    if (runGate !== undefined) {
      this.harness.runGatesByHostOrdinal.delete(this.hostOrdinal);
      await runGate.promise;
      this.assertOwnedV1(input.session);
    }
    if (this.harness.failNextRunAtHostOrdinals.delete(this.hostOrdinal)) {
      throw new Error("synthetic transient failure");
    }
    const partialCompletedStepCount =
      this.harness.partialProgressFailureNextRunAtHostOrdinals.get(
        this.hostOrdinal,
      );
    if (partialCompletedStepCount !== undefined) {
      this.harness.partialProgressFailureNextRunAtHostOrdinals.delete(
        this.hostOrdinal,
      );
      const revision =
        input.session.stateIdentity.revision + partialCompletedStepCount;
      const acceptedTimeSec = input.session.stateIdentity.acceptedTimeSec
        + input.dtSec * partialCompletedStepCount;
      const frame = frameAtV1(
        input.session.observableFrame,
        revision,
        acceptedTimeSec,
      );
      const session = hostedSessionV1({
        ...input.session,
        frame,
        revision,
        acceptedTimeSec,
      });
      this.sessions.set(session.sessionId, session);
      throw new MainWireStudioTransientPartialProgressErrorV1(
        "synthetic accepted partial transient failure",
        {
          requestedStepCount: input.stepCount,
          completedStepCount: partialCompletedStepCount,
          acceptedPartialProgress: Object.freeze({
            session,
            observableFrames: Object.freeze([frame]),
          }),
        },
      );
    }
    const frames: MainWireScientificObservableFrameV1[] = [];
    let revision = input.session.stateIdentity.revision;
    let acceptedTimeSec = input.session.stateIdentity.acceptedTimeSec;
    for (let index = 0; index < input.stepCount; index += 1) {
      revision += 1;
      acceptedTimeSec += input.dtSec;
      if ((index + 1) % input.observationStride === 0) {
        frames.push(frameAtV1(
          input.session.observableFrame,
          revision,
          acceptedTimeSec,
        ));
      }
    }
    const frame = frameAtV1(
      input.session.observableFrame,
      revision,
      acceptedTimeSec,
    );
    if (frames.at(-1)?.revision !== revision) frames.push(frame);
    const session = hostedSessionV1({
      ...input.session,
      frame,
      revision,
      acceptedTimeSec,
    });
    this.sessions.set(session.sessionId, session);
    return Object.freeze({
      session,
      observableFrames: Object.freeze(frames),
    });
  }

  async settlePeriodic(
    session: MainWireStudioHostedSessionV1,
  ): Promise<MainWireStudioPeriodicSettlementChunkV1> {
    this.requestCount += 1;
    this.assertOwnedV1(session);
    this.settlePeriodicCallCount += 1;
    if (this.harness.strictConvergesWithoutAdvance) {
      const evidence = this.harness.fixture.strictSettlement;
      const settled = hostedSessionV1({
        ...session,
        revision: this.harness.fixture.strictStateIdentity.revision,
        acceptedTimeSec:
          this.harness.fixture.strictStateIdentity.acceptedTimeSec,
        frame: this.harness.fixture.strictFrame,
        stateIdentity: this.harness.fixture.strictStateIdentity,
      });
      this.sessions.set(settled.sessionId, settled);
      this.strictSettledSessionIds.add(settled.sessionId);
      return Object.freeze({
        session: settled,
        status: evidence.status,
        periodicSteadyStateClaimed:
          evidence.periodicSteadyStateClaimed,
        period2OrbitSuspected: evidence.period2OrbitSuspected,
        trackerStartedThisCall: evidence.trackerStartedThisCall,
        beatCompletedThisCall: evidence.beatCompletedThisCall,
        completedStepCountThisCall:
          evidence.completedStepCountThisCall,
        completedBeatCount: this.harness.forgeStrictZeroBeatClaim
          ? 0
          : evidence.completedBeatCount,
        anchorAcceptedTimeSec: evidence.anchorAcceptedTimeSec,
        anchorPhase01: evidence.anchorPhase01,
        periodicity: evidence.periodicity,
        retainedBeatClosure: evidence.retainedBeatClosure,
      });
    }
    const settled = hostedSessionV1({
      ...session,
      revision: session.stateIdentity.revision + 500,
      acceptedTimeSec: session.stateIdentity.acceptedTimeSec + 1,
      frame: frameAtV1(
        session.observableFrame,
        session.stateIdentity.revision + 500,
        session.stateIdentity.acceptedTimeSec + 1,
      ),
    });
    this.sessions.set(settled.sessionId, settled);
    return Object.freeze({
      session: settled,
      status: "tracking",
      periodicSteadyStateClaimed: false,
      period2OrbitSuspected: false,
      trackerStartedThisCall: true,
      beatCompletedThisCall: true,
      completedStepCountThisCall: 500,
      completedBeatCount: 1,
      anchorAcceptedTimeSec: session.stateIdentity.acceptedTimeSec,
      anchorPhase01: cyclePhase01V1(
        session.stateIdentity.acceptedTimeSec,
      ),
      periodicity: Object.freeze({
        status: "not-converged",
        latestBeatIndex: 1,
        consecutiveBeatsRequired: 3,
        evidenceBeatIndices: Object.freeze([]),
        latestPeriod1MaximumNormalizedDelta: 1,
        latestPeriod2MaximumNormalizedDelta: null,
      }),
      retainedBeatClosure: Object.freeze([Object.freeze({
        beatIndex: 1,
        period1: Object.freeze({
          maximumNormalizedDelta: 1,
          worstGroup: "circulation-node-volume",
          worstPath: "synthetic",
          elapsedTimeSec: 1,
        }),
        period2: null,
      })]),
    });
  }

  async checkpointV4(
    session: MainWireStudioHostedSessionV1,
  ): Promise<MainWireStudioCheckpointReceiptV1> {
    this.requestCount += 1;
    this.assertOwnedV1(session);
    this.checkpointV4CallCount += 1;
    this.checkpointV4Inputs.push(session);
    const checkpointGate =
      this.harness.checkpointGatesByHostOrdinal.get(this.hostOrdinal);
    if (checkpointGate !== undefined) {
      this.harness.checkpointGatesByHostOrdinal.delete(this.hostOrdinal);
      await checkpointGate.promise;
    }
    this.checkpointV4CompletedCount += 1;
    if (
      this.harness.strictConvergesWithoutAdvance
      && this.strictSettledSessionIds.has(session.sessionId)
    ) {
      const checkpoint = mutableCloneV1(
        this.harness.fixture.strictCheckpoint,
      );
      if (this.harness.forgeStrictTrackerTerminal) {
        const terminal = checkpoint.periodicSettlementTracker
          ?.boundaryTransactions.at(-1);
        if (terminal === undefined) {
          throw new Error("strict checkpoint fixture lacks a tracker");
        }
        terminal.circulation.state.nodeVolumesMl.LV += 1;
        // Reusing the accepted transaction's 32-bit compatibility fingerprint
        // used to make this unequal terminal pass Studio admission.
        terminal.checkpointFingerprint =
          checkpoint.transaction.checkpointFingerprint;
      }
      return Object.freeze({
        session,
        checkpointV4:
          checkpoint as MainWireScientificSessionExactCheckpointV4,
      });
    }
    const transaction = mutableCloneV1(
      this.harness.fixture.checkpoint.transaction,
    );
    transaction.revision = session.stateIdentity.revision;
    transaction.acceptedTimeSec =
      session.stateIdentity.acceptedTimeSec;
    const checkpointV4 =
      await createMainWireScientificSessionExactCheckpointV4(
        {
          releaseRef: this.harness.fixture.checkpoint.releaseRef,
          baseSessionInputSha256:
            session.baseSessionInputSha256,
          stateCodec: this.harness.fixture.checkpoint.stateCodec,
        },
        {
          controlTargetState: session.controlState,
          parameterEpoch: session.parameterEpoch,
          transaction,
          periodicSettlementTracker: null,
        },
      );
    return Object.freeze({
      session,
      checkpointV4,
    });
  }

  async dispose(sessionId: string): Promise<void> {
    this.requestCount += 1;
    this.assertOpenV1();
    if (this.harness.failDisposeAtHostOrdinals.delete(this.hostOrdinal)) {
      throw new Error("synthetic disposal receipt mismatch");
    }
    this.sessions.delete(sessionId);
  }

  terminate(): void {
    this.terminated = true;
  }

  private assertOwnedV1(session: MainWireStudioHostedSessionV1): void {
    this.assertOpenV1();
    if (session.hostId !== this.hostId) {
      throw new Error(
        `session ${session.sessionId} belongs to ${session.hostId}`,
      );
    }
    if (!this.sessions.has(session.sessionId)) {
      throw new Error(`unknown fake session ${session.sessionId}`);
    }
  }

  private assertOpenV1(): void {
    if (this.terminated) throw new Error(`host ${this.hostId} is terminated`);
  }
}

function hostedSessionV1(input: Readonly<{
  hostId: string;
  sessionId: string;
  baseSessionInputSha256: string;
  controlState: MainWireScientificResearchControlTargetStateV0;
  parameterEpoch: number;
  revision: number;
  acceptedTimeSec: number;
  frame: MainWireScientificObservableFrameV1;
  stateIdentity?: MainWireStudioHostedSessionV1["stateIdentity"];
  observableFrame?: MainWireScientificObservableFrameV1;
}>): MainWireStudioHostedSessionV1 {
  const frame = frameAtV1(
    input.frame,
    input.revision,
    input.acceptedTimeSec,
  );
  return Object.freeze({
    hostId: input.hostId,
    sessionId: input.sessionId,
    baseSessionInputSha256: input.baseSessionInputSha256,
    controlState: input.controlState,
    parameterEpoch: input.parameterEpoch,
    stateIdentity: Object.freeze({
      revision: input.revision,
      acceptedTimeSec: input.acceptedTimeSec,
      totalBloodVolumeMl:
        input.stateIdentity?.totalBloodVolumeMl ?? 5_000,
    }),
    observableFrame: frame,
  });
}

function frameAtV1(
  frame: MainWireScientificObservableFrameV1,
  revision: number,
  acceptedTimeSec: number,
): MainWireScientificObservableFrameV1 {
  return Object.freeze({
    ...frame,
    source: "accepted-step",
    revision,
    acceptedTimeSec,
  });
}

function mutableCloneV1(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

function alternateSha256V1(value: string): string {
  return value.startsWith("0") ? `1${value.slice(1)}` : `0${value.slice(1)}`;
}

function hemodynamicSourceIdentityV1(
  base: BaseFixtureV1,
): MainWireScientificProtocolSourceIdentityV1 {
  return Object.freeze({
    revision: base.checkpoint.transaction.revision,
    acceptedTimeSec: base.checkpoint.transaction.acceptedTimeSec,
    fixedTotalBloodVolumeMl:
      base.sessionInput.initialization.fixedTotalBloodVolumeMl,
  });
}

function hemodynamicJobSnapshotV1(
  source: MainWireScientificProtocolSourceIdentityV1,
  sequence: number,
  status: MainWireScientificHemodynamicJobSnapshotV2["status"],
  stage: MainWireScientificHemodynamicJobSnapshotV2["stage"],
): MainWireScientificHemodynamicJobSnapshotV2 {
  return Object.freeze({
    jobId: "host-job-1",
    detailMode: "compare",
    sequence,
    status,
    stage,
    source,
    baselinePeriodicity: "period1-converged",
    rightVascularFunction: hemodynamicVascularCurveV1("right"),
    leftVascularFunction: hemodynamicVascularCurveV1("left"),
    preloadPointEvidence: Object.freeze([]),
    fastPreloadPreview: emptyMainWireScientificFastTbvPreviewV1({
      source,
      sourceFingerprint: "host-lifecycle-source",
    }),
    progress: Object.freeze({
      completedPointCount: sequence,
      plannedPointCountLowerBound: 2,
      activeDirections: status === "running"
        ? Object.freeze(["lower-volume" as const])
        : Object.freeze([]),
      completedBeatCount: sequence,
      fastPreviewCompletedPointCount: sequence,
      fastPreviewPlannedPointCount: 9,
    }),
    result: null,
    errorMessage: null,
  });
}

function hemodynamicVascularCurveV1(
  side: MainWireScientificVascularFunctionCurveV1["side"],
): MainWireScientificVascularFunctionCurveV1 {
  return Object.freeze({
    side,
    xSemantics: side === "right"
      ? "mean-transmural-right-atrial-pressure-cvp-model-equivalent"
      : "mean-transmural-left-atrial-pressure-pcwp-surrogate",
    ySemantics: side === "right"
      ? "systemic-venous-return-l-per-min"
      : "pulmonary-venous-return-l-per-min",
    pressureReferenceOffsetMmHg: 0,
    fillingPressureAbsoluteMmHg: 7,
    fillingPressureTransmuralMmHg: 7,
    points: Object.freeze([]),
  });
}

function exactRestoreFrameV1(
  base: BaseFixtureV1,
): MainWireScientificObservableFrameV1 {
  return Object.freeze({
    ...base.frame,
    source: "exact-checkpoint-restore",
    revision: base.checkpoint.transaction.revision,
    acceptedTimeSec: base.checkpoint.transaction.acceptedTimeSec,
  });
}

function analysisSuccessResponseBaseV1(
  command: ScientificCommandV1,
  base: BaseFixtureV1,
) {
  return {
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    ok: true as const,
    requestId: command.requestId,
    sessionId: command.sessionId,
    releaseRef: base.checkpoint.releaseRef,
    sessionOrigin: {
      kind: "control-aware-exact-checkpoint-v4-restore" as const,
      checkpointSchemaVersion: 4 as const,
      checkpointSha256: base.checkpoint.checkpointSha256,
      baseSessionInputSha256: base.sessionInputSha256,
      controlTargetStateSha256:
        base.checkpoint.controlTargetStateSha256,
      parameterEpoch: base.checkpoint.parameterEpoch,
    },
    error: null,
  };
}

function analysisRestoreResponseV1(
  command: Extract<ScientificCommandV1, { kind: "restoreExactSessionV4" }>,
  base: BaseFixtureV1,
): MainWireScientificWorkerResponseV1 {
  const sourceIdentity = hemodynamicSourceIdentityV1(base);
  return {
    ...analysisSuccessResponseBaseV1(command, base),
    commandKind: command.kind,
    payload: {
      kind: "sessionRestoredV4",
      researchControlContext: {
        stateIdentity: {
          revision: sourceIdentity.revision,
          acceptedTimeSec: sourceIdentity.acceptedTimeSec,
          totalBloodVolumeMl: sourceIdentity.fixedTotalBloodVolumeMl,
        },
        controlState: base.checkpoint.controlTargetState,
        parameterEpoch: base.checkpoint.parameterEpoch,
      },
      observableFrame: exactRestoreFrameV1(base),
    },
  } as MainWireScientificWorkerResponseV1;
}

function analysisDisposeResponseV1(
  command: Extract<ScientificCommandV1, { kind: "disposeSession" }>,
  base: BaseFixtureV1,
  disposedSessionId = command.sessionId,
): MainWireScientificWorkerResponseV1 {
  return {
    ...analysisSuccessResponseBaseV1(command, base),
    commandKind: command.kind,
    payload: {
      kind: "sessionDisposed",
      disposedSessionId,
    },
  } as MainWireScientificWorkerResponseV1;
}

async function caughtWithoutUnhandledRejectionV1(
  operation: () => Promise<unknown>,
): Promise<unknown> {
  const unhandled: unknown[] = [];
  const recordUnhandled = (reason: unknown): void => {
    unhandled.push(reason);
  };
  process.on("unhandledRejection", recordUnhandled);
  try {
    const outcome = await operation().then(
      () => Object.freeze({
        status: "fulfilled" as const,
        error: null,
      }),
      (error: unknown) => Object.freeze({
        status: "rejected" as const,
        error,
      }),
    );
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(outcome.status).toBe("rejected");
    expect(unhandled).toEqual([]);
    return outcome.error;
  } finally {
    process.off("unhandledRejection", recordUnhandled);
  }
}

function cyclePhase01V1(timeSec: number): number {
  const raw = timeSec;
  const phase = raw - Math.floor(raw);
  return phase >= 1 - 1e-12 || phase < 1e-12 ? 0 : phase;
}

class FakeMonotonicClockV1 {
  private currentMs = 0;

  readonly nowMs = (): number => this.currentMs;

  readonly delayMs = async (durationMs: number): Promise<void> => {
    this.advance(durationMs);
    await delayV1(0);
  };

  advance(durationMs: number): void {
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      throw new Error("fake clock duration must be finite and nonnegative");
    }
    this.currentMs += durationMs;
  }
}

type DeferredV1<T> = Readonly<{
  promise: Promise<T>;
  resolve: (value?: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}>;

function deferredV1<T>(): DeferredV1<T> {
  let resolve!: (value?: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise as (value?: T | PromiseLike<T>) => void;
    reject = rejectPromise;
  });
  return Object.freeze({ promise, resolve, reject });
}

async function waitForV1(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    if (predicate()) return;
    await delayV1(0);
  }
  throw new Error("timed out waiting for Studio runtime test state");
}

function delayV1(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}
