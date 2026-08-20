import { sha256CanonicalJsonHex } from "@/engine/integrity";
import {
  evaluateMainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_CLAIM,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_ID,
} from "@/engine/myocardium/experiments/MainWireNormalAdultPassiveEquilibriumCandidateEngineeringV1";
import {
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_LOADED_COORDINATES_V3,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3,
  type MainWireNormalAdultPassiveEquilibriumCoordinatesV3,
} from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonDefinitionV1";
import {
  createMainWirePassiveEquilibriumManufacturedCasesV1,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_ARCHIVE_DIAGNOSTIC_CASES_V1,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_CORPUS_PAYLOAD_V1,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_CORPUS_V1_ID,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_DECLARATION_V1,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_RANKED_TARGETS_V1,
  type MainWirePassiveEquilibriumRankedTargetV1,
} from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonCorpusV1";
import {
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_ENGINEERING_V1_ID,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICIES_V3,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_ORDER_V3,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3,
  solveMainWirePassiveEquilibriumPointEngineeringV3,
  type MainWirePassiveEquilibriumCandidateEvaluatorV3,
  type MainWirePassiveEquilibriumPointSolverPolicyIdV3,
  type MainWirePassiveEquilibriumPointSolverResultV3,
} from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonEngineeringV1";

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_REPORT_V1_ID =
  "main-wire-normal-adult-passive-equilibrium-point-solver-comparison-report-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_NEGATIVE_CLAIMS_V1 =
  Object.freeze({
    selectedPointSolverPolicyEstablished: false as const,
    officialQualificationEstablished: false as const,
    confirmatoryEligibilityEstablished: false as const,
    surfaceConstructionEstablished: false as const,
    continuousBranchEstablished: false as const,
    alternatePathAgreementEstablished: false as const,
    multiSeedRobustnessEstablished: false as const,
    globalUniquenessEstablished: false as const,
    passiveReferenceForPvaEstablished: false as const,
    edpvrEstablished: false as const,
    peEstablished: false as const,
    pvaEstablished: false as const,
    oxygenOrMetabolicClaimEstablished: false as const,
    physiologicalValidationEstablished: false as const,
    clinicalValidationEstablished: false as const,
    publicCatalogEligibilityEstablished: false as const,
  });

type StageSummaryV1 = Readonly<{
  stageIndex: number;
  chamberVolumesM3: Readonly<{ LV: number; RV: number }>;
  status: MainWirePassiveEquilibriumPointSolverResultV3["status"];
  failureReason: MainWirePassiveEquilibriumPointSolverResultV3["failureReason"];
  candidateEvaluations: number;
  acceptedUpdates: number;
  rejectedTrials: number;
  terminal: Readonly<{
    internalCoordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3;
    rawStoredEnergyJ: number;
    scaledForceInfinityNorm: number;
    minimumScaledInternalHessianEigenvalue: number;
  }> | null;
  iterationDecisions: readonly Readonly<{
    iterationIndex: number;
    currentScaledForceInfinityNorm: number;
    currentMinimumScaledHessianEigenvalue: number;
    selectedTrialIndex: number | null;
    selectedReason: string | null;
    scaledUpdateInfinityNorm: number | null;
    trialCount: number;
  }>[];
  failureTrialDiagnostics: readonly unknown[] | null;
}>;

type HomotopySummaryV1 = Readonly<{
  caseId: string;
  policyId: MainWirePassiveEquilibriumPointSolverPolicyIdV3;
  targetVolumesM3: Readonly<{ LV: number; RV: number }>;
  status: "primary-homotopy-established" | "primary-homotopy-failed";
  primaryHomotopyEstablished: boolean;
  completedStages: number;
  failedStageIndex: number | null;
  failureReason: string | null;
  totalCandidateEvaluations: number;
  totalAcceptedUpdates: number;
  totalRejectedTrials: number;
  terminalCoordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3 | null;
  stageSummaries: readonly StageSummaryV1[];
}>;

