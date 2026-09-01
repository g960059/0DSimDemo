import {
  assertModelSurfaceReleaseManifestV1,
  type ModelSurfaceReleaseManifestV1,
} from "@/studio/contracts/v2/modelSurface";
import algebraicProximalRootsSurfaceV1 from
  "./model-surface-algebraic-proximal-roots-standard67-v1.json";
import workbenchAnalysisSurfaceV1 from
  "./model-surface-workbench-analysis-v1.json";

import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_AOV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68OutputRegistryV1";

/**
 * Standard68 intentionally reuses the established source-topology clinical
 * Workbench surface. It must not inherit Standard67's selected proximal-root
 * outputs because the rounded-ejection exact model deliberately returns to the
 * source aortic topology. Only the release identity and exact ET exposure
 * differ; numerical semantics remain in the exact model.
 */
const predecessor = algebraicProximalRootsSurfaceV1 as unknown as
  ModelSurfaceReleaseManifestV1;
const sourceTopologyWorkbench = workbenchAnalysisSurfaceV1 as unknown as
  ModelSurfaceReleaseManifestV1;

export const MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_SURFACE_V1 =
  Object.freeze({
    ...predecessor,
    surfaceReleaseId:
      "circleheart.main-wire.surface.rounded-ejection.standard-68.workbench-v1",
    surfaceSeriesId:
      "circleheart.main-wire.surface.rounded-ejection.standard-68.workbench",
    predecessorSurfaceReleaseId: predecessor.surfaceReleaseId,
    displayName: "Main Wire Standard 68",
    exposedExactOutputIds: Object.freeze([
      ...sourceTopologyWorkbench.exposedExactOutputIds,
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_AOV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1,
    ]),
    controlCatalog: Object.freeze(
      sourceTopologyWorkbench.controlCatalog.filter(
        ({ controlId }) =>
          !controlId.startsWith("myocardium.calcium-decay-time-scale."),
      ),
    ),
    graphCatalog: sourceTopologyWorkbench.graphCatalog,
  }) satisfies ModelSurfaceReleaseManifestV1;

assertModelSurfaceReleaseManifestV1(
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_SURFACE_V1,
);

export default MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_SURFACE_V1;
