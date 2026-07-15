import {
  assertCanonicalSha256,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_PRESSURE_ATTRIBUTION_MANIFEST_V1_ID =
  "phase-b1-paired-atrial-matched-volume-pressure-attribution-manifest-v1" as const;

export const PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_PRESSURE_ATTRIBUTION_ARTIFACT_V1_ID =
  "phase-b1-paired-atrial-matched-volume-pressure-attribution-artifact-v1" as const;

export const PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_MODE_ORDER_V1 =
  Object.freeze(["off", "on"] as const);

export const PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_ATRIUM_ORDER_V1 =
  Object.freeze(["LA", "RA"] as const);

export const PHASE_B1_PAIRED_ATRIAL_PRESSURE_OWNER_ORDER_V1 = Object.freeze([
  "equilibriumPassive",
  "activeLand",
  "slsOverstress",
  "commonExternal",
] as const);

export type PhaseB1PairedAtrialMatchedVolumeModeV1 =
  (typeof PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_MODE_ORDER_V1)[number];

export type PhaseB1PairedAtrialMatchedVolumeAtriumV1 =
  (typeof PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_ATRIUM_ORDER_V1)[number];

export type PhaseB1PairedAtrialPressureOwnerV1 =
  (typeof PHASE_B1_PAIRED_ATRIAL_PRESSURE_OWNER_ORDER_V1)[number];

export type PhaseB1AtrialPhaseRoleV1 =
  | "reservoir"
  | "conduit"
  | "pump"
  | "other";

export type PhaseB1AtrialExpectedVolumeDirectionV1 =
  | "increasing"
  | "decreasing"
  | "either";

export type PhaseB1AtrialObservedVolumeDirectionV1 =
  Exclude<PhaseB1AtrialExpectedVolumeDirectionV1, "either">;

export type PhaseB1AtrialMatchedVolumeStatusV1 =
  | "matched"
  | "insufficient-samples"
  | "ambiguous"
  | "no-overlap";

export type PhaseB1AtrialMatchedVolumeReasonV1 =
  | "off-insufficient-samples"
  | "on-insufficient-samples"
  | "off-volume-not-strict-monotone"
  | "on-volume-not-strict-monotone"
  | "off-volume-direction-mismatch"
  | "on-volume-direction-mismatch"
  | "no-common-volume-overlap";

export type PhaseB1AtrialPressureComponentsPaV1 = Readonly<Record<
  PhaseB1PairedAtrialPressureOwnerV1,
  number
>>;

export type PhaseB1AtrialPressureAttributionSampleV1 = Readonly<{
  phaseSec: number;
  volumeM3: number;
  totalAbsolutePressurePa: number;
  pressureComponentsPa: PhaseB1AtrialPressureComponentsPaV1;
}>;

export type PhaseB1AtrialPhaseBoundaryResolutionV1 =
  | Readonly<{
    status: "resolved";
    startPhaseSec: number;
    endPhaseSec: number;
    reason: null;
  }>
  | Readonly<{
    status: "unresolved";
    startPhaseSec: null;
    endPhaseSec: null;
    reason: string;
  }>;

export type PhaseB1AtrialMatchedVolumePhaseWindowV1 = Readonly<{
  phaseId: string;
  role: PhaseB1AtrialPhaseRoleV1;
  startBoundary: string;
  endBoundary: string;
  expectedVolumeDirection: PhaseB1AtrialExpectedVolumeDirectionV1;
}>;

export type PhaseB1AtrialPressurePhaseSeriesV1 = Readonly<{
  phaseId: string;
  startBoundary: string;
  endBoundary: string;
  boundaryResolution: PhaseB1AtrialPhaseBoundaryResolutionV1;
  samples: readonly PhaseB1AtrialPressureAttributionSampleV1[];
}>;

export type PhaseB1PairedAtrialPressureSeriesByModeV1 = Readonly<Record<
  PhaseB1PairedAtrialMatchedVolumeModeV1,
  Readonly<Record<
    PhaseB1PairedAtrialMatchedVolumeAtriumV1,
    readonly PhaseB1AtrialPressurePhaseSeriesV1[]
  >>
>>;

export type PhaseB1MatchedVolumeSourceProvenanceReferenceV1 = Readonly<{
  sourceArtifactId: string;
  sourceContentSha256: string;
}>;

export type PhaseB1MatchedVolumeSourceProvenanceByModeV1 = Readonly<Record<
  PhaseB1PairedAtrialMatchedVolumeModeV1,
  PhaseB1MatchedVolumeSourceProvenanceReferenceV1
>>;

const ANALYSIS_POLICY = deepFreeze({
  interpolation: "piecewise-linear-on-strict-monotone-volume-branch" as const,
  commonVolumeGrid: "fixed-uniform-normalized-grid-including-overlap-endpoints" as const,
  deltaConvention: "on-minus-off" as const,
  minimumSamplesPerBranch: 2 as const,
  pressureOwnerOrder: PHASE_B1_PAIRED_ATRIAL_PRESSURE_OWNER_ORDER_V1,
  pressureDeltaSignUsedAsAcceptanceGate: false as const,
  pvTopologyUsedAsAcceptanceGate: false as const,
  slsOffFigureEightTopologyRequired: false as const,
  serializedReconstructionIsAuthentication: false as const,
});

const CLAIM_BOUNDARY = deepFreeze({
  matchedVolumePressureAttributionIncluded: true as const,
  sourceProvenanceReferencesRecorded: true as const,
  sourceObservationsAuthenticatedByThisModule: false as const,
  serializedRoundTripIsAuthentication: false as const,
  upstreamObservationAuthenticationMustBeEstablishedSeparately: true as const,
  pressureComponentOwnershipEstablishedByCaller: true as const,
  pressureDeltaSignUsedAsAcceptanceGate: false as const,
  pvTopologyUsedAsAcceptanceGate: false as const,
  slsOffFigureEightTopologyRequired: false as const,
  slsCausalityEstablished: false as const,
  physiologicalValidationEstablished: false as const,
  phaseB1AcceptanceEstablished: false as const,
  modelCoreOrBrowserRuntimeAdopted: false as const,
  releaseRuntimeReachable: false as const,
  testOnly: true as const,
});

export type PhaseB1PairedAtrialMatchedVolumePressureAttributionManifestPayloadV1 =
  Readonly<{
    manifestId:
      typeof PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_PRESSURE_ATTRIBUTION_MANIFEST_V1_ID;
    modeOrder: typeof PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_MODE_ORDER_V1;
    atriumOrder: typeof PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_ATRIUM_ORDER_V1;
    phaseWindows: readonly PhaseB1AtrialMatchedVolumePhaseWindowV1[];
    normalizedGridPointCount: number;
    reconstructionAbsoluteTolerancePa: number;
    reconstructionRelativeTolerance: number;
    analysisPolicy: typeof ANALYSIS_POLICY;
    claimBoundary: typeof CLAIM_BOUNDARY;
    hashAlgorithm: "sha256-canonical-json-v1";
    testOnly: true;
  }>;

export type PhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1 =
  PhaseB1PairedAtrialMatchedVolumePressureAttributionManifestPayloadV1 &
  Readonly<{ contentSha256: string }>;

export type PhaseB1AtrialBranchAuditV1 = Readonly<{
  sampleCount: number;
  observedVolumeDirection: PhaseB1AtrialObservedVolumeDirectionV1 | null;
  strictlyMonotone: boolean;
  expectedDirectionSatisfied: boolean;
  minimumVolumeM3: number | null;
  maximumVolumeM3: number | null;
  maximumAbsoluteSourceReconstructionResidualPa: number | null;
  sourceReconstructionPass: boolean;
}>;

export type PhaseB1AtrialInterpolatedPressureV1 = Readonly<{
  phaseSec: number;
  totalAbsolutePressurePa: number;
  pressureComponentsPa: PhaseB1AtrialPressureComponentsPaV1;
  componentSumPa: number;
  reconstructionResidualPa: number;
}>;

export type PhaseB1AtrialMatchedVolumeGridPointV1 = Readonly<{
  normalizedCommonVolume01: number;
  volumeM3: number;
  byMode: Readonly<Record<
    PhaseB1PairedAtrialMatchedVolumeModeV1,
    PhaseB1AtrialInterpolatedPressureV1
  >>;
  deltaTotalAbsolutePressurePa: number;
  deltaPressurePaByOwner: PhaseB1AtrialPressureComponentsPaV1;
  deltaComponentSumPa: number;
  deltaReconstructionResidualPa: number;
}>;

export type PhaseB1AtrialMatchedVolumePhaseAttributionV1 = Readonly<{
  phaseId: string;
  role: PhaseB1AtrialPhaseRoleV1;
  startBoundary: string;
  endBoundary: string;
  measuredWindowByMode: Readonly<Record<
    PhaseB1PairedAtrialMatchedVolumeModeV1,
    PhaseB1AtrialPhaseBoundaryResolutionV1
  >>;
  status: PhaseB1AtrialMatchedVolumeStatusV1;
  reasons: readonly PhaseB1AtrialMatchedVolumeReasonV1[];
  branchByMode: Readonly<Record<
    PhaseB1PairedAtrialMatchedVolumeModeV1,
    PhaseB1AtrialBranchAuditV1
  >>;
  commonVolumeOverlapM3: Readonly<{ minimum: number; maximum: number }> | null;
  matchedGrid: readonly PhaseB1AtrialMatchedVolumeGridPointV1[];
  reconstructionAudit: Readonly<{
    maximumAbsoluteMatchedResidualPaByMode: Readonly<Record<
      PhaseB1PairedAtrialMatchedVolumeModeV1,
      number | null
    >>;
    maximumAbsoluteDeltaResidualPa: number | null;
    sourceAndMatchedReconstructionPass: boolean;
  }>;
  mathematicalIntegrityGatePass: boolean;
  pressureDeltaSignUsedAsAcceptanceGate: false;
  pvTopologyUsedAsAcceptanceGate: false;
}>;

export type PhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactPayloadV1 =
  Readonly<{
    artifactId:
      typeof PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_PRESSURE_ATTRIBUTION_ARTIFACT_V1_ID;
    status: "matched-volume-attribution-report";
    analysisManifestContentSha256: string;
    analyzedSeriesContentSha256: string;
    sourceProvenanceByMode: PhaseB1MatchedVolumeSourceProvenanceByModeV1;
    sourceProvenanceAuthenticationStatus: "unverified-reference-only";
    modeOrder: typeof PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_MODE_ORDER_V1;
    atriumOrder: typeof PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_ATRIUM_ORDER_V1;
    attributionByAtrium: Readonly<Record<
      PhaseB1PairedAtrialMatchedVolumeAtriumV1,
      readonly PhaseB1AtrialMatchedVolumePhaseAttributionV1[]
    >>;
    gateAudit: Readonly<{
      inputInventoryComplete: true;
      allInputValuesFinite: true;
      allRequiredBranchesSufficient: boolean;
      allRequiredBranchesStrictlyMonotone: boolean;
      allExpectedVolumeDirectionsSatisfied: boolean;
      allRequiredPhasesHaveCommonVolumeOverlap: boolean;
      allPressureReconstructionsPass: boolean;
      artifactIntegrityGatePass: boolean;
      pressureDeltaSignUsedAsAcceptanceGate: false;
      pvTopologyUsedAsAcceptanceGate: false;
    }>;
    claimBoundary: typeof CLAIM_BOUNDARY;
    slsCausalityEstablished: false;
    physiologicalValidationPass: false;
    phaseB1AcceptancePass: false;
    hashAlgorithm: "sha256-canonical-json-v1";
    testOnly: true;
  }>;

export type PhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1 =
  PhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactPayloadV1 &
  Readonly<{ contentSha256: string }>;

export function buildPhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1(
  input: Readonly<{
    phaseWindows: readonly PhaseB1AtrialMatchedVolumePhaseWindowV1[];
    normalizedGridPointCount: number;
    reconstructionAbsoluteTolerancePa: number;
    reconstructionRelativeTolerance: number;
    sha256Hex: CanonicalSha256HexProvider;
  }>,
): PhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1 {
  assertExactPlainRecordV1(input, [
    "phaseWindows",
    "normalizedGridPointCount",
    "reconstructionAbsoluteTolerancePa",
    "reconstructionRelativeTolerance",
    "sha256Hex",
  ], "matched-volume attribution manifest input");
  requireSha256Provider(input.sha256Hex);
  const phaseWindows = validateAndCopyPhaseWindows(input.phaseWindows);
  const normalizedGridPointCount = requireIntegerAtLeast(
    input.normalizedGridPointCount,
    2,
    "normalizedGridPointCount",
  );
  const reconstructionAbsoluteTolerancePa = requireNonnegativeFinite(
    input.reconstructionAbsoluteTolerancePa,
    "reconstructionAbsoluteTolerancePa",
  );
  const reconstructionRelativeTolerance = requireNonnegativeFinite(
    input.reconstructionRelativeTolerance,
    "reconstructionRelativeTolerance",
  );
  const payload = deepFreeze<
    PhaseB1PairedAtrialMatchedVolumePressureAttributionManifestPayloadV1
  >({
    manifestId:
      PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_PRESSURE_ATTRIBUTION_MANIFEST_V1_ID,
    modeOrder: PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_MODE_ORDER_V1,
    atriumOrder: PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_ATRIUM_ORDER_V1,
    phaseWindows,
    normalizedGridPointCount,
    reconstructionAbsoluteTolerancePa,
    reconstructionRelativeTolerance,
    analysisPolicy: ANALYSIS_POLICY,
    claimBoundary: CLAIM_BOUNDARY,
    hashAlgorithm: "sha256-canonical-json-v1",
    testOnly: true,
  });
  return deepFreeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
  });
}

