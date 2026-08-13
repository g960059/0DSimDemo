import type { ValveName } from "@/engine/core/topology";

/** Current algebraic valve implementation used by the integrated main wire. */
export const MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_V2_ID =
  "main-wire-quasi-steady-orifice-valve-v2" as const;

export const MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2 = 1060 as const;
export const MAIN_WIRE_VALVE_PA_PER_MMHG_V2 = 133.322387415 as const;

export const MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_CLAIM_V2 = Object.freeze({
  topology: "algebraic-flow-and-bounded-opening-memory" as const,
  acceptedMemory: "leaflet-opening-fraction-only" as const,
  flowMemory: false as const,
  inertanceModeled: false as const,
  timeDiscretization:
    "backward-euler-opening-state-plus-exact-algebraic-flow-root" as const,
  pressureFlowLaw: "signed-linear-plus-q-abs-q-orifice-loss" as const,
  directionSeparatedEffectiveOrificeArea: true as const,
  forwardAreaLaw:
    "closed-reverse-EROA-plus-opening-times-maximum-minus-closed-reverse-EROA" as const,
  reverseAreaLaw:
    "closed-reverse-EROA-only-independent-of-leaflet-opening" as const,
  effectiveOrificeAreaSemantics:
    "EOA-already-includes-discharge-and-contraction-no-separate-Cd" as const,
  linearResistanceSemantics:
    "legacy-topology-derived-series-loss-fixed-across-brackets-not-effective-area-scaled" as const,
  closedReverseEroaInterpretation:
    "clinical-reverse-phase-EROA-seeded-bidirectional-residual-hydraulic-gap" as const,
  forwardAndReverseFlowResponsesIndependent: false as const,
  numericalAreaFloorUsed: false as const,
  flowSmoothingUsed: false as const,
  exactZeroAreaNoFlow: true as const,
  pairedPressureGradientTangentReadback: true as const,
  stepTangentSemantics:
    "total-derivative-with-backward-euler-opening-state-eliminated" as const,
  evaluateTangentSemantics:
    "partial-derivative-with-supplied-next-opening-held-fixed" as const,
  tangentBranchConvention: Object.freeze({
    targetEqualsPreviousOpening: "closing-time-constant" as const,
    zeroPressureGradient: "forward-area-one-sided-semismooth" as const,
    exactZeroArea: "zero-flow-and-zero-tangent" as const,
    pureQuadraticZeroGradient:
      "declared-non-lipschitz-with-finite-zero-readback" as const,
  }),
  supportLedger:
    "competent-reverse-closure-and-subthreshold-forward-support-are-distinct" as const,
  leafletMechanicalContactModeled: false as const,
  pressureOrPhaseShapeFitting: false as const,
});

const EMPTY_VALVE_ISSUES_V2 = Object.freeze([]) as readonly string[];
const VALIDATED_FROZEN_VALVE_PARAMS_V2 = new WeakSet<object>();

export type MainWireQuasiSteadyOrificeValveParamsV2 = {
  readonly parameterSetId: string;
  readonly valveId: ValveName;
  /** Legacy topology-derived series loss; fixed across disease EOA brackets. */
  readonly backgroundLinearResistanceMmHgSecPerMl: number;
  readonly maximumForwardEoaCm2: number;
  /** Clinical reverse-phase EROA-seeded bidirectional residual hydraulic gap. */
  readonly closedReverseEroaCm2: number;
  readonly openingGainPerMmHg: number;
  readonly openingPressureOffsetMmHg: number;
  readonly openingDriveDeadbandMmHg: number;
  /** C1 conditioning width for the opening drive, not a flow regularization. */
  readonly openingDriveSmoothingMmHg: number;
  readonly openingTimeConstantSec: number;
  readonly closingTimeConstantSec: number;
};

/** The sole accepted valve state. Flow is reconstructed algebraically. */
export type MainWireQuasiSteadyOrificeValveStateV2 = {
  readonly leafletOpeningFraction01: number;
};

