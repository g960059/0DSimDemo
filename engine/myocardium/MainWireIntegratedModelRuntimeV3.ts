import type { MainWireIntegratedModelCheckpointContextV3 } from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import type { MainWireIntegratedModelAcceptedStateV3 } from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import type { MainWireNormalAdultFiveWallMechanicsStateV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
type WallState = MainWireNormalAdultFiveWallMechanicsStateV1;

export type MainWireIntegratedModelRuntimeV3 = ReturnType<
  typeof createMainWireIntegratedModelRegularSinusAllOffFixtureV3
>;

/**
 * Exact registered V3 numerical runtime constructor.
 *
 * Studio runtime, exact restore, periodic qualification, and Snapshot
 * checkpointing all use the same regular-sinus / all-off / zero-inertance
 * construction with an explicitly validated bounded hemodynamic input tuple.
 */
export async function createMainWireIntegratedModelRuntimeV3(
  hemodynamicResearchInputs: MainWireIntegratedModelHemodynamicResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  ventricularContractilityScale = 1,
  mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
): Promise<MainWireIntegratedModelRuntimeV3> {
  return createMainWireIntegratedModelRegularSinusAllOffFixtureV3(
    hemodynamicResearchInputs,
    ventricularContractilityScale,
    mechanismResearchInputs,
  );
}

export function mainWireIntegratedModelCheckpointContextV3(
  runtime: MainWireIntegratedModelRuntimeV3,
  state: MainWireIntegratedModelAcceptedStateV3<WallState>,
): MainWireIntegratedModelCheckpointContextV3<WallState> {
  const base =
    createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(runtime);
  return Object.freeze({
    ...base,
    coronaryAutoregulationBinding: state.coronary.coronaryAutoregulationBinding,
  });
}
