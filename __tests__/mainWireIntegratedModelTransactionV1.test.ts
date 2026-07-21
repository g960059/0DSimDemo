import { describe, expect, it } from "vitest";

import { defaultParams } from "@/engine/core/params";
import {
  createMechanicalSupportConfigV1,
} from "@/engine/devices/defaultsV1";
import {
  createDynamicMechanicalSupportDeviceProfileBindingV1,
  createDynamicMechanicalSupportInertanceProfileV1,
  type DynamicMechanicalSupportInertanceProfileV1,
} from "@/engine/devices/dynamicNetworkV1";
import {
  DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
  type DynamicRotaryPumpCircuitInertanceV1,
} from "@/engine/devices/dynamicRotaryPumpV1";
import type {
  MechanicalSupportConfigV1,
  RotarySupportDeviceIdV1,
} from "@/engine/devices/typesV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V1,
  initializeMainWireIntegratedModelV1,
  maximumMainWireIntegratedModelStepDurationV1,
  stepMainWireIntegratedModelV1,
  validateMainWireIntegratedModelAcceptedStateV1,
  type MainWireIntegratedModelColdResultV1,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV1";
import {
  initializeMainWireFiveWallCoronaryV3,
  stepMainWireFiveWallCoronaryV3,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV3";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  createPeriodicSinusFiveWallRhythmCalciumReplayV1,
  evaluateAcceptedFiveWallRhythmCalciumCurrentDriveV1,
  evaluateAcceptedFiveWallRhythmCalciumTrialV1,
  type PeriodicSinusFiveWallRhythmCalciumReplayV1,
} from "@/engine/myocardium/rhythm/acceptedFiveWallRhythmCalciumOwnerV1";
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

type TestState = Readonly<{
  timeSec: number;
  volumeSumMl: number;
  calciumSumUM: number;
}>;

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

