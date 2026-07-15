import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1,
  buildPhaseB1ProjectSyntheticEndpointScaleDescriptorV1,
  evaluatePhaseB1ProjectSyntheticTimeStepConvergenceV1,
  phaseB1ProjectSyntheticScaledEndpointDistanceV1,
  runPhaseB1ProjectSyntheticShortHorizonV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticShortHorizonProtocolV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import {
  createPhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";

describe("four-chamber Phase B1 project-synthetic short-horizon protocol", () => {
  it.each(PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1.slsModes)(
    "advances the %s topology on three exact-event grids with first-order state convergence",
    (slsMode) => {
      const convergence =
        evaluatePhaseB1ProjectSyntheticTimeStepConvergenceV1(
          slsMode,
          sha256,
        );
      expect(convergence.allCompleted).toBe(true);
      expect(convergence.nominalGridPreservedWithoutSubdivision).toBe(true);
      expect(convergence.projectSyntheticStateOrderRegressionAccepted)
        .toBe(true);
      expect(convergence.observedStateOrder).not.toBeNull();
      expect(convergence.observedStateOrder!).toBeGreaterThanOrEqual(
        PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1
          .backwardEulerObservedStateOrderThreshold,
      );
      expect(convergence.coarseToMediumScaledEndpointDifference)
        .toBeGreaterThan(0);
      expect(convergence.mediumToFineScaledEndpointDifference)
        .toBeGreaterThan(0);
      expect(convergence.maximumBackwardEulerUnresolvedIncrementByTimeStepJ)
        .not.toBeNull();
      expect(convergence.backwardEulerUnresolvedIncrementOrderDiagnosticOnly)
        .toBe(true);
      expect(convergence.wholeHeartBackwardEulerEnergyAcceptanceClaimed)
        .toBe(false);
      expect(convergence.phaseB1TimestepConvergenceAcceptanceClaimed)
        .toBe(false);
      expect(convergence.phaseB1Acceptance).toBe(false);

      const expectedStepCounts = [2, 4, 8];
      convergence.runs.forEach((run, gridIndex) => {
        expect(run.completed).toBe(true);
        if (!run.completed) return;
        expect(run.requestedStepCount).toBe(expectedStepCounts[gridIndex]);
        expect(run.acceptedStepCount).toBe(run.requestedStepCount);
        expect(run.hiddenSubdivisionUsed).toBe(false);
        expect(run.projectSyntheticShortHorizonRegressionAccepted).toBe(true);
        expect(run.diagnostics
          .maximumAbsoluteTotalBloodVolumeResidualFromInitialM3)
          .toBeLessThan(
            PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1
              .totalBloodVolumeAbsoluteToleranceM3,
          );
        expect(run.diagnostics.maximumAbsolutePerStepTotalBloodVolumeChangeM3)
          .toBeLessThan(
            PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1
              .totalBloodVolumeAbsoluteToleranceM3,
          );
        expect(run.diagnostics.minimumLandSimplexMargin).toBeGreaterThan(0);
        expect(run.diagnostics.maximumSlsIdentityRho).toBeLessThan(
          PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1
            .normalizedSlsIdentityTolerance,
        );
        expect(run.diagnostics.maximumLandAdapterWorkRelativeResidual)
          .toBeLessThan(
            PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1
              .landAdapterWorkRelativeTolerance,
          );
        expect(run.diagnostics.maximumCorrectedStageLedgerRho).toBeLessThan(
          PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1
            .correctedStageLedgerNormalizedResidualTolerance,
        );
        expect(run.diagnostics.totalEndpointEventCount).toBe(1);
        expect(run.diagnostics.totalPostEventTriSegReinitializationCount)
          .toBe(1);
        expect(run.diagnostics.everyStepProjectionFree).toBe(true);
        expect(run.diagnostics.everyStepHiddenStateClippingFree).toBe(true);
        expect(run.diagnostics.everyStepFlowClampFree).toBe(true);
        expect(run.diagnostics.everyStepSlsIdentityAccepted).toBe(true);
        expect(run.diagnostics.everyStepLandAdapterWorkClosureAccepted)
          .toBe(true);
        expect(run.diagnostics.everyStepGlobalSemismoothJacobianAuditAccepted)
          .toBe(true);
        expect(run.diagnostics.everyStepDifferentiatedKinematicsAccepted)
          .toBe(true);
        expect(run.diagnostics
          .everyStepMechanicalCorrectedStageLedgerAccepted).toBe(true);
        expect(run.steps.filter((step) => step.eventCountAtEnd === 1))
          .toHaveLength(1);
        const eventStep = run.steps.find((step) => step.eventCountAtEnd === 1);
        expect(eventStep?.endTimeSec).toBe(
          PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1
            .endpointEvent.calciumDriveTimeSec,
        );
        expect(run.wholeHeartBackwardEulerEnergyAcceptanceClaimed).toBe(false);
        expect(run.globalSemismoothJacobianAuditedAtEveryStep).toBe(true);
        expect(run.constitutivePartialsIndependentlyValidated).toBe(false);
        expect(run.acceptedColdInitializationClaimed).toBe(false);
        expect(run.acceptedMaterialBranchClaimed).toBe(false);
        expect(run.fullBeatAcceptanceClaimed).toBe(false);
        expect(run.physiologicalValidationClaimed).toBe(false);
        expect(run.releaseRuntimeReachable).toBe(false);
      });
    },
    60_000,
  );

  it("uses the complete stored and algebraic endpoint in its scaled norm", () => {
    const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
      "on",
      sha256,
    );
    const endpoint = candidate.warmStart.endpoint;
    const registry = candidate.model.newtonScaleRegistry;
    const onScales = buildPhaseB1ProjectSyntheticEndpointScaleDescriptorV1(
      "on",
      registry,
    );
    const offScales = buildPhaseB1ProjectSyntheticEndpointScaleDescriptorV1(
      "off",
      registry,
    );
    expect(onScales.endpointLabels).toHaveLength(61);
    expect(onScales.endpointScales).toHaveLength(61);
    expect(offScales.endpointLabels).toHaveLength(56);
    expect(offScales.endpointScales).toHaveLength(56);
    expect(phaseB1ProjectSyntheticScaledEndpointDistanceV1(
      endpoint,
      endpoint,
      registry,
    )).toBe(0);
    const perturbations: Array<(copy: MutableEndpoint) => void> = [
      (copy) => {
        copy.differentialState.bloodVolumesM3.LA
          += registry.unknownScales.bloodVolumeM3.LA;
      },
      (copy) => {
        copy.differentialState.inertialFlowsM3PerSec.Q_AoV
          += registry.unknownScales.inertialFlowM3PerSec;
      },
      (copy) => {
        copy.differentialState.calciumByWall.LVFW.d
          += registry.unknownScales.calciumAndPopulation;
      },
      (copy) => {
        copy.differentialState.landByWall.LVFW[0]
          += registry.unknownScales.calciumAndPopulation;
      },
      (copy) => {
        copy.differentialState.landByWall.LVFW[4]
          += registry.unknownScales.landDistortionByWall.LVFW;
      },
      (copy) => {
        if (copy.differentialState.slsMode !== "on") throw new Error("mode");
        copy.differentialState.slsAlphaVByWall.LVFW
          += registry.unknownScales.slsViscousStrain;
      },
      (copy) => {
        copy.triSegCoordinates.V_m_S
          += registry.unknownScales.septalMidwallVolumeM3;
      },
      (copy) => {
        copy.triSegCoordinates.y_m
          += registry.unknownScales.junctionRadiusM;
      },
    ];
    for (const perturb of perturbations) {
      const copy = structuredClone(endpoint) as MutableEndpoint;
      perturb(copy);
      const perturbed = createPhaseB1EndpointStateV1({
        timeSec: copy.timeSec,
        differentialState: copy.differentialState,
        triSegCoordinates: copy.triSegCoordinates,
      });
      expect(phaseB1ProjectSyntheticScaledEndpointDistanceV1(
        endpoint,
        perturbed,
        registry,
      )).toBeCloseTo(1, 12);
    }
    expect(() => runPhaseB1ProjectSyntheticShortHorizonV1(
      "on",
      0.0002,
      sha256,
    )).toThrow(/unsupported/);
  });
});

type SyntheticCase = ReturnType<
  typeof buildPhaseB1SyntheticEventFreeMonolithicCaseV1
>;
type DeepMutable<T> = T extends object
  ? { -readonly [Key in keyof T]: DeepMutable<T[Key]> }
  : T;
type MutableEndpoint = DeepMutable<SyntheticCase["warmStart"]["endpoint"]>;

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
