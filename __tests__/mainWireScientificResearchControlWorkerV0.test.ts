import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlCatalogV0";
import {
  createMainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls";
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

describe("main-wire scientific research-control Worker V0", () => {
  it("forks exact accepted state, retains source, and binds exploratory target execution", async () => {
    const kernel = new MainWireScientificInProcessKernelV1({
      maximumSessionCount: 8,
      officialDocumentCaseLoader:
        loadBundledOfficialHealthyPeriodicDocumentChainV1,
    });
    expect(kernel.claim).toMatchObject({
      researchControlForkCapability:
        "release-bound-state-preserving-new-session-v0",
      researchControlSourceSessionRetainedAtFork: true,
      researchControlPeriodicTrackerResetInTargetOnly: true,
      researchControlArbitraryParameterPatchAccepted: false,
      researchControlCheckpointCapability:
        "control-aware-exact-resume-v4",
      controlAwareExactCheckpointCapability:
        "v4-release-base-input-control-epoch-state-codec-phase-bound",
    });
    const worker = new KernelWorkerBridge(kernel);
    const client = new MainWireScientificWorkerClientV1({
      workerFactory: () => worker.port(),
    });

    const created = await client.request(officialCreateCommand(
      "request-control-source-create",
      "control-source",
    ));
    if (
      !created.ok
      || created.payload.kind !== "officialDocumentCaseSessionCreated"
    ) throw new Error("official control source creation failed");
    const baselineContext = created.payload.researchControlContext;
    expect(baselineContext).toMatchObject({
      parameterEpoch: 0,
      stateIdentity: {
        revision: created.payload.observableFrame.revision,
        acceptedTimeSec: created.payload.observableFrame.acceptedTimeSec,
      },
    });
    expect(baselineContext.controlState.controls)
      .toEqual(MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0);

    const lowerSvr = await controlState(0.75, 1);
    const forked = await client.request({
      ...baseCommand(
        "forkResearchControlSession",
        "request-control-fork",
        "control-target",
      ),
      sourceSessionId: "control-source",
      expectedSource: {
        ...baselineContext.stateIdentity,
        controlStateSha256:
          baselineContext.controlState.targetStateSha256,
        parameterEpoch: baselineContext.parameterEpoch,
      },
      targetControlState: lowerSvr,
    });
    if (!forked.ok || forked.payload.kind !== "researchControlSessionForked") {
      throw new Error("research control fork failed");
    }
    expect(forked.sessionOrigin).toMatchObject({
      kind: "research-control-state-preserving-fork-v0",
      sourceSessionId: "control-source",
      sourceControlStateSha256:
        baselineContext.controlState.targetStateSha256,
      targetControlStateSha256: lowerSvr.targetStateSha256,
      parameterEpoch: 1,
      acceptedStatePreservedAtFork: true,
      periodicTrackerResetAtFork: true,
      sourceSessionRetainedAtFork: true,
      exactCheckpointCapability:
        "control-aware-exact-checkpoint-v4",
      periodicSteadyStateClaimed: false,
    });
    expect(forked.payload.exactCheckpointAvailable).toBe(true);
    expect(forked.payload.sourceStateIdentity)
      .toEqual(baselineContext.stateIdentity);
    expect(forked.payload.targetStateIdentity)
      .toEqual(baselineContext.stateIdentity);
    expect(forked.payload.observableFrame).toMatchObject({
      source: "research-control-state-fork",
      revision: baselineContext.stateIdentity.revision,
      acceptedTimeSec: baselineContext.stateIdentity.acceptedTimeSec,
      values: {
        "hemodynamics.pressure.absolute.LA": {
          value: null,
          availability: "not-evaluated-at-accepted-state",
        },
        "valve.MV.flow": {
          value: null,
          availability: "not-evaluated-at-accepted-state",
        },
      },
    });

    const sourceAfterFork = await client.request(baseCommand(
      "observe",
      "request-source-after-fork",
      "control-source",
    ));
    expect(successFrame(sourceAfterFork)).toMatchObject({
      revision: baselineContext.stateIdentity.revision,
      acceptedTimeSec: baselineContext.stateIdentity.acceptedTimeSec,
    });

    const transient = await client.request({
      ...baseCommand(
        "runTransient",
        "request-target-transient",
        "control-target",
      ),
      dtSec: 0.002,
      stepCount: 4,
      observationStride: 1,
    });
    if (!transient.ok || transient.payload.kind !== "transientCompleted") {
      throw new Error("target transient failed");
    }
    expect(transient.payload.executionProtocol).toMatchObject({
      classification: "exploratory-parameterization",
      dtSec: 0.002,
      stepCount: 4,
      observationPolicy: { stride: 1 },
    });
    expect(transient.payload.observableFrames).toHaveLength(4);
    expect(transient.payload.finalObservableFrame.revision)
      .toBe(baselineContext.stateIdentity.revision + 4);

    const checkpoint = await client.request(baseCommand(
      "getExactCheckpoint",
      "request-target-checkpoint",
      "control-target",
    ));
    expect(checkpoint).toMatchObject({
      ok: false,
      sessionOrigin: forked.sessionOrigin,
      error: {
        code: "checkpoint-failed",
        retryable: false,
        silentFallbackApplied: false,
      },
    });

    const higherPvr = await controlState(0.75, 1.5);
    const chained = await client.request({
      ...baseCommand(
        "forkResearchControlSession",
        "request-control-chain",
        "control-target-epoch-2",
      ),
      sourceSessionId: "control-target",
      expectedSource: {
        revision: transient.payload.finalObservableFrame.revision,
        acceptedTimeSec:
          transient.payload.finalObservableFrame.acceptedTimeSec,
        totalBloodVolumeMl:
          forked.payload.targetStateIdentity.totalBloodVolumeMl,
        controlStateSha256: lowerSvr.targetStateSha256,
        parameterEpoch: 1,
      },
      targetControlState: higherPvr,
    });
    expect(chained).toMatchObject({
      ok: true,
      sessionOrigin: {
        kind: "research-control-state-preserving-fork-v0",
        sourceSessionId: "control-target",
        sourceControlStateSha256: lowerSvr.targetStateSha256,
        targetControlStateSha256: higherPvr.targetStateSha256,
        parameterEpoch: 2,
      },
      payload: {
        kind: "researchControlSessionForked",
        parameterEpoch: 2,
        targetControlState: higherPvr,
      },
    });

    const noOp = await client.request({
      ...baseCommand(
        "forkResearchControlSession",
        "request-control-no-op",
        "control-no-op-target",
      ),
      sourceSessionId: "control-source",
      expectedSource: {
        ...baselineContext.stateIdentity,
        controlStateSha256:
          baselineContext.controlState.targetStateSha256,
        parameterEpoch: 0,
      },
      targetControlState: baselineContext.controlState,
    });
    expect(noOp).toMatchObject({
      ok: false,
      error: { code: "research-control-fork-rejected" },
    });

    const staleState = await client.request({
      ...baseCommand(
        "forkResearchControlSession",
        "request-control-stale-state",
        "control-stale-target",
      ),
      sourceSessionId: "control-source",
      expectedSource: {
        ...baselineContext.stateIdentity,
        revision: baselineContext.stateIdentity.revision + 1,
        controlStateSha256:
          baselineContext.controlState.targetStateSha256,
        parameterEpoch: 0,
      },
      targetControlState: lowerSvr,
    });
    expect(staleState).toMatchObject({
      ok: false,
      error: { code: "state-precondition-failed" },
    });

    const staleEpoch = await client.request({
      ...baseCommand(
        "forkResearchControlSession",
        "request-control-stale-epoch",
        "control-stale-epoch-target",
      ),
      sourceSessionId: "control-source",
      expectedSource: {
        ...baselineContext.stateIdentity,
        controlStateSha256:
          baselineContext.controlState.targetStateSha256,
        parameterEpoch: 1,
      },
      targetControlState: lowerSvr,
    });
    expect(staleEpoch).toMatchObject({
      ok: false,
      error: { code: "state-precondition-failed" },
    });

    await client.request(baseCommand(
      "disposeSession",
      "request-dispose-target",
      "control-target",
    ));
    const sourceAfterTargetDispose = await client.request(baseCommand(
      "observe",
      "request-source-after-target-dispose",
      "control-source",
    ));
    expect(successFrame(sourceAfterTargetDispose)).toMatchObject({
      revision: baselineContext.stateIdentity.revision,
      acceptedTimeSec: baselineContext.stateIdentity.acceptedTimeSec,
    });

    worker.transformNextResponse((response) => {
      const forged = structuredClone(response) as Record<string, any>;
      forged.sessionOrigin.sourceSessionId = "forged-source-session";
      return forged;
    });
    const forgedTargetResponse = client.request(baseCommand(
      "observe",
      "request-forged-target-origin",
      "control-target-epoch-2",
    ));
    await expectTransportError(forgedTargetResponse, "protocol-mismatch");
    expect(client.status).toBe("failed");
  }, 30_000);

  it("fails closed when a fork response changes the source session-input ancestry", async () => {
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
      "request-ancestry-source-create",
      "ancestry-source",
    ));
    if (
      !created.ok
      || created.payload.kind !== "officialDocumentCaseSessionCreated"
    ) throw new Error("official ancestry source creation failed");
    const context = created.payload.researchControlContext;
    const lowerSvr = await controlState(0.75, 1);

    worker.transformNextResponse((response) => {
      const forged = structuredClone(response) as Record<string, any>;
      forged.sessionOrigin.baseSessionInputSha256 = "f".repeat(64);
      return forged;
    });
    const tamperedFork = client.request({
      ...baseCommand(
        "forkResearchControlSession",
        "request-tampered-ancestry-fork",
        "tampered-ancestry-target",
      ),
      sourceSessionId: "ancestry-source",
      expectedSource: {
        ...context.stateIdentity,
        controlStateSha256: context.controlState.targetStateSha256,
        parameterEpoch: context.parameterEpoch,
      },
      targetControlState: lowerSvr,
    });

    await expectTransportError(tamperedFork, "protocol-mismatch");
    expect(client.status).toBe("failed");
    expect(worker.terminateCount).toBe(1);
  }, 30_000);

  it("fails closed when a fork frame escapes the response release", async () => {
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
      "request-frame-release-source-create",
      "frame-release-source",
    ));
    if (
      !created.ok
      || created.payload.kind !== "officialDocumentCaseSessionCreated"
    ) throw new Error("official frame-release source creation failed");
    const context = created.payload.researchControlContext;
    const lowerSvr = await controlState(0.75, 1);

    worker.transformNextResponse((response) => {
      const forged = structuredClone(response) as Record<string, any>;
      forged.payload.observableFrame.releaseRef.sha256 = "e".repeat(64);
      return forged;
    });
    const tamperedFork = client.request({
      ...baseCommand(
        "forkResearchControlSession",
        "request-tampered-frame-release-fork",
        "tampered-frame-release-target",
      ),
      sourceSessionId: "frame-release-source",
      expectedSource: {
        ...context.stateIdentity,
        controlStateSha256: context.controlState.targetStateSha256,
        parameterEpoch: context.parameterEpoch,
      },
      targetControlState: lowerSvr,
    });

    await expectTransportError(tamperedFork, "protocol-mismatch");
    expect(client.status).toBe("failed");
    expect(worker.terminateCount).toBe(1);
  }, 30_000);

  it("fails closed on every successful checkpoint response from a control target", async () => {
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
      "request-checkpoint-source-create",
      "checkpoint-source",
    ));
    if (
      !created.ok
      || created.payload.kind !== "officialDocumentCaseSessionCreated"
    ) throw new Error("official checkpoint source creation failed");
    const sourceCheckpoint = await client.request(baseCommand(
      "getExactCheckpoint",
      "request-source-valid-checkpoint",
      "checkpoint-source",
    ));
    if (
      !sourceCheckpoint.ok
      || sourceCheckpoint.payload.kind !== "exactCheckpoint"
    ) throw new Error("official source checkpoint failed");
    const exactSourceCheckpoint = sourceCheckpoint.payload.checkpoint;
    const context = created.payload.researchControlContext;
    const lowerSvr = await controlState(0.75, 1);
    const forked = await client.request({
      ...baseCommand(
        "forkResearchControlSession",
        "request-checkpoint-target-fork",
        "checkpoint-target",
      ),
      sourceSessionId: "checkpoint-source",
      expectedSource: {
        ...context.stateIdentity,
        controlStateSha256: context.controlState.targetStateSha256,
        parameterEpoch: context.parameterEpoch,
      },
      targetControlState: lowerSvr,
    });
    if (!forked.ok || forked.payload.kind !== "researchControlSessionForked") {
      throw new Error("checkpoint target fork failed");
    }
    const targetForkFrame = forked.payload.observableFrame;

    worker.transformNextResponse((response) => {
      const forged = structuredClone(response) as Record<string, any>;
      forged.ok = true;
      forged.error = null;
      forged.payload = {
        kind: "exactCheckpoint",
        checkpoint: exactSourceCheckpoint,
        observableFrame: targetForkFrame,
      };
      return forged;
    });
    const forgedCheckpoint = client.request(baseCommand(
      "getExactCheckpoint",
      "request-forged-target-checkpoint",
      "checkpoint-target",
    ));

    await expectTransportError(forgedCheckpoint, "protocol-mismatch");
    expect(client.status).toBe("failed");
    expect(worker.terminateCount).toBe(1);
  }, 30_000);

  it("fails closed before resolving a V4 checkpoint with nested allowed-value tampering", async () => {
    const kernel = new MainWireScientificInProcessKernelV1({
      maximumSessionCount: 4,
      officialDocumentCaseLoader:
        loadBundledOfficialHealthyPeriodicDocumentChainV1,
    });
    const worker = new KernelWorkerBridge(kernel);
    const client = new MainWireScientificWorkerClientV1({
      workerFactory: () => worker.port(),
    });
    await createForkedControlTargetV0(
      client,
      "nested-digest",
      "nested-digest-source",
      "nested-digest-target",
    );

    worker.transformNextResponse((response) => {
      const forged = structuredClone(response) as Record<string, any>;
      forged.payload.checkpoint.controlTargetState.controls[
        "circulation.systemic-vascular-resistance-scale"
      ] = 1;
      return forged;
    });
    const checkpoint = client.request(baseCommand(
      "getExactCheckpointV4",
      "request-nested-digest-checkpoint",
      "nested-digest-target",
    ));

    await expectTransportError(checkpoint, "protocol-mismatch");
    expect(client.status).toBe("failed");
    expect(worker.terminateCount).toBe(1);
  }, 30_000);

  it("fails closed on a valid V4 checkpoint carried by an unbound origin", async () => {
    const kernel = new MainWireScientificInProcessKernelV1({
      maximumSessionCount: 4,
      officialDocumentCaseLoader:
        loadBundledOfficialHealthyPeriodicDocumentChainV1,
    });
    const worker = new KernelWorkerBridge(kernel);
    const client = new MainWireScientificWorkerClientV1({
      workerFactory: () => worker.port(),
    });
    await createForkedControlTargetV0(
      client,
      "unbound-origin",
      "unbound-origin-source",
      "unbound-origin-target",
    );

    worker.transformNextResponse((response) => {
      const forged = structuredClone(response) as Record<string, any>;
      forged.sessionOrigin = {
        kind: "canonical-cold-start",
        initializationProtocolId: "forged-unbound-origin",
        initializationProtocolVersion: "1.0.0",
      };
      return forged;
    });
    const checkpoint = client.request(baseCommand(
      "getExactCheckpointV4",
      "request-unbound-origin-checkpoint",
      "unbound-origin-target",
    ));

    await expectTransportError(checkpoint, "protocol-mismatch");
    expect(client.status).toBe("failed");
    expect(worker.terminateCount).toBe(1);
  }, 30_000);

  it("fails closed on a duplicate response received during V4 validation", async () => {
    const kernel = new MainWireScientificInProcessKernelV1({
      maximumSessionCount: 4,
      officialDocumentCaseLoader:
        loadBundledOfficialHealthyPeriodicDocumentChainV1,
    });
    const worker = new KernelWorkerBridge(kernel);
    const client = new MainWireScientificWorkerClientV1({
      workerFactory: () => worker.port(),
    });
    await createForkedControlTargetV0(
      client,
      "validation-duplicate",
      "validation-duplicate-source",
      "validation-duplicate-target",
    );

    worker.duplicateNextResponseDuringValidation();
    const checkpoint = client.request(baseCommand(
      "getExactCheckpointV4",
      "request-validation-duplicate-checkpoint",
      "validation-duplicate-target",
    ));

    await expectTransportError(checkpoint, "duplicate-response");
    expect(client.status).toBe("failed");
    expect(worker.terminateCount).toBe(1);
  }, 30_000);
});

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

