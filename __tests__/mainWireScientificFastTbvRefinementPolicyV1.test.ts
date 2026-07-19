import { describe, expect, it } from "vitest";

import {
  assessMainWireScientificFastTbvRefinementV1,
  MAIN_WIRE_SCIENTIFIC_FAST_TBV_REFINEMENT_POLICY_V1,
  planMainWireScientificFastTbvRefinementDispatchesV1,
  type MainWireScientificFastTbvNaturalBeatEvidenceV1,
  type MainWireScientificFastTbvRefinementAssessmentV1,
  type MainWireScientificFastTbvRefinementCandidateV1,
} from "@/engine/scientific/protocols/MainWireScientificFastTbvRefinementPolicyV1";
import type {
  MainWireScientificFastTbvLvEventStatusV1,
  MainWireScientificFastTbvTerminalObservationV1,
} from "@/engine/scientific/protocols/MainWireScientificFastTbvPreviewV1";

describe("MainWireScientificFastTbvRefinementPolicyV1", () => {
  it("always offers the baseline third beat without making a periodicity claim", () => {
    const assessment = assess({
      previous: beat(1),
      latest: beat(2, { fullStateMaximumNormalizedDelta: 0.001 }),
    });

    expect(assessment.tier).toBe("baseline-third-beat");
    expect(assessment.priorityScore).toBeGreaterThanOrEqual(1);
    expect(assessment.claimBoundary).toEqual({
      periodicityClaim: "none",
      mayEnterSettledP1OrP2Evidence: false,
      maySeedCanonicalContinuation: false,
      mayEnterEspvrEdpvrPrswFit: false,
    });
  });

  it("uses full-state and hemodynamic drift to prioritize beats four and five", () => {
    const fullState = assess({
      previous: beat(2),
      latest: beat(3, { fullStateMaximumNormalizedDelta: 0.11 }),
    });
    expect(fullState.tier).toBe("high-uncertainty");
    expect(fullState.normalizedDrift.fullState).toBeCloseTo(2.2);

    const growingResidual = assess({
      previous: beat(2, { fullStateMaximumNormalizedDelta: 0.02 }),
      latest: beat(3, { fullStateMaximumNormalizedDelta: 0.03 }),
    });
    expect(growingResidual.drift.fullStateResidualTrend).toBe("growing");
    expect(growingResidual.tier).toBe("high-uncertainty");

    const scalar = assess({
      previous: beat(2),
      latest: beat(3, {
        observation: observation({ meanLapTransmuralMmHg: 8.8 }),
      }),
    });
    expect(scalar.tier).toBe("high-uncertainty");
    expect(scalar.normalizedDrift.meanLap).toBeCloseTo(3.2);

    const pv = assess({
      previous: beat(3),
      latest: beat(4, {
        observation: observation({
          lvPressureVolume: {
            endDiastolicVolumeMl: 124,
            endDiastolicTransmuralPressureMmHg: 9,
            endSystolicVolumeMl: 55,
            endSystolicTransmuralPressureMmHg: 100,
            strokeWorkMmHgMl: 7_500,
          },
        }),
      }),
    });
    expect(pv.tier).toBe("high-uncertainty");
    expect(pv.normalizedDrift.lvPressureVolume).toBe(2);
  });

  it("treats an LV event transition as uncertainty but not as P1/P2 evidence", () => {
    const assessment = assess({
      previous: beat(2),
      latest: beat(3, {
        observation: observation({
          eventStatus: "missing-end-systolic-event",
          lvPressureVolume: null,
        }),
      }),
    });

    expect(assessment.eventQc.statusChanged).toBe(true);
    expect(assessment.tier).toBe("high-uncertainty");
    expect(assessment.normalizedDrift.lvPressureVolume).toBe(
      Number.POSITIVE_INFINITY,
    );
    expect(assessment.priorityScore).toBe(
      MAIN_WIRE_SCIENTIFIC_FAST_TBV_REFINEMENT_POLICY_V1.maximumFinitePriorityScore,
    );
    expect(assessment.claimBoundary.periodicityClaim).toBe("none");
  });

  it("does not spend more rapid budget after numerical QC failure or beat five", () => {
    const failed = assess({
      previous: beat(2),
      latest: beat(3, {
        observation: observation({ numericsPassed: false }),
      }),
    });
    expect(failed.tier).toBe("stop");
    expect(failed.stopReason).toBe("numerical-qc-failed");

    const maximum = assess({
      previous: beat(4),
      latest: beat(5, { fullStateMaximumNormalizedDelta: 0.5 }),
    });
    expect(maximum.tier).toBe("stop");
    expect(maximum.stopReason).toBe("maximum-natural-beat-count-reached");
  });

  it("stops a stable post-third-beat preview instead of chasing a periodic gate", () => {
    const assessment = assess({
      previous: beat(2),
      latest: beat(3, { fullStateMaximumNormalizedDelta: 0.01 }),
    });

    expect(assessment.normalizedDrift.maximum).toBeLessThanOrEqual(0.5);
    expect(assessment.tier).toBe("stop");
    expect(assessment.stopReason).toBe("beat-level-drift-small");
  });

  it("plans one concurrent next beat per lane inside the global wall-time budget", () => {
    const baselineThird = assess({
      previous: beat(1),
      latest: beat(2),
    });
    const plan = planMainWireScientificFastTbvRefinementDispatchesV1({
      remainingWallTimeMs: 700,
      idleLanes: ["lower-volume", "higher-volume"],
      candidates: [
        candidate("low-1", "lower-volume", baselineThird, 400, 4),
        candidate("high-1", "higher-volume", baselineThird, 300, 3),
      ],
    });

    expect(plan.dispatches).toHaveLength(2);
    expect(plan.dispatches.map((dispatch) => dispatch.requestedNaturalBeatCount))
      .toEqual([3, 3]);
    expect(plan.claimBoundary).toEqual({
      periodicityClaim: "none",
      dispatchesAreRapidPreviewOnly: true,
    });
  });

  it("defers beats four and five until the lane has exposed every initial point", () => {
    const uncertain = assess({
      previous: beat(2),
      latest: beat(3, { fullStateMaximumNormalizedDelta: 0.2 }),
    });
    const deferred = planMainWireScientificFastTbvRefinementDispatchesV1({
      remainingWallTimeMs: 2_000,
      idleLanes: ["lower-volume"],
      candidates: [candidate("low-1", "lower-volume", uncertain, 300, 1)],
    });
    expect(deferred.dispatches).toEqual([]);
    expect(deferred.budgetExhausted).toBe(false);

    const ready = planMainWireScientificFastTbvRefinementDispatchesV1({
      remainingWallTimeMs: 2_000,
      idleLanes: ["lower-volume"],
      candidates: [candidate("low-1", "lower-volume", uncertain, 300, 0)],
    });
    expect(ready.dispatches).toMatchObject([
      {
        targetId: "low-1",
        requestedNaturalBeatCount: 4,
        tier: "high-uncertainty",
      },
    ]);
  });

  it("refuses a dispatch whose protected estimate would exceed the soft deadline", () => {
    const baselineThird = assess({
      previous: beat(1),
      latest: beat(2),
    });
    const plan = planMainWireScientificFastTbvRefinementDispatchesV1({
      remainingWallTimeMs: 600,
      idleLanes: ["lower-volume"],
      candidates: [candidate("low-1", "lower-volume", baselineThird, 400, 4)],
    });

    expect(plan.dispatches).toEqual([]);
    expect(plan.budgetExhausted).toBe(true);
  });
});

