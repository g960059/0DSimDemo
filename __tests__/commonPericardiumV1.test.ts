import { describe, expect, it } from "vitest";
import {
  COMMON_PERICARDIUM_TRANSITION_HALF_WIDTH_V1,
  computeIntrapericardialHeartVolumeMlV1,
  evaluateCommonPericardiumV1,
} from "@/engine/mechanics2/constraints/CommonPericardiumV1";

describe("CommonPericardiumV1", () => {
  const params = Object.freeze({
    referenceHeartVolumeMl: 600,
    exponentialPressureScaleMmHg: 500 / 133.322,
    exponentialStiffness: 8,
    biasPressureMmHg: 0,
  });

  it("derives pressure and tangent from one scalar energy", () => {
    const volumeMl = 630;
    const output = evaluateCommonPericardiumV1(params, volumeMl);
    const stepMl = 1e-4;
    const pressureFromEnergy =
      (evaluateCommonPericardiumV1(params, volumeMl + stepMl)
        .storedEnergyMmHgMl -
        evaluateCommonPericardiumV1(params, volumeMl - stepMl)
          .storedEnergyMmHgMl) /
      (2 * stepMl);
    const tangentFromPressure =
      (evaluateCommonPericardiumV1(params, volumeMl + stepMl)
        .pressureMmHg -
        evaluateCommonPericardiumV1(params, volumeMl - stepMl)
          .pressureMmHg) /
      (2 * stepMl);

    expect(pressureFromEnergy).toBeCloseTo(output.pressureMmHg, 8);
    expect(tangentFromPressure).toBeCloseTo(
      output.pressureDerivativeMmHgPerMl,
      8,
    );
    expect(output.pressureMmHg).toBeGreaterThan(0);
    expect(output.pressureDerivativeMmHgPerMl).toBeGreaterThan(0);
  });

  it("is C2 across the slack engagement interval", () => {
    const delta = COMMON_PERICARDIUM_TRANSITION_HALF_WIDTH_V1;
    const below = evaluateCommonPericardiumV1(
      params,
      params.referenceHeartVolumeMl * (1 - 1.01 * delta),
    );
    const above = evaluateCommonPericardiumV1(
      params,
      params.referenceHeartVolumeMl * (1 + 1.01 * delta),
    );
    expect(below.smoothingBranch).toBe("zero");
    expect(below.pressureMmHg).toBe(0);
    expect(above.smoothingBranch).toBe("linear");
    expect(above.pressureMmHg).toBeGreaterThan(0);
  });

  it("uses only four chamber and explicit wall material volumes", () => {
    expect(
      computeIntrapericardialHeartVolumeMlV1({
        chamberBloodVolumesMl: [65, 140, 65, 150],
        wallMaterialVolumesMl: [20, 16, 75, 40, 35],
      }),
    ).toBe(606);
  });
});
