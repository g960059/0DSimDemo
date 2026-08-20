import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  evaluateMainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_CLAIM,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_ID,
  type MainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultPassiveEquilibriumCandidateEngineeringV1";
import {
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_LOADED_COORDINATES_V3,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3,
  type MainWireNormalAdultPassiveEquilibriumCoordinatesV3,
} from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonDefinitionV1";
import {
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICIES_V3,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID,
  solveMainWirePassiveEquilibriumPointEngineeringV3,
  type MainWirePassiveEquilibriumCandidateEvaluatorV3,
  type MainWirePassiveEquilibriumIterationRecordV3,
  type MainWirePassiveEquilibriumPointSolverResultV3,
} from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonEngineeringV1";
import {
  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_DECLARATION_V1,
  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_DIAGNOSTIC_TARGETS_V1,
  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_GRID_V1,
  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_NEGATIVE_CLAIMS_V1,
  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PREDECESSOR_V1,
  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PROTOCOL_PAYLOAD_V1,
  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_REPORT_V1_ID,
  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1,
  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_V1_ID,
  mainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointIdV1,
  type MainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointDefinitionV1,
} from "@/engine/myocardium/experiments/MainWireIntrinsicVentricularPassiveReducedSurfacePilotDefinitionV1";
import {
  evaluateMainWireIntrinsicVentricularPassiveReducedSurfaceMathematicalAuditsV1,
  projectMainWireIntrinsicVentricularPassiveReducedHessianV1,
  type MainWireIntrinsicVentricularPassiveReducedSurfaceMathematicalAuditsV1,
  type MainWireIntrinsicVentricularPassiveReducedSurfaceMathPointV1,
} from "@/engine/myocardium/experiments/MainWireIntrinsicVentricularPassiveReducedSurfacePilotMathematicsV1";

export const MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_IMPLEMENTATION_COMMIT_SHA_V1 =
  "63dcab1626c43e67f80a870365470f24238de417" as const;

export const MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_COMMITTED_PAYLOAD_SHA256_V1 =
  "dbdf2b76d23fc902e7b1b75fab75731c7456ff3d69ab9a23994569a723daf294" as const;

export type MainWireIntrinsicVentricularPassiveReducedSurfaceStageRecordV1 =
  Readonly<{
    stageIndex: number;
    chamberVolumesM3: Readonly<{ LV: number; RV: number }>;
    status: MainWirePassiveEquilibriumPointSolverResultV3["status"];
    failureReason: MainWirePassiveEquilibriumPointSolverResultV3["failureReason"];
    candidateEvaluations: number;
    acceptedUpdates: number;
    rejectedTrials: number;
    terminalCoordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3 | null;
    terminalScaledForceInfinityNorm: number | null;
    terminalMinimumScaledHessianEigenvalue: number | null;
    stagePayloadSha256: string;
  }>;

export type MainWireIntrinsicVentricularPassiveReducedSurfaceTerminalPointV1 =
  Readonly<{
    internalCoordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3;
    rawStoredEnergyJ: number;
    intrinsicPressuresPa: Readonly<{ LV: number; RV: number }>;
    reducedHessianPaPerM3:
      readonly [readonly [number, number], readonly [number, number]] | null;
    scaledReducedHessian:
      readonly [readonly [number, number], readonly [number, number]] | null;
    normalizedScaledAntisymmetry: number | null;
    analyticAntisymmetryPassed: boolean;
    scaledForceInfinityNorm: number;
    minimumScaledInternalHessianEigenvalue: number;
    strictLocalStabilityPassed: boolean;
    junctionRadiusPassed: boolean;
    sourceBindings: MainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1["sourceBindings"];
  }>;

export type MainWireIntrinsicVentricularPassiveReducedSurfacePrimaryPointV1 =
  Readonly<{
    pointId: string;
    leftVentricularIndex: number;
    rightVentricularIndex: number;
    chamberVolumesM3: Readonly<{ LV: number; RV: number }>;
    referencePoint: boolean;
    status: "primary-point-established" | "primary-point-failed";
    primaryLineageEstablished: boolean;
    completedStages: number;
    failedStageIndex: number | null;
    failureReason: string | null;
    totalCandidateEvaluations: number;
    totalAcceptedUpdates: number;
    totalRejectedTrials: number;
    terminal: MainWireIntrinsicVentricularPassiveReducedSurfaceTerminalPointV1 | null;
    stageOutcomeSha256s: readonly string[];
    stageEndpoints: readonly (readonly [
      stageIndex: number,
      status: "root" | "failed",
      failureReason: string | null,
      septalMidwallCapVolumeM3: number | null,
      junctionRadiusM: number | null,
      scaledForceInfinityNorm: number | null,
      minimumScaledInternalHessianEigenvalue: number | null,
    ])[];
    failedStage: MainWireIntrinsicVentricularPassiveReducedSurfaceStageRecordV1 | null;
    pointPayloadSha256: string;
  }>;

type DiagnosticLineageKindV1 =
  | "primary-diagonal"
  | "lv-first"
  | "rv-first"
  | "neighbour-continuation"
  | "reverse-return";

export type MainWireIntrinsicVentricularPassiveReducedSurfaceDiagnosticLineageV1 =
  Readonly<{
    diagnosticId: string;
    targetPointId: string;
    lineageKind: DiagnosticLineageKindV1;
    status: "diagnostic-lineage-established" | "diagnostic-lineage-failed";
    targetOrReferenceEndpoint: "target" | "reference";
    completedStages: number;
    failedStageIndex: number | null;
    failureReason: string | null;
    totalCandidateEvaluations: number;
    totalAcceptedUpdates: number;
    totalRejectedTrials: number;
    terminal: MainWireIntrinsicVentricularPassiveReducedSurfaceTerminalPointV1 | null;
    comparison: Readonly<{
      available: boolean;
      scaledCoordinateInfinityDistance: number | null;
      absoluteStoredEnergyDifferenceJ: number | null;
      leftPressureAbsoluteDifferencePa: number | null;
      rightPressureAbsoluteDifferencePa: number | null;
      withinReportingThresholds: boolean;
    }>;
    lineagePayloadSha256: string;
  }>;

type SelectedTraceV1 = Readonly<{
  traceId: string;
  pointId: string;
  stages: readonly Readonly<{
    stageIndex: number;
    chamberVolumesM3: Readonly<{ LV: number; RV: number }>;
    status: MainWirePassiveEquilibriumPointSolverResultV3["status"];
    failureReason: MainWirePassiveEquilibriumPointSolverResultV3["failureReason"];
    iterationDecisions: readonly Readonly<{
      iterationIndex: number;
      currentScaledForceInfinityNorm: number;
      currentMinimumScaledHessianEigenvalue: number;
      selectedTrialIndex: number | null;
      selectedReason: string | null;
      scaledUpdateInfinityNorm: number | null;
      trialCount: number;
    }>[];
  }>[];
}>;

export type MainWireIntrinsicVentricularPassiveReducedSurfacePilotPayloadV1 =
  Readonly<{
    ownerId: typeof MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_V1_ID;
    status: "engineering-pilot-completed";
    declaration: typeof MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_DECLARATION_V1;
    implementationCommitSha: string;
    predecessor: typeof MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PREDECESSOR_V1;
    protocolPayload: typeof MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PROTOCOL_PAYLOAD_V1;
    protocolPayloadSha256: string;
    selectedSolverPolicyId: typeof MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID;
    selectedSolverPolicyPayloadSha256: string;
    candidateOwnerId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_ID;
    candidateClaim: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_CLAIM;
    primaryGrid: readonly MainWireIntrinsicVentricularPassiveReducedSurfacePrimaryPointV1[];
    diagnosticLineages: readonly MainWireIntrinsicVentricularPassiveReducedSurfaceDiagnosticLineageV1[];
    diagnosticLineageComparisonsAllWithinReportingThresholds: boolean;
    mathematicalAudits: MainWireIntrinsicVentricularPassiveReducedSurfaceMathematicalAuditsV1;
    selectedDiagnosticTraces: readonly SelectedTraceV1[];
    executionExceptions: readonly Readonly<{
      phase: string;
      name: string;
      message: string;
    }>[];
    sourceAndProtocolBindingsPassed: boolean;
    allPrimaryPointLineagesPassed: boolean;
    sampledLocalIntrinsicVentricularReducedPotentialConsistencyPassed: boolean;
    firstFailureClass:
      | "point-solve-failure"
      | "strict-stability-or-projection-failure"
      | "energy-gradient-inconsistency"
      | "reduced-hessian-inconsistency"
      | "maxwell-inconsistency"
      | "path-refinement-inconsistency"
      | "source-binding-failure"
      | "execution-or-integrity-failure"
      | null;
    artifactPolicy: Readonly<{
      maximumCommittedArtifactBytes: number;
      fullIterationTraceCommitted: false;
      createOnly: true;
      runtimeInput: false;
    }>;
    claims: typeof MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_NEGATIVE_CLAIMS_V1;
  }>;

