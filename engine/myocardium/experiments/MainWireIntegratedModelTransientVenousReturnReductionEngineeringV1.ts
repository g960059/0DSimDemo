import {
  checkpointMainWireIntegratedModelV3,
  restoreMainWireIntegratedModelV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  sampleMainWireIntegratedModelBeatFromAcceptedStepV3,
  type MainWireIntegratedModelAcceptedBeatSampleV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  evaluateMainWireIntegratedModelCalciumDriveV3,
  limitMainWireIntegratedModelCandidateTimeV3,
  stepMainWireIntegratedModelV3,
  type MainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedModelStepInputV3,
  type MainWireIntegratedModelStepResultV3,
  type MainWireIntegratedModelStepSuccessV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import type { MainWireNormalAdultFiveWallMechanicsStateV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLASSIFIER_V3_ID } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_V3_ID } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V3_ID,
  createMainWireIntegratedModelPeriodicConditionIdentityPayloadEngineeringV1,
  createMainWireIntegratedModelPeriodicProtocolIdentityPayloadV3,
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  runMainWireIntegratedModelPeriodicSteadyV3,
  type MainWireIntegratedModelPeriodicSteadyResultV3,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_DECLARATION_V1,
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_ENGINEERING_V1_ID,
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_NEGATIVE_CLAIMS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_SHA256_V1,
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_V1,
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_REPORT_V1_ID,
  type MainWireIntegratedModelTransientVenousReturnReductionFailureClassV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionDefinitionV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_RAW_PROJECTION_AUDITOR_V1_ID,
  auditMainWireIntegratedModelTransientPvRawProjectionV1,
  auditMainWireIntegratedModelTransientPvComparisonV1,
  compareMainWireIntegratedModelTransientPvRelationsV1,
  mainWireIntegratedModelTransientVenousReturnBeatPhaseV1,
  mainWireIntegratedModelTransientVenousReturnResistanceScaleV1,
  projectMainWireIntegratedModelTransientPvBeatFamilyV1,
  type MainWireIntegratedModelTransientPvAcceptedSampleV1,
  type MainWireIntegratedModelTransientPvComparisonAuditV1,
  type MainWireIntegratedModelTransientPvComparisonV1,
  type MainWireIntegratedModelTransientPvRawProjectionAuditV1,
  type MainWireIntegratedModelTransientPvRawBeatV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionPureV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_COMMITTED_IMPLEMENTATION_COMMIT_SHA_V1 =
  "a9fb20b281912ca72712ca08e68ef370989527b2" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_COMMITTED_PAYLOAD_SHA256_V1 =
  "2a851337ed35fb0858209c64a883002a9834c59f7db0236c9a2b0a97b655b5bb" as const;

export type MainWireIntegratedModelTransientVenousReturnReductionSanitizedExceptionV1 =
  Readonly<{
    name: string;
    message: string;
  }>;

export type MainWireIntegratedModelTransientVenousReturnReductionSourceClassifierInputV1 =
  Readonly<{
    cycleIndex: number;
    evidenceRole: MainWireIntegratedModelPeriodicSteadyResultV3["observations"][number]["evidenceRole"];
    protocolIdentityHash: string;
    period1MaximumNormalizedDelta: number;
    period2MaximumNormalizedDelta: number | null;
  }>;

export type MainWireIntegratedModelTransientVenousReturnReductionSourceSummaryV1 =
  Readonly<{
    experimentId: MainWireIntegratedModelPeriodicSteadyResultV3["experimentId"];
    executionPurpose: MainWireIntegratedModelPeriodicSteadyResultV3["executionPurpose"];
    nominalDtSec: number;
    requestedMaximumCycleCount: number;
    completedCycleCount: number;
    terminationReason: MainWireIntegratedModelPeriodicSteadyResultV3["terminationReason"];
    classification: MainWireIntegratedModelPeriodicSteadyResultV3["classification"];
    numericalPeriod1Established: boolean;
    allCyclesFiniteConservedAndEventExact: boolean;
    modelConditionIdentityHash: string;
    protocolIdentityHash: string;
    terminalCheckpointSha256: string;
    terminalCheckpointExactRoundTripVerified: boolean;
    terminalAcceptedTimeSec: number;
    terminalAcceptedRevision: number;
    terminalCycleIndex: number;
    period1ClassifierInputs: readonly MainWireIntegratedModelTransientVenousReturnReductionSourceClassifierInputV1[];
    terminalPeriod1Closure: MainWireIntegratedModelPeriodicSteadyResultV3["cycles"][number]["period1"];
    internallyOwnedSourceExecution: true;
    canonicalSourceAuthenticationEstablished: false;
    historicalQualificationTransferred: false;
  }>;

export type MainWireIntegratedModelTransientVenousReturnReductionSourceBindingDiagnosticsV1 =
  Readonly<{
    conditionIdentityMatched: boolean;
    protocolIdentityMatched: boolean;
    checkpointIdentityFormatValid: boolean;
    restoreAttempted: boolean;
    roundTripCheckpointSha256: string | null;
    restoredAcceptedTimeSec: number | null;
    restoredAcceptedRevision: number | null;
    restoredCoronaryWindowIndex: number | null;
    restoreException: MainWireIntegratedModelTransientVenousReturnReductionSanitizedExceptionV1 | null;
    checkpointExactRestoreMatched: boolean;
    sourceBindingsMatched: boolean;
  }>;

export type MainWireIntegratedModelTransientVenousReturnReductionSourceOutcomeV1 =
  | Readonly<{
      status: "source-p1-established";
      failureClass: null;
      summary: MainWireIntegratedModelTransientVenousReturnReductionSourceSummaryV1;
      bindingDiagnostics: MainWireIntegratedModelTransientVenousReturnReductionSourceBindingDiagnosticsV1;
      exception: null;
    }>
  | Readonly<{
      status: "source-rejected";
      failureClass: "source-not-p1" | "source-binding-failure";
      summary: MainWireIntegratedModelTransientVenousReturnReductionSourceSummaryV1;
      bindingDiagnostics: MainWireIntegratedModelTransientVenousReturnReductionSourceBindingDiagnosticsV1 | null;
      exception: null;
    }>
  | Readonly<{
      status: "source-execution-failed";
      failureClass: "source-execution-failure";
      summary: null;
      bindingDiagnostics: null;
      exception: MainWireIntegratedModelTransientVenousReturnReductionSanitizedExceptionV1;
    }>;

export type MainWireIntegratedModelTransientVenousReturnReductionBeatExecutionV1 =
  Readonly<{
    beatOrdinal: number;
    phase: ReturnType<
      typeof mainWireIntegratedModelTransientVenousReturnBeatPhaseV1
    >;
    startTimeSec: number;
    endTimeSec: number;
    startAcceptedRevision: number;
    terminalAcceptedRevision: number;
    acceptedStepCount: number;
    boundaryClippedStepCount: number;
    resistanceScale: Readonly<{
      start: number;
      midpoint: number;
      end: number;
      minimumAcceptedCandidate: number;
      maximumAcceptedCandidate: number;
    }>;
    fixedGlobalTotalBloodVolumeMl: number;
    maximumGlobalTotalBloodVolumeErrorMl: number;
    maximumCoronaryBloodVolumeLedgerResidualMl: number;
    maximumDynamicMcsConservationResidualMlPerSec: number;
    acceptedAtrialCaptureIds: readonly string[];
    acceptedVentricularCaptureIds: readonly string[];
    deliveredCalciumDepositIds: readonly string[];
    completedCoronaryWindowIndices: readonly number[];
    oneComposedCalciumOwnerOnly: boolean;
    allDynamicMcsAcceptedFlowsExactlyZero: boolean;
    allRawValuesFinite: boolean;
    minimumSystemicVenousReturnMlPerSec: number;
    maximumSystemicVenousReturnMlPerSec: number;
    integrityPassed: boolean;
    rawAcceptedSampleCount: number;
    rawAcceptedSamplesSha256: string;
  }>;

export type MainWireIntegratedModelTransientVenousReturnReductionFailureEvidenceV1 =
  Readonly<{
    failureClass: MainWireIntegratedModelTransientVenousReturnReductionFailureClassV1;
    failedBeatOrdinal: number | null;
    lastAcceptedTimeSec: number | null;
    lastAcceptedRevision: number | null;
    failedCandidateTimeSec: number | null;
    failedCandidateResistanceScale: number | null;
    completedBeatCount: number;
    message: string;
    exception: MainWireIntegratedModelTransientVenousReturnReductionSanitizedExceptionV1 | null;
  }>;

export type MainWireIntegratedModelTransientVenousReturnReductionAssessmentV1 =
  Readonly<{
    sourceP1Established: boolean;
    sourceBindingsReplayed: boolean;
    exactSequentialBeatSetRetained: boolean;
    allTwentyOneBeatsCompleted: boolean;
    allBeatIntegrityGatesPassed: boolean;
    rawProjectionProducerReplayPassed: boolean;
    compactLoopAndLandmarkProjectionCompleted: boolean;
    relationAndHysteresisIndependentReplayPassed: boolean;
    transientVenousReturnReductionCharacterizationCompleted: boolean;
    firstFailureClass: MainWireIntegratedModelTransientVenousReturnReductionFailureClassV1 | null;
    methodAgreementIsQualificationGate: false;
    positiveSlopeIsQualificationGate: false;
    hysteresisMagnitudeIsQualificationGate: false;
  }>;

export type MainWireIntegratedModelTransientVenousReturnReductionPayloadV1 =
  Readonly<{
    reportSchemaId: typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_REPORT_V1_ID;
    characterizationOwnerId: typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_ENGINEERING_V1_ID;
    declaration: typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_DECLARATION_V1;
    implementationCommitSha: string;
    protocolPayload: typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_V1;
    protocolPayloadSha256: string;
    sourceOutcome: MainWireIntegratedModelTransientVenousReturnReductionSourceOutcomeV1;
    beatExecutions: readonly MainWireIntegratedModelTransientVenousReturnReductionBeatExecutionV1[];
    producerProjectionAudit: MainWireIntegratedModelTransientPvRawProjectionAuditV1 | null;
    comparison: MainWireIntegratedModelTransientPvComparisonV1 | null;
    comparisonAudit: MainWireIntegratedModelTransientPvComparisonAuditV1 | null;
    failureEvidence: MainWireIntegratedModelTransientVenousReturnReductionFailureEvidenceV1 | null;
    assessment: MainWireIntegratedModelTransientVenousReturnReductionAssessmentV1;
    negativeClaims: typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_NEGATIVE_CLAIMS_V1;
  }>;

export type MainWireIntegratedModelTransientVenousReturnReductionReportV1 =
  Readonly<{
    payload: MainWireIntegratedModelTransientVenousReturnReductionPayloadV1;
    payloadSha256: string;
  }>;

export type MainWireIntegratedModelTransientVenousReturnReductionReportAuditV1 =
  Readonly<{
    status: "report-audit-passed" | "report-audit-failed";
    firstMismatchPath: string | null;
    reportShapePassed: boolean;
    protocolBindingPassed: boolean;
    sourceOutcomeShapePassed: boolean;
    sourceIdentityReplayPassed: boolean;
    beatExecutionReplayPassed: boolean;
    producerProjectionAuditReplayPassed: boolean;
    comparisonReplayPassed: boolean;
    failureOutcomeReplayPassed: boolean;
    assessmentReplayPassed: boolean;
    negativeClaimsPassed: boolean;
    payloadHashPassed: boolean;
  }>;

type WallStateV1 = MainWireNormalAdultFiveWallMechanicsStateV1;
type AcceptedStateV1 = MainWireIntegratedModelAcceptedStateV3<WallStateV1>;
type SuccessfulStepV1 = MainWireIntegratedModelStepSuccessV3<WallStateV1>;

type CompletedTrajectoryV1 = Readonly<{
  beatExecutions: readonly MainWireIntegratedModelTransientVenousReturnReductionBeatExecutionV1[];
  rawBeats: readonly MainWireIntegratedModelTransientPvRawBeatV1[];
  terminalAcceptedTimeSec: number;
  terminalAcceptedRevision: number;
}>;

type FailedTrajectoryV1 = Readonly<{
  beatExecutions: readonly MainWireIntegratedModelTransientVenousReturnReductionBeatExecutionV1[];
  rawBeats: readonly MainWireIntegratedModelTransientPvRawBeatV1[];
  failureEvidence: MainWireIntegratedModelTransientVenousReturnReductionFailureEvidenceV1;
}>;

export type MainWireIntegratedModelTransientVenousReturnResearchTrajectoryV1 =
  | Readonly<{
      status: "completed";
      sourceOutcome: Extract<
        MainWireIntegratedModelTransientVenousReturnReductionSourceOutcomeV1,
        { status: "source-p1-established" }
      >;
      beatExecutions: readonly MainWireIntegratedModelTransientVenousReturnReductionBeatExecutionV1[];
      rawBeats: readonly MainWireIntegratedModelTransientPvRawBeatV1[];
      terminalAcceptedTimeSec: number;
      terminalAcceptedRevision: number;
      failureEvidence: null;
    }>
  | Readonly<{
      status: "failed";
      sourceOutcome: MainWireIntegratedModelTransientVenousReturnReductionSourceOutcomeV1;
      beatExecutions: readonly MainWireIntegratedModelTransientVenousReturnReductionBeatExecutionV1[];
      rawBeats: readonly MainWireIntegratedModelTransientPvRawBeatV1[];
      terminalAcceptedTimeSec: null;
      terminalAcceptedRevision: null;
      failureEvidence: MainWireIntegratedModelTransientVenousReturnReductionFailureEvidenceV1;
    }>;

export type MainWireIntegratedModelTransientVenousReturnReductionManufacturedDependenciesV1 =
  Readonly<{
    runSource: () => Promise<MainWireIntegratedModelPeriodicSteadyResultV3>;
    createFixture: typeof createMainWireIntegratedModelRegularSinusAllOffFixtureV3;
    bindAndRestoreSource: typeof bindAndRestoreSourceV1;
    runTransientTrajectory: typeof runTransientTrajectoryV1;
    projectBeatFamily: typeof projectMainWireIntegratedModelTransientPvBeatFamilyV1;
    auditRawProjection: typeof auditMainWireIntegratedModelTransientPvRawProjectionV1;
    compareRelations: typeof compareMainWireIntegratedModelTransientPvRelationsV1;
    auditComparison: typeof auditMainWireIntegratedModelTransientPvComparisonV1;
  }>;

