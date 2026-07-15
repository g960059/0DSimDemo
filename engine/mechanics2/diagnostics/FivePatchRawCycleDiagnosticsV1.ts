import {
  measureLaPvTwoLobesV2,
  type LaPvLobeMeasurementV2,
  type LaPvLobePhaseV2,
} from "@/engine/mechanics2/diagnostics/LaPvLobeMeasurementV2";

export const FIVE_PATCH_RAW_CYCLE_DIAGNOSTICS_ID_V1 =
  "five-patch-raw-cycle-diagnostics-v1" as const;

/**
 * Minimal structural sample accepted by the raw-cycle diagnostics.
 *
 * Both the structural bench sample and the envelope runner's retained accepted
 * endpoint sample satisfy this contract without conversion.  Activation is
 * optional because true-lobe topology remains geometric; when present it is
 * used only to identify which of the two measured branches is the A lobe.
 */
export type FivePatchRawCycleDiagnosticSampleV1 = {
  readonly timeSec: number;
  readonly phase01: number;
  readonly volumesMl: {
    readonly leftAtriumMl: number;
    readonly leftVentricleMl: number;
    readonly rightAtriumMl: number;
    readonly rightVentricleMl: number;
  };
  readonly pressuresMmHg: {
    readonly leftAtriumMmHg: number;
    readonly leftVentricleMmHg: number;
  };
  readonly flowsMlPerSec: {
    readonly mitralMlPerSec: number;
  };
  readonly activations01?: Readonly<Record<string, number>>;
  readonly walls?: {
    readonly leftAtrium?: {
      readonly activation01: number;
    };
  };
};

type PhaseSegmentV1 = {
  readonly startPhase01: number;
  readonly endPhase01: number;
  readonly wrapsCycleBoundary: boolean;
  readonly durationFraction: number;
};

type UnwrappedSampleV1 = {
  readonly phase: number;
  readonly sample: FivePatchRawCycleDiagnosticSampleV1;
};

type FlowPointV1 = {
  readonly phase: number;
  readonly flowMlPerSec: number;
};

type PressurePointV1 = {
  readonly phase01: number;
  readonly pressureMmHg: number;
  readonly volumeMl: number;
};

/**
 * Report-only morphology readback from one raw, uniformly sampled cycle.
 *
 * No smoothing, resampling, reference-shape distance, physiology threshold, or
 * winner score is applied here.  Failed numerical runs must remain unavailable
 * rather than being converted into adverse morphology.
 */
