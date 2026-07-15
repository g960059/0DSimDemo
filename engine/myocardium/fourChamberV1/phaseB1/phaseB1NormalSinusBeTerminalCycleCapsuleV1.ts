import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  assertCommittedPhaseB1BackwardEulerEventScheduleSuccessV1,
  type PhaseB1BackwardEulerEventScheduleRunnerSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerEventScheduleRunnerV1";
import type {
  PhaseB1BackwardEulerCommittedIntervalLedgerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerCommittedIntervalLedgerV1";
import {
  FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import {
  buildPhaseB1CompleteEndpointProjectionV1,
  buildPhaseB1CompleteEndpointScaleDescriptorV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1CompleteEndpointMetricV1";
import {
  advancePhaseB1NormalSinusBeLivePeriodicControllerV1,
  assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1,
  assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicFailureV1,
  assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicTerminalResultV1,
  initializePhaseB1NormalSinusBeLivePeriodicControllerV1,
  type PhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1,
  type PhaseB1NormalSinusBeLivePeriodicFailureV1,
  type PhaseB1NormalSinusBeLivePeriodicTerminalResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeLivePeriodicControllerV1";
import {
  phaseB1NormalSinusBePeriodicCheckpointHashPayloadV1,
  type PhaseB1NormalSinusBePeriodicCheckpointV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBePeriodicConvergenceV1";
import {
  assertBuilderIssuedPhaseB1NormalSinusCommittedSupercycleAuditV1,
  type PhaseB1NormalSinusCommittedSupercycleAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusCommittedSupercycleAuditV1";
import type {
  PhaseB1QuiescentReferenceEventFreeCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEventFreeCaseV1";
import {
  assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1,
  type PhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";
import {
  assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1,
  type PhaseB1QuiescentReferenceNumericalEvidenceBundleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceNumericalEvidenceV1";
import {
  validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  type PhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_NORMAL_SINUS_BE_TERMINAL_CYCLE_CAPSULE_V1_ID =
  "phase-b1-normal-sinus-be-terminal-cycle-capsule-v1" as const;

export const PHASE_B1_NORMAL_SINUS_BE_TERMINAL_CYCLE_CAPSULE_FAILURE_V1_ID =
  "phase-b1-normal-sinus-be-terminal-cycle-capsule-failure-v1" as const;

export const PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_EVIDENCE_V1_ID =
  "phase-b1-normal-sinus-be-paired-sls-periodic-evidence-v1" as const;

export const PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_FAILURE_V1_ID =
  "phase-b1-normal-sinus-be-paired-sls-periodic-failure-v1" as const;

export const PHASE_B1_NORMAL_SINUS_BE_PAIRED_SOURCE_PARITY_AUDIT_V1_ID =
  "phase-b1-normal-sinus-be-paired-initial-source-parity-audit-v1" as const;

export const PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_NOMINAL_DT_SEC_V1 =
  0.001 as const;

export const PHASE_B1_NORMAL_SINUS_BE_PAIRED_SOURCE_PARITY_NORMALIZED_TOLERANCE_V1 =
  1e-6 as const;

export const PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_MODE_ORDER_V1 =
  Object.freeze(["off", "on"] as const);

const CLAIM_BOUNDARY = deepFreeze({
  liveControllerRunToTerminalRequired: true,
  finalBuilderIssuedRunnerAndLedgerRequired: true,
  terminalArtifactsRequiredToBeRetainedInProcess: true,
  serializationReauthenticationSupported: false,
  maximumSupercyclesExhaustedIsFailure: true,
  pairedComparisonRequiresOneMillisecondBackwardEuler: true,
  pairedComparisonRequiresSameParentAndScheduleObjects: true,
  pairedInitialCommonCoordinateParityAuditRequired: true,
  nonSlsClosedLoopParameterParityClaimed: false,
  causalSlsEffectClaimed: false,
  singleStartPeriodOneCriterionMayPass: true,
  fullBeatAcceptanceClaimed: false,
  multiStartAcceptanceClaimed: false,
  timestepConvergenceClaimed: false,
  cycleEnergyAcceptanceClaimed: false,
  physiologicalValidationClaimed: false,
  phaseB1AcceptanceClaimed: false,
  modelCoreOrBrowserRuntimeAdopted: false,
  releaseRuntimeReachable: false,
  testOnly: true,
} as const);

export const PHASE_B1_NORMAL_SINUS_BE_TERMINAL_CYCLE_CAPSULE_POLICY_V1 =
  CLAIM_BOUNDARY;

const BUILDER_ISSUED_CAPSULES = new WeakSet<object>();
const BUILDER_ISSUED_CAPSULE_FAILURES = new WeakSet<object>();
const BUILDER_ISSUED_PAIRED_EVIDENCE = new WeakSet<object>();
const BUILDER_ISSUED_PAIRED_FAILURES = new WeakSet<object>();
const BUILDER_ISSUED_SOURCE_PARITY_AUDITS = new WeakSet<object>();

type SlsMode = "on" | "off";

export type PhaseB1NormalSinusBePairedSourceParityComponentV1 = Readonly<{
  index: number;
  label: string;
  slsOffValue: number;
  slsOnValue: number;
  scale: number;
  scaleFixedFromSlsOffPreRunRegistry: true;
  absoluteDifference: number;
  normalizedDistance: number;
}>;

export type PhaseB1NormalSinusBePairedSourceParityFlowComponentV1 = Readonly<{
  flowId: string;
  slsOffFlowM3PerSec: number;
  slsOnFlowM3PerSec: number;
  absoluteDifferenceM3PerSec: number;
  numericallyExactAcrossModes: boolean;
  exactZeroInBothModes: boolean;
}>;

export type PhaseB1NormalSinusBePairedSourceParityAuditPayloadV1 = Readonly<{
  auditId:
    typeof PHASE_B1_NORMAL_SINUS_BE_PAIRED_SOURCE_PARITY_AUDIT_V1_ID;
  parentManifestContentSha256: string;
  parentNumericalEvidenceContentSha256: string;
  scheduleContentSha256: string;
  slsOffProjectionContentSha256: string;
  slsOnProjectionContentSha256: string;
  commonScaleDescriptorContentSha256: string;
  slsOffProjectionScalarCount: 56;
  slsOnProjectionScalarCount: 61;
  slsOnExcludedSlsScalarCount: 5;
  comparedCommonScalarCount: 56;
  comparisonRule:
    "abs(on-off)/(fixed-off-scale+abs(off-value))";
  commonScaleSource: "canonical-sls-off-fixed-pre-run-registry";
  maximumNormalizedDistanceTolerance:
    typeof PHASE_B1_NORMAL_SINUS_BE_PAIRED_SOURCE_PARITY_NORMALIZED_TOLERANCE_V1;
  toleranceFixedBeforePeriodicRuns: true;
  commonComponents:
    readonly PhaseB1NormalSinusBePairedSourceParityComponentV1[];
  maximumNormalizedDistance: number;
  maximizingScalarIndex: number;
  maximizingScalarLabel: string;
  everyCommonLabelExactAcrossModes: true;
  oneCommonFixedScaleAppliedToBothModes: true;
  evaluatedFlowCount: 8;
  evaluatedFlowComponents:
    readonly PhaseB1NormalSinusBePairedSourceParityFlowComponentV1[];
  allEightInitialFlowsExactlyEqualAndZero: true;
  slsOffNonSlsClosedLoopParametersContentSha256: string;
  slsOnNonSlsClosedLoopParametersContentSha256: string;
  nonSlsClosedLoopParametersBitExact: boolean;
  nonSlsClosedLoopParametersContentHashesDiagnosticOnly: true;
  nonSlsClosedLoopParametersParityClaimed: false;
  commonWallMaterialBindingContentSha256: string;
  wallMaterialBindingBitExactAcrossModes: true;
  initialTimeExactZeroInBothModes: true;
  slsOffStatePhysicallyOmitsSlsCoordinates: true;
  slsOnStateContainsExactlyFiveSlsCoordinates: true;
  exactSlsTopologyInventoryVerified: true;
  initialCommonCoordinateParityPass: true;
  causalEffectOfSlsEstablished: false;
  physiologicalValidationPass: false;
  phaseB1AcceptancePass: false;
  releaseRuntimeReachable: false;
  testOnly: true;
  claimBoundary: typeof CLAIM_BOUNDARY;
}>;

export type PhaseB1NormalSinusBePairedSourceParityAuditV1 =
  PhaseB1NormalSinusBePairedSourceParityAuditPayloadV1 & Readonly<{
    contentSha256: string;
    parentManifest: PhaseB1QuiescentReferenceEvidenceManifestV1;
    parentNumericalEvidence:
      PhaseB1QuiescentReferenceNumericalEvidenceBundleV1;
    schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
    slsOffSourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1;
    slsOnSourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1;
  }>;

export type BuildPhaseB1NormalSinusBePairedSourceParityAuditInputV1 =
  Readonly<{
    parentManifest: PhaseB1QuiescentReferenceEvidenceManifestV1;
    parentNumericalEvidence:
      PhaseB1QuiescentReferenceNumericalEvidenceBundleV1;
    schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
    sha256Hex: CanonicalSha256HexProvider;
  }>;

export type PhaseB1NormalSinusBeTerminalCycleCapsulePayloadV1 = Readonly<{
  capsuleId: typeof PHASE_B1_NORMAL_SINUS_BE_TERMINAL_CYCLE_CAPSULE_V1_ID;
  parentManifestContentSha256: string;
  parentNumericalEvidenceContentSha256: string;
  scheduleContentSha256: string;
  definitionContentSha256: string;
  sourceWallMaterialBindingContentSha256: string;
  sourceNewtonScaleRegistryContentSha256: string;
  slsMode: SlsMode;
  nominalDtSec: number;
  completedSupercycleCount: number;
  finalCycleIndex: number;
  terminalStatus: "converged" | "maximum-supercycles-exhausted";
  terminalResultContentSha256: string;
  finalCommittedSupercycleAuditContentSha256: string;
  finalPeriodicCheckpointContentSha256: string;
  finalCycleEvidenceContentSha256: string;
  sourceScheduleRunnerAttemptTraceContentSha256: string;
  committedIntervalLedgerSummaryContentSha256: string;
  initialEndpointContentSha256: string;
  finalEndpointContentSha256: string;
  terminalResultCycleEvidenceHashCrossLinkVerified: true;
  cycleEvidenceAuditAndCheckpointHashCrossLinksVerified: true;
  auditRunnerAndLedgerHashCrossLinksVerified: true;
  finalEndpointHashCrossLinksVerified: true;
  sourceScheduleRunAuthenticatedInProcess: true;
  sourceScheduleRunObjectRetained: true;
  committedIntervalLedgerObjectRetained: true;
  sourceModelObjectIdentityRetained: true;
  sourceWallMaterialBindingObjectIdentityRetained: true;
  sourceRegistryObjectIdentityRetained: true;
  parentManifestAndNumericalObjectsRetained: true;
  parentModeSourceInverseObjectIdentityRetained: true;
  finalTerminalCheckpointObjectIdentityRetained: true;
  finalTerminalCycleEvidenceObjectIdentityRetained: true;
  liveSingleStartPeriodOneCriterionPass: boolean;
  terminalCycleConvergencePass: boolean;
  maximumSupercyclesExhaustedFailure: boolean;
  fullBeatAcceptancePass: false;
  normalSinusMultiStartAcceptancePass: false;
  timestepConvergenceAcceptancePass: false;
  cycleEnergyAcceptancePass: false;
  physiologicalValidationPass: false;
  phaseB1AcceptancePass: false;
  modelCoreIntegration: false;
  browserRuntimeAdopted: false;
  releaseRuntimeReachable: false;
  testOnly: true;
  claimBoundary: typeof CLAIM_BOUNDARY;
}>;

export type PhaseB1NormalSinusBeTerminalCycleCapsuleV1 =
  PhaseB1NormalSinusBeTerminalCycleCapsulePayloadV1 & Readonly<{
    contentSha256: string;
    parentManifest: PhaseB1QuiescentReferenceEvidenceManifestV1;
    parentNumericalEvidence:
      PhaseB1QuiescentReferenceNumericalEvidenceBundleV1;
    schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
    sourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1;
    terminalResult: PhaseB1NormalSinusBeLivePeriodicTerminalResultV1;
    finalCommittedSupercycleAudit:
      PhaseB1NormalSinusCommittedSupercycleAuditV1;
    finalPeriodicCheckpoint: PhaseB1NormalSinusBePeriodicCheckpointV1;
    finalCycleEvidence: PhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1;
    sourceScheduleRun: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1;
    committedIntervalLedger:
      PhaseB1BackwardEulerCommittedIntervalLedgerV1;
  }>;

export type RunPhaseB1NormalSinusBeTerminalCycleCapsuleInputV1 = Readonly<{
  parentManifest: PhaseB1QuiescentReferenceEvidenceManifestV1;
  parentNumericalEvidence:
    PhaseB1QuiescentReferenceNumericalEvidenceBundleV1;
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
  slsMode: SlsMode;
  nominalDtSec: number;
  sha256Hex: CanonicalSha256HexProvider;
}>;

export type FinalizePhaseB1NormalSinusBeTerminalCycleFromRetainedArtifactsInputV1 =
  Readonly<{
    parentManifest: PhaseB1QuiescentReferenceEvidenceManifestV1;
    parentNumericalEvidence:
      PhaseB1QuiescentReferenceNumericalEvidenceBundleV1;
    schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
    sourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1;
    terminalResult: PhaseB1NormalSinusBeLivePeriodicTerminalResultV1;
    finalCommittedSupercycleAudit:
      PhaseB1NormalSinusCommittedSupercycleAuditV1;
    finalPeriodicCheckpoint: PhaseB1NormalSinusBePeriodicCheckpointV1;
    finalCycleEvidence: PhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1;
    sha256Hex: CanonicalSha256HexProvider;
  }>;

export type PhaseB1NormalSinusBeTerminalCycleCapsuleFailurePayloadV1 =
  Readonly<{
    failureId:
      typeof PHASE_B1_NORMAL_SINUS_BE_TERMINAL_CYCLE_CAPSULE_FAILURE_V1_ID;
    parentManifestContentSha256: string;
    parentNumericalEvidenceContentSha256: string;
    scheduleContentSha256: string;
    slsMode: SlsMode;
    nominalDtSec: number;
    failureKind:
      | "live-periodic-cycle-failure"
      | "maximum-supercycles-exhausted";
    livePeriodicFailureContentSha256: string | null;
    terminalCycleCapsuleContentSha256: string | null;
    terminalResultContentSha256: string | null;
    capExhaustionAcceptedAsSuccess: false;
    liveSingleStartPeriodOneCriterionPass: false;
    fullBeatAcceptancePass: false;
    normalSinusMultiStartAcceptancePass: false;
    timestepConvergenceAcceptancePass: false;
    cycleEnergyAcceptancePass: false;
    physiologicalValidationPass: false;
    phaseB1AcceptancePass: false;
    modelCoreIntegration: false;
    browserRuntimeAdopted: false;
    releaseRuntimeReachable: false;
    testOnly: true;
    claimBoundary: typeof CLAIM_BOUNDARY;
  }>;

export type PhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1 =
  PhaseB1NormalSinusBeTerminalCycleCapsuleFailurePayloadV1 & Readonly<{
    contentSha256: string;
    livePeriodicFailure: PhaseB1NormalSinusBeLivePeriodicFailureV1 | null;
    terminalCycleCapsule: PhaseB1NormalSinusBeTerminalCycleCapsuleV1 | null;
  }>;

export type RunPhaseB1NormalSinusBeTerminalCycleCapsuleResultV1 =
  | Readonly<{
    completed: true;
    capsule: PhaseB1NormalSinusBeTerminalCycleCapsuleV1;
    failure: null;
  }>
  | Readonly<{
    completed: false;
    capsule: null;
    failure: PhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1;
  }>;

export type PhaseB1NormalSinusBePairedPeriodicEvidencePayloadV1 = Readonly<{
  evidenceId: typeof PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_EVIDENCE_V1_ID;
  parentManifestContentSha256: string;
  parentNumericalEvidenceContentSha256: string;
  scheduleContentSha256: string;
  nominalDtSec:
    typeof PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_NOMINAL_DT_SEC_V1;
  modeOrder:
    typeof PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_MODE_ORDER_V1;
  slsOffTerminalCycleCapsuleContentSha256: string;
  slsOnTerminalCycleCapsuleContentSha256: string;
  slsOffTerminalResultContentSha256: string;
  slsOnTerminalResultContentSha256: string;
  sameParentManifestObjectIdentity: true;
  sameParentNumericalEvidenceObjectIdentity: true;
  sameScheduleObjectIdentity: true;
  parentModeSourceCasesSelectedWithoutCrossModeSwap: true;
  initialSourceParityAuditContentSha256: string;
  initialCommonCoordinateCount: 56;
  initialCommonCoordinateMaximumNormalizedDistance: number;
  initialCommonCoordinateMaximizingScalarLabel: string;
  initialCommonCoordinateMaximumNormalizedDistanceTolerance:
    typeof PHASE_B1_NORMAL_SINUS_BE_PAIRED_SOURCE_PARITY_NORMALIZED_TOLERANCE_V1;
  commonWallMaterialBindingContentSha256: string;
  exactSlsTopologyInventoryVerified: true;
  allEightInitialFlowsExactlyEqualAndZero: true;
  pairedCanonicalParentAndInitialCommonCoordinateParityPass: true;
  causalEffectOfSlsEstablished: false;
  bothSingleStartPeriodOneCriteriaPass: true;
  pairedOneMillisecondPeriodicEvidencePass: true;
  fullBeatAcceptancePass: false;
  normalSinusMultiStartAcceptancePass: false;
  timestepConvergenceAcceptancePass: false;
  cycleEnergyAcceptancePass: false;
  physiologicalValidationPass: false;
  phaseB1AcceptancePass: false;
  modelCoreIntegration: false;
  browserRuntimeAdopted: false;
  releaseRuntimeReachable: false;
  testOnly: true;
  claimBoundary: typeof CLAIM_BOUNDARY;
}>;

export type PhaseB1NormalSinusBePairedPeriodicEvidenceV1 =
  PhaseB1NormalSinusBePairedPeriodicEvidencePayloadV1 & Readonly<{
    contentSha256: string;
    parentManifest: PhaseB1QuiescentReferenceEvidenceManifestV1;
    parentNumericalEvidence:
      PhaseB1QuiescentReferenceNumericalEvidenceBundleV1;
    schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
    initialSourceParityAudit:
      PhaseB1NormalSinusBePairedSourceParityAuditV1;
    slsOff: PhaseB1NormalSinusBeTerminalCycleCapsuleV1;
    slsOn: PhaseB1NormalSinusBeTerminalCycleCapsuleV1;
  }>;

type ModeRunOutcome = RunPhaseB1NormalSinusBeTerminalCycleCapsuleResultV1;

export type PhaseB1NormalSinusBePairedPeriodicFailurePayloadV1 = Readonly<{
  failureId: typeof PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_FAILURE_V1_ID;
  parentManifestContentSha256: string;
  parentNumericalEvidenceContentSha256: string;
  scheduleContentSha256: string;
  nominalDtSec:
    typeof PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_NOMINAL_DT_SEC_V1;
  modeOrder:
    typeof PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_MODE_ORDER_V1;
  slsOffOutcomeContentSha256: string;
  slsOnOutcomeContentSha256: string;
  slsOffConverged: boolean;
  slsOnConverged: boolean;
  sameParentManifestObjectPassedToBothRuns: true;
  sameParentNumericalEvidenceObjectPassedToBothRuns: true;
  sameScheduleObjectPassedToBothRuns: true;
  initialSourceParityAuditContentSha256: string;
  initialCommonCoordinateCount: 56;
  initialCommonCoordinateMaximumNormalizedDistance: number;
  initialCommonCoordinateMaximizingScalarLabel: string;
  initialCommonCoordinateMaximumNormalizedDistanceTolerance:
    typeof PHASE_B1_NORMAL_SINUS_BE_PAIRED_SOURCE_PARITY_NORMALIZED_TOLERANCE_V1;
  exactSlsTopologyInventoryVerified: true;
  allEightInitialFlowsExactlyEqualAndZero: true;
  pairedCanonicalParentAndInitialCommonCoordinateParityPass: true;
  causalEffectOfSlsEstablished: false;
  pairedOneMillisecondPeriodicEvidencePass: false;
  capExhaustionAcceptedAsSuccess: false;
  fullBeatAcceptancePass: false;
  normalSinusMultiStartAcceptancePass: false;
  timestepConvergenceAcceptancePass: false;
  cycleEnergyAcceptancePass: false;
  physiologicalValidationPass: false;
  phaseB1AcceptancePass: false;
  modelCoreIntegration: false;
  browserRuntimeAdopted: false;
  releaseRuntimeReachable: false;
  testOnly: true;
  claimBoundary: typeof CLAIM_BOUNDARY;
}>;

export type PhaseB1NormalSinusBePairedPeriodicFailureV1 =
  PhaseB1NormalSinusBePairedPeriodicFailurePayloadV1 & Readonly<{
    contentSha256: string;
    parentManifest: PhaseB1QuiescentReferenceEvidenceManifestV1;
    parentNumericalEvidence:
      PhaseB1QuiescentReferenceNumericalEvidenceBundleV1;
    schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
    initialSourceParityAudit:
      PhaseB1NormalSinusBePairedSourceParityAuditV1;
    slsOff: ModeRunOutcome;
    slsOn: ModeRunOutcome;
  }>;

export type RunPhaseB1NormalSinusBePairedPeriodicEvidenceInputV1 = Readonly<{
  parentManifest: PhaseB1QuiescentReferenceEvidenceManifestV1;
  parentNumericalEvidence:
    PhaseB1QuiescentReferenceNumericalEvidenceBundleV1;
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
  sha256Hex: CanonicalSha256HexProvider;
}>;

export type FinalizePhaseB1NormalSinusBePairedPeriodicEvidenceFromRetainedCapsulesInputV1 =
  Readonly<{
    parentManifest: PhaseB1QuiescentReferenceEvidenceManifestV1;
    parentNumericalEvidence:
      PhaseB1QuiescentReferenceNumericalEvidenceBundleV1;
    schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
    initialSourceParityAudit:
      PhaseB1NormalSinusBePairedSourceParityAuditV1;
    slsOff: PhaseB1NormalSinusBeTerminalCycleCapsuleV1;
    slsOn: PhaseB1NormalSinusBeTerminalCycleCapsuleV1;
    sha256Hex: CanonicalSha256HexProvider;
  }>;

export type RunPhaseB1NormalSinusBePairedPeriodicEvidenceResultV1 =
  | Readonly<{
    completed: true;
    evidence: PhaseB1NormalSinusBePairedPeriodicEvidenceV1;
    failure: null;
  }>
  | Readonly<{
    completed: false;
    evidence: null;
    failure: PhaseB1NormalSinusBePairedPeriodicFailureV1;
  }>;

/**
 * Finalizes the terminal cycle already executed by the live controller.
 *
 * This is deliberately an in-process retained-object boundary. It accepts no
 * caller-supplied mode, timestep, convergence, or claim booleans, and it does
 * not rerun a numerical cycle. Every terminal artifact is reauthenticated by
 * its issuing builder and cross-linked to the retained runner and ledger by
 * `issueTerminalCycleCapsule`. A terminal cap is represented by the existing
 * failure union and can never be promoted to a successful capsule result.
 */
export function finalizePhaseB1NormalSinusBeTerminalCycleFromRetainedArtifactsV1(
  input:
    FinalizePhaseB1NormalSinusBeTerminalCycleFromRetainedArtifactsInputV1,
): RunPhaseB1NormalSinusBeTerminalCycleCapsuleResultV1 {
  assertExactPlainRecordV1(input, [
    "parentManifest",
    "parentNumericalEvidence",
    "schedule",
    "sourceCase",
    "terminalResult",
    "finalCommittedSupercycleAudit",
    "finalPeriodicCheckpoint",
    "finalCycleEvidence",
    "sha256Hex",
  ], "Phase B1 retained terminal-cycle artifact finalization input");
  requireSha256Provider(input.sha256Hex);
  const parentManifest =
    assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(
      input.parentManifest,
    );
  const parentNumericalEvidence =
    assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1(
      input.parentNumericalEvidence,
      parentManifest,
    );
  const schedule = validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    input.schedule,
    input.sha256Hex,
  );
  const terminalResult =
    assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicTerminalResultV1(
      input.terminalResult,
      input.sha256Hex,
    );
  const finalCommittedSupercycleAudit =
    assertBuilderIssuedPhaseB1NormalSinusCommittedSupercycleAuditV1(
      input.finalCommittedSupercycleAudit,
      input.sha256Hex,
    );
  const finalCycleEvidence =
    assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1(
      input.finalCycleEvidence,
      input.sha256Hex,
    );
  const capsule = issueTerminalCycleCapsule({
    parentManifest,
    parentNumericalEvidence,
    schedule,
    sourceCase: input.sourceCase,
    terminalResult,
    finalCommittedSupercycleAudit,
    finalPeriodicCheckpoint: input.finalPeriodicCheckpoint,
    finalCycleEvidence,
    sha256Hex: input.sha256Hex,
  });
  if (capsule.terminalStatus === "maximum-supercycles-exhausted") {
    return Object.freeze({
      completed: false as const,
      capsule: null,
      failure: issueCapsuleFailure({
        parentManifest,
        parentNumericalEvidence,
        schedule,
        slsMode: capsule.slsMode,
        nominalDtSec: capsule.nominalDtSec,
        livePeriodicFailure: null,
        terminalCycleCapsule: capsule,
        sha256Hex: input.sha256Hex,
      }),
    });
  }
  if (capsule.terminalCycleConvergencePass !== true) {
    throw new Error(
      "converged terminal-cycle capsule lacks its single-start criterion",
    );
  }
  return Object.freeze({
    completed: true as const,
    capsule,
    failure: null,
  });
}

export function runPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
  input: RunPhaseB1NormalSinusBeTerminalCycleCapsuleInputV1,
): RunPhaseB1NormalSinusBeTerminalCycleCapsuleResultV1 {
  assertExactPlainRecordV1(input, [
    "parentManifest",
    "parentNumericalEvidence",
    "schedule",
    "slsMode",
    "nominalDtSec",
    "sha256Hex",
  ], "Phase B1 terminal-cycle capsule input");
  requireSha256Provider(input.sha256Hex);
  const parentManifest =
    assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(
      input.parentManifest,
    );
  const parentNumericalEvidence =
    assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1(
      input.parentNumericalEvidence,
      parentManifest,
    );
  const schedule = validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    input.schedule,
    input.sha256Hex,
  );
  const slsMode = requireSlsMode(input.slsMode);
  let controller = initializePhaseB1NormalSinusBeLivePeriodicControllerV1({
    sourceCase: parentNumericalEvidence.results[slsMode].eventFreeCase,
    schedule,
    nominalDtSec: input.nominalDtSec,
    sha256Hex: input.sha256Hex,
  });
  const sourceCase = controller.sourceCase;

  while (true) {
    const advanced = advancePhaseB1NormalSinusBeLivePeriodicControllerV1({
      controller,
      sha256Hex: input.sha256Hex,
    });
    if (advanced.completedCycle === false) {
      return Object.freeze({
        completed: false as const,
        capsule: null,
        failure: issueCapsuleFailure({
          parentManifest,
          parentNumericalEvidence,
          schedule,
          slsMode,
          nominalDtSec: input.nominalDtSec,
          livePeriodicFailure: advanced.failure,
          terminalCycleCapsule: null,
          sha256Hex: input.sha256Hex,
        }),
      });
    }
    if (advanced.terminalResult !== null) {
      return finalizePhaseB1NormalSinusBeTerminalCycleFromRetainedArtifactsV1({
        parentManifest,
        parentNumericalEvidence,
        schedule,
        sourceCase,
        terminalResult: advanced.terminalResult,
        finalCommittedSupercycleAudit: advanced.committedSupercycleAudit,
        finalPeriodicCheckpoint: advanced.periodicCheckpoint,
        finalCycleEvidence: advanced.cycleEvidence,
        sha256Hex: input.sha256Hex,
      });
    }
    if (advanced.controller === null) {
      throw new Error("terminal-cycle capsule lost a nonterminal controller");
    }
    controller = advanced.controller;
  }
}

/**
 * Issues the existing paired periodic evidence only from two successful,
 * retained, same-process terminal capsules. This boundary is intentionally
 * success-only: live-cycle and cap-exhaustion failures remain internal to the
 * monolithic runner until their parent/source object identities are retained
 * by a later failure-artifact contract.
 */
export function finalizePhaseB1NormalSinusBePairedPeriodicEvidenceFromRetainedCapsulesV1(
  input:
    FinalizePhaseB1NormalSinusBePairedPeriodicEvidenceFromRetainedCapsulesInputV1,
): PhaseB1NormalSinusBePairedPeriodicEvidenceV1 {
  assertExactPlainRecordV1(input, [
    "parentManifest",
    "parentNumericalEvidence",
    "schedule",
    "initialSourceParityAudit",
    "slsOff",
    "slsOn",
    "sha256Hex",
  ], "Phase B1 retained paired periodic evidence finalization input");
  requireSha256Provider(input.sha256Hex);
  const parentManifest =
    assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(
      input.parentManifest,
    );
  const parentNumericalEvidence =
    assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1(
      input.parentNumericalEvidence,
      parentManifest,
    );
  const schedule = validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    input.schedule,
    input.sha256Hex,
  );
  const initialSourceParityAudit =
    assertBuilderIssuedPhaseB1NormalSinusBePairedSourceParityAuditV1(
      input.initialSourceParityAudit,
      input.sha256Hex,
    );
  const slsOff = assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
    input.slsOff,
    input.sha256Hex,
  );
  const slsOn = assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
    input.slsOn,
    input.sha256Hex,
  );
  if (
    !Object.is(initialSourceParityAudit.parentManifest, parentManifest)
    || !Object.is(
      initialSourceParityAudit.parentNumericalEvidence,
      parentNumericalEvidence,
    )
    || !Object.is(initialSourceParityAudit.schedule, schedule)
    || !Object.is(slsOff.parentManifest, parentManifest)
    || !Object.is(slsOn.parentManifest, parentManifest)
    || !Object.is(slsOff.parentNumericalEvidence, parentNumericalEvidence)
    || !Object.is(slsOn.parentNumericalEvidence, parentNumericalEvidence)
    || !Object.is(slsOff.schedule, schedule)
    || !Object.is(slsOn.schedule, schedule)
    || slsOff.slsMode !== "off"
    || slsOn.slsMode !== "on"
    || !Object.is(
      slsOff.nominalDtSec,
      PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_NOMINAL_DT_SEC_V1,
    )
    || !Object.is(
      slsOn.nominalDtSec,
      PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_NOMINAL_DT_SEC_V1,
    )
    || slsOff.terminalStatus !== "converged"
    || slsOn.terminalStatus !== "converged"
    || slsOff.terminalCycleConvergencePass !== true
    || slsOn.terminalCycleConvergencePass !== true
    || slsOff.liveSingleStartPeriodOneCriterionPass !== true
    || slsOn.liveSingleStartPeriodOneCriterionPass !== true
    || initialSourceParityAudit.initialCommonCoordinateParityPass !== true
    || initialSourceParityAudit.allEightInitialFlowsExactlyEqualAndZero !== true
    || !Object.is(
      slsOff.sourceCase.inverse,
      parentNumericalEvidence.results.off.eventFreeCase.inverse,
    )
    || !Object.is(
      slsOn.sourceCase.inverse,
      parentNumericalEvidence.results.on.eventFreeCase.inverse,
    )
    || !Object.is(
      slsOff.sourceCase.referenceEndpoint,
      initialSourceParityAudit.slsOffSourceCase.referenceEndpoint,
    )
    || !Object.is(
      slsOn.sourceCase.referenceEndpoint,
      initialSourceParityAudit.slsOnSourceCase.referenceEndpoint,
    )
  ) {
    throw new Error(
      "retained paired periodic capsules differ in parent, mode, timestep, convergence, or initial parity",
    );
  }
  const evidence = issuePairedEvidence({
    parentManifest,
    parentNumericalEvidence,
    schedule,
    initialSourceParityAudit,
    slsOff,
    slsOn,
    sha256Hex: input.sha256Hex,
  });
  return assertBuilderIssuedPhaseB1NormalSinusBePairedPeriodicEvidenceV1(
    evidence,
    input.sha256Hex,
  );
}

export function runPhaseB1NormalSinusBePairedPeriodicEvidenceV1(
  input: RunPhaseB1NormalSinusBePairedPeriodicEvidenceInputV1,
): RunPhaseB1NormalSinusBePairedPeriodicEvidenceResultV1 {
  assertExactPlainRecordV1(input, [
    "parentManifest",
    "parentNumericalEvidence",
    "schedule",
    "sha256Hex",
  ], "Phase B1 paired periodic evidence input");
  requireSha256Provider(input.sha256Hex);
  const parentManifest =
    assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(
      input.parentManifest,
    );
  const parentNumericalEvidence =
    assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1(
      input.parentNumericalEvidence,
      parentManifest,
    );
  const schedule = validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    input.schedule,
    input.sha256Hex,
  );
  const initialSourceParityAudit =
    buildPhaseB1NormalSinusBePairedSourceParityAuditV1({
      parentManifest,
      parentNumericalEvidence,
      schedule,
      sha256Hex: input.sha256Hex,
    });
  if (
    initialSourceParityAudit.initialCommonCoordinateParityPass !== true
  ) {
    throw new Error("paired periodic initial source parity audit failed");
  }
  const slsOff = runPhaseB1NormalSinusBeTerminalCycleCapsuleV1({
    parentManifest,
    parentNumericalEvidence,
    schedule,
    slsMode: "off",
    nominalDtSec:
      PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_NOMINAL_DT_SEC_V1,
    sha256Hex: input.sha256Hex,
  });
  const slsOn = runPhaseB1NormalSinusBeTerminalCycleCapsuleV1({
    parentManifest,
    parentNumericalEvidence,
    schedule,
    slsMode: "on",
    nominalDtSec:
      PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_NOMINAL_DT_SEC_V1,
    sha256Hex: input.sha256Hex,
  });
  if (slsOff.completed === false || slsOn.completed === false) {
    return Object.freeze({
      completed: false as const,
      evidence: null,
      failure: issuePairedFailure({
        parentManifest,
        parentNumericalEvidence,
        schedule,
        initialSourceParityAudit,
        slsOff,
        slsOn,
        sha256Hex: input.sha256Hex,
      }),
    });
  }
  return Object.freeze({
    completed: true as const,
    evidence:
      finalizePhaseB1NormalSinusBePairedPeriodicEvidenceFromRetainedCapsulesV1({
        parentManifest,
        parentNumericalEvidence,
        schedule,
        initialSourceParityAudit,
        slsOff: slsOff.capsule,
        slsOn: slsOn.capsule,
        sha256Hex: input.sha256Hex,
      }),
    failure: null,
  });
}

export function assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
  value: PhaseB1NormalSinusBeTerminalCycleCapsuleV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1NormalSinusBeTerminalCycleCapsuleV1 {
  requireSha256Provider(sha256Hex);
  if (
    value === null
    || typeof value !== "object"
    || !BUILDER_ISSUED_CAPSULES.has(value)
    || value.capsuleId
      !== PHASE_B1_NORMAL_SINUS_BE_TERMINAL_CYCLE_CAPSULE_V1_ID
  ) throw new Error("terminal-cycle capsule is not builder-issued");
  const {
    contentSha256,
    parentManifest: _parentManifest,
    parentNumericalEvidence: _parentNumericalEvidence,
    schedule: _schedule,
    sourceCase: _sourceCase,
    terminalResult: _terminalResult,
    finalCommittedSupercycleAudit: _finalCommittedSupercycleAudit,
    finalPeriodicCheckpoint: _finalPeriodicCheckpoint,
    finalCycleEvidence: _finalCycleEvidence,
    sourceScheduleRun: _sourceScheduleRun,
    committedIntervalLedger: _committedIntervalLedger,
    ...payload
  } = value;
  if (computeCanonicalSha256(payload, sha256Hex) !== contentSha256) {
    throw new Error("terminal-cycle capsule content hash drifted");
  }
  authenticateTerminalCycleCapsuleArtifacts(value, sha256Hex);
  return value;
}

export function assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1(
  value: PhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1 {
  requireSha256Provider(sha256Hex);
  if (
    value === null
    || typeof value !== "object"
    || !BUILDER_ISSUED_CAPSULE_FAILURES.has(value)
    || value.failureId
      !== PHASE_B1_NORMAL_SINUS_BE_TERMINAL_CYCLE_CAPSULE_FAILURE_V1_ID
  ) throw new Error("terminal-cycle capsule failure is not builder-issued");
  const {
    contentSha256,
    livePeriodicFailure: _livePeriodicFailure,
    terminalCycleCapsule: _terminalCycleCapsule,
    ...payload
  } = value;
  if (computeCanonicalSha256(payload, sha256Hex) !== contentSha256) {
    throw new Error("terminal-cycle capsule failure content hash drifted");
  }
  if (value.failureKind === "live-periodic-cycle-failure") {
    if (
      value.livePeriodicFailure === null
      || value.terminalCycleCapsule !== null
      || value.livePeriodicFailureContentSha256
        !== value.livePeriodicFailure.contentSha256
      || value.terminalCycleCapsuleContentSha256 !== null
      || value.terminalResultContentSha256 !== null
      || value.scheduleContentSha256
        !== value.livePeriodicFailure.scheduleContentSha256
      || value.slsMode !== value.livePeriodicFailure.slsMode
      || value.nominalDtSec !== value.livePeriodicFailure.nominalDtSec
    ) throw new Error("terminal-cycle live failure binding drifted");
    assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicFailureV1(
      value.livePeriodicFailure,
      sha256Hex,
    );
  } else {
    if (
      value.livePeriodicFailure !== null
      || value.terminalCycleCapsule === null
      || value.livePeriodicFailureContentSha256 !== null
      || value.terminalCycleCapsuleContentSha256
        !== value.terminalCycleCapsule.contentSha256
      || value.terminalResultContentSha256
        !== value.terminalCycleCapsule.terminalResult.contentSha256
      || value.terminalCycleCapsule.terminalStatus
        !== "maximum-supercycles-exhausted"
      || value.terminalCycleCapsule.terminalCycleConvergencePass !== false
      || value.terminalCycleCapsule.maximumSupercyclesExhaustedFailure !== true
      || value.parentManifestContentSha256
        !== value.terminalCycleCapsule.parentManifestContentSha256
      || value.parentNumericalEvidenceContentSha256
        !== value.terminalCycleCapsule.parentNumericalEvidenceContentSha256
      || value.scheduleContentSha256
        !== value.terminalCycleCapsule.scheduleContentSha256
      || value.slsMode !== value.terminalCycleCapsule.slsMode
      || value.nominalDtSec !== value.terminalCycleCapsule.nominalDtSec
    ) throw new Error("terminal-cycle cap-exhaustion binding drifted");
    assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
      value.terminalCycleCapsule,
      sha256Hex,
    );
  }
  return value;
}

export function assertBuilderIssuedPhaseB1NormalSinusBePairedSourceParityAuditV1(
  value: PhaseB1NormalSinusBePairedSourceParityAuditV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1NormalSinusBePairedSourceParityAuditV1 {
  requireSha256Provider(sha256Hex);
  if (
    value === null
    || typeof value !== "object"
    || !BUILDER_ISSUED_SOURCE_PARITY_AUDITS.has(value)
    || value.auditId
      !== PHASE_B1_NORMAL_SINUS_BE_PAIRED_SOURCE_PARITY_AUDIT_V1_ID
  ) throw new Error("paired initial source parity audit is not builder-issued");
  const {
    contentSha256,
    parentManifest: _parentManifest,
    parentNumericalEvidence: _parentNumericalEvidence,
    schedule: _schedule,
    slsOffSourceCase: _slsOffSourceCase,
    slsOnSourceCase: _slsOnSourceCase,
    ...payload
  } = value;
  if (computeCanonicalSha256(payload, sha256Hex) !== contentSha256) {
    throw new Error("paired initial source parity audit content hash drifted");
  }
  assertSourceParityAuditSemantics(value, sha256Hex);
  return value;
}

export function assertBuilderIssuedPhaseB1NormalSinusBePairedPeriodicEvidenceV1(
  value: PhaseB1NormalSinusBePairedPeriodicEvidenceV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1NormalSinusBePairedPeriodicEvidenceV1 {
  requireSha256Provider(sha256Hex);
  if (
    value === null
    || typeof value !== "object"
    || !BUILDER_ISSUED_PAIRED_EVIDENCE.has(value)
    || value.evidenceId
      !== PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_EVIDENCE_V1_ID
  ) throw new Error("paired periodic evidence is not builder-issued");
  const {
    contentSha256,
    parentManifest: _parentManifest,
    parentNumericalEvidence: _parentNumericalEvidence,
    schedule: _schedule,
    initialSourceParityAudit: _initialSourceParityAudit,
    slsOff: _slsOff,
    slsOn: _slsOn,
    ...payload
  } = value;
  if (computeCanonicalSha256(payload, sha256Hex) !== contentSha256) {
    throw new Error("paired periodic evidence content hash drifted");
  }
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
    value.slsOff,
    sha256Hex,
  );
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
    value.slsOn,
    sha256Hex,
  );
  assertBuilderIssuedPhaseB1NormalSinusBePairedSourceParityAuditV1(
    value.initialSourceParityAudit,
    sha256Hex,
  );
  assertPairedSourceParity(value);
  return value;
}

export function assertBuilderIssuedPhaseB1NormalSinusBePairedPeriodicFailureV1(
  value: PhaseB1NormalSinusBePairedPeriodicFailureV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1NormalSinusBePairedPeriodicFailureV1 {
  requireSha256Provider(sha256Hex);
  if (
    value === null
    || typeof value !== "object"
    || !BUILDER_ISSUED_PAIRED_FAILURES.has(value)
    || value.failureId
      !== PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_FAILURE_V1_ID
  ) throw new Error("paired periodic failure is not builder-issued");
  const {
    contentSha256,
    parentManifest: _parentManifest,
    parentNumericalEvidence: _parentNumericalEvidence,
    schedule: _schedule,
    initialSourceParityAudit: _initialSourceParityAudit,
    slsOff: _slsOff,
    slsOn: _slsOn,
    ...payload
  } = value;
  if (computeCanonicalSha256(payload, sha256Hex) !== contentSha256) {
    throw new Error("paired periodic failure content hash drifted");
  }
  assertModeOutcome(value.slsOff, sha256Hex);
  assertModeOutcome(value.slsOn, sha256Hex);
  assertBuilderIssuedPhaseB1NormalSinusBePairedSourceParityAuditV1(
    value.initialSourceParityAudit,
    sha256Hex,
  );
  if (
    assertFailureOutcomeSourceBinding(
      value.slsOff,
      "off",
      value,
    ) !== true
    || assertFailureOutcomeSourceBinding(
      value.slsOn,
      "on",
      value,
    ) !== true
    || assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(
      value.parentManifest,
    ) !== value.parentManifest
    || assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1(
      value.parentNumericalEvidence,
      value.parentManifest,
    ) !== value.parentNumericalEvidence
    || validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
      value.schedule,
      sha256Hex,
    ) !== value.schedule
    || value.parentManifestContentSha256
      !== value.parentManifest.contentSha256
    || value.parentNumericalEvidenceContentSha256
      !== value.parentNumericalEvidence.certificate.contentSha256
    || value.scheduleContentSha256 !== value.schedule.contentSha256
    || !Object.is(
      value.initialSourceParityAudit.parentManifest,
      value.parentManifest,
    )
    || !Object.is(
      value.initialSourceParityAudit.parentNumericalEvidence,
      value.parentNumericalEvidence,
    )
    || !Object.is(
      value.initialSourceParityAudit.schedule,
      value.schedule,
    )
    || value.initialSourceParityAuditContentSha256
      !== value.initialSourceParityAudit.contentSha256
    || value.initialCommonCoordinateCount
      !== value.initialSourceParityAudit.comparedCommonScalarCount
    || !Object.is(
      value.initialCommonCoordinateMaximumNormalizedDistance,
      value.initialSourceParityAudit.maximumNormalizedDistance,
    )
    || value.initialCommonCoordinateMaximizingScalarLabel
      !== value.initialSourceParityAudit.maximizingScalarLabel
    || value.initialCommonCoordinateMaximumNormalizedDistanceTolerance
      !== value.initialSourceParityAudit.maximumNormalizedDistanceTolerance
    || value.slsOffOutcomeContentSha256 !== outcomeContentSha256(value.slsOff)
    || value.slsOnOutcomeContentSha256 !== outcomeContentSha256(value.slsOn)
    || (value.slsOff.completed && value.slsOn.completed)
  ) throw new Error("paired periodic failure outcome binding drifted");
  return value;
}

export function buildPhaseB1NormalSinusBePairedSourceParityAuditV1(
  input: BuildPhaseB1NormalSinusBePairedSourceParityAuditInputV1,
): PhaseB1NormalSinusBePairedSourceParityAuditV1 {
  assertExactPlainRecordV1(input, [
    "parentManifest",
    "parentNumericalEvidence",
    "schedule",
    "sha256Hex",
  ], "Phase B1 paired initial source parity audit input");
  requireSha256Provider(input.sha256Hex);
  assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(
    input.parentManifest,
  );
  assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1(
    input.parentNumericalEvidence,
    input.parentManifest,
  );
  validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    input.schedule,
    input.sha256Hex,
  );
  const slsOffSourceCase = input.parentNumericalEvidence.results.off
    .eventFreeCase;
  const slsOnSourceCase = input.parentNumericalEvidence.results.on
    .eventFreeCase;
  const offProjection = buildPhaseB1CompleteEndpointProjectionV1({
    endpoint: slsOffSourceCase.referenceEndpoint,
    sha256Hex: input.sha256Hex,
  });
  const onProjection = buildPhaseB1CompleteEndpointProjectionV1({
    endpoint: slsOnSourceCase.referenceEndpoint,
    sha256Hex: input.sha256Hex,
  });
  const offScaleDescriptor = buildPhaseB1CompleteEndpointScaleDescriptorV1({
    slsMode: "off",
    registry: slsOffSourceCase.destinationRegistry,
    sha256Hex: input.sha256Hex,
  });
  const onCommonIndices = onProjection.labels.flatMap((label, index) =>
    isSlsCoordinateLabel(label) ? [] : [index]);
  const onSlsIndices = onProjection.labels.flatMap((label, index) =>
    isSlsCoordinateLabel(label) ? [index] : []);
  if (
    offProjection.scalarCount !== 56
    || onProjection.scalarCount !== 61
    || offScaleDescriptor.scalarCount !== 56
    || onCommonIndices.length !== 56
    || onSlsIndices.length !== 5
  ) throw new Error("paired initial source projection topology drifted");

  const commonComponents = Object.freeze(offProjection.labels.map(
    (label, index): PhaseB1NormalSinusBePairedSourceParityComponentV1 => {
      const onIndex = onCommonIndices[index];
      const onLabel = onProjection.labels[onIndex];
      const offScale = offScaleDescriptor.scales[index];
      if (label !== onLabel) {
        throw new Error(
          `paired initial common label differs at ${index}:${label}`,
        );
      }
      const slsOffValue = requireFiniteNumber(
        offProjection.values[index],
        `paired source off projection[${index}]`,
      );
      const slsOnValue = requireFiniteNumber(
        onProjection.values[onIndex],
        `paired source on projection[${onIndex}]`,
      );
      const absoluteDifference = requireNonNegativeFiniteNumber(
        Math.abs(slsOnValue - slsOffValue),
        `paired source absolute difference[${index}]`,
      );
      const normalizedDistance = requireNonNegativeFiniteNumber(
        absoluteDifference / (offScale + Math.abs(slsOffValue)),
        `paired source normalized distance[${index}]`,
      );
      return Object.freeze({
        index,
        label,
        slsOffValue,
        slsOnValue,
        scale: offScale,
        scaleFixedFromSlsOffPreRunRegistry: true as const,
        absoluteDifference,
        normalizedDistance,
      });
    },
  ));
  let maximizingScalarIndex = 0;
  for (let index = 1; index < commonComponents.length; index += 1) {
    if (
      commonComponents[index].normalizedDistance
        > commonComponents[maximizingScalarIndex].normalizedDistance
    ) maximizingScalarIndex = index;
  }
  const maximumNormalizedDistance =
    commonComponents[maximizingScalarIndex].normalizedDistance;
  if (
    !(maximumNormalizedDistance
      < PHASE_B1_NORMAL_SINUS_BE_PAIRED_SOURCE_PARITY_NORMALIZED_TOLERANCE_V1)
  ) throw new Error(
    `paired initial source mismatch ${maximumNormalizedDistance} at ${commonComponents[maximizingScalarIndex].label}`,
  );

  const evaluatedFlowComponents = Object.freeze(
    FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1.map((flowId) => {
      const slsOffFlowM3PerSec = requireFiniteNumber(
        slsOffSourceCase.destinationEvaluation.closedLoop
          .allFlowsM3PerSec[flowId],
        `paired source off flow ${flowId}`,
      );
      const slsOnFlowM3PerSec = requireFiniteNumber(
        slsOnSourceCase.destinationEvaluation.closedLoop
          .allFlowsM3PerSec[flowId],
        `paired source on flow ${flowId}`,
      );
      return Object.freeze({
        flowId,
        slsOffFlowM3PerSec,
        slsOnFlowM3PerSec,
        absoluteDifferenceM3PerSec: Math.abs(
          slsOnFlowM3PerSec - slsOffFlowM3PerSec,
        ),
        numericallyExactAcrossModes:
          slsOffFlowM3PerSec === slsOnFlowM3PerSec,
        exactZeroInBothModes:
          slsOffFlowM3PerSec === 0 && slsOnFlowM3PerSec === 0,
      });
    }),
  );
  const allEightInitialFlowsExactlyEqualAndZero =
    evaluatedFlowComponents.length === 8
    && evaluatedFlowComponents.every((flow) =>
      flow.numericallyExactAcrossModes && flow.exactZeroInBothModes);
  const slsOffState = slsOffSourceCase.referenceEndpoint.differentialState;
  const slsOnState = slsOnSourceCase.referenceEndpoint.differentialState;
  const slsOffStatePhysicallyOmitsSlsCoordinates =
    slsOffState.slsMode === "off" && !("slsAlphaVByWall" in slsOffState);
  const slsOnStateContainsExactlyFiveSlsCoordinates =
    slsOnState.slsMode === "on"
    && Object.keys(slsOnState.slsAlphaVByWall).length === 5;
  const commonWallMaterialBindingContentSha256 =
    slsOffSourceCase.wallMaterialBinding.contentSha256;
  const wallMaterialBindingBitExactAcrossModes =
    commonWallMaterialBindingContentSha256
      === slsOnSourceCase.wallMaterialBinding.contentSha256
    && commonWallMaterialBindingContentSha256
      === input.schedule.sourceBindings.phaseB1WallMaterialBindingSha256;
  const slsOffNonSlsClosedLoopParametersContentSha256 =
    computeCanonicalSha256(
      slsOffSourceCase.model.closedLoopParameters,
      input.sha256Hex,
    );
  const slsOnNonSlsClosedLoopParametersContentSha256 =
    computeCanonicalSha256(
      slsOnSourceCase.model.closedLoopParameters,
      input.sha256Hex,
    );
  const nonSlsClosedLoopParametersBitExact =
    slsOffNonSlsClosedLoopParametersContentSha256
      === slsOnNonSlsClosedLoopParametersContentSha256;
  if (
    !allEightInitialFlowsExactlyEqualAndZero
    || !slsOffStatePhysicallyOmitsSlsCoordinates
    || !slsOnStateContainsExactlyFiveSlsCoordinates
    || !wallMaterialBindingBitExactAcrossModes
    || !Object.is(slsOffSourceCase.referenceEndpoint.timeSec, 0)
    || !Object.is(slsOnSourceCase.referenceEndpoint.timeSec, 0)
  ) throw new Error("paired initial source exact structural parity failed");

  const payload = deepFreeze<PhaseB1NormalSinusBePairedSourceParityAuditPayloadV1>({
    auditId: PHASE_B1_NORMAL_SINUS_BE_PAIRED_SOURCE_PARITY_AUDIT_V1_ID,
    parentManifestContentSha256: input.parentManifest.contentSha256,
    parentNumericalEvidenceContentSha256:
      input.parentNumericalEvidence.certificate.contentSha256,
    scheduleContentSha256: input.schedule.contentSha256,
    slsOffProjectionContentSha256: offProjection.contentSha256,
    slsOnProjectionContentSha256: onProjection.contentSha256,
    commonScaleDescriptorContentSha256: computeCanonicalSha256(
      offScaleDescriptor,
      input.sha256Hex,
    ),
    slsOffProjectionScalarCount: 56,
    slsOnProjectionScalarCount: 61,
    slsOnExcludedSlsScalarCount: 5,
    comparedCommonScalarCount: 56,
    comparisonRule:
      "abs(on-off)/(fixed-off-scale+abs(off-value))",
    commonScaleSource: "canonical-sls-off-fixed-pre-run-registry",
    maximumNormalizedDistanceTolerance:
      PHASE_B1_NORMAL_SINUS_BE_PAIRED_SOURCE_PARITY_NORMALIZED_TOLERANCE_V1,
    toleranceFixedBeforePeriodicRuns: true,
    commonComponents,
    maximumNormalizedDistance,
    maximizingScalarIndex,
    maximizingScalarLabel: commonComponents[maximizingScalarIndex].label,
    everyCommonLabelExactAcrossModes: true,
    oneCommonFixedScaleAppliedToBothModes: true,
    evaluatedFlowCount: 8,
    evaluatedFlowComponents,
    allEightInitialFlowsExactlyEqualAndZero: true,
    slsOffNonSlsClosedLoopParametersContentSha256,
    slsOnNonSlsClosedLoopParametersContentSha256,
    nonSlsClosedLoopParametersBitExact,
    nonSlsClosedLoopParametersContentHashesDiagnosticOnly: true,
    nonSlsClosedLoopParametersParityClaimed: false,
    commonWallMaterialBindingContentSha256,
    wallMaterialBindingBitExactAcrossModes: true,
    initialTimeExactZeroInBothModes: true,
    slsOffStatePhysicallyOmitsSlsCoordinates: true,
    slsOnStateContainsExactlyFiveSlsCoordinates: true,
    exactSlsTopologyInventoryVerified: true,
    initialCommonCoordinateParityPass: true,
    causalEffectOfSlsEstablished: false,
    physiologicalValidationPass: false,
    phaseB1AcceptancePass: false,
    releaseRuntimeReachable: false,
    testOnly: true,
    claimBoundary: CLAIM_BOUNDARY,
  });
  const audit = Object.freeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
    parentManifest: input.parentManifest,
    parentNumericalEvidence: input.parentNumericalEvidence,
    schedule: input.schedule,
    slsOffSourceCase,
    slsOnSourceCase,
  });
  BUILDER_ISSUED_SOURCE_PARITY_AUDITS.add(audit);
  assertBuilderIssuedPhaseB1NormalSinusBePairedSourceParityAuditV1(
    audit,
    input.sha256Hex,
  );
  return audit;
}