export type MainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1 =
  Readonly<{
    reportSchemaId: typeof MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_REPORT_V1_ID;
    payload: MainWireIntrinsicVentricularPassiveReducedSurfacePilotPayloadV1;
    payloadSha256: string;
  }>;

type RuntimePointV1 = Readonly<{
  output: MainWireIntrinsicVentricularPassiveReducedSurfacePrimaryPointV1;
  terminalCandidate: MainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1 | null;
  stageResults: readonly Readonly<{
    chamberVolumesM3: Readonly<{ LV: number; RV: number }>;
    result: MainWirePassiveEquilibriumPointSolverResultV3;
  }>[];
}>;

export type MainWireIntrinsicVentricularPassiveReducedSurfacePilotReportAuditV1 =
  Readonly<{
    status: "report-audit-passed" | "report-audit-failed";
    identityAndClaimBindingsReplayPassed: boolean;
    implementationCommitBindingReplayPassed: boolean;
    protocolPayloadReplayPassed: boolean;
    protocolPayloadSha256ReplayPassed: boolean;
    selectedSolverPolicyPayloadSha256ReplayPassed: boolean;
    primaryGridDefinitionReplayPassed: boolean;
    primaryOutcomeSemanticsReplayPassed: boolean;
    primaryStageEndpointsReplayPassed: boolean;
    primaryTerminalCandidatesReplayPassed: boolean;
    primaryPointHashesReplayPassed: boolean;
    diagnosticLineageHashesReplayPassed: boolean;
    diagnosticLineageDefinitionReplayPassed: boolean;
    sourceBindingsReplayPassed: boolean;
    mathematicalAuditsReplayPassed: boolean;
    diagnosticComparisonsReplayPassed: boolean;
    diagnosticTerminalCandidatesReplayPassed: boolean;
    selectedTraceShapeReplayPassed: boolean;
    resultConjunctionReplayPassed: boolean;
    firstFailureClassReplayPassed: boolean;
    negativeClaimsReplayPassed: boolean;
    payloadSha256ReplayPassed: boolean;
    committedResultPayloadSha256BindingPassed: boolean;
  }>;

export async function runMainWireIntrinsicVentricularPassiveReducedSurfacePilotEngineeringV1(
  input: Readonly<{ implementationCommitSha: string }>,
): Promise<MainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1> {
  if (!/^[0-9a-f]{40}$/.test(input.implementationCommitSha))
    throw new Error(
      "implementation commit SHA must be 40 lowercase hex digits",
    );

  const protocolPayloadSha256 = await sha256CanonicalJsonHex(
    MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PROTOCOL_PAYLOAD_V1,
  );
  const selectedSolverPolicyPayloadSha256 = await sha256CanonicalJsonHex({
    shared: MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3,
    residualArmijoNewton:
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICIES_V3[
        MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID
      ],
  });
  const executionExceptions: Array<{
    phase: string;
    name: string;
    message: string;
  }> = [];

  const primaryRuntime: RuntimePointV1[] = [];
  let referenceRuntime: RuntimePointV1;
  try {
    referenceRuntime = await solveReferencePointV1();
  } catch (error) {
    executionExceptions.push(sanitizeErrorV1("reference-root", error));
    referenceRuntime = await unavailableRuntimePointV1(
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_GRID_V1[0]!,
      "reference-root-execution-failed",
    );
  }
  primaryRuntime.push(referenceRuntime);

  for (const definition of MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_GRID_V1.slice(
    1,
  )) {
    try {
      primaryRuntime.push(
        await solvePrimaryGridPointV1(definition, referenceRuntime),
      );
    } catch (error) {
      executionExceptions.push(
        sanitizeErrorV1(`primary:${definition.pointId}`, error),
      );
      primaryRuntime.push(
        await unavailableRuntimePointV1(
          definition,
          "primary-point-execution-failed",
        ),
      );
    }
  }

  const primaryById = new Map(
    primaryRuntime.map((runtime) => [runtime.output.pointId, runtime]),
  );
  const diagnosticLineages: MainWireIntrinsicVentricularPassiveReducedSurfaceDiagnosticLineageV1[] =
    [];
  for (const diagnostic of MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_DIAGNOSTIC_TARGETS_V1) {
    for (const lineageKind of [
      "primary-diagonal",
      "lv-first",
      "rv-first",
      "neighbour-continuation",
      "reverse-return",
    ] as const) {
      try {
        diagnosticLineages.push(
          await runDiagnosticLineageV1(
            diagnostic.diagnosticId,
            diagnostic.leftVentricularIndex,
            diagnostic.rightVentricularIndex,
            lineageKind,
            referenceRuntime,
            primaryById,
          ),
        );
      } catch (error) {
        executionExceptions.push(
          sanitizeErrorV1(
            `diagnostic:${diagnostic.diagnosticId}:${lineageKind}`,
            error,
          ),
        );
        diagnosticLineages.push(
          await failedDiagnosticLineageV1(
            diagnostic.diagnosticId,
            mainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointIdV1(
              diagnostic.leftVentricularIndex,
              diagnostic.rightVentricularIndex,
            ),
            lineageKind,
            "diagnostic-lineage-execution-failed",
          ),
        );
      }
    }
  }

  const mathematicalAudits =
    evaluateMainWireIntrinsicVentricularPassiveReducedSurfaceMathematicalAuditsV1(
      primaryRuntime.map(runtimeMathPointV1),
    );
  const primaryGrid = primaryRuntime.map((runtime) => runtime.output);
  const allPrimaryPointLineagesPassed =
    primaryGrid.length === 25 &&
    primaryGrid.every((point) => point.primaryLineageEstablished);
  const sourceAndProtocolBindingsPassed =
    protocolPayloadSha256.length === 64 &&
    selectedSolverPolicyPayloadSha256.length === 64 &&
    primaryRuntime.every(
      (runtime) =>
        runtime.terminalCandidate === null ||
        (runtime.terminalCandidate.ownerId ===
          MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_ID &&
          canonicalJsonStringify(runtime.terminalCandidate.sourceBindings) ===
            canonicalJsonStringify(
              MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PROTOCOL_PAYLOAD_V1.candidateSourceBindings,
            ) &&
          canonicalJsonStringify(runtime.terminalCandidate.qualification) ===
            canonicalJsonStringify(
              MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_CLAIM,
            )),
    );
  const sampledLocalIntrinsicVentricularReducedPotentialConsistencyPassed =
    allPrimaryPointLineagesPassed &&
    mathematicalAudits.pointAndProjectionAuditsPassed &&
    mathematicalAudits.energyGradientAuditsPassed &&
    mathematicalAudits.reducedHessianAuditsPassed &&
    mathematicalAudits.maxwellAuditsPassed &&
    mathematicalAudits.rectangularPathAuditsPassed &&
    sourceAndProtocolBindingsPassed &&
    executionExceptions.length === 0;

  const payload = deepFreezeV1({
    ownerId:
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_V1_ID,
    status: "engineering-pilot-completed" as const,
    declaration:
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_DECLARATION_V1,
    implementationCommitSha: input.implementationCommitSha,
    predecessor:
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PREDECESSOR_V1,
    protocolPayload:
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PROTOCOL_PAYLOAD_V1,
    protocolPayloadSha256,
    selectedSolverPolicyId:
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID,
    selectedSolverPolicyPayloadSha256,
    candidateOwnerId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_ID,
    candidateClaim:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_CLAIM,
    primaryGrid,
    diagnosticLineages,
    diagnosticLineageComparisonsAllWithinReportingThresholds:
      diagnosticLineages.length === 20 &&
      diagnosticLineages.every(
        (lineage) => lineage.comparison.withinReportingThresholds,
      ),
    mathematicalAudits,
    selectedDiagnosticTraces: selectedDiagnosticTracesV1(primaryById),
    executionExceptions,
    sourceAndProtocolBindingsPassed,
    allPrimaryPointLineagesPassed,
    sampledLocalIntrinsicVentricularReducedPotentialConsistencyPassed,
    firstFailureClass: firstFailureClassV1({
      primaryGrid,
      mathematicalAudits,
      sourceAndProtocolBindingsPassed,
      executionExceptions,
    }),
    artifactPolicy: {
      maximumCommittedArtifactBytes:
        MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.maximumCommittedArtifactBytes,
      fullIterationTraceCommitted: false as const,
      createOnly: true as const,
      runtimeInput: false as const,
    },
    claims:
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_NEGATIVE_CLAIMS_V1,
  });
  return deepFreezeV1({
    reportSchemaId:
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_REPORT_V1_ID,
    payload,
    payloadSha256: await sha256CanonicalJsonHex(payload),
  });
}

