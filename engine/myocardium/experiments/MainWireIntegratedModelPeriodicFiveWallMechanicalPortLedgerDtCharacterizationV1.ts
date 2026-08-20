import type { MainWireIntegratedModelCheckpointV3 } from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  auditMainWireFiveWallMechanicalPortLedgerThreeGridV1,
  characterizeMainWireFiveWallMechanicalPortLedgerThreeGridV1,
  projectMainWireFiveWallMechanicalPortLedgerDtV1,
  type MainWireFiveWallMechanicalPortLedgerDtProjectionV1,
  type MainWireFiveWallMechanicalPortLedgerThreeGridCharacterizationV1,
} from "@/engine/myocardium/diagnostics/MainWireFiveWallMechanicalPortLedgerDtProjectionV1";
import type { MainWireFiveWallMechanicalPortLedgerV1 } from "@/engine/myocardium/diagnostics/MainWireFiveWallMechanicalPortLedgerEngineeringV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_CHARACTERIZATION_V1_ID,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_DECLARATION_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_NEGATIVE_CLAIMS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_PAYLOAD_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_PAYLOAD_SHA256_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_REPORT_V1_ID,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ACCESS_V1_ID,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ARMS_V1,
  type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmIdV1,
  type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationDefinitionV1";
import {
  continueMainWireIntegratedModelPeriodicMechanicalPortLedgerForDtCharacterizationV1,
  normalAdultMainWireFiveWallMechanicalPortMaterialBindingV1,
  type MainWireIntegratedModelPeriodicMechanicalPortContinuationV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerEngineeringV1";
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
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  runMainWireIntegratedModelPeriodicSteadyV3,
  type MainWireIntegratedModelPeriodicSteadyResultV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";

export type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSanitizedExceptionV1 =
  Readonly<{
    name: string;
    message: string;
  }>;

export type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSourceClassifierInputV1 =
  Readonly<{
    cycleIndex: number;
    evidenceRole: MainWireIntegratedModelPeriodicSteadyResultV3["observations"][number]["evidenceRole"];
    protocolIdentityHash: string;
    period1MaximumNormalizedDelta: number;
    period2MaximumNormalizedDelta: number | null;
  }>;

export type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSourceSummaryV1 =
  Readonly<{
    experimentId: MainWireIntegratedModelPeriodicSteadyResultV3["experimentId"];
    executionPurpose: MainWireIntegratedModelPeriodicSteadyResultV3["executionPurpose"];
    nominalDtSec: number;
    requestedMaximumCycleCount: number;
    completedCycleCount: number;
    terminationReason: MainWireIntegratedModelPeriodicSteadyResultV3["terminationReason"];
    protocolIdentityHash: string;
    modelConditionIdentityHash: string;
    classification: MainWireIntegratedModelPeriodicSteadyResultV3["classification"];
    numericalPeriod1Established: boolean;
    allCyclesFiniteConservedAndEventExact: boolean;
    terminalCheckpointExactRoundTripVerified: true;
    terminalCheckpointSha256: string;
    terminalCycleIndex: number;
    terminalAcceptedTimeSec: number;
    terminalAcceptedRevision: number;
    period1ClassifierInputs: readonly MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSourceClassifierInputV1[];
    terminalPeriod1Closure: MainWireIntegratedModelPeriodicSteadyResultV3["cycles"][number]["period1"];
    internallyOwnedSourceExecution: true;
    canonicalSourceAuthenticationEstablished: false;
    historicalQualificationTransferred: false;
  }>;

export type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSourceOutcomeV1 =
  | Readonly<{
      status: "source-p1-established";
      failureClass: null;
      summary: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSourceSummaryV1;
      exception: null;
    }>
  | Readonly<{
      status: "source-rejected";
      failureClass: "source-not-p1" | "shared-checkpoint-binding-failure";
      summary: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSourceSummaryV1;
      exception: null;
    }>
  | Readonly<{
      status: "source-execution-failed";
      failureClass: "source-execution-failure";
      summary: null;
      exception: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSanitizedExceptionV1;
    }>;

export type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtCycleSummaryV1 =
  Readonly<{
    startTimeSec: number;
    endTimeSec: number;
    startAcceptedRevision: number;
    terminalAcceptedRevision: number;
    acceptedStepCount: number;
    coronaryWindowIndex: number;
    maximumGlobalTotalBloodVolumeErrorMl: number;
    maximumCoronaryBloodVolumeLedgerResidualMl: number;
    maximumDynamicMcsConservationResidualMlPerSec: number;
    allRawValuesFinite: boolean;
    oneComposedCalciumOwnerOnly: boolean;
    allDynamicMcsAcceptedFlowsExactlyZero: boolean;
  }>;

export type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtContinuationEvidenceV1 =
  Readonly<{
    sourceCycleIndex: number;
    sourceCheckpointSha256: string;
    sourceCheckpointExactRoundTripVerified: true;
    materialBinding: MainWireIntegratedModelPeriodicMechanicalPortContinuationV1["materialBinding"];
    bridgeCycle: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtCycleSummaryV1;
    measurementCycle: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtCycleSummaryV1;
    measurementAcceptedIntervalCount: number;
    terminalCheckpointSha256: string;
    terminalCheckpointExactRoundTripVerified: true;
  }>;

export type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmOutcomeV1 =
  | Readonly<{
      status: "fulfilled";
      failureClass: null;
      armId: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmIdV1;
      nominalDtSec: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmV1["nominalDtSec"];
      numericalAccessId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ACCESS_V1_ID;
      maximumAcceptedStepCountPerCycle: number;
      sourceCycleIndex: number;
      sourceCheckpointSha256: string;
      sourceCheckpointExactRoundTripVerified: true;
      bridgeCycle: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtCycleSummaryV1;
      measurementCycle: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtCycleSummaryV1;
      measurementAcceptedIntervalCount: number;
      terminalCheckpointSha256: string;
      terminalCheckpointExactRoundTripVerified: true;
      ledger: MainWireFiveWallMechanicalPortLedgerV1;
      projection: MainWireFiveWallMechanicalPortLedgerDtProjectionV1;
      exception: null;
    }>
  | Readonly<{
      status: "failed";
      failureClass:
        | "arm-execution-failure"
        | "ledger-integrity-failure"
        | "projection-integrity-failure";
      armId: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmIdV1;
      nominalDtSec: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmV1["nominalDtSec"];
      numericalAccessId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ACCESS_V1_ID;
      maximumAcceptedStepCountPerCycle: number;
      sourceCheckpointSha256: string | null;
      retainedContinuationEvidence: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtContinuationEvidenceV1 | null;
      ledger: MainWireFiveWallMechanicalPortLedgerV1 | null;
      projection: null;
      exception: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSanitizedExceptionV1;
    }>
  | Readonly<{
      status: "not-attempted-source-unavailable";
      failureClass:
        | "source-not-p1"
        | "source-execution-failure"
        | "shared-checkpoint-binding-failure";
      armId: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmIdV1;
      nominalDtSec: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmV1["nominalDtSec"];
      numericalAccessId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ACCESS_V1_ID;
      maximumAcceptedStepCountPerCycle: number;
      sourceCheckpointSha256: null;
      ledger: null;
      projection: null;
      exception: null;
    }>;

export type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtAssessmentV1 =
  Readonly<{
    sourceP1Established: boolean;
    exactArmSetAndOrderRetained: boolean;
    allThreeArmsAttemptedAfterSourceSuccess: boolean;
    allThreeArmsFulfilled: boolean;
    allArmsBindSharedSourceCheckpoint: boolean;
    allLedgerAndProjectionPayloadsRetained: boolean;
    independentProjectionAndTrendReplayPassed: boolean;
    threeGridMechanicalPortLedgerCharacterizationCompleted: boolean;
    firstFailureClass:
      | "source-not-p1"
      | "source-execution-failure"
      | "shared-checkpoint-binding-failure"
      | "arm-execution-failure"
      | "ledger-integrity-failure"
      | "projection-integrity-failure"
      | "artifact-integrity-failure"
      | null;
    numericalTrendIsQualificationGate: false;
  }>;

export type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtPayloadV1 =
  Readonly<{
    reportSchemaId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_REPORT_V1_ID;
    characterizationOwnerId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_CHARACTERIZATION_V1_ID;
    declaration: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_DECLARATION_V1;
    implementationCommitSha: string;
    protocolPayload: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_PAYLOAD_V1;
    protocolPayloadSha256: string;
    sourceOutcome: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSourceOutcomeV1;
    armOutcomes: readonly MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmOutcomeV1[];
    characterization: MainWireFiveWallMechanicalPortLedgerThreeGridCharacterizationV1 | null;
    assessment: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtAssessmentV1;
    negativeClaims: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_NEGATIVE_CLAIMS_V1;
  }>;

export type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1 =
  Readonly<{
    payload: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtPayloadV1;
    payloadSha256: string;
  }>;

export type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportAuditV1 =
  Readonly<{
    status: "report-audit-passed" | "report-audit-failed";
    firstMismatchPath: string | null;
    protocolBindingPassed: boolean;
    reportIdentityPassed: boolean;
    sourceOutcomeShapePassed: boolean;
    sourceIdentityReplayPassed: boolean;
    armOutcomeShapePassed: boolean;
    independentProjectionAndTrendReplayPassed: boolean;
    assessmentReplayPassed: boolean;
    payloadHashReplayPassed: boolean;
  }>;

type PreparedSourceV1 = Readonly<{
  fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3;
  summary: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSourceSummaryV1;
  sourceCycleIndex: number;
  sourceCheckpoint: MainWireIntegratedModelCheckpointV3;
}>;

export type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtExecutionDependenciesV1 =
  Readonly<{
    runSource: () => Promise<MainWireIntegratedModelPeriodicSteadyResultV3>;
    createFixture: () => MainWireIntegratedModelRegularSinusAllOffFixtureV3;
    continueArm: (
      input: Readonly<{
        fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3;
        sourceCheckpoint: MainWireIntegratedModelCheckpointV3;
        sourceCycleIndex: number;
        nominalDtSec: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmV1["nominalDtSec"];
        numericalAccessId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ACCESS_V1_ID;
      }>,
    ) => Promise<MainWireIntegratedModelPeriodicMechanicalPortContinuationV1>;
  }>;

export async function runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationV1(
  input: Readonly<{ implementationCommitSha: string }>,
): Promise<MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1> {
  return runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationWithDependenciesV1(
    input,
    {
      runSource: () =>
        runMainWireIntegratedModelPeriodicSteadyV3({
          nominalDtSec: 0.001,
          maximumCycleCount: 250,
          executionPurpose: "canonical-evidence",
        }),
      createFixture: () =>
        createMainWireIntegratedModelRegularSinusAllOffFixtureV3(),
      continueArm: (armInput) =>
        continueMainWireIntegratedModelPeriodicMechanicalPortLedgerForDtCharacterizationV1(
          armInput,
        ),
    },
  );
}

/** Test-only dependency seam. It is not used by the zero-argument target tool. */
export async function runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationWithDependenciesV1(
  input: Readonly<{ implementationCommitSha: string }>,
  dependencies: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtExecutionDependenciesV1,
): Promise<MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1> {
  assertImplementationCommitShaV1(input.implementationCommitSha);
  let prepared: PreparedSourceV1 | null = null;
  let sourceOutcome: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSourceOutcomeV1;
  try {
    const source = await dependencies.runSource();
    const fixture = dependencies.createFixture();
    const summary = sourceSummaryV1(source);
    const p1 = isP1SourceV1(source);
    if (!p1) {
      sourceOutcome = deepFreeze({
        status: "source-rejected" as const,
        failureClass: "source-not-p1" as const,
        summary,
        exception: null,
      });
    } else {
      const bindingsPassed = await sourceBindingsPassedV1(source, fixture);
      if (!bindingsPassed) {
        sourceOutcome = deepFreeze({
          status: "source-rejected" as const,
          failureClass: "shared-checkpoint-binding-failure" as const,
          summary,
          exception: null,
        });
      } else {
        prepared = {
          fixture,
          summary,
          sourceCycleIndex: summary.terminalCycleIndex,
          sourceCheckpoint: source.terminalCheckpoint,
        };
        sourceOutcome = deepFreeze({
          status: "source-p1-established" as const,
          failureClass: null,
          summary,
          exception: null,
        });
      }
    }
  } catch (error) {
    sourceOutcome = deepFreeze({
      status: "source-execution-failed" as const,
      failureClass: "source-execution-failure" as const,
      summary: null,
      exception: sanitizeExceptionV1(error),
    });
  }

  const armOutcomes: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmOutcomeV1[] =
    [];
  for (const arm of MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ARMS_V1) {
    if (prepared === null) {
      armOutcomes.push(
        deepFreeze({
          status: "not-attempted-source-unavailable" as const,
          failureClass: sourceOutcome.failureClass!,
          armId: arm.armId,
          nominalDtSec: arm.nominalDtSec,
          numericalAccessId:
            MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ACCESS_V1_ID,
          maximumAcceptedStepCountPerCycle:
            arm.maximumAcceptedStepCountPerCycle,
          sourceCheckpointSha256: null,
          ledger: null,
          projection: null,
          exception: null,
        }),
      );
      continue;
    }
    armOutcomes.push(await executeArmV1(prepared, arm, dependencies));
  }

  let characterization: MainWireFiveWallMechanicalPortLedgerThreeGridCharacterizationV1 | null =
    null;
  if (armOutcomes.every(isFulfilledArmV1)) {
    characterization =
      await characterizeMainWireFiveWallMechanicalPortLedgerThreeGridV1(
        armOutcomes.map((outcome) => outcome.projection),
      );
  }
  return createReportV1(
    input.implementationCommitSha,
    sourceOutcome,
    armOutcomes,
    characterization,
  );
}

export async function auditMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
  report: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1,
): Promise<MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportAuditV1> {
  const protocolPayloadSha256 = await sha256CanonicalJsonHex(
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_PAYLOAD_V1,
  );
  const reportIdentityPassed =
    report.payload.reportSchemaId ===
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_REPORT_V1_ID &&
    report.payload.characterizationOwnerId ===
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_CHARACTERIZATION_V1_ID &&
    /^[0-9a-f]{40}$/.test(report.payload.implementationCommitSha);
  const protocolBindingPassed =
    canonicalJsonStringify(report.payload.declaration) ===
      canonicalJsonStringify(
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_DECLARATION_V1,
      ) &&
    canonicalJsonStringify(report.payload.protocolPayload) ===
      canonicalJsonStringify(
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_PAYLOAD_V1,
      ) &&
    report.payload.protocolPayloadSha256 === protocolPayloadSha256 &&
    protocolPayloadSha256 ===
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_PAYLOAD_SHA256_V1 &&
    canonicalJsonStringify(report.payload.negativeClaims) ===
      canonicalJsonStringify(
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_NEGATIVE_CLAIMS_V1,
      );
  const sourceOutcomeShapePassed = sourceOutcomeShapePassedV1(
    report.payload.sourceOutcome,
  );
  const sourceIdentityReplayPassed = await sourceIdentityReplayPassedV1(
    report.payload.sourceOutcome,
  );
  const armOutcomeShapePassed = await armOutcomeShapePassedV1(
    report.payload.sourceOutcome,
    report.payload.armOutcomes,
  );

  const independentProjectionAndTrendReplayPassed =
    await auditRetainedArmProjectionsAndTrendV1(
      report.payload.armOutcomes,
      report.payload.characterization,
    );

  const expectedAssessment = assessmentV1(
    report.payload.sourceOutcome,
    report.payload.armOutcomes,
    independentProjectionAndTrendReplayPassed,
  );
  const assessmentReplayPassed =
    canonicalJsonStringify(expectedAssessment) ===
    canonicalJsonStringify(report.payload.assessment);
  const payloadHashReplayPassed =
    report.payloadSha256 === (await sha256CanonicalJsonHex(report.payload));
  const gates = {
    reportIdentityPassed,
    protocolBindingPassed,
    sourceOutcomeShapePassed,
    sourceIdentityReplayPassed,
    armOutcomeShapePassed,
    independentProjectionAndTrendReplayPassed,
    assessmentReplayPassed,
    payloadHashReplayPassed,
  };
  const firstMismatchPath =
    Object.entries(gates).find(([, passed]) => !passed)?.[0] ?? null;
  return deepFreeze({
    status:
      firstMismatchPath === null
        ? ("report-audit-passed" as const)
        : ("report-audit-failed" as const),
    firstMismatchPath,
    ...gates,
  });
}

