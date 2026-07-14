/**
 * Reduced calcium-to-thin-filament front end for the mechanics2 Hill CE--SEE
 * research model.
 *
 * PRIMARY SOURCE
 * --------------
 * Land S, Park-Holohan S-J, Smith NP, et al. A model of cardiac contraction
 * based on novel measurements of tension development in human cardiomyocytes.
 * J Mol Cell Cardiol. 2017;106:68-83.
 * https://doi.org/10.1016/j.yjmcc.2017.03.008
 *
 * The CaTRPN evolution below is Land et al. Eq. 47, advanced with backward
 * Euler.  The linear CaT50 length dependence is the differentiable branch of
 * Eq. 29 below its source cap lambda=1.2.  Inputs at or above that cap are
 * rejected rather than silently clamped, because min(lambda, 1.2) is not
 * differentiable at the cap.
 *
 * REDUCTION BOUNDARY
 * ------------------
 * Land Eq. 48 gives tropomyosin blocking kinetics.  If that fast state is put
 * at equilibrium and crossbridge populations are deliberately omitted from
 * this front end, its unblocked fraction has the Hill form
 *
 *   g_raw(x) = x^m / (x^m + x50^m),  x = CaTRPN.
 *
 * We divide by g_raw(1) so that activation01=1 at full CaTRPN occupancy.  This
 * normalization lets a separate Hill CE own maximum isometric tension.  It is
 * an explicit reduced-model choice, not an equation copied from Land et al.
 * The opt-in one-state lag below is a dynamic realization of this normalized
 * equilibrium gate.  It is not Land Eq. 48: no blocked-state conservation or
 * W/S crossbridge populations are introduced or claimed.
 * The Land W/S/zeta crossbridge states, calcium inventory, SR, RyR, SERCA,
 * troponin buffering feedback, ATP use, and chemical energy are not modelled.
 */

export const LAND_FORM_CA_TROPONIN_ACTIVATION_CLAIM_V1 = Object.freeze({
  modelId: "land-form-ca-troponin-activation-v1" as const,
  primarySource: "Land et al. J Mol Cell Cardiol. 2017;106:68-83" as const,
  primarySourceDoi: "https://doi.org/10.1016/j.yjmcc.2017.03.008" as const,
  sourceEquations: Object.freeze([
    "Land2017-Eq47-CaTRPN",
    "Land2017-Eq29-linear-CaT50",
  ] as const),
  numericalUpdate: "backward-Euler-closed-form" as const,
  thinFilamentAvailability:
    "normalized-algebraic-reduction-of-fast-Land-Eq48" as const,
  landEquation48Implemented: false as const,
  fullLandModel: false as const,
  prescribedFreeCalciumInput: true as const,
  calciumCyclingModelled: false as const,
  calciumInventoryConserved: false as const,
  troponinBufferingFeedbackToFreeCalcium: false as const,
  activeChemicalEnergyModelled: false as const,
  omittedLandStates: Object.freeze(["B", "W", "S", "zetaW", "zetaS"] as const),
});

export const LAND_FORM_CA_TROPONIN_ACTIVATION_MIDPOINT_CLAIM_V2 = Object.freeze(
  {
    modelId: "land-form-ca-troponin-activation-midpoint-v2" as const,
    primarySource: "Land et al. J Mol Cell Cardiol. 2017;106:68-83" as const,
    primarySourceDoi: "https://doi.org/10.1016/j.yjmcc.2017.03.008" as const,
    sourceEquations: Object.freeze([
      "Land2017-Eq47-CaTRPN",
      "Land2017-Eq29-linear-CaT50",
    ] as const),
    numericalUpdate: "exponential-midpoint-rush-larsen" as const,
    calciumSampling: "interval-midpoint" as const,
    ceStrainSampling: "accepted-to-trial-endpoint-midpoint" as const,
    endpointCeTangentChainFactor: 0.5 as const,
    thinFilamentAvailability:
      "normalized-algebraic-reduction-of-fast-Land-Eq48" as const,
    landEquation48Implemented: false as const,
    fullLandModel: false as const,
    prescribedFreeCalciumInput: true as const,
    calciumCyclingModelled: false as const,
    calciumInventoryConserved: false as const,
    troponinBufferingFeedbackToFreeCalcium: false as const,
    activeChemicalEnergyModelled: false as const,
    omittedLandStates: Object.freeze([
      "B",
      "W",
      "S",
      "zetaW",
      "zetaS",
    ] as const),
  },
);

export const LAND_FORM_NORMALIZED_THIN_FILAMENT_LAG_CLAIM_V1 = Object.freeze({
  modelId: "land-form-normalized-thin-filament-lag-v1" as const,
  equilibriumTarget: "normalized-Land-form-Hill-gate" as const,
  numericalUpdate: "exact-exponential-endpoint-target-hold" as const,
  sourceEquationCopied: false as const,
  landEquation48Implemented: false as const,
  blockedStateConservationModelled: false as const,
  crossbridgePopulationsModelled: false as const,
});

export type LandFormThinFilamentDynamicsParamsV1 =
  | {
      readonly mode: "algebraic-equilibrium";
    }
  | {
      readonly mode: "one-state-normalized-lag";
      /** Relaxation time of normalized availability toward its equilibrium gate. */
      readonly timeConstantSec: number;
    };

export type LandFormCaTroponinActivationStateV1 = {
  /** Fractional regulatory-site occupancy; it must remain inside [0,1]. */
  readonly caTroponin01: number;
  /**
   * Accepted normalized thin-filament availability for the opt-in dynamic
   * reduction.  It is absent in the default algebraic mode so legacy state
   * shape and trajectories remain unchanged.
   */
  readonly thinFilamentAvailability01?: number;
};

