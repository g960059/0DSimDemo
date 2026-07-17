import { describe, expect, it } from "vitest";
import {
  WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
  WHOLE_HEART_MECHANICS_OWNERSHIP_V1,
  checkpointWholeHeartMechanicsStateV1,
  cloneWholeHeartMechanicsAcceptedStateV1,
  commitWholeHeartMechanicsTrialV1,
  evaluateWholeHeartMechanicsTrialV1,
  initializeWholeHeartMechanicsColdV1,
  restoreWholeHeartMechanicsStateV1,
  type WholeHeartMechanicsChamberValuesV1,
  type WholeHeartMechanicsDiagnosticsV1,
  type WholeHeartMechanicsProviderV1,
  type WholeHeartMechanicsSerializableValueV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

type MaterialState = {
  landState: Float64Array;
  maxwellStressPa: WholeHeartMechanicsChamberValuesV1;
  septalShiftMl: number;
  longAxisCoordinate: number;
};

type DrivingInputs = {
  calciumUM: WholeHeartMechanicsChamberValuesV1;
  fail?: boolean;
};

describe("whole-heart mechanics transaction contract v1", () => {
  it("jointly evaluates four pressures without advancing accepted state", () => {
    const provider = testProvider();
    const cold = coldStart(provider);
    const accepted = cold.acceptedState;
    const originalLand0 = accepted.materialState.landState[0];

    const lowLv = evaluateWholeHeartMechanicsTrialV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      candidateVolumesMl: { LA: 70, LV: 110, RA: 65, RV: 105 },
      drivingInputs: drive(),
    });
    const highLv = evaluateWholeHeartMechanicsTrialV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      candidateVolumesMl: { LA: 70, LV: 130, RA: 65, RV: 105 },
      drivingInputs: drive(),
    });

    expect(lowLv.baseRevision).toBe(0);
    expect(highLv.baseRevision).toBe(0);
    expect(highLv.transmuralPressuresMmHg.LA)
      .not.toBe(lowLv.transmuralPressuresMmHg.LA);
    expect(accepted.revision).toBe(0);
    expect(accepted.materialState.landState[0]).toBe(originalLand0);
    expect(providerCallCount(provider)).toEqual({ cold: 1, trial: 2 });
  });

  it("promotes exactly one ready trial and rejects a stale or failed trial", () => {
    const provider = testProvider();
    const accepted = coldStart(provider).acceptedState;
    const ready = trial(provider, accepted, { LA: 69, LV: 126, RA: 64, RV: 112 });
    const alsoReady = trial(provider, accepted, { LA: 71, LV: 124, RA: 66, RV: 110 });

    const committed = commitWholeHeartMechanicsTrialV1(provider, accepted, ready);
    expect(committed.revision).toBe(1);
    expect(committed.acceptedTimeSec).toBe(0.002);
    expect(committed.acceptedVolumesMl).toEqual(ready.candidateVolumesMl);
    expect(() => commitWholeHeartMechanicsTrialV1(provider, committed, alsoReady))
      .toThrow(/stale/);

    const failed = evaluateWholeHeartMechanicsTrialV1(provider, {
      previousAcceptedState: committed,
      candidateTimeSec: 0.004,
      stepDtSec: 0.002,
      candidateVolumesMl: { LA: 70, LV: 125, RA: 65, RV: 111 },
      drivingInputs: { ...drive(), fail: true },
    });
    expect(failed.diagnostics.finite).toBe(false);
    expect(() => commitWholeHeartMechanicsTrialV1(provider, committed, failed))
      .toThrow(/not ready/);
  });

  it("cold-starts all material coordinates and round-trips a JSON checkpoint", () => {
    const provider = testProvider();
    const cold = coldStart(provider);
    expect(cold.acceptedState.materialState).toMatchObject({
      septalShiftMl: 0,
      longAxisCoordinate: 0,
    });
    expect(Array.from(cold.acceptedState.materialState.landState)).toEqual([0, 0, 0, 0]);

    const committed = commitWholeHeartMechanicsTrialV1(
      provider,
      cold.acceptedState,
      trial(provider, cold.acceptedState, { LA: 70, LV: 125, RA: 65, RV: 110 }),
    );
    const checkpoint = checkpointWholeHeartMechanicsStateV1(provider, committed);
    const json = JSON.stringify(checkpoint);
    const restored = restoreWholeHeartMechanicsStateV1(
      provider,
      JSON.parse(json) as typeof checkpoint,
    );
    expect(restored).toEqual(committed);

    const cloned = cloneWholeHeartMechanicsAcceptedStateV1(provider, restored);
    cloned.materialState.landState[0] = 999;
    expect(restored.materialState.landState[0]).not.toBe(999);
    expect(() => trial(provider, cloned, { LA: 70, LV: 125, RA: 65, RV: 110 }))
      .toThrow(/fingerprint mismatch/);

    const changedParameters = {
      ...provider,
      parameterSetId: "joint-test-mechanics-v2",
      parameterIdentityHash: "effective-parameters-v2-deadbeef",
    };
    expect(() => restoreWholeHeartMechanicsStateV1(changedParameters, checkpoint))
      .toThrow(/identity mismatch/);
  });

  it("keeps circulation ownership outside the mechanics provider surface", () => {
    expect(WHOLE_HEART_MECHANICS_OWNERSHIP_V1.mainWireOwns).toEqual([
      "vascular-node-state",
      "vascular-edge-state",
      "valve-state-and-law",
      "blood-volume-ledger",
    ]);
    expect(WHOLE_HEART_MECHANICS_OWNERSHIP_V1.providerOwns).toContain(
      "four-chamber-transmural-pressure",
    );
    expect(Object.keys(testProvider()).sort()).toEqual([
      "callCount",
      "contractId",
      "evaluateTrial",
      "initializeCold",
      "parameterIdentityHash",
      "parameterSetId",
      "providerId",
      "stateCodec",
      "stateSchemaVersion",
    ]);
  });
});

