import mainWireIntegratedLaneDevelopmentIdentityArtifactV1
  from "@/engine/myocardium/releases/main-wire-integrated-coronary-sinus-hmii-experimental-0.0.1.json";
import {
  MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_ID,
  MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_SHA256,
  MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_VERSION,
  MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_MANIFEST_V1_SCHEMA_ID,
  type MainWireIntegratedLaneDevelopmentIdentityV1,
} from "@/engine/myocardium/MainWireIntegratedLaneDevelopmentIdentityV1";
import {
  cloneAndFreezeCanonicalJson,
  loadSimulationReleaseRefV1,
  sha256CanonicalJsonHex,
  type CanonicalJsonObject,
} from "@/engine/scientific/release";

/** Loads and digest-checks the checked-in development identity artifact. */
export async function loadMainWireIntegratedLaneDevelopmentIdentityV1():
Promise<MainWireIntegratedLaneDevelopmentIdentityV1> {
  const artifact = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(
    mainWireIntegratedLaneDevelopmentIdentityArtifactV1,
  );
  if (!isRecord(artifact.ref) || !isRecord(artifact.manifest)) {
    throw new Error("integrated lane development identity artifact is invalid");
  }
  const ref = loadSimulationReleaseRefV1(artifact.ref);
  const manifest = artifact.manifest;
  if (
    ref.id !== MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_ID
    || ref.version
      !== MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_VERSION
    || ref.sha256 !== MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_SHA256
    || manifest.schemaId
      !== MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_MANIFEST_V1_SCHEMA_ID
    || manifest.id !== ref.id
    || manifest.version !== ref.version
    || manifest.lifecycleStatus !== "development"
    || manifest.evidenceStatus !== "unverified"
  ) {
    throw new Error(
      "integrated lane development identity artifact has an unsupported identity",
    );
  }
  if (await sha256CanonicalJsonHex(manifest) !== ref.sha256) {
    throw new Error(
      "integrated lane development identity manifest SHA-256 mismatch",
    );
  }
  return artifact as unknown as MainWireIntegratedLaneDevelopmentIdentityV1;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