type PolicySummaryV1 = Readonly<{
  policyId: MainWirePassiveEquilibriumPointSolverPolicyIdV3;
  manufacturedOutcomesPassed: boolean;
  manufacturedCases: readonly Readonly<{
    caseId: string;
    expectedStatus: string;
    actualStatus: string;
    expectedOutcomePassed: boolean;
    summary: StageSummaryV1;
  }>[];
  referenceRoot: StageSummaryV1;
  rankedCases: readonly HomotopySummaryV1[];
  completedRankedCases: number;
  rankedCandidateEvaluations: number;
  rankedAcceptedUpdates: number;
  rankedRejectedTrials: number;
  archiveDiagnostics: Readonly<{
    homotopyCases: readonly HomotopySummaryV1[];
    directPointCases: readonly Readonly<{
      caseId: string;
      summary: StageSummaryV1;
    }>[];
    casesAffectRanking: false;
    historicalQualificationTransferred: false;
  }>;
}>;

export type MainWireNormalAdultPassiveEquilibriumPointSolverComparisonReportV1 =
  Readonly<{
    reportSchemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_REPORT_V1_ID;
    payload: Readonly<{
      ownerId: typeof MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_ENGINEERING_V1_ID;
      status: "engineering-comparison-completed";
      declaration: typeof MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_DECLARATION_V1;
      implementationCommitSha: string;
      candidateOwnerId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_ID;
      corpusId: typeof MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_CORPUS_V1_ID;
      solverPolicyOrder: typeof MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_ORDER_V3;
      solverPolicyPayloadSha256: string;
      corpusPayloadSha256: string;
      candidateClaim: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_CLAIM;
      policySummaries: readonly PolicySummaryV1[];
      engineeringLeadingPolicyId: MainWirePassiveEquilibriumPointSolverPolicyIdV3 | null;
      ranking: readonly Readonly<{
        rank: number;
        policyId: MainWirePassiveEquilibriumPointSolverPolicyIdV3;
        manufacturedOutcomesPassed: boolean;
        completedRankedCases: number;
        rankedCandidateEvaluations: number;
        rankedAcceptedUpdates: number;
      }>[];
      claims: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_NEGATIVE_CLAIMS_V1;
    }>;
    payloadSha256: string;
  }>;

export async function runMainWireNormalAdultPassiveEquilibriumPointSolverComparisonEngineeringV1(
  input: Readonly<{ implementationCommitSha: string }>,
): Promise<MainWireNormalAdultPassiveEquilibriumPointSolverComparisonReportV1> {
  if (!/^[0-9a-f]{40}$/.test(input.implementationCommitSha))
    throw new Error(
      "implementation commit SHA must be 40 lowercase hex digits",
    );

  const solverPolicyPayloadSha256 = await sha256CanonicalJsonHex({
    ownerId:
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_ENGINEERING_V1_ID,
    shared: MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3,
    policies: MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICIES_V3,
  });
  const corpusPayloadSha256 = await sha256CanonicalJsonHex(
    MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_CORPUS_PAYLOAD_V1,
  );
  const policySummaries =
    MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_ORDER_V3.map(
      runPolicyComparisonV1,
    );
  const ranking = rankPolicySummariesV1(policySummaries);
  const engineeringLeadingPolicyId =
    ranking.find((entry) => entry.manufacturedOutcomesPassed)?.policyId ?? null;
  const payload = deepFreezeV3({
    ownerId:
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_ENGINEERING_V1_ID,
    status: "engineering-comparison-completed" as const,
    declaration:
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_DECLARATION_V1,
    implementationCommitSha: input.implementationCommitSha,
    candidateOwnerId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_ID,
    corpusId:
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_CORPUS_V1_ID,
    solverPolicyOrder:
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_ORDER_V3,
    solverPolicyPayloadSha256,
    corpusPayloadSha256,
    candidateClaim:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_CLAIM,
    policySummaries,
    engineeringLeadingPolicyId,
    ranking,
    claims:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_NEGATIVE_CLAIMS_V1,
  });
  return deepFreezeV3({
    reportSchemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_REPORT_V1_ID,
    payload,
    payloadSha256: await sha256CanonicalJsonHex(payload),
  });
}

