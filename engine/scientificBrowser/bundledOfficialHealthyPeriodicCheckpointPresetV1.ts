import catalogRawJson from "@/data/scientific/presets/catalog-v1.json?raw";
import presetRawJson from "@/data/scientific/presets/official-healthy-periodic-v1.json?raw";
import checkpointRawJson from "@/data/scientific/checkpoints/0.2.0/normal-adult-periodic-steady-v1.json?raw";

import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  verifyOfficialHealthyPeriodicPresetBundleAssetsV1,
  type BundledOfficialHealthyPeriodicPresetIdentityV1,
  type LoadedBundledOfficialHealthyPeriodicPresetV1,
} from "@/engine/scientific/presets";

export const BUNDLED_OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_CLAIM =
  Object.freeze({
    commandInput: "preset-identity-and-version-only" as const,
    catalogTrustRoot: "bundled-application-catalog" as const,
    assetDigestSemantics: "raw-file-bytes-sha256" as const,
    deterministicByteForm: "canonical-json-plus-one-line-feed" as const,
    compatibility: "identical-full-simulation-release-ref-only" as const,
    parameterization: "fixed-canonical-only" as const,
    semanticReresolutionAllowed: false as const,
    silentFallbackApplied: false as const,
    runtimeFetchRequired: false as const,
    spaRewriteExposure: false as const,
  });

const BUNDLED_ASSETS = Object.freeze({
  catalogRawJson,
  presetRawJson,
  checkpointRawJson,
});

/** Test-only byte-parity seam; production code must use the verified loader. */
export const BUNDLED_OFFICIAL_HEALTHY_PERIODIC_RAW_ASSETS_FOR_TEST_V1 =
  BUNDLED_ASSETS;

/**
 * Browser/Worker asset adapter. Asset locations and bytes are compile-time
 * owned; the caller can select only the exact catalog identity and version.
 */
export async function loadBundledOfficialHealthyPeriodicPresetV1(
  identity: BundledOfficialHealthyPeriodicPresetIdentityV1,
): Promise<LoadedBundledOfficialHealthyPeriodicPresetV1> {
  const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
  return verifyOfficialHealthyPeriodicPresetBundleAssetsV1(
    identity,
    release,
    BUNDLED_ASSETS,
  );
}
