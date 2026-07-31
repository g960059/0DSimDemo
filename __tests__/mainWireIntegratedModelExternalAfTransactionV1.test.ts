import { describe, expect, it } from "vitest";

import { defaultParams } from "@/engine/core/params";
import { NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2 } from "@/engine/coronary/mainWireCoronaryBoundaryV2";
import {
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
} from "@/engine/coronary/mainWireNormalAdultCoronaryV2";
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
  MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_CHECKPOINT_CLAIM_V1,
  checkpointMainWireIntegratedModelExternalAfV1,
  restoreMainWireIntegratedModelExternalAfV1,
  type MainWireIntegratedModelExternalAfCheckpointContextV1,
  type MainWireIntegratedModelExternalAfCheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelExternalAfCheckpointV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_TRANSACTION_CLAIM_V1,
  initializeMainWireIntegratedModelExternalAfV1,
  maximumMainWireIntegratedModelExternalAfStepDurationV1,
  stepMainWireIntegratedModelExternalAfV1,
  type MainWireIntegratedModelExternalAfAcceptedStateV1,
  type MainWireIntegratedModelExternalAfColdResultV1,
  type MainWireIntegratedModelExternalAfStepInputV1,
} from "@/engine/myocardium/MainWireIntegratedModelExternalAfTransactionV1";
import { FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1 } from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import { zeroExactEventCalciumStateV1 } from "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import {
  MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
  type MainWireFiveWallFreeCalciumDriveV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import { MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID } from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import { createMainWireNormalAdultCommonPericardiumV1 } from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  createAcceptedAfAtrialSourceConfigurationV1,
  type AcceptedAfAtrialSourceConfigurationV1,
} from "@/engine/myocardium/rhythm/acceptedAfAtrialSourceOwnerV1";
import { createAcceptedAuthoredEctopyScheduleConfigurationV2 } from "@/engine/myocardium/rhythm/acceptedAuthoredEctopyScheduleV2";
import {
  createAcceptedComposedRhythmTransactionConfigurationV2,
  initializeAcceptedComposedRhythmTransactionStateV2,
  type AcceptedComposedRhythmTransactionConfigurationV2,
  type AcceptedComposedRhythmTransactionStateV2,
} from "@/engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2";
import { createDistalConductionGateConfigurationV1 } from "@/engine/myocardium/rhythm/acceptedDistalConductionGateV1";
import {
  createAcceptedElectricalCaptureOwnerConfigurationV2,
  createSourceImpulseV2,
  evaluateAcceptedElectricalCaptureBatchCandidateV2,
  initializeAcceptedElectricalCaptureOwnerStateV2,
  type CapturedElectricalActivationV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";
import { createAcceptedVentricularBackupSourceConfigurationV2 } from "@/engine/myocardium/rhythm/acceptedVentricularBackupSourceOwnerV2";
import { createAcceptedVentricularIntervalStrengthConfigurationV1 } from "@/engine/myocardium/rhythm/acceptedVentricularIntervalStrengthOwnerV1";
import { createRecoveryConcealmentAvGateParametersV1 } from "@/engine/myocardium/rhythm/recoveryConcealmentAvGateV1";
import {
  WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
  type WholeHeartMechanicsProviderV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";
import { MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1 } from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

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
  afSourceConfiguration: AcceptedAfAtrialSourceConfigurationV1;
  rhythmConfiguration: AcceptedComposedRhythmTransactionConfigurationV2;
  rhythmInitialState: AcceptedComposedRhythmTransactionStateV2;
  profile: DynamicMechanicalSupportInertanceProfileV1;
  config: MechanicalSupportConfigV1;
  cold: MainWireIntegratedModelExternalAfColdResultV1<TestState>;
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

describe("main-wire external-AF atomic wrapper transaction V1", () => {
  it("clips an off-grid AF boundary and sends one complete typed batch into V3", () => {
    const fixture = integratedFixture("off-grid");
    const initial = fixture.cold.acceptedState;
    const maximum = maximumMainWireIntegratedModelExternalAfStepDurationV1(
      initial,
      0.01,
      bindingContext(fixture),
    );

    expect(maximum).toMatchObject({
      requestedEndTimeSec: 0.01,
      maximumStepSec: 0.005,
      candidateTimeSec: 0.005,
      externalAfNextBoundaryTimeSec: 0.005,
      clippedByAfSourceBoundary: true,
      clippedByIntegratedModelBoundary: true,
      afSourceAndIntegratedModelBoundaryTie: true,
    });
    expect(maximum.integratedModel.rhythmBoundaryOwners).toContain(
      "external-af",
    );

    const result = successfulStep(fixture, initial, 0.005);
    expect(result.externalAtrialSourceBatch).toMatchObject({
      sourceClass: "atrial-fibrillation",
      ownerInstanceId: fixture.afSourceConfiguration.ownerInstanceId,
      candidateTimeSec: 0.005,
      coordinatedAtrialCalcium: "forbidden",
    });
    expect(result.externalAtrialSourceBatch.sourceImpulses).toHaveLength(1);
    expect(result.externalAtrialSourceBatch.sourceImpulses[0]).toMatchObject({
      chamber: "atrial",
      sourceKind: "primary-intrinsic",
      parentCapturedActivationId: null,
      sourceId: fixture.afSourceConfiguration.sourceId,
      sourceSequence: 0,
      activationTimeSec: 0.005,
    });
    expect(
      result.integratedModelStep.composedRhythmCandidate
        .capturedAtrialActivation,
    ).not.toBeNull();
    expect(
      result.integratedModelStep.composedRhythmCandidate
        .scheduledCalciumDeposits,
    ).toEqual([]);
    expect(result.acceptedState).toMatchObject({
      revision: 1,
      acceptedTimeSec: 0.005,
    });
    expect(result.acceptedState.afSource.revision).toBe(1);
    expect(result.acceptedState.integratedModel.revision).toBe(1);
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_TRANSACTION_CLAIM_V1.coordinatedAfAtrialCalciumClaimed,
    ).toBe(false);
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_TRANSACTION_CLAIM_V1.patientFittingClaimed,
    ).toBe(false);

    expect(() =>
      integratedFixture("wrong-owner", {
        rhythmExternalAfOwnerInstanceId: "another-af-owner",
      }),
    ).toThrow(/ownerInstanceId binding mismatch/);
  });

  it("is retry-pure and preserves both accepted identities on every failure", () => {
    const fixture = integratedFixture("retry");
    const initial = fixture.cold.acceptedState;
    const first = successfulStep(fixture, initial, 0.005);
    const retry = successfulStep(fixture, initial, 0.005);
    expect(retry).toEqual(first);

    const crossing = stepMainWireIntegratedModelExternalAfV1(
      fixture.provider,
      initial,
      stepInput(fixture, 0.01),
    );
    expect(crossing.converged).toBe(false);
    if (crossing.converged === false) {
      expect(crossing.reason).toBe("outer-binding-or-boundary-rejected");
      expect(crossing.rollbackState).toBe(initial);
      expect(crossing.rollbackState.afSource).toBe(initial.afSource);
      expect(crossing.rollbackState.integratedModel).toBe(
        initial.integratedModel,
      );
      expect(crossing.afSourceCommitted).toBe(false);
      expect(crossing.integratedModelCommitted).toBe(false);
      expect(crossing.message).toMatch(/crosses.*boundary/);
    }

    const failed = stepMainWireIntegratedModelExternalAfV1(
      failingTrialProvider(),
      initial,
      stepInput(fixture, 0.005),
    );
    expect(failed.converged).toBe(false);
    if (failed.converged === false) {
      expect(failed.reason).toBe("integrated-model-v3-candidate-failed");
      expect(failed.rollbackState).toBe(initial);
      expect(failed.rollbackState.afSource).toBe(initial.afSource);
      expect(failed.rollbackState.integratedModel).toBe(
        initial.integratedModel,
      );
      expect(failed.afSourceTrial?.sourceImpulses).toHaveLength(1);
      expect(failed.integratedModelFailure?.rollbackState).toBe(
        initial.integratedModel,
      );
      expect(failed.afSourceCommitted).toBe(false);
      expect(failed.integratedModelCommitted).toBe(false);
      expect(allNestedCommitFlagsFalse(failed.integratedModelFailure)).toBe(
        true,
      );
    }
  });

  it("rejects same-ID AF and composed-rhythm context substitution", () => {
    const fixture = integratedFixture("binding");
    const initial = fixture.cold.acceptedState;
    const changedAf = afConfiguration(1_338);
    expect(changedAf.configurationId).toBe(
      fixture.afSourceConfiguration.configurationId,
    );
    const afSubstitution = stepMainWireIntegratedModelExternalAfV1(
      fixture.provider,
      initial,
      Object.freeze({
        ...stepInput(fixture, 0.005),
        afSourceConfiguration: changedAf,
      }),
    );
    expect(afSubstitution.converged).toBe(false);
    if (afSubstitution.converged === false) {
      expect(afSubstitution.rollbackState).toBe(initial);
      expect(afSubstitution.message).toMatch(/AF configuration mismatch/);
    }

    const changedRhythm = rhythmFixture({ calciumGainUMPerUnitDrive: 1.1 });
    expect(changedRhythm.configuration.configurationId).toBe(
      fixture.rhythmConfiguration.configurationId,
    );
    const rhythmSubstitution = stepMainWireIntegratedModelExternalAfV1(
      fixture.provider,
      initial,
      Object.freeze({
        ...stepInput(fixture, 0.005),
        rhythm: Object.freeze({
          configuration: changedRhythm.configuration,
        }),
      }),
    );
    expect(rhythmSubstitution.converged).toBe(false);
    if (rhythmSubstitution.converged === false) {
      expect(rhythmSubstitution.rollbackState).toBe(initial);
      expect(rhythmSubstitution.message).toMatch(
        /rhythm configuration mismatch/,
      );
    }
  });
});

