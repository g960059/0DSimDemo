import { describe, expect, it } from "vitest";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import { auditMainWirePassiveEquilibriumManufacturedStageV2 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumEvidenceAuditorV2";
import {
  assertMainWireNormalAdultPassiveEquilibriumPointOwnerV2,
  createMainWireNormalAdultPassiveEquilibriumPointOwnerV2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV2";
import {
  evaluateMainWirePassiveEquilibriumArmijoExpansionV2,
  evaluateMainWirePassiveEquilibriumTwoDiffV2,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V2_ID,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2_ID,
  sealMainWirePassiveEquilibriumManufacturedStageV2,
  solveMainWirePassiveEquilibriumManufacturedStageV2,
  wrapMainWirePassiveEquilibriumFloat64V2,
  type MainWirePassiveEquilibriumInternalCoordinatesV2,
  type MainWirePassiveEquilibriumManufacturedCandidateEvaluatorV2,
  type MainWirePassiveEquilibriumManufacturedStageResultV2,
  type MainWirePassiveEquilibriumStageCandidateProjectionV2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumNumericsV2";

const POLICY =
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2;
const MANUFACTURED_ROOT = Object.freeze({
  septalMidwallCapVolumeM3: 0.00125,
  junctionRadiusM: 0.2,
});

describe("passive equilibrium V2 exact numerical owner", () => {
  it("binds only the two V2 scientific identities and keeps the factory solve-free", async () => {
    expect(POLICY.policyId).toBe(
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2_ID,
    );
    expect(POLICY.inheritedV1ScientificContract.candidateAuthority).toBe(
      "evaluateMainWireNormalAdultPassiveEquilibriumCandidateV1",
    );
    expect(POLICY.unchangedSolverSemantics).toEqual({
      hessianShiftApplied: false,
      steepestDescentFallbackApplied: false,
      rescuePathApplied: false,
      iterationBoundary:
        "at-most-48-accepted-updates-followed-by-one-terminal-force-and-stability-evaluation",
      stagnation:
        "only-after-accepted-candidate-stability-and-force-above-tolerance-and-scaled-update-at-most-limit",
      successfulStage:
        "force-tolerance-and-strict-scaled-internal-hessian-stability-required-including-terminal",
    });

    const owner =
      await createMainWireNormalAdultPassiveEquilibriumPointOwnerV2();
    assertMainWireNormalAdultPassiveEquilibriumPointOwnerV2(owner);
    expect(owner.ownerId).toBe(
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V2_ID,
    );
    expect(owner.canonicalReferenceRootMintingAvailable).toBe(false);
    expect(owner.callerSuppliedAttemptLineageAccepted).toBe(false);
    expect(owner.callerSuppliedCandidateEvaluatorAccepted).toBe(false);
    expect(owner.importOrFactoryRunsNormalAdultSolve).toBe(false);
    expect(
      await sha256CanonicalJsonHex(
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2,
      ),
    ).toBe("71dd920e828297ecb15181cd9c91c6a37b4226506597ec397ddda4cae073a9ea");
    expect(owner.pointSolverBranchProtocolSha256).toBe(
      "cbe8d42cdab549f46ef25103741d807473e9f0253d7f1a037ae5fc175665dc38",
    );
    expect(() =>
      assertMainWireNormalAdultPassiveEquilibriumPointOwnerV2(
        structuredClone(owner),
      ),
    ).toThrow(/freshly created/);
    const substitutedOwner = structuredClone(owner) as any;
    substitutedOwner.ownerId =
      "main-wire-normal-adult-five-wall-passive-equilibrium-point-owner-v1";
    expect(() =>
      assertMainWireNormalAdultPassiveEquilibriumPointOwnerV2(substitutedOwner),
    ).toThrow(/freshly created/);
  });

  it("retains exact large-offset differences and rejects a rounded boundary false accept", () => {
    const largeOffset = evaluateMainWirePassiveEquilibriumArmijoExpansionV2({
      currentWallStoredEnergyJ: {
        LVFW: 100000000,
        SEP: 10000000000000000,
        RVFW: 1,
      },
      trialWallStoredEnergyJ: {
        LVFW: 99999999.99999996,
        SEP: 9999999999999996,
        RVFW: 1.0000000000000002,
      },
      rhs: -3,
    });
    const retainedDifference = finiteValues(
      largeOffset.evaluatedDifferenceExpansion,
    );
    const retainedComparison = finiteValues(largeOffset.comparisonExpansion);
    expect(exactBinarySumKey(retainedDifference)).toBe(
      exactBinarySumKey([
        99999999.99999996, -100000000, 9999999999999996, -10000000000000000,
        1.0000000000000002, -1,
      ]),
    );
    expect(exactBinarySumKey(retainedComparison)).toBe(
      exactBinarySumKey([
        99999999.99999996, -100000000, 9999999999999996, -10000000000000000,
        1.0000000000000002, -1, 3,
      ]),
    );
    const wallInputs = {
      LVFW: [99999999.99999996, 100000000],
      SEP: [9999999999999996, 10000000000000000],
      RVFW: [1.0000000000000002, 1],
    } as const;
    for (const wall of ["LVFW", "SEP", "RVFW"] as const) {
      const evidence = largeOffset.twoDiffByWall[wall];
      expect(
        exactBinarySumKey([evidence.x.value!, evidence.y.value!]),
        wall,
      ).toBe(exactBinarySumKey([wallInputs[wall][0], -wallInputs[wall][1]]));
    }
    expect(largeOffset.exactExpansionSign).toBe(-1);
    expect(
      99999999.99999996 + 9999999999999996 + 1.0000000000000002 <=
        100000000 + 10000000000000000 + 1 - 3,
    ).toBe(false);

    const boundary = evaluateMainWirePassiveEquilibriumArmijoExpansionV2({
      currentWallStoredEnergyJ: {
        LVFW: 100000000,
        SEP: 10000000000000000,
        RVFW: 1,
      },
      trialWallStoredEnergyJ: {
        LVFW: 100000000,
        SEP: 9999999999999996,
        RVFW: 1.0000000000000002,
      },
      rhs: -4,
    });
    expect(boundary.deltaUStableDiagnosticJ.value).toBe(-4);
    expect((boundary.deltaUStableDiagnosticJ.value as number) <= -4).toBe(true);
    expect(boundary.exactExpansionSign).toBe(1);
    expect(boundary.highestNonzeroComparisonExpansionIndex).toBe(4);
  });

  it("round-trips signed-zero evidence through canonical JSON while keeping bits authoritative", async () => {
    const negativeZero = wrapMainWirePassiveEquilibriumFloat64V2(-0);
    const positiveZero = wrapMainWirePassiveEquilibriumFloat64V2(0);
    expect(negativeZero).toEqual({
      value: 0,
      float64BitsHex: "8000000000000000",
      classification: "finite",
    });
    expect(positiveZero).toEqual({
      value: 0,
      float64BitsHex: "0000000000000000",
      classification: "finite",
    });
    expect(Object.is(negativeZero.value, -0)).toBe(false);

    const result = solveMainWirePassiveEquilibriumManufacturedStageV2({
      stageIndex: 0,
      initialCoordinates: MANUFACTURED_ROOT,
      evaluateCandidate: constantCandidateEvaluator({
        gradient: [-0, 0],
        hessian: [
          [1, -0],
          [-0, 1],
        ],
        eigenvalues: [1, 1],
        force: 0,
        walls: [-0, 20, 30],
      }),
    });
    const envelope =
      await sealMainWirePassiveEquilibriumManufacturedStageV2(result);
    const inMemoryAudit =
      await auditMainWirePassiveEquilibriumManufacturedStageV2(envelope);
    expect(
      inMemoryAudit.report.auditStatus,
      JSON.stringify(inMemoryAudit.report),
    ).toBe("passed");
    const roundTripped = JSON.parse(
      canonicalJsonStringify(envelope),
    ) as typeof envelope;
    const roundTripAudit =
      await auditMainWirePassiveEquilibriumManufacturedStageV2(roundTripped);
    expect(
      roundTripAudit.report.auditStatus,
      JSON.stringify({
        report: roundTripAudit.report,
        current: roundTripped.stageResult.iterations[0].currentSolverEvidence,
      }),
    ).toBe("passed");

    const signTamper = structuredClone(roundTripped) as any;
    signTamper.stageResult.terminalCandidate.wallStoredEnergyJ.LVFW.float64BitsHex =
      "0000000000000000";
    signTamper.stageResultSha256 = await sha256CanonicalJsonHex(
      signTamper.stageResult,
    );
    expect(
      (await auditMainWirePassiveEquilibriumManufacturedStageV2(signTamper))
        .report.auditStatus,
    ).toBe("failed");
  });

  it("matches the V1 first backtrack in a well-conditioned fixture with frozen bits", () => {
    const initialCoordinates = offsetCoordinates(1, 0);
    const evaluator = wellConditionedEvaluator();
    const current = evaluator(initialCoordinates);
    const direction = [-1, 0] as const;
    let v1FirstBacktrack: number | null = null;
    for (let b = 0; b <= 28; b += 1) {
      const trial = evaluator(
        trialCoordinatesAtB(initialCoordinates, direction, b),
      );
      const alpha = 2 ** -b;
      if (
        trial.rawVentricularStoredEnergyJ <=
        current.rawVentricularStoredEnergyJ + 1e-4 * alpha * -1
      ) {
        v1FirstBacktrack = b;
        break;
      }
    }
    const result = solveMainWirePassiveEquilibriumManufacturedStageV2({
      stageIndex: 1,
      initialCoordinates,
      evaluateCandidate: evaluator,
    });
    const iteration = result.iterations[0];
    if (iteration.status !== "line-search-entered")
      throw new Error("expected line search");
    expect(v1FirstBacktrack).toBe(0);
    expect(iteration.decision.selectedBacktrackExponent).toBe(v1FirstBacktrack);
    const selected = iteration.candidateRecords[0];
    if (selected.status !== "evaluated") throw new Error("expected evaluated");
    expect(
      selected.evaluatedDifferenceExpansion.map(
        (entry) => entry.float64BitsHex,
      ),
    ).toEqual([
      "0000000000000000",
      "0000000000000000",
      "0000000000000000",
      "0000000000000000",
      "0000000000000000",
      "bfdfffffffffffe0",
    ]);
    expect(selected.deltaUStableDiagnosticJ.float64BitsHex).toBe(
      "bfdfffffffffffe0",
    );
  });

  it("does not categorically reject a one-ULP coordinate move but rejects zero stable decrease", () => {
    const current = {
      septalMidwallCapVolumeM3: 1,
      junctionRadiusM: 0.2,
    } as const;
    const next = nextUp(1);
    const direction =
      (next - current.septalMidwallCapVolumeM3) /
      POLICY.coordinateScales.septalMidwallCapVolumeM3;
    const h00 = 1 / direction;
    const makeEvaluator =
      (decrease: boolean) =>
      (coordinates: MainWirePassiveEquilibriumInternalCoordinatesV2) => {
        const moved =
          floatBits(coordinates.septalMidwallCapVolumeM3) === floatBits(next);
        return candidateProjection(coordinates, {
          gradient: [-1, 0],
          force: 1,
          hessian: [
            [h00, 0],
            [0, 1],
          ],
          eigenvalues: [1, h00],
          walls: [moved && decrease ? nextDown(10) : 10, 20, 30],
        });
      };

    const passing = solveMainWirePassiveEquilibriumManufacturedStageV2({
      stageIndex: 11,
      initialCoordinates: current,
      evaluateCandidate: makeEvaluator(true),
    });
    const passingIteration = passing.iterations[0];
    if (passingIteration.status !== "line-search-entered")
      throw new Error("expected line search");
    const passingRecord = passingIteration.candidateRecords[0];
    expect(passingRecord).toMatchObject({
      status: "evaluated",
      reason: "armijo-satisfied",
      selectedForUpdate: true,
    });
    expect(
      passingRecord.trialCoordinates.septalMidwallCapVolumeM3.float64BitsHex,
    ).toBe(floatBits(next));

    const rejected = solveMainWirePassiveEquilibriumManufacturedStageV2({
      stageIndex: 12,
      initialCoordinates: current,
      evaluateCandidate: makeEvaluator(false),
    });
    const rejectedIteration = rejected.iterations[0];
    if (rejectedIteration.status !== "line-search-entered")
      throw new Error("expected line search");
    expect(rejectedIteration.candidateRecords[0]).toMatchObject({
      status: "evaluated",
      reason: "armijo-not-satisfied",
      exactExpansionSign: 1,
      zeroCoordinateStep: false,
    });
    expect(rejectedIteration.candidateRecords[1]).toMatchObject({
      status: "not-evaluated",
      reason: "zero-coordinate-step",
    });
  });

  it("closes all 29 records, independently audits them, and isolates mutable evaluator outputs", async () => {
    const base = solveMainWirePassiveEquilibriumManufacturedStageV2({
      stageIndex: 0,
      initialCoordinates: offsetCoordinates(0.25, 0.25),
      evaluateCandidate: quadraticEvaluator(),
    });
    expect(base.status).toBe("converged");
    const first = base.iterations[0];
    expect(first.status).toBe("line-search-entered");
    if (first.status !== "line-search-entered") throw new Error("unreachable");
    expect(first.candidateRecords).toHaveLength(29);
    expect(first.decision).toEqual({
      outcome: "force-converged",
      selectedBacktrackExponent: 0,
      stageFailureReason: null,
    });
    expect(first.candidateRecords[0].decisionRole).toBe("selected-update");
    expect(
      first.candidateRecords
        .slice(1)
        .every(
          (record) =>
            record.decisionRole === "diagnostic-only-after-selection" &&
            !record.selectedForUpdate,
        ),
    ).toBe(true);
    const envelope =
      await sealMainWirePassiveEquilibriumManufacturedStageV2(base);
    const audit =
      await auditMainWirePassiveEquilibriumManufacturedStageV2(envelope);
    expect(audit.report).toMatchObject({
      qualification: "manufactured-non-qualified",
      auditStatus: "passed",
      firstMismatchPath: null,
    });
    expect(Object.values(audit.report.checks).every(Boolean)).toBe(true);

    const shared = mutableCandidate(offsetCoordinates(1, 0), 10, 1);
    let calls = 0;
    const mutableResult = solveMainWirePassiveEquilibriumManufacturedStageV2({
      stageIndex: 4,
      initialCoordinates: offsetCoordinates(1, 0),
      evaluateCandidate: (coordinates) => {
        calls += 1;
        shared.internalCoordinates.septalMidwallCapVolumeM3 =
          coordinates.septalMidwallCapVolumeM3;
        shared.internalCoordinates.junctionRadiusM =
          coordinates.junctionRadiusM;
        if (calls === 1) {
          setMutableCandidate(shared, 10, 1);
        } else if (calls === 2) {
          setMutableCandidate(shared, 9, 0);
        } else {
          setMutableCandidate(shared, 1000 + calls, 100);
        }
        return shared;
      },
    });
    expect(mutableResult.status).toBe("converged");
    const mutableIteration = mutableResult.iterations[0];
    if (mutableIteration.status !== "line-search-entered")
      throw new Error("expected line search");
    const selected = mutableIteration.candidateRecords[0];
    expect(selected.status).toBe("evaluated");
    if (selected.status !== "evaluated") throw new Error("expected evaluated");
    expect(selected.trialWallStoredEnergyJ.LVFW.value).toBe(9);
    expect(selected.trialCandidate.scaledForceInfinityNorm.value).toBe(0);
    expect(mutableResult.terminalCandidate?.wallStoredEnergyJ.LVFW.value).toBe(
      9,
    );
  });

  it("retains guards, exceptions, nonfinite walls, and the 48-update terminal check", async () => {
    const zeroStep = solveMainWirePassiveEquilibriumManufacturedStageV2({
      stageIndex: 2,
      initialCoordinates: {
        septalMidwallCapVolumeM3: 1e300,
        junctionRadiusM: 1e300,
      },
      evaluateCandidate: constantCandidateEvaluator({
        gradient: [1, 0],
        hessian: [
          [1, 0],
          [0, 1],
        ],
        eigenvalues: [1, 1],
        force: 1,
        walls: [10, 20, 30],
      }),
    });
    expect(zeroStep).toMatchObject({
      status: "failed",
      failureReason: "line-search-failed",
    });
    expect(
      zeroStep.iterations[0].status === "line-search-entered" &&
        zeroStep.iterations[0].candidateRecords.every(
          (record) =>
            record.status === "not-evaluated" &&
            record.reason === "zero-coordinate-step",
        ),
    ).toBe(true);
    const zeroAudit = await auditMainWirePassiveEquilibriumManufacturedStageV2(
      await sealMainWirePassiveEquilibriumManufacturedStageV2(zeroStep),
    );
    expect(zeroAudit.report.auditStatus).toBe("passed");

    const rhsGuard = solveMainWirePassiveEquilibriumManufacturedStageV2({
      stageIndex: 3,
      initialCoordinates: {
        ...MANUFACTURED_ROOT,
        septalMidwallCapVolumeM3: 1e-300,
      },
      evaluateCandidate: tinyDirectionEvaluator(1e-300),
    });
    expect(rhsGuard).toMatchObject({
      status: "failed",
      failureReason: "scaled-update-stagnated",
    });
    const rhsIteration = rhsGuard.iterations[0];
    if (rhsIteration.status !== "line-search-entered")
      throw new Error("expected line search");
    expect(rhsIteration.candidateRecords[0].decisionRole).toBe(
      "selected-update",
    );
    expect(
      rhsIteration.candidateRecords.some(
        (record) =>
          record.status === "not-evaluated" &&
          record.reason === "rhs-non-finite-or-not-strictly-negative" &&
          record.rhs.float64BitsHex === "8000000000000000",
      ),
    ).toBe(true);

    for (const invalidRhs of [
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.NaN,
      0,
      -0,
    ]) {
      const decisionSearchGuard =
        solveMainWirePassiveEquilibriumManufacturedStageV2({
          stageIndex: 30,
          initialCoordinates: offsetCoordinates(1, 0),
          evaluateCandidate: wellConditionedEvaluator(),
          manufacturedRhsOverride: ({ b, computedRhs }) =>
            b === 0 ? invalidRhs : computedRhs,
        });
      const guardIteration = decisionSearchGuard.iterations[0];
      if (guardIteration.status !== "line-search-entered")
        throw new Error("expected line search");
      expect(guardIteration.candidateRecords[0]).toMatchObject({
        status: "not-evaluated",
        reason: "rhs-non-finite-or-not-strictly-negative",
        decisionRole: "decision-search",
        selectedForUpdate: false,
      });
      expect(guardIteration.candidateRecords[0].rhs.float64BitsHex).toBe(
        floatBits(invalidRhs),
      );
      expect(guardIteration.candidateRecords[1]).toMatchObject({
        status: "evaluated",
        reason: "armijo-satisfied",
        decisionRole: "selected-update",
        selectedForUpdate: true,
      });
      expect(guardIteration.decision.selectedBacktrackExponent).toBe(1);
    }

    const exceptionCoordinates = trialCoordinatesAtB(
      offsetCoordinates(1, 0),
      [-1, 0],
      1,
    );
    const throwsAfterSelection = quadraticEvaluator((coordinates) => {
      if (sameCoordinateBits(coordinates, exceptionCoordinates))
        throw new Error("manufactured diagnostic exception");
    });
    const exceptionResult = solveMainWirePassiveEquilibriumManufacturedStageV2({
      stageIndex: 5,
      initialCoordinates: offsetCoordinates(1, 0),
      evaluateCandidate: throwsAfterSelection,
    });
    expect(exceptionResult.status).toBe("converged");
    const exceptionIteration = exceptionResult.iterations[0];
    if (exceptionIteration.status !== "line-search-entered")
      throw new Error("expected line search");
    expect(exceptionIteration.candidateRecords[1]).toMatchObject({
      status: "not-evaluated",
      reason: "candidate-evaluation-exception",
      decisionRole: "diagnostic-only-after-selection",
      selectedForUpdate: false,
    });
    const exceptionAudit =
      await auditMainWirePassiveEquilibriumManufacturedStageV2(
        await sealMainWirePassiveEquilibriumManufacturedStageV2(
          exceptionResult,
        ),
      );
    expect(exceptionAudit.report.auditStatus).toBe("passed");

    const nonfiniteWall = solveMainWirePassiveEquilibriumManufacturedStageV2({
      stageIndex: 6,
      initialCoordinates: offsetCoordinates(1, 0),
      evaluateCandidate: (coordinates) => {
        const current = sameCoordinateBits(
          coordinates,
          offsetCoordinates(1, 0),
        );
        return candidateProjection(coordinates, {
          gradient: [1, 0],
          force: 1,
          hessian: [
            [1, 0],
            [0, 1],
          ],
          eigenvalues: [1, 1],
          walls: current ? [10, 20, 30] : [Number.NaN, 20, 30],
        });
      },
    });
    const nonfiniteIteration = nonfiniteWall.iterations[0];
    if (nonfiniteIteration.status !== "line-search-entered")
      throw new Error("expected line search");
    expect(nonfiniteIteration.candidateRecords[0]).toMatchObject({
      status: "evaluated",
      reason: "wall-energy-non-finite",
      candidateFieldsFinite: true,
      wallEnergiesFinite: false,
    });

    const limit = solveMainWirePassiveEquilibriumManufacturedStageV2({
      stageIndex: 7,
      initialCoordinates: {
        septalMidwallCapVolumeM3: 1,
        junctionRadiusM: 0.2,
      },
      evaluateCandidate: linearDecreasingEvaluator(),
    });
    expect(limit).toMatchObject({
      status: "failed",
      failureReason: "newton-iteration-limit",
      completedNewtonUpdates: 48,
    });
    expect(limit.iterations).toHaveLength(49);
    expect(limit.iterations[48]).toMatchObject({
      status: "line-search-not-entered",
      reason: "newton-iteration-limit",
      candidateRecords: [],
    });

    let retainedFailureCalls = 0;
    const retainedFailure = solveMainWirePassiveEquilibriumManufacturedStageV2({
      stageIndex: 31,
      initialCoordinates: {
        septalMidwallCapVolumeM3: 1,
        junctionRadiusM: 0.2,
      },
      evaluateCandidate: (coordinates) => {
        retainedFailureCalls += 1;
        if (retainedFailureCalls === 31)
          throw new Error("manufactured next-iteration failure");
        return linearDecreasingEvaluator()(coordinates);
      },
    });
    expect(retainedFailure).toMatchObject({
      status: "failed",
      failureReason: "candidate-evaluation-failed",
      completedNewtonUpdates: 1,
    });
    expect(retainedFailure.terminalCandidate).not.toBeNull();
    const retainedFailureAudit =
      await auditMainWirePassiveEquilibriumManufacturedStageV2(
        await sealMainWirePassiveEquilibriumManufacturedStageV2(
          retainedFailure,
        ),
      );
    expect(retainedFailureAudit.report.auditStatus).toBe("passed");
  });

  it("fails closed on arithmetic, selection, projection, bit, and nested-shape tampering", async () => {
    const stage = solveMainWirePassiveEquilibriumManufacturedStageV2({
      stageIndex: 8,
      initialCoordinates: offsetCoordinates(0.5, 0.5),
      evaluateCandidate: quadraticEvaluator(),
    });
    const baseEnvelope =
      await sealMainWirePassiveEquilibriumManufacturedStageV2(stage);
    expect(
      (await auditMainWirePassiveEquilibriumManufacturedStageV2(baseEnvelope))
        .report.auditStatus,
    ).toBe("passed");

    const mutations: readonly ((clone: any) => void)[] = [
      (clone) => {
        const record = clone.iterations[0].candidateRecords[0];
        record.comparisonExpansion[6] = wrapMainWirePassiveEquilibriumFloat64V2(
          record.comparisonExpansion[6].value + 1,
        );
      },
      (clone) => {
        clone.iterations[0].candidateRecords[0].projectionCoordinatesMatch = false;
        clone.iterations[0].candidateRecords[0].rawVentricularEnergyBindingPassed = false;
        clone.iterations[0].candidateRecords[0].geometryPassed = false;
      },
      (clone) => {
        clone.solverPolicyId =
          "main-wire-normal-adult-passive-equilibrium-point-solver-policy-v1";
      },
      (clone) => {
        clone.iterations[0].candidateRecords[0].exactExpansionSign = 1;
      },
      (clone) => {
        clone.iterations[0].candidateRecords[0].armijoSatisfied = false;
      },
      (clone) => {
        clone.iterations[0].candidateRecords[0].selectedForUpdate = false;
      },
      (clone) => {
        clone.iterations[0].candidateRecords[0].currentWallStoredEnergyJ.LVFW =
          wrapMainWirePassiveEquilibriumFloat64V2(123);
      },
      (clone) => {
        clone.iterations[0].currentSolverEvidence.currentCandidate.scaledInternalHessian[1][0] =
          wrapMainWirePassiveEquilibriumFloat64V2(-0);
      },
      (clone) => {
        clone.iterations[0].currentSolverEvidence.currentCandidate.strictLocalStabilityPassed = false;
      },
      (clone) => {
        clone.iterations[0].candidateRecords[0].trialCandidate.rawVentricularStoredEnergyJ =
          wrapMainWirePassiveEquilibriumFloat64V2(999);
        clone.iterations[0].candidateRecords[0].rawVentricularEnergyBindingPassed = true;
      },
      (clone) => {
        clone.iterations[0].candidateRecords[0].step.push(
          wrapMainWirePassiveEquilibriumFloat64V2(0),
        );
      },
      (clone) => {
        clone.iterations[0].candidateRecords[0].trialCoordinates.extra =
          wrapMainWirePassiveEquilibriumFloat64V2(0);
        clone.iterations[0].candidateRecords[0].trialCandidate.internalCoordinates.extra =
          wrapMainWirePassiveEquilibriumFloat64V2(0);
      },
    ];
    for (const mutate of mutations) {
      const clone = structuredClone(
        baseEnvelope.stageResult,
      ) as MainWirePassiveEquilibriumManufacturedStageResultV2;
      mutate(clone);
      const resealed =
        await sealMainWirePassiveEquilibriumManufacturedStageV2(clone);
      const audit =
        await auditMainWirePassiveEquilibriumManufacturedStageV2(resealed);
      expect(audit.report.auditStatus).toBe("failed");
      expect(audit.report.firstMismatchPath).not.toBeNull();
    }

    const pretrial = solveMainWirePassiveEquilibriumManufacturedStageV2({
      stageIndex: 28,
      initialCoordinates: offsetCoordinates(1, 1),
      evaluateCandidate: constantCandidateEvaluator({
        gradient: [1, 1],
        hessian: [
          [1, 1],
          [1, 1],
        ],
        eigenvalues: [0, 2],
        force: 1,
        walls: [10, 20, 30],
        strictLocalStabilityPassed: false,
      }),
    });
    expect(pretrial).toMatchObject({
      status: "failed",
      failureReason: "scaled-internal-hessian-singular",
    });
    const unknownReason = structuredClone(pretrial) as any;
    unknownReason.iterations[0].reason = "unknown-pretrial-reason";
    const unknownReasonAudit =
      await auditMainWirePassiveEquilibriumManufacturedStageV2(
        await sealMainWirePassiveEquilibriumManufacturedStageV2(unknownReason),
      );
    expect(unknownReasonAudit.report.auditStatus).toBe("failed");
    expect(unknownReasonAudit.report.firstMismatchPath).toContain(".reason");

    const substitutedPolicyHash = structuredClone(baseEnvelope) as any;
    substitutedPolicyHash.solverPolicySha256 = "0".repeat(64);
    const substitutedPolicyAudit =
      await auditMainWirePassiveEquilibriumManufacturedStageV2(
        substitutedPolicyHash,
      );
    expect(substitutedPolicyAudit.report.auditStatus).toBe("failed");
    expect(substitutedPolicyAudit.report.firstMismatchPath).toBe(
      "$.policyBinding",
    );
  });

  it("rejects every frozen arithmetic substitution after a coordinated rehash", async () => {
    const result = solveMainWirePassiveEquilibriumManufacturedStageV2({
      stageIndex: 13,
      initialCoordinates: offsetCoordinates(0.5, 0.25),
      evaluateCandidate: quadraticEvaluator(),
    });
    const envelope =
      await sealMainWirePassiveEquilibriumManufacturedStageV2(result);
    const substitutions: readonly Readonly<{
      name: string;
      mutate: (clone: any) => void;
    }>[] = [
      {
        name: "wall-order-reversal",
        mutate: (clone) => {
          const record = clone.iterations[0].candidateRecords[0];
          [record.twoDiffByWall.LVFW, record.twoDiffByWall.RVFW] = [
            record.twoDiffByWall.RVFW,
            record.twoDiffByWall.LVFW,
          ];
          record.orderedDifferenceTerms = [
            record.orderedDifferenceTerms[4],
            record.orderedDifferenceTerms[5],
            record.orderedDifferenceTerms[2],
            record.orderedDifferenceTerms[3],
            record.orderedDifferenceTerms[0],
            record.orderedDifferenceTerms[1],
          ];
        },
      },
      {
        name: "reversed-two-diff-arguments",
        mutate: (clone) => {
          const record = clone.iterations[0].candidateRecords[0];
          record.twoDiffByWall.LVFW =
            evaluateMainWirePassiveEquilibriumTwoDiffV2(
              record.currentWallStoredEnergyJ.LVFW.value,
              record.trialWallStoredEnergyJ.LVFW.value,
            );
          record.orderedDifferenceTerms[0] = record.twoDiffByWall.LVFW.x;
          record.orderedDifferenceTerms[1] = record.twoDiffByWall.LVFW.y;
        },
      },
      {
        name: "one-sign-change",
        mutate: (clone) => {
          const record = clone.iterations[0].candidateRecords[0];
          record.orderedDifferenceTerms[0] =
            wrapMainWirePassiveEquilibriumFloat64V2(
              -record.orderedDifferenceTerms[0].value,
            );
        },
      },
      {
        name: "reassociated-six-term-reduction",
        mutate: (clone) => {
          const record = clone.iterations[0].candidateRecords[0];
          record.evaluatedDifferenceExpansion = [
            record.deltaUStableDiagnosticJ,
            wrapMainWirePassiveEquilibriumFloat64V2(0),
            wrapMainWirePassiveEquilibriumFloat64V2(0),
            wrapMainWirePassiveEquilibriumFloat64V2(0),
            wrapMainWirePassiveEquilibriumFloat64V2(0),
            wrapMainWirePassiveEquilibriumFloat64V2(0),
          ];
        },
      },
      {
        name: "reassociated-seven-term-comparison",
        mutate: (clone) => {
          const record = clone.iterations[0].candidateRecords[0];
          record.comparisonExpansion = [
            record.roundedV2ResidualJ,
            wrapMainWirePassiveEquilibriumFloat64V2(0),
            wrapMainWirePassiveEquilibriumFloat64V2(0),
            wrapMainWirePassiveEquilibriumFloat64V2(0),
            wrapMainWirePassiveEquilibriumFloat64V2(0),
            wrapMainWirePassiveEquilibriumFloat64V2(0),
            wrapMainWirePassiveEquilibriumFloat64V2(0),
          ];
        },
      },
      {
        name: "rhs-inserted-with-wrong-sign",
        mutate: (clone) => {
          const record = clone.iterations[0].candidateRecords[0];
          const wrong = evaluateMainWirePassiveEquilibriumArmijoExpansionV2({
            currentWallStoredEnergyJ: {
              LVFW: record.currentWallStoredEnergyJ.LVFW.value,
              SEP: record.currentWallStoredEnergyJ.SEP.value,
              RVFW: record.currentWallStoredEnergyJ.RVFW.value,
            },
            trialWallStoredEnergyJ: {
              LVFW: record.trialWallStoredEnergyJ.LVFW.value,
              SEP: record.trialWallStoredEnergyJ.SEP.value,
              RVFW: record.trialWallStoredEnergyJ.RVFW.value,
            },
            rhs: -record.rhs.value,
          });
          record.comparisonExpansion = wrong.comparisonExpansion;
          record.exactExpansionSign = wrong.exactExpansionSign;
          record.highestNonzeroComparisonExpansionIndex =
            wrong.highestNonzeroComparisonExpansionIndex;
          record.armijoSatisfied = wrong.exactExpansionSign <= 0;
        },
      },
    ];
    for (const substitution of substitutions) {
      const clone = structuredClone(envelope.stageResult) as any;
      substitution.mutate(clone);
      const audit = await auditMainWirePassiveEquilibriumManufacturedStageV2(
        await sealMainWirePassiveEquilibriumManufacturedStageV2(clone),
      );
      expect(audit.report.auditStatus, substitution.name).toBe("failed");
    }
  });

  it("uses retained H10 and closes non-descent/non-finite gDotD before line search", async () => {
    const asymmetric = solveMainWirePassiveEquilibriumManufacturedStageV2({
      stageIndex: 9,
      initialCoordinates: offsetCoordinates(1, 1),
      evaluateCandidate: constantCandidateEvaluator({
        gradient: [1, 1],
        hessian: [
          [2, 0.25],
          [0.5, 3],
        ],
        eigenvalues: [1.9692235935955849, 3.0307764064044154],
        force: 1,
        walls: [10, 20, 30],
      }),
    });
    const iteration = asymmetric.iterations[0];
    if (iteration.status !== "line-search-entered")
      throw new Error("expected line search");
    const h = [
      [2, 0.25],
      [0.5, 3],
    ] as const;
    const d = iteration.currentSolverEvidence.direction.map(
      (entry) => entry.value as number,
    );
    expect(
      iteration.currentSolverEvidence.hTimesDirectionPlusGradient[1].value,
    ).toBe(h[1][0] * d[0] + h[1][1] * d[1] + 1);
    expect(
      iteration.currentSolverEvidence.hTimesDirectionPlusGradient[1].value,
    ).not.toBe(h[0][1] * d[0] + h[1][1] * d[1] + 1);

    const nonDescent = solveMainWirePassiveEquilibriumManufacturedStageV2({
      stageIndex: 10,
      initialCoordinates: offsetCoordinates(1, 0),
      evaluateCandidate: constantCandidateEvaluator({
        gradient: [1, 0],
        hessian: [
          [-1, 0],
          [0, -1],
        ],
        eigenvalues: [1, 1],
        force: 1,
        walls: [10, 20, 30],
        strictLocalStabilityPassed: true,
      }),
    });
    expect(nonDescent).toMatchObject({
      status: "failed",
      failureReason: "newton-direction-not-descent",
      iterations: [
        {
          status: "line-search-not-entered",
          reason: "newton-direction-not-descent",
          directionFailureKind: "gdotd-non-negative",
          candidateRecords: [],
        },
      ],
    });

    const nonFiniteGDotD = solveMainWirePassiveEquilibriumManufacturedStageV2({
      stageIndex: 11,
      initialCoordinates: offsetCoordinates(1, 0),
      evaluateCandidate: constantCandidateEvaluator({
        gradient: [1e308, 1e308],
        hessian: [
          [1, 0],
          [0, 1],
        ],
        eigenvalues: [1, 1],
        force: 1e308,
        walls: [10, 20, 30],
      }),
    });
    expect(nonFiniteGDotD).toMatchObject({
      status: "failed",
      failureReason: "newton-direction-not-descent",
      iterations: [
        {
          status: "line-search-not-entered",
          reason: "newton-direction-not-descent",
          directionFailureKind: "gdotd-non-finite",
          candidateRecords: [],
        },
      ],
    });
    const nonFiniteAudit =
      await auditMainWirePassiveEquilibriumManufacturedStageV2(
        await sealMainWirePassiveEquilibriumManufacturedStageV2(nonFiniteGDotD),
      );
    expect(nonFiniteAudit.report.auditStatus).toBe("passed");
  });
});

function quadraticEvaluator(
  beforeEvaluation?: (
    coordinates: MainWirePassiveEquilibriumInternalCoordinatesV2,
  ) => void,
): MainWirePassiveEquilibriumManufacturedCandidateEvaluatorV2 {
  return (coordinates) => {
    beforeEvaluation?.(coordinates);
    const x =
      (coordinates.septalMidwallCapVolumeM3 -
        MANUFACTURED_ROOT.septalMidwallCapVolumeM3) /
      POLICY.coordinateScales.septalMidwallCapVolumeM3;
    const y =
      (coordinates.junctionRadiusM - MANUFACTURED_ROOT.junctionRadiusM) /
      POLICY.coordinateScales.junctionRadiusM;
    return candidateProjection(coordinates, {
      gradient: [x, y],
      force: Math.max(Math.abs(x), Math.abs(y)),
      hessian: [
        [1, 0],
        [0, 1],
      ],
      eigenvalues: [1, 1],
      walls: [100000000 + 0.5 * x * x, 1e16 + 0.5 * y * y, 1],
    });
  };
}

function wellConditionedEvaluator(): MainWirePassiveEquilibriumManufacturedCandidateEvaluatorV2 {
  return (coordinates) => {
    const x =
      (coordinates.septalMidwallCapVolumeM3 -
        MANUFACTURED_ROOT.septalMidwallCapVolumeM3) /
      POLICY.coordinateScales.septalMidwallCapVolumeM3;
    const y =
      (coordinates.junctionRadiusM - MANUFACTURED_ROOT.junctionRadiusM) /
      POLICY.coordinateScales.junctionRadiusM;
    return candidateProjection(coordinates, {
      gradient: [x, y],
      force: Math.max(Math.abs(x), Math.abs(y)),
      hessian: [
        [1, 0],
        [0, 1],
      ],
      eigenvalues: [1, 1],
      walls: [10 + 0.5 * x * x, 20 + 0.5 * y * y, 30],
    });
  };
}

function constantCandidateEvaluator(input: {
  gradient: readonly [number, number];
  hessian: readonly [readonly [number, number], readonly [number, number]];
  eigenvalues: readonly [number, number];
  force: number;
  walls: readonly [number, number, number];
  strictLocalStabilityPassed?: boolean;
}): MainWirePassiveEquilibriumManufacturedCandidateEvaluatorV2 {
  return (coordinates) => candidateProjection(coordinates, input);
}

function candidateProjection(
  coordinates: MainWirePassiveEquilibriumInternalCoordinatesV2,
  input: {
    gradient: readonly [number, number];
    hessian: readonly [readonly [number, number], readonly [number, number]];
    eigenvalues: readonly [number, number];
    force: number;
    walls: readonly [number, number, number];
    strictLocalStabilityPassed?: boolean;
  },
): MainWirePassiveEquilibriumStageCandidateProjectionV2 {
  const [LVFW, SEP, RVFW] = input.walls;
  return {
    internalCoordinates: { ...coordinates },
    wallStoredEnergyJ: { LVFW, SEP, RVFW },
    rawVentricularStoredEnergyJ: LVFW + SEP + RVFW,
    scaledGradient: input.gradient,
    scaledForceInfinityNorm: input.force,
    scaledInternalHessian: input.hessian,
    scaledInternalHessianEigenvaluesAscending: input.eigenvalues,
    strictLocalStabilityPassed: input.strictLocalStabilityPassed ?? true,
    junctionRadiusPassed:
      coordinates.junctionRadiusM > POLICY.minimumJunctionRadiusMExclusive,
  };
}

function offsetCoordinates(
  volumeScale: number,
  radiusScale: number,
): MainWirePassiveEquilibriumInternalCoordinatesV2 {
  return {
    septalMidwallCapVolumeM3:
      MANUFACTURED_ROOT.septalMidwallCapVolumeM3 +
      POLICY.coordinateScales.septalMidwallCapVolumeM3 * volumeScale,
    junctionRadiusM:
      MANUFACTURED_ROOT.junctionRadiusM +
      POLICY.coordinateScales.junctionRadiusM * radiusScale,
  };
}

function trialCoordinatesAtB(
  current: MainWirePassiveEquilibriumInternalCoordinatesV2,
  direction: readonly [number, number],
  b: number,
): MainWirePassiveEquilibriumInternalCoordinatesV2 {
  const alpha = 2 ** -b;
  return {
    septalMidwallCapVolumeM3:
      current.septalMidwallCapVolumeM3 +
      POLICY.coordinateScales.septalMidwallCapVolumeM3 * alpha * direction[0],
    junctionRadiusM:
      current.junctionRadiusM +
      POLICY.coordinateScales.junctionRadiusM * alpha * direction[1],
  };
}

function tinyDirectionEvaluator(
  initialVolume: number,
): MainWirePassiveEquilibriumManufacturedCandidateEvaluatorV2 {
  return (coordinates) => {
    const current =
      floatBits(coordinates.septalMidwallCapVolumeM3) ===
      floatBits(initialVolume);
    return candidateProjection(coordinates, {
      gradient: [0.001, 0],
      force: 0.001,
      hessian: [
        [1e308, 0],
        [0, 1],
      ],
      eigenvalues: [1, 1e308],
      walls: current ? [10, 20, 30] : [9, 20, 30],
    });
  };
}

function linearDecreasingEvaluator(): MainWirePassiveEquilibriumManufacturedCandidateEvaluatorV2 {
  return (coordinates) =>
    candidateProjection(coordinates, {
      gradient: [1, 0],
      force: 1,
      hessian: [
        [1, 0],
        [0, 1],
      ],
      eigenvalues: [1, 1],
      walls: [1000 + coordinates.septalMidwallCapVolumeM3 * 1e6, 2000, 3000],
    });
}

function mutableCandidate(
  coordinates: MainWirePassiveEquilibriumInternalCoordinatesV2,
  lvfw: number,
  force: number,
): any {
  return {
    internalCoordinates: { ...coordinates },
    wallStoredEnergyJ: { LVFW: lvfw, SEP: 20, RVFW: 30 },
    rawVentricularStoredEnergyJ: lvfw + 20 + 30,
    scaledGradient: [force, 0],
    scaledForceInfinityNorm: force,
    scaledInternalHessian: [
      [1, 0],
      [0, 1],
    ],
    scaledInternalHessianEigenvaluesAscending: [1, 1],
    strictLocalStabilityPassed: true,
    junctionRadiusPassed: true,
  };
}

function setMutableCandidate(
  candidate: any,
  lvfw: number,
  force: number,
): void {
  candidate.wallStoredEnergyJ.LVFW = lvfw;
  candidate.rawVentricularStoredEnergyJ = lvfw + 20 + 30;
  candidate.scaledGradient[0] = force;
  candidate.scaledForceInfinityNorm = force;
}

function sameCoordinateBits(
  left: MainWirePassiveEquilibriumInternalCoordinatesV2,
  right: MainWirePassiveEquilibriumInternalCoordinatesV2,
): boolean {
  return (
    floatBits(left.septalMidwallCapVolumeM3) ===
      floatBits(right.septalMidwallCapVolumeM3) &&
    floatBits(left.junctionRadiusM) === floatBits(right.junctionRadiusM)
  );
}

function finiteValues(
  values: readonly { value: number | null; classification: string }[],
): number[] {
  return values.map((entry) => {
    if (entry.classification !== "finite" || entry.value === null)
      throw new Error("fixture expected finite expansion");
    return entry.value;
  });
}

function exactBinarySumKey(values: readonly number[]): string {
  const terms = values
    .map(exactBinaryTerm)
    .filter((term) => term.integer !== 0n);
  if (terms.length === 0) return "0@0";
  const minimumExponent = Math.min(...terms.map((term) => term.exponent));
  let integer = terms.reduce(
    (sum, term) =>
      sum + (term.integer << BigInt(term.exponent - minimumExponent)),
    0n,
  );
  let exponent = minimumExponent;
  while (integer !== 0n && integer % 2n === 0n) {
    integer /= 2n;
    exponent += 1;
  }
  return `${integer}@${exponent}`;
}

function exactBinaryTerm(value: number): Readonly<{
  integer: bigint;
  exponent: number;
}> {
  if (!Number.isFinite(value)) throw new Error("exact oracle requires finite");
  const bits = BigInt(`0x${floatBits(value)}`);
  const negative = bits >> 63n === 1n;
  const exponentBits = Number((bits >> 52n) & 0x7ffn);
  const fraction = bits & 0x000fffffffffffffn;
  if (exponentBits === 0)
    return {
      integer: negative ? -fraction : fraction,
      exponent: -1074,
    };
  const mantissa = 0x0010000000000000n + fraction;
  return {
    integer: negative ? -mantissa : mantissa,
    exponent: exponentBits - 1023 - 52,
  };
}

function floatBits(value: number): string {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, false);
  return view.getBigUint64(0, false).toString(16).padStart(16, "0");
}

function nextUp(value: number): number {
  if (!Number.isFinite(value)) return value;
  if (Object.is(value, -0)) return Number.MIN_VALUE;
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, false);
  let bits = view.getBigUint64(0, false);
  bits = value >= 0 ? bits + 1n : bits - 1n;
  view.setBigUint64(0, bits, false);
  return view.getFloat64(0, false);
}

function nextDown(value: number): number {
  if (!Number.isFinite(value)) return value;
  if (Object.is(value, 0)) return -Number.MIN_VALUE;
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, false);
  let bits = view.getBigUint64(0, false);
  bits = value > 0 ? bits - 1n : bits + 1n;
  view.setBigUint64(0, bits, false);
  return view.getFloat64(0, false);
}
