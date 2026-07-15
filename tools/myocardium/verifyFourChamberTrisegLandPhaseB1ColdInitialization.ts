import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import * as ts from "typescript";
import {
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildFourChamberPhaseB1ProjectSyntheticColdInitializationStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticColdInitializationReadinessV1";
import {
  buildPhaseB1ProjectSyntheticColdNumericalEvidenceV1,
  phaseB1ProjectSyntheticColdNumericalEvidenceHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationNumericalEvidenceV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
  type PhaseB1ColdEffectiveTriSegAuditV1,
  type PhaseB1ColdHomotopyPathSuccessV1,
  type PhaseB1ColdNodeResultV1,
  type PhaseB1ColdNodeSuccessV1,
  type PhaseB1ProjectSyntheticColdInitializationResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  buildPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1,
  phaseB1ProjectSyntheticColdInitializationEvidenceManifestHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationEvidenceManifestV1";
import type {
  PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import type {
  PhaseB1SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  auditPhaseB1ColdNodeIndependentlyV1,
  type PhaseB1ColdNodeIndependentAuditResultV1,
} from "@/tools/myocardium/auditFourChamberTrisegLandPhaseB1ColdNodeIndependent";

const EXPECTED_COLD_MANIFEST_SHA256 =
  "eacff4e5019d4b7650cd7bba7c3999994ebee674f37093177e572bfef7fa33b7";
const EXPECTED_COLD_READINESS_SHA256 =
  "401b5e5b29b8ed33794d693074f199773e45b142d44a6191ebf3ab7fd956f994";
const EXPECTED_COLD_NUMERICAL_EVIDENCE_SHA256 =
  "1f3066c237c5fb5661a66824968d6f924f243803a2b5f570d2832fc2d28a01d9";

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

const failures: string[] = [];
const independentNodeAuditCache = new Map<
  string,
  PhaseB1ColdNodeIndependentAuditResultV1
>();
let productionImportGraphCache: ReadonlyMap<string, readonly string[]> | null = null;
const NON_PRODUCTION_DIRECTORIES = new Set([
  ".git",
  ".github",
  ".claude",
  ".codex",
  ".firebase",
  "__tests__",
  "dist",
  "docs",
  "migrated_prompt_history",
  "node_modules",
  "tools",
]);
const manifest =
  buildPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1(sha256);
const numericalEvidence =
  buildPhaseB1ProjectSyntheticColdNumericalEvidenceV1(manifest, sha256);
const readiness =
  buildFourChamberPhaseB1ProjectSyntheticColdInitializationStatusV1(
    manifest,
    numericalEvidence,
  );
const readinessSha256 = computeCanonicalSha256(readiness, sha256);

verifyManifestAndClaims();
const results = numericalEvidence.results;
const modeMetrics = Object.freeze({
  on: verifyMode(results.on),
  off: verifyMode(results.off),
});
const topologyParity = verifyTopologyParity(results.on, results.off);
verifyWarmStartIndependence();
verifyRuntimeBoundary();

const implementationPass = failures.length === 0;
const report = {
  pass: implementationPass,
  projectSyntheticColdInitializationImplementationPass: implementationPass,
  physiologicalColdInitializationPass: false,
  acceptedPhaseB1ReferenceBranchPass: false,
  phaseB0SupportedEnvelopePass: false,
  continuousIntervalRegularityPass: false,
  globalRootUniquenessPass: false,
  energeticStabilityPass: false,
  stationaryCirculationInitializationPass: false,
  phaseB1AcceptancePass: false,
  supportedEnvelopePass: false,
  physiologicalValidationPass: false,
  releaseRuntimePass: false,
  hashes: {
    coldInitializationManifestSha256: manifest.contentSha256,
    coldInitializationReadinessSha256: readinessSha256,
    coldInitializationNumericalEvidenceSha256:
      numericalEvidence.certificate.contentSha256,
    verticalSliceDescriptorSha256:
      manifest.lineage.verticalSliceDescriptorSha256,
    verticalSliceManifestSha256:
      manifest.lineage.verticalSliceManifestSha256,
    verticalSliceReadinessSha256:
      manifest.lineage.verticalSliceReadinessSha256,
    b0StaticRestoringThresholdSemanticsManifestSha256:
      manifest.lineage.b0StaticRestoringThresholdSemanticsManifestSha256,
    protocolDefinitionSha256:
      manifest.bindings.protocolDefinitionSha256,
    fixedInputsSha256: manifest.bindings.fixedInputsSha256,
    topologyBySlsModeSha256:
      manifest.bindings.topologyBySlsModeSha256,
    policySha256: manifest.bindings.policySha256,
    modelBindingsSha256: manifest.bindings.modelBindingsSha256,
    prohibitedOperationsSha256:
      manifest.bindings.prohibitedOperationsSha256,
    claimBoundarySha256: manifest.bindings.claimBoundarySha256,
  },
  evidenceBoundary: readiness.evidenceBoundary,
  activeAnchor: {
    targetTransmuralPressurePa:
      manifest.protocolDefinition.fixedInputs.anchorTargetTransmuralPressurePa,
    fiberStressPaByWall:
      manifest.protocolDefinition.fixedInputs.activeAnchorFiberStressPaByWall,
  },
  modeMetrics,
  topologyParity,
  deferred: manifest.deferred,
  negativeClaims: manifest.negativeClaims,
  failures,
};

// eslint-disable-next-line no-console
console.log(JSON.stringify(report, null, 2));
if (!report.pass) process.exitCode = 1;

function verifyManifestAndClaims(): void {
  if (
    computeCanonicalSha256(
      phaseB1ProjectSyntheticColdInitializationEvidenceManifestHashPayloadV1(
        manifest,
      ),
      sha256,
    ) !== manifest.contentSha256
  ) failures.push("cold-initialization manifest hash is not canonical");
  if (manifest.contentSha256 !== EXPECTED_COLD_MANIFEST_SHA256) {
    failures.push("cold-initialization manifest drifted without a version update");
  }
  if (readinessSha256 !== EXPECTED_COLD_READINESS_SHA256) {
    failures.push("cold-initialization readiness drifted without a version update");
  }
  if (
    computeCanonicalSha256(
      phaseB1ProjectSyntheticColdNumericalEvidenceHashPayloadV1(
        numericalEvidence.certificate,
      ),
      sha256,
    ) !== numericalEvidence.certificate.contentSha256
    || numericalEvidence.certificate.contentSha256
      !== EXPECTED_COLD_NUMERICAL_EVIDENCE_SHA256
    || !numericalEvidence.certificate.allModesPass
    || readiness.bindings.numericalEvidenceSha256
      !== numericalEvidence.certificate.contentSha256
  ) failures.push("cold numerical evidence/readiness binding failed");
  const protocol = manifest.protocolDefinition;
  if (
    manifest.bindings.protocolDefinitionSha256
      !== computeCanonicalSha256(protocol, sha256)
    || manifest.bindings.fixedInputsSha256
      !== computeCanonicalSha256(protocol.fixedInputs, sha256)
    || manifest.bindings.topologyBySlsModeSha256
      !== computeCanonicalSha256(protocol.topologyBySlsMode, sha256)
    || manifest.bindings.policySha256
      !== computeCanonicalSha256(protocol.policy, sha256)
    || manifest.bindings.modelBindingsSha256
      !== computeCanonicalSha256(protocol.bindings, sha256)
    || manifest.bindings.prohibitedOperationsSha256
      !== computeCanonicalSha256(protocol.prohibitedOperations, sha256)
    || manifest.bindings.claimBoundarySha256
      !== computeCanonicalSha256(protocol.claimBoundary, sha256)
  ) failures.push("cold-initialization inner evidence hashes disagree");
  if (
    Object.values(manifest.implementationClaims).some((value) => value !== true)
    || Object.values(manifest.deferred).some((value) => value !== true)
    || Object.values(manifest.negativeClaims).some((value) => value !== false)
    || Object.values(protocol.prohibitedOperations).some((value) => value !== false)
    || Object.values(protocol.claimBoundary).some((value) => value !== false)
  ) failures.push("cold-initialization claim boundary drifted");
  if (
    !readiness.projectSyntheticColdInitializationImplementationPass
    || readiness.physiologicalColdInitializationPass
    || readiness.acceptedPhaseB1ReferenceBranchPass
    || readiness.phaseB0SupportedEnvelopePass
    || readiness.continuousIntervalRegularityPass
    || readiness.globalRootUniquenessPass
    || readiness.energeticStabilityPass
    || readiness.stationaryCirculationInitializationPass
    || readiness.phaseB1AcceptancePass
    || readiness.supportedEnvelopePass
    || readiness.physiologicalValidationPass
    || readiness.releaseRuntimePass
  ) failures.push("cold-initialization readiness overclaims acceptance or release");
}

function verifyMode(
  result: PhaseB1ProjectSyntheticColdInitializationResultV1,
): unknown {
  const mode = result.slsMode;
  const policy = PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1;
  if (!result.projectSyntheticColdInitializationImplementationPass) {
    failures.push(`${mode} cold-initialization high-level implementation flag failed`);
  }
  if (result.layout.unknownCount !== (mode === "on" ? 37 : 32)) {
    failures.push(`${mode} cold unknown count drifted`);
  }
  const successfulPaths: PhaseB1ColdHomotopyPathSuccessV1[] = [];
  let maximumScaledResidualInfinityNorm = 0;
  let maximumLocalMaterialResidualInfinityNorm = 0;
  let minimumLandSimplexMargin = Number.POSITIVE_INFINITY;
  let minimumEffectiveTriSegSigma = Number.POSITIVE_INFINITY;
  let maximumEffectiveTriSegConditionNumber2 = 0;
  let maximumSchurToReequilibratedDifferenceTwoNorm = 0;
  let minimumStaticRestoringMargin = Number.POSITIVE_INFINITY;
  let maximumIndependentResidualDifference = 0;
  let maximumIndependentTangentDifference = 0;
  let minimumIndependentMaterialRelativePivot = Number.POSITIVE_INFINITY;
  let maximumPathEntryCorrectionScaledInfinityNorm = 0;
  const anchorUnknowns = encodeColdEndpointForMode(result.anchorEndpoint, mode);
  for (const [pathIndex, path] of result.forwardPaths.entries()) {
    const expectedCount = policy.subdivisionCounts[pathIndex];
    if (path.completed === false) {
      failures.push(`${mode} ${expectedCount}-segment path failed: ${path.failedNode.message}`);
      continue;
    }
    successfulPaths.push(path);
    const expectedEtas = Array.from(
      { length: expectedCount + 1 },
      (_, index) => index / expectedCount,
    );
    if (
      path.requestedSubdivisionCount !== expectedCount
      || !vectorsRoundoffEqual(path.requestedEtaValues, expectedEtas)
      || !vectorsRoundoffEqual(path.attemptedEtaValues, expectedEtas)
      || path.nodes.length !== expectedEtas.length
      || path.hiddenSubdivisionApplied
      || path.pseudoArclengthApplied
      || path.projectionApplied
      || path.clippingApplied
      || path.nearestRootSelectionApplied
      || path.minimumResidualRootSelectionApplied
      || path.maximumJunctionRadiusRootSelectionApplied
    ) failures.push(`${mode} ${expectedCount}-segment path trace drifted`);
    verifyPathMetrics(
      mode,
      `${expectedCount}-segment forward`,
      path,
      anchorUnknowns,
      result.layout.unknownScales,
    );
    maximumPathEntryCorrectionScaledInfinityNorm = Math.max(
      maximumPathEntryCorrectionScaledInfinityNorm,
      path.pathEntryCorrectionScaledInfinityNorm,
    );
    for (const [nodeIndex, node] of path.nodes.entries()) {
      if (node.eta !== expectedEtas[nodeIndex]) {
        failures.push(`${mode} ${expectedCount}-segment node eta drifted`);
      }
      const raw = verifyNode(mode, node, result);
      maximumScaledResidualInfinityNorm = Math.max(
        maximumScaledResidualInfinityNorm,
        raw.scaledResidualInfinityNorm,
      );
      maximumLocalMaterialResidualInfinityNorm = Math.max(
        maximumLocalMaterialResidualInfinityNorm,
        raw.maximumLocalMaterialResidualInfinityNorm,
      );
      minimumLandSimplexMargin = Math.min(
        minimumLandSimplexMargin,
        raw.minimumLandSimplexMargin,
      );
      minimumEffectiveTriSegSigma = Math.min(
        minimumEffectiveTriSegSigma,
        raw.sigmaMinimum,
      );
      maximumEffectiveTriSegConditionNumber2 = Math.max(
        maximumEffectiveTriSegConditionNumber2,
        raw.conditionNumber2,
      );
      maximumSchurToReequilibratedDifferenceTwoNorm = Math.max(
        maximumSchurToReequilibratedDifferenceTwoNorm,
        raw.schurDifference,
      );
      minimumStaticRestoringMargin = Math.min(
        minimumStaticRestoringMargin,
        raw.robustSignedMargin,
      );
      maximumIndependentResidualDifference = Math.max(
        maximumIndependentResidualDifference,
        raw.independentResidualDifference,
      );
      maximumIndependentTangentDifference = Math.max(
        maximumIndependentTangentDifference,
        raw.independentTangentGate,
      );
      minimumIndependentMaterialRelativePivot = Math.min(
        minimumIndependentMaterialRelativePivot,
        raw.independentMaterialMinimumRelativePivot,
      );
    }
  }
  const recomputedEndpointAgreement = successfulPaths.length === result.forwardPaths.length
    ? maximumPairwiseDistance(
      successfulPaths.map((path) => path.endpoint.unknowns),
      result.layout.unknownScales,
    )
    : null;
  if (
    recomputedEndpointAgreement === null
    || result.maximumEndpointAgreementScaledInfinityNorm === null
    || !roundoffEqual(
      recomputedEndpointAgreement,
      result.maximumEndpointAgreementScaledInfinityNorm,
    )
    || recomputedEndpointAgreement > policy.endpointAgreementScaledInfinityTolerance
  ) failures.push(`${mode} endpoint agreement audit failed`);
  const reverse = result.canonicalReversePath;
  let recomputedReverseClosure: number | null = null;
  if (reverse?.completed !== true) {
    failures.push(`${mode} canonical reverse path did not complete`);
  } else {
    const expectedReverse = Array.from(
      { length: policy.canonicalSubdivisionCount + 1 },
      (_, index) => 1 - index / policy.canonicalSubdivisionCount,
    );
    if (
      !vectorsRoundoffEqual(reverse.requestedEtaValues, expectedReverse)
      || !vectorsRoundoffEqual(reverse.attemptedEtaValues, expectedReverse)
      || reverse.nodes.length !== expectedReverse.length
      || reverse.hiddenSubdivisionApplied
      || reverse.pseudoArclengthApplied
      || reverse.projectionApplied
      || reverse.clippingApplied
      || reverse.nearestRootSelectionApplied
      || reverse.minimumResidualRootSelectionApplied
      || reverse.maximumJunctionRadiusRootSelectionApplied
    ) failures.push(`${mode} reverse trace drifted`);
    const reverseEntry = result.canonicalForwardPath?.endpoint.unknowns ?? null;
    if (reverseEntry === null) {
      failures.push(`${mode} reverse path lacks canonical entry`);
    } else {
      verifyPathMetrics(
        mode,
        "canonical reverse",
        reverse,
        reverseEntry,
        result.layout.unknownScales,
      );
      maximumPathEntryCorrectionScaledInfinityNorm = Math.max(
        maximumPathEntryCorrectionScaledInfinityNorm,
        reverse.pathEntryCorrectionScaledInfinityNorm,
      );
    }
    reverse.nodes.forEach((node, nodeIndex) => {
      if (node.eta !== expectedReverse[nodeIndex]) {
        failures.push(`${mode} reverse node eta drifted`);
      }
      verifyNode(
        mode,
        node,
        result,
        true,
        `reverse eta=${node.eta}`,
      );
    });
    recomputedReverseClosure = scaledInfinityDistance(
      reverse.endpoint.unknowns,
      encodeColdEndpointForMode(result.anchorEndpoint, mode),
      result.layout.unknownScales,
    );
    if (
      result.reverseClosureScaledInfinityNorm === null
      || !roundoffEqual(
        recomputedReverseClosure,
        result.reverseClosureScaledInfinityNorm,
      )
      || recomputedReverseClosure > policy.reverseClosureScaledInfinityTolerance
    ) failures.push(`${mode} reverse closure audit failed`);
  }
  const censusMetrics = result.rootCensus.map((census) => {
    const expectedClusters = EXPECTED_ENDPOINT_ROOT_CENSUS[census.eta];
    const everySeedConverged = census.results.every((root) => root.converged);
    const convergedRootCount = census.results.filter((root) => root.converged).length;
    const seedsMatchPolicy = census.seeds.length === policy.enumerationSeeds.length
      && census.seeds.every((seed, seedIndex) => {
        const expectedSeed = policy.enumerationSeeds[seedIndex];
        return expectedSeed !== undefined
          && roundoffEqual(seed.V_m_S, expectedSeed.V_m_S)
          && roundoffEqual(seed.y_m, expectedSeed.y_m);
      });
    if (
      census.results.length !== policy.enumerationSeeds.length
      || !seedsMatchPolicy
      || !census.enumerationCompleted
      || !census.allSeedsAttempted
      || !census.allSeedsConverged
      || !everySeedConverged
      || convergedRootCount !== policy.enumerationSeeds.length
      || census.convergedRootCount !== convergedRootCount
      || census.selectionInputToAcceptedPath
      || census.globalExhaustivenessClaimed
      || !census.allDiscoveredRootsReported
    ) failures.push(`${mode} eta=${census.eta} root census boundary drifted`);
    census.results.forEach((root, seedIndex) => {
      if (!root.converged) return;
      verifyNode(
        mode,
        root,
        result,
        false,
        `census eta=${census.eta} seed=${seedIndex}`,
      );
    });
    const recomputedClusters = clusterConvergedRoots(
      census.results,
      result.layout.unknownScales,
      policy.rootClusteringScaledInfinityTolerance,
    );
    if (
      recomputedClusters.length !== census.clusters.length
      || recomputedClusters.length !== expectedClusters.length
    ) failures.push(`${mode} eta=${census.eta} root census cluster count drifted`);
    const coordinateScales = result.layout.unknownScales.slice(-2);
    for (let clusterIndex = 0; clusterIndex < recomputedClusters.length; clusterIndex += 1) {
      const recomputed = recomputedClusters[clusterIndex];
      const reported = census.clusters[clusterIndex];
      const expected = expectedClusters[clusterIndex];
      if (
        reported === undefined
        || expected === undefined
        || reported.representativeResultIndex !== recomputed.representativeResultIndex
        || !numberArraysEqual(reported.memberResultIndices, recomputed.memberResultIndices)
        || reported.classification !== recomputed.classification
        || !roundoffEqual(reported.coordinates.V_m_S, recomputed.coordinates.V_m_S)
        || !roundoffEqual(reported.coordinates.y_m, recomputed.coordinates.y_m)
      ) {
        failures.push(
          `${mode} eta=${census.eta} root census reported cluster ${clusterIndex} drifted`,
        );
      }
      if (
        expected === undefined
        || recomputed.representativeResultIndex !== expected.representativeResultIndex
        || !numberArraysEqual(
          recomputed.memberResultIndices,
          expected.memberResultIndices,
        )
        || recomputed.classification !== expected.classification
        || scaledInfinityDistance(
          [recomputed.coordinates.V_m_S, recomputed.coordinates.y_m],
          [expected.coordinates.V_m_S, expected.coordinates.y_m],
          coordinateScales,
        ) > policy.rootClusteringScaledInfinityTolerance
      ) {
        failures.push(
          `${mode} eta=${census.eta} frozen root cluster ${clusterIndex} drifted`,
        );
      }
    }
    return Object.freeze({
      eta: census.eta,
      seedCount: census.seeds.length,
      convergedRootCount: census.convergedRootCount,
      discoveredClusterCount: census.clusters.length,
      discoveredClasses: census.clusters.map((cluster) => cluster.classification),
      globalExhaustivenessClaimed: census.globalExhaustivenessClaimed,
    });
  });
  return Object.freeze({
    unknownCount: result.layout.unknownCount,
    materialUnknownCount: result.layout.materialUnknownCount,
    forwardSubdivisionCounts: successfulPaths.map(
      (path) => path.requestedSubdivisionCount,
    ),
    maximumAcceptedNodeStepScaledInfinityNorm: Math.max(
      ...successfulPaths.map((path) =>
        path.maximumAcceptedNodeStepScaledInfinityNorm),
    ),
    maximumPredictorCorrectionScaledInfinityNorm: Math.max(
      ...successfulPaths.map((path) =>
        path.maximumPredictorCorrectionScaledInfinityNorm),
    ),
    maximumPathEntryCorrectionScaledInfinityNorm,
    maximumScaledResidualInfinityNorm,
    maximumLocalMaterialResidualInfinityNorm,
    minimumLandSimplexMargin,
    minimumEffectiveTriSegSigma,
    maximumEffectiveTriSegConditionNumber2,
    maximumSchurToReequilibratedDifferenceTwoNorm,
    minimumStaticRestoringMargin,
    maximumIndependentResidualDifference,
    maximumIndependentTangentDifference,
    minimumIndependentMaterialRelativePivot,
    endpointAgreementScaledInfinityNorm: recomputedEndpointAgreement,
    reverseClosureScaledInfinityNorm: recomputedReverseClosure,
    maximumCanonicalMaterialParityRelativeDifference:
      result.maximumCanonicalParityRelativeDifference,
    rootCensus: censusMetrics,
  });
}

function verifyPathMetrics(
  mode: PhaseB1SlsModeV1,
  label: string,
  path: PhaseB1ColdHomotopyPathSuccessV1,
  entryUnknowns: readonly number[],
  scales: readonly number[],
): void {
  const policy = PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1;
  const entryCorrection = scaledInfinityDistance(
    entryUnknowns,
    path.nodes[0].unknowns,
    scales,
  );
  const recomputedSteps = path.nodes.slice(1).map((node, index) =>
    scaledInfinityDistance(path.nodes[index].unknowns, node.unknowns, scales));
  const recomputedCorrections = path.edgeAudits.map((edge) =>
    scaledInfinityDistance(edge.predictorUnknowns, edge.acceptedUnknowns, scales));
  const maximumStep = recomputedSteps.length === 0 ? 0 : Math.max(...recomputedSteps);
  const maximumCorrection = recomputedCorrections.length === 0
    ? 0
    : Math.max(...recomputedCorrections);
  if (
    path.edgeAudits.length !== Math.max(0, path.nodes.length - 1)
    || !roundoffEqual(path.pathEntryCorrectionScaledInfinityNorm, entryCorrection)
    || entryCorrection > policy.maximumPathEntryCorrectionScaledInfinityNorm
    || !roundoffEqual(path.maximumAcceptedNodeStepScaledInfinityNorm, maximumStep)
    || maximumStep > policy.maximumAcceptedNodeStepScaledInfinityNorm
    || !roundoffEqual(
      path.maximumPredictorCorrectionScaledInfinityNorm,
      maximumCorrection,
    )
    || maximumCorrection > policy.maximumPredictorCorrectionScaledInfinityNorm
  ) failures.push(`${mode} ${label} path metric audit failed`);
  path.edgeAudits.forEach((edge, index) => {
    const from = path.nodes[index];
    const to = path.nodes[index + 1];
    if (
      from === undefined
      || to === undefined
      || !roundoffEqual(edge.fromEta, from.eta)
      || !roundoffEqual(edge.toEta, to.eta)
      || !vectorsRoundoffEqual(edge.acceptedUnknowns, to.unknowns)
      || !roundoffEqual(
        edge.acceptedNodeStepScaledInfinityNorm,
        recomputedSteps[index],
      )
      || !roundoffEqual(
        edge.predictorCorrectionScaledInfinityNorm,
        recomputedCorrections[index],
      )
    ) failures.push(`${mode} ${label} edge ${index} audit failed`);
  });
}

function verifyNode(
  mode: PhaseB1SlsModeV1,
  node: PhaseB1ColdNodeSuccessV1,
  result: PhaseB1ProjectSyntheticColdInitializationResultV1,
  requireAcceptedRestoring = true,
  auditLabel = `eta=${node.eta}`,
) {
  const residual = node.residualEvaluation.residual;
  const scaledResidualInfinityNorm = Math.max(
    ...residual.map((value, row) =>
      Math.abs(value / result.layout.residualScales[row])),
  );
  let maximumPopulation = 0;
  let maximumDistortion = 0;
  for (let wallIndex = 0; wallIndex < WALL_IDS.length; wallIndex += 1) {
    const offset = 6 * wallIndex;
    maximumPopulation = Math.max(
      maximumPopulation,
      ...residual.slice(offset, offset + 4).map(Math.abs),
    );
    maximumDistortion = Math.max(
      maximumDistortion,
      ...residual.slice(offset + 4, offset + 6).map(Math.abs),
    );
  }
  const slsOffset = 6 * WALL_IDS.length;
  const maximumSls = mode === "on"
    ? Math.max(...residual.slice(slsOffset, slsOffset + WALL_IDS.length).map(Math.abs))
    : 0;
  const maximumLocalMaterialResidualInfinityNorm = Math.max(
    maximumPopulation,
    maximumDistortion,
    maximumSls,
  );
  const minimumLandSimplexMargin = rawMinimumLandSimplexMargin(node.unknowns);
  const triSeg = recomputeTriSegAudit(node.effectiveTriSegAudit);
  const independent = independentNodeAudit(mode, node);
  const independentResidualDifference = Math.max(
    ...residual.map((value, row) => Math.abs(
      value - independent.residual[row],
    ) / result.layout.residualScales[row]),
  );
  const independentSchurDifference = matrixTwoNorm(subtractMatrix(
    node.effectiveTriSegAudit.scaledSchurGeneralizedForceTangent,
    independent.materialSchur.scaledGeneralizedForceTangent,
  ));
  const independentCoarseDifference = matrixTwoNorm(subtractMatrix(
    node.effectiveTriSegAudit.scaledReequilibratedCoarseTangent,
    independent.reequilibrated.scaledCoarseGeneralizedForceTangent,
  ));
  const independentFineDifference = matrixTwoNorm(subtractMatrix(
    node.effectiveTriSegAudit.scaledReequilibratedFineTangent,
    independent.reequilibrated.scaledFineGeneralizedForceTangent,
  ));
  const independentTangentGate = Math.max(
    independentSchurDifference,
    independentCoarseDifference,
    independentFineDifference,
  );
  const independentClassificationAccepted = requireAcceptedRestoring
    ? independent.tangentDiagnostics.classification === "robust-restoring"
      && independent.tangentDiagnostics.robustSignedMargin
        >= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
          .minimumStaticRestoringMargin
    : true;
  if (
    residual.length !== result.layout.unknownCount
    || node.unknowns.length !== result.layout.unknownCount
    || scaledResidualInfinityNorm
      > PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumScaledColdResidualInfinityNorm
    || maximumLocalMaterialResidualInfinityNorm
      > PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumLocalMaterialResidualInfinityNorm
    || !(minimumLandSimplexMargin > 0)
    || node.projectionApplied
    || node.clippingApplied
    || node.fallbackApplied
    || node.residualEvaluation.projectionApplied
    || node.residualEvaluation.clippingApplied
    || (requireAcceptedRestoring && !triSeg.accepted)
    || independent.endpointUnknownScaledInfinityDifference > 1e-12
    || independentResidualDifference
      > PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumScaledColdResidualInfinityNorm
    || independent.scaledResidualInfinityNorm
      > PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumScaledColdResidualInfinityNorm
    || independentTangentGate
      > PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumSchurToReequilibratedTangentDifferenceTwoNorm
    || independent.materialSchur.minimumRelativePivot
      <= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .relativePivotTolerance
    || independent.tangentDiagnostics.classification
      !== node.effectiveTriSegAudit.classification
    || independent.reequilibrated.taylorTensionErrorDomainEligible
      !== node.effectiveTriSegAudit.withinPublishedTaylorTwoPercentTensionErrorDomain
    || !independentClassificationAccepted
    || independent.tangentDiagnostics.sigmaMinimum
      < PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .minimumEffectiveTriSegSigma
    || independent.tangentDiagnostics.conditionNumber2
      > PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumEffectiveTriSegConditionNumber2
    || independent.tangentDiagnostics.schurToReequilibratedDifferenceTwoNorm
      > PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumSchurToReequilibratedTangentDifferenceTwoNorm
  ) failures.push(`${mode} ${auditLabel} raw node audit failed`);
  verifyFixedEndpoint(node.endpoint, mode);
  return Object.freeze({
    scaledResidualInfinityNorm,
    maximumLocalMaterialResidualInfinityNorm,
    minimumLandSimplexMargin,
    sigmaMinimum: independent.tangentDiagnostics.sigmaMinimum,
    conditionNumber2: independent.tangentDiagnostics.conditionNumber2,
    schurDifference:
      independent.tangentDiagnostics.schurToReequilibratedDifferenceTwoNorm,
    robustSignedMargin: independent.tangentDiagnostics.robustSignedMargin,
    independentResidualDifference,
    independentTangentGate,
    independentMaterialMinimumRelativePivot:
      independent.materialSchur.minimumRelativePivot,
  });
}

function independentNodeAudit(
  mode: PhaseB1SlsModeV1,
  node: PhaseB1ColdNodeSuccessV1,
): PhaseB1ColdNodeIndependentAuditResultV1 {
  const key = `${mode}|${node.eta}|${node.unknowns.map((value) =>
    value.toPrecision(17)).join(",")}`;
  const cached = independentNodeAuditCache.get(key);
  if (cached !== undefined) return cached;
  const audit = auditPhaseB1ColdNodeIndependentlyV1({
    slsMode: mode,
    eta: node.eta,
    endpoint: node.endpoint,
    unknowns: node.unknowns,
    sha256Hex: sha256,
  });
  independentNodeAuditCache.set(key, audit);
  return audit;
}

function recomputeTriSegAudit(audit: PhaseB1ColdEffectiveTriSegAuditV1) {
  const fine = audit.scaledReequilibratedFineTangent;
  const off = 0.5 * (fine[1] + fine[2]);
  const symmetric = [fine[0], off, off, fine[3]] as const;
  const traceHalf = 0.5 * (symmetric[0] + symmetric[3]);
  const radius = Math.hypot(0.5 * (symmetric[0] - symmetric[3]), symmetric[1]);
  const eigenvalues = [traceHalf - radius, traceHalf + radius] as const;
  const coarseDifference = subtractMatrix(
    audit.scaledReequilibratedCoarseTangent,
    fine,
  );
  const disagreement = matrixTwoNorm(coarseDifference);
  const uncertainty = Math.max(
    PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
      .derivativeDisagreementMultiplier * disagreement,
    PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
      .relativeStaticTangentUncertaintyFloor
      * Math.max(1, Math.abs(eigenvalues[0]), Math.abs(eigenvalues[1])),
  );
  const classification = eigenvalues[0] > uncertainty
    ? "robust-restoring"
    : eigenvalues[0] < -uncertainty && eigenvalues[1] > uncertainty
      ? "robust-saddle"
      : eigenvalues[1] < -uncertainty
        ? "robust-antirestoring-maximum"
        : "indeterminate";
  const robustSignedMargin = classification === "robust-restoring"
    ? eigenvalues[0] - uncertainty
    : Number.NEGATIVE_INFINITY;
  const diagnostics = diagnoseTwoByTwo(fine);
  const schurDifference = matrixTwoNorm(subtractMatrix(
    audit.scaledSchurGeneralizedForceTangent,
    fine,
  ));
  const accepted = classification === "robust-restoring"
    && robustSignedMargin
      >= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .minimumStaticRestoringMargin
    && diagnostics.sigmaMinimum
      >= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .minimumEffectiveTriSegSigma
    && diagnostics.conditionNumber2
      <= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumEffectiveTriSegConditionNumber2
    && schurDifference
      <= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumSchurToReequilibratedTangentDifferenceTwoNorm
    && audit.withinPublishedTaylorTwoPercentTensionErrorDomain;
  if (
    audit.classification !== classification
    || !roundoffEqual(audit.derivativeDisagreementTwoNorm, disagreement)
    || !roundoffEqual(audit.uncertaintyBound, uncertainty)
    || !roundoffEqual(audit.robustSignedMargin, robustSignedMargin)
    || !roundoffEqual(audit.sigmaMinimum, diagnostics.sigmaMinimum)
    || !roundoffEqual(audit.conditionNumber2, diagnostics.conditionNumber2)
    || !roundoffEqual(audit.schurToReequilibratedDifferenceTwoNorm, schurDifference)
    || audit.accepted !== accepted
    || audit.energeticStabilityClaimed
    || audit.globalUniquenessClaimed
  ) failures.push("cold effective-TriSeg audit fields disagree with raw matrices");
  return Object.freeze({
    accepted,
    sigmaMinimum: diagnostics.sigmaMinimum,
    conditionNumber2: diagnostics.conditionNumber2,
    schurDifference,
    robustSignedMargin,
  });
}

function verifyFixedEndpoint(
  endpoint: PhaseB1EndpointStateV1,
  mode: PhaseB1SlsModeV1,
): void {
  const fixed = manifest.protocolDefinition.fixedInputs;
  if (endpoint.differentialState.slsMode !== mode || endpoint.timeSec !== 0) {
    failures.push(`${mode} cold endpoint topology/time drifted`);
  }
  for (const id of BLOOD_COMPARTMENT_IDS) {
    if (endpoint.differentialState.bloodVolumesM3[id] !== fixed.bloodVolumesM3[id]) {
      failures.push(`${mode} cold endpoint changed fixed blood volume ${id}`);
    }
  }
  for (const id of INERTIAL_FLOW_IDS) {
    if (
      endpoint.differentialState.inertialFlowsM3PerSec[id]
        !== fixed.inertialFlowsM3PerSec[id]
    ) failures.push(`${mode} cold endpoint changed fixed flow ${id}`);
  }
  for (const wallId of WALL_IDS) {
    const calcium = endpoint.differentialState.calciumByWall[wallId];
    if (calcium.r !== 0 || calcium.d !== 0) {
      failures.push(`${mode} cold endpoint changed fixed calcium ${wallId}`);
    }
  }
  const total = BLOOD_COMPARTMENT_IDS.reduce(
    (sum, id) => sum + endpoint.differentialState.bloodVolumesM3[id],
    0,
  );
  if (!roundoffEqual(total, fixed.totalBloodVolumeM3)) {
    failures.push(`${mode} cold endpoint total blood volume drifted`);
  }
}

function verifyTopologyParity(
  on: PhaseB1ProjectSyntheticColdInitializationResultV1,
  off: PhaseB1ProjectSyntheticColdInitializationResultV1,
): unknown {
  const onEndpoint = on.canonicalForwardPath?.endpoint.endpoint;
  const offEndpoint = off.canonicalForwardPath?.endpoint.endpoint;
  if (onEndpoint === undefined || offEndpoint === undefined) {
    failures.push("SLS topology parity lacks canonical endpoints");
    return null;
  }
  let maximumSharedCoordinateDifference = 0;
  for (const wallId of WALL_IDS) {
    for (let index = 0; index < 6; index += 1) {
      maximumSharedCoordinateDifference = Math.max(
        maximumSharedCoordinateDifference,
        Math.abs(
          onEndpoint.differentialState.landByWall[wallId][index]
          - offEndpoint.differentialState.landByWall[wallId][index]
        ),
      );
    }
    if (onEndpoint.differentialState.slsMode !== "on") {
      failures.push("SLS-on cold endpoint lost alpha coordinates");
      continue;
    }
    const fiberLogStrain = on.canonicalForwardPath?.endpoint
      .residualEvaluation.wallMaterialByWall[wallId].fiberLogStrain;
    if (
      fiberLogStrain === undefined
      || Math.abs(
        onEndpoint.differentialState.slsAlphaVByWall[wallId] - fiberLogStrain,
      ) > 1e-12
    ) failures.push(`SLS-on ${wallId} alphaV cold constraint drifted`);
  }
  maximumSharedCoordinateDifference = Math.max(
    maximumSharedCoordinateDifference,
    Math.abs(onEndpoint.triSegCoordinates.V_m_S - offEndpoint.triSegCoordinates.V_m_S),
    Math.abs(onEndpoint.triSegCoordinates.y_m - offEndpoint.triSegCoordinates.y_m),
  );
  if (maximumSharedCoordinateDifference > 1e-12) {
    failures.push("SLS-on/off shared cold coordinates lost zero-overstress parity");
  }
  return Object.freeze({
    maximumSharedCoordinateAbsoluteDifference: maximumSharedCoordinateDifference,
    slsOnAlphaVEqualsFiberLogStrain: true,
    slsOffPhysicallyRemovesFiveAlphaCoordinates: true,
  });
}

function verifyWarmStartIndependence(): void {
  const root = process.cwd();
  const coldSolverPath = join(
    root,
    "engine",
    "myocardium",
    "fourChamberV1",
    "phaseB1",
    "projectSyntheticColdInitializationMaterialHomotopyV1.ts",
  );
  const graph = productionImportGraph(root);
  const reachable = reachableImportParents(graph, coldSolverPath);
  const prohibited = [...reachable.keys()].filter((path) => {
    if (path === coldSolverPath) return false;
    const repositoryPath = relative(root, path).split(sep).join("/");
    return /warm[-_]?start|short[-_]?horizon/i.test(repositoryPath);
  });
  for (const path of prohibited) {
    failures.push(
      `cold solver reaches prohibited warm-start/short-horizon source: ${formatImportChain(
        reachable,
        path,
        root,
      )}`,
    );
  }

  const independentAuditPath = join(
    root,
    "tools",
    "myocardium",
    "auditFourChamberTrisegLandPhaseB1ColdNodeIndependent.ts",
  );
  const auditGraph = importGraphWithAdditionalRoots(
    root,
    graph,
    [independentAuditPath],
  );
  const auditReachable = reachableImportParents(auditGraph, independentAuditPath);
  const prohibitedColdLayerReachability = [...auditReachable.keys()].filter((path) => {
    if (path === independentAuditPath) return false;
    const repositoryPath = relative(root, path).split(sep).join("/");
    return /\/phaseB1\/(?:projectSyntheticColdInitialization[^/]*|phaseB1ProjectSyntheticColdInitializationReadinessV1)\.ts$/.test(
      repositoryPath,
    );
  });
  for (const path of prohibitedColdLayerReachability) {
    failures.push(
      `independent cold-node audit reaches prohibited cold layer: ${formatImportChain(
        auditReachable,
        path,
        root,
      )}`,
    );
  }
}

function verifyRuntimeBoundary(): void {
  const root = process.cwd();
  const phaseB1SourceRoot = join(
    root,
    "engine",
    "myocardium",
    "fourChamberV1",
    "phaseB1",
  );
  const graph = productionImportGraph(root);
  const reached: string[] = [];
  for (const [importer, dependencies] of graph) {
    if (isWithinPath(importer, phaseB1SourceRoot)) continue;
    for (const dependency of dependencies) {
      if (!isWithinPath(dependency, phaseB1SourceRoot)) continue;
      reached.push(
        `${relative(root, importer).split(sep).join("/")} -> ${relative(
          root,
          dependency,
        ).split(sep).join("/")}`,
      );
    }
  }
  if (reached.length > 0) {
    failures.push(
      `Phase B1 sidecar reached production sources: ${reached.sort().join(", ")}`,
    );
  }
}

function rawMinimumLandSimplexMargin(unknowns: readonly number[]): number {
  let minimum = Number.POSITIVE_INFINITY;
  for (let wallIndex = 0; wallIndex < WALL_IDS.length; wallIndex += 1) {
    const offset = 6 * wallIndex;
    const ca = unknowns[offset];
    const b = unknowns[offset + 1];
    const w = unknowns[offset + 2];
    const s = unknowns[offset + 3];
    minimum = Math.min(minimum, ca, 1 - ca, b, w, s, 1 - b - w - s);
  }
  return minimum;
}

function encodeColdEndpointForMode(
  endpoint: PhaseB1EndpointStateV1,
  mode: PhaseB1SlsModeV1,
): readonly number[] {
  if (endpoint.differentialState.slsMode !== mode) {
    throw new Error("cold endpoint mode mismatch");
  }
  return Object.freeze([
    ...WALL_IDS.flatMap((wallId) => endpoint.differentialState.landByWall[wallId]),
    ...(mode === "on"
      ? WALL_IDS.map((wallId) => {
        if (endpoint.differentialState.slsMode !== "on") {
          throw new Error("cold endpoint lost SLS state");
        }
        return endpoint.differentialState.slsAlphaVByWall[wallId];
      })
      : []),
    endpoint.triSegCoordinates.V_m_S,
    endpoint.triSegCoordinates.y_m,
  ]);
}

function clusterConvergedRoots(
  results: readonly PhaseB1ColdNodeResultV1[],
  scales: readonly number[],
  tolerance: number,
): readonly Readonly<{
  representativeResultIndex: number;
  memberResultIndices: readonly number[];
  classification: PhaseB1ColdEffectiveTriSegAuditV1["classification"];
  coordinates: Readonly<{ V_m_S: number; y_m: number }>;
}>[] {
  const clusters: Array<{
    representativeResultIndex: number;
    memberResultIndices: number[];
    classification: PhaseB1ColdEffectiveTriSegAuditV1["classification"];
    coordinates: Readonly<{ V_m_S: number; y_m: number }>;
  }> = [];
  results.forEach((result, index) => {
    if (!result.converged) return;
    const existing = clusters.find((cluster) => {
      const representative = results[cluster.representativeResultIndex];
      return representative?.converged === true
        && scaledInfinityDistance(representative.unknowns, result.unknowns, scales)
          <= tolerance;
    });
    if (existing === undefined) {
      clusters.push({
        representativeResultIndex: index,
        memberResultIndices: [index],
        classification: result.effectiveTriSegAudit.classification,
        coordinates: Object.freeze({ ...result.endpoint.triSegCoordinates }),
      });
    } else existing.memberResultIndices.push(index);
  });
  return Object.freeze(clusters.map((cluster) => Object.freeze({
    ...cluster,
    memberResultIndices: Object.freeze(cluster.memberResultIndices),
  })));
}

function numberArraysEqual(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function maximumPairwiseDistance(
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

function scaledInfinityDistance(
  left: readonly number[],
  right: readonly number[],
  scales: readonly number[],
): number {
  if (left.length !== right.length || left.length !== scales.length) {
    throw new Error("cold verifier scaled-distance dimension mismatch");
  }
  return Math.max(...left.map((value, index) =>
    Math.abs(value - right[index]) / scales[index]));
}

function diagnoseTwoByTwo(matrix: readonly [number, number, number, number]) {
  const trace = matrix.reduce((sum, value) => sum + value * value, 0);
  const determinant = matrix[0] * matrix[3] - matrix[1] * matrix[2];
  const discriminant = Math.sqrt(Math.max(0, trace * trace - 4 * determinant * determinant));
  const sigmaMaximum = Math.sqrt(Math.max(0, 0.5 * (trace + discriminant)));
  const sigmaMinimum = Math.sqrt(Math.max(0, 0.5 * (trace - discriminant)));
  return Object.freeze({
    sigmaMinimum,
    conditionNumber2: sigmaMinimum > 0
      ? sigmaMaximum / sigmaMinimum
      : Number.POSITIVE_INFINITY,
  });
}

function subtractMatrix(
  left: readonly [number, number, number, number],
  right: readonly [number, number, number, number],
): readonly [number, number, number, number] {
  return [
    left[0] - right[0],
    left[1] - right[1],
    left[2] - right[2],
    left[3] - right[3],
  ];
}

function matrixTwoNorm(matrix: readonly [number, number, number, number]): number {
  const trace = matrix.reduce((sum, value) => sum + value * value, 0);
  const determinant = matrix[0] * matrix[3] - matrix[1] * matrix[2];
  return Math.sqrt(Math.max(0, 0.5 * (
    trace + Math.sqrt(Math.max(0, trace * trace - 4 * determinant * determinant))
  )));
}

function vectorsRoundoffEqual(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => roundoffEqual(value, right[index]));
}

function roundoffEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= 4096 * Number.EPSILON * Math.max(
    1,
    Math.abs(left),
    Math.abs(right),
  );
}

function productionImportGraph(
  root: string,
): ReadonlyMap<string, readonly string[]> {
  if (productionImportGraphCache !== null) return productionImportGraphCache;
  const files = productionTypescriptFilesRecursively(root);
  const fileSet = new Set(files);
  const graph = new Map<string, readonly string[]>();
  for (const file of files) {
    const dependencies = localDependencySpecifiers(file).flatMap((specifier) => {
      const resolved = resolveTypescriptDependency(root, file, specifier, fileSet);
      return resolved === null ? [] : [resolved];
    });
    graph.set(file, Object.freeze([...new Set(dependencies)]));
  }
  productionImportGraphCache = graph;
  return graph;
}

function importGraphWithAdditionalRoots(
  root: string,
  graph: ReadonlyMap<string, readonly string[]>,
  additionalRoots: readonly string[],
): ReadonlyMap<string, readonly string[]> {
  const files = new Set([...graph.keys(), ...additionalRoots]);
  const augmented = new Map(graph);
  for (const file of additionalRoots) {
    const dependencies = localDependencySpecifiers(file).flatMap((specifier) => {
      const resolved = resolveTypescriptDependency(root, file, specifier, files);
      return resolved === null ? [] : [resolved];
    });
    augmented.set(file, Object.freeze([...new Set(dependencies)]));
  }
  return augmented;
}

function productionTypescriptFilesRecursively(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && NON_PRODUCTION_DIRECTORIES.has(entry.name)) return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return productionTypescriptFilesRecursively(path);
    if (!entry.isFile() || !/\.tsx?$/.test(entry.name)) return [];
    if (
      /(?:^|\.)test\.tsx?$/.test(entry.name)
      || /(?:^|\.)spec\.tsx?$/.test(entry.name)
      || /^(?:vite|vitest)(?:\.[^.]+)*\.config\.ts$/.test(entry.name)
      || entry.name === "vitest.suites.ts"
      || entry.name === "test_blocknote.ts"
    ) return [];
    return [path];
  });
}

