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
  referenceOccupiedVolumeM3: 700e-6,
  exponentialPressureScalePa: 500,
  exponentialStiffness: 8,
});

describe("conservative common pericardium V1", () => {
  it("uses a nonnegative monotone C2 engagement", () => {
    const delta = COMMON_PERICARDIUM_TRANSITION_HALF_WIDTH_V1;
    const points = [
      -2 * delta,
      -delta,
      -0.5 * delta,
      0,
      0.5 * delta,
      delta,
      2 * delta,
    ].map((value) => evaluateCommonPericardiumPositivePartV1(value));
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
      expect(points[index]!.value)
        .toBeGreaterThanOrEqual(points[index - 1]!.value);
      expect(points[index]!.firstDerivative).toBeGreaterThanOrEqual(0);
      expect(points[index]!.secondDerivative).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns P=dPsi/dV and K=dP/dV >= 0", () => {
    const h = PARAMETERS.referenceOccupiedVolumeM3 * 1e-7;
    for (const scale of [0.9995, 1, 1.0005, 1.06]) {
      const volume = PARAMETERS.referenceOccupiedVolumeM3 * scale;
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

  it("has a rank-one common-pressure tangent and a redistribution nullspace", () => {
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
    const partials = chambers.map((chamber) => (
      evaluateMainWireCommonPericardiumBindingV1(
        binding,
        { ...base, [chamber]: base[chamber] + hMl },
      ).excessPressurePa
      - evaluateMainWireCommonPericardiumBindingV1(
        binding,
        { ...base, [chamber]: base[chamber] - hMl },
      ).excessPressurePa
    ) / (2 * hMl * 1e-6));
    for (const partial of partials) {
      expect(partial).toBeCloseTo(partials[0]!, 3);
      expect(partial).toBeGreaterThan(0);
    }
    const redistributedPressure = evaluateMainWireCommonPericardiumBindingV1(
      binding,
      { ...base, LA: base.LA + hMl, LV: base.LV - hMl },
    ).excessPressurePa;
    expect(redistributedPressure).toBeCloseTo(basePressure, 12);
  });

  it("keeps static pericardial fluid outside blood and dynamic state", () => {
    const heartVolume = computeIntrapericardialHeartVolumeM3V1({
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
    expect(heartVolume).toBeCloseTo(503e-6, 15);
    const effusion = createMainWireNormalAdultCommonPericardiumV1(
      "on",
      "effusion-300ml-positive-control",
    );
    const evaluated = evaluateMainWireCommonPericardiumBindingV1(
      effusion,
      Object.freeze({ LA: 36, LV: 106, RA: 45, RV: 119 }),
    );
    expect(evaluated.totalOccupiedVolumeM3 - evaluated.heartVolumeM3)
      .toBeCloseTo(300e-6, 15);
    expect(evaluated.prescribedPericardialFluidVolumeM3).toBeCloseTo(300e-6, 15);
    expect(Object.keys(effusion).sort()).toEqual([
      "bindingId",
      "mode",
      "parameterSetId",
      "parameters",
      "prescribedPericardialFluidVolumeM3",
      "wallMaterialVolumesM3",
    ]);
  });

  it("keeps healthy-slack exactly zero and fixed controls engaged", () => {
    const chamberVolumes = Object.freeze({
      LA: 35.72,
      LV: 144.4,
      RA: 47.31,
      RV: 155.8,
    });
    const healthyBinding = createMainWireNormalAdultCommonPericardiumV1();
    expect(healthyBinding.parameters.referenceOccupiedVolumeM3 * 1e6)
      .toBeCloseTo(600.126542735043, 9);
    const healthy = evaluateMainWireCommonPericardiumBindingV1(
      healthyBinding,
      chamberVolumes,
    );
    expect(healthy).toMatchObject({
      smoothingBranch: "zero",
      storedEnergyJ: 0,
      excessPressurePa: 0,
      pressureDerivativePaPerM3: 0,
      elasticConstraintEngaged: false,
    });
    const off = evaluateMainWireCommonPericardiumBindingV1(
      createMainWireNormalAdultCommonPericardiumV1("exact-off"),
      chamberVolumes,
    );
    expect(off.totalOccupiedVolumeM3).toBe(healthy.totalOccupiedVolumeM3);
    expect(off).toMatchObject({
      smoothingBranch: "off",
      storedEnergyJ: 0,
      excessPressurePa: 0,
      pressureDerivativePaPerM3: 0,
      elasticConstraintEngaged: false,
    });
    for (const caseId of [
      "effusion-300ml-positive-control",
      "global-capacity-vh0-430ml-positive-control",
    ] as const) {
      const evaluated = evaluateMainWireCommonPericardiumBindingV1(
        createMainWireNormalAdultCommonPericardiumV1("on", caseId),
        chamberVolumes,
      );
      expect(evaluated.elasticConstraintEngaged).toBe(true);
      expect(evaluated.excessPressureMmHg).toBeGreaterThan(0);
      expect(evaluated.pressureDerivativePaPerM3).toBeGreaterThan(0);
    }
  });

  it("rejects modes and cases outside the fixed registry", () => {
    expect(() => createMainWireNormalAdultCommonPericardiumV1(
      "bad" as never,
    )).toThrow("unsupported normal-adult common-pericardium mode");
    expect(() => createMainWireNormalAdultCommonPericardiumV1(
      "on",
      "shape-fit" as never,
    )).toThrow("unsupported normal-adult common-pericardium case");
    const binding = createMainWireNormalAdultCommonPericardiumV1();
    expect(() => evaluateMainWireCommonPericardiumBindingV1(
      { ...binding, mode: "bad" as never },
      { LA: 35, LV: 120, RA: 45, RV: 130 },
    )).toThrow("unsupported common-pericardium binding mode");
  });
});