export type MainWireQuasiSteadyOrificeValveInputV2 = {
  readonly dtSec: number;
  readonly upstreamPressureMmHg: number;
  readonly downstreamPressureMmHg: number;
};

export type MainWireQuasiSteadyOrificeValveDirectionV2 =
  | "forward"
  | "reverse"
  | "zero-gradient"
  | "invalid";

export type MainWireQuasiSteadyOrificeValveTangentModeV2 =
  | "backward-euler-opening-state-eliminated"
  | "next-opening-held-fixed"
  | "invalid";

export type MainWireQuasiSteadyOrificeValveTangentBranchV2 =
  | "forward-open-orifice"
  | "reverse-regurgitant-orifice"
  | "zero-gradient-forward-open-orifice"
  | "exact-zero-area-hydraulic-support"
  | "zero-gradient-non-lipschitz-zero-linear-resistance"
  | "invalid";

export type MainWireQuasiSteadyOrificeValveEvaluationV2 = {
  readonly modelId: typeof MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_V2_ID;
  readonly state: MainWireQuasiSteadyOrificeValveStateV2;
  /** Algebraic readback, deliberately absent from accepted state. */
  readonly flowMlPerSec: number;
  readonly pressureGradientMmHg: number;
  readonly activeDirection: MainWireQuasiSteadyOrificeValveDirectionV2;
  readonly openingTarget01: number;
  readonly openingEquationResidual01: number;
  readonly forwardActiveEoaCm2: number;
  readonly reverseActiveEoaCm2: number;
  readonly activeEoaCm2: number;
  /** Total derivative for `step`; fixed-next-state partial for `evaluate`. */
  readonly dLeafletOpeningFractionDPressureGradientPerMmHg: number;
  readonly dFlowDPressureGradientMlPerSecPerMmHg: number;
  readonly tangentMode: MainWireQuasiSteadyOrificeValveTangentModeV2;
  readonly tangentBranch: MainWireQuasiSteadyOrificeValveTangentBranchV2;
  readonly resistanceMmHgSecPerMl: number;
  readonly bernoulliMmHgSec2PerMl2: number;
  readonly dissipativePressureMmHg: number;
  /** Delta-p minus the signed dissipative pressure. */
  readonly openOrificeResidualMmHg: number;
  /** Nonnegative magnitude; present only for competent adverse pressure. */
  readonly competentReverseClosureReactionMmHg: number;
  /** Nonnegative magnitude; present only for a zero-area forward deadband state. */
  readonly subthresholdForwardSupportReactionMmHg: number;
  /** Positive for reverse closure and negative for forward support. */
  readonly signedHydraulicSupportReactionMmHg: number;
  readonly hydraulicBalanceResidualMmHg: number;
  readonly hydraulicPowerInputMmHgMlPerSec: number;
  readonly dissipativePowerMmHgMlPerSec: number;
  readonly hydraulicSupportPowerMmHgMlPerSec: number;
  readonly powerBalanceResidualMmHgMlPerSec: number;
  readonly competentReverseClosureActive: boolean;
  readonly subthresholdForwardSupportActive: boolean;
  /** These hydraulic reactions are not a leaflet-contact constitutive law. */
  readonly leafletMechanicalContactModeled: false;
  readonly reverseRegurgitantFlowEnabled: boolean;
  readonly valid: boolean;
  readonly finite: boolean;
  readonly issues: readonly string[];
  readonly claim: typeof MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_CLAIM_V2;
};

/**
 * Convective loss coefficient in native units. EOA already incorporates the
 * discharge/contraction effect, so adding Cd here would count it twice.
 */
export function idealBernoulliLossFromEffectiveOrificeAreaV2(
  effectiveOrificeAreaCm2: number,
): number {
  if (!(effectiveOrificeAreaCm2 > 0) || !Number.isFinite(effectiveOrificeAreaCm2)) {
    throw new Error("effectiveOrificeAreaCm2 must be finite and positive");
  }
  const areaM2 = effectiveOrificeAreaCm2 * 1e-4;
  return MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2 /
    (2 * MAIN_WIRE_VALVE_PA_PER_MMHG_V2) *
    (1e-6 / areaM2) ** 2;
}

