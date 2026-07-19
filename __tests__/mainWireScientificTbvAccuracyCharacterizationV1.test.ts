import { describe, expect, it } from "vitest";

import { createMainWireScientificFastTbvPreviewTargetsV1 } from "@/engine/scientific/protocols/MainWireScientificFastTbvPreviewV1";
import {
  MAIN_WIRE_SCIENTIFIC_TBV_ACCURACY_CHARACTERIZATION_POLICY_V1,
  buildMainWireScientificTbvAccuracyCharacterizationV1,
  characterizeMainWireScientificTbvAccuracyPairV1,
  type MainWireScientificTbvAccuracyObservationV1,
  type MainWireScientificTbvAccuracyPairInputV1,
} from "@/engine/scientific/protocols/MainWireScientificTbvAccuracyCharacterizationV1";

const baselineTbvMl = 5_000;

describe("main-wire rapid/canonical TBV accuracy characterization V1", () => {
  it("stores rapid-minus-canonical signed, absolute and floor-stabilized relative errors", () => {
    const input = pairInput("lower-volume", 1, 0.64, {
      rapidObservation: observation({
        "mean-rap-transmural": 0.7,
        "mean-lap-transmural": 8,
      }),
      canonicalObservation: observation({
        "mean-rap-transmural": 0.5,
        "mean-lap-transmural": 10,
      }),
    });
    const characterized = characterizeMainWireScientificTbvAccuracyPairV1(input);

    expect(characterized.comparisonStatus).toBe("paired-p1-complete");
    expect(characterized.tbvBin).toBe("severe-low-volume");
    expect(
      characterized.errors.find(
        ({ metric }) => metric === "mean-rap-transmural",
      ),
    ).toMatchObject({
      rapidValue: 0.7,
      canonicalP1Value: 0.5,
      signedError: expect.closeTo(0.2),
      absoluteError: expect.closeTo(0.2),
      relativeErrorFraction: expect.closeTo(0.2),
      relativeDenominator: 1,
      relativeDenominatorFloor: 1,
      relativeDenominatorFloorApplied: true,
    });
    expect(
      characterized.errors.find(
        ({ metric }) => metric === "mean-lap-transmural",
      ),
    ).toMatchObject({
      signedError: -2,
      absoluteError: 2,
      relativeErrorFraction: 0.2,
      relativeDenominator: 10,
      relativeDenominatorFloorApplied: false,
    });
    expect(
      MAIN_WIRE_SCIENTIFIC_TBV_ACCURACY_CHARACTERIZATION_POLICY_V1
        .pressureRelativeErrorCaveat,
    ).toContain("1 mmHg denominator floor");
  });

  it("keeps baseline separate and excludes P2/failure outcomes from metric distributions", () => {
    const pairs = fixedGridPairs();
    pairs[0] = pairInput("lower-volume", 1, 0.88, {
      canonicalStatus: "period2-suspect",
      canonicalAccepted: false,
    });
    pairs[1] = pairInput("lower-volume", 2, 0.82, {
      rapidCompletedNaturalBeatCount: 4,
    });
    pairs[5] = pairInput("higher-volume", 1, 1.075, {
      rapidEvidenceClass: "failure",
      rapidObservation: null,
    });
    pairs[8] = pairInput("higher-volume", 4, 1.3, {
      canonicalStatus: "step-failure",
      canonicalAccepted: false,
      canonicalObservation: null,
    });

    const report = buildMainWireScientificTbvAccuracyCharacterizationV1({
      sourceFingerprint: "sha256:test",
      sourceSessionUnchanged: true,
      benchmarkWallClockMs: 900,
      baseline: {
        role: "canonical-source-baseline-reference",
        targetScale: 1,
        fixedTotalBloodVolumeMl: baselineTbvMl,
        canonicalStatus: "period1-converged",
        completedBeatCount: 1,
        wallClockMs: 10,
        observation: observation(),
      },
      pairs,
    });

    expect(report.claimBoundary).toEqual({
      characterizationIsAnAccuracyAcceptanceGate: false,
      characterizationChangesProductionScientificClaims: false,
      rapidPointsAreCanonicalPeriodicSolutions: false,
      nonP1CanonicalPointsEnterErrorStatistics: false,
      baselineEntersRapidErrorStatistics: false,
    });
    expect(report.baseline.targetScale).toBe(1);
    expect(report.summary).toMatchObject({
      targetPairCount: 9,
      pairedP1CompleteCount: 6,
      rapidFailureCount: 1,
      canonicalPeriod2Count: 1,
      canonicalFailureCount: 1,
    });
    const rap = report.summary.metrics.find(
      ({ metric }) => metric === "mean-rap-transmural",
    );
    expect(rap?.overall.observationCount).toBe(6);
    expect(rap?.byLane["lower-volume"].observationCount).toBe(4);
    expect(rap?.byLane["higher-volume"].observationCount).toBe(2);
    expect(
      rap?.byTbvBin.find(({ tbvBin }) => tbvBin === "severe-high-volume")
        ?.distribution.observationCount,
    ).toBe(0);
    expect(report.summary.timing).toMatchObject({
      baselineWallClockMs: 10,
      rapidTargetWallClockMs: 18,
      canonicalTargetWallClockMs: 90,
      rapidCompletedNaturalBeatCount: 18,
      canonicalCompletedBeatCount: 180,
    });
    expect(report.summary.timing.byRapidCompletedNaturalBeatCount).toEqual([
      {
        completedNaturalBeatCount: 0,
        targetPairCount: 1,
        rapidWallClockMs: 2,
        canonicalWallClockMs: 10,
      },
      {
        completedNaturalBeatCount: 2,
        targetPairCount: 7,
        rapidWallClockMs: 14,
        canonicalWallClockMs: 70,
      },
      {
        completedNaturalBeatCount: 4,
        targetPairCount: 1,
        rapidWallClockMs: 2,
        canonicalWallClockMs: 10,
      },
    ]);
    expect(
      rap?.byRapidCompletedNaturalBeatCount.find(
        ({ completedNaturalBeatCount }) => completedNaturalBeatCount === 4,
      )?.distribution.observationCount,
    ).toBe(1);
  });

  it("fails closed when the report is not the fixed nine-target rapid grid", () => {
    expect(() =>
      buildMainWireScientificTbvAccuracyCharacterizationV1({
        sourceFingerprint: "sha256:test",
        sourceSessionUnchanged: true,
        benchmarkWallClockMs: 1,
        baseline: {
          role: "canonical-source-baseline-reference",
          targetScale: 1,
          fixedTotalBloodVolumeMl: baselineTbvMl,
          canonicalStatus: "period1-converged",
          completedBeatCount: 1,
          wallClockMs: 1,
          observation: observation(),
        },
        pairs: fixedGridPairs().slice(0, 8),
      }),
    ).toThrow("fixed nine-target rapid grid");
  });

  it("projects the production rapid/canonical lane barriers separately", () => {
    const targets = createMainWireScientificFastTbvPreviewTargetsV1(baselineTbvMl);
    const pairs = (["lower-volume", "higher-volume"] as const).flatMap((lane) =>
      targets[lane].map((target) =>
        pairInput(lane, target.targetOrdinal, target.targetScale, {
          rapidWallClockMs: lane === "lower-volume" ? 10 : 1,
          canonicalWallClockMs: lane === "lower-volume" ? 1 : 10,
        }),
      ),
    );
    const report = buildMainWireScientificTbvAccuracyCharacterizationV1({
      sourceFingerprint: "sha256:test",
      sourceSessionUnchanged: true,
      benchmarkWallClockMs: 100,
      baseline: {
        role: "canonical-source-baseline-reference",
        targetScale: 1,
        fixedTotalBloodVolumeMl: baselineTbvMl,
        canonicalStatus: "period1-converged",
        completedBeatCount: 1,
        wallClockMs: 10,
        observation: observation(),
      },
      pairs,
    });

    // 10 ms baseline + max(5*10, 4*1) rapid + max(5*1, 4*10) canonical.
    expect(report.summary.timing.projectedTwoLaneWallClockMs).toBe(100);
  });
});

