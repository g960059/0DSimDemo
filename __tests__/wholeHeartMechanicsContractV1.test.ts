import { describe, expect, it } from "vitest";
import {
  hotPathIntegrityTierV1,
  selectHotPathIntegrityTierV1,
  type HotPathIntegrityTierV1,
} from "@/engine/hotPathIntegrityTierV1";
import {
  WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
  WHOLE_HEART_MECHANICS_OWNERSHIP_V1,
  checkpointWholeHeartMechanicsStateV1,
  cloneWholeHeartMechanicsAcceptedStateV1,
  commitPreparedWholeHeartMechanicsTrialV1,
  commitWholeHeartMechanicsTrialV1,
  evaluatePreparedWholeHeartMechanicsCandidateProbeV1,
  evaluatePreparedWholeHeartMechanicsTrialV1,
  evaluateWholeHeartMechanicsTrialV1,
  initializeWholeHeartMechanicsColdV1,
  inspectPreparedWholeHeartMechanicsCandidateProbeReadbackV1,
  prepareWholeHeartMechanicsStepV1,
  rebindWholeHeartMechanicsAcceptedStateV1,
  restoreWholeHeartMechanicsStateV1,
  sealPreparedWholeHeartMechanicsCandidateProbeV1,
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
    expect(highLv.transmuralPressureVolumeTangentMmHgPerMl)
      .toEqual(testPressureVolumeTangent());
    expect(Object.isFrozen(
      highLv.transmuralPressureVolumeTangentMmHgPerMl,
    )).toBe(true);
    expect(Object.isFrozen(
      highLv.transmuralPressureVolumeTangentMmHgPerMl!.LV,
    )).toBe(true);
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

  it("rebinds accepted material memory only across a compatible provider schema", () => {
    const sourceProvider = testProvider();
    const cold = coldStart(sourceProvider).acceptedState;
    const source = commitWholeHeartMechanicsTrialV1(
      sourceProvider,
      cold,
      trial(
        sourceProvider,
        cold,
        { LA: 70, LV: 125, RA: 65, RV: 110 },
      ),
    );
    const targetProvider = {
      ...testProvider(),
      parameterSetId: "joint-test-mechanics-contractility-1.2",
      parameterIdentityHash: "effective-parameters-contractility-1.2",
    };

    const rebound = rebindWholeHeartMechanicsAcceptedStateV1(
      sourceProvider,
      targetProvider,
      source,
    );
    expect(rebound).toMatchObject({
      revision: source.revision,
      acceptedTimeSec: source.acceptedTimeSec,
      acceptedVolumesMl: source.acceptedVolumesMl,
      providerId: targetProvider.providerId,
      parameterSetId: targetProvider.parameterSetId,
      parameterIdentityHash: targetProvider.parameterIdentityHash,
      stateSchemaVersion: targetProvider.stateSchemaVersion,
    });
    expect(rebound.materialState).toEqual(source.materialState);
    expect(rebound.materialState).not.toBe(source.materialState);
    expect(() => rebindWholeHeartMechanicsAcceptedStateV1(
      sourceProvider,
      { ...targetProvider, providerId: "other-mechanics-provider" },
      source,
    )).toThrow(/one provider and state schema/);
    expect(() => rebindWholeHeartMechanicsAcceptedStateV1(
      sourceProvider,
      { ...targetProvider, stateSchemaVersion: 99 },
      source,
    )).toThrow(/one provider and state schema/);
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
      "evaluationResultOwnershipMode",
      "initializeCold",
      "parameterIdentityHash",
      "parameterSetId",
      "providerId",
      "stateCodec",
      "stateSchemaVersion",
    ]);
  });

  it("rejects a non-finite optional pressure-volume tangent", () => {
    const provider = testProvider();
    const accepted = coldStart(provider).acceptedState;
    const invalidProvider: TestProvider = {
      ...provider,
      evaluateTrial: (input) => {
        const evaluated = provider.evaluateTrial(input);
        return {
          ...evaluated,
          transmuralPressureVolumeTangentMmHgPerMl: {
            ...testPressureVolumeTangent(),
            LV: { ...testPressureVolumeTangent().LV, RV: Number.NaN },
          },
        };
      },
    };
    expect(() => trial(
      invalidProvider,
      accepted,
      { LA: 70, LV: 125, RA: 65, RV: 110 },
    )).toThrow(/LV\.RV must be finite/);
  });

  it("keeps the prepared path exactly equal to the checked path over a trajectory", () => {
    const checkedProvider = testProvider();
    const preparedProvider = testProvider();
    let checked = coldStart(checkedProvider).acceptedState;
    let prepared = coldStart(preparedProvider).acceptedState;
    const volumes = [
      { LA: 69, LV: 124, RA: 64, RV: 110 },
      { LA: 70, LV: 127, RA: 65, RV: 108 },
      { LA: 68, LV: 122, RA: 63, RV: 112 },
      { LA: 71, LV: 129, RA: 66, RV: 109 },
    ] as const;

    for (const candidateVolumesMl of volumes) {
      const candidateTimeSec = checked.acceptedTimeSec + 0.002;
      const checkedTrial = evaluateWholeHeartMechanicsTrialV1(checkedProvider, {
        previousAcceptedState: checked,
        candidateTimeSec,
        stepDtSec: 0.002,
        candidateVolumesMl,
        drivingInputs: drive(),
      });
      const preparedStep = prepareWholeHeartMechanicsStepV1(preparedProvider, {
        previousAcceptedState: prepared,
        candidateTimeSec,
        stepDtSec: 0.002,
        drivingInputs: drive(),
      });
      const preparedTrial = evaluatePreparedWholeHeartMechanicsTrialV1(
        preparedStep,
        candidateVolumesMl,
      );

      expect(preparedTrial).toEqual(checkedTrial);
      checked = commitWholeHeartMechanicsTrialV1(
        checkedProvider,
        checked,
        checkedTrial,
      );
      prepared = commitPreparedWholeHeartMechanicsTrialV1(
        preparedStep,
        preparedTrial,
      );
      expect(prepared).toEqual(checked);
      expect(checkpointWholeHeartMechanicsStateV1(preparedProvider, prepared))
        .toEqual(checkpointWholeHeartMechanicsStateV1(
          checkedProvider,
          checked,
        ));
    }
  });

  it("isolates a prepared baseline and still rejects candidate mutation", () => {
    const provider = testProvider();
    const accepted = coldStart(provider).acceptedState;
    const originalLand0 = accepted.materialState.landState[0];
    const preparedStep = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: drive(),
    });

    // The checked context owns a private snapshot, so later caller mutation
    // cannot change Newton candidates belonging to this already-open step.
    accepted.materialState.landState[0] = 999;
    const first = evaluatePreparedWholeHeartMechanicsTrialV1(
      preparedStep,
      { LA: 70, LV: 125, RA: 65, RV: 110 },
    );
    const repeated = evaluatePreparedWholeHeartMechanicsTrialV1(
      preparedStep,
      { LA: 70, LV: 125, RA: 65, RV: 110 },
    );
    expect(first).toEqual(repeated);
    expect(first.candidateMaterialState.landState[0]).toBeCloseTo(
      originalLand0 + 0.002 * 0.6,
      15,
    );

    first.candidateMaterialState.landState[0] = 1234;
    expect(() => commitPreparedWholeHeartMechanicsTrialV1(preparedStep, first))
      .toThrow(/fingerprint mismatch/);
    expect(() => prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: drive(),
    })).toThrow(/fingerprint mismatch/);
  });

  it("audits the accepted snapshot once instead of once per Newton candidate", () => {
    const baseProvider = testProvider();
    const baseCodec = baseProvider.stateCodec;
    let encodeCount = 0;
    const provider: TestProvider = {
      ...baseProvider,
      stateCodec: {
        clone: baseCodec.clone,
        encode: (state) => {
          encodeCount += 1;
          return baseCodec.encode(state);
        },
        decode: baseCodec.decode,
      },
    };
    const accepted = coldStart(provider).acceptedState;
    encodeCount = 0;
    const preparedStep = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: drive(),
    });
    const first = evaluatePreparedWholeHeartMechanicsTrialV1(
      preparedStep,
      { LA: 69, LV: 124, RA: 64, RV: 110 },
    );
    evaluatePreparedWholeHeartMechanicsTrialV1(
      preparedStep,
      { LA: 70, LV: 127, RA: 65, RV: 108 },
    );
    commitPreparedWholeHeartMechanicsTrialV1(preparedStep, first);

    // One accepted audit, one encoding per candidate result, and one final
    // candidate mutation audit. No accepted-state re-encoding per candidate.
    expect(encodeCount).toBe(4);
  });

  it("defers candidate encoding until exactly one selected probe is sealed", () => {
    const baseProvider = testProvider();
    const baseCodec = baseProvider.stateCodec;
    let encodeCount = 0;
    const provider: TestProvider = {
      ...baseProvider,
      stateCodec: {
        clone: baseCodec.clone,
        encode: (state) => {
          encodeCount += 1;
          return baseCodec.encode(state);
        },
        decode: baseCodec.decode,
      },
    };
    const accepted = coldStart(provider).acceptedState;
    encodeCount = 0;
    const preparedStep = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: drive(),
    });
    const selected = evaluatePreparedWholeHeartMechanicsCandidateProbeV1(
      preparedStep,
      { LA: 69, LV: 124, RA: 64, RV: 110 },
    );
    evaluatePreparedWholeHeartMechanicsCandidateProbeV1(
      preparedStep,
      { LA: 70, LV: 127, RA: 65, RV: 108 },
    );

    expect(encodeCount).toBe(1);
    const trial = sealPreparedWholeHeartMechanicsCandidateProbeV1(
      preparedStep,
      selected,
    );
    expect(encodeCount).toBe(2);
    commitPreparedWholeHeartMechanicsTrialV1(preparedStep, trial);
    expect(encodeCount).toBe(3);
  });

  it("uses a trusted read-only prepared snapshot only for an opted-in provider", () => {
    const baseProvider = testProvider();
    const baseCodec = baseProvider.stateCodec;
    let cloneCount = 0;
    const provider: TestProvider = {
      ...baseProvider,
      acceptedStateInputMode: "trusted-read-only-prepared-snapshot",
      stateCodec: {
        clone: (state) => {
          cloneCount += 1;
          return baseCodec.clone(state);
        },
        encode: baseCodec.encode,
        decode: baseCodec.decode,
      },
    };
    const accepted = coldStart(provider).acceptedState;
    const baselineLand0 = accepted.materialState.landState[0];
    const preparedStep = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: drive(),
    });
    cloneCount = 0;
    const selected = evaluatePreparedWholeHeartMechanicsCandidateProbeV1(
      preparedStep,
      { LA: 69, LV: 124, RA: 64, RV: 110 },
    );
    evaluatePreparedWholeHeartMechanicsCandidateProbeV1(
      preparedStep,
      { LA: 70, LV: 127, RA: 65, RV: 108 },
    );

    expect(cloneCount).toBe(0);
    expect(accepted.materialState.landState[0]).toBe(baselineLand0);
    sealPreparedWholeHeartMechanicsCandidateProbeV1(preparedStep, selected);
    expect(cloneCount).toBe(2);
  });

  it("binds probes to one prepared step and permits only one successful seal", () => {
    const provider = testProvider();
    const accepted = coldStart(provider).acceptedState;
    const firstStep = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: drive(),
    });
    const secondStep = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: drive(),
    });
    const probe = evaluatePreparedWholeHeartMechanicsCandidateProbeV1(
      firstStep,
      { LA: 69, LV: 124, RA: 64, RV: 110 },
    );

    expect(() => sealPreparedWholeHeartMechanicsCandidateProbeV1(
      secondStep,
      probe,
    )).toThrow(/does not belong/);
    const sealed = sealPreparedWholeHeartMechanicsCandidateProbeV1(
      firstStep,
      probe,
    );
    expect(sealed.candidateVolumesMl).toEqual(probe.candidateVolumesMl);
    expect(() => sealPreparedWholeHeartMechanicsCandidateProbeV1(
      firstStep,
      probe,
    )).toThrow(/not live or was already sealed/);
    expect(() => sealPreparedWholeHeartMechanicsCandidateProbeV1(
      firstStep,
      { ...probe } as typeof probe,
    )).toThrow(/not live/);
  });

  it("exposes private probe readback only to its live prepared-step capability", () => {
    const provider = testProvider();
    const accepted = coldStart(provider).acceptedState;
    const firstStep = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: drive(),
    });
    const foreignStep = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: drive(),
    });
    const probe = evaluatePreparedWholeHeartMechanicsCandidateProbeV1(
      firstStep,
      { LA: 69, LV: 124, RA: 64, RV: 110 },
    );

    expect(inspectPreparedWholeHeartMechanicsCandidateProbeReadbackV1(
      firstStep,
      probe,
    )).toEqual({ jointSolve: true });
    expect(() => inspectPreparedWholeHeartMechanicsCandidateProbeReadbackV1(
      foreignStep,
      probe,
    )).toThrow(/does not belong/);
    expect(() => inspectPreparedWholeHeartMechanicsCandidateProbeReadbackV1(
      firstStep,
      { ...probe } as typeof probe,
    )).toThrow(/not live/);

    sealPreparedWholeHeartMechanicsCandidateProbeV1(firstStep, probe);
    expect(() => inspectPreparedWholeHeartMechanicsCandidateProbeReadbackV1(
      firstStep,
      probe,
    )).toThrow(/not live or was already sealed/);
  });

  it("keeps material state and rich readback outside the public probe", () => {
    const base = testProvider();
    let retainedCandidate: MaterialState | null = null;
    const provider: TestProvider = {
      ...base,
      evaluateTrial: (input) => {
        const result = base.evaluateTrial(input);
        retainedCandidate = result.materialState;
        return result;
      },
    };
    const accepted = coldStart(provider).acceptedState;
    const preparedStep = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: drive(),
    });
    const discarded = evaluatePreparedWholeHeartMechanicsCandidateProbeV1(
      preparedStep,
      { LA: 69, LV: 124, RA: 64, RV: 110 },
    );
    if (retainedCandidate === null) throw new Error("candidate was not retained");
    retainedCandidate.landState[0] = 999;
    const selected = evaluatePreparedWholeHeartMechanicsCandidateProbeV1(
      preparedStep,
      { LA: 70, LV: 127, RA: 65, RV: 108 },
    );
    expect("candidateMaterialState" in discarded).toBe(false);
    expect("readback" in discarded.diagnostics).toBe(false);
    const sealed = sealPreparedWholeHeartMechanicsCandidateProbeV1(
      preparedStep,
      selected,
    );
    expect(sealed.candidateMaterialState.landState[0]).toBeCloseTo(0.0012, 15);
    expect(sealed.diagnostics.readback).toEqual({ jointSolve: true });
  });

  it("snapshots selected rich readback when a probe becomes a public trial", () => {
    const base = testProvider();
    const providerReadback = { nested: { candidateLV: 0 } };
    const provider: TestProvider = {
      ...base,
      evaluateTrial: (input) => {
        const result = base.evaluateTrial(input);
        providerReadback.nested.candidateLV = input.candidateVolumesMl.LV;
        return {
          ...result,
          diagnostics: {
            ...result.diagnostics,
            readback: providerReadback,
          },
        };
      },
    };
    const accepted = coldStart(provider).acceptedState;
    const preparedStep = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: drive(),
    });
    const probe = evaluatePreparedWholeHeartMechanicsCandidateProbeV1(
      preparedStep,
      { LA: 69, LV: 124, RA: 64, RV: 110 },
    );
    const sealed = sealPreparedWholeHeartMechanicsCandidateProbeV1(
      preparedStep,
      probe,
    );

    providerReadback.nested.candidateLV = 999;
    expect(sealed.diagnostics.readback).toEqual({
      nested: { candidateLV: 124 },
    });
  });

  it("fails closed at seal when selected rich readback breaks the contract", () => {
    const base = testProvider();
    const provider: TestProvider = {
      ...base,
      evaluateTrial: (input) => {
        const result = base.evaluateTrial(input);
        return {
          ...result,
          diagnostics: {
            ...result.diagnostics,
            readback: new Date() as unknown as
              WholeHeartMechanicsSerializableValueV1,
          },
        };
      },
    };
    const accepted = coldStart(provider).acceptedState;
    const preparedStep = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: drive(),
    });
    const probe = evaluatePreparedWholeHeartMechanicsCandidateProbeV1(
      preparedStep,
      { LA: 69, LV: 124, RA: 64, RV: 110 },
    );

    expect("readback" in probe.diagnostics).toBe(false);
    expect(() => sealPreparedWholeHeartMechanicsCandidateProbeV1(
      preparedStep,
      probe,
    )).toThrow(/not JSON-serializable/);
  });

  it("snapshots scratch-reused results immediately for providers without the ownership opt-in", () => {
    const base = testProvider();
    const scratchState = cloneMaterial(coldStart(base).acceptedState.materialState);
    const scratchReadback: { candidateLV: number } = { candidateLV: 0 };
    const provider: TestProvider = {
      ...base,
      evaluationResultOwnershipMode: "defensive-snapshot-required",
      evaluateTrial: (input) => {
        const result = base.evaluateTrial(input);
        scratchState.landState.set(result.materialState.landState);
        scratchState.maxwellStressPa = {
          ...result.materialState.maxwellStressPa,
        };
        scratchState.septalShiftMl = result.materialState.septalShiftMl;
        scratchState.longAxisCoordinate =
          result.materialState.longAxisCoordinate;
        scratchReadback.candidateLV = input.candidateVolumesMl.LV;
        return {
          ...result,
          materialState: scratchState,
          diagnostics: {
            ...result.diagnostics,
            readback: scratchReadback,
          },
        };
      },
    };
    const accepted = coldStart(provider).acceptedState;
    const preparedStep = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: drive(),
    });
    const first = evaluatePreparedWholeHeartMechanicsTrialV1(
      preparedStep,
      { LA: 69, LV: 124, RA: 64, RV: 110 },
    );
    evaluatePreparedWholeHeartMechanicsTrialV1(
      preparedStep,
      { LA: 70, LV: 150, RA: 65, RV: 108 },
    );

    expect(first.candidateMaterialState.septalShiftMl).toBeCloseTo(0.14, 15);
    expect(first.diagnostics.readback).toEqual({ candidateLV: 124 });
    expect(() => evaluatePreparedWholeHeartMechanicsCandidateProbeV1(
      preparedStep,
      { LA: 69, LV: 124, RA: 64, RV: 110 },
    )).toThrow(/require provider exclusive-result ownership/);
  });

  it("binds eager defensive trials to one exact prepared context", () => {
    const base = testProvider();
    const provider: TestProvider = {
      ...base,
      evaluationResultOwnershipMode: "defensive-snapshot-required",
    };
    const accepted = coldStart(provider).acceptedState;
    const firstContext = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: drive(),
    });
    const secondContext = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: drive(),
    });
    const trial = evaluatePreparedWholeHeartMechanicsTrialV1(
      firstContext,
      { LA: 69, LV: 124, RA: 64, RV: 110 },
    );

    expect(() => commitPreparedWholeHeartMechanicsTrialV1(
      secondContext,
      trial,
    )).toThrow(/not issued by this prepared step/);
    expect(commitPreparedWholeHeartMechanicsTrialV1(
      firstContext,
      trial,
    ).revision).toBe(1);
    expect(() => commitPreparedWholeHeartMechanicsTrialV1(
      firstContext,
      trial,
    )).toThrow(/already consumed/);
  });
  it("isolates mutable future drive payloads through the provider clone hook", () => {
    const base = testProvider();
    const provider: TestProvider = {
      ...base,
      cloneDrivingInputs: (input) => ({
        calciumUM: { ...input.calciumUM },
        ...(input.fail === undefined ? {} : { fail: input.fail }),
      }),
      evaluateTrial: (input) => {
        const result = base.evaluateTrial(input);
        (input.drivingInputs.calciumUM as { LA: number }).LA = 999;
        return result;
      },
    };
    const accepted = coldStart(provider).acceptedState;
    const mutableDrive = drive();
    const preparedStep = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: mutableDrive,
    });
    (mutableDrive.calciumUM as { LA: number }).LA = 123;

    const volumes = { LA: 69, LV: 124, RA: 64, RV: 110 };
    const first = evaluatePreparedWholeHeartMechanicsTrialV1(
      preparedStep,
      volumes,
    );
    const repeated = evaluatePreparedWholeHeartMechanicsTrialV1(
      preparedStep,
      volumes,
    );

    expect(repeated).toEqual(first);
    expect(first.candidateMaterialState.landState[0]).toBeCloseTo(0.0012, 15);
  });

  it("binds a prepared trial to its exact context and consumes a successful commit", () => {
    const provider = testProvider();
    const accepted = coldStart(provider).acceptedState;
    const firstContext = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: drive(),
    });
    const secondContext = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: drive(),
    });
    const issued = evaluatePreparedWholeHeartMechanicsTrialV1(
      firstContext,
      { LA: 70, LV: 125, RA: 65, RV: 110 },
    );
    const forged = Object.freeze({ ...issued });

    expect(() => commitPreparedWholeHeartMechanicsTrialV1(
      firstContext,
      forged,
    )).toThrow(/not issued by this prepared step/);
    expect(() => commitPreparedWholeHeartMechanicsTrialV1(
      secondContext,
      issued,
    )).toThrow(/not issued by this prepared step/);

    const committed = commitPreparedWholeHeartMechanicsTrialV1(
      firstContext,
      issued,
    );
    expect(committed.revision).toBe(1);
    expect(() => commitPreparedWholeHeartMechanicsTrialV1(
      firstContext,
      issued,
    )).toThrow(/already consumed/);
    expect(() => evaluatePreparedWholeHeartMechanicsTrialV1(
      firstContext,
      { LA: 69, LV: 124, RA: 64, RV: 109 },
    )).toThrow(/already consumed/);
  });

  it("rejects a mutated published prepared trial in both integrity tiers", () => {
    const previousTier = hotPathIntegrityTierV1();
    const attack = (tier: HotPathIntegrityTierV1) => {
      selectHotPathIntegrityTierV1(tier);
      const provider = testProvider();
      const accepted = coldStart(provider).acceptedState;
      const preparedStep = prepareWholeHeartMechanicsStepV1(provider, {
        previousAcceptedState: accepted,
        candidateTimeSec: 0.002,
        stepDtSec: 0.002,
        drivingInputs: drive(),
      });
      const issued = evaluatePreparedWholeHeartMechanicsTrialV1(
        preparedStep,
        { LA: 70, LV: 125, RA: 65, RV: 110 },
      );
      issued.candidateMaterialState.landState[0] += 1;
      expect(() => commitPreparedWholeHeartMechanicsTrialV1(
        preparedStep,
        issued,
      )).toThrow(/candidate material state fingerprint mismatch/);
    };

    try {
      attack("full-invariant");
      attack("hot-path-lean");
    } finally {
      selectHotPathIntegrityTierV1(previousTier);
    }
  });

  it("invalidates every remaining probe when one prepared candidate commits", () => {
    const provider = testProvider();
    const accepted = coldStart(provider).acceptedState;
    const preparedStep = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: drive(),
    });
    const selected = evaluatePreparedWholeHeartMechanicsCandidateProbeV1(
      preparedStep,
      { LA: 70, LV: 125, RA: 65, RV: 110 },
    );
    const discarded = evaluatePreparedWholeHeartMechanicsCandidateProbeV1(
      preparedStep,
      { LA: 69, LV: 124, RA: 64, RV: 109 },
    );
    const trial = sealPreparedWholeHeartMechanicsCandidateProbeV1(
      preparedStep,
      selected,
    );

    expect(commitPreparedWholeHeartMechanicsTrialV1(
      preparedStep,
      trial,
    ).revision).toBe(1);
    expect(() => sealPreparedWholeHeartMechanicsCandidateProbeV1(
      preparedStep,
      discarded,
    )).toThrow(/already consumed/);
  });

  it("rejects cross-drive prepared commits even when public step fields match", () => {
    const provider = testProvider();
    const accepted = coldStart(provider).acceptedState;
    const lowDriveContext = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: drive(),
    });
    const highDriveContext = prepareWholeHeartMechanicsStepV1(provider, {
      previousAcceptedState: accepted,
      candidateTimeSec: 0.002,
      stepDtSec: 0.002,
      drivingInputs: {
        calciumUM: { LA: 0.4, LV: 0.3, RA: 0.4, RV: 0.3 },
      },
    });
    expect(lowDriveContext).toEqual(highDriveContext);

    const highDriveTrial = evaluatePreparedWholeHeartMechanicsTrialV1(
      highDriveContext,
      { LA: 70, LV: 125, RA: 65, RV: 110 },
    );
    expect(() => commitPreparedWholeHeartMechanicsTrialV1(
      lowDriveContext,
      highDriveTrial,
    )).toThrow(/not issued by this prepared step/);

    expect(commitPreparedWholeHeartMechanicsTrialV1(
      highDriveContext,
      highDriveTrial,
    ).materialState.landState[0]).toBeCloseTo(0.0028, 15);
  });

  it("preserves legacy trial commit behavior without a prepared binding", () => {
    const provider = testProvider();
    const accepted = coldStart(provider).acceptedState;
    const evaluated = trial(
      provider,
      accepted,
      { LA: 70, LV: 125, RA: 65, RV: 110 },
    );
    const reconstructed = Object.freeze({ ...evaluated });

    expect(commitWholeHeartMechanicsTrialV1(
      provider,
      accepted,
      reconstructed,
    ).revision).toBe(1);
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
    evaluationResultOwnershipMode: "exclusive-result",
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
        transmuralPressureVolumeTangentMmHgPerMl:
          testPressureVolumeTangent(),
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

function testPressureVolumeTangent() {
  return {
    LA: { LA: 0.08, LV: 0.002, RA: 0.001, RV: 0.001 },
    LV: { LA: 0.001, LV: 0.799, RA: 0, RV: 0.02 },
    RA: { LA: 0.001, LV: 0.001, RA: 0.051, RV: 0.001 },
    RV: { LA: 0, LV: 0.02, RA: 0, RV: 0.2 },
  } as const;
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