export function summarizeFivePatchRawCycleDiagnosticsV1(
  samples: readonly FivePatchRawCycleDiagnosticSampleV1[],
  leftAtrialPrescribedCalciumEventOnsetPhase01: number,
  options: {
    readonly periodicityEstablished?: boolean;
  } = {},
) {
  const grid = validateAndCanonicalizeRawCycle(samples);
  if (grid.valid === false) return unavailable(grid.reason);
  const ordered = grid.samples;
  const activationPhase = normalizePhase(
    leftAtrialPrescribedCalciumEventOnsetPhase01,
  );
  const openingCrossings = pressureGradientCrossings(ordered, "up");
  const closureCrossings = pressureGradientCrossings(ordered, "down");
  const mvo = latestCrossingBefore(openingCrossings, activationPhase);
  const mvc = earliestCrossingAfter(closureCrossings, activationPhase);
  if (
    mvo == null ||
    mvc == null ||
    !(mvo < activationPhase && activationPhase < mvc) ||
    activationPhase - mvo >= 1 ||
    mvc - activationPhase >= 1
  ) {
    const leftAtrialPvLobes = summarizeLeftAtrialPvLobesWithoutEventAnchors(
      ordered,
      options.periodicityEstablished,
    );
    return {
      ...unavailable(
        "missing-ordered-gradient-up-Ca-event-gradient-down-anchors",
      ),
      leftAtrialPvLobes,
      eventCounts: Object.freeze({
        lapMinusLvpGradientUpCrossings: openingCrossings.length,
        lapMinusLvpGradientDownCrossings: closureCrossings.length,
      }),
    };
  }

  const phaseSegments = Object.freeze({
    reservoirGradientProxy: phaseSegment(mvc - 1, mvo),
    conduitGradientProxy: phaseSegment(mvo, activationPhase),
    prescribedCalciumToClosureProxy: phaseSegment(activationPhase, mvc),
  });
  const unwrapped = unwrapSamples(ordered);
  const mitralInflow = identifyMitralInflow(
    unwrapped,
    mvo,
    activationPhase,
    mvc,
  );
  const periodicityEstablished = options.periodicityEstablished === true;
  const x = periodicityEstablished
    ? extremumInInterval(unwrapped, mvc - 1, mvo, "minimum")
    : null;
  const v = x == null
    ? null
    : extremumInInterval(unwrapped, x.phase, mvo, "maximum");
  const y = extremumInInterval(
    unwrapped,
    mvo,
    activationPhase,
    "minimum",
  );
  const pumping = samplesInInterval(unwrapped, activationPhase, mvc);
  const aPressurePeak = maximumBy(
    pumping,
    (entry) => entry.sample.pressuresMmHg.leftAtriumMmHg,
  );
  const aVolumeMinimum = minimumBy(
    pumping,
    (entry) => entry.sample.volumesMl.leftAtriumMl,
  );
  const calciumAnchorPressure = interpolatePressure(unwrapped, activationPhase);
  const calciumAnchorVolume = interpolateVolume(unwrapped, activationPhase);
  const activeEmptyingVolumeMl = calciumAnchorVolume == null || aVolumeMinimum == null
    ? null
    : calciumAnchorVolume -
      aVolumeMinimum.sample.volumesMl.leftAtriumMl;
  const pressurePeakRemainingRatio =
    aPressurePeak == null ||
      aVolumeMinimum == null ||
      activeEmptyingVolumeMl == null ||
      activeEmptyingVolumeMl <= 0
      ? null
      : (aPressurePeak.sample.volumesMl.leftAtriumMl -
          aVolumeMinimum.sample.volumesMl.leftAtriumMl) /
        activeEmptyingVolumeMl;
  const postPeakDescent = aPressurePeak == null
    ? null
    : strictPairedDescentFraction(
        samplesInInterval(unwrapped, aPressurePeak.phase, mvc),
      );
  const leftAtrialPvLobes = summarizeLeftAtrialPvLobes(
    ordered,
    mvo,
    activationPhase,
    mvc,
    options.periodicityEstablished,
  );

  const laMin = minimumBy(ordered, (sample) => sample.volumesMl.leftAtriumMl)!;
  const laMax = maximumBy(ordered, (sample) => sample.volumesMl.leftAtriumMl)!;
  const lvMin = minimumBy(ordered, (sample) => sample.volumesMl.leftVentricleMl)!;
  const lvMax = maximumBy(ordered, (sample) => sample.volumesMl.leftVentricleMl)!;
  const raMin = minimumBy(ordered, (sample) => sample.volumesMl.rightAtriumMl)!;
  const raMax = maximumBy(ordered, (sample) => sample.volumesMl.rightAtriumMl)!;
  const rvMin = minimumBy(ordered, (sample) => sample.volumesMl.rightVentricleMl)!;
  const rvMax = maximumBy(ordered, (sample) => sample.volumesMl.rightVentricleMl)!;

  return Object.freeze({
    diagnosticsId: FIVE_PATCH_RAW_CYCLE_DIAGNOSTICS_ID_V1,
    evidenceStatus: "report-only-no-physiology-acceptance" as const,
    availability: "available" as const,
    unavailableReason: null,
    sourceTreatment:
      "raw-final-cycle-endpoints-no-smoothing-no-reference-shape-fitting" as const,
    changesStructuralStatus: false as const,
    physiologyThresholdsApplied: false as const,
    scalarWinnerScoreComputed: false as const,
    cycleClosure: Object.freeze({
      periodicityEstablished,
      crossBoundaryReservoirWaveReadbackAvailable:
        periodicityEstablished,
      reason: periodicityEstablished
        ? ("caller-established-full-state-return-map" as const)
        : ("periodicity-not-established-cross-boundary-x-v-suppressed" as const),
    }),
    gridContract: Object.freeze({
      endpointConvention: grid.endpointConvention,
      sampleCount: ordered.length,
      cycleLengthSec: grid.cycleLengthSec,
      meanPhaseStep: grid.meanPhaseStep,
      maximumRelativePhaseStepDeviation:
        grid.maximumRelativePhaseStepDeviation,
      meanTimeStepSec: grid.meanTimeStepSec,
      maximumRelativeTimeStepDeviation:
        grid.maximumRelativeTimeStepDeviation,
      maximumRelativePhaseTimeSlopeDeviation:
        grid.maximumRelativePhaseTimeSlopeDeviation,
    }),
    events: Object.freeze({
      mitralOpeningGradientUpCrossingProxyPhase01: normalizePhase(mvo),
      leftAtrialPrescribedCalciumEventOnsetPhase01: activationPhase,
      mitralClosureGradientDownCrossingProxyPhase01: normalizePhase(mvc),
      selectionStatus:
        openingCrossings.length === 1 && closureCrossings.length === 1
          ? ("unique-crossing-pair" as const)
          : ("multiple-crossings-protocol-anchor-selection" as const),
      selectionRule:
        "latest-LAP-minus-LVP-up-crossing-before-Ca-event-and-earliest-down-crossing-after-Ca-event" as const,
      eventCounts: Object.freeze({
        lapMinusLvpGradientUpCrossings: openingCrossings.length,
        lapMinusLvpGradientDownCrossings: closureCrossings.length,
      }),
    }),
    phaseSegments,
    mitralInflow,
    pressureWaves: Object.freeze({
      xTrough: pressureReport(x),
      vPeak: pressureReport(v),
      yTrough: pressureReport(y),
      prescribedCaAnchorToXTroughDropMmHg:
        x == null || calciumAnchorPressure == null
          ? null
          : calciumAnchorPressure - x.sample.pressuresMmHg.leftAtriumMmHg,
      aPressurePeakToPreviousCycleXTroughDropMmHg:
        x == null || aPressurePeak == null
          ? null
          : aPressurePeak.sample.pressuresMmHg.leftAtriumMmHg -
            x.sample.pressuresMmHg.leftAtriumMmHg,
      gradientOpeningProxyToYTroughDropMmHg:
        y == null
          ? null
          : interpolatePressure(unwrapped, mvo) -
            y.sample.pressuresMmHg.leftAtriumMmHg,
      previousCycleVPeakToYTroughDropMmHg:
        v == null || y == null
          ? null
          : v.sample.pressuresMmHg.leftAtriumMmHg -
            y.sample.pressuresMmHg.leftAtriumMmHg,
    }),
    atrialPumping: Object.freeze({
      pressurePeak: pressureReport(aPressurePeak),
      volumeMinimum: pressureReport(aVolumeMinimum),
      pressurePeakRemainingEmptyingRatioUnbounded:
        pressurePeakRemainingRatio,
      pressurePeakAfterFlowPeakSec:
        aPressurePeak == null || mitralInflow.aPeak == null
          ? null
          : (aPressurePeak.phase - mitralInflow.aPeak.phase) *
            grid.cycleLengthSec,
      postPressurePeakStrictPairedPressureVolumeDescentFraction:
        postPeakDescent,
    }),
    leftAtrialPvLobes,
    chamberVolumes: Object.freeze({
      leftAtrium: range(laMin.volumesMl.leftAtriumMl, laMax.volumesMl.leftAtriumMl),
      leftVentricle: range(
        lvMin.volumesMl.leftVentricleMl,
        lvMax.volumesMl.leftVentricleMl,
      ),
      rightAtrium: range(raMin.volumesMl.rightAtriumMl, raMax.volumesMl.rightAtriumMl),
      rightVentricle: range(
        rvMin.volumesMl.rightVentricleMl,
        rvMax.volumesMl.rightVentricleMl,
      ),
    }),
    ventricularVolumeExcursionFractions01: Object.freeze({
      left:
        (lvMax.volumesMl.leftVentricleMl - lvMin.volumesMl.leftVentricleMl) /
        lvMax.volumesMl.leftVentricleMl,
      right:
        (rvMax.volumesMl.rightVentricleMl - rvMin.volumesMl.rightVentricleMl) /
        rvMax.volumesMl.rightVentricleMl,
    }),
  });
}

