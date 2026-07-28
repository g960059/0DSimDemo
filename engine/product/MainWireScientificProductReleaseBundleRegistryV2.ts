import {
  SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
} from "@/components/scientificProduct/scientificProductCaseCatalogV1";
import {
  resolveScientificProductReleaseBundleV1,
  type CurrentScientificProductReleaseBundleV1,
} from "@/components/scientificProduct/ScientificProductReleaseBundleRegistryV1";
import {
  loadMainWireIntegratedLaneDevelopmentIdentityV1,
} from "@/engine/myocardium/MainWireIntegratedLaneDevelopmentIdentityArtifactV1";
import {
  MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_ID,
  MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_SHA256,
  MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_VERSION,
  type MainWireIntegratedLaneDevelopmentManifestV1,
} from "@/engine/myocardium/MainWireIntegratedLaneDevelopmentIdentityV1";
import {
  INTEGRATED_V3_LANE_KIND_V1,
  createIntegratedV3LaneDescriptorV1,
  type StudioLaneDescriptorV1,
} from "@/engine/myocardium/MainWireIntegratedLaneIdentityV1";
import {
  MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_SNAPSHOT_V1,
} from "@/engine/myocardium/MainWireIntegratedLaneObservableRegistryV1";
import {
  loadSimulationReleaseRefV1,
  sameSimulationReleaseRef,
  sha256CanonicalJsonHex,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";

export const MAIN_WIRE_SCIENTIFIC_PRODUCT_RELEASE_BUNDLE_REGISTRY_V2_ID =
  "main-wire-scientific-product-heterogeneous-release-bundle-registry-v2" as const;
export const MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_BUNDLE_V1_SCHEMA_ID =
  "main-wire-integrated-v3-development-product-bundle-v1" as const;

export type MainWireNoncoronaryProductBundleMemberV2 = Readonly<{
  memberKind: "noncoronary-release-v1";
  releaseRef: SimulationReleaseRef;
  bundle: CurrentScientificProductReleaseBundleV1;
}>;

export type MainWireIntegratedLaneDevelopmentBundleV1 = Readonly<{
  memberKind: typeof INTEGRATED_V3_LANE_KIND_V1;
  schemaId:
    typeof MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_BUNDLE_V1_SCHEMA_ID;
  releaseRef: SimulationReleaseRef;
  manifest: MainWireIntegratedLaneDevelopmentManifestV1;
  catalogRefs: Readonly<{
    observables: Readonly<{
      digestSemantics: "sha256-canonical-json-catalog-slot";
      sha256: string;
    }>;
    lane: Readonly<{
      digestSemantics: "sha256-canonical-json-catalog-slot";
      sha256: string;
    }>;
  }>;
  catalogs: Readonly<{
    observables:
      typeof MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_SNAPSHOT_V1;
    lane: StudioLaneDescriptorV1;
  }>;
}>;

export type MainWireScientificProductReleaseBundleMemberV2 =
  | MainWireNoncoronaryProductBundleMemberV2
  | MainWireIntegratedLaneDevelopmentBundleV1;

const INTEGRATED_DEVELOPMENT_REF_V1 = Object.freeze({
  id: MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_ID,
  version: MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_VERSION,
  sha256: MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_SHA256,
}) satisfies SimulationReleaseRef;

export const MAIN_WIRE_SCIENTIFIC_PRODUCT_ALLOWLISTED_IDENTITY_REFS_V2 =
  Object.freeze([
    SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
    INTEGRATED_DEVELOPMENT_REF_V1,
  ] as const);

export class MainWireScientificProductReleaseBundleResolutionErrorV2
  extends Error {
  constructor(message: string) {
    super(`scientific product heterogeneous bundle rejected: ${message}`);
    this.name = "MainWireScientificProductReleaseBundleResolutionErrorV2";
  }
}

/**
 * Resolves either exact allowlisted identity without changing the V1 resolver.
 * The integrated member has a deliberately different catalog shape.
 */
export async function resolveMainWireScientificProductReleaseBundleV2(
  value: unknown,
): Promise<MainWireScientificProductReleaseBundleMemberV2> {
  let requestedRef: SimulationReleaseRef;
  try {
    requestedRef = loadSimulationReleaseRefV1(value);
  } catch (error) {
    throw new MainWireScientificProductReleaseBundleResolutionErrorV2(
      error instanceof Error ? error.message : "identity ref is invalid",
    );
  }

  if (sameSimulationReleaseRef(SCIENTIFIC_PRODUCT_RELEASE_REF_V1, requestedRef)) {
    const bundle = resolveScientificProductReleaseBundleV1(requestedRef);
    return Object.freeze({
      memberKind: "noncoronary-release-v1" as const,
      releaseRef: bundle.releaseRef,
      bundle,
    });
  }
  if (sameSimulationReleaseRef(INTEGRATED_DEVELOPMENT_REF_V1, requestedRef)) {
    return loadIntegratedDevelopmentBundleV1();
  }
  throw new MainWireScientificProductReleaseBundleResolutionErrorV2(
    "the exact identity ref is not allowlisted",
  );
}

async function loadIntegratedDevelopmentBundleV1():
Promise<MainWireIntegratedLaneDevelopmentBundleV1> {
  const identity = await loadMainWireIntegratedLaneDevelopmentIdentityV1();
  const observableCatalogSha256 = await sha256CanonicalJsonHex(
    MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_SNAPSHOT_V1,
  );
  const lane = createIntegratedV3LaneDescriptorV1(
    identity.ref,
    observableCatalogSha256,
  );
  return Object.freeze({
    memberKind: INTEGRATED_V3_LANE_KIND_V1,
    schemaId:
      MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_BUNDLE_V1_SCHEMA_ID,
    releaseRef: identity.ref,
    manifest: identity.manifest,
    catalogRefs: Object.freeze({
      observables: Object.freeze({
        digestSemantics:
          "sha256-canonical-json-catalog-slot" as const,
        sha256: observableCatalogSha256,
      }),
      lane: Object.freeze({
        digestSemantics:
          "sha256-canonical-json-catalog-slot" as const,
        sha256: await sha256CanonicalJsonHex(lane),
      }),
    }),
    catalogs: Object.freeze({
      observables:
        MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_SNAPSHOT_V1,
      lane,
    }),
  });
}
