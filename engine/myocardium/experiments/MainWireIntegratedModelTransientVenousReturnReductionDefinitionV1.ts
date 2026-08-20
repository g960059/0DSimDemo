export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_ENGINEERING_V1_ID =
  "main-wire-integrated-model-transient-systemic-venous-return-reduction-engineering-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_V1_ID =
  "main-wire-integrated-model-transient-systemic-venous-return-reduction-protocol-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_RELATION_COMPARISON_ENGINEERING_V1_ID =
  "main-wire-integrated-model-transient-pv-relation-comparison-engineering-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_REPORT_V1_ID =
  "main-wire-integrated-model-transient-systemic-venous-return-reduction-report-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_NUMERICAL_ACCESS_V1_ID =
  "main-wire-integrated-model-transient-systemic-venous-return-reduction-1ms-access-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_DECLARATION_V1 =
  deepFreezeV1({
    declarationId:
      "integrated-model-0031-transient-systemic-venous-return-reduction" as const,
    declarationCommitSha: "a775a6aa64565e8feceb0a53b17c70e896c5fd27" as const,
    declarationParentCommitSha:
      "3f7005bcca23bd0048103a99ebc26e66728cf02a" as const,
    declarationDocumentPath:
      "docs/scientific-runtime/INTEGRATED-MODEL-0031-transient-systemic-venous-return-reduction.md" as const,
    declarationDocumentGitBlobSha1:
      "2f1bc5570175815779ae30f7fda09b23a82bd862" as const,
    declarationStatus:
      "committed-before-first-normal-adult-source-or-intervention-evaluation" as const,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_EVIDENCE_ADDENDUM_V1 =
  deepFreezeV1({
    addendumId:
      "integrated-model-0032-transient-venous-return-evidence-boundary-addendum" as const,
    addendumCommitSha: "3c2bcff48bb470bc8f0f730fa7d0083f22263ec9" as const,
    addendumParentCommitSha:
      "a775a6aa64565e8feceb0a53b17c70e896c5fd27" as const,
    addendumDocumentPath:
      "docs/scientific-runtime/INTEGRATED-MODEL-0032-transient-venous-return-evidence-boundary-addendum.md" as const,
    addendumDocumentGitBlobSha1:
      "3351f7d57cdea4ab294b1b6d593139f361939ceb" as const,
    addendumStatus:
      "committed-before-first-normal-adult-source-or-intervention-evaluation" as const,
    producerTimeRawProjectionReplayRequired: true as const,
    omittedRawEndpointSemanticReplayClaimedByCompactAuditor: false as const,
    postResultExactArtifactLockRequiredBeforeMerge: true as const,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_BEAT_PHASES_V1 =
  deepFreezeV1([
    "baseline",
    "occlusion-ramp",
    "occlusion-ramp",
    "occlusion-ramp",
    "occlusion-ramp",
    "occlusion-ramp",
    "occlusion-ramp",
    "occlusion-ramp",
    "occlusion-ramp",
    "occlusion-plateau",
    "occlusion-plateau",
    "release-ramp",
    "release-ramp",
    "release-ramp",
    "release-ramp",
    "release-ramp",
    "release-ramp",
    "release-ramp",
    "release-ramp",
    "recovery",
    "recovery",
  ] as const);

export type MainWireIntegratedModelTransientVenousReturnReductionBeatPhaseV1 =
  (typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_BEAT_PHASES_V1)[number];

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_METHOD_IDS_V1 =
  deepFreezeV1([
    "baseline-anchored-isochronal",
    "semilunar-closure",
    "minimum-volume",
    "sampled-common-support-envelope",
  ] as const);

export type MainWireIntegratedModelTransientPvMethodIdV1 =
  (typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_METHOD_IDS_V1)[number];

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_FAILURE_CLASSES_V1 =
  deepFreezeV1([
    "source-not-p1",
    "source-execution-failure",
    "source-binding-failure",
    "trajectory-step-failure",
    "cycle-integrity-failure",
    "landmark-unavailable",
    "relation-integrity-failure",
    "artifact-integrity-failure",
  ] as const);

export type MainWireIntegratedModelTransientVenousReturnReductionFailureClassV1 =
  (typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_FAILURE_CLASSES_V1)[number];

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_NEGATIVE_CLAIMS_V1 =
  deepFreezeV1({
    officialQualificationEstablished: false as const,
    canonicalSourceAuthenticationEstablished: false as const,
    historicalQualificationTransferred: false as const,
    transientProtocolNumericallyQualified: false as const,
    physiologicalValidationEstablished: false as const,
    clinicalValidationEstablished: false as const,
    literalCavalOcclusionEstablished: false as const,
    externalBloodWithdrawalEstablished: false as const,
    independentPeriodicOrbitPerBeatEstablished: false as const,
    isochronalEspvrEstablished: false as const,
    semilunarClosureEspvrEstablished: false as const,
    minimumVolumeEspvrEstablished: false as const,
    supportEnvelopeEspvrEstablished: false as const,
    selectedEspvrMethodEstablished: false as const,
    edpvrEstablished: false as const,
    potentialEnergyEstablished: false as const,
    pvaEstablished: false as const,
    mvo2Established: false as const,
    wholeHeartEnergyEstablished: false as const,
    globalUniquenessEstablished: false as const,
    productionProtocolEstablished: false as const,
    publicCatalogEligibilityEstablished: false as const,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_V1 =
  deepFreezeV1({
    protocolId:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_V1_ID,
    characterizationOwnerId:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_ENGINEERING_V1_ID,
    relationComparisonOwnerId:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_RELATION_COMPARISON_ENGINEERING_V1_ID,
    reportSchemaId:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_REPORT_V1_ID,
    declaration:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_DECLARATION_V1,
    evidenceBoundaryAddendum:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_EVIDENCE_ADDENDUM_V1,
    predecessor: {
      passiveSurfaceMergeCommitSha:
        "b1d46922ab5e2aabdb417f8f2a1dede6c7504933" as const,
      passiveSurfaceImplementationCommitSha:
        "63dcab1626c43e67f80a870365470f24238de417" as const,
      passiveSurfacePayloadSha256:
        "dbdf2b76d23fc902e7b1b75fab75731c7456ff3d69ab9a23994569a723daf294" as const,
      passiveSurfaceRawFileSha256:
        "0ba4d56c98cf933d3d693db36fa5b6086eff2e46b2aa71f7a67f1a5f19caddc7" as const,
      mechanicalLedgerDtMergeCommitSha:
        "3f7005bcca23bd0048103a99ebc26e66728cf02a" as const,
      mechanicalLedgerDtImplementationCommitSha:
        "bcc57e4b41659492eb86a08d9be5597e6bc5ef80" as const,
      mechanicalLedgerDtPayloadSha256:
        "f80da199e50e18e395e958c51e98dd0ea7e878bb6c8171f2c7d23071d6414921" as const,
      mechanicalLedgerDtRawFileSha256:
        "a60278ce159172e86e7c115840325f5de49fa353162742ef7d1b63daa9a2613e" as const,
    },
    source: {
      runnerId: "main-wire-integrated-model-periodic-steady-v3" as const,
      nominalDtSec: 0.001 as const,
      maximumCycleCount: 250 as const,
      executionPurpose: "canonical-evidence" as const,
      requiredClassification: "period1-converged" as const,
      internallyOwnedZeroArgumentExecution: true as const,
      fallbackSourcePermitted: false as const,
    },
    intervention: {
      numericalAccessId:
        MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_NUMERICAL_ACCESS_V1_ID,
      edgeId: "VC_RA" as const,
      scaleOwner: "protocolResistanceScaleByEdge" as const,
      baselineScale: 1 as const,
      maximumScale: 8 as const,
      nominalDtSec: 0.001 as const,
      durationSec: 21 as const,
      scheduleBoundaryTimesSec: [0, 1, 9, 11, 19, 21] as const,
      scheduleExpression:
        "1; exp(log(8)*(tau-1)/8); 8; exp(log(8)*(19-tau)/8); 1" as const,
      beatPhases:
        MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_BEAT_PHASES_V1,
      occlusionBeatOrdinals: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const,
      releaseBeatOrdinals: [
        11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      ] as const,
      matchedRampBeatPairs: [
        [2, 19],
        [3, 18],
        [4, 17],
        [5, 16],
        [6, 15],
        [7, 14],
        [8, 13],
        [9, 12],
      ] as const,
      fixedTotalBloodVolume: true as const,
      externalVolumeSink: false as const,
      changesStandardPolicy: false as const,
    },
    compactLoop: {
      pressureBasis: "transmural" as const,
      sampleCountPerBeatPerVentricle: 64 as const,
      samplePhases: "k/64,k=0,...,63" as const,
      interpolation: "linear-enclosing-raw-accepted-endpoints" as const,
      exactBeatStartIncluded: true as const,
      rawTraceCommitted: false as const,
    },
    landmarks: {
      isochronal:
        "earliest-baseline-raw-endpoint-at-maximum-transmural-pressure-frozen-by-ventricle" as const,
      semilunarClosure:
        "first-positive-to-nonpositive-flow-crossing-after-maximum-positive-flow-linear-interpolation" as const,
      minimumVolume:
        "earliest-raw-accepted-endpoint-at-minimum-ventricular-volume" as const,
      closureFallbackPermitted: false as const,
    },
    relations: {
      methodIds:
        MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_METHOD_IDS_V1,
      directionIds: ["occlusion", "release"] as const,
      ventricleIds: ["LV", "RV"] as const,
      linearFit: "ordinary-unweighted-P=E*V+b" as const,
      extrapolatedV0: "-b/E-only-when-E-positive" as const,
      slopeOrR2IsCompletionGate: false as const,
      supportEnvelope: {
        interceptByLoop: "max_k(P_ik-E*V_ik)" as const,
        coarseSlopeGrid: {
          count: 513 as const,
          minimumMmHgPerMl: 0.05 as const,
          maximumMmHgPerMl: 12 as const,
          spacing: "logarithmic" as const,
        },
        refinementSlopeGrid: {
          count: 257 as const,
          range: "one-coarse-grid-interval-around-best" as const,
          spacing: "logarithmic" as const,
        },
        score: "max-loop-intercept-minus-min-loop-intercept" as const,
        tieBreak: "lower-slope" as const,
        commonIntercept: "maximum-loop-intercept" as const,
      },
    },
    completion: {
      positiveBoolean:
        "transientVenousReturnReductionCharacterizationCompleted" as const,
      requiredSequentialBeatCount: 21 as const,
      requiredMethodCountPerDirectionAndVentricle: 4 as const,
      independentPeriodicityPerBeatRequired: false as const,
      methodAgreementRequired: false as const,
      monotonicityRequired: false as const,
      positiveSlopeRequired: false as const,
      hysteresisToleranceRequired: false as const,
    },
    artifact: {
      path: "artifacts/transient-preload/transient-systemic-venous-return-reduction-engineering-v1.json" as const,
      createOnly: true as const,
      maximumCommittedBytes: 524_288 as const,
      rawCheckpointIncluded: false as const,
      successfulStepsIncluded: false as const,
      fullTraceIncluded: false as const,
      runtimeDependency: false as const,
    },
    failureClasses:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_FAILURE_CLASSES_V1,
    negativeClaims:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_NEGATIVE_CLAIMS_V1,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_SHA256_V1 =
  "6b4d5557c7f711708e1958e05ef76553eab1d7b8fcd50c57ff8cda310f6b73c9" as const;

function deepFreezeV1<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreezeV1(child);
    }
  }
  return value;
}
