import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  canonicalizeJson,
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildFourChamberPhaseB0TriSegFiniteSupportedEnvelopeStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/phaseB0TriSegFiniteSupportedEnvelopeReadinessV1";
import {
  PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1,
  PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_NODES_V1,
  PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1,
  PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeV1";
import { PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID } from
  "@/engine/myocardium/fourChamberV1/phaseB0/publishedTriSegRootV1";
import { PHASE_B0_HYDROMECHANICS_SAME_TIME_LEVEL_EVALUATION_V1_ID } from
  "@/engine/myocardium/fourChamberV1/phaseB0/monolithicHydromechanicsBackwardEulerV1";
import { PHASE_B0_SYNTHETIC_HYDROMECHANICS_CASE_V1_ID } from
  "@/engine/myocardium/fourChamberV1/phaseB0/syntheticHydromechanicsCaseV1";
import { PHASE_B0_TRISEG_NATURAL_PARAMETER_CONTINUATION_V1_ID } from
  "@/engine/myocardium/fourChamberV1/phaseB0/triSegNaturalParameterContinuationV1";
import { PHASE_B0_TRISEG_STATIC_RESTORING_AUDIT_V1_ID } from
  "@/engine/myocardium/fourChamberV1/phaseB0/triSegStaticRestoringAuditV1";
import { PHASE_B0_TRISEG_STATIC_RESTORING_GATE_MANIFEST_V1_ID } from
  "@/engine/myocardium/fourChamberV1/phaseB0/triSegStaticRestoringGateManifestV1";
import { PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID } from
  "@/engine/myocardium/fourChamberV1/phaseB0/verifiedAlgorithmicJacobianV1";
import { PHASE_B0_VALVE_NUMERICAL_POLICY_V1_ID } from
  "@/engine/myocardium/fourChamberV1/phaseB0/valveNumericalPolicyV1";
import { PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID } from
  "@/engine/myocardium/fourChamberV1/triseg/publishedTaylorOracle2009V1";
import {
  PHASE_B0_FINITE_ENVELOPE_PARENT_APPENDIX_AC_PACK_SHA256_V1,
  PHASE_B0_FINITE_ENVELOPE_PARENT_CASE_SHA256_V1,
  PHASE_B0_FINITE_ENVELOPE_PARENT_LOCAL_STATIC_MANIFEST_SHA256_V1,
  PHASE_B0_FINITE_ENVELOPE_PARENT_NEWTON_SCALE_REGISTRY_SHA256_V1,
  PHASE_B0_FINITE_ENVELOPE_PARENT_TISSUE_BUNDLE_SHA256_V1,
  assertCanonicalPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1,
  buildPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1,
  phaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestHashPayloadV1,
  type PhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeEvidenceManifestV1";
import {
  assertCanonicalPhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceV1,
  buildPhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceV1,
  phaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceHashPayloadV1,
  type PhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceBundleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeNumericalEvidenceV1";

const EXPECTED_FINITE_ENVELOPE_MANIFEST_SHA256 =
  "701e9706965fcffd6604d2bde079ec40d5dec39781429ea074b8ab6edb9684a3";
const EXPECTED_FINITE_ENVELOPE_NUMERICAL_EVIDENCE_SHA256 =
  "1832e54d6b2d8e91707dff7af71553620950c942c970e00968a39219eedbf9c1";
const EXPECTED_FINITE_ENVELOPE_READINESS_SHA256 =
  "3319c2bcac060156d7a8b1e1b13f6440b2faf022c6359cf9467c7366f0bd9a52";
const DECLARED_PATH_PARAMETERIZATION =
  "cumulative-scaled-load-arclength-using-declared-fixed-load-scales";
const DECLARED_PARAMETER_DERIVATIVE_STENCIL =
  "in-segment-forward-five-point-with-step-halving-audit";

describe("four-chamber Phase B0 finite TriSeg envelope evidence", () => {
  let manifest: PhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1;
  let numericalEvidence:
    PhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceBundleV1;
  let readiness: ReturnType<
    typeof buildFourChamberPhaseB0TriSegFiniteSupportedEnvelopeStatusV1
  >;

  beforeAll(() => {
    manifest =
      buildPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1(sha256);
    numericalEvidence =
      buildPhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceV1(
        manifest,
        sha256,
      );
    readiness = buildFourChamberPhaseB0TriSegFiniteSupportedEnvelopeStatusV1(
      manifest,
      numericalEvidence,
    );
  }, 120_000);

  it("binds all five canonical parent artifacts and protocol leaves", () => {
    expect(manifest.lineage.syntheticHydromechanicsCaseSha256)
      .toBe(PHASE_B0_FINITE_ENVELOPE_PARENT_CASE_SHA256_V1);
    expect(manifest.lineage.localStaticRestoringManifestSha256)
      .toBe(PHASE_B0_FINITE_ENVELOPE_PARENT_LOCAL_STATIC_MANIFEST_SHA256_V1);
    expect(manifest.lineage.phaseA1TissueManifestBundleSha256)
      .toBe(PHASE_B0_FINITE_ENVELOPE_PARENT_TISSUE_BUNDLE_SHA256_V1);
    expect(manifest.lineage.newtonScaleRegistrySha256)
      .toBe(PHASE_B0_FINITE_ENVELOPE_PARENT_NEWTON_SCALE_REGISTRY_SHA256_V1);
    expect(manifest.lineage.stabilizedAppendixAcReferencePackSha256)
      .toBe(PHASE_B0_FINITE_ENVELOPE_PARENT_APPENDIX_AC_PACK_SHA256_V1);
    expect(manifest.bindings.protocolDefinitionSha256).toBe(
      computeCanonicalSha256(manifest.protocolDefinition, sha256),
    );
    expect(manifest.bindings.nodeGraphSha256).toBe(
      computeCanonicalSha256(PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_NODES_V1, sha256),
    );
    expect(manifest.bindings.edgeGraphSha256).toBe(
      computeCanonicalSha256(PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1, sha256),
    );
    expect(manifest.bindings.policySha256).toBe(
      computeCanonicalSha256(PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1, sha256),
    );
    expect(manifest.bindings.componentIds).toEqual({
      runner: PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID,
      rootSolver: PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID,
      sameTimeLevelHydromechanicsEvaluation:
        PHASE_B0_HYDROMECHANICS_SAME_TIME_LEVEL_EVALUATION_V1_ID,
      syntheticCase: PHASE_B0_SYNTHETIC_HYDROMECHANICS_CASE_V1_ID,
      staticGateManifest:
        PHASE_B0_TRISEG_STATIC_RESTORING_GATE_MANIFEST_V1_ID,
      algorithmicJacobian: PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID,
      valveNumericalPolicy: PHASE_B0_VALVE_NUMERICAL_POLICY_V1_ID,
      publishedTaylorOracle: PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID,
      equationAssembly: "published-Taylor-2009",
      localStaticClassifier: PHASE_B0_TRISEG_STATIC_RESTORING_AUDIT_V1_ID,
      naturalParameterContinuation:
        PHASE_B0_TRISEG_NATURAL_PARAMETER_CONTINUATION_V1_ID,
    });
  });

  it("freezes the finite graph contract without broadening its claims", () => {
    expect(manifest.protocolDefinition.nodes).toHaveLength(9);
    expect(manifest.protocolDefinition.edges).toHaveLength(16);
    expect(manifest.protocolDefinition.policy.adaptiveRefinement.refinementFactors)
      .toEqual([2, 4, 8, 16, 32]);
    expect(Object.values(manifest.implementationClaims).every(Boolean)).toBe(true);
    expect(Object.values(manifest.deferred).every(Boolean)).toBe(true);
    expect(Object.values(manifest.negativeClaims).every((value) => !value))
      .toBe(true);
    expect(Object.values(manifest.protocolDefinition.policy.prohibitedOperations)
      .every((value) => !value)).toBe(true);
    expect(Object.values(manifest.protocolDefinition.policy.claimBoundary)
      .every((value) => !value)).toBe(true);
  });

  it("binds explicit finite numerical traces and only opens the narrow pass", () => {
    expect(numericalEvidence.certificate.allModesPass).toBe(true);
    expect(() => canonicalizeJson(
      phaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceHashPayloadV1(
        numericalEvidence.certificate,
      ),
    )).not.toThrow();
    for (const mode of Object.values(numericalEvidence.certificate.modes)) {
      expect(mode.runtimeComponentIds).toEqual(
        manifest.bindings.componentIds,
      );
      expect(mode.runtimeComponentIdentityPass).toBe(true);
      expect(mode.canonicalNodes).toHaveLength(9);
      expect(mode.directedEdges).toHaveLength(32);
      expect(mode.routeClosureAudits.centerTriangles).toHaveLength(8);
      expect(mode.routeClosureAudits.perimeterCycles).toHaveLength(2);
      expect(mode.rootCensus).toHaveLength(9);
      expect(mode.valveSmoothingStructuralIndependenceAudit.cases).toHaveLength(9);
      expect(mode.structuredFailureProbes).toHaveLength(2);
      expect(mode.canonicalNodes.every((node) =>
        node.rootId === PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
        && node.rootAlgorithmicJacobianId
          === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
        && node.independentJacobianRootId
          === PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
        && node.independentJacobianAlgorithmicJacobianId
          === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID)).toBe(true);
      expect(mode.directedEdges.every((edge) =>
        edge.accepted
        && edge.selectionRuleAuditPass
        && edge.prohibitedOperationsAbsent)).toBe(true);
      const routeEdges = [
        ...mode.routeClosureAudits.centerTriangles.flatMap((triangle) => [
          ...triangle.clockwiseTraversedEdges,
          ...triangle.counterclockwiseTraversedEdges,
        ]),
        ...mode.routeClosureAudits.perimeterCycles.flatMap(
          (cycle) => cycle.traversedEdges,
        ),
      ];
      for (const edge of [...mode.directedEdges, ...routeEdges]) {
        for (const attempt of edge.attempts) {
          expectTraceAttemptAlgorithmAndParameterizationIdentity(attempt);
        }
      }
      expectTraceRouteIdentities(mode);
      expect(mode.rootCensus.every((census) =>
        census.pass
        && census.seedOrderInvariant
        && census.clusters.length > 0
        && census.forwardResults.length === 3
        && census.reverseResults.length === 3
        && census.forwardResults.every((root) =>
          root.rootId === PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
          && root.algorithmicJacobianId
            === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID)
        && census.reverseResults.every((root) =>
          root.rootId === PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
          && root.algorithmicJacobianId
            === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID))).toBe(true);
      expect(mode.everyContinuationUsesCenterFixedLoadScales).toBe(true);
      expect(mode.everyLedgerUsesPvAsExactLvComplement).toBe(true);
      expect(mode.everyLedgerUsesSvAsExactRvComplement).toBe(true);
      expect(mode.everyLedgerKeepsLaRaSaPaExact).toBe(true);
      expect(mode.routeClosurePass).toBe(true);
      expect(mode.structuredFailureRollbackPass).toBe(true);
      expect(mode.structuredFailureProbes.every((probe) =>
        probe.attempts.length === 1
        && probe.attempts[0].path.length
          === probe.attempts[0].pathNodeCount
        && probe.attempts[0].segments.length
          === probe.attempts[0].segmentCount)).toBe(true);
      for (const probe of mode.structuredFailureProbes) {
        probe.attempts.forEach(
          expectTraceAttemptAlgorithmAndParameterizationIdentity,
        );
      }
      expect(mode.componentIdentityAuditPass).toBe(true);
      expect(mode.broadNegativeClaimsRemainFalse).toBe(true);
      expect(mode.modePass).toBe(true);
    }
    expect(readiness.bindings.numericalEvidenceSha256)
      .toBe(numericalEvidence.certificate.contentSha256);
    expect(readiness.phaseB0PublishedTaylorStaticTriSegFiniteVolumeEnvelopePass)
      .toBe(true);
    expect(readiness.continuousRectangleInteriorPass).toBe(false);
    expect(readiness.globalRootUniquenessPass).toBe(false);
    expect(readiness.energeticStabilityPass).toBe(false);
    expect(readiness.phaseB0OverallAcceptancePass).toBe(false);
    expect(readiness.phaseB1LandCoupledVolumeEnvelopePass).toBe(false);
    expect(readiness.fullBeatAcceptancePass).toBe(false);
    expect(readiness.physiologicalValidationPass).toBe(false);
    expect(readiness.releaseRuntimePass).toBe(false);
  });

  it("pins all hashes and rejects canonical-looking copies", () => {
    expect(manifest.contentSha256).toBe(computeCanonicalSha256(
      phaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestHashPayloadV1(
        manifest,
      ),
      sha256,
    ));
    expect(numericalEvidence.certificate.contentSha256).toBe(
      computeCanonicalSha256(
        phaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceHashPayloadV1(
          numericalEvidence.certificate,
        ),
        sha256,
      ),
    );
    expect(manifest.contentSha256)
      .toBe(EXPECTED_FINITE_ENVELOPE_MANIFEST_SHA256);
    expect(numericalEvidence.certificate.contentSha256)
      .toBe(EXPECTED_FINITE_ENVELOPE_NUMERICAL_EVIDENCE_SHA256);
    expect(computeCanonicalSha256(readiness, sha256))
      .toBe(EXPECTED_FINITE_ENVELOPE_READINESS_SHA256);
    const driftedTrace = JSON.parse(canonicalizeJson(
      phaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceHashPayloadV1(
        numericalEvidence.certificate,
      ),
    ));
    driftedTrace.modes.on.directedEdges[0].attempts[0].segments[0]
      .predictedCoordinates.junctionRadiusM += 1e-12;
    expect(computeCanonicalSha256(driftedTrace, sha256))
      .not.toBe(numericalEvidence.certificate.contentSha256);
    const copiedManifest = JSON.parse(canonicalizeJson(manifest));
    expect(() =>
      assertCanonicalPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1(
        copiedManifest,
      )).toThrow(/canonically built/);
    expect(() =>
      assertCanonicalPhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceV1(
        { ...numericalEvidence },
        manifest,
      )).toThrow(/canonically built/);
  });
});

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

type FiniteEnvelopeModeTrace =
  PhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceBundleV1[
    "certificate"
  ]["modes"]["on"];

type FiniteEnvelopeAttemptTrace =
  FiniteEnvelopeModeTrace["directedEdges"][number]["attempts"][number];

function expectTraceRootAlgorithmIdentity(root: Readonly<{
  rootId: string;
  algorithmicJacobianId: string;
}>): void {
  expect(root.rootId).toBe(PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID);
  expect(root.algorithmicJacobianId)
    .toBe(PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID);
}

function expectTraceAttemptAlgorithmAndParameterizationIdentity(
  attempt: FiniteEnvelopeAttemptTrace,
): void {
  expect(attempt.continuationAuditId)
    .toBe(PHASE_B0_TRISEG_NATURAL_PARAMETER_CONTINUATION_V1_ID);
  expect(attempt.pathParameterization).toBe(DECLARED_PATH_PARAMETERIZATION);
  expect(attempt.parameterDerivativeStencil)
    .toBe(DECLARED_PARAMETER_DERIVATIVE_STENCIL);
  expect(attempt.tangentAlgorithmicJacobianId)
    .toBe(PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID);
  expect(attempt.path).toHaveLength(attempt.pathNodeCount);
  expect(attempt.roots).toHaveLength(attempt.rootCount);
  expect(attempt.segments).toHaveLength(attempt.segmentCount);
  expect(attempt.nodeAudits).toHaveLength(attempt.rootCount);
  expectTraceRootAlgorithmIdentity(attempt.anchorRoot);
  attempt.roots.forEach(expectTraceRootAlgorithmIdentity);
  attempt.segments.forEach((segment) => {
    expect(segment.tangentAlgorithmicJacobianId)
      .toBe(PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID);
    expectTraceRootAlgorithmIdentity(segment.correctedRoot);
  });
  expect(attempt.nodeAudits.every((node) =>
    node.rootId === PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
    && node.rootAlgorithmicJacobianId
      === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
    && node.oracleId === PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID
    && node.staticAuditId
      === PHASE_B0_TRISEG_STATIC_RESTORING_AUDIT_V1_ID
    && node.independentJacobianRootId
      === PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
    && node.independentJacobianAlgorithmicJacobianId
      === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID)).toBe(true);
}

function expectTraceRouteIdentities(mode: FiniteEnvelopeModeTrace): void {
  const perimeterEdges = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1
    .filter((edge) => edge.edgeClass === "perimeter");
  expect(mode.routeClosureAudits.centerTriangles).toHaveLength(
    perimeterEdges.length,
  );
  mode.routeClosureAudits.centerTriangles.forEach((triangle, index) => {
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

  expect(mode.routeClosureAudits.perimeterCycles).toHaveLength(2);
  for (const cycle of mode.routeClosureAudits.perimeterCycles) {
    const ordered = cycle.direction === "clockwise"
      ? perimeterEdges
      : [...perimeterEdges].reverse();
    const direction = cycle.direction === "clockwise" ? "forward" : "reverse";
    const expected = ordered.map((edge) =>
      expectedEdgeIdentity(edge, direction));
    expect(cycle.traversedEdges).toHaveLength(perimeterEdges.length);
    expect(cycle.traversedEdges.map(edgeIdentity)).toEqual(expected);
    expect(cycle.traversedEdgeKeys).toEqual(
      expected.map((edge) => `${edge.edgeId}:${edge.direction}`),
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
