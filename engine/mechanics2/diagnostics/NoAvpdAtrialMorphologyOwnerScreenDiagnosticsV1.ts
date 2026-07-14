import type {
  NoAvpdFourChamberBenchResultV1,
  NoAvpdFourChamberBenchSampleV1,
} from "@/engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1";
import {
  evaluateOneFiberVolumeGeometryV1,
  oneFiberCavityPressurePaV1,
} from "@/engine/mechanics2/geometry/OneFiberVolumeGeometryV1";

export const NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_SCREEN_DIAGNOSTICS_ID_V1 =
  "no-avpd-atrial-morphology-owner-screen-diagnostics-v1" as const;

type CyclePointV1 = {
  readonly phase01: number;
  readonly sample: NoAvpdFourChamberBenchSampleV1;
};

type PumpingPointV1 = CyclePointV1 & {
  readonly unwrappedPhase01: number;
};

type LeftDiagnosticsV1 = NonNullable<
  NoAvpdFourChamberBenchResultV1["reportOnlyEventResolvedDiagnostics"]["left"]
>;

type EventPointV1 = NonNullable<
  LeftDiagnosticsV1["pressureVolumeEvents"]["aPeak"]
>;

type GeometryParamsV1 =
  NoAvpdFourChamberBenchResultV1["parameterSnapshot"]["atria"]["left"]["geometry"];

type PathPointV1 = {
  readonly phase01: number;
  readonly volumeMl: number;
  readonly pressureMmHg: number;
  readonly passiveStressKPa: number;
  readonly seriesTensionKPa: number;
  readonly slsOverstressKPa: number;
};

type MatchedPointV1 = {
  readonly volumeMl: number;
  readonly totalGapMmHg: number;
  readonly passiveGapMmHg: number;
  readonly seriesGapMmHg: number;
  readonly slsGapMmHg: number;
  readonly reconstructedGapMmHg: number;
  readonly reconstructionResidualMmHg: number;
};

export type NoAvpdAtrialMorphologyOwnerScreenDiagnosticsV1 = ReturnType<
  typeof summarizeNoAvpdAtrialMorphologyOwnerScreenDiagnosticsV1
>;

export function summarizeNoAvpdAtrialMorphologyOwnerScreenDiagnosticsV1(
  report: NoAvpdFourChamberBenchResultV1,
) {
  const cycle = finalCompleteCycle(report);
  const left = report.reportOnlyEventResolvedDiagnostics.left;
  const mvo = left?.valveTransitions.modelHalfOpen.opening ?? null;
  const mvc = left?.valveTransitions.modelHalfOpen.closure ?? null;
  const volumeMinimum = left?.pressureVolumeEvents.volumeMinimum ?? null;
  const calciumRelease = left?.prescribedCalciumReleaseOnset ?? null;
  const requiredEventsAvailable =
    mvo != null &&
    mvc != null &&
    volumeMinimum != null &&
    calciumRelease != null;
  const availability =
    report.status !== "pass"
      ? "unavailable-source-structural-fail"
      : cycle == null
        ? "unavailable-complete-raw-cycle"
        : left == null
          ? "unavailable-left-event-diagnostics"
          : !requiredEventsAvailable
            ? "unavailable-required-left-events"
            : "available";
  const base = {
    diagnosticsId: NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_SCREEN_DIAGNOSTICS_ID_V1,
    evidenceStatus:
      "report-only-owner-localization-no-physiology-thresholds-or-winner" as const,
    availability,
    sampleTreatment:
      "one-complete-anchor-cycle-every-accepted-step-raw-no-smoothing-no-decimation" as const,
    matchedVolumeMethod:
      "raw-piecewise-linear-unique-segment-intersections-no-isotonic-regression" as const,
    physiologyThresholdsApplied: false as const,
    changesStructuralStatus: false as const,
    scalarWinnerScoreApplied: false as const,
    eaSeparationObjectiveApplied: false as const,
    eaSeparationGateApplied: false as const,
    sourceDtStatus: {
      screeningDtSec: report.dtSec,
      sourceTimeStepRefinementPerformed:
        report.runProtocol.timeStepRefinementPerformed,
      confirmationDtSec: 0.0025,
      confirmationEligibility:
        "externally-promoted-single-candidate-only" as const,
      confirmationStatus: "not-run-no-candidate-promoted" as const,
    },
    valveEvents: left == null ? null : summarizeValveEvents(left),
    continuousEaReadback: left == null ? null : summarizeContinuousEa(left),
  };
  if (
    cycle == null ||
    left == null ||
    mvo == null ||
    mvc == null ||
    volumeMinimum == null ||
    calciumRelease == null
  ) {
    return {
      ...base,
      matchedVolume: null,
      aLoopMorphology: null,
      mvcSeriesFraction: null,
      hemodynamics: null,
    };
  }
  const geometry = report.parameterSnapshot.atria.left.geometry;
  return {
    ...base,
    matchedVolume: summarizeMatchedVolume(
      cycle,
      volumeMinimum,
      mvo,
      calciumRelease,
      geometry,
    ),
    aLoopMorphology: summarizeALoopMorphology(
      cycle,
      calciumRelease,
      volumeMinimum,
      mvc,
      report.runProtocol.cycleLengthSec,
      geometry,
    ),
    mvcSeriesFraction: summarizeMvcSeriesFraction(cycle, mvc, geometry),
    hemodynamics: summarizeHemodynamics(
      cycle,
      report.runProtocol.cycleLengthSec,
      report.reportOnlyPhysiology,
    ),
  };
}

