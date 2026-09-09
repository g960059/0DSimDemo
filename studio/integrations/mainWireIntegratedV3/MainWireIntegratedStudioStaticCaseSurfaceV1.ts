import inherited from "./MainWireIntegratedStudioStandard72SurfaceV1";
import { controlCapabilityV1, derivationCapabilityV1, type ModelSurfaceReleaseManifestV1 } from "@/studio/contracts/v2/modelSurface";
import { MAIN_WIRE_PERIODIC_PVA_METHOD_V13_ID, MAIN_WIRE_PERIODIC_PVA_METHOD_V14_ID } from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";

/** Same controls, panes and measured PV displays. Only the mass-dependent
 * literature estimate requires a compatible analysis pin. */
export default Object.freeze({ ...inherited,
  surfaceReleaseId: "circleheart.main-wire.surface.static-anatomy.standard-73.workbench-v1",
  surfaceSeriesId: "circleheart.main-wire.surface.static-anatomy.workbench",
  predecessorSurfaceReleaseId: null,
  displayName: "Static anatomy workbench",
  controlCatalog: Object.freeze([...inherited.controlCatalog, Object.freeze({
    controlId: "myocardium.lv-contractility", preferredPresentation: "slider" as const,
    requiredCapabilities: Object.freeze([controlCapabilityV1("myocardium.lv-contractility")]),
  })]),
  derivedOutputCatalog: Object.freeze(inherited.derivedOutputCatalog.map(output =>
    output.derivationId !== MAIN_WIRE_PERIODIC_PVA_METHOD_V13_ID ? output : Object.freeze({ ...output,
      derivationId: MAIN_WIRE_PERIODIC_PVA_METHOD_V14_ID,
      requiredCapabilities: Object.freeze(output.requiredCapabilities.map(capability =>
        capability === derivationCapabilityV1(MAIN_WIRE_PERIODIC_PVA_METHOD_V13_ID)
          ? derivationCapabilityV1(MAIN_WIRE_PERIODIC_PVA_METHOD_V14_ID) : capability)),
    }))),
}) satisfies ModelSurfaceReleaseManifestV1;
