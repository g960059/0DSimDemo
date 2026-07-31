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
  mechanicalSupportConservationToleranceMlPerSecV1,
} from "@/engine/devices/mechanicalSupportConservationV1";
import {
  createDynamicMechanicalSupportDeviceProfileBindingV1,
  createDynamicMechanicalSupportInertanceProfileV1,
  type DynamicMechanicalSupportInertanceProfileV1,
} from "@/engine/devices/dynamicNetworkV1";
import {
  DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
  type DynamicRotaryPumpCircuitInertanceV1,
} from "@/engine/devices/dynamicRotaryPumpV1";
import {
  MECHANICAL_SUPPORT_NODE_NAMES_V1,
  type MechanicalSupportConfigV1,
  type RotarySupportDeviceIdV1,
} from "@/engine/devices/typesV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V3,
  checkpointMainWireIntegratedModelV3,
  restoreMainWireIntegratedModelV3,
  type MainWireIntegratedModelCheckpointContextV3,
  type MainWireIntegratedModelCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3,
  evaluateMainWireIntegratedModelCalciumDriveV3,
  initializeMainWireIntegratedModelV3,
  limitMainWireIntegratedModelCandidateTimeV3,
  stepMainWireIntegratedModelV3,
  type MainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedModelStepInputV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  evaluateFiveWallNormalCalciumDriveV1,
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
  createAcceptedComposedRhythmTransactionConfigurationV2,
  initializeAcceptedComposedRhythmTransactionStateV2,
  type AcceptedComposedRhythmTransactionConfigurationV2,
  type AcceptedComposedRhythmTransactionStateV2,
} from "@/engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2";
import {
  createAcceptedAuthoredEctopyScheduleConfigurationV2,
} from "@/engine/myocardium/rhythm/acceptedAuthoredEctopyScheduleV2";
import {
  createAcceptedAuthoredVentricularPacingReplaySourceConfigurationV1,
  type AuthoredVentricularPacingReplayEventInputV1,
} from "@/engine/myocardium/rhythm/acceptedAuthoredVentricularPacingReplaySourceV1";
import {
  createDistalConductionGateConfigurationV1,
} from "@/engine/myocardium/rhythm/acceptedDistalConductionGateV1";
import {
  createAcceptedElectricalCaptureOwnerConfigurationV2,
  createSourceImpulseV2,
  evaluateAcceptedElectricalCaptureBatchCandidateV2,
  initializeAcceptedElectricalCaptureOwnerStateV2,
  type CapturedElectricalActivationV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";
import {
  createRegularAtrialSourceConfigurationV1,
} from "@/engine/myocardium/rhythm/acceptedRegularAtrialSourceOwnerV1";
import {
  createAcceptedVentricularBackupSourceConfigurationV2,
} from "@/engine/myocardium/rhythm/acceptedVentricularBackupSourceOwnerV2";
import {
  createAcceptedVentricularIntervalStrengthConfigurationV1,
} from "@/engine/myocardium/rhythm/acceptedVentricularIntervalStrengthOwnerV1";
import {
  createRecoveryConcealmentAvGateParametersV1,
} from "@/engine/myocardium/rhythm/recoveryConcealmentAvGateV1";
import {
  WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
  type WholeHeartMechanicsProviderV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";
import {
  MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";

type TestState = Readonly<{
  timeSec: number;
  volumeSumMl: number;
  calciumSumUM: number;
}>;

type TestProvider = WholeHeartMechanicsProviderV1<
  TestState,
  MainWireFiveWallFreeCalciumDriveV1
>;

type Fixture = Readonly<{
  provider: TestProvider;
  rhythmConfiguration: AcceptedComposedRhythmTransactionConfigurationV2;
  rhythmInitialState: AcceptedComposedRhythmTransactionStateV2;
  profile: DynamicMechanicalSupportInertanceProfileV1;
  config: MechanicalSupportConfigV1;
  cold: ReturnType<typeof initializeMainWireIntegratedModelV3<TestState>>;
}>;

const params = defaultParams();
const PERICARDIUM = createMainWireNormalAdultCommonPericardiumV1("exact-off");
const RUNTIME = Object.freeze({
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
    Pth0: -3,
    respAmpTh: 0,
    respAmpAlv: 0,
    respRate: 0,
  }),
  valveResearchInput: MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
});

describe("main-wire composed-rhythm integrated transaction V3", () => {
  it("cold-starts with composed exact-event calcium as the sole five-wall drive", () => {
    const fixture = integratedFixture({ suffix: "cold" });
    const state = fixture.cold.acceptedState;
    const legacyPeriodic = evaluateFiveWallNormalCalciumDriveV1(0);

    expect(state.revision).toBe(0);
    expect(state.acceptedTimeSec).toBe(0);
    expect(state.coronary.revision).toBe(0);
    expect(state.composedRhythm.revision).toBe(0);
    expect(fixture.cold.calciumDrive.freeCalciumUMByWall).toEqual({
      LA: 0.2,
      LVFW: 0.2,
      SEP: 0.2,
      RVFW: 0.2,
      RA: 0.2,
    });
    expect(fixture.cold.calciumDrive.freeCalciumUMByWall)
      .not.toEqual(legacyPeriodic.freeCalciumUMByWall);
    expect(state.coronary.mechanics.materialState.calciumSumUM).toBe(1);
    expect("generatedRhythmCalcium" in state).toBe(false);
    expect("fixedPeriodicCalcium" in state).toBe(false);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3
      .calciumOwnership.soleAcceptedOwner)
      .toBe("AcceptedComposedRhythmTransactionV2");
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3
      .calciumOwnership.dualCalciumDriveAccepted).toBe(false);

    expect(() => initializeMainWireIntegratedModelV3({
      coronary: {
        ...coronaryColdInput(fixture.provider),
        calciumDriveOverride: {
          freeCalciumUMByWall: legacyPeriodic.freeCalciumUMByWall,
        },
      },
      rhythm: {
        configuration: fixture.rhythmConfiguration,
        acceptedState: fixture.rhythmInitialState,
      },
      dynamicMechanicalSupport: {
        config: fixture.config,
        profile: fixture.profile,
      },
    } as never)).toThrow(/rejects a second calciumDriveOverride/);
  });

  it("clips every causal boundary and injects the same candidate calcium into mechanics", () => {
    const fixture = integratedFixture({
      suffix: "causal-chain",
      config: createMechanicalSupportConfigV1({
        lvad: { enabled: true, speedRpm: 5_200 },
      }),
      initialAcceptedFlowMlPerSec: flowRecord({ LVAD: 25 }),
      inertance: inertance({ pumpInternalMmHgSec2PerMl: 0.04 }),
    });
    const initial = fixture.cold.acceptedState;
    const maximum = maximumRegular(fixture, initial, 0.01);
    expect(maximum.candidateTimeSec).toBe(0.001);
    expect(maximum.clippedByRhythmBoundary).toBe(true);
    expect(maximum.rhythmBoundaryOwners.length).toBeGreaterThan(0);

    const crossing = stepMainWireIntegratedModelV3(
      fixture.provider,
      initial,
      regularStepInput(fixture, initial, 0.01),
    );
    expect(crossing.converged).toBe(false);
    if (crossing.converged === false) {
      expect(crossing.rollbackState).toBe(initial);
      expect(allCommitFlagsFalse(crossing)).toBe(true);
      expect(crossing.message).toMatch(/crosses.*boundary/);
    }

    const atAtrial = successfulRegularStep(fixture, initial, 0.001);
    expect(atAtrial.composedRhythmCandidate.capturedAtrialActivation)
      .not.toBeNull();
    expect(atAtrial.composedRhythmCandidate.scheduledCalciumDeposits)
      .toEqual([]);
    expect(atAtrial.acceptedState.composedRhythm
      .pendingProximalAvOutputs[0]?.proximalArrivalTimeSec).toBe(0.002);

    const atProximal = successfulRegularStep(
      fixture,
      atAtrial.acceptedState,
      0.001,
    );
    expect(atProximal.acceptedState.acceptedTimeSec).toBe(0.002);
    expect(atProximal.composedRhythmCandidate.distalGateDecisions[0]?.passed)
      .toBe(true);
    expect(atProximal.acceptedState.composedRhythm
      .pendingDistalVentricularImpulses[0]?.activationTimeSec).toBe(0.003);

    const atVentricular = successfulRegularStep(
      fixture,
      atProximal.acceptedState,
      0.001,
    );
    expect(atVentricular.composedRhythmCandidate
      .capturedVentricularActivation).not.toBeNull();
    expect(atVentricular.composedRhythmCandidate
      .scheduledCalciumDeposits[0]?.depositTimeSec).toBe(0.004);
    expect(atVentricular.acceptedState.composedRhythm.pendingCalciumDeposits)
      .toHaveLength(1);

    const atDeposit = successfulRegularStep(
      fixture,
      atVentricular.acceptedState,
      0.001,
    );
    expect(atDeposit.composedRhythmCandidate.deliveredCalciumDeposits)
      .toHaveLength(1);
    const afterRise = successfulRegularStep(
      fixture,
      atDeposit.acceptedState,
      0.001,
    );
    const exactDrive = evaluateMainWireIntegratedModelCalciumDriveV3(
      afterRise.acceptedState.composedRhythm,
    );
    expect(afterRise.calciumDrive).toEqual(exactDrive);
    expect(afterRise.acceptedState.coronary.mechanics.materialState.calciumSumUM)
      .toBeCloseTo(sumCalcium(exactDrive), 14);
    expect(exactDrive.freeCalciumUMByWall.LVFW).toBeGreaterThan(0.2);
    expect(exactDrive.freeCalciumUMByWall.SEP).toBeGreaterThan(0.2);
    expect(exactDrive.freeCalciumUMByWall.RVFW).toBeGreaterThan(0.2);
    expect(exactDrive.freeCalciumUMByWall.LA).toBe(0.2);
    expect(exactDrive.freeCalciumUMByWall.RA).toBe(0.2);
    expect(afterRise.dynamicMechanicalSupportTrial
      .conservationResidualMlPerSec).toBe(0);
    expectGlobalBloodVolumeConserved(afterRise.acceptedState);
    expect(afterRise.acceptedState.revision).toBe(5);
    expect(afterRise.acceptedState.coronary.revision).toBe(5);
    expect(afterRise.acceptedState.composedRhythm.revision).toBe(5);
  }, 60_000);

  it("promotes shared-node four-pump candidates under the physical residual policy", () => {
    const fixture = integratedFixture({
      suffix: "four-pump-conservation",
      config: createMechanicalSupportConfigV1({
        lvad: { enabled: true, speedRpm: 5_200 },
        impella: { enabled: true, performanceLevel: 7 },
        vaEcmo: {
          enabled: true,
          speedRpm: 3_500,
          cannulation: "central",
        },
        vvEcmo: {
          enabled: true,
          speedRpm: 3_500,
          hemodynamicCoupling: "bicaval-pressure-resolved",
        },
      }),
      initialAcceptedFlowMlPerSec: flowRecord({
        LVAD: 40,
        IMPELLA: 20,
        VA_ECMO: 60,
        VV_ECMO: 30,
      }),
      inertance: inertance({
        pumpInternalMmHgSec2PerMl: 0.04,
        drainageMmHgSec2PerMl: 0.02,
        oxygenatorMmHgSec2PerMl: 0.01,
        returnPathMmHgSec2PerMl: 0.03,
      }),
    });
    let acceptedState = fixture.cold.acceptedState;
    let observedNaiveRoundoff = false;
    for (let stepIndex = 0; stepIndex < 16; stepIndex += 1) {
      const stepped = successfulRegularStep(fixture, acceptedState, 0.00005);
      const nodeRates =
        stepped.dynamicMechanicalSupportTrial.nodeNetVolumeRateMlPerSec;
      const naiveResidual = MECHANICAL_SUPPORT_NODE_NAMES_V1.reduce(
        (sum, node) => sum + nodeRates[node],
        0,
      );
      observedNaiveRoundoff ||= naiveResidual !== 0;
      expect(Math.abs(
        stepped.dynamicMechanicalSupportTrial.conservationResidualMlPerSec,
      )).toBeLessThanOrEqual(
        mechanicalSupportConservationToleranceMlPerSecV1(nodeRates),
      );
      acceptedState = stepped.acceptedState;
    }
    expect(observedNaiveRoundoff).toBe(true);
    expect(acceptedState.revision).toBe(16);
  }, 60_000);

  it("keeps retries pure and all crossing, mechanics, and duplicate-owner failures atomic", () => {
    const fixture = integratedFixture({
      suffix: "rollback",
      config: createMechanicalSupportConfigV1({
        lvad: { enabled: true, speedRpm: 5_200 },
      }),
      initialAcceptedFlowMlPerSec: flowRecord({ LVAD: 50 }),
      inertance: inertance({ pumpInternalMmHgSec2PerMl: 0.04 }),
    });
    const previous = fixture.cold.acceptedState;
    const before = canonicalJsonStringify(previous);
    const input = regularStepInput(fixture, previous, 0.001);
    const first = stepMainWireIntegratedModelV3(
      fixture.provider,
      previous,
      input,
    );
    const retry = stepMainWireIntegratedModelV3(
      fixture.provider,
      previous,
      input,
    );
    expect(first.converged).toBe(true);
    expect(retry).toEqual(first);
    expect(canonicalJsonStringify(previous)).toBe(before);

    const failed = stepMainWireIntegratedModelV3(
      failingTrialProvider(),
      previous,
      input,
    );
    expect(failed.converged).toBe(false);
    if (failed.converged === false) {
      expect(failed.reason).toBe("coronary-v3-candidate-failed");
      expect(failed.rollbackState).toBe(previous);
      expect(allCommitFlagsFalse(failed)).toBe(true);
    }

    const duplicateCalcium = stepMainWireIntegratedModelV3(
      fixture.provider,
      previous,
      {
        ...input,
        coronary: {
          ...input.coronary,
          calciumDriveOverride: fixture.cold.calciumDrive,
        },
      } as never,
    );
    expect(duplicateCalcium.converged).toBe(false);
    if (duplicateCalcium.converged === false) {
      expect(duplicateCalcium.rollbackState).toBe(previous);
      expect(duplicateCalcium.message)
        .toMatch(/rejects a second calciumDriveOverride/);
      expect(allCommitFlagsFalse(duplicateCalcium)).toBe(true);
    }

    const legacyMcs = stepMainWireIntegratedModelV3(
      fixture.provider,
      previous,
      {
        ...input,
        coronary: {
          ...input.coronary,
          mechanicalSupport: { config: fixture.config, heartRateBpm: 60 },
        },
      } as never,
    );
    expect(legacyMcs.converged).toBe(false);
    if (legacyMcs.converged === false) {
      expect(legacyMcs.rollbackState).toBe(previous);
      expect(legacyMcs.message).toMatch(/rejects legacy algebraic/);
      expect(allCommitFlagsFalse(legacyMcs)).toBe(true);
    }
    expect(canonicalJsonStringify(previous)).toBe(before);
  }, 60_000);

  it("requires irregular coronary windows for flutter and preserves the typed external-AF seam", () => {
    const flutterRhythm = rhythmFixture({ rhythmClass: "flutter" });
    const profile = syntheticProfile(inertance(), "flutter-rejected");
    const config = createMechanicalSupportConfigV1();
    const provider = testProvider();
    expect(() => initializeMainWireIntegratedModelV3({
      coronary: coronaryColdInput(provider),
      rhythm: {
        configuration: flutterRhythm.configuration,
        acceptedState: flutterRhythm.state,
      },
      dynamicMechanicalSupport: { config, profile },
    })).toThrow(/requires an explicit irregular-rhythm-stationary/);

    const flutter = integratedFixture({
      suffix: "flutter-accepted",
      rhythmClass: "flutter",
      autoregulationWindow: irregularWindow(0.5),
    });
    const flutterStep = successfulRegularStep(
      flutter,
      flutter.cold.acceptedState,
      0.001,
    );
    expect(flutterStep.composedRhythmCandidate.capturedAtrialActivation)
      .not.toBeNull();
    expect(flutterStep.composedRhythmCandidate.proximalAvOutputDecision
      ?.conducted).toBe(true);
    expect(flutterStep.composedRhythmCandidate.scheduledCalciumDeposits)
      .toEqual([]);

    const pacingReplayEvents = Object.freeze([Object.freeze({
      pacingEventId: "integrated-v3-authored-pacing-0",
      sourceSequence: 0,
      activationTimeSec: 0.001,
    })]);
    const pacingRhythm = rhythmFixture({ pacingReplayEvents });
    expect(() => initializeMainWireIntegratedModelV3({
      coronary: coronaryColdInput(provider),
      rhythm: {
        configuration: pacingRhythm.configuration,
        acceptedState: pacingRhythm.state,
      },
      dynamicMechanicalSupport: { config, profile },
    })).toThrow(/requires an explicit irregular-rhythm-stationary/);

    const pacing = integratedFixture({
      suffix: "authored-ventricular-pacing-replay",
      pacingReplayEvents,
      autoregulationWindow: irregularWindow(0.5),
    });
    const pacingStep = successfulRegularStep(
      pacing,
      pacing.cold.acceptedState,
      0.001,
    );
    expect(pacingStep.composedRhythmCandidate
      .authoredVentricularPacingReplayTrial?.sourceImpulses[0]?.sourceKind)
      .toBe("pacing");
    expect(pacingStep.composedRhythmCandidate.authoredEctopyTrial
      .sourceImpulses).toEqual([]);
    expect(pacingStep.composedRhythmCandidate.capturedVentricularActivation
      ?.sourceKind).toBe("pacing");
    expect(pacingStep.composedRhythmCandidate.conditionalVviAttempted)
      .toBe(false);

    const af = integratedFixture({
      suffix: "external-af",
      sourceMode: "external-af",
      autoregulationWindow: irregularWindow(0.5),
    });
    const afMaximum = limitMainWireIntegratedModelCandidateTimeV3(
      af.cold.acceptedState,
      0.01,
      {
        configuration: af.rhythmConfiguration,
        externalAfNextBoundaryTimeSec: 0.005,
      },
      af.profile,
      af.config,
    );
    expect(afMaximum.candidateTimeSec).toBe(0.005);
    const afImpulse = createSourceImpulseV2({
      sourceImpulseId: "integrated-af-impulse-0",
      parentCapturedActivationId: null,
      chamber: "atrial",
      sourceKind: "primary-intrinsic",
      sourceId: "external-af-source",
      sourceSequence: 0,
      activationTimeSec: 0.005,
    });
    const afStep = stepMainWireIntegratedModelV3(
      af.provider,
      af.cold.acceptedState,
      {
        ...regularStepInput(af, af.cold.acceptedState, 0.005),
        rhythm: {
          configuration: af.rhythmConfiguration,
          externalAfNextBoundaryTimeSec: 0.005,
          externalAtrialSourceBatch: {
            sourceClass: "atrial-fibrillation",
            ownerInstanceId: "af-owner",
            candidateTimeSec: 0.005,
            sourceImpulses: [afImpulse],
            coordinatedAtrialCalcium: "forbidden",
          },
        },
      },
    );
    expect(afStep.converged).toBe(true);
    if (afStep.converged === true) {
      expect(afStep.composedRhythmCandidate.capturedAtrialActivation
        ?.parentSourceImpulseId).toBe("integrated-af-impulse-0");
      expect(afStep.composedRhythmCandidate.scheduledCalciumDeposits)
        .toEqual([]);
      expect(afStep.acceptedState.composedRhythm.regularAtrialSourceState)
        .toBeNull();
    }
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3
      .externalAfSeam.afOwnerStateOwnedHere).toBe(false);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3
      .externalAfSeam.afWrapperIntegrated).toBe(true);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3
      .externalAfSeam.wrapperTransactionId)
      .toBe(
        "main-wire-integrated-model-external-af-wrapper-transaction-v1",
      );
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3
      .externalAfSeam.browserSessionPathIntegrated).toBe(false);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3
      .externalAfSeam.coordinatedAfAtrialCalciumClaimed).toBe(false);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3
      .externalAfSeam.coordinatedAfAtrialCalciumBlockerScope)
      .toBe(
        "separate-standing-limitation-not-owner-wrapper-or-joint-checkpoint",
      );
  }, 60_000);

  it("derives phase-IABP rate from regular sinus and rejects irregular phase clocks", () => {
    const sinus = integratedFixture({
      suffix: "derived-iabp-clock",
      config: createMechanicalSupportConfigV1({
        iabp: { enabled: true },
      }),
    });
    expect(successfulRegularStep(
      sinus,
      sinus.cold.acceptedState,
      0.001,
    ).dynamicMechanicalSupportTrial.iabp.enabled).toBe(true);

    const externalAf = rhythmFixture({ sourceMode: "external-af" });
    const profile = syntheticProfile(inertance(), "af-iabp-rejected");
    expect(() => initializeMainWireIntegratedModelV3({
      coronary: {
        ...coronaryColdInput(testProvider()),
        autoregulationWindow: irregularWindow(0.5),
      },
      rhythm: {
        configuration: externalAf.configuration,
        acceptedState: externalAf.state,
      },
      dynamicMechanicalSupport: {
        config: createMechanicalSupportConfigV1({
          iabp: { enabled: true },
        }),
        profile,
      },
    })).toThrow(/phase-derived IABP is unavailable for external AF/);

    const validInput = regularStepInput(
      sinus,
      sinus.cold.acceptedState,
      0.001,
    );
    const rejected = stepMainWireIntegratedModelV3(
      sinus.provider,
      sinus.cold.acceptedState,
      {
        ...validInput,
        dynamicMechanicalSupport: {
          ...validInput.dynamicMechanicalSupport,
          heartRateBpm: 30,
        },
      } as never,
    );
    expect(rejected.converged).toBe(false);
    if (rejected.converged === false) {
      expect(rejected.message).toMatch(/context keys are invalid/);
    }
  });

  it("states the closed AF infrastructure gate and remaining limits", () => {
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3
      .proximalAvGateV2DirectlyOwnedByComposedRhythm).toBe(true);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3
      .releaseBlockers.afOwnerWrapperAndJointCheckpoint).toBe("closed");
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3
      .releaseBlockers.iabpAcceptedVentricularSynchronization).toBe("open");
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3
      .longTermPhysiologicalValidationEstablished).toBe(false);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3.releaseReady)
      .toBe(false);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3
      .clinicalValidationClaimed).toBe(false);
  });
});