function assertSourceParityAuditSemantics(
  audit: PhaseB1NormalSinusBePairedSourceParityAuditV1,
  sha256Hex: CanonicalSha256HexProvider,
): void {
  assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(
    audit.parentManifest,
  );
  assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1(
    audit.parentNumericalEvidence,
    audit.parentManifest,
  );
  validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    audit.schedule,
    sha256Hex,
  );
  const offProjection = buildPhaseB1CompleteEndpointProjectionV1({
    endpoint: audit.slsOffSourceCase.referenceEndpoint,
    sha256Hex,
  });
  const onProjection = buildPhaseB1CompleteEndpointProjectionV1({
    endpoint: audit.slsOnSourceCase.referenceEndpoint,
    sha256Hex,
  });
  const offScaleDescriptor = buildPhaseB1CompleteEndpointScaleDescriptorV1({
    slsMode: "off",
    registry: audit.slsOffSourceCase.destinationRegistry,
    sha256Hex,
  });
  const recomputedMaximum = Math.max(
    ...audit.commonComponents.map((component) => component.normalizedDistance),
  );
  if (
    !Object.is(
      audit.slsOffSourceCase,
      audit.parentNumericalEvidence.results.off.eventFreeCase,
    )
    || !Object.is(
      audit.slsOnSourceCase,
      audit.parentNumericalEvidence.results.on.eventFreeCase,
    )
    || audit.parentManifestContentSha256 !== audit.parentManifest.contentSha256
    || audit.parentNumericalEvidenceContentSha256
      !== audit.parentNumericalEvidence.certificate.contentSha256
    || audit.scheduleContentSha256 !== audit.schedule.contentSha256
    || audit.slsOffProjectionContentSha256 !== offProjection.contentSha256
    || audit.slsOnProjectionContentSha256 !== onProjection.contentSha256
    || audit.commonScaleDescriptorContentSha256
      !== computeCanonicalSha256(offScaleDescriptor, sha256Hex)
    || audit.commonComponents.length !== 56
    || audit.evaluatedFlowComponents.length !== 8
    || audit.comparedCommonScalarCount !== 56
    || audit.slsOffProjectionScalarCount !== 56
    || audit.slsOnProjectionScalarCount !== 61
    || audit.slsOnExcludedSlsScalarCount !== 5
    || audit.comparisonRule
      !== "abs(on-off)/(fixed-off-scale+abs(off-value))"
    || audit.commonScaleSource
      !== "canonical-sls-off-fixed-pre-run-registry"
    || !Object.is(audit.maximumNormalizedDistance, recomputedMaximum)
    || audit.maximizingScalarLabel
      !== audit.commonComponents[audit.maximizingScalarIndex]?.label
    || audit.commonComponents[audit.maximizingScalarIndex]
      ?.normalizedDistance !== recomputedMaximum
    || !(audit.maximumNormalizedDistance
      < audit.maximumNormalizedDistanceTolerance)
    || audit.maximumNormalizedDistanceTolerance
      !== PHASE_B1_NORMAL_SINUS_BE_PAIRED_SOURCE_PARITY_NORMALIZED_TOLERANCE_V1
    || audit.commonComponents.some((component, index) => {
      const onIndex = onProjection.labels.findIndex((label) =>
        label === component.label);
      const offValue = offProjection.values[index];
      const onValue = onProjection.values[onIndex];
      const scale = offScaleDescriptor.scales[index];
      return component.index !== index
        || onIndex < 0
        || isSlsCoordinateLabel(component.label)
        || !Object.is(component.slsOffValue, offValue)
        || !Object.is(component.slsOnValue, onValue)
        || !Object.is(component.scale, scale)
        || !Object.is(
          component.absoluteDifference,
          Math.abs(onValue - offValue),
        )
        || !Object.is(
          component.normalizedDistance,
          component.absoluteDifference / (scale + Math.abs(offValue)),
        )
        || component.scaleFixedFromSlsOffPreRunRegistry !== true;
    })
    || audit.evaluatedFlowComponents.some((flow, index) => {
      const flowId = FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1[index];
      return flow.flowId !== flowId
        || !Object.is(
          flow.slsOffFlowM3PerSec,
          audit.slsOffSourceCase.destinationEvaluation.closedLoop
            .allFlowsM3PerSec[flowId],
        )
        || !Object.is(
          flow.slsOnFlowM3PerSec,
          audit.slsOnSourceCase.destinationEvaluation.closedLoop
            .allFlowsM3PerSec[flowId],
        )
        || !Object.is(
          flow.absoluteDifferenceM3PerSec,
          Math.abs(flow.slsOnFlowM3PerSec - flow.slsOffFlowM3PerSec),
        )
        || !flow.numericallyExactAcrossModes
        || !flow.exactZeroInBothModes;
    })
    || audit.slsOffNonSlsClosedLoopParametersContentSha256
      !== computeCanonicalSha256(
        audit.slsOffSourceCase.model.closedLoopParameters,
        sha256Hex,
      )
    || audit.slsOnNonSlsClosedLoopParametersContentSha256
      !== computeCanonicalSha256(
        audit.slsOnSourceCase.model.closedLoopParameters,
        sha256Hex,
      )
    || audit.nonSlsClosedLoopParametersBitExact
      !== (
        audit.slsOffNonSlsClosedLoopParametersContentSha256
          === audit.slsOnNonSlsClosedLoopParametersContentSha256
      )
    || audit.nonSlsClosedLoopParametersContentHashesDiagnosticOnly !== true
    || audit.nonSlsClosedLoopParametersParityClaimed !== false
    || audit.commonWallMaterialBindingContentSha256
      !== audit.slsOffSourceCase.wallMaterialBinding.contentSha256
    || audit.commonWallMaterialBindingContentSha256
      !== audit.slsOnSourceCase.wallMaterialBinding.contentSha256
    || audit.commonWallMaterialBindingContentSha256
      !== audit.schedule.sourceBindings.phaseB1WallMaterialBindingSha256
    || !Object.is(audit.slsOffSourceCase.referenceEndpoint.timeSec, 0)
    || !Object.is(audit.slsOnSourceCase.referenceEndpoint.timeSec, 0)
    || audit.slsOffSourceCase.referenceEndpoint.differentialState.slsMode
      !== "off"
    || "slsAlphaVByWall" in
      audit.slsOffSourceCase.referenceEndpoint.differentialState
    || audit.slsOnSourceCase.referenceEndpoint.differentialState.slsMode
      !== "on"
    || Object.keys(
      audit.slsOnSourceCase.referenceEndpoint.differentialState
        .slsAlphaVByWall,
    ).length !== 5
  ) throw new Error("paired initial source parity audit semantics drifted");
}

