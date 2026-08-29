export const LAND2017_SOURCE_ID = "land2017-human-contraction";
export const LAND2017_SOURCE_DOI = "10.1016/j.yjmcc.2017.03.008";
export const LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID =
  "land2017-intact-human-37c-source-v1";
export const LAND2017_SKINNED_HUMAN_37C_SOURCE_PARAMETER_SET_V1_ID =
  "land2017-skinned-human-37c-source-v1";
export const LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1_ID =
  "land2017-intact-human-37c-whole-organ-column-v1";

export type Land2017RuntimeParameters = {
  readonly kTRPN: number;
  readonly nTRPN: number;
  readonly CaT50Ref: number;
  readonly ku: number;
  readonly nTm: number;
  readonly TRPN50: number;
  readonly kuw: number;
  readonly kws: number;
  readonly rw: number;
  readonly rs: number;
  readonly gammaS: number;
  readonly gammaW: number;
  readonly phi: number;
  readonly Aeff: number;
  readonly beta0: number;
  readonly beta1: number;
  readonly Tref: number;
  readonly temperatureK: number;
};

export type Land2017DerivedParameters = {
  readonly kb: number;
  readonly Aw: number;
  readonly As: number;
  readonly kwu: number;
  readonly ksu: number;
  readonly cw: number;
  readonly cs: number;
};

export type Land2017SourceParameterName = keyof Land2017RuntimeParameters;
export type Land2017DerivedParameterName = keyof Land2017DerivedParameters;

export type Land2017SourceParameterProvenance = {
  readonly parameter: Land2017SourceParameterName;
  readonly sourceId: typeof LAND2017_SOURCE_ID;
  readonly doi: typeof LAND2017_SOURCE_DOI;
  readonly location: string;
  readonly original: {
    readonly value: number;
    readonly unit: string;
  };
  readonly runtime: {
    readonly value: number;
    readonly unit: string;
  };
};

export type Land2017DerivedParameterProvenance = {
  readonly parameter: Land2017DerivedParameterName;
  readonly sourceId: typeof LAND2017_SOURCE_ID;
  readonly doi: typeof LAND2017_SOURCE_DOI;
  readonly location: string;
  readonly runtimeUnit: string;
};

/**
 * Research-only reduced-order exit from the strongly bound population once
 * the thin filament is deactivated. This is not part of Land et al. (2017),
 * so its identity and lack of source provenance are carried explicitly.
 */
export type Land2017StrongBridgeDeactivationExitExtensionV1 = Readonly<{
  readonly extensionId: "land2017-strong-bridge-deactivation-exit-v1";
  readonly maximumRatePerSec: number;
  readonly calciumTroponinGate:
    "TRPN50-power-over-TRPN50-power-plus-CaTRPN-power";
  readonly cooperativeGatePower: 1 | 2;
  readonly deactivationDirectionGate:
    | "none"
    | "relative-CaTRPN-relaxation-excess";
  readonly strongPopulationGate:
    | "none"
    | "positive-excess-over-zero-distortion-equilibrium";
  readonly exitDestination: "blocked" | "unbound";
  readonly sourceIdentityClaimed: false;
}>;

export type Land2017SourceParameterSet = {
  readonly parameterSetId: string;
  readonly parameterSetStableHash: string;
  readonly sourceId: typeof LAND2017_SOURCE_ID;
  readonly doi: typeof LAND2017_SOURCE_DOI;
  readonly values: Land2017RuntimeParameters;
  readonly derived: Land2017DerivedParameters;
  readonly sourceParameters: readonly Land2017SourceParameterProvenance[];
  readonly derivedParameters: readonly Land2017DerivedParameterProvenance[];
  readonly strongBridgeDeactivationExit?:
    Land2017StrongBridgeDeactivationExitExtensionV1;
};

