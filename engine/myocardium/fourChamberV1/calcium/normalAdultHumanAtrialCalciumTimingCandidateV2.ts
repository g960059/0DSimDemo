import {
  exactEventCalciumNormalizationV1,
  validateExactEventCalciumParametersV1,
  type ExactEventCalciumParametersV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";

export const NORMAL_ADULT_HUMAN_ATRIAL_CALCIUM_TIMING_CANDIDATE_V2_ID =
  "normal-adult-human-atrial-calcium-timing-candidate-v2" as const;
export const NORMAL_ADULT_HUMAN_ATRIAL_CALCIUM_TIMING_CANDIDATE_V2_CLAIM_BOUNDARY =
  "human-atrial-timing-range-bounded-biexponential-candidate-not-digitized-trace-amplitude-not-identified" as const;

/**
 * Literature timing evidence used by this candidate. The reported Table 2
 * intervals aggregate human atrial Ca2+ measurements at 37 degrees C. They
 * constrain timing only: neither the retained 0.5 uM amplitude nor the 12 ms
 * electrical-to-calcium delay is identified by this source.
 */
export const NORMAL_ADULT_HUMAN_ATRIAL_CALCIUM_TIMING_EVIDENCE_V2 = deepFreeze({
  sourceDoi: "10.1113/JP283974" as const,
  sourceLocator: "Mazhar-et-al-J-Physiol-2024-Table-2" as const,
  speciesAndPreparation: "human-atrial-myocyte-aggregated-measurements" as const,
  temperatureC: 37 as const,
  reportedTimingRangesMs: {
    timeToPeakCa: { minimum: 49.4, maximum: 55.6 },
    postPeakRelaxationTime50Ca: { minimum: 168.5, maximum: 186.5 },
    totalTransientTimeCa: { minimum: 508.1, maximum: 570.1 },
  },
  waveformTraceDigitized: false as const,
  calciumAmplitudeIdentified: false as const,
  electricalToCalciumDelayIdentified: false as const,
  totalTransientInterpretation:
    "onset-to-10-percent-TT90-is-a-surrogate-for-reported-TT_Ca-not-an-identity" as const,
});

/**
 * Only the two timing constants differ from the preceding normal-adult atrial
 * candidate. Baseline calcium, amplitude, and electrical delay are retained
 * to isolate a literature-bounded timing alternative; their values are not
 * claimed as measurements from Mazhar et al.
 */
export const NORMAL_ADULT_HUMAN_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_V2:
Readonly<ExactEventCalciumParametersV1> = deepFreeze({
  tauRiseSec: 0.020,
  tauDecaySec: 0.215,
  calciumDiastolicUM: 0.1,
  calciumAmplitudeUM: 0.5,
  electricalToCalciumDelaySec: 0.012,
  status: "candidate-prior",
  evidenceId:
    "mazhar-j-physiol-2024-table2-37c-human-atrial-timing-biexponential-candidate-v2",
});

export type NormalAdultHumanAtrialCalciumTimingMetricsV2 = Readonly<{
  timeToPeakSec: number;
  postPeakRelaxationTime50Sec: number;
  timeToTenPercentFromOnsetSec: number;
  postPeakRelaxationTime90Sec: number;
  normalization: number;
}>;

export type NormalAdultHumanAtrialCalciumTimingCandidateAuditV2 = Readonly<{
  candidateId: typeof NORMAL_ADULT_HUMAN_ATRIAL_CALCIUM_TIMING_CANDIDATE_V2_ID;
  status: "candidate-prior";
  claimBoundary:
    typeof NORMAL_ADULT_HUMAN_ATRIAL_CALCIUM_TIMING_CANDIDATE_V2_CLAIM_BOUNDARY;
  parameters: typeof NORMAL_ADULT_HUMAN_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_V2;
  evidence: typeof NORMAL_ADULT_HUMAN_ATRIAL_CALCIUM_TIMING_EVIDENCE_V2;
  unscaledBiexponentialMetrics: NormalAdultHumanAtrialCalciumTimingMetricsV2;
  acceptance: Readonly<{
    timeToPeakWithinReportedRange: boolean;
    postPeakRelaxationTime50WithinReportedRange: boolean;
    tt90SurrogateWithinReportedTtCaRange: boolean;
    allTimingMetricsWithinReportedRanges: boolean;
    tt90IsOnlySurrogateForReportedTtCa: true;
    pvLoopOrClosedLoopMetricUsed: false;
  }>;
  retainedUnidentifiedValues: Readonly<{
    calciumDiastolicUM: 0.1;
    calciumAmplitudeUM: 0.5;
    electricalToCalciumDelaySec: 0.012;
    amplitudeClaimedAsMeasured: false;
    delayClaimedAsMeasured: false;
  }>;
}>;

/**
 * Computes timing directly from the unscaled exact-event biexponential
 * g(t)=exp(-t/tauDecay)-exp(-t/tauRise). Fixed-iteration bisection makes the
 * post-peak threshold crossings deterministic and independent of integration
 * step size, amplitude, baseline calcium, and any chamber observable.
 */
export function computeUnscaledExactEventCalciumTimingMetricsV2(
  parameters: ExactEventCalciumParametersV1,
): NormalAdultHumanAtrialCalciumTimingMetricsV2 {
  validateExactEventCalciumParametersV1(parameters);
  const { peakTimeSec, normalization } = exactEventCalciumNormalizationV1(parameters);
  const halfDecayTimeSec = solvePostPeakFractionTime(parameters, peakTimeSec, normalization, 0.5);
  const tenPercentTimeSec = solvePostPeakFractionTime(
    parameters,
    peakTimeSec,
    normalization,
    0.1,
  );
  return Object.freeze({
    timeToPeakSec: peakTimeSec,
    postPeakRelaxationTime50Sec: halfDecayTimeSec - peakTimeSec,
    timeToTenPercentFromOnsetSec: tenPercentTimeSec,
    postPeakRelaxationTime90Sec: tenPercentTimeSec - peakTimeSec,
    normalization,
  });
}

export function buildNormalAdultHumanAtrialCalciumTimingCandidateAuditV2():
NormalAdultHumanAtrialCalciumTimingCandidateAuditV2 {
  const parameters = NORMAL_ADULT_HUMAN_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_V2;
  const metrics = computeUnscaledExactEventCalciumTimingMetricsV2(parameters);
  const ranges = NORMAL_ADULT_HUMAN_ATRIAL_CALCIUM_TIMING_EVIDENCE_V2
    .reportedTimingRangesMs;
  const timeToPeakWithinReportedRange = withinRange(
    metrics.timeToPeakSec * 1000,
    ranges.timeToPeakCa,
  );
  const postPeakRelaxationTime50WithinReportedRange = withinRange(
    metrics.postPeakRelaxationTime50Sec * 1000,
    ranges.postPeakRelaxationTime50Ca,
  );
  const tt90SurrogateWithinReportedTtCaRange = withinRange(
    metrics.timeToTenPercentFromOnsetSec * 1000,
    ranges.totalTransientTimeCa,
  );
  const allTimingMetricsWithinReportedRanges = timeToPeakWithinReportedRange
    && postPeakRelaxationTime50WithinReportedRange
    && tt90SurrogateWithinReportedTtCaRange;
  if (!allTimingMetricsWithinReportedRanges) {
    throw new Error("Normal-adult human atrial calcium V2 timing candidate is outside its evidence ranges");
  }
  return deepFreeze({
    candidateId: NORMAL_ADULT_HUMAN_ATRIAL_CALCIUM_TIMING_CANDIDATE_V2_ID,
    status: "candidate-prior" as const,
    claimBoundary:
      NORMAL_ADULT_HUMAN_ATRIAL_CALCIUM_TIMING_CANDIDATE_V2_CLAIM_BOUNDARY,
    parameters,
    evidence: NORMAL_ADULT_HUMAN_ATRIAL_CALCIUM_TIMING_EVIDENCE_V2,
    unscaledBiexponentialMetrics: metrics,
    acceptance: {
      timeToPeakWithinReportedRange,
      postPeakRelaxationTime50WithinReportedRange,
      tt90SurrogateWithinReportedTtCaRange,
      allTimingMetricsWithinReportedRanges,
      tt90IsOnlySurrogateForReportedTtCa: true as const,
      pvLoopOrClosedLoopMetricUsed: false as const,
    },
    retainedUnidentifiedValues: {
      calciumDiastolicUM: 0.1 as const,
      calciumAmplitudeUM: 0.5 as const,
      electricalToCalciumDelaySec: 0.012 as const,
      amplitudeClaimedAsMeasured: false as const,
      delayClaimedAsMeasured: false as const,
    },
  });
}

function solvePostPeakFractionTime(
  parameters: ExactEventCalciumParametersV1,
  peakTimeSec: number,
  normalization: number,
  fraction: number,
): number {
  if (!(fraction > 0 && fraction < 1)) {
    throw new Error("Post-peak calcium fraction must lie strictly between zero and one");
  }
  let lower = peakTimeSec;
  let upper = peakTimeSec + parameters.tauDecaySec;
  while (normalizedTransientAt(upper, parameters, normalization) > fraction) {
    upper = peakTimeSec + 2 * (upper - peakTimeSec);
    if (!Number.isFinite(upper) || upper > 100 * parameters.tauDecaySec) {
      throw new Error("Could not bracket post-peak calcium threshold crossing");
    }
  }
  for (let iteration = 0; iteration < 96; iteration += 1) {
    const midpoint = 0.5 * (lower + upper);
    if (normalizedTransientAt(midpoint, parameters, normalization) > fraction) {
      lower = midpoint;
    } else {
      upper = midpoint;
    }
  }
  return 0.5 * (lower + upper);
}

function normalizedTransientAt(
  timeSec: number,
  parameters: ExactEventCalciumParametersV1,
  normalization: number,
): number {
  return (
    Math.exp(-timeSec / parameters.tauDecaySec)
    - Math.exp(-timeSec / parameters.tauRiseSec)
  ) / normalization;
}

function withinRange(
  value: number,
  range: Readonly<{ minimum: number; maximum: number }>,
): boolean {
  return value >= range.minimum && value <= range.maximum;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