export async function auditMainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1(
  report: MainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1,
): Promise<MainWireIntrinsicVentricularPassiveReducedSurfacePilotReportAuditV1> {
  const identityAndClaimBindingsReplayPassed =
    report.reportSchemaId ===
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_REPORT_V1_ID &&
    report.payload.ownerId ===
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_V1_ID &&
    report.payload.status === "engineering-pilot-completed" &&
    canonicalJsonStringify(report.payload.declaration) ===
      canonicalJsonStringify(
        MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_DECLARATION_V1,
      ) &&
    canonicalJsonStringify(report.payload.predecessor) ===
      canonicalJsonStringify(
        MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PREDECESSOR_V1,
      ) &&
    report.payload.selectedSolverPolicyId ===
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID &&
    report.payload.candidateOwnerId ===
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_ID &&
    canonicalJsonStringify(report.payload.candidateClaim) ===
      canonicalJsonStringify(
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_CLAIM,
      ) &&
    canonicalJsonStringify(report.payload.artifactPolicy) ===
      canonicalJsonStringify({
        maximumCommittedArtifactBytes:
          MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.maximumCommittedArtifactBytes,
        fullIterationTraceCommitted: false,
        createOnly: true,
        runtimeInput: false,
      });
  const implementationCommitBindingReplayPassed =
    report.payload.implementationCommitSha ===
    MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_IMPLEMENTATION_COMMIT_SHA_V1;
  const protocolPayloadReplayPassed =
    canonicalJsonStringify(report.payload.protocolPayload) ===
    canonicalJsonStringify(
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PROTOCOL_PAYLOAD_V1,
    );
  const protocolPayloadSha256ReplayPassed =
    report.payload.protocolPayloadSha256 ===
    (await sha256CanonicalJsonHex(report.payload.protocolPayload));
  const selectedSolverPolicyPayloadSha256ReplayPassed =
    report.payload.selectedSolverPolicyPayloadSha256 ===
    (await sha256CanonicalJsonHex({
      shared: MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3,
      residualArmijoNewton:
        MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICIES_V3[
          MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID
        ],
    }));
  const expectedPointDefinitions =
    MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_GRID_V1;
  const primaryGridDefinitionReplayPassed =
    report.payload.primaryGrid.length === expectedPointDefinitions.length &&
    report.payload.primaryGrid.every((point, index) => {
      const expected = expectedPointDefinitions[index]!;
      return (
        point.pointId === expected.pointId &&
        point.leftVentricularIndex === expected.leftVentricularIndex &&
        point.rightVentricularIndex === expected.rightVentricularIndex &&
        Object.is(point.chamberVolumesM3.LV, expected.chamberVolumesM3.LV) &&
        Object.is(point.chamberVolumesM3.RV, expected.chamberVolumesM3.RV) &&
        point.referencePoint === expected.referencePoint
      );
    });
  const primaryOutcomeSemanticsReplayPassed = report.payload.primaryGrid.every(
    (point) => {
      const expectedAttemptCount = point.referencePoint ? 1 : 32;
      if (point.primaryLineageEstablished)
        return (
          point.status === "primary-point-established" &&
          point.failureReason === null &&
          point.failedStageIndex === null &&
          point.failedStage === null &&
          point.terminal !== null &&
          point.stageOutcomeSha256s.length === expectedAttemptCount &&
          point.stageEndpoints.length === expectedAttemptCount &&
          point.stageEndpoints.every((endpoint) => endpoint[1] === "root") &&
          point.completedStages === (point.referencePoint ? 0 : 32)
        );
      return (
        point.status === "primary-point-failed" &&
        point.terminal === null &&
        point.completedStages < expectedAttemptCount &&
        point.stageOutcomeSha256s.length === point.stageEndpoints.length &&
        ((point.stageEndpoints.length === 0 && point.failedStage === null) ||
          (point.failedStage !== null &&
            point.stageEndpoints.at(-1)?.[1] === "failed" &&
            point.failureReason === point.failedStage.failureReason &&
            point.failedStageIndex === point.failedStage.stageIndex))
      );
    },
  );
  const primaryStageEndpointsReplayPassed = (
    await Promise.all(
      report.payload.primaryGrid.map(async (point) =>
        (
          await Promise.all(
            point.stageEndpoints.map(async (endpoint) => {
              const [
                stageIndex,
                status,
                failureReason,
                septalMidwallCapVolumeM3,
                junctionRadiusM,
                scaledForceInfinityNorm,
                minimumScaledInternalHessianEigenvalue,
              ] = endpoint;
              if (
                !Number.isInteger(stageIndex) ||
                stageIndex < 0 ||
                (point.referencePoint
                  ? stageIndex !== 0
                  : stageIndex < 1 || stageIndex > 32)
              )
                return false;
              if (status === "root" && failureReason !== null) return false;
              if (status === "failed" && failureReason === null) return false;
              if (
                septalMidwallCapVolumeM3 === null ||
                junctionRadiusM === null ||
                scaledForceInfinityNorm === null ||
                minimumScaledInternalHessianEigenvalue === null
              )
                return status === "failed";
              const volumes = point.referencePoint
                ? point.chamberVolumesM3
                : {
                    LV:
                      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.LV +
                      (stageIndex / 32) *
                        (point.chamberVolumesM3.LV -
                          MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.LV),
                    RV:
                      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.RV +
                      (stageIndex / 32) *
                        (point.chamberVolumesM3.RV -
                          MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.RV),
                  };
              try {
                const candidate =
                  evaluateMainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1(
                    {
                      chamberVolumesM3: volumes,
                      internalCoordinates: {
                        septalMidwallCapVolumeM3,
                        junctionRadiusM,
                      },
                    },
                  );
                return (
                  Object.is(
                    candidate.scaledForceInfinityNorm,
                    scaledForceInfinityNorm,
                  ) &&
                  Object.is(
                    candidate.minimumScaledInternalHessianEigenvalue,
                    minimumScaledInternalHessianEigenvalue,
                  ) &&
                  (status === "failed" ||
                    (candidate.scaledForceInfinityNorm <=
                      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.terminalScaledForceInfinityMaximum &&
                      candidate.minimumScaledInternalHessianEigenvalue >
                        MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.minimumScaledInternalHessianEigenvalueExclusive &&
                      candidate.junctionRadiusPassed))
                );
              } catch {
                return false;
              }
            }),
          )
        ).every(Boolean),
      ),
    )
  ).every(Boolean);
  const primaryTerminalCandidatesReplayPassed =
    report.payload.primaryGrid.every((point) => {
      if (point.terminal === null) return !point.primaryLineageEstablished;
      try {
        const replay = terminalPointV1(
          evaluateMainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1(
            {
              chamberVolumesM3: point.chamberVolumesM3,
              internalCoordinates: point.terminal.internalCoordinates,
            },
          ),
        );
        return (
          point.primaryLineageEstablished &&
          canonicalJsonStringify(replay) ===
            canonicalJsonStringify(point.terminal)
        );
      } catch {
        return false;
      }
    });
  const primaryPointHashesReplayPassed = (
    await Promise.all(
      report.payload.primaryGrid.map(
        async (point) =>
          Object.is(
            point.pointPayloadSha256,
            await sha256CanonicalJsonHex(
              withoutKeyV1(point, "pointPayloadSha256"),
            ),
          ) &&
          point.stageOutcomeSha256s.every((sha256) =>
            /^[0-9a-f]{64}$/.test(sha256),
          ) &&
          (point.failedStage === null ||
            point.failedStage.stagePayloadSha256 ===
              (await sha256CanonicalJsonHex(
                withoutKeyV1(point.failedStage, "stagePayloadSha256"),
              ))),
      ),
    )
  ).every(Boolean);
  const diagnosticLineageHashesReplayPassed =
    report.payload.diagnosticLineages.length === 20 &&
    (
      await Promise.all(
        report.payload.diagnosticLineages.map(async (lineage) =>
          Object.is(
            lineage.lineagePayloadSha256,
            await sha256CanonicalJsonHex(
              withoutKeyV1(lineage, "lineagePayloadSha256"),
            ),
          ),
        ),
      )
    ).every(Boolean);
  const expectedDiagnosticLineages =
    MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_DIAGNOSTIC_TARGETS_V1.flatMap(
      (diagnostic) =>
        (
          [
            "primary-diagonal",
            "lv-first",
            "rv-first",
            "neighbour-continuation",
            "reverse-return",
          ] as const
        ).map((lineageKind) => ({
          diagnosticId: diagnostic.diagnosticId,
          targetPointId:
            mainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointIdV1(
              diagnostic.leftVentricularIndex,
              diagnostic.rightVentricularIndex,
            ),
          lineageKind,
          targetOrReferenceEndpoint:
            lineageKind === "reverse-return"
              ? ("reference" as const)
              : ("target" as const),
          expectedSuccessfulStages:
            lineageKind === "lv-first" || lineageKind === "rv-first"
              ? 64
              : lineageKind === "neighbour-continuation"
                ? 1
                : 32,
        })),
    );
  const diagnosticLineageDefinitionReplayPassed =
    report.payload.diagnosticLineages.length ===
      expectedDiagnosticLineages.length &&
    report.payload.diagnosticLineages.every((lineage, index) => {
      const expected = expectedDiagnosticLineages[index]!;
      return (
        lineage.diagnosticId === expected.diagnosticId &&
        lineage.targetPointId === expected.targetPointId &&
        lineage.lineageKind === expected.lineageKind &&
        lineage.targetOrReferenceEndpoint ===
          expected.targetOrReferenceEndpoint &&
        (lineage.status === "diagnostic-lineage-established"
          ? lineage.completedStages === expected.expectedSuccessfulStages &&
            lineage.failedStageIndex === null &&
            lineage.failureReason === null &&
            lineage.terminal !== null
          : lineage.completedStages < expected.expectedSuccessfulStages &&
            lineage.terminal === null)
      );
    });
  const sourceBindingsReplayPassed =
    report.payload.primaryGrid.every(
      (point) =>
        point.terminal === null ||
        canonicalJsonStringify(point.terminal.sourceBindings) ===
          canonicalJsonStringify(
            MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PROTOCOL_PAYLOAD_V1.candidateSourceBindings,
          ),
    ) &&
    report.payload.sourceAndProtocolBindingsPassed ===
      (protocolPayloadReplayPassed &&
        protocolPayloadSha256ReplayPassed &&
        selectedSolverPolicyPayloadSha256ReplayPassed &&
        report.payload.primaryGrid.every(
          (point) =>
            point.terminal === null ||
            canonicalJsonStringify(point.terminal.sourceBindings) ===
              canonicalJsonStringify(
                MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PROTOCOL_PAYLOAD_V1.candidateSourceBindings,
              ),
        ));
  const independentlyRecomputedMathematicalAudits =
    evaluateMainWireIntrinsicVentricularPassiveReducedSurfaceMathematicalAuditsV1(
      report.payload.primaryGrid.map(
        projectMainWireIntrinsicVentricularPassiveReducedSurfacePrimaryPointToMathInputV1,
      ),
    );
  const mathematicalAuditsReplayPassed =
    canonicalJsonStringify(report.payload.mathematicalAudits) ===
    canonicalJsonStringify(independentlyRecomputedMathematicalAudits);
  const diagnosticComparisonsReplayPassed =
    report.payload.diagnosticLineages.every((lineage) => {
      const expectedPointId =
        lineage.targetOrReferenceEndpoint === "reference"
          ? "grid-lv-0-rv-0"
          : lineage.targetPointId;
      const expectedTerminal = report.payload.primaryGrid.find(
        (point) => point.pointId === expectedPointId,
      )?.terminal;
      return (
        expectedTerminal !== undefined &&
        canonicalJsonStringify(lineage.comparison) ===
          canonicalJsonStringify(
            compareTerminalsV1(lineage.terminal, expectedTerminal),
          )
      );
    }) &&
    report.payload.diagnosticLineageComparisonsAllWithinReportingThresholds ===
      (report.payload.diagnosticLineages.length === 20 &&
        report.payload.diagnosticLineages.every(
          (lineage) => lineage.comparison.withinReportingThresholds,
        ));
  const diagnosticTerminalCandidatesReplayPassed =
    report.payload.diagnosticLineages.every((lineage) => {
      if (lineage.terminal === null)
        return lineage.status === "diagnostic-lineage-failed";
      const endpointPoint = report.payload.primaryGrid.find(
        (point) =>
          point.pointId ===
          (lineage.targetOrReferenceEndpoint === "reference"
            ? "grid-lv-0-rv-0"
            : lineage.targetPointId),
      );
      if (endpointPoint === undefined) return false;
      try {
        const replay = terminalPointV1(
          evaluateMainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1(
            {
              chamberVolumesM3: endpointPoint.chamberVolumesM3,
              internalCoordinates: lineage.terminal.internalCoordinates,
            },
          ),
        );
        return (
          lineage.status === "diagnostic-lineage-established" &&
          canonicalJsonStringify(replay) ===
            canonicalJsonStringify(lineage.terminal)
        );
      } catch {
        return false;
      }
    });
  const expectedSelectedTracePointIds = [
    "grid-lv-0-rv-0",
    ...MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_DIAGNOSTIC_TARGETS_V1.map(
      (diagnostic) =>
        mainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointIdV1(
          diagnostic.leftVentricularIndex,
          diagnostic.rightVentricularIndex,
        ),
    ),
  ];
  const firstFailedPrimaryPointId = report.payload.primaryGrid.find(
    (point) => !point.primaryLineageEstablished,
  )?.pointId;
  if (
    firstFailedPrimaryPointId !== undefined &&
    !expectedSelectedTracePointIds.includes(firstFailedPrimaryPointId)
  )
    expectedSelectedTracePointIds.push(firstFailedPrimaryPointId);
  const selectedTraceShapeReplayPassed =
    report.payload.selectedDiagnosticTraces.length ===
      expectedSelectedTracePointIds.length &&
    report.payload.selectedDiagnosticTraces.every(
      (trace, index) =>
        trace.pointId === expectedSelectedTracePointIds[index] &&
        trace.traceId === `selected-primary-trace:${trace.pointId}` &&
        trace.stages.length ===
          report.payload.primaryGrid.find(
            (point) => point.pointId === trace.pointId,
          )?.stageOutcomeSha256s.length,
    );
  const expectedResult =
    report.payload.primaryGrid.length === 25 &&
    report.payload.primaryGrid.every(
      (point) => point.primaryLineageEstablished,
    ) &&
    report.payload.mathematicalAudits.pointAndProjectionAuditsPassed &&
    report.payload.mathematicalAudits.energyGradientAuditsPassed &&
    report.payload.mathematicalAudits.reducedHessianAuditsPassed &&
    report.payload.mathematicalAudits.maxwellAuditsPassed &&
    report.payload.mathematicalAudits.rectangularPathAuditsPassed &&
    report.payload.sourceAndProtocolBindingsPassed &&
    report.payload.executionExceptions.length === 0;
  const resultConjunctionReplayPassed =
    report.payload.allPrimaryPointLineagesPassed ===
      (report.payload.primaryGrid.length === 25 &&
        report.payload.primaryGrid.every(
          (point) => point.primaryLineageEstablished,
        )) &&
    report.payload
      .sampledLocalIntrinsicVentricularReducedPotentialConsistencyPassed ===
      expectedResult;
  const firstFailureClassReplayPassed =
    report.payload.firstFailureClass ===
    firstFailureClassV1({
      primaryGrid: report.payload.primaryGrid,
      mathematicalAudits: report.payload.mathematicalAudits,
      sourceAndProtocolBindingsPassed:
        report.payload.sourceAndProtocolBindingsPassed,
      executionExceptions: report.payload.executionExceptions,
    });
  const negativeClaimsReplayPassed =
    canonicalJsonStringify(report.payload.claims) ===
    canonicalJsonStringify(
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_NEGATIVE_CLAIMS_V1,
    );
  const payloadSha256ReplayPassed =
    report.payloadSha256 === (await sha256CanonicalJsonHex(report.payload));
  const committedResultPayloadSha256BindingPassed =
    report.payloadSha256 ===
    MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_COMMITTED_PAYLOAD_SHA256_V1;
  const gates = {
    identityAndClaimBindingsReplayPassed,
    implementationCommitBindingReplayPassed,
    protocolPayloadReplayPassed,
    protocolPayloadSha256ReplayPassed,
    selectedSolverPolicyPayloadSha256ReplayPassed,
    primaryGridDefinitionReplayPassed,
    primaryOutcomeSemanticsReplayPassed,
    primaryStageEndpointsReplayPassed,
    primaryTerminalCandidatesReplayPassed,
    primaryPointHashesReplayPassed,
    diagnosticLineageHashesReplayPassed,
    diagnosticLineageDefinitionReplayPassed,
    sourceBindingsReplayPassed,
    mathematicalAuditsReplayPassed,
    diagnosticComparisonsReplayPassed,
    diagnosticTerminalCandidatesReplayPassed,
    selectedTraceShapeReplayPassed,
    resultConjunctionReplayPassed,
    firstFailureClassReplayPassed,
    negativeClaimsReplayPassed,
    payloadSha256ReplayPassed,
    committedResultPayloadSha256BindingPassed,
  };
  return deepFreezeV1({
    status: Object.values(gates).every(Boolean)
      ? ("report-audit-passed" as const)
      : ("report-audit-failed" as const),
    ...gates,
  });
}

