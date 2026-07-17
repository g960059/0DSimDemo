import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  loadMainWireScientificCaseDocumentV1,
  OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_PATH,
} from "@/engine/scientific/documents";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
  sha256TextHex,
} from "@/engine/scientific/release";
import {
  loadMainWireScientificSessionExactCheckpointV3,
  MainWireScientificSessionV1,
} from "@/engine/scientific/runtime";
import {
  BUNDLED_OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_RAW_ASSETS_FOR_TEST_V1,
  loadBundledOfficialHealthyPeriodicDocumentChainV1,
  verifyOfficialHealthyPeriodicDocumentChainBundleAssetsV1,
} from "@/engine/scientificBrowser/bundledOfficialHealthyPeriodicDocumentChainV1";
import {
  loadBundledOfficialHealthyPeriodicWorkspaceDocumentV1,
} from "@/engine/scientificBrowser";
import {
  MainWireScientificInProcessKernelV1,
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
} from "@/engine/scientific/worker";
import {
  buildOfficialHealthyPeriodicDocumentChainV1,
} from "@/tools/scientific/officialHealthyPeriodicDocumentChainV1";
import {
  verifyOfficialHealthyPeriodicDocumentChainV1,
} from "@/tools/scientific/verifyOfficialHealthyPeriodicDocumentChainV1";

