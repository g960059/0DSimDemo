import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_V1_ID,
} from "@/engine/valves/MainWireAorticRecoveredRootPortValveV1";
import {
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_VALVE_ORDER_V1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  MainWireIntegratedModelBeatAccumulatorV3,
  type MainWireIntegratedModelCompletedBeatMetricsV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  MAIN_WIRE_SELECTED_AORTIC_PORT_EXACT_BEAT_STATE_CHECKPOINT_V1_ID,
  MAIN_WIRE_SELECTED_AORTIC_PORT_SESSION_EXTENSION_CLAIM_V1,
  MainWireSelectedAorticPortSessionExtensionV1,
  type MainWireSelectedAorticPortSessionTicketV1,
} from "@/engine/vnext/MainWireSelectedAorticPortSessionExtensionV1";

const AORTIC_VALVE_READBACK_INDEX_V1 =
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_VALVE_ORDER_V1.indexOf("AoV");
if (AORTIC_VALVE_READBACK_INDEX_V1 < 0) {
  throw new Error("test accepted numerical readback valve order is missing AoV");
}

describe("Main Wire selected aortic-port Session extension V1", () => {
  it("keeps cold/aborted candidates unavailable and makes ticket close finally-safe and idempotent", () => {
    const extension =
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
    expect(MAIN_WIRE_SELECTED_AORTIC_PORT_SESSION_EXTENSION_CLAIM_V1)
      .toMatchObject({
        modelOwnerScope: "standard-66-only",
        legacyStandard65InstantiatesExtension: false,
        acceptedHemodynamicStateAdded: false,
        instantaneousReadbackCheckpointed: false,
        acceptedRevisionContinuityOwner: "outer-standard-session",
      });
    expect(extension.acceptedReadbackClockV1()).toBeNull();
    let coldBorrowCalled = false;
    expect(extension.withAcceptedReadbackV3(
      { acceptedTimeSec: 0, revision: 0 },
      () => {
        coldBorrowCalled = true;
        return 1;
      },
    )).toBeNull();
    expect(coldBorrowCalled).toBe(false);
    expect(() => extension.withAcceptedReadbackV3(
      { acceptedTimeSec: Number.NaN, revision: 1 },
      () => 1,
    )).toThrow(/finite and nonnegative/);
    expect(() => extension.withAcceptedReadbackV3(
      { acceptedTimeSec: 0, revision: 0 },
      null as unknown as (readback: Float64Array) => number,
    )).toThrow(/borrow must be a function/);

    const before = extension.checkpointExactBeatStateV1();
    const first = stageCandidateV1(extension, sampleV1(0, 0, 80, 0, 0), 1);
    expect(() => extension.checkpointExactBeatStateV1()).toThrow(/open ticket/);
    expect(() =>
      stageCandidateV1(extension, sampleV1(0, 0, 80, 0, 0), 1)
    ).toThrow(/already open/);
    first.close();
    first.close();
    expect(extension.checkpointExactBeatStateV1()).toStrictEqual(before);
    expect(extension.acceptedReadbackClockV1()).toBeNull();

    const second = stageCandidateV1(
      extension,
      sampleV1(0, 0, 80, 0, 0),
      1,
    );
    first.close();
    expect(() => extension.checkpointExactBeatStateV1()).toThrow(/open ticket/);
    second.close();
  });

  it("fails closed on mismatched stage/commit clocks and rejects repeated promotion without publishing", () => {
    const extension =
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
    const sample = sampleV1(1, 0, 80, 0, 0);
    expect(() => extension.stageCandidateV1({
      expectedCandidateTimeSec: 1,
      expectedCandidateRevision: 1,
      candidateTimeSec: 1.1,
      candidateRevision: 1,
      historicalAcceptedNumericalReadback: historicalReadbackV1(sample),
      selectedAorticValveReadback: selectedReadbackV1(sample),
    })).toThrow(/does not match expected clock/);
    const wrongHistoricalClock = historicalReadbackV1(sample);
    wrongHistoricalClock[
      MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1.timeSec
    ] = 1.1;
    expect(() => extension.stageCandidateV1({
      expectedCandidateTimeSec: 1,
      expectedCandidateRevision: 1,
      candidateTimeSec: 1,
      candidateRevision: 1,
      historicalAcceptedNumericalReadback: wrongHistoricalClock,
      selectedAorticValveReadback: selectedReadbackV1(sample),
    })).toThrow(/historical readback clock/);

    const ticket = stageCandidateV1(extension, sample, 1);
    const wrongPromotion = Object.freeze({
      committedAcceptedTimeSec: 1.1,
      committedRevision: 1,
      capturedAtrialActivationId: "capture/start",
      baseCompletedBeatMetrics: null,
    });
    expect(() => ticket.promote(wrongPromotion)).toThrow(
      /committed clock does not match/,
    );
    expect(() => ticket.promote({
      ...wrongPromotion,
      committedAcceptedTimeSec: 1,
    })).toThrow(/promotion is not open/);
    expect(extension.acceptedReadbackClockV1()).toBeNull();
    expect(() => extension.checkpointExactBeatStateV1()).toThrow(/open ticket/);
    ticket.close();
    ticket.close();
    expect(extension.checkpointExactBeatStateV1()).toEqual(
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1()
        .checkpointExactBeatStateV1(),
    );
  });

  it("publishes only committed 76-f64 readbacks and synchronized base/selected beat completion", () => {
    const extension =
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
    const baseAccumulator = new MainWireIntegratedModelBeatAccumulatorV3();

    const first = promoteWithBaseV1(
      extension,
      baseAccumulator,
      sampleV1(0, 0, 80, 0, 0),
      1,
      "capture/a",
    );
    expect(first.baseCompleted).toBeNull();
    expect(first.selectedCompleted).toBeNull();
    expect(() => first.ticket.promote({
      committedAcceptedTimeSec: 0,
      committedRevision: 1,
      capturedAtrialActivationId: "capture/a",
      baseCompletedBeatMetrics: null,
    })).toThrow(/promotion is not open/);
    first.ticket.close();
    first.ticket.close();
    expect(extension.acceptedReadbackClockV1()).toEqual({
      acceptedTimeSec: 0,
      revision: 1,
    });
    expect(extension.withAcceptedReadbackV3(
      { acceptedTimeSec: 0, revision: 1 },
      (readback) => ({
        length: readback.length,
        timeSec:
          readback[MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1
            .timeSec],
        proximalPressureMmHg:
          readback[MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2
            .algebraicProximalConstitutivePortPressureMmHg],
      }),
    )).toEqual({
      length: MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
      timeSec: 0,
      proximalPressureMmHg: 80,
    });
    expect(() => extension.withAcceptedReadbackV3(
      { acceptedTimeSec: 0, revision: 2 },
      () => null,
    )).toThrow(/clock does not match/);

    promoteWithBaseV1(
      extension,
      baseAccumulator,
      sampleV1(1, 20, 100, 20, 16),
      2,
      null,
    );
    const completed = promoteWithBaseV1(
      extension,
      baseAccumulator,
      sampleV1(2, -20, 90, -10, -8),
      3,
      "capture/b",
    );
    expect(completed.baseCompleted).not.toBeNull();
    expect(completed.selectedCompleted).toMatchObject({
      startAtrialCaptureId: "capture/a",
      endAtrialCaptureId: "capture/b",
      startTimeSec: 0,
      endTimeSec: 2,
      durationSec: 2,
      localValveForwardPressureGradient: {
        forwardFlowDurationSec: 1.5,
      },
      venaContractaBernoulliForwardPressureGradient: {
        forwardFlowDurationSec: 1.5,
      },
    });
    expect(
      completed.baseCompleted?.valveForwardPressureGradients.AoV
        .forwardFlowDurationSec,
    ).toBe(
      completed.selectedCompleted?.localValveForwardPressureGradient
        .forwardFlowDurationSec,
    );
    expect(extension.latestCompletedBeatMetricsV1()).toStrictEqual(
      completed.selectedCompleted,
    );
  });

  it("leaves accepted readback, accumulator, and latest metrics unchanged after synchronization failures", () => {
    const extension =
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
    const baseAccumulator = new MainWireIntegratedModelBeatAccumulatorV3();
    promoteWithBaseV1(
      extension,
      baseAccumulator,
      sampleV1(0, 0, 80, 0, 0),
      1,
      "capture/a",
    );
    promoteWithBaseV1(
      extension,
      baseAccumulator,
      sampleV1(1, 20, 100, 20, 16),
      2,
      null,
    );
    const beforeCheckpoint = extension.checkpointExactBeatStateV1();
    const beforeReadback = extension.withAcceptedReadbackV3(
      { acceptedTimeSec: 1, revision: 2 },
      (readback) => Array.from(readback),
    );
    const endSample = sampleV1(2, -20, 90, -10, -8);
    const endHistorical = historicalReadbackV1(endSample);
    const baseCompleted = baseAccumulator.acceptNumericalReadback(
      endHistorical,
      "capture/b",
    );
    if (baseCompleted === null) {
      throw new Error("test base beat did not complete");
    }
    const wrongCapture = structuredClone(baseCompleted) as any;
    wrongCapture.startAtrialCaptureId = "capture/other";
    const wrongForwardDuration = structuredClone(baseCompleted) as any;
    wrongForwardDuration.valveForwardPressureGradients.AoV
      .forwardFlowDurationSec -= 0.25;
    const invalidBaseCompletions = [
      null,
      wrongCapture,
      wrongForwardDuration,
    ] as const;

    for (const invalidBaseCompleted of invalidBaseCompletions) {
      const ticket = stageCandidateV1(extension, endSample, 3);
      expect(() => ticket.promote({
        committedAcceptedTimeSec: 2,
        committedRevision: 3,
        capturedAtrialActivationId: "capture/b",
        baseCompletedBeatMetrics: invalidBaseCompleted,
      })).toThrow(/completion/);
      expect(() => ticket.promote({
        committedAcceptedTimeSec: 2,
        committedRevision: 3,
        capturedAtrialActivationId: "capture/b",
        baseCompletedBeatMetrics: baseCompleted,
      })).toThrow(/promotion is not open/);
      ticket.close();
      ticket.close();
      expect(extension.checkpointExactBeatStateV1()).toStrictEqual(
        beforeCheckpoint,
      );
      expect(extension.acceptedReadbackClockV1()).toEqual({
        acceptedTimeSec: 1,
        revision: 2,
      });
      expect(extension.withAcceptedReadbackV3(
        { acceptedTimeSec: 1, revision: 2 },
        (readback) => Array.from(readback),
      )).toStrictEqual(beforeReadback);
      expect(extension.latestCompletedBeatMetricsV1()).toBeNull();
    }

    const finalTicket = stageCandidateV1(extension, endSample, 3);
    const selectedCompleted = finalTicket.promote({
      committedAcceptedTimeSec: 2,
      committedRevision: 3,
      capturedAtrialActivationId: "capture/b",
      baseCompletedBeatMetrics: baseCompleted,
    });
    finalTicket.close();
    expect(selectedCompleted?.endAtrialCaptureId).toBe("capture/b");
    expect(extension.acceptedReadbackClockV1()).toEqual({
      acceptedTimeSec: 2,
      revision: 3,
    });
  });

  it("replays a mid-beat exact checkpoint and restores completed metrics without instantaneous readback", () => {
    const original =
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
    const originalBase = new MainWireIntegratedModelBeatAccumulatorV3();
    promoteWithBaseV1(
      original,
      originalBase,
      sampleV1(0, 0, 80, 0, 0),
      1,
      "capture/a",
    );
    promoteWithBaseV1(
      original,
      originalBase,
      sampleV1(0.5, 20, 100, 20, 16),
      2,
      null,
    );
    const extensionCheckpoint = original.checkpointExactBeatStateV1();
    const baseCheckpoint = originalBase.checkpoint();
    const restored =
      MainWireSelectedAorticPortSessionExtensionV1.restoreExactBeatStateV1(
        structuredClone(extensionCheckpoint),
      );
    const restoredBase = MainWireIntegratedModelBeatAccumulatorV3.restore(
      structuredClone(baseCheckpoint),
    );
    expect(restored.acceptedReadbackClockV1()).toBeNull();
    let restoredBorrowCalled = false;
    expect(restored.withAcceptedReadbackV3(
      { acceptedTimeSec: 0.5, revision: 2 },
      () => {
        restoredBorrowCalled = true;
        return 1;
      },
    )).toBeNull();
    expect(restoredBorrowCalled).toBe(false);

    const endSample = sampleV1(1, -20, 90, -10, -8);
    const originalCompleted = promoteWithBaseV1(
      original,
      originalBase,
      endSample,
      3,
      "capture/b",
    ).selectedCompleted;
    const restoredCompleted = promoteWithBaseV1(
      restored,
      restoredBase,
      endSample,
      3,
      "capture/b",
    ).selectedCompleted;
    expect(restoredCompleted).toStrictEqual(originalCompleted);
    expect(numericLeavesV1(restoredCompleted)).toEqual(
      numericLeavesV1(originalCompleted),
    );
    expect(restored.checkpointExactBeatStateV1()).toStrictEqual(
      original.checkpointExactBeatStateV1(),
    );

    const completedCheckpoint = restored.checkpointExactBeatStateV1();
    const completedRestore =
      MainWireSelectedAorticPortSessionExtensionV1.restoreExactBeatStateV1(
        structuredClone(completedCheckpoint),
      );
    expect(completedRestore.acceptedReadbackClockV1()).toBeNull();
    expect(completedRestore.latestCompletedBeatMetricsV1()).toStrictEqual(
      restoredCompleted,
    );
  });

  it("checkpoints only strict accumulator/latest exact beat state and rejects malformed payloads", () => {
    const extension = completedExtensionV1();
    const checkpoint = extension.checkpointExactBeatStateV1();
    expect(checkpoint.checkpointId).toBe(
      MAIN_WIRE_SELECTED_AORTIC_PORT_EXACT_BEAT_STATE_CHECKPOINT_V1_ID,
    );
    expect(Object.keys(checkpoint).sort()).toEqual([
      "checkpointId",
      "latestCompletedBeatMetrics",
      "schemaVersion",
      "selectedBeatAccumulator",
    ]);
    expect(containsArrayBufferViewV1(checkpoint)).toBe(false);

    const malformed = [
      mutatePlainV1(checkpoint, (value) => {
        value.extra = true;
      }),
      mutatePlainV1(checkpoint, (value) => {
        value.selectedBeatAccumulator.active.previous.timeSec = Number.NaN;
      }),
      mutatePlainV1(checkpoint, (value) => {
        value.latestCompletedBeatMetrics.extra = true;
      }),
      mutatePlainV1(checkpoint, (value) => {
        value.selectedBeatAccumulator.active.startAtrialCaptureId =
          "capture/unrelated";
      }),
      mutatePlainV1(checkpoint, (value) => {
        value.selectedBeatAccumulator = new Float64Array(76);
      }),
    ];
    for (const value of malformed) {
      expect(() =>
        MainWireSelectedAorticPortSessionExtensionV1.restoreExactBeatStateV1(
          value,
        )
      ).toThrow();
    }
  });
});

