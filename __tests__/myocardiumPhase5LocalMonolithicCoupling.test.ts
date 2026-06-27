import { describe, expect, it } from "vitest";
import protocolDescriptor from "@/data/myocardium/protocols/local-monolithic-coupling-phase5a-protocols.json";
import {
  LOCAL_MONOLITHIC_BE_V1_CLAIM_BOUNDARY,
  LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID,
  runLocalMonolithicBeV1ReferenceSuite,
} from "@/engine/myocardium/coupling/localMonolithicBeV1";
import {
  THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE,
  THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
  THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET,
} from "@/engine/myocardium/kinematics";
import { deriveLand2017StepKinematics } from "@/engine/myocardium/myofilament/land2017";
import {
  LOCAL_MONOLITHIC_COUPLING_PHASE5A_CLAIM_BOUNDARY,
  LOCAL_MONOLITHIC_COUPLING_PHASE5A_COMPLETION_STATUS,
  LOCAL_MONOLITHIC_COUPLING_PHASE5A_PHASE,
  LOCAL_MONOLITHIC_COUPLING_PHASE5A_PROTOCOL_SET_ID,
  runLocalMonolithicCouplingReadinessReport,
} from "@/engine/myocardium/protocols/localMonolithicCouplingReadiness";
import {
  loadLocalMonolithicCouplingReadinessValidationInput,
  validateLocalMonolithicCouplingReadiness,
} from "@/tools/myocardium/verifyLocalMonolithicCouplingReadiness";

const acceptedPhase4DStableSummaryHashes = ["62304684", "a39922fa"] as const;
const baseValidationInput =
  loadLocalMonolithicCouplingReadinessValidationInput(process.cwd());