function runPolicyComparisonV1(
  policyId: MainWirePassiveEquilibriumPointSolverPolicyIdV3,
): PolicySummaryV1 {
  const manufacturedCases =
    createMainWirePassiveEquilibriumManufacturedCasesV1().map((testCase) => {
      const result = solveMainWirePassiveEquilibriumPointEngineeringV3({
        policyId,
        stageIndex: 0,
        initialCoordinates: testCase.initialCoordinates,
        evaluateCandidate: testCase.evaluateCandidate,
      });
      return deepFreezeV3({
        caseId: testCase.caseId,
        expectedStatus: testCase.expectedOutcome,
        actualStatus: result.status,
        expectedOutcomePassed: result.status === testCase.expectedOutcome,
        summary: compactStageResultV1(
          result,
          { LV: 0, RV: 0 },
          testCase.caseId.includes("control"),
        ),
      });
    });
  const manufacturedOutcomesPassed = manufacturedCases.every(
    (testCase) => testCase.expectedOutcomePassed,
  );
  const referenceVolumes =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3;
  const referenceResult = solveNormalAdultStageV1(
    policyId,
    0,
    referenceVolumes,
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_LOADED_COORDINATES_V3,
  );
  const referenceRoot = compactStageResultV1(
    referenceResult,
    referenceVolumes,
    true,
  );
  const rankedCases = MAIN_WIRE_PASSIVE_EQUILIBRIUM_RANKED_TARGETS_V1.map(
    (target) =>
      target.referenceCase
        ? referenceHomotopySummaryV1(policyId, target, referenceResult)
        : runHomotopyV1(
            policyId,
            target.caseId,
            target.chamberVolumesM3,
            referenceResult,
          ),
  );
  const archiveHomotopies =
    MAIN_WIRE_PASSIVE_EQUILIBRIUM_ARCHIVE_DIAGNOSTIC_CASES_V1.homotopyTargets.map(
      (target) =>
        runHomotopyV1(
          policyId,
          target.caseId,
          target.chamberVolumesM3,
          referenceResult,
        ),
    );
  const archiveDirect =
    MAIN_WIRE_PASSIVE_EQUILIBRIUM_ARCHIVE_DIAGNOSTIC_CASES_V1.directPointStates.map(
      (testCase) => ({
        caseId: testCase.caseId,
        summary: compactStageResultV1(
          solveNormalAdultStageV1(
            policyId,
            0,
            testCase.chamberVolumesM3,
            testCase.initialCoordinates,
          ),
          testCase.chamberVolumesM3,
          true,
        ),
      }),
    );
  return deepFreezeV3({
    policyId,
    manufacturedOutcomesPassed,
    manufacturedCases,
    referenceRoot,
    rankedCases,
    completedRankedCases: rankedCases.filter(
      (testCase) => testCase.primaryHomotopyEstablished,
    ).length,
    rankedCandidateEvaluations: rankedCases.reduce(
      (sum, testCase) => sum + testCase.totalCandidateEvaluations,
      0,
    ),
    rankedAcceptedUpdates: rankedCases.reduce(
      (sum, testCase) => sum + testCase.totalAcceptedUpdates,
      0,
    ),
    rankedRejectedTrials: rankedCases.reduce(
      (sum, testCase) => sum + testCase.totalRejectedTrials,
      0,
    ),
    archiveDiagnostics: {
      homotopyCases: archiveHomotopies,
      directPointCases: archiveDirect,
      casesAffectRanking: false,
      historicalQualificationTransferred: false,
    },
  });
}