const OFFICIAL_TRANSIENT_VENOUS_RETURN_REDUCTION_DEPENDENCIES_V1 =
  Object.freeze({
    runSource: () =>
      runMainWireIntegratedModelPeriodicSteadyV3({
        nominalDtSec: 0.001,
        maximumCycleCount: 250,
        executionPurpose: "canonical-evidence",
      }),
    createFixture: createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
    bindAndRestoreSource: bindAndRestoreSourceV1,
    runTransientTrajectory: runTransientTrajectoryV1,
    projectBeatFamily: projectMainWireIntegratedModelTransientPvBeatFamilyV1,
    auditRawProjection: auditMainWireIntegratedModelTransientPvRawProjectionV1,
    compareRelations: compareMainWireIntegratedModelTransientPvRelationsV1,
    auditComparison: auditMainWireIntegratedModelTransientPvComparisonV1,
  }) satisfies MainWireIntegratedModelTransientVenousReturnReductionManufacturedDependenciesV1;

/**
 * The sole preregistered Engineering execution entry point. It accepts no
 * fixture, source, checkpoint, intervention, numerical option, method list,
 * or output path.
 */
export async function runMainWireIntegratedModelTransientVenousReturnReductionEngineeringV1(
  input: Readonly<{ implementationCommitSha: string }>,
): Promise<MainWireIntegratedModelTransientVenousReturnReductionReportV1> {
  return runMainWireIntegratedModelTransientVenousReturnReductionWithDependenciesV1(
    input,
    OFFICIAL_TRANSIENT_VENOUS_RETURN_REDUCTION_DEPENDENCIES_V1,
  );
}

/**
 * Research-only access to the already-owned source and accepted trajectory.
 * It exposes raw beats in memory so downstream exploratory analyses do not
 * need to copy the model loop or promote an incomplete V1 report.
 */
export async function runMainWireIntegratedModelTransientVenousReturnResearchTrajectoryV1(): Promise<MainWireIntegratedModelTransientVenousReturnResearchTrajectoryV1> {
  const failed = (
    sourceOutcome: MainWireIntegratedModelTransientVenousReturnReductionSourceOutcomeV1,
    beatExecutions: readonly MainWireIntegratedModelTransientVenousReturnReductionBeatExecutionV1[],
    rawBeats: readonly MainWireIntegratedModelTransientPvRawBeatV1[],
    failureEvidence: MainWireIntegratedModelTransientVenousReturnReductionFailureEvidenceV1,
  ): MainWireIntegratedModelTransientVenousReturnResearchTrajectoryV1 =>
    Object.freeze({
      status: "failed" as const,
      sourceOutcome,
      beatExecutions: Object.freeze([...beatExecutions]),
      rawBeats: Object.freeze([...rawBeats]),
      terminalAcceptedTimeSec: null,
      terminalAcceptedRevision: null,
      failureEvidence,
    });

  let source: MainWireIntegratedModelPeriodicSteadyResultV3;
  try {
    source =
      await OFFICIAL_TRANSIENT_VENOUS_RETURN_REDUCTION_DEPENDENCIES_V1.runSource();
  } catch (error) {
    const exception = sanitizeExceptionV1(error);
    return failed(
      Object.freeze({
        status: "source-execution-failed" as const,
        failureClass: "source-execution-failure" as const,
        summary: null,
        bindingDiagnostics: null,
        exception,
      }),
      Object.freeze([]),
      Object.freeze([]),
      failureEvidenceV1({
        failureClass: "source-execution-failure",
        message: "canonical source execution failed",
        exception,
      }),
    );
  }

  let summary: MainWireIntegratedModelTransientVenousReturnReductionSourceSummaryV1;
  try {
    summary = sourceSummaryV1(source);
  } catch (error) {
    const exception = sanitizeExceptionV1(error);
    return failed(
      Object.freeze({
        status: "source-execution-failed" as const,
        failureClass: "source-execution-failure" as const,
        summary: null,
        bindingDiagnostics: null,
        exception,
      }),
      Object.freeze([]),
      Object.freeze([]),
      failureEvidenceV1({
        failureClass: "source-execution-failure",
        message: "canonical source summary construction failed",
        exception,
      }),
    );
  }
  if (!sourceIsP1V1(source)) {
    return failed(
      Object.freeze({
        status: "source-rejected" as const,
        failureClass: "source-not-p1" as const,
        summary,
        bindingDiagnostics: null,
        exception: null,
      }),
      Object.freeze([]),
      Object.freeze([]),
      failureEvidenceV1({
        failureClass: "source-not-p1",
        message: "canonical source did not establish numerical period 1",
      }),
    );
  }

  const fixture =
    OFFICIAL_TRANSIENT_VENOUS_RETURN_REDUCTION_DEPENDENCIES_V1.createFixture();
  const binding =
    await OFFICIAL_TRANSIENT_VENOUS_RETURN_REDUCTION_DEPENDENCIES_V1.bindAndRestoreSource(
      source,
      fixture,
    );
  if (binding.status === "binding-failed") {
    return failed(
      Object.freeze({
        status: "source-rejected" as const,
        failureClass: "source-binding-failure" as const,
        summary,
        bindingDiagnostics: binding.diagnostics,
        exception: null,
      }),
      Object.freeze([]),
      Object.freeze([]),
      failureEvidenceV1({
        failureClass: "source-binding-failure",
        message: binding.message,
      }),
    );
  }

  const sourceOutcome = Object.freeze({
    status: "source-p1-established" as const,
    failureClass: null,
    summary,
    bindingDiagnostics: binding.diagnostics,
    exception: null,
  });
  const trajectory =
    await OFFICIAL_TRANSIENT_VENOUS_RETURN_REDUCTION_DEPENDENCIES_V1.runTransientTrajectory(
      fixture,
      binding.restoredState,
      source,
    );
  if ("failureEvidence" in trajectory) {
    return failed(
      sourceOutcome,
      trajectory.beatExecutions,
      trajectory.rawBeats,
      trajectory.failureEvidence,
    );
  }
  return Object.freeze({
    status: "completed" as const,
    sourceOutcome,
    beatExecutions: trajectory.beatExecutions,
    rawBeats: trajectory.rawBeats,
    terminalAcceptedTimeSec: trajectory.terminalAcceptedTimeSec,
    terminalAcceptedRevision: trajectory.terminalAcceptedRevision,
    failureEvidence: null,
  });
}

/**
 * Dependency-injected pre-target verification seam. Its wrapper is explicitly
 * manufactured and cannot be used by the fixed CLI or mint qualification.
 */
export async function runMainWireIntegratedModelTransientVenousReturnReductionManufacturedV1(
  input: Readonly<{
    implementationCommitSha: string;
    dependencies: MainWireIntegratedModelTransientVenousReturnReductionManufacturedDependenciesV1;
  }>,
): Promise<
  Readonly<{
    qualificationScope: "manufactured-non-qualified";
    fixedOwnerArtifactEligible: false;
    report: MainWireIntegratedModelTransientVenousReturnReductionReportV1;
  }>
> {
  return Object.freeze({
    qualificationScope: "manufactured-non-qualified" as const,
    fixedOwnerArtifactEligible: false as const,
    report:
      await runMainWireIntegratedModelTransientVenousReturnReductionWithDependenciesV1(
        { implementationCommitSha: input.implementationCommitSha },
        input.dependencies,
      ),
  });
}

async function runMainWireIntegratedModelTransientVenousReturnReductionWithDependenciesV1(
  input: Readonly<{ implementationCommitSha: string }>,
  dependencies: MainWireIntegratedModelTransientVenousReturnReductionManufacturedDependenciesV1,
): Promise<MainWireIntegratedModelTransientVenousReturnReductionReportV1> {
  if (!/^[0-9a-f]{40}$/.test(input.implementationCommitSha)) {
    throw new Error("transient characterization implementation SHA is invalid");
  }
  const seal = (evidence: Parameters<typeof sealReportV1>[1]) =>
    sealReportV1(input.implementationCommitSha, evidence);
  let source: MainWireIntegratedModelPeriodicSteadyResultV3;
  try {
    source = await dependencies.runSource();
  } catch (error) {
    return seal({
      sourceOutcome: Object.freeze({
        status: "source-execution-failed" as const,
        failureClass: "source-execution-failure" as const,
        summary: null,
        bindingDiagnostics: null,
        exception: sanitizeExceptionV1(error),
      }),
      beatExecutions: Object.freeze([]),
      producerProjectionAudit: null,
      comparison: null,
      comparisonAudit: null,
      failureEvidence: failureEvidenceV1({
        failureClass: "source-execution-failure",
        message: "canonical source execution failed",
        exception: sanitizeExceptionV1(error),
      }),
    });
  }

  let sourceSummary: MainWireIntegratedModelTransientVenousReturnReductionSourceSummaryV1;
  try {
    sourceSummary = sourceSummaryV1(source);
  } catch (error) {
    return seal({
      sourceOutcome: Object.freeze({
        status: "source-execution-failed" as const,
        failureClass: "source-execution-failure" as const,
        summary: null,
        bindingDiagnostics: null,
        exception: sanitizeExceptionV1(error),
      }),
      beatExecutions: Object.freeze([]),
      producerProjectionAudit: null,
      comparison: null,
      comparisonAudit: null,
      failureEvidence: failureEvidenceV1({
        failureClass: "source-execution-failure",
        message: "canonical source summary construction failed",
        exception: sanitizeExceptionV1(error),
      }),
    });
  }
  if (!sourceIsP1V1(source)) {
    return seal({
      sourceOutcome: Object.freeze({
        status: "source-rejected" as const,
        failureClass: "source-not-p1" as const,
        summary: sourceSummary,
        bindingDiagnostics: null,
        exception: null,
      }),
      beatExecutions: Object.freeze([]),
      producerProjectionAudit: null,
      comparison: null,
      comparisonAudit: null,
      failureEvidence: failureEvidenceV1({
        failureClass: "source-not-p1",
        message: "canonical source did not establish numerical period 1",
      }),
    });
  }

  const fixture = dependencies.createFixture();
  const binding = await dependencies.bindAndRestoreSource(source, fixture);
  if (binding.status === "binding-failed") {
    return seal({
      sourceOutcome: Object.freeze({
        status: "source-rejected" as const,
        failureClass: "source-binding-failure" as const,
        summary: sourceSummary,
        bindingDiagnostics: binding.diagnostics,
        exception: null,
      }),
      beatExecutions: Object.freeze([]),
      producerProjectionAudit: null,
      comparison: null,
      comparisonAudit: null,
      failureEvidence: failureEvidenceV1({
        failureClass: "source-binding-failure",
        message: binding.message,
      }),
    });
  }

  const sourceOutcome = Object.freeze({
    status: "source-p1-established" as const,
    failureClass: null,
    summary: sourceSummary,
    bindingDiagnostics: binding.diagnostics,
    exception: null,
  });
  const trajectory = await dependencies.runTransientTrajectory(
    fixture,
    binding.restoredState,
    source,
  );
  if ("failureEvidence" in trajectory) {
    return seal({
      sourceOutcome,
      beatExecutions: trajectory.beatExecutions,
      producerProjectionAudit: null,
      comparison: null,
      comparisonAudit: null,
      failureEvidence: trajectory.failureEvidence,
    });
  }

  let projections: Awaited<
    ReturnType<typeof projectMainWireIntegratedModelTransientPvBeatFamilyV1>
  >;
  try {
    projections = await dependencies.projectBeatFamily(trajectory.rawBeats);
  } catch (error) {
    return seal({
      sourceOutcome,
      beatExecutions: trajectory.beatExecutions,
      producerProjectionAudit: null,
      comparison: null,
      comparisonAudit: null,
      failureEvidence: failureEvidenceV1({
        failureClass: "landmark-unavailable",
        failedBeatOrdinal: 21,
        lastAcceptedTimeSec: trajectory.terminalAcceptedTimeSec,
        lastAcceptedRevision: trajectory.terminalAcceptedRevision,
        completedBeatCount: trajectory.beatExecutions.length,
        message: "transient PV landmark construction failed",
        exception: sanitizeExceptionV1(error),
      }),
    });
  }
  let producerProjectionAudit: MainWireIntegratedModelTransientPvRawProjectionAuditV1;
  try {
    producerProjectionAudit = await dependencies.auditRawProjection(
      trajectory.rawBeats,
      projections,
    );
  } catch (error) {
    return seal({
      sourceOutcome,
      beatExecutions: trajectory.beatExecutions,
      producerProjectionAudit: null,
      comparison: null,
      comparisonAudit: null,
      failureEvidence: failureEvidenceV1({
        failureClass: "landmark-unavailable",
        failedBeatOrdinal: 21,
        lastAcceptedTimeSec: trajectory.terminalAcceptedTimeSec,
        lastAcceptedRevision: trajectory.terminalAcceptedRevision,
        completedBeatCount: trajectory.beatExecutions.length,
        message: "transient raw-to-projection auditor threw",
        exception: sanitizeExceptionV1(error),
      }),
    });
  }
  if (producerProjectionAudit.status !== "raw-projection-audit-passed") {
    return seal({
      sourceOutcome,
      beatExecutions: trajectory.beatExecutions,
      producerProjectionAudit,
      comparison: null,
      comparisonAudit: null,
      failureEvidence: failureEvidenceV1({
        failureClass: "landmark-unavailable",
        failedBeatOrdinal: 21,
        lastAcceptedTimeSec: trajectory.terminalAcceptedTimeSec,
        lastAcceptedRevision: trajectory.terminalAcceptedRevision,
        completedBeatCount: trajectory.beatExecutions.length,
        message:
          producerProjectionAudit.firstMismatchPath ??
          "transient raw-to-projection audit failed",
      }),
    });
  }
  let comparison: MainWireIntegratedModelTransientPvComparisonV1;
  try {
    comparison = await dependencies.compareRelations(projections);
  } catch (error) {
    return seal({
      sourceOutcome,
      beatExecutions: trajectory.beatExecutions,
      producerProjectionAudit,
      comparison: null,
      comparisonAudit: null,
      failureEvidence: failureEvidenceV1({
        failureClass: "relation-integrity-failure",
        failedBeatOrdinal: 21,
        lastAcceptedTimeSec: trajectory.terminalAcceptedTimeSec,
        lastAcceptedRevision: trajectory.terminalAcceptedRevision,
        completedBeatCount: trajectory.beatExecutions.length,
        message: "transient PV relation construction failed",
        exception: sanitizeExceptionV1(error),
      }),
    });
  }
  let comparisonAudit: MainWireIntegratedModelTransientPvComparisonAuditV1;
  try {
    comparisonAudit = await dependencies.auditComparison(comparison);
  } catch (error) {
    return seal({
      sourceOutcome,
      beatExecutions: trajectory.beatExecutions,
      producerProjectionAudit,
      comparison,
      comparisonAudit: null,
      failureEvidence: failureEvidenceV1({
        failureClass: "relation-integrity-failure",
        failedBeatOrdinal: 21,
        lastAcceptedTimeSec: trajectory.terminalAcceptedTimeSec,
        lastAcceptedRevision: trajectory.terminalAcceptedRevision,
        completedBeatCount: trajectory.beatExecutions.length,
        message: "transient PV independent relation auditor threw",
        exception: sanitizeExceptionV1(error),
      }),
    });
  }
  if (comparisonAudit.status !== "comparison-audit-passed") {
    return seal({
      sourceOutcome,
      beatExecutions: trajectory.beatExecutions,
      producerProjectionAudit,
      comparison,
      comparisonAudit,
      failureEvidence: failureEvidenceV1({
        failureClass: "relation-integrity-failure",
        failedBeatOrdinal: 21,
        lastAcceptedTimeSec: trajectory.terminalAcceptedTimeSec,
        lastAcceptedRevision: trajectory.terminalAcceptedRevision,
        completedBeatCount: trajectory.beatExecutions.length,
        message:
          comparisonAudit.firstMismatchPath ??
          "transient relation independent replay failed",
      }),
    });
  }
  return seal({
    sourceOutcome,
    beatExecutions: trajectory.beatExecutions,
    producerProjectionAudit,
    comparison,
    comparisonAudit,
    failureEvidence: null,
  });
}

