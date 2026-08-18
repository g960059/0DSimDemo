import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MANUFACTURED_STAGE_V2,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_NUMERICAL_EVIDENCE_V2,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2_ID,
  type MainWirePassiveEquilibriumCandidateRecordV2,
  type MainWirePassiveEquilibriumCandidateSnapshotV2,
  type MainWirePassiveEquilibriumFloat64V2,
  type MainWirePassiveEquilibriumIterationEvidenceV2,
  type MainWirePassiveEquilibriumManufacturedStageEnvelopeV2,
  type MainWirePassiveEquilibriumStageKernelResultV2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumNumericsV2";

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_EVIDENCE_AUDITOR_V2_ID =
  "main-wire-normal-adult-passive-equilibrium-point-solver-v2-engineering-evidence-auditor-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_AUDITOR_REPORT_V2 =
  "main-wire-normal-adult-passive-equilibrium-point-solver-v2-engineering-auditor-report-v1" as const;

export type MainWirePassiveEquilibriumEvidenceAuditorReportV2 = Readonly<{
  auditorId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_EVIDENCE_AUDITOR_V2_ID;
  reportSchemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_AUDITOR_REPORT_V2;
  qualification: "manufactured-non-qualified";
  auditStatus: "passed" | "failed";
  firstMismatchPath: string | null;
  checks: Readonly<{
    policyBindingPassed: boolean;
    hierarchicalHashesPassed: boolean;
    float64WrappersPassed: boolean;
    closedUnionAndCoveragePassed: boolean;
    independentArithmeticReplayPassed: boolean;
    firstSelectionAndDecisionReplayPassed: boolean;
    stageAggregateReplayPassed: boolean;
  }>;
  evidenceStageResultSha256: string;
}>;

export type MainWirePassiveEquilibriumEvidenceAuditorEnvelopeV2 = Readonly<{
  report: MainWirePassiveEquilibriumEvidenceAuditorReportV2;
  reportSha256: string;
}>;

export type MainWirePassiveEquilibriumStageKernelEnvelopeV2 = Readonly<{
  qualification: "neutral-unqualified-kernel-evidence";
  solverPolicyId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2_ID;
  solverPolicySha256: string;
  iterationEvidenceSha256: readonly string[];
  stageResult: MainWirePassiveEquilibriumStageKernelResultV2;
  stageResultSha256: string;
}>;

export type MainWirePassiveEquilibriumStageKernelAuditorEnvelopeV2 = Readonly<{
  report: Readonly<{
    auditorId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_EVIDENCE_AUDITOR_V2_ID;
    reportSchemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_AUDITOR_REPORT_V2;
    qualification: "neutral-unqualified-kernel-audit";
    auditStatus: "passed" | "failed";
    firstMismatchPath: string | null;
    checks: MainWirePassiveEquilibriumEvidenceAuditorReportV2["checks"];
    evidenceStageResultSha256: string;
    replayViewStageResultSha256: string;
  }>;
  reportSha256: string;
}>;

type AuditCheckKeyV2 =
  keyof MainWirePassiveEquilibriumEvidenceAuditorReportV2["checks"];

type IndependentFloat64V2 = Readonly<{
  value: number | null;
  float64BitsHex: string;
  classification: "finite" | "positive-infinity" | "negative-infinity" | "nan";
}>;

class AuditStateV2 {
  firstMismatchPath: string | null = null;
  readonly failedChecks = new Set<AuditCheckKeyV2>();

  expect(condition: boolean, path: string, check: AuditCheckKeyV2): boolean {
    if (condition) return true;
    if (this.firstMismatchPath === null) this.firstMismatchPath = path;
    this.failedChecks.add(check);
    return false;
  }
}

export async function auditMainWirePassiveEquilibriumManufacturedStageV2(
  envelope: MainWirePassiveEquilibriumManufacturedStageEnvelopeV2,
): Promise<MainWirePassiveEquilibriumEvidenceAuditorEnvelopeV2> {
  const state = new AuditStateV2();
  const policyHash = await sha256CanonicalJsonHex(
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2,
  );
  state.expect(
    envelope.qualification === "manufactured-non-qualified" &&
      envelope.evidenceSchemaId ===
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_NUMERICAL_EVIDENCE_V2 &&
      envelope.stageResult.qualification === "manufactured-non-qualified" &&
      envelope.stageResult.schemaId ===
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MANUFACTURED_STAGE_V2 &&
      envelope.stageResult.solverPolicyId ===
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2_ID &&
      envelope.solverPolicySha256 === policyHash,
    "$.policyBinding",
    "policyBindingPassed",
  );

  const actualStageHash = await sha256CanonicalJsonHex(envelope.stageResult);
  state.expect(
    envelope.stageResultSha256 === actualStageHash &&
      envelope.iterationEvidenceSha256.length ===
        envelope.stageResult.iterations.length,
    "$.hierarchicalHashes",
    "hierarchicalHashesPassed",
  );
  for (
    let index = 0;
    index < envelope.stageResult.iterations.length;
    index += 1
  ) {
    const actual = await sha256CanonicalJsonHex(
      envelope.stageResult.iterations[index],
    );
    state.expect(
      envelope.iterationEvidenceSha256[index] === actual,
      `$.iterationEvidenceSha256[${index}]`,
      "hierarchicalHashesPassed",
    );
  }

  try {
    auditAllFloatWrappersV2(envelope.stageResult, "$stageResult", state);
    auditNestedEvidenceShapesV2(envelope.stageResult, "$stageResult", state);
    auditStageResultV2(envelope, state);
  } catch {
    state.expect(
      false,
      "$.auditor.structural-replay-exception",
      "closedUnionAndCoveragePassed",
    );
  }

  const checks = Object.freeze({
    policyBindingPassed: !state.failedChecks.has("policyBindingPassed"),
    hierarchicalHashesPassed: !state.failedChecks.has(
      "hierarchicalHashesPassed",
    ),
    float64WrappersPassed: !state.failedChecks.has("float64WrappersPassed"),
    closedUnionAndCoveragePassed: !state.failedChecks.has(
      "closedUnionAndCoveragePassed",
    ),
    independentArithmeticReplayPassed: !state.failedChecks.has(
      "independentArithmeticReplayPassed",
    ),
    firstSelectionAndDecisionReplayPassed: !state.failedChecks.has(
      "firstSelectionAndDecisionReplayPassed",
    ),
    stageAggregateReplayPassed: !state.failedChecks.has(
      "stageAggregateReplayPassed",
    ),
  });
  const report = deepFreezeAuditorV2({
    auditorId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_EVIDENCE_AUDITOR_V2_ID,
    reportSchemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_AUDITOR_REPORT_V2,
    qualification: "manufactured-non-qualified" as const,
    auditStatus:
      state.firstMismatchPath === null
        ? ("passed" as const)
        : ("failed" as const),
    firstMismatchPath: state.firstMismatchPath,
    checks,
    evidenceStageResultSha256: envelope.stageResultSha256,
  });
  return deepFreezeAuditorV2({
    report,
    reportSha256: await sha256CanonicalJsonHex(report),
  });
}

/**
 * Independently audits the neutral kernel without promoting it. A private
 * manufactured-shaped replay view is used only to reuse the closed arithmetic
 * auditor; neither the input nor report can mint official eligibility.
 */