describe("main-wire integrated coronary + rhythm + dynamic MCS transaction V1", () => {
  it("cold-starts one clock tuple with current rhythm calcium and bound flow state", () => {
    const profile = syntheticProfile(inertance(), "cold");
    const fixture = integratedFixture({
      profile,
      initialAcceptedFlowMlPerSec: {
        LVAD: 12,
        IMPELLA: -2,
        VA_ECMO: 7,
        VV_ECMO: 3,
      },
    });
    const state = fixture.cold.acceptedState;
    expect(state.revision).toBe(0);
    expect(state.acceptedTimeSec).toBe(0);
    expect(state.coronary.revision).toBe(0);
    expect(state.rhythmCalcium.revision).toBe(0);
    expect(state.coronary.acceptedTimeSec).toBe(0);
    expect(state.rhythmCalcium.acceptedTimeSec).toBe(0);
    expect(state.dynamicMechanicalSupport).toMatchObject({
      inertanceProfileSnapshot: {
        profileId: profile.profileId,
        profileBindingSha256: profile.profileBindingSha256,
      },
      acceptedFlowMlPerSec: {
        LVAD: 12,
        IMPELLA: -2,
        VA_ECMO: 7,
        VV_ECMO: 3,
      },
    });
    const currentDrive = evaluateAcceptedFiveWallRhythmCalciumCurrentDriveV1(
      fixture.replay.acceptedState,
      fixture.replay.binding,
      fixture.replay.schedule,
    );
    expect(fixture.cold.calciumDrive).toEqual(currentDrive);
    expect(state.coronary.mechanics.materialState.calciumSumUM)
      .toBe(sumCalcium(currentDrive));
    validateMainWireIntegratedModelAcceptedStateV1(
      state,
      rhythmContext(fixture.replay),
      profile,
      fixture.config,
    );
  });

  it("keeps all-off coronary V3 output bit-exact with the same rhythm drive", () => {
    const profile = syntheticProfile(inertance({
      pumpInternalMmHgSec2PerMl: 0.03,
    }), "all-off");
    const fixture = integratedFixture({
      profile,
      initialAcceptedFlowMlPerSec: {
        LVAD: 12,
        IMPELLA: -2,
        VA_ECMO: 7,
        VV_ECMO: 3,
      },
    });
    const currentDrive = evaluateAcceptedFiveWallRhythmCalciumCurrentDriveV1(
      fixture.replay.acceptedState,
      fixture.replay.binding,
      fixture.replay.schedule,
    );
    const directCold = initializeMainWireFiveWallCoronaryV3({
      provider: fixture.provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      calciumDriveOverride: currentDrive,
      pericardium: PERICARDIUM,
    });
    expect(fixture.cold.acceptedState.coronary)
      .toEqual(directCold.acceptedState);

    const rhythmTrial = evaluateAcceptedFiveWallRhythmCalciumTrialV1(
      fixture.replay.acceptedState,
      0.001,
      fixture.replay.binding,
      fixture.replay.schedule,
    );
    const candidateDrive = Object.freeze({
      freeCalciumUMByWall: rhythmTrial.candidateFreeCalciumUMByWall,
    });
    const direct = stepMainWireFiveWallCoronaryV3(
      fixture.provider,
      directCold.acceptedState,
      {
        ...coronaryStepInput(),
        dtSec: 0.001,
        calciumDriveOverride: candidateDrive,
      },
    );
    const integrated = stepMainWireIntegratedModelV1(
      fixture.provider,
      fixture.cold.acceptedState,
      integratedStepInput(fixture, 0.001),
    );
    expect(direct.converged).toBe(true);
    expect(integrated.converged).toBe(true);
    if (!direct.converged || !integrated.converged) return;
    expect(integrated.acceptedState.coronary).toEqual(direct.acceptedState);
    expect(integrated.calciumDrive).toEqual(candidateDrive);
    expect(integrated.acceptedState.dynamicMechanicalSupport
      .acceptedFlowMlPerSec).toEqual({
        LVAD: 0,
        IMPELLA: 0,
        VA_ECMO: 0,
        VV_ECMO: 0,
      });
  }, 60_000);

  it("matches the legacy algebraic active LVAD when all circuit inertances are zero", () => {
    const profile = syntheticProfile(inertance(), "zero-inertance");
    const config = createMechanicalSupportConfigV1({
      lvad: { enabled: true, speedRpm: 4_500 },
    });
    const fixture = integratedFixture({ profile, config });
    const rhythmTrial = evaluateAcceptedFiveWallRhythmCalciumTrialV1(
      fixture.replay.acceptedState,
      0.001,
      fixture.replay.binding,
      fixture.replay.schedule,
    );
    const candidateDrive = Object.freeze({
      freeCalciumUMByWall: rhythmTrial.candidateFreeCalciumUMByWall,
    });
    const legacy = stepMainWireFiveWallCoronaryV3(
      fixture.provider,
      fixture.cold.acceptedState.coronary,
      {
        ...coronaryStepInput(),
        dtSec: 0.001,
        calciumDriveOverride: candidateDrive,
        mechanicalSupport: { config, heartRateBpm: 60 },
      },
    );
    const dynamic = stepMainWireIntegratedModelV1(
      fixture.provider,
      fixture.cold.acceptedState,
      integratedStepInput(fixture, 0.001),
    );
    expect(legacy.converged).toBe(true);
    expect(dynamic.converged).toBe(true);
    if (!legacy.converged || !dynamic.converged) return;
    expect(dynamic.acceptedState.coronary).toEqual(legacy.acceptedState);
    expect(dynamic.dynamicMechanicalSupportTrial.pump.LVAD.flowLMin)
      .toBe(legacy.baseStep.circulationTrial.mechanicalSupport!
        .pump.LVAD.flowLMin);
    expect(dynamic.dynamicMechanicalSupportTrial
      .conservationResidualMlPerSec).toBe(0);
  }, 60_000);

  it("clips at the next complete rhythm batch and rejects crossing atomically", () => {
    const fixture = integratedFixture({
      profile: syntheticProfile(inertance(), "event-boundary"),
    });
    const context = rhythmContext(fixture.replay);
    const maximum = maximumMainWireIntegratedModelStepDurationV1(
      fixture.cold.acceptedState,
      0.02,
      context,
      fixture.profile,
      fixture.config,
    );
    expect(maximum.maximumStepSec).toBe(
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1
        .ventricular.electricalToCalciumDelaySec,
    );
    expect(maximum.clippedByRhythmEvent).toBe(true);
    expect(maximum.clippedByCoronaryWindow).toBe(false);
    const before = JSON.stringify(fixture.cold.acceptedState);
    const crossing = stepMainWireIntegratedModelV1(
      fixture.provider,
      fixture.cold.acceptedState,
      integratedStepInput(fixture, 0.02),
    );
    expect(crossing.converged).toBe(false);
    if (crossing.converged === true) return;
    expect(crossing.reason)
      .toBe("outer-input-clock-profile-or-boundary-rejected");
    expect(crossing.rollbackState).toBe(fixture.cold.acceptedState);
    expect(allCommitFlagsFalse(crossing)).toBe(true);
    expect(JSON.stringify(fixture.cold.acceptedState)).toBe(before);

    const boundary = stepMainWireIntegratedModelV1(
      fixture.provider,
      fixture.cold.acceptedState,
      integratedStepInput(fixture, maximum.maximumStepSec),
    );
    expect(boundary.converged).toBe(true);
    if (!boundary.converged) return;
    expect(boundary.rhythmTrial.activationEvents).toHaveLength(1);
    expect(boundary.rhythmTrial.activationEvents[0]!.targetIds)
      .toEqual(["LVFW", "RVFW", "SEP"]);
    expect(boundary.acceptedState.revision).toBe(1);
    expect(boundary.acceptedState.coronary.revision).toBe(1);
    expect(boundary.acceptedState.rhythmCalcium.revision).toBe(1);
    expect(boundary.acceptedState.acceptedTimeSec)
      .toBe(maximum.maximumStepSec);
    expect(boundary.acceptedState.coronary.acceptedTimeSec)
      .toBe(boundary.acceptedState.acceptedTimeSec);
    expect(boundary.acceptedState.rhythmCalcium.acceptedTimeSec)
      .toBe(boundary.acceptedState.acceptedTimeSec);
  }, 60_000);

  it("uses one immutable q_n on retries and promotes q only on success", () => {
    const profile = syntheticProfile(inertance({
      pumpInternalMmHgSec2PerMl: 0.04,
      drainageMmHgSec2PerMl: 0.02,
      returnPathMmHgSec2PerMl: 0.04,
    }), "retry");
    const fixture = integratedFixture({
      profile,
      config: createMechanicalSupportConfigV1({
        lvad: { enabled: true, speedRpm: 5_200 },
      }),
      initialAcceptedFlowMlPerSec: {
        LVAD: 50,
        IMPELLA: 0,
        VA_ECMO: 0,
        VV_ECMO: 0,
      },
    });
    const before = JSON.stringify(fixture.cold.acceptedState);
    const input = integratedStepInput(fixture, 0.001);
    const first = stepMainWireIntegratedModelV1(
      fixture.provider,
      fixture.cold.acceptedState,
      input,
    );
    const retry = stepMainWireIntegratedModelV1(
      fixture.provider,
      fixture.cold.acceptedState,
      input,
    );
    expect(first.converged).toBe(true);
    expect(retry).toEqual(first);
    expect(JSON.stringify(fixture.cold.acceptedState)).toBe(before);
    if (!first.converged) return;
    expect(first.dynamicMechanicalSupportTrial.pump.LVAD
      .previousAcceptedFlowMlPerSec).toBe(50);
    expect(first.acceptedState.dynamicMechanicalSupport.acceptedFlowMlPerSec
      .LVAD).toBe(first.dynamicMechanicalSupportTrial.pump.LVAD.flowMlPerSec);
  }, 60_000);

  it("rejects live profile/structure substitution and legacy MCS with rollback", () => {
    const fixture = integratedFixture({
      profile: syntheticProfile(inertance(), "rollback"),
    });
    const foreignProfile = syntheticProfile(inertance({
      pumpInternalMmHgSec2PerMl: 0.1,
    }), "foreign");
    const foreign = stepMainWireIntegratedModelV1(
      fixture.provider,
      fixture.cold.acceptedState,
      {
        ...integratedStepInput(fixture, 0.001),
        dynamicMechanicalSupport: {
          ...integratedStepInput(fixture, 0.001).dynamicMechanicalSupport,
          profile: foreignProfile,
        },
      },
    );
    expect(foreign.converged).toBe(false);
    if (foreign.converged === true) return;
    expect(foreign.rollbackState).toBe(fixture.cold.acceptedState);
    expect(allCommitFlagsFalse(foreign)).toBe(true);
    expect(foreign.message).toMatch(/profile.*mismatch/);

    const sameClaimAlteredProfile = createDynamicMechanicalSupportInertanceProfileV1({
      profileId: fixture.profile.profileId,
      profileBindingSha256: fixture.profile.profileBindingSha256,
      deviceProfileBindingByDevice: fixture.profile.deviceProfileBindingByDevice,
      inertanceByDevice: Object.freeze({
        ...fixture.profile.inertanceByDevice,
        LVAD: inertance({ pumpInternalMmHgSec2PerMl: 0.2 }),
      }),
    });
    const sameClaimSubstitution = stepMainWireIntegratedModelV1(
      fixture.provider,
      fixture.cold.acceptedState,
      {
        ...integratedStepInput(fixture, 0.001),
        dynamicMechanicalSupport: {
          ...integratedStepInput(fixture, 0.001).dynamicMechanicalSupport,
          profile: sameClaimAlteredProfile,
        },
      },
    );
    expect(sameClaimSubstitution.converged).toBe(false);
    if (sameClaimSubstitution.converged === true) return;
    expect(sameClaimSubstitution.message).toMatch(/profile content mismatch/);
    expect(sameClaimSubstitution.rollbackState).toBe(fixture.cold.acceptedState);
    expect(allCommitFlagsFalse(sameClaimSubstitution)).toBe(true);

    const alteredStructuralConfig = Object.freeze({
      ...fixture.config,
      lvad: Object.freeze({
        ...fixture.config.lvad,
        returnPath: Object.freeze({
          ...fixture.config.lvad.returnPath,
          linearResistanceMmHgSecPerMl:
            fixture.config.lvad.returnPath.linearResistanceMmHgSecPerMl + 0.01,
        }),
      }),
    });
    const structuralSubstitution = stepMainWireIntegratedModelV1(
      fixture.provider,
      fixture.cold.acceptedState,
      {
        ...integratedStepInput(fixture, 0.001),
        dynamicMechanicalSupport: {
          ...integratedStepInput(fixture, 0.001).dynamicMechanicalSupport,
          config: alteredStructuralConfig,
        },
      },
    );
    expect(structuralSubstitution.converged).toBe(false);
    if (structuralSubstitution.converged === true) return;
    expect(structuralSubstitution.message).toMatch(/structural hydraulic config mismatch/);
    expect(structuralSubstitution.rollbackState).toBe(fixture.cold.acceptedState);
    expect(allCommitFlagsFalse(structuralSubstitution)).toBe(true);

    const baseLegacyInput = integratedStepInput(fixture, 0.001);
    const legacyInput = {
      ...baseLegacyInput,
      coronary: {
        ...baseLegacyInput.coronary,
        mechanicalSupport: {
          config: fixture.config,
          heartRateBpm: 60,
        },
      },
    } as unknown as {
      dtSec: number;
      coronary: Record<string, unknown>;
      rhythm: typeof fixture.cold.acceptedState.rhythmCalcium extends never
        ? never
        : ReturnType<typeof rhythmContext>;
      dynamicMechanicalSupport:
        ReturnType<typeof integratedStepInput>["dynamicMechanicalSupport"];
    };
    const rejectedLegacy = stepMainWireIntegratedModelV1(
      fixture.provider,
      fixture.cold.acceptedState,
      legacyInput as never,
    );
    expect(rejectedLegacy.converged).toBe(false);
    if (rejectedLegacy.converged === true) return;
    expect(rejectedLegacy.message).toMatch(/rejects legacy algebraic/);
    expect(rejectedLegacy.rollbackState).toBe(fixture.cold.acceptedState);
    expect(allCommitFlagsFalse(rejectedLegacy)).toBe(true);
  });

  it("keeps synthetic inertance and phase-based IABP outside release claims", () => {
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V1
      .syntheticInertanceProfiles).toBe("test-only-not-release-approved");
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V1
      .releaseApprovedDynamicInertanceProfileIncluded).toBe(false);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V1.iabpTiming)
      .toMatch(/phase-derived-provisional/);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V1
      .iabpRhythmSynchronizationClaimed).toBe(false);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V1
      .legacyAlgebraicMcsAcceptedInIntegratedLane).toBe(false);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V1.simulationReady)
      .toBe(false);
  });
});