export async function auditMainWireIntegratedModelTransientVenousReturnReductionReportV1(
  report: MainWireIntegratedModelTransientVenousReturnReductionReportV1,
): Promise<MainWireIntegratedModelTransientVenousReturnReductionReportAuditV1> {
  const reportShapePassed =
    exactKeysV1(report, ["payload", "payloadSha256"]) &&
    exactKeysV1(report.payload, [
      "reportSchemaId",
      "characterizationOwnerId",
      "declaration",
      "implementationCommitSha",
      "protocolPayload",
      "protocolPayloadSha256",
      "sourceOutcome",
      "beatExecutions",
      "producerProjectionAudit",
      "comparison",
      "comparisonAudit",
      "failureEvidence",
      "assessment",
      "negativeClaims",
    ]) &&
    report.payload.reportSchemaId ===
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_REPORT_V1_ID &&
    report.payload.characterizationOwnerId ===
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_ENGINEERING_V1_ID &&
    /^[0-9a-f]{40}$/.test(report.payload.implementationCommitSha);
  const protocolBindingPassed =
    report.payload.protocolPayloadSha256 ===
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_SHA256_V1 &&
    (await sha256CanonicalJsonHex(report.payload.protocolPayload)) ===
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_SHA256_V1 &&
    canonicalJsonStringify(report.payload.declaration) ===
      canonicalJsonStringify(
        MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_DECLARATION_V1,
      );
  const sourceOutcomeShapePassed = sourceOutcomeShapePassedV1(
    report.payload.sourceOutcome,
  );
  const sourceIdentityReplayPassed = await sourceIdentityReplayPassedV1(
    report.payload.sourceOutcome,
  );
  const beatExecutionReplayPassed = beatExecutionsReplayPassedV1(
    report.payload.beatExecutions,
    report.payload.sourceOutcome,
  );
  const producerProjectionAuditReplayPassed =
    await producerProjectionAuditReplayPassedV1(
      report.payload.producerProjectionAudit,
      report.payload.beatExecutions,
      report.payload.comparison,
      report.payload.failureEvidence,
    );
  const independentlyReplayedComparisonAudit =
    report.payload.comparison === null
      ? null
      : await auditMainWireIntegratedModelTransientPvComparisonV1(
          report.payload.comparison,
        );
  const comparisonReplay =
    report.payload.comparison === null
      ? report.payload.comparisonAudit === null
      : comparisonExecutionBindingsPassedV1(
          report.payload.comparison,
          report.payload.beatExecutions,
        ) &&
        (report.payload.comparisonAudit === null
          ? report.payload.failureEvidence?.failureClass ===
              "relation-integrity-failure" &&
            report.payload.failureEvidence.exception !== null
          : canonicalJsonStringify(independentlyReplayedComparisonAudit) ===
            canonicalJsonStringify(report.payload.comparisonAudit));
  const failureOutcomeReplayPassed = failureOutcomeReplayPassedV1(
    report.payload,
  );
  const expectedAssessment = assessmentV1({
    sourceOutcome: report.payload.sourceOutcome,
    beatExecutions: report.payload.beatExecutions,
    producerProjectionAudit: report.payload.producerProjectionAudit,
    comparison: report.payload.comparison,
    comparisonAudit: report.payload.comparisonAudit,
    failureEvidence: report.payload.failureEvidence,
  });
  const assessmentReplayPassed =
    canonicalJsonStringify(expectedAssessment) ===
    canonicalJsonStringify(report.payload.assessment);
  const negativeClaimsPassed =
    canonicalJsonStringify(report.payload.negativeClaims) ===
    canonicalJsonStringify(
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_NEGATIVE_CLAIMS_V1,
    );
  const payloadHashPassed =
    report.payloadSha256 === (await sha256CanonicalJsonHex(report.payload));
  const gates = Object.freeze({
    reportShapePassed,
    protocolBindingPassed,
    sourceOutcomeShapePassed,
    sourceIdentityReplayPassed,
    beatExecutionReplayPassed,
    producerProjectionAuditReplayPassed,
    comparisonReplayPassed: comparisonReplay,
    failureOutcomeReplayPassed,
    assessmentReplayPassed,
    negativeClaimsPassed,
    payloadHashPassed,
  });
  const firstMismatchPath =
    Object.entries(gates).find(([, passed]) => passed !== true)?.[0] ?? null;
  return Object.freeze({
    status:
      firstMismatchPath === null
        ? ("report-audit-passed" as const)
        : ("report-audit-failed" as const),
    firstMismatchPath,
    ...gates,
  });
}

export async function auditCommittedMainWireIntegratedModelTransientVenousReturnReductionReportV1(
  report: MainWireIntegratedModelTransientVenousReturnReductionReportV1,
): Promise<MainWireIntegratedModelTransientVenousReturnReductionReportAuditV1> {
  const audit =
    await auditMainWireIntegratedModelTransientVenousReturnReductionReportV1(
      report,
    );
  if (audit.status !== "report-audit-passed") return audit;
  const firstMismatchPath =
    report.payload.implementationCommitSha !==
    MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_COMMITTED_IMPLEMENTATION_COMMIT_SHA_V1
      ? "committedImplementationCommitSha"
      : report.payloadSha256 !==
          MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_COMMITTED_PAYLOAD_SHA256_V1
        ? "committedPayloadSha256"
        : null;
  return firstMismatchPath === null
    ? audit
    : Object.freeze({
        ...audit,
        status: "report-audit-failed" as const,
        firstMismatchPath,
      });
}

async function sourceIdentityReplayPassedV1(
  outcome: MainWireIntegratedModelTransientVenousReturnReductionSourceOutcomeV1,
): Promise<boolean> {
  if (outcome.status === "source-execution-failed") {
    return outcome.summary === null && outcome.bindingDiagnostics === null;
  }
  const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
  const [conditionHash, protocolHash] = await Promise.all([
    sha256CanonicalJsonHex(
      createMainWireIntegratedModelPeriodicConditionIdentityPayloadEngineeringV1(
        fixture,
      ),
    ),
    sha256CanonicalJsonHex(
      createMainWireIntegratedModelPeriodicProtocolIdentityPayloadV3(fixture, {
        executionPurpose: "canonical-evidence",
        nominalDtSec: 0.001,
        maximumCycleCount: 250,
      }),
    ),
  ]);
  const conditionIdentityMatched =
    outcome.summary.modelConditionIdentityHash === conditionHash;
  const protocolIdentityMatched =
    outcome.summary.protocolIdentityHash === protocolHash;
  const checkpointIdentityFormatValid = /^[0-9a-f]{64}$/.test(
    outcome.summary.terminalCheckpointSha256,
  );
  if (outcome.failureClass === "source-not-p1") {
    return outcome.bindingDiagnostics === null;
  }
  if (outcome.bindingDiagnostics === null) return false;
  const diagnostics = outcome.bindingDiagnostics;
  if (!sourceBindingDiagnosticsShapePassedV1(diagnostics)) return false;
  const expectedDiagnostics = sourceBindingDiagnosticsV1(
    {
      conditionIdentityMatched,
      protocolIdentityMatched,
      checkpointIdentityFormatValid,
      restoreAttempted: diagnostics.restoreAttempted,
      roundTripCheckpointSha256: diagnostics.roundTripCheckpointSha256,
      restoredAcceptedTimeSec: diagnostics.restoredAcceptedTimeSec,
      restoredAcceptedRevision: diagnostics.restoredAcceptedRevision,
      restoredCoronaryWindowIndex: diagnostics.restoredCoronaryWindowIndex,
      restoreException: diagnostics.restoreException,
    },
    {
      checkpointSha256: outcome.summary.terminalCheckpointSha256,
      acceptedTimeSec: outcome.summary.terminalAcceptedTimeSec,
      acceptedRevision: outcome.summary.terminalAcceptedRevision,
      coronaryWindowIndex: outcome.summary.terminalCycleIndex,
    },
  );
  if (
    canonicalJsonStringify(expectedDiagnostics) !==
    canonicalJsonStringify(outcome.bindingDiagnostics)
  ) {
    return false;
  }
  return outcome.status === "source-p1-established"
    ? outcome.bindingDiagnostics.sourceBindingsMatched
    : !outcome.bindingDiagnostics.sourceBindingsMatched;
}

async function bindAndRestoreSourceV1(
  source: MainWireIntegratedModelPeriodicSteadyResultV3,
  fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
): Promise<
  | Readonly<{
      status: "bound";
      restoredState: AcceptedStateV1;
      diagnostics: MainWireIntegratedModelTransientVenousReturnReductionSourceBindingDiagnosticsV1;
    }>
  | Readonly<{
      status: "binding-failed";
      message: string;
      diagnostics: MainWireIntegratedModelTransientVenousReturnReductionSourceBindingDiagnosticsV1;
    }>
> {
  const [conditionHash, protocolHash] = await Promise.all([
    sha256CanonicalJsonHex(
      createMainWireIntegratedModelPeriodicConditionIdentityPayloadEngineeringV1(
        fixture,
      ),
    ),
    sha256CanonicalJsonHex(
      createMainWireIntegratedModelPeriodicProtocolIdentityPayloadV3(fixture, {
        executionPurpose: "canonical-evidence",
        nominalDtSec: 0.001,
        maximumCycleCount: 250,
      }),
    ),
  ]);
  const conditionIdentityMatched =
    conditionHash === source.modelConditionIdentityHash;
  const protocolIdentityMatched = protocolHash === source.protocolIdentityHash;
  const checkpointIdentityFormatValid = /^[0-9a-f]{64}$/.test(
    source.terminalCheckpoint.checkpointSha256,
  );
  if (
    !conditionIdentityMatched ||
    !protocolIdentityMatched ||
    !checkpointIdentityFormatValid
  ) {
    const diagnostics = sourceBindingDiagnosticsV1(
      {
        conditionIdentityMatched,
        protocolIdentityMatched,
        checkpointIdentityFormatValid,
        restoreAttempted: false,
        roundTripCheckpointSha256: null,
        restoredAcceptedTimeSec: null,
        restoredAcceptedRevision: null,
        restoredCoronaryWindowIndex: null,
        restoreException: null,
      },
      sourceBindingExpectedV1(source),
    );
    return Object.freeze({
      status: "binding-failed" as const,
      message:
        "canonical source condition, protocol, or checkpoint identity differs",
      diagnostics,
    });
  }
  try {
    const context =
      createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
        fixture,
      );
    const restoredState = await restoreMainWireIntegratedModelV3(
      context,
      JSON.parse(canonicalJsonStringify(source.terminalCheckpoint)),
    );
    const roundTrip = await checkpointMainWireIntegratedModelV3(
      context,
      restoredState,
    );
    const diagnostics = sourceBindingDiagnosticsV1(
      {
        conditionIdentityMatched,
        protocolIdentityMatched,
        checkpointIdentityFormatValid,
        restoreAttempted: true,
        roundTripCheckpointSha256: roundTrip.checkpointSha256,
        restoredAcceptedTimeSec: restoredState.acceptedTimeSec,
        restoredAcceptedRevision: restoredState.revision,
        restoredCoronaryWindowIndex:
          restoredState.coronary.coronaryAutoregulation.windowIndex,
        restoreException: null,
      },
      sourceBindingExpectedV1(source),
    );
    if (
      canonicalJsonStringify(roundTrip) !==
        canonicalJsonStringify(source.terminalCheckpoint) ||
      !diagnostics.checkpointExactRestoreMatched
    ) {
      return Object.freeze({
        status: "binding-failed" as const,
        message: "canonical source checkpoint exact restore differs",
        diagnostics,
      });
    }
    return Object.freeze({
      status: "bound" as const,
      restoredState,
      diagnostics,
    });
  } catch (error) {
    const restoreException = sanitizeExceptionV1(error);
    return Object.freeze({
      status: "binding-failed" as const,
      message: restoreException.message,
      diagnostics: sourceBindingDiagnosticsV1(
        {
          conditionIdentityMatched,
          protocolIdentityMatched,
          checkpointIdentityFormatValid,
          restoreAttempted: true,
          roundTripCheckpointSha256: null,
          restoredAcceptedTimeSec: null,
          restoredAcceptedRevision: null,
          restoredCoronaryWindowIndex: null,
          restoreException,
        },
        sourceBindingExpectedV1(source),
      ),
    });
  }
}