export async function auditMainWirePassiveEquilibriumStageKernelV2(
  envelope: MainWirePassiveEquilibriumStageKernelEnvelopeV2,
): Promise<MainWirePassiveEquilibriumStageKernelAuditorEnvelopeV2> {
  const solverPolicySha256 = await sha256CanonicalJsonHex(
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2,
  );
  const actualStageResultSha256 = await sha256CanonicalJsonHex(
    envelope.stageResult,
  );
  const actualIterationHashes = await Promise.all(
    envelope.stageResult.iterations.map((iteration) =>
      sha256CanonicalJsonHex(iteration),
    ),
  );
  const kernelBindingsPassed =
    envelope.qualification === "neutral-unqualified-kernel-evidence" &&
    envelope.solverPolicyId ===
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2_ID &&
    envelope.solverPolicySha256 === solverPolicySha256 &&
    envelope.stageResultSha256 === actualStageResultSha256 &&
    envelope.iterationEvidenceSha256.length === actualIterationHashes.length &&
    actualIterationHashes.every(
      (hash, index) => envelope.iterationEvidenceSha256[index] === hash,
    );
  const replayView = deepFreezeAuditorV2({
    qualification: "manufactured-non-qualified" as const,
    schemaId: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MANUFACTURED_STAGE_V2,
    solverPolicyId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2_ID,
    ...envelope.stageResult,
  });
  const replayViewStageResultSha256 = await sha256CanonicalJsonHex(replayView);
  const replayAudit = await auditMainWirePassiveEquilibriumManufacturedStageV2(
    deepFreezeAuditorV2({
      qualification: "manufactured-non-qualified" as const,
      evidenceSchemaId:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_NUMERICAL_EVIDENCE_V2,
      solverPolicySha256,
      iterationEvidenceSha256: actualIterationHashes,
      stageResult: replayView,
      stageResultSha256: replayViewStageResultSha256,
    }),
  );
  const checks = deepFreezeAuditorV2({
    ...replayAudit.report.checks,
    policyBindingPassed:
      replayAudit.report.checks.policyBindingPassed && kernelBindingsPassed,
    hierarchicalHashesPassed:
      replayAudit.report.checks.hierarchicalHashesPassed &&
      kernelBindingsPassed,
  });
  const auditStatus =
    kernelBindingsPassed && replayAudit.report.auditStatus === "passed"
      ? ("passed" as const)
      : ("failed" as const);
  const report = deepFreezeAuditorV2({
    auditorId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_EVIDENCE_AUDITOR_V2_ID,
    reportSchemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_AUDITOR_REPORT_V2,
    qualification: "neutral-unqualified-kernel-audit" as const,
    auditStatus,
    firstMismatchPath: kernelBindingsPassed
      ? replayAudit.report.firstMismatchPath
      : "$.neutralKernelBinding",
    checks,
    evidenceStageResultSha256: envelope.stageResultSha256,
    replayViewStageResultSha256,
  });
  return deepFreezeAuditorV2({
    report,
    reportSha256: await sha256CanonicalJsonHex(report),
  });
}

function auditStageResultV2(
  envelope: MainWirePassiveEquilibriumManufacturedStageEnvelopeV2,
  state: AuditStateV2,
): void {
  const result = envelope.stageResult;
  state.expect(
    Number.isSafeInteger(result.stageIndex) && result.stageIndex >= 0,
    "$.stageResult.stageIndex",
    "closedUnionAndCoveragePassed",
  );
  let selectedCount = 0;
  let selectedBacktrackSum = 0;
  let previousSelectedTrialCoordinates:
    | MainWirePassiveEquilibriumCandidateSnapshotV2["internalCoordinates"]
    | null = null;
  let expectedTerminalCandidate: MainWirePassiveEquilibriumCandidateSnapshotV2 | null =
    null;
  let terminalOutcome: "converged" | "failed" | "continue-newton" | null = null;
  let expectedFailureReason: string | null = null;
  let expectedLastAcceptedStepDiagnostics: unknown = null;

  state.expect(
    hasExactKeysV2(
      result,
      result.status === "converged"
        ? [
            "qualification",
            "schemaId",
            "solverPolicyId",
            "status",
            "stageIndex",
            "initialCoordinates",
            "iterations",
            "completedNewtonUpdates",
            "selectedLineSearchBacktracks",
            "lastAcceptedStepDiagnostics",
            "terminalCandidate",
          ]
        : [
            "qualification",
            "schemaId",
            "solverPolicyId",
            "status",
            "failureReason",
            "stageIndex",
            "initialCoordinates",
            "iterations",
            "completedNewtonUpdates",
            "selectedLineSearchBacktracks",
            "lastAcceptedStepDiagnostics",
            "terminalCandidate",
          ],
    ),
    "$.stageResult.fields",
    "closedUnionAndCoveragePassed",
  );
  state.expect(
    result.iterations.length <=
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2.maximumNewtonAcceptedUpdatesPerStage +
        1,
    "$.stageResult.iterations.maximum",
    "stageAggregateReplayPassed",
  );

  for (let index = 0; index < result.iterations.length; index += 1) {
    const iteration = result.iterations[index];
    const path = `$.stageResult.iterations[${index}]`;
    const current = iteration.currentSolverEvidence;
    auditIterationUnionShapeV2(iteration, path, state);
    state.expect(
      current.stageIndex === result.stageIndex &&
        current.iterationIndex === index,
      `${path}.identity`,
      "closedUnionAndCoveragePassed",
    );
    if (previousSelectedTrialCoordinates !== null) {
      state.expect(
        sameJsonV2(
          current.currentCoordinates,
          previousSelectedTrialCoordinates,
        ),
        `${path}.currentCoordinates.lineage`,
        "stageAggregateReplayPassed",
      );
      previousSelectedTrialCoordinates = null;
    }
    if (index === 0) {
      state.expect(
        sameJsonV2(current.currentCoordinates, result.initialCoordinates),
        `${path}.initialCoordinatesBinding`,
        "stageAggregateReplayPassed",
      );
    }
    if (iteration.status === "line-search-not-entered") {
      state.expect(
        Array.isArray(iteration.candidateRecords) &&
          iteration.candidateRecords.length === 0,
        `${path}.candidateRecords`,
        "closedUnionAndCoveragePassed",
      );
      auditPretrialIterationV2(iteration, path, state);
      if (iteration.outcome === "converged") {
        terminalOutcome = "converged";
        if ("currentCandidate" in current)
          expectedTerminalCandidate = current.currentCandidate;
      } else {
        terminalOutcome = "failed";
        expectedFailureReason = iteration.reason;
        if ("currentCandidate" in current)
          expectedTerminalCandidate = current.currentCandidate;
      }
      state.expect(
        index === result.iterations.length - 1,
        `${path}.terminalPosition`,
        "stageAggregateReplayPassed",
      );
      continue;
    }

    const selected = auditLineSearchIterationV2(iteration, path, state);
    state.expect(
      index <
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2.maximumNewtonAcceptedUpdatesPerStage,
      `${path}.lineSearchIterationBoundary`,
      "stageAggregateReplayPassed",
    );
    if (selected !== null) {
      selectedCount += 1;
      selectedBacktrackSum += selected.b;
      expectedTerminalCandidate = selected.trialCandidate;
      const currentSnapshot = iteration.currentSolverEvidence.currentCandidate;
      const direction = iteration.currentSolverEvidence.direction.map(
        unwrapV2,
      ) as [number, number];
      const alpha = 2 ** -selected.b;
      expectedLastAcceptedStepDiagnostics = {
        selectedBacktrackExponent: selected.b,
        scaledUpdateInfinityNorm: independentWrapV2(
          alpha * Math.max(Math.abs(direction[0]), Math.abs(direction[1])),
        ),
        currentScaledForceInfinityNorm: currentSnapshot.scaledForceInfinityNorm,
        acceptedScaledForceInfinityNorm:
          selected.trialCandidate.scaledForceInfinityNorm,
        currentEnergyJ: currentSnapshot.rawVentricularStoredEnergyJ,
        acceptedEnergyJ: selected.trialCandidate.rawVentricularStoredEnergyJ,
        gDotD: iteration.currentSolverEvidence.gDotD,
      };
    }
    const decision = iteration.decision;
    if (decision.outcome === "continue-newton") {
      terminalOutcome = "continue-newton";
      if (selected !== null)
        previousSelectedTrialCoordinates =
          selected.trialCandidate.internalCoordinates;
      state.expect(
        index < result.iterations.length - 1,
        `${path}.continueHasNextIteration`,
        "stageAggregateReplayPassed",
      );
    } else if (decision.outcome === "force-converged") {
      terminalOutcome = "converged";
      state.expect(
        index === result.iterations.length - 1,
        `${path}.terminalPosition`,
        "stageAggregateReplayPassed",
      );
    } else {
      terminalOutcome = "failed";
      expectedFailureReason = decision.stageFailureReason;
      if (decision.outcome === "line-search-failed")
        expectedTerminalCandidate =
          iteration.currentSolverEvidence.currentCandidate;
      state.expect(
        index === result.iterations.length - 1,
        `${path}.terminalPosition`,
        "stageAggregateReplayPassed",
      );
    }
  }

  state.expect(
    result.iterations.length > 0 &&
      result.completedNewtonUpdates === selectedCount &&
      result.selectedLineSearchBacktracks === selectedBacktrackSum,
    "$.stageResult.aggregateCounts",
    "stageAggregateReplayPassed",
  );
  state.expect(
    sameJsonV2(
      result.lastAcceptedStepDiagnostics,
      expectedLastAcceptedStepDiagnostics,
    ),
    "$.stageResult.lastAcceptedStepDiagnostics",
    "stageAggregateReplayPassed",
  );
  state.expect(
    (result.status === "converged" && terminalOutcome === "converged") ||
      (result.status === "failed" && terminalOutcome === "failed"),
    "$.stageResult.status",
    "stageAggregateReplayPassed",
  );
  if (result.status === "failed") {
    state.expect(
      result.failureReason === expectedFailureReason,
      "$.stageResult.failureReason",
      "stageAggregateReplayPassed",
    );
  }
  state.expect(
    sameJsonV2(result.terminalCandidate, expectedTerminalCandidate),
    "$.stageResult.terminalCandidate",
    "stageAggregateReplayPassed",
  );
}

