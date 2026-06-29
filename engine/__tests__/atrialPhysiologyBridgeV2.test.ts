import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore } from "@/engine/ModelCore";
import {
  atrialPhysiologyBridgeV2CandidateParams,
  createAtrialPhysiologyBridgeV2SourceProvider,
  type AtrialPhysiologyBridgeV2ContributionSample,
} from "@/engine/myocardium/atrialPhysiologyBridgeV2";

describe("AtrialPhysiologyBridgeV2", () => {
  it("adds finite diagnostic atrial pressure terms without changing blood-volume state layout", () => {
    const recorded: AtrialPhysiologyBridgeV2ContributionSample[] = [];
    const core = new ModelCore(DEFAULT_PARAMS, {
      activeSourceProviders: {
        LA: createAtrialPhysiologyBridgeV2SourceProvider(
          "LA",
          atrialPhysiologyBridgeV2CandidateParams("atrial-a2-light-v1", "LA"),
          { record: (sample) => recorded.push(sample) },
        ),
      },
    });

    core.step(0.001);
    const sample = core.sample();

    expect(Number.isFinite(sample.LAP)).toBe(true);
    expect(recorded.length).toBeGreaterThan(0);
    expect(recorded.every((entry) =>
      Number.isFinite(entry.selfVolumeRateMlPerSec)
      && Number.isFinite(entry.viscousConduitPressureMmHg)
      && Number.isFinite(entry.tensionBoosterPressureMmHg)
      && Number.isFinite(entry.avPlaneExtraPressureMmHg)
      && Number.isFinite(entry.totalAddedPressureMmHg)
      && Number.isFinite(entry.pressureMmHg)
    )).toBe(true);
    expect(
      Math.max(...recorded.map((entry) => Math.abs(entry.totalAddedPressureMmHg))),
    ).toBeLessThanOrEqual(8);
  });
});
