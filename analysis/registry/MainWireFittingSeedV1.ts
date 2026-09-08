import { CURRENT_BASELINE_V1 as adopted } from "@/data/model-baselines/CurrentBaselineV1";
import type { MainWireIntegratedModelStandard72CheckpointV1 } from "@/engine/myocardium/MainWireIntegratedModelStandard72CheckpointV1";
import { validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3 as hemodynamic }
  from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import { validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3 as mechanism }
  from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";

/** A suggested starting input, never an observation or part of the fit target.
 * Saved runs carry their own inputs; changing this selection cannot relabel them. */
export const MAIN_WIRE_FITTING_SEED_V1 = Object.freeze({
  modelId: adopted.modelId, baselineId: adopted.baselineId,
  checkpoint: adopted.capture.checkpoint.payload as unknown as MainWireIntegratedModelStandard72CheckpointV1,
  candidateInputs: Object.freeze({
    hemodynamicResearchInputs: hemodynamic(adopted.capture.fixture.hemodynamicResearchInputs),
    mechanismResearchInputs: mechanism(adopted.capture.fixture.mechanismResearchInputs),
    ventricularContractilityScale: 1,
  }),
});
