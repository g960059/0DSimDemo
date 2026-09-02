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
  createMainWireRoundedEjectionFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireRoundedEjectionFiveWallProviderV1";
import {
  MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_PROFILE_V1_ID,
} from "@/engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1";

export const MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_ID =
  "main-wire-integrated-model-rounded-ejection-fixture-v1" as const;

/**
 * Standard68 is a fixed, low-order successor construction: the admitted
 * matched-alpha rhythm/calcium owner is reused, only two ventricular
 * cross-bridge rate primitives and the existing geometry-to-Land stretch
 * coupling differ from the source material, and the source aortic topology is
 * retained. It adds neither a valve-opening state nor an inertial state.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_CLAIM =
  Object.freeze({
    fixtureId: MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_ID,
    ventricularMaterialProfileId:
      MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_PROFILE_V1_ID,
    regularSinusProfileId:
      MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
    composedRhythmCalciumOwner:
      "accepted-exact-event-matched-alpha-state" as const,
    coronaryCalciumDriveParamsRole:
      "matched-alpha-descriptor-and-cycle-contract-not-calcium-state-owner" as const,
    calciumDecayTimeScaleResearchInput:
      "fixed-unit-only-to-preserve-selected-matched-alpha-law" as const,
    aorticOutflowCirculationProfileId:
      "main-wire-source-aortic-outflow-topology-v3" as const,
    aorticOutflowPressureStation: "source-lv-to-aortic-node" as const,
    proximalArterialRootMomentum: "source-inertance" as const,
    changedLandPrimitiveParameters: Object.freeze(["kuw", "kws"] as const),
    sourceTroponinCooperativityRestored: true as const,
    sourceTrefRestored: true as const,
    geometryToLandStretchCouplingChanged: true as const,
    newContinuousStateAdded: false as const,
    valveOpeningStateAdded: false as const,
    pressureRecoveryCorrectionApplied: false as const,
    numericOptimizerApplied: false as const,
    boundedFactorizedPhysiologyScreenApplied: true as const,
    clinicalValidationClaimed: false as const,
  });

export type MainWireIntegratedModelRoundedEjectionFixtureV1 = ReturnType<
  typeof createMainWireIntegratedModelRoundedEjectionFixtureV1
>;

export function createMainWireIntegratedModelRoundedEjectionFixtureV1(
  requestedHemodynamicResearchInputs: MainWireIntegratedModelHemodynamicResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  ventricularContractilityScale = 1,
  requestedMechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
) {
  const prepared = prepareMainWireIntegratedModelFixtureInputsV3(
    requestedHemodynamicResearchInputs,
    ventricularContractilityScale,
    requestedMechanismResearchInputs,
  );
  assertMatchedAlphaCompatibleCalciumScalesV1(prepared.chamberMechanics);
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
    roundedEjectionAssemblyId:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_ID,
    roundedEjectionAssemblyClaim:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_CLAIM,
  });
}

function assertMatchedAlphaCompatibleCalciumScalesV1(
  chamberMechanics: MainWireIntegratedModelMechanismResearchInputsV3["chamberMechanics"],
): void {
  const nonUnitWalls = Object.entries(
    chamberMechanics.calciumDecayTimeScaleByWall,
  ).filter(([, scale]) => scale !== 1).map(([wallId]) => wallId);
  if (nonUnitWalls.length > 0) {
    throw new Error(
      "rounded-ejection fixture requires unit calcium decay-time scales to "
        + "preserve its fixed matched-alpha calcium law; non-unit walls: "
        + nonUnitWalls.join(", "),
    );
  }
}