async function executeArmV1(
  prepared: PreparedSourceV1,
  arm: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmV1,
  dependencies: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtExecutionDependenciesV1,
): Promise<MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmOutcomeV1> {
  let phase: "continuation" | "ledger-retained" | "projection" = "continuation";
  let ledger: MainWireFiveWallMechanicalPortLedgerV1 | null = null;
  let retainedContinuationEvidence: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtContinuationEvidenceV1 | null =
    null;
  try {
    const continuation = await dependencies.continueArm({
      fixture: prepared.fixture,
      sourceCheckpoint: prepared.sourceCheckpoint,
      sourceCycleIndex: prepared.sourceCycleIndex,
      nominalDtSec: arm.nominalDtSec,
      numericalAccessId:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ACCESS_V1_ID,
    });
    retainedContinuationEvidence = continuationEvidenceV1(continuation);
    ledger = continuation.ledger;
    phase = "ledger-retained";
    assertContinuationBindingV1(
      prepared,
      arm,
      retainedContinuationEvidence,
      ledger,
    );
    phase = "projection";
    const projection = await projectMainWireFiveWallMechanicalPortLedgerDtV1(
      arm.armId,
      ledger,
    );
    return deepFreeze({
      status: "fulfilled" as const,
      failureClass: null,
      armId: arm.armId,
      nominalDtSec: arm.nominalDtSec,
      numericalAccessId:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ACCESS_V1_ID,
      maximumAcceptedStepCountPerCycle: arm.maximumAcceptedStepCountPerCycle,
      sourceCycleIndex: continuation.sourceCycleIndex,
      sourceCheckpointSha256: continuation.sourceCheckpointSha256,
      sourceCheckpointExactRoundTripVerified:
        continuation.sourceCheckpointExactRoundTripVerified,
      bridgeCycle: cycleSummaryV1(continuation.bridgeCycle),
      measurementCycle: cycleSummaryV1(continuation.measurementCycle),
      measurementAcceptedIntervalCount:
        continuation.measurementAcceptedIntervals.length,
      terminalCheckpointSha256:
        continuation.terminalCheckpoint.checkpointSha256,
      terminalCheckpointExactRoundTripVerified:
        continuation.terminalCheckpointExactRoundTripVerified,
      ledger,
      projection,
      exception: null,
    });
  } catch (error) {
    return deepFreeze({
      status: "failed" as const,
      failureClass:
        phase === "continuation"
          ? ("arm-execution-failure" as const)
          : phase === "ledger-retained"
            ? ("ledger-integrity-failure" as const)
            : ("projection-integrity-failure" as const),
      armId: arm.armId,
      nominalDtSec: arm.nominalDtSec,
      numericalAccessId:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ACCESS_V1_ID,
      maximumAcceptedStepCountPerCycle: arm.maximumAcceptedStepCountPerCycle,
      sourceCheckpointSha256:
        retainedContinuationEvidence?.sourceCheckpointSha256 ?? null,
      retainedContinuationEvidence,
      ledger,
      projection: null,
      exception: sanitizeExceptionV1(error),
    });
  }
}

