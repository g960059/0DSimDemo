import {
  MV_PRESSURE_DEADBAND_MMHG,
  type EdgeSpec,
  type ValveName,
} from "@/engine/core/topology";

export const MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_V1_ID =
  "main-wire-quasi-steady-orifice-valve-v1" as const;

export const MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V1 = 1060 as const;
export const MAIN_WIRE_VALVE_PA_PER_MMHG_V1 = 133.322387415 as const;

export const MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_CLAIM_V1 = Object.freeze({
  topology: "algebraic-flow-and-bounded-opening-memory" as const,
  acceptedMemory: "leaflet-opening-fraction-only" as const,
  timeDiscretization:
    "backward-euler-opening-state-plus-algebraic-monotone-flow-root" as const,
  pressureFlowLaw:
    "quasi-steady-linear-and-smooth-quadratic-orifice-loss" as const,
  flowMemory: false as const,
  areaScaling: "R-inverse-area-squared-and-B-from-instantaneous-EOA" as const,
  parameterSemantics:
    "main-wire-Aref-as-effective-orifice-area-rho-1060-Cd-1-edge-B-and-L-not-used" as const,
  bernoulliConstruction:
    "rho-over-two-instantaneous-effective-orifice-area-squared" as const,
  mitralOpeningDeadband:
    "topology-owned-0p60-mmHg-unvalidated-main-wire-prior-not-fit-knob" as const,
  physiologicalLeakSeparatedFromNumericalAreaFloor: true as const,
  competentValveClosure:
    "semismooth-unilateral-flow-with-nonnegative-contact-reaction" as const,
  complementarity:
    "q-nonnegative-reaction-nonnegative-q-times-reaction-zero" as const,
  qOrQdotClampUsedAsPhysiology: false as const,
  pressureOrPhaseShapeFitting: false as const,
});

export type MainWireQuasiSteadyOrificeValveParamsV1 = {
  readonly parameterSetId: string;
  readonly valveId: ValveName;
  readonly openResistanceMmHgSecPerMl: number;
  readonly referenceAreaCm2: number;
  readonly maximumAreaCm2: number;
  /** A real bidirectional regurgitant orifice. Zero means a competent valve. */
  readonly physiologicalLeakAreaCm2: number;
  /** Conditioning only; never interpreted as a regurgitant orifice. */
  readonly numericalAreaFloorCm2: number;
  readonly openingGainPerMmHg: number;
  readonly openingPressureOffsetMmHg: number;
  /** C1 conditioning width for the pressure-driven opening target. */
  readonly openingDriveSmoothingMmHg: number;
  readonly openingTimeConstantSec: number;
  readonly closingTimeConstantSec: number;
  readonly quadraticFlowSmoothingMlPerSec: number;
};

/** The accepted valve memory is leaflet opening only; flow is algebraic. */
export type MainWireQuasiSteadyOrificeValveStateV1 = {
  readonly leafletOpeningFraction01: number;
};

export type MainWireQuasiSteadyOrificeValveInputV1 = {
  readonly dtSec: number;
  readonly upstreamPressureMmHg: number;
  readonly downstreamPressureMmHg: number;
};

export type MainWireQuasiSteadyOrificeValveEvaluationV1 = {
  readonly modelId: typeof MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_V1_ID;
  readonly state: MainWireQuasiSteadyOrificeValveStateV1;
  /** Algebraic bulk flow, not part of accepted memory. */
  readonly flowMlPerSec: number;
  readonly pressureGradientMmHg: number;
  readonly openingDriveDeadbandMmHg: number;
  readonly openingTarget01: number;
  readonly openingEquationResidual01: number;
  readonly physicalAreaCm2: number;
  readonly numericalAreaCm2: number;
  readonly areaRatio: number;
  readonly resistanceMmHgSecPerMl: number;
  readonly bernoulliMmHgSec2PerMl2: number;
  readonly unconstrainedFlowMlPerSec: number;
  /**
   * Residual of the open-orifice equation before adding valve contact.
   * It is intentionally nonzero under competent closed-valve adverse pressure.
   */
  readonly openOrificeResidualMmHg: number;
  /** Nonnegative pressure reaction enforcing q >= 0 for a competent valve. */
  readonly contactReactionMmHg: number;
  readonly hydraulicBalanceResidualMmHg: number;
  readonly complementarityProductMmHgMlPerSec: number;
  readonly dissipativePowerProxyMmHgMlPerSec: number;
  readonly powerBalanceResidualMmHgMlPerSec: number;
  readonly reverseConstraintActive: boolean;
  readonly pathologicalLeakEnabled: boolean;
  readonly valid: boolean;
  readonly finite: boolean;
  readonly issues: readonly string[];
  readonly claim: typeof MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_CLAIM_V1;
};

