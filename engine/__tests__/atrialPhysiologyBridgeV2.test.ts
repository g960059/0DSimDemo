import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore } from "@/engine/ModelCore";
import {
  atrialPhysiologyBridgeV2CandidateParams,
  createAtrialPhysiologyBridgeV2SourceProvider,
  type AtrialPhysiologyBridgeV2ContributionSample,
} from "@/engine/myocardium/atrialPhysiologyBridgeV2";
import { computeAtrialReservoirConduitCoupling } from "@/engine/myocardium/atrialReservoirConduitCoupling";

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

  it("computes bounded reusable reservoir/conduit coupling terms", () => {
    const terms = computeAtrialReservoirConduitCoupling({
      phi: 0.88,
      selfVolumeRateMlPerSec: 300,
      inletValveOpen01: 1,
      activePressureMmHg: 4,
      avPlanePressureDeltaMmHg: -2,
      viscousConduitGainMmHgPerMlPerSec: 0.006,
      activeBoosterGain: 0.05,
      avPlaneDeltaGain: 0.35,
      maxAbsAddedPressureMmHg: 8,
    });

    expect(terms.boosterGate01).toBeGreaterThan(0.9);
    expect(terms.viscousConduitPressureMmHg).toBeLessThan(0);
    expect(terms.tensionBoosterPressureMmHg).toBeGreaterThan(0);
    expect(terms.avPlaneExtraPressureMmHg).toBeLessThan(0);
    expect(Math.abs(terms.totalAddedPressureMmHg)).toBeLessThanOrEqual(8);
  });
});
