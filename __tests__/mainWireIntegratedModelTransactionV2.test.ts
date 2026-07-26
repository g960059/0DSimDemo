import { describe, expect, it } from "vitest";

import { defaultParams } from "@/engine/core/params";
import { createMechanicalSupportConfigV1 } from "@/engine/devices/defaultsV1";
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
  stepMainWireIntegratedModelV1,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V2,
  initializeMainWireIntegratedModelV2,
  maximumMainWireIntegratedModelStepDurationV2,
  stepMainWireIntegratedModelV2,
  validateMainWireIntegratedModelAcceptedStateV2,
  type MainWireIntegratedModelColdResultV2,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV2";
import {
  initializeMainWireFiveWallCoronaryV3,
  stepMainWireFiveWallCoronaryV3,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV3";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import { zeroExactEventCalciumStateV1 } from
  "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
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
  createPeriodicSinusFiveWallRhythmCalciumReplayV1,
} from "@/engine/myocardium/rhythm/acceptedFiveWallRhythmCalciumOwnerV1";
import {
  createAcceptedGeneratedFiveWallRhythmCalciumBindingV1,
  createGeneratedPeriodicSinusFiveWallRhythmCalciumOwnerV1,
  evaluateAcceptedGeneratedFiveWallRhythmCalciumCurrentDriveV1,
  evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1,
  initializeAcceptedGeneratedFiveWallRhythmCalciumStateV1,
  type AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
  type AcceptedGeneratedFiveWallRhythmCalciumStateV1,
  type GeneratedPeriodicSinusFiveWallRhythmCalciumOwnerV1,
} from "@/engine/myocardium/rhythm/acceptedGeneratedFiveWallRhythmCalciumOwnerV1";
import {
  createAcceptedDeterministicRhythmGeneratorConfigV1,
  type DeterministicRhythmSourceModeV1,
} from "@/engine/myocardium/rhythm/acceptedDeterministicRhythmGeneratorV1";
import {
  createRecoveryConcealmentAvGateParametersV1,
} from "@/engine/myocardium/rhythm/recoveryConcealmentAvGateV1";
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

const SHADOW_CALCIUM_ABS_TOLERANCE_UM = 2e-12;
const SHADOW_HEMODYNAMIC_ABS_TOLERANCE = 1e-9;

