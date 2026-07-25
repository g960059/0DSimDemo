import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

import {
  assembleMainWireAdultFiveWallIntegratedPreviewReleaseV1,
  loadMainWireAdultFiveWallIntegratedPreviewReleaseV1,
  MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_SHA256,
  MAIN_WIRE_INTEGRATED_PREVIEW_MECHANICAL_SUPPORT_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_ARTIFACT_PATH,
  MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_CANONICAL_SHA256,
  MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_RAW_SHA256,
  MAIN_WIRE_INTEGRATED_PREVIEW_SEED_TERMINAL_CHECKPOINT_SHA256,
} from "@/engine/scientific/assembly";
import {
  createMainWireIntegratedModelRegularSinusAllOffFixtureForGlobalBloodVolumeV3,
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  mainWireIntegratedModelPeriodicFixtureIdentityV3,
  mainWireIntegratedModelPeriodicProtocolIdentityHashV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  createMainWireIntegratedPreviewRunArtifactV1,
  loadMainWireIntegratedPreviewSeedRunV1,
  MainWireIntegratedPreviewSessionV1,
  projectMainWireIntegratedPreviewRunV2,
} from "@/engine/scientific/integratedPreview";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
  sha256TextHex,
} from "@/engine/scientific/release";
import {
  MainWireIntegratedPreviewWorkerKernelV1,
} from "@/engine/scientific/worker/MainWireIntegratedPreviewWorkerKernelV1";
import {
  MainWireIntegratedPreviewWorkerClientV1,
  type MainWireIntegratedPreviewWorkerLikeV1,
} from "@/engine/scientificBrowser/MainWireIntegratedPreviewWorkerClientV1";
import {
  MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_EXPECTED_IDENTITY_V1,
} from "@/engine/scientificBrowser/mainWireIntegratedPreviewExpectedIdentityV1";
import {
  INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
} from "@/engine/scientific/worker/integratedPreviewCommandProtocolV1";

afterEach(() => {
  vi.useRealTimers();
});

