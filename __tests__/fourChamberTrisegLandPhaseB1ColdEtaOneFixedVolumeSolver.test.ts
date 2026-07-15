import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_V1_ID,
  PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_POLICY_V1,
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
  createPhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
  runPhaseB1ProjectSyntheticColdInitializationV1,
  type PhaseB1ColdEtaOneFixedVolumeRootCensusV1,
  type PhaseB1ColdEtaOneFixedVolumeSolveInputV1,
  type PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
  type PhaseB1ColdNodeSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  BLOOD_COMPARTMENT_IDS,
  type BloodCompartmentId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

const PERIMETER_LOADS = Object.freeze([
  Object.freeze({ nodeId: "SW", LV: 0.99, RV: 0.99 }),
  Object.freeze({ nodeId: "W", LV: 0.99, RV: 1 }),
  Object.freeze({ nodeId: "NW", LV: 0.99, RV: 1.01 }),
  Object.freeze({ nodeId: "N", LV: 1, RV: 1.01 }),
  Object.freeze({ nodeId: "NE", LV: 1.01, RV: 1.01 }),
  Object.freeze({ nodeId: "E", LV: 1.01, RV: 1 }),
  Object.freeze({ nodeId: "SE", LV: 1.01, RV: 0.99 }),
  Object.freeze({ nodeId: "S", LV: 1, RV: 0.99 }),
] as const);

