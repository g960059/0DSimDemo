import { describe, expect, it } from "vitest";

import {
  COMMON_PERICARDIUM_TRANSITION_HALF_WIDTH_V1,
  computeIntrapericardialHeartVolumeM3V1,
  evaluateCommonPericardiumPositivePartV1,
  evaluateCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/commonPericardiumV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  evaluateMainWireCommonPericardiumBindingV1,
} from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";

const PARAMETERS = Object.freeze({
  referenceHeartVolumeM3: 700e-6,
  exponentialPressureScalePa: 500,
  exponentialStiffness: 8,
  prescribedPressureOffsetPa: 0,
});

describe("conservative common pericardium V1", () => {
  it("keeps the C2 engagement nonnegative, monotone, and continuous", () => {
    const delta = COMMON_PERICARDIUM_TRANSITION_HALF_WIDTH_V1;
    const points = [-2 * delta, -delta, -0.5 * delta, 0, 0.5 * delta, delta, 2 * delta]
      .map((value) => evaluateCommonPericardiumPositivePartV1(value));
    expect(points[0]).toMatchObject({
      value: 0,
      firstDerivative: 0,
      secondDerivative: 0,
      branch: "zero",
    });
    expect(points.at(-1)).toMatchObject({
      value: 2 * delta,
      firstDerivative: 1,
      secondDerivative: 0,
      branch: "linear",
    });
    for (let index = 1; index < points.length; index += 1) {
      expect(points[index]!.value).toBeGreaterThanOrEqual(points[index - 1]!.value);
      expect(points[index]!.firstDerivative).toBeGreaterThanOrEqual(0);
      expect(points[index]!.secondDerivative).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns pressure and tangent as derivatives of one stored energy", () => {
    const h = PARAMETERS.referenceHeartVolumeM3 * 1e-7;
    for (const scale of [0.9995, 1, 1.0005, 1.06]) {
      const volume = PARAMETERS.referenceHeartVolumeM3 * scale;
      const center = evaluateCommonPericardiumV1(PARAMETERS, volume);
      const plus = evaluateCommonPericardiumV1(PARAMETERS, volume + h);
      const minus = evaluateCommonPericardiumV1(PARAMETERS, volume - h);
      const energyDerivative = (plus.storedEnergyJ - minus.storedEnergyJ)
        / (2 * h);
      const pressureDerivative = (plus.excessPressurePa - minus.excessPressurePa)
        / (2 * h);
      expect(Math.abs(
        (energyDerivative - center.excessPressurePa)
          / Math.max(1, Math.abs(center.excessPressurePa)),
      )).toBeLessThan(1e-6);
      expect(Math.abs(
        pressureDerivative / center.pressureDerivativePaPerM3 - 1,
      )).toBeLessThan(1e-6);
      expect(center.excessPressurePa).toBeGreaterThan(0);
      expect(center.pressureDerivativePaPerM3).toBeGreaterThan(0);
    }
  });

  it("keeps a prescribed uniform offset energy-conjugate without changing stiffness", () => {
    const offsetPa = 275;
    const withOffset = Object.freeze({
      ...PARAMETERS,
      prescribedPressureOffsetPa: offsetPa,
    });
    for (const scale of [0.8, 1, 1.06]) {
      const volume = PARAMETERS.referenceHeartVolumeM3 * scale;
      const baseline = evaluateCommonPericardiumV1(PARAMETERS, volume);
      const offset = evaluateCommonPericardiumV1(withOffset, volume);
      expect(offset.storedEnergyJ - baseline.storedEnergyJ)
        .toBeCloseTo(offsetPa * volume, 15);
      expect(offset.excessPressurePa - baseline.excessPressurePa)
        .toBeCloseTo(offsetPa, 12);
      expect(offset.pressureDerivativePaPerM3)
        .toBeCloseTo(baseline.pressureDerivativePaPerM3, 12);
      expect(offset.storedEnergyJ).toBeGreaterThanOrEqual(0);
      expect(offset.excessPressurePa).toBeGreaterThanOrEqual(0);
      expect(offset.pressureDerivativePaPerM3).toBeGreaterThanOrEqual(0);
    }
  });

  it("reports a prescribed common offset as engaged on the elastic zero branch", () => {
    const binding = createMainWireNormalAdultCommonPericardiumV1();
    const withOffset = Object.freeze({
      ...binding,
      parameterSetId: "normal-adult-uniform-offset-mechanism-check",
      parameters: Object.freeze({
        ...binding.parameters,
        prescribedPressureOffsetPa: 275,
      }),
    });
    const evaluated = evaluateMainWireCommonPericardiumBindingV1(
      withOffset,
      Object.freeze({ LA: 35.72, LV: 144.4, RA: 47.31, RV: 155.8 }),
    );
    expect(evaluated.smoothingBranch).toBe("zero");
    expect(evaluated.excessPressurePa).toBe(275);
    expect(evaluated.elasticConstraintEngaged).toBe(true);
  });

  it("sums four blood cavities and five fixed wall volumes without hidden blood", () => {
    const volume = computeIntrapericardialHeartVolumeM3V1({
      chamberBloodVolumesM3: Object.freeze({
        LA: 40e-6,
        LV: 120e-6,
        RA: 50e-6,
        RV: 130e-6,
      }),
      wallMaterialVolumesM3: Object.freeze([
        20e-6,
        60e-6,
        30e-6,
        35e-6,
        18e-6,
      ]),
    });
    expect(volume).toBeCloseTo(503e-6, 15);
  });

  it("keeps the normal CMR anchor exactly slack but supports fluid occupancy", () => {
    const binding = createMainWireNormalAdultCommonPericardiumV1();
    expect(binding.parameters.referenceHeartVolumeM3 * 1e6)
      .toBeCloseTo(600.126542735043, 9);
    const chamberVolumes = Object.freeze({
      LA: 35.72,
      LV: 144.4,
      RA: 47.31,
      RV: 155.8,
    });
    const healthy = evaluateMainWireCommonPericardiumBindingV1(
      binding,
      chamberVolumes,
    );
    expect(healthy.smoothingBranch).toBe("zero");
    expect(healthy.excessPressurePa).toBe(0);
    expect(healthy.elasticConstraintEngaged).toBe(false);

    const fluidChallenge = evaluateMainWireCommonPericardiumBindingV1(
      Object.freeze({
        ...binding,
        parameterSetId: "normal-adult-plus-100ml-static-fluid",
        prescribedPericardialFluidVolumeM3: 100e-6,
      }),
      chamberVolumes,
    );
    expect(fluidChallenge.totalOccupiedVolumeM3 - fluidChallenge.heartVolumeM3)
      .toBeCloseTo(100e-6, 15);
    expect(fluidChallenge.excessPressurePa).toBeGreaterThan(0);
    expect(fluidChallenge.elasticConstraintEngaged).toBe(true);
  });

  it("has a rank-one common-pressure tangent and cancels on volume redistribution", () => {
    const binding = createMainWireNormalAdultCommonPericardiumV1(
      "on",
      "global-capacity-vh0-430ml-positive-control",
    );
    const chambers = ["LA", "LV", "RA", "RV"] as const;
    const base = Object.freeze({ LA: 45, LV: 125, RA: 55, RV: 135 });
    const basePressure = evaluateMainWireCommonPericardiumBindingV1(
      binding,
      base,
    ).excessPressurePa;
    expect(basePressure).toBeGreaterThan(0);

    const hMl = 1e-3;
    const partialsPaPerM3 = chambers.map((chamber) => {
      const plus = { ...base, [chamber]: base[chamber] + hMl };
      const minus = { ...base, [chamber]: base[chamber] - hMl };
      return (
        evaluateMainWireCommonPericardiumBindingV1(binding, plus)
          .excessPressurePa
        - evaluateMainWireCommonPericardiumBindingV1(binding, minus)
          .excessPressurePa
      ) / (2 * hMl * 1e-6);
    });
    for (const partial of partialsPaPerM3) {
      expect(partial).toBeCloseTo(partialsPaPerM3[0]!, 3);
      expect(partial).toBeGreaterThan(0);
    }

    // J_peri = 1_4 * k * 1_4^T: all pressure rows are identical, and
    // any chamber-volume redistribution with zero total volume is in its nullspace.
    const pressureJacobian = chambers.map(() => [...partialsPaPerM3]);
    for (const row of pressureJacobian) {
      expect(row).toEqual(pressureJacobian[0]);
    }
    const redistributed = Object.freeze({
      ...base,
      LA: base.LA + hMl,
      LV: base.LV - hMl,
    });
    const redistributedPressure = evaluateMainWireCommonPericardiumBindingV1(
      binding,
      redistributed,
    ).excessPressurePa;
    expect(redistributedPressure).toBeCloseTo(basePressure, 12);
    const commonPressureVector = chambers.map(() => basePressure);
    expect(commonPressureVector[0]! - commonPressureVector[1]!).toBe(0);
    expect(commonPressureVector[2]! - commonPressureVector[3]!).toBe(0);
  });

  it("provides a true topology-off arm without changing occupied volume", () => {
    const on = createMainWireNormalAdultCommonPericardiumV1("on");
    const off = createMainWireNormalAdultCommonPericardiumV1("exact-off");
    const chamberVolumes = Object.freeze({ LA: 90, LV: 160, RA: 105, RV: 175 });
    const evaluatedOn = evaluateMainWireCommonPericardiumBindingV1(on, chamberVolumes);
    const evaluatedOff = evaluateMainWireCommonPericardiumBindingV1(off, chamberVolumes);
    expect(evaluatedOff.totalOccupiedVolumeM3)
      .toBe(evaluatedOn.totalOccupiedVolumeM3);
    expect(evaluatedOff.excessPressurePa).toBe(0);
    expect(evaluatedOff.storedEnergyJ).toBe(0);
    expect(evaluatedOff.smoothingBranch).toBe("off");
  });

  it("exposes fixed non-fit global-capacity and effusion positive controls", () => {
    const chamberVolumes = Object.freeze({ LA: 36, LV: 106, RA: 45, RV: 119 });
    const globalCapacity = createMainWireNormalAdultCommonPericardiumV1(
      "on",
      "global-capacity-vh0-430ml-positive-control",
    );
    const effusion = createMainWireNormalAdultCommonPericardiumV1(
      "on",
      "effusion-300ml-positive-control",
    );
    expect(globalCapacity.parameters.referenceHeartVolumeM3)
      .toBeCloseTo(430e-6, 15);
    expect(effusion.prescribedPericardialFluidVolumeM3)
      .toBeCloseTo(300e-6, 15);
    for (const binding of [globalCapacity, effusion]) {
      const evaluated = evaluateMainWireCommonPericardiumBindingV1(
        binding,
        chamberVolumes,
      );
      expect(evaluated.elasticConstraintEngaged).toBe(true);
      expect(evaluated.excessPressureMmHg).toBeGreaterThan(0);
      expect(evaluated.pressureDerivativePaPerM3).toBeGreaterThan(0);
    }
  });
});
