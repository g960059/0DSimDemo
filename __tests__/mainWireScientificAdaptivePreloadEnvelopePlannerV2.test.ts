import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_SCIENTIFIC_ADAPTIVE_PRELOAD_ENVELOPE_LIMITS_V2,
  MAIN_WIRE_SCIENTIFIC_ADAPTIVE_PRELOAD_ENVELOPE_PLANNER_V2_ID,
  assessMainWireScientificPreloadEnvelopeShapeV2,
  advanceMainWireScientificAdaptivePreloadEnvelopePlannerV2,
  createMainWireScientificAdaptivePreloadEnvelopePlannerV2,
  type MainWireScientificAdaptivePreloadEnvelopePlannerStateV2,
  type MainWireScientificPreloadEnvelopeMetricsV2,
  type MainWireScientificPreloadEnvelopeTargetV2,
} from "@/engine/scientific/protocols/MainWireScientificAdaptivePreloadEnvelopePlannerV2";

const BASELINE_TBV_ML = 5_522.11;
const BASELINE = metrics(5, 3, 8);

describe("main-wire scientific adaptive preload envelope planner V2", () => {
  it("creates deterministic negative-first and positive-second targets with explicit P1 provenance", () => {
    const initialized = planner();

    expect(initialized.state).toMatchObject({
      plannerId: MAIN_WIRE_SCIENTIFIC_ADAPTIVE_PRELOAD_ENVELOPE_PLANNER_V2_ID,
      plannerVersion: "2.0.0",
      baselineTotalBloodVolumeMl: BASELINE_TBV_ML,
      initialStepNormalizedTbv: 0.05,
    });
    expect(initialized.initialTargets.map(targetSummary)).toEqual([
      {
        id: "preload-envelope-v2-negative-0001-nu-0p950000",
        order: "0:000001",
        lane: "negative",
        normalizedTbv: 0.95,
        totalBloodVolumeMl: 5_246.0045,
      },
      {
        id: "preload-envelope-v2-positive-0001-nu-1p050000",
        order: "1:000001",
        lane: "positive",
        normalizedTbv: 1.05,
        totalBloodVolumeMl: 5_798.2155,
      },
    ]);
    for (const target of initialized.initialTargets) {
      expect(target.provenance).toMatchObject({
        decision: "initial-step",
        seedPeriodicity: "P1",
        seedPointId: "preload-envelope-v2-baseline-nu-1p000000",
        seedNormalizedTbv: 1,
        stepFromSeedNormalizedTbv: 0.05,
        priorBlockingTargetId: null,
      });
    }
  });

  it("uses only an accepted P1 point as the next seed and grows after fast low-curvature evidence", () => {
    let state = planner().state;
    let target = pending(state, "negative");
    let advanced = p1(state, target, 4, metrics(4.75, 2.5, 7.5));
    state = advanced.state;
    target = requiredTarget(advanced.nextTarget);
    expect(target.normalizedTbv).toBe(0.9);
    expect(target.provenance.decision).toBe("retain-step");
    expect(target.provenance.seedPointId).toBe(advanced.acceptedPoint?.pointId);

    advanced = p1(state, target, 5, metrics(4.5, 2, 7));
    const grown = requiredTarget(advanced.nextTarget);
    expect(advanced.shapeAssessment).toMatchObject({ classification: "low" });
    expect(grown.normalizedTbv).toBe(0.825);
    expect(grown.provenance).toMatchObject({
      decision: "fast-low-curvature-grow",
      seedPeriodicity: "P1",
      seedPointId: advanced.acceptedPoint?.pointId,
      seedNormalizedTbv: 0.9,
      stepFromSeedNormalizedTbv: 0.075,
    });
  });

  it("shrinks for high curvature or more than twenty-four completed beats", () => {
    let state = planner().state;
    let target = pending(state, "negative");
    let advanced = p1(state, target, 4, metrics(4.75, 2.5, 7.5));
    state = advanced.state;
    target = requiredTarget(advanced.nextTarget);
    advanced = p1(state, target, 4, metrics(3, 2, 7));
    expect(advanced.shapeAssessment?.classification).toBe("high");
    expect(advanced.nextTarget).toMatchObject({
      normalizedTbv: 0.875,
      provenance: {
        decision: "high-curvature-shrink",
        stepFromSeedNormalizedTbv: 0.025,
      },
    });

    state = planner().state;
    target = pending(state, "positive");
    advanced = p1(state, target, 25, metrics(5.25, 3.5, 8.5));
    expect(advanced.shapeAssessment).toBeNull();
    expect(advanced.nextTarget).toMatchObject({
      normalizedTbv: 1.075,
      provenance: {
        decision: "slow-convergence-shrink",
        stepFromSeedNormalizedTbv: 0.025,
      },
    });
  });

  it("never seeds from P2/failure, retries the midpoint, and terminates after two minimum-step failures", () => {
    let state = planner().state;
    const first = pending(state, "negative");
    let advanced = blocked(state, first, "P2", "period-2 suspect");
    state = advanced.state;
    const midpoint = requiredTarget(advanced.nextTarget);
    expect(midpoint).toMatchObject({
      normalizedTbv: 0.975,
      provenance: {
        decision: "blocking-midpoint-retry",
        seedPeriodicity: "P1",
        seedPointId: "preload-envelope-v2-baseline-nu-1p000000",
        priorBlockingTargetId: first.targetId,
        stepFromSeedNormalizedTbv: 0.025,
      },
    });
    expect(midpoint.provenance.seedPointId).not.toBe(first.targetId);

    advanced = blocked(state, midpoint, "failure", "step failure");
    state = advanced.state;
    const confirmation = requiredTarget(advanced.nextTarget);
    expect(confirmation).toMatchObject({
      normalizedTbv: 0.975,
      provenance: {
        decision: "minimum-step-confirmation",
        seedPointId: "preload-envelope-v2-baseline-nu-1p000000",
        priorBlockingTargetId: midpoint.targetId,
        minimumStepFailureOrdinal: 1,
      },
    });

    advanced = blocked(state, confirmation, "P2", "period-2 reproduced");
    expect(advanced.nextTarget).toBeNull();
    expect(advanced.state.lanes.negative.status).toBe("unresolved-boundary");
    expect(advanced.boundary).toEqual({
      status: "unresolved-boundary",
      lane: "negative",
      lastP1PointId: "preload-envelope-v2-baseline-nu-1p000000",
      lastP1NormalizedTbv: 1,
      blockedNormalizedTbv: 0.975,
      blockingTargetIds: [midpoint.targetId, confirmation.targetId],
      blockingOutcomes: ["failure", "P2"],
      minimumStepFailureCount: 2,
    });
  });

  it("promotes a successful midpoint to the sole continuation seed", () => {
    let state = planner().state;
    const first = pending(state, "negative");
    let advanced = blocked(state, first, "failure", "retry closer to P1");
    state = advanced.state;
    const midpoint = requiredTarget(advanced.nextTarget);

    advanced = p1(state, midpoint, 8, metrics(4.875, 2.75, 7.75));
    const continued = requiredTarget(advanced.nextTarget);
    expect(continued.normalizedTbv).toBe(0.95);
    expect(continued.provenance).toMatchObject({
      seedPeriodicity: "P1",
      seedPointId: advanced.acceptedPoint?.pointId,
      seedNormalizedTbv: 0.975,
      priorBlockingTargetId: null,
    });
    expect(advanced.state.lanes.negative.minimumStepFailureCount).toBe(0);
    expect(advanced.state.lanes.negative.consecutiveBlockingAttempts).toEqual([]);
  });

  it("reaches both exact hard bounds without scheduling an out-of-envelope target", () => {
    let state = planner(0.1).state;
    for (const lane of ["negative", "positive"] as const) {
      const visited: number[] = [];
      while (state.lanes[lane].status === "active") {
        const target = pending(state, lane);
        visited.push(target.normalizedTbv);
        const advanced = p1(
          state,
          target,
          4,
          metrics(
            5 * target.normalizedTbv,
            10 * target.normalizedTbv - 7,
            10 * target.normalizedTbv - 2,
          ),
        );
        state = advanced.state;
      }
      expect(Math.min(...visited)).toBeGreaterThanOrEqual(
        MAIN_WIRE_SCIENTIFIC_ADAPTIVE_PRELOAD_ENVELOPE_LIMITS_V2.minimumNormalizedTbv,
      );
      expect(Math.max(...visited)).toBeLessThanOrEqual(
        MAIN_WIRE_SCIENTIFIC_ADAPTIVE_PRELOAD_ENVELOPE_LIMITS_V2.maximumNormalizedTbv,
      );
      expect(visited.at(-1)).toBe(lane === "negative" ? 0.35 : 1.3);
      expect(state.lanes[lane]).toMatchObject({
        status: "complete",
        pendingTarget: null,
        boundary: null,
      });
    }
  });

  it("is independent of cross-lane result arrival order", () => {
    const initialized = planner();
    const negative = pending(initialized.state, "negative");
    const positive = pending(initialized.state, "positive");

    const negativeFirst = p1(
      p1(initialized.state, negative, 8, metrics(4.75, 2.5, 7.5)).state,
      positive,
      8,
      metrics(5.25, 3.5, 8.5),
    ).state;
    const positiveFirst = p1(
      p1(initialized.state, positive, 8, metrics(5.25, 3.5, 8.5)).state,
      negative,
      8,
      metrics(4.75, 2.5, 7.5),
    ).state;

    expect(negativeFirst).toEqual(positiveFirst);
    expect(negativeFirst.lanes.negative.pendingTarget?.deterministicOrderKey)
      .toBe("0:000002");
    expect(negativeFirst.lanes.positive.pendingTarget?.deterministicOrderKey)
      .toBe("1:000002");
  });

  it("classifies generalized midpoint interpolation error with the declared CO/RAP/LAP thresholds", () => {
    const linear = assessMainWireScientificPreloadEnvelopeShapeV2(
      { normalizedTbv: 0.9, metrics: metrics(4.5, 2, 7) },
      { normalizedTbv: 0.95, metrics: metrics(4.75, 2.5, 7.5) },
      { normalizedTbv: 1, metrics: BASELINE },
    );
    expect(linear.classification).toBe("low");
    expect(linear.maximumNormalizedMidpointError).toBeCloseTo(0, 12);
    expect(linear.cardiacOutputLMin.allowedMidpointError).toBe(0.15);
    expect(linear.meanRapTransmuralMmHg.allowedMidpointError).toBe(0.5);
    expect(linear.meanLapTransmuralMmHg.allowedMidpointError).toBe(0.5);

    const curved = assessMainWireScientificPreloadEnvelopeShapeV2(
      { normalizedTbv: 0.9, metrics: metrics(4.5, 2, 7) },
      { normalizedTbv: 0.95, metrics: metrics(4.4, 2.5, 7.5) },
      { normalizedTbv: 1, metrics: BASELINE },
    );
    expect(curved.classification).toBe("high");
    expect(curved.cardiacOutputLMin.normalizedMidpointError)
      .toBeGreaterThan(1);
    expect(Math.abs(curved.cardiacOutputLMin.secondDividedDifference))
      .toBeGreaterThan(0);
  });

  it("fails closed on invalid configuration, non-finite metrics, and stale target results", () => {
    expect(() => planner(0.02)).toThrow(/within \[0.025, 0.1\]/);
    expect(() => createMainWireScientificAdaptivePreloadEnvelopePlannerV2({
      baselineTotalBloodVolumeMl: BASELINE_TBV_ML,
      baselineMetrics: metrics(Number.NaN, 3, 8),
    })).toThrow("cardiacOutputLMin must be finite");

    const initialized = planner();
    const target = pending(initialized.state, "negative");
    expect(() => advanceMainWireScientificAdaptivePreloadEnvelopePlannerV2(
      initialized.state,
      {
        targetId: `${target.targetId}-stale`,
        lane: "negative",
        outcome: "P1",
        completedBeatCount: 4,
        metrics: BASELINE,
      },
    )).toThrow(/stale or mismatched target/);
  });

  it("owns an immutable copy of caller-provided shape thresholds", () => {
    const callerThresholds = {
      cardiacOutputLMin: {
        absoluteMidpointError: 0.2,
        relativeMidpointError: 0.04,
      },
      meanRapTransmuralMmHg: {
        absoluteMidpointError: 0.6,
        relativeMidpointError: 0.06,
      },
      meanLapTransmuralMmHg: {
        absoluteMidpointError: 0.7,
        relativeMidpointError: 0.07,
      },
      lowMaximumNormalizedError: 0.4,
      highMinimumNormalizedError: 1.2,
    };
    const initialized = createMainWireScientificAdaptivePreloadEnvelopePlannerV2({
      baselineTotalBloodVolumeMl: BASELINE_TBV_ML,
      baselineMetrics: BASELINE,
      shapeThresholds: callerThresholds,
    });

    callerThresholds.cardiacOutputLMin.absoluteMidpointError = 99;
    callerThresholds.lowMaximumNormalizedError = 99;

    expect(initialized.state.shapeThresholds).toMatchObject({
      cardiacOutputLMin: { absoluteMidpointError: 0.2 },
      lowMaximumNormalizedError: 0.4,
    });
    expect(Object.isFrozen(initialized.state.shapeThresholds)).toBe(true);
    expect(Object.isFrozen(
      initialized.state.shapeThresholds.cardiacOutputLMin,
    )).toBe(true);
  });
});

