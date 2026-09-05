import {
  assertModelSurfaceReleaseLineageV1,
  type ModelSurfaceReleaseManifestV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_PV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard70OutputRegistryV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_WORKBENCH_SURFACE_CATALOGS_V1,
} from "./MainWireIntegratedStudioWorkbenchSurfaceV1";

/**
 * Standard70 inherits the complete compatible Workbench catalogs and
 * adds only its newly exact pulmonary-valve forward-flow duration. Numerical
 * and qualification semantics remain owned by the exact release. Exposing an
 * output unavailable from earlier exact releases starts a new Surface series.
 */
const inheritedSurface = MAIN_WIRE_INTEGRATED_STUDIO_WORKBENCH_SURFACE_CATALOGS_V1;

export const MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SURFACE_V1 =
  Object.freeze({
    ...inheritedSurface,
    surfaceReleaseId:
      "circleheart.main-wire.surface.algebraic-pulmonary-root.standard-70.workbench-v1",
    surfaceSeriesId:
      "circleheart.main-wire.surface.algebraic-pulmonary-root.standard-70.workbench",
    predecessorSurfaceReleaseId: null,
    displayName: "Main Wire Standard 70",
    exposedExactOutputIds: Object.freeze([
      ...inheritedSurface.exposedExactOutputIds,
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_PV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1,
    ]),
  }) satisfies ModelSurfaceReleaseManifestV1;

assertModelSurfaceReleaseLineageV1(
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SURFACE_V1,
);

export default MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SURFACE_V1;
