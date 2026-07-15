import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  evaluatePhaseB1EventFreeEndpointV1,
  stepPhaseB1EventFreeMonolithicBackwardEulerV1,
  type PhaseB1EventFreeMonolithicModelV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  createPhaseB1EndpointStateV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import {
  auditPhaseB1WholeHeartMechanicalEnergyV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyAuditV1";
import {
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

describe("four-chamber Phase B1 whole-heart mechanical energy audit", () => {
  it.each(["on", "off"] as const)(
    "closes the differentiated endpoint-stage ledger in SLS-%s topology",
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
      const audit = auditPhaseB1WholeHeartMechanicalEnergyV1({
        model: candidate.model,
        wallMaterialBinding: candidate.wallMaterialBinding,
        previousEndpoint: candidate.warmStart.endpoint,
        nextEndpointLeftLimit: step.nextEndpointLeftLimit,
        dtSec: 0.25e-3,
      });

      expect(audit.slsMode).toBe(slsMode);
      expect(audit.kinematics.accepted).toBe(true);
      expect(audit.landAdapterWorkClosure.accepted).toBe(true);
      expect(audit.landAdapterWorkClosure.maximumRelativeResidual)
        .toBeLessThan(audit.landAdapterWorkClosure.relativeTolerance);
      for (const wallId of WALL_IDS) {
        expect(audit.activeMechanicalOutputPowerByWallW[wallId]).toBe(
          -audit.activeStressPowerByWallW[wallId],
        );
        expect(audit.landAdapterSourcePowerByWallW[wallId]).toBeCloseTo(
          audit.activeStressPowerByWallW[wallId],
          12,
        );
      }
      for (const value of Object.values(audit.storedEnergyRateByBranchW)) {
        expect(Number.isFinite(value)).toBe(true);
      }
      for (const value of Object.values(audit.dissipationByBranchW)) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
      expect(audit.stage.correctedStageLedgerAccepted).toBe(true);
      expect(audit.stage.normalizedResidual)
        .toBeLessThan(audit.stage.normalizedResidualTolerance);
      expect(audit.publishedTaylorGeometryPowerAudit.workConjugacyClaimed)
        .toBe(false);
      expect(audit.publishedTaylorGeometryPowerAudit.normalization.rhoStage)
        .toBeGreaterThanOrEqual(0);
      expect(audit.publishedTaylorGeometryPowerTreatment.diagnosticOnly)
        .toBe(true);
      expect(audit.publishedTaylorGeometryPowerTreatment
        .subtractedFromEnergyResidual).toBe(true);
      expect(audit.stage.publishedTaylorGeometryDefectSubtracted).toBe(true);
      expect(audit.stage.geometryQualityOrWorkConjugacyAccepted).toBe(false);
      expect(audit.publishedTaylorGeometryDefectRetained).toBe(true);
      expect(Number.isFinite(
        audit.backwardEulerDiagnostic.normalizedUnresolvedEnergyIncrement,
      )).toBe(true);
      expect(audit.backwardEulerDiagnostic
        .diagnosticOnlyNotStageClosureOrAcceptance)
        .toBe(true);
      expect(audit.mechanicalLedgerOnly).toBe(true);
      expect(audit.atpChemicalEnergyOrEfficiencyClaimed).toBe(false);
      expect(audit.correctedStageLedgerAccepted).toBe(true);
      expect(audit.geometryWorkConjugacyAccepted).toBe(false);
      expect(audit.wholeHeartBackwardEulerEnergyAcceptanceClaimed).toBe(false);
      expect(audit.phaseB1Acceptance).toBe(false);
      expect(audit.releaseRuntimeReachable).toBe(false);

      if (slsMode === "off") {
        expect(audit.storedEnergyRateByBranchW.sls).toBe(0);
        expect(audit.dissipationByBranchW.sls).toBe(0);
        expect(audit.kinematics.slsAlphaRatePerSecByWall).toBeNull();
      } else {
        expect(audit.kinematics.slsAlphaRatePerSecByWall).not.toBeNull();
      }
    },
  );

  it.each(["on", "off"] as const)(
    "keeps the diagnostic-only SLS-%s unresolved BE increment locally second order",
    (slsMode) => {
      const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
        slsMode,
        sha256,
      );
      const dtValues = [1e-3, 0.5e-3, 0.25e-3, 0.125e-3] as const;
      const absoluteUnresolvedIncrements = dtValues.map((dtSec) => {
        const step = stepPhaseB1EventFreeMonolithicBackwardEulerV1({
          model: candidate.model,
          wallMaterialBinding: candidate.wallMaterialBinding,
          previousEndpoint: candidate.warmStart.endpoint,
          dtSec,
        });
        if (step.converged === false) {
          throw new Error(`${step.reason}: ${step.message}`);
        }
        const audit = auditPhaseB1WholeHeartMechanicalEnergyV1({
          model: candidate.model,
          wallMaterialBinding: candidate.wallMaterialBinding,
          previousEndpoint: candidate.warmStart.endpoint,
          nextEndpointLeftLimit: step.nextEndpointLeftLimit,
          dtSec,
        });
        expect(audit.backwardEulerDiagnostic
          .diagnosticOnlyNotStageClosureOrAcceptance).toBe(true);
        expect(audit.wholeHeartBackwardEulerEnergyAcceptanceClaimed)
          .toBe(false);
        return Math.abs(
          audit.backwardEulerDiagnostic.signedUnresolvedEnergyIncrementJ,
        );
      });
      for (let index = 0; index < dtValues.length - 1; index += 1) {
        const ratio = absoluteUnresolvedIncrements[index]
          / absoluteUnresolvedIncrements[index + 1];
        expect(ratio).toBeGreaterThan(3.2);
        expect(ratio).toBeLessThan(4.5);
      }
    },
  );

  it.each(["on", "off"] as const)(
    "keeps the prescribed external-pressure sign in SLS-%s topology",
    (slsMode) => {
      const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
        slsMode,
        sha256,
      );
      const intrathoracicPressurePa = 1;
      const model: PhaseB1EventFreeMonolithicModelV1 = Object.freeze({
        ...candidate.model,
        closedLoopParameters: Object.freeze({
          ...candidate.model.closedLoopParameters,
          intrathoracicPressurePa,
        }),
      });
      const { audit } = auditOneStep(candidate, model);
      const chamberVolumeRateM3PerSec = (["LA", "LV", "RA", "RV"] as const)
        .reduce((sum, chamberId) => sum
          + audit.kinematics.volumeRateM3PerSecByCompartment[chamberId], 0);
      expect(audit.prescribedExternalEnvironmentPowerW).toBeCloseTo(
        -intrathoracicPressurePa * chamberVolumeRateM3PerSec,
        14,
      );
      expect(audit.prescribedExternalEnvironmentPowerW).not.toBe(0);
      expect(audit.correctedStageLedgerAccepted).toBe(true);
    },
  );

  it.each(["on", "off"] as const)(
    "keeps the engaged pericardial stored-power sign in SLS-%s topology",
    (slsMode) => {
      const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
        slsMode,
        sha256,
      );
      const baseline = evaluatePhaseB1EventFreeEndpointV1(
        candidate.model,
        candidate.wallMaterialBinding,
        candidate.warmStart.endpoint,
      );
      const model: PhaseB1EventFreeMonolithicModelV1 = Object.freeze({
        ...candidate.model,
        closedLoopParameters: Object.freeze({
          ...candidate.model.closedLoopParameters,
          pericardiumParameters: Object.freeze({
            ...candidate.model.closedLoopParameters.pericardiumParameters,
            referenceHeartVolumeM3:
              baseline.closedLoop.pericardium.totalHeartVolumeM3 / 1.0011,
          }),
        }),
      });
      const { audit, step } = auditOneStep(candidate, model);
      const next = evaluatePhaseB1EventFreeEndpointV1(
        model,
        candidate.wallMaterialBinding,
        step.nextEndpointLeftLimit,
      );
      const chamberVolumeRateM3PerSec = (["LA", "LV", "RA", "RV"] as const)
        .reduce((sum, chamberId) => sum
          + audit.kinematics.volumeRateM3PerSecByCompartment[chamberId], 0);
      expect(next.closedLoop.pericardium.smoothingBranch).toBe("linear");
      expect(next.closedLoop.pericardium.excessPressurePa).toBeGreaterThan(0);
      expect(audit.storedEnergyRateByBranchW.pericardial).toBeCloseTo(
        next.closedLoop.pericardium.excessPressurePa
          * chamberVolumeRateM3PerSec,
        14,
      );
      expect(audit.storedEnergyRateByBranchW.pericardial).toBeGreaterThan(0);
      expect(audit.correctedStageLedgerAccepted).toBe(true);
    },
  );

  it.each(["on", "off"] as const)(
    "reports positive active output during all-wall SLS-%s shortening",
    (slsMode) => {
      const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
        slsMode,
        sha256,
      );
      const differentialState = candidate.warmStart.endpoint.differentialState;
      const shorteningEndpoint = createPhaseB1EndpointStateV1({
        timeSec: candidate.warmStart.endpoint.timeSec,
        differentialState: Object.freeze({
          ...differentialState,
          inertialFlowsM3PerSec: Object.freeze({
            ...differentialState.inertialFlowsM3PerSec,
            Q_AoV: 1e-5,
            Q_PuV: 1e-5,
            Q_VC: -2e-5,
            Q_PV: -2e-5,
          }),
        }),
        triSegCoordinates: candidate.warmStart.endpoint.triSegCoordinates,
      });
      const { audit } = auditOneStep(
        candidate,
        candidate.model,
        shorteningEndpoint,
      );
      for (const wallId of WALL_IDS) {
        expect(audit.kinematics.fiberLogStrainRatePerSecByWall[wallId])
          .toBeLessThan(0);
        expect(audit.activeMechanicalOutputPowerByWallW[wallId])
          .toBeGreaterThan(0);
      }
      expect(audit.stage.activeMechanicalOutputPowerW).toBeGreaterThan(0);
      expect(audit.correctedStageLedgerAccepted).toBe(true);
    },
  );
});

type SyntheticCandidate = ReturnType<
  typeof buildPhaseB1SyntheticEventFreeMonolithicCaseV1
>;

function auditOneStep(
  candidate: SyntheticCandidate,
  model: PhaseB1EventFreeMonolithicModelV1,
  previousEndpoint: PhaseB1EndpointStateV1 = candidate.warmStart.endpoint,
) {
  const dtSec = 0.25e-3;
  const step = stepPhaseB1EventFreeMonolithicBackwardEulerV1({
    model,
    wallMaterialBinding: candidate.wallMaterialBinding,
    previousEndpoint,
    dtSec,
  });
  if (step.converged === false) {
    throw new Error(`${step.reason}: ${step.message}`);
  }
  return Object.freeze({
    step,
    audit: auditPhaseB1WholeHeartMechanicalEnergyV1({
      model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint,
      nextEndpointLeftLimit: step.nextEndpointLeftLimit,
      dtSec,
    }),
  });
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
