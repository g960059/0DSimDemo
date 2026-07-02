import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runFourChamberSourceAwareResidualReviewBenchV1,
  type FourChamberSourceAwareResidualReviewReportV1,
} from "@/engine/mechanics2/benches/FourChamberSourceAwareResidualReviewBench";
import sourceAwareResidualReviewReport
  from "@/data/mechanics2/reports/four-chamber-source-aware-residual-review-report-v1.json";

describe("MechanicsCore2 four-chamber source-aware residual review bench", () => {
  let report: FourChamberSourceAwareResidualReviewReportV1;

  beforeAll(() => {
    report = runFourChamberSourceAwareResidualReviewBenchV1();
  }, 120_000);

  it("classifies four-chamber residuals after source-surface contract evidence", () => {
    expect(report.decision.sourceAwareReviewStatus).toBe("source-aware-four-chamber-review-actionable");
    expect(report.inputs).toMatchObject({
      rawResidualReviewReportId: "four-chamber-subsystem-residual-review-report-v1",
      sourceContractReportId: "source-surface-contract-report-v1",
      rightOutflowOwnershipReportId: "right-preload-outflow-ownership-report-v1",
      leftSourceCandidateId: "left-afterload-active-reserve103",
      rightOutflowLeadId: "pv-resistance150",
    });
    expect(report.summary).toMatchObject({
      rawFailedProfileCount: 4,
      rawLeftFailureReclassifiedCount: 1,
      sourceLeadExistsButDirectTransferBlockedCount: 1,
      coupledReservoirOrPhenotypeBlockerCount: 2,
      sourceAwareUnblockedCount: 2,
    });
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.reservoirTuningReopened).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps preload-low split between left sampling parity and right outflow ownership", () => {
    const preloadLow = requiredClassification(report, "dt-half", "preload-low");
    expect(preloadLow.rawFailureReasons).toEqual([
      "left-surface-not-preserved",
      "right-surface-not-preserved",
    ]);
    expect(preloadLow.owners).toEqual([
      "left-source-phase-aligned-sampling-parity",
      "right-source-pv-outflow-lead-not-directly-transferable",
    ]);
    expect(preloadLow.sourceAwareDisposition).toBe("source-lead-exists-but-direct-transfer-blocked");
    expect(preloadLow.leftSource?.sourceStatus).toBe("pass");
    expect(preloadLow.leftSource?.phaseAlignedShapeParityOk).toBe(true);
    expect(preloadLow.rightSource?.sourceStatus).toBe("fail");
    expect(preloadLow.rightSource?.sourceFailureReasons).toEqual([
      "beat-repeatability-failed",
      "dt-half-output-parity-failed",
    ]);
  });

  it("separates left afterload output reserve from coupled phenotype and reservoir blockers", () => {
    const afterloadHigh = requiredClassification(report, "dt-half", "afterload-high");
    expect(afterloadHigh.owners).toEqual(["left-source-load-conditioned-output-reserve"]);
    expect(afterloadHigh.sourceAwareDisposition).toBe("raw-left-failure-reclassified");
    expect(afterloadHigh.leftSource?.sourceStatus).toBe("pass");
    expect(afterloadHigh.leftSource?.outputOk).toBe(true);

    const contractilityLow = requiredClassification(report, "dt-half", "contractility-low");
    expect(contractilityLow.owners).toEqual(["right-low-output-phenotype-scope-under-coupling"]);
    expect(contractilityLow.sourceAwareDisposition).toBe("coupled-reservoir-or-phenotype-blocker");
    expect(contractilityLow.leftSource?.acceptedPhenotypeReasons).toEqual([
      "clean-low-contractility-low-output-phenotype",
    ]);
    expect(contractilityLow.rightSource?.acceptedPhenotypeReasons).toEqual([
      "clean-low-contractility-low-output-phenotype",
    ]);

    const longPreloadLow = requiredClassification(report, "long-epochs", "preload-low");
    expect(longPreloadLow.owners).toEqual(["reservoir-repeatability"]);
    expect(longPreloadLow.sourceAwareDisposition).toBe("coupled-reservoir-or-phenotype-blocker");
  });

  it("keeps the committed source-aware residual review artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(sourceAwareResidualReviewReport, report);
  });
});

function requiredClassification(
  report: FourChamberSourceAwareResidualReviewReportV1,
  scenarioId: "dt-half" | "long-epochs",
  profileId: FourChamberSourceAwareResidualReviewReportV1["residualClassifications"][number]["profileId"],
): FourChamberSourceAwareResidualReviewReportV1["residualClassifications"][number] {
  const classification = report.residualClassifications.find((entry) =>
    entry.scenarioId === scenarioId && entry.profileId === profileId);
  if (classification == null) throw new Error(`Missing classification ${scenarioId}/${profileId}`);
  return classification;
}