export type LandFormCaTroponinActivationParamsV1 = {
  readonly parameterSetId: string;
  /** Land kTRPN, in s^-1. */
  readonly caTroponinRatePerSec: number;
  /** Land nTRPN. */
  readonly caTroponinCooperativity: number;
  /** Land [Ca2+]T50_ref, in micromolar. */
  readonly referenceHalfActivationCalciumUm: number;
  /** Land beta1, in micromolar per unit CE stretch.  Source value is negative. */
  readonly halfActivationLengthSlopeUmPerStretch: number;
  readonly referenceCeStretch: number;
  /** Open upper bound of the differentiable linear branch of Land Eq. 29. */
  readonly maximumLinearCeStretchExclusive: number;
  /** Midpoint of the unnormalized reduced gate, as fractional CaTRPN occupancy. */
  readonly thinFilamentHalfActivation01: number;
  /** Land nTm used by the reduced algebraic availability gate. */
  readonly thinFilamentCooperativity: number;
  /** Omitted means the legacy algebraic-equilibrium gate. */
  readonly thinFilamentDynamics?: LandFormThinFilamentDynamicsParamsV1;
};

declare const PREPARED_LAND_FORM_CA_TROPONIN_PARAMS_V1: unique symbol;

export type PreparedLandFormCaTroponinActivationParamsV1 =
  LandFormCaTroponinActivationParamsV1 & {
    readonly [PREPARED_LAND_FORM_CA_TROPONIN_PARAMS_V1]: true;
  };

const PREPARED_LAND_FORM_CA_TROPONIN_PARAM_OBJECTS_V1 = new WeakSet<object>();

export type LandFormCaTroponinActivationInputV1 = {
  readonly dtSec: number;
  readonly freeCalciumUm: number;
  /** Natural-log CE strain. lambda_CE = exp(contractileElementLogStrain). */
  readonly contractileElementLogStrain: number;
};

export type LandFormCaTroponinActivationMidpointInputV2 = {
  readonly dtSec: number;
  readonly midpointFreeCalciumUm: number;
  readonly previousContractileElementLogStrain: number;
  readonly nextContractileElementLogStrain: number;
};

export type LandFormCaTroponinActivationIssueCodeV1 =
  | "INVALID_PARAMETERS"
  | "INVALID_ACCEPTED_STATE"
  | "INVALID_TRIAL_INPUT"
  | "OUTSIDE_LINEAR_LENGTH_DOMAIN"
  | "NONPOSITIVE_HALF_ACTIVATION_CALCIUM"
  | "NONFINITE_ACTIVATION_OUTPUT"
  | "ACTIVATION_STATE_OUT_OF_BOUNDS";

export type LandFormCaTroponinActivationIssueV1 = {
  readonly code: LandFormCaTroponinActivationIssueCodeV1;
  readonly message: string;
};

export type LandFormCaTroponinActivationReadbackV1 = {
  readonly freeCalciumUm: number;
  readonly contractileElementLogStrain: number;
  readonly contractileElementStretch: number;
  readonly halfActivationCalciumUm: number;
  /** d(CaT50)/d(epsilon_CE), epsilon_CE being natural-log strain. */
  readonly halfActivationCalciumDerivativeUmPerLogStrain: number;
  readonly calciumBindingRatio: number;
  /** Partial derivative holding the accepted CaTRPN state and free Ca fixed. */
  readonly calciumBindingRatioDerivativePerLogStrain: number;
  readonly caTroponin01: number;
  /** Partial derivative of the BE endpoint with respect to CE log strain. */
  readonly caTroponinDerivativePerLogStrain: number;
  readonly thinFilamentEquilibriumAvailability01: number;
  readonly thinFilamentAvailability01: number;
  readonly thinFilamentAvailabilityDerivativePerCaTroponin: number;
  readonly thinFilamentAvailabilityDerivativePerLogStrain: number;
  readonly thinFilamentDynamicsMode: LandFormThinFilamentDynamicsParamsV1["mode"];
  /** Zero in algebraic mode; exp(-dt/tau) in the one-state lag. */
  readonly thinFilamentStateRetention01: number;
  readonly thinFilamentDynamicsClaimBoundary: typeof LAND_FORM_NORMALIZED_THIN_FILAMENT_LAG_CLAIM_V1;
  readonly claimBoundary: typeof LAND_FORM_CA_TROPONIN_ACTIVATION_CLAIM_V1;
};

export type LandFormCaTroponinActivationTrialV1 = {
  readonly previousState: LandFormCaTroponinActivationStateV1;
  readonly nextState: LandFormCaTroponinActivationStateV1 | null;
  readonly readback: LandFormCaTroponinActivationReadbackV1 | null;
  readonly valid: boolean;
  readonly finite: boolean;
  readonly issues: readonly LandFormCaTroponinActivationIssueV1[];
};

