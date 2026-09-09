import { canonicalJsonStringify, cloneAndFreezeCanonicalJson, sha256CanonicalJsonHex } from "@/engine/integrity";
import { MAIN_WIRE_INTEGRATED_STUDIO_STANDARD72_MODEL_ID_V1 as modelId } from "@/domain/model/MainWireStandardIdentityV1";
import { MainWireIntegratedModelStandard72TypedAuthoritySessionV1 as Session } from "@/engine/vnext/MainWireIntegratedModelStandard72TypedAuthoritySessionV1";
import type { MainWireBaselineCalibrationCandidateInputsV1 as Candidate } from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 as periodic,
  MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3 as numerical } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import { MAIN_WIRE_PROSPECTIVE_BASELINE_ADMISSION_V1 as restPolicy,
  assessMainWireProspectiveRestV1 as assessRest } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineAdmissionV1";
import { classifyMainWireIntegratedModelPeriodicityV3 as classify } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import { measureMainWireIntegratedModelStandard70CandidateEvidenceV1 as measure,
  mainWireStandard70TimingAndInletObservationTraceV1 as observationTrace } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { buildMainWireProspectiveBaselineChecksV1 as buildChecks } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineChecksV1";
import { observeMainWireStandard70TimingAndInletV2 as observeTiming } from "./MainWireStandard70BaselineAssessmentV2";
import { MAIN_WIRE_PRELOAD_RESERVE_ADMISSION_V1 as reservePolicy,
  qualifyMainWirePreloadReserveAdmissionV1 as assessReserve } from "@/analysis/policies/mainWire/MainWirePreloadReserveAdmissionV1";
import { MAIN_WIRE_BASELINE_PRESSURE_RATE_QUALITY_POLICY_V1 as pressureRatePolicy,
  compareMainWirePressureRateObservationsV1 as comparePressureRate } from "./MainWireBaselinePressureRateQualityV1";
import { MAIN_WIRE_RELAXATION_TAU_POLICY_V1 as tauPolicy,
  measureMainWireRelaxationTauV1 as measureTau, assertMainWireRelaxationTauMeasuredV1 as assertTau,
  assertMainWireRelaxationTraceReviewedV1 as assertRelaxation } from "./MainWireRelaxationTauV1";
import { observeMainWireBaselineV2 as observeNative } from "./MainWireBaselineObservationV2";
import { evaluateMainWireStandard72BaselineCalibrationCandidateV1 as evaluate,
  buildMainWireStandard72FittingPolicyIdentityV1 as evaluatorPolicyIdentity,
  type MainWireStandard72FittingNominalDtV1 as Dt } from "./MainWireStandard72BaselineCalibrationEvaluatorV1";
import { measureMainWireStandard72PreloadReserveV1 as measureReserve,
  MAIN_WIRE_STANDARD72_PRELOAD_RESERVE_V1_ID as reserveAdapterId } from "./MainWireStandard72PreloadReserveV1";
import { MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1 as reserveBase } from "./MainWirePressureVolumeProtocolsV3";
import { MAIN_WIRE_STANDARD70_PRELOAD_RESERVE_POLICY_V1 as reserveResponse } from "@/analysis/policies/mainWire/MainWireStandard70PreloadReservePolicyV1";
import { MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2 as reserveSettlement } from "./MainWireFixedToneSettlementV2";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";

export const MAIN_WIRE_STANDARD72_FITTING_QUALIFICATION_V1_ID = "main-wire-standard72-fitted-candidate-qualification-v1";
const qualifierId = MAIN_WIRE_STANDARD72_FITTING_QUALIFICATION_V1_ID;

/** A final check, not a search objective. Each grid starts cold independently;
 * its settled checkpoint seeds fixed-control reserve, never the other grid.
 * The CLI runs these two independent jobs in separate processes.
 */