function unavailable(reason: string) {
  return Object.freeze({
    diagnosticsId: FIVE_PATCH_RAW_CYCLE_DIAGNOSTICS_ID_V1,
    evidenceStatus: "report-only-no-physiology-acceptance" as const,
    availability: "unavailable" as const,
    unavailableReason: reason,
    sourceTreatment:
      "raw-final-cycle-endpoints-no-smoothing-no-reference-shape-fitting" as const,
    changesStructuralStatus: false as const,
    physiologyThresholdsApplied: false as const,
    scalarWinnerScoreComputed: false as const,
    cycleClosure: null,
    events: null,
    phaseSegments: null,
    mitralInflow: null,
    pressureWaves: null,
    atrialPumping: null,
    leftAtrialPvLobes: null,
    chamberVolumes: null,
    ventricularVolumeExcursionFractions01: null,
    gridContract: null,
  });
}

function summarizeLeftAtrialPvLobesWithoutEventAnchors(
  samples: readonly FivePatchRawCycleDiagnosticSampleV1[],
  periodicityEstablished: boolean | undefined,
) {
  const measurement = measureLaPvTwoLobesV2(samples.map((sample) => ({
    laVolumeMl: sample.volumesMl.leftAtriumMl,
    laPressureMmHg: sample.pressuresMmHg.leftAtriumMmHg,
    theta: sample.phase01,
    laActivation01:
      sample.activations01?.leftAtrium ??
      sample.walls?.leftAtrium?.activation01,
  })));
  return summarizeLobeMeasurement(measurement, periodicityEstablished);
}

