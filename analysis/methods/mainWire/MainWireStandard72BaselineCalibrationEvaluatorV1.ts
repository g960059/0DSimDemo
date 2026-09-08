import { canonicalJsonStringify, cloneAndFreezeCanonicalJson, sha256CanonicalJsonHex } from "@/engine/integrity";
import { hotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MAIN_WIRE_INTEGRATED_STUDIO_STANDARD72_MODEL_ID_V1 as modelId } from "@/domain/model/MainWireStandardIdentityV1";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD72_IDENTITY_V1 as exactIdentity,
  type MainWireIntegratedModelStandard72CheckpointV1 as Checkpoint } from "@/engine/myocardium/MainWireIntegratedModelStandard72CheckpointV1";
import { MainWireIntegratedModelStandard72TypedAuthoritySessionV1 as Session } from "@/engine/vnext/MainWireIntegratedModelStandard72TypedAuthoritySessionV1";
import { createMainWireIntegratedModelStandard71FixtureV1 as createFixture } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 as periodicPolicy,
  MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3 as numericalPolicy } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3 as scales } from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import { compareMainWireIntegratedModelAcceptedStatesV3 as compareStates } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import { classifyMainWireIntegratedModelPeriodicityV3 as classify,
  type MainWireIntegratedModelPeriodicCycleObservationV3 as CycleObservation } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import { limitMainWireIntegratedModelCandidateTimeV3 as limitTime } from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import type { MainWireIntegratedModelHemodynamicTraceSampleV3 as Sample } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type { MainWireIntegratedModelOutputIdV3 } from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import { measureMainWireIntegratedModelStandard70CandidateEvidenceV1 as measure,
  completeMainWireStandard70TimingAndInletTraceV1 as completeTiming } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { buildMainWireProspectiveBaselineChecksV1 as buildChecks } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineChecksV1";
import { observeMainWireStandard70TimingAndInletV2 as observeTiming } from "./MainWireStandard70BaselineAssessmentV2";
import { MAIN_WIRE_BASELINE_OBSERVATION_V2_ID } from "./MainWireBaselineObservationV2";
import { MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineGateRolesV1";
import gateEvidence from "@/data/physiology/main-wire-prospective-reference-evidence-v1.json";
import { MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_POLICY_V1 as observationBounds } from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_POLICY_V1 as rightHeartBounds } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import { assessMainWireProspectiveRestV1 as assessRest,
  MAIN_WIRE_PROSPECTIVE_BASELINE_ADMISSION_V1 as restPolicy } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineAdmissionV1";
import { MAIN_WIRE_RESTING_REFERENCE_PROFILE_V1 as referenceProfile } from "@/analysis/registry/MainWireRestingReferenceProfileV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3 as ownHemodynamics } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import { validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3 as ownMechanism } from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import type { MainWireBaselineCalibrationCandidateInputsV1 as Candidate } from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import { NON_CORONARY_NODE_NAMES_V1 } from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import { CORONARY_CONSERVED_VOLUME_NODE_IDS_V2 } from "@/engine/coronary/typesV2";

export const MAIN_WIRE_STANDARD72_BASELINE_CALIBRATION_EVALUATOR_V1_ID = "main-wire-standard72-baseline-calibration-evaluator-v1";
const evaluatorId = MAIN_WIRE_STANDARD72_BASELINE_CALIBRATION_EVALUATOR_V1_ID;
const observedOutputIds: readonly MainWireIntegratedModelOutputIdV3[] = [
  ...(["LA", "LV", "RA", "RV", "Ao", "PA", "PVein"] as const).map(id => `hemodynamics.pressure.absolute.${id}` as const),
  ...(["LV", "RV"] as const).map(id => `hemodynamics.pressure.transmural.${id}` as const),
  ...(["MV", "AoV", "TV", "PV"] as const).map(id => `hemodynamics.flow.valve.${id}` as const),
  "coronary.flow.total", "coronary.flow.venous-outlet",
];
type FittingSample = Sample & Readonly<{ numerical: Readonly<{
  globalVolumeErrorMl: number; coronaryLedgerErrorMl: number;
}> }>;
const classifierOptions = Object.freeze({
  period1NormalizedTolerance: periodicPolicy.period1NormalizedTolerance,
  period2NormalizedTolerance: periodicPolicy.period2NormalizedTolerance,
  period2MinimumPeriod1NormalizedDelta: periodicPolicy.period2MinimumPeriod1NormalizedDelta,
  consecutiveCycles: periodicPolicy.consecutiveCycles,
});