describe("main-wire generated-rhythm integrated transaction V2", () => {
  it("cold-starts the exact owner tuple without draining the t0 pending event", () => {
    const fixture = integratedFixture({
      profile: syntheticProfile(inertance(), "cold"),
      initialAcceptedFlowMlPerSec: flowRecord({ LVAD: 12, IMPELLA: -2 }),
    });
    const state = fixture.cold.acceptedState;

    expect(state.revision).toBe(0);
    expect(state.acceptedTimeSec).toBe(0);
    expect(state.coronary.revision).toBe(0);
    expect(state.generatedRhythmCalcium.revision).toBe(0);
    expect(state.generatedRhythmCalcium.generatorState.revision).toBe(0);
    expect(state.coronary.acceptedTimeSec).toBe(0);
    expect(state.generatedRhythmCalcium.acceptedTimeSec).toBe(0);
    expect(state.generatedRhythmCalcium.generatorState.acceptedTimeSec).toBe(0);
    expect(state.generatedRhythmCalcium.generatorState.pendingActivationEvents)
      .toMatchObject([{
        activationTimeSec: 0.012,
        targetIds: ["LVFW", "RVFW", "SEP"],
      }]);
    expect(state.dynamicMechanicalSupport.acceptedFlowMlPerSec).toEqual(
      flowRecord({ LVAD: 12, IMPELLA: -2 }),
    );
    expect(state.dynamicMechanicalSupport.inertanceProfileSnapshot)
      .toEqual(fixture.profile);
    expect(state.dynamicMechanicalSupport.inertanceProfileSnapshot)
      .not.toBe(fixture.profile);
    const currentDrive =
      evaluateAcceptedGeneratedFiveWallRhythmCalciumCurrentDriveV1(
        fixture.owner.acceptedState,
        fixture.owner.binding,
      );
    expect(fixture.cold.calciumDrive).toEqual(currentDrive);
    expect(state.coronary.mechanics.materialState.calciumSumUM)
      .toBe(sumCalcium(currentDrive));
    validateMainWireIntegratedModelAcceptedStateV2(
      state,
      rhythmContext(fixture.owner),
      fixture.profile,
      fixture.config,
    );
  });

  it("caps by coronary first, then reports event-first and exact tie batches", () => {
    const eventFirst = integratedFixture({
      profile: syntheticProfile(inertance(), "event-first"),
    });
    const eventMaximum = maximumFor(eventFirst, 0.02);
    expect(eventMaximum.maximumStepSec).toBe(0.012);
    expect(eventMaximum.clippedByRhythmEvent).toBe(true);
    expect(eventMaximum.clippedByCoronaryWindow).toBe(false);
    expect(eventMaximum.effectiveActivationBoundaryBatchSize).toBe(1);
    const roundoffRetry = stepMainWireIntegratedModelV2(
      eventFirst.provider,
      eventFirst.cold.acceptedState,
      integratedStepInput(
        eventFirst,
        eventMaximum.maximumStepSec + Number.EPSILON,
      ),
    );
    expect(roundoffRetry.converged).toBe(true);
    if (roundoffRetry.converged === true) {
      expect(roundoffRetry.acceptedState.acceptedTimeSec).toBe(0.012);
    }

    const coronaryFirst = integratedFixture({
      profile: syntheticProfile(inertance(), "coronary-first"),
      autoregulationWindow: irregularWindow(0.005),
    });
    const coronaryMaximum = maximumFor(coronaryFirst, 0.02);
    expect(coronaryMaximum.maximumStepSec).toBe(0.005);
    expect(coronaryMaximum.clippedByCoronaryWindow).toBe(true);
    expect(coronaryMaximum.clippedByRhythmEvent).toBe(false);
    expect(coronaryMaximum.effectiveActivationBoundaryEventId).toBeNull();
    expect(coronaryMaximum.rhythm.generator.requestedStepSec).toBe(0.005);

    const tie = integratedFixture({
      profile: syntheticProfile(inertance(), "tie"),
      autoregulationWindow: irregularWindow(0.012),
    });
    const tieMaximum = maximumFor(tie, 0.02);
    expect(tieMaximum.maximumStepSec).toBe(0.012);
    expect(tieMaximum.coronaryWindowAndEffectiveBatchTie).toBe(true);
    expect(tieMaximum.clippedByCoronaryWindow).toBe(true);
    expect(tieMaximum.clippedByRhythmEvent).toBe(false);
    expect(tieMaximum.effectiveActivationBoundaryBatchSize).toBe(1);
    const tiedStep = stepMainWireIntegratedModelV2(
      tie.provider,
      tie.cold.acceptedState,
      integratedStepInput(tie, tieMaximum.maximumStepSec),
    );
    expect(tiedStep.converged).toBe(true);
    if (!tiedStep.converged) return;
    expect(tiedStep.generatedRhythmTrial.activationEvents).toHaveLength(1);
    expect(tiedStep.generatedRhythmTrial.activationEvents[0]!.activationTimeSec)
      .toBe(0.012);
    expect(tiedStep.acceptedState.generatedRhythmCalcium.generatorState
      .pendingActivationEvents).toHaveLength(0);
    expect(tiedStep.coronaryStep.autoregulationWindowCompleted).toBe(true);
  }, 60_000);

  it("injects the one generated candidate calcium drive into coronary mechanics", () => {
    const fixture = integratedFixture({
      profile: syntheticProfile(inertance(), "calcium-injection"),
    });
    const result = stepMainWireIntegratedModelV2(
      fixture.provider,
      fixture.cold.acceptedState,
      integratedStepInput(fixture, 0.012),
    );
    expect(result.converged).toBe(true);
    if (!result.converged) return;
    expect(result.calciumDrive.freeCalciumUMByWall)
      .toEqual(result.generatedRhythmTrial.candidateFreeCalciumUMByWall);
    expect(result.acceptedState.coronary.mechanics.materialState.calciumSumUM)
      .toBe(sumCalcium(result.calciumDrive));
    expect(result.acceptedState.revision).toBe(1);
    expect(result.acceptedState.coronary.revision).toBe(1);
    expect(result.acceptedState.generatedRhythmCalcium.revision).toBe(1);
    expect(result.acceptedState.generatedRhythmCalcium.generatorState.revision)
      .toBe(1);
    expect(result.acceptedState.acceptedTimeSec).toBe(0.012);
  }, 60_000);

  it("keeps retry and both boundary/coronary failures atomically immutable", () => {
    const fixture = integratedFixture({
      profile: syntheticProfile(inertance({
        pumpInternalMmHgSec2PerMl: 0.04,
      }), "retry"),
      config: createMechanicalSupportConfigV1({
        lvad: { enabled: true, speedRpm: 5_200 },
      }),
      initialAcceptedFlowMlPerSec: flowRecord({ LVAD: 50 }),
    });
    const previous = fixture.cold.acceptedState;
    const before = JSON.stringify(previous);
    const input = integratedStepInput(fixture, 0.001);
    const first = stepMainWireIntegratedModelV2(
      fixture.provider,
      previous,
      input,
    );
    const retry = stepMainWireIntegratedModelV2(
      fixture.provider,
      previous,
      input,
    );
    expect(first.converged).toBe(true);
    expect(retry).toEqual(first);
    expect(JSON.stringify(previous)).toBe(before);
    if (first.converged === true) {
      expect(first.dynamicMechanicalSupportTrial.pump.LVAD
        .previousAcceptedFlowMlPerSec).toBe(50);
      expect(first.acceptedState.dynamicMechanicalSupport
        .acceptedFlowMlPerSec.LVAD)
        .toBe(first.dynamicMechanicalSupportTrial.pump.LVAD.flowMlPerSec);
    }

    const crossing = stepMainWireIntegratedModelV2(
      fixture.provider,
      previous,
      integratedStepInput(fixture, 0.02),
    );
    expect(crossing.converged).toBe(false);
    if (crossing.converged === true) return;
    expect(crossing.rollbackState).toBe(previous);
    expect(allCommitFlagsFalse(crossing)).toBe(true);

    const failing = stepMainWireIntegratedModelV2(
      failingTrialProvider(),
      previous,
      input,
    );
    expect(failing.converged).toBe(false);
    if (failing.converged === true) return;
    expect(failing.reason).toBe("coronary-v3-candidate-failed");
    expect(failing.rollbackState).toBe(previous);
    expect(allCommitFlagsFalse(failing)).toBe(true);
    expect(JSON.stringify(previous)).toBe(before);
  }, 60_000);

  it("preserves all-off parity and zero-inertance active parity", () => {
    const allOff = integratedFixture({
      profile: syntheticProfile(inertance({
        pumpInternalMmHgSec2PerMl: 0.03,
      }), "all-off"),
      initialAcceptedFlowMlPerSec: flowRecord({ LVAD: 12, VA_ECMO: 7 }),
    });
    const allOffTrial = evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
      allOff.owner.acceptedState,
      0.001,
      allOff.owner.binding,
    );
    const allOffDrive = Object.freeze({
      freeCalciumUMByWall: allOffTrial.candidateFreeCalciumUMByWall,
    });
    const directCold = initializeMainWireFiveWallCoronaryV3({
      ...coronaryColdInput(allOff.provider),
      calciumDriveOverride:
        evaluateAcceptedGeneratedFiveWallRhythmCalciumCurrentDriveV1(
          allOff.owner.acceptedState,
          allOff.owner.binding,
        ),
    });
    const directAllOff = stepMainWireFiveWallCoronaryV3(
      allOff.provider,
      directCold.acceptedState,
      { ...coronaryStepInput(), dtSec: 0.001, calciumDriveOverride: allOffDrive },
    );
    const integratedAllOff = stepMainWireIntegratedModelV2(
      allOff.provider,
      allOff.cold.acceptedState,
      integratedStepInput(allOff, 0.001),
    );
    expect(directAllOff.converged).toBe(true);
    expect(integratedAllOff.converged).toBe(true);
    if (!directAllOff.converged || !integratedAllOff.converged) return;
    expect(integratedAllOff.acceptedState.coronary)
      .toEqual(directAllOff.acceptedState);
    expect(integratedAllOff.acceptedState.dynamicMechanicalSupport
      .acceptedFlowMlPerSec).toEqual(flowRecord());

    const zeroL = integratedFixture({
      profile: syntheticProfile(inertance(), "active-zero-l"),
      config: createMechanicalSupportConfigV1({
        lvad: { enabled: true, speedRpm: 4_500 },
      }),
    });
    const zeroLTrial = evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
      zeroL.owner.acceptedState,
      0.001,
      zeroL.owner.binding,
    );
    const legacy = stepMainWireFiveWallCoronaryV3(
      zeroL.provider,
      zeroL.cold.acceptedState.coronary,
      {
        ...coronaryStepInput(),
        dtSec: 0.001,
        calciumDriveOverride: Object.freeze({
          freeCalciumUMByWall: zeroLTrial.candidateFreeCalciumUMByWall,
        }),
        mechanicalSupport: { config: zeroL.config, heartRateBpm: 60 },
      },
    );
    const dynamic = stepMainWireIntegratedModelV2(
      zeroL.provider,
      zeroL.cold.acceptedState,
      integratedStepInput(zeroL, 0.001),
    );
    expect(legacy.converged).toBe(true);
    expect(dynamic.converged).toBe(true);
    if (!legacy.converged || !dynamic.converged) return;
    expect(dynamic.acceptedState.coronary).toEqual(legacy.acceptedState);
    expect(dynamic.dynamicMechanicalSupportTrial.pump.LVAD.flowLMin)
      .toBe(legacy.baseStep.circulationTrial.mechanicalSupport!.pump.LVAD.flowLMin);
    expect(dynamic.dynamicMechanicalSupportTrial.conservationResidualMlPerSec)
      .toBe(0);
  }, 60_000);

  it("rejects binding/profile/structure substitution but permits runtime speed", () => {
    const fixture = integratedFixture({
      profile: syntheticProfile(inertance({
        pumpInternalMmHgSec2PerMl: 0.04,
      }), "bindings"),
      config: createMechanicalSupportConfigV1({
        lvad: { enabled: true, speedRpm: 5_200 },
      }),
    });
    const alteredOwner = periodicOwner(
      fixture.profile.profileId,
      alteredCalciumPrior(),
    );
    const rhythmSubstitution = stepMainWireIntegratedModelV2(
      fixture.provider,
      fixture.cold.acceptedState,
      {
        ...integratedStepInput(fixture, 0.001),
        rhythm: rhythmContext(alteredOwner),
      },
    );
    expectRejectedIdentity(rhythmSubstitution, fixture.cold.acceptedState);
    if (rhythmSubstitution.converged === false) {
      expect(rhythmSubstitution.message).toMatch(/binding.*mismatch/);
    }

    const alteredProfile = createDynamicMechanicalSupportInertanceProfileV1({
      profileId: fixture.profile.profileId,
      profileBindingSha256: fixture.profile.profileBindingSha256,
      deviceProfileBindingByDevice: fixture.profile.deviceProfileBindingByDevice,
      inertanceByDevice: Object.freeze({
        ...fixture.profile.inertanceByDevice,
        LVAD: inertance({ pumpInternalMmHgSec2PerMl: 0.2 }),
      }),
    });
    const profileSubstitution = stepMainWireIntegratedModelV2(
      fixture.provider,
      fixture.cold.acceptedState,
      {
        ...integratedStepInput(fixture, 0.001),
        dynamicMechanicalSupport: {
          ...dynamicContext(fixture),
          profile: alteredProfile,
        },
      },
    );
    expectRejectedIdentity(profileSubstitution, fixture.cold.acceptedState);
    if (profileSubstitution.converged === false) {
      expect(profileSubstitution.message).toMatch(/profile content mismatch/);
    }

    const alteredStructure = Object.freeze({
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
    const structureSubstitution = stepMainWireIntegratedModelV2(
      fixture.provider,
      fixture.cold.acceptedState,
      {
        ...integratedStepInput(fixture, 0.001),
        dynamicMechanicalSupport: {
          ...dynamicContext(fixture),
          config: alteredStructure,
        },
      },
    );
    expectRejectedIdentity(structureSubstitution, fixture.cold.acceptedState);
    if (structureSubstitution.converged === false) {
      expect(structureSubstitution.message)
        .toMatch(/structural hydraulic config mismatch/);
    }

    const speedCommand = createMechanicalSupportConfigV1({
      lvad: { enabled: true, speedRpm: 6_000 },
    });
    const oldSpeed = stepMainWireIntegratedModelV2(
      fixture.provider,
      fixture.cold.acceptedState,
      integratedStepInput(fixture, 0.001),
    );
    const newSpeed = stepMainWireIntegratedModelV2(
      fixture.provider,
      fixture.cold.acceptedState,
      {
        ...integratedStepInput(fixture, 0.001),
        dynamicMechanicalSupport: {
          ...dynamicContext(fixture),
          config: speedCommand,
        },
      },
    );
    expect(oldSpeed.converged).toBe(true);
    expect(newSpeed.converged).toBe(true);
    if (!oldSpeed.converged || !newSpeed.converged) return;
    expect(newSpeed.dynamicMechanicalSupportTrial.pump.LVAD.speedRpm).toBe(6_000);
    expect(newSpeed.dynamicMechanicalSupportTrial.pump.LVAD.flowMlPerSec)
      .not.toBe(oldSpeed.dynamicMechanicalSupportTrial.pump.LVAD.flowMlPerSec);
  }, 60_000);

  it("rejects legacy algebraic MCS and incompatible coronary/rhythm policies", () => {
    const fixture = integratedFixture({
      profile: syntheticProfile(inertance(), "policy"),
    });
    const baseInput = integratedStepInput(fixture, 0.001);
    const legacy = stepMainWireIntegratedModelV2(
      fixture.provider,
      fixture.cold.acceptedState,
      {
        ...baseInput,
        coronary: {
          ...baseInput.coronary,
          mechanicalSupport: { config: fixture.config, heartRateBpm: 60 },
        },
      } as never,
    );
    expectRejectedIdentity(legacy, fixture.cold.acceptedState);
    if (legacy.converged === false) {
      expect(legacy.message).toMatch(/legacy algebraic/);
    }

    const mismatchedCycleInput = {
      ...baseInput,
      coronary: {
        ...baseInput.coronary,
        calciumDriveParams: Object.freeze({
          ...FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
          cycleLengthSec: 0.9,
        }),
      },
    };
    const mismatchedCycle = stepMainWireIntegratedModelV2(
      fixture.provider,
      fixture.cold.acceptedState,
      mismatchedCycleInput,
    );
    expectRejectedIdentity(mismatchedCycle, fixture.cold.acceptedState);
    if (mismatchedCycle.converged === false) {
      expect(mismatchedCycle.message)
        .toMatch(/rhythm, coronary calcium cycle, and accepted window differ/);
    }

    const periodMismatch = explicitGeneratedOwner({
      suffix: "period-mismatch",
      sourceMode: "regular-sinus",
      sourcePeriodSec: 0.9,
      parameterProvenance: "explicit-exact-event-parameters",
    });
    expect(() => initializeWithOwner(
      fixture.provider,
      fixture.profile,
      fixture.config,
      periodMismatch,
    )).toThrow(/rhythm period.*calcium cycle differ/);

    const flutter = explicitGeneratedOwner({
      suffix: "flutter",
      sourceMode: "regular-atrial-flutter",
      sourcePeriodSec: 0.2,
      parameterProvenance: "explicit-exact-event-parameters",
    });
    expect(() => initializeWithOwner(
      fixture.provider,
      fixture.profile,
      fixture.config,
      flutter,
    )).toThrow(/flutter requires an explicit irregular-rhythm-stationary/);
    expect(() => initializeWithOwner(
      fixture.provider,
      fixture.profile,
      fixture.config,
      flutter,
      irregularWindow(0.5),
    )).not.toThrow();

    const wrongInitialization = explicitGeneratedOwner({
      suffix: "wrong-initialization",
      sourceMode: "regular-sinus",
      sourcePeriodSec: 1,
      parameterProvenance: "five-wall-normal-periodic-analytic-conversion",
    });
    expect(() => initializeWithOwner(
      fixture.provider,
      fixture.profile,
      fixture.config,
      wrongInitialization,
    )).toThrow(/requires periodic analytic accepted initialization/);
  }, 60_000);

  it("keeps conservative claims explicit", () => {
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V2
      .staticRhythmV1ShadowPreserved).toBe(true);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V2
      .coldPendingQueuePreserved).toBe(true);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V2
      .legacyAlgebraicMcsAcceptedInIntegratedLane).toBe(false);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V2.iabpTiming)
      .toMatch(/phase-derived-provisional/);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V2
      .iabpRhythmSynchronizationClaimed).toBe(false);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V2.releaseReady)
      .toBe(false);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V2
      .clinicalValidationClaimed).toBe(false);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V1.acceptedTuple)
      .toMatch(/accepted-rhythm-calcium/);
  });

  it("shadows static V1 for a complete cycle in semantics, calcium, and hemodynamics", () => {
    const provider = testProvider();
    const profile = syntheticProfile(inertance(), "v1-shadow");
    const config = createMechanicalSupportConfigV1();
    const generated = periodicOwner("v1-shadow");
    const replay = createPeriodicSinusFiveWallRhythmCalciumReplayV1(
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      {
        scheduleId: "generated-v2-shadow-static-schedule",
        bindingId: "generated-v2-shadow-static-binding",
        acceptedTimeSec: 0,
        endTimeSec: 2,
        revision: 0,
      },
    );
    const coldV1 = initializeMainWireIntegratedModelV1({
      coronary: coronaryColdInput(provider),
      rhythm: {
        binding: replay.binding,
        schedule: replay.schedule,
        acceptedState: replay.acceptedState,
      },
      dynamicMechanicalSupport: {
        config,
        heartRateBpm: 60,
        profile,
      },
    });
    const coldV2 = initializeWithOwner(provider, profile, config, generated);
    let stateV1 = coldV1.acceptedState;
    let stateV2 = coldV2.acceptedState;

    const endpointsSec = Array.from(
      { length: 1_000 },
      (_, index) => (index + 1) / 1_000,
    );
    for (const endpointSec of endpointsSec) {
      const dtSec = endpointSec - stateV2.acceptedTimeSec;
      const resultV1 = stepMainWireIntegratedModelV1(
        provider,
        stateV1,
        {
          dtSec,
          coronary: coronaryStepInput(),
          rhythm: { binding: replay.binding, schedule: replay.schedule },
          dynamicMechanicalSupport: { config, heartRateBpm: 60, profile },
        },
      );
      const resultV2 = stepMainWireIntegratedModelV2(
        provider,
        stateV2,
        {
          dtSec,
          coronary: coronaryStepInput(),
          rhythm: rhythmContext(generated),
          dynamicMechanicalSupport: { config, heartRateBpm: 60, profile },
        },
      );
      expect(
        resultV1.converged,
        resultV1.converged === true
          ? undefined
          : `V1 endpoint ${endpointSec}: ${resultV1.reason}: ${resultV1.message}`,
      ).toBe(true);
      expect(
        resultV2.converged,
        resultV2.converged === true
          ? undefined
          : `V2 endpoint ${endpointSec}: ${resultV2.reason}: ${resultV2.message}`,
      ).toBe(true);
      if (resultV1.converged === false || resultV2.converged === false) return;
      expect(eventSemantics(resultV2.generatedRhythmTrial.activationEvents))
        .toEqual(eventSemantics(resultV1.rhythmTrial.activationEvents));
      for (const wall of ["LA", "RA", "LVFW", "SEP", "RVFW"] as const) {
        expect(Math.abs(
          resultV2.calciumDrive.freeCalciumUMByWall[wall]
            - resultV1.calciumDrive.freeCalciumUMByWall[wall],
        )).toBeLessThanOrEqual(SHADOW_CALCIUM_ABS_TOLERANCE_UM);
      }
      const volumesV1 = resultV1.acceptedState.coronary.circulation.nodeVolumesMl;
      const volumesV2 = resultV2.acceptedState.coronary.circulation.nodeVolumesMl;
      for (const node of Object.keys(volumesV1) as (keyof typeof volumesV1)[]) {
        expect(Math.abs(volumesV2[node] - volumesV1[node]))
          .toBeLessThanOrEqual(SHADOW_HEMODYNAMIC_ABS_TOLERANCE);
      }
      stateV1 = resultV1.acceptedState;
      stateV2 = resultV2.acceptedState;
    }
    expect(stateV1.acceptedTimeSec).toBe(1);
    expect(stateV2.acceptedTimeSec).toBe(1);
  }, 120_000);
});

