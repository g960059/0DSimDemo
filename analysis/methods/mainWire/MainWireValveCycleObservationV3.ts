import { validateObservationInputV2 as validate, transitionsV2 as transitions,
  resolvedPhasePeakV2 as peak, sameTimeV2 as sameTime,
  MainWireBaselineObservationUnavailableErrorV2 as ObservationError,
  type MainWireBaselineObservationUnavailableCodeV2 as Code,
  type MainWireBaselineObservationTraceSampleV2 as Sample,
  type MainWireBaselineObservationBeatV2 as Beat,
  type MainWireBaselineVentricularObservationV2 as SideObservation } from "./MainWireBaselineObservationV2";

export const MAIN_WIRE_VALVE_CYCLE_OBSERVATION_V3_ID = "main-wire-valve-cycle-observation-v3";
type Side = "left" | "right";
export type MainWireValveCycleIssueV3 = Readonly<{ side: Side; code: Code | "non-isovolumic-valve-flow" | "pre-ejection-inlet-reopening"; message: string }>;
class TransportError extends Error {}
type Timing = Pick<SideObservation, "timing" | "events"> & Readonly<{
  inletClosureSelection: Readonly<{
    basis: "last-observed-inlet-closure-before-single-ejection";
    nativeFirstClosureTimeSec: number;
    selectedClosureTimeSec: number;
    displacementSec: number;
    reopeningEpisodes: readonly Readonly<{ openingTimeSec: number; closureTimeSec: number;
      forwardDurationSec: number; forwardVolumeMl: number; peakFlowMlPerSec: number }>[];
  }>;
}>;
type SideResult = Readonly<{ timing: Timing | null; timingIssue: MainWireValveCycleIssueV3 | null;
  inletFlow: SideObservation["inletFlow"] | null; inletFlowIssue: MainWireValveCycleIssueV3 | null }>;

/** Research-only hydraulic event observation. V2 remains pinned and unchanged.
 * A pre-ejection reopening is measured, never filtered away. ICT starts at the
 * LAST inlet closure, so its interval contains no valve transport. This does
 * not relabel the exact model's FIRST-closure EDV/pressure/EF or its checkpoint.
 * The following A peak still ends at the first observed post-capture closure;
 * no unobserved next ejection, waveform seam or clinical Doppler is invented.
 */
export function observeMainWireValveCycleV3(input: Readonly<{ samples: readonly Sample[]; completedBeat: Beat }>) {
  const { samples, completedBeat: beat } = input;
  validate(samples, beat); // Shared malformed data invalidate the observation, not merely one side.
  for (const valve of ["AoV", "PV"] as const) {
    const duration = beat.valveForwardPressureGradients[valve].forwardFlowDurationSec;
    if (!Number.isFinite(duration) || duration < 0)
      throw new ObservationError("invalid-completed-beat", null, "Native forward-flow durations must be finite and nonnegative.");
  }
  const left = observeSide(samples, beat, "left"), right = observeSide(samples, beat, "right");
  const reviewIssues: MainWireValveCycleIssueV3[] = [];
  for (const [side, result] of [["left", left], ["right", right]] as const) {
    if (result.timingIssue) reviewIssues.push(result.timingIssue);
    if (result.timing?.inletClosureSelection.reopeningEpisodes.length) reviewIssues.push({ side,
      code: "pre-ejection-inlet-reopening", message: "Inlet reflow precedes ejection; last-closure timing is measurable, but event topology needs waveform/grid review." });
  }
  return { methodId: MAIN_WIRE_VALVE_CYCLE_OBSERVATION_V3_ID, left, right, reviewIssues,
    nativeVolumeLandmarksReplaced: false as const, publicPromotionAuthorized: false as const };
}

function issue(error: unknown, side: Side): MainWireValveCycleIssueV3 {
  if (error instanceof TransportError) return { side, code: "non-isovolumic-valve-flow", message: error.message };
  if (!(error instanceof ObservationError) || error.side !== side) throw error;
  return { side, code: error.code, message: error.message };
}
function fail(code: Code, side: Side, message: string): never { throw new ObservationError(code, side, message); }

