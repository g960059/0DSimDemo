import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from
  "@/engine/myocardium/fourChamberV1/ids";
import type { PhaseB0SyntheticHydromechanicsCaseV1 } from
  "@/engine/myocardium/fourChamberV1/phaseB0/syntheticHydromechanicsCaseV1";
import type { PhaseB0TriSegStaticRestoringPolicyV1 } from
  "@/engine/myocardium/fourChamberV1/phaseB0/triSegStaticRestoringAuditV1";

export const PHASE_B0_TRISEG_STATIC_RESTORING_GATE_MANIFEST_V1_ID =
  "four-chamber-phase-b0-triseg-static-restoring-local-gate-manifest-v1" as const;

type VolumeMultiplier = Readonly<{ LV: number; RV: number }>;

export type PhaseB0TriSegStaticRestoringGateManifestHashPayloadV1 = Readonly<{
  manifestId: typeof PHASE_B0_TRISEG_STATIC_RESTORING_GATE_MANIFEST_V1_ID;
  status: "local-classifier-regression-not-supported-envelope-acceptance";
  evidenceClass: "project-synthetic-implementation-verification";
  bindings: Readonly<{
    syntheticCaseSha256: string;
    newtonScaleRegistrySha256: string;
    equationAssembly: "published-Taylor-2009";
    rootSolverId: "phase-b0-published-taylor-triseg-scaled-root-v1";
    wallStressStateSource:
      "same-time-level-phase-b0-hydromechanics-with-time-and-sls-alpha-frozen";
  }>;
  frozenState: Readonly<{
    timeSec: 0;
    slsModes: readonly ["on", "off"];
    activeStressSource: "phase-b0-smooth-periodic-test-double";
    anchorProvenance:
      "analytic-symmetry-plus-content-hashed-1000-Pa-project-synthetic-construction";
    anchorCoordinates: Readonly<{
      septalMidwallCapVolumeM3: number;
      junctionRadiusM: number;
    }>;
    expectedAnchorSignature: Readonly<{
      axialResidualSignAtRoot: 0;
      radialResidualSignAtRoot: 0;
      staticRestoringClass: "robust-restoring";
    }>;
  }>;
  workConjugateStaticRestoringClassifier: Readonly<{
    publishedResidualOrder: readonly ["sumTxNPerM", "sumTyNPerM"];
    coordinateOrder: readonly ["septalMidwallCapVolumeM3", "junctionRadiusM"];
    generalizedForceOrder: readonly ["septalMidwallVolumePa", "junctionRadiusN"];
    transform: "G=diag(2/y_m,2*pi*y_m)*g_published";
    tangentScaling:
      "d(G/generalized-force-scale)/d(q/coordinate-scale)";
    symmetrization: "K_static=(K_scaled+transpose(K_scaled))/2";
    interpretation:
      "static-restoring-classifier-not-energy-Hessian-or-thermodynamic-stability";
    policy: PhaseB0TriSegStaticRestoringPolicyV1;
  }>;
  discoveredRootRegression: Readonly<{
    rootSearchDomain: Readonly<{
      septalMidwallCapVolumeM3: readonly [-0.000005, 0.000005];
      junctionRadiusM: readonly [0.025, 0.035];
      use: "seed-coverage-regression-not-a-root-exclusion-bound";
    }>;
    multiStartSeeds: readonly Readonly<{
      septalMidwallCapVolumeM3: number;
      junctionRadiusM: number;
    }>[];
    scaledRootClusteringTolerance: 1e-8;
    expectedDiscoveredClassesInEachSlsMode:
      readonly ["robust-restoring", "robust-saddle"];
    enumerationClaim:
      "all-roots-discovered-by-this-finite-protocol-are-reported-global-exhaustiveness-not-claimed";
  }>;
  localPredictorCorrectorRegression: Readonly<{
    scope: "local-reference-path-regression-only";
    supportedEnvelopeFrozen: false;
    paths: readonly Readonly<{
      pathId: "LV-down-RV-up" | "LV-up-RV-down";
      nodes: readonly VolumeMultiplier[];
    }>[];
    anchorMustBeFirstNode: true;
    pathParameterization:
      "cumulative-scaled-load-arclength-using-first-node-volume-scales";
    predictor: "natural-parameter-tangent";
    corrector: "scaled-damped-Newton-at-declared-node";
    parameterDerivativeStencil:
      "in-segment-forward-five-point-with-step-halving-audit";
    parameterDerivativeScaledStep: number;
    minimumScaledLoadArclength: number;
    maximumTangentPredictionHalvingDifferenceScaledInfinityNorm: number;
    maximumAnchorCorrectionScaledInfinityNorm: number;
    maximumPredictorCorrectionScaledInfinityNorm: number;
    maximumPredictorCorrectionToAcceptedCoordinateStepRatio: number;
    maximumAcceptedScaledCoordinateStep: number;
    minimumTangentDot: number;
    tangentDotInterpretation:
      "scaled-code-regression-not-physical-angle-or-fold-proof";
    relativePivotTolerance: number;
    sampledNodeGate: readonly [
      "root-regularity",
      "generalized-force-transform-audit",
      "robust-static-restoring-class",
      "published-Taylor-within-2pct-tension-error-domain",
    ];
    reverseTraversalClosureNorm: "scaled-infinity-norm-using-unknown-scales";
    reverseTraversalClosureTolerance: number;
    independentInitializationEndpointAgreementNorm:
      "scaled-infinity-norm-using-unknown-scales";
    independentInitializationEndpointAgreementTolerance: number;
    subdivisionInterpretation:
      "independent-predictor-initialization-endpoint-agreement-not-grid-convergence";
    deterministicSubdivisionFactors: readonly [1, 2, 4, 8];
    pathClaim:
      "sampled-local-path-numerical-regression-not-continuous-interval-proof";
    pseudoArclengthPolicy: Readonly<{
      use: "diagnostic-on-trigger-only";
      acceptedBranchFoldCrossingAllowed: false;
      triggers: readonly [
        "persistent-corrector-failure",
        "root-Jacobian-sigma-minimum-approaches-floor",
        "tangent-reversal",
        "alternative-root-fold-enumeration",
      ];
    }>;
  }>;
  prohibitedRootSelection: readonly [
    "minimum-residual",
    "maximum-junction-radius",
    "nearest-root-as-acceptance-proof",
    "forced-previous-septum",
    "coordinate-bound-retrofitted-to-remove-the-lower-root",
  ];
  negativeClaims: Readonly<{
    globalRootUniqueness: false;
    energeticMinimum: false;
    thermodynamicStability: false;
    physiologicalValidation: false;
    fullSupportedEnvelope: false;
    landPhaseB1Validity: false;
    releaseValidity: false;
  }>;
  releaseClaims: Readonly<{
    phaseB0Acceptance: false;
    phaseB1ImplementationEligibleFromThisManifestAlone: false;
    phaseB1AcceptanceEligible: false;
    releaseRuntimeReachable: false;
  }>;
}>;

