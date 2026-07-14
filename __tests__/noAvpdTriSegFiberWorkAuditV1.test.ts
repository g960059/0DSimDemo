import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gunzipSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import { runNoAvpdTriSegFiberWorkAuditBenchV1 } from "@/engine/mechanics2/benches/NoAvpdTriSegFiberWorkAuditBenchV1";
import type { NoAvpdFourChamberBenchResultV1 } from "@/engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1";
import {
  NO_AVPD_TRISEG_WORK_COORDINATES_V1,
  evaluateNoAvpdTriSegQuadraticEnergyIdentityV1,
} from "@/engine/mechanics2/diagnostics/NoAvpdTriSegFiberWorkAuditV1";
import type { NoAvpdTriSegFiberWorkAuditArtifactV1 } from "@/tools/mechanics2/runNoAvpdTriSegFiberWorkAuditV1";

const sourcePath = resolve(
  process.cwd(),
  "data/mechanics2/reports/no-avpd-physiology-matrix-v1/candidates/lv-ca-decay-155ms-baseline.json.gz",
);
const artifactPath = resolve(
  process.cwd(),
  "data/mechanics2/reports/no-avpd-triseg-fiber-work-audit-v1.json",
);

describe("NoAvpdTriSegFiberWorkAuditV1", () => {
  it("matches a quadratic fiber-energy finite difference to Vw sigma d-epsilon/dq while retaining nonzero T dA mismatch", () => {
    const identity = evaluateNoAvpdTriSegQuadraticEnergyIdentityV1({
      leftVentricleCavityVolumeMl: 140,
      rightVentricleCavityVolumeMl: 150,
      walls: {
        leftFreeWall: { wallVolumeMl: 75, referenceMidwallAreaCm2: 100 },
        septum: { wallVolumeMl: 40, referenceMidwallAreaCm2: 34 },
        rightFreeWall: { wallVolumeMl: 35, referenceMidwallAreaCm2: 110 },
      },
      algebraic: { septalCapVolumeMl: 12, junctionRadiusCm: 3.5 },
    });

    expect(identity.evidenceStatus).toContain("mathematical-identity-only");
    for (const coordinateId of NO_AVPD_TRISEG_WORK_COORDINATES_V1) {
      const row = identity.coordinates[coordinateId];
      expect(row.relativeResidual).toBeLessThan(5e-8);
      expect(row.absoluteResidual).toBeGreaterThanOrEqual(0);
    }
    expect(
      Math.max(
        ...NO_AVPD_TRISEG_WORK_COORDINATES_V1.map((coordinateId) =>
          Math.abs(
            identity.coordinates[coordinateId]
              .currentAreaWorkMismatchFromEnergyGradient,
          ),
        ),
      ),
    ).toBeGreaterThan(1e-3);
  });

  it("audits systolic peak, MVO, E, A, and a 36-point passive grid without changing acceptance", () => {
    const report = JSON.parse(
      gunzipSync(readFileSync(sourcePath)).toString("utf8"),
    ) as NoAvpdFourChamberBenchResultV1;
    const result = runNoAvpdTriSegFiberWorkAuditBenchV1(report);

    expect(result.executionStatus).toBe("complete");
    expect(result.claimBoundary.changesPhysicsEquilibrium).toBe(false);
    expect(result.claimBoundary.physiologyAcceptanceGate).toBe(false);
    expect(
      result.claimBoundary
        .lumens2009RepresentativeTensionAreaWorkIsLiteratureFaithful,
    ).toBe(true);
    expect(
      result.claimBoundary.fullFiberEnergyGradientIsCorrectionToLumens2009,
    ).toBe(false);
    expect(
      result.mappingInterpretation
        .numericalDifferenceIsBlockingStructuralFailure,
    ).toBe(false);
    expect(result.mappingInterpretation.winnerSelectionApplied).toBe(false);
    expect(result.nominalCycle.rows.map((row) => row.pointId)).toEqual([
      "systolic-peak",
      "mvo50",
      "e-peak",
      "a-peak",
    ]);
    for (const row of result.nominalCycle.rows) {
      expect(row.maximumAbsoluteFiberStrainReadbackResidual).toBeLessThan(
        1e-14,
      );
      expect(
        row.maximumAbsoluteTotalStressDecompositionResidualPa,
      ).toBeLessThan(1e-8);
      expect(
        Math.abs(row.sourcePressureReconstructionResidualPa.leftVentricle),
      ).toBeLessThan(1e-9);
      expect(
        Math.abs(row.sourcePressureReconstructionResidualPa.rightVentricle),
      ).toBeLessThan(1e-9);
      for (const coordinateId of NO_AVPD_TRISEG_WORK_COORDINATES_V1) {
        expect(
          Math.abs(
            row.audit.coordinates[coordinateId].currentAreaWorkIdentityResidual,
          ),
        ).toBeLessThan(1e-8);
      }
    }
    for (const coordinateId of NO_AVPD_TRISEG_WORK_COORDINATES_V1) {
      expect(
        result.nominalCycle.summary[coordinateId]
          .numericallyNonzeroMismatchCount,
      ).toBe(4);
      expect(
        result.passiveGrid.currentVsDeclaredSummary[coordinateId]
          .numericallyNonzeroMismatchCount,
      ).toBe(36);
      expect(
        result.passiveGrid.quadraticEnergyIdentitySummary[coordinateId]
          .finiteDifferenceVsDirectRelativeResidual.maximum,
      ).toBeLessThan(5e-8);
    }
    expect(result.passiveGrid.pointCount).toBe(36);
    expect(
      result.nominalCycle.summary.leftVentricleCavityVolumeM3
        .pressureAbsoluteMismatchMmHg!.maximum,
    ).toBeGreaterThan(1);
    expect(
      result.nominalCycle.summary.septalCapVolumeM3
        .contributionScaleRelativeMismatch.maximum,
    ).toBeGreaterThan(0.1);
    expect(
      result.nominalCycle.summary.junctionRadiusM
        .contributionScaleRelativeMismatch.maximum,
    ).toBeGreaterThan(0.1);
  });

  it("pins the generated report to normalized source and audit hashes", () => {
    const artifact = JSON.parse(
      readFileSync(artifactPath, "utf8"),
    ) as NoAvpdTriSegFiberWorkAuditArtifactV1;
    const { normalizedSha256, ...body } = artifact;
    expect(sha256Json(body)).toBe(normalizedSha256);
    expect(artifact.sourceImplementationMatchesCurrent).toBe(
      artifact.source.implementationSha256 ===
        artifact.currentModelImplementationSha256,
    );
    expect(artifact.auditImplementationSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(artifact.audit.nominalCycle.pointCount).toBe(4);
    expect(artifact.audit.passiveGrid.pointCount).toBe(36);
    expect(artifact.evidenceStatus).toContain("no-acceptance-gate");
  });
});

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
