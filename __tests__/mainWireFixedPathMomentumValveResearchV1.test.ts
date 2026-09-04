import { describe, expect, it } from "vitest";
import {
  MAIN_WIRE_FIXED_PATH_MOMENTUM_VALVE_RESEARCH_V1_ID,
  stepMainWireFixedPathMomentumValveResearchV1,
  validateMainWireFixedPathMomentumValveResearchInputV1,
  type MainWireFixedPathMomentumValveResearchInputV1,
} from "@/engine/valves/MainWireFixedPathMomentumValveResearchV1";
import { MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1 } from
  "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import { stepMainWireQuasiSteadyOrificeValveScalarsV2 } from
  "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";
import {
  createInitialNonCoronaryCirculationStateV1,
  evaluateNonCoronaryCirculationBackwardEulerTrialV1,
  resolveNonCoronaryCirculationColdSeedV1,
  type NonCoronaryCirculationRuntimeParamsV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";

const params = MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1.valves.AoV;
const research = (previousAcceptedFlowMlPerSec = 200, inertanceMmHgSec2PerMl = 0.0003):
  MainWireFixedPathMomentumValveResearchInputV1 => Object.freeze({
    inertanceMmHgSec2PerMl, previousAcceptedFlowMlPerSec, baseRevision: 0, baseAcceptedTimeSec: 0,
  });
function run(pressure: number, previousQ = 200, opening = 0.4, dt = 0.002) {
  const result = stepMainWireFixedPathMomentumValveResearchV1(
    opening, dt, pressure, 0, params, research(previousQ),
  );
  if (result.modelId !== MAIN_WIRE_FIXED_PATH_MOMENTUM_VALVE_RESEARCH_V1_ID) throw new Error("research law absent");
  return result;
}

describe("fixed-path competent AoV momentum research law", () => {
  it.each([-40, -1, 0, 0.02, 1, 10])("has literal canonical zero-L evaluation at Δp=%s", (pressure) => {
    expect(stepMainWireFixedPathMomentumValveResearchV1(0.4, 0.002, pressure, 0, params, research(200, 0)))
      .toEqual(stepMainWireQuasiSteadyOrificeValveScalarsV2(0.4, 0.002, pressure, 0, params));
  });

  it("retains forward EOA and positive decelerating Q under adverse pressure", () => {
    const actual = run(-1);
    const canonical = stepMainWireQuasiSteadyOrificeValveScalarsV2(0.4, 0.002, -1, 0, params);
    expect(canonical.flowMlPerSec).toBe(0);
    expect(actual.state).toEqual(canonical.state);
    expect(actual.flowMlPerSec).toBeGreaterThan(0);
    expect(actual.flowMlPerSec).toBeLessThan(200);
    expect(actual.flowAccelerationMlPerSec2).toBeLessThan(0);
    expect(actual.inertialPressureMmHg).toBeLessThan(0);
    expect(actual.activeDirection).toBe("forward");
    expect(actual.activeEoaCm2).toBe(actual.forwardActiveEoaCm2);
    expect(actual.signedHydraulicSupportReactionMmHg).toBe(0);
    expect(actual.claim.productionModelOrCheckpointChanged).toBe(false);
  });

  it("decelerates to unilateral contact with zero power, not negative flow", () => {
    const actual = run(-40);
    expect(actual.forwardActiveEoaCm2).toBeGreaterThan(0);
    expect(actual.flowMlPerSec).toBe(0);
    expect(actual.tangentBranch).toBe("research-unilateral-support");
    expect(actual.signedHydraulicSupportReactionMmHg).toBeCloseTo(10, 12);
    expect(actual.competentReverseClosureReactionMmHg).toBeCloseTo(10, 12);
    expect(actual.hydraulicSupportPowerMmHgMlPerSec).toBe(0);
    expect(actual.backwardEulerNumericalDissipationMmHgMl)
      .toBeCloseTo(actual.kineticEnergyStartMmHgMl, 13);
    expect(actual.dFlowDPressureGradientMlPerSecPerMmHg).toBe(0);
  });

  it("distinguishes zero-area signed support from positive-area unilateral contact", () => {
    const reverse = run(-1, 0, 0);
    expect(reverse.tangentBranch).toBe("research-zero-area-support");
    expect(reverse.signedHydraulicSupportReactionMmHg).toBe(1);
    // A tiny positive drive has exactly zero canonical opening at machine precision.
    const forward = run(1e-9, 0, 0);
    expect(forward.forwardActiveEoaCm2).toBe(0);
    expect(forward.tangentBranch).toBe("research-zero-area-support");
    expect(forward.flowMlPerSec).toBe(0);
    expect(forward.signedHydraulicSupportReactionMmHg).toBe(-1e-9);
    expect(forward.subthresholdForwardSupportActive).toBe(true);
    expect(forward.competentReverseClosureActive).toBe(false);
    expect(forward.hydraulicBalanceResidualMmHg).toBe(0);
    expect(forward.powerBalanceResidualMmHgMlPerSec).toBe(0);
    expect(() => run(-1, 10, 0)).toThrow(/cannot discard positive accepted momentum/);
  });

  it.each([-40, -1, 0, 0.02, 1, 10])("has the total opening-eliminated tangent at Δp=%s", (pressure) => {
    const actual = run(pressure);
    const epsilon = 1e-4;
    const centered = (h: number) => (run(pressure + h).flowMlPerSec
      - run(pressure - h).flowMlPerSec) / (2 * h);
    // At Δp=0 the opening drive is C1, not C2, so the centered error is O(h).
    // Elsewhere it is O(h²); use the corresponding Richardson factor, not a
    // looser tolerance. Both nontrivial truncation regimes must converge.
    const factor = pressure === 0 ? 2 : 4;
    if (pressure === 0 || pressure === 0.02) {
      const coarseChange = centered(epsilon) - centered(epsilon / 2);
      const fineChange = centered(epsilon / 2) - centered(epsilon / 4);
      expect(coarseChange / fineChange).toBeCloseTo(factor, 2);
    }
    const finiteDifference = (factor * centered(epsilon / 2) - centered(epsilon)) / (factor - 1);
    expect(actual.dFlowDPressureGradientMlPerSecPerMmHg).toBeCloseTo(finiteDifference, 6);
  });

  it("satisfies momentum, power, and fixed-L BE energy balances over forward and contact branches", () => {
    for (const dt of [0.002, 0.001]) for (const pressure of [-80, -1, 0, 0.02, 1, 10, 80]) {
      const actual = run(pressure, 200, 0.4, dt);
      expect(Math.abs(actual.hydraulicBalanceResidualMmHg)).toBeLessThan(1e-11);
      expect(actual.momentumResidualMmHg).toBe(actual.hydraulicBalanceResidualMmHg);
      expect(Math.abs(actual.powerBalanceResidualMmHgMlPerSec)).toBeLessThan(1e-8);
      expect(Math.abs(actual.backwardEulerEnergyBalanceResidualMmHgMl)).toBeLessThan(1e-10);
      expect(actual.dissipativePowerMmHgMlPerSec).toBeGreaterThanOrEqual(0);
      expect(actual.backwardEulerNumericalDissipationMmHgMl).toBeGreaterThanOrEqual(0);
      expect(actual.signedHydraulicSupportReactionMmHg).toBeGreaterThanOrEqual(0);
      expect(actual.flowMlPerSec * actual.signedHydraulicSupportReactionMmHg).toBe(0);
    }
  });

  it("keeps accepted memory unchanged across probes and rejects unsupported/invalid inputs", () => {
    const input = research();
    const first = stepMainWireFixedPathMomentumValveResearchV1(0.4, 0.002, -1, 0, params, input);
    stepMainWireFixedPathMomentumValveResearchV1(0.4, 0.002, 10, 0, params, input);
    expect(stepMainWireFixedPathMomentumValveResearchV1(0.4, 0.002, -1, 0, params, input)).toEqual(first);
    expect(input).toEqual(research());
    for (const change of [{ closedReverseEroaCm2: 0.1 }, { maximumForwardEoaCm2: 2 }, { openingTimeConstantSec: 0.01 }]) {
      expect(() => stepMainWireFixedPathMomentumValveResearchV1(0.4, 0.002, 10, 0, { ...params, ...change }, input))
        .toThrow(/unchanged healthy competent/);
    }
    for (const change of [{ inertanceMmHgSec2PerMl: -1 }, { inertanceMmHgSec2PerMl: NaN },
      { previousAcceptedFlowMlPerSec: -1 }, { previousAcceptedFlowMlPerSec: Infinity },
      { baseRevision: 0.1 }, { baseAcceptedTimeSec: -1 }]) {
      expect(() => validateMainWireFixedPathMomentumValveResearchInputV1({ ...input, ...change })).toThrow();
    }
    expect(() => run(NaN)).toThrow();
    expect(() => run(10, 200, 0.4, 0)).toThrow();
  });
});

describe("reference circulation research hook", () => {
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = {
    vascular: { venousTone: 0, arterialStiffness: 1 },
    losses: { systemicResistance: 1, pulmonaryResistance: 1 },
    respiratory: { PEEP: 0, Pth0: 0, respAmpTh: 0, respAmpAlv: 0, respRate: 0 },
    valveResearchInput: MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
  };
  const previous = createInitialNonCoronaryCirculationStateV1({
    timeSec: 0, runtime,
    fixedTotalBloodVolumeMl: resolveNonCoronaryCirculationColdSeedV1(runtime).fixedTotalBloodVolumeMl,
  });
  const input = {
    previousAcceptedState: previous, runtime, dtSec: 0.002,
    evaluateCandidateMechanics: () => ({
      absolutePressuresMmHg: { LV: 120, LA: 12, RV: 25, RA: 7 }, evaluation: null,
    }),
  };

  it("has zero-L canonical parity and preserves Ao_SA inertia and LV/Ao incidence", () => {
    const canonical = evaluateNonCoronaryCirculationBackwardEulerTrialV1(input);
    const zero = evaluateNonCoronaryCirculationBackwardEulerTrialV1({ ...input, aorticMomentumResearch: research(200, 0) });
    expect(zero).toEqual(canonical);
    const actual = evaluateNonCoronaryCirculationBackwardEulerTrialV1({ ...input, aorticMomentumResearch: research() });
    if (actual.converged === false) throw new Error(actual.message);
    expect(actual.valveEvaluations.AoV.modelId).toBe(MAIN_WIRE_FIXED_PATH_MOMENTUM_VALVE_RESEARCH_V1_ID);
    const q = actual.edgeFlowsMlPerSec;
    expect(actual.candidateNodeVolumesMl.LV - previous.nodeVolumesMl.LV)
      .toBeCloseTo(input.dtSec * (q.MV - q.AoV), 8);
    expect(actual.candidateNodeVolumesMl.Ao - previous.nodeVolumesMl.Ao)
      .toBeCloseTo(input.dtSec * (q.AoV - q.Ao_SA), 8);
    expect(actual.nodeAbsolutePressuresMmHg.Ao - actual.nodeAbsolutePressuresMmHg.SA)
      .toBeCloseTo(0.0465088 * q.Ao_SA + 0.002
        * (q.Ao_SA - previous.dynamicEdgeFlowsMlPerSec.Ao_SA) / input.dtSec, 10);
    expect(Object.keys(actual.candidateDynamicEdgeFlowsMlPerSec).sort()).toEqual(["Ao_SA", "PA_PArt"]);
    expect(Object.keys(actual.candidateValveStates.AoV)).toEqual(["leafletOpeningFraction01"]);
  });

  it("rejects stale Q binding without changing the accepted substrate", () => {
    const before = JSON.stringify(previous);
    for (const stale of [{ baseRevision: 1 }, { baseAcceptedTimeSec: 0.001 }]) {
      const failed = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
        ...input, aorticMomentumResearch: { ...research(), ...stale },
      });
      expect(failed.converged).toBe(false);
      if (failed.converged === true) throw new Error("stale state was accepted");
      expect(failed.reason).toBe("invalid-input");
      expect(failed.message).toMatch(/stale accepted Q/);
    }
    expect(JSON.stringify(previous)).toBe(before);
  });
});