type Fixture = Readonly<{
  provider: WholeHeartMechanicsProviderV1<
    TestState,
    MainWireFiveWallFreeCalciumDriveV1
  >;
  replay: PeriodicSinusFiveWallRhythmCalciumReplayV1;
  profile: DynamicMechanicalSupportInertanceProfileV1;
  config: MechanicalSupportConfigV1;
  cold: MainWireIntegratedModelColdResultV1<TestState>;
}>;

function integratedFixture(options: Readonly<{
  profile: DynamicMechanicalSupportInertanceProfileV1;
  config?: MechanicalSupportConfigV1;
  initialAcceptedFlowMlPerSec?: Readonly<Record<
    RotarySupportDeviceIdV1,
    number
  >>;
}>): Fixture {
  const provider = testProvider();
  const replay = createPeriodicSinusFiveWallRhythmCalciumReplayV1(
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    {
      scheduleId: `integrated-rhythm-${options.profile.profileId}`,
      bindingId: `integrated-binding-${options.profile.profileId}`,
      acceptedTimeSec: 0,
      endTimeSec: 2,
      revision: 0,
    },
  );
  const config = options.config ?? createMechanicalSupportConfigV1();
  const dynamicMechanicalSupport = {
    config,
    heartRateBpm: 60,
    profile: options.profile,
    ...(options.initialAcceptedFlowMlPerSec === undefined
      ? {}
      : {
        initialAcceptedFlowMlPerSec:
          options.initialAcceptedFlowMlPerSec,
      }),
  };
  const cold = initializeMainWireIntegratedModelV1({
    coronary: {
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    },
    rhythm: {
      ...rhythmContext(replay),
      acceptedState: replay.acceptedState,
    },
    dynamicMechanicalSupport,
  });
  return Object.freeze({ provider, replay, profile: options.profile, config, cold });
}