export type LandFormCaTroponinActivationMidpointReadbackV2 = {
  readonly midpointFreeCalciumUm: number;
  readonly previousContractileElementLogStrain: number;
  readonly nextContractileElementLogStrain: number;
  readonly midpointContractileElementLogStrain: number;
  readonly midpointContractileElementStretch: number;
  /** @deprecated Compatibility alias for midpointContractileElementStretch. */
  readonly contractileElementStretch: number;
  readonly halfActivationCalciumUm: number;
  /** Derivative with respect to the trial endpoint CE log strain. */
  readonly halfActivationCalciumDerivativeUmPerNextLogStrain: number;
  readonly calciumBindingRatio: number;
  readonly calciumBindingRatioDerivativePerNextLogStrain: number;
  readonly caTroponin01: number;
  readonly caTroponinDerivativePerNextLogStrain: number;
  /** @deprecated Compatibility alias for the trial-endpoint derivative. */
  readonly caTroponinDerivativePerLogStrain: number;
  readonly thinFilamentEquilibriumAvailability01: number;
  readonly thinFilamentAvailability01: number;
  readonly thinFilamentAvailabilityDerivativePerCaTroponin: number;
  readonly thinFilamentAvailabilityDerivativePerNextLogStrain: number;
  /** @deprecated Compatibility alias for the trial-endpoint derivative. */
  readonly thinFilamentAvailabilityDerivativePerLogStrain: number;
  readonly thinFilamentDynamicsMode: LandFormThinFilamentDynamicsParamsV1["mode"];
  /** Zero in algebraic mode; exp(-dt/tau) in the one-state lag. */
  readonly thinFilamentStateRetention01: number;
  readonly thinFilamentDynamicsClaimBoundary: typeof LAND_FORM_NORMALIZED_THIN_FILAMENT_LAG_CLAIM_V1;
  readonly claimBoundary: typeof LAND_FORM_CA_TROPONIN_ACTIVATION_MIDPOINT_CLAIM_V2;
};

export type LandFormCaTroponinActivationMidpointTrialV2 = {
  readonly previousState: LandFormCaTroponinActivationStateV1;
  readonly nextState: LandFormCaTroponinActivationStateV1 | null;
  readonly readback: LandFormCaTroponinActivationMidpointReadbackV2 | null;
  readonly valid: boolean;
  readonly finite: boolean;
  readonly issues: readonly LandFormCaTroponinActivationIssueV1[];
};

const LAND2017_COMMON_FRONT_END_PARAMS = {
  caTroponinRatePerSec: 100,
  caTroponinCooperativity: 2,
  referenceHalfActivationCalciumUm: 0.805,
  halfActivationLengthSlopeUmPerStretch: -2.4,
  referenceCeStretch: 1,
  maximumLinearCeStretchExclusive: 1.2,
  thinFilamentHalfActivation01: 0.35,
} as const;

/** Land 2017 human ventricular front-end source values, with source nTm=5. */
export const LAND2017_HUMAN_VENTRICULAR_CA_TROPONIN_ACTIVATION_PARAMS_V1: LandFormCaTroponinActivationParamsV1 =
  Object.freeze({
    parameterSetId:
      "land2017-human-ventricular-ca-troponin-front-end-source-values-v1",
    ...LAND2017_COMMON_FRONT_END_PARAMS,
    thinFilamentCooperativity: 5,
  });

/**
 * Sensitivity candidate using the Land 2017 skinned-cell nTm=2.2 while keeping
 * the human ventricular CaTRPN values.  This mixed pack is not a source model.
 */
export const LAND_FORM_CA_TROPONIN_NTM_2P2_CANDIDATE_PARAMS_V1: LandFormCaTroponinActivationParamsV1 =
  Object.freeze({
    ...LAND2017_HUMAN_VENTRICULAR_CA_TROPONIN_ACTIVATION_PARAMS_V1,
    parameterSetId: "land-form-ca-troponin-ntm-2p2-sensitivity-candidate-v1",
    thinFilamentCooperativity: 2.2,
  });

/** Predeclared intermediate sensitivity candidate; not a Land source pack. */
export const LAND_FORM_CA_TROPONIN_NTM_3_CANDIDATE_PARAMS_V1: LandFormCaTroponinActivationParamsV1 =
  Object.freeze({
    ...LAND2017_HUMAN_VENTRICULAR_CA_TROPONIN_ACTIVATION_PARAMS_V1,
    parameterSetId: "land-form-ca-troponin-ntm-3-sensitivity-candidate-v1",
    thinFilamentCooperativity: 3,
  });

export const DEFAULT_LAND_FORM_CA_TROPONIN_ACTIVATION_PARAMS_V1 =
  LAND2017_HUMAN_VENTRICULAR_CA_TROPONIN_ACTIVATION_PARAMS_V1;

export function initialLandFormCaTroponinActivationStateV1(
  caTroponin01 = 0,
  thinFilamentAvailability01?: number,
): LandFormCaTroponinActivationStateV1 {
  if (!Number.isFinite(caTroponin01) || caTroponin01 < 0 || caTroponin01 > 1) {
    throw new Error("caTroponin01 must be finite and inside [0,1]");
  }
  if (
    thinFilamentAvailability01 !== undefined &&
    (!Number.isFinite(thinFilamentAvailability01) ||
      thinFilamentAvailability01 < 0 ||
      thinFilamentAvailability01 > 1)
  ) {
    throw new Error(
      "thinFilamentAvailability01 must be finite and inside [0,1]",
    );
  }
  return thinFilamentAvailability01 === undefined
    ? Object.freeze({ caTroponin01 })
    : Object.freeze({ caTroponin01, thinFilamentAvailability01 });
}

/**
 * Regulatory-site equilibrium for a prescribed resting free-Ca level and CE
 * length.  This is intended for trajectory initialization only; dynamic steps
 * must use the backward-Euler trial above.
 */
