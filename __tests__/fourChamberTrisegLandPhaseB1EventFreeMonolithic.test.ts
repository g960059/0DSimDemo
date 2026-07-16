import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  PHASE_B1_EVENT_FREE_MECHANISTIC_REBUILD_V2_MODEL_ID,
  auditPhaseB1EventFreeMonolithicGlobalJacobianV1,
  evaluatePhaseB1EventFreeEndpointV1,
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
import {
  createFiniteThicknessTriSegBendingPriorV2,
} from "@/engine/myocardium/fourChamberV1/triseg/energyConjugateFiniteThicknessTriSegV2";
import {
  evaluatePublishedTriSegGeometryV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";

describe("four-chamber Phase B1 event-free monolithic backward Euler", () => {
  const candidates = {
    on: buildPhaseB1SyntheticEventFreeMonolithicCaseV1("on", sha256),
    off: buildPhaseB1SyntheticEventFreeMonolithicCaseV1("off", sha256),
  } as const;

  it("pins the canonical semismooth Jacobian audit policy", () => {
    const policy = PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1;
    expect(policy.algorithmicJacobianScaledStep).toBe(2 ** -19);
    expect(policy.independentDirectionalAuditStepRatioToConstruction)
      .toBe(0.25);
    expect(policy.semismoothDirectionalConsistencyRelativeTwoNormTolerance)
      .toBe(1e-6);
    expect(policy.minimumRequiredScaledCrossBlockMagnitude).toBe(1e-6);
    expect(policy.landSimplexStrictInterior).toBe(true);
    expect(policy.landPopulationProjection).toBe(false);
    expect(policy.hiddenStateClipping).toBe(false);
    expect(policy.adaptiveRescaling).toBe(false);
  });

  it.each(["on", "off"] as const)(
    "evaluates the real five-wall material binding in %s topology",
    (slsMode) => {
      const candidate = candidates[slsMode];
      const evaluation = evaluatePhaseB1EventFreeEndpointV1(
        candidate.model,
        candidate.wallMaterialBinding,
        candidate.warmStart.endpoint,
      );
      expect(evaluation.projectionApplied).toBe(false);
      expect(evaluation.hiddenStateClippingApplied).toBe(false);
      for (const wallId of WALL_IDS) {
        expect(evaluation.wallMaterialByWall[wallId].wallId).toBe(wallId);
        expect(evaluation.freeCalciumUMByWall[wallId]).toBe(
          candidate.wallMaterialBinding.runtimeByWall[wallId]
            .prescribedCalciumParameters.calciumDiastolicUM,
        );
      }
    },
  );

  it.each(["on", "off"] as const)(
    "advances one fully coupled 0.25 ms %s step without calcium residuals or projection",
    (slsMode) => {
      const candidate = candidates[slsMode];
      const result = stepPhaseB1EventFreeMonolithicBackwardEulerV1({
        model: candidate.model,
        wallMaterialBinding: candidate.wallMaterialBinding,
        previousEndpoint: candidate.warmStart.endpoint,
        dtSec: 0.25e-3,
      });
      if (result.converged === false) {
        throw new Error(`${result.reason}: ${result.message}`);
      }
      expect(result.unknownCount).toBe(slsMode === "on" ? 51 : 46);
      expect(result.residualCount).toBe(result.unknownCount);
      expect(result.calciumStoredStateCount).toBe(10);
      expect(result.calciumNewtonUnknownCount).toBe(0);
      expect(result.calciumResidualCount).toBe(0);
      expect(result.residualEvaluation.calciumResidualCount).toBe(0);
      expect(result.nextEndpointLeftLimit.timeSec).toBe(0.25e-3);
      expect(result.minimumLandSimplexMargin).toBeGreaterThan(0);
      expect(Math.abs(result.totalBloodVolumeChangeM3)).toBeLessThan(1e-17);
      expect(result.newtonDiagnostics.finalResidualInfinityNorm)
        .toBeLessThanOrEqual(
          candidate.model.newtonScaleRegistry.tolerances
            .globalResidualInfinityNorm,
        );
      expect(result.algorithmicJacobian).toBe(
        "semismooth-constitutive-linearization-scaled-five-point-full-system-reference",
      );
      expect(result.fullLandGeometryAndHydraulicCrossCouplingAssemblyImplemented)
        .toBe(true);
      expect(result.semismoothDirectionalConsistencyAuditCompleted)
        .toBe(false);
      expect(result.crossBlockNonzeroAuditCompleted).toBe(false);
      expect(result.innerLandSolveUsed).toBe(false);
      expect(result.projectionApplied).toBe(false);
      expect(result.hiddenStateClippingApplied).toBe(false);
      expect(result.postStepBloodVolumeProjectionApplied).toBe(false);
      expect(result.flowClampApplied).toBe(false);
      for (const wallId of WALL_IDS) {
        expect(result.calciumDriveStateByWallAtEndLeftLimit[wallId])
          .toEqual({ r: 0, d: 0 });
        expect(result.residualEvaluation.landResidualPerSecByWall[wallId])
          .toHaveLength(6);
      }
      if (slsMode === "off") {
        expect(Object.hasOwn(
          result.nextEndpointLeftLimit.differentialState,
          "slsAlphaVByWall",
        )).toBe(false);
      }

      const audit = auditPhaseB1EventFreeMonolithicGlobalJacobianV1({
        model: candidate.model,
        wallMaterialBinding: candidate.wallMaterialBinding,
        previousEndpoint: candidate.warmStart.endpoint,
        nextEndpointLeftLimit: result.nextEndpointLeftLimit,
        dtSec: 0.25e-3,
      });
      expect(audit.accepted).toBe(true);
      expect(audit.acceptedBaseResidualVerified).toBe(true);
      expect(audit.baseScaledResidualInfinityNorm)
        .toBeLessThanOrEqual(audit.baseScaledResidualTolerance);
      expect(audit.semismoothDirectionalConsistencyAuditAccepted).toBe(true);
      expect(audit.independentStencilUsesSameFrozenSemismoothMap).toBe(true);
      expect(audit.constitutivePartialsIndependentlyValidatedByThisAudit)
        .toBe(false);
      expect(audit.unknownCount).toBe(result.unknownCount);
      expect(audit.residualCount).toBe(result.residualCount);
      expect(audit.directionalAudit.relativeTwoNormDifference)
        .toBeLessThan(audit.directionalRelativeTwoNormTolerance);
      expect(audit.algorithmicJacobian.stencilByColumn.every(
        (stencil) => stencil === "centered-five-point",
      )).toBe(true);
      expect(audit.crossBlocks.landResidualByMechanicalGeometry)
        .toBeGreaterThan(audit.crossBlocks.minimumRequiredScaledMagnitude);
      expect(audit.crossBlocks.hydraulicMomentumByLandState)
        .toBeGreaterThan(audit.crossBlocks.minimumRequiredScaledMagnitude);
      expect(audit.crossBlocks.triSegEquilibriumByLandState)
        .toBeGreaterThan(audit.crossBlocks.minimumRequiredScaledMagnitude);
      expect(audit.unknownLabels.indexOf(
        "tissue.LA.patch-0.land.CaTRPN",
      )).toBe(14);
      expect(audit.unknownLabels.indexOf("algebraic.triseg.V_m_S"))
        .toBe(slsMode === "on" ? 49 : 44);
      if (slsMode === "on") {
        expect(audit.crossBlocks.slsResidualByMechanicalGeometry)
          .toBeGreaterThan(audit.crossBlocks.minimumRequiredScaledMagnitude);
        expect(audit.crossBlocks.hydraulicMomentumBySlsState)
          .toBeGreaterThan(audit.crossBlocks.minimumRequiredScaledMagnitude);
        expect(audit.crossBlocks.triSegEquilibriumBySlsState)
          .toBeGreaterThan(audit.crossBlocks.minimumRequiredScaledMagnitude);
        expect(audit.crossBlocks.slsBlockPhysicallyAbsent).toBe(false);
      } else {
        expect(audit.crossBlocks.slsResidualByMechanicalGeometry).toBeNull();
        expect(audit.crossBlocks.hydraulicMomentumBySlsState).toBeNull();
        expect(audit.crossBlocks.triSegEquilibriumBySlsState).toBeNull();
        expect(audit.crossBlocks.slsBlockPhysicallyAbsent).toBe(true);
        expect(audit.unknownLabels.some((label) => label.includes(".sls.")))
          .toBe(false);
        expect(audit.residualLabels.some((label) => label.includes(".sls.")))
          .toBe(false);
      }
    },
  );

  it("rejects a canonical material placed under the wrong wall key", () => {
    const candidate = candidates.on;
    const runtime = candidate.wallMaterialBinding.runtimeByWall;
    const swapped = Object.freeze({
      ...candidate.wallMaterialBinding,
      runtimeByWall: Object.freeze({
        ...runtime,
        LA: runtime.LVFW,
        LVFW: runtime.LA,
      }),
    });
    expect(() => evaluatePhaseB1EventFreeEndpointV1(
      candidate.model,
      swapped,
      candidate.warmStart.endpoint,
    )).toThrow(/canonical compiled binding/);
  });

  it("fails closed when a model ID and its declared TriSeg runtime owner disagree", () => {
    const candidate = candidates.off;
    const mechanisticWithoutEnergy = Object.freeze({
      ...candidate.model,
      modelId: PHASE_B1_EVENT_FREE_MECHANISTIC_REBUILD_V2_MODEL_ID,
    });
    expect(() => evaluatePhaseB1EventFreeEndpointV1(
      mechanisticWithoutEnergy,
      candidate.wallMaterialBinding,
      candidate.warmStart.endpoint,
    )).toThrow(/requires finite-thickness energy-conjugate TriSeg/i);

    const state = candidate.warmStart.endpoint;
    const referenceGeometry = evaluatePublishedTriSegGeometryV1({
      leftVentricularCavityVolumeM3:
        state.differentialState.bloodVolumesM3.LV,
      rightVentricularCavityVolumeM3:
        state.differentialState.bloodVolumesM3.RV,
      septalMidwallCapVolumeM3: state.triSegCoordinates.V_m_S,
      junctionRadiusM: state.triSegCoordinates.y_m,
      walls: candidate.model.closedLoopParameters.triSegWalls,
    });
    const legacyWithEnergy = Object.freeze({
      ...candidate.model,
      closedLoopParameters: Object.freeze({
        ...candidate.model.closedLoopParameters,
        finiteThicknessTriSegBendingPriorV2:
          createFiniteThicknessTriSegBendingPriorV2({
            priorId: "legacy-owner-mismatch-test",
            effectiveBendingYoungModulusPa: 3_000,
            poissonRatio: 0.45,
            referenceGeometry,
            wallBendingMultiplierByWall: { LVFW: 1, SEP: 1, RVFW: 1 },
          }),
      }),
    });
    expect(() => evaluatePhaseB1EventFreeEndpointV1(
      legacyWithEnergy,
      candidate.wallMaterialBinding,
      candidate.warmStart.endpoint,
    )).toThrow(/legacy Phase B1 model IDs must retain the published-Taylor/i);
  });

  it("rejects a copied or rescaled Newton registry before scaled evidence is built", () => {
    const candidate = candidates.off;
    const registry = candidate.model.newtonScaleRegistry;
    const forgedModel = {
      ...candidate.model,
      newtonScaleRegistry: {
        ...registry,
        unknownScales: {
          ...registry.unknownScales,
          inertialFlowM3PerSec:
            3 * registry.unknownScales.inertialFlowM3PerSec,
        },
        registryDiagnosticHash: "00000000",
        registryContentSha256: "0".repeat(64),
      },
    };
    expect(() => evaluatePhaseB1EventFreeEndpointV1(
      forgedModel,
      candidate.wallMaterialBinding,
      candidate.warmStart.endpoint,
    )).toThrow(/canonical compiled registry/);
  });

  it("deep-snapshots a structurally valid mutable endpoint before evaluation", () => {
    const candidate = candidates.off;
    const mutableEndpoint = structuredClone(candidate.warmStart.endpoint);
    const originalLaVolume = mutableEndpoint.differentialState
      .bloodVolumesM3.LA;
    const evaluation = evaluatePhaseB1EventFreeEndpointV1(
      candidate.model,
      candidate.wallMaterialBinding,
      mutableEndpoint,
    );
    (mutableEndpoint.differentialState.bloodVolumesM3 as { LA: number }).LA = 1;
    expect(evaluation.endpoint).not.toBe(mutableEndpoint);
    expect(evaluation.endpoint.differentialState.bloodVolumesM3.LA)
      .toBe(originalLaVolume);
    expect(evaluation.closedLoop.state.bloodVolumesM3.LA)
      .toBe(originalLaVolume);
    expect(Object.isFrozen(evaluation.endpoint)).toBe(true);
    expect(Object.isFrozen(evaluation.closedLoop.state.bloodVolumesM3))
      .toBe(true);
  });

  it("adapts the independent stencil near a simplex boundary without accepting an off-solution base", () => {
    const candidate = candidates.off;
    const step = stepPhaseB1EventFreeMonolithicBackwardEulerV1({
      model: candidate.model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: candidate.warmStart.endpoint,
      dtSec: 0.25e-3,
    });
    if (step.converged === false) {
      throw new Error(`${step.reason}: ${step.message}`);
    }
    const nearBoundary = structuredClone(step.nextEndpointLeftLimit);
    (nearBoundary.differentialState.landByWall.LA as unknown as number[])[0] =
      1e-10;
    const audit = auditPhaseB1EventFreeMonolithicGlobalJacobianV1({
      model: candidate.model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: candidate.warmStart.endpoint,
      nextEndpointLeftLimit: nearBoundary,
      dtSec: 0.25e-3,
    });
    expect(audit.acceptedBaseResidualVerified).toBe(false);
    expect(audit.accepted).toBe(false);
    expect(audit.directionalAudit.independentScaledStep).toBeLessThan(
      audit.algorithmicJacobian.scaledStep * 0.25,
    );
    expect(audit.algorithmicJacobian.stencilByColumn.some(
      (stencil) => stencil !== "centered-five-point",
    )).toBe(true);
  });
});

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