function sourceBindingDiagnosticsV1(
  input: Omit<
    MainWireIntegratedModelTransientVenousReturnReductionSourceBindingDiagnosticsV1,
    "checkpointExactRestoreMatched" | "sourceBindingsMatched"
  >,
  expected: Readonly<{
    checkpointSha256: string;
    acceptedTimeSec: number;
    acceptedRevision: number;
    coronaryWindowIndex: number;
  }>,
): MainWireIntegratedModelTransientVenousReturnReductionSourceBindingDiagnosticsV1 {
  const checkpointExactRestoreMatched =
    input.restoreAttempted &&
    input.restoreException === null &&
    input.roundTripCheckpointSha256 === expected.checkpointSha256 &&
    input.restoredAcceptedTimeSec === expected.acceptedTimeSec &&
    input.restoredAcceptedRevision === expected.acceptedRevision &&
    input.restoredCoronaryWindowIndex === expected.coronaryWindowIndex;
  return Object.freeze({
    ...input,
    checkpointExactRestoreMatched,
    sourceBindingsMatched:
      input.conditionIdentityMatched &&
      input.protocolIdentityMatched &&
      input.checkpointIdentityFormatValid &&
      checkpointExactRestoreMatched,
  });
}

function sourceBindingExpectedV1(
  source: MainWireIntegratedModelPeriodicSteadyResultV3,
) {
  return Object.freeze({
    checkpointSha256: source.terminalCheckpoint.checkpointSha256,
    acceptedTimeSec: source.terminalAcceptedState.acceptedTimeSec,
    acceptedRevision: source.terminalAcceptedState.revision,
    coronaryWindowIndex: source.terminalCycleTrace.cycleIndex,
  });
}

function sourceBindingDiagnosticsShapePassedV1(
  diagnostics: MainWireIntegratedModelTransientVenousReturnReductionSourceBindingDiagnosticsV1,
): boolean {
  if (
    !exactKeysV1(diagnostics, [
      "conditionIdentityMatched",
      "protocolIdentityMatched",
      "checkpointIdentityFormatValid",
      "restoreAttempted",
      "roundTripCheckpointSha256",
      "restoredAcceptedTimeSec",
      "restoredAcceptedRevision",
      "restoredCoronaryWindowIndex",
      "restoreException",
      "checkpointExactRestoreMatched",
      "sourceBindingsMatched",
    ])
  ) {
    return false;
  }
  if (!diagnostics.restoreAttempted) {
    return (
      diagnostics.roundTripCheckpointSha256 === null &&
      diagnostics.restoredAcceptedTimeSec === null &&
      diagnostics.restoredAcceptedRevision === null &&
      diagnostics.restoredCoronaryWindowIndex === null &&
      diagnostics.restoreException === null &&
      !diagnostics.checkpointExactRestoreMatched &&
      !diagnostics.sourceBindingsMatched
    );
  }
  if (diagnostics.restoreException !== null) {
    return (
      exactKeysV1(diagnostics.restoreException, ["name", "message"]) &&
      diagnostics.restoreException.name.length > 0 &&
      diagnostics.restoreException.message.length > 0 &&
      diagnostics.roundTripCheckpointSha256 === null &&
      diagnostics.restoredAcceptedTimeSec === null &&
      diagnostics.restoredAcceptedRevision === null &&
      diagnostics.restoredCoronaryWindowIndex === null &&
      !diagnostics.checkpointExactRestoreMatched &&
      !diagnostics.sourceBindingsMatched
    );
  }
  return (
    typeof diagnostics.roundTripCheckpointSha256 === "string" &&
    Number.isFinite(diagnostics.restoredAcceptedTimeSec) &&
    Number.isSafeInteger(diagnostics.restoredAcceptedRevision) &&
    Number.isSafeInteger(diagnostics.restoredCoronaryWindowIndex)
  );
}

async function runTransientTrajectoryV1(
  fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  initial: AcceptedStateV1,
  source: MainWireIntegratedModelPeriodicSteadyResultV3,
): Promise<CompletedTrajectoryV1 | FailedTrajectoryV1> {
  const sourceTimeSec = initial.acceptedTimeSec;
  const terminalSourceSample = source.terminalCycleTrace.samples.at(-1);
  if (
    terminalSourceSample === undefined ||
    terminalSourceSample.acceptedTimeSec !== sourceTimeSec
  ) {
    return Object.freeze({
      beatExecutions: Object.freeze([]),
      rawBeats: Object.freeze([]),
      failureEvidence: failureEvidenceV1({
        failureClass: "source-binding-failure",
        lastAcceptedTimeSec: initial.acceptedTimeSec,
        lastAcceptedRevision: initial.revision,
        message: "source terminal trace endpoint differs from checkpoint",
      }),
    });
  }
  let accepted = initial;
  let beatStartSample = rawSampleFromPeriodicTraceV1(terminalSourceSample);
  const beatExecutions: MainWireIntegratedModelTransientVenousReturnReductionBeatExecutionV1[] =
    [];
  const rawBeats: MainWireIntegratedModelTransientPvRawBeatV1[] = [];
  for (let beatOrdinal = 1; beatOrdinal <= 21; beatOrdinal += 1) {
    let beat: Awaited<ReturnType<typeof runTransientBeatV1>>;
    try {
      beat = await runTransientBeatV1(
        fixture,
        accepted,
        beatStartSample,
        sourceTimeSec,
        beatOrdinal,
      );
    } catch (error) {
      return Object.freeze({
        beatExecutions: Object.freeze(beatExecutions),
        rawBeats: Object.freeze(rawBeats),
        failureEvidence: failureEvidenceV1({
          failureClass: "trajectory-step-failure",
          failedBeatOrdinal: beatOrdinal,
          lastAcceptedTimeSec: accepted.acceptedTimeSec,
          lastAcceptedRevision: accepted.revision,
          completedBeatCount: beatExecutions.length,
          message: "transient beat execution threw outside candidate step",
          exception: sanitizeExceptionV1(error),
        }),
      });
    }
    if (beat.status === "failed") {
      return Object.freeze({
        beatExecutions: Object.freeze(beatExecutions),
        rawBeats: Object.freeze(rawBeats),
        failureEvidence: beat.failureEvidence,
      });
    }
    beatExecutions.push(beat.execution);
    rawBeats.push(beat.rawBeat);
    if (!beat.execution.integrityPassed) {
      return Object.freeze({
        beatExecutions: Object.freeze(beatExecutions),
        rawBeats: Object.freeze(rawBeats),
        failureEvidence: failureEvidenceV1({
          failureClass: "cycle-integrity-failure",
          failedBeatOrdinal: beatOrdinal,
          lastAcceptedTimeSec: beat.terminalState.acceptedTimeSec,
          lastAcceptedRevision: beat.terminalState.revision,
          completedBeatCount: beatExecutions.length,
          message: `transient beat ${beatOrdinal} integrity gate failed`,
        }),
      });
    }
    accepted = beat.terminalState;
    beatStartSample = beat.rawBeat.samples[beat.rawBeat.samples.length - 1]!;
  }
  return Object.freeze({
    beatExecutions: Object.freeze(beatExecutions),
    rawBeats: Object.freeze(rawBeats),
    terminalAcceptedTimeSec: accepted.acceptedTimeSec,
    terminalAcceptedRevision: accepted.revision,
  });
}

async function runTransientBeatV1(
  fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  initial: AcceptedStateV1,
  startSample: MainWireIntegratedModelTransientPvAcceptedSampleV1,
  sourceTimeSec: number,
  beatOrdinal: number,
): Promise<
  | Readonly<{
      status: "completed";
      execution: MainWireIntegratedModelTransientVenousReturnReductionBeatExecutionV1;
      rawBeat: MainWireIntegratedModelTransientPvRawBeatV1;
      terminalState: AcceptedStateV1;
    }>
  | Readonly<{
      status: "failed";
      failureEvidence: MainWireIntegratedModelTransientVenousReturnReductionFailureEvidenceV1;
    }>