describe("myocardium Phase 5A local monolithic coupling readiness", () => {
  it("passes the BE local monolithic reference gate without claiming Phase 5 completion, SDIRK2, or runtime wiring", () => {
    const input = fixture();
    const validation = validateLocalMonolithicCouplingReadiness(input);
    const report = runLocalMonolithicCouplingReadinessReport();

    expect(validation.pass).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(protocolDescriptor.protocolSetId).toBe(LOCAL_MONOLITHIC_COUPLING_PHASE5A_PROTOCOL_SET_ID);
    expect(protocolDescriptor.phase).toBe(LOCAL_MONOLITHIC_COUPLING_PHASE5A_PHASE);
    expect(protocolDescriptor.phaseCompletionStatus).toBe(LOCAL_MONOLITHIC_COUPLING_PHASE5A_COMPLETION_STATUS);
    expect(protocolDescriptor.claimBoundary).toBe(LOCAL_MONOLITHIC_COUPLING_PHASE5A_CLAIM_BOUNDARY);
    expect(protocolDescriptor.referenceModelId).toBe(LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID);
    expect(protocolDescriptor.sdirk2ReferenceCompletion).toBe("deferred-to-phase5b");
    expect(protocolDescriptor.protocolSettings.useSDIRK2ReferenceCompletion).toBe(false);
    expect(protocolDescriptor.protocolSettings.useRuntimeReplacement).toBe(false);
    expect(protocolDescriptor.protocolSettings.useModelCoreRuntimeWiring).toBe(false);
    expect(protocolDescriptor.protocolSettings.useChamberRuntimeWiring).toBe(false);
    expect(protocolDescriptor.protocolSettings.useCaseRuntimeWiring).toBe(false);
    expect(protocolDescriptor.protocolSettings.useWorkbenchRuntimeWiring).toBe(false);
    expect(report.readinessPass).toBe(true);
    expect(report.sections).toHaveLength(11);
    expect(report.sections.every((section) => section.status === "readiness-pass")).toBe(true);
    expect(report.phaseCompletionStatus).toBe("not-phase5-completion");
    expect(report.sdirk2ReferenceCompletion).toBe("deferred-to-phase5b");
    expect(report.referenceModelStatus).toBe("pure-reference-not-runtime-wired");
    expect(report.claimExclusions.sdirk2ReferenceCompletion).toBe("not-claimed");
    expect(report.claimExclusions.liveRuntimeReplacement).toBe("not-claimed");
    expect(report.claimExclusions.ModelCoreChamberWiring).toBe("not-claimed");
    expect(report.claimExclusions.TriSegAdoption).toBe("not-claimed");
  });

  it("runs a real LV/RV local BE monolithic reference solve with coupled Land-state and force-balance residual evidence", () => {
    const suite = runLocalMonolithicBeV1ReferenceSuite();

    expect(suite.modelId).toBe(LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID);
    expect(suite.claimBoundary).toBe(LOCAL_MONOLITHIC_BE_V1_CLAIM_BOUNDARY);
    expect(suite.lvCovered).toBe(true);
    expect(suite.rvCovered).toBe(true);
    expect(suite.allSamplesPass).toBe(true);
    expect(suite.maxLandResidualNorm).toBeLessThanOrEqual(1e-9);
    expect(suite.maxLocalForceBalanceResidualAbsPa).toBeLessThanOrEqual(1e-7);
    expect(suite.stableSummaryHash).toMatch(/^[0-9a-f]{8}$/);

    for (const sample of suite.samples) {
      expect(sample.pass).toBe(true);
      expect(sample.newton.unknownVectorDimension).toBe(7);
      expect(sample.newton.coupledUnknowns).toEqual([
        "cavityVolumeM3",
        "CaTRPN",
        "B",
        "W",
        "S",
        "zetaW",
        "zetaS",
      ]);
      expect(sample.final.land.method).toBe("writeLand2017BackwardEulerResidual");
      expect(sample.final.land.residualSource).toBe("Land 2017 backward-Euler residual");
      expect(sample.final.land.stageScheme).toBe("BE");
      expect(sample.final.land.stageIndex).toBe(0);
      expect(sample.final.land.ok).toBe(true);
      expect(sample.final.land.residualNorm).toBeLessThanOrEqual(1e-9);
      expect(sample.final.land.residualVector).toHaveLength(6);
      expect(sample.final.land.previousState).toHaveLength(6);
      expect(sample.final.land.nextState).toHaveLength(6);
      expect(sample.final.land.stateUpdateLinf).toBeGreaterThan(0);
      expect(sample.newton.ok).toBe(true);
      expect(sample.newton.iterationCount).toBeGreaterThan(0);
      expect(sample.newton.derivativeEvaluationCount).toBeGreaterThan(0);
      expect(sample.newton.lineSearchTrialCount).toBeGreaterThanOrEqual(sample.newton.iterationCount);
      expect(sample.newton.finalResidualAbsPa).toBeLessThanOrEqual(1e-7);
      expect(sample.newton.finalLandResidualNorm).toBeLessThanOrEqual(1e-9);
      expect(sample.newton.finalResidualNorm).toBeLessThanOrEqual(1);
      expect(Number.isFinite(sample.newton.finalJacobianDeterminant)).toBe(true);
      expect(Number.isFinite(sample.newton.finalVolumeDerivativePaPerM3)).toBe(true);
      expect(sample.finiteHealth.pass).toBe(true);
      expect(sample.final.strainRate.pass).toBe(true);
      expect(sample.deterministicHash).toMatch(/^[0-9a-f]{8}$/);
    }
  });

  it("pins Phase 4D read-only evidence and fails if those hashes drift", () => {
    const report = runLocalMonolithicCouplingReadinessReport();

    expect(report.phase4DReadOnlyEvidence.expectedStableSummaryHash).toBe("62304684");
    expect(report.phase4DReadOnlyEvidence.acceptedStableSummaryHashes).toEqual(
      acceptedPhase4DStableSummaryHashes,
    );
    expect(acceptedPhase4DStableSummaryHashes).toContain(
      report.phase4DReadOnlyEvidence.stableSummaryHash,
    );
    expect(report.phase4DReadOnlyEvidence.stableSummaryHashMatchesPinned).toBe(true);
    expect(report.phase4DReadOnlyEvidence.selectedCandidateStableHash).toBe(
      THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE.candidateStableHash,
    );
    expect(report.phase4DReadOnlyEvidence.lvParameterSetStableHash).toBe(
      THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.parameterSetStableHash,
    );
    expect(report.phase4DReadOnlyEvidence.rvParameterSetStableHash).toBe(
      THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET.parameterSetStableHash,
    );

    const input = fixture();
    input.descriptor.phase4DReadOnlyEvidence.stableSummaryHash = "deadbeef";
    input.report.phase4DReadOnlyEvidence.stableSummaryHash = "deadbeef";
    input.report.phase4DReadOnlyEvidence.stableSummaryHashMatchesPinned = false;
    input.report.phase4DReadOnlyEvidence.pass = false;

    const validation = validateLocalMonolithicCouplingReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase5a_phase4d_pin_drift")).toBe(true);
  });

  it("keeps SDIRK2 unsupported in Phase 5A and rejects SDIRK2 completion claims", () => {
    expect(() =>
      deriveLand2017StepKinematics({
        freeCalciumUM: 1,
        previousFiberEngineeringStrain: 0.01,
        stageFiberEngineeringStrain: 0.02,
        dtSec: 0.001,
        stage: { scheme: "SDIRK2", stageIndex: 0, gamma: 0.2928932188134524 },
      }),
    ).toThrow(/SDIRK2/);

    const input = fixture();
    input.descriptor.sdirk2ReferenceCompletion = "completed";
    input.descriptor.protocolSettings.useSDIRK2ReferenceCompletion = true;
    input.descriptor.claimExclusions.sdirk2ReferenceCompletion = "claimed";
    input.report.sdirk2ReferenceCompletion = "completed" as any;
    input.report.claimExclusions.sdirk2ReferenceCompletion = "claimed";

    const validation = validateLocalMonolithicCouplingReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) =>
      issue.code === "phase5a_descriptor_boundary"
      || issue.code === "phase5a_protocol_settings"
      || issue.code === "phase5a_forbidden_claim"
    )).toBe(true);
  });

  it("fails if Land BE, local residual, Newton evidence, finite health, or strain-rate evidence are weakened", () => {
    const input = fixture();
    const sample = input.report.localReferenceSolve.samples[0];
    sample.final.land.ok = false;
    sample.final.land.stageScheme = "SDIRK2";
    sample.final.land.residualSource = "nested solver";
    sample.newton.iterationCount = 0;
    sample.newton.unknownVectorDimension = 1;
    sample.newton.finalResidualAbsPa = 1;
    sample.newton.finalLandResidualNorm = 1;
    sample.maxLocalForceBalanceResidualAbsPa = 1;
    sample.finiteHealth.pass = false;
    sample.final.strainRate.pass = false;
    sample.pass = false;
    input.report.localReferenceAcceptance.landBeConvergencePass = false;
    input.report.localReferenceAcceptance.localForceBalanceResidualPass = false;
    input.report.localReferenceAcceptance.newtonEvidencePass = false;
    input.report.localReferenceAcceptance.finiteStateHealthPass = false;
    input.report.localReferenceAcceptance.derivedLandStrainRateConsistencyPass = false;
    input.report.localReferenceAcceptance.pass = false;
    input.report.localReferenceSolve.allSamplesPass = false;

    const validation = validateLocalMonolithicCouplingReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase5a_land_be_convergence")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase5a_newton_evidence")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase5a_force_balance")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase5a_finite_health")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase5a_strain_rate_derivation")).toBe(true);
  });

  it("fails runtime/workbench leak and production/performance/TriSeg enabling flags", () => {
    const input = fixture();
    input.runtimeIntegrationFiles = [
      {
        path: "engine/ModelCore.ts",
        text:
          "import { runLocalMonolithicBeV1ReferenceSuite } from '@/engine/myocardium/coupling/localMonolithicBeV1';\n"
          + "const useRuntimeReplacement = true;\n",
      },
      {
        path: "features/workbench/WorkbenchRoute.tsx",
        text:
          '{"useProductionSolverComparison": true, "usePerformanceAcceptance": true, '
          + '"useActiveStiffnessProductionCoupling": true, "adoptTriSeg": true}',
      },
    ];

    const validation = validateLocalMonolithicCouplingReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase5a_runtime_leak")).toBe(true);
  });
});

function fixture() {
  return structuredClone(baseValidationInput) as any;
}
