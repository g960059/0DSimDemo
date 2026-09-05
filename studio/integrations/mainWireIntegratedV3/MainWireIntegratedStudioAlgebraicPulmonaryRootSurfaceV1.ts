import {
  assertModelSurfaceReleaseLineageV1,
  derivationCapabilityV1,
  type ModelSurfaceReleaseManifestV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_PV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard70OutputRegistryV1";
import qualifiedBaselineStandard69SurfaceV1 from
  "./MainWireIntegratedStudioQualifiedBaselineSurfaceV1";
import { MAIN_WIRE_PERIODIC_PVA_METHOD_V9_ID, MAIN_WIRE_PERIODIC_PVA_METHOD_V10_ID,
  MAIN_WIRE_PERIODIC_PVA_METHOD_V11_ID } from
  "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";

/**
 * Standard70 inherits the complete latest compatible Standard69 Surface and
 * adds only its newly exact pulmonary-valve forward-flow duration. Numerical
 * and qualification semantics remain owned by the exact release. Exposing an
 * output unavailable from earlier exact releases starts a new Surface series.
 */
const inheritedSurface = qualifiedBaselineStandard69SurfaceV1 as unknown as
  ModelSurfaceReleaseManifestV1;

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

/** Preserve numerical exposure while pinning a new analysis payload. A changed
 * derivation pin is not an additive same-series upgrade under the Surface ABI. */
export const MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SURFACE_V2 =
  Object.freeze({
    ...MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SURFACE_V1,
    surfaceReleaseId:
      "circleheart.main-wire.surface.algebraic-pulmonary-root.standard-70.measured-load-workbench-v1",
    surfaceSeriesId:
      "circleheart.main-wire.surface.algebraic-pulmonary-root.standard-70.measured-load-workbench",
    predecessorSurfaceReleaseId: null,
    derivedOutputCatalog: Object.freeze(
      MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SURFACE_V1.derivedOutputCatalog.map((output) =>
        output.derivationId !== MAIN_WIRE_PERIODIC_PVA_METHOD_V9_ID ? output : Object.freeze({
          ...output,
          derivationId: MAIN_WIRE_PERIODIC_PVA_METHOD_V10_ID,
          requiredCapabilities: Object.freeze(output.requiredCapabilities.map((capability) =>
            capability === derivationCapabilityV1(MAIN_WIRE_PERIODIC_PVA_METHOD_V9_ID)
              ? derivationCapabilityV1(MAIN_WIRE_PERIODIC_PVA_METHOD_V10_ID) : capability)),
        })),
    ),
  }) satisfies ModelSurfaceReleaseManifestV1;

assertModelSurfaceReleaseLineageV1(MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SURFACE_V2);

/** Same exact model, controls, and numerical policy; distinguish the default
 * end-ejection load-response display from the selectable PVA boundary. */
export const MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SURFACE_V3 =
  Object.freeze({
    ...MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SURFACE_V2,
    surfaceReleaseId:
      "circleheart.main-wire.surface.algebraic-pulmonary-root.standard-70.end-ejection-workbench-v1",
    surfaceSeriesId:
      "circleheart.main-wire.surface.algebraic-pulmonary-root.standard-70.end-ejection-workbench",
    predecessorSurfaceReleaseId: null,
    derivedOutputCatalog: Object.freeze(
      MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SURFACE_V2.derivedOutputCatalog.map((output) =>
        output.derivationId !== MAIN_WIRE_PERIODIC_PVA_METHOD_V10_ID ? output : Object.freeze({
          ...output,
          derivationId: MAIN_WIRE_PERIODIC_PVA_METHOD_V11_ID,
          requiredCapabilities: Object.freeze(output.requiredCapabilities.map((capability) =>
            capability === derivationCapabilityV1(MAIN_WIRE_PERIODIC_PVA_METHOD_V10_ID)
              ? derivationCapabilityV1(MAIN_WIRE_PERIODIC_PVA_METHOD_V11_ID) : capability)),
        })),
    ),
  }) satisfies ModelSurfaceReleaseManifestV1;

assertModelSurfaceReleaseLineageV1(MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SURFACE_V3);
export default MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SURFACE_V3;
