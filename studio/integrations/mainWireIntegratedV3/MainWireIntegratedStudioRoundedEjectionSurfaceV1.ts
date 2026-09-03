import {
  assertModelSurfaceReleaseLineageV1,
  derivationCapabilityV1,
  type ModelSurfaceReleaseManifestV1,
} from "@/studio/contracts/v2/modelSurface";
import workbenchAnalysisSurfaceV1 from
  "./model-surface-workbench-analysis-v1.json";

import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_AOV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68OutputRegistryV1";
import {
  MAIN_WIRE_PERIODIC_PVA_METHOD_V8_ID,
  MAIN_WIRE_PERIODIC_PVA_METHOD_V9_ID,
} from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";

/**
 * Standard68 intentionally reuses the established source-topology clinical
 * Workbench surface. It must not inherit Standard67's selected proximal-root
 * outputs because the rounded-ejection exact model deliberately returns to the
 * source aortic topology. Controls, derived analyses, and graph presentation
 * otherwise inherit the latest compatible source-topology production Surface;
 * numerical semantics remain in the exact model. This incompatible exposure
 * change starts a new Surface series, so the source Surface is a composition
 * input rather than a registry predecessor.
 */
const sourceTopologyWorkbench = workbenchAnalysisSurfaceV1 as unknown as
  ModelSurfaceReleaseManifestV1;
const roundedEjectionDerivedOutputCatalog = Object.freeze(
  sourceTopologyWorkbench.derivedOutputCatalog.map((output) =>
    output.derivationId !== MAIN_WIRE_PERIODIC_PVA_METHOD_V8_ID
      ? output
      : Object.freeze({
          ...output,
          derivationId: MAIN_WIRE_PERIODIC_PVA_METHOD_V9_ID,
          requiredCapabilities: Object.freeze(
            output.requiredCapabilities.map((capability) =>
              capability === derivationCapabilityV1(
                MAIN_WIRE_PERIODIC_PVA_METHOD_V8_ID,
              )
                ? derivationCapabilityV1(MAIN_WIRE_PERIODIC_PVA_METHOD_V9_ID)
                : capability,
            ),
          ),
        }),
  ),
);

export const MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_SURFACE_V1 =
  Object.freeze({
    ...sourceTopologyWorkbench,
    surfaceReleaseId:
      "circleheart.main-wire.surface.rounded-ejection.standard-68.workbench-v3",
    surfaceSeriesId:
      "circleheart.main-wire.surface.rounded-ejection.standard-68.workbench",
    predecessorSurfaceReleaseId: null,
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
    derivedOutputCatalog: roundedEjectionDerivedOutputCatalog,
    graphCatalog: sourceTopologyWorkbench.graphCatalog,
    knobCatalog: sourceTopologyWorkbench.knobCatalog,
    protocolCatalog: sourceTopologyWorkbench.protocolCatalog,
  }) satisfies ModelSurfaceReleaseManifestV1;

assertModelSurfaceReleaseLineageV1(
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_SURFACE_V1,
);

export default MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_SURFACE_V1;
