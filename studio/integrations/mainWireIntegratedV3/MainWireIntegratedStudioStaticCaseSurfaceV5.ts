import previous from "./MainWireIntegratedStudioStaticCaseSurfaceV4";
import { MAIN_WIRE_PERIODIC_PVA_METHOD_V15_ID as oldPva, MAIN_WIRE_PERIODIC_PVA_METHOD_V16_ID as pva } from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";
import { derivationCapabilityV1, type ModelSurfaceReleaseManifestV1 } from "@/studio/contracts/v2/modelSurface";

/** Production bounded PE-tail admission
 * changes which families yield PVA, so the PVA pin moves to V16 in a new
 * Surface series; controls, graphs, outputs and the measured source analysis
 * are inherited unchanged. Snapshots sealed under pressure-crossing-v1 keep
 * V15 until they are re-captured under this Surface. */
export default Object.freeze({ ...previous,
  surfaceReleaseId: "circleheart.main-wire.surface.static-anatomy.standard-73.bounded-pva-v1",
  surfaceSeriesId: "circleheart.main-wire.surface.static-anatomy.bounded-pva-workbench",
  predecessorSurfaceReleaseId: null,
  derivedOutputCatalog: Object.freeze(previous.derivedOutputCatalog.map(output => output.derivationId !== oldPva ? output : Object.freeze({ ...output,
    derivationId: pva, requiredCapabilities: Object.freeze(output.requiredCapabilities.map(c => c === derivationCapabilityV1(oldPva) ? derivationCapabilityV1(pva) : c)),
  }))),
}) satisfies ModelSurfaceReleaseManifestV1;
