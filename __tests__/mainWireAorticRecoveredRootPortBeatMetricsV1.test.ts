import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_BEAT_ACCUMULATOR_CHECKPOINT_V1_ID,
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_BEAT_METRICS_CLAIM_V1,
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_BEAT_METRICS_V1_ID,
  MainWireAorticRecoveredRootPortBeatAccumulatorV1,
  validateAndOwnMainWireAorticRecoveredRootPortCompletedBeatMetricsV1,
} from "@/engine/myocardium/MainWireAorticRecoveredRootPortBeatMetricsV1";
import {
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_VALVE_ORDER_V1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";

const AORTIC_VALVE_READBACK_INDEX_V1 =
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_VALVE_ORDER_V1.indexOf("AoV");
if (AORTIC_VALVE_READBACK_INDEX_V1 < 0) {
  throw new Error("test accepted numerical readback valve order is missing AoV");
}

describe("Main Wire recovered-root aortic-port beat metrics V1", () => {
  it("integrates Pprox over the whole beat and both gradients over the exact same positive-Q intervals", () => {
    const accumulator =
      new MainWireAorticRecoveredRootPortBeatAccumulatorV1();
    expect(accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(0, 10, 80, 20, 16),
      "capture/start",
    )).toBeNull();
    expect(accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(1, 10, 100, 30, 25),
      null,
    )).toBeNull();
    const completed = accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(3, -10, 120, 10, 5),
      "capture/end",
    );

    expect(completed).toEqual({
      metricsId: MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_BEAT_METRICS_V1_ID,
      startAtrialCaptureId: "capture/start",
      endAtrialCaptureId: "capture/end",
      startTimeSec: 0,
      endTimeSec: 3,
      durationSec: 3,
      proximalConstitutivePortPressure: {
        basis: "algebraic-proximal-constitutive-port-pressure",
        timeWeightedMeanMmHg: 310 / 3,
        maximumMmHg: 120,
        minimumMmHg: 80,
        pulseMmHg: 40,
      },
      localValveForwardPressureGradient: {
        basis:
          "left-ventricular-minus-proximal-constitutive-port-pressure-during-positive-aortic-valve-flow",
        forwardFlowDurationSec: 2,
        timeWeightedMeanMmHg: 25,
        peakMmHg: 30,
      },
      venaContractaBernoulliForwardPressureGradient: {
        basis:
          "vena-contracta-bernoulli-pressure-during-positive-aortic-valve-flow",
        forwardFlowDurationSec: 2,
        timeWeightedMeanMmHg: 20.25,
        peakMmHg: 25,
      },
    });
  });

  it("excludes a reverse-only endpoint from the peak when flow crosses from reverse to forward", () => {
    const accumulator =
      new MainWireAorticRecoveredRootPortBeatAccumulatorV1();
    accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(0, -10, 80, 1_000, 800),
      "capture/start",
    );
    const completed = accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(2, 10, 80, 20, 16),
      "capture/end",
    );

    expect(completed?.localValveForwardPressureGradient).toEqual({
      basis:
        "left-ventricular-minus-proximal-constitutive-port-pressure-during-positive-aortic-valve-flow",
      forwardFlowDurationSec: 1,
      timeWeightedMeanMmHg: 265,
      peakMmHg: 510,
    });
    expect(
      completed?.venaContractaBernoulliForwardPressureGradient,
    ).toEqual({
      basis:
        "vena-contracta-bernoulli-pressure-during-positive-aortic-valve-flow",
      forwardFlowDurationSec: 1,
      timeWeightedMeanMmHg: 212,
      peakMmHg: 408,
    });
  });

  it("uses a capture endpoint as both the old beat endpoint and the next beat start", () => {
    const accumulator =
      new MainWireAorticRecoveredRootPortBeatAccumulatorV1();
    accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(0, 0, 80, 0, 0),
      "capture/a",
    );
    const first = accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(1, 0, 100, 0, 0),
      "capture/b",
    );
    const second = accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(2, 0, 120, 0, 0),
      "capture/c",
    );

    expect(first?.proximalConstitutivePortPressure).toMatchObject({
      timeWeightedMeanMmHg: 90,
      maximumMmHg: 100,
      minimumMmHg: 80,
    });
    expect(second?.proximalConstitutivePortPressure).toMatchObject({
      timeWeightedMeanMmHg: 110,
      maximumMmHg: 120,
      minimumMmHg: 100,
    });
    expect(second).toMatchObject({
      startAtrialCaptureId: "capture/b",
      endAtrialCaptureId: "capture/c",
      startTimeSec: 1,
      endTimeSec: 2,
    });
  });

  it("reports a zero positive-Q duration and null gradient summaries when no forward flow occurs", () => {
    const accumulator =
      new MainWireAorticRecoveredRootPortBeatAccumulatorV1();
    accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(4, -10, 70, -20, -16),
      "capture/start",
    );
    const completed = accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(5, 0, 90, 0, 0),
      "capture/end",
    );

    expect(completed?.proximalConstitutivePortPressure).toEqual({
      basis: "algebraic-proximal-constitutive-port-pressure",
      timeWeightedMeanMmHg: 80,
      maximumMmHg: 90,
      minimumMmHg: 70,
      pulseMmHg: 20,
    });
    expect(completed?.localValveForwardPressureGradient).toMatchObject({
      forwardFlowDurationSec: 0,
      timeWeightedMeanMmHg: null,
      peakMmHg: null,
    });
    expect(
      completed?.venaContractaBernoulliForwardPressureGradient,
    ).toMatchObject({
      forwardFlowDurationSec: 0,
      timeWeightedMeanMmHg: null,
      peakMmHg: null,
    });
  });

  it("replays a mid-beat checkpoint with bit-for-bit/deep-exact output and retains no 76-f64 buffer", () => {
    const uninterrupted =
      new MainWireAorticRecoveredRootPortBeatAccumulatorV1();
    uninterrupted.acceptNumericalReadbackV3(
      selectedReadbackV1(0, 0, 75, 0, 0),
      "capture/start",
    );
    uninterrupted.acceptNumericalReadbackV3(
      selectedReadbackV1(0.2, 30, 90, 8, 6),
      null,
    );
    const checkpoint = uninterrupted.checkpoint();
    expect(checkpoint.checkpointId).toBe(
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_BEAT_ACCUMULATOR_CHECKPOINT_V1_ID,
    );
    expect(Object.keys(checkpoint.active?.previous ?? {})).toEqual([
      "timeSec",
      "aorticValveFlowMlPerSec",
      "algebraicProximalConstitutivePortPressureMmHg",
      "localValvePressureGradientMmHg",
      "venaContractaBernoulliPressureMmHg",
    ]);
    expect(
      Object.values(checkpoint.active ?? {}).some(
        (value) => value instanceof Float64Array,
      ),
    ).toBe(false);

    const restored = MainWireAorticRecoveredRootPortBeatAccumulatorV1.restore(
      structuredClone(checkpoint),
    );
    expect(restored.checkpoint()).toStrictEqual(checkpoint);
    for (const readback of [
      selectedReadbackV1(0.4, 20, 105, 10, 8),
      selectedReadbackV1(0.6, -10, 95, -2, -1),
    ]) {
      expect(uninterrupted.acceptNumericalReadbackV3(readback, null)).toBeNull();
      expect(restored.acceptNumericalReadbackV3(readback, null)).toBeNull();
    }
    const endReadback = selectedReadbackV1(0.8, 0, 80, 0, 0);
    const uninterruptedCompleted = uninterrupted.acceptNumericalReadbackV3(
      endReadback,
      "capture/end",
    );
    const restoredCompleted = restored.acceptNumericalReadbackV3(
      endReadback,
      "capture/end",
    );

    expect(restoredCompleted).toStrictEqual(uninterruptedCompleted);
    expect(numericLeavesV1(restoredCompleted)).toEqual(
      numericLeavesV1(uninterruptedCompleted),
    );
  });

  it("owns completed metrics strictly and publishes station/measurement limitations as a claim", () => {
    expect(MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_BEAT_METRICS_CLAIM_V1)
      .toMatchObject({
        acceptedHemodynamicStateAdded: false,
        analysisAccumulatorStateOnly: true,
        proximalPressureDefinition:
          "Ao-compliance-node-plus-Zc-times-signed-AoV-flow",
        proximalPressureIsAorticComplianceNode: false,
        catheterEquivalentPressureClaimed: false,
        forwardFlowDurationIsClinicalLeftVentricularEjectionTime: false,
        measuredDopplerEquivalenceClaimed: false,
      });
    const accumulator =
      new MainWireAorticRecoveredRootPortBeatAccumulatorV1();
    accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(0, 10, 80, 10, 8),
      "capture/start",
    );
    const metrics = accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(1, 10, 100, 20, 16),
      "capture/end",
    );
    expect(
      validateAndOwnMainWireAorticRecoveredRootPortCompletedBeatMetricsV1(
        structuredClone(metrics),
      ),
    ).toStrictEqual(metrics);

    const malformed = [
      mutatePlainObjectV1(metrics, (value) => {
        value.extra = true;
      }),
      mutatePlainObjectV1(metrics, (value) => {
        value.durationSec = 0;
      }),
      mutatePlainObjectV1(metrics, (value) => {
        value.durationSec = 1 + Number.EPSILON;
      }),
      mutatePlainObjectV1(metrics, (value) => {
        value.proximalConstitutivePortPressure.timeWeightedMeanMmHg =
          Number.POSITIVE_INFINITY;
      }),
      mutatePlainObjectV1(metrics, (value) => {
        value.proximalConstitutivePortPressure.pulseMmHg = 19;
      }),
      mutatePlainObjectV1(metrics, (value) => {
        value.proximalConstitutivePortPressure.maximumMmHg = Number.MAX_VALUE;
        value.proximalConstitutivePortPressure.minimumMmHg = -Number.MAX_VALUE;
        value.proximalConstitutivePortPressure.timeWeightedMeanMmHg = 0;
        value.proximalConstitutivePortPressure.pulseMmHg = 1;
      }),
      mutatePlainObjectV1(metrics, (value) => {
        value.localValveForwardPressureGradient.forwardFlowDurationSec = 0.5;
      }),
      mutatePlainObjectV1(metrics, (value) => {
        value.localValveForwardPressureGradient.forwardFlowDurationSec = 0;
      }),
    ];
    for (const value of malformed) {
      expect(() =>
        validateAndOwnMainWireAorticRecoveredRootPortCompletedBeatMetricsV1(
          value,
        )
      ).toThrow();
    }
  });

  it("fails closed on malformed readbacks, non-finite selected values, capture IDs, and clocks", () => {
    const accumulator =
      new MainWireAorticRecoveredRootPortBeatAccumulatorV1();
    expect(() => accumulator.acceptNumericalReadbackV3(
      new Float64Array(
        MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3 - 1,
      ),
      null,
    )).toThrow(/exactly 76 f64 values/);

    const layoutV1 = MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1;
    const layoutV2 = MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2;
    for (const index of [
      layoutV1.timeSec,
      layoutV1.valveFlowMlPerSec + AORTIC_VALVE_READBACK_INDEX_V1,
      layoutV2.algebraicProximalConstitutivePortPressureMmHg,
      layoutV2.localValvePressureGradientMmHg,
      layoutV2.venaContractaBernoulliPressureMmHg,
    ]) {
      const readback = selectedReadbackV1(0, 0, 80, 0, 0);
      readback[index] = Number.NaN;
      expect(() => accumulator.acceptNumericalReadbackV3(readback, null)).toThrow(
        /must be finite/,
      );
    }
    expect(() => accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(0, 0, 80, 0, 0),
      "",
    )).toThrow(/nonempty string/);

    accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(1, 0, 80, 0, 0),
      "capture/start",
    );
    expect(() => accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(1, 0, 80, 0, 0),
      null,
    )).toThrow(/clock did not advance/);
    expect(() => accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(0.9, 0, 80, 0, 0),
      null,
    )).toThrow(/clock did not advance/);
    expect(() => accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(1.1, 0, 80, 0, 0),
      "capture/start",
    )).toThrow(/capture ID did not advance/);
  });

  it("strictly rejects checkpoint shape, finite, nonnegative, clock, capture, and ledger tampering", () => {
    const accumulator =
      new MainWireAorticRecoveredRootPortBeatAccumulatorV1();
    accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(1, 10, 80, 10, 8),
      "capture/start",
    );
    accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(1.5, 10, 90, 20, 16),
      null,
    );
    const checkpoint = accumulator.checkpoint();
    expect(
      MainWireAorticRecoveredRootPortBeatAccumulatorV1.restore(checkpoint)
        .checkpoint(),
    ).toStrictEqual(checkpoint);

    const malformed = [
      mutateCheckpointV1(checkpoint, (value) => {
        value.extra = true;
      }),
      mutateCheckpointV1(checkpoint, (value) => {
        value.active.startAtrialCaptureId = "";
      }),
      mutateCheckpointV1(checkpoint, (value) => {
        value.active.startTimeSec = -1;
      }),
      mutateCheckpointV1(checkpoint, (value) => {
        value.active.previous.timeSec = Number.NaN;
      }),
      mutateCheckpointV1(checkpoint, (value) => {
        value.active.previous.timeSec = 0.5;
      }),
      mutateCheckpointV1(checkpoint, (value) => {
        value.active.forwardFlowDurationSec = -0.1;
      }),
      mutateCheckpointV1(checkpoint, (value) => {
        value.active.forwardFlowDurationSec = 0.6;
      }),
      mutateCheckpointV1(checkpoint, (value) => {
        value.active.maximumProximalPressureMmHg = 70;
      }),
      mutateCheckpointV1(checkpoint, (value) => {
        value.active.forwardFlowDurationSec = 0;
      }),
    ];
    for (const value of malformed) {
      expect(() =>
        MainWireAorticRecoveredRootPortBeatAccumulatorV1.restore(value)
      ).toThrow();
    }
  });

  it("rejects non-initial ledgers in a capture-initialized zero-elapsed checkpoint", () => {
    const accumulator =
      new MainWireAorticRecoveredRootPortBeatAccumulatorV1();
    accumulator.acceptNumericalReadbackV3(
      selectedReadbackV1(2, 10, 80, 10, 8),
      "capture/start",
    );
    const checkpoint = accumulator.checkpoint();
    const malformed = [
      mutateCheckpointV1(checkpoint, (value) => {
        value.active.proximalPressureIntegralMmHgSec = 1;
      }),
      mutateCheckpointV1(checkpoint, (value) => {
        value.active.maximumProximalPressureMmHg = 81;
      }),
      mutateCheckpointV1(checkpoint, (value) => {
        value.active.minimumProximalPressureMmHg = 79;
      }),
      mutateCheckpointV1(checkpoint, (value) => {
        value.active.forwardFlowDurationSec = 1e-15;
        value.active.localGradientIntegralMmHgSec = 1e-15;
        value.active.localGradientPeakMmHg = 1;
        value.active.venaContractaGradientIntegralMmHgSec = 1e-15;
        value.active.venaContractaGradientPeakMmHg = 1;
      }),
    ];
    for (const value of malformed) {
      expect(() =>
        MainWireAorticRecoveredRootPortBeatAccumulatorV1.restore(value)
      ).toThrow(/initial proximal pressure ledger is inconsistent/);
    }
  });
});