type TestProvider = WholeHeartMechanicsProviderV1<MaterialState, DrivingInputs> & {
  readonly callCount: { cold: number; trial: number };
};

function testProvider(): TestProvider {
  const callCount = { cold: 0, trial: 0 };
  return {
    contractId: WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
    providerId: "joint-test-mechanics-v1",
    parameterSetId: "joint-test-prior-v1",
    parameterIdentityHash: "effective-parameters-v1-7f4a9c12",
    stateSchemaVersion: 1,
    callCount,
    stateCodec: {
      clone: cloneMaterial,
      encode: encodeMaterial,
      decode: decodeMaterial,
    },
    initializeCold: ({ volumesMl }) => {
      callCount.cold += 1;
      return {
        materialState: {
          landState: new Float64Array(4),
          maxwellStressPa: { LA: 0, LV: 0, RA: 0, RV: 0 },
          septalShiftMl: 0,
          longAxisCoordinate: 0,
        },
        transmuralPressuresMmHg: pressures(volumesMl, 0),
        diagnostics: healthyDiagnostics(0),
      };
    },
    evaluateTrial: ({
      previousAcceptedState,
      candidateVolumesMl,
      stepDtSec,
      drivingInputs,
    }) => {
      callCount.trial += 1;
      const materialState = cloneMaterial(previousAcceptedState.materialState);
      const calciumSum = chamberNumbers(drivingInputs.calciumUM)
        .reduce((sum, value) => sum + value, 0);
      materialState.landState[0] += stepDtSec * calciumSum;
      materialState.septalShiftMl = 0.01 * (candidateVolumesMl.LV - candidateVolumesMl.RV);
      materialState.longAxisCoordinate =
        1e-3 * (candidateVolumesMl.LV - candidateVolumesMl.LA);
      if (drivingInputs.fail) {
        return {
          materialState,
          transmuralPressuresMmHg: { LA: NaN, LV: NaN, RA: NaN, RV: NaN },
          diagnostics: {
            ...healthyDiagnostics(1),
            converged: false,
            finite: false,
            errors: ["test failure"],
          },
        };
      }
      return {
        materialState,
        transmuralPressuresMmHg: pressures(
          candidateVolumesMl,
          materialState.longAxisCoordinate,
        ),
        diagnostics: healthyDiagnostics(1),
      };
    },
  };
}

function coldStart(provider: TestProvider) {
  return initializeWholeHeartMechanicsColdV1(provider, {
    timeSec: 0,
    volumesMl: { LA: 68, LV: 120, RA: 63, RV: 108 },
    drivingInputs: drive(),
  });
}

function trial(
  provider: TestProvider,
  previousAcceptedState: ReturnType<typeof coldStart>["acceptedState"],
  candidateVolumesMl: WholeHeartMechanicsChamberValuesV1,
) {
  return evaluateWholeHeartMechanicsTrialV1(provider, {
    previousAcceptedState,
    candidateTimeSec: previousAcceptedState.acceptedTimeSec + 0.002,
    stepDtSec: 0.002,
    candidateVolumesMl,
    drivingInputs: drive(),
  });
}

function drive(): DrivingInputs {
  return { calciumUM: { LA: 0.2, LV: 0.1, RA: 0.2, RV: 0.1 } };
}

function pressures(
  volumes: WholeHeartMechanicsChamberValuesV1,
  q: number,
): WholeHeartMechanicsChamberValuesV1 {
  const total = chamberNumbers(volumes).reduce((sum, value) => sum + value, 0);
  return {
    LA: 0.08 * volumes.LA + 0.001 * total + q,
    LV: 0.8 * volumes.LV + 0.02 * volumes.RV - q,
    RA: 0.05 * volumes.RA + 0.001 * total,
    RV: 0.2 * volumes.RV + 0.02 * volumes.LV,
  };
}

function healthyDiagnostics(iterationCount: number): WholeHeartMechanicsDiagnosticsV1 {
  return {
    converged: true,
    finite: true,
    iterationCount,
    residualNorm: 0,
    errors: [],
    warnings: [],
    readback: { jointSolve: true },
  };
}

function cloneMaterial(state: MaterialState): MaterialState {
  return {
    landState: Float64Array.from(state.landState),
    maxwellStressPa: { ...state.maxwellStressPa },
    septalShiftMl: state.septalShiftMl,
    longAxisCoordinate: state.longAxisCoordinate,
  };
}

function encodeMaterial(state: MaterialState): WholeHeartMechanicsSerializableValueV1 {
  return {
    landState: Array.from(state.landState),
    maxwellStressPa: { ...state.maxwellStressPa },
    septalShiftMl: state.septalShiftMl,
    longAxisCoordinate: state.longAxisCoordinate,
  };
}

function decodeMaterial(encoded: WholeHeartMechanicsSerializableValueV1): MaterialState {
  const value = encoded as {
    landState: readonly number[];
    maxwellStressPa: WholeHeartMechanicsChamberValuesV1;
    septalShiftMl: number;
    longAxisCoordinate: number;
  };
  return {
    landState: Float64Array.from(value.landState),
    maxwellStressPa: { ...value.maxwellStressPa },
    septalShiftMl: value.septalShiftMl,
    longAxisCoordinate: value.longAxisCoordinate,
  };
}

function chamberNumbers(values: WholeHeartMechanicsChamberValuesV1): number[] {
  return [values.LA, values.LV, values.RA, values.RV];
}

function providerCallCount(provider: TestProvider) {
  return { ...provider.callCount };
}