export function equilibriumLandFormCaTroponinActivationStateV1(
  freeCalciumUm: number,
  contractileElementLogStrain: number,
  params: LandFormCaTroponinActivationParamsV1 = DEFAULT_LAND_FORM_CA_TROPONIN_ACTIVATION_PARAMS_V1,
): LandFormCaTroponinActivationStateV1 {
  const parameterIssues = validateLandFormCaTroponinActivationParamsV1(params);
  if (parameterIssues.length > 0) {
    throw new Error(parameterIssues.map((entry) => entry.message).join("; "));
  }
  if (!Number.isFinite(freeCalciumUm) || freeCalciumUm < 0) {
    throw new Error("freeCalciumUm must be finite and nonnegative");
  }
  if (!Number.isFinite(contractileElementLogStrain)) {
    throw new Error("contractileElementLogStrain must be finite");
  }
  const ceStretch = Math.exp(contractileElementLogStrain);
  if (
    !Number.isFinite(ceStretch) ||
    ceStretch <= 0 ||
    ceStretch >= params.maximumLinearCeStretchExclusive
  ) {
    throw new Error(
      `contractile-element stretch must be positive and below ${params.maximumLinearCeStretchExclusive}`,
    );
  }
  const halfActivationCalciumUm =
    params.referenceHalfActivationCalciumUm +
    params.halfActivationLengthSlopeUmPerStretch *
      (ceStretch - params.referenceCeStretch);
  if (
    !(halfActivationCalciumUm > 0) ||
    !Number.isFinite(halfActivationCalciumUm)
  ) {
    throw new Error("length-dependent CaT50 must be positive and finite");
  }
  const calciumRatio = freeCalciumUm / halfActivationCalciumUm;
  const bindingRatio =
    calciumRatio === 0 ? 0 : calciumRatio ** params.caTroponinCooperativity;
  const caTroponin01 = bindingRatio / (1 + bindingRatio);
  const availability01 = evaluateNormalizedThinFilamentGate(
    caTroponin01,
    params,
  ).availability01;
  return isDynamicThinFilamentLag(params)
    ? initialLandFormCaTroponinActivationStateV1(caTroponin01, availability01)
    : initialLandFormCaTroponinActivationStateV1(caTroponin01);
}

export function validateLandFormCaTroponinActivationParamsV1(
  params: LandFormCaTroponinActivationParamsV1,
): readonly LandFormCaTroponinActivationIssueV1[] {
  const messages: string[] = [];
  if (
    typeof params.parameterSetId !== "string" ||
    params.parameterSetId.trim().length === 0
  ) {
    messages.push("parameterSetId must be a non-empty string");
  }
  positive(messages, "caTroponinRatePerSec", params.caTroponinRatePerSec);
  positive(messages, "caTroponinCooperativity", params.caTroponinCooperativity);
  positive(
    messages,
    "referenceHalfActivationCalciumUm",
    params.referenceHalfActivationCalciumUm,
  );
  finite(
    messages,
    "halfActivationLengthSlopeUmPerStretch",
    params.halfActivationLengthSlopeUmPerStretch,
  );
  if (
    Number.isFinite(params.halfActivationLengthSlopeUmPerStretch) &&
    params.halfActivationLengthSlopeUmPerStretch > 0
  ) {
    messages.push(
      "halfActivationLengthSlopeUmPerStretch must be <= 0 for the Land-form branch",
    );
  }
  positive(messages, "referenceCeStretch", params.referenceCeStretch);
  positive(
    messages,
    "maximumLinearCeStretchExclusive",
    params.maximumLinearCeStretchExclusive,
  );
  if (
    Number.isFinite(params.referenceCeStretch) &&
    Number.isFinite(params.maximumLinearCeStretchExclusive) &&
    params.referenceCeStretch >= params.maximumLinearCeStretchExclusive
  ) {
    messages.push(
      "referenceCeStretch must be below maximumLinearCeStretchExclusive",
    );
  }
  unitOpen(
    messages,
    "thinFilamentHalfActivation01",
    params.thinFilamentHalfActivation01,
  );
  if (
    !Number.isFinite(params.thinFilamentCooperativity) ||
    params.thinFilamentCooperativity < 1
  ) {
    messages.push("thinFilamentCooperativity must be finite and >= 1");
  }
  if (params.thinFilamentDynamics !== undefined) {
    if (params.thinFilamentDynamics.mode === "one-state-normalized-lag") {
      positive(
        messages,
        "thinFilamentDynamics.timeConstantSec",
        params.thinFilamentDynamics.timeConstantSec,
      );
    } else if (params.thinFilamentDynamics.mode !== "algebraic-equilibrium") {
      messages.push("thinFilamentDynamics.mode is not recognized");
    }
  }
  if (messages.length === 0) {
    const limitingHalfActivation =
      params.referenceHalfActivationCalciumUm +
      params.halfActivationLengthSlopeUmPerStretch *
        (params.maximumLinearCeStretchExclusive - params.referenceCeStretch);
    if (
      !(limitingHalfActivation > 0) ||
      !Number.isFinite(limitingHalfActivation)
    ) {
      messages.push(
        "CaT50 must remain positive up to the open upper CE-stretch bound",
      );
    }
  }
  return Object.freeze(
    messages.map((message) =>
      Object.freeze({
        code: "INVALID_PARAMETERS" as const,
        message,
      }),
    ),
  );
}

/**
 * Validate once, clone, and freeze a parameter pack for repeated local-root
 * evaluations. Mutable caller objects are never registered in the fast path.
 */
export function prepareLandFormCaTroponinActivationParamsV1(
  params: LandFormCaTroponinActivationParamsV1,
): PreparedLandFormCaTroponinActivationParamsV1 {
  const issues = validateLandFormCaTroponinActivationParamsV1(params);
  if (issues.length > 0)
    throw new Error(issues.map((entry) => entry.message).join("; "));
  const thinFilamentDynamics =
    params.thinFilamentDynamics === undefined
      ? undefined
      : Object.freeze({ ...params.thinFilamentDynamics });
  const prepared = Object.freeze({
    ...params,
    ...(thinFilamentDynamics === undefined ? {} : { thinFilamentDynamics }),
  }) as PreparedLandFormCaTroponinActivationParamsV1;
  PREPARED_LAND_FORM_CA_TROPONIN_PARAM_OBJECTS_V1.add(prepared);
  return prepared;
}

