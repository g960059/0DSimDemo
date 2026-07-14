import type { NoAvpdFourChamberBenchResultV1 } from "@/engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1";
import type {
  NoAvpdAtrialThinFilamentSlsCandidateIdV1,
  NoAvpdAtrialThinFilamentSlsCandidateSpecV1,
} from "@/engine/mechanics2/benches/NoAvpdAtrialThinFilamentSlsMatrixV1";
import {
  summarizeNoAvpdAtrialMorphologyOwnerScreenDiagnosticsV1,
  type NoAvpdAtrialMorphologyOwnerScreenDiagnosticsV1,
} from "@/engine/mechanics2/diagnostics/NoAvpdAtrialMorphologyOwnerScreenDiagnosticsV1";

export const NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_DIAGNOSTICS_ID_V1 =
  "no-avpd-atrial-thin-filament-sls-matrix-diagnostics-v1" as const;

export const NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_METRIC_IDS_V1 = [
  "matchedVolumeGapAreaMmHgMl",
  "matchedVolumeMeanGapMmHg",
  "aLoopPrimaryCornerDeg",
  "aLoopPrimaryPeakRemainingVolumeFraction01",
  "aLoopOnsetToPrimaryPeakMs",
  "aLoopReboundAmplitudeMmHg",
  "thinFilamentRise10To90Ms",
  "lapRise10To90Ms",
  "laPressureRangeMmHg",
  "laVolumeRangeMl",
] as const;

export type NoAvpdAtrialThinFilamentSlsMatrixMetricIdV1 =
  (typeof NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_METRIC_IDS_V1)[number];

export type NoAvpdAtrialThinFilamentSlsMatrixMetricVectorV1 = Readonly<
  Record<NoAvpdAtrialThinFilamentSlsMatrixMetricIdV1, number | null>
>;

export type NoAvpdAtrialThinFilamentSlsCandidateDiagnosticsV1 = ReturnType<
  typeof summarizeNoAvpdAtrialThinFilamentSlsCandidateDiagnosticsV1
>;

export function summarizeNoAvpdAtrialThinFilamentSlsCandidateDiagnosticsV1(
  report: NoAvpdFourChamberBenchResultV1,
) {
  const morphology =
    summarizeNoAvpdAtrialMorphologyOwnerScreenDiagnosticsV1(report);
  const oneBeatNormalizedMax =
    report.reportOnlyExactBeatBoundaryReturnMap.oneBeatMapResidual
      ?.normalizedFullStateDrift.maxAbsDimensionless ?? null;
  const twoBeatNormalizedMax =
    report.reportOnlyExactBeatBoundaryReturnMap.twoBeatMapResidual
      ?.normalizedFullStateDrift.maxAbsDimensionless ?? null;
  const threshold = 1e-3;
  const descriptiveOrbitStatus =
    report.status !== "pass"
      ? "structural-fail"
      : oneBeatNormalizedMax == null
        ? "unavailable"
        : oneBeatNormalizedMax <= threshold
          ? "ready-for-between-candidate-description"
          : "unsettled-no-ranking";
  const retainedBeatIndices = [
    ...new Set(report.samples.map((sample) => sample.beatIndex)),
  ].sort((left, right) => left - right);
  return {
    diagnosticsId: NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_DIAGNOSTICS_ID_V1,
    evidenceStatus:
      "report-only-two-by-two-interaction-screen-no-physiology-gate-calibration-or-winner" as const,
    structuralStatus: report.status,
    failureReason: report.failureReason,
    hardDiagnostics: report.hardDiagnostics,
    solverWork: report.solverWork,
    orbitReadback: {
      status: descriptiveOrbitStatus,
      oneBeatNormalizedMax,
      twoBeatNormalizedMax,
      descriptiveThresholdMaximumInclusive: threshold,
      changesStructuralStatus: false as const,
      establishesStableLimitCycle: false as const,
      periodClassificationPerformed: false as const,
    },
    rawSourceContract: {
      sampleRetention: report.runProtocol.sampleRetention,
      expectedRetention: "last-two-complete-beats" as const,
      rawNoSmoothing: true as const,
      rawNoDecimation: true as const,
      sampleIntervalSec: report.runProtocol.sampledIntervalSec,
      retainedSampleCount: report.samples.length,
      retainedBeatIndices,
      signals: [
        "ledger-la-blood-volume",
        "la-pressure",
        "lv-pressure",
        "mitral-flow",
        "la-free-calcium",
        "la-ca-troponin",
        "la-thin-filament-availability",
        "la-series-tension",
        "la-sls-overstress",
      ] as const,
      bloodVolumePvOwnership:
        "la-volume-is-ledger-state-integrated-from-pulmonary-venous-minus-mitral-flow" as const,
    },
    continuousEaReadback: {
      ...morphology.continuousEaReadback,
      objectiveApplied: false as const,
      gateApplied: false as const,
      rankingApplied: false as const,
    },
    metricVector: metricVector(morphology),
    morphology,
    claimBoundary: {
      dynamicLagTimeConstantCalibrated: false as const,
      landEquation48Implemented: false as const,
      physiologyAcceptanceApplied: false as const,
      candidateRankingApplied: false as const,
    },
  };
}

