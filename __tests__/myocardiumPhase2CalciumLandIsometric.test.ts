import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import protocolDescriptor from "@/data/myocardium/protocols/calcium-land-phase2b-isometric-protocols.json";
import {
  PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
} from "@/engine/myocardium/calcium";
import { LAND2017_STATE_INDEX } from "@/engine/myocardium/myofilament/land2017";
import {
  CALCIUM_LAND_ISOMETRIC_PHASE2B_CLAIM_BOUNDARY,
  CALCIUM_LAND_ISOMETRIC_PHASE2B_EVIDENCE_STATUS,
  runCalciumLandIsometricPhase2BReport,
  runCalciumLandIsometricTrajectory,
  scalePrescribedCalciumPeakAmplitude,
} from "@/engine/myocardium/protocols/calciumLandIsometric";

describe("myocardium Phase 2B isometric prescribed Ca plus Land", () => {
  it("declares a standalone isometric Ca+Land synthetic coupling boundary", () => {
    expect(protocolDescriptor.claimBoundary).toBe(CALCIUM_LAND_ISOMETRIC_PHASE2B_CLAIM_BOUNDARY);
    expect(protocolDescriptor.evidenceStatus).toBe(CALCIUM_LAND_ISOMETRIC_PHASE2B_EVIDENCE_STATUS);
    expect(protocolDescriptor.experimentalTargets).toBe("deferred");
    expect(protocolDescriptor.ownerAcceptanceStatus).toBe("not-owner-acceptance");
    expect(protocolDescriptor.pendingOwnerDecisions).toEqual(
      expect.arrayContaining([expect.objectContaining({ decisionId: 10, status: "PENDING OWNER" })]),
    );
    expect(JSON.stringify(protocolDescriptor)).not.toMatch(/experimentalPass/);
  });

  it("runs a fixed-strain source-stress trajectory without projection or solver failure", () => {
    const trajectory = runCalciumLandIsometricTrajectory();

    expect(trajectory.ok).toBe(true);
    expect(trajectory.samples.length).toBeGreaterThan(100);
    expect(trajectory.samples.every((sample) => Number.isFinite(sample.freeCalciumUM))).toBe(true);
    expect(trajectory.samples.every((sample) => Number.isFinite(sample.sourceActiveFiberStressPa))).toBe(true);
    expect(trajectory.samples.some((sample) => sample.sourceActiveFiberStressPa > 0)).toBe(true);
    expect(trajectory.samples.some((sample) => sample.projectionUsed)).toBe(false);
  });

  it("reports every required Tier C1 synthetic isometric metric", () => {
    const report = runCalciumLandIsometricPhase2BReport();
    const metrics = report.sections.find((section) => section.id === "isometric-ca-land-twitch-metrics-v1")?.metrics;

    expect(report.closurePass).toBe(true);
    expect(metrics).toMatchObject({
      sourceStressOnly: true,
      trajectoryComplete: true,
      projectionUsed: false,
      solverFailureCount: 0,
    });
    for (const key of [
      "peakStressPa",
      "timeToPeakMs",
      "fwhmMs",
      "width80Ms",
      "width90Ms",
      "relaxationTauMs",
      "relaxationTauR2",
      "maxUpstrokePaPerSec",
      "maxRelaxationPaPerSec",
      "peakMeanRatio",
    ]) {
      expect(metrics?.[key]).toEqual(expect.any(Number));
      expect(Number.isFinite(metrics?.[key])).toBe(true);
    }
    expect(metrics?.maxUpstrokePaPerSec as number).toBeGreaterThan(0);
    expect(metrics?.maxRelaxationPaPerSec as number).toBeLessThan(0);
  });

  it("changes Land source stress directionally when prescribed Ca amplitude changes", () => {
    const low = runCalciumLandIsometricTrajectory({
      params: scalePrescribedCalciumPeakAmplitude(PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET, 0.8),
    });
    const high = runCalciumLandIsometricTrajectory({
      params: scalePrescribedCalciumPeakAmplitude(PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET, 1.2),
    });
    const lowPeak = Math.max(...low.samples.map((sample) => sample.sourceActiveFiberStressPa));
    const highPeak = Math.max(...high.samples.map((sample) => sample.sourceActiveFiberStressPa));

    expect(low.ok).toBe(true);
    expect(high.ok).toBe(true);
    expect(highPeak).toBeGreaterThan(lowPeak);
  });

  it("turns invalid Land initial state into a structured protocol failure", () => {
    const invalidLandState = Float64Array.from([0.18, 0.22, 0.04, 0.02, 0, 0]);
    invalidLandState[LAND2017_STATE_INDEX.CaTRPN] = 0;
    const trajectory = runCalciumLandIsometricTrajectory({ initialLandState: invalidLandState });

    expect(trajectory.ok).toBe(false);
    expect(trajectory.failureReason).toBe("domain-error");
    expect(trajectory.samples.length).toBe(0);
  });

  it("keeps the report deterministic and free of loaded pressure claims", () => {
    const first = runCalciumLandIsometricPhase2BReport();
    const second = runCalciumLandIsometricPhase2BReport();
    const text = JSON.stringify(first);

    expect(first.stableSummaryHash).toBe(second.stableSummaryHash);
    expect(first.claimBoundary).toBe(CALCIUM_LAND_ISOMETRIC_PHASE2B_CLAIM_BOUNDARY);
    expect(first.evidenceStatus).toBe(CALCIUM_LAND_ISOMETRIC_PHASE2B_EVIDENCE_STATUS);
    expect(first.experimentalTargets).toBe("deferred");
    expect(first.ownerAcceptanceStatus).toBe("not-owner-acceptance");
    expect(first.closurePass).toBe(true);
    expect(text).not.toMatch(/experimentalPass|LVP|loadedPressure|valve|qDot|generalizedForces/i);
    expect(text).not.toMatch(/tierC1Pass|targetPass|acceptedTarget|acceptedThreshold|acceptancePass|validationPass|fitPass/i);
  });

  it("keeps Ca+Land orchestration out of pure Land source and runtime integration code", () => {
    const repoRoot = process.cwd();
    const references = listFiles(repoRoot)
      .filter((file) => /\.(ts|tsx|json|md)$/.test(file))
      .filter((file) => !file.includes("/node_modules/"))
      .filter((file) => !file.includes("/.git/"))
      .filter((file) => {
        const text = readFileSync(file, "utf8");
        return text.includes("calciumLandIsometric") || text.includes("CalciumLandIsometric");
      });
    const allowedFragments = [
      "/__tests__/myocardiumPhase2CalciumLandIsometric.test.ts",
      "/__tests__/myocardiumPhase2PrescribedCalcium.test.ts",
      "/docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
      "/engine/myocardium/protocols/calciumLandIsometric.ts",
      "/package.json",
      "/tools/myocardium/verifyCalciumLandIsometric.ts",
    ];

    for (const file of references) {
      expect(allowedFragments.some((fragment) => file.includes(fragment))).toBe(true);
      expect(file).not.toContain("/engine/myocardium/myofilament/land2017/");
      expect(file).not.toMatch(/\/engine\/ModelCore\.ts$/);
      expect(file).not.toMatch(/\/engine\/chambers\.ts$/);
    }
  });
});

function listFiles(root: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if ([".git", "node_modules", "dist", "build", "coverage"].includes(entry.name)) continue;
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(fullPath));
    } else if (entry.isFile()) {
      out.push(fullPath);
    }
  }
  return out;
}
