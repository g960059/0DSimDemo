import type { MainWireIntegratedTypedAuthoritySessionV1 as Session } from "@/engine/vnext/MainWireIntegratedTypedAuthoritySessionV1";
import type { createMainWireIntegratedModelStandard71FixtureV1 as createFixture } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3 as numericalPolicy,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 as periodicPolicy } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3 as scales } from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import { compareMainWireIntegratedModelAcceptedStatesV3 as compareStates } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import { classifyMainWireIntegratedModelPeriodicityV3 as classify,
  type MainWireIntegratedModelPeriodicCycleObservationV3 as CycleObservation } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import { limitMainWireIntegratedModelCandidateTimeV3 as limitTime } from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import type { MainWireIntegratedModelHemodynamicTraceSampleV3 as Sample } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type { MainWireIntegratedModelOutputIdV3 } from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import { completeMainWireStandard70TimingAndInletTraceV1 as completeTiming } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { NON_CORONARY_NODE_NAMES_V1 } from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import { CORONARY_CONSERVED_VOLUME_NODE_IDS_V2 } from "@/engine/coronary/typesV2";

export type MainWireFittingNominalDtV1 = .002 | .001;
export const MAIN_WIRE_FITTING_OBSERVATION_WINDOW_V1_ID = "main-wire-fitting-observed-native-beat-prefix-and-real-lookahead-v1";
type FittingSample = Sample & Readonly<{ numerical: Readonly<{
  globalVolumeErrorMl: number; coronaryLedgerErrorMl: number;
}> }>;
const observedOutputIds: readonly MainWireIntegratedModelOutputIdV3[] = [
  ...(["LA", "LV", "RA", "RV", "Ao", "PA", "PVein"] as const).map(id => `hemodynamics.pressure.absolute.${id}` as const),
  ...(["LV", "RV"] as const).map(id => `hemodynamics.pressure.transmural.${id}` as const),
  ...(["MV", "AoV", "TV", "PV"] as const).map(id => `hemodynamics.flow.valve.${id}` as const),
  "coronary.flow.total", "coronary.flow.venous-outlet",
];

/** Same accepted-step observation and closure policy for normal and disease
 * references. This layer never judges whether the physiology is normal. */
