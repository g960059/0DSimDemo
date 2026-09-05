import {
  assertAdditiveModelSurfaceUpgradeV1,
  assertModelSurfaceReleaseLineageV1,
  derivationCapabilityV1,
  outputCapabilityV1,
  type ModelSurfaceReleaseManifestV1,
} from "@/studio/contracts/v2/modelSurface";
import { MAIN_WIRE_CARDIAC_CYCLE_DERIVATION_V1 } from
  "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import previousSurface from "./MainWireIntegratedStudioAlgebraicPulmonaryRootSurfaceV1";

const method = MAIN_WIRE_CARDIAC_CYCLE_DERIVATION_V1;
export const MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SURFACE_V2 =
  Object.freeze({
    ...previousSurface,
    surfaceReleaseId:
      "circleheart.main-wire.surface.algebraic-pulmonary-root.standard-70.workbench-v2",
    predecessorSurfaceReleaseId: previousSurface.surfaceReleaseId,
    derivedOutputCatalog: Object.freeze([
      ...previousSurface.derivedOutputCatalog,
      ...method.outputs.map((output) => Object.freeze({
        ...output,
        significantDigits: 3,
        derivationId: method.derivationId,
        requiredCapabilities: Object.freeze([
          derivationCapabilityV1(method.derivationId),
          ...output.dependencies.map(outputCapabilityV1),
        ]),
      })),
    ]),
  }) satisfies ModelSurfaceReleaseManifestV1;

assertAdditiveModelSurfaceUpgradeV1(previousSurface,
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SURFACE_V2);
assertModelSurfaceReleaseLineageV1(
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SURFACE_V2, previousSurface);

export default MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SURFACE_V2;
