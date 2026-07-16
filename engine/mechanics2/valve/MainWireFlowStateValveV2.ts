import type { EdgeSpec, ValveName } from "@/engine/core/topology";

export const MAIN_WIRE_FLOW_STATE_VALVE_V2_ID =
  "main-wire-flow-state-valve-v2" as const;

export const MAIN_WIRE_FLOW_STATE_VALVE_CLAIM_V2 = Object.freeze({
  topology: "independent-flow-and-bounded-opening-state" as const,
  timeDiscretization: "backward-euler-accepted-state-residual" as const,
  pressureFlowLaw:
    "inertance-plus-linear-and-smooth-quadratic-loss" as const,
  areaScaling: "R-and-B-inverse-area-squared-L-constant" as const,
  parameterSemantics: "model-core-main-wire-Aref-Amax-Aleak-R-L-B" as const,
  physiologicalLeakSeparatedFromNumericalAreaFloor: true as const,
  zeroLeakClosedReverseFlow: "semismooth-unilateral-q-greater-than-or-equal-to-zero" as const,
  qOrQdotClampUsedAsPhysiology: false as const,
  pressureOrPhaseShapeFitting: false as const,
});

export type MainWireFlowStateValveParamsV2 = {
  readonly parameterSetId: string;
  readonly valveId: ValveName;
  readonly openResistanceMmHgSecPerMl: number;
  readonly openInertanceMmHgSec2PerMl: number;
  readonly rootInertanceMmHgSec2PerMl: number;
  readonly openBernoulliMmHgSec2PerMl2: number;
  readonly referenceAreaCm2: number;
  readonly maximumAreaCm2: number;
  /** A real bidirectional regurgitant orifice. Zero means a competent valve. */
  readonly physiologicalLeakAreaCm2: number;
  /** Conditioning only; never interpreted as a regurgitant orifice. */
  readonly numericalAreaFloorCm2: number;
  readonly openingGainPerMmHg: number;
  readonly pressureDeadbandMmHg: number;
  readonly openingPressureOffsetMmHg: number;
  /** C1 conditioning width for the pressure-driven opening target. */
  readonly openingDriveSmoothingMmHg: number;
  readonly openingTimeConstantSec: number;
  readonly closingTimeConstantSec: number;
  readonly quadraticFlowSmoothingMlPerSec: number;
};

export type MainWireFlowStateValveStateV2 = {
  readonly qMlPerSec: number;
  readonly openingFraction01: number;
};

export type MainWireFlowStateValveInputV2 = {
  readonly dtSec: number;
  readonly upstreamPressureMmHg: number;
  readonly downstreamPressureMmHg: number;
};

export type MainWireFlowStateValveEvaluationV2 = {
  readonly modelId: typeof MAIN_WIRE_FLOW_STATE_VALVE_V2_ID;
  readonly state: MainWireFlowStateValveStateV2;
  readonly pressureGradientMmHg: number;
  readonly openingTarget01: number;
  readonly openingEquationResidual01: number;
  readonly physicalAreaCm2: number;
  readonly numericalAreaCm2: number;
  readonly areaRatio: number;
  readonly resistanceMmHgSecPerMl: number;
  readonly inertanceMmHgSec2PerMl: number;
  readonly bernoulliMmHgSec2PerMl2: number;
  readonly rawMomentumRootMlPerSec: number;
  readonly reverseFlowFloorMlPerSec: number | null;
  readonly projectedMomentumRootMlPerSec: number;
  readonly acceptedStateFlowResidualMlPerSec: number;
  readonly pressureFlowResidualMmHg: number;
  readonly closureProjectionDeltaMlPerSec: number;
  readonly dissipativePowerProxyMmHgMlPerSec: number;
  readonly kineticEnergyChangeRateProxyMmHgMlPerSec: number;
  readonly backwardEulerNumericalDissipationProxyMmHgMlPerSec: number;
  readonly discreteEnergyBalanceResidualMmHgMlPerSec: number;
  readonly reverseConstraintActive: boolean;
  readonly pathologicalLeakEnabled: boolean;
  readonly valid: boolean;
  readonly finite: boolean;
  readonly issues: readonly string[];
  readonly claim: typeof MAIN_WIRE_FLOW_STATE_VALVE_CLAIM_V2;
};

