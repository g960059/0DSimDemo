import {
  WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1,
} from "@/engine/myocardium/fourChamberV1/energy/wholeHeartEnergyNormalizationV1";
import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  evaluatePhaseB1EventFreeEndpointV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1,
  type PhaseB1NormalSinusBeTerminalCycleCapsuleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalCycleCapsuleV1";
import {
  evaluatePhaseB1WholeHeartMechanicalStoredEnergyBreakdownFromEndpointEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyAuditV1";
import {
  assertPhaseB1WholeHeartMechanicalEnergyStageSnapshotSourceBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyStageSnapshotV1";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_AUDIT_V1_ID =
  "phase-b1-normal-sinus-be-committed-cycle-mechanical-energy-audit-v1" as const;

export const PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_STAGE_TRACE_V1_ID =
  "phase-b1-normal-sinus-be-committed-cycle-mechanical-energy-stage-trace-v1" as const;

export const PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1 =
  deepFreeze({
    policyId:
      "phase-b1-normal-sinus-be-committed-cycle-mechanical-energy-policy-v1",
    scheme: "backward-Euler-endpoint-stage",
    stageNormalizedResidualTolerance: 1e-5,
    quarterMillisecondCycleNormalizedResidualTolerance: 1e-3,
    quarterMillisecondNominalDtSec: 0.00025,
    landAdapterWorkRelativeTolerance: 1e-12,
    eventStoredEnergyJumpRoundoffFactor: 512,
    partitionClosureRoundoffFactor: 1024,
    durationClosureRoundoffFactor: 256,
    summationPolicy:
      "Neumaier-binary64-in-canonical-accepted-transaction-order-v1",
    actualCommittedDurationIsOnlyQuadratureWeight: true,
    nominalCycleLengthUsedAsQuadratureWeight: false,
    endpointSpanUsedAsQuadratureWeight: false,
    cycleResidualUsesDirectEndpointEnergyDelta: true,
    l1CancellationMetricsAreDiagnosticOnly: true,
    publishedTaylorGeometryDefectIsRetainedAndSubtracted: true,
    publishedTaylorGeometryWorkConjugacyAccepted: false,
  } as const);

const CLAIM_BOUNDARY = deepFreeze({
  builderIssuedTerminalCycleCapsuleRequired: true,
  authenticatedCommittedTransactionsOnly: true,
  backwardEulerOnly: true,
  quarterMillisecondSingleCycleGateMayPass: true,
  oneMillisecondOrHalfMillisecondOverallEnergyAcceptanceAllowed: false,
  wholeHeartBackwardEulerEnergyAcceptanceClaimed: false,
  timestepConvergenceClaimed: false,
  sdirk2EnergyAcceptanceClaimed: false,
  publishedTaylorGeometryWorkConjugacyClaimed: false,
  virtualWorkTriSegClaimed: false,
  atpChemicalEnergyOrEfficiencyClaimed: false,
  fullBeatAcceptanceClaimed: false,
  multiStartAcceptanceClaimed: false,
  physiologicalValidationClaimed: false,
  phaseB1AcceptanceClaimed: false,
  modelCoreOrBrowserRuntimeAdopted: false,
  releaseRuntimeReachable: false,
  testOnly: true,
} as const);

const BUILDER_ISSUED_AUDITS = new WeakSet<object>();

export type PhaseB1BackwardEulerMechanicalEnergyAggregationStageV1 =
  Readonly<{
    transactionIndex: number;
    startTimeSec: number;
    endTimeSec: number;
    actualCommittedDurationSec: number;
    eventAtEnd: boolean;
    previousStoredEnergyJ: number;
    nextLeftLimitStoredEnergyJ: number;
    nextPostEventStoredEnergyJ: number;
    storedEnergyRateW: number;
    flowDissipationW: number;
    slsDissipationW: number;
    activeMechanicalOutputPowerW: number;
    prescribedExternalEnvironmentPowerW: number;
    publishedTaylorGeometryPowerResidualW: number;
    publishedTaylorGeometryNormalizationDenominatorW: number;
    sourceCorrectedStageLedgerAccepted: boolean;
    sourceLandAdapterWorkClosureAccepted: boolean;
    sourceSlsBackwardEulerIdentityAccepted: boolean;
  }>;

export type PhaseB1BackwardEulerCommittedCycleMechanicalEnergyAggregationDiagnosticV1 =
  Readonly<{
    scheme: "backward-Euler-endpoint-stage";
    normalizationPowerFloorW: typeof WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1;
    nominalDtSec: number;
    nominalCycleLengthSec: number;
    startTimeSec: number;
    endTimeSec: number;
    transactionCount: number;
    quadrature: Readonly<{
      actualCommittedDurationSecByTransaction: readonly number[];
      quadratureDurationSec: number;
      naiveQuadratureDurationSecDiagnostic: number;
      endpointSpanSec: number;
      durationMinusEndpointSpanSec: number;
      durationMinusNominalCycleLengthSec: number;
      durationClosureToleranceSec: number;
      durationPartitionRoundoffPass: boolean;
      everyActualCommittedDurationWithinNominalDtRoundoff: boolean;
      nominalCycleLengthStrictEqualityRequired: false;
      summationPolicy:
        typeof PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1.summationPolicy;
    }>;
    endpointStoredEnergyJ: Readonly<{
      initial: number;
      final: number;
      directDelta: number;
      partitionedDelta: number;
      partitionedMinusDirectDelta: number;
      partitionClosureToleranceJ: number;
      partitionClosureRoundoffPass: boolean;
    }>;
    integratedTermsJ: Readonly<{
      flowDissipation: number;
      slsDissipation: number;
      activeMechanicalOutput: number;
      prescribedExternalEnvironment: number;
      publishedTaylorGeometryPowerResidual: number;
    }>;
    officialCycleBalance: Readonly<{
      signedResidualJ: number;
      normalizationDenominatorJ: number;
      normalizedResidual: number;
      normalizedResidualTolerance: 1e-3;
      directEndpointEnergyDeltaUsed: true;
      cycleResidualWithinQuarterMillisecondTarget: boolean;
    }>;
    stageAudit: Readonly<{
      maximumNormalizedResidual: number;
      maximizingTransactionIndex: number;
      normalizedResidualTolerance: 1e-5;
      everyDerivedStageResidualWithinTolerance: boolean;
      everySourceCorrectedStageLedgerAccepted: boolean;
      everySourceLandAdapterWorkClosureAccepted: boolean;
      everySourceSlsBackwardEulerIdentityAccepted: boolean;
      stageGatePass: boolean;
    }>;
    eventJumpAudit: Readonly<{
      signedStoredEnergyJumpJ: number;
      absoluteStoredEnergyJumpL1J: number;
      maximumAbsoluteStoredEnergyJumpJ: number;
      maximizingTransactionIndex: number | null;
      everyEventStoredEnergyJumpRoundoffZero: boolean;
    }>;
    cancellationDiagnostics: Readonly<{
      continuousStageResidualL1J: number;
      continuousStageNormalizationL1J: number;
      continuousStageNormalizedL1Residual: number;
      backwardEulerStepBalanceL1J: number;
      backwardEulerStepBalanceNormalizationL1J: number;
      backwardEulerStepBalanceNormalizedL1Residual: number;
      signedResidualSurvivalFraction: number;
      signedCancellationFraction: number;
      triangleInequalityRoundoffPass: boolean;
      diagnosticOnlyNotAcceptanceGate: true;
    }>;
    publishedTaylorGeometryDiagnostics: Readonly<{
      maximumStageNormalizedResidual: number;
      maximizingTransactionIndex: number;
      workNormalizedResidual: number;
      rawDefectRetained: true;
      subtractedFromWholeHeartResidual: true;
      diagnosticOnly: true;
      workConjugacyAccepted: false;
    }>;
    quarterMillisecondSingleCycleEligibility: boolean;
    quarterMillisecondSingleCycleEnergyGatePass: boolean;
    oneOrHalfMillisecondOverallEnergyAcceptancePass: false;
    wholeHeartBackwardEulerEnergyAcceptancePass: false;
    timestepConvergenceAcceptancePass: false;
    sdirk2EnergyAcceptancePass: false;
    physiologicalValidationPass: false;
    phaseB1AcceptancePass: false;
    diagnosticOnlyWithoutAuthenticatedCapsule: true;
  }>;

export type PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyStageTraceV1 =
  Readonly<{
    traceId:
      typeof PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_STAGE_TRACE_V1_ID;
    scheme: "backward-Euler-endpoint-stage";
    sourceTerminalCycleCapsuleContentSha256: string;
    stages: readonly PhaseB1BackwardEulerMechanicalEnergyAggregationStageV1[];
    contentSha256: string;
  }>;

export type PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditPayloadV1 =
  Readonly<{
    auditId:
      typeof PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_AUDIT_V1_ID;
    policyId:
      typeof PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1.policyId;
    sourceTerminalCycleCapsuleContentSha256: string;
    sourceFinalCommittedSupercycleAuditContentSha256: string;
    sourceRunnerAttemptTraceContentSha256: string;
    sourceCommittedIntervalLedgerSummaryContentSha256: string;
    sourceInitialEndpointContentSha256: string;
    sourceFinalEndpointContentSha256: string;
    stageTraceContentSha256: string;
    scheme: "backward-Euler-endpoint-stage";
    slsMode: "on" | "off";
    nominalDtSec: number;
    nominalCycleLengthSec: number;
    finalCycleIndex: number;
    terminalCycleConvergencePass: true;
    sourceCapsuleAuthenticatedInProcess: true;
    sourceAcceptedTransactionsConsumedOnly: true;
    failedOrProvisionalTransactionsConsumed: 0;
    sourceModelWallBindingAndRegistryObjectIdentityRetained: true;
    aggregation:
      PhaseB1BackwardEulerCommittedCycleMechanicalEnergyAggregationDiagnosticV1;
    terminalCommittedCycleMechanicalEnergyAuditCompleted: true;
    quarterMillisecondSingleCycleEnergyGatePass: boolean;
    cycleEnergyAcceptancePass: false;
    wholeHeartBackwardEulerEnergyAcceptancePass: false;
    timestepConvergenceAcceptancePass: false;
    sdirk2EnergyAcceptancePass: false;
    publishedTaylorGeometryWorkConjugacyAcceptancePass: false;
    virtualWorkTriSegAcceptancePass: false;
    physiologicalValidationPass: false;
    phaseB1AcceptancePass: false;
    modelCoreIntegration: false;
    browserRuntimeAdopted: false;
    releaseRuntimeReachable: false;
    testOnly: true;
    claimBoundary: typeof CLAIM_BOUNDARY;
  }>;

export type PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1 =
  PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditPayloadV1 &
  Readonly<{
    contentSha256: string;
    sourceTerminalCycleCapsule:
      PhaseB1NormalSinusBeTerminalCycleCapsuleV1;
    stageTrace:
      PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyStageTraceV1;
  }>;

export function buildPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1(
  input: Readonly<{
    terminalCycleCapsule: PhaseB1NormalSinusBeTerminalCycleCapsuleV1;
    sha256Hex: CanonicalSha256HexProvider;
  }>,
): PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1 {
  assertExactPlainRecordV1(input, [
    "terminalCycleCapsule",
    "sha256Hex",
  ], "Phase B1 committed-cycle mechanical energy audit input");
  requireSha256Provider(input.sha256Hex);
  const capsule =
    assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
      input.terminalCycleCapsule,
      input.sha256Hex,
    );
  if (
    capsule.terminalStatus !== "converged"
    || capsule.terminalCycleConvergencePass !== true
    || capsule.liveSingleStartPeriodOneCriterionPass !== true
  ) {
    throw new Error(
      "committed-cycle mechanical energy audit requires a converged terminal capsule",
    );
  }
  const run = capsule.sourceScheduleRun;
  const transactions = run.acceptedTransactions;
  assertDensePlainArrayV1(transactions, undefined, "acceptedTransactions");
  if (transactions.length === 0) {
    throw new Error("committed-cycle energy audit requires accepted transactions");
  }
  const model = capsule.sourceCase.model;
  const binding = capsule.sourceCase.wallMaterialBinding;
  const stages = Object.freeze(transactions.map((transaction, index) => {
    const dtSec = requirePositiveFinite(
      transaction.actualCommittedDurationSec,
      `acceptedTransactions[${index}].actualCommittedDurationSec`,
    );
    const snapshot =
      assertPhaseB1WholeHeartMechanicalEnergyStageSnapshotSourceBindingV1({
        snapshot: transaction.mechanicalEnergyStageSnapshot,
        model,
        wallMaterialBinding: binding,
        acceptedStep: transaction.leftLimitStep,
        dtSec,
      });
    if (
      snapshot.scheme !== "backward-Euler-endpoint-stage"
      || snapshot.slsMode !== capsule.slsMode
      || !Object.is(snapshot.dtSec, dtSec)
    ) throw new Error("committed energy stage snapshot scheme or mode drifted");
    const postEventEvaluation = evaluatePhaseB1EventFreeEndpointV1(
      model,
      binding,
      transaction.nextEndpoint,
    );
    const postEventStoredEnergy =
      evaluatePhaseB1WholeHeartMechanicalStoredEnergyBreakdownFromEndpointEvaluationV1(
        postEventEvaluation,
      );
    const derivedResidualW = snapshot.storedEnergyRateByBranchW.total
      + snapshot.dissipationByBranchW.flowTotal
      + snapshot.dissipationByBranchW.sls
      - snapshot.stage.activeMechanicalOutputPowerW
      - snapshot.prescribedExternalEnvironmentPowerW
      - snapshot.publishedTaylorGeometryPowerAudit.rawGeometryPowerResidualW;
    assertRoundoffEqual(
      derivedResidualW,
      snapshot.stage.continuousMechanicalEnergyResidualW,
      `acceptedTransactions[${index}].continuousMechanicalEnergyResidualW`,
    );
    const stage = deepFreeze<PhaseB1BackwardEulerMechanicalEnergyAggregationStageV1>({
      transactionIndex: index,
      startTimeSec: transaction.previousEndpoint.timeSec,
      endTimeSec: transaction.nextEndpoint.timeSec,
      actualCommittedDurationSec: dtSec,
      eventAtEnd: transaction.coordinator.eventCount > 0,
      previousStoredEnergyJ: snapshot.endpointStoredEnergy.previous.totalJ,
      nextLeftLimitStoredEnergyJ:
        snapshot.endpointStoredEnergy.nextLeftLimit.totalJ,
      nextPostEventStoredEnergyJ: postEventStoredEnergy.totalJ,
      storedEnergyRateW: snapshot.storedEnergyRateByBranchW.total,
      flowDissipationW: snapshot.dissipationByBranchW.flowTotal,
      slsDissipationW: snapshot.dissipationByBranchW.sls,
      activeMechanicalOutputPowerW:
        snapshot.stage.activeMechanicalOutputPowerW,
      prescribedExternalEnvironmentPowerW:
        snapshot.prescribedExternalEnvironmentPowerW,
      publishedTaylorGeometryPowerResidualW:
        snapshot.publishedTaylorGeometryPowerAudit.rawGeometryPowerResidualW,
      publishedTaylorGeometryNormalizationDenominatorW:
        snapshot.publishedTaylorGeometryPowerAudit.normalization.denominatorW,
      sourceCorrectedStageLedgerAccepted:
        snapshot.correctedStageLedgerAccepted,
      sourceLandAdapterWorkClosureAccepted:
        snapshot.landAdapterWorkClosure.accepted,
      sourceSlsBackwardEulerIdentityAccepted:
        transaction.slsBackwardEulerPreCommitAudit.normalizedIdentityAccepted,
    });
    return stage;
  }));
  const stageTracePayload = deepFreeze({
    traceId:
      PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_STAGE_TRACE_V1_ID,
    scheme: "backward-Euler-endpoint-stage" as const,
    sourceTerminalCycleCapsuleContentSha256: capsule.contentSha256,
    stages,
  });
  const stageTrace = deepFreeze({
    ...stageTracePayload,
    contentSha256: computeCanonicalSha256(
      stageTracePayload,
      input.sha256Hex,
    ),
  });
  const nominalCycleLengthSec = capsule.schedule.cycleLengthSec;
  const aggregation =
    evaluatePhaseB1BackwardEulerCommittedCycleMechanicalEnergyAggregationDiagnosticV1({
      nominalDtSec: capsule.nominalDtSec,
      nominalCycleLengthSec,
      startTimeSec: transactions[0].previousEndpoint.timeSec,
      endTimeSec: transactions[transactions.length - 1].nextEndpoint.timeSec,
      initialStoredEnergyJ: stages[0].previousStoredEnergyJ,
      finalStoredEnergyJ: stages[stages.length - 1].nextPostEventStoredEnergyJ,
      stages,
    });
  const payload = deepFreeze<
    PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditPayloadV1
  >({
    auditId:
      PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_AUDIT_V1_ID,
    policyId:
      PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1
        .policyId,
    sourceTerminalCycleCapsuleContentSha256: capsule.contentSha256,
    sourceFinalCommittedSupercycleAuditContentSha256:
      capsule.finalCommittedSupercycleAuditContentSha256,
    sourceRunnerAttemptTraceContentSha256:
      capsule.sourceScheduleRunnerAttemptTraceContentSha256,
    sourceCommittedIntervalLedgerSummaryContentSha256:
      capsule.committedIntervalLedgerSummaryContentSha256,
    sourceInitialEndpointContentSha256: capsule.initialEndpointContentSha256,
    sourceFinalEndpointContentSha256: capsule.finalEndpointContentSha256,
    stageTraceContentSha256: stageTrace.contentSha256,
    scheme: "backward-Euler-endpoint-stage",
    slsMode: capsule.slsMode,
    nominalDtSec: capsule.nominalDtSec,
    nominalCycleLengthSec,
    finalCycleIndex: capsule.finalCycleIndex,
    terminalCycleConvergencePass: true,
    sourceCapsuleAuthenticatedInProcess: true,
    sourceAcceptedTransactionsConsumedOnly: true,
    failedOrProvisionalTransactionsConsumed: 0,
    sourceModelWallBindingAndRegistryObjectIdentityRetained: true,
    aggregation,
    terminalCommittedCycleMechanicalEnergyAuditCompleted: true,
    quarterMillisecondSingleCycleEnergyGatePass:
      aggregation.quarterMillisecondSingleCycleEnergyGatePass,
    cycleEnergyAcceptancePass: false,
    wholeHeartBackwardEulerEnergyAcceptancePass: false,
    timestepConvergenceAcceptancePass: false,
    sdirk2EnergyAcceptancePass: false,
    publishedTaylorGeometryWorkConjugacyAcceptancePass: false,
    virtualWorkTriSegAcceptancePass: false,
    physiologicalValidationPass: false,
    phaseB1AcceptancePass: false,
    modelCoreIntegration: false,
    browserRuntimeAdopted: false,
    releaseRuntimeReachable: false,
    testOnly: true,
    claimBoundary: CLAIM_BOUNDARY,
  });
  const audit = Object.freeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
    sourceTerminalCycleCapsule: capsule,
    stageTrace,
  });
  BUILDER_ISSUED_AUDITS.add(audit);
  return audit;
}

