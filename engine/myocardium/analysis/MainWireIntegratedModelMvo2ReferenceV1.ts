import {
  loadMainWireIntegratedModelNormalAdultPvaReferenceV1,
  type MainWireIntegratedModelPvaOutputV1,
  type MainWireIntegratedModelPvaReferenceV1,
} from "@/engine/myocardium/analysis/MainWireIntegratedModelPvaEstimateV1";

export const MAIN_WIRE_INTEGRATED_MODEL_MVO2_REFERENCE_V1_ID =
  "main-wire-integrated-model-normal-adult-lv-mvo2-reference-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_MVO2_METHOD_V1_ID =
  "suga-1986-pva-mvo2-linear-literature-reference-v1" as const;

const MMHG_ML_TO_JOULE_V1 = 1.33322e-4;

/**
 * Literature coefficients for the classic per-beat LV PVA-MVO2 relation.
 * They are retained as an educational reference, not fitted to this model or
 * asserted as a model-specific or patient-specific clinical calibration.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_MVO2_COEFFICIENT_MAPPING_V1 =
  Object.freeze({
    mappingId: MAIN_WIRE_INTEGRATED_MODEL_MVO2_METHOD_V1_ID,
    relation: "MVO2_per_beat_per_100g = a * PVA_per_100g + b" as const,
    pvaSlopeMlO2PerMmHgMl: 1.8e-5,
    unloadedInterceptMlO2PerBeatPer100G: 0.02,
    coefficientSource: Object.freeze({
      pubmedId: "3790043" as const,
      doi: "10.1007/978-3-662-11374-5_5" as const,
      sourcePopulation: "canine-left-ventricle" as const,
    }),
    humanContextSource: Object.freeze({
      pubmedId: "1478216" as const,
      doi: "10.1093/eurheartj/13.suppl_e.85" as const,
      population: "nine-patients-with-heart-disease" as const,
      role: "supporting-human-linearity-context-not-coefficient-owner" as const,
    }),
    contractilityBoundary:
      "unloaded-intercept-varies-with-contractile-state" as const,
  });

const MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_WALL_VOLUME_ML_V1 =
  Object.freeze({
    LVFW: 67.07543664065403,
    SEP: 35.77356620834881,
  });
const MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_MYOCARDIAL_DENSITY_G_PER_ML_V1 = 1.053;
const MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_MASS_ROUNDING_DIGITS_V1 = 1;
const MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_MASS_G_V1 = Number(
  (
    (MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_WALL_VOLUME_ML_V1.LVFW +
      MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_WALL_VOLUME_ML_V1.SEP) *
    MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_MYOCARDIAL_DENSITY_G_PER_ML_V1
  ).toFixed(MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_MASS_ROUNDING_DIGITS_V1),
);

/**
 * Compact projection of the fixed normal-adult five-wall prior. LV mass uses
 * LV free wall plus septum, matching the stated LV reference convention. The
 * values remain here so this presentation feature does not import the solver.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_MASS_REFERENCE_V1 =
  Object.freeze({
    sourcePriorId: "normal-adult-five-wall-fixed-prior-v1" as const,
    allocation: "LVFW-plus-SEP" as const,
    myocardialDensityGPerMl:
      MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_MYOCARDIAL_DENSITY_G_PER_ML_V1,
    wallMaterialVolumeMl:
      MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_WALL_VOLUME_ML_V1,
    myocardialMassRoundingDigits:
      MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_MASS_ROUNDING_DIGITS_V1,
    myocardialMassG: MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_MASS_G_V1,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_MVO2_REFERENCE_HEART_RATE_BPM_V1 =
  60 as const;

export type MainWireIntegratedModelMvo2LimitationV1 =
  | "canine-coefficients-used-as-literature-reference"
  | "fixed-lvfw-plus-septum-mass-allocation"
  | "contractility-dependent-intercept-not-recalibrated"
  | "inherits-method-specific-pva-limitations";

export type MainWireIntegratedModelLvMvo2ReferenceInputV1 = Readonly<{
  pvaOutput: MainWireIntegratedModelPvaOutputV1;
  referenceHeartRateBpm: number;
  lvMyocardialMassG: number;
}>;

export type MainWireIntegratedModelLvMvo2ReferenceV1 =
  | Readonly<{
      referenceId: typeof MAIN_WIRE_INTEGRATED_MODEL_MVO2_REFERENCE_V1_ID;
      methodId: typeof MAIN_WIRE_INTEGRATED_MODEL_MVO2_METHOD_V1_ID;
      status: "limited";
      scope: "canonical-normal-adult-lv-reference";
      ventricleId: "LV";
      pvaSource: Readonly<{
        outputId: string;
        pvaMethodId: string;
        pvaEstimateJ: number;
        pvaEstimateMmHgMl: number;
        pvaEstimateMmHgMlPer100G: number;
        sensitivity: Readonly<{
          systolicAreaOutsideMeasuredRangeFraction: number;
          releaseSlopeDifferenceFraction: number;
        }>;
      }>;
      coefficientMapping: typeof MAIN_WIRE_INTEGRATED_MODEL_MVO2_COEFFICIENT_MAPPING_V1;
      massReference: typeof MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_MASS_REFERENCE_V1;
      referenceHeartRateBpm: number;
      oxygenDemand: Readonly<{
        pvaDependentMlO2PerBeat: number;
        unloadedMlO2PerBeat: number;
        totalMlO2PerBeat: number;
        pvaDependentMlO2PerBeatPer100G: number;
        unloadedMlO2PerBeatPer100G: number;
        totalMlO2PerBeatPer100G: number;
        totalMlO2PerMinPer100G: number;
      }>;
      limitations: readonly MainWireIntegratedModelMvo2LimitationV1[];
      interpretation: Readonly<{
        literatureCoefficientProjectionAvailable: true;
        modelSpecificCalibrationEstablished: false;
        validatedModelPredictionEstablished: false;
        modelPredictedOxygenConsumption: false;
        measuredOxygenConsumption: false;
        scenarioSpecificEstimate: false;
        patientSpecificEstimate: false;
        clinicalDecisionSupport: false;
        rightVentricularEstimateAvailable: false;
        wholeHeartEstimateAvailable: false;
      }>;
    }>
  | Readonly<{
      referenceId: typeof MAIN_WIRE_INTEGRATED_MODEL_MVO2_REFERENCE_V1_ID;
      methodId: typeof MAIN_WIRE_INTEGRATED_MODEL_MVO2_METHOD_V1_ID;
      status: "unavailable";
      scope: "canonical-normal-adult-lv-reference";
      ventricleId: "LV";
      reason: string;
    }>;

let cachedNormalAdultMvo2ReferenceV1: MainWireIntegratedModelLvMvo2ReferenceV1 | null =
  null;

export function evaluateMainWireIntegratedModelLvMvo2ReferenceV1(
  input: MainWireIntegratedModelLvMvo2ReferenceInputV1,
): MainWireIntegratedModelLvMvo2ReferenceV1 {
  const unavailable = (
    reason: string,
  ): MainWireIntegratedModelLvMvo2ReferenceV1 =>
    Object.freeze({
      referenceId: MAIN_WIRE_INTEGRATED_MODEL_MVO2_REFERENCE_V1_ID,
      methodId: MAIN_WIRE_INTEGRATED_MODEL_MVO2_METHOD_V1_ID,
      status: "unavailable" as const,
      scope: "canonical-normal-adult-lv-reference" as const,
      ventricleId: "LV" as const,
      reason,
    });

  if (input.pvaOutput.ventricleId !== "LV") {
    return unavailable(
      "The literature-coefficient mapping is limited to the LV reference",
    );
  }
  if (input.pvaOutput.status !== "limited") {
    return unavailable("The LV PVA reference is unavailable");
  }
  if (
    !Number.isFinite(input.referenceHeartRateBpm) ||
    !(input.referenceHeartRateBpm > 0) ||
    !Number.isFinite(input.lvMyocardialMassG) ||
    !(input.lvMyocardialMassG > 0) ||
    !Number.isFinite(input.pvaOutput.pvaEstimateJ) ||
    !(input.pvaOutput.pvaEstimateJ > 0)
  ) {
    return unavailable("The MVO2 reference inputs must be positive and finite");
  }
  if (
    input.referenceHeartRateBpm !==
      MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_MVO2_REFERENCE_HEART_RATE_BPM_V1 ||
    input.lvMyocardialMassG !==
      MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_MASS_REFERENCE_V1.myocardialMassG
  ) {
    return unavailable(
      "The heart rate and LV mass must match the fixed normal-adult reference",
    );
  }

  const pvaEstimateMmHgMl = input.pvaOutput.pvaEstimateJ / MMHG_ML_TO_JOULE_V1;
  const normalizationPer100G = 100 / input.lvMyocardialMassG;
  const pvaEstimateMmHgMlPer100G = pvaEstimateMmHgMl * normalizationPer100G;
  const pvaDependentMlO2PerBeat =
    MAIN_WIRE_INTEGRATED_MODEL_MVO2_COEFFICIENT_MAPPING_V1.pvaSlopeMlO2PerMmHgMl *
    pvaEstimateMmHgMl;
  const unloadedMlO2PerBeat =
    (MAIN_WIRE_INTEGRATED_MODEL_MVO2_COEFFICIENT_MAPPING_V1.unloadedInterceptMlO2PerBeatPer100G *
      input.lvMyocardialMassG) /
    100;
  const totalMlO2PerBeat = pvaDependentMlO2PerBeat + unloadedMlO2PerBeat;
  const pvaDependentMlO2PerBeatPer100G =
    pvaDependentMlO2PerBeat * normalizationPer100G;
  const unloadedMlO2PerBeatPer100G = unloadedMlO2PerBeat * normalizationPer100G;
  const totalMlO2PerBeatPer100G = totalMlO2PerBeat * normalizationPer100G;
  const totalMlO2PerMinPer100G =
    totalMlO2PerBeatPer100G * input.referenceHeartRateBpm;
  const computed = [
    pvaEstimateMmHgMl,
    pvaEstimateMmHgMlPer100G,
    pvaDependentMlO2PerBeat,
    unloadedMlO2PerBeat,
    totalMlO2PerBeat,
    pvaDependentMlO2PerBeatPer100G,
    unloadedMlO2PerBeatPer100G,
    totalMlO2PerBeatPer100G,
    totalMlO2PerMinPer100G,
  ];
  if (computed.some((value) => !Number.isFinite(value) || !(value > 0))) {
    return unavailable(
      "The MVO2 reference calculation is not positive and finite",
    );
  }

  return Object.freeze({
    referenceId: MAIN_WIRE_INTEGRATED_MODEL_MVO2_REFERENCE_V1_ID,
    methodId: MAIN_WIRE_INTEGRATED_MODEL_MVO2_METHOD_V1_ID,
    status: "limited" as const,
    scope: "canonical-normal-adult-lv-reference" as const,
    ventricleId: "LV" as const,
    pvaSource: Object.freeze({
      outputId: input.pvaOutput.outputId,
      pvaMethodId: input.pvaOutput.methodId,
      pvaEstimateJ: input.pvaOutput.pvaEstimateJ,
      pvaEstimateMmHgMl,
      pvaEstimateMmHgMlPer100G,
      sensitivity: Object.freeze({
        systolicAreaOutsideMeasuredRangeFraction:
          input.pvaOutput.sensitivity.systolicAreaOutsideMeasuredRangeFraction,
        releaseSlopeDifferenceFraction:
          input.pvaOutput.sensitivity.releaseSlopeDifferenceFraction,
      }),
    }),
    coefficientMapping: MAIN_WIRE_INTEGRATED_MODEL_MVO2_COEFFICIENT_MAPPING_V1,
    massReference: MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_MASS_REFERENCE_V1,
    referenceHeartRateBpm: input.referenceHeartRateBpm,
    oxygenDemand: Object.freeze({
      pvaDependentMlO2PerBeat,
      unloadedMlO2PerBeat,
      totalMlO2PerBeat,
      pvaDependentMlO2PerBeatPer100G,
      unloadedMlO2PerBeatPer100G,
      totalMlO2PerBeatPer100G,
      totalMlO2PerMinPer100G,
    }),
    limitations: Object.freeze([
      "canine-coefficients-used-as-literature-reference",
      "fixed-lvfw-plus-septum-mass-allocation",
      "contractility-dependent-intercept-not-recalibrated",
      "inherits-method-specific-pva-limitations",
    ] as const),
    interpretation: Object.freeze({
      literatureCoefficientProjectionAvailable: true as const,
      modelSpecificCalibrationEstablished: false as const,
      validatedModelPredictionEstablished: false as const,
      modelPredictedOxygenConsumption: false as const,
      measuredOxygenConsumption: false as const,
      scenarioSpecificEstimate: false as const,
      patientSpecificEstimate: false as const,
      clinicalDecisionSupport: false as const,
      rightVentricularEstimateAvailable: false as const,
      wholeHeartEstimateAvailable: false as const,
    }),
  });
}

export function buildMainWireIntegratedModelNormalAdultLvMvo2ReferenceV1(
  pvaReference: MainWireIntegratedModelPvaReferenceV1 = loadMainWireIntegratedModelNormalAdultPvaReferenceV1(),
): MainWireIntegratedModelLvMvo2ReferenceV1 {
  const lvOutput = pvaReference.outputs.find(
    (output) => output.ventricleId === "LV",
  );
  if (lvOutput === undefined) {
    return Object.freeze({
      referenceId: MAIN_WIRE_INTEGRATED_MODEL_MVO2_REFERENCE_V1_ID,
      methodId: MAIN_WIRE_INTEGRATED_MODEL_MVO2_METHOD_V1_ID,
      status: "unavailable" as const,
      scope: "canonical-normal-adult-lv-reference" as const,
      ventricleId: "LV" as const,
      reason: "The PVA reference does not contain an LV output",
    });
  }
  return evaluateMainWireIntegratedModelLvMvo2ReferenceV1({
    pvaOutput: lvOutput,
    referenceHeartRateBpm:
      MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_MVO2_REFERENCE_HEART_RATE_BPM_V1,
    lvMyocardialMassG:
      MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_MASS_REFERENCE_V1.myocardialMassG,
  });
}

/** Loads the compact reference without running a model or research protocol. */
export function loadMainWireIntegratedModelNormalAdultLvMvo2ReferenceV1(): MainWireIntegratedModelLvMvo2ReferenceV1 {
  if (cachedNormalAdultMvo2ReferenceV1 === null) {
    cachedNormalAdultMvo2ReferenceV1 =
      buildMainWireIntegratedModelNormalAdultLvMvo2ReferenceV1();
  }
  return cachedNormalAdultMvo2ReferenceV1;
}
