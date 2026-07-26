import {
  NORMAL_CORONARY_DISEASE_INPUT_V2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import type {
  CoronaryAcceptedAutoregulationCompletionV3,
} from "@/engine/coronary/acceptedAutoregulationWindowV3";
import {
  NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2,
} from "@/engine/coronary/autoregulationV2";
import {
  NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
} from "@/engine/coronary/mainWireCoronaryBoundaryV2";
import {
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
} from "@/engine/coronary/mainWireNormalAdultCoronaryV2";
import {
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryLayerIdV2,
  type CoronaryTerritoryIdV2,
  type CoronaryTerritoryLayerRecordV2,
} from "@/engine/coronary/typesV2";
import {
  createDynamicMechanicalSupportDeviceProfileBindingV1,
  createDynamicMechanicalSupportInertanceProfileV1,
  type DynamicMechanicalSupportInertanceProfileV1,
} from "@/engine/devices/dynamicNetworkV1";
import {
  DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
  type DynamicRotaryPumpConstraintOwnerV1,
  type DynamicRotaryPumpCircuitInertanceV1,
} from "@/engine/devices/dynamicRotaryPumpV1";
import {
  HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
} from "@/engine/devices/defaultsV1";
import { mechanicalSupportPresetV1 } from "@/engine/devices/presetsV1";
import type {
  RotaryPumpForwardFlowEvidenceStatusV1,
  RotarySupportDeviceIdV1,
} from "@/engine/devices/typesV1";
import type {
  MainWireQuasiSteadyOrificeValveDirectionV2,
} from "@/engine/mechanics2/valve/MainWireQuasiSteadyOrificeValveV2";
import {
  initializeMainWireIntegratedModelV2,
  maximumMainWireIntegratedModelStepDurationV2,
  stepMainWireIntegratedModelV2,
  type MainWireIntegratedModelAcceptedStateV2,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV2";
import {
  checkpointMainWireIntegratedModelV2,
  restoreMainWireIntegratedModelV2,
  type MainWireIntegratedModelCheckpointV2,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV2";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_CIRCULATION_NEWTON_POLICY_V2,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V2,
  compareMainWireIntegratedModelAcceptedStatesV2,
  type MainWireIntegratedModelPeriodicClosureReportV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV2";
import {
  classifyMainWireIntegratedModelPeriodicityV2,
  type MainWireIntegratedModelPeriodicClassificationV2,
  type MainWireIntegratedModelPeriodicCycleObservationV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV2";
import {
  normalAdultMainWireRuntimeV1,
  type MainWireNormalAdultFiveWallMechanicsStateV1,
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
  createGeneratedPeriodicSinusFiveWallRhythmCalciumOwnerV1,
} from "@/engine/myocardium/rhythm/acceptedGeneratedFiveWallRhythmCalciumOwnerV1";
import { sha256CanonicalJsonHex } from "@/engine/scientific/release";

export const MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_V2_ID =
  "main-wire-integrated-generated-sinus-one-cycle-dt-halving-verification-v2" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_CLAIM_V2 =
  Object.freeze({
    scope:
      "canonical-whole-heart-provider-coronary-v3-fixed-prior-generated-sinus-and-active-heartmate-ii-dynamic-lvad-one-cycle" as const,
    evidenceRole: Object.freeze([
      "construction-verification",
      "literature-transcription-verification",
      "bounded-dt-halving-numerical-verification",
      "exploratory-non-shape-fit-waveform-description",
    ] as const),
    canonicalWholeHeartProviderExercised: true as const,
    coronaryV3Exercised: true as const,
    generatedRhythmOwnerExercised: true as const,
    dynamicMcsAcceptedQExercised: true as const,
    waveformOrParameterFittingApplied: false as const,
    periodicSteadyStateClaimed: false as const,
    convergenceOrderClaimed: false as const,
    physiologicalAcceptanceClaimed: false as const,
    independentValidationClaimed: false as const,
    clinicalValidationClaimed: false as const,
    releaseAcceptanceClaimed: false as const,
    releaseReadyClaimed: false as const,
    heartMateIiInertanceProfileReleaseApproved: false as const,
    heartMateIiProfileCopiedToOtherDeviceClasses: false as const,
    otherDeviceInertanceTransferClaimed: false as const,
    pumpPressureFlowLoopInterpretation:
      "cold-start-closed-polygon-area-is-exploratory-only-and-excluded-from-numerical-physiological-and-periodic-shape-gates" as const,
  });

const RHYTHM_DERIVED_CYCLE_LENGTH_SEC =
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.cycleLengthSec;

export const MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2 = Object.freeze({
  protocolId: MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_V2_ID,
  rhythmSourceParameterSetId:
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.parameterSetId,
  cycleLengthSec: RHYTHM_DERIVED_CYCLE_LENGTH_SEC,
  heartRateBpm: 60 / RHYTHM_DERIVED_CYCLE_LENGTH_SEC,
  coarseNominalDtSec: 0.002,
  fineNominalDtSec: 0.001,
  scheduler:
    "nominal-grid-target-with-coronary-window-first-then-effective-rhythm-event-cap" as const,
  maximumAcceptedStepCountPerRun: 1_100,
  invariantTolerance: Object.freeze({
    acceptedOwnerClockSkewSec: 1e-12,
    globalTotalBloodVolumeErrorMl: 1e-8,
    coronaryBloodVolumeLedgerResidualMl: 1e-8,
    dynamicMcsConservationResidualMlPerSec: 1e-12,
  }),
  comparisonMetric: Object.freeze({
    meanLvadFlowMlPerSec: metric(100, 0.05),
    terminalLvadFlowMlPerSec: metric(100, 0.05),
    meanLvadPressureRiseMmHg: metric(100, 0.05),
    terminalLvadPressureRiseMmHg: metric(100, 0.05),
    meanAorticPressureMmHg: metric(100, 0.05),
    terminalAorticPressureMmHg: metric(100, 0.05),
    meanLeftVentricularPressureMmHg: metric(100, 0.05),
    terminalLeftVentricularPressureMmHg: metric(100, 0.05),
    meanLeftVentricularVolumeMl: metric(100, 0.05),
    terminalLeftVentricularVolumeMl: metric(100, 0.05),
    meanTotalCoronaryInletFlowMlPerSec: metric(5, 0.05),
    terminalTotalCoronaryInletFlowMlPerSec: metric(5, 0.05),
    meanLadSubendocardialQmFlowMlPerSec: metric(5, 0.05),
    terminalLadSubendocardialQmFlowMlPerSec: metric(5, 0.05),
    maximumAbsoluteLvadFlowMlPerSec: metric(100, 0.05),
    lvadFlowRangeMlPerSec: metric(100, 0.05),
    lvadPressureRiseRangeMmHg: metric(100, 0.05),
    aorticPressureRangeMmHg: metric(100, 0.05),
    leftVentricularPressureRangeMmHg: metric(100, 0.05),
    leftVentricularVolumeRangeMl: metric(100, 0.05),
    totalCoronaryInletFlowRangeMlPerSec: metric(5, 0.05),
  }),
  excludedExploratoryDescriptorFromCrossDtGate: Object.freeze([
    "absoluteLvadPressureFlowClosedLoopAreaMmHgMlPerSec",
  ] as const),
  comparisonInterpretation:
    "eligible-metrics-use-absolute-coarse-minus-fine-difference-divided-by-predeclared-numerical-scale-not-a-physiological-range-or-release-gate" as const,
});

export const MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_LOCAL_DT_REFINEMENT_V1_ID =
  "main-wire-integrated-v2-checkpoint-local-one-cycle-dt-refinement-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_LOCAL_DT_REFINEMENT_CLAIM_V1 =
  Object.freeze({
    purpose:
      "matched-exact-checkpoint-local-one-cycle-dt-halving-characterization" as const,
    initialState:
      "same-exact-generated-rhythm-integrated-v2-checkpoint-for-both-grids" as const,
    coarseNominalDtSec:
      MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2.coarseNominalDtSec,
    fineNominalDtSec:
      MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2.fineNominalDtSec,
    acceptedEventIdentityAndAbsoluteTimingMustMatch: true as const,
    originalCheckpointMutated: false as const,
    coldStartRecomputed: false as const,
    checkpointUsedAsCanonicalInitialCondition: false as const,
    periodicOrbitEstablished: false as const,
    convergenceOrderClaimed: false as const,
    physiologyClaimed: false as const,
    independentValidationClaimed: false as const,
    releaseAcceptanceClaimed: false as const,
    evidenceRole: "checkpoint-started-local-numerical-characterization" as const,
    interpretation:
      "isolates-one-cycle-time-step-sensitivity-near-the-supplied-state-but-cannot-establish-cold-start-periodicity-or-physiology" as const,
  });

const SIGNAL_IDS_V2 = Object.freeze([
  "lvadFlowMlPerSec",
  "lvadPressureRiseMmHg",
  "aorticPressureMmHg",
  "leftVentricularPressureMmHg",
  "leftVentricularVolumeMl",
  "totalCoronaryInletFlowMlPerSec",
  "ladSubendocardialQmFlowMlPerSec",
] as const);

type SignalIdV2 = (typeof SIGNAL_IDS_V2)[number];
type ComparisonMetricIdV2 =
  keyof typeof MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2.comparisonMetric;

const DYNAMIC_ROTARY_CONSTRAINT_OWNERS_V2 = Object.freeze([
  "none",
  "disabled",
  "clamp",
  "pressure-collapse",
  "volume-collapse",
  "forward-cap",
  "reverse-cap",
] as const satisfies readonly DynamicRotaryPumpConstraintOwnerV1[]);

export type MainWireIntegratedModelCoronaryAutoregulationLayerDiagnosticV2 =
  Readonly<{
    territoryId: CoronaryTerritoryIdV2;
    layerId: CoronaryLayerIdV2;
    achievedMeanTissueFlowMlPerSec: number;
    demandTargetFlowMlPerSec: number;
    achievedToDemandTargetFlowRatio: number;
    previousToneResistanceScale: number;
    nextToneResistanceScale: number;
    deltaLogToneResistanceScale: number;
    controlSignalLogPerTimeConstant: number;
    boundedAt: "minimum" | "maximum" | "interior";
  }>;

export type MainWireIntegratedModelCoronaryAutoregulationWindowDiagnosticV2 =
  Readonly<{
    windowIndex: number;
    windowStartAcceptedTimeSec: number;
    windowEndAcceptedTimeSec: number;
    acceptedWindowDurationSec: number;
    acceptedStepCount: number;
    layerDiagnosticCount: 6;
    byTerritoryLayer: CoronaryTerritoryLayerRecordV2<
      MainWireIntegratedModelCoronaryAutoregulationLayerDiagnosticV2
    >;
  }>;

export type MainWireIntegratedModelVerificationSignalMetricsV2 = Readonly<{
  meanLvadFlowMlPerSec: number;
  terminalLvadFlowMlPerSec: number;
  meanLvadPressureRiseMmHg: number;
  terminalLvadPressureRiseMmHg: number;
  meanAorticPressureMmHg: number;
  terminalAorticPressureMmHg: number;
  meanLeftVentricularPressureMmHg: number;
  terminalLeftVentricularPressureMmHg: number;
  meanLeftVentricularVolumeMl: number;
  terminalLeftVentricularVolumeMl: number;
  meanTotalCoronaryInletFlowMlPerSec: number;
  terminalTotalCoronaryInletFlowMlPerSec: number;
  meanLadSubendocardialQmFlowMlPerSec: number;
  terminalLadSubendocardialQmFlowMlPerSec: number;
}>;

export type MainWireIntegratedModelWaveformExtremaV2 = Readonly<{
  minimum: number;
  maximum: number;
  range: number;
  maximumAbsoluteValue: number;
}>;

export type MainWireIntegratedModelNumericalRunV2 = Readonly<{
  nominalDtSec: number;
  completed: true;
  acceptedStepCount: number;
  acceptedClock: Readonly<{
    integratedTimeSec: number;
    coronaryTimeSec: number;
    circulationTimeSec: number;
    coronaryHydraulicTimeSec: number;
    mechanicsTimeSec: number;
    generatedRhythmCalciumTimeSec: number;
    generatedRhythmGeneratorTimeSec: number;
    integratedRevision: number;
    coronaryRevision: number;
    circulationRevision: number;
    coronaryHydraulicRevision: number;
    mechanicsRevision: number;
    generatedRhythmCalciumRevision: number;
    generatedRhythmGeneratorRevision: number;
    maximumOwnerClockSkewSec: number;
    allOwnerRevisionsMatch: boolean;
  }>;
  scheduler: Readonly<{
    effectiveEventBoundaryStepCount: number;
    rhythmClippedStepCount: number;
    coronaryWindowClippedStepCount: number;
    coronaryWindowCompletionCount: number;
    coronaryWindowAndEffectiveBatchTieCount: number;
  }>;
  coronaryAutoregulationWindow:
    MainWireIntegratedModelCoronaryAutoregulationWindowDiagnosticV2;
  rhythm: Readonly<{
    bindingId: string;
    generatorConfigId: string;
    generatorInstanceId: string;
    sourceMode: "regular-sinus";
    sourcePeriodSec: number;
    acceptedEventIds: readonly string[];
    acceptedActivationTimesSec: readonly number[];
    acceptedEventTargetIds: readonly (readonly string[])[];
    terminalNextSourceIndex: number;
    terminalNextSourceActivationTimeSec: number;
    terminalPendingEventCount: number;
  }>;
  invariant: Readonly<{
    maximumGlobalTotalBloodVolumeErrorMl: number;
    maximumCoronaryBloodVolumeLedgerResidualMl: number;
    maximumDynamicMcsConservationResidualMlPerSec: number;
    acceptedEndTimeMatchesRhythmDerivedCycle: boolean;
    coronaryAutoregulationWindowIndex: number;
    coronaryAutoregulationWindowIsEmptyAtCycleEnd: boolean;
    allWithinTolerance: boolean;
  }>;
  signal: MainWireIntegratedModelVerificationSignalMetricsV2;
  waveform: Readonly<{
    sampleCount: number;
    allSamplesFinite: boolean;
    extremaBySignal: Readonly<Record<
      SignalIdV2,
      MainWireIntegratedModelWaveformExtremaV2
    >>;
    lvadPressureFlow: Readonly<{
      nonzeroFlowSampleCount: number;
      maximumAbsoluteFlowMlPerSec: number;
      flowRangeMlPerSec: number;
      pressureRiseRangeMmHg: number;
      signedClosedLoopAreaMmHgMlPerSec: number;
      absoluteClosedLoopAreaMmHgMlPerSec: number;
      constraintOwnerSampleCount: Readonly<Record<
        DynamicRotaryPumpConstraintOwnerV1,
        number
      >>;
      limiterOwnedSampleCount: number;
      periodicEndpointClosureClaimed: false;
      eligibleForNumericalOrPhysiologicalShapeGate: false;
      interpretation:
        typeof MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_CLAIM_V2.pumpPressureFlowLoopInterpretation;
    }>;
  }>;
  comparisonValues: Readonly<Record<ComparisonMetricIdV2, number>>;
  terminalAcceptedState:
    MainWireIntegratedModelAcceptedStateV2<
      MainWireNormalAdultFiveWallMechanicsStateV1
    >;
}>;

export type MainWireIntegratedModelCrossDtComparisonV2 = Readonly<{
  metricId: ComparisonMetricIdV2;
  coarseValue: number;
  fineValue: number;
  absoluteDelta: number;
  normalizationScale: number;
  normalizedDelta: number;
  numericalToleranceNormalized: number;
  allValuesFinite: boolean;
  withinTolerance: boolean;
}>;

export type MainWireIntegratedModelNumericalVerificationResultV2 = Readonly<{
  experimentId: typeof MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_V2_ID;
  claim: typeof MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_CLAIM_V2;
  protocol: typeof MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2;
  heartMateIiLvadOnlyTranscription: Readonly<{
    profileId: string;
    profileReleaseApproved: false;
    lvadEnabled: true;
    lvadSpeedRpm: 9_000;
    pumpInternalInertanceMmHgSec2PerMl: number;
    drainageInertanceMmHgSec2PerMl: number;
    returnPathInertanceMmHgSec2PerMl: number;
    totalCircuitInertanceMmHgSec2PerMl: number;
    nonLvadDeviceInertancesAreZero: true;
    inertanceCopiedToOtherDeviceClasses: false;
  }>;
  coarse: MainWireIntegratedModelNumericalRunV2;
  fine: MainWireIntegratedModelNumericalRunV2;
  crossDt: readonly MainWireIntegratedModelCrossDtComparisonV2[];
  crossDtSummary: Readonly<{
    maximumAbsoluteDelta: number;
    maximumNormalizedDelta: number;
    allDifferencesFinite: boolean;
    allWithinPredeclaredNumericalTolerance: boolean;
  }>;
  exploratoryPressureFlowLoopComparison: Readonly<{
    coarseAbsoluteAreaMmHgMlPerSec: number;
    fineAbsoluteAreaMmHgMlPerSec: number;
    absoluteDeltaMmHgMlPerSec: number;
    symmetricRelativeDelta: number;
    allValuesFinite: boolean;
    eligibleForNumericalOrPhysiologicalShapeGate: false;
    assessment: "not-assessed-cold-start-nonperiodic-descriptor";
  }>;
  eventIdentityAndTimingMatchAcrossDt: boolean;
  allNumericalChecksPassed: boolean;
}>;

export type MainWireIntegratedModelCheckpointLocalDtRefinementInputV1 =
  Readonly<{
    checkpoint: MainWireIntegratedModelCheckpointV2;
  }>;

export type MainWireIntegratedModelCheckpointLocalDtRefinementResultV1 =
  Readonly<{
    experimentId:
      typeof MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_LOCAL_DT_REFINEMENT_V1_ID;
    claim:
      typeof MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_LOCAL_DT_REFINEMENT_CLAIM_V1;
    initialCheckpoint: Readonly<{
      checkpointId: MainWireIntegratedModelCheckpointV2["checkpointId"];
      schemaVersion: MainWireIntegratedModelCheckpointV2["schemaVersion"];
      checkpointSha256: string;
      acceptedTimeSec: number;
      revision: number;
      zeroBasedCycleIndex: number;
    }>;
    coarse: MainWireIntegratedModelNumericalRunV2;
    fine: MainWireIntegratedModelNumericalRunV2;
    crossDt: readonly MainWireIntegratedModelCrossDtComparisonV2[];
    crossDtSummary: Readonly<{
      maximumAbsoluteDelta: number;
      maximumNormalizedDelta: number;
      allDifferencesFinite: boolean;
      allWithinPredeclaredNumericalTolerance: boolean;
    }>;
    eventIdentityAndTimingMatchAcrossDt: boolean;
    bothRunsStartFromSameExactCheckpoint: true;
    allNumericalChecksPassed: boolean;
    periodicOrbitEstablished: false;
    physiologicalAcceptanceEstablished: false;
    releaseAcceptanceEstablished: false;
  }>;

export const MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_EXPLORATION_V2_ID =
  "main-wire-integrated-generated-sinus-terminal-cycle-exploration-v2" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_EXPLORATION_CLAIM_V2 =
  Object.freeze({
    evidenceRole:
      "bounded-initial-transient-versus-persistent-descriptor-exploration" as const,
    cycleClassification:
      "exploratory-terminal-cycle-not-an-accepted-periodic-or-physiological-cycle" as const,
    acceptedStatePreservedAcrossCycles: true as const,
    transactionLoopSharedWithOneCycleVerification: true as const,
    terminalCycleSampleTraceRetained: true as const,
    sampleTracePurpose:
      "graph-shape-inspection-and-future-preregistered-metric-development" as const,
    sampleTraceEstablishesShapeAcceptance: false as const,
    stabilizationToleranceDeclared: false as const,
    stabilizationPassFailAssessed: false as const,
    periodicSteadyStateClaimed: false as const,
    physiologicalAcceptanceClaimed: false as const,
    clinicalValidationClaimed: false as const,
    releaseAcceptanceClaimed: false as const,
    releaseReadyClaimed: false as const,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_EXPLORATION_BOUNDS_V2 =
  Object.freeze({
    minimumCycleCount: 1,
    maximumCycleCount: 5,
    minimumNominalDtSec: 0.001,
    maximumNominalDtSec: 0.01,
    maximumAcceptedStepCountPerCycle:
      MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2
        .maximumAcceptedStepCountPerRun,
  });

export type MainWireIntegratedModelTerminalCycleExplorationInputV2 = Readonly<{
  cycleCount: number;
  nominalDtSec: number;
}>;

export type MainWireIntegratedModelTerminalCycleClosureV2 = Readonly<{
  nonCoronaryNodeVolumeDeltaMlByNode: Readonly<Record<string, number>>;
  maximumAbsoluteNonCoronaryNodeVolumeDeltaMl: number;
  totalNonCoronaryNodeVolumeDeltaMl: number;
  coronaryNodeVolumeDeltaMlByNode: Readonly<Record<string, number>>;
  maximumAbsoluteCoronaryNodeVolumeDeltaMl: number;
  totalCoronaryNodeVolumeDeltaMl: number;
  dynamicQDeltaMlPerSecByDevice: Readonly<Record<
    RotarySupportDeviceIdV1,
    number
  >>;
  lvadQDeltaMlPerSec: number;
  maximumAbsoluteDynamicQDeltaMlPerSec: number;
  coronaryToneScaleDeltaByTerritoryLayer: Readonly<Record<
    string,
    Readonly<Record<string, number>>
  >>;
  maximumAbsoluteCoronaryToneScaleDelta: number;
  coronaryWindow: Readonly<{
    startWindowIndex: number;
    endWindowIndex: number;
    windowIndexDelta: number;
    startAcceptedDurationSec: number;
    endAcceptedDurationSec: number;
    acceptedDurationDeltaSec: number;
    startWindowControlPresent: boolean;
    endWindowControlPresent: boolean;
    endWindowIsEmpty: boolean;
  }>;
  rhythmPhase: Readonly<{
    sourceMode: "regular-sinus";
    phaseComparable: true;
    startSourcePhase01: number;
    endSourcePhase01: number;
    wrappedSourcePhaseDelta01: number;
    generatorSourceIndexDelta: number;
    pendingEventCountAtStart: number;
    pendingEventCountAtEnd: number;
    nextSourceActivationTimeDeltaSec: number;
  }>;
  allReportedDeltasFinite: boolean;
}>;

export type MainWireIntegratedModelTerminalCycleExplorationCycleV2 = Readonly<{
  cycleIndex: number;
  classification:
    typeof MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_EXPLORATION_CLAIM_V2.cycleClassification;
  startTimeSec: number;
  endTimeSec: number;
  acceptedStepCount: number;
  signal: MainWireIntegratedModelVerificationSignalMetricsV2;
  extremaBySignal: Readonly<Record<
    SignalIdV2,
    MainWireIntegratedModelWaveformExtremaV2
  >>;
  lvadConstraint: Readonly<{
    ownerSampleCount: Readonly<Record<
      DynamicRotaryPumpConstraintOwnerV1,
      number
    >>;
    ownerSampleFraction: Readonly<Record<
      DynamicRotaryPumpConstraintOwnerV1,
      number
    >>;
    limiterOwnedSampleCount: number;
    limiterOwnedSampleFraction: number;
  }>;
  lvadPressureFlow: Readonly<{
    signedClosedLoopAreaMmHgMlPerSec: number;
    absoluteClosedLoopAreaMmHgMlPerSec: number;
    flowRangeMlPerSec: number;
    pressureRiseRangeMmHg: number;
    periodicEndpointClosureClaimed: false;
  }>;
  closure: MainWireIntegratedModelTerminalCycleClosureV2;
  conservation: Readonly<{
    maximumGlobalTotalBloodVolumeErrorMl: number;
    maximumCoronaryBloodVolumeLedgerResidualMl: number;
    maximumDynamicMcsConservationResidualMlPerSec: number;
    allResidualsFinite: boolean;
    withinExistingConstructionTolerances: boolean;
  }>;
  boundedness: Readonly<{
    allSignalSamplesFinite: boolean;
    allSignalExtremaFinite: boolean;
    allClosureDeltasFinite: boolean;
    acceptedStepBoundRespected: boolean;
    finiteAndStepBounded: boolean;
    amplitudeAcceptanceAssessed: false;
  }>;
  scheduler: MainWireIntegratedModelNumericalRunV2["scheduler"];
  acceptedEventCount: number;
}>;

export type MainWireIntegratedModelTerminalCycleChangeV2 = Readonly<{
  fromCycleIndex: number;
  toCycleIndex: number;
  limiterOwnedSampleFractionDelta: number;
  limiterOwnedSampleFractionAbsoluteDelta: number;
  limiterFractionDirection: "increase" | "decrease" | "equal";
  signedLoopAreaDeltaMmHgMlPerSec: number;
  absoluteLoopAreaDeltaMmHgMlPerSec: number;
  absoluteLoopAreaSymmetricRelativeDelta: number;
  absoluteLoopAreaDirection: "increase" | "decrease" | "equal";
  allValuesFinite: boolean;
  assessment: "reported-without-stability-threshold";
}>;

export type MainWireIntegratedModelWaveformSampleSignalsV2 = Readonly<{
  lvadFlowMlPerSec: number;
  lvadPressureRiseMmHg: number;
  aorticPressureMmHg: number;
  leftVentricularPressureMmHg: number;
  leftVentricularVolumeMl: number;
  totalCoronaryInletFlowMlPerSec: number;
  ladSubendocardialQmFlowMlPerSec: number;
}>;

export type MainWireIntegratedModelTerminalValveEndpointV2 = Readonly<{
  /** Signed algebraic flow at this accepted endpoint; forward is chamber-to-artery for AoV and LA-to-LV for MV. */
  signedFlowMlPerSec: number;
  /** Accepted dynamic leaflet state, retained without thresholding. */
  leafletOpeningFraction01: number;
  /** Same-step pressure-law target. Zero versus positive is an exact model branch, not a post-hoc diagnostic threshold. */
  openingTarget01: number;
  openingDriveState: "zero-opening-target" | "positive-opening-target";
  activeDirection: MainWireQuasiSteadyOrificeValveDirectionV2;
  /** Direction-selected effective orifice area used by the hydraulic law. */
  activeEffectiveOrificeAreaCm2: number;
  forwardEffectiveOrificeAreaCm2: number;
  reverseEffectiveOrificeAreaCm2: number;
}>;

export type MainWireIntegratedModelTerminalCycleTraceSampleV2 = Readonly<{
  cycleIndex: number;
  acceptedStepIndexWithinCycle: number;
  acceptedTimeSec: number;
  cyclePhase01: number;
  acceptedDtSec: number;
  signal: MainWireIntegratedModelWaveformSampleSignalsV2;
  valve: Readonly<{
    MV: MainWireIntegratedModelTerminalValveEndpointV2;
    AoV: MainWireIntegratedModelTerminalValveEndpointV2;
  }>;
  lvad: Readonly<{
    unrestrictedFlowMlPerSec: number;
    flowAccelerationMlPerSec2: number;
    inletAvailability01: number;
    constraintOwner: DynamicRotaryPumpConstraintOwnerV1;
    constraintReactionMmHg: number;
    forwardFlowEvidenceStatus: RotaryPumpForwardFlowEvidenceStatusV1;
    forwardFlowPublishedExperimentalTraversalUpperLMin: number | null;
    forwardFlowAdvertisedCapacityLMin: number | null;
    prePumpPressureMmHg: number;
    postPumpPressureMmHg: number;
    deliveredPumpPressureRiseMmHg: number;
  }>;
  acceptedEffectiveActivationEventIds: readonly string[];
}>;

export type MainWireIntegratedModelTerminalCycleTraceV2 = Readonly<{
  cycleIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  sampleCount: number;
  samples: readonly MainWireIntegratedModelTerminalCycleTraceSampleV2[];
  retainedForGraphShapeInspection: true;
  eligibleForNumericalOrPhysiologicalShapeGate: false;
  interpretation:
    "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance";
}>;

export type MainWireIntegratedModelTerminalCycleExplorationResultV2 =
  Readonly<{
    experimentId:
      typeof MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_EXPLORATION_V2_ID;
    claim:
      typeof MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_EXPLORATION_CLAIM_V2;
    input: MainWireIntegratedModelTerminalCycleExplorationInputV2;
    cycleLengthSec: number;
    cycles: readonly MainWireIntegratedModelTerminalCycleExplorationCycleV2[];
    consecutiveCycleChange:
      readonly MainWireIntegratedModelTerminalCycleChangeV2[];
    terminalCycleTrace: MainWireIntegratedModelTerminalCycleTraceV2;
    stabilizationAssessment:
      "not-classified-because-no-predeclared-stability-tolerance";
    allCyclesFiniteConservedAndStepBounded: boolean;
    terminalAcceptedState:
      MainWireIntegratedModelAcceptedStateV2<
        MainWireNormalAdultFiveWallMechanicsStateV1
      >;
  }>;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V2_ID =
  "main-wire-integrated-generated-sinus-periodic-steady-v2" as const;

const INTEGRATED_PERIODIC_CANONICAL_SLOW_TIME_CONSTANT_MULTIPLES_V2 = 10;
const INTEGRATED_PERIODIC_CANONICAL_MAXIMUM_PHYSICAL_TIME_SEC_V2 =
  INTEGRATED_PERIODIC_CANONICAL_SLOW_TIME_CONSTANT_MULTIPLES_V2
  * NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2.responseTimeConstantSec;
const INTEGRATED_PERIODIC_CANONICAL_MAXIMUM_CYCLE_COUNT_V2 =
  INTEGRATED_PERIODIC_CANONICAL_MAXIMUM_PHYSICAL_TIME_SEC_V2
  / RHYTHM_DERIVED_CYCLE_LENGTH_SEC;

if (!Number.isSafeInteger(
  INTEGRATED_PERIODIC_CANONICAL_MAXIMUM_CYCLE_COUNT_V2,
) || INTEGRATED_PERIODIC_CANONICAL_MAXIMUM_CYCLE_COUNT_V2 <= 0) {
  throw new Error(
    "integrated canonical slow-time horizon must contain an exact positive number of sinus cycles",
  );
}

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V2 = Object.freeze({
  policyId:
    "integrated-full-accepted-state-periodic-policy-v2-preregistered" as const,
  period1NormalizedTolerance:
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2
      .period1NormalizedTolerance,
  period2NormalizedTolerance:
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2
      .period2NormalizedTolerance,
  period2MinimumPeriod1NormalizedDelta:
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2
      .period2MinimumPeriod1NormalizedDelta,
  consecutiveCycles:
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2
      .consecutiveBeats,
  coronaryAutoregulationResponseTimeConstantSec:
    NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2.responseTimeConstantSec,
  canonicalSlowTimeConstantMultiples:
    INTEGRATED_PERIODIC_CANONICAL_SLOW_TIME_CONSTANT_MULTIPLES_V2,
  canonicalMaximumPhysicalTimeSec:
    INTEGRATED_PERIODIC_CANONICAL_MAXIMUM_PHYSICAL_TIME_SEC_V2,
  canonicalSinusCycleLengthSec: RHYTHM_DERIVED_CYCLE_LENGTH_SEC,
  defaultMaximumCycleCount:
    INTEGRATED_PERIODIC_CANONICAL_MAXIMUM_CYCLE_COUNT_V2,
  maximumCycleCount:
    INTEGRATED_PERIODIC_CANONICAL_MAXIMUM_CYCLE_COUNT_V2,
  boundedSmokeDefaultMaximumCycleCount: 1,
  boundedSmokeMaximumCycleCount: 2,
  minimumNominalDtSec: 0.001,
  maximumNominalDtSec: 0.01,
  referenceScaleSetId:
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V2.scaleSetId,
  thresholdProvenance:
    "inherited-before-integrated-run-from-coronary-v2-full-state-periodic-policy-not-fit-to-integrated-output" as const,
  canonicalMaximumHorizonProvenance:
    "fixed-before-canonical-rerun-as-ten-times-the-explicit-25-second-live-coronary-controller-coefficient-divided-by-the-fixed-one-second-sinus-cycle-not-derived-from-32-cycle-output" as const,
  supersededMaximumHorizon:
    "32-cycle-fixed-tone-inherited-cap-was-insufficient-after-adding-the-slow-coronary-state" as const,
});

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_CLAIM_V2 =
  Object.freeze({
    scope:
      "canonical-provider-coronary-v3-generated-regular-sinus-and-dynamic-heartmate-ii-verification-profile" as const,
    completeAcceptedStateClosure: true as const,
    period1AndPeriod2Compared: true as const,
    consecutiveCycleRequirement:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V2.consecutiveCycles,
    ordinaryAcceptedTransactionOnly: true as const,
    shootingOrAccelerationApplied: false as const,
    waveformOrParameterFittingApplied: false as const,
    thresholdsInspectedAfterRun: false as const,
    canonicalMaximumHorizonDerivedFromSlowStatePrior: true as const,
    canonicalMaximumHorizonDerivedFromPeriodicOutput: false as const,
    retainedTerminalTrace:
      "raw-accepted-endpoint-samples-without-resampling" as const,
    fixedHorizonCharacterizationEvidenceRole:
      "bounded-exploration-only" as const,
    fixedHorizonCharacterizationMayEstablishCanonicalPeriodicity:
      false as const,
    numericalPeriodicityIsPhysiologicalAcceptance: false as const,
    heartMateIiProfileReleaseApproved: false as const,
    independentValidationClaimed: false as const,
    physiologicalAcceptanceClaimed: false as const,
    clinicalValidationClaimed: false as const,
    releaseAcceptanceClaimed: false as const,
    releaseReadyClaimed: false as const,
  });

export type MainWireIntegratedModelPeriodicSteadyOptionsV2 = Readonly<{
  nominalDtSec: number;
  maximumCycleCount?: number;
  executionPurpose?:
    | "canonical-evidence"
    | "bounded-smoke"
    | "fixed-horizon-characterization";
}>;

export type MainWireIntegratedModelPeriodicSteadyCycleV2 = Readonly<{
  cycleIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  acceptedStepCount: number;
  coronaryAutoregulationWindow:
    MainWireIntegratedModelCoronaryAutoregulationWindowDiagnosticV2;
  period1: MainWireIntegratedModelPeriodicClosureReportV2;
  period2: MainWireIntegratedModelPeriodicClosureReportV2 | null;
  period1MaximumNormalizedDelta: number;
  period2MaximumNormalizedDelta: number | null;
  worstPeriod1Group: string;
  worstPeriod1Path: string;
  lvadLimiterOwnedSampleFraction: number;
  meanLvadFlowMlPerSec: number;
  meanAorticPressureMmHg: number;
  meanLeftVentricularPressureMmHg: number;
  meanLeftVentricularVolumeMl: number;
  allSignalsFiniteAndConserved: boolean;
}>;

export type MainWireIntegratedModelPeriodicSteadyResultV2 = Readonly<{
  experimentId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V2_ID;
  executionPurpose:
    | "canonical-evidence"
    | "bounded-smoke"
    | "fixed-horizon-characterization";
  protocolIdentityHash: string;
  nominalDtSec: number;
  cycleLengthSec: number;
  requestedMaximumCycleCount: number;
  completedCycleCount: number;
  terminationReason:
    | "period1-converged"
    | "period2-suspect"
    | "maximum-cycles-reached";
  classification: MainWireIntegratedModelPeriodicClassificationV2;
  numericalPeriod1Established: boolean;
  period2OrbitSuspected: boolean;
  requestedHorizonCompleted: boolean;
  earlyClassificationStopEligible: boolean;
  physiologicalAcceptanceEstablished: false;
  releaseAcceptanceEstablished: false;
  cycles: readonly MainWireIntegratedModelPeriodicSteadyCycleV2[];
  observations: readonly MainWireIntegratedModelPeriodicCycleObservationV2[];
  terminalCycleTrace: MainWireIntegratedModelTerminalCycleTraceV2;
  terminalAcceptedState:
    MainWireIntegratedModelAcceptedStateV2<
      MainWireNormalAdultFiveWallMechanicsStateV1
    >;
  terminalCheckpoint: MainWireIntegratedModelCheckpointV2;
  policy: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V2;
  claim: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_CLAIM_V2;
}>;

/**
 * Runs one exact generated-sinus source period on the canonical whole-heart
 * provider at nominal 2 ms and 1 ms grids. Every accepted step is first capped
 * by the V2 transaction's coronary-window/event scheduler. This is bounded
 * construction and numerical evidence only; it is not a release or physiology
 * acceptance protocol.
 */
export function runMainWireIntegratedModelNumericalVerificationV2():
MainWireIntegratedModelNumericalVerificationResultV2 {
  const coarse = runOneRhythmDerivedCycle(
    MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2.coarseNominalDtSec,
  );
  const fine = runOneRhythmDerivedCycle(
    MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2.fineNominalDtSec,
  );
  const crossDt = compareRuns(coarse, fine);
  const eventIdentityAndTimingMatchAcrossDt =
    arraysEqual(coarse.rhythm.acceptedEventIds, fine.rhythm.acceptedEventIds)
    && arraysEqual(
      coarse.rhythm.acceptedActivationTimesSec,
      fine.rhythm.acceptedActivationTimesSec,
    )
    && nestedArraysEqual(
      coarse.rhythm.acceptedEventTargetIds,
      fine.rhythm.acceptedEventTargetIds,
    )
    && coarse.rhythm.terminalNextSourceIndex
      === fine.rhythm.terminalNextSourceIndex
    && coarse.rhythm.terminalNextSourceActivationTimeSec
      === fine.rhythm.terminalNextSourceActivationTimeSec
    && coarse.rhythm.terminalPendingEventCount
      === fine.rhythm.terminalPendingEventCount;
  const maximumAbsoluteDelta = Math.max(
    ...crossDt.map((comparison) => comparison.absoluteDelta),
  );
  const maximumNormalizedDelta = Math.max(
    ...crossDt.map((comparison) => comparison.normalizedDelta),
  );
  const allDifferencesFinite = crossDt.every(
    (comparison) => comparison.allValuesFinite,
  ) && Number.isFinite(maximumAbsoluteDelta)
    && Number.isFinite(maximumNormalizedDelta);
  const allWithinPredeclaredNumericalTolerance = crossDt.every(
    (comparison) => comparison.withinTolerance,
  );
  const coarseLoopArea = coarse.waveform.lvadPressureFlow
    .absoluteClosedLoopAreaMmHgMlPerSec;
  const fineLoopArea = fine.waveform.lvadPressureFlow
    .absoluteClosedLoopAreaMmHgMlPerSec;
  const loopAreaAbsoluteDelta = Math.abs(coarseLoopArea - fineLoopArea);
  const loopAreaScale = Math.max(
    Math.abs(coarseLoopArea),
    Math.abs(fineLoopArea),
  );
  const loopAreaSymmetricRelativeDelta = loopAreaScale === 0
    ? 0
    : loopAreaAbsoluteDelta / loopAreaScale;
  const exploratoryPressureFlowLoopComparison = Object.freeze({
    coarseAbsoluteAreaMmHgMlPerSec: coarseLoopArea,
    fineAbsoluteAreaMmHgMlPerSec: fineLoopArea,
    absoluteDeltaMmHgMlPerSec: loopAreaAbsoluteDelta,
    symmetricRelativeDelta: loopAreaSymmetricRelativeDelta,
    allValuesFinite:
      Number.isFinite(coarseLoopArea)
      && Number.isFinite(fineLoopArea)
      && Number.isFinite(loopAreaAbsoluteDelta)
      && Number.isFinite(loopAreaSymmetricRelativeDelta),
    eligibleForNumericalOrPhysiologicalShapeGate: false as const,
    assessment:
      "not-assessed-cold-start-nonperiodic-descriptor" as const,
  });
  const profile = heartMateIiLvadOnlyVerificationProfile();
  const inertance = HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1;
  return Object.freeze({
    experimentId: MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_V2_ID,
    claim: MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_CLAIM_V2,
    protocol: MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2,
    heartMateIiLvadOnlyTranscription: Object.freeze({
      profileId: profile.profileId,
      profileReleaseApproved: false as const,
      lvadEnabled: true as const,
      lvadSpeedRpm: 9_000 as const,
      pumpInternalInertanceMmHgSec2PerMl:
        inertance.pumpInternalMmHgSec2PerMl,
      drainageInertanceMmHgSec2PerMl:
        inertance.drainageMmHgSec2PerMl,
      returnPathInertanceMmHgSec2PerMl:
        inertance.returnPathMmHgSec2PerMl,
      totalCircuitInertanceMmHgSec2PerMl:
        totalCircuitInertance(inertance),
      nonLvadDeviceInertancesAreZero: true as const,
      inertanceCopiedToOtherDeviceClasses: false as const,
    }),
    coarse,
    fine,
    crossDt,
    crossDtSummary: Object.freeze({
      maximumAbsoluteDelta,
      maximumNormalizedDelta,
      allDifferencesFinite,
      allWithinPredeclaredNumericalTolerance,
    }),
    exploratoryPressureFlowLoopComparison,
    eventIdentityAndTimingMatchAcrossDt,
    allNumericalChecksPassed:
      coarse.invariant.allWithinTolerance
      && fine.invariant.allWithinTolerance
      && coarse.waveform.allSamplesFinite
      && fine.waveform.allSamplesFinite
      && coarse.waveform.lvadPressureFlow.nonzeroFlowSampleCount > 0
      && fine.waveform.lvadPressureFlow.nonzeroFlowSampleCount > 0
      && eventIdentityAndTimingMatchAcrossDt
      && allDifferencesFinite
      && allWithinPredeclaredNumericalTolerance,
  });
}

/**
 * Restores one exact V2 checkpoint once, then advances detached immutable
 * copies over the same next source period at 2 ms and 1 ms nominal grids.
 * This is a one-cycle discretization-sensitivity characterization near the
 * supplied state, not an estimate of local truncation error or convergence
 * order. It deliberately cannot promote that state to a canonical periodic
 * orbit or to physiological evidence.
 */
export async function runMainWireIntegratedModelCheckpointLocalDtRefinementV1(
  input: MainWireIntegratedModelCheckpointLocalDtRefinementInputV1,
): Promise<MainWireIntegratedModelCheckpointLocalDtRefinementResultV1> {
  if (input === null || typeof input !== "object" || Array.isArray(input)
    || Object.keys(input).length !== 1
    || !Object.prototype.hasOwnProperty.call(input, "checkpoint")) {
    throw new TypeError(
      "checkpoint local dt-refinement input must contain only checkpoint",
    );
  }
  const fixture = createMainWireIntegratedModelVerificationFixtureV2();
  const checkpointContext = Object.freeze({
    provider: fixture.provider,
    coronaryPrior: fixture.coronaryStepInput.coronaryPrior,
    collapseHydraulics: fixture.coronaryStepInput.collapseHydraulics,
    impMechanism: fixture.coronaryStepInput.impMechanism,
    shorteningImpPrior: fixture.coronaryStepInput.shorteningImpPrior,
    coronaryAutoregulationBinding:
      fixture.cold.acceptedState.coronary.coronaryAutoregulationBinding,
    rhythm: fixture.rhythm,
    dynamicMechanicalSupportProfile: fixture.profile,
    dynamicMechanicalSupportConfig: fixture.config,
  });
  const restored = await restoreMainWireIntegratedModelV2(
    checkpointContext,
    input.checkpoint,
  );
  const rawCycleIndex = restored.acceptedTimeSec / fixture.cycleLengthSec;
  const zeroBasedCycleIndex = Math.round(rawCycleIndex);
  if (!Number.isSafeInteger(zeroBasedCycleIndex)
    || zeroBasedCycleIndex < 0
    || Math.abs(rawCycleIndex - zeroBasedCycleIndex) > 1e-10) {
    throw new Error(
      "checkpoint local dt refinement requires an exact source-cycle boundary",
    );
  }

  const coarse = runOneRhythmDerivedCycle(
    MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2.coarseNominalDtSec,
    Object.freeze({
      fixture,
      initialAcceptedState: restored,
      zeroBasedCycleIndex,
    }),
  );
  const fine = runOneRhythmDerivedCycle(
    MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2.fineNominalDtSec,
    Object.freeze({
      fixture,
      initialAcceptedState: restored,
      zeroBasedCycleIndex,
    }),
  );
  const crossDt = compareRuns(coarse, fine);
  const maximumAbsoluteDelta = Math.max(
    ...crossDt.map((comparison) => comparison.absoluteDelta),
  );
  const maximumNormalizedDelta = Math.max(
    ...crossDt.map((comparison) => comparison.normalizedDelta),
  );
  const allDifferencesFinite = crossDt.every(
    (comparison) => comparison.allValuesFinite,
  ) && Number.isFinite(maximumAbsoluteDelta)
    && Number.isFinite(maximumNormalizedDelta);
  const allWithinPredeclaredNumericalTolerance = crossDt.every(
    (comparison) => comparison.withinTolerance,
  );
  const eventIdentityAndTimingMatchAcrossDt =
    arraysEqual(coarse.rhythm.acceptedEventIds, fine.rhythm.acceptedEventIds)
    && arraysEqual(
      coarse.rhythm.acceptedActivationTimesSec,
      fine.rhythm.acceptedActivationTimesSec,
    )
    && nestedArraysEqual(
      coarse.rhythm.acceptedEventTargetIds,
      fine.rhythm.acceptedEventTargetIds,
    )
    && coarse.rhythm.terminalNextSourceIndex
      === fine.rhythm.terminalNextSourceIndex
    && coarse.rhythm.terminalNextSourceActivationTimeSec
      === fine.rhythm.terminalNextSourceActivationTimeSec
    && coarse.rhythm.terminalPendingEventCount
      === fine.rhythm.terminalPendingEventCount;
  const allNumericalChecksPassed =
    coarse.invariant.allWithinTolerance
    && fine.invariant.allWithinTolerance
    && coarse.waveform.allSamplesFinite
    && fine.waveform.allSamplesFinite
    && coarse.waveform.lvadPressureFlow.nonzeroFlowSampleCount > 0
    && fine.waveform.lvadPressureFlow.nonzeroFlowSampleCount > 0
    && eventIdentityAndTimingMatchAcrossDt
    && allDifferencesFinite
    && allWithinPredeclaredNumericalTolerance;

  return Object.freeze({
    experimentId:
      MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_LOCAL_DT_REFINEMENT_V1_ID,
    claim:
      MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_LOCAL_DT_REFINEMENT_CLAIM_V1,
    initialCheckpoint: Object.freeze({
      checkpointId: input.checkpoint.checkpointId,
      schemaVersion: input.checkpoint.schemaVersion,
      checkpointSha256: input.checkpoint.checkpointSha256,
      acceptedTimeSec: restored.acceptedTimeSec,
      revision: restored.revision,
      zeroBasedCycleIndex,
    }),
    coarse,
    fine,
    crossDt,
    crossDtSummary: Object.freeze({
      maximumAbsoluteDelta,
      maximumNormalizedDelta,
      allDifferencesFinite,
      allWithinPredeclaredNumericalTolerance,
    }),
    eventIdentityAndTimingMatchAcrossDt,
    bothRunsStartFromSameExactCheckpoint: true as const,
    allNumericalChecksPassed,
    periodicOrbitEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
  });
}

/**
 * Carries one accepted V2 state through consecutive generated-sinus source
 * periods. Per-cycle closure and limiter descriptors are reported without a
 * stability threshold or periodic/physiological classification.
 */
export function runMainWireIntegratedModelTerminalCycleExplorationV2(
  input: MainWireIntegratedModelTerminalCycleExplorationInputV2,
): MainWireIntegratedModelTerminalCycleExplorationResultV2 {
  validateTerminalCycleExplorationInput(input);
  const fixture = createMainWireIntegratedModelVerificationFixtureV2();
  let accepted = fixture.cold.acceptedState;
  const cycles: MainWireIntegratedModelTerminalCycleExplorationCycleV2[] = [];
  const terminalCycleTraceSamples:
    MainWireIntegratedModelTerminalCycleTraceSampleV2[] = [];
  for (let zeroBasedCycleIndex = 0;
    zeroBasedCycleIndex < input.cycleCount;
    zeroBasedCycleIndex += 1) {
    const startState = accepted;
    const run = runOneRhythmDerivedCycle(input.nominalDtSec, {
      fixture,
      initialAcceptedState: startState,
      zeroBasedCycleIndex,
      sampleObserver: zeroBasedCycleIndex === input.cycleCount - 1
        ? (sample) => terminalCycleTraceSamples.push(sample)
        : undefined,
    });
    accepted = run.terminalAcceptedState;
    cycles.push(buildTerminalCycleExplorationCycle(
      zeroBasedCycleIndex + 1,
      startState,
      run,
      fixture,
    ));
  }
  const consecutiveCycleChange = Object.freeze(
    cycles.slice(1).map((cycle, index) =>
      compareExploratoryCycles(cycles[index]!, cycle)),
  );
  const terminalCycle = cycles.at(-1)!;
  if (terminalCycleTraceSamples.length !== terminalCycle.acceptedStepCount) {
    throw new Error("terminal-cycle trace sample count differs from accepted steps");
  }
  const terminalCycleTrace = Object.freeze({
    cycleIndex: terminalCycle.cycleIndex,
    startTimeSec: terminalCycle.startTimeSec,
    endTimeSec: terminalCycle.endTimeSec,
    sampleCount: terminalCycleTraceSamples.length,
    samples: Object.freeze(terminalCycleTraceSamples),
    retainedForGraphShapeInspection: true as const,
    eligibleForNumericalOrPhysiologicalShapeGate: false as const,
    interpretation:
      "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance" as const,
  });
  return Object.freeze({
    experimentId:
      MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_EXPLORATION_V2_ID,
    claim: MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_EXPLORATION_CLAIM_V2,
    input: Object.freeze({
      cycleCount: input.cycleCount,
      nominalDtSec: input.nominalDtSec,
    }),
    cycleLengthSec: fixture.cycleLengthSec,
    cycles: Object.freeze(cycles),
    consecutiveCycleChange,
    terminalCycleTrace,
    stabilizationAssessment:
      "not-classified-because-no-predeclared-stability-tolerance" as const,
    allCyclesFiniteConservedAndStepBounded: cycles.every(
      (cycle) => cycle.boundedness.finiteAndStepBounded
        && cycle.conservation.withinExistingConstructionTolerances,
    ),
    terminalAcceptedState: accepted,
  });
}

/**
 * Classifies the complete integrated accepted state at exact regular-sinus
 * source-period boundaries. The fixed policy predates this run and is never
 * adjusted from its outputs. Numerical P1/P2 does not establish physiology.
 */
export async function runMainWireIntegratedModelPeriodicSteadyV2(
  options: MainWireIntegratedModelPeriodicSteadyOptionsV2,
): Promise<MainWireIntegratedModelPeriodicSteadyResultV2> {
  const resolved = resolveIntegratedPeriodicOptions(options);
  const fixture = createMainWireIntegratedModelVerificationFixtureV2();
  const protocolIdentityHash = await sha256CanonicalJsonHex(Object.freeze({
    experimentId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V2_ID,
    executionPurpose: resolved.executionPurpose,
    nominalDtSec: resolved.nominalDtSec,
    maximumCycleCount: resolved.maximumCycleCount,
    policy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V2,
    provider: Object.freeze({
      contractId: fixture.provider.contractId,
      providerId: fixture.provider.providerId,
      parameterSetId: fixture.provider.parameterSetId,
      parameterIdentityHash: fixture.provider.parameterIdentityHash,
      stateSchemaVersion: fixture.provider.stateSchemaVersion,
    }),
    generatedBinding: fixture.generated.binding,
    dynamicMechanicalSupportProfile: fixture.profile,
    dynamicMechanicalSupportConfig: fixture.config,
    coronaryStepInput: fixture.coronaryStepInput,
  }));
  const classifierOptions = Object.freeze({
    period1NormalizedTolerance:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V2
        .period1NormalizedTolerance,
    period2NormalizedTolerance:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V2
        .period2NormalizedTolerance,
    period2MinimumPeriod1NormalizedDelta:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V2
        .period2MinimumPeriod1NormalizedDelta,
    consecutiveCycles:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V2.consecutiveCycles,
  });
  let accepted = fixture.cold.acceptedState;
  const boundaryHistory: MainWireIntegratedModelAcceptedStateV2<
    MainWireNormalAdultFiveWallMechanicsStateV1
  >[] = [accepted];
  const observations: MainWireIntegratedModelPeriodicCycleObservationV2[] = [];
  const cycles: MainWireIntegratedModelPeriodicSteadyCycleV2[] = [];
  let classification = classifyMainWireIntegratedModelPeriodicityV2(
    observations,
    classifierOptions,
  );
  let terminalTraceSamples:
    MainWireIntegratedModelTerminalCycleTraceSampleV2[] = [];

  for (let zeroBasedCycleIndex = 0;
    zeroBasedCycleIndex < resolved.maximumCycleCount;
    zeroBasedCycleIndex += 1) {
    const cycleTraceSamples:
      MainWireIntegratedModelTerminalCycleTraceSampleV2[] = [];
    const startState = accepted;
    const run = runOneRhythmDerivedCycle(resolved.nominalDtSec, {
      fixture,
      initialAcceptedState: startState,
      zeroBasedCycleIndex,
      sampleObserver: (sample) => cycleTraceSamples.push(sample),
    });
    accepted = run.terminalAcceptedState;
    const previousBoundary = boundaryHistory.at(-1)!;
    const twoBackBoundary = boundaryHistory.length >= 2
      ? boundaryHistory.at(-2)!
      : null;
    const period1 = compareMainWireIntegratedModelAcceptedStatesV2(
      accepted,
      previousBoundary,
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V2,
    );
    const period2 = twoBackBoundary === null
      ? null
      : compareMainWireIntegratedModelAcceptedStatesV2(
        accepted,
        twoBackBoundary,
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V2,
      );
    const cycleIndex = zeroBasedCycleIndex + 1;
    observations.push(Object.freeze({
      cycleIndex,
      evidenceRole: resolved.executionPurpose === "canonical-evidence"
        ? "canonical-periodic-protocol" as const
        : "bounded-exploration-only" as const,
      protocolIdentityHash,
      period1,
      period2,
    }));
    classification = classifyMainWireIntegratedModelPeriodicityV2(
      observations,
      classifierOptions,
    );
    const exploratoryCycle = buildTerminalCycleExplorationCycle(
      cycleIndex,
      startState,
      run,
      fixture,
    );
    cycles.push(Object.freeze({
      cycleIndex,
      startTimeSec: startState.acceptedTimeSec,
      endTimeSec: accepted.acceptedTimeSec,
      acceptedStepCount: run.acceptedStepCount,
      coronaryAutoregulationWindow: run.coronaryAutoregulationWindow,
      period1,
      period2,
      period1MaximumNormalizedDelta:
        period1.overall.maximumNormalizedDelta,
      period2MaximumNormalizedDelta:
        period2?.overall.maximumNormalizedDelta ?? null,
      worstPeriod1Group: period1.overall.worstGroup,
      worstPeriod1Path: period1.overall.worstPath,
      lvadLimiterOwnedSampleFraction:
        exploratoryCycle.lvadConstraint.limiterOwnedSampleFraction,
      meanLvadFlowMlPerSec: run.signal.meanLvadFlowMlPerSec,
      meanAorticPressureMmHg: run.signal.meanAorticPressureMmHg,
      meanLeftVentricularPressureMmHg:
        run.signal.meanLeftVentricularPressureMmHg,
      meanLeftVentricularVolumeMl:
        run.signal.meanLeftVentricularVolumeMl,
      allSignalsFiniteAndConserved:
        exploratoryCycle.boundedness.finiteAndStepBounded
        && exploratoryCycle.conservation.withinExistingConstructionTolerances,
    }));
    terminalTraceSamples = cycleTraceSamples;
    boundaryHistory.push(accepted);
    if (boundaryHistory.length > 3) boundaryHistory.shift();
    if (resolved.executionPurpose !== "fixed-horizon-characterization"
      && classification.status !== "not-converged") break;
  }

  const terminalCycle = cycles.at(-1);
  if (terminalCycle === undefined
    || terminalTraceSamples.length !== terminalCycle.acceptedStepCount) {
    throw new Error("integrated periodic runner has no complete terminal trace");
  }
  const terminalCycleTrace = Object.freeze({
    cycleIndex: terminalCycle.cycleIndex,
    startTimeSec: terminalCycle.startTimeSec,
    endTimeSec: terminalCycle.endTimeSec,
    sampleCount: terminalTraceSamples.length,
    samples: Object.freeze(terminalTraceSamples),
    retainedForGraphShapeInspection: true as const,
    eligibleForNumericalOrPhysiologicalShapeGate: false as const,
    interpretation:
      "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance" as const,
  });
  const terminationReason = classification.status === "period1-converged"
    ? "period1-converged" as const
    : classification.status === "period2-suspect"
      ? "period2-suspect" as const
      : "maximum-cycles-reached" as const;
  const canonical = resolved.executionPurpose === "canonical-evidence";
  const terminalCheckpoint = await checkpointMainWireIntegratedModelV2({
    provider: fixture.provider,
    coronaryPrior: fixture.coronaryStepInput.coronaryPrior,
    collapseHydraulics: fixture.coronaryStepInput.collapseHydraulics,
    impMechanism: fixture.coronaryStepInput.impMechanism,
    shorteningImpPrior: fixture.coronaryStepInput.shorteningImpPrior,
    coronaryAutoregulationBinding:
      accepted.coronary.coronaryAutoregulationBinding,
    rhythm: fixture.rhythm,
    dynamicMechanicalSupportProfile: fixture.profile,
    dynamicMechanicalSupportConfig: fixture.config,
  }, accepted);
  return Object.freeze({
    experimentId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V2_ID,
    executionPurpose: resolved.executionPurpose,
    protocolIdentityHash,
    nominalDtSec: resolved.nominalDtSec,
    cycleLengthSec: fixture.cycleLengthSec,
    requestedMaximumCycleCount: resolved.maximumCycleCount,
    completedCycleCount: cycles.length,
    terminationReason,
    classification,
    numericalPeriod1Established:
      canonical && classification.status === "period1-converged",
    period2OrbitSuspected:
      canonical && classification.status === "period2-suspect",
    requestedHorizonCompleted: cycles.length === resolved.maximumCycleCount,
    earlyClassificationStopEligible:
      resolved.executionPurpose !== "fixed-horizon-characterization",
    physiologicalAcceptanceEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
    cycles: Object.freeze(cycles),
    observations: Object.freeze(observations),
    terminalCycleTrace,
    terminalAcceptedState: accepted,
    terminalCheckpoint,
    policy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V2,
    claim: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_CLAIM_V2,
  });
}

export function createMainWireIntegratedHeartMateIiLvadOnlyVerificationProfileV2():
DynamicMechanicalSupportInertanceProfileV1 {
  return heartMateIiLvadOnlyVerificationProfile();
}

type MainWireIntegratedModelVerificationFixtureV2 = ReturnType<
  typeof createMainWireIntegratedModelVerificationFixtureV2
>;

type MainWireIntegratedModelCycleContinuationV2 = Readonly<{
  fixture: MainWireIntegratedModelVerificationFixtureV2;
  initialAcceptedState: MainWireIntegratedModelAcceptedStateV2<
    MainWireNormalAdultFiveWallMechanicsStateV1
  >;
  zeroBasedCycleIndex: number;
  sampleObserver?: (
    sample: MainWireIntegratedModelTerminalCycleTraceSampleV2,
  ) => void;
}>;

function runOneRhythmDerivedCycle(
  nominalDtSec: number,
  continuation?: MainWireIntegratedModelCycleContinuationV2,
): MainWireIntegratedModelNumericalRunV2 {
  const protocol = MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2;
  const fixture = continuation?.fixture
    ?? createMainWireIntegratedModelVerificationFixtureV2();
  const {
    provider,
    generated,
    cycleLengthSec,
    rhythm,
    profile,
    config,
    dynamicMechanicalSupport,
    coronaryStepInput,
    cold,
  } = fixture;
  const zeroBasedCycleIndex = continuation?.zeroBasedCycleIndex ?? 0;
  const cycleStartTimeSec = zeroBasedCycleIndex * cycleLengthSec;
  const cycleEndTimeSec = cycleStartTimeSec + cycleLengthSec;
  let accepted = continuation?.initialAcceptedState ?? cold.acceptedState;
  if (accepted.acceptedTimeSec !== cycleStartTimeSec) {
    throw new Error(
      "integrated V2 cycle continuation does not start on its rhythm boundary",
    );
  }

  let acceptedStepCount = 0;
  let nominalGridIndex = 1;
  let maximumGlobalTotalBloodVolumeErrorMl = 0;
  let maximumCoronaryBloodVolumeLedgerResidualMl = 0;
  let maximumDynamicMcsConservationResidualMlPerSec = 0;
  let effectiveEventBoundaryStepCount = 0;
  let rhythmClippedStepCount = 0;
  let coronaryWindowClippedStepCount = 0;
  let coronaryWindowCompletionCount = 0;
  let coronaryWindowAndEffectiveBatchTieCount = 0;
  const completedCoronaryAutoregulationWindows:
    MainWireIntegratedModelCoronaryAutoregulationWindowDiagnosticV2[] = [];
  const acceptedEventIds: string[] = [];
  const acceptedActivationTimesSec: number[] = [];
  const acceptedEventTargetIds: (readonly string[])[] = [];
  const integral = emptySignalAccumulator();
  const extrema = emptyExtrema();
  const pressureFlowPoints: PressureFlowPointV2[] = [];
  const lvadConstraintOwnerSampleCount = emptyConstraintOwnerCount();
  let allSamplesFinite = true;
  let terminal: SignalSnapshotV2 | null = null;

  while (accepted.acceptedTimeSec < cycleEndTimeSec) {
    if (acceptedStepCount >= protocol.maximumAcceptedStepCountPerRun) {
      throw new Error("integrated V2 numerical verification exceeded step bound");
    }
    const nominalTargetTimeSec = Math.min(
      cycleEndTimeSec,
      cycleStartTimeSec + nominalGridIndex * nominalDtSec,
    );
    const requestedStepSec = nominalTargetTimeSec - accepted.acceptedTimeSec;
    if (!(requestedStepSec > 0)) {
      nominalGridIndex += 1;
      continue;
    }
    const maximum = maximumMainWireIntegratedModelStepDurationV2(
      accepted,
      requestedStepSec,
      rhythm,
      profile,
      config,
    );
    const actualDtSec = maximum.maximumStepSec;
    const stepped = stepMainWireIntegratedModelV2(provider, accepted, {
      dtSec: actualDtSec,
      coronary: coronaryStepInput,
      rhythm,
      dynamicMechanicalSupport,
    });
    if (stepped.converged === false) {
      throw new Error(
        `integrated V2 numerical verification failed at ${accepted.acceptedTimeSec}s: ${stepped.message}`,
      );
    }
    accepted = stepped.acceptedState;
    acceptedStepCount += 1;
    if (Math.abs(accepted.acceptedTimeSec - nominalTargetTimeSec) <= 1e-14) {
      nominalGridIndex += 1;
    }

    if (maximum.effectiveActivationBoundaryTimeSec !== null
      && maximum.candidateTimeSec
        === maximum.effectiveActivationBoundaryTimeSec) {
      effectiveEventBoundaryStepCount += 1;
    }
    if (maximum.clippedByRhythmEvent) rhythmClippedStepCount += 1;
    if (maximum.clippedByCoronaryWindow) coronaryWindowClippedStepCount += 1;
    if (maximum.coronaryWindowAndEffectiveBatchTie) {
      coronaryWindowAndEffectiveBatchTieCount += 1;
    }
    if (stepped.coronaryStep.autoregulationWindowCompleted) {
      coronaryWindowCompletionCount += 1;
      const completion = stepped.coronaryStep.autoregulationCompletion;
      if (completion === null) {
        throw new Error(
          "integrated V2 coronary window completion flag had no accepted completion",
        );
      }
      completedCoronaryAutoregulationWindows.push(
        buildCoronaryAutoregulationWindowDiagnosticV2(completion),
      );
    }

    maximumGlobalTotalBloodVolumeErrorMl = Math.max(
      maximumGlobalTotalBloodVolumeErrorMl,
      Math.abs(
        stepped.coronaryStep.baseStep.circulationTrial.diagnostics
          .totalBloodVolumeErrorMl,
      ),
    );
    maximumCoronaryBloodVolumeLedgerResidualMl = Math.max(
      maximumCoronaryBloodVolumeLedgerResidualMl,
      Math.abs(
        stepped.coronaryStep.baseStep.coronaryTrial.diagnostics
          .exactBloodVolumeLedgerResidualMl,
      ),
    );
    maximumDynamicMcsConservationResidualMlPerSec = Math.max(
      maximumDynamicMcsConservationResidualMlPerSec,
      Math.abs(
        stepped.dynamicMechanicalSupportTrial.conservationResidualMlPerSec,
      ),
    );
    for (const event of stepped.generatedRhythmTrial.activationEvents) {
      acceptedEventIds.push(event.eventId);
      acceptedActivationTimesSec.push(event.activationTimeSec);
      acceptedEventTargetIds.push(Object.freeze([...event.targetIds]));
    }
    terminal = signalSnapshot(stepped);
    allSamplesFinite = allSamplesFinite && signalIsFinite(terminal);
    accumulateSignals(integral, terminal, actualDtSec);
    updateExtrema(extrema, terminal);
    pressureFlowPoints.push(Object.freeze({
      flowMlPerSec: terminal.lvadFlowMlPerSec,
      pressureRiseMmHg: terminal.lvadPressureRiseMmHg,
    }));
    lvadConstraintOwnerSampleCount[
      stepped.dynamicMechanicalSupportTrial.pump.LVAD.constraintOwner
    ] += 1;
    continuation?.sampleObserver?.(Object.freeze({
      cycleIndex: zeroBasedCycleIndex + 1,
      acceptedStepIndexWithinCycle: acceptedStepCount,
      acceptedTimeSec: accepted.acceptedTimeSec,
      cyclePhase01:
        (accepted.acceptedTimeSec - cycleStartTimeSec) / cycleLengthSec,
      acceptedDtSec: actualDtSec,
      signal: terminal,
      valve: Object.freeze({
        MV: terminalValveEndpoint(
          stepped.coronaryStep.baseStep.circulationTrial.valveEvaluations.MV,
        ),
        AoV: terminalValveEndpoint(
          stepped.coronaryStep.baseStep.circulationTrial.valveEvaluations.AoV,
        ),
      }),
      lvad: Object.freeze({
        unrestrictedFlowMlPerSec:
          stepped.dynamicMechanicalSupportTrial.pump.LVAD
            .unrestrictedFlowMlPerSec,
        flowAccelerationMlPerSec2:
          stepped.dynamicMechanicalSupportTrial.pump.LVAD
            .flowAccelerationMlPerSec2,
        inletAvailability01:
          stepped.dynamicMechanicalSupportTrial.pump.LVAD.inletAvailability01,
        constraintOwner:
          stepped.dynamicMechanicalSupportTrial.pump.LVAD.constraintOwner,
        constraintReactionMmHg:
          stepped.dynamicMechanicalSupportTrial.pump.LVAD.constraintReactionMmHg,
        forwardFlowEvidenceStatus:
          stepped.dynamicMechanicalSupportTrial.pump.LVAD
            .forwardFlowEvidenceStatus,
        forwardFlowPublishedExperimentalTraversalUpperLMin:
          stepped.dynamicMechanicalSupportTrial.pump.LVAD
            .forwardFlowPublishedExperimentalTraversalUpperLMin,
        forwardFlowAdvertisedCapacityLMin:
          stepped.dynamicMechanicalSupportTrial.pump.LVAD
            .forwardFlowAdvertisedCapacityLMin,
        prePumpPressureMmHg:
          stepped.dynamicMechanicalSupportTrial.pump.LVAD.prePumpPressureMmHg,
        postPumpPressureMmHg:
          stepped.dynamicMechanicalSupportTrial.pump.LVAD.postPumpPressureMmHg,
        deliveredPumpPressureRiseMmHg:
          stepped.dynamicMechanicalSupportTrial.pump.LVAD.postPumpPressureMmHg
          - stepped.dynamicMechanicalSupportTrial.pump.LVAD.prePumpPressureMmHg,
      }),
      acceptedEffectiveActivationEventIds: Object.freeze(
        stepped.generatedRhythmTrial.activationEvents.map(
          (event) => event.eventId,
        ),
      ),
    }));
  }
  if (terminal === null) {
    throw new Error("integrated V2 verification took no steps");
  }
  if (coronaryWindowCompletionCount !== 1
    || completedCoronaryAutoregulationWindows.length !== 1) {
    throw new Error(
      "integrated V2 sinus cycle must contain exactly one accepted coronary autoregulation window completion",
    );
  }
  const coronaryAutoregulationWindow =
    completedCoronaryAutoregulationWindows[0]!;
  if (coronaryAutoregulationWindow.windowIndex !== zeroBasedCycleIndex
    || !equalWithinFloatingRoundoff(
      coronaryAutoregulationWindow.windowStartAcceptedTimeSec,
      cycleStartTimeSec,
    )
    || !equalWithinFloatingRoundoff(
      coronaryAutoregulationWindow.windowEndAcceptedTimeSec,
      cycleEndTimeSec,
    )
    || !equalWithinFloatingRoundoff(
      coronaryAutoregulationWindow.acceptedWindowDurationSec,
      cycleLengthSec,
    )) {
    throw new Error(
      "integrated V2 accepted coronary completion differs from its sinus-cycle boundary",
    );
  }

  const clock = acceptedClock(accepted, accepted.revision);
  const finalizedExtrema = finalizeExtrema(extrema);
  const signal = finalizeSignals(integral, terminal, cycleLengthSec);
  const lvadPressureFlow = finalizePressureFlowMorphology(
    pressureFlowPoints,
    finalizedExtrema,
    lvadConstraintOwnerSampleCount,
  );
  const waveform = Object.freeze({
    sampleCount: pressureFlowPoints.length,
    allSamplesFinite,
    extremaBySignal: finalizedExtrema,
    lvadPressureFlow,
  });
  const comparisonValues = buildComparisonValues(
    signal,
    finalizedExtrema,
    lvadPressureFlow,
  );
  const tolerance = protocol.invariantTolerance;
  const autoregulation = accepted.coronary.coronaryAutoregulation;
  const acceptedEndTimeMatchesRhythmDerivedCycle =
    accepted.acceptedTimeSec === cycleEndTimeSec;
  const expectedWindowIndex = zeroBasedCycleIndex + 1;
  const coronaryAutoregulationWindowIsEmptyAtCycleEnd =
    autoregulation.windowIndex === expectedWindowIndex
    && autoregulation.acceptedDurationSec === 0
    && autoregulation.acceptedStepCount === 0
    && autoregulation.windowControl === null;
  const invariant = Object.freeze({
    maximumGlobalTotalBloodVolumeErrorMl,
    maximumCoronaryBloodVolumeLedgerResidualMl,
    maximumDynamicMcsConservationResidualMlPerSec,
    acceptedEndTimeMatchesRhythmDerivedCycle,
    coronaryAutoregulationWindowIndex: autoregulation.windowIndex,
    coronaryAutoregulationWindowIsEmptyAtCycleEnd,
    allWithinTolerance:
      clock.maximumOwnerClockSkewSec
        <= tolerance.acceptedOwnerClockSkewSec
      && clock.allOwnerRevisionsMatch
      && acceptedEndTimeMatchesRhythmDerivedCycle
      && maximumGlobalTotalBloodVolumeErrorMl
        <= tolerance.globalTotalBloodVolumeErrorMl
      && maximumCoronaryBloodVolumeLedgerResidualMl
        <= tolerance.coronaryBloodVolumeLedgerResidualMl
      && maximumDynamicMcsConservationResidualMlPerSec
        <= tolerance.dynamicMcsConservationResidualMlPerSec
      && coronaryAutoregulationWindowIsEmptyAtCycleEnd
      && coronaryWindowCompletionCount === 1,
  });
  const generatorState = accepted.generatedRhythmCalcium.generatorState;
  return Object.freeze({
    nominalDtSec,
    completed: true as const,
    acceptedStepCount,
    acceptedClock: clock,
    scheduler: Object.freeze({
      effectiveEventBoundaryStepCount,
      rhythmClippedStepCount,
      coronaryWindowClippedStepCount,
      coronaryWindowCompletionCount,
      coronaryWindowAndEffectiveBatchTieCount,
    }),
    coronaryAutoregulationWindow,
    rhythm: Object.freeze({
      bindingId: generated.binding.bindingId,
      generatorConfigId:
        generated.binding.generatorConfig.generatorConfigId,
      generatorInstanceId:
        generated.binding.generatorConfig.generatorInstanceId,
      sourceMode: "regular-sinus" as const,
      sourcePeriodSec: generated.binding.generatorConfig.sourcePeriodSec,
      acceptedEventIds: Object.freeze(acceptedEventIds),
      acceptedActivationTimesSec: Object.freeze(acceptedActivationTimesSec),
      acceptedEventTargetIds: Object.freeze(acceptedEventTargetIds),
      terminalNextSourceIndex: generatorState.nextSourceIndex,
      terminalNextSourceActivationTimeSec:
        generatorState.nextSourceActivationTimeSec,
      terminalPendingEventCount: generatorState.pendingActivationEvents.length,
    }),
    invariant,
    signal,
    waveform,
    comparisonValues,
    terminalAcceptedState: accepted,
  });
}

function buildCoronaryAutoregulationWindowDiagnosticV2(
  completion: CoronaryAcceptedAutoregulationCompletionV3,
): MainWireIntegratedModelCoronaryAutoregulationWindowDiagnosticV2 {
  const expectedLayerCount = CORONARY_TERRITORY_IDS_V2.length
    * CORONARY_LAYER_IDS_V2.length;
  if (expectedLayerCount !== 6
    || !Number.isSafeInteger(completion.windowIndex)
    || completion.windowIndex < 0
    || !Number.isFinite(completion.windowStartAcceptedTimeSec)
    || !Number.isFinite(completion.windowEndAcceptedTimeSec)
    || completion.windowEndAcceptedTimeSec
      <= completion.windowStartAcceptedTimeSec
    || !Number.isSafeInteger(completion.acceptedStepCount)
    || completion.acceptedStepCount <= 0
    || !Number.isFinite(completion.aggregate.acceptedWindowDurationSec)
    || completion.aggregate.acceptedWindowDurationSec <= 0
    || !equalWithinFloatingRoundoff(
      completion.windowEndAcceptedTimeSec
        - completion.windowStartAcceptedTimeSec,
      completion.aggregate.acceptedWindowDurationSec,
    )) {
    throw new Error(
      "integrated V2 accepted coronary completion has invalid window provenance",
    );
  }
  if (!arraysEqual(
    Object.keys(completion.toneStep.layerStepByTerritoryLayer).sort(),
    [...CORONARY_TERRITORY_IDS_V2].sort(),
  )) {
    throw new Error(
      "integrated V2 accepted coronary completion does not contain exactly three territories",
    );
  }

  const byTerritoryLayer = Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V2.map((territoryId) => {
      const sourceLayers =
        completion.toneStep.layerStepByTerritoryLayer[territoryId];
      if (!arraysEqual(
        Object.keys(sourceLayers).sort(),
        [...CORONARY_LAYER_IDS_V2].sort(),
      )) {
        throw new Error(
          `integrated V2 accepted coronary completion ${territoryId} does not contain exactly two layers`,
        );
      }
      return [territoryId, Object.freeze(Object.fromEntries(
        CORONARY_LAYER_IDS_V2.map((layerId) => {
          const source = sourceLayers[layerId];
          const achievedToDemandTargetFlowRatio =
            source.achievedMeanTissueFlowMlPerSec
            / source.demandTargetFlowMlPerSec;
          const deltaLogToneResistanceScale =
            Math.log(source.nextResistanceScale)
            - Math.log(source.previousResistanceScale);
          const values = [
            source.achievedMeanTissueFlowMlPerSec,
            source.demandTargetFlowMlPerSec,
            achievedToDemandTargetFlowRatio,
            source.previousResistanceScale,
            source.nextResistanceScale,
            deltaLogToneResistanceScale,
            source.controlSignalLogPerTimeConstant,
          ];
          if (!values.every(Number.isFinite)
            || source.achievedMeanTissueFlowMlPerSec < 0
            || source.demandTargetFlowMlPerSec <= 0
            || achievedToDemandTargetFlowRatio < 0
            || source.previousResistanceScale <= 0
            || source.nextResistanceScale <= 0
            || source.nextResistanceScale !== completion.toneStep
              .nextToneResistanceScaleByTerritoryLayer[territoryId][layerId]
            || (source.boundedAt !== "minimum"
              && source.boundedAt !== "maximum"
              && source.boundedAt !== "interior")) {
            throw new Error(
              `integrated V2 accepted coronary completion ${territoryId}.${layerId} is invalid`,
            );
          }
          return [layerId, Object.freeze({
            territoryId,
            layerId,
            achievedMeanTissueFlowMlPerSec:
              source.achievedMeanTissueFlowMlPerSec,
            demandTargetFlowMlPerSec: source.demandTargetFlowMlPerSec,
            achievedToDemandTargetFlowRatio,
            previousToneResistanceScale: source.previousResistanceScale,
            nextToneResistanceScale: source.nextResistanceScale,
            deltaLogToneResistanceScale,
            controlSignalLogPerTimeConstant:
              source.controlSignalLogPerTimeConstant,
            boundedAt: source.boundedAt,
          })];
        }),
      ))];
    }),
  )) as CoronaryTerritoryLayerRecordV2<
    MainWireIntegratedModelCoronaryAutoregulationLayerDiagnosticV2
  >;

  return Object.freeze({
    windowIndex: completion.windowIndex,
    windowStartAcceptedTimeSec: completion.windowStartAcceptedTimeSec,
    windowEndAcceptedTimeSec: completion.windowEndAcceptedTimeSec,
    acceptedWindowDurationSec:
      completion.aggregate.acceptedWindowDurationSec,
    acceptedStepCount: completion.acceptedStepCount,
    layerDiagnosticCount: 6 as const,
    byTerritoryLayer,
  });
}

function createMainWireIntegratedModelVerificationFixtureV2() {
  const protocol = MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2;
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
  const runtime = normalAdultMainWireRuntimeV1();
  const pericardium = createMainWireNormalAdultCommonPericardiumV1();
  const generated = createGeneratedPeriodicSinusFiveWallRhythmCalciumOwnerV1(
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    {
      bindingId: "integrated-numerical-verification-generated-sinus-binding-v2",
      generatorConfigId:
        "integrated-numerical-verification-generated-sinus-config-v2",
      generatorInstanceId:
        "integrated-numerical-verification-generated-sinus-instance-v2",
      sourceId: "integrated-numerical-verification-sinus-source-v2",
    },
  );
  const cycleLengthSec = generated.timing.cycleLengthSec;
  if (cycleLengthSec !== protocol.cycleLengthSec) {
    throw new Error("generated rhythm cycle differs from verification protocol");
  }
  if (generated.binding.generatorConfig.sourceMode !== "regular-sinus") {
    throw new Error("verification requires the generated regular-sinus source");
  }
  const rhythm = Object.freeze({ binding: generated.binding });
  const profile = heartMateIiLvadOnlyVerificationProfile();
  const config = mechanicalSupportPresetV1("lvad-hmii-9000");
  const dynamicMechanicalSupport = Object.freeze({
    config,
    heartRateBpm: 60 / cycleLengthSec,
    profile,
  });
  const coronaryStepInput = Object.freeze({
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
  const cold = initializeMainWireIntegratedModelV2({
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
        durationSec: cycleLengthSec,
        interpretation: "periodic-sinus-cycle-aligned" as const,
      }),
    },
    rhythm: {
      ...rhythm,
      acceptedState: generated.acceptedState,
    },
    dynamicMechanicalSupport,
  });
  return Object.freeze({
    provider,
    generated,
    cycleLengthSec,
    rhythm,
    profile,
    config,
    dynamicMechanicalSupport,
    coronaryStepInput,
    cold,
  });
}

function validateTerminalCycleExplorationInput(
  input: MainWireIntegratedModelTerminalCycleExplorationInputV2,
): void {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("terminal-cycle exploration input must be an object");
  }
  const keys = Object.keys(input).sort();
  if (keys.length !== 2 || keys[0] !== "cycleCount"
    || keys[1] !== "nominalDtSec") {
    throw new Error("terminal-cycle exploration input has unexpected fields");
  }
  const bounds =
    MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_EXPLORATION_BOUNDS_V2;
  if (!Number.isInteger(input.cycleCount)
    || input.cycleCount < bounds.minimumCycleCount
    || input.cycleCount > bounds.maximumCycleCount) {
    throw new RangeError(
      `cycleCount must be an integer from ${bounds.minimumCycleCount} through ${bounds.maximumCycleCount}`,
    );
  }
  if (!Number.isFinite(input.nominalDtSec)
    || input.nominalDtSec < bounds.minimumNominalDtSec
    || input.nominalDtSec > bounds.maximumNominalDtSec) {
    throw new RangeError(
      `nominalDtSec must be from ${bounds.minimumNominalDtSec} through ${bounds.maximumNominalDtSec}`,
    );
  }
}

function resolveIntegratedPeriodicOptions(
  options: MainWireIntegratedModelPeriodicSteadyOptionsV2,
): Readonly<{
  nominalDtSec: number;
  maximumCycleCount: number;
  executionPurpose:
    | "canonical-evidence"
    | "bounded-smoke"
    | "fixed-horizon-characterization";
}> {
  if (options === null || typeof options !== "object"
    || Array.isArray(options)) {
    throw new TypeError("integrated periodic options must be an object");
  }
  const allowed = new Set([
    "nominalDtSec",
    "maximumCycleCount",
    "executionPurpose",
  ]);
  if (Object.keys(options).some((key) => !allowed.has(key))) {
    throw new Error("integrated periodic options have unexpected fields");
  }
  const policy = MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V2;
  if (!Number.isFinite(options.nominalDtSec)
    || options.nominalDtSec < policy.minimumNominalDtSec
    || options.nominalDtSec > policy.maximumNominalDtSec) {
    throw new RangeError(
      `nominalDtSec must be from ${policy.minimumNominalDtSec} through ${policy.maximumNominalDtSec}`,
    );
  }
  const executionPurpose = options.executionPurpose ?? "canonical-evidence";
  if (executionPurpose !== "canonical-evidence"
    && executionPurpose !== "bounded-smoke"
    && executionPurpose !== "fixed-horizon-characterization") {
    throw new RangeError("unsupported integrated periodic executionPurpose");
  }
  const maximumCycleCount = options.maximumCycleCount
    ?? (executionPurpose === "bounded-smoke"
      ? policy.boundedSmokeDefaultMaximumCycleCount
      : policy.defaultMaximumCycleCount);
  const maximumAllowed = executionPurpose === "bounded-smoke"
    ? policy.boundedSmokeMaximumCycleCount
    : policy.maximumCycleCount;
  if (!Number.isInteger(maximumCycleCount) || maximumCycleCount < 1
    || maximumCycleCount > maximumAllowed) {
    throw new RangeError(
      `maximumCycleCount must be an integer from 1 through ${maximumAllowed}`,
    );
  }
  return Object.freeze({
    nominalDtSec: options.nominalDtSec,
    maximumCycleCount,
    executionPurpose,
  });
}

function buildTerminalCycleExplorationCycle(
  cycleIndex: number,
  startState: MainWireIntegratedModelAcceptedStateV2<
    MainWireNormalAdultFiveWallMechanicsStateV1
  >,
  run: MainWireIntegratedModelNumericalRunV2,
  fixture: MainWireIntegratedModelVerificationFixtureV2,
): MainWireIntegratedModelTerminalCycleExplorationCycleV2 {
  const sampleCount = run.waveform.sampleCount;
  const ownerSampleCount = run.waveform.lvadPressureFlow
    .constraintOwnerSampleCount;
  const ownerSampleFraction = constraintOwnerRecord((owner) =>
    ownerSampleCount[owner] / sampleCount);
  const limiterOwnedSampleFraction =
    run.waveform.lvadPressureFlow.limiterOwnedSampleCount / sampleCount;
  const closure = buildTerminalCycleClosure(
    startState,
    run.terminalAcceptedState,
    fixture,
  );
  const invariant = run.invariant;
  const tolerance = MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2
    .invariantTolerance;
  const allResidualsFinite = [
    invariant.maximumGlobalTotalBloodVolumeErrorMl,
    invariant.maximumCoronaryBloodVolumeLedgerResidualMl,
    invariant.maximumDynamicMcsConservationResidualMlPerSec,
  ].every(Number.isFinite);
  const conservation = Object.freeze({
    maximumGlobalTotalBloodVolumeErrorMl:
      invariant.maximumGlobalTotalBloodVolumeErrorMl,
    maximumCoronaryBloodVolumeLedgerResidualMl:
      invariant.maximumCoronaryBloodVolumeLedgerResidualMl,
    maximumDynamicMcsConservationResidualMlPerSec:
      invariant.maximumDynamicMcsConservationResidualMlPerSec,
    allResidualsFinite,
    withinExistingConstructionTolerances:
      allResidualsFinite
      && invariant.maximumGlobalTotalBloodVolumeErrorMl
        <= tolerance.globalTotalBloodVolumeErrorMl
      && invariant.maximumCoronaryBloodVolumeLedgerResidualMl
        <= tolerance.coronaryBloodVolumeLedgerResidualMl
      && invariant.maximumDynamicMcsConservationResidualMlPerSec
        <= tolerance.dynamicMcsConservationResidualMlPerSec,
  });
  const allSignalExtremaFinite = Object.values(
    run.waveform.extremaBySignal,
  ).every((extrema) => [
    extrema.minimum,
    extrema.maximum,
    extrema.range,
    extrema.maximumAbsoluteValue,
  ].every(Number.isFinite));
  const acceptedStepBoundRespected = run.acceptedStepCount
    <= MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_EXPLORATION_BOUNDS_V2
      .maximumAcceptedStepCountPerCycle;
  const boundedness = Object.freeze({
    allSignalSamplesFinite: run.waveform.allSamplesFinite,
    allSignalExtremaFinite,
    allClosureDeltasFinite: closure.allReportedDeltasFinite,
    acceptedStepBoundRespected,
    finiteAndStepBounded:
      run.waveform.allSamplesFinite
      && allSignalExtremaFinite
      && closure.allReportedDeltasFinite
      && acceptedStepBoundRespected,
    amplitudeAcceptanceAssessed: false as const,
  });
  return Object.freeze({
    cycleIndex,
    classification:
      MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_EXPLORATION_CLAIM_V2
        .cycleClassification,
    startTimeSec: startState.acceptedTimeSec,
    endTimeSec: run.terminalAcceptedState.acceptedTimeSec,
    acceptedStepCount: run.acceptedStepCount,
    signal: run.signal,
    extremaBySignal: run.waveform.extremaBySignal,
    lvadConstraint: Object.freeze({
      ownerSampleCount,
      ownerSampleFraction: Object.freeze(ownerSampleFraction),
      limiterOwnedSampleCount:
        run.waveform.lvadPressureFlow.limiterOwnedSampleCount,
      limiterOwnedSampleFraction,
    }),
    lvadPressureFlow: Object.freeze({
      signedClosedLoopAreaMmHgMlPerSec:
        run.waveform.lvadPressureFlow.signedClosedLoopAreaMmHgMlPerSec,
      absoluteClosedLoopAreaMmHgMlPerSec:
        run.waveform.lvadPressureFlow.absoluteClosedLoopAreaMmHgMlPerSec,
      flowRangeMlPerSec:
        run.waveform.lvadPressureFlow.flowRangeMlPerSec,
      pressureRiseRangeMmHg:
        run.waveform.lvadPressureFlow.pressureRiseRangeMmHg,
      periodicEndpointClosureClaimed: false as const,
    }),
    closure,
    conservation,
    boundedness,
    scheduler: run.scheduler,
    acceptedEventCount: run.rhythm.acceptedEventIds.length,
  });
}

function buildTerminalCycleClosure(
  start: MainWireIntegratedModelAcceptedStateV2<
    MainWireNormalAdultFiveWallMechanicsStateV1
  >,
  end: MainWireIntegratedModelAcceptedStateV2<
    MainWireNormalAdultFiveWallMechanicsStateV1
  >,
  fixture: MainWireIntegratedModelVerificationFixtureV2,
): MainWireIntegratedModelTerminalCycleClosureV2 {
  const nonCoronaryNodeVolumeDeltaMlByNode = subtractNumericRecords(
    start.coronary.circulation.nodeVolumesMl,
    end.coronary.circulation.nodeVolumesMl,
    "non-coronary node-volume closure",
  );
  const coronaryNodeVolumeDeltaMlByNode = subtractNumericRecords(
    start.coronary.coronary.volumeMlByNode,
    end.coronary.coronary.volumeMlByNode,
    "coronary node-volume closure",
  );
  const dynamicQDeltaMlPerSecByDevice = subtractNumericRecords(
    start.dynamicMechanicalSupport.acceptedFlowMlPerSec,
    end.dynamicMechanicalSupport.acceptedFlowMlPerSec,
    "dynamic MCS q closure",
  ) as Record<RotarySupportDeviceIdV1, number>;
  const coronaryToneScaleDeltaByTerritoryLayer = subtractNestedNumericRecords(
    start.coronary.coronary.toneResistanceScaleByTerritoryLayer,
    end.coronary.coronary.toneResistanceScaleByTerritoryLayer,
    "coronary tone closure",
  );
  const startWindow = start.coronary.coronaryAutoregulation;
  const endWindow = end.coronary.coronaryAutoregulation;
  const generatorConfig = fixture.generated.binding.generatorConfig;
  const startSourcePhase01 = periodicPhase01(
    start.acceptedTimeSec,
    generatorConfig.sourceAnchorTimeSec,
    generatorConfig.sourcePeriodSec,
  );
  const endSourcePhase01 = periodicPhase01(
    end.acceptedTimeSec,
    generatorConfig.sourceAnchorTimeSec,
    generatorConfig.sourcePeriodSec,
  );
  const wrappedSourcePhaseDelta01 = wrappedUnitPhaseDelta(
    startSourcePhase01,
    endSourcePhase01,
  );
  const startGenerator = start.generatedRhythmCalcium.generatorState;
  const endGenerator = end.generatedRhythmCalcium.generatorState;
  const nonCoronaryVolumeDeltas = Object.values(
    nonCoronaryNodeVolumeDeltaMlByNode,
  );
  const coronaryVolumeDeltas = Object.values(
    coronaryNodeVolumeDeltaMlByNode,
  );
  const dynamicQDeltas = Object.values(dynamicQDeltaMlPerSecByDevice);
  const toneDeltas = nestedNumericValues(
    coronaryToneScaleDeltaByTerritoryLayer,
  );
  const scalarDeltas = [
    ...nonCoronaryVolumeDeltas,
    ...coronaryVolumeDeltas,
    ...dynamicQDeltas,
    ...toneDeltas,
    wrappedSourcePhaseDelta01,
    endGenerator.nextSourceIndex - startGenerator.nextSourceIndex,
    endGenerator.nextSourceActivationTimeSec
      - startGenerator.nextSourceActivationTimeSec,
    endWindow.windowIndex - startWindow.windowIndex,
    endWindow.acceptedDurationSec - startWindow.acceptedDurationSec,
  ];
  return Object.freeze({
    nonCoronaryNodeVolumeDeltaMlByNode:
      Object.freeze(nonCoronaryNodeVolumeDeltaMlByNode),
    maximumAbsoluteNonCoronaryNodeVolumeDeltaMl:
      maximumAbsolute(nonCoronaryVolumeDeltas),
    totalNonCoronaryNodeVolumeDeltaMl: sum(nonCoronaryVolumeDeltas),
    coronaryNodeVolumeDeltaMlByNode:
      Object.freeze(coronaryNodeVolumeDeltaMlByNode),
    maximumAbsoluteCoronaryNodeVolumeDeltaMl:
      maximumAbsolute(coronaryVolumeDeltas),
    totalCoronaryNodeVolumeDeltaMl: sum(coronaryVolumeDeltas),
    dynamicQDeltaMlPerSecByDevice:
      Object.freeze(dynamicQDeltaMlPerSecByDevice),
    lvadQDeltaMlPerSec: dynamicQDeltaMlPerSecByDevice.LVAD,
    maximumAbsoluteDynamicQDeltaMlPerSec: maximumAbsolute(dynamicQDeltas),
    coronaryToneScaleDeltaByTerritoryLayer,
    maximumAbsoluteCoronaryToneScaleDelta: maximumAbsolute(toneDeltas),
    coronaryWindow: Object.freeze({
      startWindowIndex: startWindow.windowIndex,
      endWindowIndex: endWindow.windowIndex,
      windowIndexDelta: endWindow.windowIndex - startWindow.windowIndex,
      startAcceptedDurationSec: startWindow.acceptedDurationSec,
      endAcceptedDurationSec: endWindow.acceptedDurationSec,
      acceptedDurationDeltaSec:
        endWindow.acceptedDurationSec - startWindow.acceptedDurationSec,
      startWindowControlPresent: startWindow.windowControl !== null,
      endWindowControlPresent: endWindow.windowControl !== null,
      endWindowIsEmpty:
        endWindow.acceptedDurationSec === 0
        && endWindow.acceptedStepCount === 0
        && endWindow.windowControl === null,
    }),
    rhythmPhase: Object.freeze({
      sourceMode: "regular-sinus" as const,
      phaseComparable: true as const,
      startSourcePhase01,
      endSourcePhase01,
      wrappedSourcePhaseDelta01,
      generatorSourceIndexDelta:
        endGenerator.nextSourceIndex - startGenerator.nextSourceIndex,
      pendingEventCountAtStart: startGenerator.pendingActivationEvents.length,
      pendingEventCountAtEnd: endGenerator.pendingActivationEvents.length,
      nextSourceActivationTimeDeltaSec:
        endGenerator.nextSourceActivationTimeSec
        - startGenerator.nextSourceActivationTimeSec,
    }),
    allReportedDeltasFinite: scalarDeltas.every(Number.isFinite),
  });
}

function compareExploratoryCycles(
  previous: MainWireIntegratedModelTerminalCycleExplorationCycleV2,
  current: MainWireIntegratedModelTerminalCycleExplorationCycleV2,
): MainWireIntegratedModelTerminalCycleChangeV2 {
  const limiterOwnedSampleFractionDelta =
    current.lvadConstraint.limiterOwnedSampleFraction
    - previous.lvadConstraint.limiterOwnedSampleFraction;
  const signedLoopAreaDeltaMmHgMlPerSec =
    current.lvadPressureFlow.signedClosedLoopAreaMmHgMlPerSec
    - previous.lvadPressureFlow.signedClosedLoopAreaMmHgMlPerSec;
  const absoluteLoopAreaDeltaMmHgMlPerSec =
    current.lvadPressureFlow.absoluteClosedLoopAreaMmHgMlPerSec
    - previous.lvadPressureFlow.absoluteClosedLoopAreaMmHgMlPerSec;
  const previousAbsoluteArea =
    previous.lvadPressureFlow.absoluteClosedLoopAreaMmHgMlPerSec;
  const currentAbsoluteArea =
    current.lvadPressureFlow.absoluteClosedLoopAreaMmHgMlPerSec;
  const areaScale = Math.max(previousAbsoluteArea, currentAbsoluteArea);
  const absoluteLoopAreaSymmetricRelativeDelta = areaScale === 0
    ? 0
    : Math.abs(absoluteLoopAreaDeltaMmHgMlPerSec) / areaScale;
  const reportedValues = [
    limiterOwnedSampleFractionDelta,
    Math.abs(limiterOwnedSampleFractionDelta),
    signedLoopAreaDeltaMmHgMlPerSec,
    absoluteLoopAreaDeltaMmHgMlPerSec,
    absoluteLoopAreaSymmetricRelativeDelta,
  ];
  return Object.freeze({
    fromCycleIndex: previous.cycleIndex,
    toCycleIndex: current.cycleIndex,
    limiterOwnedSampleFractionDelta,
    limiterOwnedSampleFractionAbsoluteDelta:
      Math.abs(limiterOwnedSampleFractionDelta),
    limiterFractionDirection: changeDirection(
      limiterOwnedSampleFractionDelta,
    ),
    signedLoopAreaDeltaMmHgMlPerSec,
    absoluteLoopAreaDeltaMmHgMlPerSec,
    absoluteLoopAreaSymmetricRelativeDelta,
    absoluteLoopAreaDirection: changeDirection(
      absoluteLoopAreaDeltaMmHgMlPerSec,
    ),
    allValuesFinite: reportedValues.every(Number.isFinite),
    assessment: "reported-without-stability-threshold" as const,
  });
}

type SignalSnapshotV2 = MainWireIntegratedModelWaveformSampleSignalsV2;

function terminalValveEndpoint(
  valve: Readonly<{
    flowMlPerSec: number;
    state: Readonly<{ leafletOpeningFraction01: number }>;
    openingTarget01: number;
    activeDirection: MainWireQuasiSteadyOrificeValveDirectionV2;
    activeEoaCm2: number;
    forwardActiveEoaCm2: number;
    reverseActiveEoaCm2: number;
  }>,
): MainWireIntegratedModelTerminalValveEndpointV2 {
  return Object.freeze({
    signedFlowMlPerSec: valve.flowMlPerSec,
    leafletOpeningFraction01: valve.state.leafletOpeningFraction01,
    openingTarget01: valve.openingTarget01,
    openingDriveState: valve.openingTarget01 === 0
      ? "zero-opening-target" as const
      : "positive-opening-target" as const,
    activeDirection: valve.activeDirection,
    activeEffectiveOrificeAreaCm2: valve.activeEoaCm2,
    forwardEffectiveOrificeAreaCm2: valve.forwardActiveEoaCm2,
    reverseEffectiveOrificeAreaCm2: valve.reverseActiveEoaCm2,
  });
}

type SignalAccumulatorV2 = Record<SignalIdV2, number>;

type MutableExtremaV2 = Record<SignalIdV2, {
  minimum: number;
  maximum: number;
  maximumAbsoluteValue: number;
}>;

type PressureFlowPointV2 = Readonly<{
  flowMlPerSec: number;
  pressureRiseMmHg: number;
}>;

function signalSnapshot(
  stepped: Extract<
    ReturnType<typeof stepMainWireIntegratedModelV2<
      MainWireNormalAdultFiveWallMechanicsStateV1
    >>,
    { converged: true }
  >,
): SignalSnapshotV2 {
  const circulation = stepped.coronaryStep.baseStep.circulationTrial;
  const coronary = stepped.coronaryStep.baseStep.coronaryTrial.diagnostics
    .hydraulics;
  const lvad = stepped.dynamicMechanicalSupportTrial.pump.LVAD;
  return Object.freeze({
    lvadFlowMlPerSec: lvad.flowMlPerSec,
    lvadPressureRiseMmHg: lvad.pressureRiseRequiredMmHg,
    aorticPressureMmHg: circulation.nodeAbsolutePressuresMmHg.Ao,
    leftVentricularPressureMmHg: circulation.nodeAbsolutePressuresMmHg.LV,
    leftVentricularVolumeMl: circulation.candidateNodeVolumesMl.LV,
    totalCoronaryInletFlowMlPerSec: coronary.totalInletFlowMlPerSec,
    ladSubendocardialQmFlowMlPerSec:
      coronary.layerQmInternalFlowMlPerSecByTerritory.LAD.subendocardial,
  });
}

function emptySignalAccumulator(): SignalAccumulatorV2 {
  return signalRecord(() => 0);
}

function accumulateSignals(
  accumulator: SignalAccumulatorV2,
  signal: SignalSnapshotV2,
  dtSec: number,
): void {
  for (const signalId of SIGNAL_IDS_V2) {
    accumulator[signalId] += signal[signalId] * dtSec;
  }
}

function finalizeSignals(
  integral: SignalAccumulatorV2,
  terminal: SignalSnapshotV2,
  durationSec: number,
): MainWireIntegratedModelVerificationSignalMetricsV2 {
  return Object.freeze({
    meanLvadFlowMlPerSec: integral.lvadFlowMlPerSec / durationSec,
    terminalLvadFlowMlPerSec: terminal.lvadFlowMlPerSec,
    meanLvadPressureRiseMmHg:
      integral.lvadPressureRiseMmHg / durationSec,
    terminalLvadPressureRiseMmHg: terminal.lvadPressureRiseMmHg,
    meanAorticPressureMmHg: integral.aorticPressureMmHg / durationSec,
    terminalAorticPressureMmHg: terminal.aorticPressureMmHg,
    meanLeftVentricularPressureMmHg:
      integral.leftVentricularPressureMmHg / durationSec,
    terminalLeftVentricularPressureMmHg:
      terminal.leftVentricularPressureMmHg,
    meanLeftVentricularVolumeMl:
      integral.leftVentricularVolumeMl / durationSec,
    terminalLeftVentricularVolumeMl: terminal.leftVentricularVolumeMl,
    meanTotalCoronaryInletFlowMlPerSec:
      integral.totalCoronaryInletFlowMlPerSec / durationSec,
    terminalTotalCoronaryInletFlowMlPerSec:
      terminal.totalCoronaryInletFlowMlPerSec,
    meanLadSubendocardialQmFlowMlPerSec:
      integral.ladSubendocardialQmFlowMlPerSec / durationSec,
    terminalLadSubendocardialQmFlowMlPerSec:
      terminal.ladSubendocardialQmFlowMlPerSec,
  });
}

function emptyExtrema(): MutableExtremaV2 {
  return signalRecord(() => ({
    minimum: Number.POSITIVE_INFINITY,
    maximum: Number.NEGATIVE_INFINITY,
    maximumAbsoluteValue: 0,
  }));
}

function updateExtrema(
  extrema: MutableExtremaV2,
  signal: SignalSnapshotV2,
): void {
  for (const signalId of SIGNAL_IDS_V2) {
    const value = signal[signalId];
    extrema[signalId].minimum = Math.min(extrema[signalId].minimum, value);
    extrema[signalId].maximum = Math.max(extrema[signalId].maximum, value);
    extrema[signalId].maximumAbsoluteValue = Math.max(
      extrema[signalId].maximumAbsoluteValue,
      Math.abs(value),
    );
  }
}

function finalizeExtrema(
  extrema: MutableExtremaV2,
): Readonly<Record<SignalIdV2, MainWireIntegratedModelWaveformExtremaV2>> {
  return signalRecord((signalId) => {
    const value = extrema[signalId];
    return Object.freeze({
      minimum: value.minimum,
      maximum: value.maximum,
      range: value.maximum - value.minimum,
      maximumAbsoluteValue: value.maximumAbsoluteValue,
    });
  });
}

function finalizePressureFlowMorphology(
  points: readonly PressureFlowPointV2[],
  extrema: Readonly<Record<
    SignalIdV2,
    MainWireIntegratedModelWaveformExtremaV2
  >>,
  constraintOwnerSampleCount: Readonly<Record<
    DynamicRotaryPumpConstraintOwnerV1,
    number
  >>,
): MainWireIntegratedModelNumericalRunV2["waveform"]["lvadPressureFlow"] {
  const signedClosedLoopAreaMmHgMlPerSec = closedPolygonSignedArea(points);
  const frozenConstraintOwnerSampleCount = Object.freeze({
    ...constraintOwnerSampleCount,
  });
  const limiterOwnedSampleCount = DYNAMIC_ROTARY_CONSTRAINT_OWNERS_V2
    .filter((owner) => owner !== "none")
    .reduce(
      (sum, owner) => sum + frozenConstraintOwnerSampleCount[owner],
      0,
    );
  return Object.freeze({
    nonzeroFlowSampleCount: points.filter(
      (point) => Math.abs(point.flowMlPerSec) > 1e-12,
    ).length,
    maximumAbsoluteFlowMlPerSec:
      extrema.lvadFlowMlPerSec.maximumAbsoluteValue,
    flowRangeMlPerSec: extrema.lvadFlowMlPerSec.range,
    pressureRiseRangeMmHg: extrema.lvadPressureRiseMmHg.range,
    signedClosedLoopAreaMmHgMlPerSec,
    absoluteClosedLoopAreaMmHgMlPerSec:
      Math.abs(signedClosedLoopAreaMmHgMlPerSec),
    constraintOwnerSampleCount: frozenConstraintOwnerSampleCount,
    limiterOwnedSampleCount,
    periodicEndpointClosureClaimed: false as const,
    eligibleForNumericalOrPhysiologicalShapeGate: false as const,
    interpretation:
      MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_CLAIM_V2
        .pumpPressureFlowLoopInterpretation,
  });
}

function closedPolygonSignedArea(
  points: readonly PressureFlowPointV2[],
): number {
  if (points.length < 3) return 0;
  let twiceArea = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]!;
    const next = points[(index + 1) % points.length]!;
    twiceArea += current.flowMlPerSec * next.pressureRiseMmHg
      - next.flowMlPerSec * current.pressureRiseMmHg;
  }
  return twiceArea / 2;
}

