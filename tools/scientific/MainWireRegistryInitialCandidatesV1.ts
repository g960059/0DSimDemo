import { canonicalJsonStringify as canonical } from "@/engine/integrity";
import { mainWireCaseScoreImprovesV1 as improves, type MainWireCaseFittingCoordinateIdV1 as Coordinate,
  type MainWireCaseSearchScoreV1 as Score } from "@/analysis/methods/mainWire/MainWireCaseFittingSearchV1";
import { resolveMainWireCaseSearchProfileV1 as profile } from "@/analysis/registry/MainWireCaseSearchProfilesV1";
import type { MainWireCaseReferenceIdV1 as Reference, MainWireStaticCaseCandidateV1 as Candidate } from "@/analysis/registry/MainWireStaticCaseDefinitionsV1";
import { readMainWireStaticCaseFittingResultV1 as readResult, type runMainWireStaticCaseFittingV1 as fit } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";
import { MAIN_WIRE_STATIC_CASE_MODEL_ID_V1 as modelId } from "@/domain/model/MainWireStaticCaseIdentityV1";
import { prepareRegistryCaseAssessmentV1 as assess, resolveMainWireRegistryCaseProtocolV1 as protocol } from "./MainWireRegistryCaseProtocolsV1";

export type MainWireRegistryProposalV1 = { referenceId: Reference; startId: string;
  historyFile?: string; candidateInputs?: Candidate; interpretation?: string; coordinateIds?: Coordinate[];
  /** Sealed parent fitting run. Its selected input replaces the AS background;
   * only the proposed aortic area is retained. Not a checkpoint warm start. */
  parentRun?: string };
const validId = (x: unknown) => typeof x === "string" && /^[a-z0-9][a-z0-9-]{0,63}$/.test(x);
export function mainWireInitialCandidatePrefixV1(p: Pick<MainWireRegistryProposalV1, "referenceId" | "startId">) {
  return p.startId === "initial" ? p.referenceId : `${p.referenceId}--${p.startId}`;
}

/** A flat plan: repeat the case with explicit distinct start IDs. At most four
 * preregistered starts, not an automatically generated parameter grid. */
export function ownMainWireRegistryProposalsV1(input: unknown, maximumEvaluationsPerCase: number): MainWireRegistryProposalV1[] {
  if (!Number.isInteger(maximumEvaluationsPerCase) || maximumEvaluationsPerCase < 1 || maximumEvaluationsPerCase > 128)
    throw new Error("Require 1–128 evaluations per case");
  if (!Array.isArray(input) || !input.length || input.length > 64) throw new Error("Require 1–64 case proposals");
  const proposals = input.map(raw => {
    if (!raw || typeof raw !== "object" || !validId(raw.referenceId) || raw.startId !== undefined && !validId(raw.startId)
      || raw.parentRun !== undefined && (typeof raw.parentRun !== "string" || !raw.parentRun.trim())
      || Object.keys(raw).some(k => !["referenceId", "startId", "historyFile", "candidateInputs", "interpretation", "coordinateIds", "parentRun"].includes(k)))
      throw new Error("Require safe case/start IDs and known proposal fields");
    return { ...raw, startId: raw.startId ?? "initial",
      ...(raw.parentRun && raw.coordinateIds === undefined ? { coordinateIds: ["aortic-area"] } : {}) } as MainWireRegistryProposalV1;
  });
  if (new Set(proposals.map(mainWireInitialCandidatePrefixV1)).size !== proposals.length)
    throw new Error("Initial candidates must have distinct case/start IDs and file prefixes");
  for (const referenceId of new Set(proposals.map(p => p.referenceId))) {
    const starts = proposals.filter(p => p.referenceId === referenceId);
    if (starts.length > 4 || starts.length > maximumEvaluationsPerCase)
      throw new Error("Each case permits at most four initial candidates, all counted within its evaluation budget");
    const defaultIds = profile(referenceId).coordinateIds;
    if (starts.some(s => s.parentRun !== starts[0]!.parentRun)) throw new Error("Initial candidates of one case must share the same comparison parent run");
    const ids = starts.map(s => s.coordinateIds ?? defaultIds);
    if (ids.some(v => !Array.isArray(v) || !v.length || new Set(v).size !== v.length || v.some(id => !defaultIds.includes(id))))
      throw new Error("Case search coordinates must be a distinct nonempty subset of the allowed profile");
    if (ids.some(v => canonical(v) !== canonical(ids[0]))) throw new Error("Initial candidates of one case must share the same ordered search coordinates");
  }
  return proposals;
}

