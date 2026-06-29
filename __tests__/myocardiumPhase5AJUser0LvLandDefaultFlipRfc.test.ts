import { createHash } from "node:crypto";
import resultArtifact from "@/data/myocardium/protocols/user0-lv-land-default-flip-rfc-phase5aj-result-v1.json";
import { validateUser0LvLandDefaultFlipRfcPhase5AJ } from "@/tools/myocardium/verifyUser0LvLandDefaultFlipRfcPhase5AJ";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5AJ user-0 LV Land default-flip RFC", () => {
  it("records an owner-decision-needed RFC, not a default flip", () => {
    expect(resultArtifact.id).toBe("user0-lv-land-default-flip-rfc-phase5aj-result-v1");
    expect(resultArtifact.phase).toBe("Phase 5AJ");
    expect(resultArtifact.claimBoundary).toBe("user0-lv-land-default-flip-rfc-owner-decision-needed");
    expect(resultArtifact.ownerDecision.status).toBe("rfc-draft-owner-decision-needed");
    expect(resultArtifact.ownerDecision.accepted).toBe(false);
    expect(resultArtifact.ownerDecision.options).toEqual([
      expect.stringContaining("GO"),
      expect.stringContaining("DEFER"),
      expect.stringContaining("NO-GO"),
    ]);
    expect(resultArtifact.boundary.noRuntimeDefaultFlipInThisPhase).toBe(true);
    expect(resultArtifact.boundary.noLegacyActiveStressDeletion).toBe(true);
    expect(resultArtifact.boundary.noRootZcAdoption).toBe(true);
  });

  it("pins the upstream evidence and bounded Phase 5AI LVEDP status", () => {
    expect(resultArtifact.upstreamEvidence.map((item) => item.id)).toEqual([
      "myocardium-developer-only-lv-land-runtime-flag-rfc-v1",
      "myocardium-developer-only-lv-land-runtime-flag-suite-result-v1",
      "lv-land-default-candidate-preflight-phase5x-result-v1",
      "arterial-root-boundary-attribution-phase5ah-result-v1",
      "land-normal-floor-lvedp-attribution-phase5ai-result-v1",
    ]);
    for (const item of resultArtifact.upstreamEvidence) {
      expect(item.stableHash).toMatch(/^[a-f0-9]{64}$/);
      expect(item.keyFacts.length).toBeGreaterThanOrEqual(2);
    }
    expect(resultArtifact.evidenceSummary.phase5AINormalFloorStatus)
      .toBe("bounded-small-lvedp-excess-diagnostic-only");
    expect(resultArtifact.evidenceSummary.landBaselineLVEDPExcessMmHg).toBe(1.276729);
    expect(resultArtifact.evidenceSummary.landSolveFailureCountPhase5X).toBe(0);
  });

  it("keeps root/Zc, atria, official cases, and accepted tuning separate", () => {
    expect(resultArtifact.separatedLanes.rootZcAdoption).toBe("separate-blocked");
    expect(resultArtifact.separatedLanes.atrialFigureEight).toBe("separate-not-lv-default-gate");
    expect(resultArtifact.separatedLanes.officialCaseTuning).toBe("smoke-only-until-closures-stabilize");
    expect(resultArtifact.separatedLanes.passiveGeometryCalibration).toBe("optional-separate-owner-choice");
    expect(resultArtifact.nextImplementationPrIfOwnerGo.exclude).toEqual(expect.arrayContaining([
      "root/Zc or boundary/root inertance production adoption",
      "atrial figure-eight model selection",
      "official case reauthoring or per-case tuning",
      "accepted passive/geometry/source-calcium/preload/venous-tone tuning",
      "Tref, qDot, valve, or source-stress tuning",
    ]));
  });

  it("passes the verifier", () => {
    const report = validateUser0LvLandDefaultFlipRfcPhase5AJ(process.cwd());
    expect(report.pass).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.warnings.map((warning) => warning.code)).toContain("phase5aj_owner_decision_needed");
  });

  it("rejects boundary and hash erosion", () => {
    const artifact = resultArtifact as Record<string, any>;
    const originalBoundary = artifact.boundary.noRuntimeDefaultFlipInThisPhase;
    const originalHash = artifact.normalizedSha256;
    try {
      artifact.boundary.noRuntimeDefaultFlipInThisPhase = false;
      artifact.normalizedSha256 = "f".repeat(64);

      const report = validateUser0LvLandDefaultFlipRfcPhase5AJ(process.cwd());

      expect(report.pass).toBe(false);
      expect(report.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
        "phase5aj_stale_artifact",
        "phase5aj_boundary",
        "phase5aj_hash",
      ]));
    } finally {
      artifact.boundary.noRuntimeDefaultFlipInThisPhase = originalBoundary;
      artifact.normalizedSha256 = originalHash;
    }
  });

  it("rejects upstream hash drift", () => {
    const artifact = resultArtifact as Record<string, any>;
    const originalUpstreamHash = artifact.upstreamEvidence[4].stableHash;
    const originalHash = artifact.normalizedSha256;
    try {
      artifact.upstreamEvidence[4].stableHash = "0".repeat(64);
      artifact.normalizedSha256 = hashArtifact(artifact);

      const report = validateUser0LvLandDefaultFlipRfcPhase5AJ(process.cwd());

      expect(report.pass).toBe(false);
      expect(report.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
        "phase5aj_stale_artifact",
        "phase5aj_upstream",
      ]));
      expect(report.errors.map((error) => error.code)).not.toContain("phase5aj_hash");
    } finally {
      artifact.upstreamEvidence[4].stableHash = originalUpstreamHash;
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
