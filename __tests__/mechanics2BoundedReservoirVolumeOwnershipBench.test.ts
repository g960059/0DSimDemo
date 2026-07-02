import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runBoundedReservoirVolumeOwnershipBenchV1,
  type BoundedReservoirVolumeOwnershipReportV1,
} from "@/engine/mechanics2/benches/BoundedReservoirVolumeOwnershipBench";
import boundedReservoirVolumeReport
  from "@/data/mechanics2/reports/bounded-reservoir-volume-ownership-report-v1.json";

describe("MechanicsCore2 bounded reservoir volume ownership bench", () => {
  let report: BoundedReservoirVolumeOwnershipReportV1;

  beforeAll(() => {
    report = runBoundedReservoirVolumeOwnershipBenchV1();
  }, 120_000);

  it("finds a targeted bounded-volume ownership signal for preload-low long repeatability", () => {
    expect(report.decision.boundedReservoirVolumeStatus)
      .toBe("bounded-volume-ownership-targeted-signal");
    expect(report.summary).toMatchObject({
      bestVariantId: "hard-volume-bound24",
      bestPassCount: 3,
      referencePassCount: 0,
      bestLongestStatus: "pass",
      bestMaxAbsReservoirVolumeMl: 24,
    });
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.trueFourChamberDynamics).toBe(false);
    expect(report.claimBoundary.reservoirBroadRetuning).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the volume limiter explicit instead of hiding the rejected transfer", () => {
    const best = report.variantResults.find((variant) => variant.variantId === report.summary.bestVariantId);
    expect(best?.summary.volumeLimiterHitCount).toBeGreaterThan(0);
    expect(best?.summary.maxAbsRejectedTransferMl).toBeGreaterThan(0);
    expect(best?.probeResults.every((probe) =>
      probe.leftStatus === "pass" && probe.rightStatus === "pass"
    )).toBe(true);
  });

  it("keeps the committed bounded reservoir volume artifact aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(boundedReservoirVolumeReport, report);
  });
});
