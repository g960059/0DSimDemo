import { describe, expect, it } from "vitest";
import {
  WORK_CONJUGATE_AV_PLANE_KPA_TO_MMHG_V1,
  defaultWorkConjugateAVPlaneChamberWallParamsV1,
  evaluateWorkConjugateAVPlaneChamberWallV1,
  type WorkConjugateAVPlaneChamberWallInputV1,
  type WorkConjugateAVPlaneChamberWallParamsV1,
  type WorkConjugateAVPlaneComponentBreakdownV1,
} from "@/engine/mechanics2/atrial/WorkConjugateAVPlaneChamberWallV1";

describe("WorkConjugateAVPlaneChamberWallV1", () => {
  it("keeps the raw virtual-work power identity for deterministic LA and LV cases", () => {
    const cases: readonly {
      readonly params: WorkConjugateAVPlaneChamberWallParamsV1;
      readonly input: WorkConjugateAVPlaneChamberWallInputV1;
    }[] = [
      {
        params: defaultWorkConjugateAVPlaneChamberWallParamsV1("LA"),
        input: {
          bloodVolumeMl: 52,
          bloodVolumeDotMlPerSec: -18,
          avPlanePositionCm: 0.38,
          avPlaneVelocityCmPerSec: 1.6,
          activation01: 0.72,
          pericardialPressureKPa: 0.15,
        },
      },
      {
        params: defaultWorkConjugateAVPlaneChamberWallParamsV1("LV"),
        input: {
          bloodVolumeMl: 136,
          bloodVolumeDotMlPerSec: 42,
          avPlanePositionCm: 0.42,
          avPlaneVelocityCmPerSec: -1.2,
          activation01: 0.55,
          pericardialPressureKPa: 0.22,
        },
      },
    ];

    for (const { input, params } of cases) {
      const output = evaluateWorkConjugateAVPlaneChamberWallV1(input, params);
      expect(output.valid).toBe(true);
      expect(output.finite).toBe(true);
      expect(Math.abs(output.power.rawPowerResidualW)).toBeLessThan(1e-15);
      expect(output.power.wallPowerW)
        .toBe(output.power.pressurePowerW - output.power.zForcePowerW);
      expect(output.power.stressPowerW)
        .toBe(output.power.passiveWallPowerW + output.power.activeWallPowerW + output.power.viscousWallPowerW);
    }
  });

  it("matches fixed-stress finite-difference virtual-work derivatives in V and z", () => {
    const cases: readonly {
      readonly params: WorkConjugateAVPlaneChamberWallParamsV1;
      readonly input: WorkConjugateAVPlaneChamberWallInputV1;
    }[] = [
      {
        params: defaultWorkConjugateAVPlaneChamberWallParamsV1("LA"),
        input: {
          bloodVolumeMl: 49,
          bloodVolumeDotMlPerSec: 5,
          avPlanePositionCm: 0.27,
          avPlaneVelocityCmPerSec: 0.8,
          activation01: 0.66,
          pericardialPressureKPa: 0.1,
        },
      },
      {
        params: defaultWorkConjugateAVPlaneChamberWallParamsV1("LV"),
        input: {
          bloodVolumeMl: 141,
          bloodVolumeDotMlPerSec: -8,
          avPlanePositionCm: -0.31,
          avPlaneVelocityCmPerSec: 0.5,
          activation01: 0.48,
          pericardialPressureKPa: 0.2,
        },
      },
    ];

    for (const { input, params } of cases) {
      const output = evaluateWorkConjugateAVPlaneChamberWallV1(input, params);
      const sigmaC = output.stressesKPa.circumferential.total;
      const sigmaL = output.stressesKPa.longitudinal.total;
      const dVMl = 1e-4;
      const dZCm = 1e-5;
      const dEdVJPerMl = (
        fixedStressVirtualWorkJ({ ...input, bloodVolumeMl: input.bloodVolumeMl + dVMl }, params, sigmaC, sigmaL) -
        fixedStressVirtualWorkJ({ ...input, bloodVolumeMl: input.bloodVolumeMl - dVMl }, params, sigmaC, sigmaL)
      ) / (2 * dVMl);
      const dEdZJPerCm = (
        fixedStressVirtualWorkJ(
          { ...input, avPlanePositionCm: input.avPlanePositionCm + dZCm },
          params,
          sigmaC,
          sigmaL,
        ) -
        fixedStressVirtualWorkJ(
          { ...input, avPlanePositionCm: input.avPlanePositionCm - dZCm },
          params,
          sigmaC,
          sigmaL,
        )
      ) / (2 * dZCm);

      expect(Math.abs(dEdVJPerMl - output.transmuralPressureKPa.total * 1e-3)).toBeLessThan(2e-12);
      expect(Math.abs(dEdZJPerCm - -output.zForceN.total * 0.01)).toBeLessThan(2e-11);
    }
  });

  it("keeps the circumferential pressure-area identity inside Fz for LA and LV", () => {
    const cases: readonly {
      readonly params: WorkConjugateAVPlaneChamberWallParamsV1;
      readonly input: WorkConjugateAVPlaneChamberWallInputV1;
    }[] = [
      {
        params: defaultWorkConjugateAVPlaneChamberWallParamsV1("LA"),
        input: {
          bloodVolumeMl: 57,
          bloodVolumeDotMlPerSec: -21,
          avPlanePositionCm: 0.34,
          avPlaneVelocityCmPerSec: 1.9,
          activation01: 0.79,
          pericardialPressureKPa: 0.14,
        },
      },
      {
        params: defaultWorkConjugateAVPlaneChamberWallParamsV1("LV"),
        input: {
          bloodVolumeMl: 148,
          bloodVolumeDotMlPerSec: 33,
          avPlanePositionCm: -0.28,
          avPlaneVelocityCmPerSec: -1.1,
          activation01: 0.61,
          pericardialPressureKPa: 0.19,
        },
      },
    ];

    for (const { input, params } of cases) {
      const output = evaluateWorkConjugateAVPlaneChamberWallV1(input, params);
      const decomposition = output.zForceAxisDecompositionN;
      expect(output.valid).toBe(true);
      expectBreakdownMachinePrecision(
        decomposition.circumferentialPressureAreaResidualN,
        Math.max(
          Math.abs(decomposition.circumferentialPressureAreaForceN.total),
          Math.abs(decomposition.circumferentialStressForceN.total),
        ),
      );
      expect(Math.abs(decomposition.rawTotalForceResidualN)).toBeLessThanOrEqual(
        machinePrecisionTolerance(output.zForceN.total),
      );
      expectBreakdownsCloseAtMachinePrecision(
        decomposition.reconstructedTotalForceN,
        output.zForceN,
      );
      const pressureAreaForceFromTotal = output.geometry.zSign * 0.1 *
        output.transmuralPressureKPa.total * output.geometry.midwallAreaCm2;
      expect(Math.abs(
        decomposition.circumferentialPressureAreaForceN.total - pressureAreaForceFromTotal,
      )).toBeLessThanOrEqual(machinePrecisionTolerance(pressureAreaForceFromTotal));
    }
  });

  it("uses opposite AV-plane signs for LA and LV strain rates", () => {
    const la = evaluateWorkConjugateAVPlaneChamberWallV1({
      bloodVolumeMl: 50,
      bloodVolumeDotMlPerSec: 0,
      avPlanePositionCm: 0.2,
      avPlaneVelocityCmPerSec: 1,
      activation01: 0,
      pericardialPressureKPa: 0,
    }, defaultWorkConjugateAVPlaneChamberWallParamsV1("LA"));
    const lv = evaluateWorkConjugateAVPlaneChamberWallV1({
      bloodVolumeMl: 130,
      bloodVolumeDotMlPerSec: 0,
      avPlanePositionCm: 0.2,
      avPlaneVelocityCmPerSec: 1,
      activation01: 0,
      pericardialPressureKPa: 0,
    }, defaultWorkConjugateAVPlaneChamberWallParamsV1("LV"));

    expect(la.strainRatesPerSec.circumferential).toBeLessThan(0);
    expect(la.strainRatesPerSec.longitudinal).toBeGreaterThan(0);
    expect(lv.strainRatesPerSec.circumferential).toBeGreaterThan(0);
    expect(lv.strainRatesPerSec.longitudinal).toBeLessThan(0);
  });

  it("keeps component sums exact and reports nonnegative viscous dissipation", () => {
    const output = evaluateWorkConjugateAVPlaneChamberWallV1({
      bloodVolumeMl: 55,
      bloodVolumeDotMlPerSec: -11,
      avPlanePositionCm: 0.45,
      avPlaneVelocityCmPerSec: 1.4,
      activation01: 0.83,
      pericardialPressureKPa: 0.16,
    }, defaultWorkConjugateAVPlaneChamberWallParamsV1("LA"));

    expectBreakdownSum(output.stressesKPa.circumferential);
    expectBreakdownSum(output.stressesKPa.longitudinal);
    expectBreakdownSum(output.transmuralPressureKPa);
    expectBreakdownSum(output.transmuralPressureMmHg);
    expectBreakdownSum(output.zForceN);
    expectBreakdownSum(output.zForceAxisDecompositionN.circumferentialPressureAreaForceN);
    expectBreakdownSum(output.zForceAxisDecompositionN.circumferentialStressForceN);
    expectBreakdownSum(output.zForceAxisDecompositionN.longitudinalStressForceN);
    expectBreakdownSum(output.zForceAxisDecompositionN.reconstructedTotalForceN);
    expectBreakdownSum(output.zForceAxisDecompositionN.circumferentialPressureAreaResidualN);
    expect(output.power.viscousDissipationW).toBeGreaterThanOrEqual(0);
    expect(output.power.viscousDissipationW).toBe(output.power.viscousWallPowerW);
  });

  it("reports mmHg pressure readbacks through the exported kPa conversion", () => {
    const output = evaluateWorkConjugateAVPlaneChamberWallV1({
      bloodVolumeMl: 53,
      bloodVolumeDotMlPerSec: 7,
      avPlanePositionCm: 0.18,
      avPlaneVelocityCmPerSec: -0.6,
      activation01: 0.37,
      pericardialPressureKPa: 0.13,
    }, defaultWorkConjugateAVPlaneChamberWallParamsV1("LA"));

    expectBreakdownScaled(
      output.transmuralPressureMmHg,
      output.transmuralPressureKPa,
      WORK_CONJUGATE_AV_PLANE_KPA_TO_MMHG_V1,
    );
    expect(output.cavityPressureMmHg).toBe(
      output.cavityPressureKPa * WORK_CONJUGATE_AV_PLANE_KPA_TO_MMHG_V1,
    );
  });

  it("uses chamber-specific engineering seeds with fixed anisotropy ratios", () => {
    const la = defaultWorkConjugateAVPlaneChamberWallParamsV1("LA");
    const lv = defaultWorkConjugateAVPlaneChamberWallParamsV1("LV");

    expect(lv.axes.circumferential.activeStressMaxKPa)
      .toBeGreaterThan(10 * la.axes.circumferential.activeStressMaxKPa);
    expect(lv.wallVolumeMl).toBeGreaterThan(la.wallVolumeMl);
    expect(lv.referenceLengthCm).toBeGreaterThan(la.referenceLengthCm);
    for (const params of [la, lv]) {
      expect(params.axes.longitudinal.passiveStressScaleKPa)
        .toBe(params.axes.circumferential.passiveStressScaleKPa * 0.85);
      expect(params.axes.longitudinal.activeStressMaxKPa)
        .toBe(params.axes.circumferential.activeStressMaxKPa * 0.75);
      expect(params.axes.longitudinal.viscosityKPaSec)
        .toBe(params.axes.circumferential.viscosityKPaSec * 1.4);
      expect(params.axes.longitudinal.activeStrainPeak)
        .toBe(params.axes.circumferential.activeStrainPeak);
      expect(params.axes.longitudinal.activeStrainWidth)
        .toBe(params.axes.circumferential.activeStrainWidth);
    }
    expect(lv.axes.circumferential.activeStrainPeak)
      .toBe(la.axes.circumferential.activeStrainPeak);
    expect(lv.axes.circumferential.activeStrainWidth)
      .toBe(la.axes.circumferential.activeStrainWidth);
  });

  it("returns zero wall pressure and force for zero stress and zero activation", () => {
    const params = zeroStressParams(defaultWorkConjugateAVPlaneChamberWallParamsV1("LA"));
    const output = evaluateWorkConjugateAVPlaneChamberWallV1({
      bloodVolumeMl: 50,
      bloodVolumeDotMlPerSec: 12,
      avPlanePositionCm: 0.25,
      avPlaneVelocityCmPerSec: 0.7,
      activation01: 0,
      pericardialPressureKPa: 0.12,
    }, params);

    expect(output.valid).toBe(true);
    expect(output.finite).toBe(true);
    expect(output.stressesKPa.circumferential.total).toBe(0);
    expect(output.stressesKPa.longitudinal.total).toBe(0);
    expect(output.transmuralPressureKPa.total).toBe(0);
    expect(output.transmuralPressureMmHg.total).toBe(0);
    expect(output.zForceN.total).toBe(0);
    expect(output.cavityPressureKPa).toBe(0.12);
    expect(output.cavityPressureMmHg).toBe(0.12 * WORK_CONJUGATE_AV_PLANE_KPA_TO_MMHG_V1);
    expect(output.power.wallPowerW).toBe(0);
    expect(output.power.rawPowerResidualW).toBe(0);
  });

  it("marks near-singular geometry invalid without clamping pressure or power", () => {
    const output = evaluateWorkConjugateAVPlaneChamberWallV1({
      bloodVolumeMl: 50,
      bloodVolumeDotMlPerSec: 0,
      avPlanePositionCm: -5.5 + 5e-10,
      avPlaneVelocityCmPerSec: 0,
      activation01: 0.5,
      pericardialPressureKPa: 0,
    }, defaultWorkConjugateAVPlaneChamberWallParamsV1("LA"));

    expect(output.valid).toBe(false);
    expect(output.finite).toBe(false);
    expect(output.invalidReason).toBe("lengthCm must be greater than 1e-9");
    expect(Number.isNaN(output.transmuralPressureKPa.total)).toBe(true);
    expect(Number.isNaN(output.transmuralPressureMmHg.total)).toBe(true);
    expect(Number.isNaN(output.zForceN.total)).toBe(true);
    expect(Number.isNaN(output.zForceAxisDecompositionN.rawTotalForceResidualN)).toBe(true);
    expect(Number.isNaN(output.power.rawPowerResidualW)).toBe(true);
  });
});

