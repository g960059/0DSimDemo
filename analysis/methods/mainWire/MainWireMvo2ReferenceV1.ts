import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1 } from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";

// This literature projection is an analysis method; the exact model owns only
// the anatomical prior imported above.

export const MAIN_WIRE_INTEGRATED_MODEL_MVO2_REFERENCE_V1_ID =
  "main-wire-integrated-model-lv-pva-mvo2-literature-estimate-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_MVO2_METHOD_V1_ID =
  "suga-1986-pva-mvo2-linear-literature-estimate-v1" as const;

const MMHG_ML_TO_JOULE_V1 = 1.33322e-4;

/**
 * Literature coefficients for the classic per-beat LV PVA-MVO2 relation.
 * They are an educational estimate, not a calibration of this model's
 * crossbridge, calcium-handling, basal, or whole-heart oxygen consumption.
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
    LVFW:
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.wallGeometryParameters.LVFW
        .wallMaterialVolumeM3 * 1e6,
    SEP:
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.wallGeometryParameters.SEP
        .wallMaterialVolumeM3 * 1e6,
  });
const MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_MYOCARDIAL_DENSITY_G_PER_ML_V1 =
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1.myocardialDensityKgPerM3 / 1_000;
const MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_MASS_G_V1 =
  (MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_WALL_VOLUME_ML_V1.LVFW +
    MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_WALL_VOLUME_ML_V1.SEP) *
  MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_MYOCARDIAL_DENSITY_G_PER_ML_V1;

/** Fixed LVFW+SEP mass convention used only to normalize the estimate. */
export const MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_MASS_REFERENCE_V1 =
  Object.freeze({
    sourcePriorId: NORMAL_ADULT_FIVE_WALL_PRIOR_V1.priorId,
    sourceParameterIdentityHash:
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.parameterIdentityHash,
    allocation: "LVFW-plus-SEP" as const,
    myocardialDensityGPerMl:
      MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_MYOCARDIAL_DENSITY_G_PER_ML_V1,
    wallMaterialVolumeMl:
      MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_WALL_VOLUME_ML_V1,
    myocardialMassG: MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_MASS_G_V1,
  });

export type MainWireIntegratedModelLvMvo2EstimateInputV1 = Readonly<{
  pvaOutputId: string;
  pvaMethodId: string;
  pvaEstimateJ: number;
  heartRateBpm: number;
}>;

export type MainWireIntegratedModelLvMvo2EstimateV1 =
  | Readonly<{
      estimateId: typeof MAIN_WIRE_INTEGRATED_MODEL_MVO2_REFERENCE_V1_ID;
      methodId: typeof MAIN_WIRE_INTEGRATED_MODEL_MVO2_METHOD_V1_ID;
      status: "available";
      ventricleId: "LV";
      pvaSource: Readonly<{
        outputId: string;
        methodId: string;
        pvaEstimateJ: number;
        pvaEstimateMmHgMl: number;
        pvaEstimateMmHgMlPer100G: number;
      }>;
      coefficientMapping: typeof MAIN_WIRE_INTEGRATED_MODEL_MVO2_COEFFICIENT_MAPPING_V1;
      massReference: typeof MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_MASS_REFERENCE_V1;
      heartRateBpm: number;
      oxygenDemand: Readonly<{
        pvaDependentMlO2PerBeat: number;
        unloadedMlO2PerBeat: number;
        totalMlO2PerBeat: number;
        totalMlO2PerBeatPer100G: number;
        totalMlO2PerMinPer100G: number;
      }>;
      limitations: readonly [
        "canine-coefficients-used-as-literature-estimate",
        "input-pva-method-does-not-reproduce-coefficient-source-protocol",
        "model-defined-lvfw-plus-septum-mass-allocation",
        "contractility-dependent-intercept-not-recalibrated",
        "does-not-model-crossbridge-calcium-or-basal-metabolism",
      ];
      interpretation: Readonly<{
        literatureEstimateAvailable: true;
        pvaInputIsScenarioSpecific: true;
        pvaDefinitionReproducesCoefficientSourceProtocol: false;
        modelSpecificCalibrationEstablished: false;
        measuredOxygenConsumption: false;
        clinicalDecisionSupport: false;
        wholeHeartEstimateAvailable: false;
      }>;
    }>
  | Readonly<{
      estimateId: typeof MAIN_WIRE_INTEGRATED_MODEL_MVO2_REFERENCE_V1_ID;
      methodId: typeof MAIN_WIRE_INTEGRATED_MODEL_MVO2_METHOD_V1_ID;
      status: "unavailable";
      ventricleId: "LV";
      reason: string;
    }>;

