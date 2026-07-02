import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runFourChamberBoundedReservoirDynamicsReviewBenchV1,
  type FourChamberBoundedReservoirDynamicsReviewReportV1,
} from "@/engine/mechanics2/benches/FourChamberBoundedReservoirDynamicsReviewBench";
import boundedReservoirDynamicsReviewReport
  from "@/data/mechanics2/reports/four-chamber-bounded-reservoir-dynamics-review-report-v1.json";

describe("MechanicsCore2 four-chamber bounded reservoir dynamics review bench", () => {
  let report: FourChamberBoundedReservoirDynamicsReviewReportV1;

  beforeAll(() => {
    report = runFourChamberBoundedReservoirDynamicsReviewBenchV1();
  }, 180_000);

  it("classifies the hard bound as a smoke-pass but stress-limiter-dominant scaffold", () => {
    expect(report.decision.dynamicsReviewStatus)
      .toBe("bounded-reservoir-smoke-pass-stress-limiter-dominant");
    expect(report.summary).toMatchObject({
      contractSmokePass: true,
      fullEnvelopeLimiterSparse: true,
      stressProbeLimiterDominant: true,
      maxAbsReservoirVolumeMl: 24,
    });
    expect(report.limiterDuty.fullEnvelope.dutyFraction).toBeLessThan(0.05);
    expect(report.limiterDuty.preloadLowStressProbe.dutyFraction).toBeGreaterThan(0.5);
  });

  it("keeps hard-bound final-law and atrial/runtime claims blocked", () => {
    expect(report.claimBoundary.hardBoundFinalLaw).toBe(false);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.trueFourChamberDynamics).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed bounded reservoir dynamics review artifact aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(boundedReservoirDynamicsReviewReport, report);
  });
});