export function assertBuilderIssuedPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1(
  value: PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1 {
  requireSha256Provider(sha256Hex);
  if (
    value === null
    || typeof value !== "object"
    || !BUILDER_ISSUED_AUDITS.has(value)
    || value.auditId
      !== PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_AUDIT_V1_ID
  ) throw new Error("committed-cycle mechanical energy audit is not builder-issued");
  const capsule =
    assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
      value.sourceTerminalCycleCapsule,
      sha256Hex,
    );
  const {
    contentSha256,
    sourceTerminalCycleCapsule: _capsule,
    stageTrace: _stageTrace,
    ...payload
  } = value;
  const { contentSha256: stageTraceContentSha256, ...stageTracePayload } =
    value.stageTrace;
  if (
    computeCanonicalSha256(payload, sha256Hex) !== contentSha256
    || computeCanonicalSha256(stageTracePayload, sha256Hex)
      !== stageTraceContentSha256
    || value.sourceTerminalCycleCapsuleContentSha256 !== capsule.contentSha256
    || value.stageTraceContentSha256 !== stageTraceContentSha256
    || value.stageTrace.sourceTerminalCycleCapsuleContentSha256
      !== capsule.contentSha256
  ) throw new Error("committed-cycle mechanical energy audit hash binding drifted");
  return value;
}