function buildComparisonValues(
  signal: MainWireIntegratedModelVerificationSignalMetricsV2,
  extrema: Readonly<Record<
    SignalIdV2,
    MainWireIntegratedModelWaveformExtremaV2
  >>,
  pressureFlow:
    MainWireIntegratedModelNumericalRunV2["waveform"]["lvadPressureFlow"],
): Readonly<Record<ComparisonMetricIdV2, number>> {
  return Object.freeze({
    ...signal,
    maximumAbsoluteLvadFlowMlPerSec:
      pressureFlow.maximumAbsoluteFlowMlPerSec,
    lvadFlowRangeMlPerSec: pressureFlow.flowRangeMlPerSec,
    lvadPressureRiseRangeMmHg: pressureFlow.pressureRiseRangeMmHg,
    aorticPressureRangeMmHg: extrema.aorticPressureMmHg.range,
    leftVentricularPressureRangeMmHg:
      extrema.leftVentricularPressureMmHg.range,
    leftVentricularVolumeRangeMl: extrema.leftVentricularVolumeMl.range,
    totalCoronaryInletFlowRangeMlPerSec:
      extrema.totalCoronaryInletFlowMlPerSec.range,
  });
}

function emptyConstraintOwnerCount(): Record<
  DynamicRotaryPumpConstraintOwnerV1,
  number
