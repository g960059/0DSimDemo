import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore } from "@/engine/ModelCore";
import type { SimSample } from "@/engine/protocol";

describe("ModelCore atrial pressure decomposition readbacks", () => {
  it("exposes finite LA/RA passive, active, and AV-plane pressure debug terms", () => {
    const core = new ModelCore(DEFAULT_PARAMS);
    core.step(0.001);
    const sample = core.sample();

    expectFinite(sample, "LAPressureUnclampedMmHg");
    expectFinite(sample, "LAPassivePressureMmHg");
    expectFinite(sample, "LAActivePressureMmHg");
    expectFinite(sample, "LAAvPlanePressureDeltaMmHg");
    expectFinite(sample, "LAPressureFloorHit01");
    expectFinite(sample, "RAPressureUnclampedMmHg");
    expectFinite(sample, "RAPassivePressureMmHg");
    expectFinite(sample, "RAActivePressureMmHg");
    expectFinite(sample, "RAAvPlanePressureDeltaMmHg");
    expectFinite(sample, "RAPressureFloorHit01");
    expect(
      Math.abs(
        value(sample, "LAPressureUnclampedMmHg")
        - value(sample, "LAPassivePressureMmHg")
        - value(sample, "LAActivePressureMmHg"),
      ),
    ).toBeLessThan(1e-9);
    expect(
      Math.abs(
        value(sample, "RAPressureUnclampedMmHg")
        - value(sample, "RAPassivePressureMmHg")
        - value(sample, "RAActivePressureMmHg"),
      ),
    ).toBeLessThan(1e-9);
  });

  it("exposes finite LA/RA AV-plane effective-wall geometry readbacks", () => {
    const core = new ModelCore(DEFAULT_PARAMS);
    core.step(0.001);
    const sample = core.sample();

    for (const key of [
      "LAAvPlaneDescent01",
      "LAAvPlaneDescentVelocity01PerSec",
      "LAAvPlaneEffectiveVolumeCorrectionMl",
      "LAAvPlaneEffectiveVolumeCorrectionVelocityMlPerSec",
      "LAWallVolumeMl",
      "LAWallVolumeWithoutAvPlaneMl",
      "LAWallLambda",
      "LAWallLambdaWithoutAvPlane",
      "LAWallLambdaAvPlaneDelta",
      "LAWallEngineeringStrain",
      "LAWallEngineeringStrainWithoutAvPlane",
      "LAWallEngineeringStrainAvPlaneDelta",
      "RAAvPlaneDescent01",
      "RAAvPlaneDescentVelocity01PerSec",
      "RAAvPlaneEffectiveVolumeCorrectionMl",
      "RAAvPlaneEffectiveVolumeCorrectionVelocityMlPerSec",
      "RAWallVolumeMl",
      "RAWallVolumeWithoutAvPlaneMl",
      "RAWallLambda",
      "RAWallLambdaWithoutAvPlane",
      "RAWallLambdaAvPlaneDelta",
      "RAWallEngineeringStrain",
      "RAWallEngineeringStrainWithoutAvPlane",
      "RAWallEngineeringStrainAvPlaneDelta",
    ] as const) {
      expectFinite(sample, key);
    }

    expect(value(sample, "LAWallVolumeWithoutAvPlaneMl")).toBeGreaterThanOrEqual(value(sample, "LAWallVolumeMl"));
    expect(value(sample, "RAWallVolumeWithoutAvPlaneMl")).toBeGreaterThanOrEqual(value(sample, "RAWallVolumeMl"));
    expect(value(sample, "LAAvPlaneEffectiveVolumeCorrectionMl")).toBeCloseTo(
      Math.max(0, sample.VLA - value(sample, "LAWallVolumeMl")),
      9,
    );
    expect(value(sample, "RAAvPlaneEffectiveVolumeCorrectionMl")).toBeCloseTo(
      Math.max(0, sample.VRA - value(sample, "RAWallVolumeMl")),
      9,
    );
    expect(value(sample, "LAWallLambdaAvPlaneDelta")).toBeCloseTo(
      value(sample, "LAWallLambdaWithoutAvPlane") - value(sample, "LAWallLambda"),
      12,
    );
    expect(value(sample, "RAWallLambdaAvPlaneDelta")).toBeCloseTo(
      value(sample, "RAWallLambdaWithoutAvPlane") - value(sample, "RAWallLambda"),
      12,
    );
  });
});

function expectFinite(sample: SimSample, key: keyof SimSample): void {
  expect(Number.isFinite(value(sample, key))).toBe(true);
}

function value(sample: SimSample, key: keyof SimSample): number {
  const raw = sample[key];
  return typeof raw === "number" ? raw : Number.NaN;
}