describe("integrated preview release-bound session V1", () => {
  it("loads the exact release and content-addressed P1 seed", async () => {
    const [release, assembledRelease, seed] = await Promise.all([
      loadMainWireAdultFiveWallIntegratedPreviewReleaseV1(),
      assembleMainWireAdultFiveWallIntegratedPreviewReleaseV1(),
      loadMainWireIntegratedPreviewSeedRunV1(),
    ]);

    expect(canonicalJsonStringify(release))
      .toBe(canonicalJsonStringify(assembledRelease));
    expect(release.ref.sha256)
      .toBe(MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_SHA256);
    expect(release.manifest.lifecycleStatus).toBe("development");
    expect(seed.payload.sourceEvidence.classification.status)
      .toBe("period1-converged");
    expect(seed.payload.displaySeed.terminalCycleTrace.samples).toHaveLength(504);
    expect(seed.payload.terminalModelState.checkpointSha256)
      .toBe(MAIN_WIRE_INTEGRATED_PREVIEW_SEED_TERMINAL_CHECKPOINT_SHA256);
    expect(seed.payload.startModelState.acceptedTimeSec).toBe(69);
    expect(seed.payload.terminalModelState.acceptedTimeSec).toBe(70);
    expect(seed.payload.sourceEvidence.sourceArtifact).toMatchObject({
      artifactSchemaVersion: 4,
      path:
        "data/scientific/evidence/integrated-preview-0.1.0/canonical-periodic-v3-source.json",
    });
    const sourceRaw = readFileSync(
      MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_ARTIFACT_PATH,
      "utf8",
    );
    expect(await sha256TextHex(sourceRaw))
      .toBe(MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_RAW_SHA256);
    expect(await sha256CanonicalJsonHex(JSON.parse(sourceRaw)))
      .toBe(MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_CANONICAL_SHA256);

    const session = await MainWireIntegratedPreviewSessionV1.create("all-off");
    const runRecord = await session.seedRunRecord();
    const { recordSha256, ...payload } = runRecord;
    expect(await sha256CanonicalJsonHex(payload)).toBe(recordSha256);
    expect(runRecord.releaseRef).toEqual(release.ref);
    expect(runRecord.run.numericalPeriod1Established).toBe(true);
    expect(runRecord.run.execution).toEqual({
      operation: "project-bundled-p1-seed",
      continuationBeatCountFromSeed: 0,
    });
    expect(runRecord.run.trace).toHaveLength(504);
    expect(runRecord.startModelState.checkpointSha256)
      .toBe(seed.payload.startModelState.checkpointSha256);
    expect(runRecord.terminalModelState.checkpointSha256)
      .toBe(seed.payload.terminalModelState.checkpointSha256);
    expect(runRecord.simulationInputSpecSha256).toBe(
      MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_EXPECTED_IDENTITY_V1
        .byMcsPresetId["all-off"].simulationInputSpecSha256,
    );
    expect(runRecord.startModelState.checkpointSha256).toBe(
      MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_EXPECTED_IDENTITY_V1
        .byMcsPresetId["all-off"].createStartCheckpointSha256,
    );
    const expectedClaimSha256 =
      MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_EXPECTED_IDENTITY_V1
        .checkpointClaimSha256;
    await expect(sha256CanonicalJsonHex(
      runRecord.startModelState.exactResumeClaim,
    )).resolves.toBe(expectedClaimSha256.integratedV3);
    await expect(sha256CanonicalJsonHex(
      runRecord.startModelState.coronary.exactResumeClaim,
    )).resolves.toBe(expectedClaimSha256.coronaryV3);
    await expect(sha256CanonicalJsonHex(
      runRecord.startModelState.coronary.baseCheckpointV2.exactResumeClaim,
    )).resolves.toBe(expectedClaimSha256.coronaryV2);
    await expect(sha256CanonicalJsonHex(
      runRecord.startModelState.composedRhythm.exactResumeClaim,
    )).resolves.toBe(expectedClaimSha256.composedRhythmV2);
    expect(runRecord.replayCompleteness).toMatchObject({
      stateTransitionInputIdentitiesIncluded: true,
      exactStartCheckpointIncluded: true,
      exactTerminalCheckpointIncluded: true,
      executableBuildProvenanceAttached: false,
      standaloneReplayCompleteArtifactClaimed: false,
      promotionEligibility: "eligible-with-current-runtime-exact-replay",
      upgradePath:
        "createMainWireIntegratedPreviewRunArtifactV1-with-external-BuildArtifactRefV1",
    });
    const buildArtifactRef = Object.freeze({
      schemaId: "circleheart-build-artifact-ref-v1" as const,
      simulationReleaseRef: release.ref,
      numericalRuntimeAbi: Object.freeze({
        id: "main-wire-integrated-accepted-state-runtime",
        version: "0.1.0",
      }),
      source: Object.freeze({
        repository: "g960059/0DSimDemo",
        gitCommitSha: "1".repeat(40),
        gitTreeSha: "2".repeat(40),
        gitWorktreeStatus: "clean" as const,
      }),
      artifactSha256: "3".repeat(64),
    });
    const replayArtifact =
      await createMainWireIntegratedPreviewRunArtifactV1(
        runRecord,
        buildArtifactRef,
      );
    expect(replayArtifact.content.buildArtifactRef).toEqual(buildArtifactRef);
    expect(replayArtifact.content.initializationIdentity).toEqual({
      kind: "exact-checkpoint",
      checkpointSha256: runRecord.startModelState.checkpointSha256,
    });
    expect(replayArtifact.ref.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(runRecord.simulationInputSpec.sourceProtocolIdentityHash)
      .toBe(seed.payload.sourceEvidence.protocolIdentityHash);
    const currentFixture =
      createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    expect(runRecord.simulationInputSpec.periodicFixtureIdentitySha256)
      .toBe(await sha256CanonicalJsonHex(
        await mainWireIntegratedModelPeriodicFixtureIdentityV3(currentFixture),
      ));
  }, 60_000);

  it("rejects self-consistent forged bundled-seed records at promotion", async () => {
    const [release, session] = await Promise.all([
      loadMainWireAdultFiveWallIntegratedPreviewReleaseV1(),
      MainWireIntegratedPreviewSessionV1.create("all-off"),
    ]);
    const record = await session.seedRunRecord();
    const forgedTrace = mutableClone(record);
    forgedTrace.run.trace[0]!.chamberVolumeMl.LV += 1;
    await rehashRunRecord(forgedTrace);
    await expect(createMainWireIntegratedPreviewRunArtifactV1(
      forgedTrace,
      buildArtifactRefFor(release.ref),
    )).rejects.toThrow(/differs from the current seed/);

    const forgedInput = mutableClone(record);
    forgedInput.simulationInputSpec.mechanicalSupport
      .canonicalConfigSha256 = "f".repeat(64);
    forgedInput.simulationInputSpecSha256 = await sha256CanonicalJsonHex(
      forgedInput.simulationInputSpec,
    );
    await rehashRunRecord(forgedInput);
    await expect(createMainWireIntegratedPreviewRunArtifactV1(
      forgedInput,
      buildArtifactRefFor(release.ref),
    )).rejects.toThrow(/differs from the current runtime/);

    const forgedSourceSeed = mutableClone(record);
    forgedSourceSeed.sourceSeed.terminalCheckpointSha256 = "e".repeat(64);
    forgedSourceSeed.terminalModelState.checkpointSha256 = "e".repeat(64);
    await rehashRunRecord(forgedSourceSeed);
    await expect(createMainWireIntegratedPreviewRunArtifactV1(
      forgedSourceSeed,
      buildArtifactRefFor(release.ref),
    )).rejects.toThrow(/source seed differs from the current runtime/);

    const forgedReplayClaim = mutableClone(record);
    Reflect.set(
      forgedReplayClaim.replayCompleteness,
      "standaloneReplayCompleteArtifactClaimed",
      true,
    );
    await rehashRunRecord(forgedReplayClaim);
    await expect(createMainWireIntegratedPreviewRunArtifactV1(
      forgedReplayClaim,
      buildArtifactRefFor(release.ref),
    )).rejects.toThrow(/replay-completeness claim differs/);

    const forgedNestedCheckpointPayload = mutableClone(record);
    forgedNestedCheckpointPayload.startModelState.dynamicMechanicalSupport
      .acceptedFlowMlPerSec.LVAD += 1;
    await rehashRunRecord(forgedNestedCheckpointPayload);
    await expect(createMainWireIntegratedPreviewRunArtifactV1(
      forgedNestedCheckpointPayload,
      buildArtifactRefFor(release.ref),
    )).rejects.toThrow(/checkpoint outer SHA-256 mismatch/);

    const unknownRoot = {
      ...mutableClone(record),
      unrecognizedEvidenceClaim: true,
    };
    await rehashRunRecord(unknownRoot);
    await expect(createMainWireIntegratedPreviewRunArtifactV1(
      unknownRoot,
      buildArtifactRefFor(release.ref),
    )).rejects.toThrow(/keys differ/);

    const unknownNestedTraceField = mutableClone(record);
    Reflect.set(
      unknownNestedTraceField.run.trace[0]!.diagnostics,
      "unrecognizedDiagnosticClaim",
      0,
    );
    await rehashRunRecord(unknownNestedTraceField);
    await expect(createMainWireIntegratedPreviewRunArtifactV1(
      unknownNestedTraceField,
      buildArtifactRefFor(release.ref),
    )).rejects.toThrow(/trace diagnostics 0 keys differ/);
  }, 60_000);

  it("rejects same-release build provenance for another runtime ABI", async () => {
    const [release, session] = await Promise.all([
      loadMainWireAdultFiveWallIntegratedPreviewReleaseV1(),
      MainWireIntegratedPreviewSessionV1.create("all-off"),
    ]);
    const record = await session.seedRunRecord();
    const mismatchedBuildArtifactRef = {
      ...buildArtifactRefFor(release.ref),
      numericalRuntimeAbi: {
        id: "other-structurally-valid-runtime",
        version: "0.1.0",
      },
    };

    await expect(createMainWireIntegratedPreviewRunArtifactV1(
      record,
      mismatchedBuildArtifactRef,
    )).rejects.toThrow(/numerical runtime ABI differs/);
  }, 60_000);

  it("rejects a rehashed continuation record that exact replay disproves", async () => {
    const [release, session] = await Promise.all([
      loadMainWireAdultFiveWallIntegratedPreviewReleaseV1(),
      MainWireIntegratedPreviewSessionV1.create("all-off"),
    ]);
    const record = await session.runNextBeatRecord();
    const forged = mutableClone(record);
    forged.run.trace[0]!.chamberVolumeMl.LV += 1;
    await rehashRunRecord(forged);

    await expect(createMainWireIntegratedPreviewRunArtifactV1(
      forged,
      buildArtifactRefFor(release.ref),
    )).rejects.toThrow(/not exactly reproducible/);

    const forgedOrdinal = mutableClone(record);
    if (
      forgedOrdinal.run.execution.operation
        !== "advance-one-fixed-sinus-cycle"
    ) throw new Error("expected continuation record");
    forgedOrdinal.run.execution.continuationBeatOrdinalFromSeed += 1;
    await rehashRunRecord(forgedOrdinal);
    await expect(createMainWireIntegratedPreviewRunArtifactV1(
      forgedOrdinal,
      buildArtifactRefFor(release.ref),
    )).rejects.toThrow(/replay-completeness claim differs/);

    const secondRecord = await session.runNextBeatRecord();
    expect(secondRecord.run.execution).toMatchObject({
      operation: "advance-one-fixed-sinus-cycle",
      continuationBeatOrdinalFromSeed: 2,
    });
    expect(secondRecord.replayCompleteness).toMatchObject({
      promotionEligibility: "blocked-missing-complete-seed-lineage",
      upgradePath: null,
    });
    await expect(createMainWireIntegratedPreviewRunArtifactV1(
      secondRecord,
      buildArtifactRefFor(release.ref),
    )).rejects.toThrow(/not promotion-eligible without complete seed lineage/);
  }, 60_000);

  it("binds the seed protocol identity to every live circulation parameter", async () => {
    const seed = await loadMainWireIntegratedPreviewSeedRunV1();
    const fixture =
      createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    const currentHash =
      await mainWireIntegratedModelPeriodicProtocolIdentityHashV3(
        fixture,
        {
          nominalDtSec: seed.payload.simulationInputSpec.nominalDtSec,
          executionPurpose: seed.payload.sourceEvidence.executionPurpose,
        },
      );
    expect(currentHash).toBe(seed.payload.sourceEvidence.protocolIdentityHash);

    const mutatedFixture = {
      ...fixture,
      coronaryStepInput: {
        ...fixture.coronaryStepInput,
        runtime: {
          ...fixture.coronaryStepInput.runtime,
          losses: {
            ...fixture.coronaryStepInput.runtime.losses,
            systemicResistance:
              fixture.coronaryStepInput.runtime.losses.systemicResistance
                * 1.01,
          },
        },
      },
    } as typeof fixture;
    expect(await mainWireIntegratedModelPeriodicProtocolIdentityHashV3(
      mutatedFixture,
      {
        nominalDtSec: seed.payload.simulationInputSpec.nominalDtSec,
        executionPurpose: seed.payload.sourceEvidence.executionPurpose,
      },
    )).not.toBe(currentHash);
    const mutatedBloodVolumeFixture =
      createMainWireIntegratedModelRegularSinusAllOffFixtureForGlobalBloodVolumeV3(
        fixture.fixedGlobalTotalBloodVolumeMl - 1,
      );
    expect(await mainWireIntegratedModelPeriodicProtocolIdentityHashV3(
      mutatedBloodVolumeFixture,
      {
        nominalDtSec: seed.payload.simulationInputSpec.nominalDtSec,
        executionPurpose: seed.payload.sourceEvidence.executionPurpose,
      },
    )).not.toBe(currentHash);
  });

  it("runs one atomic composed-rhythm/coronary/HMII post-activation beat", async () => {
    const session = await MainWireIntegratedPreviewSessionV1.create(
      "lvad-hmii-9000-one-beat-transient",
    );
    const runRecord = await session.runNextBeatRecord();
    const presentation = projectMainWireIntegratedPreviewRunV2(runRecord);

    expect(presentation.simulationInputSpec.mechanicalSupport).toMatchObject({
      presetId: "lvad-hmii-9000-one-beat-transient",
      activeDeviceIds: ["LVAD"],
      interpretation: "one-unsteady-post-activation-beat",
    });
    expect(presentation.run.kind).toBe("one-beat-continuation");
    expect(presentation.run.execution).toEqual({
      operation: "advance-one-fixed-sinus-cycle",
      requestedDurationSec: 1,
      continuationBeatOrdinalFromSeed: 1,
    });
    expect(presentation.run.endAcceptedTimeSec
      - presentation.run.startAcceptedTimeSec).toBe(1);
    expect(presentation.run.numericalPeriod1Established)
      .toBe("not-assessed-for-this-continuation");
    expect(presentation.trace.length).toBeGreaterThanOrEqual(500);
    expect(presentation.trace.some((sample) =>
      Math.abs(sample.dynamicMcsAcceptedFlowMlPerSec.LVAD) > 1e-6))
      .toBe(true);
    expect(presentation.trace.some((sample) =>
      sample.acceptedEventIdentity.atrialCapturedActivationId !== null))
      .toBe(true);
    expect(presentation.trace.some((sample) =>
      sample.acceptedEventIdentity.ventricularCapturedActivationId !== null))
      .toBe(true);
    expect(presentation.run.maximumTotalBloodVolumeErrorMl).toBeLessThan(1e-8);
    expect(presentation.run.maximumCoronaryBloodVolumeLedgerResidualMl)
      .toBeLessThan(1e-8);
    expect(presentation.run.maximumDynamicMcsConservationResidualMlPerSec)
      .toBeLessThan(1e-12);
    expect(presentation.startModelStateRef.acceptedTimeSec).toBe(70);
    expect(presentation.terminalModelStateRef.acceptedTimeSec).toBe(71);
    expect(runRecord.startModelState.checkpointSha256)
      .not.toBe(runRecord.terminalModelState.checkpointSha256);
    expect(runRecord.simulationInputSpecSha256).toBe(
      MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_EXPECTED_IDENTITY_V1
        .byMcsPresetId["lvad-hmii-9000-one-beat-transient"]
        .simulationInputSpecSha256,
    );
    expect(runRecord.startModelState.checkpointSha256).toBe(
      MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_EXPECTED_IDENTITY_V1
        .byMcsPresetId["lvad-hmii-9000-one-beat-transient"]
        .createStartCheckpointSha256,
    );
    expect(runRecord.replayCompleteness).toMatchObject({
      promotionEligibility: "eligible-with-current-runtime-exact-replay",
      upgradePath:
        "createMainWireIntegratedPreviewRunArtifactV1-with-external-BuildArtifactRefV1",
    });
    const replayed =
      await MainWireIntegratedPreviewSessionV1.replayOneBeatRecord(runRecord);
    expect(canonicalJsonStringify(replayed))
      .toBe(canonicalJsonStringify(runRecord));
    const promoted = await createMainWireIntegratedPreviewRunArtifactV1(
      runRecord,
      buildArtifactRefFor(runRecord.releaseRef),
    );
    expect(promoted.content.initializationIdentity).toEqual({
      kind: "exact-checkpoint",
      checkpointSha256: runRecord.startModelState.checkpointSha256,
    });
  }, 60_000);

  it("binds the complete HMII profile and command configuration by content", async () => {
    const definition =
      MAIN_WIRE_INTEGRATED_PREVIEW_MECHANICAL_SUPPORT_INPUTS_V1[
        "lvad-hmii-9000-one-beat-transient"
      ];
    const session = await MainWireIntegratedPreviewSessionV1.create(
      "lvad-hmii-9000-one-beat-transient",
    );
    expect(session.inputSpec.mechanicalSupport.canonicalProfileSha256)
      .toBe(await sha256CanonicalJsonHex(definition.profile));
    expect(session.inputSpec.mechanicalSupport.canonicalConfigSha256)
      .toBe(await sha256CanonicalJsonHex(definition.config));

    const mutatedProfile = {
      ...definition.profile,
      inertanceByDevice: {
        ...definition.profile.inertanceByDevice,
        LVAD: {
          ...definition.profile.inertanceByDevice.LVAD,
          pumpInternalMmHgSec2PerMl:
            definition.profile.inertanceByDevice.LVAD
              .pumpInternalMmHgSec2PerMl + 1e-6,
        },
      },
    };
    const mutatedConfig = {
      ...definition.config,
      lvad: {
        ...definition.config.lvad,
        speedRpm: definition.config.lvad.speedRpm + 1,
      },
    };
    expect(await sha256CanonicalJsonHex(mutatedProfile))
      .not.toBe(session.inputSpec.mechanicalSupport.canonicalProfileSha256);
    expect(await sha256CanonicalJsonHex(mutatedConfig))
      .not.toBe(session.inputSpec.mechanicalSupport.canonicalConfigSha256);
  });

  it("exposes only exact, bounded Worker commands and complete run records", async () => {
    const kernel = new MainWireIntegratedPreviewWorkerKernelV1(1);
    const invalid = await kernel.handle({
      protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
      kind: "createSession",
      requestId: "request-invalid",
      sessionId: "preview-session",
      mcsPresetId: "all-off",
      ignoredFallback: true,
    });
    expect(invalid).toMatchObject({
      ok: false,
      error: { code: "invalid-command" },
    });

    const created = await kernel.handle({
      protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
      kind: "createSession",
      requestId: "request-create",
      sessionId: "preview-session",
      mcsPresetId: "all-off",
    });
    expect(created.ok).toBe(true);
    if (created.ok === false) throw new Error(created.error.message);
    expect(created.runRecord?.terminalModelState.checkpointSha256)
      .toBe(MAIN_WIRE_INTEGRATED_PREVIEW_SEED_TERMINAL_CHECKPOINT_SHA256);
    expect(created.presentation?.trace).toHaveLength(504);

    const disposed = await kernel.handle({
      protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
      kind: "disposeSession",
      requestId: "request-dispose",
      sessionId: "preview-session",
    });
    expect(disposed).toMatchObject({
      ok: true,
      disposed: true,
      runRecord: null,
      presentation: null,
    });
  });

  it("quarantines the entire stateful Worker after an unknown timeout outcome", async () => {
    vi.useFakeTimers();
    const worker = new DelayedIntegratedPreviewWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
      requestTimeoutMs: 25,
    });
    const first = client.createSession("session-a", "all-off");
    const second = client.createSession("session-b", "all-off");
    const firstRejected = expect(first).rejects.toThrow(
      /outcome is unknown and was quarantined/,
    );
    const secondRejected = expect(second).rejects.toThrow(
      /outcome is unknown and was quarantined/,
    );

    await vi.advanceTimersByTimeAsync(25);
    await Promise.all([firstRejected, secondRejected]);
    expect(worker.terminateCount).toBe(1);
    expect(worker.listenerCount).toBe(0);
    worker.emitLateResponse();
    await expect(client.createSession("session-c", "all-off"))
      .rejects.toThrow(/client is terminated/);
  });

  it("quarantines responses whose request, session, or command kind does not match", async () => {
    const requestWorker = new DelayedIntegratedPreviewWorker();
    const requestClient = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => requestWorker,
    });
    const request = requestClient.createSession("request-identity", "all-off");
    const requestRejected = expect(request).rejects.toThrow(
      /response is unsolicited/,
    );
    requestWorker.emitResponse({
      ...validErrorResponse(requestWorker.commandAt(0)),
      requestId: "different-request",
    });
    await requestRejected;
    expect(requestWorker.terminateCount).toBe(1);
    expect(requestWorker.listenerCount).toBe(0);

    const sessionWorker = new DelayedIntegratedPreviewWorker();
    const sessionClient = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => sessionWorker,
    });
    const sessionRequest =
      sessionClient.createSession("session-identity", "all-off");
    const sessionRejected = expect(sessionRequest).rejects.toThrow(
      /response identity does not match pending request/,
    );
    sessionWorker.emitResponse(validErrorResponse(
      sessionWorker.commandAt(0),
      { sessionId: "different-session" },
    ));
    await sessionRejected;
    expect(sessionWorker.terminateCount).toBe(1);
    expect(sessionWorker.listenerCount).toBe(0);

    const kindWorker = new DelayedIntegratedPreviewWorker();
    const kindClient = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => kindWorker,
    });
    const kindRequest = kindClient.createSession("kind-identity", "all-off");
    const kindRejected = expect(kindRequest).rejects.toThrow(
      /response identity does not match pending request/,
    );
    kindWorker.emitResponse(validErrorResponse(
      kindWorker.commandAt(0),
      { commandKind: "runNextBeat" },
    ));
    await kindRejected;
    expect(kindWorker.terminateCount).toBe(1);
    expect(kindWorker.listenerCount).toBe(0);
  });

  it("rejects non-exact success and error response unions", async () => {
    const successWorker = new DelayedIntegratedPreviewWorker();
    const successClient = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => successWorker,
    });
    const successRequest =
      successClient.createSession("success-shape", "all-off");
    const successRejected = expect(successRequest).rejects.toThrow(
      /response is invalid/,
    );
    const successCommand = successWorker.commandAt(0);
    successWorker.emitResponse({
      protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
      ok: true,
      requestId: successCommand.requestId,
      sessionId: successCommand.sessionId,
      commandKind: successCommand.kind,
      releaseRef: TEST_RELEASE_REF,
      runRecord: null,
      presentation: null,
      disposed: true,
      unexpectedField: "must fail closed",
    });
    await successRejected;
    expect(successWorker.terminateCount).toBe(1);

    const errorWorker = new DelayedIntegratedPreviewWorker();
    const errorClient = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => errorWorker,
    });
    const errorRequest = errorClient.createSession("error-shape", "all-off");
    const errorRejected = expect(errorRequest).rejects.toThrow(
      /response is invalid/,
    );
    const errorCommand = errorWorker.commandAt(0);
    errorWorker.emitResponse({
      ...validErrorResponse(errorCommand),
      error: {
        code: "command-failed",
        message: "malformed response",
        retryable: false,
      },
    });
    await errorRejected;
    expect(errorWorker.terminateCount).toBe(1);
  });

  it("quarantines the Worker immediately on error and messageerror events", async () => {
    const failedWorker = new DelayedIntegratedPreviewWorker();
    const failedClient = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => failedWorker,
    });
    const failedRequest = failedClient.createSession("worker-error", "all-off");
    const failedRejected = expect(failedRequest).rejects.toThrow(
      /simulated Worker failure/,
    );
    failedWorker.emitError("simulated Worker failure");
    await failedRejected;
    expect(failedWorker.terminateCount).toBe(1);
    expect(failedWorker.listenerCount).toBe(0);

    const messageErrorWorker = new DelayedIntegratedPreviewWorker();
    const messageErrorClient = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => messageErrorWorker,
    });
    const messageErrorRequest =
      messageErrorClient.createSession("message-error", "all-off");
    const messageErrorRejected = expect(messageErrorRequest).rejects.toThrow(
      /messageerror event/,
    );
    messageErrorWorker.emitMessageError();
    await messageErrorRejected;
    expect(messageErrorWorker.terminateCount).toBe(1);
    expect(messageErrorWorker.listenerCount).toBe(0);
  });
});