export function validateMainWireQuasiSteadyOrificeValveParamsV2(
  params: MainWireQuasiSteadyOrificeValveParamsV2,
): readonly string[] {
  if (VALIDATED_FROZEN_VALVE_PARAMS_V2.has(params)) {
    return EMPTY_VALVE_ISSUES_V2;
  }
  const issues: string[] = [];
  if (typeof params.parameterSetId !== "string" || params.parameterSetId.trim() === "") {
    issues.push("parameterSetId must be non-empty");
  }
  if (!["MV", "AoV", "TV", "PV"].includes(params.valveId)) {
    issues.push("valveId must be a main-wire valve");
  }
  nonnegative(
    params.backgroundLinearResistanceMmHgSecPerMl,
    "backgroundLinearResistanceMmHgSecPerMl",
    issues,
  );
  positive(params.maximumForwardEoaCm2, "maximumForwardEoaCm2", issues);
  nonnegative(params.closedReverseEroaCm2, "closedReverseEroaCm2", issues);
  if (params.closedReverseEroaCm2 > params.maximumForwardEoaCm2) {
    issues.push("closedReverseEroaCm2 must not exceed maximumForwardEoaCm2");
  }
  positive(params.openingGainPerMmHg, "openingGainPerMmHg", issues);
  if (!Number.isFinite(params.openingPressureOffsetMmHg)) {
    issues.push("openingPressureOffsetMmHg must be finite");
  }
  nonnegative(params.openingDriveDeadbandMmHg, "openingDriveDeadbandMmHg", issues);
  positive(params.openingDriveSmoothingMmHg, "openingDriveSmoothingMmHg", issues);
  positive(params.openingTimeConstantSec, "openingTimeConstantSec", issues);
  positive(params.closingTimeConstantSec, "closingTimeConstantSec", issues);
  if (issues.length === 0 && frozenPlainDataValveParams(params)) {
    VALIDATED_FROZEN_VALVE_PARAMS_V2.add(params);
    return EMPTY_VALVE_ISSUES_V2;
  }
  return Object.freeze(issues);
}

export function initialMainWireQuasiSteadyOrificeValveStateV2(
  leafletOpeningFraction01 = 0,
): MainWireQuasiSteadyOrificeValveStateV2 {
  if (!Number.isFinite(leafletOpeningFraction01)) {
    throw new Error("initial valve opening state must be finite");
  }
  return Object.freeze({
    leafletOpeningFraction01: clamp(leafletOpeningFraction01, 0, 1),
  });
}

export function stepMainWireQuasiSteadyOrificeValveV2(
  previous: MainWireQuasiSteadyOrificeValveStateV2,
  input: MainWireQuasiSteadyOrificeValveInputV2,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
): MainWireQuasiSteadyOrificeValveEvaluationV2 {
  return stepMainWireQuasiSteadyOrificeValveScalarsV2(
    previous.leafletOpeningFraction01,
    input.dtSec,
    input.upstreamPressureMmHg,
    input.downstreamPressureMmHg,
    params,
  );
}