export function trialLandFormCaTroponinActivationV1(
  acceptedState: LandFormCaTroponinActivationStateV1,
  input: LandFormCaTroponinActivationInputV1,
  params: LandFormCaTroponinActivationParamsV1 = DEFAULT_LAND_FORM_CA_TROPONIN_ACTIVATION_PARAMS_V1,
): LandFormCaTroponinActivationTrialV1 {
  const issues: LandFormCaTroponinActivationIssueV1[] =
    PREPARED_LAND_FORM_CA_TROPONIN_PARAM_OBJECTS_V1.has(params)
      ? []
      : [...validateLandFormCaTroponinActivationParamsV1(params)];
  const stateFinite = activationStateIsFinite(acceptedState);
  appendActivationStateIssues(issues, acceptedState, params);
  const inputFinite = everyFinite([
    input.dtSec,
    input.freeCalciumUm,
    input.contractileElementLogStrain,
  ]);
  if (!inputFinite || input.dtSec <= 0 || input.freeCalciumUm < 0) {
    issues.push(
      issue(
        "INVALID_TRIAL_INPUT",
        "dtSec must be positive, freeCalciumUm nonnegative, and every input finite",
      ),
    );
  }
  if (issues.length > 0)
    return invalidTrial(acceptedState, issues, stateFinite && inputFinite);

  const ceStretch = Math.exp(input.contractileElementLogStrain);
  if (!Number.isFinite(ceStretch) || ceStretch <= 0) {
    issues.push(
      issue(
        "INVALID_TRIAL_INPUT",
        "exp(contractileElementLogStrain) must be positive and finite",
      ),
    );
    return invalidTrial(acceptedState, issues, false);
  }
  if (ceStretch >= params.maximumLinearCeStretchExclusive) {
    issues.push(
      issue(
        "OUTSIDE_LINEAR_LENGTH_DOMAIN",
        `contractile-element stretch must be below ${params.maximumLinearCeStretchExclusive}`,
      ),
    );
    return invalidTrial(acceptedState, issues, true);
  }

  const halfActivationCalciumUm =
    params.referenceHalfActivationCalciumUm +
    params.halfActivationLengthSlopeUmPerStretch *
      (ceStretch - params.referenceCeStretch);
  if (
    !Number.isFinite(halfActivationCalciumUm) ||
    halfActivationCalciumUm <= 0
  ) {
    issues.push(
      issue(
        "NONPOSITIVE_HALF_ACTIVATION_CALCIUM",
        "length-dependent CaT50 must be positive and finite",
      ),
    );
    return invalidTrial(
      acceptedState,
      issues,
      Number.isFinite(halfActivationCalciumUm),
    );
  }

  const halfActivationDerivative =
    params.halfActivationLengthSlopeUmPerStretch * ceStretch;
  const calciumRatio = input.freeCalciumUm / halfActivationCalciumUm;
  const bindingRatio =
    calciumRatio === 0 ? 0 : calciumRatio ** params.caTroponinCooperativity;
  const bindingRatioDerivative =
    bindingRatio === 0
      ? 0
      : (-params.caTroponinCooperativity *
          bindingRatio *
          halfActivationDerivative) /
        halfActivationCalciumUm;
  const h = input.dtSec * params.caTroponinRatePerSec;
  const denominator = 1 + h * (bindingRatio + 1);
  const caTroponin01 =
    (acceptedState.caTroponin01 + h * bindingRatio) / denominator;
  const caTroponinDerivativePerBindingRatio =
    (h * (1 + h - acceptedState.caTroponin01)) / (denominator * denominator);
  const caTroponinDerivative =
    caTroponinDerivativePerBindingRatio * bindingRatioDerivative;
  const thinFilament = evaluateThinFilamentTrial(
    acceptedState,
    caTroponin01,
    caTroponinDerivative,
    input.dtSec,
    params,
  );

  const outputs = [
    ceStretch,
    halfActivationCalciumUm,
    halfActivationDerivative,
    bindingRatio,
    bindingRatioDerivative,
    denominator,
    caTroponin01,
    caTroponinDerivative,
    thinFilament.equilibriumAvailability01,
    thinFilament.availability01,
    thinFilament.derivativePerCaTroponin,
    thinFilament.derivativePerStrain,
    thinFilament.stateRetention01,
  ];
  if (!everyFinite(outputs)) {
    issues.push(
      issue(
        "NONFINITE_ACTIVATION_OUTPUT",
        "activation evaluation produced a non-finite value",
      ),
    );
    return invalidTrial(acceptedState, issues, false);
  }
  if (
    caTroponin01 < 0 ||
    caTroponin01 > 1 ||
    thinFilament.availability01 < 0 ||
    thinFilament.availability01 > 1
  ) {
    issues.push(
      issue(
        "ACTIVATION_STATE_OUT_OF_BOUNDS",
        "CaTRPN and thin-filament availability must remain inside [0,1]",
      ),
    );
    return invalidTrial(acceptedState, issues, true);
  }

  const nextState = activationStateFromTrial(
    caTroponin01,
    thinFilament,
    params,
  );
  const readback: LandFormCaTroponinActivationReadbackV1 = Object.freeze({
    freeCalciumUm: input.freeCalciumUm,
    contractileElementLogStrain: input.contractileElementLogStrain,
    contractileElementStretch: ceStretch,
    halfActivationCalciumUm,
    halfActivationCalciumDerivativeUmPerLogStrain: halfActivationDerivative,
    calciumBindingRatio: bindingRatio,
    calciumBindingRatioDerivativePerLogStrain: bindingRatioDerivative,
    caTroponin01,
    caTroponinDerivativePerLogStrain: caTroponinDerivative,
    thinFilamentEquilibriumAvailability01:
      thinFilament.equilibriumAvailability01,
    thinFilamentAvailability01: thinFilament.availability01,
    thinFilamentAvailabilityDerivativePerCaTroponin:
      thinFilament.derivativePerCaTroponin,
    thinFilamentAvailabilityDerivativePerLogStrain:
      thinFilament.derivativePerStrain,
    thinFilamentDynamicsMode: thinFilament.mode,
    thinFilamentStateRetention01: thinFilament.stateRetention01,
    thinFilamentDynamicsClaimBoundary:
      LAND_FORM_NORMALIZED_THIN_FILAMENT_LAG_CLAIM_V1,
    claimBoundary: LAND_FORM_CA_TROPONIN_ACTIVATION_CLAIM_V1,
  });
  return Object.freeze({
    previousState: acceptedState,
    nextState,
    readback,
    valid: true,
    finite: true,
    issues: Object.freeze([]),
  });
}

