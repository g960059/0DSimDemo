import { createHash } from "node:crypto";
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
  type PhaseB0TriSegEnvelopeDirectedEdgeAuditV1,
  type PhaseB0TriSegEnvelopeNodeAuditV1,
  type PhaseB0TriSegEnvelopeNodeIdV1,
  type PhaseB0TriSegEnvelopePathAttemptV1,
  type PhaseB0TriSegFiniteSupportedEnvelopeFailureProbeV1,
  type PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeV1";
import {
  PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID,
  evaluatePhaseB0PublishedTriSegResidualV1,
  solvePhaseB0PublishedTriSegRootV1,
  type PhaseB0PublishedTriSegRootInputV1,
  type PhaseB0PublishedTriSegRootResultV1,
  type PhaseB0TriSegCoordinatesV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/publishedTriSegRootV1";
import {
  solveScaledDensePartialPivotLuV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledDampedNewtonV1";
import {
  buildPhaseB0SyntheticHydromechanicsCaseV1,
  type PhaseB0SyntheticHydromechanicsCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/syntheticHydromechanicsCaseV1";
import {
  createPhaseB0HydromechanicsInitialStateV1,
  evaluatePhaseB0HydromechanicsStateV1,
  type PhaseB0HydromechanicsStateV1,
  type PhaseB0SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/monolithicHydromechanicsBackwardEulerV1";
import {
  PHASE_B0_TRISEG_NATURAL_PARAMETER_CONTINUATION_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegNaturalParameterContinuationV1";
import {
  auditPhaseB0TriSegStaticRestoringRootV1,
  PHASE_B0_TRISEG_STATIC_RESTORING_AUDIT_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegStaticRestoringAuditV1";
import {
  buildPhaseB0TriSegStaticRestoringGateManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegStaticRestoringGateManifestV1";
import {
  PHASE_B0_VALVE_FLOW_IDS_V1,
  buildPhaseB0ValveNumericalPolicyCandidateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/valveNumericalPolicyV1";
import {
  assertCanonicalPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1,
  buildPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1,
  phaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeEvidenceManifestV1";
import {
  assertCanonicalPhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceV1,
  buildPhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceV1,
  phaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceHashPayloadV1,
  type PhaseB0TriSegFiniteSupportedEnvelopeModeSummaryV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeNumericalEvidenceV1";
import {
  PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTaylorOracle2009V1";
import type { PublishedTriSegGeometryV1 } from
  "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";
import { BLOOD_COMPARTMENT_IDS } from
  "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID,
  evaluatePhaseB0AlgorithmicJacobianV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/verifiedAlgorithmicJacobianV1";

const EXPECTED_MANIFEST_SHA256 =
  "701e9706965fcffd6604d2bde079ec40d5dec39781429ea074b8ab6edb9684a3";
const EXPECTED_NUMERICAL_EVIDENCE_SHA256 =
  "1832e54d6b2d8e91707dff7af71553620950c942c970e00968a39219eedbf9c1";
const EXPECTED_READINESS_SHA256 =
  "3319c2bcac060156d7a8b1e1b13f6440b2faf022c6359cf9467c7366f0bd9a52";

const manifest =
  buildPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1(sha256);
const fixture = buildPhaseB0SyntheticHydromechanicsCaseV1(sha256);
const staticGateManifest = buildPhaseB0TriSegStaticRestoringGateManifestV1(
  fixture,
  sha256,
);
const expectedContinuationPolicy = (() => {
  const local = staticGateManifest.localPredictorCorrectorRegression;
  return Object.freeze({
    parameterDerivativeScaledStep: local.parameterDerivativeScaledStep,
    minimumScaledLoadArclength: local.minimumScaledLoadArclength,
    maximumTangentPredictionHalvingDifferenceScaledInfinityNorm:
      local.maximumTangentPredictionHalvingDifferenceScaledInfinityNorm,
    maximumAnchorCorrectionScaledInfinityNorm:
      local.maximumAnchorCorrectionScaledInfinityNorm,
    maximumPredictorCorrectionScaledInfinityNorm:
      local.maximumPredictorCorrectionScaledInfinityNorm,
    maximumPredictorCorrectionToAcceptedCoordinateStepRatio:
      local.maximumPredictorCorrectionToAcceptedCoordinateStepRatio,
    maximumAcceptedScaledCoordinateStep:
      local.maximumAcceptedScaledCoordinateStep,
    minimumTangentDot: local.minimumTangentDot,
    relativePivotTolerance: local.relativePivotTolerance,
  });
})();
const nodeGateCache = Object.freeze({
  on: new WeakMap<object, boolean>(),
  off: new WeakMap<object, boolean>(),
});
const numericalEvidence =
  buildPhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceV1(
    manifest,
    sha256,
  );
const readiness = buildFourChamberPhaseB0TriSegFiniteSupportedEnvelopeStatusV1(
  manifest,
  numericalEvidence,
);
const readinessSha256 = computeCanonicalSha256(readiness, sha256);
const failures: string[] = [];

assertCanonicalPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1(manifest);
assertCanonicalPhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceV1(
  numericalEvidence,
  manifest,
);
expectEqual(
  "manifest self hash",
  manifest.contentSha256,
  computeCanonicalSha256(
    phaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestHashPayloadV1(manifest),
    sha256,
  ),
);
expectEqual(
  "manifest pinned hash",
  manifest.contentSha256,
  EXPECTED_MANIFEST_SHA256,
);
expectEqual(
  "numerical evidence self hash",
  numericalEvidence.certificate.contentSha256,
  computeCanonicalSha256(
    phaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceHashPayloadV1(
      numericalEvidence.certificate,
    ),
    sha256,
  ),
);
expectEqual(
  "numerical evidence pinned hash",
  numericalEvidence.certificate.contentSha256,
  EXPECTED_NUMERICAL_EVIDENCE_SHA256,
);
expectEqual(
  "readiness pinned hash",
  readinessSha256,
  EXPECTED_READINESS_SHA256,
);

for (const slsMode of ["on", "off"] as const) {
  const result = numericalEvidence.results[slsMode];
  const summary = numericalEvidence.certificate.modes[slsMode];
  if (result.slsMode !== slsMode || summary.slsMode !== slsMode) {
    failures.push(`SLS-${slsMode} result or summary mode-key binding drifted`);
  }
  verifyMode(
    result,
    numericalEvidence.failureProbes[slsMode],
    summary,
  );
  if (!summary.modePass) failures.push(`SLS-${slsMode} evidence summary failed`);
  if (summary.canonicalNodeCount !== 9 || summary.directedEdgeCount !== 32) {
    failures.push(`SLS-${slsMode} evidence inventory drifted`);
  }
}
runVerifierTamperSelfChecks();

if (!numericalEvidence.certificate.allModesPass) {
  failures.push("numerical evidence did not accept both SLS modes");
}
if (!readiness.phaseB0PublishedTaylorStaticTriSegFiniteVolumeEnvelopePass) {
  failures.push("narrow finite-volume envelope readiness pass is false");
}
if (
  readiness.continuousRectangleInteriorPass
  || readiness.globalRootUniquenessPass
  || readiness.energeticStabilityPass
  || readiness.phaseB0OverallAcceptancePass
  || readiness.phaseB1LandCoupledVolumeEnvelopePass
  || readiness.fullBeatAcceptancePass
  || readiness.physiologicalValidationPass
  || readiness.releaseRuntimePass
  || readiness.modelCoreIntegration
  || readiness.browserRuntimeAdopted
  || readiness.releaseRuntimeReachable
) failures.push("a deferred or prohibited broad readiness claim became true");

const report = Object.freeze({
  pass: failures.length === 0,
  hashes: Object.freeze({
    manifest: manifest.contentSha256,
    numericalEvidence: numericalEvidence.certificate.contentSha256,
    readiness: readinessSha256,
  }),
  phaseB0PublishedTaylorStaticTriSegFiniteVolumeEnvelopePass:
    readiness.phaseB0PublishedTaylorStaticTriSegFiniteVolumeEnvelopePass,
  phaseB0OverallAcceptancePass: false,
  phaseB1LandCoupledVolumeEnvelopePass: false,
  continuousRectangleInteriorPass: false,
  globalRootUniquenessPass: false,
  energeticStabilityPass: false,
  physiologicalValidationPass: false,
  releaseRuntimePass: false,
  modes: Object.freeze(Object.fromEntries(
    (["on", "off"] as const).map((slsMode) => {
      const result = numericalEvidence.results[slsMode];
      return [slsMode, Object.freeze({
        canonicalNodeCount: result.canonicalNodes.length,
        directedEdgeCount: result.directedEdges.length,
        censusNodeCount: result.rootCensus.length,
        selectedRefinementFactors: Object.freeze(result.directedEdges.map(
          (edge) => Object.freeze({
            edgeKey: `${edge.edgeId}:${edge.direction}`,
            factor: edge.selectedRefinementFactor,
          }),
        )),
        minimumSigma: Math.min(...allAuditedNodes(
          result,
          numericalEvidence.failureProbes[slsMode],
        ).map(
          (node) => node.staticAudit.rootRegularity.sigmaMinimum,
        )),
        maximumConditionNumber2: Math.max(...allAuditedNodes(
          result,
          numericalEvidence.failureProbes[slsMode],
        ).map(
          (node) => node.staticAudit.rootRegularity.conditionNumber2,
        )),
        minimumRestoringMargin: Math.min(...allAuditedNodes(
          result,
          numericalEvidence.failureProbes[slsMode],
        ).map(
          (node) => node.staticAudit.scaledRestoringTangent.robustSignedMargin,
        )),
        maximumDestinationAgreement:
          result.maximumDestinationAgreementScaledInfinityNorm,
        maximumReverseClosure: result.maximumReverseClosureScaledInfinityNorm,
      })];
    }),
  )),
  failures: Object.freeze(failures),
});

console.log(JSON.stringify(report, null, 2));
if (!report.pass) process.exitCode = 1;

function verifyMode(
  result: PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1,
  probes: readonly PhaseB0TriSegFiniteSupportedEnvelopeFailureProbeV1[],
  summary: PhaseB0TriSegFiniteSupportedEnvelopeModeSummaryV1,
): void {
  const prefix = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
    .adaptiveRefinement.refinementFactors;
  const coordinateScales = Object.freeze({
    septalMidwallCapVolumeM3:
      fixture.newtonScaleRegistry.unknownScales.septalMidwallVolumeM3,
    junctionRadiusM:
      fixture.newtonScaleRegistry.unknownScales.junctionRadiusM,
  });
  const canonicalById = new Map(result.canonicalNodes.map(
    (node) => [node.nodeId, node] as const,
  ));
  const baseState = createPhaseB0HydromechanicsInitialStateV1(
    fixture,
    result.slsMode,
  );
  const expectedAnchorTotalBloodVolumeM3 = BLOOD_COMPARTMENT_IDS.reduce(
    (sum, compartment) => sum + baseState.bloodVolumesM3[compartment],
    0,
  );
  const center = canonicalById.get("C");
  const expectedCanonicalNodeIds =
    PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_NODES_V1
      .map((node) => node.nodeId).sort();
  const actualCanonicalNodeIds = result.canonicalNodes
    .map((node) => node.nodeId).sort();
  if (
    canonicalizeJson(actualCanonicalNodeIds)
      !== canonicalizeJson(expectedCanonicalNodeIds)
    || new Set(actualCanonicalNodeIds).size !== expectedCanonicalNodeIds.length
    || center === undefined
    || result.anchorVolumesM3.LV !== baseState.bloodVolumesM3.LV
    || result.anchorVolumesM3.RV !== baseState.bloodVolumesM3.RV
    || result.anchorTotalBloodVolumeM3 !== expectedAnchorTotalBloodVolumeM3
    || !BLOOD_COMPARTMENT_IDS.every((compartment) =>
      center.ledger.bloodVolumesM3[compartment]
        === baseState.bloodVolumesM3[compartment])
    || !PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_NODES_V1.every(
      (declaredNode) => {
        const actualNode = canonicalById.get(declaredNode.nodeId);
        const expectedLV = baseState.bloodVolumesM3.LV
          * declaredNode.leftVentricularVolumeMultiplier;
        const expectedRV = baseState.bloodVolumesM3.RV
          * declaredNode.rightVentricularVolumeMultiplier;
        return actualNode !== undefined
          && actualNode.root.geometry.leftVentricularCavityVolumeM3 === expectedLV
          && actualNode.root.geometry.rightVentricularCavityVolumeM3 === expectedRV
          && actualNode.ledger.bloodVolumesM3.LV === expectedLV
          && actualNode.ledger.bloodVolumesM3.RV === expectedRV;
      },
    )
  ) failures.push(`SLS-${result.slsMode} parent anchor or 3x3 load binding drifted`);
  if (result.protocolId !== PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID) {
    failures.push(`SLS-${result.slsMode} protocol identity drifted`);
  }
  if (
    !result.runtimeComponentIdentityPass
    || canonicalizeJson(result.runtimeComponentIds)
      !== canonicalizeJson(manifest.bindings.componentIds)
  ) failures.push(`SLS-${result.slsMode} runtime component binding drifted`);
  if (!result.finiteDeclaredGraphEnvelopePass) {
    failures.push(`SLS-${result.slsMode} finite graph envelope failed`);
  }
  if (
    result.canonicalNodes.length !== 9
    || result.directedEdges.length !== 32
    || result.rootCensus.length !== 9
  ) failures.push(`SLS-${result.slsMode} raw graph inventory drifted`);
  const expectedEdgeKeys = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1
    .flatMap((edge) => (["forward", "reverse"] as const).map(
      (direction) => `${edge.edgeId}:${direction}`,
    )).sort();
  const actualEdgeKeys = result.directedEdges.map(
    (edge) => `${edge.edgeId}:${edge.direction}`,
  ).sort();
  if (canonicalizeJson(actualEdgeKeys) !== canonicalizeJson(expectedEdgeKeys)) {
    failures.push(`SLS-${result.slsMode} directed edge identities drifted`);
  }
  for (const edge of result.directedEdges) {
    const key = `${edge.edgeId}:${edge.direction}`;
    const graphEdge = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1.find(
      (candidate) => candidate.edgeId === edge.edgeId,
    );
    const expectedSource = graphEdge === undefined
      ? null
      : edge.direction === "forward"
        ? graphEdge.fromNodeId
        : graphEdge.toNodeId;
    const expectedDestination = graphEdge === undefined
      ? null
      : edge.direction === "forward"
        ? graphEdge.toNodeId
        : graphEdge.fromNodeId;
    if (
      graphEdge === undefined
      || edge.edgeClass !== graphEdge.edgeClass
      || edge.sourceNodeId !== expectedSource
      || edge.destinationNodeId !== expectedDestination
    ) failures.push(`SLS-${result.slsMode} ${key} topology drifted`);
    if (!edge.accepted || !edge.selectionRuleAuditPass) {
      failures.push(`SLS-${result.slsMode} ${key} was not accepted`);
    }
    if (!edge.attempts.every((attempt, index) =>
      attempt.refinementFactor === prefix[index])) {
      failures.push(`SLS-${result.slsMode} ${key} attempt prefix drifted`);
    }
    const firstGuardPass = edge.attempts.findIndex(
      (attempt) => attempt.fiftyPercentGuardPass,
    );
    if (
      firstGuardPass < 0
      || edge.selectedAttemptIndex !== firstGuardPass
      || edge.selectedRefinementFactor
        !== edge.attempts[firstGuardPass].refinementFactor
      || edge.firstGuardPassingFactor
        !== edge.attempts[firstGuardPass].refinementFactor
      || !edge.attempts.every((attempt, index) =>
        index >= edge.attempts.length - 1
          || attempt.refinementTrigger !== "none")
      || edge.attempts[firstGuardPass].refinementTrigger !== "none"
    ) failures.push(`SLS-${result.slsMode} ${key} first-pass selection drifted`);
    if (!edge.attempts.every((attempt) =>
      recomputeAttemptBooleans(attempt, result.slsMode))) {
      failures.push(`SLS-${result.slsMode} ${key} guard recomputation disagreed`);
    }
    if (!edge.attempts.every((attempt) =>
      attempt.continuation.loadScales.leftVentricularCavityVolumeM3
        === result.anchorVolumesM3.LV
      && attempt.continuation.loadScales.rightVentricularCavityVolumeM3
        === result.anchorVolumesM3.RV)) {
      failures.push(`SLS-${result.slsMode} ${key} load scales were not center-fixed`);
    }
    if (!edge.attempts.every((attempt) =>
      attempt.continuation.auditId
        === PHASE_B0_TRISEG_NATURAL_PARAMETER_CONTINUATION_V1_ID
      && attempt.continuation.tangentAlgorithmicJacobianId
        === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
      && attempt.continuation.segments.every((segment) =>
        segment.tangentAlgorithmicJacobianId
          === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID)
      && [
        attempt.continuation.anchorRoot,
        ...attempt.continuation.roots,
        ...attempt.continuation.segments.map((segment) => segment.correctedRoot),
      ].every((root) => root.rootId === PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
        && root.algorithmicJacobianId
          === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID))) {
      failures.push(`SLS-${result.slsMode} ${key} component identity drifted`);
    }
    const endpoint = selectedEndpointCoordinates(edge);
    const canonicalDestination = canonicalById.get(edge.destinationNodeId);
    if (endpoint === null || canonicalDestination === undefined) {
      failures.push(`SLS-${result.slsMode} ${key} endpoint missing`);
    } else {
      const recomputedAgreement = scaledDistance(
        endpoint,
        canonicalDestination.coordinates,
        coordinateScales,
      );
      if (!sameNumber(
        recomputedAgreement,
        edge.destinationAgreementScaledInfinityNorm,
      )) failures.push(`SLS-${result.slsMode} ${key} endpoint metric drifted`);
      const recomputedAccepted = edge.selectionRuleAuditPass
        && recomputedAgreement
          <= PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1.gates
            .endpointAgreementScaledInfinityTolerance;
      if (edge.accepted !== recomputedAccepted) {
        failures.push(`SLS-${result.slsMode} ${key} accepted flag drifted`);
      }
    }
    const expectedEntry = edge.direction === "forward"
      ? canonicalById.get(edge.sourceNodeId)?.coordinates ?? null
      : selectedEndpointCoordinates(result.directedEdges.find((candidate) =>
        candidate.edgeId === edge.edgeId && candidate.direction === "forward"));
    if (
      expectedEntry === null
      || scaledDistance(
        edge.rollbackCoordinatesOnFailure,
        expectedEntry,
        coordinateScales,
      ) !== 0
    ) failures.push(`SLS-${result.slsMode} ${key} transactional entry drifted`);
    const sourceLoad = edge.sourceNodeId === undefined
      ? null
      : canonicalById.get(edge.sourceNodeId)?.root.geometry;
    const destinationLoad = edge.destinationNodeId === undefined
      ? null
      : canonicalById.get(edge.destinationNodeId)?.root.geometry;
    if (
      sourceLoad === null || sourceLoad === undefined
      || destinationLoad === null || destinationLoad === undefined
      || !edge.attempts.every((attempt) =>
        scaledDistance(
          attempt.continuation.anchorCoordinates,
          edge.rollbackCoordinatesOnFailure,
          coordinateScales,
        ) === 0
        && attempt.continuation.path[0]?.leftVentricularCavityVolumeM3
          === sourceLoad.leftVentricularCavityVolumeM3
        && attempt.continuation.path[0]?.rightVentricularCavityVolumeM3
          === sourceLoad.rightVentricularCavityVolumeM3
        && attempt.continuation.path[attempt.continuation.path.length - 1]
          ?.leftVentricularCavityVolumeM3
          === destinationLoad.leftVentricularCavityVolumeM3
        && attempt.continuation.path[attempt.continuation.path.length - 1]
          ?.rightVentricularCavityVolumeM3
          === destinationLoad.rightVentricularCavityVolumeM3)
    ) failures.push(`SLS-${result.slsMode} ${key} load endpoints drifted`);
  }
  const centerLedger = result.canonicalNodes.find((node) => node.nodeId === "C")
    ?.ledger.bloodVolumesM3;
  if (centerLedger === undefined) {
    failures.push(`SLS-${result.slsMode} center ledger missing`);
  } else if (!allAuditedNodes(result, probes).every((node) =>
    recomputeLedgerAudit(
      node,
      centerLedger,
      result.anchorTotalBloodVolumeM3,
    )
    && recomputeNodeGate(node, result.slsMode))) {
    failures.push(`SLS-${result.slsMode} ledger or independent Jacobian audit failed`);
  }
  verifyRouteClosures(result, canonicalById, coordinateScales);
  verifyRootCensus(result, canonicalById, coordinateScales);
  verifyValveSmoothingAudit(result);
  if (
    probes.length !== 2
    || !probes.some((probe) => probe.direction === "forward")
    || !probes.some((probe) => probe.direction === "reverse")
    || !probes.every((probe) => {
      const sourceNodeId = probe.direction === "forward" ? "C" : "NW";
      const destinationNodeId = probe.direction === "forward" ? "NW" : "C";
      const source = canonicalById.get(sourceNodeId);
      const destination = canonicalById.get(destinationNodeId);
      const rollbackDistance = scaledDistance(
        probe.rollbackCoordinates,
        probe.pathEntryCoordinates,
        coordinateScales,
      );
      const rejectedDistance = scaledDistance(
        probe.rollbackCoordinates,
        probe.rejectedAttemptEndpointCoordinates,
        coordinateScales,
      );
      const attempt = probe.attempts[0];
      const rejectedEndpoint = attempt === undefined
        ? null
        : attempt.continuation.roots[attempt.continuation.roots.length - 1];
      return probe.probeId
          === "phase-b0-triseg-finite-envelope-structured-exhaustion-probe-v1"
        && probe.slsMode === result.slsMode
        && probe.edgeId === "spoke-C-NW"
        && probe.injectedMaximumRefinementFactor === 2
        && !probe.accepted
        && probe.selectedAttemptIndex === null
        && rollbackDistance === 0
        && rejectedDistance > 0
        && probe.rollbackMatchesDirectionSpecificEntry === (rollbackDistance === 0)
        && probe.rollbackDiffersFromRejectedAttemptEndpoint
          === (rejectedDistance > 0)
        && probe.attempts.length === 1
        && attempt !== undefined
        && attempt.refinementFactor === 2
        && recomputeAttemptBooleans(attempt, result.slsMode)
        && !attempt.fiftyPercentGuardPass
        && source !== undefined
        && destination !== undefined
        && scaledDistance(
          attempt.continuation.anchorCoordinates,
          probe.pathEntryCoordinates,
          coordinateScales,
        ) === 0
        && attempt.continuation.loadScales.leftVentricularCavityVolumeM3
          === result.anchorVolumesM3.LV
        && attempt.continuation.loadScales.rightVentricularCavityVolumeM3
          === result.anchorVolumesM3.RV
        && attempt.continuation.path[0]?.leftVentricularCavityVolumeM3
          === source.root.geometry.leftVentricularCavityVolumeM3
        && attempt.continuation.path[0]?.rightVentricularCavityVolumeM3
          === source.root.geometry.rightVentricularCavityVolumeM3
        && attempt.continuation.path[attempt.continuation.path.length - 1]
          ?.leftVentricularCavityVolumeM3
          === destination.root.geometry.leftVentricularCavityVolumeM3
        && attempt.continuation.path[attempt.continuation.path.length - 1]
          ?.rightVentricularCavityVolumeM3
          === destination.root.geometry.rightVentricularCavityVolumeM3
        && rejectedEndpoint?.converged === true
        && scaledDistance(
          rejectedEndpoint.coordinates,
          probe.rejectedAttemptEndpointCoordinates,
          coordinateScales,
        ) === 0;
    })
  ) failures.push(`SLS-${result.slsMode} structured rollback probes failed`);
  verifyEvidenceProjection(result, probes, summary);
  if (
    result.continuousRectangleInteriorPass
    || result.globalRootUniquenessPass
    || result.energeticStabilityPass
    || result.phaseB0OverallAcceptancePass
    || result.phaseB1LandCoupledVolumeEnvelopePass
    || result.physiologicalValidationPass
    || result.releaseRuntimePass
  ) failures.push(`SLS-${result.slsMode} broad negative claim drifted`);
}

function verifyEvidenceProjection(
  result: PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1,
  probes: readonly PhaseB0TriSegFiniteSupportedEnvelopeFailureProbeV1[],
  summary: PhaseB0TriSegFiniteSupportedEnvelopeModeSummaryV1,
): void {
  expectCanonicalEqual(
    `SLS-${result.slsMode} canonical-node evidence projection`,
    result.canonicalNodes.map(projectNodeForVerifier),
    summary.canonicalNodes,
  );
  expectCanonicalEqual(
    `SLS-${result.slsMode} directed-edge evidence projection`,
    result.directedEdges.map(projectEdgeForVerifier),
    summary.directedEdges,
  );
  const projectedRoutes = Object.freeze({
    centerTriangles: Object.freeze(
      result.routeClosureAudits.centerTriangles.map((triangle) => Object.freeze({
        triangleId: triangle.triangleId,
        clockwiseTraversedEdges: Object.freeze(
          triangle.clockwiseTraversedEdges.map(projectEdgeForVerifier),
        ),
        counterclockwiseTraversedEdges: Object.freeze(
          triangle.counterclockwiseTraversedEdges.map(projectEdgeForVerifier),
        ),
        clockwiseClosureScaledInfinityNorm: requireFiniteMetric(
          triangle.clockwiseClosureScaledInfinityNorm,
          `${triangle.triangleId} clockwise closure`,
        ),
        counterclockwiseClosureScaledInfinityNorm: requireFiniteMetric(
          triangle.counterclockwiseClosureScaledInfinityNorm,
          `${triangle.triangleId} counterclockwise closure`,
        ),
        pass: triangle.pass,
      })),
    ),
    perimeterCycles: Object.freeze(
      result.routeClosureAudits.perimeterCycles.map((cycle) => Object.freeze({
        direction: cycle.direction,
        traversedEdgeKeys: Object.freeze(cycle.traversedEdges.map(
          (edge) => `${edge.edgeId}:${edge.direction}`,
        )),
        traversedEdges: Object.freeze(
          cycle.traversedEdges.map(projectEdgeForVerifier),
        ),
        closureScaledInfinityNorm: requireFiniteMetric(
          cycle.closureScaledInfinityNorm,
          `${cycle.direction} perimeter closure`,
        ),
        pass: cycle.pass,
      })),
    ),
    pass: result.routeClosureAudits.pass,
  });
  expectCanonicalEqual(
    `SLS-${result.slsMode} route evidence projection`,
    projectedRoutes,
    summary.routeClosureAudits,
  );
  const policy = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1;
  const projectedCensus = result.rootCensus.map((census) => {
    if (census.acceptedBranchClusterIndex === null) {
      throw new Error(`census ${census.nodeId} has no accepted cluster`);
    }
    return Object.freeze({
      nodeId: census.nodeId,
      declaredSeeds: policy.rootEnumeration.seeds,
      reverseDeclaredSeeds: Object.freeze(
        [...policy.rootEnumeration.seeds].reverse().map((seed) =>
          Object.freeze({ ...seed })),
      ),
      seedCount: census.seedCount,
      convergedRootCount: census.results.filter((root) => root.converged).length,
      reverseSeedOrderConvergedRootCount: census.reverseSeedOrderResults
        .filter((root) => root.converged).length,
      clusterCount: census.clusters.length,
      forwardResults: Object.freeze(census.results.map(projectRootForVerifier)),
      reverseResults: Object.freeze(
        census.reverseSeedOrderResults.map(projectRootForVerifier),
      ),
      forwardResultCoordinates: Object.freeze(census.results.map(
        requireConvergedCoordinates,
      )),
      reverseResultCoordinates: Object.freeze(
        census.reverseSeedOrderResults.map(requireConvergedCoordinates),
      ),
      clusters: Object.freeze(census.clusters.map((cluster) => Object.freeze({
        representativeResultIndex: cluster.representativeResultIndex,
        memberResultIndices: Object.freeze([...cluster.memberResultIndices]),
        classification: cluster.classification,
        coordinates: Object.freeze({ ...cluster.coordinates }),
      }))),
      acceptedBranchClusterIndex: census.acceptedBranchClusterIndex,
      seedOrderInvariant: census.seedOrderInvariant,
      pass: census.pass,
    });
  });
  expectCanonicalEqual(
    `SLS-${result.slsMode} census evidence projection`,
    projectedCensus,
    summary.rootCensus,
  );
  const projectedValveAudit = Object.freeze({
    claim: result.staticValveSmoothingStructuralIndependenceAudit.claim,
    cases: Object.freeze(
      result.staticValveSmoothingStructuralIndependenceAudit.cases.map(
        (entry) => Object.freeze({ ...entry }),
      ),
    ),
    pass: result.staticValveSmoothingStructuralIndependenceAudit.pass,
  });
  expectCanonicalEqual(
    `SLS-${result.slsMode} valve evidence projection`,
    projectedValveAudit,
    summary.valveSmoothingStructuralIndependenceAudit,
  );
  const projectedProbes = probes.map((probe) => {
    const prohibitedOperationsAbsent = !probe.hiddenSubdivisionApplied
      && !probe.pseudoArclengthApplied
      && !probe.rootRankingApplied
      && probe.attempts.every((attempt) =>
        !attempt.continuation.nearestRootSelectionApplied
          && !attempt.continuation.minimumResidualSelectionApplied
          && !attempt.continuation.maximumJunctionRadiusSelectionApplied
          && !attempt.continuation.forcedPreviousSeptumApplied
          && !attempt.continuation.pseudoArclengthApplied
          && !attempt.continuation.supportedEnvelopeClaimed);
    const pass = probe.attempts.length === 1
      && probe.attempts[0].refinementFactor === 2
      && probe.selectedAttemptIndex === null
      && !probe.accepted
      && probe.rollbackMatchesDirectionSpecificEntry
      && probe.rollbackDiffersFromRejectedAttemptEndpoint
      && prohibitedOperationsAbsent;
    return Object.freeze({
      probeId: probe.probeId,
      direction: probe.direction,
      edgeId: probe.edgeId,
      injectedMaximumRefinementFactor: probe.injectedMaximumRefinementFactor,
      pathEntryCoordinates: Object.freeze({ ...probe.pathEntryCoordinates }),
      attempts: Object.freeze(probe.attempts.map(projectAttemptForVerifier)),
      rollbackCoordinates: Object.freeze({ ...probe.rollbackCoordinates }),
      rollbackMatchesDirectionSpecificEntry:
        probe.rollbackMatchesDirectionSpecificEntry,
      rejectedAttemptEndpointCoordinates: Object.freeze({
        ...probe.rejectedAttemptEndpointCoordinates,
      }),
      rollbackDiffersFromRejectedAttemptEndpoint:
        probe.rollbackDiffersFromRejectedAttemptEndpoint,
      prohibitedOperationsAbsent,
      pass,
    });
  });
  expectCanonicalEqual(
    `SLS-${result.slsMode} probe evidence projection`,
    projectedProbes,
    summary.structuredFailureProbes,
  );
  expectCanonicalEqual(
    `SLS-${result.slsMode} complete mode evidence projection`,
    buildProjectedModeSummaryForVerifier(result, probes),
    summary,
  );
}

function buildProjectedModeSummaryForVerifier(
  result: PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1,
  probes: readonly PhaseB0TriSegFiniteSupportedEnvelopeFailureProbeV1[],
): PhaseB0TriSegFiniteSupportedEnvelopeModeSummaryV1 {
  const policy = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1;
  const routeEdges = [
    ...result.routeClosureAudits.centerTriangles.flatMap((triangle) => [
      ...triangle.clockwiseTraversedEdges,
      ...triangle.counterclockwiseTraversedEdges,
    ]),
    ...result.routeClosureAudits.perimeterCycles.flatMap(
      (cycle) => cycle.traversedEdges,
    ),
  ];
  const allRuntimeEdges = [...result.directedEdges, ...routeEdges];
  const allRuntimeAttempts = [
    ...allRuntimeEdges.flatMap((edge) => edge.attempts),
    ...probes.flatMap((probe) => probe.attempts),
  ];
  const auditedNodes = allAuditedNodes(result, probes);
  const centerLedger = result.canonicalNodes.find((node) => node.nodeId === "C")
    ?.ledger.bloodVolumesM3;
  if (centerLedger === undefined || auditedNodes.length === 0) {
    throw new Error("finite-envelope verifier requires audited center samples");
  }
  const selectedRefinementFactorCounts = Object.freeze(
    policy.adaptiveRefinement.refinementFactors.map((refinementFactor) =>
      Object.freeze({
        refinementFactor,
        count: result.directedEdges.filter((edge) =>
          edge.selectedRefinementFactor === refinementFactor).length,
      })),
  );
  const projectedRoutes = Object.freeze({
    centerTriangles: Object.freeze(
      result.routeClosureAudits.centerTriangles.map((triangle) => Object.freeze({
        triangleId: triangle.triangleId,
        clockwiseTraversedEdges: Object.freeze(
          triangle.clockwiseTraversedEdges.map(projectEdgeForVerifier),
        ),
        counterclockwiseTraversedEdges: Object.freeze(
          triangle.counterclockwiseTraversedEdges.map(projectEdgeForVerifier),
        ),
        clockwiseClosureScaledInfinityNorm: requireFiniteMetric(
          triangle.clockwiseClosureScaledInfinityNorm,
          `${triangle.triangleId} clockwise closure`,
        ),
        counterclockwiseClosureScaledInfinityNorm: requireFiniteMetric(
          triangle.counterclockwiseClosureScaledInfinityNorm,
          `${triangle.triangleId} counterclockwise closure`,
        ),
        pass: triangle.pass,
      })),
    ),
    perimeterCycles: Object.freeze(
      result.routeClosureAudits.perimeterCycles.map((cycle) => Object.freeze({
        direction: cycle.direction,
        traversedEdgeKeys: Object.freeze(cycle.traversedEdges.map(
          (edge) => `${edge.edgeId}:${edge.direction}`,
        )),
        traversedEdges: Object.freeze(
          cycle.traversedEdges.map(projectEdgeForVerifier),
        ),
        closureScaledInfinityNorm: requireFiniteMetric(
          cycle.closureScaledInfinityNorm,
          `${cycle.direction} perimeter closure`,
        ),
        pass: cycle.pass,
      })),
    ),
    pass: result.routeClosureAudits.pass,
  });
  const projectedCensus = Object.freeze(result.rootCensus.map((census) => {
    if (census.acceptedBranchClusterIndex === null) {
      throw new Error(`census ${census.nodeId} has no accepted cluster`);
    }
    return Object.freeze({
      nodeId: census.nodeId,
      declaredSeeds: policy.rootEnumeration.seeds,
      reverseDeclaredSeeds: Object.freeze(
        [...policy.rootEnumeration.seeds].reverse().map((seed) =>
          Object.freeze({ ...seed })),
      ),
      seedCount: census.seedCount,
      convergedRootCount: census.results.filter((root) => root.converged).length,
      reverseSeedOrderConvergedRootCount: census.reverseSeedOrderResults
        .filter((root) => root.converged).length,
      clusterCount: census.clusters.length,
      forwardResults: Object.freeze(census.results.map(projectRootForVerifier)),
      reverseResults: Object.freeze(
        census.reverseSeedOrderResults.map(projectRootForVerifier),
      ),
      forwardResultCoordinates: Object.freeze(
        census.results.map(requireConvergedCoordinates),
      ),
      reverseResultCoordinates: Object.freeze(
        census.reverseSeedOrderResults.map(requireConvergedCoordinates),
      ),
      clusters: Object.freeze(census.clusters.map((cluster) => Object.freeze({
        representativeResultIndex: cluster.representativeResultIndex,
        memberResultIndices: Object.freeze([...cluster.memberResultIndices]),
        classification: cluster.classification,
        coordinates: Object.freeze({ ...cluster.coordinates }),
      }))),
      acceptedBranchClusterIndex: census.acceptedBranchClusterIndex,
      seedOrderInvariant: census.seedOrderInvariant,
      pass: census.pass,
    });
  }));
  const valveAudit = Object.freeze({
    claim: result.staticValveSmoothingStructuralIndependenceAudit.claim,
    cases: Object.freeze(
      result.staticValveSmoothingStructuralIndependenceAudit.cases.map(
        (entry) => Object.freeze({ ...entry }),
      ),
    ),
    pass: result.staticValveSmoothingStructuralIndependenceAudit.pass,
  });
  const projectedProbes = Object.freeze(probes.map((probe) => {
    const prohibitedOperationsAbsent = !probe.hiddenSubdivisionApplied
      && !probe.pseudoArclengthApplied
      && !probe.rootRankingApplied
      && probe.attempts.every((attempt) =>
        !attempt.continuation.nearestRootSelectionApplied
          && !attempt.continuation.minimumResidualSelectionApplied
          && !attempt.continuation.maximumJunctionRadiusSelectionApplied
          && !attempt.continuation.forcedPreviousSeptumApplied
          && !attempt.continuation.pseudoArclengthApplied
          && !attempt.continuation.supportedEnvelopeClaimed);
    const pass = probe.attempts.length === 1
      && probe.attempts[0].refinementFactor === 2
      && probe.selectedAttemptIndex === null
      && !probe.accepted
      && probe.rollbackMatchesDirectionSpecificEntry
      && probe.rollbackDiffersFromRejectedAttemptEndpoint
      && prohibitedOperationsAbsent;
    return Object.freeze({
      probeId: probe.probeId,
      direction: probe.direction,
      edgeId: probe.edgeId,
      injectedMaximumRefinementFactor: probe.injectedMaximumRefinementFactor,
      pathEntryCoordinates: Object.freeze({ ...probe.pathEntryCoordinates }),
      attempts: Object.freeze(probe.attempts.map(projectAttemptForVerifier)),
      rollbackCoordinates: Object.freeze({ ...probe.rollbackCoordinates }),
      rollbackMatchesDirectionSpecificEntry:
        probe.rollbackMatchesDirectionSpecificEntry,
      rejectedAttemptEndpointCoordinates: Object.freeze({
        ...probe.rejectedAttemptEndpointCoordinates,
      }),
      rollbackDiffersFromRejectedAttemptEndpoint:
        probe.rollbackDiffersFromRejectedAttemptEndpoint,
      prohibitedOperationsAbsent,
      pass,
    });
  }));
  const mainDestinationMetrics = result.directedEdges.map((edge) =>
    requireFiniteMetric(
      edge.destinationAgreementScaledInfinityNorm,
      `${edge.edgeId}:${edge.direction} destination agreement`,
    ));
  const reverseMetrics = result.directedEdges.filter(
    (edge) => edge.direction === "reverse",
  ).map((edge) => requireFiniteMetric(
    edge.destinationAgreementScaledInfinityNorm,
    `${edge.edgeId}:reverse closure`,
  ));
  const maximumDestinationAgreementScaledInfinityNorm = Math.max(
    ...mainDestinationMetrics,
  );
  const maximumReverseClosureScaledInfinityNorm = Math.max(...reverseMetrics);
  const maximumScaledRootResidualInfinityNorm = Math.max(...auditedNodes.map(
    (node) => node.staticAudit.rootRegularity.scaledResidualInfinityNorm,
  ));
  const maximumScaledRootUpdateInfinityNorm = Math.max(...auditedNodes.map(
    (node) => node.staticAudit.rootRegularity.scaledUpdateInfinityNorm,
  ));
  const minimumRootJacobianSigmaMinimum = Math.min(...auditedNodes.map(
    (node) => node.staticAudit.rootRegularity.sigmaMinimum,
  ));
  const maximumRootJacobianConditionNumber2 = Math.max(...auditedNodes.map(
    (node) => node.staticAudit.rootRegularity.conditionNumber2,
  ));
  const minimumRobustRestoringMargin = Math.min(...auditedNodes.map(
    (node) => node.staticAudit.scaledRestoringTangent.robustSignedMargin,
  ));
  const maximumGeneralizedForceTransformAuditDifference2 = Math.max(
    ...auditedNodes.map((node) =>
      node.staticAudit.generalizedForceTransformAudit.differenceTwoNorm),
  );
  const maximumIndependentJacobianCoordinateAgreementScaledInfinityNorm =
    Math.max(...auditedNodes.map((node) => requireFiniteMetric(
      node.independentJacobianStepAudit.coordinateAgreementScaledInfinityNorm,
      `${node.nodeId} independent agreement`,
    )));
  const maximumRelativeBloodVolumeDifference = Math.max(...auditedNodes.map(
    (node) => node.ledger.relativeTotalBloodVolumeDifference,
  ));
  const everyCanonicalNodeHardGatePass = result.canonicalNodes.every(
    (node) => recomputeNodeGate(node, result.slsMode) && node.hardGatePass,
  );
  const everyCanonicalNodeFiftyPercentGuardPass = result.canonicalNodes.every(
    (node) => recomputeNodeGate(node, result.slsMode)
      && node.fiftyPercentGuardPass,
  );
  const everyAuditedSampleNodeHardGatePass = auditedNodes.every(
    (node) => recomputeNodeGate(node, result.slsMode) && node.hardGatePass,
  );
  const everyIndependentJacobianStepAuditPass = auditedNodes.every(
    (node) => recomputeNodeGate(node, result.slsMode)
      && node.independentJacobianStepAudit.pass,
  );
  const everyLedgerAuditPass = auditedNodes.every((node) =>
    node.ledger.accepted);
  const everyLedgerUsesPvAsExactLvComplement = auditedNodes.every((node) =>
    node.ledger.bloodVolumesM3.PV === centerLedger.PV
      - (node.ledger.bloodVolumesM3.LV - centerLedger.LV));
  const everyLedgerUsesSvAsExactRvComplement = auditedNodes.every((node) =>
    node.ledger.bloodVolumesM3.SV === centerLedger.SV
      - (node.ledger.bloodVolumesM3.RV - centerLedger.RV));
  const everyLedgerKeepsLaRaSaPaExact = auditedNodes.every((node) =>
    node.ledger.bloodVolumesM3.LA === centerLedger.LA
      && node.ledger.bloodVolumesM3.RA === centerLedger.RA
      && node.ledger.bloodVolumesM3.SA === centerLedger.SA
      && node.ledger.bloodVolumesM3.PA === centerLedger.PA);
  const everyDirectedEdgeAccepted = result.directedEdges.every(
    (edge) => edge.accepted,
  );
  const everyDirectedEdgeSelectionRuleAuditPass = result.directedEdges.every(
    (edge) => edge.selectionRuleAuditPass,
  );
  const everyAttemptRecordedInDeclaredPrefix = result.directedEdges.every(
    (edge) => edge.attempts.length > 0
      && edge.attempts.every((attempt, index) => attempt.refinementFactor
        === policy.adaptiveRefinement.refinementFactors[index])
      && edge.attempts.length
        <= policy.adaptiveRefinement.refinementFactors.length,
  );
  const everyContinuationUsesCenterFixedLoadScales = allRuntimeAttempts.every(
    (attempt) => attempt.continuation.loadScales
      .leftVentricularCavityVolumeM3 === result.anchorVolumesM3.LV
      && attempt.continuation.loadScales.rightVentricularCavityVolumeM3
        === result.anchorVolumesM3.RV,
  );
  const everySelectedAttemptFiftyPercentGuardPass = result.directedEdges.every(
    (edge) => edge.selectedAttemptIndex !== null
      && edge.attempts[edge.selectedAttemptIndex]?.fiftyPercentGuardPass === true,
  );
  const everyCensusSeedConverged = result.rootCensus.every(
    (census) => census.allSeedsAttempted && census.allSeedsConverged,
  );
  const everyCensusSeedOrderInvariant = result.rootCensus.every(
    (census) => census.seedOrderInvariant,
  );
  const everyCensusClusterReported = result.rootCensus.every(
    (census) => census.allDiscoveredClustersReported
      && !census.globalExhaustivenessClaimed
      && census.clusters.length > 0,
  );
  const runtimeRoots = [
    ...allRuntimeAttempts.flatMap((attempt) => [
      attempt.continuation.anchorRoot,
      ...attempt.continuation.roots,
      ...attempt.continuation.segments.map((segment) => segment.correctedRoot),
    ]),
    ...result.rootCensus.flatMap((census) => [
      ...census.results,
      ...census.reverseSeedOrderResults,
    ]),
  ];
  const componentIdentityAuditPass = result.protocolId
      === PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID
    && result.runtimeComponentIdentityPass
    && canonicalizeJson(result.runtimeComponentIds)
      === canonicalizeJson(manifest.bindings.componentIds)
    && allRuntimeAttempts.every((attempt) =>
      attempt.continuation.auditId
        === PHASE_B0_TRISEG_NATURAL_PARAMETER_CONTINUATION_V1_ID
      && attempt.continuation.tangentAlgorithmicJacobianId
        === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
      && attempt.continuation.segments.every((segment) =>
        segment.tangentAlgorithmicJacobianId
          === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID))
    && runtimeRoots.every((root) =>
      root.rootId === PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
      && root.algorithmicJacobianId
        === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
      && (!root.converged
        || root.oracle.oracleId === PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID))
    && auditedNodes.every((node) =>
      node.root.rootId === PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
      && node.root.algorithmicJacobianId
        === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
      && node.root.oracle.oracleId === PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID
      && node.staticAudit.auditId
        === PHASE_B0_TRISEG_STATIC_RESTORING_AUDIT_V1_ID
      && node.independentJacobianStepAudit.root.rootId
        === PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
      && node.independentJacobianStepAudit.root.algorithmicJacobianId
        === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID);
  const prohibitedOperationsAbsent = allRuntimeEdges.every((edge) =>
    !edge.hiddenSubdivisionApplied
      && !edge.pseudoArclengthApplied
      && !edge.rootRankingApplied)
    && probes.every((probe) => !probe.hiddenSubdivisionApplied
      && !probe.pseudoArclengthApplied
      && !probe.rootRankingApplied)
    && allRuntimeAttempts.every((attempt) =>
      !attempt.continuation.nearestRootSelectionApplied
        && !attempt.continuation.minimumResidualSelectionApplied
        && !attempt.continuation.maximumJunctionRadiusSelectionApplied
        && !attempt.continuation.forcedPreviousSeptumApplied
        && !attempt.continuation.pseudoArclengthApplied
        && !attempt.continuation.supportedEnvelopeClaimed);
  const routeClosurePass = result.routeClosureAudits.centerTriangles.length === 8
    && result.routeClosureAudits.centerTriangles.every((triangle) => triangle.pass)
    && result.routeClosureAudits.perimeterCycles.length === 2
    && result.routeClosureAudits.perimeterCycles.every((cycle) => cycle.pass);
  const structuredFailureRollbackPass = projectedProbes.length === 2
    && projectedProbes.some((probe) => probe.direction === "forward")
    && projectedProbes.some((probe) => probe.direction === "reverse")
    && projectedProbes.every((probe) => probe.pass);
  const broadNegativeClaimsRemainFalse = !result.continuousRectangleInteriorPass
    && !result.globalRootUniquenessPass
    && !result.energeticStabilityPass
    && !result.phaseB0OverallAcceptancePass
    && !result.phaseB1LandCoupledVolumeEnvelopePass
    && !result.physiologicalValidationPass
    && !result.releaseRuntimePass;
  const finiteDeclaredGraphEnvelopePass = result.canonicalNodes.length === 9
    && everyCanonicalNodeHardGatePass
    && result.directedEdges.length === 32
    && everyDirectedEdgeAccepted
    && maximumDestinationAgreementScaledInfinityNorm
      <= policy.gates.endpointAgreementScaledInfinityTolerance
    && maximumReverseClosureScaledInfinityNorm
      <= policy.gates.reverseClosureScaledInfinityTolerance
    && routeClosurePass
    && result.rootCensus.length === 9
    && result.rootCensus.every((census) => census.pass)
    && valveAudit.pass
    && result.runtimeComponentIdentityPass;
  const modePass = result.canonicalNodes.length === 9
    && result.directedEdges.length === 32
    && result.rootCensus.length === 9
    && everyCanonicalNodeHardGatePass
    && everyCanonicalNodeFiftyPercentGuardPass
    && everyAuditedSampleNodeHardGatePass
    && everyIndependentJacobianStepAuditPass
    && everyLedgerAuditPass
    && everyLedgerUsesPvAsExactLvComplement
    && everyLedgerUsesSvAsExactRvComplement
    && everyLedgerKeepsLaRaSaPaExact
    && everyDirectedEdgeAccepted
    && everyDirectedEdgeSelectionRuleAuditPass
    && everyAttemptRecordedInDeclaredPrefix
    && everyContinuationUsesCenterFixedLoadScales
    && everySelectedAttemptFiftyPercentGuardPass
    && everyCensusSeedConverged
    && everyCensusSeedOrderInvariant
    && everyCensusClusterReported
    && componentIdentityAuditPass
    && prohibitedOperationsAbsent
    && valveAudit.cases.length === 9
    && valveAudit.pass
    && routeClosurePass
    && structuredFailureRollbackPass
    && broadNegativeClaimsRemainFalse
    && finiteDeclaredGraphEnvelopePass;
  return Object.freeze({
    slsMode: result.slsMode,
    runtimeComponentIds: Object.freeze({ ...result.runtimeComponentIds }),
    runtimeComponentIdentityPass: result.runtimeComponentIdentityPass,
    anchorVolumesM3: Object.freeze({ ...result.anchorVolumesM3 }),
    anchorTotalBloodVolumeM3: result.anchorTotalBloodVolumeM3,
    canonicalNodeCount: result.canonicalNodes.length,
    directedEdgeCount: result.directedEdges.length,
    rootCensusCount: result.rootCensus.length,
    auditedSampleNodeCount: auditedNodes.length,
    selectedRefinementFactorCounts,
    canonicalNodes: Object.freeze(result.canonicalNodes.map(projectNodeForVerifier)),
    directedEdges: Object.freeze(result.directedEdges.map(projectEdgeForVerifier)),
    routeClosureAudits: projectedRoutes,
    maximumDestinationAgreementScaledInfinityNorm,
    maximumReverseClosureScaledInfinityNorm,
    maximumScaledRootResidualInfinityNorm,
    maximumScaledRootUpdateInfinityNorm,
    minimumRootJacobianSigmaMinimum,
    maximumRootJacobianConditionNumber2,
    minimumRobustRestoringMargin,
    maximumGeneralizedForceTransformAuditDifference2,
    maximumIndependentJacobianCoordinateAgreementScaledInfinityNorm,
    maximumRelativeBloodVolumeDifference,
    rootCensus: projectedCensus,
    valveSmoothingStructuralIndependenceAudit: valveAudit,
    structuredFailureProbes: projectedProbes,
    everyCanonicalNodeHardGatePass,
    everyCanonicalNodeFiftyPercentGuardPass,
    everyAuditedSampleNodeHardGatePass,
    everyIndependentJacobianStepAuditPass,
    everyLedgerAuditPass,
    everyLedgerUsesPvAsExactLvComplement,
    everyLedgerUsesSvAsExactRvComplement,
    everyLedgerKeepsLaRaSaPaExact,
    everyDirectedEdgeAccepted,
    everyDirectedEdgeSelectionRuleAuditPass,
    everyAttemptRecordedInDeclaredPrefix,
    everyContinuationUsesCenterFixedLoadScales,
    everySelectedAttemptFiftyPercentGuardPass,
    everyCensusSeedConverged,
    everyCensusSeedOrderInvariant,
    everyCensusClusterReported,
    componentIdentityAuditPass,
    prohibitedOperationsAbsent,
    staticValveSmoothingStructuralIndependencePass: valveAudit.pass,
    routeClosurePass,
    structuredFailureRollbackPass,
    broadNegativeClaimsRemainFalse,
    finiteDeclaredGraphEnvelopePass,
    modePass,
  });
}

function projectRootForVerifier(root: PhaseB0PublishedTriSegRootResultV1) {
  if (root.converged === false) {
    return Object.freeze({
      converged: false,
      rootId: root.rootId,
      algorithmicJacobianId: root.algorithmicJacobianId,
      coordinates: null,
      rollbackCoordinates: Object.freeze({ ...root.rollbackCoordinates }),
      lastAcceptedCoordinates: Object.freeze({ ...root.lastAcceptedCoordinates }),
      failureReason: root.reason,
      failureMessage: root.message,
    });
  }
  return Object.freeze({
    converged: true,
    rootId: root.rootId,
    algorithmicJacobianId: root.algorithmicJacobianId,
    coordinates: Object.freeze({ ...root.coordinates }),
    rollbackCoordinates: null,
    lastAcceptedCoordinates: null,
    failureReason: null,
    failureMessage: null,
  });
}

function rootResultsEqual(
  left: PhaseB0PublishedTriSegRootResultV1,
  right: PhaseB0PublishedTriSegRootResultV1,
): boolean {
  return canonicalizeJson(projectRootForVerifier(left))
    === canonicalizeJson(projectRootForVerifier(right));
}

function rootResultArraysEqual(
  left: readonly PhaseB0PublishedTriSegRootResultV1[],
  right: readonly PhaseB0PublishedTriSegRootResultV1[],
): boolean {
  return left.length === right.length
    && left.every((root, index) => rootResultsEqual(root, right[index]));
}

function projectNodeForVerifier(node: PhaseB0TriSegEnvelopeNodeAuditV1) {
  const independentRoot = node.independentJacobianStepAudit.root;
  const classification = node.independentJacobianStepAudit.classification;
  if (!independentRoot.converged || classification === null) {
    throw new Error(`node ${node.nodeId} has no independent audit`);
  }
  return Object.freeze({
    nodeId: node.nodeId,
    rootId: node.root.rootId,
    rootAlgorithmicJacobianId: node.root.algorithmicJacobianId,
    oracleId: node.root.oracle.oracleId,
    staticAuditId: node.staticAudit.auditId,
    loadPoint: Object.freeze({
      leftVentricularCavityVolumeM3:
        node.root.geometry.leftVentricularCavityVolumeM3,
      rightVentricularCavityVolumeM3:
        node.root.geometry.rightVentricularCavityVolumeM3,
    }),
    coordinates: Object.freeze({ ...node.coordinates }),
    bloodVolumesM3: Object.freeze({ ...node.ledger.bloodVolumesM3 }),
    totalBloodVolumeDifferenceM3: node.ledger.totalBloodVolumeDifferenceM3,
    relativeTotalBloodVolumeDifference:
      node.ledger.relativeTotalBloodVolumeDifference,
    allBloodVolumesPositive: node.ledger.allVolumesPositive,
    unchangedCompartmentsExact: node.ledger.unchangedCompartmentsExact,
    ledgerAccepted: node.ledger.accepted,
    taylorDomainPass: node.taylorDomainPass,
    scaledRootResidualInfinityNorm:
      node.staticAudit.rootRegularity.scaledResidualInfinityNorm,
    scaledRootUpdateInfinityNorm:
      node.staticAudit.rootRegularity.scaledUpdateInfinityNorm,
    rootSigmaMinimum: node.staticAudit.rootRegularity.sigmaMinimum,
    rootConditionNumber2: node.staticAudit.rootRegularity.conditionNumber2,
    staticRestoringClassification:
      node.staticAudit.scaledRestoringTangent.classification,
    staticRestoringInertia: Object.freeze({
      ...node.staticAudit.scaledRestoringTangent.inertia,
    }),
    robustRestoringMargin:
      node.staticAudit.scaledRestoringTangent.robustSignedMargin,
    generalizedForceTransformAuditDifference2:
      node.staticAudit.generalizedForceTransformAudit.differenceTwoNorm,
    independentJacobianScaledStep:
      node.independentJacobianStepAudit.scaledStep,
    independentJacobianInitialCoordinates: Object.freeze({
      ...node.independentJacobianStepAudit.initialCoordinates,
    }),
    independentJacobianRootId: independentRoot.rootId,
    independentJacobianAlgorithmicJacobianId:
      independentRoot.algorithmicJacobianId,
    independentJacobianCoordinates:
      Object.freeze({ ...independentRoot.coordinates }),
    independentJacobianCoordinateAgreementScaledInfinityNorm:
      requireFiniteMetric(
        node.independentJacobianStepAudit.coordinateAgreementScaledInfinityNorm,
        `${node.nodeId} independent agreement`,
      ),
    independentJacobianClassification: classification,
    independentJacobianClassificationMatches:
      node.independentJacobianStepAudit.classificationMatches,
    independentJacobianStepAuditPass:
      node.independentJacobianStepAudit.pass,
    hardGatePass: node.hardGatePass,
    fiftyPercentGuardPass: node.fiftyPercentGuardPass,
  });
}

function projectAttemptForVerifier(attempt: PhaseB0TriSegEnvelopePathAttemptV1) {
  const continuation = attempt.continuation;
  return Object.freeze({
    refinementFactor: attempt.refinementFactor,
    refinementTrigger: attempt.refinementTrigger,
    continuationAuditId: continuation.auditId,
    pathParameterization: continuation.pathParameterization,
    parameterDerivativeStencil: continuation.parameterDerivativeStencil,
    tangentAlgorithmicJacobianId:
      continuation.tangentAlgorithmicJacobianId,
    path: Object.freeze(continuation.path.map((point) =>
      Object.freeze({ ...point }))),
    anchorCoordinates: Object.freeze({ ...continuation.anchorCoordinates }),
    anchorRoot: projectRootForVerifier(continuation.anchorRoot),
    roots: Object.freeze(continuation.roots.map(projectRootForVerifier)),
    segments: Object.freeze(continuation.segments.map((segment) =>
      Object.freeze({
        segmentIndex: segment.segmentIndex,
        tangentAlgorithmicJacobianId:
          segment.tangentAlgorithmicJacobianId,
        from: Object.freeze({ ...segment.from }),
        to: Object.freeze({ ...segment.to }),
        scaledLoadArclength: segment.scaledLoadArclength,
        scaledLoadUnitDirection: Object.freeze([
          segment.scaledLoadUnitDirection[0],
          segment.scaledLoadUnitDirection[1],
        ] as const),
        parameterDerivativeActualScaledLoadStep:
          segment.parameterDerivativeActualScaledLoadStep,
        scaledCoordinateTangentPerUnitLoadArclength: Object.freeze([
          segment.scaledCoordinateTangentPerUnitLoadArclength[0],
          segment.scaledCoordinateTangentPerUnitLoadArclength[1],
        ] as const),
        tangentPredictionHalvingDifferenceScaledInfinityNorm:
          segment.tangentPredictionHalvingDifferenceScaledInfinityNorm,
        normalizedAugmentedTangent: Object.freeze([
          segment.normalizedAugmentedTangent[0],
          segment.normalizedAugmentedTangent[1],
          segment.normalizedAugmentedTangent[2],
          segment.normalizedAugmentedTangent[3],
        ] as const),
        tangentDotWithPrevious: segment.tangentDotWithPrevious,
        predictedCoordinates: Object.freeze({ ...segment.predictedCoordinates }),
        correctedRoot: projectRootForVerifier(segment.correctedRoot),
        predictorCorrectionScaledInfinityNorm:
          segment.predictorCorrectionScaledInfinityNorm,
        predictorCorrectionToAcceptedCoordinateStepRatio:
          segment.predictorCorrectionToAcceptedCoordinateStepRatio,
        acceptedCoordinateStepScaledInfinityNorm:
          segment.acceptedCoordinateStepScaledInfinityNorm,
      }))),
    nodeAudits: Object.freeze(attempt.nodeAudits.map(projectNodeForVerifier)),
    continuationFailure: continuation.failure === null
      ? null
      : Object.freeze({
        phase: continuation.failure.phase,
        segmentIndex: continuation.failure.segmentIndex,
        reason: continuation.failure.reason,
        message: continuation.failure.message,
        lastAcceptedCoordinates: Object.freeze({
          ...continuation.failure.lastAcceptedCoordinates,
        }),
        predictedCoordinates: continuation.failure.predictedCoordinates === null
          ? null
          : Object.freeze({ ...continuation.failure.predictedCoordinates }),
      }),
    numericalPathAccepted: continuation.numericalPathAccepted,
    branchIdentityEstablished: continuation.branchIdentityEstablished,
    branchIdentity: continuation.branchIdentity,
    previousRootUse: continuation.previousRootUse,
    pathNodeCount: continuation.path.length,
    rootCount: continuation.roots.length,
    segmentCount: continuation.segments.length,
    anchorCorrectionScaledInfinityNorm:
      continuation.anchorCorrectionScaledInfinityNorm,
    maximumTangentPredictionHalvingDifferenceScaledInfinityNorm:
      continuation.maximumTangentPredictionHalvingDifferenceScaledInfinityNorm,
    maximumPredictorCorrectionScaledInfinityNorm:
      continuation.maximumPredictorCorrectionScaledInfinityNorm,
    maximumPredictorCorrectionToAcceptedCoordinateStepRatio:
      continuation.maximumPredictorCorrectionToAcceptedCoordinateStepRatio,
    maximumAcceptedScaledCoordinateStep:
      continuation.maximumAcceptedScaledCoordinateStep,
    minimumTangentDot: continuation.minimumTangentDot,
    thresholdViolations: Object.freeze([...continuation.thresholdViolations]),
    loadScales: Object.freeze({ ...continuation.loadScales }),
    allConverged: continuation.allConverged,
    hardGatePass: attempt.hardGatePass,
    fiftyPercentGuardPass: attempt.fiftyPercentGuardPass,
  });
}

function projectEdgeForVerifier(edge: PhaseB0TriSegEnvelopeDirectedEdgeAuditV1) {
  if (
    edge.selectedAttemptIndex === null
    || edge.selectedRefinementFactor === null
    || edge.firstGuardPassingFactor === null
  ) throw new Error(`edge ${edge.edgeId}:${edge.direction} has no selection`);
  const prohibitedOperationsAbsent = !edge.hiddenSubdivisionApplied
    && !edge.pseudoArclengthApplied
    && !edge.rootRankingApplied
    && edge.attempts.every((attempt) =>
      !attempt.continuation.nearestRootSelectionApplied
        && !attempt.continuation.minimumResidualSelectionApplied
        && !attempt.continuation.maximumJunctionRadiusSelectionApplied
        && !attempt.continuation.forcedPreviousSeptumApplied
        && !attempt.continuation.pseudoArclengthApplied
        && !attempt.continuation.supportedEnvelopeClaimed);
  return Object.freeze({
    edgeId: edge.edgeId,
    edgeClass: edge.edgeClass,
    direction: edge.direction,
    sourceNodeId: edge.sourceNodeId,
    destinationNodeId: edge.destinationNodeId,
    attempts: Object.freeze(edge.attempts.map(projectAttemptForVerifier)),
    selectedAttemptIndex: edge.selectedAttemptIndex,
    selectedRefinementFactor: edge.selectedRefinementFactor,
    firstGuardPassingFactor: edge.firstGuardPassingFactor,
    selectionRuleAuditPass: edge.selectionRuleAuditPass,
    destinationAgreementScaledInfinityNorm: requireFiniteMetric(
      edge.destinationAgreementScaledInfinityNorm,
      `${edge.edgeId}:${edge.direction} agreement`,
    ),
    rollbackCoordinatesOnFailure:
      Object.freeze({ ...edge.rollbackCoordinatesOnFailure }),
    accepted: edge.accepted,
    prohibitedOperationsAbsent,
  });
}

function expectCanonicalEqual(
  label: string,
  actual: unknown,
  expected: unknown,
): void {
  if (canonicalizeJson(actual) !== canonicalizeJson(expected)) {
    failures.push(`${label} disagreed with raw execution`);
  }
}

function requireFiniteMetric(value: number | null, label: string): number {
  if (value === null || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
  return value;
}

function requireConvergedCoordinates(
  root: PhaseB0PublishedTriSegRootResultV1,
) {
  if (root.converged === false) throw new Error(`root failed: ${root.message}`);
  return Object.freeze({ ...root.coordinates });
}

function recomputeLedgerAudit(
  node: PhaseB0TriSegEnvelopeNodeAuditV1,
  center: PhaseB0TriSegEnvelopeNodeAuditV1["ledger"]["bloodVolumesM3"],
  anchorTotalBloodVolumeM3: number,
): boolean {
  const volumes = node.ledger.bloodVolumesM3;
  const nodeTotalBloodVolumeM3 = BLOOD_COMPARTMENT_IDS.reduce(
    (sum, compartment) => sum + volumes[compartment],
    0,
  );
  const totalBloodVolumeDifferenceM3 =
    nodeTotalBloodVolumeM3 - anchorTotalBloodVolumeM3;
  const relativeTotalBloodVolumeDifference =
    Math.abs(totalBloodVolumeDifferenceM3) / anchorTotalBloodVolumeM3;
  const allVolumesPositive = BLOOD_COMPARTMENT_IDS.every(
    (compartment) => volumes[compartment] > 0,
  );
  const unchangedCompartmentsExact = volumes.LA === center.LA
    && volumes.RA === center.RA
    && volumes.SA === center.SA
    && volumes.PA === center.PA;
  const exactComplements = volumes.PV === center.PV
      - (volumes.LV - center.LV)
    && volumes.SV === center.SV - (volumes.RV - center.RV);
  const accepted = allVolumesPositive
    && unchangedCompartmentsExact
    && exactComplements
    && relativeTotalBloodVolumeDifference
      <= PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1.gates
        .totalBloodVolumeRelativeTolerance;
  return node.ledger.nodeId === node.nodeId
    && volumes.LV === node.root.geometry.leftVentricularCavityVolumeM3
    && volumes.RV === node.root.geometry.rightVentricularCavityVolumeM3
    && node.ledger.anchorTotalBloodVolumeM3 === anchorTotalBloodVolumeM3
    && sameNumber(
      node.ledger.nodeTotalBloodVolumeM3,
      nodeTotalBloodVolumeM3,
    )
    && sameNumber(
      node.ledger.totalBloodVolumeDifferenceM3,
      totalBloodVolumeDifferenceM3,
    )
    && sameNumber(
      node.ledger.relativeTotalBloodVolumeDifference,
      relativeTotalBloodVolumeDifference,
    )
    && node.ledger.allVolumesPositive === allVolumesPositive
    && node.ledger.unchangedCompartmentsExact === unchangedCompartmentsExact
    && node.ledger.accepted === accepted
    && accepted;
}

function buildNodeRootInputForVerifier(
  node: PhaseB0TriSegEnvelopeNodeAuditV1,
  slsMode: PhaseB0SlsModeV1,
  algorithmicJacobianScaledStep: number,
  initialCoordinates: PhaseB0TriSegCoordinatesV1,
): PhaseB0PublishedTriSegRootInputV1 {
  const baseState = createPhaseB0HydromechanicsInitialStateV1(fixture, slsMode);
  const evaluateWallStress = (geometry: PublishedTriSegGeometryV1) => {
    const evaluation = evaluatePhaseB0HydromechanicsStateV1(
      fixture,
      staticStateAtLoadPoint(
        baseState,
        Object.freeze({
          leftVentricularCavityVolumeM3:
            geometry.leftVentricularCavityVolumeM3,
          rightVentricularCavityVolumeM3:
            geometry.rightVentricularCavityVolumeM3,
        }),
        Object.freeze({
          septalMidwallCapVolumeM3: geometry.septalMidwallCapVolumeM3,
          junctionRadiusM: geometry.junctionRadiusM,
        }),
      ),
    );
    if (
      evaluation.evaluationId
        !== manifest.bindings.componentIds.sameTimeLevelHydromechanicsEvaluation
      || evaluation.triSegOracle.oracleId
        !== manifest.bindings.componentIds.publishedTaylorOracle
    ) throw new Error("node verifier evaluator identity drifted");
    return Object.freeze({
      fiberKirchhoffStressPa: Object.freeze({
        LVFW: evaluation.wallMechanics.LVFW.totalKirchhoffStressPa,
        SEP: evaluation.wallMechanics.SEP.totalKirchhoffStressPa,
        RVFW: evaluation.wallMechanics.RVFW.totalKirchhoffStressPa,
      }),
    });
  };
  return Object.freeze({
    leftVentricularCavityVolumeM3:
      node.root.geometry.leftVentricularCavityVolumeM3,
    rightVentricularCavityVolumeM3:
      node.root.geometry.rightVentricularCavityVolumeM3,
    walls: fixture.triSegReference.walls,
    initialCoordinates: Object.freeze({ ...initialCoordinates }),
    evaluateWallStress,
    unknownScales: Object.freeze({
      septalMidwallCapVolumeM3:
        fixture.newtonScaleRegistry.unknownScales.septalMidwallVolumeM3,
      junctionRadiusM:
        fixture.newtonScaleRegistry.unknownScales.junctionRadiusM,
    }),
    equilibriumResidualScaleNPerM:
      fixture.newtonScaleRegistry.residualScales
        .publishedTriSegEquilibriumNPerM,
    junctionRadiusLowerBoundM:
      fixture.numericalPolicy.strictJunctionRadiusLowerBoundM,
    algorithmicJacobianScaledStep,
  });
}

function recomputeNodeGate(
  node: PhaseB0TriSegEnvelopeNodeAuditV1,
  slsMode: PhaseB0SlsModeV1,
): boolean {
  const cache = nodeGateCache[slsMode];
  const cached = cache.get(node);
  if (cached !== undefined) return cached;
  let pass = false;
  try {
    pass = recomputeNodeGateUncached(node, slsMode);
  } catch {
    pass = false;
  }
  cache.set(node, pass);
  return pass;
}

function recomputeNodeGateUncached(
  node: PhaseB0TriSegEnvelopeNodeAuditV1,
  slsMode: PhaseB0SlsModeV1,
): boolean {
  const gates = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1.gates;
  const adaptive = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
    .adaptiveRefinement;
  const sensitivity = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
    .algorithmicJacobianSensitivity;
  const independent = node.independentJacobianStepAudit;
  const coordinateScales = Object.freeze({
    septalMidwallCapVolumeM3:
      fixture.newtonScaleRegistry.unknownScales.septalMidwallVolumeM3,
    junctionRadiusM: fixture.newtonScaleRegistry.unknownScales.junctionRadiusM,
  });
  const expectedStaticPolicy =
    staticGateManifest.workConjugateStaticRestoringClassifier.policy;
  const staticPolicyMatches = canonicalizeJson(node.staticAudit.policy)
    === canonicalizeJson(expectedStaticPolicy);
  if (
    independent.scaledStep !== sensitivity.independentComparisonScaledStep
    || sensitivity.independentComparisonScaledStep
      === sensitivity.constructionScaledStep
    || !staticPolicyMatches
  ) return false;

  const constructionRootInput = buildNodeRootInputForVerifier(
    node,
    slsMode,
    sensitivity.constructionScaledStep,
    node.coordinates,
  );
  const freshRootEvaluation = evaluatePhaseB0PublishedTriSegResidualV1({
    leftVentricularCavityVolumeM3:
      constructionRootInput.leftVentricularCavityVolumeM3,
    rightVentricularCavityVolumeM3:
      constructionRootInput.rightVentricularCavityVolumeM3,
    coordinates: node.coordinates,
    walls: constructionRootInput.walls,
    evaluateWallStress: constructionRootInput.evaluateWallStress,
  });
  const recomputedStaticAudit = auditPhaseB0TriSegStaticRestoringRootV1({
    rootInput: constructionRootInput,
    root: node.root,
    generalizedForceResidualScales: Object.freeze({
      septalMidwallVolumePa:
        fixture.newtonScaleRegistry.residualScales.virtualWorkSeptalVolumePa,
      junctionRadiusN:
        fixture.newtonScaleRegistry.residualScales.virtualWorkJunctionRadiusN,
    }),
    policy: expectedStaticPolicy,
  });
  const staticAuditMatches = canonicalizeJson(node.staticAudit)
    === canonicalizeJson(recomputedStaticAudit);
  const rootEvaluationMatches = canonicalizeJson(node.root.geometry)
      === canonicalizeJson(freshRootEvaluation.geometry)
    && canonicalizeJson(node.root.wallStress)
      === canonicalizeJson(freshRootEvaluation.wallStress)
    && canonicalizeJson(node.root.oracle)
      === canonicalizeJson(freshRootEvaluation.oracle);

  const independentRootInput = buildNodeRootInputForVerifier(
    node,
    slsMode,
    sensitivity.independentComparisonScaledStep,
    independent.initialCoordinates,
  );
  const recomputedIndependentRoot = solvePhaseB0PublishedTriSegRootV1(
    independentRootInput,
  );
  const independentRootMatches = rootResultsEqual(
    independent.root,
    recomputedIndependentRoot,
  ) && (independent.root.converged === false
    || recomputedIndependentRoot.converged === false
    || (
      canonicalizeJson(independent.root.geometry)
        === canonicalizeJson(recomputedIndependentRoot.geometry)
      && canonicalizeJson(independent.root.wallStress.fiberKirchhoffStressPa)
        === canonicalizeJson(
          recomputedIndependentRoot.wallStress.fiberKirchhoffStressPa,
        )
      && canonicalizeJson(independent.root.oracle)
        === canonicalizeJson(recomputedIndependentRoot.oracle)
      && canonicalizeJson(independent.root.scaledJacobianDiagnostics)
        === canonicalizeJson(
          recomputedIndependentRoot.scaledJacobianDiagnostics,
        )
      && sameNumber(
        independent.root.scaledResidualInfinityNorm,
        recomputedIndependentRoot.scaledResidualInfinityNorm,
      )
      && sameNumber(
        independent.root.scaledUpdateInfinityNorm,
        recomputedIndependentRoot.scaledUpdateInfinityNorm,
      )
      && independent.root.previousRootUse
        === recomputedIndependentRoot.previousRootUse
      && independent.root.forcedSeptalTargetApplied
        === recomputedIndependentRoot.forcedSeptalTargetApplied
      && independent.root.fallbackApplied
        === recomputedIndependentRoot.fallbackApplied
    ));
  const recomputedIndependentStaticAudit = recomputedIndependentRoot.converged
    ? auditPhaseB0TriSegStaticRestoringRootV1({
      rootInput: independentRootInput,
      root: recomputedIndependentRoot,
      generalizedForceResidualScales: Object.freeze({
        septalMidwallVolumePa:
          fixture.newtonScaleRegistry.residualScales.virtualWorkSeptalVolumePa,
        junctionRadiusN:
          fixture.newtonScaleRegistry.residualScales.virtualWorkJunctionRadiusN,
      }),
      policy: expectedStaticPolicy,
    })
    : null;
  const recomputedIndependentClassification = recomputedIndependentStaticAudit
    ?.scaledRestoringTangent.classification ?? null;
  const independentDistance = recomputedIndependentRoot.converged
    ? scaledDistance(
      node.coordinates,
      recomputedIndependentRoot.coordinates,
      coordinateScales,
    )
    : null;
  const independentClassificationMatches = recomputedIndependentClassification
    === recomputedStaticAudit.scaledRestoringTangent.classification;
  const independentPass = recomputedIndependentRoot.converged
    && independentRootMatches
    && independentDistance !== null
    && independentDistance
      <= sensitivity.endpointAgreementScaledInfinityTolerance
    && independentClassificationMatches
    && independent.classification === recomputedIndependentClassification;
  const taylorDomainPass = freshRootEvaluation.oracle
    .taylorTensionErrorDomainEligible
    && freshRootEvaluation.oracle.domainClassification
      === gates.publishedTaylorDomain;
  const rootRegularityAccepted =
    node.staticAudit.rootRegularity.sigmaMinimum
      >= expectedStaticPolicy.minimumRootJacobianSigmaMinimum
    && node.staticAudit.rootRegularity.conditionNumber2
      <= expectedStaticPolicy.maximumRootJacobianConditionNumber2
    && node.staticAudit.rootRegularity.scaledResidualInfinityNorm
      <= expectedStaticPolicy.maximumScaledRootResidualInfinityNorm
    && node.staticAudit.rootRegularity.scaledUpdateInfinityNorm
      <= expectedStaticPolicy.maximumScaledRootUpdateInfinityNorm;
  const generalizedForceTransformAccepted =
    node.staticAudit.generalizedForceTransformAudit.differenceTwoNorm
      <= expectedStaticPolicy
        .maximumGeneralizedForceTransformAuditDifference2;
  const staticAccepted =
    node.staticAudit.scaledRestoringTangent.classification
      === "robust-restoring"
    && node.staticAudit.scaledRestoringTangent.robustSignedMargin
      >= expectedStaticPolicy.minimumRobustRestoringMargin
    && rootRegularityAccepted
    && generalizedForceTransformAccepted;
  const staticHard =
    node.staticAudit.auditId === PHASE_B0_TRISEG_STATIC_RESTORING_AUDIT_V1_ID
    && staticAuditMatches
    && rootEvaluationMatches
    && scaledDistance(node.coordinates, node.root.coordinates, coordinateScales)
      === 0
    && scaledDistance(
      node.coordinates,
      node.staticAudit.coordinates,
      coordinateScales,
    ) === 0
    && node.root.rootId === PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
    && node.root.algorithmicJacobianId
      === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
    && node.root.oracle.oracleId === PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID
    && independent.root.rootId === PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
    && independent.root.algorithmicJacobianId
      === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
    && (!independent.root.converged
      || independent.root.oracle.oracleId
        === PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID)
    && node.staticAudit.rootRegularity.accepted === rootRegularityAccepted
    && node.staticAudit.generalizedForceTransformAudit.accepted
      === generalizedForceTransformAccepted
    && node.staticAudit.acceptedUnderLocalStaticRestoringTestReference
      === staticAccepted
    && staticAccepted;
  const hard = node.ledger.accepted
    && node.ledger.allVolumesPositive
    && node.ledger.unchangedCompartmentsExact
    && node.taylorDomainPass === taylorDomainPass
    && taylorDomainPass
    && staticHard
    && independentPass;
  const guard = hard
    && node.staticAudit.rootRegularity.sigmaMinimum
      >= adaptive.lowerThresholdGuardMultiplier
        * gates.minimumRootJacobianSigmaMinimum
    && node.staticAudit.rootRegularity.conditionNumber2
      <= adaptive.upperThresholdGuardMultiplier
        * gates.maximumRootJacobianConditionNumber2
    && node.staticAudit.rootRegularity.scaledResidualInfinityNorm
      <= adaptive.upperThresholdGuardMultiplier
        * gates.maximumScaledRootResidualInfinityNorm
    && node.staticAudit.rootRegularity.scaledUpdateInfinityNorm
      <= adaptive.upperThresholdGuardMultiplier
        * gates.maximumScaledRootUpdateInfinityNorm
    && node.staticAudit.scaledRestoringTangent.robustSignedMargin
      >= adaptive.lowerThresholdGuardMultiplier
        * gates.minimumRobustRestoringMargin
    && node.staticAudit.generalizedForceTransformAudit.differenceTwoNorm
      <= adaptive.upperThresholdGuardMultiplier
        * gates.maximumGeneralizedForceTransformAuditDifference2;
  const result = node.hardGatePass === hard
    && node.fiftyPercentGuardPass === guard
    && independent.pass === independentPass
    && independent.root.converged === recomputedIndependentRoot.converged
    && independent.classificationMatches === independentClassificationMatches
    && (independentDistance === null
      ? independent.coordinateAgreementScaledInfinityNorm === null
      : sameNumber(
        independent.coordinateAgreementScaledInfinityNorm ?? Number.NaN,
        independentDistance,
      ));
  return result;
}

function verifyRouteClosures(
  result: PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1,
  canonicalById: ReadonlyMap<
    string,
    PhaseB0TriSegEnvelopeNodeAuditV1
  >,
  coordinateScales: PhaseB0TriSegCoordinatesV1,
): void {
  const tolerance = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
    .gates.reverseClosureScaledInfinityTolerance;
  type ExpectedStep = Readonly<{
    edge: (typeof PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1)[number];
    direction: "forward" | "reverse";
  }>;
  const verifyRoute = (
    label: string,
    edges: readonly PhaseB0TriSegEnvelopeDirectedEdgeAuditV1[],
    startNodeId: "C" | "SW",
    expectedSteps: readonly ExpectedStep[],
    reportedClosure: number | null,
  ) => {
    let current = canonicalById.get(startNodeId)?.coordinates ?? null;
    let pathPass = current !== null && edges.length === expectedSteps.length;
    for (let index = 0; index < edges.length; index += 1) {
      const edge = edges[index];
      const expected = expectedSteps[index];
      if (expected === undefined) {
        pathPass = false;
        continue;
      }
      const expectedSource = expected.direction === "forward"
        ? expected.edge.fromNodeId
        : expected.edge.toNodeId;
      const expectedDestination = expected.direction === "forward"
        ? expected.edge.toNodeId
        : expected.edge.fromNodeId;
      const sourceNode = canonicalById.get(expectedSource);
      const destinationNode = canonicalById.get(expectedDestination);
      const expectedSourceLoad = sourceNode === undefined
        ? null
        : Object.freeze({
          leftVentricularCavityVolumeM3:
            sourceNode.root.geometry.leftVentricularCavityVolumeM3,
          rightVentricularCavityVolumeM3:
            sourceNode.root.geometry.rightVentricularCavityVolumeM3,
        });
      const expectedDestinationLoad = destinationNode === undefined
        ? null
        : Object.freeze({
          leftVentricularCavityVolumeM3:
            destinationNode.root.geometry.leftVentricularCavityVolumeM3,
          rightVentricularCavityVolumeM3:
            destinationNode.root.geometry.rightVentricularCavityVolumeM3,
        });
      const firstGuardIndex = edge.attempts.findIndex(
        (attempt) => attempt.fiftyPercentGuardPass,
      );
      const selectionRulePass = edge.attempts.length > 0
        && edge.attempts.every((attempt, attemptIndex) =>
          attempt.refinementFactor
            === PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
              .adaptiveRefinement.refinementFactors[attemptIndex]
          && (attemptIndex >= edge.attempts.length - 1
            || attempt.refinementTrigger !== "none"))
        && edge.selectedAttemptIndex === (firstGuardIndex < 0
          ? null
          : firstGuardIndex)
        && (firstGuardIndex < 0
          || edge.attempts[firstGuardIndex].refinementTrigger === "none");
      if (
        current === null
        || edge.edgeId !== expected.edge.edgeId
        || edge.edgeClass !== expected.edge.edgeClass
        || edge.direction !== expected.direction
        || edge.sourceNodeId !== expectedSource
        || edge.destinationNodeId !== expectedDestination
        || sourceNode === undefined
        || destinationNode === undefined
        || expectedSourceLoad === null
        || expectedDestinationLoad === null
        || scaledDistance(
          edge.rollbackCoordinatesOnFailure,
          current,
          coordinateScales,
        ) !== 0
        || !edge.attempts.every((attempt) =>
          scaledDistance(
            attempt.continuation.anchorCoordinates,
            current as PhaseB0TriSegCoordinatesV1,
            coordinateScales,
          ) === 0
          && canonicalizeJson(attempt.continuation.path[0])
            === canonicalizeJson(expectedSourceLoad)
          && canonicalizeJson(
            attempt.continuation.path[attempt.continuation.path.length - 1],
          ) === canonicalizeJson(expectedDestinationLoad)
          && attempt.continuation.loadScales.leftVentricularCavityVolumeM3
            === result.anchorVolumesM3.LV
          && attempt.continuation.loadScales.rightVentricularCavityVolumeM3
            === result.anchorVolumesM3.RV)
        || !edge.attempts.every((attempt) =>
          recomputeAttemptBooleans(attempt, result.slsMode))
        || !selectionRulePass
        || edge.selectionRuleAuditPass !== selectionRulePass
      ) pathPass = false;
      const endpoint = selectedEndpointCoordinates(edge);
      if (endpoint === null) {
        pathPass = false;
        break;
      }
      const destinationAgreement = scaledDistance(
        endpoint,
        destinationNode.coordinates,
        coordinateScales,
      );
      const accepted = selectionRulePass
        && destinationAgreement
          <= PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1.gates
            .endpointAgreementScaledInfinityTolerance;
      if (
        edge.selectedRefinementFactor
          !== edge.attempts[edge.selectedAttemptIndex ?? -1]?.refinementFactor
        || edge.firstGuardPassingFactor
          !== (firstGuardIndex < 0
            ? null
            : edge.attempts[firstGuardIndex].refinementFactor)
        || edge.destinationAgreementScaledInfinityNorm === null
        || !sameNumber(
          edge.destinationAgreementScaledInfinityNorm,
          destinationAgreement,
        )
        || edge.accepted !== accepted
        || !accepted
      ) pathPass = false;
      current = endpoint;
    }
    const start = canonicalById.get(startNodeId)?.coordinates ?? null;
    const recomputed = current === null
      || start === null
      || edges.length !== expectedSteps.length
      ? null
      : scaledDistance(current, start, coordinateScales);
    if (
      !pathPass
      || recomputed === null
      || reportedClosure === null
      || !sameNumber(recomputed, reportedClosure)
      || recomputed > tolerance
    ) failures.push(`SLS-${result.slsMode} ${label} closure recomputation failed`);
    return pathPass && recomputed !== null && recomputed <= tolerance;
  };
  const perimeterEdges = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1
    .filter((edge) => edge.edgeClass === "perimeter");
  const perimeterCycleDirections = result.routeClosureAudits.perimeterCycles
    .map((cycle) => cycle.direction);
  let allPass = result.routeClosureAudits.centerTriangles.length === 8
    && result.routeClosureAudits.perimeterCycles.length === 2
    && new Set(perimeterCycleDirections).size === 2
    && perimeterCycleDirections.includes("clockwise")
    && perimeterCycleDirections.includes("counterclockwise");
  result.routeClosureAudits.centerTriangles.forEach((triangle, index) => {
    const expected = perimeterEdges[index];
    if (triangle.triangleId !== `C-${expected.fromNodeId}-${expected.toNodeId}`) {
      allPass = false;
    }
    const fromSpoke = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1.find(
      (edge) => edge.edgeClass === "center-spoke"
        && edge.toNodeId === expected.fromNodeId,
    );
    const toSpoke = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1.find(
      (edge) => edge.edgeClass === "center-spoke"
        && edge.toNodeId === expected.toNodeId,
    );
    if (fromSpoke === undefined || toSpoke === undefined) {
      allPass = false;
      return;
    }
    const clockwise = verifyRoute(
      `${triangle.triangleId}:clockwise`,
      triangle.clockwiseTraversedEdges,
      "C",
      Object.freeze([
        Object.freeze({ edge: fromSpoke, direction: "forward" as const }),
        Object.freeze({ edge: expected, direction: "forward" as const }),
        Object.freeze({ edge: toSpoke, direction: "reverse" as const }),
      ]),
      triangle.clockwiseClosureScaledInfinityNorm,
    );
    const counterclockwise = verifyRoute(
      `${triangle.triangleId}:counterclockwise`,
      triangle.counterclockwiseTraversedEdges,
      "C",
      Object.freeze([
        Object.freeze({ edge: toSpoke, direction: "forward" as const }),
        Object.freeze({ edge: expected, direction: "reverse" as const }),
        Object.freeze({ edge: fromSpoke, direction: "reverse" as const }),
      ]),
      triangle.counterclockwiseClosureScaledInfinityNorm,
    );
    if (triangle.pass !== (clockwise && counterclockwise)) allPass = false;
  });
  result.routeClosureAudits.perimeterCycles.forEach((cycle) => {
    const ordered = cycle.direction === "clockwise"
      ? perimeterEdges
      : [...perimeterEdges].reverse();
    const expectedSteps = Object.freeze(ordered.map((edge) => Object.freeze({
      edge,
      direction: cycle.direction === "clockwise"
        ? "forward" as const
        : "reverse" as const,
    })));
    const pass = verifyRoute(
      `perimeter:${cycle.direction}`,
      cycle.traversedEdges,
      "SW",
      expectedSteps,
      cycle.closureScaledInfinityNorm,
    );
    if (cycle.pass !== pass) allPass = false;
  });
  if (result.routeClosureAudits.pass !== allPass || !allPass) {
    failures.push(`SLS-${result.slsMode} aggregate route closure drifted`);
  }
}

function verifyRootCensus(
  result: PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1,
  canonicalById: ReadonlyMap<string, PhaseB0TriSegEnvelopeNodeAuditV1>,
  coordinateScales: PhaseB0TriSegCoordinatesV1,
): void {
  const tolerance = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
    .rootEnumeration.scaledClusteringTolerance;
  const expectedNodeIds = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_NODES_V1
    .map((node) => node.nodeId).sort();
  const actualNodeIds = result.rootCensus.map((census) => census.nodeId).sort();
  if (
    canonicalizeJson(actualNodeIds) !== canonicalizeJson(expectedNodeIds)
    || new Set(actualNodeIds).size !== expectedNodeIds.length
  ) failures.push(`SLS-${result.slsMode} census node inventory drifted`);
  const baseState = createPhaseB0HydromechanicsInitialStateV1(
    fixture,
    result.slsMode,
  );
  for (const census of result.rootCensus) {
    const canonicalNode = canonicalById.get(census.nodeId);
    if (canonicalNode === undefined) {
      failures.push(`SLS-${result.slsMode} census ${census.nodeId} has no node`);
      continue;
    }
    const rootInput = Object.freeze({
      leftVentricularCavityVolumeM3:
        canonicalNode.root.geometry.leftVentricularCavityVolumeM3,
      rightVentricularCavityVolumeM3:
        canonicalNode.root.geometry.rightVentricularCavityVolumeM3,
      walls: fixture.triSegReference.walls,
      evaluateWallStress: (geometry: typeof canonicalNode.root.geometry) => {
        const evaluation = evaluatePhaseB0HydromechanicsStateV1(
          fixture,
          finiteEnvelopeStateAtCoordinates(
            baseState,
            canonicalNode,
            Object.freeze({
              septalMidwallCapVolumeM3: geometry.septalMidwallCapVolumeM3,
              junctionRadiusM: geometry.junctionRadiusM,
            }),
          ),
        );
        return Object.freeze({
          fiberKirchhoffStressPa: Object.freeze({
            LVFW: evaluation.wallMechanics.LVFW.totalKirchhoffStressPa,
            SEP: evaluation.wallMechanics.SEP.totalKirchhoffStressPa,
            RVFW: evaluation.wallMechanics.RVFW.totalKirchhoffStressPa,
          }),
        });
      },
      unknownScales: coordinateScales,
      equilibriumResidualScaleNPerM:
        fixture.newtonScaleRegistry.residualScales
          .publishedTriSegEquilibriumNPerM,
      junctionRadiusLowerBoundM:
        fixture.numericalPolicy.strictJunctionRadiusLowerBoundM,
      algorithmicJacobianScaledStep:
        PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
          .algorithmicJacobianSensitivity.constructionScaledStep,
    });
    const forwardResults = Object.freeze(
      PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
        .rootEnumeration.seeds.map((initialCoordinates) =>
          solvePhaseB0PublishedTriSegRootV1({
            ...rootInput,
            initialCoordinates,
          })),
    );
    const reverseResults = Object.freeze(
      [...PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
        .rootEnumeration.seeds].reverse().map((initialCoordinates) =>
        solvePhaseB0PublishedTriSegRootV1({
          ...rootInput,
          initialCoordinates,
        })),
    );
    const classify = (root: PhaseB0PublishedTriSegRootResultV1) => {
      if (!root.converged) return null;
      return auditPhaseB0TriSegStaticRestoringRootV1({
        rootInput,
        root,
        generalizedForceResidualScales: Object.freeze({
          septalMidwallVolumePa:
            fixture.newtonScaleRegistry.residualScales
              .virtualWorkSeptalVolumePa,
          junctionRadiusN:
            fixture.newtonScaleRegistry.residualScales
              .virtualWorkJunctionRadiusN,
        }),
        policy: staticGateManifest.workConjugateStaticRestoringClassifier.policy,
      }).scaledRestoringTangent.classification;
    };
    const forward = clusterRootResults(
      forwardResults,
      forwardResults.map(classify),
      coordinateScales,
      tolerance,
    );
    const reverse = clusterRootResults(
      reverseResults,
      reverseResults.map(classify),
      coordinateScales,
      tolerance,
    );
    const independentlyRecomputedClusters = forward.map((cluster) =>
      Object.freeze({
        representativeResultIndex: cluster.representativeResultIndex,
        memberResultIndices: cluster.memberResultIndices,
        classification: cluster.classification,
        coordinates: cluster.coordinates,
      }));
    const clusterRecordsMatch = canonicalizeJson(census.clusters)
      === canonicalizeJson(independentlyRecomputedClusters);
    const seedOrderInvariant = clusterCoordinateSetsAgree(
      forward,
      reverse,
      coordinateScales,
      tolerance,
    );
    const canonical = canonicalNode.coordinates;
    const matchingClusters = canonical === null
      ? []
      : forward.map((cluster, index) => ({
        index,
        distance: scaledDistance(
          cluster.coordinates,
          canonical,
          coordinateScales,
        ),
      })).filter((entry) => entry.distance <= tolerance);
    const acceptedIndex = matchingClusters.length === 1
      ? matchingClusters[0].index
      : null;
    const allForwardConverged = forwardResults.every((root) => root.converged);
    const allReverseConverged = reverseResults.every((root) => root.converged);
    const pass = census.seedCount === 3
      && census.results.length === 3
      && census.reverseSeedOrderResults.length === 3
      && rootResultArraysEqual(census.results, forwardResults)
      && rootResultArraysEqual(census.reverseSeedOrderResults, reverseResults)
      && census.allSeedsAttempted === (forwardResults.length === 3)
      && census.allSeedsConverged === allForwardConverged
      && allForwardConverged
      && allReverseConverged
      && clusterRecordsMatch
      && forward.length > 0
      && seedOrderInvariant
      && census.seedOrderInvariant === seedOrderInvariant
      && census.acceptedBranchClusterIndex === acceptedIndex
      && census.allDiscoveredClustersReported
      && !census.globalExhaustivenessClaimed;
    if (census.pass !== pass || !pass) {
      failures.push(`SLS-${result.slsMode} census ${census.nodeId} recomputation failed`);
    }
  }
}

function verifyValveSmoothingAudit(
  result: PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1,
): void {
  const audit = result.staticValveSmoothingStructuralIndependenceAudit;
  const baseState = createPhaseB0HydromechanicsInitialStateV1(
    fixture,
    result.slsMode,
  );
  const expected = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
    .valveSmoothingSensitivity.pressureGateWidthsPa.flatMap((pressureGateWidthPa) =>
      PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
        .valveSmoothingSensitivity.flowSmoothingM3PerSec.map(
          (flowSmoothingM3PerSec) =>
            `${pressureGateWidthPa}:${flowSmoothingM3PerSec}`,
        ));
  const actual = audit.cases.map((entry) =>
    `${entry.pressureGateWidthPa}:${entry.flowSmoothingM3PerSec}`);
  const independentlyRecomputedCases = audit.cases.map((entry) => {
    const valvePolicy = buildPhaseB0ValveNumericalPolicyCandidateV1({
      nominalSetId:
        `phase-b0-static-triseg-independence-p${entry.pressureGateWidthPa}-q${entry.flowSmoothingM3PerSec}`,
      evidenceClass: "project-synthetic-test-only-nominal",
      numericalReverseAreaRatio:
        fixture.valveNumericalPolicy.candidateRatioUnderEvaluation,
      baselineOpenAreaM2ByValve:
        fixture.valveNumericalPolicy.baselineOpenAreaM2ByValve,
      pressureGateWidthPaByValve: freezeValveRecord(
        entry.pressureGateWidthPa,
      ),
      flowSmoothingM3PerSecByValve: freezeValveRecord(
        entry.flowSmoothingM3PerSec,
      ),
    }, sha256);
    const valveLossParametersByFlow = Object.freeze(Object.fromEntries(
      PHASE_B0_VALVE_FLOW_IDS_V1.map((valveId) => [valveId, Object.freeze({
        ...fixture.valveLossParametersByFlow[valveId],
        openAreaM2: valvePolicy.baselineOpenAreaM2ByValve[valveId],
        numericalReverseAreaM2:
          valvePolicy.absoluteNumericalReverseAreaM2ByValve[valveId],
        pressureGateWidthPa: valvePolicy.pressureGateWidthPaByValve[valveId],
        flowSmoothingM3PerSec:
          valvePolicy.flowSmoothingM3PerSecByValve[valveId],
      })]),
    )) as PhaseB0SyntheticHydromechanicsCaseV1["valveLossParametersByFlow"];
    const candidateFixture = Object.freeze({
      ...fixture,
      valveNumericalPolicy: valvePolicy,
      valveLossParametersByFlow,
    });
    let maximumWallStressAbsoluteDifferencePa = 0;
    let maximumTriSegResidualAbsoluteDifferenceNPerM = 0;
    for (const node of result.canonicalNodes) {
      const state = finiteEnvelopeStateAtNode(baseState, node);
      const baseline = evaluatePhaseB0HydromechanicsStateV1(fixture, state);
      const candidate = evaluatePhaseB0HydromechanicsStateV1(
        candidateFixture,
        state,
      );
      const baselineMatchesRecordedRoot = (["LVFW", "SEP", "RVFW"] as const)
        .every((wallId) => baseline.wallMechanics[wallId].totalKirchhoffStressPa
          === node.root.wallStress.fiberKirchhoffStressPa[wallId])
        && baseline.triSegOracle.equilibriumResidual.axialNPerM
          === node.root.oracle.equilibriumResidual.axialNPerM
        && baseline.triSegOracle.equilibriumResidual.radialNPerM
          === node.root.oracle.equilibriumResidual.radialNPerM;
      if (!baselineMatchesRecordedRoot) {
        failures.push(
          `SLS-${result.slsMode} valve baseline/root mismatch at ${node.nodeId}`,
        );
      }
      maximumWallStressAbsoluteDifferencePa = Math.max(
        maximumWallStressAbsoluteDifferencePa,
        ...(["LVFW", "SEP", "RVFW"] as const).map((wallId) => Math.abs(
          candidate.wallMechanics[wallId].totalKirchhoffStressPa
            - baseline.wallMechanics[wallId].totalKirchhoffStressPa,
        )),
      );
      maximumTriSegResidualAbsoluteDifferenceNPerM = Math.max(
        maximumTriSegResidualAbsoluteDifferenceNPerM,
        Math.abs(
          candidate.triSegOracle.equilibriumResidual.axialNPerM
            - baseline.triSegOracle.equilibriumResidual.axialNPerM,
        ),
        Math.abs(
          candidate.triSegOracle.equilibriumResidual.radialNPerM
            - baseline.triSegOracle.equilibriumResidual.radialNPerM,
        ),
      );
    }
    return Object.freeze({
      maximumWallStressAbsoluteDifferencePa,
      maximumTriSegResidualAbsoluteDifferenceNPerM,
      pass: maximumWallStressAbsoluteDifferencePa === 0
        && maximumTriSegResidualAbsoluteDifferenceNPerM === 0,
    });
  });
  const recomputedPass = canonicalizeJson(actual) === canonicalizeJson(expected)
    && audit.claim === "static-structural-independence-only"
    && audit.cases.every((entry, index) =>
      Number.isFinite(entry.maximumWallStressAbsoluteDifferencePa)
      && Number.isFinite(entry.maximumTriSegResidualAbsoluteDifferenceNPerM)
      && entry.maximumWallStressAbsoluteDifferencePa
        === independentlyRecomputedCases[index]
          .maximumWallStressAbsoluteDifferencePa
      && entry.maximumTriSegResidualAbsoluteDifferenceNPerM
        === independentlyRecomputedCases[index]
          .maximumTriSegResidualAbsoluteDifferenceNPerM
      && entry.pass === independentlyRecomputedCases[index].pass
      && independentlyRecomputedCases[index].pass);
  if (audit.pass !== recomputedPass || !recomputedPass) {
    failures.push(`SLS-${result.slsMode} valve smoothing audit recomputation failed`);
  }
}

function freezeValveRecord<T>(
  value: T,
): Readonly<Record<(typeof PHASE_B0_VALVE_FLOW_IDS_V1)[number], T>> {
  return Object.freeze(Object.fromEntries(
    PHASE_B0_VALVE_FLOW_IDS_V1.map((valveId) => [valveId, value]),
  )) as Readonly<Record<(typeof PHASE_B0_VALVE_FLOW_IDS_V1)[number], T>>;
}

function finiteEnvelopeStateAtNode(
  baseState: PhaseB0HydromechanicsStateV1,
  node: PhaseB0TriSegEnvelopeNodeAuditV1,
): PhaseB0HydromechanicsStateV1 {
  return finiteEnvelopeStateAtCoordinates(
    baseState,
    node,
    node.coordinates,
  );
}

function finiteEnvelopeStateAtCoordinates(
  baseState: PhaseB0HydromechanicsStateV1,
  node: PhaseB0TriSegEnvelopeNodeAuditV1,
  coordinates: PhaseB0TriSegCoordinatesV1,
): PhaseB0HydromechanicsStateV1 {
  const shared = {
    timeSec: PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1.timeSec,
    bloodVolumesM3: node.ledger.bloodVolumesM3,
    inertialFlowsM3PerSec: baseState.inertialFlowsM3PerSec,
    triSegCoordinates: Object.freeze({
      V_m_S: coordinates.septalMidwallCapVolumeM3,
      y_m: coordinates.junctionRadiusM,
    }),
  } as const;
  return baseState.slsMode === "on"
    ? Object.freeze({
      ...shared,
      slsMode: "on" as const,
      slsAlphaVByWall: baseState.slsAlphaVByWall,
    })
    : Object.freeze({ ...shared, slsMode: "off" as const });
}

function recomputeContinuationAudit(
  continuation: PhaseB0TriSegEnvelopePathAttemptV1["continuation"],
  slsMode: PhaseB0SlsModeV1,
): boolean {
  if (canonicalizeJson(continuation.policy)
    !== canonicalizeJson(expectedContinuationPolicy)) return false;
  const policy = expectedContinuationPolicy;
  const coordinateScales = Object.freeze({
    septalMidwallCapVolumeM3:
      fixture.newtonScaleRegistry.unknownScales.septalMidwallVolumeM3,
    junctionRadiusM: fixture.newtonScaleRegistry.unknownScales.junctionRadiusM,
  });
  const rootsMatchAnchorAndSegments = continuation.roots.length > 0
    && rootResultsEqual(continuation.roots[0], continuation.anchorRoot)
    && continuation.roots.length === continuation.segments.length + 1;
  let segmentsConsistent = rootsMatchAnchorAndSegments;
  for (let index = 0; index < continuation.segments.length; index += 1) {
    const segment = continuation.segments[index];
    const fromRoot = continuation.roots[index];
    const toRoot = continuation.roots[index + 1];
    const expectedFrom = continuation.path[index];
    const expectedTo = continuation.path[index + 1];
    if (
      fromRoot?.converged !== true
      || toRoot === undefined
      || expectedFrom === undefined
      || expectedTo === undefined
      || segment.segmentIndex !== index
      || canonicalizeJson(segment.from) !== canonicalizeJson(expectedFrom)
      || canonicalizeJson(segment.to) !== canonicalizeJson(expectedTo)
      || !rootResultsEqual(segment.correctedRoot, toRoot)
      || segment.tangentAlgorithmicJacobianId
        !== PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
    ) {
      segmentsConsistent = false;
      continue;
    }
    const scaledDelta = Object.freeze([
      (expectedTo.leftVentricularCavityVolumeM3
        - expectedFrom.leftVentricularCavityVolumeM3)
        / continuation.loadScales.leftVentricularCavityVolumeM3,
      (expectedTo.rightVentricularCavityVolumeM3
        - expectedFrom.rightVentricularCavityVolumeM3)
        / continuation.loadScales.rightVentricularCavityVolumeM3,
    ] as const);
    const arclength = Math.hypot(scaledDelta[0], scaledDelta[1]);
    const unitDirection = Object.freeze([
      scaledDelta[0] / arclength,
      scaledDelta[1] / arclength,
    ] as const);
    const independentTangent = recomputeSegmentTangentForVerifier({
      slsMode,
      coordinates: fromRoot.coordinates,
      from: expectedFrom,
      to: expectedTo,
      loadScales: continuation.loadScales,
      parameterDerivativeScaledStep:
        policy.parameterDerivativeScaledStep,
      relativePivotTolerance: policy.relativePivotTolerance,
    });
    if (independentTangent === null) {
      segmentsConsistent = false;
      continue;
    }
    const derivativeStep = independentTangent.derivativeStep;
    const tangent = independentTangent.scaledCoordinateTangentPerUnitLoadArclength;
    const tangentNorm = Math.hypot(
      tangent[0],
      tangent[1],
      unitDirection[0],
      unitDirection[1],
    );
    const normalized = Object.freeze([
      tangent[0] / tangentNorm,
      tangent[1] / tangentNorm,
      unitDirection[0] / tangentNorm,
      unitDirection[1] / tangentNorm,
    ] as const);
    const predicted = Object.freeze({
      septalMidwallCapVolumeM3:
        fromRoot.coordinates.septalMidwallCapVolumeM3
        + tangent[0] * arclength
          * coordinateScales.septalMidwallCapVolumeM3,
      junctionRadiusM:
        fromRoot.coordinates.junctionRadiusM
        + tangent[1] * arclength * coordinateScales.junctionRadiusM,
    });
    const correction = toRoot.converged
      ? scaledDistance(predicted, toRoot.coordinates, coordinateScales)
      : null;
    const acceptedStep = toRoot.converged
      ? scaledDistance(fromRoot.coordinates, toRoot.coordinates, coordinateScales)
      : null;
    const correctionRatio = correction !== null && acceptedStep !== null
      ? safeRatioForVerifier(correction, acceptedStep)
      : null;
    const tangentDot = index === 0
      ? null
      : dot4ForVerifier(
        continuation.segments[index - 1].normalizedAugmentedTangent,
        segment.normalizedAugmentedTangent,
      );
    if (
      !sameNumber(segment.scaledLoadArclength, arclength)
      || !sameNumber(segment.scaledLoadUnitDirection[0], unitDirection[0])
      || !sameNumber(segment.scaledLoadUnitDirection[1], unitDirection[1])
      || !sameNumber(
        segment.parameterDerivativeActualScaledLoadStep,
        derivativeStep,
      )
      || !sameNumber(
        segment.scaledCoordinateTangentPerUnitLoadArclength[0],
        tangent[0],
      )
      || !sameNumber(
        segment.scaledCoordinateTangentPerUnitLoadArclength[1],
        tangent[1],
      )
      || !sameNumber(
        segment.tangentPredictionHalvingDifferenceScaledInfinityNorm,
        independentTangent.tangentPredictionHalvingDifferenceScaledInfinityNorm,
      )
      || !normalized.every((value, component) => sameNumber(
        segment.normalizedAugmentedTangent[component],
        value,
      ))
      || scaledDistance(segment.predictedCoordinates, predicted, coordinateScales)
        > 64 * Number.EPSILON
      || !sameNullableNumber(
        segment.predictorCorrectionScaledInfinityNorm,
        correction,
      )
      || !sameNullableNumber(
        segment.acceptedCoordinateStepScaledInfinityNorm,
        acceptedStep,
      )
      || !sameNullableNumber(
        segment.predictorCorrectionToAcceptedCoordinateStepRatio,
        correctionRatio,
      )
      || !sameNullableNumber(segment.tangentDotWithPrevious, tangentDot)
    ) segmentsConsistent = false;
  }
  const allConverged = continuation.roots.length === continuation.path.length
    && continuation.roots.every((root) => root.converged);
  const maximumTangentHalving = completeMaximum(
    continuation.segments.map(
      (segment) => segment.tangentPredictionHalvingDifferenceScaledInfinityNorm,
    ),
    continuation.segments.length,
  );
  const maximumCorrection = completeMaximum(
    continuation.segments.map(
      (segment) => segment.predictorCorrectionScaledInfinityNorm,
    ),
    continuation.segments.length,
  );
  const maximumCorrectionRatio = completeMaximum(
    continuation.segments.map(
      (segment) => segment.predictorCorrectionToAcceptedCoordinateStepRatio,
    ),
    continuation.segments.length,
  );
  const maximumAcceptedStep = completeMaximum(
    continuation.segments.map(
      (segment) => segment.acceptedCoordinateStepScaledInfinityNorm,
    ),
    continuation.segments.length,
  );
  const tangentDots = continuation.segments.map(
    (segment) => segment.tangentDotWithPrevious,
  ).filter((value): value is number => value !== null);
  const minimumTangentDot = tangentDots.length === 0
    ? null
    : Math.min(...tangentDots);
  const anchorCorrection = continuation.anchorRoot.converged
    ? scaledDistance(
      continuation.anchorCoordinates,
      continuation.anchorRoot.coordinates,
      coordinateScales,
    )
    : null;
  const violations: string[] = [];
  if (continuation.failure !== null) violations.push("structured-path-failure");
  if (!allConverged) violations.push("not-all-path-nodes-converged");
  if (
    anchorCorrection === null
    || anchorCorrection
      > policy.maximumAnchorCorrectionScaledInfinityNorm
  ) violations.push("anchor-correction-threshold");
  if (
    maximumTangentHalving === null
    || maximumTangentHalving
      > policy
        .maximumTangentPredictionHalvingDifferenceScaledInfinityNorm
  ) violations.push("tangent-halving-difference-threshold");
  if (
    maximumCorrection === null
    || maximumCorrection
      > policy.maximumPredictorCorrectionScaledInfinityNorm
  ) violations.push("predictor-correction-threshold");
  if (
    maximumCorrectionRatio === null
    || maximumCorrectionRatio
      > policy
        .maximumPredictorCorrectionToAcceptedCoordinateStepRatio
  ) violations.push("predictor-correction-ratio-threshold");
  if (
    maximumAcceptedStep === null
    || maximumAcceptedStep
      > policy.maximumAcceptedScaledCoordinateStep
  ) violations.push("accepted-coordinate-step-threshold");
  if (
    minimumTangentDot !== null
    && minimumTangentDot < policy.minimumTangentDot
  ) violations.push("tangent-dot-threshold");
  const numericalPathAccepted = violations.length === 0;
  const rootIdentitiesPass = [
    continuation.anchorRoot,
    ...continuation.roots,
    ...continuation.segments.map((segment) => segment.correctedRoot),
  ].every((root) => root.rootId === PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
    && root.algorithmicJacobianId
      === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
    && (!root.converged
      || root.oracle.oracleId === PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID));
  return continuation.auditId
      === PHASE_B0_TRISEG_NATURAL_PARAMETER_CONTINUATION_V1_ID
    && continuation.pathParameterization
      === "cumulative-scaled-load-arclength-using-declared-fixed-load-scales"
    && continuation.parameterDerivativeStencil
      === "in-segment-forward-five-point-with-step-halving-audit"
    && continuation.tangentAlgorithmicJacobianId
      === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
    && continuation.scaledCoordinateDistanceNorm === "scaled-infinity-norm"
    && segmentsConsistent
    && rootIdentitiesPass
    && sameNullableNumber(
      continuation.anchorCorrectionScaledInfinityNorm,
      anchorCorrection,
    )
    && continuation.allConverged === allConverged
    && sameNullableNumber(
      continuation.maximumTangentPredictionHalvingDifferenceScaledInfinityNorm,
      maximumTangentHalving,
    )
    && sameNullableNumber(
      continuation.maximumPredictorCorrectionScaledInfinityNorm,
      maximumCorrection,
    )
    && sameNullableNumber(
      continuation.maximumPredictorCorrectionToAcceptedCoordinateStepRatio,
      maximumCorrectionRatio,
    )
    && sameNullableNumber(
      continuation.maximumAcceptedScaledCoordinateStep,
      maximumAcceptedStep,
    )
    && sameNullableNumber(continuation.minimumTangentDot, minimumTangentDot)
    && canonicalizeJson(continuation.thresholdViolations)
      === canonicalizeJson(violations)
    && continuation.numericalPathAccepted === numericalPathAccepted
    && continuation.accepted === numericalPathAccepted
    && continuation.branchIdentityEstablished === numericalPathAccepted
    && continuation.branchIdentity === (numericalPathAccepted
      ? "numerically-tracked-from-declared-anchor-by-corrected-path"
      : "not-established")
    && continuation.previousRootUse === "tangent-predictor-only"
    && !continuation.nearestRootSelectionApplied
    && !continuation.minimumResidualSelectionApplied
    && !continuation.maximumJunctionRadiusSelectionApplied
    && !continuation.forcedPreviousSeptumApplied
    && !continuation.pseudoArclengthApplied
    && !continuation.supportedEnvelopeClaimed;
}

function recomputeSegmentTangentForVerifier(input: Readonly<{
  slsMode: PhaseB0SlsModeV1;
  coordinates: PhaseB0TriSegCoordinatesV1;
  from: PhaseB0TriSegEnvelopePathAttemptV1["continuation"]["path"][number];
  to: PhaseB0TriSegEnvelopePathAttemptV1["continuation"]["path"][number];
  loadScales:
    PhaseB0TriSegEnvelopePathAttemptV1["continuation"]["loadScales"];
  parameterDerivativeScaledStep: number;
  relativePivotTolerance: number;
}>): Readonly<{
  derivativeStep: number;
  scaledCoordinateTangentPerUnitLoadArclength: readonly [number, number];
  tangentPredictionHalvingDifferenceScaledInfinityNorm: number;
}> | null {
  const baseState = createPhaseB0HydromechanicsInitialStateV1(
    fixture,
    input.slsMode,
  );
  const coordinateScales = Object.freeze({
    septalMidwallCapVolumeM3:
      fixture.newtonScaleRegistry.unknownScales.septalMidwallVolumeM3,
    junctionRadiusM: fixture.newtonScaleRegistry.unknownScales.junctionRadiusM,
  });
  const residualScale = fixture.newtonScaleRegistry.residualScales
    .publishedTriSegEquilibriumNPerM;
  const evaluateWallStress = (geometry: PublishedTriSegGeometryV1) => {
    const point = Object.freeze({
      leftVentricularCavityVolumeM3:
        geometry.leftVentricularCavityVolumeM3,
      rightVentricularCavityVolumeM3:
        geometry.rightVentricularCavityVolumeM3,
    });
    const coordinates = Object.freeze({
      septalMidwallCapVolumeM3: geometry.septalMidwallCapVolumeM3,
      junctionRadiusM: geometry.junctionRadiusM,
    });
    const evaluation = evaluatePhaseB0HydromechanicsStateV1(
      fixture,
      staticStateAtLoadPoint(baseState, point, coordinates),
    );
    return Object.freeze({
      fiberKirchhoffStressPa: Object.freeze({
        LVFW: evaluation.wallMechanics.LVFW.totalKirchhoffStressPa,
        SEP: evaluation.wallMechanics.SEP.totalKirchhoffStressPa,
        RVFW: evaluation.wallMechanics.RVFW.totalKirchhoffStressPa,
      }),
    });
  };
  const residualAt = (
    coordinates: PhaseB0TriSegCoordinatesV1,
    point: typeof input.from,
  ) => evaluatePhaseB0PublishedTriSegResidualV1({
    ...point,
    coordinates,
    walls: fixture.triSegReference.walls,
    evaluateWallStress,
  }).residual;
  const q = [
    input.coordinates.septalMidwallCapVolumeM3,
    input.coordinates.junctionRadiusM,
  ] as const;
  const unknownScales = [
    coordinateScales.septalMidwallCapVolumeM3,
    coordinateScales.junctionRadiusM,
  ] as const;
  const residualScales = [residualScale, residualScale] as const;
  const coordinateJacobian = evaluatePhaseB0AlgorithmicJacobianV1(
    (unknowns) => residualAt(Object.freeze({
      septalMidwallCapVolumeM3: unknowns[0],
      junctionRadiusM: unknowns[1],
    }), input.from),
    q,
    Object.freeze({
      unknownScales,
      residualScales,
      lowerBounds: Object.freeze([
        null,
        fixture.numericalPolicy.strictJunctionRadiusLowerBoundM,
      ] as const),
      scaledStep: PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
        .algorithmicJacobianSensitivity.constructionScaledStep,
    }),
  );
  if (
    coordinateJacobian.algorithmId
      !== PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
  ) return null;
  const scaledDelta = Object.freeze([
    (input.to.leftVentricularCavityVolumeM3
      - input.from.leftVentricularCavityVolumeM3)
      / input.loadScales.leftVentricularCavityVolumeM3,
    (input.to.rightVentricularCavityVolumeM3
      - input.from.rightVentricularCavityVolumeM3)
      / input.loadScales.rightVentricularCavityVolumeM3,
  ] as const);
  const arclength = Math.hypot(scaledDelta[0], scaledDelta[1]);
  const unitDirection = Object.freeze([
    scaledDelta[0] / arclength,
    scaledDelta[1] / arclength,
  ] as const);
  const derivativeStep = Math.min(
    input.parameterDerivativeScaledStep,
    arclength / 4,
  );
  const loadDerivative = (scaledStep: number): readonly [number, number] => {
    const residuals = Array.from({ length: 5 }, (_, index) => {
      const point = Object.freeze({
        leftVentricularCavityVolumeM3:
          input.from.leftVentricularCavityVolumeM3
          + index * scaledStep * unitDirection[0]
            * input.loadScales.leftVentricularCavityVolumeM3,
        rightVentricularCavityVolumeM3:
          input.from.rightVentricularCavityVolumeM3
          + index * scaledStep * unitDirection[1]
            * input.loadScales.rightVentricularCavityVolumeM3,
      });
      return residualAt(input.coordinates, point);
    });
    const derivative = ([0, 1] as const).map((row) => (
      -25 * residuals[0][row]
      + 48 * residuals[1][row]
      - 36 * residuals[2][row]
      + 16 * residuals[3][row]
      - 3 * residuals[4][row]
    ) / (12 * scaledStep * residualScales[row]));
    return Object.freeze([derivative[0], derivative[1]] as const);
  };
  const coarseDerivative = loadDerivative(derivativeStep);
  const fineDerivative = loadDerivative(derivativeStep / 2);
  const matrix = Object.freeze([
    coordinateJacobian.scaledJacobian[0][0],
    coordinateJacobian.scaledJacobian[0][1],
    coordinateJacobian.scaledJacobian[1][0],
    coordinateJacobian.scaledJacobian[1][1],
  ] as const);
  const coarse = solveScaledDensePartialPivotLuV1(
    matrix,
    [-coarseDerivative[0], -coarseDerivative[1]],
    input.relativePivotTolerance,
  );
  const fine = solveScaledDensePartialPivotLuV1(
    matrix,
    [-fineDerivative[0], -fineDerivative[1]],
    input.relativePivotTolerance,
  );
  if (!coarse.success || !fine.success) return null;
  const fineTangent = Object.freeze([
    fine.solution[0],
    fine.solution[1],
  ] as const);
  return Object.freeze({
    derivativeStep,
    scaledCoordinateTangentPerUnitLoadArclength: fineTangent,
    tangentPredictionHalvingDifferenceScaledInfinityNorm: Math.max(
      Math.abs(coarse.solution[0] - fine.solution[0]),
      Math.abs(coarse.solution[1] - fine.solution[1]),
    ) * arclength,
  });
}

function staticStateAtLoadPoint(
  baseState: PhaseB0HydromechanicsStateV1,
  point: Readonly<{
    leftVentricularCavityVolumeM3: number;
    rightVentricularCavityVolumeM3: number;
  }>,
  coordinates: PhaseB0TriSegCoordinatesV1,
): PhaseB0HydromechanicsStateV1 {
  const bloodVolumesM3 = Object.freeze({
    ...baseState.bloodVolumesM3,
    LV: point.leftVentricularCavityVolumeM3,
    RV: point.rightVentricularCavityVolumeM3,
    PV: baseState.bloodVolumesM3.PV
      - (point.leftVentricularCavityVolumeM3 - baseState.bloodVolumesM3.LV),
    SV: baseState.bloodVolumesM3.SV
      - (point.rightVentricularCavityVolumeM3 - baseState.bloodVolumesM3.RV),
  });
  const shared = {
    timeSec: PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1.timeSec,
    bloodVolumesM3,
    inertialFlowsM3PerSec: baseState.inertialFlowsM3PerSec,
    triSegCoordinates: Object.freeze({
      V_m_S: coordinates.septalMidwallCapVolumeM3,
      y_m: coordinates.junctionRadiusM,
    }),
  } as const;
  return baseState.slsMode === "on"
    ? Object.freeze({
      ...shared,
      slsMode: "on" as const,
      slsAlphaVByWall: baseState.slsAlphaVByWall,
    })
    : Object.freeze({ ...shared, slsMode: "off" as const });
}

function completeMaximum(
  values: readonly (number | null)[],
  expectedCount: number,
): number | null {
  const finite = values.filter((value): value is number => value !== null);
  return finite.length === expectedCount && finite.length > 0
    ? Math.max(...finite)
    : null;
}

function sameNullableNumber(
  left: number | null,
  right: number | null,
): boolean {
  return left === null || right === null
    ? left === right
    : sameNumber(left, right);
}

function safeRatioForVerifier(numerator: number, denominator: number): number {
  if (denominator > 0) return numerator / denominator;
  return numerator === 0 ? 0 : Number.POSITIVE_INFINITY;
}

function dot4ForVerifier(
  left: readonly [number, number, number, number],
  right: readonly [number, number, number, number],
): number {
  return left[0] * right[0] + left[1] * right[1]
    + left[2] * right[2] + left[3] * right[3];
}

function recomputeAttemptBooleans(
  attempt: PhaseB0TriSegEnvelopePathAttemptV1,
  slsMode: PhaseB0SlsModeV1,
): boolean {
  const adaptive = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
    .adaptiveRefinement;
  const gates = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1.gates;
  const continuation = attempt.continuation;
  const policy = expectedContinuationPolicy;
  const continuationConsistency = recomputeContinuationAudit(
    continuation,
    slsMode,
  );
  const maximumGuard = (value: number | null, threshold: number) =>
    value !== null
    && value <= adaptive.upperThresholdGuardMultiplier * threshold;
  const hardNodes = attempt.nodeAudits.every((node) =>
    recomputeNodeGate(node, slsMode));
  const nodeRootProjectionMatches = attempt.nodeAudits.every((node, index) => {
    const root = continuation.roots[index];
    const point = continuation.path[index];
    return root?.converged === true
      && point !== undefined
      && rootResultsEqual(node.root, root)
      && node.root.geometry.leftVentricularCavityVolumeM3
        === point.leftVentricularCavityVolumeM3
      && node.root.geometry.rightVentricularCavityVolumeM3
        === point.rightVentricularCavityVolumeM3
      && scaledDistance(
        node.coordinates,
        root.coordinates,
        Object.freeze({
          septalMidwallCapVolumeM3:
            fixture.newtonScaleRegistry.unknownScales.septalMidwallVolumeM3,
          junctionRadiusM:
            fixture.newtonScaleRegistry.unknownScales.junctionRadiusM,
        }),
      ) === 0;
  });
  const hard = continuation.numericalPathAccepted
    && continuationConsistency
    && continuation.allConverged
    && continuation.roots.length === continuation.path.length
    && attempt.nodeAudits.length === continuation.path.length
    && hardNodes
    && nodeRootProjectionMatches
    && !continuation.nearestRootSelectionApplied
    && !continuation.minimumResidualSelectionApplied
    && !continuation.maximumJunctionRadiusSelectionApplied
    && !continuation.forcedPreviousSeptumApplied
    && !continuation.pseudoArclengthApplied
    && !continuation.supportedEnvelopeClaimed;
  const continuationGuard = continuation.segments.every((segment) =>
    segment.scaledLoadArclength
      >= adaptive.lowerThresholdGuardMultiplier * policy.minimumScaledLoadArclength)
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
    && (continuation.minimumTangentDot === null
      || 1 - continuation.minimumTangentDot
        <= adaptive.upperThresholdGuardMultiplier * (1 - policy.minimumTangentDot));
  const nodeGuard = attempt.nodeAudits.every((node) =>
    node.staticAudit.rootRegularity.sigmaMinimum
      >= adaptive.lowerThresholdGuardMultiplier
        * gates.minimumRootJacobianSigmaMinimum
    && node.staticAudit.rootRegularity.conditionNumber2
      <= adaptive.upperThresholdGuardMultiplier
        * gates.maximumRootJacobianConditionNumber2
    && node.staticAudit.rootRegularity.scaledResidualInfinityNorm
      <= adaptive.upperThresholdGuardMultiplier
        * gates.maximumScaledRootResidualInfinityNorm
    && node.staticAudit.rootRegularity.scaledUpdateInfinityNorm
      <= adaptive.upperThresholdGuardMultiplier
        * gates.maximumScaledRootUpdateInfinityNorm
    && node.staticAudit.scaledRestoringTangent.robustSignedMargin
      >= adaptive.lowerThresholdGuardMultiplier
        * gates.minimumRobustRestoringMargin
    && node.staticAudit.generalizedForceTransformAudit.differenceTwoNorm
      <= adaptive.upperThresholdGuardMultiplier
        * gates.maximumGeneralizedForceTransformAuditDifference2);
  const guard = hard && continuationGuard && nodeGuard;
  const refinementTrigger = guard
    ? "none"
    : hard
      ? "fifty-percent-guard-not-met"
      : "hard-failure";
  return continuation.path.length === attempt.refinementFactor + 1
    && attempt.hardGatePass === hard
    && attempt.fiftyPercentGuardPass === guard
    && attempt.refinementTrigger === refinementTrigger;
}

function selectedEndpointCoordinates(
  edge: PhaseB0TriSegEnvelopeDirectedEdgeAuditV1 | undefined,
): PhaseB0TriSegCoordinatesV1 | null {
  if (edge?.selectedAttemptIndex === null || edge === undefined) return null;
  const attempt = edge.attempts[edge.selectedAttemptIndex];
  const root = attempt?.continuation.roots[
    attempt.continuation.roots.length - 1
  ];
  return root?.converged === true ? root.coordinates : null;
}

function scaledDistance(
  left: PhaseB0TriSegCoordinatesV1,
  right: PhaseB0TriSegCoordinatesV1,
  scales: PhaseB0TriSegCoordinatesV1,
): number {
  return Math.max(
    Math.abs(
      left.septalMidwallCapVolumeM3 - right.septalMidwallCapVolumeM3,
    ) / scales.septalMidwallCapVolumeM3,
    Math.abs(left.junctionRadiusM - right.junctionRadiusM)
      / scales.junctionRadiusM,
  );
}

function sameNumber(left: number, right: number): boolean {
  return Number.isFinite(left)
    && Number.isFinite(right)
    && Math.abs(left - right)
      <= 64 * Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right));
}

type VerifierCluster = Readonly<{
  representativeResultIndex: number;
  memberResultIndices: readonly number[];
  classification: string;
  coordinates: PhaseB0TriSegCoordinatesV1;
}>;

function clusterRootResults(
  results: readonly PhaseB0PublishedTriSegRootResultV1[],
  classifications: readonly (string | null)[],
  coordinateScales: PhaseB0TriSegCoordinatesV1,
  tolerance: number,
): readonly VerifierCluster[] {
  const clusters: Array<{
    representativeResultIndex: number;
    memberResultIndices: number[];
    classification: string;
    coordinates: PhaseB0TriSegCoordinatesV1;
  }> = [];
  results.forEach((result, resultIndex) => {
    if (!result.converged) return;
    const classification = classifications[resultIndex];
    if (classification === null || classification === undefined) {
      throw new Error(`missing census classification ${resultIndex}`);
    }
    const existing = clusters.find((cluster) =>
      cluster.classification === classification
      &&
      scaledDistance(
        cluster.coordinates,
        result.coordinates,
        coordinateScales,
      ) <= tolerance);
    if (existing === undefined) {
      clusters.push({
        representativeResultIndex: resultIndex,
        memberResultIndices: [resultIndex],
        classification,
        coordinates: result.coordinates,
      });
    } else {
      existing.memberResultIndices.push(resultIndex);
    }
  });
  return Object.freeze(clusters.map((cluster) => Object.freeze({
    representativeResultIndex: cluster.representativeResultIndex,
    memberResultIndices: Object.freeze([...cluster.memberResultIndices]),
    classification: cluster.classification,
    coordinates: Object.freeze({ ...cluster.coordinates }),
  })));
}

function clusterCoordinateSetsAgree(
  left: readonly VerifierCluster[],
  right: readonly VerifierCluster[],
  coordinateScales: PhaseB0TriSegCoordinatesV1,
  tolerance: number,
): boolean {
  return left.length === right.length
    && left.every((leftCluster) => right.filter((rightCluster) =>
      leftCluster.classification === rightCluster.classification
      && scaledDistance(
        leftCluster.coordinates,
        rightCluster.coordinates,
        coordinateScales,
      ) <= tolerance).length === 1);
}

function allAuditedNodes(
  result: PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1,
  probes: readonly PhaseB0TriSegFiniteSupportedEnvelopeFailureProbeV1[] = [],
) {
  return [
    ...result.canonicalNodes,
    ...result.directedEdges.flatMap((edge) =>
      edge.attempts.flatMap((attempt) => attempt.nodeAudits)),
    ...result.routeClosureAudits.centerTriangles.flatMap((triangle) => [
      ...triangle.clockwiseTraversedEdges,
      ...triangle.counterclockwiseTraversedEdges,
    ]).flatMap((edge) =>
      edge.attempts.flatMap((attempt) => attempt.nodeAudits)),
    ...result.routeClosureAudits.perimeterCycles.flatMap((cycle) =>
      cycle.traversedEdges.flatMap((edge) =>
        edge.attempts.flatMap((attempt) => attempt.nodeAudits))),
    ...probes.flatMap((probe) => probe.attempts.flatMap(
      (attempt) => attempt.nodeAudits,
    )),
  ];
}

function expectEqual(field: string, actual: string, expected: string): void {
  if (actual !== expected) failures.push(`${field}: expected ${expected}, got ${actual}`);
}

function runVerifierTamperSelfChecks(): void {
  const node = numericalEvidence.results.on.canonicalNodes[0];
  const stepTamper = Object.freeze({
    ...node,
    independentJacobianStepAudit: Object.freeze({
      ...node.independentJacobianStepAudit,
      scaledStep: PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
        .algorithmicJacobianSensitivity.constructionScaledStep,
    }),
  });
  const taylorTamper = Object.freeze({ ...node, taylorDomainPass: false });
  const staticPolicyTamper = Object.freeze({
    ...node,
    staticAudit: Object.freeze({
      ...node.staticAudit,
      policy: Object.freeze({
        ...node.staticAudit.policy,
        minimumRobustRestoringMargin:
          node.staticAudit.policy.minimumRobustRestoringMargin * 2,
      }),
    }),
  });
  const attempt = numericalEvidence.results.on.directedEdges[0].attempts[0];
  const continuationPolicyTamper = Object.freeze({
    ...attempt.continuation,
    policy: Object.freeze({
      ...attempt.continuation.policy,
      maximumAnchorCorrectionScaledInfinityNorm:
        attempt.continuation.policy.maximumAnchorCorrectionScaledInfinityNorm
          * 2,
    }),
  });
  if (
    recomputeNodeGate(stepTamper, "on")
    || recomputeNodeGate(taylorTamper, "on")
    || recomputeNodeGate(staticPolicyTamper, "on")
    || recomputeContinuationAudit(continuationPolicyTamper, "on")
  ) failures.push("verifier tamper self-check accepted a policy or node drift");
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
