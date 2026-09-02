import {
  assertMainWireIntegratedModelBaselineValidationPassedV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  evaluateMainWireIntegratedModelRoundedEjectionCandidateV1,
  type MainWireIntegratedModelRoundedEjectionBaselineQualificationV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineQualificationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard69BaselineV1";

/** Release-time resting qualification for the Standard69 default fixture. */
export async function qualifyMainWireIntegratedModelStandard69BaselineV1():
  Promise<MainWireIntegratedModelRoundedEjectionBaselineQualificationV1> {
  const qualification =
    await evaluateMainWireIntegratedModelRoundedEjectionCandidateV1({
      hemodynamicResearchInputs:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
      mechanismResearchInputs:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
      ventricularContractilityScale: 1,
    });
  assertMainWireIntegratedModelBaselineValidationPassedV1(
    qualification.checks,
    qualification.measurements,
  );
  return qualification;
}
