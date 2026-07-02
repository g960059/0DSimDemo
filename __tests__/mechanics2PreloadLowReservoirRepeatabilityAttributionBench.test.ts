import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runPreloadLowReservoirRepeatabilityAttributionBenchV1,
  type PreloadLowReservoirRepeatabilityAttributionReportV1,
} from "@/engine/mechanics2/benches/PreloadLowReservoirRepeatabilityAttributionBench";
import preloadLowRepeatabilityReport
  from "@/data/mechanics2/reports/preload-low-reservoir-repeatability-attribution-report-v1.json";

describe("MechanicsCore2 preload-low reservoir repeatability attribution bench", () => {
  let report: PreloadLowReservoirRepeatabilityAttributionReportV1;

  beforeAll(() => {
    report = runPreloadLowReservoirRepeatabilityAttributionBenchV1();
  }, 120_000);

  it("classifies the long preload-low blocker as reservoir load accumulation that breaks right surface compatibility", () => {
    expect(report.decision.repeatabilityStatus)
      .toBe("reservoir-load-breaks-right-surface-after-volume-accumulation");
    expect(report.summary).toMatchObject({
      longestEpochs: 56,
      longestStatus: "fail",
      longestMaxAbsReservoirVolumeMl: 48.935821,
      longestFinalReservoirStepMl: 0.354857,
      maxReservoirVolumeGrowthFrom22ToLongestMl: 20.426153,
      allSourceSurfacesPreserved: false,
    });
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.trueFourChamberDynamics).toBe(false);
    expect(report.claimBoundary.reservoirBroadRetuning).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("shows that the reservoir shuttle grows before the right surface breaks", () => {
    const probesByEpoch = new Map(report.epochProbes.map((probe) => [probe.epochs, probe]));
    expect(probesByEpoch.get(14)).toMatchObject({
      status: "pass",
      leftStatus: "pass",
      rightStatus: "pass",
      maxAbsReservoirVolumeMl: 19.44746,
    });
    expect(probesByEpoch.get(22)).toMatchObject({
      status: "fail",
      failureReasons: ["persistent-large-reservoir-shuttle"],
      leftStatus: "pass",
      rightStatus: "pass",
      maxAbsReservoirVolumeMl: 28.509668,
    });
    expect(probesByEpoch.get(40)).toMatchObject({
      status: "fail",
      failureReasons: ["persistent-large-reservoir-shuttle"],
      leftStatus: "pass",
      rightStatus: "pass",
      maxAbsReservoirVolumeMl: 46.159782,
    });
    expect(probesByEpoch.get(56)).toMatchObject({
      status: "fail",
      failureReasons: [
        "right-surface-not-preserved",
        "persistent-large-reservoir-shuttle",
      ],
      leftStatus: "pass",
      rightStatus: "fail",
      maxAbsReservoirVolumeMl: 48.935821,
      finalReservoirStepMl: 0.354857,
    });
  });

  it("keeps the committed preload-low reservoir repeatability artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(preloadLowRepeatabilityReport, report);
  });
});
