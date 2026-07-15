import {
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID,
  type PhaseB0CenterToPhaseB1EtaZeroBridgeResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID,
  PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID,
  type PhaseB1ColdHomotopyPathSuccessV1,
  type PhaseB1ColdNodeSuccessV1,
  type PhaseB1ColdRootCensusV1,
  type PhaseB1ProjectSyntheticColdInitializationResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export const PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_V1_ID =
  "phase-b0-center-to-phase-b1-eta-one-material-branch-stitch-v1" as const;

export const PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1 =
  Object.freeze({
    policyId:
      "phase-b0-center-to-phase-b1-eta-one-material-branch-stitch-policy-v1",
    canonicalSubdivisionCount: 8 as const,
    canonicalEtaValues: Object.freeze([
      0, 1 / 8, 2 / 8, 3 / 8, 4 / 8, 5 / 8, 6 / 8, 7 / 8, 1,
    ] as const),
    requiredForwardSubdivisionCounts: Object.freeze([1, 2, 4, 8] as const),
    maximumEtaZeroScaledUnknownDifference: 0,
    maximumEtaOneAssembledToRawLandActiveStressDifferencePa: 1e-9,
    endpointAgreementScaledInfinityTolerance:
      PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .endpointAgreementScaledInfinityTolerance,
    reverseClosureScaledInfinityTolerance:
      PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .reverseClosureScaledInfinityTolerance,
    rootClusteringScaledInfinityTolerance:
      PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .rootClusteringScaledInfinityTolerance,
    finiteRootCensusIsNotPathSelectionOrGlobalExhaustiveness: true,
  } as const);

export type PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1 =
  Readonly<{
    stitchId:
      typeof PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_V1_ID;
    slsMode: "on" | "off";
    etaZeroBoundary: Readonly<{
      bridgeAnalyticEndpointEqualsColdAnchorEndpoint: true;
      bridgeSolvedNodeEqualsColdCanonicalEtaZeroNode: true;
      layoutExact: true;
      maximumScaledUnknownDifference: 0;
      noEtaZeroReinitializationOrResolveAppliedByStitch: true;
    }>;
    canonicalMaterialPath: Readonly<{
      protocolId: typeof PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID;
      homotopyId: typeof PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID;
      subdivisionCounts: readonly [1, 2, 4, 8];
      canonicalSubdivisionCount: 8;
      canonicalEtaValues: typeof PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1.canonicalEtaValues;
      nodeCount: 9;
      edgeCount: 8;
      maximumEndpointAgreementScaledInfinityNorm: number;
      reverseClosureToBridgeEtaZeroScaledInfinityNorm: number;
      everyNodeAccepted: true;
      fixedTimeVolumesFlowsAndCalciumAcrossPath: true;
      prohibitedOperationsAbsent: true;
    }>;
    etaOne: Readonly<{
      node: PhaseB1ColdNodeSuccessV1;
      wallByWall: Readonly<Record<FourChamberWallId, Readonly<{
        rawLandActiveStressPa: number;
        assembledActiveStressPa: number;
        absoluteDifferencePa: number;
      }>>>;
      maximumAssembledToRawLandActiveStressDifferencePa: number;
      canonicalLandAssemblyPass: true;
    }>;
    finiteRootCensus: Readonly<{
      etaZeroMatchingRestoringClusterCount: 1;
      etaZeroSeparateSaddleClusterReported: true;
      etaOneMatchingRestoringClusterCount: 1;
      allDeclaredSeedsAttemptedAndConverged: true;
      everyConvergedResultPartitionedExactlyOnce: true;
      allDiscoveredRootsReported: true;
      selectionInputToAcceptedPath: false;
      globalExhaustivenessClaimed: false;
    }>;
    phaseB0CenterConnectedPhaseB1EtaOneMaterialBranchStitchPass: true;
    phaseB0OverallAcceptancePass: false;
    acceptedPhaseB1ReferenceBranchPass: false;
    phaseB1LandCoupledFiniteVolumeGraphPass: false;
    phaseB1LandCoupledVolumeEnvelopePass: false;
    continuousEtaIntervalRegularityPass: false;
    continuousVolumeIntervalRegularityPass: false;
    globalRootUniquenessPass: false;
    globalRootExhaustivenessPass: false;
    energeticStabilityPass: false;
    physiologicalInitializationPass: false;
    closedLoopStationarityPass: false;
    fullBeatAcceptancePass: false;
    physiologicalValidationPass: false;
    phaseB1AcceptancePass: false;
    supportedEnvelopePass: false;
    releaseRuntimePass: false;
    pureCoreParentEvidenceAuthenticationClaimed: false;
    testOnly: true;
    modelCoreIntegration: false;
    browserRuntimeAdopted: false;
    releaseRuntimeReachable: false;
  }>;

export function stitchPhaseB0CenterBridgeToPhaseB1EtaOneMaterialBranchV1(
  bridge: PhaseB0CenterToPhaseB1EtaZeroBridgeResultV1,
  cold: PhaseB1ProjectSyntheticColdInitializationResultV1,
): PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1 {
  if (!bridge.phaseB0CenterToPhaseB1EtaZeroBridgePass) {
    throw new Error("eta-one stitch requires a passing eta-zero bridge result");
  }
  if (
    bridge.bridgeId !== PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID
    || bridge.source.nodeId !== "C"
  ) throw new Error("eta-one stitch bridge parent identity drifted");
  if (!cold.projectSyntheticColdInitializationImplementationPass) {
    throw new Error("eta-one stitch requires a passing cold material branch");
  }
  if (bridge.slsMode !== cold.slsMode) {
    throw new Error("eta-one stitch parent SLS modes differ");
  }
  if (
    cold.protocolId !== PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID
    || cold.homotopyId !== PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID
  ) throw new Error("eta-one stitch cold parent identity drifted");
  if (bridge.destination.eta !== 0) {
    throw new Error("eta-one stitch bridge destination is not eta zero");
  }
  if (
    bridge.destination.slsMode !== bridge.slsMode
    || bridge.destination.protocolId !== cold.protocolId
    || bridge.destination.homotopyId !== cold.homotopyId
  ) throw new Error("eta-one stitch destination identity drifted");

  const canonicalForward = cold.canonicalForwardPath;
  const canonicalReverse = cold.canonicalReversePath;
  if (canonicalForward === null || !canonicalForward.completed) {
    throw new Error("eta-one stitch canonical forward path is absent");
  }
  if (canonicalReverse === null || !canonicalReverse.completed) {
    throw new Error("eta-one stitch canonical reverse path is absent");
  }
  const policy =
    PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1;
  if (
    !deepExactEqual(
      bridge.destination.analyticallyReequilibratedSeedEndpoint,
      cold.anchorEndpoint,
    )
  ) throw new Error("eta-one stitch analytic eta-zero endpoints differ");
  const etaZeroNode = canonicalForward.nodes[0];
  if (!deepExactEqual(bridge.destination.node, etaZeroNode)) {
    throw new Error("eta-one stitch solved eta-zero nodes differ");
  }
  if (!deepExactEqual(bridge.destination.layout, cold.layout)) {
    throw new Error("eta-one stitch parent layouts differ");
  }
  const etaZeroScaledDifference = scaledInfinityDistance(
    bridge.destination.node.unknowns,
    etaZeroNode.unknowns,
    cold.layout.unknownScales,
  );
  if (etaZeroScaledDifference !== policy.maximumEtaZeroScaledUnknownDifference) {
    throw new Error("eta-one stitch eta-zero unknowns are not exactly equal");
  }

  const successfulForward = cold.forwardPaths.filter(
    (path): path is PhaseB1ColdHomotopyPathSuccessV1 => path.completed,
  );
  const declaredCanonicalForward = cold.forwardPaths.find((path) =>
    path.requestedSubdivisionCount === policy.canonicalSubdivisionCount);
  if (
    successfulForward.length !== cold.forwardPaths.length
    || !Object.is(declaredCanonicalForward, canonicalForward)
    || !arrayExact(
      successfulForward.map((path) => path.requestedSubdivisionCount),
      policy.requiredForwardSubdivisionCounts,
    )
    || !successfulForward.every((path) => {
      const etaGrid = forwardEtaGrid(path.requestedSubdivisionCount);
      return path.direction === "forward"
        && path.nodes.length === path.requestedSubdivisionCount + 1
        && path.edgeAudits.length === path.requestedSubdivisionCount
        && arrayExact(path.requestedEtaValues, etaGrid)
        && arrayExact(path.attemptedEtaValues, etaGrid)
        && pathGridExact(path, etaGrid);
    })
  ) throw new Error("eta-one stitch forward subdivision inventory drifted");
  if (
    canonicalForward.requestedSubdivisionCount !== policy.canonicalSubdivisionCount
    || canonicalForward.direction !== "forward"
    || !canonicalForward.branchIdentityEstablished
    || canonicalForward.previousNodeUsedAs !== "tangent-predictor-base-only"
    || !arrayExact(canonicalForward.requestedEtaValues, policy.canonicalEtaValues)
    || !arrayExact(canonicalForward.attemptedEtaValues, policy.canonicalEtaValues)
    || canonicalForward.nodes.length !== 9
    || canonicalForward.edgeAudits.length !== 8
    || canonicalForward.nodes.some(
      (node, index) => node.eta !== policy.canonicalEtaValues[index],
    )
  ) throw new Error("eta-one stitch canonical eta grid drifted");
  const maximumEndpointAgreement = maximumPairwiseScaledDistance(
    successfulForward.map((path) => path.endpoint.unknowns),
    cold.layout.unknownScales,
  );
  if (
    !Number.isFinite(maximumEndpointAgreement)
    || maximumEndpointAgreement > policy.endpointAgreementScaledInfinityTolerance
  ) throw new Error("eta-one stitch forward endpoints disagree");
  const reverseClosureToBridge = scaledInfinityDistance(
    canonicalReverse.endpoint.unknowns,
    bridge.destination.node.unknowns,
    cold.layout.unknownScales,
  );
  if (
    !Number.isFinite(reverseClosureToBridge)
    || reverseClosureToBridge > policy.reverseClosureScaledInfinityTolerance
  ) {
    throw new Error("eta-one stitch reverse path does not close to bridge node");
  }
  const reverseEtaValues = reverseEtaGrid(8);
  if (
    canonicalReverse.direction !== "reverse"
    || canonicalReverse.requestedSubdivisionCount !== 8
    || canonicalReverse.nodes.length !== 9
    || canonicalReverse.edgeAudits.length !== 8
    || !arrayExact(canonicalReverse.requestedEtaValues, reverseEtaValues)
    || !arrayExact(canonicalReverse.attemptedEtaValues, reverseEtaValues)
    || !pathGridExact(canonicalReverse, reverseEtaValues)
    || !deepExactEqual(
      canonicalForward.endpoint.unknowns,
      canonicalReverse.nodes[0].unknowns,
    )
    || !deepExactEqual(
      canonicalForward.endpoint.endpoint,
      canonicalReverse.nodes[0].endpoint,
    )
  ) throw new Error("eta-one stitch reverse path identity drifted");

  const allNodes = [
    ...successfulForward.flatMap((path) => path.nodes),
    ...canonicalReverse.nodes,
  ];
  const referenceEndpoint = bridge.destination.node.endpoint;
  const everyNodeAccepted = allNodes.every((node) =>
    node.converged
    && node.scaledResidualInfinityNorm
      <= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumScaledColdResidualInfinityNorm
    && node.scaledUpdateInfinityNorm
      <= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumScaledColdUpdateInfinityNorm
    && node.minimumLandSimplexMargin > 0
    && node.effectiveTriSegAudit.accepted
    && !node.projectionApplied
    && !node.clippingApplied
    && !node.fallbackApplied);
  if (!everyNodeAccepted) throw new Error("eta-one stitch path node audit failed");
  const fixedStateAcrossPath = allNodes.every((node) =>
    node.endpoint.timeSec === referenceEndpoint.timeSec
    && deepExactEqual(
      node.endpoint.differentialState.bloodVolumesM3,
      referenceEndpoint.differentialState.bloodVolumesM3,
    )
    && deepExactEqual(
      node.endpoint.differentialState.inertialFlowsM3PerSec,
      referenceEndpoint.differentialState.inertialFlowsM3PerSec,
    )
    && deepExactEqual(
      node.endpoint.differentialState.calciumByWall,
      referenceEndpoint.differentialState.calciumByWall,
    ));
  if (!fixedStateAcrossPath) {
    throw new Error("eta-one stitch fixed time, volume, flow, or calcium drifted");
  }
  if (
    !successfulForward.every(pathProhibitedOperationsAbsent)
    || !pathProhibitedOperationsAbsent(canonicalReverse)
  ) throw new Error("eta-one stitch encountered a prohibited path operation");

  const etaOneNode = canonicalForward.endpoint;
  if (etaOneNode.eta !== 1) throw new Error("eta-one stitch endpoint is not eta one");
  const etaOneWalls = Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => {
    const wall = etaOneNode.residualEvaluation.closedLoop.wallMechanics[wallId];
    const assembledActiveStressPa = wall.totalKirchhoffStressPa
      - wall.equilibriumPassive.equilibriumKirchhoffStressPa
      - wall.slsOverstressPa;
    const rawLandActiveStressPa = wall.activeKirchhoffStressPa;
    return [wallId, Object.freeze({
      rawLandActiveStressPa,
      assembledActiveStressPa,
      absoluteDifferencePa: Math.abs(
        assembledActiveStressPa - rawLandActiveStressPa,
      ),
    })];
  }))) as Readonly<Record<FourChamberWallId, Readonly<{
    rawLandActiveStressPa: number;
    assembledActiveStressPa: number;
    absoluteDifferencePa: number;
  }>>>;
  const maximumEtaOneLandDifference = Math.max(
    ...WALL_IDS.map((wallId) => etaOneWalls[wallId].absoluteDifferencePa),
  );
  if (
    !Number.isFinite(maximumEtaOneLandDifference)
    || maximumEtaOneLandDifference
      > policy.maximumEtaOneAssembledToRawLandActiveStressDifferencePa
  ) throw new Error("eta-one stitch Land active-stress assembly drifted");

  const etaZeroCensus = requireCensus(cold.rootCensus, 0);
  const etaOneCensus = requireCensus(cold.rootCensus, 1);
  const etaZeroLink = auditCensusLink(
    etaZeroCensus,
    etaZeroNode.unknowns,
    cold.layout.unknownScales,
  );
  const etaOneLink = auditCensusLink(
    etaOneCensus,
    etaOneNode.unknowns,
    cold.layout.unknownScales,
  );
  const everyConvergedResultPartitionedExactlyOnce = [
    etaZeroCensus,
    etaOneCensus,
  ].every((census) => censusPartitionPass(
    census,
    cold.layout.unknownScales,
  ));
  if (
    etaZeroLink.matchingRestoringClusterCount !== 1
    || !etaZeroLink.separateSaddleClusterReported
    || etaOneLink.matchingRestoringClusterCount !== 1
    || ![etaZeroCensus, etaOneCensus].every((census) =>
      census.enumerationCompleted
      && census.allSeedsAttempted
      && census.allSeedsConverged
      && census.allDiscoveredRootsReported
      && !census.selectionInputToAcceptedPath
      && !census.globalExhaustivenessClaimed)
    || !everyConvergedResultPartitionedExactlyOnce
  ) throw new Error("eta-one stitch finite root-census linkage failed");

  return Object.freeze({
    stitchId: PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_V1_ID,
    slsMode: bridge.slsMode,
    etaZeroBoundary: Object.freeze({
      bridgeAnalyticEndpointEqualsColdAnchorEndpoint: true as const,
      bridgeSolvedNodeEqualsColdCanonicalEtaZeroNode: true as const,
      layoutExact: true as const,
      maximumScaledUnknownDifference: 0 as const,
      noEtaZeroReinitializationOrResolveAppliedByStitch: true as const,
    }),
    canonicalMaterialPath: Object.freeze({
      protocolId: cold.protocolId,
      homotopyId: cold.homotopyId,
      subdivisionCounts: policy.requiredForwardSubdivisionCounts,
      canonicalSubdivisionCount: 8 as const,
      canonicalEtaValues: policy.canonicalEtaValues,
      nodeCount: 9 as const,
      edgeCount: 8 as const,
      maximumEndpointAgreementScaledInfinityNorm: maximumEndpointAgreement,
      reverseClosureToBridgeEtaZeroScaledInfinityNorm: reverseClosureToBridge,
      everyNodeAccepted: true as const,
      fixedTimeVolumesFlowsAndCalciumAcrossPath: true as const,
      prohibitedOperationsAbsent: true as const,
    }),
    etaOne: Object.freeze({
      node: etaOneNode,
      wallByWall: etaOneWalls,
      maximumAssembledToRawLandActiveStressDifferencePa:
        maximumEtaOneLandDifference,
      canonicalLandAssemblyPass: true as const,
    }),
    finiteRootCensus: Object.freeze({
      etaZeroMatchingRestoringClusterCount: 1 as const,
      etaZeroSeparateSaddleClusterReported: true as const,
      etaOneMatchingRestoringClusterCount: 1 as const,
      allDeclaredSeedsAttemptedAndConverged: true as const,
      everyConvergedResultPartitionedExactlyOnce: true as const,
      allDiscoveredRootsReported: true as const,
      selectionInputToAcceptedPath: false as const,
      globalExhaustivenessClaimed: false as const,
    }),
    phaseB0CenterConnectedPhaseB1EtaOneMaterialBranchStitchPass: true as const,
    phaseB0OverallAcceptancePass: false as const,
    acceptedPhaseB1ReferenceBranchPass: false as const,
    phaseB1LandCoupledFiniteVolumeGraphPass: false as const,
    phaseB1LandCoupledVolumeEnvelopePass: false as const,
    continuousEtaIntervalRegularityPass: false as const,
    continuousVolumeIntervalRegularityPass: false as const,
    globalRootUniquenessPass: false as const,
    globalRootExhaustivenessPass: false as const,
    energeticStabilityPass: false as const,
    physiologicalInitializationPass: false as const,
    closedLoopStationarityPass: false as const,
    fullBeatAcceptancePass: false as const,
    physiologicalValidationPass: false as const,
    phaseB1AcceptancePass: false as const,
    supportedEnvelopePass: false as const,
    releaseRuntimePass: false as const,
    pureCoreParentEvidenceAuthenticationClaimed: false as const,
    testOnly: true as const,
    modelCoreIntegration: false as const,
    browserRuntimeAdopted: false as const,
    releaseRuntimeReachable: false as const,
  });
}

