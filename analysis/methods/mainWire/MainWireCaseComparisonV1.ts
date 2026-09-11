import { sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import { readMainWireHistoricalFittingEvidenceV1 as readHistory, compareMainWireCaseInputsV1 as changes } from "@/analysis/registry/MainWireCaseInputRecordV1";
import { mainWireStaticCaseContextV1 as context } from "@/analysis/registry/MainWireStaticCaseDefinitionsV1";
import { assessMainWireStaticCaseRestV1 as assess, buildMainWireStaticCaseFittingPolicyIdentityV1 as policyIdentity,
  type MainWireStaticCaseFittingResultV1 as Result } from "./MainWireStaticCaseFittingWorkflowV1";
import { observeMainWireValveCycleV3 as cycle } from "./MainWireValveCycleObservationV3";
import { mainWireStandard70TimingAndInletObservationTraceV1 as trace } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";

/** Reobserve immutable samples; neither import nor advance a historical checkpoint. */
export async function reobserveMainWireCaseV1(input: unknown, analysisSourceSha256: string) {
  if (!/^[a-f0-9]{64}$/.test(analysisSourceSha256)) throw new Error("Current analysis source digest required");
  const history = await readHistory(input), saved = history.record;
  const d = history.diagnostics as Result["execution"]["diagnostics"];
  const cycleObservation = cycle({ samples: trace(d), completedBeat: d.completedBeat });
  const referenceId = saved.referenceId as Result["rest"]["referenceId"], previous = saved.previousAssessment as Result["rest"];
  const body = { schemaId: "main-wire-case-reobservation-v1", sourceResultSha256: saved.provenance.sourceRecordSha256,
    numericalSourceSha256: history.numericalSourceSha256, analysisSourceSha256, modelId: saved.modelId,
    checkpointSha256: history.checkpointSha256, nominalDtSec: history.nominalDtSec,
    candidateInputs: saved.candidateInputs, previousObservationContext: history.previousObservationContext,
    previousRestStatus: previous.status, previousIssue: previous.status === "unavailable" ? previous.issue : null,
    currentFittingPolicySha256: await policyIdentity(referenceId), currentObservationContext: context(referenceId), cycleObservation,
    rest: assess(referenceId, { diagnostics: d }),
    interpretation: "Same immutable accepted samples; a new observation is not a new numerical run, grid qualification or adoption.",
    numericalStepsExecuted: 0, historicalCheckpointRestored: false, publicPromotionAuthorized: false };
  return { ...body, reobservationSha256: await hash(body) };
}

type Observation = Awaited<ReturnType<typeof reobserveMainWireCaseV1>>;
function values(observation: Observation): Record<string, unknown> | null {
  const rest = observation.rest;
  if (rest.status === "unavailable") return null;
  // Keep existing named measurement fields and units; do not equate an Ao node
  // pressure with a root pressure, net with forward flow, or V2 with V3 timings.
  return "measured" in rest.observation ? rest.observation.measured : rest.observation.values;
}
function leaves(value: unknown, path = "", out: Record<string, number | null> = {}) {
  if (typeof value === "number") out[path] = value;
  else if (value === null) out[path] = null;
  else if (value && typeof value === "object" && !Array.isArray(value))
    for (const [key, child] of Object.entries(value)) leaves(child, path ? `${path}.${key}` : key, out);
  return out;
}

/** One case, one current observation policy, two explicitly identified raw runs.
 * Missing/incompatible old raw data is absence of comparison, not zero change.
 * This diagnostic comparison never changes a gate or authorizes adoption. */
export async function compareMainWireCaseEvidenceV1(input: {
  referenceId: Result["rest"]["referenceId"]; previous: unknown | null; current: unknown;
  analysisSourceSha256: string;
}) {
  const read = async (raw: unknown | null) => {
    if (raw === null) return { status: "missing" as const, observation: null, issue: "raw-evidence-not-supplied" };
    try {
      const h = await readHistory(raw);
      if (h.record.referenceId !== input.referenceId) throw new Error("Different case reference; not a longitudinal comparison");
      const observation = await reobserveMainWireCaseV1(raw, input.analysisSourceSha256);
      return { status: observation.rest.status === "unavailable" ? "unavailable" as const : "observed" as const,
        observation, issue: observation.rest.status === "unavailable" ? observation.rest.issue.message : null };
    } catch (error) { return { status: "unavailable" as const, observation: null, issue: error instanceof Error ? error.message : String(error) }; }
  };
  const previous = await read(input.previous), current = await read(input.current);
  const a = previous.observation, b = current.observation;
  const comparable = previous.status === "observed" && current.status === "observed";
  const before = a && values(a), after = b && values(b);
  const av = before ? leaves(before) : {}, bv = after ? leaves(after) : {};
  const body = { schemaId: "main-wire-case-comparison-v1" as const, referenceId: input.referenceId,
    status: comparable ? "compared" as const : "incomplete" as const, previous, current,
    rows: comparable ? [...new Set([...Object.keys(av), ...Object.keys(bv)])].sort().map(metric => ({ metric,
      previous: av[metric] ?? null, current: bv[metric] ?? null,
      delta: av[metric] != null && bv[metric] != null ? bv[metric]! - av[metric]! : null })) : [],
    inputChanges: a && b ? changes(a.candidateInputs, b.candidateInputs) : null,
    sameNominalDt: a && b ? a.nominalDtSec === b.nominalDtSec : null,
    interpretation: "Both raw runs are reobserved by the current case method and policy. Original identities and assessments are retained. Deltas are descriptive, not new tolerances or an isolated model effect when inputs/dt also differ.",
    numericalStepsExecuted: 0, historicalCheckpointRestored: false, publicPromotionAuthorized: false };
  return { ...body, comparisonSha256: await hash(body) };
}
