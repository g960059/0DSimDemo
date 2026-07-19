import { describe, expect, it } from "vitest";

import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1,
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
    const releaseRef =
      MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.releaseRef;
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

  it("creates nine distinct document-bound sessions from ID/version-only commands", async () => {
    const kernel = new MainWireScientificInProcessKernelV1({
      maximumSessionCount: 9,
    });
    const created: Array<{
      sessionInputSha256: string;
      presetSha256: string;
      caseSha256: string;
      workspaceSha256: string;
    }> = [];

    for (const [index, entry] of
      MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.entries.entries()) {
      const command = researchDocumentCaseCommand(
        `request-research-document-${index}`,
        `session-research-document-${index}`,
        entry.presetId,
      );
      expect(Object.keys(command).sort()).toEqual([
        "kind",
        "presetId",
        "presetVersion",
        "protocolId",
        "requestId",
        "sessionId",
      ]);
      const response = await kernel.handle(command);
      expect(response).toMatchObject({
        ok: true,
        commandKind: "createResearchDocumentCaseSession",
        releaseRef:
          MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.releaseRef,
        sessionOrigin: {
          kind: "research-document-case-cold-start",
          presetId: entry.presetId,
          presetVersion: entry.presetVersion,
          classification: "research-bracket-not-clinical",
          officialTrustClaimed: false,
          clinicalDiagnosisClaimed: false,
          periodicSteadyStateClaimed: false,
          releaseRef:
            MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.releaseRef,
        },
        payload: {
          kind: "researchDocumentCaseSessionCreated",
          presetId: entry.presetId,
          presetVersion: entry.presetVersion,
          officialTrustClaimed: false,
          clinicalDiagnosisClaimed: false,
          periodicSteadyStateClaimed: false,
        },
      });
      if (
        !response.ok
        || response.payload.kind !== "researchDocumentCaseSessionCreated"
        || response.sessionOrigin.kind
          !== "research-document-case-cold-start"
      ) throw new Error("research document case was not created");

      const payload = response.payload;
      const origin = response.sessionOrigin;
      expect(payload.sessionInputSha256).toBe(origin.sessionInputSha256);
      expect(payload.presetRef).toEqual(origin.presetRef);
      expect(payload.caseRef).toEqual(origin.caseRef);
      expect(payload.workspaceRef).toEqual(origin.workspaceRef);
      expect(payload.workspaceDocument.ref).toEqual(origin.workspaceRef);
      expect(payload.workspaceDocument.content.caseDocumentRef)
        .toEqual(origin.caseRef);
      expect(payload.observableFrame.releaseRef)
        .toEqual(MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.releaseRef);
      expect({
        presetDocumentSha256: payload.presetRef.sha256,
        caseDocumentSha256: payload.caseRef.sha256,
        workspaceDocumentSha256: payload.workspaceRef.sha256,
        sessionInputSha256: payload.sessionInputSha256,
      }).toEqual(entry.documentChainBinding);
      created.push({
        sessionInputSha256: payload.sessionInputSha256,
        presetSha256: payload.presetRef.sha256,
        caseSha256: payload.caseRef.sha256,
        workspaceSha256: payload.workspaceRef.sha256,
      });
    }

    for (const field of [
      "sessionInputSha256",
      "presetSha256",
      "caseSha256",
      "workspaceSha256",
    ] as const) {
      expect(new Set(created.map((entry) => entry[field]))).toHaveLength(9);
    }

    const callerPatch = await kernel.handle({
      ...researchDocumentCaseCommand(
        "request-research-document-patch",
        "session-research-document-patch",
        "main-wire/mr-severe",
      ),
      parameterPatch: { arbitrary: true },
    });
    expect(callerPatch).toMatchObject({
      ok: false,
      error: {
        code: "invalid-command",
        message: "command fields do not match its kind",
      },
    });
  }, 120_000);

  it("fails the browser transport closed on release or document-ref forgery", async () => {
    const baseCommand = researchDocumentCaseCommand(
      "request-research-document-browser-base",
      "session-research-document-browser-base",
      "main-wire/mr-severe",
    );
    const baseResponse = await new MainWireScientificInProcessKernelV1()
      .handle(baseCommand);
    expect(baseResponse.ok).toBe(true);

    const validWorker = new FakeWorker();
    const validClient = clientFor(validWorker);
    const validPending = validClient.request(baseCommand);
    validWorker.emitMessage(structuredClone(baseResponse));
    await expect(validPending).resolves.toMatchObject({
      ok: true,
      payload: { kind: "researchDocumentCaseSessionCreated" },
    });
    validClient.terminate();

    for (const [label, forge] of [
      ["coherent-release", (response: Record<string, any>) => {
        const substituted = {
          ...response.releaseRef,
          sha256: "f".repeat(64),
        };
        response.releaseRef = substituted;
        response.sessionOrigin.releaseRef = substituted;
        response.payload.observableFrame.releaseRef = substituted;
      }],
      ["coherent-document-chain", (response: Record<string, any>) => {
        const substituted = {
          presetDocumentSha256: "1".repeat(64),
          caseDocumentSha256: "2".repeat(64),
          workspaceDocumentSha256: "3".repeat(64),
          sessionInputSha256: "4".repeat(64),
        };
        response.payload.sessionInputSha256 = substituted.sessionInputSha256;
        response.sessionOrigin.sessionInputSha256 =
          substituted.sessionInputSha256;
        response.payload.presetRef.sha256 = substituted.presetDocumentSha256;
        response.sessionOrigin.presetRef.sha256 =
          substituted.presetDocumentSha256;
        response.payload.caseRef.sha256 = substituted.caseDocumentSha256;
        response.sessionOrigin.caseRef.sha256 = substituted.caseDocumentSha256;
        response.payload.workspaceRef.sha256 =
          substituted.workspaceDocumentSha256;
        response.sessionOrigin.workspaceRef.sha256 =
          substituted.workspaceDocumentSha256;
        response.payload.workspaceDocument.ref.sha256 =
          substituted.workspaceDocumentSha256;
        response.payload.workspaceDocument.content.caseDocumentRef.sha256 =
          substituted.caseDocumentSha256;
      }],
      ["preset-ref", (response: Record<string, any>) => {
        response.payload.presetRef.sha256 = "a".repeat(64);
      }],
      ["case-ref", (response: Record<string, any>) => {
        response.sessionOrigin.caseRef.sha256 = "b".repeat(64);
      }],
      ["workspace-ref", (response: Record<string, any>) => {
        response.payload.workspaceRef.sha256 = "c".repeat(64);
      }],
      ["workspace-document-ref", (response: Record<string, any>) => {
        response.payload.workspaceDocument.ref.sha256 = "d".repeat(64);
      }],
      ["workspace-case-binding", (response: Record<string, any>) => {
        response.payload.workspaceDocument.content.caseDocumentRef.sha256 =
          "e".repeat(64);
      }],
    ] as const) {
      const command = researchDocumentCaseCommand(
        `request-research-document-forged-${label}`,
        `session-research-document-forged-${label}`,
        "main-wire/mr-severe",
      );
      const response = structuredClone(baseResponse) as Record<string, any>;
      response.requestId = command.requestId;
      response.sessionId = command.sessionId;
      forge(response);
      const worker = new FakeWorker();
      const client = clientFor(worker);
      const pending = client.request(command);
      worker.emitMessage(response);
      await expect(pending).rejects.toMatchObject({
        name: "MainWireScientificWorkerTransportErrorV1",
        code: "protocol-mismatch",
      });
      expect(client.status).toBe("failed");
      expect(worker.terminateCount).toBe(1);
    }

    const boundKernel = new MainWireScientificInProcessKernelV1();
    const boundCreateCommand = researchDocumentCaseCommand(
      "request-research-document-bound-create",
      "session-research-document-bound",
      "main-wire/mr-severe",
    );
    const boundCreateResponse = await boundKernel.handle(boundCreateCommand);
    const boundSettleCommand = Object.freeze({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "settlePeriodic" as const,
      requestId: "request-research-document-bound-settle",
      sessionId: boundCreateCommand.sessionId,
    });
    const boundSettleResponse = await boundKernel.handle(boundSettleCommand);
    expect(boundCreateResponse.ok).toBe(true);
    expect(boundSettleResponse.ok).toBe(true);

    for (const [label, forge] of [
      ["later-origin-case", (response: Record<string, any>) => {
        response.sessionOrigin.caseRef.sha256 = "7".repeat(64);
      }],
      ["later-frame-release", (response: Record<string, any>) => {
        response.payload.finalObservableFrame.releaseRef = {
          ...response.releaseRef,
          sha256: "6".repeat(64),
        };
      }],
    ] as const) {
      const worker = new FakeWorker();
      const client = clientFor(worker);
      const created = client.request(boundCreateCommand);
      worker.emitMessage(structuredClone(boundCreateResponse));
      await expect(created).resolves.toMatchObject({ ok: true });

      const settled = client.request(boundSettleCommand);
      const forged = structuredClone(boundSettleResponse) as Record<string, any>;
      forge(forged);
      worker.emitMessage(forged);
      await expect(settled).rejects.toMatchObject({
        name: "MainWireScientificWorkerTransportErrorV1",
        code: "protocol-mismatch",
      });
      expect(client.status, label).toBe("failed");
      expect(worker.terminateCount, label).toBe(1);
    }
  }, 120_000);
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

function researchDocumentCaseCommand(
  requestId: string,
  sessionId: string,
  presetId: MainWireScientificResearchPresetIdV1,
): Extract<ScientificCommandV1, {
  kind: "createResearchDocumentCaseSession";
}> {
  return Object.freeze({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind: "createResearchDocumentCaseSession" as const,
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