function observeSide(samples: readonly Sample[], beat: Beat, side: Side): SideResult {
  let timing: Timing;
  try { timing = observeTiming(samples, beat, side); }
  catch (error) { return { timing: null, timingIssue: issue(error, side), inletFlow: null, inletFlowIssue: null }; }
  try {
    const inlet = side === "left" ? "MV" : "TV";
    const early = peak(samples, inlet, timing.events.inletOpeningTimeSec, beat.endTimeSec, side, "e");
    const atrial = peak(samples, inlet, beat.endTimeSec, timing.events.nextInletClosureTimeSec, side, "a");
    return { timing, timingIssue: null, inletFlowIssue: null, inletFlow: {
      basis: "atrial-capture-anchored-native-volumetric-flow", peakEMlPerSec: early.flow,
      peakAMlPerSec: atrial.flow, peakEToA: early.flow / atrial.flow, peakETimeSec: early.timeSec, peakATimeSec: atrial.timeSec } };
  } catch (error) { return { timing, timingIssue: null, inletFlow: null, inletFlowIssue: issue(error, side) }; }
}

function observeTiming(samples: readonly Sample[], beat: Beat, side: Side): Timing {
  const inlet = side === "left" ? "MV" : "TV", outlet = side === "left" ? "AoV" : "PV";
  const native = side === "left" ? beat.leftVentricularValveEventMetrics : beat.rightVentricularValveEventMetrics;
  const ed = native.endDiastolic, es = native.endSystolic;
  if (!ed || !es || native.inletValveId !== inlet || native.semilunarValveId !== outlet
    || ed.valveId !== inlet || es.valveId !== outlet || ed.event !== "valve-closure-zero-flow-crossing"
    || es.event !== "valve-closure-zero-flow-crossing" || ![ed.timeSec, es.timeSec].every(Number.isFinite)
    || !(beat.startTimeSec <= ed.timeSec && ed.timeSec < es.timeSec && es.timeSec < beat.endTimeSec))
    fail("missing-valve-landmark", side, "Ordered native inlet/outlet closures are required.");
  const inletTransitions = transitions(samples, inlet);
  const firstClosure = inletTransitions.find(t => t.kind === "closure" && t.timeSec >= beat.startTimeSec);
  if (!firstClosure || !sameTime(firstClosure.timeSec, ed.timeSec))
    fail("missing-valve-landmark", side, "The native first inlet closure must match the first actual closure in this beat.");
  const outletTransitions = transitions(samples, outlet).filter(t => t.timeSec >= beat.startTimeSec && t.timeSec <= beat.endTimeSec);
  if (outletTransitions.length !== 2 || outletTransitions[0]!.kind !== "opening" || outletTransitions[1]!.kind !== "closure"
    || !sameTime(outletTransitions[1]!.timeSec, es.timeSec)
    || !(ed.timeSec <= outletTransitions[0]!.timeSec || sameTime(ed.timeSec, outletTransitions[0]!.timeSec)))
    fail("incomplete-ejection", side, "One complete forward ejection must match the native outlet closure.");
  const outOpen = outletTransitions[0]!.timeSec, outClose = outletTransitions[1]!.timeSec, et = outClose - outOpen;
  if (!(et > 0) || !sameTime(et, beat.valveForwardPressureGradients[outlet].forwardFlowDurationSec))
    fail("inconsistent-ejection-duration", side, "Single-episode ET differs from native total forward-flow duration.");
  if (transport(samples, inlet, outOpen, outClose).absoluteVolumeMl > 0)
    fail("overlapping-valve-flow", side, "Inlet transport overlaps the actual outlet ejection interval.");
  const closure = inletTransitions.filter(t => t.kind === "closure" && t.timeSec <= outOpen).at(-1)!;
  if (!closure || closure.timeSec < ed.timeSec && !sameTime(closure.timeSec, ed.timeSec))
    fail("missing-valve-landmark", side, "No final inlet closure was observed before ejection.");
  const opening = inletTransitions.find(t => t.kind === "opening" && t.timeSec >= outClose);
  const nextClosure = inletTransitions.find(t => t.kind === "closure" && t.timeSec > beat.endTimeSec);
  if (!opening || !nextClosure || !(opening.timeSec < beat.endTimeSec))
    fail("incomplete-filling-phase", side, "Early filling and the following post-capture inlet closure must be observed.");
  const captures = samples.filter(s => s.acceptedTimeSec > opening.timeSec && s.acceptedTimeSec < nextClosure.timeSec
    && s.acceptedEventIdentity.atrialCapturedActivationId !== null);
  if (captures.length !== 1 || captures[0]!.acceptedEventIdentity.atrialCapturedActivationId !== beat.endAtrialCaptureId)
    fail("missing-atrial-capture", side, "Filling must contain exactly the expected atrial capture.");
  for (const [from, to] of [[closure.timeSec, outOpen], [outClose, opening.timeSec]] as const)
    for (const valve of [inlet, outlet] as const) if (transport(samples, valve, from, to).absoluteVolumeMl > 0)
      throw new TransportError("A nominally isovolumic interval contains forward or reverse valve transport.");
  const recurrent = inletTransitions.filter(t => t.timeSec > ed.timeSec && !sameTime(t.timeSec, ed.timeSec) && t.timeSec <= closure.timeSec);
  const episodes: Timing["inletClosureSelection"]["reopeningEpisodes"][number][] = [];
  for (let i = 0; i < recurrent.length; i += 2) {
    const a = recurrent[i]!, b = recurrent[i + 1];
    if (a.kind !== "opening" || !b || b.kind !== "closure")
      fail("missing-valve-landmark", side, "Pre-ejection inlet reflow is not a complete observed episode.");
    const flow = transport(samples, inlet, a.timeSec, b.timeSec);
    episodes.push({ openingTimeSec: a.timeSec, closureTimeSec: b.timeSec,
      forwardDurationSec: b.timeSec - a.timeSec, forwardVolumeMl: flow.forwardVolumeMl, peakFlowMlPerSec: flow.peakFlowMlPerSec });
  }
  const ictSec = outOpen - closure.timeSec, irtSec = opening.timeSec - outClose;
  return { timing: { ictSec, irtSec, ejectionTimeSec: et, teiIndex: (ictSec + irtSec) / et },
    events: { inletClosureTimeSec: closure.timeSec, outletOpeningTimeSec: outOpen, outletClosureTimeSec: outClose,
      inletOpeningTimeSec: opening.timeSec, atrialCaptureTimeSec: beat.endTimeSec, atrialCaptureId: beat.endAtrialCaptureId,
      nextInletClosureTimeSec: nextClosure.timeSec },
    inletClosureSelection: { basis: "last-observed-inlet-closure-before-single-ejection",
      nativeFirstClosureTimeSec: ed.timeSec, selectedClosureTimeSec: closure.timeSec,
      displacementSec: closure.timeSec - ed.timeSec, reopeningEpisodes: episodes } };
}

