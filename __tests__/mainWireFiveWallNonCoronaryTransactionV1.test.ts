import { describe, expect, it } from "vitest";

import { defaultParams } from "@/engine/core/params";
import {
  MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_CLAIM_V1,
  initializeMainWireFiveWallNonCoronaryV1,
  stepMainWireFiveWallNonCoronaryV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import type {
  MainWireFiveWallFreeCalciumDriveV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
  type WholeHeartMechanicsProviderV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

type TestState = Readonly<{ timeSec: number; volumeSumMl: number }>;

const base = defaultParams();
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
});

describe("main-wire five-wall noncoronary atomic transaction V1", () => {
  it("cold-starts and advances circulation/mechanics with one shared revision", () => {
    const provider = testProvider(false);
    const cold = initializeMainWireFiveWallNonCoronaryV1({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    });
    const stepped = stepMainWireFiveWallNonCoronaryV1(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      },
    );

    expect(stepped.converged).toBe(true);
    if (stepped.converged === false) throw new Error(stepped.message);
    expect(stepped.acceptedState.revision).toBe(1);
    expect(stepped.acceptedState.circulation.revision).toBe(1);
    expect(stepped.acceptedState.mechanics.revision).toBe(1);
    expect(stepped.acceptedState.acceptedTimeSec).toBe(0.001);
    expect(stepped.mechanicsTrial.candidateTimeSec)
      .toBe(stepped.circulationTrial.candidateTimeSec);
    expect(stepped.circulationTrial.candidateNodeVolumesMl.LA)
      .toBe(stepped.mechanicsTrial.candidateVolumesMl.LA);
    expect(stepped.circulationTrial.diagnostics.totalBloodVolumeErrorMl)
      .toBeCloseTo(0, 9);
  });

  it("adds common intrathoracic pressure exactly once at the node interface", () => {
    const provider = testProvider(false);
    const cold = initializeMainWireFiveWallNonCoronaryV1({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    });
    const stepped = stepMainWireFiveWallNonCoronaryV1(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      },
    );

    expect(stepped.converged).toBe(true);
    if (stepped.converged === false) throw new Error(stepped.message);
    expect(stepped.commonIntrathoracicPressureMmHg).toBe(-3);
    for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
      expect(stepped.circulationTrial.nodeAbsolutePressuresMmHg[chamber])
        .toBeCloseTo(
          stepped.mechanicsTrial.transmuralPressuresMmHg[chamber] - 3,
          12,
        );
    }
    expect(MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_CLAIM_V1
      .pericardialConstraintApplied).toBe(false);
    expect(MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_CLAIM_V1
      .laaBodyCompartmentsApplied).toBe(false);
  });

  it("rolls both owners back when the mechanics provider rejects a trial", () => {
    const provider = testProvider(true);
    const cold = initializeMainWireFiveWallNonCoronaryV1({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    });
    const before = JSON.stringify({
      circulation: cold.acceptedState.circulation,
      mechanics: provider.stateCodec.encode(
        cold.acceptedState.mechanics.materialState,
      ),
    });
    const stepped = stepMainWireFiveWallNonCoronaryV1(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      },
    );

    expect(stepped.converged).toBe(false);
    if (stepped.converged === true) throw new Error("expected rollback");
    expect(stepped.mechanicsCommitted).toBe(false);
    expect(stepped.circulationCommitted).toBe(false);
    expect(stepped.rollbackState.revision).toBe(0);
    expect(JSON.stringify({
      circulation: stepped.rollbackState.circulation,
      mechanics: provider.stateCodec.encode(
        stepped.rollbackState.mechanics.materialState,
      ),
    })).toBe(before);
    expect(JSON.stringify({
      circulation: cold.acceptedState.circulation,
      mechanics: provider.stateCodec.encode(
        cold.acceptedState.mechanics.materialState,
      ),
    })).toBe(before);
  });

  it("advances one actual Moyer/Klotz + Land/SLS + TriSeg step", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const runtime = Object.freeze({
      ...RUNTIME,
      respiratory: Object.freeze({
        ...RUNTIME.respiratory,
        Pth0: 0,
      }),
    });
    const cold = initializeMainWireFiveWallNonCoronaryV1({
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    });
    const stepped = stepMainWireFiveWallNonCoronaryV1(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.002,
        runtime,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      },
    );

    expect(stepped.converged).toBe(true);
    if (stepped.converged === false) throw new Error(stepped.message);
    expect(stepped.mechanicsTrial.diagnostics.converged).toBe(true);
    expect(stepped.mechanicsTrial.diagnostics.finite).toBe(true);
    expect(stepped.circulationTrial.diagnostics.totalBloodVolumeErrorMl)
      .toBeCloseTo(0, 9);
    expect(Object.keys(stepped.acceptedState.mechanics.materialState).sort())
      .toEqual(["trisegCoordinates", "wallStateByWall"]);
    expect(Object.values(stepped.mechanicsTrial.transmuralPressuresMmHg)
      .every(Number.isFinite)).toBe(true);
  }, 60_000);
});

function testProvider(
  rejectTrials: boolean,
): WholeHeartMechanicsProviderV1<TestState, MainWireFiveWallFreeCalciumDriveV1> {
  const codec = Object.freeze({
    clone: (state: TestState) => Object.freeze({ ...state }),
    encode: (state: TestState) => Object.freeze({ ...state }),
    decode: (encoded: unknown) => Object.freeze({ ...(encoded as TestState) }),
  });
  const evaluate = (
    timeSec: number,
    volumes: Readonly<{ LA: number; LV: number; RA: number; RV: number }>,
    fail: boolean,
  ) => Object.freeze({
    materialState: Object.freeze({
      timeSec,
      volumeSumMl: volumes.LA + volumes.LV + volumes.RA + volumes.RV,
    }),
    transmuralPressuresMmHg: Object.freeze({
      LA: 12 + 0.08 * (volumes.LA - 45),
      LV: 16 + 0.12 * (volumes.LV - 130),
      RA: 7 + 0.06 * (volumes.RA - 55),
      RV: 11 + 0.09 * (volumes.RV - 140),
    }),
    diagnostics: Object.freeze({
      converged: !fail,
      finite: true,
      iterationCount: 1,
      residualNorm: 0,
      errors: Object.freeze(fail ? ["intentional trial rejection"] : []),
      warnings: Object.freeze([]),
      readback: null,
    }),
  });
  return Object.freeze({
    contractId: WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
    providerId: `test-provider-${rejectTrials}`,
    parameterSetId: `test-prior-${rejectTrials}`,
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
