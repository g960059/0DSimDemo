import {
  idealBernoulliLossFromEffectiveOrificeAreaV2,
  stepMainWireQuasiSteadyOrificeValveScalarsV2,
  type MainWireQuasiSteadyOrificeValveEvaluationV2,
  type MainWireQuasiSteadyOrificeValveParamsV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";
import { MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1 } from
  "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";

export const MAIN_WIRE_FIXED_PATH_MOMENTUM_VALVE_RESEARCH_V1_ID =
  "main-wire-fixed-path-momentum-valve-research-v1" as const;

/** Trial input only. A separate research owner must promote Q atomically. */
export type MainWireFixedPathMomentumValveResearchInputV1 = Readonly<{
  inertanceMmHgSec2PerMl: number;
  previousAcceptedFlowMlPerSec: number;
  baseRevision: number;
  baseAcceptedTimeSec: number;
}>;

export const MAIN_WIRE_FIXED_PATH_MOMENTUM_VALVE_RESEARCH_CLAIM_V1 = Object.freeze({
  researchOnly: true as const,
  productionModelOrCheckpointChanged: false as const,
  acceptedFlowMemoryOwner: "external-clock-bound-atomic-research-owner" as const,
  topology: "fixed-path-inertance-plus-competent-unilateral-orifice" as const,
  openingLaw: "unchanged-endpoint-pressure-driven-phenomenological-memory" as const,
  positiveFlowArea: "contemporaneous-forward-EOA-even-under-adverse-pressure" as const,
  closure: "positive-forward-area-nonnegative-flow-complementarity-not-pressure-sign-flow-reset" as const,
  zeroAreaSupport: "zero-flow-constraint-with-signed-reaction-not-nonnegative-reaction-complementarity" as const,
  activeDirection: "forward-for-positive-flow-otherwise-pressure-support-direction" as const,
  timeDiscretization: "backward-euler" as const,
  zeroAreaWithPositiveAcceptedFlow: "reject-inconsistent-state" as const,
  tangentAtZeroFlowDrive: "closed-side-zero" as const,
  fixedPathAreaEqualsValveEoaClaimed: false as const,
  leafletMechanicalContactModeled: false as const,
  regurgitationModeled: false as const,
  numericalAreaFloorUsed: false as const,
  parameterFittingApplied: false as const,
});

export type MainWireFixedPathMomentumValveResearchEvaluationV1 = Readonly<
  Omit<MainWireQuasiSteadyOrificeValveEvaluationV2, "modelId" | "claim" | "tangentBranch"> & {
    modelId: typeof MAIN_WIRE_FIXED_PATH_MOMENTUM_VALVE_RESEARCH_V1_ID;
    claim: typeof MAIN_WIRE_FIXED_PATH_MOMENTUM_VALVE_RESEARCH_CLAIM_V1;
    tangentBranch: "research-forward-momentum" | "research-unilateral-support" | "research-zero-area-support";
    fixedInertanceMmHgSec2PerMl: number;
    previousAcceptedFlowMlPerSec: number;
    flowAccelerationMlPerSec2: number;
    inertialPressureMmHg: number;
    inertialPowerMmHgMlPerSec: number;
    momentumResidualMmHg: number;
    kineticEnergyStartMmHgMl: number;
    kineticEnergyEndMmHgMl: number;
    backwardEulerNumericalDissipationMmHgMl: number;
    backwardEulerEnergyBalanceResidualMmHgMl: number;
  }
>;

export function validateMainWireFixedPathMomentumValveResearchInputV1(
  input: MainWireFixedPathMomentumValveResearchInputV1,
): void {
  for (const [name, value] of Object.entries(input)) finite(value, name);
  if (!Number.isFinite(input.inertanceMmHgSec2PerMl) || input.inertanceMmHgSec2PerMl < 0
    || !Number.isFinite(input.previousAcceptedFlowMlPerSec) || input.previousAcceptedFlowMlPerSec < 0
    || !Number.isSafeInteger(input.baseRevision) || input.baseRevision < 0
    || !Number.isFinite(input.baseAcceptedTimeSec) || input.baseAcceptedTimeSec < 0) {
    throw new Error("fixed-path momentum research input has invalid flow, inertance, or clock");
  }
}

/** No state promotion: every candidate consumes the same externally accepted Q. */
export function stepMainWireFixedPathMomentumValveResearchV1(
  previousOpening01: number,
  dtSec: number,
  upstreamPressureMmHg: number,
  downstreamPressureMmHg: number,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
  input: MainWireFixedPathMomentumValveResearchInputV1,
): MainWireQuasiSteadyOrificeValveEvaluationV2 | MainWireFixedPathMomentumValveResearchEvaluationV1 {
  validateMainWireFixedPathMomentumValveResearchInputV1(input);
  const base = stepMainWireQuasiSteadyOrificeValveScalarsV2(
    previousOpening01, dtSec, upstreamPressureMmHg, downstreamPressureMmHg, params,
  );
  if (input.inertanceMmHgSec2PerMl === 0) return base;
  if (!base.valid || !base.finite) throw new Error(`invalid research valve candidate: ${base.issues.join("; ")}`);
  const normal = MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1.valves.AoV;
  for (const key of Object.keys(normal) as Array<keyof typeof normal>) {
    if (key !== "parameterSetId" && params[key] !== normal[key]) {
      throw new Error("fixed-path momentum research requires unchanged healthy competent AoV parameters");
    }
  }
  const L = input.inertanceMmHgSec2PerMl;
  const previousQ = input.previousAcceptedFlowMlPerSec;
  const area = base.forwardActiveEoaCm2;
  if (area === 0 && previousQ > 0) throw new Error("zero area cannot discard positive accepted momentum");
  const drive = base.pressureGradientMmHg + L * previousQ / dtSec;
  const open = area > 0 && drive > 0;
  const activeArea = open ? area : base.activeEoaCm2;
  const R = activeArea > 0 ? params.backgroundLinearResistanceMmHgSecPerMl : 0;
  const B = activeArea > 0 ? idealBernoulliLossFromEffectiveOrificeAreaV2(activeArea) : 0;
  const linear = R + L / dtSec;
  const discriminant = Math.sqrt(linear ** 2 + 4 * B * Math.max(0, drive));
  for (const [name, value] of Object.entries({ drive, R, B, linear, discriminant })) finite(value, name);
  const q = open ? 2 * drive / (linear + discriminant) : 0;
  if (open && !(q > 0)) throw new Error("positive momentum drive underflowed to zero flow");
  const acceleration = (q - previousQ) / dtSec;
  const inertialPressure = L * acceleration;
  const loss = R * q + B * q * q;
  const support = open ? 0 : inertialPressure - base.pressureGradientMmHg;
  const reverseClosure = !open && support > 0;
  const forwardSupport = !open && support < 0;
  const dArea = params.maximumForwardEoaCm2
    * base.dLeafletOpeningFractionDPressureGradientPerMmHg;
  const dB = open ? -2 * B * dArea / area : 0;
  const dQ = open ? (1 - q * q * dB) / (linear + 2 * B * q) : 0;
  const kineticStart = 0.5 * L * previousQ ** 2;
  const kineticEnd = 0.5 * L * q ** 2;
  const numericalDissipation = 0.5 * L * (q - previousQ) ** 2;
  const hydraulicPower = q === 0 ? 0 : base.pressureGradientMmHg * q;
  const dissipativePower = loss * q;
  const inertialPower = q === 0 ? 0 : inertialPressure * q;
  const supportPower = support === 0 || q === 0 ? 0 : support * q;
  const balance = base.pressureGradientMmHg - loss - inertialPressure + support;
  const result = Object.freeze({
    ...base,
    modelId: MAIN_WIRE_FIXED_PATH_MOMENTUM_VALVE_RESEARCH_V1_ID,
    claim: MAIN_WIRE_FIXED_PATH_MOMENTUM_VALVE_RESEARCH_CLAIM_V1,
    flowMlPerSec: q,
    activeDirection: open ? "forward" as const : base.activeDirection,
    activeEoaCm2: activeArea,
    resistanceMmHgSecPerMl: R,
    bernoulliMmHgSec2PerMl2: B,
    dFlowDPressureGradientMlPerSecPerMmHg: dQ,
    tangentBranch: area === 0 ? "research-zero-area-support" as const
      : open ? "research-forward-momentum" as const : "research-unilateral-support" as const,
    dissipativePressureMmHg: loss,
    openOrificeResidualMmHg: base.pressureGradientMmHg - loss,
    competentReverseClosureActive: reverseClosure,
    subthresholdForwardSupportActive: forwardSupport,
    competentReverseClosureReactionMmHg: reverseClosure ? support : 0,
    subthresholdForwardSupportReactionMmHg: forwardSupport ? -support : 0,
    signedHydraulicSupportReactionMmHg: support,
    hydraulicBalanceResidualMmHg: balance,
    hydraulicPowerInputMmHgMlPerSec: hydraulicPower,
    dissipativePowerMmHgMlPerSec: dissipativePower,
    hydraulicSupportPowerMmHgMlPerSec: supportPower,
    powerBalanceResidualMmHgMlPerSec: hydraulicPower - dissipativePower - inertialPower + supportPower,
    fixedInertanceMmHgSec2PerMl: L,
    previousAcceptedFlowMlPerSec: previousQ,
    flowAccelerationMlPerSec2: acceleration,
    inertialPressureMmHg: inertialPressure,
    inertialPowerMmHgMlPerSec: inertialPower,
    momentumResidualMmHg: balance,
    kineticEnergyStartMmHgMl: kineticStart,
    kineticEnergyEndMmHgMl: kineticEnd,
    backwardEulerNumericalDissipationMmHgMl: numericalDissipation,
    backwardEulerEnergyBalanceResidualMmHgMl:
      dtSec * (hydraulicPower - dissipativePower + supportPower)
        - (kineticEnd - kineticStart) - numericalDissipation,
  } satisfies MainWireFixedPathMomentumValveResearchEvaluationV1);
  for (const [name, value] of Object.entries(result)) {
    if (typeof value === "number") finite(value, name);
  }
  return result;
}

function finite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
}
