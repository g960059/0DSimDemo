import { NORMAL_CORONARY_DISEASE_INPUT_V2 } from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
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
  checkpointMainWireIntegratedModelV3,
  restoreMainWireIntegratedModelV3,
  type MainWireIntegratedModelCheckpointContextV3,
  type MainWireIntegratedModelCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  evaluateMainWireIntegratedModelCalciumDriveV3,
  initializeMainWireIntegratedModelV3,
  maximumMainWireIntegratedModelStepDurationV3,
  stepMainWireIntegratedModelV3,
  type MainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedModelStepInputV3,
  type MainWireIntegratedModelStepSuccessV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import { FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1 } from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  convertPeriodicBiexponentialToExactEventCalciumV1,
  zeroExactEventCalciumStateV1,
} from "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelNumericalVerificationV2";
import {
  classifyMainWireIntegratedModelPeriodicityV3,
  type MainWireIntegratedModelPeriodicClassificationV3,
  type MainWireIntegratedModelPeriodicCycleObservationV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
  compareMainWireIntegratedModelAcceptedStatesV3,
  type MainWireIntegratedModelPeriodicClosureReportV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import { MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_CIRCULATION_NEWTON_POLICY_V2 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2";
import {
  normalAdultMainWireRuntimeV1,
  type MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import { MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1 } from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import { createMainWireNormalAdultCommonPericardiumV1 } from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import { createCanonicalMainWireNormalAdultFiveWallProviderV1 } from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
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
import { createRegularAtrialSourceConfigurationV1 } from "@/engine/myocardium/rhythm/acceptedRegularAtrialSourceOwnerV1";
import { createAcceptedVentricularBackupSourceConfigurationV2 } from "@/engine/myocardium/rhythm/acceptedVentricularBackupSourceOwnerV2";
import { createAcceptedVentricularIntervalStrengthConfigurationV1 } from "@/engine/myocardium/rhythm/acceptedVentricularIntervalStrengthOwnerV1";
import { createRecoveryConcealmentAvGateParametersV1 } from "@/engine/myocardium/rhythm/recoveryConcealmentAvGateV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";
import {
  MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1,
  type MainWireCycleEvidenceGateV1,
} from "@/engine/scientific/validation/MainWireEvidencePacksV1";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V3_ID =
  "main-wire-integrated-composed-regular-sinus-all-off-periodic-steady-v3" as const;

/** Thresholds, scales, slow-time horizon, and cycle bounds are inherited as-is. */
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 =
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V2;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_CLAIM_V3 = deepFreeze({
  scope:
    "canonical-provider-coronary-v3-accepted-composed-regular-sinus-and-explicit-all-off-zero-inertance-dynamic-MCS" as const,
  dedicatedV3Fixture: true as const,
  activeHeartMateIiBaselineUsed: false as const,
  allFourMcsDevicesDisabled: true as const,
  allFourMcsInertanceCircuitsExplicitAndZero: true as const,
  completeAcceptedStateP1P2Comparator: true as const,
  exactMainV3CheckpointStoredAndRoundTripVerified: true as const,
  terminalCycleTrace:
    "raw-accepted-endpoints-with-event-clipped-dt-no-resampling" as const,
  finiteConservationEventIdentityAndSingleCalciumOwnerFailClosed: true as const,
  unchangedPredeclaredV2ThresholdPolicyReusedByIdentity: true as const,
  maximumHorizon:
    "ten-times-25-second-coronary-controller-time-constant-equals-250-one-second-cycles" as const,
  thresholdsChangedAfterInspectingV3Output: false as const,
  fixedHorizonCharacterizationEvidenceRole: "bounded-exploration-only" as const,
  fixedHorizonCharacterizationCanEstablishCanonicalPeriodicity: false as const,
  healthyReferenceAssessment:
    "reported-only-after-canonical-numerical-P1-eligibility" as const,
  healthyReferenceRole:
    "construction-context-not-independent-validation" as const,
  healthyReferencePassIsPhysiologicalValidation: false as const,
  numericalPeriodicityIsPhysiologicalAcceptance: false as const,
  normalConstructionTargetIsIndependentValidation: false as const,
  patientFittingApplied: false as const,
  waveformOrParameterFittingApplied: false as const,
  clinicalValidationClaimed: false as const,
  releaseAcceptanceClaimed: false as const,
  releaseReadyClaimed: false as const,
});

export type MainWireIntegratedModelPeriodicExecutionPurposeV3 =
  "canonical-evidence" | "bounded-smoke" | "fixed-horizon-characterization";

export type MainWireIntegratedModelPeriodicSteadyOptionsV3 = Readonly<{
  nominalDtSec: number;
  maximumCycleCount?: number;
  executionPurpose?: MainWireIntegratedModelPeriodicExecutionPurposeV3;
}>;

export type MainWireIntegratedModelPeriodicTerminalTraceSampleV3 = Readonly<{
  cycleIndex: number;
  acceptedStepIndexWithinCycle: number;
  acceptedTimeSec: number;
  cyclePhase01: number;
  acceptedDtSec: number;
  chamberVolumeMl: Readonly<{ LA: number; LV: number; RA: number; RV: number }>;
  absolutePressureMmHg: Readonly<{
    LA: number;
    LV: number;
    RA: number;
    RV: number;
    Ao: number;
    PA: number;
    PVein: number;
  }>;
  valveFlowMlPerSec: Readonly<{
    MV: number;
    AoV: number;
    TV: number;
    PV: number;
  }>;
  coronary: Readonly<{
    totalInletFlowMlPerSec: number;
    ladSubendocardialQmFlowMlPerSec: number;
  }>;
  freeCalciumUMByWall: Readonly<{
    LA: number;
    LVFW: number;
    SEP: number;
    RVFW: number;
    RA: number;
  }>;
  dynamicMcsAcceptedFlowMlPerSec: Readonly<
    Record<RotarySupportDeviceIdV1, number>
  >;
  acceptedEventIdentity: Readonly<{
    atrialCapturedActivationId: string | null;
    ventricularCapturedActivationId: string | null;
    deliveredCalciumDepositIds: readonly string[];
    scheduledCalciumDepositIds: readonly string[];
  }>;
  diagnostics: Readonly<{
    mechanicsResidualNorm: number;
    circulationScaledResidualInfinityNorm: number;
    maximumContinuityResidualMl: number;
    totalBloodVolumeErrorMl: number;
    coronaryBloodVolumeLedgerResidualMl: number;
    dynamicMcsConservationResidualMlPerSec: number;
  }>;
}>;

export type MainWireIntegratedModelPeriodicTerminalCycleTraceV3 = Readonly<{
  cycleIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  sampleCount: number;
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
  retainedForGraphShapeInspection: true;
  resamplingApplied: false;
  shapeAcceptanceClaimed: false;
  interpretation: "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance";
}>;

export type MainWireIntegratedModelHealthyReferenceProjectionV3 = Readonly<{
  projectionId: "main-wire-integrated-v3-terminal-cycle-healthy-reference-projection-v1";
  referencePackId: typeof MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.packId;
  referenceBodySurfaceAreaM2: number;
  referenceBodySurfaceAreaProvenance: "MainWireEvidencePacksV1.fixed-resting-adult-research-reference";
  metric: Readonly<{
    lvEndDiastolicVolumeMl: number;
    lvEndSystolicVolumeMl: number;
    lvEndDiastolicVolumeIndexMlPerM2: number;
    lvEndSystolicVolumeIndexMlPerM2: number;
    lvEjectionFraction01: number;
    nativeAorticForwardVolumeMl: number;
    nativeAorticCardiacOutputLPerMin: number;
    nativeAorticCardiacIndexLPerMinPerM2: number;
    pulmonaryArterySystolicPressureMmHg: number;
    leftAtrialTimeWeightedMeanPressureMmHg: number;
  }>;
  assessmentEligibility: Readonly<{
    eligible: boolean;
    requirement: "canonical-evidence-and-numerical-period1-converged";
    numericalPeriod1Established: boolean;
    executionPurpose: MainWireIntegratedModelPeriodicExecutionPurposeV3;
  }>;
  gateResults: readonly Readonly<{
    gateId: string;
    metricId: string;
    value: number;
    lowerInclusive: number | null;
    upperInclusive: number | null;
    status: "pass" | "fail" | "not-assessed";
    sourceIds: readonly string[];
  }>[];
  comparisonRole: "construction-context-not-independent-validation";
  physiologyValidated: false;
  clinicalValidationClaimed: false;
}>;

export type MainWireIntegratedModelPeriodicSteadyCycleV3 = Readonly<{
  cycleIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  acceptedStepCount: number;
  coronaryAutoregulationWindow: Readonly<{
    windowIndex: number;
    startTimeSec: number;
    endTimeSec: number;
    acceptedDurationSec: number;
    acceptedStepCount: number;
  }>;
  period1: MainWireIntegratedModelPeriodicClosureReportV3;
  period2: MainWireIntegratedModelPeriodicClosureReportV3 | null;
  period1MaximumNormalizedDelta: number;
  period2MaximumNormalizedDelta: number | null;
  worstPeriod1Group: string;
  worstPeriod1Path: string;
  acceptedAtrialCaptureIds: readonly string[];
  acceptedVentricularCaptureIds: readonly string[];
  deliveredCalciumDepositIds: readonly string[];
  conservation: Readonly<{
    maximumGlobalTotalBloodVolumeErrorMl: number;
    maximumCoronaryBloodVolumeLedgerResidualMl: number;
    maximumDynamicMcsConservationResidualMlPerSec: number;
    withinInheritedConstructionTolerances: boolean;
  }>;
  finiteAndEventIdentityChecks: Readonly<{
    allRawValuesFinite: boolean;
    exactlyOneAtrialCapture: boolean;
    exactlyOneVentricularCapture: boolean;
    exactlyTwoDeliveredCalciumDeposits: boolean;
    oneComposedCalciumOwnerOnly: boolean;
    allDynamicMcsAcceptedFlowsExactlyZero: boolean;
    passed: boolean;
  }>;
  rawHealthyMetrics: MainWireIntegratedModelHealthyReferenceProjectionV3["metric"];
}>;

export type MainWireIntegratedModelPeriodicSteadyResultV3 = Readonly<{
  experimentId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V3_ID;
  executionPurpose: MainWireIntegratedModelPeriodicExecutionPurposeV3;
  protocolIdentityHash: string;
  nominalDtSec: number;
  cycleLengthSec: number;
  requestedMaximumCycleCount: number;
  completedCycleCount: number;
  terminationReason:
    "period1-converged" | "period2-suspect" | "maximum-cycles-reached";
  classification: MainWireIntegratedModelPeriodicClassificationV3;
  numericalPeriod1Established: boolean;
  period2OrbitSuspected: boolean;
  requestedHorizonCompleted: boolean;
  earlyClassificationStopEligible: boolean;
  allCyclesFiniteConservedAndEventExact: boolean;
  physiologicalAcceptanceEstablished: false;
  independentValidationEstablished: false;
  releaseAcceptanceEstablished: false;
  cycles: readonly MainWireIntegratedModelPeriodicSteadyCycleV3[];
  observations: readonly MainWireIntegratedModelPeriodicCycleObservationV3[];
  terminalCycleTrace: MainWireIntegratedModelPeriodicTerminalCycleTraceV3;
  terminalHealthyReferenceProjection: MainWireIntegratedModelHealthyReferenceProjectionV3;
  terminalAcceptedState: MainWireIntegratedModelAcceptedStateV3<MainWireNormalAdultFiveWallMechanicsStateV1>;
  terminalCheckpoint: MainWireIntegratedModelCheckpointV3;
  terminalCheckpointExactRoundTripVerified: true;
  policy: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3;
  claim: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_CLAIM_V3;
}>;

/**
 * Protocol-neutral numerical result used by preregistered mechanism
 * attribution experiments.  It deliberately carries no canonical experiment
 * id, healthy-reference assessment, or physiological claim.
 */
export type MainWireIntegratedModelPeriodicKernelResultV3 = Readonly<{
  protocolIdentityHash: string;
  nominalDtSec: number;
  cycleLengthSec: number;
  requestedMaximumCycleCount: number;
  completedCycleCount: number;
  terminationReason:
    "period1-converged" | "period2-suspect" | "maximum-cycles-reached";
  classification: MainWireIntegratedModelPeriodicClassificationV3;
  requestedHorizonCompleted: boolean;
  allCyclesFiniteConservedAndEventExact: boolean;
  cycles: readonly MainWireIntegratedModelPeriodicSteadyCycleV3[];
  observations: readonly MainWireIntegratedModelPeriodicCycleObservationV3[];
  terminalCycleTrace: MainWireIntegratedModelPeriodicTerminalCycleTraceV3;
  terminalAcceptedState: MainWireIntegratedModelAcceptedStateV3<MainWireNormalAdultFiveWallMechanicsStateV1>;
  terminalCheckpoint: MainWireIntegratedModelCheckpointV3;
  terminalCheckpointExactRoundTripVerified: true;
}>;

export type MainWireIntegratedModelPeriodicKernelOptionsV3 = Readonly<{
  protocolIdentityHash: string;
  nominalDtSec: number;
  maximumCycleCount: number;
  stopAfterClassification: boolean;
  evidenceRole: MainWireIntegratedModelPeriodicCycleObservationV3["evidenceRole"];
}>;

type Provider = ReturnType<
  typeof createCanonicalMainWireNormalAdultFiveWallProviderV1
>;
type WallState = MainWireNormalAdultFiveWallMechanicsStateV1;
type AcceptedState = MainWireIntegratedModelAcceptedStateV3<WallState>;
type SuccessfulStep = MainWireIntegratedModelStepSuccessV3<WallState>;

export function createMainWireIntegratedModelRegularSinusAllOffFixtureForGlobalBloodVolumeV3(
  fixedGlobalTotalBloodVolumeMl: number,
) {
  if (
    !Number.isFinite(fixedGlobalTotalBloodVolumeMl) ||
    fixedGlobalTotalBloodVolumeMl <= 0
  ) {
    throw new RangeError(
      "V3 fixture global total blood volume must be positive and finite",
    );
  }
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
  const runtime = normalAdultMainWireRuntimeV1();
  const pericardium = createMainWireNormalAdultCommonPericardiumV1();
  const rhythm = createRegularSinusComposedRhythmV3();
  const profile = createAllOffZeroInertanceProfileV3();
  const config = createMechanicalSupportConfigV1();
  assertAllOffConfig(config);
  const dynamicMechanicalSupport = Object.freeze({
    config,
    heartRateBpm: 60,
    profile,
  });
  const coronaryStepInput = Object.freeze({
    runtime,
    calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    pericardium,
    coronaryPrior: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
    coronaryDisease: NORMAL_CORONARY_DISEASE_INPUT_V2,
    collapseHydraulics: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
    impMechanism: "cep-shortening-induced" as const,
    shorteningImpPrior: NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
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
      shorteningImpPrior: NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
      fixedGlobalTotalBloodVolumeMl,
      autoregulationWindow: Object.freeze({
        durationSec: 1,
        interpretation: "periodic-sinus-cycle-aligned" as const,
      }),
    },
    rhythm: {
      configuration: rhythm.configuration,
      acceptedState: rhythm.state,
    },
    dynamicMechanicalSupport,
  });
  assertAllOffAcceptedQ(cold.acceptedState);
  return Object.freeze({
    provider,
    runtime,
    pericardium,
    rhythm,
    profile,
    config,
    dynamicMechanicalSupport,
    coronaryStepInput,
    cycleLengthSec: 1 as const,
    cold,
  });
}

export function createMainWireIntegratedModelRegularSinusAllOffFixtureV3() {
  return createMainWireIntegratedModelRegularSinusAllOffFixtureForGlobalBloodVolumeV3(
    MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1.fullGraphReferenceTotalBloodVolumeMl,
  );
}

export type MainWireIntegratedModelRegularSinusAllOffFixtureV3 = ReturnType<
  typeof createMainWireIntegratedModelRegularSinusAllOffFixtureForGlobalBloodVolumeV3
>;

export function mainWireIntegratedModelPeriodicFixtureIdentityV3(
  fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
) {
  return deepFreeze({
    provider: providerIdentity(fixture.provider),
    composedRhythmConfiguration: fixture.rhythm.configuration,
    dynamicMechanicalSupportProfile: fixture.profile,
    dynamicMechanicalSupportConfig: fixture.config,
    coronaryStepInput: fixture.coronaryStepInput,
  });
}

export async function runMainWireIntegratedModelPeriodicSteadyV3(
  options: MainWireIntegratedModelPeriodicSteadyOptionsV3,
): Promise<MainWireIntegratedModelPeriodicSteadyResultV3> {
  const resolved = resolveOptions(options);
  const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
  const protocolIdentityHash = await sha256CanonicalJsonHex(
    Object.freeze({
      experimentId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V3_ID,
      executionPurpose: resolved.executionPurpose,
      nominalDtSec: resolved.nominalDtSec,
      maximumCycleCount: resolved.maximumCycleCount,
      inheritedPolicy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
      inheritedReferenceScales:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
      provider: providerIdentity(fixture.provider),
      composedRhythmConfiguration: fixture.rhythm.configuration,
      dynamicMechanicalSupportProfile: fixture.profile,
      dynamicMechanicalSupportConfig: fixture.config,
      coronaryStepInput: fixture.coronaryStepInput,
    }),
  );
  const earlyClassificationStopEligible =
    resolved.executionPurpose !== "fixed-horizon-characterization";
  const kernel = await runMainWireIntegratedModelPeriodicKernelV3(fixture, {
    protocolIdentityHash,
    nominalDtSec: resolved.nominalDtSec,
    maximumCycleCount: resolved.maximumCycleCount,
    stopAfterClassification: earlyClassificationStopEligible,
    evidenceRole:
      resolved.executionPurpose === "canonical-evidence"
        ? "canonical-periodic-protocol"
        : "bounded-exploration-only",
  });
  const canonicalPeriod1 =
    resolved.executionPurpose === "canonical-evidence" &&
    kernel.classification.status === "period1-converged";
  const terminalHealthyReferenceProjection = healthyReferenceProjection(
    kernel.terminalCycleTrace,
    resolved.executionPurpose,
    canonicalPeriod1,
  );
  return deepFreeze({
    experimentId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V3_ID,
    executionPurpose: resolved.executionPurpose,
    protocolIdentityHash: kernel.protocolIdentityHash,
    nominalDtSec: kernel.nominalDtSec,
    cycleLengthSec: kernel.cycleLengthSec,
    requestedMaximumCycleCount: kernel.requestedMaximumCycleCount,
    completedCycleCount: kernel.completedCycleCount,
    terminationReason: kernel.terminationReason,
    classification: kernel.classification,
    numericalPeriod1Established: canonicalPeriod1,
    period2OrbitSuspected:
      resolved.executionPurpose === "canonical-evidence" &&
      kernel.classification.status === "period2-suspect",
    requestedHorizonCompleted: kernel.requestedHorizonCompleted,
    earlyClassificationStopEligible,
    allCyclesFiniteConservedAndEventExact:
      kernel.allCyclesFiniteConservedAndEventExact,
    physiologicalAcceptanceEstablished: false as const,
    independentValidationEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
    cycles: kernel.cycles,
    observations: kernel.observations,
    terminalCycleTrace: kernel.terminalCycleTrace,
    terminalHealthyReferenceProjection,
    terminalAcceptedState: kernel.terminalAcceptedState,
    terminalCheckpoint: kernel.terminalCheckpoint,
    terminalCheckpointExactRoundTripVerified:
      kernel.terminalCheckpointExactRoundTripVerified,
    policy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
    claim: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_CLAIM_V3,
  });
}

export async function runMainWireIntegratedModelPeriodicKernelV3(
  fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  options: MainWireIntegratedModelPeriodicKernelOptionsV3,
): Promise<MainWireIntegratedModelPeriodicKernelResultV3> {
  validateKernelOptions(options);
  const classifierOptions = Object.freeze({
    period1NormalizedTolerance:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period1NormalizedTolerance,
    period2NormalizedTolerance:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period2NormalizedTolerance,
    period2MinimumPeriod1NormalizedDelta:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period2MinimumPeriod1NormalizedDelta,
    consecutiveCycles:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.consecutiveCycles,
  });
  let accepted = fixture.cold.acceptedState;
  const boundaries: AcceptedState[] = [accepted];
  const observations: MainWireIntegratedModelPeriodicCycleObservationV3[] = [];
  const cycles: MainWireIntegratedModelPeriodicSteadyCycleV3[] = [];
  let classification = classifyMainWireIntegratedModelPeriodicityV3(
    observations,
    classifierOptions,
  );
  let terminalTraceSamples: MainWireIntegratedModelPeriodicTerminalTraceSampleV3[] =
    [];
  const allAtrialCaptureIds = new Set<string>();
  const allVentricularCaptureIds = new Set<string>();
  const allDepositIds = new Set<string>();

  for (
    let zeroBasedCycleIndex = 0;
    zeroBasedCycleIndex < options.maximumCycleCount;
    zeroBasedCycleIndex += 1
  ) {
    const start = accepted;
    const run = runOneCycle(
      fixture,
      start,
      zeroBasedCycleIndex,
      options.nominalDtSec,
    );
    accepted = run.terminalAcceptedState;
    rejectDuplicateIds(
      allAtrialCaptureIds,
      run.acceptedAtrialCaptureIds,
      "atrial capture",
    );
    rejectDuplicateIds(
      allVentricularCaptureIds,
      run.acceptedVentricularCaptureIds,
      "ventricular capture",
    );
    rejectDuplicateIds(
      allDepositIds,
      run.deliveredCalciumDepositIds,
      "calcium deposit",
    );
    const previous = boundaries.at(-1)!;
    const twoBack = boundaries.length >= 2 ? boundaries.at(-2)! : null;
    const period1 = compareMainWireIntegratedModelAcceptedStatesV3(
      accepted,
      previous,
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
      fixture.config,
    );
    const period2 =
      twoBack === null
        ? null
        : compareMainWireIntegratedModelAcceptedStatesV3(
            accepted,
            twoBack,
            MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
            fixture.config,
          );
    const cycleIndex = zeroBasedCycleIndex + 1;
    observations.push(
      Object.freeze({
        cycleIndex,
        evidenceRole: options.evidenceRole,
        protocolIdentityHash: options.protocolIdentityHash,
        period1,
        period2,
      }),
    );
    classification = classifyMainWireIntegratedModelPeriodicityV3(
      observations,
      classifierOptions,
    );
    cycles.push(buildCycleSummary(cycleIndex, run, period1, period2));
    terminalTraceSamples = [...run.traceSamples];
    boundaries.push(accepted);
    if (boundaries.length > 3) boundaries.shift();
    if (
      options.stopAfterClassification &&
      classification.status !== "not-converged"
    ) {
      break;
    }
  }

  const terminalCycle = cycles.at(-1);
  if (
    terminalCycle === undefined ||
    terminalTraceSamples.length !== terminalCycle.acceptedStepCount
  ) {
    throw new Error("V3 periodic experiment lacks a complete terminal trace");
  }
  const terminalCycleTrace = deepFreeze({
    cycleIndex: terminalCycle.cycleIndex,
    startTimeSec: terminalCycle.startTimeSec,
    endTimeSec: terminalCycle.endTimeSec,
    sampleCount: terminalTraceSamples.length,
    samples: terminalTraceSamples,
    retainedForGraphShapeInspection: true as const,
    resamplingApplied: false as const,
    shapeAcceptanceClaimed: false as const,
    interpretation:
      "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance" as const,
  });
  const checkpointContext = createCheckpointContext(fixture, accepted);
  const terminalCheckpoint = await checkpointMainWireIntegratedModelV3(
    checkpointContext,
    accepted,
  );
  const restored = await restoreMainWireIntegratedModelV3(
    checkpointContext,
    JSON.parse(canonicalJsonStringify(terminalCheckpoint)),
  );
  const restoredCheckpoint = await checkpointMainWireIntegratedModelV3(
    checkpointContext,
    restored,
  );
  if (
    canonicalJsonStringify(restoredCheckpoint) !==
    canonicalJsonStringify(terminalCheckpoint)
  ) {
    throw new Error("V3 periodic terminal checkpoint exact round-trip differs");
  }
  const terminationReason =
    classification.status === "period1-converged"
      ? ("period1-converged" as const)
      : classification.status === "period2-suspect"
        ? ("period2-suspect" as const)
        : ("maximum-cycles-reached" as const);
  return deepFreeze({
    protocolIdentityHash: options.protocolIdentityHash,
    nominalDtSec: options.nominalDtSec,
    cycleLengthSec: fixture.cycleLengthSec,
    requestedMaximumCycleCount: options.maximumCycleCount,
    completedCycleCount: cycles.length,
    terminationReason,
    classification,
    requestedHorizonCompleted: cycles.length === options.maximumCycleCount,
    allCyclesFiniteConservedAndEventExact: cycles.every(
      (cycle) =>
        cycle.conservation.withinInheritedConstructionTolerances &&
        cycle.finiteAndEventIdentityChecks.passed,
    ),
    cycles,
    observations,
    terminalCycleTrace,
    terminalAcceptedState: accepted,
    terminalCheckpoint,
    terminalCheckpointExactRoundTripVerified: true as const,
  });
}

type CycleRun = Readonly<{
  startTimeSec: number;
  endTimeSec: number;
  acceptedStepCount: number;
  terminalAcceptedState: AcceptedState;
  traceSamples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
  coronaryAutoregulationWindow: MainWireIntegratedModelPeriodicSteadyCycleV3["coronaryAutoregulationWindow"];
  acceptedAtrialCaptureIds: readonly string[];
  acceptedVentricularCaptureIds: readonly string[];
  deliveredCalciumDepositIds: readonly string[];
  maximumGlobalTotalBloodVolumeErrorMl: number;
  maximumCoronaryBloodVolumeLedgerResidualMl: number;
  maximumDynamicMcsConservationResidualMlPerSec: number;
  allRawValuesFinite: boolean;
  oneComposedCalciumOwnerOnly: boolean;
  allDynamicMcsAcceptedFlowsExactlyZero: boolean;
}>;

function runOneCycle(
  fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  initial: AcceptedState,
  zeroBasedCycleIndex: number,
  nominalDtSec: number,
): CycleRun {
  const startTimeSec = zeroBasedCycleIndex * fixture.cycleLengthSec;
  const endTimeSec = startTimeSec + fixture.cycleLengthSec;
  if (initial.acceptedTimeSec !== startTimeSec) {
    throw new Error(
      "V3 periodic continuation does not start on cycle boundary",
    );
  }
  let accepted = initial;
  let acceptedStepCount = 0;
  let nominalGridIndex = 1;
  let maximumGlobalTotalBloodVolumeErrorMl = 0;
  let maximumCoronaryBloodVolumeLedgerResidualMl = 0;
  let maximumDynamicMcsConservationResidualMlPerSec = 0;
  let oneComposedCalciumOwnerOnly = true;
  let allRawValuesFinite = true;
  let allDynamicMcsAcceptedFlowsExactlyZero = true;
  const traceSamples: MainWireIntegratedModelPeriodicTerminalTraceSampleV3[] =
    [];
  const acceptedAtrialCaptureIds: string[] = [];
  const acceptedVentricularCaptureIds: string[] = [];
  const deliveredCalciumDepositIds: string[] = [];
  const completions: MainWireIntegratedModelPeriodicSteadyCycleV3["coronaryAutoregulationWindow"][] =
    [];

  while (accepted.acceptedTimeSec < endTimeSec) {
    if (
      acceptedStepCount >=
      MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2.maximumAcceptedStepCountPerRun
    ) {
      throw new Error(
        "V3 periodic cycle exceeded inherited accepted-step bound",
      );
    }
    const nominalTargetTimeSec = Math.min(
      endTimeSec,
      startTimeSec + nominalGridIndex * nominalDtSec,
    );
    const requestedStepSec = nominalTargetTimeSec - accepted.acceptedTimeSec;
    if (!(requestedStepSec > 0)) {
      nominalGridIndex += 1;
      continue;
    }
    const maximum = maximumMainWireIntegratedModelStepDurationV3(
      accepted,
      requestedStepSec,
      {
        configuration: fixture.rhythm.configuration,
        externalAfNextBoundaryTimeSec: null,
      },
      fixture.profile,
      fixture.config,
    );
    if (
      !(maximum.maximumStepSec > 0) ||
      maximum.maximumStepSec > requestedStepSec + 1e-14
    ) {
      throw new Error("V3 periodic scheduler returned an invalid step");
    }
    const stepped = stepMainWireIntegratedModelV3(
      fixture.provider,
      accepted,
      stepInput(fixture, maximum.maximumStepSec),
    );
    if (stepped.converged === false) {
      throw new Error(
        `V3 periodic step failed at ${accepted.acceptedTimeSec}s: ${stepped.message}`,
      );
    }
    accepted = stepped.acceptedState;
    acceptedStepCount += 1;
    if (Math.abs(accepted.acceptedTimeSec - nominalTargetTimeSec) <= 1e-14) {
      nominalGridIndex += 1;
    }
    if (stepped.coronaryStep.autoregulationWindowCompleted) {
      const completion = stepped.coronaryStep.autoregulationCompletion;
      if (completion === null) {
        throw new Error("V3 coronary completion flag lacks completion state");
      }
      completions.push(
        Object.freeze({
          windowIndex: completion.windowIndex,
          startTimeSec: completion.windowStartAcceptedTimeSec,
          endTimeSec: completion.windowEndAcceptedTimeSec,
          acceptedDurationSec: completion.aggregate.acceptedWindowDurationSec,
          acceptedStepCount: completion.acceptedStepCount,
        }),
      );
    }
    const expectedCalcium = evaluateMainWireIntegratedModelCalciumDriveV3(
      accepted.composedRhythm,
    );
    oneComposedCalciumOwnerOnly =
      oneComposedCalciumOwnerOnly &&
      canonicalJsonStringify(expectedCalcium) ===
        canonicalJsonStringify(stepped.calciumDrive) &&
      canonicalJsonStringify(stepped.coronaryStep.baseStep.calciumDrive) ===
        canonicalJsonStringify(stepped.calciumDrive) &&
      !("generatedRhythmCalcium" in accepted) &&
      !("rhythmCalcium" in accepted) &&
      !("fixedPeriodicCalcium" in accepted);
    assertAllOffAcceptedQ(accepted);
    allDynamicMcsAcceptedFlowsExactlyZero =
      allDynamicMcsAcceptedFlowsExactlyZero &&
      Object.values(
        accepted.dynamicMechanicalSupport.acceptedFlowMlPerSec,
      ).every((value) => value === 0);
    const candidate = stepped.composedRhythmCandidate;
    if (candidate.capturedAtrialActivation !== null) {
      acceptedAtrialCaptureIds.push(
        candidate.capturedAtrialActivation.capturedActivationId,
      );
    }
    if (candidate.capturedVentricularActivation !== null) {
      acceptedVentricularCaptureIds.push(
        candidate.capturedVentricularActivation.capturedActivationId,
      );
    }
    deliveredCalciumDepositIds.push(
      ...candidate.deliveredCalciumDeposits.map((deposit) => deposit.depositId),
    );
    const sample = traceSample(
      zeroBasedCycleIndex + 1,
      acceptedStepCount,
      startTimeSec,
      fixture.cycleLengthSec,
      maximum.maximumStepSec,
      stepped,
    );
    traceSamples.push(sample);
    allRawValuesFinite = allRawValuesFinite && allNumericLeavesFinite(sample);
    maximumGlobalTotalBloodVolumeErrorMl = Math.max(
      maximumGlobalTotalBloodVolumeErrorMl,
      Math.abs(sample.diagnostics.totalBloodVolumeErrorMl),
    );
    maximumCoronaryBloodVolumeLedgerResidualMl = Math.max(
      maximumCoronaryBloodVolumeLedgerResidualMl,
      Math.abs(sample.diagnostics.coronaryBloodVolumeLedgerResidualMl),
    );
    maximumDynamicMcsConservationResidualMlPerSec = Math.max(
      maximumDynamicMcsConservationResidualMlPerSec,
      Math.abs(sample.diagnostics.dynamicMcsConservationResidualMlPerSec),
    );
  }
  if (
    accepted.acceptedTimeSec !== endTimeSec ||
    completions.length !== 1 ||
    completions[0]!.windowIndex !== zeroBasedCycleIndex ||
    completions[0]!.startTimeSec !== startTimeSec ||
    completions[0]!.endTimeSec !== endTimeSec ||
    !nearlyEqual(completions[0]!.acceptedDurationSec, fixture.cycleLengthSec)
  ) {
    throw new Error("V3 periodic cycle/coronary window boundary differs");
  }
  if (!oneComposedCalciumOwnerOnly) {
    throw new Error("V3 periodic cycle detected split calcium ownership");
  }
  if (!allRawValuesFinite) {
    throw new Error("V3 periodic cycle contains nonfinite raw values");
  }
  if (!allDynamicMcsAcceptedFlowsExactlyZero) {
    throw new Error("V3 all-off periodic cycle produced nonzero MCS q");
  }
  if (
    acceptedAtrialCaptureIds.length !== 1 ||
    acceptedVentricularCaptureIds.length !== 1 ||
    deliveredCalciumDepositIds.length !== 2
  ) {
    throw new Error("V3 regular-sinus cycle event identity count differs");
  }
  const tolerance =
    MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2.invariantTolerance;
  if (
    maximumGlobalTotalBloodVolumeErrorMl >
      tolerance.globalTotalBloodVolumeErrorMl ||
    maximumCoronaryBloodVolumeLedgerResidualMl >
      tolerance.coronaryBloodVolumeLedgerResidualMl ||
    maximumDynamicMcsConservationResidualMlPerSec >
      tolerance.dynamicMcsConservationResidualMlPerSec
  ) {
    throw new Error(
      "V3 periodic cycle exceeds inherited conservation tolerance",
    );
  }
  return deepFreeze({
    startTimeSec,
    endTimeSec,
    acceptedStepCount,
    terminalAcceptedState: accepted,
    traceSamples,
    coronaryAutoregulationWindow: completions[0]!,
    acceptedAtrialCaptureIds,
    acceptedVentricularCaptureIds,
    deliveredCalciumDepositIds,
    maximumGlobalTotalBloodVolumeErrorMl,
    maximumCoronaryBloodVolumeLedgerResidualMl,
    maximumDynamicMcsConservationResidualMlPerSec,
    allRawValuesFinite,
    oneComposedCalciumOwnerOnly,
    allDynamicMcsAcceptedFlowsExactlyZero,
  });
}

function buildCycleSummary(
  cycleIndex: number,
  run: CycleRun,
  period1: MainWireIntegratedModelPeriodicClosureReportV3,
  period2: MainWireIntegratedModelPeriodicClosureReportV3 | null,
): MainWireIntegratedModelPeriodicSteadyCycleV3 {
  const tolerance =
    MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2.invariantTolerance;
  const conservation = Object.freeze({
    maximumGlobalTotalBloodVolumeErrorMl:
      run.maximumGlobalTotalBloodVolumeErrorMl,
    maximumCoronaryBloodVolumeLedgerResidualMl:
      run.maximumCoronaryBloodVolumeLedgerResidualMl,
    maximumDynamicMcsConservationResidualMlPerSec:
      run.maximumDynamicMcsConservationResidualMlPerSec,
    withinInheritedConstructionTolerances:
      run.maximumGlobalTotalBloodVolumeErrorMl <=
        tolerance.globalTotalBloodVolumeErrorMl &&
      run.maximumCoronaryBloodVolumeLedgerResidualMl <=
        tolerance.coronaryBloodVolumeLedgerResidualMl &&
      run.maximumDynamicMcsConservationResidualMlPerSec <=
        tolerance.dynamicMcsConservationResidualMlPerSec,
  });
  const finiteAndEventIdentityChecks = Object.freeze({
    allRawValuesFinite: run.allRawValuesFinite,
    exactlyOneAtrialCapture: run.acceptedAtrialCaptureIds.length === 1,
    exactlyOneVentricularCapture:
      run.acceptedVentricularCaptureIds.length === 1,
    exactlyTwoDeliveredCalciumDeposits:
      run.deliveredCalciumDepositIds.length === 2,
    oneComposedCalciumOwnerOnly: run.oneComposedCalciumOwnerOnly,
    allDynamicMcsAcceptedFlowsExactlyZero:
      run.allDynamicMcsAcceptedFlowsExactlyZero,
    passed:
      run.allRawValuesFinite &&
      run.acceptedAtrialCaptureIds.length === 1 &&
      run.acceptedVentricularCaptureIds.length === 1 &&
      run.deliveredCalciumDepositIds.length === 2 &&
      run.oneComposedCalciumOwnerOnly &&
      run.allDynamicMcsAcceptedFlowsExactlyZero,
  });
  return deepFreeze({
    cycleIndex,
    startTimeSec: run.startTimeSec,
    endTimeSec: run.endTimeSec,
    acceptedStepCount: run.acceptedStepCount,
    coronaryAutoregulationWindow: run.coronaryAutoregulationWindow,
    period1,
    period2,
    period1MaximumNormalizedDelta: period1.overall.maximumNormalizedDelta,
    period2MaximumNormalizedDelta:
      period2?.overall.maximumNormalizedDelta ?? null,
    worstPeriod1Group: period1.overall.worstGroup,
    worstPeriod1Path: period1.overall.worstPath,
    acceptedAtrialCaptureIds: run.acceptedAtrialCaptureIds,
    acceptedVentricularCaptureIds: run.acceptedVentricularCaptureIds,
    deliveredCalciumDepositIds: run.deliveredCalciumDepositIds,
    conservation,
    finiteAndEventIdentityChecks,
    rawHealthyMetrics: rawHealthyMetrics(run.traceSamples),
  });
}

function traceSample(
  cycleIndex: number,
  acceptedStepIndexWithinCycle: number,
  cycleStartTimeSec: number,
  cycleLengthSec: number,
  acceptedDtSec: number,
  stepped: SuccessfulStep,
): MainWireIntegratedModelPeriodicTerminalTraceSampleV3 {
  const base = stepped.coronaryStep.baseStep;
  const circulation = base.circulationTrial;
  const pressures = circulation.nodeAbsolutePressuresMmHg;
  const volumes = circulation.candidateNodeVolumesMl;
  const valves = circulation.valveEvaluations;
  const hydraulics = base.coronaryTrial.diagnostics.hydraulics;
  const candidate = stepped.composedRhythmCandidate;
  return deepFreeze({
    cycleIndex,
    acceptedStepIndexWithinCycle,
    acceptedTimeSec: stepped.acceptedState.acceptedTimeSec,
    cyclePhase01:
      (stepped.acceptedState.acceptedTimeSec - cycleStartTimeSec) /
      cycleLengthSec,
    acceptedDtSec,
    chamberVolumeMl: {
      LA: volumes.LA,
      LV: volumes.LV,
      RA: volumes.RA,
      RV: volumes.RV,
    },
    absolutePressureMmHg: {
      LA: pressures.LA,
      LV: pressures.LV,
      RA: pressures.RA,
      RV: pressures.RV,
      Ao: pressures.Ao,
      PA: pressures.PA,
      PVein: pressures.PVein,
    },
    valveFlowMlPerSec: {
      MV: valves.MV.flowMlPerSec,
      AoV: valves.AoV.flowMlPerSec,
      TV: valves.TV.flowMlPerSec,
      PV: valves.PV.flowMlPerSec,
    },
    coronary: {
      totalInletFlowMlPerSec: hydraulics.totalInletFlowMlPerSec,
      ladSubendocardialQmFlowMlPerSec:
        hydraulics.layerQmInternalFlowMlPerSecByTerritory.LAD.subendocardial,
    },
    freeCalciumUMByWall: stepped.calciumDrive.freeCalciumUMByWall,
    dynamicMcsAcceptedFlowMlPerSec:
      stepped.acceptedState.dynamicMechanicalSupport.acceptedFlowMlPerSec,
    acceptedEventIdentity: {
      atrialCapturedActivationId:
        candidate.capturedAtrialActivation?.capturedActivationId ?? null,
      ventricularCapturedActivationId:
        candidate.capturedVentricularActivation?.capturedActivationId ?? null,
      deliveredCalciumDepositIds: candidate.deliveredCalciumDeposits.map(
        (deposit) => deposit.depositId,
      ),
      scheduledCalciumDepositIds: candidate.scheduledCalciumDeposits.map(
        (deposit) => deposit.depositId,
      ),
    },
    diagnostics: {
      mechanicsResidualNorm: base.mechanicsTrial.diagnostics.residualNorm,
      circulationScaledResidualInfinityNorm:
        circulation.diagnostics.finalScaledResidualInfinityNorm,
      maximumContinuityResidualMl:
        circulation.diagnostics.finalMaximumContinuityResidualMl,
      totalBloodVolumeErrorMl: circulation.diagnostics.totalBloodVolumeErrorMl,
      coronaryBloodVolumeLedgerResidualMl:
        base.coronaryTrial.diagnostics.exactBloodVolumeLedgerResidualMl,
      dynamicMcsConservationResidualMlPerSec:
        stepped.dynamicMechanicalSupportTrial.conservationResidualMlPerSec,
    },
  });
}

function rawHealthyMetrics(
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
): MainWireIntegratedModelHealthyReferenceProjectionV3["metric"] {
  if (samples.length === 0)
    throw new Error("healthy metrics require raw samples");
  const bsa =
    MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.referenceSubject
      .bodySurfaceAreaM2;
  const lvVolumes = samples.map((sample) => sample.chamberVolumeMl.LV);
  const lvEndDiastolicVolumeMl = Math.max(...lvVolumes);
  const lvEndSystolicVolumeMl = Math.min(...lvVolumes);
  const durationSec = samples.reduce(
    (sum, sample) => sum + sample.acceptedDtSec,
    0,
  );
  if (!nearlyEqual(durationSec, 1)) {
    throw new Error("healthy metrics raw trace does not span one cycle");
  }
  const nativeAorticForwardVolumeMl = samples.reduce(
    (sum, sample) =>
      sum + Math.max(0, sample.valveFlowMlPerSec.AoV) * sample.acceptedDtSec,
    0,
  );
  const nativeAorticCardiacOutputLPerMin =
    (nativeAorticForwardVolumeMl * 60) / durationSec / 1_000;
  return deepFreeze({
    lvEndDiastolicVolumeMl,
    lvEndSystolicVolumeMl,
    lvEndDiastolicVolumeIndexMlPerM2: lvEndDiastolicVolumeMl / bsa,
    lvEndSystolicVolumeIndexMlPerM2: lvEndSystolicVolumeMl / bsa,
    lvEjectionFraction01:
      (lvEndDiastolicVolumeMl - lvEndSystolicVolumeMl) / lvEndDiastolicVolumeMl,
    nativeAorticForwardVolumeMl,
    nativeAorticCardiacOutputLPerMin,
    nativeAorticCardiacIndexLPerMinPerM2:
      nativeAorticCardiacOutputLPerMin / bsa,
    pulmonaryArterySystolicPressureMmHg: Math.max(
      ...samples.map((sample) => sample.absolutePressureMmHg.PA),
    ),
    leftAtrialTimeWeightedMeanPressureMmHg:
      samples.reduce(
        (sum, sample) =>
          sum + sample.absolutePressureMmHg.LA * sample.acceptedDtSec,
        0,
      ) / durationSec,
  });
}

function healthyReferenceProjection(
  trace: MainWireIntegratedModelPeriodicTerminalCycleTraceV3,
  executionPurpose: MainWireIntegratedModelPeriodicExecutionPurposeV3,
  numericalPeriod1Established: boolean,
): MainWireIntegratedModelHealthyReferenceProjectionV3 {
  const metric = rawHealthyMetrics(trace.samples);
  const eligible =
    executionPurpose === "canonical-evidence" && numericalPeriod1Established;
  const valueByMetricId: Readonly<Record<string, number>> = Object.freeze({
    "hemodynamics.lv.edv_index_ml_per_m2":
      metric.lvEndDiastolicVolumeIndexMlPerM2,
    "hemodynamics.lv.esv_index_ml_per_m2":
      metric.lvEndSystolicVolumeIndexMlPerM2,
    "hemodynamics.lv.ejection_fraction_01": metric.lvEjectionFraction01,
    "hemodynamics.aortic.cardiac_index_l_per_min_per_m2":
      metric.nativeAorticCardiacIndexLPerMinPerM2,
    "hemodynamics.pressure.pulmonary_artery.systolic_mmhg":
      metric.pulmonaryArterySystolicPressureMmHg,
    "hemodynamics.pressure.left_atrium.mean_mmhg":
      metric.leftAtrialTimeWeightedMeanPressureMmHg,
  });
  const selectedGates =
    MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.gates.filter(
      (gate) => valueByMetricId[gate.metricId] !== undefined,
    );
  if (selectedGates.length !== 6) {
    throw new Error("healthy reference projection does not cover six gates");
  }
  return deepFreeze({
    projectionId:
      "main-wire-integrated-v3-terminal-cycle-healthy-reference-projection-v1" as const,
    referencePackId: MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.packId,
    referenceBodySurfaceAreaM2:
      MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.referenceSubject
        .bodySurfaceAreaM2,
    referenceBodySurfaceAreaProvenance:
      "MainWireEvidencePacksV1.fixed-resting-adult-research-reference" as const,
    metric,
    assessmentEligibility: {
      eligible,
      requirement:
        "canonical-evidence-and-numerical-period1-converged" as const,
      numericalPeriod1Established,
      executionPurpose,
    },
    gateResults: selectedGates.map((gate) =>
      gateResult(gate, valueByMetricId[gate.metricId]!, eligible),
    ),
    comparisonRole: "construction-context-not-independent-validation" as const,
    physiologyValidated: false as const,
    clinicalValidationClaimed: false as const,
  });
}

function gateResult(
  gate: MainWireCycleEvidenceGateV1,
  value: number,
  eligible: boolean,
): MainWireIntegratedModelHealthyReferenceProjectionV3["gateResults"][number] {
  const within =
    (gate.lowerInclusive === null || value >= gate.lowerInclusive) &&
    (gate.upperInclusive === null || value <= gate.upperInclusive);
  return Object.freeze({
    gateId: gate.gateId,
    metricId: gate.metricId,
    value,
    lowerInclusive: gate.lowerInclusive,
    upperInclusive: gate.upperInclusive,
    status: !eligible
      ? ("not-assessed" as const)
      : within
        ? ("pass" as const)
        : ("fail" as const),
    sourceIds: gate.sourceIds,
  });
}

function createRegularSinusComposedRhythmV3(): Readonly<{
  configuration: AcceptedComposedRhythmTransactionConfigurationV2;
  state: AcceptedComposedRhythmTransactionStateV2;
}> {
  const capture = createAcceptedElectricalCaptureOwnerConfigurationV2({
    configurationId: "periodic-v3-capture-configuration",
    ownerInstanceId: "periodic-v3-capture-owner",
    atrialGate: {
      gateInstanceId: "periodic-v3-atrial-capture-gate",
      refractoryPeriodSec: 0.2,
    },
    ventricularGate: {
      gateInstanceId: "periodic-v3-ventricular-capture-gate",
      refractoryPeriodSec: 0.25,
    },
  });
  const interval = createAcceptedVentricularIntervalStrengthConfigurationV1({
    configurationId: "periodic-v3-interval-configuration",
    ownerInstanceId: "periodic-v3-interval-owner",
    parameterProvenance: {
      kind: "explicit-research-parameters",
      sourceId: "bounded-periodic-v3-construction",
    },
    recoveryTimeConstantSec: 0.5,
    releaseFractionBeta: 0.8,
    releasedLoadReturnFractionR: 0.5,
    intervalInfluxInhibitionFractionH: 0.2,
    referenceCycleLengthSec: 1,
  });
  const regular = createRegularAtrialSourceConfigurationV1({
    configurationId: "periodic-v3-regular-sinus-configuration",
    ownerInstanceId: "periodic-v3-regular-sinus-owner",
    sourceId: "periodic-v3-sinus-source",
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
    configurationId: "periodic-v3-composed-sinus-configuration",
    ownerInstanceId: "periodic-v3-composed-sinus-owner",
    atrialSource: {
      mode: "regular",
      regularSourceConfiguration: regular,
      externalAfOwnerInstanceId: null,
    },
    authoredEctopySchedule: createAcceptedAuthoredEctopyScheduleConfigurationV2(
      {
        configurationId: "periodic-v3-empty-ectopy-configuration",
        ownerInstanceId: "periodic-v3-empty-ectopy-owner",
        scheduleId: "periodic-v3-empty-ectopy-schedule",
        events: [],
      },
    ),
    authoredVentricularPacingReplay: null,
    electricalCaptureOwner: capture,
    avGateParameters: createRecoveryConcealmentAvGateParametersV1({
      parameterSetId: "periodic-v3-proximal-av-parameters",
      parameterProvenance: {
        kind: "explicit-research-parameters",
        sourceId: "bounded-periodic-v3-construction",
      },
      minimumConductionDelaySec: 0.125,
      recoveryDelayAmplitudeSec: 0,
      recoveryTimeConstantSec: 1,
      postConductionRefractorySec: 0.25,
      concealedRefractoryExtensionSec: 0,
    }),
    avGateInstanceId: "periodic-v3-proximal-av-owner",
    distalGate: createDistalConductionGateConfigurationV1({
      configurationId: "periodic-v3-distal-configuration",
      gateInstanceId: "periodic-v3-distal-owner",
      parameterProvenance: {
        kind: "explicit-research-parameters",
        sourceId: "bounded-periodic-v3-construction",
      },
      hvConductionDelaySec: 0.0625,
      distalEffectiveRefractoryPeriodSec: 0,
      modeConfiguration: { mode: "pass" },
    }),
    ventricularBackup: createAcceptedVentricularBackupSourceConfigurationV2({
      configurationId: "periodic-v3-backup-configuration",
      ownerInstanceId: "periodic-v3-backup-owner",
      parameterProvenance: {
        kind: "authored",
        sourceId: "bounded-periodic-v3-construction",
      },
      intrinsicEscapeSourceId: "periodic-v3-escape-source",
      intrinsicEscapeCycleLengthSec: 2,
      vviPacingSourceId: "periodic-v3-vvi-source",
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
  const state = initializeAcceptedElectricalCaptureOwnerStateV2(configuration, {
    acceptedTimeSec: 0,
    atrialPriorCapture: null,
    ventricularPriorCapture: null,
  });
  const source = createSourceImpulseV2({
    sourceImpulseId: "periodic-v3-history-source-0",
    parentCapturedActivationId: null,
    chamber: "ventricular",
    sourceKind: "escape",
    sourceId: "periodic-v3-history-source",
    sourceSequence: 0,
    activationTimeSec: 0,
  });
  return evaluateAcceptedElectricalCaptureBatchCandidateV2(state, {
    candidateTimeSec: 0,
    sourceImpulses: [source],
  }).capturedActivations[0]!;
}

function createAllOffZeroInertanceProfileV3(): DynamicMechanicalSupportInertanceProfileV1 {
  const zero = Object.freeze({
    unitSystemId: DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
    pumpInternalMmHgSec2PerMl: 0,
    drainageMmHgSec2PerMl: 0,
    oxygenatorMmHgSec2PerMl: 0,
    returnPathMmHgSec2PerMl: 0,
  }) satisfies DynamicRotaryPumpCircuitInertanceV1;
  return createDynamicMechanicalSupportInertanceProfileV1({
    profileId: "periodic-v3-explicit-all-off-zero-inertance-profile",
    profileBindingSha256: "0".repeat(64),
    deviceProfileBindingByDevice: Object.freeze({
      LVAD: allOffBinding("LVAD", "1"),
      IMPELLA: allOffBinding("IMPELLA", "2"),
      VA_ECMO: allOffBinding("VA_ECMO", "3"),
      VV_ECMO: allOffBinding("VV_ECMO", "4"),
    }),
    inertanceByDevice: Object.freeze({
      LVAD: zero,
      IMPELLA: zero,
      VA_ECMO: zero,
      VV_ECMO: zero,
    }),
  });
}

function allOffBinding(deviceId: RotarySupportDeviceIdV1, digit: string) {
  return createDynamicMechanicalSupportDeviceProfileBindingV1({
    deviceId,
    circuitProfileId: `periodic-v3-${deviceId.toLowerCase()}-all-off-zero-inertance`,
    circuitProfileBindingSha256: digit.repeat(64),
  });
}

function stepInput(
  fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  dtSec: number,
): MainWireIntegratedModelStepInputV3 {
  return Object.freeze({
    dtSec,
    coronary: fixture.coronaryStepInput,
    rhythm: Object.freeze({
      configuration: fixture.rhythm.configuration,
      externalAfNextBoundaryTimeSec: null,
      externalAtrialSourceBatch: null,
    }),
    dynamicMechanicalSupport: fixture.dynamicMechanicalSupport,
  });
}

function createCheckpointContext(
  fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  state: AcceptedState,
): MainWireIntegratedModelCheckpointContextV3<WallState> {
  return Object.freeze({
    provider: fixture.provider,
    coronaryPrior: fixture.coronaryStepInput.coronaryPrior,
    collapseHydraulics: fixture.coronaryStepInput.collapseHydraulics,
    impMechanism: fixture.coronaryStepInput.impMechanism,
    shorteningImpPrior: fixture.coronaryStepInput.shorteningImpPrior,
    coronaryAutoregulationBinding: state.coronary.coronaryAutoregulationBinding,
    rhythm: Object.freeze({ configuration: fixture.rhythm.configuration }),
    dynamicMechanicalSupportProfile: fixture.profile,
    dynamicMechanicalSupportConfig: fixture.config,
  });
}

function validateKernelOptions(
  options: MainWireIntegratedModelPeriodicKernelOptionsV3,
): void {
  if (
    options === null ||
    typeof options !== "object" ||
    Array.isArray(options)
  ) {
    throw new Error("V3 periodic kernel options must be an object");
  }
  const keys = Object.keys(options);
  if (
    keys.some(
      (key) =>
        ![
          "protocolIdentityHash",
          "nominalDtSec",
          "maximumCycleCount",
          "stopAfterClassification",
          "evidenceRole",
        ].includes(key),
    )
  ) {
    throw new Error("V3 periodic kernel options contain unexpected fields");
  }
  if (!/^[0-9a-f]{64}$/.test(options.protocolIdentityHash)) {
    throw new Error("V3 periodic kernel requires a SHA-256 protocol identity");
  }
  const policy = MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3;
  if (
    !Number.isFinite(options.nominalDtSec) ||
    options.nominalDtSec < policy.minimumNominalDtSec ||
    options.nominalDtSec > policy.maximumNominalDtSec
  ) {
    throw new RangeError(
      `kernel nominalDtSec must be from ${policy.minimumNominalDtSec} through ${policy.maximumNominalDtSec}`,
    );
  }
  if (
    !Number.isSafeInteger(options.maximumCycleCount) ||
    options.maximumCycleCount < 1 ||
    options.maximumCycleCount > policy.maximumCycleCount
  ) {
    throw new RangeError(
      `kernel maximumCycleCount must be from 1 through ${policy.maximumCycleCount}`,
    );
  }
  if (typeof options.stopAfterClassification !== "boolean") {
    throw new TypeError("kernel stopAfterClassification must be boolean");
  }
  if (
    options.evidenceRole !== "canonical-periodic-protocol" &&
    options.evidenceRole !== "bounded-exploration-only"
  ) {
    throw new Error("unsupported V3 periodic kernel evidence role");
  }
}

function resolveOptions(
  options: MainWireIntegratedModelPeriodicSteadyOptionsV3,
) {
  if (
    options === null ||
    typeof options !== "object" ||
    Array.isArray(options)
  ) {
    throw new Error("V3 periodic options must be an object");
  }
  const keys = Object.keys(options);
  if (
    keys.some(
      (key) =>
        !["nominalDtSec", "maximumCycleCount", "executionPurpose"].includes(
          key,
        ),
    )
  ) {
    throw new Error("V3 periodic options contain unexpected fields");
  }
  const policy = MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3;
  if (
    !Number.isFinite(options.nominalDtSec) ||
    options.nominalDtSec < policy.minimumNominalDtSec ||
    options.nominalDtSec > policy.maximumNominalDtSec
  ) {
    throw new RangeError(
      `nominalDtSec must be from ${policy.minimumNominalDtSec} through ${policy.maximumNominalDtSec}`,
    );
  }
  const executionPurpose = options.executionPurpose ?? "canonical-evidence";
  if (
    executionPurpose !== "canonical-evidence" &&
    executionPurpose !== "bounded-smoke" &&
    executionPurpose !== "fixed-horizon-characterization"
  ) {
    throw new Error("unsupported V3 periodic execution purpose");
  }
  const maximumCycleCount =
    options.maximumCycleCount ??
    (executionPurpose === "bounded-smoke"
      ? policy.boundedSmokeDefaultMaximumCycleCount
      : policy.defaultMaximumCycleCount);
  const maximumAllowed =
    executionPurpose === "bounded-smoke"
      ? policy.boundedSmokeMaximumCycleCount
      : policy.maximumCycleCount;
  if (
    !Number.isSafeInteger(maximumCycleCount) ||
    maximumCycleCount < 1 ||
    maximumCycleCount > maximumAllowed
  ) {
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

function providerIdentity(provider: Provider) {
  return Object.freeze({
    contractId: provider.contractId,
    providerId: provider.providerId,
    parameterSetId: provider.parameterSetId,
    parameterIdentityHash: provider.parameterIdentityHash,
    stateSchemaVersion: provider.stateSchemaVersion,
  });
}

function assertAllOffConfig(config: MechanicalSupportConfigV1): void {
  if (
    config.lvad.enabled ||
    config.impella.enabled ||
    config.vaEcmo.enabled ||
    config.vvEcmo.enabled ||
    config.iabp.enabled
  ) {
    throw new Error("periodic V3 fixture requires all MCS devices disabled");
  }
}

function assertAllOffAcceptedQ(state: AcceptedState): void {
  if (
    !Object.values(state.dynamicMechanicalSupport.acceptedFlowMlPerSec).every(
      (value) => value === 0,
    )
  ) {
    throw new Error("periodic V3 all-off accepted q must be exactly zero");
  }
}

function rejectDuplicateIds(
  accepted: Set<string>,
  candidate: readonly string[],
  label: string,
): void {
  for (const id of candidate) {
    if (accepted.has(id)) throw new Error(`duplicate V3 ${label} identity`);
    accepted.add(id);
  }
}

function allNumericLeavesFinite(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (value === null || typeof value !== "object") return true;
  return Object.values(value as Record<string, unknown>).every(
    allNumericLeavesFinite,
  );
}

function nearlyEqual(left: number, right: number): boolean {
  return (
    Math.abs(left - right) <=
    64 * Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right))
  );
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null &&
    typeof value === "object" &&
    !ArrayBuffer.isView(value)
  ) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
