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
});

function expectFinite(sample: SimSample, key: keyof SimSample): void {
  expect(Number.isFinite(value(sample, key))).toBe(true);
}

function value(sample: SimSample, key: keyof SimSample): number {
  const raw = sample[key];
  return typeof raw === "number" ? raw : Number.NaN;
}
