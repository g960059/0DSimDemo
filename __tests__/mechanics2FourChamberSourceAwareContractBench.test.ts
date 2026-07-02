import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runFourChamberSourceAwareContractBenchV1,
  type FourChamberSourceAwareContractReportV1,
} from "@/engine/mechanics2/benches/FourChamberSourceAwareContractBench";
import sourceAwareContractReport from "@/data/mechanics2/reports/four-chamber-source-aware-contract-report-v1.json";

describe("MechanicsCore2 four-chamber source-aware contract bench", () => {
  let report: FourChamberSourceAwareContractReportV1;

  beforeAll(() => {
    report = runFourChamberSourceAwareContractBenchV1();
  }, 120_000);

  it("finds a source-aware contract signal while keeping runtime and atrial work blocked", () => {
    expect(report.decision.sourceAwareContractStatus).toBe("source-aware-four-chamber-contract-signal");
    expect(report.summary).toMatchObject({
      bestPolicyId: "left-right-source-aware-with-phenotype-scope",
      bestTotalPassCount: 20,
      bestRemainingResidualKeys: ["long-epochs/preload-low"],
      nominalPassCount: 7,
      policyCount: 4,
    });
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.trueFourChamberDynamics).toBe(false);
    expect(report.claimBoundary.reservoirTuningReopened).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps policy improvements staged instead of hiding raw residuals", () => {
    expect(requiredPolicy(report, "raw-reference").summary).toMatchObject({
      totalPassCount: 17,
      dtHalfPassCount: 4,
      longEpochPassCount: 6,
      remainingResidualCount: 4,
    });
    expect(requiredPolicy(report, "left-source-aware").summary).toMatchObject({
      totalPassCount: 18,
      dtHalfPassCount: 5,
      longEpochPassCount: 6,
      remainingResidualCount: 3,
    });
    expect(requiredPolicy(report, "left-right-preload-source-aware").summary).toMatchObject({
      totalPassCount: 19,
      dtHalfPassCount: 6,
      longEpochPassCount: 6,
      remainingResidualCount: 2,
    });
  });

  it("isolates long-epoch preload-low reservoir repeatability as the remaining blocker", () => {
    const best = requiredPolicy(report, "left-right-source-aware-with-phenotype-scope");
    expect(best.summary).toMatchObject({
      totalPassCount: 20,
      dtHalfPassCount: 7,
      longEpochPassCount: 6,
      resolvedResidualCount: 3,
      remainingResidualCount: 1,
      remainingResidualKeys: ["long-epochs/preload-low"],
    });

    const longPreload = best.effectiveResiduals.find((residual) =>
      residual.scenarioId === "long-epochs" && residual.profileId === "preload-low");
    expect(longPreload?.status).toBe("fail");
    expect(longPreload?.effectiveFailureReasons).toEqual(["persistent-large-reservoir-shuttle"]);

    const dtContractilityLow = best.effectiveResiduals.find((residual) =>
      residual.scenarioId === "dt-half" && residual.profileId === "contractility-low");
    expect(dtContractilityLow?.removedFailureReasons).toEqual([
      "right-surface-not-preserved",
      "unexpected-accepted-phenotype",
    ]);
    expect(dtContractilityLow?.status).toBe("pass");
  });

  it("keeps the committed source-aware contract artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(sourceAwareContractReport, report);
  });
});

function requiredPolicy(
  report: FourChamberSourceAwareContractReportV1,
  policyId: FourChamberSourceAwareContractReportV1["policyResults"][number]["policyId"],
): FourChamberSourceAwareContractReportV1["policyResults"][number] {
  const policy = report.policyResults.find((entry) => entry.policyId === policyId);
  if (policy == null) throw new Error(`Missing policy ${policyId}`);
  return policy;
}
