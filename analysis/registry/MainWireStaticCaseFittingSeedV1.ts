import { MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1 as hemodynamics,
  MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1 as mechanism } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import type { MainWireStaticCaseCandidateV1, MainWireCaseReferenceIdV1 } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";

/** Input suggestions from the selected finite-case study, not physiology
 * targets, registered presets, or a license to relabel an older checkpoint. */
export function mainWireStaticCaseFittingSeedV1(referenceId: MainWireCaseReferenceIdV1): MainWireStaticCaseCandidateV1 {
  if (referenceId !== "baseline" && referenceId !== "hfref-chronic-dilated-v1") throw new Error("Unsupported case reference");
  const hfref = referenceId === "hfref-chronic-dilated-v1";
  return { anatomyId: hfref ? "dilated-lv-v1" : "baseline-v1", ventricularContractilityScale: 1,
    hemodynamicResearchInputs: { ...hemodynamics, systemicResistance: hfref ? 1.2 : hemodynamics.systemicResistance },
    mechanismResearchInputs: { ...mechanism, chamberMechanics: { ...mechanism.chamberMechanics,
      activeTensionScaleByWall: { ...mechanism.chamberMechanics.activeTensionScaleByWall,
        LVFW: hfref ? .35 : 1, SEP: hfref ? .35 : 1 } } } };
}