> {
  return constraintOwnerRecord(() => 0);
}

function constraintOwnerRecord<T>(
  factory: (owner: DynamicRotaryPumpConstraintOwnerV1) => T,
): Record<DynamicRotaryPumpConstraintOwnerV1, T> {
  return Object.fromEntries(
    DYNAMIC_ROTARY_CONSTRAINT_OWNERS_V2.map((owner) => [
      owner,
      factory(owner),
    ]),
  ) as Record<DynamicRotaryPumpConstraintOwnerV1, T>;
}

function acceptedClock(
  state: MainWireIntegratedModelAcceptedStateV2<
    MainWireNormalAdultFiveWallMechanicsStateV1
  >,
  acceptedStepCount: number,
): MainWireIntegratedModelNumericalRunV2["acceptedClock"] {
  const times = [
    state.acceptedTimeSec,
    state.coronary.acceptedTimeSec,
    state.coronary.circulation.acceptedTimeSec,
    state.coronary.coronary.acceptedTimeSec,
    state.coronary.mechanics.acceptedTimeSec,
    state.generatedRhythmCalcium.acceptedTimeSec,
    state.generatedRhythmCalcium.generatorState.acceptedTimeSec,
  ];
  const revisions = [
    state.revision,
    state.coronary.revision,
    state.coronary.circulation.revision,
    state.coronary.coronary.revision,
    state.coronary.mechanics.revision,
    state.generatedRhythmCalcium.revision,
    state.generatedRhythmCalcium.generatorState.revision,
  ];
  const maximumOwnerClockSkewSec = Math.max(...times) - Math.min(...times);
  return Object.freeze({
    integratedTimeSec: times[0]!,
    coronaryTimeSec: times[1]!,
    circulationTimeSec: times[2]!,
    coronaryHydraulicTimeSec: times[3]!,
    mechanicsTimeSec: times[4]!,
    generatedRhythmCalciumTimeSec: times[5]!,
    generatedRhythmGeneratorTimeSec: times[6]!,
    integratedRevision: revisions[0]!,
    coronaryRevision: revisions[1]!,
    circulationRevision: revisions[2]!,
    coronaryHydraulicRevision: revisions[3]!,
    mechanicsRevision: revisions[4]!,
    generatedRhythmCalciumRevision: revisions[5]!,
    generatedRhythmGeneratorRevision: revisions[6]!,
    maximumOwnerClockSkewSec,
    allOwnerRevisionsMatch:
      revisions.every((revision) => revision === acceptedStepCount),
  });
}