function selectedReadbackV1(
  timeSec: number,
  aorticValveFlowMlPerSec: number,
  proximalPressureMmHg: number,
  localGradientMmHg: number,
  venaContractaPressureMmHg: number,
): Float64Array {
  const readback = new Float64Array(
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
  );
  const layoutV1 = MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1;
  const layoutV2 = MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2;
  readback[layoutV1.timeSec] = timeSec;
  readback[
    layoutV1.valveFlowMlPerSec + AORTIC_VALVE_READBACK_INDEX_V1
  ] = aorticValveFlowMlPerSec;
  readback[layoutV2.algebraicProximalConstitutivePortPressureMmHg] =
    proximalPressureMmHg;
  readback[layoutV2.localValvePressureGradientMmHg] = localGradientMmHg;
  readback[layoutV2.venaContractaBernoulliPressureMmHg] =
    venaContractaPressureMmHg;
  return readback;
}

function numericLeavesV1(input: unknown): readonly string[] {
  const leaves: string[] = [];
  const visit = (value: unknown, path: string): void => {
    if (typeof value === "number") {
      const bits = new BigUint64Array(new Float64Array([value]).buffer)[0]!;
      leaves.push(`${path}:${bits.toString(16).padStart(16, "0")}`);
      return;
    }
    if (value !== null && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        visit(child, path.length === 0 ? key : `${path}.${key}`);
      }
    }
  };
  visit(input, "");
  return leaves;
}

function mutateCheckpointV1(
  checkpoint: unknown,
  mutate: (value: Record<string, any>) => void,
): unknown {
  const value = structuredClone(checkpoint) as Record<string, any>;
  mutate(value);
  return value;
}

function mutatePlainObjectV1(
  input: unknown,
  mutate: (value: Record<string, any>) => void,
): unknown {
  const value = structuredClone(input) as Record<string, any>;
  mutate(value);
  return value;
}
