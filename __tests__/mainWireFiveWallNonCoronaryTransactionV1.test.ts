import { describe, expect, it } from "vitest";

import { defaultParams } from "@/engine/core/params";
import {
  MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_CLAIM_V1,
  checkpointMainWireFiveWallNonCoronaryV1,
  initializeMainWireFiveWallNonCoronaryV1,
  restoreMainWireFiveWallNonCoronaryV1,
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
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import {
  WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
  type WholeHeartMechanicsProviderV1,
  type WholeHeartMechanicsSerializableValueV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

type TestState = Readonly<{ timeSec: number; volumeSumMl: number }>;

type TransactionTestProvider = WholeHeartMechanicsProviderV1<
  TestState,
  MainWireFiveWallFreeCalciumDriveV1
> & Readonly<{
  counters: { encodeCount: number; trialCount: number };
}>;

const base = defaultParams();
const OFF_PERICARDIUM = createMainWireNormalAdultCommonPericardiumV1(
  "exact-off",
);
const EFFUSION_PERICARDIUM = Object.freeze({
  ...OFF_PERICARDIUM,
  parameterSetId: "test-prescribed-4mmhg-pericardial-offset",
  mode: "on" as const,
  parameters: Object.freeze({
    referenceHeartVolumeM3: 1,
    exponentialPressureScalePa: 1,
    exponentialStiffness: 1,
    prescribedPressureOffsetPa: 4 * 133.322,
  }),
});
const ENGAGED_ELASTIC_PERICARDIUM = Object.freeze({
  ...OFF_PERICARDIUM,
  parameterSetId: "test-engaged-elastic-common-pericardium",
  mode: "on" as const,
  parameters: Object.freeze({
    referenceHeartVolumeM3: 4e-4,
    exponentialPressureScalePa: 100,
    exponentialStiffness: 1,
    prescribedPressureOffsetPa: 0,
  }),
});
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

describe("main-wire five-wall noncoronary atomic transaction V1", () => {
  it("cold-starts and advances circulation/mechanics with one shared revision", () => {
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
    expect(stepped.acceptedState.circulation.totalBloodVolumeMl)
      .toBe(cold.acceptedState.circulation.totalBloodVolumeMl);
    const checkpoint = checkpointMainWireFiveWallNonCoronaryV1(
      provider,
      stepped.acceptedState,
    );
    expect(checkpoint.circulation.state.totalBloodVolumeMl)
      .toBe(cold.acceptedState.circulation.totalBloodVolumeMl);
    const serialized = JSON.parse(JSON.stringify(checkpoint)) as
      typeof checkpoint;
    expect(restoreMainWireFiveWallNonCoronaryV1(provider, serialized))
      .toEqual(stepped.acceptedState);
    const rebased = restoreMainWireFiveWallNonCoronaryV1(
      provider,
      serialized,
      { revision: 0, acceptedTimeSec: 0 },
    );
    expect(rebased).toMatchObject({
      revision: 0,
      acceptedTimeSec: 0,
      circulation: { revision: 0, acceptedTimeSec: 0 },
      mechanics: { revision: 0, acceptedTimeSec: 0 },
    });
    expect(rebased.circulation.nodeVolumesMl)
      .toEqual(stepped.acceptedState.circulation.nodeVolumesMl);
    expect(rebased.circulation.totalBloodVolumeMl)
      .toBe(stepped.acceptedState.circulation.totalBloodVolumeMl);
    const tampered = {
      ...serialized,
      circulation: {
        ...serialized.circulation,
        state: {
          ...serialized.circulation.state,
          dynamicEdgeFlowsMlPerSec: {
            ...serialized.circulation.state.dynamicEdgeFlowsMlPerSec,
            Ao_SA:
              serialized.circulation.state.dynamicEdgeFlowsMlPerSec.Ao_SA + 1,
          },
        },
      },
    } as typeof checkpoint;
    expect(() => restoreMainWireFiveWallNonCoronaryV1(provider, tampered))
      .toThrow(/fingerprint mismatch/);
  });

  it("adds common intrathoracic pressure exactly once at the node interface", () => {
    const provider = testProvider(false);
    const cold = initializeMainWireFiveWallNonCoronaryV1({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: EFFUSION_PERICARDIUM,
    });
    const stepped = stepMainWireFiveWallNonCoronaryV1(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: EFFUSION_PERICARDIUM,
      },
    );

    expect(stepped.converged).toBe(true);
    if (stepped.converged === false) throw new Error(stepped.message);
    expect(stepped.commonIntrathoracicPressureMmHg).toBe(-3);
    for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
      expect(stepped.circulationTrial.nodeAbsolutePressuresMmHg[chamber])
        .toBeCloseTo(
          stepped.mechanicsTrial.transmuralPressuresMmHg[chamber] + 1,
          12,
        );
    }
    expect(stepped.pericardium.excessPressureMmHg).toBeCloseTo(4, 12);
    expect(MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_CLAIM_V1
      .pericardialConstraintInterface)
      .toBe("required-conservative-common-pressure-binding");
    expect(MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_CLAIM_V1
      .laaBodyCompartmentsApplied).toBe(false);
  });

  it("rolls both owners back when the mechanics provider rejects a trial", () => {
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
    expect(stepped.rollbackState.circulation.totalBloodVolumeMl)
      .toBe(cold.acceptedState.circulation.totalBloodVolumeMl);
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

  it("does not seal valid discarded probes when circulation fails", () => {
    const provider = testProvider(false, true, true);
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
    });
    const encodeCountBeforeStep = provider.counters.encodeCount;
    const trialCountBeforeStep = provider.counters.trialCount;
    const stepped = stepMainWireFiveWallNonCoronaryV1(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: OFF_PERICARDIUM,
        circulationNewtonOptions: {
          maxIterations: 1,
          absoluteContinuityResidualToleranceMl: 1e-30,
          scaledResidualInfinityTolerance: 1e-30,
          scaledUpdateInfinityTolerance: 1e-30,
        },
      },
    );

    expect(stepped.converged).toBe(false);
    if (stepped.converged === true) throw new Error("expected rollback");
    expect(provider.counters.trialCount - trialCountBeforeStep)
      .toBeGreaterThan(0);
    // One prepared-baseline audit plus one rollback snapshot. A selected probe
    // seal would add a third state encoding here.
    expect(provider.counters.encodeCount - encodeCountBeforeStep).toBe(2);
    expect(stepped.mechanicsCommitted).toBe(false);
    expect(stepped.circulationCommitted).toBe(false);
    expect(JSON.stringify({
      circulation: stepped.rollbackState.circulation,
      mechanics: provider.stateCodec.encode(
        stepped.rollbackState.mechanics.materialState,
      ),
    })).toBe(before);
  });

  it("rolls back atomically when selected rich readback fails at seal", () => {
    const baseProvider = testProvider(false, true, true);
    const provider: TransactionTestProvider = Object.freeze({
      ...baseProvider,
      evaluateTrial: (input) => {
        const result = baseProvider.evaluateTrial(input);
        return Object.freeze({
          ...result,
          diagnostics: Object.freeze({
            ...result.diagnostics,
            readback: new Date() as unknown as
              WholeHeartMechanicsSerializableValueV1,
          }),
        });
      },
    });
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

    expect(stepped.converged).toBe(false);
    if (stepped.converged === true) throw new Error("expected rollback");
    expect(stepped.reason).toBe("selected-candidate-finalization-failed");
    expect(stepped.finalizationFailureStage).toBe("selected-mechanics-seal");
    expect(stepped.message).toMatch(/not JSON-serializable/);
    expect(stepped.rollbackState).toBe(cold.acceptedState);
    expect(stepped.mechanicsCommitted).toBe(false);
    expect(stepped.circulationCommitted).toBe(false);
  });

  it("rolls back atomically when selected material-state encoding fails", () => {
    const baseProvider = testProvider(false, true, true);
    const baseCodec = baseProvider.stateCodec;
    const provider: TransactionTestProvider = Object.freeze({
      ...baseProvider,
      stateCodec: Object.freeze({
        clone: baseCodec.clone,
        encode: (state: TestState) => {
          if (state.timeSec > 0) {
            throw new Error("intentional selected candidate codec failure");
          }
          return baseCodec.encode(state);
        },
        decode: baseCodec.decode,
      }),
    });
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

    expect(stepped.converged).toBe(false);
    if (stepped.converged === true) throw new Error("expected rollback");
    expect(stepped.reason).toBe("selected-candidate-finalization-failed");
    expect(stepped.finalizationFailureStage).toBe("selected-mechanics-seal");
    expect(stepped.message).toMatch(/intentional selected candidate codec failure/);
    expect(stepped.rollbackState).toBe(cold.acceptedState);
    expect(stepped.mechanicsCommitted).toBe(false);
    expect(stepped.circulationCommitted).toBe(false);
  });

  it("adds the common-pericardium rank-one tangent exactly once", () => {
    const provider = testProvider(false, true);
    const cold = initializeMainWireFiveWallNonCoronaryV1({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: ENGAGED_ELASTIC_PERICARDIUM,
    });
    const stepped = stepMainWireFiveWallNonCoronaryV1(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: ENGAGED_ELASTIC_PERICARDIUM,
        circulationNewtonOptions: {
          analyticJacobianFiniteDifferenceShadow: true,
        },
      },
    );
    expect(stepped.converged).toBe(true);
    if (stepped.converged === false) throw new Error(stepped.message);
    expect(stepped.pericardium.pressureDerivativePaPerM3).toBeGreaterThan(0);
    expect(stepped.circulationTrial.diagnostics.jacobianMode)
      .toBe("analytic-semismooth");
    expect(stepped.circulationTrial.diagnostics
      .finiteDifferenceJacobianFallbackCount).toBe(0);
    expect(stepped.circulationTrial.diagnostics
      .finiteDifferenceJacobianShadowCount).toBeGreaterThan(0);
    expect(stepped.circulationTrial.diagnostics
      .jacobianMaximumRelativeFrobeniusShadowDifference!)
      .toBeLessThan(2e-5);
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
    expect(stepped.mechanicsTrial.transmuralPressureVolumeTangentMmHgPerMl)
      .toBeDefined();
    expect(stepped.circulationTrial.diagnostics.jacobianMode)
      .toBe("analytic-semismooth");
    expect(stepped.circulationTrial.diagnostics
      .finiteDifferenceJacobianFallbackCount).toBe(0);
    expect(stepped.circulationTrial.diagnostics
      .pressureTangentAvailableAtFinalCandidate).toBe(true);
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
  includeTangent = false,
  exclusiveResult = false,
): TransactionTestProvider {
  const counters = { encodeCount: 0, trialCount: 0 };
  const codec = Object.freeze({
    clone: (state: TestState) => Object.freeze({ ...state }),
    encode: (state: TestState) => {
      counters.encodeCount += 1;
      return Object.freeze({ ...state });
    },
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
      ...(includeTangent
        ? {
          transmuralPressureVolumeTangentMmHgPerMl: Object.freeze({
            LA: Object.freeze({ LA: 0.08, LV: 0, RA: 0, RV: 0 }),
            LV: Object.freeze({ LA: 0, LV: 0.12, RA: 0, RV: 0 }),
            RA: Object.freeze({ LA: 0, LV: 0, RA: 0.06, RV: 0 }),
            RV: Object.freeze({ LA: 0, LV: 0, RA: 0, RV: 0.09 }),
          }),
        }
        : {}),
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
    ...(exclusiveResult
      ? { evaluationResultOwnershipMode: "exclusive-result" as const }
      : {}),
    counters,
    stateCodec: codec,
    initializeCold: (input) => evaluate(input.timeSec, input.volumesMl, false),
    evaluateTrial: (input) => {
      counters.trialCount += 1;
      return evaluate(
        input.candidateTimeSec,
        input.candidateVolumesMl,
        rejectTrials,
      );
    },
  });
}
