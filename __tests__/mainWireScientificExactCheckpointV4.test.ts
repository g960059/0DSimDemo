import { describe, expect, it } from "vitest";

import legacyHealthyCheckpoint from "@/data/scientific/checkpoints/0.2.0/normal-adult-periodic-steady-v1.json";
import type {
  MainWireFiveWallNonCoronaryCheckpointV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlCatalogV0";
import {
  createMainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";
import {
  mainWireScientificSessionIntentV1,
  resolveMainWireScientificSessionInputV1,
} from "@/engine/scientific/inputs";
import {
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";
import {
  createMainWireScientificSessionExactCheckpointV4,
  loadMainWireScientificSessionExactCheckpointV4,
  MainWireScientificSessionV1,
  type MainWireScientificSessionExactCheckpointIdentityV4,
  type MainWireScientificSessionPeriodicTrackerCheckpointV1,
} from "@/engine/scientific/runtime";
import {
  MainWireScientificInProcessKernelV1,
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificCommandV1,
} from "@/engine/scientific/worker";
import {
  MainWireScientificWorkerClientV1,
  type MainWireScientificWorkerLikeV1,
  type MainWireScientificWorkerTransportErrorV1,
} from "@/engine/scientificBrowser";
import {
  loadBundledOfficialHealthyPeriodicDocumentChainV1,
} from "@/engine/scientificBrowser/bundledOfficialHealthyPeriodicDocumentChainV1";

describe("main-wire scientific exact checkpoint V4", () => {
  it("binds control, epoch, tracker, canonical phase, and release state codec", async () => {
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const input = await resolveMainWireScientificSessionInputV1(
      release,
      mainWireScientificSessionIntentV1(release.ref),
    );
    const target = await controlState(0.75, 1.5);
    const identity = {
      releaseRef: release.ref,
      baseSessionInputSha256: input.sessionInputSha256,
      stateCodec: {
        stateSchemaId: release.manifest.stateSchema.schemaId,
        stateSchemaVersion: release.manifest.stateSchema.schemaVersion,
        transactionCheckpointId:
          "main-wire-five-wall-noncoronary-checkpoint-v1",
        transactionCheckpointSchemaVersion: 1,
      },
    } satisfies MainWireScientificSessionExactCheckpointIdentityV4;
    const checkpoint = await createMainWireScientificSessionExactCheckpointV4(
      identity,
      {
        controlTargetState: target,
        parameterEpoch: 7,
        transaction: legacyHealthyCheckpoint.transaction as unknown as
          MainWireFiveWallNonCoronaryCheckpointV1,
        periodicSettlementTracker:
          legacyHealthyCheckpoint.periodicSettlementTracker as unknown as
            MainWireScientificSessionPeriodicTrackerCheckpointV1,
      },
    );

    expect(checkpoint).toMatchObject({
      checkpointId: "main-wire-scientific-session-exact-checkpoint-v4",
      schemaVersion: 4,
      releaseRef: release.ref,
      baseSessionInputSha256: input.sessionInputSha256,
      controlTargetState: target,
      controlTargetStateSha256: target.targetStateSha256,
      parameterEpoch: 7,
      stateCodec: identity.stateCodec,
      canonicalPhase: {
        driveId: "five-wall-normal-prescribed-calcium-drive-v1",
        derivation: "accepted-time-positive-modulo-drive-cycle",
      },
      claim: {
        completeControlTargetStateStored: true,
        parameterEpochStored: true,
        stateCodecIdentityStored: true,
        canonicalPhaseStored: true,
        derivedObservationStored: false,
      },
    });
    expect(checkpoint.canonicalPhase.phase01).toBe(
      evaluateFiveWallNormalCalciumDriveV1(
        checkpoint.transaction.acceptedTimeSec,
      ).cyclePhase01,
    );
    expect(checkpoint.periodicSettlementTracker).not.toBeNull();
    expect(checkpoint).not.toHaveProperty("observation");

    const restored = await MainWireScientificSessionV1.restoreExactV4(
      release,
      input,
      JSON.parse(JSON.stringify(checkpoint)),
    );
    expect(restored.stateIdentity()).toMatchObject({
      revision: checkpoint.transaction.revision,
      acceptedTimeSec: checkpoint.transaction.acceptedTimeSec,
    });
    expect(restored.controlCheckpointIdentityV4()).toEqual({
      controlTargetState: target,
      parameterEpoch: 7,
    });
    await expect(restored.checkpointExactV4()).resolves.toEqual(checkpoint);
    await expect(restored.checkpointExactV3()).rejects.toThrow(
      /checkpoint V3 is unavailable/,
    );
  }, 30_000);

  it("rejects rehashed phase, codec, inner-control, and base-input substitutions", async () => {
    const fixture = await checkpointFixture();

    const wrongPhase = structuredClone(fixture.checkpoint) as any;
    wrongPhase.canonicalPhase.phase01 =
      (wrongPhase.canonicalPhase.phase01 + 0.25) % 1;
    await rehash(wrongPhase);
    await expect(loadMainWireScientificSessionExactCheckpointV4(
      fixture.identity,
      wrongPhase,
    )).rejects.toThrow(/canonical phase does not match accepted time/);

    const wrongCodec = structuredClone(fixture.checkpoint) as any;
    wrongCodec.stateCodec.stateSchemaVersion += 1;
    await rehash(wrongCodec);
    await expect(loadMainWireScientificSessionExactCheckpointV4(
      fixture.identity,
      wrongCodec,
    )).rejects.toThrow(/state-codec identity mismatch/);

    const wrongControl = structuredClone(fixture.checkpoint) as any;
    wrongControl.controlTargetState.controls[
      "circulation.systemic-vascular-resistance-scale"
    ] = 1.25;
    await rehash(wrongControl);
    await expect(loadMainWireScientificSessionExactCheckpointV4(
      fixture.identity,
      wrongControl,
    )).rejects.toThrow(/target state rejected/);

    const wrongInput = structuredClone(fixture.checkpoint) as any;
    wrongInput.baseSessionInputSha256 = "a".repeat(64);
    await rehash(wrongInput);
    await expect(loadMainWireScientificSessionExactCheckpointV4(
      fixture.identity,
      wrongInput,
    )).rejects.toThrow(/base resolved session-input identity mismatch/);
  });

  it("round-trips through browser transport, then steps, checkpoints, and reforks", async () => {
    const loaded = await loadBundledOfficialHealthyPeriodicDocumentChainV1({
      presetId: "circleheart/official-healthy-periodic",
      presetVersion: "1.0.0",
    });
    const kernel = new MainWireScientificInProcessKernelV1({
      maximumSessionCount: 8,
      maximumTransientStepCountPerCommand: 4,
      maximumOutputFrameCountPerCommand: 4,
      officialDocumentCaseLoader:
        loadBundledOfficialHealthyPeriodicDocumentChainV1,
    });
    const worker = new KernelWorkerBridge(kernel);
    const client = new MainWireScientificWorkerClientV1({
      workerFactory: () => worker.port(),
    });
    const created = await client.request(officialCreateCommand(
      "v4-source-create",
      "v4-source",
    ));
    if (
      !created.ok
      || created.payload.kind !== "officialDocumentCaseSessionCreated"
    ) throw new Error("V4 source creation failed");
    const sourceContext = created.payload.researchControlContext;
    const firstTarget = await controlState(0.75, 1);
    const forked = await client.request({
      ...baseCommand(
        "forkResearchControlSession",
        "v4-first-fork",
        "v4-target",
      ),
      sourceSessionId: "v4-source",
      expectedSource: {
        ...sourceContext.stateIdentity,
        controlStateSha256:
          sourceContext.controlState.targetStateSha256,
        parameterEpoch: 0,
      },
      targetControlState: firstTarget,
    });
    if (!forked.ok || forked.payload.kind !== "researchControlSessionForked") {
      throw new Error("V4 first fork failed");
    }
    expect(forked.payload.exactCheckpointAvailable).toBe(true);

    const emitted = await client.request(baseCommand(
      "getExactCheckpointV4",
      "v4-emit",
      "v4-target",
    ));
    if (!emitted.ok || emitted.payload.kind !== "exactCheckpointV4") {
      throw new Error("V4 checkpoint emission failed");
    }
    expect(emitted.payload.checkpoint).toMatchObject({
      controlTargetStateSha256: firstTarget.targetStateSha256,
      parameterEpoch: 1,
    });

    const restored = await client.request({
      ...baseCommand(
        "restoreExactSessionV4",
        "v4-restore",
        "v4-restored",
      ),
      resolvedSessionInput:
        loaded.caseDocument.content.resolvedSessionInput,
      checkpoint: emitted.payload.checkpoint,
    });
    if (!restored.ok || restored.payload.kind !== "sessionRestoredV4") {
      throw new Error("V4 checkpoint restore failed");
    }
    expect(restored).toMatchObject({
      sessionOrigin: {
        kind: "control-aware-exact-checkpoint-v4-restore",
        checkpointSchemaVersion: 4,
        checkpointSha256:
          emitted.payload.checkpoint.checkpointSha256,
        baseSessionInputSha256:
          emitted.payload.checkpoint.baseSessionInputSha256,
        controlTargetStateSha256: firstTarget.targetStateSha256,
        parameterEpoch: 1,
      },
      payload: {
        researchControlContext: {
          controlState: firstTarget,
          parameterEpoch: 1,
        },
      },
    });

    const stepped = await client.request({
      ...baseCommand(
        "runTransient",
        "v4-restored-step",
        "v4-restored",
      ),
      dtSec: 0.002,
      stepCount: 1,
      observationStride: 1,
    });
    if (!stepped.ok || stepped.payload.kind !== "transientCompleted") {
      throw new Error("V4 restored step failed");
    }
    const reemitted = await client.request(baseCommand(
      "getExactCheckpointV4",
      "v4-reemit",
      "v4-restored",
    ));
    if (!reemitted.ok || reemitted.payload.kind !== "exactCheckpointV4") {
      throw new Error("V4 restored checkpoint emission failed");
    }
    expect(reemitted.payload.checkpoint).toMatchObject({
      controlTargetStateSha256: firstTarget.targetStateSha256,
      parameterEpoch: 1,
      transaction: {
        revision: stepped.payload.finalObservableFrame.revision,
        acceptedTimeSec: stepped.payload.finalObservableFrame.acceptedTimeSec,
      },
    });

    const secondTarget = await controlState(0.75, 1.5);
    const reforked = await client.request({
      ...baseCommand(
        "forkResearchControlSession",
        "v4-refork",
        "v4-reforked",
      ),
      sourceSessionId: "v4-restored",
      expectedSource: {
        ...restored.payload.researchControlContext.stateIdentity,
        revision: stepped.payload.finalObservableFrame.revision,
        acceptedTimeSec:
          stepped.payload.finalObservableFrame.acceptedTimeSec,
        controlStateSha256: firstTarget.targetStateSha256,
        parameterEpoch: 1,
      },
      targetControlState: secondTarget,
    });
    expect(reforked).toMatchObject({
      ok: true,
      payload: {
        kind: "researchControlSessionForked",
        targetControlState: secondTarget,
        parameterEpoch: 2,
        exactCheckpointAvailable: true,
      },
    });

    client.terminate();
  }, 30_000);

  it("fails closed when a V4 checkpoint response escapes its control binding", async () => {
    const kernel = new MainWireScientificInProcessKernelV1({
      maximumSessionCount: 4,
      officialDocumentCaseLoader:
        loadBundledOfficialHealthyPeriodicDocumentChainV1,
    });
    const worker = new KernelWorkerBridge(kernel);
    const client = new MainWireScientificWorkerClientV1({
      workerFactory: () => worker.port(),
    });
    const created = await client.request(officialCreateCommand(
      "v4-tamper-source-create",
      "v4-tamper-source",
    ));
    if (
      !created.ok
      || created.payload.kind !== "officialDocumentCaseSessionCreated"
    ) throw new Error("V4 tamper source creation failed");
    const target = await controlState(0.75, 1);
    const forked = await client.request({
      ...baseCommand(
        "forkResearchControlSession",
        "v4-tamper-fork",
        "v4-tamper-target",
      ),
      sourceSessionId: "v4-tamper-source",
      expectedSource: {
        ...created.payload.researchControlContext.stateIdentity,
        controlStateSha256:
          created.payload.researchControlContext.controlState.targetStateSha256,
        parameterEpoch: 0,
      },
      targetControlState: target,
    });
    if (!forked.ok) throw new Error("V4 tamper fork failed");

    worker.transformNextResponse((response) => {
      const forged = structuredClone(response) as any;
      forged.payload.checkpoint.controlTargetStateSha256 = "f".repeat(64);
      return forged;
    });
    const forged = client.request(baseCommand(
      "getExactCheckpointV4",
      "v4-tampered-emit",
      "v4-tamper-target",
    ));
    await expectTransportError(forged, "protocol-mismatch");
    expect(client.status).toBe("failed");
    expect(worker.terminateCount).toBe(1);
  }, 30_000);
});

async function checkpointFixture() {
  const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
  const input = await resolveMainWireScientificSessionInputV1(
    release,
    mainWireScientificSessionIntentV1(release.ref),
  );
  const identity = {
    releaseRef: release.ref,
    baseSessionInputSha256: input.sessionInputSha256,
    stateCodec: {
      stateSchemaId: release.manifest.stateSchema.schemaId,
      stateSchemaVersion: release.manifest.stateSchema.schemaVersion,
      transactionCheckpointId:
        "main-wire-five-wall-noncoronary-checkpoint-v1",
      transactionCheckpointSchemaVersion: 1,
    },
  } satisfies MainWireScientificSessionExactCheckpointIdentityV4;
  const checkpoint = await createMainWireScientificSessionExactCheckpointV4(
    identity,
    {
      controlTargetState: await controlState(0.75, 1),
      parameterEpoch: 2,
      transaction: legacyHealthyCheckpoint.transaction as unknown as
        MainWireFiveWallNonCoronaryCheckpointV1,
      periodicSettlementTracker:
        legacyHealthyCheckpoint.periodicSettlementTracker as unknown as
          MainWireScientificSessionPeriodicTrackerCheckpointV1,
    },
  );
  return { identity, checkpoint };
}

async function controlState(
  systemicScale: number,
  pulmonaryScale: number,
) {
  return createMainWireScientificResearchControlTargetStateV0({
    ...MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
    "circulation.systemic-vascular-resistance-scale": systemicScale,
    "circulation.pulmonary-vascular-resistance-scale": pulmonaryScale,
  });
}

function officialCreateCommand(
  requestId: string,
  sessionId: string,
): ScientificCommandV1 {
  return {
    ...baseCommand("createOfficialDocumentCaseSession", requestId, sessionId),
    presetId: "circleheart/official-healthy-periodic",
    presetVersion: "1.0.0",
  };
}

function baseCommand<Kind extends ScientificCommandV1["kind"]>(
  kind: Kind,
  requestId: string,
  sessionId: string,
): Readonly<{
  protocolId: typeof SCIENTIFIC_COMMAND_PROTOCOL_V1_ID;
  kind: Kind;
  requestId: string;
  sessionId: string;
}> {
  return Object.freeze({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind,
    requestId,
    sessionId,
  });
}

async function rehash(checkpoint: Record<string, unknown>): Promise<void> {
  const { checkpointSha256: _oldSha, ...payload } = checkpoint;
  checkpoint.checkpointSha256 = await sha256CanonicalJsonHex(payload);
}

async function expectTransportError(
  promise: Promise<unknown>,
  code: MainWireScientificWorkerTransportErrorV1["code"],
): Promise<void> {
  await expect(promise).rejects.toMatchObject({
    name: "MainWireScientificWorkerTransportErrorV1",
    code,
  });
}

class KernelWorkerBridge {
  terminateCount = 0;
  private readonly listeners =
    new Map<string, Set<(event: unknown) => void>>();
  private nextResponseTransform: ((response: unknown) => unknown) | null = null;

  constructor(
    private readonly kernel: MainWireScientificInProcessKernelV1,
  ) {}

  port(): MainWireScientificWorkerLikeV1 {
    return this as unknown as MainWireScientificWorkerLikeV1;
  }

  postMessage(message: unknown): void {
    void this.kernel.handle(message).then((response) => {
      const transform = this.nextResponseTransform;
      this.nextResponseTransform = null;
      this.emit("message", {
        data: transform === null ? response : transform(response),
      });
    });
  }

  terminate(): void {
    this.terminateCount += 1;
  }

  addEventListener(type: string, listener: (event: unknown) => void): void {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: (event: unknown) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  transformNextResponse(transform: (response: unknown) => unknown): void {
    this.nextResponseTransform = transform;
  }

  private emit(type: string, event: unknown): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      listener(event);
    }
  }
}
