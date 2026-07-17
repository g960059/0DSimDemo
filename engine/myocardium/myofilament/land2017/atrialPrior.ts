import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  deriveLand2017DerivedParameters,
  stableHash,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const LAND2017_HUMAN_ATRIAL_LITERATURE_PRIOR_V1_ID =
  "land-niederer-2018-human-atrial-literature-prior-v1" as const;
export const LAND2017_HUMAN_ATRIAL_PRIOR_DOI = "10.1002/cnm.2931" as const;
export const LEWALLE_2026_HUMAN_ATRIAL_FORCE_SCALE_DOI =
  "10.1016/j.yjmcc.2025.12.001" as const;
export const LAND2017_HUMAN_ATRIAL_LEWALLE_FORCE_SCALE_V1_ID =
  "land-human-atrial-kinetics-lewalle-force-scale-v1" as const;

const LEWALLE_2026_CENTRAL_MAXIMUM_ACTIVE_STRESS_PA = 11_600;
const LAND_ATRIAL_SATURATION_FACTOR_AT_PCA_4P5 = 0.9947560056040118;

const base = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
const values = Object.freeze({
  ...base.values,
  CaT50Ref: 0.86,
  // Land & Niederer report xi=3 for atrial crossbridge cycling; applying it
  // to the source kws and recomputing all derived rates preserves the Land
  // algebra rather than independently tuning ksu/cs/kwu/cw.
  kws: 3 * base.values.kws,
});
const derived = Object.freeze(deriveLand2017DerivedParameters(values));
const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> = {
  parameterSetId: LAND2017_HUMAN_ATRIAL_LITERATURE_PRIOR_V1_ID,
  sourceId: base.sourceId,
  doi: base.doi,
  values,
  derived,
  sourceParameters: base.sourceParameters,
  derivedParameters: base.derivedParameters,
};

export const LAND2017_HUMAN_ATRIAL_EFFECTIVE_PARAMETER_SET_V1:
  Land2017SourceParameterSet = Object.freeze({
    ...hashInput,
    parameterSetStableHash: stableHash(hashInput),
  });

const lewalleValues = Object.freeze({
  ...values,
  Tref:
    LEWALLE_2026_CENTRAL_MAXIMUM_ACTIVE_STRESS_PA /
    LAND_ATRIAL_SATURATION_FACTOR_AT_PCA_4P5,
});
const lewalleHashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> = {
  parameterSetId: LAND2017_HUMAN_ATRIAL_LEWALLE_FORCE_SCALE_V1_ID,
  sourceId: base.sourceId,
  doi: base.doi,
  values: lewalleValues,
  derived,
  sourceParameters: base.sourceParameters.map((entry) => entry.parameter === "Tref"
    ? Object.freeze({
      ...entry,
      location:
        `${entry.location}; runtime Tref maps the Lewalle et al. human-LA ` +
        `37 C pCa 4.5 central active stress through the executed Land saturation factor`,
      runtime: Object.freeze({ ...entry.runtime, value: lewalleValues.Tref }),
    })
    : entry),
  derivedParameters: base.derivedParameters,
};

/**
 * One LA-derived atrial tissue class shared by LA and RA.  Only Tref differs
 * from the Land-Niederer atrial kinetic prior.  RA use is an explicit
 * extrapolation; no chamber pressure, calcium, orientation, or PV-loop gain is
 * introduced.
 */
export const LAND2017_HUMAN_ATRIAL_LEWALLE_FORCE_SCALE_PARAMETER_SET_V1:
  Land2017SourceParameterSet = Object.freeze({
    ...lewalleHashInput,
    parameterSetStableHash: stableHash(lewalleHashInput),
  });

export const LAND2017_HUMAN_ATRIAL_LITERATURE_PRIOR_V1 = Object.freeze({
  priorId: LAND2017_HUMAN_ATRIAL_LITERATURE_PRIOR_V1_ID,
  equationSourceDoi: base.doi,
  atrialPriorDoi: LAND2017_HUMAN_ATRIAL_PRIOR_DOI,
  atrialPriorLocation: "Sections 2.7 and 3.2" as const,
  scope: "human-atrial-literature-prior-not-normal-reference-or-patient-fit" as const,
  directOverrides: Object.freeze({
    CaT50RefUM: 0.86,
    crossbridgeCyclingScaleXi: 3,
  }),
  calciumContextUM: Object.freeze({ diastolic: 0.1, peak: 0.6 }),
  effectiveParameterSetStableHash:
    LAND2017_HUMAN_ATRIAL_EFFECTIVE_PARAMETER_SET_V1.parameterSetStableHash,
  effectiveEquationParameters:
    LAND2017_HUMAN_ATRIAL_EFFECTIVE_PARAMETER_SET_V1,
  shapeFitIncluded: false as const,
});

export const LAND2017_HUMAN_ATRIAL_LEWALLE_FORCE_SCALE_PRIOR_V1 = Object.freeze({
  priorId: LAND2017_HUMAN_ATRIAL_LEWALLE_FORCE_SCALE_V1_ID,
  activeEquationSourceDoi: base.doi,
  atrialKineticsSourceDoi: LAND2017_HUMAN_ATRIAL_PRIOR_DOI,
  forceScaleSourceDoi: LEWALLE_2026_HUMAN_ATRIAL_FORCE_SCALE_DOI,
  forceScalePreparation: "chemically-permeabilized-human-left-atrial-fiber-37C" as const,
  sourcePca: 4.5,
  sourceFreeCalciumUM: Math.pow(10, 6 - 4.5),
  sourceCentralMaximumActiveStressPa:
    LEWALLE_2026_CENTRAL_MAXIMUM_ACTIVE_STRESS_PA,
  executedLandSaturationFactorAtLambdaOne:
    LAND_ATRIAL_SATURATION_FACTOR_AT_PCA_4P5,
  mappedTrefPa: lewalleValues.Tref,
  changedPrimitiveParameters: Object.freeze(["Tref"] as const),
  sharedBy: Object.freeze(["LA", "RA"] as const),
  rightAtriumEvidenceBoundary:
    "human-LA-derived-force-scale-extrapolated-to-RA" as const,
  calciumWaveformFitIncluded: false as const,
  chamberPressureGainIncluded: false as const,
  pvLoopShapeFitIncluded: false as const,
  effectiveParameterSetStableHash:
    LAND2017_HUMAN_ATRIAL_LEWALLE_FORCE_SCALE_PARAMETER_SET_V1
      .parameterSetStableHash,
});
