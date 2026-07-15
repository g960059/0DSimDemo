import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import type { PhaseB0SyntheticHydromechanicsCaseV1 } from
  "@/engine/myocardium/fourChamberV1/phaseB0/syntheticHydromechanicsCaseV1";
import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from
  "@/engine/myocardium/fourChamberV1/ids";

export const PHASE_B0_TEST_REFERENCE_MANIFEST_V1_ID =
  "four-chamber-phase-b0-test-reference-manifest-v1" as const;

type PhaseB0NumericalPolicyV1 =
  PhaseB0SyntheticHydromechanicsCaseV1["numericalPolicy"];

export type PhaseB0TestReferenceManifestHashPayloadV1 = Readonly<{
  manifestId: typeof PHASE_B0_TEST_REFERENCE_MANIFEST_V1_ID;
  status: "exploratory-test-reference-not-phase-b-acceptance";
  evidenceClass: "project-synthetic-implementation-verification";
  syntheticCaseSha256: string;
  numericalPolicy: PhaseB0SyntheticHydromechanicsCaseV1["numericalPolicy"];
  topology: Readonly<{
    bloodVolumeCount: 8;
    inertialFlowCount: 6;
    slsOnUnknownCount: 21;
    slsOffUnknownCount: 16;
  }>;
  shortHorizonProtocol: Readonly<{
    slsModes: readonly ["on", "off"];
    requestedDtSec: 0.00025;
    durationSec: 0.002;
    deterministicSubdivisionFactors: readonly [1, 2, 4, 8];
    differentiatedConstraintResidualToleranceNPerMSec: 1e-5;
    triSegReferenceJacobianDeterminantSign: 1;
    triSegScaledCoordinateStepNorm: "scaled-infinity-norm";
    triSegScaledCoordinateStepTolerance: 0.05;
  }>;
  backwardEulerConvergenceProtocol: Readonly<{
    slsModes: readonly ["on", "off"];
    coarseDtSec: 0.0005;
    durationSec: 0.002;
    nominalGridSubdivisionAllowed: false;
    stateAndEnergyOrderRequired: true;
  }>;
  triSegRootAudit: Readonly<{
    slsModes: readonly ["on", "off"];
    multiStartSeeds: readonly Readonly<{
      septalMidwallCapVolumeM3: number;
      junctionRadiusM: number;
    }>[];
    scaledCoordinateTolerance: 1e-8;
    scaledCoordinateNorm: "scaled-infinity-norm";
    continuationVolumeMultipliers: readonly Readonly<{
      LV: number;
      RV: number;
    }>[];
    continuationAnchorSource: "content-hashed-synthetic-case-initial-triseg-coordinates";
    continuationAnchorCoordinates: Readonly<{
      septalMidwallCapVolumeM3: number;
      junctionRadiusM: number;
    }>;
    continuationScaledStepThreshold: 0.05;
    continuationScaledStepNorm: "scaled-infinity-norm";
    expectedAdversarialRegression:
      "multiple-nonsingular-roots-with-opposite-signed-jacobian-orientation";
    rootSelectionApplied: false;
    stableAnchoredBranchContractFrozen: false;
  }>;
  jacobianAudit: Readonly<{
    topologies: readonly ["on", "off"];
    directionIds: PhaseB0NumericalPolicyV1["algorithmicJacobianAuditDirectionIds"];
    slsDirectionOmittedWhenTopologyOff: true;
    constructionStepCandidates:
      PhaseB0NumericalPolicyV1["algorithmicJacobianScaledStepCandidates"];
    independentStepRatioToConstruction: 0.25;
    selectionRule: PhaseB0NumericalPolicyV1["algorithmicJacobianStepSelectionRule"];
    directionalErrorNorm:
      PhaseB0NumericalPolicyV1["algorithmicJacobianDirectionalErrorNorm"];
    maximumAbsoluteRowDifferenceUse:
      PhaseB0NumericalPolicyV1["algorithmicJacobianMaximumAbsoluteRowDifferenceUse"];
    evaluationState:
      PhaseB0NumericalPolicyV1["algorithmicJacobianAuditEvaluationState"];
    evaluationDtSec: 0.00025;
    directionCoefficients:
      PhaseB0NumericalPolicyV1["algorithmicJacobianAuditDirectionCoefficients"];
    acceptanceEvidence: "exploratory-only";
  }>;
  releaseClaims: Readonly<{
    physiologicalValidation: false;
    phaseB0Acceptance: false;
    phaseB1Eligible: false;
    releaseRuntimeReachable: false;
  }>;
}>;