type Fixture = Readonly<{
  provider: WholeHeartMechanicsProviderV1<
    TestState,
    MainWireFiveWallFreeCalciumDriveV1
  >;
  owner: GeneratedPeriodicSinusFiveWallRhythmCalciumOwnerV1;
  profile: DynamicMechanicalSupportInertanceProfileV1;
  config: MechanicalSupportConfigV1;
  cold: MainWireIntegratedModelColdResultV2<TestState>;
}>;

function integratedFixture(options: Readonly<{
  profile: DynamicMechanicalSupportInertanceProfileV1;
  config?: MechanicalSupportConfigV1;
  initialAcceptedFlowMlPerSec?: Readonly<Record<RotarySupportDeviceIdV1, number>>;
  autoregulationWindow?: Readonly<{
    durationSec: number;
    interpretation: "irregular-rhythm-stationary";
  }>;
}>): Fixture {
  const provider = testProvider();
  const owner = periodicOwner(options.profile.profileId);
  const config = options.config ?? createMechanicalSupportConfigV1();
  const cold = initializeMainWireIntegratedModelV2({
    coronary: {
      ...coronaryColdInput(provider),
      ...(options.autoregulationWindow === undefined
        ? {}
        : { autoregulationWindow: options.autoregulationWindow }),
    },
    rhythm: { binding: owner.binding, acceptedState: owner.acceptedState },
    dynamicMechanicalSupport: {
      config,
      heartRateBpm: 60,
      profile: options.profile,
      ...(options.initialAcceptedFlowMlPerSec === undefined
        ? {}
        : { initialAcceptedFlowMlPerSec: options.initialAcceptedFlowMlPerSec }),
    },
  });
  return Object.freeze({ provider, owner, profile: options.profile, config, cold });
}

