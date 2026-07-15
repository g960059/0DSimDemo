import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1,
  PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_NODES_V1,
  PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1,
  runPhaseB0TriSegFiniteSupportedEnvelopeFailureProbeV1,
  runPhaseB0TriSegFiniteSupportedEnvelopeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeV1";
import { PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID } from
  "@/engine/myocardium/fourChamberV1/phaseB0/verifiedAlgorithmicJacobianV1";

const DECLARED_PATH_PARAMETERIZATION =
  "cumulative-scaled-load-arclength-using-declared-fixed-load-scales";
const DECLARED_PARAMETER_DERIVATIVE_STENCIL =
  "in-segment-forward-five-point-with-step-halving-audit";

describe("four-chamber Phase B0 finite static TriSeg supported envelope", () => {
  it("freezes the 3x3 closed-ledger graph and adaptive contract", () => {
    expect(PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_NODES_V1).toHaveLength(9);
    expect(PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1).toHaveLength(16);
    expect(PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1.filter(
      (edge) => edge.edgeClass === "center-spoke",
    )).toHaveLength(8);
    expect(PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1.filter(
      (edge) => edge.edgeClass === "perimeter",
    )).toHaveLength(8);
    expect(PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
      .adaptiveRefinement.refinementFactors).toEqual([2, 4, 8, 16, 32]);
    expect(PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
      .volumeAxes.unchangedCompartments).toEqual(["LA", "RA", "SA", "PA"]);
  });

  it.each(["on", "off"] as const)(
    "closes the declared SLS-%s finite graph without broadening claims",
    (slsMode) => {
      const result = runPhaseB0TriSegFiniteSupportedEnvelopeV1(slsMode, sha256);
      expect(result.runtimeComponentIdentityPass).toBe(true);
      expect(result.runtimeComponentIds.algorithmicJacobian)
        .toBe(PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID);
      expect(result.canonicalNodes).toHaveLength(9);
      expect(result.directedEdges).toHaveLength(32);
      expect(result.rootCensus).toHaveLength(9);
      for (const node of result.canonicalNodes) {
        expectRootAlgorithmIdentity(node.root);
        expectRootAlgorithmIdentity(node.independentJacobianStepAudit.root);
      }
      const routeEdges = [
        ...result.routeClosureAudits.centerTriangles.flatMap((triangle) => [
          ...triangle.clockwiseTraversedEdges,
          ...triangle.counterclockwiseTraversedEdges,
        ]),
        ...result.routeClosureAudits.perimeterCycles.flatMap(
          (cycle) => cycle.traversedEdges,
        ),
      ];
      for (const edge of [...result.directedEdges, ...routeEdges]) {
        for (const attempt of edge.attempts) {
          expectRuntimeAttemptAlgorithmAndParameterizationIdentity(attempt);
        }
      }
      for (const census of result.rootCensus) {
        census.results.forEach(expectRootAlgorithmIdentity);
        census.reverseSeedOrderResults.forEach(expectRootAlgorithmIdentity);
      }
      expectRuntimeRouteIdentities(result);
      expect(result.canonicalNodes.every((entry) => entry.hardGatePass)).toBe(true);
      expect(result.canonicalNodes.every((entry) => entry.ledger.accepted)).toBe(true);
      expect(result.directedEdges.every((entry) => entry.accepted)).toBe(true);
      expect(result.directedEdges.every((entry) =>
        entry.selectionRuleAuditPass
        && entry.attempts.length >= 1
        && entry.attempts.every((attempt, index) =>
          attempt.refinementFactor
            === PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
              .adaptiveRefinement.refinementFactors[index]
          && independentlyRecomputeFiftyPercentGuard(attempt)))).toBe(true);
      expect(result.directedEdges.some((entry) =>
        entry.selectedRefinementFactor === 4)).toBe(true);
      expect(result.rootCensus.every((entry) =>
        entry.allSeedsAttempted
        && entry.allSeedsConverged
        && entry.allDiscoveredClustersReported
        && !entry.globalExhaustivenessClaimed
        && entry.pass)).toBe(true);
      expect(result.maximumDestinationAgreementScaledInfinityNorm)
        .toBeLessThanOrEqual(1e-6);
      expect(result.maximumReverseClosureScaledInfinityNorm)
        .toBeLessThanOrEqual(1e-6);
      expect(result.staticValveSmoothingStructuralIndependenceAudit.cases)
        .toHaveLength(9);
      expect(result.staticValveSmoothingStructuralIndependenceAudit.pass).toBe(true);
      expect(result.finiteDeclaredGraphEnvelopePass).toBe(true);
      expect(result.continuousRectangleInteriorPass).toBe(false);
      expect(result.globalRootUniquenessPass).toBe(false);
      expect(result.energeticStabilityPass).toBe(false);
      expect(result.phaseB0OverallAcceptancePass).toBe(false);
      expect(result.phaseB1LandCoupledVolumeEnvelopePass).toBe(false);
      expect(result.physiologicalValidationPass).toBe(false);
      expect(result.releaseRuntimePass).toBe(false);
    },
    120_000,
  );

  it.each([
    { slsMode: "on", direction: "forward" },
    { slsMode: "on", direction: "reverse" },
    { slsMode: "off", direction: "forward" },
    { slsMode: "off", direction: "reverse" },
  ] as const)(
    "rolls SLS-$slsMode $direction exhaustion probes to their actual entry",
    ({ slsMode, direction }) => {
      const probe = runPhaseB0TriSegFiniteSupportedEnvelopeFailureProbeV1(
        slsMode,
        direction,
        sha256,
      );
      expect(probe.attempts).toHaveLength(1);
      expect(probe.attempts[0].refinementFactor).toBe(2);
      expect(probe.attempts[0].fiftyPercentGuardPass).toBe(false);
      expectRuntimeAttemptAlgorithmAndParameterizationIdentity(
        probe.attempts[0],
      );
      expect(probe.selectedAttemptIndex).toBeNull();
      expect(probe.accepted).toBe(false);
      expect(probe.rollbackCoordinates).toEqual(probe.pathEntryCoordinates);
      expect(probe.rollbackMatchesDirectionSpecificEntry).toBe(true);
      expect(probe.rollbackCoordinates)
        .not.toEqual(probe.rejectedAttemptEndpointCoordinates);
      expect(probe.rollbackDiffersFromRejectedAttemptEndpoint).toBe(true);
      expect(probe.hiddenSubdivisionApplied).toBe(false);
      expect(probe.pseudoArclengthApplied).toBe(false);
      expect(probe.rootRankingApplied).toBe(false);
    },
  );
});

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function expectRootAlgorithmIdentity(
  root: Readonly<{ algorithmicJacobianId: string }>,
): void {
  expect(root.algorithmicJacobianId)
    .toBe(PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID);
}

