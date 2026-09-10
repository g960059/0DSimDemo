import previous from "./MainWireIntegratedStudioStaticCaseSurfaceV1";
import { MAIN_WIRE_CARDIAC_CYCLE_DERIVATION_V1 as cycle } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import { derivationCapabilityV1, outputCapabilityV1, type ModelSurfaceReleaseManifestV1 } from "@/studio/contracts/v2/modelSurface";

/** Additive analysis-only candidate; the current published release stays v1. */
export default Object.freeze({
  ...previous,
  surfaceReleaseId: "circleheart.main-wire.surface.static-anatomy.standard-73.workbench-v2",
  predecessorSurfaceReleaseId: previous.surfaceReleaseId,
  derivedOutputCatalog: Object.freeze([
    ...previous.derivedOutputCatalog,
    ...cycle.outputs.map(output => Object.freeze({
      ...output, significantDigits: 3, derivationId: cycle.derivationId,
      requiredCapabilities: Object.freeze([
        derivationCapabilityV1(cycle.derivationId),
        ...output.dependencies.map(outputCapabilityV1),
      ]),
    })),
  ]),
}) satisfies ModelSurfaceReleaseManifestV1;
