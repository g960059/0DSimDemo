import { describe, expect, it } from "vitest";
import {
  runPairedHeartStrategicSmokeBenchV1,
} from "@/engine/mechanics2/benches/PairedHeartStrategicSmokeBench";
import pairedHeartReport from "@/data/mechanics2/reports/paired-heart-strategic-smoke-report-v1.json";

describe("MechanicsCore2 paired-heart strategic smoke bench", () => {
  it("keeps passed left and right Gate B surfaces paired without circulation claims", () => {
    const report = runPairedHeartStrategicSmokeBenchV1();

    expect(report.decision.pairedHeartGateStatus).toBe("paired-heart-smoke-pass");
    expect(report.sourceSurfaces.leftVariantId).toBe("active-length-mv-closure-stateful-root08");
    expect(report.summary).toMatchObject({
      total: 7,
      pass: 7,
      fail: 0,
      inconclusive: 0,
      leftPassCount: 7,
      rightPassCount: 7,
      pairedAcceptedPhenotypeCount: 1,
    });
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.circulationCoupling).toBe(false);
    expect(report.claimBoundary.fourChamberUnlock).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);

    const lowContractility = report.pointResults.find((point) => point.profileId === "contractility-low")!;
    expect(lowContractility.status).toBe("pass");
    expect(lowContractility.leftAcceptedPhenotypeReasons).toEqual(["clean-low-contractility-low-output-phenotype"]);
    expect(lowContractility.rightAcceptedPhenotypeReasons).toEqual([]);
  });

  it("keeps the committed paired-heart artifact aligned with the rerun summary", () => {
    const report = runPairedHeartStrategicSmokeBenchV1();
    expect(pairedHeartReport.reportId).toBe(report.reportId);
    expect(pairedHeartReport.summary).toEqual(report.summary);
    expect(pairedHeartReport.decision).toEqual(report.decision);
    expect(typeof pairedHeartReport.normalizedSha256).toBe("string");
    expect(pairedHeartReport.normalizedSha256).toHaveLength(64);
  });
});