async function createReportV1(
  implementationCommitSha: string,
  sourceOutcome: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSourceOutcomeV1,
  armOutcomes: readonly MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmOutcomeV1[],
  characterization: MainWireFiveWallMechanicalPortLedgerThreeGridCharacterizationV1 | null,
): Promise<MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1> {
  const independentReplayPassed = await auditRetainedArmProjectionsAndTrendV1(
    armOutcomes,
    characterization,
  );
  const payload = deepFreeze({
    reportSchemaId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_REPORT_V1_ID,
    characterizationOwnerId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_CHARACTERIZATION_V1_ID,
    declaration:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_DECLARATION_V1,
    implementationCommitSha,
    protocolPayload:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_PAYLOAD_V1,
    protocolPayloadSha256: await sha256CanonicalJsonHex(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_PAYLOAD_V1,
    ),
    sourceOutcome,
    armOutcomes,
    characterization,
    assessment: assessmentV1(
      sourceOutcome,
      armOutcomes,
      independentReplayPassed,
    ),
    negativeClaims:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_NEGATIVE_CLAIMS_V1,
  }) satisfies MainWireIntegratedModelPeriodicMechanicalPortLedgerDtPayloadV1;
  return deepFreeze({
    payload,
    payloadSha256: await sha256CanonicalJsonHex(payload),
  });
}