function auditPretrialIterationV2(
  iteration: Extract<
    MainWirePassiveEquilibriumIterationEvidenceV2,
    { status: "line-search-not-entered" }
  >,
  path: string,
  state: AuditStateV2,
): void {
  const policy =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2;
  const current = iteration.currentSolverEvidence;
  const coords = unwrapCoordinatesV2(current.currentCoordinates);
  const allowedReason =
    iteration.reason === "junction-radius-below-minimum" ||
    iteration.reason === "candidate-evaluation-failed" ||
    iteration.reason === "scaled-internal-hessian-singular" ||
    iteration.reason === "scaled-internal-hessian-not-positive-definite" ||
    iteration.reason === "scaled-force-tolerance-reached" ||
    iteration.reason === "newton-iteration-limit" ||
    iteration.reason === "newton-direction-not-descent";
  state.expect(allowedReason, `${path}.reason`, "closedUnionAndCoveragePassed");
  if (!allowedReason) return;
  if (iteration.reason === "junction-radius-below-minimum") {
    state.expect(
      iteration.outcome === "pretrial-failure" &&
        current.availability === "coordinates-only" &&
        !(coords.junctionRadiusM > policy.minimumJunctionRadiusMExclusive),
      `${path}.junctionFailure`,
      "firstSelectionAndDecisionReplayPassed",
    );
    return;
  }
  if (iteration.reason === "candidate-evaluation-failed") {
    state.expect(
      iteration.outcome === "pretrial-failure" &&
        current.availability === "coordinates-with-exception" &&
        typeof current.exception.name === "string" &&
        typeof current.exception.message === "string",
      `${path}.candidateFailureAvailability`,
      "closedUnionAndCoveragePassed",
    );
    return;
  }
  const expectedAvailability =
    iteration.reason === "newton-direction-not-descent"
      ? iteration.directionFailureKind === "direction-non-finite"
        ? "direction-without-gdotd"
        : "direction-with-gdotd"
      : "candidate-and-hessian";
  const expectedOutcome =
    iteration.reason === "scaled-force-tolerance-reached"
      ? "converged"
      : "pretrial-failure";
  state.expect(
    current.availability === expectedAvailability &&
      iteration.outcome === expectedOutcome,
    `${path}.reasonOutcomeAvailability`,
    "closedUnionAndCoveragePassed",
  );
  if (!("currentCandidate" in current) || !("determinant" in current)) return;
  const candidate = unwrapCandidateSnapshotV2(current.currentCandidate);
  auditCandidateSnapshotConsistencyV2(
    current.currentCandidate,
    current.currentCoordinates,
    `${path}.currentCandidate`,
    state,
    true,
  );
  const [[h00, h01], [, h11]] = candidate.hessian;
  const determinant = h00 * h11 - h01 * h01;
  const hessianGatePassed = Number.isFinite(determinant) && determinant !== 0;
  const stabilityGatePassed =
    hessianGatePassed && current.currentCandidate.strictLocalStabilityPassed;
  state.expect(
    sameFloatWrapperV2(current.determinant, independentWrapV2(determinant)),
    `${path}.determinant`,
    "independentArithmeticReplayPassed",
  );
  if (iteration.reason === "scaled-internal-hessian-singular") {
    state.expect(
      !Number.isFinite(determinant) || determinant === 0,
      `${path}.singularityDecision`,
      "firstSelectionAndDecisionReplayPassed",
    );
  } else if (
    iteration.reason === "scaled-internal-hessian-not-positive-definite"
  ) {
    state.expect(
      hessianGatePassed && !current.currentCandidate.strictLocalStabilityPassed,
      `${path}.positiveDefiniteDecision`,
      "firstSelectionAndDecisionReplayPassed",
    );
  } else if (iteration.reason === "scaled-force-tolerance-reached") {
    state.expect(
      iteration.outcome === "converged" &&
        stabilityGatePassed &&
        candidate.force <= policy.scaledForceInfinityTolerance,
      `${path}.forceDecision`,
      "firstSelectionAndDecisionReplayPassed",
    );
  } else if (iteration.reason === "newton-iteration-limit") {
    state.expect(
      stabilityGatePassed &&
        current.iterationIndex ===
          policy.maximumNewtonAcceptedUpdatesPerStage &&
        candidate.force > policy.scaledForceInfinityTolerance,
      `${path}.iterationLimitDecision`,
      "firstSelectionAndDecisionReplayPassed",
    );
  } else if (iteration.reason === "newton-direction-not-descent") {
    state.expect(
      stabilityGatePassed &&
        candidate.force > policy.scaledForceInfinityTolerance &&
        current.iterationIndex < policy.maximumNewtonAcceptedUpdatesPerStage,
      `${path}.directionPreconditions`,
      "firstSelectionAndDecisionReplayPassed",
    );
    auditDirectionFailureV2(iteration, candidate, determinant, path, state);
  }
}

