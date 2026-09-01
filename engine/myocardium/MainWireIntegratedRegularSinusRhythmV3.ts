import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  type FiveWallNormalCalciumDriveParamsV1,
} from
  "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  convertPeriodicBiexponentialToExactEventCalciumV1,
  propagateExactEventCalciumV1,
  zeroExactEventCalciumStateV1,
} from "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_EXACT_PERSISTENCE_V1_ID,
  resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaExactPersistenceV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_V1_ID,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1";
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
  createHistoricalCapturedElectricalActivationV2,
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
  cycleLengthSec: number;
}>;

export type MainWireIntegratedRegularSinusRhythmV3 = Readonly<{
  configuration: AcceptedComposedRhythmTransactionConfigurationV2;
  state: AcceptedComposedRhythmTransactionStateV2;
}>;

export const MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID =
  "main-wire-integrated-matched-alpha-fixed-regular-sinus-profile-v1" as const;

export type MainWireIntegratedMatchedAlphaFixedRegularSinusProfileV1 =
  Readonly<{
    profileId:
      typeof MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID;
    heartRateBpm: number;
  }>;

export const MAIN_WIRE_INTEGRATED_STANDARD65_TO_66_FACTORIZED_REGULAR_SINUS_RESEARCH_PROFILE_V1_ID =
  "main-wire-integrated-standard65-to-66-factorized-regular-sinus-research-profile-v1" as const;

/**
 * Research-only decomposition of the two rhythm changes promoted together in
 * Standard66. It is deliberately absent from model identity, checkpoint, and
 * Model Surface contracts; its only purpose is causal ablation.
 */
export type MainWireIntegratedStandard65To66FactorizedRegularSinusResearchProfileV1 =
  Readonly<{
    profileId:
      typeof MAIN_WIRE_INTEGRATED_STANDARD65_TO_66_FACTORIZED_REGULAR_SINUS_RESEARCH_PROFILE_V1_ID;
    heartRateBpm: number;
    calciumProfile: "standard65" | "standard66";
    timingAndPeriodicSeedProfile: "standard65" | "standard66";
  }>;

export const MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_CLAIM =
  Object.freeze({
    calciumLawId:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_V1_ID,
    calciumExactPersistenceId:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_EXACT_PERSISTENCE_V1_ID,
    proximalAvDelaySec: 0.08 as const,
    distalHvDelaySec: 0.04 as const,
    aggregateAtrialToVentricularElectricalDelaySec: 0.12 as const,
    atrialElectricalToCalciumDelaySec: 0.012 as const,
    ventricularElectricalToCalciumDelaySec: 0.012 as const,
    ventricularDepositPolicy:
      "existing-interval-strength-reference-fixed-point" as const,
    intervalStrengthStateAndLineageRetained: true as const,
    nonReferenceIntervalsRetainIntervalStrengthModulation: true as const,
    accumulatedAbsoluteTimeMayRoundIntervalsByUlps: true as const,
    perpetualBitExactUnitDepositClaimed: false as const,
    initialCalciumState: "analytic-periodic" as const,
    ventricularCalciumEventsAtCycleBoundaries: true as const,
    newContinuousStateAdded: false as const,
    defaultProfileChanged: false as const,
    clinicalValidationClaimed: false as const,
  });

type ResolvedRegularSinusFixedProfileV1 = Readonly<{
  calcium: FiveWallNormalCalciumDriveParamsV1;
  proximalAvDelaySec: number;
  distalHvDelaySec: number;
  aggregateAvDelaySec: number;
  atrialElectricalToCalciumDelaySec: number;
  ventricularElectricalToCalciumDelaySec: number;
  intervalReferenceCycleLengthSec: number;
  analyticPeriodicInitialization: boolean;
}>;

/**
 * Shared regular-sinus numbers for the periodic experiment and browser lane.
 * Each caller supplies its own identity prefix and parameter provenance.
 */
