import resultArtifact from "@/data/myocardium/protocols/lv-land-qdot-blocker-localization-phase5y-result-v1.json";
import { validateLvLandQDotBlockerLocalizationPhase5Y } from "@/tools/myocardium/verifyLvLandQDotBlockerLocalizationPhase5Y";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5Y LV Land qDot blocker localization", () => {
  it("records diagnostic-only qDot blocker localization without tuning or default flip", () => {
    expect(resultArtifact.id).toBe("lv-land-qdot-blocker-localization-phase5y-result-v1");
    expect(resultArtifact.phase).toBe("Phase 5Y");
    expect(resultArtifact.claimBoundary).toBe("qdot-blocker-localization-diagnostic-only-no-tuning");
    expect(resultArtifact.upstreamPhase5XArtifactId).toBe("lv-land-default-candidate-preflight-phase5x-result-v1");
    expect(resultArtifact.boundary.noRuntimeDefaultFlip).toBe(true);
    expect(resultArtifact.boundary.noLegacyActiveStressDeletion).toBe(true);
    expect(resultArtifact.boundary.noQDotTuning).toBe(true);
    expect(resultArtifact.boundary.noValveTuning).toBe(true);
    expect(resultArtifact.boundary.noLandParameterTuning).toBe(true);
    expect(resultArtifact.doesNotUnlock).toEqual(expect.arrayContaining([
      "runtimeDefaultFlip",
      "qDotTuning",
      "valveThresholdTuning",
      "officialMorphologyAcceptance",
      "finalNoAlternans",
    ]));
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
  });

  it("separates direct AoV qDot clamp engagement from the Phase 5X classifier window", () => {
    expect(resultArtifact.summary.landHealthOkCount).toBe(14);
    expect(resultArtifact.summary.landSettledCount).toBe(14);
    expect(resultArtifact.summary.landSolveFailureCount).toBe(0);
    expect(resultArtifact.summary.directAovQDotEngagementPointCount).toBe(14);
    expect(resultArtifact.summary.classifierWindowAmplificationPointCount).toBe(14);
    expect(resultArtifact.summary.morphologyFractionDenominatorRiskPointCount).toBe(0);

    const normal = resultArtifact.points.find((point) => point.id === "normal-floor")!;
    expect(normal.land.health.clampHitCount).toBe(0);
    expect(normal.land.directWindow.aovQDotRawPostDiffAbsMaxMlPerS2).toBeGreaterThan(40000);
    expect(normal.land.directWindow.explicitClampHit01FractionAovOpen).toBeGreaterThanOrEqual(0.25);
    expect(normal.land.morphologyReference.phase5XQDotClampHitFraction).toBe(1);
    expect(normal.land.windowComparison.phase5XEjectionToAovOpenDurationRatio).toBeLessThanOrEqual(0.1);
    expect(normal.localizationClass).toBe("direct-aov-qdot-engagement-classifier-window-amplification");
    expect(normal.blockerSignals).toEqual(expect.arrayContaining([
      "direct-aov-open-raw-post-divergence-engaged",
      "direct-aov-open-explicit-clamp-flag-engaged",
      "direct-aov-open-impulse-hit-engaged",
      "classifier-window-amplifies-qdot-fraction",
    ]));
  });

  it("records the normal-floor LVEDP blocker without treating it as a tuning target", () => {
    expect(resultArtifact.summary.normalFloorLVEDPApprox).toBe(17.276729);
    expect(resultArtifact.summary.currentInterpretation).toContain("broader AoV-open window");
    expect(resultArtifact.summary.currentInterpretation).toContain("without tuning qDot or valve");
    expect(resultArtifact.summary.recommendedNext.join("\n")).toContain("without tuning qDot or valve");
  });

  it("passes the verifier in non-rebuild mode", () => {
    const report = validateLvLandQDotBlockerLocalizationPhase5Y(process.cwd(), { rebuildEvidence: false });
    expect(report.pass).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining([
      "phase5y_rebuild_not_run_by_default",
      "phase5y_default_flip_not_unlocked",
      "phase5y_normal_floor_lvedp_still_high",
      "phase5y_qdot_blocker_localized",
    ]));
  });

  it("rejects localization overclaims or erased direct qDot evidence", () => {
    const artifact = resultArtifact as Record<string, any>;
    const normal = artifact.points.find((point: { id: string }) => point.id === "normal-floor");
    const originalClass = normal.localizationClass;
    const originalSignals = normal.blockerSignals;
    const originalDirectCount = artifact.summary.directAovQDotEngagementPointCount;
    try {
      normal.localizationClass = "morphology-qdot-blocker-not-localized";
      normal.blockerSignals = ["morphology-qdot-blocker-not-localized"];
      artifact.summary.directAovQDotEngagementPointCount = 0;

      const report = validateLvLandQDotBlockerLocalizationPhase5Y(process.cwd(), { rebuildEvidence: false });

      expect(report.pass).toBe(false);
      expect(report.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
        "phase5y_classification",
        "phase5y_summary_consistency",
      ]));
    } finally {
      normal.localizationClass = originalClass;
      normal.blockerSignals = originalSignals;
      artifact.summary.directAovQDotEngagementPointCount = originalDirectCount;
    }
  });

  it("rejects qDot/valve tuning or default-flip boundary erosion", () => {
    const artifact = resultArtifact as Record<string, any>;
    const originalDefaultFlip = artifact.boundary.noRuntimeDefaultFlip;
    const originalQDot = artifact.boundary.noQDotTuning;
    const originalValve = artifact.boundary.noValveTuning;
    try {
      artifact.boundary.noRuntimeDefaultFlip = false;
      artifact.boundary.noQDotTuning = false;
      artifact.boundary.noValveTuning = false;

      const report = validateLvLandQDotBlockerLocalizationPhase5Y(process.cwd(), { rebuildEvidence: false });

      expect(report.pass).toBe(false);
      expect(report.errors.map((error) => error.code)).toContain("phase5y_boundary");
    } finally {
      artifact.boundary.noRuntimeDefaultFlip = originalDefaultFlip;
      artifact.boundary.noQDotTuning = originalQDot;
      artifact.boundary.noValveTuning = originalValve;
    }
  });
});