function summarizeLeftAtrialPvLobes(
  samples: readonly FivePatchRawCycleDiagnosticSampleV1[],
  mvo: number,
  activation: number,
  mvc: number,
  periodicityEstablished: boolean | undefined,
) {
  const measurement = measureLaPvTwoLobesV2(samples.map((sample) => ({
    laVolumeMl: sample.volumesMl.leftAtriumMl,
    laPressureMmHg: sample.pressuresMmHg.leftAtriumMmHg,
    theta: sample.phase01,
    phase: leftAtrialPvPhase(sample.phase01, mvo, activation, mvc),
    laActivation01:
      sample.activations01?.leftAtrium ??
      sample.walls?.leftAtrium?.activation01,
  })));
  return summarizeLobeMeasurement(measurement, periodicityEstablished);
}

function summarizeLobeMeasurement(
  measurement: LaPvLobeMeasurementV2,
  periodicityEstablished: boolean | undefined,
) {
  const steadyStateInterpretationEligible = periodicityEstablished === true;
  const steadyStateInterpretationUnavailableReason =
    steadyStateInterpretationEligible
      ? null
      : periodicityEstablished === false
        ? ("caller-reports-periodicity-not-established" as const)
        : ("periodicity-status-not-provided" as const);
  if (measurement.status === "not-measurable") {
    return Object.freeze({
      availability: "available" as const,
      unavailableReason: null,
      geometryEvidenceStatus: "raw-cycle-geometric-readback" as const,
      steadyStateInterpretationEligible,
      steadyStateInterpretationUnavailableReason,
      physiologyAcceptanceApplied: false as const,
      measurementStatus: measurement.status,
      measurementReason: measurement.reason,
      topologySource:
        "true-periodic-polyline-self-intersection" as const,
      selfIntersectionCount: measurement.selfIntersectionCount,
      rawSelfIntersectionCount: measurement.rawSelfIntersectionCount,
      crossingSummaryTruncated: measurement.crossingSummaryTruncated,
      trueSelfIntersection: measurement.crossing ?? null,
      selectionEvidenceSource: null,
      activationEvidenceCoverage01: null,
      aLobe: null,
      vLobe: null,
      aToVAbsoluteAreaRatioUnbounded: null,
      opposedLobeOrientation: measurement.opposedLobeOrientation,
    });
  }
  return Object.freeze({
    availability: "available" as const,
    unavailableReason: null,
    geometryEvidenceStatus: "raw-cycle-geometric-readback" as const,
    steadyStateInterpretationEligible,
    steadyStateInterpretationUnavailableReason,
    physiologyAcceptanceApplied: false as const,
    measurementStatus: measurement.status,
    measurementReason: measurement.reason,
    topologySource:
      "true-periodic-polyline-self-intersection" as const,
    selfIntersectionCount: measurement.selfIntersectionCount,
    rawSelfIntersectionCount: measurement.rawSelfIntersectionCount,
    crossingSummaryTruncated: measurement.crossingSummaryTruncated,
    trueSelfIntersection: measurement.crossing,
    selectionEvidenceSource: measurement.selectionEvidenceSource,
    activationEvidenceCoverage01: measurement.activationEvidenceCoverage01,
    aLobe: Object.freeze({
      signedAreaMmHgMl: measurement.aLobe.signedAreaMmHgMl,
      absoluteAreaMmHgMl: measurement.aLobe.areaMmHgMl,
    }),
    vLobe: Object.freeze({
      signedAreaMmHgMl: measurement.vLobe.signedAreaMmHgMl,
      absoluteAreaMmHgMl: measurement.vLobe.areaMmHgMl,
    }),
    aToVAbsoluteAreaRatioUnbounded:
      measurement.aLobe.areaMmHgMl / measurement.vLobe.areaMmHgMl,
    opposedLobeOrientation: measurement.opposedLobeOrientation,
  });
}