function auditIterationUnionShapeV2(
  iteration: MainWirePassiveEquilibriumIterationEvidenceV2,
  path: string,
  state: AuditStateV2,
): void {
  if (iteration.status === "line-search-entered") {
    state.expect(
      hasExactKeysV2(iteration, [
        "status",
        "decision",
        "currentSolverEvidence",
        "candidateRecords",
      ]) &&
        hasExactKeysV2(iteration.currentSolverEvidence, [
          "stageIndex",
          "iterationIndex",
          "currentCoordinates",
          "availability",
          "currentCandidate",
          "determinant",
          "direction",
          "gDotD",
          "hTimesDirectionPlusGradient",
          "hTimesDirectionPlusGradientInfinityNorm",
        ]) &&
        hasExactKeysV2(iteration.decision, [
          "outcome",
          "selectedBacktrackExponent",
          "stageFailureReason",
        ]),
      `${path}.fields`,
      "closedUnionAndCoveragePassed",
    );
    return;
  }
  const directionFailure = iteration.reason === "newton-direction-not-descent";
  state.expect(
    hasExactKeysV2(
      iteration,
      directionFailure
        ? [
            "status",
            "outcome",
            "reason",
            "directionFailureKind",
            "currentSolverEvidence",
            "candidateRecords",
          ]
        : [
            "status",
            "outcome",
            "reason",
            "currentSolverEvidence",
            "candidateRecords",
          ],
    ),
    `${path}.fields`,
    "closedUnionAndCoveragePassed",
  );
  const current = iteration.currentSolverEvidence;
  const expectedCurrentKeys =
    current.availability === "coordinates-only"
      ? ["stageIndex", "iterationIndex", "currentCoordinates", "availability"]
      : current.availability === "coordinates-with-exception"
        ? [
            "stageIndex",
            "iterationIndex",
            "currentCoordinates",
            "availability",
            "exception",
          ]
        : current.availability === "candidate-and-hessian"
          ? [
              "stageIndex",
              "iterationIndex",
              "currentCoordinates",
              "availability",
              "currentCandidate",
              "determinant",
            ]
          : current.availability === "direction-without-gdotd"
            ? [
                "stageIndex",
                "iterationIndex",
                "currentCoordinates",
                "availability",
                "currentCandidate",
                "determinant",
                "direction",
              ]
            : [
                "stageIndex",
                "iterationIndex",
                "currentCoordinates",
                "availability",
                "currentCandidate",
                "determinant",
                "direction",
                "gDotD",
              ];
  state.expect(
    hasExactKeysV2(current, expectedCurrentKeys),
    `${path}.currentSolverEvidence.fields`,
    "closedUnionAndCoveragePassed",
  );
}

function auditDirectionFailureV2(
  iteration: Extract<
    MainWirePassiveEquilibriumIterationEvidenceV2,
    { reason: "newton-direction-not-descent" }
  >,
  candidate: ReturnType<typeof unwrapCandidateSnapshotV2>,
  determinant: number,
  path: string,
  state: AuditStateV2,
): void {
  const current = iteration.currentSolverEvidence;
  if (
    current.availability !== "direction-without-gdotd" &&
    current.availability !== "direction-with-gdotd"
  ) {
    state.expect(
      false,
      `${path}.directionAvailability`,
      "closedUnionAndCoveragePassed",
    );
    return;
  }
  const [g0, g1] = candidate.gradient;
  const [[h00, h01], [, h11]] = candidate.hessian;
  const d0 = -(h11 * g0 - h01 * g1) / determinant;
  const d1 = -(-h01 * g0 + h00 * g1) / determinant;
  state.expect(
    sameFloatWrapperV2(current.direction[0], independentWrapV2(d0)) &&
      sameFloatWrapperV2(current.direction[1], independentWrapV2(d1)),
    `${path}.direction`,
    "independentArithmeticReplayPassed",
  );
  if (iteration.directionFailureKind === "direction-non-finite") {
    state.expect(
      !Number.isFinite(d0) || !Number.isFinite(d1),
      `${path}.directionFailureKind`,
      "firstSelectionAndDecisionReplayPassed",
    );
    return;
  }
  if (current.availability !== "direction-with-gdotd") return;
  const gDotD = g0 * d0 + g1 * d1;
  state.expect(
    sameFloatWrapperV2(current.gDotD, independentWrapV2(gDotD)),
    `${path}.gDotD`,
    "independentArithmeticReplayPassed",
  );
  state.expect(
    iteration.directionFailureKind ===
      (!Number.isFinite(gDotD) ? "gdotd-non-finite" : "gdotd-non-negative") &&
      (!Number.isFinite(gDotD) || !(gDotD < 0)),
    `${path}.directionFailureKind`,
    "firstSelectionAndDecisionReplayPassed",
  );
}

function auditLineSearchIterationV2(
  iteration: Extract<
    MainWirePassiveEquilibriumIterationEvidenceV2,
    { status: "line-search-entered" }
  >,
  path: string,
  state: AuditStateV2,
): Extract<
  MainWirePassiveEquilibriumCandidateRecordV2,
  { status: "evaluated" }
> | null {
  state.expect(
    iteration.candidateRecords.length === 29,
    `${path}.candidateRecords.length`,
    "closedUnionAndCoveragePassed",
  );
  const current = unwrapCandidateSnapshotV2(
    iteration.currentSolverEvidence.currentCandidate,
  );
  auditCandidateSnapshotConsistencyV2(
    iteration.currentSolverEvidence.currentCandidate,
    iteration.currentSolverEvidence.currentCoordinates,
    `${path}.currentCandidate`,
    state,
    true,
  );
  const [d0, d1] = iteration.currentSolverEvidence.direction.map(unwrapV2) as [
    number,
    number,
  ];
  const [g0, g1] = current.gradient;
  const [[h00, h01], [h10, h11]] = current.hessian;
  const determinant = h00 * h11 - h01 * h01;
  const expectedD0 = -(h11 * g0 - h01 * g1) / determinant;
  const expectedD1 = -(-h01 * g0 + h00 * g1) / determinant;
  const gDotD = g0 * d0 + g1 * d1;
  const residual0 = h00 * d0 + h01 * d1 + g0;
  const residual1 = h10 * d0 + h11 * d1 + g1;
  state.expect(
    sameFloatWrapperV2(
      iteration.currentSolverEvidence.determinant,
      independentWrapV2(determinant),
    ) &&
      sameFloatWrapperV2(
        iteration.currentSolverEvidence.direction[0],
        independentWrapV2(expectedD0),
      ) &&
      sameFloatWrapperV2(
        iteration.currentSolverEvidence.direction[1],
        independentWrapV2(expectedD1),
      ) &&
      sameFloatWrapperV2(
        iteration.currentSolverEvidence.gDotD,
        independentWrapV2(gDotD),
      ) &&
      sameFloatWrapperV2(
        iteration.currentSolverEvidence.hTimesDirectionPlusGradient[0],
        independentWrapV2(residual0),
      ) &&
      sameFloatWrapperV2(
        iteration.currentSolverEvidence.hTimesDirectionPlusGradient[1],
        independentWrapV2(residual1),
      ) &&
      sameFloatWrapperV2(
        iteration.currentSolverEvidence.hTimesDirectionPlusGradientInfinityNorm,
        independentWrapV2(Math.max(Math.abs(residual0), Math.abs(residual1))),
      ),
    `${path}.currentSolverArithmetic`,
    "independentArithmeticReplayPassed",
  );
  state.expect(
    Number.isFinite(determinant) &&
      determinant !== 0 &&
      iteration.currentSolverEvidence.currentCandidate
        .strictLocalStabilityPassed &&
      current.force >
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2.scaledForceInfinityTolerance &&
      iteration.currentSolverEvidence.iterationIndex <
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2.maximumNewtonAcceptedUpdatesPerStage,
    `${path}.preLineSearchDecisionBoundary`,
    "firstSelectionAndDecisionReplayPassed",
  );
  state.expect(
    [d0, d1, gDotD, residual0, residual1].every(Number.isFinite) && gDotD < 0,
    `${path}.currentSolverFiniteDescent`,
    "firstSelectionAndDecisionReplayPassed",
  );

  let firstSatisfiedB: number | null = null;
  for (let b = 0; b < iteration.candidateRecords.length; b += 1) {
    const record = iteration.candidateRecords[b];
    const recordPath = `${path}.candidateRecords[${b}]`;
    state.expect(
      record.b === b,
      `${recordPath}.b`,
      "closedUnionAndCoveragePassed",
    );
    auditCandidateRecordArithmeticV2(
      record,
      current,
      d0,
      d1,
      gDotD,
      recordPath,
      state,
    );
    if (
      firstSatisfiedB === null &&
      record.status === "evaluated" &&
      record.reason === "armijo-satisfied"
    )
      firstSatisfiedB = b;
  }

  for (let b = 0; b < iteration.candidateRecords.length; b += 1) {
    const record = iteration.candidateRecords[b];
    const expectedRole =
      firstSatisfiedB === null || b < firstSatisfiedB
        ? "decision-search"
        : b === firstSatisfiedB
          ? "selected-update"
          : "diagnostic-only-after-selection";
    state.expect(
      record.decisionRole === expectedRole &&
        record.selectedForUpdate === (expectedRole === "selected-update") &&
        (record.status !== "evaluated" ||
          record.evaluatedAfterSelectionForDiagnosticCoverage ===
            (expectedRole === "diagnostic-only-after-selection")),
      `${path}.candidateRecords[${b}].decisionRole`,
      "firstSelectionAndDecisionReplayPassed",
    );
  }

  if (firstSatisfiedB === null) {
    state.expect(
      iteration.decision.outcome === "line-search-failed" &&
        iteration.decision.selectedBacktrackExponent === null &&
        iteration.decision.stageFailureReason === "line-search-failed",
      `${path}.decision`,
      "firstSelectionAndDecisionReplayPassed",
    );
    return null;
  }
  const selected = iteration.candidateRecords[firstSatisfiedB];
  if (selected.status !== "evaluated") {
    state.expect(
      false,
      `${path}.selectedRecord`,
      "firstSelectionAndDecisionReplayPassed",
    );
    return null;
  }
  auditAcceptedDecisionV2(iteration, selected, d0, d1, path, state);
  return selected;
}

