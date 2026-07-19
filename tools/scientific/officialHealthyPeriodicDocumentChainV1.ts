import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V1_ID,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  createMainWireScientificCaseDocumentV1,
  createMainWireScientificDefaultWorkspaceDocumentV1,
  createMainWireScientificPresetDocumentV1,
  loadMainWireScientificCaseDocumentV1,
  loadMainWireScientificPresetDocumentV1,
  loadMainWireScientificWorkspaceDocumentV1,
  loadOfficialHealthyPeriodicDocumentChainCatalogV1,
  OFFICIAL_HEALTHY_PERIODIC_CASE_DOCUMENT_V1_PATH,
  OFFICIAL_HEALTHY_PERIODIC_PRESET_DOCUMENT_V1_PATH,
  OFFICIAL_HEALTHY_PERIODIC_V3_CHECKPOINT_PATH,
  OFFICIAL_HEALTHY_PERIODIC_WORKSPACE_DOCUMENT_V1_PATH,
  type MainWireScientificCaseDocumentV1,
  type MainWireScientificPresetDocumentV1,
  type MainWireScientificWorkspaceDocumentV1,
  type OfficialHealthyPeriodicDocumentChainCatalogV1,
  type OfficialScientificJsonAssetBindingV1,
} from "@/engine/scientific/documents";
import {
  mainWireScientificSessionIntentV1,
  resolveMainWireScientificSessionInputV1,
  type MainWireScientificResolvedSessionInputV1,
} from "@/engine/scientific/inputs";
import {
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_MANIFEST_PATH,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_V1_ASSET_PATH,
  OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_PATH,
  verifyOfficialHealthyPeriodicPresetBundleAssetsV1,
} from "@/engine/scientific/presets";
import {
  canonicalJsonStringify,
  sameSimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  MainWireScientificSessionV1,
  type MainWireScientificPeriodicSettlementResultV1,
  type MainWireScientificSessionExactCheckpointV3,
} from "@/engine/scientific/runtime";

export type BuiltOfficialHealthyPeriodicDocumentChainV1 = Readonly<{
  catalog: OfficialHealthyPeriodicDocumentChainCatalogV1;
  checkpoint: MainWireScientificSessionExactCheckpointV3;
  presetDocument: MainWireScientificPresetDocumentV1;
  caseDocument: MainWireScientificCaseDocumentV1;
  workspaceDocument: MainWireScientificWorkspaceDocumentV1;
  bytes: Readonly<{
    catalog: Buffer;
    checkpoint: Buffer;
    presetDocument: Buffer;
    caseDocument: Buffer;
    workspaceDocument: Buffer;
  }>;
}>;

/**
 * Promotes the already pinned canonical healthy V2 state by actual exact
 * restore and V3 serialization. No V2 field is relabeled, and official trust
 * is emitted only in the separate application catalog.
 */
