import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { auditMainWireWorkbenchMetricsV1 as audit } from "@/tools/scientific/auditMainWireWorkbenchMetricsV1";
import { hotPathIntegrityTierV1, selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import bundle from "@/data/model-releases/standard73/bundle.json";
const originalTier = hotPathIntegrityTierV1();
beforeEach(() => selectHotPathIntegrityTierV1("hot-path-lean"));
afterEach(() => selectHotPathIntegrityTierV1(originalTier));

describe("native versus actual Workbench measurement audit", () => {
  it.each([bundle.baseline, ...bundle.presets])("compares the same beat of $presetId without changing the trajectory", async preset => {
    const result = await audit(preset);
    expect(result.trajectory.maximumScaledPresentationError).toBeLessThanOrEqual(1);
    expect(result.trajectory.completedBeatReplayComparison!.maximumScaledError).toBeLessThanOrEqual(1);
    expect(result.trajectory.bitwiseIdentityClaimed).toBe(false);
    expect(result.trajectory.nativeAcceptedSteps).toBeGreaterThan(result.trajectory.presentationSamples);
    expect(result.workbench.cycle.status).toBe("available");
    expect(result.workbench.filling.source!.cycleStartTimeSec).toBeCloseTo(result.beat.startTimeSec, 9);
    expect(result.workbench.filling.source!.atrialActivationTimeSec).toBeCloseTo(result.beat.endTimeSec, 9);
    expect(result.native.timing.status).toBe("available");
    for (const row of result.comparisons.filter(r => ["LV ICT (ms)", "LV IRT (ms)", "AV ET (ms)"].includes(r.metric))) {
      expect(row.difference).not.toBeNull();
      // Measurement-concordance tolerance, NOT a physiological normal range.
      expect(Math.abs(row.difference!)).toBeLessThanOrEqual(4);
    }
    expect(result.comparisons.find(r => r.metric === "MV E/A")!.difference).not.toBeNull();
    expect(result.comparisons.filter(r => r.metric.includes("dP/dt")).every(r => r.interpretation.includes("different estimands"))).toBe(true);
    expect(result.publicPromotionAuthorized).toBe(false);
  }, 60_000);
});