function fixedStressVirtualWorkJ(
  input: WorkConjugateAVPlaneChamberWallInputV1,
  params: WorkConjugateAVPlaneChamberWallParamsV1,
  circumferentialStressKPa: number,
  longitudinalStressKPa: number,
): number {
  const output = evaluateWorkConjugateAVPlaneChamberWallV1(input, params);
  expect(output.valid).toBe(true);
  return params.wallVolumeMl *
    (
      circumferentialStressKPa * output.strains.circumferential +
      longitudinalStressKPa * output.strains.longitudinal
    ) * 1e-3;
}

function expectBreakdownSum(breakdown: WorkConjugateAVPlaneComponentBreakdownV1): void {
  expect(breakdown.total).toBe(breakdown.passive + breakdown.active + breakdown.viscous);
}

function expectBreakdownScaled(
  actual: WorkConjugateAVPlaneComponentBreakdownV1,
  source: WorkConjugateAVPlaneComponentBreakdownV1,
  scale: number,
): void {
  expect(actual.passive).toBe(source.passive * scale);
  expect(actual.active).toBe(source.active * scale);
  expect(actual.viscous).toBe(source.viscous * scale);
  expect(actual.total).toBe(source.passive * scale + source.active * scale + source.viscous * scale);
}

function expectBreakdownMachinePrecision(
  breakdown: WorkConjugateAVPlaneComponentBreakdownV1,
  scale: number,
): void {
  const tolerance = machinePrecisionTolerance(scale);
  expect(Math.abs(breakdown.passive)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(breakdown.active)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(breakdown.viscous)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(breakdown.total)).toBeLessThanOrEqual(tolerance);
}

