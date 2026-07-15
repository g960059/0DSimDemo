import {
  assertCanonicalSha256,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildAtrialHumanPriorLandEquationParametersV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  buildAtrialLandLiteratureReferenceV1,
} from "@/engine/myocardium/fourChamberV1/land/atrialLandLiteratureReferenceV1";
import {
  ATRIAL_LAND_LATE_STRETCH_DT_FAMILY_SEC_V1,
  ATRIAL_LAND_LATE_STRETCH_TIMING_V1,
  runAtrialLandLateStretchComponentProtocolWithParameterSetV1,
  type AtrialLandLateStretchComponentReportV1,
  type AtrialLandLateStretchMetricsV1,
  type AtrialLandLateStretchRunV1,
  type AtrialLandLateStretchSecondaryComponentV1,
} from "@/engine/myocardium/fourChamberV1/protocols/atrialLandLateStretchComponentProtocolV1";
import {
  deriveLand2017DerivedParameters,
  stableHash,
  type Land2017RuntimeParameters,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017";

export const ATRIAL_LAND_GERACH_CANDIDATE_PROTOCOL_V1_ID =
  "atrial-land-gerach-candidate-protocol-v1" as const;

export const ATRIAL_LAND_GERACH_CANDIDATE_CLAIM_BOUNDARY_V1 =
  "isolated-competing-model-candidate-gerach-values-not-independently-measured-no-runtime-promotion" as const;

export const ATRIAL_LAND_GERACH_CANDIDATE_PARAMETER_SET_V1_ID =
  "atrial-gerach-2021-pair-controlled-on-legacy-v1" as const;

export const ATRIAL_LAND_GERACH_CONTROLLED_PRIMITIVE_DIFF_V1 = Object.freeze([
  "CaT50Ref",
  "beta1",
] as const);

export type AtrialLandGerachCandidateIdV1 = "current-legacy" | "gerach-2021-pair";

export type AtrialLandGerachIsometricMetricsV1 = {
  readonly baselineWallActiveStressPa: number;
  readonly primaryPeakWallActiveStressPa: number;
  readonly primaryPeakAboveBaselinePa: number;
  readonly primaryPeakTimeAfterElectricalMs: number;
  readonly primaryPeakTimeAfterCalciumDriveMs: number;
  readonly relaxation50AfterPrimaryMs: number | null;
};

export type AtrialLandGerachArmMetricsV1 = {
  readonly primaryPeakAboveBaselinePa: number;
  readonly primaryPeakTimeAfterCalciumDriveMs: number;
  readonly preRestretchTroughWallActiveStressPa: number;
  readonly latePeakWallActiveStressPa: number;
  readonly secondarySpikeGainPa: number;
  readonly postRestretchPositiveStressImpulsePaSec: number;
  readonly maximumPostRestretchWallStressUpstrokePaPerSec: number;
  readonly totalStressSecondarySpikeDetectedDiagnostic: boolean;
};

export type AtrialLandGerachMatchedComponentMetricsV1 = {
  readonly available: boolean;
  readonly peakRestretchMinusMatchedHoldPa: number | null;
  readonly peakRestretchMinusMatchedHoldTimeSec: number | null;
  readonly positiveRestretchMinusMatchedHoldImpulsePaSec: number | null;
  readonly maximumRestretchMinusMatchedHoldUpstrokePaPerSec: number | null;
  readonly normalizedPeakRestretchMinusMatchedHold: number | null;
  readonly totalStressSecondarySpikeDetected: boolean | null;
  readonly matchedCounterfactualComponentDetected: boolean | null;
  readonly morphologyUsedAsGate: false;
};

export type AtrialLandGerachCandidateMetricsV1 = {
  readonly candidateId: AtrialLandGerachCandidateIdV1;
  readonly parameterSetId: string;
  readonly parameterSetStableHash: string;
  readonly isometric: AtrialLandGerachIsometricMetricsV1;
  readonly shorteningHold: AtrialLandGerachArmMetricsV1;
  readonly shorteningRestretch: AtrialLandGerachArmMetricsV1;
  readonly matchedRestretchMinusHold: AtrialLandGerachMatchedComponentMetricsV1;
};

export type AtrialLandGerachDtComparisonV1 = {
  readonly dtSec: number;
  readonly currentLegacy: AtrialLandGerachCandidateMetricsV1;
  readonly gerach2021Pair: AtrialLandGerachCandidateMetricsV1;
  readonly gerachMinusLegacy: {
    readonly isometricPrimaryPeakAboveBaselinePa: number;
    readonly isometricPrimaryPeakAmplitudeRatio: number | null;
    readonly isometricPrimaryPeakTimeAfterCalciumDriveMs: number;
    readonly isometricRelaxation50AfterPrimaryMs: number | null;
    readonly shorteningHoldPrimaryPeakAboveBaselinePa: number;
    readonly shorteningRestretchSecondarySpikeGainPa: number;
    readonly matchedComponentPeakPa: number | null;
    readonly matchedComponentPeakRatio: number | null;
    readonly matchedComponentPositiveImpulsePaSec: number | null;
    readonly matchedComponentNormalizedPeak: number | null;
    readonly matchedComponentNormalizedPeakRatio: number | null;
  };
};

export type AtrialLandGerachCandidateProtocolReportV1 = {
  readonly protocolId: typeof ATRIAL_LAND_GERACH_CANDIDATE_PROTOCOL_V1_ID;
  readonly claimBoundary: typeof ATRIAL_LAND_GERACH_CANDIDATE_CLAIM_BOUNDARY_V1;
  readonly diagnosticOnly: true;
  readonly isolatedProtocolOnly: true;
  readonly pvLoopFitUsed: false;
  readonly pvLoopGateUsed: false;
  readonly gerachValuesIndependentlyMeasured: false;
  readonly runtimeDefaultChanged: false;
  readonly runtimePromotionEligible: false;
  readonly physiologicalValidationClaimed: false;
  readonly candidateDefinition: {
    readonly literatureReferenceSha256: string;
    readonly gerach2021Doi: "10.3390/math9111247";
    readonly currentLegacyParameterSetId: string;
    readonly currentLegacyParameterSetStableHash: string;
    readonly gerachCandidateParameterSetId:
      typeof ATRIAL_LAND_GERACH_CANDIDATE_PARAMETER_SET_V1_ID;
    readonly gerachCandidateParameterSetStableHash: string;
    readonly controlledPrimitiveDiff: typeof ATRIAL_LAND_GERACH_CONTROLLED_PRIMITIVE_DIFF_V1;
    readonly currentLegacyValues: {
      readonly caT50RefUM: number;
      readonly beta1UM: number;
      readonly trefPa: number;
    };
    readonly gerachCandidateValues: {
      readonly caT50RefUM: 1.05;
      readonly beta1UM: -0.5;
      readonly trefPa: number;
    };
    readonly allOtherPrimitiveValuesBitExact: boolean;
    readonly derivedValuesBitExact: boolean;
    readonly sourceTrefAndWallStressScaleFixed: boolean;
    readonly evidenceClassification:
      "published-coupled-model-parameter-pair-not-independent-human-measurement";
  };
  readonly controlledProtocol: {
    readonly prescribedCalciumBitExact: boolean;
    readonly strainTrajectoriesBitExact: boolean;
    readonly wallAdapterBitExact: boolean;
    readonly timing: typeof ATRIAL_LAND_LATE_STRETCH_TIMING_V1;
    readonly dtFamilySec: typeof ATRIAL_LAND_LATE_STRETCH_DT_FAMILY_SEC_V1;
    readonly candidateSpecificDiastolicBurnInRequired: true;
    readonly commonCalciumInputSha256: string;
  };
  readonly provenance: {
    readonly candidateDefinitionSha256: string;
    readonly controlledProtocolSha256: string;
    readonly currentLegacyProtocolInputSha256: string;
    readonly gerachCandidateProtocolInputSha256: string;
    readonly currentLegacyResultSummarySha256: string;
    readonly gerachCandidateResultSummarySha256: string;
    readonly pairedAuditInputSha256: string;
  };
  readonly comparisons: readonly AtrialLandGerachDtComparisonV1[];
  readonly numericalAudit: {
    readonly completeTwoByThreeCandidateMatrix: boolean;
    readonly bothProtocolNumericalGatesPassed: boolean;
    readonly controlledInputsPassed: boolean;
    readonly allReportedMetricsFiniteOrDeclaredNullable: boolean;
    readonly morphologyOrPvLoopUsedAsGate: false;
    readonly pass: boolean;
  };
  readonly hashAlgorithm: "sha256-canonical-json-v1";
  readonly contentSha256: string;
};

/**
 * Constructs the Gerach-like competitor by changing only the two published
 * atrial primitives on the current legacy parameter set. This does not alter
 * the manifest or any closed-loop runtime default.
 */
export function buildAtrialLandGerachControlledCandidateParameterSetV1(
  sha256Hex: CanonicalSha256HexProvider,
): Land2017SourceParameterSet {
  const legacy = buildAtrialHumanPriorLandEquationParametersV1();
  const reference = buildAtrialLandLiteratureReferenceV1(sha256Hex);
  const gerach = reference.gerach2021.parameterChangesFromLandNiederer2018;
  const values: Land2017RuntimeParameters = {
    ...legacy.values,
    CaT50Ref: gerach.calciumSensitivityCaT50UM,
    beta1: gerach.lengthSensitivityBeta1UM,
  };
  const derived = deriveLand2017DerivedParameters(values);
  const sourceParameters = legacy.sourceParameters.map((entry) => {
    const changed = entry.parameter === "CaT50Ref" || entry.parameter === "beta1";
    return changed
      ? {
          ...entry,
          location:
            `${entry.location}; isolated controlled Gerach 2021 candidate, DOI ${reference.gerach2021.doi}`,
          runtime: { ...entry.runtime, value: values[entry.parameter] },
        }
      : entry;
  });
  const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> = {
    parameterSetId: ATRIAL_LAND_GERACH_CANDIDATE_PARAMETER_SET_V1_ID,
    sourceId: legacy.sourceId,
    doi: legacy.doi,
    values,
    derived,
    sourceParameters,
    derivedParameters: legacy.derivedParameters,
  };
  return deepFreeze({
    ...hashInput,
    parameterSetStableHash: stableHash(hashInput),
  });
}

/**
 * Runs two isolated six-state Land candidates under identical calcium, strain,
 * wall adapter, Tref, and time-step families. Candidate morphology is reported
 * but never used as a physiological, PV-loop, or runtime-promotion gate.
 */
export function runAtrialLandGerachCandidateProtocolV1(
  sha256Hex: CanonicalSha256HexProvider,
): AtrialLandGerachCandidateProtocolReportV1 {
  const reference = buildAtrialLandLiteratureReferenceV1(sha256Hex);
  const currentLegacy = buildAtrialHumanPriorLandEquationParametersV1();
  const gerachCandidate = buildAtrialLandGerachControlledCandidateParameterSetV1(sha256Hex);
  const currentReport = runAtrialLandLateStretchComponentProtocolWithParameterSetV1(
    sha256Hex,
    currentLegacy,
  );
  const gerachReport = runAtrialLandLateStretchComponentProtocolWithParameterSetV1(
    sha256Hex,
    gerachCandidate,
  );

  const otherPrimitiveNames = (Object.keys(currentLegacy.values) as Array<
    keyof Land2017RuntimeParameters
  >).filter((name) => !ATRIAL_LAND_GERACH_CONTROLLED_PRIMITIVE_DIFF_V1.includes(
    name as (typeof ATRIAL_LAND_GERACH_CONTROLLED_PRIMITIVE_DIFF_V1)[number],
  ));
  const allOtherPrimitiveValuesBitExact = otherPrimitiveNames.every((name) =>
    Object.is(currentLegacy.values[name], gerachCandidate.values[name]));
  const derivedValuesBitExact = typedEntries(currentLegacy.derived).every(([name, value]) =>
    Object.is(value, gerachCandidate.derived[name]));
  const sourceTrefAndWallStressScaleFixed =
    Object.is(currentLegacy.values.Tref, gerachCandidate.values.Tref)
    && currentReport.modelBinding.wallAdapterTissueManifestSha256
      === gerachReport.modelBinding.wallAdapterTissueManifestSha256;

  const candidateDefinition = {
    literatureReferenceSha256: reference.contentSha256,
    gerach2021Doi: reference.gerach2021.doi,
    currentLegacyParameterSetId: currentLegacy.parameterSetId,
    currentLegacyParameterSetStableHash: currentLegacy.parameterSetStableHash,
    gerachCandidateParameterSetId: ATRIAL_LAND_GERACH_CANDIDATE_PARAMETER_SET_V1_ID,
    gerachCandidateParameterSetStableHash: gerachCandidate.parameterSetStableHash,
    controlledPrimitiveDiff: ATRIAL_LAND_GERACH_CONTROLLED_PRIMITIVE_DIFF_V1,
    currentLegacyValues: {
      caT50RefUM: currentLegacy.values.CaT50Ref,
      beta1UM: currentLegacy.values.beta1,
      trefPa: currentLegacy.values.Tref,
    },
    gerachCandidateValues: {
      caT50RefUM: 1.05 as const,
      beta1UM: -0.5 as const,
      trefPa: gerachCandidate.values.Tref,
    },
    allOtherPrimitiveValuesBitExact,
    derivedValuesBitExact,
    sourceTrefAndWallStressScaleFixed,
    evidenceClassification:
      "published-coupled-model-parameter-pair-not-independent-human-measurement" as const,
  };
  const prescribedCalciumBitExact = currentReport.provenance.calciumInputSha256
    === gerachReport.provenance.calciumInputSha256
    && calciumSamplesBitExact(currentReport, gerachReport);
  const strainTrajectoriesBitExact = trajectoriesBitExact(currentReport, gerachReport);
  const wallAdapterBitExact = currentReport.modelBinding.wallAdapterTissueManifestSha256
    === gerachReport.modelBinding.wallAdapterTissueManifestSha256;
  const controlledProtocol = {
    prescribedCalciumBitExact,
    strainTrajectoriesBitExact,
    wallAdapterBitExact,
    timing: ATRIAL_LAND_LATE_STRETCH_TIMING_V1,
    dtFamilySec: ATRIAL_LAND_LATE_STRETCH_DT_FAMILY_SEC_V1,
    candidateSpecificDiastolicBurnInRequired: true as const,
    commonCalciumInputSha256: currentReport.provenance.calciumInputSha256,
  };
  const candidateDefinitionSha256 = computeCanonicalSha256(candidateDefinition, sha256Hex);
  const controlledProtocolSha256 = computeCanonicalSha256(controlledProtocol, sha256Hex);
  const pairedAuditInputSha256 = computeCanonicalSha256({
    protocolId: ATRIAL_LAND_GERACH_CANDIDATE_PROTOCOL_V1_ID,
    claimBoundary: ATRIAL_LAND_GERACH_CANDIDATE_CLAIM_BOUNDARY_V1,
    candidateDefinitionSha256,
    controlledProtocolSha256,
    currentLegacyProtocolInputSha256: currentReport.provenance.protocolInputSha256,
    gerachCandidateProtocolInputSha256: gerachReport.provenance.protocolInputSha256,
  }, sha256Hex);
  const comparisons = ATRIAL_LAND_LATE_STRETCH_DT_FAMILY_SEC_V1.map((dtSec) =>
    compareCandidateAtDt(currentReport, gerachReport, dtSec));
  const completeTwoByThreeCandidateMatrix = comparisons.length === 3
    && comparisons.every((comparison) =>
      comparison.currentLegacy.candidateId === "current-legacy"
      && comparison.gerach2021Pair.candidateId === "gerach-2021-pair");
  const bothProtocolNumericalGatesPassed = currentReport.diagnosticGate.pass
    && gerachReport.diagnosticGate.pass;
  const controlledInputsPassed = prescribedCalciumBitExact
    && strainTrajectoriesBitExact
    && wallAdapterBitExact
    && sourceTrefAndWallStressScaleFixed
    && allOtherPrimitiveValuesBitExact
    && derivedValuesBitExact;
  const allReportedMetricsFiniteOrDeclaredNullable = comparisons.every(comparisonFinite);
  const numericalAudit = {
    completeTwoByThreeCandidateMatrix,
    bothProtocolNumericalGatesPassed,
    controlledInputsPassed,
    allReportedMetricsFiniteOrDeclaredNullable,
    morphologyOrPvLoopUsedAsGate: false as const,
    pass: completeTwoByThreeCandidateMatrix
      && bothProtocolNumericalGatesPassed
      && controlledInputsPassed
      && allReportedMetricsFiniteOrDeclaredNullable,
  };
  const payload: Omit<AtrialLandGerachCandidateProtocolReportV1, "contentSha256"> = {
    protocolId: ATRIAL_LAND_GERACH_CANDIDATE_PROTOCOL_V1_ID,
    claimBoundary: ATRIAL_LAND_GERACH_CANDIDATE_CLAIM_BOUNDARY_V1,
    diagnosticOnly: true,
    isolatedProtocolOnly: true,
    pvLoopFitUsed: false,
    pvLoopGateUsed: false,
    gerachValuesIndependentlyMeasured: false,
    runtimeDefaultChanged: false,
    runtimePromotionEligible: false,
    physiologicalValidationClaimed: false,
    candidateDefinition,
    controlledProtocol,
    provenance: {
      candidateDefinitionSha256,
      controlledProtocolSha256,
      currentLegacyProtocolInputSha256: currentReport.provenance.protocolInputSha256,
      gerachCandidateProtocolInputSha256: gerachReport.provenance.protocolInputSha256,
      currentLegacyResultSummarySha256: currentReport.resultSummarySha256,
      gerachCandidateResultSummarySha256: gerachReport.resultSummarySha256,
      pairedAuditInputSha256,
    },
    comparisons,
    numericalAudit,
    hashAlgorithm: "sha256-canonical-json-v1",
  };
  const result = deepFreeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  assertCanonicalSha256(payload, result.contentSha256, sha256Hex);
  return result;
}

export function atrialLandGerachCandidateProtocolHashPayloadV1(
  report: AtrialLandGerachCandidateProtocolReportV1,
): Omit<AtrialLandGerachCandidateProtocolReportV1, "contentSha256"> {
  const { contentSha256: _contentSha256, ...payload } = report;
  return payload;
}

function compareCandidateAtDt(
  currentReport: AtrialLandLateStretchComponentReportV1,
  gerachReport: AtrialLandLateStretchComponentReportV1,
  dtSec: number,
): AtrialLandGerachDtComparisonV1 {
  const currentLegacy = candidateMetrics("current-legacy", currentReport, dtSec);
  const gerach2021Pair = candidateMetrics("gerach-2021-pair", gerachReport, dtSec);
  return deepFreeze({
    dtSec,
    currentLegacy,
    gerach2021Pair,
    gerachMinusLegacy: {
      isometricPrimaryPeakAboveBaselinePa:
        gerach2021Pair.isometric.primaryPeakAboveBaselinePa
        - currentLegacy.isometric.primaryPeakAboveBaselinePa,
      isometricPrimaryPeakAmplitudeRatio: safeRatio(
        gerach2021Pair.isometric.primaryPeakAboveBaselinePa,
        currentLegacy.isometric.primaryPeakAboveBaselinePa,
      ),
      isometricPrimaryPeakTimeAfterCalciumDriveMs:
        gerach2021Pair.isometric.primaryPeakTimeAfterCalciumDriveMs
        - currentLegacy.isometric.primaryPeakTimeAfterCalciumDriveMs,
      isometricRelaxation50AfterPrimaryMs: nullableDifference(
        gerach2021Pair.isometric.relaxation50AfterPrimaryMs,
        currentLegacy.isometric.relaxation50AfterPrimaryMs,
      ),
      shorteningHoldPrimaryPeakAboveBaselinePa:
        gerach2021Pair.shorteningHold.primaryPeakAboveBaselinePa
        - currentLegacy.shorteningHold.primaryPeakAboveBaselinePa,
      shorteningRestretchSecondarySpikeGainPa:
        gerach2021Pair.shorteningRestretch.secondarySpikeGainPa
        - currentLegacy.shorteningRestretch.secondarySpikeGainPa,
      matchedComponentPeakPa: nullableDifference(
        gerach2021Pair.matchedRestretchMinusHold.peakRestretchMinusMatchedHoldPa,
        currentLegacy.matchedRestretchMinusHold.peakRestretchMinusMatchedHoldPa,
      ),
      matchedComponentPeakRatio: nullableRatio(
        gerach2021Pair.matchedRestretchMinusHold.peakRestretchMinusMatchedHoldPa,
        currentLegacy.matchedRestretchMinusHold.peakRestretchMinusMatchedHoldPa,
      ),
      matchedComponentPositiveImpulsePaSec: nullableDifference(
        gerach2021Pair.matchedRestretchMinusHold
          .positiveRestretchMinusMatchedHoldImpulsePaSec,
        currentLegacy.matchedRestretchMinusHold
          .positiveRestretchMinusMatchedHoldImpulsePaSec,
      ),
      matchedComponentNormalizedPeak: nullableDifference(
        gerach2021Pair.matchedRestretchMinusHold
          .normalizedPeakRestretchMinusMatchedHold,
        currentLegacy.matchedRestretchMinusHold
          .normalizedPeakRestretchMinusMatchedHold,
      ),
      matchedComponentNormalizedPeakRatio: nullableRatio(
        gerach2021Pair.matchedRestretchMinusHold
          .normalizedPeakRestretchMinusMatchedHold,
        currentLegacy.matchedRestretchMinusHold
          .normalizedPeakRestretchMinusMatchedHold,
      ),
    },
  });
}

function candidateMetrics(
  candidateId: AtrialLandGerachCandidateIdV1,
  report: AtrialLandLateStretchComponentReportV1,
  dtSec: number,
): AtrialLandGerachCandidateMetricsV1 {
  const isometric = requiredRun(report, dtSec, "isometric");
  const shorteningHold = requiredRun(report, dtSec, "shortening-hold");
  const shorteningRestretch = requiredRun(report, dtSec, "shortening-restretch");
  const component = report.secondaryComponents.find((entry) => entry.dtSec === dtSec);
  if (component === undefined) throw new Error(`Missing matched component at dt=${dtSec}`);
  return deepFreeze({
    candidateId,
    parameterSetId: report.modelBinding.atrialLandParameterSetId,
    parameterSetStableHash: report.modelBinding.atrialLandParameterSetStableHash,
    isometric: isometricMetrics(requiredMetrics(isometric)),
    shorteningHold: armMetrics(requiredMetrics(shorteningHold)),
    shorteningRestretch: armMetrics(requiredMetrics(shorteningRestretch)),
    matchedRestretchMinusHold: matchedComponentMetrics(component),
  });
}

function isometricMetrics(
  metrics: AtrialLandLateStretchMetricsV1,
): AtrialLandGerachIsometricMetricsV1 {
  return {
    baselineWallActiveStressPa: metrics.baselineWallActiveStressPa,
    primaryPeakWallActiveStressPa: metrics.primaryPeakWallActiveStressPa,
    primaryPeakAboveBaselinePa: metrics.primaryPeakAboveBaselinePa,
    primaryPeakTimeAfterElectricalMs: metrics.primaryPeakTimeAfterElectricalMs,
    primaryPeakTimeAfterCalciumDriveMs: metrics.primaryPeakTimeAfterCalciumDriveMs,
    relaxation50AfterPrimaryMs: metrics.relaxation50AfterPrimaryMs,
  };
}

function armMetrics(metrics: AtrialLandLateStretchMetricsV1): AtrialLandGerachArmMetricsV1 {
  return {
    primaryPeakAboveBaselinePa: metrics.primaryPeakAboveBaselinePa,
    primaryPeakTimeAfterCalciumDriveMs: metrics.primaryPeakTimeAfterCalciumDriveMs,
    preRestretchTroughWallActiveStressPa: metrics.preRestretchTroughWallActiveStressPa,
    latePeakWallActiveStressPa: metrics.latePeakWallActiveStressPa,
    secondarySpikeGainPa: metrics.secondarySpikeGainPa,
    postRestretchPositiveStressImpulsePaSec:
      metrics.postRestretchPositiveStressImpulsePaSec,
    maximumPostRestretchWallStressUpstrokePaPerSec:
      metrics.maximumPostRestretchWallStressUpstrokePaPerSec,
    totalStressSecondarySpikeDetectedDiagnostic: metrics.secondarySpikeDetectedDiagnostic,
  };
}

function matchedComponentMetrics(
  component: AtrialLandLateStretchSecondaryComponentV1,
): AtrialLandGerachMatchedComponentMetricsV1 {
  return {
    available: component.available,
    peakRestretchMinusMatchedHoldPa: component.peakRestretchMinusMatchedHoldPa,
    peakRestretchMinusMatchedHoldTimeSec: component.peakRestretchMinusMatchedHoldTimeSec,
    positiveRestretchMinusMatchedHoldImpulsePaSec:
      component.positiveRestretchMinusMatchedHoldImpulsePaSec,
    maximumRestretchMinusMatchedHoldUpstrokePaPerSec:
      component.maximumRestretchMinusMatchedHoldUpstrokePaPerSec,
    normalizedPeakRestretchMinusMatchedHold: component.normalizedPeakRestretchMinusMatchedHold,
    totalStressSecondarySpikeDetected: component.totalStressSecondarySpikeDetected,
    matchedCounterfactualComponentDetected: component.matchedCounterfactualComponentDetected,
    morphologyUsedAsGate: false,
  };
}

function requiredRun(
  report: AtrialLandLateStretchComponentReportV1,
  dtSec: number,
  armId: AtrialLandLateStretchRunV1["armId"],
): AtrialLandLateStretchRunV1 {
  const run = report.runs.find((entry) => entry.dtSec === dtSec && entry.armId === armId);
  if (run === undefined) throw new Error(`Missing ${armId} run at dt=${dtSec}`);
  return run;
}

function requiredMetrics(run: AtrialLandLateStretchRunV1): AtrialLandLateStretchMetricsV1 {
  if (run.metrics === null) {
    throw new Error(`Metrics unavailable for ${run.armId} at dt=${run.dtSec}`);
  }
  return run.metrics;
}

function trajectoriesBitExact(
  current: AtrialLandLateStretchComponentReportV1,
  candidate: AtrialLandLateStretchComponentReportV1,
): boolean {
  if (current.runs.length !== candidate.runs.length) return false;
  return current.runs.every((run) => {
    const peer = candidate.runs.find((entry) =>
      entry.dtSec === run.dtSec && entry.armId === run.armId);
    return peer !== undefined
      && peer.trajectoryProvenanceSha256 === run.trajectoryProvenanceSha256
      && peer.expectedStepCount === run.expectedStepCount
      && peer.samples.length === run.samples.length
      && run.samples.every((sample, index) =>
        Object.is(sample.fiberLogStrain, peer.samples[index].fiberLogStrain)
        && Object.is(sample.fiberLogStrainRatePerSec, peer.samples[index].fiberLogStrainRatePerSec)
        && Object.is(sample.landEngineeringStrain, peer.samples[index].landEngineeringStrain));
  });
}

function calciumSamplesBitExact(
  current: AtrialLandLateStretchComponentReportV1,
  candidate: AtrialLandLateStretchComponentReportV1,
): boolean {
  if (current.runs.length !== candidate.runs.length) return false;
  return current.runs.every((run) => {
    const peer = candidate.runs.find((entry) =>
      entry.dtSec === run.dtSec && entry.armId === run.armId);
    return peer !== undefined
      && peer.calciumDriveTimeSec === run.calciumDriveTimeSec
      && peer.calciumEventAppliedCount === run.calciumEventAppliedCount
      && peer.samples.length === run.samples.length
      && run.samples.every((sample, index) =>
        Object.is(sample.freeCalciumUM, peer.samples[index].freeCalciumUM));
  });
}

function comparisonFinite(comparison: AtrialLandGerachDtComparisonV1): boolean {
  return finiteOrNullDeep(comparison);
}

function finiteOrNullDeep(value: unknown): boolean {
  if (value === null || typeof value === "boolean" || typeof value === "string") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(finiteOrNullDeep);
  if (typeof value === "object") return Object.values(value).every(finiteOrNullDeep);
  return false;
}

function safeRatio(numerator: number, denominator: number): number | null {
  return Math.abs(denominator) > 1e-12 ? numerator / denominator : null;
}

function nullableRatio(
  numerator: number | null,
  denominator: number | null,
): number | null {
  return numerator === null || denominator === null ? null : safeRatio(numerator, denominator);
}

function nullableDifference(left: number | null, right: number | null): number | null {
  return left === null || right === null ? null : left - right;
}

function typedEntries<T extends Record<string, number>>(
  value: T,
): Array<[keyof T, number]> {
  return Object.entries(value) as Array<[keyof T, number]>;
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return value;
}