async function solveReferencePointV1(): Promise<RuntimePointV1> {
  const definition =
    MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_GRID_V1[0]!;
  const result = solveStageV1(
    0,
    definition.chamberVolumesM3,
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_LOADED_COORDINATES_V3,
  );
  return runtimePointFromStagesV1(definition, [
    { chamberVolumesM3: definition.chamberVolumesM3, result },
  ]);
}

async function solvePrimaryGridPointV1(
  definition: MainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointDefinitionV1,
  referenceRuntime: RuntimePointV1,
): Promise<RuntimePointV1> {
  if (
    referenceRuntime.output.status !== "primary-point-established" ||
    referenceRuntime.terminalCandidate === null
  )
    return unavailableRuntimePointV1(definition, "reference-root-unavailable");
  const schedule = Array.from({ length: 32 }, (_, index) => {
    const fraction = (index + 1) / 32;
    return {
      LV:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.LV +
        fraction *
          (definition.chamberVolumesM3.LV -
            MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.LV),
      RV:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.RV +
        fraction *
          (definition.chamberVolumesM3.RV -
            MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.RV),
    };
  });
  return runPointScheduleV1(
    definition,
    schedule,
    referenceRuntime.terminalCandidate.internalCoordinates,
  );
}

async function runPointScheduleV1(
  definition: MainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointDefinitionV1,
  schedule: readonly Readonly<{ LV: number; RV: number }>[],
  initialCoordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3,
): Promise<RuntimePointV1> {
  let coordinates = initialCoordinates;
  const stageResults: Array<{
    chamberVolumesM3: Readonly<{ LV: number; RV: number }>;
    result: MainWirePassiveEquilibriumPointSolverResultV3;
  }> = [];
  for (const [index, chamberVolumesM3] of schedule.entries()) {
    const result = solveStageV1(index + 1, chamberVolumesM3, coordinates);
    stageResults.push({ chamberVolumesM3, result });
    if (result.status !== "point-local-stable-root-established") break;
    coordinates = result.terminalCandidate.internalCoordinates;
  }
  return runtimePointFromStagesV1(definition, stageResults);
}