export function mainWireFlowStateValveParamsFromEdgeV2(
  edge: EdgeSpec,
  rootInertanceMmHgSec2PerMl = 0,
): MainWireFlowStateValveParamsV2 {
  if (edge.kind !== "valve") {
    throw new Error(`edge ${edge.name} is not a valve`);
  }
  const valveId = edge.name as ValveName;
  return Object.freeze({
    parameterSetId: `main-wire-${valveId}-flow-state-v2`,
    valveId,
    openResistanceMmHgSecPerMl: edge.R,
    openInertanceMmHgSec2PerMl: edge.L ?? 0,
    rootInertanceMmHgSec2PerMl,
    openBernoulliMmHgSec2PerMl2: edge.B ?? 0,
    referenceAreaCm2: edge.Aref ?? edge.Amax ?? 1,
    maximumAreaCm2: edge.Amax ?? edge.Aref ?? 1,
    physiologicalLeakAreaCm2: edge.Aleak ?? 0,
    numericalAreaFloorCm2: 1e-4,
    openingGainPerMmHg: edge.kOpen ?? 2,
    pressureDeadbandMmHg: valveId === "MV" ? 0.6 : 0,
    openingPressureOffsetMmHg: edge.dP0 ?? 0,
    openingDriveSmoothingMmHg: 0.1,
    openingTimeConstantSec: edge.tauOpen ?? 0.012,
    closingTimeConstantSec: edge.tauClose ?? 0.02,
    quadraticFlowSmoothingMlPerSec: 0.25,
  });
}

export function validateMainWireFlowStateValveParamsV2(
  params: MainWireFlowStateValveParamsV2,
): readonly string[] {
  const issues: string[] = [];
  if (typeof params.parameterSetId !== "string" || params.parameterSetId.trim() === "") {
    issues.push("parameterSetId must be non-empty");
  }
  if (!["MV", "AoV", "TV", "PV"].includes(params.valveId)) {
    issues.push("valveId must be a main-wire valve");
  }
  nonnegative(params.openResistanceMmHgSecPerMl, "openResistanceMmHgSecPerMl", issues);
  nonnegative(params.openInertanceMmHgSec2PerMl, "openInertanceMmHgSec2PerMl", issues);
  nonnegative(params.rootInertanceMmHgSec2PerMl, "rootInertanceMmHgSec2PerMl", issues);
  if (!(params.openInertanceMmHgSec2PerMl + params.rootInertanceMmHgSec2PerMl > 0)) {
    issues.push("total open inertance must be positive");
  }
  nonnegative(params.openBernoulliMmHgSec2PerMl2, "openBernoulliMmHgSec2PerMl2", issues);
  positive(params.referenceAreaCm2, "referenceAreaCm2", issues);
  positive(params.maximumAreaCm2, "maximumAreaCm2", issues);
  nonnegative(params.physiologicalLeakAreaCm2, "physiologicalLeakAreaCm2", issues);
  if (params.physiologicalLeakAreaCm2 > params.maximumAreaCm2) {
    issues.push("physiologicalLeakAreaCm2 must not exceed maximumAreaCm2");
  }
  positive(params.numericalAreaFloorCm2, "numericalAreaFloorCm2", issues);
  if (params.numericalAreaFloorCm2 > params.maximumAreaCm2) {
    issues.push("numericalAreaFloorCm2 must not exceed maximumAreaCm2");
  }
  positive(params.openingGainPerMmHg, "openingGainPerMmHg", issues);
  nonnegative(params.pressureDeadbandMmHg, "pressureDeadbandMmHg", issues);
  if (!Number.isFinite(params.openingPressureOffsetMmHg)) {
    issues.push("openingPressureOffsetMmHg must be finite");
  }
  positive(params.openingDriveSmoothingMmHg, "openingDriveSmoothingMmHg", issues);
  positive(params.openingTimeConstantSec, "openingTimeConstantSec", issues);
  positive(params.closingTimeConstantSec, "closingTimeConstantSec", issues);
  positive(params.quadraticFlowSmoothingMlPerSec, "quadraticFlowSmoothingMlPerSec", issues);
  return Object.freeze(issues);
}

export function initialMainWireFlowStateValveStateV2(
  qMlPerSec = 0,
  openingFraction01 = 0,
): MainWireFlowStateValveStateV2 {
  if (!Number.isFinite(qMlPerSec) || !Number.isFinite(openingFraction01)) {
    throw new Error("initial valve state must be finite");
  }
  return Object.freeze({
    qMlPerSec,
    openingFraction01: clamp(openingFraction01, 0, 1),
  });
}