function compareRuns(
  coarse: MainWireIntegratedModelNumericalRunV2,
  fine: MainWireIntegratedModelNumericalRunV2,
): readonly MainWireIntegratedModelCrossDtComparisonV2[] {
  return Object.freeze(
    (Object.keys(
      MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2.comparisonMetric,
    ) as ComparisonMetricIdV2[]).map((metricId) => {
      const policy = MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2
        .comparisonMetric[metricId];
      const coarseValue = coarse.comparisonValues[metricId];
      const fineValue = fine.comparisonValues[metricId];
      const absoluteDelta = Math.abs(coarseValue - fineValue);
      const normalizedDelta = absoluteDelta / policy.normalizationScale;
      const allValuesFinite = Number.isFinite(coarseValue)
        && Number.isFinite(fineValue)
        && Number.isFinite(absoluteDelta)
        && Number.isFinite(normalizedDelta);
      return Object.freeze({
        metricId,
        coarseValue,
        fineValue,
        absoluteDelta,
        normalizationScale: policy.normalizationScale,
        normalizedDelta,
        numericalToleranceNormalized: policy.numericalToleranceNormalized,
        allValuesFinite,
        withinTolerance:
          allValuesFinite
          && normalizedDelta <= policy.numericalToleranceNormalized,
      });
    }),
  );
}

