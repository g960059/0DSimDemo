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
import { assessMainWireProspectiveRestV1 as assessRest,
  MAIN_WIRE_PROSPECTIVE_BASELINE_ADMISSION_V1 as restPolicy } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineAdmissionV1";
import { MAIN_WIRE_RESTING_REFERENCE_PROFILE_V1 as referenceProfile } from "@/analysis/registry/MainWireRestingReferenceProfileV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3 as ownHemodynamics } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import { validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3 as ownMechanism } from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import type { MainWireBaselineCalibrationCandidateInputsV1 as Candidate } from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

export const MAIN_WIRE_STANDARD72_BASELINE_CALIBRATION_EVALUATOR_V1_ID = "main-wire-standard72-baseline-calibration-evaluator-v1";
const evaluatorId = MAIN_WIRE_STANDARD72_BASELINE_CALIBRATION_EVALUATOR_V1_ID;
const observedOutputIds: readonly MainWireIntegratedModelOutputIdV3[] = [
  ...(["LA", "LV", "RA", "RV", "Ao", "PA", "PVein"] as const).map(id => `hemodynamics.pressure.absolute.${id}` as const),
  ...(["LV", "RV"] as const).map(id => `hemodynamics.pressure.transmural.${id}` as const),
  ...(["MV", "AoV", "TV", "PV"] as const).map(id => `hemodynamics.flow.valve.${id}` as const),
];
const classifierOptions = Object.freeze({
  period1NormalizedTolerance: periodicPolicy.period1NormalizedTolerance,
  period2NormalizedTolerance: periodicPolicy.period2NormalizedTolerance,
  period2MinimumPeriod1NormalizedDelta: periodicPolicy.period2MinimumPeriod1NormalizedDelta,
  consecutiveCycles: periodicPolicy.consecutiveCycles,
});

export type MainWireStandard72FittingInitializationV1 =
  | Readonly<{ kind: "cold" }>
  | Readonly<{ kind: "standard72-exact-checkpoint"; checkpoint: Checkpoint }>
  | Readonly<{ kind: "standard72-parameter-continuation"; checkpoint: Checkpoint; sourceCandidateInputs: Candidate }>;
export type MainWireStandard72BaselineCalibrationRequestV1 = Readonly<{
  candidateInputs?: Candidate;
  initialization?: MainWireStandard72FittingInitializationV1;
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
  let phase = "request-validation";
  let requestIdentitySha256: string | null = null;
  const fail = (status: "invalid-or-physical" | "numerical-unresolved" | "nonsettled-or-event-change" | "operational-interrupted", message: string) => ({
    evaluatorId, modelId, status, phase, requestIdentitySha256, message, wallTimeMs: performance.now() - startedAt,
  });
  try {
    if (request.abortSignal?.aborted) return fail("operational-interrupted", "Evaluation interrupted");
    const candidateInputs = ownCandidate(request.candidateInputs
      ?? resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs);
    if (hotPathIntegrityTierV1() !== "hot-path-lean") throw new Error("Standard72 fitting requires the admitted hot-path-lean entry point");
    // Own before the first asynchronous digest; caller mutations cannot alter execution.
    const initialization = cloneAndFreezeCanonicalJson(request.initialization ?? { kind: "cold" }) as MainWireStandard72FittingInitializationV1;
    if (!["cold", "standard72-exact-checkpoint", "standard72-parameter-continuation"].includes(initialization.kind)) {
      throw new Error("Standard72 fitting initialization is unregistered");
    }
    const policyIdentitySha256 = await buildMainWireStandard72FittingPolicyIdentityV1();
    const identity = { evaluatorId, modelId, exactIdentity, candidateInputs, nominalDtSec: .002,
      policyIdentitySha256, initialization: initialization.kind === "cold" ? initialization : {
        kind: initialization.kind, checkpointSha256: initialization.checkpoint.checkpointSha256,
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
    phase = "exact-execution";
    // A saved launch can be between coronary boundaries; finish that partial cycle
    // before collecting the fresh full-state periodic closure chain.
    const initial = session.currentAcceptedState();
    if (initial.coronary.coronaryAutoregulation.acceptedDurationSec !== 0) runCycle(session, fixture, 0);
    const boundaries = [session.currentAcceptedState()];
    const observations: CycleObservation[] = [];
    let classification = classify(observations, classifierOptions);
    let terminalTrace: readonly Sample[] = [];
    let completedCycleCount = 0;
    for (let cycleIndex = 1; cycleIndex <= periodicPolicy.maximumCycleCount; cycleIndex++) {
      if (request.abortSignal?.aborted) return fail("operational-interrupted", "Evaluation interrupted");
      terminalTrace = runCycle(session, fixture, cycleIndex);
      const accepted = session.currentAcceptedState();
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
    if (completedBeat === null) throw new Error("Candidate produced no complete beat");
    // Capture first; the real lookahead cannot replace the reusable qualified boundary.
    const timing = completeTiming({ terminalTrace, completedBeatEndTimeSec: completedBeat.endTimeSec,
      runLookaheadCycle: () => runCycle(session, fixture, completedCycleCount + 1) });
    const measurements = measure({ terminalTrace, completedBeat, ...timing, timingAndInletObserver: observeTiming });
    const checks = buildChecks(measurements, true);
    const rest = assessRest(completedBeat, checks, measurements.cardiacSizeAndFunction.bodySurfaceAreaM2);
    return {
      evaluatorId, modelId, status: "accepted" as const, requestIdentitySha256, policyIdentitySha256,
      candidateInputs, nominalDtSec: .002 as const, initializationKind: initialization.kind,
      executionPath: "standard72-selected-output-projection" as const,
      completedCycleCount, classification, rest, checks, checkpoint,
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
    executionPath: "standard72-selected-output-projection", hotPathIntegrityTier: "hot-path-lean",
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

function runCycle(session: Session, fixture: ReturnType<typeof createFixture>, cycleIndex: number): readonly Sample[] {
  let accepted = session.currentAcceptedState();
  const startTime = accepted.acceptedTimeSec;
  const window = accepted.coronary.coronaryAutoregulation;
  const windowPolicy = accepted.coronary.coronaryAutoregulationBinding.windowPolicy;
  const endTime = windowPolicy.originAcceptedTimeSec + (window.windowIndex + 1) * windowPolicy.durationSec;
  const samples: Sample[] = [];
  let gridIndex = 1;
  while (accepted.acceptedTimeSec < endTime) {
    if (samples.length >= numericalPolicy.maximumAcceptedStepCountPerRun) throw new Error("Candidate cycle exceeded accepted-step bound");
    const gridTime = Math.min(endTime, startTime + gridIndex * .002);
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
    const sample: Sample = { cycleIndex, acceptedStepIndexWithinCycle: samples.length + 1,
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