function leftAtrialPvPhase(
  phase01: number,
  mvo: number,
  activation: number,
  mvc: number,
): LaPvLobePhaseV2 {
  const phase = unwrapPhaseIntoCycle(phase01, mvc - 1);
  if (phase < mvo) return "reservoir";
  if (phase < activation) return "conduit";
  if (phase < mvc) return "pumping";
  return "transition";
}

function unwrapPhaseIntoCycle(phase01: number, cycleStart: number): number {
  let phase = normalizePhase(phase01);
  while (phase < cycleStart) phase += 1;
  while (phase >= cycleStart + 1) phase -= 1;
  return phase;
}

function identifyMitralInflow(
  samples: readonly UnwrappedSampleV1[],
  mvo: number,
  activation: number,
  mvc: number,
) {
  const ePeak = positiveLocalFlowPeak(samples, mvo, activation);
  const aPeak = positiveLocalFlowPeak(samples, activation, mvc);
  const interpeakMinimum = ePeak != null && aPeak != null
    ? minimumFlowInInterval(samples, ePeak.phase, aPeak.phase)
    : null;
  const twoRawLocalMaxima =
    ePeak != null &&
    aPeak != null;
  const flowAtActivation = interpolateFlow(samples, activation);
  const earlyMaximum = maximumFlowInInterval(samples, mvo, activation);
  const atrialMaximum = maximumFlowInInterval(samples, activation, mvc);
  const positiveFlowSpansCalciumAnchor =
    flowAtActivation != null &&
    flowAtActivation > 0 &&
    earlyMaximum > 0 &&
    atrialMaximum > 0;
  const eProminence =
    ePeak == null || interpeakMinimum == null || ePeak.flowMlPerSec <= 0
      ? null
      : (ePeak.flowMlPerSec - interpeakMinimum.flowMlPerSec) /
        ePeak.flowMlPerSec;
  const aProminence =
    aPeak == null || interpeakMinimum == null || aPeak.flowMlPerSec <= 0
      ? null
      : (aPeak.flowMlPerSec - interpeakMinimum.flowMlPerSec) /
        aPeak.flowMlPerSec;
  return Object.freeze({
    rawPeakTopology: twoRawLocalMaxima
      ? ("positive-local-maximum-on-each-side-of-Ca-anchor" as const)
      : positiveFlowSpansCalciumAnchor
        ? ("positive-flow-spans-Ca-anchor-without-two-raw-local-maxima" as const)
        : ("missing-positive-local-maximum-in-one-or-both-anchor-windows" as const),
    interpretationBoundary:
      "raw-grid-descriptor-no-prominence-threshold-no-separated-or-fused-physiology-label" as const,
    ePeak: flowReport(ePeak),
    aPeak: flowReport(aPeak),
    interpeakMinimum: flowReport(interpeakMinimum),
    eToAPeakRatio:
      twoRawLocalMaxima && ePeak != null && aPeak != null && aPeak.flowMlPerSec > 0
        ? ePeak.flowMlPerSec / aPeak.flowMlPerSec
        : null,
    eRelativeProminenceFromInterpeakMinimum: eProminence,
    aRelativeProminenceFromInterpeakMinimum: aProminence,
    flowAtPrescribedCalciumEventMlPerSec: flowAtActivation,
    flowAtPrescribedCalciumEventOverE:
      flowAtActivation == null || ePeak == null || ePeak.flowMlPerSec <= 0
        ? null
        : flowAtActivation / ePeak.flowMlPerSec,
  });
}

function pressureGradientCrossings(
  samples: readonly FivePatchRawCycleDiagnosticSampleV1[],
  direction: "up" | "down",
): readonly number[] {
  const cycle = samples;
  if (cycle.length < 2) return Object.freeze([]);
  const closed = [...cycle, { ...cycle[0]!, phase01: cycle[0]!.phase01 + 1 }];
  const crossings: number[] = [];
  for (let index = 1; index < closed.length; index += 1) {
    const left = closed[index - 1]!;
    const right = closed[index]!;
    const a = left.pressuresMmHg.leftAtriumMmHg -
      left.pressuresMmHg.leftVentricleMmHg;
    const b = right.pressuresMmHg.leftAtriumMmHg -
      right.pressuresMmHg.leftVentricleMmHg;
    const crosses = direction === "up" ? a <= 0 && b > 0 : a >= 0 && b < 0;
    if (!crosses) continue;
    const fraction = Math.abs(b - a) <= 1e-14 ? 0 : -a / (b - a);
    crossings.push(left.phase01 + fraction * (right.phase01 - left.phase01));
  }
  return Object.freeze(crossings);
}

