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
} from "@/engine/scientific/release";
import {
  loadMainWireScientificSessionExactCheckpointV3,
  MainWireScientificSessionV1,
} from "@/engine/scientific/runtime";
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

function writeAsset(rootDir: string, relativePath: string, bytes: Buffer): void {
  const absolutePath = path.resolve(rootDir, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, bytes);
}
