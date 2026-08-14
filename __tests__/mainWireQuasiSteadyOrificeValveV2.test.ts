import { describe, expect, it } from "vitest";

import {
  evaluateMainWireQuasiSteadyOrificeValveV2,
  idealBernoulliLossFromEffectiveOrificeAreaV2,
  initialMainWireQuasiSteadyOrificeValveStateV2,
  type MainWireQuasiSteadyOrificeValveParamsV2,
  stepMainWireQuasiSteadyOrificeValveV2,
  stepMainWireQuasiSteadyOrificeValveScalarsV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

const BASE = Object.freeze({
  parameterSetId: "test-MV-direction-separated-orifice-v2",
  valveId: "MV",
  backgroundLinearResistanceMmHgSecPerMl: 0.0027,
  maximumForwardEoaCm2: 5.5,
  closedReverseEroaCm2: 0,
  openingGainPerMmHg: 2,
  openingPressureOffsetMmHg: 0,
  openingDriveDeadbandMmHg: 0.6,
  openingDriveSmoothingMmHg: 0.1,
  openingTimeConstantSec: 0.024,
  closingTimeConstantSec: 0.016,
} satisfies MainWireQuasiSteadyOrificeValveParamsV2);

const INPUT = Object.freeze({
  dtSec: 0.001,
  upstreamPressureMmHg: 13,
  downstreamPressureMmHg: 8,
});

describe("MainWireQuasiSteadyOrificeValveV2", () => {
  it("keeps the typed scalar step exactly equal to the public object step", () => {
    const previous = initialMainWireQuasiSteadyOrificeValveStateV2(0.4);
    expect(stepMainWireQuasiSteadyOrificeValveScalarsV2(
      previous.leafletOpeningFraction01,
      INPUT.dtSec,
      INPUT.upstreamPressureMmHg,
      INPUT.downstreamPressureMmHg,
      BASE,
    )).toEqual(stepMainWireQuasiSteadyOrificeValveV2(previous, INPUT, BASE));
  });

  it("never retains validation for mutable or accessor-backed parameters", () => {
    const previous = initialMainWireQuasiSteadyOrificeValveStateV2(0.4);
    const mutable = { ...BASE };
    expect(stepMainWireQuasiSteadyOrificeValveV2(previous, INPUT, mutable).valid)
      .toBe(true);
    mutable.openingTimeConstantSec = 0;
    expect(stepMainWireQuasiSteadyOrificeValveV2(previous, INPUT, mutable).valid)
      .toBe(false);

    let openingGainPerMmHg = BASE.openingGainPerMmHg;
    const accessor = { ...BASE } as Record<string, unknown>;
    Object.defineProperty(accessor, "openingGainPerMmHg", {
      enumerable: true,
      configurable: false,
      get: () => openingGainPerMmHg,
    });
    Object.freeze(accessor);
    expect(stepMainWireQuasiSteadyOrificeValveV2(
      previous,
      INPUT,
      accessor as MainWireQuasiSteadyOrificeValveParamsV2,
    ).valid).toBe(true);
    openingGainPerMmHg = Number.NaN;
    expect(stepMainWireQuasiSteadyOrificeValveV2(
      previous,
      INPUT,
      accessor as MainWireQuasiSteadyOrificeValveParamsV2,
    ).valid).toBe(false);
  });

  it("keeps only xi as memory and has no Cd, area floor, q smoothing, or inertance field", () => {
    const initial = initialMainWireQuasiSteadyOrificeValveStateV2(0.4);
    const output = stepMainWireQuasiSteadyOrificeValveV2(initial, INPUT, BASE);

    expect(Object.keys(initial)).toEqual(["leafletOpeningFraction01"]);
    expect(Object.keys(output.state)).toEqual(["leafletOpeningFraction01"]);
    for (const excludedField of [
      "Cd",
      "dischargeCoefficient",
      "numericalAreaFloorCm2",
      "quadraticFlowSmoothingMlPerSec",
      "flowSmoothingMlPerSec",
      "inertanceMmHgSec2PerMl",
    ]) {
      expect(BASE).not.toHaveProperty(excludedField);
    }
    expect(output.claim.flowMemory).toBe(false);
    expect(output.claim.numericalAreaFloorUsed).toBe(false);
    expect(output.claim.flowSmoothingUsed).toBe(false);
    expect(output.claim.inertanceModeled).toBe(false);
    expect(output.claim.linearResistanceSemantics).toBe(
      "legacy-topology-derived-series-loss-fixed-across-brackets-not-effective-area-scaled",
    );
    expect(output.claim.closedReverseEroaInterpretation).toBe(
      "clinical-reverse-phase-EROA-seeded-bidirectional-residual-hydraulic-gap",
    );
    expect(output.claim.forwardAndReverseFlowResponsesIndependent).toBe(false);
  });

  it("uses EOA directly and never adds a fitted discharge coefficient", () => {
    expect(idealBernoulliLossFromEffectiveOrificeAreaV2(1))
      .toBeCloseTo(3.9753263519819767e-4, 15);
    expect(idealBernoulliLossFromEffectiveOrificeAreaV2(2))
      .toBeCloseTo(idealBernoulliLossFromEffectiveOrificeAreaV2(1) / 4, 15);
    expect(() => idealBernoulliLossFromEffectiveOrificeAreaV2(0))
      .toThrow(/finite and positive/);
  });

  it("reduces exactly to the signed Bernoulli law when background R is zero", () => {
    const state = { leafletOpeningFraction01: 1 } as const;
    const params = {
      ...BASE,
      backgroundLinearResistanceMmHgSecPerMl: 0,
      maximumForwardEoaCm2: 2,
    };
    for (const gradientMmHg of [-9, 9]) {
      const withReverseArea = gradientMmHg < 0
        ? { ...params, closedReverseEroaCm2: 2 }
        : params;
      const output = evaluateMainWireQuasiSteadyOrificeValveV2(
        state,
        {
          dtSec: 0.001,
          upstreamPressureMmHg: 10 + gradientMmHg,
          downstreamPressureMmHg: 10,
        },
        state,
        withReverseArea,
      );
      const expected = Math.sign(gradientMmHg) * Math.sqrt(
        Math.abs(gradientMmHg)
          / idealBernoulliLossFromEffectiveOrificeAreaV2(2),
      );
      expect(output.flowMlPerSec).toBeCloseTo(expected, 13);
      expect(output.dissipativePressureMmHg).toBeCloseTo(gradientMmHg, 13);
    }
  });

  it("does not count the EOA dependence again in the background linear loss", () => {
    for (const [gradientMmHg, opening01, eroaCm2] of [
      [9, 0.1, 0.2],
      [9, 0.9, 0.2],
      [-90, 0.9, 0.2],
    ] as const) {
      const state = { leafletOpeningFraction01: opening01 } as const;
      const output = evaluateMainWireQuasiSteadyOrificeValveV2(
        state,
        {
          dtSec: 0.001,
          upstreamPressureMmHg: 10 + gradientMmHg,
          downstreamPressureMmHg: 10,
        },
        state,
        { ...BASE, closedReverseEroaCm2: eroaCm2 },
      );
      expect(output.resistanceMmHgSecPerMl)
        .toBe(BASE.backgroundLinearResistanceMmHgSecPerMl);
    }
  });

  it("satisfies backward Euler and the forward Areg + xi(Amax - Areg) area law", () => {
    const params = { ...BASE, closedReverseEroaCm2: 0.2 };
    const previous = initialMainWireQuasiSteadyOrificeValveStateV2(0.25);
    const output = stepMainWireQuasiSteadyOrificeValveV2(previous, INPUT, params);
    const xi = output.state.leafletOpeningFraction01;

    expect(output.valid).toBe(true);
    expect(Math.abs(output.openingEquationResidual01)).toBeLessThan(1e-12);
    expect(output.forwardActiveEoaCm2).toBeCloseTo(
      params.closedReverseEroaCm2 +
        xi * (params.maximumForwardEoaCm2 - params.closedReverseEroaCm2),
      15,
    );
    expect(output.reverseActiveEoaCm2).toBe(params.closedReverseEroaCm2);
    expect(output.activeEoaCm2).toBe(output.forwardActiveEoaCm2);
    expect(output.flowMlPerSec).toBeGreaterThan(0);
  });

  it("exposes the explicit bidirectional residual-gap assumption in partial forward opening", () => {
    const state = { leafletOpeningFraction01: 0.1 } as const;
    const competent = evaluateMainWireQuasiSteadyOrificeValveV2(
      state,
      INPUT,
      state,
      BASE,
    );
    const residualGap = evaluateMainWireQuasiSteadyOrificeValveV2(
      state,
      INPUT,
      state,
      { ...BASE, closedReverseEroaCm2: 0.2 },
    );
    expect(residualGap.forwardActiveEoaCm2)
      .toBeGreaterThan(competent.forwardActiveEoaCm2);
    expect(residualGap.flowMlPerSec).toBeGreaterThan(competent.flowMlPerSec);
    expect(residualGap.claim.forwardAndReverseFlowResponsesIndependent)
      .toBe(false);
  });

  it("makes reverse flow and EOA independent of partial leaflet opening", () => {
    const params = { ...BASE, closedReverseEroaCm2: 0.18 };
    const input = {
      dtSec: 0.001,
      upstreamPressureMmHg: 5,
      downstreamPressureMmHg: 17,
    } as const;
    const lowXi = evaluateMainWireQuasiSteadyOrificeValveV2(
      { leafletOpeningFraction01: 0.1 },
      input,
      { leafletOpeningFraction01: 0.1 },
      params,
    );
    const highXi = evaluateMainWireQuasiSteadyOrificeValveV2(
      { leafletOpeningFraction01: 0.9 },
      input,
      { leafletOpeningFraction01: 0.9 },
      params,
    );

    expect(lowXi.activeDirection).toBe("reverse");
    expect(lowXi.activeEoaCm2).toBe(params.closedReverseEroaCm2);
    expect(highXi.activeEoaCm2).toBe(params.closedReverseEroaCm2);
    expect(highXi.flowMlPerSec).toBe(lowXi.flowMlPerSec);
    expect(lowXi.flowMlPerSec).toBeLessThan(0);
  });

  it("retains forward opening dependence without creating a flow state", () => {
    const lowXi = evaluateMainWireQuasiSteadyOrificeValveV2(
      { leafletOpeningFraction01: 0.2 },
      INPUT,
      { leafletOpeningFraction01: 0.2 },
      BASE,
    );
    const highXi = evaluateMainWireQuasiSteadyOrificeValveV2(
      { leafletOpeningFraction01: 0.8 },
      INPUT,
      { leafletOpeningFraction01: 0.8 },
      BASE,
    );

    expect(highXi.forwardActiveEoaCm2).toBeGreaterThan(lowXi.forwardActiveEoaCm2);
    expect(highXi.flowMlPerSec).toBeGreaterThan(lowXi.flowMlPerSec);
    expect(Object.keys(highXi.state)).toEqual(["leafletOpeningFraction01"]);
  });

  it("has a monotone signed pressure-flow map in both directions", () => {
    const params = { ...BASE, closedReverseEroaCm2: 0.12 };
    const state = { leafletOpeningFraction01: 0.5 } as const;
    const flowAtGradient = (gradientMmHg: number) =>
      evaluateMainWireQuasiSteadyOrificeValveV2(
        state,
        {
          dtSec: 0.001,
          upstreamPressureMmHg: 10 + gradientMmHg,
          downstreamPressureMmHg: 10,
        },
        state,
        params,
      ).flowMlPerSec;

    const reverse = [-1, -4, -9].map(flowAtGradient);
    const forward = [1, 4, 9].map(flowAtGradient);
    expect(reverse[0]).toBeGreaterThan(reverse[1]);
    expect(reverse[1]).toBeGreaterThan(reverse[2]);
    expect(forward[0]).toBeLessThan(forward[1]);
    expect(forward[1]).toBeLessThan(forward[2]);
  });

  it("enforces exact competent reverse closure even at partial xi", () => {
    const state = { leafletOpeningFraction01: 0.73 } as const;
    const output = evaluateMainWireQuasiSteadyOrificeValveV2(
      state,
      {
        dtSec: 0.001,
        upstreamPressureMmHg: 5,
        downstreamPressureMmHg: 20,
      },
      state,
      BASE,
    );

    expect(output.reverseActiveEoaCm2).toBe(0);
    expect(output.activeEoaCm2).toBe(0);
    expect(output.flowMlPerSec).toBe(0);
    expect(output.competentReverseClosureActive).toBe(true);
    expect(output.competentReverseClosureReactionMmHg).toBe(15);
    expect(output.subthresholdForwardSupportReactionMmHg).toBe(0);
    expect(output.signedHydraulicSupportReactionMmHg).toBe(15);
    expect(output.hydraulicBalanceResidualMmHg).toBe(0);
    expect(output.leafletMechanicalContactModeled).toBe(false);
  });

  it("separates zero-area forward deadband support from reverse closure and mechanical contact", () => {
    const output = stepMainWireQuasiSteadyOrificeValveV2(
      initialMainWireQuasiSteadyOrificeValveStateV2(0),
      {
        dtSec: 0.001,
        upstreamPressureMmHg: 8.3,
        downstreamPressureMmHg: 8,
      },
      BASE,
    );

    expect(output.openingTarget01).toBe(0);
    expect(output.state.leafletOpeningFraction01).toBe(0);
    expect(output.activeEoaCm2).toBe(0);
    expect(output.flowMlPerSec).toBe(0);
    expect(output.subthresholdForwardSupportActive).toBe(true);
    expect(output.subthresholdForwardSupportReactionMmHg).toBeCloseTo(0.3, 14);
    expect(output.competentReverseClosureActive).toBe(false);
    expect(output.competentReverseClosureReactionMmHg).toBe(0);
    expect(output.signedHydraulicSupportReactionMmHg).toBeCloseTo(-0.3, 14);
    expect(output.hydraulicBalanceResidualMmHg).toBe(0);
    expect(output.leafletMechanicalContactModeled).toBe(false);
  });

  it("is passive and closes the hydraulic and power ledgers for forward and reverse flow", () => {
    const params = { ...BASE, closedReverseEroaCm2: 0.16 };
    const state = { leafletOpeningFraction01: 0.6 } as const;
    for (const [upstreamPressureMmHg, downstreamPressureMmHg] of [
      [17, 8],
      [5, 20],
    ] as const) {
      const output = evaluateMainWireQuasiSteadyOrificeValveV2(
        state,
        { dtSec: 0.001, upstreamPressureMmHg, downstreamPressureMmHg },
        state,
        params,
      );
      expect(output.valid).toBe(true);
      expect(output.dissipativePowerMmHgMlPerSec).toBeGreaterThanOrEqual(0);
      expect(Math.abs(output.hydraulicBalanceResidualMmHg)).toBeLessThan(1e-11);
      expect(Math.abs(output.powerBalanceResidualMmHgMlPerSec)).toBeLessThan(1e-8);
      expect(output.hydraulicSupportPowerMmHgMlPerSec).toBe(0);
    }
  });

  it("keeps the exact q|q| residual stable across a broad EOA and pressure envelope", () => {
    const cases = [
      { gradient: 1e-10, xi: 1e-3, eroa: 0 },
      { gradient: 120, xi: 1, eroa: 0 },
      { gradient: -0.01, xi: 0.99, eroa: 0.01 },
      { gradient: -120, xi: 0.01, eroa: 0.4 },
    ] as const;

    for (const { gradient, xi, eroa } of cases) {
      const state = { leafletOpeningFraction01: xi } as const;
      const output = evaluateMainWireQuasiSteadyOrificeValveV2(
        state,
        {
          dtSec: 0.001,
          upstreamPressureMmHg: 10 + gradient,
          downstreamPressureMmHg: 10,
        },
        state,
        { ...BASE, closedReverseEroaCm2: eroa },
      );
      expect(output.finite).toBe(true);
      expect(Math.abs(output.hydraulicBalanceResidualMmHg))
        .toBeLessThanOrEqual(2e-13 * Math.max(1, Math.abs(gradient)));
    }
  });

  it("rejects an EROA larger than maximum forward EOA", () => {
    const output = stepMainWireQuasiSteadyOrificeValveV2(
      initialMainWireQuasiSteadyOrificeValveStateV2(),
      INPUT,
      { ...BASE, closedReverseEroaCm2: BASE.maximumForwardEoaCm2 + 1 },
    );
    expect(output.valid).toBe(false);
    expect(output.issues).toContain(
      "closedReverseEroaCm2 must not exceed maximumForwardEoaCm2",
    );
  });

  it("has exact zero flow, reaction, and power at zero gradient", () => {
    const state = initialMainWireQuasiSteadyOrificeValveStateV2(0);
    const output = evaluateMainWireQuasiSteadyOrificeValveV2(
      state,
      { dtSec: 0.001, upstreamPressureMmHg: 8, downstreamPressureMmHg: 8 },
      state,
      BASE,
    );
    expect(output.flowMlPerSec).toBe(0);
    expect(output.competentReverseClosureReactionMmHg).toBe(0);
    expect(output.subthresholdForwardSupportReactionMmHg).toBe(0);
    expect(output.hydraulicBalanceResidualMmHg).toBe(0);
    expect(output.powerBalanceResidualMmHgMlPerSec).toBe(0);
  });
});