export function validatePhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1(
  value: PhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1 {
  requireSha256Provider(sha256Hex);
  if (
    value === null
    || typeof value !== "object"
    || value.manifestId
      !== PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_PRESSURE_ATTRIBUTION_MANIFEST_V1_ID
    || value.modeOrder.join(",") !== "off,on"
    || value.atriumOrder.join(",") !== "LA,RA"
    || value.analysisPolicy.interpolation
      !== "piecewise-linear-on-strict-monotone-volume-branch"
    || value.analysisPolicy.commonVolumeGrid
      !== "fixed-uniform-normalized-grid-including-overlap-endpoints"
    || value.analysisPolicy.deltaConvention !== "on-minus-off"
    || value.analysisPolicy.minimumSamplesPerBranch !== 2
    || value.analysisPolicy.slsOffFigureEightTopologyRequired !== false
    || value.analysisPolicy.pressureDeltaSignUsedAsAcceptanceGate !== false
    || value.analysisPolicy.pvTopologyUsedAsAcceptanceGate !== false
    || value.analysisPolicy.serializedReconstructionIsAuthentication !== false
    || value.claimBoundary.sourceObservationsAuthenticatedByThisModule !== false
    || value.claimBoundary.serializedRoundTripIsAuthentication !== false
    || value.claimBoundary.slsOffFigureEightTopologyRequired !== false
    || value.claimBoundary.pressureDeltaSignUsedAsAcceptanceGate !== false
    || value.claimBoundary.pvTopologyUsedAsAcceptanceGate !== false
  ) throw new Error("matched-volume attribution manifest identity or policy drifted");
  validateAndCopyPhaseWindows(value.phaseWindows);
  requireIntegerAtLeast(value.normalizedGridPointCount, 2, "normalizedGridPointCount");
  requireNonnegativeFinite(
    value.reconstructionAbsoluteTolerancePa,
    "reconstructionAbsoluteTolerancePa",
  );
  requireNonnegativeFinite(
    value.reconstructionRelativeTolerance,
    "reconstructionRelativeTolerance",
  );
  const { contentSha256, ...payload } = value;
  assertCanonicalSha256(payload, contentSha256, sha256Hex);
  return value;
}

export function buildPhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1(
  input: Readonly<{
    analysisManifest:
      PhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1;
    sourceProvenanceByMode: PhaseB1MatchedVolumeSourceProvenanceByModeV1;
    seriesByMode: PhaseB1PairedAtrialPressureSeriesByModeV1;
    sha256Hex: CanonicalSha256HexProvider;
  }>,
): PhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1 {
  assertExactPlainRecordV1(input, [
    "analysisManifest",
    "sourceProvenanceByMode",
    "seriesByMode",
    "sha256Hex",
  ], "matched-volume attribution artifact input");
  const manifest =
    validatePhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1(
      input.analysisManifest,
      input.sha256Hex,
    );
  const sourceProvenanceByMode = validateAndCopySourceProvenance(
    input.sourceProvenanceByMode,
  );
  const seriesByMode = validateAndCopySeries(input.seriesByMode, manifest);
  const attributionByAtrium = mapAtriumRecord((atriumId) =>
    Object.freeze(manifest.phaseWindows.map((window, phaseIndex) =>
      analyzePhase(
        window,
        seriesByMode.off[atriumId][phaseIndex],
        seriesByMode.on[atriumId][phaseIndex],
        manifest,
      ))));
  const all = PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_ATRIUM_ORDER_V1.flatMap(
    (atriumId) => attributionByAtrium[atriumId],
  );
  const allRequiredBranchesSufficient = all.every((phase) =>
    PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_MODE_ORDER_V1.every(
      (mode) => phase.branchByMode[mode].sampleCount >= 2,
    ));
  const allRequiredBranchesStrictlyMonotone = all.every((phase) =>
    PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_MODE_ORDER_V1.every(
      (mode) => phase.branchByMode[mode].strictlyMonotone,
    ));
  const allExpectedVolumeDirectionsSatisfied = all.every((phase) =>
    PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_MODE_ORDER_V1.every(
      (mode) => phase.branchByMode[mode].expectedDirectionSatisfied,
    ));
  const allRequiredPhasesHaveCommonVolumeOverlap = all.every((phase) =>
    phase.status === "matched");
  const allPressureReconstructionsPass = all.every((phase) =>
    phase.reconstructionAudit.sourceAndMatchedReconstructionPass);
  const artifactIntegrityGatePass =
    allRequiredBranchesSufficient
    && allRequiredBranchesStrictlyMonotone
    && allExpectedVolumeDirectionsSatisfied
    && allRequiredPhasesHaveCommonVolumeOverlap
    && allPressureReconstructionsPass;
  const payload = deepFreeze<
    PhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactPayloadV1
  >({
    artifactId:
      PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_PRESSURE_ATTRIBUTION_ARTIFACT_V1_ID,
    status: "matched-volume-attribution-report",
    analysisManifestContentSha256: manifest.contentSha256,
    analyzedSeriesContentSha256: computeCanonicalSha256(
      seriesByMode,
      input.sha256Hex,
    ),
    sourceProvenanceByMode,
    sourceProvenanceAuthenticationStatus: "unverified-reference-only",
    modeOrder: PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_MODE_ORDER_V1,
    atriumOrder: PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_ATRIUM_ORDER_V1,
    attributionByAtrium,
    gateAudit: {
      inputInventoryComplete: true,
      allInputValuesFinite: true,
      allRequiredBranchesSufficient,
      allRequiredBranchesStrictlyMonotone,
      allExpectedVolumeDirectionsSatisfied,
      allRequiredPhasesHaveCommonVolumeOverlap,
      allPressureReconstructionsPass,
      artifactIntegrityGatePass,
      pressureDeltaSignUsedAsAcceptanceGate: false,
      pvTopologyUsedAsAcceptanceGate: false,
    },
    claimBoundary: CLAIM_BOUNDARY,
    slsCausalityEstablished: false,
    physiologicalValidationPass: false,
    phaseB1AcceptancePass: false,
    hashAlgorithm: "sha256-canonical-json-v1",
    testOnly: true,
  });
  return deepFreeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
  });
}