function rhythmContext(replay: PeriodicSinusFiveWallRhythmCalciumReplayV1) {
  return Object.freeze({ binding: replay.binding, schedule: replay.schedule });
}

function coronaryStepInput() {
  return Object.freeze({
    runtime: RUNTIME,
    calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    pericardium: PERICARDIUM,
  });
}

function integratedStepInput(fixture: Fixture, dtSec: number) {
  return Object.freeze({
    dtSec,
    coronary: coronaryStepInput(),
    rhythm: rhythmContext(fixture.replay),
    dynamicMechanicalSupport: Object.freeze({
      config: fixture.config,
      heartRateBpm: 60,
      profile: fixture.profile,
    }),
  });
}

/** Synthetic numerical fixture only; no release or clinical claim. */
function syntheticProfile(
  sameInertance: DynamicRotaryPumpCircuitInertanceV1,
  suffix: string,
): DynamicMechanicalSupportInertanceProfileV1 {
  return createDynamicMechanicalSupportInertanceProfileV1({
    profileId: `integrated-test-only-${suffix}-not-release-approved`,
    profileBindingSha256: "a".repeat(64),
    deviceProfileBindingByDevice: Object.freeze({
      LVAD: deviceBinding("LVAD", suffix, "1"),
      IMPELLA: deviceBinding("IMPELLA", suffix, "2"),
      VA_ECMO: deviceBinding("VA_ECMO", suffix, "3"),
      VV_ECMO: deviceBinding("VV_ECMO", suffix, "4"),
    }),
    inertanceByDevice: Object.freeze({
      LVAD: sameInertance,
      IMPELLA: sameInertance,
      VA_ECMO: sameInertance,
      VV_ECMO: sameInertance,
    }),
  });
}