function summarizeValveEvents(left: LeftDiagnosticsV1) {
  const pair = (
    value: LeftDiagnosticsV1["valveTransitions"]["modelHalfOpen"],
  ) => ({
    opening: value.opening,
    closure: value.closure,
    upwardCrossingCount: value.upwardCrossingCount,
    downwardCrossingCount: value.downwardCrossingCount,
    selectionStatus: value.selectionStatus,
  });
  return {
    evidenceStatus:
      "operational-smooth-valve-events-not-clinical-leaflet-events" as const,
    modelHalfOpen: pair(left.valveTransitions.modelHalfOpen),
    pressureCrossover: pair(left.valveTransitions.pressureCrossover),
    flowZero: pair(left.valveTransitions.flowZero),
    scheduledActivation: left.scheduledActivationEvent,
    prescribedCalciumRelease: left.prescribedCalciumReleaseOnset,
    pressureVolumeEvents: left.pressureVolumeEvents,
  };
}

function summarizeContinuousEa(left: LeftDiagnosticsV1) {
  const e = left.inflowEvents.ePeak;
  const valley = left.inflowEvents.aStartInterpeakMinimum;
  const a = left.inflowEvents.aPeak;
  return {
    evidenceStatus:
      "continuous-readback-only-no-ea-separation-classification-objective-or-gate" as const,
    objectiveApplied: false as const,
    gateApplied: false as const,
    status: left.inflowSeparationReadback.status,
    ePeak: e,
    interpeakMinimum: valley,
    aPeak: a,
    eToA:
      e == null || a == null
        ? null
        : safeRatio(
            e.atrioventricularFlowMlPerSec,
            a.atrioventricularFlowMlPerSec,
          ),
    interpeakMinimumOverE:
      left.inflowSeparationReadback.interpeakMinimumOverEPeak,
    interpeakMinimumOverA:
      valley == null || a == null
        ? null
        : safeRatio(
            valley.atrioventricularFlowMlPerSec,
            a.atrioventricularFlowMlPerSec,
          ),
    flowAtCalciumReleaseOverE:
      left.inflowSeparationReadback.flowAtCalciumReleaseOverEPeak,
    flowAtAStartOverE: left.inflowSeparationReadback.flowAtAStartOverEPeak,
    ePeakProminenceOverMinimumMlPerSec:
      left.inflowSeparationReadback.ePeakProminenceOverInterpeakMinimumMlPerSec,
    aPeakProminenceOverMinimumMlPerSec:
      left.inflowSeparationReadback.aPeakProminenceOverInterpeakMinimumMlPerSec,
    durationBelowValveNumericalRegularizationScaleSec:
      left.inflowSeparationReadback
        .durationBelowNumericalRegularizationScaleSec,
  };
}

