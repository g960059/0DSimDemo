import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  deriveLand2017DerivedParameters,
  stableHash,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017";

export const LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_SET_ID =
  "land-niederer-2018-human-atrial-literature-prior-v1" as const;
export const LAND_NIEDERER_2018_ATRIAL_CALIBRATION_SOURCE_ID =
  "land-niederer2018-atrial-contraction" as const;
export const LAND_NIEDERER_2018_ATRIAL_CALIBRATION_DOI =
  "10.1002/cnm.2931" as const;

/**
 * Literature-informed atrial prior for the tracked Land 2017 source equations.
 *
 * This is deliberately not labelled a source parameter set or a patient fit.
 * The equation source remains Land et al. 2017; the two atrial overrides are
 * recorded separately because the base source-parameter table cannot honestly
 * attribute them to the ventricular source paper.
 */
export type LandNiederer2018AtrialParameterPackV1 = {
  readonly parameterPackId:
    typeof LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_SET_ID;
  readonly equationSourceDoi: "10.1016/j.yjmcc.2017.03.008";
  readonly atrialCalibrationSourceId:
    typeof LAND_NIEDERER_2018_ATRIAL_CALIBRATION_SOURCE_ID;
  readonly atrialCalibrationDoi:
    typeof LAND_NIEDERER_2018_ATRIAL_CALIBRATION_DOI;
  readonly atrialCalibrationLocation: "Section 2.7 and Section 3.2";
  readonly parameterPackStableHash: string;
  readonly baseEquationParameterSetStableHash: string;
  readonly scope:
    "human-atrial-literature-prior-not-normal-reference-or-patient-fit";
  readonly overrides: readonly [
    {
      readonly parameter: "CaT50Ref";
      readonly value: 0.86;
      readonly unit: "uM";
    },
    {
      readonly parameter: "kws";
      readonly value: 36;
      readonly unit: "1/s";
      readonly rule: "xi-times-ventricular-crossbridge-cycling-rate";
      readonly xi: 3;
    },
  ];
  readonly calciumContext: {
    readonly diastolicUM: 0.1;
    readonly peakUM: 0.6;
    readonly concentrationStatus:
      "land-niederer-assumed-range-for-uncalibrated-brixius-shape";
  };
  readonly crossbridgeCyclingMapping: {
    readonly literatureXi: 3;
    readonly sourceStatement: "xi-scales-kws-and-ksu";
    readonly runtimeMapping:
      "scale-source-kws-then-recompute-land2017-derived-rates";
    readonly derivedKsuScale: 3;
  };
  readonly effectiveParameterProvenance: readonly {
    readonly parameter: "CaT50Ref" | "kws" | "ksu" | "kwu" | "cs" | "cw";
    readonly baseValue: number;
    readonly effectiveValue: number;
    readonly unit: "uM" | "1/s";
    readonly ownership:
      | "direct-land-niederer-override"
      | "land2017-derived-relation-after-atrial-override";
    readonly sourceId: string;
    readonly doi: string;
    readonly location: string;
  }[];
  readonly provenanceBoundary: {
    readonly baseSourceParameterRowsDescribeVentricularSourceValues: true;
    readonly atrialOverridesOwnedByThisPackMetadata: true;
    readonly genericSourceRowsMustNotBeReadAsEffectiveAtrialProvenance: true;
    readonly experimentalTargetFitIncluded: false;
  };
  readonly effectiveEquationParameters: Land2017SourceParameterSet;
};

const base = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
const values = Object.freeze({
  ...base.values,
  CaT50Ref: 0.86,
  kws: 3 * base.values.kws,
});
const derived = Object.freeze(deriveLand2017DerivedParameters(values));
const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> = {
  parameterSetId: LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_SET_ID,
  sourceId: base.sourceId,
  doi: base.doi,
  values,
  derived,
  sourceParameters: base.sourceParameters,
  derivedParameters: base.derivedParameters,
};

