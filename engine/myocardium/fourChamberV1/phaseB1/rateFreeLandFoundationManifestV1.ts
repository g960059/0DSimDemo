import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  type PhaseA1TissueManifestBundleV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  RATE_FREE_LAND2017_STATE_LABELS_V1,
  RATE_FREE_LAND2017_V1_ID,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeLand2017V1";
import {
  LAND_RATE_FREE_DISTORTION_TRANSFORM_V1_ID,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeDistortionEquivalenceV1";
import {
  EXACT_LAND_SEMISMOOTH_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/land/exactSemismoothPolicyV1";
import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from
  "@/engine/myocardium/fourChamberV1/ids";
import { LAND2017_EQUATIONS_VERSION } from
  "@/engine/myocardium/myofilament/land2017/types";

export const PHASE_B1_RATE_FREE_LAND_FOUNDATION_MANIFEST_V1_ID =
  "four-chamber-phase-b1-rate-free-land-foundation-manifest-v1" as const;

export type PhaseB1RateFreeLandFoundationManifestHashPayloadV1 = Readonly<{
  manifestId: typeof PHASE_B1_RATE_FREE_LAND_FOUNDATION_MANIFEST_V1_ID;
  status: "component-foundation-not-monolithic-phase-b1-acceptance";
  evidenceClass: "source-equation-and-project-synthetic-component-regression";
  bindings: Readonly<{
    phaseA1TissueManifestBundleSha256: string;
    ventricularTargetPackSha256: string;
    atrialTargetPackSha256: string;
    sourceEquationsVersion: typeof LAND2017_EQUATIONS_VERSION;
    rateFreeModelId: typeof RATE_FREE_LAND2017_V1_ID;
    coordinateTransformId: typeof LAND_RATE_FREE_DISTORTION_TRANSFORM_V1_ID;
    semismoothPolicyId: typeof EXACT_LAND_SEMISMOOTH_POLICY_V1.id;
  }>;
  coordinateContract: Readonly<{
    stateOrder: typeof RATE_FREE_LAND2017_STATE_LABELS_V1;
    transform: "xiW=zetaW-Aw*lambdaLand;xiS=zetaS-As*lambdaLand";
    reconstructedSourceCoordinates:
      "zetaW=xiW+Aw*lambdaLand;zetaS=xiS+As*lambdaLand";
    rateFreeDistortionRhs:
      "xiDot=-c*(xi+A*lambdaLand)";
    productionStateResidualUsesStrainRate: false;
    sourceRateReconstructionUse: "equivalence-audit-and-output-power-only";
  }>;
  backwardEulerContract: Readonly<{
    residual:
      "yNext-yPrevious-dt*fRateFree(yNext,lambdaNext,calciumNext)";
    analyticJacobian:
      "source-coordinate-Jacobian-under-fixed-lambda-affine-coordinate-transform";
    sourceTargetCaseCountPerTissue: 2;
    deliberatelyOffSolutionEquivalenceCaseCountPerTissue: 1;
    offSolutionConstruction:
      "deterministic-valid-interior-perturbation-of-first-source-target-next-state";
    tissues: readonly ["ventricular-human-37c-v1", "atrial-human-prior-v1"];
    noProjection: true;
    noStateClamp: true;
  }>;
  numericalPolicy: Readonly<{
    maximumAbsoluteSourceResidualEquivalenceDifference: number;
    maximumAbsoluteTargetResidual: number;
    maximumAbsoluteActiveStressDifferencePa: number;
    maximumAbsoluteCoordinateRoundTripDifference: number;
    minimumOffSolutionSourceResidualInfinityNorm: number;
    minimumAbsoluteOffSolutionSourceResidualEntry: number;
    independentJacobianScaledStep: number;
    maximumJacobianRelativeTwoNormDifference: number;
  }>;
  implementationBoundary: Readonly<{
    exactCalciumPropagationComponentAvailable: true;
    exactEventStepTransactionImplemented: false;
    eventPreJumpEndpointSolveImplemented: false;
    postJumpAlgebraicReinitializationImplemented: false;
    monolithicSlsOnUnknownCount51Implemented: false;
    monolithicSlsOffUnknownCount46Implemented: false;
    monolithicLandGeometryCrossDerivativesImplemented: false;
    landSimplexFractionToBoundaryImplemented: false;
    landWallStressAdapterIntegratedIntoClosedLoop: false;
    landStateDirectionsIncludedInDifferentiatedTriSegConstraint: false;
    wholeHeartLandEnergyAuditImplemented: false;
    phaseB1InitializationAndBranchProvenanceImplemented: false;
  }>;
  negativeClaims: Readonly<{
    phaseB1MonolithicReferenceComplete: false;
    phaseB1Acceptance: false;
    physiologicalValidation: false;
    experimentalLandValidation: false;
    supportedEnvelope: false;
    releaseRuntimeReachable: false;
  }>;
}>;

export type PhaseB1RateFreeLandFoundationManifestV1 =
  PhaseB1RateFreeLandFoundationManifestHashPayloadV1 & Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export function buildPhaseB1RateFreeLandFoundationManifestV1(
  bundle: PhaseA1TissueManifestBundleV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1RateFreeLandFoundationManifestV1 {
  const payload: PhaseB1RateFreeLandFoundationManifestHashPayloadV1 =
    Object.freeze({
      manifestId: PHASE_B1_RATE_FREE_LAND_FOUNDATION_MANIFEST_V1_ID,
      status: "component-foundation-not-monolithic-phase-b1-acceptance",
      evidenceClass:
        "source-equation-and-project-synthetic-component-regression",
      bindings: Object.freeze({
        phaseA1TissueManifestBundleSha256: bundle.contentSha256,
        ventricularTargetPackSha256:
          bundle.ventricularTargetPack.contentSha256,
        atrialTargetPackSha256: bundle.atrialTargetPack.contentSha256,
        sourceEquationsVersion: LAND2017_EQUATIONS_VERSION,
        rateFreeModelId: RATE_FREE_LAND2017_V1_ID,
        coordinateTransformId: LAND_RATE_FREE_DISTORTION_TRANSFORM_V1_ID,
        semismoothPolicyId: EXACT_LAND_SEMISMOOTH_POLICY_V1.id,
      }),
      coordinateContract: Object.freeze({
        stateOrder: RATE_FREE_LAND2017_STATE_LABELS_V1,
        transform: "xiW=zetaW-Aw*lambdaLand;xiS=zetaS-As*lambdaLand",
        reconstructedSourceCoordinates:
          "zetaW=xiW+Aw*lambdaLand;zetaS=xiS+As*lambdaLand",
        rateFreeDistortionRhs: "xiDot=-c*(xi+A*lambdaLand)",
        productionStateResidualUsesStrainRate: false,
        sourceRateReconstructionUse: "equivalence-audit-and-output-power-only",
      }),
      backwardEulerContract: Object.freeze({
        residual:
          "yNext-yPrevious-dt*fRateFree(yNext,lambdaNext,calciumNext)",
        analyticJacobian:
          "source-coordinate-Jacobian-under-fixed-lambda-affine-coordinate-transform",
        sourceTargetCaseCountPerTissue: 2,
        deliberatelyOffSolutionEquivalenceCaseCountPerTissue: 1,
        offSolutionConstruction:
          "deterministic-valid-interior-perturbation-of-first-source-target-next-state",
        tissues: Object.freeze([
          "ventricular-human-37c-v1",
          "atrial-human-prior-v1",
        ] as const),
        noProjection: true,
        noStateClamp: true,
      }),
      numericalPolicy: Object.freeze({
        maximumAbsoluteSourceResidualEquivalenceDifference:
          64 * Number.EPSILON,
        maximumAbsoluteTargetResidual: 2e-11,
        maximumAbsoluteActiveStressDifferencePa: 1e-12,
        maximumAbsoluteCoordinateRoundTripDifference:
          16 * Number.EPSILON,
        minimumOffSolutionSourceResidualInfinityNorm: 1e-4,
        minimumAbsoluteOffSolutionSourceResidualEntry: 1e-6,
        independentJacobianScaledStep: 2 ** -20,
        maximumJacobianRelativeTwoNormDifference: 2e-7,
      }),
      implementationBoundary: Object.freeze({
        exactCalciumPropagationComponentAvailable: true,
        exactEventStepTransactionImplemented: false,
        eventPreJumpEndpointSolveImplemented: false,
        postJumpAlgebraicReinitializationImplemented: false,
        monolithicSlsOnUnknownCount51Implemented: false,
        monolithicSlsOffUnknownCount46Implemented: false,
        monolithicLandGeometryCrossDerivativesImplemented: false,
        landSimplexFractionToBoundaryImplemented: false,
        landWallStressAdapterIntegratedIntoClosedLoop: false,
        landStateDirectionsIncludedInDifferentiatedTriSegConstraint: false,
        wholeHeartLandEnergyAuditImplemented: false,
        phaseB1InitializationAndBranchProvenanceImplemented: false,
      }),
      negativeClaims: Object.freeze({
        phaseB1MonolithicReferenceComplete: false,
        phaseB1Acceptance: false,
        physiologicalValidation: false,
        experimentalLandValidation: false,
        supportedEnvelope: false,
        releaseRuntimeReachable: false,
      }),
    });
  return Object.freeze({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
}

export function phaseB1RateFreeLandFoundationManifestHashPayloadV1(
  manifest: PhaseB1RateFreeLandFoundationManifestV1,
): PhaseB1RateFreeLandFoundationManifestHashPayloadV1 {
  const {
    contentSha256: _contentSha256,
    hashAlgorithm: _hashAlgorithm,
    ...payload
  } = manifest;
  return Object.freeze(payload);
}