describe("Phase B1 eta-one fixed-volume cold solver session", () => {
  it.each(["on", "off"] as const)(
    "preserves the canonical SLS-%s node and directly solves the closed-ledger perimeter",
    (slsMode) => {
      const cold = runPhaseB1ProjectSyntheticColdInitializationV1(slsMode, sha256);
      const canonicalPath = cold.canonicalForwardPath;
      expect(canonicalPath?.completed).toBe(true);
      if (canonicalPath?.completed !== true) return;
      const center = canonicalPath.endpoint;
      const session = createPhaseB1ColdEtaOneFixedVolumeSolverSessionV1(
        slsMode,
        sha256,
      );

      expect(Object.isFrozen(session)).toBe(true);
      expect(Object.isFrozen(session.anchorFixedInputs)).toBe(true);
      expect(Object.isFrozen(session.anchorFixedInputs.bloodVolumesM3)).toBe(true);
      expect(Object.isFrozen(session.anchorFixedInputs.inertialFlowsM3PerSec)).toBe(true);
      expect(Object.isFrozen(session.anchorFixedInputs.calciumByWall)).toBe(true);
      expect(Object.values(session.anchorFixedInputs.calciumByWall).every(
        (state) => Object.isFrozen(state),
      )).toBe(true);
      expect(session.solverId)
        .toBe(PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_V1_ID);
      expect(Object.isFrozen(PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_POLICY_V1))
        .toBe(true);
      expect(PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_POLICY_V1).toMatchObject({
        eta: 1,
        timeSec: 0,
        totalBloodVolumeRelativeTolerance: 4096 * Number.EPSILON,
        callerMayChangeInertialFlows: false,
        callerMayChangePrescribedCalcium: false,
        restoringBranchSolveOnly: true,
        publicNonRestoringSolveExposed: false,
      });
      expect(session.layout).toEqual(cold.layout);
      expect(session.anchorFixedInputs.timeSec).toBe(0);
      expect(session.anchorFixedInputs.bloodVolumesM3)
        .toEqual(center.endpoint.differentialState.bloodVolumesM3);
      expect(session.anchorFixedInputs.inertialFlowsM3PerSec)
        .toEqual(center.endpoint.differentialState.inertialFlowsM3PerSec);
      expect(session.anchorFixedInputs.calciumByWall)
        .toEqual(center.endpoint.differentialState.calciumByWall);
      expect(session.anchorFixedInputs.totalBloodVolumeM3).toBe(
        totalBloodVolumeM3(session.anchorFixedInputs.bloodVolumesM3),
      );

      const canonicalResolve = requireConverged(session.solveRestoringNodeAtVolumes({
        bloodVolumesM3: session.anchorFixedInputs.bloodVolumesM3,
        initialUnknowns: center.unknowns,
      }), "C");
      expect(canonicalResolve.unknowns).toEqual(center.unknowns);
      expect(canonicalResolve.endpoint).toEqual(center.endpoint);
      expect(canonicalResolve.eta).toBe(1);
      const canonicalResidual = session.evaluateResidualVectorAtVolumes({
        bloodVolumesM3: session.anchorFixedInputs.bloodVolumesM3,
        unknowns: center.unknowns,
      });
      expect(Object.isFrozen(canonicalResidual)).toBe(true);
      expect(canonicalResidual).toEqual(center.residualEvaluation.residual);

      const analyticSeed = session.buildAnalyticSeedAtVolumes({
        bloodVolumesM3: session.anchorFixedInputs.bloodVolumesM3,
        triSegCoordinates: center.endpoint.triSegCoordinates,
      });
      expect(Object.isFrozen(analyticSeed)).toBe(true);
      expect(analyticSeed).toHaveLength(session.layout.unknownCount);

      const declaredCensus = session.runDeclaredRootCensusAtVolumes({
        bloodVolumesM3: session.anchorFixedInputs.bloodVolumesM3,
        seedOrder: "declared",
      });
      const reverseCensus = session.runDeclaredRootCensusAtVolumes({
        bloodVolumesM3: session.anchorFixedInputs.bloodVolumesM3,
        seedOrder: "reverse",
      });
      for (const census of [declaredCensus, reverseCensus]) {
        expect(census.eta).toBe(1);
        expect(census.results).toHaveLength(3);
        expect(census.results.every((result) => result.eta === 1)).toBe(true);
        expect(census.allSeedsAttempted).toBe(true);
        expect(census.allSeedsConverged).toBe(true);
        expect(census.enumerationCompleted).toBe(true);
        expect(census.convergedResultsPartitionedExactlyOnce).toBe(true);
        expect(census.allClusterMembersWithinFullVectorTolerance).toBe(true);
        expect(census.allClusterMemberClassificationsMatch).toBe(true);
        expect(census.clusters.every((cluster) =>
          cluster.memberFullVectorDistancePass
          && cluster.memberClassificationMatches)).toBe(true);
        expect(census.selectionInputToAcceptedPath).toBe(false);
        expect(census.globalExhaustivenessClaimed).toBe(false);
        expect(census.allDiscoveredRootsReported).toBe(true);
        expect(Object.isFrozen(census)).toBe(true);
        expect(Object.isFrozen(census.results)).toBe(true);
        expect(Object.isFrozen(census.clusters)).toBe(true);
      }
      expect(reverseCensus.seeds).toEqual([...declaredCensus.seeds].reverse());
      expectCensusClusterSetsNear(
        declaredCensus,
        reverseCensus,
        session.layout.unknownScales,
      );

      const metrics = PERIMETER_LOADS.map((load) => {
        const bloodVolumesM3 = closedLedgerVolumes(
          session.anchorFixedInputs.bloodVolumesM3,
          load.LV,
          load.RV,
        );
        const node = requireConverged(session.solveRestoringNodeAtVolumes({
          bloodVolumesM3,
          initialUnknowns: center.unknowns,
        }), load.nodeId);
        const endpoint = node.endpoint;
        expect(endpoint.timeSec).toBe(0);
        expect(endpoint.differentialState.bloodVolumesM3).toEqual(bloodVolumesM3);
        expect(endpoint.differentialState.inertialFlowsM3PerSec)
          .toEqual(session.anchorFixedInputs.inertialFlowsM3PerSec);
        expect(endpoint.differentialState.calciumByWall)
          .toEqual(session.anchorFixedInputs.calciumByWall);
        expect(node.eta).toBe(1);
        expect(node.effectiveTriSegAudit.accepted).toBe(true);
        expect(node.effectiveTriSegAudit.classification).toBe("robust-restoring");
        expect(node.scaledResidualInfinityNorm).toBeLessThanOrEqual(
          PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
            .maximumScaledColdResidualInfinityNorm,
        );
        expect(node.minimumLandSimplexMargin).toBeGreaterThan(0);
        expect(relativeTotalDifference(
          bloodVolumesM3,
          session.anchorFixedInputs.bloodVolumesM3,
        )).toBeLessThanOrEqual(4096 * Number.EPSILON);
        expect(bloodVolumesM3.LA).toBe(session.anchorFixedInputs.bloodVolumesM3.LA);
        expect(bloodVolumesM3.RA).toBe(session.anchorFixedInputs.bloodVolumesM3.RA);
        expect(bloodVolumesM3.SA).toBe(session.anchorFixedInputs.bloodVolumesM3.SA);
        expect(bloodVolumesM3.PA).toBe(session.anchorFixedInputs.bloodVolumesM3.PA);
        expect(bloodVolumesM3.PV).toBe(
          session.anchorFixedInputs.bloodVolumesM3.PV
            - (bloodVolumesM3.LV - session.anchorFixedInputs.bloodVolumesM3.LV),
        );
        expect(bloodVolumesM3.SV).toBe(
          session.anchorFixedInputs.bloodVolumesM3.SV
            - (bloodVolumesM3.RV - session.anchorFixedInputs.bloodVolumesM3.RV),
        );
        return Object.freeze({
          nodeId: load.nodeId,
          residual: node.scaledResidualInfinityNorm,
          simplex: node.minimumLandSimplexMargin,
          sigma: node.effectiveTriSegAudit.sigmaMinimum,
          condition: node.effectiveTriSegAudit.conditionNumber2,
          restoringMargin: node.effectiveTriSegAudit.robustSignedMargin,
          schurDifference:
            node.effectiveTriSegAudit.schurToReequilibratedDifferenceTwoNorm,
        });
      });
      expect(metrics).toHaveLength(8);
    },
  );

  it("rejects mutation and malformed or non-conservative volume records", () => {
    const session = createPhaseB1ColdEtaOneFixedVolumeSolverSessionV1("on", sha256);
    const anchor = session.anchorFixedInputs.bloodVolumesM3;
    expect(Reflect.set(anchor, "LV", anchor.LV * 1.01)).toBe(false);

    const extraKey = { ...anchor, EXTRA: 1 } as unknown as Readonly<
      Record<BloodCompartmentId, number>
    >;
    expect(() => session.buildAnalyticSeedAtVolumes({
      bloodVolumesM3: extraKey,
      triSegCoordinates: { V_m_S: 0, y_m: 0.03 },
    })).toThrow(/exactly/);

    const missingKey = Object.fromEntries(
      BLOOD_COMPARTMENT_IDS.filter((key) => key !== "PV")
        .map((key) => [key, anchor[key]]),
    ) as Readonly<Record<BloodCompartmentId, number>>;
    expect(() => session.buildAnalyticSeedAtVolumes({
      bloodVolumesM3: missingKey,
      triSegCoordinates: { V_m_S: 0, y_m: 0.03 },
    })).toThrow(/exactly/);

    const negative = { ...anchor, LV: -anchor.LV };
    expect(() => session.buildAnalyticSeedAtVolumes({
      bloodVolumesM3: negative,
      triSegCoordinates: { V_m_S: 0, y_m: 0.03 },
    })).toThrow(/must be positive and finite/);

    const massDrift = { ...anchor, LV: anchor.LV * 1.01 };
    expect(() => session.buildAnalyticSeedAtVolumes({
      bloodVolumesM3: massDrift,
      triSegCoordinates: { V_m_S: 0, y_m: 0.03 },
    })).toThrow(/preserve anchor total blood volume/);

    const accessor = { ...anchor };
    Object.defineProperty(accessor, "LV", {
      enumerable: true,
      configurable: true,
      get: () => anchor.LV,
    });
    expect(() => session.buildAnalyticSeedAtVolumes({
      bloodVolumesM3: accessor,
      triSegCoordinates: { V_m_S: 0, y_m: 0.03 },
    })).toThrow(/enumerable data property/);
  });

  it("rejects undeclared controls and malformed solve or residual vectors", () => {
    const cold = runPhaseB1ProjectSyntheticColdInitializationV1("on", sha256);
    const canonicalPath = cold.canonicalForwardPath;
    expect(canonicalPath?.completed).toBe(true);
    if (canonicalPath?.completed !== true) return;
    const session = createPhaseB1ColdEtaOneFixedVolumeSolverSessionV1("on", sha256);
    const validUnknowns = [...canonicalPath.endpoint.unknowns];
    const base = Object.freeze({
      bloodVolumesM3: session.anchorFixedInputs.bloodVolumesM3,
      initialUnknowns: validUnknowns,
    });
    for (const undeclared of [
      { eta: 0 },
      { timeSec: 1 },
      { inertialFlowsM3PerSec: session.anchorFixedInputs.inertialFlowsM3PerSec },
      { calciumByWall: session.anchorFixedInputs.calciumByWall },
      { requireRestoring: false },
    ]) {
      expect(() => session.solveRestoringNodeAtVolumes(
        { ...base, ...undeclared } as unknown as PhaseB1ColdEtaOneFixedVolumeSolveInputV1,
      )).toThrow(/exactly/);
    }

    const sparse = new Array<number>(session.layout.unknownCount);
    expectInvalidSolveUnknowns(session, sparse, /dense/);
    expectInvalidSolveUnknowns(session, validUnknowns.slice(1), /length/);

    const extraString = [...validUnknowns];
    Object.defineProperty(extraString, "extra", {
      value: 1,
      enumerable: true,
    });
    expectInvalidSolveUnknowns(session, extraString, /extra properties/);

    const extraSymbol = [...validUnknowns];
    Object.defineProperty(extraSymbol, Symbol("extra"), {
      value: 1,
      enumerable: true,
    });
    expectInvalidSolveUnknowns(session, extraSymbol, /symbol properties/);

    const notFinite = [...validUnknowns];
    notFinite[0] = Number.NaN;
    expectInvalidSolveUnknowns(session, notFinite, /must be finite/);

    const typed = new Float64Array(validUnknowns) as unknown as readonly number[];
    expectInvalidSolveUnknowns(session, typed, /plain array/);

    expect(() => session.evaluateResidualVectorAtVolumes({
      bloodVolumesM3: session.anchorFixedInputs.bloodVolumesM3,
      unknowns: sparse,
    })).toThrow(/dense/);
    expect(() => session.evaluateResidualVectorAtVolumes({
      bloodVolumesM3: session.anchorFixedInputs.bloodVolumesM3,
      unknowns: notFinite,
    })).toThrow(/must be finite/);
    expect(() => session.evaluateResidualVectorAtVolumes({
      bloodVolumesM3: session.anchorFixedInputs.bloodVolumesM3,
      unknowns: typed,
    })).toThrow(/plain array/);

    const calcium = session.anchorFixedInputs.calciumByWall.LA;
    expect(Reflect.set(calcium, "r", 1)).toBe(false);
  });
});