export type NoAvpdAtrialThinFilamentSlsMatrixDiagnosticsV1 = ReturnType<
  typeof summarizeNoAvpdAtrialThinFilamentSlsMatrixDiagnosticsV1
>;

export function summarizeNoAvpdAtrialThinFilamentSlsMatrixDiagnosticsV1(
  candidates: readonly {
    readonly spec: NoAvpdAtrialThinFilamentSlsCandidateSpecV1;
    readonly diagnostics: NoAvpdAtrialThinFilamentSlsCandidateDiagnosticsV1;
  }[],
) {
  const byId = new Map<
    NoAvpdAtrialThinFilamentSlsCandidateIdV1,
    (typeof candidates)[number]
  >();
  for (const candidate of candidates) {
    if (byId.has(candidate.spec.candidateId)) {
      throw new Error(
        `duplicate matrix candidate: ${candidate.spec.candidateId}`,
      );
    }
    byId.set(candidate.spec.candidateId, candidate);
  }
  const alg4 = requireCandidate(byId, "ALG_SLS4");
  const alg8 = requireCandidate(byId, "ALG_SLS8");
  const lag4 = requireCandidate(byId, "LAG25_SLS4");
  const lag8 = requireCandidate(byId, "LAG25_SLS8");
  const factorContrasts = Object.fromEntries(
    NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_METRIC_IDS_V1.map((metricId) => [
      metricId,
      contrasts(
        alg4.diagnostics.metricVector[metricId],
        alg8.diagnostics.metricVector[metricId],
        lag4.diagnostics.metricVector[metricId],
        lag8.diagnostics.metricVector[metricId],
      ),
    ]),
  ) as Readonly<
    Record<
      NoAvpdAtrialThinFilamentSlsMatrixMetricIdV1,
      ReturnType<typeof contrasts>
    >
  >;
  return {
    diagnosticsId: NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_DIAGNOSTICS_ID_V1,
    evidenceStatus:
      "report-only-factor-main-effects-and-interaction-contrasts-no-ranking" as const,
    candidateCount: candidates.length,
    allFourCandidatesPresent: byId.size === 4,
    allStructuralPass: candidates.every(
      (candidate) => candidate.diagnostics.structuralStatus === "pass",
    ),
    allReadyForBetweenCandidateDescription: candidates.every(
      (candidate) =>
        candidate.diagnostics.orbitReadback.status ===
        "ready-for-between-candidate-description",
    ),
    factorContrastDefinition: {
      slsEffectWithinAlgebraic: "ALG_SLS8-minus-ALG_SLS4" as const,
      slsEffectWithinLag25: "LAG25_SLS8-minus-LAG25_SLS4" as const,
      lag25EffectAtSls4: "LAG25_SLS4-minus-ALG_SLS4" as const,
      lag25EffectAtSls8: "LAG25_SLS8-minus-ALG_SLS8" as const,
      interaction:
        "(LAG25_SLS8-minus-LAG25_SLS4)-minus-(ALG_SLS8-minus-ALG_SLS4)" as const,
    },
    factorContrasts,
    eaTreatment: {
      retainedAsContinuousReadback: true as const,
      includedInFactorContrasts: false as const,
      objectiveApplied: false as const,
      gateApplied: false as const,
      rankingApplied: false as const,
    },
    decision: {
      winnerSelected: false as const,
      automaticPromotionAllowed: false as const,
      calibrationClaimed: false as const,
      physiologyAcceptanceApplied: false as const,
      nextStep:
        "visual-and-structural-review-then-external-candidate-selection-before-any-dt-confirmation-or-default-change" as const,
    },
  };
}