/** Allocation-lean internal step for typed solver-owned accepted state. */
export function stepMainWireQuasiSteadyOrificeValveScalarsV2(
  previousLeafletOpeningFraction01: number,
  dtSec: number,
  upstreamPressureMmHg: number,
  downstreamPressureMmHg: number,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
): MainWireQuasiSteadyOrificeValveEvaluationV2 {
  const preliminaryIssues = validateScalarInputs(
    previousLeafletOpeningFraction01,
    dtSec,
    upstreamPressureMmHg,
    downstreamPressureMmHg,
    params,
  );
  if (preliminaryIssues.length > 0) {
    return invalidEvaluation(
      { leafletOpeningFraction01: previousLeafletOpeningFraction01 },
      { dtSec, upstreamPressureMmHg, downstreamPressureMmHg },
      params,
      preliminaryIssues,
    );
  }
  const pressureGradientMmHg =
    upstreamPressureMmHg - downstreamPressureMmHg;
  const target = openingTarget(pressureGradientMmHg, params);
  const openingDriveMmHg = pressureGradientMmHg -
    params.openingDriveDeadbandMmHg -
    params.openingPressureOffsetMmHg;
  const widthMmHg = params.openingDriveSmoothingMmHg;
  const dPositiveOpeningDriveDPressureGradient = openingDriveMmHg <= 0
    ? 0
    : openingDriveMmHg >= widthMmHg
      ? 1
      : openingDriveMmHg / widthMmHg;
  const dTargetDPressureGradientPerMmHg =
    params.openingGainPerMmHg * (1 - target)
    * dPositiveOpeningDriveDPressureGradient;
  const tau = target > previousLeafletOpeningFraction01
    ? params.openingTimeConstantSec
    : params.closingTimeConstantSec;
  const timeRatio = dtSec / tau;
  const unclampedLeafletOpeningFraction01 =
    (previousLeafletOpeningFraction01 + timeRatio * target) / (1 + timeRatio);
  const leafletOpeningFraction01 = clamp(
    unclampedLeafletOpeningFraction01,
    0,
    1,
  );
  const dLeafletOpeningFractionDPressureGradientPerMmHg =
    unclampedLeafletOpeningFraction01 <= 0
      || unclampedLeafletOpeningFraction01 >= 1
      ? 0
      : dtSec / (tau + dtSec)
        * dTargetDPressureGradientPerMmHg;
  return evaluateMainWireQuasiSteadyOrificeValveScalarsValidatedV2(
    previousLeafletOpeningFraction01,
    dtSec,
    upstreamPressureMmHg,
    downstreamPressureMmHg,
    leafletOpeningFraction01,
    params,
    dLeafletOpeningFractionDPressureGradientPerMmHg,
    "backward-euler-opening-state-eliminated",
    target,
  );
}

/** Pure accepted-state residual/readback for a monolithic circulation solve. */
export function evaluateMainWireQuasiSteadyOrificeValveV2(
  previous: MainWireQuasiSteadyOrificeValveStateV2,
  input: MainWireQuasiSteadyOrificeValveInputV2,
  next: MainWireQuasiSteadyOrificeValveStateV2,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
): MainWireQuasiSteadyOrificeValveEvaluationV2 {
  return evaluateMainWireQuasiSteadyOrificeValveWithTangentV2(
    previous,
    input,
    next,
    params,
    0,
    "next-opening-held-fixed",
  );
}

function evaluateMainWireQuasiSteadyOrificeValveWithTangentV2(
  previous: MainWireQuasiSteadyOrificeValveStateV2,
  input: MainWireQuasiSteadyOrificeValveInputV2,
  next: MainWireQuasiSteadyOrificeValveStateV2,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
  dLeafletOpeningFractionDPressureGradientPerMmHg: number,
  tangentMode: Exclude<MainWireQuasiSteadyOrificeValveTangentModeV2, "invalid">,
  validatedOpeningTarget01?: number,
): MainWireQuasiSteadyOrificeValveEvaluationV2 {
  const issues = [...validateInputs(previous, input, params)];
  if (
    !Number.isFinite(next.leafletOpeningFraction01) ||
    next.leafletOpeningFraction01 < 0 ||
    next.leafletOpeningFraction01 > 1
  ) {
    issues.push("next valve state must have finite leafletOpeningFraction01 in [0, 1]");
  }
  if (issues.length > 0) return invalidEvaluation(next, input, params, issues);

  return evaluateMainWireQuasiSteadyOrificeValveScalarsValidatedV2(
    previous.leafletOpeningFraction01,
    input.dtSec,
    input.upstreamPressureMmHg,
    input.downstreamPressureMmHg,
    next.leafletOpeningFraction01,
    params,
    dLeafletOpeningFractionDPressureGradientPerMmHg,
    tangentMode,
    validatedOpeningTarget01,
  );
}

