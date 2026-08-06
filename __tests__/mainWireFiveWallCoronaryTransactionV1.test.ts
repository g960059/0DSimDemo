import { describe, expect, it } from "vitest";

import { defaultParams } from "@/engine/core/params";
import {
  NORMAL_CORONARY_DISEASE_INPUT_V1,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV1";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_CLAIM_V1,
  initializeMainWireFiveWallCoronaryV1,
  stepMainWireFiveWallCoronaryV1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
  type MainWireFiveWallFreeCalciumDriveV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  resolveMainWireNormalAdultBloodVolumeProtocolTargetV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import {
  MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import {
  WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
  type WholeHeartMechanicsProviderV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

type TestState = Readonly<{ timeSec: number; volumeSumMl: number }>;

const base = defaultParams();
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
    Pth0: -3,
    respAmpTh: 0,
    respAmpAlv: 0,
    respRate: 0,
  }),
  valveResearchInput: MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
});

describe("main-wire five-wall + coronary atomic transaction V1", () => {
  it("advances one globally conservative, synchronized same-candidate step", () => {
    const provider = testLandReadbackProvider(false);
    const cold = initializeMainWireFiveWallCoronaryV1({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const initialCoronaryVolume = coronaryVolumeMl(cold.acceptedState.coronary);
    const expectedNonCoronary =
      resolveMainWireNormalAdultBloodVolumeProtocolTargetV1(
        RUNTIME,
        5600 - initialCoronaryVolume,
      );
    expect(cold.acceptedState.fixedGlobalTotalBloodVolumeMl).toBe(5600);
    expect(cold.acceptedState.circulation.totalBloodVolumeMl)
      .toBeCloseTo(5600 - initialCoronaryVolume, 10);
    expect(cold.acceptedState.circulation.nodeVolumesMl)
      .toEqual(expectedNonCoronary.nodeVolumesMl);
    expect(
      cold.acceptedState.circulation.totalBloodVolumeMl
        + initialCoronaryVolume,
    ).toBeCloseTo(cold.acceptedState.fixedGlobalTotalBloodVolumeMl, 10);

    const stepped = stepMainWireFiveWallCoronaryV1(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: PERICARDIUM,
      },
    );

    expect(stepped.converged).toBe(true);
    if (stepped.converged === false) throw new Error(stepped.message);
    const next = stepped.acceptedState;
    expect(next.revision).toBe(1);
    expect(next.circulation.revision).toBe(1);
    expect(next.coronary.revision).toBe(1);
    expect(next.mechanics.revision).toBe(1);
    expect(next.acceptedTimeSec).toBeCloseTo(0.001, 14);
    expect(next.circulation.acceptedTimeSec).toBe(next.acceptedTimeSec);
    expect(next.coronary.acceptedTimeSec).toBe(next.acceptedTimeSec);
    expect(next.mechanics.acceptedTimeSec).toBe(next.acceptedTimeSec);

    const nextCoronaryVolume = coronaryVolumeMl(next.coronary);
    expect(next.circulation.totalBloodVolumeMl + nextCoronaryVolume)
      .toBeCloseTo(next.fixedGlobalTotalBloodVolumeMl, 9);
    expect(stepped.circulationTrial.diagnostics.totalBloodVolumeErrorMl)
      .toBeCloseTo(0, 9);
    expect(stepped.coronaryTrial.diagnostics.exactBloodVolumeLedgerResidualMl)
      .toBeCloseTo(0, 9);
    expect(
      next.circulation.totalBloodVolumeMl
        - cold.acceptedState.circulation.totalBloodVolumeMl,
    ).toBeCloseTo(-(nextCoronaryVolume - initialCoronaryVolume), 9);

    const companion = stepped.circulationTrial.conservativeCompanion;
    expect(companion).toBeDefined();
    expect(companion?.outerBoundaryNetVolumeRateMlPerSec.Ao).toBeCloseTo(
      -stepped.coronaryTrial.diagnostics.hydraulics.totalInletFlowMlPerSec,
      12,
    );
    expect(companion?.outerBoundaryNetVolumeRateMlPerSec.RA).toBeCloseTo(
      stepped.coronaryTrial.diagnostics.hydraulics
        .coronarySinusOutletFlowMlPerSec,
      12,
    );
    expect(stepped.coronaryTrial.baseAcceptedRevision)
      .toBe(cold.acceptedState.coronary.revision);
    expect(stepped.coronaryTrial.baseAcceptedTimeSec)
      .toBe(cold.acceptedState.coronary.acceptedTimeSec);

    const ladImp = stepped.intramyocardialPressureMmHgByTerritoryLayer.LAD;
    expect(ladImp.subendocardial).toBeGreaterThan(ladImp.subepicardial);
    expect(stepped.coronaryMechanicsCoupling.source.activeStress)
      .toBe("same-candidate-land-active-kirchhoff-stress-only");
    // This deliberately systolic test drive produces a short signed inlet
    // reversal rather than being rectified by the coronary transaction.
    expect(stepped.coronaryTrial.diagnostics.hydraulics.totalInletFlowMlPerSec)
      .toBeLessThan(0);
    expect(MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_CLAIM_V1
      .companionNewtonSemantics)
      .toBe(
        "every-probe-restarts-from-the-same-previous-accepted-coronary-state",
      );
    expect(MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_CLAIM_V1
      .mechanicsProbeContext).toBe(
        "one-audited-private-accepted-mechanics-snapshot-per-outer-step",
      );
  });

  it("rolls circulation, coronary, and mechanics back together", () => {
    const provider = testLandReadbackProvider(false);
    const cold = initializeMainWireFiveWallCoronaryV1({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const before = JSON.stringify(cold.acceptedState);
    const invalidDisease = Object.freeze({
      ...NORMAL_CORONARY_DISEASE_INPUT_V1,
      LAD: Object.freeze({
        ...NORMAL_CORONARY_DISEASE_INPUT_V1.LAD,
        diameterStenosisFraction01: 1,
      }),
    });

    const stepped = stepMainWireFiveWallCoronaryV1(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: PERICARDIUM,
        coronaryDisease: invalidDisease,
      },
    );

    expect(stepped.converged).toBe(false);
    if (stepped.converged === true) throw new Error("expected rollback");
    expect(stepped.circulationFailureReason).toBe("initial-evaluation-failed");
    expect(stepped.circulationCommitted).toBe(false);
    expect(stepped.coronaryCommitted).toBe(false);
    expect(stepped.mechanicsCommitted).toBe(false);
    expect(JSON.stringify(stepped.rollbackState)).toBe(before);
    expect(JSON.stringify(cold.acceptedState)).toBe(before);
  });

  it("does not expose a partially advanced coronary state when mechanics fails", () => {
    const provider = testLandReadbackProvider(true);
    const cold = initializeMainWireFiveWallCoronaryV1({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const stepped = stepMainWireFiveWallCoronaryV1(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: PERICARDIUM,
      },
    );
    expect(stepped.converged).toBe(false);
    if (stepped.converged === true) throw new Error("expected rollback");
    expect(stepped.rollbackState.coronary)
      .toEqual(cold.acceptedState.coronary);
    expect(stepped.rollbackState.revision).toBe(0);
  });

  it("advances the actual Moyer/Klotz + Land/SLS + TriSeg provider", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const runtime = Object.freeze({
      ...RUNTIME,
      respiratory: Object.freeze({ ...RUNTIME.respiratory, Pth0: 0 }),
    });
    const pericardium = createMainWireNormalAdultCommonPericardiumV1();
    const cold = initializeMainWireFiveWallCoronaryV1({
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const stepped = stepMainWireFiveWallCoronaryV1(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.002,
        runtime,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium,
      },
    );
    expect(stepped.converged).toBe(true);
    if (stepped.converged === false) throw new Error(stepped.message);
    expect(stepped.mechanicsTrial.diagnostics.converged).toBe(true);
    expect(stepped.coronaryTrial.diagnostics.converged).toBe(true);
    expect(stepped.circulationTrial.diagnostics.totalBloodVolumeErrorMl)
      .toBeCloseTo(0, 9);
    expect(Object.values(
      stepped.intramyocardialPressureMmHgByTerritoryLayer.LAD,
    ).every(Number.isFinite)).toBe(true);
  }, 60_000);
});

function testLandReadbackProvider(
  rejectTrials: boolean,
): WholeHeartMechanicsProviderV1<
  TestState,
  MainWireFiveWallFreeCalciumDriveV1
> {
  const codec = Object.freeze({
    clone: (state: TestState) => Object.freeze({ ...state }),
    encode: (state: TestState) => Object.freeze({ ...state }),
    decode: (encoded: unknown) => Object.freeze({ ...(encoded as TestState) }),
  });
  const evaluate = (
    timeSec: number,
    volumes: Readonly<{ LA: number; LV: number; RA: number; RV: number }>,
    fail: boolean,
  ) => {
    const wall = (landActiveKirchhoffStressPa: number) => Object.freeze({
      adapterId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
      landActiveKirchhoffStressPa,
    });
    return Object.freeze({
      materialState: Object.freeze({
        timeSec,
        volumeSumMl: volumes.LA + volumes.LV + volumes.RA + volumes.RV,
      }),
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
        converged: !fail,
        finite: true,
        iterationCount: 1,
        residualNorm: 0,
        errors: Object.freeze(fail ? ["intentional trial rejection"] : []),
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
            LVFW: wall(120_000),
            SEP: wall(95_000),
            RVFW: wall(45_000),
            RA: null,
          }),
        }),
      }),
    });
  };
  return Object.freeze({
    contractId: WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
    providerId: `test-land-readback-provider-${rejectTrials}`,
    parameterSetId: `test-land-readback-prior-${rejectTrials}`,
    parameterIdentityHash: rejectTrials ? "reject" : "accept",
    stateSchemaVersion: 1,
    stateCodec: codec,
    initializeCold: (input) => evaluate(input.timeSec, input.volumesMl, false),
    evaluateTrial: (input) => evaluate(
      input.candidateTimeSec,
      input.candidateVolumesMl,
      rejectTrials,
    ),
  });
}

function coronaryVolumeMl(
  state: Readonly<{ volumeMlByNode: Readonly<Record<string, number>> }>,
): number {
  return Object.values(state.volumeMlByNode).reduce(
    (sum, volume) => sum + volume,
    0,
  );
}
