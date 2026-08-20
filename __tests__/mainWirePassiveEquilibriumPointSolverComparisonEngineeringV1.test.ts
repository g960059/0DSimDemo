import { describe, expect, it } from "vitest";
import type { MainWireNormalAdultPassiveEquilibriumCoordinatesV3 } from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonDefinitionV1";
import {
  createMainWirePassiveEquilibriumManufacturedCasesV1,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_ARCHIVE_DIAGNOSTIC_CASES_V1,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_DECLARATION_V1,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_RANKED_TARGETS_V1,
} from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonCorpusV1";
import {
  evaluateMainWirePassiveEquilibriumComponentEnergyComparisonV3,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_COMPONENT_ENERGY_TERMINAL_ROOT_GUARD_V3_ID,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICIES_V3,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_ORDER_V3,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_LM_V3_ID,
  solveMainWirePassiveEquilibriumPointEngineeringV3,
  type MainWirePassiveEquilibriumCandidateEvaluatorV3,
  type MainWirePassiveEquilibriumPointSolverPolicyIdV3,
  type MainWirePassiveEquilibriumSolverCandidateInputV3,
} from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonEngineeringV1";

const VOLUME_SCALE = 42e-6;
const RADIUS_SCALE = 0.033;
const RADIUS_ORIGIN = 0.033;