export type PhaseB0TestReferenceManifestV1 =
  PhaseB0TestReferenceManifestHashPayloadV1 & Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export function buildPhaseB0TestReferenceManifestV1(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB0TestReferenceManifestV1 {
  const payload: PhaseB0TestReferenceManifestHashPayloadV1 = Object.freeze({
    manifestId: PHASE_B0_TEST_REFERENCE_MANIFEST_V1_ID,
    status: "exploratory-test-reference-not-phase-b-acceptance",
    evidenceClass: "project-synthetic-implementation-verification",
    syntheticCaseSha256: fixture.contentSha256,
    numericalPolicy: fixture.numericalPolicy,
    topology: Object.freeze({
      bloodVolumeCount: 8,
      inertialFlowCount: 6,
      slsOnUnknownCount: 21,
      slsOffUnknownCount: 16,
    }),
    shortHorizonProtocol: Object.freeze({
      slsModes: Object.freeze(["on", "off"] as const),
      requestedDtSec: 0.00025,
      durationSec: 0.002,
      deterministicSubdivisionFactors: fixture.numericalPolicy.deterministicSubstepFactors,
      differentiatedConstraintResidualToleranceNPerMSec:
        fixture.numericalPolicy.shortHorizonDifferentiatedConstraintResidualToleranceNPerMSec,
      triSegReferenceJacobianDeterminantSign:
        fixture.numericalPolicy.shortHorizonTriSegReferenceJacobianDeterminantSign,
      triSegScaledCoordinateStepNorm:
        fixture.numericalPolicy.shortHorizonTriSegScaledCoordinateStepNorm,
      triSegScaledCoordinateStepTolerance:
        fixture.numericalPolicy.shortHorizonTriSegScaledCoordinateStepTolerance,
    }),
    backwardEulerConvergenceProtocol: Object.freeze({
      slsModes: Object.freeze(["on", "off"] as const),
      coarseDtSec: 0.0005,
      durationSec: 0.002,
      nominalGridSubdivisionAllowed: false,
      stateAndEnergyOrderRequired: true,
    }),
    triSegRootAudit: Object.freeze({
      slsModes: Object.freeze(["on", "off"] as const),
      multiStartSeeds: Object.freeze([
        Object.freeze({ septalMidwallCapVolumeM3: -2e-6, junctionRadiusM: 0.028 }),
        Object.freeze({ septalMidwallCapVolumeM3: 2e-6, junctionRadiusM: 0.032 }),
        Object.freeze({ septalMidwallCapVolumeM3: 0, junctionRadiusM: 0.03 }),
      ]),
      scaledCoordinateTolerance: 1e-8,
      scaledCoordinateNorm: "scaled-infinity-norm",
      continuationVolumeMultipliers: Object.freeze([
        Object.freeze({ LV: 0.999, RV: 1.001 }),
        Object.freeze({ LV: 1, RV: 1 }),
        Object.freeze({ LV: 1.001, RV: 0.999 }),
      ]),
      continuationAnchorSource:
        "content-hashed-synthetic-case-initial-triseg-coordinates",
      continuationAnchorCoordinates: Object.freeze({
        septalMidwallCapVolumeM3: fixture.initialState.triSegCoordinates.V_m_S,
        junctionRadiusM: fixture.initialState.triSegCoordinates.y_m,
      }),
      continuationScaledStepThreshold: 0.05,
      continuationScaledStepNorm: "scaled-infinity-norm",
      expectedAdversarialRegression:
        "multiple-nonsingular-roots-with-opposite-signed-jacobian-orientation",
      rootSelectionApplied: false,
      stableAnchoredBranchContractFrozen: false,
    }),
    jacobianAudit: Object.freeze({
      topologies: Object.freeze(["on", "off"] as const),
      directionIds: fixture.numericalPolicy.algorithmicJacobianAuditDirectionIds,
      slsDirectionOmittedWhenTopologyOff:
        fixture.numericalPolicy.slsJacobianAuditDirectionOmittedWhenTopologyOff,
      constructionStepCandidates:
        fixture.numericalPolicy.algorithmicJacobianScaledStepCandidates,
      independentStepRatioToConstruction:
        fixture.numericalPolicy.independentDirectionalAuditStepRatioToConstruction,
      selectionRule: fixture.numericalPolicy.algorithmicJacobianStepSelectionRule,
      directionalErrorNorm:
        fixture.numericalPolicy.algorithmicJacobianDirectionalErrorNorm,
      maximumAbsoluteRowDifferenceUse:
        fixture.numericalPolicy.algorithmicJacobianMaximumAbsoluteRowDifferenceUse,
      evaluationState: fixture.numericalPolicy.algorithmicJacobianAuditEvaluationState,
      evaluationDtSec: 0.00025,
      directionCoefficients:
        fixture.numericalPolicy.algorithmicJacobianAuditDirectionCoefficients,
      acceptanceEvidence: "exploratory-only",
    }),
    releaseClaims: Object.freeze({
      physiologicalValidation: false,
      phaseB0Acceptance: false,
      phaseB1Eligible: false,
      releaseRuntimeReachable: false,
    }),
  });
  return Object.freeze({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
}

export function phaseB0TestReferenceManifestHashPayloadV1(
  manifest: PhaseB0TestReferenceManifestV1,
): PhaseB0TestReferenceManifestHashPayloadV1 {
  const {
    contentSha256: _contentSha256,
    hashAlgorithm: _hashAlgorithm,
    ...payload
  } = manifest;
  return Object.freeze(payload);
}