function positiveLocalFlowPeak(
  samples: readonly UnwrappedSampleV1[],
  start: number,
  end: number,
): FlowPointV1 | null {
  const candidates: FlowPointV1[] = [];
  for (let index = 1; index < samples.length - 1; index += 1) {
    const entry = samples[index]!;
    if (!(entry.phase > start && entry.phase < end)) continue;
    const left = samples[index - 1]!.sample.flowsMlPerSec.mitralMlPerSec;
    const centre = entry.sample.flowsMlPerSec.mitralMlPerSec;
    const right = samples[index + 1]!.sample.flowsMlPerSec.mitralMlPerSec;
    if (
      centre > 0 &&
      ((centre >= left && centre > right) || (centre > left && centre >= right))
    ) {
      candidates.push({ phase: entry.phase, flowMlPerSec: centre });
    }
  }
  return maximumBy(candidates, (candidate) => candidate.flowMlPerSec);
}

function extremumInInterval(
  samples: readonly UnwrappedSampleV1[],
  start: number,
  end: number,
  mode: "minimum" | "maximum",
): UnwrappedSampleV1 | null {
  const selected = samplesInInterval(samples, start, end);
  const accessor = (entry: UnwrappedSampleV1) =>
    entry.sample.pressuresMmHg.leftAtriumMmHg;
  return mode === "minimum"
    ? minimumBy(selected, accessor)
    : maximumBy(selected, accessor);
}

function samplesInInterval(
  samples: readonly UnwrappedSampleV1[],
  start: number,
  end: number,
): readonly UnwrappedSampleV1[] {
  return samples.filter((entry) => entry.phase >= start && entry.phase <= end);
}

function unwrapSamples(
  samples: readonly FivePatchRawCycleDiagnosticSampleV1[],
): readonly UnwrappedSampleV1[] {
  return Object.freeze(
    [-1, 0, 1].flatMap((offset) =>
      samples.map((sample) =>
        Object.freeze({ phase: sample.phase01 + offset, sample })
      )
    ),
  );
}

function strictPairedDescentFraction(
  samples: readonly UnwrappedSampleV1[],
): number | null {
  if (samples.length < 2) return null;
  let paired = 0;
  let nonzero = 0;
  for (let index = 1; index < samples.length; index += 1) {
    const left = samples[index - 1]!.sample;
    const right = samples[index]!.sample;
    const dp = right.pressuresMmHg.leftAtriumMmHg -
      left.pressuresMmHg.leftAtriumMmHg;
    const dv = right.volumesMl.leftAtriumMl - left.volumesMl.leftAtriumMl;
    if (Math.abs(dp) <= 1e-12 || Math.abs(dv) <= 1e-12) continue;
    nonzero += 1;
    if (dp < -1e-12 && dv < -1e-12) paired += 1;
  }
  return nonzero === 0 ? null : paired / nonzero;
}

function minimumFlowInInterval(
  samples: readonly UnwrappedSampleV1[],
  start: number,
  end: number,
): FlowPointV1 | null {
  const selected = samples
    .filter((entry) => entry.phase > start && entry.phase < end)
    .map((entry) => ({
      phase: entry.phase,
      flowMlPerSec: entry.sample.flowsMlPerSec.mitralMlPerSec,
    }));
  return minimumBy(selected, (entry) => entry.flowMlPerSec);
}

function maximumFlowInInterval(
  samples: readonly UnwrappedSampleV1[],
  start: number,
  end: number,
): number {
  const selected = samples
    .filter((entry) => entry.phase > start && entry.phase < end)
    .map((entry) => entry.sample.flowsMlPerSec.mitralMlPerSec);
  return selected.length === 0 ? Number.NEGATIVE_INFINITY : Math.max(...selected);
}

function interpolateFlow(
  samples: readonly UnwrappedSampleV1[],
  phase: number,
): number | null {
  return interpolate(
    samples,
    phase,
    (sample) => sample.flowsMlPerSec.mitralMlPerSec,
  );
}

function interpolatePressure(
  samples: readonly UnwrappedSampleV1[],
  phase: number,
): number {
  return interpolate(
    samples,
    phase,
    (sample) => sample.pressuresMmHg.leftAtriumMmHg,
  ) ?? Number.NaN;
}

