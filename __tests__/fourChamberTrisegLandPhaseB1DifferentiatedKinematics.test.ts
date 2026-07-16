import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  reconstructPhaseB1DifferentiatedStageKinematicsV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/differentiatedStageKinematicsV1";
import {
  stepPhaseB1EventFreeMonolithicBackwardEulerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicNumericalPolicyV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import {
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

describe("four-chamber Phase B1 differentiated stage kinematics", () => {
  it.each(["on", "off"] as const)(
    "assembles every SLS-%s Land rate while preserving structural atrial TriSeg zeros",
    (slsMode) => {
      const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
        slsMode,
        sha256,
      );
      const step = stepPhaseB1EventFreeMonolithicBackwardEulerV1({
        model: candidate.model,
        wallMaterialBinding: candidate.wallMaterialBinding,
        previousEndpoint: candidate.warmStart.endpoint,
        dtSec: 0.25e-3,
      });
      if (step.converged === false) {
        throw new Error(`${step.reason}: ${step.message}`);
      }
      const kinematics = reconstructPhaseB1DifferentiatedStageKinematicsV1({
        model: candidate.model,
        wallMaterialBinding: candidate.wallMaterialBinding,
        previousEndpoint: candidate.warmStart.endpoint,
        nextEndpointLeftLimit: step.nextEndpointLeftLimit,
        dtSec: 0.25e-3,
      });
      expect(kinematics.accepted).toBe(true);
      expect(kinematics.globalJacobianAudit.accepted).toBe(true);
      expect(kinematics.landDirectionCount).toBe(30);
      expect(kinematics
        .allThirtyLandStateRatesAssembledIntoDifferentiatedConstraintInput)
        .toBe(true);
      expect(kinematics
        .atrialLandColumnsStructurallyZeroInTriSegEquilibriumRows).toBe(true);
      expect(kinematics.laggedEndpointStrainDifferenceUsed).toBe(false);
      expect(kinematics.calciumRateEntersInstantaneousMechanicalConstraint)
        .toBe(false);
      expect(kinematics.differentiatedConstraintResidualNPerMSec.accepted)
        .toBe(true);
      expect(kinematics.differentiatedConstraintResidualNPerMSec.infinityNorm)
        .toBeLessThan(
          PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
            .differentiatedTriSegConstraintResidualToleranceNPerMSec,
        );
      expect(kinematics.stepHalvingAudit.accepted).toBe(true);
      expect(kinematics.stepHalvingAudit.maximumNormalizedRateDifference)
        .toBeLessThan(
          PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
            .differentiatedKinematicsHalvingRelativeTolerance,
        );
      expect(kinematics.fiberLogStrainRateSource)
        .toBe("analytic-five-wall-geometry-chain-rule");
      expect(kinematics.centeredFiniteDifferenceFiberRateUsedForMechanicalPower)
        .toBe(false);
      expect(kinematics.stepHalvingAudit.canonicalRateSource)
        .toBe("analytic-five-wall-geometry-chain-rule");
      expect(kinematics.stepHalvingAudit.centeredFiniteDifferenceRole)
        .toBe("audit-only");
      expect(kinematics.stepHalvingAudit.analyticAgreementAccepted).toBe(true);
      expect(kinematics.stepHalvingAudit
        .maximumCoarseToAnalyticNormalizedRateDifference)
        .toBeLessThan(
          PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
            .differentiatedKinematicsHalvingRelativeTolerance,
        );
      expect(kinematics.stepHalvingAudit
        .maximumFineToAnalyticNormalizedRateDifference)
        .toBeLessThan(
          PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
            .differentiatedKinematicsHalvingRelativeTolerance,
        );
      expect(kinematics.scaledTriSegJacobianDiagnostics.numericallySingular)
        .toBe(false);
      for (const wallId of WALL_IDS) {
        expect(kinematics.landStateRatePerSecByWall[wallId]).toHaveLength(6);
        expect(Number.isFinite(
          kinematics.fiberLogStrainRatePerSecByWall[wallId],
        )).toBe(true);
        expect(kinematics.fiberLogStrainRatePerSecByWall[wallId])
          .toBe(kinematics.stepHalvingAudit
            .analyticFiberLogStrainRatePerSecByWall[wallId]);
      }
      if (slsMode === "on") {
        expect(kinematics.slsAlphaRatePerSecByWall).not.toBeNull();
      } else {
        expect(kinematics.slsAlphaRatePerSecByWall).toBeNull();
      }
      expect(kinematics.phaseB1Acceptance).toBe(false);
      expect(kinematics.releaseRuntimeReachable).toBe(false);
    },
  );
});

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