describe("main-wire external-AF atomic checkpoint V1", () => {
  it("resumes exact AF random state and a pending ventricular calcium deposit", async () => {
    const fixture = integratedFixture("checkpoint");
    let state = fixture.cold.acceptedState;
    state = successfulStep(fixture, state, 0.005).acceptedState;
    state = successfulStep(fixture, state, 0.001).acceptedState;
    state = successfulStep(fixture, state, 0.001).acceptedState;
    expect(state.acceptedTimeSec).toBe(0.007);
    expect(
      state.integratedModel.composedRhythm.pendingCalciumDeposits[0]
        ?.depositTimeSec,
    ).toBe(0.008);

    const context = checkpointContext(fixture, state);
    const checkpoint = await checkpointMainWireIntegratedModelExternalAfV1(
      context,
      state,
    );
    const restored = await restoreMainWireIntegratedModelExternalAfV1(
      context,
      jsonClone(checkpoint),
    );
    const restoredCheckpoint =
      await checkpointMainWireIntegratedModelExternalAfV1(context, restored);

    expect(restored).toEqual(state);
    expect(restored).not.toBe(state);
    expect(restored.afSource).not.toBe(state.afSource);
    expect(restored.integratedModel).not.toBe(state.integratedModel);
    expect(restoredCheckpoint).toEqual(checkpoint);
    expect(restoredCheckpoint.checkpointSha256)
      .toBe(checkpoint.checkpointSha256);
    expect(checkpoint.exactResumeClaim).toEqual(
      MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_CHECKPOINT_CLAIM_V1,
    );
    expect(checkpoint.afSource.acceptedState.randomState).toEqual(
      state.afSource.randomState,
    );
    expect(
      checkpoint.afSource.acceptedState.innovationHistoryNewestFirstSec,
    ).toEqual(state.afSource.innovationHistoryNewestFirstSec);
    expect(
      checkpoint.afSource.acceptedState.randomState.gammaAttemptCount,
    ).toBeGreaterThan(0);
    expect(
      checkpoint.integratedModel.composedRhythm.acceptedState
        .pendingCalciumDeposits,
    ).toHaveLength(1);

    let directState = state;
    let replayState = restored;
    let futureAfImpulseCount = 0;
    while (directState.acceptedTimeSec < 0.4) {
      const requestedStepSec = Math.min(
        0.005,
        0.4 - directState.acceptedTimeSec,
      );
      const maximum =
        maximumMainWireIntegratedModelExternalAfStepDurationV1(
          directState,
          requestedStepSec,
          bindingContext(fixture),
        );
      const direct = successfulStep(
        fixture,
        directState,
        maximum.maximumStepSec,
      );
      const replay = successfulStep(
        fixture,
        replayState,
        maximum.maximumStepSec,
      );
      expect(replay).toEqual(direct);
      futureAfImpulseCount += direct.afSourceTrial.sourceImpulses.length;
      directState = direct.acceptedState;
      replayState = replay.acceptedState;
    }
    expect(futureAfImpulseCount).toBeGreaterThanOrEqual(2);
    expect(replayState).toEqual(directState);
    expect(replayState.afSource.randomState)
      .toEqual(directState.afSource.randomState);
    expect(
      replayState.integratedModel.composedRhythm
        .deliveredCalciumDepositCount,
    ).toBeGreaterThanOrEqual(1);
  }, 60_000);

  it("rejects nested tamper, outer clock splits, and complete-context substitution", async () => {
    const fixture = integratedFixture("checkpoint-integrity");
    let state = fixture.cold.acceptedState;
    state = successfulStep(fixture, state, 0.005).acceptedState;
    state = successfulStep(fixture, state, 0.001).acceptedState;
    state = successfulStep(fixture, state, 0.001).acceptedState;
    const context = checkpointContext(fixture, state);
    const checkpoint = await checkpointMainWireIntegratedModelExternalAfV1(
      context,
      state,
    );

    const afTamper = jsonClone(checkpoint);
    afTamper.afSource.acceptedState.randomState.state0 =
      (afTamper.afSource.acceptedState.randomState.state0 ^ 1) >>> 0;
    await rehashOuter(afTamper);
    await expect(
      restoreMainWireIntegratedModelExternalAfV1(context, afTamper),
    ).rejects.toThrow(/AF atrial source checkpoint SHA-256 mismatch/);

    const v3Tamper = jsonClone(checkpoint);
    v3Tamper.integratedModel.composedRhythm.acceptedState.acceptedTimeSec += 0.0001;
    await rehashOuter(v3Tamper);
    await expect(
      restoreMainWireIntegratedModelExternalAfV1(context, v3Tamper),
    ).rejects.toThrow(
      /composed integrated model checkpoint outer SHA-256 mismatch/,
    );

    const clockSplit = jsonClone(checkpoint);
    clockSplit.acceptedTimeSec += 0.0001;
    await rehashOuter(clockSplit);
    await expect(
      restoreMainWireIntegratedModelExternalAfV1(context, clockSplit),
    ).rejects.toThrow(/nested owner clocks differ/);

    const changedAfContext = Object.freeze({
      ...context,
      afSourceConfiguration: afConfiguration(1_338),
    });
    await expect(
      restoreMainWireIntegratedModelExternalAfV1(changedAfContext, checkpoint),
    ).rejects.toThrow(/AF configuration identity mismatch/);

    const changedRhythm = rhythmFixture({ calciumGainUMPerUnitDrive: 1.1 });
    const changedRhythmContext = Object.freeze({
      ...context,
      integratedModel: Object.freeze({
        ...context.integratedModel,
        rhythm: Object.freeze({ configuration: changedRhythm.configuration }),
      }),
    });
    await expect(
      restoreMainWireIntegratedModelExternalAfV1(
        changedRhythmContext,
        checkpoint,
      ),
    ).rejects.toThrow(/rhythm configuration identity mismatch/);
  }, 60_000);
});

