export const PVA_RESEARCH_REFERENCE_IDS_V1 = Object.freeze([
  "dynamic-maximum-volume",
  "intrinsic-passive-center-slice",
] as const);

export const PVA_RESEARCH_VENTRICLE_IDS_V1 = Object.freeze([
  "LV",
  "RV",
] as const);

export const PVA_RESEARCH_METHOD_IDS_V1 = Object.freeze([
  "baseline-anchored-isochronal",
  "minimum-volume",
  "sampled-common-support-envelope",
  "semilunar-closure",
] as const);

export const PVA_RESEARCH_CLASSIFICATIONS_V1 = Object.freeze([
  "domain-supported-pva",
  "transient-pva-like-area",
  "out-of-domain",
  "relation-inadmissible",
  "method-unavailable",
] as const);

export const PVA_RESEARCH_REASON_IDS_V1 = Object.freeze([
  "dynamic-fit-grid-boundary",
  "no-supported-intersection",
  "transient-path-needs-synthetic-closure",
  "endpoint-below-supported-domain",
  "systolic-line-outside-landmark-range",
  "systolic-relation-nonpositive-slope",
  "systolic-relation-unavailable",
] as const);

const PVA_REASON_ID_BY_MESSAGE_V1: Readonly<
  Record<string, PvaResearchReasonIdV1>
> = Object.freeze({
  "dynamic reference fit touches a declared search-grid boundary":
    "dynamic-fit-grid-boundary",
  "no systolic-passive intersection exists in the common supported domain":
    "no-supported-intersection",
  "retained transient path requires a synthetic straight closure segment":
    "transient-path-needs-synthetic-closure",
  "systolic endpoint is below-supported-domain":
    "endpoint-below-supported-domain",
  "systolic line area extends outside its landmark volume range":
    "systolic-line-outside-landmark-range",
  "systolic relation does not have positive slope":
    "systolic-relation-nonpositive-slope",
  "systolic relation is unavailable": "systolic-relation-unavailable",
});

export type PvaResearchReferenceIdV1 =
  (typeof PVA_RESEARCH_REFERENCE_IDS_V1)[number];
export type PvaResearchVentricleIdV1 =
  (typeof PVA_RESEARCH_VENTRICLE_IDS_V1)[number];
export type PvaResearchMethodIdV1 = (typeof PVA_RESEARCH_METHOD_IDS_V1)[number];
export type PvaResearchClassificationV1 =
  (typeof PVA_RESEARCH_CLASSIFICATIONS_V1)[number];
export type PvaResearchReasonIdV1 = (typeof PVA_RESEARCH_REASON_IDS_V1)[number];

type PvaResearchDirectionIdV1 = "occlusion" | "release";

type PvaGeometryReferenceDiagnosticInputV2 = Readonly<{
  classification: Exclude<
    PvaResearchClassificationV1,
    "method-unavailable" | "relation-inadmissible"
  >;
  endpointDomainStatus: string;
  supportedIntersectionVolumeMl: number | null;
  observedDomainAreaStrip: Readonly<{
    lowerVolumeMl: number;
    upperVolumeMl: number;
    signedSystolicMinusPassiveAreaJ: number;
  }> | null;
  reasons: readonly string[];
  supportedVolumeRangeMl: readonly [number, number];
}>;

type PvaGeometryDiagnosedRowInputV2 = Readonly<{
  status: "diagnosed";
  ventricleId: PvaResearchVentricleIdV1;
  beatOrdinal: number;
  directionId: PvaResearchDirectionIdV1;
  systolicMethodId: PvaResearchMethodIdV1;
  systolicGeometry: Readonly<{
    lineAreaOutsideMeasuredVolumeRangeFraction: number;
  }>;
  dynamicMaximumVolume: PvaGeometryReferenceDiagnosticInputV2;
  intrinsicPassiveCenterSlice: PvaGeometryReferenceDiagnosticInputV2;
}>;

type PvaGeometryUnavailableRowInputV2 = Readonly<{
  status: "method-unavailable";
  ventricleId: PvaResearchVentricleIdV1;
  beatOrdinal: number;
  directionId: PvaResearchDirectionIdV1;
  systolicMethodId: PvaResearchMethodIdV1;
  reason: string;
}>;

export type PvaGeometryDomainArtifactInputV2 = Readonly<{
  studyId: string;
  status: string;
  scope: string;
  pressureBasis: string;
  beatWorkDiagnostics: readonly Readonly<{
    ventricleId: PvaResearchVentricleIdV1;
    beatOrdinal: number;
    acceptedOpenPathJ: number;
    syntheticStraightClosureJ: number;
    syntheticClosureAbsoluteFractionOfAcceptedOpenPath: number | null;
    exactlyClosedByRetainedEndpoints: boolean;
  }>[];
  rows: readonly (
    PvaGeometryDiagnosedRowInputV2 | PvaGeometryUnavailableRowInputV2
  )[];
  summary: Readonly<{
    attemptedRowCount: number;
    sourceAvailableRowCount: number;
    sourceUnavailableRowCount: number;
    byReference: readonly Readonly<{
      referenceId: PvaResearchReferenceIdV1;
      domainSupportedPvaRowCount: number;
      transientPvaLikeAreaRowCount: number;
      outOfDomainRowCount: number;
      methodUnavailableRowCount: number;
      observedDomainAreaStripRowCount: number;
      supportedIntersectionRowCount: number;
    }>[];
    uniqueBeatWorkCount: number;
    exactlyClosedBeatWorkCount: number;
    syntheticClosureFraction: Readonly<{
      minimum: number;
      median: number;
      maximum: number;
      aboveOnePercentCount: number;
      aboveFivePercentCount: number;
    }>;
    systolicLineOutsideMeasuredRangeFraction: Readonly<{
      minimum: number;
      median: number;
      maximum: number;
      aboveHalfCount: number;
      aboveThreeQuartersCount: number;
    }>;
  }>;
  interpretation: Readonly<{
    existingAbsolutePvaReadyForProductDisplay: false;
    genericPvaEstablished: false;
    closedPeriodicLoopEstablishedForTransientRows: boolean;
    domainSupportedSystolicPassiveIntersectionEstablishedForEveryRow: boolean;
  }>;
}>;