async function runtimePointFromStagesV1(
  definition: MainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointDefinitionV1,
  stageResults: readonly Readonly<{
    chamberVolumesM3: Readonly<{ LV: number; RV: number }>;
    result: MainWirePassiveEquilibriumPointSolverResultV3;
  }>[],
): Promise<RuntimePointV1> {
  const stageRecords = await Promise.all(
    stageResults.map(
      createMainWireIntrinsicVentricularPassiveReducedSurfaceStageRecordV1,
    ),
  );
  const last = stageResults.at(-1) ?? null;
  const successful =
    last !== null &&
    last.result.status === "point-local-stable-root-established" &&
    (definition.referencePoint || stageResults.length === 32);
  let terminalCandidate: MainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1 | null =
    null;
  if (successful) {
    terminalCandidate =
      evaluateMainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1(
        {
          chamberVolumesM3: definition.chamberVolumesM3,
          internalCoordinates:
            last.result.terminalCandidate.internalCoordinates,
        },
      );
  }
  const terminal = terminalCandidate
    ? terminalPointV1(terminalCandidate)
    : null;
  const failedStage = stageResults.find(
    (stage) => stage.result.status === "point-solve-failed",
  );
  const pointWithoutHash = {
    pointId: definition.pointId,
    leftVentricularIndex: definition.leftVentricularIndex,
    rightVentricularIndex: definition.rightVentricularIndex,
    chamberVolumesM3: { ...definition.chamberVolumesM3 },
    referencePoint: definition.referencePoint,
    status: successful
      ? ("primary-point-established" as const)
      : ("primary-point-failed" as const),
    primaryLineageEstablished: successful,
    completedStages: successful
      ? definition.referencePoint
        ? 0
        : 32
      : stageResults.filter(
          (stage) =>
            stage.result.status === "point-local-stable-root-established",
        ).length,
    failedStageIndex: failedStage?.result.stageIndex ?? null,
    failureReason:
      failedStage?.result.failureReason ??
      (stageResults.length === 0 ? "no-stage-attempted" : null),
    totalCandidateEvaluations: stageResults.reduce(
      (sum, stage) => sum + stage.result.candidateEvaluations,
      0,
    ),
    totalAcceptedUpdates: stageResults.reduce(
      (sum, stage) => sum + stage.result.acceptedUpdates,
      0,
    ),
    totalRejectedTrials: stageResults.reduce(
      (sum, stage) => sum + stage.result.rejectedTrials,
      0,
    ),
    terminal,
    stageOutcomeSha256s: stageRecords.map((stage) => stage.stagePayloadSha256),
    stageEndpoints: stageRecords.map(
      (stage) =>
        [
          stage.stageIndex,
          stage.status === "point-local-stable-root-established"
            ? "root"
            : "failed",
          stage.failureReason,
          stage.terminalCoordinates?.septalMidwallCapVolumeM3 ?? null,
          stage.terminalCoordinates?.junctionRadiusM ?? null,
          stage.terminalScaledForceInfinityNorm,
          stage.terminalMinimumScaledHessianEigenvalue,
        ] as const,
    ),
    failedStage:
      stageRecords.find((stage) => stage.status === "point-solve-failed") ??
      null,
  };
  return deepFreezeV1({
    output: {
      ...pointWithoutHash,
      pointPayloadSha256: await sha256CanonicalJsonHex(pointWithoutHash),
    },
    terminalCandidate,
    stageResults: [...stageResults],
  });
}