function summarizeMatchedVolume(
  cycle: readonly CyclePointV1[],
  volumeMinimum: EventPointV1,
  mvo: EventPointV1,
  calciumRelease: EventPointV1,
  geometry: GeometryParamsV1,
) {
  const path = cycle.map(({ phase01, sample }) => ({
    phase01,
    volumeMl: sample.volumesMl.leftAtriumMl,
    pressureMmHg: sample.pressuresMmHg.la,
    passiveStressKPa: sample.wallReadback.la.passiveStressKPa,
    seriesTensionKPa: sample.wallReadback.la.seriesTensionKPa,
    slsOverstressKPa: sample.wallReadback.la.slsOverstressKPa,
  }));
  const reservoir = branch(path, volumeMinimum.phase01, mvo.phase01);
  const conduit = branch(path, mvo.phase01, calciumRelease.phase01);
  const unavailable = (
    reason: "unavailable-branch-samples" | "unavailable-no-volume-overlap",
    overlapWidthMl: number | null,
  ) => ({
    availability: reason,
    branchDefinition: {
      reservoir: "la-volume-minimum-to-mvo50" as const,
      conduit: "mvo50-to-prescribed-la-calcium-release" as const,
      gap: "reservoir-minus-conduit-at-the-same-la-blood-volume" as const,
    },
    targetCount: 41,
    validTargetCount: 0,
    ambiguousTargetCount: 0,
    overlapWidthMl,
    reservoirVolumeReversalMl: volumeReversal(reservoir),
    conduitVolumeReversalMl: volumeReversal(conduit),
    gapMmHg: null,
    positiveGapFraction01: null,
    integratedGapAreaMmHgMl: null,
    componentSummary: null,
    reconstructionResidual: null,
    trace: [] as readonly MatchedPointV1[],
  });
  if (reservoir.length < 2 || conduit.length < 2) {
    return unavailable("unavailable-branch-samples", null);
  }
  const low = Math.max(
    minimum(reservoir.map((point) => point.volumeMl)),
    minimum(conduit.map((point) => point.volumeMl)),
  );
  const high = Math.min(
    maximum(reservoir.map((point) => point.volumeMl)),
    maximum(conduit.map((point) => point.volumeMl)),
  );
  if (!(high > low)) {
    return unavailable("unavailable-no-volume-overlap", 0);
  }
  const targets = Array.from(
    { length: 41 },
    (_, index) => low + ((high - low) * (index + 1)) / 42,
  );
  const trace: MatchedPointV1[] = [];
  let ambiguousTargetCount = 0;
  for (const volumeMl of targets) {
    const reservoirStates = statesAtVolume(reservoir, volumeMl);
    const conduitStates = statesAtVolume(conduit, volumeMl);
    if (reservoirStates.length !== 1 || conduitStates.length !== 1) {
      ambiguousTargetCount += 1;
      continue;
    }
    const reservoirState = reservoirStates[0]!;
    const conduitState = conduitStates[0]!;
    const pressureFactor = oneFiberPressureFactorMmHgPerKPa(volumeMl, geometry);
    const totalGapMmHg =
      reservoirState.pressureMmHg - conduitState.pressureMmHg;
    const passiveGapMmHg =
      (reservoirState.passiveStressKPa - conduitState.passiveStressKPa) *
      pressureFactor;
    const seriesGapMmHg =
      (reservoirState.seriesTensionKPa - conduitState.seriesTensionKPa) *
      pressureFactor;
    const slsGapMmHg =
      (reservoirState.slsOverstressKPa - conduitState.slsOverstressKPa) *
      pressureFactor;
    const reconstructedGapMmHg = passiveGapMmHg + seriesGapMmHg + slsGapMmHg;
    trace.push({
      volumeMl,
      totalGapMmHg,
      passiveGapMmHg,
      seriesGapMmHg,
      slsGapMmHg,
      reconstructedGapMmHg,
      reconstructionResidualMmHg: totalGapMmHg - reconstructedGapMmHg,
    });
  }
  const componentSummary = (selector: (point: MatchedPointV1) => number) => {
    const values = trace.map(selector);
    return values.length === 0
      ? null
      : {
          minimumMmHg: minimum(values),
          meanMmHg: mean(values),
          medianMmHg: median(values),
          maximumMmHg: maximum(values),
          integratedAreaMmHgMl:
            trace.length < 2
              ? null
              : trapezoid(
                  trace.map(
                    (point) => [point.volumeMl, selector(point)] as const,
                  ),
                ),
        };
  };
  const gapValues = trace.map((point) => point.totalGapMmHg);
  const residualValues = trace.map((point) => point.reconstructionResidualMmHg);
  return {
    availability:
      trace.length >= 2
        ? ("available" as const)
        : ("unavailable-nonunique-volume-intersections" as const),
    branchDefinition: {
      reservoir: "la-volume-minimum-to-mvo50" as const,
      conduit: "mvo50-to-prescribed-la-calcium-release" as const,
      gap: "reservoir-minus-conduit-at-the-same-la-blood-volume" as const,
    },
    targetCount: targets.length,
    validTargetCount: trace.length,
    ambiguousTargetCount,
    overlapWidthMl: high - low,
    reservoirVolumeReversalMl: volumeReversal(reservoir),
    conduitVolumeReversalMl: volumeReversal(conduit),
    gapMmHg:
      gapValues.length === 0
        ? null
        : {
            minimum: minimum(gapValues),
            mean: mean(gapValues),
            median: median(gapValues),
            maximum: maximum(gapValues),
          },
    positiveGapFraction01:
      gapValues.length === 0
        ? null
        : gapValues.filter((value) => value > 0).length / gapValues.length,
    integratedGapAreaMmHgMl:
      trace.length < 2
        ? null
        : trapezoid(
            trace.map((point) => [point.volumeMl, point.totalGapMmHg] as const),
          ),
    componentSummary: {
      total: componentSummary((point) => point.totalGapMmHg),
      passive: componentSummary((point) => point.passiveGapMmHg),
      series: componentSummary((point) => point.seriesGapMmHg),
      sls: componentSummary((point) => point.slsGapMmHg),
      reconstructed: componentSummary((point) => point.reconstructedGapMmHg),
    },
    reconstructionResidual:
      residualValues.length === 0
        ? null
        : {
            meanMmHg: mean(residualValues),
            meanAbsoluteMmHg: mean(residualValues.map(Math.abs)),
            maximumAbsoluteMmHg: maximum(residualValues.map(Math.abs)),
          },
    trace,
  };
}

