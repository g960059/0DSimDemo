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
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificCommandV1,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import type {
  MainWireScientificWorkerResponseV1,
} from "@/engine/scientificBrowser/MainWireScientificWorkerClientV1";
import {
  MainWireBrowserWorkerSessionHostV1,
  MainWireSimulationRuntimeAdapterV1,
  MainWireStudioTransientPartialProgressErrorV1,
  loadMainWireStudioSnapshotEnvelopeV1,
  mainWireStudioExecutionIdentityV1,
  mainWireStudioTargetInputSha256V1,
  putMainWireStudioSnapshotEnvelopeV1,
  resolveMainWireStudioTargetInputV1,
  type MainWireStudioCheckpointReceiptV1,
  type MainWireStudioHostedSessionV1,
  type MainWireStudioPeriodicSettlementChunkV1,
  type MainWireStudioSessionHostFactoryV1,
  type MainWireStudioSessionHostV1,
  type MainWireStudioTransientChunkV1,
} from "@/studio/adapters/mainWire";
import {
  MainWireStudioHemodynamicAnalysisHostV1,
} from "@/studio/adapters/mainWire/MainWireStudioHemodynamicAnalysisHostV1";
import type {
  OpenScenarioRuntimeBranchV1,
  RuntimeControlPatchV1,
  RuntimeSignalBatchV1,
  RuntimeSignalEventV1,
  RuntimeSteadyCandidateV1,
  StudioSettledAnalysisSourceV1,
  StudioJsonValueV1,
} from "@/studio/contracts/v1";
import {
  STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID,
} from "@/studio/contracts/v1";
import {
  InMemoryContentAddressedArtifactStoreV1,
} from "@/studio/infrastructure/artifacts/InMemoryContentAddressedArtifactStoreV1";
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
    const loaded = await loadMainWireStudioSnapshotEnvelopeV1(value);

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

    const historyClaim = mutableCloneV1(value);
    historyClaim.claims.seedObservablePointCount = 2;
    await expect(
      loadMainWireStudioSnapshotEnvelopeV1(historyClaim),
    ).rejects.toThrow(/snapshot claims mismatch/);

    const shiftedSeed = mutableCloneV1(value);
    shiftedSeed.seedObservableFrame.acceptedTimeSec += 0.002;
    await expect(
      loadMainWireStudioSnapshotEnvelopeV1(shiftedSeed),
    ).rejects.toThrow(/revision\/time does not match checkpoint/);

    const wrongSeedSource = mutableCloneV1(value);
    wrongSeedSource.seedObservableFrame.source = "exact-checkpoint-restore";
    await expect(
      loadMainWireStudioSnapshotEnvelopeV1(wrongSeedSource),
    ).rejects.toThrow(/seed observable frame identity is invalid/);

    const wrongSeedQuality = mutableCloneV1(value);
    wrongSeedQuality.seedObservableFrame.values[
      "hemodynamics.volume.LV"
    ].quality = "accepted-derived";
    await expect(
      loadMainWireStudioSnapshotEnvelopeV1(wrongSeedQuality),
    ).rejects.toThrow(/observable hemodynamics\.volume\.LV is invalid/);

    const extraHistory = mutableCloneV1(value);
    extraHistory.beatSamples = [];
    await expect(
      loadMainWireStudioSnapshotEnvelopeV1(extraHistory),
    ).rejects.toThrow(/field set mismatch/);

    const alteredCheckpoint = mutableCloneV1(value);
    alteredCheckpoint.checkpointV4.parameterEpoch += 1;
    await expect(
      loadMainWireStudioSnapshotEnvelopeV1(alteredCheckpoint),
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

  it("streams 1x live points and suspends/resumes at host command boundaries", async () => {
    const stored = await storeSourceV1(baseFixture);
    const harness = new FakeHostHarnessV1(baseFixture);
    const adapter = runtimeAdapterV1(stored, harness);
    const opened = await adapter.openSession({
      sessionId: "signal-session",
      branches: [sourceBranchV1(stored, "signal-scenario")],
    });
    const branch = opened.branches[0]!;
    const batches: RuntimeSignalBatchV1[] = [];
    const subscription = adapter.subscribeSignalChannel(
      branch.signalChannelRef,
      (event) => {
        if (event.kind === "samples") batches.push(event);
      },
    );

    await adapter.resumeSignalChannel(branch.signalChannelRef, 0);
    await waitForV1(() => batches.length >= 1);
    await adapter.suspendSignalChannel(branch.signalChannelRef);
    const countAtSuspend = harness.hosts[0]!.runTransientCallCount;
    await delayV1(5);

    expect(harness.hosts[0]!.runTransientCallCount).toBe(countAtSuspend);
    expect(batches[0]).toMatchObject({
      channelId: branch.signalChannelRef.channelId,
      sessionId: "signal-session",
      scenarioId: "signal-scenario",
      liveBranchId: branch.liveBranchId,
      targetGeneration: 0,
      presentationRevision: 0,
      streamEpoch: 0,
    });
    expect(batches[0]!.points).toHaveLength(2);
    expect(batches[0]!.points[1]!.sequence)
      .toBeGreaterThan(batches[0]!.points[0]!.sequence);

    await adapter.resumeSignalChannel(branch.signalChannelRef, 0);
    await waitForV1(
      () => harness.hosts[0]!.runTransientCallCount > countAtSuspend,
    );
    await adapter.suspendSignalChannel(branch.signalChannelRef);
    subscription.unsubscribe();
    await adapter.closeSession("signal-session");
    expect(harness.hosts[0]!.terminated).toBe(true);
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
    expect(strict.branches[0]!.status).toBe("success");
    if (strict.branches[0]!.status !== "success") {
      throw new Error("strict fixture did not create a candidate");
    }
    const candidateEnvelope = await loadMainWireStudioSnapshotEnvelopeV1(
      await stored.artifacts.readJson(
        strict.branches[0]!.candidate.snapshotRef,
      ),
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
    const batches: RuntimeSignalBatchV1[] = [];
    adapter.subscribeSignalChannel(
      branch.signalChannelRef,
      (event) => {
        if (event.kind === "samples") batches.push(event);
      },
    );
    await adapter.resumeSignalChannel(
      branch.signalChannelRef,
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
    await adapter.suspendSignalChannel(branch.signalChannelRef);
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
      initialFrame: {
        windowMetrics: {
          status: "collecting",
          collectedPointCount: 1,
          completedCycleCount: 0,
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
    const batches: RuntimeSignalBatchV1[] = [];
    adapter.subscribeSignalChannel(branch.signalChannelRef, (event) => {
      if (event.kind === "samples") batches.push(event);
    });
    await adapter.resumeSignalChannel(branch.signalChannelRef, 0);
    await waitForV1(() => harness.hosts[0]!.runTransientCallCount === 1);

    const suspending =
      adapter.suspendSignalChannel(branch.signalChannelRef);
    const resuming =
      adapter.resumeSignalChannel(branch.signalChannelRef, 0);
    runGate.resolve();
    await Promise.all([suspending, resuming]);
    await waitForV1(() =>
      harness.hosts[0]!.runTransientCallCount >= 2 && batches.length >= 2);
    await adapter.suspendSignalChannel(branch.signalChannelRef);

    const sequences = batches.flatMap(({ points }) =>
      points.map(({ sequence }) => sequence));
    expect(sequences.length).toBeGreaterThanOrEqual(4);
    for (let index = 1; index < sequences.length; index += 1) {
      expect(sequences[index]).toBe(sequences[index - 1]! + 1);
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
    const events: RuntimeSignalEventV1[] = [];
    adapter.subscribeSignalChannel(
      branch.signalChannelRef,
      (event) => events.push(event),
    );
    await adapter.resumeSignalChannel(branch.signalChannelRef, 0);
    await waitForV1(() => events.some(({ kind }) => kind === "failure"));

    expect(events.find(({ kind }) => kind === "failure")).toMatchObject({
      kind: "failure",
      targetGeneration: 0,
      presentationRevision: 0,
      streamEpoch: 0,
      message: expect.stringMatching(/synthetic transient failure/),
    });
    await expect(adapter.resumeSignalChannel(branch.signalChannelRef, 0))
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
    const events: RuntimeSignalEventV1[] = [];
    adapter.subscribeSignalChannel(
      branch.signalChannelRef,
      (event) => events.push(event),
    );

    await adapter.resumeSignalChannel(branch.signalChannelRef, 0);
    await waitForV1(() => events.some(({ kind }) => kind === "failure"));

    const workerAccepted = [...harness.hosts[0]!.sessions.values()][0]!;
    expect(workerAccepted.stateIdentity).toMatchObject({
      revision: baseFixture.frame.revision + 1,
      acceptedTimeSec: baseFixture.frame.acceptedTimeSec + 0.002,
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
    await expect(adapter.resumeSignalChannel(branch.signalChannelRef, 0))
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
    expect(harness.hosts[0]!.checkpointV4Inputs).toHaveLength(2);
    expect(harness.hosts[0]!.checkpointV4Inputs[1]!.stateIdentity)
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
    const batches: RuntimeSignalBatchV1[] = [];
    adapter.subscribeSignalChannel(branch.signalChannelRef, (event) => {
      if (event.kind === "samples") batches.push(event);
    });
    await adapter.resumeSignalChannel(
      branch.signalChannelRef,
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
    const finalLivePhase = batches.at(-1)?.points.at(-1)?.phase01;
    const candidatePhase = promoted.initialFrame.point.phase01;
    expect(finalLivePhase).not.toBeNull();
    expect(candidatePhase).not.toBeNull();
    const phaseDistance = Math.abs(
      (finalLivePhase as number) - (candidatePhase as number),
    );
    expect(Math.min(phaseDistance, 1 - phaseDistance)).toBeLessThan(1e-9);
    await adapter.closeSession("phase-promotion-session");
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
    const cancelled = hemodynamicJobSnapshotV1(
      sourceIdentity,
      2,
      "cancelled",
      "cancelled",
    );
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
              snapshot: runningPoll,
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
    await expect(host.cancelGuytonStarlingJob(job)).resolves.toBeUndefined();
    await expect(host.disposeSession(session)).resolves.toBeUndefined();

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(request.mock.calls.map(([command]) => command.kind)).toEqual([
      "restoreExactSessionV4",
      "startGuytonStarlingProtocolJob",
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
    expect(request).toHaveBeenCalledTimes(5);
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
      frame,
      strictStateIdentity.revision,
      strictStateIdentity.acceptedTimeSec,
    ),
    strictSettlement,
  });
}

async function storeSourceV1(base: BaseFixtureV1) {
  const artifacts = new InMemoryContentAddressedArtifactStoreV1();
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
  }> = {},
): MainWireSimulationRuntimeAdapterV1 {
  return new MainWireSimulationRuntimeAdapterV1({
    artifacts: stored.artifacts,
    hostFactory: harness.factory,
    liveStepCountPerChunk: overrides.liveStepCountPerChunk ?? 2,
    strictMaximumBeatCount: 1,
    nowMs: overrides.nowMs,
    delayMs: delayV1,
  });
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
  readonly partialProgressFailureNextRunAtHostOrdinals =
    new Map<number, number>();
  readonly restoreGatesByHostOrdinal =
    new Map<number, DeferredV1<void>>();
  readonly runGatesByHostOrdinal =
    new Map<number, DeferredV1<void>>();
  gateForkTargetSha256: string | null = null;
  forkGate: DeferredV1<void> | null = null;
  strictConvergesWithoutAdvance = false;
  forgeStrictZeroBeatClaim = false;
  forgeStrictTrackerTerminal = false;
  yieldRunToTimer = false;

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
  runTransientCallCount = 0;
  settlePeriodicCallCount = 0;
  checkpointV4CallCount = 0;
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
    const hosted = hostedSessionV1({
      hostId: this.hostId,
      sessionId: input.sessionId,
      baseSessionInputSha256: resolved.sessionInputSha256,
      controlState: input.checkpointV4.controlTargetState,
      parameterEpoch: input.checkpointV4.parameterEpoch,
      revision: input.checkpointV4.transaction.revision,
      acceptedTimeSec: input.checkpointV4.transaction.acceptedTimeSec,
      frame: this.harness.fixture.frame,
    });
    this.sessions.set(hosted.sessionId, hosted);
    return hosted;
  }

  async forkControl(input: Readonly<{
    source: MainWireStudioHostedSessionV1;
    targetSessionId: string;
    targetControlState: MainWireScientificResearchControlTargetStateV0;
  }>): Promise<MainWireStudioHostedSessionV1> {
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
    this.assertOwnedV1(input.session);
    this.runTransientCallCount += 1;
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
    const frame = frames.at(-1)
      ?? frameAtV1(
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
    return Object.freeze({
      session,
      observableFrames: Object.freeze(frames),
    });
  }

  async settlePeriodic(
    session: MainWireStudioHostedSessionV1,
  ): Promise<MainWireStudioPeriodicSettlementChunkV1> {
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
    this.assertOwnedV1(session);
    this.checkpointV4CallCount += 1;
    this.checkpointV4Inputs.push(session);
    if (this.harness.strictConvergesWithoutAdvance) {
      const checkpoint = mutableCloneV1(
        this.harness.fixture.strictCheckpoint,
      );
      if (this.harness.forgeStrictTrackerTerminal) {
        const terminal = checkpoint.periodicSettlementTracker
          ?.boundaryTransactions.at(-1);
        if (terminal === undefined) {
          throw new Error("strict checkpoint fixture lacks a tracker");
        }
        terminal.checkpointFingerprint = "deadbeef";
      }
      return Object.freeze({
        session,
        checkpointV4:
          checkpoint as MainWireScientificSessionExactCheckpointV4,
      });
    }
    return Object.freeze({
      session,
      checkpointV4: this.harness.fixture.checkpoint,
    });
  }

  async dispose(sessionId: string): Promise<void> {
    this.assertOpenV1();
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