> {
  const startTimeSec = initial.acceptedTimeSec;
  const endTimeSec = sourceTimeSec + beatOrdinal;
  const startRevision = initial.revision;
  const expectedCoronaryWindowIndex =
    initial.coronary.coronaryAutoregulation.windowIndex;
  if (startTimeSec !== sourceTimeSec + beatOrdinal - 1) {
    return Object.freeze({
      status: "failed" as const,
      failureEvidence: failureEvidenceV1({
        failureClass: "cycle-integrity-failure",
        failedBeatOrdinal: beatOrdinal,
        lastAcceptedTimeSec: startTimeSec,
        lastAcceptedRevision: startRevision,
        completedBeatCount: beatOrdinal - 1,
        message: "transient beat does not start at exact schedule boundary",
      }),
    });
  }
  let accepted = initial;
  let nominalGridIndex = 1;
  let acceptedStepCount = 0;
  let boundaryClippedStepCount = 0;
  let maximumGlobalTotalBloodVolumeErrorMl = 0;
  let maximumCoronaryBloodVolumeLedgerResidualMl = 0;
  let maximumDynamicMcsConservationResidualMlPerSec = 0;
  let oneComposedCalciumOwnerOnly = true;
  let allDynamicMcsAcceptedFlowsExactlyZero = true;
  let allRawValuesFinite = true;
  let minimumSystemicVenousReturnMlPerSec = Number.POSITIVE_INFINITY;
  let maximumSystemicVenousReturnMlPerSec = Number.NEGATIVE_INFINITY;
  let minimumAcceptedCandidateScale = Number.POSITIVE_INFINITY;
  let maximumAcceptedCandidateScale = Number.NEGATIVE_INFINITY;
  const acceptedAtrialCaptureIds: string[] = [];
  const acceptedVentricularCaptureIds: string[] = [];
  const deliveredCalciumDepositIds: string[] = [];
  const completedCoronaryWindowIndices: number[] = [];
  const rawSamples: MainWireIntegratedModelTransientPvAcceptedSampleV1[] = [
    startSample,
  ];
  while (accepted.acceptedTimeSec < endTimeSec) {
    if (
      acceptedStepCount >=
      MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.maximumAcceptedStepCountPerRun
    ) {
      return Object.freeze({
        status: "failed" as const,
        failureEvidence: failureEvidenceV1({
          failureClass: "trajectory-step-failure",
          failedBeatOrdinal: beatOrdinal,
          lastAcceptedTimeSec: accepted.acceptedTimeSec,
          lastAcceptedRevision: accepted.revision,
          completedBeatCount: beatOrdinal - 1,
          message: "transient beat exceeded accepted-step bound",
        }),
      });
    }
    const nominalTargetTimeSec = Math.min(
      endTimeSec,
      startTimeSec + nominalGridIndex * 0.001,
    );
    if (!(nominalTargetTimeSec > accepted.acceptedTimeSec)) {
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
      return Object.freeze({
        status: "failed" as const,
        failureEvidence: failureEvidenceV1({
          failureClass: "trajectory-step-failure",
          failedBeatOrdinal: beatOrdinal,
          lastAcceptedTimeSec: accepted.acceptedTimeSec,
          lastAcceptedRevision: accepted.revision,
          failedCandidateTimeSec: maximum.candidateTimeSec,
          failedCandidateResistanceScale:
            mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
              maximum.candidateTimeSec - sourceTimeSec,
            ),
          completedBeatCount: beatOrdinal - 1,
          message: "transient scheduler returned invalid candidate time",
        }),
      });
    }
    if (maximum.candidateTimeSec < nominalTargetTimeSec) {
      boundaryClippedStepCount += 1;
    }
    const candidateScale =
      mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
        maximum.candidateTimeSec - sourceTimeSec,
      );
    const input = transientStepInputV1(
      fixture,
      maximum.candidateTimeSec,
      candidateScale,
    );
    let stepped: MainWireIntegratedModelStepResultV3<WallStateV1>;
    try {
      stepped = stepMainWireIntegratedModelV3(
        fixture.provider,
        accepted,
        input,
      );
    } catch (error) {
      return Object.freeze({
        status: "failed" as const,
        failureEvidence: failureEvidenceV1({
          failureClass: "trajectory-step-failure",
          failedBeatOrdinal: beatOrdinal,
          lastAcceptedTimeSec: accepted.acceptedTimeSec,
          lastAcceptedRevision: accepted.revision,
          failedCandidateTimeSec: maximum.candidateTimeSec,
          failedCandidateResistanceScale: candidateScale,
          completedBeatCount: beatOrdinal - 1,
          message: "transient integrated step threw",
          exception: sanitizeExceptionV1(error),
        }),
      });
    }
    if (stepped.converged === false) {
      return Object.freeze({
        status: "failed" as const,
        failureEvidence: failureEvidenceV1({
          failureClass: "trajectory-step-failure",
          failedBeatOrdinal: beatOrdinal,
          lastAcceptedTimeSec: accepted.acceptedTimeSec,
          lastAcceptedRevision: accepted.revision,
          failedCandidateTimeSec: maximum.candidateTimeSec,
          failedCandidateResistanceScale: candidateScale,
          completedBeatCount: beatOrdinal - 1,
          message: stepped.message,
        }),
      });
    }
    accepted = stepped.acceptedState;
    acceptedStepCount += 1;
    if (accepted.acceptedTimeSec === nominalTargetTimeSec) {
      nominalGridIndex += 1;
    }
    minimumAcceptedCandidateScale = Math.min(
      minimumAcceptedCandidateScale,
      candidateScale,
    );
    maximumAcceptedCandidateScale = Math.max(
      maximumAcceptedCandidateScale,
      candidateScale,
    );
    try {
      const sample =
        sampleMainWireIntegratedModelBeatFromAcceptedStepV3(stepped);
      rawSamples.push(rawPvSampleFromAcceptedBeatSampleV1(sample));
      minimumSystemicVenousReturnMlPerSec = Math.min(
        minimumSystemicVenousReturnMlPerSec,
        sample.systemicVenousReturnMlPerSec,
      );
      maximumSystemicVenousReturnMlPerSec = Math.max(
        maximumSystemicVenousReturnMlPerSec,
        sample.systemicVenousReturnMlPerSec,
      );
      updateStepEvidenceV1(stepped, {
        acceptedAtrialCaptureIds,
        acceptedVentricularCaptureIds,
        deliveredCalciumDepositIds,
        completedCoronaryWindowIndices,
      });
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
      allDynamicMcsAcceptedFlowsExactlyZero =
        allDynamicMcsAcceptedFlowsExactlyZero &&
        Object.values(
          accepted.dynamicMechanicalSupport.acceptedFlowMlPerSec,
        ).every((value) => value === 0);
      const diagnostics = stepDiagnosticsV1(stepped);
      maximumGlobalTotalBloodVolumeErrorMl = Math.max(
        maximumGlobalTotalBloodVolumeErrorMl,
        Math.abs(diagnostics.totalBloodVolumeErrorMl),
      );
      maximumCoronaryBloodVolumeLedgerResidualMl = Math.max(
        maximumCoronaryBloodVolumeLedgerResidualMl,
        Math.abs(diagnostics.coronaryBloodVolumeLedgerResidualMl),
      );
      maximumDynamicMcsConservationResidualMlPerSec = Math.max(
        maximumDynamicMcsConservationResidualMlPerSec,
        Math.abs(diagnostics.dynamicMcsConservationResidualMlPerSec),
      );
      allRawValuesFinite =
        allRawValuesFinite && allNumericLeavesFiniteV1({ sample, diagnostics });
    } catch (error) {
      return Object.freeze({
        status: "failed" as const,
        failureEvidence: failureEvidenceV1({
          failureClass: "trajectory-step-failure",
          failedBeatOrdinal: beatOrdinal,
          lastAcceptedTimeSec: accepted.acceptedTimeSec,
          lastAcceptedRevision: accepted.revision,
          completedBeatCount: beatOrdinal - 1,
          message: "transient post-acceptance evidence construction failed",
          exception: sanitizeExceptionV1(error),
        }),
      });
    }
  }
  const tolerance =
    MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.invariantTolerance;
  const integrityPassed =
    accepted.acceptedTimeSec === endTimeSec &&
    accepted.revision === startRevision + acceptedStepCount &&
    acceptedAtrialCaptureIds.length === 1 &&
    acceptedVentricularCaptureIds.length === 1 &&
    deliveredCalciumDepositIds.length === 2 &&
    new Set(acceptedAtrialCaptureIds).size ===
      acceptedAtrialCaptureIds.length &&
    new Set(acceptedVentricularCaptureIds).size ===
      acceptedVentricularCaptureIds.length &&
    new Set(deliveredCalciumDepositIds).size ===
      deliveredCalciumDepositIds.length &&
    completedCoronaryWindowIndices.length === 1 &&
    completedCoronaryWindowIndices[0] === expectedCoronaryWindowIndex &&
    oneComposedCalciumOwnerOnly &&
    allDynamicMcsAcceptedFlowsExactlyZero &&
    allRawValuesFinite &&
    maximumGlobalTotalBloodVolumeErrorMl <=
      tolerance.globalTotalBloodVolumeErrorMl &&
    maximumCoronaryBloodVolumeLedgerResidualMl <=
      tolerance.coronaryBloodVolumeLedgerResidualMl &&
    maximumDynamicMcsConservationResidualMlPerSec <=
      tolerance.dynamicMcsConservationResidualMlPerSec;
  const rawBeat = Object.freeze({
    beatOrdinal,
    startTimeSec,
    endTimeSec,
    samples: Object.freeze(rawSamples),
  });
  const executionWithoutHash = Object.freeze({
    beatOrdinal,
    phase: mainWireIntegratedModelTransientVenousReturnBeatPhaseV1(beatOrdinal),
    startTimeSec,
    endTimeSec,
    startAcceptedRevision: startRevision,
    terminalAcceptedRevision: accepted.revision,
    acceptedStepCount,
    boundaryClippedStepCount,
    resistanceScale: Object.freeze({
      start: mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
        startTimeSec - sourceTimeSec,
      ),
      midpoint: mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
        (startTimeSec + endTimeSec) / 2 - sourceTimeSec,
      ),
      end: mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
        endTimeSec - sourceTimeSec,
      ),
      minimumAcceptedCandidate: minimumAcceptedCandidateScale,
      maximumAcceptedCandidate: maximumAcceptedCandidateScale,
    }),
    fixedGlobalTotalBloodVolumeMl:
      accepted.coronary.fixedGlobalTotalBloodVolumeMl,
    maximumGlobalTotalBloodVolumeErrorMl,
    maximumCoronaryBloodVolumeLedgerResidualMl,
    maximumDynamicMcsConservationResidualMlPerSec,
    acceptedAtrialCaptureIds: Object.freeze(acceptedAtrialCaptureIds),
    acceptedVentricularCaptureIds: Object.freeze(acceptedVentricularCaptureIds),
    deliveredCalciumDepositIds: Object.freeze(deliveredCalciumDepositIds),
    completedCoronaryWindowIndices: Object.freeze(
      completedCoronaryWindowIndices,
    ),
    oneComposedCalciumOwnerOnly,
    allDynamicMcsAcceptedFlowsExactlyZero,
    allRawValuesFinite,
    minimumSystemicVenousReturnMlPerSec,
    maximumSystemicVenousReturnMlPerSec,
    integrityPassed,
    rawAcceptedSampleCount: rawSamples.length,
  });
  const execution = Object.freeze({
    ...executionWithoutHash,
    rawAcceptedSamplesSha256: await sha256CanonicalJsonHex(rawSamples),
  }) satisfies MainWireIntegratedModelTransientVenousReturnReductionBeatExecutionV1;
  return Object.freeze({
    status: "completed" as const,
    execution,
    rawBeat,
    terminalState: accepted,
  });
}

function transientStepInputV1(
  fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  candidateTimeSec: number,
  resistanceScale: number,
): MainWireIntegratedModelStepInputV3 {
  return Object.freeze({
    candidateTimeSec,
    coronary: Object.freeze({
      ...fixture.coronaryStepInput,
      protocolResistanceScaleByEdge: Object.freeze({
        VC_RA: resistanceScale,
      }),
    }),
    rhythm: Object.freeze({
      configuration: fixture.rhythm.configuration,
      externalAfNextBoundaryTimeSec: null,
      externalAtrialSourceBatch: null,
    }),
    dynamicMechanicalSupport: fixture.dynamicMechanicalSupport,
  });
}

function rawSampleFromPeriodicTraceV1(
  sample: MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
): MainWireIntegratedModelTransientPvAcceptedSampleV1 {
  return Object.freeze({
    timeSec: sample.acceptedTimeSec,
    LV: Object.freeze({
      volumeMl: sample.chamberVolumeMl.LV,
      absolutePressureMmHg: sample.absolutePressureMmHg.LV,
      transmuralPressureMmHg: sample.transmuralPressureMmHg.LV,
      semilunarFlowMlPerSec: sample.valveFlowMlPerSec.AoV,
    }),
    RV: Object.freeze({
      volumeMl: sample.chamberVolumeMl.RV,
      absolutePressureMmHg: sample.absolutePressureMmHg.RV,
      transmuralPressureMmHg: sample.transmuralPressureMmHg.RV,
      semilunarFlowMlPerSec: sample.valveFlowMlPerSec.PV,
    }),
  });
}

function rawPvSampleFromAcceptedBeatSampleV1(
  sample: MainWireIntegratedModelAcceptedBeatSampleV3,
): MainWireIntegratedModelTransientPvAcceptedSampleV1 {
  return Object.freeze({
    timeSec: sample.timeSec,
    LV: Object.freeze({
      volumeMl: sample.leftVentricularVolumeMl,
      absolutePressureMmHg: sample.leftVentricularAbsolutePressureMmHg,
      transmuralPressureMmHg: sample.leftVentricularTransmuralPressureMmHg,
      semilunarFlowMlPerSec: sample.aorticValveFlowMlPerSec,
    }),
    RV: Object.freeze({
      volumeMl: sample.rightVentricularVolumeMl,
      absolutePressureMmHg: sample.rightVentricularAbsolutePressureMmHg,
      transmuralPressureMmHg: sample.rightVentricularTransmuralPressureMmHg,
      semilunarFlowMlPerSec: sample.pulmonaryValveFlowMlPerSec,
    }),
  });
}

function updateStepEvidenceV1(
  stepped: SuccessfulStepV1,
  destination: {
    acceptedAtrialCaptureIds: string[];
    acceptedVentricularCaptureIds: string[];
    deliveredCalciumDepositIds: string[];
    completedCoronaryWindowIndices: number[];
  },
): void {
  const candidate = stepped.composedRhythmCandidate;
  if (candidate.capturedAtrialActivation !== null) {
    destination.acceptedAtrialCaptureIds.push(
      candidate.capturedAtrialActivation.capturedActivationId,
    );
  }
  if (candidate.capturedVentricularActivation !== null) {
    destination.acceptedVentricularCaptureIds.push(
      candidate.capturedVentricularActivation.capturedActivationId,
    );
  }
  destination.deliveredCalciumDepositIds.push(
    ...candidate.deliveredCalciumDeposits.map(({ depositId }) => depositId),
  );
  if (stepped.coronaryStep.autoregulationWindowCompleted) {
    const completion = stepped.coronaryStep.autoregulationCompletion;
    if (completion !== null) {
      destination.completedCoronaryWindowIndices.push(completion.windowIndex);
    }
  }
}

function stepDiagnosticsV1(stepped: SuccessfulStepV1) {
  return Object.freeze({
    totalBloodVolumeErrorMl:
      stepped.coronaryStep.baseStep.circulationTrial.diagnostics
        .totalBloodVolumeErrorMl,
    coronaryBloodVolumeLedgerResidualMl:
      stepped.coronaryStep.baseStep.coronaryTrial.diagnostics
        .exactBloodVolumeLedgerResidualMl,
    dynamicMcsConservationResidualMlPerSec:
      stepped.dynamicMechanicalSupportTrial.conservationResidualMlPerSec,
  });
}

async function sealReportV1(
  implementationCommitSha: string,
  input: Readonly<{
    sourceOutcome: MainWireIntegratedModelTransientVenousReturnReductionSourceOutcomeV1;
    beatExecutions: readonly MainWireIntegratedModelTransientVenousReturnReductionBeatExecutionV1[];
    producerProjectionAudit: MainWireIntegratedModelTransientPvRawProjectionAuditV1 | null;
    comparison: MainWireIntegratedModelTransientPvComparisonV1 | null;
    comparisonAudit: MainWireIntegratedModelTransientPvComparisonAuditV1 | null;
    failureEvidence: MainWireIntegratedModelTransientVenousReturnReductionFailureEvidenceV1 | null;
  }>,
): Promise<MainWireIntegratedModelTransientVenousReturnReductionReportV1> {
  const assessment = assessmentV1(input);
  const payload = deepFreezeV1({
    reportSchemaId:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_REPORT_V1_ID,
    characterizationOwnerId:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_ENGINEERING_V1_ID,
    declaration:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_DECLARATION_V1,
    implementationCommitSha,
    protocolPayload:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_V1,
    protocolPayloadSha256:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_SHA256_V1,
    sourceOutcome: input.sourceOutcome,
    beatExecutions: input.beatExecutions,
    producerProjectionAudit: input.producerProjectionAudit,
    comparison: input.comparison,
    comparisonAudit: input.comparisonAudit,
    failureEvidence: input.failureEvidence,
    assessment,
    negativeClaims:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_NEGATIVE_CLAIMS_V1,
  }) satisfies MainWireIntegratedModelTransientVenousReturnReductionPayloadV1;
  return Object.freeze({
    payload,
    payloadSha256: await sha256CanonicalJsonHex(payload),
  });
}

function assessmentV1(
  input: Readonly<{
    sourceOutcome: MainWireIntegratedModelTransientVenousReturnReductionSourceOutcomeV1;
    beatExecutions: readonly MainWireIntegratedModelTransientVenousReturnReductionBeatExecutionV1[];
    producerProjectionAudit: MainWireIntegratedModelTransientPvRawProjectionAuditV1 | null;
    comparison: MainWireIntegratedModelTransientPvComparisonV1 | null;
    comparisonAudit: MainWireIntegratedModelTransientPvComparisonAuditV1 | null;
    failureEvidence: MainWireIntegratedModelTransientVenousReturnReductionFailureEvidenceV1 | null;
  }>,
): MainWireIntegratedModelTransientVenousReturnReductionAssessmentV1 {
  const sourceP1Established =
    input.sourceOutcome.status === "source-p1-established";
  const exactSequentialBeatSetRetained = input.beatExecutions.every(
    (beat, index) =>
      beat.beatOrdinal === index + 1 &&
      beat.phase ===
        mainWireIntegratedModelTransientVenousReturnBeatPhaseV1(index + 1),
  );
  const allTwentyOneBeatsCompleted =
    input.beatExecutions.length === 21 && exactSequentialBeatSetRetained;
  const allBeatIntegrityGatesPassed =
    allTwentyOneBeatsCompleted &&
    input.beatExecutions.every(({ integrityPassed }) => integrityPassed);
  const rawProjectionProducerReplayPassed =
    input.producerProjectionAudit?.status === "raw-projection-audit-passed";
  const compactLoopAndLandmarkProjectionCompleted =
    rawProjectionProducerReplayPassed &&
    input.comparison?.beatProjectionCount === 21;
  const relationAndHysteresisIndependentReplayPassed =
    input.comparisonAudit?.status === "comparison-audit-passed";
  const completed =
    sourceP1Established &&
    allBeatIntegrityGatesPassed &&
    rawProjectionProducerReplayPassed &&
    compactLoopAndLandmarkProjectionCompleted &&
    relationAndHysteresisIndependentReplayPassed &&
    input.failureEvidence === null;
  return Object.freeze({
    sourceP1Established,
    sourceBindingsReplayed:
      sourceP1Established &&
      input.sourceOutcome.bindingDiagnostics.sourceBindingsMatched,
    exactSequentialBeatSetRetained,
    allTwentyOneBeatsCompleted,
    allBeatIntegrityGatesPassed,
    rawProjectionProducerReplayPassed,
    compactLoopAndLandmarkProjectionCompleted,
    relationAndHysteresisIndependentReplayPassed,
    transientVenousReturnReductionCharacterizationCompleted: completed,
    firstFailureClass: input.failureEvidence?.failureClass ?? null,
    methodAgreementIsQualificationGate: false as const,
    positiveSlopeIsQualificationGate: false as const,
    hysteresisMagnitudeIsQualificationGate: false as const,
  });
}

