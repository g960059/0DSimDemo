import { describe, expect, it } from "vitest";
import protocolDescriptor from "@/data/myocardium/protocols/local-monolithic-coupling-phase5b-sdirk2-protocols.json";
import {
  LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID,
} from "@/engine/myocardium/coupling/localMonolithicBeV1";
import {
  LOCAL_MONOLITHIC_SDIRK2_V1_CLAIM_BOUNDARY,
  LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID,
  localMonolithicSdirk2V1DefaultSampleDefinitions,
  runLocalMonolithicSdirk2V1ReferenceSuite,
} from "@/engine/myocardium/coupling/localMonolithicSdirk2V1";
import {
  LAND2017_SDIRK2_GAMMA,
  LAND2017_SDIRK2_TABLEAU,
  deriveLand2017Sdirk2StageKinematics,
  deriveLand2017StepKinematics,
  writeLand2017Sdirk2StageResidual,
  type Land2017Sdirk2Stage1Input,
} from "@/engine/myocardium/myofilament/land2017";
import {
  LOCAL_MONOLITHIC_SDIRK2_PHASE5B_CLAIM_BOUNDARY,
  LOCAL_MONOLITHIC_SDIRK2_PHASE5B_COMPLETION_STATUS,
  LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PHASE,
  LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PROTOCOL_SET_ID,
  LOCAL_MONOLITHIC_SDIRK2_PHASE5B_REFERENCE_COMPLETION,
  runLocalMonolithicSdirk2ReadinessReport,
} from "@/engine/myocardium/protocols/localMonolithicSdirk2Readiness";
import {
  loadLocalMonolithicSdirk2ReadinessValidationInput,
  validateLocalMonolithicSdirk2Readiness,
} from "@/tools/myocardium/verifyLocalMonolithicSdirk2Readiness";

const baseValidationInput =
  loadLocalMonolithicSdirk2ReadinessValidationInput(process.cwd());