function auditCandidateRecordArithmeticV2(
  record: MainWirePassiveEquilibriumCandidateRecordV2,
  current: ReturnType<typeof unwrapCandidateSnapshotV2>,
  d0: number,
  d1: number,
  gDotD: number,
  path: string,
  state: AuditStateV2,
): void {
  auditCandidateRecordUnionShapeV2(record, path, state);
  const policy =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2;
  const alpha = 2 ** -record.b;
  const step0 = policy.coordinateScales.septalMidwallCapVolumeM3 * alpha * d0;
  const step1 = policy.coordinateScales.junctionRadiusM * alpha * d1;
  const qTrial0 = current.coordinates.septalMidwallCapVolumeM3 + step0;
  const qTrial1 = current.coordinates.junctionRadiusM + step1;
  const rhs = policy.armijoCoefficient * alpha * policy.energyScaleJ * gDotD;
  state.expect(
    sameFloatWrapperV2(record.alpha, independentWrapV2(alpha)) &&
      sameFloatWrapperV2(record.step[0], independentWrapV2(step0)) &&
      sameFloatWrapperV2(record.step[1], independentWrapV2(step1)) &&
      sameFloatWrapperV2(
        record.trialCoordinates.septalMidwallCapVolumeM3,
        independentWrapV2(qTrial0),
      ) &&
      sameFloatWrapperV2(
        record.trialCoordinates.junctionRadiusM,
        independentWrapV2(qTrial1),
      ) &&
      sameFloatWrapperV2(record.rhs, independentWrapV2(rhs)),
    `${path}.commonArithmetic`,
    "independentArithmeticReplayPassed",
  );
  const rhsInvalid = !Number.isFinite(rhs) || !(rhs < 0);
  const coordinatesInvalid =
    !Number.isFinite(qTrial0) || !Number.isFinite(qTrial1);
  const zeroStep =
    independentBitsV2(qTrial0) ===
      independentBitsV2(current.coordinates.septalMidwallCapVolumeM3) &&
    independentBitsV2(qTrial1) ===
      independentBitsV2(current.coordinates.junctionRadiusM);
  const junctionInvalid = !(qTrial1 > policy.minimumJunctionRadiusMExclusive);
  if (record.status === "not-evaluated") {
    const expectedReason = rhsInvalid
      ? "rhs-non-finite-or-not-strictly-negative"
      : coordinatesInvalid
        ? "trial-coordinate-non-finite"
        : zeroStep
          ? "zero-coordinate-step"
          : junctionInvalid
            ? "junction-radius-below-minimum"
            : "candidate-evaluation-exception";
    state.expect(
      record.reason === expectedReason &&
        record.evaluationAttempted ===
          (record.reason === "candidate-evaluation-exception") &&
        (record.reason !== "candidate-evaluation-exception" ||
          (typeof record.exception.name === "string" &&
            typeof record.exception.message === "string")),
      `${path}.notEvaluatedReason`,
      "firstSelectionAndDecisionReplayPassed",
    );
    return;
  }
  state.expect(
    !rhsInvalid && !coordinatesInvalid && !zeroStep && !junctionInvalid,
    `${path}.evaluatedGuards`,
    "firstSelectionAndDecisionReplayPassed",
  );
  auditEvaluatedRecordV2(record, current, rhs, path, state);
}

function auditCandidateRecordUnionShapeV2(
  record: MainWirePassiveEquilibriumCandidateRecordV2,
  path: string,
  state: AuditStateV2,
): void {
  state.expect(
    (record.status === "not-evaluated" &&
      record.evaluationAttempted ===
        (record.reason === "candidate-evaluation-exception")) ||
      (record.status === "evaluated" && record.evaluationAttempted === true),
    `${path}.statusAndEvaluationAttempted`,
    "closedUnionAndCoveragePassed",
  );
  const common = [
    "b",
    "alpha",
    "step",
    "trialCoordinates",
    "rhs",
    "decisionRole",
    "selectedForUpdate",
    "status",
    "reason",
    "evaluationAttempted",
  ];
  const expected =
    record.status === "not-evaluated"
      ? record.reason === "candidate-evaluation-exception"
        ? [...common, "exception"]
        : common
      : [
          ...common,
          "trialCandidate",
          "currentWallStoredEnergyJ",
          "trialWallStoredEnergyJ",
          "twoDiffByWall",
          "orderedDifferenceTerms",
          "evaluatedDifferenceExpansion",
          "comparisonExpansion",
          "naiveDeltaJ",
          "deltaUStableDiagnosticJ",
          "absoluteV1ResidualJ",
          "roundedV2ResidualJ",
          "exactExpansionSign",
          "highestNonzeroComparisonExpansionIndex",
          "armijoSatisfied",
          "absoluteV1ArmijoSatisfiedDiagnostic",
          "candidateFieldsFinite",
          "wallEnergiesFinite",
          "twoDiffIntermediatesFinite",
          "twoSumAndExpansionIntermediatesFinite",
          "exactComparisonAvailable",
          "trialCoordinatesFinite",
          "zeroCoordinateStep",
          "geometryPassed",
          "projectionCoordinatesMatch",
          "rawVentricularEnergyBindingPassed",
          "candidateAdmissibilityPassed",
          "evaluatedAfterSelectionForDiagnosticCoverage",
        ];
  state.expect(
    hasExactKeysV2(record, expected),
    `${path}.fields`,
    "closedUnionAndCoveragePassed",
  );
}

