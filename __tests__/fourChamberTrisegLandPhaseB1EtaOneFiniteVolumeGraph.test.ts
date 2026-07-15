import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  runPhaseB0TriSegFiniteSupportedEnvelopeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeV1";
import {
  bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeV1";
import {
  stitchPhaseB0CenterBridgeToPhaseB1EtaOneMaterialBranchV1,
  type PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchV1";
import {
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1,
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NODES_V1,
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1,
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_V1_ID,
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
  runPhaseB1EtaOneLandCoupledFiniteVolumeGraphV1,
  type PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1,
  type PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphV1";
import {
  runPhaseB1ProjectSyntheticColdInitializationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  BLOOD_COMPARTMENT_IDS,
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

const B0_NUMERICAL_EVIDENCE_SHA256 =
  "1832e54d6b2d8e91707dff7af71553620950c942c970e00968a39219eedbf9c1";

type Fixture = Readonly<{
  stitch: PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1;
  graph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1;
}>;

const fixtures = new Map<"on" | "off", Fixture>();

describe("Phase B1 eta-one Land-coupled finite-volume graph", () => {
  it.each(["on", "off"] as const)(
    "establishes the finite nine-node, thirty-two-path SLS-%s graph",
    (slsMode) => {
      const fixture = buildFixture(slsMode);
      fixtures.set(slsMode, fixture);
      const { stitch, graph } = fixture;
      const policy = PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1;

      expect(graph.graphId)
        .toBe(PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_V1_ID);
      expect(graph.slsMode).toBe(slsMode);
      expect(graph.phaseB1LandCoupledFiniteVolumeGraphPass).toBe(true);
      expect(() =>
        assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1(graph)
      ).not.toThrow();
      expect(graph.canonicalNodes).toHaveLength(9);
      expect(graph.directedEdges).toHaveLength(32);
      expect(graph.roundTripAudits).toHaveLength(16);
      expect(graph.rootCensus).toHaveLength(9);
      expect(PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NODES_V1)
        .toEqual([
          { nodeId: "C", leftVentricularVolumeMultiplier: 1, rightVentricularVolumeMultiplier: 1 },
          { nodeId: "SW", leftVentricularVolumeMultiplier: 0.99, rightVentricularVolumeMultiplier: 0.99 },
          { nodeId: "W", leftVentricularVolumeMultiplier: 0.99, rightVentricularVolumeMultiplier: 1 },
          { nodeId: "NW", leftVentricularVolumeMultiplier: 0.99, rightVentricularVolumeMultiplier: 1.01 },
          { nodeId: "N", leftVentricularVolumeMultiplier: 1, rightVentricularVolumeMultiplier: 1.01 },
          { nodeId: "NE", leftVentricularVolumeMultiplier: 1.01, rightVentricularVolumeMultiplier: 1.01 },
          { nodeId: "E", leftVentricularVolumeMultiplier: 1.01, rightVentricularVolumeMultiplier: 1 },
          { nodeId: "SE", leftVentricularVolumeMultiplier: 1.01, rightVentricularVolumeMultiplier: 0.99 },
          { nodeId: "S", leftVentricularVolumeMultiplier: 1, rightVentricularVolumeMultiplier: 0.99 },
        ]);
      expect(PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1)
        .toHaveLength(16);
      expect(PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1
        .filter((edge) => edge.edgeClass === "center-spoke")).toHaveLength(8);
      expect(PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1
        .filter((edge) => edge.edgeClass === "perimeter")).toHaveLength(8);

      const canonicalById = new Map(graph.canonicalNodes.map((audit) => [
        audit.nodeId,
        audit.node,
      ] as const));
      const center = graph.canonicalNodes.find((audit) => audit.nodeId === "C");
      expect(center).toBeDefined();
      expect(Object.is(center?.node, stitch.etaOne.node)).toBe(true);
      expect(graph.centerReplayAudit).toMatchObject({
        centerNodePreservedByObjectIdentity: true,
        maximumAbsoluteResidualReplayDifference: 0,
        pass: true,
      });
      expect(graph.centerReplayAudit.replayedResidual)
        .toEqual(stitch.etaOne.node.residualEvaluation.residual);

      for (const audit of graph.canonicalNodes) {
        expect(audit.ledger.accepted).toBe(true);
        expect(audit.ledger.allVolumesPositive).toBe(true);
        expect(audit.ledger.unchangedCompartmentsExact).toBe(true);
        expect(audit.ledger.complementLedgerExact).toBe(true);
        expect(audit.ledger.relativeTotalBloodVolumeDifference)
          .toBeLessThanOrEqual(policy.gates.totalBloodVolumeRelativeTolerance);
        expect(BLOOD_COMPARTMENT_IDS.every((id) =>
          Number.isFinite(audit.ledger.bloodVolumesM3[id])
          && audit.ledger.bloodVolumesM3[id] > 0)).toBe(true);
        expect(audit.etaOneExact).toBe(true);
        expect(audit.fixedStateExact).toBe(true);
        expect(audit.node.endpoint.differentialState.slsMode).toBe(slsMode);
        expect(audit.thresholdMetricsFinite).toBe(true);
        expect(audit.thresholdNormMetricsNonnegative).toBe(true);
        expect(audit.effectiveTriSegRestoringPass).toBe(true);
        expect(audit.node.effectiveTriSegAudit.classification)
          .toBe("robust-restoring");
        expect(audit.node.effectiveTriSegAudit.withinPublishedTaylorTwoPercentTensionErrorDomain)
          .toBe(true);
        expect(audit.landIdentityAudit.pass).toBe(true);
        expect(audit.landIdentityAudit.maximumAssembledToRawLandActiveDifferencePa)
          .toBeLessThanOrEqual(
            policy.gates.maximumAssembledToRawLandActiveDifferencePa,
          );
        expect(WALL_IDS.every((wallId) => {
          const wall = audit.landIdentityAudit.wallByWall[wallId];
          return Number.isFinite(wall.rawLandActiveStressPa)
            && Number.isFinite(wall.assembledActiveStressPa)
            && wall.absoluteDifferencePa
              <= policy.gates.maximumAssembledToRawLandActiveDifferencePa;
        })).toBe(true);
        expect(audit.prohibitedOperationsAbsent).toBe(true);
        expect(audit.hardGatePass).toBe(true);
        expect(audit.fiftyPercentGuardPass).toBe(true);
      }
      expect(graph.allCanonicalNodesFiftyPercentGuardPass).toBe(true);

      for (const edge of PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1) {
        const matching = graph.directedEdges.filter((audit) =>
          audit.edgeId === edge.edgeId);
        expect(matching).toHaveLength(2);
        expect(matching.map((audit) => audit.direction).sort())
          .toEqual(["forward", "reverse"]);
        expect(matching.every((audit) =>
          audit.pathRole === "canonical-source-directed")).toBe(true);
      }
      for (const edge of graph.directedEdges) {
        expectCanonicalDirectedPath(edge, canonicalById);
      }
      expect(graph.directedEdges.every((edge) =>
        edge.selectedRefinementFactor === 2
        || edge.selectedRefinementFactor === 4
        || edge.selectedRefinementFactor === 8)).toBe(true);
      expect(graph.maximumDestinationAgreementScaledInfinityNorm)
        .toBeLessThanOrEqual(policy.gates.endpointAgreementScaledInfinityTolerance);

      for (const roundTrip of graph.roundTripAudits) {
        expect(roundTrip.pathRole).toBe("forward-endpoint-roundtrip");
        expect(roundTrip.direction).toBe("reverse");
        expect(roundTrip.accepted).toBe(true);
        expect(roundTrip.selectionRuleAuditPass).toBe(true);
        expect([2, 4, 8]).toContain(roundTrip.selectedRefinementFactor);
        const forward = graph.directedEdges.find((edge) =>
          edge.edgeId === roundTrip.edgeId && edge.direction === "forward");
        expect(forward).toBeDefined();
        const forwardEndpoint = selectedEndpoint(forward!);
        const roundTripSource = firstPathNode(roundTrip);
        expect(Object.is(roundTripSource, forwardEndpoint)).toBe(true);
        expectCanonicalDirectedPath(
          roundTrip,
          new Map([[roundTrip.sourceNodeId, forwardEndpoint]]),
        );
      }
      const selectionHistogram = [...graph.directedEdges, ...graph.roundTripAudits]
        .reduce((counts, edge) => {
          if (edge.selectedRefinementFactor !== null) {
            counts[edge.selectedRefinementFactor] += 1;
          }
          return counts;
        }, { 2: 0, 4: 0, 8: 0 });
      expect(selectionHistogram).toEqual(slsMode === "on"
        ? { 2: 48, 4: 0, 8: 0 }
        : { 2: 38, 4: 9, 8: 1 });
      expect(graph.maximumRoundTripClosureScaledInfinityNorm)
        .toBeLessThanOrEqual(policy.gates.reverseClosureScaledInfinityTolerance);

      for (const census of graph.rootCensus) {
        expect(census.declared.seedOrder).toBe("declared");
        expect(census.reverse.seedOrder).toBe("reverse");
        expect(census.declared.seeds).toHaveLength(3);
        expect(census.reverse.seeds)
          .toEqual([...census.declared.seeds].reverse());
        expect(census.declared.results).toHaveLength(3);
        expect(census.reverse.results).toHaveLength(3);
        expect(census.declaredInventoryPass).toBe(true);
        expect(census.reverseInventoryPass).toBe(true);
        expect(census.clusterSetsBijective).toBe(true);
        expect(census.declaredTrackedRestoringClusterCount).toBe(1);
        expect(census.reverseTrackedRestoringClusterCount).toBe(1);
        expect(census.trackedCanonicalMatchesExactlyOneRestoringCluster)
          .toBe(true);
        expect(census.declared.selectionInputToAcceptedPath).toBe(false);
        expect(census.reverse.selectionInputToAcceptedPath).toBe(false);
        expect(census.declared.globalExhaustivenessClaimed).toBe(false);
        expect(census.reverse.globalExhaustivenessClaimed).toBe(false);
        expect(census.pass).toBe(true);
      }

      expect(graph.routeScope).toEqual({
        triangleAndPerimeterChainedRouteRerunsIncluded: false,
        exclusionReason:
          "v1-claims-only-nine-finite-nodes-and-thirty-two-canonical-source-directed-edges",
        perEdgeForwardReverseClosureAuditedSeparately: true,
      });
      expect([
        graph.phaseB1LandCoupledVolumeEnvelopePass,
        graph.continuousVolumeIntervalRegularityPass,
        graph.globalRootUniquenessPass,
        graph.globalRootExhaustivenessPass,
        graph.energeticStabilityPass,
        graph.physiologicalInitializationPass,
        graph.closedLoopStationarityPass,
        graph.acceptedPhaseB1ReferenceBranchPass,
        graph.fullBeatAcceptancePass,
        graph.physiologicalValidationPass,
        graph.phaseB1AcceptancePass,
        graph.supportedEnvelopePass,
        graph.releaseRuntimePass,
        graph.pureCoreParentEvidenceAuthenticationClaimed,
        graph.modelCoreIntegration,
        graph.browserRuntimeAdopted,
        graph.releaseRuntimeReachable,
      ].every((claim) => claim === false)).toBe(true);
      expect(graph.parentStitchObjectConsumed).toBe(true);
      expect(graph.testOnly).toBe(true);

      expect(Object.isFrozen(graph)).toBe(true);
      expect(Object.isFrozen(graph.canonicalNodes)).toBe(true);
      expect(Object.isFrozen(graph.directedEdges)).toBe(true);
      expect(Object.isFrozen(graph.roundTripAudits)).toBe(true);
      expect(Object.isFrozen(graph.rootCensus)).toBe(true);
      expect(Object.isFrozen(graph.centerReplayAudit)).toBe(true);
      expect(Object.isFrozen(graph.centerReplayAudit.replayedResidual)).toBe(true);
      expect(graph.canonicalNodes.every((audit) => Object.isFrozen(audit)
        && Object.isFrozen(audit.ledger)
        && Object.isFrozen(audit.ledger.bloodVolumesM3))).toBe(true);
      expect([...graph.directedEdges, ...graph.roundTripAudits].every((edge) =>
        Object.isFrozen(edge)
        && Object.isFrozen(edge.attempts)
        && edge.attempts.every((attempt) => Object.isFrozen(attempt)
          && Object.isFrozen(attempt.nodeAudits)))).toBe(true);
    },
    300_000,
  );

  it("fails closed before computation for an already-promoted parent claim", () => {
    const fixture = fixtures.get("on") ?? buildFixture("on");
    const promoted = Object.freeze({
      ...fixture.stitch,
      phaseB1LandCoupledFiniteVolumeGraphPass: true,
    }) as unknown as PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1;
    expect(() => runPhaseB1EtaOneLandCoupledFiniteVolumeGraphV1(
      promoted,
      sha256,
    )).toThrow(/exact unpromoted eta-one stitch/);
  });

  it("brands only live canonical graph results and rejects frozen copies", () => {
    const { graph } = fixtures.get("on") ?? buildFixture("on");
    expect(() =>
      assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1(graph)
    ).not.toThrow();

    const topLevelCopy = Object.freeze({ ...graph });
    const firstAudit = graph.canonicalNodes[0];
    const nestedWidenedAudit = Object.freeze({
      ...firstAudit,
      unexpectedPromotedClaim: true,
    });
    const nestedWidenedCopy = Object.freeze({
      ...graph,
      canonicalNodes: Object.freeze([
        nestedWidenedAudit,
        ...graph.canonicalNodes.slice(1),
      ]),
    });

    const nestedAccessorAudit = { ...firstAudit };
    Object.defineProperty(nestedAccessorAudit, "nodeId", {
      enumerable: true,
      configurable: true,
      get: () => firstAudit.nodeId,
    });
    const nestedAccessorCopy = Object.freeze({
      ...graph,
      canonicalNodes: Object.freeze([
        Object.freeze(nestedAccessorAudit),
        ...graph.canonicalNodes.slice(1),
      ]),
    });

    const nestedSymbolNodes = [...graph.canonicalNodes];
    Object.defineProperty(nestedSymbolNodes, Symbol("unexpected"), {
      enumerable: true,
      configurable: false,
      writable: false,
      value: true,
    });
    const nestedSymbolCopy = Object.freeze({
      ...graph,
      canonicalNodes: Object.freeze(nestedSymbolNodes),
    });

    for (const copied of [
      topLevelCopy,
      nestedWidenedCopy,
      nestedAccessorCopy,
      nestedSymbolCopy,
    ]) {
      expect(() =>
        assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1(
          copied,
        )
      ).toThrow(/live canonical result/);
    }
  });
});

function buildFixture(slsMode: "on" | "off"): Fixture {
  const bridge = bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1(
    runPhaseB0TriSegFiniteSupportedEnvelopeV1(slsMode, sha256),
    B0_NUMERICAL_EVIDENCE_SHA256,
    sha256,
  );
  const cold = runPhaseB1ProjectSyntheticColdInitializationV1(slsMode, sha256);
  const stitch = stitchPhaseB0CenterBridgeToPhaseB1EtaOneMaterialBranchV1(
    bridge,
    cold,
  );
  return Object.freeze({
    stitch,
    graph: runPhaseB1EtaOneLandCoupledFiniteVolumeGraphV1(stitch, sha256),
  });
}

function expectCanonicalDirectedPath(
  edge: PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1,
  canonicalById: ReadonlyMap<string, Readonly<{ unknowns: readonly number[] }>>,
): void {
  expect(edge.accepted).toBe(true);
  expect(edge.selectionRuleAuditPass).toBe(true);
  expect(edge.attempts.length).toBeGreaterThan(0);
  expect(edge.attempts.map((attempt) => attempt.refinementFactor))
    .toEqual([2, 4, 8].slice(0, edge.attempts.length));
  const firstGuardIndex = edge.attempts.findIndex(
    (attempt) => attempt.fiftyPercentGuardPass,
  );
  expect(edge.selectedAttemptIndex).toBe(firstGuardIndex);
  expect(edge.selectedAttemptIndex).toBe(edge.attempts.length - 1);
  expect(edge.firstGuardPassingFactor).toBe(edge.selectedRefinementFactor);
  const canonicalSource = canonicalById.get(edge.sourceNodeId);
  expect(canonicalSource).toBeDefined();
  for (const [attemptIndex, attempt] of edge.attempts.entries()) {
    const selected = attemptIndex === edge.selectedAttemptIndex;
    expect(attempt.fiftyPercentGuardPass).toBe(selected);
    expect(attempt.refinementTrigger).toBe(selected
      ? "none"
      : attempt.hardGatePass
        ? "fifty-percent-guard-not-met"
        : "hard-failure");
    expect(Object.is(firstContinuationNode(attempt.continuation), canonicalSource))
      .toBe(true);
    expect(attempt.nodeAudits.every((audit) =>
      audit.hardGatePass)).toBe(true);
  }
  expect(edge.destinationAgreementScaledInfinityNorm)
    .toBeLessThanOrEqual(
      PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.gates
        .endpointAgreementScaledInfinityTolerance,
    );
  expect(edge.hiddenSubdivisionApplied).toBe(false);
  expect(edge.pseudoArclengthApplied).toBe(false);
  expect(edge.etaHomotopyRescueApplied).toBe(false);
  expect(edge.rootRankingApplied).toBe(false);
  expect(edge.declaredRollbackUnknownsOnFailure).toBe(canonicalSource?.unknowns);
}

function firstContinuationNode(
  continuation: PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1["attempts"][number]["continuation"],
): Readonly<{ unknowns: readonly number[] }> {
  const first = "nodes" in continuation
    ? continuation.nodes[0]
    : continuation.acceptedNodes[0];
  if (first === undefined) throw new Error("continuation did not retain its source");
  return first.node;
}

function firstPathNode(
  edge: PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1,
): Readonly<{ unknowns: readonly number[] }> {
  const firstAttempt = edge.attempts[0];
  if (firstAttempt === undefined) throw new Error("path has no attempts");
  return firstContinuationNode(firstAttempt.continuation);
}

function selectedEndpoint(
  edge: PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1,
): Readonly<{ unknowns: readonly number[] }> {
  if (edge.selectedAttemptIndex === null) throw new Error("path was not selected");
  const continuation = edge.attempts[edge.selectedAttemptIndex]?.continuation;
  if (continuation?.completed !== true) {
    throw new Error("selected path did not complete");
  }
  return continuation.endpoint.node;
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