function sourceSummaryV1(
  source: MainWireIntegratedModelPeriodicSteadyResultV3,
): MainWireIntegratedModelTransientVenousReturnReductionSourceSummaryV1 {
  const terminalCycle = source.cycles.at(-1);
  const terminalObservation = source.observations.at(-1);
  if (
    terminalCycle === undefined ||
    terminalObservation === undefined ||
    terminalObservation.cycleIndex !== terminalCycle.cycleIndex ||
    canonicalJsonStringify(terminalObservation.period1) !==
      canonicalJsonStringify(terminalCycle.period1)
  ) {
    throw new Error("transient source terminal comparator differs");
  }
  const period1ClassifierInputs = source.observations
    .slice(-MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.consecutiveCycles)
    .map((observation) =>
      Object.freeze({
        cycleIndex: observation.cycleIndex,
        evidenceRole: observation.evidenceRole,
        protocolIdentityHash: observation.protocolIdentityHash,
        period1MaximumNormalizedDelta:
          observation.period1.overall.maximumNormalizedDelta,
        period2MaximumNormalizedDelta:
          observation.period2?.overall.maximumNormalizedDelta ?? null,
      }),
    );
  return Object.freeze({
    experimentId: source.experimentId,
    executionPurpose: source.executionPurpose,
    nominalDtSec: source.nominalDtSec,
    requestedMaximumCycleCount: source.requestedMaximumCycleCount,
    completedCycleCount: source.completedCycleCount,
    terminationReason: source.terminationReason,
    classification: source.classification,
    numericalPeriod1Established: source.numericalPeriod1Established,
    allCyclesFiniteConservedAndEventExact:
      source.allCyclesFiniteConservedAndEventExact,
    modelConditionIdentityHash: source.modelConditionIdentityHash,
    protocolIdentityHash: source.protocolIdentityHash,
    terminalCheckpointSha256: source.terminalCheckpoint.checkpointSha256,
    terminalCheckpointExactRoundTripVerified:
      source.terminalCheckpointExactRoundTripVerified,
    terminalAcceptedTimeSec: source.terminalAcceptedState.acceptedTimeSec,
    terminalAcceptedRevision: source.terminalAcceptedState.revision,
    terminalCycleIndex: source.terminalCycleTrace.cycleIndex,
    period1ClassifierInputs: Object.freeze(period1ClassifierInputs),
    terminalPeriod1Closure: terminalCycle.period1,
    internallyOwnedSourceExecution: true as const,
    canonicalSourceAuthenticationEstablished: false as const,
    historicalQualificationTransferred: false as const,
  });
}

function sourceIsP1V1(
  source: MainWireIntegratedModelPeriodicSteadyResultV3,
): boolean {
  return (
    source.executionPurpose === "canonical-evidence" &&
    source.nominalDtSec === 0.001 &&
    source.requestedMaximumCycleCount === 250 &&
    source.terminationReason === "period1-converged" &&
    source.classification.status === "period1-converged" &&
    source.numericalPeriod1Established === true &&
    source.allCyclesFiniteConservedAndEventExact === true &&
    source.terminalCheckpointExactRoundTripVerified === true &&
    source.completedCycleCount === source.terminalCycleTrace.cycleIndex &&
    source.cycles.at(-1)?.cycleIndex === source.terminalCycleTrace.cycleIndex
  );
}

function sourceOutcomeShapePassedV1(
  outcome: MainWireIntegratedModelTransientVenousReturnReductionSourceOutcomeV1,
): boolean {
  if (outcome.status === "source-execution-failed") {
    return (
      exactKeysV1(outcome, [
        "status",
        "failureClass",
        "summary",
        "bindingDiagnostics",
        "exception",
      ]) &&
      outcome.failureClass === "source-execution-failure" &&
      outcome.summary === null &&
      outcome.bindingDiagnostics === null &&
      outcome.exception !== null &&
      exactKeysV1(outcome.exception, ["name", "message"]) &&
      outcome.exception.name.length > 0 &&
      outcome.exception.message.length > 0
    );
  }
  if (
    !exactKeysV1(outcome, [
      "status",
      "failureClass",
      "summary",
      "bindingDiagnostics",
      "exception",
    ]) ||
    outcome.summary === null ||
    outcome.exception !== null
  ) {
    return false;
  }
  const summary = outcome.summary;
  const canonicalSourceRequestRetained =
    summary.executionPurpose === "canonical-evidence" &&
    summary.nominalDtSec === 0.001 &&
    summary.requestedMaximumCycleCount === 250;
  if (
    !sourceSummaryShapePassedV1(summary) ||
    (outcome.bindingDiagnostics !== null &&
      !sourceBindingDiagnosticsShapePassedV1(outcome.bindingDiagnostics)) ||
    summary.experimentId !== MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V3_ID ||
    ![
      "canonical-evidence",
      "bounded-smoke",
      "fixed-horizon-characterization",
    ].includes(summary.executionPurpose) ||
    !Number.isFinite(summary.nominalDtSec) ||
    !(summary.nominalDtSec > 0) ||
    !Number.isSafeInteger(summary.requestedMaximumCycleCount) ||
    summary.requestedMaximumCycleCount < 1 ||
    !Number.isSafeInteger(summary.completedCycleCount) ||
    summary.completedCycleCount < 1 ||
    !Number.isSafeInteger(summary.terminalCycleIndex) ||
    summary.terminalCycleIndex < 1 ||
    summary.completedCycleCount !== summary.terminalCycleIndex ||
    !Number.isFinite(summary.terminalAcceptedTimeSec) ||
    !Number.isSafeInteger(summary.terminalAcceptedRevision) ||
    typeof summary.terminalCheckpointSha256 !== "string" ||
    typeof summary.terminalCheckpointExactRoundTripVerified !== "boolean" ||
    summary.internallyOwnedSourceExecution !== true ||
    summary.canonicalSourceAuthenticationEstablished !== false ||
    summary.historicalQualificationTransferred !== false ||
    !sourceClassifierReplayPassedV1(summary) ||
    !terminalClosureBindingPassedV1(summary, false) ||
    !allNumericLeavesFiniteV1(summary)
  ) {
    return false;
  }
  if (outcome.status === "source-p1-established") {
    return (
      outcome.failureClass === null &&
      canonicalSourceRequestRetained &&
      outcome.bindingDiagnostics !== null &&
      outcome.bindingDiagnostics.sourceBindingsMatched === true &&
      sourceSummaryEstablishesP1V1(outcome.summary)
    );
  }
  return outcome.failureClass === "source-not-p1"
    ? outcome.bindingDiagnostics === null &&
        !sourceSummaryEstablishesP1V1(outcome.summary)
    : outcome.failureClass === "source-binding-failure" &&
        canonicalSourceRequestRetained &&
        sourceSummaryEstablishesP1V1(outcome.summary) &&
        outcome.bindingDiagnostics !== null &&
        outcome.bindingDiagnostics.sourceBindingsMatched === false &&
        outcome.bindingDiagnostics.sourceBindingsMatched ===
          (outcome.bindingDiagnostics.conditionIdentityMatched &&
            outcome.bindingDiagnostics.protocolIdentityMatched &&
            outcome.bindingDiagnostics.checkpointIdentityFormatValid &&
            outcome.bindingDiagnostics.checkpointExactRestoreMatched);
}

function sourceSummaryShapePassedV1(
  summary: MainWireIntegratedModelTransientVenousReturnReductionSourceSummaryV1,
): boolean {
  const classification = summary.classification;
  const closure = summary.terminalPeriod1Closure;
  return (
    exactKeysV1(summary, [
      "experimentId",
      "executionPurpose",
      "nominalDtSec",
      "requestedMaximumCycleCount",
      "completedCycleCount",
      "terminationReason",
      "classification",
      "numericalPeriod1Established",
      "allCyclesFiniteConservedAndEventExact",
      "modelConditionIdentityHash",
      "protocolIdentityHash",
      "terminalCheckpointSha256",
      "terminalCheckpointExactRoundTripVerified",
      "terminalAcceptedTimeSec",
      "terminalAcceptedRevision",
      "terminalCycleIndex",
      "period1ClassifierInputs",
      "terminalPeriod1Closure",
      "internallyOwnedSourceExecution",
      "canonicalSourceAuthenticationEstablished",
      "historicalQualificationTransferred",
    ]) &&
    exactKeysV1(classification, [
      "classifierId",
      "status",
      "latestCycleIndex",
      "consecutiveCyclesRequired",
      "minimumConsecutiveCycles",
      "acceptedEvidenceRole",
      "evidenceCycleIndices",
      "latestPeriod1MaximumNormalizedDelta",
      "latestPeriod2MaximumNormalizedDelta",
      "physiologicalAcceptanceEstablished",
      "independentValidationEstablished",
      "releaseAcceptanceEstablished",
    ]) &&
    summary.period1ClassifierInputs.every((input) =>
      exactKeysV1(input, [
        "cycleIndex",
        "evidenceRole",
        "protocolIdentityHash",
        "period1MaximumNormalizedDelta",
        "period2MaximumNormalizedDelta",
      ]),
    ) &&
    exactKeysV1(closure, [
      "closureId",
      "referenceScaleSetId",
      "coronaryClosure",
      "compatibility",
      "provenance",
      "gates",
      "groups",
      "overall",
    ]) &&
    exactKeysV1(closure.provenance, [
      "sourcePeriodSec",
      "periodLag",
      "currentAcceptedTimeSec",
      "referenceAcceptedTimeSec",
      "acceptedTimeAdvanceSec",
      "currentRevision",
      "referenceRevision",
      "revisionAdvance",
      "currentRegularNextSourceSequence",
      "referenceRegularNextSourceSequence",
      "regularSourceSequenceAdvance",
      "atrialCaptureCountAdvance",
      "ventricularCaptureCountAdvance",
      "deliveredCalciumDepositCountAdvance",
      "proximalAvAcceptedCountAdvance",
      "distalAcceptedCountAdvance",
      "ventricularBackupFeedbackCountAdvance",
      "intervalStrengthCaptureCountAdvance",
    ]) &&
    exactKeysV1(closure.gates, [
      "ownerClocksAndRevisionsValid",
      "modelConfigurationsExact",
      "regularSinusLineageAdvancesByPeriodLag",
      "captureAvDistalBackupAndIntervalCountersAdvanceByPeriodLag",
      "withinStateVentricularLineageExact",
      "pendingQueuesCompletelyPaired",
      "dynamicMcsAllOffAndZero",
      "coronaryV3CompatibilityAndEmptyWindowsSatisfied",
    ]) &&
    exactKeysV1(closure.overall, [
      "coronaryNumericEntryCount",
      "coronaryBooleanEntryCount",
      "integratedNumericEntryCount",
      "integratedExactEntryCount",
      "numericEntryCount",
      "exactEntryCount",
      "booleanEntryCount",
      "entryCount",
      "maximumNormalizedDelta",
      "worstGroup",
      "worstPath",
      "worstEntry",
    ])
  );
}

function sourceSummaryEstablishesP1V1(
  summary: MainWireIntegratedModelTransientVenousReturnReductionSourceSummaryV1,
): boolean {
  return (
    summary.executionPurpose === "canonical-evidence" &&
    summary.nominalDtSec === 0.001 &&
    summary.requestedMaximumCycleCount === 250 &&
    summary.terminationReason === "period1-converged" &&
    summary.classification.status === "period1-converged" &&
    summary.numericalPeriod1Established === true &&
    summary.allCyclesFiniteConservedAndEventExact === true &&
    summary.terminalCheckpointExactRoundTripVerified === true &&
    summary.completedCycleCount === summary.terminalCycleIndex &&
    terminalClosureBindingPassedV1(summary, true)
  );
}