function solveNormalAdultStageV1(
  policyId: MainWirePassiveEquilibriumPointSolverPolicyIdV3,
  stageIndex: number,
  chamberVolumesM3: Readonly<{ LV: number; RV: number }>,
  initialCoordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3,
): MainWirePassiveEquilibriumPointSolverResultV3 {
  return solveMainWirePassiveEquilibriumPointEngineeringV3({
    policyId,
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

function runHomotopyV1(
  policyId: MainWirePassiveEquilibriumPointSolverPolicyIdV3,
  caseId: string,
  targetVolumesM3: Readonly<{ LV: number; RV: number }>,
  referenceResult: MainWirePassiveEquilibriumPointSolverResultV3,
): HomotopySummaryV1 {
  if (referenceResult.status !== "point-local-stable-root-established")
    return deepFreezeV3({
      caseId,
      policyId,
      targetVolumesM3: { ...targetVolumesM3 },
      status: "primary-homotopy-failed" as const,
      primaryHomotopyEstablished: false,
      completedStages: 0,
      failedStageIndex: 0,
      failureReason: "reference-root-unavailable",
      totalCandidateEvaluations: 0,
      totalAcceptedUpdates: 0,
      totalRejectedTrials: 0,
      terminalCoordinates: null,
      stageSummaries: [],
    });
  let coordinates = referenceResult.terminalCandidate.internalCoordinates;
  const stages: StageSummaryV1[] = [];
  for (let stageIndex = 1; stageIndex <= 32; stageIndex += 1) {
    const fraction = stageIndex / 32;
    const chamberVolumesM3 = {
      LV:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.LV +
        fraction *
          (targetVolumesM3.LV -
            MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.LV),
      RV:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.RV +
        fraction *
          (targetVolumesM3.RV -
            MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.RV),
    };
    const result = solveNormalAdultStageV1(
      policyId,
      stageIndex,
      chamberVolumesM3,
      coordinates,
    );
    stages.push(compactStageResultV1(result, chamberVolumesM3, true));
    if (result.status !== "point-local-stable-root-established")
      return homotopySummaryV1(caseId, policyId, targetVolumesM3, stages);
    coordinates = result.terminalCandidate.internalCoordinates;
  }
  return homotopySummaryV1(caseId, policyId, targetVolumesM3, stages);
}

function referenceHomotopySummaryV1(
  policyId: MainWirePassiveEquilibriumPointSolverPolicyIdV3,
  target: MainWirePassiveEquilibriumRankedTargetV1,
  referenceResult: MainWirePassiveEquilibriumPointSolverResultV3,
): HomotopySummaryV1 {
  const stage = compactStageResultV1(
    referenceResult,
    target.chamberVolumesM3,
    true,
  );
  const established =
    referenceResult.status === "point-local-stable-root-established";
  return deepFreezeV3({
    caseId: target.caseId,
    policyId,
    targetVolumesM3: { ...target.chamberVolumesM3 },
    status: established
      ? ("primary-homotopy-established" as const)
      : ("primary-homotopy-failed" as const),
    primaryHomotopyEstablished: established,
    completedStages: established ? 0 : 0,
    failedStageIndex: established ? null : 0,
    failureReason: established ? null : referenceResult.failureReason,
    totalCandidateEvaluations: stage.candidateEvaluations,
    totalAcceptedUpdates: stage.acceptedUpdates,
    totalRejectedTrials: stage.rejectedTrials,
    terminalCoordinates: stage.terminal?.internalCoordinates ?? null,
    stageSummaries: [stage],
  });
}

function homotopySummaryV1(
  caseId: string,
  policyId: MainWirePassiveEquilibriumPointSolverPolicyIdV3,
  targetVolumesM3: Readonly<{ LV: number; RV: number }>,
  stages: readonly StageSummaryV1[],
): HomotopySummaryV1 {
  const failure = stages.find(
    (stage) => stage.status !== "point-local-stable-root-established",
  );
  const last = stages.at(-1) ?? null;
  return deepFreezeV3({
    caseId,
    policyId,
    targetVolumesM3: { ...targetVolumesM3 },
    status: failure
      ? ("primary-homotopy-failed" as const)
      : ("primary-homotopy-established" as const),
    primaryHomotopyEstablished: failure === undefined,
    completedStages: failure
      ? Math.max(0, failure.stageIndex - 1)
      : stages.length,
    failedStageIndex: failure?.stageIndex ?? null,
    failureReason: failure?.failureReason ?? null,
    totalCandidateEvaluations: stages.reduce(
      (sum, stage) => sum + stage.candidateEvaluations,
      0,
    ),
    totalAcceptedUpdates: stages.reduce(
      (sum, stage) => sum + stage.acceptedUpdates,
      0,
    ),
    totalRejectedTrials: stages.reduce(
      (sum, stage) => sum + stage.rejectedTrials,
      0,
    ),
    terminalCoordinates: last?.terminal?.internalCoordinates ?? null,
    stageSummaries: [...stages],
  });
}

function compactStageResultV1(
  result: MainWirePassiveEquilibriumPointSolverResultV3,
  chamberVolumesM3: Readonly<{ LV: number; RV: number }>,
  retainFailureTrials: boolean,
): StageSummaryV1 {
  const terminal = result.terminalCandidate
    ? {
        internalCoordinates: {
          ...result.terminalCandidate.internalCoordinates,
        },
        rawStoredEnergyJ: result.terminalCandidate.rawStoredEnergyJ,
        scaledForceInfinityNorm:
          result.terminalCandidate.scaledForceInfinityNorm,
        minimumScaledInternalHessianEigenvalue:
          result.terminalCandidate.minimumScaledInternalHessianEigenvalue,
      }
    : null;
  const lastTrace = result.trace.at(-1) ?? null;
  return deepFreezeV3({
    stageIndex: result.stageIndex,
    chamberVolumesM3: { ...chamberVolumesM3 },
    status: result.status,
    failureReason: result.failureReason,
    candidateEvaluations: result.candidateEvaluations,
    acceptedUpdates: result.acceptedUpdates,
    rejectedTrials: result.rejectedTrials,
    terminal,
    iterationDecisions: result.trace.map((iteration) => ({
      iterationIndex: iteration.iterationIndex,
      currentScaledForceInfinityNorm: iteration.currentScaledForceInfinityNorm,
      currentMinimumScaledHessianEigenvalue:
        iteration.currentMinimumScaledHessianEigenvalue,
      selectedTrialIndex: iteration.selectedTrialIndex,
      selectedReason: iteration.selectedReason,
      scaledUpdateInfinityNorm: iteration.scaledUpdateInfinityNorm,
      trialCount: iteration.trials.length,
    })),
    failureTrialDiagnostics:
      retainFailureTrials && result.status === "point-solve-failed" && lastTrace
        ? [...lastTrace.trials]
        : null,
  });
}

export function rankMainWirePassiveEquilibriumPolicySummariesV1(
  summaries: readonly PolicySummaryV1[],
): MainWireNormalAdultPassiveEquilibriumPointSolverComparisonReportV1["payload"]["ranking"] {
  return rankPolicySummariesV1(summaries);
}

function rankPolicySummariesV1(
  summaries: readonly PolicySummaryV1[],
): MainWireNormalAdultPassiveEquilibriumPointSolverComparisonReportV1["payload"]["ranking"] {
  const tieOrder = new Map(
    MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_ORDER_V3.map(
      (policyId, index) => [policyId, index] as const,
    ),
  );
  return deepFreezeV3(
    [...summaries]
      .sort((left, right) => {
        if (
          left.manufacturedOutcomesPassed !== right.manufacturedOutcomesPassed
        )
          return left.manufacturedOutcomesPassed ? -1 : 1;
        if (left.completedRankedCases !== right.completedRankedCases)
          return right.completedRankedCases - left.completedRankedCases;
        if (
          left.rankedCandidateEvaluations !== right.rankedCandidateEvaluations
        )
          return (
            left.rankedCandidateEvaluations - right.rankedCandidateEvaluations
          );
        if (left.rankedAcceptedUpdates !== right.rankedAcceptedUpdates)
          return left.rankedAcceptedUpdates - right.rankedAcceptedUpdates;
        return tieOrder.get(left.policyId)! - tieOrder.get(right.policyId)!;
      })
      .map((summary, index) => ({
        rank: index + 1,
        policyId: summary.policyId,
        manufacturedOutcomesPassed: summary.manufacturedOutcomesPassed,
        completedRankedCases: summary.completedRankedCases,
        rankedCandidateEvaluations: summary.rankedCandidateEvaluations,
        rankedAcceptedUpdates: summary.rankedAcceptedUpdates,
      })),
  );
}

function deepFreezeV3<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>))
      deepFreezeV3(child);
    Object.freeze(value);
  }
  return value;
}
