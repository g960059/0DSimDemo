import inherited from "./MainWireIntegratedStudioHfrefResearchSurfaceV1";
import { derivationCapabilityV1, type ModelSurfaceReleaseManifestV1 } from "@/studio/contracts/v2/modelSurface";
import { MAIN_WIRE_PERIODIC_PVA_METHOD_V13_ID, MAIN_WIRE_PERIODIC_PVA_METHOD_V14_ID } from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";

/** Same controls, panes and measured PV displays. Only the mass-dependent
 * literature estimate requires a compatible analysis pin. Research only. */
export default Object.freeze({ ...inherited,
  surfaceReleaseId: "circleheart.main-wire.surface.static-case.research-v1",
  surfaceSeriesId: "circleheart.main-wire.surface.static-case.research",
  displayName: "Static anatomy case research",
  derivedOutputCatalog: Object.freeze(inherited.derivedOutputCatalog.map(output =>
    output.derivationId !== MAIN_WIRE_PERIODIC_PVA_METHOD_V13_ID ? output : Object.freeze({ ...output,
      derivationId: MAIN_WIRE_PERIODIC_PVA_METHOD_V14_ID,
      requiredCapabilities: Object.freeze(output.requiredCapabilities.map(capability =>
        capability === derivationCapabilityV1(MAIN_WIRE_PERIODIC_PVA_METHOD_V13_ID)
          ? derivationCapabilityV1(MAIN_WIRE_PERIODIC_PVA_METHOD_V14_ID) : capability)),
    }))),
}) satisfies ModelSurfaceReleaseManifestV1;