export async function settleMainWireFittingSessionV1<T>(request: Readonly<{
  session: Parameters<typeof collectMainWireFittingCycleV1>[0];
  fixture: Parameters<typeof collectMainWireFittingCycleV1>[1];
  checkpoint: () => Promise<T>;
  requestIdentitySha256: string;
  nominalDtSec: MainWireFittingNominalDtV1;
  abortSignal?: AbortSignal;
  onPhase?: (phase: "exact-execution" | "periodic-classification" | "observation") => void;
}>) {
  const { session, fixture, nominalDtSec, abortSignal, requestIdentitySha256 } = request;
  const initial = session.currentAcceptedState();
  request.onPhase?.("exact-execution");
  if (abortSignal?.aborted) return { status: "operational-interrupted" as const, message: "Evaluation interrupted" };
  if (initial.coronary.coronaryAutoregulation.acceptedDurationSec !== 0)
    collectMainWireFittingCycleV1(session, fixture, 0, nominalDtSec);
  const boundaries = [session.currentAcceptedState()];
  const observations: CycleObservation[] = [];
  let classification = classify(observations, periodicPolicy);
  let terminalTrace: readonly FittingSample[] = [];
  let previousTrace: readonly FittingSample[] = [];
  const cycleEvidence: { cycleIndex: number; acceptedStepCount: number;
    atrialCaptureCount: number; ventricularCaptureCount: number;
    maximumGlobalVolumeErrorMl: number; maximumCoronaryLedgerErrorMl: number }[] = [];
  let completedCycleCount = 0;
  for (let cycleIndex = 1; cycleIndex <= periodicPolicy.maximumCycleCount; cycleIndex++) {
    if (abortSignal?.aborted) return { status: "operational-interrupted" as const, message: "Evaluation interrupted" };
    previousTrace = terminalTrace;
    terminalTrace = collectMainWireFittingCycleV1(session, fixture, cycleIndex, nominalDtSec);
    const accepted = session.currentAcceptedState(), previous = boundaries.at(-1)!;
    const evidence = { cycleIndex, acceptedStepCount: terminalTrace.length,
      atrialCaptureCount: accepted.composedRhythm.acceptedAtrialCaptureCount - previous.composedRhythm.acceptedAtrialCaptureCount,
      ventricularCaptureCount: accepted.composedRhythm.acceptedVentricularCaptureCount - previous.composedRhythm.acceptedVentricularCaptureCount,
      maximumGlobalVolumeErrorMl: Math.max(...terminalTrace.map(s => s.numerical.globalVolumeErrorMl)),
      maximumCoronaryLedgerErrorMl: Math.max(...terminalTrace.map(s => s.numerical.coronaryLedgerErrorMl)) };
    if (evidence.atrialCaptureCount !== 1 || evidence.ventricularCaptureCount !== 1)
      throw new Error("Resting fitting requires one sinus capture of each chamber per cycle");
    cycleEvidence.push(evidence);
    observations.push({ cycleIndex, evidenceRole: "canonical-periodic-protocol", protocolIdentityHash: requestIdentitySha256,
      period1: compareStates(accepted, previous, scales, fixture.config),
      period2: boundaries.length < 2 ? null : compareStates(accepted, boundaries.at(-2)!, scales, fixture.config) });
    classification = classify(observations, periodicPolicy);
    if (observations.length > periodicPolicy.consecutiveCycles) observations.shift();
    boundaries.push(accepted); if (boundaries.length > 3) boundaries.shift();
    completedCycleCount = cycleIndex;
    if (classification.status !== "not-converged") break;
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
  request.onPhase?.("periodic-classification");
  if (classification.status !== "period1-converged")
    return { status: "nonsettled-or-event-change" as const, message: classification.status };
  const checkpoint = await request.checkpoint();
  request.onPhase?.("observation");
  const completedBeat = session.observe().completedBeatMetrics;
  if (completedBeat === null || completedBeat.endTimeSec <= initial.acceptedTimeSec)
    throw new Error("Candidate produced no fresh complete beat");
  // Controller windows need not start at the atrial capture defining a beat.
  // Retain actual preceding endpoints so an early inlet reflow cannot hide
  // before terminalTrace. Keep terminalTrace's one-window statistics unchanged.
  const availableTrace = [...previousTrace, ...terminalTrace];
  const firstBeatIndex = availableTrace.findIndex(sample => sample.acceptedTimeSec >= completedBeat.startTimeSec);
  if (firstBeatIndex < 0 || availableTrace[0]!.acceptedTimeSec > completedBeat.startTimeSec
    || terminalTrace.at(-1)!.acceptedTimeSec < completedBeat.endTimeSec)
    throw new Error("Fitting observation must cover the entire actual completed beat");
  const timingAndInletPrecedingTrace = Object.freeze(previousTrace.slice(Math.max(0, firstBeatIndex - 1)));
  // The launch checkpoint precedes actual same-grid filling-phase lookahead.
  const timing = completeTiming({ terminalTrace, completedBeatEndTimeSec: completedBeat.endTimeSec,
    runLookaheadCycle: () => collectMainWireFittingCycleV1(session, fixture, completedCycleCount + 1, nominalDtSec) });
  return { status: "accepted" as const, completedCycleCount, classification, checkpoint,
    diagnostics: { completedBeat, terminalTrace, ...timing, timingAndInletPrecedingTrace,
      periodicObservations: observations, cycleEvidence,
      invariantPolicyId: numericalPolicy.policyId, allOffAndOwnerClocksCheckedEveryStep: true as const } };
}

export function collectMainWireFittingCycleV1(session: Pick<Session, "currentAcceptedState" | "advanceToPresentationTimeWithSelectedOutputProjectionV1" | "observe">,
  fixture: Pick<ReturnType<typeof createFixture>, "rhythm" | "profile" | "config" | "cycleLengthSec" | "cold">, cycleIndex: number,
  nominalDtSec: MainWireFittingNominalDtV1 = .002): readonly FittingSample[] {
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
