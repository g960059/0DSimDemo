import { describe, expect, it } from "vitest";

import {
  MV_PRESSURE_DEADBAND_MMHG,
  buildEdges,
} from "@/engine/core/topology";
import {
  evaluateMainWireQuasiSteadyOrificeValveV1,
  idealBernoulliLossFromEffectiveOrificeAreaV1,
  initialMainWireQuasiSteadyOrificeValveStateV1,
  mainWireQuasiSteadyOrificeValveParamsFromEdgeV1,
  stepMainWireQuasiSteadyOrificeValveV1,
} from "@/engine/mechanics2/valve/MainWireQuasiSteadyOrificeValveV1";

const MV_EDGE = buildEdges().find((edge) => edge.name === "MV")!;
const MV = mainWireQuasiSteadyOrificeValveParamsFromEdgeV1(MV_EDGE);

describe("MainWireQuasiSteadyOrificeValveV1", () => {
  it("maps main-wire geometry without retaining edge B, L, or a deadband fit knob", () => {
    expect(MV.parameterSetId).toBe(
      "main-wire-MV-quasi-steady-physical-orifice-v1",
    );
    expect(MV.openResistanceMmHgSecPerMl).toBe(MV_EDGE.R);
    expect(MV.referenceAreaCm2).toBe(MV_EDGE.Aref);
    expect(MV.maximumAreaCm2).toBe(MV_EDGE.Amax);
    expect(MV.physiologicalLeakAreaCm2).toBe(0);
    expect(MV.numericalAreaFloorCm2).toBeGreaterThan(0);
    expect(MV).not.toHaveProperty("openBernoulliMmHgSec2PerMl2");
    expect(MV).not.toHaveProperty("inertanceMmHgSec2PerMl");
    expect(MV).not.toHaveProperty("pressureDeadbandMmHg");
  });

  it("maps all four authoritative valve edges without copying B or L", () => {
    for (const edge of buildEdges().filter((candidate) => candidate.kind === "valve")) {
      const params = mainWireQuasiSteadyOrificeValveParamsFromEdgeV1(edge);
      expect(params.valveId).toBe(edge.name);
      expect(params.openResistanceMmHgSecPerMl).toBe(edge.R);
      expect(params.referenceAreaCm2).toBe(edge.Aref);
      expect(params.maximumAreaCm2).toBe(edge.Amax);
      expect(params.physiologicalLeakAreaCm2).toBe(edge.Aleak);
      expect(params).not.toHaveProperty("openBernoulliMmHgSec2PerMl2");
      expect(params).not.toHaveProperty("inertanceMmHgSec2PerMl");
    }
  });

  it("derives the native-unit Bernoulli coefficient from EOA without a fitted Cd", () => {
    expect(idealBernoulliLossFromEffectiveOrificeAreaV1(1))
      .toBeCloseTo(3.9753263519819767e-4, 15);
    expect(idealBernoulliLossFromEffectiveOrificeAreaV1(2))
      .toBeCloseTo(idealBernoulliLossFromEffectiveOrificeAreaV1(1) / 4, 15);
    expect(() => idealBernoulliLossFromEffectiveOrificeAreaV1(0))
      .toThrow(/finite and positive/);
  });

  it("stores only leaflet opening while exposing flow as an algebraic readback", () => {
    const previous = initialMainWireQuasiSteadyOrificeValveStateV1(0.5);
    const output = stepMainWireQuasiSteadyOrificeValveV1(
      previous,
      { dtSec: 0.005, upstreamPressureMmHg: 12, downstreamPressureMmHg: 8 },
      MV,
    );
    expect(Object.keys(previous)).toEqual(["leafletOpeningFraction01"]);
    expect(Object.keys(output.state)).toEqual(["leafletOpeningFraction01"]);
    expect(output.flowMlPerSec).toBeGreaterThan(0);
    expect(output.bernoulliMmHgSec2PerMl2).toBeCloseTo(
      idealBernoulliLossFromEffectiveOrificeAreaV1(output.numericalAreaCm2),
      15,
    );
  });

  it("rejects a numerical area floor larger than the physical maximum area", () => {
    const output = stepMainWireQuasiSteadyOrificeValveV1(
      initialMainWireQuasiSteadyOrificeValveStateV1(),
      { dtSec: 0.005, upstreamPressureMmHg: 10, downstreamPressureMmHg: 8 },
      { ...MV, numericalAreaFloorCm2: MV.maximumAreaCm2 + 1 },
    );
    expect(output.valid).toBe(false);
    expect(output.issues).toContain(
      "numericalAreaFloorCm2 must not exceed maximumAreaCm2",
    );
  });

  it("satisfies the backward-Euler leaflet residual and algebraic hydraulic balance", () => {
    const previous = initialMainWireQuasiSteadyOrificeValveStateV1(0);
    const output = stepMainWireQuasiSteadyOrificeValveV1(
      previous,
      { dtSec: 0.005, upstreamPressureMmHg: 12, downstreamPressureMmHg: 8 },
      MV,
    );
    expect(output.valid).toBe(true);
    expect(output.state.leafletOpeningFraction01).toBeGreaterThan(0);
    expect(output.flowMlPerSec).toBeGreaterThan(0);
    expect(Math.abs(output.openingEquationResidual01)).toBeLessThan(1e-12);
    expect(Math.abs(output.hydraulicBalanceResidualMmHg)).toBeLessThan(1e-8);
    expect(output.contactReactionMmHg).toBe(0);
    expect(output.physicalAreaCm2).toBeGreaterThan(0);
  });

  it("represents competent closed-valve adverse pressure as contact reaction", () => {
    const previous = initialMainWireQuasiSteadyOrificeValveStateV1(0);
    const output = stepMainWireQuasiSteadyOrificeValveV1(
      previous,
      { dtSec: 0.005, upstreamPressureMmHg: 5, downstreamPressureMmHg: 20 },
      MV,
    );
    expect(output.valid).toBe(true);
    expect(output.state.leafletOpeningFraction01).toBe(0);
    expect(output.physicalAreaCm2).toBe(0);
    expect(output.numericalAreaCm2).toBe(MV.numericalAreaFloorCm2);
    expect(output.flowMlPerSec).toBe(0);
    expect(output.unconstrainedFlowMlPerSec).toBeLessThan(0);
    expect(output.reverseConstraintActive).toBe(true);
    expect(output.pathologicalLeakEnabled).toBe(false);
    expect(output.openOrificeResidualMmHg).toBe(-15);
    expect(output.contactReactionMmHg).toBe(15);
    expect(output.hydraulicBalanceResidualMmHg).toBe(0);
    expect(output.complementarityProductMmHgMlPerSec).toBe(0);
    expect(output.powerBalanceResidualMmHgMlPerSec).toBe(0);
  });

  it("does not generate flow, reaction, or power at zero-gradient contact", () => {
    const output = stepMainWireQuasiSteadyOrificeValveV1(
      initialMainWireQuasiSteadyOrificeValveStateV1(0),
      { dtSec: 0.005, upstreamPressureMmHg: 8, downstreamPressureMmHg: 8 },
      MV,
    );
    expect(output.flowMlPerSec).toBe(0);
    expect(output.openOrificeResidualMmHg).toBe(0);
    expect(output.contactReactionMmHg).toBe(0);
    expect(output.hydraulicBalanceResidualMmHg).toBe(0);
    expect(output.powerBalanceResidualMmHgMlPerSec).toBe(0);
  });

  it("permits bidirectional flow only when a physiological leak is declared", () => {
    const leaky = { ...MV, physiologicalLeakAreaCm2: 0.15 };
    const previous = initialMainWireQuasiSteadyOrificeValveStateV1(0);
    const output = stepMainWireQuasiSteadyOrificeValveV1(
      previous,
      { dtSec: 0.005, upstreamPressureMmHg: 5, downstreamPressureMmHg: 20 },
      leaky,
    );
    expect(output.valid).toBe(true);
    expect(output.flowMlPerSec).toBeLessThan(0);
    expect(output.reverseConstraintActive).toBe(false);
    expect(output.pathologicalLeakEnabled).toBe(true);
    expect(output.contactReactionMmHg).toBe(0);
    expect(Math.abs(output.openOrificeResidualMmHg)).toBeLessThan(1e-8);
    expect(Math.abs(output.hydraulicBalanceResidualMmHg)).toBeLessThan(1e-8);
  });

  it("exposes a nonnegative dissipative ledger and pure accepted-state replay", () => {
    const previous = initialMainWireQuasiSteadyOrificeValveStateV1(0.8);
    const input = {
      dtSec: 0.005,
      upstreamPressureMmHg: 11,
      downstreamPressureMmHg: 9,
    } as const;
    const output = stepMainWireQuasiSteadyOrificeValveV1(previous, input, MV);
    expect(output.valid).toBe(true);
    expect(output.reverseConstraintActive).toBe(false);
    expect(output.dissipativePowerProxyMmHgMlPerSec).toBeGreaterThanOrEqual(0);
    expect(Math.abs(output.hydraulicBalanceResidualMmHg)).toBeLessThan(1e-8);
    expect(Math.abs(output.powerBalanceResidualMmHgMlPerSec)).toBeLessThan(1e-6);

    const replay = evaluateMainWireQuasiSteadyOrificeValveV1(
      previous,
      input,
      output.state,
      MV,
    );
    expect(replay).toEqual(output);
  });

  it("sources the MV drive deadband from topology and keeps its C1 onset continuous", () => {
    const previous = initialMainWireQuasiSteadyOrificeValveStateV1(1);
    const closing = stepMainWireQuasiSteadyOrificeValveV1(
      previous,
      { dtSec: 0.005, upstreamPressureMmHg: 10, downstreamPressureMmHg: 9 },
      MV,
    );
    expect(closing.state.leafletOpeningFraction01)
      .toBeLessThan(previous.leafletOpeningFraction01);
    expect(closing.openingDriveDeadbandMmHg).toBe(MV_PRESSURE_DEADBAND_MMHG);

    const below = stepMainWireQuasiSteadyOrificeValveV1(
      initialMainWireQuasiSteadyOrificeValveStateV1(0),
      {
        dtSec: 0.005,
        upstreamPressureMmHg: 8 + MV_PRESSURE_DEADBAND_MMHG,
        downstreamPressureMmHg: 8,
      },
      MV,
    );
    const justAbove = stepMainWireQuasiSteadyOrificeValveV1(
      initialMainWireQuasiSteadyOrificeValveStateV1(0),
      {
        dtSec: 0.005,
        upstreamPressureMmHg: 8 + MV_PRESSURE_DEADBAND_MMHG + 1e-6,
        downstreamPressureMmHg: 8,
      },
      MV,
    );
    expect(below.openingTarget01).toBe(0);
    expect(justAbove.openingTarget01).toBeGreaterThanOrEqual(0);
    expect(justAbove.openingTarget01).toBeLessThan(1e-8);
  });
});