function initializeWithOwner(
  provider: WholeHeartMechanicsProviderV1<TestState, MainWireFiveWallFreeCalciumDriveV1>,
  profile: DynamicMechanicalSupportInertanceProfileV1,
  config: MechanicalSupportConfigV1,
  owner: Readonly<{
    binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1;
    acceptedState: AcceptedGeneratedFiveWallRhythmCalciumStateV1;
  }>,
  autoregulationWindow?: Readonly<{
    durationSec: number;
    interpretation: "irregular-rhythm-stationary";
  }>,
) {
  return initializeMainWireIntegratedModelV2({
    coronary: {
      ...coronaryColdInput(provider),
      ...(autoregulationWindow === undefined ? {} : { autoregulationWindow }),
    },
    rhythm: { binding: owner.binding, acceptedState: owner.acceptedState },
    dynamicMechanicalSupport: { config, heartRateBpm: 60, profile },
  });
}

function periodicOwner(suffix: string, params = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1) {
  return createGeneratedPeriodicSinusFiveWallRhythmCalciumOwnerV1(params, {
    bindingId: `generated-integrated-${suffix}-binding`,
    generatorConfigId: `generated-integrated-${suffix}-config`,
    generatorInstanceId: `generated-integrated-${suffix}-instance`,
    sourceId: `generated-integrated-${suffix}-source`,
  });
}

