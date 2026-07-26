import { describe, expect, it } from "vitest";

import {
  HEARTMATE_II_STANFIELD_MEAN_OPERATING_POINT_CONTEXT_CLAIM_V1,
  runHeartMateIiStanfieldMeanOperatingPointContextV1,
} from "@/engine/devices/experiments/HeartMateIiStanfieldMeanOperatingPointContextV1";

describe("HeartMate II Stanfield mean operating-point context V1", () => {
  it("reports both pressure-station projections without turning either into validation", () => {
    const result = runHeartMateIiStanfieldMeanOperatingPointContextV1();

    expect(result.operatingPoints.map((point) => ({
      condition: point.condition,
      pumpInternal: point.pumpInternal.predictedMeanFlowLMin,
      patientNode: point.patientNodeWithConfiguredCannulae.predictedMeanFlowLMin,
    }))).toEqual([
      {
        condition: "normotensive",
        pumpInternal: expect.closeTo(8.861256579139972, 12),
        patientNode: expect.closeTo(4.941576275920266, 12),
      },
      {
        condition: "hypertensive",
        pumpInternal: expect.closeTo(3.588848846275297, 12),
        patientNode: expect.closeTo(2.001360660108439, 12),
      },
      {
        condition: "hypotensive",
        pumpInternal: expect.closeTo(9.564244276855263, 12),
        patientNode: expect.closeTo(5.333605024695175, 12),
      },
    ]);
    expect(result.descriptiveOneSdMembershipCount).toEqual({
      pumpInternal: 1,
      patientNodeWithConfiguredCannulae: 3,
      denominator: 3,
    });
    expect(result.allCalculationsFiniteAndUnconstrained).toBe(true);
    expect(result.measurementStationMatched).toBe(false);
    expect(result.independentComponentValidationEstablished).toBe(false);
    expect(result.physiologicalAcceptanceEstablished).toBe(false);
    expect(result.releaseAcceptanceEstablished).toBe(false);
    expect(HEARTMATE_II_STANFIELD_MEAN_OPERATING_POINT_CONTEXT_CLAIM_V1)
      .toMatchObject({
        parameterFittingApplied: false,
        measurementStationMatched: false,
        waveformCompared: false,
        loopTraversalCompared: false,
        independentComponentValidationEstablished: false,
      });
  });
});
