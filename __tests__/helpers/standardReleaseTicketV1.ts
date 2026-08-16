import {
  STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
  validateStudioModelWorkerReleaseTicketV2,
} from "@/studio/contracts/v2/release";
import standardClientDescriptorV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.client.json";
import standardSurfaceReleaseV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-workbench-v1.json";
import standardRegistryAdmissionLockV1 from
  "@/studio/integrations/mainWireIntegratedV3/standard-registry-admission-lock.json";

export const STANDARD_TEST_SURFACE_SERIES_ID_V1 =
  standardSurfaceReleaseV1.surfaceSeriesId;
export const STANDARD_TEST_SURFACE_RELEASE_ID_V1 =
  standardSurfaceReleaseV1.surfaceReleaseId;

export const STANDARD_TEST_RELEASE_TICKET_V1 =
  validateStudioModelWorkerReleaseTicketV2({
    schemaId: STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
    modelId: standardClientDescriptorV1.manifest.modelId,
    artifactRevisionId: standardRegistryAdmissionLockV1.artifactRevisionId,
    manifest: standardClientDescriptorV1.manifest,
    surfaceRelease: standardSurfaceReleaseV1,
    moduleAbi: "circleheart-exact-model-esm-v1",
    artifactUrl: "http://127.0.0.1:3000/standard-exact-model.mjs",
  });