export function phaseB1PairedAtrialMatchedVolumePressureAttributionArtifactHashPayloadV1(
  artifact: PhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1,
): PhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactPayloadV1 {
  const { contentSha256: _contentSha256, ...payload } = artifact;
  return payload;
}

export function serializePhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1(
  artifact: PhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1,
  sha256Hex: CanonicalSha256HexProvider,
): string {
  if (
    artifact.artifactId
      !== PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_PRESSURE_ATTRIBUTION_ARTIFACT_V1_ID
    || artifact.sourceProvenanceAuthenticationStatus !== "unverified-reference-only"
    || artifact.claimBoundary.sourceObservationsAuthenticatedByThisModule !== false
    || artifact.claimBoundary.serializedRoundTripIsAuthentication !== false
    || artifact.claimBoundary.slsOffFigureEightTopologyRequired !== false
    || artifact.gateAudit.pressureDeltaSignUsedAsAcceptanceGate !== false
    || artifact.gateAudit.pvTopologyUsedAsAcceptanceGate !== false
  ) throw new Error("matched-volume attribution artifact identity drifted");
  assertCanonicalSha256(
    phaseB1PairedAtrialMatchedVolumePressureAttributionArtifactHashPayloadV1(
      artifact,
    ),
    artifact.contentSha256,
    sha256Hex,
  );
  return `${JSON.stringify(artifact, null, 2)}\n`;
}

