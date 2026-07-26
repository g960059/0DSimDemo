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
  MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V2,
  checkpointMainWireIntegratedModelV2,
  restoreMainWireIntegratedModelV2,
  type MainWireIntegratedModelCheckpointContextV2,
  type MainWireIntegratedModelCheckpointV2,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV2";
import {
  initializeMainWireIntegratedModelV2,
  stepMainWireIntegratedModelV2,
  type MainWireIntegratedModelStepInputV2,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV2";
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
  createAcceptedGeneratedFiveWallRhythmCalciumBindingV1,
  createGeneratedPeriodicSinusFiveWallRhythmCalciumOwnerV1,
} from "@/engine/myocardium/rhythm/acceptedGeneratedFiveWallRhythmCalciumOwnerV1";
import {
  MAIN_WIRE_FOUR_VALVE_NORMAL_PRESET_V1,
} from "@/engine/mechanics2/valve/MainWireFourValveDiseasePresetV1";
import { sha256CanonicalJsonHex } from "@/engine/scientific/release";

type Provider = ReturnType<
  typeof createCanonicalMainWireNormalAdultFiveWallProviderV1
>;
type WallState = ReturnType<Provider["initializeCold"]>["materialState"];

describe("main-wire generated-rhythm integrated model checkpoint V2", () => {
  it("exactly resumes mid-pending, mid-window, and at nonzero q across the first effective event", async () => {
    const fixture = integratedMidPendingFixture();
    const checkpoint = await checkpointMainWireIntegratedModelV2(
      fixture.context,
      fixture.state,
    );
    const restored = await restoreMainWireIntegratedModelV2(
      fixture.context,
      JSON.parse(JSON.stringify(checkpoint)),
    );

    expect(restored).toEqual(fixture.state);
    expect(checkpoint.exactResumeClaim)
      .toEqual(MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V2);
    expect(checkpoint.coronary.coronaryAutoregulation).toMatchObject({
      acceptedDurationSec: 0.006,
      acceptedStepCount: 3,
    });
    expect(checkpoint.generatedRhythmCalcium.acceptedTimeSec).toBe(0.006);
    expect(checkpoint.generatedRhythmCalcium.generatorCheckpoint
      .pendingActivationEvents).toHaveLength(1);
    expect(checkpoint.generatedRhythmCalcium.generatorCheckpoint
      .pendingActivationEvents[0]!.activationTimeSec).toBe(
        FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.ventricular
          .electricalToCalciumDelaySec,
      );
    expect(Math.abs(
      checkpoint.dynamicMechanicalSupport.acceptedFlowMlPerSec.LVAD,
    )).toBeGreaterThan(0);
    expect(checkpoint.checkpointSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(checkpoint.coronary.checkpointSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(checkpoint.generatedRhythmCalcium.checkpointSha256)
      .toMatch(/^[0-9a-f]{64}$/);
    expect(checkpoint.generatedRhythmBindingIdentitySha256)
      .toMatch(/^[0-9a-f]{64}$/);

    let uninterrupted = fixture.state;
    let resumed = restored;
    let eventCount = 0;
    for (let index = 0; index < 4; index += 1) {
      const direct = stepMainWireIntegratedModelV2(
        fixture.provider,
        uninterrupted,
        fixture.stepInput(0.002),
      );
      const fromCheckpoint = stepMainWireIntegratedModelV2(
        fixture.provider,
        resumed,
        fixture.stepInput(0.002),
      );
      expect(direct.converged).toBe(true);
      expect(fromCheckpoint).toEqual(direct);
      if (!direct.converged || !fromCheckpoint.converged) return;
      eventCount += direct.generatedRhythmTrial.activationEvents.length;
      uninterrupted = direct.acceptedState;
      resumed = fromCheckpoint.acceptedState;
    }
    expect(eventCount).toBe(1);
    expect(uninterrupted.acceptedTimeSec).toBe(0.014);
    expect(resumed).toEqual(uninterrupted);
  }, 60_000);

  it("rejects outer, nested-owner, nested-generator, snapshot, claim, and envelope tampering", async () => {
    const fixture = integratedMidPendingFixture();
    const checkpoint = await checkpointMainWireIntegratedModelV2(
      fixture.context,
      fixture.state,
    );

    const qTamper = cloneCheckpoint(checkpoint);
    qTamper.dynamicMechanicalSupport.acceptedFlowMlPerSec.LVAD += 1;
    await expect(restoreMainWireIntegratedModelV2(
      fixture.context,
      qTamper,
    )).rejects.toThrow(/outer SHA-256 mismatch/);

    const ownerHashTamper = cloneCheckpoint(checkpoint);
    ownerHashTamper.generatedRhythmCalcium.checkpointSha256 = "0".repeat(64);
    await rehashOuter(ownerHashTamper);
    await expect(restoreMainWireIntegratedModelV2(
      fixture.context,
      ownerHashTamper,
    )).rejects.toThrow(/generated owner checkpoint SHA-256 mismatch/);

    const generatorTamper = cloneCheckpoint(checkpoint);
    generatorTamper.generatedRhythmCalcium.generatorCheckpoint
      .pendingActivationEvents[0].activationStrength01 = 0.5;
    await rehashGeneratedOwner(generatorTamper.generatedRhythmCalcium);
    await rehashOuter(generatorTamper);
    await expect(restoreMainWireIntegratedModelV2(
      fixture.context,
      generatorTamper,
    )).rejects.toThrow(/generator checkpoint SHA-256 mismatch/);

    const structuralSnapshotTamper = cloneCheckpoint(checkpoint);
    structuralSnapshotTamper.dynamicMechanicalSupport
      .structuralHydraulicProjection.byDevice.LVAD.curve.shutoffHeadMmHg += 1;
    await rehashOuter(structuralSnapshotTamper);
    await expect(restoreMainWireIntegratedModelV2(
      fixture.context,
      structuralSnapshotTamper,
    )).rejects.toThrow(/serialized.*structural hydraulic content mismatch/);

    const suctionSnapshotTamper = cloneCheckpoint(checkpoint);
    suctionSnapshotTamper.dynamicMechanicalSupport
      .structuralHydraulicProjection.byDevice.LVAD.inletSuction = {
        kind: "none",
      };
    await rehashOuter(suctionSnapshotTamper);
    await expect(restoreMainWireIntegratedModelV2(
      fixture.context,
      suctionSnapshotTamper,
    )).rejects.toThrow(/serialized.*structural hydraulic content mismatch/);

    const evidenceSnapshotTamper = cloneCheckpoint(checkpoint);
    evidenceSnapshotTamper.dynamicMechanicalSupport
      .structuralHydraulicProjection.byDevice.LVAD
      .forwardFlowEvidenceDomain = {
        publishedExperimentalTraversalUpperLMin: 9,
        advertisedCapacityLMin: 10,
      };
    await rehashOuter(evidenceSnapshotTamper);
    await expect(restoreMainWireIntegratedModelV2(
      fixture.context,
      evidenceSnapshotTamper,
    )).rejects.toThrow(/serialized.*structural hydraulic content mismatch/);

    const claimTamper = cloneCheckpoint(checkpoint);
    claimTamper.exactResumeClaim.simulationReady = true;
    await rehashOuter(claimTamper);
    await expect(restoreMainWireIntegratedModelV2(
      fixture.context,
      claimTamper,
    )).rejects.toThrow(/checkpoint claim mismatch/);

    const unknown = cloneCheckpoint(checkpoint);
    unknown.unexpected = true;
    await expect(restoreMainWireIntegratedModelV2(
      fixture.context,
      unknown,
    )).rejects.toThrow(/unexpected field set/);
  }, 60_000);

  it("rejects same-ID content substitutions while allowing command-only MCS changes", async () => {
    const fixture = integratedMidPendingFixture();
    const checkpoint = await checkpointMainWireIntegratedModelV2(
      fixture.context,
      fixture.state,
    );

    const calcium = fixture.generated.binding.calciumParametersByWall;
    const alteredBinding =
      createAcceptedGeneratedFiveWallRhythmCalciumBindingV1({
        bindingId: fixture.generated.binding.bindingId,
        generatorConfig: fixture.generated.binding.generatorConfig,
        calciumParametersByWall: Object.freeze({
          ...calcium,
          LVFW: Object.freeze({
            ...calcium.LVFW,
            calciumGainUMPerUnitDrive:
              calcium.LVFW.calciumGainUMPerUnitDrive + 0.001,
          }),
        }),
        parameterProvenance: fixture.generated.binding.parameterProvenance,
        sourceParameterSetId: fixture.generated.binding.sourceParameterSetId,
      });
    await expect(restoreMainWireIntegratedModelV2(
      Object.freeze({
        ...fixture.context,
        rhythm: Object.freeze({ binding: alteredBinding }),
      }),
      checkpoint,
    )).rejects.toThrow(/rhythm binding SHA-256 identity mismatch/);

    const alteredProfile = dynamicProfile(
      "generated-integrated-checkpoint-synthetic",
      "a",
      0.08,
    );
    expect(alteredProfile.profileId).toBe(fixture.profile.profileId);
    expect(alteredProfile.profileBindingSha256)
      .toBe(fixture.profile.profileBindingSha256);
    await expect(restoreMainWireIntegratedModelV2(
      Object.freeze({
        ...fixture.context,
        dynamicMechanicalSupportProfile: alteredProfile,
      }),
      checkpoint,
    )).rejects.toThrow(/dynamic MCS profile SHA-256 identity mismatch/);

    const alteredStructure = createMechanicalSupportConfigV1({
      lvad: {
        enabled: true,
        speedRpm: 4_500,
        curve: Object.freeze({
          ...fixture.config.lvad.curve,
          shutoffHeadMmHg: fixture.config.lvad.curve.shutoffHeadMmHg + 1,
        }),
      },
    });
    await expect(restoreMainWireIntegratedModelV2(
      Object.freeze({
        ...fixture.context,
        dynamicMechanicalSupportConfig: alteredStructure,
      }),
      checkpoint,
    )).rejects.toThrow(/structural hydraulic SHA-256 identity mismatch/);

    const alteredSuction = createMechanicalSupportConfigV1({
      lvad: { inletSuction: Object.freeze({ kind: "none" }) },
    });
    await expect(restoreMainWireIntegratedModelV2(
      Object.freeze({
        ...fixture.context,
        dynamicMechanicalSupportConfig: alteredSuction,
      }),
      checkpoint,
    )).rejects.toThrow(/structural hydraulic SHA-256 identity mismatch/);

    const alteredEvidence = createMechanicalSupportConfigV1({
      lvad: {
        forwardFlowEvidenceDomain: Object.freeze({
          publishedExperimentalTraversalUpperLMin: 9,
          advertisedCapacityLMin: 10,
        }),
      },
    });
    await expect(restoreMainWireIntegratedModelV2(
      Object.freeze({
        ...fixture.context,
        dynamicMechanicalSupportConfig: alteredEvidence,
      }),
      checkpoint,
    )).rejects.toThrow(/structural hydraulic SHA-256 identity mismatch/);

    const commandOnlyConfig = createMechanicalSupportConfigV1({
      lvad: { enabled: false, circuitClamped: true, speedRpm: 5_500 },
      impella: { performanceLevel: 3 },
    });
    await expect(restoreMainWireIntegratedModelV2(
      Object.freeze({
        ...fixture.context,
        dynamicMechanicalSupportConfig: commandOnlyConfig,
      }),
      checkpoint,
    )).resolves.toEqual(fixture.state);
  }, 60_000);

  it("rejects every outer or nested clock split and requires the provider", async () => {
    const fixture = integratedMidPendingFixture();
    const checkpoint = await checkpointMainWireIntegratedModelV2(
      fixture.context,
      fixture.state,
    );

    const outerSplit = cloneCheckpoint(checkpoint);
    outerSplit.revision += 1;
    await rehashOuter(outerSplit);
    await expect(restoreMainWireIntegratedModelV2(
      fixture.context,
      outerSplit,
    )).rejects.toThrow(/nested owner clocks differ/);

    const generatorSplit = cloneCheckpoint(checkpoint);
    generatorSplit.generatedRhythmCalcium.generatorCheckpoint.revision += 1;
    await rehashGeneratedOwner(generatorSplit.generatedRhythmCalcium);
    await rehashOuter(generatorSplit);
    await expect(restoreMainWireIntegratedModelV2(
      fixture.context,
      generatorSplit,
    )).rejects.toThrow(/nested owner clocks differ/);

    const missingProvider = {
      ...fixture.context,
      provider: undefined,
    } as unknown as MainWireIntegratedModelCheckpointContextV2<WallState>;
    await expect(restoreMainWireIntegratedModelV2(
      missingProvider,
      checkpoint,
    )).rejects.toThrow(/expected provider is required/);
  }, 60_000);
});

function integratedMidPendingFixture() {
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
  const runtime = testRuntime();
  const pericardium = createMainWireNormalAdultCommonPericardiumV1();
  const generated = createGeneratedPeriodicSinusFiveWallRhythmCalciumOwnerV1(
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    {
      bindingId: "generated-integrated-checkpoint-binding-v1",
      generatorConfigId: "generated-integrated-checkpoint-generator-config-v1",
      generatorInstanceId: "generated-integrated-checkpoint-generator-v1",
      sourceId: "generated-integrated-checkpoint-sinus-source-v1",
    },
  );
  const rhythm = Object.freeze({ binding: generated.binding });
  const profile = dynamicProfile(
    "generated-integrated-checkpoint-synthetic",
    "a",
  );
  const config = activeLvadConfig();
  const cold = initializeMainWireIntegratedModelV2({
    coronary: {
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    },
    rhythm: {
      ...rhythm,
      acceptedState: generated.acceptedState,
    },
    dynamicMechanicalSupport: {
      config,
      heartRateBpm:
        60 / FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.cycleLengthSec,
      profile,
      initialAcceptedFlowMlPerSec: {
        LVAD: 25,
        IMPELLA: 0,
        VA_ECMO: 0,
        VV_ECMO: 0,
      },
    },
  });
  const stepInput = (dtSec: number) => Object.freeze({
    dtSec,
    coronary: Object.freeze({
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    }),
    rhythm,
    dynamicMechanicalSupport: Object.freeze({
      config,
      heartRateBpm:
        60 / FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.cycleLengthSec,
      profile,
    }),
  }) satisfies MainWireIntegratedModelStepInputV2;
  let state = cold.acceptedState;
  for (let index = 0; index < 3; index += 1) {
    const stepped = stepMainWireIntegratedModelV2(
      provider,
      state,
      stepInput(0.002),
    );
    if (stepped.converged === false) throw new Error(stepped.message);
    state = stepped.acceptedState;
  }
  const context = Object.freeze({
    provider,
    coronaryPrior: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
    collapseHydraulics:
      MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
    impMechanism: "cep-shortening-induced" as const,
    shorteningImpPrior:
      NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
    coronaryAutoregulationBinding:
      state.coronary.coronaryAutoregulationBinding,
    rhythm,
    dynamicMechanicalSupportProfile: profile,
    dynamicMechanicalSupportConfig: config,
  }) satisfies MainWireIntegratedModelCheckpointContextV2<WallState>;
  return Object.freeze({
    provider,
    generated,
    profile,
    config,
    state,
    context,
    stepInput,
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
      `generated-integrated-${deviceId.toLowerCase()}-synthetic-not-approved`,
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
  checkpoint: MainWireIntegratedModelCheckpointV2,
): any {
  return JSON.parse(JSON.stringify(checkpoint));
}

async function rehashGeneratedOwner(checkpoint: any): Promise<void> {
  const { checkpointSha256: _old, ...payload } = checkpoint;
  checkpoint.checkpointSha256 = await sha256CanonicalJsonHex(payload);
}

async function rehashOuter(checkpoint: any): Promise<void> {
  const { checkpointSha256: _old, ...payload } = checkpoint;
  checkpoint.checkpointSha256 = await sha256CanonicalJsonHex(payload);
}