export type PvaResearchReferenceResultV1 = Readonly<{
  classification: PvaResearchClassificationV1;
  endpointDomainStatus: string | null;
  supportedIntersectionEstablished: boolean;
  observedDomainAreaJ: number | null;
  observedDomainVolumeRangeMl: readonly [number, number] | null;
  supportedVolumeRangeMl: readonly [number, number] | null;
  reasons: readonly PvaResearchReasonIdV1[];
}>;

export type PvaResearchRowV1 = Readonly<{
  rowId: string;
  ventricleId: PvaResearchVentricleIdV1;
  beatOrdinal: number;
  directionId: PvaResearchDirectionIdV1;
  systolicMethodId: PvaResearchMethodIdV1;
  acceptedOpenPathJ: number;
  syntheticStraightClosureJ: number;
  syntheticClosureFraction: number | null;
  exactlyClosedByRetainedEndpoints: boolean;
  systolicLineOutsideMeasuredRangeFraction: number | null;
  references: Readonly<
    Record<PvaResearchReferenceIdV1, PvaResearchReferenceResultV1>
  >;
}>;

export type PvaResearchReferenceSummaryV1 = Readonly<{
  referenceId: PvaResearchReferenceIdV1;
  counts: Readonly<Record<PvaResearchClassificationV1, number>>;
  observedDomainAreaStripRowCount: number;
  supportedIntersectionRowCount: number;
}>;

export type PvaResearchDatasetV1 = Readonly<{
  studyId: string;
  pressureBasis: string;
  attemptedRowCount: number;
  sourceAvailableRowCount: number;
  sourceUnavailableRowCount: number;
  uniqueBeatWorkCount: number;
  exactlyClosedBeatWorkCount: number;
  domainSupportedRowCount: number;
  closureFraction: PvaGeometryDomainArtifactInputV2["summary"]["syntheticClosureFraction"];
  systolicExtrapolationFraction: PvaGeometryDomainArtifactInputV2["summary"]["systolicLineOutsideMeasuredRangeFraction"];
  referenceSummaries: readonly PvaResearchReferenceSummaryV1[];
  rows: readonly PvaResearchRowV1[];
  productDisplayReady: false;
  genericPvaEstablished: false;
}>;

export type PvaGeometryDomainArtifactInputV3 = Readonly<{
  studyId: string;
  status: "completed";
  source: Readonly<{ semanticRowBindingEstablished: true }>;
  summary: Readonly<{
    attemptedRowCount: number;
    exactEndpointClosureCount: number;
    numericallyPeriodicClosureQualifiedCount: number;
    transientOpenPathCount: number;
    relationInadmissibleRowCount: number;
    methodUnavailableRowCount: number;
    byReference: readonly Readonly<{
      referenceId: PvaResearchReferenceIdV1;
      domainSupportedPvaRowCount: number;
      transientPvaLikeAreaRowCount: number;
      outOfDomainRowCount: number;
      relationInadmissibleRowCount: number;
      methodUnavailableRowCount: number;
    }>[];
  }>;
}>;

export function bindPvaGeometryV3ToResearchDatasetV1(
  artifact: PvaGeometryDomainArtifactInputV3,
  dataset: PvaResearchDatasetV1,
): PvaResearchDatasetV1 {
  if (
    artifact.studyId !==
      "main-wire-integrated-model-pva-geometry-domain-diagnostics-v3" ||
    artifact.status !== "completed" ||
    !artifact.source.semanticRowBindingEstablished ||
    artifact.summary.attemptedRowCount !== dataset.attemptedRowCount ||
    artifact.summary.exactEndpointClosureCount !==
      dataset.exactlyClosedBeatWorkCount ||
    artifact.summary.relationInadmissibleRowCount +
      artifact.summary.methodUnavailableRowCount !==
      dataset.sourceUnavailableRowCount
  ) {
    throw new Error("PVA V3 result does not bind the displayed dataset");
  }
  for (const summary of dataset.referenceSummaries) {
    const corrected = artifact.summary.byReference.find(
      (value) => value.referenceId === summary.referenceId,
    );
    if (
      corrected === undefined ||
      corrected.domainSupportedPvaRowCount !==
        summary.counts["domain-supported-pva"] ||
      corrected.transientPvaLikeAreaRowCount !==
        summary.counts["transient-pva-like-area"] ||
      corrected.outOfDomainRowCount !== summary.counts["out-of-domain"] ||
      corrected.relationInadmissibleRowCount !==
        summary.counts["relation-inadmissible"] ||
      corrected.methodUnavailableRowCount !==
        summary.counts["method-unavailable"]
    ) {
      throw new Error("PVA V3 classifications do not match displayed rows");
    }
  }
  return Object.freeze({ ...dataset, studyId: artifact.studyId });
}

export type PvaResearchFiltersV1 = Readonly<{
  referenceId: PvaResearchReferenceIdV1;
  ventricleId: PvaResearchVentricleIdV1 | "all";
  systolicMethodId: PvaResearchMethodIdV1 | "all";
  classification: PvaResearchClassificationV1 | "all";
}>;

export type PvaResearchDisplayRowV1 = PvaResearchRowV1 &
  Readonly<{
    referenceId: PvaResearchReferenceIdV1;
    reference: PvaResearchReferenceResultV1;
  }>;