/** Piecewise-linear transport, split at zero, not a right-endpoint rectangle.
 * Any positive support counts: there is deliberately no small-flow cutoff. */
function transport(samples: readonly Sample[], valve: "MV" | "AoV" | "TV" | "PV", from: number, to: number) {
  let forwardVolumeMl = 0, absoluteVolumeMl = 0, peakFlowMlPerSec = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1]!, b = samples[i]!, lo = Math.max(from, a.acceptedTimeSec), hi = Math.min(to, b.acceptedTimeSec);
    if (!(hi > lo)) continue;
    const at = (t: number) => a.valveFlowMlPerSec[valve] + (b.valveFlowMlPerSec[valve] - a.valveFlowMlPerSec[valve])
      * (t - a.acceptedTimeSec) / (b.acceptedTimeSec - a.acceptedTimeSec);
    const q0 = at(lo), q1 = at(hi), dt = hi - lo;
    const positiveArea = q0 >= 0 && q1 >= 0 ? (q0 + q1) * dt / 2 : q0 <= 0 && q1 <= 0 ? 0
      : Math.max(q0, q1) ** 2 / Math.abs(q1 - q0) * dt / 2;
    forwardVolumeMl += positiveArea;
    absoluteVolumeMl += 2 * positiveArea - (q0 + q1) * dt / 2;
    peakFlowMlPerSec = Math.max(peakFlowMlPerSec, q0, q1);
  }
  return { forwardVolumeMl, absoluteVolumeMl, peakFlowMlPerSec };
}