function analyzePhase(
  window: PhaseB1AtrialMatchedVolumePhaseWindowV1,
  offSeries: PhaseB1AtrialPressurePhaseSeriesV1,
  onSeries: PhaseB1AtrialPressurePhaseSeriesV1,
  manifest: PhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1,
): PhaseB1AtrialMatchedVolumePhaseAttributionV1 {
  const offSamples = offSeries.samples;
  const onSamples = onSeries.samples;
  const branchByMode = deepFreeze({
    off: auditBranch(offSamples, window, manifest),
    on: auditBranch(onSamples, window, manifest),
  });
  const reasons = new Set<PhaseB1AtrialMatchedVolumeReasonV1>();
  for (const mode of PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_MODE_ORDER_V1) {
    const branch = branchByMode[mode];
    if (branch.sampleCount < 2) reasons.add(`${mode}-insufficient-samples`);
    if (branch.sampleCount >= 2 && !branch.strictlyMonotone) {
      reasons.add(`${mode}-volume-not-strict-monotone`);
    }
    if (
      branch.sampleCount >= 2
      && branch.strictlyMonotone
      && !branch.expectedDirectionSatisfied
    ) reasons.add(`${mode}-volume-direction-mismatch`);
  }
  let status: PhaseB1AtrialMatchedVolumeStatusV1;
  if (offSamples.length < 2 || onSamples.length < 2) {
    status = "insufficient-samples";
  } else if (
    !branchByMode.off.strictlyMonotone
    || !branchByMode.on.strictlyMonotone
    || !branchByMode.off.expectedDirectionSatisfied
    || !branchByMode.on.expectedDirectionSatisfied
  ) {
    status = "ambiguous";
  } else {
    status = "matched";
  }
  let overlap: Readonly<{ minimum: number; maximum: number }> | null = null;
  let matchedGrid: readonly PhaseB1AtrialMatchedVolumeGridPointV1[] = [];
  if (status === "matched") {
    const minimum = Math.max(
      branchByMode.off.minimumVolumeM3!,
      branchByMode.on.minimumVolumeM3!,
    );
    const maximum = Math.min(
      branchByMode.off.maximumVolumeM3!,
      branchByMode.on.maximumVolumeM3!,
    );
    if (!(maximum > minimum)) {
      status = "no-overlap";
      reasons.add("no-common-volume-overlap");
    } else {
      overlap = deepFreeze({ minimum, maximum });
      matchedGrid = buildMatchedGrid(
        offSamples,
        onSamples,
        overlap,
        manifest.normalizedGridPointCount,
      );
    }
  }
  const maximumAbsoluteMatchedResidualPaByMode = deepFreeze({
    off: maxOrNull(matchedGrid.map((point) =>
      Math.abs(point.byMode.off.reconstructionResidualPa))),
    on: maxOrNull(matchedGrid.map((point) =>
      Math.abs(point.byMode.on.reconstructionResidualPa))),
  });
  const maximumAbsoluteDeltaResidualPa = maxOrNull(matchedGrid.map((point) =>
    Math.abs(point.deltaReconstructionResidualPa)));
  const sourcePass = branchByMode.off.sourceReconstructionPass
    && branchByMode.on.sourceReconstructionPass;
  const matchedPass = matchedGrid.every((point) =>
    pressureReconstructs(
      point.byMode.off.totalAbsolutePressurePa,
      point.byMode.off.componentSumPa,
      manifest,
    )
    && pressureReconstructs(
      point.byMode.on.totalAbsolutePressurePa,
      point.byMode.on.componentSumPa,
      manifest,
    )
    && pressureReconstructs(
      point.deltaTotalAbsolutePressurePa,
      point.deltaComponentSumPa,
      manifest,
    ));
  const sourceAndMatchedReconstructionPass = sourcePass && matchedPass;
  const mathematicalIntegrityGatePass = status === "matched"
    && sourceAndMatchedReconstructionPass;
  return deepFreeze({
    phaseId: window.phaseId,
    role: window.role,
    startBoundary: window.startBoundary,
    endBoundary: window.endBoundary,
    measuredWindowByMode: {
      off: offSeries.boundaryResolution,
      on: onSeries.boundaryResolution,
    },
    status,
    reasons: [...reasons].sort(),
    branchByMode,
    commonVolumeOverlapM3: overlap,
    matchedGrid,
    reconstructionAudit: {
      maximumAbsoluteMatchedResidualPaByMode,
      maximumAbsoluteDeltaResidualPa,
      sourceAndMatchedReconstructionPass,
    },
    mathematicalIntegrityGatePass,
    pressureDeltaSignUsedAsAcceptanceGate: false,
    pvTopologyUsedAsAcceptanceGate: false,
  });
}

