import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
  runPhaseB1ProjectSyntheticColdInitializationV1,
  runPhaseB1ProjectSyntheticColdStructuredFailureProbeV1,
  type PhaseB1ColdNodeSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import type {
  PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";

const EXPECTED_ENDPOINT_ROOT_CENSUS = Object.freeze({
  0: Object.freeze([
    Object.freeze({
      representativeResultIndex: 0,
      memberResultIndices: Object.freeze([0] as const),
      classification: "robust-saddle" as const,
      coordinates: Object.freeze({ V_m_S: 0, y_m: 0.0283448295 }),
    }),
    Object.freeze({
      representativeResultIndex: 1,
      memberResultIndices: Object.freeze([1, 2] as const),
      classification: "robust-restoring" as const,
      coordinates: Object.freeze({ V_m_S: 0, y_m: 0.03 }),
    }),
  ]),
  1: Object.freeze([
    Object.freeze({
      representativeResultIndex: 0,
      memberResultIndices: Object.freeze([0, 1, 2] as const),
      classification: "robust-restoring" as const,
      coordinates: Object.freeze({ V_m_S: 0, y_m: 0.02993945370577389 }),
    }),
  ]),
} as const);

describe("four-chamber Phase B1 project-synthetic cold initialization", () => {
  it.each(["on", "off"] as const)(
    "tracks the declared material branch in SLS-%s topology",
    (slsMode) => {
      const result = runPhaseB1ProjectSyntheticColdInitializationV1(
        slsMode,
        sha256,
      );
      expect(
        result.projectSyntheticColdInitializationImplementationPass,
        JSON.stringify({
          mode: slsMode,
          paths: result.forwardPaths.map((path) => path.completed === true
            ? {
              completed: true,
              count: path.requestedSubdivisionCount,
              maxStep: path.maximumAcceptedNodeStepScaledInfinityNorm,
              maxCorrection: path.maximumPredictorCorrectionScaledInfinityNorm,
              nodes: path.nodes.map((node) => ({
                eta: node.eta,
                classification: node.effectiveTriSegAudit.classification,
                accepted: node.effectiveTriSegAudit.accepted,
                sigma: node.effectiveTriSegAudit.sigmaMinimum,
                condition: node.effectiveTriSegAudit.conditionNumber2,
                schurDifference:
                  node.effectiveTriSegAudit.schurToReequilibratedDifferenceTwoNorm,
                margin: node.effectiveTriSegAudit.robustSignedMargin,
              })),
            }
            : {
              completed: false,
              count: path.requestedSubdivisionCount,
              reason: path.failedNode.reason,
              message: path.failedNode.message,
              eta: path.failedNode.eta,
            }),
          reverse: result.canonicalReversePath?.completed,
          endpointAgreement: result.maximumEndpointAgreementScaledInfinityNorm,
          reverseClosure: result.reverseClosureScaledInfinityNorm,
          parity: result.maximumCanonicalParityRelativeDifference,
          census: result.rootCensus.map((value) => ({
            eta: value.eta,
            completed: value.enumerationCompleted,
            converged: value.convergedRootCount,
            clusters: value.clusters,
          })),
        }),
      )
        .toBe(true);
      expect(result.layout.unknownCount).toBe(slsMode === "on" ? 37 : 32);
      expect(result.forwardPaths).toHaveLength(4);
      for (const path of result.forwardPaths) {
        expect(path.completed).toBe(true);
        if (!path.completed) continue;
        expect(path.attemptedEtaValues).toEqual(path.requestedEtaValues);
        expect(path.pathEntryCorrectionScaledInfinityNorm).toBeLessThanOrEqual(
          PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
            .maximumPathEntryCorrectionScaledInfinityNorm,
        );
        expect(path.edgeAudits).toHaveLength(path.requestedSubdivisionCount);
        expect(path.hiddenSubdivisionApplied).toBe(false);
        expect(path.pseudoArclengthApplied).toBe(false);
        expect(path.nearestRootSelectionApplied).toBe(false);
        expect(path.minimumResidualRootSelectionApplied).toBe(false);
        expect(path.maximumJunctionRadiusRootSelectionApplied).toBe(false);
        for (const node of path.nodes) {
          expectColdNodeEvidence(node, result.anchorEndpoint, true);
        }
      }
      const reverse = result.canonicalReversePath;
      expect(reverse?.completed).toBe(true);
      if (reverse?.completed === true) {
        const expectedReverseEtas = Array.from(
          {
            length:
              PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
                .canonicalSubdivisionCount + 1,
          },
          (_, index) => 1 - index
            / PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
              .canonicalSubdivisionCount,
        );
        expect(reverse.requestedEtaValues).toEqual(expectedReverseEtas);
        expect(reverse.attemptedEtaValues).toEqual(expectedReverseEtas);
        expect(reverse.hiddenSubdivisionApplied).toBe(false);
        expect(reverse.pseudoArclengthApplied).toBe(false);
        expect(reverse.projectionApplied).toBe(false);
        expect(reverse.clippingApplied).toBe(false);
        expect(reverse.nearestRootSelectionApplied).toBe(false);
        expect(reverse.minimumResidualRootSelectionApplied).toBe(false);
        expect(reverse.maximumJunctionRadiusRootSelectionApplied).toBe(false);
        for (const [nodeIndex, node] of reverse.nodes.entries()) {
          expect(node.eta).toBe(expectedReverseEtas[nodeIndex]);
          expectColdNodeEvidence(node, result.anchorEndpoint, true);
        }
      }
      expect(result.maximumEndpointAgreementScaledInfinityNorm).toBeLessThanOrEqual(
        PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
          .endpointAgreementScaledInfinityTolerance,
      );
      expect(result.reverseClosureScaledInfinityNorm).toBeLessThanOrEqual(
        PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
          .reverseClosureScaledInfinityTolerance,
      );
      expect(result.rootCensus.map((census) => census.eta)).toEqual([0, 1]);
      for (const census of result.rootCensus) {
        const expectedClusters = EXPECTED_ENDPOINT_ROOT_CENSUS[census.eta];
        expect(census.enumerationCompleted).toBe(true);
        expect(census.allSeedsAttempted).toBe(true);
        expect(census.allSeedsConverged).toBe(true);
        expect(census.seeds).toEqual(
          PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
            .enumerationSeeds,
        );
        expect(census.results.every((root) => root.converged)).toBe(true);
        expect(census.convergedRootCount).toBe(
          PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
            .enumerationSeeds.length,
        );
        for (const root of census.results) {
          if (!root.converged) continue;
          expectColdNodeEvidence(root, result.anchorEndpoint, false);
        }
        expect(census.clusters).toHaveLength(expectedClusters.length);
        const coordinateScales = result.layout.unknownScales.slice(-2);
        expectedClusters.forEach((expected, clusterIndex) => {
          const cluster = census.clusters[clusterIndex];
          expect(cluster.representativeResultIndex)
            .toBe(expected.representativeResultIndex);
          expect(cluster.memberResultIndices).toEqual(expected.memberResultIndices);
          expect(cluster.classification).toBe(expected.classification);
          expectScaledCoordinateNear(
            cluster.coordinates,
            expected.coordinates,
            coordinateScales,
          );
          const representative = census.results[cluster.representativeResultIndex];
          expect(representative.converged).toBe(true);
          if (!representative.converged) return;
          expect(cluster.coordinates).toEqual(representative.endpoint.triSegCoordinates);
          expect(cluster.classification)
            .toBe(representative.effectiveTriSegAudit.classification);
          for (const resultIndex of cluster.memberResultIndices) {
            const member = census.results[resultIndex];
            expect(member.converged).toBe(true);
            if (!member.converged) continue;
            expect(member.effectiveTriSegAudit.classification)
              .toBe(expected.classification);
            expectScaledCoordinateNear(
              member.endpoint.triSegCoordinates,
              expected.coordinates,
              coordinateScales,
            );
          }
        });
        expect(census.selectionInputToAcceptedPath).toBe(false);
        expect(census.globalExhaustivenessClaimed).toBe(false);
        expect(census.allDiscoveredRootsReported).toBe(true);
      }
      expect(result.maximumCanonicalParityRelativeDifference).toBeLessThanOrEqual(1e-12);
      expect(result.acceptedPhysiologicalColdInitializationPass).toBe(false);
      expect(result.acceptedPhaseB1ReferenceBranchPass).toBe(false);
      expect(result.supportedEnvelopePass).toBe(false);
      expect(result.physiologicalValidationPass).toBe(false);
      expect(result.releaseRuntimePass).toBe(false);
      expect(result.warmStartImportedOrConsumed).toBe(false);
    },
  );

  it.each([
    { slsMode: "on", direction: "forward", injectedAttemptIndex: 0 },
    { slsMode: "on", direction: "forward", injectedAttemptIndex: 1 },
    { slsMode: "on", direction: "reverse", injectedAttemptIndex: 0 },
    { slsMode: "on", direction: "reverse", injectedAttemptIndex: 1 },
    { slsMode: "off", direction: "forward", injectedAttemptIndex: 0 },
    { slsMode: "off", direction: "forward", injectedAttemptIndex: 1 },
    { slsMode: "off", direction: "reverse", injectedAttemptIndex: 0 },
    { slsMode: "off", direction: "reverse", injectedAttemptIndex: 1 },
  ] as const)(
    "rolls SLS-$slsMode $direction attempt-$injectedAttemptIndex failure probes back without rescue",
    ({ slsMode, direction, injectedAttemptIndex }) => {
      const probe = runPhaseB1ProjectSyntheticColdStructuredFailureProbeV1(
        slsMode,
        direction,
        sha256,
        injectedAttemptIndex,
      );
      const path = probe.path;
      expect(path.completed).toBe(false);
      expect(path.attemptedEtaValues).toHaveLength(injectedAttemptIndex + 1);
      expect(path.acceptedNodes).toHaveLength(injectedAttemptIndex);
      expect(path.failedNode.reason).toBe("final-audit-failed");
      expect(path.failedNode.message)
        .toBe("deterministic structured-failure rollback probe");
      expect(path.rollbackEndpoint).toEqual(probe.pathEntryEndpoint);
      if (injectedAttemptIndex === 0) {
        expect(path.failedNode.rollbackUnknowns).toEqual(probe.pathEntryUnknowns);
        expect(path.failedNode.lastAcceptedUnknowns).toBeNull();
      } else {
        expect(path.failedNode.rollbackUnknowns)
          .toEqual(path.acceptedNodes[0].unknowns);
        expect(path.failedNode.lastAcceptedUnknowns)
          .toEqual(path.acceptedNodes[0].unknowns);
      }
      expect(path.branchIdentityEstablished).toBe(false);
      expect(path.hiddenSubdivisionApplied).toBe(false);
      expect(path.pseudoArclengthApplied).toBe(false);
      expect(path.projectionApplied).toBe(false);
      expect(path.clippingApplied).toBe(false);
      expect(path.nearestRootSelectionApplied).toBe(false);
      expect(path.minimumResidualRootSelectionApplied).toBe(false);
      expect(path.maximumJunctionRadiusRootSelectionApplied).toBe(false);
    },
  );
});

function expectColdNodeEvidence(
  node: PhaseB1ColdNodeSuccessV1,
  fixedEndpoint: PhaseB1EndpointStateV1,
  requireAcceptedRestoring: boolean,
): void {
  const policy = PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1;
  expect(node.minimumLandSimplexMargin).toBeGreaterThan(0);
  expect(node.maximumLocalMaterialResidualInfinityNorm).toBeLessThanOrEqual(
    policy.maximumLocalMaterialResidualInfinityNorm,
  );
  expect(node.scaledResidualInfinityNorm).toBeLessThanOrEqual(
    policy.maximumScaledColdResidualInfinityNorm,
  );
  expect(node.scaledUpdateInfinityNorm).toBeLessThanOrEqual(
    policy.maximumScaledColdUpdateInfinityNorm,
  );
  if (requireAcceptedRestoring) {
    expect(node.effectiveTriSegAudit.accepted).toBe(true);
    expect(node.effectiveTriSegAudit.classification).toBe("robust-restoring");
  }
  expect(node.effectiveTriSegAudit.energeticStabilityClaimed).toBe(false);
  expect(node.effectiveTriSegAudit.globalUniquenessClaimed).toBe(false);
  expect(node.projectionApplied).toBe(false);
  expect(node.clippingApplied).toBe(false);
  expect(node.fallbackApplied).toBe(false);
  expect(node.residualEvaluation.projectionApplied).toBe(false);
  expect(node.residualEvaluation.clippingApplied).toBe(false);
  expect(node.endpoint.timeSec).toBe(fixedEndpoint.timeSec);
  expect(node.endpoint.differentialState.bloodVolumesM3).toEqual(
    fixedEndpoint.differentialState.bloodVolumesM3,
  );
  expect(node.endpoint.differentialState.inertialFlowsM3PerSec).toEqual(
    fixedEndpoint.differentialState.inertialFlowsM3PerSec,
  );
  expect(node.endpoint.differentialState.calciumByWall).toEqual(
    fixedEndpoint.differentialState.calciumByWall,
  );
}

function expectScaledCoordinateNear(
  actual: Readonly<{ V_m_S: number; y_m: number }>,
  expected: Readonly<{ V_m_S: number; y_m: number }>,
  scales: readonly number[],
): void {
  const distance = Math.max(
    Math.abs(actual.V_m_S - expected.V_m_S) / scales[0],
    Math.abs(actual.y_m - expected.y_m) / scales[1],
  );
  expect(distance).toBeLessThanOrEqual(
    PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
      .rootClusteringScaledInfinityTolerance,
  );
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