type SyntheticSampleV1 = Readonly<{
  timeSec: number;
  aorticValveFlowMlPerSec: number;
  proximalPressureMmHg: number;
  localGradientMmHg: number;
  venaContractaPressureMmHg: number;
}>;

function sampleV1(
  timeSec: number,
  aorticValveFlowMlPerSec: number,
  proximalPressureMmHg: number,
  localGradientMmHg: number,
  venaContractaPressureMmHg: number,
): SyntheticSampleV1 {
  return Object.freeze({
    timeSec,
    aorticValveFlowMlPerSec,
    proximalPressureMmHg,
    localGradientMmHg,
    venaContractaPressureMmHg,
  });
}

function historicalReadbackV1(sample: SyntheticSampleV1): Float64Array {
  const readback = new Float64Array(
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  );
  const layout = MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1;
  readback[layout.timeSec] = sample.timeSec;
  for (let chamberIndex = 0; chamberIndex < 4; chamberIndex += 1) {
    readback[layout.chamberVolumeMl + chamberIndex] = 100;
  }
  const aorticPressureMmHg = 80;
  readback[layout.absolutePressureMmHg + 4] = aorticPressureMmHg;
  readback[layout.absolutePressureMmHg + 1] =
    aorticPressureMmHg + sample.localGradientMmHg;
  readback[
    layout.valveFlowMlPerSec + AORTIC_VALVE_READBACK_INDEX_V1
  ] = sample.aorticValveFlowMlPerSec;
  return readback;
}