export function mainWireQuasiSteadyOrificeValveParamsFromEdgeV1(
  edge: EdgeSpec,
): MainWireQuasiSteadyOrificeValveParamsV1 {
  if (edge.kind !== "valve") {
    throw new Error(`edge ${edge.name} is not a valve`);
  }
  const valveId = edge.name as ValveName;
  const referenceAreaCm2 = edge.Aref ?? edge.Amax ?? 1;
  return Object.freeze({
    parameterSetId: `main-wire-${valveId}-quasi-steady-physical-orifice-v1`,
    valveId,
    openResistanceMmHgSecPerMl: edge.R,
    referenceAreaCm2,
    maximumAreaCm2: edge.Amax ?? edge.Aref ?? 1,
    physiologicalLeakAreaCm2: edge.Aleak ?? 0,
    numericalAreaFloorCm2: 1e-4,
    openingGainPerMmHg: edge.kOpen ?? 2,
    openingPressureOffsetMmHg: edge.dP0 ?? 0,
    openingDriveSmoothingMmHg: 0.1,
    openingTimeConstantSec: edge.tauOpen ?? 0.012,
    closingTimeConstantSec: edge.tauClose ?? 0.02,
    quadraticFlowSmoothingMlPerSec: 0.25,
  });
}

/**
 * Fixed convective-orifice construction expressed in the model's native units.
 *
 * `effectiveOrificeAreaCm2` already includes contraction/discharge effects, so
 * Cd is exactly one here. Introducing a second Cd would double-count the EOA
 * semantics and create an unconstrained fitting knob. Treating this entire
 * term as dissipative is the explicit zero-dimensional closure used here; it
 * does not claim to resolve upstream kinetic head or downstream recovery.
 */
export function idealBernoulliLossFromEffectiveOrificeAreaV1(
  effectiveOrificeAreaCm2: number,
): number {
  if (!(effectiveOrificeAreaCm2 > 0) || !Number.isFinite(effectiveOrificeAreaCm2)) {
    throw new Error("effectiveOrificeAreaCm2 must be finite and positive");
  }
  const areaM2 = effectiveOrificeAreaCm2 * 1e-4;
  const mlPerSecToM3PerSec = 1e-6;
  return MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V1 /
    (2 * MAIN_WIRE_VALVE_PA_PER_MMHG_V1) *
    (mlPerSecToM3PerSec / areaM2) ** 2;
}

export function validateMainWireQuasiSteadyOrificeValveParamsV1(
  params: MainWireQuasiSteadyOrificeValveParamsV1,
): readonly string[] {
  const issues: string[] = [];
  if (typeof params.parameterSetId !== "string" || params.parameterSetId.trim() === "") {
    issues.push("parameterSetId must be non-empty");
  }
  if (!["MV", "AoV", "TV", "PV"].includes(params.valveId)) {
    issues.push("valveId must be a main-wire valve");
  }
  nonnegative(params.openResistanceMmHgSecPerMl, "openResistanceMmHgSecPerMl", issues);
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
  if (!Number.isFinite(params.openingPressureOffsetMmHg)) {
    issues.push("openingPressureOffsetMmHg must be finite");
  }
  positive(params.openingDriveSmoothingMmHg, "openingDriveSmoothingMmHg", issues);
  positive(params.openingTimeConstantSec, "openingTimeConstantSec", issues);
  positive(params.closingTimeConstantSec, "closingTimeConstantSec", issues);
  positive(params.quadraticFlowSmoothingMlPerSec, "quadraticFlowSmoothingMlPerSec", issues);
  return Object.freeze(issues);
}

export function initialMainWireQuasiSteadyOrificeValveStateV1(
  leafletOpeningFraction01 = 0,
): MainWireQuasiSteadyOrificeValveStateV1 {
  if (!Number.isFinite(leafletOpeningFraction01)) {
    throw new Error("initial valve opening state must be finite");
  }
  return Object.freeze({
    leafletOpeningFraction01: clamp(leafletOpeningFraction01, 0, 1),
  });
}

export function stepMainWireQuasiSteadyOrificeValveV1(
  previous: MainWireQuasiSteadyOrificeValveStateV1,
  input: MainWireQuasiSteadyOrificeValveInputV1,
  params: MainWireQuasiSteadyOrificeValveParamsV1,
): MainWireQuasiSteadyOrificeValveEvaluationV1 {
  const preliminaryIssues = validateInputs(previous, input, params);
  if (preliminaryIssues.length > 0) {
    return invalidEvaluation(previous, input, params, preliminaryIssues);
  }
  const gradient = input.upstreamPressureMmHg - input.downstreamPressureMmHg;
  const target = openingTarget(gradient, params);
  const tau = target > previous.leafletOpeningFraction01
    ? params.openingTimeConstantSec
    : params.closingTimeConstantSec;
  const ratio = input.dtSec / tau;
  const leafletOpeningFraction01 = clamp(
    (previous.leafletOpeningFraction01 + ratio * target) / (1 + ratio),
    0,
    1,
  );
  return evaluateMainWireQuasiSteadyOrificeValveV1(
    previous,
    input,
    { leafletOpeningFraction01 },
    params,
  );
}