function alteredCalciumPrior() {
  const prior = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
  return Object.freeze({
    ...prior,
    ventricular: Object.freeze({
      ...prior.ventricular,
      peakAmplitudeUM: prior.ventricular.peakAmplitudeUM + 0.01,
    }),
  });
}

function explicitGeneratedOwner(options: Readonly<{
  suffix: string;
  sourceMode: DeterministicRhythmSourceModeV1;
  sourcePeriodSec: number;
  parameterProvenance:
    | "explicit-exact-event-parameters"
    | "five-wall-normal-periodic-analytic-conversion";
}>) {
  const reference = periodicOwner(`reference-${options.suffix}`);
  const avGateParameters = createRecoveryConcealmentAvGateParametersV1({
    parameterSetId: `policy-${options.suffix}-av`,
    parameterProvenance: {
      kind: "explicit-research-parameters",
      sourceId: `policy-${options.suffix}`,
    },
    minimumConductionDelaySec: 0.1,
    recoveryDelayAmplitudeSec: 0,
    recoveryTimeConstantSec: 1,
    postConductionRefractorySec: 0.05,
    concealedRefractoryExtensionSec: 0,
  });
  const generatorConfig = createAcceptedDeterministicRhythmGeneratorConfigV1({
    generatorConfigId: `policy-${options.suffix}-config`,
    generatorInstanceId: `policy-${options.suffix}-instance`,
    sourceId: `policy-${options.suffix}-source`,
    sourceMode: options.sourceMode,
    sourceAnchorTimeSec: 0.1,
    sourcePeriodSec: options.sourcePeriodSec,
    atrialElectricalToCalciumDelaySec: 0.012,
    ventricularElectricalToCalciumDelaySec: 0.012,
    atrialActivationStrength01: 1,
    ventricularActivationStrength01: 1,
    avGateParameters,
  });
  const binding = createAcceptedGeneratedFiveWallRhythmCalciumBindingV1({
    bindingId: `policy-${options.suffix}-binding`,
    generatorConfig,
    calciumParametersByWall: reference.binding.calciumParametersByWall,
    parameterProvenance: options.parameterProvenance,
    sourceParameterSetId: options.parameterProvenance
        === "five-wall-normal-periodic-analytic-conversion"
      ? FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.parameterSetId
      : null,
  });
  const zeroState = zeroExactEventCalciumStateV1();
  const acceptedState = initializeAcceptedGeneratedFiveWallRhythmCalciumStateV1(
    binding,
    {
      acceptedTimeSec: 0,
      revision: 0,
      nextSourceIndex: 0,
      nextSourceActivationTimeSec: 0.1,
      calciumStateByWall: Object.freeze({
        LA: zeroState,
        RA: zeroState,
        LVFW: zeroState,
        SEP: zeroState,
        RVFW: zeroState,
      }),
    },
  );
  return Object.freeze({ binding, acceptedState });
}