function assess(input: Readonly<{
  previous: MainWireScientificFastTbvNaturalBeatEvidenceV1;
  latest: MainWireScientificFastTbvNaturalBeatEvidenceV1;
}>): MainWireScientificFastTbvRefinementAssessmentV1 {
  return assessMainWireScientificFastTbvRefinementV1({
    previousBeat: input.previous,
    latestBeat: input.latest,
  });
}

function beat(
  naturalBeatOrdinal: number,
  overrides: Partial<MainWireScientificFastTbvNaturalBeatEvidenceV1> = {},
): MainWireScientificFastTbvNaturalBeatEvidenceV1 {
  return Object.freeze({
    naturalBeatOrdinal,
    fullStateMaximumNormalizedDelta: 0.01,
    observation: observation(),
    ...overrides,
  });
}

function observation(overrides: Readonly<{
  meanRapTransmuralMmHg?: number;
  meanLapTransmuralMmHg?: number;
  netCardiacOutputLMin?: number;
  forwardCardiacOutputLMin?: number;
  lvPressureVolume?: MainWireScientificFastTbvTerminalObservationV1["lvPressureVolume"];
  eventStatus?: MainWireScientificFastTbvLvEventStatusV1;
  numericsPassed?: boolean;
}> = {}): MainWireScientificFastTbvTerminalObservationV1 {
  const eventStatus = overrides.eventStatus ?? "complete";
  return Object.freeze({
    meanRapTransmuralMmHg: overrides.meanRapTransmuralMmHg ?? 3,
    meanLapTransmuralMmHg: overrides.meanLapTransmuralMmHg ?? 8,
    netCardiacOutputLMin: overrides.netCardiacOutputLMin ?? 5,
    forwardCardiacOutputLMin: overrides.forwardCardiacOutputLMin ?? 5.1,
    lvPressureVolume: overrides.lvPressureVolume === undefined
      ? Object.freeze({
          endDiastolicVolumeMl: 120,
          endDiastolicTransmuralPressureMmHg: 8,
          endSystolicVolumeMl: 55,
          endSystolicTransmuralPressureMmHg: 100,
          strokeWorkMmHgMl: 7_500,
        })
      : overrides.lvPressureVolume,
    quality: Object.freeze({
      numerics: Object.freeze({
        finite: true,
        totalBloodVolumeAbsoluteErrorMl: 0,
        maximumContinuityAbsoluteResidualMl: 0,
        passed: overrides.numericsPassed ?? true,
      }),
      lvEvents: Object.freeze({
        status: eventStatus,
        endpointDisplayEligible: eventStatus === "complete",
      }),
    }),
  });
}

function candidate(
  targetId: string,
  lane: MainWireScientificFastTbvRefinementCandidateV1["lane"],
  assessment: MainWireScientificFastTbvRefinementAssessmentV1,
  estimatedNextBeatWallTimeMs: number,
  initialTargetsRemainingInLane: number,
): MainWireScientificFastTbvRefinementCandidateV1 {
  return Object.freeze({
    targetId,
    lane,
    completedNaturalBeatCount: assessment.completedNaturalBeatCount,
    assessment,
    estimatedNextBeatWallTimeMs,
    initialTargetsRemainingInLane,
    inFlight: false,
  });
}
