import { describe, expect, it } from "vitest";

import {
  MainWireScientificWorkerClientV1,
  type MainWireScientificWorkerLikeV1,
  type MainWireScientificWorkerTransportErrorV1,
} from "@/engine/scientificBrowser";
import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificCommandV1,
} from "@/engine/scientific/worker";

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
    "75a4aac4458de6f03db4fe3d43a919a9d06ec34e5f18e2ae48fbf63475f9e7e4",
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
    "eb40d42aa4e8bde3b696eb1257428d2022826137e1f2c994c75f59188e451ca0",
  checkpointRawFileSha256:
    "dbe660999758177aa7c72f92ce8da3bf4378a69d11f42454724a4f923d767ea2",
  checkpointSha256:
    "2f1c0b477905b07dfefc8a37ee7e1b7ab3d856d7f017770c6bc92a22fb529ff0",
  parameterization: "fixed-canonical-only",
});