function issueTerminalCycleCapsule(input: Readonly<{
  parentManifest: PhaseB1QuiescentReferenceEvidenceManifestV1;
  parentNumericalEvidence:
    PhaseB1QuiescentReferenceNumericalEvidenceBundleV1;
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
  sourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1;
  terminalResult: PhaseB1NormalSinusBeLivePeriodicTerminalResultV1;
  finalCommittedSupercycleAudit:
    PhaseB1NormalSinusCommittedSupercycleAuditV1;
  finalPeriodicCheckpoint: PhaseB1NormalSinusBePeriodicCheckpointV1;
  finalCycleEvidence: PhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1;
  sha256Hex: CanonicalSha256HexProvider;
}>): PhaseB1NormalSinusBeTerminalCycleCapsuleV1 {
  const audit = input.finalCommittedSupercycleAudit;
  const terminal = input.terminalResult;
  const terminalCycleConvergencePass = terminal.terminalStatus === "converged"
    && terminal.liveSingleStartPeriodOneCriterionPass;
  const payload = deepFreeze<PhaseB1NormalSinusBeTerminalCycleCapsulePayloadV1>({
    capsuleId: PHASE_B1_NORMAL_SINUS_BE_TERMINAL_CYCLE_CAPSULE_V1_ID,
    parentManifestContentSha256: input.parentManifest.contentSha256,
    parentNumericalEvidenceContentSha256:
      input.parentNumericalEvidence.certificate.contentSha256,
    scheduleContentSha256: input.schedule.contentSha256,
    definitionContentSha256: terminal.definitionContentSha256,
    sourceWallMaterialBindingContentSha256:
      input.sourceCase.wallMaterialBinding.contentSha256,
    sourceNewtonScaleRegistryContentSha256:
      input.sourceCase.destinationRegistry.registryContentSha256,
    slsMode: terminal.slsMode,
    nominalDtSec: terminal.nominalDtSec,
    completedSupercycleCount: terminal.completedSupercycleCount,
    finalCycleIndex: audit.cycleIndex,
    terminalStatus: terminal.terminalStatus,
    terminalResultContentSha256: terminal.contentSha256,
    finalCommittedSupercycleAuditContentSha256: audit.contentSha256,
    finalPeriodicCheckpointContentSha256:
      input.finalPeriodicCheckpoint.contentSha256,
    finalCycleEvidenceContentSha256: input.finalCycleEvidence.contentSha256,
    sourceScheduleRunnerAttemptTraceContentSha256:
      audit.runnerAttemptTraceContentSha256,
    committedIntervalLedgerSummaryContentSha256:
      audit.committedIntervalLedgerSummaryContentSha256,
    initialEndpointContentSha256: audit.initialEndpointContentSha256,
    finalEndpointContentSha256: audit.finalEndpointContentSha256,
    terminalResultCycleEvidenceHashCrossLinkVerified: true,
    cycleEvidenceAuditAndCheckpointHashCrossLinksVerified: true,
    auditRunnerAndLedgerHashCrossLinksVerified: true,
    finalEndpointHashCrossLinksVerified: true,
    sourceScheduleRunAuthenticatedInProcess: true,
    sourceScheduleRunObjectRetained: true,
    committedIntervalLedgerObjectRetained: true,
    sourceModelObjectIdentityRetained: true,
    sourceWallMaterialBindingObjectIdentityRetained: true,
    sourceRegistryObjectIdentityRetained: true,
    parentManifestAndNumericalObjectsRetained: true,
    parentModeSourceInverseObjectIdentityRetained: true,
    finalTerminalCheckpointObjectIdentityRetained: true,
    finalTerminalCycleEvidenceObjectIdentityRetained: true,
    liveSingleStartPeriodOneCriterionPass:
      terminal.liveSingleStartPeriodOneCriterionPass,
    terminalCycleConvergencePass,
    maximumSupercyclesExhaustedFailure:
      terminal.terminalStatus === "maximum-supercycles-exhausted",
    fullBeatAcceptancePass: false,
    normalSinusMultiStartAcceptancePass: false,
    timestepConvergenceAcceptancePass: false,
    cycleEnergyAcceptancePass: false,
    physiologicalValidationPass: false,
    phaseB1AcceptancePass: false,
    modelCoreIntegration: false,
    browserRuntimeAdopted: false,
    releaseRuntimeReachable: false,
    testOnly: true,
    claimBoundary: CLAIM_BOUNDARY,
  });
  const capsule = Object.freeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
    parentManifest: input.parentManifest,
    parentNumericalEvidence: input.parentNumericalEvidence,
    schedule: input.schedule,
    sourceCase: input.sourceCase,
    terminalResult: terminal,
    finalCommittedSupercycleAudit: audit,
    finalPeriodicCheckpoint: input.finalPeriodicCheckpoint,
    finalCycleEvidence: input.finalCycleEvidence,
    sourceScheduleRun: audit.sourceScheduleRun,
    committedIntervalLedger: audit.committedIntervalLedger,
  });
  authenticateTerminalCycleCapsuleArtifacts(capsule, input.sha256Hex);
  BUILDER_ISSUED_CAPSULES.add(capsule);
  return capsule;
}

