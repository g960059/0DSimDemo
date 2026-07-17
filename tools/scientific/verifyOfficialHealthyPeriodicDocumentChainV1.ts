import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  loadMainWireScientificCaseDocumentV1,
  loadMainWireScientificPresetDocumentV1,
  loadMainWireScientificWorkspaceDocumentV1,
  loadOfficialHealthyPeriodicDocumentChainCatalogV1,
  OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_BINDING,
  OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_PATH,
  type MainWireScientificCaseDocumentV1,
  type MainWireScientificPresetDocumentV1,
  type MainWireScientificWorkspaceDocumentV1,
  type OfficialHealthyPeriodicDocumentChainCatalogV1,
  type OfficialScientificJsonAssetBindingV1,
} from "@/engine/scientific/documents";
import {
  canonicalJsonStringify,
  sameSimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  loadMainWireScientificSessionExactCheckpointV3,
  MainWireScientificSessionV1,
  type MainWireScientificSessionExactCheckpointV3,
} from "@/engine/scientific/runtime";

export type OfficialHealthyPeriodicDocumentChainVerificationReportV1 =
  Readonly<{
    valid: boolean;
    issues: readonly string[];
    catalogTrustAnchorMatches: boolean;
    allRawAssetBindingsMatch: boolean;
    documentChainBound: boolean;
    exactV3RestoreSucceeded: boolean;
    terminalPeriod1TrackerPreserved: boolean;
    officialTrustExternalToDocuments: boolean;
  }>;

export async function verifyOfficialHealthyPeriodicDocumentChainV1(
  rootDir = process.cwd(),
): Promise<OfficialHealthyPeriodicDocumentChainVerificationReportV1> {
  const issues: string[] = [];
  let catalog: OfficialHealthyPeriodicDocumentChainCatalogV1 | null = null;
  let catalogTrustAnchorMatches = false;
  let allRawAssetBindingsMatch = false;
  let documentChainBound = false;
  let exactV3RestoreSucceeded = false;
  let terminalPeriod1TrackerPreserved = false;
  let officialTrustExternalToDocuments = false;

  try {
    const catalogBytes = readFileSync(path.resolve(
      rootDir,
      OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_PATH,
    ));
    const rawSha256 = sha256(catalogBytes);
    catalogTrustAnchorMatches =
      catalogBytes.byteLength
        === OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_BINDING.byteLength
      && rawSha256
        === OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_BINDING
          .rawFileSha256;
    if (!catalogTrustAnchorMatches) {
      issues.push("external catalog does not match its compile-time trust anchor");
    }
    const parsed = parseCanonicalJson(catalogBytes, "external catalog");
    catalog = loadOfficialHealthyPeriodicDocumentChainCatalogV1(parsed);
  } catch (error) {
    issues.push(`external catalog: ${errorMessage(error)}`);
  }

  if (catalog !== null) {
    const target = catalog.entry.target;
    const checkpointValue = readBoundJsonAsset(
      rootDir,
      target.checkpoint,
      "V3 checkpoint",
      issues,
    );
    const presetValue = readBoundJsonAsset(
      rootDir,
      target.presetDocument,
      "preset document",
      issues,
    );
    const caseValue = readBoundJsonAsset(
      rootDir,
      target.caseDocument,
      "case document",
      issues,
    );
    const workspaceValue = readBoundJsonAsset(
      rootDir,
      target.workspaceDocument,
      "workspace document",
      issues,
    );
    allRawAssetBindingsMatch = [
      checkpointValue,
      presetValue,
      caseValue,
      workspaceValue,
    ].every((value) => value !== null);

    try {
      const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
      if (!sameSimulationReleaseRef(release.ref, catalog.entry.releaseRef)) {
        issues.push("catalog releaseRef does not match the exact current release");
      }
      if (
        checkpointValue === null
        || presetValue === null
        || caseValue === null
        || workspaceValue === null
      ) throw new Error("one or more bound target assets could not be loaded");

      const checkpoint =
        await loadMainWireScientificSessionExactCheckpointV3(
          {
            releaseRef: release.ref,
            sessionInputSha256: target.sessionInputSha256,
          },
          checkpointValue,
        );
      const presetDocument = await loadMainWireScientificPresetDocumentV1(
        release,
        presetValue,
      );
      const caseDocument = await loadMainWireScientificCaseDocumentV1(
        release,
        caseValue,
      );
      const workspaceDocument =
        await loadMainWireScientificWorkspaceDocumentV1(workspaceValue);

      assertCatalogAndChainIdentity(
        catalog,
        checkpoint,
        presetDocument,
        caseDocument,
        workspaceDocument,
      );
      documentChainBound = true;

      const forbiddenTrustKeys = new Set([
        "official",
        "officialTrust",
        "trustClass",
        "catalogVisibility",
      ]);
      const scientificDocumentKeys = [
        ...collectKeys(presetDocument),
        ...collectKeys(caseDocument),
        ...collectKeys(workspaceDocument),
      ];
      officialTrustExternalToDocuments = scientificDocumentKeys.every((key) =>
        !forbiddenTrustKeys.has(key));
      if (!officialTrustExternalToDocuments) {
        issues.push("official trust leaked into a scientific document");
      }

      const releaseText = canonicalJsonStringify(release.manifest);
      for (const asset of [
        target.checkpoint,
        target.presetDocument,
        target.caseDocument,
        target.workspaceDocument,
      ]) {
        if (
          releaseText.includes(asset.path)
          || releaseText.includes(asset.rawFileSha256)
        ) issues.push("SimulationRelease embeds an external chain asset binding");
      }

      const restored = await MainWireScientificSessionV1.restoreExactV3(
        release,
        caseDocument.content.resolvedSessionInput,
        checkpoint,
      );
      exactV3RestoreSucceeded = true;
      const roundTrip = await restored.checkpointExactV3();
      if (canonicalJsonStringify(roundTrip) !== canonicalJsonStringify(checkpoint)) {
        issues.push("generic V3 restore did not round-trip exactly");
      }
      const before = restored.stateIdentity();
      const terminal = restored.settlePeriodic();
      const after = restored.stateIdentity();
      terminalPeriod1TrackerPreserved = terminal.completed
        && terminal.status === "period1-converged"
        && terminal.periodicSteadyStateClaimed
        && !terminal.period2OrbitSuspected
        && !terminal.beatCompletedThisCall
        && terminal.completedStepCountThisCall === 0
        && terminal.completedBeatCount
          === checkpoint.periodicSettlementTracker?.completedBeatCount
        && canonicalJsonStringify(before) === canonicalJsonStringify(after);
      if (!terminalPeriod1TrackerPreserved) {
        issues.push("generic V3 restore did not preserve terminal P1 state");
      }
    } catch (error) {
      issues.push(`bound chain: ${errorMessage(error)}`);
    }
  }

  return Object.freeze({
    valid: issues.length === 0,
    issues: Object.freeze(issues),
    catalogTrustAnchorMatches,
    allRawAssetBindingsMatch,
    documentChainBound,
    exactV3RestoreSucceeded,
    terminalPeriod1TrackerPreserved,
    officialTrustExternalToDocuments,
  });
}

