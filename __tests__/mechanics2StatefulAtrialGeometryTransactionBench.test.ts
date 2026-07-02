import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runStatefulAtrialGeometryTransactionBenchV1,
  type StatefulAtrialGeometryTransactionReportV1,
} from "@/engine/mechanics2/benches/StatefulAtrialGeometryTransactionBench";
import transactionReport
  from "@/data/mechanics2/reports/stateful-atrial-geometry-transaction-report-v1.json";

describe("StatefulAtrialGeometryTransactionBench V1", () => {
  let report: StatefulAtrialGeometryTransactionReportV1;

  beforeAll(() => {
    report = runStatefulAtrialGeometryTransactionBenchV1();
  }, 600_000);

  it("keeps the stateful atrial geometry transaction surface blocked", () => {
    expect(report.decision.statefulAtrialGeometryTransactionStatus)
      .toBe("stateful-atrial-geometry-transaction-blocked");
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      bestVariantId: "no-geometry-fixed-pressure",
      bestSourceSurfacePass: 0,
      bestContractPass: 0,
      bestLaPvLobeQualityPass: 1,
      bestMvfCleanCount: 3,
      bestHiddenVolumeCleanCount: 7,
      bestAPrimeReadbackPresentCount: 0,
    });
  });

  it("shows stateful geometry readbacks do not recover lobe quality", () => {
    const geometry = report.variantSummaries.find((variant) =>
      variant.variantId === "capacity-geometry-gain12-fixed-pressure"
    );
    expect(geometry).toMatchObject({
      laPvLobeQualityPass: 1,
      mvfCleanCount: 3,
      hiddenVolumeCleanCount: 7,
      aPrimeReadbackPresentCount: 7,
      laPvSelfIntersectionCount: 6,
      laPvOpposedLobeCount: 1,
      maxLaPvALoopArea: 83.570649,
      maxLaPvVLoopArea: 23.07385,
      maxLaPvVolumeSeparationMl: 17.64706,
      meanMaxAtrialGeometryDeltaMl: 5.643378,
      maxAPrimePeakAbsCmPerSec: 1.347032,
    });
  });

  it("keeps runtime, AV-plane enablement, a-prime physiology, and LandAtrial blocked", () => {
    expect(report.decision.blockedClaims).toEqual(expect.arrayContaining([
      "runtime-wiring",
      "morphology-acceptance",
      "AV-plane-enable",
      "a-prime-physiology",
      "LandAtrial-unlock",
    ]));
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneEnablement).toBe(false);
    expect(report.claimBoundary.aPrimePhysiologyClaim).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed stateful atrial geometry transaction artifact aligned", () => {
    expectMechanics2ReportArtifactParity(transactionReport, report);
  });
});
