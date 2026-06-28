import resultArtifact from "@/data/myocardium/protocols/atrial-bridge-shootout-phase5p5-result-v1.json";
import { validateAtrialBridgeShootout } from "@/tools/myocardium/verifyAtrialBridgeShootout";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5.5 atrial bridge shootout", () => {
  it("records measured E0/A0/A1 evidence without owner selection", () => {
    expect(resultArtifact.id).toBe("atrial-bridge-shootout-phase5p5-result-v1");
    expect(resultArtifact.phase).toBe("Phase 5.5");
    expect(resultArtifact.claimBoundary).toBe("temporary-atrial-bridge-shootout-recommendation-only");
    expect(resultArtifact.protocol.candidateIds).toEqual([
      "atrial-elastance-negative-control-v0",
      "legacy-atrial-active-bridge-v0",
      "atrial-reservoir-booster-bridge-v1",
    ]);
    expect(resultArtifact.runHealth.isolatedRunCount).toBe(6);
    expect(resultArtifact.runHealth.closedLoopRunCount).toBe(12);
    expect(resultArtifact.recommendation.selectedCandidateId).toBeNull();
    expect(resultArtifact.recommendation.recommendedCandidateId).toBeNull();
    expect(resultArtifact.recommendation.rationale.some((line) => line.includes("high-hr"))).toBe(true);
  });

  it("keeps A1 partial signals separate from Phase 6 selection", () => {
    const a1 = resultArtifact.candidateSummaries.find((candidate) =>
      candidate.candidateId === "atrial-reservoir-booster-bridge-v1"
    );
    const a0 = resultArtifact.candidateSummaries.find((candidate) =>
      candidate.candidateId === "legacy-atrial-active-bridge-v0"
    );
    const e0 = resultArtifact.candidateSummaries.find((candidate) =>
      candidate.candidateId === "atrial-elastance-negative-control-v0"
    );

    expect(a1?.boosterPreserved).toBe(true);
    expect(a1?.qDotContaminationNoWorseThanA0).toBe(true);
    expect(a1?.valveDiodeContaminationNoWorseThanA0).toBe(false);
    expect(a1?.contaminationNoWorseThanA0).toBe(false);
    expect(a1?.repeatabilityAllSettledMainPointsOk).toBe(false);
    expect(a1?.roughnessSamplingInvariantVsA0).toBe(false);
    expect(a1?.roughnessScore).toBeLessThan(a0?.roughnessScore ?? 0);
    expect(e0?.boosterPreserved).toBe(false);
    expect(e0?.highFrequencyEnergyScore).toBeGreaterThan(a1?.highFrequencyEnergyScore ?? Infinity);

    const highHrRuns = resultArtifact.closedLoopRuns.filter((run) => run.pointId === "high-hr");
    expect(highHrRuns).toHaveLength(3);
    expect(highHrRuns.every((run) => run.settled === false && run.settleReason === "cap")).toBe(true);
  });

  it("passes the verifier and leaves production/runtime claims blocked", () => {
    const report = validateAtrialBridgeShootout(process.cwd(), { rebuildEvidence: false });

    expect(report.errors).toEqual([]);
    expect(report.pass).toBe(true);
    expect(report.warnings.map((warning) => warning.code)).toEqual(
      expect.arrayContaining([
        "phase5p5_recommendation_only",
        "phase5p5_a1_partial_signal_not_selected",
      ]),
    );
    expect(resultArtifact.implementationStatus.productionRuntimeWiring).toBe("absent");
    expect(resultArtifact.implementationStatus.officialCaseWiring).toBe("absent");
    expect(resultArtifact.implementationStatus.workbenchRuntimeWiring).toBe("absent");
    expect(resultArtifact.implementationStatus.atrialLandRdqImplementation).toBe("absent");
    expect(resultArtifact.boundary.noFinalAtrialPhysiologyClaim).toBe(true);
  });
});
