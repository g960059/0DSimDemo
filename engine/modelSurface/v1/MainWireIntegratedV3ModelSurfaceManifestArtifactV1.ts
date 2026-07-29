import mainWireIntegratedV3ModelSurfacePackageV1
  from "@/engine/modelSurface/v1/artifacts/main-wire-integrated-v3-experimental-model-surface-manifest-v1.json";
import {
  MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MANIFEST_V1_ID,
  MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MODEL_REF_V1,
  MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_PACKAGE_V1_SCHEMA_ID,
  type MainWireIntegratedV3ModelSurfacePackageV1,
} from "@/engine/modelSurface/v1/MainWireIntegratedV3ModelSurfaceManifestV1";
import {
  loadModelSurfaceManifestRefV1,
  resolveModelSurfaceManifestV1,
  type ModelSurfaceManifestRefV1,
  type ResolvedModelSurfaceManifestV1,
} from "@/engine/modelSurface/v1/ModelSurfaceManifestV1";
import {
  modelSurfaceRecordV1,
  assertModelSurfaceExactKeysV1,
} from "@/engine/modelSurface/v1/validationV1";

const packageRecord = modelSurfaceRecordV1(
  mainWireIntegratedV3ModelSurfacePackageV1,
  "main-wire integrated V3 model surface package",
);
assertModelSurfaceExactKeysV1(
  packageRecord,
  ["schemaId", "ref", "manifest", "catalogs"],
  [],
  "main-wire integrated V3 model surface package",
);
if (
  packageRecord.schemaId
    !== MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_PACKAGE_V1_SCHEMA_ID
) {
  throw new Error(
    "main-wire integrated V3 model surface package has an unsupported schema",
  );
}

export const MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MANIFEST_REF_V1:
ModelSurfaceManifestRefV1 = loadModelSurfaceManifestRefV1(
  packageRecord.ref,
);

if (
  MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MANIFEST_REF_V1.manifestId
    !== MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MANIFEST_V1_ID
) {
  throw new Error(
    "main-wire integrated V3 model surface package has an unsupported identity",
  );
}

export async function loadMainWireIntegratedV3ModelSurfaceManifestV1():
Promise<ResolvedModelSurfaceManifestV1> {
  const modelSurfacePackage =
    mainWireIntegratedV3ModelSurfacePackageV1 as
      MainWireIntegratedV3ModelSurfacePackageV1;
  return resolveModelSurfaceManifestV1({
    manifestId: MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MANIFEST_V1_ID,
    manifestRef: modelSurfacePackage.ref,
    manifest: modelSurfacePackage.manifest,
    catalogs: modelSurfacePackage.catalogs,
    expectedModelRef:
      MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MODEL_REF_V1,
  });
}
