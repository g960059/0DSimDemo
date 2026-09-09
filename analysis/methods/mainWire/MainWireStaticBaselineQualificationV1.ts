import { canonicalJsonStringify as canonical, cloneAndFreezeCanonicalJson as own, sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import { MainWireStaticCaseSessionV1 as Session } from "@/engine/vnext/MainWireStaticCaseSessionV1";
import { runMainWireStaticCaseFittingV1 as fit, readMainWireStaticCaseFittingResultV1 as read,
  assessMainWireStaticCaseRestV1 as assessRest, buildMainWireStaticCaseFittingPolicyIdentityV1 as policyIdentity,
  type MainWireStaticCaseCandidateV1 as Candidate } from "./MainWireStaticCaseFittingWorkflowV1";
import { MAIN_WIRE_STATIC_CASE_MODEL_ID_V1 as modelId } from "@/domain/model/MainWireStaticCaseIdentityV1";
import { wrapMainWireStandard72PreloadReserveSessionV1 as wrap } from "./MainWireStandard72PreloadReserveV1";
import { measureMainWireIntegratedModelFormalPreloadReserveV2 as reserve,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1 as reserveProtocol } from "./MainWirePressureVolumeProtocolsV3";
import { MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2 as reserveSettlement } from "./MainWireFixedToneSettlementV2";
import { qualifyMainWirePreloadReserveAdmissionV1 as assessReserve } from "@/analysis/policies/mainWire/MainWirePreloadReserveAdmissionV1";
import { compareMainWirePressureRateObservationsV1 as comparePressureRate } from "./MainWireBaselinePressureRateQualityV1";
import { measureMainWireRelaxationTauV1 as tau, assertMainWireRelaxationTauMeasuredV1 as assertTau,
  assertMainWireRelaxationTraceReviewedV1 as assertRelaxation } from "./MainWireRelaxationTauV1";
import { observeMainWireBaselineV2 as observe } from "./MainWireBaselineObservationV2";
import { mainWireStandard70TimingAndInletObservationTraceV1 as observationTrace } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 as periodic,
  MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3 as numerical } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import { classifyMainWireIntegratedModelPeriodicityV3 as classify } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";

const qualifierId = "main-wire-static-baseline-paired-qualification-v1";
type Dt = .002 | .001;
const same = (a: unknown, b: unknown, message: string) => {
  if (canonical(a) !== canonical(b)) throw new Error(`Static baseline qualification: ${message}`);
};

/** Optional final baseline check, not a disease reference or optimizer. Both
 * grids start independently cold; reserve forks retain their own anatomy.
 * Existing rest, tau, pressure-rate and fixed-control reserve policies apply. */
export async function runMainWireStaticBaselineQualificationGridV1(request: Readonly<{
  candidateInputs: Candidate; sourceSha256: string; nominalDtSec: Dt; abortSignal?: AbortSignal;
}>) {
  const started = performance.now(), candidateInputs = own(request.candidateInputs) as Candidate;
  if (candidateInputs.anatomyId !== "baseline-v1") throw new Error("Baseline qualification cannot be applied to a disease anatomy");
  const fitResult = await fit({ ...request, candidateInputs, referenceId: "baseline" });
  if (fitResult.status !== "saved-result-ready") return { qualifierId, modelId, status: "grid-failed" as const, fitResult };
  const result = fitResult.result, d = result.execution.diagnostics;
  const issues: string[] = [];
  const samples = observationTrace(d), native = observe({ samples, completedBeat: d.completedBeat });
  const relaxation = tau(samples, native.left.events);
  try { assertTau(relaxation); assertRelaxation(relaxation); }
  catch (error) { issues.push(error instanceof Error ? error.message : String(error)); }
  if (result.rest.status !== "passed") issues.push(`rest:${result.rest.status}`);
  const c = result.candidateInputs;
  const source = await Session.restore(result.execution.checkpoint, c.anatomyId,
    c.hemodynamicResearchInputs, 1, c.mechanismResearchInputs);
  same(await source.checkpoint(), result.execution.checkpoint, "checkpoint roundtrip");
  let preloadReserve: Awaited<ReturnType<typeof reserve>> | null = null;
  if (issues.length === 0 && !request.abortSignal?.aborted) {
    try { preloadReserve = await reserve(wrap(source, result.nominalDtSec, request.abortSignal), c.hemodynamicResearchInputs); }
    catch (error) { issues.push(`reserve:${error instanceof Error ? error.message : String(error)}`); }
  }
  if (request.abortSignal?.aborted) issues.push("operational-interrupted");
  same(await source.checkpoint(), result.execution.checkpoint, "reserve changed the source checkpoint");
  return { qualifierId, modelId, status: "grid-evaluated" as const, result, relaxation, preloadReserve, issues,
    checkpointRoundtripVerified: true, sourceUnchangedByReserve: true, wallTimeMs: performance.now() - started };
}
export type MainWireStaticBaselineQualificationGridV1 = Awaited<ReturnType<typeof runMainWireStaticBaselineQualificationGridV1>>;

/** Re-observe locally recorded results. Source seals authenticate the experiment
 * inventory outside this assessor; a digest alone is not scientific approval. */