function pathProhibitedOperationsAbsent(
  path: PhaseB1ColdHomotopyPathSuccessV1,
): boolean {
  return !path.hiddenSubdivisionApplied
    && !path.pseudoArclengthApplied
    && !path.projectionApplied
    && !path.clippingApplied
    && !path.nearestRootSelectionApplied
    && !path.minimumResidualRootSelectionApplied
    && !path.maximumJunctionRadiusRootSelectionApplied;
}

function requireCensus(
  censuses: readonly PhaseB1ColdRootCensusV1[],
  eta: 0 | 1,
): PhaseB1ColdRootCensusV1 {
  const matches = censuses.filter((census) => census.eta === eta);
  if (matches.length !== 1) throw new Error(`eta-one stitch requires one eta=${eta} census`);
  return matches[0];
}

function auditCensusLink(
  census: PhaseB1ColdRootCensusV1,
  targetUnknowns: readonly number[],
  scales: readonly number[],
) {
  const matching = census.clusters.filter((cluster) => {
    const representative = census.results[cluster.representativeResultIndex];
    return representative?.converged === true
      && scaledInfinityDistance(
        representative.unknowns,
        targetUnknowns,
        scales,
      ) <= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .rootClusteringScaledInfinityTolerance;
  });
  return Object.freeze({
    matchingRestoringClusterCount: matching.filter(
      (cluster) => cluster.classification === "robust-restoring",
    ).length,
    separateSaddleClusterReported: census.clusters.some((cluster) =>
      cluster.classification === "robust-saddle" && !matching.includes(cluster)),
  });
}