function summarizeALoopMorphology(
  cycle: readonly CyclePointV1[],
  calciumRelease: EventPointV1,
  volumeMinimum: EventPointV1,
  mvc: EventPointV1,
  cycleLengthSec: number,
  geometry: GeometryParamsV1,
) {
  const startPhase01 = calciumRelease.phase01;
  const endUnwrappedPhase01 =
    volumeMinimum.phase01 > startPhase01
      ? volumeMinimum.phase01
      : volumeMinimum.phase01 + 1;
  const window = pumpingWindow(cycle, startPhase01, endUnwrappedPhase01);
  const extrema = rawLocalExtrema(window);
  const primaryIndex = extrema.findIndex((entry) => entry.type === "maximum");
  const troughIndex =
    primaryIndex < 0
      ? -1
      : extrema.findIndex(
          (entry, index) => index > primaryIndex && entry.type === "minimum",
        );
  const lateIndex =
    troughIndex < 0
      ? -1
      : extrema.findIndex(
          (entry, index) => index > troughIndex && entry.type === "maximum",
        );
  const volumeRangeMl =
    maximum(cycle.map((point) => point.sample.volumesMl.leftAtriumMl)) -
    minimum(cycle.map((point) => point.sample.volumesMl.leftAtriumMl));
  const pressureRangeMmHg =
    maximum(cycle.map((point) => point.sample.pressuresMmHg.la)) -
    minimum(cycle.map((point) => point.sample.pressuresMmHg.la));
  const readback = (extremumIndex: number) => {
    if (extremumIndex < 0) return null;
    const entry = extrema[extremumIndex]!;
    return pumpingReadback(
      entry.point,
      window,
      entry.windowIndex,
      startPhase01,
      cycleLengthSec,
      geometry,
      volumeRangeMl,
      pressureRangeMmHg,
    );
  };
  const primaryPeak = readback(primaryIndex);
  const interveningTrough = readback(troughIndex);
  const latePeak = readback(lateIndex);
  const primaryWindowIndex =
    primaryIndex < 0 ? null : extrema[primaryIndex]!.windowIndex;
  const thinFilamentRise =
    primaryWindowIndex == null || primaryPeak == null
      ? null
      : riseKinetics10To90(
          window,
          primaryWindowIndex,
          startPhase01,
          calciumRelease.thinFilamentAvailability01,
          primaryPeak.componentReadback.thinFilamentAvailability01,
          (point) => point.sample.wallReadback.la.thinFilamentAvailability01,
          cycleLengthSec,
        );
  const lapRise =
    primaryWindowIndex == null || primaryPeak == null
      ? null
      : riseKinetics10To90(
          window,
          primaryWindowIndex,
          startPhase01,
          calciumRelease.atrialPressureMmHg,
          primaryPeak.pressureMmHg,
          (point) => point.sample.pressuresMmHg.la,
          cycleLengthSec,
        );
  const rebound =
    interveningTrough == null || latePeak == null
      ? null
      : latePeak.pressureMmHg - interveningTrough.pressureMmHg;
  const primaryFall =
    primaryPeak == null || interveningTrough == null
      ? null
      : primaryPeak.pressureMmHg - interveningTrough.pressureMmHg;
  return {
    evidenceStatus:
      "report-only-raw-local-extrema-no-reference-shape-or-physiology-gate" as const,
    windowDefinition:
      "prescribed-la-calcium-release-to-la-volume-minimum-forward-across-cycle-boundary" as const,
    extremaDefinition:
      "strict-turns-of-consecutive-raw-accepted-step-lap-vertices-endpoints-excluded" as const,
    sequenceSelection:
      "first-complete-local-maximum-minimum-maximum-sequence" as const,
    startPhase01,
    endPhase01: volumeMinimum.phase01,
    endUnwrappedPhase01,
    crossesCycleBoundary: endUnwrappedPhase01 > 1,
    mvcPhase01: mvc.phase01,
    mvcUnwrappedPhase01: unwrapAtOrAfter(mvc.phase01, startPhase01),
    rawWindowPointCount: window.length,
    localMaximumCount: extrema.filter((entry) => entry.type === "maximum")
      .length,
    localMinimumCount: extrema.filter((entry) => entry.type === "minimum")
      .length,
    sequenceAvailability:
      primaryPeak != null && interveningTrough != null && latePeak != null
        ? "available-complete-max-min-max"
        : "unavailable-no-complete-max-min-max-sequence",
    primaryPeak,
    interveningTrough,
    latePeak,
    onsetToPrimaryRiseKinetics: {
      evidenceStatus:
        "report-only-release-to-selected-primary-lap-peak-no-tissue-calibration" as const,
      onsetDefinition: "prescribed-la-calcium-release" as const,
      endpointDefinition: "selected-first-raw-local-lap-maximum" as const,
      thresholdMethod:
        "first-piecewise-linear-upward-crossing-of-10-and-90-percent-between-onset-value-and-endpoint-value" as const,
      onsetToPrimaryPeakMs:
        primaryPeak == null
          ? null
          : primaryPeak.timeFromCalciumReleaseSec * 1_000,
      thinFilament10To90: thinFilamentRise,
      lapActiveRise10To90: lapRise,
      interpretationBoundary:
        "lap-active-rise-is-observed-total-lap-rise-not-an-isolated-active-stress-component" as const,
    },
    rebound: {
      amplitudeMmHg: rebound,
      recoveryFractionOfPrimaryFall:
        rebound == null || primaryFall == null
          ? null
          : safeRatio(rebound, primaryFall),
      troughToLatePeakSec:
        interveningTrough == null || latePeak == null
          ? null
          : (latePeak.unwrappedPhase01 - interveningTrough.unwrappedPhase01) *
            cycleLengthSec,
      primaryToLatePeakPressureDifferenceMmHg:
        primaryPeak == null || latePeak == null
          ? null
          : latePeak.pressureMmHg - primaryPeak.pressureMmHg,
      primaryToLatePeakVolumeShiftMl:
        primaryPeak == null || latePeak == null
          ? null
          : latePeak.volumeMl - primaryPeak.volumeMl,
    },
  };
}

