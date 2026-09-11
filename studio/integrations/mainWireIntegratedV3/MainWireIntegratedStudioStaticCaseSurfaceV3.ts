import previous from "./MainWireIntegratedStudioStaticCaseSurfaceV2";
import { MAIN_WIRE_AORTIC_JET_DERIVATION_V1 as jet } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import { derivationCapabilityV1, outputCapabilityV1, type ModelSurfaceReleaseManifestV1 } from "@/studio/contracts/v2/modelSurface";
/** Local candidate only. Inherits all controls, graphs and pinned analyses;
 * opt-in aortic-jet outputs add no exact state or numerical-model mint. */
export default Object.freeze({ ...previous,
  surfaceReleaseId: "circleheart.main-wire.surface.static-anatomy.standard-73.workbench-v3",
  predecessorSurfaceReleaseId: previous.surfaceReleaseId,
  derivedOutputCatalog: Object.freeze([...previous.derivedOutputCatalog, ...jet.outputs.map(output => Object.freeze({
    ...output, significantDigits: 3, derivationId: jet.derivationId,
    requiredCapabilities: Object.freeze([derivationCapabilityV1(jet.derivationId), ...output.dependencies.map(outputCapabilityV1)]),
  }))]),
}) satisfies ModelSurfaceReleaseManifestV1;