const effectiveEquationParameters: Land2017SourceParameterSet = Object.freeze({
  ...hashInput,
  parameterSetStableHash: stableHash(hashInput),
});
const effectiveParameterProvenance = Object.freeze([
  Object.freeze({
    parameter: "CaT50Ref" as const,
    baseValue: base.values.CaT50Ref,
    effectiveValue: values.CaT50Ref,
    unit: "uM" as const,
    ownership: "direct-land-niederer-override" as const,
    sourceId: LAND_NIEDERER_2018_ATRIAL_CALIBRATION_SOURCE_ID,
    doi: LAND_NIEDERER_2018_ATRIAL_CALIBRATION_DOI,
    location: "Section 2.7",
  }),
  Object.freeze({
    parameter: "kws" as const,
    baseValue: base.values.kws,
    effectiveValue: values.kws,
    unit: "1/s" as const,
    ownership: "direct-land-niederer-override" as const,
    sourceId: LAND_NIEDERER_2018_ATRIAL_CALIBRATION_SOURCE_ID,
    doi: LAND_NIEDERER_2018_ATRIAL_CALIBRATION_DOI,
    location: "Section 2.7",
  }),
  derivedRateProvenance("ksu", base.derived.ksu, derived.ksu, "Appendix A Eq 60"),
  derivedRateProvenance("kwu", base.derived.kwu, derived.kwu, "Appendix A Eq 59"),
  derivedRateProvenance("cs", base.derived.cs, derived.cs, "Appendix A Eq 63"),
  derivedRateProvenance("cw", base.derived.cw, derived.cw, "Appendix A Eq 62"),
]);
const parameterPackStableHash = stableHash({
  parameterPackId: LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_SET_ID,
  baseEquationParameterSetStableHash: base.parameterSetStableHash,
  atrialCalibrationSourceId:
    LAND_NIEDERER_2018_ATRIAL_CALIBRATION_SOURCE_ID,
  atrialCalibrationDoi: LAND_NIEDERER_2018_ATRIAL_CALIBRATION_DOI,
  atrialCalibrationLocation: "Section 2.7 and Section 3.2",
  effectiveParameterProvenance,
});

export const LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1:
LandNiederer2018AtrialParameterPackV1 = Object.freeze({
  parameterPackId:
    LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_SET_ID,
  equationSourceDoi: base.doi,
  atrialCalibrationSourceId:
    LAND_NIEDERER_2018_ATRIAL_CALIBRATION_SOURCE_ID,
  atrialCalibrationDoi: LAND_NIEDERER_2018_ATRIAL_CALIBRATION_DOI,
  atrialCalibrationLocation: "Section 2.7 and Section 3.2",
  parameterPackStableHash,
  baseEquationParameterSetStableHash: base.parameterSetStableHash,
  scope: "human-atrial-literature-prior-not-normal-reference-or-patient-fit",
  overrides: Object.freeze([
    Object.freeze({
      parameter: "CaT50Ref",
      value: 0.86,
      unit: "uM",
    }),
    Object.freeze({
      parameter: "kws",
      value: 36,
      unit: "1/s",
      rule: "xi-times-ventricular-crossbridge-cycling-rate",
      xi: 3,
    }),
  ] as const),
  calciumContext: Object.freeze({
    diastolicUM: 0.1,
    peakUM: 0.6,
    concentrationStatus:
      "land-niederer-assumed-range-for-uncalibrated-brixius-shape",
  }),
  crossbridgeCyclingMapping: Object.freeze({
    literatureXi: 3,
    sourceStatement: "xi-scales-kws-and-ksu",
    runtimeMapping: "scale-source-kws-then-recompute-land2017-derived-rates",
    derivedKsuScale: 3,
  }),
  effectiveParameterProvenance,
  provenanceBoundary: Object.freeze({
    baseSourceParameterRowsDescribeVentricularSourceValues: true,
    atrialOverridesOwnedByThisPackMetadata: true,
    genericSourceRowsMustNotBeReadAsEffectiveAtrialProvenance: true,
    experimentalTargetFitIncluded: false,
  }),
  effectiveEquationParameters,
});

function derivedRateProvenance(
  parameter: "ksu" | "kwu" | "cs" | "cw",
  baseValue: number,
  effectiveValue: number,
  location: string,
) {
  return Object.freeze({
    parameter,
    baseValue,
    effectiveValue,
    unit: "1/s" as const,
    ownership: "land2017-derived-relation-after-atrial-override" as const,
    sourceId: base.sourceId,
    doi: base.doi,
    location,
  });
}