function authenticateTerminalCycleCapsuleArtifacts(
  capsule: PhaseB1NormalSinusBeTerminalCycleCapsuleV1,
  sha256Hex: CanonicalSha256HexProvider,
): void {
  assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(
    capsule.parentManifest,
  );
  assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1(
    capsule.parentNumericalEvidence,
    capsule.parentManifest,
  );
  const schedule = validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    capsule.schedule,
    sha256Hex,
  );
  const terminal =
    assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicTerminalResultV1(
      capsule.terminalResult,
      sha256Hex,
    );
  const evidence =
    assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1(
      capsule.finalCycleEvidence,
      sha256Hex,
    );
  const audit =
    assertBuilderIssuedPhaseB1NormalSinusCommittedSupercycleAuditV1(
      capsule.finalCommittedSupercycleAudit,
      sha256Hex,
    );
  const scheduleRun =
    assertCommittedPhaseB1BackwardEulerEventScheduleSuccessV1(
      capsule.sourceScheduleRun,
    );
  const checkpoint = capsule.finalPeriodicCheckpoint;
  if (
    computeCanonicalSha256(
      phaseB1NormalSinusBePeriodicCheckpointHashPayloadV1(checkpoint),
      sha256Hex,
    ) !== checkpoint.contentSha256
    || capsule.parentManifestContentSha256
      !== capsule.parentManifest.contentSha256
    || capsule.parentNumericalEvidenceContentSha256
      !== capsule.parentNumericalEvidence.certificate.contentSha256
    || capsule.scheduleContentSha256 !== schedule.contentSha256
    || capsule.slsMode !== capsule.sourceCase.slsMode
    || capsule.slsMode !== terminal.slsMode
    || capsule.nominalDtSec !== terminal.nominalDtSec
    || capsule.definitionContentSha256 !== terminal.definitionContentSha256
    || terminal.definitionContentSha256 !== audit.definitionContentSha256
    || terminal.definitionContentSha256 !== evidence.definitionContentSha256
    || terminal.definitionContentSha256 !== checkpoint.definitionContentSha256
    || terminal.scheduleContentSha256 !== schedule.contentSha256
    || audit.scheduleContentSha256 !== schedule.contentSha256
    || evidence.scheduleContentSha256 !== schedule.contentSha256
    || audit.expectationContentSha256 !== audit.expectation.contentSha256
    || audit.expectation.definitionContentSha256
      !== terminal.definitionContentSha256
    || audit.expectation.scheduleContentSha256 !== schedule.contentSha256
    || audit.expectation.cycleIndex !== audit.cycleIndex
    || audit.slsMode !== capsule.slsMode
    || evidence.slsMode !== capsule.slsMode
    || audit.nominalDtSec !== capsule.nominalDtSec
    || evidence.nominalDtSec !== capsule.nominalDtSec
    || capsule.completedSupercycleCount !== terminal.completedSupercycleCount
    || capsule.finalCycleIndex !== terminal.completedSupercycleCount - 1
    || capsule.finalCycleIndex !== audit.cycleIndex
    || capsule.finalCycleIndex !== evidence.cycleIndex
    || capsule.finalCycleIndex !== checkpoint.cycleIndex
    || capsule.terminalStatus !== terminal.terminalStatus
    || capsule.terminalStatus !== checkpoint.terminalStatus
    || capsule.terminalStatus !== evidence.terminalStatus
    || checkpoint.completedSupercycleCount
      !== terminal.completedSupercycleCount
    || capsule.terminalResultContentSha256 !== terminal.contentSha256
    || capsule.finalCommittedSupercycleAuditContentSha256
      !== audit.contentSha256
    || capsule.finalPeriodicCheckpointContentSha256
      !== checkpoint.contentSha256
    || capsule.finalCycleEvidenceContentSha256 !== evidence.contentSha256
    || terminal.cycleEvidenceChainHeadContentSha256 !== evidence.contentSha256
    || terminal.finalPeriodicCheckpointContentSha256 !== checkpoint.contentSha256
    || evidence.committedSupercycleAuditContentSha256 !== audit.contentSha256
    || evidence.periodicCheckpointContentSha256 !== checkpoint.contentSha256
    || evidence.runnerAttemptTraceContentSha256
      !== audit.runnerAttemptTraceContentSha256
    || evidence.committedIntervalLedgerSummaryContentSha256
      !== audit.committedIntervalLedgerSummaryContentSha256
    || checkpoint.initialEndpointContentSha256
      !== audit.initialEndpointContentSha256
    || checkpoint.finalEndpointContentSha256 !== audit.finalEndpointContentSha256
    || evidence.initialEndpointContentSha256
      !== audit.initialEndpointContentSha256
    || evidence.finalEndpointContentSha256 !== audit.finalEndpointContentSha256
    || capsule.sourceScheduleRunnerAttemptTraceContentSha256
      !== audit.runnerAttemptTraceContentSha256
    || capsule.committedIntervalLedgerSummaryContentSha256
      !== audit.committedIntervalLedgerSummaryContentSha256
    || capsule.initialEndpointContentSha256
      !== audit.initialEndpointContentSha256
    || capsule.finalEndpointContentSha256 !== audit.finalEndpointContentSha256
    || !Object.is(terminal.lastCycleEvidence, evidence)
    || !Object.is(terminal.finalPeriodicState.lastCheckpoint, checkpoint)
    || !Object.is(terminal.finalPeriodicState.schedule, schedule)
    || !Object.is(
      terminal.finalPeriodicState.registry,
      capsule.sourceCase.destinationRegistry,
    )
    || terminal.finalPeriodicState.completedSupercycleCount
      !== terminal.completedSupercycleCount
    || terminal.finalPeriodicState.terminalStatus !== terminal.terminalStatus
    || !Object.is(audit.sourceScheduleRun, scheduleRun)
    || !Object.is(audit.committedIntervalLedger, capsule.committedIntervalLedger)
    || !Object.is(scheduleRun.modelObjectAtRunStart, capsule.sourceCase.model)
    || !Object.is(
      scheduleRun.wallMaterialBindingObjectAtRunStart,
      capsule.sourceCase.wallMaterialBinding,
    )
    || !Object.is(
      scheduleRun.newtonScaleRegistryObjectAtRunStart,
      capsule.sourceCase.destinationRegistry,
    )
    || !Object.is(
      capsule.sourceCase.inverse,
      capsule.parentNumericalEvidence.results[capsule.slsMode]
        .eventFreeCase.inverse,
    )
    || !Object.is(
      capsule.sourceCase.referenceEndpoint,
      capsule.parentNumericalEvidence.results[capsule.slsMode]
        .eventFreeCase.referenceEndpoint,
    )
    || capsule.sourceWallMaterialBindingContentSha256
      !== capsule.sourceCase.wallMaterialBinding.contentSha256
    || capsule.sourceNewtonScaleRegistryContentSha256
      !== capsule.sourceCase.destinationRegistry.registryContentSha256
    || capsule.sourceWallMaterialBindingContentSha256
      !== schedule.sourceBindings.phaseB1WallMaterialBindingSha256
    || capsule.committedIntervalLedger.slsMode !== capsule.slsMode
    || capsule.committedIntervalLedger.sourceRunnerSuccessAuthenticatedInProcess
      !== true
    || capsule.committedIntervalLedger
      .runnerCommittedTransactionProvenanceVerified !== true
    || capsule.committedIntervalLedger.nonProbeEvidenceEligibilityPass !== true
    || capsule.liveSingleStartPeriodOneCriterionPass
      !== terminal.liveSingleStartPeriodOneCriterionPass
    || capsule.terminalCycleConvergencePass
      !== (
        terminal.terminalStatus === "converged"
        && terminal.liveSingleStartPeriodOneCriterionPass
      )
    || capsule.maximumSupercyclesExhaustedFailure
      !== (terminal.terminalStatus === "maximum-supercycles-exhausted")
  ) throw new Error("terminal-cycle capsule artifact authentication failed");
}