async function unavailableRuntimePointV1(
  definition: MainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointDefinitionV1,
  failureReason: string,
): Promise<RuntimePointV1> {
  const pointWithoutHash = {
    pointId: definition.pointId,
    leftVentricularIndex: definition.leftVentricularIndex,
    rightVentricularIndex: definition.rightVentricularIndex,
    chamberVolumesM3: { ...definition.chamberVolumesM3 },
    referencePoint: definition.referencePoint,
    status: "primary-point-failed" as const,
    primaryLineageEstablished: false,
    completedStages: 0,
    failedStageIndex: null,
    failureReason,
    totalCandidateEvaluations: 0,
    totalAcceptedUpdates: 0,
    totalRejectedTrials: 0,
    terminal: null,
    stageOutcomeSha256s: [],
    stageEndpoints: [],
    failedStage: null,
  };
  return deepFreezeV1({
    output: {
      ...pointWithoutHash,
      pointPayloadSha256: await sha256CanonicalJsonHex(pointWithoutHash),
    },
    terminalCandidate: null,
    stageResults: [],
  });
}

export async function createMainWireIntrinsicVentricularPassiveReducedSurfaceStageRecordV1(
  stage: Readonly<{
    chamberVolumesM3: Readonly<{ LV: number; RV: number }>;
    result: MainWirePassiveEquilibriumPointSolverResultV3;
  }>,
): Promise<MainWireIntrinsicVentricularPassiveReducedSurfaceStageRecordV1> {
  const withoutHash = {
    stageIndex: stage.result.stageIndex,
    chamberVolumesM3: { ...stage.chamberVolumesM3 },
    status: stage.result.status,
    failureReason: stage.result.failureReason,
    candidateEvaluations: stage.result.candidateEvaluations,
    acceptedUpdates: stage.result.acceptedUpdates,
    rejectedTrials: stage.result.rejectedTrials,
    terminalCoordinates: stage.result.terminalCandidate
      ? { ...stage.result.terminalCandidate.internalCoordinates }
      : null,
    terminalScaledForceInfinityNorm:
      stage.result.terminalCandidate?.scaledForceInfinityNorm ?? null,
    terminalMinimumScaledHessianEigenvalue:
      stage.result.terminalCandidate?.minimumScaledInternalHessianEigenvalue ??
      null,
  };
  return deepFreezeV1({
    ...withoutHash,
    stagePayloadSha256: await sha256CanonicalJsonHex(withoutHash),
  });
}

function solveStageV1(
  stageIndex: number,
  chamberVolumesM3: Readonly<{ LV: number; RV: number }>,
  initialCoordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3,
): MainWirePassiveEquilibriumPointSolverResultV3 {
  return solveMainWirePassiveEquilibriumPointEngineeringV3({
    policyId: MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID,
    stageIndex,
    initialCoordinates,
    evaluateCandidate: normalAdultCandidateEvaluatorV1(chamberVolumesM3),
  });
}

function normalAdultCandidateEvaluatorV1(
  chamberVolumesM3: Readonly<{ LV: number; RV: number }>,
): MainWirePassiveEquilibriumCandidateEvaluatorV3 {
  return (internalCoordinates) => {
    const candidate =
      evaluateMainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1(
        { chamberVolumesM3, internalCoordinates },
      );
    return {
      internalCoordinates: candidate.internalCoordinates,
      wallStoredEnergyJ: {
        LVFW: candidate.wallEquilibriumPassiveByWall.LVFW.storedEnergyJ,
        SEP: candidate.wallEquilibriumPassiveByWall.SEP.storedEnergyJ,
        RVFW: candidate.wallEquilibriumPassiveByWall.RVFW.storedEnergyJ,
      },
      scaledGradient: candidate.scaledGradient,
      scaledInternalHessian: candidate.scaledInternalHessian,
    };
  };
}

function terminalPointV1(
  candidate: MainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1,
): MainWireIntrinsicVentricularPassiveReducedSurfaceTerminalPointV1 {
  const projection = projectMainWireIntrinsicVentricularPassiveReducedHessianV1(
    candidate.rawCoupledHessian,
  );
  return deepFreezeV1({
    internalCoordinates: { ...candidate.internalCoordinates },
    rawStoredEnergyJ: candidate.rawStoredEnergyJ,
    intrinsicPressuresPa: { ...candidate.intrinsicPressuresPa },
    reducedHessianPaPerM3: projection.reducedHessianPaPerM3,
    scaledReducedHessian: projection.scaledReducedHessian,
    normalizedScaledAntisymmetry: projection.normalizedScaledAntisymmetry,
    analyticAntisymmetryPassed: projection.analyticAntisymmetryPassed,
    scaledForceInfinityNorm: candidate.scaledForceInfinityNorm,
    minimumScaledInternalHessianEigenvalue:
      candidate.minimumScaledInternalHessianEigenvalue,
    strictLocalStabilityPassed: candidate.strictLocalStabilityPassed,
    junctionRadiusPassed: candidate.junctionRadiusPassed,
    sourceBindings: { ...candidate.sourceBindings },
  });
}

async function runDiagnosticLineageV1(
  diagnosticId: string,
  leftIndex: number,
  rightIndex: number,
  lineageKind: DiagnosticLineageKindV1,
  referenceRuntime: RuntimePointV1,
  primaryById: ReadonlyMap<string, RuntimePointV1>,
): Promise<MainWireIntrinsicVentricularPassiveReducedSurfaceDiagnosticLineageV1> {
  const targetPointId =
    mainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointIdV1(
      leftIndex,
      rightIndex,
    );
  const target = primaryById.get(targetPointId);
  if (target === undefined)
    return failedDiagnosticLineageV1(
      diagnosticId,
      targetPointId,
      lineageKind,
      "target-primary-result-unavailable",
    );
  if (lineageKind === "primary-diagonal")
    return diagnosticFromPrimaryV1(
      diagnosticId,
      targetPointId,
      lineageKind,
      target,
      target,
      "target",
    );
  if (
    referenceRuntime.terminalCandidate === null ||
    target.terminalCandidate === null
  )
    return failedDiagnosticLineageV1(
      diagnosticId,
      targetPointId,
      lineageKind,
      "required-primary-root-unavailable",
    );

  const targetVolumes = target.output.chamberVolumesM3;
  if (lineageKind === "neighbour-continuation") {
    const neighbourIndices =
      leftIndex >= rightIndex && leftIndex > 0
        ? [leftIndex - 1, rightIndex]
        : [leftIndex, rightIndex - 1];
    const neighbour = primaryById.get(
      mainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointIdV1(
        neighbourIndices[0]!,
        neighbourIndices[1]!,
      ),
    );
    if (neighbour?.terminalCandidate === null || neighbour === undefined)
      return failedDiagnosticLineageV1(
        diagnosticId,
        targetPointId,
        lineageKind,
        "neighbour-primary-root-unavailable",
      );
    const result = solveStageV1(
      1,
      targetVolumes,
      neighbour.terminalCandidate.internalCoordinates,
    );
    return diagnosticFromScheduleV1(
      diagnosticId,
      targetPointId,
      lineageKind,
      [{ chamberVolumesM3: targetVolumes, result }],
      target,
      "target",
    );
  }

  if (lineageKind === "reverse-return") {
    const schedule = Array.from({ length: 32 }, (_, index) => {
      const fraction = (index + 1) / 32;
      return {
        LV:
          targetVolumes.LV +
          fraction *
            (MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.LV -
              targetVolumes.LV),
        RV:
          targetVolumes.RV +
          fraction *
            (MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.RV -
              targetVolumes.RV),
      };
    });
    const stages = runDiagnosticScheduleV1(
      schedule,
      target.terminalCandidate.internalCoordinates,
    );
    return diagnosticFromScheduleV1(
      diagnosticId,
      targetPointId,
      lineageKind,
      stages,
      referenceRuntime,
      "reference",
    );
  }

  const firstChamber = lineageKind === "lv-first" ? "LV" : "RV";
  const secondChamber = firstChamber === "LV" ? "RV" : "LV";
  const firstLeg = Array.from({ length: 32 }, (_, index) => {
    const fraction = (index + 1) / 32;
    return {
      LV:
        firstChamber === "LV"
          ? MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.LV +
            fraction *
              (targetVolumes.LV -
                MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.LV)
          : MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.LV,
      RV:
        firstChamber === "RV"
          ? MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.RV +
            fraction *
              (targetVolumes.RV -
                MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.RV)
          : MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.RV,
    };
  });
  const firstEndpoint = firstLeg.at(-1)!;
  const secondLeg = Array.from({ length: 32 }, (_, index) => {
    const fraction = (index + 1) / 32;
    return {
      LV:
        secondChamber === "LV"
          ? firstEndpoint.LV + fraction * (targetVolumes.LV - firstEndpoint.LV)
          : firstEndpoint.LV,
      RV:
        secondChamber === "RV"
          ? firstEndpoint.RV + fraction * (targetVolumes.RV - firstEndpoint.RV)
          : firstEndpoint.RV,
    };
  });
  const stages = runDiagnosticScheduleV1(
    [...firstLeg, ...secondLeg],
    referenceRuntime.terminalCandidate.internalCoordinates,
  );
  return diagnosticFromScheduleV1(
    diagnosticId,
    targetPointId,
    lineageKind,
    stages,
    target,
    "target",
  );
}

