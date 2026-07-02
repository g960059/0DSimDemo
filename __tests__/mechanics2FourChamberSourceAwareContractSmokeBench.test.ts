import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runFourChamberSourceAwareContractSmokeBenchV1,
  type FourChamberSourceAwareContractSmokeReportV1,
} from "@/engine/mechanics2/benches/FourChamberSourceAwareContractSmokeBench";
import sourceAwareContractSmokeReport
  from "@/data/mechanics2/reports/four-chamber-source-aware-contract-smoke-report-v1.json";

describe("MechanicsCore2 four-chamber source-aware contract smoke bench", () => {
  let report: FourChamberSourceAwareContractSmokeReportV1;

  beforeAll(() => {
    report = runFourChamberSourceAwareContractSmokeBenchV1();
  }, 120_000);

  it("keeps the source-aware contract smoke blocked only on reservoir repeatability", () => {
    expect(report.decision.contractSmokeStatus)
      .toBe("source-aware-four-chamber-contract-smoke-reservoir-repeatability-blocked");
    expect(report.inputs).toMatchObject({
      sourceAwareContractReportId: "four-chamber-source-aware-contract-report-v1",
      selectedPolicyId: "left-right-source-aware-with-phenotype-scope",
    });
    expect(report.summary).toMatchObject({
      totalPassCount: 20,
      total: 21,
      remainingBlockerCount: 1,
      remainingReservoirRepeatabilityBlockerCount: 1,
      maxRemainingReservoirVolumeMl: 28.509668,
      maxRemainingReservoirStepMl: 1.15894,
    });
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.trueFourChamberDynamics).toBe(false);
    expect(report.claimBoundary.reservoirTuningReopened).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("preserves nominal and dt-half contract pass while identifying the long preload-low blocker", () => {
    expect(report.scenarioSummaries).toEqual([
      { scenarioId: "nominal", passCount: 7, failCount: 0, total: 7 },
      { scenarioId: "dt-half", passCount: 7, failCount: 0, total: 7 },
      { scenarioId: "long-epochs", passCount: 6, failCount: 1, total: 7 },
    ]);
    expect(report.remainingBlockers).toEqual([{
      scenarioId: "long-epochs",
      profileId: "preload-low",
      effectiveFailureReasons: ["persistent-large-reservoir-shuttle"],
      rawFailureReasons: ["persistent-large-reservoir-shuttle"],
      absForwardMismatchMl: 8.279053,
      maxAbsReservoirVolumeMl: 28.509668,
      finalReservoirStepMl: 1.15894,
      maxAbsAcceptedTransferMl: 1.771959,
      pulmonaryVenousPressureAdjustmentMmHg: -0.356371,
      systemicPressureAdjustmentMmHg: 0.178185,
    }]);
  });

  it("keeps the committed source-aware contract smoke artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(sourceAwareContractSmokeReport, report);
  });
});
