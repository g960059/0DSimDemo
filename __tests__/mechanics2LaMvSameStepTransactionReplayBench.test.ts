import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runLaMvSameStepTransactionReplayBenchV1,
  type LaMvSameStepTransactionReplayReportV1,
} from "@/engine/mechanics2/benches/LaMvSameStepTransactionReplayBench";
import replayReport
  from "@/data/mechanics2/reports/la-mv-same-step-transaction-replay-report-v1.json";

describe("LaMvSameStepTransactionReplayBench V1", () => {
  let report: LaMvSameStepTransactionReplayReportV1;

  beforeAll(() => {
    report = runLaMvSameStepTransactionReplayBenchV1();
  }, 600_000);

  it("keeps local LA/MV same-step replay blocked", () => {
    expect(report.decision.laMvSameStepTransactionReplayStatus)
      .toBe("la-mv-same-step-transaction-replay-blocked");
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      bestVariantId: "fiber-total-pressure-local-transaction",
      bestPass: 0,
      bestMvfCleanCount: 3,
      bestForwardVolumeParityCount: 0,
      bestLaPvLobeQualityPass: 0,
      bestMassLedgerCleanCount: 0,
    });
    expect(report.bestVariant.meanMvForwardVolumeRatio).toBeLessThan(0.2);
    expect(report.bestVariant.maxLaVolumeDriftMl).toBeGreaterThan(400);
  });

  it("keeps runtime, AV-plane, a-prime, and LandAtrial claims blocked", () => {
    expect(report.decision.blockedClaims).toEqual(expect.arrayContaining([
      "runtime-wiring",
      "morphology-acceptance",
      "AV-plane-geometry",
      "a-prime-readback",
      "LandAtrial-unlock",
    ]));
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneGeometry).toBe(false);
    expect(report.claimBoundary.aPrimeReadback).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed LA/MV same-step replay artifact aligned", () => {
    expectMechanics2ReportArtifactParity(replayReport, report);
  });
});
