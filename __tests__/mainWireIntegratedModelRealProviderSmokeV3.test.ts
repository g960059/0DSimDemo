import { describe, expect, it } from "vitest";

import {
  NORMAL_CORONARY_DISEASE_INPUT_V2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
} from "@/engine/coronary/mainWireCoronaryBoundaryV2";
import {
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
} from "@/engine/coronary/mainWireNormalAdultCoronaryV2";
import {
  HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
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
import { mechanicalSupportPresetV1 } from "@/engine/devices/presetsV1";
import type {
  MechanicalSupportConfigV1,
  RotarySupportDeviceIdV1,
} from "@/engine/devices/typesV1";
import {
  checkpointMainWireIntegratedModelV3,
  restoreMainWireIntegratedModelV3,
  type MainWireIntegratedModelCheckpointContextV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
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
import {
  convertPeriodicBiexponentialToExactEventCalciumV1,
  zeroExactEventCalciumStateV1,
} from "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_CIRCULATION_NEWTON_POLICY_V2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2";
import {
  normalAdultMainWireRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
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
import { canonicalJsonStringify } from "@/engine/integrity";

type Provider = ReturnType<
  typeof createCanonicalMainWireNormalAdultFiveWallProviderV1
>;
type WallState = ReturnType<Provider["initializeCold"]>["materialState"];

const BASE_DT_SEC = 0.002;
const CYCLE_SEC = 1;
const MID_CHECKPOINT_SEC = 0.8;

describe("integrated model V3 canonical-provider composed-rhythm smoke", () => {
  it("advances one bounded sinus/HMII cycle with one Ca owner and exact mid-cycle resume", async () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const runtime = normalAdultMainWireRuntimeV1();
    const pericardium = createMainWireNormalAdultCommonPericardiumV1();
    const rhythm = composedSinusRhythm();
    const profile = heartMateIiOnlyTestProfile();
    const config = mechanicalSupportPresetV1("lvad-hmii-9000");
    const coronaryStep = Object.freeze({
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
      coronaryPrior: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
      coronaryDisease: NORMAL_CORONARY_DISEASE_INPUT_V2,
      collapseHydraulics:
        MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
      impMechanism: "cep-shortening-induced" as const,
      shorteningImpPrior:
        NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
      circulationNewtonOptions:
        MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_CIRCULATION_NEWTON_POLICY_V2,
    });
    const cold = initializeMainWireIntegratedModelV3({
      coronary: {
        provider,
        runtime,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium,
        coronaryPrior: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
        coronaryDisease: NORMAL_CORONARY_DISEASE_INPUT_V2,
        collapseHydraulics:
          MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
        impMechanism: "cep-shortening-induced" as const,
        shorteningImpPrior:
          NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
        fixedGlobalTotalBloodVolumeMl:
          MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1
            .fullGraphReferenceTotalBloodVolumeMl,
        autoregulationWindow: Object.freeze({
          durationSec: CYCLE_SEC,
          interpretation: "periodic-sinus-cycle-aligned" as const,
        }),
      },
      rhythm: {
        configuration: rhythm.configuration,
        acceptedState: rhythm.state,
      },
      dynamicMechanicalSupport: {
        config,
        profile,
      },
    });
    const stepInput = (
      candidateTimeSec: number,
    ): MainWireIntegratedModelStepInputV3 =>
      Object.freeze({
        candidateTimeSec,
        coronary: coronaryStep,
        rhythm: Object.freeze({
          configuration: rhythm.configuration,
          externalAfNextBoundaryTimeSec: null,
          externalAtrialSourceBatch: null,
        }),
        dynamicMechanicalSupport: Object.freeze({
          config,
          profile,
        }),
      });

    expect(cold.acceptedState).toHaveProperty("composedRhythm");
    expect(cold.acceptedState).not.toHaveProperty("rhythmCalcium");
    expect(cold.acceptedState).not.toHaveProperty("generatedRhythmCalcium");
    expect(cold.coronaryCold.calciumDrive).toEqual(cold.calciumDrive);
    expect(cold.calciumDrive).toEqual(
      evaluateMainWireIntegratedModelCalciumDriveV3(
        cold.acceptedState.composedRhythm,
      ),
    );
    expect(cold.calciumDrive.freeCalciumUMByWall).not.toEqual(
      evaluateFiveWallNormalCalciumDriveV1(0).freeCalciumUMByWall,
    );
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3
      .calciumOwnership.soleAcceptedOwner)
      .toBe("AcceptedComposedRhythmTransactionV2");
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3
      .calciumOwnership.legacyFixedPeriodicOwnerActive).toBe(false);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3
      .calciumOwnership.generatedPeriodicOwnerActive).toBe(false);

    expectRejectedDuplicateOwner(
      provider,
      cold.acceptedState,
      {
        ...stepInput(BASE_DT_SEC),
        coronary: {
          ...coronaryStep,
          calciumDriveOverride: cold.calciumDrive,
        },
      } as never,
      /second calciumDriveOverride/,
    );
    expectRejectedDuplicateOwner(
      provider,
      cold.acceptedState,
      {
        ...stepInput(BASE_DT_SEC),
        rhythmCalcium: {},
      } as never,
      /step input keys are invalid/,
    );
    expectRejectedDuplicateOwner(
      provider,
      cold.acceptedState,
      {
        ...stepInput(BASE_DT_SEC),
        generatedRhythmCalcium: {},
      } as never,
      /step input keys are invalid/,
    );

    let uninterrupted = cold.acceptedState;
    let mid: typeof uninterrupted | null = null;
    let maximumBloodVolumeErrorMl = 0;
    let maximumCoronaryLedgerResidualMl = 0;
    let maximumMcsConservationResidualMlPerSec = 0;
    let calciumDivergedFromLegacyPeriodic = false;
    let retried = false;
    let stepCount = 0;
    while (uninterrupted.acceptedTimeSec < CYCLE_SEC) {
      if (stepCount > 1_000) throw new Error("bounded V3 smoke exceeded step cap");
      const milestone = uninterrupted.acceptedTimeSec < MID_CHECKPOINT_SEC
        ? MID_CHECKPOINT_SEC
        : CYCLE_SEC;
      const requestedStepSec = Math.min(
        BASE_DT_SEC,
        milestone - uninterrupted.acceptedTimeSec,
      );
      const maximum = limitMainWireIntegratedModelCandidateTimeV3(
        uninterrupted,
        uninterrupted.acceptedTimeSec + requestedStepSec,
        {
          configuration: rhythm.configuration,
          externalAfNextBoundaryTimeSec: null,
        },
        profile,
        config,
      );
      expect(maximum.candidateTimeSec).toBeGreaterThan(
        uninterrupted.acceptedTimeSec,
      );
      const previous = uninterrupted;
      const input = stepInput(maximum.candidateTimeSec);
      const stepped = stepMainWireIntegratedModelV3(
        provider,
        previous,
        input,
      );
      expect(stepped.converged).toBe(true);
      if (stepped.converged === false) throw new Error(stepped.message);
      if (!retried) {
        const beforeMaterial = provider.stateCodec.encode(
          previous.coronary.mechanics.materialState,
        );
        const beforeRevision = previous.revision;
        const beforeTimeSec = previous.acceptedTimeSec;
        const retry = stepMainWireIntegratedModelV3(
          provider,
          previous,
          input,
        );
        expect(retry).toEqual(stepped);
        expect(provider.stateCodec.encode(
          previous.coronary.mechanics.materialState,
        )).toEqual(beforeMaterial);
        expect(previous.revision).toBe(beforeRevision);
        expect(previous.acceptedTimeSec).toBe(beforeTimeSec);
        retried = true;
      }
      uninterrupted = stepped.acceptedState;
      stepCount += 1;

      expect(uninterrupted.revision).toBe(previous.revision + 1);
      expect(uninterrupted.coronary.revision).toBe(uninterrupted.revision);
      expect(uninterrupted.composedRhythm.revision)
        .toBe(uninterrupted.revision);
      expect(uninterrupted.coronary.acceptedTimeSec)
        .toBe(uninterrupted.acceptedTimeSec);
      expect(uninterrupted.composedRhythm.acceptedTimeSec)
        .toBe(uninterrupted.acceptedTimeSec);
      expect(stepped.coronaryStep.baseStep.calciumDrive)
        .toEqual(stepped.calciumDrive);
      expect(stepped.calciumDrive).toEqual(
        evaluateMainWireIntegratedModelCalciumDriveV3(
          uninterrupted.composedRhythm,
        ),
      );
      expect(Object.values(stepped.calciumDrive.freeCalciumUMByWall)
        .every((value) => Number.isFinite(value) && value >= 0)).toBe(true);
      if (canonicalJsonStringify(stepped.calciumDrive)
        !== canonicalJsonStringify({
          freeCalciumUMByWall:
            evaluateFiveWallNormalCalciumDriveV1(
              uninterrupted.acceptedTimeSec,
            ).freeCalciumUMByWall,
        })) {
        calciumDivergedFromLegacyPeriodic = true;
      }
      maximumBloodVolumeErrorMl = Math.max(
        maximumBloodVolumeErrorMl,
        Math.abs(
          stepped.coronaryStep.baseStep.circulationTrial.diagnostics
            .totalBloodVolumeErrorMl,
        ),
      );
      maximumCoronaryLedgerResidualMl = Math.max(
        maximumCoronaryLedgerResidualMl,
        Math.abs(
          stepped.coronaryStep.baseStep.coronaryTrial.diagnostics
            .exactBloodVolumeLedgerResidualMl,
        ),
      );
      maximumMcsConservationResidualMlPerSec = Math.max(
        maximumMcsConservationResidualMlPerSec,
        Math.abs(
          stepped.dynamicMechanicalSupportTrial.conservationResidualMlPerSec,
        ),
      );
      expectGlobalBloodVolumeConserved(uninterrupted);
      if (uninterrupted.acceptedTimeSec === MID_CHECKPOINT_SEC) {
        mid = uninterrupted;
      }
    }

    expect(mid).not.toBeNull();
    if (mid === null) throw new Error("mid-cycle V3 state was not captured");
    expect(mid.composedRhythm.pendingDistalVentricularImpulses)
      .toHaveLength(1);
    expect(mid.composedRhythm.pendingDistalVentricularImpulses[0]
      ?.activationTimeSec).toBe(0.8125);
    const context = checkpointContext(
      provider,
      mid,
      rhythm.configuration,
      profile,
      config,
    );
    const checkpoint = await checkpointMainWireIntegratedModelV3(
      context,
      mid,
    );
    expect(checkpoint).not.toHaveProperty("exactResumeClaim");
    expect(checkpoint.composedRhythm.acceptedState)
      .not.toHaveProperty("rhythmCalcium");
    expect(canonicalJsonStringify(checkpoint))
      .not.toContain('"generatedRhythmCalcium"');
    const restored = await restoreMainWireIntegratedModelV3(
      context,
      JSON.parse(JSON.stringify(checkpoint)),
    );
    expect(restored).toEqual(mid);

    let resumed = restored;
    let resumeCount = 0;
    while (resumed.acceptedTimeSec < CYCLE_SEC) {
      if (resumeCount > 500) throw new Error("V3 resume exceeded step cap");
      const requestedStepSec = Math.min(
        BASE_DT_SEC,
        CYCLE_SEC - resumed.acceptedTimeSec,
      );
      const maximum = limitMainWireIntegratedModelCandidateTimeV3(
        resumed,
        resumed.acceptedTimeSec + requestedStepSec,
        {
          configuration: rhythm.configuration,
          externalAfNextBoundaryTimeSec: null,
        },
        profile,
        config,
      );
      const stepped = stepMainWireIntegratedModelV3(
        provider,
        resumed,
        stepInput(maximum.candidateTimeSec),
      );
      if (stepped.converged === false) throw new Error(stepped.message);
      resumed = stepped.acceptedState;
      resumeCount += 1;
    }

    expect(resumed).toEqual(uninterrupted);
    expect(uninterrupted.acceptedTimeSec).toBe(CYCLE_SEC);
    expect(uninterrupted.coronary.coronaryAutoregulation).toMatchObject({
      windowIndex: 1,
      acceptedDurationSec: 0,
      acceptedStepCount: 0,
      windowControl: null,
    });
    expect(uninterrupted.composedRhythm.acceptedAtrialCaptureCount).toBe(1);
    expect(uninterrupted.composedRhythm.acceptedVentricularCaptureCount)
      .toBe(1);
    expect(uninterrupted.composedRhythm.deliveredCalciumDepositCount).toBe(2);
    expect(uninterrupted.composedRhythm.pendingProximalAvOutputs).toEqual([]);
    expect(uninterrupted.composedRhythm.pendingDistalVentricularImpulses)
      .toEqual([]);
    expect(uninterrupted.composedRhythm.pendingCalciumDeposits).toEqual([]);
    expect(calciumDivergedFromLegacyPeriodic).toBe(true);
    const terminalLvadFlowMlPerSec = uninterrupted.dynamicMechanicalSupport
      .acceptedFlowMlPerSec.LVAD;
    expect(Number.isFinite(terminalLvadFlowMlPerSec)).toBe(true);
    expect(Math.abs(terminalLvadFlowMlPerSec)).toBeGreaterThan(1e-6);
    expect(config.lvad.maximumForwardFlowLMin).toBeNull();
    expect(config.lvad.forwardFlowEvidenceDomain).toEqual({
      publishedExperimentalTraversalUpperLMin: 9,
      advertisedCapacityLMin: 10,
    });
    expect(maximumBloodVolumeErrorMl).toBeLessThan(1e-8);
    expect(maximumCoronaryLedgerResidualMl).toBeLessThan(1e-8);
    expect(maximumMcsConservationResidualMlPerSec).toBeLessThan(1e-12);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3
      .longTermPhysiologicalValidationEstablished).toBe(false);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3.releaseReady)
      .toBe(false);
    expect(MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3
      .clinicalValidationClaimed).toBe(false);
  }, 60_000);
});

