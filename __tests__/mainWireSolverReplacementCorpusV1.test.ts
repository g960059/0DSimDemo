import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_SOLVER_REPLACEMENT_ACCEPTANCE_POLICY_V1,
  MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_CASES_V1,
} from "@/engine/vnext/MainWireSolverReplacementCorpusV1";
import {
  captureMainWireSolverReplacementCorpusV1,
  compareMainWireCoupledSolverShadowCorpusV1,
} from "@/tools/performance/solverReplacementCorpusV1";

describe("main-wire solver replacement corpus V1", () => {
  it("captures six distinct 500-step numerical probe trajectories", () => {
    const report = captureMainWireSolverReplacementCorpusV1();

    expect(report.cases.map(({ caseId }) => caseId)).toEqual([
      "baseline",
      "low-preload",
      "high-afterload",
      "high-peep",
      "tachycardia",
      "high-contractility",
    ]);
    // Recorded historical hashes remain diagnostics, not cross-runtime gates.
    // The independent coupled-solver limits below remain acceptance authority.
    expect(report.cases.every(({ acceptedStepCount }) => acceptedStepCount === 500)).toBe(true);
    expect(new Set(report.cases.map(({ actualSha256 }) => actualSha256)).size)
      .toBe(report.cases.length);
  }, 30_000);

  it("separates legacy evidence from candidate-solver acceptance", () => {
    expect(MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_CASES_V1).toHaveLength(6);
    expect(
      MAIN_WIRE_SOLVER_REPLACEMENT_ACCEPTANCE_POLICY_V1
        .referenceSequenceHashIsAcceptanceAuthority,
    ).toBe(false);
    expect(
      MAIN_WIRE_SOLVER_REPLACEMENT_ACCEPTANCE_POLICY_V1
        .checkpointContinuationMustBeExactWithinCandidateRelease,
    ).toBe(true);
    expect(
      MAIN_WIRE_SOLVER_REPLACEMENT_ACCEPTANCE_POLICY_V1
        .clinicalValidationClaimed,
    ).toBe(false);
  });

  it("keeps the coupled solve on the same six-case accepted branch", () => {
    const report = compareMainWireCoupledSolverShadowCorpusV1();

    expect(report.cases.map(({ caseId }) => caseId)).toEqual([
      "baseline",
      "low-preload",
      "high-afterload",
      "high-peep",
      "tachycardia",
      "high-contractility",
    ]);
    for (const result of report.cases) {
      expect(result.acceptedStepCount).toBe(500);
      expect(result.maximumAbsoluteVolumeDifferenceMl).toBeLessThan(1e-5);
      expect(result.maximumAbsoluteDependentSvResidualMl).toBeLessThan(1e-8);
      // Raw residual magnitude is diagnostic only. Convergence is owned by
      // the same component-wise mixed gates used by public trial admission;
      // retain this looser bound as a regression tripwire against gross drift.
      expect(result.maximumCoupledResidualInfinityNormMl).toBeLessThan(5e-8);
      expect(result.maximumCoupledIterations).toBeLessThanOrEqual(8);
      expect(result.meanCoupledJacobianEvaluations).toBeLessThanOrEqual(2);
    }
  }, 60_000);
});
