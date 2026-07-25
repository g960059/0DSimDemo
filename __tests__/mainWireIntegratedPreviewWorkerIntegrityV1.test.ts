import { describe, expect, it } from "vitest";

import integratedPreviewReleaseArtifactRaw from
  "@/engine/scientific/assembly/releases/main-wire-adult-five-wall-integrated-preview-0.1.0.json?raw";
import integratedPreviewSeedRunRaw from
  "@/data/scientific/releases/integrated-preview-0.1.0/normal-sinus-periodic-seed-run-v1.json?raw";
import type {
  MainWireIntegratedPreviewRunPresentationV2,
  MainWireIntegratedPreviewRunRecordV2,
} from "@/engine/scientific/integratedPreview";
import {
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";
import {
  INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
  type IntegratedPreviewCommandV1,
  type IntegratedPreviewSuccessResponseV1,
} from "@/engine/scientific/worker/integratedPreviewCommandProtocolV1";
import {
  MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_EXPECTED_IDENTITY_V1,
  MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_RELEASE_REF_V1,
  MainWireIntegratedPreviewWorkerClientV1,
  type MainWireIntegratedPreviewWorkerLikeV1,
} from "@/engine/scientificBrowser/MainWireIntegratedPreviewWorkerClientV1";

describe("integrated preview Worker response integrity V1", () => {
  it("accepts a response whose record and presentation share one exact identity", async () => {
    const worker = new IntegrityWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
    });
    const pending = client.createSession("integrity-valid", "all-off");
    const response = await successResponse(worker.commandAt(0));

    worker.emit(response);

    await expect(pending).resolves.toEqual(response);
    expect(worker.terminateCount).toBe(0);
    client.terminate();
  });

  it.each([
    [
      "simulation input",
      (response: IntegratedPreviewSuccessResponseV1) => ({
        ...response,
        presentation: {
          ...response.presentation!,
          simulationInputSpec: {
            ...response.presentation!.simulationInputSpec,
            rhythm: {
              ...response.presentation!.simulationInputSpec.rhythm,
              heartRateBpm: 61,
            },
          },
        },
      }),
    ],
    [
      "source seed",
      (response: IntegratedPreviewSuccessResponseV1) => ({
        ...response,
        presentation: {
          ...response.presentation!,
          sourceSeed: {
            ...response.presentation!.sourceSeed,
            protocolIdentityHash: "b".repeat(64),
          },
        },
      }),
    ],
    [
      "run ledger",
      (response: IntegratedPreviewSuccessResponseV1) => ({
        ...response,
        presentation: {
          ...response.presentation!,
          run: {
            ...response.presentation!.run,
            maximumTotalBloodVolumeErrorMl: 1,
          },
        },
      }),
    ],
    [
      "trace",
      (response: IntegratedPreviewSuccessResponseV1) => ({
        ...response,
        presentation: {
          ...response.presentation!,
          trace: [{ tampered: true }],
        },
      }),
    ],
  ])("quarantines a mismatched presentation %s subtree", async (
    _label,
    mutate,
  ) => {
    const worker = new IntegrityWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
    });
    const pending = client.createSession("integrity-presentation", "all-off");
    const response = await successResponse(worker.commandAt(0));

    worker.emit(mutate(response));

    await expect(pending).rejects.toThrow(
      /presentation is not the exact projection of the run record/,
    );
    expect(worker.terminateCount).toBe(1);
    expect(worker.listenerCount).toBe(0);
  });

  it("quarantines a run record changed without updating its digest", async () => {
    const worker = new IntegrityWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
    });
    const pending = client.createSession("integrity-record", "all-off");
    const response = await successResponse(worker.commandAt(0));
    const runRecord = response.runRecord!;

    worker.emit({
      ...response,
      runRecord: {
        ...runRecord,
        run: {
          ...runRecord.run,
          trace: [{ tampered: true }],
        },
      },
    });

    await expect(pending).rejects.toThrow(
      /run record SHA-256 does not match its canonical payload/,
    );
    expect(worker.terminateCount).toBe(1);
  });

  it("independently verifies the simulation input digest", async () => {
    const worker = new IntegrityWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
    });
    const pending = client.createSession("integrity-input", "all-off");
    const response = await successResponse(worker.commandAt(0));
    const original = response.runRecord!;
    const { recordSha256: _recordSha256, ...originalPayload } = original;
    const alteredPayload = {
      ...originalPayload,
      simulationInputSpec: {
        ...original.simulationInputSpec,
        rhythm: {
          ...original.simulationInputSpec.rhythm,
          heartRateBpm: 61,
        },
      },
    };
    const alteredRecord = {
      ...alteredPayload,
      recordSha256: await sha256CanonicalJsonHex(alteredPayload),
    } as unknown as MainWireIntegratedPreviewRunRecordV2;

    worker.emit({
      ...response,
      runRecord: alteredRecord,
      presentation: syntheticPresentation(alteredRecord),
    });

    await expect(pending).rejects.toThrow(
      /simulation input SHA-256 does not match its canonical payload/,
    );
    expect(worker.terminateCount).toBe(1);
  });

  it("binds a create response to the requested MCS preset", async () => {
    const worker = new IntegrityWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
    });
    const pending = client.createSession(
      "integrity-preset",
      "lvad-hmii-9000-one-beat-transient",
    );
    const response = await successResponse(worker.commandAt(0));

    worker.emit(response);

    await expect(pending).rejects.toThrow(
      /run record MCS preset differs from the pending command/,
    );
    expect(worker.terminateCount).toBe(1);
  });

  it("rejects commands racing an unverified create response", async () => {
    const worker = new IntegrityWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
    });
    const creating = client.createSession("integrity-creating", "all-off");
    const response = await successResponse(worker.commandAt(0));

    worker.emit(response);
    await expect(client.runNextBeat("integrity-creating")).rejects.toThrow(
      /session creation has not completed/,
    );
    expect(worker.postedCount).toBe(1);
    await expect(creating).resolves.toEqual(response);
    expect(worker.terminateCount).toBe(0);
    client.terminate();
  });

  it("does not post run or dispose commands for an unknown session", async () => {
    const worker = new IntegrityWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
    });

    await expect(client.runNextBeat("integrity-unknown")).rejects.toThrow(
      /session is not active/,
    );
    await expect(client.disposeSession("integrity-unknown")).rejects.toThrow(
      /session is not active/,
    );
    expect(worker.postedCount).toBe(0);
    client.terminate();
  });

  it("clears creating state after a correlated create failure", async () => {
    const worker = new IntegrityWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
    });
    const failed = client.createSession("integrity-retry", "all-off");
    worker.emit(errorResponse(worker.commandAt(0)));

    await expect(failed).rejects.toThrow(/command-failed: simulated failure/);
    expect(worker.terminateCount).toBe(0);

    const retried = client.createSession("integrity-retry", "all-off");
    const response = await successResponse(worker.commandAt(1));
    worker.emit(response);

    await expect(retried).resolves.toEqual(response);
    expect(worker.postedCount).toBe(2);
    client.terminate();
  });

  it("serializes active commands and preserves the head after an error response", async () => {
    const worker = new IntegrityWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
    });
    const seedRecord = await activateAllOffSession(
      client,
      worker,
      "integrity-serialized",
    );
    const failedBeat = client.runNextBeat("integrity-serialized");
    await expect(client.runNextBeat("integrity-serialized")).rejects.toThrow(
      /stateful command pending/,
    );
    await expect(client.disposeSession("integrity-serialized")).rejects.toThrow(
      /stateful command pending/,
    );
    expect(worker.postedCount).toBe(2);
    worker.emit(errorResponse(worker.commandAt(1)));
    await expect(failedBeat).rejects.toThrow(
      /command-failed: simulated failure/,
    );

    const retriedBeat = client.runNextBeat("integrity-serialized");
    const continuation = await continuationResponse(
      worker.commandAt(2),
      seedRecord,
      1,
    );
    worker.emit(continuation);

    await expect(retriedBeat).resolves.toEqual(continuation);
    expect(worker.terminateCount).toBe(0);
    client.terminate();
  });

  it("rejects a self-consistent continuation with the wrong ordinal", async () => {
    const worker = new IntegrityWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
    });
    const seedRecord = await activateAllOffSession(
      client,
      worker,
      "integrity-ordinal",
    );
    const pending = client.runNextBeat("integrity-ordinal");
    const wrongOrdinal = await continuationResponse(
      worker.commandAt(1),
      seedRecord,
      99,
    );
    worker.emit(wrongOrdinal);

    await expect(pending).rejects.toThrow(
      /does not continue the exact pending session head/,
    );
    expect(worker.terminateCount).toBe(1);
  });

  it("rejects a self-consistent continuation from a forked checkpoint", async () => {
    const worker = new IntegrityWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
    });
    const seedRecord = await activateAllOffSession(
      client,
      worker,
      "integrity-fork",
    );
    const pending = client.runNextBeat("integrity-fork");
    const forkedStart = await forkedCheckpoint(
      seedRecord.terminalModelState,
    );
    const forked = await continuationResponse(
      worker.commandAt(1),
      seedRecord,
      1,
      forkedStart,
    );
    worker.emit(forked);

    await expect(pending).rejects.toThrow(
      /does not continue the exact pending session head/,
    );
    expect(worker.terminateCount).toBe(1);
  });

  it("rejects a stale continuation after advancing the session head", async () => {
    const worker = new IntegrityWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
    });
    const seedRecord = await activateAllOffSession(
      client,
      worker,
      "integrity-stale",
    );
    const firstPending = client.runNextBeat("integrity-stale");
    const first = await continuationResponse(
      worker.commandAt(1),
      seedRecord,
      1,
    );
    worker.emit(first);
    await expect(firstPending).resolves.toEqual(first);

    const secondPending = client.runNextBeat("integrity-stale");
    const stale = await continuationResponse(
      worker.commandAt(2),
      seedRecord,
      1,
    );
    worker.emit(stale);

    await expect(secondPending).rejects.toThrow(
      /does not continue the exact pending session head/,
    );
    expect(worker.terminateCount).toBe(1);
  });

  it("removes the active head only after a successful dispose", async () => {
    const worker = new IntegrityWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
    });
    await activateAllOffSession(client, worker, "integrity-dispose");
    const pending = client.disposeSession("integrity-dispose");
    const response = disposeResponse(worker.commandAt(1));
    worker.emit(response);
    await expect(pending).resolves.toEqual(response);

    await expect(client.runNextBeat("integrity-dispose")).rejects.toThrow(
      /session is not active/,
    );
    await expect(client.disposeSession("integrity-dispose")).rejects.toThrow(
      /session is not active/,
    );
    expect(worker.postedCount).toBe(2);
    client.terminate();
  });

  it("pins browser release and seed identities to checked-in artifacts", async () => {
    expect(MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_RELEASE_REF_V1)
      .toEqual(CHECKED_IN_RELEASE_REF);
    expect(
      MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_EXPECTED_IDENTITY_V1.sourceSeed,
    ).toEqual({
      payloadSha256: SEED_RUN.payloadSha256,
      startCheckpointSha256:
        SEED_RUN.payload.startModelState.checkpointSha256,
      terminalCheckpointSha256:
        SEED_RUN.payload.terminalModelState.checkpointSha256,
    });
    expect((await syntheticRunRecord()).simulationInputSpecSha256).toBe(
      MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_EXPECTED_IDENTITY_V1
        .byMcsPresetId["all-off"].simulationInputSpecSha256,
    );
  });

  it("rejects a self-consistent input identity outside the browser descriptor", async () => {
    const worker = new IntegrityWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
    });
    const pending = client.createSession("integrity-input-pin", "all-off");
    const response = await successResponse(worker.commandAt(0));
    const alteredRecord = mutableClone(response.runRecord!);
    alteredRecord.simulationInputSpec.periodicFixtureIdentitySha256 =
      "f".repeat(64);
    alteredRecord.sourceSeed.periodicFixtureIdentitySha256 =
      alteredRecord.simulationInputSpec.periodicFixtureIdentitySha256;
    alteredRecord.simulationInputSpecSha256 =
      await sha256CanonicalJsonHex(alteredRecord.simulationInputSpec);
    await rehashRunRecord(alteredRecord);
    worker.emit({
      ...response,
      runRecord: alteredRecord,
      presentation: syntheticPresentation(
        alteredRecord as unknown as MainWireIntegratedPreviewRunRecordV2,
      ),
    });

    await expect(pending).rejects.toThrow(
      /pinned browser input or seed identity/,
    );
    expect(worker.terminateCount).toBe(1);
  });

  it("rejects a self-consistent forged source checkpoint boundary", async () => {
    const worker = new IntegrityWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
    });
    const pending = client.createSession("integrity-seed-pin", "all-off");
    const response = await successResponse(worker.commandAt(0));
    const alteredRecord = mutableClone(response.runRecord!);
    const forkedStart = await forkedCheckpoint(
      alteredRecord.startModelState as unknown as
        MainWireIntegratedPreviewRunRecordV2["startModelState"],
    );
    alteredRecord.startModelState = mutableClone(forkedStart);
    alteredRecord.sourceSeed.startCheckpointSha256 =
      forkedStart.checkpointSha256;
    await rehashRunRecord(alteredRecord);
    worker.emit({
      ...response,
      runRecord: alteredRecord,
      presentation: syntheticPresentation(
        alteredRecord as unknown as MainWireIntegratedPreviewRunRecordV2,
      ),
    });

    await expect(pending).rejects.toThrow(
      /pinned browser input or seed identity/,
    );
    expect(worker.terminateCount).toBe(1);
  });

  it("rejects a self-consistent record with a truncated trace schema", async () => {
    const worker = new IntegrityWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
    });
    const pending = client.createSession("integrity-truncated", "all-off");
    const response = await successResponse(worker.commandAt(0));
    const alteredRecord = mutableClone(response.runRecord!);
    const firstSample =
      alteredRecord.run.trace[0] as unknown as Record<string, unknown>;
    delete firstSample.chamberVolumeMl;
    await rehashRunRecord(alteredRecord);

    worker.emit({
      ...response,
      runRecord: alteredRecord,
      presentation: syntheticPresentation(
        alteredRecord as unknown as MainWireIntegratedPreviewRunRecordV2,
      ),
    });

    await expect(pending).rejects.toThrow(
      /trace sample 0 keys differ/,
    );
    expect(worker.terminateCount).toBe(1);
  });

  it.each([
    [
      "outer exact-resume claim",
      (
        checkpoint: DeepMutable<
          MainWireIntegratedPreviewRunRecordV2["terminalModelState"]
        >,
      ) => {
        Reflect.set(
          checkpoint.exactResumeClaim,
          "clinicalValidationClaimed",
          true,
        );
      },
    ],
    [
      "outer simulation-ready claim",
      (
        checkpoint: DeepMutable<
          MainWireIntegratedPreviewRunRecordV2["terminalModelState"]
        >,
      ) => {
        Reflect.set(
          checkpoint.exactResumeClaim,
          "simulationReady",
          true,
        );
      },
    ],
    [
      "outer release-blocker claim",
      (
        checkpoint: DeepMutable<
          MainWireIntegratedPreviewRunRecordV2["terminalModelState"]
        >,
      ) => {
        Reflect.set(
          checkpoint.exactResumeClaim.releaseBlockers,
          "iabpAcceptedVentricularSynchronization",
          "closed",
        );
      },
    ],
    [
      "nested coronary exact-resume claim",
      (
        checkpoint: DeepMutable<
          MainWireIntegratedPreviewRunRecordV2["terminalModelState"]
        >,
      ) => {
        Reflect.set(
          checkpoint.coronary.exactResumeClaim,
          "acceptedTuple",
          "forged-worker-claim",
        );
      },
    ],
    [
      "nested base-coronary exact-resume claim",
      (
        checkpoint: DeepMutable<
          MainWireIntegratedPreviewRunRecordV2["terminalModelState"]
        >,
      ) => {
        Reflect.set(
          checkpoint.coronary.baseCheckpointV2.exactResumeClaim,
          "acceptedToneStateCount",
          7,
        );
      },
    ],
    [
      "nested composed-rhythm exact-resume claim",
      (
        checkpoint: DeepMutable<
          MainWireIntegratedPreviewRunRecordV2["terminalModelState"]
        >,
      ) => {
        Reflect.set(
          checkpoint.composedRhythm.exactResumeClaim,
          "authenticationClaimed",
          true,
        );
      },
    ],
  ])("rejects self-consistent forged trusted %s literals", async (
    _label,
    mutate,
  ) => {
    const worker = new IntegrityWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
    });
    const pending = client.createSession("integrity-claim-chain", "all-off");
    const response = await successResponse(worker.commandAt(0));
    const alteredRecord = mutableClone(response.runRecord!);

    mutate(alteredRecord.startModelState);
    mutate(alteredRecord.terminalModelState);
    await Promise.all([
      rehashIntegratedCheckpoint(alteredRecord.startModelState),
      rehashIntegratedCheckpoint(alteredRecord.terminalModelState),
    ]);
    alteredRecord.sourceSeed.startCheckpointSha256 =
      alteredRecord.startModelState.checkpointSha256;
    alteredRecord.sourceSeed.terminalCheckpointSha256 =
      alteredRecord.terminalModelState.checkpointSha256;
    await rehashRunRecord(alteredRecord);
    worker.emit({
      ...response,
      runRecord: alteredRecord,
      presentation: syntheticPresentation(
        alteredRecord as unknown as MainWireIntegratedPreviewRunRecordV2,
      ),
    });

    await expect(pending).rejects.toThrow(/trusted checkpoint claim differs/);
    expect(worker.terminateCount).toBe(1);
  });

  it("rejects a self-consistent response from another release", async () => {
    const worker = new IntegrityWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
    });
    const pending = client.createSession("integrity-release", "all-off");
    const response = await successResponse(worker.commandAt(0));
    const alteredRecord = mutableClone(response.runRecord!);
    const wrongReleaseRef = {
      ...MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_RELEASE_REF_V1,
      sha256: "b".repeat(64),
    };
    alteredRecord.releaseRef = wrongReleaseRef;
    alteredRecord.simulationInputSpec.releaseRef = wrongReleaseRef;
    alteredRecord.simulationInputSpecSha256 =
      await sha256CanonicalJsonHex(alteredRecord.simulationInputSpec);
    await rehashRunRecord(alteredRecord);

    worker.emit({
      ...response,
      releaseRef: wrongReleaseRef,
      runRecord: alteredRecord,
      presentation: syntheticPresentation(
        alteredRecord as unknown as MainWireIntegratedPreviewRunRecordV2,
      ),
    });

    await expect(pending).rejects.toThrow(
      /release differs from the current browser bundle/,
    );
    expect(worker.terminateCount).toBe(1);
  });

  it("detaches and freezes a response before asynchronous verification", async () => {
    const worker = new IntegrityWorker();
    const client = new MainWireIntegratedPreviewWorkerClientV1({
      workerFactory: () => worker,
    });
    const pending = client.createSession("integrity-detached", "all-off");
    const emitted = mutableClone(
      await successResponse(worker.commandAt(0)),
    );
    const originalAcceptedTimeSec =
      emitted.runRecord!.run.trace[0].acceptedTimeSec;

    worker.emit(emitted);
    emitted.runRecord!.run.trace[0].acceptedTimeSec = -1;
    emitted.presentation!.trace[0].acceptedTimeSec = -1;

    const resolved = await pending;
    expect(resolved.ok).toBe(true);
    if (resolved.ok === false || resolved.runRecord === null) {
      throw new Error("expected a successful detached response");
    }
    expect(resolved).not.toBe(emitted);
    expect(resolved.runRecord.run.trace[0].acceptedTimeSec)
      .toBe(originalAcceptedTimeSec);
    expect(Object.isFrozen(resolved)).toBe(true);
    expect(Object.isFrozen(resolved.runRecord)).toBe(true);
    expect(Object.isFrozen(resolved.runRecord.run.trace)).toBe(true);
    expect(Object.isFrozen(resolved.runRecord.run.trace[0])).toBe(true);
    client.terminate();
  });
});