export type PvaPhaseWiseEmaxArtifactInputV1 = Readonly<{
  studyId: string;
  status: string;
  scope: string;
  pressureBasis: string;
  phaseFits: readonly Readonly<{
    ventricleId: PvaResearchVentricleIdV1;
    directionId: "occlusion" | "release";
    phaseIndex: number;
    phase01: number;
    relation: Readonly<{
      slopeMmHgPerMl: number;
      volumeAxisInterceptMl: number;
      rSquared: number | null;
    }>;
  }>[];
  phaseFitFailures: readonly Readonly<{
    status: "unavailable";
    ventricleId: PvaResearchVentricleIdV1;
    directionId: "occlusion" | "release";
    phaseIndex: number;
    phase01: number;
    failureClass: string;
    message: string;
  }>[];
  candidates: readonly Readonly<{
    ventricleId: PvaResearchVentricleIdV1;
    selectedPhaseIndex: number;
    selectedPhase01: number;
    selectedRelation: Readonly<{
      slopeMmHgPerMl: number;
      volumeAxisInterceptMl: number;
      rSquared: number | null;
    }>;
    selectedRootMeanSquaredResidualMmHg: number;
    selectedMeasuredVolumeSpanMl: number;
    releaseAtSelectedPhase: Readonly<{
      releaseMinusOcclusionSlopeMmHgPerMl: number;
    }>;
    releasePeak: Readonly<{
      phaseIndex: number;
      phase01: number;
    }>;
    leaveOneBeatOut: Readonly<{
      allSelectedPhasesWithinOneSampleOfFullFit: boolean;
      minimumSelectedPhaseIndex: number;
      maximumSelectedPhaseIndex: number;
    }>;
  }>[];
  baselinePva: readonly Readonly<{
    ventricleId: PvaResearchVentricleIdV1;
    status: string;
    periodicExternalWorkJ: number;
    reportedPotentialEnergyJ: number | null;
    reportedPressureVolumeAreaJ: number | null;
    observedDomainAreaStripJ: number | null;
    systolicLineAreaOutsideMeasuredRangeFraction: number;
    supportedIntersectionVolumeMl: number | null;
    reasons: readonly string[];
  }>[];
  summary: Readonly<{
    phaseFitCount: number;
    candidateCount: number;
    domainSupportedBaselinePvaCount: number;
    extrapolationDependentBaselinePvaCount: number;
    unavailableBaselinePvaCount: number;
    phaseFitFailureCount: number;
  }>;
  interpretation: Readonly<{
    operationalEmaxEstablished: false;
    genericPvaEstablished: false;
    baselineResearchPvaComputed: boolean;
    transientPeriodicSourceCompatibilityEstablished: boolean;
    allPvaSourceIdentityEstablished: false;
    productionOutputEstablished: false;
  }>;
}>;

export type PvaPhaseWiseEmaxDisplayV1 = Readonly<{
  studyId: string;
  pressureBasis: string;
  rows: readonly Readonly<{
    ventricleId: PvaResearchVentricleIdV1;
    selectedPhaseIndex: number;
    selectedPhase01: number;
    elastanceMmHgPerMl: number;
    volumeAxisInterceptMl: number;
    rSquared: number | null;
    rootMeanSquaredResidualMmHg: number;
    measuredVolumeSpanMl: number;
    releaseSlopeDifferenceFraction: number;
    releasePeakPhaseIndex: number;
    leaveOneOutStable: boolean;
    leaveOneOutPhaseRange: readonly [number, number];
    status: string;
    periodicExternalWorkJ: number;
    potentialEnergyJ: number | null;
    pressureVolumeAreaJ: number | null;
    observedDomainAreaStripJ: number | null;
    extrapolationFraction: number;
    supportedIntersectionEstablished: boolean;
    reasons: readonly string[];
    occlusionSlopeByPhase: readonly number[];
    releaseSlopeByPhase: readonly number[];
  }>[];
  operationalEmaxEstablished: false;
  genericPvaEstablished: false;
  productDisplayReady: false;
}>;

export type PvaMainCandidateArtifactInputV1 = Readonly<{
  candidateId: string;
  status: "qualification-required" | "ready-for-on-demand-main" | "unavailable";
  targetSurface: "completed-protocol-analysis";
  methodSelection: Readonly<{
    status: "selected-for-main-qualification";
    methodId: string;
    loadProtocol: string;
    systolicRelation: string;
    diastolicReference: string;
    pressureBasis: string;
    externalWork: string;
    areaRule: string;
    releaseDirectionUse: string;
  }>;
  outputs: readonly Readonly<{
    outputId: string;
    ventricleId: PvaResearchVentricleIdV1;
    unit: "J";
    researchEstimateJ: number | null;
    mainOutputValueJ: number | null;
    evidenceStatus: string;
    systolicRelation: Readonly<{
      releaseSlopeDifferenceFraction: number;
    }>;
    uncertainty: Readonly<{
      systolicAreaOutsideMeasuredRangeFraction: number;
      externalWorkCoarseFineDifferenceJ: number;
      baselineExclusionSensitivityJ: null;
      selectedPhaseStateDispersionAvailable: false;
    }>;
    blockers: readonly string[];
    limitations: readonly string[];
  }>[];
  promotion: Readonly<{
    mainIntegrationReady: boolean;
    blockers: readonly string[];
    nextRequiredStudy: string | null;
  }>;
  interpretation: Readonly<{
    genericPvaEstablished: false;
    liveSingleBeatOutput: false;
    methodSpecificProtocolOutputSelected: true;
    productValuePublished: false;
  }>;
}>;

export type PvaMainCandidateDisplayV1 = Readonly<{
  status: "qualification-required" | "ready-for-on-demand-main" | "unavailable";
  targetSurface: "completed-protocol-analysis";
  methodSelected: true;
  methodLabel: string;
  rows: readonly Readonly<{
    ventricleId: PvaResearchVentricleIdV1;
    researchEstimateJ: number | null;
    mainOutputValueJ: number | null;
    evidenceStatus: string;
    extrapolationFraction: number;
    directionSensitivityFraction: number;
  }>[];
  blockers: readonly string[];
  limitations: readonly string[];
  nextRequiredStudy: string | null;
}>;

const PVA_QUALIFICATION_LIMITATIONS_V2 = Object.freeze([
  "systolic-relation-extrapolation-required",
  "baseline-exclusion-sensitive",
  "phase-resolution-sensitive",
  "selected-phase-state-dispersion-retained",
  "protocol-direction-sensitivity-retained",
  "fixed-contralateral-intrinsic-passive-reference",
] as const);

export type PvaQualificationLimitationV2 =
  (typeof PVA_QUALIFICATION_LIMITATIONS_V2)[number];

