import { createHash } from "node:crypto";
import resultArtifact from "@/data/myocardium/protocols/arterial-root-boundary-attribution-phase5ah-result-v1.json";
import { validateArterialRootBoundaryAttributionPhase5AH } from "@/tools/myocardium/verifyArterialRootBoundaryAttributionPhase5AH";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5AH arterial boundary/root attribution", () => {
  it("records an attribution diagnostic without adoption", () => {
    expect(resultArtifact.id).toBe("arterial-root-boundary-attribution-phase5ah-result-v1");
    expect(resultArtifact.phase).toBe("Phase 5AH");
    expect(resultArtifact.claimBoundary).toBe("phase5ag-boundary-root-response-attribution-diagnostic-only");
    expect(resultArtifact.upstreamPhase5AGArtifactId).toBe("arterial-root-boundary-timing-phase5ag-result-v1");
    expect(resultArtifact.protocol.analysisScope).toBe("phase5ag-measured-full-matrix-candidate-attribution");
    expect(resultArtifact.protocol.noFreshModelRerun).toBe(true);
    expect(resultArtifact.boundary.noQDotClampRemoval).toBe(true);
    expect(resultArtifact.boundary.noValveLoadTimingAcceptance).toBe(true);
    expect(resultArtifact.boundary.noBoundaryRootProductionAdoption).toBe(true);
    expect(resultArtifact.boundary.noLandDefaultFlipUnlock).toBe(true);
  });

  it("separates stock and Land health-ok qDot response patterns", () => {
    const stock = resultArtifact.modelSummaries
      .find((summary) => summary.modelPathId === "stock-active-no-provider-v0")!;
    const land = resultArtifact.modelSummaries
      .find((summary) => summary.modelPathId === "developer-only-lv-land-v0")!;

    expect(resultArtifact.summary.healthOkCandidateComparisonCount).toBe(28);
    expect(stock.healthOkComparisonCount).toBe(13);
    expect(stock.qDotTimingOutputPreservedCount).toBe(12);
    expect(stock.noClampImprovementOutputPreservedCount).toBe(1);
    expect(land.healthOkComparisonCount).toBe(15);
    expect(land.qDotTimingOutputPreservedCount).toBe(6);
    expect(land.timingOnlyOutputPreservedCount).toBe(9);
    expect(land.outputPreservedHealthOkCount).toBe(15);
    expect(land.landSolveFailureCount).toBe(0);
    expect(land.medianQDotClampReductionVsCurrentAovOpen).toBe(0.197861);
    expect(stock.medianQDotClampReductionVsCurrentAovOpen).toBe(0.829472);
  });

  it("keeps normal-floor Land and HR120 stock in separate attribution buckets", () => {
    const normalLand = resultArtifact.pointAttributions.find((row) =>
      row.pointId === "normal-floor" && row.modelPathId === "developer-only-lv-land-v0"
    )!;
    expect(normalLand.comparisonHealth).toBe("health-ok");
    expect(normalLand.qDotResponseAttribution)
      .toBe("timing-only-qdot-reduction-below-threshold-output-preserved");
    expect(normalLand.outputPreserved).toBe(true);
    expect(normalLand.qDotClampReductionVsCurrentAovOpen).toBe(0.191658);

    expect(resultArtifact.edgeAttributions.hr120Stock.attribution)
      .toBe("pre-existing-stock-health-failure-non-health-ok-edge");
    expect(resultArtifact.edgeAttributions.hr120Stock.currentHealthStatus).toBe("failed");
    expect(resultArtifact.edgeAttributions.hr120Stock.candidateHealthStatus).toBe("failed");
    expect(resultArtifact.edgeAttributions.hr120Stock.candidateClassification)
      .toBe("candidate-output-or-timing-cost");
  });

  it("passes the verifier", () => {
    const report = validateArterialRootBoundaryAttributionPhase5AH(process.cwd());
    expect(report.pass).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.warnings.map((warning) => warning.code)).toContain("phase5ah_runtime_not_unlocked");
  });

  it("rejects boundary and hash erosion", () => {
    const artifact = resultArtifact as Record<string, any>;
    const originalBoundary = artifact.boundary.noQDotClampRemoval;
    const originalHash = artifact.normalizedSha256;
    try {
      artifact.boundary.noQDotClampRemoval = false;
      artifact.normalizedSha256 = "f".repeat(64);

      const report = validateArterialRootBoundaryAttributionPhase5AH(process.cwd());

      expect(report.pass).toBe(false);
      expect(report.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
        "phase5ah_stale_artifact",
        "phase5ah_boundary",
        "phase5ah_hash",
      ]));
    } finally {
      artifact.boundary.noQDotClampRemoval = originalBoundary;
      artifact.normalizedSha256 = originalHash;
    }
  });

  it("rejects upstream provenance hash drift", () => {
    const artifact = resultArtifact as Record<string, any>;
    const originalSourceHash = artifact.protocol.sourceArtifactHash;
    const originalHash = artifact.normalizedSha256;
    try {
      artifact.protocol.sourceArtifactHash = "0".repeat(64);
      artifact.normalizedSha256 = hashArtifact(artifact);

      const report = validateArterialRootBoundaryAttributionPhase5AH(process.cwd());

      expect(report.pass).toBe(false);
      expect(report.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
        "phase5ah_stale_artifact",
        "phase5ah_upstream_artifact",
      ]));
      expect(report.errors.map((error) => error.code)).not.toContain("phase5ah_hash");
    } finally {
      artifact.protocol.sourceArtifactHash = originalSourceHash;
      artifact.normalizedSha256 = originalHash;
    }
  });
});

function hashArtifact(artifact: Record<string, unknown>): string {
  const { normalizedSha256: _normalizedSha256, ...withoutHash } = artifact;
  return createHash("sha256").update(JSON.stringify(stable(withoutHash))).digest("hex");
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  const object = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(object).sort().map((key) => [key, stable(object[key])]));
}