/** Pure accepted-opening-state residual for a monolithic circulation transaction. */
export function evaluateMainWireQuasiSteadyOrificeValveV1(
  previous: MainWireQuasiSteadyOrificeValveStateV1,
  input: MainWireQuasiSteadyOrificeValveInputV1,
  next: MainWireQuasiSteadyOrificeValveStateV1,
  params: MainWireQuasiSteadyOrificeValveParamsV1,
): MainWireQuasiSteadyOrificeValveEvaluationV1 {
  const issues = validateInputs(previous, input, params);
  if (
    !Number.isFinite(next.leafletOpeningFraction01) ||
    next.leafletOpeningFraction01 < 0 ||
    next.leafletOpeningFraction01 > 1
  ) {
    issues.push("next valve state must have finite leafletOpeningFraction01 in [0, 1]");
  }
  if (issues.length > 0) return invalidEvaluation(next, input, params, issues);

  const pressureGradientMmHg =
    input.upstreamPressureMmHg - input.downstreamPressureMmHg;
  const openingTarget01 = openingTarget(pressureGradientMmHg, params);
  const openingTau = openingTarget01 > previous.leafletOpeningFraction01
    ? params.openingTimeConstantSec
    : params.closingTimeConstantSec;
  const openingEquationResidual01 =
    next.leafletOpeningFraction01 - previous.leafletOpeningFraction01 -
    input.dtSec * (openingTarget01 - next.leafletOpeningFraction01) / openingTau;
  const losses = lossTerms(next.leafletOpeningFraction01, params);
  const unconstrainedFlowMlPerSec = solveMonotoneFlowRoot(
    pressureGradientMmHg,
    losses.resistance,
    losses.bernoulli,
    params.quadraticFlowSmoothingMlPerSec,
  );
  const pathologicalLeakEnabled = params.physiologicalLeakAreaCm2 > 0;
  const reverseConstraintActive =
    !pathologicalLeakEnabled && unconstrainedFlowMlPerSec < 0;
  const flowMlPerSec = reverseConstraintActive ? 0 : unconstrainedFlowMlPerSec;
  const smoothAbs = Math.sqrt(
    flowMlPerSec * flowMlPerSec +
    params.quadraticFlowSmoothingMlPerSec ** 2,
  );
  const dissipativePressureMmHg =
    losses.resistance * flowMlPerSec +
    losses.bernoulli * flowMlPerSec * smoothAbs;
  const openOrificeResidualMmHg =
    pressureGradientMmHg - dissipativePressureMmHg;
  const contactReactionMmHg = reverseConstraintActive
    ? -pressureGradientMmHg
    : 0;
  const hydraulicBalanceResidualMmHg =
    openOrificeResidualMmHg + contactReactionMmHg;
  const complementarityProductMmHgMlPerSec =
    contactReactionMmHg * flowMlPerSec;
  const dissipativePowerProxyMmHgMlPerSec =
    dissipativePressureMmHg * flowMlPerSec;
  const powerBalanceResidualMmHgMlPerSec =
    pressureGradientMmHg * flowMlPerSec -
    dissipativePowerProxyMmHgMlPerSec +
    complementarityProductMmHgMlPerSec;
  const result = Object.freeze({
    modelId: MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_V1_ID,
    state: Object.freeze({ ...next }),
    flowMlPerSec,
    pressureGradientMmHg,
    openingDriveDeadbandMmHg: topologyOpeningDeadbandMmHg(params.valveId),
    openingTarget01,
    openingEquationResidual01,
    physicalAreaCm2: losses.physicalArea,
    numericalAreaCm2: losses.numericalArea,
    areaRatio: losses.areaRatio,
    resistanceMmHgSecPerMl: losses.resistance,
    bernoulliMmHgSec2PerMl2: losses.bernoulli,
    unconstrainedFlowMlPerSec,
    openOrificeResidualMmHg,
    contactReactionMmHg,
    hydraulicBalanceResidualMmHg,
    complementarityProductMmHgMlPerSec,
    dissipativePowerProxyMmHgMlPerSec,
    powerBalanceResidualMmHgMlPerSec,
    reverseConstraintActive,
    pathologicalLeakEnabled,
    valid: true,
    finite: true,
    issues: Object.freeze([]),
    claim: MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_CLAIM_V1,
  } satisfies MainWireQuasiSteadyOrificeValveEvaluationV1);
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
  params: MainWireQuasiSteadyOrificeValveParamsV1,
): number {
  const driveMmHg = gradientMmHg -
    topologyOpeningDeadbandMmHg(params.valveId) -
    params.openingPressureOffsetMmHg;
  const positiveDriveMmHg = c1PositivePart(
    driveMmHg,
    params.openingDriveSmoothingMmHg,
  );
  return 1 - Math.exp(-params.openingGainPerMmHg * positiveDriveMmHg);
}