function riseKinetics10To90(
  window: readonly PumpingPointV1[],
  endpointIndex: number,
  onsetPhase01: number,
  onsetValue: number,
  endpointValue: number,
  selector: (point: PumpingPointV1) => number,
  cycleLengthSec: number,
) {
  const amplitude = endpointValue - onsetValue;
  if (!(amplitude > 0) || endpointIndex < 0 || endpointIndex >= window.length) {
    return {
      availability: "unavailable-nonpositive-rise-or-endpoint" as const,
      onsetValue,
      endpointValue,
      amplitude,
      tenPercentLevel: null,
      ninetyPercentLevel: null,
      tenPercentPhase01: null,
      ninetyPercentPhase01: null,
      onsetToTenMs: null,
      onsetToNinetyMs: null,
      rise10To90Ms: null,
    };
  }
  const tenPercentLevel = onsetValue + 0.1 * amplitude;
  const ninetyPercentLevel = onsetValue + 0.9 * amplitude;
  const trace = [
    { unwrappedPhase01: onsetPhase01, value: onsetValue },
    ...window
      .slice(0, endpointIndex + 1)
      .filter((point) => point.unwrappedPhase01 > onsetPhase01 + 1e-12)
      .map((point) => ({
        unwrappedPhase01: point.unwrappedPhase01,
        value: selector(point),
      })),
  ];
  const crossing = (level: number) => {
    for (let index = 1; index < trace.length; index += 1) {
      const left = trace[index - 1]!;
      const right = trace[index]!;
      if (left.value >= level) return left.unwrappedPhase01;
      if (right.value < level) continue;
      const span = right.value - left.value;
      const fraction =
        Math.abs(span) <= 1e-15 ? 0 : (level - left.value) / span;
      return (
        left.unwrappedPhase01 +
        (right.unwrappedPhase01 - left.unwrappedPhase01) * fraction
      );
    }
    return null;
  };
  const tenPercentPhase01 = crossing(tenPercentLevel);
  const ninetyPercentPhase01 = crossing(ninetyPercentLevel);
  const scaleMs = cycleLengthSec * 1_000;
  return {
    availability:
      tenPercentPhase01 == null || ninetyPercentPhase01 == null
        ? "unavailable-threshold-crossing"
        : "available",
    onsetValue,
    endpointValue,
    amplitude,
    tenPercentLevel,
    ninetyPercentLevel,
    tenPercentPhase01,
    ninetyPercentPhase01,
    onsetToTenMs:
      tenPercentPhase01 == null
        ? null
        : (tenPercentPhase01 - onsetPhase01) * scaleMs,
    onsetToNinetyMs:
      ninetyPercentPhase01 == null
        ? null
        : (ninetyPercentPhase01 - onsetPhase01) * scaleMs,
    rise10To90Ms:
      tenPercentPhase01 == null || ninetyPercentPhase01 == null
        ? null
        : (ninetyPercentPhase01 - tenPercentPhase01) * scaleMs,
  };
}

function rawLocalExtrema(points: readonly PumpingPointV1[]) {
  const extrema: Array<{
    readonly type: "maximum" | "minimum";
    readonly point: PumpingPointV1;
    readonly windowIndex: number;
  }> = [];
  for (let index = 1; index < points.length - 1; index += 1) {
    const before = points[index - 1]!.sample.pressuresMmHg.la;
    const current = points[index]!.sample.pressuresMmHg.la;
    const after = points[index + 1]!.sample.pressuresMmHg.la;
    if (current > before && current >= after) {
      extrema.push({
        type: "maximum",
        point: points[index]!,
        windowIndex: index,
      });
    } else if (current < before && current <= after) {
      extrema.push({
        type: "minimum",
        point: points[index]!,
        windowIndex: index,
      });
    }
  }
  return extrema;
}

function pumpingReadback(
  point: PumpingPointV1,
  window: readonly PumpingPointV1[],
  windowIndex: number,
  startPhase01: number,
  cycleLengthSec: number,
  geometry: GeometryParamsV1,
  cycleVolumeRangeMl: number,
  cyclePressureRangeMmHg: number,
) {
  const sample = point.sample;
  const wall = sample.wallReadback.la;
  const pressureFactor = oneFiberPressureFactorMmHgPerKPa(
    sample.volumesMl.leftAtriumMl,
    geometry,
  );
  const before = window[windowIndex - 1] ?? null;
  const after = window[windowIndex + 1] ?? null;
  const corner =
    before == null || after == null
      ? null
      : cornerReadback(
          before,
          point,
          after,
          cycleVolumeRangeMl,
          cyclePressureRangeMmHg,
        );
  const pressureContributionMmHg = {
    passive: wall.passiveStressKPa * pressureFactor,
    series: wall.seriesTensionKPa * pressureFactor,
    sls: wall.slsOverstressKPa * pressureFactor,
    totalStress: wall.totalStressKPa * pressureFactor,
  };
  return {
    extractionMethod: "raw-accepted-step-local-extremum" as const,
    phase01: point.phase01,
    unwrappedPhase01: point.unwrappedPhase01,
    timeFromCalciumReleaseSec:
      (point.unwrappedPhase01 - startPhase01) * cycleLengthSec,
    volumeMl: sample.volumesMl.leftAtriumMl,
    pressureMmHg: sample.pressuresMmHg.la,
    mitralFlowMlPerSec: sample.flowsMlPerSec.mv,
    pulmonaryVenousFlowMlPerSec: sample.flowsMlPerSec.pvf,
    bloodVolumeRateFromLedgerMlPerSec:
      sample.flowsMlPerSec.pvf - sample.flowsMlPerSec.mv,
    componentReadback: {
      freeCalciumUm: sample.freeCalciumUm.la,
      caTroponin01: wall.caTroponin01,
      thinFilamentAvailability01: wall.thinFilamentAvailability01,
      totalStrain: wall.totalStrain,
      ceStrain: wall.ceStrain,
      contractileTensionKPa: wall.contractileTensionKPa,
      seriesTensionKPa: wall.seriesTensionKPa,
      passiveStressKPa: wall.passiveStressKPa,
      slsOverstressKPa: wall.slsOverstressKPa,
      totalStressKPa: wall.totalStressKPa,
      forceVelocityFactor: wall.forceVelocityFactor,
      lengthFactor: wall.lengthFactor,
      oneFiberPressureFactorMmHgPerKPa: pressureFactor,
      pressureContributionMmHg,
      reconstructedPressureMmHg:
        pressureContributionMmHg.passive +
        pressureContributionMmHg.series +
        pressureContributionMmHg.sls,
      reconstructionResidualMmHg:
        sample.pressuresMmHg.la -
        pressureContributionMmHg.passive -
        pressureContributionMmHg.series -
        pressureContributionMmHg.sls,
    },
    corner,
  };
}

