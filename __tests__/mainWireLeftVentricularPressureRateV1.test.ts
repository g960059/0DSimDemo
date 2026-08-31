import { describe, expect, it } from "vitest";

import {
  evaluateMainWireLeftVentricularPressureRateV1,
  MAIN_WIRE_LEFT_VENTRICULAR_PRESSURE_RATE_METHOD_V1_ID,
  mainWireLeftVentricularPressureRateConfigurationIdentityV1,
  type MainWireLeftVentricularAbsolutePressureSampleV1,
} from "@/analysis/methods/mainWire/MainWireLeftVentricularPressureRateV1";

describe("Main Wire LV absolute pressure-rate method V1", () => {
  it("uses actual irregular sample times and piecewise-linear interpolation", () => {
    const samples = samplesFromLawV1(
      [1, 1.003, 1.009, 1.014, 1.023, 1.031],
      (actualTimeSec) => 12 + 200 * (actualTimeSec - 1),
    );
    const result = evaluateMainWireLeftVentricularPressureRateV1({
      samples,
      windowSec: 0.01,
    });

    expect(result).toMatchObject({
      methodId: MAIN_WIRE_LEFT_VENTRICULAR_PRESSURE_RATE_METHOD_V1_ID,
      windowSec: 0.01,
      pressureBasis: "absolute-left-ventricular",
      timeBasis: "actual",
      interpolation: "piecewise-linear",
      estimator: "centered-secant-over-full-window",
      availability: "positive-only",
      negativeExtremum: {
        status: "unavailable",
        reason: "no-strictly-negative-central-secant",
      },
    });
    expect(result.evaluableCenterActualTimeRangeSec[0]).toBeCloseTo(1.005, 14);
    expect(result.evaluableCenterActualTimeRangeSec[1]).toBeCloseTo(1.026, 14);
    expect(result.candidateCount).toBeGreaterThan(2);
    expect(result.positiveExtremum.status).toBe("available");
    if (result.positiveExtremum.status !== "available") return;
    expect(
      result.positiveExtremum.extremum.pressureRateMmHgPerSec,
    ).toBeCloseTo(200, 10);
    const { earlierEndpoint, laterEndpoint } =
      result.positiveExtremum.extremum;
    expect(
      (laterEndpoint.absoluteLeftVentricularPressureMmHg -
        earlierEndpoint.absoluteLeftVentricularPressureMmHg) /
        (laterEndpoint.actualTimeSec - earlierEndpoint.actualTimeSec),
    ).toBeCloseTo(200, 10);
  });

  it("recovers the central-secant extrema of a sampled quadratic", () => {
    const samples = samplesFromLawV1(
      [0, 0.005, 0.01, 0.015, 0.02, 0.025, 0.03, 0.035, 0.04],
      (actualTimeSec) => 80 + 10_000 * (actualTimeSec - 0.02) ** 2,
    );
    const result = evaluateMainWireLeftVentricularPressureRateV1({
      samples,
      windowSec: 0.01,
    });

    expect(result.availability).toBe("both-signs");
    expect(result.positiveExtremum.status).toBe("available");
    expect(result.negativeExtremum.status).toBe("available");
    if (
      result.positiveExtremum.status !== "available" ||
      result.negativeExtremum.status !== "available"
    ) {
      return;
    }
    expect(result.positiveExtremum.extremum.centerActualTimeSec).toBeCloseTo(
      0.035,
      14,
    );
    expect(
      result.positiveExtremum.extremum.pressureRateMmHgPerSec,
    ).toBeCloseTo(300, 10);
    expect(result.negativeExtremum.extremum.centerActualTimeSec).toBeCloseTo(
      0.005,
      14,
    );
    expect(
      result.negativeExtremum.extremum.pressureRateMmHgPerSec,
    ).toBeCloseTo(-300, 10);
  });

  it("enumerates shifted knots and retains a one-sample pressure spike", () => {
    const samples = samplesFromLawV1(
      [0, 0.004, 0.011, 0.019, 0.03],
      (actualTimeSec) => (actualTimeSec === 0.011 ? 92 : 80),
    );
    const result = evaluateMainWireLeftVentricularPressureRateV1({
      samples,
      windowSec: 0.01,
    });

    expect(result.availability).toBe("both-signs");
    expect(result.positiveExtremum.status).toBe("available");
    expect(result.negativeExtremum.status).toBe("available");
    if (
      result.positiveExtremum.status !== "available" ||
      result.negativeExtremum.status !== "available"
    ) {
      return;
    }
    const positiveExtremum = result.positiveExtremum.extremum;
    const negativeExtremum = result.negativeExtremum.extremum;
    expect(
      positiveExtremum.centerActualTimeSec,
    ).toBeCloseTo(0.006, 14);
    expect(positiveExtremum).toMatchObject({
      pressureRateMmHgPerSec: 1_200,
      laterEndpoint: {
        actualTimeSec: 0.011,
        absoluteLeftVentricularPressureMmHg: 92,
      },
    });
    expect(
      negativeExtremum.centerActualTimeSec,
    ).toBeCloseTo(0.016, 14);
    expect(negativeExtremum).toMatchObject({
      pressureRateMmHgPerSec: -1_200,
      earlierEndpoint: {
        actualTimeSec: 0.011,
        absoluteLeftVentricularPressureMmHg: 92,
      },
    });
    expect(
      samples.some(
        ({ actualTimeSec }) =>
          actualTimeSec ===
          positiveExtremum.centerActualTimeSec,
      ),
    ).toBe(false);
    expect(
      samples.some(
        ({ actualTimeSec }) =>
          actualTimeSec ===
          negativeExtremum.centerActualTimeSec,
      ),
    ).toBe(false);
  });

  it("reports sign branches independently without manufacturing zero extrema", () => {
    const increasing = evaluateMainWireLeftVentricularPressureRateV1({
      samples: samplesFromLawV1([0, 0.01, 0.02], (time) => 50 + 100 * time),
      windowSec: 0.01,
    });
    const decreasing = evaluateMainWireLeftVentricularPressureRateV1({
      samples: samplesFromLawV1([0, 0.01, 0.02], (time) => 50 - 100 * time),
      windowSec: 0.01,
    });
    const constant = evaluateMainWireLeftVentricularPressureRateV1({
      samples: samplesFromLawV1([0, 0.01, 0.02], () => 50),
      windowSec: 0.01,
    });

    expect(increasing.availability).toBe("positive-only");
    expect(increasing.positiveExtremum.status).toBe("available");
    expect(increasing.negativeExtremum).toEqual({
      status: "unavailable",
      reason: "no-strictly-negative-central-secant",
    });
    expect(decreasing.availability).toBe("negative-only");
    expect(decreasing.positiveExtremum).toEqual({
      status: "unavailable",
      reason: "no-strictly-positive-central-secant",
    });
    expect(decreasing.negativeExtremum.status).toBe("available");
    expect(constant).toMatchObject({
      availability: "neither-sign",
      positiveExtremum: {
        status: "unavailable",
        reason: "no-strictly-positive-central-secant",
      },
      negativeExtremum: {
        status: "unavailable",
        reason: "no-strictly-negative-central-secant",
      },
    });
  });

  it("gives 5, 10, and 20 ms sensitivity runs distinct configuration identities", () => {
    const identities = [0.005, 0.01, 0.02].map(
      mainWireLeftVentricularPressureRateConfigurationIdentityV1,
    );

    expect(new Set(identities).size).toBe(3);
    expect(identities).toEqual([
      `${MAIN_WIRE_LEFT_VENTRICULAR_PRESSURE_RATE_METHOD_V1_ID};windowSec=0.005`,
      `${MAIN_WIRE_LEFT_VENTRICULAR_PRESSURE_RATE_METHOD_V1_ID};windowSec=0.01`,
      `${MAIN_WIRE_LEFT_VENTRICULAR_PRESSURE_RATE_METHOD_V1_ID};windowSec=0.02`,
    ]);
  });

  it("fails closed for invalid inputs", () => {
    const valid = samplesFromLawV1([0, 0.01, 0.02], (time) => 80 + time);
    expect(() => evaluateMainWireLeftVentricularPressureRateV1({
      samples: valid,
      windowSec: 0,
    })).toThrow(/windowSec must be positive and finite/);
    expect(() => evaluateMainWireLeftVentricularPressureRateV1({
      samples: valid,
      windowSec: Number.NaN,
    })).toThrow(/windowSec must be positive and finite/);
    expect(() => evaluateMainWireLeftVentricularPressureRateV1({
      samples: [valid[0]!],
      windowSec: 0.01,
    })).toThrow(/at least two samples/);
    expect(() => evaluateMainWireLeftVentricularPressureRateV1({
      samples: [valid[0]!, valid[1]!, { ...valid[1]! }],
      windowSec: 0.01,
    })).toThrow(/strictly increasing/);
    expect(() => evaluateMainWireLeftVentricularPressureRateV1({
      samples: [
        valid[0]!,
        {
          actualTimeSec: 0.01,
          absoluteLeftVentricularPressureMmHg: Number.POSITIVE_INFINITY,
        },
      ],
      windowSec: 0.01,
    })).toThrow(/must be finite/);
    expect(() => evaluateMainWireLeftVentricularPressureRateV1({
      samples: valid.slice(0, 2),
      windowSec: 0.02,
    })).toThrow(/span at least one complete windowSec/);
  });
});

function samplesFromLawV1(
  actualTimesSec: readonly number[],
  pressureMmHg: (actualTimeSec: number) => number,
): readonly MainWireLeftVentricularAbsolutePressureSampleV1[] {
  return Object.freeze(actualTimesSec.map((actualTimeSec) => Object.freeze({
    actualTimeSec,
    absoluteLeftVentricularPressureMmHg: pressureMmHg(actualTimeSec),
  })));
}