describe("myocardium Phase 5B local monolithic SDIRK2 readiness", () => {
  it("passes the local-monolithic-sdirk2-v1 reference gate without claiming production, runtime, morphology, no-alternans, or Phase 5 completion", () => {
    const input = fixture();
    const validation = validateLocalMonolithicSdirk2Readiness(input);
    const report = runLocalMonolithicSdirk2ReadinessReport();

    expect(validation.pass).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(protocolDescriptor.protocolSetId).toBe(LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PROTOCOL_SET_ID);
    expect(protocolDescriptor.phase).toBe(LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PHASE);
    expect(protocolDescriptor.phaseCompletionStatus).toBe(LOCAL_MONOLITHIC_SDIRK2_PHASE5B_COMPLETION_STATUS);
    expect(protocolDescriptor.claimBoundary).toBe(LOCAL_MONOLITHIC_SDIRK2_PHASE5B_CLAIM_BOUNDARY);
    expect(protocolDescriptor.referenceModelId).toBe(LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID);
    expect(protocolDescriptor.sdirk2ReferenceCompletion).toBe(LOCAL_MONOLITHIC_SDIRK2_PHASE5B_REFERENCE_COMPLETION);
    expect(protocolDescriptor.protocolSettings.useLocalMonolithicSdirk2ReferenceCompletion).toBe(true);
    expect(protocolDescriptor.protocolSettings.useProductionSolverComparison).toBe(false);
    expect(protocolDescriptor.protocolSettings.useRuntimeReplacement).toBe(false);
    expect(report.readinessPass).toBe(true);
    expect(report.sections).toHaveLength(13);
    expect(report.sections.every((section) => section.status === "readiness-pass")).toBe(true);
    expect(report.phaseCompletionStatus).toBe("not-phase5-completion");
    expect(report.referenceModelStatus).toBe("pure-reference-not-runtime-wired");
    expect(report.claimScope.localMonolithicSdirk2ReferenceCompletion).toBe("claimed");
    expect(report.claimScope.productionSolverComparison).toBe("not-claimed");
    expect(report.claimScope.performanceAcceptance).toBe("not-claimed");
    expect(report.claimScope.liveRuntimeReplacement).toBe("not-claimed");
    expect(report.claimScope.robustNoAlternans).toBe("not-claimed");
    expect(report.claimScope.calciumCyclingAlternansValidation).toBe("not-claimed");
    expect(report.claimScope.ModelCoreChamberWiring).toBe("not-claimed");
    expect(report.claimScope.TriSegAdoption).toBe("not-claimed");
  });

  it("runs real LV/RV two-stage SDIRK2 local solves with fixed tableau, stage rates, Newton/FD/line-search, force-balance, finite health, and deterministic hash evidence", () => {
    const suite = runLocalMonolithicSdirk2V1ReferenceSuite();

    expect(suite.modelId).toBe(LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID);
    expect(suite.claimBoundary).toBe(LOCAL_MONOLITHIC_SDIRK2_V1_CLAIM_BOUNDARY);
    expect(suite.tableau).toBe(LAND2017_SDIRK2_TABLEAU);
    expect(suite.tableau.gamma).toBe(1 - 1 / Math.sqrt(2));
    expect(suite.tableau.a00).toBe(LAND2017_SDIRK2_GAMMA);
    expect(suite.tableau.a10).toBe(1 - LAND2017_SDIRK2_GAMMA);
    expect(suite.tableau.a11).toBe(LAND2017_SDIRK2_GAMMA);
    expect(suite.tableau.c0).toBe(LAND2017_SDIRK2_GAMMA);
    expect(suite.tableau.c1).toBe(1);
    expect(suite.finalStateSource).toBe("Y1");
    expect(suite.stageSolvePolicy).toBe("sequential-7-unknown-stage-solves");
    expect(suite.lvCovered).toBe(true);
    expect(suite.rvCovered).toBe(true);
    expect(suite.allSamplesPass).toBe(true);
    expect(suite.maxLandResidualNorm).toBeLessThanOrEqual(1e-9);
    expect(suite.maxLocalForceBalanceResidualAbsPa).toBeLessThanOrEqual(1e-7);
    expect(suite.stableSummaryHash).toMatch(/^[0-9a-f]{8}$/);

    for (const sample of suite.samples) {
      expect(sample.pass).toBe(true);
      expect(sample.stages).toHaveLength(2);
      expect(sample.finalStageIndex).toBe(1);
      expect(sample.finalStateSource).toBe("Y1");
      expect(sample.finalLandState).toEqual(sample.stages[1].final.land.stageState);
      const definition = localMonolithicSdirk2V1DefaultSampleDefinitions()
        .find((candidate) => candidate.ventricle === sample.ventricle);
      expect(definition).toBeDefined();
      const [stage0, stage1] = sample.stages;
      const stage0CoordinateRateSI =
        (stage0.solvedCavityVolumeM3 - definition!.previousCavityVolumeM3)
        / (LAND2017_SDIRK2_GAMMA * definition!.dtSec);
      const stage1CoordinateRateSI =
        (
          stage1.solvedCavityVolumeM3
          - definition!.previousCavityVolumeM3
          - definition!.dtSec * (1 - LAND2017_SDIRK2_GAMMA) * stage0CoordinateRateSI
        )
        / (LAND2017_SDIRK2_GAMMA * definition!.dtSec);
      expect(stage0.final.rateDerivation.stageCoordinateRateSI).toBeCloseTo(
        stage0CoordinateRateSI,
        12,
      );
      expect(stage1.final.rateDerivation.stage0CoordinateRateSI).toBeCloseTo(
        stage0CoordinateRateSI,
        12,
      );
      expect(stage1.final.rateDerivation.stageCoordinateRateSI).toBeCloseTo(
        stage1CoordinateRateSI,
        12,
      );
      for (const stage of sample.stages) {
        expect(stage.pass).toBe(true);
        expect(stage.newton.unknownVectorDimension).toBe(7);
        expect(stage.newton.coupledUnknowns).toEqual([
          "cavityVolumeM3",
          "CaTRPN",
          "B",
          "W",
          "S",
          "zetaW",
          "zetaS",
        ]);
        expect(stage.final.land.method).toBe("writeLand2017Sdirk2StageResidual");
        expect(stage.final.land.residualSource).toBe("Land 2017 SDIRK2 stage residual");
        expect(stage.final.land.stageScheme).toBe("SDIRK2");
        expect(stage.final.land.gamma).toBe(LAND2017_SDIRK2_GAMMA);
        expect(stage.final.land.ok).toBe(true);
        expect(stage.final.land.residualNorm).toBeLessThanOrEqual(1e-9);
        expect(stage.final.land.residualVector).toHaveLength(6);
        expect(stage.final.land.previousState).toHaveLength(6);
        expect(stage.final.land.stageState).toHaveLength(6);
        expect(stage.final.land.stateUpdateLinf).toBeGreaterThan(0);
        expect(stage.newton.ok).toBe(true);
        expect(stage.newton.iterationCount).toBeGreaterThan(0);
        expect(stage.newton.derivativeEvaluationCount).toBeGreaterThan(0);
        expect(stage.newton.lineSearchTrialCount).toBeGreaterThanOrEqual(stage.newton.iterationCount);
        expect(stage.newton.finalResidualAbsPa).toBeLessThanOrEqual(1e-7);
        expect(stage.newton.finalLandResidualNorm).toBeLessThanOrEqual(1e-9);
        expect(stage.newton.finalResidualNorm).toBeLessThanOrEqual(1);
        expect(Number.isFinite(stage.newton.finalJacobianDeterminant)).toBe(true);
        expect(Number.isFinite(stage.newton.finalVolumeDerivativePaPerM3)).toBe(true);
        expect(stage.finiteHealth.pass).toBe(true);
        expect(stage.final.rateDerivation.pass).toBe(true);
        expect(stage.final.rateDerivation.landStageStrainRatePerSec).toBe(
          stage.final.rateDerivation.formulaStrainRatePerSec,
        );
        expect(stage.final.rateDerivation.stageCoordinateRateSI).toBe(
          stage.final.rateDerivation.formulaCoordinateRateSI,
        );
        expect(stage.calcium.dtSecSemantics).toBe("sequential-stage-increment");
        expect(stage.deterministicHash).toMatch(/^[0-9a-f]{8}$/);
      }
      expect(sample.stages[0].calcium.stageIncrementDtSec).toBeCloseTo(
        LAND2017_SDIRK2_GAMMA * 0.001,
        18,
      );
      expect(sample.stages[1].calcium.stageIncrementDtSec).toBeCloseTo(
        (1 - LAND2017_SDIRK2_GAMMA) * 0.001,
        18,
      );
      expect(sample.deterministicHash).toMatch(/^[0-9a-f]{8}$/);
    }
  });

  it("reports a finite, bounded, non-identical BE-vs-SDIRK2 discrepancy", () => {
    const report = runLocalMonolithicSdirk2ReadinessReport();

    expect(report.beVsSdirk2Discrepancy.beReferenceModelId).toBe(LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID);
    expect(report.beVsSdirk2Discrepancy.sdirk2ReferenceModelId).toBe(LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID);
    expect(report.beVsSdirk2Discrepancy.pass).toBe(true);
    expect(report.beVsSdirk2Discrepancy.allFinite).toBe(true);
    expect(report.beVsSdirk2Discrepancy.allNotIdentical).toBe(true);
    expect(report.beVsSdirk2Discrepancy.allWithinBounds).toBe(true);
    expect(report.beVsSdirk2Discrepancy.maxCavityVolumeAbsDiffM3).toBeGreaterThan(0);
    expect(report.beVsSdirk2Discrepancy.maxCavityVolumeAbsDiffM3).toBeLessThanOrEqual(0.0001);
    expect(report.beVsSdirk2Discrepancy.maxLandStateLinfDiff).toBeGreaterThan(0);
    expect(report.beVsSdirk2Discrepancy.maxLandStateLinfDiff).toBeLessThanOrEqual(1);
    expect(report.beFallbackReference.modelId).toBe(LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID);
  });

  it("keeps shared deriveLand2017StepKinematics() rejecting SDIRK2 while the dedicated entrypoint accepts fixed-stage inputs", () => {
    expect(() =>
      deriveLand2017StepKinematics({
        freeCalciumUM: 1,
        previousFiberEngineeringStrain: 0.01,
        stageFiberEngineeringStrain: 0.02,
        dtSec: 0.001,
        stage: { scheme: "SDIRK2", stageIndex: 0, gamma: LAND2017_SDIRK2_GAMMA },
      }),
    ).toThrow(/SDIRK2/);

    const stage0 = deriveLand2017Sdirk2StageKinematics({
      freeCalciumUM: 1,
      previousFiberEngineeringStrain: 0.01,
      stageFiberEngineeringStrain: 0.02,
      dtSec: 0.001,
      stage: { scheme: "SDIRK2", stageIndex: 0, gamma: LAND2017_SDIRK2_GAMMA },
    });

    expect(stage0.stageFiberEngineeringStrainRatePerSec).toBeCloseTo(
      (0.02 - 0.01) / (LAND2017_SDIRK2_GAMMA * 0.001),
      12,
    );
  });

  it("recomputes stage1 RHS from stage0 history and changes residuals when stage0 state, strain, or calcium is changed", () => {
    const suite = runLocalMonolithicSdirk2V1ReferenceSuite();
    const sample = suite.samples[0];
    const definition = localMonolithicSdirk2V1DefaultSampleDefinitions()
      .find((candidate) => candidate.ventricle === sample.ventricle);
    expect(definition).toBeDefined();
    const stage0 = sample.stages[0];
    const stage1 = sample.stages[1];
    const baseInput: Land2017Sdirk2Stage1Input = {
      freeCalciumUM: stage1.calcium.freeCalciumUM,
      previousFiberEngineeringStrain: stage1.final.rateDerivation.previousFiberEngineeringStrain,
      stageFiberEngineeringStrain: stage1.final.rateDerivation.stageFiberEngineeringStrain,
      dtSec: definition!.dtSec,
      stage: { scheme: "SDIRK2", stageIndex: 1, gamma: LAND2017_SDIRK2_GAMMA },
      stage0: {
        state: stage0.final.land.stageState,
        fiberEngineeringStrain: stage0.final.rateDerivation.stageFiberEngineeringStrain,
        cavityVolumeM3: stage0.solvedCavityVolumeM3,
        freeCalciumUM: stage0.calcium.freeCalciumUM,
      },
    };
    const baseResidual = writeLand2017Sdirk2StageResidual(
      stage1.final.land.stageState,
      stage1.final.land.previousState,
      baseInput,
    );
    const stateMutatedInput: Land2017Sdirk2Stage1Input = {
      ...baseInput,
      stage0: {
        ...baseInput.stage0,
        state: [
          baseInput.stage0.state[0] * 0.99,
          ...Array.from(baseInput.stage0.state).slice(1),
        ],
      },
    };
    const strainMutatedInput: Land2017Sdirk2Stage1Input = {
      ...baseInput,
      stage0: {
        ...baseInput.stage0,
        fiberEngineeringStrain: baseInput.stage0.fiberEngineeringStrain + 1e-4,
      },
    };
    const calciumMutatedInput: Land2017Sdirk2Stage1Input = {
      ...baseInput,
      stage0: {
        ...baseInput.stage0,
        freeCalciumUM: baseInput.stage0.freeCalciumUM + 0.05,
      },
    };

    expect(linfDiff(baseResidual, writeLand2017Sdirk2StageResidual(
      stage1.final.land.stageState,
      stage1.final.land.previousState,
      stateMutatedInput,
    ))).toBeGreaterThan(0);
    expect(linfDiff(baseResidual, writeLand2017Sdirk2StageResidual(
      stage1.final.land.stageState,
      stage1.final.land.previousState,
      strainMutatedInput,
    ))).toBeGreaterThan(0);
    expect(linfDiff(baseResidual, writeLand2017Sdirk2StageResidual(
      stage1.final.land.stageState,
      stage1.final.land.previousState,
      calciumMutatedInput,
    ))).toBeGreaterThan(0);
  });

  it("rejects independent rate and RHS injection into the dedicated SDIRK2 entrypoint", () => {
    expect(() =>
      deriveLand2017Sdirk2StageKinematics({
        freeCalciumUM: 1,
        previousFiberEngineeringStrain: 0.01,
        stageFiberEngineeringStrain: 0.02,
        dtSec: 0.001,
        stageFiberEngineeringStrainRatePerSec: 3,
        stage: { scheme: "SDIRK2", stageIndex: 0, gamma: LAND2017_SDIRK2_GAMMA },
      } as any),
    ).toThrow(/derive.*rates.*RHS|remove/i);

    expect(() =>
      writeLand2017Sdirk2StageResidual(
        [0.55, 0.12, 0.08, 0.04, 0.06, 0.12],
        [0.55, 0.12, 0.08, 0.04, 0.06, 0.12],
        {
          freeCalciumUM: 1,
          previousFiberEngineeringStrain: 0.01,
          stageFiberEngineeringStrain: 0.02,
          dtSec: 0.001,
          rhs0: [0, 0, 0, 0, 0, 0],
          stageCoordinateRateSI: 1,
          stage: { scheme: "SDIRK2", stageIndex: 0, gamma: LAND2017_SDIRK2_GAMMA },
        } as any,
      ),
    ).toThrow(/derive.*rates.*RHS|remove/i);
  });

  it("fails if SDIRK2 stage evidence, discrepancy evidence, claim scope, or runtime isolation is weakened", () => {
    const input = fixture();
    const sample = input.report.localReferenceSolve.samples[0];
    const stage = sample.stages[1];
    stage.final.land.ok = false;
    stage.final.land.stageScheme = "BE";
    stage.final.land.residualNorm = 1;
    stage.newton.iterationCount = 0;
    stage.newton.unknownVectorDimension = 1;
    stage.newton.finalResidualAbsPa = 1;
    stage.newton.finalLandResidualNorm = 1;
    stage.final.rateDerivation.pass = false;
    stage.finiteHealth.pass = false;
    sample.pass = false;
    input.report.localReferenceAcceptance.landStageConvergencePass = false;
    input.report.localReferenceAcceptance.newtonFdLineSearchEvidencePass = false;
    input.report.localReferenceAcceptance.stageRateDerivationPass = false;
    input.report.localReferenceAcceptance.finiteStateHealthPass = false;
    input.report.localReferenceAcceptance.beVsSdirk2DiscrepancyPass = false;
    input.report.localReferenceAcceptance.pass = false;
    input.report.beVsSdirk2Discrepancy.allNotIdentical = false;
    input.report.beVsSdirk2Discrepancy.pass = false;
    input.report.claimScope.productionSolverComparison = "claimed";
    input.runtimeIntegrationFiles = [
      {
        path: "engine/ModelCore.ts",
        text:
          "import { runLocalMonolithicSdirk2V1ReferenceSuite } from '@/engine/myocardium/coupling/localMonolithicSdirk2V1';\n"
          + "const useRuntimeReplacement = true;\n",
      },
    ];

    const validation = validateLocalMonolithicSdirk2Readiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase5b_land_sdirk2_convergence")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase5b_newton_fd_line_search")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase5b_stage_rate_derivation")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase5b_be_sdirk2_discrepancy")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase5b_forbidden_claim")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase5b_runtime_leak")).toBe(true);
  });
});

function fixture() {
  return structuredClone(baseValidationInput) as any;
}

function linfDiff(left: ArrayLike<number>, right: ArrayLike<number>): number {
  expect(left.length).toBe(right.length);
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff = Math.max(diff, Math.abs(left[index] - right[index]));
  }
  return diff;
}