export async function buildOfficialHealthyPeriodicDocumentChainV1(
  rootDir = process.cwd(),
): Promise<BuiltOfficialHealthyPeriodicDocumentChainV1> {
  const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
  const source = await verifyOfficialHealthyPeriodicPresetBundleAssetsV1(
    {
      presetId: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID,
      presetVersion: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION,
    },
    release,
    {
      catalogRawJson: readUtf8(rootDir, OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_PATH),
      presetRawJson: readUtf8(
        rootDir,
        OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_MANIFEST_PATH,
      ),
      checkpointRawJson: readUtf8(
        rootDir,
        OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_V1_ASSET_PATH,
      ),
    },
  );

  const healthyIntent = mainWireScientificSessionIntentV1(release.ref);
  const sessionInput = await resolveMainWireScientificSessionInputV1(
    release,
    healthyIntent,
  );
  const legacySession =
    await MainWireScientificSessionV1.restoreLegacyCanonicalExactV2(
      release,
      source.checkpoint,
    );
  if (legacySession.sessionInputSha256 !== sessionInput.sessionInputSha256) {
    throw new Error("legacy healthy restore resolved a different session input");
  }
  assertTerminalPeriod1Preserved(
    legacySession,
    source.presetDocument.protocol.result.completedBeatCount,
    source.presetDocument.protocol.result.latestPeriod1MaximumNormalizedDelta,
  );

  const checkpoint = await legacySession.checkpointExactV3();
  if (
    canonicalJsonStringify(checkpoint.periodicSettlementTracker)
      !== canonicalJsonStringify(source.checkpoint.periodicSettlementTracker)
  ) throw new Error("V2-to-V3 promotion changed the periodic tracker payload");

  const restoredV3 = await MainWireScientificSessionV1.restoreExactV3(
    release,
    sessionInput,
    checkpoint,
  );
  assertTerminalPeriod1Preserved(
    restoredV3,
    source.presetDocument.protocol.result.completedBeatCount,
    source.presetDocument.protocol.result.latestPeriod1MaximumNormalizedDelta,
  );
  const roundTrip = await restoredV3.checkpointExactV3();
  if (canonicalJsonStringify(roundTrip) !== canonicalJsonStringify(checkpoint)) {
    throw new Error("generic V3 restore did not round-trip the promoted checkpoint");
  }

  const presetDocument = await createMainWireScientificPresetDocumentV1(
    release,
    healthyIntent,
  );
  const approvedProtocol = release.manifest.approvedProtocols.find((candidate) =>
    candidate.protocolId
      === MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V1_ID);
  if (approvedProtocol === undefined) {
    throw new Error("release does not approve the healthy periodic protocol");
  }
  const caseDocument = await createMainWireScientificCaseDocumentV1(
    release,
    {
      sourceIntent: healthyIntent,
      resolvedSessionInput: sessionInput,
      protocolDescriptor: {
        protocolId: approvedProtocol.protocolId,
        protocolVersion: approvedProtocol.protocolVersion,
      },
      startDescriptor: {
        kind: "exact-checkpoint-v3",
        checkpointId: checkpoint.checkpointId,
        checkpointSha256: checkpoint.checkpointSha256,
        releaseRef: checkpoint.releaseRef,
        sessionInputSha256: checkpoint.sessionInputSha256,
      },
      lineage: {
        kind: "preset-instantiation",
        sourcePresetRef: presetDocument.ref,
        parentCaseRef: null,
      },
    },
  );
  const workspaceDocument =
    await createMainWireScientificDefaultWorkspaceDocumentV1(caseDocument);

  await verifyDocumentChain(
    release,
    sessionInput,
    checkpoint,
    presetDocument,
    caseDocument,
    workspaceDocument,
  );

  const checkpointBytes = canonicalBytes(checkpoint);
  const presetBytes = canonicalBytes(presetDocument);
  const caseBytes = canonicalBytes(caseDocument);
  const workspaceBytes = canonicalBytes(workspaceDocument);
  const catalog = loadOfficialHealthyPeriodicDocumentChainCatalogV1({
    schema: {
      id: "circleheart-official-scientific-document-chain-catalog-v1",
      version: 1,
    },
    entry: {
      presetId: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID,
      presetVersion: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION,
      trustClass: "application-catalog-official-pinned",
      releaseRef: release.ref,
      source: {
        checkpointId: source.checkpoint.checkpointId,
        checkpointSchemaVersion: source.checkpoint.schemaVersion,
        checkpointSha256: source.checkpoint.checkpointSha256,
      },
      target: {
        sessionInputSha256: sessionInput.sessionInputSha256,
        checkpoint: {
          ...jsonAssetBinding(
            OFFICIAL_HEALTHY_PERIODIC_V3_CHECKPOINT_PATH,
            checkpointBytes,
          ),
          checkpointId: checkpoint.checkpointId,
          checkpointSchemaVersion: checkpoint.schemaVersion,
          checkpointSha256: checkpoint.checkpointSha256,
        },
        presetDocument: {
          ...jsonAssetBinding(
            OFFICIAL_HEALTHY_PERIODIC_PRESET_DOCUMENT_V1_PATH,
            presetBytes,
          ),
          ref: presetDocument.ref,
        },
        caseDocument: {
          ...jsonAssetBinding(
            OFFICIAL_HEALTHY_PERIODIC_CASE_DOCUMENT_V1_PATH,
            caseBytes,
          ),
          ref: caseDocument.ref,
        },
        workspaceDocument: {
          ...jsonAssetBinding(
            OFFICIAL_HEALTHY_PERIODIC_WORKSPACE_DOCUMENT_V1_PATH,
            workspaceBytes,
          ),
          ref: workspaceDocument.ref,
        },
      },
      claims: {
        officialTrustExternalToScientificDocuments: true,
        sourceV2VerifiedBeforePromotion: true,
        sourceV2EnvelopeRelabeledAsV3: false,
        promotedViaExactRestoreAndV3Serialization: true,
        terminalPeriod1TrackerPreserved: true,
        clinicalValidationClaimed: false,
        patientSpecificFitClaimed: false,
      },
    },
  });

  return Object.freeze({
    catalog,
    checkpoint,
    presetDocument,
    caseDocument,
    workspaceDocument,
    bytes: Object.freeze({
      catalog: canonicalBytes(catalog),
      checkpoint: checkpointBytes,
      presetDocument: presetBytes,
      caseDocument: caseBytes,
      workspaceDocument: workspaceBytes,
    }),
  });
}

