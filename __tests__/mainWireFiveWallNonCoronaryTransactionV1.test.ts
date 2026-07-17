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
import {
  createFixedSinusFiveWallCalciumEventScheduleV1,
} from "@/engine/myocardium/calcium/fiveWallExactEventCalciumDriveV1";
import type {
  MainWireFiveWallFreeCalciumDriveV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
  type WholeHeartMechanicsProviderV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

type TestState = Readonly<{ timeSec: number; volumeSumMl: number }>;

const base = defaultParams();
const OFF_PERICARDIUM = createMainWireNormalAdultCommonPericardiumV1(
  "exact-off",
);
const ENGAGED_PERICARDIUM = createMainWireNormalAdultCommonPericardiumV1(
  "on",
  "global-capacity-vh0-430ml-positive-control",
);
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
  it("cold-starts and advances circulation/mechanics/calcium with one shared revision", () => {
    const provider = testProvider(false);
    const cold = initializeMainWireFiveWallNonCoronaryV1({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: OFF_PERICARDIUM,
    });
    const stepped = stepMainWireFiveWallNonCoronaryV1(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: OFF_PERICARDIUM,
      },
    );

    expect(cold.pericardium).toMatchObject({
      mode: "exact-off",
      excessPressurePa: 0,
      storedEnergyJ: 0,
    });
    expect(stepped.converged).toBe(true);
    if (stepped.converged === false) throw new Error(stepped.message);
    expect(stepped.acceptedState.revision).toBe(1);
    expect(stepped.acceptedState.circulation.revision).toBe(1);
    expect(stepped.acceptedState.mechanics.revision).toBe(1);
    expect(stepped.acceptedState.calcium.revision).toBe(1);
    expect(stepped.acceptedState.acceptedTimeSec).toBe(0.001);
    expect(stepped.acceptedState.calcium.acceptedTimeSec).toBe(0.001);
    expect(Object.values(stepped.acceptedState.calcium.stateByWall))
      .toHaveLength(5);
    expect(stepped.mechanicsTrial.candidateTimeSec)
      .toBe(stepped.circulationTrial.candidateTimeSec);
    expect(stepped.circulationTrial.candidateNodeVolumesMl.LA)
      .toBe(stepped.mechanicsTrial.candidateVolumesMl.LA);
    expect(stepped.circulationTrial.diagnostics.totalBloodVolumeErrorMl)
      .toBeCloseTo(0, 9);
  });

  it("adds intrathoracic and common-pericardial pressure once at the node interface", () => {
    const provider = testProvider(false);
    const cold = initializeMainWireFiveWallNonCoronaryV1({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: ENGAGED_PERICARDIUM,
    });
    const stepped = stepMainWireFiveWallNonCoronaryV1(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: ENGAGED_PERICARDIUM,
      },
    );

    expect(cold.pericardium.excessPressureMmHg).toBeGreaterThan(0);
    expect(stepped.converged).toBe(true);
    if (stepped.converged === false) throw new Error(stepped.message);
    expect(stepped.commonIntrathoracicPressureMmHg).toBe(-3);
    for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
      expect(stepped.circulationTrial.nodeAbsolutePressuresMmHg[chamber])
        .toBeCloseTo(
          stepped.mechanicsTrial.transmuralPressuresMmHg[chamber] - 3
            + stepped.pericardium.excessPressureMmHg,
          12,
        );
    }
    expect(stepped.pericardium.excessPressureMmHg).toBeGreaterThan(0);
    expect(MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_CLAIM_V1
      .pericardialPressureAppliedOnceToFourAbsoluteChamberPressures).toBe(true);
    expect(MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_CLAIM_V1
      .laaBodyCompartmentsApplied).toBe(false);
  });

  it("rolls all three owners back when the mechanics provider rejects a trial", () => {
    const provider = testProvider(true);
    const cold = initializeMainWireFiveWallNonCoronaryV1({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: OFF_PERICARDIUM,
    });
    const before = JSON.stringify({
      circulation: cold.acceptedState.circulation,
      mechanics: provider.stateCodec.encode(
        cold.acceptedState.mechanics.materialState,
      ),
      calcium: cold.acceptedState.calcium,
    });
    const stepped = stepMainWireFiveWallNonCoronaryV1(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: OFF_PERICARDIUM,
      },
    );

    expect(stepped.converged).toBe(false);
    if (stepped.converged === true) throw new Error("expected rollback");
    expect(stepped.mechanicsCommitted).toBe(false);
    expect(stepped.circulationCommitted).toBe(false);
    expect(stepped.calciumCommitted).toBe(false);
    expect(stepped.circulationFailureReason).toBe("initial-evaluation-failed");
    expect(Object.values(stepped.lastAcceptedCandidateNodeVolumesMl)
      .every(Number.isFinite)).toBe(true);
    expect(stepped.circulationDiagnostics.mechanicsCallbackCallCount)
      .toBeGreaterThan(0);
    expect(stepped.circulationDiagnostics.lineSearchFailure).toBeNull();
    expect(stepped.circulationDiagnostics.failureNewtonTrace).toEqual([]);
    expect(stepped.circulationDiagnostics.worstIndependentContinuityResidual)
      .toBeNull();
    expect(stepped.rollbackState.revision).toBe(0);
    expect(stepped.rollbackState.calcium.revision).toBe(0);
    expect(stepped.rollbackState.calcium.acceptedTimeSec).toBe(0);
    expect(JSON.stringify({
      circulation: stepped.rollbackState.circulation,
      mechanics: provider.stateCodec.encode(
        stepped.rollbackState.mechanics.materialState,
      ),
      calcium: stepped.rollbackState.calcium,
    })).toBe(before);
    expect(JSON.stringify({
      circulation: cold.acceptedState.circulation,
      mechanics: provider.stateCodec.encode(
        cold.acceptedState.mechanics.materialState,
      ),
      calcium: cold.acceptedState.calcium,
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
      pericardium: createMainWireNormalAdultCommonPericardiumV1(),
    });
    const stepped = stepMainWireFiveWallNonCoronaryV1(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.002,
        runtime,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: createMainWireNormalAdultCommonPericardiumV1(),
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

  it("preserves one aligned HR60 closed-loop beat across analytic and exact-event output", () => {
    const provider = testProvider(false);
    const schedule = createFixedSinusFiveWallCalciumEventScheduleV1(
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    );
    let analytic = initializeMainWireFiveWallNonCoronaryV1({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      calciumRepresentation:
        "analytic-periodic-control-with-exact-event-shadow",
      calciumEventSchedule: schedule,
      calciumInitialization:
        "regular-periodic-prehistory-from-fixed-prior",
      pericardium: OFF_PERICARDIUM,
    }).acceptedState;
    let exact = initializeMainWireFiveWallNonCoronaryV1({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      calciumRepresentation: "exact-event-state",
      calciumEventSchedule: schedule,
      calciumInitialization:
        "regular-periodic-prehistory-from-fixed-prior",
      pericardium: OFF_PERICARDIUM,
    }).acceptedState;

    for (let step = 1; step <= 500; step += 1) {
      const analyticStep = stepMainWireFiveWallNonCoronaryV1(
        provider,
        analytic,
        {
          dtSec: 0.002,
          runtime: RUNTIME,
          calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
          calciumEventSchedule: schedule,
          pericardium: OFF_PERICARDIUM,
        },
      );
      const exactStep = stepMainWireFiveWallNonCoronaryV1(
        provider,
        exact,
        {
          dtSec: 0.002,
          runtime: RUNTIME,
          calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
          calciumEventSchedule: schedule,
          pericardium: OFF_PERICARDIUM,
        },
      );
      if (analyticStep.converged === false) throw new Error(analyticStep.message);
      if (exactStep.converged === false) throw new Error(exactStep.message);
      for (const wall of ["LA", "RA", "LVFW", "SEP", "RVFW"] as const) {
        expect(exactStep.calciumDrive.freeCalciumUMByWall[wall])
          .toBeCloseTo(analyticStep.calciumDrive.freeCalciumUMByWall[wall], 14);
      }
      analytic = analyticStep.acceptedState;
      exact = exactStep.acceptedState;
    }

    expect(exact.acceptedTimeSec).toBeCloseTo(1, 14);
    expect(exact.calcium.stateByWall).toEqual(analytic.calcium.stateByWall);
    expect(exact.circulation.nodeVolumesMl)
      .toEqual(analytic.circulation.nodeVolumesMl);
    expect(exact.circulation.dynamicEdgeFlowsMlPerSec)
      .toEqual(analytic.circulation.dynamicEdgeFlowsMlPerSec);
    expect(exact.circulation.valveStates)
      .toEqual(analytic.circulation.valveStates);
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