type DeepMutable<T> =
  T extends readonly (infer TItem)[]
    ? DeepMutable<TItem>[]
    : T extends object
      ? { -readonly [TKey in keyof T]: DeepMutable<T[TKey]> }
      : T;

function mutableClone<T>(value: T): DeepMutable<T> {
  return JSON.parse(JSON.stringify(value)) as DeepMutable<T>;
}

async function rehashRunRecord<TRecord extends { recordSha256: string }>(
  record: TRecord,
): Promise<TRecord> {
  const { recordSha256: _ignored, ...payload } = record;
  record.recordSha256 = await sha256CanonicalJsonHex(payload);
  return record;
}

function buildArtifactRefFor(
  releaseRef: Readonly<{ id: string; version: string; sha256: string }>,
) {
  return {
    schemaId: "circleheart-build-artifact-ref-v1",
    simulationReleaseRef: releaseRef,
    numericalRuntimeAbi: {
      id: "main-wire-integrated-accepted-state-runtime",
      version: "0.1.0",
    },
    source: {
      repository: "g960059/0DSimDemo",
      gitCommitSha: "1".repeat(40),
      gitTreeSha: "2".repeat(40),
      gitWorktreeStatus: "clean",
    },
    artifactSha256: "3".repeat(64),
  };
}

