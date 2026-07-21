import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock(
  "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1",
  async (importOriginal) => {
    const actual = await importOriginal<typeof import(
      "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1"
    )>();
    return {
      ...actual,
      createCanonicalMainWireNormalAdultFiveWallProviderV1: () =>
        deterministicFiveWallProvider(),
    };
  },
);

vi.mock(
  "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1",
  async (importOriginal) => {
    const actual = await importOriginal<typeof import(
      "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1"
    )>();
    return {
      ...actual,
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1: Object.freeze({
        parameterSetId: "three-millisecond-v3-periodic-runner-test-prior",
        cycleLengthSec: 0.003,
        atrioventricularDelaySec: 0.001,
        atrial: Object.freeze({
          diastolicCalciumUM: 0.1,
          peakAmplitudeUM: 0.5,
          riseTimeConstantSec: 0.0001,
          decayTimeConstantSec: 0.001,
          electricalToCalciumDelaySec: 0.0001,
        }),
        ventricular: Object.freeze({
          diastolicCalciumUM: 0.11,
          peakAmplitudeUM: 0.89,
          riseTimeConstantSec: 0.0002,
          decayTimeConstantSec: 0.001,
          electricalToCalciumDelaySec: 0.0001,
        }),
      }),
    };
  },
);

import {
  MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
  type MainWireFiveWallFreeCalciumDriveV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
  type MainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import type {
  LandSlsWallMaterialStateV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
  type WholeHeartMechanicsSerializableValueV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_CLAIM_V3,
  runMainWireNormalAdultFiveWallCoronaryPeriodicSteadyV3,
  type MainWireNormalAdultFiveWallCoronaryPeriodicResultV3,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCoronaryPeriodicSteadyV3";
import { sha256CanonicalJsonHex } from "@/engine/scientific/release";

describe("canonical coronary V3 accepted-autoregulation periodic runner", () => {
  let first: MainWireNormalAdultFiveWallCoronaryPeriodicResultV3;
  let replay: MainWireNormalAdultFiveWallCoronaryPeriodicResultV3;

  beforeAll(async () => {
    first = await runMainWireNormalAdultFiveWallCoronaryPeriodicSteadyV3({
      dtSec: 0.001,
      maximumBeatCount: 2,
      retainedBoundaryCount: 3,
      executionPurpose: "bounded-smoke",
    });
    replay = await runMainWireNormalAdultFiveWallCoronaryPeriodicSteadyV3({
      dtSec: 0.001,
      maximumBeatCount: 2,
      retainedBoundaryCount: 3,
      executionPurpose: "bounded-smoke",
    });
    if (first.failure !== null || replay.failure !== null) {
      throw new Error(first.failure?.message ?? replay.failure?.message);
    }
  }, 60_000);

  it("deterministically replays the accepted state, profile hash, protocol hash, and V3 closure sequence", () => {
    expect(first.profileIdentityHash).toBe(replay.profileIdentityHash);
    expect(first.protocolIdentityHash).toBe(replay.protocolIdentityHash);
    expect(JSON.stringify(first.terminalState))
      .toBe(JSON.stringify(replay.terminalState));
    expect(first.observations).toEqual(replay.observations);
    expect(first.completedBeatCount).toBe(2);
    expect(first.attemptedStepCount).toBe(6);
    expect(first.committedStepCount).toBe(6);
    expect(first.completedAutoregulationWindowCount).toBe(2);
    expect(first.classification.status).toBe("not-converged");
    expect(first.periodicSteadyStateClaimed).toBe(false);
  });

  it("captures empty accepted autoregulation windows and uses the 106-owner V3 P1 closure", () => {
    expect(first.retainedBoundaries.map((boundary) => ({
      beatIndex: boundary.beatIndex,
      timeSec: boundary.acceptedState.acceptedTimeSec,
      revision: boundary.acceptedState.revision,
      windowIndex: boundary.acceptedState.coronaryAutoregulation.windowIndex,
      windowStartRevision:
        boundary.acceptedState.coronaryAutoregulation.windowStartRevision,
      durationSec:
        boundary.acceptedState.coronaryAutoregulation.acceptedDurationSec,
      stepCount:
        boundary.acceptedState.coronaryAutoregulation.acceptedStepCount,
      control: boundary.acceptedState.coronaryAutoregulation.windowControl,
    }))).toEqual([
      {
        beatIndex: 0,
        timeSec: 0,
        revision: 0,
        windowIndex: 0,
        windowStartRevision: 0,
        durationSec: 0,
        stepCount: 0,
        control: null,
      },
      {
        beatIndex: 1,
        timeSec: 0.003,
        revision: 3,
        windowIndex: 1,
        windowStartRevision: 3,
        durationSec: 0,
        stepCount: 0,
        control: null,
      },
      {
        beatIndex: 2,
        timeSec: 0.006,
        revision: 6,
        windowIndex: 2,
        windowStartRevision: 6,
        durationSec: 0,
        stepCount: 0,
        control: null,
      },
    ]);
    for (const observation of first.observations) {
      expect(observation.period1).toMatchObject({
        overall: {
          numericEntryCount: 104,
          booleanEntryCount: 2,
          entryCount: 106,
        },
        provenance: {
          autoregulationWindowIndexAdvance: 1,
          autoregulationWindowStartRevisionAdvance: 3,
        },
        groups: {
          "coronary-autoregulation-window": {
            maximumNormalizedDelta: 0,
          },
        },
      });
    }
  });

  it("SHA-256 binds the profile separately from the run protocol and labels construction seeds as construction-only", async () => {
    expect(first.profileIdentityHash).toBe(
      await sha256CanonicalJsonHex(first.protocolIdentity.profileIdentity),
    );
    expect(first.protocolIdentityHash).toBe(
      await sha256CanonicalJsonHex(first.protocolIdentity),
    );
    expect(first.protocolIdentity.profileIdentity.autoregulation).toMatchObject({
      bindingId: "accepted-physical-time-coronary-autoregulation-v1",
      law: "integral-flow-homeostasis-v2",
      quadrature: "backward-euler-right-endpoint",
      flowObservable: "final-candidate-layer-qm-internal-flow-ml-per-sec",
      perfusionPressureObservable:
        "final-candidate-post-focal-lesion-pressure-minus-common-cv-pressure",
      prior: expect.any(Object),
      defaultControl: expect.any(Object),
    });
    expect(first.initializationProvenance).toMatchObject({
      kind: "canonical-cold-start",
      constructionSeedHydraulicStateHash: null,
      independentValidationEligible: true,
      fullAcceptedStateWarmStart: false,
      coronaryHydraulicConstructionSeed: false,
      inheritedPeriodicEvidence: false,
      restingFlowTargetUsedAsValidation: false,
    });
    expect(first.initializationProvenance.initialAcceptedStateHash)
      .toMatch(/^[0-9a-f]{64}$/);

    const initialCoronary = first.retainedBoundaries[0]!.acceptedState.coronary;
    const seeded =
      await runMainWireNormalAdultFiveWallCoronaryPeriodicSteadyV3({
        dtSec: 0.001,
        maximumBeatCount: 2,
        executionPurpose: "bounded-smoke",
        initialization: Object.freeze({
          kind: "construction-seed" as const,
          seedId: "test-pressure-ladder-seed-v1",
          sourceArtifactId: "focused-runner-contract-test",
          coronaryHydraulicState: initialCoronary,
        }),
      });
    expect(seeded.failure).toBeNull();
    expect(seeded.profileIdentityHash).toBe(first.profileIdentityHash);
    expect(seeded.protocolIdentity.integration)
      .toEqual(first.protocolIdentity.integration);
    expect(seeded.initializationProvenance.initialAcceptedStateHash)
      .toBe(first.initializationProvenance.initialAcceptedStateHash);
    expect(seeded.protocolIdentityHash).not.toBe(first.protocolIdentityHash);
    expect(seeded.initializationProvenance).toMatchObject({
      kind: "construction-seed",
      seedId: "test-pressure-ladder-seed-v1",
      sourceArtifactId: "focused-runner-contract-test",
      evidenceClassification:
        "coronary-hydraulic-construction-seed-only-not-independent-validation",
      independentValidationEligible: false,
      fullAcceptedStateWarmStart: false,
      coronaryHydraulicConstructionSeed: true,
      inheritedPeriodicEvidence: false,
      restingFlowTargetUsedAsValidation: false,
    });
    if (seeded.initializationProvenance.kind !== "construction-seed") return;
    expect(seeded.initializationProvenance.constructionSeedHydraulicStateHash)
      .toMatch(/^[0-9a-f]{64}$/);
    expect(seeded.independentValidationClaimed).toBe(false);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_CLAIM_V3)
      .toMatchObject({
        constructionSeedIsIndependentValidation: false,
        constructionSeedInheritsPeriodicEvidence: false,
        restingFlowConstructionTargetCountedAsValidation: false,
        independentValidationClaimed: false,
        autoregulationWindowAdvancedInsideAcceptedTransaction: true,
      });
  }, 60_000);

  it("fails closed when bounded smoke exceeds beat/step caps or misses an exact cycle divisor", async () => {
    await expect(
      runMainWireNormalAdultFiveWallCoronaryPeriodicSteadyV3({
        dtSec: 0.001,
        maximumBeatCount: 3,
        executionPurpose: "bounded-smoke",
      }),
    ).rejects.toThrow(/maximumBeatCount exceeds/);
    await expect(
      runMainWireNormalAdultFiveWallCoronaryPeriodicSteadyV3({
        dtSec: 0.000001,
        maximumBeatCount: 1,
        executionPurpose: "bounded-smoke",
      }),
    ).rejects.toThrow(/step count exceeds/);
    await expect(
      runMainWireNormalAdultFiveWallCoronaryPeriodicSteadyV3({
        dtSec: 0.002,
        maximumBeatCount: 1,
        executionPurpose: "bounded-smoke",
      }),
    ).rejects.toThrow(/must divide/);
  });
});

function deterministicFiveWallProvider(): MainWireNormalAdultFiveWallProviderV1 {
  const codec = Object.freeze({
    clone: cloneMechanicsState,
    encode: encodeMechanicsState,
    decode: decodeMechanicsState,
  });
  const evaluate = (
    volumes: Readonly<{ LA: number; LV: number; RA: number; RV: number }>,
    drivingInputs: MainWireFiveWallFreeCalciumDriveV1,
  ) => {
    const wallReadback = (landActiveKirchhoffStressPa: number) =>
      Object.freeze({
        adapterId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
        landActiveKirchhoffStressPa,
      });
    return Object.freeze({
      materialState: mechanicsState(drivingInputs),
      transmuralPressuresMmHg: Object.freeze({
        LA: 10 + 0.08 * (volumes.LA - 45),
        LV: 105 + 0.10 * (volumes.LV - 130),
        RA: 5 + 0.06 * (volumes.RA - 55),
        RV: 25 + 0.08 * (volumes.RV - 140),
      }),
      transmuralPressureVolumeTangentMmHgPerMl: Object.freeze({
        LA: Object.freeze({ LA: 0.08, LV: 0, RA: 0, RV: 0 }),
        LV: Object.freeze({ LA: 0, LV: 0.10, RA: 0, RV: 0 }),
        RA: Object.freeze({ LA: 0, LV: 0, RA: 0.06, RV: 0 }),
        RV: Object.freeze({ LA: 0, LV: 0, RA: 0, RV: 0.08 }),
      }),
      diagnostics: Object.freeze({
        converged: true,
        finite: true,
        iterationCount: 1,
        residualNorm: 0,
        errors: Object.freeze([]),
        warnings: Object.freeze([]),
        readback: Object.freeze({
          providerModelId: MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
          effectiveFiberLogStrainByWall: Object.freeze({
            LA: -0.02,
            LVFW: -0.12,
            SEP: -0.09,
            RVFW: -0.07,
            RA: -0.01,
          }),
          wallMaterialReadbackByWall: Object.freeze({
            LA: null,
            LVFW: wallReadback(120_000),
            SEP: wallReadback(95_000),
            RVFW: wallReadback(45_000),
            RA: null,
          }),
        }),
      }),
    });
  };
  return Object.freeze({
    contractId: WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
    providerId: "deterministic-five-wall-periodic-v3-test-provider",
    parameterSetId: "deterministic-five-wall-periodic-v3-test-prior",
    parameterIdentityHash: "periodic-v3-test",
    stateSchemaVersion: 1,
    stateCodec: codec,
    initializeCold: (input) => evaluate(
      input.volumesMl,
      input.drivingInputs,
    ),
    evaluateTrial: (input) => evaluate(
      input.candidateVolumesMl,
      input.drivingInputs,
    ),
  });
}

function mechanicsState(
  drive: MainWireFiveWallFreeCalciumDriveV1,
): MainWireNormalAdultFiveWallMechanicsStateV1 {
  return Object.freeze({
    wallStateByWall: Object.freeze({
      LA: wallState(drive.freeCalciumUMByWall.LA),
      LVFW: wallState(drive.freeCalciumUMByWall.LVFW),
      SEP: wallState(drive.freeCalciumUMByWall.SEP),
      RVFW: wallState(drive.freeCalciumUMByWall.RVFW),
      RA: wallState(drive.freeCalciumUMByWall.RA),
    }),
    trisegCoordinates: Object.freeze({
      septalMidwallCapVolumeM3: 42e-6,
      junctionRadiusM: 0.033,
    }),
  });
}

function wallState(freeCalciumUM: number): LandSlsWallMaterialStateV1 {
  return Object.freeze({
    landState: Float64Array.from([0.18, 0.22, 0.04, 0.02, 0, 0]),
    slsState: Object.freeze({ viscousLogStrain: 0.01 }),
    previousFiberLogStrain: 0.01,
    previousFreeCalciumUM: freeCalciumUM,
  });
}

function cloneMechanicsState(
  state: MainWireNormalAdultFiveWallMechanicsStateV1,
): MainWireNormalAdultFiveWallMechanicsStateV1 {
  const cloneWall = (
    source: LandSlsWallMaterialStateV1,
  ): LandSlsWallMaterialStateV1 => Object.freeze({
    landState: Float64Array.from(source.landState),
    slsState: Object.freeze({ ...source.slsState }),
    previousFiberLogStrain: source.previousFiberLogStrain,
    previousFreeCalciumUM: source.previousFreeCalciumUM,
  });
  return Object.freeze({
    wallStateByWall: Object.freeze({
      LA: cloneWall(state.wallStateByWall.LA),
      LVFW: cloneWall(state.wallStateByWall.LVFW),
      SEP: cloneWall(state.wallStateByWall.SEP),
      RVFW: cloneWall(state.wallStateByWall.RVFW),
      RA: cloneWall(state.wallStateByWall.RA),
    }),
    trisegCoordinates: Object.freeze({ ...state.trisegCoordinates }),
  });
}

function encodeMechanicsState(
  state: MainWireNormalAdultFiveWallMechanicsStateV1,
): WholeHeartMechanicsSerializableValueV1 {
  const encodeWall = (source: LandSlsWallMaterialStateV1) => Object.freeze({
    landState: Object.freeze(Array.from(source.landState)),
    slsState: Object.freeze({
      viscousLogStrain: source.slsState.viscousLogStrain,
    }),
    previousFiberLogStrain: source.previousFiberLogStrain,
    previousFreeCalciumUM: source.previousFreeCalciumUM,
  });
  return Object.freeze({
    wallStateByWall: Object.freeze({
      LA: encodeWall(state.wallStateByWall.LA),
      LVFW: encodeWall(state.wallStateByWall.LVFW),
      SEP: encodeWall(state.wallStateByWall.SEP),
      RVFW: encodeWall(state.wallStateByWall.RVFW),
      RA: encodeWall(state.wallStateByWall.RA),
    }),
    trisegCoordinates: Object.freeze({ ...state.trisegCoordinates }),
  });
}

function decodeMechanicsState(
  encoded: WholeHeartMechanicsSerializableValueV1,
): MainWireNormalAdultFiveWallMechanicsStateV1 {
  const root = encoded as {
    wallStateByWall: Record<string, {
      landState: readonly number[];
      slsState: { viscousLogStrain: number };
      previousFiberLogStrain: number;
      previousFreeCalciumUM: number;
    }>;
    trisegCoordinates: {
      septalMidwallCapVolumeM3: number;
      junctionRadiusM: number;
    };
  };
  const decodeWall = (wallId: "LA" | "LVFW" | "SEP" | "RVFW" | "RA") => {
    const source = root.wallStateByWall[wallId]!;
    return Object.freeze({
      landState: Float64Array.from(source.landState),
      slsState: Object.freeze({ ...source.slsState }),
      previousFiberLogStrain: source.previousFiberLogStrain,
      previousFreeCalciumUM: source.previousFreeCalciumUM,
    });
  };
  return Object.freeze({
    wallStateByWall: Object.freeze({
      LA: decodeWall("LA"),
      LVFW: decodeWall("LVFW"),
      SEP: decodeWall("SEP"),
      RVFW: decodeWall("RVFW"),
      RA: decodeWall("RA"),
    }),
    trisegCoordinates: Object.freeze({ ...root.trisegCoordinates }),
  });
}
