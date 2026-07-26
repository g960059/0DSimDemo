import { describe, expect, it } from "vitest";

import { defaultParams } from "@/engine/core/params";
import {
  NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
} from "@/engine/coronary/mainWireCoronaryBoundaryV2";
import {
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
} from "@/engine/coronary/mainWireNormalAdultCoronaryV2";
import { createMechanicalSupportConfigV1 } from
  "@/engine/devices/defaultsV1";
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
  MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V1,
  checkpointMainWireIntegratedModelV1,
  restoreMainWireIntegratedModelV1,
  type MainWireIntegratedModelCheckpointContextV1,
  type MainWireIntegratedModelCheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV1";
import {
  initializeMainWireIntegratedModelV1,
  stepMainWireIntegratedModelV1,
  type MainWireIntegratedModelStepInputV1,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  createAcceptedFiveWallRhythmCalciumBindingV1,
  createPeriodicSinusFiveWallRhythmCalciumReplayV1,
  initializeAcceptedFiveWallRhythmCalciumStateV1,
} from "@/engine/myocardium/rhythm/acceptedFiveWallRhythmCalciumOwnerV1";
import {
  createAcceptedRhythmEventScheduleV1,
  sha256AcceptedRhythmEventScheduleIdentityV1,
} from "@/engine/myocardium/rhythm/acceptedRhythmEventScheduleV1";
import {
  MAIN_WIRE_FOUR_VALVE_NORMAL_PRESET_V1,
} from "@/engine/mechanics2/valve/MainWireFourValveDiseasePresetV1";
import { sha256CanonicalJsonHex } from "@/engine/scientific/release";

type Provider = ReturnType<
  typeof createCanonicalMainWireNormalAdultFiveWallProviderV1
>;
type WallState = ReturnType<Provider["initializeCold"]>["materialState"];