function composedSinusRhythm(): Readonly<{
  configuration: AcceptedComposedRhythmTransactionConfigurationV2;
  state: AcceptedComposedRhythmTransactionStateV2;
}> {
  const capture = createAcceptedElectricalCaptureOwnerConfigurationV2({
    configurationId: "real-provider-v3-capture-configuration",
    ownerInstanceId: "real-provider-v3-capture-owner",
    atrialGate: {
      gateInstanceId: "real-provider-v3-atrial-capture-gate",
      refractoryPeriodSec: 0.2,
    },
    ventricularGate: {
      gateInstanceId: "real-provider-v3-ventricular-capture-gate",
      refractoryPeriodSec: 0.25,
    },
  });
  const interval = createAcceptedVentricularIntervalStrengthConfigurationV1({
    configurationId: "real-provider-v3-interval-configuration",
    ownerInstanceId: "real-provider-v3-interval-owner",
    parameterProvenance: {
      kind: "explicit-research-parameters",
      sourceId: "bounded-real-provider-v3-smoke",
    },
    recoveryTimeConstantSec: 0.5,
    releaseFractionBeta: 0.8,
    releasedLoadReturnFractionR: 0.5,
    intervalInfluxInhibitionFractionH: 0.2,
    referenceCycleLengthSec: CYCLE_SEC,
  });
  const regular = createRegularAtrialSourceConfigurationV1({
    configurationId: "real-provider-v3-regular-sinus-configuration",
    ownerInstanceId: "real-provider-v3-regular-sinus-owner",
    sourceId: "real-provider-v3-sinus-source",
    rhythmClass: "sinus",
    cycleLengthSec: CYCLE_SEC,
  });
  const atrialCalcium = convertPeriodicBiexponentialToExactEventCalciumV1({
    diastolicCalciumUM:
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.atrial
        .diastolicCalciumUM,
    peakAmplitudeUM:
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.atrial
        .peakAmplitudeUM,
    riseTimeConstantSec:
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.atrial
        .riseTimeConstantSec,
    decayTimeConstantSec:
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.atrial
        .decayTimeConstantSec,
  }, CYCLE_SEC);
  const ventricularCalcium =
    convertPeriodicBiexponentialToExactEventCalciumV1({
      diastolicCalciumUM:
        FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.ventricular
          .diastolicCalciumUM,
      peakAmplitudeUM:
        FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.ventricular
          .peakAmplitudeUM,
      riseTimeConstantSec:
        FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.ventricular
          .riseTimeConstantSec,
      decayTimeConstantSec:
        FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.ventricular
          .decayTimeConstantSec,
    }, CYCLE_SEC);
  const configuration = createAcceptedComposedRhythmTransactionConfigurationV2({
    configurationId: "real-provider-v3-composed-sinus-configuration",
    ownerInstanceId: "real-provider-v3-composed-sinus-owner",
    atrialSource: {
      mode: "regular",
      regularSourceConfiguration: regular,
      externalAfOwnerInstanceId: null,
    },
    authoredEctopySchedule:
      createAcceptedAuthoredEctopyScheduleConfigurationV2({
        configurationId: "real-provider-v3-empty-ectopy-configuration",
        ownerInstanceId: "real-provider-v3-empty-ectopy-owner",
        scheduleId: "real-provider-v3-empty-ectopy-schedule",
        events: [],
      }),
    authoredVentricularPacingReplay: null,
    electricalCaptureOwner: capture,
    avGateParameters: createRecoveryConcealmentAvGateParametersV1({
      parameterSetId: "real-provider-v3-proximal-av-parameters",
      parameterProvenance: {
        kind: "explicit-research-parameters",
        sourceId: "bounded-real-provider-v3-smoke",
      },
      minimumConductionDelaySec: 0.125,
      recoveryDelayAmplitudeSec: 0,
      recoveryTimeConstantSec: CYCLE_SEC,
      postConductionRefractorySec: 0.25,
      concealedRefractoryExtensionSec: 0,
    }),
    avGateInstanceId: "real-provider-v3-proximal-av-owner",
    distalGate: createDistalConductionGateConfigurationV1({
      configurationId: "real-provider-v3-distal-configuration",
      gateInstanceId: "real-provider-v3-distal-owner",
      parameterProvenance: {
        kind: "explicit-research-parameters",
        sourceId: "bounded-real-provider-v3-smoke",
      },
      hvConductionDelaySec: 0.0625,
      distalEffectiveRefractoryPeriodSec: 0,
      modeConfiguration: { mode: "pass" },
    }),
    ventricularBackup:
      createAcceptedVentricularBackupSourceConfigurationV2({
        configurationId: "real-provider-v3-backup-configuration",
        ownerInstanceId: "real-provider-v3-backup-owner",
        parameterProvenance: {
          kind: "authored",
          sourceId: "bounded-real-provider-v3-smoke",
        },
        intrinsicEscapeSourceId: "real-provider-v3-escape-source",
        intrinsicEscapeCycleLengthSec: 2,
        vviPacingSourceId: "real-provider-v3-vvi-source",
        vviLowerRateLimitPerMin: 30,
      }),
    ventricularIntervalStrength: interval,
    calciumParametersByWall: Object.freeze({
      LA: atrialCalcium.parameters,
      LVFW: ventricularCalcium.parameters,
      SEP: ventricularCalcium.parameters,
      RVFW: ventricularCalcium.parameters,
      RA: atrialCalcium.parameters,
    }),
    sinusAtrialCalciumDeposit: {
      electricalToCalciumDelaySec: 0.0625,
      leftAtrialStrength: 1,
      rightAtrialStrength: 1,
    },
    pacAtrialCalciumDeposit: null,
    ventricularCalciumDeposit: {
      electricalToCalciumDelaySec: 0.0625,
      lvFreeWallBaseStrength: 1,
      septalBaseStrength: 1,
      rvFreeWallBaseStrength: 1,
    },
  });
  const zero = zeroExactEventCalciumStateV1();
  const state = initializeAcceptedComposedRhythmTransactionStateV2(
    configuration,
    {
      acceptedTimeSec: 0,
      regularFirstFutureActivationTimeSec: 0.625,
      regularFirstSourceSequence: 0,
      priorAcceptedAtrialCapture: null,
      priorAcceptedVentricularActivation: priorVentricularCapture(capture),
      initialNormalizedSrLoadState: interval.referenceNormalizedSrLoadState,
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
  const state = initializeAcceptedElectricalCaptureOwnerStateV2(
    configuration,
    {
      acceptedTimeSec: 0,
      atrialPriorCapture: null,
      ventricularPriorCapture: null,
    },
  );
  const source = createSourceImpulseV2({
    sourceImpulseId: "real-provider-v3-history-source-0",
    parentCapturedActivationId: null,
    chamber: "ventricular",
    sourceKind: "escape",
    sourceId: "real-provider-v3-history-source",
    sourceSequence: 0,
    activationTimeSec: 0,
  });
  return evaluateAcceptedElectricalCaptureBatchCandidateV2(state, {
    candidateTimeSec: 0,
    sourceImpulses: [source],
  }).capturedActivations[0]!;
}

function checkpointContext(
  provider: Provider,
  state: MainWireIntegratedModelAcceptedStateV3<WallState>,
  configuration: AcceptedComposedRhythmTransactionConfigurationV2,
  profile: DynamicMechanicalSupportInertanceProfileV1,
  config: MechanicalSupportConfigV1,
): MainWireIntegratedModelCheckpointContextV3<WallState> {
  return Object.freeze({
    provider,
    coronaryPrior: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
    collapseHydraulics:
      MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
    impMechanism: "cep-shortening-induced" as const,
    shorteningImpPrior:
      NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
    coronaryAutoregulationBinding:
      state.coronary.coronaryAutoregulationBinding,
    rhythm: Object.freeze({ configuration }),
    dynamicMechanicalSupportProfile: profile,
    dynamicMechanicalSupportConfig: config,
    hemodynamicResearchInputs:
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  });
}

function expectRejectedDuplicateOwner(
  provider: Provider,
  state: MainWireIntegratedModelAcceptedStateV3<WallState>,
  input: MainWireIntegratedModelStepInputV3,
  message: RegExp,
): void {
  const rejected = stepMainWireIntegratedModelV3(provider, state, input);
  expect(rejected.converged).toBe(false);
  if (rejected.converged === true) return;
  expect(rejected.rollbackState).toBe(state);
  expect(rejected.message).toMatch(message);
  expect([
    rejected.mechanicsCommitted,
    rejected.circulationCommitted,
    rejected.coronaryCommitted,
    rejected.mvcReferenceCommitted,
    rejected.autoregulationCommitted,
    rejected.composedRhythmCommitted,
    rejected.dynamicMechanicalSupportCommitted,
  ]).toEqual([false, false, false, false, false, false, false]);
}

function expectGlobalBloodVolumeConserved(
  state: MainWireIntegratedModelAcceptedStateV3<WallState>,
): void {
  const coronaryVolumeMl = Object.values(
    state.coronary.coronary.volumeMlByNode,
  ).reduce((sum, value) => sum + value, 0);
  expect(
    state.coronary.circulation.totalBloodVolumeMl + coronaryVolumeMl,
  ).toBeCloseTo(state.coronary.fixedGlobalTotalBloodVolumeMl, 10);
}

function heartMateIiOnlyTestProfile():
DynamicMechanicalSupportInertanceProfileV1 {
  const zero = Object.freeze({
    unitSystemId: DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
    pumpInternalMmHgSec2PerMl: 0,
    drainageMmHgSec2PerMl: 0,
    oxygenatorMmHgSec2PerMl: 0,
    returnPathMmHgSec2PerMl: 0,
  }) satisfies DynamicRotaryPumpCircuitInertanceV1;
  return createDynamicMechanicalSupportInertanceProfileV1({
    profileId:
      "heartmate-ii-literature-r-l-composed-v3-smoke-not-release-approved",
    profileBindingSha256: "a".repeat(64),
    deviceProfileBindingByDevice: Object.freeze({
      LVAD: binding("LVAD", "1"),
      IMPELLA: binding("IMPELLA", "2"),
      VA_ECMO: binding("VA_ECMO", "3"),
      VV_ECMO: binding("VV_ECMO", "4"),
    }),
    inertanceByDevice: Object.freeze({
      LVAD: HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
      IMPELLA: zero,
      VA_ECMO: zero,
      VV_ECMO: zero,
    }),
  });
}

function binding(deviceId: RotarySupportDeviceIdV1, digit: string) {
  return createDynamicMechanicalSupportDeviceProfileBindingV1({
    deviceId,
    circuitProfileId:
      `composed-v3-real-provider-${deviceId.toLowerCase()}-not-approved`,
    circuitProfileBindingSha256: digit.repeat(64),
  });
}
