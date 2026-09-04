import { describe, expect, it } from "vitest";
import {
  characterizePrescribedFlowMomentumV1,
  fixedPathInertanceMmHgSec2PerMlV1,
  type MainWirePrescribedFlowSampleV1,
} from "@/analysis/methods/mainWire/MainWirePrescribedFlowMomentumV1";

const path = { bloodDensityKgPerM3: 1060, equivalentLengthCm: 1.5,
  physicalPathAreaCm2: 4 };
const sample = (acceptedTimeSec: number, flowMlPerSec: number):
  MainWirePrescribedFlowSampleV1 => ({ acceptedTimeSec, flowMlPerSec });

describe("prescribed-flow fixed-path momentum diagnostic", () => {
  it("converts SI inertance to mmHg s²/mL without treating cm² as m²", () => {
    const value = fixedPathInertanceMmHgSec2PerMlV1(path);
    expect(value).toBeCloseTo(0.0002981494763986484, 15);
    const oneMlPerSecSquaredPressurePa = 1060 * 0.015 / 0.0004 * 1e-6;
    expect(value * 133.322387415).toBeCloseTo(oneMlPerSecSquaredPressurePa, 15);
    expect(fixedPathInertanceMmHgSec2PerMlV1({ ...path, equivalentLengthCm: 3 }))
      .toBeCloseTo(2 * value, 15);
    expect(fixedPathInertanceMmHgSec2PerMlV1({ ...path, physicalPathAreaCm2: 8 }))
      .toBeCloseTo(value / 2, 15);
    expect(fixedPathInertanceMmHgSec2PerMlV1({ ...path, bloodDensityKgPerM3: 530 }))
      .toBeCloseTo(value / 2, 15);
    expect(fixedPathInertanceMmHgSec2PerMlV1({ ...path, equivalentLengthCm: 0 })).toBe(0);
  });

  it("returns zero inertial pressure and numerical dissipation for constant Q", () => {
    const result = characterizePrescribedFlowMomentumV1([sample(0, 100), sample(0.1, 100)], 0.0003);
    expect(result.claim.interpretation)
      .toBe("prescribed-trajectory diagnostic, not corrected pressure/coupled simulation");
    expect(result.claim.closureLawModeled).toBe(false);
    expect(result.intervals[0]).toMatchObject({
      accelerationMlPerSec2: 0, inertialPressureContributionMmHg: 0,
      backwardEulerNumericalDissipationMmHgMl: 0,
      backwardEulerPressureWorkMmHgMl: 0,
      backwardEulerEnergyBalanceResidualMmHgMl: 0,
    });
    expect(result.intervals[0]!.kineticEnergyStartMmHgMl).toBeCloseTo(1.5, 14);
    expect(result.intervals[0]!.kineticEnergyEndMmHgMl).toBeCloseTo(1.5, 14);
  });

  it("uses each actual interval and preserves acceleration/deceleration signs", () => {
    const result = characterizePrescribedFlowMomentumV1(
      [sample(0, 100), sample(0.1, 200), sample(0.3, 50)], 0.0003,
    );
    expect(result.intervals).toHaveLength(2);
    expect(result.intervals[0]!.inertialPressureContributionMmHg).toBeCloseTo(0.3, 14);
    expect(result.intervals[1]!.inertialPressureContributionMmHg).toBeCloseTo(-0.225, 14);
    for (const row of result.intervals) {
      expect(row.backwardEulerNumericalDissipationMmHgMl).toBeGreaterThanOrEqual(0);
      expect(row.backwardEulerPressureWorkMmHgMl).toBeCloseTo(
        row.kineticEnergyEndMmHgMl - row.kineticEnergyStartMmHgMl
          + row.backwardEulerNumericalDissipationMmHgMl, 13,
      );
      expect(Math.abs(row.backwardEulerEnergyBalanceResidualMmHgMl)).toBeLessThan(1e-12);
    }
  });

  it("does not add a valve closure law or clamp supplied signed flow", () => {
    const result = characterizePrescribedFlowMomentumV1(
      [sample(0, 100), sample(0.1, 0), sample(0.2, -100)], 0.0003,
    );
    expect(result.intervals[0]!.backwardEulerPressureWorkMmHgMl).toBe(0);
    expect(result.intervals[0]!.backwardEulerNumericalDissipationMmHgMl)
      .toBeCloseTo(result.intervals[0]!.kineticEnergyStartMmHgMl, 14);
    expect(result.intervals[1]!.endFlowMlPerSec).toBe(-100);
    expect(result.intervals[1]!.inertialPressureContributionMmHg).toBeLessThan(0);
    expect(result.intervals[1]!.kineticEnergyEndMmHgMl).toBeCloseTo(1.5, 14);
  });

  it("has an exact zero-L diagnostic limit and leaves input samples unchanged", () => {
    const samples = Object.freeze([Object.freeze(sample(1, 150)), Object.freeze(sample(2, -80))]);
    const row = characterizePrescribedFlowMomentumV1(samples, 0).intervals[0]!;
    expect(row.inertialPressureContributionMmHg).toBe(0);
    expect(row.kineticEnergyStartMmHgMl).toBe(0);
    expect(row.kineticEnergyEndMmHgMl).toBe(0);
    expect(row.backwardEulerNumericalDissipationMmHgMl).toBe(0);
    expect(row.backwardEulerPressureWorkMmHgMl).toBe(0);
    expect(row.backwardEulerEnergyBalanceResidualMmHgMl).toBe(0);
    expect(samples).toEqual([sample(1, 150), sample(2, -80)]);
    expect(Object.isFrozen(row)).toBe(true);
  });

  it.each([NaN, Infinity, -Infinity])("rejects nonfinite geometry/trace/L: %s", (bad) => {
    for (const key of Object.keys(path)) {
      expect(() => fixedPathInertanceMmHgSec2PerMlV1({ ...path, [key]: bad })).toThrow();
    }
    expect(() => characterizePrescribedFlowMomentumV1([sample(0, 1), sample(bad, 2)], 0.1)).toThrow();
    expect(() => characterizePrescribedFlowMomentumV1([sample(0, bad), sample(1, 2)], 0.1)).toThrow();
    expect(() => characterizePrescribedFlowMomentumV1([sample(0, 1), sample(1, 2)], bad)).toThrow();
  });

  it("rejects nonphysical geometry, invalid intervals, and nonfinite derived values", () => {
    for (const change of [{ bloodDensityKgPerM3: 0 }, { bloodDensityKgPerM3: -1 },
      { equivalentLengthCm: -1 }, { physicalPathAreaCm2: 0 }, { physicalPathAreaCm2: -1 }]) {
      expect(() => fixedPathInertanceMmHgSec2PerMlV1({ ...path, ...change })).toThrow();
    }
    for (const samples of [[], [sample(0, 1)], [sample(1, 1), sample(1, 2)],
      [sample(2, 1), sample(1, 2)], [sample(-1e308, 0), sample(1e308, 0)],
      [sample(0, 1e308), sample(1, 2)]]) {
      expect(() => characterizePrescribedFlowMomentumV1(samples, 0.1)).toThrow();
    }
    expect(() => characterizePrescribedFlowMomentumV1([sample(0, 1), sample(1, 2)], -0.1)).toThrow();
    expect(() => fixedPathInertanceMmHgSec2PerMlV1({ ...path, bloodDensityKgPerM3: 1e308,
      equivalentLengthCm: 1e308 })).toThrow();
  });
});