function auditBranch(
  samples: readonly PhaseB1AtrialPressureAttributionSampleV1[],
  window: PhaseB1AtrialMatchedVolumePhaseWindowV1,
  manifest: PhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1,
): PhaseB1AtrialBranchAuditV1 {
  const direction = observedVolumeDirection(samples);
  const strictlyMonotone = direction !== null;
  const expectedDirectionSatisfied = strictlyMonotone
    && (
      window.expectedVolumeDirection === "either"
      || direction === window.expectedVolumeDirection
    );
  const volumes = samples.map((sample) => sample.volumeM3);
  const residuals = samples.map((sample) => Math.abs(
    sample.totalAbsolutePressurePa - componentSum(sample.pressureComponentsPa),
  ));
  const maximumAbsoluteSourceReconstructionResidualPa = maxOrNull(residuals);
  const sourceReconstructionPass = samples.every((sample) =>
    pressureReconstructs(
      sample.totalAbsolutePressurePa,
      componentSum(sample.pressureComponentsPa),
      manifest,
    ));
  return deepFreeze({
    sampleCount: samples.length,
    observedVolumeDirection: direction,
    strictlyMonotone,
    expectedDirectionSatisfied,
    minimumVolumeM3: volumes.length === 0 ? null : Math.min(...volumes),
    maximumVolumeM3: volumes.length === 0 ? null : Math.max(...volumes),
    maximumAbsoluteSourceReconstructionResidualPa,
    sourceReconstructionPass,
  });
}