function cornerReadback(
  before: PumpingPointV1,
  point: PumpingPointV1,
  after: PumpingPointV1,
  cycleVolumeRangeMl: number,
  cyclePressureRangeMmHg: number,
) {
  const dvIn =
    point.sample.volumesMl.leftAtriumMl - before.sample.volumesMl.leftAtriumMl;
  const dpIn = point.sample.pressuresMmHg.la - before.sample.pressuresMmHg.la;
  const dvOut =
    after.sample.volumesMl.leftAtriumMl - point.sample.volumesMl.leftAtriumMl;
  const dpOut = after.sample.pressuresMmHg.la - point.sample.pressuresMmHg.la;
  const inHeading = Math.atan2(
    dpIn / Math.max(cyclePressureRangeMmHg, 1e-15),
    dvIn / Math.max(cycleVolumeRangeMl, 1e-15),
  );
  const outHeading = Math.atan2(
    dpOut / Math.max(cyclePressureRangeMmHg, 1e-15),
    dvOut / Math.max(cycleVolumeRangeMl, 1e-15),
  );
  const signedTurnRad = signedAngleDifference(outHeading, inHeading);
  return {
    definition:
      "heading-change-of-adjacent-raw-pv-segments-after-axis-normalization-by-full-cycle-ranges" as const,
    cycleVolumeRangeMl,
    cyclePressureRangeMmHg,
    incomingRawSlopeMmHgPerMl: safeRatio(dpIn, dvIn),
    outgoingRawSlopeMmHgPerMl: safeRatio(dpOut, dvOut),
    incomingHeadingDeg: radiansToDegrees(inHeading),
    outgoingHeadingDeg: radiansToDegrees(outHeading),
    signedTurnAngleDeg: radiansToDegrees(signedTurnRad),
    absoluteTurnAngleDeg: Math.abs(radiansToDegrees(signedTurnRad)),
  };
}

function summarizeMvcSeriesFraction(
  cycle: readonly CyclePointV1[],
  mvc: EventPointV1,
  geometry: GeometryParamsV1,
) {
  const readback = readbackAtPhase(cycle, mvc.phase01);
  if (readback == null) {
    return {
      availability: "unavailable-mvc-phase-interpolation" as const,
      mvcEvent: mvc,
      readback: null,
    };
  }
  const pressureFactor = oneFiberPressureFactorMmHgPerKPa(
    readback.volumeMl,
    geometry,
  );
  const passive = readback.passiveStressKPa * pressureFactor;
  const series = readback.seriesTensionKPa * pressureFactor;
  const sls = readback.slsOverstressKPa * pressureFactor;
  const reconstructed = passive + series + sls;
  return {
    availability: "available" as const,
    definition:
      "series-one-fiber-pressure-contribution-at-model-half-open-mvc-divided-by-explicit-denominators" as const,
    mvcEvent: mvc,
    readback: {
      ...readback,
      oneFiberPressureFactorMmHgPerKPa: pressureFactor,
      pressureContributionMmHg: { passive, series, sls, reconstructed },
      reconstructionResidualMmHg: readback.pressureMmHg - reconstructed,
      seriesFractionOfLaPressure: safeRatio(series, readback.pressureMmHg),
      seriesFractionOfReconstructedWallPressure: safeRatio(
        series,
        reconstructed,
      ),
      seriesFractionOfAbsoluteComponentMagnitude: safeRatio(
        Math.abs(series),
        Math.abs(passive) + Math.abs(series) + Math.abs(sls),
      ),
    },
  };
}

function readbackAtPhase(cycle: readonly CyclePointV1[], phase01: number) {
  for (let index = 1; index < cycle.length; index += 1) {
    const left = cycle[index - 1]!;
    const right = cycle[index]!;
    if (left.phase01 > phase01 + 1e-12 || right.phase01 < phase01 - 1e-12)
      continue;
    const span = right.phase01 - left.phase01;
    const fraction = span <= 1e-15 ? 0 : (phase01 - left.phase01) / span;
    const lerpSample = (
      selector: (sample: NoAvpdFourChamberBenchSampleV1) => number,
    ) =>
      selector(left.sample) +
      (selector(right.sample) - selector(left.sample)) * fraction;
    return {
      extractionMethod: "piecewise-linear-at-model-half-open-mvc" as const,
      phase01,
      volumeMl: lerpSample((sample) => sample.volumesMl.leftAtriumMl),
      pressureMmHg: lerpSample((sample) => sample.pressuresMmHg.la),
      mitralFlowMlPerSec: lerpSample((sample) => sample.flowsMlPerSec.mv),
      pulmonaryVenousFlowMlPerSec: lerpSample(
        (sample) => sample.flowsMlPerSec.pvf,
      ),
      freeCalciumUm: lerpSample((sample) => sample.freeCalciumUm.la),
      caTroponin01: lerpSample((sample) => sample.wallReadback.la.caTroponin01),
      thinFilamentAvailability01: lerpSample(
        (sample) => sample.wallReadback.la.thinFilamentAvailability01,
      ),
      forceVelocityFactor: lerpSample(
        (sample) => sample.wallReadback.la.forceVelocityFactor,
      ),
      lengthFactor: lerpSample((sample) => sample.wallReadback.la.lengthFactor),
      passiveStressKPa: lerpSample(
        (sample) => sample.wallReadback.la.passiveStressKPa,
      ),
      seriesTensionKPa: lerpSample(
        (sample) => sample.wallReadback.la.seriesTensionKPa,
      ),
      slsOverstressKPa: lerpSample(
        (sample) => sample.wallReadback.la.slsOverstressKPa,
      ),
    };
  }
  return null;
}