type PostedCommand = Readonly<{
  requestId: string;
  sessionId: string;
  kind: "createSession" | "runNextBeat" | "disposeSession";
}>;

const TEST_RELEASE_REF = Object.freeze({
  id: "test-integrated-preview-release",
  version: "1.0.0",
  sha256: "a".repeat(64),
});

function validErrorResponse(
  command: PostedCommand,
  overrides: Partial<Readonly<{
    sessionId: string;
    commandKind: PostedCommand["kind"];
  }>> = {},
): Readonly<Record<string, unknown>> {
  return {
    protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
    ok: false,
    requestId: command.requestId,
    sessionId: overrides.sessionId ?? command.sessionId,
    commandKind: overrides.commandKind ?? command.kind,
    releaseRef: null,
    error: {
      code: "command-failed",
      message: "simulated command failure",
    },
  };
}

class DelayedIntegratedPreviewWorker
implements MainWireIntegratedPreviewWorkerLikeV1 {
  readonly posted: unknown[] = [];
  private readonly messageListeners = new Set<
    (event: MessageEvent<unknown>) => void
  >();
  private readonly messageErrorListeners = new Set<
    (event: MessageEvent<unknown>) => void
  >();
  private readonly errorListeners = new Set<
    (event: ErrorEvent) => void
  >();
  terminateCount = 0;

  get listenerCount(): number {
    return this.messageListeners.size
      + this.messageErrorListeners.size
      + this.errorListeners.size;
  }

  postMessage(message: unknown): void {
    this.posted.push(message);
  }

  terminate(): void {
    this.terminateCount += 1;
  }

  addEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  addEventListener(
    type: "messageerror",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  addEventListener(
    type: "error",
    listener: (event: ErrorEvent) => void,
  ): void;
  addEventListener(
    type: "message" | "messageerror" | "error",
    listener:
      | ((event: MessageEvent<unknown>) => void)
      | ((event: ErrorEvent) => void),
  ): void {
    if (type === "message") {
      this.messageListeners.add(
        listener as (event: MessageEvent<unknown>) => void,
      );
    } else if (type === "messageerror") {
      this.messageErrorListeners.add(
        listener as (event: MessageEvent<unknown>) => void,
      );
    } else {
      this.errorListeners.add(listener as (event: ErrorEvent) => void);
    }
  }

  removeEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  removeEventListener(
    type: "messageerror",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  removeEventListener(
    type: "error",
    listener: (event: ErrorEvent) => void,
  ): void;
  removeEventListener(
    type: "message" | "messageerror" | "error",
    listener:
      | ((event: MessageEvent<unknown>) => void)
      | ((event: ErrorEvent) => void),
  ): void {
    if (type === "message") {
      this.messageListeners.delete(
        listener as (event: MessageEvent<unknown>) => void,
      );
    } else if (type === "messageerror") {
      this.messageErrorListeners.delete(
        listener as (event: MessageEvent<unknown>) => void,
      );
    } else {
      this.errorListeners.delete(listener as (event: ErrorEvent) => void);
    }
  }

  commandAt(index: number): PostedCommand {
    const command = this.posted[index] as PostedCommand | undefined;
    if (command === undefined) throw new Error("expected posted command");
    return command;
  }

  emitResponse(data: unknown): void {
    const event = { data } as MessageEvent<unknown>;
    for (const listener of this.messageListeners) listener(event);
  }

  emitMessageError(): void {
    const event = { data: null } as MessageEvent<unknown>;
    for (const listener of this.messageErrorListeners) listener(event);
  }

  emitError(message: string): void {
    const event = {
      message,
      error: new Error(message),
      preventDefault: vi.fn(),
    } as unknown as ErrorEvent;
    for (const listener of this.errorListeners) listener(event);
  }

  emitLateResponse(): void {
    const first = this.posted[0] as PostedCommand | undefined;
    if (first === undefined) return;
    this.emitResponse(validErrorResponse(first));
  }
}