function sourceClassifierReplayPassedV1(
  summary: MainWireIntegratedModelTransientVenousReturnReductionSourceSummaryV1,
): boolean {
  const inputs = summary.period1ClassifierInputs;
  const expectedCount =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.consecutiveCycles;
  const latest = inputs.at(-1);
  const consecutive = inputs.every(
    (input, index) =>
      Number.isSafeInteger(input.cycleIndex) &&
      input.cycleIndex >= 1 &&
      (index === 0 || input.cycleIndex === inputs[index - 1]!.cycleIndex + 1),
  );
  const eligible =
    inputs.length === expectedCount &&
    consecutive &&
    inputs.every(
      (input) =>
        input.evidenceRole === "canonical-periodic-protocol" &&
        input.protocolIdentityHash === summary.protocolIdentityHash &&
        Number.isFinite(input.period1MaximumNormalizedDelta) &&
        input.period1MaximumNormalizedDelta >= 0 &&
        (input.period2MaximumNormalizedDelta === null ||
          (Number.isFinite(input.period2MaximumNormalizedDelta) &&
            input.period2MaximumNormalizedDelta >= 0)),
    );
  const p1 =
    eligible &&
    inputs.every(
      ({ period1MaximumNormalizedDelta }) =>
        period1MaximumNormalizedDelta <=
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period1NormalizedTolerance,
    );
  const p2 =
    !p1 &&
    eligible &&
    inputs.every(
      ({ period1MaximumNormalizedDelta, period2MaximumNormalizedDelta }) =>
        period2MaximumNormalizedDelta !== null &&
        period1MaximumNormalizedDelta >=
          MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period2MinimumPeriod1NormalizedDelta &&
        period2MaximumNormalizedDelta <=
          MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period2NormalizedTolerance,
    );
  const expectedStatus = p1
    ? ("period1-converged" as const)
    : p2
      ? ("period2-suspect" as const)
      : ("not-converged" as const);
  const expectedIndices =
    expectedStatus === "not-converged"
      ? []
      : inputs.map(({ cycleIndex }) => cycleIndex);
  const expectedTermination =
    expectedStatus === "period1-converged"
      ? ("period1-converged" as const)
      : expectedStatus === "period2-suspect"
        ? ("period2-suspect" as const)
        : ("maximum-cycles-reached" as const);
  const classification = summary.classification;
  return (
    latest !== undefined &&
    latest.cycleIndex === summary.terminalCycleIndex &&
    classification.classifierId ===
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLASSIFIER_V3_ID &&
    classification.latestCycleIndex === summary.terminalCycleIndex &&
    classification.consecutiveCyclesRequired === expectedCount &&
    classification.minimumConsecutiveCycles === 3 &&
    classification.acceptedEvidenceRole === "canonical-periodic-protocol" &&
    canonicalJsonStringify(classification.evidenceCycleIndices) ===
      canonicalJsonStringify(expectedIndices) &&
    classification.latestPeriod1MaximumNormalizedDelta ===
      latest.period1MaximumNormalizedDelta &&
    classification.latestPeriod2MaximumNormalizedDelta ===
      latest.period2MaximumNormalizedDelta &&
    classification.status === expectedStatus &&
    summary.numericalPeriod1Established === p1 &&
    summary.terminationReason === expectedTermination &&
    classification.physiologicalAcceptanceEstablished === false &&
    classification.independentValidationEstablished === false &&
    classification.releaseAcceptanceEstablished === false
  );
}

function terminalClosureBindingPassedV1(
  summary: MainWireIntegratedModelTransientVenousReturnReductionSourceSummaryV1,
  requireAllGatesPassed: boolean,
): boolean {
  const closure = summary.terminalPeriod1Closure;
  const latest = summary.period1ClassifierInputs.at(-1);
  return (
    latest !== undefined &&
    closure.closureId === MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_V3_ID &&
    closure.referenceScaleSetId ===
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.referenceScaleSetId &&
    (!requireAllGatesPassed ||
      Object.values(closure.gates).every((gate) => gate === true)) &&
    closure.provenance.periodLag === 1 &&
    closure.provenance.sourcePeriodSec === 1 &&
    closure.provenance.currentAcceptedTimeSec ===
      summary.terminalAcceptedTimeSec &&
    closure.provenance.referenceAcceptedTimeSec + 1 ===
      summary.terminalAcceptedTimeSec &&
    closure.provenance.acceptedTimeAdvanceSec === 1 &&
    closure.provenance.currentRevision === summary.terminalAcceptedRevision &&
    closure.provenance.referenceRevision +
      closure.provenance.revisionAdvance ===
      summary.terminalAcceptedRevision &&
    closure.overall.maximumNormalizedDelta ===
      latest.period1MaximumNormalizedDelta
  );
}

function beatExecutionsReplayPassedV1(
  beats: readonly MainWireIntegratedModelTransientVenousReturnReductionBeatExecutionV1[],
  sourceOutcome: MainWireIntegratedModelTransientVenousReturnReductionSourceOutcomeV1,
): boolean {
  if (beats.length === 0) return true;
  const summary = sourceOutcome.summary;
  if (sourceOutcome.status !== "source-p1-established" || summary === null) {
    return false;
  }
  const sourceWindowIndex = summary.terminalCycleIndex;
  const tolerance =
    MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.invariantTolerance;
  const fixedGlobalTotalBloodVolumeMl = beats[0]!.fixedGlobalTotalBloodVolumeMl;
  const atrialCaptureIds = new Set<string>();
  const ventricularCaptureIds = new Set<string>();
  const calciumDepositIds = new Set<string>();
  for (let index = 0; index < beats.length; index += 1) {
    const beat = beats[index]!;
    const ordinal = index + 1;
    const previous = index === 0 ? null : beats[index - 1]!;
    const expectedStartScale =
      mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
        ordinal - 1,
      );
    const expectedMidpointScale =
      mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
        ordinal - 0.5,
      );
    const expectedEndScale =
      mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(ordinal);
    const candidateScaleLowerBound = Math.min(
      expectedStartScale,
      expectedEndScale,
    );
    const candidateScaleUpperBound = Math.max(
      expectedStartScale,
      expectedEndScale,
    );
    const eventIdsAreNew =
      beat.acceptedAtrialCaptureIds.every((id) => !atrialCaptureIds.has(id)) &&
      beat.acceptedVentricularCaptureIds.every(
        (id) => !ventricularCaptureIds.has(id),
      ) &&
      beat.deliveredCalciumDepositIds.every((id) => !calciumDepositIds.has(id));
    beat.acceptedAtrialCaptureIds.forEach((id) => atrialCaptureIds.add(id));
    beat.acceptedVentricularCaptureIds.forEach((id) =>
      ventricularCaptureIds.add(id),
    );
    beat.deliveredCalciumDepositIds.forEach((id) => calciumDepositIds.add(id));
    const numericLeavesFinite = allNumericLeavesFiniteV1({
      startTimeSec: beat.startTimeSec,
      endTimeSec: beat.endTimeSec,
      startAcceptedRevision: beat.startAcceptedRevision,
      terminalAcceptedRevision: beat.terminalAcceptedRevision,
      acceptedStepCount: beat.acceptedStepCount,
      boundaryClippedStepCount: beat.boundaryClippedStepCount,
      resistanceScale: beat.resistanceScale,
      fixedGlobalTotalBloodVolumeMl: beat.fixedGlobalTotalBloodVolumeMl,
      maximumGlobalTotalBloodVolumeErrorMl:
        beat.maximumGlobalTotalBloodVolumeErrorMl,
      maximumCoronaryBloodVolumeLedgerResidualMl:
        beat.maximumCoronaryBloodVolumeLedgerResidualMl,
      maximumDynamicMcsConservationResidualMlPerSec:
        beat.maximumDynamicMcsConservationResidualMlPerSec,
      minimumSystemicVenousReturnMlPerSec:
        beat.minimumSystemicVenousReturnMlPerSec,
      maximumSystemicVenousReturnMlPerSec:
        beat.maximumSystemicVenousReturnMlPerSec,
      rawAcceptedSampleCount: beat.rawAcceptedSampleCount,
    });
    const expectedIntegrity =
      numericLeavesFinite &&
      Number.isSafeInteger(beat.acceptedStepCount) &&
      beat.acceptedStepCount > 0 &&
      Number.isSafeInteger(beat.boundaryClippedStepCount) &&
      beat.boundaryClippedStepCount >= 0 &&
      beat.boundaryClippedStepCount <= beat.acceptedStepCount &&
      Number.isSafeInteger(beat.startAcceptedRevision) &&
      Number.isSafeInteger(beat.terminalAcceptedRevision) &&
      beat.startAcceptedRevision >= 0 &&
      beat.terminalAcceptedRevision ===
        beat.startAcceptedRevision + beat.acceptedStepCount &&
      beat.fixedGlobalTotalBloodVolumeMl > 0 &&
      beat.fixedGlobalTotalBloodVolumeMl === fixedGlobalTotalBloodVolumeMl &&
      beat.maximumGlobalTotalBloodVolumeErrorMl >= 0 &&
      beat.maximumGlobalTotalBloodVolumeErrorMl <=
        tolerance.globalTotalBloodVolumeErrorMl &&
      beat.maximumCoronaryBloodVolumeLedgerResidualMl >= 0 &&
      beat.maximumCoronaryBloodVolumeLedgerResidualMl <=
        tolerance.coronaryBloodVolumeLedgerResidualMl &&
      beat.maximumDynamicMcsConservationResidualMlPerSec >= 0 &&
      beat.maximumDynamicMcsConservationResidualMlPerSec <=
        tolerance.dynamicMcsConservationResidualMlPerSec &&
      beat.acceptedAtrialCaptureIds.length === 1 &&
      beat.acceptedVentricularCaptureIds.length === 1 &&
      beat.deliveredCalciumDepositIds.length === 2 &&
      new Set(beat.acceptedAtrialCaptureIds).size ===
        beat.acceptedAtrialCaptureIds.length &&
      new Set(beat.acceptedVentricularCaptureIds).size ===
        beat.acceptedVentricularCaptureIds.length &&
      new Set(beat.deliveredCalciumDepositIds).size ===
        beat.deliveredCalciumDepositIds.length &&
      eventIdsAreNew &&
      beat.completedCoronaryWindowIndices.length === 1 &&
      Number.isSafeInteger(beat.completedCoronaryWindowIndices[0]) &&
      beat.oneComposedCalciumOwnerOnly &&
      beat.allDynamicMcsAcceptedFlowsExactlyZero &&
      beat.allRawValuesFinite;
    const lineagePassed =
      exactKeysV1(beat, [
        "beatOrdinal",
        "phase",
        "startTimeSec",
        "endTimeSec",
        "startAcceptedRevision",
        "terminalAcceptedRevision",
        "acceptedStepCount",
        "boundaryClippedStepCount",
        "resistanceScale",
        "fixedGlobalTotalBloodVolumeMl",
        "maximumGlobalTotalBloodVolumeErrorMl",
        "maximumCoronaryBloodVolumeLedgerResidualMl",
        "maximumDynamicMcsConservationResidualMlPerSec",
        "acceptedAtrialCaptureIds",
        "acceptedVentricularCaptureIds",
        "deliveredCalciumDepositIds",
        "completedCoronaryWindowIndices",
        "oneComposedCalciumOwnerOnly",
        "allDynamicMcsAcceptedFlowsExactlyZero",
        "allRawValuesFinite",
        "minimumSystemicVenousReturnMlPerSec",
        "maximumSystemicVenousReturnMlPerSec",
        "integrityPassed",
        "rawAcceptedSampleCount",
        "rawAcceptedSamplesSha256",
      ]) &&
      exactKeysV1(beat.resistanceScale, [
        "start",
        "midpoint",
        "end",
        "minimumAcceptedCandidate",
        "maximumAcceptedCandidate",
      ]) &&
      /^[0-9a-f]{64}$/.test(beat.rawAcceptedSamplesSha256) &&
      beat.beatOrdinal === ordinal &&
      beat.phase ===
        mainWireIntegratedModelTransientVenousReturnBeatPhaseV1(ordinal) &&
      beat.startTimeSec === summary.terminalAcceptedTimeSec + index &&
      beat.endTimeSec === summary.terminalAcceptedTimeSec + ordinal &&
      (previous === null
        ? beat.startAcceptedRevision === summary.terminalAcceptedRevision
        : beat.startTimeSec === previous.endTimeSec &&
          beat.startAcceptedRevision === previous.terminalAcceptedRevision) &&
      beat.resistanceScale.start === expectedStartScale &&
      beat.resistanceScale.midpoint === expectedMidpointScale &&
      beat.resistanceScale.end === expectedEndScale &&
      beat.resistanceScale.minimumAcceptedCandidate >=
        candidateScaleLowerBound &&
      beat.resistanceScale.maximumAcceptedCandidate <=
        candidateScaleUpperBound &&
      Number.isSafeInteger(beat.rawAcceptedSampleCount) &&
      beat.rawAcceptedSampleCount === beat.acceptedStepCount + 1 &&
      beat.acceptedAtrialCaptureIds.every(
        (captureId) => typeof captureId === "string" && captureId.length > 0,
      ) &&
      beat.acceptedVentricularCaptureIds.every(
        (captureId) => typeof captureId === "string" && captureId.length > 0,
      ) &&
      beat.deliveredCalciumDepositIds.every(
        (depositId) => typeof depositId === "string" && depositId.length > 0,
      ) &&
      beat.completedCoronaryWindowIndices.length === 1 &&
      beat.completedCoronaryWindowIndices[0] === sourceWindowIndex! + index &&
      beat.minimumSystemicVenousReturnMlPerSec <=
        beat.maximumSystemicVenousReturnMlPerSec &&
      beat.resistanceScale.minimumAcceptedCandidate <=
        beat.resistanceScale.maximumAcceptedCandidate &&
      beat.integrityPassed === expectedIntegrity;
    if (!lineagePassed) return false;
  }
  return true;
}

function comparisonExecutionBindingsPassedV1(
  comparison: MainWireIntegratedModelTransientPvComparisonV1,
  executions: readonly MainWireIntegratedModelTransientVenousReturnReductionBeatExecutionV1[],
): boolean {
  return (
    comparison.beatProjections.length === executions.length &&
    comparison.beatProjections.every((projection, index) => {
      const execution = executions[index];
      return (
        execution !== undefined &&
        projection.beatOrdinal === execution.beatOrdinal &&
        projection.startTimeSec === execution.startTimeSec &&
        projection.endTimeSec === execution.endTimeSec &&
        canonicalJsonStringify(projection.resistanceScale) ===
          canonicalJsonStringify({
            start: execution.resistanceScale.start,
            midpoint: execution.resistanceScale.midpoint,
            end: execution.resistanceScale.end,
          }) &&
        projection.LV.rawEndpointSummary.rawAcceptedSampleCount ===
          execution.rawAcceptedSampleCount &&
        projection.RV.rawEndpointSummary.rawAcceptedSampleCount ===
          execution.rawAcceptedSampleCount &&
        projection.LV.rawEndpointSummary.rawAcceptedSamplesSha256 ===
          execution.rawAcceptedSamplesSha256 &&
        projection.RV.rawEndpointSummary.rawAcceptedSamplesSha256 ===
          execution.rawAcceptedSamplesSha256
      );
    })
  );
}

