import { MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1 } from "@/engine/core/MainWireAlgebraicPulmonaryArterialRootProfileV1";
import type { MainWireIntegratedModelHemodynamicResearchInputsV3 } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import { MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelMechanismResearchInputsV3 } from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import { MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
  createMainWireIntegratedRegularSinusRhythmV3 } from "@/engine/myocardium/MainWireIntegratedRegularSinusRhythmV3";
import { resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1 } from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaExactPersistenceV1";
import { canonicalizeDerivedExactEventCalciumParameterV1, convertPeriodicBiexponentialToExactEventCalciumV1 } from "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import { createAcceptedComposedRhythmTransactionConfigurationV2, initializeAcceptedComposedRhythmTransactionStateV2 } from "@/engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2";
import { createMaterialKernelsWithMechanicsResearchInputsV1, createNormalAdultProviderFromKernels,
  scaledWallLandTrefForScaleV1 } from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import { MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_WALL_MATERIAL_V1 as sourceMaterial,
  MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_COLD_MAXIMUM_ITERATIONS_V1 } from "@/engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1";
import { deriveLand2017DerivedParameters, stableHash } from "@/engine/myocardium/myofilament/land2017/parameterSets";
import { assembleMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  prepareMainWireIntegratedModelFixtureInputsV3 } from "./MainWireIntegratedModelPeriodicSteadyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_ID } from "./MainWireIntegratedModelRoundedEjectionFixtureV1";

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD71_FIXTURE_V1_ID = "main-wire-integrated-model-standard71-fixture-v1";
export const MAIN_WIRE_STANDARD71_MATERIAL_PROFILE_V1_ID = "main-wire-standard71-ventricular-material-v1";
export const MAIN_WIRE_STANDARD71_CALCIUM_PROFILE_V1_ID = "main-wire-standard71-ventricular-calcium-v1";

export const MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1: MainWireIntegratedModelHemodynamicResearchInputsV3 = Object.freeze({
  systemicResistance: 1.04, pulmonaryResistance: .625, venousTone: .15, arterialStiffness: 1.42,
  heartRateBpm: 70, totalBloodVolumeMl: 4935, peepCmH2O: 0,
});
const sourceMechanism = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3;
export const MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1: MainWireIntegratedModelMechanismResearchInputsV3 = Object.freeze({
  ...sourceMechanism,
  chamberMechanics: Object.freeze({ ...sourceMechanism.chamberMechanics,
    activeTensionScaleByWall: Object.freeze({ LA: 1, LVFW: 1, SEP: 1, RVFW: 1, RA: 1 }),
    passiveStiffnessScaleByWall: Object.freeze({ LA: 1, LVFW: 1.04, SEP: 1.04, RVFW: 1.04, RA: 1 }),
  }),
});

// Fixed constitutive calibration, not individually measured normal human
// parameters. Keep original source values and explicit calibration provenance.
const scaledLand = scaledWallLandTrefForScaleV1(sourceMaterial.landEquationParameters,
  MAIN_WIRE_STANDARD71_MATERIAL_PROFILE_V1_ID,
  238816.54628141236 / sourceMaterial.landEquationParameters.values.Tref,
  "Standard71 closed-loop calibration; not independently measured maximal human tension");
const { parameterSetStableHash: _sourceHash, ...baseLand } = scaledLand;
const values = Object.freeze({ ...scaledLand.values, CaT50Ref: .6, beta1: -1.2 });
const calibratedLand = { ...baseLand, values, derived: Object.freeze(deriveLand2017DerivedParameters(values)),
  sourceParameters: Object.freeze(scaledLand.sourceParameters.map(entry =>
    entry.parameter !== "CaT50Ref" && entry.parameter !== "beta1" ? entry : Object.freeze({ ...entry,
      location: `${entry.location}; Standard71 joint intact/organ affinity calibration, not a refit of human data`,
      runtime: Object.freeze({ ...entry.runtime, value: values[entry.parameter] }),
    }))),
};
export const MAIN_WIRE_STANDARD71_LAND_PARAMETERS_V1 = Object.freeze({ ...calibratedLand,
  parameterSetStableHash: stableHash(calibratedLand) });
export const MAIN_WIRE_STANDARD71_WALL_MATERIAL_V1 = Object.freeze({ ...sourceMaterial,
  parameterSetId: MAIN_WIRE_STANDARD71_MATERIAL_PROFILE_V1_ID, landSlackStretch: 1,
  landEquationParameters: MAIN_WIRE_STANDARD71_LAND_PARAMETERS_V1 });

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD71_FIXTURE_V1_CLAIM = Object.freeze({
  fixtureId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD71_FIXTURE_V1_ID,
  ventricularMaterialProfileId: MAIN_WIRE_STANDARD71_MATERIAL_PROFILE_V1_ID,
  regularSinusProfileId: MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
  composedRhythmCalciumOwner: "accepted-exact-event-biexponential-state",
  calciumProfileId: MAIN_WIRE_STANDARD71_CALCIUM_PROFILE_V1_ID,
  calciumDecayTimeScaleResearchInput: "fixed-unit-only-to-preserve-standard71-calcium-law",
  calciumSourceFitRetained: false,
  aorticOutflowCirculationProfileId: "main-wire-source-aortic-outflow-algebraic-root-v1",
  pulmonaryRootProfileId: MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1.profileId,
  systemicArterialComplianceScale: .65, aorticRootInertanceScale: 0,
  valveLawsChanged: false, newContinuousState: false, clinicalValidationClaimed: false,
});