function issueCapsuleFailure(input: Readonly<{
  parentManifest: PhaseB1QuiescentReferenceEvidenceManifestV1;
  parentNumericalEvidence:
    PhaseB1QuiescentReferenceNumericalEvidenceBundleV1;
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
  slsMode: SlsMode;
  nominalDtSec: number;
  livePeriodicFailure: PhaseB1NormalSinusBeLivePeriodicFailureV1 | null;
  terminalCycleCapsule: PhaseB1NormalSinusBeTerminalCycleCapsuleV1 | null;
  sha256Hex: CanonicalSha256HexProvider;
}>): PhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1 {
  const capExhausted = input.terminalCycleCapsule !== null;
  if (capExhausted === (input.livePeriodicFailure !== null)) {
    throw new Error("terminal-cycle failure must retain exactly one source");
  }
  if (input.livePeriodicFailure !== null) {
    assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicFailureV1(
      input.livePeriodicFailure,
      input.sha256Hex,
    );
  }
  if (input.terminalCycleCapsule !== null) {
    assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
      input.terminalCycleCapsule,
      input.sha256Hex,
    );
    if (
      input.terminalCycleCapsule.terminalStatus
        !== "maximum-supercycles-exhausted"
    ) throw new Error("terminal-cycle failure capsule did not exhaust its cap");
  }
  const payload = deepFreeze<PhaseB1NormalSinusBeTerminalCycleCapsuleFailurePayloadV1>({
    failureId:
      PHASE_B1_NORMAL_SINUS_BE_TERMINAL_CYCLE_CAPSULE_FAILURE_V1_ID,
    parentManifestContentSha256: input.parentManifest.contentSha256,
    parentNumericalEvidenceContentSha256:
      input.parentNumericalEvidence.certificate.contentSha256,
    scheduleContentSha256: input.schedule.contentSha256,
    slsMode: input.slsMode,
    nominalDtSec: input.nominalDtSec,
    failureKind: capExhausted
      ? "maximum-supercycles-exhausted"
      : "live-periodic-cycle-failure",
    livePeriodicFailureContentSha256:
      input.livePeriodicFailure?.contentSha256 ?? null,
    terminalCycleCapsuleContentSha256:
      input.terminalCycleCapsule?.contentSha256 ?? null,
    terminalResultContentSha256:
      input.terminalCycleCapsule?.terminalResult.contentSha256 ?? null,
    capExhaustionAcceptedAsSuccess: false,
    liveSingleStartPeriodOneCriterionPass: false,
    fullBeatAcceptancePass: false,
    normalSinusMultiStartAcceptancePass: false,
    timestepConvergenceAcceptancePass: false,
    cycleEnergyAcceptancePass: false,
    physiologicalValidationPass: false,
    phaseB1AcceptancePass: false,
    modelCoreIntegration: false,
    browserRuntimeAdopted: false,
    releaseRuntimeReachable: false,
    testOnly: true,
    claimBoundary: CLAIM_BOUNDARY,
  });
  const failure = Object.freeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
    livePeriodicFailure: input.livePeriodicFailure,
    terminalCycleCapsule: input.terminalCycleCapsule,
  });
  BUILDER_ISSUED_CAPSULE_FAILURES.add(failure);
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1(
    failure,
    input.sha256Hex,
  );
  return failure;
}