function planner(initialStepNormalizedTbv?: number) {
  return createMainWireScientificAdaptivePreloadEnvelopePlannerV2({
    baselineTotalBloodVolumeMl: BASELINE_TBV_ML,
    baselineMetrics: BASELINE,
    initialStepNormalizedTbv,
  });
}

function p1(
  state: MainWireScientificAdaptivePreloadEnvelopePlannerStateV2,
  target: MainWireScientificPreloadEnvelopeTargetV2,
  completedBeatCount: number,
  pointMetrics: MainWireScientificPreloadEnvelopeMetricsV2,
) {
  return advanceMainWireScientificAdaptivePreloadEnvelopePlannerV2(state, {
    targetId: target.targetId,
    lane: target.lane,
    outcome: "P1",
    completedBeatCount,
    metrics: pointMetrics,
  });
}

function blocked(
  state: MainWireScientificAdaptivePreloadEnvelopePlannerStateV2,
  target: MainWireScientificPreloadEnvelopeTargetV2,
  outcome: "P2" | "failure",
  reason: string,
) {
  return advanceMainWireScientificAdaptivePreloadEnvelopePlannerV2(state, {
    targetId: target.targetId,
    lane: target.lane,
    outcome,
    completedBeatCount: 32,
    reason,
  });
}

function pending(
  state: MainWireScientificAdaptivePreloadEnvelopePlannerStateV2,
  lane: "negative" | "positive",
): MainWireScientificPreloadEnvelopeTargetV2 {
  return requiredTarget(state.lanes[lane].pendingTarget);
}

function requiredTarget(
  target: MainWireScientificPreloadEnvelopeTargetV2 | null,
): MainWireScientificPreloadEnvelopeTargetV2 {
  if (target === null) throw new Error("expected pending target");
  return target;
}

function metrics(
  cardiacOutputLMin: number,
  meanRapTransmuralMmHg: number,
  meanLapTransmuralMmHg: number,
): MainWireScientificPreloadEnvelopeMetricsV2 {
  return Object.freeze({
    cardiacOutputLMin,
    meanRapTransmuralMmHg,
    meanLapTransmuralMmHg,
  });
}

function targetSummary(target: MainWireScientificPreloadEnvelopeTargetV2) {
  return {
    id: target.targetId,
    order: target.deterministicOrderKey,
    lane: target.lane,
    normalizedTbv: target.normalizedTbv,
    totalBloodVolumeMl: target.totalBloodVolumeMl,
  };
}