export function createMainWireIntegratedRegularSinusRhythmV3(
  identity: MainWireIntegratedRegularSinusRhythmIdentityV3,
  fixedProfile?:
    | MainWireIntegratedMatchedAlphaFixedRegularSinusProfileV1
    | MainWireIntegratedStandard65To66FactorizedRegularSinusResearchProfileV1,
): MainWireIntegratedRegularSinusRhythmV3 {
  const idPrefix = requireIdentityString(identity.idPrefix, "idPrefix");
  const parameterProvenanceSourceId = requireIdentityString(
    identity.parameterProvenanceSourceId,
    "parameterProvenanceSourceId",
  );
  const cycleLengthSec = requireCycleLengthSec(identity.cycleLengthSec);
  const selected = fixedProfile === undefined
    ? null
    : resolveRegularSinusFixedProfile(fixedProfile, cycleLengthSec);
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
    referenceCycleLengthSec:
      selected?.intervalReferenceCycleLengthSec ?? 1,
  });
  const regular = createRegularAtrialSourceConfigurationV1({
    configurationId: `${idPrefix}-regular-sinus-configuration`,
    ownerInstanceId: `${idPrefix}-regular-sinus-owner`,
    sourceId: `${idPrefix}-sinus-source`,
    rhythmClass: "sinus",
    cycleLengthSec,
  });
  const calcium = selected?.calcium
    ?? FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
  const atrialCalcium = convertPeriodicBiexponentialToExactEventCalciumV1(
    {
      diastolicCalciumUM: calcium.atrial.diastolicCalciumUM,
      peakAmplitudeUM: calcium.atrial.peakAmplitudeUM,
      riseTimeConstantSec: calcium.atrial.riseTimeConstantSec,
      decayTimeConstantSec: calcium.atrial.decayTimeConstantSec,
    },
    cycleLengthSec,
  );
  const ventricularCalcium = convertPeriodicBiexponentialToExactEventCalciumV1(
    {
      diastolicCalciumUM: calcium.ventricular.diastolicCalciumUM,
      peakAmplitudeUM: calcium.ventricular.peakAmplitudeUM,
      riseTimeConstantSec: calcium.ventricular.riseTimeConstantSec,
      decayTimeConstantSec: calcium.ventricular.decayTimeConstantSec,
    },
    cycleLengthSec,
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
      minimumConductionDelaySec:
        selected?.proximalAvDelaySec ?? 0.125,
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
      hvConductionDelaySec: selected?.distalHvDelaySec ?? 0.0625,
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
      electricalToCalciumDelaySec:
        selected?.atrialElectricalToCalciumDelaySec ?? 0.0625,
      leftAtrialStrength: 1,
      rightAtrialStrength: 1,
    },
    pacAtrialCalciumDeposit: null,
    ventricularCalciumDeposit: {
      electricalToCalciumDelaySec:
        selected?.ventricularElectricalToCalciumDelaySec ?? 0.0625,
      lvFreeWallBaseStrength: 1,
      septalBaseStrength: 1,
      rvFreeWallBaseStrength: 1,
    },
  });
  const zero = zeroExactEventCalciumStateV1();
  const calciumStateByWall = selected?.analyticPeriodicInitialization !== true
    ? Object.freeze({
        LA: zero,
        LVFW: zero,
        SEP: zero,
        RVFW: zero,
        RA: zero,
      })
    : Object.freeze({
        LA: propagateExactEventCalciumV1(
          atrialCalcium.periodicStateImmediatelyAfterEvent,
          selected.aggregateAvDelaySec,
          atrialCalcium.parameters,
        ),
        LVFW: ventricularCalcium.periodicStateImmediatelyAfterEvent,
        SEP: ventricularCalcium.periodicStateImmediatelyAfterEvent,
        RVFW: ventricularCalcium.periodicStateImmediatelyAfterEvent,
        RA: propagateExactEventCalciumV1(
          atrialCalcium.periodicStateImmediatelyAfterEvent,
          selected.aggregateAvDelaySec,
          atrialCalcium.parameters,
        ),
      });
  const selectedHistory = selected?.analyticPeriodicInitialization !== true
    ? null
    : selectedPeriodicCaptureHistory(capture, idPrefix, selected);
  const state = initializeAcceptedComposedRhythmTransactionStateV2(
    configuration,
    {
      acceptedTimeSec: 0,
      regularFirstFutureActivationTimeSec:
        selected?.analyticPeriodicInitialization !== true
        ? 0.625 * cycleLengthSec
        : cycleLengthSec - 0.132,
      regularFirstSourceSequence: 0,
      priorAcceptedAtrialCapture: selectedHistory === null
        ? null
        : Object.freeze({
            capturedActivationId:
              selectedHistory.atrial.capturedActivationId,
            activationTimeSec: selectedHistory.atrial.activationTimeSec,
          }),
      priorAcceptedVentricularActivation: selectedHistory?.ventricular
        ?? legacyPriorVentricularCaptureAtZero(capture, idPrefix),
      initialNormalizedSrLoadState: interval.referenceNormalizedSrLoadState,
      calciumStateByWall,
    },
  );
  return Object.freeze({ configuration, state });
}

function legacyPriorVentricularCaptureAtZero(
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
  const captured = evaluateAcceptedElectricalCaptureBatchCandidateV2(state, {
    candidateTimeSec: 0,
    sourceImpulses: [source],
  }).capturedActivations[0]!;
  return captured;
}