export type PvaQualificationArtifactInputV2 = Readonly<{
  qualificationId: string;
  status: "completed" | "unavailable";
  targetSurface: "completed-protocol-analysis";
  methodId: string;
  stages: Readonly<{
    source: string;
    transient: string;
    periodicLedger: string;
    passiveReference: string;
    qualification: string;
  }>;
  sourceIdentity: Readonly<{
    singlePeriodicSourceExecution: boolean;
    transientAndLedgerShareCheckpoint: boolean;
    passiveReferenceExecutedInSameAnalysisTransaction: boolean;
    passiveReferenceCanonicalOwnerBindingsPassed: boolean;
    allInputsBound: boolean;
  }>;
  outputs: readonly Readonly<{
    outputId: string;
    methodId: string;
    ventricleId: PvaResearchVentricleIdV1;
    status: "qualified-estimate" | "limited-estimate";
    unit: "J";
    mainOutputValueJ: number;
    energy: Readonly<{
      externalWorkJ: number;
      potentialEnergyEquivalentJ: number;
      pvaEstimateJ: number;
      mechanicalConversionRatio: number;
    }>;
    systolicRelation: Readonly<{
      phaseSampleCount: number;
      phaseIndex: number;
      phase01: number;
      elastanceMmHgPerMl: number;
      volumeAxisInterceptMl: number;
      measuredVolumeRangeMl: readonly [number, number];
      rSquared: number | null;
      rootMeanSquaredResidualMmHg: number;
      releaseSlopeDifferenceFraction: number;
    }>;
    passiveReference: Readonly<{
      canonicalOwnerBindingsPassed: boolean;
      fixedContralateralVentricleId: PvaResearchVentricleIdV1;
      fixedContralateralVolumeMl: number;
      supportedVolumeRangeMl: readonly [number, number];
    }>;
    sensitivity: Readonly<{
      baselineExclusion: Readonly<{
        available: boolean;
        estimateJ: number;
        absoluteDifferenceJ: number;
        relativeDifference: number;
        selectedPhaseIndex: number;
      }>;
      phaseResolution: Readonly<{
        available: boolean;
        baselineSampleCount: number;
        refinedSampleCount: number;
        refinedEstimateJ: number;
        absoluteDifferenceJ: number;
        relativeDifference: number;
        refinedPhaseIndex: number;
        circularPhaseDifference: number;
      }>;
      selectedPhaseStateDispersion: Readonly<{
        available: boolean;
        beatCount: number;
        maximumNormalizedSpan: number;
      }>;
      externalWorkCoarseFineDifferenceJ: number;
      systolicAreaOutsideMeasuredRangeFraction: number;
    }>;
    limitations: readonly string[];
  }>[];
  failure: null | Readonly<{ stage: string; message: string }>;
  interpretation: Readonly<{
    methodSpecificPvaEstimateAvailable: boolean;
    genericPvaEstablished: boolean;
    clinicalPvaEstablished: boolean;
    oxygenConsumptionEstablished: boolean;
    liveSingleBeatOutput: boolean;
    automaticLmFallbackUsed: boolean;
    productValuePublished: boolean;
  }>;
}>;

export type PvaQualificationDisplayV2 = Readonly<{
  status: "completed";
  targetSurface: "completed-protocol-analysis";
  methodSpecificOutputAvailable: true;
  singleSourceTransactionEstablished: true;
  rows: readonly Readonly<{
    ventricleId: PvaResearchVentricleIdV1;
    status: "qualified-estimate" | "limited-estimate";
    mainOutputValueJ: number;
    externalWorkJ: number;
    potentialEnergyEquivalentJ: number;
    mechanicalConversionRatio: number;
    phaseIndex: number;
    phase01: number;
    baselineExclusionRelativeDifference: number;
    phaseResolutionRelativeDifference: number;
    selectedPhaseStateDispersionIndex: number;
    externalWorkCoarseFineDifferenceJ: number;
    systolicAreaOutsideMeasuredRangeFraction: number;
    releaseSlopeDifferenceFraction: number;
    limitations: readonly PvaQualificationLimitationV2[];
  }>[];
  genericPvaEstablished: false;
  clinicalPvaEstablished: false;
  liveSingleBeatOutput: false;
}>;

export function projectPvaQualificationDisplayV2(
  artifact: PvaQualificationArtifactInputV2,
): PvaQualificationDisplayV2 {
  const stages = Object.values(artifact.stages);
  if (
    artifact.qualificationId !==
      "main-wire-integrated-model-phase-wise-pva-qualification-v2" ||
    artifact.status !== "completed" ||
    artifact.targetSurface !== "completed-protocol-analysis" ||
    artifact.methodId !==
      "suga-compatible-pva-estimate-phase-wise-venous-occlusion-fixed-passive-slice-v1" ||
    artifact.failure !== null ||
    artifact.outputs.length !== 2 ||
    stages.some((status) => status !== "completed") ||
    !Object.values(artifact.sourceIdentity).every(Boolean) ||
    !artifact.interpretation.methodSpecificPvaEstimateAvailable ||
    artifact.interpretation.productValuePublished ||
    artifact.interpretation.genericPvaEstablished ||
    artifact.interpretation.clinicalPvaEstablished ||
    artifact.interpretation.oxygenConsumptionEstablished ||
    artifact.interpretation.liveSingleBeatOutput ||
    artifact.interpretation.automaticLmFallbackUsed
  ) {
    throw new Error("PVA qualification result is not displayable");
  }
  assertFiniteNumericLeavesForViewV1(artifact, "PVA qualification result");
  const rows = PVA_RESEARCH_VENTRICLE_IDS_V1.map((ventricleId) => {
    const output = artifact.outputs.find(
      (candidate) => candidate.ventricleId === ventricleId,
    );
    if (
      output === undefined ||
      output.outputId !==
        `protocol-analysis.pva-estimate.phase-wise-venous-occlusion-v1.${ventricleId}` ||
      output.methodId !== artifact.methodId ||
      output.unit !== "J" ||
      output.mainOutputValueJ !== output.energy.pvaEstimateJ ||
      !(output.mainOutputValueJ > 0) ||
      output.systolicRelation.phaseSampleCount !== 64 ||
      output.systolicRelation.phase01 !==
        output.systolicRelation.phaseIndex / 64 ||
      !output.passiveReference.canonicalOwnerBindingsPassed ||
      !output.sensitivity.baselineExclusion.available ||
      !output.sensitivity.phaseResolution.available ||
      output.sensitivity.phaseResolution.baselineSampleCount !== 64 ||
      output.sensitivity.phaseResolution.refinedSampleCount !== 128 ||
      !output.sensitivity.selectedPhaseStateDispersion.available
    ) {
      throw new Error(
        `PVA qualification output is inconsistent for ${ventricleId}`,
      );
    }
    const limitations = output.limitations.map((limitation) => {
      if (
        !PVA_QUALIFICATION_LIMITATIONS_V2.includes(
          limitation as PvaQualificationLimitationV2,
        )
      ) {
        throw new Error(`unknown PVA qualification limitation: ${limitation}`);
      }
      return limitation as PvaQualificationLimitationV2;
    });
    return Object.freeze({
      ventricleId,
      status: output.status,
      mainOutputValueJ: output.mainOutputValueJ,
      externalWorkJ: output.energy.externalWorkJ,
      potentialEnergyEquivalentJ: output.energy.potentialEnergyEquivalentJ,
      mechanicalConversionRatio: output.energy.mechanicalConversionRatio,
      phaseIndex: output.systolicRelation.phaseIndex,
      phase01: output.systolicRelation.phase01,
      baselineExclusionRelativeDifference:
        output.sensitivity.baselineExclusion.relativeDifference,
      phaseResolutionRelativeDifference:
        output.sensitivity.phaseResolution.relativeDifference,
      selectedPhaseStateDispersionIndex:
        output.sensitivity.selectedPhaseStateDispersion.maximumNormalizedSpan,
      externalWorkCoarseFineDifferenceJ:
        output.sensitivity.externalWorkCoarseFineDifferenceJ,
      systolicAreaOutsideMeasuredRangeFraction:
        output.sensitivity.systolicAreaOutsideMeasuredRangeFraction,
      releaseSlopeDifferenceFraction:
        output.systolicRelation.releaseSlopeDifferenceFraction,
      limitations: Object.freeze(limitations),
    });
  });
  return Object.freeze({
    status: "completed" as const,
    targetSurface: "completed-protocol-analysis" as const,
    methodSpecificOutputAvailable: true as const,
    singleSourceTransactionEstablished: true as const,
    rows: Object.freeze(rows),
    genericPvaEstablished: false as const,
    clinicalPvaEstablished: false as const,
    liveSingleBeatOutput: false as const,
  });
}

