import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runFourChamberSourceReservoirContractReviewBenchV1,
  type FourChamberSourceReservoirContractReviewReportV1,
} from "@/engine/mechanics2/benches/FourChamberSourceReservoirContractReviewBench";
import sourceReservoirContractReport
  from "@/data/mechanics2/reports/four-chamber-source-reservoir-contract-review-report-v1.json";

describe("FourChamberSourceReservoirContractReviewBench V1", () => {
  let report: FourChamberSourceReservoirContractReviewReportV1;

  beforeAll(() => {
    report = runFourChamberSourceReservoirContractReviewBenchV1();
  }, 180_000);

  it("promotes source-ledger normalization only to a source/reservoir contract signal", () => {
    expect(report.decision.sourceReservoirContractStatus).toBe("source-reservoir-contract-review-signal");
    expect(report.summary).toMatchObject({
      smoothDynamicsPass: true,
      stressRepeatable: true,
      stressPassCount: 3,
      smoothHardLimiterFree: true,
      smoothFeedbackDissipative: true,
      normalizedAssembledSignal: true,
      effectiveEnvelopePassCount: 21,
      dtHalfReservoirParityPassCount: 7,
      normalizedLedgerStatusesCleanCount: 7,
      rawStatusFailuresPreserved: true,
      assembledHardLimiterFree: true,
      sourceReservoirContractPass: true,
    });
  });

  it("keeps raw status-rate source failures visible instead of claiming raw success", () => {
    expect(report.summary.rawDtHalfFailureProfiles).toEqual([
      "preload-low",
      "afterload-high",
      "contractility-low",
    ]);
    expect(report.preservedRawResiduals.map((residual) => residual.profileId)).toEqual([
      "preload-low",
      "afterload-high",
      "contractility-low",
    ]);
    expect(report.preservedRawResiduals.every((residual) => residual.normalizedLedgerClean)).toBe(true);
  });

  it("does not unlock runtime, AV-plane, LandAtrial, or atrial-fiber implementation", () => {
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.trueFourChamberDynamics).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.reservoirBroadRetuning).toBe(false);
    expect(report.claimBoundary.directPvOutflowTransfer).toBe(false);
    expect(report.claimBoundary.atrialFiberPackImplementation).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed source/reservoir contract artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(sourceReservoirContractReport, report);
  });
});