function maximumFor(fixture: Fixture, requestedStepSec: number) {
  return maximumMainWireIntegratedModelStepDurationV2(
    fixture.cold.acceptedState,
    requestedStepSec,
    rhythmContext(fixture.owner),
    fixture.profile,
    fixture.config,
  );
}

function rhythmContext(owner: Readonly<{
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1;
}>) {
  return Object.freeze({ binding: owner.binding });
}

function dynamicContext(fixture: Fixture) {
  return Object.freeze({
    config: fixture.config,
    heartRateBpm: 60,
    profile: fixture.profile,
  });
}

function integratedStepInput(fixture: Fixture, dtSec: number) {
  return Object.freeze({
    dtSec,
    coronary: coronaryStepInput(),
    rhythm: rhythmContext(fixture.owner),
    dynamicMechanicalSupport: dynamicContext(fixture),
  });
}

function coronaryColdInput(
  provider: WholeHeartMechanicsProviderV1<TestState, MainWireFiveWallFreeCalciumDriveV1>,
) {
  return Object.freeze({
    provider,
    runtime: RUNTIME,
    calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    pericardium: PERICARDIUM,
  });
}

function coronaryStepInput() {
  return Object.freeze({
    runtime: RUNTIME,
    calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    pericardium: PERICARDIUM,
  });
}

