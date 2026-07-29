import {
  MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_ID,
  MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_SHA256,
  MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_VERSION,
} from "@/engine/myocardium/MainWireIntegratedLaneDevelopmentIdentityV1";
import {
  MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_CATALOG_V1,
  MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_FRAME_V1_ID,
} from "@/engine/myocardium/MainWireIntegratedLaneObservableRegistryV1";
import {
  cloneAndFreezeCanonicalJson,
  sha256CanonicalJsonHex,
  type CanonicalJsonObject,
} from "@/engine/scientific/release";
import {
  createCatalogRefV1,
  type CatalogDocumentV1,
  type CatalogRefV1,
} from "@/engine/modelSurface/v1/CatalogRefV1";
import {
  MODEL_SURFACE_MANIFEST_V1_SCHEMA_ID,
  MODEL_SURFACE_MANIFEST_V1_SCHEMA_VERSION,
  loadModelSurfaceManifestV1,
  type ModelSurfaceManifestRefV1,
  type ModelSurfaceManifestV1,
} from "@/engine/modelSurface/v1/ModelSurfaceManifestV1";
import type {
  ModelSurfaceModelRefV1,
} from "@/engine/modelSurface/v1/ModelSurfaceIdentityV1";

export const MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MANIFEST_V1_ID =
  "main-wire-integrated-v3-experimental-model-surface-manifest-v1" as const;
export const MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_PACKAGE_V1_SCHEMA_ID =
  "circleheart.model-surface-package.v1" as const;
export const MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MANIFEST_V1_ARTIFACT_PATH =
  "engine/modelSurface/v1/artifacts/main-wire-integrated-v3-experimental-model-surface-manifest-v1.json" as const;

export const MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MODEL_REF_V1 =
  Object.freeze({
    modelId: MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_ID,
    modelVersion:
      MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_VERSION,
    modelContentSha256:
      MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_SHA256,
    lifecycle: "development" as const,
    evidenceStatus: "unverified" as const,
  }) satisfies ModelSurfaceModelRefV1;

const CATALOG_IDS = Object.freeze({
  topology:
    "main-wire-integrated-v3-experimental-topology-manifest-foundation-v1",
  observables:
    "main-wire-integrated-v3-experimental-observable-catalog-compatibility-v1",
  plots:
    "main-wire-integrated-v3-experimental-plot-recipe-catalog-foundation-v1",
  viewSets:
    "main-wire-integrated-v3-experimental-view-set-catalog-foundation-v1",
  protocols:
    "main-wire-integrated-v3-experimental-protocol-catalog-foundation-v1",
  evidence:
    "main-wire-integrated-v3-experimental-evidence-catalog-foundation-v1",
} as const);

export type MainWireIntegratedV3ModelSurfacePackageV1 = Readonly<{
  schemaId:
    typeof MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_PACKAGE_V1_SCHEMA_ID;
  ref: ModelSurfaceManifestRefV1;
  manifest: ModelSurfaceManifestV1;
  catalogs: readonly CatalogDocumentV1[];
}>;

/**
 * Builds the PR-1 surface for the existing fixed HMII 9000 lane. It does not
 * create a general V3 identity, new observables, controls or runtime behavior.
 */