function buildMatchedGrid(
  offSamples: readonly PhaseB1AtrialPressureAttributionSampleV1[],
  onSamples: readonly PhaseB1AtrialPressureAttributionSampleV1[],
  overlap: Readonly<{ minimum: number; maximum: number }>,
  pointCount: number,
): readonly PhaseB1AtrialMatchedVolumeGridPointV1[] {
  return Object.freeze(Array.from({ length: pointCount }, (_, index) => {
    const normalizedCommonVolume01 = index / (pointCount - 1);
    const volumeM3 = overlap.minimum
      + normalizedCommonVolume01 * (overlap.maximum - overlap.minimum);
    const off = interpolateAtVolume(offSamples, volumeM3);
    const on = interpolateAtVolume(onSamples, volumeM3);
    const deltaPressurePaByOwner = mapOwnerRecord((owner) =>
      on.pressureComponentsPa[owner] - off.pressureComponentsPa[owner]);
    const deltaTotalAbsolutePressurePa =
      on.totalAbsolutePressurePa - off.totalAbsolutePressurePa;
    const deltaComponentSumPa = componentSum(deltaPressurePaByOwner);
    return deepFreeze({
      normalizedCommonVolume01,
      volumeM3,
      byMode: deepFreeze({ off, on }),
      deltaTotalAbsolutePressurePa,
      deltaPressurePaByOwner,
      deltaComponentSumPa,
      deltaReconstructionResidualPa:
        deltaTotalAbsolutePressurePa - deltaComponentSumPa,
    });
  }));
}

function interpolateAtVolume(
  samples: readonly PhaseB1AtrialPressureAttributionSampleV1[],
  volumeM3: number,
): PhaseB1AtrialInterpolatedPressureV1 {
  const ordered = samples[0].volumeM3 < samples[samples.length - 1].volumeM3
    ? samples
    : [...samples].reverse();
  let upper = 1;
  while (upper < ordered.length - 1 && ordered[upper].volumeM3 < volumeM3) {
    upper += 1;
  }
  const lower = upper - 1;
  const first = ordered[lower];
  const second = ordered[upper];
  const fraction = (volumeM3 - first.volumeM3)
    / (second.volumeM3 - first.volumeM3);
  const pressureComponentsPa = mapOwnerRecord((owner) => linear(
    first.pressureComponentsPa[owner],
    second.pressureComponentsPa[owner],
    fraction,
  ));
  const totalAbsolutePressurePa = linear(
    first.totalAbsolutePressurePa,
    second.totalAbsolutePressurePa,
    fraction,
  );
  const sum = componentSum(pressureComponentsPa);
  return deepFreeze({
    phaseSec: linear(first.phaseSec, second.phaseSec, fraction),
    totalAbsolutePressurePa,
    pressureComponentsPa,
    componentSumPa: sum,
    reconstructionResidualPa: totalAbsolutePressurePa - sum,
  });
}

function validateAndCopyPhaseWindows(
  value: unknown,
): readonly PhaseB1AtrialMatchedVolumePhaseWindowV1[] {
  assertDensePlainArrayV1(value, undefined, "phaseWindows");
  if (value.length === 0) throw new Error("phaseWindows must not be empty");
  const phaseIds = new Set<string>();
  return Object.freeze(value.map((entry, index) => {
    assertExactPlainRecordV1(entry, [
      "phaseId",
      "role",
      "startBoundary",
      "endBoundary",
      "expectedVolumeDirection",
    ], `phaseWindows[${index}]`);
    const phaseId = requireNonemptyString(entry.phaseId, `phaseWindows[${index}].phaseId`);
    if (phaseIds.has(phaseId)) throw new Error(`duplicate phaseId ${phaseId}`);
    phaseIds.add(phaseId);
    const role = requireOneOf(
      entry.role,
      ["reservoir", "conduit", "pump", "other"] as const,
      `phaseWindows[${index}].role`,
    );
    const expectedVolumeDirection = requireOneOf(
      entry.expectedVolumeDirection,
      ["increasing", "decreasing", "either"] as const,
      `phaseWindows[${index}].expectedVolumeDirection`,
    );
    return deepFreeze({
      phaseId,
      role,
      startBoundary: requireNonemptyString(entry.startBoundary, `phaseWindows[${index}].startBoundary`),
      endBoundary: requireNonemptyString(entry.endBoundary, `phaseWindows[${index}].endBoundary`),
      expectedVolumeDirection,
    });
  }));
}

