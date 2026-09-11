import { canonicalJsonStringify as canonical, cloneAndFreezeCanonicalJson as own, sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import { hotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MainWireStaticCaseSessionV1 as Session } from "@/engine/vnext/MainWireStaticCaseSessionV1";
import { createMainWireIntegratedModelStaticCaseFixtureV1 as fixtureFor } from "@/engine/myocardium/experiments/MainWireIntegratedModelStaticCaseFixtureV1";
import { MAIN_WIRE_STATIC_CASE_MODEL_ID_V1 as modelId } from "@/domain/model/MainWireStaticCaseIdentityV1";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 as periodic,
  MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3 as numerical } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3 as scales } from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import { settleMainWireFittingSessionV1 as settle, MAIN_WIRE_FITTING_OBSERVATION_WINDOW_V1_ID as observationWindowId,
  type MainWireFittingFailureDiagnosticsV1,
  type MainWireFittingNominalDtV1 as Dt } from "./MainWireFittingCycleV1";
import { ownMainWireStaticCaseCandidateV1, assessMainWireStaticCaseRestV1,
  mainWireStaticCaseContextV1 as context, resolveMainWireStaticCaseDefinitionV1 as definition,
  type MainWireStaticCaseCandidateV1, type MainWireCaseReferenceIdV1 } from "@/analysis/registry/MainWireStaticCaseDefinitionsV1";
export { ownMainWireStaticCaseCandidateV1, assessMainWireStaticCaseRestV1 };
export type { MainWireStaticCaseCandidateV1, MainWireCaseReferenceIdV1 };

const schemaId = "main-wire-static-case-fitting-result-v1" as const;
export const MAIN_WIRE_STATIC_CASE_FITTING_V1_ID = "main-wire-static-case-periodic-rest-fitting-v1";
const digest = (s: unknown): s is string => typeof s === "string" && /^[a-f0-9]{64}$/.test(s);

export async function buildMainWireStaticCaseFittingPolicyIdentityV1(referenceId: MainWireCaseReferenceIdV1) {
  return hash({ periodic, numerical, scales, referenceContext: context(referenceId), observationWindowId,
    methodId: MAIN_WIRE_STATIC_CASE_FITTING_V1_ID });
}
type Settled = Extract<Awaited<ReturnType<typeof settle<Awaited<ReturnType<Session["checkpoint"]>>>>>, { status: "accepted" }>;

export type MainWireStaticCaseFittingRequestV1 = Readonly<{
  referenceId: MainWireCaseReferenceIdV1;
  candidateInputs: MainWireStaticCaseCandidateV1;
  /** Content snapshot, not Git HEAD or this mutable research model's name. */
  sourceSha256: string;
  nominalDtSec?: Dt;
  reuse?: unknown;
  abortSignal?: AbortSignal;
}>;

/** Bounded screening for both references; no new engine, optimizer, mint, or
 * normal-physiology requirement in the shared numerical execution. */
