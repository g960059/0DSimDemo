import previous from "./MainWireIntegratedStudioStaticCaseSurfaceV1";
import { MAIN_WIRE_CARDIAC_CYCLE_DERIVATION_V1 as cycle, MAIN_WIRE_FILLING_FLOW_DERIVATION_V1 as filling } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import { derivationCapabilityV1, outputCapabilityV1, type ModelSurfaceReleaseManifestV1 } from "@/studio/contracts/v2/modelSurface";

/** Additive, opt-in beat analyses; exact dynamics and existing outputs are unchanged. */
export default Object.freeze({
  ...previous,
  surfaceReleaseId: "circleheart.main-wire.surface.static-anatomy.standard-73.workbench-v2",
  predecessorSurfaceReleaseId: previous.surfaceReleaseId,
  derivedOutputCatalog: Object.freeze([
    ...previous.derivedOutputCatalog,
    ...[cycle, filling].flatMap(method => method.outputs.map(output => Object.freeze({
      ...output, significantDigits: 3, derivationId: method.derivationId,
      requiredCapabilities: Object.freeze([
        derivationCapabilityV1(method.derivationId),
        ...output.dependencies.map(outputCapabilityV1),
      ]),
    }))),
  ]),
}) satisfies ModelSurfaceReleaseManifestV1;