function summarizeHemodynamics(
  cycle: readonly CyclePointV1[],
  cycleLengthSec: number,
  fixedWindowProxies: NoAvpdFourChamberBenchResultV1["reportOnlyPhysiology"],
) {
  const summary = (
    selector: (sample: NoAvpdFourChamberBenchSampleV1) => number,
  ) => {
    const values = cycle.map((point) => selector(point.sample));
    return {
      minimum: minimum(values),
      cycleMean:
        integrateCycle(cycle, selector, cycleLengthSec) / cycleLengthSec,
      maximum: maximum(values),
    };
  };
  const flow = (
    selector: (sample: NoAvpdFourChamberBenchSampleV1) => number,
  ) => ({
    ...summary(selector),
    netVolumeMl: integrateCycle(cycle, selector, cycleLengthSec),
  });
  return {
    evidenceStatus:
      "raw-cycle-hemodynamic-readback-no-physiology-gate" as const,
    fixedPhaseWindowProxies: fixedWindowProxies,
    pressureMmHg: {
      la: summary((sample) => sample.pressuresMmHg.la),
      lv: summary((sample) => sample.pressuresMmHg.lv),
      systemicArtery: summary((sample) => sample.pressuresMmHg.sa),
      systemicVein: summary((sample) => sample.pressuresMmHg.sv),
      ra: summary((sample) => sample.pressuresMmHg.ra),
      rv: summary((sample) => sample.pressuresMmHg.rv),
      pulmonaryArtery: summary((sample) => sample.pressuresMmHg.pa),
      pulmonaryVein: summary((sample) => sample.pressuresMmHg.pve),
    },
    volumeMl: {
      la: summary((sample) => sample.volumesMl.leftAtriumMl),
      lv: summary((sample) => sample.volumesMl.leftVentricleMl),
      ra: summary((sample) => sample.volumesMl.rightAtriumMl),
      rv: summary((sample) => sample.volumesMl.rightVentricleMl),
    },
    flowMlPerSec: {
      mitral: flow((sample) => sample.flowsMlPerSec.mv),
      aortic: flow((sample) => sample.flowsMlPerSec.aov),
      pulmonaryVenous: flow((sample) => sample.flowsMlPerSec.pvf),
      tricuspid: flow((sample) => sample.flowsMlPerSec.tv),
      pulmonaryValve: flow((sample) => sample.flowsMlPerSec.pulmonaryValve),
      systemicVenous: flow((sample) => sample.flowsMlPerSec.svf),
    },
  };
}

function finalCompleteCycle(
  report: NoAvpdFourChamberBenchResultV1,
): readonly CyclePointV1[] | null {
  if (report.lastBeatSamples.length < 2) return null;
  const first = report.lastBeatSamples[0]!;
  if (Math.abs(first.phase01) > 1e-12) return null;
  const last = report.lastBeatSamples[report.lastBeatSamples.length - 1]!;
  const boundary = report.samples.find(
    (sample) =>
      sample.timeSec > last.timeSec &&
      sample.beatIndex === first.beatIndex + 1 &&
      Math.abs(sample.phase01) <= 1e-12,
  );
  if (boundary == null) return null;
  return [
    ...report.lastBeatSamples.map((sample) => ({
      phase01: sample.phase01,
      sample,
    })),
    { phase01: 1, sample: boundary },
  ];
}

function pumpingWindow(
  cycle: readonly CyclePointV1[],
  startPhase01: number,
  endUnwrappedPhase01: number,
): readonly PumpingPointV1[] {
  const beforeBoundary = cycle
    .filter(
      (point) =>
        point.phase01 >= startPhase01 - 1e-12 &&
        point.phase01 <= Math.min(1, endUnwrappedPhase01) + 1e-12,
    )
    .map((point) => ({ ...point, unwrappedPhase01: point.phase01 }));
  if (endUnwrappedPhase01 <= 1) return beforeBoundary;
  const wrappedEnd = endUnwrappedPhase01 - 1;
  const afterBoundary = cycle
    .filter(
      (point) => point.phase01 > 1e-12 && point.phase01 <= wrappedEnd + 1e-12,
    )
    .map((point) => ({ ...point, unwrappedPhase01: point.phase01 + 1 }));
  return [...beforeBoundary, ...afterBoundary];
}

function branch(
  path: readonly PathPointV1[],
  startPhase01: number,
  endPhase01: number,
): readonly PathPointV1[] {
  if (!(endPhase01 > startPhase01)) return [];
  const start = interpolatePathAtPhase(path, startPhase01);
  const end = interpolatePathAtPhase(path, endPhase01);
  if (start == null || end == null) return [];
  return [
    start,
    ...path.filter(
      (point) =>
        point.phase01 > startPhase01 + 1e-12 &&
        point.phase01 < endPhase01 - 1e-12,
    ),
    end,
  ];
}

