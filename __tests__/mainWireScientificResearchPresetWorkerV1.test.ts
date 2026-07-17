import { describe, expect, it } from "vitest";

import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1_SCHEMA_ID,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION,
  type MainWireScientificResearchPresetIdV1,
} from "@/engine/scientific/presets/mainWireScientificResearchPresetCatalogV1";
import {
  MainWireScientificInProcessKernelV1,
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificCommandV1,
} from "@/engine/scientific/worker";
import {
  MainWireScientificWorkerClientV1,
  type MainWireScientificWorkerLikeV1,
} from "@/engine/scientificBrowser";

describe("main-wire scientific research preset Worker V1", () => {
  it("creates healthy and MR research brackets as distinct cold sessions", async () => {
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const kernel = new MainWireScientificInProcessKernelV1({
      maximumSessionCount: 2,
    });
    expect(kernel.claim).toMatchObject({
      researchPresetCapability:
        "built-in-catalog-id-version-only-cold-start",
      researchPresetOfficialTrustClaimed: false,
      researchPresetClinicalDiagnosisClaimed: false,
      researchPresetPeriodicSteadyStateClaimedAtCreation: false,
      researchPresetArbitraryParameterPatchAccepted: false,
      silentFallbackApplied: false,
      legacyBackendFallbackAvailable: false,
    });

    const healthy = await kernel.handle(researchPresetCommand(
      "request-research-healthy",
      "session-research-healthy",
      "main-wire/healthy-cold",
    ));
    expect(healthy).toMatchObject({
      ok: true,
      commandKind: "createResearchPresetSession",
      releaseRef: release.ref,
      sessionOrigin: {
        kind: "research-preset-cold-start",
        presetId: "main-wire/healthy-cold",
        presetVersion: "1.0.0",
        catalogSchemaId:
          MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1_SCHEMA_ID,
        catalogSchemaVersion: 1,
        classification: "research-bracket-not-clinical",
        officialTrustClaimed: false,
        clinicalDiagnosisClaimed: false,
        periodicSteadyStateClaimed: false,
        releaseRef: release.ref,
        sessionInputSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        initializationProtocolVersion: "1.0.0",
      },
      payload: {
        kind: "researchPresetSessionCreated",
        presetId: "main-wire/healthy-cold",
        presetVersion: "1.0.0",
        classification: "research-bracket-not-clinical",
        officialTrustClaimed: false,
        clinicalDiagnosisClaimed: false,
        periodicSteadyStateClaimed: false,
        sessionInputSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        observableFrame: {
          revision: 0,
          acceptedTimeSec: 0,
          releaseRef: release.ref,
        },
      },
      error: null,
    });
    expect(healthy.ok).toBe(true);
    if (!healthy.ok) throw new Error("healthy research preset was rejected");
    expect(healthy.payload.kind).toBe("researchPresetSessionCreated");
    if (healthy.payload.kind !== "researchPresetSessionCreated") {
      throw new Error("unexpected healthy payload kind");
    }
    expect(healthy.sessionOrigin.kind).toBe("research-preset-cold-start");
    if (healthy.sessionOrigin.kind !== "research-preset-cold-start") {
      throw new Error("unexpected healthy origin kind");
    }
    expect(healthy.payload.sessionInputSha256)
      .toBe(healthy.sessionOrigin.sessionInputSha256);

    const mr = await kernel.handle(researchPresetCommand(
      "request-research-mr",
      "session-research-mr",
      "main-wire/mr-severe",
    ));
    expect(mr).toMatchObject({
      ok: true,
      commandKind: "createResearchPresetSession",
      releaseRef: release.ref,
      sessionOrigin: {
        kind: "research-preset-cold-start",
        presetId: "main-wire/mr-severe",
        periodicSteadyStateClaimed: false,
        releaseRef: release.ref,
      },
      payload: {
        kind: "researchPresetSessionCreated",
        presetId: "main-wire/mr-severe",
        periodicSteadyStateClaimed: false,
      },
    });
    expect(mr.ok).toBe(true);
    if (!mr.ok || mr.payload.kind !== "researchPresetSessionCreated") {
      throw new Error("MR research preset was rejected");
    }
    expect(mr.payload.sessionInputSha256)
      .not.toBe(healthy.payload.sessionInputSha256);
    expect(kernel.activeSessionCount()).toBe(2);
    expect(structuredClone(mr)).toEqual(mr);
  }, 120_000);

  it("rejects unknown versions, unknown IDs, and every extra patch field", async () => {
    const kernel = new MainWireScientificInProcessKernelV1();
    const unsupportedVersion = await kernel.handle({
      ...researchPresetCommand(
        "request-research-version",
        "session-research-version",
        "main-wire/healthy-cold",
      ),
      presetVersion: "1.0.1",
    });
    expect(unsupportedVersion).toMatchObject({
      ok: false,
      commandKind: "createResearchPresetSession",
      error: {
        code: "invalid-command",
        message: "presetVersion is not present in the research catalog",
        silentFallbackApplied: false,
      },
    });

    const unsupportedId = await kernel.handle({
      ...researchPresetCommand(
        "request-research-id",
        "session-research-id",
        "main-wire/healthy-cold",
      ),
      presetId: "main-wire/healthy",
    });
    expect(unsupportedId).toMatchObject({
      ok: false,
      error: {
        code: "invalid-command",
        message: "presetId is not present in the research catalog",
      },
    });

    const arbitraryPatch = await kernel.handle({
      ...researchPresetCommand(
        "request-research-patch",
        "session-research-patch",
        "main-wire/mr-severe",
      ),
      parameterPatches: [{ path: "circulation.valvePreset", value: {} }],
    });
    expect(arbitraryPatch).toMatchObject({
      ok: false,
      error: {
        code: "invalid-command",
        message: "command fields do not match its kind",
      },
    });
    expect(kernel.activeSessionCount()).toBe(0);
  });

  it("binds browser responses across preset, release, input SHA, and claims", async () => {
    const releaseRef = Object.freeze({
      id: "circleheart/adult-five-wall-noncoronary",
      version: "0.2.0",
      sha256: "7".repeat(64),
    });
    const sessionInputSha256 = "a".repeat(64);
    const submitted = researchPresetCommand(
      "request-browser-research",
      "session-browser-research",
      "main-wire/mr-severe",
    );
    const worker = new FakeWorker();
    const client = clientFor(worker);
    const pending = client.request(submitted);
    expect(worker.posted).toEqual([submitted]);
    worker.emitMessage(researchPresetSuccessResponse(
      submitted,
      releaseRef,
      sessionInputSha256,
    ));
    await expect(pending).resolves.toMatchObject({
      ok: true,
      releaseRef,
      sessionOrigin: {
        kind: "research-preset-cold-start",
        presetId: "main-wire/mr-severe",
        releaseRef,
        sessionInputSha256,
        officialTrustClaimed: false,
        clinicalDiagnosisClaimed: false,
        periodicSteadyStateClaimed: false,
      },
      payload: {
        kind: "researchPresetSessionCreated",
        sessionInputSha256,
      },
    });
    expect(client.status).toBe("open");
    client.terminate();

    for (const [label, forge] of [
      ["input-sha", (response: Record<string, any>) => {
        response.payload.sessionInputSha256 = "b".repeat(64);
      }],
      ["origin-release", (response: Record<string, any>) => {
        response.sessionOrigin.releaseRef = {
          ...releaseRef,
          sha256: "8".repeat(64),
        };
      }],
      ["response-release", (response: Record<string, any>) => {
        response.releaseRef = {
          ...releaseRef,
          sha256: "8".repeat(64),
        };
      }],
      ["clinical-claim", (response: Record<string, any>) => {
        response.payload.clinicalDiagnosisClaimed = true;
      }],
    ] as const) {
      const forgedWorker = new FakeWorker();
      const forgedClient = clientFor(forgedWorker);
      const forgedCommand = researchPresetCommand(
        `request-forged-${label}`,
        `session-forged-${label}`,
        "main-wire/mr-severe",
      );
      const forgedPending = forgedClient.request(forgedCommand);
      const response = researchPresetSuccessResponse(
        forgedCommand,
        releaseRef,
        sessionInputSha256,
      );
      forge(response);
      forgedWorker.emitMessage(response);
      await expect(forgedPending).rejects.toMatchObject({
        name: "MainWireScientificWorkerTransportErrorV1",
        code: "protocol-mismatch",
      });
      expect(forgedClient.status).toBe("failed");
      expect(forgedWorker.terminateCount).toBe(1);
    }
  });
});

