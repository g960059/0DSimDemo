import { describe, expect, it } from "vitest";

import { defaultParams } from "@/engine/core/params";
import {
  checkpointMainWireFiveWallNonCoronaryStateV2,
  initializeMainWireFiveWallNonCoronaryV1,
  restoreMainWireFiveWallNonCoronaryAtFixedPeriodicCycleWithRevisionResetV2,
  restoreMainWireFiveWallNonCoronaryStateV2,
  stepMainWireFiveWallNonCoronaryV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  createExplicitFiveWallCalciumEventScheduleV1,
  createFixedSinusFiveWallCalciumEventScheduleV1,
  evaluateFiveWallCalciumOutputV1,
  listFiveWallCalciumEventsOpenClosedV1,
  splitFiveWallCalciumIntervalAtEventsV1,
} from "@/engine/myocardium/calcium/fiveWallExactEventCalciumDriveV1";
import {
  checkpointFiveWallCalciumAcceptedStateV2,
  restoreFiveWallCalciumAcceptedStateV2,
} from "@/engine/myocardium/checkpoint/fiveWallCalciumCheckpointV2";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  exactFiniteJsonFingerprintV1,
} from "@/engine/core/exactFiniteJsonCheckpointV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";

const base = defaultParams();
const PARAMS = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
const PERIODIC = createFixedSinusFiveWallCalciumEventScheduleV1(PARAMS);
const PERICARDIUM = createMainWireNormalAdultCommonPericardiumV1("exact-off");
const RUNTIME = Object.freeze({
  vascular: Object.freeze({
    venousTone: base.venousTone,
    arterialStiffness: base.arterialStiffness,
  }),
  losses: Object.freeze({
    systemicResistance: base.systemicResistance,
    pulmonaryResistance: base.pulmonaryResistance,
  }),
  respiratory: Object.freeze({
    PEEP: 0,
    Pth0: 0,
    respAmpTh: 0,
    respAmpAlv: 0,
    respRate: 0,
  }),
});

