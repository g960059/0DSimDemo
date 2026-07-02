import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialLobeFailureAttributionBenchV1,
  type AtrialLobeFailureAttributionReportV1,
} from "@/engine/mechanics2/benches/AtrialLobeFailureAttributionBench";
import attributionReport
  from "@/data/mechanics2/reports/atrial-lobe-failure-attribution-report-v1.json";

describe("AtrialLobeFailureAttributionBench V1", () => {
  let report: AtrialLobeFailureAttributionReportV1;

  beforeAll(() => {
    report = runAtrialLobeFailureAttributionBenchV1();
  }, 600_000);

  it("classifies warm-replayed lobe quality as blocked rather than promoted", () => {
    expect(report.decision.atrialLobeFailureAttributionStatus)
      .toBe("atrial-lobe-failure-attribution-blocked");
    expect(report.summary).toMatchObject({
      totalRows: 28,
      totalLobeQualityPass: 1,
      totalBasicFigureEightPass: 14,
      laFiberLobeQualityPass: 1,
      raFiberLobeQualityPass: 0,
      currentPressureLobeQualityPass: 0,
      dominantFailureCounts: {
        pass: 1,
        "missing-self-intersection": 14,
        "same-signed-lobes": 13,
        "small-a-loop": 0,
        "small-v-loop": 0,
        "volume-order-fail": 0,
        "pressure-pulse-low": 0,
      },
    });
  });

  it("separates current-pressure missing intersections from fiber same-signed lobes", () => {
    const laCurrent = report.summaries.find((summary) =>
      summary.chamberId === "LA" && summary.pressureSource === "current-source-pressure"
    );
    const laFiber = report.summaries.find((summary) =>
      summary.chamberId === "LA" && summary.pressureSource === "atrial-fiber-pressure"
    );
    const raFiber = report.summaries.find((summary) =>
      summary.chamberId === "RA" && summary.pressureSource === "atrial-fiber-pressure"
    );

    expect(laCurrent).toMatchObject({
      lobeQualityPass: 0,
      basicFigureEightPass: 1,
      opposedLobes: 0,
      dominantFailureCounts: {
        "missing-self-intersection": 6,
        "same-signed-lobes": 1,
      },
    });
    expect(laFiber).toMatchObject({
      lobeQualityPass: 1,
      basicFigureEightPass: 6,
      opposedLobes: 2,
      dominantFailureCounts: {
        pass: 1,
        "missing-self-intersection": 1,
        "same-signed-lobes": 5,
      },
    });
    expect(raFiber).toMatchObject({
      lobeQualityPass: 0,
      basicFigureEightPass: 7,
      opposedLobes: 0,
      meanVolumeSeparationMl: -5.804361,
      dominantFailureCounts: {
        "same-signed-lobes": 7,
      },
    });
  });

  it("keeps runtime, pressure substitution, AV-plane, a-prime, and LandAtrial blocked", () => {
    expect(report.decision.blockedClaims).toEqual(expect.arrayContaining([
      "runtime-wiring",
      "atrial-pressure-substitution",
      "morphology-acceptance",
      "AV-plane-enable",
      "a-prime-physiology",
      "LandAtrial-unlock",
    ]));
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.pressureSubstitution).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneEnablement).toBe(false);
    expect(report.claimBoundary.aPrimePhysiologyClaim).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed atrial lobe failure attribution artifact aligned", () => {
    expectMechanics2ReportArtifactParity(attributionReport, report);
  });
});
