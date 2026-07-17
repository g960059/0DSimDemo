import { beforeAll, describe, expect, it } from "vitest";

import {
  buildMainWireNormalAdultFiveWallPeriodicReviewV2,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_REVIEW_CLAIM_V2,
  renderMainWireNormalAdultFiveWallPeriodicReviewV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallPeriodicReviewV2";
import {
  runMainWireNormalAdultFiveWallPeriodicSteadyV3,
  type MainWireNormalAdultFiveWallPeriodicResultV3,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";

describe("main-wire normal-adult five-wall periodic review V2", () => {
  let exactResult: MainWireNormalAdultFiveWallPeriodicResultV3;
  let analyticResult: MainWireNormalAdultFiveWallPeriodicResultV3;

  beforeAll(() => {
    exactResult = runMainWireNormalAdultFiveWallPeriodicSteadyV3({
      dtSec: 0.02,
      maximumBeatCount: 2,
      initialization: "canonical",
      calciumRepresentation: "exact-event-state",
    });
    analyticResult = runMainWireNormalAdultFiveWallPeriodicSteadyV3({
      dtSec: 0.02,
      maximumBeatCount: 2,
      initialization: "canonical",
      calciumRepresentation:
        "analytic-periodic-control-with-exact-event-shadow",
    });
  }, 90_000);

  it("builds an exact 52-interval review on raw accepted physical time", () => {
    const selected = exactResult.retainedCompleteBeats.at(-1)!;
    const beforeDynamicsHash = stableHash(sanitizeForStableHash(
      selected.samples,
    ));
    const review = buildMainWireNormalAdultFiveWallPeriodicReviewV2(
      exactResult,
    );

    expect(review.status).toBe("complete");
    if (review.status !== "complete") throw new Error("expected complete");
    expect(review.acceptedTimebase).toMatchObject({
      nominalGridCount: 50,
      acceptedIntervalCount: 52,
    });
    expect(review.acceptedTimebase.endpoints).toHaveLength(52);
    expect(review.acceptedTimebase.precedingBoundary).toMatchObject({
      sampleIndex: null,
      phase01: 0,
      acceptedDurationSec: null,
    });
    review.acceptedTimebase.endpoints.forEach((point, index) => {
      expect(point.phase01).toBeCloseTo(
        (point.timeSec - review.acceptedTimebase.startTimeSec)
          / review.acceptedTimebase.durationSec,
        12,
      );
      if (index > 0) {
        expect(point.phase01).toBeGreaterThan(
          review.acceptedTimebase.endpoints[index - 1]!.phase01,
        );
      }
    });
    expect(review.acceptedTimebase.endpoints.at(-1)!.phase01)
      .toBeCloseTo(1, 12);
    expect(review.acceptedTimebase.exactEvents).toHaveLength(2);
    review.acceptedTimebase.exactEvents.forEach((event) => {
      expect(event.phase01).toBeCloseTo(
        (event.timeSec - review.acceptedTimebase.startTimeSec)
          / review.acceptedTimebase.durationSec,
        12,
      );
      expect(event.ownerAcceptedEndpointPhase01 + 1e-12)
        .toBeGreaterThanOrEqual(event.phase01);
      expect(Object.values(event.strengthByWall)).toHaveLength(5);
      expect(Object.values(event.strengthByWall).every(Number.isFinite))
        .toBe(true);
      expect(event.activeWalls.length).toBeGreaterThan(0);
    });
    expect(review.acceptedTimebase.exactEvents.some((event) =>
      event.activeWalls.includes("LVFW")
      && event.activeWalls.includes("SEP")
      && event.activeWalls.includes("RVFW"))).toBe(true);
    expect(review.convergence.groupOrder).toContain("calcium-event-state");
    expect(review.convergence.calciumEventStateIncluded).toBe(true);
    expect(review.convergence.latestGroupReports.some((report) =>
      report.group === "calcium-event-state")).toBe(true);
    expect(stableHash(sanitizeForStableHash(selected.samples)))
      .toBe(beforeDynamicsHash);
  });

  it("uses the predecessor once and covers every real accepted PV segment", () => {
    const review = buildMainWireNormalAdultFiveWallPeriodicReviewV2(
      exactResult,
    );
    expect(review.status).toBe("complete");
    if (review.status !== "complete") throw new Error("expected complete");

    for (const path of [review.pvPaths.LA, review.pvPaths.LV]) {
      expect(path.points).toHaveLength(53);
      expect(path.points[0]).toMatchObject({
        source: "real-predecessor",
        sampleIndex: null,
        phase01: 0,
      });
      expect(path.points.at(-1)).toMatchObject({
        source: "accepted-endpoint",
        sampleIndex: 51,
        phase01: 1,
      });
      expect(path.drawableRealSegmentCount).toBe(52);
      expect(path.missingFirstIntervalSegment).toBe(false);
      expect(path.artificialClosingSegmentAdded).toBe(false);
      expect(path.phasePaths).not.toBeNull();
      const drawnPhaseSegmentCount = Object.values(path.phasePaths!).reduce(
        (total, runs) => total + runs.reduce(
          (subtotal, run) => subtotal + run.length - 1,
          0,
        ),
        0,
      );
      expect(drawnPhaseSegmentCount).toBe(52);
      expect(Object.values(path.phasePaths!).some((runs) =>
        runs.some((run) => run[0]?.source === "real-predecessor")))
        .toBe(true);
    }
  });

  it("uses absolute intracavitary pressure for PV and pressure waveforms", () => {
    const review = buildMainWireNormalAdultFiveWallPeriodicReviewV2(
      exactResult,
    );
    expect(review.status).toBe("complete");
    if (review.status !== "complete") throw new Error("expected complete");
    const selected = exactResult.retainedCompleteBeats.at(-1)!;
    const predecessor = selected.acceptedIntervalTrace;
    if (predecessor.status !== "complete") {
      throw new Error("expected real predecessor");
    }

    for (const chamber of ["LA", "LV"] as const) {
      const path = review.pvPaths[chamber];
      expect(path.points[0]!.pressureMmHg).toBe(
        predecessor.precedingSample.sample.nodeAbsolutePressureMmHg[chamber],
      );
      selected.samples.forEach((sample, index) => {
        expect(path.points[index + 1]!.pressureMmHg)
          .toBe(sample.nodeAbsolutePressureMmHg[chamber]);
      });
    }
    review.acceptedTimebase.endpoints.forEach((point, index) => {
      const sample = selected.samples[index]!;
      expect(point.pressureMmHg).toEqual({
        LA: sample.nodeAbsolutePressureMmHg.LA,
        LV: sample.nodeAbsolutePressureMmHg.LV,
        Ao: sample.nodeAbsolutePressureMmHg.Ao,
      });
    });
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_REVIEW_CLAIM_V2)
      .toMatchObject({
        pvMorphologyPressureOwnership:
          "absolute-intracavitary-node-pressure",
        pressureWaveformOwnership: "absolute-node-pressure-LA-LV-Ao",
        constitutiveAndWallWorkPressureOwnership: "transmural",
        totalBloodVolumeOwnership: "protocol-readback-only",
      });
  });

  it("retains raw cold-start endpoints but withholds boundary physiology", () => {
    const first = exactResult.retainedCompleteBeats[0]!;
    const coldOnly = Object.freeze({
      ...exactResult,
      retainedCompleteBeats: Object.freeze([first]),
    });
    const review = buildMainWireNormalAdultFiveWallPeriodicReviewV2(coldOnly);

    expect(review).toMatchObject({
      status: "not-measurable",
      reason: "missing-preceding-diagnostic",
      boundary: {
        status: "accepted-endpoints-only",
        detail: "cold-start",
      },
      cycleDiagnostics: null,
      acceptedTimebase: {
        nominalGridCount: 50,
        acceptedIntervalCount: 52,
        precedingBoundary: null,
      },
    });
    expect(review.acceptedTimebase.endpoints).toHaveLength(52);
    expect(review.summary.rawRanges.chamberVolumeMl.LA.maximum)
      .toBeGreaterThan(review.summary.rawRanges.chamberVolumeMl.LA.minimum);
    expect(review.pvPaths.LA.points).toHaveLength(52);
    expect(review.pvPaths.LA.drawableRealSegmentCount).toBe(51);
    expect(review.pvPaths.LA.missingFirstIntervalSegment).toBe(true);
    expect(review.pvPaths.LA.phasePaths).toBeNull();
    expect(review.pvPaths.LA.artificialClosingSegmentAdded).toBe(false);
  });

  it("renders the six small raw panels and embeds review provenance", () => {
    const rendered = renderMainWireNormalAdultFiveWallPeriodicReviewV2(
      exactResult,
    );

    expect(rendered.html).toContain(
      "Accepted-interval five-wall physiology review",
    );
    expect(rendered.html).toContain("Latest group-wise closure");
    expect(rendered.html).toContain("Exact accepted calcium events");
    expect(rendered.html).toContain("Claim boundaries");
    expect(rendered.html).toContain('id="periodic-review-v2-data"');
    expect(rendered.svg).toContain('role="img"');
    expect(rendered.svg).toContain("Group-wise beat closure");
    expect(rendered.svg).toContain("Ca event state");
    expect(rendered.svg).toContain("LA absolute intracavitary-pressure PV");
    expect(rendered.svg).toContain("LV absolute intracavitary-pressure PV");
    expect(rendered.svg).toContain(
      "Left-heart absolute node pressures (LA/LV/Ao)",
    );
    expect(rendered.html).toContain(
      "Transmural pressure remains the constitutive-law and wall-work owner",
    );
    expect(rendered.html).toContain(
      "Total blood volume is protocol/audit readback only",
    );
    expect(rendered.svg).toContain("Ca LVFW+SEP+RVFW");
    expect(rendered.svg).toContain(
      "Valve and aggregate pulmonary-venous flows",
    );
    expect(rendered.svg).toContain(
      "Accepted interval duration and exact Ca events",
    );
    expect(rendered.svg).toContain("<polyline");
    expect(rendered.svg).not.toMatch(/<path\b/);
    expect(rendered.svg).not.toMatch(/\b(?:C|S|Q|T)\s*-?\d/);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_REVIEW_CLAIM_V2
      .timeSeriesResamplingOrInterpolationApplied).toBe(false);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_REVIEW_CLAIM_V2
      .artificialLastEndpointToFirstEndpointSegmentAdded).toBe(false);

    const embedded = rendered.html.match(
      /<script type="application\/json" id="periodic-review-v2-data">([^<]+)<\/script>/,
    )?.[1];
    expect(embedded).toBeDefined();
    const parsed = JSON.parse(embedded!);
    expect(parsed.acceptedTimebase.endpoints).toHaveLength(52);
    expect(parsed.acceptedTimebase.precedingBoundary.phase01).toBe(0);
  });

  it("keeps the analytic control on 50 accepted intervals", () => {
    const review = buildMainWireNormalAdultFiveWallPeriodicReviewV2(
      analyticResult,
    );
    expect(review.status).toBe("complete");
    if (review.status !== "complete") throw new Error("expected complete");
    expect(review.acceptedTimebase).toMatchObject({
      nominalGridCount: 50,
      acceptedIntervalCount: 50,
    });
    expect(review.acceptedTimebase.endpoints).toHaveLength(50);
    expect(review.pvPaths.LA.points).toHaveLength(51);
    expect(review.pvPaths.LA.drawableRealSegmentCount).toBe(50);
    expect(review.pvPaths.LA.artificialClosingSegmentAdded).toBe(false);
  });
});
