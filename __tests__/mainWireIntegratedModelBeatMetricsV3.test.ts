import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_BEAT_ACCUMULATOR_CHECKPOINT_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_BEAT_METRICS_V3_ID,
  MainWireIntegratedModelBeatAccumulatorV3,
  pressureVolumePathIntegralIncrementV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";

describe("Main Wire Integrated Model V3 accepted-step beat metrics", () => {
  it("integrates positive external work from a counter-clockwise transmural LV PV path", () => {
    const accumulator = new MainWireIntegratedModelBeatAccumulatorV3();
    expect(accumulator.acceptNumericalReadback(
      readbackV1(0, 100, 0),
      "capture/start",
    )).toBeNull();
    expect(accumulator.acceptNumericalReadback(
      readbackV1(0.1, 101, 0),
      null,
    )).toBeNull();
    expect(accumulator.acceptNumericalReadback(
      readbackV1(0.2, 101, 1),
      null,
    )).toBeNull();
    expect(accumulator.acceptNumericalReadback(
      readbackV1(0.3, 100, 1),
      null,
    )).toBeNull();
    const completed = accumulator.acceptNumericalReadback(
      readbackV1(0.4, 100, 0),
      "capture/end",
    );

    expect(completed).toMatchObject({
      metricsId: MAIN_WIRE_INTEGRATED_MODEL_BEAT_METRICS_V3_ID,
      startAtrialCaptureId: "capture/start",
      endAtrialCaptureId: "capture/end",
      leftVentricularTransmuralPressureVolumePathWorkMmHgMl: 1,
    });
  });

  it("does not manufacture a closing segment for a transient open PV path", () => {
    const accumulator = new MainWireIntegratedModelBeatAccumulatorV3();
    accumulator.acceptNumericalReadback(
      readbackV1(0, 100, 0),
      "capture/start",
    );
    accumulator.acceptNumericalReadback(
      readbackV1(0.1, 101, 0),
      null,
    );
    const completed = accumulator.acceptNumericalReadback(
      readbackV1(0.2, 101, 1),
      "capture/end",
    );

    expect(completed
      ?.leftVentricularTransmuralPressureVolumePathWorkMmHgMl).toBeCloseTo(
        0,
        12,
      );
  });

  it("continues the in-progress PV work ledger exactly across checkpoint restore", () => {
    const uninterrupted = new MainWireIntegratedModelBeatAccumulatorV3();
    uninterrupted.acceptNumericalReadback(
      readbackV1(0, 100, 0),
      "capture/start",
    );
    uninterrupted.acceptNumericalReadback(
      readbackV1(0.1, 101, 0),
      null,
    );
    const checkpoint = uninterrupted.checkpoint();
    expect(checkpoint.checkpointId).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_BEAT_ACCUMULATOR_CHECKPOINT_V3_ID,
    );
    const restored = MainWireIntegratedModelBeatAccumulatorV3.restore(
      checkpoint,
    );

    for (const [timeSec, volumeMl, pressureMmHg] of [
      [0.2, 101, 1],
      [0.3, 100, 1],
    ] as const) {
      const sample = readbackV1(timeSec, volumeMl, pressureMmHg);
      expect(uninterrupted.acceptNumericalReadback(sample, null)).toBeNull();
      expect(restored.acceptNumericalReadback(sample, null)).toBeNull();
    }
    const finalSample = readbackV1(0.4, 100, 0);
    const uninterruptedCompleted = uninterrupted.acceptNumericalReadback(
      finalSample,
      "capture/end",
    );
    const restoredCompleted = restored.acceptNumericalReadback(
      finalSample,
      "capture/end",
    );

    expect(restoredCompleted).toEqual(uninterruptedCompleted);
    expect(restoredCompleted
      ?.leftVentricularTransmuralPressureVolumePathWorkMmHgMl).toBe(1);
  });

  it("rejects non-finite pressure-volume path endpoints", () => {
    expect(() => pressureVolumePathIntegralIncrementV3(
      100,
      0,
      Number.NaN,
      1,
    )).toThrow(/nextVolumeMl is not finite/);
  });
});

function readbackV1(
  timeSec: number,
  leftVentricularVolumeMl: number,
  leftVentricularTransmuralPressureMmHg: number,
): Float64Array {
  const readback = new Float64Array(
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  );
  const layout = MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1;
  readback[layout.timeSec] = timeSec;
  for (let chamberIndex = 0; chamberIndex < 4; chamberIndex += 1) {
    readback[layout.chamberVolumeMl + chamberIndex] = 100;
  }
  readback[layout.chamberVolumeMl + 1] = leftVentricularVolumeMl;
  readback[layout.transmuralPressureMmHg + 1] =
    leftVentricularTransmuralPressureMmHg;
  return readback;
}