function evaluateMainWireQuasiSteadyOrificeValveScalarsValidatedV2(
  previousLeafletOpeningFraction01: number,
  dtSec: number,
  upstreamPressureMmHg: number,
  downstreamPressureMmHg: number,
  nextLeafletOpeningFraction01: number,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
  dLeafletOpeningFractionDPressureGradientPerMmHg: number,
  tangentMode: Exclude<MainWireQuasiSteadyOrificeValveTangentModeV2, "invalid">,
  validatedOpeningTarget01?: number,
): MainWireQuasiSteadyOrificeValveEvaluationV2 {

  const pressureGradientMmHg =
    upstreamPressureMmHg - downstreamPressureMmHg;
  const activeDirection = directionFromGradient(pressureGradientMmHg);
  const openingTarget01 = validatedOpeningTarget01
    ?? openingTarget(pressureGradientMmHg, params);
  const openingTau = openingTarget01 > previousLeafletOpeningFraction01
    ? params.openingTimeConstantSec
    : params.closingTimeConstantSec;
  const openingEquationResidual01 =
    nextLeafletOpeningFraction01 - previousLeafletOpeningFraction01 -
    dtSec * (openingTarget01 - nextLeafletOpeningFraction01) / openingTau;

  const forwardActiveEoaCm2 = params.closedReverseEroaCm2 +
    nextLeafletOpeningFraction01 *
      (params.maximumForwardEoaCm2 - params.closedReverseEroaCm2);
  const reverseActiveEoaCm2 = params.closedReverseEroaCm2;
  const activeEoaCm2 = activeDirection === "reverse"
    ? reverseActiveEoaCm2
    : forwardActiveEoaCm2;
  const dActiveEoaDPressureGradientCm2PerMmHg =
    activeDirection === "reverse"
      ? 0
      : (params.maximumForwardEoaCm2 - params.closedReverseEroaCm2)
        * dLeafletOpeningFractionDPressureGradientPerMmHg;
  const resistanceMmHgSecPerMl = activeEoaCm2 === 0
    ? 0
    : params.backgroundLinearResistanceMmHgSecPerMl;
  const bernoulliMmHgSec2PerMl2 = activeEoaCm2 === 0
    ? 0
    : idealBernoulliLossFromEffectiveOrificeAreaV2(activeEoaCm2);
  const flowMlPerSec = activeEoaCm2 === 0
    ? 0
    : solveExactSignedQAbsQRoot(
      pressureGradientMmHg,
      resistanceMmHgSecPerMl,
      bernoulliMmHgSec2PerMl2,
    );
  let dFlowDPressureGradientMlPerSecPerMmHg: number;
  let tangentBranch: Exclude<
    MainWireQuasiSteadyOrificeValveTangentBranchV2,
    "invalid"
  >;
  if (activeEoaCm2 === 0) {
    dFlowDPressureGradientMlPerSecPerMmHg = 0;
    tangentBranch = "exact-zero-area-hydraulic-support";
  } else {
    const denominator = resistanceMmHgSecPerMl
      + 2 * bernoulliMmHgSec2PerMl2 * Math.abs(flowMlPerSec);
    if (denominator === 0) {
      dFlowDPressureGradientMlPerSecPerMmHg = 0;
      tangentBranch =
        "zero-gradient-non-lipschitz-zero-linear-resistance";
    } else {
      const dBernoulliDPressureGradient =
        -2 * bernoulliMmHgSec2PerMl2
        * dActiveEoaDPressureGradientCm2PerMmHg / activeEoaCm2;
      dFlowDPressureGradientMlPerSecPerMmHg = (
        1 - flowMlPerSec * Math.abs(flowMlPerSec)
          * dBernoulliDPressureGradient
      ) / denominator;
      tangentBranch = activeDirection === "reverse"
        ? "reverse-regurgitant-orifice"
        : activeDirection === "zero-gradient"
          ? "zero-gradient-forward-open-orifice"
          : "forward-open-orifice";
    }
  }
  const dissipativePressureMmHg = activeEoaCm2 === 0
    ? 0
    : resistanceMmHgSecPerMl * flowMlPerSec +
      bernoulliMmHgSec2PerMl2 * flowMlPerSec * Math.abs(flowMlPerSec);
  const openOrificeResidualMmHg =
    pressureGradientMmHg - dissipativePressureMmHg;

  const competentReverseClosureActive =
    activeDirection === "reverse" && activeEoaCm2 === 0;
  const subthresholdForwardSupportActive =
    activeDirection === "forward" && activeEoaCm2 === 0;
  const competentReverseClosureReactionMmHg = competentReverseClosureActive
    ? -pressureGradientMmHg
    : 0;
  const subthresholdForwardSupportReactionMmHg = subthresholdForwardSupportActive
    ? pressureGradientMmHg
    : 0;
  const signedHydraulicSupportReactionMmHg =
    competentReverseClosureReactionMmHg -
    subthresholdForwardSupportReactionMmHg;
  const hydraulicBalanceResidualMmHg =
    openOrificeResidualMmHg + signedHydraulicSupportReactionMmHg;

  const hydraulicPowerInputMmHgMlPerSec =
    pressureGradientMmHg * flowMlPerSec;
  const dissipativePowerMmHgMlPerSec =
    dissipativePressureMmHg * flowMlPerSec;
  const hydraulicSupportPowerMmHgMlPerSec =
    signedHydraulicSupportReactionMmHg === 0 || flowMlPerSec === 0
      ? 0
      : signedHydraulicSupportReactionMmHg * flowMlPerSec;
  const powerBalanceResidualMmHgMlPerSec =
    hydraulicPowerInputMmHgMlPerSec -
    dissipativePowerMmHgMlPerSec +
    hydraulicSupportPowerMmHgMlPerSec;

  const result = Object.freeze({
    modelId: MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_V2_ID,
    state: Object.freeze({
      leafletOpeningFraction01: nextLeafletOpeningFraction01,
    }),
    flowMlPerSec,
    pressureGradientMmHg,
    activeDirection,
    openingTarget01,
    openingEquationResidual01,
    forwardActiveEoaCm2,
    reverseActiveEoaCm2,
    activeEoaCm2,
    dLeafletOpeningFractionDPressureGradientPerMmHg,
    dFlowDPressureGradientMlPerSecPerMmHg:
      dFlowDPressureGradientMlPerSecPerMmHg,
    tangentMode,
    tangentBranch,
    resistanceMmHgSecPerMl,
    bernoulliMmHgSec2PerMl2,
    dissipativePressureMmHg,
    openOrificeResidualMmHg,
    competentReverseClosureReactionMmHg,
    subthresholdForwardSupportReactionMmHg,
    signedHydraulicSupportReactionMmHg,
    hydraulicBalanceResidualMmHg,
    hydraulicPowerInputMmHgMlPerSec,
    dissipativePowerMmHgMlPerSec,
    hydraulicSupportPowerMmHgMlPerSec,
    powerBalanceResidualMmHgMlPerSec,
    competentReverseClosureActive,
    subthresholdForwardSupportActive,
    leafletMechanicalContactModeled: false,
    reverseRegurgitantFlowEnabled: params.closedReverseEroaCm2 > 0,
    valid: true,
    finite: true,
    issues: Object.freeze([]),
    claim: MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_CLAIM_V2,
  } satisfies MainWireQuasiSteadyOrificeValveEvaluationV2);
  const finite = valveEvaluationNumericReadbackIsFiniteV2(result);
  return finite ? result : Object.freeze({
    ...result,
    valid: false,
    finite: false,
    issues: Object.freeze(["valve evaluation produced non-finite readback"]),
  });
}

