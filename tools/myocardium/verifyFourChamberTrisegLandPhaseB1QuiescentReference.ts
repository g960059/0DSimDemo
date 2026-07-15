import { createHash } from "node:crypto";
import {
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  assertCanonicalFourChamberNewtonScaleRegistryV1,
  validateFourChamberNewtonScaleRegistryV1,
} from "@/engine/myocardium/fourChamberV1/numerics/newtonScaleRegistryV1";
import {
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphV1";
import {
  phaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1";
import {
  phaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1";
import {
  PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1,
  assertCanonicalPhaseB1QuiescentPressureReferenceInverseResultV1,
  type PhaseB1QuiescentPressureReferenceContinuationResultV1,
  type PhaseB1QuiescentPressureReferenceNodeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentPressureReferenceInverseV1";
import {
  encodePhaseB1EndpointTopologyVectorsV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  createPhaseB1ColdEtaOneReferenceConfiguredSolverSessionV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_MANIFEST_SHA256_V1,
  PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_NUMERICAL_SHA256_V1,
  PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_READINESS_SHA256_V1,
  assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1,
  assertDeepFrozenAndClosedPhaseB1QuiescentReferenceEvidenceManifestV1,
  buildPhaseB1QuiescentReferenceEvidenceManifestV1,
  phaseB1QuiescentReferenceEvidenceManifestHashPayloadV1,
  type PhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";
import {
  assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1,
  buildPhaseB1QuiescentReferenceNumericalEvidenceV1,
  phaseB1QuiescentReferenceNumericalEvidenceHashPayloadV1,
  type PhaseB1QuiescentReferenceNumericalEvidenceBundleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceNumericalEvidenceV1";
import {
  assertCanonicalFourChamberPhaseB1QuiescentReferenceStatusV1,
  assertDeepFrozenAndClosedFourChamberPhaseB1QuiescentReferenceStatusV1,
  buildFourChamberPhaseB1QuiescentReferenceStatusV1,
  type FourChamberPhaseB1QuiescentReferenceStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceReadinessV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

const MODES = Object.freeze(["on", "off"] as const);
const PRESSURE_ORDER = Object.freeze(["LA", "LV", "RA", "RV"] as const);
const EXPECTED_MANIFEST_SHA256 =
  "218d5abd7b53dd0e4db594bac1ac1848d3ac49acc3efbdd02b843ee27338bf24";
// Pinned from the authoritative numerical-evidence run.
const EXPECTED_NUMERICAL_SHA256 =
  "7dd2cc61e9f5da24d9495a89b20369bfea143eb03e511fa312ee0c55a3acc9ec";
const EXPECTED_READINESS_SHA256 =
  "0fd4b9a8b8c624896180303897b73ac72ec5d9f269c96f96ba4490164669b28f";
const failures: string[] = [];

type Mode = typeof MODES[number];
type NumericalEvidence = PhaseB1QuiescentReferenceNumericalEvidenceBundleV1;
type Readiness = FourChamberPhaseB1QuiescentReferenceStatusV1;

try {
  const manifest = buildPhaseB1QuiescentReferenceEvidenceManifestV1(sha256);
  assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(manifest);
  assertDeepFrozenAndClosedPhaseB1QuiescentReferenceEvidenceManifestV1(
    manifest,
  );
  const numerical = buildPhaseB1QuiescentReferenceNumericalEvidenceV1(
    manifest,
    sha256,
  );
  assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1(
    numerical,
    manifest,
  );
  const readiness = buildFourChamberPhaseB1QuiescentReferenceStatusV1(
    manifest,
    numerical,
  );
  assertCanonicalFourChamberPhaseB1QuiescentReferenceStatusV1(readiness);

  const hashes = verifyArtifacts(manifest, numerical, readiness);
  const modeMetrics = Object.freeze(Object.fromEntries(MODES.map((mode) => [
    mode,
    verifyMode(mode, numerical),
  ]))) as Readonly<Record<Mode, ReturnType<typeof verifyMode>>>;
  verifyReadiness(readiness, manifest, numerical);
  verifyMutationBoundary(manifest, numerical, readiness);

  const report = Object.freeze({
    pass: failures.length === 0,
    projectSyntheticQuiescentPressureReferenceInversePass:
      failures.length === 0,
    instantaneousHydraulicQuiescencePass: failures.length === 0,
    projectSyntheticQuiescentReferenceEventFreeCasePass:
      failures.length === 0,
    projectSyntheticToleranceCertifiedIdentityHoldPass:
      failures.length === 0,
    analyticalExactEquilibriumClaimed: false,
    biologicalPressurePathPass: false,
    closedLoopStationarityPass: false,
    acceptedPhaseB1ReferenceBranchPass: false,
    physiologicalReferenceAcceptancePass: false,
    supportedReferenceEnvelopePass: false,
    continuousReferenceCoordinateRegularityPass: false,
    continuousPressurePathRegularityPass: false,
    globalRootUniquenessPass: false,
    globalRootExhaustivenessPass: false,
    energeticStabilityPass: false,
    fullBeatAcceptancePass: false,
    eventIntegratedAcceptancePass: false,
    physiologicalValidationPass: false,
    phaseB1AcceptancePass: false,
    pureCoreParentEvidenceAuthenticationClaimed: false,
    releaseRuntimePass: false,
    modelCoreIntegration: false,
    browserRuntimeAdopted: false,
    releaseRuntimeReachable: false,
    testOnly: true,
    hashes,
    modeMetrics,
    failures: Object.freeze([...failures]),
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));
  if (!report.pass) process.exitCode = 1;
} catch (error) {
  failures.push(message(error));
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    pass: false,
    projectSyntheticQuiescentPressureReferenceInversePass: false,
    projectSyntheticQuiescentReferenceEventFreeCasePass: false,
    projectSyntheticToleranceCertifiedIdentityHoldPass: false,
    biologicalPressurePathPass: false,
    closedLoopStationarityPass: false,
    acceptedPhaseB1ReferenceBranchPass: false,
    physiologicalReferenceAcceptancePass: false,
    supportedReferenceEnvelopePass: false,
    continuousReferenceCoordinateRegularityPass: false,
    continuousPressurePathRegularityPass: false,
    globalRootUniquenessPass: false,
    globalRootExhaustivenessPass: false,
    energeticStabilityPass: false,
    fullBeatAcceptancePass: false,
    eventIntegratedAcceptancePass: false,
    phaseB1AcceptancePass: false,
    modelCoreIntegration: false,
    browserRuntimeAdopted: false,
    releaseRuntimePass: false,
    releaseRuntimeReachable: false,
    failures,
  }, null, 2));
  process.exitCode = 1;
}

function verifyArtifacts(
  manifest: PhaseB1QuiescentReferenceEvidenceManifestV1,
  numerical: NumericalEvidence,
  readiness: Readiness,
) {
  const certificate = numerical.certificate;
  const parent = numerical.directParent;
  const parentReadinessSha256 = computeCanonicalSha256(
    parent.readiness,
    sha256,
  );
  const readinessSha256 = computeCanonicalSha256(readiness, sha256);
  expectEqual("manifest pinned hash", manifest.contentSha256,
    EXPECTED_MANIFEST_SHA256);
  expectEqual("manifest self hash", manifest.contentSha256,
    computeCanonicalSha256(
      phaseB1QuiescentReferenceEvidenceManifestHashPayloadV1(manifest),
      sha256,
    ));
  expectEqual("numerical pinned hash", certificate.contentSha256,
    EXPECTED_NUMERICAL_SHA256);
  expectEqual("numerical self hash", certificate.contentSha256,
    computeCanonicalSha256(
      phaseB1QuiescentReferenceNumericalEvidenceHashPayloadV1(certificate),
      sha256,
    ));
  expectEqual("numerical manifest binding", certificate.manifestSha256,
    manifest.contentSha256);
  expectTrue("manifest bindings retained by identity",
    Object.is(certificate.manifestBindings, manifest.bindings));

  expectEqual("parent manifest pin", parent.manifest.contentSha256,
    PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_MANIFEST_SHA256_V1);
  expectEqual("parent manifest self hash", parent.manifest.contentSha256,
    computeCanonicalSha256(
      phaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestHashPayloadV1(
        parent.manifest,
      ),
      sha256,
    ));
  expectEqual(
    "parent numerical pin",
    parent.numericalEvidence.certificate.contentSha256,
    PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_NUMERICAL_SHA256_V1,
  );
  expectEqual(
    "parent numerical self hash",
    parent.numericalEvidence.certificate.contentSha256,
    computeCanonicalSha256(
      phaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceHashPayloadV1(
        parent.numericalEvidence.certificate,
      ),
      sha256,
    ),
  );
  expectEqual("parent readiness pin", parentReadinessSha256,
    PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_READINESS_SHA256_V1);
  expectTrue("parent auth aggregate",
    certificate.directParentAuthentication
      .allDirectParentArtifactsAuthenticated);
  expectTrue("exact numerical mode inventory",
    Reflect.ownKeys(certificate.modes).join(",") === "on,off"
    && Reflect.ownKeys(numerical.results).join(",") === "on,off");
  expectTrue("all narrow claims true",
    Object.values(certificate.narrowClaims).every((value) => value === true));
  expectTrue("all broad claims false",
    Object.values(certificate.broadClaims).every((value) => value === false));
  expectTrue("all modes pass", certificate.allModesPass);
  expectEqual("readiness pinned hash", readinessSha256,
    EXPECTED_READINESS_SHA256);
  expectRecursivelyFrozen(manifest, "manifest");
  expectRecursivelyFrozen(numerical, "numerical");

  return Object.freeze({
    manifestSha256: manifest.contentSha256,
    numericalEvidenceSha256: certificate.contentSha256,
    readinessSha256,
    parentManifestSha256: parent.manifest.contentSha256,
    parentNumericalEvidenceSha256:
      parent.numericalEvidence.certificate.contentSha256,
    parentReadinessSha256,
  });
}

function verifyMode(mode: Mode, numerical: NumericalEvidence) {
  const raw = numerical.results[mode];
  const summary = numerical.certificate.modes[mode];
  const inverse = raw.inverse;
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1(raw.graph);
  assertCanonicalPhaseB1QuiescentPressureReferenceInverseResultV1(inverse);
  expectEqual(`${mode} graph mode`, raw.graph.slsMode, mode);
  expectEqual(`${mode} inverse mode`, inverse.slsMode, mode);
  expectTrue(`${mode} graph-to-inverse identity`,
    Object.is(inverse.sourceGraph, raw.graph));
  expectTrue(`${mode} source canonical center identity`,
    inverse.sourceCanonicalNodeObjectIdentity
    && raw.graph.canonicalNodes.some((audit) =>
      audit.nodeId === "C"
      && Object.is(audit.node, inverse.sourceCanonicalNode)));
  expectTrue(`${mode} source Schur identity`, Object.is(
    inverse.sourceSchurAudit,
    inverse.attempts[0].nodes[0]?.schurAudit,
  ));
  expectTrue(`${mode} parent graph identity`, Object.is(
    raw.graph,
    numerical.directParent.numericalEvidence.results[mode],
  ));
  expectTrue(`${mode} inverse-to-case identity`,
    Object.is(raw.eventFreeCase.inverse, inverse));
  expectTrue(`${mode} case-to-hold identity`,
    Object.is(raw.identityHold.case, raw.eventFreeCase));
  expectTrue(`${mode} destination registry identity`, Object.is(
    raw.eventFreeCase.destinationRegistry,
    raw.eventFreeCase.model.newtonScaleRegistry,
  ));

  const referenceSession =
    createPhaseB1ColdEtaOneReferenceConfiguredSolverSessionV1(mode, sha256);
  const fullUnknownScales = Object.freeze([
    ...referenceSession.layout.unknownScales,
    ...Array<number>(4).fill(
      PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.logUnknownScale,
    ),
  ]);
  const fullResidualScales = Object.freeze([
    ...referenceSession.layout.residualScales,
    ...Array<number>(4).fill(
      PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
        .pressureResidualScalePa,
    ),
  ]);
  expectEqual(`${mode} independent layout dimension`,
    fullUnknownScales.length, mode === "on" ? 41 : 36);
  expectEqual(`${mode} independent anchor registry`,
    referenceSession.anchorNewtonScaleRegistryContentSha256,
    inverse.anchorNewtonScaleRegistryContentSha256);

  const factors = inverse.attempts.map((attempt) => attempt.refinementFactor);
  expectEqual(`${mode} factors`, factors.join(","), "2,4,8");
  expectTrue(`${mode} every attempt completed`,
    inverse.attempts.every((attempt) => attempt.completed));
  const recomputedAttempts = inverse.attempts.map((attempt, index) =>
    recomputeContinuationGates(
      `${mode} factor ${factors[index]}`,
      attempt,
      fullUnknownScales,
      fullResidualScales,
    ));
  const selectedIndex = recomputedAttempts.findIndex((attempt) =>
    attempt.hardGatePass && attempt.fiftyPercentGuardPass);
  expectEqual(`${mode} first passing index`, inverse.selectedAttemptIndex,
    selectedIndex);
  expectEqual(`${mode} selected factor`, inverse.selectedRefinementFactor,
    selectedIndex < 0 ? null : factors[selectedIndex]);
  expectTrue(`${mode} independent attempt sources`,
    inverse.allAttemptsStartFromExactSourceIndependently);
  expectTrue(`${mode} independently replayed attempt sources`,
    inverse.attempts.every((attempt) =>
      attempt.nodes.length > 0
      && Object.is(attempt.nodes[0], inverse.attempts[0].nodes[0])
      && Object.is(attempt.nodes[0].coldUnknowns,
        inverse.sourceCanonicalNode.unknowns)
      && attempt.nodes[0].logReferenceMultipliers.every((value) =>
        Object.is(value, 0))
      && attempt.initialization
        === "exact-graph-C-source-log-zero-independent"));
  expectTrue(`${mode} first-pass selection audit`,
    inverse.firstHardAndFiftyPercentGuardSelectionPass);
  expectEqual(`${mode} factor hard/guard pattern`,
    recomputedAttempts.map((attempt) =>
      `${Number(attempt.hardGatePass)}${Number(attempt.fiftyPercentGuardPass)}`
    ).join(","),
    "00,10,11");

  const endpoint = inverse.endpoint;
  if (endpoint === null) throw new Error(`${mode} endpoint is absent`);
  const reverse = inverse.factorEightReverse;
  if (reverse === null || !reverse.completed) {
    throw new Error(`${mode} factor-eight reverse is absent or incomplete`);
  }
  expectTrue(`${mode} endpoint identity`,
    Object.is(raw.eventFreeCase.acceptedInverseEndpoint, endpoint));
  expectTrue(`${mode} endpoint-state identity`, Object.is(
    raw.eventFreeCase.referenceEndpoint,
    endpoint.evaluation.endpoint,
  ));
  expectTrue(`${mode} forward endpoint agreement`,
    inverse.forwardEndpointAgreementPass);
  expectTrue(`${mode} reverse closure`, inverse.factorEightReverseClosurePass);
  expectTrue(`${mode} reverse hard+guard`,
    reverse.hardGatePass && reverse.fiftyPercentGuardPass);
  const recomputedReverse = recomputeContinuationGates(
    `${mode} factor-eight reverse`,
    reverse,
    fullUnknownScales,
    fullResidualScales,
  );
  expectTrue(`${mode} independently recomputed reverse hard+guard`,
    recomputedReverse.hardGatePass
    && recomputedReverse.fiftyPercentGuardPass);
  expectTrue(`${mode} reverse source identity`,
    reverse.initialization === "canonical-factor-eight-forward-endpoint"
    && inverse.attempts[2].completed
    && Object.is(reverse.nodes[0], inverse.attempts[2].endpoint));
  const independentlyRecomputedForwardAgreement =
    maximumPairwiseScaledInfinityDistance(
      inverse.attempts.map((attempt) => {
        if (!attempt.completed) throw new Error(`${mode} attempt incomplete`);
        return attempt.endpoint.fullUnknowns;
      }),
      fullUnknownScales,
    );
  const independentlyRecomputedReverseClosure = scaledInfinityDistance(
    reverse.endpoint.fullUnknowns,
    inverse.attempts[0].nodes[0].fullUnknowns,
    fullUnknownScales,
  );
  expectAtMost(`${mode} forward agreement value replay`, Math.abs(
    independentlyRecomputedForwardAgreement
      - requireNumber(inverse.maximumForwardEndpointAgreementScaledInfinityNorm),
  ), 1e-15);
  expectAtMost(`${mode} reverse closure value replay`, Math.abs(
    independentlyRecomputedReverseClosure
      - requireNumber(inverse.factorEightReverseClosureScaledInfinityNorm),
  ), 1e-15);
  expectAtMost(`${mode} independently recomputed forward agreement gate`,
    independentlyRecomputedForwardAgreement,
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.gates
      .maximumForwardEndpointAgreementScaledInfinityNorm);
  expectAtMost(`${mode} independently recomputed reverse closure gate`,
    independentlyRecomputedReverseClosure,
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.gates
      .maximumFactorEightReverseClosureScaledInfinityNorm);

  const nodes = [
    ...inverse.attempts.flatMap((attempt) => attempt.nodes),
    ...reverse.nodes,
  ];
  const anchorReference = inverse.attempts[0].nodes[0]
    ?.referenceConfiguration;
  if (anchorReference === undefined) {
    throw new Error(`${mode} source reference configuration absent`);
  }
  let maximumPressureScheduleErrorPa = 0;
  let maximumReferenceConfigurationError = 0;
  let maximumPrimarySchurReconstructionDifference = 0;
  let maximumPrimarySingularValueReconstructionDifference = 0;
  let maximumIndependentSingularValueReconstructionDifference = 0;
  let maximumCoarseFineMaximumDifferenceReconstructionError = 0;
  let maximumPrimaryColdPivotReconstructionDifference = 0;
  for (const [nodeIndex, node] of nodes.entries()) {
    const scope = `${mode} node ${nodeIndex} rho=${node.rho}`;
    expectEqual(`${scope} full dimension`, node.fullUnknowns.length,
      mode === "on" ? 41 : 36);
    expectEqual(`${scope} cold dimension`, node.coldUnknowns.length,
      mode === "on" ? 37 : 32);
    expectTrue(`${scope} graph center identity`,
      node.sourceGraphCanonicalNodeObjectIdentity
      && Object.is(node.sourceGraphCanonicalNode, inverse.sourceCanonicalNode));
    expectTrue(`${scope} cold restoring audit`, node.coldRestoringAudit.pass);
    expectTrue(`${scope} zero flows`, node.allFlowsExactlyZero);
    expectTrue(`${scope} hard gate`, node.hardGatePass);
    verifyEffectiveStencil(scope, node);
    verifySchurGates(scope, node);

    for (const chamber of PRESSURE_ORDER) {
      const expected = expectedPressure(inverse, node.rho, chamber);
      maximumPressureScheduleErrorPa = Math.max(
        maximumPressureScheduleErrorPa,
        Math.abs(node.targetChamberPressurePa[chamber] - expected),
      );
    }
    maximumReferenceConfigurationError = Math.max(
      maximumReferenceConfigurationError,
      referenceConfigurationError(anchorReference, node),
    );
    const rebuiltSchur = rebuildPrimaryScaledSchur(node);
    maximumPrimarySchurReconstructionDifference = Math.max(
      maximumPrimarySchurReconstructionDifference,
      maximumMatrixDifference(rebuiltSchur, node.schurAudit.scaledSchur),
    );
    const rebuiltSingularValues = singularValues4x4(rebuiltSchur);
    maximumPrimarySingularValueReconstructionDifference = Math.max(
      maximumPrimarySingularValueReconstructionDifference,
      maximumVectorDifference(
        rebuiltSingularValues,
        node.schurAudit.singularValuesDescending,
      ),
    );
    const rebuiltIndependentSingularValues = singularValues4x4(
      node.schurAudit.independentScaledSchur,
    );
    maximumIndependentSingularValueReconstructionDifference = Math.max(
      maximumIndependentSingularValueReconstructionDifference,
      maximumVectorDifference(
        rebuiltIndependentSingularValues,
        node.schurAudit.independentSingularValuesDescending,
      ),
    );
    const recomputedCoarseFineMaximum = maximumMatrixDifference(
      node.schurAudit.scaledSchur,
      node.schurAudit.independentScaledSchur,
    );
    maximumCoarseFineMaximumDifferenceReconstructionError = Math.max(
      maximumCoarseFineMaximumDifferenceReconstructionError,
      Math.abs(recomputedCoarseFineMaximum
        - node.schurAudit.maximumIndependentScaledSchurAbsoluteDifference),
    );
    const primarySvdMetrics = svdMetrics(rebuiltSingularValues);
    const independentSvdMetrics = svdMetrics(
      rebuiltIndependentSingularValues,
    );
    expectEqual(`${scope} reconstructed primary rank`, primarySvdMetrics.rank,
      node.schurAudit.rank);
    expectEqual(`${scope} reconstructed independent rank`,
      independentSvdMetrics.rank, node.schurAudit.independentRank);
    expectAtMost(`${scope} reconstructed primary condition`, Math.abs(
      primarySvdMetrics.conditionNumber2 - node.schurAudit.conditionNumber2,
    ), 5e-9);
    expectAtMost(`${scope} reconstructed independent condition`, Math.abs(
      independentSvdMetrics.conditionNumber2
        - node.schurAudit.independentConditionNumber2,
    ), 5e-9);
    maximumPrimaryColdPivotReconstructionDifference = Math.max(
      maximumPrimaryColdPivotReconstructionDifference,
      Math.abs(coldBlockRelativeMinimumPivot(node)
        - node.schurAudit.minimumColdBlockRelativePivot),
    );
  }
  expectAtMost(`${mode} pressure schedule reconstruction`,
    maximumPressureScheduleErrorPa, 2e-11);
  expectAtMost(`${mode} reference configuration reconstruction`,
    maximumReferenceConfigurationError, 1e-15);
  expectAtMost(`${mode} primary Schur reconstruction`,
    maximumPrimarySchurReconstructionDifference, 5e-12);
  expectAtMost(`${mode} primary singular reconstruction`,
    maximumPrimarySingularValueReconstructionDifference, 5e-12);
  expectAtMost(`${mode} independent singular reconstruction`,
    maximumIndependentSingularValueReconstructionDifference, 5e-12);
  expectAtMost(`${mode} coarse/fine maximum reconstruction`,
    maximumCoarseFineMaximumDifferenceReconstructionError, 5e-15);
  expectAtMost(`${mode} primary cold pivot reconstruction`,
    maximumPrimaryColdPivotReconstructionDifference, 5e-12);

  expectEqual(`${mode} failure probe indices`,
    inverse.failureProbes.map((probe) => probe.injectedAttemptIndex).join(","),
    "0,1");
  for (const probe of inverse.failureProbes) {
    expectTrue(`${mode} failure probe ${probe.injectedAttemptIndex}`,
      probe.pass && !probe.result.completed
      && !probe.result.hardGatePass
      && !probe.result.fiftyPercentGuardPass
      && probe.rollbackUnknownsObjectIdentity
      && (probe.injectedAttemptIndex === 0
        ? probe.rollbackNodeIsSourceObject
        : probe.rollbackNodeIsAcceptedMidpointObject));
  }

  const registryAudit = raw.eventFreeCase.registryAudit;
  assertCanonicalFourChamberNewtonScaleRegistryV1(
    raw.eventFreeCase.destinationRegistry,
  );
  validateFourChamberNewtonScaleRegistryV1(
    raw.eventFreeCase.destinationRegistry,
    sha256,
  );
  expectTrue(`${mode} destination registry audit`, registryAudit.pass);
  expectEqual(`${mode} registry compilation count`,
    registryAudit.registryCompilationCount, 1);
  expectTrue(`${mode} destination static audit`,
    raw.eventFreeCase.staticAudit.pass);
  expectTrue(`${mode} destination registry changed`,
    registryAudit.registryContentHashChanged);
  expectTrue(`${mode} destination flows zero`, Object.values(
    raw.eventFreeCase.destinationEvaluation.closedLoop.allFlowsM3PerSec,
  ).every((flow) => Object.is(flow, 0)));
  expectAtMost(`${mode} endpoint pressure extrema replay`, Math.abs(
    maximumChamberTargetPressureDifference(
      endpoint.evaluation.closedLoop.chamberAbsolutePressurePa,
      endpoint.targetChamberPressurePa,
    ) - endpoint.maximumAbsoluteChamberTargetPressureDifferencePa,
  ), 0);
  expectAtMost(`${mode} endpoint acceleration extrema replay`, Math.abs(
    maximumInertialAcceleration(endpoint.evaluation.closedLoop.inertialMomentum)
      - endpoint.maximumAbsoluteInertialFlowAccelerationM3PerSec2,
  ), 0);

  const hold = raw.identityHold;
  expectEqual(`${mode} dt grid`, hold.dtGridSec.join(","),
    "0.000125,0.00025,0.0005");
  expectTrue(`${mode} independent hold starts`,
    hold.everyStepStartedFromSameReferenceEndpointIndependently);
  expectTrue(`${mode} registry reused`,
    hold.destinationRegistryObjectReusedAcrossAllSteps
    && !hold.destinationRegistryRecompiledDuringHold);
  expectTrue(`${mode} hold adaptation boundary`,
    hold.adaptiveRescalingApplied === false
    && hold.analyticalExactEquilibriumClaimed === false
    && hold.closedLoopStationarityPass === false);
  const referenceTopology = encodePhaseB1EndpointTopologyVectorsV1(
    raw.eventFreeCase.referenceEndpoint,
  );
  const referenceNewtonState = [
    ...referenceTopology.nonCalciumDifferentialState,
    ...referenceTopology.algebraicState,
  ];
  expectTrue(`${mode} complete ordered hold dt inventory`,
    hold.dtGridSec.length === 3
    && hold.stepAudits.length === hold.dtGridSec.length
    && hold.stepAudits.every((audit, index) =>
      Object.is(audit.dtSec, hold.dtGridSec[index])));
  for (const audit of hold.stepAudits) {
    expectTrue(`${mode} hold ${audit.dtSec}`, audit.pass && audit.converged
      && audit.previousEndpointReplaysReferenceTimeExact
      && audit.previousEndpointNonTimeStateExact
      && audit.nextTimeAdvanceExact
      && audit.nextNewtonTopologyExact
      && audit.nextCalciumStateExact
      && audit.allCalciumScalarsExactlyZero
      && audit.acceptedNewtonStepCountExactZero
      && audit.allClosedLoopFlowsExactlyZero
      && audit.exactVolumeIdentityPass
      && audit.destinationRegistryObjectIdentityAtInvocation
      && audit.eventFree
      && audit.noProjectionClippingClampOrFallback
      && audit.slsTopologyPreserved);
    expectEqual(`${mode} hold Newton scalar count ${audit.dtSec}`,
      audit.comparedNewtonScalarCount, mode === "on" ? 51 : 46);
    expectEqual(`${mode} hold calcium scalar count ${audit.dtSec}`,
      audit.comparedCalciumScalarCount, 10);
    if (audit.result.converged) {
      const result = audit.result;
      expectEqual(`${mode} accepted Newton steps ${audit.dtSec}`,
        result.newtonDiagnostics.acceptedStepCount, 0);
      const previousTopology = encodePhaseB1EndpointTopologyVectorsV1(
        result.previousEndpoint,
      );
      const previousNewtonState = [
        ...previousTopology.nonCalciumDifferentialState,
        ...previousTopology.algebraicState,
      ];
      expectTrue(`${mode} independent previous-time identity ${audit.dtSec}`,
        Object.is(
          result.previousEndpoint.timeSec,
          raw.eventFreeCase.referenceEndpoint.timeSec,
        ));
      expectTrue(`${mode} independent previous Newton identity ${audit.dtSec}`,
        exactNumberArrayObjectIs(previousNewtonState, referenceNewtonState));
      expectTrue(`${mode} independent previous calcium identity ${audit.dtSec}`,
        WALL_IDS.every((wallId) =>
          Object.is(
            previousTopology.calciumByWall[wallId].r,
            referenceTopology.calciumByWall[wallId].r,
          )
          && Object.is(
            previousTopology.calciumByWall[wallId].d,
            referenceTopology.calciumByWall[wallId].d,
          )));
      const nextTopology = encodePhaseB1EndpointTopologyVectorsV1(
        result.nextEndpointLeftLimit,
      );
      const nextNewtonState = [
        ...nextTopology.nonCalciumDifferentialState,
        ...nextTopology.algebraicState,
      ];
      expectEqual(`${mode} independent Newton topology count ${audit.dtSec}`,
        nextNewtonState.length, mode === "on" ? 51 : 46);
      expectTrue(`${mode} independent Newton identity ${audit.dtSec}`,
        exactNumberArrayObjectIs(nextNewtonState, referenceNewtonState));
      expectTrue(`${mode} independent calcium identity ${audit.dtSec}`,
        WALL_IDS.every((wallId) =>
          Object.is(
            nextTopology.calciumByWall[wallId].r,
            referenceTopology.calciumByWall[wallId].r,
          )
          && Object.is(
            nextTopology.calciumByWall[wallId].d,
            referenceTopology.calciumByWall[wallId].d,
          )
          && Object.is(
            result.calciumDriveStateByWallAtEndLeftLimit[wallId].r,
            referenceTopology.calciumByWall[wallId].r,
          )
          && Object.is(
            result.calciumDriveStateByWallAtEndLeftLimit[wallId].d,
            referenceTopology.calciumByWall[wallId].d,
          )));
      expectTrue(`${mode} independent next-time identity ${audit.dtSec}`,
        Object.is(
          result.nextEndpointLeftLimit.timeSec,
          raw.eventFreeCase.referenceEndpoint.timeSec + audit.dtSec,
        ));
      expectTrue(`${mode} independent volume identity ${audit.dtSec}`,
        BLOOD_COMPARTMENT_IDS.every((compartmentId) => Object.is(
          result.nextEndpointLeftLimit.differentialState
            .bloodVolumesM3[compartmentId],
          raw.eventFreeCase.referenceEndpoint.differentialState
            .bloodVolumesM3[compartmentId],
        ))
        && Object.is(result.totalBloodVolumeChangeM3, 0)
        && Object.is(
          result.residualEvaluation.volumeResidual
            .maximumAbsoluteResidualM3PerSec,
          0,
        )
        && Object.is(
          result.residualEvaluation.volumeResidual.summedResidualM3PerSec,
          0,
        )
        && Object.is(
          result.residualEvaluation.volumeResidual.totalBloodVolumeChangeM3,
          0,
        ));
      expectTrue(`${mode} independent zero flows ${audit.dtSec}`,
        Object.values(result.nextEvaluation.closedLoop.allFlowsM3PerSec)
          .every((flow) => Object.is(flow, 0)));
      expectTrue(`${mode} independent Newton gates ${audit.dtSec}`,
        result.newtonDiagnostics.finalResidualInfinityNorm
          <= raw.eventFreeCase.destinationRegistry.tolerances
            .globalResidualInfinityNorm
        && result.newtonDiagnostics.finalUpdateInfinityNorm
          <= raw.eventFreeCase.destinationRegistry.tolerances
            .globalUpdateInfinityNorm);
      expectTrue(`${mode} reported step gates ${audit.dtSec}`,
        audit.scaledResidualGatePass
        && audit.scaledUpdateGatePass
        && audit.chamberPressureGatePass
        && audit.inertialFlowAccelerationGatePass);
      expectEqual(`${mode} residual diagnostic replay ${audit.dtSec}`,
        audit.finalScaledResidualInfinityNorm,
        result.newtonDiagnostics.finalResidualInfinityNorm);
      expectEqual(`${mode} update diagnostic replay ${audit.dtSec}`,
        audit.finalScaledUpdateInfinityNorm,
        result.newtonDiagnostics.finalUpdateInfinityNorm);
      expectEqual(`${mode} volume residual replay ${audit.dtSec}`,
        audit.maximumAbsoluteVolumeResidualM3PerSec,
        result.residualEvaluation.volumeResidual
          .maximumAbsoluteResidualM3PerSec);
      expectEqual(`${mode} blood-volume change replay ${audit.dtSec}`,
        audit.totalBloodVolumeChangeM3, result.totalBloodVolumeChangeM3);
      const independentlyRecomputedStepPressure =
        maximumChamberTargetPressureDifference(
          result.nextEvaluation.closedLoop.chamberAbsolutePressurePa,
          endpoint.targetChamberPressurePa,
        );
      const independentlyRecomputedStepAcceleration =
        maximumInertialAcceleration(
          result.nextEvaluation.closedLoop.inertialMomentum,
        );
      expectTrue(`${mode} independent pressure/acceleration gates ${audit.dtSec}`,
        independentlyRecomputedStepPressure
          <= PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.gates
            .maximumAbsoluteDestinationPressureDifferencePa
        && independentlyRecomputedStepAcceleration
          <= PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.gates
            .maximumAbsoluteDestinationFlowAccelerationM3PerSec2);
      expectAtMost(`${mode} hold pressure extrema replay ${audit.dtSec}`,
        Math.abs(independentlyRecomputedStepPressure
          - requireNumber(
            audit.maximumAbsoluteChamberTargetPressureDifferencePa,
          )), 0);
      expectAtMost(`${mode} hold acceleration extrema replay ${audit.dtSec}`,
        Math.abs(independentlyRecomputedStepAcceleration
          - requireNumber(
            audit.maximumAbsoluteInertialFlowAccelerationM3PerSec2,
          )), 0);
    }
  }
  expectTrue(`${mode} hold aggregate`, hold.allDtGridStepsPass
    && hold.projectSyntheticToleranceCertifiedIdentityHoldPass);
  expectTrue(`${mode} summary mode pass`, summary.modePass);
  expectTrue(`${mode} summary identity aggregate`,
    summary.rawIdentity.allIdentityLinksExact);
  expectTrue(`${mode} summary Schur aggregate`,
    summary.continuationExtrema.everySchurRankFour
    && summary.continuationExtrema
      .everySchurEffectiveStepAndStencilGatePass
    && summary.continuationExtrema.everySchurIndependentAgreementPass
    && summary.continuationExtrema.everySchurJacobiAuditConverged
    && summary.continuationExtrema.everyColdRestoringAuditPass);
  expectTrue(`${mode} summary narrow-only boundary`,
    Object.values(summary.narrowClaims).every((value) => value === true)
    && Object.values(summary.broadClaims).every((value) => value === false)
    && Object.values(summary.prohibitedOperations)
      .every((value) => value === false));

  return Object.freeze({
    selectedRefinementFactor: inverse.selectedRefinementFactor,
    endpointLogReferenceMultipliers: endpoint.logReferenceMultipliers,
    maximumForwardEndpointAgreementScaledInfinityNorm:
      inverse.maximumForwardEndpointAgreementScaledInfinityNorm,
    factorEightReverseClosureScaledInfinityNorm:
      inverse.factorEightReverseClosureScaledInfinityNorm,
    maximumPressureScheduleErrorPa,
    maximumReferenceConfigurationError,
    maximumPrimarySchurReconstructionDifference,
    maximumPrimarySingularValueReconstructionDifference,
    maximumIndependentSingularValueReconstructionDifference,
    maximumCoarseFineMaximumDifferenceReconstructionError,
    maximumPrimaryColdPivotReconstructionDifference,
    minimumPrimarySchurSigma:
      summary.continuationExtrema.minimumPrimarySchurSigma,
    minimumIndependentSchurSigma:
      summary.continuationExtrema.minimumIndependentSchurSigma,
    maximumPrimarySchurConditionNumber2:
      summary.continuationExtrema.maximumPrimarySchurConditionNumber2,
    maximumIndependentSchurConditionNumber2:
      summary.continuationExtrema.maximumIndependentSchurConditionNumber2,
    minimumPrimaryColdBlockRelativePivot:
      summary.continuationExtrema.minimumPrimaryColdBlockRelativePivot,
    minimumIndependentColdBlockRelativePivot:
      summary.continuationExtrema.minimumIndependentColdBlockRelativePivot,
    maximumCoarseFineScaledSchurAbsoluteDifference:
      summary.continuationExtrema
        .maximumCoarseFineScaledSchurAbsoluteDifference,
    endpointPressureDifferencePa:
      endpoint.maximumAbsoluteChamberTargetPressureDifferencePa,
    endpointAccelerationM3PerSec2:
      endpoint.maximumAbsoluteInertialFlowAccelerationM3PerSec2,
    destinationRegistryContentSha256:
      raw.eventFreeCase.destinationRegistry.registryContentSha256,
    holdDtResiduals: hold.stepAudits.map((audit) =>
      audit.finalScaledResidualInfinityNorm),
    holdDtUpdates: hold.stepAudits.map((audit) =>
      audit.finalScaledUpdateInfinityNorm),
  });
}

function recomputeContinuationGates(
  scope: string,
  continuation: PhaseB1QuiescentPressureReferenceContinuationResultV1,
  unknownScales: readonly number[],
  residualScales: readonly number[],
) {
  if (!continuation.completed) {
    expectTrue(`${scope} is a completed continuation`, false);
    return Object.freeze({
      hardGatePass: false,
      fiftyPercentGuardPass: false,
    });
  }
  const expectedRhoValues = Array.from(
    { length: continuation.refinementFactor + 1 },
    (_, index) => continuation.direction === "forward"
      ? index / continuation.refinementFactor
      : 1 - index / continuation.refinementFactor,
  );
  expectTrue(`${scope} exact continuation inventory`,
    continuation.nodes.length === continuation.refinementFactor + 1
    && continuation.edges.length === continuation.refinementFactor
    && exactNumberArrayObjectIs(
      continuation.requestedRhoValues,
      expectedRhoValues,
    )
    && exactNumberArrayObjectIs(
      continuation.attemptedRhoValues,
      expectedRhoValues,
    )
    && Object.is(
      continuation.endpoint,
      continuation.nodes[continuation.nodes.length - 1],
    ));
  const nodeGates = continuation.nodes.map((node, index) =>
    recomputeNodeGates(`${scope} node ${index}`, node, residualScales));
  const recomputedEdges = continuation.edges.map((edge, index) => {
    const previousNode = continuation.nodes[index];
    const acceptedNode = continuation.nodes[index + 1];
    const acceptedStep = scaledInfinityDistance(
      acceptedNode.fullUnknowns,
      previousNode.fullUnknowns,
      unknownScales,
    );
    const predictorCorrection = scaledInfinityDistance(
      acceptedNode.fullUnknowns,
      edge.predictorUnknowns,
      unknownScales,
    );
    let tangentLinearResidual = 0;
    for (let row = 0; row < previousNode.fullUnknowns.length; row += 1) {
      let residual = edge.tangentAudit.scaledResidualDerivativeByRho[row];
      for (
        let column = 0;
        column < previousNode.fullUnknowns.length;
        column += 1
      ) {
        residual += previousNode.fullJacobian.scaledJacobian[row][column]
          * edge.tangentAudit.scaledUnknownTangentByRho[column];
      }
      tangentLinearResidual = Math.max(tangentLinearResidual,
        Math.abs(residual));
    }
    const tangentPass = tangentLinearResidual <= 1e-10;
    const edgePass = tangentPass
      && nodeGates[index + 1].hardGatePass
      && acceptedStep
        <= PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.gates
          .maximumAcceptedNodeStepScaledInfinityNorm
      && predictorCorrection
        <= PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.gates
          .maximumPredictorCorrectionScaledInfinityNorm;
    expectTrue(`${scope} edge ${index} identities`,
      edge.edgeIndex === index
      && Object.is(edge.fromRho, previousNode.rho)
      && Object.is(edge.toRho, acceptedNode.rho)
      && Object.is(edge.acceptedNode, acceptedNode)
      && Object.is(edge.acceptedUnknowns, acceptedNode.fullUnknowns));
    expectAtMost(`${scope} edge ${index} step replay`, Math.abs(
      acceptedStep - edge.acceptedNodeStepScaledInfinityNorm,
    ), 0);
    expectAtMost(`${scope} edge ${index} predictor replay`, Math.abs(
      predictorCorrection - edge.predictorCorrectionScaledInfinityNorm,
    ), 0);
    expectAtMost(`${scope} edge ${index} tangent replay`, Math.abs(
      tangentLinearResidual - edge.tangentAudit.linearResidualInfinityNorm,
    ), 1e-15);
    expectEqual(`${scope} edge ${index} tangent pass`,
      edge.tangentAudit.pass, tangentPass);
    expectEqual(`${scope} edge ${index} pass`, edge.pass, edgePass);
    return Object.freeze({ acceptedStep, predictorCorrection, edgePass });
  });
  const maximumAcceptedStep = Math.max(...recomputedEdges.map((edge) =>
    edge.acceptedStep));
  const maximumPredictorCorrection = Math.max(...recomputedEdges.map((edge) =>
    edge.predictorCorrection));
  const maximumFiberLogStrain = Math.max(...nodeGates.map((node) =>
    node.maximumAbsoluteFiberLogStrain));
  const hardGatePass = nodeGates.every((node) => node.hardGatePass)
    && recomputedEdges.every((edge) => edge.edgePass)
    && maximumAcceptedStep
      <= PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.gates
        .maximumAcceptedNodeStepScaledInfinityNorm
    && maximumPredictorCorrection
      <= PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.gates
        .maximumPredictorCorrectionScaledInfinityNorm;
  const fiftyPercentGuardPass = hardGatePass
    && nodeGates.every((node) => node.fiftyPercentGuardPass)
    && maximumAcceptedStep
      <= PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
        .fiftyPercentGuard.maximumAcceptedNodeStepScaledInfinityNorm
    && maximumPredictorCorrection
      <= PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
        .fiftyPercentGuard.maximumPredictorCorrectionScaledInfinityNorm
    && maximumFiberLogStrain
      <= PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
        .fiftyPercentGuard.maximumAbsoluteFiberLogStrain;
  expectAtMost(`${scope} maximum accepted-step replay`, Math.abs(
    maximumAcceptedStep
      - continuation.maximumAcceptedNodeStepScaledInfinityNorm,
  ), 0);
  expectAtMost(`${scope} maximum predictor-correction replay`, Math.abs(
    maximumPredictorCorrection
      - continuation.maximumPredictorCorrectionScaledInfinityNorm,
  ), 0);
  expectAtMost(`${scope} maximum fiber-strain replay`, Math.abs(
    maximumFiberLogStrain - continuation.maximumAbsoluteFiberLogStrain,
  ), 0);
  expectEqual(`${scope} hard gate replay`, continuation.hardGatePass,
    hardGatePass);
  expectEqual(`${scope} fifty-percent gate replay`,
    continuation.fiftyPercentGuardPass, fiftyPercentGuardPass);
  return Object.freeze({
    hardGatePass,
    fiftyPercentGuardPass,
  });
}

function recomputeNodeGates(
  scope: string,
  node: PhaseB1QuiescentPressureReferenceNodeV1,
  residualScales: readonly number[],
) {
  const policy = PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1;
  const scaledResidualInfinityNorm = Math.max(...node.fullResidual.map(
    (value, index) => Math.abs(value / residualScales[index]),
  ));
  const maximumPressureDifference = maximumChamberTargetPressureDifference(
    node.evaluation.closedLoop.chamberAbsolutePressurePa,
    node.targetChamberPressurePa,
  );
  const maximumAcceleration = maximumInertialAcceleration(
    node.evaluation.closedLoop.inertialMomentum,
  );
  const maximumAbsoluteFiberLogStrain = Math.max(
    Math.abs(node.evaluation.closedLoop.atria.LA.geometry.fiberLogStrain),
    Math.abs(node.evaluation.closedLoop.atria.RA.geometry.fiberLogStrain),
    Math.abs(node.evaluation.closedLoop.triSegGeometry.walls.LVFW
      .fiberLogStrain),
    Math.abs(node.evaluation.closedLoop.triSegGeometry.walls.SEP
      .fiberLogStrain),
    Math.abs(node.evaluation.closedLoop.triSegGeometry.walls.RVFW
      .fiberLogStrain),
  );
  const allFlowsExactlyZero = Object.values(
    node.evaluation.closedLoop.allFlowsM3PerSec,
  ).every((flow) => Object.is(flow, 0));
  const prohibitedOperationsAbsent =
    !node.evaluation.projectionApplied
    && !node.evaluation.clippingApplied
    && !node.evaluation.closedLoop.projectionApplied
    && !node.evaluation.closedLoop.flowClampApplied
    && !node.evaluation.closedLoop.fallbackApplied;
  const restoring = node.coldRestoringAudit.restoringNode;
  const coldRestoringPass = restoring.converged
    && exactNumberArrayObjectIs(restoring.unknowns, node.coldUnknowns)
    && restoring.minimumLandSimplexMargin >= 1e-8
    && restoring.maximumLocalMaterialResidualInfinityNorm <= 1e-10
    && restoring.effectiveTriSegAudit.accepted
    && restoring.effectiveTriSegAudit
      .withinPublishedTaylorTwoPercentTensionErrorDomain
    && (!node.coldRestoringAudit.sourceGraphNodeObjectReused
      || Object.is(restoring, node.sourceGraphCanonicalNode));
  const primarySingularValues = singularValues4x4(
    node.schurAudit.scaledSchur,
  );
  const independentSingularValues = singularValues4x4(
    node.schurAudit.independentScaledSchur,
  );
  const primarySvd = svdMetrics(primarySingularValues);
  const independentSvd = svdMetrics(independentSingularValues);
  const primaryPivot = coldBlockRelativeMinimumPivot(node);
  const independentPivot = Math.min(
    ...node.schurAudit.independentColdBlockLuDiagnosticsByLog.map(
      (diagnostics) => diagnostics.relativeMinimumPivot,
    ),
  );
  const schurDifference = maximumMatrixDifference(
    node.schurAudit.scaledSchur,
    node.schurAudit.independentScaledSchur,
  );
  const schurHardGatePass = primarySvd.rank === 4
    && independentSvd.rank === 4
    && primaryPivot >= policy.gates.minimumColdBlockRelativePivot
    && independentPivot >= policy.gates.minimumColdBlockRelativePivot
    && primarySingularValues[3] >= policy.gates.minimumSchurSingularValue
    && independentSingularValues[3] >= policy.gates.minimumSchurSingularValue
    && primarySvd.relativeMinimumSingularValue
      >= policy.gates.minimumRelativeSchurSingularValue
    && independentSvd.relativeMinimumSingularValue
      >= policy.gates.minimumRelativeSchurSingularValue
    && primarySvd.conditionNumber2 <= policy.gates.maximumSchurConditionNumber2
    && independentSvd.conditionNumber2
      <= policy.gates.maximumSchurConditionNumber2
    && schurDifference <= policy.maximumIndependentScaledSchurAbsoluteDifference
    && recomputedEffectiveStencilPass(node);
  const schurFiftyPercentGuardPass = schurHardGatePass
    && primaryPivot >= policy.fiftyPercentGuard.minimumColdBlockRelativePivot
    && independentPivot
      >= policy.fiftyPercentGuard.minimumColdBlockRelativePivot
    && primarySingularValues[3]
      >= policy.fiftyPercentGuard.minimumSchurSingularValue
    && independentSingularValues[3]
      >= policy.fiftyPercentGuard.minimumSchurSingularValue
    && primarySvd.relativeMinimumSingularValue
      >= policy.fiftyPercentGuard.minimumRelativeSchurSingularValue
    && independentSvd.relativeMinimumSingularValue
      >= policy.fiftyPercentGuard.minimumRelativeSchurSingularValue
    && primarySvd.conditionNumber2
      <= policy.fiftyPercentGuard.maximumSchurConditionNumber2
    && independentSvd.conditionNumber2
      <= policy.fiftyPercentGuard.maximumSchurConditionNumber2;
  const destination = Object.is(node.rho, 1);
  const hardGatePass = prohibitedOperationsAbsent
    && allFlowsExactlyZero
    && coldRestoringPass
    && maximumAbsoluteFiberLogStrain
      < policy.strictMaximumAbsoluteFiberLogStrain
    && scaledResidualInfinityNorm
      <= policy.gates.maximumScaledResidualInfinityNorm
    && schurHardGatePass
    && maximumPressureDifference
      <= policy.gates.maximumAbsoluteDestinationPressureDifferencePa
    && (!destination
      || maximumAcceleration
        <= policy.gates.maximumAbsoluteDestinationFlowAccelerationM3PerSec2);
  const fiftyPercentGuardPass = hardGatePass
    && schurFiftyPercentGuardPass
    && maximumAbsoluteFiberLogStrain
      <= policy.fiftyPercentGuard.maximumAbsoluteFiberLogStrain
    && scaledResidualInfinityNorm
      <= policy.fiftyPercentGuard.maximumScaledResidualInfinityNorm
    && maximumPressureDifference
      <= policy.fiftyPercentGuard
        .maximumAbsoluteDestinationPressureDifferencePa
    && (!destination
      || maximumAcceleration
        <= policy.fiftyPercentGuard
          .maximumAbsoluteDestinationFlowAccelerationM3PerSec2);
  expectAtMost(`${scope} residual norm replay`, Math.abs(
    scaledResidualInfinityNorm - node.scaledResidualInfinityNorm,
  ), 0);
  expectAtMost(`${scope} pressure extrema replay`, Math.abs(
    maximumPressureDifference
      - node.maximumAbsoluteChamberTargetPressureDifferencePa,
  ), 0);
  expectAtMost(`${scope} acceleration extrema replay`, Math.abs(
    maximumAcceleration
      - node.maximumAbsoluteInertialFlowAccelerationM3PerSec2,
  ), 0);
  expectAtMost(`${scope} fiber extrema replay`, Math.abs(
    maximumAbsoluteFiberLogStrain - node.maximumAbsoluteFiberLogStrain,
  ), 0);
  expectEqual(`${scope} zero-flow replay`, node.allFlowsExactlyZero,
    allFlowsExactlyZero);
  expectEqual(`${scope} cold-restoring replay`,
    node.coldRestoringAudit.pass, coldRestoringPass);
  expectEqual(`${scope} hard gate replay`, node.hardGatePass, hardGatePass);
  expectEqual(`${scope} fifty-percent gate replay`,
    node.fiftyPercentGuardPass, fiftyPercentGuardPass);
  return Object.freeze({
    hardGatePass,
    fiftyPercentGuardPass,
    maximumAbsoluteFiberLogStrain,
  });
}

function recomputedEffectiveStencilPass(
  node: PhaseB1QuiescentPressureReferenceNodeV1,
): boolean {
  const audit = node.schurAudit;
  const dimension = node.fullUnknowns.length;
  return exactDenseArray(audit.primaryScaledStepByColumn, dimension)
    && exactDenseArray(audit.independentScaledStepByColumn, dimension)
    && exactDenseArray(audit.primaryStencilByColumn, dimension)
    && exactDenseArray(audit.independentStencilByColumn, dimension)
    && Object.is(
      audit.primaryScaledStepByColumn,
      node.fullJacobian.scaledStepByColumn,
    )
    && Object.is(
      audit.primaryStencilByColumn,
      node.fullJacobian.stencilByColumn,
    )
    && audit.primaryScaledStepByColumn.every((step, index) =>
      step > 0
      && step <= PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
        .fullJacobianScaledStep
      && audit.independentScaledStepByColumn[index] > step
      && audit.independentScaledStepByColumn[index]
        <= PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
          .independentSchurJacobianScaledStep
      && !Object.is(step, audit.independentScaledStepByColumn[index]));
}

function verifyEffectiveStencil(
  scope: string,
  node: PhaseB1QuiescentPressureReferenceNodeV1,
): void {
  const audit = node.schurAudit;
  const dimension = node.fullUnknowns.length;
  const inventories = [
    audit.primaryScaledStepByColumn,
    audit.independentScaledStepByColumn,
    audit.primaryStencilByColumn,
    audit.independentStencilByColumn,
  ];
  expectTrue(`${scope} dense effective stencil inventories`,
    inventories.every((inventory) => exactDenseArray(inventory, dimension)));
  expectTrue(`${scope} primary full-Jacobian stencil identity`,
    Object.is(
      audit.primaryScaledStepByColumn,
      node.fullJacobian.scaledStepByColumn,
    )
    && Object.is(
      audit.primaryStencilByColumn,
      node.fullJacobian.stencilByColumn,
    ));
  expectEqual(`${scope} primary nominal step`, node.fullJacobian.scaledStep,
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
      .fullJacobianScaledStep);
  expectEqual(`${scope} independent nominal step`, audit.independentScaledStep,
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
      .independentSchurJacobianScaledStep);
  const allowedStencils = new Set([
    "centered-five-point",
    "forward-five-point",
    "backward-five-point",
  ]);
  expectTrue(`${scope} stencil enums`,
    [...audit.primaryStencilByColumn, ...audit.independentStencilByColumn]
      .every((stencil) => allowedStencils.has(stencil)));
  expectTrue(`${scope} effective steps`,
    audit.primaryScaledStepByColumn.every((step, index) =>
      step > 0
      && step
        <= PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
          .fullJacobianScaledStep
      && audit.independentScaledStepByColumn[index] > step
      && audit.independentScaledStepByColumn[index]
        <= PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
          .independentSchurJacobianScaledStep
      && !Object.is(step, audit.independentScaledStepByColumn[index])));
  expectTrue(`${scope} effective stencil gate`,
    audit.effectiveJacobianStencilGatePass);
}

function verifySchurGates(
  scope: string,
  node: PhaseB1QuiescentPressureReferenceNodeV1,
): void {
  const audit = node.schurAudit;
  const gates = PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.gates;
  expectTrue(`${scope} Schur rank`,
    audit.rank === 4 && audit.independentRank === 4);
  expectTrue(`${scope} Schur singular values`,
    audit.singularValuesDescending[3] >= gates.minimumSchurSingularValue
    && audit.independentSingularValuesDescending[3]
      >= gates.minimumSchurSingularValue
    && audit.relativeMinimumSingularValue
      >= gates.minimumRelativeSchurSingularValue
    && audit.independentRelativeMinimumSingularValue
      >= gates.minimumRelativeSchurSingularValue);
  expectTrue(`${scope} Schur condition`,
    audit.conditionNumber2 <= gates.maximumSchurConditionNumber2
    && audit.independentConditionNumber2
      <= gates.maximumSchurConditionNumber2);
  expectTrue(`${scope} cold pivots`,
    audit.minimumColdBlockRelativePivot
      >= gates.minimumColdBlockRelativePivot
    && audit.independentMinimumColdBlockRelativePivot
      >= gates.minimumColdBlockRelativePivot
    && audit.coldBlockLuDiagnosticsByLog.length === 4
    && audit.independentColdBlockLuDiagnosticsByLog.length === 4);
  const allLuDiagnostics = [
    ...audit.coldBlockLuDiagnosticsByLog,
    ...audit.independentColdBlockLuDiagnosticsByLog,
  ];
  expectTrue(`${scope} LU diagnostic inventory`, allLuDiagnostics.every(
    (diagnostics) => diagnostics.dimension === node.coldUnknowns.length
      && diagnostics.matrixInfinityNorm > 0
      && diagnostics.maximumAbsoluteOriginalEntry > 0
      && diagnostics.maximumAbsoluteFactorEntry > 0
      && diagnostics.minimumAbsolutePivot > 0
      && diagnostics.maximumAbsolutePivot > 0
      && diagnostics.relativeMinimumPivot > 0
      && diagnostics.pivotGrowthFactor > 0
      && diagnostics.pivotThreshold > 0
      && Number.isInteger(diagnostics.rowSwapCount)
      && diagnostics.rowSwapCount >= 0
      && Object.values(diagnostics).every((value) =>
        typeof value !== "number" || Number.isFinite(value)),
  ));
  expectAtMost(`${scope} primary pivot aggregate replay`, Math.abs(
    Math.min(...audit.coldBlockLuDiagnosticsByLog.map((diagnostics) =>
      diagnostics.relativeMinimumPivot))
      - audit.minimumColdBlockRelativePivot,
  ), 0);
  expectAtMost(`${scope} independent pivot aggregate replay`, Math.abs(
    Math.min(...audit.independentColdBlockLuDiagnosticsByLog.map(
      (diagnostics) => diagnostics.relativeMinimumPivot,
    )) - audit.independentMinimumColdBlockRelativePivot,
  ), 0);
  expectTrue(`${scope} coarse/fine Schur`,
    audit.maximumIndependentScaledSchurAbsoluteDifference
      <= audit.maximumIndependentScaledSchurAbsoluteDifferenceGate
    && audit.independentAgreementPass);
  expectTrue(`${scope} Jacobi convergence`,
    audit.jacobiSvdAudit.converged
    && audit.independentJacobiSvdAudit.converged);
  expectTrue(`${scope} full rank aggregate`, audit.fullRankPass);
}

function expectedPressure(
  inverse: NumericalEvidence["results"][Mode]["inverse"],
  rho: number,
  chamber: typeof PRESSURE_ORDER[number],
): number {
  if (Object.is(rho, 0)) return inverse.sourceChamberPressurePa[chamber];
  if (Object.is(rho, 1)) return inverse.commonVascularTargetPressurePa;
  return Math.exp(
    (1 - rho) * Math.log(inverse.sourceChamberPressurePa[chamber])
    + rho * Math.log(inverse.commonVascularTargetPressurePa),
  );
}

function referenceConfigurationError(
  anchor: PhaseB1QuiescentPressureReferenceNodeV1["referenceConfiguration"],
  node: PhaseB1QuiescentPressureReferenceNodeV1,
): number {
  const [logLA, logRA, even, odd] = node.logReferenceMultipliers;
  const expected = [
    anchor.atrialReferenceCavityVolumeM3ByChamber.LA * Math.exp(logLA),
    anchor.atrialReferenceCavityVolumeM3ByChamber.RA * Math.exp(logRA),
    anchor.triSegReferenceMidwallAreaM2ByWall.LVFW
      * Math.exp(even + odd),
    anchor.triSegReferenceMidwallAreaM2ByWall.SEP,
    anchor.triSegReferenceMidwallAreaM2ByWall.RVFW
      * Math.exp(even - odd),
  ];
  const actual = [
    node.referenceConfiguration.atrialReferenceCavityVolumeM3ByChamber.LA,
    node.referenceConfiguration.atrialReferenceCavityVolumeM3ByChamber.RA,
    node.referenceConfiguration.triSegReferenceMidwallAreaM2ByWall.LVFW,
    node.referenceConfiguration.triSegReferenceMidwallAreaM2ByWall.SEP,
    node.referenceConfiguration.triSegReferenceMidwallAreaM2ByWall.RVFW,
  ];
  return maximumVectorDifference(actual, expected);
}

function rebuildPrimaryScaledSchur(
  node: PhaseB1QuiescentPressureReferenceNodeV1,
): readonly (readonly number[])[] {
  const n = node.coldUnknowns.length;
  const matrix = node.fullJacobian.scaledJacobian;
  if (
    matrix.length !== n + 4
    || matrix.some((row) => row.length !== n + 4)
  ) throw new Error("full augmented Jacobian dimension drifted");
  const coldBlock = Array.from({ length: n }, (_, row) =>
    matrix[row].slice(0, n));
  const eliminated = Array.from({ length: 4 }, (_, logColumn) =>
    solveDensePartialPivot(
      coldBlock,
      Array.from({ length: n }, (_, row) => matrix[row][n + logColumn]),
    ));
  return Object.freeze(Array.from({ length: 4 }, (_, pressureRow) =>
    Object.freeze(Array.from({ length: 4 }, (_, logColumn) => {
      let value = matrix[n + pressureRow][n + logColumn];
      for (let coldColumn = 0; coldColumn < n; coldColumn += 1) {
        value -= matrix[n + pressureRow][coldColumn]
          * eliminated[logColumn][coldColumn];
      }
      return value;
    }))));
}

function solveDensePartialPivot(
  inputMatrix: readonly (readonly number[])[],
  inputRhs: readonly number[],
): readonly number[] {
  const n = inputRhs.length;
  const matrix = inputMatrix.map((row) => [...row]);
  const rhs = [...inputRhs];
  for (let column = 0; column < n; column += 1) {
    let pivotRow = column;
    for (let row = column + 1; row < n; row += 1) {
      if (Math.abs(matrix[row][column])
        > Math.abs(matrix[pivotRow][column])) pivotRow = row;
    }
    const pivot = matrix[pivotRow][column];
    if (!Number.isFinite(pivot) || pivot === 0) {
      throw new Error(`independent cold-block LU singular at ${column}`);
    }
    if (pivotRow !== column) {
      [matrix[pivotRow], matrix[column]] = [matrix[column], matrix[pivotRow]];
      [rhs[pivotRow], rhs[column]] = [rhs[column], rhs[pivotRow]];
    }
    for (let row = column + 1; row < n; row += 1) {
      const factor = matrix[row][column] / matrix[column][column];
      matrix[row][column] = 0;
      for (let inner = column + 1; inner < n; inner += 1) {
        matrix[row][inner] -= factor * matrix[column][inner];
      }
      rhs[row] -= factor * rhs[column];
    }
  }
  const solution = Array<number>(n).fill(0);
  for (let row = n - 1; row >= 0; row -= 1) {
    let value = rhs[row];
    for (let column = row + 1; column < n; column += 1) {
      value -= matrix[row][column] * solution[column];
    }
    solution[row] = value / matrix[row][row];
    if (!Number.isFinite(solution[row])) {
      throw new Error(`independent cold-block LU nonfinite at ${row}`);
    }
  }
  return Object.freeze(solution);
}

function coldBlockRelativeMinimumPivot(
  node: PhaseB1QuiescentPressureReferenceNodeV1,
): number {
  const n = node.coldUnknowns.length;
  const matrix = Array.from({ length: n }, (_, row) =>
    node.fullJacobian.scaledJacobian[row].slice(0, n));
  const matrixInfinityNorm = Math.max(...matrix.map((row) =>
    row.reduce((sum, value) => sum + Math.abs(value), 0)));
  let minimumAbsolutePivot = Number.POSITIVE_INFINITY;
  for (let column = 0; column < n; column += 1) {
    let pivotRow = column;
    for (let row = column + 1; row < n; row += 1) {
      if (Math.abs(matrix[row][column])
        > Math.abs(matrix[pivotRow][column])) pivotRow = row;
    }
    if (pivotRow !== column) {
      [matrix[pivotRow], matrix[column]] = [matrix[column], matrix[pivotRow]];
    }
    const pivot = matrix[column][column];
    if (!Number.isFinite(pivot) || pivot === 0) {
      throw new Error(`independent cold pivot singular at ${column}`);
    }
    minimumAbsolutePivot = Math.min(minimumAbsolutePivot, Math.abs(pivot));
    for (let row = column + 1; row < n; row += 1) {
      const factor = matrix[row][column] / pivot;
      matrix[row][column] = factor;
      for (let inner = column + 1; inner < n; inner += 1) {
        matrix[row][inner] -= factor * matrix[column][inner];
      }
    }
  }
  return minimumAbsolutePivot / matrixInfinityNorm;
}

function singularValues4x4(
  matrix: readonly (readonly number[])[],
): readonly number[] {
  const gram = Array.from({ length: 4 }, (_, row) =>
    Array.from({ length: 4 }, (_, column) =>
      matrix.reduce((sum, matrixRow) =>
        sum + matrixRow[row] * matrixRow[column], 0)));
  for (let sweep = 0; sweep < 100; sweep += 1) {
    let p = 0;
    let q = 1;
    let largest = 0;
    let largestDiagonal = 0;
    for (let row = 0; row < 4; row += 1) {
      largestDiagonal = Math.max(largestDiagonal, Math.abs(gram[row][row]));
      for (let column = row + 1; column < 4; column += 1) {
        if (Math.abs(gram[row][column]) > largest) {
          largest = Math.abs(gram[row][column]);
          p = row;
          q = column;
        }
      }
    }
    if (largest <= Number.EPSILON * Math.max(largestDiagonal, 1e-300)) break;
    const app = gram[p][p];
    const aqq = gram[q][q];
    const apq = gram[p][q];
    const angle = 0.5 * Math.atan2(2 * apq, aqq - app);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    for (let index = 0; index < 4; index += 1) {
      if (index === p || index === q) continue;
      const rotatedP = cosine * gram[index][p] - sine * gram[index][q];
      const rotatedQ = sine * gram[index][p] + cosine * gram[index][q];
      gram[index][p] = rotatedP;
      gram[p][index] = rotatedP;
      gram[index][q] = rotatedQ;
      gram[q][index] = rotatedQ;
    }
    gram[p][p] = cosine * cosine * app - 2 * sine * cosine * apq
      + sine * sine * aqq;
    gram[q][q] = sine * sine * app + 2 * sine * cosine * apq
      + cosine * cosine * aqq;
    gram[p][q] = 0;
    gram[q][p] = 0;
  }
  let maximumOffDiagonal = 0;
  let maximumDiagonal = 0;
  for (let row = 0; row < 4; row += 1) {
    maximumDiagonal = Math.max(maximumDiagonal, Math.abs(gram[row][row]));
    for (let column = row + 1; column < 4; column += 1) {
      maximumOffDiagonal = Math.max(
        maximumOffDiagonal,
        Math.abs(gram[row][column]),
      );
    }
  }
  const convergenceTolerance = Number.EPSILON
    * Math.max(maximumDiagonal, 1e-300);
  if (maximumOffDiagonal > convergenceTolerance) {
    throw new Error(
      `independent 4x4 Jacobi SVD did not converge: ${maximumOffDiagonal}`,
    );
  }
  return Object.freeze(gram.map((row, index) =>
    Math.sqrt(Math.max(0, row[index]))).sort((left, right) => right - left));
}

function svdMetrics(singularValuesDescending: readonly number[]) {
  const sigmaMaximum = singularValuesDescending[0];
  const sigmaMinimum = singularValuesDescending[3];
  const tolerance = sigmaMaximum * 4 * 64 * Number.EPSILON;
  return Object.freeze({
    rank: singularValuesDescending.filter((value) => value > tolerance).length,
    relativeMinimumSingularValue: sigmaMinimum / sigmaMaximum,
    conditionNumber2: sigmaMaximum / sigmaMinimum,
  });
}

function maximumPairwiseScaledInfinityDistance(
  vectors: readonly (readonly number[])[],
  scales: readonly number[],
): number {
  let maximumDistance = 0;
  for (let left = 0; left < vectors.length; left += 1) {
    for (let right = left + 1; right < vectors.length; right += 1) {
      maximumDistance = Math.max(maximumDistance, scaledInfinityDistance(
        vectors[left],
        vectors[right],
        scales,
      ));
    }
  }
  return maximumDistance;
}

function scaledInfinityDistance(
  left: readonly number[],
  right: readonly number[],
  scales: readonly number[],
): number {
  if (left.length !== right.length || left.length !== scales.length) {
    throw new Error("scaled-distance dimension mismatch");
  }
  return Math.max(0, ...left.map((value, index) =>
    Math.abs(value - right[index]) / scales[index]));
}

function exactNumberArrayObjectIs(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => Object.is(value, right[index]));
}

function exactDenseArray(value: readonly unknown[], length: number): boolean {
  const expectedKeys = [
    ...Array.from({ length }, (_, index) => String(index)),
    "length",
  ];
  return value.length === length
    && Reflect.ownKeys(value).every((key, index) =>
      typeof key === "string" && key === expectedKeys[index])
    && Reflect.ownKeys(value).length === expectedKeys.length;
}

function maximumChamberTargetPressureDifference(
  actual: Readonly<Record<typeof PRESSURE_ORDER[number], number>>,
  target: Readonly<Record<typeof PRESSURE_ORDER[number], number>>,
): number {
  return Math.max(...PRESSURE_ORDER.map((chamber) =>
    Math.abs(actual[chamber] - target[chamber])));
}

function maximumInertialAcceleration(
  momentum: Readonly<Record<
    typeof INERTIAL_FLOW_IDS[number],
    Readonly<{ flowAccelerationM3PerSec2: number }>
  >>,
): number {
  return Math.max(...INERTIAL_FLOW_IDS.map((flowId) =>
    Math.abs(momentum[flowId].flowAccelerationM3PerSec2)));
}

function requireNumber(value: number | null): number {
  if (value === null || !Number.isFinite(value)) {
    throw new Error("expected one finite numerical metric");
  }
  return value;
}

function verifyReadiness(
  readiness: Readiness,
  manifest: PhaseB1QuiescentReferenceEvidenceManifestV1,
  numerical: NumericalEvidence,
): void {
  const narrowKeys = [
    "projectSyntheticQuiescentPressureReferenceInversePass",
    "instantaneousHydraulicQuiescencePass",
    "projectSyntheticQuiescentReferenceEventFreeCasePass",
    "projectSyntheticToleranceCertifiedIdentityHoldPass",
  ] as const;
  const broadKeys = [
    "biologicalPressurePathPass",
    "acceptedPhaseB1ReferenceBranchPass",
    "physiologicalReferenceAcceptancePass",
    "supportedReferenceEnvelopePass",
    "continuousReferenceCoordinateRegularityPass",
    "continuousPressurePathRegularityPass",
    "closedLoopAnalyticalStationarityPass",
    "globalRootUniquenessPass",
    "globalRootExhaustivenessPass",
    "energeticStabilityPass",
    "fullBeatAcceptancePass",
    "eventIntegratedAcceptancePass",
    "physiologicalValidationPass",
    "phaseB1AcceptancePass",
    "pureCoreParentEvidenceAuthenticationClaimed",
    "releaseRuntimePass",
    "modelCoreIntegration",
    "browserRuntimeAdopted",
    "releaseRuntimeReachable",
  ] as const;
  expectEqual("readiness manifest top-level binding",
    readiness.manifestSha256, manifest.contentSha256);
  expectEqual("readiness numerical top-level binding",
    readiness.numericalEvidenceSha256,
    numerical.certificate.contentSha256);
  expectEqual("readiness manifest nested binding",
    readiness.bindings.quiescentReferenceEvidenceManifestSha256,
    manifest.contentSha256);
  expectEqual("readiness numerical nested binding",
    readiness.bindings.numericalEvidenceSha256,
    numerical.certificate.contentSha256);
  expectTrue("readiness manifest lineage identity",
    Object.is(readiness.lineage, manifest.lineage));
  expectTrue("readiness direct-parent authentication identity",
    Object.is(
      readiness.directParentAuthentication,
      numerical.certificate.directParentAuthentication,
    ));
  expectTrue("readiness deferred identity",
    Object.is(readiness.deferred, manifest.deferred));
  expectTrue("readiness evidence bindings",
    readiness.allEvidenceBindingsPass
    && readiness.evidenceLayerDirectParentAuthenticationPass);
  expectTrue("readiness narrow claims",
    narrowKeys.every((key) => readiness[key] === true));
  expectTrue("readiness broad claims",
    broadKeys.every((key) => readiness[key] === false));
  expectTrue("readiness implementation boundary",
    readiness.implementation.exactPairedPhysicalSlsModeInventory
    && readiness.implementation.manifestAndNumericalEvidenceCanonicalLive
    && readiness.implementation.directParentGraphArtifactsAuthenticated
    && readiness.implementation.effectiveJacobianStepAndStencilGateBound
    && readiness.implementation.reducedRestoringManifoldCorrectorBound
    && readiness.implementation
      .destinationRegistryCompiledOnceFromAcceptedDestination
    && readiness.implementation.completeIndependentDtGridIdentityHoldBound
    && !readiness.implementation
      .pureCoreParentEvidenceAuthenticationClaimed);
  expectTrue("readiness blockers", readiness.blockers.length > 0
    && readiness.blockers.every((blocker) => blocker.length > 0));
  expectTrue("readiness test-only", readiness.testOnly);
  expectRecursivelyFrozen(readiness, "readiness");
}

function verifyMutationBoundary(
  manifest: PhaseB1QuiescentReferenceEvidenceManifestV1,
  numerical: NumericalEvidence,
  readiness: Readiness,
): void {
  expectThrows("unbranded manifest copy rejected", () =>
    assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(
      deepFreeze(structuredClone(manifest)),
    ));
  expectThrows("unbranded numerical copy rejected", () =>
    assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1(
      Object.freeze({ ...numerical }),
      manifest,
    ));
  expectThrows("unbranded readiness copy rejected", () =>
    assertCanonicalFourChamberPhaseB1QuiescentReferenceStatusV1(
      Object.freeze({ ...readiness }),
    ));
  expectThrows("readiness broad-claim forgery rejected", () =>
    assertDeepFrozenAndClosedFourChamberPhaseB1QuiescentReferenceStatusV1(
      deepFreeze({
        ...readiness,
        closedLoopAnalyticalStationarityPass: true,
      }),
    ));
  expectThrows("readiness nested-hash forgery rejected", () =>
    assertDeepFrozenAndClosedFourChamberPhaseB1QuiescentReferenceStatusV1(
      deepFreeze({
        ...readiness,
        directParentAuthentication: {
          ...readiness.directParentAuthentication,
          finiteVolumeGraph: {
            ...readiness.directParentAuthentication.finiteVolumeGraph,
            numericalEvidenceSha256: "0".repeat(64),
          },
        },
      }),
    ));
  const cyclicReadiness = { ...readiness } as Record<string, unknown>;
  cyclicReadiness.lineage = cyclicReadiness;
  deepFreeze(cyclicReadiness);
  expectThrows("readiness cycle rejected", () =>
    assertDeepFrozenAndClosedFourChamberPhaseB1QuiescentReferenceStatusV1(
      cyclicReadiness,
    ));
  const symbolicReadiness = { ...readiness } as Record<PropertyKey, unknown>;
  Object.defineProperty(symbolicReadiness, Symbol("forbidden"), {
    enumerable: true,
    value: true,
  });
  deepFreeze(symbolicReadiness);
  expectThrows("readiness symbol rejected", () =>
    assertDeepFrozenAndClosedFourChamberPhaseB1QuiescentReferenceStatusV1(
      symbolicReadiness,
    ));
}

function maximumMatrixDifference(
  left: readonly (readonly number[])[],
  right: readonly (readonly number[])[],
): number {
  if (left.length !== right.length
    || left.some((row, index) => row.length !== right[index]?.length)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(0, ...left.flatMap((row, rowIndex) => row.map(
    (value, columnIndex) => Math.abs(value - right[rowIndex][columnIndex]),
  )));
}

function maximumVectorDifference(
  left: readonly number[],
  right: readonly number[],
): number {
  if (left.length !== right.length) return Number.POSITIVE_INFINITY;
  return Math.max(0, ...left.map((value, index) =>
    Math.abs(value - right[index])));
}

function expectTrue(label: string, condition: boolean): void {
  if (!condition) failures.push(label);
}

function expectEqual(label: string, actual: unknown, expected: unknown): void {
  if (!Object.is(actual, expected)) {
    failures.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function expectAtMost(label: string, actual: number, maximum: number): void {
  if (!Number.isFinite(actual) || actual > maximum) {
    failures.push(`${label}: expected <= ${maximum}, got ${actual}`);
  }
}

function expectThrows(label: string, callback: () => void): void {
  try {
    callback();
    failures.push(`${label}: did not throw`);
  } catch {
    // Expected.
  }
}

function expectRecursivelyFrozen(value: unknown, label: string): void {
  const visited = new WeakSet<object>();
  const visit = (candidate: unknown, path: string): void => {
    if (candidate === null
      || (typeof candidate !== "object" && typeof candidate !== "function")) {
      return;
    }
    const objectCandidate = candidate as object;
    if (visited.has(objectCandidate)) return;
    visited.add(objectCandidate);
    if (!Object.isFrozen(objectCandidate)) failures.push(`${path} not frozen`);
    for (const key of Reflect.ownKeys(objectCandidate)) {
      const descriptor = Reflect.getOwnPropertyDescriptor(objectCandidate, key);
      if (descriptor !== undefined && "value" in descriptor) {
        visit(descriptor.value, `${path}.${String(key)}`);
      }
    }
  };
  visit(value, label);
}

function deepFreeze<T>(value: T, visited = new WeakSet<object>()): T {
  if (value === null
    || (typeof value !== "object" && typeof value !== "function")) return value;
  const objectValue = value as object;
  if (visited.has(objectValue)) return value;
  visited.add(objectValue);
  for (const key of Reflect.ownKeys(objectValue)) {
    const descriptor = Reflect.getOwnPropertyDescriptor(objectValue, key);
    if (descriptor !== undefined && "value" in descriptor) {
      deepFreeze(descriptor.value, visited);
    }
  }
  return Object.freeze(value);
}

function sha256(canonicalJsonUtf8: string): string {
  return createHash("sha256").update(canonicalJsonUtf8).digest("hex");
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
