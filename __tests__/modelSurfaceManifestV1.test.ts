import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1,
} from "@/engine/myocardium/MainWireIntegratedScientificWorkerProtocolV1";
import {
  createIntegratedV3LaneDescriptorV1,
} from "@/engine/myocardium/MainWireIntegratedLaneIdentityV1";
import {
  catalogContentSha256V1,
  loadCatalogDocumentV1,
  type CatalogDocumentV1,
} from "@/engine/modelSurface/v1/CatalogRefV1";
import {
  loadAvailabilityV1,
} from "@/engine/modelSurface/v1/CapabilityStageV1";
import {
  assertPublishedBindingEvolutionV1,
  modelSpecificBindingIdV1,
  type ModelSpecificBindingV1,
} from "@/engine/modelSurface/v1/ModelSurfaceBindingV1";
import {
  MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MANIFEST_REF_V1,
  loadMainWireIntegratedV3ModelSurfaceManifestV1,
} from "@/engine/modelSurface/v1/MainWireIntegratedV3ModelSurfaceManifestArtifactV1";
import {
  buildMainWireIntegratedV3ModelSurfacePackageV1,
  MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MANIFEST_V1_ID,
  MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MODEL_REF_V1,
} from "@/engine/modelSurface/v1/MainWireIntegratedV3ModelSurfaceManifestV1";
import {
  resolveModelSurfaceManifestV1,
} from "@/engine/modelSurface/v1/ModelSurfaceManifestV1";
import {
  loadModelSurfaceMigrationV1,
} from "@/engine/modelSurface/v1/ModelSurfaceMigrationV1";
import {
  sha256CanonicalJsonHex,
  type CanonicalJsonObject,
} from "@/engine/scientific/release";
import {
  MAIN_WIRE_INTEGRATED_V3_LANE_DESCRIPTOR_V1,
} from "@/studio/adapters/mainWire/MainWireIntegratedV3LiveLaneDriverV1";

const PINNED_MANIFEST_SHA256 =
  "acd594c85eb244fd7a5102ec83cf72655562aa775593b06fa00cf0f0e9d9189b";