function fixedGridPairs(): MainWireScientificTbvAccuracyPairInputV1[] {
  const targets = createMainWireScientificFastTbvPreviewTargetsV1(baselineTbvMl);
  return (["lower-volume", "higher-volume"] as const).flatMap((lane) =>
    targets[lane].map((target) =>
      pairInput(lane, target.targetOrdinal, target.targetScale),
    ),
  );
}

function pairInput(
  lane: "lower-volume" | "higher-volume",
  targetOrdinal: number,
  targetScale: number,
  options: Readonly<{
    rapidEvidenceClass?:
      | "near-period1-estimate"
      | "finite-hold-unclassified"
      | "failure";
    rapidObservation?: MainWireScientificTbvAccuracyObservationV1 | null;
    canonicalStatus?:
      | "period1-converged"
      | "period2-suspect"
      | "not-converged"
      | "maximum-beats-reached"
      | "step-failure";
    canonicalAccepted?: boolean;
    canonicalObservation?: MainWireScientificTbvAccuracyObservationV1 | null;
    rapidCompletedNaturalBeatCount?: number;
    rapidWallClockMs?: number;
    canonicalWallClockMs?: number;
  }> = {},
): MainWireScientificTbvAccuracyPairInputV1 {
  const rapidEvidenceClass =
    options.rapidEvidenceClass ?? "finite-hold-unclassified";
  const canonicalStatus = options.canonicalStatus ?? "period1-converged";
  return {
    pairId: `${lane}-${targetOrdinal}`,
    targetId: `target-${lane}-${targetOrdinal}`,
    lane,
    targetOrdinal,
    targetScale,
    fixedTotalBloodVolumeMl: baselineTbvMl * targetScale,
    rapid: {
      evidenceClass: rapidEvidenceClass,
      completedNaturalBeatCount:
        options.rapidCompletedNaturalBeatCount ??
        (rapidEvidenceClass === "failure" ? 0 : 2),
      wallClockMs: options.rapidWallClockMs ?? 2,
      latestPeriod1MaximumNormalizedDelta: 0.1,
      failureReason: rapidEvidenceClass === "failure" ? "rapid failed" : null,
      observation:
        options.rapidObservation === undefined
          ? rapidEvidenceClass === "failure"
            ? null
            : observation({ "mean-rap-transmural": 3 })
          : options.rapidObservation,
    },
    canonical: {
      status: canonicalStatus,
      acceptedForPeriod1Locus:
        options.canonicalAccepted ?? canonicalStatus === "period1-converged",
      completedBeatCount: 20,
      wallClockMs: options.canonicalWallClockMs ?? 10,
      latestPeriod1MaximumNormalizedDelta: 0.0005,
      latestPeriod2MaximumNormalizedDelta: null,
      failureReason:
        canonicalStatus === "step-failure" ? "canonical failed" : null,
      observation:
        options.canonicalObservation === undefined
          ? observation({ "mean-rap-transmural": 2 })
          : options.canonicalObservation,
    },
  };
}

function observation(
  overrides: Partial<MainWireScientificTbvAccuracyObservationV1> = {},
): MainWireScientificTbvAccuracyObservationV1 {
  return {
    "mean-rap-transmural": 2,
    "mean-lap-transmural": 8,
    "net-cardiac-output": 5,
    "forward-cardiac-output": 5.1,
    "lv-end-diastolic-volume": 140,
    "lv-end-diastolic-transmural-pressure": 8,
    "lv-end-systolic-volume": 60,
    "lv-end-systolic-transmural-pressure": 100,
    "lv-stroke-work": 8_000,
    ...overrides,
  };
}