const CHECKED_IN_RELEASE_REF = (
  JSON.parse(integratedPreviewReleaseArtifactRaw) as {
    ref: Readonly<{ id: string; version: string; sha256: string }>;
  }
).ref;

const SEED_RUN = JSON.parse(integratedPreviewSeedRunRaw) as Readonly<{
  payloadSha256: string;
  payload: Readonly<{
    startModelState: MainWireIntegratedPreviewRunRecordV2["startModelState"];
    terminalModelState:
      MainWireIntegratedPreviewRunRecordV2["terminalModelState"];
    displaySeed: Readonly<{
      terminalCycleTrace: Readonly<{
        samples: MainWireIntegratedPreviewRunRecordV2["run"]["trace"];
      }>;
    }>;
    sourceEvidence: Readonly<{
      protocolIdentityHash: string;
    }>;
  }>;
}>;

const RELEASE_REF = MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_RELEASE_REF_V1;

async function successResponse(
  command: IntegratedPreviewCommandV1,
): Promise<IntegratedPreviewSuccessResponseV1> {
  const runRecord = await syntheticRunRecord();
  return {
    protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
    ok: true,
    requestId: command.requestId,
    sessionId: command.sessionId,
    commandKind: command.kind,
    releaseRef: RELEASE_REF,
    runRecord,
    presentation: syntheticPresentation(runRecord),
    disposed: false,
  };
}

