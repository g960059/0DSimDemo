import type {
  NoAvpdFourChamberHillTriSegParamsV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";

export const NO_AVPD_EVENT_RESOLVED_DIAGNOSTICS_ID_V1 =
  "no-avpd-event-resolved-diagnostics-v1" as const;

export type NoAvpdEventDiagnosticSideV1 = "left" | "right";

export type NoAvpdEventDiagnosticSampleV1 = {
  /** Monotone plot coordinate. A retained final boundary may use exactly 1. */
  readonly phase01: number;
  readonly volumesMl: {
    readonly leftAtriumMl: number;
    readonly leftVentricleMl: number;
    readonly rightAtriumMl: number;
    readonly rightVentricleMl: number;
  };
  readonly pressuresMmHg: {
    readonly la: number;
    readonly lv: number;
    readonly ra: number;
    readonly rv: number;
  };
  readonly flowsMlPerSec: {
    readonly mv: number;
    readonly tv: number;
  };
  readonly freeCalciumUm: {
    readonly la: number;
    readonly ra: number;
  };
  readonly caTroponin01: {
    readonly la: number;
    readonly ra: number;
  };
  readonly thinFilamentAvailability01: {
    readonly la: number;
    readonly ra: number;
  };
  readonly wallReadback: {
    readonly la: { readonly seriesTensionKPa: number };
    readonly ra: { readonly seriesTensionKPa: number };
  };
};

export type NoAvpdOperationalEventPointV1 = {
  readonly phase01: number;
  readonly timeFromCycleStartSec: number;
  readonly extractionMethod:
    | "raw-sample-extremum"
    | "piecewise-linear-level-crossing"
    | "piecewise-linear-scheduled-phase";
  readonly boundaryCensored: boolean;
  readonly atrialVolumeMl: number;
  readonly ventricularVolumeMl: number;
  readonly atrialPressureMmHg: number;
  readonly ventricularPressureMmHg: number;
  readonly atrioventricularPressureGradientMmHg: number;
  readonly atrioventricularFlowMlPerSec: number;
  readonly prescribedFreeCalciumUm: number;
  readonly caTroponin01: number;
  readonly thinFilamentAvailability01: number;
  readonly seriesTensionKPa: number;
};

type NoAvpdValveTransitionPairV1 = {
  readonly opening: NoAvpdOperationalEventPointV1 | null;
  readonly closure: NoAvpdOperationalEventPointV1 | null;
  readonly upwardCrossingCount: number;
  readonly downwardCrossingCount: number;
  readonly selectionStatus:
    | "one-opening-and-one-closure"
    | "ambiguous-transition-count"
    | "missing-transition";
};

export type NoAvpdAtrialEventDiagnosticsV1 = {
  readonly side: NoAvpdEventDiagnosticSideV1;
  readonly operationalDefinitions: {
    readonly smoothValveHasBinaryLeafletState: false;
    readonly modelHalfOpen:
      "pressure-gradient-minus-opening-midpoint-zero-crossing";
    readonly pressureCrossover: "atrial-minus-ventricular-pressure-zero-crossing";
    readonly flowZero: "atrioventricular-flow-zero-crossing";
    readonly extrema: "raw-sample-window-extrema-no-smoothing";
    readonly eTailNumericalRegularizer:
      "auxiliary-first-downward-crossing-of-valve-flow-numerical-regularization-scale-not-physiological-e-end";
  };
  readonly scheduledActivationEvent: NoAvpdOperationalEventPointV1;
  readonly prescribedCalciumReleaseOnset: NoAvpdOperationalEventPointV1;
  readonly valveTransitions: {
    /** The model's exact 50%-open operational transition. */
    readonly modelHalfOpen: NoAvpdValveTransitionPairV1;
    /** A separate pressure-crossover readback; not the model gate midpoint. */
    readonly pressureCrossover: NoAvpdValveTransitionPairV1;
    /** A separate inertial-flow crossover readback. */
    readonly flowZero: NoAvpdValveTransitionPairV1;
  };
  readonly pressureVolumeEvents: {
    readonly aPeak: NoAvpdOperationalEventPointV1 | null;
    readonly volumeMinimum: NoAvpdOperationalEventPointV1 | null;
    readonly xTrough: NoAvpdOperationalEventPointV1 | null;
    readonly vPeak: NoAvpdOperationalEventPointV1 | null;
    readonly yTrough: NoAvpdOperationalEventPointV1 | null;
  };
  readonly inflowEvents: {
    readonly ePeak: NoAvpdOperationalEventPointV1 | null;
    /** Auxiliary crossing of a numerical valve regularizer, not physiological E-end. */
    readonly eTailCrossingAtValveNumericalRegularizationScale:
      NoAvpdOperationalEventPointV1 | null;
    readonly aStartInterpeakMinimum: NoAvpdOperationalEventPointV1 | null;
    readonly aPeak: NoAvpdOperationalEventPointV1 | null;
  };
  readonly inflowSeparationReadback: {
    readonly status:
      | "continuous-readback-no-separation-classification"
      | "not-measurable";
    readonly valveFlowNumericalRegularizationScaleMlPerSec: number;
    readonly flowAtCalciumReleaseOverEPeak: number | null;
    readonly flowAtAStartOverEPeak: number | null;
    readonly interpeakMinimumMlPerSec: number | null;
    readonly interpeakMinimumOverEPeak: number | null;
    readonly ePeakProminenceOverInterpeakMinimumMlPerSec: number | null;
    readonly aPeakProminenceOverInterpeakMinimumMlPerSec: number | null;
    readonly durationBelowNumericalRegularizationScaleSec: number | null;
  };
};

export type NoAvpdEventResolvedDiagnosticsV1 = {
  readonly diagnosticsId: typeof NO_AVPD_EVENT_RESOLVED_DIAGNOSTICS_ID_V1;
  readonly evidenceStatus: "report-only-operational-events-not-acceptance-gates";
  readonly availability:
    | "available-complete-raw-two-cycle-window"
    | "unavailable-samples-not-every-accepted-step"
    | "unavailable-cycle-length-not-integer-multiple-of-dt"
    | "unavailable-complete-two-cycle-window-not-retained"
    | "unavailable-insufficient-samples";
  readonly sampleTreatment:
    "two-consecutive-observed-cycles-every-accepted-step-raw-no-smoothing-no-decimation";
  readonly crossingTreatment: "piecewise-linear-between-adjacent-raw-samples";
  readonly physiologyThresholdsApplied: false;
  readonly changesStructuralStatus: false;
  readonly claimBoundary:
    "continuous-smooth-valve-operational-events-prescribed-calcium-not-clinical-leaflet-or-doppler-events";
  readonly cycleLengthSec: number;
  readonly dtSec: number;
  readonly rawWindowSampleCount: number;
  readonly observedCycleCount: 0 | 2;
  readonly eventAnchorBeatIndex: number | null;
  readonly includesDistinctSecondCycleFinalBoundary: boolean;
  readonly left: NoAvpdAtrialEventDiagnosticsV1 | null;
  readonly right: NoAvpdAtrialEventDiagnosticsV1 | null;
};

type Crossing = {
  readonly direction: "up" | "down";
  readonly unwrappedPhase: number;
  readonly point: NoAvpdOperationalEventPointV1;
};

type SideAccessors = {
  readonly atrialVolume: (sample: NoAvpdEventDiagnosticSampleV1) => number;
  readonly ventricularVolume: (sample: NoAvpdEventDiagnosticSampleV1) => number;
  readonly atrialPressure: (sample: NoAvpdEventDiagnosticSampleV1) => number;
  readonly ventricularPressure: (sample: NoAvpdEventDiagnosticSampleV1) => number;
  readonly flow: (sample: NoAvpdEventDiagnosticSampleV1) => number;
  readonly calcium: (sample: NoAvpdEventDiagnosticSampleV1) => number;
  readonly caTroponin: (sample: NoAvpdEventDiagnosticSampleV1) => number;
  readonly thinFilament: (sample: NoAvpdEventDiagnosticSampleV1) => number;
  readonly seriesTension: (sample: NoAvpdEventDiagnosticSampleV1) => number;
};

const SIDE_ACCESSORS: Readonly<Record<NoAvpdEventDiagnosticSideV1, SideAccessors>> = {
  left: {
    atrialVolume: (sample) => sample.volumesMl.leftAtriumMl,
    ventricularVolume: (sample) => sample.volumesMl.leftVentricleMl,
    atrialPressure: (sample) => sample.pressuresMmHg.la,
    ventricularPressure: (sample) => sample.pressuresMmHg.lv,
    flow: (sample) => sample.flowsMlPerSec.mv,
    calcium: (sample) => sample.freeCalciumUm.la,
    caTroponin: (sample) => sample.caTroponin01.la,
    thinFilament: (sample) => sample.thinFilamentAvailability01.la,
    seriesTension: (sample) => sample.wallReadback.la.seriesTensionKPa,
  },
  right: {
    atrialVolume: (sample) => sample.volumesMl.rightAtriumMl,
    ventricularVolume: (sample) => sample.volumesMl.rightVentricleMl,
    atrialPressure: (sample) => sample.pressuresMmHg.ra,
    ventricularPressure: (sample) => sample.pressuresMmHg.rv,
    flow: (sample) => sample.flowsMlPerSec.tv,
    calcium: (sample) => sample.freeCalciumUm.ra,
    caTroponin: (sample) => sample.caTroponin01.ra,
    thinFilament: (sample) => sample.thinFilamentAvailability01.ra,
    seriesTension: (sample) => sample.wallReadback.ra.seriesTensionKPa,
  },
};

export function summarizeNoAvpdEventResolvedDiagnosticsV1(input: {
  readonly samples: readonly NoAvpdEventDiagnosticSampleV1[];
  readonly params: NoAvpdFourChamberHillTriSegParamsV1;
  readonly dtSec: number;
  readonly sampleEverySteps: number;
  readonly exactStepsPerCycle: number | null;
  readonly eventAnchorBeatIndex: number | null;
}): NoAvpdEventResolvedDiagnosticsV1 {
  const base = {
    diagnosticsId: NO_AVPD_EVENT_RESOLVED_DIAGNOSTICS_ID_V1,
    evidenceStatus: "report-only-operational-events-not-acceptance-gates" as const,
    sampleTreatment:
      "two-consecutive-observed-cycles-every-accepted-step-raw-no-smoothing-no-decimation" as const,
    crossingTreatment: "piecewise-linear-between-adjacent-raw-samples" as const,
    physiologyThresholdsApplied: false as const,
    changesStructuralStatus: false as const,
    claimBoundary:
      "continuous-smooth-valve-operational-events-prescribed-calcium-not-clinical-leaflet-or-doppler-events" as const,
    cycleLengthSec: input.params.cycleLengthSec,
    dtSec: input.dtSec,
    rawWindowSampleCount: input.samples.length,
    observedCycleCount: 0 as 0 | 2,
    eventAnchorBeatIndex: input.eventAnchorBeatIndex,
    includesDistinctSecondCycleFinalBoundary:
      input.samples.length >= 2
      && Math.abs(input.samples[0]!.phase01) <= 1e-12
      && Math.abs(input.samples[input.samples.length - 1]!.phase01 - 2) <= 1e-12,
  };
  const unavailable = (
    availability: Exclude<NoAvpdEventResolvedDiagnosticsV1["availability"],
      "available-complete-raw-two-cycle-window">,
  ): NoAvpdEventResolvedDiagnosticsV1 => ({
    ...base,
    availability,
    left: null,
    right: null,
  });
  if (input.sampleEverySteps !== 1) {
    return unavailable("unavailable-samples-not-every-accepted-step");
  }
  if (input.exactStepsPerCycle === null) {
    return unavailable("unavailable-cycle-length-not-integer-multiple-of-dt");
  }
  if (!base.includesDistinctSecondCycleFinalBoundary) {
    return unavailable("unavailable-complete-two-cycle-window-not-retained");
  }
  if (input.samples.length !== 2 * input.exactStepsPerCycle + 1) {
    return unavailable("unavailable-insufficient-samples");
  }
  return {
    ...base,
    observedCycleCount: 2,
    availability: "available-complete-raw-two-cycle-window",
    left: summarizeSide("left", input.samples, input.params),
    right: summarizeSide("right", input.samples, input.params),
  };
}

function summarizeSide(
  side: NoAvpdEventDiagnosticSideV1,
  samples: readonly NoAvpdEventDiagnosticSampleV1[],
  params: NoAvpdFourChamberHillTriSegParamsV1,
): NoAvpdAtrialEventDiagnosticsV1 {
  const access = SIDE_ACCESSORS[side];
  const calciumDriver = side === "left"
    ? params.calciumDrivers.leftAtrium
    : params.calciumDrivers.rightAtrium;
  const valve = side === "left" ? params.valves.mitral : params.valves.tricuspid;
  const cycleLengthSec = params.cycleLengthSec;
  const activationPhase = normalizePhase(calciumDriver.eventOnsetSec / cycleLengthSec);
  const releasePhase = normalizePhase(
    (calciumDriver.eventOnsetSec + calciumDriver.calcium.activationDelaySec)
      / cycleLengthSec,
  );
  const gradient = (sample: NoAvpdEventDiagnosticSampleV1) =>
    access.atrialPressure(sample) - access.ventricularPressure(sample);
  const halfOpenCrossings = crossings(
    samples,
    access,
    gradient,
    valve.openingMidpointMmHg,
    cycleLengthSec,
  );
  const modelHalfOpen = transitionPairAroundRelease(halfOpenCrossings, releasePhase);
  const pressureCrossover = transitionPairAroundRelease(
    crossings(samples, access, gradient, 0, cycleLengthSec),
    releasePhase,
  );
  const flowZero = transitionPairAroundRelease(
    crossings(samples, access, access.flow, 0, cycleLengthSec),
    releasePhase,
  );
  const scheduledActivationEvent = interpolatePoint(
    samples,
    activationPhase,
    access,
    cycleLengthSec,
    "piecewise-linear-scheduled-phase",
  );
  const prescribedCalciumReleaseOnset = interpolatePoint(
    samples,
    releasePhase,
    access,
    cycleLengthSec,
    "piecewise-linear-scheduled-phase",
  );
  const opening = modelHalfOpen.opening;
  const closure = modelHalfOpen.closure;
  if (opening === null || closure === null) {
    return emptySide(
      side,
      scheduledActivationEvent,
      prescribedCalciumReleaseOnset,
      modelHalfOpen,
      pressureCrossover,
      flowZero,
      valve.flowSmoothingMlPerSec,
    );
  }
  const openingUnwrapped = unwrapAtOrAfter(opening.phase01, 0);
  const releaseUnwrapped = releasePhase;
  const closureUnwrapped = unwrapAtOrAfter(closure.phase01, releaseUnwrapped);
  const nextOpening = uniqueCrossingPoint(
    halfOpenCrossings,
    "up",
    closureUnwrapped,
    releaseUnwrapped + 1,
  );
  const nextOpeningUnwrapped = nextOpening === null
    ? null
    : unwrapAtOrAfter(nextOpening.phase01, closureUnwrapped);
  const ePeak = maximumPoint(
    samples,
    openingUnwrapped,
    releaseUnwrapped,
    access.flow,
    access,
    cycleLengthSec,
  );
  const aPeak = maximumPoint(
    samples,
    releaseUnwrapped,
    closureUnwrapped,
    access.flow,
    access,
    cycleLengthSec,
  );
  const aStart = ePeak !== null && aPeak !== null
    ? minimumPoint(
      samples,
      unwrapAtOrAfter(ePeak.phase01, openingUnwrapped),
      unwrapAtOrAfter(aPeak.phase01, releaseUnwrapped),
      access.flow,
      access,
      cycleLengthSec,
    )
    : null;
  const eTailNumericalCrossing = ePeak !== null && aStart !== null
    ? firstDownwardCrossing(
      samples,
      unwrapAtOrAfter(ePeak.phase01, openingUnwrapped),
      unwrapAtOrAfter(aStart.phase01, releaseUnwrapped),
      access.flow,
      valve.flowSmoothingMlPerSec,
      access,
      cycleLengthSec,
    )
    : null;
  const xTrough = nextOpeningUnwrapped === null
    ? null
    : minimumPoint(
      samples,
      closureUnwrapped,
      nextOpeningUnwrapped,
      access.atrialPressure,
      access,
      cycleLengthSec,
    );
  const yTrough = nextOpeningUnwrapped === null
    ? null
    : minimumPoint(
      samples,
      nextOpeningUnwrapped,
      releaseUnwrapped + 1,
      access.atrialPressure,
      access,
      cycleLengthSec,
    );
  const vPeak = xTrough !== null && nextOpeningUnwrapped !== null
    ? maximumPoint(
      samples,
      unwrapAtOrAfter(xTrough.phase01, closureUnwrapped),
      nextOpeningUnwrapped,
      access.atrialPressure,
      access,
      cycleLengthSec,
    )
    : null;
  const aPressurePeak = maximumPoint(
    samples,
    releaseUnwrapped,
    closureUnwrapped,
    access.atrialPressure,
    access,
    cycleLengthSec,
  );
  const volumeMinimum = xTrough === null
    ? null
    : minimumPoint(
      samples,
      releaseUnwrapped,
      unwrapAtOrAfter(xTrough.phase01, closureUnwrapped),
      access.atrialVolume,
      access,
      cycleLengthSec,
    );
  const ePeakFlow = ePeak?.atrioventricularFlowMlPerSec ?? null;
  const aPeakFlow = aPeak?.atrioventricularFlowMlPerSec ?? null;
  const aStartFlow = aStart?.atrioventricularFlowMlPerSec ?? null;
  const flowAtRelease = prescribedCalciumReleaseOnset.atrioventricularFlowMlPerSec;
  return {
    side,
    operationalDefinitions: operationalDefinitions(),
    scheduledActivationEvent,
    prescribedCalciumReleaseOnset,
    valveTransitions: { modelHalfOpen, pressureCrossover, flowZero },
    pressureVolumeEvents: {
      aPeak: aPressurePeak,
      volumeMinimum,
      xTrough,
      vPeak,
      yTrough,
    },
    inflowEvents: {
      ePeak,
      eTailCrossingAtValveNumericalRegularizationScale: eTailNumericalCrossing,
      aStartInterpeakMinimum: aStart,
      aPeak,
    },
    inflowSeparationReadback: {
      status: ePeak === null || aStart === null || aPeak === null
        ? "not-measurable"
        : "continuous-readback-no-separation-classification",
      valveFlowNumericalRegularizationScaleMlPerSec: valve.flowSmoothingMlPerSec,
      flowAtCalciumReleaseOverEPeak: positiveRatio(flowAtRelease, ePeakFlow),
      flowAtAStartOverEPeak: positiveRatio(aStartFlow, ePeakFlow),
      interpeakMinimumMlPerSec: aStartFlow,
      interpeakMinimumOverEPeak: positiveRatio(aStartFlow, ePeakFlow),
      ePeakProminenceOverInterpeakMinimumMlPerSec:
        finiteDifference(ePeakFlow, aStartFlow),
      aPeakProminenceOverInterpeakMinimumMlPerSec:
        finiteDifference(aPeakFlow, aStartFlow),
      durationBelowNumericalRegularizationScaleSec:
        eTailNumericalCrossing === null || aStart === null
        ? null
        : forwardPhaseDifference(
          eTailNumericalCrossing.phase01,
          aStart.phase01,
        ) * cycleLengthSec,
    },
  };
}

function emptySide(
  side: NoAvpdEventDiagnosticSideV1,
  scheduledActivationEvent: NoAvpdOperationalEventPointV1,
  prescribedCalciumReleaseOnset: NoAvpdOperationalEventPointV1,
  modelHalfOpen: NoAvpdValveTransitionPairV1,
  pressureCrossover: NoAvpdValveTransitionPairV1,
  flowZero: NoAvpdValveTransitionPairV1,
  valveFlowNumericalRegularizationScaleMlPerSec: number,
): NoAvpdAtrialEventDiagnosticsV1 {
  return {
    side,
    operationalDefinitions: operationalDefinitions(),
    scheduledActivationEvent,
    prescribedCalciumReleaseOnset,
    valveTransitions: { modelHalfOpen, pressureCrossover, flowZero },
    pressureVolumeEvents: {
      aPeak: null,
      volumeMinimum: null,
      xTrough: null,
      vPeak: null,
      yTrough: null,
    },
    inflowEvents: {
      ePeak: null,
      eTailCrossingAtValveNumericalRegularizationScale: null,
      aStartInterpeakMinimum: null,
      aPeak: null,
    },
    inflowSeparationReadback: {
      status: "not-measurable",
      valveFlowNumericalRegularizationScaleMlPerSec,
      flowAtCalciumReleaseOverEPeak: null,
      flowAtAStartOverEPeak: null,
      interpeakMinimumMlPerSec: null,
      interpeakMinimumOverEPeak: null,
      ePeakProminenceOverInterpeakMinimumMlPerSec: null,
      aPeakProminenceOverInterpeakMinimumMlPerSec: null,
      durationBelowNumericalRegularizationScaleSec: null,
    },
  };
}

function operationalDefinitions(): NoAvpdAtrialEventDiagnosticsV1["operationalDefinitions"] {
  return {
    smoothValveHasBinaryLeafletState: false,
    modelHalfOpen: "pressure-gradient-minus-opening-midpoint-zero-crossing",
    pressureCrossover: "atrial-minus-ventricular-pressure-zero-crossing",
    flowZero: "atrioventricular-flow-zero-crossing",
    extrema: "raw-sample-window-extrema-no-smoothing",
    eTailNumericalRegularizer:
      "auxiliary-first-downward-crossing-of-valve-flow-numerical-regularization-scale-not-physiological-e-end",
  };
}

function transitionPairAroundRelease(
  candidates: readonly Crossing[],
  releasePhase: number,
): NoAvpdValveTransitionPairV1 {
  const openings = candidates.filter((candidate) => (
    candidate.direction === "up"
    && candidate.unwrappedPhase >= -1e-12
    && candidate.unwrappedPhase <= releasePhase + 1e-12
  ));
  const closures = candidates.filter((candidate) => (
    candidate.direction === "down"
    && candidate.unwrappedPhase >= releasePhase - 1e-12
    && candidate.unwrappedPhase <= releasePhase + 1 + 1e-12
  ));
  const opening = openings.length === 1 ? openings[0]!.point : null;
  const closure = closures.length === 1 ? closures[0]!.point : null;
  return {
    opening,
    closure,
    upwardCrossingCount: openings.length,
    downwardCrossingCount: closures.length,
    selectionStatus: openings.length === 0 || closures.length === 0
      ? "missing-transition"
      : openings.length === 1 && closures.length === 1
        ? "one-opening-and-one-closure"
        : "ambiguous-transition-count",
  };
}

function uniqueCrossingPoint(
  candidates: readonly Crossing[],
  direction: Crossing["direction"],
  startPhase: number,
  endPhase: number,
): NoAvpdOperationalEventPointV1 | null {
  const matching = candidates.filter((candidate) => (
    candidate.direction === direction
    && candidate.unwrappedPhase > startPhase + 1e-12
    && candidate.unwrappedPhase <= endPhase + 1e-12
  ));
  return matching.length === 1 ? matching[0]!.point : null;
}

function crossings(
  samples: readonly NoAvpdEventDiagnosticSampleV1[],
  access: SideAccessors,
  value: (sample: NoAvpdEventDiagnosticSampleV1) => number,
  level: number,
  cycleLengthSec: number,
): readonly Crossing[] {
  const result: Crossing[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const left = samples[index - 1]!;
    const right = samples[index]!;
    const leftValue = value(left) - level;
    const rightValue = value(right) - level;
    if (!Number.isFinite(leftValue) || !Number.isFinite(rightValue)) continue;
    const direction = leftValue <= 0 && rightValue > 0
      ? "up"
      : leftValue >= 0 && rightValue < 0
        ? "down"
        : null;
    if (direction === null) continue;
    const fraction = Math.abs(rightValue - leftValue) <= 1e-15
      ? 0
      : -leftValue / (rightValue - leftValue);
    const unwrappedPhase = left.phase01 + (right.phase01 - left.phase01) * fraction;
    result.push({
      direction,
      unwrappedPhase,
      point: interpolateSamples(
        left,
        right,
        fraction,
        access,
        cycleLengthSec,
        "piecewise-linear-level-crossing",
      ),
    });
  }
  return result;
}

function maximumPoint(
  samples: readonly NoAvpdEventDiagnosticSampleV1[],
  startPhase: number,
  endPhase: number,
  value: (sample: NoAvpdEventDiagnosticSampleV1) => number,
  access: SideAccessors,
  cycleLengthSec: number,
): NoAvpdOperationalEventPointV1 | null {
  return extremumPoint(
    samples,
    startPhase,
    endPhase,
    value,
    (candidate, current) => candidate > current,
    access,
    cycleLengthSec,
  );
}

function minimumPoint(
  samples: readonly NoAvpdEventDiagnosticSampleV1[],
  startPhase: number,
  endPhase: number,
  value: (sample: NoAvpdEventDiagnosticSampleV1) => number,
  access: SideAccessors,
  cycleLengthSec: number,
): NoAvpdOperationalEventPointV1 | null {
  return extremumPoint(
    samples,
    startPhase,
    endPhase,
    value,
    (candidate, current) => candidate < current,
    access,
    cycleLengthSec,
  );
}

function extremumPoint(
  samples: readonly NoAvpdEventDiagnosticSampleV1[],
  startPhase: number,
  endPhase: number,
  value: (sample: NoAvpdEventDiagnosticSampleV1) => number,
  isBetter: (candidate: number, current: number) => boolean,
  access: SideAccessors,
  cycleLengthSec: number,
): NoAvpdOperationalEventPointV1 | null {
  const eligible = samples.filter((sample) => (
    sample.phase01 >= startPhase - 1e-12 && sample.phase01 <= endPhase + 1e-12
  ));
  if (eligible.length === 0) return null;
  const selected = eligible.reduce((current, candidate) => (
    isBetter(value(candidate), value(current)) ? candidate : current
  ));
  const selectedIndex = eligible.indexOf(selected);
  const boundaryCensored = selectedIndex === 0 || selectedIndex === eligible.length - 1;
  return pointFromSample(
    selected,
    access,
    cycleLengthSec,
    "raw-sample-extremum",
    boundaryCensored,
  );
}

function firstDownwardCrossing(
  samples: readonly NoAvpdEventDiagnosticSampleV1[],
  startPhase: number,
  endPhase: number,
  value: (sample: NoAvpdEventDiagnosticSampleV1) => number,
  level: number,
  access: SideAccessors,
  cycleLengthSec: number,
): NoAvpdOperationalEventPointV1 | null {
  for (let index = 1; index < samples.length; index += 1) {
    const left = samples[index - 1]!;
    const right = samples[index]!;
    if (left.phase01 < startPhase - 1e-12 || right.phase01 > endPhase + 1e-12) continue;
    const leftValue = value(left) - level;
    const rightValue = value(right) - level;
    if (leftValue < 0 || rightValue >= 0) continue;
    const fraction = leftValue / Math.max(leftValue - rightValue, 1e-15);
    return interpolateSamples(
      left,
      right,
      fraction,
      access,
      cycleLengthSec,
      "piecewise-linear-level-crossing",
    );
  }
  return null;
}

function interpolatePoint(
  samples: readonly NoAvpdEventDiagnosticSampleV1[],
  phase01: number,
  access: SideAccessors,
  cycleLengthSec: number,
  method: NoAvpdOperationalEventPointV1["extractionMethod"],
): NoAvpdOperationalEventPointV1 {
  const normalized = normalizePhase(phase01);
  for (let index = 1; index < samples.length; index += 1) {
    const left = samples[index - 1]!;
    const right = samples[index]!;
    if (left.phase01 <= normalized && right.phase01 >= normalized) {
      const span = right.phase01 - left.phase01;
      const fraction = span <= 1e-15 ? 0 : (normalized - left.phase01) / span;
      return interpolateSamples(left, right, fraction, access, cycleLengthSec, method);
    }
  }
  return pointFromSample(samples[0]!, access, cycleLengthSec, method, true);
}

function interpolateSamples(
  left: NoAvpdEventDiagnosticSampleV1,
  right: NoAvpdEventDiagnosticSampleV1,
  fraction: number,
  access: SideAccessors,
  cycleLengthSec: number,
  method: NoAvpdOperationalEventPointV1["extractionMethod"],
): NoAvpdOperationalEventPointV1 {
  const t = Math.max(0, Math.min(1, fraction));
  const mix = (value: (sample: NoAvpdEventDiagnosticSampleV1) => number) =>
    value(left) + (value(right) - value(left)) * t;
  const unwrappedPhase = left.phase01 + (right.phase01 - left.phase01) * t;
  const atrialPressure = mix(access.atrialPressure);
  const ventricularPressure = mix(access.ventricularPressure);
  return {
    phase01: normalizePhase(unwrappedPhase),
    timeFromCycleStartSec: normalizePhase(unwrappedPhase) * cycleLengthSec,
    extractionMethod: method,
    boundaryCensored: false,
    atrialVolumeMl: mix(access.atrialVolume),
    ventricularVolumeMl: mix(access.ventricularVolume),
    atrialPressureMmHg: atrialPressure,
    ventricularPressureMmHg: ventricularPressure,
    atrioventricularPressureGradientMmHg: atrialPressure - ventricularPressure,
    atrioventricularFlowMlPerSec: mix(access.flow),
    prescribedFreeCalciumUm: mix(access.calcium),
    caTroponin01: mix(access.caTroponin),
    thinFilamentAvailability01: mix(access.thinFilament),
    seriesTensionKPa: mix(access.seriesTension),
  };
}

function pointFromSample(
  sample: NoAvpdEventDiagnosticSampleV1,
  access: SideAccessors,
  cycleLengthSec: number,
  method: NoAvpdOperationalEventPointV1["extractionMethod"],
  boundaryCensored: boolean,
): NoAvpdOperationalEventPointV1 {
  const phase01 = normalizePhase(sample.phase01);
  const atrialPressure = access.atrialPressure(sample);
  const ventricularPressure = access.ventricularPressure(sample);
  return {
    phase01,
    timeFromCycleStartSec: phase01 * cycleLengthSec,
    extractionMethod: method,
    boundaryCensored,
    atrialVolumeMl: access.atrialVolume(sample),
    ventricularVolumeMl: access.ventricularVolume(sample),
    atrialPressureMmHg: atrialPressure,
    ventricularPressureMmHg: ventricularPressure,
    atrioventricularPressureGradientMmHg: atrialPressure - ventricularPressure,
    atrioventricularFlowMlPerSec: access.flow(sample),
    prescribedFreeCalciumUm: access.calcium(sample),
    caTroponin01: access.caTroponin(sample),
    thinFilamentAvailability01: access.thinFilament(sample),
    seriesTensionKPa: access.seriesTension(sample),
  };
}

function unwrapAtOrAfter(phase01: number, anchor: number): number {
  let value = normalizePhase(phase01);
  while (value < anchor - 1e-12) value += 1;
  return value;
}

function normalizePhase(phase01: number): number {
  const normalized = ((phase01 % 1) + 1) % 1;
  return Math.abs(normalized - 1) <= 1e-12 ? 0 : normalized;
}

function forwardPhaseDifference(startPhase01: number, endPhase01: number): number {
  return normalizePhase(endPhase01 - startPhase01);
}

function positiveRatio(numerator: number | null, denominator: number | null): number | null {
  return numerator !== null
    && denominator !== null
    && Number.isFinite(numerator)
    && Number.isFinite(denominator)
    && denominator > 0
    ? numerator / denominator
    : null;
}

function finiteDifference(left: number | null, right: number | null): number | null {
  return left !== null && right !== null && Number.isFinite(left) && Number.isFinite(right)
    ? left - right
    : null;
}