function closedLedgerVolumes(
  anchor: Readonly<Record<BloodCompartmentId, number>>,
  leftMultiplier: 0.99 | 1 | 1.01,
  rightMultiplier: 0.99 | 1 | 1.01,
): Readonly<Record<BloodCompartmentId, number>> {
  const LV = anchor.LV * leftMultiplier;
  const RV = anchor.RV * rightMultiplier;
  return Object.freeze({
    ...anchor,
    LV,
    RV,
    PV: anchor.PV - (LV - anchor.LV),
    SV: anchor.SV - (RV - anchor.RV),
  });
}

function requireConverged(
  result: ReturnType<
    ReturnType<typeof createPhaseB1ColdEtaOneFixedVolumeSolverSessionV1>["solveRestoringNodeAtVolumes"]
  >,
  nodeId: string,
): PhaseB1ColdNodeSuccessV1 {
  const diagnostic = result.converged === false
    ? { nodeId, reason: result.reason, message: result.message }
    : { nodeId };
  expect(
    result.converged,
    JSON.stringify(diagnostic),
  ).toBe(true);
  if (result.converged === false) {
    throw new Error(`eta-one fixed-volume node ${nodeId} did not converge`);
  }
  return result;
}

function expectInvalidSolveUnknowns(
  session: PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
  initialUnknowns: readonly number[],
  message: RegExp,
): void {
  expect(() => session.solveRestoringNodeAtVolumes({
    bloodVolumesM3: session.anchorFixedInputs.bloodVolumesM3,
    initialUnknowns,
  })).toThrow(message);
}

