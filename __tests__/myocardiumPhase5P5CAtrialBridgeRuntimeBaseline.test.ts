import baselineArtifact from "@/data/myocardium/protocols/atrial-bridge-high-hr-runtime-baseline-phase5p5c-result-v1.json";
import { validateAtrialBridgeHighHrRuntimeBaseline } from "@/tools/myocardium/verifyAtrialBridgeHighHrRuntimeBaseline";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5.5C atrial bridge high-HR runtime baseline", () => {
  it("records stock runtime baselines without bridge selection", () => {
    expect(baselineArtifact.id).toBe("atrial-bridge-high-hr-runtime-baseline-phase5p5c-result-v1");
    expect(baselineArtifact.phase).toBe("Phase 5.5C");
    expect(baselineArtifact.claimBoundary).toBe("diagnostic-runtime-boundary-baseline-only");
    expect(baselineArtifact.protocol.baselineIds).toEqual([
      "stock-active-no-provider-v0",
      "global-elastance-mode-v0",
    ]);
    expect(baselineArtifact.protocol.noExperimentalAtrialProviderForStockActive).toBe(true);
    expect(baselineArtifact.summary.selectedCandidateId).toBeNull();
    expect(baselineArtifact.summary.recommendedCandidateId).toBeNull();
  });

  it("classifies HR105 as shared stock-active runtime boundary evidence", () => {
    const stock75 = baselineArtifact.baselineRuns.find((run) =>
      run.baselineId === "stock-active-no-provider-v0" && run.sweepPointId === "normal-hr75-reference"
    );
    const stock90 = baselineArtifact.baselineRuns.find((run) =>
      run.baselineId === "stock-active-no-provider-v0" && run.sweepPointId === "normal-hr90"
    );
    const stock105 = baselineArtifact.baselineRuns.find((run) =>
      run.baselineId === "stock-active-no-provider-v0" && run.sweepPointId === "normal-hr105"
    );

    expect(stock75?.settled).toBe(true);
    expect(stock90?.settled).toBe(true);
    expect(stock105?.settled).toBe(false);
    expect(stock105?.window.windowKind).toBe("cap-tail-window");
    expect(stock105?.window.LA).toBeTruthy();
    expect(stock105?.window.RA).toBeTruthy();
    expect(baselineArtifact.comparisonToPhase5p5b.hr105BoundaryInterpretation).toBe(
      "shared-stock-active-runtime-boundary-supported",
    );
    expect(baselineArtifact.comparisonToPhase5p5b.sourceLocalizationEvidenceId).toBe(
      "atrial-bridge-blocker-localization-phase5p5b-result-v1",
    );
    expect(baselineArtifact.comparisonToPhase5p5b.a0ExperimentalHr105SettleReason).toBe("cap");
    expect(baselineArtifact.summary.highHrBoundaryAttribution).toBe("runtime-boundary-likely");
  });

  it("keeps global elastance reference-only and passes verifier", () => {
    const elastance105 = baselineArtifact.baselineRuns.find((run) =>
      run.baselineId === "global-elastance-mode-v0" && run.sweepPointId === "normal-hr105"
    );
    expect(elastance105?.heartModel).toBe("elastance");
    expect(baselineArtifact.protocol.globalElastanceChangesWholeHeart).toBe(true);
    expect(baselineArtifact.boundary.noProductionRuntimeWiring).toBe(true);
    expect(baselineArtifact.boundary.noFinalAtrialPhysiologyClaim).toBe(true);

    const report = validateAtrialBridgeHighHrRuntimeBaseline(process.cwd(), { rebuildEvidence: false });

    expect(report.errors).toEqual([]);
    expect(report.pass).toBe(true);
    expect(report.warnings.map((warning) => warning.code)).toEqual(
      expect.arrayContaining([
        "phase5p5c_diagnostic_only",
        "phase5p5c_global_elastance_reference_only",
        "phase5p5c_rebuild_not_run",
      ]),
    );
  });
});