describe("passive-equilibrium point-solver V3 Engineering comparison", () => {
  it("freezes the declaration, 16 ranked targets, and non-ranking archive diagnostics without evaluating normal-adult mechanics", () => {
    expect(
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_DECLARATION_V1.commitSha,
    ).toBe("b5f929e20820e5cf3e7a54dc23f96e4666ed67f4");
    expect(MAIN_WIRE_PASSIVE_EQUILIBRIUM_RANKED_TARGETS_V1).toHaveLength(16);
    expect(
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_RANKED_TARGETS_V1.filter(
        (target) => target.referenceCase,
      ),
    ).toHaveLength(1);
    expect(
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_ARCHIVE_DIAGNOSTIC_CASES_V1
        .historicalBoundary.casesAffectRanking,
    ).toBe(false);
    expect(
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_ARCHIVE_DIAGNOSTIC_CASES_V1
        .historicalBoundary.archivedArtifactConsumedAtRuntime,
    ).toBe(false);
    const [literal, canonical] =
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_ARCHIVE_DIAGNOSTIC_CASES_V1.homotopyTargets;
    expect(literal!.chamberVolumesM3.LV).not.toBe(
      canonical!.chamberVolumesM3.LV,
    );
    expect(literal!.chamberVolumesM3.RV).not.toBe(
      canonical!.chamberVolumesM3.RV,
    );
    expect(createMainWirePassiveEquilibriumManufacturedCasesV1()).toHaveLength(
      8,
    );
  });

  it("keeps the three declared policies unqualified and rejects policy substitution", () => {
    expect(MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_ORDER_V3).toEqual([
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID,
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_LM_V3_ID,
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_COMPONENT_ENERGY_TERMINAL_ROOT_GUARD_V3_ID,
    ]);
    expect(
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICIES_V3[
        MAIN_WIRE_PASSIVE_EQUILIBRIUM_COMPONENT_ENERGY_TERMINAL_ROOT_GUARD_V3_ID
      ].energyUlpFloorApplied,
    ).toBe(false);
    expect(() =>
      solveMainWirePassiveEquilibriumPointEngineeringV3({
        policyId:
          "caller-selected-off-contract-policy" as MainWirePassiveEquilibriumPointSolverPolicyIdV3,
        stageIndex: 0,
        initialCoordinates: coordinates(0.5, 0.5),
        evaluateCandidate: quadraticEvaluator({
          root: [0.125, 0.25],
          hessian: [
            [1, 0],
            [0, 1],
          ],
        }),
      }),
    ).toThrow("unknown passive-equilibrium point-solver policy");
  });

  it("converges all policies on the quadratic, near-flat, and magnitude-imbalanced mandatory cases", () => {
    const cases = [
      {
        initial: coordinates(0.5, 0.5),
        evaluator: quadraticEvaluator({
          root: [0.125, 0.25],
          hessian: [
            [1, 0],
            [0, 1],
          ],
        }),
      },
      {
        initial: coordinates(0.25, 0.5),
        evaluator: nearFlatQuarticEvaluator(),
      },
      {
        initial: coordinates(0.75, -0.25),
        evaluator: quadraticEvaluator({
          root: [0.125, 0.25],
          hessian: [
            [1e-3, 0],
            [0, 100],
          ],
        }),
      },
    ];
    for (const [caseIndex, testCase] of cases.entries()) {
      for (const policyId of MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_ORDER_V3) {
        const result = solveMainWirePassiveEquilibriumPointEngineeringV3({
          policyId,
          stageIndex: caseIndex,
          initialCoordinates: testCase.initial,
          evaluateCandidate: testCase.evaluator,
        });
        expect(result.status, `${caseIndex}:${policyId}`).toBe(
          "point-local-stable-root-established",
        );
        expect(result.pointLocalStableRootEstablished).toBe(true);
        expect(result.officialQualificationEstablished).toBe(false);
        expect(result.surfaceEstablished).toBe(false);
        expect(result.branchEstablished).toBe(false);
        expect(result.globalUniquenessEstablished).toBe(false);
        if (result.status === "point-local-stable-root-established") {
          expect(
            result.terminalCandidate.scaledForceInfinityNorm,
          ).toBeLessThanOrEqual(1e-10);
          expect(
            result.terminalCandidate.minimumScaledInternalHessianEigenvalue,
          ).toBeGreaterThan(1e-10);
        }
      }
    }
  });

  it("keeps residual decisions invariant to large wall-energy offsets and uses the terminal guard only at a valid b0 root", () => {
    for (const offsetJ of [0, 1e8, 1e16]) {
      const evaluator = quadraticEvaluator({
        root: [0.125, 0.25],
        hessian: [
          [1, 0],
          [0, 1],
        ],
        wallEnergyOffsetJ: offsetJ,
      });
      const results =
        MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_ORDER_V3.map(
          (policyId) =>
            solveMainWirePassiveEquilibriumPointEngineeringV3({
              policyId,
              stageIndex: 0,
              initialCoordinates: coordinates(0.5, 0.5),
              evaluateCandidate: evaluator,
            }),
        );
      for (const result of results)
        expect(result.status, `${offsetJ}:${result.policyId}`).toBe(
          "point-local-stable-root-established",
        );
      expect(results[0]!.acceptedUpdates).toBe(1);
      expect(results[1]!.acceptedUpdates).toBeGreaterThan(0);
      if (offsetJ === 1e16) {
        expect(results[2]!.trace[0]!.selectedReason).toBe(
          "terminal-root-guard-satisfied",
        );
      }
    }

    const notYetRoot = solveMainWirePassiveEquilibriumPointEngineeringV3({
      policyId:
        MAIN_WIRE_PASSIVE_EQUILIBRIUM_COMPONENT_ENERGY_TERMINAL_ROOT_GUARD_V3_ID,
      stageIndex: 0,
      initialCoordinates: coordinates(0.5, 0.5),
      evaluateCandidate: terminalGuardNegativeEvaluator(),
    });
    expect(notYetRoot.status).toBe("point-solve-failed");
    expect(notYetRoot.failureReason).toBe("line-search-failed");
    expect(
      notYetRoot.trace[0]?.trials.some(
        (trial) => trial.reason === "terminal-root-guard-satisfied",
      ),
    ).toBe(false);
  });

  it("rejects a force-zero saddle and a constant-residual field", () => {
    for (const policyId of MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_ORDER_V3) {
      const saddle = solveMainWirePassiveEquilibriumPointEngineeringV3({
        policyId,
        stageIndex: 0,
        initialCoordinates: coordinates(0, 0),
        evaluateCandidate: quadraticEvaluator({
          root: [0, 0],
          hessian: [
            [1, 0],
            [0, -1],
          ],
        }),
      });
      expect(saddle.status).toBe("point-solve-failed");
      expect(saddle.failureReason).toBe(
        "scaled-internal-hessian-not-positive-definite",
      );

      const constantResidual =
        solveMainWirePassiveEquilibriumPointEngineeringV3({
          policyId,
          stageIndex: 0,
          initialCoordinates: coordinates(0.5, 0.5),
          evaluateCandidate: (q) => ({
            internalCoordinates: q,
            wallStoredEnergyJ: { LVFW: 1, SEP: 1, RVFW: 1 },
            scaledGradient: [1, 1],
            scaledInternalHessian: [
              [1, 0],
              [0, 1],
            ],
          }),
        });
      expect(constantResidual.status).toBe("point-solve-failed");
      expect(constantResidual.failureReason).toBe(
        policyId === MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_LM_V3_ID
          ? "lm-damping-exhausted"
          : "line-search-failed",
      );
    }
  });

  it("uses the exact component expansion rather than rounded ventricular totals", () => {
    const current = { LVFW: 1e16, SEP: 1e16, RVFW: 1e16 };
    const trial = { LVFW: 1e16, SEP: 1e16, RVFW: 1e16 };
    const comparison =
      evaluateMainWirePassiveEquilibriumComponentEnergyComparisonV3({
        currentWallStoredEnergyJ: current,
        trialWallStoredEnergyJ: trial,
        rhsJ: -1e-20,
      });
    expect(comparison.available).toBe(true);
    expect(comparison.exactSign).toBe(1);
    expect(comparison.accepted).toBe(false);
    expect(comparison.twoDiffTerms).toHaveLength(6);
    expect(comparison.energyExpansion).toHaveLength(6);
    expect(comparison.comparisonExpansion).toHaveLength(7);

    expect(
      evaluateMainWirePassiveEquilibriumComponentEnergyComparisonV3({
        currentWallStoredEnergyJ: current,
        trialWallStoredEnergyJ: trial,
        rhsJ: -0,
      }).available,
    ).toBe(false);
    expect(
      evaluateMainWirePassiveEquilibriumComponentEnergyComparisonV3({
        currentWallStoredEnergyJ: current,
        trialWallStoredEnergyJ: trial,
        rhsJ: Number.NEGATIVE_INFINITY,
      }).available,
    ).toBe(false);
  });

  it("fails closed on singular, non-finite, and bit-unchanged candidate paths", () => {
    const singular = solveMainWirePassiveEquilibriumPointEngineeringV3({
      policyId: MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID,
      stageIndex: 0,
      initialCoordinates: coordinates(0.5, 0.5),
      evaluateCandidate: (q) => ({
        internalCoordinates: q,
        wallStoredEnergyJ: { LVFW: 0, SEP: 0, RVFW: 0 },
        scaledGradient: [1, 1],
        scaledInternalHessian: [
          [1, 1],
          [1, 1],
        ],
      }),
    });
    expect(singular.failureReason).toBe("scaled-internal-hessian-singular");

    const nonFinite = solveMainWirePassiveEquilibriumPointEngineeringV3({
      policyId: MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID,
      stageIndex: 0,
      initialCoordinates: coordinates(0.5, 0.5),
      evaluateCandidate: (q) => ({
        internalCoordinates: q,
        wallStoredEnergyJ: { LVFW: Number.NaN, SEP: 0, RVFW: 0 },
        scaledGradient: [1, 1],
        scaledInternalHessian: [
          [1, 0],
          [0, 1],
        ],
      }),
    });
    expect(nonFinite.failureReason).toBe("candidate-evaluation-failed");

    const unchanged = solveMainWirePassiveEquilibriumPointEngineeringV3({
      policyId: MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID,
      stageIndex: 0,
      initialCoordinates: coordinates(1e16, 1e16),
      evaluateCandidate: (q) => ({
        internalCoordinates: q,
        wallStoredEnergyJ: { LVFW: 1, SEP: 1, RVFW: 1 },
        scaledGradient: [1, 1],
        scaledInternalHessian: [
          [1e16, 0],
          [0, 1e16],
        ],
      }),
    });
    expect(unchanged.failureReason).toBe("line-search-failed");
    expect(unchanged.trace[0]!.trials).toHaveLength(29);
    expect(
      unchanged.trace[0]!.trials.every(
        (trial) => trial.reason === "zero-coordinate-step",
      ),
    ).toBe(true);
  });
});