function assertTerminalPeriod1Preserved(
  session: MainWireScientificSessionV1,
  expectedBeatCount: number,
  expectedPeriod1Delta: number,
): void {
  const before = session.stateIdentity();
  const terminal: MainWireScientificPeriodicSettlementResultV1 =
    session.settlePeriodic();
  const after = session.stateIdentity();
  if (
    !terminal.completed
    || terminal.status !== "period1-converged"
    || !terminal.periodicSteadyStateClaimed
    || terminal.period2OrbitSuspected
    || terminal.beatCompletedThisCall
    || terminal.completedStepCountThisCall !== 0
    || terminal.completedBeatCount !== expectedBeatCount
    || terminal.periodicity.latestPeriod1MaximumNormalizedDelta
      !== expectedPeriod1Delta
    || canonicalJsonStringify(before) !== canonicalJsonStringify(after)
  ) throw new Error("exact restore did not preserve the terminal P1 tracker");
}

async function verifyDocumentChain(
  release: Awaited<ReturnType<
    typeof loadMainWireAdultFiveWallNonCoronaryReleaseV1
  >>,
  sessionInput: MainWireScientificResolvedSessionInputV1,
  checkpoint: MainWireScientificSessionExactCheckpointV3,
  presetDocument: MainWireScientificPresetDocumentV1,
  caseDocument: MainWireScientificCaseDocumentV1,
  workspaceDocument: MainWireScientificWorkspaceDocumentV1,
): Promise<void> {
  const verifiedPreset = await loadMainWireScientificPresetDocumentV1(
    release,
    presetDocument,
  );
  const verifiedCase = await loadMainWireScientificCaseDocumentV1(
    release,
    caseDocument,
  );
  const verifiedWorkspace =
    await loadMainWireScientificWorkspaceDocumentV1(workspaceDocument);
  if (
    !sameSimulationReleaseRef(release.ref, checkpoint.releaseRef)
    || checkpoint.sessionInputSha256 !== sessionInput.sessionInputSha256
    || verifiedCase.content.startDescriptor.kind !== "exact-checkpoint-v3"
    || verifiedCase.content.startDescriptor.checkpointSha256
      !== checkpoint.checkpointSha256
    || verifiedCase.content.lineage.sourcePresetRef?.sha256
      !== verifiedPreset.ref.sha256
    || verifiedWorkspace.content.caseDocumentRef.sha256
      !== verifiedCase.ref.sha256
  ) throw new Error("official healthy document chain identity drifted");
}

function jsonAssetBinding(
  assetPath: string,
  bytes: Buffer,
): OfficialScientificJsonAssetBindingV1 {
  return Object.freeze({
    path: assetPath,
    mediaType: "application/json" as const,
    byteLength: bytes.byteLength,
    rawFileSha256: createHash("sha256").update(bytes).digest("hex"),
    rawFileDigestSemantics: "raw-file-bytes-sha256" as const,
  });
}

function canonicalBytes(value: unknown): Buffer {
  return Buffer.from(`${canonicalJsonStringify(value)}\n`, "utf8");
}

function readUtf8(rootDir: string, relativePath: string): string {
  return readFileSync(path.resolve(rootDir, relativePath), "utf8");
}