export function stepMainWireFlowStateValveV2(
  previous: MainWireFlowStateValveStateV2,
  input: MainWireFlowStateValveInputV2,
  params: MainWireFlowStateValveParamsV2,
): MainWireFlowStateValveEvaluationV2 {
  const preliminaryIssues = validateInputs(previous, input, params);
  if (preliminaryIssues.length > 0) {
    return invalidEvaluation(previous, input, params, preliminaryIssues);
  }
  const gradient = input.upstreamPressureMmHg - input.downstreamPressureMmHg;
  const target = openingTarget(gradient, params);
  const tau = target > previous.openingFraction01
    ? params.openingTimeConstantSec
    : params.closingTimeConstantSec;
  const ratio = input.dtSec / tau;
  const openingFraction01 = clamp(
    (previous.openingFraction01 + ratio * target) / (1 + ratio),
    0,
    1,
  );
  const targetFlow = flowTarget(
    previous.qMlPerSec,
    openingFraction01,
    gradient,
    input.dtSec,
    params,
  );
  return evaluateMainWireFlowStateValveV2(
    previous,
    input,
    { qMlPerSec: targetFlow.projected, openingFraction01 },
    params,
  );
}

/** Pure accepted-state residual for a monolithic circulation transaction. */
export function evaluateMainWireFlowStateValveV2(
  previous: MainWireFlowStateValveStateV2,
  input: MainWireFlowStateValveInputV2,
  next: MainWireFlowStateValveStateV2,
  params: MainWireFlowStateValveParamsV2,
): MainWireFlowStateValveEvaluationV2 {
  const issues = validateInputs(previous, input, params);
  if (
    !Number.isFinite(next.qMlPerSec) ||
    !Number.isFinite(next.openingFraction01) ||
    next.openingFraction01 < 0 ||
    next.openingFraction01 > 1
  ) {
    issues.push("next valve state must be finite with openingFraction01 in [0, 1]");
  }
  if (issues.length > 0) return invalidEvaluation(next, input, params, issues);
  const pressureGradientMmHg =
    input.upstreamPressureMmHg - input.downstreamPressureMmHg;
  const openingTarget01 = openingTarget(pressureGradientMmHg, params);
  const openingTau = openingTarget01 > previous.openingFraction01
    ? params.openingTimeConstantSec
    : params.closingTimeConstantSec;
  const openingEquationResidual01 =
    next.openingFraction01 - previous.openingFraction01 -
    input.dtSec * (openingTarget01 - next.openingFraction01) / openingTau;
  const losses = lossTerms(next.openingFraction01, params);
  const target = flowTarget(
    previous.qMlPerSec,
    next.openingFraction01,
    pressureGradientMmHg,
    input.dtSec,
    params,
  );
  const qDot = (next.qMlPerSec - previous.qMlPerSec) / input.dtSec;
  const smoothAbs = Math.sqrt(
    next.qMlPerSec * next.qMlPerSec +
    params.quadraticFlowSmoothingMlPerSec ** 2,
  );
  const pressureFlowResidualMmHg = pressureGradientMmHg -
    losses.inertance * qDot - losses.resistance * next.qMlPerSec -
    losses.bernoulli * next.qMlPerSec * smoothAbs;
  const dissipativePowerProxyMmHgMlPerSec =
    losses.resistance * next.qMlPerSec ** 2 +
    losses.bernoulli * next.qMlPerSec ** 2 * smoothAbs;
  const kineticEnergyChangeRateProxyMmHgMlPerSec =
    0.5 * losses.inertance *
    (next.qMlPerSec ** 2 - previous.qMlPerSec ** 2) / input.dtSec;
  const backwardEulerNumericalDissipationProxyMmHgMlPerSec =
    0.5 * losses.inertance *
    (next.qMlPerSec - previous.qMlPerSec) ** 2 / input.dtSec;
  const discreteEnergyBalanceResidualMmHgMlPerSec =
    pressureGradientMmHg * next.qMlPerSec -
    dissipativePowerProxyMmHgMlPerSec -
    kineticEnergyChangeRateProxyMmHgMlPerSec -
    backwardEulerNumericalDissipationProxyMmHgMlPerSec;
  const result = Object.freeze({
    modelId: MAIN_WIRE_FLOW_STATE_VALVE_V2_ID,
    state: Object.freeze({ ...next }),
    pressureGradientMmHg,
    openingTarget01,
    openingEquationResidual01,
    physicalAreaCm2: losses.physicalArea,
    numericalAreaCm2: losses.numericalArea,
    areaRatio: losses.areaRatio,
    resistanceMmHgSecPerMl: losses.resistance,
    inertanceMmHgSec2PerMl: losses.inertance,
    bernoulliMmHgSec2PerMl2: losses.bernoulli,
    rawMomentumRootMlPerSec: target.raw,
    reverseFlowFloorMlPerSec: target.floor,
    projectedMomentumRootMlPerSec: target.projected,
    acceptedStateFlowResidualMlPerSec: next.qMlPerSec - target.projected,
    pressureFlowResidualMmHg,
    closureProjectionDeltaMlPerSec: target.projected - target.raw,
    dissipativePowerProxyMmHgMlPerSec,
    kineticEnergyChangeRateProxyMmHgMlPerSec,
    backwardEulerNumericalDissipationProxyMmHgMlPerSec,
    discreteEnergyBalanceResidualMmHgMlPerSec,
    reverseConstraintActive: Math.abs(target.projected - target.raw) > 1e-10,
    pathologicalLeakEnabled: params.physiologicalLeakAreaCm2 > 0,
    valid: true,
    finite: true,
    issues: Object.freeze([]),
    claim: MAIN_WIRE_FLOW_STATE_VALVE_CLAIM_V2,
  } satisfies MainWireFlowStateValveEvaluationV2);
  const finite = numericLeaves(result).every(Number.isFinite);
  return finite ? result : Object.freeze({
    ...result,
    valid: false,
    finite: false,
    issues: Object.freeze(["valve evaluation produced non-finite readback"]),
  });
}