export async function buildMainWireIntegratedV3ModelSurfacePackageV1():
Promise<MainWireIntegratedV3ModelSurfacePackageV1> {
  const catalogs = mainWireIntegratedV3CatalogDocumentsV1();
  const refs = await Promise.all(catalogs.map(createCatalogRefV1));
  const refById = new Map(refs.map((ref) => [ref.catalogId, ref]));
  const manifest = loadModelSurfaceManifestV1({
    schemaId: MODEL_SURFACE_MANIFEST_V1_SCHEMA_ID,
    schemaVersion: MODEL_SURFACE_MANIFEST_V1_SCHEMA_VERSION,
    modelRef: MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MODEL_REF_V1,
    topologyManifest: requiredRefV1(refById, CATALOG_IDS.topology),
    observableCatalog: requiredRefV1(refById, CATALOG_IDS.observables),
    metricCatalogs: [],
    controlCatalogs: [],
    plotRecipeCatalog: requiredRefV1(refById, CATALOG_IDS.plots),
    viewSetCatalog: requiredRefV1(refById, CATALOG_IDS.viewSets),
    protocolCatalog: requiredRefV1(refById, CATALOG_IDS.protocols),
    evidenceCatalog: requiredRefV1(refById, CATALOG_IDS.evidence),
    capabilityStageById: {
      "coronary.hydraulics": "product-exposed",
      "device.lvad.fixed-hmii-9000": "product-exposed",
      "rhythm.regular-sinus": "product-exposed",
      "surface.controls": "absent",
      "surface.evidence-catalog": "absent",
      "surface.metrics": "absent",
      "surface.observable.live-core-v1": "product-exposed",
      "surface.plot-recipes": "absent",
      "surface.protocols": "absent",
      "surface.topology-catalog": "absent",
      "surface.view-sets": "absent",
    },
    performanceProfiles: [],
    migrations: [],
  });
  const ref = Object.freeze({
    manifestId: MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MANIFEST_V1_ID,
    schemaVersion: MODEL_SURFACE_MANIFEST_V1_SCHEMA_VERSION,
    contentSha256: await sha256CanonicalJsonHex(manifest),
  }) satisfies ModelSurfaceManifestRefV1;
  return cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    schemaId:
      MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_PACKAGE_V1_SCHEMA_ID,
    ref,
    manifest,
    catalogs,
  }) as unknown as MainWireIntegratedV3ModelSurfacePackageV1;
}

export function mainWireIntegratedV3CatalogDocumentsV1():
readonly CatalogDocumentV1[] {
  const modelRef = MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MODEL_REF_V1;
  const debugSourcePaths = Object.fromEntries(
    MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_CATALOG_V1.map(
      ({ observableId, sourcePath }) => [observableId, sourcePath],
    ),
  );
  return Object.freeze([
    foundationCatalogV1(
      CATALOG_IDS.topology,
      "topology-manifest",
      "The executable topology exists, but its semantic TopologyManifest is not wired in PR 1.",
      modelRef,
    ),
    Object.freeze({
      catalogId: CATALOG_IDS.observables,
      schemaVersion: 1,
      modelRef,
      content: Object.freeze({
        catalogKind: "observable-catalog-compatibility",
        profileId: "live-core-v1",
        frameId: MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_FRAME_V1_ID,
        unavailableValuePolicy: "null-never-zero",
        definitions: Object.freeze(
          MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_CATALOG_V1.map(
            compatibilityObservableDefinitionV1,
          ),
        ),
        interpretationBoundary:
          "PR 1 identifies the existing eight-signal compatibility surface only. It adds no extractor and no observable.",
      }),
      metadata: Object.freeze({
        debugSourcePaths: Object.freeze(debugSourcePaths),
        humanComments: Object.freeze([
          "Concrete object paths are debugging aids and are excluded from catalog identity.",
        ]),
      }),
    }) satisfies CatalogDocumentV1,
    foundationCatalogV1(
      CATALOG_IDS.plots,
      "plot-recipe-catalog",
      "PlotRecipe definitions are not wired in PR 1.",
      modelRef,
    ),
    foundationCatalogV1(
      CATALOG_IDS.viewSets,
      "view-set-catalog",
      "ViewSet definitions are not wired in PR 1.",
      modelRef,
    ),
    foundationCatalogV1(
      CATALOG_IDS.protocols,
      "protocol-catalog",
      "Model-surface Protocol definitions are not wired in PR 1.",
      modelRef,
    ),
    foundationCatalogV1(
      CATALOG_IDS.evidence,
      "evidence-catalog",
      "Claim-specific Evidence definitions are not wired in PR 1.",
      modelRef,
    ),
  ]);
}