export function evaluatePhaseB1BackwardEulerCommittedCycleMechanicalEnergyAggregationDiagnosticV1(
  input: Readonly<{
    nominalDtSec: number;
    nominalCycleLengthSec: number;
    startTimeSec: number;
    endTimeSec: number;
    initialStoredEnergyJ: number;
    finalStoredEnergyJ: number;
    stages: readonly PhaseB1BackwardEulerMechanicalEnergyAggregationStageV1[];
  }>,
): PhaseB1BackwardEulerCommittedCycleMechanicalEnergyAggregationDiagnosticV1 {
  assertExactPlainRecordV1(input, [
    "nominalDtSec",
    "nominalCycleLengthSec",
    "startTimeSec",
    "endTimeSec",
    "initialStoredEnergyJ",
    "finalStoredEnergyJ",
    "stages",
  ], "BE committed-cycle energy aggregation diagnostic input");
  const nominalDtSec = requirePositiveFinite(input.nominalDtSec, "nominalDtSec");
  const nominalCycleLengthSec = requirePositiveFinite(
    input.nominalCycleLengthSec,
    "nominalCycleLengthSec",
  );
  const startTimeSec = requireFinite(input.startTimeSec, "startTimeSec");
  const endTimeSec = requireFinite(input.endTimeSec, "endTimeSec");
  if (!(endTimeSec > startTimeSec)) throw new Error("cycle end time must exceed start time");
  const initialStoredEnergyJ = requireFinite(
    input.initialStoredEnergyJ,
    "initialStoredEnergyJ",
  );
  const finalStoredEnergyJ = requireFinite(
    input.finalStoredEnergyJ,
    "finalStoredEnergyJ",
  );
  assertDensePlainArrayV1(input.stages, undefined, "stages");
  if (input.stages.length === 0) throw new Error("energy aggregation requires stages");
  const stages = input.stages.map((stage, index) => validateStage(stage, index));
  if (
    !Object.is(stages[0].startTimeSec, startTimeSec)
    || !Object.is(stages[stages.length - 1].endTimeSec, endTimeSec)
  ) throw new Error("energy stage trace does not bind cycle endpoints");
  stages.forEach((stage, index) => {
    if (index > 0) {
      const previous = stages[index - 1];
      if (
        !Object.is(previous.endTimeSec, stage.startTimeSec)
        || !roundoffEqual(
          previous.nextPostEventStoredEnergyJ,
          stage.previousStoredEnergyJ,
        )
      ) throw new Error("energy stage time or stored-energy chain drifted");
    }
    if (
      !roundoffEqual(
        stage.endTimeSec,
        stage.startTimeSec + stage.actualCommittedDurationSec,
      )
    ) throw new Error("energy stage actual duration differs from its endpoints");
  });
  if (
    !roundoffEqual(stages[0].previousStoredEnergyJ, initialStoredEnergyJ)
    || !roundoffEqual(
      stages[stages.length - 1].nextPostEventStoredEnergyJ,
      finalStoredEnergyJ,
    )
  ) throw new Error("energy stage stored-energy endpoints differ from cycle endpoints");

  const durations = stages.map((stage) => stage.actualCommittedDurationSec);
  const quadratureDurationSec = neumaierSum(durations);
  const naiveQuadratureDurationSecDiagnostic = durations.reduce(
    (sum, value) => sum + value,
    0,
  );
  const endpointSpanSec = endTimeSec - startTimeSec;
  const durationMinusEndpointSpanSec = quadratureDurationSec - endpointSpanSec;
  const durationMinusNominalCycleLengthSec = quadratureDurationSec
    - nominalCycleLengthSec;
  const durationClosureToleranceSec =
    PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1
      .durationClosureRoundoffFactor
    * Number.EPSILON
    * Math.max(
      1,
      Math.abs(startTimeSec),
      Math.abs(endTimeSec),
      Math.abs(quadratureDurationSec),
      sumAbsolute(durations),
    );
  const durationPartitionRoundoffPass =
    Math.abs(durationMinusEndpointSpanSec) <= durationClosureToleranceSec
    && Math.abs(durationMinusNominalCycleLengthSec)
      <= durationClosureToleranceSec;
  const everyActualCommittedDurationWithinNominalDtRoundoff = durations.every(
    (duration) => duration <= nominalDtSec + 256 * Number.EPSILON * Math.max(
      nominalDtSec,
      duration,
      Number.MIN_VALUE,
    ),
  );

  const directDelta = finalStoredEnergyJ - initialStoredEnergyJ;
  const smoothDeltas = stages.map((stage) =>
    stage.nextLeftLimitStoredEnergyJ - stage.previousStoredEnergyJ);
  const eventJumps = stages.map((stage) =>
    stage.nextPostEventStoredEnergyJ - stage.nextLeftLimitStoredEnergyJ);
  const partitionedDelta = neumaierSum(stages.flatMap((_, index) => [
    smoothDeltas[index],
    eventJumps[index],
  ]));
  const partitionedMinusDirectDelta = partitionedDelta - directDelta;
  const partitionClosureToleranceJ =
    PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1
      .partitionClosureRoundoffFactor
    * Number.EPSILON
    * Math.max(
      WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1 * quadratureDurationSec,
      Math.abs(directDelta),
      sumAbsolute(smoothDeltas),
      sumAbsolute(eventJumps),
      Number.MIN_VALUE,
    );
  const partitionClosureRoundoffPass =
    Math.abs(partitionedMinusDirectDelta) <= partitionClosureToleranceJ;

  const integrate = (
    select: (stage: PhaseB1BackwardEulerMechanicalEnergyAggregationStageV1) => number,
  ) => neumaierSum(stages.map((stage) =>
    stage.actualCommittedDurationSec * select(stage)));
  const flowDissipation = integrate((stage) => stage.flowDissipationW);
  const slsDissipation = integrate((stage) => stage.slsDissipationW);
  const activeMechanicalOutput = integrate(
    (stage) => stage.activeMechanicalOutputPowerW,
  );
  const prescribedExternalEnvironment = integrate(
    (stage) => stage.prescribedExternalEnvironmentPowerW,
  );
  const publishedTaylorGeometryPowerResidual = integrate(
    (stage) => stage.publishedTaylorGeometryPowerResidualW,
  );
  const signedResidualJ = requireFinite(neumaierSum([
    directDelta,
    flowDissipation,
    slsDissipation,
    -activeMechanicalOutput,
    -prescribedExternalEnvironment,
    -publishedTaylorGeometryPowerResidual,
  ]), "official cycle signedResidualJ");
  const normalizationDenominatorJ = requirePositiveFinite(
    neumaierSum([
      WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1 * quadratureDurationSec,
      Math.abs(directDelta),
      flowDissipation,
      slsDissipation,
      integrate((stage) => Math.abs(stage.activeMechanicalOutputPowerW)),
      integrate((stage) => Math.abs(
        stage.prescribedExternalEnvironmentPowerW,
      )),
      integrate((stage) => Math.abs(
        stage.publishedTaylorGeometryPowerResidualW,
      )),
    ]),
    "official cycle normalizationDenominatorJ",
  );
  const normalizedResidual = Math.abs(signedResidualJ)
    / normalizationDenominatorJ;
  const cycleWithinTarget = normalizedResidual
    < PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1
      .quarterMillisecondCycleNormalizedResidualTolerance;

  const derivedStageNormalizedResiduals = stages.map((stage) => {
    const residualW = stage.storedEnergyRateW
      + stage.flowDissipationW
      + stage.slsDissipationW
      - stage.activeMechanicalOutputPowerW
      - stage.prescribedExternalEnvironmentPowerW
      - stage.publishedTaylorGeometryPowerResidualW;
    const denominatorW = WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1
      + Math.abs(stage.storedEnergyRateW)
      + stage.flowDissipationW
      + stage.slsDissipationW
      + Math.abs(stage.activeMechanicalOutputPowerW)
      + Math.abs(stage.prescribedExternalEnvironmentPowerW)
      + Math.abs(stage.publishedTaylorGeometryPowerResidualW);
    return Object.freeze({ residualW, denominatorW, rho: Math.abs(residualW) / denominatorW });
  });
  const maximizingStageIndex = maximumIndex(
    derivedStageNormalizedResiduals.map((value) => value.rho),
  );
  const maximumStageNormalizedResidual =
    derivedStageNormalizedResiduals[maximizingStageIndex].rho;
  const everyDerivedStageResidualWithinTolerance =
    derivedStageNormalizedResiduals.every((value) => value.rho
      < PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1
        .stageNormalizedResidualTolerance);
  const everySourceCorrectedStageLedgerAccepted = stages.every((stage) =>
    stage.sourceCorrectedStageLedgerAccepted);
  const everySourceLandAdapterWorkClosureAccepted = stages.every((stage) =>
    stage.sourceLandAdapterWorkClosureAccepted);
  const everySourceSlsBackwardEulerIdentityAccepted = stages.every((stage) =>
    stage.sourceSlsBackwardEulerIdentityAccepted);
  const stageGatePass = everyDerivedStageResidualWithinTolerance
    && everySourceCorrectedStageLedgerAccepted
    && everySourceLandAdapterWorkClosureAccepted
    && everySourceSlsBackwardEulerIdentityAccepted;

  const signedStoredEnergyJumpJ = neumaierSum(eventJumps);
  const absoluteStoredEnergyJumpL1J = sumAbsolute(eventJumps);
  const eventIndices = stages.flatMap((stage, index) =>
    stage.eventAtEnd ? [index] : []);
  const maximizingEventIndex = eventIndices.length === 0
    ? null
    : eventIndices.reduce((maximum, index) =>
      Math.abs(eventJumps[index]) > Math.abs(eventJumps[maximum])
        ? index
        : maximum, eventIndices[0]);
  const maximumAbsoluteStoredEnergyJumpJ = maximizingEventIndex === null
    ? 0
    : Math.abs(eventJumps[maximizingEventIndex]);
  const everyEventStoredEnergyJumpRoundoffZero = eventIndices.every((index) => {
    const stage = stages[index];
    const tolerance =
      PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1
        .eventStoredEnergyJumpRoundoffFactor
      * Number.EPSILON
      * Math.max(
        WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1
          * stage.actualCommittedDurationSec,
        Math.abs(stage.nextLeftLimitStoredEnergyJ),
        Math.abs(stage.nextPostEventStoredEnergyJ),
        Number.MIN_VALUE,
      );
    return Math.abs(eventJumps[index]) <= tolerance;
  });

  const continuousStageResidualL1J = neumaierSum(
    derivedStageNormalizedResiduals.map((value, index) =>
      stages[index].actualCommittedDurationSec * Math.abs(value.residualW)),
  );
  const continuousStageNormalizationL1J = requirePositiveFinite(
    WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1 * quadratureDurationSec
      + neumaierSum(derivedStageNormalizedResiduals.map((value, index) =>
        stages[index].actualCommittedDurationSec * (
          value.denominatorW - WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1
        ))),
    "continuous stage L1 normalization",
  );
  const stepBalances = stages.map((stage, index) => smoothDeltas[index]
    + stage.actualCommittedDurationSec * (
      stage.flowDissipationW
      + stage.slsDissipationW
      - stage.activeMechanicalOutputPowerW
      - stage.prescribedExternalEnvironmentPowerW
      - stage.publishedTaylorGeometryPowerResidualW
    ));
  const backwardEulerStepBalanceL1J = sumAbsolute(stepBalances)
    + absoluteStoredEnergyJumpL1J;
  const backwardEulerStepBalanceNormalizationL1J = requirePositiveFinite(
    WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1 * quadratureDurationSec
      + sumAbsolute(smoothDeltas)
      + absoluteStoredEnergyJumpL1J
      + flowDissipation
      + slsDissipation
      + integrate((stage) => Math.abs(stage.activeMechanicalOutputPowerW))
      + integrate((stage) => Math.abs(stage.prescribedExternalEnvironmentPowerW))
      + integrate((stage) => Math.abs(
        stage.publishedTaylorGeometryPowerResidualW,
      )),
    "BE step-balance L1 normalization",
  );
  const signedResidualSurvivalFraction = backwardEulerStepBalanceL1J === 0
    ? 1
    : Math.abs(signedResidualJ) / backwardEulerStepBalanceL1J;
  const triangleTolerance = 1024 * Number.EPSILON * Math.max(
    backwardEulerStepBalanceL1J,
    Math.abs(signedResidualJ),
    Number.MIN_VALUE,
  );
  const triangleInequalityRoundoffPass = Math.abs(signedResidualJ)
    <= backwardEulerStepBalanceL1J + triangleTolerance;
  const signedCancellationFraction = 1 - signedResidualSurvivalFraction;

  const geometryStageRhos = stages.map((stage) =>
    Math.abs(stage.publishedTaylorGeometryPowerResidualW)
      / stage.publishedTaylorGeometryNormalizationDenominatorW);
  const maximizingGeometryIndex = maximumIndex(geometryStageRhos);
  const geometryWorkDenominatorJ = requirePositiveFinite(
    WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1 * quadratureDurationSec
      + integrate((stage) =>
        stage.publishedTaylorGeometryNormalizationDenominatorW
          - WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1),
    "published Taylor geometry work denominator",
  );
  const geometryWorkNumeratorJ = integrate((stage) =>
    Math.abs(stage.publishedTaylorGeometryPowerResidualW));

  const quarterMillisecondSingleCycleEligibility = Object.is(
    nominalDtSec,
    PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1
      .quarterMillisecondNominalDtSec,
  );
  const quarterMillisecondSingleCycleEnergyGatePass =
    quarterMillisecondSingleCycleEligibility
    && durationPartitionRoundoffPass
    && everyActualCommittedDurationWithinNominalDtRoundoff
    && partitionClosureRoundoffPass
    && everyEventStoredEnergyJumpRoundoffZero
    && stageGatePass
    && cycleWithinTarget;
  return deepFreeze({
    scheme: "backward-Euler-endpoint-stage",
    normalizationPowerFloorW: WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1,
    nominalDtSec,
    nominalCycleLengthSec,
    startTimeSec,
    endTimeSec,
    transactionCount: stages.length,
    quadrature: {
      actualCommittedDurationSecByTransaction: Object.freeze(durations),
      quadratureDurationSec,
      naiveQuadratureDurationSecDiagnostic,
      endpointSpanSec,
      durationMinusEndpointSpanSec,
      durationMinusNominalCycleLengthSec,
      durationClosureToleranceSec,
      durationPartitionRoundoffPass,
      everyActualCommittedDurationWithinNominalDtRoundoff,
      nominalCycleLengthStrictEqualityRequired: false,
      summationPolicy:
        PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1
          .summationPolicy,
    },
    endpointStoredEnergyJ: {
      initial: initialStoredEnergyJ,
      final: finalStoredEnergyJ,
      directDelta,
      partitionedDelta,
      partitionedMinusDirectDelta,
      partitionClosureToleranceJ,
      partitionClosureRoundoffPass,
    },
    integratedTermsJ: {
      flowDissipation,
      slsDissipation,
      activeMechanicalOutput,
      prescribedExternalEnvironment,
      publishedTaylorGeometryPowerResidual,
    },
    officialCycleBalance: {
      signedResidualJ,
      normalizationDenominatorJ,
      normalizedResidual,
      normalizedResidualTolerance:
        PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1
          .quarterMillisecondCycleNormalizedResidualTolerance,
      directEndpointEnergyDeltaUsed: true,
      cycleResidualWithinQuarterMillisecondTarget: cycleWithinTarget,
    },
    stageAudit: {
      maximumNormalizedResidual: maximumStageNormalizedResidual,
      maximizingTransactionIndex: stages[maximizingStageIndex].transactionIndex,
      normalizedResidualTolerance:
        PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1
          .stageNormalizedResidualTolerance,
      everyDerivedStageResidualWithinTolerance,
      everySourceCorrectedStageLedgerAccepted,
      everySourceLandAdapterWorkClosureAccepted,
      everySourceSlsBackwardEulerIdentityAccepted,
      stageGatePass,
    },
    eventJumpAudit: {
      signedStoredEnergyJumpJ,
      absoluteStoredEnergyJumpL1J,
      maximumAbsoluteStoredEnergyJumpJ,
      maximizingTransactionIndex: maximizingEventIndex === null
        ? null
        : stages[maximizingEventIndex].transactionIndex,
      everyEventStoredEnergyJumpRoundoffZero,
    },
    cancellationDiagnostics: {
      continuousStageResidualL1J,
      continuousStageNormalizationL1J,
      continuousStageNormalizedL1Residual:
        continuousStageResidualL1J / continuousStageNormalizationL1J,
      backwardEulerStepBalanceL1J,
      backwardEulerStepBalanceNormalizationL1J,
      backwardEulerStepBalanceNormalizedL1Residual:
        backwardEulerStepBalanceL1J
        / backwardEulerStepBalanceNormalizationL1J,
      signedResidualSurvivalFraction,
      signedCancellationFraction,
      triangleInequalityRoundoffPass,
      diagnosticOnlyNotAcceptanceGate: true,
    },
    publishedTaylorGeometryDiagnostics: {
      maximumStageNormalizedResidual: geometryStageRhos[maximizingGeometryIndex],
      maximizingTransactionIndex:
        stages[maximizingGeometryIndex].transactionIndex,
      workNormalizedResidual: geometryWorkNumeratorJ / geometryWorkDenominatorJ,
      rawDefectRetained: true,
      subtractedFromWholeHeartResidual: true,
      diagnosticOnly: true,
      workConjugacyAccepted: false,
    },
    quarterMillisecondSingleCycleEligibility,
    quarterMillisecondSingleCycleEnergyGatePass,
    oneOrHalfMillisecondOverallEnergyAcceptancePass: false,
    wholeHeartBackwardEulerEnergyAcceptancePass: false,
    timestepConvergenceAcceptancePass: false,
    sdirk2EnergyAcceptancePass: false,
    physiologicalValidationPass: false,
    phaseB1AcceptancePass: false,
    diagnosticOnlyWithoutAuthenticatedCapsule: true,
  });
}

