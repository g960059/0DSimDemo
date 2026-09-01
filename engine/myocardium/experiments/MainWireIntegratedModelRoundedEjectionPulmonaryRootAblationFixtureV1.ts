import {
  MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1,
  MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1_ID,
  type MainWireAlgebraicPulmonaryArterialRootProfileV1,
} from "@/engine/core/MainWireAlgebraicPulmonaryArterialRootProfileV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
  createMainWireIntegratedRegularSinusRhythmV3,
} from "@/engine/myocardium/MainWireIntegratedRegularSinusRhythmV3";
import {
  resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaExactPersistenceV1";
import {
  assembleMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  prepareMainWireIntegratedModelFixtureInputsV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_ID,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionFixtureV1";
import {
  createMainWireRoundedEjectionFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireRoundedEjectionFiveWallProviderV1";
import {
  MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_PROFILE_V1_ID,
} from "@/engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1";

export const MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_PULMONARY_ROOT_ABLATION_FIXTURE_V1_ID =
  "main-wire-integrated-model-rounded-ejection-pulmonary-root-ablation-fixture-v1" as const;

/**
 * Fixed factorized successor candidate. It differs from the rounded-ejection
 * fixture only by removing PA_PArt momentum memory. This is an opt-in causal
 * ablation, not a released model or a physiological-validation claim.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_PULMONARY_ROOT_ABLATION_FIXTURE_V1_CLAIM =
  Object.freeze({
    fixtureId:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_PULMONARY_ROOT_ABLATION_FIXTURE_V1_ID,
    predecessorFixtureId:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_ID,
    ventricularMaterialProfileId:
      MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_PROFILE_V1_ID,
    regularSinusProfileId:
      MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
    pulmonaryRootProfileId:
      MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1_ID,
    changedMomentumEdges: Object.freeze(["PA_PArt"] as const),
    aorticBranchBitIdenticalToPredecessor: true as const,
    sourcePulmonaryResistanceQuadraticLossAndCompliancePreserved:
      true as const,
    valveLawsChanged: false as const,
    continuousStateCountChanged: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    releaseAcceptanceClaimed: false as const,
  });

export function createMainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1(
  requestedHemodynamicResearchInputs: MainWireIntegratedModelHemodynamicResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  ventricularContractilityScale = 1,
  requestedMechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  pulmonaryRootProfile: MainWireAlgebraicPulmonaryArterialRootProfileV1 = MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1,
) {
  const prepared = prepareMainWireIntegratedModelFixtureInputsV3(
    requestedHemodynamicResearchInputs,
    ventricularContractilityScale,
    requestedMechanismResearchInputs,
  );
  const nonUnitCalciumWalls = Object.entries(
    prepared.chamberMechanics.calciumDecayTimeScaleByWall,
  ).filter(([, scale]) => scale !== 1).map(([wallId]) => wallId);
  if (nonUnitCalciumWalls.length > 0) {
    throw new Error(
      "rounded-ejection pulmonary-root ablation requires unit calcium "
        + "decay-time scales; non-unit walls: "
        + nonUnitCalciumWalls.join(", "),
    );
  }
  const fixture = assembleMainWireIntegratedModelRegularSinusAllOffFixtureV3(
    prepared,
    {
      createProvider: () =>
        createMainWireRoundedEjectionFiveWallProviderV1(
          prepared.chamberMechanics,
        ),
      createVascularRuntime: () => Object.freeze({
        venousTone: prepared.hemodynamicResearchInputs.venousTone,
        arterialStiffness:
          prepared.hemodynamicResearchInputs.arterialStiffness,
        algebraicPulmonaryArterialRootProfile:
          pulmonaryRootProfile,
      }),
      createCalciumDriveParams: () =>
        resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1(
          prepared.hemodynamicResearchInputs.heartRateBpm,
        ),
      createRhythm: (cycleLengthSec) =>
        createMainWireIntegratedRegularSinusRhythmV3(
          {
            idPrefix: "rounded-ejection-v1",
            parameterProvenanceSourceId:
              MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_ID,
            cycleLengthSec,
          },
          {
            profileId:
              MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
            heartRateBpm: prepared.hemodynamicResearchInputs.heartRateBpm,
          },
        ),
    },
  );
  return Object.freeze({
    ...fixture,
    roundedEjectionPulmonaryRootAblationAssemblyId:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_PULMONARY_ROOT_ABLATION_FIXTURE_V1_ID,
    roundedEjectionPulmonaryRootAblationAssemblyClaim:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_PULMONARY_ROOT_ABLATION_FIXTURE_V1_CLAIM,
  });
}