function metricVector(
  morphology: NoAvpdAtrialMorphologyOwnerScreenDiagnosticsV1,
): NoAvpdAtrialThinFilamentSlsMatrixMetricVectorV1 {
  const matched = morphology.matchedVolume;
  const aLoop = morphology.aLoopMorphology;
  const hemodynamics = morphology.hemodynamics;
  const release = morphology.valveEvents?.prescribedCalciumRelease ?? null;
  const volumeMinimum =
    morphology.valveEvents?.pressureVolumeEvents.volumeMinimum ?? null;
  const primaryPeak = aLoop?.primaryPeak ?? null;
  const laPressure = hemodynamics?.pressureMmHg.la ?? null;
  const laVolume = hemodynamics?.volumeMl.la ?? null;
  const remainingVolumeFraction =
    release == null ||
    volumeMinimum == null ||
    primaryPeak == null ||
    Math.abs(release.atrialVolumeMl - volumeMinimum.atrialVolumeMl) <= 1e-12
      ? null
      : (primaryPeak.volumeMl - volumeMinimum.atrialVolumeMl) /
        (release.atrialVolumeMl - volumeMinimum.atrialVolumeMl);
  return {
    matchedVolumeGapAreaMmHgMl: matched?.integratedGapAreaMmHgMl ?? null,
    matchedVolumeMeanGapMmHg: matched?.gapMmHg?.mean ?? null,
    aLoopPrimaryCornerDeg:
      aLoop?.primaryPeak?.corner?.absoluteTurnAngleDeg ?? null,
    aLoopPrimaryPeakRemainingVolumeFraction01: remainingVolumeFraction,
    aLoopOnsetToPrimaryPeakMs:
      aLoop?.onsetToPrimaryRiseKinetics.onsetToPrimaryPeakMs ?? null,
    aLoopReboundAmplitudeMmHg: aLoop?.rebound.amplitudeMmHg ?? null,
    thinFilamentRise10To90Ms:
      aLoop?.onsetToPrimaryRiseKinetics.thinFilament10To90?.rise10To90Ms ??
      null,
    lapRise10To90Ms:
      aLoop?.onsetToPrimaryRiseKinetics.lapActiveRise10To90?.rise10To90Ms ??
      null,
    laPressureRangeMmHg:
      laPressure == null ? null : laPressure.maximum - laPressure.minimum,
    laVolumeRangeMl:
      laVolume == null ? null : laVolume.maximum - laVolume.minimum,
  };
}

function requireCandidate<T>(
  byId: ReadonlyMap<NoAvpdAtrialThinFilamentSlsCandidateIdV1, T>,
  candidateId: NoAvpdAtrialThinFilamentSlsCandidateIdV1,
): T {
  const candidate = byId.get(candidateId);
  if (candidate == null)
    throw new Error(`missing matrix candidate: ${candidateId}`);
  return candidate;
}

function contrasts(
  alg4: number | null,
  alg8: number | null,
  lag4: number | null,
  lag8: number | null,
) {
  if (alg4 == null || alg8 == null || lag4 == null || lag8 == null) {
    return {
      availability: "unavailable-missing-candidate-metric" as const,
      slsEffectWithinAlgebraic: null,
      slsEffectWithinLag25: null,
      lag25EffectAtSls4: null,
      lag25EffectAtSls8: null,
      interaction: null,
    };
  }
  const slsEffectWithinAlgebraic = alg8 - alg4;
  const slsEffectWithinLag25 = lag8 - lag4;
  return {
    availability: "available" as const,
    slsEffectWithinAlgebraic,
    slsEffectWithinLag25,
    lag25EffectAtSls4: lag4 - alg4,
    lag25EffectAtSls8: lag8 - alg8,
    interaction: slsEffectWithinLag25 - slsEffectWithinAlgebraic,
  };
}