function validateStage(
  stage: PhaseB1BackwardEulerMechanicalEnergyAggregationStageV1,
  index: number,
): PhaseB1BackwardEulerMechanicalEnergyAggregationStageV1 {
  assertExactPlainRecordV1(stage, [
    "transactionIndex",
    "startTimeSec",
    "endTimeSec",
    "actualCommittedDurationSec",
    "eventAtEnd",
    "previousStoredEnergyJ",
    "nextLeftLimitStoredEnergyJ",
    "nextPostEventStoredEnergyJ",
    "storedEnergyRateW",
    "flowDissipationW",
    "slsDissipationW",
    "activeMechanicalOutputPowerW",
    "prescribedExternalEnvironmentPowerW",
    "publishedTaylorGeometryPowerResidualW",
    "publishedTaylorGeometryNormalizationDenominatorW",
    "sourceCorrectedStageLedgerAccepted",
    "sourceLandAdapterWorkClosureAccepted",
    "sourceSlsBackwardEulerIdentityAccepted",
  ], `energy aggregation stage[${index}]`);
  if (stage.transactionIndex !== index) {
    throw new Error(`energy aggregation stage[${index}] index drifted`);
  }
  requireFinite(stage.startTimeSec, `stage[${index}].startTimeSec`);
  requireFinite(stage.endTimeSec, `stage[${index}].endTimeSec`);
  requirePositiveFinite(
    stage.actualCommittedDurationSec,
    `stage[${index}].actualCommittedDurationSec`,
  );
  requireFinite(stage.previousStoredEnergyJ, `stage[${index}].previousStoredEnergyJ`);
  requireFinite(stage.nextLeftLimitStoredEnergyJ, `stage[${index}].nextLeftLimitStoredEnergyJ`);
  requireFinite(stage.nextPostEventStoredEnergyJ, `stage[${index}].nextPostEventStoredEnergyJ`);
  requireFinite(stage.storedEnergyRateW, `stage[${index}].storedEnergyRateW`);
  requireNonNegativeFinite(stage.flowDissipationW, `stage[${index}].flowDissipationW`);
  requireNonNegativeFinite(stage.slsDissipationW, `stage[${index}].slsDissipationW`);
  requireFinite(stage.activeMechanicalOutputPowerW, `stage[${index}].activeMechanicalOutputPowerW`);
  requireFinite(stage.prescribedExternalEnvironmentPowerW, `stage[${index}].prescribedExternalEnvironmentPowerW`);
  requireFinite(stage.publishedTaylorGeometryPowerResidualW, `stage[${index}].publishedTaylorGeometryPowerResidualW`);
  requirePositiveFinite(
    stage.publishedTaylorGeometryNormalizationDenominatorW,
    `stage[${index}].publishedTaylorGeometryNormalizationDenominatorW`,
  );
  for (const field of [
    "eventAtEnd",
    "sourceCorrectedStageLedgerAccepted",
    "sourceLandAdapterWorkClosureAccepted",
    "sourceSlsBackwardEulerIdentityAccepted",
  ] as const) {
    if (typeof stage[field] !== "boolean") {
      throw new Error(`stage[${index}].${field} must be boolean`);
    }
  }
  return stage;
}