function openingTarget(
  gradientMmHg: number,
  params: MainWireFlowStateValveParamsV2,
): number {
  const driveMmHg = gradientMmHg - params.pressureDeadbandMmHg -
    params.openingPressureOffsetMmHg;
  const positiveDriveMmHg = c1PositivePart(
    driveMmHg,
    params.openingDriveSmoothingMmHg,
  );
  return 1 - Math.exp(-params.openingGainPerMmHg * positiveDriveMmHg);
}

function lossTerms(
  openingFraction01: number,
  params: MainWireFlowStateValveParamsV2,
) {
  const physicalArea = params.physiologicalLeakAreaCm2 +
    clamp(openingFraction01, 0, 1) *
    (params.maximumAreaCm2 - params.physiologicalLeakAreaCm2);
  const numericalArea = Math.max(physicalArea, params.numericalAreaFloorCm2);
  const areaRatio = numericalArea / params.referenceAreaCm2;
  return Object.freeze({
    physicalArea,
    numericalArea,
    areaRatio,
    resistance:
      params.openResistanceMmHgSecPerMl / Math.max(areaRatio ** 2, 1e-12),
    bernoulli:
      params.openBernoulliMmHgSec2PerMl2 /
      Math.max(areaRatio ** 2, 1e-12),
    // Keep inertance independent of leaflet area. An L(xi) law would require
    // the reciprocal leaflet/fluid generalized-force term in both the
    // momentum equation and the discrete energy ledger. Main wire does not
    // own that extra coupling, so adding only L(xi) would create or destroy
    // kinetic energy when xi changes.
    inertance:
      params.openInertanceMmHgSec2PerMl +
      params.rootInertanceMmHgSec2PerMl,
  });
}

function flowTarget(
  previousQ: number,
  openingFraction01: number,
  gradientMmHg: number,
  dtSec: number,
  params: MainWireFlowStateValveParamsV2,
): { readonly raw: number; readonly floor: number | null; readonly projected: number } {
  const losses = lossTerms(openingFraction01, params);
  const raw = solveMonotoneMomentumRoot(
    previousQ,
    gradientMmHg,
    dtSec,
    losses.resistance,
    losses.inertance,
    losses.bernoulli,
    params.quadraticFlowSmoothingMlPerSec,
  );
  if (params.physiologicalLeakAreaCm2 > 0) {
    return Object.freeze({ raw, floor: null, projected: raw });
  }
  // A competent ideal valve is a unilateral hydraulic constraint. Forward
  // inertia is retained because a positive root is allowed after pressure
  // reversal; reverse flow requires an explicit physiological leak area.
  // The exact max is semismooth and, unlike a rounded max, does not inject a
  // positive flow or power at contact.
  return Object.freeze({ raw, floor: 0, projected: Math.max(raw, 0) });
}