async function activateAllOffSession(
  client: MainWireIntegratedPreviewWorkerClientV1,
  worker: IntegrityWorker,
  sessionId: string,
): Promise<MainWireIntegratedPreviewRunRecordV2> {
  const pending = client.createSession(sessionId, "all-off");
  const response = await successResponse(
    worker.commandAt(worker.postedCount - 1),
  );
  worker.emit(response);
  await pending;
  if (response.runRecord === null) {
    throw new Error("expected an all-off seed record");
  }
  return response.runRecord;
}

function disposeResponse(
  command: IntegratedPreviewCommandV1,
): IntegratedPreviewSuccessResponseV1 {
  return {
    protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
    ok: true,
    requestId: command.requestId,
    sessionId: command.sessionId,
    commandKind: command.kind,
    releaseRef: RELEASE_REF,
    runRecord: null,
    presentation: null,
    disposed: true,
  };
}

function syntheticPresentation(
  record: MainWireIntegratedPreviewRunRecordV2,
): MainWireIntegratedPreviewRunPresentationV2 {
  const { trace, ...run } = record.run;
  return {
    artifactId: record.artifactId,
    schemaVersion: record.schemaVersion,
    recordSha256: record.recordSha256,
    releaseRef: record.releaseRef,
    simulationInputSpec: record.simulationInputSpec,
    simulationInputSpecSha256: record.simulationInputSpecSha256,
    sourceSeed: record.sourceSeed,
    run,
    trace,
    startModelStateRef: {
      checkpointId: record.startModelState.checkpointId,
      schemaVersion: record.startModelState.schemaVersion,
      checkpointSha256: record.startModelState.checkpointSha256,
      acceptedTimeSec: record.startModelState.acceptedTimeSec,
      revision: record.startModelState.revision,
    },
    terminalModelStateRef: {
      checkpointId: record.terminalModelState.checkpointId,
      schemaVersion: record.terminalModelState.schemaVersion,
      checkpointSha256: record.terminalModelState.checkpointSha256,
      acceptedTimeSec: record.terminalModelState.acceptedTimeSec,
      revision: record.terminalModelState.revision,
    },
  };
}

