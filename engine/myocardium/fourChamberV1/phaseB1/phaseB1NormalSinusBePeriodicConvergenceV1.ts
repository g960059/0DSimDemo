import {
  FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import {
  NORMATIVE_MANIFEST_HASH_ALGORITHM,
} from "@/engine/myocardium/fourChamberV1/ids";
import {
  assertCanonicalSha256,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  assertCanonicalFourChamberNewtonScaleRegistryV1,
  validateFourChamberNewtonScaleRegistryV1,
  type FourChamberNewtonScaleRegistryV1,
} from "@/engine/myocardium/fourChamberV1/numerics/newtonScaleRegistryV1";
import {
  buildPhaseB1CompleteEndpointProjectionV1,
  evaluatePhaseB1CompleteEndpointMetricV1,
  PHASE_B1_COMPLETE_ENDPOINT_METRIC_V1_ID,
  type PhaseB1CompleteEndpointMetricResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1CompleteEndpointMetricV1";
import {
  createPhaseB1EndpointStateV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1,
  PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_V1_ID,
  validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  type PhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import type {
  PhaseB1SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  BLOOD_COMPARTMENT_IDS,
  type FourChamberFlowId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_NORMAL_SINUS_BE_PERIODIC_CONVERGENCE_DEFINITION_V1_ID =
  "phase-b1-normal-sinus-be-periodic-convergence-definition-v1" as const;

export const PHASE_B1_NORMAL_SINUS_BE_PERIODIC_CONVERGENCE_SCHEMA_V1_ID =
  "phase-b1-normal-sinus-be-periodic-convergence-schema-v1" as const;

export const PHASE_B1_NORMAL_SINUS_BE_PERIODIC_CHECKPOINT_V1_ID =
  "phase-b1-normal-sinus-be-periodic-checkpoint-v1" as const;

export const PHASE_B1_NORMAL_SINUS_BE_PERIODIC_STATE_V1_ID =
  "phase-b1-normal-sinus-be-periodic-state-v1" as const;

export const PHASE_B1_NORMAL_SINUS_BE_PERIODIC_MAX_SUPERCYCLES_V1 =
  100 as const;

export const PHASE_B1_NORMAL_SINUS_BE_PERIODIC_REQUIRED_CONSECUTIVE_V1 =
  3 as const;

export const PHASE_B1_NORMAL_SINUS_BE_PERIODIC_STATE_TOLERANCE_V1 =
  1e-6 as const;

export const PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SIGNED_FLOW_TOLERANCE_V1 =
  1e-3 as const;

export const PHASE_B1_NORMAL_SINUS_BE_PERIODIC_TBV_TOLERANCE_V1 =
  1e-10 as const;

export const PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SUPPORTED_DT_SEC_V1 =
  Object.freeze([0.001, 0.0005, 0.00025] as const);

const FLOW_DECOMPOSITION_RELATIVE_TOLERANCE = 512 * Number.EPSILON;

const DEFINITION_CLAIM_BOUNDARY = deepFreeze({
  purePeriodicDecisionFoundation: true,
  liveScheduleSolverExecuted: false,
  liveCommittedIntervalLedgerAuthenticatedHere: false,
  singleStartPeriodOneCriterionMayBeEvaluated: true,
  multiStartAcceptanceClaimed: false,
  physiologicalValidationClaimed: false,
  phaseB1AcceptanceClaimed: false,
  modelCoreOrBrowserRuntimeAdopted: false,
  releaseRuntimeReachable: false,
} as const);

const LIVE_STATES = new WeakSet<object>();

export type PhaseB1NormalSinusBePeriodicConvergenceDefinitionHashPayloadV1 =
  Readonly<{
    schemaId:
      typeof PHASE_B1_NORMAL_SINUS_BE_PERIODIC_CONVERGENCE_SCHEMA_V1_ID;
    definitionId:
      typeof PHASE_B1_NORMAL_SINUS_BE_PERIODIC_CONVERGENCE_DEFINITION_V1_ID;
    rhythm: "normal-sinus-project-synthetic";
    scheduleId:
      typeof PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_V1_ID;
    scheduleContentSha256: string;
    sourceEndpointContentSha256: string;
    sourceStartTimeSec: 0;
    sourceWallMaterialBindingContentSha256: string;
    newtonScaleRegistryContentSha256: string;
    newtonScaleRegistryFixedBeforeRun: true;
    adaptiveNewtonRescalingAllowed: false;
    slsMode: PhaseB1SlsModeV1;
    endpointScalarCount: 61 | 56;
    cycleLengthSec:
      typeof PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1;
    nominalDtSec: number;
    supportedNominalDtSec:
      typeof PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SUPPORTED_DT_SEC_V1;
    maximumSupercycles:
      typeof PHASE_B1_NORMAL_SINUS_BE_PERIODIC_MAX_SUPERCYCLES_V1;
    requiredConsecutivePassingSupercycles:
      typeof PHASE_B1_NORMAL_SINUS_BE_PERIODIC_REQUIRED_CONSECUTIVE_V1;
    completeEndpointMetricId: typeof PHASE_B1_COMPLETE_ENDPOINT_METRIC_V1_ID;
    completeStateMismatchTolerance:
      typeof PHASE_B1_NORMAL_SINUS_BE_PERIODIC_STATE_TOLERANCE_V1;
    landStateDriftTolerance:
      typeof PHASE_B1_NORMAL_SINUS_BE_PERIODIC_STATE_TOLERANCE_V1;
    slsStateDriftTolerance:
      typeof PHASE_B1_NORMAL_SINUS_BE_PERIODIC_STATE_TOLERANCE_V1;
    streakWindowCompleteStateGateRequired: true;
    streakWindowLandAndSlsDriftGateRequired: true;
    signedNetFlowReferenceFlowId: "Q_sys";
    signedNetFlowAgreement:
      "all-eight-cycle-mean-signed-flows-relative-to-systemic-net-flow";
    signedNetFlowRelativeTolerance:
      typeof PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SIGNED_FLOW_TOLERANCE_V1;
    zeroSystemicNetFlowAccepted: false;
    forwardAndRegurgitantVolumesReportedSeparately: true;
    forwardAndRegurgitantVolumesRequiredEqual: false;
    flowDecompositionRelativeTolerance: number;
    totalBloodVolumeRelativeTolerancePerSupercycle:
      typeof PHASE_B1_NORMAL_SINUS_BE_PERIODIC_TBV_TOLERANCE_V1;
    cumulativeTotalBloodVolumeRelativeTolerance:
      typeof PHASE_B1_NORMAL_SINUS_BE_PERIODIC_TBV_TOLERANCE_V1;
    exactCycleTimesComputedFromIntegerCycleIndex: true;
    eventIntervalOwnership: "(start,end]";
    maximumCycleExhaustionMeansConvergence: false;
    checkpointHashChainRequired: true;
    claimBoundary: typeof DEFINITION_CLAIM_BOUNDARY;
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
  }>;

export type PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1 =
  PhaseB1NormalSinusBePeriodicConvergenceDefinitionHashPayloadV1 & Readonly<{
    contentSha256: string;
  }>;

export type BuildPhaseB1NormalSinusBePeriodicConvergenceDefinitionInputV1 =
  Readonly<{
    schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
    sourceEndpoint: PhaseB1EndpointStateV1;
    registry: FourChamberNewtonScaleRegistryV1;
    nominalDtSec: number;
    sha256Hex: CanonicalSha256HexProvider;
  }>;

export type PhaseB1NormalSinusBePeriodicIntegratedFlowVolumeV1 = Readonly<{
  signedVolumeM3: number;
  forwardVolumeM3: number;
  regurgitantVolumeM3: number;
}>;

export type PhaseB1NormalSinusBePeriodicCommittedCycleObservationV1 =
  Readonly<{
    cycleIndex: number;
    initialEndpoint: PhaseB1EndpointStateV1;
    finalEndpoint: PhaseB1EndpointStateV1;
    integratedFlowVolumeByFlow: Readonly<Record<
      FourChamberFlowId,
      PhaseB1NormalSinusBePeriodicIntegratedFlowVolumeV1
    >>;
    maximumRelativeTotalBloodVolumeDrift: number;
    exactOneScheduleSupercycleVerified: boolean;
    committedIntervalProvenanceVerified: boolean;
    structuralAndNumericalIntervalLedgerGatesPass: boolean;
    projectionClippingClampAndFallbackFree: boolean;
  }>;

export type PhaseB1NormalSinusBePeriodicMetricSummaryV1 = Readonly<{
  maximumNormalizedDistance: number;
  maximizingScalarLabel: string;
  maximumLandNormalizedDistance: number;
  maximizingLandScalarLabel: string;
  maximumSlsNormalizedDistance: number | null;
  maximizingSlsScalarLabel: string | null;
  slsStatePhysicallyAbsent: boolean;
}>;

export type PhaseB1NormalSinusBePeriodicFlowSummaryByFlowV1 = Readonly<{
  flowId: FourChamberFlowId;
  signedVolumeM3: number;
  forwardVolumeM3: number;
  regurgitantVolumeM3: number;
  meanSignedFlowM3PerSec: number;
  signedDecompositionResidualM3: number;
  signedDecompositionRelativeResidual: number;
  relativeMismatchFromSystemicNetFlow: number | null;
}>;

export type PhaseB1NormalSinusBePeriodicFlowSummaryV1 = Readonly<{
  referenceFlowId: "Q_sys";
  systemicMeanSignedNetFlowM3PerSec: number;
  systemicNetFlowUsableAsRelativeDenominator: boolean;
  byFlow: Readonly<Record<
    FourChamberFlowId,
    PhaseB1NormalSinusBePeriodicFlowSummaryByFlowV1
  >>;
  maximumRelativeSignedNetFlowMismatch: number | null;
  maximizingFlowId: FourChamberFlowId | null;
  maximumSignedDecompositionRelativeResidual: number;
  signedFlowAgreementPass: boolean;
  signedDecompositionPass: boolean;
  forwardAndRegurgitantVolumesAuditedSeparately: true;
  forwardAndRegurgitantVolumesComparedForEquality: false;
}>;

export type PhaseB1NormalSinusBePeriodicTbvSummaryV1 = Readonly<{
  runInitialTotalBloodVolumeM3: number;
  cycleInitialTotalBloodVolumeM3: number;
  cycleFinalTotalBloodVolumeM3: number;
  endpointRelativeTotalBloodVolumeDriftThisCycle: number;
  reportedMaximumRelativeTotalBloodVolumeDriftThisCycle: number;
  effectiveMaximumRelativeTotalBloodVolumeDriftThisCycle: number;
  cumulativeRelativeTotalBloodVolumeDrift: number;
  perSupercyclePass: boolean;
  cumulativePass: boolean;
}>;

export type PhaseB1NormalSinusBePeriodicCheckpointPayloadV1 = Readonly<{
  checkpointId: typeof PHASE_B1_NORMAL_SINUS_BE_PERIODIC_CHECKPOINT_V1_ID;
  definitionContentSha256: string;
  previousCheckpointContentSha256: string | null;
  cycleIndex: number;
  completedSupercycleCount: number;
  startTimeSec: number;
  endTimeSec: number;
  initialEndpointContentSha256: string;
  finalEndpointContentSha256: string;
  streakStartEndpointContentSha256: string;
  adjacentMetric: PhaseB1NormalSinusBePeriodicMetricSummaryV1;
  streakWindowMetric: PhaseB1NormalSinusBePeriodicMetricSummaryV1;
  flow: PhaseB1NormalSinusBePeriodicFlowSummaryV1;
  totalBloodVolume: PhaseB1NormalSinusBePeriodicTbvSummaryV1;
  upstream: Readonly<{
    exactOneScheduleSupercycleVerified: boolean;
    committedIntervalProvenanceVerified: boolean;
    structuralAndNumericalIntervalLedgerGatesPass: boolean;
    projectionClippingClampAndFallbackFree: boolean;
  }>;
  gates: Readonly<{
    adjacentCompleteStatePass: boolean;
    adjacentLandDriftPass: boolean;
    adjacentSlsDriftPass: boolean;
    streakWindowCompleteStatePass: boolean;
    streakWindowLandDriftPass: boolean;
    streakWindowSlsDriftPass: boolean;
    signedFlowAgreementPass: boolean;
    signedDecompositionPass: boolean;
    totalBloodVolumePass: boolean;
    upstreamPass: boolean;
    cycleLocalPass: boolean;
    streakWindowPass: boolean;
  }>;
  previousStreakWindowRejectedAndRestartedAtCurrentCycle: boolean;
  consecutivePassingSupercycles: number;
  terminalStatus: "running" | "converged" | "maximum-supercycles-exhausted";
  periodicConvergenceCriterionPass: boolean;
  singleStartPeriodOneCriterionPass: boolean;
  normalSinusMultiStartAcceptancePass: false;
  physiologicalValidationPass: false;
  phaseB1AcceptancePass: false;
  liveScheduleSolverExecutedByFoundation: false;
  liveCommittedIntervalLedgerAuthenticatedByFoundation: false;
  hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
}>;

export type PhaseB1NormalSinusBePeriodicCheckpointV1 =
  PhaseB1NormalSinusBePeriodicCheckpointPayloadV1 & Readonly<{
    contentSha256: string;
  }>;

export type PhaseB1NormalSinusBePeriodicStateV1 = Readonly<{
  stateId: typeof PHASE_B1_NORMAL_SINUS_BE_PERIODIC_STATE_V1_ID;
  definition: PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1;
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
  registry: FourChamberNewtonScaleRegistryV1;
  initialEndpoint: PhaseB1EndpointStateV1;
  lastEndpoint: PhaseB1EndpointStateV1;
  streakStartEndpoint: PhaseB1EndpointStateV1;
  runInitialTotalBloodVolumeM3: number;
  completedSupercycleCount: number;
  consecutivePassingSupercycles: number;
  lastCheckpoint: PhaseB1NormalSinusBePeriodicCheckpointV1 | null;
  retainedCheckpointCount: 0 | 1;
  retainedEndpointCount: 3;
  terminalStatus: "running" | "converged" | "maximum-supercycles-exhausted";
  periodicConvergenceCriterionPass: boolean;
  singleStartPeriodOneCriterionPass: boolean;
  normalSinusMultiStartAcceptancePass: false;
  physiologicalValidationPass: false;
  phaseB1AcceptancePass: false;
}>;

export type InitializePhaseB1NormalSinusBePeriodicStateInputV1 = Readonly<{
  definition: PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1;
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
  registry: FourChamberNewtonScaleRegistryV1;
  initialEndpoint: PhaseB1EndpointStateV1;
  sha256Hex: CanonicalSha256HexProvider;
}>;

export type RecordPhaseB1NormalSinusBePeriodicCheckpointInputV1 = Readonly<{
  state: PhaseB1NormalSinusBePeriodicStateV1;
  observation: PhaseB1NormalSinusBePeriodicCommittedCycleObservationV1;
  sha256Hex: CanonicalSha256HexProvider;
}>;

export type RecordPhaseB1NormalSinusBePeriodicCheckpointResultV1 = Readonly<{
  checkpoint: PhaseB1NormalSinusBePeriodicCheckpointV1;
  state: PhaseB1NormalSinusBePeriodicStateV1;
}>;

export function buildPhaseB1NormalSinusBePeriodicConvergenceDefinitionV1(
  input: BuildPhaseB1NormalSinusBePeriodicConvergenceDefinitionInputV1,
): PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1 {
  assertExactPlainRecordV1(input, [
    "schedule",
    "sourceEndpoint",
    "registry",
    "nominalDtSec",
    "sha256Hex",
  ], "Phase B1 normal-sinus BE periodic definition input");
  requireSha256Provider(input.sha256Hex);
  const schedule = validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    input.schedule,
    input.sha256Hex,
  );
  const registry = validateFourChamberNewtonScaleRegistryV1(
    input.registry,
    input.sha256Hex,
  );
  assertCanonicalFourChamberNewtonScaleRegistryV1(registry);
  const sourceEndpoint = canonicalEndpoint(input.sourceEndpoint);
  if (!Object.is(sourceEndpoint.timeSec, 0)) {
    throw new Error("periodic convergence source endpoint must be at cycle origin zero");
  }
  const nominalDtSec = requireSupportedNominalDt(input.nominalDtSec);
  const sourceProjection = buildPhaseB1CompleteEndpointProjectionV1({
    endpoint: sourceEndpoint,
    sha256Hex: input.sha256Hex,
  });
  const slsMode = sourceEndpoint.differentialState.slsMode;
  const payload = deepFreeze<
    PhaseB1NormalSinusBePeriodicConvergenceDefinitionHashPayloadV1
  >({
    schemaId:
      PHASE_B1_NORMAL_SINUS_BE_PERIODIC_CONVERGENCE_SCHEMA_V1_ID,
    definitionId:
      PHASE_B1_NORMAL_SINUS_BE_PERIODIC_CONVERGENCE_DEFINITION_V1_ID,
    rhythm: "normal-sinus-project-synthetic",
    scheduleId: PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_V1_ID,
    scheduleContentSha256: schedule.contentSha256,
    sourceEndpointContentSha256: sourceProjection.contentSha256,
    sourceStartTimeSec: 0,
    sourceWallMaterialBindingContentSha256:
      schedule.sourceBindings.phaseB1WallMaterialBindingSha256,
    newtonScaleRegistryContentSha256: registry.registryContentSha256,
    newtonScaleRegistryFixedBeforeRun: true,
    adaptiveNewtonRescalingAllowed: false,
    slsMode,
    endpointScalarCount: slsMode === "on" ? 61 : 56,
    cycleLengthSec:
      PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1,
    nominalDtSec,
    supportedNominalDtSec:
      PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SUPPORTED_DT_SEC_V1,
    maximumSupercycles:
      PHASE_B1_NORMAL_SINUS_BE_PERIODIC_MAX_SUPERCYCLES_V1,
    requiredConsecutivePassingSupercycles:
      PHASE_B1_NORMAL_SINUS_BE_PERIODIC_REQUIRED_CONSECUTIVE_V1,
    completeEndpointMetricId: PHASE_B1_COMPLETE_ENDPOINT_METRIC_V1_ID,
    completeStateMismatchTolerance:
      PHASE_B1_NORMAL_SINUS_BE_PERIODIC_STATE_TOLERANCE_V1,
    landStateDriftTolerance:
      PHASE_B1_NORMAL_SINUS_BE_PERIODIC_STATE_TOLERANCE_V1,
    slsStateDriftTolerance:
      PHASE_B1_NORMAL_SINUS_BE_PERIODIC_STATE_TOLERANCE_V1,
    streakWindowCompleteStateGateRequired: true,
    streakWindowLandAndSlsDriftGateRequired: true,
    signedNetFlowReferenceFlowId: "Q_sys",
    signedNetFlowAgreement:
      "all-eight-cycle-mean-signed-flows-relative-to-systemic-net-flow",
    signedNetFlowRelativeTolerance:
      PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SIGNED_FLOW_TOLERANCE_V1,
    zeroSystemicNetFlowAccepted: false,
    forwardAndRegurgitantVolumesReportedSeparately: true,
    forwardAndRegurgitantVolumesRequiredEqual: false,
    flowDecompositionRelativeTolerance:
      FLOW_DECOMPOSITION_RELATIVE_TOLERANCE,
    totalBloodVolumeRelativeTolerancePerSupercycle:
      PHASE_B1_NORMAL_SINUS_BE_PERIODIC_TBV_TOLERANCE_V1,
    cumulativeTotalBloodVolumeRelativeTolerance:
      PHASE_B1_NORMAL_SINUS_BE_PERIODIC_TBV_TOLERANCE_V1,
    exactCycleTimesComputedFromIntegerCycleIndex: true,
    eventIntervalOwnership: "(start,end]",
    maximumCycleExhaustionMeansConvergence: false,
    checkpointHashChainRequired: true,
    claimBoundary: DEFINITION_CLAIM_BOUNDARY,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
  });
  return validatePhaseB1NormalSinusBePeriodicConvergenceDefinitionV1(
    deepFreeze({
      ...payload,
      contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
    }),
    input.sha256Hex,
  );
}

export function phaseB1NormalSinusBePeriodicConvergenceDefinitionHashPayloadV1(
  definition: PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
): PhaseB1NormalSinusBePeriodicConvergenceDefinitionHashPayloadV1 {
  assertExactPlainRecordV1(definition, [
    "schemaId",
    "definitionId",
    "rhythm",
    "scheduleId",
    "scheduleContentSha256",
    "sourceEndpointContentSha256",
    "sourceStartTimeSec",
    "sourceWallMaterialBindingContentSha256",
    "newtonScaleRegistryContentSha256",
    "newtonScaleRegistryFixedBeforeRun",
    "adaptiveNewtonRescalingAllowed",
    "slsMode",
    "endpointScalarCount",
    "cycleLengthSec",
    "nominalDtSec",
    "supportedNominalDtSec",
    "maximumSupercycles",
    "requiredConsecutivePassingSupercycles",
    "completeEndpointMetricId",
    "completeStateMismatchTolerance",
    "landStateDriftTolerance",
    "slsStateDriftTolerance",
    "streakWindowCompleteStateGateRequired",
    "streakWindowLandAndSlsDriftGateRequired",
    "signedNetFlowReferenceFlowId",
    "signedNetFlowAgreement",
    "signedNetFlowRelativeTolerance",
    "zeroSystemicNetFlowAccepted",
    "forwardAndRegurgitantVolumesReportedSeparately",
    "forwardAndRegurgitantVolumesRequiredEqual",
    "flowDecompositionRelativeTolerance",
    "totalBloodVolumeRelativeTolerancePerSupercycle",
    "cumulativeTotalBloodVolumeRelativeTolerance",
    "exactCycleTimesComputedFromIntegerCycleIndex",
    "eventIntervalOwnership",
    "maximumCycleExhaustionMeansConvergence",
    "checkpointHashChainRequired",
    "claimBoundary",
    "hashAlgorithm",
    "contentSha256",
  ], "Phase B1 normal-sinus BE periodic definition");
  const { contentSha256: _contentSha256, ...payload } = definition;
  return deepFreeze(payload);
}

export function validatePhaseB1NormalSinusBePeriodicConvergenceDefinitionV1(
  value: unknown,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1 {
  requireSha256Provider(sha256Hex);
  assertExactPlainRecordV1(value, [
    "schemaId",
    "definitionId",
    "rhythm",
    "scheduleId",
    "scheduleContentSha256",
    "sourceEndpointContentSha256",
    "sourceStartTimeSec",
    "sourceWallMaterialBindingContentSha256",
    "newtonScaleRegistryContentSha256",
    "newtonScaleRegistryFixedBeforeRun",
    "adaptiveNewtonRescalingAllowed",
    "slsMode",
    "endpointScalarCount",
    "cycleLengthSec",
    "nominalDtSec",
    "supportedNominalDtSec",
    "maximumSupercycles",
    "requiredConsecutivePassingSupercycles",
    "completeEndpointMetricId",
    "completeStateMismatchTolerance",
    "landStateDriftTolerance",
    "slsStateDriftTolerance",
    "streakWindowCompleteStateGateRequired",
    "streakWindowLandAndSlsDriftGateRequired",
    "signedNetFlowReferenceFlowId",
    "signedNetFlowAgreement",
    "signedNetFlowRelativeTolerance",
    "zeroSystemicNetFlowAccepted",
    "forwardAndRegurgitantVolumesReportedSeparately",
    "forwardAndRegurgitantVolumesRequiredEqual",
    "flowDecompositionRelativeTolerance",
    "totalBloodVolumeRelativeTolerancePerSupercycle",
    "cumulativeTotalBloodVolumeRelativeTolerance",
    "exactCycleTimesComputedFromIntegerCycleIndex",
    "eventIntervalOwnership",
    "maximumCycleExhaustionMeansConvergence",
    "checkpointHashChainRequired",
    "claimBoundary",
    "hashAlgorithm",
    "contentSha256",
  ], "Phase B1 normal-sinus BE periodic definition");
  assertRecursivelyFrozen(value, "definition");
  const definition = value as PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1;
  assertDefinitionConstants(definition);
  assertCanonicalSha256(
    phaseB1NormalSinusBePeriodicConvergenceDefinitionHashPayloadV1(definition),
    definition.contentSha256,
    sha256Hex,
  );
  return definition;
}

export function initializePhaseB1NormalSinusBePeriodicStateV1(
  input: InitializePhaseB1NormalSinusBePeriodicStateInputV1,
): PhaseB1NormalSinusBePeriodicStateV1 {
  assertExactPlainRecordV1(input, [
    "definition",
    "schedule",
    "registry",
    "initialEndpoint",
    "sha256Hex",
  ], "Phase B1 normal-sinus BE periodic initialization input");
  const definition =
    validatePhaseB1NormalSinusBePeriodicConvergenceDefinitionV1(
      input.definition,
      input.sha256Hex,
    );
  const schedule = validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    input.schedule,
    input.sha256Hex,
  );
  const registry = validateFourChamberNewtonScaleRegistryV1(
    input.registry,
    input.sha256Hex,
  );
  assertCanonicalFourChamberNewtonScaleRegistryV1(registry);
  const initialEndpoint = canonicalEndpoint(input.initialEndpoint);
  const projection = buildPhaseB1CompleteEndpointProjectionV1({
    endpoint: initialEndpoint,
    sha256Hex: input.sha256Hex,
  });
  if (
    definition.scheduleContentSha256 !== schedule.contentSha256
    || definition.newtonScaleRegistryContentSha256
      !== registry.registryContentSha256
    || definition.sourceEndpointContentSha256 !== projection.contentSha256
    || definition.slsMode !== initialEndpoint.differentialState.slsMode
    || definition.endpointScalarCount !== projection.scalarCount
    || !Object.is(initialEndpoint.timeSec, definition.sourceStartTimeSec)
  ) throw new Error("periodic convergence initialization disagrees with its definition");
  const state = Object.freeze({
    stateId: PHASE_B1_NORMAL_SINUS_BE_PERIODIC_STATE_V1_ID,
    definition,
    schedule,
    registry,
    initialEndpoint,
    lastEndpoint: initialEndpoint,
    streakStartEndpoint: initialEndpoint,
    runInitialTotalBloodVolumeM3: totalBloodVolume(initialEndpoint),
    completedSupercycleCount: 0,
    consecutivePassingSupercycles: 0,
    lastCheckpoint: null,
    retainedCheckpointCount: 0 as const,
    retainedEndpointCount: 3 as const,
    terminalStatus: "running" as const,
    periodicConvergenceCriterionPass: false,
    singleStartPeriodOneCriterionPass: false,
    normalSinusMultiStartAcceptancePass: false as const,
    physiologicalValidationPass: false as const,
    phaseB1AcceptancePass: false as const,
  });
  LIVE_STATES.add(state);
  return state;
}

export function recordPhaseB1NormalSinusBePeriodicCheckpointV1(
  input: RecordPhaseB1NormalSinusBePeriodicCheckpointInputV1,
): RecordPhaseB1NormalSinusBePeriodicCheckpointResultV1 {
  assertExactPlainRecordV1(input, [
    "state",
    "observation",
    "sha256Hex",
  ], "Phase B1 normal-sinus BE periodic checkpoint input");
  const state = assertLiveRunningState(input.state);
  requireSha256Provider(input.sha256Hex);
  const observation = validateObservation(input.observation);
  const definition = state.definition;
  const expectedCycleIndex = state.completedSupercycleCount;
  if (observation.cycleIndex !== expectedCycleIndex) {
    throw new Error("periodic checkpoint cycle index is not the next cycle");
  }
  const expectedStartTimeSec = expectedCycleIndex * definition.cycleLengthSec;
  const expectedEndTimeSec = (expectedCycleIndex + 1)
    * definition.cycleLengthSec;
  const initialEndpoint = canonicalEndpoint(observation.initialEndpoint);
  const finalEndpoint = canonicalEndpoint(observation.finalEndpoint);
  if (
    !Object.is(initialEndpoint.timeSec, expectedStartTimeSec)
    || !Object.is(finalEndpoint.timeSec, expectedEndTimeSec)
  ) throw new Error("periodic checkpoint endpoints are not at exact cycle phases");
  assertEndpointExactlyEqual(
    initialEndpoint,
    state.lastEndpoint,
    state.registry,
    input.sha256Hex,
  );
  if (
    initialEndpoint.differentialState.slsMode !== definition.slsMode
    || finalEndpoint.differentialState.slsMode !== definition.slsMode
  ) throw new Error("periodic checkpoint changed SLS topology");

  const adjacentMetricResult = evaluatePhaseB1CompleteEndpointMetricV1({
    referenceEndpoint: initialEndpoint,
    candidateEndpoint: finalEndpoint,
    registry: state.registry,
    sha256Hex: input.sha256Hex,
  });
  const adjacentMetric = summarizeMetric(adjacentMetricResult);
  const flow = summarizeFlow(
    observation.integratedFlowVolumeByFlow,
    definition,
  );
  const totalBloodVolume = summarizeTotalBloodVolume(
    state,
    initialEndpoint,
    finalEndpoint,
    observation.maximumRelativeTotalBloodVolumeDrift,
  );
  const upstream = deepFreeze({
    exactOneScheduleSupercycleVerified:
      observation.exactOneScheduleSupercycleVerified,
    committedIntervalProvenanceVerified:
      observation.committedIntervalProvenanceVerified,
    structuralAndNumericalIntervalLedgerGatesPass:
      observation.structuralAndNumericalIntervalLedgerGatesPass,
    projectionClippingClampAndFallbackFree:
      observation.projectionClippingClampAndFallbackFree,
  });
  const adjacentCompleteStatePass = adjacentMetric.maximumNormalizedDistance
    < definition.completeStateMismatchTolerance;
  const adjacentLandDriftPass = adjacentMetric.maximumLandNormalizedDistance
    < definition.landStateDriftTolerance;
  const adjacentSlsDriftPass = slsMetricPass(adjacentMetric, definition);
  const totalBloodVolumePass = totalBloodVolume.perSupercyclePass
    && totalBloodVolume.cumulativePass;
  const upstreamPass = Object.values(upstream).every((value) => value);
  const cycleLocalPass = adjacentCompleteStatePass
    && adjacentLandDriftPass
    && adjacentSlsDriftPass
    && flow.signedFlowAgreementPass
    && flow.signedDecompositionPass
    && totalBloodVolumePass
    && upstreamPass;

  let streakStartEndpoint = state.consecutivePassingSupercycles > 0
    ? state.streakStartEndpoint
    : initialEndpoint;
  let streakWindowMetric = summarizeMetric(
    evaluatePhaseB1CompleteEndpointMetricV1({
      referenceEndpoint: streakStartEndpoint,
      candidateEndpoint: finalEndpoint,
      registry: state.registry,
      sha256Hex: input.sha256Hex,
    }),
  );
  let streakWindowCompleteStatePass = streakWindowMetric.maximumNormalizedDistance
    < definition.completeStateMismatchTolerance;
  let streakWindowLandDriftPass = streakWindowMetric
    .maximumLandNormalizedDistance < definition.landStateDriftTolerance;
  let streakWindowSlsDriftPass = slsMetricPass(
    streakWindowMetric,
    definition,
  );
  let streakWindowPass = streakWindowCompleteStatePass
    && streakWindowLandDriftPass
    && streakWindowSlsDriftPass;
  let previousStreakWindowRejectedAndRestartedAtCurrentCycle = false;
  let consecutivePassingSupercycles = 0;
  if (cycleLocalPass) {
    if (streakWindowPass) {
      consecutivePassingSupercycles =
        state.consecutivePassingSupercycles + 1;
    } else {
      previousStreakWindowRejectedAndRestartedAtCurrentCycle = true;
      streakStartEndpoint = initialEndpoint;
      streakWindowMetric = adjacentMetric;
      streakWindowCompleteStatePass = adjacentCompleteStatePass;
      streakWindowLandDriftPass = adjacentLandDriftPass;
      streakWindowSlsDriftPass = adjacentSlsDriftPass;
      streakWindowPass = true;
      consecutivePassingSupercycles = 1;
    }
  } else {
    streakStartEndpoint = finalEndpoint;
    streakWindowMetric = summarizeMetric(
      evaluatePhaseB1CompleteEndpointMetricV1({
        referenceEndpoint: finalEndpoint,
        candidateEndpoint: finalEndpoint,
        registry: state.registry,
        sha256Hex: input.sha256Hex,
      }),
    );
    streakWindowCompleteStatePass = true;
    streakWindowLandDriftPass = true;
    streakWindowSlsDriftPass = slsMetricPass(
      streakWindowMetric,
      definition,
    );
    streakWindowPass = false;
  }

  const completedSupercycleCount = expectedCycleIndex + 1;
  const periodicConvergenceCriterionPass =
    consecutivePassingSupercycles
      >= definition.requiredConsecutivePassingSupercycles;
  const terminalStatus = periodicConvergenceCriterionPass
    ? "converged" as const
    : completedSupercycleCount >= definition.maximumSupercycles
      ? "maximum-supercycles-exhausted" as const
      : "running" as const;
  const initialProjection = buildPhaseB1CompleteEndpointProjectionV1({
    endpoint: initialEndpoint,
    sha256Hex: input.sha256Hex,
  });
  const finalProjection = buildPhaseB1CompleteEndpointProjectionV1({
    endpoint: finalEndpoint,
    sha256Hex: input.sha256Hex,
  });
  const streakStartProjection = buildPhaseB1CompleteEndpointProjectionV1({
    endpoint: streakStartEndpoint,
    sha256Hex: input.sha256Hex,
  });
  const payload = deepFreeze<PhaseB1NormalSinusBePeriodicCheckpointPayloadV1>({
    checkpointId: PHASE_B1_NORMAL_SINUS_BE_PERIODIC_CHECKPOINT_V1_ID,
    definitionContentSha256: definition.contentSha256,
    previousCheckpointContentSha256:
      state.lastCheckpoint?.contentSha256 ?? null,
    cycleIndex: expectedCycleIndex,
    completedSupercycleCount,
    startTimeSec: expectedStartTimeSec,
    endTimeSec: expectedEndTimeSec,
    initialEndpointContentSha256: initialProjection.contentSha256,
    finalEndpointContentSha256: finalProjection.contentSha256,
    streakStartEndpointContentSha256: streakStartProjection.contentSha256,
    adjacentMetric,
    streakWindowMetric,
    flow,
    totalBloodVolume,
    upstream,
    gates: deepFreeze({
      adjacentCompleteStatePass,
      adjacentLandDriftPass,
      adjacentSlsDriftPass,
      streakWindowCompleteStatePass,
      streakWindowLandDriftPass,
      streakWindowSlsDriftPass,
      signedFlowAgreementPass: flow.signedFlowAgreementPass,
      signedDecompositionPass: flow.signedDecompositionPass,
      totalBloodVolumePass,
      upstreamPass,
      cycleLocalPass,
      streakWindowPass,
    }),
    previousStreakWindowRejectedAndRestartedAtCurrentCycle,
    consecutivePassingSupercycles,
    terminalStatus,
    periodicConvergenceCriterionPass,
    singleStartPeriodOneCriterionPass: periodicConvergenceCriterionPass,
    normalSinusMultiStartAcceptancePass: false,
    physiologicalValidationPass: false,
    phaseB1AcceptancePass: false,
    liveScheduleSolverExecutedByFoundation: false,
    liveCommittedIntervalLedgerAuthenticatedByFoundation: false,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
  });
  const checkpoint = deepFreeze<PhaseB1NormalSinusBePeriodicCheckpointV1>({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
  });
  validatePhaseB1NormalSinusBePeriodicCheckpointV1(
    checkpoint,
    definition,
    state.lastCheckpoint,
    input.sha256Hex,
  );
  const nextState = Object.freeze({
    stateId: PHASE_B1_NORMAL_SINUS_BE_PERIODIC_STATE_V1_ID,
    definition,
    schedule: state.schedule,
    registry: state.registry,
    initialEndpoint: state.initialEndpoint,
    lastEndpoint: finalEndpoint,
    streakStartEndpoint,
    runInitialTotalBloodVolumeM3: state.runInitialTotalBloodVolumeM3,
    completedSupercycleCount,
    consecutivePassingSupercycles,
    lastCheckpoint: checkpoint,
    retainedCheckpointCount: 1 as const,
    retainedEndpointCount: 3 as const,
    terminalStatus,
    periodicConvergenceCriterionPass,
    singleStartPeriodOneCriterionPass: periodicConvergenceCriterionPass,
    normalSinusMultiStartAcceptancePass: false as const,
    physiologicalValidationPass: false as const,
    phaseB1AcceptancePass: false as const,
  });
  LIVE_STATES.delete(state);
  LIVE_STATES.add(nextState);
  return Object.freeze({ checkpoint, state: nextState });
}

export function phaseB1NormalSinusBePeriodicCheckpointHashPayloadV1(
  checkpoint: PhaseB1NormalSinusBePeriodicCheckpointV1,
): PhaseB1NormalSinusBePeriodicCheckpointPayloadV1 {
  assertCheckpointSchema(checkpoint);
  const { contentSha256: _contentSha256, ...payload } = checkpoint;
  return deepFreeze(payload);
}

export function validatePhaseB1NormalSinusBePeriodicCheckpointV1(
  value: unknown,
  definition: PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
  previousCheckpoint: PhaseB1NormalSinusBePeriodicCheckpointV1 | null,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1NormalSinusBePeriodicCheckpointV1 {
  requireSha256Provider(sha256Hex);
  validatePhaseB1NormalSinusBePeriodicConvergenceDefinitionV1(
    definition,
    sha256Hex,
  );
  assertCheckpointSchema(value);
  assertRecursivelyFrozen(value, "checkpoint");
  const checkpoint = value as PhaseB1NormalSinusBePeriodicCheckpointV1;
  if (previousCheckpoint !== null) {
    assertCheckpointSchema(previousCheckpoint);
    assertRecursivelyFrozen(previousCheckpoint, "previousCheckpoint");
    if (previousCheckpoint.definitionContentSha256 !== definition.contentSha256) {
      throw new Error("previous periodic checkpoint definition binding mismatch");
    }
    assertCanonicalSha256(
      phaseB1NormalSinusBePeriodicCheckpointHashPayloadV1(previousCheckpoint),
      previousCheckpoint.contentSha256,
      sha256Hex,
      "previousCheckpoint.contentSha256",
    );
    if (
      previousCheckpoint.terminalStatus !== "running"
      || previousCheckpoint.periodicConvergenceCriterionPass !== false
      || previousCheckpoint.singleStartPeriodOneCriterionPass !== false
    ) {
      throw new Error(
        "previous periodic checkpoint is terminal and cannot have a successor",
      );
    }
  }
  assertCheckpointConstants(checkpoint, definition, previousCheckpoint);
  if (
    checkpoint.definitionContentSha256 !== definition.contentSha256
    || checkpoint.previousCheckpointContentSha256
      !== (previousCheckpoint?.contentSha256 ?? null)
  ) throw new Error("periodic checkpoint hash-chain binding mismatch");
  assertCanonicalSha256(
    phaseB1NormalSinusBePeriodicCheckpointHashPayloadV1(checkpoint),
    checkpoint.contentSha256,
    sha256Hex,
  );
  return checkpoint;
}

function summarizeMetric(
  metric: PhaseB1CompleteEndpointMetricResultV1,
): PhaseB1NormalSinusBePeriodicMetricSummaryV1 {
  const land = metric.components.filter((component) =>
    component.label.includes(".land."));
  if (land.length !== 30) {
    throw new Error("periodic metric must contain exactly thirty Land scalars");
  }
  const landMaximum = maximumComponent(land);
  const sls = metric.components.filter((component) =>
    component.label.includes(".sls."));
  if (metric.slsMode === "on" && sls.length !== 5) {
    throw new Error("SLS-on periodic metric must contain exactly five SLS scalars");
  }
  if (metric.slsMode === "off" && sls.length !== 0) {
    throw new Error("SLS-off periodic metric must physically omit SLS scalars");
  }
  const slsMaximum = sls.length === 0 ? null : maximumComponent(sls);
  return deepFreeze({
    maximumNormalizedDistance: metric.maximumNormalizedDistance,
    maximizingScalarLabel: metric.maximizingScalarLabel,
    maximumLandNormalizedDistance: landMaximum.normalizedDistance,
    maximizingLandScalarLabel: landMaximum.label,
    maximumSlsNormalizedDistance: slsMaximum?.normalizedDistance ?? null,
    maximizingSlsScalarLabel: slsMaximum?.label ?? null,
    slsStatePhysicallyAbsent: metric.slsMode === "off",
  });
}

function maximumComponent(
  components: readonly PhaseB1CompleteEndpointMetricResultV1[
    "components"
  ][number][],
): PhaseB1CompleteEndpointMetricResultV1["components"][number] {
  return components.reduce((maximum, component) =>
    component.normalizedDistance > maximum.normalizedDistance
      ? component
      : maximum);
}

function summarizeFlow(
  raw: PhaseB1NormalSinusBePeriodicCommittedCycleObservationV1[
    "integratedFlowVolumeByFlow"
  ],
  definition: PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
): PhaseB1NormalSinusBePeriodicFlowSummaryV1 {
  assertExactPlainRecordV1(
    raw,
    FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
    "integratedFlowVolumeByFlow",
  );
  const validated = Object.fromEntries(
    FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1.map((flowId) => {
      const value = raw[flowId];
      assertExactPlainRecordV1(value, [
        "signedVolumeM3",
        "forwardVolumeM3",
        "regurgitantVolumeM3",
      ], `integratedFlowVolumeByFlow.${flowId}`);
      return [flowId, {
        signedVolumeM3: requireFinite(
          value.signedVolumeM3,
          `${flowId}.signedVolumeM3`,
        ),
        forwardVolumeM3: requireNonNegativeFinite(
          value.forwardVolumeM3,
          `${flowId}.forwardVolumeM3`,
        ),
        regurgitantVolumeM3: requireNonNegativeFinite(
          value.regurgitantVolumeM3,
          `${flowId}.regurgitantVolumeM3`,
        ),
      }];
    }),
  ) as Record<FourChamberFlowId, PhaseB1NormalSinusBePeriodicIntegratedFlowVolumeV1>;
  const systemicMeanSignedNetFlowM3PerSec = validated.Q_sys.signedVolumeM3
    / definition.cycleLengthSec;
  const systemicNetFlowUsableAsRelativeDenominator =
    Math.abs(systemicMeanSignedNetFlowM3PerSec) > 0;
  let maximumRelativeSignedNetFlowMismatch: number | null = null;
  let maximizingFlowId: FourChamberFlowId | null = null;
  let maximumSignedDecompositionRelativeResidual = 0;
  const byFlow = deepFreeze(Object.fromEntries(
    FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1.map((flowId) => {
      const value = validated[flowId];
      const meanSignedFlowM3PerSec = value.signedVolumeM3
        / definition.cycleLengthSec;
      const signedDecompositionResidualM3 = value.signedVolumeM3
        - value.forwardVolumeM3 + value.regurgitantVolumeM3;
      const decompositionDenominator = Math.abs(value.signedVolumeM3)
        + value.forwardVolumeM3 + value.regurgitantVolumeM3;
      const signedDecompositionRelativeResidual = decompositionDenominator === 0
        ? 0
        : Math.abs(signedDecompositionResidualM3) / decompositionDenominator;
      maximumSignedDecompositionRelativeResidual = Math.max(
        maximumSignedDecompositionRelativeResidual,
        signedDecompositionRelativeResidual,
      );
      const relativeMismatchFromSystemicNetFlow =
        systemicNetFlowUsableAsRelativeDenominator
          ? Math.abs(
            meanSignedFlowM3PerSec - systemicMeanSignedNetFlowM3PerSec,
          ) / Math.abs(systemicMeanSignedNetFlowM3PerSec)
          : null;
      if (
        relativeMismatchFromSystemicNetFlow !== null
        && (
          maximumRelativeSignedNetFlowMismatch === null
          || relativeMismatchFromSystemicNetFlow
            > maximumRelativeSignedNetFlowMismatch
        )
      ) {
        maximumRelativeSignedNetFlowMismatch =
          relativeMismatchFromSystemicNetFlow;
        maximizingFlowId = flowId;
      }
      return [flowId, deepFreeze({
        flowId,
        ...value,
        meanSignedFlowM3PerSec,
        signedDecompositionResidualM3,
        signedDecompositionRelativeResidual,
        relativeMismatchFromSystemicNetFlow,
      })];
    }),
  )) as Readonly<Record<
    FourChamberFlowId,
    PhaseB1NormalSinusBePeriodicFlowSummaryByFlowV1
  >>;
  return deepFreeze({
    referenceFlowId: "Q_sys" as const,
    systemicMeanSignedNetFlowM3PerSec,
    systemicNetFlowUsableAsRelativeDenominator,
    byFlow,
    maximumRelativeSignedNetFlowMismatch,
    maximizingFlowId,
    maximumSignedDecompositionRelativeResidual,
    signedFlowAgreementPass:
      maximumRelativeSignedNetFlowMismatch !== null
      && maximumRelativeSignedNetFlowMismatch
        < definition.signedNetFlowRelativeTolerance,
    signedDecompositionPass:
      maximumSignedDecompositionRelativeResidual
        <= definition.flowDecompositionRelativeTolerance,
    forwardAndRegurgitantVolumesAuditedSeparately: true as const,
    forwardAndRegurgitantVolumesComparedForEquality: false as const,
  });
}

function summarizeTotalBloodVolume(
  state: PhaseB1NormalSinusBePeriodicStateV1,
  initialEndpoint: PhaseB1EndpointStateV1,
  finalEndpoint: PhaseB1EndpointStateV1,
  reportedMaximumRelativeDrift: number,
): PhaseB1NormalSinusBePeriodicTbvSummaryV1 {
  const definition = state.definition;
  const runInitialTotalBloodVolumeM3 = state.runInitialTotalBloodVolumeM3;
  const cycleInitialTotalBloodVolumeM3 = totalBloodVolume(initialEndpoint);
  const cycleFinalTotalBloodVolumeM3 = totalBloodVolume(finalEndpoint);
  const endpointRelativeTotalBloodVolumeDriftThisCycle = Math.abs(
    cycleFinalTotalBloodVolumeM3 - cycleInitialTotalBloodVolumeM3,
  ) / cycleInitialTotalBloodVolumeM3;
  const reported = requireNonNegativeFinite(
    reportedMaximumRelativeDrift,
    "maximumRelativeTotalBloodVolumeDrift",
  );
  const effective = Math.max(
    endpointRelativeTotalBloodVolumeDriftThisCycle,
    reported,
  );
  const cumulativeRelativeTotalBloodVolumeDrift = Math.abs(
    cycleFinalTotalBloodVolumeM3 - runInitialTotalBloodVolumeM3,
  ) / runInitialTotalBloodVolumeM3;
  return deepFreeze({
    runInitialTotalBloodVolumeM3,
    cycleInitialTotalBloodVolumeM3,
    cycleFinalTotalBloodVolumeM3,
    endpointRelativeTotalBloodVolumeDriftThisCycle,
    reportedMaximumRelativeTotalBloodVolumeDriftThisCycle: reported,
    effectiveMaximumRelativeTotalBloodVolumeDriftThisCycle: effective,
    cumulativeRelativeTotalBloodVolumeDrift,
    perSupercyclePass:
      effective < definition.totalBloodVolumeRelativeTolerancePerSupercycle,
    cumulativePass:
      cumulativeRelativeTotalBloodVolumeDrift
        < definition.cumulativeTotalBloodVolumeRelativeTolerance,
  });
}

function slsMetricPass(
  metric: PhaseB1NormalSinusBePeriodicMetricSummaryV1,
  definition: PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
): boolean {
  return definition.slsMode === "off"
    ? metric.slsStatePhysicallyAbsent
      && metric.maximumSlsNormalizedDistance === null
      && metric.maximizingSlsScalarLabel === null
    : !metric.slsStatePhysicallyAbsent
      && metric.maximumSlsNormalizedDistance !== null
      && metric.maximumSlsNormalizedDistance
        < definition.slsStateDriftTolerance;
}

function validateObservation(
  value: unknown,
): PhaseB1NormalSinusBePeriodicCommittedCycleObservationV1 {
  assertExactPlainRecordV1(value, [
    "cycleIndex",
    "initialEndpoint",
    "finalEndpoint",
    "integratedFlowVolumeByFlow",
    "maximumRelativeTotalBloodVolumeDrift",
    "exactOneScheduleSupercycleVerified",
    "committedIntervalProvenanceVerified",
    "structuralAndNumericalIntervalLedgerGatesPass",
    "projectionClippingClampAndFallbackFree",
  ], "Phase B1 periodic committed-cycle observation");
  if (
    typeof value.cycleIndex !== "number"
    || !Number.isSafeInteger(value.cycleIndex)
    || value.cycleIndex < 0
  ) {
    throw new Error("periodic observation cycleIndex must be non-negative");
  }
  for (const field of [
    "exactOneScheduleSupercycleVerified",
    "committedIntervalProvenanceVerified",
    "structuralAndNumericalIntervalLedgerGatesPass",
    "projectionClippingClampAndFallbackFree",
  ] as const) {
    if (typeof value[field] !== "boolean") {
      throw new Error(`periodic observation ${field} must be boolean`);
    }
  }
  requireNonNegativeFinite(
    value.maximumRelativeTotalBloodVolumeDrift,
    "maximumRelativeTotalBloodVolumeDrift",
  );
  return value as PhaseB1NormalSinusBePeriodicCommittedCycleObservationV1;
}

function assertDefinitionConstants(
  definition: PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
): void {
  assertDensePlainArrayV1(
    definition.supportedNominalDtSec,
    PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SUPPORTED_DT_SEC_V1.length,
    "definition.supportedNominalDtSec",
  );
  assertExactPlainRecordV1(
    definition.claimBoundary,
    Object.keys(DEFINITION_CLAIM_BOUNDARY),
    "definition.claimBoundary",
  );
  if (
    definition.schemaId
      !== PHASE_B1_NORMAL_SINUS_BE_PERIODIC_CONVERGENCE_SCHEMA_V1_ID
    || definition.definitionId
      !== PHASE_B1_NORMAL_SINUS_BE_PERIODIC_CONVERGENCE_DEFINITION_V1_ID
    || definition.rhythm !== "normal-sinus-project-synthetic"
    || definition.scheduleId
      !== PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_V1_ID
    || definition.sourceStartTimeSec !== 0
    || (definition.slsMode !== "on" && definition.slsMode !== "off")
    || definition.newtonScaleRegistryFixedBeforeRun !== true
    || definition.adaptiveNewtonRescalingAllowed !== false
    || definition.endpointScalarCount !== (definition.slsMode === "on" ? 61 : 56)
    || definition.cycleLengthSec
      !== PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1
    || definition.maximumSupercycles
      !== PHASE_B1_NORMAL_SINUS_BE_PERIODIC_MAX_SUPERCYCLES_V1
    || definition.requiredConsecutivePassingSupercycles
      !== PHASE_B1_NORMAL_SINUS_BE_PERIODIC_REQUIRED_CONSECUTIVE_V1
    || definition.completeEndpointMetricId
      !== PHASE_B1_COMPLETE_ENDPOINT_METRIC_V1_ID
    || definition.completeStateMismatchTolerance
      !== PHASE_B1_NORMAL_SINUS_BE_PERIODIC_STATE_TOLERANCE_V1
    || definition.landStateDriftTolerance
      !== PHASE_B1_NORMAL_SINUS_BE_PERIODIC_STATE_TOLERANCE_V1
    || definition.slsStateDriftTolerance
      !== PHASE_B1_NORMAL_SINUS_BE_PERIODIC_STATE_TOLERANCE_V1
    || definition.streakWindowCompleteStateGateRequired !== true
    || definition.streakWindowLandAndSlsDriftGateRequired !== true
    || definition.signedNetFlowReferenceFlowId !== "Q_sys"
    || definition.signedNetFlowAgreement
      !== "all-eight-cycle-mean-signed-flows-relative-to-systemic-net-flow"
    || definition.signedNetFlowRelativeTolerance
      !== PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SIGNED_FLOW_TOLERANCE_V1
    || definition.zeroSystemicNetFlowAccepted !== false
    || definition.forwardAndRegurgitantVolumesReportedSeparately !== true
    || definition.forwardAndRegurgitantVolumesRequiredEqual !== false
    || definition.flowDecompositionRelativeTolerance
      !== FLOW_DECOMPOSITION_RELATIVE_TOLERANCE
    || definition.totalBloodVolumeRelativeTolerancePerSupercycle
      !== PHASE_B1_NORMAL_SINUS_BE_PERIODIC_TBV_TOLERANCE_V1
    || definition.cumulativeTotalBloodVolumeRelativeTolerance
      !== PHASE_B1_NORMAL_SINUS_BE_PERIODIC_TBV_TOLERANCE_V1
    || definition.exactCycleTimesComputedFromIntegerCycleIndex !== true
    || definition.eventIntervalOwnership !== "(start,end]"
    || definition.maximumCycleExhaustionMeansConvergence !== false
    || definition.checkpointHashChainRequired !== true
    || definition.hashAlgorithm !== NORMATIVE_MANIFEST_HASH_ALGORITHM
    || !PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SUPPORTED_DT_SEC_V1.every(
      (dt, index) => Object.is(definition.supportedNominalDtSec[index], dt),
    )
    || !PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SUPPORTED_DT_SEC_V1.includes(
      definition.nominalDtSec as 0.001,
    )
    || Object.keys(DEFINITION_CLAIM_BOUNDARY).some((key) =>
      definition.claimBoundary[key as keyof typeof DEFINITION_CLAIM_BOUNDARY]
        !== DEFINITION_CLAIM_BOUNDARY[
          key as keyof typeof DEFINITION_CLAIM_BOUNDARY
        ])
  ) throw new Error("periodic convergence definition constants drifted");
  for (const [field, value] of [
    ["scheduleContentSha256", definition.scheduleContentSha256],
    ["sourceEndpointContentSha256", definition.sourceEndpointContentSha256],
    [
      "sourceWallMaterialBindingContentSha256",
      definition.sourceWallMaterialBindingContentSha256,
    ],
    [
      "newtonScaleRegistryContentSha256",
      definition.newtonScaleRegistryContentSha256,
    ],
  ] as const) requireSha256(value, `definition.${field}`);
}

function assertCheckpointSchema(value: unknown): asserts value is
  PhaseB1NormalSinusBePeriodicCheckpointV1 {
  assertExactPlainRecordV1(value, [
    "checkpointId",
    "definitionContentSha256",
    "previousCheckpointContentSha256",
    "cycleIndex",
    "completedSupercycleCount",
    "startTimeSec",
    "endTimeSec",
    "initialEndpointContentSha256",
    "finalEndpointContentSha256",
    "streakStartEndpointContentSha256",
    "adjacentMetric",
    "streakWindowMetric",
    "flow",
    "totalBloodVolume",
    "upstream",
    "gates",
    "previousStreakWindowRejectedAndRestartedAtCurrentCycle",
    "consecutivePassingSupercycles",
    "terminalStatus",
    "periodicConvergenceCriterionPass",
    "singleStartPeriodOneCriterionPass",
    "normalSinusMultiStartAcceptancePass",
    "physiologicalValidationPass",
    "phaseB1AcceptancePass",
    "liveScheduleSolverExecutedByFoundation",
    "liveCommittedIntervalLedgerAuthenticatedByFoundation",
    "hashAlgorithm",
    "contentSha256",
  ], "Phase B1 normal-sinus BE periodic checkpoint");
}

function assertCheckpointConstants(
  checkpoint: PhaseB1NormalSinusBePeriodicCheckpointV1,
  definition: PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
  previousCheckpoint: PhaseB1NormalSinusBePeriodicCheckpointV1 | null,
): void {
  assertMetricSummarySchema(checkpoint.adjacentMetric, definition, "adjacentMetric");
  assertMetricSummarySchema(
    checkpoint.streakWindowMetric,
    definition,
    "streakWindowMetric",
  );
  assertFlowSummaryConsistency(checkpoint.flow, definition);
  assertTbvSummaryConsistency(checkpoint.totalBloodVolume, definition);
  assertExactPlainRecordV1(checkpoint.upstream, [
    "exactOneScheduleSupercycleVerified",
    "committedIntervalProvenanceVerified",
    "structuralAndNumericalIntervalLedgerGatesPass",
    "projectionClippingClampAndFallbackFree",
  ], "checkpoint.upstream");
  const upstreamValues = Object.values(checkpoint.upstream);
  if (upstreamValues.some((value) => typeof value !== "boolean")) {
    throw new Error("checkpoint upstream gates must be boolean");
  }
  assertExactPlainRecordV1(checkpoint.gates, [
    "adjacentCompleteStatePass",
    "adjacentLandDriftPass",
    "adjacentSlsDriftPass",
    "streakWindowCompleteStatePass",
    "streakWindowLandDriftPass",
    "streakWindowSlsDriftPass",
    "signedFlowAgreementPass",
    "signedDecompositionPass",
    "totalBloodVolumePass",
    "upstreamPass",
    "cycleLocalPass",
    "streakWindowPass",
  ], "checkpoint.gates");
  if (Object.values(checkpoint.gates).some((value) => typeof value !== "boolean")) {
    throw new Error("checkpoint decision gates must be boolean");
  }
  const expectedAdjacentCompleteStatePass = checkpoint.adjacentMetric
    .maximumNormalizedDistance < definition.completeStateMismatchTolerance;
  const expectedAdjacentLandDriftPass = checkpoint.adjacentMetric
    .maximumLandNormalizedDistance < definition.landStateDriftTolerance;
  const expectedAdjacentSlsDriftPass = slsMetricPass(
    checkpoint.adjacentMetric,
    definition,
  );
  const expectedStreakWindowCompleteStatePass = checkpoint.streakWindowMetric
    .maximumNormalizedDistance < definition.completeStateMismatchTolerance;
  const expectedStreakWindowLandDriftPass = checkpoint.streakWindowMetric
    .maximumLandNormalizedDistance < definition.landStateDriftTolerance;
  const expectedStreakWindowSlsDriftPass = slsMetricPass(
    checkpoint.streakWindowMetric,
    definition,
  );
  const expectedTotalBloodVolumePass = checkpoint.totalBloodVolume
    .perSupercyclePass && checkpoint.totalBloodVolume.cumulativePass;
  const expectedUpstreamPass = upstreamValues.every((value) => value);
  const expectedCycleLocalPass = expectedAdjacentCompleteStatePass
    && expectedAdjacentLandDriftPass
    && expectedAdjacentSlsDriftPass
    && checkpoint.flow.signedFlowAgreementPass
    && checkpoint.flow.signedDecompositionPass
    && expectedTotalBloodVolumePass
    && expectedUpstreamPass;
  const expectedStreakWindowPass = expectedCycleLocalPass
    && expectedStreakWindowCompleteStatePass
    && expectedStreakWindowLandDriftPass
    && expectedStreakWindowSlsDriftPass;
  const expectedGates = {
    adjacentCompleteStatePass: expectedAdjacentCompleteStatePass,
    adjacentLandDriftPass: expectedAdjacentLandDriftPass,
    adjacentSlsDriftPass: expectedAdjacentSlsDriftPass,
    streakWindowCompleteStatePass: expectedStreakWindowCompleteStatePass,
    streakWindowLandDriftPass: expectedStreakWindowLandDriftPass,
    streakWindowSlsDriftPass: expectedStreakWindowSlsDriftPass,
    signedFlowAgreementPass: checkpoint.flow.signedFlowAgreementPass,
    signedDecompositionPass: checkpoint.flow.signedDecompositionPass,
    totalBloodVolumePass: expectedTotalBloodVolumePass,
    upstreamPass: expectedUpstreamPass,
    cycleLocalPass: expectedCycleLocalPass,
    streakWindowPass: expectedStreakWindowPass,
  } as const;
  if (Object.entries(expectedGates).some(([key, expected]) =>
    checkpoint.gates[key as keyof typeof checkpoint.gates] !== expected)) {
    throw new Error("checkpoint decision gates disagree with their diagnostics");
  }
  const expectedPeriodicConvergenceCriterionPass =
    checkpoint.consecutivePassingSupercycles
      >= definition.requiredConsecutivePassingSupercycles;
  const previousConsecutivePassingSupercycles =
    previousCheckpoint?.consecutivePassingSupercycles ?? 0;
  const expectedConsecutivePassingSupercycles = !expectedCycleLocalPass
    ? 0
    : checkpoint.previousStreakWindowRejectedAndRestartedAtCurrentCycle
      ? 1
      : previousConsecutivePassingSupercycles + 1;
  const expectedInitialEndpointContentSha256 = previousCheckpoint
    ?.finalEndpointContentSha256 ?? definition.sourceEndpointContentSha256;
  const expectedStreakStartEndpointContentSha256 = !expectedCycleLocalPass
    ? checkpoint.finalEndpointContentSha256
    : checkpoint.previousStreakWindowRejectedAndRestartedAtCurrentCycle
      || previousConsecutivePassingSupercycles === 0
      ? checkpoint.initialEndpointContentSha256
      : previousCheckpoint?.streakStartEndpointContentSha256
        ?? checkpoint.initialEndpointContentSha256;
  if (previousCheckpoint === null) {
    assertRoundoffEqual(
      checkpoint.totalBloodVolume.cycleInitialTotalBloodVolumeM3,
      checkpoint.totalBloodVolume.runInitialTotalBloodVolumeM3,
      "root checkpoint initial TBV",
    );
  } else {
    assertRoundoffEqual(
      checkpoint.totalBloodVolume.runInitialTotalBloodVolumeM3,
      previousCheckpoint.totalBloodVolume.runInitialTotalBloodVolumeM3,
      "checkpoint run-initial TBV continuity",
    );
    assertRoundoffEqual(
      checkpoint.totalBloodVolume.cycleInitialTotalBloodVolumeM3,
      previousCheckpoint.totalBloodVolume.cycleFinalTotalBloodVolumeM3,
      "checkpoint cycle-boundary TBV continuity",
    );
  }
  const expectedTerminal = checkpoint.periodicConvergenceCriterionPass
    ? "converged"
    : checkpoint.completedSupercycleCount >= definition.maximumSupercycles
      ? "maximum-supercycles-exhausted"
      : "running";
  if (
    checkpoint.checkpointId
      !== PHASE_B1_NORMAL_SINUS_BE_PERIODIC_CHECKPOINT_V1_ID
    || checkpoint.hashAlgorithm !== NORMATIVE_MANIFEST_HASH_ALGORITHM
    || checkpoint.cycleIndex < 0
    || !Number.isSafeInteger(checkpoint.cycleIndex)
    || checkpoint.completedSupercycleCount !== checkpoint.cycleIndex + 1
    || checkpoint.completedSupercycleCount > definition.maximumSupercycles
    || checkpoint.consecutivePassingSupercycles < 0
    || !Number.isSafeInteger(checkpoint.consecutivePassingSupercycles)
    || checkpoint.consecutivePassingSupercycles
      > checkpoint.completedSupercycleCount
    || checkpoint.consecutivePassingSupercycles
      > definition.requiredConsecutivePassingSupercycles
    || checkpoint.consecutivePassingSupercycles
      !== expectedConsecutivePassingSupercycles
    || checkpoint.cycleIndex
      !== (previousCheckpoint?.completedSupercycleCount ?? 0)
    || checkpoint.initialEndpointContentSha256
      !== expectedInitialEndpointContentSha256
    || checkpoint.streakStartEndpointContentSha256
      !== expectedStreakStartEndpointContentSha256
    || checkpoint.periodicConvergenceCriterionPass
      !== expectedPeriodicConvergenceCriterionPass
    || (!expectedCycleLocalPass
      && checkpoint.consecutivePassingSupercycles !== 0)
    || (expectedCycleLocalPass
      && checkpoint.consecutivePassingSupercycles < 1)
    || (checkpoint.previousStreakWindowRejectedAndRestartedAtCurrentCycle
      && (!expectedCycleLocalPass
        || checkpoint.consecutivePassingSupercycles !== 1))
    || !Object.is(
      checkpoint.startTimeSec,
      checkpoint.cycleIndex * definition.cycleLengthSec,
    )
    || !Object.is(
      checkpoint.endTimeSec,
      checkpoint.completedSupercycleCount * definition.cycleLengthSec,
    )
    || checkpoint.terminalStatus !== expectedTerminal
    || checkpoint.singleStartPeriodOneCriterionPass
      !== checkpoint.periodicConvergenceCriterionPass
    || checkpoint.normalSinusMultiStartAcceptancePass !== false
    || checkpoint.physiologicalValidationPass !== false
    || checkpoint.phaseB1AcceptancePass !== false
    || checkpoint.liveScheduleSolverExecutedByFoundation !== false
    || checkpoint.liveCommittedIntervalLedgerAuthenticatedByFoundation !== false
  ) throw new Error("periodic checkpoint constants or claim boundary drifted");
  requireSha256(
    checkpoint.definitionContentSha256,
    "checkpoint.definitionContentSha256",
  );
  if (checkpoint.previousCheckpointContentSha256 !== null) {
    requireSha256(
      checkpoint.previousCheckpointContentSha256,
      "checkpoint.previousCheckpointContentSha256",
    );
  }
  requireSha256(
    checkpoint.initialEndpointContentSha256,
    "checkpoint.initialEndpointContentSha256",
  );
  requireSha256(
    checkpoint.finalEndpointContentSha256,
    "checkpoint.finalEndpointContentSha256",
  );
  requireSha256(
    checkpoint.streakStartEndpointContentSha256,
    "checkpoint.streakStartEndpointContentSha256",
  );
}

function assertMetricSummarySchema(
  metric: PhaseB1NormalSinusBePeriodicMetricSummaryV1,
  definition: PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
  field: string,
): void {
  assertExactPlainRecordV1(metric, [
    "maximumNormalizedDistance",
    "maximizingScalarLabel",
    "maximumLandNormalizedDistance",
    "maximizingLandScalarLabel",
    "maximumSlsNormalizedDistance",
    "maximizingSlsScalarLabel",
    "slsStatePhysicallyAbsent",
  ], `checkpoint.${field}`);
  const maximum = requireNonNegativeFinite(
    metric.maximumNormalizedDistance,
    `${field}.maximumNormalizedDistance`,
  );
  const landMaximum = requireNonNegativeFinite(
    metric.maximumLandNormalizedDistance,
    `${field}.maximumLandNormalizedDistance`,
  );
  requireNonEmptyString(metric.maximizingScalarLabel, `${field}.maximizingScalarLabel`);
  const landLabel = requireNonEmptyString(
    metric.maximizingLandScalarLabel,
    `${field}.maximizingLandScalarLabel`,
  );
  if (!landLabel.includes(".land.") || landMaximum > maximum) {
    throw new Error(`${field} Land maximum is inconsistent`);
  }
  if (definition.slsMode === "off") {
    if (
      metric.maximumSlsNormalizedDistance !== null
      || metric.maximizingSlsScalarLabel !== null
      || metric.slsStatePhysicallyAbsent !== true
    ) throw new Error(`${field} must physically omit SLS diagnostics`);
    return;
  }
  const slsMaximum = requireNonNegativeFinite(
    metric.maximumSlsNormalizedDistance,
    `${field}.maximumSlsNormalizedDistance`,
  );
  const slsLabel = requireNonEmptyString(
    metric.maximizingSlsScalarLabel,
    `${field}.maximizingSlsScalarLabel`,
  );
  if (
    metric.slsStatePhysicallyAbsent
    || !slsLabel.includes(".sls.")
    || slsMaximum > maximum
  ) throw new Error(`${field} SLS maximum is inconsistent`);
}

function assertFlowSummaryConsistency(
  flow: PhaseB1NormalSinusBePeriodicFlowSummaryV1,
  definition: PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
): void {
  assertExactPlainRecordV1(flow, [
    "referenceFlowId",
    "systemicMeanSignedNetFlowM3PerSec",
    "systemicNetFlowUsableAsRelativeDenominator",
    "byFlow",
    "maximumRelativeSignedNetFlowMismatch",
    "maximizingFlowId",
    "maximumSignedDecompositionRelativeResidual",
    "signedFlowAgreementPass",
    "signedDecompositionPass",
    "forwardAndRegurgitantVolumesAuditedSeparately",
    "forwardAndRegurgitantVolumesComparedForEquality",
  ], "checkpoint.flow");
  assertExactPlainRecordV1(
    flow.byFlow,
    FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
    "checkpoint.flow.byFlow",
  );
  let maximumMismatch: number | null = null;
  let maximizingFlowId: FourChamberFlowId | null = null;
  let maximumDecomposition = 0;
  const systemic = requireFinite(
    flow.systemicMeanSignedNetFlowM3PerSec,
    "flow.systemicMeanSignedNetFlowM3PerSec",
  );
  const systemicUsable = Math.abs(systemic) > 0;
  for (const flowId of FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1) {
    const item = flow.byFlow[flowId];
    assertExactPlainRecordV1(item, [
      "flowId",
      "signedVolumeM3",
      "forwardVolumeM3",
      "regurgitantVolumeM3",
      "meanSignedFlowM3PerSec",
      "signedDecompositionResidualM3",
      "signedDecompositionRelativeResidual",
      "relativeMismatchFromSystemicNetFlow",
    ], `checkpoint.flow.byFlow.${flowId}`);
    if (item.flowId !== flowId) throw new Error(`flow ID mismatch at ${flowId}`);
    const signed = requireFinite(item.signedVolumeM3, `${flowId}.signedVolumeM3`);
    const forward = requireNonNegativeFinite(
      item.forwardVolumeM3,
      `${flowId}.forwardVolumeM3`,
    );
    const regurgitant = requireNonNegativeFinite(
      item.regurgitantVolumeM3,
      `${flowId}.regurgitantVolumeM3`,
    );
    const mean = signed / definition.cycleLengthSec;
    const decomposition = signed - forward + regurgitant;
    const decompositionDenominator = Math.abs(signed) + forward + regurgitant;
    const relativeDecomposition = decompositionDenominator === 0
      ? 0
      : Math.abs(decomposition) / decompositionDenominator;
    assertRoundoffEqual(item.meanSignedFlowM3PerSec, mean, `${flowId}.mean`);
    assertRoundoffEqual(
      item.signedDecompositionResidualM3,
      decomposition,
      `${flowId}.decomposition`,
    );
    assertRoundoffEqual(
      item.signedDecompositionRelativeResidual,
      relativeDecomposition,
      `${flowId}.relativeDecomposition`,
    );
    maximumDecomposition = Math.max(maximumDecomposition, relativeDecomposition);
    const mismatch = systemicUsable
      ? Math.abs(mean - systemic) / Math.abs(systemic)
      : null;
    if (mismatch === null) {
      if (item.relativeMismatchFromSystemicNetFlow !== null) {
        throw new Error(`${flowId} must omit an undefined systemic ratio`);
      }
    } else {
      assertRoundoffEqual(
        item.relativeMismatchFromSystemicNetFlow,
        mismatch,
        `${flowId}.relativeSystemicMismatch`,
      );
      if (maximumMismatch === null || mismatch > maximumMismatch) {
        maximumMismatch = mismatch;
        maximizingFlowId = flowId;
      }
    }
  }
  assertRoundoffEqual(
    flow.byFlow.Q_sys.meanSignedFlowM3PerSec,
    systemic,
    "flow systemic reference",
  );
  if (
    flow.referenceFlowId !== "Q_sys"
    || flow.systemicNetFlowUsableAsRelativeDenominator !== systemicUsable
    || flow.maximizingFlowId !== maximizingFlowId
    || flow.forwardAndRegurgitantVolumesAuditedSeparately !== true
    || flow.forwardAndRegurgitantVolumesComparedForEquality !== false
  ) throw new Error("checkpoint flow policy fields are inconsistent");
  if (maximumMismatch === null) {
    if (flow.maximumRelativeSignedNetFlowMismatch !== null) {
      throw new Error("checkpoint flow maximum mismatch must be null");
    }
  } else {
    assertRoundoffEqual(
      flow.maximumRelativeSignedNetFlowMismatch,
      maximumMismatch,
      "flow maximum relative mismatch",
    );
  }
  assertRoundoffEqual(
    flow.maximumSignedDecompositionRelativeResidual,
    maximumDecomposition,
    "flow maximum decomposition residual",
  );
  const expectedAgreement = maximumMismatch !== null
    && maximumMismatch < definition.signedNetFlowRelativeTolerance;
  const expectedDecomposition = maximumDecomposition
    <= definition.flowDecompositionRelativeTolerance;
  if (
    flow.signedFlowAgreementPass !== expectedAgreement
    || flow.signedDecompositionPass !== expectedDecomposition
  ) throw new Error("checkpoint flow gates disagree with their diagnostics");
}

function assertTbvSummaryConsistency(
  summary: PhaseB1NormalSinusBePeriodicTbvSummaryV1,
  definition: PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
): void {
  assertExactPlainRecordV1(summary, [
    "runInitialTotalBloodVolumeM3",
    "cycleInitialTotalBloodVolumeM3",
    "cycleFinalTotalBloodVolumeM3",
    "endpointRelativeTotalBloodVolumeDriftThisCycle",
    "reportedMaximumRelativeTotalBloodVolumeDriftThisCycle",
    "effectiveMaximumRelativeTotalBloodVolumeDriftThisCycle",
    "cumulativeRelativeTotalBloodVolumeDrift",
    "perSupercyclePass",
    "cumulativePass",
  ], "checkpoint.totalBloodVolume");
  const runInitial = requirePositiveFinite(
    summary.runInitialTotalBloodVolumeM3,
    "TBV.runInitialTotalBloodVolumeM3",
  );
  const cycleInitial = requirePositiveFinite(
    summary.cycleInitialTotalBloodVolumeM3,
    "TBV.cycleInitialTotalBloodVolumeM3",
  );
  const cycleFinal = requirePositiveFinite(
    summary.cycleFinalTotalBloodVolumeM3,
    "TBV.cycleFinalTotalBloodVolumeM3",
  );
  const reported = requireNonNegativeFinite(
    summary.reportedMaximumRelativeTotalBloodVolumeDriftThisCycle,
    "TBV.reportedMaximumRelativeTotalBloodVolumeDriftThisCycle",
  );
  const endpoint = Math.abs(cycleFinal - cycleInitial) / cycleInitial;
  const effective = Math.max(endpoint, reported);
  const cumulative = Math.abs(cycleFinal - runInitial) / runInitial;
  assertRoundoffEqual(
    summary.endpointRelativeTotalBloodVolumeDriftThisCycle,
    endpoint,
    "TBV endpoint relative drift",
  );
  assertRoundoffEqual(
    summary.effectiveMaximumRelativeTotalBloodVolumeDriftThisCycle,
    effective,
    "TBV effective relative drift",
  );
  assertRoundoffEqual(
    summary.cumulativeRelativeTotalBloodVolumeDrift,
    cumulative,
    "TBV cumulative relative drift",
  );
  if (
    summary.perSupercyclePass
      !== (effective < definition.totalBloodVolumeRelativeTolerancePerSupercycle)
    || summary.cumulativePass
      !== (cumulative < definition.cumulativeTotalBloodVolumeRelativeTolerance)
  ) throw new Error("checkpoint TBV gates disagree with their diagnostics");
}

function assertLiveRunningState(
  state: PhaseB1NormalSinusBePeriodicStateV1,
): PhaseB1NormalSinusBePeriodicStateV1 {
  if (
    state === null
    || typeof state !== "object"
    || !LIVE_STATES.has(state)
    || state.stateId !== PHASE_B1_NORMAL_SINUS_BE_PERIODIC_STATE_V1_ID
  ) throw new Error("periodic convergence state is not a live canonical state");
  if (state.terminalStatus !== "running") {
    throw new Error("periodic convergence state is already terminal");
  }
  assertCanonicalFourChamberNewtonScaleRegistryV1(state.registry);
  return state;
}

function assertEndpointExactlyEqual(
  actual: PhaseB1EndpointStateV1,
  expected: PhaseB1EndpointStateV1,
  registry: FourChamberNewtonScaleRegistryV1,
  sha256Hex: CanonicalSha256HexProvider,
): void {
  if (!Object.is(actual.timeSec, expected.timeSec)) {
    throw new Error("periodic cycle initial endpoint time broke the state chain");
  }
  const metric = evaluatePhaseB1CompleteEndpointMetricV1({
    referenceEndpoint: expected,
    candidateEndpoint: actual,
    registry,
    sha256Hex,
  });
  if (
    metric.maximumNormalizedDistance !== 0
    || metric.components.some((component) =>
      !Object.is(component.referenceValue, component.candidateValue))
  ) throw new Error("periodic cycle initial endpoint broke the exact state chain");
}

function canonicalEndpoint(endpoint: PhaseB1EndpointStateV1): PhaseB1EndpointStateV1 {
  return createPhaseB1EndpointStateV1({
    timeSec: endpoint.timeSec,
    differentialState: endpoint.differentialState,
    triSegCoordinates: endpoint.triSegCoordinates,
  });
}

function totalBloodVolume(endpoint: PhaseB1EndpointStateV1): number {
  const total = BLOOD_COMPARTMENT_IDS.reduce((sum, compartmentId) =>
    sum + endpoint.differentialState.bloodVolumesM3[compartmentId], 0);
  return requirePositiveFinite(total, "totalBloodVolumeM3");
}

function requireSupportedNominalDt(value: unknown): number {
  const result = requirePositiveFinite(value, "nominalDtSec");
  if (!PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SUPPORTED_DT_SEC_V1.includes(
    result as 0.001,
  )) throw new Error("periodic nominalDtSec is not predeclared");
  return result;
}

function requireSha256Provider(value: unknown): asserts value is
  CanonicalSha256HexProvider {
  if (typeof value !== "function") {
    throw new Error("periodic convergence requires a SHA-256 provider");
  }
}

function requireSha256(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${field} must be a lowercase SHA-256 digest`);
  }
  return value;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function assertRoundoffEqual(
  actualValue: unknown,
  expectedValue: number,
  field: string,
): void {
  const actual = requireFinite(actualValue, field);
  const expected = requireFinite(expectedValue, `${field}.expected`);
  const tolerance = 256 * Number.EPSILON * Math.max(
    Number.MIN_VALUE,
    Math.abs(actual),
    Math.abs(expected),
  );
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${field} disagrees with its source values`);
  }
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requireNonNegativeFinite(value: unknown, field: string): number {
  const result = requireFinite(value, field);
  if (result < 0) throw new Error(`${field} must be non-negative`);
  return result;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const result = requireFinite(value, field);
  if (!(result > 0)) throw new Error(`${field} must be positive`);
  return result;
}

function assertRecursivelyFrozen(value: unknown, field: string): void {
  const visited = new WeakSet<object>();
  const visit = (node: unknown, path: string): void => {
    if (node === null || typeof node !== "object" || visited.has(node)) return;
    visited.add(node);
    if (!Object.isFrozen(node)) throw new Error(`${path} must be frozen`);
    for (const [key, child] of Object.entries(node)) visit(child, `${path}.${key}`);
  };
  visit(value, field);
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
