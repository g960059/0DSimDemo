import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  loadOfficialHealthyPeriodicCheckpointPresetDocumentV1,
  loadOfficialScientificPresetCatalogV1,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_MANIFEST_PATH,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_V1_ASSET_PATH,
  OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_PATH,
} from "@/engine/scientific/presets";
import {
  verifyOfficialHealthyPeriodicCheckpointPresetV1,
} from "@/tools/scientific/verifyOfficialHealthyPeriodicCheckpointPresetV1";

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(path.resolve(relativePath), "utf8"));
}

describe("official healthy periodic exact-checkpoint preset V1", () => {
  it("verifies the one-way catalog -> preset -> checkpoint -> release chain", async () => {
    const report = await verifyOfficialHealthyPeriodicCheckpointPresetV1();

    expect(report).toEqual({
      valid: true,
      issues: [],
      presetId: "circleheart/official-healthy-periodic",
      releaseRefMatches: true,
      manifestRawFileSha256Matches: true,
      rawFileSha256Matches: true,
      exactRestoreSucceeded: true,
      terminalPeriod1Confirmed: true,
      checkpointByteLength: 20_752,
    });
  });

  it("pins the bounded 26-beat P1 evidence and exact tracker continuation", () => {
    const catalog = loadOfficialScientificPresetCatalogV1(
      readJson(OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_PATH),
    );
    const document = loadOfficialHealthyPeriodicCheckpointPresetDocumentV1(
      readJson(OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_MANIFEST_PATH),
    );
    const checkpoint = readJson(
      OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_V1_ASSET_PATH,
    ) as Record<string, any>;

    expect(catalog.entries[0]).toMatchObject({
      presetId: document.preset.id,
      presetVersion: document.preset.version,
      manifest: {
        path: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_MANIFEST_PATH,
        byteLength: 4_263,
        rawFileSha256:
          "4bd772f1df329d56502954d88e4e276e643d8b150368480f38af242a8eefbce8",
      },
    });
    expect(document).toMatchObject({
      releaseRef: checkpoint.releaseRef,
      parameterDocument: {
        fixedCanonicalParameterizationOnly: true,
        independentParameterOverridesApplied: false,
      },
      protocol: {
        result: {
          status: "period1-converged",
          completedBeatCount: 26,
          evidenceBeatIndices: [24, 25, 26],
          terminalRevision: 13_000,
        },
      },
      initialization: {
        kind: "exact-checkpoint",
        compatibility: "identical-full-simulation-release-ref-only",
        semanticReresolutionAllowed: false,
        warmStart: false,
        periodicTrackerIncluded: true,
        checkpoint: {
          path: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_V1_ASSET_PATH,
          rawFileSha256:
            "e00e1b6b4507f3b9bec6f8eaebfe5f3fc79b41c7bb97ae7eb74f24bc3754a3d4",
          checkpointEnvelopeSha256: checkpoint.checkpointSha256,
        },
      },
      claims: {
        numericalPeriod1ClassificationOnly: true,
        fixedCanonicalParameterizationOnly: true,
        diseasePresetGeneralizationAllowed: false,
        parameterizedCheckpointRequiresV3SessionInputSha256Binding: true,
        clinicalValidationClaimed: false,
        patientSpecificFitClaimed: false,
      },
    });
    expect(checkpoint.periodicSettlementTracker).toMatchObject({
      completedBeatCount: 26,
      boundaryTransactions: expect.arrayContaining([
        expect.objectContaining({ revision: 13_000 }),
      ]),
    });
    expect(checkpoint.periodicSettlementTracker.boundaryTransactions).toHaveLength(5);
  });

  it("rejects self-digests and V2 disease-preset generalization", () => {
    const catalog = readJson(
      OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_PATH,
    ) as Record<string, unknown>;
    const withSelfDigest = structuredClone(catalog);
    withSelfDigest.selfSha256 = "0".repeat(64);
    expect(() => loadOfficialScientificPresetCatalogV1(withSelfDigest))
      .toThrow(/exactly keys/);

    const document = readJson(
      OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_MANIFEST_PATH,
    ) as Record<string, any>;
    const generalized = structuredClone(document);
    generalized.claims.diseasePresetGeneralizationAllowed = true;
    generalized.parameterDocument.fixedCanonicalParameterizationOnly = false;
    expect(() => loadOfficialHealthyPeriodicCheckpointPresetDocumentV1(
      generalized,
    )).toThrow(/unsupported/);
  });
});
