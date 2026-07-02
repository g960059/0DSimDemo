import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runFourChamberPvOutflowTransferReviewBenchV1,
  type FourChamberPvOutflowTransferReviewReportV1,
} from "@/engine/mechanics2/benches/FourChamberPvOutflowTransferReviewBench";
import pvOutflowTransferReviewReport
  from "@/data/mechanics2/reports/four-chamber-pv-outflow-transfer-review-report-v1.json";

describe("MechanicsCore2 four-chamber PV outflow transfer review bench", () => {
  let report: FourChamberPvOutflowTransferReviewReportV1;

  beforeAll(() => {
    report = runFourChamberPvOutflowTransferReviewBenchV1();
  }, 120_000);

  it("rejects direct transfer of the standalone right-preload PV outflow lead into the four-chamber scaffold", () => {
    expect(report.decision.pvOutflowTransferStatus).toBe("pv-outflow-direct-transfer-no-go");
    expect(report.summary).toMatchObject({
      referenceTotalPassCount: 17,
      bestCandidateId: "selected-reference",
      bestTotalPassCount: 17,
      directTransferFullPassCandidateCount: 0,
      dtHalfPreloadRightSurfaceImprovementCount: 4,
    });
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.reservoirTuningReopened).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the standalone pv-resistance150 source lead as a local signal rather than a four-chamber promotion", () => {
    const reference = requiredCandidate(report, "selected-reference");
    expect(reference.summary).toMatchObject({
      totalPassCount: 17,
      nominalPassCount: 7,
      dtHalfPassCount: 4,
      longEpochPassCount: 6,
      improvesDtHalfPreloadRightSurface: false,
      worsensNominalOrLong: false,
    });

    const directTransfer = requiredCandidate(report, "pv-resistance150");
    expect(directTransfer.summary.improvesDtHalfPreloadRightSurface).toBe(true);
    expect(directTransfer.summary.worsensNominalOrLong).toBe(true);
    expect(directTransfer.summary.totalPassCount).toBeLessThan(reference.summary.totalPassCount);
    expect(directTransfer.summary.nominalPassCount).toBeLessThan(reference.summary.nominalPassCount);
    expect(directTransfer.summary.longEpochPassCount).toBeLessThan(reference.summary.longEpochPassCount);

    const dtHalfPreloadLow = requiredProfile(requiredScenario(directTransfer, "dt-half"), "preload-low");
    expect(dtHalfPreloadLow.rightStatus).toBe("pass");
    expect(dtHalfPreloadLow.leftStatus).toBe("fail");
    expect(dtHalfPreloadLow.failureReasons).toContain("left-surface-not-preserved");
  });

  it("records why direct PV outflow variants are not hidden four-chamber fixes", () => {
    for (const candidateId of ["pv-resistance125", "pv-open-tau030", "pv-bernoulli300"] as const) {
      const candidate = requiredCandidate(report, candidateId);
      expect(candidate.summary.improvesDtHalfPreloadRightSurface).toBe(true);
      expect(candidate.summary.worsensNominalOrLong).toBe(true);
      expect(candidate.summary.totalPassCount).toBeLessThan(report.summary.referenceTotalPassCount);
    }

    const bernoulli = requiredCandidate(report, "pv-bernoulli300");
    const dtHalf = requiredScenario(bernoulli, "dt-half");
    expect(dtHalf.summary.passCount).toBe(3);
    expect(requiredProfile(dtHalf, "contractility-high").failureReasons)
      .toContain("left-right-forward-ejection-mismatch");
  });

  it("keeps the committed PV outflow transfer review artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(pvOutflowTransferReviewReport, report);
  });
});

function requiredCandidate(
  report: FourChamberPvOutflowTransferReviewReportV1,
  candidateId: FourChamberPvOutflowTransferReviewReportV1["candidateResults"][number]["candidateId"],
): FourChamberPvOutflowTransferReviewReportV1["candidateResults"][number] {
  const candidate = report.candidateResults.find((entry) => entry.candidateId === candidateId);
  if (candidate == null) throw new Error(`Missing candidate ${candidateId}`);
  return candidate;
}

function requiredScenario(
  candidate: FourChamberPvOutflowTransferReviewReportV1["candidateResults"][number],
  scenarioId: "nominal" | "dt-half" | "long-epochs",
): FourChamberPvOutflowTransferReviewReportV1["candidateResults"][number]["scenarioResults"][number] {
  const scenario = candidate.scenarioResults.find((entry) => entry.scenario.scenarioId === scenarioId);
  if (scenario == null) throw new Error(`Missing scenario ${scenarioId}`);
  return scenario;
}

function requiredProfile(
  scenario: FourChamberPvOutflowTransferReviewReportV1["candidateResults"][number]["scenarioResults"][number],
  profileId: "normal-hr75" | "normal-hr90" | "preload-low" | "preload-high"
    | "afterload-high" | "contractility-low" | "contractility-high",
): FourChamberPvOutflowTransferReviewReportV1["candidateResults"][number]["scenarioResults"][number]["profileResults"][number] {
  const profile = scenario.profileResults.find((entry) => entry.profileId === profileId);
  if (profile == null) throw new Error(`Missing profile ${profileId}`);
  return profile;
}