function validateAndCopySourceProvenance(
  value: unknown,
): PhaseB1MatchedVolumeSourceProvenanceByModeV1 {
  assertExactPlainRecordV1(
    value,
    PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_MODE_ORDER_V1,
    "sourceProvenanceByMode",
  );
  return mapModeRecord((mode) => {
    const entry = value[mode];
    assertExactPlainRecordV1(
      entry,
      ["sourceArtifactId", "sourceContentSha256"],
      `sourceProvenanceByMode.${mode}`,
    );
    const sourceContentSha256 = requireNonemptyString(
      entry.sourceContentSha256,
      `sourceProvenanceByMode.${mode}.sourceContentSha256`,
    );
    if (!/^[0-9a-f]{64}$/.test(sourceContentSha256)) {
      throw new Error(`sourceProvenanceByMode.${mode}.sourceContentSha256 must be lowercase 64-hex`);
    }
    return deepFreeze({
      sourceArtifactId: requireNonemptyString(
        entry.sourceArtifactId,
        `sourceProvenanceByMode.${mode}.sourceArtifactId`,
      ),
      sourceContentSha256,
    });
  });
}

function validateAndCopySeries(
  value: unknown,
  manifest: PhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1,
): PhaseB1PairedAtrialPressureSeriesByModeV1 {
  assertExactPlainRecordV1(
    value,
    PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_MODE_ORDER_V1,
    "seriesByMode",
  );
  return mapModeRecord((mode) => {
    assertExactPlainRecordV1(
      value[mode],
      PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_ATRIUM_ORDER_V1,
      `seriesByMode.${mode}`,
    );
    return mapAtriumRecord((atriumId) => {
      const phases = value[mode][atriumId];
      assertDensePlainArrayV1(
        phases,
        manifest.phaseWindows.length,
        `seriesByMode.${mode}.${atriumId}`,
      );
      return Object.freeze(phases.map((phase, phaseIndex) => {
        const window = manifest.phaseWindows[phaseIndex];
        assertExactPlainRecordV1(
          phase,
          [
            "phaseId",
            "startBoundary",
            "endBoundary",
            "boundaryResolution",
            "samples",
          ],
          `seriesByMode.${mode}.${atriumId}[${phaseIndex}]`,
        );
        if (phase.phaseId !== window.phaseId) {
          throw new Error(
            `seriesByMode.${mode}.${atriumId}[${phaseIndex}].phaseId must be ${window.phaseId}`,
          );
        }
        if (
          phase.startBoundary !== window.startBoundary
          || phase.endBoundary !== window.endBoundary
        ) {
          throw new Error(
            `seriesByMode.${mode}.${atriumId}[${phaseIndex}] boundary semantics differ from ${window.phaseId}`,
          );
        }
        const boundaryResolution = validateBoundaryResolution(
          phase.boundaryResolution,
          `seriesByMode.${mode}.${atriumId}[${phaseIndex}].boundaryResolution`,
        );
        const samples = validateAndCopySamples(
          phase.samples,
          boundaryResolution.status === "resolved"
            ? boundaryResolution.startPhaseSec
            : null,
          boundaryResolution.status === "resolved"
            ? boundaryResolution.endPhaseSec
            : null,
          `seriesByMode.${mode}.${atriumId}[${phaseIndex}].samples`,
        );
        if (
          boundaryResolution.status === "unresolved"
          && samples.length !== 0
        ) throw new Error("unresolved phase boundaries require empty samples");
        return deepFreeze({
          phaseId: window.phaseId,
          startBoundary: window.startBoundary,
          endBoundary: window.endBoundary,
          boundaryResolution,
          samples,
        });
      }));
    });
  });
}

function validateAndCopySamples(
  value: unknown,
  startPhaseSec: number | null,
  endPhaseSec: number | null,
  field: string,
): readonly PhaseB1AtrialPressureAttributionSampleV1[] {
  assertDensePlainArrayV1(value, undefined, field);
  let previousPhaseSec = -Infinity;
  return Object.freeze(value.map((sample, index) => {
    assertExactPlainRecordV1(sample, [
      "phaseSec",
      "volumeM3",
      "totalAbsolutePressurePa",
      "pressureComponentsPa",
    ], `${field}[${index}]`);
    const phaseSec = requireFinite(sample.phaseSec, `${field}[${index}].phaseSec`);
    if (
      (startPhaseSec !== null && phaseSec < startPhaseSec)
      || (endPhaseSec !== null && phaseSec > endPhaseSec)
      || phaseSec <= previousPhaseSec
    ) {
      throw new Error(`${field} phaseSec values must be strictly increasing within the declared phase window`);
    }
    previousPhaseSec = phaseSec;
    assertExactPlainRecordV1(
      sample.pressureComponentsPa,
      PHASE_B1_PAIRED_ATRIAL_PRESSURE_OWNER_ORDER_V1,
      `${field}[${index}].pressureComponentsPa`,
    );
    const pressureComponentsPa = mapOwnerRecord((owner) => requireFinite(
      sample.pressureComponentsPa[owner],
      `${field}[${index}].pressureComponentsPa.${owner}`,
    ));
    return deepFreeze({
      phaseSec,
      volumeM3: requireFinite(sample.volumeM3, `${field}[${index}].volumeM3`),
      totalAbsolutePressurePa: requireFinite(
        sample.totalAbsolutePressurePa,
        `${field}[${index}].totalAbsolutePressurePa`,
      ),
      pressureComponentsPa,
    });
  }));
}

