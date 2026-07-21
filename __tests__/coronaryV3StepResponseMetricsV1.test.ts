import { describe, expect, it } from "vitest";

import {
  CORONARY_V3_STEP_RESPONSE_METRICS_CLAIM_V1,
  describeCoronaryV3StepResponseMetricsV1,
  type CoronaryStepMeasurementStationV1,
  type CoronaryStepResponseBeatV1,
} from "@/engine/coronary/experiments/CoronaryV3StepResponseMetricsV1";

const EXACT_STATION = Object.freeze({
  kind: "cannulated-left-main-zero-flow-wedge",
  upstreamPressureStation: "left-main-cannula-tip",
  flowStation: "left-main-perfusion-line",
  downstreamReferenceStation: "distal-zero-flow-wedge",
  zeroFlowOcclusionDurationSec: 10,
} as const satisfies CoronaryStepMeasurementStationV1);

const SURROGATE_STATION = Object.freeze({
  kind: "venous-boundary-pressure-flow-surrogate",
  upstreamPressureStation: "reduced-network-inlet",
  flowStation: "summed-territory-inlet",
  downstreamReferenceStation: "fixed-venous-boundary",
  reasonExactWedgeUnavailable:
    "stage-one component harness has no zero-flow occlusion owner",
} as const satisfies CoronaryStepMeasurementStationV1);