export type PhaseB0TriSegStaticRestoringGateManifestV1 =
  PhaseB0TriSegStaticRestoringGateManifestHashPayloadV1 & Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export function buildPhaseB0TriSegStaticRestoringGateManifestV1(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB0TriSegStaticRestoringGateManifestV1 {
  const policy: PhaseB0TriSegStaticRestoringPolicyV1 = Object.freeze({
    coarseDerivativeScaledStep: 2 ** -16,
    fineDerivativeScaledStep: 2 ** -18,
    derivativeDisagreementMultiplier: 10,
    relativeUncertaintyFloor: 1e-6,
    minimumRobustRestoringMargin: 1e-3,
    minimumRootJacobianSigmaMinimum: 1e-3,
    maximumRootJacobianConditionNumber2: 1e3,
    maximumScaledRootResidualInfinityNorm: 1e-8,
    maximumScaledRootUpdateInfinityNorm: 1e-8,
    maximumGeneralizedForceTransformAuditDifference2: 1e-6,
  });
  const anchor = Object.freeze({
    septalMidwallCapVolumeM3: fixture.initialState.triSegCoordinates.V_m_S,
    junctionRadiusM: fixture.initialState.triSegCoordinates.y_m,
  });
  const anchorNode = Object.freeze({ LV: 1, RV: 1 });
  const payload: PhaseB0TriSegStaticRestoringGateManifestHashPayloadV1 = Object.freeze({
    manifestId: PHASE_B0_TRISEG_STATIC_RESTORING_GATE_MANIFEST_V1_ID,
    status: "local-classifier-regression-not-supported-envelope-acceptance",
    evidenceClass: "project-synthetic-implementation-verification",
    bindings: Object.freeze({
      syntheticCaseSha256: fixture.contentSha256,
      newtonScaleRegistrySha256: fixture.newtonScaleRegistryContentSha256,
      equationAssembly: "published-Taylor-2009",
      rootSolverId: "phase-b0-published-taylor-triseg-scaled-root-v1",
      wallStressStateSource:
        "same-time-level-phase-b0-hydromechanics-with-time-and-sls-alpha-frozen",
    }),
    frozenState: Object.freeze({
      timeSec: 0,
      slsModes: Object.freeze(["on", "off"] as const),
      activeStressSource: "phase-b0-smooth-periodic-test-double",
      anchorProvenance:
        "analytic-symmetry-plus-content-hashed-1000-Pa-project-synthetic-construction",
      anchorCoordinates: anchor,
      expectedAnchorSignature: Object.freeze({
        axialResidualSignAtRoot: 0,
        radialResidualSignAtRoot: 0,
        staticRestoringClass: "robust-restoring",
      }),
    }),
    workConjugateStaticRestoringClassifier: Object.freeze({
      publishedResidualOrder: Object.freeze(["sumTxNPerM", "sumTyNPerM"] as const),
      coordinateOrder: Object.freeze([
        "septalMidwallCapVolumeM3",
        "junctionRadiusM",
      ] as const),
      generalizedForceOrder: Object.freeze([
        "septalMidwallVolumePa",
        "junctionRadiusN",
      ] as const),
      transform: "G=diag(2/y_m,2*pi*y_m)*g_published",
      tangentScaling: "d(G/generalized-force-scale)/d(q/coordinate-scale)",
      symmetrization: "K_static=(K_scaled+transpose(K_scaled))/2",
      interpretation:
        "static-restoring-classifier-not-energy-Hessian-or-thermodynamic-stability",
      policy,
    }),
    discoveredRootRegression: Object.freeze({
      rootSearchDomain: Object.freeze({
        septalMidwallCapVolumeM3: Object.freeze([-5e-6, 5e-6] as const),
        junctionRadiusM: Object.freeze([0.025, 0.035] as const),
        use: "seed-coverage-regression-not-a-root-exclusion-bound",
      }),
      multiStartSeeds: Object.freeze([
        Object.freeze({ septalMidwallCapVolumeM3: -2e-6, junctionRadiusM: 0.028 }),
        Object.freeze({ septalMidwallCapVolumeM3: 2e-6, junctionRadiusM: 0.032 }),
        anchor,
      ]),
      scaledRootClusteringTolerance: 1e-8,
      expectedDiscoveredClassesInEachSlsMode: Object.freeze([
        "robust-restoring",
        "robust-saddle",
      ] as const),
      enumerationClaim:
        "all-roots-discovered-by-this-finite-protocol-are-reported-global-exhaustiveness-not-claimed",
    }),
    localPredictorCorrectorRegression: Object.freeze({
      scope: "local-reference-path-regression-only",
      supportedEnvelopeFrozen: false,
      paths: Object.freeze([
        Object.freeze({
          pathId: "LV-down-RV-up" as const,
          nodes: Object.freeze([
            anchorNode,
            Object.freeze({ LV: 0.9995, RV: 1.0005 }),
            Object.freeze({ LV: 0.999, RV: 1.001 }),
          ]),
        }),
        Object.freeze({
          pathId: "LV-up-RV-down" as const,
          nodes: Object.freeze([
            anchorNode,
            Object.freeze({ LV: 1.0005, RV: 0.9995 }),
            Object.freeze({ LV: 1.001, RV: 0.999 }),
          ]),
        }),
      ]),
      anchorMustBeFirstNode: true,
      pathParameterization:
        "cumulative-scaled-load-arclength-using-first-node-volume-scales",
      predictor: "natural-parameter-tangent",
      corrector: "scaled-damped-Newton-at-declared-node",
      parameterDerivativeStencil:
        "in-segment-forward-five-point-with-step-halving-audit",
      parameterDerivativeScaledStep: 2 ** -12,
      minimumScaledLoadArclength: 1e-12,
      maximumTangentPredictionHalvingDifferenceScaledInfinityNorm: 1e-6,
      maximumAnchorCorrectionScaledInfinityNorm: 1e-8,
      maximumPredictorCorrectionScaledInfinityNorm: 1e-4,
      maximumPredictorCorrectionToAcceptedCoordinateStepRatio: 0.1,
      maximumAcceptedScaledCoordinateStep: 0.05,
      minimumTangentDot: Math.cos(Math.PI / 6),
      tangentDotInterpretation:
        "scaled-code-regression-not-physical-angle-or-fold-proof",
      relativePivotTolerance: fixture.numericalPolicy.relativePivotTolerance,
      sampledNodeGate: Object.freeze([
        "root-regularity",
        "generalized-force-transform-audit",
        "robust-static-restoring-class",
        "published-Taylor-within-2pct-tension-error-domain",
      ] as const),
      reverseTraversalClosureNorm: "scaled-infinity-norm-using-unknown-scales",
      reverseTraversalClosureTolerance: 1e-6,
      independentInitializationEndpointAgreementNorm:
        "scaled-infinity-norm-using-unknown-scales",
      independentInitializationEndpointAgreementTolerance: 1e-6,
      subdivisionInterpretation:
        "independent-predictor-initialization-endpoint-agreement-not-grid-convergence",
      deterministicSubdivisionFactors: Object.freeze([1, 2, 4, 8] as const),
      pathClaim:
        "sampled-local-path-numerical-regression-not-continuous-interval-proof",
      pseudoArclengthPolicy: Object.freeze({
        use: "diagnostic-on-trigger-only",
        acceptedBranchFoldCrossingAllowed: false,
        triggers: Object.freeze([
          "persistent-corrector-failure",
          "root-Jacobian-sigma-minimum-approaches-floor",
          "tangent-reversal",
          "alternative-root-fold-enumeration",
        ] as const),
      }),
    }),
    prohibitedRootSelection: Object.freeze([
      "minimum-residual",
      "maximum-junction-radius",
      "nearest-root-as-acceptance-proof",
      "forced-previous-septum",
      "coordinate-bound-retrofitted-to-remove-the-lower-root",
    ] as const),
    negativeClaims: Object.freeze({
      globalRootUniqueness: false,
      energeticMinimum: false,
      thermodynamicStability: false,
      physiologicalValidation: false,
      fullSupportedEnvelope: false,
      landPhaseB1Validity: false,
      releaseValidity: false,
    }),
    releaseClaims: Object.freeze({
      phaseB0Acceptance: false,
      phaseB1ImplementationEligibleFromThisManifestAlone: false,
      phaseB1AcceptanceEligible: false,
      releaseRuntimeReachable: false,
    }),
  });
  return Object.freeze({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
}

export function phaseB0TriSegStaticRestoringGateManifestHashPayloadV1(
  manifest: PhaseB0TriSegStaticRestoringGateManifestV1,
): PhaseB0TriSegStaticRestoringGateManifestHashPayloadV1 {
  const {
    contentSha256: _contentSha256,
    hashAlgorithm: _hashAlgorithm,
    ...payload
  } = manifest;
  return Object.freeze(payload);
}