function censusPartitionPass(
  census: PhaseB1ColdRootCensusV1,
  scales: readonly number[],
): boolean {
  const converged = census.results.flatMap((result, index) =>
    result.converged ? [index] : []);
  const members = census.clusters
    .flatMap((cluster) => cluster.memberResultIndices)
    .sort((left, right) => left - right);
  return deepExactEqual(
    census.seeds,
    PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1.enumerationSeeds,
  )
    && denseArray(census.results, census.results.length)
    && denseArray(census.clusters, census.clusters.length)
    && census.results.length
      === PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .enumerationSeeds.length
    && census.results.every((result) => result.converged)
    && census.convergedRootCount === converged.length
    && arrayExact(converged, members)
    && new Set(members).size === members.length
    && census.clusters.every((cluster) => {
      const representative = census.results[cluster.representativeResultIndex];
      return representative?.converged === true
        && denseArray(
          cluster.memberResultIndices,
          cluster.memberResultIndices.length,
        )
        && cluster.memberResultIndices.includes(cluster.representativeResultIndex)
        && cluster.memberResultIndices.every((index) =>
          Number.isInteger(index) && index >= 0 && index < census.results.length)
        && cluster.classification
          === representative.effectiveTriSegAudit.classification
        && deepExactEqual(
          cluster.coordinates,
          representative.endpoint.triSegCoordinates,
        )
        && cluster.memberResultIndices.every((memberIndex) => {
          const member = census.results[memberIndex];
          return member?.converged === true
            && member.effectiveTriSegAudit.classification
              === cluster.classification
            && scaledInfinityDistance(
              representative.unknowns,
              member.unknowns,
              scales,
            ) <= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
              .rootClusteringScaledInfinityTolerance;
        });
    });
}

