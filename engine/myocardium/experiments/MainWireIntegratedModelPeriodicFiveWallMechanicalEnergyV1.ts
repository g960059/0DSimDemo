import {
  checkpointMainWireIntegratedModelV3,
  restoreMainWireIntegratedModelV3,
  type MainWireIntegratedModelCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  evaluateMainWireIntegratedModelCalciumDriveV3,
  limitMainWireIntegratedModelCandidateTimeV3,
  stepMainWireIntegratedModelV3,
  type MainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedModelStepInputV3,
  type MainWireIntegratedModelStepSuccessV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_CHAMBER_IDS_V1,
  MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1,
  measureMainWireFiveWallMechanicalEnergyLedgerV1,
  type MainWireFiveWallMechanicalEnergyChamberIdV1,
  type MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1,
  type MainWireFiveWallMechanicalEnergyLedgerV1,
  type MainWireFiveWallMechanicalEnergyWallIdV1,
  type MainWireFiveWallMechanicalEnergyWallRecordV1,
} from "@/engine/myocardium/diagnostics/MainWireFiveWallMechanicalEnergyLedgerV1";
import {
  MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM,
  MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
  type MainWireNormalAdultWallMaterialReadbackV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1 } from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  classifyMainWireIntegratedModelPeriodicityV3,
  type MainWireIntegratedModelPeriodicCycleObservationV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import { compareMainWireIntegratedModelAcceptedStatesV3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import {
  qualifyMainWireIntegratedModelPeriodicExternalWorkV1,
  periodicPressureVolumeBoundaryFromAcceptedTraceSampleV1,
  type MainWireIntegratedModelPeriodicExternalWorkResultV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicExternalWorkV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CONDITION_IDENTITY_V1_ID,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_REFINEMENT_ACCESS_V1_ID,
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  type MainWireIntegratedModelPeriodicNumericalAccessV3,
  type MainWireIntegratedModelRegularSinusAllOffCycleRunV3,
  type MainWireIntegratedModelPeriodicSteadyOptionsV3,
  type MainWireIntegratedModelPeriodicSteadyResultV3,
  type MainWireIntegratedModelPeriodicTerminalCycleTraceV3,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type { MainWireNormalAdultFiveWallMechanicsStateV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_V1_ID =
  "main-wire-integrated-model-periodic-five-wall-mechanical-energy-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_POLICY_V1 =
  Object.freeze({
    policyId:
      "main-wire-integrated-model-periodic-five-wall-mechanical-energy-policy-v1" as const,
    modelCondition: "normal-default-complete-condition-identity" as const,
    numericalAccess:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_REFINEMENT_ACCESS_V1_ID,
    requestedMaximumCycleCount:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.defaultMaximumCycleCount,
    sourcePeriodicity: "canonical-latest-full-state-P1" as const,
    sourceCheckpoint: "exact-round-trip-before-continuation" as const,
    continuation:
      "one-bridge-cycle-then-one-measurement-cycle-from-source-checkpoint" as const,
    acceptedStepCollection: "committed-success-only-no-resampling" as const,
    integration: "backward-Euler-endpoint" as const,
    algebraicResidualAbsoluteToleranceMilliJ: 1e-8,
    slsPerStepTolerance:
      "1e-10-times-max-of-one-absolute-SLS-work-increment-and-endpoint-stored-energies" as const,
    pressureVolumeBridge:
      "BE-cavity-work-plus-trapezoidal-external-work-minus-half-delta-P-delta-V" as const,
    pressureVolumeBridgeAbsoluteToleranceMilliJ: 1e-8,
    pressureVolumeConversionMilliJPerMmHgMl: 133.322 * 1e-3,
    refinementAdmissionOwnedElsewhere: true as const,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_CLAIM_V1 =
  Object.freeze({
    scientificInterpretation:
      "five-wall-mechanical-port-passive-storage-and-dissipation-only" as const,
    landActiveWorkInterpretation:
      "mechanical-work-of-Land-active-stress-on-wall-only" as const,
    activeStressWorkSign:
      "positive-is-work-on-wall-negative-is-net-active-mechanical-delivery" as const,
    activeDeliveryAbsorptionSplitEstablished: false as const,
    instantaneousPowerEstablished: false as const,
    landThermodynamicStoredEnergyClaimed: false as const,
    potentialEnergyClaimed: false as const,
    pressureVolumeAreaClaimed: false as const,
    myocardialOxygenConsumptionClaimed: false as const,
    atpHydrolysisOrHeatClaimed: false as const,
    efficiencyClaimed: false as const,
    physiologicalValidationEstablished: false as const,
    clinicalValidationClaimed: false as const,
  });

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyFailureReasonV1 =
  | "protocol-identity-invalid"
  | "model-condition-identity-invalid"
  | "normal-default-condition-required"
  | "canonical-latest-period1-source-not-established"
  | "source-cycle-integrity-failed"
  | "source-checkpoint-exact-parity-failed"
  | "analysis-continuation-failed"
  | "mechanical-readback-structure-invalid"
  | "analysis-qualification-failed"
  | "continuation-period1-failed"
  | "accepted-path-trace-incomplete"
  | "accepted-readback-nonfinite"
  | "material-volume-identity-failed"
  | "mechanical-source-identity-failed"
  | "per-step-sls-passivity-failed"
  | "per-step-sls-residual-reconstruction-failed"
  | "cycle-integrated-sls-dissipation-negative"
  | "equilibrium-passive-be-remainder-negative"
  | "algebraic-residual-exceeded"
  | "measurement-external-work-not-qualified"
  | "pressure-volume-quadrature-bridge-failed"
  | "continuation-checkpoint-exact-parity-failed";

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricV1 =
  Readonly<{
    metricId: string;
    valueMilliJ: number;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualV1 =
  Readonly<{
    residualId: string;
    valueMilliJ: number;
    passed: boolean;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyV1 =
  Readonly<{
    aggregateId:
      "left-atrium" | "right-atrium" | "ventricles-combined" | "whole-heart";
    residualMilliJ: number;
    wallWorkMilliJ: number;
    cavityWorkMilliJ: number;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgeV1 =
  Readonly<{
    chamber: "LV" | "RV";
    backwardEulerCavityWorkOnWallMilliJ: number;
    trapezoidalExternalWorkMilliJ: number;
    endpointCorrectionMilliJ: number;
    residualMilliJ: number;
    passed: boolean;
  }>;

type AcceptedMechanicalSourceEvidenceV1 = Readonly<{
  cycleIndex: number;
  acceptedStepIndexWithinCycle: number;
  cycleStartTimeSec: number;
  cycleEndTimeSec: number;
  previousAcceptedRevision: number;
  acceptedRevision: number;
  previousAcceptedTimeSec: number;
  acceptedTimeSec: number;
  acceptedDtSec: number;
  candidateMaterialStateFingerprint: string;
  providerReadbackOwner: Readonly<{
    providerModelId: string;
    solveMode: string;
    hiddenBloodVolumeMl: number;
    pistonVolumeApplied: boolean;
  }>;
  mechanicsIdentity: Readonly<{
    contractId: string;
    providerId: string;
    parameterSetId: string;
    parameterIdentityHash: string;
    stateSchemaVersion: number;
  }>;
  wallSourceByWall: MainWireFiveWallMechanicalEnergyWallRecordV1<
    Readonly<{
      adapterId: string;
      wallId: string;
      passiveModelId: string;
      passiveParameterIdentityHash: string;
      landParameterSetStableHash: string;
      slsPassive: boolean;
      landThermodynamicStoredEnergyClaimed: boolean;
      totalThermodynamicPotentialIncludingLandClaimed: boolean;
    }>
  >;
}>;

type AcceptedMechanicalObservationV1 = Readonly<{
  sample: MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1;
  source: AcceptedMechanicalSourceEvidenceV1;
}>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAcceptedObservationV1 =
  AcceptedMechanicalObservationV1;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyMeasurementInputEvidenceV1 =
  Readonly<{
    precedingAcceptedStepObservation: AcceptedMechanicalObservationV1;
    measurementAcceptedStepObservations: readonly AcceptedMechanicalObservationV1[];
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyMaterialVolumeBindingPayloadV1 =
  Readonly<{
    priorId: (typeof NORMAL_ADULT_FIVE_WALL_PRIOR_V1)["priorId"];
    priorParameterIdentityHash: string;
    provider: AcceptedMechanicalSourceEvidenceV1["mechanicsIdentity"];
    wallMaterialVolumeMlByWall: MainWireFiveWallMechanicalEnergyWallRecordV1<number>;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPerStepSlsResidualEvidenceV1 =
  Readonly<{
    assessedAcceptedStepCount: number;
    assessedWallStepCount: number;
    maximumAbsoluteReconstructedResidualDensityJPerM3: number;
    maximumAbsoluteReadbackAgreementResidualDensityJPerM3: number;
    maximumReconstructedResidualToleranceRatio: number;
    maximumReadbackAgreementToleranceRatio: number;
    perWall: MainWireFiveWallMechanicalEnergyWallRecordV1<
      Readonly<{
        assessedStepCount: number;
        maximumAbsoluteReconstructedResidualDensityJPerM3: number;
        maximumAbsoluteReadbackAgreementResidualDensityJPerM3: number;
        maximumReconstructedResidualToleranceRatio: number;
        maximumReadbackAgreementToleranceRatio: number;
      }>
    >;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyGatesV1 =
  Readonly<{
    protocolIdentityValid: boolean;
    modelConditionIdentityValid: boolean;
    normalDefaultConditionPassed: boolean;
    canonicalLatestPeriod1Source: boolean;
    sourceCycleIntegrityPassed: boolean;
    sourceCheckpointExactParityPassed: boolean;
    continuationPeriod1Passed: boolean;
    acceptedPathTraceComplete: boolean;
    finiteAcceptedReadback: boolean;
    materialVolumeIdentityPassed: boolean;
    mechanicalSourceIdentityPassed: boolean;
    perStepSlsPassivityPassed: boolean;
    perStepSlsResidualReconstructionPassed: boolean;
    cycleIntegratedSlsDissipationNonnegative: boolean;
    equilibriumPassiveBackwardEulerRemainderNonnegative: boolean;
    algebraicResidualsPassed: boolean;
    measurementExternalWorkQualified: boolean;
    quadratureBridgePassed: boolean;
    continuationCheckpointExactParityPassed: boolean;
  }>;

type ResultCommonV1 = Readonly<{
  qualificationId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_V1_ID;
  protocolIdentityHash: string;
  modelConditionIdentityHash: string;
  executionPurpose: MainWireIntegratedModelPeriodicSteadyResultV3["executionPurpose"];
  numericalAccessId: MainWireIntegratedModelPeriodicSteadyResultV3["numericalAccess"]["accessId"];
  requestedMaximumCycleCount: number;
  nominalDtSec: number;
  sourceCycleIndex: number;
  sourceAcceptedStepCount: number;
  bridgeCycleIndex: number | null;
  bridgeAcceptedStepCount: number | null;
  measurementCycleIndex: number | null;
  measurementAcceptedStepCount: number | null;
  gates: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyGatesV1;
  materialVolumeBindingSha256: string | null;
  rawMechanicalTraceSha256: string | null;
  bridgeTerminalAcceptedStepSampleSha256: string | null;
  sourceCheckpointSha256: string;
  sourceCheckpoint: MainWireIntegratedModelCheckpointV3;
  terminalCheckpointSha256: string | null;
  failureReasons: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyFailureReasonV1[];
  policy: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_POLICY_V1;
  claim: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_CLAIM_V1;
}>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1 =
  ResultCommonV1 &
    Readonly<{
      status: "qualified-for-refinement-comparison";
      executionPurpose: "canonical-evidence";
      numericalAccessId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_REFINEMENT_ACCESS_V1_ID;
      bridgeCycleIndex: number;
      bridgeAcceptedStepCount: number;
      measurementCycleIndex: number;
      measurementAcceptedStepCount: number;
      materialVolumeBindingSha256: string;
      rawMechanicalTraceSha256: string;
      bridgeTerminalAcceptedStepSampleSha256: string;
      terminalCheckpointSha256: string;
      bridgeTerminalAcceptedStepSample: MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1;
      measurementAcceptedStepSamples: readonly MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1[];
      measurementInputEvidence: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyMeasurementInputEvidenceV1;
      materialVolumeBindingPayload: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyMaterialVolumeBindingPayloadV1;
      terminalCheckpoint: MainWireIntegratedModelCheckpointV3;
      perStepSlsResidualEvidence: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPerStepSlsResidualEvidenceV1;
      ledger: MainWireFiveWallMechanicalEnergyLedgerV1;
      measurementExternalWork: MainWireIntegratedModelPeriodicExternalWorkResultV1;
      physicalMetrics: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricV1[];
      allFiveSlsBackwardEulerNumericalDissipationMilliJ: number;
      allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ: number;
      conjugacy: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyV1[];
      algebraicResiduals: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualV1[];
      quadratureBridges: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgeV1[];
      sourceCheckpointExactRoundTripVerified: true;
      continuationCheckpointExactRoundTripVerified: true;
    }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyNotQualifiedV1 =
  ResultCommonV1 &
    Readonly<{
      status: "not-qualified";
      bridgeTerminalAcceptedStepSample: MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1 | null;
      measurementAcceptedStepSamples: readonly MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1[];
      measurementInputEvidence: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyMeasurementInputEvidenceV1 | null;
      materialVolumeBindingPayload: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyMaterialVolumeBindingPayloadV1 | null;
      terminalCheckpoint: MainWireIntegratedModelCheckpointV3 | null;
      perStepSlsResidualEvidence: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPerStepSlsResidualEvidenceV1 | null;
      ledger: MainWireFiveWallMechanicalEnergyLedgerV1 | null;
      measurementExternalWork: MainWireIntegratedModelPeriodicExternalWorkResultV1 | null;
      physicalMetrics: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricV1[];
      allFiveSlsBackwardEulerNumericalDissipationMilliJ: number | null;
      allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ: number | null;
      conjugacy: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyV1[];
      algebraicResiduals: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualV1[];
      quadratureBridges: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgeV1[];
      sourceCheckpointExactRoundTripVerified: boolean;
      continuationCheckpointExactRoundTripVerified: boolean;
    }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyResultV1 =
  | MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1
  | MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyNotQualifiedV1;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyRunInputV1 =
  Readonly<{
    source: MainWireIntegratedModelPeriodicSteadyResultV3;
    hemodynamicResearchInputs?: MainWireIntegratedModelPeriodicSteadyOptionsV3["hemodynamicResearchInputs"];
    ventricularContractilityScale?: number;
    mechanismResearchInputs?: MainWireIntegratedModelPeriodicSteadyOptionsV3["mechanismResearchInputs"];
  }>;

type IntegratedAcceptedStateV1 =
  MainWireIntegratedModelAcceptedStateV3<MainWireNormalAdultFiveWallMechanicsStateV1>;
type IntegratedSuccessfulStepV1 =
  MainWireIntegratedModelStepSuccessV3<MainWireNormalAdultFiveWallMechanicsStateV1>;

export type MainWireIntegratedModelAcceptedSuccessObservationV1 = Readonly<{
  cycleIndex: number;
  acceptedStepIndexWithinCycle: number;
  cycleStartTimeSec: number;
  cycleEndTimeSec: number;
  acceptedDtSec: number;
  previousAcceptedRevision: number;
  previousAcceptedTimeSec: number;
  acceptedRevision: number;
  acceptedTimeSec: number;
  terminalTraceSample: MainWireIntegratedModelPeriodicTerminalTraceSampleV3;
  successfulStep: IntegratedSuccessfulStepV1;
}>;

export type MainWireIntegratedModelAcceptedSuccessObserverV1 = (
  observation: MainWireIntegratedModelAcceptedSuccessObservationV1,
) => void;

export type MainWireIntegratedModelPeriodicAnalysisContinuationV1 = Readonly<{
  sourceCycleIndex: number;
  sourceCheckpointExactRoundTripVerified: true;
  bridgeCycle: MainWireIntegratedModelRegularSinusAllOffCycleRunV3;
  measurementCycle: MainWireIntegratedModelRegularSinusAllOffCycleRunV3;
  terminalCheckpoint: MainWireIntegratedModelCheckpointV3;
  terminalCheckpointExactRoundTripVerified: true;
}>;

/**
 * Analysis-only mirror of the frozen Standard cycle executor. It is kept out
 * of the registered exact-kernel module so adding readback collection cannot
 * revise the historical Standard artifact. Parity tests pin both admitted
 * numerical grids.
 */
export function runMainWireIntegratedModelPeriodicAnalysisCycleMirrorV1(
  fixture: ReturnType<
    typeof createMainWireIntegratedModelRegularSinusAllOffFixtureV3
  >,
  initial: IntegratedAcceptedStateV1,
  cycleIndex: number,
  nominalDtSec: 0.001 | 0.0005,
  observer?: MainWireIntegratedModelAcceptedSuccessObserverV1,
): MainWireIntegratedModelRegularSinusAllOffCycleRunV3 {
  if (!Number.isSafeInteger(cycleIndex) || cycleIndex < 1) {
    throw new Error("mechanical-energy cycle index must be positive");
  }
  const window = initial.coronary.coronaryAutoregulation;
  const windowPolicy =
    initial.coronary.coronaryAutoregulationBinding.windowPolicy;
  const startTimeSec = initial.acceptedTimeSec;
  const endTimeSec = startTimeSec + fixture.cycleLengthSec;
  if (
    cycleIndex !== window.windowIndex + 1 ||
    startTimeSec !== window.windowStartAcceptedTimeSec ||
    window.acceptedDurationSec !== 0 ||
    window.acceptedStepCount !== 0 ||
    !nearlyEqualAnalysisV1(windowPolicy.durationSec, fixture.cycleLengthSec)
  ) {
    throw new Error(
      "mechanical-energy continuation cycle/window boundary identity differs",
    );
  }
  const expectedWindowIndex = window.windowIndex;
  const maximumAcceptedStepCount =
    nominalDtSec === 0.0005
      ? 2_200
      : MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.maximumAcceptedStepCountPerRun;
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
  const completions: MainWireIntegratedModelPeriodicSteadyResultV3["cycles"][number]["coronaryAutoregulationWindow"][] =
    [];

  while (accepted.acceptedTimeSec < endTimeSec) {
    if (acceptedStepCount >= maximumAcceptedStepCount) {
      throw new Error("mechanical-energy cycle exceeded accepted-step bound");
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
    const maximum = limitMainWireIntegratedModelCandidateTimeV3(
      accepted,
      nominalTargetTimeSec,
      {
        configuration: fixture.rhythm.configuration,
        externalAfNextBoundaryTimeSec: null,
      },
      fixture.profile,
      fixture.config,
    );
    if (
      !(maximum.candidateTimeSec > accepted.acceptedTimeSec) ||
      maximum.candidateTimeSec > nominalTargetTimeSec
    ) {
      throw new Error("mechanical-energy scheduler returned an invalid step");
    }
    const previousAccepted = accepted;
    const acceptedDtSec = maximum.candidateTimeSec - accepted.acceptedTimeSec;
    const stepped = stepMainWireIntegratedModelV3(
      fixture.provider,
      accepted,
      analysisStepInputV1(fixture, maximum.candidateTimeSec),
    );
    if (stepped.converged === false) {
      throw new Error(
        `mechanical-energy step failed at ${accepted.acceptedTimeSec}s: ` +
          stepped.message,
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
        throw new Error("mechanical-energy completion flag lacks state");
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
    assertAnalysisAllOffAcceptedQv1(accepted);
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
    const sample = analysisTraceSampleV1(
      cycleIndex,
      acceptedStepCount,
      startTimeSec,
      fixture.cycleLengthSec,
      acceptedDtSec,
      stepped,
    );
    traceSamples.push(sample);
    notifyAnalysisAcceptedSuccessV1(
      observer,
      cycleIndex,
      acceptedStepCount,
      startTimeSec,
      endTimeSec,
      acceptedDtSec,
      previousAccepted,
      stepped,
      sample,
    );
    allRawValuesFinite = allRawValuesFinite && allNumericLeavesFiniteV1(sample);
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
    completions[0]!.windowIndex !== expectedWindowIndex ||
    completions[0]!.startTimeSec !== startTimeSec ||
    completions[0]!.endTimeSec !== endTimeSec ||
    !nearlyEqualAnalysisV1(
      completions[0]!.acceptedDurationSec,
      fixture.cycleLengthSec,
    )
  ) {
    throw new Error("mechanical-energy cycle/window boundary differs");
  }
  if (!oneComposedCalciumOwnerOnly || !allRawValuesFinite) {
    throw new Error("mechanical-energy cycle owner/finite gate failed");
  }
  if (!allDynamicMcsAcceptedFlowsExactlyZero) {
    throw new Error("mechanical-energy all-off cycle produced nonzero MCS q");
  }
  if (
    acceptedAtrialCaptureIds.length !== 1 ||
    acceptedVentricularCaptureIds.length !== 1 ||
    deliveredCalciumDepositIds.length !== 2 ||
    new Set(acceptedAtrialCaptureIds).size !==
      acceptedAtrialCaptureIds.length ||
    new Set(acceptedVentricularCaptureIds).size !==
      acceptedVentricularCaptureIds.length ||
    new Set(deliveredCalciumDepositIds).size !==
      deliveredCalciumDepositIds.length
  ) {
    throw new Error("mechanical-energy regular-sinus event identity differs");
  }
  const tolerance =
    MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.invariantTolerance;
  if (
    maximumGlobalTotalBloodVolumeErrorMl >
      tolerance.globalTotalBloodVolumeErrorMl ||
    maximumCoronaryBloodVolumeLedgerResidualMl >
      tolerance.coronaryBloodVolumeLedgerResidualMl ||
    maximumDynamicMcsConservationResidualMlPerSec >
      tolerance.dynamicMcsConservationResidualMlPerSec
  ) {
    throw new Error("mechanical-energy cycle exceeds conservation tolerance");
  }
  return deepFreezeAnalysisV1({
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

export async function runMainWireIntegratedModelPeriodicAnalysisContinuationV1(
  input: Readonly<{
    fixture: ReturnType<
      typeof createMainWireIntegratedModelRegularSinusAllOffFixtureV3
    >;
    sourceCheckpoint: MainWireIntegratedModelCheckpointV3;
    sourceCycleIndex: number;
    nominalDtSec: 0.001 | 0.0005;
    observer?: MainWireIntegratedModelAcceptedSuccessObserverV1;
  }>,
): Promise<MainWireIntegratedModelPeriodicAnalysisContinuationV1> {
  if (
    !Number.isSafeInteger(input.sourceCycleIndex) ||
    input.sourceCycleIndex < 0
  ) {
    throw new Error(
      "mechanical-energy analysis source cycle index must be nonnegative",
    );
  }
  const checkpointContext =
    createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
      input.fixture,
    );
  const restoredSource = await restoreMainWireIntegratedModelV3(
    checkpointContext,
    JSON.parse(canonicalJsonStringify(input.sourceCheckpoint)),
  );
  const replayedSourceCheckpoint = await checkpointMainWireIntegratedModelV3(
    checkpointContext,
    restoredSource,
  );
  if (
    canonicalJsonStringify(replayedSourceCheckpoint) !==
    canonicalJsonStringify(input.sourceCheckpoint)
  ) {
    throw new Error("mechanical-energy source checkpoint round-trip differs");
  }
  if (
    restoredSource.coronary.coronaryAutoregulation.windowIndex !==
    input.sourceCycleIndex
  ) {
    throw new Error(
      "mechanical-energy source checkpoint cycle/window identity differs",
    );
  }
  const bridgeCycle = runMainWireIntegratedModelPeriodicAnalysisCycleMirrorV1(
    input.fixture,
    restoredSource,
    input.sourceCycleIndex + 1,
    input.nominalDtSec,
    input.observer,
  );
  const measurementCycle =
    runMainWireIntegratedModelPeriodicAnalysisCycleMirrorV1(
      input.fixture,
      bridgeCycle.terminalAcceptedState,
      input.sourceCycleIndex + 2,
      input.nominalDtSec,
      input.observer,
    );
  assertDisjointAnalysisEventIdsV1(bridgeCycle, measurementCycle);
  const terminalCheckpoint = await checkpointMainWireIntegratedModelV3(
    checkpointContext,
    measurementCycle.terminalAcceptedState,
  );
  const restoredTerminal = await restoreMainWireIntegratedModelV3(
    checkpointContext,
    JSON.parse(canonicalJsonStringify(terminalCheckpoint)),
  );
  const replayedTerminalCheckpoint = await checkpointMainWireIntegratedModelV3(
    checkpointContext,
    restoredTerminal,
  );
  if (
    canonicalJsonStringify(replayedTerminalCheckpoint) !==
    canonicalJsonStringify(terminalCheckpoint)
  ) {
    throw new Error("mechanical-energy terminal checkpoint round-trip differs");
  }
  return deepFreezeAnalysisV1({
    sourceCycleIndex: input.sourceCycleIndex,
    sourceCheckpointExactRoundTripVerified: true as const,
    bridgeCycle,
    measurementCycle,
    terminalCheckpoint,
    terminalCheckpointExactRoundTripVerified: true as const,
  });
}

export async function runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyV1(
  input: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyRunInputV1,
): Promise<MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyResultV1> {
  const source = input.source;
  const sourceCycle = source.cycles.at(-1);
  const sourceObservation = source.observations.at(-1);
  const sourceCycleIndex = source.terminalCycleTrace.cycleIndex;
  const initialGates = emptyGatesV1();
  const failureReasons: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyFailureReasonV1[] =
    [];
  const numericalAccess = canonicalNumericalAccessV1(source.numericalAccess);
  const supportedDt =
    source.nominalDtSec === 0.001 || source.nominalDtSec === 0.0005;
  const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3(
    input.hemodynamicResearchInputs,
    input.ventricularContractilityScale,
    input.mechanismResearchInputs,
  );
  const normalDefaultFixture =
    createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
  const [
    expectedModelConditionIdentityHash,
    normalDefaultModelConditionIdentityHash,
    expectedProtocolIdentityHash,
  ] = await Promise.all([
    sha256CanonicalJsonHex(modelConditionIdentityPayloadV1(fixture)),
    sha256CanonicalJsonHex(
      modelConditionIdentityPayloadV1(normalDefaultFixture),
    ),
    sha256CanonicalJsonHex(
      Object.freeze({
        experimentId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V3_ID,
        executionPurpose: source.executionPurpose,
        nominalDtSec: source.nominalDtSec,
        maximumCycleCount: source.requestedMaximumCycleCount,
        periodicPolicy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
        referenceScales:
          MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
        provider: providerIdentityV1(fixture.provider),
        composedRhythmConfiguration: fixture.rhythm.configuration,
        dynamicMechanicalSupportProfile: fixture.profile,
        dynamicMechanicalSupportConfig: fixture.config,
        coronaryStepInput: fixture.coronaryStepInput,
        ...(numericalAccess?.refinementEvidenceOnly ? { numericalAccess } : {}),
      }),
    ),
  ]);
  const numericalAccessMatches =
    numericalAccess !== null &&
    canonicalJsonStringify(numericalAccess) ===
      canonicalJsonStringify(source.numericalAccess);
  const nominalDtWithinAccess =
    numericalAccess !== null &&
    source.nominalDtSec >= numericalAccess.minimumNominalDtSec &&
    source.nominalDtSec <= numericalAccess.maximumNominalDtSec;
  const refinementEvidenceAccess =
    numericalAccess?.accessId ===
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_REFINEMENT_ACCESS_V1_ID &&
    numericalAccess.refinementEvidenceOnly === true;
  const canonicalRequestedHorizon =
    source.requestedMaximumCycleCount ===
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.defaultMaximumCycleCount;
  const protocolIdentityValid =
    supportedDt &&
    numericalAccessMatches &&
    nominalDtWithinAccess &&
    refinementEvidenceAccess &&
    canonicalRequestedHorizon &&
    /^[0-9a-f]{64}$/.test(source.protocolIdentityHash) &&
    source.protocolIdentityHash === expectedProtocolIdentityHash;
  const modelConditionIdentityValid =
    /^[0-9a-f]{64}$/.test(source.modelConditionIdentityHash) &&
    source.modelConditionIdentityHash === expectedModelConditionIdentityHash;
  const normalDefaultConditionPassed =
    modelConditionIdentityValid &&
    source.modelConditionIdentityHash ===
      normalDefaultModelConditionIdentityHash;
  const canonicalLatestPeriod1Source =
    source.executionPurpose === "canonical-evidence" &&
    source.numericalPeriod1Established === true &&
    source.classification.status === "period1-converged" &&
    source.classification.latestCycleIndex === sourceCycleIndex &&
    source.classification.evidenceCycleIndices.at(-1) === sourceCycleIndex &&
    sourceCycle?.cycleIndex === sourceCycleIndex &&
    sourceObservation?.cycleIndex === sourceCycleIndex &&
    sourceObservation.evidenceRole === "canonical-periodic-protocol" &&
    sourceObservation.protocolIdentityHash === source.protocolIdentityHash;
  const sourceCycleIntegrityPassed =
    sourceCycle !== undefined &&
    Number.isSafeInteger(sourceCycleIndex) &&
    sourceCycleIndex > 0 &&
    source.allCyclesFiniteConservedAndEventExact &&
    sourceCycle.conservation.withinInheritedConstructionTolerances &&
    sourceCycle.finiteAndEventIdentityChecks.passed &&
    source.terminalCycleTrace.startTimeSec === sourceCycle.startTimeSec &&
    source.terminalCycleTrace.endTimeSec === sourceCycle.endTimeSec &&
    source.terminalCycleTrace.sampleCount === sourceCycle.acceptedStepCount &&
    source.terminalCycleTrace.samples.length ===
      sourceCycle.acceptedStepCount &&
    source.terminalCycleTrace.endTimeSec ===
      source.terminalAcceptedState.acceptedTimeSec &&
    source.terminalAcceptedState.coronary.coronaryAutoregulation.windowIndex ===
      sourceCycleIndex &&
    source.terminalAcceptedState.coronary.coronaryAutoregulation
      .windowStartAcceptedTimeSec ===
      source.terminalAcceptedState.acceptedTimeSec &&
    source.terminalAcceptedState.coronary.coronaryAutoregulation
      .acceptedDurationSec === 0 &&
    source.terminalAcceptedState.coronary.coronaryAutoregulation
      .acceptedStepCount === 0 &&
    source.terminalCycleTrace.samples.every(
      (sample, index) =>
        sample.cycleIndex === sourceCycleIndex &&
        sample.acceptedStepIndexWithinCycle === index + 1,
    );
  let sourceCheckpointExactParityPassed = false;
  try {
    const checkpointContext =
      createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
        fixture,
      );
    const checkpointFromTerminalAcceptedState =
      await checkpointMainWireIntegratedModelV3(
        checkpointContext,
        source.terminalAcceptedState,
      );
    sourceCheckpointExactParityPassed =
      source.terminalCheckpointExactRoundTripVerified === true &&
      /^[0-9a-f]{64}$/.test(source.terminalCheckpoint.checkpointSha256) &&
      checkpointFromTerminalAcceptedState.checkpointSha256 ===
        source.terminalCheckpoint.checkpointSha256 &&
      canonicalJsonStringify(checkpointFromTerminalAcceptedState) ===
        canonicalJsonStringify(source.terminalCheckpoint);
  } catch {
    sourceCheckpointExactParityPassed = false;
  }
  Object.assign(initialGates, {
    protocolIdentityValid,
    modelConditionIdentityValid,
    normalDefaultConditionPassed,
    canonicalLatestPeriod1Source,
    sourceCycleIntegrityPassed,
    sourceCheckpointExactParityPassed,
  });
  appendFailureV1(
    failureReasons,
    protocolIdentityValid,
    "protocol-identity-invalid",
  );
  appendFailureV1(
    failureReasons,
    modelConditionIdentityValid,
    "model-condition-identity-invalid",
  );
  appendFailureV1(
    failureReasons,
    normalDefaultConditionPassed,
    "normal-default-condition-required",
  );
  appendFailureV1(
    failureReasons,
    canonicalLatestPeriod1Source,
    "canonical-latest-period1-source-not-established",
  );
  appendFailureV1(
    failureReasons,
    sourceCycleIntegrityPassed,
    "source-cycle-integrity-failed",
  );
  appendFailureV1(
    failureReasons,
    sourceCheckpointExactParityPassed,
    "source-checkpoint-exact-parity-failed",
  );
  if (failureReasons.length > 0 || sourceCycle === undefined) {
    return notQualifiedV1(
      source,
      sourceCycleIndex,
      initialGates,
      failureReasons,
    );
  }

  const collector = new AcceptedMechanicalCollectorV1(
    source.terminalAcceptedState.revision,
    source.terminalAcceptedState.acceptedTimeSec,
    sourceCycleIndex + 1,
    sourceCycleIndex + 2,
  );
  let continuation: Awaited<
    ReturnType<typeof runMainWireIntegratedModelPeriodicAnalysisContinuationV1>
  >;
  try {
    continuation =
      await runMainWireIntegratedModelPeriodicAnalysisContinuationV1({
        fixture,
        sourceCheckpoint: source.terminalCheckpoint,
        sourceCycleIndex,
        nominalDtSec: source.nominalDtSec as 0.001 | 0.0005,
        observer: (observation) => collector.observe(observation),
      });
  } catch (error) {
    failureReasons.push(
      error instanceof MechanicalReadbackStructureErrorV1
        ? "mechanical-readback-structure-invalid"
        : "analysis-continuation-failed",
    );
    return notQualifiedV1(
      source,
      sourceCycleIndex,
      initialGates,
      failureReasons,
    );
  }

  try {
    return await qualifyCollectedMechanicalEnergyV1({
      source,
      sourceCycle,
      fixture,
      collector,
      continuation,
      expectedMaterialVolumesMl: wallMaterialVolumesMlV1(),
      initialGates,
      failureReasons,
    });
  } catch {
    failureReasons.push("analysis-qualification-failed");
    return notQualifiedV1(
      source,
      sourceCycleIndex,
      initialGates,
      failureReasons,
    );
  }
}

function canonicalNumericalAccessV1(
  source: MainWireIntegratedModelPeriodicNumericalAccessV3,
): MainWireIntegratedModelPeriodicNumericalAccessV3 | null {
  if (
    source.accessId ===
    "main-wire-integrated-model-periodic-standard-numerical-access-v3"
  ) {
    return Object.freeze({
      accessId:
        "main-wire-integrated-model-periodic-standard-numerical-access-v3" as const,
      minimumNominalDtSec:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.minimumNominalDtSec,
      maximumNominalDtSec:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.maximumNominalDtSec,
      maximumAcceptedStepCountPerCycle:
        MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.maximumAcceptedStepCountPerRun,
      refinementEvidenceOnly: false as const,
    });
  }
  if (
    source.accessId ===
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_REFINEMENT_ACCESS_V1_ID
  ) {
    return Object.freeze({
      accessId:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_REFINEMENT_ACCESS_V1_ID,
      minimumNominalDtSec: 0.0005,
      maximumNominalDtSec: 0.001,
      maximumAcceptedStepCountPerCycle: 2_200,
      refinementEvidenceOnly: true as const,
    });
  }
  return null;
}

function modelConditionIdentityPayloadV1(
  fixture: ReturnType<
    typeof createMainWireIntegratedModelRegularSinusAllOffFixtureV3
  >,
) {
  return Object.freeze({
    conditionIdentityId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CONDITION_IDENTITY_V1_ID,
    experimentId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V3_ID,
    hemodynamicResearchInputs: fixture.hemodynamicResearchInputs,
    ventricularContractilityScale: fixture.ventricularContractilityScale,
    mechanismResearchInputs: fixture.mechanismResearchInputs,
    provider: providerIdentityV1(fixture.provider),
    composedRhythmConfiguration: fixture.rhythm.configuration,
    dynamicMechanicalSupportProfile: fixture.profile,
    dynamicMechanicalSupportConfig: fixture.config,
    coronaryStepInput: fixture.coronaryStepInput,
  });
}

function providerIdentityV1(
  provider: ReturnType<
    typeof createMainWireIntegratedModelRegularSinusAllOffFixtureV3
  >["provider"],
) {
  return Object.freeze({
    contractId: provider.contractId,
    providerId: provider.providerId,
    parameterSetId: provider.parameterSetId,
    parameterIdentityHash: provider.parameterIdentityHash,
    stateSchemaVersion: provider.stateSchemaVersion,
  });
}

function emptyGatesV1(): {
  -readonly [
    K in keyof MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyGatesV1
  ]: boolean;
} {
  return {
    protocolIdentityValid: false,
    modelConditionIdentityValid: false,
    normalDefaultConditionPassed: false,
    canonicalLatestPeriod1Source: false,
    sourceCycleIntegrityPassed: false,
    sourceCheckpointExactParityPassed: false,
    continuationPeriod1Passed: false,
    acceptedPathTraceComplete: false,
    finiteAcceptedReadback: false,
    materialVolumeIdentityPassed: false,
    mechanicalSourceIdentityPassed: false,
    perStepSlsPassivityPassed: false,
    perStepSlsResidualReconstructionPassed: false,
    cycleIntegratedSlsDissipationNonnegative: false,
    equilibriumPassiveBackwardEulerRemainderNonnegative: false,
    algebraicResidualsPassed: false,
    measurementExternalWorkQualified: false,
    quadratureBridgePassed: false,
    continuationCheckpointExactParityPassed: false,
  };
}

function appendFailureV1(
  target: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyFailureReasonV1[],
  passed: boolean,
  reason: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyFailureReasonV1,
): void {
  if (!passed) target.push(reason);
}

function notQualifiedV1(
  source: MainWireIntegratedModelPeriodicSteadyResultV3,
  sourceCycleIndex: number,
  gates: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyGatesV1,
  failureReasons: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyFailureReasonV1[],
): MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyNotQualifiedV1 {
  return Object.freeze({
    qualificationId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_V1_ID,
    status: "not-qualified" as const,
    protocolIdentityHash: source.protocolIdentityHash,
    modelConditionIdentityHash: source.modelConditionIdentityHash,
    executionPurpose: source.executionPurpose,
    numericalAccessId: source.numericalAccess.accessId,
    requestedMaximumCycleCount: source.requestedMaximumCycleCount,
    nominalDtSec: source.nominalDtSec,
    sourceCycleIndex,
    sourceAcceptedStepCount: source.terminalCycleTrace.sampleCount,
    bridgeCycleIndex: null,
    bridgeAcceptedStepCount: null,
    measurementCycleIndex: null,
    measurementAcceptedStepCount: null,
    gates: Object.freeze({ ...gates }),
    materialVolumeBindingSha256: null,
    rawMechanicalTraceSha256: null,
    bridgeTerminalAcceptedStepSampleSha256: null,
    sourceCheckpointSha256: source.terminalCheckpoint.checkpointSha256,
    sourceCheckpoint: source.terminalCheckpoint,
    terminalCheckpointSha256: null,
    bridgeTerminalAcceptedStepSample: null,
    measurementAcceptedStepSamples: Object.freeze([]),
    measurementInputEvidence: null,
    materialVolumeBindingPayload: null,
    terminalCheckpoint: null,
    perStepSlsResidualEvidence: null,
    ledger: null,
    measurementExternalWork: null,
    physicalMetrics: Object.freeze([]),
    allFiveSlsBackwardEulerNumericalDissipationMilliJ: null,
    allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ: null,
    conjugacy: Object.freeze([]),
    algebraicResiduals: Object.freeze([]),
    quadratureBridges: Object.freeze([]),
    sourceCheckpointExactRoundTripVerified:
      gates.sourceCheckpointExactParityPassed,
    continuationCheckpointExactRoundTripVerified:
      gates.continuationCheckpointExactParityPassed,
    failureReasons: Object.freeze([...failureReasons]),
    policy:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_POLICY_V1,
    claim:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_CLAIM_V1,
  });
}

class AcceptedMechanicalCollectorV1 {
  readonly #observationsByCycle = new Map<
    number,
    AcceptedMechanicalObservationV1[]
  >();
  #lastAcceptedRevision: number;
  #lastAcceptedTimeSec: number;

  constructor(
    sourceAcceptedRevision: number,
    sourceAcceptedTimeSec: number,
    readonly bridgeCycleIndex: number,
    readonly measurementCycleIndex: number,
  ) {
    this.#lastAcceptedRevision = sourceAcceptedRevision;
    this.#lastAcceptedTimeSec = sourceAcceptedTimeSec;
  }

  observe(observation: MainWireIntegratedModelAcceptedSuccessObservationV1) {
    if (
      observation.cycleIndex !== this.bridgeCycleIndex &&
      observation.cycleIndex !== this.measurementCycleIndex
    ) {
      throw new Error("mechanical observer received an unexpected cycle");
    }
    const cycle = this.#observationsByCycle.get(observation.cycleIndex) ?? [];
    if (
      observation.acceptedStepIndexWithinCycle !== cycle.length + 1 ||
      observation.previousAcceptedRevision !== this.#lastAcceptedRevision ||
      observation.acceptedRevision !== this.#lastAcceptedRevision + 1 ||
      observation.previousAcceptedTimeSec !== this.#lastAcceptedTimeSec ||
      Math.abs(
        observation.acceptedTimeSec -
          observation.previousAcceptedTimeSec -
          observation.acceptedDtSec,
      ) >
        MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.invariantTolerance
          .acceptedOwnerClockSkewSec ||
      !(observation.acceptedTimeSec > observation.previousAcceptedTimeSec) ||
      observation.acceptedTimeSec > observation.cycleEndTimeSec ||
      (cycle.length === 0 &&
        observation.previousAcceptedTimeSec !== observation.cycleStartTimeSec)
    ) {
      throw new Error("mechanical observer accepted tuple is discontinuous");
    }
    const owned = acceptedMechanicalObservationV1(observation);
    cycle.push(owned);
    this.#observationsByCycle.set(observation.cycleIndex, cycle);
    this.#lastAcceptedRevision = observation.acceptedRevision;
    this.#lastAcceptedTimeSec = observation.acceptedTimeSec;
  }

  cycle(cycleIndex: number): readonly AcceptedMechanicalObservationV1[] {
    return Object.freeze([
      ...(this.#observationsByCycle.get(cycleIndex) ?? []),
    ]);
  }

  all(): readonly AcceptedMechanicalObservationV1[] {
    return Object.freeze([
      ...this.cycle(this.bridgeCycleIndex),
      ...this.cycle(this.measurementCycleIndex),
    ]);
  }
}

function acceptedMechanicalObservationV1(
  observation: MainWireIntegratedModelAcceptedSuccessObservationV1,
): AcceptedMechanicalObservationV1 {
  const step = observation.successfulStep.coronaryStep.baseStep;
  const circulation = step.circulationTrial;
  const mechanicsTrial = step.mechanicsTrial;
  const mechanics = providerReadbackV1(mechanicsTrial.diagnostics.readback);
  const wallReadback = mechanics.wallMaterialReadbackByWall;
  const sample = Object.freeze({
    nodeVolumeMl: Object.freeze({
      LA: circulation.candidateNodeVolumesMl.LA,
      LV: circulation.candidateNodeVolumesMl.LV,
      RA: circulation.candidateNodeVolumesMl.RA,
      RV: circulation.candidateNodeVolumesMl.RV,
    }),
    chamberTransmuralPressureMmHg: Object.freeze({
      ...mechanicsTrial.transmuralPressuresMmHg,
    }),
    commonPericardium: Object.freeze({
      excessPressureMmHg: step.pericardium.excessPressureMmHg,
      storedEnergyMilliJ: step.pericardium.storedEnergyJ * 1e3,
    }),
    wallStressPa: wallRecordV1((wallId) => {
      const wall = wallReadback[wallId];
      const equilibriumPassive =
        wall.totalKirchhoffStressPa -
        wall.landActiveKirchhoffStressPa -
        wall.slsOverstressPa;
      return Object.freeze({
        total: wall.totalKirchhoffStressPa,
        landActive: wall.landActiveKirchhoffStressPa,
        equilibriumPassive,
        parallelSls: wall.slsOverstressPa,
      });
    }),
    wallFiberLogStrain: Object.freeze({
      ...mechanics.effectiveFiberLogStrainByWall,
    }),
    wallEnergyLedgerDensity: wallRecordV1((wallId) => {
      const energy = wallReadback[wallId].energyLedger;
      return Object.freeze({
        equilibriumPassiveStoredEnergyDensityJPerM3:
          energy.equilibriumPassiveStoredEnergyDensityJPerM3,
        slsPreviousStoredEnergyDensityJPerM3:
          energy.slsPreviousStoredEnergyDensityJPerM3,
        slsNextStoredEnergyDensityJPerM3:
          energy.slsNextStoredEnergyDensityJPerM3,
        slsPhysicalDissipationIncrementDensityJPerM3:
          energy.slsPhysicalDissipationIncrementDensityJPerM3,
        slsBackwardEulerNumericalDissipationIncrementDensityJPerM3:
          energy.slsBackwardEulerNumericalDissipationIncrementDensityJPerM3,
        slsDiscreteEnergyBalanceResidualJPerM3:
          energy.slsDiscreteEnergyBalanceResidualJPerM3,
      });
    }),
  }) satisfies MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1;
  return Object.freeze({
    sample,
    source: Object.freeze({
      cycleIndex: observation.cycleIndex,
      acceptedStepIndexWithinCycle: observation.acceptedStepIndexWithinCycle,
      cycleStartTimeSec: observation.cycleStartTimeSec,
      cycleEndTimeSec: observation.cycleEndTimeSec,
      previousAcceptedRevision: observation.previousAcceptedRevision,
      acceptedRevision: observation.acceptedRevision,
      previousAcceptedTimeSec: observation.previousAcceptedTimeSec,
      acceptedTimeSec: observation.acceptedTimeSec,
      acceptedDtSec: observation.acceptedDtSec,
      candidateMaterialStateFingerprint:
        mechanicsTrial.candidateMaterialStateFingerprint,
      providerReadbackOwner: Object.freeze({
        providerModelId: mechanics.providerModelId,
        solveMode: mechanics.solveMode,
        hiddenBloodVolumeMl: mechanics.hiddenBloodVolumeMl,
        pistonVolumeApplied: mechanics.pistonVolumeApplied,
      }),
      mechanicsIdentity: Object.freeze({
        contractId: mechanicsTrial.contractId,
        providerId: mechanicsTrial.providerId,
        parameterSetId: mechanicsTrial.parameterSetId,
        parameterIdentityHash: mechanicsTrial.parameterIdentityHash,
        stateSchemaVersion: mechanicsTrial.stateSchemaVersion,
      }),
      wallSourceByWall: wallRecordV1((wallId) => {
        const wall = wallReadback[wallId];
        return Object.freeze({
          adapterId: wall.adapterId,
          wallId: wall.wallId,
          passiveModelId: wall.passiveModelId,
          passiveParameterIdentityHash: wall.passiveParameterIdentityHash,
          landParameterSetStableHash: wall.landParameterSetStableHash,
          slsPassive: wall.energyLedger.slsPassive,
          landThermodynamicStoredEnergyClaimed:
            wall.energyLedger.landThermodynamicStoredEnergyClaimed,
          totalThermodynamicPotentialIncludingLandClaimed:
            wall.energyLedger.totalThermodynamicPotentialIncludingLandClaimed,
        });
      }),
    }),
  });
}

class MechanicalReadbackStructureErrorV1 extends Error {}

type AnalysisProviderReadbackV1 = Readonly<{
  providerModelId: typeof MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID;
  solveMode: "trial";
  hiddenBloodVolumeMl: 0;
  pistonVolumeApplied: false;
  effectiveFiberLogStrainByWall: MainWireFiveWallMechanicalEnergyWallRecordV1<number>;
  wallMaterialReadbackByWall: MainWireFiveWallMechanicalEnergyWallRecordV1<MainWireNormalAdultWallMaterialReadbackV1>;
}>;

/** Analysis-only structural guard used before any ledger sample is admitted. */
export function assertMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyProviderReadbackV1(
  value: unknown,
): void {
  providerReadbackV1(value);
}

function providerReadbackV1(value: unknown): AnalysisProviderReadbackV1 {
  const record = readbackRecordV1(value, "provider readback");
  const providerClaim = readbackRecordV1(
    record.claim,
    "provider readback claim",
  );
  if (
    record.providerModelId !== MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID ||
    record.solveMode !== "trial" ||
    record.hiddenBloodVolumeMl !== 0 ||
    record.pistonVolumeApplied !== false ||
    !readbackCanonicalEqualsV1(
      providerClaim,
      MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM,
      "provider readback claim",
    )
  ) {
    throw new MechanicalReadbackStructureErrorV1(
      "mechanical observer provider owner fields differ",
    );
  }
  const effectiveFiberLogStrainByWall = readExactWallRecordV1(
    record.effectiveFiberLogStrainByWall,
    "effective fiber log strain",
    (item, label) => readbackFiniteNumberV1(item, label),
  );
  const wallMaterialReadbackByWall = readExactWallRecordV1(
    record.wallMaterialReadbackByWall,
    "wall material readback",
    (item, label) => materialReadbackV1(item, label),
  );
  return Object.freeze({
    providerModelId: MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
    solveMode: "trial" as const,
    hiddenBloodVolumeMl: 0 as const,
    pistonVolumeApplied: false as const,
    effectiveFiberLogStrainByWall,
    wallMaterialReadbackByWall,
  });
}

function materialReadbackV1(
  value: unknown,
  label: string,
): MainWireNormalAdultWallMaterialReadbackV1 {
  const record = readbackRecordV1(value, label);
  const energyRecord = readbackRecordV1(
    record.energyLedger,
    `${label} energy ledger`,
  );
  const adapterClaim = readbackRecordV1(record.claim, `${label} claim`);
  const adapterId = readbackStringV1(record.adapterId, `${label} adapterId`);
  const wallId = readbackStringV1(record.wallId, `${label} wallId`);
  const passiveModelId = readbackStringV1(
    record.passiveModelId,
    `${label} passiveModelId`,
  );
  if (
    adapterId !== MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID ||
    !MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.includes(
      wallId as MainWireFiveWallMechanicalEnergyWallIdV1,
    ) ||
    (passiveModelId !== "moyer-2015-atrial-equibiaxial-passive-v1" &&
      passiveModelId !== "equilibrium-one-fiber-passive-log-strain-v1") ||
    !readbackCanonicalEqualsV1(
      adapterClaim,
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM,
      `${label} claim`,
    )
  ) {
    throw new MechanicalReadbackStructureErrorV1(
      `${label} material owner fields differ`,
    );
  }
  const coldFixedInputIterations = readbackNullableFiniteNumberV1(
    record.coldFixedInputIterations,
    `${label} coldFixedInputIterations`,
  );
  const coldLandMaximumStateUpdate = readbackNullableFiniteNumberV1(
    record.coldLandMaximumStateUpdate,
    `${label} coldLandMaximumStateUpdate`,
  );
  return Object.freeze({
    adapterId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
    wallId: wallId as MainWireFiveWallMechanicalEnergyWallIdV1,
    passiveModelId,
    passiveParameterIdentityHash: readbackStringV1(
      record.passiveParameterIdentityHash,
      `${label} passiveParameterIdentityHash`,
    ),
    landParameterSetStableHash: readbackStringV1(
      record.landParameterSetStableHash,
      `${label} landParameterSetStableHash`,
    ),
    landActiveKirchhoffStressPa: readbackFiniteNumberV1(
      record.landActiveKirchhoffStressPa,
      `${label} landActiveKirchhoffStressPa`,
    ),
    slsOverstressPa: readbackFiniteNumberV1(
      record.slsOverstressPa,
      `${label} slsOverstressPa`,
    ),
    totalKirchhoffStressPa: readbackFiniteNumberV1(
      record.totalKirchhoffStressPa,
      `${label} totalKirchhoffStressPa`,
    ),
    energyLedger: Object.freeze({
      equilibriumPassiveStoredEnergyDensityJPerM3: readbackFiniteNumberV1(
        energyRecord.equilibriumPassiveStoredEnergyDensityJPerM3,
        `${label} equilibrium passive energy`,
      ),
      slsPreviousStoredEnergyDensityJPerM3: readbackFiniteNumberV1(
        energyRecord.slsPreviousStoredEnergyDensityJPerM3,
        `${label} SLS previous energy`,
      ),
      slsNextStoredEnergyDensityJPerM3: readbackFiniteNumberV1(
        energyRecord.slsNextStoredEnergyDensityJPerM3,
        `${label} SLS next energy`,
      ),
      slsPhysicalDissipationIncrementDensityJPerM3: readbackFiniteNumberV1(
        energyRecord.slsPhysicalDissipationIncrementDensityJPerM3,
        `${label} SLS physical dissipation`,
      ),
      slsBackwardEulerNumericalDissipationIncrementDensityJPerM3:
        readbackFiniteNumberV1(
          energyRecord.slsBackwardEulerNumericalDissipationIncrementDensityJPerM3,
          `${label} SLS BE numerical dissipation`,
        ),
      slsDiscreteEnergyBalanceResidualJPerM3: readbackFiniteNumberV1(
        energyRecord.slsDiscreteEnergyBalanceResidualJPerM3,
        `${label} SLS reported residual`,
      ),
      slsPassive: readbackBooleanV1(
        energyRecord.slsPassive,
        `${label} slsPassive`,
      ),
      landThermodynamicStoredEnergyClaimed: readbackFalseV1(
        energyRecord.landThermodynamicStoredEnergyClaimed,
        `${label} Land stored-energy claim`,
      ),
      totalThermodynamicPotentialIncludingLandClaimed: readbackFalseV1(
        energyRecord.totalThermodynamicPotentialIncludingLandClaimed,
        `${label} total Land potential claim`,
      ),
    }),
    coldFixedInputIterations,
    coldLandMaximumStateUpdate,
    claim: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM,
  });
}

function readbackRecordV1(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new MechanicalReadbackStructureErrorV1(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function readExactWallRecordV1<T>(
  value: unknown,
  label: string,
  parse: (value: unknown, label: string) => T,
): MainWireFiveWallMechanicalEnergyWallRecordV1<T> {
  const record = readbackRecordV1(value, label);
  const keys = Object.keys(record).sort();
  const expected = [
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1,
  ].sort();
  if (
    keys.length !== expected.length ||
    keys.some((key, index) => key !== expected[index])
  ) {
    throw new MechanicalReadbackStructureErrorV1(
      `${label} must contain exactly the five wall keys`,
    );
  }
  return wallRecordV1((wallId) => parse(record[wallId], `${label}.${wallId}`));
}

function readbackFiniteNumberV1(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new MechanicalReadbackStructureErrorV1(`${label} must be finite`);
  }
  return value;
}

function readbackNullableFiniteNumberV1(
  value: unknown,
  label: string,
): number | null {
  return value === null ? null : readbackFiniteNumberV1(value, label);
}

function readbackStringV1(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new MechanicalReadbackStructureErrorV1(
      `${label} must be a nonempty string`,
    );
  }
  return value;
}

function readbackBooleanV1(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new MechanicalReadbackStructureErrorV1(`${label} must be boolean`);
  }
  return value;
}

function readbackFalseV1(value: unknown, label: string): false {
  if (value !== false) {
    throw new MechanicalReadbackStructureErrorV1(`${label} must be false`);
  }
  return false;
}

function readbackCanonicalEqualsV1(
  actual: unknown,
  expected: unknown,
  label: string,
): boolean {
  try {
    return canonicalJsonStringify(actual) === canonicalJsonStringify(expected);
  } catch {
    throw new MechanicalReadbackStructureErrorV1(
      `${label} must be canonical JSON`,
    );
  }
}

function wallRecordV1<T>(
  build: (wallId: MainWireFiveWallMechanicalEnergyWallIdV1) => T,
): MainWireFiveWallMechanicalEnergyWallRecordV1<T> {
  return Object.freeze(
    Object.fromEntries(
      MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.map((wallId) => [
        wallId,
        build(wallId),
      ]),
    ),
  ) as MainWireFiveWallMechanicalEnergyWallRecordV1<T>;
}

function wallMaterialVolumesMlV1(): MainWireFiveWallMechanicalEnergyWallRecordV1<number> {
  const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
  return Object.freeze({
    LA: prior.anatomy.atria.LA.wallMaterialVolumeMl,
    LVFW:
      prior.anatomy.triSeg.wallGeometryParameters.LVFW.wallMaterialVolumeM3 *
      1e6,
    SEP:
      prior.anatomy.triSeg.wallGeometryParameters.SEP.wallMaterialVolumeM3 *
      1e6,
    RVFW:
      prior.anatomy.triSeg.wallGeometryParameters.RVFW.wallMaterialVolumeM3 *
      1e6,
    RA: prior.anatomy.atria.RA.wallMaterialVolumeMl,
  });
}

async function qualifyCollectedMechanicalEnergyV1(
  input: Readonly<{
    source: MainWireIntegratedModelPeriodicSteadyResultV3;
    sourceCycle: MainWireIntegratedModelPeriodicSteadyResultV3["cycles"][number];
    fixture: ReturnType<
      typeof createMainWireIntegratedModelRegularSinusAllOffFixtureV3
    >;
    collector: AcceptedMechanicalCollectorV1;
    continuation: Awaited<
      ReturnType<
        typeof runMainWireIntegratedModelPeriodicAnalysisContinuationV1
      >
    >;
    expectedMaterialVolumesMl: MainWireFiveWallMechanicalEnergyWallRecordV1<number>;
    initialGates: {
      -readonly [
        K in keyof MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyGatesV1
      ]: boolean;
    };
    failureReasons: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyFailureReasonV1[];
  }>,
): Promise<MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyResultV1> {
  const {
    source,
    sourceCycle,
    fixture,
    collector,
    continuation,
    expectedMaterialVolumesMl,
    initialGates: gates,
    failureReasons,
  } = input;
  const bridge = collector.cycle(collector.bridgeCycleIndex);
  const measurement = collector.cycle(collector.measurementCycleIndex);
  const bridgeTerminal = bridge.at(-1) ?? null;
  const measurementInputEvidence =
    bridgeTerminal === null
      ? null
      : Object.freeze({
          precedingAcceptedStepObservation: bridgeTerminal,
          measurementAcceptedStepObservations: measurement,
        });
  const measurementSamples = Object.freeze(
    measurement.map((item) => item.sample),
  );
  const bridgeRun = continuation.bridgeCycle;
  const measurementRun = continuation.measurementCycle;
  const acceptedPathTraceComplete =
    bridge.length === bridgeRun.acceptedStepCount &&
    measurement.length === measurementRun.acceptedStepCount &&
    bridgeTerminal !== null &&
    measurement.length > 0 &&
    bridgeTerminal.source.acceptedTimeSec === measurementRun.startTimeSec &&
    bridgeTerminal.source.acceptedRevision + 1 ===
      measurement[0]!.source.acceptedRevision &&
    measurement[0]!.source.previousAcceptedRevision ===
      bridgeTerminal.source.acceptedRevision &&
    measurement[0]!.source.previousAcceptedTimeSec ===
      bridgeTerminal.source.acceptedTimeSec &&
    observationsMatchRunTraceV1(bridge, bridgeRun.traceSamples) &&
    observationsMatchRunTraceV1(measurement, measurementRun.traceSamples);
  const finiteAcceptedReadback = collector
    .all()
    .every((item) => allNumericLeavesFiniteV1(item));
  const materialVolumeIdentityPassed =
    canonicalJsonStringify(expectedMaterialVolumesMl) ===
      canonicalJsonStringify(wallMaterialVolumesMlV1()) &&
    Object.values(expectedMaterialVolumesMl).every(
      (value) => Number.isFinite(value) && value > 0,
    ) &&
    typeof NORMAL_ADULT_FIVE_WALL_PRIOR_V1.parameterIdentityHash === "string" &&
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.parameterIdentityHash.length > 0;
  const mechanicalSourceIdentityPassed = collector
    .all()
    .every((item) => mechanicalSourceMatchesFixtureV1(item.source, fixture));
  const sls =
    bridgeTerminal === null
      ? Object.freeze({
          passed: false,
          passivityPassed: false,
          residualReconstructionPassed: false,
          evidence: null,
        })
      : assessMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPerStepSlsV1(
          bridgeTerminal,
          measurement,
        );
  gates.acceptedPathTraceComplete = acceptedPathTraceComplete;
  gates.finiteAcceptedReadback = finiteAcceptedReadback;
  gates.materialVolumeIdentityPassed = materialVolumeIdentityPassed;
  gates.mechanicalSourceIdentityPassed = mechanicalSourceIdentityPassed;
  gates.perStepSlsPassivityPassed = sls.passivityPassed;
  gates.perStepSlsResidualReconstructionPassed =
    sls.residualReconstructionPassed;
  appendFailureV1(
    failureReasons,
    acceptedPathTraceComplete,
    "accepted-path-trace-incomplete",
  );
  appendFailureV1(
    failureReasons,
    finiteAcceptedReadback,
    "accepted-readback-nonfinite",
  );
  appendFailureV1(
    failureReasons,
    materialVolumeIdentityPassed,
    "material-volume-identity-failed",
  );
  appendFailureV1(
    failureReasons,
    mechanicalSourceIdentityPassed,
    "mechanical-source-identity-failed",
  );
  appendFailureV1(
    failureReasons,
    sls.passivityPassed,
    "per-step-sls-passivity-failed",
  );
  appendFailureV1(
    failureReasons,
    sls.residualReconstructionPassed,
    "per-step-sls-residual-reconstruction-failed",
  );

  const materialVolumeBindingPayload = Object.freeze({
    priorId: NORMAL_ADULT_FIVE_WALL_PRIOR_V1.priorId,
    priorParameterIdentityHash:
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.parameterIdentityHash,
    provider: providerIdentityV1(fixture.provider),
    wallMaterialVolumeMlByWall: expectedMaterialVolumesMl,
  }) satisfies MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyMaterialVolumeBindingPayloadV1;
  const materialVolumeBindingSha256 = await sha256CanonicalJsonHex(
    materialVolumeBindingPayload,
  );
  const rawMechanicalTraceSha256 =
    finiteAcceptedReadback && measurementInputEvidence !== null
      ? await sha256CanonicalJsonHex(measurementInputEvidence)
      : null;
  const bridgeTerminalAcceptedStepSampleSha256 =
    bridgeTerminal === null || !finiteAcceptedReadback
      ? null
      : await sha256CanonicalJsonHex(bridgeTerminal.sample);
  if (
    !acceptedPathTraceComplete ||
    bridgeTerminal === null ||
    !finiteAcceptedReadback
  ) {
    return completedNotQualifiedV1({
      source,
      gates,
      failureReasons,
      bridgeTerminal,
      measurementSamples,
      measurementInputEvidence,
      materialVolumeBindingPayload,
      materialVolumeBindingSha256,
      rawMechanicalTraceSha256,
      bridgeTerminalAcceptedStepSampleSha256,
      terminalCheckpointSha256:
        continuation.terminalCheckpoint.checkpointSha256,
      terminalCheckpoint: continuation.terminalCheckpoint,
      perStepSlsResidualEvidence: sls.evidence,
    });
  }

  const ledger = measureMainWireFiveWallMechanicalEnergyLedgerV1({
    acceptedStepSamples: measurementSamples,
    precedingAcceptedStepSample: bridgeTerminal.sample,
    wallMaterialVolumeMlByWall: expectedMaterialVolumesMl,
  });
  gates.acceptedPathTraceComplete =
    gates.acceptedPathTraceComplete &&
    ledger.pairedAcceptedStepCount === measurementRun.acceptedStepCount &&
    ledger.acceptedStepSampleCount === measurementRun.acceptedStepCount &&
    ledger.stressWorkCoverageFraction === 1;
  const algebraicResiduals = algebraicResidualsV1(ledger);
  gates.algebraicResidualsPassed =
    algebraicResiduals.length > 0 &&
    algebraicResiduals.every((residual) => residual.passed);
  const allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ =
    MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.reduce(
      (sum, wallId) =>
        sum +
        ledger.perWall[wallId].equilibriumPassiveBackwardEulerRemainderMilliJ,
      0,
    );
  const dissipationToleranceMilliJ =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_POLICY_V1.algebraicResidualAbsoluteToleranceMilliJ;
  gates.cycleIntegratedSlsDissipationNonnegative =
    MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.every((wallId) => {
      const wall = ledger.perWall[wallId].parallelSls;
      return (
        Number.isFinite(wall.physicalDissipationMilliJ) &&
        Number.isFinite(wall.backwardEulerNumericalDissipationMilliJ) &&
        wall.physicalDissipationMilliJ >= -dissipationToleranceMilliJ &&
        wall.backwardEulerNumericalDissipationMilliJ >=
          -dissipationToleranceMilliJ
      );
    });
  gates.equilibriumPassiveBackwardEulerRemainderNonnegative =
    Number.isFinite(allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ) &&
    allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ >=
      -MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_POLICY_V1.algebraicResidualAbsoluteToleranceMilliJ;
  appendFailureV1(
    failureReasons,
    gates.acceptedPathTraceComplete,
    "accepted-path-trace-incomplete",
  );
  appendFailureV1(
    failureReasons,
    gates.cycleIntegratedSlsDissipationNonnegative,
    "cycle-integrated-sls-dissipation-negative",
  );
  appendFailureV1(
    failureReasons,
    gates.equilibriumPassiveBackwardEulerRemainderNonnegative,
    "equilibrium-passive-be-remainder-negative",
  );
  appendFailureV1(
    failureReasons,
    gates.algebraicResidualsPassed,
    "algebraic-residual-exceeded",
  );

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
  const bridgeObservation: MainWireIntegratedModelPeriodicCycleObservationV3 =
    Object.freeze({
      cycleIndex: collector.bridgeCycleIndex,
      evidenceRole: "canonical-periodic-protocol" as const,
      protocolIdentityHash: source.protocolIdentityHash,
      period1: compareMainWireIntegratedModelAcceptedStatesV3(
        bridgeRun.terminalAcceptedState,
        source.terminalAcceptedState,
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
        fixture.config,
      ),
      period2: null,
    });
  const measurementObservation: MainWireIntegratedModelPeriodicCycleObservationV3 =
    Object.freeze({
      cycleIndex: collector.measurementCycleIndex,
      evidenceRole: "canonical-periodic-protocol" as const,
      protocolIdentityHash: source.protocolIdentityHash,
      period1: compareMainWireIntegratedModelAcceptedStatesV3(
        measurementRun.terminalAcceptedState,
        bridgeRun.terminalAcceptedState,
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
        fixture.config,
      ),
      period2: compareMainWireIntegratedModelAcceptedStatesV3(
        measurementRun.terminalAcceptedState,
        source.terminalAcceptedState,
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
        fixture.config,
      ),
    });
  const classification = classifyMainWireIntegratedModelPeriodicityV3(
    Object.freeze([
      ...source.observations,
      bridgeObservation,
      measurementObservation,
    ]),
    classifierOptions,
  );
  gates.continuationPeriod1Passed =
    classification.status === "period1-converged" &&
    classification.latestCycleIndex === collector.measurementCycleIndex &&
    classification.evidenceCycleIndices.at(-1) ===
      collector.measurementCycleIndex;
  appendFailureV1(
    failureReasons,
    gates.continuationPeriod1Passed,
    "continuation-period1-failed",
  );
  const measurementCycle = cycleQualificationViewV1(
    collector.measurementCycleIndex,
    measurementRun,
  );
  const measurementTrace: MainWireIntegratedModelPeriodicTerminalCycleTraceV3 =
    Object.freeze({
      cycleIndex: collector.measurementCycleIndex,
      startTimeSec: measurementRun.startTimeSec,
      endTimeSec: measurementRun.endTimeSec,
      sampleCount: measurementRun.traceSamples.length,
      samples: measurementRun.traceSamples,
      retainedForGraphShapeInspection: true as const,
      resamplingApplied: false as const,
      shapeAcceptanceClaimed: false as const,
      interpretation:
        "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance" as const,
    });
  const bridgeTraceTerminal = bridgeRun.traceSamples.at(-1)!;
  const measurementExternalWork =
    qualifyMainWireIntegratedModelPeriodicExternalWorkV1({
      executionPurpose: source.executionPurpose,
      protocolIdentityHash: source.protocolIdentityHash,
      modelConditionIdentityHash: source.modelConditionIdentityHash,
      classification,
      terminalObservation: measurementObservation,
      terminalCycle: measurementCycle,
      terminalTrace: measurementTrace,
      startBoundary:
        periodicPressureVolumeBoundaryFromAcceptedTraceSampleV1(
          bridgeTraceTerminal,
        ),
    });
  gates.measurementExternalWorkQualified =
    measurementExternalWork.status === "qualified-biventricular" &&
    measurementExternalWork.biventricularExternalWorkEstablished;
  appendFailureV1(
    failureReasons,
    gates.measurementExternalWorkQualified,
    "measurement-external-work-not-qualified",
  );
  const quadratureBridges = quadratureBridgesV1(
    bridgeTerminal.sample,
    measurementSamples,
    ledger,
    measurementExternalWork,
  );
  gates.quadratureBridgePassed =
    quadratureBridges.length === 2 &&
    quadratureBridges.every((bridgeValue) => bridgeValue.passed);
  appendFailureV1(
    failureReasons,
    gates.quadratureBridgePassed,
    "pressure-volume-quadrature-bridge-failed",
  );
  gates.continuationCheckpointExactParityPassed =
    continuation.sourceCheckpointExactRoundTripVerified === true &&
    continuation.terminalCheckpointExactRoundTripVerified === true &&
    /^[0-9a-f]{64}$/.test(continuation.terminalCheckpoint.checkpointSha256) &&
    continuation.terminalCheckpoint.revision ===
      measurementRun.terminalAcceptedState.revision &&
    continuation.terminalCheckpoint.acceptedTimeSec ===
      measurementRun.terminalAcceptedState.acceptedTimeSec;
  appendFailureV1(
    failureReasons,
    gates.continuationCheckpointExactParityPassed,
    "continuation-checkpoint-exact-parity-failed",
  );
  const physicalMetrics = physicalMetricsV1(ledger);
  const conjugacy = conjugacyV1(ledger);
  const allFiveSlsBackwardEulerNumericalDissipationMilliJ =
    MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.reduce(
      (sum, wallId) =>
        sum +
        ledger.perWall[wallId].parallelSls
          .backwardEulerNumericalDissipationMilliJ,
      0,
    );
  const allGatesPassed = Object.values(gates).every(Boolean);
  const common = {
    qualificationId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_V1_ID,
    protocolIdentityHash: source.protocolIdentityHash,
    modelConditionIdentityHash: source.modelConditionIdentityHash,
    executionPurpose: source.executionPurpose,
    numericalAccessId: source.numericalAccess.accessId,
    requestedMaximumCycleCount: source.requestedMaximumCycleCount,
    nominalDtSec: source.nominalDtSec,
    sourceCycleIndex: sourceCycle.cycleIndex,
    sourceAcceptedStepCount: sourceCycle.acceptedStepCount,
    bridgeCycleIndex: collector.bridgeCycleIndex,
    bridgeAcceptedStepCount: bridgeRun.acceptedStepCount,
    measurementCycleIndex: collector.measurementCycleIndex,
    measurementAcceptedStepCount: measurementRun.acceptedStepCount,
    gates: Object.freeze({ ...gates }),
    materialVolumeBindingSha256,
    rawMechanicalTraceSha256,
    bridgeTerminalAcceptedStepSampleSha256,
    sourceCheckpointSha256: source.terminalCheckpoint.checkpointSha256,
    sourceCheckpoint: source.terminalCheckpoint,
    terminalCheckpointSha256: continuation.terminalCheckpoint.checkpointSha256,
    bridgeTerminalAcceptedStepSample: bridgeTerminal.sample,
    measurementAcceptedStepSamples: measurementSamples,
    measurementInputEvidence,
    materialVolumeBindingPayload,
    terminalCheckpoint: continuation.terminalCheckpoint,
    perStepSlsResidualEvidence: sls.evidence,
    ledger,
    measurementExternalWork,
    physicalMetrics,
    allFiveSlsBackwardEulerNumericalDissipationMilliJ,
    allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ,
    conjugacy,
    algebraicResiduals,
    quadratureBridges,
    sourceCheckpointExactRoundTripVerified:
      continuation.sourceCheckpointExactRoundTripVerified,
    continuationCheckpointExactRoundTripVerified:
      continuation.terminalCheckpointExactRoundTripVerified,
    failureReasons: Object.freeze([...new Set(failureReasons)]),
    policy:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_POLICY_V1,
    claim:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_CLAIM_V1,
  };
  return Object.freeze({
    ...common,
    status: allGatesPassed
      ? ("qualified-for-refinement-comparison" as const)
      : ("not-qualified" as const),
  }) as MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyResultV1;
}

function completedNotQualifiedV1(
  input: Readonly<{
    source: MainWireIntegratedModelPeriodicSteadyResultV3;
    gates: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyGatesV1;
    failureReasons: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyFailureReasonV1[];
    bridgeTerminal: AcceptedMechanicalObservationV1 | null;
    measurementSamples: readonly MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1[];
    measurementInputEvidence: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyMeasurementInputEvidenceV1 | null;
    materialVolumeBindingPayload: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyMaterialVolumeBindingPayloadV1;
    materialVolumeBindingSha256: string;
    rawMechanicalTraceSha256: string | null;
    bridgeTerminalAcceptedStepSampleSha256: string | null;
    terminalCheckpointSha256: string;
    terminalCheckpoint: MainWireIntegratedModelCheckpointV3;
    perStepSlsResidualEvidence: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPerStepSlsResidualEvidenceV1 | null;
  }>,
): MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyNotQualifiedV1 {
  const base = notQualifiedV1(
    input.source,
    input.source.terminalCycleTrace.cycleIndex,
    input.gates,
    input.failureReasons,
  );
  return Object.freeze({
    ...base,
    bridgeCycleIndex: input.source.terminalCycleTrace.cycleIndex + 1,
    bridgeAcceptedStepCount:
      input.bridgeTerminal === null
        ? null
        : input.bridgeTerminal.source.acceptedStepIndexWithinCycle,
    measurementCycleIndex: input.source.terminalCycleTrace.cycleIndex + 2,
    measurementAcceptedStepCount: input.measurementSamples.length,
    materialVolumeBindingSha256: input.materialVolumeBindingSha256,
    rawMechanicalTraceSha256: input.rawMechanicalTraceSha256,
    bridgeTerminalAcceptedStepSampleSha256:
      input.bridgeTerminalAcceptedStepSampleSha256,
    terminalCheckpointSha256: input.terminalCheckpointSha256,
    bridgeTerminalAcceptedStepSample: input.bridgeTerminal?.sample ?? null,
    measurementAcceptedStepSamples: input.measurementSamples,
    measurementInputEvidence: input.measurementInputEvidence,
    materialVolumeBindingPayload: input.materialVolumeBindingPayload,
    terminalCheckpoint: input.terminalCheckpoint,
    perStepSlsResidualEvidence: input.perStepSlsResidualEvidence,
  });
}

function observationsMatchRunTraceV1(
  observations: readonly AcceptedMechanicalObservationV1[],
  trace: MainWireIntegratedModelPeriodicTerminalCycleTraceV3["samples"],
): boolean {
  if (observations.length !== trace.length) return false;
  return observations.every((observation, index) => {
    const source = observation.source;
    const sample = observation.sample;
    const traceSample = trace[index]!;
    return (
      source.cycleIndex === traceSample.cycleIndex &&
      source.acceptedStepIndexWithinCycle ===
        traceSample.acceptedStepIndexWithinCycle &&
      source.acceptedTimeSec === traceSample.acceptedTimeSec &&
      source.acceptedDtSec === traceSample.acceptedDtSec &&
      canonicalJsonStringify(sample.nodeVolumeMl) ===
        canonicalJsonStringify(traceSample.chamberVolumeMl) &&
      sample.chamberTransmuralPressureMmHg.LV ===
        traceSample.transmuralPressureMmHg.LV &&
      sample.chamberTransmuralPressureMmHg.RV ===
        traceSample.transmuralPressureMmHg.RV
    );
  });
}

function allNumericLeavesFiniteV1(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    value === undefined
  )
    return true;
  if (Array.isArray(value)) return value.every(allNumericLeavesFiniteV1);
  if (typeof value !== "object") return false;
  return Object.values(value).every(allNumericLeavesFiniteV1);
}

function mechanicalSourceMatchesFixtureV1(
  source: AcceptedMechanicalSourceEvidenceV1,
  fixture: ReturnType<
    typeof createMainWireIntegratedModelRegularSinusAllOffFixtureV3
  >,
): boolean {
  if (
    canonicalJsonStringify(source.mechanicsIdentity) !==
      canonicalJsonStringify(providerIdentityV1(fixture.provider)) ||
    source.providerReadbackOwner.providerModelId !==
      MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID ||
    source.providerReadbackOwner.solveMode !== "trial" ||
    source.providerReadbackOwner.hiddenBloodVolumeMl !== 0 ||
    source.providerReadbackOwner.pistonVolumeApplied !== false ||
    !/^[0-9a-f]{8}$/.test(source.candidateMaterialStateFingerprint)
  )
    return false;
  return MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.every((wallId) => {
    const wall = source.wallSourceByWall[wallId];
    const atrial = wallId === "LA" || wallId === "RA";
    const expectedPassive = atrial
      ? NORMAL_ADULT_FIVE_WALL_PRIOR_V1.passive.atrial.compiled
      : NORMAL_ADULT_FIVE_WALL_PRIOR_V1.passive.ventricular.compiled;
    const expectedLandHash = atrial
      ? NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.atrialLand.parameterSetStableHash
      : NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularLand
          .parameterSetStableHash;
    return (
      wall.adapterId === MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID &&
      wall.wallId === wallId &&
      wall.passiveModelId === expectedPassive.modelId &&
      wall.passiveParameterIdentityHash ===
        expectedPassive.parameterIdentityHash &&
      wall.landParameterSetStableHash === expectedLandHash &&
      wall.slsPassive === true &&
      wall.landThermodynamicStoredEnergyClaimed === false &&
      wall.totalThermodynamicPotentialIncludingLandClaimed === false
    );
  });
}

export function assessMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPerStepSlsV1(
  preceding: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAcceptedObservationV1,
  observations: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAcceptedObservationV1[],
): Readonly<{
  passed: boolean;
  passivityPassed: boolean;
  residualReconstructionPassed: boolean;
  evidence: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPerStepSlsResidualEvidenceV1;
}> {
  let previous = preceding.sample;
  let passivityPassed = true;
  let residualReconstructionPassed = true;
  const perWallMutable = Object.fromEntries(
    MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.map((wallId) => [
      wallId,
      {
        assessedStepCount: 0,
        maximumAbsoluteReconstructedResidualDensityJPerM3: 0,
        maximumAbsoluteReadbackAgreementResidualDensityJPerM3: 0,
        maximumReconstructedResidualToleranceRatio: 0,
        maximumReadbackAgreementToleranceRatio: 0,
      },
    ]),
  ) as Record<
    MainWireFiveWallMechanicalEnergyWallIdV1,
    {
      assessedStepCount: number;
      maximumAbsoluteReconstructedResidualDensityJPerM3: number;
      maximumAbsoluteReadbackAgreementResidualDensityJPerM3: number;
      maximumReconstructedResidualToleranceRatio: number;
      maximumReadbackAgreementToleranceRatio: number;
    }
  >;
  for (const observation of observations) {
    const next = observation.sample;
    for (const wallId of MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1) {
      const energy = next.wallEnergyLedgerDensity[wallId];
      const previousEnergy = previous.wallEnergyLedgerDensity[wallId];
      const deltaStrain =
        next.wallFiberLogStrain[wallId] - previous.wallFiberLogStrain[wallId];
      const slsWorkIncrementDensity =
        next.wallStressPa[wallId].parallelSls * deltaStrain;
      const tolerance =
        1e-10 *
        Math.max(
          1,
          Math.abs(slsWorkIncrementDensity),
          Math.abs(energy.slsPreviousStoredEnergyDensityJPerM3),
          Math.abs(energy.slsNextStoredEnergyDensityJPerM3),
        );
      const storedEnergyChangeDensity =
        energy.slsNextStoredEnergyDensityJPerM3 -
        energy.slsPreviousStoredEnergyDensityJPerM3;
      const reconstructedResidualDensity =
        slsWorkIncrementDensity -
        storedEnergyChangeDensity -
        energy.slsPhysicalDissipationIncrementDensityJPerM3 -
        energy.slsBackwardEulerNumericalDissipationIncrementDensityJPerM3;
      const readbackAgreementResidualDensity =
        reconstructedResidualDensity -
        energy.slsDiscreteEnergyBalanceResidualJPerM3;
      const absoluteReconstructedResidual = Math.abs(
        reconstructedResidualDensity,
      );
      const absoluteReadbackAgreementResidual = Math.abs(
        readbackAgreementResidualDensity,
      );
      const reconstructedToleranceRatio =
        absoluteReconstructedResidual / tolerance;
      const readbackAgreementToleranceRatio =
        absoluteReadbackAgreementResidual / tolerance;
      const evidence = perWallMutable[wallId];
      evidence.assessedStepCount += 1;
      evidence.maximumAbsoluteReconstructedResidualDensityJPerM3 = Math.max(
        evidence.maximumAbsoluteReconstructedResidualDensityJPerM3,
        absoluteReconstructedResidual,
      );
      evidence.maximumAbsoluteReadbackAgreementResidualDensityJPerM3 = Math.max(
        evidence.maximumAbsoluteReadbackAgreementResidualDensityJPerM3,
        absoluteReadbackAgreementResidual,
      );
      evidence.maximumReconstructedResidualToleranceRatio = Math.max(
        evidence.maximumReconstructedResidualToleranceRatio,
        reconstructedToleranceRatio,
      );
      evidence.maximumReadbackAgreementToleranceRatio = Math.max(
        evidence.maximumReadbackAgreementToleranceRatio,
        readbackAgreementToleranceRatio,
      );
      const source = observation.source.wallSourceByWall[wallId];
      passivityPassed =
        passivityPassed &&
        source.slsPassive === true &&
        source.landThermodynamicStoredEnergyClaimed === false &&
        source.totalThermodynamicPotentialIncludingLandClaimed === false &&
        energy.slsPreviousStoredEnergyDensityJPerM3 ===
          previousEnergy.slsNextStoredEnergyDensityJPerM3 &&
        energy.slsPhysicalDissipationIncrementDensityJPerM3 >= -tolerance &&
        energy.slsBackwardEulerNumericalDissipationIncrementDensityJPerM3 >=
          -tolerance;
      residualReconstructionPassed =
        residualReconstructionPassed &&
        Math.abs(energy.slsDiscreteEnergyBalanceResidualJPerM3) <= tolerance &&
        Number.isFinite(reconstructedToleranceRatio) &&
        reconstructedToleranceRatio <= 1 &&
        Number.isFinite(readbackAgreementToleranceRatio) &&
        readbackAgreementToleranceRatio <= 1;
    }
    previous = next;
  }
  const perWall = wallRecordV1((wallId) =>
    Object.freeze({ ...perWallMutable[wallId] }),
  );
  const maxima = Object.values(perWall);
  return Object.freeze({
    passed: passivityPassed && residualReconstructionPassed,
    passivityPassed,
    residualReconstructionPassed,
    evidence: Object.freeze({
      assessedAcceptedStepCount: observations.length,
      assessedWallStepCount:
        observations.length *
        MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.length,
      maximumAbsoluteReconstructedResidualDensityJPerM3: Math.max(
        ...maxima.map(
          (item) => item.maximumAbsoluteReconstructedResidualDensityJPerM3,
        ),
      ),
      maximumAbsoluteReadbackAgreementResidualDensityJPerM3: Math.max(
        ...maxima.map(
          (item) => item.maximumAbsoluteReadbackAgreementResidualDensityJPerM3,
        ),
      ),
      maximumReconstructedResidualToleranceRatio: Math.max(
        ...maxima.map(
          (item) => item.maximumReconstructedResidualToleranceRatio,
        ),
      ),
      maximumReadbackAgreementToleranceRatio: Math.max(
        ...maxima.map((item) => item.maximumReadbackAgreementToleranceRatio),
      ),
      perWall,
    }),
  });
}

function algebraicResidualsV1(
  ledger: MainWireFiveWallMechanicalEnergyLedgerV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualV1[] {
  const tolerance =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_POLICY_V1.algebraicResidualAbsoluteToleranceMilliJ;
  const residuals: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualV1[] =
    [];
  for (const wallId of MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1) {
    const wall = ledger.perWall[wallId];
    for (const [residualId, valueMilliJ] of [
      [`wall.${wallId}.stress-assembly`, wall.stressAssemblyResidualMilliJ],
      [
        `wall.${wallId}.parallel-sls.reported-balance`,
        wall.parallelSls.reportedDiscreteBalanceResidualMilliJ,
      ],
      [
        `wall.${wallId}.parallel-sls.reconstructed-balance`,
        wall.parallelSls.reconstructedDiscreteBalanceResidualMilliJ,
      ],
      [
        `wall.${wallId}.parallel-sls.readback-agreement`,
        wall.parallelSls.readbackAgreementResidualMilliJ,
      ],
    ] as const) {
      residuals.push(
        Object.freeze({
          residualId,
          valueMilliJ,
          passed:
            Number.isFinite(valueMilliJ) && Math.abs(valueMilliJ) <= tolerance,
        }),
      );
    }
  }
  return Object.freeze(residuals);
}

function cycleQualificationViewV1(
  cycleIndex: number,
  run: Awaited<
    ReturnType<typeof runMainWireIntegratedModelPeriodicAnalysisContinuationV1>
  >["measurementCycle"],
) {
  const tolerance =
    MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.invariantTolerance;
  return Object.freeze({
    cycleIndex,
    startTimeSec: run.startTimeSec,
    endTimeSec: run.endTimeSec,
    acceptedStepCount: run.acceptedStepCount,
    conservation: Object.freeze({
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
    }),
    finiteAndEventIdentityChecks: Object.freeze({
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
    }),
  });
}

function quadratureBridgesV1(
  preceding: MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1,
  samples: readonly MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1[],
  ledger: MainWireFiveWallMechanicalEnergyLedgerV1,
  externalWork: MainWireIntegratedModelPeriodicExternalWorkResultV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgeV1[] {
  const conversion =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_POLICY_V1.pressureVolumeConversionMilliJPerMmHgMl;
  const tolerance =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_POLICY_V1.pressureVolumeBridgeAbsoluteToleranceMilliJ;
  const bridges: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgeV1[] =
    [];
  for (const chamber of ["LV", "RV"] as const) {
    const externalWorkMmHgMl =
      chamber === "LV"
        ? externalWork.leftVentricle.externalWorkMmHgMl
        : externalWork.rightVentricle.externalWorkMmHgMl;
    if (externalWorkMmHgMl === null) continue;
    let previous = preceding;
    let endpointCorrectionMilliJ = 0;
    for (const sample of samples) {
      endpointCorrectionMilliJ +=
        0.5 *
        (sample.chamberTransmuralPressureMmHg[chamber] -
          previous.chamberTransmuralPressureMmHg[chamber]) *
        (sample.nodeVolumeMl[chamber] - previous.nodeVolumeMl[chamber]) *
        conversion;
      previous = sample;
    }
    const backwardEulerCavityWorkOnWallMilliJ =
      ledger.cavityWorkOnWallMilliJ[chamber];
    const trapezoidalExternalWorkMilliJ = externalWorkMmHgMl * conversion;
    const residualMilliJ =
      backwardEulerCavityWorkOnWallMilliJ +
      trapezoidalExternalWorkMilliJ -
      endpointCorrectionMilliJ;
    bridges.push(
      Object.freeze({
        chamber,
        backwardEulerCavityWorkOnWallMilliJ,
        trapezoidalExternalWorkMilliJ,
        endpointCorrectionMilliJ,
        residualMilliJ,
        passed:
          Number.isFinite(residualMilliJ) &&
          Math.abs(residualMilliJ) <= tolerance,
      }),
    );
  }
  return Object.freeze(bridges);
}

function physicalMetricsV1(
  ledger: MainWireFiveWallMechanicalEnergyLedgerV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricV1[] {
  const metrics: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricV1[] =
    [];
  for (const wallId of MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1) {
    const wall = ledger.perWall[wallId];
    for (const component of [
      "total",
      "landActive",
      "equilibriumPassive",
      "parallelSls",
    ] as const) {
      const componentId = (
        {
          total: "total",
          landActive: "land-active",
          equilibriumPassive: "equilibrium-passive",
          parallelSls: "parallel-sls",
        } as const
      )[component];
      metrics.push(
        Object.freeze({
          metricId: `wall.${wallId}.stress-work.${componentId}`,
          valueMilliJ: wall.stressWorkOnWallMilliJ[component],
        }),
      );
    }
    metrics.push(
      Object.freeze({
        metricId: `wall.${wallId}.equilibrium-passive-stored-energy-change`,
        valueMilliJ: wall.equilibriumPassiveStoredEnergyChangeMilliJ,
      }),
    );
    metrics.push(
      Object.freeze({
        metricId: `wall.${wallId}.parallel-sls-stored-energy-change`,
        valueMilliJ: wall.parallelSls.storedEnergyChangeMilliJ,
      }),
    );
    metrics.push(
      Object.freeze({
        metricId: `wall.${wallId}.sls-physical-dissipation`,
        valueMilliJ: wall.parallelSls.physicalDissipationMilliJ,
      }),
    );
  }
  for (const chamber of MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_CHAMBER_IDS_V1) {
    metrics.push(
      Object.freeze({
        metricId: `cavity.${chamber}.work-on-wall`,
        valueMilliJ: ledger.cavityWorkOnWallMilliJ[chamber],
      }),
    );
  }
  const aggregates: readonly Readonly<{
    aggregateId: "all-five" | "ventricular-walls";
    walls: readonly MainWireFiveWallMechanicalEnergyWallIdV1[];
  }>[] = [
    Object.freeze({
      aggregateId: "all-five" as const,
      walls: MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1,
    }),
    Object.freeze({
      aggregateId: "ventricular-walls" as const,
      walls: Object.freeze(["LVFW", "SEP", "RVFW"] as const),
    }),
  ];
  for (const aggregate of aggregates) {
    for (const component of [
      "total",
      "landActive",
      "equilibriumPassive",
      "parallelSls",
    ] as const) {
      const componentId = (
        {
          total: "total",
          landActive: "land-active",
          equilibriumPassive: "equilibrium-passive",
          parallelSls: "parallel-sls",
        } as const
      )[component];
      metrics.push(
        Object.freeze({
          metricId: `aggregate.${aggregate.aggregateId}.stress-work.${componentId}`,
          valueMilliJ: aggregate.walls.reduce(
            (sum, wallId) =>
              sum + ledger.perWall[wallId].stressWorkOnWallMilliJ[component],
            0,
          ),
        }),
      );
    }
    metrics.push(
      Object.freeze({
        metricId: `aggregate.${aggregate.aggregateId}.equilibrium-passive-stored-energy-change`,
        valueMilliJ: aggregate.walls.reduce(
          (sum, wallId) =>
            sum +
            ledger.perWall[wallId].equilibriumPassiveStoredEnergyChangeMilliJ,
          0,
        ),
      }),
    );
    metrics.push(
      Object.freeze({
        metricId: `aggregate.${aggregate.aggregateId}.parallel-sls-stored-energy-change`,
        valueMilliJ: aggregate.walls.reduce(
          (sum, wallId) =>
            sum + ledger.perWall[wallId].parallelSls.storedEnergyChangeMilliJ,
          0,
        ),
      }),
    );
    metrics.push(
      Object.freeze({
        metricId: `aggregate.${aggregate.aggregateId}.sls-physical-dissipation`,
        valueMilliJ: aggregate.walls.reduce(
          (sum, wallId) =>
            sum + ledger.perWall[wallId].parallelSls.physicalDissipationMilliJ,
          0,
        ),
      }),
    );
  }
  return Object.freeze(metrics);
}

function conjugacyV1(
  ledger: MainWireFiveWallMechanicalEnergyLedgerV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyV1[] {
  const wall = ledger.perWall;
  const cavity = ledger.cavityWorkOnWallMilliJ;
  const leftAtrialWall = wall.LA.stressWorkOnWallMilliJ.total;
  const rightAtrialWall = wall.RA.stressWorkOnWallMilliJ.total;
  const ventricularWall =
    wall.LVFW.stressWorkOnWallMilliJ.total +
    wall.SEP.stressWorkOnWallMilliJ.total +
    wall.RVFW.stressWorkOnWallMilliJ.total;
  const ventricularCavity = cavity.LV + cavity.RV;
  const allWall = leftAtrialWall + ventricularWall + rightAtrialWall;
  const allCavity = cavity.LA + ventricularCavity + cavity.RA;
  return Object.freeze([
    Object.freeze({
      aggregateId: "left-atrium" as const,
      residualMilliJ: ledger.workConjugacyResidualMilliJ.leftAtrium,
      wallWorkMilliJ: leftAtrialWall,
      cavityWorkMilliJ: cavity.LA,
    }),
    Object.freeze({
      aggregateId: "right-atrium" as const,
      residualMilliJ: ledger.workConjugacyResidualMilliJ.rightAtrium,
      wallWorkMilliJ: rightAtrialWall,
      cavityWorkMilliJ: cavity.RA,
    }),
    Object.freeze({
      aggregateId: "ventricles-combined" as const,
      residualMilliJ:
        ledger.workConjugacyResidualMilliJ.ventricularWallsCombined,
      wallWorkMilliJ: ventricularWall,
      cavityWorkMilliJ: ventricularCavity,
    }),
    Object.freeze({
      aggregateId: "whole-heart" as const,
      residualMilliJ: ledger.workConjugacyResidualMilliJ.allFiveWalls,
      wallWorkMilliJ: allWall,
      cavityWorkMilliJ: allCavity,
    }),
  ]);
}

function analysisStepInputV1(
  fixture: ReturnType<
    typeof createMainWireIntegratedModelRegularSinusAllOffFixtureV3
  >,
  candidateTimeSec: number,
): MainWireIntegratedModelStepInputV3 {
  return Object.freeze({
    candidateTimeSec,
    coronary: fixture.coronaryStepInput,
    rhythm: Object.freeze({
      configuration: fixture.rhythm.configuration,
      externalAfNextBoundaryTimeSec: null,
      externalAtrialSourceBatch: null,
    }),
    dynamicMechanicalSupport: fixture.dynamicMechanicalSupport,
  });
}

function analysisTraceSampleV1(
  cycleIndex: number,
  acceptedStepIndexWithinCycle: number,
  cycleStartTimeSec: number,
  cycleLengthSec: number,
  acceptedDtSec: number,
  stepped: IntegratedSuccessfulStepV1,
): MainWireIntegratedModelPeriodicTerminalTraceSampleV3 {
  const base = stepped.coronaryStep.baseStep;
  const circulation = base.circulationTrial;
  const pressures = circulation.nodeAbsolutePressuresMmHg;
  const volumes = circulation.candidateNodeVolumesMl;
  const valves = circulation.valveEvaluations;
  const hydraulics = base.coronaryTrial.diagnostics.hydraulics;
  const candidate = stepped.composedRhythmCandidate;
  return deepFreezeAnalysisV1({
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
    transmuralPressureMmHg: {
      LV: base.mechanicsTrial.transmuralPressuresMmHg.LV,
      RV: base.mechanicsTrial.transmuralPressuresMmHg.RV,
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

function notifyAnalysisAcceptedSuccessV1(
  observer: MainWireIntegratedModelAcceptedSuccessObserverV1 | undefined,
  cycleIndex: number,
  acceptedStepIndexWithinCycle: number,
  cycleStartTimeSec: number,
  cycleEndTimeSec: number,
  acceptedDtSec: number,
  previousAccepted: IntegratedAcceptedStateV1,
  stepped: IntegratedSuccessfulStepV1,
  terminalTraceSample: MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
): void {
  if (observer === undefined) return;
  const accepted = stepped.acceptedState;
  const base = stepped.coronaryStep.baseStep;
  const mechanics = base.mechanicsTrial;
  if (
    stepped.mechanicsCommitted !== true ||
    stepped.circulationCommitted !== true ||
    stepped.coronaryCommitted !== true ||
    stepped.mvcReferenceCommitted !== true ||
    stepped.autoregulationCommitted !== true ||
    stepped.composedRhythmCommitted !== true ||
    stepped.dynamicMechanicalSupportCommitted !== true ||
    accepted.revision !== previousAccepted.revision + 1 ||
    Math.abs(
      accepted.acceptedTimeSec -
        previousAccepted.acceptedTimeSec -
        acceptedDtSec,
    ) >
      MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.invariantTolerance
        .acceptedOwnerClockSkewSec ||
    base.acceptedState.revision !== accepted.revision ||
    base.acceptedState.acceptedTimeSec !== accepted.acceptedTimeSec ||
    mechanics.baseRevision !== previousAccepted.revision ||
    mechanics.baseAcceptedTimeSec !== previousAccepted.acceptedTimeSec ||
    mechanics.candidateTimeSec !== accepted.acceptedTimeSec ||
    mechanics.stepDtSec !== acceptedDtSec ||
    terminalTraceSample.cycleIndex !== cycleIndex ||
    terminalTraceSample.acceptedStepIndexWithinCycle !==
      acceptedStepIndexWithinCycle ||
    terminalTraceSample.acceptedTimeSec !== accepted.acceptedTimeSec ||
    terminalTraceSample.acceptedDtSec !== acceptedDtSec
  ) {
    throw new Error(
      "mechanical-energy observer saw a discontinuous or uncommitted tuple",
    );
  }
  observer(
    Object.freeze({
      cycleIndex,
      acceptedStepIndexWithinCycle,
      cycleStartTimeSec,
      cycleEndTimeSec,
      acceptedDtSec,
      previousAcceptedRevision: previousAccepted.revision,
      previousAcceptedTimeSec: previousAccepted.acceptedTimeSec,
      acceptedRevision: accepted.revision,
      acceptedTimeSec: accepted.acceptedTimeSec,
      terminalTraceSample,
      successfulStep: stepped,
    }),
  );
}

function assertAnalysisAllOffAcceptedQv1(
  state: IntegratedAcceptedStateV1,
): void {
  if (
    !Object.values(state.dynamicMechanicalSupport.acceptedFlowMlPerSec).every(
      (value) => value === 0,
    )
  ) {
    throw new Error("mechanical-energy all-off accepted q must be zero");
  }
}

function assertDisjointAnalysisEventIdsV1(
  bridge: MainWireIntegratedModelRegularSinusAllOffCycleRunV3,
  measurement: MainWireIntegratedModelRegularSinusAllOffCycleRunV3,
): void {
  for (const [label, left, right] of [
    [
      "atrial capture",
      bridge.acceptedAtrialCaptureIds,
      measurement.acceptedAtrialCaptureIds,
    ],
    [
      "ventricular capture",
      bridge.acceptedVentricularCaptureIds,
      measurement.acceptedVentricularCaptureIds,
    ],
    [
      "calcium deposit",
      bridge.deliveredCalciumDepositIds,
      measurement.deliveredCalciumDepositIds,
    ],
  ] as const) {
    const seen = new Set(left);
    if (right.some((id) => seen.has(id))) {
      throw new Error(`mechanical-energy duplicate ${label} identity`);
    }
  }
}

function nearlyEqualAnalysisV1(left: number, right: number): boolean {
  return (
    Math.abs(left - right) <=
    64 * Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right))
  );
}

function deepFreezeAnalysisV1<T>(value: T): T {
  if (
    value !== null &&
    typeof value === "object" &&
    !ArrayBuffer.isView(value)
  ) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreezeAnalysisV1(child);
    }
    Object.freeze(value);
  }
  return value;
}
