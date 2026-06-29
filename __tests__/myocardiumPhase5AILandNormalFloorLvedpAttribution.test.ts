import { createHash } from "node:crypto";
import resultArtifact from "@/data/myocardium/protocols/land-normal-floor-lvedp-attribution-phase5ai-result-v1.json";
import phase5XArtifact from "@/data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json";
import phase5AHArtifact from "@/data/myocardium/protocols/arterial-root-boundary-attribution-phase5ah-result-v1.json";
import { validateLandNormalFloorLvedpAttributionPhase5AI } from "@/tools/myocardium/verifyLandNormalFloorLvedpAttributionPhase5AI";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5AI Land normal-floor LVEDP attribution", () => {
  it("records a diagnostic-only normal-floor LVEDP attribution", () => {
    expect(resultArtifact.id).toBe("land-normal-floor-lvedp-attribution-phase5ai-result-v1");
    expect(resultArtifact.phase).toBe("Phase 5AI");
    expect(resultArtifact.claimBoundary).toBe("land-normal-floor-lvedp-attribution-diagnostic-only");
    expect(resultArtifact.upstreamPhase5XArtifactId).toBe("lv-land-default-candidate-preflight-phase5x-result-v1");
    expect(resultArtifact.upstreamPhase5AHArtifactId).toBe("arterial-root-boundary-attribution-phase5ah-result-v1");
    expect(resultArtifact.boundary.noRuntimeDefaultFlip).toBe(true);
    expect(resultArtifact.boundary.noAcceptedPreloadTuning).toBe(true);
    expect(resultArtifact.boundary.noAcceptedPassiveTuning).toBe(true);
    expect(resultArtifact.boundary.noAcceptedSourceCalciumScaling).toBe(true);
    expect(resultArtifact.boundary.noTrefFudge).toBe(true);
  });

  it("bounds the Land LVEDP excess and keeps preload/venous-tone probes unresolved", () => {
    expect(resultArtifact.summary.landBaselineLVEDPApprox).toBe(17.276729);
    expect(resultArtifact.summary.landBaselineLVEDPExcessMmHg).toBe(1.276729);
    expect(resultArtifact.summary.landBaselineOtherFloorFailures).toEqual([]);
    expect(resultArtifact.summary.defaultFlipBlockerStatus).toBe("bounded-small-lvedp-excess-diagnostic-only");
    expect(resultArtifact.summary.lvedpResolvedOutputPreservedRunIds).toEqual([
      "land-lv-bpas-0p90",
      "land-lv-bpas-0p85",
      "land-ca-release-1p10",
    ]);
    expect(resultArtifact.summary.smallestPreloadReductionResolvedRunId).toBeNull();

    const preloadAndVenous = resultArtifact.runs.filter((run) =>
      run.axis === "preload-tbv" || run.axis === "venous-tone"
    );
    expect(preloadAndVenous).toHaveLength(6);
    expect(preloadAndVenous.every((run) => run.classification === "lvedp-unresolved-diagnostic-only"))
      .toBe(true);
    expect(preloadAndVenous.every((run) => run.outputPreservedVsLandBaseline === true)).toBe(true);
  });

  it("separates passive-proxy/source-calcium sensitivity from accepted tuning", () => {
    const bpas90 = resultArtifact.runs.find((run) => run.id === "land-lv-bpas-0p90")!;
    const bpas85 = resultArtifact.runs.find((run) => run.id === "land-lv-bpas-0p85")!;
    const ca110 = resultArtifact.runs.find((run) => run.id === "land-ca-release-1p10")!;

    for (const run of [bpas90, bpas85, ca110]) {
      expect(run.health?.status).toBe("ok");
      expect(run.classification).toBe("lvedp-resolved-output-preserved-diagnostic-only");
      expect(run.outputPreservedVsLandBaseline).toBe(true);
      expect(run.floorFailures).toEqual([]);
    }
    expect(resultArtifact.summary.passiveProxyResolvedRunIds).toEqual([
      "land-lv-bpas-0p90",
      "land-lv-bpas-0p85",
    ]);
    expect(resultArtifact.summary.sourceCalciumResolvedRunIds).toEqual(["land-ca-release-1p10"]);
    expect(resultArtifact.doesNotUnlock).toEqual(expect.arrayContaining([
      "acceptedPassiveTuning",
      "acceptedSourceCalciumScaling",
      "runtimeDefaultFlip",
      "TrefFudge",
    ]));
  });

  it("records upstream provenance hashes", () => {
    expect(resultArtifact.upstreamPhase5XArtifactHash).toBe(hashArtifact(phase5XArtifact));
    expect(resultArtifact.upstreamPhase5AHArtifactHash).toBe(hashArtifact(phase5AHArtifact));
  });

  it("passes the verifier", () => {
    const report = validateLandNormalFloorLvedpAttributionPhase5AI(process.cwd());
    expect(report.pass).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.warnings.map((warning) => warning.code)).toContain("phase5ai_runtime_not_unlocked");
  });

  it("rejects boundary and hash erosion", () => {
    const artifact = resultArtifact as Record<string, any>;
    const originalBoundary = artifact.boundary.noRuntimeDefaultFlip;
    const originalHash = artifact.normalizedSha256;
    try {
      artifact.boundary.noRuntimeDefaultFlip = false;
      artifact.normalizedSha256 = "f".repeat(64);

      const report = validateLandNormalFloorLvedpAttributionPhase5AI(process.cwd());

      expect(report.pass).toBe(false);
      expect(report.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
        "phase5ai_stale_artifact",
        "phase5ai_boundary",
        "phase5ai_hash",
      ]));
    } finally {
      artifact.boundary.noRuntimeDefaultFlip = originalBoundary;
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