function auditEvaluatedRecordV2(
  record: Extract<
    MainWirePassiveEquilibriumCandidateRecordV2,
    { status: "evaluated" }
  >,
  current: ReturnType<typeof unwrapCandidateSnapshotV2>,
  rhs: number,
  path: string,
  state: AuditStateV2,
): void {
  const trial = unwrapCandidateSnapshotV2(record.trialCandidate);
  auditCandidateSnapshotConsistencyV2(
    record.trialCandidate,
    record.trialCoordinates,
    `${path}.trialCandidate`,
    state,
    false,
  );
  const walls = ["LVFW", "SEP", "RVFW"] as const;
  state.expect(
    sameJsonV2(record.currentWallStoredEnergyJ, {
      LVFW: independentWrapV2(current.wallEnergies.LVFW),
      SEP: independentWrapV2(current.wallEnergies.SEP),
      RVFW: independentWrapV2(current.wallEnergies.RVFW),
    }) &&
      sameJsonV2(record.trialWallStoredEnergyJ, {
        LVFW: independentWrapV2(trial.wallEnergies.LVFW),
        SEP: independentWrapV2(trial.wallEnergies.SEP),
        RVFW: independentWrapV2(trial.wallEnergies.RVFW),
      }),
    `${path}.wallEnergyBindings`,
    "independentArithmeticReplayPassed",
  );
  const twoDiffs = walls.map((wall) =>
    independentTwoDiffV2(trial.wallEnergies[wall], current.wallEnergies[wall]),
  );
  const terms = twoDiffs.flatMap((entry) => [entry.x, entry.y]);
  const e = independentGrowV2([], terms);
  const r = independentGrowV2(e.values, [-rhs]);
  let delta = 0;
  for (const value of e.values) delta += value;
  let sign: -1 | 0 | 1 | null = r.values.every(Number.isFinite) ? 0 : null;
  let highest: number | null = null;
  if (sign !== null) {
    for (let index = 6; index >= 0; index -= 1) {
      if (r.values[index] !== 0) {
        sign = r.values[index] < 0 ? -1 : 1;
        highest = index;
        break;
      }
    }
  }
  for (let index = 0; index < walls.length; index += 1) {
    const wall = walls[index];
    const expected = independentTwoDiffEvidenceV2(
      trial.wallEnergies[wall],
      current.wallEnergies[wall],
    );
    state.expect(
      sameJsonV2(record.twoDiffByWall[wall], expected),
      `${path}.twoDiffByWall.${wall}`,
      "independentArithmeticReplayPassed",
    );
  }
  state.expect(
    sameWrappedArrayV2(record.orderedDifferenceTerms, terms) &&
      sameWrappedArrayV2(record.evaluatedDifferenceExpansion, e.values) &&
      sameWrappedArrayV2(record.comparisonExpansion, r.values),
    `${path}.expansions`,
    "independentArithmeticReplayPassed",
  );
  const currentTotal =
    current.wallEnergies.LVFW +
    current.wallEnergies.SEP +
    current.wallEnergies.RVFW;
  const trialTotal =
    trial.wallEnergies.LVFW + trial.wallEnergies.SEP + trial.wallEnergies.RVFW;
  const naive = trialTotal - currentTotal;
  const absoluteResidual = trialTotal - (currentTotal + rhs);
  const roundedResidual = delta - rhs;
  state.expect(
    sameFloatWrapperV2(record.naiveDeltaJ, independentWrapV2(naive)) &&
      sameFloatWrapperV2(
        record.deltaUStableDiagnosticJ,
        independentWrapV2(delta),
      ) &&
      sameFloatWrapperV2(
        record.absoluteV1ResidualJ,
        independentWrapV2(absoluteResidual),
      ) &&
      sameFloatWrapperV2(
        record.roundedV2ResidualJ,
        independentWrapV2(roundedResidual),
      ),
    `${path}.diagnostics`,
    "independentArithmeticReplayPassed",
  );
  const candidateFieldsFinite = candidateNonEnergyFiniteV2(
    record.trialCandidate,
  );
  const wallEnergiesFinite = walls.every((wall) =>
    Number.isFinite(trial.wallEnergies[wall]),
  );
  const twoDiffFinite = twoDiffs.every((entry) =>
    entry.intermediates.every(Number.isFinite),
  );
  const expansionFinite = e.intermediatesFinite && r.intermediatesFinite;
  const comparisonAvailable = twoDiffFinite && expansionFinite && sign !== null;
  const projectionCoordinatesMatch = sameJsonV2(
    record.trialCandidate.internalCoordinates,
    record.trialCoordinates,
  );
  const rawVentricularEnergyBindingPassed = sameFloatWrapperV2(
    record.trialCandidate.rawVentricularStoredEnergyJ,
    independentWrapV2(trialTotal),
  );
  const geometryPassed =
    record.trialCandidate.junctionRadiusPassed &&
    trial.coordinates.junctionRadiusM >
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2.minimumJunctionRadiusMExclusive;
  const expectedReason = !candidateFieldsFinite
    ? "candidate-field-non-finite"
    : !wallEnergiesFinite
      ? "wall-energy-non-finite"
      : !twoDiffFinite
        ? "two-diff-intermediate-non-finite"
        : !expansionFinite
          ? "two-sum-or-expansion-intermediate-non-finite"
          : !comparisonAvailable
            ? "exact-comparison-unavailable"
            : (sign as -1 | 0 | 1) <= 0
              ? "armijo-satisfied"
              : "armijo-not-satisfied";
  state.expect(
    record.reason === expectedReason &&
      record.exactExpansionSign === sign &&
      record.highestNonzeroComparisonExpansionIndex === highest &&
      record.armijoSatisfied === (expectedReason === "armijo-satisfied") &&
      record.absoluteV1ArmijoSatisfiedDiagnostic ===
        trialTotal <= currentTotal + rhs &&
      record.candidateFieldsFinite === candidateFieldsFinite &&
      record.wallEnergiesFinite === wallEnergiesFinite &&
      record.twoDiffIntermediatesFinite === twoDiffFinite &&
      record.twoSumAndExpansionIntermediatesFinite === expansionFinite &&
      record.exactComparisonAvailable === comparisonAvailable &&
      record.trialCoordinatesFinite ===
        (Number.isFinite(trial.coordinates.septalMidwallCapVolumeM3) &&
          Number.isFinite(trial.coordinates.junctionRadiusM)) &&
      record.zeroCoordinateStep === false &&
      record.geometryPassed === geometryPassed &&
      record.projectionCoordinatesMatch === projectionCoordinatesMatch &&
      record.rawVentricularEnergyBindingPassed ===
        rawVentricularEnergyBindingPassed &&
      projectionCoordinatesMatch &&
      rawVentricularEnergyBindingPassed &&
      geometryPassed &&
      record.candidateAdmissibilityPassed ===
        (candidateFieldsFinite &&
          wallEnergiesFinite &&
          twoDiffFinite &&
          expansionFinite &&
          comparisonAvailable),
    `${path}.reasonAndDecision`,
    "firstSelectionAndDecisionReplayPassed",
  );
}

function auditAcceptedDecisionV2(
  iteration: Extract<
    MainWirePassiveEquilibriumIterationEvidenceV2,
    { status: "line-search-entered" }
  >,
  selected: Extract<
    MainWirePassiveEquilibriumCandidateRecordV2,
    { status: "evaluated" }
  >,
  d0: number,
  d1: number,
  path: string,
  state: AuditStateV2,
): void {
  const policy =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2;
  const trial = unwrapCandidateSnapshotV2(selected.trialCandidate);
  const [[h00, h01], [, h11]] = trial.hessian;
  const determinant = h00 * h11 - h01 * h01;
  const scaledUpdate = 2 ** -selected.b * Math.max(Math.abs(d0), Math.abs(d1));
  const expected =
    !Number.isFinite(determinant) || determinant === 0
      ? {
          outcome: "accepted-candidate-failed",
          selectedBacktrackExponent: selected.b,
          stageFailureReason: "scaled-internal-hessian-singular",
        }
      : !selected.trialCandidate.strictLocalStabilityPassed
        ? {
            outcome: "accepted-candidate-failed",
            selectedBacktrackExponent: selected.b,
            stageFailureReason: "scaled-internal-hessian-not-positive-definite",
          }
        : trial.force <= policy.scaledForceInfinityTolerance
          ? {
              outcome: "force-converged",
              selectedBacktrackExponent: selected.b,
              stageFailureReason: null,
            }
          : scaledUpdate <= policy.scaledUpdateStagnationLimit
            ? {
                outcome: "scaled-update-stagnated",
                selectedBacktrackExponent: selected.b,
                stageFailureReason: "scaled-update-stagnated",
              }
            : {
                outcome: "continue-newton",
                selectedBacktrackExponent: selected.b,
                stageFailureReason: null,
              };
  state.expect(
    sameJsonV2(iteration.decision, expected),
    `${path}.decision`,
    "firstSelectionAndDecisionReplayPassed",
  );
}