function interpolateVolume(
  samples: readonly UnwrappedSampleV1[],
  phase: number,
): number | null {
  return interpolate(
    samples,
    phase,
    (sample) => sample.volumesMl.leftAtriumMl,
  );
}

function interpolate(
  samples: readonly UnwrappedSampleV1[],
  phase: number,
  value: (sample: FivePatchRawCycleDiagnosticSampleV1) => number,
): number | null {
  for (let index = 1; index < samples.length; index += 1) {
    const left = samples[index - 1]!;
    const right = samples[index]!;
    if (left.phase <= phase && phase <= right.phase) {
      const width = right.phase - left.phase;
      const fraction = width <= 1e-14 ? 0 : (phase - left.phase) / width;
      return value(left.sample) + fraction *
        (value(right.sample) - value(left.sample));
    }
  }
  return null;
}

function pressureReport(entry: UnwrappedSampleV1 | null): PressurePointV1 | null {
  return entry == null
    ? null
    : Object.freeze({
        phase01: normalizePhase(entry.phase),
        pressureMmHg: entry.sample.pressuresMmHg.leftAtriumMmHg,
        volumeMl: entry.sample.volumesMl.leftAtriumMl,
      });
}

function flowReport(entry: FlowPointV1 | null) {
  return entry == null
    ? null
    : Object.freeze({
        phase: entry.phase,
        phase01: normalizePhase(entry.phase),
        flowMlPerSec: entry.flowMlPerSec,
      });
}

function phaseSegment(start: number, end: number): PhaseSegmentV1 {
  const startPhase01 = normalizePhase(start);
  const endPhase01 = normalizePhase(end);
  return Object.freeze({
    startPhase01,
    endPhase01,
    wrapsCycleBoundary: startPhase01 > endPhase01,
    durationFraction: end - start,
  });
}

function latestCrossingBefore(
  crossings: readonly number[],
  reference: number,
): number | null {
  if (crossings.length === 0) return null;
  return Math.max(...crossings.map((phase) => phase < reference ? phase : phase - 1));
}

function earliestCrossingAfter(
  crossings: readonly number[],
  reference: number,
): number | null {
  if (crossings.length === 0) return null;
  return Math.min(...crossings.map((phase) => phase > reference ? phase : phase + 1));
}

function range(minimum: number, maximum: number) {
  return Object.freeze({ minimum, maximum, excursion: maximum - minimum });
}

type RawCycleGridValidationV1 =
  | {
      readonly valid: true;
      readonly samples: readonly FivePatchRawCycleDiagnosticSampleV1[];
      readonly endpointConvention:
        | "right-closed-(0,1]"
        | "left-closed-[0,1)"
        | "uniform-phase-offset";
      readonly cycleLengthSec: number;
      readonly meanPhaseStep: number;
      readonly maximumRelativePhaseStepDeviation: number;
      readonly meanTimeStepSec: number;
      readonly maximumRelativeTimeStepDeviation: number;
      readonly maximumRelativePhaseTimeSlopeDeviation: number;
    }
  | { readonly valid: false; readonly reason: string };