function expectRuntimeAttemptAlgorithmAndParameterizationIdentity(
  attempt: ReturnType<
    typeof runPhaseB0TriSegFiniteSupportedEnvelopeV1
  >["directedEdges"][number]["attempts"][number],
): void {
  const continuation = attempt.continuation;
  expect(continuation.pathParameterization)
    .toBe(DECLARED_PATH_PARAMETERIZATION);
  expect(continuation.parameterDerivativeStencil)
    .toBe(DECLARED_PARAMETER_DERIVATIVE_STENCIL);
  expect(continuation.tangentAlgorithmicJacobianId)
    .toBe(PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID);
  expectRootAlgorithmIdentity(continuation.anchorRoot);
  continuation.roots.forEach(expectRootAlgorithmIdentity);
  continuation.segments.forEach((segment) => {
    expect(segment.tangentAlgorithmicJacobianId)
      .toBe(PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID);
    expectRootAlgorithmIdentity(segment.correctedRoot);
  });
  for (const node of attempt.nodeAudits) {
    expectRootAlgorithmIdentity(node.root);
    expectRootAlgorithmIdentity(node.independentJacobianStepAudit.root);
  }
}

function expectRuntimeRouteIdentities(
  result: ReturnType<typeof runPhaseB0TriSegFiniteSupportedEnvelopeV1>,
): void {
  const perimeterEdges = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1
    .filter((edge) => edge.edgeClass === "perimeter");
  expect(result.routeClosureAudits.centerTriangles).toHaveLength(
    perimeterEdges.length,
  );
  result.routeClosureAudits.centerTriangles.forEach((triangle, index) => {
    const perimeter = perimeterEdges[index];
    const fromSpoke = requireDeclaredSpoke(perimeter.fromNodeId);
    const toSpoke = requireDeclaredSpoke(perimeter.toNodeId);
    expect(triangle.triangleId)
      .toBe(`C-${perimeter.fromNodeId}-${perimeter.toNodeId}`);
    expect(triangle.clockwiseTraversedEdges.map(edgeIdentity)).toEqual([
      expectedEdgeIdentity(fromSpoke, "forward"),
      expectedEdgeIdentity(perimeter, "forward"),
      expectedEdgeIdentity(toSpoke, "reverse"),
    ]);
    expect(triangle.counterclockwiseTraversedEdges.map(edgeIdentity)).toEqual([
      expectedEdgeIdentity(toSpoke, "forward"),
      expectedEdgeIdentity(perimeter, "reverse"),
      expectedEdgeIdentity(fromSpoke, "reverse"),
    ]);
  });

  expect(result.routeClosureAudits.perimeterCycles).toHaveLength(2);
  for (const cycle of result.routeClosureAudits.perimeterCycles) {
    const ordered = cycle.direction === "clockwise"
      ? perimeterEdges
      : [...perimeterEdges].reverse();
    const direction = cycle.direction === "clockwise" ? "forward" : "reverse";
    expect(cycle.traversedEdges).toHaveLength(perimeterEdges.length);
    expect(cycle.traversedEdges.map(edgeIdentity)).toEqual(
      ordered.map((edge) => expectedEdgeIdentity(edge, direction)),
    );
  }
}

