import { describe, expect, it } from "vitest";

import {
  EQUILIBRIUM_ONE_FIBER_PASSIVE_CLAIM_V1,
  KLOTZ_NORMAL_CENTER_VENTRICULAR_PASSIVE_PRIOR_V1,
  assertCompiledEquilibriumOneFiberPassiveV1,
  compileEquilibriumOneFiberPassiveV1,
  compileKlotzNormalCenterVentricularPassiveV1,
  evaluateEquilibriumOneFiberPassiveV1,
  type EquilibriumOneFiberPassiveParamsV1,
} from "@/engine/myocardium/mechanics/equilibriumOneFiberPassiveV1";

const TEST_PARAMS: EquilibriumOneFiberPassiveParamsV1 = Object.freeze({
  parameterSetId: "test-equilibrium-one-fiber-passive-v1",
  centralTangentPa: 700,
  tensionScalePa: 700,
  tensionExponent: 14,
  compressionAdditionalTangentPa: 700,
  transitionWidthStrain: 0.001,
});

describe("equilibrium one-fiber passive constitutive kernel v1", () => {
  it("derives stress and tangent from the same stored-energy potential", () => {
    const compiled = compileEquilibriumOneFiberPassiveV1(TEST_PARAMS);
    const strainStep = 1e-7;
    for (const strain of [-0.2, -0.0015, -0.0005, 0, 0.0005, 0.0015, 0.12]) {
      const center = evaluateEquilibriumOneFiberPassiveV1(strain, compiled);
      const lower = evaluateEquilibriumOneFiberPassiveV1(
        strain - strainStep,
        compiled,
      );
      const upper = evaluateEquilibriumOneFiberPassiveV1(
        strain + strainStep,
        compiled,
      );
      const stressFromEnergy = (
        upper.storedEnergyDensityJPerM3 - lower.storedEnergyDensityJPerM3
      ) / (2 * strainStep);
      const tangentFromStress = (
        upper.equilibriumKirchhoffStressPa
          - lower.equilibriumKirchhoffStressPa
      ) / (2 * strainStep);
      expect(relativeError(
        center.equilibriumKirchhoffStressPa,
        stressFromEnergy,
      )).toBeLessThan(2e-7);
      expect(relativeError(
        center.dStressDFiberLogStrainPa,
        tangentFromStress,
      )).toBeLessThan(2e-6);
      expect(center.stressSource).toBe("stored-energy-first-derivative");
      expect(center.tangentSource).toBe("stored-energy-second-derivative");
    }
  });

  it("is C2 across compression, origin, and tension transition seams", () => {
    const compiled = compileEquilibriumOneFiberPassiveV1(TEST_PARAMS);
    const width = TEST_PARAMS.transitionWidthStrain;
    const epsilon = 1e-10;
    for (const seam of [-width, 0, width]) {
      const lower = evaluateEquilibriumOneFiberPassiveV1(
        seam - epsilon,
        compiled,
      );
      const upper = evaluateEquilibriumOneFiberPassiveV1(
        seam + epsilon,
        compiled,
      );
      expect(Math.abs(
        upper.storedEnergyDensityJPerM3 - lower.storedEnergyDensityJPerM3,
      )).toBeLessThan(1e-6);
      expect(Math.abs(
        upper.equilibriumKirchhoffStressPa
          - lower.equilibriumKirchhoffStressPa,
      )).toBeLessThan(1e-4);
      expect(Math.abs(
        upper.dStressDFiberLogStrainPa - lower.dStressDFiberLogStrainPa,
      )).toBeLessThan(0.01);
    }
    expect(EQUILIBRIUM_ONE_FIBER_PASSIVE_CLAIM_V1.continuity).toBe("C2");
  });

  it("retains a global positive tangent lower bound over compression and tension", () => {
    const compiled = compileEquilibriumOneFiberPassiveV1(TEST_PARAMS);
    let minimumTangent = Number.POSITIVE_INFINITY;
    for (let index = 0; index <= 2_000; index += 1) {
      const strain = -0.5 + index / 2_000;
      const output = evaluateEquilibriumOneFiberPassiveV1(strain, compiled);
      minimumTangent = Math.min(
        minimumTangent,
        output.dStressDFiberLogStrainPa,
      );
      expect(output.storedEnergyDensityJPerM3).toBeGreaterThanOrEqual(0);
    }
    expect(minimumTangent).toBeCloseTo(TEST_PARAMS.centralTangentPa, 11);
    expect(compiled.strictConvexityLowerBoundPa)
      .toBe(TEST_PARAMS.centralTangentPa);
    expect(compiled.claim.strictlyConvex).toBe(true);
  });

  it("represents signed compression stress without clipping or an extra branch", () => {
    const compiled = compileEquilibriumOneFiberPassiveV1(TEST_PARAMS);
    const compressed = evaluateEquilibriumOneFiberPassiveV1(-0.12, compiled);
    const reference = evaluateEquilibriumOneFiberPassiveV1(0, compiled);
    const stretched = evaluateEquilibriumOneFiberPassiveV1(0.12, compiled);
    expect(compressed.equilibriumKirchhoffStressPa).toBeLessThan(0);
    expect(reference.equilibriumKirchhoffStressPa).toBe(0);
    expect(stretched.equilibriumKirchhoffStressPa).toBeGreaterThan(0);
    expect(compressed.stressClipped).toBe(false);
    expect(compressed.claim.parallelSlsOwnedHere).toBe(false);
    expect(compressed.claim.activeStressOwnedHere).toBe(false);
  });

  it("compiles immutable identities and exposes only one fixed Klotz normal-center candidate", () => {
    const mutable = { ...TEST_PARAMS };
    const compiled = compileEquilibriumOneFiberPassiveV1(mutable);
    mutable.centralTangentPa = 999;
    expect(compiled.params.centralTangentPa).toBe(TEST_PARAMS.centralTangentPa);
    expect(compiled.parameterIdentityHash).toMatch(/^[0-9a-f]{8}$/);
    expect(() => assertCompiledEquilibriumOneFiberPassiveV1({
      ...compiled,
    })).toThrow(/compiled by this kernel/i);

    const fixed = KLOTZ_NORMAL_CENTER_VENTRICULAR_PASSIVE_PRIOR_V1;
    const fixedCompiled = compileKlotzNormalCenterVentricularPassiveV1();
    expect(fixed.parameterScanAllowed).toBe(false);
    expect(fixed.pvLoopMorphologyFitAllowed).toBe(false);
    expect(fixed.additionalPassiveBranchAllowed).toBe(false);
    expect(fixed.claimBoundary.organScaleEdpvrTargetIsNotDirectTissueLaw)
      .toBe(true);
    expect(fixed.claimBoundary.requiresWholeHeartReplayBeforeRuntimeUse)
      .toBe(true);
    expect(fixedCompiled.params).toEqual(fixed.params);
    expect(Object.isFrozen(fixed.params)).toBe(true);
    expect(evaluateEquilibriumOneFiberPassiveV1(0.095, fixedCompiled).finite)
      .toBe(true);
  });
});

function relativeError(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(1e-9, Math.abs(left), Math.abs(right));
}