describe("main-wire five-wall atomic checkpoint V2", () => {
  it("round-trips analytic and exact-event transactions through finite JSON", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    for (const representation of [
      "analytic-periodic-control-with-exact-event-shadow",
      "exact-event-state",
    ] as const) {
      const cold = initializeMainWireFiveWallNonCoronaryV1({
        provider,
        runtime: RUNTIME,
        calciumDriveParams: PARAMS,
        calciumRepresentation: representation,
        calciumEventSchedule: PERIODIC,
        calciumInitialization: "regular-periodic-prehistory-from-fixed-prior",
        pericardium: PERICARDIUM,
      }).acceptedState;
      const checkpoint = checkpointMainWireFiveWallNonCoronaryStateV2(
        provider,
        cold,
        checkpointInput(),
      );
      const decoded = JSON.parse(JSON.stringify(checkpoint)) as unknown;
      const restored = restoreMainWireFiveWallNonCoronaryStateV2(
        provider,
        decoded,
        checkpointInput(),
      );
      expect(restored.revision).toBe(cold.revision);
      expect(restored.acceptedTimeSec).toBe(cold.acceptedTimeSec);
      expect(restored.circulation).toEqual(cold.circulation);
      expect(provider.stateCodec.encode(restored.mechanics.materialState))
        .toEqual(provider.stateCodec.encode(cold.mechanics.materialState));
      expect(restored.calcium).toEqual(cold.calcium);
      expect(Object.values(checkpoint.calcium.stateByWall).flat())
        .toHaveLength(10);
    }
  }, 60_000);

  it("counts 52 accepted exact-event subintervals for one 20 ms nominal-grid beat", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    let state = initializeMainWireFiveWallNonCoronaryV1({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: PARAMS,
      calciumRepresentation: "exact-event-state",
      calciumEventSchedule: PERIODIC,
      calciumInitialization: "regular-periodic-prehistory-from-fixed-prior",
      pericardium: PERICARDIUM,
    }).acceptedState;
    const nominalGridStepCount = 50;
    for (let nominal = 1; nominal <= nominalGridStepCount; nominal += 1) {
      const nominalEnd = nominal * 0.02;
      for (const endpoint of splitFiveWallCalciumIntervalAtEventsV1(
        state.acceptedTimeSec,
        nominalEnd,
        PERIODIC,
      )) {
        const stepped = stepMainWireFiveWallNonCoronaryV1(provider, state, {
          dtSec: endpoint - state.acceptedTimeSec,
          runtime: RUNTIME,
          calciumDriveParams: PARAMS,
          calciumEventSchedule: PERIODIC,
          pericardium: PERICARDIUM,
        });
        if (stepped.converged === false) throw new Error(stepped.message);
        state = stepped.acceptedState;
      }
    }
    expect(nominalGridStepCount).toBe(50);
    expect(state.revision).toBe(52);
    expect(state.acceptedTimeSec).toBe(1);
    const restored = restoreMainWireFiveWallNonCoronaryStateV2(
      provider,
      JSON.parse(JSON.stringify(checkpointMainWireFiveWallNonCoronaryStateV2(
        provider,
        state,
        checkpointInput(),
      ))) as unknown,
      checkpointInput(),
    );
    expect(restored.revision).toBe(52);
    expect(restored.circulation.revision).toBe(52);
    expect(restored.mechanics.revision).toBe(52);
    expect(restored.calcium.revision).toBe(52);
  }, 60_000);

  it("rejects schema 1, state tamper below 1e-12, wrong wall count, and nonfinite state", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const cold = canonicalCold(provider);
    const checkpoint = checkpointMainWireFiveWallNonCoronaryStateV2(
      provider,
      cold,
      checkpointInput(),
    );
    expect(() => restoreMainWireFiveWallNonCoronaryStateV2(
      provider,
      { ...checkpoint, schemaVersion: 1 },
      checkpointInput(),
    )).toThrow(/schema V2 is required/);
    expect(() => restoreMainWireFiveWallNonCoronaryStateV2(
      provider,
      { ...checkpoint, checkpointId: "unknown-checkpoint", schemaVersion: 99 },
      checkpointInput(),
    )).toThrow(/schema V2 is required/);

    const tinyTamper = cloneJson(checkpoint);
    tinyTamper.calcium.stateByWall.LA[0] += 1e-14;
    expect(() => restoreMainWireFiveWallNonCoronaryStateV2(
      provider,
      tinyTamper,
      checkpointInput(),
    )).toThrow(/fingerprint mismatch/);

    const missingWall = cloneJson(checkpoint);
    delete missingWall.calcium.stateByWall.RVFW;
    refingerprintNestedCalciumAndOuter(missingWall);
    expect(() => restoreMainWireFiveWallNonCoronaryStateV2(
      provider,
      missingWall,
      checkpointInput(),
    )).toThrow(/exactly five wall states/);

    const nonfinite = cloneJson(checkpoint);
    nonfinite.calcium.stateByWall.LA[0] = Number.NaN;
    expect(() => restoreMainWireFiveWallNonCoronaryStateV2(
      provider,
      nonfinite,
      checkpointInput(),
    )).toThrow(/non-finite checkpoint number/);

    const extraValveField = cloneJson(checkpoint);
    extraValveField.circulation.valveStates.MV.unowned = 1;
    refingerprintNestedCirculationAndOuter(extraValveField);
    expect(() => restoreMainWireFiveWallNonCoronaryStateV2(
      provider,
      extraValveField,
      checkpointInput(),
    )).toThrow(/unexpected checkpoint field set/);

    const extraMechanicsVolume = cloneJson(checkpoint);
    extraMechanicsVolume.mechanics.acceptedVolumesMl.unowned = 1;
    const { fingerprint: _outer, ...outerPayload } = extraMechanicsVolume;
    extraMechanicsVolume.fingerprint = exactFiniteJsonFingerprintV1(outerPayload);
    expect(() => restoreMainWireFiveWallNonCoronaryStateV2(
      provider,
      extraMechanicsVolume,
      checkpointInput(),
    )).toThrow(/unexpected checkpoint field set/);
  }, 60_000);

  it("round-trips ten asymmetric Ca scalars and authenticates every scalar", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const cold = canonicalCold(provider);
    const stateByWall = Object.freeze({
      LA: Object.freeze([0.01, 0.11] as const),
      RA: Object.freeze([0.02, 0.12] as const),
      LVFW: Object.freeze([0.03, 0.13] as const),
      SEP: Object.freeze([0.04, 0.14] as const),
      RVFW: Object.freeze([0.05, 0.15] as const),
    });
    const asymmetric = Object.freeze({
      ...cold,
      calcium: Object.freeze({ ...cold.calcium, stateByWall }),
    });
    const checkpoint = checkpointMainWireFiveWallNonCoronaryStateV2(
      provider,
      asymmetric,
      checkpointInput(),
    );
    expect(restoreMainWireFiveWallNonCoronaryStateV2(
      provider,
      JSON.parse(JSON.stringify(checkpoint)) as unknown,
      checkpointInput(),
    ).calcium.stateByWall).toEqual(stateByWall);
    for (const wall of ["LA", "RA", "LVFW", "SEP", "RVFW"] as const) {
      for (const stateIndex of [0, 1] as const) {
        const tampered = cloneJson(checkpoint);
        tampered.calcium.stateByWall[wall][stateIndex] += 1e-14;
        const { fingerprint: _outer, ...outerPayload } = tampered;
        tampered.fingerprint = exactFiniteJsonFingerprintV1(outerPayload);
        expect(() => restoreMainWireFiveWallNonCoronaryStateV2(
          provider,
          tampered,
          checkpointInput(),
        )).toThrow(/calcium checkpoint fingerprint mismatch/);
      }
    }
  }, 60_000);

  it("rejects parameter, schedule, runtime, and pericardium identity mismatch without mutation", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const cold = canonicalCold(provider);
    const checkpoint = checkpointMainWireFiveWallNonCoronaryStateV2(
      provider,
      cold,
      checkpointInput(),
    );
    const beforeCheckpoint = JSON.stringify(checkpoint);
    const beforeState = JSON.stringify({
      circulation: cold.circulation,
      mechanics: provider.stateCodec.encode(cold.mechanics.materialState),
      calcium: cold.calcium,
    });
    const changedParams = Object.freeze({
      ...PARAMS,
      atrial: Object.freeze({
        ...PARAMS.atrial,
        peakAmplitudeUM: PARAMS.atrial.peakAmplitudeUM + 0.01,
      }),
    });
    expect(() => restoreMainWireFiveWallNonCoronaryStateV2(
      provider,
      checkpoint,
      { ...checkpointInput(), calciumDriveParams: changedParams },
    )).toThrow(/identity mismatch/);
    const tinyChangedParams = Object.freeze({
      ...PARAMS,
      atrial: Object.freeze({
        ...PARAMS.atrial,
        peakAmplitudeUM: PARAMS.atrial.peakAmplitudeUM + 1e-14,
      }),
    });
    expect(() => restoreMainWireFiveWallNonCoronaryStateV2(
      provider,
      checkpoint,
      { ...checkpointInput(), calciumDriveParams: tinyChangedParams },
    )).toThrow(/identity mismatch/);
    const explicit = createExplicitFiveWallCalciumEventScheduleV1(
      "different-absolute-schedule",
      [{ timeSec: 0.1, strengthByWall: { LA: 1 } }],
    );
    expect(() => restoreMainWireFiveWallNonCoronaryStateV2(
      provider,
      checkpoint,
      { ...checkpointInput(), calciumEventSchedule: explicit },
    )).toThrow(/identity mismatch/);
    expect(() => restoreMainWireFiveWallNonCoronaryStateV2(
      provider,
      checkpoint,
      {
        ...checkpointInput(),
        runtime: Object.freeze({
          ...RUNTIME,
          losses: Object.freeze({
            ...RUNTIME.losses,
            systemicResistance: RUNTIME.losses.systemicResistance + 0.01,
          }),
        }),
      },
    )).toThrow(/protocol binding differs/);
    expect(() => restoreMainWireFiveWallNonCoronaryStateV2(
      provider,
      checkpoint,
      {
        ...checkpointInput(),
        pericardium: createMainWireNormalAdultCommonPericardiumV1(
          "on",
          "effusion-300ml-positive-control",
        ),
      },
    )).toThrow(/protocol binding differs/);
    expect(JSON.stringify(checkpoint)).toBe(beforeCheckpoint);
    expect(JSON.stringify({
      circulation: cold.circulation,
      mechanics: provider.stateCodec.encode(cold.mechanics.materialState),
      calcium: cold.calcium,
    })).toBe(beforeState);
  }, 60_000);

  it("translates only a fixed-periodic phase boundary and preserves next behavior", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const source = canonicalCold(provider);
    const checkpoint = checkpointMainWireFiveWallNonCoronaryStateV2(
      provider,
      source,
      checkpointInput(),
    );
    const translated =
      restoreMainWireFiveWallNonCoronaryAtFixedPeriodicCycleWithRevisionResetV2(
        provider,
        checkpoint,
        { ...checkpointInput(), targetAcceptedTimeSec: 1 },
      );
    expect(translated.revision).toBe(0);
    expect(translated.acceptedTimeSec).toBe(1);
    expect(translated.circulation.nodeVolumesMl)
      .toEqual(source.circulation.nodeVolumesMl);
    expect(provider.stateCodec.encode(translated.mechanics.materialState))
      .toEqual(provider.stateCodec.encode(source.mechanics.materialState));
    expect(evaluateFiveWallCalciumOutputV1(translated.calcium, PARAMS))
      .toEqual(evaluateFiveWallCalciumOutputV1(source.calcium, PARAMS));

    const sourceStep = stepMainWireFiveWallNonCoronaryV1(provider, source, {
      dtSec: 0.002,
      ...checkpointInput(),
    });
    const translatedStep = stepMainWireFiveWallNonCoronaryV1(
      provider,
      translated,
      { dtSec: 0.002, ...checkpointInput() },
    );
    if (sourceStep.converged === false) throw new Error(sourceStep.message);
    if (translatedStep.converged === false) throw new Error(translatedStep.message);
    expect(translatedStep.calciumDrive.freeCalciumUMByWall)
      .toEqual(sourceStep.calciumDrive.freeCalciumUMByWall);
    for (const node of Object.keys(sourceStep.acceptedState.circulation.nodeVolumesMl)) {
      expect(translatedStep.acceptedState.circulation.nodeVolumesMl[
        node as keyof typeof sourceStep.acceptedState.circulation.nodeVolumesMl
      ]).toBeCloseTo(
        sourceStep.acceptedState.circulation.nodeVolumesMl[
          node as keyof typeof sourceStep.acceptedState.circulation.nodeVolumesMl
        ],
        12,
      );
    }
  }, 60_000);

  it("allows exact explicit-schedule resume but rejects explicit translation", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const explicit = createExplicitFiveWallCalciumEventScheduleV1(
      "absolute-pac-test",
      [{ timeSec: 0.2, strengthByWall: { LA: 1, RA: 1 } }],
    );
    const state = initializeMainWireFiveWallNonCoronaryV1({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: PARAMS,
      calciumRepresentation: "exact-event-state",
      calciumEventSchedule: explicit,
      calciumInitialization: "event-free-rest",
      pericardium: PERICARDIUM,
    }).acceptedState;
    const input = { ...checkpointInput(), calciumEventSchedule: explicit };
    const checkpoint = checkpointMainWireFiveWallNonCoronaryStateV2(
      provider,
      state,
      input,
    );
    expect(restoreMainWireFiveWallNonCoronaryStateV2(
      provider,
      checkpoint,
      input,
    ).acceptedTimeSec).toBe(0);
    expect(() =>
      restoreMainWireFiveWallNonCoronaryAtFixedPeriodicCycleWithRevisionResetV2(
        provider,
        checkpoint,
        { ...input, targetAcceptedTimeSec: 1 },
      )).toThrow(/fixed-periodic schedule/);
  }, 60_000);

  it("owns an event exactly once when the fixed event lies on the translated boundary", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const boundaryParams = Object.freeze({
      ...PARAMS,
      parameterSetId: `${PARAMS.parameterSetId}-ventricular-boundary-test`,
      ventricular: Object.freeze({
        ...PARAMS.ventricular,
        electricalToCalciumDelaySec: 0,
      }),
    });
    const boundarySchedule = createFixedSinusFiveWallCalciumEventScheduleV1(
      boundaryParams,
    );
    expect(listFiveWallCalciumEventsOpenClosedV1(
      boundarySchedule,
      0.98,
      1,
    ).filter((event) => event.strengthByWall.LVFW !== undefined))
      .toHaveLength(1);
    expect(listFiveWallCalciumEventsOpenClosedV1(
      boundarySchedule,
      1,
      1.02,
    ).filter((event) => event.strengthByWall.LVFW !== undefined))
      .toHaveLength(0);
    const input = Object.freeze({
      runtime: RUNTIME,
      calciumDriveParams: boundaryParams,
      calciumEventSchedule: boundarySchedule,
      pericardium: PERICARDIUM,
    });
    const source = initializeMainWireFiveWallNonCoronaryV1({
      provider,
      ...input,
      calciumRepresentation: "exact-event-state",
      calciumInitialization: "regular-periodic-prehistory-from-fixed-prior",
    }).acceptedState;
    const checkpoint = checkpointMainWireFiveWallNonCoronaryStateV2(
      provider,
      source,
      input,
    );
    const translated =
      restoreMainWireFiveWallNonCoronaryAtFixedPeriodicCycleWithRevisionResetV2(
        provider,
        checkpoint,
        { ...input, targetAcceptedTimeSec: 1 },
      );
    const sourceStep = stepMainWireFiveWallNonCoronaryV1(
      provider,
      source,
      { ...input, dtSec: 0.002 },
    );
    const translatedStep = stepMainWireFiveWallNonCoronaryV1(
      provider,
      translated,
      { ...input, dtSec: 0.002 },
    );
    if (sourceStep.converged === false) throw new Error(sourceStep.message);
    if (translatedStep.converged === false) throw new Error(translatedStep.message);
    for (const wall of ["LA", "RA", "LVFW", "SEP", "RVFW"] as const) {
      for (const stateIndex of [0, 1] as const) {
        expect(translatedStep.acceptedState.calcium.stateByWall[wall][stateIndex])
          .toBeCloseTo(
            sourceStep.acceptedState.calcium.stateByWall[wall][stateIndex],
            14,
          );
      }
      expect(translatedStep.calciumDrive.freeCalciumUMByWall[wall])
        .toBeCloseTo(sourceStep.calciumDrive.freeCalciumUMByWall[wall], 14);
    }
  }, 60_000);

  it("rejects non-boundary and time-varying-respiration cycle translation", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const state = canonicalCold(provider);
    const checkpoint = checkpointMainWireFiveWallNonCoronaryStateV2(
      provider,
      state,
      checkpointInput(),
    );
    expect(() =>
      restoreMainWireFiveWallNonCoronaryAtFixedPeriodicCycleWithRevisionResetV2(
        provider,
        checkpoint,
        { ...checkpointInput(), targetAcceptedTimeSec: 1.5 },
      )).toThrow(/integer-period shift|phase boundaries/);
    const respiratoryRuntime = Object.freeze({
      ...RUNTIME,
      respiratory: Object.freeze({
        ...RUNTIME.respiratory,
        respAmpTh: 1,
      }),
    });
    const respiratoryState = initializeMainWireFiveWallNonCoronaryV1({
      provider,
      runtime: respiratoryRuntime,
      calciumDriveParams: PARAMS,
      calciumRepresentation: "exact-event-state",
      calciumEventSchedule: PERIODIC,
      calciumInitialization: "regular-periodic-prehistory-from-fixed-prior",
      pericardium: PERICARDIUM,
    }).acceptedState;
    const respiratoryInput = {
      ...checkpointInput(),
      runtime: respiratoryRuntime,
    };
    const respiratoryCheckpoint = checkpointMainWireFiveWallNonCoronaryStateV2(
      provider,
      respiratoryState,
      respiratoryInput,
    );
    expect(() =>
      restoreMainWireFiveWallNonCoronaryAtFixedPeriodicCycleWithRevisionResetV2(
        provider,
        respiratoryCheckpoint,
        { ...respiratoryInput, targetAcceptedTimeSec: 1 },
      )).toThrow(/time-invariant respiration/);
  }, 60_000);

  it("rejects a structurally identical provider wrapper for cycle translation", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const state = canonicalCold(provider);
    const checkpoint = checkpointMainWireFiveWallNonCoronaryStateV2(
      provider,
      state,
      checkpointInput(),
    );
    const wrappedProvider = Object.freeze({
      ...provider,
      evaluateTrial: (
        input: Parameters<typeof provider.evaluateTrial>[0],
      ) => provider.evaluateTrial(Object.freeze({
        ...input,
        candidateTimeSec: input.candidateTimeSec + 1,
      })),
    });
    expect(() =>
      restoreMainWireFiveWallNonCoronaryAtFixedPeriodicCycleWithRevisionResetV2(
        wrappedProvider,
        checkpoint,
        { ...checkpointInput(), targetAcceptedTimeSec: 1 },
      )).toThrow(/factory-issued canonical autonomous/);
  }, 60_000);

  it("rejects calcium schema 1 directly", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const state = canonicalCold(provider).calcium;
    const checkpoint = checkpointFiveWallCalciumAcceptedStateV2(
      state,
      PARAMS,
      PERIODIC,
    );
    expect(() => restoreFiveWallCalciumAcceptedStateV2(
      { ...checkpoint, schemaVersion: 1 },
      PARAMS,
      PERIODIC,
    )).toThrow(/schema V2 is required/);
  });
});

