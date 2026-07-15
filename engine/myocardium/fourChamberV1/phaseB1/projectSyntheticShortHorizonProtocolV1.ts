import type {
  CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import type {
  FourChamberNewtonScaleRegistryV1,
} from "@/engine/myocardium/fourChamberV1/numerics/newtonScaleRegistryV1";
import {
  PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicNumericalPolicyV1";
import {
  runPhaseB1EventIntegratedMonolithicTransactionV1,
  type PhaseB1EventIntegratedMonolithicTransactionFailureV1,
  type PhaseB1EventIntegratedMonolithicTransactionSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventIntegratedMonolithicTransactionV1";
import type {
  PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import type {
  PhaseB1WallCalciumDriveEventV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WholeHeartExactCalciumEventCoordinatorV1";
import type {
  PhaseB1SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  buildPhaseB1StoredDifferentialLabelsV1,
  encodePhaseB1StoredDifferentialStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import {
  auditPhaseB1WholeHeartMechanicalEnergyV1,
  type PhaseB1WholeHeartMechanicalEnergyAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyAuditV1";
import {
  PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyAuditPolicyV1";
import {
  auditPhaseB1WholeHeartSlsBackwardEulerIdentityV1,
  PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1,
  type PhaseB1WholeHeartSlsBackwardEulerAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartSlsBackwardEulerAuditV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export const PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_PROTOCOL_V1_ID =
  "phase-b1-project-synthetic-short-horizon-protocol-v1" as const;

export const PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1 =
  Object.freeze({
    policyId: "phase-b1-project-synthetic-short-horizon-policy-v1",
    slsModes: Object.freeze(["on", "off"] as const),
    durationSec: 0.001,
    mainDtSec: 0.00025,
    convergenceTimeStepsSec: Object.freeze([
      0.0005,
      0.00025,
      0.000125,
    ] as const),
    endpointEvent: Object.freeze({
      wallId: "LVFW" as const,
      eventId: "phase-b1-short-horizon-lvfw",
      calciumDriveTimeSec: 0.0005,
      strength: 0.2,
      timingOwner:
        "tissue-manifest-electrical-to-calcium-delay" as const,
    }),
    totalBloodVolumeAbsoluteToleranceM3: 1e-17,
    correctedStageLedgerNormalizedResidualTolerance:
      PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1
        .correctedStageLedgerNormalizedResidualTolerance,
    landAdapterWorkRelativeTolerance:
      PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1
        .landAdapterWorkRelativeTolerance,
    normalizedSlsIdentityTolerance:
      PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1,
    differentiatedTriSegConstraintResidualToleranceNPerMSec:
      PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
        .differentiatedTriSegConstraintResidualToleranceNPerMSec,
    maximumTriSegScaledCoordinateStepDistance: 0.05,
    backwardEulerObservedStateOrderThreshold: 0.8,
    hiddenSubdivisionAllowed: false,
    projectionAllowed: false,
    hiddenStateClippingAllowed: false,
    flowClampAllowed: false,
    testReferenceOnly: true,
    phaseB1Acceptance: false,
    physiologicalValidation: false,
    releaseRuntimeReachable: false,
  } as const);

export type PhaseB1ProjectSyntheticShortHorizonStepEvidenceV1 = Readonly<{
  requestedStepIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  eventCountAtEnd: 0 | 1;
  transaction: PhaseB1EventIntegratedMonolithicTransactionSuccessV1;
  slsAudit: PhaseB1WholeHeartSlsBackwardEulerAuditV1;
  mechanicalEnergyAudit: PhaseB1WholeHeartMechanicalEnergyAuditV1;
}>;

export type PhaseB1ProjectSyntheticShortHorizonSuccessV1 = Readonly<{
  completed: true;
  protocolId: typeof PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_PROTOCOL_V1_ID;
  policyId:
    typeof PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1.policyId;
  slsMode: PhaseB1SlsModeV1;
  dtSec: number;
  durationSec: typeof PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1.durationSec;
  requestedStepCount: number;
  acceptedStepCount: number;
  hiddenSubdivisionUsed: false;
  initialEndpoint: PhaseB1EndpointStateV1;
  finalEndpoint: PhaseB1EndpointStateV1;
  steps: readonly PhaseB1ProjectSyntheticShortHorizonStepEvidenceV1[];
  diagnostics: Readonly<{
    maximumAbsoluteTotalBloodVolumeResidualFromInitialM3: number;
    maximumAbsolutePerStepTotalBloodVolumeChangeM3: number;
    maximumScaledResidualInfinityNorm: number;
    minimumLandSimplexMargin: number;
    maximumDifferentiatedTriSegConstraintResidualNPerMSec: number;
    maximumSlsIdentityRho: number;
    maximumLandAdapterWorkRelativeResidual: number;
    maximumCorrectedStageLedgerRho: number;
    minimumFlowDissipationW: number;
    minimumSlsDissipationW: number;
    maximumTriSegScaledCoordinateStepDistance: number;
    totalEndpointEventCount: number;
    totalPostEventTriSegReinitializationCount: number;
    maximumAbsoluteBackwardEulerUnresolvedEnergyIncrementJ: number;
    cumulativeSignedBackwardEulerUnresolvedEnergyIncrementJ: number;
    cumulativeBackwardEulerDiagnosticDenominatorJ: number;
    cumulativeBackwardEulerDiagnosticRho: number;
    everyStepProjectionFree: boolean;
    everyStepHiddenStateClippingFree: boolean;
    everyStepFlowClampFree: boolean;
    everyStepSlsIdentityAccepted: boolean;
    everyStepLandAdapterWorkClosureAccepted: boolean;
    everyStepGlobalSemismoothJacobianAuditAccepted: boolean;
    everyStepDifferentiatedKinematicsAccepted: boolean;
    everyStepMechanicalCorrectedStageLedgerAccepted: boolean;
  }>;
  projectSyntheticShortHorizonRegressionAccepted: boolean;
  globalSemismoothJacobianAuditedAtEveryStep: true;
  constitutivePartialsIndependentlyValidated: false;
  wholeHeartBackwardEulerEnergyAcceptanceClaimed: false;
  acceptedColdInitializationClaimed: false;
  acceptedMaterialBranchClaimed: false;
  fullBeatAcceptanceClaimed: false;
  periodicAttractorClaimed: false;
  physiologicalValidationClaimed: false;
  phaseB1Acceptance: false;
  testReferenceOnly: true;
  releaseRuntimeReachable: false;
}>;

export type PhaseB1ProjectSyntheticShortHorizonFailureV1 = Readonly<{
  completed: false;
  protocolId: typeof PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_PROTOCOL_V1_ID;
  policyId:
    typeof PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1.policyId;
  slsMode: PhaseB1SlsModeV1;
  dtSec: number;
  durationSec: typeof PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1.durationSec;
  failedStepIndex: number;
  failureStage:
    | "event-integrated-transaction"
    | "post-transaction-continuous-step-audit";
  failureReason: string;
  failedTransaction:
    PhaseB1EventIntegratedMonolithicTransactionFailureV1 | null;
  acceptedTransactionBeforeAuditFailure:
    PhaseB1EventIntegratedMonolithicTransactionSuccessV1 | null;
  rollbackInitialEndpoint: PhaseB1EndpointStateV1;
  rollbackEndpointAtFailedStep: PhaseB1EndpointStateV1;
  completedStepsBeforeFailure:
    readonly PhaseB1ProjectSyntheticShortHorizonStepEvidenceV1[];
  hiddenSubdivisionUsed: false;
  constitutivePartialsIndependentlyValidated: false;
  wholeHeartBackwardEulerEnergyAcceptanceClaimed: false;
  acceptedColdInitializationClaimed: false;
  acceptedMaterialBranchClaimed: false;
  fullBeatAcceptanceClaimed: false;
  periodicAttractorClaimed: false;
  physiologicalValidationClaimed: false;
  phaseB1Acceptance: false;
  testReferenceOnly: true;
  releaseRuntimeReachable: false;
}>;

export type PhaseB1ProjectSyntheticShortHorizonResultV1 =
  | PhaseB1ProjectSyntheticShortHorizonSuccessV1
  | PhaseB1ProjectSyntheticShortHorizonFailureV1;

export type PhaseB1ProjectSyntheticTimeStepConvergenceV1 = Readonly<{
  protocolId: "phase-b1-project-synthetic-backward-euler-step-convergence-v1";
  policyId:
    typeof PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1.policyId;
  slsMode: PhaseB1SlsModeV1;
  durationSec: typeof PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1.durationSec;
  timeStepsSec:
    typeof PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1.convergenceTimeStepsSec;
  runs: readonly [
    PhaseB1ProjectSyntheticShortHorizonResultV1,
    PhaseB1ProjectSyntheticShortHorizonResultV1,
    PhaseB1ProjectSyntheticShortHorizonResultV1,
  ];
  allCompleted: boolean;
  nominalGridPreservedWithoutSubdivision: boolean;
  coarseToMediumScaledEndpointDifference: number | null;
  mediumToFineScaledEndpointDifference: number | null;
  observedStateOrder: number | null;
  backwardEulerObservedStateOrderThreshold:
    typeof PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1.backwardEulerObservedStateOrderThreshold;
  projectSyntheticStateOrderRegressionAccepted: boolean;
  maximumBackwardEulerUnresolvedIncrementByTimeStepJ:
    readonly [number, number, number] | null;
  backwardEulerUnresolvedIncrementObservedOrderCoarseToMedium: number | null;
  backwardEulerUnresolvedIncrementObservedOrderMediumToFine: number | null;
  backwardEulerUnresolvedIncrementOrderDiagnosticOnly: true;
  wholeHeartBackwardEulerEnergyAcceptanceClaimed: false;
  phaseB1TimestepConvergenceAcceptanceClaimed: false;
  fullBeatAcceptanceClaimed: false;
  physiologicalValidationClaimed: false;
  phaseB1Acceptance: false;
  testReferenceOnly: true;
  releaseRuntimeReachable: false;
}>;

export type PhaseB1ProjectSyntheticEndpointScaleDescriptorV1 = Readonly<{
  schemaId: "phase-b1-project-synthetic-endpoint-scale-descriptor-v1";
  slsMode: PhaseB1SlsModeV1;
  sourceNewtonScaleRegistryContentSha256: string;
  sourceRegistryFixedBeforeRun: true;
  sourceRegistryAdaptiveRescaling: false;
  norm: "scaled-infinity-norm";
  storedDifferentialStateCount: 59 | 54;
  triSegAlgebraicStateCount: 2;
  endpointLabels: readonly string[];
  endpointScales: readonly number[];
}>;

export function runPhaseB1ProjectSyntheticShortHorizonV1(
  slsMode: PhaseB1SlsModeV1,
  dtSec: number,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ProjectSyntheticShortHorizonResultV1 {
  assertSupportedMode(slsMode);
  requireSupportedTimeStep(dtSec);
  const policy = PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1;
  const rawStepCount = policy.durationSec / dtSec;
  const requestedStepCount = Math.round(rawStepCount);
  if (
    requestedStepCount <= 0
    || Math.abs(rawStepCount - requestedStepCount)
      > 1e-12 * Math.max(1, rawStepCount)
  ) throw new Error("short-horizon duration must be an integer step multiple");
  const eventStep = policy.endpointEvent.calciumDriveTimeSec / dtSec;
  if (Math.abs(eventStep - Math.round(eventStep)) > 1e-12) {
    throw new Error("short-horizon endpoint event must align with every grid");
  }
  const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
    slsMode,
    sha256Hex,
  );
  const initialEndpoint = candidate.warmStart.endpoint;
  let endpoint = initialEndpoint;
  const steps: PhaseB1ProjectSyntheticShortHorizonStepEvidenceV1[] = [];
  for (let index = 0; index < requestedStepCount; index += 1) {
    const startEndpoint = endpoint;
    const endTimeSec = (index + 1) * dtSec;
    const events = eventsAtEndTime(endTimeSec);
    const transaction = runPhaseB1EventIntegratedMonolithicTransactionV1({
      model: candidate.model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: startEndpoint,
      endTimeSec,
      coincidentEventsAtEnd: events,
    });
    if (transaction.ok === false) {
      return Object.freeze({
        completed: false,
        protocolId: PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_PROTOCOL_V1_ID,
        policyId: policy.policyId,
        slsMode,
        dtSec,
        durationSec: policy.durationSec,
        failedStepIndex: index,
        failureStage: "event-integrated-transaction",
        failureReason: transaction.failureReason,
        failedTransaction: transaction,
        acceptedTransactionBeforeAuditFailure: null,
        rollbackInitialEndpoint: initialEndpoint,
        rollbackEndpointAtFailedStep: startEndpoint,
        completedStepsBeforeFailure: Object.freeze(steps),
        hiddenSubdivisionUsed: false,
        constitutivePartialsIndependentlyValidated: false,
        wholeHeartBackwardEulerEnergyAcceptanceClaimed: false,
        acceptedColdInitializationClaimed: false,
        acceptedMaterialBranchClaimed: false,
        fullBeatAcceptanceClaimed: false,
        periodicAttractorClaimed: false,
        physiologicalValidationClaimed: false,
        phaseB1Acceptance: false,
        testReferenceOnly: true,
        releaseRuntimeReachable: false,
      });
    }
    let slsAudit: PhaseB1WholeHeartSlsBackwardEulerAuditV1;
    let mechanicalEnergyAudit: PhaseB1WholeHeartMechanicalEnergyAuditV1;
    try {
      slsAudit = auditPhaseB1WholeHeartSlsBackwardEulerIdentityV1({
        model: candidate.model,
        wallMaterialBinding: candidate.wallMaterialBinding,
        previousEndpoint: startEndpoint,
        nextEndpointLeftLimit: transaction.leftLimitStep.nextEndpointLeftLimit,
        dtSec,
      });
      mechanicalEnergyAudit = auditPhaseB1WholeHeartMechanicalEnergyV1({
        model: candidate.model,
        wallMaterialBinding: candidate.wallMaterialBinding,
        previousEndpoint: startEndpoint,
        nextEndpointLeftLimit: transaction.leftLimitStep.nextEndpointLeftLimit,
        dtSec,
      });
    } catch (error) {
      return Object.freeze({
        completed: false,
        protocolId: PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_PROTOCOL_V1_ID,
        policyId: policy.policyId,
        slsMode,
        dtSec,
        durationSec: policy.durationSec,
        failedStepIndex: index,
        failureStage: "post-transaction-continuous-step-audit",
        failureReason: errorMessage(error),
        failedTransaction: null,
        acceptedTransactionBeforeAuditFailure: transaction,
        rollbackInitialEndpoint: initialEndpoint,
        rollbackEndpointAtFailedStep: startEndpoint,
        completedStepsBeforeFailure: Object.freeze(steps),
        hiddenSubdivisionUsed: false,
        constitutivePartialsIndependentlyValidated: false,
        wholeHeartBackwardEulerEnergyAcceptanceClaimed: false,
        acceptedColdInitializationClaimed: false,
        acceptedMaterialBranchClaimed: false,
        fullBeatAcceptanceClaimed: false,
        periodicAttractorClaimed: false,
        physiologicalValidationClaimed: false,
        phaseB1Acceptance: false,
        testReferenceOnly: true,
        releaseRuntimeReachable: false,
      });
    }
    steps.push(Object.freeze({
      requestedStepIndex: index,
      startTimeSec: startEndpoint.timeSec,
      endTimeSec,
      eventCountAtEnd: events.length as 0 | 1,
      transaction,
      slsAudit,
      mechanicalEnergyAudit,
    }));
    endpoint = transaction.nextEndpoint;
  }
  const diagnostics = summarizeRunDiagnostics(
    steps,
    initialEndpoint,
    candidate.model.newtonScaleRegistry,
  );
  const projectSyntheticShortHorizonRegressionAccepted =
    diagnostics.maximumAbsoluteTotalBloodVolumeResidualFromInitialM3
      < policy.totalBloodVolumeAbsoluteToleranceM3
    && diagnostics.maximumAbsolutePerStepTotalBloodVolumeChangeM3
      < policy.totalBloodVolumeAbsoluteToleranceM3
    && diagnostics.maximumScaledResidualInfinityNorm
      < candidate.model.newtonScaleRegistry.tolerances
        .globalResidualInfinityNorm
    && diagnostics.minimumLandSimplexMargin > 0
    && diagnostics.maximumDifferentiatedTriSegConstraintResidualNPerMSec
      < policy.differentiatedTriSegConstraintResidualToleranceNPerMSec
    && diagnostics.maximumSlsIdentityRho
      < policy.normalizedSlsIdentityTolerance
    && diagnostics.maximumLandAdapterWorkRelativeResidual
      < policy.landAdapterWorkRelativeTolerance
    && diagnostics.maximumCorrectedStageLedgerRho
      < policy.correctedStageLedgerNormalizedResidualTolerance
    && diagnostics.minimumFlowDissipationW >= 0
    && diagnostics.minimumSlsDissipationW >= 0
    && diagnostics.maximumTriSegScaledCoordinateStepDistance
      < policy.maximumTriSegScaledCoordinateStepDistance
    && diagnostics.totalEndpointEventCount === 1
    && diagnostics.totalPostEventTriSegReinitializationCount === 1
    && diagnostics.everyStepProjectionFree
    && diagnostics.everyStepHiddenStateClippingFree
    && diagnostics.everyStepFlowClampFree
    && diagnostics.everyStepSlsIdentityAccepted
    && diagnostics.everyStepLandAdapterWorkClosureAccepted
    && diagnostics.everyStepGlobalSemismoothJacobianAuditAccepted
    && diagnostics.everyStepDifferentiatedKinematicsAccepted
    && diagnostics.everyStepMechanicalCorrectedStageLedgerAccepted;
  return Object.freeze({
    completed: true,
    protocolId: PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_PROTOCOL_V1_ID,
    policyId: policy.policyId,
    slsMode,
    dtSec,
    durationSec: policy.durationSec,
    requestedStepCount,
    acceptedStepCount: steps.length,
    hiddenSubdivisionUsed: false,
    initialEndpoint,
    finalEndpoint: endpoint,
    steps: Object.freeze(steps),
    diagnostics,
    projectSyntheticShortHorizonRegressionAccepted,
    globalSemismoothJacobianAuditedAtEveryStep: true,
    constitutivePartialsIndependentlyValidated: false,
    wholeHeartBackwardEulerEnergyAcceptanceClaimed: false,
    acceptedColdInitializationClaimed: false,
    acceptedMaterialBranchClaimed: false,
    fullBeatAcceptanceClaimed: false,
    periodicAttractorClaimed: false,
    physiologicalValidationClaimed: false,
    phaseB1Acceptance: false,
    testReferenceOnly: true,
    releaseRuntimeReachable: false,
  });
}

export function evaluatePhaseB1ProjectSyntheticTimeStepConvergenceV1(
  slsMode: PhaseB1SlsModeV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ProjectSyntheticTimeStepConvergenceV1 {
  assertSupportedMode(slsMode);
  const policy = PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1;
  const runs = Object.freeze(policy.convergenceTimeStepsSec.map((dtSec) =>
    runPhaseB1ProjectSyntheticShortHorizonV1(
      slsMode,
      dtSec,
      sha256Hex,
    ))) as unknown as PhaseB1ProjectSyntheticTimeStepConvergenceV1["runs"];
  const allCompleted = runs.every((run) => run.completed);
  const nominalGridPreservedWithoutSubdivision = allCompleted
    && runs.every((run) => !run.hiddenSubdivisionUsed);
  let coarseToMediumScaledEndpointDifference: number | null = null;
  let mediumToFineScaledEndpointDifference: number | null = null;
  let observedStateOrder: number | null = null;
  let maximumBackwardEulerUnresolvedIncrementByTimeStepJ:
    readonly [number, number, number] | null = null;
  let backwardEulerUnresolvedIncrementObservedOrderCoarseToMedium:
    number | null = null;
  let backwardEulerUnresolvedIncrementObservedOrderMediumToFine:
    number | null = null;
  if (allCompleted) {
    const successful = runs as readonly [
      PhaseB1ProjectSyntheticShortHorizonSuccessV1,
      PhaseB1ProjectSyntheticShortHorizonSuccessV1,
      PhaseB1ProjectSyntheticShortHorizonSuccessV1,
    ];
    const registry = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
      slsMode,
      sha256Hex,
    ).model.newtonScaleRegistry;
    coarseToMediumScaledEndpointDifference =
      phaseB1ProjectSyntheticScaledEndpointDistanceV1(
        successful[0].finalEndpoint,
        successful[1].finalEndpoint,
        registry,
      );
    mediumToFineScaledEndpointDifference =
      phaseB1ProjectSyntheticScaledEndpointDistanceV1(
        successful[1].finalEndpoint,
        successful[2].finalEndpoint,
        registry,
      );
    observedStateOrder = observedHalvingOrder(
      coarseToMediumScaledEndpointDifference,
      mediumToFineScaledEndpointDifference,
    );
    maximumBackwardEulerUnresolvedIncrementByTimeStepJ = Object.freeze(
      successful.map((run) => run.diagnostics
        .maximumAbsoluteBackwardEulerUnresolvedEnergyIncrementJ),
    ) as unknown as readonly [number, number, number];
    backwardEulerUnresolvedIncrementObservedOrderCoarseToMedium =
      observedHalvingOrder(
        maximumBackwardEulerUnresolvedIncrementByTimeStepJ[0],
        maximumBackwardEulerUnresolvedIncrementByTimeStepJ[1],
      );
    backwardEulerUnresolvedIncrementObservedOrderMediumToFine =
      observedHalvingOrder(
        maximumBackwardEulerUnresolvedIncrementByTimeStepJ[1],
        maximumBackwardEulerUnresolvedIncrementByTimeStepJ[2],
      );
  }
  const projectSyntheticStateOrderRegressionAccepted =
    allCompleted
    && nominalGridPreservedWithoutSubdivision
    && runs.every((run) => run.completed
      && run.projectSyntheticShortHorizonRegressionAccepted)
    && observedStateOrder !== null
    && observedStateOrder
      >= policy.backwardEulerObservedStateOrderThreshold;
  return Object.freeze({
    protocolId:
      "phase-b1-project-synthetic-backward-euler-step-convergence-v1",
    policyId: policy.policyId,
    slsMode,
    durationSec: policy.durationSec,
    timeStepsSec: policy.convergenceTimeStepsSec,
    runs,
    allCompleted,
    nominalGridPreservedWithoutSubdivision,
    coarseToMediumScaledEndpointDifference,
    mediumToFineScaledEndpointDifference,
    observedStateOrder,
    backwardEulerObservedStateOrderThreshold:
      policy.backwardEulerObservedStateOrderThreshold,
    projectSyntheticStateOrderRegressionAccepted,
    maximumBackwardEulerUnresolvedIncrementByTimeStepJ,
    backwardEulerUnresolvedIncrementObservedOrderCoarseToMedium,
    backwardEulerUnresolvedIncrementObservedOrderMediumToFine,
    backwardEulerUnresolvedIncrementOrderDiagnosticOnly: true,
    wholeHeartBackwardEulerEnergyAcceptanceClaimed: false,
    phaseB1TimestepConvergenceAcceptanceClaimed: false,
    fullBeatAcceptanceClaimed: false,
    physiologicalValidationClaimed: false,
    phaseB1Acceptance: false,
    testReferenceOnly: true,
    releaseRuntimeReachable: false,
  });
}

export function phaseB1ProjectSyntheticScaledEndpointDistanceV1(
  left: PhaseB1EndpointStateV1,
  right: PhaseB1EndpointStateV1,
  registry: FourChamberNewtonScaleRegistryV1,
): number {
  if (left.differentialState.slsMode !== right.differentialState.slsMode) {
    throw new Error("cannot compare unlike Phase B1 SLS topologies");
  }
  if (left.timeSec !== right.timeSec) {
    throw new Error("Phase B1 convergence endpoints must share time");
  }
  const descriptor = buildPhaseB1ProjectSyntheticEndpointScaleDescriptorV1(
    left.differentialState.slsMode,
    registry,
  );
  const leftVector = [
    ...encodePhaseB1StoredDifferentialStateV1(left.differentialState),
    left.triSegCoordinates.V_m_S,
    left.triSegCoordinates.y_m,
  ];
  const rightVector = [
    ...encodePhaseB1StoredDifferentialStateV1(right.differentialState),
    right.triSegCoordinates.V_m_S,
    right.triSegCoordinates.y_m,
  ];
  const scaledDifferences = leftVector.map((value, index) =>
    Math.abs(value - rightVector[index]) / descriptor.endpointScales[index]);
  return Math.max(...scaledDifferences);
}

export function buildPhaseB1ProjectSyntheticEndpointScaleDescriptorV1(
  slsMode: PhaseB1SlsModeV1,
  registry: FourChamberNewtonScaleRegistryV1,
): PhaseB1ProjectSyntheticEndpointScaleDescriptorV1 {
  assertSupportedMode(slsMode);
  if (!registry.fixedBeforeRun || registry.adaptiveRescaling) {
    throw new Error("Phase B1 endpoint scales require a fixed scale registry");
  }
  const endpointScales: number[] = [
    ...BLOOD_COMPARTMENT_IDS.map((id) =>
      registry.unknownScales.bloodVolumeM3[id]),
    ...INERTIAL_FLOW_IDS.map(() =>
      registry.unknownScales.inertialFlowM3PerSec),
  ];
  for (const wallId of WALL_IDS) {
    endpointScales.push(
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.landDistortionByWall[wallId],
      registry.unknownScales.landDistortionByWall[wallId],
    );
    if (slsMode === "on") {
      endpointScales.push(registry.unknownScales.slsViscousStrain);
    }
  }
  endpointScales.push(
    registry.unknownScales.septalMidwallVolumeM3,
    registry.unknownScales.junctionRadiusM,
  );
  const endpointLabels = [
    ...buildPhaseB1StoredDifferentialLabelsV1(slsMode),
    "algebraic.triseg.V_m_S",
    "algebraic.triseg.y_m",
  ];
  const storedDifferentialStateCount = slsMode === "on" ? 59 : 54;
  if (
    endpointLabels.length !== storedDifferentialStateCount + 2
    || endpointScales.length !== endpointLabels.length
    || endpointScales.some((scale) => !Number.isFinite(scale) || scale <= 0)
  ) throw new Error("Phase B1 endpoint scale descriptor topology drifted");
  return Object.freeze({
    schemaId: "phase-b1-project-synthetic-endpoint-scale-descriptor-v1",
    slsMode,
    sourceNewtonScaleRegistryContentSha256:
      registry.registryContentSha256,
    sourceRegistryFixedBeforeRun: true,
    sourceRegistryAdaptiveRescaling: false,
    norm: "scaled-infinity-norm",
    storedDifferentialStateCount,
    triSegAlgebraicStateCount: 2,
    endpointLabels: Object.freeze(endpointLabels),
    endpointScales: Object.freeze(endpointScales),
  });
}

function summarizeRunDiagnostics(
  steps: readonly PhaseB1ProjectSyntheticShortHorizonStepEvidenceV1[],
  initialEndpoint: PhaseB1EndpointStateV1,
  registry: FourChamberNewtonScaleRegistryV1,
): PhaseB1ProjectSyntheticShortHorizonSuccessV1["diagnostics"] {
  if (steps.length === 0) throw new Error("short-horizon run has no steps");
  const cumulativeSignedBackwardEulerUnresolvedEnergyIncrementJ = steps.reduce(
    (sum, step) => sum + step.mechanicalEnergyAudit.backwardEulerDiagnostic
      .signedUnresolvedEnergyIncrementJ,
    0,
  );
  const cumulativeBackwardEulerDiagnosticDenominatorJ = steps.reduce(
    (sum, step) => sum + step.mechanicalEnergyAudit.backwardEulerDiagnostic
      .normalizationDenominatorJ,
    0,
  );
  const initialTotalBloodVolumeM3 = totalBloodVolumeM3(initialEndpoint);
  return Object.freeze({
    maximumAbsoluteTotalBloodVolumeResidualFromInitialM3: maximum(
      steps,
      (step) => Math.max(
        Math.abs(
          totalBloodVolumeM3(
            step.transaction.leftLimitStep.nextEndpointLeftLimit,
          ) - initialTotalBloodVolumeM3,
        ),
        Math.abs(
          totalBloodVolumeM3(step.transaction.nextEndpoint)
          - initialTotalBloodVolumeM3,
        ),
      ),
    ),
    maximumAbsolutePerStepTotalBloodVolumeChangeM3: maximum(steps, (step) =>
      Math.abs(step.transaction.leftLimitStep.totalBloodVolumeChangeM3)),
    maximumScaledResidualInfinityNorm: maximum(steps, (step) =>
      step.transaction.leftLimitStep.newtonDiagnostics
        .finalResidualInfinityNorm ?? Number.POSITIVE_INFINITY),
    minimumLandSimplexMargin: minimum(steps, (step) =>
      step.transaction.leftLimitStep.minimumLandSimplexMargin),
    maximumDifferentiatedTriSegConstraintResidualNPerMSec: maximum(
      steps,
      (step) => step.mechanicalEnergyAudit.kinematics
        .differentiatedConstraintResidualNPerMSec.infinityNorm,
    ),
    maximumSlsIdentityRho: maximum(steps, (step) =>
      step.slsAudit.normalizedIdentityResidual),
    maximumLandAdapterWorkRelativeResidual: maximum(steps, (step) =>
      step.mechanicalEnergyAudit.landAdapterWorkClosure
        .maximumRelativeResidual),
    maximumCorrectedStageLedgerRho: maximum(steps, (step) =>
      step.mechanicalEnergyAudit.stage.normalizedResidual),
    minimumFlowDissipationW: minimum(steps, (step) =>
      step.mechanicalEnergyAudit.dissipationByBranchW.flowTotal),
    minimumSlsDissipationW: minimum(steps, (step) =>
      step.mechanicalEnergyAudit.dissipationByBranchW.sls),
    maximumTriSegScaledCoordinateStepDistance: maximum(steps, (step) =>
      triSegScaledDistance(
        step.transaction.previousEndpoint,
        step.transaction.nextEndpoint,
        registry,
      )),
    totalEndpointEventCount: steps.reduce(
      (sum, step) => sum + step.transaction.coordinator.eventCount,
      0,
    ),
    totalPostEventTriSegReinitializationCount: steps.reduce(
      (sum, step) => sum
        + step.transaction.algebraicReinitializationCallCount,
      0,
    ),
    maximumAbsoluteBackwardEulerUnresolvedEnergyIncrementJ: maximum(
      steps,
      (step) => Math.abs(step.mechanicalEnergyAudit.backwardEulerDiagnostic
        .signedUnresolvedEnergyIncrementJ),
    ),
    cumulativeSignedBackwardEulerUnresolvedEnergyIncrementJ,
    cumulativeBackwardEulerDiagnosticDenominatorJ,
    cumulativeBackwardEulerDiagnosticRho:
      Math.abs(cumulativeSignedBackwardEulerUnresolvedEnergyIncrementJ)
      / cumulativeBackwardEulerDiagnosticDenominatorJ,
    everyStepProjectionFree: steps.every((step) =>
      !step.transaction.projectionApplied
      && !step.transaction.leftLimitStep.projectionApplied),
    everyStepHiddenStateClippingFree: steps.every((step) =>
      !step.transaction.hiddenStateClippingApplied
      && !step.transaction.leftLimitStep.hiddenStateClippingApplied),
    everyStepFlowClampFree: steps.every((step) =>
      !step.transaction.leftLimitStep.flowClampApplied),
    everyStepSlsIdentityAccepted: steps.every((step) =>
      step.slsAudit.normalizedIdentityAccepted),
    everyStepLandAdapterWorkClosureAccepted: steps.every((step) =>
      step.mechanicalEnergyAudit.landAdapterWorkClosure.accepted),
    everyStepGlobalSemismoothJacobianAuditAccepted: steps.every((step) =>
      step.mechanicalEnergyAudit.kinematics.globalJacobianAudit.accepted),
    everyStepDifferentiatedKinematicsAccepted: steps.every((step) =>
      step.mechanicalEnergyAudit.kinematics.accepted),
    everyStepMechanicalCorrectedStageLedgerAccepted: steps.every((step) =>
      step.mechanicalEnergyAudit.correctedStageLedgerAccepted
      && step.mechanicalEnergyAudit.stage.correctedStageLedgerAccepted),
  });
}

function eventsAtEndTime(
  endTimeSec: number,
): readonly PhaseB1WallCalciumDriveEventV1[] {
  const event = PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1
    .endpointEvent;
  if (endTimeSec !== event.calciumDriveTimeSec) return Object.freeze([]);
  return Object.freeze([Object.freeze({ ...event })]);
}

function triSegScaledDistance(
  left: PhaseB1EndpointStateV1,
  right: PhaseB1EndpointStateV1,
  registry: FourChamberNewtonScaleRegistryV1,
): number {
  return Math.max(
    Math.abs(left.triSegCoordinates.V_m_S - right.triSegCoordinates.V_m_S)
      / registry.unknownScales.septalMidwallVolumeM3,
    Math.abs(left.triSegCoordinates.y_m - right.triSegCoordinates.y_m)
      / registry.unknownScales.junctionRadiusM,
  );
}

function totalBloodVolumeM3(endpoint: PhaseB1EndpointStateV1): number {
  return BLOOD_COMPARTMENT_IDS.reduce(
    (sum, id) => sum + endpoint.differentialState.bloodVolumesM3[id],
    0,
  );
}

function maximum<T>(
  values: readonly T[],
  select: (value: T) => number,
): number {
  return Math.max(...values.map(select));
}

function minimum<T>(
  values: readonly T[],
  select: (value: T) => number,
): number {
  return Math.min(...values.map(select));
}

function observedHalvingOrder(coarse: number, fine: number): number | null {
  if (!(coarse > 0) || !(fine > 0)) return null;
  const order = Math.log2(coarse / fine);
  return Number.isFinite(order) ? order : null;
}

function assertSupportedMode(mode: PhaseB1SlsModeV1): void {
  if (!PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1
    .slsModes.includes(mode)) {
    throw new Error("Phase B1 short-horizon slsMode must be on or off");
  }
}

function requireSupportedTimeStep(dtSec: number): void {
  if (
    !Number.isFinite(dtSec)
    || !PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1
      .convergenceTimeStepsSec.includes(dtSec as 0.0005)
  ) throw new Error("unsupported Phase B1 short-horizon time step");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
