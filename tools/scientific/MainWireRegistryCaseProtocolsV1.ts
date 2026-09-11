import { MAIN_WIRE_STATIC_CASE_DEFINITIONS_V1 as definitions,
  type MainWireCaseReferenceIdV1 as Reference, type MainWireStaticCaseCandidateV1 as Candidate } from "@/analysis/registry/MainWireStaticCaseDefinitionsV1";
import { runMainWireStaticCaseFittingV1 as fit } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";
import { runMainWireStaticBaselineQualificationGridV1 as baselineGrid,
  assessMainWireStaticBaselineQualificationV1 as baselinePair } from "@/analysis/methods/mainWire/MainWireStaticBaselineQualificationV1";
import { assessMainWireHfrefCaseQualificationV1 as hfrefPair } from "@/analysis/methods/mainWire/MainWireHfrefCaseQualificationV1";
import { assessMainWireAsCaseQualificationV1 as asPair } from "@/analysis/methods/mainWire/MainWireAsCaseQualificationV1";
import { resolveMainWireCaseSearchProfileV1 as profile, type MainWireCaseSearchScoreV1 as Score } from "@/analysis/registry/MainWireCaseSearchProfilesV1";

type GridRequest = Readonly<{ candidateInputs: Candidate; sourceSha256: string; nominalDtSec: .002 | .001; abortSignal?: AbortSignal }>;
export type RegistryCaseProtocolV1 = Readonly<{
  referenceId: string; title: string; adoptedPresetId: string | null; reviewItems: readonly string[];
  runGrid: (request: GridRequest) => Promise<unknown>;
  assessPair: (grids: { coarse: unknown; fine: unknown }) => Promise<{ status: string; issues: readonly string[] }>;
  scoreRest?: (grid: unknown) => Score;
  /** Only known physiological holds may drive more fitting; unknown/numerical
   * issues remain held for investigation instead of being optimized away. */
  searchableIssues?: (grids: { coarse: unknown; fine: unknown }, qualification: { issues: readonly string[] }) => readonly string[];
}>;
const scoreGrid = (referenceId: Reference) => (grid: unknown): Score => {
  const result = (grid as { result?: unknown } | null)?.result;
  return result ? profile(referenceId).score({ status: "saved-result-ready", result } as Extract<Awaited<ReturnType<typeof fit>>, { status: "saved-result-ready" }>)
    : { status: "unavailable", rank: null, targetsMet: false, observations: [], holds: ["rest-evidence-unavailable"] };
};
function restTargetHolds(referenceId: Reference, grids: { coarse: unknown; fine: unknown }) {
  const allowed: string[] = [];
  for (const key of ["coarse", "fine"] as const) {
    const g = grids[key] as { status?: string; issues?: string[]; result?: { rest?: { status?: string } }; preloadReserve?: unknown } | null;
    if (!g?.result?.rest || g.result.rest.status === "passed" || g.result.rest.status === "unavailable" || scoreGrid(referenceId)(g).rank === null) continue;
    if (referenceId !== "baseline") allowed.push(`${key}:rest-${g.result.rest.status}`);
    else if (referenceId === "baseline" && g.status === "grid-evaluated" && g.issues?.every(issue => issue === `rest:${g.result!.rest!.status}`)) {
      // The baseline executor deliberately skips reserve after a rest hold.
      // Missing reserve here is not a failed numerical reserve experiment.
      allowed.push(`${key}:rest-reobservation`, `${key}:grid-hold`);
      if (g.preloadReserve === null) allowed.push(`${key}:reserve-input-binding`, "paired-preload-reserve");
    }
  }
  return allowed;
}
const protocols: Record<Reference, RegistryCaseProtocolV1> = {
  "as-low-flow-reduced-ef-v1": { ...definitions["as-low-flow-reduced-ef-v1"],
    scoreRest: scoreGrid("as-low-flow-reduced-ef-v1"),
    searchableIssues: grids => restTargetHolds("as-low-flow-reduced-ef-v1", grids),
    runGrid: input => fit({ ...input, referenceId: "as-low-flow-reduced-ef-v1" }),
    assessPair: input => {
      const result = (v: unknown) => (v as { result?: unknown } | null)?.result ?? v;
      return asPair({ coarse: result(input.coarse), fine: result(input.fine) }, "as-low-flow-reduced-ef-v1");
    } },
  "as-high-gradient-valve-only-v1": { ...definitions["as-high-gradient-valve-only-v1"],
    scoreRest: scoreGrid("as-high-gradient-valve-only-v1"),
    searchableIssues: grids => restTargetHolds("as-high-gradient-valve-only-v1", grids),
    runGrid: input => fit({ ...input, referenceId: "as-high-gradient-valve-only-v1" }),
    assessPair: input => {
      const result = (v: unknown) => (v as { result?: unknown } | null)?.result ?? v;
      return asPair({ coarse: result(input.coarse), fine: result(input.fine) });
    } },
  baseline: { ...definitions.baseline, runGrid: baselineGrid, scoreRest: scoreGrid("baseline"),
    searchableIssues: (grids, q) => {
      const allowed = restTargetHolds("baseline", grids);
      const reserve = (q as Awaited<ReturnType<typeof baselinePair>>).preloadReserve;
      // A positive margin smaller than grid sensitivity is a numerical hold,
      // not permission to fit the response farther from its boundary.
      if (reserve?.status === "failed" && !reserve.issues.length && reserve.responses.every(r =>
        r.endpointDirectionsMatch && r.screens.every(s => s.status !== "unresolved")
        && (r.passed || [...r.margins, ...r.ratioMargins].some(m => !m.passed && m.margin <= 0))
        && [...r.margins, ...r.ratioMargins].every(m => m.passed || Number.isFinite(m.margin) && m.margin <= 0)))
        allowed.push("paired-preload-reserve");
      return allowed;
    },
    assessPair: input => baselinePair(input as Parameters<typeof baselinePair>[0]) },
  "hfref-chronic-dilated-v1": { ...definitions["hfref-chronic-dilated-v1"],
    scoreRest: scoreGrid("hfref-chronic-dilated-v1"),
    searchableIssues: grids => restTargetHolds("hfref-chronic-dilated-v1", grids),
    runGrid: input => fit({ ...input, referenceId: "hfref-chronic-dilated-v1" }),
    assessPair: input => {
      const result = (v: unknown) => (v as { status?: string; result?: unknown } | null)?.result ?? v;
      return hfrefPair({ coarse: result(input.coarse), fine: result(input.fine) });
    } },
};
export function resolveMainWireRegistryCaseProtocolV1(referenceId: Reference) {
  if (!Object.hasOwn(protocols, referenceId)) throw new Error("Unsupported registry case protocol");
  return protocols[referenceId];
}

