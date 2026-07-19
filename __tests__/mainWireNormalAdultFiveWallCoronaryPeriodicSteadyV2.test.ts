import {
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const TEST_PROVIDER_BEHAVIOR = vi.hoisted(() => ({
  rejectTrials: false,
  identitySuffix: "stable",
}));

vi.mock(
  "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1",
  async (importOriginal) => {
    const actual = await importOriginal<typeof import(
      "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1"
    )>();
    return {
      ...actual,
      createCanonicalMainWireNormalAdultFiveWallProviderV1: () =>
        deterministicFiveWallProvider(
          TEST_PROVIDER_BEHAVIOR.rejectTrials,
          TEST_PROVIDER_BEHAVIOR.identitySuffix,
        ),
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
      // Short deterministic clock used only by this focused runner contract
      // test. Production resolves the untouched one-second fixed prior.
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1: Object.freeze({
        parameterSetId: "three-millisecond-periodic-runner-test-prior",
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
import {
  classifyMainWireFiveWallCoronaryPeriodicityV2,
} from "@/engine/myocardium/experiments/MainWireFiveWallCoronaryPeriodicClosureV2";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_CLAIM_V2,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2,
  runMainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2,
  type MainWireNormalAdultFiveWallCoronaryPeriodicResultV2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";

describe("canonical coronary V2 periodic runner", () => {
  let threeBeatResult:
    MainWireNormalAdultFiveWallCoronaryPeriodicResultV2;

  beforeAll(async () => {
    TEST_PROVIDER_BEHAVIOR.rejectTrials = false;
    TEST_PROVIDER_BEHAVIOR.identitySuffix = "stable";
    threeBeatResult =
      await runMainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2({
        dtSec: 0.001,
        maximumBeatCount: 3,
        retainedBoundaryCount: 4,
      });
    if (threeBeatResult.failure !== null) {
      throw new Error(threeBeatResult.failure.message);
    }
  }, 60_000);

  it("captures only exact accepted cycle boundaries and wires P1/P2 to the prior one/two boundaries", () => {
    expect(threeBeatResult.completedBeatCount).toBe(3);
    expect(threeBeatResult.attemptedStepCount).toBe(9);
    expect(threeBeatResult.committedStepCount).toBe(9);
    expect(threeBeatResult.retainedBoundaries.map((boundary) => ({
      beat: boundary.beatIndex,
      expected: boundary.expectedBoundaryTimeSec,
      accepted: boundary.acceptedState.acceptedTimeSec,
      revision: boundary.acceptedState.revision,
    }))).toEqual([
      { beat: 0, expected: 0, accepted: 0, revision: 0 },
      { beat: 1, expected: 0.003, accepted: 0.003, revision: 3 },
      { beat: 2, expected: 0.006, accepted: 0.006, revision: 6 },
      {
        beat: 3,
        expected: 0.009000000000000001,
        accepted: 0.009000000000000001,
        revision: 9,
      },
    ]);
    expect(threeBeatResult.observations[0]?.period1?.provenance)
      .toMatchObject({
        currentAcceptedTimeSec: 0.003,
        referenceAcceptedTimeSec: 0,
        elapsedTimeSec: 0.003,
      });
    expect(threeBeatResult.observations[0]?.period2).toBeNull();
    expect(threeBeatResult.observations[1]?.period1?.provenance.elapsedTimeSec)
      .toBeCloseTo(0.003, 15);
    expect(threeBeatResult.observations[1]?.period2?.provenance.elapsedTimeSec)
      .toBeCloseTo(0.006, 15);
  });

  it("SHA-256 binds the complete resolved runtime, mechanics, coronary, solver, and periodic policy capsule", async () => {
    expect(threeBeatResult.protocolIdentityHash).toMatch(/^[0-9a-f]{64}$/);
    expect(threeBeatResult.protocolIdentityHash).toBe(
      await sha256CanonicalJsonHex(threeBeatResult.protocolIdentity),
    );
    expect(threeBeatResult.protocolIdentity).toMatchObject({
      providerIdentity: {
        providerId: "deterministic-five-wall-periodic-test-provider-stable",
      },
      calciumDrive: { parameters: { cycleLengthSec: 0.003 } },
      commonPericardium: { mode: "on" },
      coronary: {
        impMechanism: "cep-shortening-induced",
        disease: expect.any(Object),
        prior: expect.any(Object),
        collapseHydraulics: expect.any(Object),
        shorteningImpPrior: expect.any(Object),
      },
      solvers: {
        circulationNewton: expect.any(Object),
        coronaryBackwardEuler: expect.any(Object),
      },
      integration: {
        dtSec: 0.001,
        cycleLengthSec: 0.003,
        exactStepsPerCycle: 3,
        maximumBeatCount: 3,
        retainedBoundaryCount: 4,
      },
      periodicity: {
        toleranceStatus: "provisional-not-release-acceptance",
      },
      exclusions: {
        rapidPresentationEvidence: true,
        waveformFitting: true,
      },
    });
  });

  it("cannot claim P1 from one or two observations and delegates the full sequence to the V2 classifier", () => {
    const classifierOptions =
      threeBeatResult.protocolIdentity.periodicity.classifier;
    for (const prefixLength of [1, 2]) {
      expect(classifyMainWireFiveWallCoronaryPeriodicityV2(
        threeBeatResult.observations.slice(0, prefixLength),
        classifierOptions,
      ).status).toBe("not-converged");
    }
    expect(threeBeatResult.classification).toEqual(
      classifyMainWireFiveWallCoronaryPeriodicityV2(
        threeBeatResult.observations,
        classifierOptions,
      ),
    );
    expect(threeBeatResult.observations.every((observation) =>
      observation.evidenceRole === "canonical-periodic-protocol"
      && observation.protocolIdentityHash
        === threeBeatResult.protocolIdentityHash)).toBe(true);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2
      .consecutiveBeats).toBe(3);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_CLAIM_V2
      .rapidPresentationLaneUsed).toBe(false);
  });

  it("fails closed on atomic rejection and reports the unchanged rollback tuple", async () => {
    TEST_PROVIDER_BEHAVIOR.rejectTrials = true;
    TEST_PROVIDER_BEHAVIOR.identitySuffix = "reject";
    const failed =
      await runMainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2({
        dtSec: 0.001,
        maximumBeatCount: 1,
      });
    TEST_PROVIDER_BEHAVIOR.rejectTrials = false;
    TEST_PROVIDER_BEHAVIOR.identitySuffix = "stable";

    expect(failed.terminationReason).toBe("step-failure");
    expect(failed.integrationCompletedWithoutFailure).toBe(false);
    expect(failed.periodicSteadyStateClaimed).toBe(false);
    expect(failed.completedBeatCount).toBe(0);
    expect(failed.attemptedStepCount).toBe(1);
    expect(failed.committedStepCount).toBe(0);
    expect(failed.terminalState).toMatchObject({
      revision: 0,
      acceptedTimeSec: 0,
    });
    expect(failed.observations).toEqual([]);
    expect(failed.classification.status).toBe("not-converged");
    expect(failed.failure).toMatchObject({
      reason: "atomic-step-rejected",
      beatIndex: 1,
      stepWithinBeat: 1,
      globalStepIndex: 1,
      candidateTimeSec: 0.001,
      rollbackPreserved: true,
      mechanicsCommitted: false,
      circulationCommitted: false,
      coronaryCommitted: false,
      mvcReferenceCommitted: false,
    });
  }, 60_000);

  it("rejects nonintegral cycle stepping and boundary retention too short for P2", async () => {
    await expect(
      runMainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2({
        dtSec: 0.002,
        maximumBeatCount: 1,
      }),
    ).rejects.toThrow(/must divide/);
    await expect(
      runMainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2({
        dtSec: 0.003,
        maximumBeatCount: 1,
        retainedBoundaryCount: 2,
      }),
    ).rejects.toThrow(/at least current, P1, and P2/);
  });
});

function deterministicFiveWallProvider(
  rejectTrials: boolean,
  identitySuffix: string,
): MainWireNormalAdultFiveWallProviderV1 {
  const codec = Object.freeze({
    clone: cloneMechanicsState,
    encode: encodeMechanicsState,
    decode: decodeMechanicsState,
  });
  const evaluate = (
    volumes: Readonly<{ LA: number; LV: number; RA: number; RV: number }>,
    drivingInputs: MainWireFiveWallFreeCalciumDriveV1,
    reject: boolean,
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
        converged: !reject,
        finite: true,
        iterationCount: 1,
        residualNorm: 0,
        errors: Object.freeze(reject ? ["intentional trial rejection"] : []),
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
    providerId:
      `deterministic-five-wall-periodic-test-provider-${identitySuffix}`,
    parameterSetId:
      `deterministic-five-wall-periodic-test-prior-${identitySuffix}`,
    parameterIdentityHash: `periodic-test-${identitySuffix}`,
    stateSchemaVersion: 1,
    stateCodec: codec,
    initializeCold: (input) => evaluate(
      input.volumesMl,
      input.drivingInputs,
      false,
    ),
    evaluateTrial: (input) => evaluate(
      input.candidateVolumesMl,
      input.drivingInputs,
      rejectTrials,
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
