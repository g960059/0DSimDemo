import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runFourChamberBoundedReservoirContractSmokeBenchV1,
  type FourChamberBoundedReservoirContractSmokeReportV1,
} from "@/engine/mechanics2/benches/FourChamberBoundedReservoirContractSmokeBench";
import boundedReservoirContractSmokeReport
  from "@/data/mechanics2/reports/four-chamber-bounded-reservoir-contract-smoke-report-v1.json";

describe("MechanicsCore2 four-chamber bounded reservoir contract smoke bench", () => {
  let report: FourChamberBoundedReservoirContractSmokeReportV1;

  beforeAll(() => {
    report = runFourChamberBoundedReservoirContractSmokeBenchV1();
  }, 180_000);

  it("promotes bounded reservoir-volume ownership through the full source-aware smoke envelope", () => {
    expect(report.decision.boundedReservoirContractSmokeStatus)
      .toBe("source-aware-bounded-reservoir-contract-smoke-pass");
    expect(report.summary).toMatchObject({
      rawPassCount: 18,
      effectivePassCount: 21,
      total: 21,
      maxAbsReservoirVolumeMl: 24,
    });
    expect(report.preloadLowStressProbe).toMatchObject({
      epochs: 56,
      rawStatus: "pass",
      leftStatus: "pass",
      rightStatus: "pass",
      maxAbsReservoirVolumeMl: 24,
      finalReservoirStepMl: 0,
    });
  });

  it("keeps limiter duty explicit and keeps runtime/atrial claims blocked", () => {
    expect(report.summary.totalVolumeOwnershipLimiterHitCount).toBeGreaterThan(0);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.trueFourChamberDynamics).toBe(false);
    expect(report.claimBoundary.reservoirBroadRetuning).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed bounded reservoir contract smoke artifact aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(boundedReservoirContractSmokeReport, report);
  });
});