function interpolatePathAtPhase(
  path: readonly PathPointV1[],
  phase01: number,
): PathPointV1 | null {
  for (let index = 1; index < path.length; index += 1) {
    const left = path[index - 1]!;
    const right = path[index]!;
    if (left.phase01 > phase01 + 1e-12 || right.phase01 < phase01 - 1e-12)
      continue;
    const span = right.phase01 - left.phase01;
    const fraction = span <= 1e-15 ? 0 : (phase01 - left.phase01) / span;
    return interpolatePathState(left, right, fraction, phase01);
  }
  return null;
}

function statesAtVolume(
  path: readonly PathPointV1[],
  targetVolumeMl: number,
): readonly PathPointV1[] {
  const values: PathPointV1[] = [];
  for (let index = 1; index < path.length; index += 1) {
    const left = path[index - 1]!;
    const right = path[index]!;
    const low = Math.min(left.volumeMl, right.volumeMl);
    const high = Math.max(left.volumeMl, right.volumeMl);
    if (targetVolumeMl < low - 1e-12 || targetVolumeMl > high + 1e-12) continue;
    const span = right.volumeMl - left.volumeMl;
    if (Math.abs(span) <= 1e-12) continue;
    const fraction = (targetVolumeMl - left.volumeMl) / span;
    const state = interpolatePathState(
      left,
      right,
      fraction,
      left.phase01 + (right.phase01 - left.phase01) * fraction,
      targetVolumeMl,
    );
    if (!values.some((existing) => samePathState(existing, state)))
      values.push(state);
  }
  return values;
}

function interpolatePathState(
  left: PathPointV1,
  right: PathPointV1,
  fraction: number,
  phase01: number,
  volumeMl = left.volumeMl + (right.volumeMl - left.volumeMl) * fraction,
): PathPointV1 {
  const lerp = (a: number, b: number) => a + (b - a) * fraction;
  return {
    phase01,
    volumeMl,
    pressureMmHg: lerp(left.pressureMmHg, right.pressureMmHg),
    passiveStressKPa: lerp(left.passiveStressKPa, right.passiveStressKPa),
    seriesTensionKPa: lerp(left.seriesTensionKPa, right.seriesTensionKPa),
    slsOverstressKPa: lerp(left.slsOverstressKPa, right.slsOverstressKPa),
  };
}

function samePathState(left: PathPointV1, right: PathPointV1): boolean {
  return (
    Math.abs(left.pressureMmHg - right.pressureMmHg) <= 1e-9 &&
    Math.abs(left.passiveStressKPa - right.passiveStressKPa) <= 1e-9 &&
    Math.abs(left.seriesTensionKPa - right.seriesTensionKPa) <= 1e-9 &&
    Math.abs(left.slsOverstressKPa - right.slsOverstressKPa) <= 1e-9
  );
}

function volumeReversal(path: readonly PathPointV1[]): number | null {
  if (path.length < 2) return null;
  const direction =
    path[path.length - 1]!.volumeMl >= path[0]!.volumeMl ? 1 : -1;
  let reversal = 0;
  for (let index = 1; index < path.length; index += 1) {
    const directed =
      direction * (path[index]!.volumeMl - path[index - 1]!.volumeMl);
    if (directed < 0) reversal -= directed;
  }
  return reversal;
}

function oneFiberPressureFactorMmHgPerKPa(
  volumeMl: number,
  geometry: GeometryParamsV1,
): number {
  return (
    oneFiberCavityPressurePaV1(
      evaluateOneFiberVolumeGeometryV1(volumeMl, geometry),
      1_000,
    ) / 133.322
  );
}

function integrateCycle(
  cycle: readonly CyclePointV1[],
  selector: (sample: NoAvpdFourChamberBenchSampleV1) => number,
  cycleLengthSec: number,
): number {
  let integral = 0;
  for (let index = 1; index < cycle.length; index += 1) {
    const left = cycle[index - 1]!;
    const right = cycle[index]!;
    const dtSec = (right.phase01 - left.phase01) * cycleLengthSec;
    integral += 0.5 * (selector(left.sample) + selector(right.sample)) * dtSec;
  }
  return integral;
}

function trapezoid(points: readonly (readonly [number, number])[]): number {
  let integral = 0;
  for (let index = 1; index < points.length; index += 1) {
    const left = points[index - 1]!;
    const right = points[index]!;
    integral += 0.5 * (left[1] + right[1]) * (right[0] - left[0]);
  }
  return integral;
}

function unwrapAtOrAfter(phase01: number, startPhase01: number): number {
  return phase01 >= startPhase01 ? phase01 : phase01 + 1;
}

function signedAngleDifference(later: number, earlier: number): number {
  let difference = later - earlier;
  while (difference > Math.PI) difference -= 2 * Math.PI;
  while (difference <= -Math.PI) difference += 2 * Math.PI;
  return difference;
}

function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function safeRatio(numerator: number, denominator: number): number | null {
  return Number.isFinite(numerator) &&
    Number.isFinite(denominator) &&
    Math.abs(denominator) > 1e-15
    ? numerator / denominator
    : null;
}

function minimum(values: readonly number[]): number {
  return Math.min(...values);
}

function maximum(values: readonly number[]): number {
  return Math.max(...values);
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? 0.5 * (sorted[middle - 1]! + sorted[middle]!)
    : sorted[middle]!;
}
