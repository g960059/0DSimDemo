import resultArtifact from "@/data/myocardium/protocols/lv-land-ejection-window-localization-phase5z-result-v1.json";
import { validateLvLandEjectionWindowLocalizationPhase5Z } from "@/tools/myocardium/verifyLvLandEjectionWindowLocalizationPhase5Z";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5Z LV Land ejection-window localization", () => {
  it("records diagnostic-only ejection-window localization without tuning or default flip", () => {
    expect(resultArtifact.id).toBe("lv-land-ejection-window-localization-phase5z-result-v1");
    expect(resultArtifact.phase).toBe("Phase 5Z");
    expect(resultArtifact.claimBoundary).toBe("ejection-window-localization-diagnostic-only-no-tuning");
    expect(resultArtifact.upstreamPhase5XArtifactId).toBe("lv-land-default-candidate-preflight-phase5x-result-v1");
    expect(resultArtifact.upstreamPhase5YArtifactId).toBe("lv-land-qdot-blocker-localization-phase5y-result-v1");
    expect(resultArtifact.boundary.noRuntimeDefaultFlip).toBe(true);
    expect(resultArtifact.boundary.noQDotTuning).toBe(true);
    expect(resultArtifact.boundary.noValveTuning).toBe(true);
    expect(resultArtifact.boundary.noAfterloadTuning).toBe(true);
    expect(resultArtifact.boundary.noOfficialMorphologyAcceptance).toBe(true);
  });

  it("covers the full Phase 5X synthetic user-knob matrix", () => {
    expect(resultArtifact.protocol.modelPathIds).toEqual([
      "stock-active-no-provider-v0",
      "developer-only-lv-land-v0",
    ]);
    expect(resultArtifact.points.map((point) => point.id)).toEqual([
      "normal-floor",
      "preload-low",
      "preload-high",
      "hr60",
      "hr90",
      "hr120",
      "contractility-low",
      "contractility-high",
      "afterload-low",
      "afterload-high",
      "arterial-stiffness-low",
      "arterial-stiffness-high",
      "venous-tone-low",
      "venous-tone-high",
    ]);
    expect(resultArtifact.summary.pointCount).toBe(14);
    expect(resultArtifact.protocol.windowDurationAndVolumeAggregation).toBe("per-beat-average-over-measure-beats");
  });

  it("does not overclaim classifier-window denominator amplification after per-beat normalization", () => {
    expect(resultArtifact.summary.landHealthOkCount).toBe(14);
    expect(resultArtifact.summary.landSettledCount).toBe(14);
    expect(resultArtifact.summary.landSolveFailureCount).toBe(0);
    expect(resultArtifact.summary.classifierWindowDenominatorAmplificationDominantPointCount).toBe(1);
    expect(resultArtifact.summary.noPhase5XWindowAmplificationPointCount).toBe(13);
    expect(resultArtifact.summary.physicalHighFlowCoreQDotDominantPointCount).toBe(0);
    expect(resultArtifact.summary.uninterpretablePointCount).toBe(0);
    expect(resultArtifact.summary.medianPhase5XToAovOpenDurationRatio).toBe(0.133333);
    expect(resultArtifact.summary.medianHighCore50QDotFraction).toBe(0.542857);
    expect(resultArtifact.summary.currentInterpretation).toContain("does not support a dominant short ejection-window denominator explanation");
    expect(resultArtifact.summary.limitations).toEqual(expect.arrayContaining([
      expect.stringContaining("not Phase 5Z root-cause acceptance"),
      expect.stringContaining("not independent Land contractility-sensitivity evidence"),
    ]));
  });

  it("records direct AoV/root discharge evidence for the normal floor point", () => {
    const normal = resultArtifact.points.find((point) => point.id === "normal-floor")!;
    const aovOpen = normal.land.windows.find((window) => window.id === "aov-open")!;
    const highCore50 = normal.land.windows.find((window) => window.id === "qao-high-core-50")!;
    expect(normal.classification).toBe("no-phase5x-window-amplification");
    expect(normal.land.reference.phase5XQDotClampHitFraction).toBe(1);
    expect(normal.land.reference.phase5YClassifierWindowAmplification).toBe(true);
    expect(normal.land.comparison.phase5XToAovOpenDurationRatio).toBe(0.133333);
    expect(normal.land.comparison.phase5XToAovOpenForwardVolumeRatio).toBe(0.210052);
    expect(aovOpen.durationSec).toBe(0.075);
    expect(aovOpen.rawPostDivergenceHitFraction).toBe(0.431111);
    expect(highCore50.rawPostDivergenceHitFraction).toBe(0.542857);
    expect(highCore50.rawPostDivergenceHitFraction).toBeLessThan(0.75);
    expect(normal.signals).toEqual(expect.arrayContaining([
      "no-phase5x-window-amplification",
      "phase5x-qdot-fraction-high",
      "phase5y-classifier-window-amplification",
    ]));
  });

  it("passes the verifier in non-rebuild mode", () => {
    const report = validateLvLandEjectionWindowLocalizationPhase5Z(process.cwd(), { rebuildEvidence: false });
    expect(report.pass).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining([
      "phase5z_window_localized",
      "phase5z_classifier_window_non_dominant",
      "phase5z_no_window_amplification_dominant",
      "phase5z_rebuild_not_run_by_default",
      "phase5z_default_flip_not_unlocked",
    ]));
  });

  it("rejects overclaiming physical high-flow qDot dominance", () => {
    const artifact = resultArtifact as Record<string, any>;
    const normal = artifact.points.find((point: { id: string }) => point.id === "normal-floor");
    const originalClass = normal.classification;
    const originalPhysicalCount = artifact.summary.physicalHighFlowCoreQDotDominantPointCount;
    const originalClassifierCount = artifact.summary.classifierWindowDenominatorAmplificationDominantPointCount;
    const originalNoAmplificationCount = artifact.summary.noPhase5XWindowAmplificationPointCount;
    try {
      normal.classification = "physical-high-flow-core-qdot-dominant";
      artifact.summary.physicalHighFlowCoreQDotDominantPointCount = 1;
      artifact.summary.noPhase5XWindowAmplificationPointCount = 12;

      const report = validateLvLandEjectionWindowLocalizationPhase5Z(process.cwd(), { rebuildEvidence: false });

      expect(report.pass).toBe(false);
      expect(report.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
        "phase5z_classification",
        "phase5z_signals",
      ]));
    } finally {
      normal.classification = originalClass;
      artifact.summary.physicalHighFlowCoreQDotDominantPointCount = originalPhysicalCount;
      artifact.summary.classifierWindowDenominatorAmplificationDominantPointCount = originalClassifierCount;
      artifact.summary.noPhase5XWindowAmplificationPointCount = originalNoAmplificationCount;
    }
  });

  it("rejects tuning/default-flip boundary erosion", () => {
    const artifact = resultArtifact as Record<string, any>;
    const originalDefaultFlip = artifact.boundary.noRuntimeDefaultFlip;
    const originalQDot = artifact.boundary.noQDotTuning;
    const originalValve = artifact.boundary.noValveTuning;
    try {
      artifact.boundary.noRuntimeDefaultFlip = false;
      artifact.boundary.noQDotTuning = false;
      artifact.boundary.noValveTuning = false;

      const report = validateLvLandEjectionWindowLocalizationPhase5Z(process.cwd(), { rebuildEvidence: false });

      expect(report.pass).toBe(false);
      expect(report.errors.map((error) => error.code)).toContain("phase5z_boundary");
    } finally {
      artifact.boundary.noRuntimeDefaultFlip = originalDefaultFlip;
      artifact.boundary.noQDotTuning = originalQDot;
      artifact.boundary.noValveTuning = originalValve;
    }
  });
});
