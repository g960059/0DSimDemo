/**
 * Explicit engine-to-Studio integration seam for Standard66 documentation.
 *
 * The exact owners remain authoritative. Presentation code may inspect these
 * claims and catalogs only through this concrete integration boundary.
 */
export {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_CATALOG_V1,
} from "@/engine/myocardium/MainWireAorticRecoveredRootPortOutputOverlayV1";
export {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
export {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1,
  validateMainWireAorticRecoveredRootProfileV1,
} from "@/engine/valves/MainWireAorticRecoveredRootProfileV1";
export {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_CLAIM_V1,
} from "@/engine/valves/MainWireAorticRecoveredRootPortValveV1";