export type MainWireInitialAssessmentV1 = { status: "held" | "review-pending";
  qualification: { issues: readonly string[] }; caseTargetIssues: readonly string[]; searchHoldIssues: readonly string[] };
export type MainWireInitialChoiceV1 = { startId: string; score: Score; assessment: MainWireInitialAssessmentV1 | null };

/** Qualification before score, stable declared-order ties. A held observation
 * is never a direction to optimize. Other starts remain visible even when an
 * independently qualified start is available; this is not formal adoption. */
export function selectMainWireInitialCandidateV1<T extends MainWireInitialChoiceV1>(starts: readonly T[]) {
  if (!starts.length || new Set(starts.map(s => s.startId)).size !== starts.length) throw new Error("Require distinct initial candidates");
  const qualified = starts.filter(s => s.assessment?.status === "review-pending" && !s.assessment.searchHoldIssues.length
    && s.score.rank !== null && s.score.targetsMet);
  const searchable = starts.filter(s => s.assessment !== null && !s.assessment.searchHoldIssues.length && s.score.rank !== null);
  const pool = qualified.length ? qualified : searchable;
  let selected = pool[0] ?? starts.find(s => s.assessment !== null) ?? starts[0]!;
  for (const s of pool.slice(1)) if (improves(s.score, selected.score)) selected = s;
  return { selected, reason: qualified.length ? "initial-candidate-qualified" as const
    : searchable.length ? "best-ranked-searchable-initial-candidate" as const : "no-searchable-initial-candidate" as const,
    qualifiedStartIds: qualified.map(s => s.startId), searchableStartIds: searchable.map(s => s.startId),
    heldStartIds: starts.filter(s => !s.assessment || s.assessment.searchHoldIssues.length || s.score.rank === null).map(s => s.startId),
    policy: "preregistered-cold-pairs; qualified-first; existing-case-score; declared-order-ties; one-local-search; no-publication" as const };
}

export async function assessMainWireInitialCandidateV1(referenceId: Reference, pair: { coarse: unknown; fine: unknown } | null) {
  const raw = (pair?.coarse as { result?: unknown } | null)?.result;
  let outcome: Awaited<ReturnType<typeof fit>>;
  const failure = pair?.coarse as { status?: string; message?: string } | null;
  try { outcome = raw ? { status: "saved-result-ready", result: await readResult(raw) }
    : { status: failure?.status === "operational-failed" || failure?.status === "operational-interrupted"
        ? "operational-interrupted" : "numerical-unresolved", phase: "initial-grid",
      message: failure?.message ?? "Initial coarse raw evidence unavailable", modelId, wallTimeMs: 0 }; }
  catch (error) { outcome = { status: "invalid-or-physical", phase: "initial-grid", message: String(error), modelId, wallTimeMs: 0 }; }
  return { outcome, score: profile(referenceId).score(outcome), assessment: pair ? await assess(protocol(referenceId), pair) : null };
}

export type MainWireInitialCandidateMaterialV1 = MainWireInitialChoiceV1 & {
  inputIssue: string | null; candidateInputs: Candidate | null; inputRecord: unknown; binding: unknown;
  executionFiles: string[]; previousEvidenceFile: string | null;
};
export function mainWireInitialCandidateComparisonV1(referenceId: Reference, maximumEvaluationsPerCase: number,
  starts: readonly MainWireInitialCandidateMaterialV1[]) {
  if (!starts.length || starts.length > 4 || starts.length > maximumEvaluationsPerCase) throw new Error("Initial candidates exceed case budget");
  const { selected, ...selection } = selectMainWireInitialCandidateV1(starts);
  return { schemaId: "main-wire-registry-initial-candidates-v1", referenceId, selectedStartId: selected.startId, ...selection,
    maximumEvaluationsPerCase, localMaximumEvaluations: maximumEvaluationsPerCase - starts.length + 1,
    starts, publicPromotionAuthorized: false as const };
}
export type MainWireInitialCandidateComparisonV1 = ReturnType<typeof mainWireInitialCandidateComparisonV1>;