export async function runMainWireStaticCaseFittingV1(request: MainWireStaticCaseFittingRequestV1) {
  const started = performance.now(), abortSignal = request.abortSignal;
  let phase = "request-validation";
  let failureDiagnostics: MainWireFittingFailureDiagnosticsV1 | null = null;
  const fail = (status: "invalid-or-physical" | "numerical-unresolved" | "nonsettled-or-event-change" | "operational-interrupted", message: string) =>
    ({ status, phase, message, modelId, wallTimeMs: performance.now() - started, ...(failureDiagnostics ? { failureDiagnostics } : {}) });
  try {
    const { referenceId, sourceSha256 } = request, nominalDtSec = request.nominalDtSec ?? .002;
    const candidateInputs = definition(referenceId).ownInputs(request.candidateInputs);
    const referenceContext = context(referenceId), reuse = request.reuse === undefined ? null : own(request.reuse);
    if (!digest(sourceSha256)) throw new Error("A content-bound source SHA-256 is required for the mutable research model");
    if (nominalDtSec !== .002 && nominalDtSec !== .001) throw new Error("Case fitting supports only 2ms or1ms schedules");
    if (hotPathIntegrityTierV1() !== "hot-path-lean") throw new Error("Case fitting requires hot-path-lean");
    if (abortSignal?.aborted) return fail("operational-interrupted", "Evaluation interrupted");
    const saved = reuse === null ? null : await readMainWireStaticCaseFittingResultV1(reuse);
    if (saved && (saved.sourceSha256 !== sourceSha256 || saved.candidateInputs.anatomyId !== candidateInputs.anatomyId))
      throw new Error("Checkpoint reuse requires the same source content and static anatomy; use cold construction otherwise");
    const sourceInputs = saved?.candidateInputs ?? candidateInputs;
    const initialization = saved === null ? { kind: "cold" as const } : {
      kind: canonical(sourceInputs) === canonical(candidateInputs) ? "exact-checkpoint" as const : "parameter-continuation" as const,
      sourceResultSha256: saved.resultSha256, checkpointSha256: saved.execution.checkpoint.checkpointSha256,
      sourceCandidateInputs: sourceInputs, sourceNominalDtSec: saved.nominalDtSec };
    const policyIdentitySha256 = await buildMainWireStaticCaseFittingPolicyIdentityV1(referenceId);
    const identity = { modelId, sourceSha256, candidateInputs, nominalDtSec, initialization, policyIdentitySha256 };
    const requestIdentitySha256 = await hash(identity);
    phase = "initialization";
    let session = saved === null ? Session.create(candidateInputs.anatomyId, candidateInputs.hemodynamicResearchInputs, 1, candidateInputs.mechanismResearchInputs)
      : await Session.restore(saved.execution.checkpoint, sourceInputs.anatomyId, sourceInputs.hemodynamicResearchInputs, 1, sourceInputs.mechanismResearchInputs);
    if (initialization.kind === "parameter-continuation") session = session.warmStart(candidateInputs.hemodynamicResearchInputs, candidateInputs.mechanismResearchInputs);
    const fixture = fixtureFor(candidateInputs.anatomyId, candidateInputs.hemodynamicResearchInputs, 1, candidateInputs.mechanismResearchInputs);
    const execution = await settle({ session, fixture, nominalDtSec, abortSignal, requestIdentitySha256,
      checkpoint: () => session.checkpoint(), onPhase: p => { phase = p; }, onFailureDiagnostics: d => { failureDiagnostics = d; } });
    if (execution.status !== "accepted") return fail(execution.status, execution.message);
    phase = "observation";
    const rest = assessMainWireStaticCaseRestV1(referenceId, execution);
    const body = { schemaId, ...identity, requestIdentitySha256, referenceContext, execution, rest,
      qualification: { scope: "periodic-rest-screen-only" as const, pairedGrid: "not-evaluated" as const,
        preloadReserve: "not-evaluated" as const, waveformReview: "not-performed" as const,
        clinicalValidationClaimed: false as const, publicPromotionAuthorized: false as const },
      wallTimeMs: performance.now() - started };
    return { status: "saved-result-ready" as const, result: { ...body, resultSha256: await hash(body) } };
  } catch (error) {
    return fail(phase === "request-validation" || phase === "initialization" ? "invalid-or-physical"
      : phase === "observation" ? "nonsettled-or-event-change" : "numerical-unresolved",
    error instanceof Error ? error.message : String(error));
  }
}
export type MainWireStaticCaseFittingResultV1 = Readonly<{
  schemaId: typeof schemaId; modelId: typeof modelId; sourceSha256: string;
  candidateInputs: MainWireStaticCaseCandidateV1; nominalDtSec: Dt;
  initialization: { kind: "cold" } | { kind: "exact-checkpoint" | "parameter-continuation";
    sourceResultSha256: string; checkpointSha256: string; sourceCandidateInputs: MainWireStaticCaseCandidateV1; sourceNominalDtSec: Dt };
  policyIdentitySha256: string; requestIdentitySha256: string; referenceContext: ReturnType<typeof context>;
  execution: Settled; rest: ReturnType<typeof assessMainWireStaticCaseRestV1>;
  qualification: { scope: "periodic-rest-screen-only"; pairedGrid: "not-evaluated";
    preloadReserve: "not-evaluated"; waveformReview: "not-performed";
    clinicalValidationClaimed: false; publicPromotionAuthorized: false };
  wallTimeMs: number; resultSha256: string;
}>;

/** Historical screen results are initial states, not current qualifications.
 * Digests detect edits; exact restore checks full input/construction binding. */
export async function readMainWireStaticCaseFittingResultV1(input: unknown): Promise<MainWireStaticCaseFittingResultV1> {
  const value = own(input) as MainWireStaticCaseFittingResultV1;
  if (!value || value.schemaId !== schemaId || value.modelId !== modelId || !digest(value.sourceSha256)
    || !digest(value.resultSha256) || !digest(value.policyIdentitySha256)) throw new Error("Invalid static-case fitting identity");
  const { resultSha256, ...body } = value;
  if (await hash(body) !== resultSha256) throw new Error("Static-case fitting result digest differs");
  const c = definition(value.rest.referenceId).ownInputs(value.candidateInputs);
  context(value.referenceContext.reference.referenceId);
  if (value.rest.referenceId !== value.referenceContext.reference.referenceId || value.execution.status !== "accepted"
    || value.execution.classification.status !== "period1-converged"
    || ![.002, .001].includes(value.nominalDtSec) || value.qualification.scope !== "periodic-rest-screen-only"
    || value.qualification.pairedGrid !== "not-evaluated" || value.qualification.preloadReserve !== "not-evaluated"
    || value.qualification.waveformReview !== "not-performed" || value.qualification.clinicalValidationClaimed !== false
    || value.qualification.publicPromotionAuthorized !== false) throw new Error("Invalid static-case screen scope");
  const s = await Session.restore(value.execution.checkpoint, c.anatomyId, c.hemodynamicResearchInputs, 1, c.mechanismResearchInputs);
  const state = s.currentAcceptedState(), fixture = fixtureFor(c.anatomyId, c.hemodynamicResearchInputs, 1, c.mechanismResearchInputs);
  if (Math.abs(state.coronary.fixedGlobalTotalBloodVolumeMl - c.hemodynamicResearchInputs.totalBloodVolumeMl) > 1e-8
    || canonical(state.coronary.coronaryAutoregulationBinding) !== canonical(fixture.cold.acceptedState.coronary.coronaryAutoregulationBinding)
    || canonical(s.observe().completedBeatMetrics) !== canonical(value.execution.diagnostics.completedBeat)
    || state.acceptedTimeSec !== value.execution.diagnostics.terminalTrace.at(-1)?.acceptedTimeSec)
    throw new Error("Static-case result is not its own resting checkpoint/terminal evidence");
  return value;
}