function heartMateIiLvadOnlyVerificationProfile():
DynamicMechanicalSupportInertanceProfileV1 {
  return createDynamicMechanicalSupportInertanceProfileV1({
    profileId:
      "heartmate-ii-lvad-only-r-l-generated-rhythm-verification-not-release-approved",
    profileBindingSha256: "c".repeat(64),
    deviceProfileBindingByDevice: Object.freeze({
      LVAD: verificationBinding(
        "LVAD",
        "heartmate-ii-literature-lvad-only-not-release-approved",
        "1",
      ),
      IMPELLA: verificationBinding(
        "IMPELLA",
        "disabled-impella-zero-inertance-not-a-device-profile",
        "2",
      ),
      VA_ECMO: verificationBinding(
        "VA_ECMO",
        "disabled-va-ecmo-zero-inertance-not-a-device-profile",
        "3",
      ),
      VV_ECMO: verificationBinding(
        "VV_ECMO",
        "disabled-vv-ecmo-zero-inertance-not-a-device-profile",
        "4",
      ),
    }),
    inertanceByDevice: Object.freeze({
      LVAD: HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
      IMPELLA: zeroDisabledCircuitInertance(),
      VA_ECMO: zeroDisabledCircuitInertance(),
      VV_ECMO: zeroDisabledCircuitInertance(),
    }),
  });
}