function issuePairedEvidence(input: Readonly<{
  parentManifest: PhaseB1QuiescentReferenceEvidenceManifestV1;
  parentNumericalEvidence:
    PhaseB1QuiescentReferenceNumericalEvidenceBundleV1;
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
  initialSourceParityAudit:
    PhaseB1NormalSinusBePairedSourceParityAuditV1;
  slsOff: PhaseB1NormalSinusBeTerminalCycleCapsuleV1;
  slsOn: PhaseB1NormalSinusBeTerminalCycleCapsuleV1;
  sha256Hex: CanonicalSha256HexProvider;
}>): PhaseB1NormalSinusBePairedPeriodicEvidenceV1 {
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
    input.slsOff,
    input.sha256Hex,
  );
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
    input.slsOn,
    input.sha256Hex,
  );
  assertBuilderIssuedPhaseB1NormalSinusBePairedSourceParityAuditV1(
    input.initialSourceParityAudit,
    input.sha256Hex,
  );
  const commonWallMaterialBindingContentSha256 =
    input.slsOff.sourceWallMaterialBindingContentSha256;
  const payload = deepFreeze<PhaseB1NormalSinusBePairedPeriodicEvidencePayloadV1>({
    evidenceId: PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_EVIDENCE_V1_ID,
    parentManifestContentSha256: input.parentManifest.contentSha256,
    parentNumericalEvidenceContentSha256:
      input.parentNumericalEvidence.certificate.contentSha256,
    scheduleContentSha256: input.schedule.contentSha256,
    nominalDtSec:
      PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_NOMINAL_DT_SEC_V1,
    modeOrder:
      PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_MODE_ORDER_V1,
    slsOffTerminalCycleCapsuleContentSha256: input.slsOff.contentSha256,
    slsOnTerminalCycleCapsuleContentSha256: input.slsOn.contentSha256,
    slsOffTerminalResultContentSha256:
      input.slsOff.terminalResult.contentSha256,
    slsOnTerminalResultContentSha256:
      input.slsOn.terminalResult.contentSha256,
    sameParentManifestObjectIdentity: true,
    sameParentNumericalEvidenceObjectIdentity: true,
    sameScheduleObjectIdentity: true,
    parentModeSourceCasesSelectedWithoutCrossModeSwap: true,
    initialSourceParityAuditContentSha256:
      input.initialSourceParityAudit.contentSha256,
    initialCommonCoordinateCount:
      input.initialSourceParityAudit.comparedCommonScalarCount,
    initialCommonCoordinateMaximumNormalizedDistance:
      input.initialSourceParityAudit.maximumNormalizedDistance,
    initialCommonCoordinateMaximizingScalarLabel:
      input.initialSourceParityAudit.maximizingScalarLabel,
    initialCommonCoordinateMaximumNormalizedDistanceTolerance:
      input.initialSourceParityAudit.maximumNormalizedDistanceTolerance,
    commonWallMaterialBindingContentSha256,
    exactSlsTopologyInventoryVerified: true,
    allEightInitialFlowsExactlyEqualAndZero: true,
    pairedCanonicalParentAndInitialCommonCoordinateParityPass: true,
    causalEffectOfSlsEstablished: false,
    bothSingleStartPeriodOneCriteriaPass: true,
    pairedOneMillisecondPeriodicEvidencePass: true,
    fullBeatAcceptancePass: false,
    normalSinusMultiStartAcceptancePass: false,
    timestepConvergenceAcceptancePass: false,
    cycleEnergyAcceptancePass: false,
    physiologicalValidationPass: false,
    phaseB1AcceptancePass: false,
    modelCoreIntegration: false,
    browserRuntimeAdopted: false,
    releaseRuntimeReachable: false,
    testOnly: true,
    claimBoundary: CLAIM_BOUNDARY,
  });
  const evidence = Object.freeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
    parentManifest: input.parentManifest,
    parentNumericalEvidence: input.parentNumericalEvidence,
    schedule: input.schedule,
    initialSourceParityAudit: input.initialSourceParityAudit,
    slsOff: input.slsOff,
    slsOn: input.slsOn,
  });
  assertPairedSourceParity(evidence);
  BUILDER_ISSUED_PAIRED_EVIDENCE.add(evidence);
  return evidence;
}