export function projectPvaMainCandidateDisplayV1(
  artifact: PvaMainCandidateArtifactInputV1,
): PvaMainCandidateDisplayV1 {
  if (
    artifact.candidateId !==
      "main-wire-integrated-model-method-specific-pva-main-candidate-v1" ||
    artifact.targetSurface !== "completed-protocol-analysis" ||
    artifact.methodSelection.status !== "selected-for-main-qualification" ||
    artifact.outputs.length !== 2 ||
    artifact.interpretation.genericPvaEstablished ||
    artifact.interpretation.liveSingleBeatOutput ||
    artifact.interpretation.productValuePublished ||
    !artifact.interpretation.methodSpecificProtocolOutputSelected
  ) {
    throw new Error("PVA main candidate artifact is inconsistent");
  }
  const rows = PVA_RESEARCH_VENTRICLE_IDS_V1.map((ventricleId) => {
    const output = artifact.outputs.find(
      (candidate) => candidate.ventricleId === ventricleId,
    );
    if (output === undefined) {
      throw new Error(`PVA main candidate is missing ${ventricleId}`);
    }
    return Object.freeze({
      ventricleId,
      researchEstimateJ: output.researchEstimateJ,
      mainOutputValueJ: output.mainOutputValueJ,
      evidenceStatus: output.evidenceStatus,
      extrapolationFraction:
        output.uncertainty.systolicAreaOutsideMeasuredRangeFraction,
      directionSensitivityFraction:
        output.systolicRelation.releaseSlopeDifferenceFraction,
    });
  });
  return Object.freeze({
    status: artifact.status,
    targetSurface: artifact.targetSurface,
    methodSelected: true as const,
    methodLabel: [
      artifact.methodSelection.loadProtocol,
      artifact.methodSelection.systolicRelation,
      artifact.methodSelection.diastolicReference,
    ].join(" · "),
    rows: Object.freeze(rows),
    blockers: Object.freeze([...artifact.promotion.blockers]),
    limitations: Object.freeze([
      ...new Set(artifact.outputs.flatMap((output) => output.limitations)),
    ]),
    nextRequiredStudy: artifact.promotion.nextRequiredStudy,
  });
}

export function projectPvaPhaseWiseEmaxDisplayV1(
  artifact: PvaPhaseWiseEmaxArtifactInputV1,
): PvaPhaseWiseEmaxDisplayV1 {
  assertPhaseWiseArtifactForViewV1(artifact);
  if (
    artifact.interpretation.operationalEmaxEstablished ||
    artifact.interpretation.genericPvaEstablished ||
    artifact.interpretation.productionOutputEstablished
  ) {
    throw new Error("phase-wise PVA research view cannot promote claims");
  }
  const rows = PVA_RESEARCH_VENTRICLE_IDS_V1.map((ventricleId) => {
    const candidate = artifact.candidates.find(
      (value) => value.ventricleId === ventricleId,
    );
    const pva = artifact.baselinePva.find(
      (value) => value.ventricleId === ventricleId,
    );
    if (candidate === undefined || pva === undefined) {
      throw new Error(`phase-wise PVA row is missing for ${ventricleId}`);
    }
    const phaseFits = artifact.phaseFits.filter(
      (fit) => fit.ventricleId === ventricleId,
    );
    const slopeByDirection = (directionId: "occlusion" | "release") =>
      Object.freeze(
        phaseFits
          .filter((fit) => fit.directionId === directionId)
          .sort((left, right) => left.phaseIndex - right.phaseIndex)
          .map((fit) => fit.relation.slopeMmHgPerMl),
      );
    return Object.freeze({
      ventricleId,
      selectedPhaseIndex: candidate.selectedPhaseIndex,
      selectedPhase01: candidate.selectedPhase01,
      elastanceMmHgPerMl: candidate.selectedRelation.slopeMmHgPerMl,
      volumeAxisInterceptMl: candidate.selectedRelation.volumeAxisInterceptMl,
      rSquared: candidate.selectedRelation.rSquared,
      rootMeanSquaredResidualMmHg:
        candidate.selectedRootMeanSquaredResidualMmHg,
      measuredVolumeSpanMl: candidate.selectedMeasuredVolumeSpanMl,
      releaseSlopeDifferenceFraction:
        candidate.releaseAtSelectedPhase.releaseMinusOcclusionSlopeMmHgPerMl /
        candidate.selectedRelation.slopeMmHgPerMl,
      releasePeakPhaseIndex: candidate.releasePeak.phaseIndex,
      leaveOneOutStable:
        candidate.leaveOneBeatOut.allSelectedPhasesWithinOneSampleOfFullFit,
      leaveOneOutPhaseRange: Object.freeze([
        candidate.leaveOneBeatOut.minimumSelectedPhaseIndex,
        candidate.leaveOneBeatOut.maximumSelectedPhaseIndex,
      ] as const),
      status: pva.status,
      periodicExternalWorkJ: pva.periodicExternalWorkJ,
      potentialEnergyJ: pva.reportedPotentialEnergyJ,
      pressureVolumeAreaJ: pva.reportedPressureVolumeAreaJ,
      observedDomainAreaStripJ: pva.observedDomainAreaStripJ,
      extrapolationFraction: pva.systolicLineAreaOutsideMeasuredRangeFraction,
      supportedIntersectionEstablished:
        pva.supportedIntersectionVolumeMl !== null,
      reasons: Object.freeze([...pva.reasons]),
      occlusionSlopeByPhase: slopeByDirection("occlusion"),
      releaseSlopeByPhase: slopeByDirection("release"),
    });
  });
  return Object.freeze({
    studyId: artifact.studyId,
    pressureBasis: artifact.pressureBasis,
    rows: Object.freeze(rows),
    operationalEmaxEstablished: false,
    genericPvaEstablished: false,
    productDisplayReady: false,
  });
}

