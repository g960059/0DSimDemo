import { describe, expect, it } from "vitest";

import { buildEdges } from "@/engine/core/topology";
import {
  evaluateMainWireFlowStateValveV2,
  initialMainWireFlowStateValveStateV2,
  mainWireFlowStateValveParamsFromEdgeV2,
  stepMainWireFlowStateValveV2,
} from "@/engine/mechanics2/valve/MainWireFlowStateValveV2";

const MV_EDGE = buildEdges().find((edge) => edge.name === "MV")!;
const MV = mainWireFlowStateValveParamsFromEdgeV2(MV_EDGE);

describe("MainWireFlowStateValveV2", () => {
  it("uses the live main-wire valve parameter namespace without inventing a leak", () => {
    expect(MV.openResistanceMmHgSecPerMl).toBe(MV_EDGE.R);
    expect(MV.openInertanceMmHgSec2PerMl).toBe(MV_EDGE.L);
    expect(MV.openBernoulliMmHgSec2PerMl2).toBe(MV_EDGE.B);
    expect(MV.referenceAreaCm2).toBe(MV_EDGE.Aref);
    expect(MV.maximumAreaCm2).toBe(MV_EDGE.Amax);
    expect(MV.physiologicalLeakAreaCm2).toBe(0);
    expect(MV.numericalAreaFloorCm2).toBeGreaterThan(0);
    expect(MV.pressureDeadbandMmHg).toBe(0.6);
  });

  it("maps all four authoritative valve edges", () => {
    for (const edge of buildEdges().filter((candidate) => candidate.kind === "valve")) {
      const params = mainWireFlowStateValveParamsFromEdgeV2(edge);
      expect(params.valveId).toBe(edge.name);
      expect(params.openResistanceMmHgSecPerMl).toBe(edge.R);
      expect(params.openInertanceMmHgSec2PerMl).toBe(edge.L);
      expect(params.physiologicalLeakAreaCm2).toBe(edge.Aleak);
    }
  });

  it("returns an accepted state satisfying both backward-Euler residuals", () => {
    const previous = initialMainWireFlowStateValveStateV2(0, 0);
    const output = stepMainWireFlowStateValveV2(
      previous,
      { dtSec: 0.005, upstreamPressureMmHg: 12, downstreamPressureMmHg: 8 },
      MV,
    );
    expect(output.valid).toBe(true);
    expect(output.state.openingFraction01).toBeGreaterThan(0);
    expect(output.state.qMlPerSec).toBeGreaterThan(0);
    expect(Math.abs(output.openingEquationResidual01)).toBeLessThan(1e-12);
    expect(Math.abs(output.acceptedStateFlowResidualMlPerSec)).toBeLessThan(1e-12);
    expect(output.physicalAreaCm2).toBeGreaterThan(0);
  });

  it("makes a competent fully closed valve exactly non-regurgitant", () => {
    const previous = initialMainWireFlowStateValveStateV2(0, 0);
    const output = stepMainWireFlowStateValveV2(
      previous,
      { dtSec: 0.005, upstreamPressureMmHg: 5, downstreamPressureMmHg: 20 },
      MV,
    );
    expect(output.valid).toBe(true);
    expect(output.state.openingFraction01).toBe(0);
    expect(output.physicalAreaCm2).toBe(0);
    expect(output.numericalAreaCm2).toBe(MV.numericalAreaFloorCm2);
    expect(output.state.qMlPerSec).toBe(0);
    expect(output.reverseConstraintActive).toBe(true);
    expect(output.pathologicalLeakEnabled).toBe(false);
    expect(Math.abs(output.discreteEnergyBalanceResidualMmHgMlPerSec))
      .toBeLessThan(1e-10);
  });

  it("does not generate flow or power at unilateral contact", () => {
    const previous = initialMainWireFlowStateValveStateV2(0, 0);
    const output = stepMainWireFlowStateValveV2(
      previous,
      { dtSec: 0.005, upstreamPressureMmHg: 8, downstreamPressureMmHg: 8 },
      MV,
    );
    expect(output.state.qMlPerSec).toBe(0);
    expect(output.closureProjectionDeltaMlPerSec).toBe(0);
    expect(output.pressureFlowResidualMmHg).toBe(0);
    expect(output.discreteEnergyBalanceResidualMmHgMlPerSec).toBe(0);
  });

  it("permits bidirectional flow only when a physiological leak is declared", () => {
    const leaky = { ...MV, physiologicalLeakAreaCm2: 0.15 };
    const previous = initialMainWireFlowStateValveStateV2(0, 0);
    const output = stepMainWireFlowStateValveV2(
      previous,
      { dtSec: 0.005, upstreamPressureMmHg: 5, downstreamPressureMmHg: 20 },
      leaky,
    );
    expect(output.valid).toBe(true);
    expect(output.state.qMlPerSec).toBeLessThan(0);
    expect(output.reverseConstraintActive).toBe(false);
    expect(output.pathologicalLeakEnabled).toBe(true);
    expect(Math.abs(output.pressureFlowResidualMmHg)).toBeLessThan(1e-8);
  });

  it("exposes a nonnegative dissipative ledger away from closure projection", () => {
    const previous = initialMainWireFlowStateValveStateV2(80, 0.8);
    const output = stepMainWireFlowStateValveV2(
      previous,
      { dtSec: 0.005, upstreamPressureMmHg: 11, downstreamPressureMmHg: 9 },
      MV,
    );
    expect(output.valid).toBe(true);
    expect(output.reverseConstraintActive).toBe(false);
    expect(output.dissipativePowerProxyMmHgMlPerSec).toBeGreaterThanOrEqual(0);
    expect(Math.abs(output.pressureFlowResidualMmHg)).toBeLessThan(1e-8);
    expect(Math.abs(output.discreteEnergyBalanceResidualMmHgMlPerSec))
      .toBeLessThan(1e-6);

    const replay = evaluateMainWireFlowStateValveV2(
      previous,
      { dtSec: 0.005, upstreamPressureMmHg: 11, downstreamPressureMmHg: 9 },
      output.state,
      MV,
    );
    expect(replay).toEqual(output);
  });

  it("keeps inertance constant while opening changes and has a continuous opening target", () => {
    const previous = initialMainWireFlowStateValveStateV2(80, 1);
    const closing = stepMainWireFlowStateValveV2(
      previous,
      { dtSec: 0.005, upstreamPressureMmHg: 10, downstreamPressureMmHg: 9 },
      MV,
    );
    expect(closing.state.openingFraction01).toBeLessThan(previous.openingFraction01);
    expect(closing.inertanceMmHgSec2PerMl).toBe(
      MV.openInertanceMmHgSec2PerMl + MV.rootInertanceMmHgSec2PerMl,
    );
    expect(Math.abs(closing.discreteEnergyBalanceResidualMmHgMlPerSec))
      .toBeLessThan(1e-6);

    const below = stepMainWireFlowStateValveV2(
      initialMainWireFlowStateValveStateV2(0, 0),
      { dtSec: 0.005, upstreamPressureMmHg: 8.6, downstreamPressureMmHg: 8 },
      MV,
    );
    const justAbove = stepMainWireFlowStateValveV2(
      initialMainWireFlowStateValveStateV2(0, 0),
      { dtSec: 0.005, upstreamPressureMmHg: 8.600001, downstreamPressureMmHg: 8 },
      MV,
    );
    expect(below.openingTarget01).toBe(0);
    expect(justAbove.openingTarget01).toBeGreaterThanOrEqual(0);
    expect(justAbove.openingTarget01).toBeLessThan(1e-8);
  });
});
