import { EXACT_LAND_SEMISMOOTH_POLICY_V1_ID } from "@/engine/myocardium/fourChamberV1/ids";

export type SemismoothEvaluation<Branch extends string> = {
  readonly value: number;
  readonly generalizedDerivative: number;
  readonly activeBranch: Branch;
};

export const EXACT_LAND_SEMISMOOTH_POLICY_V1 = Object.freeze({
  id: EXACT_LAND_SEMISMOOTH_POLICY_V1_ID,
  upperMinimumTieBranch: "capped",
  positivePartTieBranch: "zero",
  absoluteValueAtZeroDerivative: 0,
  gammaSuPlateauBoundaryDerivative: 0,
  activeSetReevaluation: "every Newton and line-search trial",
  smoothingPermitted: false,
} as const);

export function evaluateUpperMinimumV1(
  value: number,
  cap: number,
): SemismoothEvaluation<"uncapped" | "capped"> {
  requireFinite(value, "value");
  requireFinite(cap, "cap");
  if (value < cap) {
    return Object.freeze({ value, generalizedDerivative: 1, activeBranch: "uncapped" });
  }
  return Object.freeze({ value: cap, generalizedDerivative: 0, activeBranch: "capped" });
}

export function evaluatePositivePartV1(
  value: number,
): SemismoothEvaluation<"zero" | "positive"> {
  requireFinite(value, "value");
  if (value > 0) {
    return Object.freeze({ value, generalizedDerivative: 1, activeBranch: "positive" });
  }
  return Object.freeze({ value: 0, generalizedDerivative: 0, activeBranch: "zero" });
}

export function evaluateAbsoluteValueV1(
  value: number,
): SemismoothEvaluation<"negative" | "zero" | "positive"> {
  requireFinite(value, "value");
  if (value < 0) {
    return Object.freeze({ value: -value, generalizedDerivative: -1, activeBranch: "negative" });
  }
  if (value > 0) {
    return Object.freeze({ value, generalizedDerivative: 1, activeBranch: "positive" });
  }
  return Object.freeze({ value: 0, generalizedDerivative: 0, activeBranch: "zero" });
}

export function evaluateLandGammaSuV1(
  zetaS: number,
  gammaS: number,
): SemismoothEvaluation<"negative-unbinding" | "plateau" | "positive-unbinding"> {
  requireFinite(zetaS, "zetaS");
  requireNonNegativeFinite(gammaS, "gammaS");
  if (zetaS < -1) {
    const value = gammaS * (-zetaS - 1);
    requireDerivedFinite(value, "Land gammaSu negative-branch value");
    return Object.freeze({
      value,
      generalizedDerivative: -gammaS,
      activeBranch: "negative-unbinding",
    });
  }
  if (zetaS > 0) {
    const value = gammaS * zetaS;
    requireDerivedFinite(value, "Land gammaSu positive-branch value");
    return Object.freeze({
      value,
      generalizedDerivative: gammaS,
      activeBranch: "positive-unbinding",
    });
  }
  return Object.freeze({ value: 0, generalizedDerivative: 0, activeBranch: "plateau" });
}

export function evaluateLandCaTrpnInversePowerCapV1(
  caTrpn: number,
  nTm: number,
  cap = 100,
): SemismoothEvaluation<"uncapped" | "capped"> {
  requirePositiveFinite(caTrpn, "caTrpn");
  requirePositiveFinite(nTm, "nTm");
  requirePositiveFinite(cap, "cap");
  const exponent = -nTm / 2;
  const raw = Math.pow(caTrpn, exponent);
  if (!Number.isFinite(raw)) throw new Error("caTrpn inverse-power branch must be finite");
  if (raw >= cap) {
    return Object.freeze({ value: cap, generalizedDerivative: 0, activeBranch: "capped" });
  }
  const generalizedDerivative = exponent * Math.pow(caTrpn, exponent - 1);
  requireDerivedFinite(generalizedDerivative, "CaTRPN inverse-power generalized derivative");
  return Object.freeze({
    value: raw,
    generalizedDerivative,
    activeBranch: "uncapped",
  });
}

export type LandLengthDependenceEvaluationV1 = {
  readonly landStretch: number;
  readonly cappedLandStretch: number;
  readonly caT50UM: number;
  readonly caT50DerivativeByLandStretchUM: number;
  readonly lengthFactor: number;
  readonly lengthFactorDerivativeByLandStretch: number;
  readonly stretchCapBranch: "uncapped" | "capped";
  readonly inner087CapBranch: "uncapped" | "capped";
  readonly positiveLengthFactorBranch: "zero" | "positive";
};

export function evaluateLandLengthDependenceV1(
  landStretch: number,
  caT50RefUM: number,
  beta0: number,
  beta1UM: number,
): LandLengthDependenceEvaluationV1 {
  requirePositiveFinite(landStretch, "landStretch");
  requirePositiveFinite(caT50RefUM, "caT50RefUM");
  requireFinite(beta0, "beta0");
  requireFinite(beta1UM, "beta1UM");
  const stretchCap = evaluateUpperMinimumV1(landStretch, 1.2);
  const inner087Cap = evaluateUpperMinimumV1(stretchCap.value, 0.87);
  const caT50UM = caT50RefUM + beta1UM * (stretchCap.value - 1);
  const h0 = 1 + beta0 * (stretchCap.value + inner087Cap.value - 1.87);
  const positiveLengthFactor = evaluatePositivePartV1(h0);
  const cappedStretchDerivative = stretchCap.generalizedDerivative;
  const h0Derivative = beta0 * (
    cappedStretchDerivative
    + inner087Cap.generalizedDerivative * cappedStretchDerivative
  );
  requireDerivedFinite(h0Derivative, "Land length-factor inner derivative");
  const lengthFactorDerivativeByLandStretch =
    positiveLengthFactor.generalizedDerivative === 0 || h0Derivative === 0
      ? 0
      : positiveLengthFactor.generalizedDerivative * h0Derivative;
  const caT50DerivativeByLandStretchUM = cappedStretchDerivative === 0
    ? 0
    : beta1UM * cappedStretchDerivative;
  requireDerivedFinite(
    lengthFactorDerivativeByLandStretch,
    "Land length-factor derivative",
  );
  requireDerivedFinite(
    caT50DerivativeByLandStretchUM,
    "Land CaT50 derivative",
  );
  if (!Number.isFinite(caT50UM) || caT50UM <= 0) {
    throw new Error("Land CaT50 must remain positive and finite");
  }

  return Object.freeze({
    landStretch,
    cappedLandStretch: stretchCap.value,
    caT50UM,
    caT50DerivativeByLandStretchUM,
    lengthFactor: positiveLengthFactor.value,
    lengthFactorDerivativeByLandStretch,
    stretchCapBranch: stretchCap.activeBranch,
    inner087CapBranch: inner087Cap.activeBranch,
    positiveLengthFactorBranch: positiveLengthFactor.activeBranch,
  });
}

function requireFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
}

function requireNonNegativeFinite(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be non-negative and finite`);
  }
}

function requirePositiveFinite(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
}

function requireDerivedFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) throw new Error(`${field} became non-finite`);
}