/**
 * Presentation-only projection of the checked-in V2 result. It deliberately
 * carries no model runner, qualification, admission, or artifact-writing seam.
 */
export function projectPvaResearchDatasetV1(
  artifact: PvaGeometryDomainArtifactInputV2,
): PvaResearchDatasetV1 {
  assertGeometryArtifactForViewV1(artifact);
  if (
    artifact.interpretation.existingAbsolutePvaReadyForProductDisplay ||
    artifact.interpretation.genericPvaEstablished
  ) {
    throw new Error(
      "PVA research view cannot project a product-qualified claim",
    );
  }
  const workByBeat = new Map(
    artifact.beatWorkDiagnostics.map((work) => [
      beatKeyV1(work.ventricleId, work.beatOrdinal),
      work,
    ]),
  );
  const rows = artifact.rows
    .map((row): PvaResearchRowV1 => {
      const work = workByBeat.get(beatKeyV1(row.ventricleId, row.beatOrdinal));
      if (work === undefined) {
        throw new Error("PVA research projection requires retained beat work");
      }
      const references =
        row.status === "diagnosed"
          ? Object.freeze({
              "dynamic-maximum-volume": referenceResultV1(
                row.dynamicMaximumVolume,
              ),
              "intrinsic-passive-center-slice": referenceResultV1(
                row.intrinsicPassiveCenterSlice,
              ),
            })
          : Object.freeze({
              "dynamic-maximum-volume": unavailableReferenceV1(row.reason),
              "intrinsic-passive-center-slice": unavailableReferenceV1(
                row.reason,
              ),
            });
      return Object.freeze({
        rowId: [
          row.ventricleId,
          row.beatOrdinal,
          row.directionId,
          row.systolicMethodId,
        ].join(":"),
        ventricleId: row.ventricleId,
        beatOrdinal: row.beatOrdinal,
        directionId: row.directionId,
        systolicMethodId: row.systolicMethodId,
        acceptedOpenPathJ: work.acceptedOpenPathJ,
        syntheticStraightClosureJ: work.syntheticStraightClosureJ,
        syntheticClosureFraction:
          work.syntheticClosureAbsoluteFractionOfAcceptedOpenPath,
        exactlyClosedByRetainedEndpoints: work.exactlyClosedByRetainedEndpoints,
        systolicLineOutsideMeasuredRangeFraction:
          row.status === "diagnosed"
            ? row.systolicGeometry.lineAreaOutsideMeasuredVolumeRangeFraction
            : null,
        references,
      });
    })
    .sort(compareResearchRowsV1);
  const referenceSummaries = PVA_RESEARCH_REFERENCE_IDS_V1.map(
    (referenceId) => {
      const displayed = rows.map((row) =>
        Object.freeze({
          ...row,
          referenceId,
          reference: row.references[referenceId],
        }),
      );
      return Object.freeze({
        referenceId,
        counts: summarizePvaResearchRowsV1(displayed),
        observedDomainAreaStripRowCount: displayed.filter(
          ({ reference }) => reference.observedDomainAreaJ !== null,
        ).length,
        supportedIntersectionRowCount: displayed.filter(
          ({ reference }) => reference.supportedIntersectionEstablished,
        ).length,
      });
    },
  );
  const closureFractions = artifact.beatWorkDiagnostics.flatMap(
    ({ syntheticClosureAbsoluteFractionOfAcceptedOpenPath }) =>
      syntheticClosureAbsoluteFractionOfAcceptedOpenPath === null
        ? []
        : [syntheticClosureAbsoluteFractionOfAcceptedOpenPath],
  );
  const extrapolationFractions = rows.flatMap(
    ({ systolicLineOutsideMeasuredRangeFraction }) =>
      systolicLineOutsideMeasuredRangeFraction === null
        ? []
        : [systolicLineOutsideMeasuredRangeFraction],
  );

  return Object.freeze({
    studyId: artifact.studyId,
    pressureBasis: artifact.pressureBasis,
    attemptedRowCount: rows.length,
    sourceAvailableRowCount: artifact.rows.filter(
      ({ status }) => status === "diagnosed",
    ).length,
    sourceUnavailableRowCount: artifact.rows.filter(
      ({ status }) => status === "method-unavailable",
    ).length,
    uniqueBeatWorkCount: workByBeat.size,
    exactlyClosedBeatWorkCount: artifact.beatWorkDiagnostics.filter(
      ({ exactlyClosedByRetainedEndpoints }) =>
        exactlyClosedByRetainedEndpoints,
    ).length,
    domainSupportedRowCount: rows.filter((row) =>
      PVA_RESEARCH_REFERENCE_IDS_V1.some(
        (referenceId) =>
          row.references[referenceId].classification === "domain-supported-pva",
      ),
    ).length,
    closureFraction: summarizeClosureFractionsV1(closureFractions),
    systolicExtrapolationFraction: summarizeExtrapolationFractionsV1(
      extrapolationFractions,
    ),
    referenceSummaries: Object.freeze(referenceSummaries),
    rows: Object.freeze(rows),
    productDisplayReady: false,
    genericPvaEstablished: false,
  });
}