function assertPairedSourceParity(
  evidence: PhaseB1NormalSinusBePairedPeriodicEvidenceV1,
): void {
  const { slsOff, slsOn, initialSourceParityAudit } = evidence;
  if (
    !Object.is(slsOff.parentManifest, evidence.parentManifest)
    || !Object.is(slsOn.parentManifest, evidence.parentManifest)
    || !Object.is(
      slsOff.parentNumericalEvidence,
      evidence.parentNumericalEvidence,
    )
    || !Object.is(
      slsOn.parentNumericalEvidence,
      evidence.parentNumericalEvidence,
    )
    || !Object.is(slsOff.schedule, evidence.schedule)
    || !Object.is(slsOn.schedule, evidence.schedule)
    || !Object.is(
      initialSourceParityAudit.parentManifest,
      evidence.parentManifest,
    )
    || !Object.is(
      initialSourceParityAudit.parentNumericalEvidence,
      evidence.parentNumericalEvidence,
    )
    || !Object.is(initialSourceParityAudit.schedule, evidence.schedule)
    || slsOff.slsMode !== "off"
    || slsOn.slsMode !== "on"
    || slsOff.nominalDtSec
      !== PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_NOMINAL_DT_SEC_V1
    || slsOn.nominalDtSec
      !== PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_NOMINAL_DT_SEC_V1
    || slsOff.terminalCycleConvergencePass !== true
    || slsOn.terminalCycleConvergencePass !== true
    || !Object.is(
      slsOff.sourceCase.inverse,
      evidence.parentNumericalEvidence.results.off.eventFreeCase.inverse,
    )
    || !Object.is(
      slsOn.sourceCase.inverse,
      evidence.parentNumericalEvidence.results.on.eventFreeCase.inverse,
    )
    || !Object.is(
      slsOff.sourceCase.referenceEndpoint,
      initialSourceParityAudit.slsOffSourceCase.referenceEndpoint,
    )
    || !Object.is(
      slsOn.sourceCase.referenceEndpoint,
      initialSourceParityAudit.slsOnSourceCase.referenceEndpoint,
    )
    || slsOff.sourceWallMaterialBindingContentSha256
      !== slsOn.sourceWallMaterialBindingContentSha256
    || evidence.commonWallMaterialBindingContentSha256
      !== slsOff.sourceWallMaterialBindingContentSha256
    || evidence.commonWallMaterialBindingContentSha256
      !== initialSourceParityAudit.commonWallMaterialBindingContentSha256
    || evidence.initialSourceParityAuditContentSha256
      !== initialSourceParityAudit.contentSha256
    || evidence.initialCommonCoordinateCount
      !== initialSourceParityAudit.comparedCommonScalarCount
    || !Object.is(
      evidence.initialCommonCoordinateMaximumNormalizedDistance,
      initialSourceParityAudit.maximumNormalizedDistance,
    )
    || evidence.initialCommonCoordinateMaximizingScalarLabel
      !== initialSourceParityAudit.maximizingScalarLabel
    || evidence.initialCommonCoordinateMaximumNormalizedDistanceTolerance
      !== initialSourceParityAudit.maximumNormalizedDistanceTolerance
    || initialSourceParityAudit.initialCommonCoordinateParityPass
      !== true
    || initialSourceParityAudit.allEightInitialFlowsExactlyEqualAndZero
      !== true
    || evidence.parentManifestContentSha256
      !== evidence.parentManifest.contentSha256
    || evidence.parentNumericalEvidenceContentSha256
      !== evidence.parentNumericalEvidence.certificate.contentSha256
    || evidence.scheduleContentSha256 !== evidence.schedule.contentSha256
    || evidence.slsOffTerminalCycleCapsuleContentSha256
      !== slsOff.contentSha256
    || evidence.slsOnTerminalCycleCapsuleContentSha256 !== slsOn.contentSha256
    || evidence.slsOffTerminalResultContentSha256
      !== slsOff.terminalResult.contentSha256
    || evidence.slsOnTerminalResultContentSha256
      !== slsOn.terminalResult.contentSha256
  ) throw new Error("paired periodic source parity failed");
}

