import previous from "./MainWireIntegratedStudioStaticCaseSurfaceV3";
import { MAIN_WIRE_AORTIC_JET_PRESENTATION_V1_ID as jet } from "@/analysis/methods/mainWire/MainWireAorticJetPresentationV1";
import { MAIN_WIRE_PERIODIC_PVA_METHOD_V14_ID as oldPva, MAIN_WIRE_PERIODIC_PVA_METHOD_V15_ID as pva } from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";
import { MAIN_WIRE_PRESSURE_CROSSING_PV_ANALYSIS_V1_ID as formal } from "@/analysis/methods/mainWire/MainWireStructuralAnalysisContractV3";
import { analysisCapabilityV1, derivationCapabilityV1, type ModelSurfaceReleaseManifestV1 } from "@/studio/contracts/v2/modelSurface";

/** A changed method pin starts a distinct Surface
 * series, not an exact-model mint or an overwrite of the production method. */
export default Object.freeze({ ...previous,
  surfaceReleaseId: "circleheart.main-wire.surface.static-anatomy.standard-73.pressure-crossing-v1",
  surfaceSeriesId: "circleheart.main-wire.surface.static-anatomy.pressure-crossing-workbench",
  predecessorSurfaceReleaseId: null,
  derivedOutputCatalog: Object.freeze(previous.derivedOutputCatalog.map(output => output.derivationId !== oldPva ? output : Object.freeze({ ...output,
    derivationId: pva, requiredCapabilities: Object.freeze(output.requiredCapabilities.map(c => c === derivationCapabilityV1(oldPva) ? derivationCapabilityV1(pva) : c)),
  }))),
  graphCatalog: Object.freeze([...previous.graphCatalog.map(graph => Object.freeze({ ...graph,
    ...(graph.renderer === "structural-return" ? { analysisId: formal } : {}),
    requiredCapabilities: Object.freeze([...new Set(graph.requiredCapabilities.map(c => c.startsWith("analysis/") ? analysisCapabilityV1(formal) : c))]),
  })), { graphId: "hemodynamics.aortic-jet.cycle", renderer: "cycle-waveform" as const,
    derivationId: jet, requiredCapabilities: [`derivation/${jet}`] }]),
}) satisfies ModelSurfaceReleaseManifestV1;