function auditAllFloatWrappersV2(
  value: unknown,
  path: string,
  state: AuditStateV2,
): void {
  if (value === null || typeof value !== "object") return;
  if (
    "float64BitsHex" in value ||
    "classification" in value ||
    ("value" in value && Object.keys(value).length <= 4)
  ) {
    if (!isFloatWrapperShapeV2(value)) {
      state.expect(false, path, "float64WrappersPassed");
      return;
    }
    const decoded = independentNumberFromBitsV2(value.float64BitsHex);
    const expected = independentWrapV2(decoded);
    const valueMatches =
      value.classification === "finite"
        ? typeof value.value === "number" &&
          Object.is(value.value, decoded === 0 ? 0 : decoded)
        : value.value === null;
    state.expect(
      /^[0-9a-f]{16}$/.test(value.float64BitsHex) &&
        value.classification === expected.classification &&
        valueMatches,
      path,
      "float64WrappersPassed",
    );
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      auditAllFloatWrappersV2(entry, `${path}[${index}]`, state),
    );
    return;
  }
  for (const [key, child] of Object.entries(value))
    auditAllFloatWrappersV2(child, `${path}.${key}`, state);
}

function auditNestedEvidenceShapesV2(
  value: unknown,
  path: string,
  state: AuditStateV2,
): void {
  if (
    value === null ||
    typeof value !== "object" ||
    isFloatWrapperShapeV2(value)
  )
    return;
  if (Array.isArray(value)) {
    const expectedLength =
      path.endsWith(".step") ||
      path.endsWith(".direction") ||
      path.endsWith(".scaledGradient") ||
      path.endsWith(".scaledInternalHessianEigenvaluesAscending") ||
      path.endsWith(".hTimesDirectionPlusGradient")
        ? 2
        : path.endsWith(".scaledInternalHessian")
          ? 2
          : path.match(/\.scaledInternalHessian\[[01]\]$/)
            ? 2
            : path.endsWith(".orderedDifferenceTerms") ||
                path.endsWith(".evaluatedDifferenceExpansion")
              ? 6
              : path.endsWith(".comparisonExpansion")
                ? 7
                : null;
    if (expectedLength !== null)
      state.expect(
        value.length === expectedLength,
        `${path}.length`,
        "closedUnionAndCoveragePassed",
      );
    value.forEach((entry, index) =>
      auditNestedEvidenceShapesV2(entry, `${path}[${index}]`, state),
    );
    return;
  }
  const record = value as Record<string, unknown>;
  if (path.endsWith(".twoDiffByWall"))
    state.expect(
      hasExactKeysV2(record, ["LVFW", "SEP", "RVFW"]),
      `${path}.fields`,
      "closedUnionAndCoveragePassed",
    );
  if ("septalMidwallCapVolumeM3" in record || "junctionRadiusM" in record)
    state.expect(
      hasExactKeysV2(record, ["septalMidwallCapVolumeM3", "junctionRadiusM"]),
      `${path}.fields`,
      "closedUnionAndCoveragePassed",
    );
  if (
    "LVFW" in record &&
    "SEP" in record &&
    "RVFW" in record &&
    isFloatWrapperShapeV2(record.LVFW as object)
  )
    state.expect(
      hasExactKeysV2(record, ["LVFW", "SEP", "RVFW"]),
      `${path}.fields`,
      "closedUnionAndCoveragePassed",
    );
  if (
    "a" in record &&
    "b" in record &&
    "x" in record &&
    "y" in record &&
    "bVirtual" in record
  )
    state.expect(
      hasExactKeysV2(record, [
        "a",
        "b",
        "x",
        "bVirtual",
        "aVirtual",
        "bRound",
        "aRound",
        "y",
      ]),
      `${path}.fields`,
      "closedUnionAndCoveragePassed",
    );
  if (
    "selectedBacktrackExponent" in record &&
    "scaledUpdateInfinityNorm" in record
  )
    state.expect(
      hasExactKeysV2(record, [
        "selectedBacktrackExponent",
        "scaledUpdateInfinityNorm",
        "currentScaledForceInfinityNorm",
        "acceptedScaledForceInfinityNorm",
        "currentEnergyJ",
        "acceptedEnergyJ",
        "gDotD",
      ]),
      `${path}.fields`,
      "closedUnionAndCoveragePassed",
    );
  if ("name" in record && "message" in record)
    state.expect(
      hasExactKeysV2(record, ["name", "message"]),
      `${path}.fields`,
      "closedUnionAndCoveragePassed",
    );
  for (const [key, child] of Object.entries(record))
    auditNestedEvidenceShapesV2(child, `${path}.${key}`, state);
}

function isFloatWrapperShapeV2(
  value: object,
): value is MainWirePassiveEquilibriumFloat64V2 {
  return (
    hasExactKeysV2(value, ["value", "float64BitsHex", "classification"]) &&
    "value" in value &&
    "float64BitsHex" in value &&
    "classification" in value
  );
}

function hasExactKeysV2(value: object, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
}

function unwrapCandidateSnapshotV2(
  snapshot: MainWirePassiveEquilibriumCandidateSnapshotV2,
): Readonly<{
  coordinates: Readonly<{
    septalMidwallCapVolumeM3: number;
    junctionRadiusM: number;
  }>;
  wallEnergies: Readonly<{ LVFW: number; SEP: number; RVFW: number }>;
  gradient: readonly [number, number];
  force: number;
  hessian: readonly [readonly [number, number], readonly [number, number]];
}> {
  return {
    coordinates: unwrapCoordinatesV2(snapshot.internalCoordinates),
    wallEnergies: {
      LVFW: unwrapV2(snapshot.wallStoredEnergyJ.LVFW),
      SEP: unwrapV2(snapshot.wallStoredEnergyJ.SEP),
      RVFW: unwrapV2(snapshot.wallStoredEnergyJ.RVFW),
    },
    gradient: [
      unwrapV2(snapshot.scaledGradient[0]),
      unwrapV2(snapshot.scaledGradient[1]),
    ],
    force: unwrapV2(snapshot.scaledForceInfinityNorm),
    hessian: [
      [
        unwrapV2(snapshot.scaledInternalHessian[0][0]),
        unwrapV2(snapshot.scaledInternalHessian[0][1]),
      ],
      [
        unwrapV2(snapshot.scaledInternalHessian[1][0]),
        unwrapV2(snapshot.scaledInternalHessian[1][1]),
      ],
    ],
  };
}