function assertCatalogAndChainIdentity(
  catalog: OfficialHealthyPeriodicDocumentChainCatalogV1,
  checkpoint: MainWireScientificSessionExactCheckpointV3,
  presetDocument: MainWireScientificPresetDocumentV1,
  caseDocument: MainWireScientificCaseDocumentV1,
  workspaceDocument: MainWireScientificWorkspaceDocumentV1,
): void {
  const target = catalog.entry.target;
  if (
    checkpoint.checkpointId !== target.checkpoint.checkpointId
    || checkpoint.schemaVersion !== target.checkpoint.checkpointSchemaVersion
    || checkpoint.checkpointSha256 !== target.checkpoint.checkpointSha256
    || checkpoint.sessionInputSha256 !== target.sessionInputSha256
    || presetDocument.ref.sha256 !== target.presetDocument.ref.sha256
    || caseDocument.ref.sha256 !== target.caseDocument.ref.sha256
    || workspaceDocument.ref.sha256 !== target.workspaceDocument.ref.sha256
    || caseDocument.content.lineage.sourcePresetRef?.sha256
      !== presetDocument.ref.sha256
    || caseDocument.content.startDescriptor.kind !== "exact-checkpoint-v3"
    || caseDocument.content.startDescriptor.checkpointSha256
      !== checkpoint.checkpointSha256
    || caseDocument.content.startDescriptor.sessionInputSha256
      !== checkpoint.sessionInputSha256
    || workspaceDocument.content.caseDocumentRef.sha256
      !== caseDocument.ref.sha256
  ) throw new Error("catalog, checkpoint, preset, case, or workspace identity mismatch");
}

function readBoundJsonAsset(
  rootDir: string,
  binding: OfficialScientificJsonAssetBindingV1,
  label: string,
  issues: string[],
): unknown | null {
  try {
    const bytes = readFileSync(path.resolve(rootDir, binding.path));
    if (bytes.byteLength !== binding.byteLength) {
      throw new Error("raw byte length mismatch");
    }
    if (sha256(bytes) !== binding.rawFileSha256) {
      throw new Error("raw SHA-256 mismatch");
    }
    return parseCanonicalJson(bytes, label);
  } catch (error) {
    issues.push(`${label}: ${errorMessage(error)}`);
    return null;
  }
}

function parseCanonicalJson(bytes: Buffer, label: string): unknown {
  const raw = bytes.toString("utf8");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${errorMessage(error)}`);
  }
  if (`${canonicalJsonStringify(value)}\n` !== raw) {
    throw new Error(`${label} is not deterministic canonical JSON bytes`);
  }
  return value;
}

function collectKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  if (value === null || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => [
    key,
    ...collectKeys(child),
  ]);
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const entryPath = process.argv[1];
if (entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href) {
  verifyOfficialHealthyPeriodicDocumentChainV1()
    .then((report) => {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      process.exitCode = report.valid ? 0 : 1;
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
      process.exitCode = 1;
    });
}
