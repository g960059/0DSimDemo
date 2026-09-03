import {
  MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1,
  MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1_ID,
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

export const MAIN_WIRE_INTEGRATED_MODEL_ALGEBRAIC_PULMONARY_ROOT_FIXTURE_V1_ID =
  "main-wire-integrated-model-algebraic-pulmonary-root-fixture-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_ALGEBRAIC_PULMONARY_ROOT_FIXTURE_V1_CLAIM =
  Object.freeze({
    fixtureId:
      MAIN_WIRE_INTEGRATED_MODEL_ALGEBRAIC_PULMONARY_ROOT_FIXTURE_V1_ID,
    predecessorFixtureId:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_ID,
    ventricularMaterialProfileId:
      MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_PROFILE_V1_ID,
    regularSinusProfileId:
      MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
    composedRhythmCalciumOwner:
      "accepted-exact-event-matched-alpha-state" as const,
    calciumDecayTimeScaleResearchInput:
      "fixed-unit-only-to-preserve-selected-matched-alpha-law" as const,
    aorticOutflowCirculationProfileId:
      "main-wire-source-aortic-outflow-topology-v3" as const,
    pulmonaryRootProfileId:
      MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1_ID,
    changedMomentumEdges: Object.freeze(["PA_PArt"] as const),
    sourcePulmonaryResistanceQuadraticLossAndCompliancePreserved:
      true as const,
    systemicAndAorticBranchesUnchanged: true as const,
    valveLawsChanged: false as const,
    ventricularMaterialOrCalciumChanged: false as const,
    continuousStateCountChanged: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

export type MainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1 =
  ReturnType<typeof createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1>;

/** Fixed Standard70 construction; no research profile or valve override seam. */
export function createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1(
  requestedHemodynamicResearchInputs: MainWireIntegratedModelHemodynamicResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  ventricularContractilityScale = 1,
  requestedMechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
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
      "algebraic pulmonary-root fixture requires unit calcium decay-time "
        + `scales; non-unit walls: ${nonUnitCalciumWalls.join(", ")}`,
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
          MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1,
      }),
      createCalciumDriveParams: () =>
        resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1(
          prepared.hemodynamicResearchInputs.heartRateBpm,
        ),
      createRhythm: (cycleLengthSec) =>
        createMainWireIntegratedRegularSinusRhythmV3(
          {
            // The rhythm/calcium construction is unchanged from Standard68/69;
            // preserving its exact identity also permits a verified
            // construction-continuation warm start.
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
    algebraicPulmonaryRootAssemblyId:
      MAIN_WIRE_INTEGRATED_MODEL_ALGEBRAIC_PULMONARY_ROOT_FIXTURE_V1_ID,
    algebraicPulmonaryRootAssemblyClaim:
      MAIN_WIRE_INTEGRATED_MODEL_ALGEBRAIC_PULMONARY_ROOT_FIXTURE_V1_CLAIM,
  });
}