function irregularWindow(durationSec: number) {
  return Object.freeze({
    durationSec,
    interpretation: "irregular-rhythm-stationary" as const,
  });
}

function flowRecord(
  overrides: Partial<Record<RotarySupportDeviceIdV1, number>> = {},
) {
  return Object.freeze({
    LVAD: 0,
    IMPELLA: 0,
    VA_ECMO: 0,
    VV_ECMO: 0,
    ...overrides,
  });
}

function syntheticProfile(
  sameInertance: DynamicRotaryPumpCircuitInertanceV1,
  suffix: string,
): DynamicMechanicalSupportInertanceProfileV1 {
  return createDynamicMechanicalSupportInertanceProfileV1({
    profileId: `generated-integrated-test-${suffix}`,
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
    circuitProfileId: `generated-integrated-${deviceId}-${suffix}`,
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
        LA: 10 + 0.20 * (volumes.LA - 45),
        LV: 105 + 0.80 * (volumes.LV - 130),
        RA: 5 + 0.08 * (volumes.RA - 55),
        RV: 25 + 0.17 * (volumes.RV - 140),
      }),
      transmuralPressureVolumeTangentMmHgPerMl: Object.freeze({
        LA: Object.freeze({ LA: 0.20, LV: 0, RA: 0, RV: 0 }),
        LV: Object.freeze({ LA: 0, LV: 0.80, RA: 0, RV: 0 }),
        RA: Object.freeze({ LA: 0, LV: 0, RA: 0.08, RV: 0 }),
        RV: Object.freeze({ LA: 0, LV: 0, RA: 0, RV: 0.17 }),
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
    providerId: "generated-integrated-test-provider",
    parameterSetId: "generated-integrated-test-prior",
    parameterIdentityHash: "generated-integrated-test-hash",
    stateSchemaVersion: 1,
    stateCodec: Object.freeze({
      clone: (state: TestState) => Object.freeze({ ...state }),
      encode: (state: TestState) => Object.freeze({ ...state }),
      decode: (encoded: unknown) => Object.freeze({ ...(encoded as TestState) }),
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

function failingTrialProvider(): WholeHeartMechanicsProviderV1<
  TestState,
  MainWireFiveWallFreeCalciumDriveV1
> {
  const provider = testProvider();
  return Object.freeze({
    ...provider,
    evaluateTrial: (input: Parameters<typeof provider.evaluateTrial>[0]) => {
      const evaluation = provider.evaluateTrial(input);
      return Object.freeze({
        ...evaluation,
        diagnostics: Object.freeze({
          ...evaluation.diagnostics,
          converged: false,
          errors: Object.freeze(["forced candidate failure"]),
        }),
      });
    },
  });
}

function sumCalcium(drive: MainWireFiveWallFreeCalciumDriveV1): number {
  return Object.values(drive.freeCalciumUMByWall)
    .reduce((sum, value) => sum + value, 0);
}

function eventSemantics(events: readonly Readonly<{
  activationTimeSec: number;
  targetIds: readonly string[];
  activationStrength01: number;
  morphology: string;
}>[]) {
  return events.map((event) => Object.freeze({
    activationTimeSec: event.activationTimeSec,
    targetIds: event.targetIds,
    activationStrength01: event.activationStrength01,
    morphology: event.morphology,
  }));
}

function expectRejectedIdentity(
  result: ReturnType<typeof stepMainWireIntegratedModelV2<TestState>>,
  previous: MainWireIntegratedModelColdResultV2<TestState>["acceptedState"],
): void {
  expect(result.converged).toBe(false);
  if (result.converged === true) return;
  expect(result.rollbackState).toBe(previous);
  expect(allCommitFlagsFalse(result)).toBe(true);
}

function allCommitFlagsFalse(value: Readonly<Record<string, unknown>>): boolean {
  return [
    "mechanicsCommitted",
    "circulationCommitted",
    "coronaryCommitted",
    "mvcReferenceCommitted",
    "autoregulationCommitted",
    "generatedRhythmCalciumCommitted",
    "dynamicMechanicalSupportCommitted",
  ].every((key) => value[key] === false);
}