export function filterPvaResearchRowsV1(
  dataset: PvaResearchDatasetV1,
  filters: PvaResearchFiltersV1,
): readonly PvaResearchDisplayRowV1[] {
  return Object.freeze(
    dataset.rows.flatMap((row) => {
      const reference = row.references[filters.referenceId];
      if (
        filters.ventricleId !== "all" &&
        row.ventricleId !== filters.ventricleId
      )
        return [];
      if (
        filters.systolicMethodId !== "all" &&
        row.systolicMethodId !== filters.systolicMethodId
      )
        return [];
      if (
        filters.classification !== "all" &&
        reference.classification !== filters.classification
      )
        return [];
      return [
        Object.freeze({
          ...row,
          referenceId: filters.referenceId,
          reference,
        }),
      ];
    }),
  );
}

export function summarizePvaResearchRowsV1(
  rows: readonly PvaResearchDisplayRowV1[],
): Readonly<Record<PvaResearchClassificationV1, number>> {
  const counts: Record<PvaResearchClassificationV1, number> = {
    "domain-supported-pva": 0,
    "transient-pva-like-area": 0,
    "out-of-domain": 0,
    "relation-inadmissible": 0,
    "method-unavailable": 0,
  };
  for (const row of rows) counts[row.reference.classification] += 1;
  return Object.freeze(counts);
}

function referenceResultV1(
  input: PvaGeometryReferenceDiagnosticInputV2,
): PvaResearchReferenceResultV1 {
  return Object.freeze({
    classification: input.classification,
    endpointDomainStatus: input.endpointDomainStatus,
    supportedIntersectionEstablished:
      input.supportedIntersectionVolumeMl !== null,
    observedDomainAreaJ:
      input.observedDomainAreaStrip?.signedSystolicMinusPassiveAreaJ ?? null,
    observedDomainVolumeRangeMl:
      input.observedDomainAreaStrip === null
        ? null
        : Object.freeze([
            input.observedDomainAreaStrip.lowerVolumeMl,
            input.observedDomainAreaStrip.upperVolumeMl,
          ] as const),
    supportedVolumeRangeMl: Object.freeze([
      input.supportedVolumeRangeMl[0],
      input.supportedVolumeRangeMl[1],
    ] as const),
    reasons: Object.freeze(input.reasons.map(reasonIdV1)),
  });
}

function unavailableReferenceV1(reason: string): PvaResearchReferenceResultV1 {
  const reasonId = reasonIdV1(reason);
  return Object.freeze({
    classification:
      reasonId === "systolic-relation-nonpositive-slope"
        ? "relation-inadmissible"
        : "method-unavailable",
    endpointDomainStatus: null,
    supportedIntersectionEstablished: false,
    observedDomainAreaJ: null,
    observedDomainVolumeRangeMl: null,
    supportedVolumeRangeMl: null,
    reasons: Object.freeze([reasonId]),
  });
}

function reasonIdV1(reason: string): PvaResearchReasonIdV1 {
  const reasonId = PVA_REASON_ID_BY_MESSAGE_V1[reason];
  if (reasonId === undefined)
    throw new Error(`PVA research view does not recognize reason: ${reason}`);
  return reasonId;
}

function summarizeClosureFractionsV1(values: readonly number[]) {
  const summary = numericSummaryV1(values, "synthetic closure fraction");
  return Object.freeze({
    ...summary,
    aboveOnePercentCount: values.filter((value) => value > 0.01).length,
    aboveFivePercentCount: values.filter((value) => value > 0.05).length,
  });
}

function summarizeExtrapolationFractionsV1(values: readonly number[]) {
  const summary = numericSummaryV1(values, "systolic extrapolation fraction");
  return Object.freeze({
    ...summary,
    aboveHalfCount: values.filter((value) => value > 0.5).length,
    aboveThreeQuartersCount: values.filter((value) => value > 0.75).length,
  });
}

function numericSummaryV1(values: readonly number[], label: string) {
  if (values.length === 0) throw new Error(`${label} is empty`);
  for (const value of values)
    if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 1
      ? sorted[middle]!
      : 0.5 * (sorted[middle - 1]! + sorted[middle]!);
  return Object.freeze({
    minimum: sorted[0]!,
    median,
    maximum: sorted[sorted.length - 1]!,
  });
}

function assertGeometryArtifactForViewV1(
  artifact: PvaGeometryDomainArtifactInputV2,
): void {
  if (
    artifact.studyId !==
      "main-wire-integrated-model-pva-geometry-domain-diagnostics-v2" ||
    artifact.status !== "completed" ||
    artifact.scope !== "research-only-pva-geometry-and-domain-diagnostics" ||
    artifact.pressureBasis !== "ventricular-transmural"
  ) {
    throw new Error(
      "PVA research view requires the completed V2 geometry result",
    );
  }
  if (
    artifact.beatWorkDiagnostics.length !== 42 ||
    artifact.rows.length !== 168
  ) {
    throw new Error(
      "PVA research view received an incomplete V2 geometry result",
    );
  }
  assertFiniteNumericLeavesForViewV1(artifact, "PVA geometry artifact");
  const workKeys = new Set<string>();
  for (const work of artifact.beatWorkDiagnostics) {
    if (
      !PVA_RESEARCH_VENTRICLE_IDS_V1.includes(work.ventricleId) ||
      !Number.isSafeInteger(work.beatOrdinal) ||
      work.beatOrdinal < 1 ||
      work.beatOrdinal > 21
    )
      throw new Error("retained beat work has an invalid identity");
    const key = beatKeyV1(work.ventricleId, work.beatOrdinal);
    if (workKeys.has(key))
      throw new Error(`duplicate retained beat work ${key}`);
    workKeys.add(key);
  }
  const rowKeys = new Set<string>();
  for (const row of artifact.rows) {
    if (
      !PVA_RESEARCH_VENTRICLE_IDS_V1.includes(row.ventricleId) ||
      !PVA_RESEARCH_METHOD_IDS_V1.includes(row.systolicMethodId) ||
      (row.directionId !== "occlusion" && row.directionId !== "release")
    )
      throw new Error("PVA geometry row has an invalid identity");
    const key = [
      row.ventricleId,
      row.beatOrdinal,
      row.directionId,
      row.systolicMethodId,
    ].join(":");
    if (rowKeys.has(key)) throw new Error(`duplicate PVA geometry row ${key}`);
    if (!workKeys.has(beatKeyV1(row.ventricleId, row.beatOrdinal)))
      throw new Error("PVA geometry row is missing its retained beat work");
    rowKeys.add(key);
    if (row.status === "method-unavailable") {
      reasonIdV1(row.reason);
      continue;
    }
    for (const reference of [
      row.dynamicMaximumVolume,
      row.intrinsicPassiveCenterSlice,
    ]) {
      for (const reason of reference.reasons) reasonIdV1(reason);
      if (
        !(
          reference.supportedVolumeRangeMl[1] >
          reference.supportedVolumeRangeMl[0]
        )
      )
        throw new Error("supported volume range is invalid");
    }
  }
}