function researchPresetCommand(
  requestId: string,
  sessionId: string,
  presetId: MainWireScientificResearchPresetIdV1,
): Extract<ScientificCommandV1, { kind: "createResearchPresetSession" }> {
  return Object.freeze({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind: "createResearchPresetSession" as const,
    requestId,
    sessionId,
    presetId,
    presetVersion: MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION,
  });
}

function researchPresetSuccessResponse(
  submitted: Extract<ScientificCommandV1, {
    kind: "createResearchPresetSession";
  }>,
  releaseRef: Readonly<{ id: string; version: string; sha256: string }>,
  sessionInputSha256: string,
): Record<string, any> {
  return {
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    ok: true,
    requestId: submitted.requestId,
    sessionId: submitted.sessionId,
    releaseRef,
    sessionOrigin: {
      kind: "research-preset-cold-start",
      presetId: submitted.presetId,
      presetVersion: submitted.presetVersion,
      catalogSchemaId:
        MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1_SCHEMA_ID,
      catalogSchemaVersion: 1,
      classification: "research-bracket-not-clinical",
      officialTrustClaimed: false,
      clinicalDiagnosisClaimed: false,
      periodicSteadyStateClaimed: false,
      releaseRef,
      sessionInputSha256,
      initializationProtocolId:
        "main-wire-normal-adult-five-wall-fixed-tbv-cold-initialization-v1",
      initializationProtocolVersion: "1.0.0",
    },
    commandKind: submitted.kind,
    payload: {
      kind: "researchPresetSessionCreated",
      presetId: submitted.presetId,
      presetVersion: submitted.presetVersion,
      classification: "research-bracket-not-clinical",
      officialTrustClaimed: false,
      clinicalDiagnosisClaimed: false,
      periodicSteadyStateClaimed: false,
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
    for (const listener of this.listeners.get("message") ?? []) {
      listener({ data } as MessageEvent<unknown>);
    }
  }
}

function clientFor(worker: FakeWorker): MainWireScientificWorkerClientV1 {
  return new MainWireScientificWorkerClientV1({
    workerFactory: () => worker.port(),
  });
}
