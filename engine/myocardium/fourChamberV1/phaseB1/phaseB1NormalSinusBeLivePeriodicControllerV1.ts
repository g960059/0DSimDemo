import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  runPhaseB1BackwardEulerEventScheduleRunnerV1,
  type PhaseB1BackwardEulerEventScheduleRunnerResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerEventScheduleRunnerV1";
import {
  assertBuilderIssuedPhaseB1NormalSinusCommittedSupercycleAuditV1,
  buildPhaseB1NormalSinusCommittedSupercycleAuditV1,
  buildPhaseB1NormalSinusCommittedSupercycleExpectationV1,
  type PhaseB1NormalSinusCommittedSupercycleAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusCommittedSupercycleAuditV1";
import {
  buildPhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
  initializePhaseB1NormalSinusBePeriodicStateV1,
  recordPhaseB1NormalSinusBePeriodicCheckpointV1,
  validatePhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
  type PhaseB1NormalSinusBePeriodicCheckpointV1,
  type PhaseB1NormalSinusBePeriodicCommittedCycleObservationV1,
  type PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
  type PhaseB1NormalSinusBePeriodicStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBePeriodicConvergenceV1";
import {
  PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID,
  buildPhaseB1QuiescentReferenceEventFreeCaseV1,
  type PhaseB1QuiescentReferenceEventFreeCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEventFreeCaseV1";
import {
  assertCanonicalPhaseB1QuiescentPressureReferenceInverseResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentPressureReferenceInverseV1";
import {
  generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1,
  validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  type PhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  assertCanonicalFourChamberNewtonScaleRegistryV1,
} from "@/engine/myocardium/fourChamberV1/numerics/newtonScaleRegistryV1";
import {
  assertPhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_CONTROLLER_V1_ID =
  "phase-b1-normal-sinus-be-live-periodic-controller-v1" as const;

export const PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_CYCLE_EVIDENCE_V1_ID =
  "phase-b1-normal-sinus-be-live-periodic-cycle-evidence-v1" as const;

export const PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_TERMINAL_RESULT_V1_ID =
  "phase-b1-normal-sinus-be-live-periodic-terminal-result-v1" as const;

export const PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_FAILURE_V1_ID =
  "phase-b1-normal-sinus-be-live-periodic-failure-v1" as const;

const CLAIM_BOUNDARY = deepFreeze({
  liveCanonicalScheduleSolverRequiredForCycleEvidence: true,
  liveCommittedIntervalLedgerRequiredForCycleEvidence: true,
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

export const PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_CLAIM_POLICY_V1 =
  CLAIM_BOUNDARY;

const LIVE_CONTROLLERS = new WeakSet<object>();
const BUILDER_ISSUED_CYCLE_EVIDENCE = new WeakSet<object>();
const BUILDER_ISSUED_TERMINAL_RESULTS = new WeakSet<object>();
const BUILDER_ISSUED_FAILURES = new WeakSet<object>();

export type PhaseB1NormalSinusBeLivePeriodicControllerV1 = Readonly<{
  controllerId: typeof PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_CONTROLLER_V1_ID;
  sourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1;
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
  definition: PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1;
  periodicState: PhaseB1NormalSinusBePeriodicStateV1;
  slsMode: "on" | "off";
  nominalDtSec: number;
  completedCycleEvidenceCount: number;
  cycleEvidenceChainHeadContentSha256: string | null;
  lastCycleEvidence: PhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1 | null;
  sourceModelObjectRetained: true;
  sourceWallMaterialBindingObjectRetained: true;
  sourceRegistryObjectRetained: true;
  status: "running";
  claimBoundary: typeof CLAIM_BOUNDARY;
}>;

export type InitializePhaseB1NormalSinusBeLivePeriodicControllerInputV1 =
  Readonly<{
    sourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1;
    schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
    nominalDtSec: number;
    sha256Hex: CanonicalSha256HexProvider;
  }>;

export type PhaseB1NormalSinusBeLivePeriodicCycleEvidencePayloadV1 =
  Readonly<{
    evidenceId:
      typeof PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_CYCLE_EVIDENCE_V1_ID;
    definitionContentSha256: string;
    scheduleContentSha256: string;
    slsMode: "on" | "off";
    nominalDtSec: number;
    cycleIndex: number;
    previousCycleEvidenceContentSha256: string | null;
    committedSupercycleAuditContentSha256: string;
    runnerAttemptTraceContentSha256: string;
    committedIntervalLedgerSummaryContentSha256: string;
    periodicCheckpointContentSha256: string;
    initialEndpointContentSha256: string;
    finalEndpointContentSha256: string;
    consecutivePassingSupercycles: number;
    terminalStatus:
      | "running"
      | "converged"
      | "maximum-supercycles-exhausted";
    cycleLocalPass: boolean;
    streakWindowPass: boolean;
    periodicConvergenceCriterionPass: boolean;
    liveRunnerAndLedgerProvenanceBound: true;
    callerSuppliedObservationAccepted: false;
    claimBoundary: typeof CLAIM_BOUNDARY;
  }>;

export type PhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1 =
  PhaseB1NormalSinusBeLivePeriodicCycleEvidencePayloadV1 & Readonly<{
    contentSha256: string;
  }>;

export type PhaseB1NormalSinusBeLivePeriodicTerminalResultPayloadV1 =
  Readonly<{
    resultId:
      typeof PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_TERMINAL_RESULT_V1_ID;
    definitionContentSha256: string;
    scheduleContentSha256: string;
    slsMode: "on" | "off";
    nominalDtSec: number;
    completedSupercycleCount: number;
    cycleEvidenceChainHeadContentSha256: string;
    finalPeriodicCheckpointContentSha256: string;
    terminalStatus: "converged" | "maximum-supercycles-exhausted";
    liveSingleStartPeriodOneCriterionPass: boolean;
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

export type PhaseB1NormalSinusBeLivePeriodicTerminalResultV1 =
  PhaseB1NormalSinusBeLivePeriodicTerminalResultPayloadV1 & Readonly<{
    contentSha256: string;
    finalPeriodicState: PhaseB1NormalSinusBePeriodicStateV1;
    lastCycleEvidence: PhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1;
  }>;

export type PhaseB1NormalSinusBeLivePeriodicFailurePayloadV1 = Readonly<{
  failureId: typeof PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_FAILURE_V1_ID;
  definitionContentSha256: string;
  scheduleContentSha256: string;
  slsMode: "on" | "off";
  nominalDtSec: number;
  cycleIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  previousCycleEvidenceContentSha256: string | null;
  failureStage:
    | "event-schedule-runner"
    | "committed-supercycle-audit-or-periodic-checkpoint";
  failureReason: string;
  runnerCompleted: boolean;
  liveSingleStartPeriodOneCriterionPass: false;
  fullBeatAcceptancePass: false;
  normalSinusMultiStartAcceptancePass: false;
  timestepConvergenceAcceptancePass: false;
  cycleEnergyAcceptancePass: false;
  physiologicalValidationPass: false;
  phaseB1AcceptancePass: false;
  releaseRuntimeReachable: false;
  testOnly: true;
  claimBoundary: typeof CLAIM_BOUNDARY;
}>;

export type PhaseB1NormalSinusBeLivePeriodicFailureV1 =
  PhaseB1NormalSinusBeLivePeriodicFailurePayloadV1 & Readonly<{
    contentSha256: string;
    scheduleRun: PhaseB1BackwardEulerEventScheduleRunnerResultV1;
  }>;

export type AdvancePhaseB1NormalSinusBeLivePeriodicControllerInputV1 =
  Readonly<{
    controller: PhaseB1NormalSinusBeLivePeriodicControllerV1;
    sha256Hex: CanonicalSha256HexProvider;
  }>;

export type AdvancePhaseB1NormalSinusBeLivePeriodicControllerSuccessV1 =
  Readonly<{
    completedCycle: true;
    committedSupercycleAudit:
      PhaseB1NormalSinusCommittedSupercycleAuditV1;
    periodicCheckpoint: PhaseB1NormalSinusBePeriodicCheckpointV1;
    cycleEvidence: PhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1;
    controller: PhaseB1NormalSinusBeLivePeriodicControllerV1 | null;
    terminalResult:
      PhaseB1NormalSinusBeLivePeriodicTerminalResultV1 | null;
  }>;

export type AdvancePhaseB1NormalSinusBeLivePeriodicControllerFailureV1 =
  Readonly<{
    completedCycle: false;
    failure: PhaseB1NormalSinusBeLivePeriodicFailureV1;
    controller: null;
    terminalResult: null;
  }>;

export type AdvancePhaseB1NormalSinusBeLivePeriodicControllerResultV1 =
  | AdvancePhaseB1NormalSinusBeLivePeriodicControllerSuccessV1
  | AdvancePhaseB1NormalSinusBeLivePeriodicControllerFailureV1;

export type RunPhaseB1NormalSinusBeLivePeriodicToTerminalResultV1 =
  | PhaseB1NormalSinusBeLivePeriodicTerminalResultV1
  | PhaseB1NormalSinusBeLivePeriodicFailureV1;

export function initializePhaseB1NormalSinusBeLivePeriodicControllerV1(
  input: InitializePhaseB1NormalSinusBeLivePeriodicControllerInputV1,
): PhaseB1NormalSinusBeLivePeriodicControllerV1 {
  assertExactPlainRecordV1(input, [
    "sourceCase",
    "schedule",
    "nominalDtSec",
    "sha256Hex",
  ], "Phase B1 live periodic controller initialization input");
  requireSha256Provider(input.sha256Hex);
  const sourceCase = validateSourceCase(input.sourceCase, input.sha256Hex);
  const schedule = validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    input.schedule,
    input.sha256Hex,
  );
  if (
    schedule.sourceBindings.phaseB1WallMaterialBindingSha256
      !== sourceCase.wallMaterialBinding.contentSha256
  ) {
    throw new Error("live periodic controller schedule and source binding differ");
  }
  const definition = buildPhaseB1NormalSinusBePeriodicConvergenceDefinitionV1({
    schedule,
    sourceEndpoint: sourceCase.referenceEndpoint,
    registry: sourceCase.destinationRegistry,
    nominalDtSec: input.nominalDtSec,
    sha256Hex: input.sha256Hex,
  });
  const periodicState = initializePhaseB1NormalSinusBePeriodicStateV1({
    definition,
    schedule,
    registry: sourceCase.destinationRegistry,
    initialEndpoint: sourceCase.referenceEndpoint,
    sha256Hex: input.sha256Hex,
  });
  return issueLiveController({
    sourceCase,
    schedule,
    definition,
    periodicState,
    completedCycleEvidenceCount: 0,
    cycleEvidenceChainHeadContentSha256: null,
    lastCycleEvidence: null,
  });
}

export function assertLivePhaseB1NormalSinusBeLivePeriodicControllerV1(
  value: PhaseB1NormalSinusBeLivePeriodicControllerV1,
): PhaseB1NormalSinusBeLivePeriodicControllerV1 {
  if (
    value === null
    || typeof value !== "object"
    || !LIVE_CONTROLLERS.has(value)
    || value.controllerId
      !== PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_CONTROLLER_V1_ID
    || value.status !== "running"
    || value.periodicState.terminalStatus !== "running"
    || !Object.is(value.periodicState.definition, value.definition)
    || !Object.is(value.periodicState.schedule, value.schedule)
    || !Object.is(
      value.periodicState.registry,
      value.sourceCase.destinationRegistry,
    )
    || value.completedCycleEvidenceCount
      !== value.periodicState.completedSupercycleCount
    || value.cycleEvidenceChainHeadContentSha256
      !== (value.lastCycleEvidence?.contentSha256 ?? null)
  ) {
    throw new Error("live periodic controller is forged, consumed, or terminal");
  }
  return value;
}

export function advancePhaseB1NormalSinusBeLivePeriodicControllerV1(
  input: AdvancePhaseB1NormalSinusBeLivePeriodicControllerInputV1,
): AdvancePhaseB1NormalSinusBeLivePeriodicControllerResultV1 {
  assertExactPlainRecordV1(input, [
    "controller",
    "sha256Hex",
  ], "Phase B1 live periodic controller advance input");
  requireSha256Provider(input.sha256Hex);
  const controller = assertLivePhaseB1NormalSinusBeLivePeriodicControllerV1(
    input.controller,
  );
  validatePhaseB1NormalSinusBePeriodicConvergenceDefinitionV1(
    controller.definition,
    input.sha256Hex,
  );
  const cycleIndex = controller.periodicState.completedSupercycleCount;
  const expectation =
    buildPhaseB1NormalSinusCommittedSupercycleExpectationV1({
      definition: controller.definition,
      schedule: controller.schedule,
      cycleIndex,
      sha256Hex: input.sha256Hex,
    });
  if (
    controller.completedCycleEvidenceCount !== cycleIndex
    || !Object.is(
      controller.periodicState.lastEndpoint.timeSec,
      expectation.startTimeSec,
    )
  ) {
    throw new Error("live periodic controller cycle chain drifted before solve");
  }

  // Consume before entering the numerical runner. A controller can authorize
  // at most one cycle attempt, including a failed attempt.
  LIVE_CONTROLLERS.delete(controller);
  const scheduledEvents =
    generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1(
      controller.schedule,
      expectation.startTimeSec,
      expectation.endTimeSec,
      input.sha256Hex,
    );
  const scheduleRun = runPhaseB1BackwardEulerEventScheduleRunnerV1({
    model: controller.sourceCase.model,
    wallMaterialBinding: controller.sourceCase.wallMaterialBinding,
    previousEndpoint: controller.periodicState.lastEndpoint,
    endTimeSec: expectation.endTimeSec,
    nominalDtSec: controller.nominalDtSec,
    orderedEvents: Object.freeze(scheduledEvents.map((event) =>
      event.calciumDriveEvent)),
  });
  if (scheduleRun.completed === false) {
    return Object.freeze({
      completedCycle: false as const,
      failure: issueFailure(
        controller,
        expectation.startTimeSec,
        expectation.endTimeSec,
        cycleIndex,
        "event-schedule-runner",
        scheduleRun.failureReason,
        scheduleRun,
        input.sha256Hex,
      ),
      controller: null,
      terminalResult: null,
    });
  }

  try {
    if (
      !Object.is(scheduleRun.modelObjectAtRunStart, controller.sourceCase.model)
      || !Object.is(
        scheduleRun.wallMaterialBindingObjectAtRunStart,
        controller.sourceCase.wallMaterialBinding,
      )
      || !Object.is(
        scheduleRun.newtonScaleRegistryObjectAtRunStart,
        controller.sourceCase.destinationRegistry,
      )
    ) {
      throw new Error("live runner changed source model, binding, or registry object");
    }
    const audit = buildPhaseB1NormalSinusCommittedSupercycleAuditV1({
      definition: controller.definition,
      schedule: controller.schedule,
      cycleIndex,
      scheduleRun,
      sha256Hex: input.sha256Hex,
    });
    assertBuilderIssuedPhaseB1NormalSinusCommittedSupercycleAuditV1(
      audit,
      input.sha256Hex,
    );
    const observation = observationFromBuilderIssuedAudit(audit);
    const recorded = recordPhaseB1NormalSinusBePeriodicCheckpointV1({
      state: controller.periodicState,
      observation,
      sha256Hex: input.sha256Hex,
    });
    const cycleEvidence = issueCycleEvidence(
      controller,
      audit,
      recorded.checkpoint,
      input.sha256Hex,
    );
    if (recorded.state.terminalStatus === "running") {
      const nextController = issueLiveController({
        sourceCase: controller.sourceCase,
        schedule: controller.schedule,
        definition: controller.definition,
        periodicState: recorded.state,
        completedCycleEvidenceCount:
          controller.completedCycleEvidenceCount + 1,
        cycleEvidenceChainHeadContentSha256: cycleEvidence.contentSha256,
        lastCycleEvidence: cycleEvidence,
      });
      return Object.freeze({
        completedCycle: true as const,
        committedSupercycleAudit: audit,
        periodicCheckpoint: recorded.checkpoint,
        cycleEvidence,
        controller: nextController,
        terminalResult: null,
      });
    }
    const terminalResult = issueTerminalResult(
      controller,
      recorded.state,
      cycleEvidence,
      input.sha256Hex,
    );
    return Object.freeze({
      completedCycle: true as const,
      committedSupercycleAudit: audit,
      periodicCheckpoint: recorded.checkpoint,
      cycleEvidence,
      controller: null,
      terminalResult,
    });
  } catch (error) {
    return Object.freeze({
      completedCycle: false as const,
      failure: issueFailure(
        controller,
        expectation.startTimeSec,
        expectation.endTimeSec,
        cycleIndex,
        "committed-supercycle-audit-or-periodic-checkpoint",
        errorMessage(error),
        scheduleRun,
        input.sha256Hex,
      ),
      controller: null,
      terminalResult: null,
    });
  }
}

export function runPhaseB1NormalSinusBeLivePeriodicToTerminalV1(
  input: InitializePhaseB1NormalSinusBeLivePeriodicControllerInputV1,
): RunPhaseB1NormalSinusBeLivePeriodicToTerminalResultV1 {
  let controller = initializePhaseB1NormalSinusBeLivePeriodicControllerV1(
    input,
  );
  while (true) {
    const result = advancePhaseB1NormalSinusBeLivePeriodicControllerV1({
      controller,
      sha256Hex: input.sha256Hex,
    });
    if (result.completedCycle === false) return result.failure;
    if (result.terminalResult !== null) return result.terminalResult;
    if (result.controller === null) {
      throw new Error("live periodic controller lost a nonterminal successor");
    }
    controller = result.controller;
  }
}

export function assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1(
  value: PhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1 {
  requireSha256Provider(sha256Hex);
  if (
    value === null
    || typeof value !== "object"
    || !BUILDER_ISSUED_CYCLE_EVIDENCE.has(value)
    || value.evidenceId
      !== PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_CYCLE_EVIDENCE_V1_ID
  ) throw new Error("live periodic cycle evidence is not builder-issued");
  const { contentSha256, ...payload } = value;
  if (computeCanonicalSha256(payload, sha256Hex) !== contentSha256) {
    throw new Error("live periodic cycle evidence content hash drifted");
  }
  return value;
}

export function assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicTerminalResultV1(
  value: PhaseB1NormalSinusBeLivePeriodicTerminalResultV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1NormalSinusBeLivePeriodicTerminalResultV1 {
  requireSha256Provider(sha256Hex);
  if (
    value === null
    || typeof value !== "object"
    || !BUILDER_ISSUED_TERMINAL_RESULTS.has(value)
    || value.resultId
      !== PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_TERMINAL_RESULT_V1_ID
  ) throw new Error("live periodic terminal result is not builder-issued");
  assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1(
    value.lastCycleEvidence,
    sha256Hex,
  );
  const {
    contentSha256,
    finalPeriodicState: _finalPeriodicState,
    lastCycleEvidence: _lastCycleEvidence,
    ...payload
  } = value;
  if (computeCanonicalSha256(payload, sha256Hex) !== contentSha256) {
    throw new Error("live periodic terminal result content hash drifted");
  }
  return value;
}

export function assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicFailureV1(
  value: PhaseB1NormalSinusBeLivePeriodicFailureV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1NormalSinusBeLivePeriodicFailureV1 {
  requireSha256Provider(sha256Hex);
  if (
    value === null
    || typeof value !== "object"
    || !BUILDER_ISSUED_FAILURES.has(value)
    || value.failureId
      !== PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_FAILURE_V1_ID
  ) throw new Error("live periodic failure is not builder-issued");
  const { contentSha256, scheduleRun: _scheduleRun, ...payload } = value;
  if (computeCanonicalSha256(payload, sha256Hex) !== contentSha256) {
    throw new Error("live periodic failure content hash drifted");
  }
  return value;
}

function observationFromBuilderIssuedAudit(
  audit: PhaseB1NormalSinusCommittedSupercycleAuditV1,
): PhaseB1NormalSinusBePeriodicCommittedCycleObservationV1 {
  const ledger = audit.committedIntervalLedger;
  const integratedFlowVolumeByFlow = Object.freeze(Object.fromEntries(
    FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1.map((flowId) => {
      const value = ledger.integratedEdgeVolumeByFlow[flowId];
      return [flowId, Object.freeze({
        signedVolumeM3: value.signedVolumeM3,
        forwardVolumeM3: value.forwardVolumeM3,
        regurgitantVolumeM3: value.regurgitantVolumeM3,
      })];
    }),
  )) as PhaseB1NormalSinusBePeriodicCommittedCycleObservationV1[
    "integratedFlowVolumeByFlow"
  ];
  return Object.freeze({
    cycleIndex: audit.cycleIndex,
    initialEndpoint: ledger.initialEndpoint,
    finalEndpoint: ledger.finalEndpoint,
    integratedFlowVolumeByFlow,
    maximumRelativeTotalBloodVolumeDrift:
      ledger.maximumRelativeTotalBloodVolumeDrift,
    exactOneScheduleSupercycleVerified:
      audit.committedSupercycleAuditPass,
    committedIntervalProvenanceVerified:
      audit.committedLedgerProvenanceVerified,
    structuralAndNumericalIntervalLedgerGatesPass:
      ledger.structuralAndNumericalIntervalLedgerGatesPass,
    projectionClippingClampAndFallbackFree:
      audit.projectionClippingClampAndFallbackFree,
  });
}

function issueCycleEvidence(
  controller: PhaseB1NormalSinusBeLivePeriodicControllerV1,
  audit: PhaseB1NormalSinusCommittedSupercycleAuditV1,
  checkpoint: PhaseB1NormalSinusBePeriodicCheckpointV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1 {
  const payload = deepFreeze<PhaseB1NormalSinusBeLivePeriodicCycleEvidencePayloadV1>({
    evidenceId:
      PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_CYCLE_EVIDENCE_V1_ID,
    definitionContentSha256: controller.definition.contentSha256,
    scheduleContentSha256: controller.schedule.contentSha256,
    slsMode: controller.slsMode,
    nominalDtSec: controller.nominalDtSec,
    cycleIndex: audit.cycleIndex,
    previousCycleEvidenceContentSha256:
      controller.cycleEvidenceChainHeadContentSha256,
    committedSupercycleAuditContentSha256: audit.contentSha256,
    runnerAttemptTraceContentSha256:
      audit.runnerAttemptTraceContentSha256,
    committedIntervalLedgerSummaryContentSha256:
      audit.committedIntervalLedgerSummaryContentSha256,
    periodicCheckpointContentSha256: checkpoint.contentSha256,
    initialEndpointContentSha256: audit.initialEndpointContentSha256,
    finalEndpointContentSha256: audit.finalEndpointContentSha256,
    consecutivePassingSupercycles: checkpoint.consecutivePassingSupercycles,
    terminalStatus: checkpoint.terminalStatus,
    cycleLocalPass: checkpoint.gates.cycleLocalPass,
    streakWindowPass: checkpoint.gates.streakWindowPass,
    periodicConvergenceCriterionPass:
      checkpoint.periodicConvergenceCriterionPass,
    liveRunnerAndLedgerProvenanceBound: true,
    callerSuppliedObservationAccepted: false,
    claimBoundary: CLAIM_BOUNDARY,
  });
  const evidence = deepFreeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  BUILDER_ISSUED_CYCLE_EVIDENCE.add(evidence);
  return evidence;
}

function issueTerminalResult(
  controller: PhaseB1NormalSinusBeLivePeriodicControllerV1,
  finalPeriodicState: PhaseB1NormalSinusBePeriodicStateV1,
  lastCycleEvidence: PhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1NormalSinusBeLivePeriodicTerminalResultV1 {
  if (finalPeriodicState.terminalStatus === "running") {
    throw new Error("cannot issue a terminal result from a running state");
  }
  const liveSingleStartPeriodOneCriterionPass =
    finalPeriodicState.terminalStatus === "converged"
    && finalPeriodicState.singleStartPeriodOneCriterionPass;
  const payload = deepFreeze<PhaseB1NormalSinusBeLivePeriodicTerminalResultPayloadV1>({
    resultId:
      PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_TERMINAL_RESULT_V1_ID,
    definitionContentSha256: controller.definition.contentSha256,
    scheduleContentSha256: controller.schedule.contentSha256,
    slsMode: controller.slsMode,
    nominalDtSec: controller.nominalDtSec,
    completedSupercycleCount: finalPeriodicState.completedSupercycleCount,
    cycleEvidenceChainHeadContentSha256: lastCycleEvidence.contentSha256,
    finalPeriodicCheckpointContentSha256:
      finalPeriodicState.lastCheckpoint!.contentSha256,
    terminalStatus: finalPeriodicState.terminalStatus,
    liveSingleStartPeriodOneCriterionPass,
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
  const result = Object.freeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
    finalPeriodicState,
    lastCycleEvidence,
  });
  BUILDER_ISSUED_TERMINAL_RESULTS.add(result);
  return result;
}

function issueFailure(
  controller: PhaseB1NormalSinusBeLivePeriodicControllerV1,
  startTimeSec: number,
  endTimeSec: number,
  cycleIndex: number,
  failureStage: PhaseB1NormalSinusBeLivePeriodicFailurePayloadV1["failureStage"],
  failureReason: string,
  scheduleRun: PhaseB1BackwardEulerEventScheduleRunnerResultV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1NormalSinusBeLivePeriodicFailureV1 {
  const payload = deepFreeze<PhaseB1NormalSinusBeLivePeriodicFailurePayloadV1>({
    failureId: PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_FAILURE_V1_ID,
    definitionContentSha256: controller.definition.contentSha256,
    scheduleContentSha256: controller.schedule.contentSha256,
    slsMode: controller.slsMode,
    nominalDtSec: controller.nominalDtSec,
    cycleIndex,
    startTimeSec,
    endTimeSec,
    previousCycleEvidenceContentSha256:
      controller.cycleEvidenceChainHeadContentSha256,
    failureStage,
    failureReason,
    runnerCompleted: scheduleRun.completed,
    liveSingleStartPeriodOneCriterionPass: false,
    fullBeatAcceptancePass: false,
    normalSinusMultiStartAcceptancePass: false,
    timestepConvergenceAcceptancePass: false,
    cycleEnergyAcceptancePass: false,
    physiologicalValidationPass: false,
    phaseB1AcceptancePass: false,
    releaseRuntimeReachable: false,
    testOnly: true,
    claimBoundary: CLAIM_BOUNDARY,
  });
  const failure = Object.freeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
    scheduleRun,
  });
  BUILDER_ISSUED_FAILURES.add(failure);
  return failure;
}

function issueLiveController(input: Readonly<{
  sourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1;
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
  definition: PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1;
  periodicState: PhaseB1NormalSinusBePeriodicStateV1;
  completedCycleEvidenceCount: number;
  cycleEvidenceChainHeadContentSha256: string | null;
  lastCycleEvidence: PhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1 | null;
}>): PhaseB1NormalSinusBeLivePeriodicControllerV1 {
  if (
    input.periodicState.terminalStatus !== "running"
    || !Object.is(input.periodicState.definition, input.definition)
    || !Object.is(input.periodicState.schedule, input.schedule)
    || !Object.is(
      input.periodicState.registry,
      input.sourceCase.destinationRegistry,
    )
    || !Object.is(
      input.sourceCase.model.newtonScaleRegistry,
      input.sourceCase.destinationRegistry,
    )
    || input.completedCycleEvidenceCount
      !== input.periodicState.completedSupercycleCount
    || input.cycleEvidenceChainHeadContentSha256
      !== (input.lastCycleEvidence?.contentSha256 ?? null)
  ) {
    throw new Error("live periodic controller issuance chain is inconsistent");
  }
  const controller = Object.freeze({
    controllerId: PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_CONTROLLER_V1_ID,
    sourceCase: input.sourceCase,
    schedule: input.schedule,
    definition: input.definition,
    periodicState: input.periodicState,
    slsMode: input.sourceCase.slsMode,
    nominalDtSec: input.definition.nominalDtSec,
    completedCycleEvidenceCount: input.completedCycleEvidenceCount,
    cycleEvidenceChainHeadContentSha256:
      input.cycleEvidenceChainHeadContentSha256,
    lastCycleEvidence: input.lastCycleEvidence,
    sourceModelObjectRetained: true as const,
    sourceWallMaterialBindingObjectRetained: true as const,
    sourceRegistryObjectRetained: true as const,
    status: "running" as const,
    claimBoundary: CLAIM_BOUNDARY,
  });
  LIVE_CONTROLLERS.add(controller);
  return controller;
}

function validateSourceCase(
  sourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1QuiescentReferenceEventFreeCaseV1 {
  assertExactPlainRecordV1(sourceCase, [
    "caseId",
    "slsMode",
    "inverse",
    "acceptedInverseEndpoint",
    "referenceEndpoint",
    "model",
    "wallMaterialBinding",
    "destinationEvaluation",
    "destinationRegistry",
    "registryAudit",
    "staticAudit",
    "projectSyntheticQuiescentReferenceEventFreeCasePass",
    "closedLoopStationarityPass",
    "physiologicalReferenceAcceptancePass",
    "supportedReferenceEnvelopePass",
    "fullBeatAcceptancePass",
    "physiologicalValidationPass",
    "phaseB1AcceptancePass",
    "modelCoreIntegration",
    "browserRuntimeAdopted",
    "releaseRuntimeReachable",
    "testOnly",
  ], "Phase B1 live periodic source case");
  assertCanonicalPhaseB1QuiescentPressureReferenceInverseResultV1(
    sourceCase.inverse,
  );
  assertPhaseB1WallMaterialBindingV1(sourceCase.wallMaterialBinding);
  assertCanonicalFourChamberNewtonScaleRegistryV1(
    sourceCase.destinationRegistry,
  );
  if (
    sourceCase.caseId !== PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID
    || sourceCase.slsMode !== sourceCase.inverse.slsMode
    || sourceCase.referenceEndpoint.differentialState.slsMode
      !== sourceCase.slsMode
    || !Object.is(sourceCase.referenceEndpoint.timeSec, 0)
    || sourceCase.projectSyntheticQuiescentReferenceEventFreeCasePass !== true
    || sourceCase.registryAudit.pass !== true
    || sourceCase.staticAudit.pass !== true
    || !Object.is(
      sourceCase.destinationRegistry,
      sourceCase.model.newtonScaleRegistry,
    )
    || sourceCase.destinationRegistry.fixedBeforeRun !== true
    || sourceCase.destinationRegistry.adaptiveRescaling !== false
    || sourceCase.closedLoopStationarityPass !== false
    || sourceCase.physiologicalReferenceAcceptancePass !== false
    || sourceCase.supportedReferenceEnvelopePass !== false
    || sourceCase.fullBeatAcceptancePass !== false
    || sourceCase.physiologicalValidationPass !== false
    || sourceCase.phaseB1AcceptancePass !== false
    || sourceCase.modelCoreIntegration !== false
    || sourceCase.browserRuntimeAdopted !== false
    || sourceCase.releaseRuntimeReachable !== false
    || sourceCase.testOnly !== true
  ) throw new Error("live periodic controller requires its quiescent test parent");

  // The event-free case wrapper itself is not a private-token object. Rebuild
  // it deterministically from the authenticated inverse and use only that
  // reconstruction, so a caller cannot retain a valid inverse while swapping
  // in an arbitrary endpoint, model, binding, or registry around it.
  const canonical = buildPhaseB1QuiescentReferenceEventFreeCaseV1(
    sourceCase.inverse,
    sha256Hex,
  );
  if (
    canonical.slsMode !== sourceCase.slsMode
    || canonical.wallMaterialBinding.contentSha256
      !== sourceCase.wallMaterialBinding.contentSha256
    || canonical.destinationRegistry.registryContentSha256
      !== sourceCase.destinationRegistry.registryContentSha256
  ) {
    throw new Error("live periodic source wrapper differs from its reconstruction");
  }
  return canonical;
}

function requireSha256Provider(
  value: unknown,
): asserts value is CanonicalSha256HexProvider {
  if (typeof value !== "function") {
    throw new Error("live periodic controller requires a SHA-256 provider");
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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