describe("official healthy periodic V3 document chain", () => {
  it("is deterministic, externally trusted, and bound through exact refs", async () => {
    const first = await buildOfficialHealthyPeriodicDocumentChainV1();
    const second = await buildOfficialHealthyPeriodicDocumentChainV1();
    const report = await verifyOfficialHealthyPeriodicDocumentChainV1();

    expect(second.bytes).toEqual(first.bytes);
    expect(report).toEqual({
      valid: true,
      issues: [],
      catalogTrustAnchorMatches: true,
      allRawAssetBindingsMatch: true,
      documentChainBound: true,
      exactV3RestoreSucceeded: true,
      terminalPeriod1TrackerPreserved: true,
      officialTrustExternalToDocuments: true,
    });
    expect(first.checkpoint).toMatchObject({
      checkpointId: "main-wire-scientific-session-exact-checkpoint-v3",
      schemaVersion: 3,
      sessionInputSha256:
        first.caseDocument.content.resolvedSessionInput.sessionInputSha256,
    });
    expect(first.caseDocument.content.startDescriptor).toEqual({
      kind: "exact-checkpoint-v3",
      checkpointId: first.checkpoint.checkpointId,
      checkpointSha256: first.checkpoint.checkpointSha256,
      releaseRef: first.checkpoint.releaseRef,
      sessionInputSha256: first.checkpoint.sessionInputSha256,
    });
    expect(first.caseDocument.content.lineage).toEqual({
      kind: "preset-instantiation",
      sourcePresetRef: first.presetDocument.ref,
      parentCaseRef: null,
    });
    expect(first.workspaceDocument.content.caseDocumentRef)
      .toEqual(first.caseDocument.ref);
  });

  it("generic V3 restore preserves the terminal P1 tracker without advancing state", async () => {
    const built = await buildOfficialHealthyPeriodicDocumentChainV1();
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const restored = await MainWireScientificSessionV1.restoreExactV3(
      release,
      built.caseDocument.content.resolvedSessionInput,
      built.checkpoint,
    );
    const before = restored.stateIdentity();
    const terminal = restored.settlePeriodic();
    const after = restored.stateIdentity();

    expect(terminal).toMatchObject({
      completed: true,
      status: "period1-converged",
      periodicSteadyStateClaimed: true,
      period2OrbitSuspected: false,
      beatCompletedThisCall: false,
      completedStepCountThisCall: 0,
      completedBeatCount:
        built.checkpoint.periodicSettlementTracker?.completedBeatCount,
    });
    expect(after).toEqual(before);
    await expect(restored.checkpointExactV3()).resolves.toEqual(
      built.checkpoint,
    );
  });

  it("rejects internally rehashed case and checkpoint identity attacks", async () => {
    const built = await buildOfficialHealthyPeriodicDocumentChainV1();
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();

    const changedCase = clone(built.caseDocument);
    changedCase.content.resolvedSessionInput.resolvedParameters
      .circulationRuntime.losses.systemicResistance += 0.1;
    const changedInput = changedCase.content.resolvedSessionInput;
    const { sessionInputSha256: _oldInputSha, ...inputPayload } = changedInput;
    changedInput.sessionInputSha256 = await sha256CanonicalJsonHex(inputPayload);
    changedCase.content.startDescriptor.sessionInputSha256 =
      changedInput.sessionInputSha256;
    changedCase.ref.sha256 = await sha256CanonicalJsonHex(changedCase.content);
    await expect(loadMainWireScientificCaseDocumentV1(
      release,
      changedCase,
    )).rejects.toThrow(/release-bound re-resolution/);

    const changedCheckpoint = clone(built.checkpoint);
    changedCheckpoint.sessionInputSha256 = "a".repeat(64);
    const { checkpointSha256: _oldCheckpointSha, ...checkpointPayload } =
      changedCheckpoint;
    changedCheckpoint.checkpointSha256 =
      await sha256CanonicalJsonHex(checkpointPayload);
    await expect(loadMainWireScientificSessionExactCheckpointV3(
      {
        releaseRef: release.ref,
        sessionInputSha256:
          built.caseDocument.content.resolvedSessionInput.sessionInputSha256,
      },
      changedCheckpoint,
    )).rejects.toThrow(/resolved session-input identity mismatch/);
  });

  it("does not transfer official trust to a coherently rehashed document chain", async () => {
    const built = await buildOfficialHealthyPeriodicDocumentChainV1();
    const tempRoot = mkdtempSync(path.join(tmpdir(), "circleheart-official-chain-"));
    try {
      const catalog = clone(built.catalog);
      const workspace = clone(built.workspaceDocument);
      workspace.content.notes = "attacker-authored but structurally valid revision";
      workspace.ref.sha256 = await sha256CanonicalJsonHex(workspace.content);
      const workspaceBytes = canonicalBytes(workspace);
      catalog.entry.target.workspaceDocument.ref = workspace.ref;
      catalog.entry.target.workspaceDocument.byteLength = workspaceBytes.byteLength;
      catalog.entry.target.workspaceDocument.rawFileSha256 = sha256(workspaceBytes);
      const catalogBytes = canonicalBytes(catalog);

      writeAsset(
        tempRoot,
        OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_PATH,
        catalogBytes,
      );
      for (const [binding, bytes] of [
        [catalog.entry.target.checkpoint, built.bytes.checkpoint],
        [catalog.entry.target.presetDocument, built.bytes.presetDocument],
        [catalog.entry.target.caseDocument, built.bytes.caseDocument],
      ] as const) writeAsset(tempRoot, binding.path, bytes);
      writeAsset(
        tempRoot,
        catalog.entry.target.workspaceDocument.path,
        workspaceBytes,
      );

      const report = await verifyOfficialHealthyPeriodicDocumentChainV1(
        tempRoot,
      );
      expect(report).toMatchObject({
        valid: false,
        catalogTrustAnchorMatches: false,
        allRawAssetBindingsMatch: true,
        documentChainBound: true,
        officialTrustExternalToDocuments: true,
      });
      expect(report.issues).toContain(
        "external catalog does not match its compile-time trust anchor",
      );
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("loads the pinned raw chain in a browser-neutral Worker adapter", async () => {
    const identity = officialIdentity();
    const loaded = await loadBundledOfficialHealthyPeriodicDocumentChainV1(
      identity,
    );
    const workspace =
      await loadBundledOfficialHealthyPeriodicWorkspaceDocumentV1(identity);

    expect(loaded).toMatchObject({
      identity,
      checkpoint: {
        schemaVersion: 3,
        checkpointSha256:
          "e63b33b17b3d62bdca417aa8315ba3046b0758c6401a3633e917b6b5114511f6",
        sessionInputSha256:
          "4c637109b4c858b4cc5755e7b0bb039bfb4dbb57fc5e1b2b156fc2f1f6e3eae1",
      },
      caseDocument: {
        ref: {
          sha256:
            "c5644512b2e2589847f6b4471794c9fbca062b68190f06fd8405002a664f7861",
        },
      },
      workspaceDocument: {
        ref: {
          sha256:
            "5faed3f4de4750cfaadd21dfd37a9b3be5f50ac669e4e99575c2e75c8f9c9bab",
        },
      },
    });
    expect(workspace.workspaceDocument).toEqual(loaded.workspaceDocument);
    expect(workspace.releaseRef).toEqual(loaded.release.ref);
    expect(workspace.provenance.caseRef).toEqual(loaded.caseDocument.ref);
    expect(workspace.workspaceDocument.content.panels.slice(0, 4)
      .map((panel) => [panel.panelId, panel.view.kind])).toEqual([
      ["la-pv", "pressure-volume"],
      ["ra-pv", "pressure-volume"],
      ["lv-pv", "pressure-volume"],
      ["rv-pv", "pressure-volume"],
    ]);
  });

  it("fails the browser raw loader on tamper and a coherently rehashed catalog", async () => {
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const assets =
      BUNDLED_OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_RAW_ASSETS_FOR_TEST_V1;
    const changedWorkspace = JSON.parse(
      assets.workspaceDocumentRawJson,
    ) as Record<string, any>;
    changedWorkspace.content.notes = "tampered presentation";
    changedWorkspace.ref.sha256 = await sha256CanonicalJsonHex(
      changedWorkspace.content,
    );
    const changedWorkspaceRaw = `${canonicalJsonStringify(changedWorkspace)}\n`;
    await expect(verifyOfficialHealthyPeriodicDocumentChainBundleAssetsV1(
      officialIdentity(),
      release,
      { ...assets, workspaceDocumentRawJson: changedWorkspaceRaw },
    )).rejects.toThrow(/workspace document raw-file/);

    const changedCatalog = JSON.parse(
      assets.catalogRawJson,
    ) as Record<string, any>;
    changedCatalog.entry.target.workspaceDocument.ref = changedWorkspace.ref;
    changedCatalog.entry.target.workspaceDocument.byteLength =
      new TextEncoder().encode(changedWorkspaceRaw).byteLength;
    changedCatalog.entry.target.workspaceDocument.rawFileSha256 =
      await sha256TextHex(changedWorkspaceRaw);
    await expect(verifyOfficialHealthyPeriodicDocumentChainBundleAssetsV1(
      officialIdentity(),
      release,
      {
        ...assets,
        catalogRawJson: `${canonicalJsonStringify(changedCatalog)}\n`,
        workspaceDocumentRawJson: changedWorkspaceRaw,
      },
    )).rejects.toThrow(/compile-time trust anchor/);
  });

  it("creates the V3 official document case through an identity-only command", async () => {
    const kernel = new MainWireScientificInProcessKernelV1({
      officialDocumentCaseLoader:
        loadBundledOfficialHealthyPeriodicDocumentChainV1,
    });
    const command = officialDocumentCaseCommand(
      "request-official-v3",
      "official-v3-session",
    );
    const created = await kernel.handle(command);
    expect(created).toMatchObject({
      ok: true,
      commandKind: "createOfficialDocumentCaseSession",
      sessionOrigin: {
        kind: "official-document-case-v3-exact-checkpoint-restore",
        checkpointSha256:
          "e63b33b17b3d62bdca417aa8315ba3046b0758c6401a3633e917b6b5114511f6",
        sessionInputSha256:
          "4c637109b4c858b4cc5755e7b0bb039bfb4dbb57fc5e1b2b156fc2f1f6e3eae1",
        caseRef: {
          sha256:
            "c5644512b2e2589847f6b4471794c9fbca062b68190f06fd8405002a664f7861",
        },
        workspaceRef: {
          sha256:
            "5faed3f4de4750cfaadd21dfd37a9b3be5f50ac669e4e99575c2e75c8f9c9bab",
        },
        periodicSteadyStateClaimed: true,
        clinicalValidationClaimed: false,
      },
      payload: {
        kind: "officialDocumentCaseSessionCreated",
        periodicSteadyStateClaimed: true,
        observableFrame: { revision: 13_000 },
      },
    });
    const terminal = await kernel.handle({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "settlePeriodic",
      requestId: "request-official-v3-p1",
      sessionId: "official-v3-session",
    });
    expect(terminal).toMatchObject({
      ok: true,
      sessionOrigin: created.sessionOrigin,
      payload: {
        status: "period1-converged",
        completedStepCountThisCall: 0,
        beatCompletedThisCall: false,
      },
    });

    const callerAssetAttempt = await kernel.handle({
      ...officialDocumentCaseCommand(
        "request-official-v3-caller-asset",
        "caller-asset-session",
      ),
      checkpoint: {},
    });
    expect(callerAssetAttempt).toMatchObject({
      ok: false,
      error: { code: "invalid-command" },
    });

    const v2CommandWithoutV2Loader = await kernel.handle({
      ...officialDocumentCaseCommand(
        "request-retained-v2-separate",
        "retained-v2-session",
      ),
      kind: "createOfficialPresetSession",
    });
    expect(v2CommandWithoutV2Loader).toMatchObject({
      ok: false,
      commandKind: "createOfficialPresetSession",
      error: { code: "capability-unavailable" },
    });
  });
});

function clone<T>(value: T): any {
  return JSON.parse(JSON.stringify(value));
}

function canonicalBytes(value: unknown): Buffer {
  return Buffer.from(`${canonicalJsonStringify(value)}\n`, "utf8");
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function officialIdentity() {
  return Object.freeze({
    presetId: "circleheart/official-healthy-periodic" as const,
    presetVersion: "1.0.0" as const,
  });
}

function officialDocumentCaseCommand(requestId: string, sessionId: string) {
  return Object.freeze({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind: "createOfficialDocumentCaseSession" as const,
    requestId,
    sessionId,
    ...officialIdentity(),
  });
}

function writeAsset(rootDir: string, relativePath: string, bytes: Buffer): void {
  const absolutePath = path.resolve(rootDir, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, bytes);
}
