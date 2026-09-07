import { describe, expect, it } from "vitest";
import { createPopulationMomentWallKernelV1 } from "@/engine/myocardium/experiments/PopulationMomentWallResearchV1";
import { MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_WALL_MATERIAL_V1 as base } from "@/engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1";
import { LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1 as land } from "@/engine/myocardium/myofilament/land2017/parameterSets";

const material = { ...base, landEquationParameters: land, landSlackStretch: 1.06 };
const create = (passiveScale = 1.248, recovery = "source-phi-turnover-closure" as const) =>
  createPopulationMomentWallKernelV1({ wallId: "LVFW", material, passiveScale, recovery });

describe("population moment wall: stress-conjugacy, pure trials and owned codec", () => {
  it("matches the full Kirchhoff/log-strain derivative including passive and SLS", () => {
    const kernel = create();
    for (const ca of [.16, .3, .6]) for (const strain of [-.02, .04, .12]) {
      const cold = kernel.initializeColdAtFixedInput({ fiberLogStrain: strain, freeCalciumUM: ca });
      const previous = kernel.stateCodec.encode(cold.state);
      for (const dt of [.002, .001]) {
        const input = { previousAcceptedState: cold.state, candidateFiberLogStrain: strain - .001,
          candidateFreeCalciumUM: ca, stepDtSec: dt };
        const value = kernel.evaluateTrialFromAccepted(input);
        const eps = 1e-7;
        const f = (e: number) => kernel.evaluateTrialFromAccepted({ ...input, candidateFiberLogStrain: e });
        const numeric = (f(input.candidateFiberLogStrain + eps).fiberKirchhoffStressPa
          - f(input.candidateFiberLogStrain - eps).fiberKirchhoffStressPa) / (2 * eps);
        expect(Math.abs(numeric - value.algorithmicFiberTangentPa) / Math.max(1, Math.abs(numeric))).toBeLessThan(1e-5);
        const lean = kernel.evaluateNumericalTrialFromAccepted!(input);
        expect({ ...lean, readback: value.readback }).toEqual(value);
        expect(value.residualNorm).toBeLessThan(1e-10);
        expect(value.readback).toMatchObject({ activeThermodynamicEnergyClaimed: false });
        expect(kernel.stateCodec.encode(cold.state)).toEqual(previous);
      }
      const eps = 1e-7, f = (e: number) => kernel.initializeColdAtFixedInput({ fiberLogStrain: e, freeCalciumUM: ca }).fiberKirchhoffStressPa;
      const numeric = (f(strain + eps) - f(strain - eps)) / (2 * eps);
      expect(Math.abs(numeric - cold.algorithmicFiberTangentPa) / Math.max(1, Math.abs(numeric))).toBeLessThan(1e-5);
    }
  });
  it("round-trips its own state, rejects other laws/parameters and owns caller parameters", () => {
    const mutable = structuredClone(material);
    const kernel = createPopulationMomentWallKernelV1({ wallId: "LVFW", material: mutable,
      passiveScale: 1.248, recovery: "source-phi-turnover-closure" });
    const cold = kernel.initializeColdAtFixedInput({ fiberLogStrain: .08, freeCalciumUM: .3 });
    const checkpoint = kernel.stateCodec.encode(cold.state);
    expect(kernel.stateCodec.decode(checkpoint)).toEqual(cold.state);
    expect(kernel.stateCodec.decode(checkpoint)).not.toBe(cold.state);
    expect(() => create(1).stateCodec.decode(checkpoint)).toThrow(/identity mismatch/);
    const flux = createPopulationMomentWallKernelV1({ wallId: "LVFW", material, passiveScale: 1.248, recovery: "flux-only" });
    expect(() => flux.stateCodec.decode(checkpoint)).toThrow(/identity mismatch/);
    expect(() => kernel.stateCodec.decode({ ...(checkpoint as object), unknown: 1 })).toThrow(/record/);
    Object.assign(mutable.landEquationParameters.values, { Tref: 999999 });
    expect(kernel.initializeColdAtFixedInput({ fiberLogStrain: .08, freeCalciumUM: .3 })).toEqual(cold);
    expect(JSON.stringify(checkpoint)).not.toContain("landState");
    expect(JSON.stringify(checkpoint)).not.toContain("zeta");
  });
});