function expectCensusClusterSetsNear(
  declared: PhaseB1ColdEtaOneFixedVolumeRootCensusV1,
  reverse: PhaseB1ColdEtaOneFixedVolumeRootCensusV1,
  scales: readonly number[],
): void {
  expect(reverse.clusters).toHaveLength(declared.clusters.length);
  const consumedReverseClusterIndices = new Set<number>();
  for (const cluster of declared.clusters) {
    const representative = declared.results[cluster.representativeResultIndex];
    expect(representative?.converged).toBe(true);
    if (representative?.converged !== true) continue;
    const matches = reverse.clusters.flatMap((candidate, candidateIndex) => {
      const candidateRepresentative =
        reverse.results[candidate.representativeResultIndex];
      const matchesCluster = candidateRepresentative?.converged === true
        && candidate.classification === cluster.classification
        && scaledInfinityDistance(
          representative.unknowns,
          candidateRepresentative.unknowns,
          scales,
        ) <= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
          .rootClusteringScaledInfinityTolerance;
      return matchesCluster ? [candidateIndex] : [];
    });
    expect(matches).toHaveLength(1);
    expect(consumedReverseClusterIndices.has(matches[0])).toBe(false);
    consumedReverseClusterIndices.add(matches[0]);
  }
  expect(consumedReverseClusterIndices.size).toBe(reverse.clusters.length);
}

function scaledInfinityDistance(
  left: readonly number[],
  right: readonly number[],
  scales: readonly number[],
): number {
  expect(left).toHaveLength(right.length);
  expect(left).toHaveLength(scales.length);
  return Math.max(...left.map((value, index) =>
    Math.abs(value - right[index]) / scales[index]));
}

function relativeTotalDifference(
  actual: Readonly<Record<BloodCompartmentId, number>>,
  anchor: Readonly<Record<BloodCompartmentId, number>>,
): number {
  return Math.abs(totalBloodVolumeM3(actual) - totalBloodVolumeM3(anchor))
    / totalBloodVolumeM3(anchor);
}

function totalBloodVolumeM3(
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>,
): number {
  return BLOOD_COMPARTMENT_IDS.reduce(
    (total, compartmentId) => total + bloodVolumesM3[compartmentId],
    0,
  );
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
