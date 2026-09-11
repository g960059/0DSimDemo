import { searchMainWireCaseFittingV1 as search, type MainWireCaseSearchEvaluationV1 as Evaluation,
  type MainWireCaseSearchJobV1 as Job, type MainWireCaseFittingCoordinateIdV1 as Coordinate,
  assertMainWireCaseSearchInputsV1 as preflight, MainWireCaseCoordinateInputErrorV1 as CoordinateError } from "@/analysis/methods/mainWire/MainWireCaseFittingSearchV1";
import { withMainWireInitializationAssessmentV1 as withInitialization } from "@/analysis/methods/mainWire/MainWireCaseInitializationAgreementV1";
import { resolveMainWireCaseSearchProfileV1 as profile } from "@/analysis/registry/MainWireCaseSearchProfilesV1";
import type { MainWireCaseBackgroundV1 as Background } from "@/analysis/registry/MainWireStaticCaseDefinitionsV1";
import type { MainWireStaticCaseCandidateV1 as Candidate, MainWireCaseReferenceIdV1 as Reference,
  runMainWireStaticCaseFittingV1 as fit } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";

type Outcome = Awaited<ReturnType<typeof fit>>;
type Assessment = { status: "review-pending" | "held"; qualification: { issues: readonly string[] };
  caseTargetIssues: readonly string[]; searchHoldIssues: readonly string[] };

/** One bounded case search around existing executors. No implicit widening,
 * automatic publication, or baseline protocol imposed on another case. */
export async function searchMainWireRegistryCaseV1<Final, A extends Assessment>(request: {
  referenceId: Reference; candidateInputs: Candidate; initialOutcome: Outcome; initialFinal: Final;
  background?: Background;
  assess: (final: Final) => Promise<A>;
  evaluateBatch: (jobs: readonly Job[]) => Promise<readonly Outcome[]>;
  qualify: (evaluation: Evaluation) => Promise<Final>;
  checkInitialization: (evaluation: Evaluation, final: Final) => Promise<{ status: "passed" | "held"; issues: readonly string[] }>;
  coordinateIds?: readonly Coordinate[];
  maximumEvaluations: number; maximumFinalChecks: number; maximumWallTimeMs: number;
  reservedFinalWallTimeMs?: number;
  timeSnapshot?: (key: string) => Promise<number>;
}) {
  const initialAssessment = await request.assess(request.initialFinal);
  const initialScore = profile(request.referenceId).score(request.initialOutcome);
  const initial = { evaluationId: "evaluation-001", candidateInputs: request.candidateInputs, final: request.initialFinal, assessment: initialAssessment };
  try { preflight(request.referenceId, request.candidateInputs, request.coordinateIds, request.background); }
  catch (error) {
    if (!(error instanceof CoordinateError)) throw error;
    return { selected: { ...initial, assessment: withInitialization(initialAssessment,
      { status: "held", issues: [`search-input-incompatible:${error.message}`] }) }, search: null, reason: "search-input-incompatible" };
  }
  if (initialScore.targetsMet && initialAssessment.status === "review-pending")
    return { selected: initial, search: null, reason: "unchanged-input-qualified" };
  if (initialAssessment.searchHoldIssues.length)
    return { selected: { ...initial, assessment: { ...initialAssessment, status: "held" as const } }, search: null, reason: "initial-final-check-held" };
  // Undefined/failed observation is not a physiological direction to optimize.
  if (initialScore.rank === null || request.maximumWallTimeMs <= 0)
    return { selected: { ...initial, assessment: { ...initialAssessment, status: "held" as const } }, search: null,
      reason: initialScore.rank === null ? "initial-observation-unrankable" : "run-wall-time-budget" };
  const finals = new Map<string, typeof initial>();
  const result = await search({ referenceId: request.referenceId, candidateInputs: request.candidateInputs,
    initialOutcome: request.initialOutcome, coordinateIds: request.coordinateIds, background: request.background,
    maximumEvaluations: request.maximumEvaluations, maximumFinalChecks: request.maximumFinalChecks,
    maximumWallTimeMs: request.maximumWallTimeMs, evaluateBatch: request.evaluateBatch,
    reservedFinalWallTimeMs: request.reservedFinalWallTimeMs, timeSnapshot: request.timeSnapshot,
    assessFinalCandidate: async evaluation => {
      // The initial cold pair is already an independent final check. Search
      // continuations never satisfy this branch for a newly proposed input.
      const final = evaluation.id === "evaluation-001" ? request.initialFinal : await request.qualify(evaluation);
      const assessment = evaluation.id === "evaluation-001" ? initialAssessment : withInitialization(await request.assess(final),
        await request.checkInitialization(evaluation, final));
      finals.set(evaluation.id, { evaluationId: evaluation.id, candidateInputs: evaluation.candidateInputs, final, assessment });
      return { status: assessment.status === "review-pending" ? "accepted" : assessment.searchHoldIssues.length ? "held" : "rejected",
        issues: [...assessment.qualification.issues, ...assessment.caseTargetIssues],
        initializationCheck: "initializationCheck" in assessment ? assessment.initializationCheck : null };
    } });
  const selected = result.selectedFinalId ? finals.get(result.selectedFinalId)! : finals.get(result.bestId) ?? initial;
  return { selected: result.selectedFinalId ? selected : { ...selected, assessment: { ...selected.assessment, status: "held" as const } },
    search: result, reason: result.stopReason };
}