/**
 * Exponential midpoint update for Land Eq. 47.  The free-calcium coefficient
 * is supplied at the interval midpoint, while CE strain is linearly
 * reconstructed from the accepted value to each trial endpoint.  The returned
 * derivative is therefore the exact same-step derivative with respect to that
 * endpoint and includes the midpoint chain factor 1/2.
 */
export function trialLandFormCaTroponinActivationMidpointV2(
  acceptedState: LandFormCaTroponinActivationStateV1,
  input: LandFormCaTroponinActivationMidpointInputV2,
  params: LandFormCaTroponinActivationParamsV1 = DEFAULT_LAND_FORM_CA_TROPONIN_ACTIVATION_PARAMS_V1,
): LandFormCaTroponinActivationMidpointTrialV2 {
  const issues: LandFormCaTroponinActivationIssueV1[] =
    PREPARED_LAND_FORM_CA_TROPONIN_PARAM_OBJECTS_V1.has(params)
      ? []
      : [...validateLandFormCaTroponinActivationParamsV1(params)];
  const stateFinite = activationStateIsFinite(acceptedState);
  appendActivationStateIssues(issues, acceptedState, params);
  const inputFinite = everyFinite([
    input.dtSec,
    input.midpointFreeCalciumUm,
    input.previousContractileElementLogStrain,
    input.nextContractileElementLogStrain,
  ]);
  if (!inputFinite || input.dtSec <= 0 || input.midpointFreeCalciumUm < 0) {
    issues.push(
      issue(
        "INVALID_TRIAL_INPUT",
        "dtSec must be positive, midpoint free calcium nonnegative, and every input finite",
      ),
    );
  }
  if (issues.length > 0)
    return invalidMidpointTrial(
      acceptedState,
      issues,
      stateFinite && inputFinite,
    );

  const previousStretch = Math.exp(input.previousContractileElementLogStrain);
  const nextStretch = Math.exp(input.nextContractileElementLogStrain);
  const midpointLogStrain =
    0.5 *
    (input.previousContractileElementLogStrain +
      input.nextContractileElementLogStrain);
  const midpointStretch = Math.exp(midpointLogStrain);
  if (
    ![previousStretch, nextStretch, midpointStretch].every(
      (stretch) => Number.isFinite(stretch) && stretch > 0,
    )
  ) {
    issues.push(
      issue("INVALID_TRIAL_INPUT", "CE stretches must be positive and finite"),
    );
    return invalidMidpointTrial(acceptedState, issues, false);
  }
  if (
    previousStretch >= params.maximumLinearCeStretchExclusive ||
    nextStretch >= params.maximumLinearCeStretchExclusive ||
    midpointStretch >= params.maximumLinearCeStretchExclusive
  ) {
    issues.push(
      issue(
        "OUTSIDE_LINEAR_LENGTH_DOMAIN",
        `previous, midpoint, and next contractile-element stretch must be below ${params.maximumLinearCeStretchExclusive}`,
      ),
    );
    return invalidMidpointTrial(acceptedState, issues, true);
  }

  const halfActivationCalciumUm =
    params.referenceHalfActivationCalciumUm +
    params.halfActivationLengthSlopeUmPerStretch *
      (midpointStretch - params.referenceCeStretch);
  if (
    !Number.isFinite(halfActivationCalciumUm) ||
    halfActivationCalciumUm <= 0
  ) {
    issues.push(
      issue(
        "NONPOSITIVE_HALF_ACTIVATION_CALCIUM",
        "midpoint length-dependent CaT50 must be positive and finite",
      ),
    );
    return invalidMidpointTrial(
      acceptedState,
      issues,
      Number.isFinite(halfActivationCalciumUm),
    );
  }

  const halfActivationDerivativePerNext =
    0.5 * params.halfActivationLengthSlopeUmPerStretch * midpointStretch;
  const calciumRatio = input.midpointFreeCalciumUm / halfActivationCalciumUm;
  const bindingRatio =
    calciumRatio === 0 ? 0 : calciumRatio ** params.caTroponinCooperativity;
  const bindingRatioDerivativePerNext =
    bindingRatio === 0
      ? 0
      : (-params.caTroponinCooperativity *
          bindingRatio *
          halfActivationDerivativePerNext) /
        halfActivationCalciumUm;
  const equilibrium = bindingRatio / (1 + bindingRatio);
  const rateStep = input.dtSec * params.caTroponinRatePerSec;
  const exponential = Math.exp(-rateStep * (1 + bindingRatio));
  const oneMinusExponential = -Math.expm1(-rateStep * (1 + bindingRatio));
  const caTroponin01 =
    acceptedState.caTroponin01 * exponential +
    equilibrium * oneMinusExponential;
  const caTroponinDerivativePerBindingRatio =
    oneMinusExponential / ((1 + bindingRatio) * (1 + bindingRatio)) +
    (equilibrium - acceptedState.caTroponin01) * rateStep * exponential;
  const caTroponinDerivativePerNext =
    caTroponinDerivativePerBindingRatio * bindingRatioDerivativePerNext;
  const thinFilament = evaluateThinFilamentTrial(
    acceptedState,
    caTroponin01,
    caTroponinDerivativePerNext,
    input.dtSec,
    params,
  );

  const outputs = [
    previousStretch,
    nextStretch,
    midpointLogStrain,
    midpointStretch,
    halfActivationCalciumUm,
    halfActivationDerivativePerNext,
    bindingRatio,
    bindingRatioDerivativePerNext,
    equilibrium,
    exponential,
    oneMinusExponential,
    caTroponin01,
    caTroponinDerivativePerNext,
    thinFilament.equilibriumAvailability01,
    thinFilament.availability01,
    thinFilament.derivativePerCaTroponin,
    thinFilament.derivativePerStrain,
    thinFilament.stateRetention01,
  ];
  if (!everyFinite(outputs)) {
    issues.push(
      issue(
        "NONFINITE_ACTIVATION_OUTPUT",
        "midpoint activation evaluation produced a non-finite value",
      ),
    );
    return invalidMidpointTrial(acceptedState, issues, false);
  }
  if (
    caTroponin01 < 0 ||
    caTroponin01 > 1 ||
    thinFilament.availability01 < 0 ||
    thinFilament.availability01 > 1
  ) {
    issues.push(
      issue(
        "ACTIVATION_STATE_OUT_OF_BOUNDS",
        "midpoint CaTRPN and thin-filament availability must remain inside [0,1]",
      ),
    );
    return invalidMidpointTrial(acceptedState, issues, true);
  }

  const nextState = activationStateFromTrial(
    caTroponin01,
    thinFilament,
    params,
  );
  const readback: LandFormCaTroponinActivationMidpointReadbackV2 =
    Object.freeze({
      midpointFreeCalciumUm: input.midpointFreeCalciumUm,
      previousContractileElementLogStrain:
        input.previousContractileElementLogStrain,
      nextContractileElementLogStrain: input.nextContractileElementLogStrain,
      midpointContractileElementLogStrain: midpointLogStrain,
      midpointContractileElementStretch: midpointStretch,
      contractileElementStretch: midpointStretch,
      halfActivationCalciumUm,
      halfActivationCalciumDerivativeUmPerNextLogStrain:
        halfActivationDerivativePerNext,
      calciumBindingRatio: bindingRatio,
      calciumBindingRatioDerivativePerNextLogStrain:
        bindingRatioDerivativePerNext,
      caTroponin01,
      caTroponinDerivativePerNextLogStrain: caTroponinDerivativePerNext,
      caTroponinDerivativePerLogStrain: caTroponinDerivativePerNext,
      thinFilamentEquilibriumAvailability01:
        thinFilament.equilibriumAvailability01,
      thinFilamentAvailability01: thinFilament.availability01,
      thinFilamentAvailabilityDerivativePerCaTroponin:
        thinFilament.derivativePerCaTroponin,
      thinFilamentAvailabilityDerivativePerNextLogStrain:
        thinFilament.derivativePerStrain,
      thinFilamentAvailabilityDerivativePerLogStrain:
        thinFilament.derivativePerStrain,
      thinFilamentDynamicsMode: thinFilament.mode,
      thinFilamentStateRetention01: thinFilament.stateRetention01,
      thinFilamentDynamicsClaimBoundary:
        LAND_FORM_NORMALIZED_THIN_FILAMENT_LAG_CLAIM_V1,
      claimBoundary: LAND_FORM_CA_TROPONIN_ACTIVATION_MIDPOINT_CLAIM_V2,
    });
  return Object.freeze({
    previousState: acceptedState,
    nextState,
    readback,
    valid: true,
    finite: true,
    issues: Object.freeze([]),
  });
}