function localDependencySpecifiers(path: string): readonly string[] {
  const source = readFileSync(path, "utf8");
  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const specifiers = new Set<string>();
  const addLiteral = (node: ts.Expression | undefined) => {
    if (node !== undefined && ts.isStringLiteralLike(node)) {
      specifiers.add(node.text);
    }
  };
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      addLiteral(node.moduleSpecifier);
    } else if (ts.isCallExpression(node)) {
      if (
        node.expression.kind === ts.SyntaxKind.ImportKeyword
        || (ts.isIdentifier(node.expression) && node.expression.text === "require")
      ) addLiteral(node.arguments[0]);
    } else if (
      ts.isNewExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === "URL"
    ) addLiteral(node.arguments?.[0]);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return Object.freeze([...specifiers]);
}

function resolveTypescriptDependency(
  root: string,
  importer: string,
  rawSpecifier: string,
  files: ReadonlySet<string>,
): string | null {
  const specifier = rawSpecifier.replace(/[?#].*$/, "");
  const base = specifier.startsWith("@/")
    ? resolve(root, specifier.slice(2))
    : specifier.startsWith(".")
      ? resolve(dirname(importer), specifier)
      : null;
  if (base === null) return null;
  const extension = extname(base);
  const withoutJavaScriptExtension = /\.(?:c|m)?js$/.test(extension)
    ? base.slice(0, -extension.length)
    : base;
  const candidates = extension === ".ts" || extension === ".tsx"
    ? [base]
    : [
      `${withoutJavaScriptExtension}.ts`,
      `${withoutJavaScriptExtension}.tsx`,
      join(base, "index.ts"),
      join(base, "index.tsx"),
    ];
  return candidates.find((candidate) => files.has(candidate)) ?? null;
}

function reachableImportParents(
  graph: ReadonlyMap<string, readonly string[]>,
  start: string,
): ReadonlyMap<string, string | null> {
  const parents = new Map<string, string | null>([[start, null]]);
  const pending = [start];
  while (pending.length > 0) {
    const current = pending.shift();
    if (current === undefined) break;
    for (const dependency of graph.get(current) ?? []) {
      if (parents.has(dependency)) continue;
      parents.set(dependency, current);
      pending.push(dependency);
    }
  }
  return parents;
}

function formatImportChain(
  parents: ReadonlyMap<string, string | null>,
  target: string,
  root: string,
): string {
  const chain: string[] = [];
  let current: string | null | undefined = target;
  while (current !== null && current !== undefined) {
    chain.push(relative(root, current).split(sep).join("/"));
    current = parents.get(current);
  }
  return chain.reverse().join(" -> ");
}

function isWithinPath(candidate: string, directory: string): boolean {
  return candidate === directory || candidate.startsWith(`${directory}${sep}`);
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
