import {
  assertModelSurfaceReleaseLineageV1,
  type ModelSurfaceReleaseManifestV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_WORKBENCH_SURFACE_CATALOGS_V1,
} from "./MainWireIntegratedStudioWorkbenchSurfaceV1";

export const MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_SURFACE_V1 =
  Object.freeze({
    ...MAIN_WIRE_INTEGRATED_STUDIO_WORKBENCH_SURFACE_CATALOGS_V1,
    surfaceReleaseId:
      "circleheart.main-wire.surface.rounded-ejection.standard-68.workbench-v3",
    surfaceSeriesId:
      "circleheart.main-wire.surface.rounded-ejection.standard-68.workbench",
    predecessorSurfaceReleaseId: null,
    displayName: "Main Wire Standard 68",
  }) satisfies ModelSurfaceReleaseManifestV1;

assertModelSurfaceReleaseLineageV1(
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_SURFACE_V1,
);

export default MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_SURFACE_V1;
