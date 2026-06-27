import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import protocolDescriptor from "@/data/myocardium/protocols/calcium-land-phase2c-prescribed-shortening-protocols.json";
import {
  CALCIUM_LAND_PRESCRIBED_SHORTENING_EXPECTED_TRAJECTORY_IDS,
  CALCIUM_LAND_PRESCRIBED_SHORTENING_PHASE2C_CLAIM_BOUNDARY,
  CALCIUM_LAND_PRESCRIBED_SHORTENING_PHASE2C_EVIDENCE_STATUS,
  computeCalciumLandPrescribedShorteningTrajectoryProvenanceHash,
  runCalciumLandPrescribedShorteningPhase2CReport,
  runCalciumLandPrescribedShorteningTrajectoryFamily,
  type CalciumLandPrescribedShorteningTrajectoryMember,
} from "@/engine/myocardium/protocols/calciumLandPrescribedShortening";

describe("myocardium Phase 2C prescribed shortening Ca plus Land", () => {
  it("declares a standalone prescribed-shortening transfer boundary with deferred owner acceptance", () => {
    expect(protocolDescriptor.claimBoundary).toBe(CALCIUM_LAND_PRESCRIBED_SHORTENING_PHASE2C_CLAIM_BOUNDARY);
    expect(protocolDescriptor.evidenceStatus).toBe(CALCIUM_LAND_PRESCRIBED_SHORTENING_PHASE2C_EVIDENCE_STATUS);
    expect(protocolDescriptor.experimentalTargets).toBe("deferred");
    expect(protocolDescriptor.ownerAcceptanceStatus).toBe("not-owner-acceptance");
    expect(protocolDescriptor.pendingOwnerDecisions).toEqual(
      expect.arrayContaining([expect.objectContaining({ decisionId: 10, status: "PENDING OWNER" })]),
    );
    expect(protocolDescriptor.sourceDocuments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ documentId: "prescribed-calcium-phase2a-synthetic-protocols-v1" }),
        expect.objectContaining({ sourceId: "land2017-human-contraction" }),
        expect.objectContaining({ documentId: "land2017-phase1c-source-protocols-v1" }),
      ]),
    );
    expect(protocolDescriptor.sourceDocuments).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ documentId: "calcium-land-phase2b-isometric-protocols-v1" }),
      ]),
    );
    expect(JSON.stringify(protocolDescriptor)).not.toMatch(/experimentalPass/);
  });

  it("completes the required zero-rate, shortening, lengthening, and constant-velocity trajectory family", () => {
    const family = prescribedShorteningFamily();

    expect(family.map((member) => member.id)).toEqual(
      Array.from(CALCIUM_LAND_PRESCRIBED_SHORTENING_EXPECTED_TRAJECTORY_IDS),
    );
    expect(protocolDescriptor.trajectoryFamily.members.map((member) => member.id)).toEqual(
      Array.from(CALCIUM_LAND_PRESCRIBED_SHORTENING_EXPECTED_TRAJECTORY_IDS),
    );
    expect(family.every((member) => member.ok)).toBe(true);
    expect(family.every((member) => member.samples.length > 100)).toBe(true);
  });

  it("keeps the generated report free of forbidden acceptance and loaded-system terms", () => {
    const report = runCalciumLandPrescribedShorteningPhase2CReport();
    const text = JSON.stringify(report);

    expect(report.closurePass).toBe(true);
    expect(report.claimBoundary).toBe(CALCIUM_LAND_PRESCRIBED_SHORTENING_PHASE2C_CLAIM_BOUNDARY);
    expect(report.evidenceStatus).toBe(CALCIUM_LAND_PRESCRIBED_SHORTENING_PHASE2C_EVIDENCE_STATUS);
    expect(report.experimentalTargets).toBe("deferred");
    expect(report.ownerAcceptanceStatus).toBe("not-owner-acceptance");
    expect(text).not.toMatch(/experimentalPass/);
    expect(text).not.toMatch(/tierC2Pass|tierPass|targetPass|acceptedTarget|acceptedThreshold|acceptancePass|validationPass|fitPass/i);
    expect(text).not.toMatch(forbiddenReportClaimPattern);
  });

  it("derives every sample rate from previous strain, stage strain, and dt", () => {
    const family = prescribedShorteningFamily();

    for (const member of family) {
      for (const sample of member.samples) {
        const derived = (sample.stageFiberEngineeringStrain - sample.previousFiberEngineeringStrain) / sample.dtSec;
        expect(sample.derivedFiberEngineeringStrainRatePerSec).toBeCloseTo(derived, 14);
        expect(sample.rateAuditResidualPerSec).toBeCloseTo(0, 14);
        expect(Number.isFinite(sample.derivedFiberEngineeringStrainRatePerSec)).toBe(true);
      }
    }
  });

  it("requires finite Land health, conservation residual, no projection, and no solver failure for every member", () => {
    const family = prescribedShorteningFamily();

    for (const member of family) {
      expect(member.metrics.allLandHealthFinite).toBe(true);
      expect(member.metrics.maxConservationResidual).toBeLessThanOrEqual(1e-12);
      expect(member.metrics.projectionUsed).toBe(false);
      expect(member.metrics.solverFailureCount).toBe(0);
      expect(member.samples.every((sample) => sample.landHealthFinite)).toBe(true);
      expect(member.samples.some((sample) => sample.projectionUsed)).toBe(false);
    }
  });

  it("smokes morphology transfer through stress, power, and shape changes without acceptance claims", () => {
    const family = prescribedShorteningFamily();
    const zeroRate = requiredMember(family, "zero-rate-isometric");
    const physiologic = requiredMember(family, "physiologic-shortening");
    const report = runCalciumLandPrescribedShorteningPhase2CReport();
    const section = requiredSection(report, "morphology-transfer-smoke-v1");

    expect(physiologic.metrics.peakStressPa).not.toBeCloseTo(zeroRate.metrics.peakStressPa, 5);
    expect(physiologic.metrics.peakAbsPowerDensityWPerM3).toBeGreaterThan(zeroRate.metrics.peakAbsPowerDensityWPerM3);
    expect(section.status).toBe("closure-pass");
    expect(section.metrics.shapeDistance as number).toBeGreaterThan(1e-4);
    expect(JSON.stringify(section)).not.toMatch(/targetPass|acceptedTarget|acceptedThreshold|acceptancePass/i);
  });

  it("replays deterministically with a stable trajectory provenance hash", () => {
    const first = runCalciumLandPrescribedShorteningPhase2CReport();
    const second = runCalciumLandPrescribedShorteningPhase2CReport();
    const directHash = computeCalciumLandPrescribedShorteningTrajectoryProvenanceHash();

    expect(first.stableSummaryHash).toBe(second.stableSummaryHash);
    expect(first.trajectoryFamily.trajectoryProvenanceHash).toBe(second.trajectoryFamily.trajectoryProvenanceHash);
    expect(first.trajectoryFamily.trajectoryProvenanceHash).toBe(directHash);
    expect(first.trajectoryFamily.trajectoryProvenanceHash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("keeps Phase 2C orchestration out of pure Land source and runtime integration code", () => {
    const repoRoot = process.cwd();
    const references = listFiles(repoRoot)
      .filter((file) => /\.(ts|tsx|json|md)$/.test(file))
      .filter((file) => !file.includes("/node_modules/"))
      .filter((file) => !file.includes("/.git/"))
      .filter((file) => {
        const text = readFileSync(file, "utf8");
        return (
          text.includes("calciumLandPrescribedShortening")
          || text.includes("CalciumLandPrescribedShortening")
          || text.includes("calcium-land-phase2c-prescribed-shortening")
        );
      });
    const allowedFragments = [
      "/__tests__/myocardiumPhase2PrescribedCalcium.test.ts",
      "/__tests__/myocardiumPhase2PrescribedShortening.test.ts",
      "/data/myocardium/protocols/calcium-land-phase2c-prescribed-shortening-protocols.json",
      "/docs/myocardium/",
      "/engine/myocardium/protocols/calciumLandPrescribedShortening.ts",
      "/package.json",
      "/data/myocardium/protocols/land-active-stress-replacement-phase4b-protocols.json",
      "/engine/myocardium/protocols/landActiveStressReplacementReadiness.ts",
      "/tools/myocardium/verifyLandActiveStressReplacement.ts",
      "/tools/myocardium/verifyPrescribedShortening.ts",
    ];

    for (const file of references) {
      expect(allowedFragments.some((fragment) => file.includes(fragment))).toBe(true);
      expect(file).not.toContain("/engine/myocardium/myofilament/land2017/");
      expect(file).not.toMatch(/\/engine\/ModelCore\.ts$/);
      expect(file).not.toMatch(/\/engine\/chambers\.ts$/);
    }
  });
});

let cachedFamily: readonly CalciumLandPrescribedShorteningTrajectoryMember[] | undefined;

function prescribedShorteningFamily(): readonly CalciumLandPrescribedShorteningTrajectoryMember[] {
  cachedFamily ??= runCalciumLandPrescribedShorteningTrajectoryFamily();
  return cachedFamily;
}

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

function requiredMember(
  family: readonly CalciumLandPrescribedShorteningTrajectoryMember[],
  id: string,
): CalciumLandPrescribedShorteningTrajectoryMember {
  const member = family.find((candidate) => candidate.id === id);
  expect(member).toBeDefined();
  return member!;
}

function requiredSection(
  report: ReturnType<typeof runCalciumLandPrescribedShorteningPhase2CReport>,
  id: string,
) {
  const section = report.sections.find((candidate) => candidate.id === id);
  expect(section).toBeDefined();
  return section!;
}

const forbiddenReportClaimPattern =
  /\b(?:LV|RV|chamber|loaded|loadedPressure|pressure|valve|qDot|homogenization|generalizedForces?)\b|free-wall|(?:lv|rv)?freeWall/i;
