import {
  validateRetainedAcceptedIntervalWindowV1,
  type AcceptedIntervalOpenClosedEventV1,
  type RetainedAcceptedIntervalWindowV1,
} from "@/engine/myocardium/diagnostics/AcceptedIntervalTimebaseV1";
import type {
  MainWireNormalAdultFiveWallDiagnosticSampleV3,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV3";
import type {
  MainWireNormalAdultFiveWallAcceptedCalciumEventV1,
  MainWireNormalAdultFiveWallAcceptedDiagnosticIntervalV1,
  MainWireNormalAdultFiveWallPeriodicResultV3,
  MainWireNormalAdultFiveWallRetainedBeatV3,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_SELECTED_CYCLE_CONTEXT_V2_ID =
  "main-wire-normal-adult-five-wall-selected-cycle-context-v2" as const;

export type MainWireNormalAdultFiveWallAcceptedDiagnosticWindowV2 =
  RetainedAcceptedIntervalWindowV1<
    MainWireNormalAdultFiveWallDiagnosticSampleV3,
    MainWireNormalAdultFiveWallAcceptedCalciumEventV1
  >;

export type MainWireNormalAdultFiveWallSelectedCycleEventV2 =
  AcceptedIntervalOpenClosedEventV1<
    MainWireNormalAdultFiveWallAcceptedCalciumEventV1
  >;

type SelectedCycleCommon = Readonly<{
  contextId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_SELECTED_CYCLE_CONTEXT_V2_ID;
  beat: MainWireNormalAdultFiveWallRetainedBeatV3;
  beatIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  nominalGridCount: number;
  acceptedIntervalCount: number;
  minimumAcceptedDtSec: number;
  maximumAcceptedDtSec: number;
  acceptedEventCount: number;
  intervals: readonly MainWireNormalAdultFiveWallAcceptedDiagnosticIntervalV1[];
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV3[];
  acceptedEvents: readonly MainWireNormalAdultFiveWallSelectedCycleEventV2[];
}>;

export type MainWireNormalAdultFiveWallSelectedCycleContextV2 =
  | Readonly<SelectedCycleCommon & {
    status: "complete";
    precedingSampleStatus: "available";
    window: MainWireNormalAdultFiveWallAcceptedDiagnosticWindowV2;
  }>
  | Readonly<SelectedCycleCommon & {
    status: "missing-preceding-diagnostic";
    precedingSampleStatus: "missing-cold-start";
    reason: "cold-start";
    window: null;
  }>;

/**
 * Selects the final retained complete beat without inventing a diagnostic at
 * the cold accepted state. Raw endpoints remain available in both branches;
 * difference-based consumers must require `status === "complete"`.
 */
export function resolveMainWireNormalAdultFiveWallSelectedCycleContextV2(
  result: MainWireNormalAdultFiveWallPeriodicResultV3,
): MainWireNormalAdultFiveWallSelectedCycleContextV2 {
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error("periodic result has no retained complete beat to summarize");
  }
  const trace = beat.acceptedIntervalTrace;
  const durations = trace.intervals.map((interval) => interval.durationSec);
  if (durations.length !== beat.acceptedIntervalCount) {
    throw new Error("selected beat accepted interval count is inconsistent");
  }
  const acceptedEvents = Object.freeze(trace.intervals.flatMap(
    (interval) => interval.eventsOpenClosed,
  ));
  const common = Object.freeze({
    contextId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_SELECTED_CYCLE_CONTEXT_V2_ID,
    beat,
    beatIndex: beat.beatIndex,
    startTimeSec: beat.startTimeSec,
    endTimeSec: beat.endTimeSec,
    durationSec: trace.durationSec,
    nominalGridCount: result.stepsPerBeat,
    acceptedIntervalCount: beat.acceptedIntervalCount,
    minimumAcceptedDtSec: Math.min(...durations),
    maximumAcceptedDtSec: Math.max(...durations),
    acceptedEventCount: acceptedEvents.length,
    intervals: trace.intervals,
    samples: beat.samples,
    acceptedEvents,
  });
  if (trace.status === "complete") {
    validateRetainedAcceptedIntervalWindowV1(trace);
    return Object.freeze({
      ...common,
      status: "complete" as const,
      precedingSampleStatus: "available" as const,
      window: trace,
    });
  }
  if ("precedingSample" in trace) {
    throw new Error("missing-predecessor trace contains a fabricated sample");
  }
  return Object.freeze({
    ...common,
    status: "missing-preceding-diagnostic" as const,
    precedingSampleStatus: "missing-cold-start" as const,
    reason: trace.reason,
    window: null,
  });
}