function requireDeclaredSpoke(
  destinationNodeId: string,
): (typeof PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1)[number] {
  const spoke = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1.find(
    (edge) => edge.edgeClass === "center-spoke"
      && edge.toNodeId === destinationNodeId,
  );
  if (spoke === undefined) {
    throw new Error(`missing declared spoke to ${destinationNodeId}`);
  }
  return spoke;
}

function edgeIdentity(edge: Readonly<{
  edgeId: string;
  direction: "forward" | "reverse";
  sourceNodeId: string;
  destinationNodeId: string;
}>) {
  return {
    edgeId: edge.edgeId,
    direction: edge.direction,
    sourceNodeId: edge.sourceNodeId,
    destinationNodeId: edge.destinationNodeId,
  };
}

function expectedEdgeIdentity(
  edge: Readonly<{
    edgeId: string;
    fromNodeId: string;
    toNodeId: string;
  }>,
  direction: "forward" | "reverse",
) {
  return {
    edgeId: edge.edgeId,
    direction,
    sourceNodeId: direction === "forward" ? edge.fromNodeId : edge.toNodeId,
    destinationNodeId: direction === "forward" ? edge.toNodeId : edge.fromNodeId,
  };
}

function independentlyRecomputeFiftyPercentGuard(
  attempt: ReturnType<typeof runPhaseB0TriSegFiniteSupportedEnvelopeV1>["directedEdges"][number]["attempts"][number],
): boolean {
  const adaptive = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
    .adaptiveRefinement;
  const continuation = attempt.continuation;
  const policy = continuation.policy;
  const maximumGuard = (value: number | null, threshold: number) =>
    value !== null
    && value <= adaptive.upperThresholdGuardMultiplier * threshold;
  const minimumLoadArclengthGuard = continuation.segments.every((segment) =>
    segment.scaledLoadArclength
      >= adaptive.lowerThresholdGuardMultiplier * policy.minimumScaledLoadArclength);
  const tangentDotGuard = continuation.minimumTangentDot === null
    || 1 - continuation.minimumTangentDot
      <= adaptive.upperThresholdGuardMultiplier * (1 - policy.minimumTangentDot);
  const continuationGuard = minimumLoadArclengthGuard
    && maximumGuard(
      continuation.anchorCorrectionScaledInfinityNorm,
      policy.maximumAnchorCorrectionScaledInfinityNorm,
    )
    && maximumGuard(
      continuation.maximumTangentPredictionHalvingDifferenceScaledInfinityNorm,
      policy.maximumTangentPredictionHalvingDifferenceScaledInfinityNorm,
    )
    && maximumGuard(
      continuation.maximumPredictorCorrectionScaledInfinityNorm,
      policy.maximumPredictorCorrectionScaledInfinityNorm,
    )
    && maximumGuard(
      continuation.maximumPredictorCorrectionToAcceptedCoordinateStepRatio,
      policy.maximumPredictorCorrectionToAcceptedCoordinateStepRatio,
    )
    && maximumGuard(
      continuation.maximumAcceptedScaledCoordinateStep,
      policy.maximumAcceptedScaledCoordinateStep,
    )
    && tangentDotGuard;
  const independentlyHardGatedNodes = attempt.nodeAudits.every((audit) =>
    audit.ledger.accepted
    && audit.taylorDomainPass
    && audit.staticAudit.acceptedUnderLocalStaticRestoringTestReference
    && audit.staticAudit.scaledRestoringTangent.classification
      === "robust-restoring"
    && audit.independentJacobianStepAudit.root.converged
    && audit.independentJacobianStepAudit.coordinateAgreementScaledInfinityNorm
      !== null
    && audit.independentJacobianStepAudit.coordinateAgreementScaledInfinityNorm
      <= PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
        .algorithmicJacobianSensitivity.endpointAgreementScaledInfinityTolerance
    && audit.independentJacobianStepAudit.classificationMatches);
  const independentlyComputedHardGatePass = continuation.numericalPathAccepted
    && continuation.allConverged
    && continuation.roots.length === continuation.path.length
    && attempt.nodeAudits.length === continuation.path.length
    && independentlyHardGatedNodes
    && !continuation.nearestRootSelectionApplied
    && !continuation.minimumResidualSelectionApplied
    && !continuation.maximumJunctionRadiusSelectionApplied
    && !continuation.forcedPreviousSeptumApplied
    && !continuation.pseudoArclengthApplied
    && !continuation.supportedEnvelopeClaimed;
  const gates = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1.gates;
  const independentlyAuditedNodes = attempt.nodeAudits.every((audit) =>
    independentlyHardGatedNodes
    && audit.staticAudit.rootRegularity.sigmaMinimum
      >= adaptive.lowerThresholdGuardMultiplier
        * gates.minimumRootJacobianSigmaMinimum
    && audit.staticAudit.rootRegularity.conditionNumber2
      <= adaptive.upperThresholdGuardMultiplier
        * gates.maximumRootJacobianConditionNumber2
    && audit.staticAudit.rootRegularity.scaledResidualInfinityNorm
      <= adaptive.upperThresholdGuardMultiplier
        * gates.maximumScaledRootResidualInfinityNorm
    && audit.staticAudit.rootRegularity.scaledUpdateInfinityNorm
      <= adaptive.upperThresholdGuardMultiplier
        * gates.maximumScaledRootUpdateInfinityNorm
    && audit.staticAudit.scaledRestoringTangent.robustSignedMargin
      >= adaptive.lowerThresholdGuardMultiplier
        * gates.minimumRobustRestoringMargin
    && audit.staticAudit.generalizedForceTransformAudit.differenceTwoNorm
      <= adaptive.upperThresholdGuardMultiplier
        * gates.maximumGeneralizedForceTransformAuditDifference2);
  const expected = independentlyComputedHardGatePass
    && continuationGuard
    && independentlyAuditedNodes;
  return attempt.hardGatePass === independentlyComputedHardGatePass
    && attempt.fiftyPercentGuardPass === expected;
}