function maximumPairwiseScaledDistance(
  vectors: readonly (readonly number[])[],
  scales: readonly number[],
): number {
  let maximum = 0;
  for (let left = 0; left < vectors.length; left += 1) {
    for (let right = left + 1; right < vectors.length; right += 1) {
      maximum = Math.max(
        maximum,
        scaledInfinityDistance(vectors[left], vectors[right], scales),
      );
    }
  }
  return maximum;
}

function forwardEtaGrid(subdivisionCount: number): readonly number[] {
  return Object.freeze(Array.from(
    { length: subdivisionCount + 1 },
    (_, index) => index / subdivisionCount,
  ));
}

function reverseEtaGrid(subdivisionCount: number): readonly number[] {
  return Object.freeze(Array.from(
    { length: subdivisionCount + 1 },
    (_, index) => 1 - index / subdivisionCount,
  ));
}

function pathGridExact(
  path: PhaseB1ColdHomotopyPathSuccessV1,
  etaValues: readonly number[],
): boolean {
  if (
    !denseArray(path.nodes, etaValues.length)
    || !denseArray(path.edgeAudits, etaValues.length - 1)
    || !Object.is(path.endpoint, path.nodes[path.nodes.length - 1])
  ) return false;
  for (let index = 0; index < path.nodes.length; index += 1) {
    if (path.nodes[index].eta !== etaValues[index]) return false;
  }
  for (let index = 0; index < path.edgeAudits.length; index += 1) {
    const edge = path.edgeAudits[index];
    if (
      edge.fromEta !== etaValues[index]
      || edge.toEta !== etaValues[index + 1]
      || !deepExactEqual(edge.acceptedUnknowns, path.nodes[index + 1].unknowns)
    ) return false;
  }
  return true;
}