export function evaluateMainWireIntegratedModelLvMvo2EstimateV1(
  input: MainWireIntegratedModelLvMvo2EstimateInputV1,
): MainWireIntegratedModelLvMvo2EstimateV1 {
  const unavailable = (
    reason: string,
  ): MainWireIntegratedModelLvMvo2EstimateV1 =>
    Object.freeze({
      estimateId: MAIN_WIRE_INTEGRATED_MODEL_MVO2_REFERENCE_V1_ID,
      methodId: MAIN_WIRE_INTEGRATED_MODEL_MVO2_METHOD_V1_ID,
      status: "unavailable" as const,
      ventricleId: "LV" as const,
      reason,
    });
  const massG =
    MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_MASS_REFERENCE_V1.myocardialMassG;
  if (
    input.pvaOutputId.length === 0 ||
    input.pvaMethodId.length === 0 ||
    !Number.isFinite(input.pvaEstimateJ) ||
    !(input.pvaEstimateJ > 0) ||
    !Number.isFinite(input.heartRateBpm) ||
    !(input.heartRateBpm > 0) ||
    !Number.isFinite(massG) ||
    !(massG > 0)
  ) {
    return unavailable(
      "PVA, heart rate, and LV mass must be positive and finite",
    );
  }

  const pvaEstimateMmHgMl = input.pvaEstimateJ / MMHG_ML_TO_JOULE_V1;
  const per100G = 100 / massG;
  const pvaEstimateMmHgMlPer100G = pvaEstimateMmHgMl * per100G;
  const pvaDependentMlO2PerBeat =
    MAIN_WIRE_INTEGRATED_MODEL_MVO2_COEFFICIENT_MAPPING_V1.pvaSlopeMlO2PerMmHgMl *
    pvaEstimateMmHgMl;
  const unloadedMlO2PerBeat =
    (MAIN_WIRE_INTEGRATED_MODEL_MVO2_COEFFICIENT_MAPPING_V1.unloadedInterceptMlO2PerBeatPer100G *
      massG) /
    100;
  const totalMlO2PerBeat = pvaDependentMlO2PerBeat + unloadedMlO2PerBeat;
  const totalMlO2PerBeatPer100G = totalMlO2PerBeat * per100G;
  const totalMlO2PerMinPer100G = totalMlO2PerBeatPer100G * input.heartRateBpm;
  if (
    [
      pvaEstimateMmHgMl,
      pvaEstimateMmHgMlPer100G,
      pvaDependentMlO2PerBeat,
      unloadedMlO2PerBeat,
      totalMlO2PerBeat,
      totalMlO2PerBeatPer100G,
      totalMlO2PerMinPer100G,
    ].some((value) => !Number.isFinite(value) || !(value > 0))
  ) {
    return unavailable("The literature MVO2 projection overflowed");
  }

  return Object.freeze({
    estimateId: MAIN_WIRE_INTEGRATED_MODEL_MVO2_REFERENCE_V1_ID,
    methodId: MAIN_WIRE_INTEGRATED_MODEL_MVO2_METHOD_V1_ID,
    status: "available" as const,
    ventricleId: "LV" as const,
    pvaSource: Object.freeze({
      outputId: input.pvaOutputId,
      methodId: input.pvaMethodId,
      pvaEstimateJ: input.pvaEstimateJ,
      pvaEstimateMmHgMl,
      pvaEstimateMmHgMlPer100G,
    }),
    coefficientMapping: MAIN_WIRE_INTEGRATED_MODEL_MVO2_COEFFICIENT_MAPPING_V1,
    massReference: MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_MASS_REFERENCE_V1,
    heartRateBpm: input.heartRateBpm,
    oxygenDemand: Object.freeze({
      pvaDependentMlO2PerBeat,
      unloadedMlO2PerBeat,
      totalMlO2PerBeat,
      totalMlO2PerBeatPer100G,
      totalMlO2PerMinPer100G,
    }),
    limitations: Object.freeze([
      "canine-coefficients-used-as-literature-estimate",
      "input-pva-method-does-not-reproduce-coefficient-source-protocol",
      "model-defined-lvfw-plus-septum-mass-allocation",
      "contractility-dependent-intercept-not-recalibrated",
      "does-not-model-crossbridge-calcium-or-basal-metabolism",
    ] as const),
    interpretation: Object.freeze({
      literatureEstimateAvailable: true as const,
      pvaInputIsScenarioSpecific: true as const,
      pvaDefinitionReproducesCoefficientSourceProtocol: false as const,
      modelSpecificCalibrationEstablished: false as const,
      measuredOxygenConsumption: false as const,
      clinicalDecisionSupport: false as const,
      wholeHeartEstimateAvailable: false as const,
    }),
  });
}