function verificationBinding(
  deviceId: RotarySupportDeviceIdV1,
  circuitProfileId: string,
  digestDigit: string,
) {
  return createDynamicMechanicalSupportDeviceProfileBindingV1({
    deviceId,
    circuitProfileId,
    circuitProfileBindingSha256: digestDigit.repeat(64),
  });
}

function zeroDisabledCircuitInertance(): DynamicRotaryPumpCircuitInertanceV1 {
  return Object.freeze({
    unitSystemId: DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
    pumpInternalMmHgSec2PerMl: 0,
    drainageMmHgSec2PerMl: 0,
    oxygenatorMmHgSec2PerMl: 0,
    returnPathMmHgSec2PerMl: 0,
  });
}

function totalCircuitInertance(
  inertance: DynamicRotaryPumpCircuitInertanceV1,
): number {
  return inertance.pumpInternalMmHgSec2PerMl
    + inertance.drainageMmHgSec2PerMl
    + inertance.oxygenatorMmHgSec2PerMl
    + inertance.returnPathMmHgSec2PerMl;
}

function signalRecord<T>(factory: (signalId: SignalIdV2) => T):
Record<SignalIdV2, T> {
  return Object.fromEntries(
    SIGNAL_IDS_V2.map((signalId) => [signalId, factory(signalId)]),
  ) as Record<SignalIdV2, T>;
}

