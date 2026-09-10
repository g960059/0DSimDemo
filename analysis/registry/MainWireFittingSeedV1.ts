import adopted from "@/data/model-baselines/standard72-reference-baseline-4935-hr70-v1.json";
import type { MainWireIntegratedModelStandard72CheckpointV1 } from "@/engine/myocardium/MainWireIntegratedModelStandard72CheckpointV1";
import { validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3 as hemodynamic }
  from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import { validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3 as mechanism }
  from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";

/** Retained Standard72 workflow seed. The current finite-anatomy workflow uses
 * MainWireStaticCaseFittingSeedV1; a successor checkpoint cannot be cast to72. */
export const MAIN_WIRE_FITTING_SEED_V1 = Object.freeze({
  modelId: adopted.modelId, baselineId: adopted.baselineId,
  checkpoint: adopted.capture.checkpoint.payload as unknown as MainWireIntegratedModelStandard72CheckpointV1,
  candidateInputs: Object.freeze({
    hemodynamicResearchInputs: hemodynamic(adopted.capture.fixture.hemodynamicResearchInputs),
    mechanismResearchInputs: mechanism(adopted.capture.fixture.mechanismResearchInputs),
    ventricularContractilityScale: 1,
  }),
});