export async function runMainWireStandard72QualificationGridV1(request: Readonly<{
  candidateInputs: Candidate; nominalDtSec: Dt; abortSignal?: AbortSignal;
}>) {
  const started = performance.now();
  const candidateInputs = cloneAndFreezeCanonicalJson(request.candidateInputs) as Candidate;
  const nominalDtSec = request.nominalDtSec, abortSignal = request.abortSignal;
  const candidateIdentitySha256 = await sha256CanonicalJsonHex(candidateInputs);
  const evaluation = await evaluate({ candidateInputs, nominalDtSec,
    initialization: { kind: "cold" }, retainTerminalDiagnostics: true, abortSignal });
  const context = { qualifierId, modelId, candidateIdentitySha256, nominalDtSec };
  if (evaluation.status !== "accepted" || evaluation.diagnostics === undefined) {
    return { ...context, status: "grid-failed" as const, evaluation, wallTimeMs: performance.now() - started };
  }
  const d = evaluation.diagnostics;
  const issues: string[] = [];
  const samples = observationTrace(d);
  const native = observeNative({ samples, completedBeat: d.completedBeat });
  const tau = measureTau(samples, native.left.events);
  try { assertTau(tau); assertRelaxation(tau); }
  catch (error) { issues.push(error instanceof Error ? error.message : String(error)); }
  if (evaluation.rest.status !== "passed") issues.push(`rest:${evaluation.rest.status}`);
  const restored = await Session.restoreStandard72ExactCheckpoint(evaluation.checkpoint,
    candidateInputs.hemodynamicResearchInputs, candidateInputs.ventricularContractilityScale,
    undefined, candidateInputs.mechanismResearchInputs);
  const checkpointRoundtripVerified = canonicalJsonStringify(await restored.checkpointStandard72Exact())
    === canonicalJsonStringify(evaluation.checkpoint);
  if (!checkpointRoundtripVerified) issues.push("own-checkpoint-roundtrip");
  // Do not spend reserve time on a candidate already held by rest or dynamics.
  let preloadReserve: Awaited<ReturnType<typeof measureReserve>> | null = null;
  if (issues.length === 0 && !abortSignal?.aborted) {
    try { preloadReserve = await measureReserve({ candidateInputs, checkpoint: evaluation.checkpoint,
      nominalDtSec, abortSignal }); }
    catch (error) { issues.push(`reserve:${error instanceof Error ? error.message : String(error)}`); }
  }
  if (abortSignal?.aborted) issues.push("operational-interrupted");
  return { ...context, status: "grid-evaluated" as const, evaluation, native, tau,
    checkpointRoundtripVerified, preloadReserve, issues, wallTimeMs: performance.now() - started };
}
export type MainWireStandard72QualificationGridV1 = Awaited<ReturnType<typeof runMainWireStandard72QualificationGridV1>>;

/** Local worker result boundary. Re-observe primitive traces and the paired
 * reserve margins; a saved vote is never substituted for this assessment.
 * This is not authentication of arbitrary third-party JSON or publication.
 */