function issuePairedFailure(input: Readonly<{
  parentManifest: PhaseB1QuiescentReferenceEvidenceManifestV1;
  parentNumericalEvidence:
    PhaseB1QuiescentReferenceNumericalEvidenceBundleV1;
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
  initialSourceParityAudit:
    PhaseB1NormalSinusBePairedSourceParityAuditV1;
  slsOff: ModeRunOutcome;
  slsOn: ModeRunOutcome;
  sha256Hex: CanonicalSha256HexProvider;
}>): PhaseB1NormalSinusBePairedPeriodicFailureV1 {
  assertModeOutcome(input.slsOff, input.sha256Hex);
  assertModeOutcome(input.slsOn, input.sha256Hex);
  assertBuilderIssuedPhaseB1NormalSinusBePairedSourceParityAuditV1(
    input.initialSourceParityAudit,
    input.sha256Hex,
  );
  if (input.slsOff.completed && input.slsOn.completed) {
    throw new Error("paired periodic failure cannot retain two successes");
  }
  const payload = deepFreeze<PhaseB1NormalSinusBePairedPeriodicFailurePayloadV1>({
    failureId: PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_FAILURE_V1_ID,
    parentManifestContentSha256: input.parentManifest.contentSha256,
    parentNumericalEvidenceContentSha256:
      input.parentNumericalEvidence.certificate.contentSha256,
    scheduleContentSha256: input.schedule.contentSha256,
    nominalDtSec:
      PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_NOMINAL_DT_SEC_V1,
    modeOrder:
      PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_MODE_ORDER_V1,
    slsOffOutcomeContentSha256: outcomeContentSha256(input.slsOff),
    slsOnOutcomeContentSha256: outcomeContentSha256(input.slsOn),
    slsOffConverged: input.slsOff.completed,
    slsOnConverged: input.slsOn.completed,
    sameParentManifestObjectPassedToBothRuns: true,
    sameParentNumericalEvidenceObjectPassedToBothRuns: true,
    sameScheduleObjectPassedToBothRuns: true,
    initialSourceParityAuditContentSha256:
      input.initialSourceParityAudit.contentSha256,
    initialCommonCoordinateCount:
      input.initialSourceParityAudit.comparedCommonScalarCount,
    initialCommonCoordinateMaximumNormalizedDistance:
      input.initialSourceParityAudit.maximumNormalizedDistance,
    initialCommonCoordinateMaximizingScalarLabel:
      input.initialSourceParityAudit.maximizingScalarLabel,
    initialCommonCoordinateMaximumNormalizedDistanceTolerance:
      input.initialSourceParityAudit.maximumNormalizedDistanceTolerance,
    exactSlsTopologyInventoryVerified: true,
    allEightInitialFlowsExactlyEqualAndZero: true,
    pairedCanonicalParentAndInitialCommonCoordinateParityPass: true,
    causalEffectOfSlsEstablished: false,
    pairedOneMillisecondPeriodicEvidencePass: false,
    capExhaustionAcceptedAsSuccess: false,
    fullBeatAcceptancePass: false,
    normalSinusMultiStartAcceptancePass: false,
    timestepConvergenceAcceptancePass: false,
    cycleEnergyAcceptancePass: false,
    physiologicalValidationPass: false,
    phaseB1AcceptancePass: false,
    modelCoreIntegration: false,
    browserRuntimeAdopted: false,
    releaseRuntimeReachable: false,
    testOnly: true,
    claimBoundary: CLAIM_BOUNDARY,
  });
  const failure = Object.freeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
    parentManifest: input.parentManifest,
    parentNumericalEvidence: input.parentNumericalEvidence,
    schedule: input.schedule,
    initialSourceParityAudit: input.initialSourceParityAudit,
    slsOff: input.slsOff,
    slsOn: input.slsOn,
  });
  BUILDER_ISSUED_PAIRED_FAILURES.add(failure);
  assertBuilderIssuedPhaseB1NormalSinusBePairedPeriodicFailureV1(
    failure,
    input.sha256Hex,
  );
  return failure;
}

function assertModeOutcome(
  outcome: ModeRunOutcome,
  sha256Hex: CanonicalSha256HexProvider,
): void {
  if (outcome.completed) {
    assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
      outcome.capsule,
      sha256Hex,
    );
  } else {
    assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1(
      outcome.failure,
      sha256Hex,
    );
  }
}

function outcomeContentSha256(outcome: ModeRunOutcome): string {
  return outcome.completed
    ? outcome.capsule.contentSha256
    : outcome.failure.contentSha256;
}

function assertFailureOutcomeSourceBinding(
  outcome: ModeRunOutcome,
  expectedMode: SlsMode,
  pair: PhaseB1NormalSinusBePairedPeriodicFailureV1,
): true {
  const source = outcome.completed ? outcome.capsule : outcome.failure;
  if (
    source.slsMode !== expectedMode
    || source.nominalDtSec
      !== PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_NOMINAL_DT_SEC_V1
    || source.parentManifestContentSha256
      !== pair.parentManifestContentSha256
    || source.parentNumericalEvidenceContentSha256
      !== pair.parentNumericalEvidenceContentSha256
    || source.scheduleContentSha256 !== pair.scheduleContentSha256
  ) throw new Error("paired periodic failure source parity drifted");
  if (outcome.completed) {
    const capsule = outcome.capsule;
    if (
      !Object.is(capsule.parentManifest, pair.parentManifest)
      || !Object.is(
        capsule.parentNumericalEvidence,
        pair.parentNumericalEvidence,
      )
      || !Object.is(capsule.schedule, pair.schedule)
    ) throw new Error("paired periodic failure success source objects drifted");
  }
  return true;
}

function requireSlsMode(value: unknown): SlsMode {
  if (value !== "on" && value !== "off") {
    throw new Error("terminal-cycle capsule slsMode must be on or off");
  }
  return value;
}

function isSlsCoordinateLabel(label: string): boolean {
  return label.includes(".sls.");
}

function requireFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requireNonNegativeFiniteNumber(
  value: unknown,
  field: string,
): number {
  const finite = requireFiniteNumber(value, field);
  if (finite < 0) throw new Error(`${field} must be non-negative`);
  return finite;
}

function requireSha256Provider(
  value: unknown,
): asserts value is CanonicalSha256HexProvider {
  if (typeof value !== "function") {
    throw new Error("terminal-cycle capsule requires a SHA-256 provider");
  }
}

function deepFreeze<Value>(value: Value): Value {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