export function commitLandFormCaTroponinActivationTrialV1(
  trial: LandFormCaTroponinActivationTrialV1,
): LandFormCaTroponinActivationStateV1 {
  if (!trial.valid || !trial.finite || trial.nextState === null) {
    throw new Error(
      "Cannot commit an invalid or non-finite Land-form CaTRPN activation trial",
    );
  }
  return Object.freeze({ ...trial.nextState });
}

function evaluateNormalizedThinFilamentGate(
  caTroponin01: number,
  params: LandFormCaTroponinActivationParamsV1,
): {
  readonly availability01: number;
  readonly derivativePerCaTroponin: number;
} {
  const exponent = params.thinFilamentCooperativity;
  const midpointPower = params.thinFilamentHalfActivation01 ** exponent;
  const occupancyPower = caTroponin01 ** exponent;
  const denominator = occupancyPower + midpointPower;
  const normalization = 1 + midpointPower;
  const availability01 = (normalization * occupancyPower) / denominator;
  const derivativePerCaTroponin =
    caTroponin01 === 0
      ? exponent === 1
        ? normalization / params.thinFilamentHalfActivation01
        : 0
      : (normalization *
          exponent *
          caTroponin01 ** (exponent - 1) *
          midpointPower) /
        (denominator * denominator);
  return { availability01, derivativePerCaTroponin };
}

type ThinFilamentTrialEvaluation = {
  readonly mode: LandFormThinFilamentDynamicsParamsV1["mode"];
  readonly equilibriumAvailability01: number;
  readonly availability01: number;
  /** Endpoint derivative with accepted state held fixed. */
  readonly derivativePerCaTroponin: number;
  readonly derivativePerStrain: number;
  readonly stateRetention01: number;
};