function integratedFixture(
  suffix: string,
  options: Readonly<{
    rhythmExternalAfOwnerInstanceId?: string;
  }> = {},
): Fixture {
  const provider = testProvider();
  const afSourceConfiguration = afConfiguration();
  const rhythm = rhythmFixture({
    externalAfOwnerInstanceId:
      options.rhythmExternalAfOwnerInstanceId ??
      afSourceConfiguration.ownerInstanceId,
  });
  const profile = syntheticProfile(inertance(), suffix);
  const config = createMechanicalSupportConfigV1();
  const cold = initializeMainWireIntegratedModelExternalAfV1({
    afSource: {
      configuration: afSourceConfiguration,
      initialState: {
        acceptedTimeSec: 0,
        firstSourceActivationTimeSec: 0.005,
      },
    },
    integratedModel: {
      coronary: {
        ...coronaryColdInput(provider),
        autoregulationWindow: {
          durationSec: 0.5,
          interpretation: "irregular-rhythm-stationary",
        },
      },
      rhythm: {
        configuration: rhythm.configuration,
        acceptedState: rhythm.state,
      },
      dynamicMechanicalSupport: {
        config,
        profile,
      },
    },
  });
  return Object.freeze({
    provider,
    afSourceConfiguration,
    rhythmConfiguration: rhythm.configuration,
    rhythmInitialState: rhythm.state,
    profile,
    config,
    cold,
  });
}