function solveMonotoneMomentumRoot(
  previousQ: number,
  gradient: number,
  dtSec: number,
  resistance: number,
  inertance: number,
  bernoulli: number,
  flowSmoothing: number,
): number {
  const residual = (q: number) =>
    inertance * (q - previousQ) / dtSec + resistance * q +
    bernoulli * q * Math.sqrt(q * q + flowSmoothing * flowSmoothing) -
    gradient;
  if (Math.abs(residual(0)) <= 1e-14) return 0;
  let lower = Math.min(previousQ, 0) - 1;
  let upper = Math.max(previousQ, 0) + 1;
  for (let iteration = 0; iteration < 80 && residual(lower) > 0; iteration += 1) {
    lower = 2 * lower - 1;
  }
  for (let iteration = 0; iteration < 80 && residual(upper) < 0; iteration += 1) {
    upper = 2 * upper + 1;
  }
  if (residual(lower) > 0 || residual(upper) < 0) return Number.NaN;
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const midpoint = 0.5 * (lower + upper);
    if (residual(midpoint) > 0) upper = midpoint;
    else lower = midpoint;
  }
  return 0.5 * (lower + upper);
}

function validateInputs(
  previous: MainWireFlowStateValveStateV2,
  input: MainWireFlowStateValveInputV2,
  params: MainWireFlowStateValveParamsV2,
): string[] {
  const issues = [...validateMainWireFlowStateValveParamsV2(params)];
  if (
    !Number.isFinite(previous.qMlPerSec) ||
    !Number.isFinite(previous.openingFraction01) ||
    previous.openingFraction01 < 0 ||
    previous.openingFraction01 > 1
  ) {
    issues.push("previous valve state must be finite with openingFraction01 in [0, 1]");
  }
  if (
    !(input.dtSec > 0) ||
    !Number.isFinite(input.dtSec) ||
    !Number.isFinite(input.upstreamPressureMmHg) ||
    !Number.isFinite(input.downstreamPressureMmHg)
  ) {
    issues.push("valve input must have positive dtSec and finite pressures");
  }
  return issues;
}

function invalidEvaluation(
  state: MainWireFlowStateValveStateV2,
  input: MainWireFlowStateValveInputV2,
  params: MainWireFlowStateValveParamsV2,
  issues: readonly string[],
): MainWireFlowStateValveEvaluationV2 {
  return Object.freeze({
    modelId: MAIN_WIRE_FLOW_STATE_VALVE_V2_ID,
    state: Object.freeze({ ...state }),
    pressureGradientMmHg:
      input.upstreamPressureMmHg - input.downstreamPressureMmHg,
    openingTarget01: Number.NaN,
    openingEquationResidual01: Number.NaN,
    physicalAreaCm2: Number.NaN,
    numericalAreaCm2: Number.NaN,
    areaRatio: Number.NaN,
    resistanceMmHgSecPerMl: Number.NaN,
    inertanceMmHgSec2PerMl: Number.NaN,
    bernoulliMmHgSec2PerMl2: Number.NaN,
    rawMomentumRootMlPerSec: Number.NaN,
    reverseFlowFloorMlPerSec: null,
    projectedMomentumRootMlPerSec: Number.NaN,
    acceptedStateFlowResidualMlPerSec: Number.NaN,
    pressureFlowResidualMmHg: Number.NaN,
    closureProjectionDeltaMlPerSec: Number.NaN,
    dissipativePowerProxyMmHgMlPerSec: Number.NaN,
    kineticEnergyChangeRateProxyMmHgMlPerSec: Number.NaN,
    backwardEulerNumericalDissipationProxyMmHgMlPerSec: Number.NaN,
    discreteEnergyBalanceResidualMmHgMlPerSec: Number.NaN,
    reverseConstraintActive: false,
    pathologicalLeakEnabled: params.physiologicalLeakAreaCm2 > 0,
    valid: false,
    finite: false,
    issues: Object.freeze([...issues]),
    claim: MAIN_WIRE_FLOW_STATE_VALVE_CLAIM_V2,
  });
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

function numericLeaves(value: unknown): number[] {
  if (typeof value === "number") return [value];
  if (value == null || typeof value !== "object") return [];
  return Object.values(value).flatMap(numericLeaves);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