function evaluateThinFilamentTrial(
  acceptedState: LandFormCaTroponinActivationStateV1,
  caTroponin01: number,
  caTroponinDerivativePerStrain: number,
  dtSec: number,
  params: LandFormCaTroponinActivationParamsV1,
): ThinFilamentTrialEvaluation {
  const gate = evaluateNormalizedThinFilamentGate(caTroponin01, params);
  if (!isDynamicThinFilamentLag(params)) {
    return {
      mode: "algebraic-equilibrium",
      equilibriumAvailability01: gate.availability01,
      availability01: gate.availability01,
      derivativePerCaTroponin: gate.derivativePerCaTroponin,
      derivativePerStrain:
        gate.derivativePerCaTroponin * caTroponinDerivativePerStrain,
      stateRetention01: 0,
    };
  }

  const stateRetention01 = Math.exp(
    -dtSec / params.thinFilamentDynamics.timeConstantSec,
  );
  const equilibriumWeight = -Math.expm1(
    -dtSec / params.thinFilamentDynamics.timeConstantSec,
  );
  const availability01 =
    acceptedState.thinFilamentAvailability01! * stateRetention01 +
    gate.availability01 * equilibriumWeight;
  const derivativePerCaTroponin =
    equilibriumWeight * gate.derivativePerCaTroponin;
  return {
    mode: "one-state-normalized-lag",
    equilibriumAvailability01: gate.availability01,
    availability01,
    derivativePerCaTroponin,
    derivativePerStrain:
      derivativePerCaTroponin * caTroponinDerivativePerStrain,
    stateRetention01,
  };
}

function activationStateFromTrial(
  caTroponin01: number,
  thinFilament: ThinFilamentTrialEvaluation,
  params: LandFormCaTroponinActivationParamsV1,
): LandFormCaTroponinActivationStateV1 {
  return isDynamicThinFilamentLag(params)
    ? Object.freeze({
        caTroponin01,
        thinFilamentAvailability01: thinFilament.availability01,
      })
    : Object.freeze({ caTroponin01 });
}

function isDynamicThinFilamentLag(
  params: LandFormCaTroponinActivationParamsV1,
): params is LandFormCaTroponinActivationParamsV1 & {
  readonly thinFilamentDynamics: Extract<
    LandFormThinFilamentDynamicsParamsV1,
    { readonly mode: "one-state-normalized-lag" }
  >;
} {
  return params.thinFilamentDynamics?.mode === "one-state-normalized-lag";
}

function activationStateIsFinite(
  state: LandFormCaTroponinActivationStateV1,
): boolean {
  return (
    Number.isFinite(state.caTroponin01) &&
    (state.thinFilamentAvailability01 === undefined ||
      Number.isFinite(state.thinFilamentAvailability01))
  );
}

function appendActivationStateIssues(
  issues: LandFormCaTroponinActivationIssueV1[],
  acceptedState: LandFormCaTroponinActivationStateV1,
  params: LandFormCaTroponinActivationParamsV1,
): void {
  if (
    !Number.isFinite(acceptedState.caTroponin01) ||
    acceptedState.caTroponin01 < 0 ||
    acceptedState.caTroponin01 > 1
  ) {
    issues.push(
      issue(
        "INVALID_ACCEPTED_STATE",
        "accepted caTroponin01 must be finite and inside [0,1]",
      ),
    );
  }
  if (
    acceptedState.thinFilamentAvailability01 !== undefined &&
    (!Number.isFinite(acceptedState.thinFilamentAvailability01) ||
      acceptedState.thinFilamentAvailability01 < 0 ||
      acceptedState.thinFilamentAvailability01 > 1)
  ) {
    issues.push(
      issue(
        "INVALID_ACCEPTED_STATE",
        "accepted thinFilamentAvailability01 must be finite and inside [0,1]",
      ),
    );
  }
  if (
    isDynamicThinFilamentLag(params) &&
    acceptedState.thinFilamentAvailability01 === undefined
  ) {
    issues.push(
      issue(
        "INVALID_ACCEPTED_STATE",
        "one-state-normalized-lag requires an accepted thinFilamentAvailability01 state",
      ),
    );
  }
}

function invalidTrial(
  previousState: LandFormCaTroponinActivationStateV1,
  issues: readonly LandFormCaTroponinActivationIssueV1[],
  finite: boolean,
): LandFormCaTroponinActivationTrialV1 {
  return Object.freeze({
    previousState,
    nextState: null,
    readback: null,
    valid: false,
    finite,
    issues: Object.freeze([...issues]),
  });
}

function invalidMidpointTrial(
  previousState: LandFormCaTroponinActivationStateV1,
  issues: readonly LandFormCaTroponinActivationIssueV1[],
  finite: boolean,
): LandFormCaTroponinActivationMidpointTrialV2 {
  return Object.freeze({
    previousState,
    nextState: null,
    readback: null,
    valid: false,
    finite,
    issues: Object.freeze([...issues]),
  });
}

function issue(
  code: LandFormCaTroponinActivationIssueCodeV1,
  message: string,
): LandFormCaTroponinActivationIssueV1 {
  return Object.freeze({ code, message });
}

function everyFinite(values: readonly number[]): boolean {
  return values.every(Number.isFinite);
}

function finite(messages: string[], field: string, value: number): void {
  if (!Number.isFinite(value)) messages.push(`${field} must be finite`);
}

function positive(messages: string[], field: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0)
    messages.push(`${field} must be positive and finite`);
}

function unitOpen(messages: string[], field: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0 || value >= 1) {
    messages.push(`${field} must be finite and inside (0,1)`);
  }
}