function selectedPeriodicCaptureHistory(
  configuration: ReturnType<
    typeof createAcceptedElectricalCaptureOwnerConfigurationV2
  >,
  idPrefix: string,
  profile: ResolvedRegularSinusFixedProfileV1,
): Readonly<{
  atrial: CapturedElectricalActivationV2;
  ventricular: CapturedElectricalActivationV2;
}> {
  const ventricularActivationTimeSec =
    -profile.ventricularElectricalToCalciumDelaySec;
  const atrialActivationTimeSec =
    ventricularActivationTimeSec - profile.aggregateAvDelaySec;
  const atrial = createHistoricalCapturedElectricalActivationV2(
    configuration,
    {
      sourceImpulse: createSourceImpulseV2({
        sourceImpulseId: `${idPrefix}-periodic-history-atrial-source-0`,
        parentCapturedActivationId: null,
        chamber: "atrial",
        sourceKind: "primary-intrinsic",
        sourceId: `${idPrefix}-periodic-history-atrial-source`,
        sourceSequence: 0,
        activationTimeSec: atrialActivationTimeSec,
      }),
      captureOrdinal: 1,
      ownerRevision: 1,
    },
  );
  const ventricular = createHistoricalCapturedElectricalActivationV2(
    configuration,
    {
      sourceImpulse: createSourceImpulseV2({
        sourceImpulseId: `${idPrefix}-periodic-history-ventricular-source-0`,
        parentCapturedActivationId: atrial.capturedActivationId,
        chamber: "ventricular",
        sourceKind: "av-output",
        sourceId: `${idPrefix}-periodic-history-ventricular-source`,
        sourceSequence: 0,
        activationTimeSec: ventricularActivationTimeSec,
      }),
      captureOrdinal: 1,
      ownerRevision: 2,
    },
  );
  return Object.freeze({ atrial, ventricular });
}

function resolveRegularSinusFixedProfile(
  input:
    | MainWireIntegratedMatchedAlphaFixedRegularSinusProfileV1
    | MainWireIntegratedStandard65To66FactorizedRegularSinusResearchProfileV1,
  cycleLengthSec: number,
): ResolvedRegularSinusFixedProfileV1 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("integrated regular-sinus fixed profile must be an object");
  }
  if (
    input.profileId
      === MAIN_WIRE_INTEGRATED_STANDARD65_TO_66_FACTORIZED_REGULAR_SINUS_RESEARCH_PROFILE_V1_ID
  ) {
    return resolveStandard65To66FactorizedResearchProfile(
      input,
      cycleLengthSec,
    );
  }
  const keys = Object.keys(input).sort();
  if (keys.length !== 2 || keys[0] !== "heartRateBpm" || keys[1] !== "profileId") {
    throw new Error("integrated regular-sinus fixed profile keys are invalid");
  }
  if (
    input.profileId
      !== MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID
  ) {
    throw new Error("integrated regular-sinus fixed profile id is invalid");
  }
  const calcium =
    resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1(
      input.heartRateBpm,
    );
  if (calcium.cycleLengthSec !== cycleLengthSec) {
    throw new Error(
      "integrated regular-sinus fixed profile heart rate and cycle split",
    );
  }
  return Object.freeze({
    calcium,
    proximalAvDelaySec: 0.08 as const,
    distalHvDelaySec: 0.04 as const,
    aggregateAvDelaySec: 0.12 as const,
    atrialElectricalToCalciumDelaySec: 0.012 as const,
    ventricularElectricalToCalciumDelaySec: 0.012 as const,
    intervalReferenceCycleLengthSec: cycleLengthSec,
    analyticPeriodicInitialization: true,
  });
}

function resolveStandard65To66FactorizedResearchProfile(
  input: MainWireIntegratedStandard65To66FactorizedRegularSinusResearchProfileV1,
  cycleLengthSec: number,
): ResolvedRegularSinusFixedProfileV1 {
  const keys = Object.keys(input).sort();
  if (
    keys.length !== 4
    || keys[0] !== "calciumProfile"
    || keys[1] !== "heartRateBpm"
    || keys[2] !== "profileId"
    || keys[3] !== "timingAndPeriodicSeedProfile"
  ) {
    throw new Error(
      "factorized integrated regular-sinus research profile keys are invalid",
    );
  }
  if (
    input.calciumProfile !== "standard65"
    && input.calciumProfile !== "standard66"
  ) {
    throw new Error("factorized calcium profile is invalid");
  }
  if (
    input.timingAndPeriodicSeedProfile !== "standard65"
    && input.timingAndPeriodicSeedProfile !== "standard66"
  ) {
    throw new Error("factorized timing and periodic-seed profile is invalid");
  }
  const calcium = input.calciumProfile === "standard66"
    ? resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1(
        input.heartRateBpm,
      )
    : FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
  if (
    input.calciumProfile === "standard66"
    && calcium.cycleLengthSec !== cycleLengthSec
  ) {
    throw new Error(
      "factorized integrated regular-sinus heart rate and cycle split",
    );
  }
  const selectedTiming = input.timingAndPeriodicSeedProfile === "standard66";
  return Object.freeze({
    calcium,
    proximalAvDelaySec: selectedTiming ? 0.08 : 0.125,
    distalHvDelaySec: selectedTiming ? 0.04 : 0.0625,
    aggregateAvDelaySec: selectedTiming ? 0.12 : 0.1875,
    atrialElectricalToCalciumDelaySec: selectedTiming ? 0.012 : 0.0625,
    ventricularElectricalToCalciumDelaySec: selectedTiming ? 0.012 : 0.0625,
    intervalReferenceCycleLengthSec: selectedTiming ? cycleLengthSec : 1,
    analyticPeriodicInitialization: selectedTiming,
  });
}

function requireIdentityString(value: string, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value) {
    throw new Error(`integrated regular-sinus ${label} is invalid`);
  }
  return value;
}

function requireCycleLengthSec(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("integrated regular-sinus cycleLengthSec is invalid");
  }
  return value;
}