function assessmentV1(
  sourceOutcome: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSourceOutcomeV1,
  armOutcomes: readonly MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmOutcomeV1[],
  independentProjectionAndTrendReplayPassed: boolean,
): MainWireIntegratedModelPeriodicMechanicalPortLedgerDtAssessmentV1 {
  const sourceP1Established = sourceOutcome.status === "source-p1-established";
  const exactArmSetAndOrderRetained =
    armOutcomes.length === 3 &&
    armOutcomes.every(
      (outcome, index) =>
        outcome.armId ===
          MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ARMS_V1[
            index
          ]!.armId &&
        outcome.nominalDtSec ===
          MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ARMS_V1[
            index
          ]!.nominalDtSec &&
        outcome.numericalAccessId ===
          MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ACCESS_V1_ID &&
        outcome.maximumAcceptedStepCountPerCycle ===
          MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ARMS_V1[
            index
          ]!.maximumAcceptedStepCountPerCycle,
    );
  const allThreeArmsAttemptedAfterSourceSuccess = sourceP1Established
    ? armOutcomes.every(
        (outcome) =>
          outcome.status === "fulfilled" || outcome.status === "failed",
      )
    : armOutcomes.every(
        (outcome) => outcome.status === "not-attempted-source-unavailable",
      );
  const allThreeArmsFulfilled = armOutcomes.every(isFulfilledArmV1);
  const sharedCheckpoint =
    sourceOutcome.summary?.terminalCheckpointSha256 ?? null;
  const allArmsBindSharedSourceCheckpoint =
    sharedCheckpoint !== null &&
    armOutcomes.every((outcome) =>
      outcome.status === "fulfilled"
        ? outcome.sourceCheckpointSha256 === sharedCheckpoint
        : outcome.status === "failed" &&
            outcome.retainedContinuationEvidence !== null
          ? outcome.sourceCheckpointSha256 === sharedCheckpoint &&
            outcome.retainedContinuationEvidence.sourceCheckpointSha256 ===
              sharedCheckpoint
          : false,
    );
  const allLedgerAndProjectionPayloadsRetained = armOutcomes.every(
    (outcome) =>
      outcome.status === "fulfilled" &&
      outcome.ledger !== null &&
      outcome.projection !== null,
  );
  const completed =
    sourceP1Established &&
    exactArmSetAndOrderRetained &&
    allThreeArmsAttemptedAfterSourceSuccess &&
    allThreeArmsFulfilled &&
    allArmsBindSharedSourceCheckpoint &&
    allLedgerAndProjectionPayloadsRetained &&
    independentProjectionAndTrendReplayPassed;
  return deepFreeze({
    sourceP1Established,
    exactArmSetAndOrderRetained,
    allThreeArmsAttemptedAfterSourceSuccess,
    allThreeArmsFulfilled,
    allArmsBindSharedSourceCheckpoint,
    allLedgerAndProjectionPayloadsRetained,
    independentProjectionAndTrendReplayPassed,
    threeGridMechanicalPortLedgerCharacterizationCompleted: completed,
    firstFailureClass: completed
      ? null
      : (sourceOutcome.failureClass ??
        armOutcomes.find((outcome) => outcome.failureClass !== null)
          ?.failureClass ??
        "artifact-integrity-failure"),
    numericalTrendIsQualificationGate: false as const,
  });
}

async function auditRetainedArmProjectionsAndTrendV1(
  armOutcomes: readonly MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmOutcomeV1[],
  characterization: MainWireFiveWallMechanicalPortLedgerThreeGridCharacterizationV1 | null,
): Promise<boolean> {
  for (const outcome of armOutcomes) {
    if (outcome.status !== "fulfilled") continue;
    const expected = await projectMainWireFiveWallMechanicalPortLedgerDtV1(
      outcome.armId,
      outcome.ledger,
    );
    if (
      canonicalJsonStringify(expected) !==
      canonicalJsonStringify(outcome.projection)
    )
      return false;
  }
  if (!armOutcomes.every(isFulfilledArmV1)) return characterization === null;
  if (characterization === null) return false;
  const fulfilled = armOutcomes;
  const audit = await auditMainWireFiveWallMechanicalPortLedgerThreeGridV1(
    {
      coarse: fulfilled[0]!.ledger,
      middle: fulfilled[1]!.ledger,
      fine: fulfilled[2]!.ledger,
    },
    fulfilled.map((arm) => arm.projection),
    characterization,
  );
  return audit.status === "audit-passed";
}