export type MainWireStandard72FittingNominalDtV1 = .002 | .001;
export type MainWireStandard72FittingInitializationV1 =
  | Readonly<{ kind: "cold" }>
  | Readonly<{ kind: "standard72-exact-checkpoint"; checkpoint: Checkpoint; sourceNominalDtSec?: MainWireStandard72FittingNominalDtV1 }>
  | Readonly<{ kind: "standard72-parameter-continuation"; checkpoint: Checkpoint; sourceCandidateInputs: Candidate;
    sourceNominalDtSec?: MainWireStandard72FittingNominalDtV1 }>;
export type MainWireStandard72BaselineCalibrationRequestV1 = Readonly<{
  candidateInputs?: Candidate;
  initialization?: MainWireStandard72FittingInitializationV1;
  nominalDtSec?: MainWireStandard72FittingNominalDtV1;
  /** Retain only the terminal measurement windows for post-fit assessment. */
  retainTerminalDiagnostics?: boolean;
  abortSignal?: AbortSignal;
}>;

/** A bounded resting assessment, not an optimizer or post-fit envelope approval.
 * Historical checks supply observations/retained guards; the reviewed prospective
 * policy decides their roles. In particular, old70 all-pass is never required.
 */
export async function evaluateMainWireStandard72BaselineCalibrationCandidateV1(
  request: MainWireStandard72BaselineCalibrationRequestV1 = {},
) {
  const startedAt = performance.now();
  const abortSignal = request.abortSignal, retainTerminalDiagnostics = request.retainTerminalDiagnostics;
  let phase = "request-validation";
  let requestIdentitySha256: string | null = null;
  const fail = (status: "invalid-or-physical" | "numerical-unresolved" | "nonsettled-or-event-change" | "operational-interrupted", message: string) => ({
    evaluatorId, modelId, status, phase, requestIdentitySha256, message, wallTimeMs: performance.now() - startedAt,
  });
  try {
    if (abortSignal?.aborted) return fail("operational-interrupted", "Evaluation interrupted");
    const candidateInputs = ownCandidate(request.candidateInputs
      ?? resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs);
    const nominalDtSec = request.nominalDtSec ?? .002;
    if (nominalDtSec !== .002 && nominalDtSec !== .001) throw new Error("Standard72 fitting supports only 2ms or 1ms schedules");
    if (hotPathIntegrityTierV1() !== "hot-path-lean") throw new Error("Standard72 fitting requires the admitted hot-path-lean entry point");
    // Own before the first asynchronous digest; caller mutations cannot alter execution.
    const initialization = cloneAndFreezeCanonicalJson(request.initialization ?? { kind: "cold" }) as MainWireStandard72FittingInitializationV1;
    if (!["cold", "standard72-exact-checkpoint", "standard72-parameter-continuation"].includes(initialization.kind)) {
      throw new Error("Standard72 fitting initialization is unregistered");
    }
    if (initialization.kind !== "cold" && initialization.sourceNominalDtSec !== undefined
      && initialization.sourceNominalDtSec !== .002 && initialization.sourceNominalDtSec !== .001) {
      throw new Error("Invalid source analysis step; checkpoints do not authenticate a nominal schedule");
    }
    const policyIdentitySha256 = await buildMainWireStandard72FittingPolicyIdentityV1();
    const identity = { evaluatorId, modelId, exactIdentity, candidateInputs, nominalDtSec,
      policyIdentitySha256, initialization: initialization.kind === "cold" ? initialization : {
        kind: initialization.kind, checkpointSha256: initialization.checkpoint.checkpointSha256,
        sourceNominalDtSec: initialization.sourceNominalDtSec ?? null,
        ...(initialization.kind === "standard72-parameter-continuation"
          ? { sourceCandidateInputs: ownCandidate(initialization.sourceCandidateInputs) } : {}),
      } };
    requestIdentitySha256 = await sha256CanonicalJsonHex(identity);
    phase = "initialization";
    const source = initialization.kind === "standard72-parameter-continuation"
      ? ownCandidate(initialization.sourceCandidateInputs) : candidateInputs;
    let session = initialization.kind === "cold"
      ? await Session.create(candidateInputs.hemodynamicResearchInputs, candidateInputs.ventricularContractilityScale, undefined, candidateInputs.mechanismResearchInputs)
      : await Session.restoreStandard72ExactCheckpoint(initialization.checkpoint,
        source.hemodynamicResearchInputs, source.ventricularContractilityScale, undefined, source.mechanismResearchInputs);
    if (initialization.kind === "standard72-parameter-continuation") {
      session = await session.warmStartWithHemodynamicResearchInputs(candidateInputs.hemodynamicResearchInputs,
        candidateInputs.ventricularContractilityScale, undefined, candidateInputs.mechanismResearchInputs);
    }
    const fixture = createFixture(candidateInputs.hemodynamicResearchInputs,
      candidateInputs.ventricularContractilityScale, candidateInputs.mechanismResearchInputs);
    const respiratory = Object.freeze({ ...fixture.runtime.respiratory });
    if (!(["PEEP", "Pth0", "respAmpTh", "respAmpAlv", "respRate"] as const)
      .every(key => respiratory[key] === 0)) {
      throw new Error("Resting reference qualification requires zero pressure reference and no respiration");
    }
    if ([fixture.config.lvad, fixture.config.impella, fixture.config.vaEcmo,
      fixture.config.vvEcmo, fixture.config.iabp].some(control => control.enabled)) {
      throw new Error("Baseline qualification requires disabled assistance controls");
    }
    phase = "exact-execution";
    // A saved launch can be between coronary boundaries; finish that partial cycle
    // before collecting the fresh full-state periodic closure chain.
    const initial = session.currentAcceptedState();
    if (initial.coronary.coronaryAutoregulation.acceptedDurationSec !== 0) runCycle(session, fixture, 0, nominalDtSec);
    const boundaries = [session.currentAcceptedState()];
    const observations: CycleObservation[] = [];
    let classification = classify(observations, classifierOptions);
    let terminalTrace: readonly FittingSample[] = [];
    const cycleEvidence: { cycleIndex: number; acceptedStepCount: number;
      atrialCaptureCount: number; ventricularCaptureCount: number;
      maximumGlobalVolumeErrorMl: number; maximumCoronaryLedgerErrorMl: number }[] = [];
    let completedCycleCount = 0;
    for (let cycleIndex = 1; cycleIndex <= periodicPolicy.maximumCycleCount; cycleIndex++) {
      if (abortSignal?.aborted) return fail("operational-interrupted", "Evaluation interrupted");
      terminalTrace = runCycle(session, fixture, cycleIndex, nominalDtSec);
      const accepted = session.currentAcceptedState();
      const previous = boundaries.at(-1)!;
      const evidence = { cycleIndex, acceptedStepCount: terminalTrace.length,
        atrialCaptureCount: accepted.composedRhythm.acceptedAtrialCaptureCount - previous.composedRhythm.acceptedAtrialCaptureCount,
        ventricularCaptureCount: accepted.composedRhythm.acceptedVentricularCaptureCount - previous.composedRhythm.acceptedVentricularCaptureCount,
        maximumGlobalVolumeErrorMl: Math.max(...terminalTrace.map(s => s.numerical.globalVolumeErrorMl)),
        maximumCoronaryLedgerErrorMl: Math.max(...terminalTrace.map(s => s.numerical.coronaryLedgerErrorMl)) };
      if (evidence.atrialCaptureCount !== 1 || evidence.ventricularCaptureCount !== 1) throw new Error("Baseline qualification requires one sinus capture of each chamber per cycle");
      cycleEvidence.push(evidence);
      observations.push({ cycleIndex, evidenceRole: "canonical-periodic-protocol", protocolIdentityHash: requestIdentitySha256,
        period1: compareStates(accepted, boundaries.at(-1)!, scales, fixture.config),
        period2: boundaries.length < 2 ? null : compareStates(accepted, boundaries.at(-2)!, scales, fixture.config) });
      classification = classify(observations, classifierOptions);
      if (observations.length > periodicPolicy.consecutiveCycles) observations.shift();
      boundaries.push(accepted); if (boundaries.length > 3) boundaries.shift();
      completedCycleCount = cycleIndex;
      if (classification.status !== "not-converged") break;
      // Let a UI/CLI cancellation reach the bounded between-cycle check.
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    phase = "periodic-classification";
    if (classification.status !== "period1-converged") return fail("nonsettled-or-event-change", classification.status);
    const checkpoint = await session.checkpointStandard72Exact();
    phase = "observation";
    const completedBeat = session.observe().completedBeatMetrics;
    if (completedBeat === null || completedBeat.endTimeSec <= initial.acceptedTimeSec) throw new Error("Candidate produced no fresh complete beat");
    // Capture first; the real lookahead cannot replace the reusable qualified boundary.
    const timing = completeTiming({ terminalTrace, completedBeatEndTimeSec: completedBeat.endTimeSec,
      runLookaheadCycle: () => runCycle(session, fixture, completedCycleCount + 1, nominalDtSec) });
    const measurements = measure({ terminalTrace, completedBeat, ...timing, timingAndInletObserver: observeTiming });
    const applicability = Object.freeze({ respiratory,
      bodySurfaceAreaM2: measurements.cardiacSizeAndFunction.bodySurfaceAreaM2,
      requestedHeartRateBpm: candidateInputs.hemodynamicResearchInputs.heartRateBpm,
      observedHeartRateBpm: 60 / completedBeat.durationSec });
    if (applicability.bodySurfaceAreaM2 !== 1.9 || !Number.isFinite(applicability.observedHeartRateBpm)
      || Math.abs(applicability.observedHeartRateBpm - applicability.requestedHeartRateBpm) >= 1e-7) {
      throw new Error("Resting reference qualification requires BSA1.9 and the requested beat heart rate");
    }
    const checks = buildChecks(measurements, true);
    const rest = assessRest(completedBeat, checks, measurements.cardiacSizeAndFunction.bodySurfaceAreaM2);
    return {
      evaluatorId, modelId, status: "accepted" as const, requestIdentitySha256, policyIdentitySha256,
      candidateInputs, nominalDtSec, initializationKind: initialization.kind,
      initialization: identity.initialization,
      executionPath: "standard72-selected-output-projection" as const,
      completedCycleCount, classification, rest, checks, checkpoint,
      ...(retainTerminalDiagnostics ? { diagnostics: {
        completedBeat, terminalTrace, ...timing, periodicObservations: observations, cycleEvidence, applicability,
        invariantPolicyId: numericalPolicy.policyId,
        allOffAndOwnerClocksCheckedEveryStep: true as const,
      } } : {}),
      qualification: { scope: "periodic-rest-assessment" as const, restStatus: rest.status,
        pairedGridPressureRateAndTau: "not-evaluated" as const, preloadReserve: "not-evaluated" as const,
        postFitEnvelopeQualified: false as const, clinicalValidationClaimed: false as const,
        publicBaselinePromotionAuthorized: false as const },
      wallTimeMs: performance.now() - startedAt,
    };
  } catch (error) {
    return fail(phase === "request-validation" || phase === "initialization" ? "invalid-or-physical"
      : phase === "observation" ? "nonsettled-or-event-change" : "numerical-unresolved",
    error instanceof Error ? error.message : String(error));
  }
}

export async function buildMainWireStandard72FittingPolicyIdentityV1() {
  return sha256CanonicalJsonHex({ evaluatorId, periodicPolicy, scales, numericalPolicy, restPolicy, referenceProfile,
    observationBounds, rightHeartBounds, gateRoles: gateEvidence.checkGroups,
    executionPath: "standard72-selected-output-projection", hotPathIntegrityTier: "hot-path-lean",
    analysisSchedule: "explicit-2ms-or-1ms-with-same-grid-lookahead-and-conservation-v1",
    observationMethodId: MAIN_WIRE_BASELINE_OBSERVATION_V2_ID, gateRolesId: MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID });
}

export type MainWireStandard72BaselineCalibrationEvaluationV1 = Awaited<ReturnType<typeof evaluateMainWireStandard72BaselineCalibrationCandidateV1>>;
export type MainWireStandard72AcceptedCalibrationEvaluationV1 = Extract<MainWireStandard72BaselineCalibrationEvaluationV1, { status: "accepted" }>;

function ownCandidate(value: Candidate): Candidate {
  const candidate = Object.freeze({ hemodynamicResearchInputs: ownHemodynamics(value.hemodynamicResearchInputs),
    ventricularContractilityScale: value.ventricularContractilityScale, mechanismResearchInputs: ownMechanism(value.mechanismResearchInputs) });
  if (![60, 70].includes(candidate.hemodynamicResearchInputs.heartRateBpm)
    || candidate.hemodynamicResearchInputs.peepCmH2O !== 0
    || !(candidate.ventricularContractilityScale > 0) || !Number.isFinite(candidate.ventricularContractilityScale)) {
    throw new Error("Resting fitting requires HR60 or70, zero PEEP and positive finite contractility");
  }
  const selected = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
  for (const key of ["valveAreas", "pericardium", "coronaryDisease", "oxygenTransport"] as const) {
    if (canonicalJsonStringify(candidate.mechanismResearchInputs[key]) !== canonicalJsonStringify(selected.mechanismResearchInputs[key])) {
      throw new Error(`Resting fitting does not qualify changed ${key}`);
    }
  }
  createFixture(candidate.hemodynamicResearchInputs, candidate.ventricularContractilityScale, candidate.mechanismResearchInputs);
  return candidate;
}

export { runCycle as collectMainWireStandard72FittingCycleV1 };

function runCycle(session: Session, fixture: ReturnType<typeof createFixture>, cycleIndex: number,
  nominalDtSec: MainWireStandard72FittingNominalDtV1 = .002): readonly FittingSample[] {
  if (nominalDtSec !== .002 && nominalDtSec !== .001) throw new Error("Unsupported fitting step");
  let accepted = session.currentAcceptedState();
  const startTime = accepted.acceptedTimeSec;
  const window = accepted.coronary.coronaryAutoregulation;
  const windowPolicy = accepted.coronary.coronaryAutoregulationBinding.windowPolicy;
  const endTime = windowPolicy.originAcceptedTimeSec + (window.windowIndex + 1) * windowPolicy.durationSec;
  const samples: FittingSample[] = [];
  const coronaryVolume = (state: ReturnType<Session["currentAcceptedState"]>) =>
    CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.reduce((sum, id) => sum + state.coronary.coronary.volumeMlByNode[id], 0);
  let gridIndex = 1;
  while (accepted.acceptedTimeSec < endTime) {
    if (samples.length >= numericalPolicy.maximumAcceptedStepCountPerRun) throw new Error("Candidate cycle exceeded accepted-step bound");
    const gridTime = Math.min(endTime, startTime + gridIndex * nominalDtSec);
    const target = limitTime(accepted, gridTime, { configuration: fixture.rhythm.configuration, externalAfNextBoundaryTimeSec: null }, fixture.profile, fixture.config).candidateTimeSec;
    const dt = target - accepted.acceptedTimeSec;
    if (!(dt > 0)) throw new Error("Candidate accepted clock failed to advance");
    const projected = session.advanceToPresentationTimeWithSelectedOutputProjectionV1(target, observedOutputIds);
    const advance = projected.advance;
    if (advance.status !== "advanced" || advance.internalAcceptedSubstepCount !== 1 || projected.projectedValues === null) {
      throw new Error(`Candidate trace requires every accepted exact step: ${advance.status}`);
    }
    const observation = session.observe();
    const next = observation.acceptedState;
    const event = observation.lastAcceptedStep?.composedRhythmCandidate;
    if (event === undefined && (next.composedRhythm.acceptedAtrialCaptureCount !== accepted.composedRhythm.acceptedAtrialCaptureCount
      || next.composedRhythm.acceptedVentricularCaptureCount !== accepted.composedRhythm.acceptedVentricularCaptureCount)) {
      throw new Error("Candidate trace lost an exact capture event");
    }
    if (Object.values(next.dynamicMechanicalSupport.acceptedFlowMlPerSec).some(x => !Number.isFinite(x) || x !== 0)) throw new Error("Candidate requires unassisted flow");
    const read = (id: MainWireIntegratedModelOutputIdV3) => {
      const value = projected.projectedValues![id];
      if (value.availability !== "available" || typeof value.value !== "number" || !Number.isFinite(value.value)) throw new Error(`Candidate observation unavailable: ${id}`);
      return value.value;
    };
    const volume = next.coronary.circulation.nodeVolumesMl;
    const coronaryMl = coronaryVolume(next);
    const globalVolumeErrorMl = Math.abs(NON_CORONARY_NODE_NAMES_V1.reduce((sum, id) => sum + volume[id], 0)
      + coronaryMl - next.coronary.fixedGlobalTotalBloodVolumeMl);
    const coronaryLedgerErrorMl = Math.abs(coronaryMl - coronaryVolume(accepted)
      - dt * (read("coronary.flow.total") - read("coronary.flow.venous-outlet")));
    const tolerance = numericalPolicy.invariantTolerance;
    if (Math.abs(next.coronary.fixedGlobalTotalBloodVolumeMl - fixture.cold.acceptedState.coronary.fixedGlobalTotalBloodVolumeMl) > tolerance.globalTotalBloodVolumeErrorMl
      || !Number.isFinite(globalVolumeErrorMl) || globalVolumeErrorMl > tolerance.globalTotalBloodVolumeErrorMl
      || !Number.isFinite(coronaryLedgerErrorMl) || coronaryLedgerErrorMl > tolerance.coronaryBloodVolumeLedgerResidualMl) {
      throw new Error("Accepted candidate violates global or coronary volume conservation");
    }
    if ([next.coronary.acceptedTimeSec, next.coronary.circulation.acceptedTimeSec, next.coronary.coronary.acceptedTimeSec,
      next.coronary.mechanics.acceptedTimeSec, next.composedRhythm.acceptedTimeSec].some(t =>
      !Number.isFinite(t) || Math.abs(t - next.acceptedTimeSec) > tolerance.acceptedOwnerClockSkewSec)) {
      throw new Error("Accepted candidate owner clocks disagree");
    }
    const sample: FittingSample = { cycleIndex, acceptedStepIndexWithinCycle: samples.length + 1,
      numerical: { globalVolumeErrorMl, coronaryLedgerErrorMl },
      acceptedTimeSec: next.acceptedTimeSec, acceptedDtSec: dt, cyclePhase01: (next.acceptedTimeSec - startTime) / fixture.cycleLengthSec,
      chamberVolumeMl: { LA: volume.LA, LV: volume.LV, RA: volume.RA, RV: volume.RV },
      absolutePressureMmHg: { LA: read("hemodynamics.pressure.absolute.LA"), LV: read("hemodynamics.pressure.absolute.LV"),
        RA: read("hemodynamics.pressure.absolute.RA"), RV: read("hemodynamics.pressure.absolute.RV"),
        Ao: read("hemodynamics.pressure.absolute.Ao"), PA: read("hemodynamics.pressure.absolute.PA"), PVein: read("hemodynamics.pressure.absolute.PVein") },
      transmuralPressureMmHg: { LV: read("hemodynamics.pressure.transmural.LV"), RV: read("hemodynamics.pressure.transmural.RV") },
      valveFlowMlPerSec: { MV: read("hemodynamics.flow.valve.MV"), AoV: read("hemodynamics.flow.valve.AoV"),
        TV: read("hemodynamics.flow.valve.TV"), PV: read("hemodynamics.flow.valve.PV") },
      acceptedEventIdentity: { atrialCapturedActivationId: event?.capturedAtrialActivation?.capturedActivationId ?? null,
        ventricularCapturedActivationId: event?.capturedVentricularActivation?.capturedActivationId ?? null,
        deliveredCalciumDepositIds: event?.deliveredCalciumDeposits.map(d => d.depositId) ?? [],
        scheduledCalciumDepositIds: event?.scheduledCalciumDeposits.map(d => d.depositId) ?? [] },
    };
    if (!Object.values(sample.chamberVolumeMl).every(Number.isFinite)) throw new Error("Candidate volume observation is nonfinite");
    samples.push(sample);
    accepted = next;
    if (Math.abs(accepted.acceptedTimeSec - gridTime) <= 1e-14) gridIndex++;
  }
  return Object.freeze(samples);
}