describe("main-wire composed-rhythm integrated checkpoint V3", () => {
  it("resumes exactly across a pending ventricular calcium deposit", async () => {
    const fixture = integratedFixture({
      suffix: "checkpoint",
      config: createMechanicalSupportConfigV1({
        lvad: { enabled: true, speedRpm: 4_500 },
      }),
      initialAcceptedFlowMlPerSec: flowRecord({ LVAD: 25 }),
      inertance: inertance({
        pumpInternalMmHgSec2PerMl: 0.04,
        drainageMmHgSec2PerMl: 0.02,
        returnPathMmHgSec2PerMl: 0.04,
      }),
    });
    let state = fixture.cold.acceptedState;
    for (let index = 0; index < 3; index += 1) {
      state = successfulRegularStep(fixture, state, 0.001).acceptedState;
    }
    expect(state.acceptedTimeSec).toBe(0.003);
    expect(state.composedRhythm.pendingCalciumDeposits[0]?.depositTimeSec)
      .toBe(0.004);
    const context = checkpointContext(fixture, state);
    const checkpoint = await checkpointMainWireIntegratedModelV3(
      context,
      state,
    );
    const restored = await restoreMainWireIntegratedModelV3(
      context,
      JSON.parse(JSON.stringify(checkpoint)),
    );

    expect(restored).toEqual(state);
    expect(checkpoint.exactResumeClaim)
      .toEqual(MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V3);
    expect(checkpoint.checkpointSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(checkpoint.coronary.checkpointSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(checkpoint.composedRhythm.checkpointSha256)
      .toMatch(/^[0-9a-f]{64}$/);
    expect(checkpoint.composedRhythmConfigurationIdentitySha256)
      .toMatch(/^[0-9a-f]{64}$/);
    expect(checkpoint.composedRhythm.acceptedState.pendingCalciumDeposits)
      .toHaveLength(1);
    expect(MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V3
      .externalAfSeam.externalAfOwnerStateStored).toBe(false);
    expect(MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V3
      .externalAfSeam.afWrapperIntegrated).toBe(true);
    expect(MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V3
      .externalAfSeam.jointCheckpointId)
      .toBe(
        "circleheart.main-wire-integrated-model-external-af-wrapper-checkpoint.v1",
      );
    expect(MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V3
      .externalAfSeam.browserSessionPathIntegrated).toBe(false);
    expect(MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V3
      .releaseBlockers.afOwnerWrapperAndJointCheckpoint).toBe("closed");
    expect(MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V3
      .releaseBlockers.iabpAcceptedVentricularSynchronization).toBe("open");
    expect(MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V3
      .proximalAvGateV2CompleteAcceptedStateStoredInComposedCheckpoint)
      .toBe(true);

    let uninterrupted = state;
    let resumed = restored;
    for (let index = 0; index < 2; index += 1) {
      const direct = successfulRegularStep(fixture, uninterrupted, 0.001);
      const replay = successfulRegularStep(fixture, resumed, 0.001);
      expect(replay).toEqual(direct);
      uninterrupted = direct.acceptedState;
      resumed = replay.acceptedState;
    }
    expect(uninterrupted.acceptedTimeSec).toBe(0.005);
    expect(uninterrupted.composedRhythm.deliveredCalciumDepositCount).toBe(1);
    expect(resumed).toEqual(uninterrupted);
  }, 60_000);

  it("rejects nested tampering and same-ID configuration substitution", async () => {
    const fixture = integratedFixture({ suffix: "checkpoint-integrity" });
    let state = fixture.cold.acceptedState;
    for (let index = 0; index < 3; index += 1) {
      state = successfulRegularStep(fixture, state, 0.001).acceptedState;
    }
    const context = checkpointContext(fixture, state);
    const checkpoint = await checkpointMainWireIntegratedModelV3(
      context,
      state,
    );

    const nestedTamper = cloneCheckpoint(checkpoint);
    nestedTamper.composedRhythm.acceptedState.acceptedTimeSec = 0.0035;
    await rehashOuter(nestedTamper);
    await expect(restoreMainWireIntegratedModelV3(
      context,
      nestedTamper,
    )).rejects.toThrow(/composed rhythm checkpoint SHA-256 mismatch/);

    const alteredRhythm = rhythmFixture({ calciumGainUMPerUnitDrive: 1.1 });
    const substitutedContext = Object.freeze({
      ...context,
      rhythm: Object.freeze({ configuration: alteredRhythm.configuration }),
    });
    expect(alteredRhythm.configuration.configurationId)
      .toBe(fixture.rhythmConfiguration.configurationId);
    await expect(restoreMainWireIntegratedModelV3(
      substitutedContext,
      checkpoint,
    )).rejects.toThrow(/rhythm configuration SHA-256 identity mismatch/);

    const outerTamper = cloneCheckpoint(checkpoint);
    outerTamper.dynamicMechanicalSupport.acceptedFlowMlPerSec.LVAD += 1;
    await expect(restoreMainWireIntegratedModelV3(
      context,
      outerTamper,
    )).rejects.toThrow(/outer SHA-256 mismatch/);
  }, 60_000);
});

function integratedFixture(options: Readonly<{
  suffix: string;
  rhythmClass?: "sinus" | "flutter";
  sourceMode?: "regular" | "external-af";
  pacingReplayEvents?:
    readonly AuthoredVentricularPacingReplayEventInputV1[];
  calciumGainUMPerUnitDrive?: number;
  config?: MechanicalSupportConfigV1;
  initialAcceptedFlowMlPerSec?: Readonly<Record<
    RotarySupportDeviceIdV1,
    number
  >>;
  inertance?: DynamicRotaryPumpCircuitInertanceV1;
  autoregulationWindow?: Readonly<{
    durationSec: number;
    interpretation: "irregular-rhythm-stationary";
  }>;
}>): Fixture {
  const provider = testProvider();
  const rhythm = rhythmFixture(options);
  const profile = syntheticProfile(
    options.inertance ?? inertance(),
    options.suffix,
  );
  const config = options.config ?? createMechanicalSupportConfigV1();
  const cold = initializeMainWireIntegratedModelV3({
    coronary: {
      ...coronaryColdInput(provider),
      ...(options.autoregulationWindow === undefined
        ? {}
        : { autoregulationWindow: options.autoregulationWindow }),
    },
    rhythm: {
      configuration: rhythm.configuration,
      acceptedState: rhythm.state,
    },
    dynamicMechanicalSupport: {
      config,
      profile,
      ...(options.initialAcceptedFlowMlPerSec === undefined
        ? {}
        : {
          initialAcceptedFlowMlPerSec:
            options.initialAcceptedFlowMlPerSec,
        }),
    },
  });
  return Object.freeze({
    provider,
    rhythmConfiguration: rhythm.configuration,
    rhythmInitialState: rhythm.state,
    profile,
    config,
    cold,
  });
}

function rhythmFixture(options: Readonly<{
  rhythmClass?: "sinus" | "flutter";
  sourceMode?: "regular" | "external-af";
  pacingReplayEvents?:
    readonly AuthoredVentricularPacingReplayEventInputV1[];
  calciumGainUMPerUnitDrive?: number;
}> = {}): Readonly<{
  configuration: AcceptedComposedRhythmTransactionConfigurationV2;
  state: AcceptedComposedRhythmTransactionStateV2;
}> {
  const captureConfiguration =
    createAcceptedElectricalCaptureOwnerConfigurationV2({
      configurationId: "integrated-v3-capture-config",
      ownerInstanceId: "integrated-v3-capture-owner",
      atrialGate: {
        gateInstanceId: "integrated-v3-atrial-capture-gate",
        refractoryPeriodSec: 0.0005,
      },
      ventricularGate: {
        gateInstanceId: "integrated-v3-ventricular-capture-gate",
        refractoryPeriodSec: 0.0005,
      },
    });
  const intervalConfiguration =
    createAcceptedVentricularIntervalStrengthConfigurationV1({
      configurationId: "integrated-v3-interval-config",
      ownerInstanceId: "integrated-v3-interval-owner",
      parameterProvenance: {
        kind: "explicit-research-parameters",
        sourceId: "integrated-v3-test-explicit",
      },
      recoveryTimeConstantSec: 0.5,
      releaseFractionBeta: 0.8,
      releasedLoadReturnFractionR: 0.5,
      intervalInfluxInhibitionFractionH: 0.2,
      referenceCycleLengthSec: 1,
    });
  const regularSource = createRegularAtrialSourceConfigurationV1({
    configurationId: "integrated-v3-regular-config",
    ownerInstanceId: "integrated-v3-regular-owner",
    sourceId: "integrated-v3-primary-atrial-source",
    rhythmClass: options.rhythmClass ?? "sinus",
    cycleLengthSec: options.rhythmClass === "flutter" ? 0.2 : 1,
  });
  const sourceMode = options.sourceMode ?? "regular";
  const configuration = createAcceptedComposedRhythmTransactionConfigurationV2({
    configurationId: `integrated-v3-composed-${sourceMode}`,
    ownerInstanceId: "integrated-v3-composed-owner",
    atrialSource: sourceMode === "regular"
      ? {
        mode: "regular",
        regularSourceConfiguration: regularSource,
        externalAfOwnerInstanceId: null,
      }
      : {
        mode: "external-af",
        regularSourceConfiguration: null,
        externalAfOwnerInstanceId: "af-owner",
      },
    authoredEctopySchedule:
      createAcceptedAuthoredEctopyScheduleConfigurationV2({
        configurationId: "integrated-v3-ectopy-config",
        ownerInstanceId: "integrated-v3-ectopy-owner",
        scheduleId: "integrated-v3-empty-ectopy-schedule",
        events: [],
      }),
    authoredVentricularPacingReplay:
      options.pacingReplayEvents === undefined
        ? null
        : createAcceptedAuthoredVentricularPacingReplaySourceConfigurationV1({
          configurationId: "integrated-v3-pacing-replay-config",
          ownerInstanceId: "integrated-v3-pacing-replay-owner",
          replayId: "integrated-v3-pacing-replay",
          sourceId: "integrated-v3-authored-pacing-source",
          events: options.pacingReplayEvents,
        }),
    electricalCaptureOwner: captureConfiguration,
    avGateParameters: createRecoveryConcealmentAvGateParametersV1({
      parameterSetId: "integrated-v3-av-parameters",
      parameterProvenance: {
        kind: "explicit-research-parameters",
        sourceId: "integrated-v3-test-explicit",
      },
      minimumConductionDelaySec: 0.001,
      recoveryDelayAmplitudeSec: 0,
      recoveryTimeConstantSec: 1,
      postConductionRefractorySec: 0.001,
      concealedRefractoryExtensionSec: 0,
    }),
    avGateInstanceId: "integrated-v3-av-gate",
    distalGate: createDistalConductionGateConfigurationV1({
      configurationId: "integrated-v3-distal-config",
      gateInstanceId: "integrated-v3-distal-gate",
      parameterProvenance: {
        kind: "explicit-research-parameters",
        sourceId: "integrated-v3-test-explicit",
      },
      hvConductionDelaySec: 0.001,
      distalEffectiveRefractoryPeriodSec: 0,
      modeConfiguration: { mode: "pass" },
    }),
    ventricularBackup:
      createAcceptedVentricularBackupSourceConfigurationV2({
        configurationId: "integrated-v3-backup-config",
        ownerInstanceId: "integrated-v3-backup-owner",
        parameterProvenance: {
          kind: "authored",
          sourceId: "integrated-v3-test-explicit",
        },
        intrinsicEscapeSourceId: "integrated-v3-escape-source",
        intrinsicEscapeCycleLengthSec: 2,
        vviPacingSourceId: "integrated-v3-vvi-source",
        vviLowerRateLimitPerMin: 30,
      }),
    ventricularIntervalStrength: intervalConfiguration,
    calciumParametersByWall: Object.freeze({
      LA: calciumParameters(options.calciumGainUMPerUnitDrive),
      LVFW: calciumParameters(options.calciumGainUMPerUnitDrive),
      SEP: calciumParameters(options.calciumGainUMPerUnitDrive),
      RVFW: calciumParameters(options.calciumGainUMPerUnitDrive),
      RA: calciumParameters(options.calciumGainUMPerUnitDrive),
    }),
    sinusAtrialCalciumDeposit: null,
    pacAtrialCalciumDeposit: null,
    ventricularCalciumDeposit: {
      electricalToCalciumDelaySec: 0.001,
      lvFreeWallBaseStrength: 1,
      septalBaseStrength: 0.95,
      rvFreeWallBaseStrength: 0.9,
    },
  });
  const zero = zeroExactEventCalciumStateV1();
  const state = initializeAcceptedComposedRhythmTransactionStateV2(
    configuration,
    {
      acceptedTimeSec: 0,
      regularFirstFutureActivationTimeSec:
        sourceMode === "regular" ? 0.001 : null,
      regularFirstSourceSequence: sourceMode === "regular" ? 0 : null,
      priorAcceptedAtrialCapture: null,
      priorAcceptedVentricularActivation:
        priorVentricularCapture(captureConfiguration),
      initialNormalizedSrLoadState:
        intervalConfiguration.referenceNormalizedSrLoadState,
      calciumStateByWall: Object.freeze({
        LA: zero,
        LVFW: zero,
        SEP: zero,
        RVFW: zero,
        RA: zero,
      }),
    },
  );
  return Object.freeze({ configuration, state });
}

function priorVentricularCapture(
  configuration: ReturnType<
    typeof createAcceptedElectricalCaptureOwnerConfigurationV2
  >,
): CapturedElectricalActivationV2 {
  const captureState = initializeAcceptedElectricalCaptureOwnerStateV2(
    configuration,
    {
      acceptedTimeSec: 0,
      atrialPriorCapture: null,
      ventricularPriorCapture: null,
    },
  );
  const source = createSourceImpulseV2({
    sourceImpulseId: "integrated-v3-history-source-0",
    parentCapturedActivationId: null,
    chamber: "ventricular",
    sourceKind: "escape",
    sourceId: "integrated-v3-history-source",
    sourceSequence: 0,
    activationTimeSec: 0,
  });
  return evaluateAcceptedElectricalCaptureBatchCandidateV2(
    captureState,
    { candidateTimeSec: 0, sourceImpulses: [source] },
  ).capturedActivations[0]!;
}

function calciumParameters(calciumGainUMPerUnitDrive = 1) {
  return Object.freeze({
    tauRiseSec: 0.003,
    tauDecaySec: 0.02,
    calciumRestUM: 0.2,
    calciumGainUMPerUnitDrive,
  });
}

function regularStepInput(
  fixture: Fixture,
  state: MainWireIntegratedModelAcceptedStateV3<TestState>,
  dtSec: number,
): MainWireIntegratedModelStepInputV3 {
  return Object.freeze({
    candidateTimeSec: state.acceptedTimeSec + dtSec,
    coronary: coronaryStepInput(),
    rhythm: Object.freeze({
      configuration: fixture.rhythmConfiguration,
      externalAfNextBoundaryTimeSec: null,
      externalAtrialSourceBatch: null,
    }),
    dynamicMechanicalSupport: Object.freeze({
      config: fixture.config,
      profile: fixture.profile,
    }),
  });
}

function successfulRegularStep(
  fixture: Fixture,
  state: MainWireIntegratedModelAcceptedStateV3<TestState>,
  dtSec: number,
) {
  const result = stepMainWireIntegratedModelV3(
    fixture.provider,
    state,
    regularStepInput(fixture, state, dtSec),
  );
  if (result.converged === false) throw new Error(result.message);
  return result;
}

function maximumRegular(
  fixture: Fixture,
  state: MainWireIntegratedModelAcceptedStateV3<TestState>,
  requestedStepSec: number,
) {
  return limitMainWireIntegratedModelCandidateTimeV3(
    state,
    state.acceptedTimeSec + requestedStepSec,
    {
      configuration: fixture.rhythmConfiguration,
      externalAfNextBoundaryTimeSec: null,
    },
    fixture.profile,
    fixture.config,
  );
}

function coronaryColdInput(provider: TestProvider) {
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

function checkpointContext(
  fixture: Fixture,
  state: MainWireIntegratedModelAcceptedStateV3<TestState>,
): MainWireIntegratedModelCheckpointContextV3<TestState> {
  return Object.freeze({
    provider: fixture.provider,
    coronaryPrior: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
    collapseHydraulics:
      MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
    impMechanism: "cep-shortening-induced" as const,
    shorteningImpPrior:
      NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
    coronaryAutoregulationBinding:
      state.coronary.coronaryAutoregulationBinding,
    rhythm: Object.freeze({ configuration: fixture.rhythmConfiguration }),
    dynamicMechanicalSupportProfile: fixture.profile,
    dynamicMechanicalSupportConfig: fixture.config,
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
    profileId: `composed-integrated-test-${suffix}`,
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
    circuitProfileId: `composed-integrated-${deviceId}-${suffix}`,
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

function testProvider(): TestProvider {
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
    providerId: "composed-integrated-test-provider",
    parameterSetId: "composed-integrated-test-prior",
    parameterIdentityHash: "composed-integrated-test-hash",
    stateSchemaVersion: 1,
    stateCodec: Object.freeze({
      clone: (state: TestState) => Object.freeze({ ...state }),
      encode: (state: TestState) => Object.freeze({ ...state }),
      decode: (encoded: unknown) =>
        Object.freeze({ ...(encoded as TestState) }),
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

function failingTrialProvider(): TestProvider {
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

function expectGlobalBloodVolumeConserved(
  state: MainWireIntegratedModelAcceptedStateV3<TestState>,
): void {
  const coronaryVolumeMl = Object.values(
    state.coronary.coronary.volumeMlByNode,
  ).reduce((sum, value) => sum + value, 0);
  expect(
    state.coronary.circulation.totalBloodVolumeMl + coronaryVolumeMl,
  ).toBeCloseTo(state.coronary.fixedGlobalTotalBloodVolumeMl, 10);
}

function allCommitFlagsFalse(value: Readonly<Record<string, unknown>>): boolean {
  return [
    "mechanicsCommitted",
    "circulationCommitted",
    "coronaryCommitted",
    "mvcReferenceCommitted",
    "autoregulationCommitted",
    "composedRhythmCommitted",
    "dynamicMechanicalSupportCommitted",
  ].every((key) => value[key] === false);
}

function cloneCheckpoint(
  checkpoint: MainWireIntegratedModelCheckpointV3,
): any {
  return JSON.parse(JSON.stringify(checkpoint));
}

async function rehashOuter(checkpoint: any): Promise<void> {
  const { checkpointSha256: _old, ...payload } = checkpoint;
  checkpoint.checkpointSha256 = await sha256CanonicalJsonHex(payload);
}