export async function assessMainWireStaticBaselineQualificationV1(input: Readonly<{
  coarse: MainWireStaticBaselineQualificationGridV1; fine: MainWireStaticBaselineQualificationGridV1;
}>) {
  const grids = own(input) as typeof input, issues: string[] = [];
  const require = (condition: boolean, message: string) => { if (!condition) issues.push(message); };
  for (const [key, dt] of [["coarse", .002], ["fine", .001]] as const) {
    const grid = grids[key];
    require(grid.qualifierId === qualifierId && grid.modelId === modelId, `${key}:identity`);
    if (grid.status !== "grid-evaluated") { issues.push(`${key}:execution-failed`); continue; }
    const result = await read(grid.result), d = result.execution.diagnostics;
    require(result.policyIdentitySha256 === await policyIdentity("baseline"), `${key}:current-policy-binding`);
    require(result.requestIdentitySha256 === await hash({ modelId, sourceSha256: result.sourceSha256,
      candidateInputs: result.candidateInputs, nominalDtSec: result.nominalDtSec,
      initialization: result.initialization, policyIdentitySha256: result.policyIdentitySha256 }), `${key}:request-identity`);
    require(result.initialization.kind === "cold" && result.nominalDtSec === dt
      && result.candidateInputs.anatomyId === "baseline-v1" && result.rest.referenceId === "baseline", `${key}:independent-baseline-grid`);
    const classification = classify(d.periodicObservations, periodic);
    require(classification.status === "period1-converged"
      && canonical(classification) === canonical(result.execution.classification)
      && d.periodicObservations.every(o => o.protocolIdentityHash === result.requestIdentitySha256), `${key}:periodic-binding`);
    require(d.allOffAndOwnerClocksCheckedEveryStep && d.invariantPolicyId === numerical.policyId
      && d.cycleEvidence.length === result.execution.completedCycleCount
      && d.cycleEvidence.every((c, i) => c.cycleIndex === i + 1 && c.acceptedStepCount > 0
        && c.atrialCaptureCount === 1 && c.ventricularCaptureCount === 1
        && Number.isFinite(c.maximumGlobalVolumeErrorMl) && c.maximumGlobalVolumeErrorMl <= numerical.invariantTolerance.globalTotalBloodVolumeErrorMl
        && Number.isFinite(c.maximumCoronaryLedgerErrorMl) && c.maximumCoronaryLedgerErrorMl <= numerical.invariantTolerance.coronaryBloodVolumeLedgerResidualMl), `${key}:conservation-and-captures`);
    const rest = assessRest("baseline", result.execution);
    require(rest.status === "passed" && canonical(rest) === canonical(result.rest), `${key}:rest-reobservation`);
    const samples = observationTrace(d);
    require(samples[0]!.acceptedTimeSec <= d.completedBeat.startTimeSec, `${key}:complete-native-beat`);
    require(samples.every(s => Number.isFinite(s.acceptedDtSec) && s.acceptedDtSec > 0
      && s.acceptedDtSec <= dt + numerical.invariantTolerance.acceptedOwnerClockSkewSec), `${key}:native-grid-record`);
    const relaxation = tau(samples, observe({ samples, completedBeat: d.completedBeat }).left.events);
    same(relaxation, grid.relaxation, "tau reobservation");
    try { assertTau(relaxation); assertRelaxation(relaxation); }
    catch (error) { issues.push(`${key}:${error instanceof Error ? error.message : String(error)}`); }
    require(grid.issues.length === 0 && grid.checkpointRoundtripVerified && grid.sourceUnchangedByReserve, `${key}:grid-hold`);
    require(grid.preloadReserve !== null
      && Math.abs(grid.preloadReserve.sourceGlobalTbvMl - result.candidateInputs.hemodynamicResearchInputs.totalBloodVolumeMl) < 1e-8,
    `${key}:reserve-input-binding`);
  }
  const a = grids.coarse.status === "grid-evaluated" ? grids.coarse : null;
  const b = grids.fine.status === "grid-evaluated" ? grids.fine : null;
  if (a && b) {
    same(a.result.candidateInputs, b.result.candidateInputs, "paired inputs");
    same(a.result.sourceSha256, b.result.sourceSha256, "paired source");
    same(a.result.policyIdentitySha256, b.result.policyIdentitySha256, "paired fitting policy");
  }
  const rateInput = (grid: NonNullable<typeof a>) => ({ nominalDtSec: grid.result.nominalDtSec,
    completedBeat: grid.result.execution.diagnostics.completedBeat, terminalTrace: grid.result.execution.diagnostics.terminalTrace });
  const pressureRateQuality = a?.result.nominalDtSec === .002 && b?.result.nominalDtSec === .001
    ? comparePressureRate({ coarse: rateInput(a), fine: rateInput(b) }) : null;
  require(pressureRateQuality !== null && pressureRateQuality.length === 4 && pressureRateQuality.every(r => r.status === "passed"), "paired-pressure-rate-quality");
  const preloadReserve = a?.preloadReserve && b?.preloadReserve ? assessReserve(a.preloadReserve, b.preloadReserve) : null;
  require(preloadReserve?.status === "passed", "paired-preload-reserve");
  const body = { schemaId: qualifierId, modelId, status: issues.length === 0 ? "qualified" as const : "held" as const,
    issues, grids, pressureRateQuality, preloadReserve,
    execution: { independentColdGrids: true, reserveProtocol, reserveSettlement, selectedOutputProjection: true,
      nominalDtSec: [.002, .001], afterloadTest: false },
    clinicalNormalityClaimed: false, publicPromotionAuthorized: false };
  return { ...body, reportSha256: await hash(body) };
}
