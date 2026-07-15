import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  canonicalizeJson,
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1,
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NODES_V1,
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1,
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphV1";
import {
  PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_MANIFEST_SHA256_V1,
  PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_NUMERICAL_SHA256_V1,
  PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_READINESS_SHA256_V1,
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1,
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphProtocolDefinitionV1,
  buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1,
  phaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestHashPayloadV1,
  type PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1";
import {
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NUMERICAL_EVIDENCE_V1_ID,
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1,
  assertDeepFrozenPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1,
  buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1,
  phaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceHashPayloadV1,
  type PhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceBundleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1";
import {
  buildFourChamberPhaseB1EtaOneLandCoupledFiniteVolumeGraphStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphReadinessV1";

const EXPECTED_MANIFEST_SHA256 =
  "bcf9c3c628a9a8bed02e783f503f266efd5a44dece1e636a05e18d6bcdbfe89c";
const EXPECTED_NUMERICAL_SHA256 =
  "3a304894732eea7ed0a0ffd55ea5a18b1c6554c874fea60e288adad15151d4d8";
const EXPECTED_READINESS_SHA256 =
  "54a60c3d446a26520aeabecada96694d36e9c3a577675b162ff7ff3d4746dd7f";

describe("Phase B1 eta-one Land-coupled finite-volume graph evidence", () => {
  let manifest:
    PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1;
  let numerical:
    PhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceBundleV1;
  let readiness: ReturnType<
    typeof buildFourChamberPhaseB1EtaOneLandCoupledFiniteVolumeGraphStatusV1
  >;

  beforeAll(() => {
    manifest =
      buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1(sha256);
    numerical =
      buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1(
        manifest,
        sha256,
      );
    readiness =
      buildFourChamberPhaseB1EtaOneLandCoupledFiniteVolumeGraphStatusV1(
        manifest,
        numerical,
      );
  }, 600_000);

  it("pins the exact parent, node, edge, ledger, continuation, census, and claim inventories", () => {
    const protocol = manifest.protocolDefinition;
    expect(manifest.lineage).toEqual({
      directParentStitchManifestSha256:
        PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_MANIFEST_SHA256_V1,
      directParentStitchNumericalEvidenceSha256:
        PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_NUMERICAL_SHA256_V1,
      directParentStitchReadinessSha256:
        PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_READINESS_SHA256_V1,
      canonicalDirectParentManifestVerifiedLive: true,
      directParentNumericalAndReadinessRebuiltAndPinnedByNumericalEvidence:
        true,
      evidenceLayerDirectParentLineageAuthentication: true,
      pureCoreParentEvidenceAuthenticationClaimed: false,
    });
    expect(protocol.graphId)
      .toBe(PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_V1_ID);
    expect(protocol.slsModes).toEqual(["on", "off"]);
    expect(protocol.nodeGraph.nodes)
      .toBe(PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NODES_V1);
    expect(protocol.nodeGraph.nodeIds)
      .toEqual(["C", "SW", "W", "NW", "N", "NE", "E", "SE", "S"]);
    expect(protocol.nodeGraph.canonicalNodeCountPerSlsMode).toBe(9);
    expect(protocol.edgeGraph.edges)
      .toBe(PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1);
    expect(protocol.edgeGraph.edges).toHaveLength(16);
    expect(protocol.edgeGraph.undirectedCenterSpokeCount).toBe(8);
    expect(protocol.edgeGraph.undirectedPerimeterEdgeCount).toBe(8);
    expect(protocol.edgeGraph.canonicalSourceDirectedEdgeCountPerSlsMode)
      .toBe(32);
    expect(protocol.edgeGraph.forwardEndpointRoundTripAuditCountPerSlsMode)
      .toBe(16);
    expect(protocol.fixedStateLedger).toMatchObject({
      eta: 1,
      timeSec: 0,
      leftVentricleComplement: "PV",
      rightVentricleComplement: "SV",
      unchangedCompartments: ["LA", "RA", "SA", "PA"],
      inertialFlowsHeldAnchorExact: true,
      prescribedCalciumHeldAnchorExact: true,
    });
    expect(protocol.continuation.refinementFactors).toEqual([2, 4, 8]);
    expect(protocol.continuation.selectionRule)
      .toBe("first-hard-pass-with-50pct-guard");
    expect(protocol.continuation.everyAttemptStartsFromExactCanonicalSource)
      .toBe(true);
    expect(protocol.continuation.factorEndpointsSharedAsSeeds).toBe(false);
    expect(protocol.nodeGates)
      .toBe(PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.gates);
    expect(protocol.fiftyPercentGuard).toBe(
      PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1
        .fiftyPercentGuard,
    );
    expect(protocol.rootCensus).toMatchObject({
      canonicalNodeCountPerSlsMode: 9,
      censusCountAcrossPairedSlsModes: 18,
      seedOrders: ["declared", "reverse"],
      declaredSeedCountPerCensus: 3,
      censusSelectsTrackedBranch: false,
      globalExhaustivenessClaimed: false,
    });
    expect(protocol.routeScope).toMatchObject({
      canonicalNodeCountPerSlsMode: 9,
      canonicalSourceDirectedEdgeCountPerSlsMode: 32,
      forwardEndpointRoundTripAuditCountPerSlsMode: 16,
      triangleAndPerimeterChainedRouteRerunsIncluded: false,
      finiteSampledGraphOnly: true,
    });
    expect(Object.values(protocol.prohibitedOperations)
      .every((value) => value === false)).toBe(true);
    expect(Object.entries(protocol.claimBoundary)
      .filter(([, value]) => value === true).map(([key]) => key))
      .toEqual(["phaseB1LandCoupledFiniteVolumeGraph"]);
    expect(protocol.claimBoundary.pureCoreParentEvidenceAuthenticationClaimed)
      .toBe(false);
    expect(Object.values(manifest.implementationClaims).every(Boolean))
      .toBe(true);
    expect(Object.values(manifest.deferred).every(Boolean)).toBe(true);

    for (const [binding, value] of Object.entries({
      protocolDefinitionSha256: protocol,
      directParentSha256: protocol.directParent,
      componentIdsSha256: protocol.componentIds,
      nodeGraphSha256: protocol.nodeGraph,
      edgeGraphSha256: protocol.edgeGraph,
      fixedStateLedgerSha256: protocol.fixedStateLedger,
      continuationSha256: protocol.continuation,
      nodeGatesSha256: protocol.nodeGates,
      fiftyPercentGuardSha256: protocol.fiftyPercentGuard,
      rootCensusSha256: protocol.rootCensus,
      routeScopeSha256: protocol.routeScope,
      prohibitedOperationsSha256: protocol.prohibitedOperations,
      claimBoundarySha256: protocol.claimBoundary,
    })) {
      expect(manifest.bindings[binding as keyof typeof manifest.bindings])
        .toBe(computeCanonicalSha256(value, sha256));
    }
    expect(manifest.contentSha256).toBe(computeCanonicalSha256(
      phaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestHashPayloadV1(
        manifest,
      ),
      sha256,
    ));
  });

  it("binds the raw paired-mode graph, summaries, factor selection, and failure probes", () => {
    const certificate = numerical.certificate;
    expect(certificate.evidenceId)
      .toBe(PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NUMERICAL_EVIDENCE_V1_ID);
    expect(certificate.manifestSha256).toBe(manifest.contentSha256);
    expect(certificate.slsModes).toEqual(["on", "off"]);
    expect(Reflect.ownKeys(certificate.modes)).toEqual(["on", "off"]);
    expect(Reflect.ownKeys(numerical.results)).toEqual(["on", "off"]);
    expect(Reflect.ownKeys(numerical.failureProbes)).toEqual(["on", "off"]);
    expect(certificate.directParentAuthentication).toMatchObject({
      exactSlsModeKeys: true,
      evidenceLayerDirectParentLineageAuthentication: true,
      pureCoreParentEvidenceAuthenticationClaimed: false,
      allDirectParentArtifactsAuthenticated: true,
    });
    expect(Object.values(certificate.directParentAuthentication.stitch)
      .filter((value) => typeof value === "boolean").every(Boolean)).toBe(true);
    expect(certificate.contentSha256).toBe(computeCanonicalSha256(
      phaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceHashPayloadV1(
        certificate,
      ),
      sha256,
    ));

    for (const mode of certificate.slsModes) {
      const raw = numerical.results[mode];
      const summary = certificate.modes[mode];
      expect(raw.slsMode).toBe(mode);
      expect(raw.canonicalNodes).toHaveLength(9);
      expect(raw.directedEdges).toHaveLength(32);
      expect(raw.roundTripAudits).toHaveLength(16);
      expect(raw.rootCensus).toHaveLength(9);
      expect(Object.is(raw.canonicalNodes[0].node,
        numerical.stitchEvidence.results[mode].etaOne.node)).toBe(true);
      expect(raw.centerReplayAudit.pass).toBe(true);
      expect(raw.phaseB1LandCoupledFiniteVolumeGraphPass).toBe(true);
      expect(raw.directedEdges.every((path) => path.accepted
        && path.selectionRuleAuditPass)).toBe(true);
      expect(raw.roundTripAudits.every((path) => path.accepted
        && path.selectionRuleAuditPass)).toBe(true);
      expect(raw.rootCensus.every((census) => census.pass)).toBe(true);
      expect(allRecordedAttempts(raw).every((attempt) =>
        !attempt.continuation.hiddenSubdivisionApplied
        && !attempt.continuation.pseudoArclengthApplied
        && !attempt.continuation.projectionApplied
        && !attempt.continuation.clippingApplied
        && !attempt.continuation.nearestRootSelectionApplied
        && !attempt.continuation.minimumResidualRootSelectionApplied
        && !attempt.continuation.maximumJunctionRadiusRootSelectionApplied))
        .toBe(true);

      expect(summary.slsMode).toBe(mode);
      expect(summary.nodes).toHaveLength(9);
      expect(summary.directedPaths).toHaveLength(32);
      expect(summary.roundTrips).toHaveLength(16);
      expect(summary.rootCensuses).toHaveLength(9);
      expect(summary.failureProbes).toHaveLength(2);
      expect(summary.centerReplay).toMatchObject({
        centerNodePreservedByObjectIdentity: true,
        independentlyConfirmedCenterNodeObjectIdentity: true,
        residualReplayExact: true,
        pass: true,
      });
      expect(summary.nodes.every((node) =>
        node.hardGatePass && node.fiftyPercentGuardPass)).toBe(true);
      expect(summary.directedPaths.every((path) => path.accepted
        && path.factorPrefixExact
        && path.stoppedAtFirstGuardPass
        && path.selectionRuleRecomputedPass
        && path.exactSourceObjectIdentity)).toBe(true);
      expect(summary.roundTrips.every((path) => path.accepted
        && path.factorPrefixExact
        && path.stoppedAtFirstGuardPass
        && path.selectionRuleRecomputedPass
        && path.exactSourceObjectIdentity)).toBe(true);
      expect(summary.rootCensuses.every((census) => census.censusPass
        && census.partitionAndBijectionRecomputedPass)).toBe(true);
      expect(summary.failureProbes.map((probe) => probe.injectedAttemptIndex))
        .toEqual([0, 1]);
      expect(summary.failureProbes.every((probe) => probe.probePass)).toBe(true);
      expect(Object.values(summary.broadClaims)
        .every((value) => value === false)).toBe(true);
      expect(summary.pureCoreParentEvidenceAuthenticationClaimed).toBe(false);
      expect(summary.evidenceLayerDirectParentLineageAuthentication).toBe(true);
      expect(summary.testOnly).toBe(true);
      expect(summary.inventoryPass).toBe(true);
      expect(summary.modePass).toBe(true);
      expect(canonicalizeJson(summary)).not.toContain("undefined");

      const expectedHistogram = mode === "on"
        ? { 2: 48, 4: 0, 8: 0 }
        : { 2: 38, 4: 9, 8: 1 };
      expect(factorHistogram([
        ...raw.directedEdges,
        ...raw.roundTripAudits,
      ])).toEqual(expectedHistogram);
      expect(factorHistogramFromSummaries([
        ...summary.directedPaths,
        ...summary.roundTrips,
      ])).toEqual(expectedHistogram);

      const probes = numerical.failureProbes[mode];
      expect(probes).toHaveLength(2);
      expect(probes.map((probe) => probe.injectedAttemptIndex)).toEqual([0, 1]);
      for (const probe of probes) {
        const result = probe.result;
        expect(result.completed).toBe(false);
        expect(result.direction).toBe("forward");
        expect(result.refinementFactor).toBe(2);
        expect(result.reason).toBe("injected-structured-failure");
        expect(result.failedAttempt.attemptIndex)
          .toBe(probe.injectedAttemptIndex);
        expect(result.acceptedNodes)
          .toHaveLength(probe.injectedAttemptIndex + 1);
        expect(Object.is(result.acceptedNodes[0].node,
          numerical.stitchEvidence.results[mode].etaOne.node)).toBe(true);
        expect(Object.is(result.rollbackUnknowns,
          result.rollbackNode.node.unknowns)).toBe(true);
        expect(Object.is(result.rollbackNode,
          result.acceptedNodes[probe.injectedAttemptIndex])).toBe(true);
        expect([
          result.hiddenSubdivisionApplied,
          result.pseudoArclengthApplied,
          result.projectionApplied,
          result.clippingApplied,
          result.nearestRootSelectionApplied,
          result.minimumResidualRootSelectionApplied,
          result.maximumJunctionRadiusRootSelectionApplied,
        ].every((value) => value === false)).toBe(true);
      }
    }
    expect(certificate.allModesPass).toBe(true);
  });

  it("opens only finite-graph readiness plus evidence-layer parent authentication", () => {
    expect(readiness.evidenceLayerDirectParentAuthenticationPass).toBe(true);
    expect(readiness.implementation.evidenceLayerDirectParentAuthenticationPass)
      .toBe(true);
    expect(readiness.phaseB1LandCoupledFiniteVolumeGraphPass).toBe(true);
    expect(readiness.bindings.finiteVolumeGraphEvidenceManifestSha256)
      .toBe(manifest.contentSha256);
    expect(readiness.bindings.numericalEvidenceSha256)
      .toBe(numerical.certificate.contentSha256);
    expect(readiness.lineage).toBe(manifest.lineage);
    expect([
      readiness.phaseB0OverallAcceptancePass,
      readiness.acceptedPhaseB1ReferenceBranchPass,
      readiness.phaseB1LandCoupledVolumeEnvelopePass,
      readiness.continuousEtaIntervalRegularityPass,
      readiness.continuousVolumeIntervalRegularityPass,
      readiness.globalRootUniquenessPass,
      readiness.globalRootExhaustivenessPass,
      readiness.energeticStabilityPass,
      readiness.physiologicalInitializationPass,
      readiness.closedLoopStationarityPass,
      readiness.fullBeatAcceptancePass,
      readiness.physiologicalValidationPass,
      readiness.phaseB1AcceptancePass,
      readiness.supportedEnvelopePass,
      readiness.releaseRuntimePass,
      readiness.pureCoreParentEvidenceAuthenticationClaimed,
      readiness.modelCoreIntegration,
      readiness.browserRuntimeAdopted,
      readiness.releaseRuntimeReachable,
    ].every((claim) => claim === false)).toBe(true);
    expect(readiness.implementation.pureCoreParentEvidenceAuthenticationClaimed)
      .toBe(false);
    expect(readiness.testOnly).toBe(true);
  });

  it("pins all hashes and rejects canonical-looking copies and mutation", () => {
    expect({
      manifest: manifest.contentSha256,
      numerical: numerical.certificate.contentSha256,
      readiness: computeCanonicalSha256(readiness, sha256),
    }).toEqual({
      manifest: EXPECTED_MANIFEST_SHA256,
      numerical: EXPECTED_NUMERICAL_SHA256,
      readiness: EXPECTED_READINESS_SHA256,
    });
    expect(() =>
      assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1(
        JSON.parse(canonicalizeJson(manifest)),
      )).toThrow(/canonically built/);
    expect(() =>
      assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphProtocolDefinitionV1(
        JSON.parse(canonicalizeJson(manifest.protocolDefinition)),
      )).toThrow(/canonically built/);
    expect(() =>
      assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1(
        { ...numerical },
        manifest,
      )).toThrow(/canonically built/);
    expect(
      assertDeepFrozenPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1(
        numerical,
      ),
    ).toBe(numerical);
    expectRecursivelyFrozen(manifest);
    expectRecursivelyFrozen(readiness);

    const firstAttempt = numerical.results.on.directedEdges[0].attempts[0];
    if (firstAttempt.continuation.completed !== true) {
      throw new Error("representative canonical attempt did not complete");
    }
    const health = firstAttempt.continuation.nodes[0].node.residualEvaluation
      .wallMaterialByWall.LVFW.sourceLandOutput.health;
    expect(Object.isFrozen(health)).toBe(true);
    expect(() => Object.defineProperty(health, "finite", { value: false }))
      .toThrow(TypeError);
    expect(health.finite).toBe(true);
    expect(() => (numerical.failureProbes.on as unknown as unknown[])
      .push(numerical.failureProbes.on[0])).toThrow(TypeError);
  });
});

type RawGraph = PhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceBundleV1[
  "results"
]["on"];

function allRecordedAttempts(raw: RawGraph) {
  return [...raw.directedEdges, ...raw.roundTripAudits]
    .flatMap((path) => path.attempts);
}

function factorHistogram(
  paths: readonly RawGraph["directedEdges"][number][],
): Record<2 | 4 | 8, number> {
  return paths.reduce((counts, path) => {
    if (path.selectedRefinementFactor !== null) {
      counts[path.selectedRefinementFactor] += 1;
    }
    return counts;
  }, { 2: 0, 4: 0, 8: 0 } as Record<2 | 4 | 8, number>);
}

function factorHistogramFromSummaries(
  paths: readonly Readonly<{
    selectedRefinementFactor:
      | Readonly<{ tag: "null" }>
      | Readonly<{ tag: "value"; value: 2 | 4 | 8 }>;
  }>[],
): Record<2 | 4 | 8, number> {
  return paths.reduce((counts, path) => {
    if (path.selectedRefinementFactor.tag === "value") {
      counts[path.selectedRefinementFactor.value] += 1;
    }
    return counts;
  }, { 2: 0, 4: 0, 8: 0 } as Record<2 | 4 | 8, number>);
}

function expectRecursivelyFrozen(value: unknown): void {
  const seen = new WeakSet<object>();
  const visit = (candidate: unknown): void => {
    if (candidate === null || typeof candidate !== "object") return;
    if (seen.has(candidate)) return;
    expect(Object.isFrozen(candidate)).toBe(true);
    seen.add(candidate);
    for (const key of Reflect.ownKeys(candidate)) {
      const descriptor = Reflect.getOwnPropertyDescriptor(candidate, key);
      expect(descriptor).toBeDefined();
      if (descriptor !== undefined && "value" in descriptor) {
        visit(descriptor.value);
      }
    }
  };
  visit(value);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