export type MainWireIntegratedModelStandard71FixtureV1 = ReturnType<typeof createMainWireIntegratedModelStandard71FixtureV1>;

/** Fixed construction: no probe/profile arguments and no dependency on the
 * research factory. The existing active-tension controls multiply this reference. */
export function createMainWireIntegratedModelStandard71FixtureV1(
  inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 = MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1,
  ventricularContractilityScale = 1,
  mechanism: MainWireIntegratedModelMechanismResearchInputsV3 = MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1,
) {
  const prepared = prepareMainWireIntegratedModelFixtureInputsV3(inputs, ventricularContractilityScale, mechanism);
  if (Object.values(prepared.chamberMechanics.calciumDecayTimeScaleByWall).some(scale => scale !== 1)) {
    throw new Error("Standard71 requires unit calcium decay-time scales for its fixed calcium law");
  }
  const sourceCalcium = resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1(inputs.heartRateBpm);
  // Preserve the qualified construction's rounding order and peak amplitude.
  const decay = canonicalizeDerivedExactEventCalciumParameterV1(sourceCalcium.ventricular.riseTimeConstantSec * 1.1);
  const calcium = Object.freeze({ ...sourceCalcium, parameterSetId: MAIN_WIRE_STANDARD71_CALCIUM_PROFILE_V1_ID,
    ventricular: Object.freeze({ ...sourceCalcium.ventricular,
      riseTimeConstantSec: canonicalizeDerivedExactEventCalciumParameterV1(decay * .9),
      decayTimeConstantSec: decay, diastolicCalciumUM: .13,
      peakAmplitudeUM: sourceCalcium.ventricular.diastolicCalciumUM + sourceCalcium.ventricular.peakAmplitudeUM - .13,
    }),
  });
  const fixture = assembleMainWireIntegratedModelRegularSinusAllOffFixtureV3(prepared, {
    createProvider: () => createNormalAdultProviderFromKernels("on",
      createMaterialKernelsWithMechanicsResearchInputsV1(prepared.chamberMechanics, MAIN_WIRE_STANDARD71_WALL_MATERIAL_V1,
        MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_COLD_MAXIMUM_ITERATIONS_V1), `-${MAIN_WIRE_INTEGRATED_MODEL_STANDARD71_FIXTURE_V1_ID}`),
    createVascularRuntime: () => Object.freeze({ venousTone: inputs.venousTone, arterialStiffness: inputs.arterialStiffness,
      systemicArterialComplianceResearchScale: .65, aorticRootInertanceResearchScale: 0,
      algebraicPulmonaryArterialRootProfile: MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1 }),
    createCalciumDriveParams: () => calcium,
    createRhythm: cycleLengthSec => {
      const base = createMainWireIntegratedRegularSinusRhythmV3({ idPrefix: "rounded-ejection-v1",
        parameterProvenanceSourceId: MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_ID, cycleLengthSec },
      { profileId: MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID, heartRateBpm: inputs.heartRateBpm });
      const ventricular = convertPeriodicBiexponentialToExactEventCalciumV1(calcium.ventricular, cycleLengthSec);
      const { configurationSchemaId: _schema, schemaVersion: _version, ...baseConfiguration } = base.configuration;
      const configuration = createAcceptedComposedRhythmTransactionConfigurationV2({ ...baseConfiguration,
        configurationId: MAIN_WIRE_STANDARD71_CALCIUM_PROFILE_V1_ID,
        calciumParametersByWall: { ...baseConfiguration.calciumParametersByWall,
          LVFW: ventricular.parameters, SEP: ventricular.parameters, RVFW: ventricular.parameters } });
      const history = base.state, atrial = history.electricalCaptureState.atrialGate;
      if (atrial.lastCapturedActivationId === null || atrial.lastCapturedActivationTimeSec === null) {
        throw new Error("Standard71 calcium requires the source periodic capture history");
      }
      const state = initializeAcceptedComposedRhythmTransactionStateV2(configuration, {
        acceptedTimeSec: 0, regularFirstFutureActivationTimeSec: history.regularAtrialSourceState!.nextActivationTimeSec,
        regularFirstSourceSequence: 0,
        priorAcceptedAtrialCapture: { capturedActivationId: atrial.lastCapturedActivationId, activationTimeSec: atrial.lastCapturedActivationTimeSec },
        priorAcceptedVentricularActivation: history.ventricularIntervalStrengthState.initialPriorAcceptedVentricularActivation,
        initialNormalizedSrLoadState: history.ventricularIntervalStrengthState.initialNormalizedSrLoadState,
        calciumStateByWall: { ...history.calciumStateByWall,
          LVFW: ventricular.periodicStateImmediatelyAfterEvent, SEP: ventricular.periodicStateImmediatelyAfterEvent,
          RVFW: ventricular.periodicStateImmediatelyAfterEvent },
      });
      return Object.freeze({ configuration, state });
    },
  });
  return Object.freeze({ ...fixture, standard71AssemblyId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD71_FIXTURE_V1_ID,
    standard71AssemblyClaim: MAIN_WIRE_INTEGRATED_MODEL_STANDARD71_FIXTURE_V1_CLAIM });
}