/** Common material, also for held cases. A future case supplies its protocol;
 * no healthy conditions or case names are embedded in the report builder. */
export async function prepareRegistryCaseAssessmentV1(protocol: RegistryCaseProtocolV1, grids: { coarse: unknown; fine: unknown }) {
  // Callers may carry file metadata alongside a pair. Only these two members
  // are scientific observations; metadata must never become a missing grid.
  const pair = { coarse: grids.coarse, fine: grids.fine };
  const executionIssues = Object.entries(pair).flatMap(([key, value]) => {
    const g = value as { status?: string; message?: string } | null;
    return g && ["operational-failed", "qualification-error"].includes(g.status ?? "")
      ? [`${key}:${g.status}:${g.message ?? "no diagnostic message"}`] : [];
  });
  let qualification: Awaited<ReturnType<RegistryCaseProtocolV1["assessPair"]>>;
  try { qualification = await protocol.assessPair(pair); }
  catch (error) { qualification = { status: "held", issues: [error instanceof Error ? error.message : String(error)] }; }
  if (executionIssues.length) qualification = { ...qualification, status: "held", issues: [...executionIssues, ...qualification.issues] };
  // A case's selected teaching features are not new universal disease gates.
  // Still, a fitted example must retain its requested targets after cold restart.
  const caseTargetIssues = protocol.scoreRest ? Object.entries(pair).flatMap(([key, value]) => {
    try { const score = protocol.scoreRest!(value);
      return score.targetsMet ? [] : (score.holds.length ? score.holds : ["unresolved"]).map(issue => `${key}:case-target:${issue}`);
    } catch (error) { return [`${key}:case-target:${error instanceof Error ? error.message : String(error)}`]; }
  }) : [];
  let searchableIssues: readonly string[] = [];
  try { searchableIssues = protocol.searchableIssues?.(pair, qualification) ?? []; } catch { /* Fail closed for an unrecognized hold. */ }
  const searchHoldIssues = qualification.issues.filter(issue => !searchableIssues.includes(issue));
  return { referenceId: protocol.referenceId, title: protocol.title, qualification, caseTargetIssues, searchHoldIssues,
    reviewItems: protocol.reviewItems.map(id => ({ id, status: "review-pending" as const })),
    status: !caseTargetIssues.length && ["qualified", "checks-passed"].includes(qualification.status) ? "review-pending" as const : "held" as const,
    historicalEvidence: "not-revalidated", publicPromotionAuthorized: false };
}