function signalIsFinite(signal: SignalSnapshotV2): boolean {
  return SIGNAL_IDS_V2.every((signalId) => Number.isFinite(signal[signalId]));
}

function subtractNumericRecords(
  start: object,
  end: object,
  label: string,
): Record<string, number> {
  const startRecord = start as Record<string, unknown>;
  const endRecord = end as Record<string, unknown>;
  const startKeys = Object.keys(startRecord).sort();
  const endKeys = Object.keys(endRecord).sort();
  if (!arraysEqual(startKeys, endKeys)) {
    throw new Error(`${label} key set changed`);
  }
  return Object.fromEntries(startKeys.map((key) => {
    const startValue = startRecord[key];
    const endValue = endRecord[key];
    if (typeof startValue !== "number" || typeof endValue !== "number") {
      throw new TypeError(`${label}.${key} must contain numbers`);
    }
    return [key, endValue - startValue];
  }));
}

function subtractNestedNumericRecords(
  start: object,
  end: object,
  label: string,
): Readonly<Record<string, Readonly<Record<string, number>>>> {
  const startRecord = start as Record<string, unknown>;
  const endRecord = end as Record<string, unknown>;
  const startKeys = Object.keys(startRecord).sort();
  const endKeys = Object.keys(endRecord).sort();
  if (!arraysEqual(startKeys, endKeys)) {
    throw new Error(`${label} outer key set changed`);
  }
  return Object.freeze(Object.fromEntries(startKeys.map((key) => {
    const startNested = startRecord[key];
    const endNested = endRecord[key];
    if (startNested === null || typeof startNested !== "object"
      || endNested === null || typeof endNested !== "object") {
      throw new TypeError(`${label}.${key} must contain numeric records`);
    }
    return [key, Object.freeze(subtractNumericRecords(
      startNested,
      endNested,
      `${label}.${key}`,
    ))];
  })));
}