async function createForkedControlTargetV0(
  client: MainWireScientificWorkerClientV1,
  requestPrefix: string,
  sourceSessionId: string,
  targetSessionId: string,
): Promise<void> {
  const created = await client.request(officialCreateCommand(
    `request-${requestPrefix}-create`,
    sourceSessionId,
  ));
  if (
    !created.ok
    || created.payload.kind !== "officialDocumentCaseSessionCreated"
  ) throw new Error("official control source creation failed");
  const context = created.payload.researchControlContext;
  const targetState = await controlState(0.75, 1);
  const forked = await client.request({
    ...baseCommand(
      "forkResearchControlSession",
      `request-${requestPrefix}-fork`,
      targetSessionId,
    ),
    sourceSessionId,
    expectedSource: {
      ...context.stateIdentity,
      controlStateSha256: context.controlState.targetStateSha256,
      parameterEpoch: context.parameterEpoch,
    },
    targetControlState: targetState,
  });
  if (!forked.ok || forked.payload.kind !== "researchControlSessionForked") {
    throw new Error("research control fork failed");
  }
}

function successFrame(
  response: Awaited<ReturnType<MainWireScientificWorkerClientV1["request"]>>,
) {
  if (
    !response.ok
    || response.payload.kind !== "observation"
  ) throw new Error("expected observation response");
  return response.payload.observableFrame;
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
  private duplicateNextResponse = false;

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
      const outgoing = transform === null ? response : transform(response);
      this.emit("message", { data: outgoing });
      if (this.duplicateNextResponse) {
        this.duplicateNextResponse = false;
        queueMicrotask(() => {
          this.emit("message", { data: structuredClone(outgoing) });
        });
      }
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

  duplicateNextResponseDuringValidation(): void {
    this.duplicateNextResponse = true;
  }

  private emit(type: string, event: unknown): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      listener(event);
    }
  }
}