async function syntheticRunRecord(
): Promise<MainWireIntegratedPreviewRunRecordV2> {
  const startModelState = mutableClone(SEED_RUN.payload.startModelState);
  const terminalModelState =
    mutableClone(SEED_RUN.payload.terminalModelState);
  const trace = mutableClone(
    SEED_RUN.payload.displaySeed.terminalCycleTrace.samples,
  );
  const startAcceptedTimeSec = startModelState.acceptedTimeSec;
  const endAcceptedTimeSec = terminalModelState.acceptedTimeSec;
  const simulationInputSpec = {
    schemaId: "circleheart-integrated-simulation-input-spec-v1",
    schemaVersion: 1,
    releaseRef: RELEASE_REF,
    modelAssembly: "base+coronary-v3+dynamic-mcs+composed-rhythm-v2",
    fixedGlobalTotalBloodVolumeMl: 5_600,
    rhythm: {
      presetId: "composed-regular-sinus-60-v1",
      heartRateBpm: 60,
      cycleLengthSec: 1,
      externalAfOwnerIncluded: false,
    },
    mechanicalSupport: {
      presetId: "all-off",
      activeDeviceIds: [],
      interpretation: "numerically-periodic-all-off-seed",
      canonicalProfileSha256:
        startModelState.dynamicMechanicalSupportProfileIdentitySha256,
      canonicalConfigSha256:
        "87d4b49cfd7b916296e7d4ab5c98c695dc7a0603a8ee44fea605fd02bd34cc29",
    },
    nominalDtSec: 0.002,
    seedRunPayloadSha256: SEED_RUN.payloadSha256,
    sourceProtocolIdentityHash:
      SEED_RUN.payload.sourceEvidence.protocolIdentityHash,
    periodicFixtureIdentitySha256:
      "ad93e35b35b6a90fdb5c12a9c44b878cb1d287b50a687a1a660544bd8a5a28ed",
  };
  const payload = {
    artifactId: "circleheart-main-wire-integrated-preview-run-record-v2",
    schemaVersion: 2,
    releaseRef: RELEASE_REF,
    simulationInputSpec,
    simulationInputSpecSha256:
      await sha256CanonicalJsonHex(simulationInputSpec),
    sourceSeed: {
      payloadSha256: simulationInputSpec.seedRunPayloadSha256,
      startCheckpointSha256: startModelState.checkpointSha256,
      terminalCheckpointSha256: terminalModelState.checkpointSha256,
      protocolIdentityHash: simulationInputSpec.sourceProtocolIdentityHash,
      periodicFixtureIdentitySha256:
        simulationInputSpec.periodicFixtureIdentitySha256,
      numericalPeriod1Established: true,
    },
    run: {
      kind: "bundled-p1-seed",
      execution: {
        operation: "project-bundled-p1-seed",
        continuationBeatCountFromSeed: 0,
      },
      startAcceptedTimeSec,
      endAcceptedTimeSec,
      acceptedStepCount: trace.length,
      trace,
      allValuesFinite: true,
      maximumTotalBloodVolumeErrorMl: maximumAbsoluteDiagnostic(
        trace,
        "totalBloodVolumeErrorMl",
      ),
      maximumCoronaryBloodVolumeLedgerResidualMl: maximumAbsoluteDiagnostic(
        trace,
        "coronaryBloodVolumeLedgerResidualMl",
      ),
      maximumDynamicMcsConservationResidualMlPerSec:
        maximumAbsoluteDiagnostic(
          trace,
          "dynamicMcsConservationResidualMlPerSec",
        ),
      numericalPeriod1Established: true,
      physiologicalAcceptanceEstablished: false,
      clinicalValidationClaimed: false,
    },
    startModelState,
    terminalModelState,
    replayCompleteness: {
      stateTransitionInputIdentitiesIncluded: true,
      exactStartCheckpointIncluded: true,
      exactTerminalCheckpointIncluded: true,
      executableBuildProvenanceAttached: false,
      standaloneReplayCompleteArtifactClaimed: false,
      promotionEligibility: "eligible-with-current-runtime-exact-replay",
      upgradePath:
        "createMainWireIntegratedPreviewRunArtifactV1-with-external-BuildArtifactRefV1",
    },
  };
  return {
    ...payload,
    recordSha256: await sha256CanonicalJsonHex(payload),
  } as unknown as MainWireIntegratedPreviewRunRecordV2;
}