function selectedReadbackV1(sample: SyntheticSampleV1) {
  return Object.freeze({
    modelId: MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_V1_ID,
    algebraicProximalConstitutivePortPressureMmHg:
      sample.proximalPressureMmHg,
    localValvePressureGradientMmHg: sample.localGradientMmHg,
    venaContractaBernoulliPressureMmHg:
      sample.venaContractaPressureMmHg,
  });
}

function stageCandidateV1(
  extension: MainWireSelectedAorticPortSessionExtensionV1,
  sample: SyntheticSampleV1,
  revision: number,
): MainWireSelectedAorticPortSessionTicketV1 {
  return extension.stageCandidateV1({
    expectedCandidateTimeSec: sample.timeSec,
    expectedCandidateRevision: revision,
    candidateTimeSec: sample.timeSec,
    candidateRevision: revision,
    historicalAcceptedNumericalReadback: historicalReadbackV1(sample),
    selectedAorticValveReadback: selectedReadbackV1(sample),
  });
}

function promoteWithBaseV1(
  extension: MainWireSelectedAorticPortSessionExtensionV1,
  baseAccumulator: MainWireIntegratedModelBeatAccumulatorV3,
  sample: SyntheticSampleV1,
  revision: number,
  capturedAtrialActivationId: string | null,
): Readonly<{
  ticket: MainWireSelectedAorticPortSessionTicketV1;
  baseCompleted: MainWireIntegratedModelCompletedBeatMetricsV3 | null;
  selectedCompleted: ReturnType<
    MainWireSelectedAorticPortSessionTicketV1["promote"]
  >;
}> {
  const historicalReadback = historicalReadbackV1(sample);
  const ticket = extension.stageCandidateV1({
    expectedCandidateTimeSec: sample.timeSec,
    expectedCandidateRevision: revision,
    candidateTimeSec: sample.timeSec,
    candidateRevision: revision,
    historicalAcceptedNumericalReadback: historicalReadback,
    selectedAorticValveReadback: selectedReadbackV1(sample),
  });
  const baseCompleted = baseAccumulator.acceptNumericalReadback(
    historicalReadback,
    capturedAtrialActivationId,
  );
  try {
    const selectedCompleted = ticket.promote({
      committedAcceptedTimeSec: sample.timeSec,
      committedRevision: revision,
      capturedAtrialActivationId,
      baseCompletedBeatMetrics: baseCompleted,
    });
    return Object.freeze({ ticket, baseCompleted, selectedCompleted });
  } finally {
    ticket.close();
  }
}

function completedExtensionV1():
  MainWireSelectedAorticPortSessionExtensionV1 {
  const extension =
    MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
  const baseAccumulator = new MainWireIntegratedModelBeatAccumulatorV3();
  promoteWithBaseV1(
    extension,
    baseAccumulator,
    sampleV1(0, 0, 80, 0, 0),
    1,
    "capture/a",
  );
  promoteWithBaseV1(
    extension,
    baseAccumulator,
    sampleV1(1, 20, 100, 20, 16),
    2,
    null,
  );
  promoteWithBaseV1(
    extension,
    baseAccumulator,
    sampleV1(2, -20, 90, -10, -8),
    3,
    "capture/b",
  );
  return extension;
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

function containsArrayBufferViewV1(input: unknown): boolean {
  if (ArrayBuffer.isView(input)) return true;
  if (input === null || typeof input !== "object") return false;
  return Object.values(input).some(containsArrayBufferViewV1);
}

function mutatePlainV1(
  input: unknown,
  mutate: (value: Record<string, any>) => void,
): unknown {
  const value = structuredClone(input) as Record<string, any>;
  mutate(value);
  return value;
}