function nestedNumericValues(
  value: Readonly<Record<string, Readonly<Record<string, number>>>>,
): number[] {
  return Object.values(value).flatMap((nested) => Object.values(nested));
}

function periodicPhase01(
  timeSec: number,
  anchorTimeSec: number,
  periodSec: number,
): number {
  const elapsed = timeSec - anchorTimeSec;
  return ((elapsed % periodSec) + periodSec) % periodSec / periodSec;
}

function wrappedUnitPhaseDelta(startPhase01: number, endPhase01: number): number {
  const rawDelta = endPhase01 - startPhase01;
  return ((rawDelta + 0.5) % 1 + 1) % 1 - 0.5;
}

function maximumAbsolute(values: readonly number[]): number {
  return values.length === 0
    ? 0
    : Math.max(...values.map((value) => Math.abs(value)));
}

function equalWithinFloatingRoundoff(left: number, right: number): boolean {
  return Math.abs(left - right) <= 64 * Number.EPSILON
    * Math.max(1, Math.abs(left), Math.abs(right));
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function changeDirection(
  delta: number,
): "increase" | "decrease" | "equal" {
  return delta > 0 ? "increase" : delta < 0 ? "decrease" : "equal";
}

function metric(
  normalizationScale: number,
  numericalToleranceNormalized: number,
) {
  return Object.freeze({ normalizationScale, numericalToleranceNormalized });
}

function arraysEqual(
  left: readonly (string | number)[],
  right: readonly (string | number)[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function nestedArraysEqual(
  left: readonly (readonly string[])[],
  right: readonly (readonly string[])[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => arraysEqual(value, right[index] ?? []));
}