async function producerProjectionAuditReplayPassedV1(
  audit: MainWireIntegratedModelTransientPvRawProjectionAuditV1 | null,
  executions: readonly MainWireIntegratedModelTransientVenousReturnReductionBeatExecutionV1[],
  comparison: MainWireIntegratedModelTransientPvComparisonV1 | null,
  failure: MainWireIntegratedModelTransientVenousReturnReductionFailureEvidenceV1 | null,
): Promise<boolean> {
  if (audit === null) {
    return (
      comparison === null &&
      (executions.length < 21 ||
        (failure?.failureClass === "landmark-unavailable" &&
          failure.exception !== null))
    );
  }
  if (
    !exactKeysV1(audit, [
      "auditorId",
      "status",
      "rawBeatBindings",
      "rawBeatFamilySha256",
      "projectionFamilySha256",
      "firstMismatchPath",
    ]) ||
    audit.auditorId !==
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_RAW_PROJECTION_AUDITOR_V1_ID ||
    audit.rawBeatBindings.length !== executions.length ||
    !/^[0-9a-f]{64}$/.test(audit.rawBeatFamilySha256) ||
    !/^[0-9a-f]{64}$/.test(audit.projectionFamilySha256)
  ) {
    return false;
  }
  const expectedBindings = executions.map((execution) =>
    Object.freeze({
      beatOrdinal: execution.beatOrdinal,
      startTimeSec: execution.startTimeSec,
      endTimeSec: execution.endTimeSec,
      rawAcceptedSampleCount: execution.rawAcceptedSampleCount,
      rawAcceptedSamplesSha256: execution.rawAcceptedSamplesSha256,
    }),
  );
  if (
    !audit.rawBeatBindings.every((binding) =>
      exactKeysV1(binding, [
        "beatOrdinal",
        "startTimeSec",
        "endTimeSec",
        "rawAcceptedSampleCount",
        "rawAcceptedSamplesSha256",
      ]),
    ) ||
    canonicalJsonStringify(audit.rawBeatBindings) !==
      canonicalJsonStringify(expectedBindings) ||
    audit.rawBeatFamilySha256 !==
      (await sha256CanonicalJsonHex(expectedBindings))
  ) {
    return false;
  }
  if (audit.status === "raw-projection-audit-passed") {
    if (audit.firstMismatchPath !== null) return false;
    if (comparison !== null) {
      return (
        audit.projectionFamilySha256 ===
        (await sha256CanonicalJsonHex(comparison.beatProjections))
      );
    }
    return failure?.failureClass === "relation-integrity-failure";
  }
  return (
    audit.status === "raw-projection-audit-failed" &&
    typeof audit.firstMismatchPath === "string" &&
    audit.firstMismatchPath.length > 0 &&
    comparison === null &&
    failure?.failureClass === "landmark-unavailable"
  );
}

function failureOutcomeReplayPassedV1(
  payload: MainWireIntegratedModelTransientVenousReturnReductionPayloadV1,
): boolean {
  const {
    sourceOutcome,
    beatExecutions,
    producerProjectionAudit,
    comparison,
    comparisonAudit,
    failureEvidence,
  } = payload;
  const allRetainedBeatsPassed = beatExecutions.every(
    ({ integrityPassed }) => integrityPassed,
  );
  const sourceEstablished = sourceOutcome.status === "source-p1-established";

  if (failureEvidence === null) {
    return (
      sourceEstablished &&
      beatExecutions.length === 21 &&
      allRetainedBeatsPassed &&
      producerProjectionAudit?.status === "raw-projection-audit-passed" &&
      comparison !== null &&
      comparisonAudit?.status === "comparison-audit-passed"
    );
  }
  if (!failureEvidenceShapePassedV1(failureEvidence)) return false;

  const noComparison = comparison === null && comparisonAudit === null;
  const noProjectionOrComparison =
    producerProjectionAudit === null && noComparison;
  const sourceSummary = sourceOutcome.summary;
  const lastBeat = beatExecutions.at(-1);
  const precedingTimeSec =
    lastBeat?.endTimeSec ?? sourceSummary?.terminalAcceptedTimeSec ?? null;
  const precedingRevision =
    lastBeat?.terminalAcceptedRevision ??
    sourceSummary?.terminalAcceptedRevision ??
    null;
  const retainedEndpointMatchesFailure =
    precedingTimeSec !== null &&
    precedingRevision !== null &&
    failureEvidence.lastAcceptedTimeSec === precedingTimeSec &&
    failureEvidence.lastAcceptedRevision === precedingRevision;

  switch (failureEvidence.failureClass) {
    case "source-execution-failure":
      return (
        sourceOutcome.status === "source-execution-failed" &&
        sourceOutcome.failureClass === failureEvidence.failureClass &&
        beatExecutions.length === 0 &&
        noProjectionOrComparison &&
        failureEvidence.failedBeatOrdinal === null &&
        failureEvidence.lastAcceptedTimeSec === null &&
        failureEvidence.lastAcceptedRevision === null &&
        failureEvidence.completedBeatCount === 0 &&
        failureEvidence.exception !== null &&
        canonicalJsonStringify(failureEvidence.exception) ===
          canonicalJsonStringify(sourceOutcome.exception)
      );
    case "source-not-p1":
      return (
        sourceOutcome.status === "source-rejected" &&
        sourceOutcome.failureClass === failureEvidence.failureClass &&
        beatExecutions.length === 0 &&
        noProjectionOrComparison &&
        failureEvidence.failedBeatOrdinal === null &&
        failureEvidence.lastAcceptedTimeSec === null &&
        failureEvidence.lastAcceptedRevision === null &&
        failureEvidence.completedBeatCount === 0 &&
        failureEvidence.exception === null
      );
    case "source-binding-failure":
      if (sourceOutcome.status === "source-rejected") {
        return (
          sourceOutcome.failureClass === failureEvidence.failureClass &&
          beatExecutions.length === 0 &&
          noProjectionOrComparison &&
          failureEvidence.failedBeatOrdinal === null &&
          failureEvidence.lastAcceptedTimeSec === null &&
          failureEvidence.lastAcceptedRevision === null &&
          failureEvidence.completedBeatCount === 0 &&
          failureEvidence.exception === null
        );
      }
      return (
        sourceEstablished &&
        beatExecutions.length === 0 &&
        noProjectionOrComparison &&
        failureEvidence.failedBeatOrdinal === null &&
        retainedEndpointMatchesFailure &&
        failureEvidence.completedBeatCount === 0 &&
        failureEvidence.exception === null
      );
    case "trajectory-step-failure": {
      const expectedBeatOrdinal = beatExecutions.length + 1;
      const acceptedTimeSec = failureEvidence.lastAcceptedTimeSec;
      const acceptedRevision = failureEvidence.lastAcceptedRevision;
      const candidateTimeSec = failureEvidence.failedCandidateTimeSec;
      const candidateScale = failureEvidence.failedCandidateResistanceScale;
      const acceptedStateIsInFailedBeat =
        precedingTimeSec !== null &&
        precedingRevision !== null &&
        acceptedTimeSec !== null &&
        acceptedRevision !== null &&
        acceptedTimeSec >= precedingTimeSec &&
        acceptedTimeSec <= precedingTimeSec + 1 &&
        acceptedRevision >= precedingRevision;
      const candidateBindingPassed =
        candidateTimeSec === null
          ? candidateScale === null
          : candidateScale !== null &&
            sourceSummary !== null &&
            candidateTimeSec - sourceSummary.terminalAcceptedTimeSec >= 0 &&
            candidateTimeSec - sourceSummary.terminalAcceptedTimeSec <= 21 &&
            candidateScale ===
              mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
                candidateTimeSec - sourceSummary.terminalAcceptedTimeSec,
              );
      return (
        sourceEstablished &&
        expectedBeatOrdinal >= 1 &&
        expectedBeatOrdinal <= 21 &&
        failureEvidence.failedBeatOrdinal === expectedBeatOrdinal &&
        failureEvidence.completedBeatCount === beatExecutions.length &&
        allRetainedBeatsPassed &&
        noProjectionOrComparison &&
        acceptedStateIsInFailedBeat &&
        candidateBindingPassed
      );
    }
    case "cycle-integrity-failure": {
      const retainedFailedBeat = lastBeat?.integrityPassed === false;
      const expectedBeatOrdinal = retainedFailedBeat
        ? beatExecutions.length
        : beatExecutions.length + 1;
      return (
        sourceEstablished &&
        expectedBeatOrdinal >= 1 &&
        expectedBeatOrdinal <= 21 &&
        failureEvidence.failedBeatOrdinal === expectedBeatOrdinal &&
        failureEvidence.completedBeatCount === beatExecutions.length &&
        noProjectionOrComparison &&
        retainedEndpointMatchesFailure &&
        beatExecutions
          .slice(0, retainedFailedBeat ? -1 : undefined)
          .every(({ integrityPassed }) => integrityPassed) &&
        failureEvidence.failedCandidateTimeSec === null &&
        failureEvidence.failedCandidateResistanceScale === null &&
        failureEvidence.exception === null
      );
    }
    case "landmark-unavailable":
      return (
        sourceEstablished &&
        beatExecutions.length === 21 &&
        allRetainedBeatsPassed &&
        noComparison &&
        failureEvidence.failedBeatOrdinal === 21 &&
        failureEvidence.completedBeatCount === 21 &&
        retainedEndpointMatchesFailure &&
        ((producerProjectionAudit === null &&
          failureEvidence.exception !== null) ||
          (producerProjectionAudit?.status === "raw-projection-audit-failed" &&
            failureEvidence.exception === null))
      );
    case "relation-integrity-failure":
      return (
        sourceEstablished &&
        beatExecutions.length === 21 &&
        allRetainedBeatsPassed &&
        failureEvidence.failedBeatOrdinal === 21 &&
        failureEvidence.completedBeatCount === 21 &&
        retainedEndpointMatchesFailure &&
        producerProjectionAudit?.status === "raw-projection-audit-passed" &&
        ((comparison === null &&
          comparisonAudit === null &&
          failureEvidence.exception !== null) ||
          (comparison !== null &&
            comparisonAudit === null &&
            failureEvidence.exception !== null) ||
          (comparison !== null &&
            comparisonAudit?.status === "comparison-audit-failed" &&
            failureEvidence.exception === null))
      );
    case "artifact-integrity-failure":
      // Artifact serialization is outside the scientific report preimage. A
      // failed write cannot mint a different, apparently valid report arm.
      return false;
  }
}

function failureEvidenceShapePassedV1(
  failure: MainWireIntegratedModelTransientVenousReturnReductionFailureEvidenceV1,
): boolean {
  const exceptionShapePassed =
    failure.exception === null ||
    (exactKeysV1(failure.exception, ["name", "message"]) &&
      failure.exception.name.length > 0 &&
      failure.exception.message.length > 0);
  const acceptedEndpointShapePassed =
    (failure.lastAcceptedTimeSec === null &&
      failure.lastAcceptedRevision === null) ||
    (failure.lastAcceptedTimeSec !== null &&
      Number.isFinite(failure.lastAcceptedTimeSec) &&
      failure.lastAcceptedRevision !== null &&
      Number.isSafeInteger(failure.lastAcceptedRevision) &&
      failure.lastAcceptedRevision >= 0);
  const failedCandidateShapePassed =
    (failure.failedCandidateTimeSec === null &&
      failure.failedCandidateResistanceScale === null) ||
    (failure.failedCandidateTimeSec !== null &&
      Number.isFinite(failure.failedCandidateTimeSec) &&
      failure.failedCandidateResistanceScale !== null &&
      Number.isFinite(failure.failedCandidateResistanceScale));
  return (
    exactKeysV1(failure, [
      "failureClass",
      "failedBeatOrdinal",
      "lastAcceptedTimeSec",
      "lastAcceptedRevision",
      "failedCandidateTimeSec",
      "failedCandidateResistanceScale",
      "completedBeatCount",
      "message",
      "exception",
    ]) &&
    (failure.failedBeatOrdinal === null ||
      (Number.isSafeInteger(failure.failedBeatOrdinal) &&
        failure.failedBeatOrdinal >= 1 &&
        failure.failedBeatOrdinal <= 21)) &&
    Number.isSafeInteger(failure.completedBeatCount) &&
    failure.completedBeatCount >= 0 &&
    failure.completedBeatCount <= 21 &&
    failure.message.length > 0 &&
    acceptedEndpointShapePassed &&
    failedCandidateShapePassed &&
    exceptionShapePassed
  );
}

function failureEvidenceV1(
  input: Partial<MainWireIntegratedModelTransientVenousReturnReductionFailureEvidenceV1> &
    Pick<
      MainWireIntegratedModelTransientVenousReturnReductionFailureEvidenceV1,
      "failureClass" | "message"
    >,
): MainWireIntegratedModelTransientVenousReturnReductionFailureEvidenceV1 {
  return Object.freeze({
    failureClass: input.failureClass,
    failedBeatOrdinal: input.failedBeatOrdinal ?? null,
    lastAcceptedTimeSec: input.lastAcceptedTimeSec ?? null,
    lastAcceptedRevision: input.lastAcceptedRevision ?? null,
    failedCandidateTimeSec: input.failedCandidateTimeSec ?? null,
    failedCandidateResistanceScale:
      input.failedCandidateResistanceScale ?? null,
    completedBeatCount: input.completedBeatCount ?? 0,
    message: input.message,
    exception: input.exception ?? null,
  });
}

function sanitizeExceptionV1(
  error: unknown,
): MainWireIntegratedModelTransientVenousReturnReductionSanitizedExceptionV1 {
  return Object.freeze({
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : String(error),
  });
}

function allNumericLeavesFiniteV1(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (value === null || typeof value !== "object") return true;
  return Object.values(value).every(allNumericLeavesFiniteV1);
}

function exactKeysV1(value: object, expectedKeys: readonly string[]): boolean {
  return (
    canonicalJsonStringify(Object.keys(value).sort()) ===
    canonicalJsonStringify([...expectedKeys].sort())
  );
}

function deepFreezeV1<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreezeV1(child);
    }
  }
  return value;
}
