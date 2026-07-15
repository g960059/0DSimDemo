import {
  evaluateFourChamberBackwardEulerVolumeResidualV1,
  FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import {
  assertCanonicalFourChamberNewtonScaleRegistryV1,
} from "@/engine/myocardium/fourChamberV1/numerics/newtonScaleRegistryV1";
import {
  PHASE_B1_EVENT_INTEGRATED_SLS_BE_PRECOMMIT_POLICY_V1,
  PHASE_B1_EVENT_INTEGRATED_MONOLITHIC_TRANSACTION_V1_ID,
  type PhaseB1EventIntegratedMonolithicTransactionSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventIntegratedMonolithicTransactionV1";
import {
  assertCommittedPhaseB1BackwardEulerEventScheduleSuccessV1,
  classifyPhaseB1RunEndNominalGridBoundaryCoalescenceV1,
  PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1,
  PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_RUNNER_V1_ID,
  type PhaseB1RunEndNominalGridBoundaryCoalescenceDirectionV1,
  type PhaseB1BackwardEulerEventScheduleRunnerSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerEventScheduleRunnerV1";
import {
  evaluatePhaseB1EventFreeEndpointV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  buildPhaseB1LandSimplexNewtonDomainV1,
  minimumPhaseB1LandSimplexMarginV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/landSimplexNewtonDomainV1";
import {
  createPhaseB1EndpointStateV1,
  encodePhaseB1EndpointTopologyVectorsV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  assertPhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  encodePhaseB1StoredDifferentialStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  assertPhaseB1WholeHeartSlsBackwardEulerAuditSourceBindingV1,
  type PhaseB1WholeHeartSlsBackwardEulerAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartSlsBackwardEulerAuditV1";
import {
  assertPhaseB1WholeHeartMechanicalEnergyStageSnapshotSourceBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyStageSnapshotV1";
import {
  BLOOD_COMPARTMENT_IDS,
  DIRECTED_CLOSED_LOOP_EDGES,
  WALL_IDS,
  type BloodCompartmentId,
  type FourChamberFlowId,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_BACKWARD_EULER_COMMITTED_INTERVAL_LEDGER_V1_ID =
  "phase-b1-backward-euler-committed-interval-ledger-v1" as const;

export const PHASE_B1_BACKWARD_EULER_COMMITTED_INTERVAL_TOTAL_BLOOD_VOLUME_RELATIVE_TOLERANCE_V1 =
  1e-10 as const;

export type PhaseB1BackwardEulerCommittedIntervalLedgerInputV1 = Readonly<{
  scheduleRun: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1;
}>;

export type PhaseB1BackwardEulerIntegratedEdgeVolumeV1 = Readonly<{
  flowId: FourChamberFlowId;
  upstream: BloodCompartmentId;
  downstream: BloodCompartmentId;
  signedVolumeM3: number;
  forwardVolumeM3: number;
  regurgitantVolumeM3: number;
  signedDecompositionResidualM3: number;
}>;

export type PhaseB1BackwardEulerCompartmentClosureV1 = Readonly<{
  compartmentId: BloodCompartmentId;
  initialVolumeM3: number;
  finalVolumeM3: number;
  observedVolumeChangeM3: number;
  incidenceIntegratedVolumeChangeM3: number;
  closureResidualM3: number;
  integratedAcceptedStepResidualM3: number;
  closureMinusIntegratedStepResidualM3: number;
  registryDerivedClosureToleranceM3: number;
  registryDerivedClosureAccepted: boolean;
}>;

export type PhaseB1BackwardEulerWallResponseV1 = Readonly<{
  wallId: FourChamberWallId;
  maximumStoredCalciumStateChangeFromInitial: number;
  maximumFreeCalciumUMChangeFromInitial: number;
  maximumActiveKirchhoffStressPaChangeFromInitial: number;
}>;

export type PhaseB1BackwardEulerRunEndNominalGridBoundaryCoalescenceTraceV1 =
  Readonly<{
    requestedSegmentIndex: number;
    nominalGridIndex: number;
    originalNominalGridBoundaryTimeSec: number;
    selectedRunEndTimeSec: number;
    direction: Exclude<
      PhaseB1RunEndNominalGridBoundaryCoalescenceDirectionV1,
      null
    >;
  }>;

export type PhaseB1BackwardEulerCommittedIntervalLedgerV1 = Readonly<{
  ledgerId: typeof PHASE_B1_BACKWARD_EULER_COMMITTED_INTERVAL_LEDGER_V1_ID;
  transactionId:
    typeof PHASE_B1_EVENT_INTEGRATED_MONOLITHIC_TRANSACTION_V1_ID;
  eventScheduleRunnerId:
    typeof PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_RUNNER_V1_ID;
  eventSchedulePolicyId:
    typeof PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1.policyId;
  slsBackwardEulerPreCommitPolicyId:
    typeof PHASE_B1_EVENT_INTEGRATED_SLS_BE_PRECOMMIT_POLICY_V1.policyId;
  temporalScope: "runner-committed-interval-not-cycle-certified";
  slsMode: "on" | "off";
  initialEndpoint: PhaseB1EndpointStateV1;
  finalEndpoint: PhaseB1EndpointStateV1;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  committedTransactionCount: number;
  sourceRunnerSuccessAuthenticatedInProcess: true;
  sourceModelObjectIdentityRetained: true;
  sourceWallMaterialBindingObjectIdentityRetained: true;
  sourceRegistryObjectIdentityRetained: true;
  runnerCommittedTransactionProvenanceVerified: true;
  uncommittedOrFailedAttemptTransactionCountConsumed: 0;
  sourceTestFailureProbeUsed: boolean;
  sourceOneUlpRunEndNominalBoundaryCoalescencePolicy:
    typeof PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1.oneUlpRunEndNominalBoundaryCoalescence;
  sourceRunEndTimeSnappingApplied: false;
  runEndNominalGridBoundaryCoalescenceCount: number;
  runEndNominalGridBoundaryCoalescenceTrace:
    readonly PhaseB1BackwardEulerRunEndNominalGridBoundaryCoalescenceTraceV1[];
  nonProbeEvidenceEligibilityPass: boolean;
  supercycleSemanticsEvaluatedByLedger: false;
  acceptedTransactionReferencesMatchCommittedAttemptPrefix: true;
  acceptedTransactionReferencesMatchRequestedSegments: true;
  committedTransactionsOnly: true;
  retryAttemptRecordsAcceptedAsTransactions: false;
  exactEndpointChainVerified: true;
  exactStepTimeChainVerified: true;
  edgeOrder: readonly FourChamberFlowId[];
  integratedEdgeVolumeByFlow: Readonly<Record<
    FourChamberFlowId,
    PhaseB1BackwardEulerIntegratedEdgeVolumeV1
  >>;
  maximumAbsoluteSignedDecompositionResidualM3: number;
  compartmentClosureByCompartment: Readonly<Record<
    BloodCompartmentId,
    PhaseB1BackwardEulerCompartmentClosureV1
  >>;
  maximumAbsoluteCompartmentClosureResidualM3: number;
  maximumAbsoluteClosureMinusIntegratedStepResidualM3: number;
  everyCompartmentRegistryDerivedClosureAccepted: boolean;
  initialTotalBloodVolumeM3: number;
  finalTotalBloodVolumeM3: number;
  maximumAbsoluteTotalBloodVolumeDriftM3: number;
  maximumRelativeTotalBloodVolumeDrift: number;
  totalBloodVolumeRelativeTolerance:
    typeof PHASE_B1_BACKWARD_EULER_COMMITTED_INTERVAL_TOTAL_BLOOD_VOLUME_RELATIVE_TOLERANCE_V1;
  committedIntervalTotalBloodVolumeConservationGatePass: boolean;
  maximumAbsolutePerStepTotalBloodVolumeChangeM3: number;
  maximumAbsolutePerStepVolumeResidualM3PerSec: number;
  maximumAbsolutePerStepSummedVolumeResidualM3PerSec: number;
  allAcceptedEndpointBloodVolumesPositive: boolean;
  newtonScaleRegistryContentSha256: string;
  newtonScaleRegistryObjectIdentityFixedAcrossLedgerAudits: true;
  newtonScaleRegistryFixedBeforeRun: true;
  adaptiveNewtonRescalingApplied: false;
  expectedNewtonUnknownCount: 51 | 46;
  expectedNewtonResidualCount: 51 | 46;
  everyStepExpectedNewtonTopology: boolean;
  everyStepCalciumNewtonUnknownAndResidualCountZero: boolean;
  maximumScaledResidualInfinityNorm: number;
  maximumScaledUpdateInfinityNorm: number;
  globalScaledResidualInfinityTolerance: number;
  globalScaledUpdateInfinityTolerance: number;
  everyStepRegistryScaledNewtonToleranceAccepted: boolean;
  minimumLandSimplexMargin: number;
  everyAcceptedEndpointStrictlyInsideLandSimplex: boolean;
  slsBackwardEulerAudits:
    readonly PhaseB1WholeHeartSlsBackwardEulerAuditV1[];
  slsBackwardEulerAuditsConsumedFromCommittedTransactionsOnly: true;
  everyCommittedTransactionSlsAuditSourceBindingAuthenticated: true;
  maximumSlsNormalizedIdentityResidual: number;
  maximizingSlsIdentityTransactionIndex: number | null;
  maximizingSlsIdentityEndTimeSec: number | null;
  maximizingSlsIdentityWallId: FourChamberWallId | null;
  maximumSlsAbsoluteAlphaMismatch: number;
  maximumSlsAbsoluteExpandedIdentityResidualJDiagnostic: number;
  everyStepSlsBackwardEulerIdentityAccepted: boolean;
  slsStatePhysicallyAbsentInOffMode: boolean;
  everyStepProjectionClippingClampAndFallbackFree: boolean;
  wallResponseByWall: Readonly<Record<
    FourChamberWallId,
    PhaseB1BackwardEulerWallResponseV1
  >>;
  responseExcursionDiagnosticsAreNotAcceptanceGates: true;
  maximumAbsoluteFlowChangeFromInitialM3PerSec: number;
  maximumAbsoluteBloodVolumeChangeFromInitialM3: number;
  maximumAbsoluteTriSegSeptalMidwallVolumeChangeFromInitialM3: number;
  maximumAbsoluteTriSegJunctionRadiusChangeFromInitialM: number;
  triSegChangeIsReportOnly: true;
  structuralAndNumericalIntervalLedgerGatesPass: boolean;
  intervalEnergyAcceptancePass: false;
  fullBeatAcceptancePass: false;
  periodicityAcceptancePass: false;
  physiologicalValidationPass: false;
  phaseB1AcceptancePass: false;
  modelCoreIntegration: false;
  browserRuntimeAdopted: false;
  releaseRuntimeReachable: false;
  testOnly: true;
  units: Readonly<{
    time: "s";
    volume: "m^3";
    flow: "m^3/s";
    volumeResidual: "m^3/s";
    activeStress: "Pa";
    landSimplexMargin: "1";
    scaledNewtonNorm: "1";
  }>;
}>;

/**
 * Summarizes one authenticated interval committed by the event-schedule
 * runner. Retry attempts and provisional children are intentionally outside
 * this boundary. Flow volume uses the accepted backward-Euler endpoint flow,
 * so every compartment closure is the time integral of the same canonical
 * eight-edge incidence ledger used by the monolithic residual.
 */
export function buildPhaseB1BackwardEulerCommittedIntervalLedgerV1(
  input: PhaseB1BackwardEulerCommittedIntervalLedgerInputV1,
): PhaseB1BackwardEulerCommittedIntervalLedgerV1 {
  assertExactPlainRecordV1(input, [
    "scheduleRun",
  ], "Phase B1 backward-Euler committed-interval ledger input");
  const scheduleRun =
    assertCommittedPhaseB1BackwardEulerEventScheduleSuccessV1(
      input.scheduleRun,
    );
  if (
    scheduleRun.committedTransactionProvenanceAuditPass !== true
    || scheduleRun.uncommittedAcceptedAttemptTransactionCount !== 0
    || scheduleRun
      .acceptedTransactionsMatchCompletedSegmentFlatteningByObjectIdentity
        !== true
    || scheduleRun
      .acceptedTransactionsMatchCommittedAttemptProjectionByObjectIdentity
        !== true
  ) {
    throw new Error("runner committed-transaction provenance audit failed");
  }
  const committedTransactions = scheduleRun.acceptedTransactions;
  assertDensePlainArrayV1(
    committedTransactions,
    undefined,
    "scheduleRun.acceptedTransactions",
  );
  if (committedTransactions.length === 0) {
    throw new Error("scheduleRun.acceptedTransactions must not be empty");
  }
  const runEndNominalGridBoundaryCoalescenceTrace = Object.freeze(
    scheduleRun.requestedSegments.flatMap((segment) => {
      if (!segment.oneUlpRunEndNominalGridBoundaryCoalesced) return [];
      const direction = segment
        .oneUlpRunEndNominalGridBoundaryCoalescenceDirection;
      if (
        direction === null
        || !segment.oneUlpRunEndNominalGridBoundaryCoalescenceEligible
        || !segment.endedAtRunBoundary
        || !Object.is(segment.endTimeSec, scheduleRun.requestedEndTimeSec)
        || classifyPhaseB1RunEndNominalGridBoundaryCoalescenceV1(
          segment.nominalGridBoundaryTimeSec,
          segment.endTimeSec,
        ) !== direction
      ) {
        throw new Error("runner run-end/grid coalescence trace is inconsistent");
      }
      return [Object.freeze({
        requestedSegmentIndex: segment.requestedSegmentIndex,
        nominalGridIndex: segment.nominalGridIndex,
        originalNominalGridBoundaryTimeSec:
          segment.nominalGridBoundaryTimeSec,
        selectedRunEndTimeSec: segment.endTimeSec,
        direction,
      })];
    }),
  );
  if (
    scheduleRun.runEndTimeSnappingApplied !== false
    || runEndNominalGridBoundaryCoalescenceTrace.length
      !== scheduleRun.oneUlpRunEndNominalGridBoundaryCoalescenceCount
  ) {
    throw new Error("runner run-end/grid coalescence count or policy drifted");
  }
  const model = scheduleRun.modelObjectAtRunStart;
  const registry = assertCanonicalFourChamberNewtonScaleRegistryV1(
    model.newtonScaleRegistry,
  );
  const binding = assertPhaseB1WallMaterialBindingV1(
    scheduleRun.wallMaterialBindingObjectAtRunStart,
  );
  if (!Object.is(scheduleRun.newtonScaleRegistryObjectAtRunStart, registry)) {
    throw new Error("committed-interval ledger registry identity differs from runner");
  }
  assertRunnerCommittedTransactionReferences(scheduleRun);
  const initialEndpoint = endpointSnapshot(scheduleRun.initialEndpoint);
  const finalEndpoint = endpointSnapshot(scheduleRun.finalEndpoint);
  const slsMode = initialEndpoint.differentialState.slsMode;
  if (finalEndpoint.differentialState.slsMode !== slsMode) {
    throw new Error("cycle ledger cannot change SLS topology");
  }
  const expectedNewtonUnknownCount = (slsMode === "on" ? 51 : 46) as 51 | 46;
  const expectedNewtonResidualCount = expectedNewtonUnknownCount;
  const domain = buildPhaseB1LandSimplexNewtonDomainV1(slsMode);
  const initialEvaluation = evaluatePhaseB1EventFreeEndpointV1(
    model,
    binding,
    initialEndpoint,
  );

  const edgeAccumulators = Object.fromEntries(
    DIRECTED_CLOSED_LOOP_EDGES.map((edge) => [edge.flowId, {
      signedVolumeM3: 0,
      forwardVolumeM3: 0,
      regurgitantVolumeM3: 0,
    }]),
  ) as Record<FourChamberFlowId, {
    signedVolumeM3: number;
    forwardVolumeM3: number;
    regurgitantVolumeM3: number;
  }>;
  const integratedStepResidualM3ByCompartment = Object.fromEntries(
    BLOOD_COMPARTMENT_IDS.map((compartmentId) => [compartmentId, 0]),
  ) as Record<BloodCompartmentId, number>;
  const slsBackwardEulerAudits: PhaseB1WholeHeartSlsBackwardEulerAuditV1[] = [];
  const acceptedEndpoints: PhaseB1EndpointStateV1[] = [initialEndpoint];
  const acceptedLeftLimitEvaluations = [] as ReturnType<
    typeof evaluatePhaseB1EventFreeEndpointV1
  >[];

  let expectedPrevious = initialEndpoint;
  let maximumAbsolutePerStepTotalBloodVolumeChangeM3 = 0;
  let maximumAbsolutePerStepVolumeResidualM3PerSec = 0;
  let maximumAbsolutePerStepSummedVolumeResidualM3PerSec = 0;
  let maximumScaledResidualInfinityNorm = 0;
  let maximumScaledUpdateInfinityNorm = 0;
  let minimumLandSimplexMargin = endpointLandSimplexMargin(
    initialEndpoint,
    domain,
  );
  let everyStepExpectedNewtonTopology = true;
  let everyStepCalciumNewtonUnknownAndResidualCountZero = true;
  let everyStepRegistryScaledNewtonToleranceAccepted = true;
  let everyStepProjectionClippingClampAndFallbackFree = true;

  committedTransactions.forEach((transaction, transactionIndex) => {
    assertClosedCommittedTransaction(transaction, transactionIndex);
    assertEndpointExactlyEqual(
      transaction.previousEndpoint,
      expectedPrevious,
      `committedTransactions[${transactionIndex}].previousEndpoint chain`,
    );
    const step = transaction.leftLimitStep;
    assertEndpointExactlyEqual(
      step.previousEndpoint,
      transaction.previousEndpoint,
      `committedTransactions[${transactionIndex}].leftLimitStep.previousEndpoint`,
    );
    assertEndpointExactlyEqual(
      step.previousEvaluation.endpoint,
      step.previousEndpoint,
      `committedTransactions[${transactionIndex}].previousEvaluation.endpoint`,
    );
    assertEndpointExactlyEqual(
      step.nextEvaluation.endpoint,
      step.nextEndpointLeftLimit,
      `committedTransactions[${transactionIndex}].nextEvaluation.endpoint`,
    );
    assertEndpointExactlyEqual(
      step.residualEvaluation.nextEndpoint,
      step.nextEndpointLeftLimit,
      `committedTransactions[${transactionIndex}].residualEvaluation.nextEndpoint`,
    );
    assertEndpointExactlyEqual(
      step.residualEvaluation.nextEvaluation.endpoint,
      step.nextEndpointLeftLimit,
      `committedTransactions[${transactionIndex}].residualEvaluation.nextEvaluation.endpoint`,
    );
    assertNonCalciumDifferentialStateExactlyEqual(
      step.nextEndpointLeftLimit,
      transaction.nextEndpoint,
      `committedTransactions[${transactionIndex}].post-event non-calcium state`,
    );
    if (!(transaction.nextEndpoint.timeSec > transaction.previousEndpoint.timeSec)) {
      throw new Error(`committedTransactions[${transactionIndex}] has non-positive duration`);
    }
    if (
      transaction.nextEndpoint.timeSec !== step.nextEndpointLeftLimit.timeSec
      || transaction.coordinator.startTimeSec !== transaction.previousEndpoint.timeSec
      || transaction.coordinator.endTimeSec !== transaction.nextEndpoint.timeSec
    ) {
      throw new Error(`committedTransactions[${transactionIndex}] time chain is not exact`);
    }
    const dtSec = transaction.nextEndpoint.timeSec
      - transaction.previousEndpoint.timeSec;
    assertFiniteNumberExactlyEqual(
      transaction.actualCommittedDurationSec,
      dtSec,
      `committedTransactions[${transactionIndex}].actualCommittedDurationSec`,
    );
    assertFiniteNumberExactlyEqual(
      transaction.coordinator.durationSec,
      dtSec,
      `committedTransactions[${transactionIndex}].coordinator.durationSec`,
    );
    assertFiniteNumberExactlyEqual(
      step.residualEvaluation.volumeResidual.dtSec,
      dtSec,
      `committedTransactions[${transactionIndex}].volumeResidual.dtSec`,
    );
    if (
      transaction.coordinator.slsMode !== slsMode
      || step.slsMode !== slsMode
      || transaction.nextEndpoint.differentialState.slsMode !== slsMode
    ) {
      throw new Error(`committedTransactions[${transactionIndex}] changed SLS topology`);
    }

    const flows = step.nextEvaluation.closedLoop.allFlowsM3PerSec;
    const independentVolumeResidual =
      evaluateFourChamberBackwardEulerVolumeResidualV1({
        previousVolumesM3:
          transaction.previousEndpoint.differentialState.bloodVolumesM3,
        nextVolumesM3:
          step.nextEndpointLeftLimit.differentialState.bloodVolumesM3,
        nextFlowsM3PerSec: flows,
        dtSec,
      });
    for (const compartmentId of BLOOD_COMPARTMENT_IDS) {
      assertFiniteNumberExactlyEqual(
        independentVolumeResidual.residualsM3PerSec[compartmentId],
        step.residualEvaluation.volumeResidual.residualsM3PerSec[compartmentId],
        `committedTransactions[${transactionIndex}].volumeResidual.${compartmentId}`,
      );
      integratedStepResidualM3ByCompartment[compartmentId] += dtSec
        * independentVolumeResidual.residualsM3PerSec[compartmentId];
    }
    for (const edge of DIRECTED_CLOSED_LOOP_EDGES) {
      const flowM3PerSec = requireFinite(
        flows[edge.flowId],
        `committedTransactions[${transactionIndex}].flow.${edge.flowId}`,
      );
      const accumulator = edgeAccumulators[edge.flowId];
      accumulator.signedVolumeM3 += dtSec * flowM3PerSec;
      accumulator.forwardVolumeM3 += dtSec * Math.max(flowM3PerSec, 0);
      accumulator.regurgitantVolumeM3 += dtSec * Math.max(-flowM3PerSec, 0);
    }

    const volumeResidual = step.residualEvaluation.volumeResidual;
    maximumAbsolutePerStepTotalBloodVolumeChangeM3 = Math.max(
      maximumAbsolutePerStepTotalBloodVolumeChangeM3,
      Math.abs(volumeResidual.totalBloodVolumeChangeM3),
    );
    maximumAbsolutePerStepVolumeResidualM3PerSec = Math.max(
      maximumAbsolutePerStepVolumeResidualM3PerSec,
      volumeResidual.maximumAbsoluteResidualM3PerSec,
    );
    maximumAbsolutePerStepSummedVolumeResidualM3PerSec = Math.max(
      maximumAbsolutePerStepSummedVolumeResidualM3PerSec,
      Math.abs(volumeResidual.summedResidualM3PerSec),
    );
    const scaledResidualInfinityNorm = requireFinite(
      step.newtonDiagnostics.finalResidualInfinityNorm,
      `committedTransactions[${transactionIndex}].finalResidualInfinityNorm`,
    );
    const scaledUpdateInfinityNorm = requireFinite(
      step.newtonDiagnostics.finalUpdateInfinityNorm,
      `committedTransactions[${transactionIndex}].finalUpdateInfinityNorm`,
    );
    maximumScaledResidualInfinityNorm = Math.max(
      maximumScaledResidualInfinityNorm,
      scaledResidualInfinityNorm,
    );
    maximumScaledUpdateInfinityNorm = Math.max(
      maximumScaledUpdateInfinityNorm,
      scaledUpdateInfinityNorm,
    );
    everyStepRegistryScaledNewtonToleranceAccepted &&=
      scaledResidualInfinityNorm
        <= registry.tolerances.globalResidualInfinityNorm
      && scaledUpdateInfinityNorm
        <= registry.tolerances.globalUpdateInfinityNorm;
    everyStepExpectedNewtonTopology &&=
      step.unknownCount === expectedNewtonUnknownCount
      && step.residualCount === expectedNewtonResidualCount
      && transaction.coordinator.newtonUnknownCount
        === expectedNewtonUnknownCount;
    everyStepCalciumNewtonUnknownAndResidualCountZero &&=
      step.calciumNewtonUnknownCount === 0
      && step.calciumResidualCount === 0
      && step.residualEvaluation.calciumResidualCount === 0;
    everyStepProjectionClippingClampAndFallbackFree &&=
      projectionClippingClampAndFallbackFree(transaction);

    if (
      transaction.slsBackwardEulerPreCommitPolicyId
        !== PHASE_B1_EVENT_INTEGRATED_SLS_BE_PRECOMMIT_POLICY_V1.policyId
      || !transaction.slsBackwardEulerPreCommitGatePass
      || !transaction.slsBackwardEulerAuditCompletedBeforeEventCommit
      || transaction.testSlsBackwardEulerAuditFailureInjected
      || !transaction.slsBackwardEulerPreCommitAudit
        .normalizedIdentityAccepted
    ) {
      throw new Error(
        `committedTransactions[${transactionIndex}] lacks an accepted pre-commit SLS BE audit`,
      );
    }
    const slsAudit =
      assertPhaseB1WholeHeartSlsBackwardEulerAuditSourceBindingV1({
        audit: transaction.slsBackwardEulerPreCommitAudit,
      model,
      wallMaterialBinding: binding,
      previousEndpoint: transaction.previousEndpoint,
      nextEndpointLeftLimit: step.nextEndpointLeftLimit,
      dtSec,
      });
    assertPhaseB1WholeHeartMechanicalEnergyStageSnapshotSourceBindingV1({
      snapshot: transaction.mechanicalEnergyStageSnapshot,
      model,
      wallMaterialBinding: binding,
      acceptedStep: step,
      dtSec,
    });
    slsBackwardEulerAudits.push(slsAudit);
    minimumLandSimplexMargin = Math.min(
      minimumLandSimplexMargin,
      step.minimumLandSimplexMargin,
      endpointLandSimplexMargin(step.nextEndpointLeftLimit, domain),
      endpointLandSimplexMargin(transaction.nextEndpoint, domain),
    );
    acceptedEndpoints.push(step.nextEndpointLeftLimit, transaction.nextEndpoint);
    acceptedLeftLimitEvaluations.push(step.nextEvaluation);
    expectedPrevious = transaction.nextEndpoint;
  });
  assertEndpointExactlyEqual(
    expectedPrevious,
    finalEndpoint,
    "finalEndpoint committed chain",
  );

  const integratedEdgeVolumeByFlow = Object.freeze(Object.fromEntries(
    DIRECTED_CLOSED_LOOP_EDGES.map((edge) => {
      const values = edgeAccumulators[edge.flowId];
      return [edge.flowId, Object.freeze({
        flowId: edge.flowId,
        upstream: edge.upstream,
        downstream: edge.downstream,
        signedVolumeM3: requireFinite(
          values.signedVolumeM3,
          `${edge.flowId}.signedVolumeM3`,
        ),
        forwardVolumeM3: requireFinite(
          values.forwardVolumeM3,
          `${edge.flowId}.forwardVolumeM3`,
        ),
        regurgitantVolumeM3: requireFinite(
          values.regurgitantVolumeM3,
          `${edge.flowId}.regurgitantVolumeM3`,
        ),
        signedDecompositionResidualM3: requireFinite(
          values.signedVolumeM3
            - values.forwardVolumeM3
            + values.regurgitantVolumeM3,
          `${edge.flowId}.signedDecompositionResidualM3`,
        ),
      })];
    }),
  )) as Readonly<Record<
    FourChamberFlowId,
    PhaseB1BackwardEulerIntegratedEdgeVolumeV1
  >>;
  const maximumAbsoluteSignedDecompositionResidualM3 = Math.max(
    ...FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1.map((flowId) => Math.abs(
      integratedEdgeVolumeByFlow[flowId].signedDecompositionResidualM3,
    )),
  );

  const durationSec = finalEndpoint.timeSec - initialEndpoint.timeSec;
  if (!(durationSec > 0)) throw new Error("cycle ledger duration must be positive");
  const compartmentClosureByCompartment = Object.freeze(Object.fromEntries(
    BLOOD_COMPARTMENT_IDS.map((compartmentId, compartmentIndex) => {
      const initialVolumeM3 =
        initialEndpoint.differentialState.bloodVolumesM3[compartmentId];
      const finalVolumeM3 =
        finalEndpoint.differentialState.bloodVolumesM3[compartmentId];
      const observedVolumeChangeM3 = finalVolumeM3 - initialVolumeM3;
      const incidenceIntegratedVolumeChangeM3 =
        DIRECTED_CLOSED_LOOP_EDGES.reduce((sum, edge, edgeIndex) => {
          const coefficient = edge.upstream === compartmentId
            ? -1
            : edge.downstream === compartmentId ? 1 : 0;
          if (
            coefficient !== 0
            && FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1[edgeIndex] !== edge.flowId
          ) {
            throw new Error("canonical incidence edge ordering drifted");
          }
          return sum + coefficient
            * integratedEdgeVolumeByFlow[edge.flowId].signedVolumeM3;
        }, 0);
      const closureResidualM3 = observedVolumeChangeM3
        - incidenceIntegratedVolumeChangeM3;
      const integratedAcceptedStepResidualM3 =
        integratedStepResidualM3ByCompartment[compartmentId];
      const closureMinusIntegratedStepResidualM3 = closureResidualM3
        - integratedAcceptedStepResidualM3;
      const registryDerivedClosureToleranceM3 = Math.max(
        durationSec
          * registry.unknownScales.bloodVolumeM3[compartmentId]
          / registry.residualScales.referenceTimeSec
          * registry.tolerances.globalResidualInfinityNorm,
        1024 * Number.EPSILON * Math.max(initialVolumeM3, finalVolumeM3),
      );
      return [compartmentId, Object.freeze({
        compartmentId: BLOOD_COMPARTMENT_IDS[compartmentIndex],
        initialVolumeM3,
        finalVolumeM3,
        observedVolumeChangeM3: requireFinite(
          observedVolumeChangeM3,
          `${compartmentId}.observedVolumeChangeM3`,
        ),
        incidenceIntegratedVolumeChangeM3: requireFinite(
          incidenceIntegratedVolumeChangeM3,
          `${compartmentId}.incidenceIntegratedVolumeChangeM3`,
        ),
        closureResidualM3: requireFinite(
          closureResidualM3,
          `${compartmentId}.closureResidualM3`,
        ),
        integratedAcceptedStepResidualM3: requireFinite(
          integratedAcceptedStepResidualM3,
          `${compartmentId}.integratedAcceptedStepResidualM3`,
        ),
        closureMinusIntegratedStepResidualM3: requireFinite(
          closureMinusIntegratedStepResidualM3,
          `${compartmentId}.closureMinusIntegratedStepResidualM3`,
        ),
        registryDerivedClosureToleranceM3,
        registryDerivedClosureAccepted:
          Math.abs(closureResidualM3) <= registryDerivedClosureToleranceM3,
      })];
    }),
  )) as Readonly<Record<
    BloodCompartmentId,
    PhaseB1BackwardEulerCompartmentClosureV1
  >>;
  const compartmentClosures = BLOOD_COMPARTMENT_IDS.map((compartmentId) =>
    compartmentClosureByCompartment[compartmentId]);
  const maximumAbsoluteCompartmentClosureResidualM3 = Math.max(
    ...compartmentClosures.map((closure) => Math.abs(closure.closureResidualM3)),
  );
  const maximumAbsoluteClosureMinusIntegratedStepResidualM3 = Math.max(
    ...compartmentClosures.map((closure) => Math.abs(
      closure.closureMinusIntegratedStepResidualM3,
    )),
  );
  const everyCompartmentRegistryDerivedClosureAccepted =
    compartmentClosures.every((closure) =>
      closure.registryDerivedClosureAccepted);

  const initialTotalBloodVolumeM3 = totalBloodVolume(initialEndpoint);
  const finalTotalBloodVolumeM3 = totalBloodVolume(finalEndpoint);
  const maximumAbsoluteTotalBloodVolumeDriftM3 = Math.max(
    ...acceptedEndpoints.map((endpoint) => Math.abs(
      totalBloodVolume(endpoint) - initialTotalBloodVolumeM3,
    )),
  );
  const maximumRelativeTotalBloodVolumeDrift =
    maximumAbsoluteTotalBloodVolumeDriftM3 / initialTotalBloodVolumeM3;
  const allAcceptedEndpointBloodVolumesPositive = acceptedEndpoints.every(
    (endpoint) => BLOOD_COMPARTMENT_IDS.every((compartmentId) =>
      endpoint.differentialState.bloodVolumesM3[compartmentId] > 0),
  );

  const maximizingSlsIdentityTransactionIndex = slsMode === "off"
    ? null
    : slsBackwardEulerAudits.reduce((maxIndex, audit, index, audits) =>
      audit.normalizedIdentityResidual
          > audits[maxIndex].normalizedIdentityResidual
        ? index
        : maxIndex, 0);
  const maximizingSlsIdentityAudit =
    maximizingSlsIdentityTransactionIndex === null
      ? null
      : slsBackwardEulerAudits[maximizingSlsIdentityTransactionIndex];
  const maximumSlsNormalizedIdentityResidual =
    maximizingSlsIdentityAudit?.normalizedIdentityResidual ?? 0;
  const maximizingSlsIdentityWallId =
    maximizingSlsIdentityAudit?.wallAuditByWall === null
      || maximizingSlsIdentityAudit?.wallAuditByWall === undefined
      ? null
      : WALL_IDS.reduce((maxWallId, wallId) =>
        maximizingSlsIdentityAudit.wallAuditByWall![wallId]
          .normalizedIdentityResidual
            > maximizingSlsIdentityAudit.wallAuditByWall![maxWallId]
              .normalizedIdentityResidual
          ? wallId
          : maxWallId, WALL_IDS[0]);
  const maximizingSlsIdentityEndTimeSec =
    maximizingSlsIdentityTransactionIndex === null
      ? null
      : committedTransactions[maximizingSlsIdentityTransactionIndex]
        .leftLimitStep.nextEndpointLeftLimit.timeSec;
  const maximumSlsAbsoluteAlphaMismatch = Math.max(
    ...slsBackwardEulerAudits.map((audit) => audit.maximumAbsoluteAlphaMismatch),
  );
  const maximumSlsAbsoluteExpandedIdentityResidualJDiagnostic = Math.max(
    ...slsBackwardEulerAudits.map((audit) =>
      audit.maximumAbsoluteExpandedIdentityResidualJDiagnostic),
  );
  const everyStepSlsBackwardEulerIdentityAccepted =
    slsBackwardEulerAudits.every((audit) => audit.normalizedIdentityAccepted);
  const slsStatePhysicallyAbsentInOffMode = slsMode === "on"
    ? false
    : slsBackwardEulerAudits.every((audit) =>
      audit.slsStatePhysicallyAbsent && audit.wallAuditByWall === null);

  const wallResponseByWall = wallRecord((wallId) => {
    const initialCalcium = initialEndpoint.differentialState.calciumByWall[wallId];
    const initialFreeCalciumUM = initialEvaluation.freeCalciumUMByWall[wallId];
    const initialActiveStressPa = initialEvaluation.wallMaterialByWall[wallId]
      .wallActiveKirchhoffStressPa;
    const maximumStoredCalciumStateChangeFromInitial = Math.max(
      ...acceptedEndpoints.flatMap((endpoint) => {
        const calcium = endpoint.differentialState.calciumByWall[wallId];
        return [
          Math.abs(calcium.r - initialCalcium.r),
          Math.abs(calcium.d - initialCalcium.d),
        ];
      }),
    );
    const maximumFreeCalciumUMChangeFromInitial = Math.max(
      ...acceptedLeftLimitEvaluations.map((evaluation) => Math.abs(
        evaluation.freeCalciumUMByWall[wallId] - initialFreeCalciumUM,
      )),
    );
    const maximumActiveKirchhoffStressPaChangeFromInitial = Math.max(
      ...acceptedLeftLimitEvaluations.map((evaluation) => Math.abs(
        evaluation.wallMaterialByWall[wallId].wallActiveKirchhoffStressPa
          - initialActiveStressPa,
      )),
    );
    return Object.freeze({
      wallId,
      maximumStoredCalciumStateChangeFromInitial,
      maximumFreeCalciumUMChangeFromInitial,
      maximumActiveKirchhoffStressPaChangeFromInitial,
    });
  });
  const maximumAbsoluteFlowChangeFromInitialM3PerSec = Math.max(
    ...acceptedLeftLimitEvaluations.flatMap((evaluation) =>
      FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1.map((flowId) => Math.abs(
        evaluation.closedLoop.allFlowsM3PerSec[flowId]
          - initialEvaluation.closedLoop.allFlowsM3PerSec[flowId],
      ))),
  );
  const maximumAbsoluteBloodVolumeChangeFromInitialM3 = Math.max(
    ...acceptedEndpoints.flatMap((endpoint) => BLOOD_COMPARTMENT_IDS.map(
      (compartmentId) => Math.abs(
        endpoint.differentialState.bloodVolumesM3[compartmentId]
          - initialEndpoint.differentialState.bloodVolumesM3[compartmentId],
      ),
    )),
  );
  const maximumAbsoluteTriSegSeptalMidwallVolumeChangeFromInitialM3 = Math.max(
    ...acceptedEndpoints.map((endpoint) => Math.abs(
      endpoint.triSegCoordinates.V_m_S
        - initialEndpoint.triSegCoordinates.V_m_S,
    )),
  );
  const maximumAbsoluteTriSegJunctionRadiusChangeFromInitialM = Math.max(
    ...acceptedEndpoints.map((endpoint) => Math.abs(
      endpoint.triSegCoordinates.y_m - initialEndpoint.triSegCoordinates.y_m,
    )),
  );
  const everyAcceptedEndpointStrictlyInsideLandSimplex =
    minimumLandSimplexMargin > 0;
  const nonProbeEvidenceEligibilityPass =
    scheduleRun.testFailureProbeUsed === false;
  const committedIntervalTotalBloodVolumeConservationGatePass =
    maximumRelativeTotalBloodVolumeDrift
      < PHASE_B1_BACKWARD_EULER_COMMITTED_INTERVAL_TOTAL_BLOOD_VOLUME_RELATIVE_TOLERANCE_V1;
  const structuralAndNumericalIntervalLedgerGatesPass =
    everyCompartmentRegistryDerivedClosureAccepted
    && committedIntervalTotalBloodVolumeConservationGatePass
    && allAcceptedEndpointBloodVolumesPositive
    && everyStepExpectedNewtonTopology
    && everyStepCalciumNewtonUnknownAndResidualCountZero
    && everyStepRegistryScaledNewtonToleranceAccepted
    && everyAcceptedEndpointStrictlyInsideLandSimplex
    && everyStepSlsBackwardEulerIdentityAccepted
    && everyStepProjectionClippingClampAndFallbackFree
    && nonProbeEvidenceEligibilityPass;

  return deepFreeze({
    ledgerId: PHASE_B1_BACKWARD_EULER_COMMITTED_INTERVAL_LEDGER_V1_ID,
    transactionId: PHASE_B1_EVENT_INTEGRATED_MONOLITHIC_TRANSACTION_V1_ID,
    eventScheduleRunnerId:
      PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_RUNNER_V1_ID,
    eventSchedulePolicyId:
      PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1.policyId,
    slsBackwardEulerPreCommitPolicyId:
      PHASE_B1_EVENT_INTEGRATED_SLS_BE_PRECOMMIT_POLICY_V1.policyId,
    temporalScope: "runner-committed-interval-not-cycle-certified",
    slsMode,
    initialEndpoint,
    finalEndpoint,
    startTimeSec: initialEndpoint.timeSec,
    endTimeSec: finalEndpoint.timeSec,
    durationSec,
    committedTransactionCount: committedTransactions.length,
    sourceRunnerSuccessAuthenticatedInProcess: true,
    sourceModelObjectIdentityRetained: true,
    sourceWallMaterialBindingObjectIdentityRetained: true,
    sourceRegistryObjectIdentityRetained: true,
    runnerCommittedTransactionProvenanceVerified: true,
    uncommittedOrFailedAttemptTransactionCountConsumed: 0,
    sourceTestFailureProbeUsed: scheduleRun.testFailureProbeUsed,
    sourceOneUlpRunEndNominalBoundaryCoalescencePolicy:
      scheduleRun.oneUlpRunEndNominalBoundaryCoalescence,
    sourceRunEndTimeSnappingApplied: false,
    runEndNominalGridBoundaryCoalescenceCount:
      runEndNominalGridBoundaryCoalescenceTrace.length,
    runEndNominalGridBoundaryCoalescenceTrace,
    nonProbeEvidenceEligibilityPass,
    supercycleSemanticsEvaluatedByLedger: false,
    acceptedTransactionReferencesMatchCommittedAttemptPrefix: true,
    acceptedTransactionReferencesMatchRequestedSegments: true,
    committedTransactionsOnly: true,
    retryAttemptRecordsAcceptedAsTransactions: false,
    exactEndpointChainVerified: true,
    exactStepTimeChainVerified: true,
    edgeOrder: FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
    integratedEdgeVolumeByFlow,
    maximumAbsoluteSignedDecompositionResidualM3,
    compartmentClosureByCompartment,
    maximumAbsoluteCompartmentClosureResidualM3,
    maximumAbsoluteClosureMinusIntegratedStepResidualM3,
    everyCompartmentRegistryDerivedClosureAccepted,
    initialTotalBloodVolumeM3,
    finalTotalBloodVolumeM3,
    maximumAbsoluteTotalBloodVolumeDriftM3,
    maximumRelativeTotalBloodVolumeDrift,
    totalBloodVolumeRelativeTolerance:
      PHASE_B1_BACKWARD_EULER_COMMITTED_INTERVAL_TOTAL_BLOOD_VOLUME_RELATIVE_TOLERANCE_V1,
    committedIntervalTotalBloodVolumeConservationGatePass,
    maximumAbsolutePerStepTotalBloodVolumeChangeM3,
    maximumAbsolutePerStepVolumeResidualM3PerSec,
    maximumAbsolutePerStepSummedVolumeResidualM3PerSec,
    allAcceptedEndpointBloodVolumesPositive,
    newtonScaleRegistryContentSha256: registry.registryContentSha256,
    newtonScaleRegistryObjectIdentityFixedAcrossLedgerAudits: true,
    newtonScaleRegistryFixedBeforeRun: true,
    adaptiveNewtonRescalingApplied: false,
    expectedNewtonUnknownCount,
    expectedNewtonResidualCount,
    everyStepExpectedNewtonTopology,
    everyStepCalciumNewtonUnknownAndResidualCountZero,
    maximumScaledResidualInfinityNorm,
    maximumScaledUpdateInfinityNorm,
    globalScaledResidualInfinityTolerance:
      registry.tolerances.globalResidualInfinityNorm,
    globalScaledUpdateInfinityTolerance:
      registry.tolerances.globalUpdateInfinityNorm,
    everyStepRegistryScaledNewtonToleranceAccepted,
    minimumLandSimplexMargin,
    everyAcceptedEndpointStrictlyInsideLandSimplex,
    slsBackwardEulerAudits: Object.freeze(slsBackwardEulerAudits),
    slsBackwardEulerAuditsConsumedFromCommittedTransactionsOnly: true,
    everyCommittedTransactionSlsAuditSourceBindingAuthenticated: true,
    maximumSlsNormalizedIdentityResidual,
    maximizingSlsIdentityTransactionIndex,
    maximizingSlsIdentityEndTimeSec,
    maximizingSlsIdentityWallId,
    maximumSlsAbsoluteAlphaMismatch,
    maximumSlsAbsoluteExpandedIdentityResidualJDiagnostic,
    everyStepSlsBackwardEulerIdentityAccepted,
    slsStatePhysicallyAbsentInOffMode,
    everyStepProjectionClippingClampAndFallbackFree,
    wallResponseByWall,
    responseExcursionDiagnosticsAreNotAcceptanceGates: true,
    maximumAbsoluteFlowChangeFromInitialM3PerSec,
    maximumAbsoluteBloodVolumeChangeFromInitialM3,
    maximumAbsoluteTriSegSeptalMidwallVolumeChangeFromInitialM3,
    maximumAbsoluteTriSegJunctionRadiusChangeFromInitialM,
    triSegChangeIsReportOnly: true,
    structuralAndNumericalIntervalLedgerGatesPass,
    intervalEnergyAcceptancePass: false,
    fullBeatAcceptancePass: false,
    periodicityAcceptancePass: false,
    physiologicalValidationPass: false,
    phaseB1AcceptancePass: false,
    modelCoreIntegration: false,
    browserRuntimeAdopted: false,
    releaseRuntimeReachable: false,
    testOnly: true,
    units: {
      time: "s",
      volume: "m^3",
      flow: "m^3/s",
      volumeResidual: "m^3/s",
      activeStress: "Pa",
      landSimplexMargin: "1",
      scaledNewtonNorm: "1",
    },
  } satisfies PhaseB1BackwardEulerCommittedIntervalLedgerV1);
}

function assertRunnerCommittedTransactionReferences(
  scheduleRun: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1,
): void {
  const committedAttemptTransactions = scheduleRun.attempts.flatMap(
    (attempt) => {
      if (!attempt.committedToCompletedPrefix) return [];
      if (!attempt.accepted || attempt.acceptedTransaction === null) {
        throw new Error(
          "runner committed-attempt provenance contains no accepted transaction",
        );
      }
      return [attempt.acceptedTransaction];
    },
  );
  const requestedSegmentTransactions = scheduleRun.requestedSegments.flatMap(
    (segment) => segment.acceptedTransactions,
  );
  assertSameOrderedObjectReferences(
    scheduleRun.acceptedTransactions,
    committedAttemptTransactions,
    "runner committed-attempt prefix",
  );
  assertSameOrderedObjectReferences(
    scheduleRun.acceptedTransactions,
    requestedSegmentTransactions,
    "runner requested-segment commits",
  );
  if (
    scheduleRun.acceptedTransactionCount
      !== scheduleRun.acceptedTransactions.length
  ) {
    throw new Error("runner committed transaction count drifted");
  }
}

function assertSameOrderedObjectReferences(
  canonical: readonly object[],
  candidate: readonly object[],
  field: string,
): void {
  if (candidate.length !== canonical.length) {
    throw new Error(`${field} length differs from acceptedTransactions`);
  }
  for (let index = 0; index < canonical.length; index += 1) {
    if (!Object.is(canonical[index], candidate[index])) {
      throw new Error(`${field}[${index}] reference differs from runner commit`);
    }
  }
}

function assertClosedCommittedTransaction(
  transaction: PhaseB1EventIntegratedMonolithicTransactionSuccessV1,
  index: number,
): void {
  assertExactPlainRecordV1(transaction, [
    "ok",
    "transactionId",
    "previousEndpoint",
    "nextEndpoint",
    "leftLimitStep",
    "actualCommittedDurationSec",
    "mechanicalEnergyStageSnapshot",
    "slsBackwardEulerPreCommitPolicyId",
    "slsBackwardEulerPreCommitAudit",
    "slsBackwardEulerPreCommitGatePass",
    "slsBackwardEulerAuditCompletedBeforeEventCommit",
    "testSlsBackwardEulerAuditFailureInjected",
    "coordinator",
    "postEventTriSegReinitialization",
    "preJumpForcingParityVerified",
    "calciumParametersOwnedByWallBinding",
    "eventFreeMonolithicAtomicStepIntegrated",
    "aggregateEventBatchCommittedOnce",
    "algebraicReinitializationCallCount",
    "rollbackSnapshotReturned",
    "projectionApplied",
    "hiddenStateClippingApplied",
    "phaseB1Acceptance",
    "testReferenceOnly",
    "releaseRuntimeReachable",
  ], `committedTransactions[${index}]`);
  if (
    transaction.ok !== true
    || transaction.transactionId
      !== PHASE_B1_EVENT_INTEGRATED_MONOLITHIC_TRANSACTION_V1_ID
    || transaction.leftLimitStep.converged !== true
    || transaction.slsBackwardEulerPreCommitPolicyId
      !== PHASE_B1_EVENT_INTEGRATED_SLS_BE_PRECOMMIT_POLICY_V1.policyId
    || transaction.slsBackwardEulerPreCommitGatePass !== true
    || transaction.slsBackwardEulerAuditCompletedBeforeEventCommit !== true
    || transaction.testSlsBackwardEulerAuditFailureInjected !== false
    || transaction.preJumpForcingParityVerified !== true
    || transaction.calciumParametersOwnedByWallBinding !== true
    || transaction.eventFreeMonolithicAtomicStepIntegrated !== true
    || transaction.rollbackSnapshotReturned !== false
    || transaction.projectionApplied !== false
    || transaction.hiddenStateClippingApplied !== false
    || transaction.phaseB1Acceptance !== false
    || transaction.testReferenceOnly !== true
    || transaction.releaseRuntimeReachable !== false
  ) {
    throw new Error(`committedTransactions[${index}] is not a committed reference transaction`);
  }
}

function projectionClippingClampAndFallbackFree(
  transaction: PhaseB1EventIntegratedMonolithicTransactionSuccessV1,
): boolean {
  const step = transaction.leftLimitStep;
  const postEvent = transaction.postEventTriSegReinitialization;
  return transaction.projectionApplied === false
    && transaction.hiddenStateClippingApplied === false
    && step.projectionApplied === false
    && step.hiddenStateClippingApplied === false
    && step.postStepBloodVolumeProjectionApplied === false
    && step.flowClampApplied === false
    && step.previousEvaluation.projectionApplied === false
    && step.previousEvaluation.hiddenStateClippingApplied === false
    && step.nextEvaluation.projectionApplied === false
    && step.nextEvaluation.hiddenStateClippingApplied === false
    && step.nextEvaluation.closedLoop.projectionApplied === false
    && step.nextEvaluation.closedLoop.flowClampApplied === false
    && step.nextEvaluation.closedLoop.fallbackApplied === false
    && step.residualEvaluation.projectionApplied === false
    && step.residualEvaluation.hiddenStateClippingApplied === false
    && step.residualEvaluation.volumeResidual.bloodVolumeProjectionApplied
      === false
    && step.residualEvaluation.volumeResidual.flowClampApplied === false
    && step.residualEvaluation.volumeResidual.fallbackApplied === false
    && WALL_IDS.every((wallId) =>
      !step.nextEvaluation.wallMaterialByWall[wallId]
        .sourceLandOutput.health.projectionUsed)
    && (postEvent === null || (
      postEvent.projectionApplied === false
      && postEvent.fallbackApplied === false
      && postEvent.differentialStateChanged === false
    ));
}

function endpointSnapshot(
  endpoint: PhaseB1EndpointStateV1,
): PhaseB1EndpointStateV1 {
  return createPhaseB1EndpointStateV1({
    timeSec: endpoint.timeSec,
    differentialState: endpoint.differentialState,
    triSegCoordinates: endpoint.triSegCoordinates,
  });
}

function assertEndpointExactlyEqual(
  actual: PhaseB1EndpointStateV1,
  expected: PhaseB1EndpointStateV1,
  field: string,
): void {
  const actualSnapshot = endpointSnapshot(actual);
  const expectedSnapshot = endpointSnapshot(expected);
  if (!Object.is(actualSnapshot.timeSec, expectedSnapshot.timeSec)) {
    throw new Error(`${field}.timeSec mismatch`);
  }
  const actualStored = encodePhaseB1StoredDifferentialStateV1(
    actualSnapshot.differentialState,
  );
  const expectedStored = encodePhaseB1StoredDifferentialStateV1(
    expectedSnapshot.differentialState,
  );
  assertVectorExactlyEqual(actualStored, expectedStored, `${field}.storedState`);
  if (
    !Object.is(
      actualSnapshot.triSegCoordinates.V_m_S,
      expectedSnapshot.triSegCoordinates.V_m_S,
    )
    || !Object.is(
      actualSnapshot.triSegCoordinates.y_m,
      expectedSnapshot.triSegCoordinates.y_m,
    )
  ) {
    throw new Error(`${field}.triSegCoordinates mismatch`);
  }
}

function assertNonCalciumDifferentialStateExactlyEqual(
  actual: PhaseB1EndpointStateV1,
  expected: PhaseB1EndpointStateV1,
  field: string,
): void {
  const actualVectors = encodePhaseB1EndpointTopologyVectorsV1(actual);
  const expectedVectors = encodePhaseB1EndpointTopologyVectorsV1(expected);
  if (actualVectors.slsMode !== expectedVectors.slsMode) {
    throw new Error(`${field}.slsMode mismatch`);
  }
  assertVectorExactlyEqual(
    actualVectors.nonCalciumDifferentialState,
    expectedVectors.nonCalciumDifferentialState,
    field,
  );
}

function assertVectorExactlyEqual(
  actual: readonly number[],
  expected: readonly number[],
  field: string,
): void {
  if (actual.length !== expected.length) {
    throw new Error(`${field} length mismatch`);
  }
  for (let index = 0; index < actual.length; index += 1) {
    if (!Object.is(actual[index], expected[index])) {
      throw new Error(`${field}[${index}] mismatch`);
    }
  }
}

function endpointLandSimplexMargin(
  endpoint: PhaseB1EndpointStateV1,
  domain: ReturnType<typeof buildPhaseB1LandSimplexNewtonDomainV1>,
): number {
  const vectors = encodePhaseB1EndpointTopologyVectorsV1(endpoint);
  return minimumPhaseB1LandSimplexMarginV1(
    Object.freeze([
      ...vectors.nonCalciumDifferentialState,
      ...vectors.algebraicState,
    ]),
    domain,
  );
}

function totalBloodVolume(endpoint: PhaseB1EndpointStateV1): number {
  return requirePositiveFinite(
    BLOOD_COMPARTMENT_IDS.reduce((sum, compartmentId) => sum
      + endpoint.differentialState.bloodVolumesM3[compartmentId], 0),
    "totalBloodVolumeM3",
  );
}

function assertFiniteNumberExactlyEqual(
  actual: number,
  expected: number,
  field: string,
): void {
  requireFinite(actual, `${field}.actual`);
  requireFinite(expected, `${field}.expected`);
  if (!Object.is(actual, expected)) {
    throw new Error(`${field} mismatch`);
  }
}

function wallRecord<Value>(
  build: (wallId: FourChamberWallId) => Value,
): Readonly<Record<FourChamberWallId, Value>> {
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => [
    wallId,
    build(wallId),
  ]))) as Readonly<Record<FourChamberWallId, Value>>;
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

function deepFreeze<Value>(
  value: Value,
  visited: WeakSet<object> = new WeakSet<object>(),
): Value {
  if (value === null || typeof value !== "object") return value;
  const object = value as object;
  if (visited.has(object)) return value;
  visited.add(object);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child, visited);
  }
  if (!Object.isFrozen(object)) Object.freeze(object);
  return value;
}
