import { describe, expect, it } from "vitest";

import { defaultParams } from "@/engine/core/params";
import {
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryTerritoryLayerRecordV2,
} from "@/engine/coronary/typesV2";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  createMechanicalSupportConfigV1,
} from "@/engine/devices/defaultsV1";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_CLAIM_V3,
  initializeMainWireFiveWallCoronaryV3,
  maximumMainWireFiveWallCoronaryStepDurationV3,
  stepMainWireFiveWallCoronaryV3,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV3";
import {
  MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
  type MainWireFiveWallFreeCalciumDriveV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
  type WholeHeartMechanicsProviderV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";
import {
  MAIN_WIRE_FOUR_VALVE_NORMAL_PRESET_V1,
} from "@/engine/mechanics2/valve/MainWireFourValveDiseasePresetV1";

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
  valvePreset: MAIN_WIRE_FOUR_VALVE_NORMAL_PRESET_V1,
});

describe("main-wire coronary accepted-autoregulation transaction V3", () => {
  it("cold-starts a separate empty physical-time owner without reinterpreting V2", () => {
    const cold = initializeMainWireFiveWallCoronaryV3({
      provider: testProvider(),
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const state = cold.acceptedState;
    expect(state.transactionId).toBe(
      "main-wire-five-wall-coronary-transaction-v3",
    );
    expect(state.coronaryAutoregulationBinding.windowPolicy).toMatchObject({
      durationSec: 1,
      interpretation: "periodic-sinus-cycle-aligned",
      quadrature: "backward-euler-right-endpoint",
    });
    expect(state.coronaryAutoregulation).toMatchObject({
      windowIndex: 0,
      acceptedDurationSec: 0,
      acceptedStepCount: 0,
      windowControl: null,
    });
    expect(MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_CLAIM_V3
      .legacyV2AcceptedStateReinterpreted).toBe(false);
    expect(maximumMainWireFiveWallCoronaryStepDurationV3(state)).toBe(1);
  });

  it("integrates only the final accepted coronary candidate and is retry-pure", () => {
    const provider = testProvider();
    const cold = initializeMainWireFiveWallCoronaryV3({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const input = {
      dtSec: 0.001,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    } as const;
    const before = JSON.stringify(cold.acceptedState);
    const stepped = stepMainWireFiveWallCoronaryV3(
      provider,
      cold.acceptedState,
      input,
    );
    const retry = stepMainWireFiveWallCoronaryV3(
      provider,
      cold.acceptedState,
      input,
    );
    expect(stepped.converged).toBe(true);
    expect(retry).toEqual(stepped);
    expect(JSON.stringify(cold.acceptedState)).toBe(before);
    if (!stepped.converged) return;
    expect(stepped.autoregulationWindowCompleted).toBe(false);
    expect(stepped.acceptedState.coronaryAutoregulation).toMatchObject({
      acceptedDurationSec: 0.001,
      acceptedStepCount: 1,
    });
    const hydraulics = stepped.baseStep.coronaryTrial.diagnostics.hydraulics;
    const expectedQmIntegral = hydraulics
      .layerQmInternalFlowMlPerSecByTerritory.LAD.subendocardial * 0.001;
    expect(stepped.acceptedState.coronaryAutoregulation
      .qmTimeIntegralMlByTerritoryLayer.LAD.subendocardial)
      .toBeCloseTo(expectedQmIntegral, 15);
    expect(stepped.acceptedToneAfterWindow)
      .toEqual(stepped.hydraulicToneUsed);
  }, 60_000);

  it("uses old tone on the closing step and promotes new tone for the next step", () => {
    const provider = testProvider();
    const cold = initializeMainWireFiveWallCoronaryV3({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
      autoregulationWindow: {
        durationSec: 0.001,
        interpretation: "irregular-rhythm-stationary",
      },
    });
    const input = {
      dtSec: 0.001,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    } as const;
    const closing = stepMainWireFiveWallCoronaryV3(
      provider,
      cold.acceptedState,
      input,
    );
    expect(closing.converged).toBe(true);
    if (!closing.converged) return;
    expect(closing.autoregulationWindowCompleted).toBe(true);
    expect(closing.autoregulationCompletion?.toneStep
      .maximumAbsoluteLogToneChange).toBeGreaterThan(0);
    expect(closing.baseStep.acceptedState.coronary
      .toneResistanceScaleByTerritoryLayer)
      .toEqual(closing.hydraulicToneUsed);
    expect(closing.acceptedState.coronary.toneResistanceScaleByTerritoryLayer)
      .toEqual(closing.acceptedToneAfterWindow);
    expect(closing.acceptedToneAfterWindow)
      .not.toEqual(closing.hydraulicToneUsed);

    const next = stepMainWireFiveWallCoronaryV3(
      provider,
      closing.acceptedState,
      input,
    );
    expect(next.converged).toBe(true);
    if (!next.converged) return;
    expect(next.hydraulicToneUsed).toEqual(closing.acceptedToneAfterWindow);
    expect(next.baseStep.coronaryTrial.diagnostics.hydraulics
      .effectiveToneResistanceScaleByTerritoryLayer)
      .toEqual(closing.acceptedToneAfterWindow);
  }, 60_000);

  it("rolls back every V3 owner when the accepted control is malformed", () => {
    const provider = testProvider();
    const cold = initializeMainWireFiveWallCoronaryV3({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const before = JSON.stringify(cold.acceptedState);
    const malformedDemand = layerRecord(1);
    const mutable = JSON.parse(JSON.stringify(malformedDemand));
    mutable.LAD.subendocardial = Number.NaN;
    const stepped = stepMainWireFiveWallCoronaryV3(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: PERICARDIUM,
        coronaryAutoregulationDrive: {
          controlId: "malformed-demand-test",
          demandScaleByTerritoryLayer: mutable,
          hyperemia01ByTerritoryLayer: layerRecord(0),
        },
      },
    );
    expect(stepped.converged).toBe(false);
    if (stepped.converged === true) return;
    expect(stepped.reason)
      .toBe("accepted-coronary-autoregulation-window-rejected");
    expect(stepped.baseStep.converged).toBe(true);
    expect(stepped.autoregulationCommitted).toBe(false);
    expect(JSON.stringify(stepped.rollbackState)).toBe(before);
    expect(JSON.stringify(cold.acceptedState)).toBe(before);
  }, 60_000);

  it("commits LVAD transfer, coronary hydraulics, and the V3 window from one candidate", () => {
    const provider = testProvider();
    const cold = initializeMainWireFiveWallCoronaryV3({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const stepped = stepMainWireFiveWallCoronaryV3(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: PERICARDIUM,
        mechanicalSupport: {
          config: createMechanicalSupportConfigV1({
            lvad: { enabled: true, speedRpm: 4_500 },
          }),
          heartRateBpm: 60,
        },
        circulationNewtonOptions: {
          analyticJacobianFiniteDifferenceShadow: true,
        },
      },
    );

    expect(stepped.converged).toBe(true);
    if (!stepped.converged) return;
    const support = stepped.baseStep.circulationTrial.mechanicalSupport!;
    expect(support.pump.LVAD.flowLMin).toBeGreaterThan(0);
    expect(support.nodeNetVolumeRateMlPerSec.LV).toBeLessThan(0);
    expect(support.nodeNetVolumeRateMlPerSec.Ao).toBeGreaterThan(0);
    expect(Math.abs(support.conservationResidualMlPerSec)).toBeLessThan(1e-12);
    expect(Math.abs(stepped.baseStep.circulationTrial.diagnostics
      .totalBloodVolumeErrorMl)).toBeLessThan(1e-8);
    expect(Math.abs(stepped.baseStep.coronaryTrial.diagnostics
      .exactBloodVolumeLedgerResidualMl)).toBeLessThan(1e-8);
    expect(stepped.baseStep.circulationTrial.diagnostics.jacobianMode)
      .toBe("analytic-semismooth");
    expect(stepped.baseStep.circulationTrial.diagnostics
      .jacobianMaximumRelativeFrobeniusShadowDifference)
      .toBeLessThan(2e-5);
    expect(stepped.acceptedState.coronaryAutoregulation).toMatchObject({
      acceptedDurationSec: 0.001,
      acceptedStepCount: 1,
    });
  }, 60_000);

  it("rejects a boundary-crossing dt before evaluating the base transaction", () => {
    const provider = testProvider();
    const cold = initializeMainWireFiveWallCoronaryV3({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
      autoregulationWindow: {
        durationSec: 0.001,
        interpretation: "irregular-rhythm-stationary",
      },
    });
    expect(() => stepMainWireFiveWallCoronaryV3(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.002,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: PERICARDIUM,
      },
    )).toThrow(/must not cross.*window/);
    expect(cold.acceptedState.revision).toBe(0);
  });
});

function testProvider(): WholeHeartMechanicsProviderV1<
  TestState,
  MainWireFiveWallFreeCalciumDriveV1
> {
  const evaluate = (
    timeSec: number,
    volumes: Readonly<{ LA: number; LV: number; RA: number; RV: number }>,
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
    providerId: "coronary-v3-autoregulation-test-provider",
    parameterSetId: "coronary-v3-autoregulation-test-prior",
    parameterIdentityHash: "coronary-v3-autoregulation-test-hash",
    stateSchemaVersion: 1,
    stateCodec: Object.freeze({
      clone: (state: TestState) => Object.freeze({ ...state }),
      encode: (state: TestState) => Object.freeze({ ...state }),
      decode: (encoded: unknown) => Object.freeze({
        ...(encoded as TestState),
      }),
    }),
    initializeCold: (input) => evaluate(input.timeSec, input.volumesMl),
    evaluateTrial: (input) => evaluate(
      input.candidateTimeSec,
      input.candidateVolumesMl,
    ),
  });
}

function layerRecord(value: number): CoronaryTerritoryLayerRecordV2<number> {
  return Object.freeze(Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map(
    (territoryId) => [territoryId, Object.freeze(Object.fromEntries(
      CORONARY_LAYER_IDS_V2.map((layerId) => [layerId, value]),
    ))],
  ))) as CoronaryTerritoryLayerRecordV2<number>;
}