function coordinates(
  scaledVolume: number,
  scaledRadius: number,
): MainWireNormalAdultPassiveEquilibriumCoordinatesV3 {
  return Object.freeze({
    septalMidwallCapVolumeM3: VOLUME_SCALE * scaledVolume,
    junctionRadiusM: RADIUS_ORIGIN + RADIUS_SCALE * scaledRadius,
  });
}

function scaledCoordinates(
  q: MainWireNormalAdultPassiveEquilibriumCoordinatesV3,
): readonly [number, number] {
  return [
    q.septalMidwallCapVolumeM3 / VOLUME_SCALE,
    (q.junctionRadiusM - RADIUS_ORIGIN) / RADIUS_SCALE,
  ];
}

function quadraticEvaluator(
  input: Readonly<{
    root: readonly [number, number];
    hessian: readonly [readonly [number, number], readonly [number, number]];
    wallEnergyOffsetJ?: number;
  }>,
): MainWirePassiveEquilibriumCandidateEvaluatorV3 {
  return (q) => {
    const x = scaledCoordinates(q);
    const dx0 = x[0] - input.root[0];
    const dx1 = x[1] - input.root[1];
    const h00 = input.hessian[0][0];
    const h01 = input.hessian[0][1];
    const h11 = input.hessian[1][1];
    const g0 = h00 * dx0 + h01 * dx1;
    const g1 = h01 * dx0 + h11 * dx1;
    const energy = 0.5 * (dx0 * g0 + dx1 * g1);
    const offset = input.wallEnergyOffsetJ ?? 0;
    return {
      internalCoordinates: q,
      wallStoredEnergyJ: {
        LVFW: offset + 0.5 * energy,
        SEP: offset,
        RVFW: offset + 0.5 * energy,
      },
      scaledGradient: [g0, g1],
      scaledInternalHessian: [
        [h00, h01],
        [h01, h11],
      ],
    };
  };
}