async function continuationResponse(
  command: IntegratedPreviewCommandV1,
  priorRecord: MainWireIntegratedPreviewRunRecordV2,
  ordinal: number,
  startOverride?:
    MainWireIntegratedPreviewRunRecordV2["startModelState"],
): Promise<IntegratedPreviewSuccessResponseV1> {
  const runRecord = await continuationRunRecord(
    priorRecord,
    ordinal,
    startOverride,
  );
  return {
    protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
    ok: true,
    requestId: command.requestId,
    sessionId: command.sessionId,
    commandKind: command.kind,
    releaseRef: RELEASE_REF,
    runRecord,
    presentation: syntheticPresentation(runRecord),
    disposed: false,
  };
}

async function continuationRunRecord(
  priorRecord: MainWireIntegratedPreviewRunRecordV2,
  ordinal: number,
  startOverride?:
    MainWireIntegratedPreviewRunRecordV2["startModelState"],
): Promise<MainWireIntegratedPreviewRunRecordV2> {
  const startModelState = mutableClone(
    startOverride ?? priorRecord.terminalModelState,
  );
  const trace = mutableClone(
    SEED_RUN.payload.displaySeed.terminalCycleTrace.samples,
  );
  const timeOffsetSec =
    startModelState.acceptedTimeSec
    - SEED_RUN.payload.startModelState.acceptedTimeSec;
  for (const sample of trace) {
    sample.acceptedTimeSec += timeOffsetSec;
    sample.cycleIndex += Math.round(timeOffsetSec);
  }
  const terminalModelState = mutableClone(startModelState);
  setCheckpointClock(
    terminalModelState,
    startModelState.acceptedTimeSec + 1,
    startModelState.revision + trace.length,
  );
  await rehashIntegratedCheckpoint(terminalModelState);
  const promotionEligible = ordinal === 1;
  const payload = {
    artifactId: "circleheart-main-wire-integrated-preview-run-record-v2",
    schemaVersion: 2,
    releaseRef: priorRecord.releaseRef,
    simulationInputSpec: priorRecord.simulationInputSpec,
    simulationInputSpecSha256: priorRecord.simulationInputSpecSha256,
    sourceSeed: priorRecord.sourceSeed,
    run: {
      kind: "one-beat-continuation",
      execution: {
        operation: "advance-one-fixed-sinus-cycle",
        requestedDurationSec: 1,
        continuationBeatOrdinalFromSeed: ordinal,
      },
      startAcceptedTimeSec: startModelState.acceptedTimeSec,
      endAcceptedTimeSec: terminalModelState.acceptedTimeSec,
      acceptedStepCount: trace.length,
      trace,
      allValuesFinite: true,
      maximumTotalBloodVolumeErrorMl: maximumAbsoluteDiagnostic(
        trace,
        "totalBloodVolumeErrorMl",
      ),
      maximumCoronaryBloodVolumeLedgerResidualMl: maximumAbsoluteDiagnostic(
        trace,
        "coronaryBloodVolumeLedgerResidualMl",
      ),
      maximumDynamicMcsConservationResidualMlPerSec:
        maximumAbsoluteDiagnostic(
          trace,
          "dynamicMcsConservationResidualMlPerSec",
        ),
      numericalPeriod1Established: "not-assessed-for-this-continuation",
      physiologicalAcceptanceEstablished: false,
      clinicalValidationClaimed: false,
    },
    startModelState,
    terminalModelState,
    replayCompleteness: {
      stateTransitionInputIdentitiesIncluded: true,
      exactStartCheckpointIncluded: true,
      exactTerminalCheckpointIncluded: true,
      executableBuildProvenanceAttached: false,
      standaloneReplayCompleteArtifactClaimed: false,
      promotionEligibility: promotionEligible
        ? "eligible-with-current-runtime-exact-replay"
        : "blocked-missing-complete-seed-lineage",
      upgradePath: promotionEligible
        ? "createMainWireIntegratedPreviewRunArtifactV1-with-external-BuildArtifactRefV1"
        : null,
    },
  };
  return {
    ...payload,
    recordSha256: await sha256CanonicalJsonHex(payload),
  } as unknown as MainWireIntegratedPreviewRunRecordV2;
}

