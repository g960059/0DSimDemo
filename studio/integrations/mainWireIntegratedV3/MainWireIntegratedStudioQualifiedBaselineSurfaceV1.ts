import {
  assertModelSurfaceReleaseLineageV1,
  type ModelSurfaceReleaseManifestV1,
} from "@/studio/contracts/v2/modelSurface";
import roundedEjectionStandard68SurfaceV1 from
  "./MainWireIntegratedStudioRoundedEjectionSurfaceV1";

/**
 * Standard69 changes only the exact release's qualified default operating
 * point. Its Surface therefore inherits every compatible Standard68 control,
 * output, graph, and pinned analysis method without selective reconstruction.
 * Its model-specific visible name uses an independent Surface series root.
 */
const inheritedSurface = roundedEjectionStandard68SurfaceV1 as unknown as
  ModelSurfaceReleaseManifestV1;

export const MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_SURFACE_V1 =
  Object.freeze({
    ...inheritedSurface,
    surfaceReleaseId:
      "circleheart.main-wire.surface.qualified-baseline.standard-69.workbench-v2",
    surfaceSeriesId:
      "circleheart.main-wire.surface.qualified-baseline.standard-69.workbench",
    predecessorSurfaceReleaseId: null,
    displayName: "Main Wire Standard 69",
  }) satisfies ModelSurfaceReleaseManifestV1;

assertModelSurfaceReleaseLineageV1(
  MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_SURFACE_V1,
);

export default MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_SURFACE_V1;