function auditCandidateSnapshotConsistencyV2(
  snapshot: MainWirePassiveEquilibriumCandidateSnapshotV2,
  expectedCoordinates: MainWirePassiveEquilibriumCandidateSnapshotV2["internalCoordinates"],
  path: string,
  state: AuditStateV2,
  requireAllFinite: boolean,
): void {
  state.expect(
    hasExactKeysV2(snapshot, [
      "internalCoordinates",
      "wallStoredEnergyJ",
      "rawVentricularStoredEnergyJ",
      "scaledGradient",
      "scaledForceInfinityNorm",
      "scaledInternalHessian",
      "scaledInternalHessianEigenvaluesAscending",
      "strictLocalStabilityPassed",
      "junctionRadiusPassed",
    ]) && sameJsonV2(snapshot.internalCoordinates, expectedCoordinates),
    `${path}.shapeAndCoordinates`,
    "closedUnionAndCoveragePassed",
  );
  const candidate = unwrapCandidateSnapshotV2(snapshot);
  const fixedWallSum =
    candidate.wallEnergies.LVFW +
    candidate.wallEnergies.SEP +
    candidate.wallEnergies.RVFW;
  const expectedForce = Math.max(
    Math.abs(candidate.gradient[0]),
    Math.abs(candidate.gradient[1]),
  );
  const [[h00, h01], [h10, h11]] = candidate.hessian;
  const expectedEigenvalues = independentSymmetricEigenvaluesV2(h00, h01, h11);
  const expectedStrictStability =
    Number.isFinite(expectedEigenvalues[0]) &&
    Number.isFinite(expectedEigenvalues[1]) &&
    expectedEigenvalues[0] >
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2.minimumScaledInternalHessianEigenvalueExclusive;
  const expectedJunction =
    candidate.coordinates.junctionRadiusM >
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2.minimumJunctionRadiusMExclusive;
  state.expect(
    !requireAllFinite ||
      [
        snapshot.internalCoordinates.septalMidwallCapVolumeM3,
        snapshot.internalCoordinates.junctionRadiusM,
        snapshot.wallStoredEnergyJ.LVFW,
        snapshot.wallStoredEnergyJ.SEP,
        snapshot.wallStoredEnergyJ.RVFW,
        snapshot.rawVentricularStoredEnergyJ,
        ...snapshot.scaledGradient,
        snapshot.scaledForceInfinityNorm,
        ...snapshot.scaledInternalHessian.flat(),
        ...snapshot.scaledInternalHessianEigenvaluesAscending,
      ].every((entry) => entry.classification === "finite"),
    `${path}.requiredFiniteFields`,
    "firstSelectionAndDecisionReplayPassed",
  );
  state.expect(
    sameFloatWrapperV2(
      snapshot.rawVentricularStoredEnergyJ,
      independentWrapV2(fixedWallSum),
    ) &&
      sameFloatWrapperV2(
        snapshot.scaledForceInfinityNorm,
        independentWrapV2(expectedForce),
      ) &&
      snapshot.scaledInternalHessian[0][1].float64BitsHex ===
        snapshot.scaledInternalHessian[1][0].float64BitsHex &&
      sameFloatWrapperV2(
        snapshot.scaledInternalHessianEigenvaluesAscending[0],
        independentWrapV2(expectedEigenvalues[0]),
      ) &&
      sameFloatWrapperV2(
        snapshot.scaledInternalHessianEigenvaluesAscending[1],
        independentWrapV2(expectedEigenvalues[1]),
      ) &&
      snapshot.strictLocalStabilityPassed === expectedStrictStability &&
      snapshot.junctionRadiusPassed === expectedJunction,
    `${path}.derivedBindings`,
    "independentArithmeticReplayPassed",
  );
}

function independentSymmetricEigenvaluesV2(
  a: number,
  b: number,
  c: number,
): readonly [number, number] {
  const halfTrace = 0.5 * (a + c);
  const halfSpread = 0.5 * Math.hypot(a - c, 2 * b);
  const determinant = a * c - b * b;
  let lower: number;
  let upper: number;
  if (halfTrace >= 0) {
    upper = halfTrace + halfSpread;
    lower = upper === 0 ? halfTrace - halfSpread : determinant / upper;
  } else {
    lower = halfTrace - halfSpread;
    upper = lower === 0 ? halfTrace + halfSpread : determinant / lower;
  }
  return lower <= upper ? [lower, upper] : [upper, lower];
}

function unwrapCoordinatesV2(coordinates: {
  septalMidwallCapVolumeM3: MainWirePassiveEquilibriumFloat64V2;
  junctionRadiusM: MainWirePassiveEquilibriumFloat64V2;
}): Readonly<{
  septalMidwallCapVolumeM3: number;
  junctionRadiusM: number;
}> {
  return {
    septalMidwallCapVolumeM3: unwrapV2(coordinates.septalMidwallCapVolumeM3),
    junctionRadiusM: unwrapV2(coordinates.junctionRadiusM),
  };
}

function candidateNonEnergyFiniteV2(
  snapshot: MainWirePassiveEquilibriumCandidateSnapshotV2,
): boolean {
  return [
    snapshot.internalCoordinates.septalMidwallCapVolumeM3,
    snapshot.internalCoordinates.junctionRadiusM,
    ...snapshot.scaledGradient,
    snapshot.scaledForceInfinityNorm,
    ...snapshot.scaledInternalHessian.flat(),
    ...snapshot.scaledInternalHessianEigenvaluesAscending,
  ].every((value) => value.classification === "finite");
}

function independentTwoDiffV2(
  a: number,
  b: number,
): Readonly<{
  x: number;
  y: number;
  intermediates: readonly number[];
}> {
  const x = a - b;
  const bVirtual = a - x;
  const aVirtual = x + bVirtual;
  const bRound = bVirtual - b;
  const aRound = a - aVirtual;
  const y = aRound + bRound;
  return {
    x,
    y,
    intermediates: [x, bVirtual, aVirtual, bRound, aRound, y],
  };
}

function independentTwoDiffEvidenceV2(a: number, b: number): unknown {
  const result = independentTwoDiffV2(a, b);
  const [, bVirtual, aVirtual, bRound, aRound] = result.intermediates;
  return {
    a: independentWrapV2(a),
    b: independentWrapV2(b),
    x: independentWrapV2(result.x),
    bVirtual: independentWrapV2(bVirtual),
    aVirtual: independentWrapV2(aVirtual),
    bRound: independentWrapV2(bRound),
    aRound: independentWrapV2(aRound),
    y: independentWrapV2(result.y),
  };
}

function independentGrowV2(
  initial: readonly number[],
  insertions: readonly number[],
): Readonly<{ values: readonly number[]; intermediatesFinite: boolean }> {
  let expansion = [...initial];
  let intermediatesFinite = expansion.every(Number.isFinite);
  for (const insertion of insertions) {
    let q = insertion;
    const next: number[] = [];
    for (const component of expansion) {
      const s = q + component;
      const bPrime = s - q;
      const aPrime = s - bPrime;
      const bRound = component - bPrime;
      const aRound = q - aPrime;
      const e = aRound + bRound;
      intermediatesFinite =
        intermediatesFinite &&
        [s, bPrime, aPrime, bRound, aRound, e].every(Number.isFinite);
      next.push(e);
      q = s;
    }
    next.push(q);
    expansion = next;
  }
  return {
    values: expansion,
    intermediatesFinite:
      intermediatesFinite && expansion.every(Number.isFinite),
  };
}

function independentWrapV2(input: number): IndependentFloat64V2 {
  const bits = independentBitsV2(input);
  const classification = Number.isNaN(input)
    ? "nan"
    : input === Infinity
      ? "positive-infinity"
      : input === -Infinity
        ? "negative-infinity"
        : "finite";
  return {
    value: classification === "finite" ? (input === 0 ? 0 : input) : null,
    float64BitsHex: bits,
    classification,
  };
}

function independentBitsV2(input: number): string {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, input, false);
  return view.getBigUint64(0, false).toString(16).padStart(16, "0");
}

function independentNumberFromBitsV2(bits: string): number {
  if (!/^[0-9a-f]{16}$/.test(bits)) return NaN;
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(`0x${bits}`), false);
  return view.getFloat64(0, false);
}

function unwrapV2(value: MainWirePassiveEquilibriumFloat64V2): number {
  return independentNumberFromBitsV2(value.float64BitsHex);
}

function sameFloatWrapperV2(
  actual: MainWirePassiveEquilibriumFloat64V2,
  expected: IndependentFloat64V2,
): boolean {
  return sameJsonV2(actual, expected);
}

function sameWrappedArrayV2(
  actual: readonly MainWirePassiveEquilibriumFloat64V2[],
  expected: readonly number[],
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((entry, index) =>
      sameFloatWrapperV2(entry, independentWrapV2(expected[index])),
    )
  );
}

function sameJsonV2(left: unknown, right: unknown): boolean {
  return canonicalJsonStringify(left) === canonicalJsonStringify(right);
}

function deepFreezeAuditorV2<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>))
      deepFreezeAuditorV2(child);
    Object.freeze(value);
  }
  return value;
}
