import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  deriveLand2017DerivedParameters,
  stableHash,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const LAND2017_HUMAN_ATRIAL_LITERATURE_PRIOR_V1_ID =
  "land-niederer-2018-human-atrial-literature-prior-v1" as const;
export const LAND2017_HUMAN_ATRIAL_PRIOR_DOI = "10.1002/cnm.2931" as const;

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