function deviceBinding(
  deviceId: RotarySupportDeviceIdV1,
  suffix: string,
  hex: string,
) {
  return createDynamicMechanicalSupportDeviceProfileBindingV1({
    deviceId,
    circuitProfileId:
      `integrated-test-only-${deviceId.toLowerCase()}-${suffix}`,
    circuitProfileBindingSha256: hex.repeat(64),
  });
}

function inertance(
  overrides: Partial<DynamicRotaryPumpCircuitInertanceV1> = {},
): DynamicRotaryPumpCircuitInertanceV1 {
  return Object.freeze({
    unitSystemId: DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
    pumpInternalMmHgSec2PerMl: 0,
    drainageMmHgSec2PerMl: 0,
    oxygenatorMmHgSec2PerMl: 0,
    returnPathMmHgSec2PerMl: 0,
    ...overrides,
  });
}

function testProvider(): WholeHeartMechanicsProviderV1<
  TestState,
  MainWireFiveWallFreeCalciumDriveV1
> {
  const evaluate = (
    timeSec: number,
    volumes: Readonly<{ LA: number; LV: number; RA: number; RV: number }>,
    drive: MainWireFiveWallFreeCalciumDriveV1,
  ) => {
    const wall = (landActiveKirchhoffStressPa: number) => Object.freeze({
      adapterId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
      landActiveKirchhoffStressPa,
    });
    return Object.freeze({
      materialState: Object.freeze({
        timeSec,
        volumeSumMl: volumes.LA + volumes.LV + volumes.RA + volumes.RV,
        calciumSumUM: sumCalcium(drive),
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
    providerId: "integrated-model-test-provider",
    parameterSetId: "integrated-model-test-prior",
    parameterIdentityHash: "integrated-model-test-hash",
    stateSchemaVersion: 1,
    stateCodec: Object.freeze({
      clone: (state: TestState) => Object.freeze({ ...state }),
      encode: (state: TestState) => Object.freeze({ ...state }),
      decode: (encoded: unknown) => Object.freeze({
        ...(encoded as TestState),
      }),
    }),
    initializeCold: (input) => evaluate(
      input.timeSec,
      input.volumesMl,
      input.drivingInputs,
    ),
    evaluateTrial: (input) => evaluate(
      input.candidateTimeSec,
      input.candidateVolumesMl,
      input.drivingInputs,
    ),
  });
}

function sumCalcium(drive: MainWireFiveWallFreeCalciumDriveV1): number {
  return Object.values(drive.freeCalciumUMByWall)
    .reduce((sum, value) => sum + value, 0);
}

function allCommitFlagsFalse(value: Readonly<Record<string, unknown>>): boolean {
  return [
    "mechanicsCommitted",
    "circulationCommitted",
    "coronaryCommitted",
    "mvcReferenceCommitted",
    "autoregulationCommitted",
    "rhythmCalciumCommitted",
    "dynamicMechanicalSupportCommitted",
  ].every((key) => value[key] === false);
}