function openingTarget(
  pressureGradientMmHg: number,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
): number {
  const openingDriveMmHg = pressureGradientMmHg -
    params.openingDriveDeadbandMmHg -
    params.openingPressureOffsetMmHg;
  const positiveOpeningDriveMmHg = c1PositivePart(
    openingDriveMmHg,
    params.openingDriveSmoothingMmHg,
  );
  return 1 - Math.exp(-params.openingGainPerMmHg * positiveOpeningDriveMmHg);
}

/** Stable closed-form root of delta-p = R q + B q |q|. */
function solveExactSignedQAbsQRoot(
  pressureGradientMmHg: number,
  resistanceMmHgSecPerMl: number,
  bernoulliMmHgSec2PerMl2: number,
): number {
  if (pressureGradientMmHg === 0) return 0;
  const pressureMagnitude = Math.abs(pressureGradientMmHg);
  const discriminant = Math.sqrt(
    resistanceMmHgSecPerMl ** 2 +
    4 * bernoulliMmHgSec2PerMl2 * pressureMagnitude,
  );
  const flowMagnitude =
    2 * pressureMagnitude / (resistanceMmHgSecPerMl + discriminant);
  return Math.sign(pressureGradientMmHg) * flowMagnitude;
}

function validateInputs(
  previous: MainWireQuasiSteadyOrificeValveStateV2,
  input: MainWireQuasiSteadyOrificeValveInputV2,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
): readonly string[] {
  return validateScalarInputs(
    previous.leafletOpeningFraction01,
    input.dtSec,
    input.upstreamPressureMmHg,
    input.downstreamPressureMmHg,
    params,
  );
}

