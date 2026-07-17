import { describe, expect, it } from "vitest";

import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  mainWireScientificSessionIntentV1,
  resolveMainWireScientificSessionInputV1,
} from "@/engine/scientific/inputs";
import {
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";
import {
  MainWireScientificInProcessKernelV1,
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificCommandV1,
} from "@/engine/scientific/worker";
import {
  MainWireScientificWorkerClientV1,
  type MainWireScientificWorkerLikeV1,
} from "@/engine/scientificBrowser";

describe("main-wire resolved-session Worker protocol V1", () => {
  it("starts healthy and severe cold sessions only after release-bound validation", async () => {
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const [healthy, aorticStenosis] = await Promise.all([
      resolveMainWireScientificSessionInputV1(
        release,
        mainWireScientificSessionIntentV1(release.ref),
      ),
      resolveMainWireScientificSessionInputV1(
        release,
        mainWireScientificSessionIntentV1(release.ref, "AS-severe"),
      ),
    ]);
    const kernel = new MainWireScientificInProcessKernelV1({
      maximumSessionCount: 2,
    });
    expect(kernel.claim).toMatchObject({
      resolvedSessionInputCapability:
        "complete-input-release-bound-revalidation",
      resolvedSessionArbitraryParameterPatchAccepted: false,
      silentFallbackApplied: false,
      legacyBackendFallbackAvailable: false,
    });

    const createdHealthy = await kernel.handle(resolvedCommand(
      "request-resolved-healthy",
      "session-resolved-healthy",
      healthy,
    ));
    expect(createdHealthy).toMatchObject({
      ok: true,
      commandKind: "createResolvedSession",
      releaseRef: release.ref,
      sessionOrigin: {
        kind: "resolved-session-input-cold-start",
        sessionInputSchemaId:
          "circleheart-main-wire-resolved-session-input-v1",
        sessionInputSchemaVersion: 1,
        sessionInputSha256: healthy.sessionInputSha256,
        initializationProtocolVersion: "1.0.0",
      },
      payload: {
        kind: "resolvedSessionCreated",
        sessionInputSha256: healthy.sessionInputSha256,
        observableFrame: {
          revision: 0,
          acceptedTimeSec: 0,
          releaseRef: release.ref,
        },
      },
      error: null,
    });

    const createdSevere = await kernel.handle(resolvedCommand(
      "request-resolved-as-severe",
      "session-resolved-as-severe",
      aorticStenosis,
    ));
    expect(createdSevere).toMatchObject({
      ok: true,
      commandKind: "createResolvedSession",
      sessionOrigin: {
        kind: "resolved-session-input-cold-start",
        sessionInputSha256: aorticStenosis.sessionInputSha256,
      },
      payload: {
        kind: "resolvedSessionCreated",
        sessionInputSha256: aorticStenosis.sessionInputSha256,
        observableFrame: { revision: 0 },
      },
    });
    expect(aorticStenosis.sessionInputSha256)
      .not.toBe(healthy.sessionInputSha256);
    expect(kernel.activeSessionCount()).toBe(2);
    expect(structuredClone(createdSevere)).toEqual(createdSevere);
  }, 120_000);

  it("rejects stale/rehashed tamper and every arbitrary command patch", async () => {
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const resolved = await resolveMainWireScientificSessionInputV1(
      release,
      mainWireScientificSessionIntentV1(release.ref),
    );
    const kernel = new MainWireScientificInProcessKernelV1();

    const staleDigest = JSON.parse(JSON.stringify(resolved)) as Record<
      string,
      any
    >;
    staleDigest.resolvedParameters.circulationRuntime.valvePreset.valves
      .AoV.maximumForwardEoaCm2 -= 0.25;
    const staleRejected = await kernel.handle(resolvedCommand(
      "request-resolved-stale-digest",
      "session-resolved-stale-digest",
      staleDigest,
    ));
    expect(staleRejected).toMatchObject({
      ok: false,
      commandKind: "createResolvedSession",
      error: {
        code: "resolved-session-input-rejected",
        message: expect.stringMatching(/sessionInputSha256/),
        retryable: false,
        silentFallbackApplied: false,
      },
    });

    const rechained = JSON.parse(JSON.stringify(staleDigest)) as Record<
      string,
      any
    >;
    const { sessionInputSha256: ignoredSha, ...payload } = rechained;
    expect(ignoredSha).toBe(resolved.sessionInputSha256);
    rechained.sessionInputSha256 = await sha256CanonicalJsonHex(payload);
    const rechainedRejected = await kernel.handle(resolvedCommand(
      "request-resolved-rehashed-tamper",
      "session-resolved-rehashed-tamper",
      rechained,
    ));
    expect(rechainedRejected).toMatchObject({
      ok: false,
      error: {
        code: "resolved-session-input-rejected",
        message: expect.stringMatching(/release-bound re-resolution/),
      },
    });

    const arbitraryPatch = await kernel.handle({
      ...resolvedCommand(
        "request-resolved-arbitrary-patch",
        "session-resolved-arbitrary-patch",
        resolved,
      ),
      parameterPatches: [{ path: "circulation.valvePreset", value: {} }],
    });
    expect(arbitraryPatch).toMatchObject({
      ok: false,
      commandKind: "createResolvedSession",
      error: {
        code: "invalid-command",
        message: "command fields do not match its kind",
        silentFallbackApplied: false,
      },
    });
    expect(kernel.activeSessionCount()).toBe(0);
  }, 120_000);

  it("binds browser responses to the submitted release and input SHA", async () => {
    const releaseRef = Object.freeze({
      id: "circleheart/adult-five-wall-noncoronary",
      version: "0.2.0",
      sha256:
        "75a4aac4458de6f03db4fe3d43a919a9d06ec34e5f18e2ae48fbf63475f9e7e4",
    });
    const sessionInputSha256 = "a".repeat(64);
    const submitted = resolvedCommand(
      "request-browser-resolved",
      "session-browser-resolved",
      { releaseRef, sessionInputSha256 },
    );
    const worker = new FakeWorker();
    const client = clientFor(worker);
    const pending = client.request(submitted);
    expect(worker.posted).toEqual([submitted]);
    worker.emitMessage(resolvedSuccessResponse(
      submitted,
      releaseRef,
      sessionInputSha256,
    ));
    await expect(pending).resolves.toMatchObject({
      ok: true,
      sessionOrigin: {
        kind: "resolved-session-input-cold-start",
        sessionInputSha256,
      },
      payload: { kind: "resolvedSessionCreated", sessionInputSha256 },
    });
    expect(client.status).toBe("open");
    client.terminate();

    const forgedWorker = new FakeWorker();
    const forgedClient = clientFor(forgedWorker);
    const forgedSubmitted = resolvedCommand(
      "request-browser-forged",
      "session-browser-forged",
      { releaseRef, sessionInputSha256 },
    );
    const forgedPending = forgedClient.request(forgedSubmitted);
    forgedWorker.emitMessage(resolvedSuccessResponse(
      forgedSubmitted,
      releaseRef,
      "b".repeat(64),
    ));
    await expect(forgedPending).rejects.toMatchObject({
      name: "MainWireScientificWorkerTransportErrorV1",
      code: "protocol-mismatch",
    });
    expect(forgedClient.status).toBe("failed");
    expect(forgedWorker.terminateCount).toBe(1);
  });
});

function resolvedCommand(
  requestId: string,
  sessionId: string,
  resolvedSessionInput: unknown,
): Extract<ScientificCommandV1, { kind: "createResolvedSession" }> {
  return Object.freeze({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind: "createResolvedSession" as const,
    requestId,
    sessionId,
    resolvedSessionInput,
  });
}

function resolvedSuccessResponse(
  submitted: Extract<ScientificCommandV1, { kind: "createResolvedSession" }>,
  releaseRef: Readonly<{ id: string; version: string; sha256: string }>,
  sessionInputSha256: string,
): Record<string, unknown> {
  return {
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    ok: true,
    requestId: submitted.requestId,
    sessionId: submitted.sessionId,
    releaseRef,
    sessionOrigin: {
      kind: "resolved-session-input-cold-start",
      sessionInputSchemaId:
        "circleheart-main-wire-resolved-session-input-v1",
      sessionInputSchemaVersion: 1,
      sessionInputSha256,
      initializationProtocolId:
        "main-wire-adult-five-wall-noncoronary-fixed-tbv-initialization-v1",
      initializationProtocolVersion: "1.0.0",
    },
    commandKind: submitted.kind,
    payload: {
      kind: "resolvedSessionCreated",
      sessionInputSha256,
      observableFrame: { releaseRef },
    },
    error: null,
  };
}

class FakeWorker {
  readonly posted: unknown[] = [];
  terminateCount = 0;
  private readonly listeners = new Map<
    string,
    Set<(event: unknown) => void>
  >();

  port(): MainWireScientificWorkerLikeV1 {
    return this as unknown as MainWireScientificWorkerLikeV1;
  }

  postMessage(message: unknown): void {
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
    for (const listener of [...(this.listeners.get("message") ?? [])]) {
      listener({ data });
    }
  }
}

function clientFor(worker: FakeWorker): MainWireScientificWorkerClientV1 {
  return new MainWireScientificWorkerClientV1({
    workerFactory: () => worker.port(),
  });
}