const runtimeValues: Land2017RuntimeParameters = {
  kTRPN: 100,
  nTRPN: 2,
  CaT50Ref: 0.805,
  ku: 1000,
  nTm: 5,
  TRPN50: 0.35,
  kuw: 182,
  kws: 12,
  rw: 0.5,
  rs: 0.25,
  gammaS: 8.5,
  gammaW: 615,
  phi: 2.23,
  Aeff: 25,
  beta0: 2.3,
  beta1: -2.4,
  Tref: 40500,
  temperatureK: 310.15,
};

const sourceParameters: readonly Land2017SourceParameterProvenance[] = [
  sourceParameter("kTRPN", 0.1, "1/ms", runtimeValues.kTRPN, "1/s", "Appendix B model parameters table, intact-human value; Eq 47"),
  sourceParameter("nTRPN", 2, "dimensionless", runtimeValues.nTRPN, "dimensionless", "Appendix B model parameters table, intact-human value; Eq 47"),
  sourceParameter("CaT50Ref", 0.805, "uM", runtimeValues.CaT50Ref, "uM", "Appendix B model parameters table, intact-human value; Eqs 29-31 and 47"),
  sourceParameter("ku", 1, "1/ms", runtimeValues.ku, "1/s", "Appendix B model parameters table, intact-human value; Eqs 48 and 61"),
  sourceParameter("nTm", 5, "dimensionless", runtimeValues.nTm, "dimensionless", "Appendix B model parameters table, intact-human value; Eqs 48 and 61"),
  sourceParameter("TRPN50", 0.35, "dimensionless", runtimeValues.TRPN50, "dimensionless", "Appendix B model parameters table, intact-human value; Eq 61"),
  sourceParameter("kuw", 0.182, "1/ms", runtimeValues.kuw, "1/s", "Appendix B model parameters table, intact-human value; Eqs 49, 59, and 62"),
  sourceParameter("kws", 0.012, "1/ms", runtimeValues.kws, "1/s", "Appendix B model parameters table, intact-human value; Eqs 49, 50, 60, and 63"),
  sourceParameter("rw", 0.5, "dimensionless", runtimeValues.rw, "dimensionless", "Appendix B model parameters table, intact-human value; Eqs 58-60 and 62-63"),
  sourceParameter("rs", 0.25, "dimensionless", runtimeValues.rs, "dimensionless", "Appendix B model parameters table, intact-human value; Eqs 53, 58, 60, and 63"),
  sourceParameter("gammaS", 0.0085, "1/ms", runtimeValues.gammaS, "1/s", "Appendix B model parameters table, intact-human value; Eq 57"),
  sourceParameter("gammaW", 0.615, "1/ms", runtimeValues.gammaW, "1/s", "Appendix B model parameters table, intact-human value; Eq 56"),
  sourceParameter("phi", 2.23, "dimensionless", runtimeValues.phi, "dimensionless", "Appendix B model parameters table, intact-human value; Eqs 62-63"),
  sourceParameter("Aeff", 25, "dimensionless", runtimeValues.Aeff, "dimensionless", "Appendix B model parameters table, intact-human value; Eq 58"),
  sourceParameter("beta0", 2.3, "dimensionless", runtimeValues.beta0, "dimensionless", "Appendix B model parameters table, intact-human value; Eqs 29-31"),
  sourceParameter("beta1", -2.4, "uM", runtimeValues.beta1, "uM", "Appendix B model parameters table, intact-human value; Eqs 29-31"),
  sourceParameter("Tref", 40.5, "kPa", runtimeValues.Tref, "Pa", "Appendix B model parameters table, cellular source value; Eq 53"),
  sourceParameter("temperatureK", 37, "degC", runtimeValues.temperatureK, "K", "Appendix B model parameters context, intact-human 37 C source condition"),
];

const derivedParameters: readonly Land2017DerivedParameterProvenance[] = [
  derivedParameter("kb", "Appendix A Eq 61; uses TRPN50 as defined by Eq 22", "1/s"),
  derivedParameter("Aw", "Appendix A Eq 58", "dimensionless"),
  derivedParameter("As", "Appendix A Eq 58", "dimensionless"),
  derivedParameter("kwu", "Appendix A Eq 59", "1/s"),
  derivedParameter("ksu", "Appendix A Eq 60", "1/s"),
  derivedParameter("cw", "Appendix A Eq 62", "1/s"),
  derivedParameter("cs", "Appendix A Eq 63", "1/s"),
];

const parameterSetHashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> = {
  parameterSetId: LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
  sourceId: LAND2017_SOURCE_ID,
  doi: LAND2017_SOURCE_DOI,
  values: runtimeValues,
  derived: deriveLand2017DerivedParameters(runtimeValues),
  sourceParameters,
  derivedParameters,
};

export const LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET: Land2017SourceParameterSet = deepFreeze({
  ...parameterSetHashInput,
  parameterSetStableHash: stableHash(parameterSetHashInput),
});

/**
 * Appendix-B skinned-cell column used to fit the force-calcium, quick-stretch,
 * and constant-velocity-shortening experiments.  The historical intact source
 * set above selects the later intact/whole-organ kinetic column while retaining
 * the cellular Tref; keeping this separate prevents the two experimental
 * contexts from being conflated in constitutive validation.
 */
const skinnedRuntimeValues: Land2017RuntimeParameters = {
  ...runtimeValues,
  CaT50Ref: 2.5,
  nTm: 2.2,
  kuw: 26,
  kws: 4,
  Tref: 40_500,
};

const skinnedOriginalValueOverrides: Readonly<Partial<Record<
  Land2017SourceParameterName,
  number
>>> = Object.freeze({
  CaT50Ref: 2.5,
  nTm: 2.2,
  kuw: 0.026,
  kws: 0.004,
  Tref: 40.5,
});

const skinnedSourceParameters: readonly Land2017SourceParameterProvenance[] =
  sourceParameters.map((entry) => sourceParameter(
    entry.parameter,
    skinnedOriginalValueOverrides[entry.parameter] ?? entry.original.value,
    entry.original.unit,
    skinnedRuntimeValues[entry.parameter],
    entry.runtime.unit,
    entry.location
      .replace("intact-human value", "skinned-model value")
      .replace("cellular source value", "skinned-model value")
      .replace(
        "intact-human 37 C source condition",
        "skinned-human 37 C source condition",
      ),
  ));

const skinnedParameterSetHashInput: Omit<
  Land2017SourceParameterSet,
  "parameterSetStableHash"
> = {
  parameterSetId: LAND2017_SKINNED_HUMAN_37C_SOURCE_PARAMETER_SET_V1_ID,
  sourceId: LAND2017_SOURCE_ID,
  doi: LAND2017_SOURCE_DOI,
  values: skinnedRuntimeValues,
  derived: deriveLand2017DerivedParameters(skinnedRuntimeValues),
  sourceParameters: skinnedSourceParameters,
  derivedParameters,
};

export const LAND2017_SKINNED_HUMAN_37C_SOURCE_PARAMETER_SET_V1:
  Land2017SourceParameterSet = deepFreeze({
    ...skinnedParameterSetHashInput,
    parameterSetStableHash: stableHash(skinnedParameterSetHashInput),
  });

/**
 * Land et al. publish distinct Tref values for the skinned-cell and whole-organ
 * contexts.  The historical parameter set above deliberately retains the
 * 40.5 kPa cellular value.  This second immutable source set selects the
 * Appendix-B 120 kPa whole-organ column without hiding the change in a chamber
 * pressure gain, calcium amplitude, orientation factor, or viability factor.
 */
const wholeOrganRuntimeValues: Land2017RuntimeParameters = {
  ...runtimeValues,
  Tref: 120_000,
};

const wholeOrganSourceParameters: readonly Land2017SourceParameterProvenance[] =
  sourceParameters.map((entry) => entry.parameter === "Tref"
    ? sourceParameter(
      "Tref",
      120,
      "kPa",
      wholeOrganRuntimeValues.Tref,
      "Pa",
      "Appendix B model parameters table, whole-organ model column; Eq 53",
    )
    : Object.freeze({
      ...entry,
      original: Object.freeze({ ...entry.original }),
      runtime: Object.freeze({ ...entry.runtime }),
    }));