function sourceSummaryV1(
  source: MainWireIntegratedModelPeriodicSteadyResultV3,
): MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSourceSummaryV1 {
  const terminalCycle = source.cycles.at(-1);
  const terminalObservation = source.observations.at(-1);
  if (terminalCycle === undefined)
    throw new Error("mechanical-port dt source has no completed cycle");
  if (
    terminalObservation === undefined ||
    terminalObservation.cycleIndex !== terminalCycle.cycleIndex ||
    canonicalJsonStringify(terminalObservation.period1) !==
      canonicalJsonStringify(terminalCycle.period1)
  )
    throw new Error("mechanical-port dt source terminal comparator differs");
  const period1ClassifierInputs = source.observations
    .slice(-MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.consecutiveCycles)
    .map((observation) => ({
      cycleIndex: observation.cycleIndex,
      evidenceRole: observation.evidenceRole,
      protocolIdentityHash: observation.protocolIdentityHash,
      period1MaximumNormalizedDelta:
        observation.period1.overall.maximumNormalizedDelta,
      period2MaximumNormalizedDelta:
        observation.period2?.overall.maximumNormalizedDelta ?? null,
    }));
  return deepFreeze({
    experimentId: source.experimentId,
    executionPurpose: source.executionPurpose,
    nominalDtSec: source.nominalDtSec,
    requestedMaximumCycleCount: source.requestedMaximumCycleCount,
    completedCycleCount: source.completedCycleCount,
    terminationReason: source.terminationReason,
    protocolIdentityHash: source.protocolIdentityHash,
    modelConditionIdentityHash: source.modelConditionIdentityHash,
    classification: source.classification,
    numericalPeriod1Established: source.numericalPeriod1Established,
    allCyclesFiniteConservedAndEventExact:
      source.allCyclesFiniteConservedAndEventExact,
    terminalCheckpointExactRoundTripVerified:
      source.terminalCheckpointExactRoundTripVerified,
    terminalCheckpointSha256: source.terminalCheckpoint.checkpointSha256,
    terminalCycleIndex: source.terminalCycleTrace.cycleIndex,
    terminalAcceptedTimeSec: source.terminalAcceptedState.acceptedTimeSec,
    terminalAcceptedRevision: source.terminalAcceptedState.revision,
    period1ClassifierInputs,
    terminalPeriod1Closure: terminalCycle.period1,
    internallyOwnedSourceExecution: true as const,
    canonicalSourceAuthenticationEstablished: false as const,
    historicalQualificationTransferred: false as const,
  });
}

