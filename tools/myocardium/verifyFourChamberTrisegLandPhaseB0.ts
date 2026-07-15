import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { canonicalizeJson } from
  "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  auditPhaseB0MonolithicResidualJacobianSuiteV1,
  createPhaseB0HydromechanicsInitialStateV1,
  evaluatePhaseB0HydromechanicsStateV1,
  stepPhaseB0MonolithicHydromechanicsBackwardEulerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/monolithicHydromechanicsBackwardEulerV1";
import {
  evaluatePhaseB0BackwardEulerTimeStepConvergenceV1,
  runPhaseB0ShortHorizonProtocolV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/conservativeHydromechanicsProtocolV1";
import {
  FOUR_CHAMBER_PHASE_B0_STATUS_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/phaseB0ReadinessV1";
import {
  auditPhaseB0PublishedTriSegContinuationV1,
  auditPhaseB0PublishedTriSegMultiStartV1,
  type PhaseB0PublishedTriSegRootInputV1,
  type PhaseB0PublishedTriSegRootResultV1,
  type PhaseB0PublishedTriSegRootSuccessV1,
  type PhaseB0TriSegContinuationPointV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/publishedTriSegRootV1";
import {
  buildPhaseB0SyntheticHydromechanicsCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/syntheticHydromechanicsCaseV1";
import { buildPhaseB0TestReferenceManifestV1 } from
  "@/engine/myocardium/fourChamberV1/phaseB0/testReferenceManifestV1";
import { auditPhaseB0TriSegStaticRestoringRootV1 } from
  "@/engine/myocardium/fourChamberV1/phaseB0/triSegStaticRestoringAuditV1";
import { buildPhaseB0TriSegStaticRestoringGateManifestV1 } from
  "@/engine/myocardium/fourChamberV1/phaseB0/triSegStaticRestoringGateManifestV1";
import {
  auditPhaseB0TriSegNaturalParameterContinuationV1,
  buildPhaseB0TriSegLinearLoadPathV1,
  scaledPhaseB0TriSegCoordinateDistanceV1,
  type PhaseB0TriSegNaturalParameterContinuationAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegNaturalParameterContinuationV1";
import type { PublishedTriSegGeometryV1 } from
  "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";

const EXPECTED_CASE_SHA256 =
  "f8bbfbb7ad6bd76bd160ceb86fb903a35e1d0398397f99189f2ae32ff48ae75c";
const EXPECTED_TEST_REFERENCE_MANIFEST_SHA256 =
  "dcdded542d7747c76e6cd487184ba390a80e4ea238b03a9f5373e0c76cc13356";
const EXPECTED_TRISEG_STATIC_RESTORING_GATE_MANIFEST_SHA256 =
  "a253d1d98127633d68e9062102de9f1593fadccf770b581b74d7f7a81657bfa0";
const EXPECTED_READINESS_SHA256 =
  "58413aa1a08bc954614a25d0b02491c3297722e822a5044c04b653c3971966c8";
const EXPECTED_VALVE_NUMERICAL_POLICY_SHA256 =
  "e3d0aeafb2e0ca5fda07c6a44d98f7740debb63cd22a66510a932f93dd9b1360";

const fixture = buildPhaseB0SyntheticHydromechanicsCaseV1(sha256);
const testReferenceManifest = buildPhaseB0TestReferenceManifestV1(fixture, sha256);
const staticRestoringGateManifest =
  buildPhaseB0TriSegStaticRestoringGateManifestV1(fixture, sha256);
const initialState = createPhaseB0HydromechanicsInitialStateV1(fixture, "on");
const initialEvaluation = evaluatePhaseB0HydromechanicsStateV1(fixture, initialState);
const triSegRootEvidence = testReferenceManifest.triSegRootAudit.slsModes.map((slsMode) => {
  const state = createPhaseB0HydromechanicsInitialStateV1(fixture, slsMode);
  const rootInput = {
    leftVentricularCavityVolumeM3: state.bloodVolumesM3.LV,
    rightVentricularCavityVolumeM3: state.bloodVolumesM3.RV,
    walls: fixture.triSegReference.walls,
    evaluateWallStress: (geometry: PublishedTriSegGeometryV1) => {
      const evaluation = evaluatePhaseB0HydromechanicsStateV1(fixture, {
        ...state,
        bloodVolumesM3: {
          ...state.bloodVolumesM3,
          LV: geometry.leftVentricularCavityVolumeM3,
          RV: geometry.rightVentricularCavityVolumeM3,
        },
        triSegCoordinates: {
          V_m_S: geometry.septalMidwallCapVolumeM3,
          y_m: geometry.junctionRadiusM,
        },
      });
      return {
        fiberKirchhoffStressPa: {
          LVFW: evaluation.wallMechanics.LVFW.totalKirchhoffStressPa,
          SEP: evaluation.wallMechanics.SEP.totalKirchhoffStressPa,
          RVFW: evaluation.wallMechanics.RVFW.totalKirchhoffStressPa,
        },
      };
    },
    unknownScales: {
      septalMidwallCapVolumeM3:
        fixture.newtonScaleRegistry.unknownScales.septalMidwallVolumeM3,
      junctionRadiusM: fixture.newtonScaleRegistry.unknownScales.junctionRadiusM,
    },
    equilibriumResidualScaleNPerM:
      fixture.newtonScaleRegistry.residualScales.publishedTriSegEquilibriumNPerM,
    junctionRadiusLowerBoundM: fixture.numericalPolicy.strictJunctionRadiusLowerBoundM,
    algorithmicJacobianScaledStep: fixture.numericalPolicy.algorithmicJacobianScaledStep,
  } as const;
  const multiStart = auditPhaseB0PublishedTriSegMultiStartV1(
    rootInput,
    staticRestoringGateManifest.discoveredRootRegression.multiStartSeeds,
    staticRestoringGateManifest.discoveredRootRegression.scaledRootClusteringTolerance,
  );
  const continuation = auditPhaseB0PublishedTriSegContinuationV1(
    {
      walls: rootInput.walls,
      evaluateWallStress: rootInput.evaluateWallStress,
      unknownScales: rootInput.unknownScales,
      equilibriumResidualScaleNPerM: rootInput.equilibriumResidualScaleNPerM,
      junctionRadiusLowerBoundM: rootInput.junctionRadiusLowerBoundM,
      algorithmicJacobianScaledStep: rootInput.algorithmicJacobianScaledStep,
    },
    testReferenceManifest.triSegRootAudit.continuationVolumeMultipliers.map(
      (multipliers) => ({
        leftVentricularCavityVolumeM3: state.bloodVolumesM3.LV * multipliers.LV,
        rightVentricularCavityVolumeM3: state.bloodVolumesM3.RV * multipliers.RV,
      }),
    ),
    testReferenceManifest.triSegRootAudit.continuationAnchorCoordinates,
    testReferenceManifest.triSegRootAudit.continuationScaledStepThreshold,
  );
  return Object.freeze({ slsMode, rootInput, multiStart, continuation });
});
const triSegStaticRestoringEvidence = triSegRootEvidence.map(
  ({ slsMode, rootInput, multiStart }) => Object.freeze({
    slsMode,
    audits: Object.freeze(multiStart.results.map((root) => {
      if (root.converged === false) throw new Error(root.message);
      return Object.freeze({
        root,
        audit: auditPhaseB0TriSegStaticRestoringRootV1({
          rootInput,
          root,
          generalizedForceResidualScales: {
            septalMidwallVolumePa:
              fixture.newtonScaleRegistry.residualScales.virtualWorkSeptalVolumePa,
            junctionRadiusN:
              fixture.newtonScaleRegistry.residualScales.virtualWorkJunctionRadiusN,
          },
          policy: staticRestoringGateManifest
            .workConjugateStaticRestoringClassifier.policy,
        }),
      });
    })),
  }),
);
const naturalParameterContinuationPolicy = Object.freeze({
  parameterDerivativeScaledStep:
    staticRestoringGateManifest.localPredictorCorrectorRegression
      .parameterDerivativeScaledStep,
  minimumScaledLoadArclength:
    staticRestoringGateManifest.localPredictorCorrectorRegression
      .minimumScaledLoadArclength,
  maximumTangentPredictionHalvingDifferenceScaledInfinityNorm:
    staticRestoringGateManifest.localPredictorCorrectorRegression
      .maximumTangentPredictionHalvingDifferenceScaledInfinityNorm,
  maximumAnchorCorrectionScaledInfinityNorm:
    staticRestoringGateManifest.localPredictorCorrectorRegression
      .maximumAnchorCorrectionScaledInfinityNorm,
  maximumPredictorCorrectionScaledInfinityNorm:
    staticRestoringGateManifest.localPredictorCorrectorRegression
      .maximumPredictorCorrectionScaledInfinityNorm,
  maximumPredictorCorrectionToAcceptedCoordinateStepRatio:
    staticRestoringGateManifest.localPredictorCorrectorRegression
      .maximumPredictorCorrectionToAcceptedCoordinateStepRatio,
  maximumAcceptedScaledCoordinateStep:
    staticRestoringGateManifest.localPredictorCorrectorRegression
      .maximumAcceptedScaledCoordinateStep,
  minimumTangentDot:
    staticRestoringGateManifest.localPredictorCorrectorRegression.minimumTangentDot,
  relativePivotTolerance:
    staticRestoringGateManifest.localPredictorCorrectorRegression.relativePivotTolerance,
});
const triSegNaturalParameterEvidence = triSegRootEvidence.map(
  ({ slsMode, rootInput }) => {
    const pathRootInput = {
      walls: rootInput.walls,
      evaluateWallStress: rootInput.evaluateWallStress,
      unknownScales: rootInput.unknownScales,
      equilibriumResidualScaleNPerM: rootInput.equilibriumResidualScaleNPerM,
      junctionRadiusLowerBoundM: rootInput.junctionRadiusLowerBoundM,
      algorithmicJacobianScaledStep: rootInput.algorithmicJacobianScaledStep,
    } as const;
    const paths = staticRestoringGateManifest.localPredictorCorrectorRegression
      .paths.map((declaredPath) => {
        const absoluteDeclaredPath = declaredPath.nodes.map((multipliers) =>
          Object.freeze({
            leftVentricularCavityVolumeM3:
              rootInput.leftVentricularCavityVolumeM3 * multipliers.LV,
            rightVentricularCavityVolumeM3:
              rootInput.rightVentricularCavityVolumeM3 * multipliers.RV,
          }));
        const endpoint = absoluteDeclaredPath[absoluteDeclaredPath.length - 1];
        const subdivisions = staticRestoringGateManifest
          .localPredictorCorrectorRegression.deterministicSubdivisionFactors.map(
            (segmentCount) => Object.freeze({
              segmentCount,
              run: auditPhaseB0TriSegNaturalParameterContinuationV1({
                rootInput: pathRootInput,
                path: buildPhaseB0TriSegLinearLoadPathV1(
                  absoluteDeclaredPath[0],
                  endpoint,
                  segmentCount,
                ),
                anchorCoordinates:
                  staticRestoringGateManifest.frozenState.anchorCoordinates,
                policy: naturalParameterContinuationPolicy,
              }),
            }),
          );
        const factorTwo = subdivisions.find(({ segmentCount }) => segmentCount === 2);
        const declaredNodesMatchFactorTwo = factorTwo !== undefined
          && pathsEqual(factorTwo.run.path, absoluteDeclaredPath);
        const finest = subdivisions[subdivisions.length - 1].run;
        const finestEndpointRoot = finalConvergedRoot(finest);
        const endpointAgreementBySubdivision = subdivisions.map(
          ({ segmentCount, run }) => {
            const endpointRoot = finalConvergedRoot(run);
            return Object.freeze({
              segmentCount,
              scaledInfinityDistanceToEightSegmentEndpoint: endpointRoot !== null
                && finestEndpointRoot !== null
                ? scaledPhaseB0TriSegCoordinateDistanceV1(
                  endpointRoot.coordinates,
                  finestEndpointRoot.coordinates,
                  rootInput.unknownScales,
                )
                : null,
            });
          },
        );
        const finiteEndpointDistances = endpointAgreementBySubdivision
          .map(
            ({ scaledInfinityDistanceToEightSegmentEndpoint }) =>
              scaledInfinityDistanceToEightSegmentEndpoint,
          )
          .filter((distance): distance is number => distance !== null);
        const maximumEndpointAgreementDistance =
          finiteEndpointDistances.length === subdivisions.length
            ? Math.max(...finiteEndpointDistances)
            : null;
        const reverse = finestEndpointRoot === null
          ? null
          : auditPhaseB0TriSegNaturalParameterContinuationV1({
            rootInput: pathRootInput,
            path: Object.freeze([...finest.path].reverse()),
            anchorCoordinates: finestEndpointRoot.coordinates,
            policy: naturalParameterContinuationPolicy,
          });
        const reverseEndpointRoot = reverse === null ? null : finalConvergedRoot(reverse);
        const forwardAnchorRoot = firstConvergedRoot(finest);
        const reverseClosureScaledInfinityNorm =
          reverseEndpointRoot !== null && forwardAnchorRoot !== null
            ? scaledPhaseB0TriSegCoordinateDistanceV1(
              reverseEndpointRoot.coordinates,
              forwardAnchorRoot.coordinates,
              rootInput.unknownScales,
            )
            : null;
        const forwardNodeAudits = auditNaturalParameterPathNodes(
          rootInput,
          finest.path,
          finest.roots,
        );
        const reverseNodeAudits = reverse === null
          ? Object.freeze([])
          : auditNaturalParameterPathNodes(rootInput, reverse.path, reverse.roots);
        const anchorLoadBound =
          absoluteDeclaredPath[0].leftVentricularCavityVolumeM3
            === rootInput.leftVentricularCavityVolumeM3
          && absoluteDeclaredPath[0].rightVentricularCavityVolumeM3
            === rootInput.rightVentricularCavityVolumeM3;
        const accepted = anchorLoadBound
          && declaredNodesMatchFactorTwo
          && subdivisions.every(({ run }) =>
            run.numericalPathAccepted
            && run.allConverged
            && run.branchIdentityEstablished
            && run.failure === null
            && run.thresholdViolations.length === 0
            && !run.pseudoArclengthApplied
            && !run.supportedEnvelopeClaimed)
          && maximumEndpointAgreementDistance !== null
          && maximumEndpointAgreementDistance <= staticRestoringGateManifest
            .localPredictorCorrectorRegression
            .independentInitializationEndpointAgreementTolerance
          && reverse !== null
          && reverse.numericalPathAccepted
          && reverse.allConverged
          && reverse.branchIdentityEstablished
          && reverse.failure === null
          && reverse.thresholdViolations.length === 0
          && reverseClosureScaledInfinityNorm !== null
          && reverseClosureScaledInfinityNorm <= staticRestoringGateManifest
            .localPredictorCorrectorRegression.reverseTraversalClosureTolerance
          && forwardNodeAudits.every(({ accepted: nodeAccepted }) => nodeAccepted)
          && reverseNodeAudits.every(({ accepted: nodeAccepted }) => nodeAccepted);
        return Object.freeze({
          pathId: declaredPath.pathId,
          anchorLoadBound,
          declaredNodesMatchFactorTwo,
          subdivisions: Object.freeze(subdivisions),
          endpointAgreementBySubdivision: Object.freeze(
            endpointAgreementBySubdivision,
          ),
          maximumEndpointAgreementDistance,
          finest,
          reverse,
          reverseClosureScaledInfinityNorm,
          forwardNodeAudits,
          reverseNodeAudits,
          accepted,
        });
      });
    return Object.freeze({
      slsMode,
      paths: Object.freeze(paths),
      accepted: paths.every((path) => path.accepted),
      supportedEnvelopeClaimed: false,
      continuousIntervalRegularityClaimed: false,
      globalUniquenessClaimed: false,
      physiologicalValidationClaimed: false,
    });
  },
);
const shortHorizonOn = runPhaseB0ShortHorizonProtocolV1(
  fixture,
  testReferenceManifest.shortHorizonProtocol.slsModes[0],
  testReferenceManifest.shortHorizonProtocol.requestedDtSec,
  testReferenceManifest.shortHorizonProtocol.durationSec,
);
const shortHorizonOff = runPhaseB0ShortHorizonProtocolV1(
  fixture,
  testReferenceManifest.shortHorizonProtocol.slsModes[1],
  testReferenceManifest.shortHorizonProtocol.requestedDtSec,
  testReferenceManifest.shortHorizonProtocol.durationSec,
);
const firstStepOn = stepPhaseB0MonolithicHydromechanicsBackwardEulerV1(
  fixture,
  createPhaseB0HydromechanicsInitialStateV1(
    fixture,
    testReferenceManifest.jacobianAudit.topologies[0],
  ),
  testReferenceManifest.jacobianAudit.evaluationDtSec,
);
const firstStepOff = stepPhaseB0MonolithicHydromechanicsBackwardEulerV1(
  fixture,
  createPhaseB0HydromechanicsInitialStateV1(
    fixture,
    testReferenceManifest.jacobianAudit.topologies[1],
  ),
  testReferenceManifest.jacobianAudit.evaluationDtSec,
);
const firstStepByTopology = Object.freeze({ on: firstStepOn, off: firstStepOff });
const jacobianCandidateMatrix = fixture.numericalPolicy
  .algorithmicJacobianScaledStepCandidates.map((constructionScaledStep) => {
    const independentScaledStep = constructionScaledStep
      * fixture.numericalPolicy.independentDirectionalAuditStepRatioToConstruction;
    const topologyResults = testReferenceManifest.jacobianAudit.topologies.map((slsMode) => {
      const step = firstStepByTopology[slsMode];
      if (step.converged === false) {
        return Object.freeze({ slsMode, completed: false as const, reason: step.reason });
      }
      const suite = auditPhaseB0MonolithicResidualJacobianSuiteV1(
        fixture,
        step.previousState,
        step.nextState,
        step.nextState.timeSec - step.previousState.timeSec,
        constructionScaledStep,
        independentScaledStep,
      );
      return Object.freeze({ slsMode, completed: true as const, suite });
    });
    return Object.freeze({
      constructionScaledStep,
      independentScaledStep,
      topologyResults: Object.freeze(topologyResults),
      accepted: topologyResults.every((result) => result.completed && result.suite.accepted),
    });
  });
const passingJacobianCandidateSteps = jacobianCandidateMatrix
  .filter((candidate) => candidate.accepted)
  .map((candidate) => candidate.constructionScaledStep);
const largestPassingJacobianCandidate = passingJacobianCandidateSteps.length > 0
  ? Math.max(...passingJacobianCandidateSteps)
  : null;
const timeStepConvergenceOn = evaluatePhaseB0BackwardEulerTimeStepConvergenceV1(
  fixture,
  testReferenceManifest.backwardEulerConvergenceProtocol.slsModes[0],
  testReferenceManifest.backwardEulerConvergenceProtocol.coarseDtSec,
  testReferenceManifest.backwardEulerConvergenceProtocol.durationSec,
);
const timeStepConvergenceOff = evaluatePhaseB0BackwardEulerTimeStepConvergenceV1(
  fixture,
  testReferenceManifest.backwardEulerConvergenceProtocol.slsModes[1],
  testReferenceManifest.backwardEulerConvergenceProtocol.coarseDtSec,
  testReferenceManifest.backwardEulerConvergenceProtocol.durationSec,
);
const readinessSha256 = sha256(canonicalizeJson(FOUR_CHAMBER_PHASE_B0_STATUS_V1));
const runtimeBoundarySourceScan = auditRuntimeBoundarySourceScan();
const failures: string[] = [];

if (fixture.contentSha256 !== EXPECTED_CASE_SHA256) {
  failures.push("Phase B0 content-hashed synthetic case drifted without a version update");
}
if (testReferenceManifest.contentSha256 !== EXPECTED_TEST_REFERENCE_MANIFEST_SHA256) {
  failures.push("Phase B0 exploratory test-reference manifest drifted without a version update");
}
if (
  staticRestoringGateManifest.contentSha256
    !== EXPECTED_TRISEG_STATIC_RESTORING_GATE_MANIFEST_SHA256
) {
  failures.push("Phase B0 TriSeg static-restoring gate manifest drifted without a version update");
}
if (readinessSha256 !== EXPECTED_READINESS_SHA256) {
  failures.push("Phase B0 readiness claim boundary drifted without a version update");
}
if (fixture.valveNumericalPolicy.contentSha256 !== EXPECTED_VALVE_NUMERICAL_POLICY_SHA256) {
  failures.push("Phase B0 valve numerical policy candidate drifted without a version update");
}
if (runtimeBoundarySourceScan.leakPaths.length > 0) {
  failures.push("Phase B0 test-only code became reachable from a release source tree");
}
if (
  initialEvaluation.triSegOracle.equilibriumResidual.euclideanNPerM >= 2e-12
  || Object.values(initialEvaluation.chamberTransmuralPressurePa)
    .some((pressure) => Math.abs(pressure - 1_000) > 1e-9)
) {
  failures.push("Phase B0 symmetric initial equilibrium no longer closes at 1000 Pa");
}
if (triSegRootEvidence.some(({ continuation }) =>
  !continuation.accepted || !continuation.sampledStepDistanceWithinThreshold)) {
  failures.push("Phase B0 anchored local TriSeg continuation audit failed");
}
if (
  shortHorizonOn.completed === false
  || shortHorizonOff.completed === false
  || !shortHorizonOn.shortHorizonNumericalAcceptance
  || !shortHorizonOff.shortHorizonNumericalAcceptance
) {
  failures.push("Phase B0 SLS-on/off short-horizon conservative integration failed");
}
if ([timeStepConvergenceOn, timeStepConvergenceOff].some((convergence) =>
  !convergence.allCompleted
  || !convergence.nominalGridPreservedWithoutSubdivision
  || !convergence.orderAccepted)) {
  failures.push("Phase B0 backward-Euler time-step convergence evidence failed");
}
if (
  largestPassingJacobianCandidate !== fixture.numericalPolicy.algorithmicJacobianScaledStep
  || !jacobianCandidateMatrix.some((candidate) =>
    candidate.constructionScaledStep === fixture.numericalPolicy.algorithmicJacobianScaledStep
    && candidate.accepted)
) {
  failures.push("Phase B0 algorithmic-Jacobian candidate selection matrix failed");
}
if (triSegRootEvidence.some(({ multiStart }) => {
  const roots = multiStart.results.filter((result) => result.converged);
  return !multiStart.allConverged
    || multiStart.sameBranchWithinTolerance
    || multiStart.maximumPairwiseScaledCoordinateDistance === null
    || multiStart.maximumPairwiseScaledCoordinateDistance <= 0.05
    || !roots.some((root) => root.converged
      && root.scaledJacobianDiagnostics.determinant > 0)
    || !roots.some((root) => root.converged
      && root.scaledJacobianDiagnostics.determinant < 0)
    || roots.some((root) => root.converged
      && root.scaledJacobianDiagnostics.numericallySingular);
})) {
  failures.push("Phase B0 broad multi-start no longer reproduces the explicit root-uniqueness blocker");
}
if (triSegStaticRestoringEvidence.some(({ audits }) => {
  const classes = new Set(audits.map(
    ({ audit }) => audit.scaledRestoringTangent.classification,
  ));
  const expected = new Set(
    staticRestoringGateManifest.discoveredRootRegression
      .expectedDiscoveredClassesInEachSlsMode,
  );
  return classes.size !== expected.size
    || [...expected].some((classification) => !classes.has(classification))
    || audits.some(({ audit }) =>
      !audit.generalizedForceTransformAudit.accepted
      || !audit.rootRegularity.accepted
      || audit.energeticStability.eligible
      || audit.physiologicalRootClaimed
      || audit.globalUniquenessClaimed)
    || audits.some(({ audit }) =>
      audit.scaledRestoringTangent.classification === "robust-restoring"
        ? !audit.acceptedUnderLocalStaticRestoringTestReference
        : audit.acceptedUnderLocalStaticRestoringTestReference);
})) {
  failures.push("Phase B0 TriSeg static-restoring classifier regression failed");
}
if (triSegNaturalParameterEvidence.some(({ accepted }) => !accepted)) {
  failures.push(
    "Phase B0 TriSeg local natural-parameter predictor-corrector regression failed",
  );
}
if (
  staticRestoringGateManifest.status
    !== "local-classifier-regression-not-supported-envelope-acceptance"
  || Object.values(staticRestoringGateManifest.negativeClaims).some(Boolean)
  || Object.values(staticRestoringGateManifest.releaseClaims).some(Boolean)
  || staticRestoringGateManifest.localPredictorCorrectorRegression
    .supportedEnvelopeFrozen
  || staticRestoringGateManifest.localPredictorCorrectorRegression
    .pseudoArclengthPolicy.acceptedBranchFoldCrossingAllowed
) {
  failures.push("Phase B0 TriSeg static-restoring manifest crossed its negative claim boundary");
}
if (
  testReferenceManifest.status !== "exploratory-test-reference-not-phase-b-acceptance"
  || testReferenceManifest.triSegRootAudit.expectedAdversarialRegression
    !== "multiple-nonsingular-roots-with-opposite-signed-jacobian-orientation"
  || testReferenceManifest.releaseClaims.physiologicalValidation
  || testReferenceManifest.releaseClaims.phaseB0Acceptance
  || testReferenceManifest.releaseClaims.phaseB1Eligible
  || testReferenceManifest.releaseClaims.releaseRuntimeReachable
) {
  failures.push("Phase B0 test-reference manifest crossed its negative claim boundary");
}
if (
  testReferenceManifest.triSegRootAudit.continuationAnchorSource
    !== "content-hashed-synthetic-case-initial-triseg-coordinates"
  || testReferenceManifest.triSegRootAudit.continuationAnchorCoordinates
    .septalMidwallCapVolumeM3 !== fixture.initialState.triSegCoordinates.V_m_S
  || testReferenceManifest.triSegRootAudit.continuationAnchorCoordinates.junctionRadiusM
    !== fixture.initialState.triSegCoordinates.y_m
) {
  failures.push("Phase B0 TriSeg continuation anchor is not bound to the hashed case");
}
if (
  !FOUR_CHAMBER_PHASE_B0_STATUS_V1.phaseB0ImplementationComplete
  || FOUR_CHAMBER_PHASE_B0_STATUS_V1.phaseB0AcceptanceComplete
  || FOUR_CHAMBER_PHASE_B0_STATUS_V1.phaseB1Eligible
  || FOUR_CHAMBER_PHASE_B0_STATUS_V1.closedLoopReleaseEligible
  || FOUR_CHAMBER_PHASE_B0_STATUS_V1.clinicalReleaseReady
) {
  failures.push("Phase B0 implementation/acceptance/release claim boundary is inconsistent");
}

const report = {
  implementationPass: failures.length === 0,
  phaseB0AcceptancePass: false,
  completionStatus: FOUR_CHAMBER_PHASE_B0_STATUS_V1.completionStatus,
  caseSha256: fixture.contentSha256,
  testReferenceManifestSha256: testReferenceManifest.contentSha256,
  triSegStaticRestoringGateManifestSha256: staticRestoringGateManifest.contentSha256,
  readinessSha256,
  valveNumericalCandidate: {
    ratio: fixture.valveNumericalPolicy.candidateRatioUnderEvaluation,
    contentSha256: fixture.valveNumericalPolicy.contentSha256,
    floorSelectionCompleted: fixture.valveFloorSelectionCompleted,
  },
  initialEquilibrium: {
    triSegResidualNPerM: initialEvaluation.triSegOracle.equilibriumResidual.euclideanNPerM,
    chamberTransmuralPressurePa: initialEvaluation.chamberTransmuralPressurePa,
  },
  broadMultiStart: triSegRootEvidence.map(({ slsMode, multiStart }) => ({
    slsMode,
    allConverged: multiStart.allConverged,
    sameBranchWithinTolerance: multiStart.sameBranchWithinTolerance,
    maximumPairwiseScaledCoordinateDistance:
      multiStart.maximumPairwiseScaledCoordinateDistance,
    scaledCoordinateDistanceNorm: multiStart.scaledCoordinateDistanceNorm,
    convergedCoordinates: multiStart.results.map((result) => result.converged === true
      ? {
        ...result.coordinates,
        scaledJacobianDeterminant: result.scaledJacobianDiagnostics.determinant,
        scaledJacobianSigmaMinimum: result.scaledJacobianDiagnostics.sigmaMinimum,
        scaledJacobianConditionNumber2: result.scaledJacobianDiagnostics.conditionNumber2,
      }
      : { failure: result.reason }),
    blockerRetained: !multiStart.accepted,
  })),
  localStaticRestoringClassifier: {
    status: staticRestoringGateManifest.status,
    interpretation: staticRestoringGateManifest
      .workConjugateStaticRestoringClassifier.interpretation,
    supportedEnvelopeFrozen: staticRestoringGateManifest
      .localPredictorCorrectorRegression.supportedEnvelopeFrozen,
    pseudoArclengthPolicy: staticRestoringGateManifest
      .localPredictorCorrectorRegression.pseudoArclengthPolicy,
    topologies: triSegStaticRestoringEvidence.map(({ slsMode, audits }) => ({
      slsMode,
      roots: audits.map(({ root, audit }) => ({
        coordinates: root.coordinates,
        publishedScaledJacobianDeterminant:
          root.scaledJacobianDiagnostics.determinant,
        publishedScaledJacobianSigmaMinimum:
          root.scaledJacobianDiagnostics.sigmaMinimum,
        classification: audit.scaledRestoringTangent.classification,
        eigenvaluesAscending: audit.scaledRestoringTangent.eigenvaluesAscending,
        uncertaintyBound: audit.scaledRestoringTangent.uncertaintyBound,
        robustSignedMargin: audit.scaledRestoringTangent.robustSignedMargin,
        relativeSkewDefect: audit.scaledRestoringTangent.relativeSkewDefect,
        generalizedForceTransformAuditDifference2:
          audit.generalizedForceTransformAudit.differenceTwoNorm,
        acceptedUnderLocalStaticRestoringTestReference:
          audit.acceptedUnderLocalStaticRestoringTestReference,
        energeticStability: audit.energeticStability,
        physiologicalRootClaimed: audit.physiologicalRootClaimed,
        globalUniquenessClaimed: audit.globalUniquenessClaimed,
      })),
    })),
  },
  localNaturalParameterContinuation: {
    scope: staticRestoringGateManifest.localPredictorCorrectorRegression.scope,
    pathClaim:
      staticRestoringGateManifest.localPredictorCorrectorRegression.pathClaim,
    pathParameterization:
      "cumulative-scaled-load-arclength-using-declared-fixed-load-scales",
    parameterDerivativeStencil: staticRestoringGateManifest
      .localPredictorCorrectorRegression.parameterDerivativeStencil,
    subdivisionInterpretation: staticRestoringGateManifest
      .localPredictorCorrectorRegression.subdivisionInterpretation,
    supportedEnvelopeFrozen: false,
    topologies: triSegNaturalParameterEvidence.map((topology) => ({
      slsMode: topology.slsMode,
      accepted: topology.accepted,
      supportedEnvelopeClaimed: topology.supportedEnvelopeClaimed,
      continuousIntervalRegularityClaimed:
        topology.continuousIntervalRegularityClaimed,
      globalUniquenessClaimed: topology.globalUniquenessClaimed,
      physiologicalValidationClaimed: topology.physiologicalValidationClaimed,
      paths: topology.paths.map((path) => ({
        pathId: path.pathId,
        accepted: path.accepted,
        anchorLoadBound: path.anchorLoadBound,
        declaredNodesMatchFactorTwo: path.declaredNodesMatchFactorTwo,
        maximumEndpointAgreementScaledInfinityNorm:
          path.maximumEndpointAgreementDistance,
        reverseClosureScaledInfinityNorm:
          path.reverseClosureScaledInfinityNorm,
        endpointAgreementBySubdivision: path.endpointAgreementBySubdivision,
        subdivisions: path.subdivisions.map(({ segmentCount, run }) => ({
          segmentCount,
          numericalPathAccepted: run.numericalPathAccepted,
          allConverged: run.allConverged,
          branchIdentityEstablished: run.branchIdentityEstablished,
          maximumTangentPredictionHalvingDifferenceScaledInfinityNorm:
            run.maximumTangentPredictionHalvingDifferenceScaledInfinityNorm,
          maximumPredictorCorrectionScaledInfinityNorm:
            run.maximumPredictorCorrectionScaledInfinityNorm,
          maximumPredictorCorrectionToAcceptedCoordinateStepRatio:
            run.maximumPredictorCorrectionToAcceptedCoordinateStepRatio,
          maximumAcceptedScaledCoordinateStep:
            run.maximumAcceptedScaledCoordinateStep,
          minimumTangentDot: run.minimumTangentDot,
          thresholdViolations: run.thresholdViolations,
          failure: run.failure,
        })),
        reverse: path.reverse === null ? null : {
          numericalPathAccepted: path.reverse.numericalPathAccepted,
          allConverged: path.reverse.allConverged,
          branchIdentityEstablished: path.reverse.branchIdentityEstablished,
          maximumTangentPredictionHalvingDifferenceScaledInfinityNorm:
            path.reverse
              .maximumTangentPredictionHalvingDifferenceScaledInfinityNorm,
          maximumPredictorCorrectionScaledInfinityNorm:
            path.reverse.maximumPredictorCorrectionScaledInfinityNorm,
          maximumPredictorCorrectionToAcceptedCoordinateStepRatio:
            path.reverse
              .maximumPredictorCorrectionToAcceptedCoordinateStepRatio,
          maximumAcceptedScaledCoordinateStep:
            path.reverse.maximumAcceptedScaledCoordinateStep,
          minimumTangentDot: path.reverse.minimumTangentDot,
          thresholdViolations: path.reverse.thresholdViolations,
          failure: path.reverse.failure,
        },
        forwardSampledNodeAudit:
          summarizeNaturalPathNodeAudits(path.forwardNodeAudits),
        reverseSampledNodeAudit:
          summarizeNaturalPathNodeAudits(path.reverseNodeAudits),
      })),
    })),
  },
  anchoredLocalContinuation: triSegRootEvidence.map(({ slsMode, continuation }) => ({
    slsMode,
    accepted: continuation.accepted,
    allConverged: continuation.allConverged,
    sampledStepDistanceWithinThreshold:
      continuation.sampledStepDistanceWithinThreshold,
    continuousIntervalRegularityClaimed:
      continuation.continuousIntervalRegularityClaimed,
    initialAnchorScaledDistance: continuation.initialAnchorScaledDistance,
    maximumScaledStepDistance: continuation.maximumScaledStepDistance,
    scaledCoordinateDistanceNorm: continuation.scaledCoordinateDistanceNorm,
    branchContinuityThreshold: continuation.branchContinuityThreshold,
    previousRootUse: continuation.previousRootUse,
    points: continuation.results.map((result) => result.converged === true
      ? {
        coordinates: result.coordinates,
        determinant: result.scaledJacobianDiagnostics.determinant,
        sigmaMinimum: result.scaledJacobianDiagnostics.sigmaMinimum,
        conditionNumber2: result.scaledJacobianDiagnostics.conditionNumber2,
      }
      : { failure: result.reason }),
    wholeSupportedDomainStabilityClaimed: false,
  })),
  shortHorizon: {
    slsOn: summarizeShortHorizon(shortHorizonOn),
    slsOff: summarizeShortHorizon(shortHorizonOff),
  },
  algorithmicJacobianCandidateMatrix: {
    selectionRule: fixture.numericalPolicy.algorithmicJacobianStepSelectionRule,
    evidenceStatus: fixture.numericalPolicy.algorithmicJacobianSelectionEvidenceStatus,
    selectedConstructionScaledStep: fixture.numericalPolicy.algorithmicJacobianScaledStep,
    largestPassingConstructionScaledStep: largestPassingJacobianCandidate,
    candidates: jacobianCandidateMatrix.map((candidate) => ({
      constructionScaledStep: candidate.constructionScaledStep,
      independentScaledStep: candidate.independentScaledStep,
      accepted: candidate.accepted,
      topologies: candidate.topologyResults.map((result) => result.completed === true
        ? {
          slsMode: result.slsMode,
          completed: true,
          accepted: result.suite.accepted,
          maximumRelativeTwoNormDifference: result.suite.maximumRelativeTwoNormDifference,
          maximumAbsoluteScaledDifference: result.suite.maximumAbsoluteScaledDifference,
          maximumAbsoluteScaledDifferenceUse:
            result.suite.maximumAbsoluteScaledDifferenceUse,
          directions: result.suite.directions.map((direction) => ({
            directionId: direction.directionId,
            relativeTwoNormDifference: direction.audit.relativeTwoNormDifference,
            maximumRowRelativeDifference: direction.audit.maximumRelativeDifference,
          })),
        }
        : { slsMode: result.slsMode, completed: false, reason: result.reason }),
    })),
  },
  timeStepConvergence: {
    slsOn: summarizeTimeStepConvergence(timeStepConvergenceOn),
    slsOff: summarizeTimeStepConvergence(timeStepConvergenceOff),
  },
  runtimeBoundary: {
    ...FOUR_CHAMBER_PHASE_B0_STATUS_V1.runtimeBoundary,
    sourceScan: runtimeBoundarySourceScan,
  },
  acceptanceBlockers: FOUR_CHAMBER_PHASE_B0_STATUS_V1.acceptanceBlockers,
  failures,
};

// eslint-disable-next-line no-console
console.log(JSON.stringify(report, null, 2));
if (!report.implementationPass) process.exitCode = 1;

function firstConvergedRoot(
  run: PhaseB0TriSegNaturalParameterContinuationAuditV1,
): PhaseB0PublishedTriSegRootSuccessV1 | null {
  const root = run.roots[0];
  return root !== undefined && root.converged === true ? root : null;
}

function finalConvergedRoot(
  run: PhaseB0TriSegNaturalParameterContinuationAuditV1,
): PhaseB0PublishedTriSegRootSuccessV1 | null {
  const root = run.roots[run.roots.length - 1];
  return root !== undefined && root.converged === true ? root : null;
}

function pathsEqual(
  left: readonly PhaseB0TriSegContinuationPointV1[],
  right: readonly PhaseB0TriSegContinuationPointV1[],
): boolean {
  return left.length === right.length && left.every((point, index) => {
    const candidate = right[index];
    return candidate !== undefined
      && nearlyEqual(point.leftVentricularCavityVolumeM3,
        candidate.leftVentricularCavityVolumeM3)
      && nearlyEqual(point.rightVentricularCavityVolumeM3,
        candidate.rightVentricularCavityVolumeM3);
  });
}

function nearlyEqual(left: number, right: number): boolean {
  const scale = Math.max(Math.abs(left), Math.abs(right), Number.MIN_VALUE);
  return Math.abs(left - right) <= 64 * Number.EPSILON * scale;
}

function auditNaturalParameterPathNodes(
  rootInput: Omit<PhaseB0PublishedTriSegRootInputV1, "initialCoordinates">,
  path: readonly PhaseB0TriSegContinuationPointV1[],
  roots: readonly PhaseB0PublishedTriSegRootResultV1[],
) {
  return Object.freeze(path.map((node, nodeIndex) => {
    const root = roots[nodeIndex];
    if (root === undefined) {
      return Object.freeze({
        nodeIndex,
        accepted: false,
        failure: "missing-root",
      });
    }
    if (root.converged === false) {
      return Object.freeze({
        nodeIndex,
        accepted: false,
        failure: root.reason,
      });
    }
    const audit = auditPhaseB0TriSegStaticRestoringRootV1({
      rootInput: {
        ...rootInput,
        leftVentricularCavityVolumeM3: node.leftVentricularCavityVolumeM3,
        rightVentricularCavityVolumeM3: node.rightVentricularCavityVolumeM3,
      },
      root,
      generalizedForceResidualScales: {
        septalMidwallVolumePa:
          fixture.newtonScaleRegistry.residualScales.virtualWorkSeptalVolumePa,
        junctionRadiusN:
          fixture.newtonScaleRegistry.residualScales.virtualWorkJunctionRadiusN,
      },
      policy:
        staticRestoringGateManifest.workConjugateStaticRestoringClassifier.policy,
    });
    const accepted = root.oracle.taylorTensionErrorDomainEligible
      && audit.generalizedForceTransformAudit.accepted
      && audit.rootRegularity.accepted
      && audit.scaledRestoringTangent.classification === "robust-restoring"
      && audit.acceptedUnderLocalStaticRestoringTestReference
      && !audit.energeticStability.eligible
      && !audit.physiologicalRootClaimed
      && !audit.globalUniquenessClaimed;
    return Object.freeze({
      nodeIndex,
      accepted,
      failure: null,
      coordinates: root.coordinates,
      taylorDomainClassification: root.oracle.domainClassification,
      taylorTensionErrorDomainEligible:
        root.oracle.taylorTensionErrorDomainEligible,
      rootSigmaMinimum: audit.rootRegularity.sigmaMinimum,
      rootConditionNumber2: audit.rootRegularity.conditionNumber2,
      rootRegularityAccepted: audit.rootRegularity.accepted,
      staticRestoringClassification:
        audit.scaledRestoringTangent.classification,
      staticRestoringRobustSignedMargin:
        audit.scaledRestoringTangent.robustSignedMargin,
      generalizedForceTransformAuditAccepted:
        audit.generalizedForceTransformAudit.accepted,
      energeticStabilityEligible: audit.energeticStability.eligible,
      physiologicalRootClaimed: audit.physiologicalRootClaimed,
      globalUniquenessClaimed: audit.globalUniquenessClaimed,
    });
  }));
}

function summarizeNaturalPathNodeAudits(
  audits: ReturnType<typeof auditNaturalParameterPathNodes>,
) {
  const successful = audits.filter((audit) => "rootSigmaMinimum" in audit);
  return {
    nodeCount: audits.length,
    allAccepted: audits.every(({ accepted }) => accepted),
    allTaylorTensionErrorDomainEligible: successful.length === audits.length
      && successful.every((audit) => audit.taylorTensionErrorDomainEligible),
    minimumRootSigmaMinimum: successful.length > 0
      ? Math.min(...successful.map((audit) => audit.rootSigmaMinimum))
      : null,
    maximumRootConditionNumber2: successful.length > 0
      ? Math.max(...successful.map((audit) => audit.rootConditionNumber2))
      : null,
    minimumStaticRestoringRobustSignedMargin: successful.length > 0
      ? Math.min(...successful.map(
        (audit) => audit.staticRestoringRobustSignedMargin,
      ))
      : null,
  };
}

function summarizeShortHorizon(
  run: typeof shortHorizonOn,
): unknown {
  return run.completed === true
    ? {
      completed: true,
      stepCount: run.stepCount,
      shortHorizonNumericalAcceptance: run.shortHorizonNumericalAcceptance,
      diagnostics: run.diagnostics,
    }
    : {
      completed: false,
      failedStepIndex: run.failedStepIndex,
      reason: run.failure.reason,
    };
}

function summarizeTimeStepConvergence(
  convergence: typeof timeStepConvergenceOn,
): unknown {
  return {
    allCompleted: convergence.allCompleted,
    timeStepsSec: convergence.timeStepsSec,
    coarseToMediumScaledEndpointDifference:
      convergence.coarseToMediumScaledEndpointDifference,
    mediumToFineScaledEndpointDifference:
      convergence.mediumToFineScaledEndpointDifference,
    observedOrder: convergence.observedOrder,
    stateOrderAccepted: convergence.stateOrderAccepted,
    energyLedgerRhoByTimeStep: convergence.energyLedgerRhoByTimeStep,
    energyLedgerObservedOrderCoarseToMedium:
      convergence.energyLedgerObservedOrderCoarseToMedium,
    energyLedgerObservedOrderMediumToFine:
      convergence.energyLedgerObservedOrderMediumToFine,
    energyLedgerObservedOrder: convergence.energyLedgerObservedOrder,
    energyLedgerOrderAccepted: convergence.energyLedgerOrderAccepted,
    nominalGridPreservedWithoutSubdivision:
      convergence.nominalGridPreservedWithoutSubdivision,
    orderAccepted: convergence.orderAccepted,
  };
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function auditRuntimeBoundarySourceScan(): Readonly<{
  scannedFileCount: number;
  leakPaths: readonly string[];
}> {
  const workingDirectory = process.cwd();
  const sourceRoots = [
    "engine",
    "components",
    "contexts",
    "data",
    "features",
    "hooks",
    "locales",
    "utils",
  ];
  const nestedSourceFiles = sourceRoots.flatMap((sourceRoot) =>
    collectTypeScriptFiles(resolve(workingDirectory, sourceRoot)));
  const topLevelSourceFiles = readdirSync(workingDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name))
    .map((entry) => resolve(workingDirectory, entry.name));
  const testOnlySidecarDirectories = [
    "engine/myocardium/fourChamberV1/phaseB0",
    "engine/myocardium/fourChamberV1/phaseB1",
  ].map((path) => resolve(workingDirectory, path));
  const scannedFiles = [...nestedSourceFiles, ...topLevelSourceFiles]
    .filter((absolutePath) => !testOnlySidecarDirectories.some(
      (directory) => absolutePath.startsWith(`${directory}${sep}`),
    ));
  const leakPaths = scannedFiles
    .filter((absolutePath) =>
      /phaseB0|PHASE_B0|phaseB1|PHASE_B1|SmoothActiveStressDouble/.test(
        readFileSync(absolutePath, "utf8"),
      ))
    .map((absolutePath) => relative(workingDirectory, absolutePath))
    .sort();
  return Object.freeze({
    scannedFileCount: scannedFiles.length,
    leakPaths: Object.freeze(leakPaths),
  });
}

function collectTypeScriptFiles(absoluteDirectory: string): string[] {
  return readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(absoluteDirectory, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(absolutePath);
    return entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name) ? [absolutePath] : [];
  });
}