function runDiagnosticScheduleV1(
  schedule: readonly Readonly<{ LV: number; RV: number }>[],
  initialCoordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3,
): readonly Readonly<{
  chamberVolumesM3: Readonly<{ LV: number; RV: number }>;
  result: MainWirePassiveEquilibriumPointSolverResultV3;
}>[] {
  let coordinates = initialCoordinates;
  const stages = [];
  for (const [index, volumes] of schedule.entries()) {
    const result = solveStageV1(index + 1, volumes, coordinates);
    stages.push({ chamberVolumesM3: volumes, result });
    if (result.status !== "point-local-stable-root-established") break;
    coordinates = result.terminalCandidate.internalCoordinates;
  }
  return stages;
}

async function diagnosticFromPrimaryV1(
  diagnosticId: string,
  targetPointId: string,
  lineageKind: DiagnosticLineageKindV1,
  runtime: RuntimePointV1,
  expected: RuntimePointV1,
  targetOrReferenceEndpoint: "target" | "reference",
): Promise<MainWireIntrinsicVentricularPassiveReducedSurfaceDiagnosticLineageV1> {
  const withoutHash = {
    diagnosticId,
    targetPointId,
    lineageKind,
    status: runtime.output.primaryLineageEstablished
      ? ("diagnostic-lineage-established" as const)
      : ("diagnostic-lineage-failed" as const),
    targetOrReferenceEndpoint,
    completedStages: runtime.output.completedStages,
    failedStageIndex: runtime.output.failedStageIndex,
    failureReason: runtime.output.failureReason,
    totalCandidateEvaluations: runtime.output.totalCandidateEvaluations,
    totalAcceptedUpdates: runtime.output.totalAcceptedUpdates,
    totalRejectedTrials: runtime.output.totalRejectedTrials,
    terminal: runtime.output.terminal,
    comparison: compareTerminalsV1(
      runtime.output.terminal,
      expected.output.terminal,
    ),
  };
  return deepFreezeV1({
    ...withoutHash,
    lineagePayloadSha256: await sha256CanonicalJsonHex(withoutHash),
  });
}

async function diagnosticFromScheduleV1(
  diagnosticId: string,
  targetPointId: string,
  lineageKind: DiagnosticLineageKindV1,
  stages: readonly Readonly<{
    chamberVolumesM3: Readonly<{ LV: number; RV: number }>;
    result: MainWirePassiveEquilibriumPointSolverResultV3;
  }>[],
  expected: RuntimePointV1,
  targetOrReferenceEndpoint: "target" | "reference",
): Promise<MainWireIntrinsicVentricularPassiveReducedSurfaceDiagnosticLineageV1> {
  const last = stages.at(-1) ?? null;
  const failure = stages.find(
    (stage) => stage.result.status === "point-solve-failed",
  );
  const terminalCandidate =
    failure === undefined &&
    last?.result.status === "point-local-stable-root-established"
      ? evaluateMainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1(
          {
            chamberVolumesM3: last.chamberVolumesM3,
            internalCoordinates:
              last.result.terminalCandidate.internalCoordinates,
          },
        )
      : null;
  const terminal = terminalCandidate
    ? terminalPointV1(terminalCandidate)
    : null;
  const withoutHash = {
    diagnosticId,
    targetPointId,
    lineageKind,
    status:
      terminal !== null
        ? ("diagnostic-lineage-established" as const)
        : ("diagnostic-lineage-failed" as const),
    targetOrReferenceEndpoint,
    completedStages: stages.filter(
      (stage) => stage.result.status === "point-local-stable-root-established",
    ).length,
    failedStageIndex: failure?.result.stageIndex ?? null,
    failureReason: failure?.result.failureReason ?? null,
    totalCandidateEvaluations: stages.reduce(
      (sum, stage) => sum + stage.result.candidateEvaluations,
      0,
    ),
    totalAcceptedUpdates: stages.reduce(
      (sum, stage) => sum + stage.result.acceptedUpdates,
      0,
    ),
    totalRejectedTrials: stages.reduce(
      (sum, stage) => sum + stage.result.rejectedTrials,
      0,
    ),
    terminal,
    comparison: compareTerminalsV1(terminal, expected.output.terminal),
  };
  return deepFreezeV1({
    ...withoutHash,
    lineagePayloadSha256: await sha256CanonicalJsonHex(withoutHash),
  });
}

async function failedDiagnosticLineageV1(
  diagnosticId: string,
  targetPointId: string,
  lineageKind: DiagnosticLineageKindV1,
  failureReason: string,
): Promise<MainWireIntrinsicVentricularPassiveReducedSurfaceDiagnosticLineageV1> {
  const withoutHash = {
    diagnosticId,
    targetPointId,
    lineageKind,
    status: "diagnostic-lineage-failed" as const,
    targetOrReferenceEndpoint:
      lineageKind === "reverse-return"
        ? ("reference" as const)
        : ("target" as const),
    completedStages: 0,
    failedStageIndex: null,
    failureReason,
    totalCandidateEvaluations: 0,
    totalAcceptedUpdates: 0,
    totalRejectedTrials: 0,
    terminal: null,
    comparison: unavailableComparisonV1(),
  };
  return deepFreezeV1({
    ...withoutHash,
    lineagePayloadSha256: await sha256CanonicalJsonHex(withoutHash),
  });
}

function compareTerminalsV1(
  actual: MainWireIntrinsicVentricularPassiveReducedSurfaceTerminalPointV1 | null,
  expected: MainWireIntrinsicVentricularPassiveReducedSurfaceTerminalPointV1 | null,
): MainWireIntrinsicVentricularPassiveReducedSurfaceDiagnosticLineageV1["comparison"] {
  if (actual === null || expected === null) return unavailableComparisonV1();
  const coordinateDistance = Math.max(
    Math.abs(
      (actual.internalCoordinates.septalMidwallCapVolumeM3 -
        expected.internalCoordinates.septalMidwallCapVolumeM3) /
        42e-6,
    ),
    Math.abs(
      (actual.internalCoordinates.junctionRadiusM -
        expected.internalCoordinates.junctionRadiusM) /
        0.033,
    ),
  );
  const energyDifference = Math.abs(
    actual.rawStoredEnergyJ - expected.rawStoredEnergyJ,
  );
  const leftPressureDifference = Math.abs(
    actual.intrinsicPressuresPa.LV - expected.intrinsicPressuresPa.LV,
  );
  const rightPressureDifference = Math.abs(
    actual.intrinsicPressuresPa.RV - expected.intrinsicPressuresPa.RV,
  );
  return deepFreezeV1({
    available: true,
    scaledCoordinateInfinityDistance: coordinateDistance,
    absoluteStoredEnergyDifferenceJ: energyDifference,
    leftPressureAbsoluteDifferencePa: leftPressureDifference,
    rightPressureAbsoluteDifferencePa: rightPressureDifference,
    withinReportingThresholds:
      coordinateDistance <=
        MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.diagnosticScaledCoordinateInfinityDistanceMaximum &&
      energyDifference <=
        MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.diagnosticAbsoluteStoredEnergyDifferenceMaximumJ &&
      leftPressureDifference <=
        MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.diagnosticPressureAbsoluteDifferenceMaximumPa &&
      rightPressureDifference <=
        MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.diagnosticPressureAbsoluteDifferenceMaximumPa,
  });
}