function afConfiguration(seedUint32 = 1_337) {
  return createAcceptedAfAtrialSourceConfigurationV1({
    configurationId: "external-AF-wrapper-configuration",
    ownerInstanceId: "af-owner",
    sourceId: "external-AF-atrial-source",
    seedUint32,
    pearsonParentMoments: {
      meanSec: 0.155,
      standardDeviationSec: 0.022,
      skewness: 1.1,
      kurtosis: 8,
    },
    movingAverageCoefficients: [0.82, 0.18],
  });
}

function rhythmFixture(
  options: Readonly<{
    externalAfOwnerInstanceId?: string;
    calciumGainUMPerUnitDrive?: number;
  }> = {},
): Readonly<{
  configuration: AcceptedComposedRhythmTransactionConfigurationV2;
  state: AcceptedComposedRhythmTransactionStateV2;
}> {
  const captureConfiguration =
    createAcceptedElectricalCaptureOwnerConfigurationV2({
      configurationId: "external-AF-wrapper-capture-configuration",
      ownerInstanceId: "external-AF-wrapper-capture-owner",
      atrialGate: {
        gateInstanceId: "external-AF-wrapper-atrial-capture-gate",
        refractoryPeriodSec: 0.0005,
      },
      ventricularGate: {
        gateInstanceId: "external-AF-wrapper-ventricular-capture-gate",
        refractoryPeriodSec: 0.0005,
      },
    });
  const intervalConfiguration =
    createAcceptedVentricularIntervalStrengthConfigurationV1({
      configurationId: "external-AF-wrapper-interval-configuration",
      ownerInstanceId: "external-AF-wrapper-interval-owner",
      parameterProvenance: {
        kind: "explicit-research-parameters",
        sourceId: "external-AF-wrapper-test-explicit",
      },
      recoveryTimeConstantSec: 0.5,
      releaseFractionBeta: 0.8,
      releasedLoadReturnFractionR: 0.5,
      intervalInfluxInhibitionFractionH: 0.2,
      referenceCycleLengthSec: 1,
    });
  const configuration = createAcceptedComposedRhythmTransactionConfigurationV2({
    configurationId: "external-AF-wrapper-composed-configuration",
    ownerInstanceId: "external-AF-wrapper-composed-owner",
    atrialSource: {
      mode: "external-af",
      regularSourceConfiguration: null,
      externalAfOwnerInstanceId:
        options.externalAfOwnerInstanceId ?? "af-owner",
    },
    authoredEctopySchedule: createAcceptedAuthoredEctopyScheduleConfigurationV2(
      {
        configurationId: "external-AF-wrapper-ectopy-configuration",
        ownerInstanceId: "external-AF-wrapper-ectopy-owner",
        scheduleId: "external-AF-wrapper-empty-ectopy-schedule",
        events: [],
      },
    ),
    authoredVentricularPacingReplay: null,
    electricalCaptureOwner: captureConfiguration,
    avGateParameters: createRecoveryConcealmentAvGateParametersV1({
      parameterSetId: "external-AF-wrapper-AV-parameters",
      parameterProvenance: {
        kind: "explicit-research-parameters",
        sourceId: "external-AF-wrapper-test-explicit",
      },
      minimumConductionDelaySec: 0.001,
      recoveryDelayAmplitudeSec: 0,
      recoveryTimeConstantSec: 1,
      postConductionRefractorySec: 0.001,
      concealedRefractoryExtensionSec: 0,
    }),
    avGateInstanceId: "external-AF-wrapper-AV-gate",
    distalGate: createDistalConductionGateConfigurationV1({
      configurationId: "external-AF-wrapper-distal-configuration",
      gateInstanceId: "external-AF-wrapper-distal-gate",
      parameterProvenance: {
        kind: "explicit-research-parameters",
        sourceId: "external-AF-wrapper-test-explicit",
      },
      hvConductionDelaySec: 0.001,
      distalEffectiveRefractoryPeriodSec: 0,
      modeConfiguration: { mode: "pass" },
    }),
    ventricularBackup: createAcceptedVentricularBackupSourceConfigurationV2({
      configurationId: "external-AF-wrapper-backup-configuration",
      ownerInstanceId: "external-AF-wrapper-backup-owner",
      parameterProvenance: {
        kind: "authored",
        sourceId: "external-AF-wrapper-test-explicit",
      },
      intrinsicEscapeSourceId: "external-AF-wrapper-escape-source",
      intrinsicEscapeCycleLengthSec: 2,
      vviPacingSourceId: "external-AF-wrapper-VVI-source",
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
      regularFirstFutureActivationTimeSec: null,
      regularFirstSourceSequence: null,
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
    sourceImpulseId: "external-AF-wrapper-history-source-0",
    parentCapturedActivationId: null,
    chamber: "ventricular",
    sourceKind: "escape",
    sourceId: "external-AF-wrapper-history-source",
    sourceSequence: 0,
    activationTimeSec: 0,
  });
  return evaluateAcceptedElectricalCaptureBatchCandidateV2(captureState, {
    candidateTimeSec: 0,
    sourceImpulses: [source],
  }).capturedActivations[0]!;
}

function calciumParameters(calciumGainUMPerUnitDrive = 1) {
  return Object.freeze({
    tauRiseSec: 0.003,
    tauDecaySec: 0.02,
    calciumRestUM: 0.2,
    calciumGainUMPerUnitDrive,
  });
}

function bindingContext(fixture: Fixture) {
  return Object.freeze({
    afSourceConfiguration: fixture.afSourceConfiguration,
    rhythm: Object.freeze({ configuration: fixture.rhythmConfiguration }),
    dynamicMechanicalSupportProfile: fixture.profile,
    dynamicMechanicalSupportConfig: fixture.config,
  });
}

function stepInput(
  fixture: Fixture,
  dtSec: number,
): MainWireIntegratedModelExternalAfStepInputV1 {
  return Object.freeze({
    dtSec,
    afSourceConfiguration: fixture.afSourceConfiguration,
    coronary: coronaryStepInput(),
    rhythm: Object.freeze({ configuration: fixture.rhythmConfiguration }),
    dynamicMechanicalSupport: Object.freeze({
      config: fixture.config,
      profile: fixture.profile,
    }),
  });
}

function successfulStep(
  fixture: Fixture,
  state: MainWireIntegratedModelExternalAfAcceptedStateV1<TestState>,
  dtSec: number,
) {
  const result = stepMainWireIntegratedModelExternalAfV1(
    fixture.provider,
    state,
    stepInput(fixture, dtSec),
  );
  if (result.converged === false) throw new Error(result.message);
  return result;
}

function checkpointContext(
  fixture: Fixture,
  state: MainWireIntegratedModelExternalAfAcceptedStateV1<TestState>,
): MainWireIntegratedModelExternalAfCheckpointContextV1<TestState> {
  return Object.freeze({
    afSourceConfiguration: fixture.afSourceConfiguration,
    integratedModel: Object.freeze({
      provider: fixture.provider,
      coronaryPrior: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
      collapseHydraulics:
        MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
      impMechanism: "cep-shortening-induced" as const,
      shorteningImpPrior: NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
      coronaryAutoregulationBinding:
        state.integratedModel.coronary.coronaryAutoregulationBinding,
      rhythm: Object.freeze({ configuration: fixture.rhythmConfiguration }),
      dynamicMechanicalSupportProfile: fixture.profile,
      dynamicMechanicalSupportConfig: fixture.config,
    }),
  });
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

function syntheticProfile(
  sameInertance: DynamicRotaryPumpCircuitInertanceV1,
  suffix: string,
): DynamicMechanicalSupportInertanceProfileV1 {
  return createDynamicMechanicalSupportInertanceProfileV1({
    profileId: `external-AF-wrapper-test-${suffix}`,
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
    circuitProfileId: `external-AF-${deviceId}-${suffix}`,
    circuitProfileBindingSha256: hex.repeat(64),
  });
}

function inertance(): DynamicRotaryPumpCircuitInertanceV1 {
  return Object.freeze({
    unitSystemId: DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
    pumpInternalMmHgSec2PerMl: 0,
    drainageMmHgSec2PerMl: 0,
    oxygenatorMmHgSec2PerMl: 0,
    returnPathMmHgSec2PerMl: 0,
  });
}

function testProvider(): TestProvider {
  const evaluate = (
    timeSec: number,
    volumes: Readonly<{ LA: number; LV: number; RA: number; RV: number }>,
    drive: MainWireFiveWallFreeCalciumDriveV1,
  ) => {
    const wall = (landActiveKirchhoffStressPa: number) =>
      Object.freeze({
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
        LA: 10 + 0.2 * (volumes.LA - 45),
        LV: 105 + 0.8 * (volumes.LV - 130),
        RA: 5 + 0.08 * (volumes.RA - 55),
        RV: 25 + 0.17 * (volumes.RV - 140),
      }),
      transmuralPressureVolumeTangentMmHgPerMl: Object.freeze({
        LA: Object.freeze({ LA: 0.2, LV: 0, RA: 0, RV: 0 }),
        LV: Object.freeze({ LA: 0, LV: 0.8, RA: 0, RV: 0 }),
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
    providerId: "external-AF-wrapper-test-provider",
    parameterSetId: "external-AF-wrapper-test-prior",
    parameterIdentityHash: "external-AF-wrapper-test-hash",
    stateSchemaVersion: 1,
    stateCodec: Object.freeze({
      clone: (state: TestState) => Object.freeze({ ...state }),
      encode: (state: TestState) => Object.freeze({ ...state }),
      decode: (encoded: unknown) =>
        Object.freeze({ ...(encoded as TestState) }),
    }),
    initializeCold: (input) =>
      evaluate(input.timeSec, input.volumesMl, input.drivingInputs),
    evaluateTrial: (input) =>
      evaluate(
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
  return Object.values(drive.freeCalciumUMByWall).reduce(
    (sum, value) => sum + value,
    0,
  );
}

function allNestedCommitFlagsFalse(value: unknown): boolean {
  if (value === null || typeof value !== "object") return false;
  const record = value as Readonly<Record<string, unknown>>;
  return [
    "mechanicsCommitted",
    "circulationCommitted",
    "coronaryCommitted",
    "mvcReferenceCommitted",
    "autoregulationCommitted",
    "composedRhythmCommitted",
    "dynamicMechanicalSupportCommitted",
  ].every((key) => record[key] === false);
}

function jsonClone(
  checkpoint: MainWireIntegratedModelExternalAfCheckpointV1,
): any {
  return JSON.parse(JSON.stringify(checkpoint));
}

async function rehashOuter(checkpoint: any): Promise<void> {
  const { checkpointSha256: _old, ...payload } = checkpoint;
  checkpoint.checkpointSha256 = await sha256CanonicalJsonHex(payload);
}
