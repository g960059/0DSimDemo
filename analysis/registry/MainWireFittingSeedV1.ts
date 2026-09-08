import { MAIN_WIRE_INTEGRATED_STUDIO_STANDARD72_MODEL_ID_V1 as modelId } from "@/domain/model/MainWireStandardIdentityV1";
import { MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1 as hemodynamicResearchInputs,
  MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1 as mechanismResearchInputs } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";

/** A suggested starting input, never an observation or part of the fit target.
 * Saved runs carry their own inputs; changing this selection cannot relabel them. */
export const MAIN_WIRE_FITTING_SEED_V1 = Object.freeze({
  modelId, baselineId: "standard72-reference-baseline-4935-hr70-v1",
  candidateInputs: Object.freeze({ hemodynamicResearchInputs, mechanismResearchInputs, ventricularContractilityScale: 1 }),
});