export async function assessMainWireStandard72FittingQualificationV1(input: Readonly<{
  coarse: MainWireStandard72QualificationGridV1; fine: MainWireStandard72QualificationGridV1;
}>) {
  const grids = cloneAndFreezeCanonicalJson(input) as typeof input;
  const issues: string[] = [];
  const require = (condition: boolean, issue: string) => { if (!condition) issues.push(issue); };
  for (const [key, dt] of [["coarse", .002], ["fine", .001]] as const) {
    const grid = grids[key];
    require(grid.qualifierId === qualifierId && grid.modelId === modelId && grid.nominalDtSec === dt, `${key}:identity-or-dt`);
    if (grid.status !== "grid-evaluated") { issues.push(`${key}:execution-failed`); continue; }
    const e = grid.evaluation, d = e.diagnostics!;
    if (!d) { issues.push(`${key}:missing-terminal-evidence`); continue; }
    require(e.modelId === modelId && e.nominalDtSec === dt && e.initializationKind === "cold"
      && e.initialization.kind === "cold" && e.executionPath === "standard72-selected-output-projection"
      && e.policyIdentitySha256 === await evaluatorPolicyIdentity(), `${key}:cold-execution-binding`);
    require(grid.candidateIdentitySha256 === await sha256CanonicalJsonHex(e.candidateInputs), `${key}:candidate-binding`);
    const classification = classify(d.periodicObservations, periodic);
    require(classification.status === "period1-converged"
      && canonicalJsonStringify(classification) === canonicalJsonStringify(e.classification)
      && d.periodicObservations.every(o => o.protocolIdentityHash === e.requestIdentitySha256)
      && d.allOffAndOwnerClocksCheckedEveryStep && d.invariantPolicyId === numerical.policyId, `${key}:periodic-protocol`);
    const recent = d.cycleEvidence.slice(-periodic.consecutiveCycles);
    require(recent.length === periodic.consecutiveCycles && recent.at(-1)?.cycleIndex === e.completedCycleCount
      && canonicalJsonStringify(recent.map(c => c.cycleIndex)) === canonicalJsonStringify(e.classification.evidenceCycleIndices)
      && d.cycleEvidence.length === e.completedCycleCount
      && d.cycleEvidence.every((c, i) => c.cycleIndex === i + 1 && c.acceptedStepCount > 0
        && c.atrialCaptureCount === 1 && c.ventricularCaptureCount === 1
        && Number.isFinite(c.maximumGlobalVolumeErrorMl) && c.maximumGlobalVolumeErrorMl <= numerical.invariantTolerance.globalTotalBloodVolumeErrorMl
        && Number.isFinite(c.maximumCoronaryLedgerErrorMl) && c.maximumCoronaryLedgerErrorMl <= numerical.invariantTolerance.coronaryBloodVolumeLedgerResidualMl), `${key}:capture-and-conservation`);
    const measurements = measure({ ...d, timingAndInletObserver: observeTiming });
    const scope = d.applicability;
    require(scope !== undefined && [scope.respiratory.PEEP, scope.respiratory.Pth0,
      scope.respiratory.respAmpTh, scope.respiratory.respAmpAlv, scope.respiratory.respRate].every(x => x === 0)
      && scope.bodySurfaceAreaM2 === 1.9 && measurements.cardiacSizeAndFunction.bodySurfaceAreaM2 === 1.9
      && scope.requestedHeartRateBpm === e.candidateInputs.hemodynamicResearchInputs.heartRateBpm
      && [60, 70].includes(scope.requestedHeartRateBpm)
      && scope.observedHeartRateBpm === 60 / d.completedBeat.durationSec
      && Math.abs(scope.observedHeartRateBpm - scope.requestedHeartRateBpm) < 1e-7,
    `${key}:resting-applicability`);
    const checks = buildChecks(measurements, classification.status === "period1-converged");
    const rest = assessRest(d.completedBeat, checks, measurements.cardiacSizeAndFunction.bodySurfaceAreaM2);
    require(rest.status === "passed" && grid.issues.length === 0, `${key}:rest-or-dynamics-held`);
    require(canonicalJsonStringify(rest) === canonicalJsonStringify(e.rest)
      && canonicalJsonStringify(checks) === canonicalJsonStringify(e.checks), `${key}:rest-reobservation`);
    require(grid.checkpointRoundtripVerified
      && canonicalJsonStringify(e.checkpoint.baseStandardCheckpointV2.completedBeatMetrics) === canonicalJsonStringify(d.completedBeat)
      && e.checkpoint.acceptedTimeSec === d.terminalTrace.at(-1)?.acceptedTimeSec, `${key}:checkpoint-beat-binding`);
    const samples = observationTrace(d);
    const native = observeNative({ samples, completedBeat: d.completedBeat });
    const tau = measureTau(samples, native.left.events);
    try { assertTau(tau); assertRelaxation(tau); }
    catch (error) { issues.push(`${key}:${error instanceof Error ? error.message : String(error)}`); }
    require(canonicalJsonStringify(tau) === canonicalJsonStringify(grid.tau), `${key}:tau-reobservation`);
    const reserve = grid.preloadReserve;
    require(reserve !== null && reserve.execution.nominalDtSec === dt
      && reserve.execution.adapterId === reserveAdapterId
      && reserve.execution.executionPath === "standard72-selected-output-projection"
      && reserve.execution.selectedProjectionAdvanceCount > 0
      && reserve.execution.internalAcceptedSubstepCount >= reserve.execution.selectedProjectionAdvanceCount
      && reserve.execution.maximumRequestedDtSec > 0
      && reserve.execution.maximumRequestedDtSec <= dt + numerical.invariantTolerance.acceptedOwnerClockSkewSec
      && Math.abs(reserve.sourceGlobalTbvMl - e.candidateInputs.hemodynamicResearchInputs.totalBloodVolumeMl) < 1e-8,
    `${key}:reserve-construction-step-binding`);
  }
  require(grids.coarse.candidateIdentitySha256 === grids.fine.candidateIdentitySha256, "same-candidate-required");
  const observation = (grid: MainWireStandard72QualificationGridV1) => grid.status !== "grid-evaluated" || !grid.evaluation.diagnostics ? null : {
    nominalDtSec: grid.nominalDtSec, completedBeat: grid.evaluation.diagnostics!.completedBeat,
    terminalTrace: grid.evaluation.diagnostics!.terminalTrace };
  const coarse = observation(grids.coarse), fine = observation(grids.fine);
  const pressureRateQuality = coarse && fine ? comparePressureRate({ coarse, fine }) : null;
  require(pressureRateQuality !== null && pressureRateQuality.length === 4
    && pressureRateQuality.every(c => c.status === "passed"), "pressure-rate-quality");
  const a = grids.coarse.status === "grid-evaluated" ? grids.coarse.preloadReserve : null;
  const b = grids.fine.status === "grid-evaluated" ? grids.fine.preloadReserve : null;
  const preloadReserve = a && b ? assessReserve(a, b) : null;
  require(preloadReserve?.status === "passed", "paired-preload-reserve");
  const reference = resolveMainWireFittingReferenceV1("baseline");
  const policy = { qualifierId, restPolicy, reservePolicy, pressureRatePolicy, tauPolicy,
    evaluatorPolicyIdentitySha256: await evaluatorPolicyIdentity(),
    reserveExecution: { adapterId: reserveAdapterId, base: reserveBase, response: reserveResponse,
      settlement: reserveSettlement, admissionReplacesLegacyPressureAmplitudeFloor: true },
    initialization: "independent-cold-grids" as const, afterloadTest: false as const };
  const body = { schemaId: "main-wire-standard72-fitted-candidate-qualification-v1", modelId,
    status: issues.length === 0 ? "qualified" as const : "held" as const, issues,
    referenceIdentitySha256: await sha256CanonicalJsonHex(reference), policy,
    policyIdentitySha256: await sha256CanonicalJsonHex(policy), grids, pressureRateQuality, preloadReserve,
    clinicalNormalityClaimed: false as const, publicBaselinePromotionAuthorized: false as const,
    qualificationScope: "fixed-construction-rest-and-fixed-control-preload-with-two-grid-sensitivity" as const };
  return { ...body, reportSha256: await sha256CanonicalJsonHex(body) };
}