function unavailableComparisonV1(): MainWireIntrinsicVentricularPassiveReducedSurfaceDiagnosticLineageV1["comparison"] {
  return deepFreezeV1({
    available: false,
    scaledCoordinateInfinityDistance: null,
    absoluteStoredEnergyDifferenceJ: null,
    leftPressureAbsoluteDifferencePa: null,
    rightPressureAbsoluteDifferencePa: null,
    withinReportingThresholds: false,
  });
}

function runtimeMathPointV1(
  runtime: RuntimePointV1,
): MainWireIntrinsicVentricularPassiveReducedSurfaceMathPointV1 {
  const terminal = runtime.output.terminal;
  return deepFreezeV1({
    pointId: runtime.output.pointId,
    leftVentricularIndex: runtime.output.leftVentricularIndex,
    rightVentricularIndex: runtime.output.rightVentricularIndex,
    chamberVolumesM3: runtime.output.chamberVolumesM3,
    status:
      terminal === null
        ? ("point-unavailable" as const)
        : ("point-available" as const),
    rawStoredEnergyJ: terminal?.rawStoredEnergyJ ?? null,
    intrinsicPressuresPa: terminal?.intrinsicPressuresPa ?? null,
    reducedHessianPaPerM3: terminal?.reducedHessianPaPerM3 ?? null,
    terminalGatesPassed:
      terminal !== null &&
      terminal.strictLocalStabilityPassed &&
      terminal.junctionRadiusPassed &&
      terminal.scaledForceInfinityNorm <=
        MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.terminalScaledForceInfinityMaximum &&
      terminal.minimumScaledInternalHessianEigenvalue >
        MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.minimumScaledInternalHessianEigenvalueExclusive,
    analyticProjectionPassed:
      terminal !== null &&
      terminal.reducedHessianPaPerM3 !== null &&
      terminal.analyticAntisymmetryPassed,
  });
}

export function projectMainWireIntrinsicVentricularPassiveReducedSurfacePrimaryPointToMathInputV1(
  point: MainWireIntrinsicVentricularPassiveReducedSurfacePrimaryPointV1,
): MainWireIntrinsicVentricularPassiveReducedSurfaceMathPointV1 {
  const terminal = point.terminal;
  return deepFreezeV1({
    pointId: point.pointId,
    leftVentricularIndex: point.leftVentricularIndex,
    rightVentricularIndex: point.rightVentricularIndex,
    chamberVolumesM3: point.chamberVolumesM3,
    status:
      terminal === null
        ? ("point-unavailable" as const)
        : ("point-available" as const),
    rawStoredEnergyJ: terminal?.rawStoredEnergyJ ?? null,
    intrinsicPressuresPa: terminal?.intrinsicPressuresPa ?? null,
    reducedHessianPaPerM3: terminal?.reducedHessianPaPerM3 ?? null,
    terminalGatesPassed:
      terminal !== null &&
      terminal.strictLocalStabilityPassed &&
      terminal.junctionRadiusPassed &&
      terminal.scaledForceInfinityNorm <=
        MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.terminalScaledForceInfinityMaximum &&
      terminal.minimumScaledInternalHessianEigenvalue >
        MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.minimumScaledInternalHessianEigenvalueExclusive,
    analyticProjectionPassed:
      terminal !== null &&
      terminal.reducedHessianPaPerM3 !== null &&
      terminal.analyticAntisymmetryPassed,
  });
}

function selectedDiagnosticTracesV1(
  primaryById: ReadonlyMap<string, RuntimePointV1>,
): readonly SelectedTraceV1[] {
  const pointIds: string[] = [
    "grid-lv-0-rv-0",
    ...MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_DIAGNOSTIC_TARGETS_V1.map(
      (diagnostic) =>
        mainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointIdV1(
          diagnostic.leftVentricularIndex,
          diagnostic.rightVentricularIndex,
        ),
    ),
  ];
  const firstFailedPointId = [...primaryById.values()].find(
    (runtime) => !runtime.output.primaryLineageEstablished,
  )?.output.pointId;
  if (
    firstFailedPointId !== undefined &&
    !pointIds.includes(firstFailedPointId)
  )
    pointIds.push(firstFailedPointId);
  return deepFreezeV1(
    pointIds.flatMap((pointId) => {
      const runtime = primaryById.get(pointId);
      if (runtime === undefined) return [];
      return [
        {
          traceId: `selected-primary-trace:${pointId}`,
          pointId,
          stages: runtime.stageResults.map((stage) => ({
            stageIndex: stage.result.stageIndex,
            chamberVolumesM3: { ...stage.chamberVolumesM3 },
            status: stage.result.status,
            failureReason: stage.result.failureReason,
            iterationDecisions: compactIterationDecisionsV1(stage.result.trace),
          })),
        },
      ];
    }),
  );
}

function compactIterationDecisionsV1(
  trace: readonly MainWirePassiveEquilibriumIterationRecordV3[],
): SelectedTraceV1["stages"][number]["iterationDecisions"] {
  return trace.map((iteration) => ({
    iterationIndex: iteration.iterationIndex,
    currentScaledForceInfinityNorm: iteration.currentScaledForceInfinityNorm,
    currentMinimumScaledHessianEigenvalue:
      iteration.currentMinimumScaledHessianEigenvalue,
    selectedTrialIndex: iteration.selectedTrialIndex,
    selectedReason: iteration.selectedReason,
    scaledUpdateInfinityNorm: iteration.scaledUpdateInfinityNorm,
    trialCount: iteration.trials.length,
  }));
}

function firstFailureClassV1(
  input: Readonly<{
    primaryGrid: readonly MainWireIntrinsicVentricularPassiveReducedSurfacePrimaryPointV1[];
    mathematicalAudits: MainWireIntrinsicVentricularPassiveReducedSurfaceMathematicalAuditsV1;
    sourceAndProtocolBindingsPassed: boolean;
    executionExceptions: readonly unknown[];
  }>,
): MainWireIntrinsicVentricularPassiveReducedSurfacePilotPayloadV1["firstFailureClass"] {
  if (input.executionExceptions.length > 0)
    return "execution-or-integrity-failure";
  if (!input.sourceAndProtocolBindingsPassed) return "source-binding-failure";
  if (input.primaryGrid.some((point) => !point.primaryLineageEstablished))
    return "point-solve-failure";
  if (!input.mathematicalAudits.pointAndProjectionAuditsPassed)
    return "strict-stability-or-projection-failure";
  if (!input.mathematicalAudits.energyGradientAuditsPassed)
    return "energy-gradient-inconsistency";
  if (!input.mathematicalAudits.reducedHessianAuditsPassed)
    return "reduced-hessian-inconsistency";
  if (!input.mathematicalAudits.maxwellAuditsPassed)
    return "maxwell-inconsistency";
  if (!input.mathematicalAudits.rectangularPathAuditsPassed)
    return "path-refinement-inconsistency";
  return null;
}

function sanitizeErrorV1(
  phase: string,
  error: unknown,
): Readonly<{ phase: string; name: string; message: string }> {
  return {
    phase,
    name: error instanceof Error ? error.name : "NonErrorThrown",
    message: error instanceof Error ? error.message : String(error),
  };
}

function withoutKeyV1<
  TObject extends Readonly<Record<string, unknown>>,
  TKey extends keyof TObject,
>(object: TObject, key: TKey): Omit<TObject, TKey> {
  const copy = { ...object };
  delete copy[key];
  return copy;
}

function deepFreezeV1<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>))
      deepFreezeV1(child);
    Object.freeze(value);
  }
  return value;
}
