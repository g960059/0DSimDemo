import { describe, expect, it } from "vitest";
import {
  runFourChamberSmoothReservoirOwnershipBenchV1,
  type FourChamberSmoothReservoirOwnershipReportV1,
} from "@/engine/mechanics2/benches/FourChamberSmoothReservoirOwnershipBench";

describe("FourChamberSmoothReservoirOwnershipBench V1", () => {
  let report: FourChamberSmoothReservoirOwnershipReportV1;

  it("selects a smooth reservoir ownership signal over the hard-bound scaffold", () => {
    report = runFourChamberSmoothReservoirOwnershipBenchV1();
    expect(report.decision.smoothReservoirOwnershipStatus).toBe("smooth-reservoir-ownership-signal");
    expect(report.selectedCandidate?.candidateId).toBe("smooth-knee20-gain035-bound24");
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.hardBoundFinalLaw).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the selected full source-aware smoke envelope effective-pass clean", () => {
    report ??= runFourChamberSmoothReservoirOwnershipBenchV1();
    const selected = requireSelected(report);
    expect(selected.effectivePassCount).toBe(21);
    expect(selected.nominalEffectivePassCount).toBe(7);
    expect(selected.dtHalfEffectivePassCount).toBe(7);
    expect(selected.longEpochEffectivePassCount).toBe(7);
    expect(selected.preloadLowStressProbe.effectiveStatus).toBe("pass");
    expect(selected.preloadLowStressProbe.leftStatus).toBe("pass");
    expect(selected.preloadLowStressProbe.rightStatus).toBe("pass");
  });

  it("removes hard-limiter duty compared with the hard-bound scaffold", () => {
    report ??= runFourChamberSmoothReservoirOwnershipBenchV1();
    const hard = requireCandidate(report, "hard-bound24");
    const selected = requireSelected(report);
    expect(hard.preloadLowStressProbe.limiterDutyFraction).toBeGreaterThan(0.5);
    expect(selected.fullEnvelopeLimiterDutyFraction).toBe(0);
    expect(selected.preloadLowStressProbe.limiterDutyFraction).toBe(0);
    expect(selected.maxAbsReservoirVolumeOwnershipFeedbackMl).toBeGreaterThan(0);
    expect(selected.maxAbsReservoirVolumeOwnershipFeedbackMl).toBeLessThan(1.2);
  });
});

function requireSelected(
  report: FourChamberSmoothReservoirOwnershipReportV1,
): NonNullable<FourChamberSmoothReservoirOwnershipReportV1["selectedCandidate"]> {
  if (report.selectedCandidate == null) throw new Error("Missing selected smooth reservoir candidate");
  return report.selectedCandidate;
}

function requireCandidate(
  report: FourChamberSmoothReservoirOwnershipReportV1,
  candidateId: string,
): FourChamberSmoothReservoirOwnershipReportV1["candidateSummaries"][number] {
  const candidate = report.candidateSummaries.find((summary) => summary.candidateId === candidateId);
  if (candidate == null) throw new Error(`Missing candidate ${candidateId}`);
  return candidate;
}