function validateScalarInputs(
  previousLeafletOpeningFraction01: number,
  dtSec: number,
  upstreamPressureMmHg: number,
  downstreamPressureMmHg: number,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
): readonly string[] {
  const paramIssues = validateMainWireQuasiSteadyOrificeValveParamsV2(params);
  const previousInvalid =
    !Number.isFinite(previousLeafletOpeningFraction01) ||
    previousLeafletOpeningFraction01 < 0 ||
    previousLeafletOpeningFraction01 > 1;
  const inputInvalid =
    !(dtSec > 0) ||
    !Number.isFinite(dtSec) ||
    !Number.isFinite(upstreamPressureMmHg) ||
    !Number.isFinite(downstreamPressureMmHg);
  if (paramIssues.length === 0 && !previousInvalid && !inputInvalid) {
    return EMPTY_VALVE_ISSUES_V2;
  }
  const issues = [...paramIssues];
  if (previousInvalid) {
    issues.push("previous valve state must have finite leafletOpeningFraction01 in [0, 1]");
  }
  if (inputInvalid) {
    issues.push("valve input must have positive dtSec and finite pressures");
  }
  return issues;
}

function frozenPlainDataValveParams(
  params: MainWireQuasiSteadyOrificeValveParamsV2,
): boolean {
  if (!Object.isFrozen(params)) return false;
  const prototype = Object.getPrototypeOf(params);
  if (prototype !== Object.prototype && prototype !== null) return false;
  for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(params))) {
    if (!("value" in descriptor)) return false;
  }
  return true;
}

