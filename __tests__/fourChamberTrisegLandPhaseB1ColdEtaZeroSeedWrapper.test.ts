import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  PHASE_B1_PROJECT_SYNTHETIC_COLD_ETA_ZERO_FROM_TRISEG_SEED_V1_ID,
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
  solvePhaseB1ProjectSyntheticColdEtaZeroFromTriSegSeedV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import { WALL_IDS } from
  "@/engine/myocardium/fourChamberV1/topology/contracts";

const UPSTREAM_EVIDENCE_SHA256 = "a".repeat(64);
const CENTER_SEED = Object.freeze({ V_m_S: 0, y_m: 0.03 });

describe("Phase B1 eta=0 cold initialization from an external TriSeg seed", () => {
  it.each(["on", "off"] as const)(
    "re-equilibrates and audits the SLS-%s state without importing a warm start",
    (slsMode) => {
      const result = solvePhaseB1ProjectSyntheticColdEtaZeroFromTriSegSeedV1(
        slsMode,
        CENTER_SEED,
        UPSTREAM_EVIDENCE_SHA256,
        sha256,
      );
      expect(result.adapterId).toBe(
        PHASE_B1_PROJECT_SYNTHETIC_COLD_ETA_ZERO_FROM_TRISEG_SEED_V1_ID,
      );
      expect(result.upstreamEvidenceSha256).toBe(UPSTREAM_EVIDENCE_SHA256);
      expect(result.upstreamTriSegSeed).toEqual(CENTER_SEED);
      expect(result.eta).toBe(0);
      expect(result.analyticallyReequilibratedSeedEndpoint.triSegCoordinates)
        .toEqual(CENTER_SEED);
      expect(result.analyticallyReequilibratedSeedUnknowns).toHaveLength(
        slsMode === "on" ? 37 : 32,
      );
      expect(result.warmStartImportedOrConsumed).toBe(false);
      expect(result.bloodVolumeAdjustmentApplied).toBe(false);
      expect(result.flowAdjustmentApplied).toBe(false);
      expect(result.calciumWasNewtonUnknown).toBe(false);
      if (!result.converged) throw new Error("eta=0 external-seed solve failed");
      expect(result.converged).toBe(true);

      const { node, equilibriumAudit: audit } = result;
      expect(node.eta).toBe(0);
      expect(node.unknowns).toHaveLength(result.layout.unknownCount);
      expect(node.residualEvaluation.residual).toHaveLength(
        result.layout.unknownCount,
      );
      expect(node.scaledResidualInfinityNorm).toBeLessThanOrEqual(
        PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
          .maximumScaledColdResidualInfinityNorm,
      );
      expect(audit.coupledColdNodeEquilibriumPass, JSON.stringify(audit))
        .toBe(true);
      expect(audit.upstreamSeedCoordinatesEncodedExactly).toBe(true);
      expect(audit.etaIsExactlyZero).toBe(true);
      expect(audit.topologyPass).toBe(true);
      expect(audit.materialEquilibriumPass).toBe(true);
      expect(audit.slsEquilibriumPass).toBe(true);
      expect(audit.calciumEquilibriumPass).toBe(true);
      expect(audit.triSegEquilibriumPass).toBe(true);
      expect(audit.prohibitedNumericalOperationsAbsent).toBe(true);
      expect(audit.residualVector).toEqual(node.residualEvaluation.residual);
      expect(audit.endpointTopologyVectors.slsMode).toBe(slsMode);
      expect(audit.endpointTopologyVectors.nonCalciumDifferentialState)
        .toHaveLength(slsMode === "on" ? 49 : 44);
      expect(audit.endpointTopologyVectors.algebraicState).toEqual([
        node.endpoint.triSegCoordinates.V_m_S,
        node.endpoint.triSegCoordinates.y_m,
      ]);
      expect(audit.closedLoopStationarityClaimed).toBe(false);
      expect(audit.physiologicalInitializationClaimed).toBe(false);
      expect(audit.supportedEnvelopeClaimed).toBe(false);
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(audit)).toBe(true);
      expect(Object.isFrozen(audit.residualVector)).toBe(true);

      for (const wallId of WALL_IDS) {
        const wall = audit.wallByWall[wallId];
        expect(Object.isFrozen(wall)).toBe(true);
        expect(wall.wallId).toBe(wallId);
        expect(wall.wallPass).toBe(true);
        expect(wall.materialEquilibriumPass).toBe(true);
        expect(wall.calciumState).toEqual({ r: 0, d: 0 });
        expect(wall.calciumResidualPresent).toBe(false);
        expect(wall.calciumIsKnownEndpointForcing).toBe(true);
        expect(wall.sourceLandStateFinite).toBe(true);
        expect(wall.sourceLandProjectionUsed).toBe(false);
        expect(wall.minimumLandPopulationSimplexMargin).toBeGreaterThan(0);
        if (slsMode === "on") {
          expect(wall.slsStatePhysicallyPresent).toBe(true);
          expect(wall.slsAlphaV).not.toBeNull();
          expect(wall.slsAlphaVMinusFiberLogStrain).not.toBeNull();
        } else {
          expect(wall.slsStatePhysicallyPresent).toBe(false);
          expect(wall.slsAlphaV).toBeNull();
          expect(wall.slsAlphaVMinusFiberLogStrain).toBeNull();
          expect(wall.slsOverstressPa).toBe(0);
          expect(wall.equalStateBackwardEulerSlsResidual).toBeNull();
        }
      }
    },
  );

  it("rejects malformed upstream bindings and nonphysical seed radii", () => {
    expect(() => solvePhaseB1ProjectSyntheticColdEtaZeroFromTriSegSeedV1(
      "on",
      CENTER_SEED,
      "not-a-sha",
      sha256,
    )).toThrow(/upstreamEvidenceSha256/);
    expect(() => solvePhaseB1ProjectSyntheticColdEtaZeroFromTriSegSeedV1(
      "off",
      { V_m_S: 0, y_m: 0 },
      UPSTREAM_EVIDENCE_SHA256,
      sha256,
    )).toThrow(/triSegSeed\.y_m/);
  });
});

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