function isP1SourceV1(
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

async function sourceBindingsPassedV1(
  source: MainWireIntegratedModelPeriodicSteadyResultV3,
  fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
): Promise<boolean> {
  const [conditionIdentityHash, protocolIdentityHash] = await Promise.all([
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
  return (
    conditionIdentityHash === source.modelConditionIdentityHash &&
    protocolIdentityHash === source.protocolIdentityHash &&
    /^[0-9a-f]{64}$/.test(source.terminalCheckpoint.checkpointSha256)
  );
}

function assertContinuationBindingV1(
  prepared: PreparedSourceV1,
  arm: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmV1,
  continuation: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtContinuationEvidenceV1,
  ledger: MainWireFiveWallMechanicalPortLedgerV1,
): void {
  if (!continuationBindingPassedV1(prepared.summary, arm, continuation, ledger))
    throw new Error("mechanical-port dt continuation binding differs");
}

function continuationEvidenceV1(
  continuation: MainWireIntegratedModelPeriodicMechanicalPortContinuationV1,
): MainWireIntegratedModelPeriodicMechanicalPortLedgerDtContinuationEvidenceV1 {
  return deepFreeze({
    sourceCycleIndex: continuation.sourceCycleIndex,
    sourceCheckpointSha256: continuation.sourceCheckpointSha256,
    sourceCheckpointExactRoundTripVerified:
      continuation.sourceCheckpointExactRoundTripVerified,
    materialBinding: continuation.materialBinding,
    bridgeCycle: cycleSummaryV1(continuation.bridgeCycle),
    measurementCycle: cycleSummaryV1(continuation.measurementCycle),
    measurementAcceptedIntervalCount:
      continuation.measurementAcceptedIntervals.length,
    terminalCheckpointSha256: continuation.terminalCheckpoint.checkpointSha256,
    terminalCheckpointExactRoundTripVerified:
      continuation.terminalCheckpointExactRoundTripVerified,
  });
}

function cycleSummaryV1(
  cycle: MainWireIntegratedModelPeriodicMechanicalPortContinuationV1["bridgeCycle"],
): MainWireIntegratedModelPeriodicMechanicalPortLedgerDtCycleSummaryV1 {
  return deepFreeze({
    startTimeSec: cycle.startTimeSec,
    endTimeSec: cycle.endTimeSec,
    startAcceptedRevision:
      cycle.terminalAcceptedState.revision - cycle.acceptedStepCount,
    terminalAcceptedRevision: cycle.terminalAcceptedState.revision,
    acceptedStepCount: cycle.acceptedStepCount,
    coronaryWindowIndex: cycle.coronaryAutoregulationWindow.windowIndex,
    maximumGlobalTotalBloodVolumeErrorMl:
      cycle.maximumGlobalTotalBloodVolumeErrorMl,
    maximumCoronaryBloodVolumeLedgerResidualMl:
      cycle.maximumCoronaryBloodVolumeLedgerResidualMl,
    maximumDynamicMcsConservationResidualMlPerSec:
      cycle.maximumDynamicMcsConservationResidualMlPerSec,
    allRawValuesFinite: cycle.allRawValuesFinite,
    oneComposedCalciumOwnerOnly: cycle.oneComposedCalciumOwnerOnly,
    allDynamicMcsAcceptedFlowsExactlyZero:
      cycle.allDynamicMcsAcceptedFlowsExactlyZero,
  });
}

function sourceOutcomeShapePassedV1(
  outcome: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSourceOutcomeV1,
): boolean {
  if (outcome.status === "source-execution-failed")
    return (
      outcome.failureClass === "source-execution-failure" &&
      outcome.summary === null &&
      sanitizedExceptionShapePassedV1(outcome.exception)
    );
  if (outcome.summary === null || outcome.exception !== null) return false;
  const summary = outcome.summary;
  const summaryShape =
    summary.experimentId === MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V3_ID &&
    [
      "canonical-evidence",
      "bounded-smoke",
      "fixed-horizon-characterization",
    ].includes(summary.executionPurpose) &&
    Number.isFinite(summary.nominalDtSec) &&
    summary.nominalDtSec > 0 &&
    Number.isSafeInteger(summary.requestedMaximumCycleCount) &&
    summary.requestedMaximumCycleCount > 0 &&
    Number.isSafeInteger(summary.completedCycleCount) &&
    summary.completedCycleCount >= 1 &&
    Number.isSafeInteger(summary.terminalCycleIndex) &&
    summary.terminalCycleIndex >= 1 &&
    Number.isFinite(summary.terminalAcceptedTimeSec) &&
    summary.terminalAcceptedTimeSec > 0 &&
    Number.isSafeInteger(summary.terminalAcceptedRevision) &&
    summary.terminalAcceptedRevision > 0 &&
    Array.isArray(summary.period1ClassifierInputs) &&
    summary.period1ClassifierInputs.length <=
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.consecutiveCycles &&
    /^[0-9a-f]{64}$/.test(summary.protocolIdentityHash) &&
    /^[0-9a-f]{64}$/.test(summary.modelConditionIdentityHash) &&
    /^[0-9a-f]{64}$/.test(summary.terminalCheckpointSha256) &&
    summary.terminalCheckpointExactRoundTripVerified === true &&
    summary.internallyOwnedSourceExecution === true &&
    summary.canonicalSourceAuthenticationEstablished === false &&
    summary.historicalQualificationTransferred === false &&
    typeof summary.numericalPeriod1Established === "boolean" &&
    typeof summary.allCyclesFiniteConservedAndEventExact === "boolean" &&
    sourceClassifierReplayPassedV1(summary) &&
    terminalClosureBindingPassedV1(summary) &&
    allNumericLeavesFiniteV1(summary);
  if (!summaryShape) return false;
  if (outcome.status === "source-p1-established")
    return (
      outcome.failureClass === null &&
      summary.executionPurpose === "canonical-evidence" &&
      summary.nominalDtSec === 0.001 &&
      summary.requestedMaximumCycleCount === 250 &&
      summary.terminationReason === "period1-converged" &&
      summary.classification.status === "period1-converged" &&
      summary.numericalPeriod1Established &&
      summary.allCyclesFiniteConservedAndEventExact &&
      summary.terminalCheckpointExactRoundTripVerified === true &&
      summary.completedCycleCount === summary.terminalCycleIndex
    );
  if (outcome.failureClass === "shared-checkpoint-binding-failure")
    return (
      summary.executionPurpose === "canonical-evidence" &&
      summary.nominalDtSec === 0.001 &&
      summary.requestedMaximumCycleCount === 250 &&
      summary.terminationReason === "period1-converged" &&
      summary.classification.status === "period1-converged" &&
      summary.numericalPeriod1Established &&
      summary.allCyclesFiniteConservedAndEventExact &&
      summary.terminalCheckpointExactRoundTripVerified === true &&
      summary.completedCycleCount === summary.terminalCycleIndex
    );
  return (
    outcome.failureClass === "source-not-p1" &&
    Number.isFinite(summary.nominalDtSec) &&
    Number.isSafeInteger(summary.requestedMaximumCycleCount) &&
    summary.requestedMaximumCycleCount > 0
  );
}

function sourceClassifierReplayPassedV1(
  summary: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSourceSummaryV1,
): boolean {
  const inputs = summary.period1ClassifierInputs;
  const expectedCount =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.consecutiveCycles;
  const latest = inputs.at(-1);
  const inputsAreConsecutive = inputs.every(
    (input, index) =>
      Number.isSafeInteger(input.cycleIndex) &&
      input.cycleIndex >= 1 &&
      (index === 0 || input.cycleIndex === inputs[index - 1]!.cycleIndex + 1),
  );
  const eligibleSuffix =
    inputs.length === expectedCount &&
    inputsAreConsecutive &&
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
  const p1FromInputs =
    eligibleSuffix &&
    inputs.every(
      (input) =>
        input.period1MaximumNormalizedDelta <=
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period1NormalizedTolerance,
    );
  const p2FromInputs =
    !p1FromInputs &&
    eligibleSuffix &&
    inputs.every(
      (input) =>
        input.period2MaximumNormalizedDelta !== null &&
        input.period1MaximumNormalizedDelta >=
          MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period2MinimumPeriod1NormalizedDelta &&
        input.period2MaximumNormalizedDelta <=
          MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period2NormalizedTolerance,
    );
  const classification = summary.classification;
  const expectedStatus = p1FromInputs
    ? ("period1-converged" as const)
    : p2FromInputs
      ? ("period2-suspect" as const)
      : ("not-converged" as const);
  const expectedEvidenceCycleIndices =
    expectedStatus === "not-converged"
      ? []
      : inputs.map((input) => input.cycleIndex);
  const expectedTerminationReason =
    expectedStatus === "period1-converged"
      ? ("period1-converged" as const)
      : expectedStatus === "period2-suspect"
        ? ("period2-suspect" as const)
        : ("maximum-cycles-reached" as const);
  const numericalPeriod1Expected =
    summary.executionPurpose === "canonical-evidence" &&
    expectedStatus === "period1-converged";
  return (
    inputsAreConsecutive &&
    latest !== undefined &&
    latest.cycleIndex === summary.terminalCycleIndex &&
    classification.classifierId ===
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLASSIFIER_V3_ID &&
    classification.latestCycleIndex === summary.terminalCycleIndex &&
    classification.consecutiveCyclesRequired === expectedCount &&
    classification.minimumConsecutiveCycles === 3 &&
    classification.acceptedEvidenceRole === "canonical-periodic-protocol" &&
    canonicalJsonStringify(classification.evidenceCycleIndices) ===
      canonicalJsonStringify(expectedEvidenceCycleIndices) &&
    classification.latestPeriod1MaximumNormalizedDelta ===
      latest.period1MaximumNormalizedDelta &&
    classification.latestPeriod2MaximumNormalizedDelta ===
      latest.period2MaximumNormalizedDelta &&
    classification.physiologicalAcceptanceEstablished === false &&
    classification.independentValidationEstablished === false &&
    classification.releaseAcceptanceEstablished === false &&
    classification.status === expectedStatus &&
    summary.numericalPeriod1Established === numericalPeriod1Expected &&
    summary.terminationReason === expectedTerminationReason
  );
}

function terminalClosureBindingPassedV1(
  summary: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSourceSummaryV1,
): boolean {
  const closure = summary.terminalPeriod1Closure;
  const latest = summary.period1ClassifierInputs.at(-1);
  return (
    latest !== undefined &&
    closure.closureId === MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_V3_ID &&
    closure.referenceScaleSetId ===
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.referenceScaleSetId &&
    Object.values(closure.gates).every((gate) => gate === true) &&
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
    closure.provenance.revisionAdvance > 0 &&
    closure.overall.maximumNormalizedDelta ===
      latest.period1MaximumNormalizedDelta
  );
}

async function sourceIdentityReplayPassedV1(
  outcome: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSourceOutcomeV1,
): Promise<boolean> {
  if (outcome.status === "source-execution-failed") return true;
  const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
  const [conditionIdentityHash, protocolIdentityHash] = await Promise.all([
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
  return (
    outcome.summary.executionPurpose === "canonical-evidence" &&
    outcome.summary.nominalDtSec === 0.001 &&
    outcome.summary.requestedMaximumCycleCount === 250 &&
    outcome.summary.modelConditionIdentityHash === conditionIdentityHash &&
    outcome.summary.protocolIdentityHash === protocolIdentityHash
  );
}

async function armOutcomeShapePassedV1(
  sourceOutcome: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSourceOutcomeV1,
  outcomes: readonly MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmOutcomeV1[],
): Promise<boolean> {
  if (outcomes.length !== 3) return false;
  for (let index = 0; index < outcomes.length; index += 1) {
    const outcome = outcomes[index]!;
    const arm =
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ARMS_V1[
        index
      ]!;
    if (
      outcome.armId !== arm.armId ||
      outcome.nominalDtSec !== arm.nominalDtSec ||
      outcome.numericalAccessId !==
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ACCESS_V1_ID ||
      outcome.maximumAcceptedStepCountPerCycle !==
        arm.maximumAcceptedStepCountPerCycle
    )
      return false;
    if (outcome.status === "not-attempted-source-unavailable") {
      if (
        sourceOutcome.status === "source-p1-established" ||
        outcome.failureClass !== sourceOutcome.failureClass ||
        outcome.sourceCheckpointSha256 !== null ||
        outcome.ledger !== null ||
        outcome.projection !== null ||
        outcome.exception !== null
      )
        return false;
      continue;
    }
    if (sourceOutcome.status !== "source-p1-established") return false;
    if (outcome.status === "failed") {
      if (
        outcome.projection !== null ||
        !sanitizedExceptionShapePassedV1(outcome.exception)
      )
        return false;
      if (outcome.failureClass === "arm-execution-failure") {
        if (
          outcome.sourceCheckpointSha256 !== null ||
          outcome.retainedContinuationEvidence !== null ||
          outcome.ledger !== null
        )
          return false;
        continue;
      }
      if (
        outcome.sourceCheckpointSha256 !==
          sourceOutcome.summary.terminalCheckpointSha256 ||
        outcome.retainedContinuationEvidence === null ||
        outcome.ledger === null
      )
        return false;
      const continuationPassed = continuationBindingPassedV1(
        sourceOutcome.summary,
        arm,
        outcome.retainedContinuationEvidence,
        outcome.ledger,
      );
      if (outcome.failureClass === "ledger-integrity-failure") {
        if (
          continuationPassed ||
          outcome.exception.name !== "Error" ||
          outcome.exception.message !==
            "mechanical-port dt continuation binding differs"
        )
          return false;
        try {
          await projectMainWireFiveWallMechanicalPortLedgerDtV1(
            outcome.armId,
            outcome.ledger,
          );
        } catch {
          return false;
        }
        continue;
      }
      if (!continuationPassed) return false;
      try {
        await projectMainWireFiveWallMechanicalPortLedgerDtV1(
          outcome.armId,
          outcome.ledger,
        );
        return false;
      } catch (error) {
        if (
          canonicalJsonStringify(sanitizeExceptionV1(error)) !==
          canonicalJsonStringify(outcome.exception)
        )
          return false;
      }
      continue;
    }
    const fulfilledContinuationEvidence: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtContinuationEvidenceV1 =
      {
        sourceCycleIndex: outcome.sourceCycleIndex,
        sourceCheckpointSha256: outcome.sourceCheckpointSha256,
        sourceCheckpointExactRoundTripVerified:
          outcome.sourceCheckpointExactRoundTripVerified,
        materialBinding: outcome.ledger.materialBinding,
        bridgeCycle: outcome.bridgeCycle,
        measurementCycle: outcome.measurementCycle,
        measurementAcceptedIntervalCount:
          outcome.measurementAcceptedIntervalCount,
        terminalCheckpointSha256: outcome.terminalCheckpointSha256,
        terminalCheckpointExactRoundTripVerified:
          outcome.terminalCheckpointExactRoundTripVerified,
      };
    if (
      outcome.failureClass !== null ||
      outcome.exception !== null ||
      !continuationBindingPassedV1(
        sourceOutcome.summary,
        arm,
        fulfilledContinuationEvidence,
        outcome.ledger,
      ) ||
      !allNumericLeavesFiniteV1(outcome)
    )
      return false;
  }
  return true;
}

function continuationBindingPassedV1(
  sourceSummary: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSourceSummaryV1,
  arm: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmV1,
  continuation: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtContinuationEvidenceV1,
  ledger: MainWireFiveWallMechanicalPortLedgerV1,
): boolean {
  const expectedMaterialBinding =
    normalAdultMainWireFiveWallMechanicalPortMaterialBindingV1(
      createMainWireIntegratedModelRegularSinusAllOffFixtureV3(),
    );
  return (
    continuation.sourceCycleIndex === sourceSummary.terminalCycleIndex &&
    continuation.sourceCheckpointSha256 ===
      sourceSummary.terminalCheckpointSha256 &&
    continuation.sourceCheckpointExactRoundTripVerified === true &&
    canonicalJsonStringify(continuation.materialBinding) ===
      canonicalJsonStringify(expectedMaterialBinding) &&
    canonicalJsonStringify(ledger.materialBinding) ===
      canonicalJsonStringify(expectedMaterialBinding) &&
    continuation.terminalCheckpointExactRoundTripVerified === true &&
    /^[0-9a-f]{64}$/.test(continuation.terminalCheckpointSha256) &&
    cycleSummaryShapePassedV1(
      continuation.bridgeCycle,
      arm.maximumAcceptedStepCountPerCycle,
    ) &&
    cycleSummaryShapePassedV1(
      continuation.measurementCycle,
      arm.maximumAcceptedStepCountPerCycle,
    ) &&
    continuation.bridgeCycle.coronaryWindowIndex ===
      sourceSummary.terminalCycleIndex &&
    continuation.measurementCycle.coronaryWindowIndex ===
      sourceSummary.terminalCycleIndex + 1 &&
    continuation.bridgeCycle.startTimeSec ===
      sourceSummary.terminalAcceptedTimeSec &&
    continuation.bridgeCycle.startAcceptedRevision ===
      sourceSummary.terminalAcceptedRevision &&
    continuation.bridgeCycle.endTimeSec -
      continuation.bridgeCycle.startTimeSec ===
      1 &&
    continuation.measurementCycle.endTimeSec -
      continuation.measurementCycle.startTimeSec ===
      1 &&
    continuation.measurementCycle.startTimeSec ===
      continuation.bridgeCycle.endTimeSec &&
    continuation.measurementCycle.startAcceptedRevision ===
      continuation.bridgeCycle.terminalAcceptedRevision &&
    continuation.measurementAcceptedIntervalCount ===
      continuation.measurementCycle.acceptedStepCount &&
    ledger.intervalCount === continuation.measurementCycle.acceptedStepCount &&
    ledger.initialAcceptedTimeSec ===
      continuation.measurementCycle.startTimeSec &&
    ledger.terminalAcceptedTimeSec ===
      continuation.measurementCycle.endTimeSec &&
    ledger.initialAcceptedRevision ===
      continuation.measurementCycle.startAcceptedRevision &&
    ledger.terminalAcceptedRevision ===
      continuation.measurementCycle.terminalAcceptedRevision &&
    ledger.terminalAcceptedRevision - ledger.initialAcceptedRevision ===
      ledger.intervalCount &&
    ledger.elapsedTimeSec === 1 &&
    acceptedDtBindingPassedV1(
      ledger,
      arm.nominalDtSec,
      continuation.bridgeCycle,
      continuation.measurementCycle,
    )
  );
}

function acceptedDtBindingPassedV1(
  ledger: MainWireFiveWallMechanicalPortLedgerV1,
  nominalDtSec: number,
  bridgeCycle: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtCycleSummaryV1,
  measurementCycle: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtCycleSummaryV1,
): boolean {
  const timeScaleSec = Math.max(
    Math.abs(bridgeCycle.startTimeSec),
    Math.abs(bridgeCycle.endTimeSec),
    Math.abs(measurementCycle.startTimeSec),
    Math.abs(measurementCycle.endTimeSec),
    1,
  );
  const roundoffToleranceSec = 16 * Number.EPSILON * timeScaleSec;
  return (
    ledger.minimumAcceptedDtSec > 0 &&
    ledger.minimumAcceptedDtSec <= nominalDtSec + roundoffToleranceSec &&
    Math.abs(ledger.maximumAcceptedDtSec - nominalDtSec) <= roundoffToleranceSec
  );
}

function cycleSummaryShapePassedV1(
  cycle: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtCycleSummaryV1,
  maximumAcceptedStepCountPerCycle: number,
): boolean {
  const tolerance =
    MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.invariantTolerance;
  return (
    Number.isFinite(cycle.startTimeSec) &&
    Number.isFinite(cycle.endTimeSec) &&
    cycle.endTimeSec > cycle.startTimeSec &&
    Number.isSafeInteger(cycle.acceptedStepCount) &&
    cycle.acceptedStepCount >= 1 &&
    cycle.acceptedStepCount <= maximumAcceptedStepCountPerCycle &&
    Number.isSafeInteger(cycle.startAcceptedRevision) &&
    cycle.startAcceptedRevision >= 0 &&
    Number.isSafeInteger(cycle.terminalAcceptedRevision) &&
    cycle.terminalAcceptedRevision - cycle.startAcceptedRevision ===
      cycle.acceptedStepCount &&
    Number.isSafeInteger(cycle.coronaryWindowIndex) &&
    cycle.coronaryWindowIndex >= 0 &&
    Number.isFinite(cycle.maximumGlobalTotalBloodVolumeErrorMl) &&
    cycle.maximumGlobalTotalBloodVolumeErrorMl >= 0 &&
    cycle.maximumGlobalTotalBloodVolumeErrorMl <=
      tolerance.globalTotalBloodVolumeErrorMl &&
    Number.isFinite(cycle.maximumCoronaryBloodVolumeLedgerResidualMl) &&
    cycle.maximumCoronaryBloodVolumeLedgerResidualMl >= 0 &&
    cycle.maximumCoronaryBloodVolumeLedgerResidualMl <=
      tolerance.coronaryBloodVolumeLedgerResidualMl &&
    Number.isFinite(cycle.maximumDynamicMcsConservationResidualMlPerSec) &&
    cycle.maximumDynamicMcsConservationResidualMlPerSec >= 0 &&
    cycle.maximumDynamicMcsConservationResidualMlPerSec <=
      tolerance.dynamicMcsConservationResidualMlPerSec &&
    cycle.allRawValuesFinite === true &&
    cycle.oneComposedCalciumOwnerOnly === true &&
    cycle.allDynamicMcsAcceptedFlowsExactlyZero === true
  );
}

function isFulfilledArmV1(
  outcome: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmOutcomeV1,
): outcome is Extract<
  MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmOutcomeV1,
  { status: "fulfilled" }
> {
  return outcome.status === "fulfilled";
}

function sanitizedExceptionShapePassedV1(
  exception: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSanitizedExceptionV1,
): boolean {
  return (
    typeof exception.name === "string" &&
    exception.name.length > 0 &&
    typeof exception.message === "string" &&
    exception.message.length > 0
  );
}

function sanitizeExceptionV1(
  error: unknown,
): MainWireIntegratedModelPeriodicMechanicalPortLedgerDtSanitizedExceptionV1 {
  if (error instanceof Error)
    return Object.freeze({ name: error.name, message: error.message });
  return Object.freeze({ name: "NonErrorThrow", message: String(error) });
}

function assertImplementationCommitShaV1(value: string): void {
  if (!/^[0-9a-f]{40}$/.test(value))
    throw new Error("mechanical-port dt implementation commit SHA is invalid");
}

function allNumericLeavesFiniteV1(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(allNumericLeavesFiniteV1);
  if (value !== null && typeof value === "object")
    return Object.values(value).every(allNumericLeavesFiniteV1);
  return true;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>))
      deepFreeze(child);
  }
  return value;
}
