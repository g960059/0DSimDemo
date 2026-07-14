import { describe, expect, it } from "vitest";

import {
  evaluateOneFiberVolumeGeometryV1,
  oneFiberCavityPressurePaV1,
  oneFiberMidwallTensionNPerMV1,
} from "@/engine/mechanics2/geometry/OneFiberVolumeGeometryV1";

const params = {
  wallVolumeMl: 25,
  referenceCavityVolumeMl: 50,
  midwallFraction01: 0.5,
} as const;

describe("OneFiberVolumeGeometryV1", () => {
  it("uses the reference cavity as zero natural strain", () => {
    const geometry = evaluateOneFiberVolumeGeometryV1(50, params);
    expect(geometry.fiberNaturalStrain).toBeCloseTo(0, 14);
    expect(geometry.midwallAreaCm2).toBeCloseTo(geometry.referenceMidwallAreaCm2, 14);
  });

  it("maps fiber stress to pressure by virtual work", () => {
    const volumeMl = 80;
    const stressPa = 18_000;
    const geometry = evaluateOneFiberVolumeGeometryV1(volumeMl, params);
    const pressurePa = oneFiberCavityPressurePaV1(geometry, stressPa);
    const dvMl = 1e-4;
    const plus = evaluateOneFiberVolumeGeometryV1(volumeMl + dvMl, params);
    const minus = evaluateOneFiberVolumeGeometryV1(volumeMl - dvMl, params);
    const dStrainDVolumePerMl = (
      plus.fiberNaturalStrain - minus.fiberNaturalStrain
    ) / (2 * dvMl);
    expect(pressurePa).toBeCloseTo(
      params.wallVolumeMl * stressPa * dStrainDVolumePerMl,
      7,
    );
  });

  it("reports the area-conjugate midwall tension", () => {
    const geometry = evaluateOneFiberVolumeGeometryV1(80, params);
    const stressPa = 18_000;
    const tension = oneFiberMidwallTensionNPerMV1(geometry, stressPa);
    const expected = params.wallVolumeMl * 1e-6 * stressPa
      / (2 * geometry.midwallAreaCm2 * 1e-4);
    expect(tension).toBeCloseTo(expected, 12);
  });
});