function invalidEvaluation(
  state: MainWireQuasiSteadyOrificeValveStateV2,
  input: MainWireQuasiSteadyOrificeValveInputV2,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
  issues: readonly string[],
): MainWireQuasiSteadyOrificeValveEvaluationV2 {
  return Object.freeze({
    modelId: MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_V2_ID,
    state: Object.freeze({ ...state }),
    flowMlPerSec: Number.NaN,
    pressureGradientMmHg:
      input.upstreamPressureMmHg - input.downstreamPressureMmHg,
    activeDirection: "invalid",
    openingTarget01: Number.NaN,
    openingEquationResidual01: Number.NaN,
    forwardActiveEoaCm2: Number.NaN,
    reverseActiveEoaCm2: Number.NaN,
    activeEoaCm2: Number.NaN,
    dLeafletOpeningFractionDPressureGradientPerMmHg: Number.NaN,
    dFlowDPressureGradientMlPerSecPerMmHg: Number.NaN,
    tangentMode: "invalid",
    tangentBranch: "invalid",
    resistanceMmHgSecPerMl: Number.NaN,
    bernoulliMmHgSec2PerMl2: Number.NaN,
    dissipativePressureMmHg: Number.NaN,
    openOrificeResidualMmHg: Number.NaN,
    competentReverseClosureReactionMmHg: Number.NaN,
    subthresholdForwardSupportReactionMmHg: Number.NaN,
    signedHydraulicSupportReactionMmHg: Number.NaN,
    hydraulicBalanceResidualMmHg: Number.NaN,
    hydraulicPowerInputMmHgMlPerSec: Number.NaN,
    dissipativePowerMmHgMlPerSec: Number.NaN,
    hydraulicSupportPowerMmHgMlPerSec: Number.NaN,
    powerBalanceResidualMmHgMlPerSec: Number.NaN,
    competentReverseClosureActive: false,
    subthresholdForwardSupportActive: false,
    leafletMechanicalContactModeled: false,
    reverseRegurgitantFlowEnabled: params.closedReverseEroaCm2 > 0,
    valid: false,
    finite: false,
    issues: Object.freeze([...issues]),
    claim: MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_CLAIM_V2,
  });
}

function directionFromGradient(
  pressureGradientMmHg: number,
): Exclude<MainWireQuasiSteadyOrificeValveDirectionV2, "invalid"> {
  if (pressureGradientMmHg > 0) return "forward";
  if (pressureGradientMmHg < 0) return "reverse";
  return "zero-gradient";
}

function c1PositivePart(value: number, width: number): number {
  if (value <= 0) return 0;
  if (value >= width) return value - 0.5 * width;
  return value * value / (2 * width);
}

function positive(value: number, name: string, issues: string[]): void {
  if (!(value > 0) || !Number.isFinite(value)) {
    issues.push(`${name} must be positive and finite`);
  }
}

function nonnegative(value: number, name: string, issues: string[]): void {
  if (!(value >= 0) || !Number.isFinite(value)) {
    issues.push(`${name} must be nonnegative and finite`);
  }
}

/** Exact numeric-leaf audit without allocating Object.values arrays. */
function valveEvaluationNumericReadbackIsFiniteV2(
  value: MainWireQuasiSteadyOrificeValveEvaluationV2,
): boolean {
  return Number.isFinite(value.state.leafletOpeningFraction01)
    && Number.isFinite(value.flowMlPerSec)
    && Number.isFinite(value.pressureGradientMmHg)
    && Number.isFinite(value.openingTarget01)
    && Number.isFinite(value.openingEquationResidual01)
    && Number.isFinite(value.forwardActiveEoaCm2)
    && Number.isFinite(value.reverseActiveEoaCm2)
    && Number.isFinite(value.activeEoaCm2)
    && Number.isFinite(
      value.dLeafletOpeningFractionDPressureGradientPerMmHg,
    )
    && Number.isFinite(value.dFlowDPressureGradientMlPerSecPerMmHg)
    && Number.isFinite(value.resistanceMmHgSecPerMl)
    && Number.isFinite(value.bernoulliMmHgSec2PerMl2)
    && Number.isFinite(value.dissipativePressureMmHg)
    && Number.isFinite(value.openOrificeResidualMmHg)
    && Number.isFinite(value.competentReverseClosureReactionMmHg)
    && Number.isFinite(value.subthresholdForwardSupportReactionMmHg)
    && Number.isFinite(value.signedHydraulicSupportReactionMmHg)
    && Number.isFinite(value.hydraulicBalanceResidualMmHg)
    && Number.isFinite(value.hydraulicPowerInputMmHgMlPerSec)
    && Number.isFinite(value.dissipativePowerMmHgMlPerSec)
    && Number.isFinite(value.hydraulicSupportPowerMmHgMlPerSec)
    && Number.isFinite(value.powerBalanceResidualMmHgMlPerSec);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