function topologyOpeningDeadbandMmHg(valveId: ValveName): number {
  return valveId === "MV" ? MV_PRESSURE_DEADBAND_MMHG : 0;
}

function lossTerms(
  leafletOpeningFraction01: number,
  params: MainWireQuasiSteadyOrificeValveParamsV1,
) {
  const physicalArea = params.physiologicalLeakAreaCm2 +
    clamp(leafletOpeningFraction01, 0, 1) *
    (params.maximumAreaCm2 - params.physiologicalLeakAreaCm2);
  const numericalArea = Math.max(physicalArea, params.numericalAreaFloorCm2);
  const areaRatio = numericalArea / params.referenceAreaCm2;
  return Object.freeze({
    physicalArea,
    numericalArea,
    areaRatio,
    resistance:
      params.openResistanceMmHgSecPerMl / Math.max(areaRatio ** 2, 1e-12),
    // Algebraically this is rho/(2*A_numerical^2). Keeping the graph EOA as
    // the unit-normalization reference preserves the previous arithmetic
    // ordering without retaining a mutable Bernoulli coefficient.
    bernoulli:
      idealBernoulliLossFromEffectiveOrificeAreaV1(params.referenceAreaCm2) /
      Math.max(areaRatio ** 2, 1e-12),
  });
}

function solveMonotoneFlowRoot(
  gradient: number,
  resistance: number,
  bernoulli: number,
  flowSmoothing: number,
): number {
  const residual = (q: number) =>
    resistance * q +
    bernoulli * q * Math.sqrt(q * q + flowSmoothing * flowSmoothing) -
    gradient;
  if (Math.abs(residual(0)) <= 1e-14) return 0;
  let lower = -1;
  let upper = 1;
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
  previous: MainWireQuasiSteadyOrificeValveStateV1,
  input: MainWireQuasiSteadyOrificeValveInputV1,
  params: MainWireQuasiSteadyOrificeValveParamsV1,
): string[] {
  const issues = [...validateMainWireQuasiSteadyOrificeValveParamsV1(params)];
  if (
    !Number.isFinite(previous.leafletOpeningFraction01) ||
    previous.leafletOpeningFraction01 < 0 ||
    previous.leafletOpeningFraction01 > 1
  ) {
    issues.push("previous valve state must have finite leafletOpeningFraction01 in [0, 1]");
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
  state: MainWireQuasiSteadyOrificeValveStateV1,
  input: MainWireQuasiSteadyOrificeValveInputV1,
  params: MainWireQuasiSteadyOrificeValveParamsV1,
  issues: readonly string[],
): MainWireQuasiSteadyOrificeValveEvaluationV1 {
  return Object.freeze({
    modelId: MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_V1_ID,
    state: Object.freeze({ ...state }),
    flowMlPerSec: Number.NaN,
    pressureGradientMmHg:
      input.upstreamPressureMmHg - input.downstreamPressureMmHg,
    openingDriveDeadbandMmHg: topologyOpeningDeadbandMmHg(params.valveId),
    openingTarget01: Number.NaN,
    openingEquationResidual01: Number.NaN,
    physicalAreaCm2: Number.NaN,
    numericalAreaCm2: Number.NaN,
    areaRatio: Number.NaN,
    resistanceMmHgSecPerMl: Number.NaN,
    bernoulliMmHgSec2PerMl2: Number.NaN,
    unconstrainedFlowMlPerSec: Number.NaN,
    openOrificeResidualMmHg: Number.NaN,
    contactReactionMmHg: Number.NaN,
    hydraulicBalanceResidualMmHg: Number.NaN,
    complementarityProductMmHgMlPerSec: Number.NaN,
    dissipativePowerProxyMmHgMlPerSec: Number.NaN,
    powerBalanceResidualMmHgMlPerSec: Number.NaN,
    reverseConstraintActive: false,
    pathologicalLeakEnabled: params.physiologicalLeakAreaCm2 > 0,
    valid: false,
    finite: false,
    issues: Object.freeze([...issues]),
    claim: MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_CLAIM_V1,
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
