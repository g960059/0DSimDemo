import { describe, expect, it } from "vitest";

import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";
import {
  assertCompiledMoyer2015AtrialEquibiaxialPassiveV1,
  compileMoyer2015AtrialEquibiaxialPassiveV1,
  evaluateMoyer2015AtrialEquibiaxialPassiveV1,
  MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V1_ID,
  MOYER_2015_NORMAL_HUMAN_LA_EQUIBIAXIAL_PASSIVE_PRIOR_V1,
  type CompiledMoyer2015AtrialEquibiaxialPassiveV1,
} from "@/engine/myocardium/mechanics/moyer2015AtrialEquibiaxialPassiveV1";

describe("Moyer 2015 exact atrial equibiaxial passive V1", () => {
  it("compiles one immutable exact literature identity without a scan or fit", () => {
    const compiled = compileMoyer2015AtrialEquibiaxialPassiveV1();
    const prior = compiled.prior;
    expect(prior).toMatchObject({
      isotropicC1Pa: 1_650,
      isotropicC2Pa: 0,
      fiberC3Pa: 15,
      fiberC4: 13.37,
      supportedFiberLogStrainRange: [-0.5, 0.5],
      source: {
        doi: "10.1007/s10439-015-1256-0",
        pmcid: "PMC4497915",
      },
    });
    expect(compiled.zeroStrainRightTangentPa).toBeCloseTo(39_800.55, 10);
    expect(compiled.strictConvexityLowerBoundPa)
      .toBeCloseTo(12 * 1_650 * Math.cbrt(4), 10);
    expect(compiled.strictConvexityLowerBoundPa).toBeGreaterThan(0);
    expect(Object.isFrozen(compiled)).toBe(true);
    expect(Object.isFrozen(prior)).toBe(true);
    expect(Object.isFrozen(prior.source)).toBe(true);
    expect(Object.isFrozen(prior.supportedFiberLogStrainRange)).toBe(true);

    const cloned = compileMoyer2015AtrialEquibiaxialPassiveV1({
      ...MOYER_2015_NORMAL_HUMAN_LA_EQUIBIAXIAL_PASSIVE_PRIOR_V1,
      supportedFiberLogStrainRange: [-0.5, 0.5],
      source: {
        ...MOYER_2015_NORMAL_HUMAN_LA_EQUIBIAXIAL_PASSIVE_PRIOR_V1.source,
      },
      units: {
        ...MOYER_2015_NORMAL_HUMAN_LA_EQUIBIAXIAL_PASSIVE_PRIOR_V1.units,
      },
    });
    expect(cloned).not.toBe(compiled);
    expect(cloned.parameterIdentityHash).toBe(compiled.parameterIdentityHash);
    expect(compiled.parameterIdentityHash).toBe(stableHash(sanitizeForStableHash({
      modelId: MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V1_ID,
      prior: compiled.prior,
    })));
    expect(compiled.parameterIdentityHash).toBe("662c21e6");
    expect(() => compileMoyer2015AtrialEquibiaxialPassiveV1({
      ...MOYER_2015_NORMAL_HUMAN_LA_EQUIBIAXIAL_PASSIVE_PRIOR_V1,
      isotropicC1Pa: 1_651,
    })).toThrow(/only the exact published construction values/i);
    expect(() => assertCompiledMoyer2015AtrialEquibiaxialPassiveV1({
      ...compiled,
    } as CompiledMoyer2015AtrialEquibiaxialPassiveV1)).toThrow(/compiled by this kernel/i);
  });

  it("derives stress and tangent from the same potential", () => {
    const compiled = compileMoyer2015AtrialEquibiaxialPassiveV1();
    const h = 2e-6;
    for (const strain of [-0.45, -0.2, -0.03, 0.01, 0.12, 0.3, 0.45]) {
      const lower = evaluateMoyer2015AtrialEquibiaxialPassiveV1(
        strain - h,
        compiled,
      );
      const center = evaluateMoyer2015AtrialEquibiaxialPassiveV1(
        strain,
        compiled,
      );
      const upper = evaluateMoyer2015AtrialEquibiaxialPassiveV1(
        strain + h,
        compiled,
      );
      const stressFromEnergy = (
        upper.storedEnergyDensityJPerM3 - lower.storedEnergyDensityJPerM3
      ) / (2 * h);
      const tangentFromStress = (
        upper.equilibriumKirchhoffStressPa
          - lower.equilibriumKirchhoffStressPa
      ) / (2 * h);
      expect(relativeError(
        center.equilibriumKirchhoffStressPa,
        stressFromEnergy,
      )).toBeLessThan(2e-7);
      expect(relativeError(
        center.dStressDFiberLogStrainPa,
        tangentFromStress,
      )).toBeLessThan(2e-8);
      expect(center.dStressDFiberLogStrainPa)
        .toBeGreaterThanOrEqual(compiled.strictConvexityLowerBoundPa - 1e-8);
      expect(center.stressClipped).toBe(false);
      expect(center.claim.energyStressTangentFromSamePotential).toBe(true);
      expect(center.claim.stressMeasure).toMatch(/generalized.*not-a-single-fiber/i);
    }
  });

  it("has a zero reference, remains strictly convex at support edges, and never extrapolates", () => {
    const compiled = compileMoyer2015AtrialEquibiaxialPassiveV1();
    const zero = evaluateMoyer2015AtrialEquibiaxialPassiveV1(0, compiled);
    expect(zero.storedEnergyDensityJPerM3).toBe(0);
    expect(zero.equilibriumKirchhoffStressPa).toBe(0);
    expect(zero.dStressDFiberLogStrainPa).toBeCloseTo(39_800.55, 10);
    expect(zero.region).toBe("recruitment-origin");

    for (const strain of [-0.5, -0.25, -1e-4, 1e-4, 0.25, 0.5]) {
      const output = evaluateMoyer2015AtrialEquibiaxialPassiveV1(
        strain,
        compiled,
      );
      expect(output.finite).toBe(true);
      expect(output.storedEnergyDensityJPerM3).toBeGreaterThanOrEqual(0);
      expect(output.dStressDFiberLogStrainPa)
        .toBeGreaterThanOrEqual(compiled.strictConvexityLowerBoundPa - 1e-8);
    }
    expect(() => evaluateMoyer2015AtrialEquibiaxialPassiveV1(
      -0.5000001,
      compiled,
    )).toThrow(/outside Moyer support/i);
    expect(() => evaluateMoyer2015AtrialEquibiaxialPassiveV1(
      0.5000001,
      compiled,
    )).toThrow(/outside Moyer support/i);
  });
});

function relativeError(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(1, Math.abs(left), Math.abs(right));
}
