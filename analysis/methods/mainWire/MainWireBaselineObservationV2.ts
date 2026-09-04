import type {
  MainWireIntegratedModelCompletedBeatMetricsV3,
  MainWireIntegratedModelVentricularValveEventMetricsV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import type {
  MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

export const MAIN_WIRE_BASELINE_OBSERVATION_V2_ID =
  "main-wire-baseline-observation-v2" as const;

type SideV2 = "left" | "right";
type ValveV2 = "MV" | "AoV" | "TV" | "PV";
type ValveEventsV2 = Pick<MainWireIntegratedModelVentricularValveEventMetricsV3,
  "inletValveId" | "semilunarValveId" | "endDiastolic" | "endSystolic">;

export type MainWireBaselineObservationTraceSampleV2 = Readonly<
  Pick<MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
    "acceptedTimeSec" | "acceptedDtSec" | "valveFlowMlPerSec"> & {
    acceptedEventIdentity: Readonly<{ atrialCapturedActivationId: string | null }>;
  }
>;

export type MainWireBaselineObservationBeatV2 = Readonly<
  Pick<MainWireIntegratedModelCompletedBeatMetricsV3,
    "startTimeSec" | "endTimeSec" | "durationSec" | "endAtrialCaptureId"> & {
    leftVentricularValveEventMetrics: ValveEventsV2;
    rightVentricularValveEventMetrics: ValveEventsV2;
    valveForwardPressureGradients: Pick<
      MainWireIntegratedModelCompletedBeatMetricsV3["valveForwardPressureGradients"],
      "AoV" | "PV"
    >;
  }
>;

export type MainWireBaselineObservationUnavailableCodeV2 =
  | "invalid-trace"
  | "invalid-completed-beat"
  | "missing-valve-landmark"
  | "incomplete-ejection"
  | "inconsistent-ejection-duration"
  | "missing-atrial-capture"
  | "incomplete-filling-phase"
  | "overlapping-valve-flow"
  | "unresolved-e-wave"
  | "unresolved-a-wave";

export class MainWireBaselineObservationUnavailableErrorV2 extends Error {
  constructor(
    readonly code: MainWireBaselineObservationUnavailableCodeV2,
    readonly side: SideV2 | null,
    message: string,
  ) {
    super(`Baseline observation unavailable${side === null ? "" : ` (${side})`}: ${message}`);
    this.name = "MainWireBaselineObservationUnavailableErrorV2";
  }
}

export type MainWireBaselineVentricularObservationV2 = Readonly<{
  timing: Readonly<{
    ictSec: number;
    ejectionTimeSec: number;
    irtSec: number;
    teiIndex: number;
  }>;
  inletFlow: Readonly<{
    basis: "atrial-capture-anchored-native-volumetric-flow";
    peakEMlPerSec: number;
    peakAMlPerSec: number;
    peakEToA: number;
    peakETimeSec: number;
    peakATimeSec: number;
  }>;
  events: Readonly<{
    inletClosureTimeSec: number;
    outletOpeningTimeSec: number;
    outletClosureTimeSec: number;
    inletOpeningTimeSec: number;
    atrialCaptureTimeSec: number;
    atrialCaptureId: string;
    nextInletClosureTimeSec: number;
  }>;
}>;

export type MainWireBaselineObservationV2 = Readonly<{
  methodId: typeof MAIN_WIRE_BASELINE_OBSERVATION_V2_ID;
  timingBasis: "completed-beat-closures-and-observed-flow-zero-crossings";
  left: MainWireBaselineVentricularObservationV2;
  right: MainWireBaselineVentricularObservationV2;
}>;

/**
 * Analysis-only model observations, not Doppler or tissue-Doppler estimates.
 * The completed beat supplies its earlier inlet closure; the trace must bracket
 * ejection, early filling, the next accepted atrial capture, and its inlet
 * closure. No unobserved endpoint, next beat, or periodic seam is synthesized.
 * E/A compares resolved flow peaks before/after that actual capture; it is not
 * a velocity ratio. Diastasis may interrupt inlet flow between those phases.
 */
export function observeMainWireBaselineV2(input: Readonly<{
  samples: readonly MainWireBaselineObservationTraceSampleV2[];
  completedBeat: MainWireBaselineObservationBeatV2;
}>): MainWireBaselineObservationV2 {
  const { samples, completedBeat: beat } = input;
  validateTraceV2(samples);
  if (
    !Number.isFinite(beat.startTimeSec) || !Number.isFinite(beat.endTimeSec)
    || !(beat.durationSec > 0) || !Number.isFinite(beat.durationSec)
    || !sameTimeV2(beat.endTimeSec - beat.startTimeSec, beat.durationSec)
    || typeof beat.endAtrialCaptureId !== "string" || beat.endAtrialCaptureId.length === 0
  ) unavailableV2("invalid-completed-beat", null, "invalid beat clock or capture identity");
  const captures = samples.filter((sample) =>
    sample.acceptedEventIdentity.atrialCapturedActivationId === beat.endAtrialCaptureId);
  if (captures.length !== 1 || !sameTimeV2(captures[0]!.acceptedTimeSec, beat.endTimeSec)) {
    unavailableV2("missing-atrial-capture", null,
      "trace must contain the completed beat's ending capture at its accepted time");
  }
  const observe = (side: SideV2) => observeSideV2(samples, beat, side);
  return Object.freeze({
    methodId: MAIN_WIRE_BASELINE_OBSERVATION_V2_ID,
    timingBasis: "completed-beat-closures-and-observed-flow-zero-crossings" as const,
    left: observe("left"),
    right: observe("right"),
  });
}

type TransitionV2 = Readonly<{ timeSec: number; kind: "opening" | "closure" }>;

function observeSideV2(
  samples: readonly MainWireBaselineObservationTraceSampleV2[],
  beat: MainWireBaselineObservationBeatV2,
  side: SideV2,
): MainWireBaselineVentricularObservationV2 {
  const inlet: "MV" | "TV" = side === "left" ? "MV" : "TV";
  const outlet: "AoV" | "PV" = side === "left" ? "AoV" : "PV";
  const landmarks = side === "left"
    ? beat.leftVentricularValveEventMetrics : beat.rightVentricularValveEventMetrics;
  const ed = landmarks.endDiastolic;
  const es = landmarks.endSystolic;
  if (
    ed === null || es === null || landmarks.inletValveId !== inlet
    || landmarks.semilunarValveId !== outlet || ed.valveId !== inlet || es.valveId !== outlet
    || ed.event !== "valve-closure-zero-flow-crossing"
    || es.event !== "valve-closure-zero-flow-crossing"
    || !Number.isFinite(ed.timeSec) || !Number.isFinite(es.timeSec)
    || !(beat.startTimeSec <= ed.timeSec && ed.timeSec < es.timeSec && es.timeSec < beat.endTimeSec)
  ) unavailableV2("missing-valve-landmark", side, "ordered exact inlet/outlet closures are required");

  const outTransitions = transitionsV2(samples, outlet).filter(({ timeSec }) =>
    timeSec > ed.timeSec && (timeSec < es.timeSec || sameTimeV2(timeSec, es.timeSec)));
  if (
    outTransitions.length !== 2 || outTransitions[0]!.kind !== "opening"
    || outTransitions[1]!.kind !== "closure"
    || !sameTimeV2(outTransitions[1]!.timeSec, es.timeSec)
  ) unavailableV2("incomplete-ejection", side, "one fully observed ejection must end at the exact closure");
  const outletOpeningTimeSec = outTransitions[0]!.timeSec;
  const ejectionTimeSec = es.timeSec - outletOpeningTimeSec;
  const exactEt = beat.valveForwardPressureGradients[outlet].forwardFlowDurationSec;
  if (!(ejectionTimeSec > 0) || !sameTimeV2(exactEt, ejectionTimeSec)) {
    unavailableV2("inconsistent-ejection-duration", side,
      "single-episode ET differs from completed-beat total forward-flow duration");
  }
  const inTransitions = transitionsV2(samples, inlet);
  const opening = inTransitions.find(({ kind, timeSec }) =>
    kind === "opening" && timeSec > es.timeSec);
  const nextClosure = inTransitions.find(({ kind, timeSec }) =>
    kind === "closure" && timeSec > beat.endTimeSec);
  if (opening === undefined || nextClosure === undefined || !(opening.timeSec < beat.endTimeSec)) {
    unavailableV2("incomplete-filling-phase", side,
      "early filling and post-capture inlet closure must both be observed");
  }
  if (samples.some((sample) => sample.acceptedTimeSec > ed.timeSec
    && sample.acceptedTimeSec <= es.timeSec && sample.valveFlowMlPerSec[inlet] > 0)) {
    unavailableV2("overlapping-valve-flow", side, "inlet forward flow recurs before outlet closure");
  }
  const fillingCaptures = samples.filter((sample) =>
    sample.acceptedTimeSec > opening.timeSec && sample.acceptedTimeSec < nextClosure.timeSec
    && sample.acceptedEventIdentity.atrialCapturedActivationId !== null);
  if (fillingCaptures.length !== 1
    || fillingCaptures[0]!.acceptedEventIdentity.atrialCapturedActivationId !== beat.endAtrialCaptureId) {
    unavailableV2("missing-atrial-capture", side, "filling must contain exactly the expected atrial capture");
  }
  const early = resolvedPhasePeakV2(samples, inlet, opening.timeSec, beat.endTimeSec, side, "e");
  const atrial = resolvedPhasePeakV2(samples, inlet, beat.endTimeSec, nextClosure.timeSec, side, "a");
  const ictSec = outletOpeningTimeSec - ed.timeSec;
  const irtSec = opening.timeSec - es.timeSec;
  return Object.freeze({
    timing: Object.freeze({ ictSec, ejectionTimeSec, irtSec,
      teiIndex: (ictSec + irtSec) / ejectionTimeSec }),
    inletFlow: Object.freeze({
      basis: "atrial-capture-anchored-native-volumetric-flow" as const,
      peakEMlPerSec: early.flow,
      peakAMlPerSec: atrial.flow,
      peakEToA: early.flow / atrial.flow,
      peakETimeSec: early.timeSec,
      peakATimeSec: atrial.timeSec,
    }),
    events: Object.freeze({
      inletClosureTimeSec: ed.timeSec,
      outletOpeningTimeSec,
      outletClosureTimeSec: es.timeSec,
      inletOpeningTimeSec: opening.timeSec,
      atrialCaptureTimeSec: beat.endTimeSec,
      atrialCaptureId: beat.endAtrialCaptureId,
      nextInletClosureTimeSec: nextClosure.timeSec,
    }),
  });
}

function resolvedPhasePeakV2(
  samples: readonly MainWireBaselineObservationTraceSampleV2[],
  valve: ValveV2,
  from: number,
  to: number,
  side: SideV2,
  wave: "e" | "a",
) {
  const interior = samples.filter(({ acceptedTimeSec: time }) => time > from && time < to);
  const peak = interior.reduce<MainWireBaselineObservationTraceSampleV2 | undefined>(
    (best, sample) => best === undefined || sample.valveFlowMlPerSec[valve] > best.valveFlowMlPerSec[valve]
      ? sample : best,
    undefined,
  );
  if (peak === undefined || !(peak.valveFlowMlPerSec[valve] > Math.max(
    0, flowAtV2(samples, valve, from), flowAtV2(samples, valve, to),
  ))) unavailableV2(wave === "e" ? "unresolved-e-wave" : "unresolved-a-wave", side,
    `${wave.toUpperCase()} needs a positive interior peak above both phase boundaries; fused/truncated waves are unavailable`);
  return Object.freeze({ timeSec: peak.acceptedTimeSec, flow: peak.valveFlowMlPerSec[valve] });
}

function transitionsV2(samples: readonly MainWireBaselineObservationTraceSampleV2[], valve: ValveV2) {
  const result: TransitionV2[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]!;
    const next = samples[index]!;
    const left = previous.valveFlowMlPerSec[valve];
    const right = next.valveFlowMlPerSec[valve];
    if ((left > 0) === (right > 0)) continue;
    const fraction = left / (left - right);
    result.push(Object.freeze({
      timeSec: previous.acceptedTimeSec + fraction * (next.acceptedTimeSec - previous.acceptedTimeSec),
      kind: right > 0 ? "opening" as const : "closure" as const,
    }));
  }
  return result;
}

function flowAtV2(samples: readonly MainWireBaselineObservationTraceSampleV2[], valve: ValveV2, time: number) {
  const exact = samples.find((sample) => sameTimeV2(sample.acceptedTimeSec, time));
  if (exact !== undefined) return exact.valveFlowMlPerSec[valve];
  const upper = samples.findIndex((sample) => sample.acceptedTimeSec > time);
  if (upper < 1) unavailableV2("invalid-trace", null, "phase boundary is not bracketed by accepted samples");
  const previous = samples[upper - 1]!;
  const next = samples[upper]!;
  const fraction = (time - previous.acceptedTimeSec) / (next.acceptedTimeSec - previous.acceptedTimeSec);
  return previous.valveFlowMlPerSec[valve]
    + fraction * (next.valveFlowMlPerSec[valve] - previous.valveFlowMlPerSec[valve]);
}

function validateTraceV2(samples: readonly MainWireBaselineObservationTraceSampleV2[]) {
  if (samples.length < 3) unavailableV2("invalid-trace", null, "too few accepted samples");
  samples.forEach((sample, index) => {
    if (!Number.isFinite(sample.acceptedTimeSec) || !Number.isFinite(sample.acceptedDtSec)
      || !(sample.acceptedDtSec > 0)
      || (["MV", "AoV", "TV", "PV"] as const).some((valve) => !Number.isFinite(sample.valveFlowMlPerSec[valve]))
      || (sample.acceptedEventIdentity.atrialCapturedActivationId !== null
        && (typeof sample.acceptedEventIdentity.atrialCapturedActivationId !== "string"
          || sample.acceptedEventIdentity.atrialCapturedActivationId.length === 0))) {
      unavailableV2("invalid-trace", null, "nonfinite flow/time or invalid event identity");
    }
    if (index > 0) {
      const elapsed = sample.acceptedTimeSec - samples[index - 1]!.acceptedTimeSec;
      if (!(elapsed > 0) || !sameTimeV2(elapsed, sample.acceptedDtSec)) {
        unavailableV2("invalid-trace", null, "trace must contain contiguous increasing accepted endpoints");
      }
    }
  });
}

function sameTimeV2(left: number, right: number): boolean {
  return Number.isFinite(left) && Number.isFinite(right)
    && Math.abs(left - right) <= 128 * Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right));
}

function unavailableV2(code: MainWireBaselineObservationUnavailableCodeV2, side: SideV2 | null, message: string): never {
  throw new MainWireBaselineObservationUnavailableErrorV2(code, side, message);
}
