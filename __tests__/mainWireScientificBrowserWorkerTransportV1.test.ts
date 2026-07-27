import { describe, expect, it, vi } from "vitest";

import {
  MainWireScientificWorkerClientV1,
  type MainWireScientificWorkerLikeV1,
  type MainWireScientificWorkerTransportErrorV1,
} from "@/engine/scientificBrowser";
import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificCommandV1,
} from "@/engine/scientific/worker";
import {
  createMainWireScientificResearchControlBaselineTargetStateV0,
  type MainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";

describe("main-wire scientific browser Worker transport V1", () => {
  it("matches concurrent responses by caller-supplied requestId", async () => {
    const worker = new FakeWorker();
    const client = clientFor(worker);
    const firstCommand = command("observe", "request-first", "session-1");
    const secondCommand = command("disposeSession", "request-second", "session-2");

    const first = client.request(firstCommand);
    const second = client.request(secondCommand);
    expect(worker.posted).toEqual([firstCommand, secondCommand]);
    expect(client.pendingRequestCount).toBe(2);

    worker.emitMessage(successResponse(secondCommand, {
      kind: "opaque-second-payload",
    }));
    worker.emitMessage(successResponse(firstCommand, {
      kind: "opaque-first-payload",
    }));

    await expect(second).resolves.toMatchObject({
      requestId: "request-second",
      payload: { kind: "opaque-second-payload" },
    });
    await expect(first).resolves.toMatchObject({
      requestId: "request-first",
      payload: { kind: "opaque-first-payload" },
    });
    expect(client.pendingRequestCount).toBe(0);
    expect(client.status).toBe("open");

    client.terminate();
    expect(client.status).toBe("terminated");
    expect(worker.terminateCount).toBe(1);
  });

  it("fails closed on protocol mismatch and rejects every pending request", async () => {
    const worker = new FakeWorker();
    const client = clientFor(worker);
    const first = client.request(command("observe", "request-1", "session-1"));
    const second = client.request(command("observe", "request-2", "session-2"));

    worker.emitMessage({
      ...successResponse(command("observe", "request-1", "session-1"), {}),
      protocolId: "unsupported-protocol",
    });

    await expectTransportError(first, "protocol-mismatch");
    await expectTransportError(second, "protocol-mismatch");
    expect(client.status).toBe("failed");
    expect(client.pendingRequestCount).toBe(0);
    expect(worker.terminateCount).toBe(1);
    await expectTransportError(
      client.request(command("observe", "request-3", "session-3")),
      "protocol-mismatch",
    );
  });

  it("detects a duplicate response and closes instead of guessing its owner", async () => {
    const worker = new FakeWorker();
    const client = clientFor(worker);
    const completedCommand = command("observe", "request-completed", "session-1");
    const completed = client.request(completedCommand);
    const response = successResponse(completedCommand, { opaque: true });
    worker.emitMessage(response);
    await expect(completed).resolves.toBe(response);

    const pending = client.request(command(
      "observe",
      "request-still-pending",
      "session-2",
    ));
    worker.emitMessage(response);

    await expectTransportError(pending, "duplicate-response");
    expect(client.status).toBe("failed");
    expect(worker.terminateCount).toBe(1);
  });

  it("fails closed on Worker error, messageerror, post failure, and terminate", async () => {
    const errorWorker = new FakeWorker();
    const errorClient = clientFor(errorWorker);
    const errored = errorClient.request(command(
      "observe",
      "request-worker-error",
      "session-1",
    ));
    errorWorker.emitError("worker crashed");
    await expectTransportError(errored, "worker-error");
    expect(errorWorker.terminateCount).toBe(1);

    const messageErrorWorker = new FakeWorker();
    const messageErrorClient = clientFor(messageErrorWorker);
    const deserializationFailed = messageErrorClient.request(command(
      "observe",
      "request-message-error",
      "session-1",
    ));
    messageErrorWorker.emitMessageError({ broken: true });
    await expectTransportError(
      deserializationFailed,
      "message-deserialization-error",
    );

    const postFailureWorker = new FakeWorker();
    postFailureWorker.postError = new Error("structured clone failed");
    const postFailureClient = clientFor(postFailureWorker);
    await expectTransportError(
      postFailureClient.request(command(
        "observe",
        "request-post-error",
        "session-1",
      )),
      "post-message-failed",
    );
    expect(postFailureWorker.terminateCount).toBe(1);

    const terminatedWorker = new FakeWorker();
    const terminatedClient = clientFor(terminatedWorker);
    const terminated = terminatedClient.request(command(
      "observe",
      "request-terminated",
      "session-1",
    ));
    terminatedClient.terminate();
    terminatedClient.terminate();
    await expectTransportError(terminated, "client-terminated");
    expect(terminatedWorker.terminateCount).toBe(1);
  });

  it("fails closed instead of leaving the UI pending when a Worker response is lost", async () => {
    vi.useFakeTimers();
    try {
      const worker = new FakeWorker();
      const client = new MainWireScientificWorkerClientV1({
        workerFactory: () => worker.port(),
        requestTimeoutMs: 25,
      });
      const first = client.request(command(
        "observe",
        "request-timeout-1",
        "session-1",
      ));
      const second = client.request(command(
        "observe",
        "request-timeout-2",
        "session-2",
      ));
      const firstExpectation = expectTransportError(first, "request-timeout");
      const secondExpectation = expectTransportError(second, "request-timeout");

      await vi.advanceTimersByTimeAsync(25);

      await firstExpectation;
      await secondExpectation;
      expect(client.status).toBe("failed");
      expect(client.pendingRequestCount).toBe(0);
      expect(worker.terminateCount).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("never reuses or generates request identifiers", async () => {
    const worker = new FakeWorker();
    const client = clientFor(worker);
    const submitted = command("observe", "caller-owned-id", "caller-session");
    const first = client.request(submitted);

    await expectTransportError(client.request(submitted), "duplicate-request-id");
    expect(worker.posted).toEqual([submitted]);
    const response = successResponse(submitted, { opaque: true });
    worker.emitMessage(response);
    await expect(first).resolves.toBe(response);
    await expectTransportError(client.request(submitted), "request-id-reused");
    expect(worker.posted).toEqual([submitted]);
    client.terminate();
  });

  it("bounds pending requests before postMessage and accepts error provenance", async () => {
    const worker = new FakeWorker();
    const client = new MainWireScientificWorkerClientV1({
      workerFactory: () => worker.port(),
      maximumPendingRequestCount: 1,
    });
    const firstCommand = command("observe", "request-capacity-1", "session-1");
    const first = client.request(firstCommand);
    const rejectedBeforePost = client.request(command(
      "observe",
      "request-capacity-2",
      "session-2",
    ));

    await expectTransportError(
      rejectedBeforePost,
      "pending-request-capacity-exceeded",
    );
    expect(worker.posted).toEqual([firstCommand]);
    expect(client.status).toBe("open");

    const scientificError = errorResponse(firstCommand, {
      kind: "transient-partial-progress",
      opaque: true,
    });
    worker.emitMessage(scientificError);
    await expect(first).resolves.toBe(scientificError);
    expect(client.status).toBe("open");
    client.terminate();

    const lifetimeWorker = new FakeWorker();
    const lifetimeClient = new MainWireScientificWorkerClientV1({
      workerFactory: () => lifetimeWorker.port(),
      maximumRequestCountPerClientLifetime: 1,
    });
    const oneCommand = command("observe", "request-lifetime-1", "session-1");
    const one = lifetimeClient.request(oneCommand);
    lifetimeWorker.emitMessage(successResponse(oneCommand, { opaque: true }));
    await expect(one).resolves.toMatchObject({ ok: true });
    await expectTransportError(
      lifetimeClient.request(command(
        "observe",
        "request-lifetime-2",
        "session-1",
      )),
      "request-capacity-exceeded",
    );
    const recovery = command(
      "disposeSession",
      "request-lifetime-recovery",
      "session-1",
    );
    const recovered = lifetimeClient.request(recovery);
    lifetimeWorker.emitMessage(successResponse(recovery, { kind: "disposed" }));
    await expect(recovered).resolves.toMatchObject({ ok: true });
    expect(lifetimeWorker.posted).toEqual([oneCommand, recovery]);
    lifetimeClient.terminate();
  });

  it("accepts the exact official-preset origin and rejects a malformed chain", async () => {
    const worker = new FakeWorker();
    const client = clientFor(worker);
    const submitted = officialPresetCommand(
      "request-official-preset",
      "official-preset-session",
    );
    const pending = client.request(submitted);
    worker.emitMessage(successResponse(
      submitted,
      {
        kind: "officialPresetSessionCreated",
        presetId: "circleheart/official-healthy-periodic",
        presetVersion: "1.0.0",
        observableFrame: {
          revision: 13_000,
          releaseRef: OFFICIAL_RELEASE_REF,
        },
      },
      OFFICIAL_PRESET_SESSION_ORIGIN,
      OFFICIAL_RELEASE_REF,
    ));
    await expect(pending).resolves.toMatchObject({
      commandKind: "createOfficialPresetSession",
      sessionOrigin: OFFICIAL_PRESET_SESSION_ORIGIN,
      payload: {
        kind: "officialPresetSessionCreated",
        presetId: "circleheart/official-healthy-periodic",
        presetVersion: "1.0.0",
      },
    });
    expect(client.status).toBe("open");
    client.terminate();

    const malformedWorker = new FakeWorker();
    const malformedClient = clientFor(malformedWorker);
    const malformedSubmitted = officialPresetCommand(
      "request-malformed-preset",
      "malformed-preset-session",
    );
    const malformedPending = malformedClient.request(malformedSubmitted);
    malformedWorker.emitMessage(successResponse(
      malformedSubmitted,
      { kind: "officialPresetSessionCreated" },
      {
        ...OFFICIAL_PRESET_SESSION_ORIGIN,
        checkpointRawFileSha256: "4".repeat(64),
      },
      OFFICIAL_RELEASE_REF,
    ));
    await expectTransportError(malformedPending, "protocol-mismatch");
    expect(malformedClient.status).toBe("failed");

    const wrongKindWorker = new FakeWorker();
    const wrongKindClient = clientFor(wrongKindWorker);
    const wrongKindSubmitted = officialPresetCommand(
      "request-wrong-origin-kind",
      "wrong-origin-kind-session",
    );
    const wrongKindPending = wrongKindClient.request(wrongKindSubmitted);
    wrongKindWorker.emitMessage(successResponse(
      wrongKindSubmitted,
      {
        kind: "officialPresetSessionCreated",
        presetId: "circleheart/official-healthy-periodic",
        presetVersion: "1.0.0",
        observableFrame: {
          revision: 13_000,
          releaseRef: OFFICIAL_RELEASE_REF,
        },
      },
      SESSION_ORIGIN,
      OFFICIAL_RELEASE_REF,
    ));
    await expectTransportError(wrongKindPending, "protocol-mismatch");

    const missingFrameWorker = new FakeWorker();
    const missingFrameClient = clientFor(missingFrameWorker);
    const missingFrameSubmitted = officialPresetCommand(
      "request-missing-frame",
      "missing-frame-session",
    );
    const missingFramePending = missingFrameClient.request(missingFrameSubmitted);
    missingFrameWorker.emitMessage(successResponse(
      missingFrameSubmitted,
      {
        kind: "officialPresetSessionCreated",
        presetId: "circleheart/official-healthy-periodic",
        presetVersion: "1.0.0",
      },
      OFFICIAL_PRESET_SESSION_ORIGIN,
      OFFICIAL_RELEASE_REF,
    ));
    await expectTransportError(missingFramePending, "protocol-mismatch");

    const wrongReleaseWorker = new FakeWorker();
    const wrongReleaseClient = clientFor(wrongReleaseWorker);
    const wrongReleaseSubmitted = officialPresetCommand(
      "request-wrong-release",
      "wrong-release-session",
    );
    const wrongReleasePending = wrongReleaseClient.request(
      wrongReleaseSubmitted,
    );
    wrongReleaseWorker.emitMessage(successResponse(
      wrongReleaseSubmitted,
      {
        kind: "officialPresetSessionCreated",
        presetId: "circleheart/official-healthy-periodic",
        presetVersion: "1.0.0",
        observableFrame: {
          revision: 13_000,
          releaseRef: OFFICIAL_RELEASE_REF,
        },
      },
      OFFICIAL_PRESET_SESSION_ORIGIN,
      RELEASE_REF,
    ));
    await expectTransportError(wrongReleasePending, "protocol-mismatch");
  });

  it("binds the V3 official document-case response to its pinned refs", async () => {
    const worker = new FakeWorker();
    const client = clientFor(worker);
    const baselineControlState =
      await createMainWireScientificResearchControlBaselineTargetStateV0();
    const submitted = officialDocumentCaseCommand(
      "request-official-document-case",
      "official-document-case-session",
    );
    const pending = client.request(submitted);
    worker.emitMessage(successResponse(
      submitted,
      officialDocumentCasePayload(baselineControlState),
      OFFICIAL_DOCUMENT_CASE_ORIGIN,
      OFFICIAL_RELEASE_REF,
    ));
    await expect(pending).resolves.toMatchObject({
      commandKind: "createOfficialDocumentCaseSession",
      sessionOrigin: OFFICIAL_DOCUMENT_CASE_ORIGIN,
      payload: {
        kind: "officialDocumentCaseSessionCreated",
        caseRef: OFFICIAL_CASE_REF,
        workspaceRef: OFFICIAL_WORKSPACE_REF,
      },
    });
    expect(client.status).toBe("open");
    client.terminate();

    const tamperedControlWorker = new FakeWorker();
    const tamperedControlClient = clientFor(tamperedControlWorker);
    const tamperedControlSubmitted = officialDocumentCaseCommand(
      "request-tampered-baseline-control",
      "tampered-baseline-control-session",
    );
    const tamperedControlPending = tamperedControlClient.request(
      tamperedControlSubmitted,
    );
    const tamperedControlPayload = structuredClone(
      officialDocumentCasePayload(baselineControlState),
    ) as Record<string, any>;
    tamperedControlPayload.researchControlContext.controlState.controls[
      "circulation.pulmonary-vascular-resistance-scale"
    ] = 0.75;
    tamperedControlWorker.emitMessage(successResponse(
      tamperedControlSubmitted,
      tamperedControlPayload,
      OFFICIAL_DOCUMENT_CASE_ORIGIN,
      OFFICIAL_RELEASE_REF,
    ));
    await expectTransportError(tamperedControlPending, "protocol-mismatch");

    const forgedWorker = new FakeWorker();
    const forgedClient = clientFor(forgedWorker);
    const forgedSubmitted = officialDocumentCaseCommand(
      "request-forged-workspace-ref",
      "forged-workspace-ref-session",
    );
    const forgedPending = forgedClient.request(forgedSubmitted);
    forgedWorker.emitMessage(successResponse(
      forgedSubmitted,
      officialDocumentCasePayload(baselineControlState),
      {
        ...OFFICIAL_DOCUMENT_CASE_ORIGIN,
        workspaceRef: {
          ...OFFICIAL_WORKSPACE_REF,
          sha256: "f".repeat(64),
        },
      },
      OFFICIAL_RELEASE_REF,
    ));
    await expectTransportError(forgedPending, "protocol-mismatch");
    expect(forgedClient.status).toBe("failed");
  });
});

class FakeWorker {
  readonly posted: unknown[] = [];
  terminateCount = 0;
  postError: Error | null = null;

  private readonly listeners = new Map<string, Set<(event: unknown) => void>>();

  port(): MainWireScientificWorkerLikeV1 {
    return this as unknown as MainWireScientificWorkerLikeV1;
  }

  postMessage(message: unknown): void {
    if (this.postError !== null) throw this.postError;
    this.posted.push(message);
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

  emitMessage(data: unknown): void {
    this.emit("message", { data });
  }

  emitMessageError(data: unknown): void {
    this.emit("messageerror", { data });
  }

  emitError(message: string): void {
    this.emit("error", {
      message,
      error: new Error(message),
      preventDefault: () => undefined,
    });
  }

  private emit(type: string, event: unknown): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      listener(event);
    }
  }
}

function command(
  kind: "observe" | "disposeSession",
  requestId: string,
  sessionId: string,
): ScientificCommandV1 {
  return Object.freeze({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind,
    requestId,
    sessionId,
  });
}

function officialPresetCommand(
  requestId: string,
  sessionId: string,
): ScientificCommandV1 {
  return Object.freeze({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind: "createOfficialPresetSession" as const,
    requestId,
    sessionId,
    presetId: "circleheart/official-healthy-periodic" as const,
    presetVersion: "1.0.0" as const,
  });
}

function officialDocumentCaseCommand(
  requestId: string,
  sessionId: string,
): ScientificCommandV1 {
  return Object.freeze({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind: "createOfficialDocumentCaseSession" as const,
    requestId,
    sessionId,
    presetId: "circleheart/official-healthy-periodic" as const,
    presetVersion: "1.0.0" as const,
  });
}

function officialDocumentCasePayload(
  controlState: MainWireScientificResearchControlTargetStateV0,
) {
  return {
    kind: "officialDocumentCaseSessionCreated",
    presetId: "circleheart/official-healthy-periodic",
    presetVersion: "1.0.0",
    checkpointSha256:
      "10b0a0b94180842a1971549e35aaf1a0064f93103b6a965052528ba30bd03f15",
    sessionInputSha256:
      "84bcec5ef9ca80ade7f2d2615a2fbf23fda64a427b7eb1065563b47a1f0dac4f",
    caseRef: OFFICIAL_CASE_REF,
    workspaceRef: OFFICIAL_WORKSPACE_REF,
    periodicSteadyStateClaimed: true,
    researchControlContext: {
      stateIdentity: {
        revision: 13_000,
        acceptedTimeSec: 26,
        totalBloodVolumeMl: 5_000,
      },
      controlState,
      parameterEpoch: 0,
    },
    observableFrame: {
      revision: 13_000,
      acceptedTimeSec: 26,
      releaseRef: OFFICIAL_RELEASE_REF,
    },
  };
}

function successResponse(
  submitted: ScientificCommandV1,
  payload: unknown,
  sessionOrigin: unknown = SESSION_ORIGIN,
  releaseRef: unknown = RELEASE_REF,
): Record<string, unknown> {
  return {
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    ok: true,
    requestId: submitted.requestId,
    sessionId: submitted.sessionId,
    releaseRef,
    sessionOrigin,
    commandKind: submitted.kind,
    payload,
    error: null,
  };
}

function errorResponse(
  submitted: ScientificCommandV1,
  partialProgress: Record<string, unknown> | null,
): Record<string, unknown> {
  return {
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    ok: false,
    requestId: submitted.requestId,
    sessionId: submitted.sessionId,
    releaseRef: null,
    sessionOrigin: null,
    commandKind: submitted.kind,
    payload: null,
    error: {
      code: "unknown-session-id",
      message: "scientific command was rejected",
      retryable: false,
      silentFallbackApplied: false,
      observableFrames: [],
      partialProgress,
    },
  };
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

function clientFor(worker: FakeWorker): MainWireScientificWorkerClientV1 {
  return new MainWireScientificWorkerClientV1({
    workerFactory: () => worker.port(),
  });
}

const RELEASE_REF = Object.freeze({
  id: "main-wire-adult-five-wall-non-coronary",
  version: "0.1.0",
  sha256: "1".repeat(64),
});

const OFFICIAL_RELEASE_REF = Object.freeze({
  id: "circleheart/adult-five-wall-noncoronary",
  version: "0.2.0",
  sha256:
    "aa1947dc572b94370044e97efc03e3e62b000657a2fd580be7883d2b0774e48a",
});

const SESSION_ORIGIN = Object.freeze({
  kind: "canonical-cold-start",
  initializationProtocolId: "main-wire-initialization-v1",
  initializationProtocolVersion: "1",
});

const OFFICIAL_PRESET_SESSION_ORIGIN = Object.freeze({
  kind: "official-preset-exact-checkpoint-restore",
  presetId: "circleheart/official-healthy-periodic",
  presetVersion: "1.0.0",
  catalogSchemaId: "circleheart-official-preset-catalog-v1",
  catalogSchemaVersion: 1,
  manifestRawFileSha256:
    "4bd772f1df329d56502954d88e4e276e643d8b150368480f38af242a8eefbce8",
  checkpointRawFileSha256:
    "e00e1b6b4507f3b9bec6f8eaebfe5f3fc79b41c7bb97ae7eb74f24bc3754a3d4",
  checkpointSha256:
    "9c3ee4a8adb59bcf21e261e6b58443714b642bbc25e98293091c3917252ea43c",
  parameterization: "fixed-canonical-only",
});

const OFFICIAL_CASE_REF = Object.freeze({
  schemaId: "circleheart-main-wire-scientific-case-document-ref-v1",
  sha256:
    "0e48b0cd6c50c3807dd1f5d6482ef487330d70e757d5fe3a6543800d17eca5f8",
});

const OFFICIAL_WORKSPACE_REF = Object.freeze({
  schemaId: "circleheart-main-wire-scientific-workspace-document-ref-v1",
  sha256:
    "2ee687406df73ac96a382070355e899ed16cf0a98f01a515d285bcb1a40112b7",
});

const OFFICIAL_DOCUMENT_CASE_ORIGIN = Object.freeze({
  kind: "official-document-case-v3-exact-checkpoint-restore",
  presetId: "circleheart/official-healthy-periodic",
  presetVersion: "1.0.0",
  catalogSchemaId:
    "circleheart-official-scientific-document-chain-catalog-v1",
  catalogSchemaVersion: 1,
  catalogRawFileSha256:
    "a02ef9c8b9834dbdcbbff28e3aa9eeb0b5ae462ff4c899759d2a77fe9ca2c83b",
  checkpointRawFileSha256:
    "f3d8913125bfcd8e5d2066674157b4882164bcb0f9575d1ac67f8baf6aec2a14",
  checkpointSha256:
    "10b0a0b94180842a1971549e35aaf1a0064f93103b6a965052528ba30bd03f15",
  sessionInputSha256:
    "84bcec5ef9ca80ade7f2d2615a2fbf23fda64a427b7eb1065563b47a1f0dac4f",
  caseRef: OFFICIAL_CASE_REF,
  workspaceRef: OFFICIAL_WORKSPACE_REF,
  periodicSteadyStateClaimed: true,
  clinicalValidationClaimed: false,
});