function setCheckpointClock(
  checkpoint: DeepMutable<
    MainWireIntegratedPreviewRunRecordV2["terminalModelState"]
  >,
  acceptedTimeSec: number,
  revision: number,
): void {
  checkpoint.acceptedTimeSec = acceptedTimeSec;
  checkpoint.revision = revision;
  checkpoint.coronary.acceptedTimeSec = acceptedTimeSec;
  checkpoint.coronary.revision = revision;
  checkpoint.coronary.baseCheckpointV2.acceptedTimeSec = acceptedTimeSec;
  checkpoint.coronary.baseCheckpointV2.revision = revision;
  checkpoint.coronary.baseCheckpointV2.circulation.state.acceptedTimeSec =
    acceptedTimeSec;
  checkpoint.coronary.baseCheckpointV2.circulation.state.revision = revision;
  checkpoint.coronary.baseCheckpointV2.coronary.acceptedState.acceptedTimeSec =
    acceptedTimeSec;
  checkpoint.coronary.baseCheckpointV2.coronary.acceptedState.revision =
    revision;
  checkpoint.coronary.baseCheckpointV2.mechanics.acceptedTimeSec =
    acceptedTimeSec;
  checkpoint.coronary.baseCheckpointV2.mechanics.revision = revision;
  checkpoint.composedRhythm.acceptedTimeSec = acceptedTimeSec;
  checkpoint.composedRhythm.revision = revision;
  checkpoint.composedRhythm.acceptedState.acceptedTimeSec = acceptedTimeSec;
  checkpoint.composedRhythm.acceptedState.revision = revision;
}

