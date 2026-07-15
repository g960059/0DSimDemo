import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  stepPhaseB1EventFreeMonolithicBackwardEulerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import {
  createPhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  PHASE_B1_WHOLE_HEART_SLS_BE_ALPHA_MISMATCH_TOLERANCE_V1,
  PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1,
  auditPhaseB1WholeHeartSlsBackwardEulerIdentityV1,
  assertPhaseB1WholeHeartSlsBackwardEulerAuditSourceBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartSlsBackwardEulerAuditV1";
import {
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

describe("four-chamber Phase B1 whole-heart SLS backward-Euler identity", () => {
  it.each(["on", "off"] as const)(
    "audits the accepted monolithic SLS-%s endpoint without adding hidden states",
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
      const audit = auditPhaseB1WholeHeartSlsBackwardEulerIdentityV1({
        model: candidate.model,
        wallMaterialBinding: candidate.wallMaterialBinding,
        previousEndpoint: candidate.warmStart.endpoint,
        nextEndpointLeftLimit: step.nextEndpointLeftLimit,
        dtSec: 0.25e-3,
      });
      expect(audit.mode).toBe(slsMode);
      expect(audit.modelObjectAtAudit).toBe(candidate.model);
      expect(audit.wallMaterialBindingObjectAtAudit)
        .toBe(candidate.wallMaterialBinding);
      expect(audit.dtSec).toBe(0.25e-3);
      expect(assertPhaseB1WholeHeartSlsBackwardEulerAuditSourceBindingV1({
        audit,
        model: candidate.model,
        wallMaterialBinding: candidate.wallMaterialBinding,
        previousEndpoint: candidate.warmStart.endpoint,
        nextEndpointLeftLimit: step.nextEndpointLeftLimit,
        dtSec: 0.25e-3,
      })).toBe(audit);
      const reconstructed = Object.freeze({ ...audit });
      expect(() =>
        assertPhaseB1WholeHeartSlsBackwardEulerAuditSourceBindingV1({
          audit: reconstructed,
          model: candidate.model,
          wallMaterialBinding: candidate.wallMaterialBinding,
          previousEndpoint: candidate.warmStart.endpoint,
          nextEndpointLeftLimit: step.nextEndpointLeftLimit,
          dtSec: 0.25e-3,
        })).toThrow("in-process builder result");
      expect(audit.normalizedIdentityAccepted).toBe(true);
      expect(audit.normalizedIdentityResidual)
        .toBeLessThan(audit.normalizedIdentityResidualTolerance);
      expect(audit.normalizationDenominatorJ).toBeGreaterThan(0);
      expect(audit.normalizedIdentityResidualRule).toBe(
        "maximum-of-per-wall-scale-normalized-stable-be-identity-residuals",
      );
      expect(Number.isFinite(
        audit.maximumAbsoluteExpandedIdentityResidualJDiagnostic,
      )).toBe(true);
      expect(Number.isFinite(
        audit.signedAllWallExpandedIdentityResidualJDiagnostic,
      )).toBe(true);
      expect(audit.alphaMismatchTolerance).toBe(
        PHASE_B1_WHOLE_HEART_SLS_BE_ALPHA_MISMATCH_TOLERANCE_V1,
      );
      expect(audit.alphaMismatchAccepted).toBe(true);
      expect(audit.phaseB1Acceptance).toBe(false);
      expect(audit.releaseRuntimeReachable).toBe(false);
      if (slsMode === "off") {
        expect(audit.wallAuditByWall).toBeNull();
        expect(audit.slsStatePhysicallyAbsent).toBe(true);
        expect(audit.normalizedIdentityResidual).toBe(0);
        expect(Object.hasOwn(
          step.nextEndpointLeftLimit.differentialState,
          "slsAlphaVByWall",
        )).toBe(false);
        return;
      }
      expect(audit.wallAuditByWall).not.toBeNull();
      expect(audit.slsStatePhysicallyAbsent).toBe(false);
      expect(audit.maximumAbsoluteAlphaMismatch).toBeLessThan(1e-12);
      expect(audit.maximumAbsoluteComponentOracleIdentityResidualJ)
        .toBeLessThan(1e-18);
      expect(audit.normalizedIdentityResidual).toBe(Math.max(
        ...WALL_IDS.map((wallId) =>
          audit.wallAuditByWall?.[wallId].normalizedIdentityResidual ?? -1),
      ));
      for (const wallId of WALL_IDS) {
        const wall = audit.wallAuditByWall?.[wallId];
        expect(wall?.wallId).toBe(wallId);
        expect(wall?.wallReferenceMaterialVolumeM3).toBeGreaterThan(0);
        expect(wall?.numericalDissipationIncrementJ).toBeGreaterThanOrEqual(0);
        expect(wall?.physicalDissipationIncrementJ).toBeGreaterThanOrEqual(0);
      }
    },
  );

  it("rejects perturbed opposite-wall SLS states despite signed cancellation", () => {
    const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
      "on",
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
    const state = step.nextEndpointLeftLimit.differentialState;
    if (state.slsMode !== "on") throw new Error("expected SLS-on endpoint");
    const auditWithRaOffset = (raOffset: number) => {
      const perturbedEndpoint = createPhaseB1EndpointStateV1({
        timeSec: step.nextEndpointLeftLimit.timeSec,
        differentialState: {
          ...state,
          slsAlphaVByWall: {
            ...state.slsAlphaVByWall,
            LA: state.slsAlphaVByWall.LA + 1e-8,
            RA: state.slsAlphaVByWall.RA + raOffset,
          },
        },
        triSegCoordinates: step.nextEndpointLeftLimit.triSegCoordinates,
      });
      return auditPhaseB1WholeHeartSlsBackwardEulerIdentityV1({
        model: candidate.model,
        wallMaterialBinding: candidate.wallMaterialBinding,
        previousEndpoint: candidate.warmStart.endpoint,
        nextEndpointLeftLimit: perturbedEndpoint,
        dtSec: 0.25e-3,
      });
    };
    let positiveOffset = 0;
    let negativeOffset = -2e-8;
    let positiveAudit = auditWithRaOffset(positiveOffset);
    let negativeAudit = auditWithRaOffset(negativeOffset);
    expect(positiveAudit.signedAllWallIdentityResidualJ).toBeGreaterThan(0);
    expect(negativeAudit.signedAllWallIdentityResidualJ).toBeLessThan(0);
    for (let iteration = 0; iteration < 64; iteration += 1) {
      const midpoint = (positiveOffset + negativeOffset) / 2;
      const midpointAudit = auditWithRaOffset(midpoint);
      if (midpointAudit.signedAllWallIdentityResidualJ > 0) {
        positiveOffset = midpoint;
        positiveAudit = midpointAudit;
      } else {
        negativeOffset = midpoint;
        negativeAudit = midpointAudit;
      }
    }
    const positiveAbsoluteResidual = Math.abs(
      positiveAudit.signedAllWallIdentityResidualJ,
    );
    const negativeAbsoluteResidual = Math.abs(
      negativeAudit.signedAllWallIdentityResidualJ,
    );
    const audit = positiveAbsoluteResidual < negativeAbsoluteResidual
      ? positiveAudit
      : negativeAudit;
    const signedAggregateNormalizedResidual =
      Math.abs(audit.signedAllWallIdentityResidualJ)
      / audit.normalizationDenominatorJ;
    expect(signedAggregateNormalizedResidual).toBeLessThan(
      PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1,
    );
    expect(audit.normalizedIdentityResidual).toBeGreaterThan(
      PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1,
    );
    expect(audit.normalizedIdentityResidual).toBe(Math.max(
      ...WALL_IDS.map((wallId) =>
        audit.wallAuditByWall?.[wallId].normalizedIdentityResidual ?? -1),
    ));
    expect(audit.maximumAbsoluteAlphaMismatch).toBeGreaterThan(
      PHASE_B1_WHOLE_HEART_SLS_BE_ALPHA_MISMATCH_TOLERANCE_V1,
    );
    expect(audit.alphaMismatchAccepted).toBe(false);
    expect(audit.normalizedIdentityAccepted).toBe(false);
  });
});

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