const wholeOrganParameterSetHashInput: Omit<
  Land2017SourceParameterSet,
  "parameterSetStableHash"
> = {
  parameterSetId: LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1_ID,
  sourceId: LAND2017_SOURCE_ID,
  doi: LAND2017_SOURCE_DOI,
  values: wholeOrganRuntimeValues,
  derived: deriveLand2017DerivedParameters(wholeOrganRuntimeValues),
  sourceParameters: wholeOrganSourceParameters,
  derivedParameters,
};

export const LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1:
  Land2017SourceParameterSet = deepFreeze({
    ...wholeOrganParameterSetHashInput,
    parameterSetStableHash: stableHash(wholeOrganParameterSetHashInput),
  });

export function deriveLand2017DerivedParameters(
  values: Land2017RuntimeParameters,
): Land2017DerivedParameters {
  const kbDenominator = 1 - values.rs - (1 - values.rs) * values.rw;
  const awDenominator = (1 - values.rs) * values.rw + values.rs;
  const cwDenominator = (1 - values.rs) * values.rw;

  if (kbDenominator <= 0) throw new Error("Land 2017 Eq 61 denominator must be positive");
  if (awDenominator <= 0) throw new Error("Land 2017 Eq 58 denominator must be positive");
  if (cwDenominator <= 0) throw new Error("Land 2017 Eq 62 denominator must be positive");

  const kb = (values.ku * Math.pow(values.TRPN50, values.nTm)) / kbDenominator;
  const Aw = (values.Aeff * values.rs) / awDenominator;

  return {
    kb,
    Aw,
    As: Aw,
    kwu: values.kuw * (1 / values.rw - 1) - values.kws,
    ksu: values.kws * values.rw * (1 / values.rs - 1),
    cw: (values.phi * values.kuw * ((1 - values.rs) * (1 - values.rw))) / cwDenominator,
    cs: (values.phi * values.kws * ((1 - values.rs) * values.rw)) / values.rs,
  };
}

export function land2017ParameterSetHashInput(parameterSet: Land2017SourceParameterSet): unknown {
  return {
    parameterSetId: parameterSet.parameterSetId,
    sourceId: parameterSet.sourceId,
    doi: parameterSet.doi,
    values: parameterSet.values,
    derived: parameterSet.derived,
    sourceParameters: parameterSet.sourceParameters,
    derivedParameters: parameterSet.derivedParameters,
    ...(parameterSet.strongBridgeDeactivationExit === undefined
      ? {}
      : {
        strongBridgeDeactivationExit:
          parameterSet.strongBridgeDeactivationExit,
      }),
  };
}

export function stableHash(value: unknown): string {
  const text = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function sourceParameter(
  parameter: Land2017SourceParameterName,
  originalValue: number,
  originalUnit: string,
  runtimeValue: number,
  runtimeUnit: string,
  location: string,
): Land2017SourceParameterProvenance {
  return {
    parameter,
    sourceId: LAND2017_SOURCE_ID,
    doi: LAND2017_SOURCE_DOI,
    location,
    original: {
      value: originalValue,
      unit: originalUnit,
    },
    runtime: {
      value: runtimeValue,
      unit: runtimeUnit,
    },
  };
}

function derivedParameter(
  parameter: Land2017DerivedParameterName,
  location: string,
  runtimeUnit: string,
): Land2017DerivedParameterProvenance {
  return {
    parameter,
    sourceId: LAND2017_SOURCE_ID,
    doi: LAND2017_SOURCE_DOI,
    location,
    runtimeUnit,
  };
}

function stableStringify(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("stableStringify cannot encode non-finite numbers");
    return JSON.stringify(value);
  }
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).filter((key) => record[key] !== undefined).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
  }
  throw new Error(`stableStringify cannot encode ${typeof value}`);
}

function deepFreeze<T extends object>(value: T): T {
  Object.freeze(value);
  for (const child of Object.values(value)) {
    if (child && typeof child === "object" && !Object.isFrozen(child)) {
      deepFreeze(child as Record<string, unknown>);
    }
  }
  return value;
}