function nearFlatQuarticEvaluator(): MainWirePassiveEquilibriumCandidateEvaluatorV3 {
  return (q) => {
    const [x, y] = scaledCoordinates(q);
    const energyX = 0.5e-9 * x * x + 0.25 * x ** 4;
    const energyY = 0.5 * y * y;
    return {
      internalCoordinates: q,
      wallStoredEnergyJ: {
        LVFW: energyX,
        SEP: 0,
        RVFW: energyY,
      },
      scaledGradient: [1e-9 * x + x ** 3, y],
      scaledInternalHessian: [
        [1e-9 + 3 * x * x, 0],
        [0, 1],
      ],
    };
  };
}

function terminalGuardNegativeEvaluator(): MainWirePassiveEquilibriumCandidateEvaluatorV3 {
  const initial = coordinates(0.5, 0.5);
  return (q) => {
    const isInitial =
      q.septalMidwallCapVolumeM3 === initial.septalMidwallCapVolumeM3 &&
      q.junctionRadiusM === initial.junctionRadiusM;
    return {
      internalCoordinates: q,
      wallStoredEnergyJ: { LVFW: 1e16, SEP: 1e16, RVFW: 1e16 },
      scaledGradient: isInitial ? [1e-8, 0] : [2e-10, 0],
      scaledInternalHessian: [
        [1, 0],
        [0, 1],
      ],
    };
  };
}