function scaledInfinityDistance(
  left: readonly number[],
  right: readonly number[],
  scales: readonly number[],
): number {
  if (left.length !== right.length || left.length !== scales.length) {
    throw new Error("eta-one stitch scaled-vector dimension drifted");
  }
  if (
    !denseArray(left, left.length)
    || !denseArray(right, right.length)
    || !denseArray(scales, scales.length)
    || left.some((value) => !Number.isFinite(value))
    || right.some((value) => !Number.isFinite(value))
    || scales.some((value) => !Number.isFinite(value) || !(value > 0))
  ) throw new Error("eta-one stitch scaled vector is sparse or non-finite");
  return Math.max(0, ...left.map((value, index) =>
    Math.abs((value - right[index]) / scales[index])));
}

function arrayExact(
  left: readonly number[],
  right: readonly number[],
): boolean {
  if (
    left.length !== right.length
    || !denseArray(left, left.length)
    || !denseArray(right, right.length)
  ) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (!Object.is(left[index], right[index])) return false;
  }
  return true;
}

function denseArray(
  values: readonly unknown[],
  expectedLength: number,
): boolean {
  if (values.length !== expectedLength) return false;
  const keys = Object.keys(values).sort();
  const expectedKeys = Array.from(
    { length: expectedLength },
    (_, index) => String(index),
  ).sort();
  return keys.length === expectedKeys.length
    && keys.every((key, index) => key === expectedKeys[index]);
}

function deepExactEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (
    left === null || right === null
    || typeof left !== "object" || typeof right !== "object"
    || Array.isArray(left) !== Array.isArray(right)
  ) return false;
  if (Array.isArray(left) && Array.isArray(right)) {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    return left.length === right.length
      && leftKeys.length === rightKeys.length
      && leftKeys.every((key, index) =>
        key === rightKeys[index]
        && deepExactEqual(
          (left as unknown as Readonly<Record<string, unknown>>)[key],
          (right as unknown as Readonly<Record<string, unknown>>)[key],
        ));
  }
  const leftRecord = left as Readonly<Record<string, unknown>>;
  const rightRecord = right as Readonly<Record<string, unknown>>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) =>
      key === rightKeys[index]
      && deepExactEqual(leftRecord[key], rightRecord[key]));
}
