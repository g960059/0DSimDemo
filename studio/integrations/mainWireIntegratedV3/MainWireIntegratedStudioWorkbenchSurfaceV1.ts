import {
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

/** Shared compatible catalogs; exact-release identities remain in their wrappers. */
const {
  surfaceReleaseId: _release,
  surfaceSeriesId: _series,
  predecessorSurfaceReleaseId: _predecessor,
  displayName: _displayName,
  ...sourceTopologyWorkbench
} = workbenchAnalysisSurfaceV1 as unknown as ModelSurfaceReleaseManifestV1;
const derivedOutputCatalog = Object.freeze(
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

export const MAIN_WIRE_INTEGRATED_STUDIO_WORKBENCH_SURFACE_CATALOGS_V1 =
  Object.freeze({
    ...sourceTopologyWorkbench,
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
    derivedOutputCatalog,
    graphCatalog: sourceTopologyWorkbench.graphCatalog,
    knobCatalog: sourceTopologyWorkbench.knobCatalog,
    protocolCatalog: sourceTopologyWorkbench.protocolCatalog,
  }) satisfies Omit<ModelSurfaceReleaseManifestV1,
    "surfaceReleaseId" | "surfaceSeriesId" | "predecessorSurfaceReleaseId" | "displayName">;