function neumaierSum(values: readonly number[]): number {
  let sum = 0;
  let compensation = 0;
  for (const value of values) {
    const finite = requireFinite(value, "Neumaier summand");
    const next = sum + finite;
    compensation += Math.abs(sum) >= Math.abs(finite)
      ? (sum - next) + finite
      : (finite - next) + sum;
    sum = next;
  }
  return requireFinite(sum + compensation, "Neumaier sum");
}

function sumAbsolute(values: readonly number[]): number {
  return neumaierSum(values.map((value) => Math.abs(value)));
}

function maximumIndex(values: readonly number[]): number {
  if (values.length === 0) throw new Error("maximum requires values");
  return values.reduce((maximum, value, index) =>
    value > values[maximum] ? index : maximum, 0);
}

function roundoffEqual(left: number, right: number): boolean {
  const tolerance = 256 * Number.EPSILON
    * Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= tolerance;
}

function assertRoundoffEqual(
  actual: number,
  expected: number,
  field: string,
): void {
  if (!roundoffEqual(actual, expected)) throw new Error(`${field} mismatch`);
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const result = requireFinite(value, field);
  if (!(result > 0)) throw new Error(`${field} must be positive`);
  return result;
}

function requireNonNegativeFinite(value: unknown, field: string): number {
  const result = requireFinite(value, field);
  if (result < 0) throw new Error(`${field} must be non-negative`);
  return result;
}

function requireSha256Provider(
  value: unknown,
): asserts value is CanonicalSha256HexProvider {
  if (typeof value !== "function") {
    throw new Error("committed-cycle energy audit requires a SHA-256 provider");
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