describe("coronary V3 fit-free step-response metrics", () => {
  it("brackets paper-window and slow-phase crossings without interpolation or acceptance promotion", () => {
    const response = [
      8, 7, 8, 10, 12, 14, 15, 16, 17, 18,
      18, 18, 18, 18, 18,
    ];
    const beats = makeBeats([
      10, 10, 10, 10, 10,
      ...response,
    ], -5);
    const result = describeCoronaryV3StepResponseMetricsV1({
      interventionTimeSec: 0,
      baselineWindow: Object.freeze({ startTimeSec: -5, endTimeSec: 0 }),
      finalWindow: Object.freeze({ startTimeSec: 10, endTimeSec: 15 }),
      persistenceBeatCount: 3,
      measurementStation: EXACT_STATION,
      beats,
    });

    expect(result.claim).toBe(
      CORONARY_V3_STEP_RESPONSE_METRICS_CLAIM_V1,
    );
    expect(result.baseline.meanPressureFlowMmHgSecPerMl).toBe(10);
    expect(result.final.meanPressureFlowMmHgSecPerMl).toBe(18);
    expect(result.responseDirection).toBe("increase");
    expect(result.halfwayTargetPressureFlowMmHgSecPerMl).toBe(14);
    expect(result.fitFreeBaselineFinalHalfResponseBracket).toEqual({
      lowerTimeSec: 5,
      upperTimeSec: 6,
      thresholdPressureFlowMmHgSecPerMl: 14,
      direction: "increase",
      firstCrossingBeatIndex: 10,
      persistenceBeatCount: 3,
      interpolated: false,
    });
    expect(result.passiveExtremum).toMatchObject({
      beatIndex: 6,
      beatStartTimeSec: 1,
      beatEndTimeSec: 2,
      pressureFlowMmHgSecPerMl: 7,
      signedOppositeAmplitudeFromBaselineMmHgSecPerMl: 3,
      absoluteOppositeAmplitudeFromBaselineMmHgSecPerMl: 3,
      oppositeDirectionObserved: true,
    });
    expect(result.fitFreeSlowPhaseT50Bracket).toEqual({
      lowerTimeSec: 5,
      upperTimeSec: 6,
      thresholdPressureFlowMmHgSecPerMl: 12.5,
      direction: "increase",
      firstCrossingBeatIndex: 10,
      persistenceBeatCount: 3,
      interpolated: false,
    });
    expect(result.exactDankelmanMeasurementStationEstablished).toBe(true);
    expect(result.eligibleForDirectOriginalPaperT50ReproductionClaim)
      .toBe(false);
    expect(result.claim.originalPaperManualTenSecondRegressionReproduced)
      .toBe(false);
    expect(result.claim.semUsedAsModelAcceptanceTolerance).toBe(false);
    expect(result.physiologicalAcceptanceEstablished).toBe(false);
    expect(result.independentValidationEstablished).toBe(false);
  });

  it("keeps a venous-boundary observable explicitly labelled as a surrogate", () => {
    const beats = makeBeats([
      20, 20, 20, 20, 20,
      22, 23, 21, 19, 17, 15, 14, 13, 12, 12,
      12, 12, 12, 12, 12,
    ], -5);
    const result = describeCoronaryV3StepResponseMetricsV1({
      interventionTimeSec: 0,
      baselineWindow: Object.freeze({ startTimeSec: -5, endTimeSec: 0 }),
      finalWindow: Object.freeze({ startTimeSec: 10, endTimeSec: 15 }),
      persistenceBeatCount: 3,
      measurementStation: SURROGATE_STATION,
      beats,
    });

    expect(result.responseDirection).toBe("decrease");
    expect(result.exactDankelmanMeasurementStationEstablished).toBe(false);
    expect(result.measurementStation.kind)
      .toBe("venous-boundary-pressure-flow-surrogate");
    expect(result.passiveExtremum).toMatchObject({
      pressureFlowMmHgSecPerMl: 23,
      oppositeDirectionObserved: true,
      absoluteOppositeAmplitudeFromBaselineMmHgSecPerMl: 3,
    });
    expect(result.fitFreeBaselineFinalHalfResponseBracket).toMatchObject({
      direction: "decrease",
      thresholdPressureFlowMmHgSecPerMl: 16,
      lowerTimeSec: 5,
      upperTimeSec: 6,
    });
  });

  it("duration-weights partial beats and reports final-window drift separately", () => {
    const beats = makeBeats([
      10, 10, 10, 10, 10,
      8, 8, 10, 12, 14, 16, 18, 18, 18, 18,
      18, 18, 18, 18, 18,
    ], -5, (index) => 30 + index);
    const result = describeCoronaryV3StepResponseMetricsV1({
      interventionTimeSec: 0,
      baselineWindow: Object.freeze({ startTimeSec: -4.5, endTimeSec: -0.5 }),
      finalWindow: Object.freeze({ startTimeSec: 10.25, endTimeSec: 14.75 }),
      persistenceBeatCount: 3,
      measurementStation: SURROGATE_STATION,
      beats,
    });

    expect(result.baseline.contributingDurationSec).toBe(4);
    expect(result.baseline.contributingBeatCount).toBe(5);
    expect(result.final.contributingDurationSec).toBe(4.5);
    expect(result.finalWindowDrift.secondMinusFirstCoronaryBloodVolumeMl)
      .toBeGreaterThan(0);
    expect(result.finalWindowDrift.secondMinusFirstPressureFlowMmHgSecPerMl)
      .toBe(0);
  });

  it("fails closed for an invalid station, nonpositive flow, gaps, or off-boundary intervention", () => {
    const beats = makeBeats(new Array<number>(20).fill(10), -5);
    const base = {
      interventionTimeSec: 0,
      baselineWindow: Object.freeze({ startTimeSec: -5, endTimeSec: 0 }),
      finalWindow: Object.freeze({ startTimeSec: 10, endTimeSec: 15 }),
      persistenceBeatCount: 3 as const,
      measurementStation: EXACT_STATION,
      beats,
    };
    expect(() => describeCoronaryV3StepResponseMetricsV1({
      ...base,
      measurementStation: {
        ...EXACT_STATION,
        downstreamReferenceStation: "right-atrial-pressure",
      } as CoronaryStepMeasurementStationV1,
    })).toThrow(/measurement station/);
    expect(() => describeCoronaryV3StepResponseMetricsV1({
      ...base,
      beats: beats.map((beat, index) => index === 3
        ? { ...beat, meanObservedFlowMlPerSec: 0 }
        : beat),
    })).toThrow(/strictly positive/);
    expect(() => describeCoronaryV3StepResponseMetricsV1({
      ...base,
      beats: beats.map((beat, index) => index === 3
        ? { ...beat, startTimeSec: beat.startTimeSec + 0.1 }
        : beat),
    })).toThrow(/contiguous/);
    expect(() => describeCoronaryV3StepResponseMetricsV1({
      ...base,
      interventionTimeSec: 0.5,
    })).toThrow(/beat boundary/);
  });
});

function makeBeats(
  pressureFlowValues: readonly number[],
  startTimeSec: number,
  bloodVolume: (index: number) => number = () => 30,
): readonly CoronaryStepResponseBeatV1[] {
  return Object.freeze(pressureFlowValues.map((pressureFlow, index) => {
    const flow = 2;
    const downstream = 10;
    return Object.freeze({
      beatIndex: index,
      startTimeSec: startTimeSec + index,
      endTimeSec: startTimeSec + index + 1,
      meanUpstreamPressureMmHg: downstream + pressureFlow * flow,
      meanDownstreamReferencePressureMmHg: downstream,
      meanObservedFlowMlPerSec: flow,
      meanCoronaryBloodVolumeMl: bloodVolume(index),
    });
  }));
}
