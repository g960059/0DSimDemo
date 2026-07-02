import { beforeAll, describe, expect, it } from "vitest";
import {
  runFourChamberDtHalfSourceAttributionBenchV1,
  type FourChamberDtHalfSourceAttributionReportV1,
} from "@/engine/mechanics2/benches/FourChamberDtHalfSourceAttributionBench";
import dtHalfSourceAttributionReport from "@/data/mechanics2/reports/four-chamber-dthalf-source-attribution-report-v1.json";

describe("MechanicsCore2 four-chamber dt-half source attribution bench", () => {
  let report: FourChamberDtHalfSourceAttributionReportV1;

  beforeAll(() => {
    report = runFourChamberDtHalfSourceAttributionBenchV1();
  }, 90_000);

  it("classifies dt-half surface losses before changing reservoir or source contracts", () => {
    expect(report.summary.profileCount).toBe(3);
    expect(report.summary).toMatchObject({
      subsystemFailedSideCount: 4,
      standaloneDtHalfSourceFailureCount: 4,
      reservoirPressurePerturbationFailureCount: 0,
      subsystemCouplingOnlyCount: 0,
    });
    expect(report.decision.attributionStatus).toBe("dt-half-source-attribution-standalone-source");
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.trueFourChamberDynamics).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);

    const preloadLow = report.profileResults.find((profile) => profile.profileId === "preload-low")!;
    expect(preloadLow.left.attribution).toBe("standalone-dt-half-source-fails");
    expect(preloadLow.left.baseFailureReasons).toEqual(["dt-half-shape-parity-failed"]);
    expect(preloadLow.right.attribution).toBe("standalone-dt-half-source-fails");
    expect(preloadLow.right.baseFailureReasons).toEqual([
      "beat-repeatability-failed",
      "dt-half-output-parity-failed",
    ]);

    const afterloadHigh = report.profileResults.find((profile) => profile.profileId === "afterload-high")!;
    expect(afterloadHigh.left.attribution).toBe("standalone-dt-half-source-fails");
    expect(afterloadHigh.left.baseFailureReasons).toEqual(["output-aov-ejected-volume-too-low"]);
    expect(afterloadHigh.right.attribution).toBe("not-subsystem-failed");

    const contractilityLow = report.profileResults.find((profile) => profile.profileId === "contractility-low")!;
    expect(contractilityLow.left.attribution).toBe("not-subsystem-failed");
    expect(contractilityLow.right.attribution).toBe("standalone-dt-half-source-fails");
    expect(contractilityLow.right.baseFailureReasons).toEqual([
      "output-stroke-volume-too-low",
      "output-pv-ejected-volume-too-low",
      "dt-half-shape-parity-failed",
    ]);
  });

  it("keeps the committed dt-half attribution artifact aligned with the rerun summary", () => {
    expect(dtHalfSourceAttributionReport.reportId).toBe(report.reportId);
    expect(dtHalfSourceAttributionReport.summary).toEqual(report.summary);
    expect(dtHalfSourceAttributionReport.decision).toEqual(report.decision);
    expect(typeof dtHalfSourceAttributionReport.normalizedSha256).toBe("string");
    expect(dtHalfSourceAttributionReport.normalizedSha256).toHaveLength(64);
  });
});