function canonicalCold(
  provider: ReturnType<typeof createCanonicalMainWireNormalAdultFiveWallProviderV1>,
) {
  return initializeMainWireFiveWallNonCoronaryV1({
    provider,
    runtime: RUNTIME,
    calciumDriveParams: PARAMS,
    calciumRepresentation: "exact-event-state",
    calciumEventSchedule: PERIODIC,
    calciumInitialization: "regular-periodic-prehistory-from-fixed-prior",
    pericardium: PERICARDIUM,
  }).acceptedState;
}

function checkpointInput() {
  return Object.freeze({
    runtime: RUNTIME,
    calciumDriveParams: PARAMS,
    calciumEventSchedule: PERIODIC,
    pericardium: PERICARDIUM,
  });
}

function cloneJson(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

function refingerprintNestedCalciumAndOuter(checkpoint: any): void {
  const { fingerprint: _calciumFingerprint, ...calciumPayload } =
    checkpoint.calcium;
  checkpoint.calcium.fingerprint = exactFiniteJsonFingerprintV1(calciumPayload);
  const { fingerprint: _outerFingerprint, ...outerPayload } = checkpoint;
  checkpoint.fingerprint = exactFiniteJsonFingerprintV1(outerPayload);
}

function refingerprintNestedCirculationAndOuter(checkpoint: any): void {
  const { fingerprint: _circulationFingerprint, ...circulationPayload } =
    checkpoint.circulation;
  checkpoint.circulation.fingerprint =
    exactFiniteJsonFingerprintV1(circulationPayload);
  const { fingerprint: _outerFingerprint, ...outerPayload } = checkpoint;
  checkpoint.fingerprint = exactFiniteJsonFingerprintV1(outerPayload);
}
