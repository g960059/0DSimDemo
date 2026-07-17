import { describe, expect, it } from "vitest";

import {
  measureLaPvReservoirConduitOrderV1,
} from "@/engine/mechanics2/diagnostics/LaPvReservoirConduitOrderV1";

describe("LA PV reservoir/conduit equal-volume order V1", () => {
  it("reports a lower conduit branch without imposing an acceptance threshold", () => {
    const result = measureLaPvReservoirConduitOrderV1({
      reservoir: [
        { laVolumeMl: 40, laPressureMmHg: 6 },
        { laVolumeMl: 60, laPressureMmHg: 10 },
        { laVolumeMl: 80, laPressureMmHg: 14 },
      ],
      conduit: [
        { laVolumeMl: 80, laPressureMmHg: 11 },
        { laVolumeMl: 60, laPressureMmHg: 7 },
        { laVolumeMl: 40, laPressureMmHg: 3 },
      ],
      probeCount: 9,
    });

    expect(result.status).toBe("measurable");
    expect(result.overlapWidthMl).toBe(40);
    expect(result.usableProbeCount).toBe(9);
    expect(result.ambiguousProbeCount).toBe(0);
    expect(result.reservoirAboveConduitFraction01).toBe(1);
    expect(result.reservoirMinusConduitMeanMmHg).toBeCloseTo(3);
    expect(result.reservoirMinusConduitMedianMmHg).toBeCloseTo(3);
    expect(result.acceptanceThresholdApplied).toBe(false);
  });

  it("is invariant to branch traversal direction", () => {
    const reservoir = [
      { laVolumeMl: 40, laPressureMmHg: 5 },
      { laVolumeMl: 55, laPressureMmHg: 8 },
      { laVolumeMl: 80, laPressureMmHg: 13 },
    ] as const;
    const conduit = [
      { laVolumeMl: 80, laPressureMmHg: 10 },
      { laVolumeMl: 65, laPressureMmHg: 7 },
      { laVolumeMl: 40, laPressureMmHg: 2 },
    ] as const;
    const forward = measureLaPvReservoirConduitOrderV1({
      reservoir,
      conduit,
    });
    const reversed = measureLaPvReservoirConduitOrderV1({
      reservoir: [...reservoir].reverse(),
      conduit: [...conduit].reverse(),
    });

    expect(reversed.status).toBe("measurable");
    expect(reversed.reservoirMinusConduitMeanMmHg)
      .toBeCloseTo(forward.reservoirMinusConduitMeanMmHg!);
    expect(reversed.reservoirAboveConduitFraction01)
      .toBe(forward.reservoirAboveConduitFraction01);
  });

  it("reports multi-valued paths instead of silently selecting an envelope", () => {
    const result = measureLaPvReservoirConduitOrderV1({
      reservoir: [
        { laVolumeMl: 40, laPressureMmHg: 5 },
        { laVolumeMl: 70, laPressureMmHg: 12 },
        { laVolumeMl: 50, laPressureMmHg: 9 },
        { laVolumeMl: 80, laPressureMmHg: 14 },
      ],
      conduit: [
        { laVolumeMl: 80, laPressureMmHg: 10 },
        { laVolumeMl: 40, laPressureMmHg: 3 },
      ],
      probeCount: 21,
    });

    expect(result.status).toBe("measurable");
    expect(result.ambiguousProbeCount).toBeGreaterThan(0);
    expect(result.usableFraction01).toBeLessThan(1);
    expect(result.probes.some((probe) =>
      probe.reservoirIntersectionCount > 1 && !probe.usable)).toBe(true);
  });

  it("fails closed when the event-owned branches have no common volume", () => {
    const result = measureLaPvReservoirConduitOrderV1({
      reservoir: [
        { laVolumeMl: 20, laPressureMmHg: 4 },
        { laVolumeMl: 30, laPressureMmHg: 7 },
      ],
      conduit: [
        { laVolumeMl: 40, laPressureMmHg: 6 },
        { laVolumeMl: 50, laPressureMmHg: 3 },
      ],
    });

    expect(result).toMatchObject({
      status: "not-measurable",
      reason: "no-common-volume-support",
      acceptanceThresholdApplied: false,
    });
  });

  it("rejects invalid and insufficient paths explicitly", () => {
    expect(measureLaPvReservoirConduitOrderV1({
      reservoir: [{ laVolumeMl: 40, laPressureMmHg: 5 }],
      conduit: [
        { laVolumeMl: 40, laPressureMmHg: 4 },
        { laVolumeMl: 50, laPressureMmHg: 3 },
      ],
    }).reason).toBe("insufficient-points");

    expect(measureLaPvReservoirConduitOrderV1({
      reservoir: [
        { laVolumeMl: 40, laPressureMmHg: Number.NaN },
        { laVolumeMl: 50, laPressureMmHg: 6 },
      ],
      conduit: [
        { laVolumeMl: 40, laPressureMmHg: 4 },
        { laVolumeMl: 50, laPressureMmHg: 3 },
      ],
    }).reason).toBe("invalid-input");
  });
});
