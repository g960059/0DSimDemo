import { FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1 } from
  "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  convertPeriodicBiexponentialToExactEventCalciumV1,
  zeroExactEventCalciumStateV1,
} from "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import {
  createAcceptedAuthoredEctopyScheduleConfigurationV2,
} from "@/engine/myocardium/rhythm/acceptedAuthoredEctopyScheduleV2";
import {
  createAcceptedComposedRhythmTransactionConfigurationV2,
  initializeAcceptedComposedRhythmTransactionStateV2,
  type AcceptedComposedRhythmTransactionConfigurationV2,
  type AcceptedComposedRhythmTransactionStateV2,
} from "@/engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2";
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

export type MainWireIntegratedRegularSinusRhythmIdentityV3 = Readonly<{
  idPrefix: string;
  parameterProvenanceSourceId: string;
}>;

export type MainWireIntegratedRegularSinusRhythmV3 = Readonly<{
  configuration: AcceptedComposedRhythmTransactionConfigurationV2;
  state: AcceptedComposedRhythmTransactionStateV2;
}>;

/**
 * Shared regular-sinus numbers for the periodic experiment and browser lane.
 * Each caller supplies its own identity prefix and parameter provenance.
 */
export function createMainWireIntegratedRegularSinusRhythmV3(
  identity: MainWireIntegratedRegularSinusRhythmIdentityV3,
): MainWireIntegratedRegularSinusRhythmV3 {
  const idPrefix = requireIdentityString(identity.idPrefix, "idPrefix");
  const parameterProvenanceSourceId = requireIdentityString(
    identity.parameterProvenanceSourceId,
    "parameterProvenanceSourceId",
  );
  const capture = createAcceptedElectricalCaptureOwnerConfigurationV2({
    configurationId: `${idPrefix}-capture-configuration`,
    ownerInstanceId: `${idPrefix}-capture-owner`,
    atrialGate: {
      gateInstanceId: `${idPrefix}-atrial-capture-gate`,
      refractoryPeriodSec: 0.2,
    },
    ventricularGate: {
      gateInstanceId: `${idPrefix}-ventricular-capture-gate`,
      refractoryPeriodSec: 0.25,
    },
  });
  const interval = createAcceptedVentricularIntervalStrengthConfigurationV1({
    configurationId: `${idPrefix}-interval-configuration`,
    ownerInstanceId: `${idPrefix}-interval-owner`,
    parameterProvenance: {
      kind: "explicit-research-parameters",
      sourceId: parameterProvenanceSourceId,
    },
    recoveryTimeConstantSec: 0.5,
    releaseFractionBeta: 0.8,
    releasedLoadReturnFractionR: 0.5,
    intervalInfluxInhibitionFractionH: 0.2,
    referenceCycleLengthSec: 1,
  });
  const regular = createRegularAtrialSourceConfigurationV1({
    configurationId: `${idPrefix}-regular-sinus-configuration`,
    ownerInstanceId: `${idPrefix}-regular-sinus-owner`,
    sourceId: `${idPrefix}-sinus-source`,
    rhythmClass: "sinus",
    cycleLengthSec: 1,
  });
  const atrialCalcium = convertPeriodicBiexponentialToExactEventCalciumV1(
    {
      diastolicCalciumUM:
        FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.atrial.diastolicCalciumUM,
      peakAmplitudeUM:
        FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.atrial.peakAmplitudeUM,
      riseTimeConstantSec:
        FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.atrial
          .riseTimeConstantSec,
      decayTimeConstantSec:
        FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.atrial
          .decayTimeConstantSec,
    },
    1,
  );
  const ventricularCalcium = convertPeriodicBiexponentialToExactEventCalciumV1(
    {
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
    },
    1,
  );
  const configuration = createAcceptedComposedRhythmTransactionConfigurationV2({
    configurationId: `${idPrefix}-composed-sinus-configuration`,
    ownerInstanceId: `${idPrefix}-composed-sinus-owner`,
    atrialSource: {
      mode: "regular",
      regularSourceConfiguration: regular,
      externalAfOwnerInstanceId: null,
    },
    authoredEctopySchedule: createAcceptedAuthoredEctopyScheduleConfigurationV2(
      {
        configurationId: `${idPrefix}-empty-ectopy-configuration`,
        ownerInstanceId: `${idPrefix}-empty-ectopy-owner`,
        scheduleId: `${idPrefix}-empty-ectopy-schedule`,
        events: [],
      },
    ),
    authoredVentricularPacingReplay: null,
    electricalCaptureOwner: capture,
    avGateParameters: createRecoveryConcealmentAvGateParametersV1({
      parameterSetId: `${idPrefix}-proximal-av-parameters`,
      parameterProvenance: {
        kind: "explicit-research-parameters",
        sourceId: parameterProvenanceSourceId,
      },
      minimumConductionDelaySec: 0.125,
      recoveryDelayAmplitudeSec: 0,
      recoveryTimeConstantSec: 1,
      postConductionRefractorySec: 0.25,
      concealedRefractoryExtensionSec: 0,
    }),
    avGateInstanceId: `${idPrefix}-proximal-av-owner`,
    distalGate: createDistalConductionGateConfigurationV1({
      configurationId: `${idPrefix}-distal-configuration`,
      gateInstanceId: `${idPrefix}-distal-owner`,
      parameterProvenance: {
        kind: "explicit-research-parameters",
        sourceId: parameterProvenanceSourceId,
      },
      hvConductionDelaySec: 0.0625,
      distalEffectiveRefractoryPeriodSec: 0,
      modeConfiguration: { mode: "pass" },
    }),
    ventricularBackup: createAcceptedVentricularBackupSourceConfigurationV2({
      configurationId: `${idPrefix}-backup-configuration`,
      ownerInstanceId: `${idPrefix}-backup-owner`,
      parameterProvenance: {
        kind: "authored",
        sourceId: parameterProvenanceSourceId,
      },
      intrinsicEscapeSourceId: `${idPrefix}-escape-source`,
      intrinsicEscapeCycleLengthSec: 2,
      vviPacingSourceId: `${idPrefix}-vvi-source`,
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
      priorAcceptedVentricularActivation: priorVentricularCapture(
        capture,
        idPrefix,
      ),
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
  idPrefix: string,
): CapturedElectricalActivationV2 {
  const state = initializeAcceptedElectricalCaptureOwnerStateV2(configuration, {
    acceptedTimeSec: 0,
    atrialPriorCapture: null,
    ventricularPriorCapture: null,
  });
  const source = createSourceImpulseV2({
    sourceImpulseId: `${idPrefix}-history-source-0`,
    parentCapturedActivationId: null,
    chamber: "ventricular",
    sourceKind: "escape",
    sourceId: `${idPrefix}-history-source`,
    sourceSequence: 0,
    activationTimeSec: 0,
  });
  return evaluateAcceptedElectricalCaptureBatchCandidateV2(state, {
    candidateTimeSec: 0,
    sourceImpulses: [source],
  }).capturedActivations[0]!;
}

function requireIdentityString(value: string, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value) {
    throw new Error(`integrated regular-sinus ${label} is invalid`);
  }
  return value;
}