function expectBreakdownsCloseAtMachinePrecision(
  actual: WorkConjugateAVPlaneComponentBreakdownV1,
  expected: WorkConjugateAVPlaneComponentBreakdownV1,
): void {
  expect(Math.abs(actual.passive - expected.passive))
    .toBeLessThanOrEqual(machinePrecisionTolerance(expected.passive));
  expect(Math.abs(actual.active - expected.active))
    .toBeLessThanOrEqual(machinePrecisionTolerance(expected.active));
  expect(Math.abs(actual.viscous - expected.viscous))
    .toBeLessThanOrEqual(machinePrecisionTolerance(expected.viscous));
  expect(Math.abs(actual.total - expected.total))
    .toBeLessThanOrEqual(machinePrecisionTolerance(expected.total));
}

function machinePrecisionTolerance(scale: number): number {
  return 64 * Number.EPSILON * Math.max(1, Math.abs(scale));
}

function zeroStressParams(
  params: WorkConjugateAVPlaneChamberWallParamsV1,
): WorkConjugateAVPlaneChamberWallParamsV1 {
  const zeroAxis = {
    passiveStressScaleKPa: 0,
    passiveExponent: 1,
    passiveSlackStrain: 0,
    activeStressMaxKPa: 0,
    activeStrainPeak: 0,
    activeStrainWidth: 1,
    viscosityKPaSec: 0,
  };
  return {
    ...params,
    axes: {
      circumferential: zeroAxis,
      longitudinal: zeroAxis,
    },
  };
}