async function rehashIntegratedCheckpoint(
  checkpoint: DeepMutable<
    MainWireIntegratedPreviewRunRecordV2["terminalModelState"]
  >,
): Promise<void> {
  await rehashCheckpointRecord(checkpoint.coronary.baseCheckpointV2);
  await rehashCheckpointRecord(checkpoint.coronary);
  await rehashCheckpointRecord(checkpoint.composedRhythm);
  await rehashCheckpointRecord(checkpoint);
}

async function rehashCheckpointRecord(
  checkpoint: { checkpointSha256: string },
): Promise<void> {
  const { checkpointSha256: _ignored, ...payload } = checkpoint;
  checkpoint.checkpointSha256 = await sha256CanonicalJsonHex(payload);
}

async function forkedCheckpoint(
  input: MainWireIntegratedPreviewRunRecordV2["startModelState"],
): Promise<MainWireIntegratedPreviewRunRecordV2["startModelState"]> {
  const checkpoint = mutableClone(input);
  checkpoint.dynamicMechanicalSupport.acceptedFlowMlPerSec.LVAD += 1;
  await rehashIntegratedCheckpoint(checkpoint);
  return checkpoint as unknown as
    MainWireIntegratedPreviewRunRecordV2["startModelState"];
}

function maximumAbsoluteDiagnostic(
  trace: MainWireIntegratedPreviewRunRecordV2["run"]["trace"],
  key:
    | "totalBloodVolumeErrorMl"
    | "coronaryBloodVolumeLedgerResidualMl"
    | "dynamicMcsConservationResidualMlPerSec",
): number {
  let maximum = 0;
  for (const sample of trace) {
    maximum = Math.max(maximum, Math.abs(sample.diagnostics[key]));
  }
  return maximum;
}

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

class IntegrityWorker implements MainWireIntegratedPreviewWorkerLikeV1 {
  private readonly messageListeners =
    new Set<(event: MessageEvent<unknown>) => void>();
  private readonly messageErrorListeners =
    new Set<(event: MessageEvent<unknown>) => void>();
  private readonly errorListeners =
    new Set<(event: ErrorEvent) => void>();
  private readonly posted: unknown[] = [];
  terminateCount = 0;

  get postedCount(): number {
    return this.posted.length;
  }

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

  commandAt(index: number): IntegratedPreviewCommandV1 {
    const command = this.posted[index] as IntegratedPreviewCommandV1 | undefined;
    if (command === undefined) throw new Error("expected a posted command");
    return command;
  }

  emit(response: unknown): void {
    const event = { data: response } as MessageEvent<unknown>;
    for (const listener of this.messageListeners) listener(event);
  }
}

function errorResponse(
  command: IntegratedPreviewCommandV1,
): Readonly<Record<string, unknown>> {
  return {
    protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
    ok: false,
    requestId: command.requestId,
    sessionId: command.sessionId,
    commandKind: command.kind,
    releaseRef: null,
    error: {
      code: "command-failed",
      message: "simulated failure",
    },
  };
}