function validateBoundaryResolution(
  value: unknown,
  field: string,
): PhaseB1AtrialPhaseBoundaryResolutionV1 {
  assertExactPlainRecordV1(value, [
    "status",
    "startPhaseSec",
    "endPhaseSec",
    "reason",
  ], field);
  if (value.status === "unresolved") {
    if (value.startPhaseSec !== null || value.endPhaseSec !== null) {
      throw new Error(`${field} unresolved boundaries must be null`);
    }
    return deepFreeze({
      status: "unresolved" as const,
      startPhaseSec: null,
      endPhaseSec: null,
      reason: requireNonemptyString(value.reason, `${field}.reason`),
    });
  }
  if (value.status !== "resolved" || value.reason !== null) {
    throw new Error(`${field} status/reason contract is invalid`);
  }
  const startPhaseSec = requireFinite(value.startPhaseSec, `${field}.startPhaseSec`);
  const endPhaseSec = requireFinite(value.endPhaseSec, `${field}.endPhaseSec`);
  if (!(endPhaseSec > startPhaseSec)) {
    throw new Error(`${field} must have endPhaseSec > startPhaseSec`);
  }
  return deepFreeze({
    status: "resolved" as const,
    startPhaseSec,
    endPhaseSec,
    reason: null,
  });
}

function observedVolumeDirection(
  samples: readonly PhaseB1AtrialPressureAttributionSampleV1[],
): PhaseB1AtrialObservedVolumeDirectionV1 | null {
  if (samples.length < 2) return null;
  const firstDifference = samples[1].volumeM3 - samples[0].volumeM3;
  if (firstDifference === 0) return null;
  const increasing = firstDifference > 0;
  for (let index = 2; index < samples.length; index += 1) {
    const difference = samples[index].volumeM3 - samples[index - 1].volumeM3;
    if (difference === 0 || (difference > 0) !== increasing) return null;
  }
  return increasing ? "increasing" : "decreasing";
}

function pressureReconstructs(
  total: number,
  sum: number,
  manifest: PhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1,
): boolean {
  const tolerance = manifest.reconstructionAbsoluteTolerancePa
    + manifest.reconstructionRelativeTolerance * Math.max(Math.abs(total), Math.abs(sum));
  return Math.abs(total - sum) <= tolerance;
}

function componentSum(components: PhaseB1AtrialPressureComponentsPaV1): number {
  return PHASE_B1_PAIRED_ATRIAL_PRESSURE_OWNER_ORDER_V1.reduce(
    (sum, owner) => sum + components[owner],
    0,
  );
}

function mapModeRecord<Value>(
  build: (mode: PhaseB1PairedAtrialMatchedVolumeModeV1) => Value,
): Readonly<Record<PhaseB1PairedAtrialMatchedVolumeModeV1, Value>> {
  return deepFreeze({ off: build("off"), on: build("on") });
}

function mapAtriumRecord<Value>(
  build: (atriumId: PhaseB1PairedAtrialMatchedVolumeAtriumV1) => Value,
): Readonly<Record<PhaseB1PairedAtrialMatchedVolumeAtriumV1, Value>> {
  return deepFreeze({ LA: build("LA"), RA: build("RA") });
}

function mapOwnerRecord(
  build: (owner: PhaseB1PairedAtrialPressureOwnerV1) => number,
): PhaseB1AtrialPressureComponentsPaV1 {
  return deepFreeze({
    equilibriumPassive: build("equilibriumPassive"),
    activeLand: build("activeLand"),
    slsOverstress: build("slsOverstress"),
    commonExternal: build("commonExternal"),
  });
}

function linear(first: number, second: number, fraction: number): number {
  return first + fraction * (second - first);
}

function maxOrNull(values: readonly number[]): number | null {
  return values.length === 0 ? null : Math.max(...values);
}

function requireSha256Provider(value: unknown): asserts value is CanonicalSha256HexProvider {
  if (typeof value !== "function") throw new Error("sha256Hex must be a function");
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requireNonnegativeFinite(value: unknown, field: string): number {
  const number = requireFinite(value, field);
  if (number < 0) throw new Error(`${field} must be nonnegative`);
  return number;
}

function requireIntegerAtLeast(value: unknown, minimum: number, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum) {
    throw new Error(`${field} must be an integer >= ${minimum}`);
  }
  return value;
}

function requireNonemptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a nonempty string`);
  }
  return value;
}

function requireOneOf<const Value extends string>(
  value: unknown,
  allowed: readonly Value[],
  field: string,
): Value {
  if (typeof value !== "string" || !allowed.includes(value as Value)) {
    throw new Error(`${field} must be one of [${allowed.join(", ")}]`);
  }
  return value as Value;
}

function deepFreeze<Value>(value: Value): Value {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return value;
}