function assertPhaseWiseArtifactForViewV1(
  artifact: PvaPhaseWiseEmaxArtifactInputV1,
): void {
  if (
    artifact.studyId !==
      "main-wire-integrated-model-phase-wise-emax-baseline-pva-research-v1" ||
    artifact.status !== "completed" ||
    artifact.scope !== "research-only-phase-wise-emax-and-baseline-pva" ||
    artifact.pressureBasis !== "ventricular-transmural" ||
    typeof artifact.interpretation
      .transientPeriodicSourceCompatibilityEstablished !== "boolean" ||
    artifact.interpretation.allPvaSourceIdentityEstablished
  ) {
    throw new Error(
      "phase-wise PVA view requires the completed research artifact",
    );
  }
  if (
    artifact.phaseFits.length + artifact.phaseFitFailures.length !== 256 ||
    artifact.candidates.length !== 2 ||
    artifact.baselinePva.length !== 2 ||
    artifact.summary.phaseFitCount !== artifact.phaseFits.length ||
    artifact.summary.phaseFitFailureCount !==
      artifact.phaseFitFailures.length ||
    artifact.summary.candidateCount !== 2
  ) {
    throw new Error("phase-wise PVA artifact has an incomplete result shape");
  }
  assertFiniteNumericLeavesForViewV1(artifact, "phase-wise PVA artifact");
  const fitKeys = new Set<string>();
  for (const fit of artifact.phaseFits) {
    if (!PVA_RESEARCH_VENTRICLE_IDS_V1.includes(fit.ventricleId))
      throw new Error("phase-wise fit has an unknown ventricle");
    if (fit.directionId !== "occlusion" && fit.directionId !== "release")
      throw new Error("phase-wise fit has an unknown direction");
    if (
      !Number.isSafeInteger(fit.phaseIndex) ||
      fit.phaseIndex < 0 ||
      fit.phaseIndex >= 64 ||
      fit.phase01 !== fit.phaseIndex / 64
    ) {
      throw new Error("phase-wise fit has an invalid retained phase");
    }
    const key = `${fit.ventricleId}:${fit.directionId}:${fit.phaseIndex}`;
    if (fitKeys.has(key)) throw new Error(`duplicate phase-wise fit ${key}`);
    fitKeys.add(key);
  }
  for (const ventricleId of PVA_RESEARCH_VENTRICLE_IDS_V1) {
    const candidates = artifact.candidates.filter(
      (candidate) => candidate.ventricleId === ventricleId,
    );
    const pvaRows = artifact.baselinePva.filter(
      (pva) => pva.ventricleId === ventricleId,
    );
    if (candidates.length !== 1 || pvaRows.length !== 1)
      throw new Error(`phase-wise artifact has duplicate ${ventricleId} rows`);
    const candidate = candidates[0]!;
    const selectedFit = artifact.phaseFits.find(
      (fit) =>
        fit.ventricleId === ventricleId &&
        fit.directionId === "occlusion" &&
        fit.phaseIndex === candidate.selectedPhaseIndex,
    );
    if (
      selectedFit === undefined ||
      candidate.selectedPhase01 !== candidate.selectedPhaseIndex / 64 ||
      candidate.selectedRelation.slopeMmHgPerMl !==
        selectedFit.relation.slopeMmHgPerMl ||
      candidate.selectedRelation.volumeAxisInterceptMl !==
        selectedFit.relation.volumeAxisInterceptMl
    ) {
      throw new Error("phase-wise candidate does not bind its selected fit");
    }
    const pva = pvaRows[0]!;
    if (
      pva.status !== "domain-supported-baseline-pva" &&
      pva.status !== "extrapolation-dependent-baseline-pva" &&
      pva.status !== "unavailable"
    ) {
      throw new Error("phase-wise PVA row has an unknown status");
    }
  }
  const supported = artifact.baselinePva.filter(
    ({ status }) => status === "domain-supported-baseline-pva",
  ).length;
  const extrapolated = artifact.baselinePva.filter(
    ({ status }) => status === "extrapolation-dependent-baseline-pva",
  ).length;
  const unavailable = artifact.baselinePva.length - supported - extrapolated;
  if (
    artifact.summary.domainSupportedBaselinePvaCount !== supported ||
    artifact.summary.extrapolationDependentBaselinePvaCount !== extrapolated ||
    artifact.summary.unavailableBaselinePvaCount !== unavailable
  ) {
    throw new Error("phase-wise PVA summary does not match retained rows");
  }
}

function assertFiniteNumericLeavesForViewV1(
  value: unknown,
  label: string,
): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) assertFiniteNumericLeavesForViewV1(item, label);
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const item of Object.values(value))
      assertFiniteNumericLeavesForViewV1(item, label);
  }
}

function beatKeyV1(
  ventricleId: PvaResearchVentricleIdV1,
  beatOrdinal: number,
): string {
  return `${ventricleId}:${beatOrdinal}`;
}

function compareResearchRowsV1(
  left: PvaResearchRowV1,
  right: PvaResearchRowV1,
): number {
  return (
    left.beatOrdinal - right.beatOrdinal ||
    PVA_RESEARCH_VENTRICLE_IDS_V1.indexOf(left.ventricleId) -
      PVA_RESEARCH_VENTRICLE_IDS_V1.indexOf(right.ventricleId) ||
    PVA_RESEARCH_METHOD_IDS_V1.indexOf(left.systolicMethodId) -
      PVA_RESEARCH_METHOD_IDS_V1.indexOf(right.systolicMethodId)
  );
}