describe("model surface manifest V1", () => {
  it("pins the generated manifest and attaches its ref outside the Worker payload", async () => {
    const [generated, rebuilt] = await Promise.all([
      loadMainWireIntegratedV3ModelSurfaceManifestV1(),
      buildMainWireIntegratedV3ModelSurfacePackageV1(),
    ]);

    expect(generated.manifestRef.contentSha256)
      .toBe(PINNED_MANIFEST_SHA256);
    expect(await sha256CanonicalJsonHex(generated.manifest))
      .toBe(PINNED_MANIFEST_SHA256);
    expect(rebuilt.ref).toEqual(generated.manifestRef);
    expect(rebuilt.manifest).toEqual(generated.manifest);
    expect(rebuilt.catalogs).toEqual(generated.catalogs);
    expect(generated.catalogs).toHaveLength(6);
    expect(
      MAIN_WIRE_INTEGRATED_V3_LANE_DESCRIPTOR_V1
        .modelSurfaceManifestRef,
    ).toEqual(MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MANIFEST_REF_V1);

    const workerDescriptor = createIntegratedV3LaneDescriptorV1(
      MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1.releaseRef,
      MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1
        .observableCatalogSha256,
    );
    expect(workerDescriptor).not.toHaveProperty("modelSurfaceManifestRef");
  });

  it("hashes the full normative envelope and excludes only explicit metadata", async () => {
    const modelSurfacePackage =
      await buildMainWireIntegratedV3ModelSurfacePackageV1();
    const original = modelSurfacePackage.catalogs[1];
    const withDifferentMetadata = {
      ...original,
      metadata: {
        debugSourcePaths: { probe: "some/refactored/internal/path" },
        buildTimestamp: "2099-12-31T23:59:59.000Z",
        humanComments: ["A changed human comment."],
        localeStrings: {
          ja: { title: "表示用文字列" },
        },
      },
    } satisfies CatalogDocumentV1;
    const withDifferentNormativeContent = {
      ...original,
      content: {
        ...(original.content as CanonicalJsonObject),
        interpretationBoundary: "A changed normative boundary.",
      },
    } satisfies CatalogDocumentV1;

    expect(await catalogContentSha256V1(withDifferentMetadata))
      .toBe(await catalogContentSha256V1(original));
    expect(await catalogContentSha256V1(withDifferentNormativeContent))
      .not.toBe(await catalogContentSha256V1(original));
  });

  it("rejects an unknown catalog instead of resolving a partial surface", async () => {
    const modelSurfacePackage =
      await buildMainWireIntegratedV3ModelSurfacePackageV1();
    const manifest = {
      ...modelSurfacePackage.manifest,
      topologyManifest: {
        ...modelSurfacePackage.manifest.topologyManifest,
        catalogId: "unknown.topology.catalog",
      },
    };

    await expect(resolveMutatedManifestV1(
      modelSurfacePackage.catalogs,
      manifest,
    )).rejects.toMatchObject({ code: "unknown-catalog" });
  });

  it("rejects a catalog whose schema or content digest mismatches its ref", async () => {
    const modelSurfacePackage =
      await buildMainWireIntegratedV3ModelSurfacePackageV1();
    const manifest = {
      ...modelSurfacePackage.manifest,
      topologyManifest: {
        ...modelSurfacePackage.manifest.topologyManifest,
        contentSha256: "0".repeat(64),
      },
    };

    await expect(resolveMutatedManifestV1(
      modelSurfacePackage.catalogs,
      manifest,
    )).rejects.toMatchObject({ code: "catalog-ref-mismatch" });
  });

  it("fails closed when the requested model identity differs", async () => {
    const modelSurfacePackage =
      await buildMainWireIntegratedV3ModelSurfacePackageV1();

    await expect(resolveModelSurfaceManifestV1({
      manifestId: MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MANIFEST_V1_ID,
      manifestRef: modelSurfacePackage.ref,
      manifest: modelSurfacePackage.manifest,
      catalogs: modelSurfacePackage.catalogs,
      expectedModelRef: {
        ...MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MODEL_REF_V1,
        modelContentSha256: "1".repeat(64),
      },
    })).rejects.toMatchObject({ code: "model-identity-mismatch" });
  });

  it("fails closed when a catalog belongs to a different model identity", async () => {
    const modelSurfacePackage =
      await buildMainWireIntegratedV3ModelSurfacePackageV1();
    const catalogs = modelSurfacePackage.catalogs.map((catalog, index) =>
      index === 0
        ? {
            ...catalog,
            modelRef: {
              ...catalog.modelRef,
              modelContentSha256: "2".repeat(64),
            },
          }
        : catalog);

    await expect(resolveModelSurfaceManifestV1({
      manifestId: MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MANIFEST_V1_ID,
      manifestRef: modelSurfacePackage.ref,
      manifest: modelSurfacePackage.manifest,
      catalogs,
      expectedModelRef:
        MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MODEL_REF_V1,
    })).rejects.toMatchObject({
      code: "model-catalog-identity-mismatch",
    });
  });

  it("rejects unknown envelope fields and unavailable zero substitutes", async () => {
    const modelSurfacePackage =
      await buildMainWireIntegratedV3ModelSurfacePackageV1();
    expect(() => loadCatalogDocumentV1({
      ...modelSurfacePackage.catalogs[0],
      implementationSourcePath: "must-not-be-a-normative-field",
    })).toThrow(/unknown field implementationSourcePath/);
    expect(() => loadAvailabilityV1({
      status: "not-wired",
      reasonCode: "probe",
      explanation: "",
    })).toThrow(/explanation must be a non-empty string/);
    expect(loadAvailabilityV1({ status: "available" }))
      .toEqual({ status: "available" });
  });

  it("keeps published mappings append-only and requires a version increment", () => {
    const publishedV1 = bindingV1(1, { scale: 1 }, "published");
    const overwrittenV1 = bindingV1(1, { scale: 2 }, "published");
    const changedV2 = bindingV1(2, { scale: 2 }, "draft");

    expect(() => assertPublishedBindingEvolutionV1(
      [publishedV1],
      [overwrittenV1],
    )).toThrow(/must never be overwritten or removed/);
    expect(() => assertPublishedBindingEvolutionV1(
      [publishedV1],
      [publishedV1, changedV2],
    )).not.toThrow();
  });

  it("loads only explicit pairwise migrations", () => {
    expect(loadModelSurfaceMigrationV1({
      migrationId: "main-wire-v3-to-v4-v1",
      fromModelRef: "main-wire-v3@3:sha256:source",
      toModelRef: "main-wire-v4@4:sha256:target",
      observableMappings: [{
        sourceId: "hemodynamics.pressure.absolute.LV",
        targetId: "hemodynamics.pressure.absolute.LV",
        mappingKind: "identity",
        interpretationBoundary: "Same absolute LV station.",
      }],
      controlMappings: [],
      presetMappings: [],
      unmapped: [{
        sourceId: "device.LVAD.fixed-hmii-9000",
        reason: "The target model has no equivalent fixed preset.",
      }],
    })).toMatchObject({
      migrationId: "main-wire-v3-to-v4-v1",
      fromModelRef: "main-wire-v3@3:sha256:source",
      toModelRef: "main-wire-v4@4:sha256:target",
    });
    expect(() => loadModelSurfaceMigrationV1({
      migrationId: "stale-self-migration",
      fromModelRef: "same",
      toModelRef: "same",
      observableMappings: [],
      controlMappings: [],
      presetMappings: [],
      unmapped: [],
    })).toThrow(/distinct exact model refs/);
  });
});

async function resolveMutatedManifestV1(
  catalogs: readonly CatalogDocumentV1[],
  manifest: unknown,
) {
  return resolveModelSurfaceManifestV1({
    manifestId: MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MANIFEST_V1_ID,
    manifestRef: {
      manifestId: MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MANIFEST_V1_ID,
      schemaVersion: 1,
      contentSha256: await sha256CanonicalJsonHex(manifest),
    },
    manifest,
    catalogs,
    expectedModelRef:
      MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MODEL_REF_V1,
  });
}

function bindingV1(
  bindingVersion: number,
  mapping: CanonicalJsonObject,
  publicationStatus: "draft" | "published",
): ModelSpecificBindingV1 {
  const modelId = "main-wire-integrated-v3";
  const conceptId = "circulation.systemic-resistance";
  return Object.freeze({
    modelId,
    conceptId,
    bindingId: modelSpecificBindingIdV1(
      modelId,
      conceptId,
      bindingVersion,
    ),
    bindingVersion,
    publicationStatus,
    mapping,
  });
}