function foundationCatalogV1(
  catalogId: string,
  catalogKind: string,
  explanation: string,
  modelRef: ModelSurfaceModelRefV1,
): CatalogDocumentV1 {
  return Object.freeze({
    catalogId,
    schemaVersion: 1,
    modelRef,
    content: Object.freeze({
      catalogKind,
      definitions: Object.freeze([]),
      availability: Object.freeze({
        status: "not-wired",
        reasonCode: "catalog-schema-pr1-only",
        explanation,
      }),
      interpretationBoundary:
        "This foundation reference is identity infrastructure, not an implemented runtime surface.",
    }),
    metadata: Object.freeze({
      humanComments: Object.freeze([
        "The catalog remains empty until its scoped implementation PR.",
      ]),
    }),
  });
}

function compatibilityObservableDefinitionV1(
  definition:
    (typeof MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_CATALOG_V1)[number],
): CanonicalJsonObject {
  const measurement = compatibilityMeasurementV1(
    definition.observableId,
  );
  return Object.freeze({
    observableId: definition.observableId,
    conceptId: definition.observableId,
    definitionVersion: 1,
    quantityKind: definition.quantityKind,
    unit: definition.unit,
    measurement,
    temporalSemantics: definition.sourceKind,
    projectionBinding: {
      bindingId:
        `${MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MODEL_REF_V1.modelId}/${definition.observableId}@1`,
      bindingVersion: 1,
    },
    capabilityRequirements: compatibilityCapabilitiesV1(
      definition.observableId,
    ),
    interpretationBoundary:
      "Existing fixed-lane V1 signal semantics only; no general V3 availability is claimed.",
  });
}

function compatibilityMeasurementV1(
  observableId:
    (typeof MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_CATALOG_V1)[number][
      "observableId"
    ],
): CanonicalJsonObject {
  if (observableId === "hemodynamics.volume.LV") {
    return Object.freeze({
      siteId: "LV",
      basis: "not-applicable",
      directionConvention: "positive-contained-volume",
      stationDefinition: "accepted LV circulation-node volume",
    });
  }
  if (observableId === "hemodynamics.pressure.absolute.LV") {
    return Object.freeze({
      siteId: "LV",
      basis: "absolute",
      directionConvention: "positive-compressive-pressure",
      stationDefinition: "accepted-step LV intracavitary pressure",
    });
  }
  if (observableId === "hemodynamics.pressure.absolute.Ao") {
    return Object.freeze({
      siteId: "Ao",
      basis: "absolute",
      directionConvention: "positive-compressive-pressure",
      stationDefinition: "accepted-step aortic-root node pressure",
    });
  }
  if (observableId === "coronary.flow.total") {
    return Object.freeze({
      siteId: "coronary.inlet.total",
      basis: "not-applicable",
      directionConvention: "positive-from-aortic-root-into-coronary-beds",
      stationDefinition: "sum of LAD, LCx and RCA accepted-step inlet flows",
    });
  }
  if (observableId === "device.LVAD.flow") {
    return Object.freeze({
      siteId: "device.LVAD",
      basis: "not-applicable",
      directionConvention: "positive-from-LV-to-Ao",
      stationDefinition: "accepted dynamic LVAD circuit flow",
    });
  }
  const territory = observableId.split(".").at(-1);
  return Object.freeze({
    siteId: `coronary.inlet.${territory}`,
    basis: "not-applicable",
    directionConvention: "positive-from-aortic-root-into-coronary-bed",
    stationDefinition: `${territory} accepted-step inlet flow`,
  });
}

function compatibilityCapabilitiesV1(
  observableId: string,
): readonly string[] {
  if (observableId.startsWith("coronary.")) {
    return Object.freeze(["coronary.hydraulics"]);
  }
  if (observableId.startsWith("device.LVAD.")) {
    return Object.freeze(["device.lvad.fixed-hmii-9000"]);
  }
  return Object.freeze(["surface.observable.live-core-v1"]);
}

function requiredRefV1(
  refs: ReadonlyMap<string, CatalogRefV1>,
  catalogId: string,
): CatalogRefV1 {
  const ref = refs.get(catalogId);
  if (ref === undefined) {
    throw new Error(`missing generated catalog ref ${catalogId}`);
  }
  return ref;
}