describe("main-wire integrated model checkpoint V1", () => {
  it("exactly resumes every owner mid-window, mid-interval, and at nonzero q", async () => {
    const fixture = integratedMidIntervalFixture();
    const checkpoint = await checkpointMainWireIntegratedModelV1(
      fixture.context,
      fixture.state,
    );
    const restored = await restoreMainWireIntegratedModelV1(
      fixture.context,
      JSON.parse(JSON.stringify(checkpoint)),
    );

    expect(restored).toEqual(fixture.state);
    expect(checkpoint.exactResumeClaim)
      .toEqual(MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V1);
    expect(checkpoint.coronary.coronaryAutoregulation).toMatchObject({
      acceptedDurationSec: 0.002,
      acceptedStepCount: 1,
    });
    expect(checkpoint.rhythmCalcium.rhythmSchedule.cursor).toBe(0);
    expect(checkpoint.rhythmCalcium.acceptedTimeSec).toBe(0.002);
    expect(Math.abs(
      checkpoint.dynamicMechanicalSupport.acceptedFlowMlPerSec.LVAD,
    )).toBeGreaterThan(0);
    expect(checkpoint.checkpointSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(checkpoint.coronary.checkpointSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(checkpoint.rhythmCalcium.checkpointSha256)
      .toMatch(/^[0-9a-f]{64}$/);
    expect(checkpoint.rhythmScheduleIdentitySha256).toBe(
      await sha256AcceptedRhythmEventScheduleIdentityV1(
        fixture.rhythmReplay.schedule,
      ),
    );
    expect(checkpoint.dynamicMechanicalSupportProfileIdentitySha256)
      .toMatch(/^[0-9a-f]{64}$/);
    expect(checkpoint.dynamicMechanicalSupportStructuralHydraulicIdentitySha256)
      .toMatch(/^[0-9a-f]{64}$/);

    const uninterrupted = stepMainWireIntegratedModelV1(
      fixture.provider,
      fixture.state,
      fixture.stepInput,
    );
    const resumed = stepMainWireIntegratedModelV1(
      fixture.provider,
      restored,
      fixture.stepInput,
    );
    expect(uninterrupted.converged).toBe(true);
    expect(resumed).toEqual(uninterrupted);
  }, 60_000);

  it("stores accepted q with detached profile and structural snapshots", async () => {
    const fixture = integratedMidIntervalFixture();
    const checkpoint = await checkpointMainWireIntegratedModelV1(
      fixture.context,
      fixture.state,
    );

    expect(Object.keys(checkpoint.dynamicMechanicalSupport)).toEqual([
      "stateSchemaId",
      "schemaVersion",
      "networkId",
      "unitSystemId",
      "inertanceProfileSnapshot",
      "structuralHydraulicProjection",
      "acceptedFlowMlPerSec",
    ]);
    expect("config" in checkpoint.dynamicMechanicalSupport).toBe(false);
    expect(checkpoint.dynamicMechanicalSupport.inertanceProfileSnapshot)
      .toEqual(fixture.profile);
    expect(checkpoint.dynamicMechanicalSupport.structuralHydraulicProjection
      .byDevice.LVAD.curve).toEqual(fixture.config.lvad.curve);
    expect(checkpoint.exactResumeClaim.dynamicMechanicalSupportProfileStored)
      .toBe(true);
    expect(checkpoint.exactResumeClaim
      .dynamicMechanicalSupportStructuralHydraulicConfigStored).toBe(true);
    expect(checkpoint.exactResumeClaim
      .dynamicMechanicalSupportFullDeviceConfigStored).toBe(false);
    expect(checkpoint.exactResumeClaim
      .dynamicMechanicalSupportControllerCommandStored).toBe(false);
    expect(checkpoint.exactResumeClaim.dynamicProfileReleaseApprovalClaimed)
      .toBe(false);
  }, 60_000);

  it("rejects outer and nested tampering even when the outer hash is replaced", async () => {
    const fixture = integratedMidIntervalFixture();
    const checkpoint = await checkpointMainWireIntegratedModelV1(
      fixture.context,
      fixture.state,
    );

    const qTamper = cloneCheckpoint(checkpoint);
    qTamper.dynamicMechanicalSupport.acceptedFlowMlPerSec.LVAD += 1;
    await expect(restoreMainWireIntegratedModelV1(
      fixture.context,
      qTamper,
    )).rejects.toThrow(/outer SHA-256 mismatch/);

    const nestedHashTamper = cloneCheckpoint(checkpoint);
    nestedHashTamper.rhythmCalcium.checkpointSha256 = "0".repeat(64);
    await rehashOuter(nestedHashTamper);
    await expect(restoreMainWireIntegratedModelV1(
      fixture.context,
      nestedHashTamper,
    )).rejects.toThrow(/rhythm-calcium checkpoint SHA-256 mismatch/);

    const nestedUnknown = cloneCheckpoint(checkpoint);
    nestedUnknown.coronary.unexpected = true;
    await rehashOuter(nestedUnknown);
    await expect(restoreMainWireIntegratedModelV1(
      fixture.context,
      nestedUnknown,
    )).rejects.toThrow(/checkpoint envelope keys mismatch/);

    const dynamicUnknown = cloneCheckpoint(checkpoint);
    dynamicUnknown.dynamicMechanicalSupport.unexpected = true;
    await rehashOuter(dynamicUnknown);
    await expect(restoreMainWireIntegratedModelV1(
      fixture.context,
      dynamicUnknown,
    )).rejects.toThrow(/accepted state must have the exact expected key set/);

    const sameClaimInertanceTamper = cloneCheckpoint(checkpoint);
    sameClaimInertanceTamper.dynamicMechanicalSupport.inertanceProfileSnapshot
      .inertanceByDevice.LVAD.pumpInternalMmHgSec2PerMl += 0.01;
    await rehashOuter(sameClaimInertanceTamper);
    await expect(restoreMainWireIntegratedModelV1(
      fixture.context,
      sameClaimInertanceTamper,
    )).rejects.toThrow(/serialized.*inertance profile content mismatch/);

    const structuralSnapshotTamper = cloneCheckpoint(checkpoint);
    structuralSnapshotTamper.dynamicMechanicalSupport
      .structuralHydraulicProjection.byDevice.LVAD.curve.shutoffHeadMmHg += 1;
    await rehashOuter(structuralSnapshotTamper);
    await expect(restoreMainWireIntegratedModelV1(
      fixture.context,
      structuralSnapshotTamper,
    )).rejects.toThrow(/serialized.*structural hydraulic content mismatch/);

    const outerUnknown = cloneCheckpoint(checkpoint);
    outerUnknown.unexpected = true;
    await expect(restoreMainWireIntegratedModelV1(
      fixture.context,
      outerUnknown,
    )).rejects.toThrow(/unexpected field set/);
  }, 60_000);

  it("rejects foreign rhythm, profile, structure, and any owner-clock split", async () => {
    const fixture = integratedMidIntervalFixture();
    const checkpoint = await checkpointMainWireIntegratedModelV1(
      fixture.context,
      fixture.state,
    );
    const foreignProfile = dynamicProfile("foreign-profile", "b");
    await expect(restoreMainWireIntegratedModelV1(
      Object.freeze({
        ...fixture.context,
        dynamicMechanicalSupportProfile: foreignProfile,
      }),
      checkpoint,
    )).rejects.toThrow(/dynamic MCS profile SHA-256 identity mismatch/);

    const sameClaimAlteredProfile = dynamicProfile(
      "integrated-checkpoint-synthetic",
      "a",
      0.08,
    );
    expect(sameClaimAlteredProfile.profileId).toBe(fixture.profile.profileId);
    expect(sameClaimAlteredProfile.profileBindingSha256)
      .toBe(fixture.profile.profileBindingSha256);
    const claimedProfileHashTamper = cloneCheckpoint(checkpoint);
    claimedProfileHashTamper
      .dynamicMechanicalSupportProfileIdentitySha256 =
        sameClaimAlteredProfile.profileBindingSha256;
    await rehashOuter(claimedProfileHashTamper);
    await expect(restoreMainWireIntegratedModelV1(
      Object.freeze({
        ...fixture.context,
        dynamicMechanicalSupportProfile: sameClaimAlteredProfile,
      }),
      claimedProfileHashTamper,
    )).rejects.toThrow(/dynamic MCS profile SHA-256 identity mismatch/);

    const alteredStructuralConfig = createMechanicalSupportConfigV1({
      lvad: {
        enabled: true,
        speedRpm: 4_500,
        curve: Object.freeze({
          ...fixture.config.lvad.curve,
          shutoffHeadMmHg: fixture.config.lvad.curve.shutoffHeadMmHg + 1,
        }),
      },
    });
    await expect(restoreMainWireIntegratedModelV1(
      Object.freeze({
        ...fixture.context,
        dynamicMechanicalSupportConfig: alteredStructuralConfig,
      }),
      checkpoint,
    )).rejects.toThrow(/structural hydraulic SHA-256 identity mismatch/);

    const commandOnlyConfig = createMechanicalSupportConfigV1({
      lvad: { enabled: false, circuitClamped: true, speedRpm: 5_500 },
      impella: { performanceLevel: 3 },
    });
    await expect(restoreMainWireIntegratedModelV1(
      Object.freeze({
        ...fixture.context,
        dynamicMechanicalSupportConfig: commandOnlyConfig,
      }),
      checkpoint,
    )).resolves.toEqual(fixture.state);

    const foreignRhythm = createPeriodicSinusFiveWallRhythmCalciumReplayV1(
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      {
        scheduleId: "foreign-integrated-schedule-v1",
        bindingId: "foreign-integrated-binding-v1",
        acceptedTimeSec: 0,
        endTimeSec: 1.5,
        revision: 0,
      },
    );
    await expect(restoreMainWireIntegratedModelV1(
      Object.freeze({
        ...fixture.context,
        rhythm: Object.freeze({
          binding: fixture.rhythmReplay.binding,
          schedule: foreignRhythm.schedule,
        }),
      }),
      checkpoint,
    )).rejects.toThrow(/rhythm schedule SHA-256 identity mismatch/);

    const foreignBinding = Object.freeze({
      ...fixture.rhythmReplay.binding,
      bindingId: "foreign-integrated-binding-v1",
    });
    await expect(restoreMainWireIntegratedModelV1(
      Object.freeze({
        ...fixture.context,
        rhythm: Object.freeze({
          binding: foreignBinding,
          schedule: fixture.rhythmReplay.schedule,
        }),
      }),
      checkpoint,
    )).rejects.toThrow(/binding mismatch/);

    const clockSplit = cloneCheckpoint(checkpoint);
    clockSplit.revision += 1;
    await rehashOuter(clockSplit);
    await expect(restoreMainWireIntegratedModelV1(
      fixture.context,
      clockSplit,
    )).rejects.toThrow(/nested owner clocks differ/);

    const timeSplit = cloneCheckpoint(checkpoint);
    timeSplit.acceptedTimeSec += 0.001;
    await rehashOuter(timeSplit);
    await expect(restoreMainWireIntegratedModelV1(
      fixture.context,
      timeSplit,
    )).rejects.toThrow(/nested owner clocks differ/);
  }, 60_000);

  it("requires the expected provider as an external restore input", async () => {
    const fixture = integratedMidIntervalFixture();
    const checkpoint = await checkpointMainWireIntegratedModelV1(
      fixture.context,
      fixture.state,
    );
    const missingProvider = {
      ...fixture.context,
      provider: undefined,
    } as unknown as MainWireIntegratedModelCheckpointContextV1<WallState>;
    await expect(restoreMainWireIntegratedModelV1(
      missingProvider,
      checkpoint,
    )).rejects.toThrow(/expected provider is required/);
  }, 60_000);

  it("rejects a full-schedule substitution across a real legacy FNV32 collision", async () => {
    const collision = collisionRhythmPair();
    const fixture = integratedMidIntervalFixture(collision.acceptedA);
    const checkpoint = await checkpointMainWireIntegratedModelV1(
      fixture.context,
      fixture.state,
    );

    expect(collision.scheduleA.scheduleFingerprint).toBe("35ae52de");
    expect(collision.scheduleB.scheduleFingerprint).toBe("35ae52de");
    expect(await sha256AcceptedRhythmEventScheduleIdentityV1(
      collision.scheduleA,
    )).toBe("dfa6e904fd04f889a16d70fcdd2613888702cd178748130ef6bec2c126ad515f");
    expect(await sha256AcceptedRhythmEventScheduleIdentityV1(
      collision.scheduleB,
    )).toBe("2ef04326da53558355f920d515844873c796ee027ee678a1b50b7a6fc12dde68");

    await expect(restoreMainWireIntegratedModelV1(
      Object.freeze({
        ...fixture.context,
        rhythm: Object.freeze({
          binding: collision.binding,
          schedule: collision.scheduleB,
        }),
      }),
      checkpoint,
    )).rejects.toThrow(/rhythm schedule SHA-256 identity mismatch/);
  }, 60_000);
});

function integratedMidIntervalFixture(
  rhythmOverride?: Readonly<{
    binding: ReturnType<
      typeof createPeriodicSinusFiveWallRhythmCalciumReplayV1
    >["binding"];
    schedule: ReturnType<
      typeof createPeriodicSinusFiveWallRhythmCalciumReplayV1
    >["schedule"];
    acceptedState: ReturnType<
      typeof createPeriodicSinusFiveWallRhythmCalciumReplayV1
    >["acceptedState"];
  }>,
) {
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
  const runtime = testRuntime();
  const pericardium = createMainWireNormalAdultCommonPericardiumV1();
  const rhythmReplay = rhythmOverride
    ?? createPeriodicSinusFiveWallRhythmCalciumReplayV1(
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    {
      scheduleId: "integrated-checkpoint-sinus-schedule-v1",
      bindingId: "integrated-checkpoint-sinus-binding-v1",
      acceptedTimeSec: 0,
      endTimeSec: 1.5,
      revision: 0,
    },
  );
  const rhythm = Object.freeze({
    binding: rhythmReplay.binding,
    schedule: rhythmReplay.schedule,
  });
  const profile = dynamicProfile("integrated-checkpoint-synthetic", "a");
  const config = activeLvadConfig();
  const cold = initializeMainWireIntegratedModelV1({
    coronary: {
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    },
    rhythm: {
      ...rhythm,
      acceptedState: rhythmReplay.acceptedState,
    },
    dynamicMechanicalSupport: {
      config,
      heartRateBpm: 60,
      profile,
      initialAcceptedFlowMlPerSec: {
        LVAD: 25,
        IMPELLA: 0,
        VA_ECMO: 0,
        VV_ECMO: 0,
      },
    },
  });
  const stepInput = Object.freeze({
    dtSec: 0.002,
    coronary: Object.freeze({
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    }),
    rhythm,
    dynamicMechanicalSupport: Object.freeze({
      config,
      heartRateBpm: 60,
      profile,
    }),
  }) satisfies MainWireIntegratedModelStepInputV1;
  const stepped = stepMainWireIntegratedModelV1(
    provider,
    cold.acceptedState,
    stepInput,
  );
  if (stepped.converged === false) throw new Error(stepped.message);
  const context = Object.freeze({
    provider,
    coronaryPrior: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
    collapseHydraulics:
      MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
    impMechanism: "cep-shortening-induced" as const,
    shorteningImpPrior:
      NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
    coronaryAutoregulationBinding:
      stepped.acceptedState.coronary.coronaryAutoregulationBinding,
    rhythm,
    dynamicMechanicalSupportProfile: profile,
    dynamicMechanicalSupportConfig: config,
  }) satisfies MainWireIntegratedModelCheckpointContextV1<WallState>;
  return Object.freeze({
    provider,
    runtime,
    pericardium,
    rhythmReplay,
    profile,
    config,
    state: stepped.acceptedState,
    context,
    stepInput,
  });
}

function collisionRhythmPair() {
  const commonEvent = Object.freeze({
    sourceId: "s",
    sourceSequence: 0,
    priority: 0,
    beatId: "b",
    beatOrdinal: 1,
    morphology: "sinus" as const,
    targetIds: Object.freeze(["LA"]),
    activationStrength01: 1,
  });
  const scheduleA = createAcceptedRhythmEventScheduleV1(
    "collision-demo",
    [Object.freeze({
      ...commonEvent,
      eventId: "a-umrlkd-1g0d6u8",
      activationTimeSec: 1,
    })],
  );
  const scheduleB = createAcceptedRhythmEventScheduleV1(
    "collision-demo",
    [Object.freeze({
      ...commonEvent,
      eventId: "b-1q3bt6k-36m2q7",
      activationTimeSec: 2,
    })],
  );
  const seed = createPeriodicSinusFiveWallRhythmCalciumReplayV1(
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    {
      scheduleId: "collision-seed-schedule-v1",
      bindingId: "collision-seed-binding-v1",
      acceptedTimeSec: 0,
      endTimeSec: 3,
      revision: 0,
    },
  );
  const binding = createAcceptedFiveWallRhythmCalciumBindingV1(
    scheduleA,
    {
      bindingId: "collision-integrated-binding-v1",
      scheduleCoverageStartTimeSec: 0,
      scheduleCoverageEndTimeSec: 3,
      calciumParametersByWall: seed.binding.calciumParametersByWall,
      parameterProvenance: seed.binding.parameterProvenance,
      sourceParameterSetId: seed.binding.sourceParameterSetId,
    },
  );
  const acceptedState = initializeAcceptedFiveWallRhythmCalciumStateV1(
    binding,
    scheduleA,
    {
      acceptedTimeSec: 0,
      revision: 0,
      initialization: seed.acceptedState.initialization,
      calciumStateByWall: seed.acceptedState.calciumStateByWall,
    },
  );
  return Object.freeze({
    scheduleA,
    scheduleB,
    binding,
    acceptedA: Object.freeze({
      binding,
      schedule: scheduleA,
      acceptedState,
    }),
  });
}

function activeLvadConfig(): MechanicalSupportConfigV1 {
  return createMechanicalSupportConfigV1({
    lvad: { enabled: true, speedRpm: 4_500 },
  });
}

function dynamicProfile(
  profileId: string,
  digestHex: string,
  pumpInternalMmHgSec2PerMl = 0.04,
): DynamicMechanicalSupportInertanceProfileV1 {
  const circuit = inertance({
    pumpInternalMmHgSec2PerMl,
    drainageMmHgSec2PerMl: 0.02,
    returnPathMmHgSec2PerMl: 0.04,
  });
  return createDynamicMechanicalSupportInertanceProfileV1({
    profileId: `${profileId}-not-release-approved`,
    profileBindingSha256: digestHex.repeat(64),
    deviceProfileBindingByDevice: Object.freeze({
      LVAD: deviceBinding("LVAD", "1"),
      IMPELLA: deviceBinding("IMPELLA", "2"),
      VA_ECMO: deviceBinding("VA_ECMO", "3"),
      VV_ECMO: deviceBinding("VV_ECMO", "4"),
    }),
    inertanceByDevice: Object.freeze({
      LVAD: circuit,
      IMPELLA: circuit,
      VA_ECMO: circuit,
      VV_ECMO: circuit,
    }),
  });
}

function deviceBinding(deviceId: RotarySupportDeviceIdV1, hex: string) {
  return createDynamicMechanicalSupportDeviceProfileBindingV1({
    deviceId,
    circuitProfileId:
      `integrated-checkpoint-${deviceId.toLowerCase()}-synthetic-not-approved`,
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

function testRuntime() {
  const params = defaultParams();
  return Object.freeze({
    vascular: Object.freeze({
      venousTone: params.venousTone,
      arterialStiffness: params.arterialStiffness,
    }),
    losses: Object.freeze({
      systemicResistance: params.systemicResistance,
      pulmonaryResistance: params.pulmonaryResistance,
    }),
    respiratory: Object.freeze({
      PEEP: 0,
      Pth0: 0,
      respAmpTh: 0,
      respAmpAlv: 0,
      respRate: 0,
    }),
    valvePreset: MAIN_WIRE_FOUR_VALVE_NORMAL_PRESET_V1,
  });
}

function cloneCheckpoint(
  checkpoint: MainWireIntegratedModelCheckpointV1,
): any {
  return JSON.parse(JSON.stringify(checkpoint));
}

async function rehashOuter(checkpoint: any): Promise<void> {
  const { checkpointSha256: _old, ...payload } = checkpoint;
  checkpoint.checkpointSha256 = await sha256CanonicalJsonHex(payload);
}