function validateAndCanonicalizeRawCycle(
  samples: readonly FivePatchRawCycleDiagnosticSampleV1[],
): RawCycleGridValidationV1 {
  if (samples.length < 4) {
    return { valid: false, reason: "insufficient-raw-cycle-samples" };
  }
  if (samples.some((sample) => !finiteSample(sample))) {
    return { valid: false, reason: "non-finite-raw-cycle-sample" };
  }
  const phaseTolerance = 1e-10;
  if (samples.some((sample) =>
    sample.phase01 < -phaseTolerance || sample.phase01 > 1 + phaseTolerance
  )) {
    return { valid: false, reason: "phase-outside-unit-cycle" };
  }
  for (let index = 1; index < samples.length; index += 1) {
    if (
      !(samples[index]!.phase01 > samples[index - 1]!.phase01) ||
      !(samples[index]!.timeSec > samples[index - 1]!.timeSec)
    ) {
      return {
        valid: false,
        reason: "raw-cycle-time-and-phase-must-be-strictly-increasing",
      };
    }
  }
  const hasZero = samples.some((sample) =>
    Math.abs(sample.phase01) <= phaseTolerance
  );
  const hasOne = samples.some((sample) =>
    Math.abs(sample.phase01 - 1) <= phaseTolerance
  );
  if (hasZero && hasOne) {
    return {
      valid: false,
      reason: "duplicate-cycle-boundary-endpoints-zero-and-one",
    };
  }
  const endpointConvention = hasOne
    ? ("right-closed-(0,1]" as const)
    : hasZero
      ? ("left-closed-[0,1)" as const)
      : ("uniform-phase-offset" as const);
  const canonical = samples.map((sample) => Object.freeze({
    ...sample,
    phase01: Math.abs(sample.phase01 - 1) <= phaseTolerance
      ? 0
      : sample.phase01,
  })).sort((left, right) => left.phase01 - right.phase01);
  for (let index = 1; index < canonical.length; index += 1) {
    if (
      canonical[index]!.phase01 - canonical[index - 1]!.phase01 <=
        phaseTolerance
    ) {
      return { valid: false, reason: "duplicate-canonical-cycle-phase" };
    }
  }
  const phaseSteps = canonical.map((sample, index) => {
    const next = canonical[(index + 1) % canonical.length]!;
    return index + 1 < canonical.length
      ? next.phase01 - sample.phase01
      : next.phase01 + 1 - sample.phase01;
  });
  const meanPhaseStep = phaseSteps.reduce((sum, step) => sum + step, 0) /
    phaseSteps.length;
  const maximumRelativePhaseStepDeviation = Math.max(
    ...phaseSteps.map((step) => Math.abs(step - meanPhaseStep) / meanPhaseStep),
  );
  if (maximumRelativePhaseStepDeviation > 0.05) {
    return { valid: false, reason: "nonuniform-or-incomplete-cycle-phase-grid" };
  }
  const timeSteps = samples.slice(1).map((sample, index) =>
    sample.timeSec - samples[index]!.timeSec
  );
  const meanTimeStepSec = timeSteps.reduce((sum, step) => sum + step, 0) /
    timeSteps.length;
  const maximumRelativeTimeStepDeviation = Math.max(
    ...timeSteps.map((step) =>
      Math.abs(step - meanTimeStepSec) / meanTimeStepSec
    ),
  );
  if (maximumRelativeTimeStepDeviation > 0.05) {
    return { valid: false, reason: "nonuniform-cycle-time-grid" };
  }
  const phaseTimeSlopes = samples.slice(1).map((sample, index) => {
    const previous = samples[index]!;
    return (sample.timeSec - previous.timeSec) /
      (sample.phase01 - previous.phase01);
  });
  const cycleLengthSec = phaseTimeSlopes.reduce((sum, slope) => sum + slope, 0) /
    phaseTimeSlopes.length;
  const maximumRelativePhaseTimeSlopeDeviation = Math.max(
    ...phaseTimeSlopes.map((slope) =>
      Math.abs(slope - cycleLengthSec) / cycleLengthSec
    ),
  );
  if (maximumRelativePhaseTimeSlopeDeviation > 0.05) {
    return { valid: false, reason: "inconsistent-time-to-phase-grid-slope" };
  }
  if (!Number.isFinite(cycleLengthSec) || cycleLengthSec <= 0) {
    return { valid: false, reason: "invalid-inferred-cycle-length" };
  }
  return Object.freeze({
    valid: true as const,
    samples: Object.freeze(canonical),
    endpointConvention,
    cycleLengthSec,
    meanPhaseStep,
    maximumRelativePhaseStepDeviation,
    meanTimeStepSec,
    maximumRelativeTimeStepDeviation,
    maximumRelativePhaseTimeSlopeDeviation,
  });
}

function minimumBy<T>(
  values: readonly T[],
  accessor: (value: T) => number,
): T | null {
  if (values.length === 0) return null;
  return values.reduce((best, value) =>
    accessor(value) < accessor(best) ? value : best
  );
}

function maximumBy<T>(
  values: readonly T[],
  accessor: (value: T) => number,
): T | null {
  if (values.length === 0) return null;
  return values.reduce((best, value) =>
    accessor(value) > accessor(best) ? value : best
  );
}

function finiteSample(sample: FivePatchRawCycleDiagnosticSampleV1): boolean {
  return [
    sample.timeSec,
    sample.phase01,
    ...Object.values(sample.volumesMl),
    ...Object.values(sample.pressuresMmHg),
    ...Object.values(sample.flowsMlPerSec),
  ].every(Number.isFinite);
}

function normalizePhase(phase: number): number {
  const wrapped = phase - Math.floor(phase);
  return wrapped === 1 ? 0 : wrapped;
}
