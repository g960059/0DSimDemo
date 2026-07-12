/**
 * Report-only pressure/flow valve-phase timing.
 *
 * This diagnostic intentionally does not infer leaflet contact.  A qualified
 * event requires both an upstream-minus-downstream pressure crossover and a
 * sustained forward-flow threshold crossing.  Conductance midpoint crossings
 * are reported separately and are never named anatomical opening/closure.
 */

export type ValvePhaseEventKindV1 = "opening" | "closing";
export type ValvePhaseEventStatusV1 =
  | "measurable"
  | "censored"
  | "ambiguous"
  | "no-event";

export type ValvePhaseEventSampleV1 = {
  readonly timeSec: number;
  /** Optional direct pressure gradient, defined as upstream minus downstream. */
  readonly pressureGradientMmHg?: number;
  readonly upstreamPressureMmHg?: number;
  readonly downstreamPressureMmHg?: number;
  /** Positive values are forward flow. */
  readonly forwardFlowMlPerSec: number;
  /** Optional model conductance readback. It is not a leaflet-position measurement. */
  readonly conductance01?: number;
};

export type ValvePhaseEventOptionsV1 = {
  /** Dead band on either side of zero pressure gradient. */
  readonly pressureToleranceMmHg: number;
  readonly forwardFlowThresholdMlPerSec: number;
  /** Dead band on either side of the forward-flow threshold. */
  readonly flowToleranceMlPerSec: number;
  /** Required time spent on the post-transition side of the flow threshold. */
  readonly sustainDurationSec: number;
  /** Allows pressure and flow ordering to differ only at numerical resolution. */
  readonly timeToleranceSec: number;
  /** Largest accepted pressure-crossover to flow-threshold delay. */
  readonly maxPressureFlowSeparationSec: number;
  readonly conductanceMidpoint01: number;
};

export const DEFAULT_VALVE_PHASE_EVENT_OPTIONS_V1: ValvePhaseEventOptionsV1 = {
  pressureToleranceMmHg: 0.05,
  forwardFlowThresholdMlPerSec: 1,
  flowToleranceMlPerSec: 0.1,
  sustainDurationSec: 0.012,
  timeToleranceSec: 0.001,
  maxPressureFlowSeparationSec: 0.08,
  conductanceMidpoint01: 0.5,
};

export type ValvePhaseTimeBracketV1 = {
  readonly lowerBoundSec: number;
  readonly upperBoundSec: number;
};

export type ValvePhaseCensoredIntervalV1 = {
  readonly lowerBoundSec: number | null;
  readonly upperBoundSec: number | null;
};

export type ValvePhaseEventCandidateV1 = {
  readonly kind: ValvePhaseEventKindV1;
  /**
   * Operational event time: sustained flow threshold onset/cessation.  The
   * pressure crossover remains separately visible below.
   */
  readonly eventTimeSec: number;
  readonly pressureCrossoverTimeSec: number;
  readonly forwardFlowThresholdTimeSec: number;
  readonly pressureToFlowDelaySec: number;
  /** Uncertainty of the operational flow-threshold event time. */
  readonly eventTimeUncertaintyIntervalSec: ValvePhaseTimeBracketV1;
  /** Full pressure-to-flow association span; this includes physical latency. */
  readonly pressureFlowAssociationIntervalSec: ValvePhaseTimeBracketV1;
  readonly pressureCrossoverBracketSec: ValvePhaseTimeBracketV1;
  readonly forwardFlowThresholdBracketSec: ValvePhaseTimeBracketV1;
};

export type ValvePhaseEventResultV1 =
  | {
    readonly kind: ValvePhaseEventKindV1;
    readonly status: "measurable";
    readonly reason: "one-qualified-pressure-flow-event";
    readonly event: ValvePhaseEventCandidateV1;
  }
  | {
    readonly kind: ValvePhaseEventKindV1;
    readonly status: "censored";
    readonly reason:
      | "event-precedes-observation"
      | "pressure-crossover-precedes-observation"
      | "sustain-window-exceeds-observation";
    readonly boundary: "left" | "right";
    readonly uncertaintyIntervalSec: ValvePhaseCensoredIntervalV1;
  }
  | {
    readonly kind: ValvePhaseEventKindV1;
    readonly status: "ambiguous";
    readonly reason: "multiple-qualified-pressure-flow-events";
    readonly candidates: readonly ValvePhaseEventCandidateV1[];
  }
  | {
    readonly kind: ValvePhaseEventKindV1;
    readonly status: "no-event";
    readonly reason:
      | "invalid-input"
      | "no-pressure-crossover"
      | "no-sustained-flow-transition"
      | "pressure-flow-not-associated";
  };

export type ConductanceMidpointCrossingV1 = {
  readonly direction: "rising" | "falling";
  readonly timeSec: number;
  readonly interpolationBracketSec: ValvePhaseTimeBracketV1;
};

export type ConductanceMidpointDiagnosticV1 = {
  readonly diagnosticName: "conductance-midpoint-crossing";
  readonly anatomicalValveEventClaim: false;
  readonly midpoint01: number;
  readonly status: "measurable" | "not-provided" | "not-measurable";
  readonly reason: "complete-trace" | "conductance-not-provided" | "incomplete-conductance-trace";
  readonly risingCrossings: readonly ConductanceMidpointCrossingV1[];
  readonly fallingCrossings: readonly ConductanceMidpointCrossingV1[];
};

export type ValvePhaseEventContractV1 = {
  readonly inputValidation:
    | { readonly status: "valid"; readonly issues: readonly [] }
    | { readonly status: "invalid"; readonly issues: readonly string[] };
  readonly pressureGradientConvention: "upstream-minus-downstream";
  readonly observationMode: "linear" | "periodic-tiled-center-cycle";
  readonly options: ValvePhaseEventOptionsV1;
  readonly opening: ValvePhaseEventResultV1;
  readonly closing: ValvePhaseEventResultV1;
  readonly conductanceMidpoint: ConductanceMidpointDiagnosticV1;
  readonly claimBoundary: {
    readonly reportOnly: true;
    readonly modifiesSolverState: false;
    readonly anatomicalLeafletTimingClaim: false;
  };
};

type Direction = "rising" | "falling";

type ScalarSample = {
  readonly timeSec: number;
  readonly value: number;
};

type ThresholdCrossing = {
  readonly direction: Direction;
  readonly timeSec: number;
  readonly interpolationBracketSec: ValvePhaseTimeBracketV1;
  /** Conservative span introduced by the configured dead band. */
  readonly toleranceBracketSec: ValvePhaseTimeBracketV1;
};

type SustainedFlowCrossing = ThresholdCrossing & {
  readonly sustainStatus: "verified" | "failed" | "censored-right";
};

const EMPTY_CONDUCTANCE_DIAGNOSTIC: Omit<
  ConductanceMidpointDiagnosticV1,
  "status" | "reason" | "midpoint01"
> = {
  diagnosticName: "conductance-midpoint-crossing",
  anatomicalValveEventClaim: false,
  risingCrossings: [],
  fallingCrossings: [],
};

export function detectValvePhaseEventsV1(
  samples: readonly ValvePhaseEventSampleV1[],
  optionOverrides: Partial<ValvePhaseEventOptionsV1> = {},
): ValvePhaseEventContractV1 {
  const options = resolveOptions(optionOverrides);
  const issues = validateInput(samples, options);
  if (issues.length > 0) {
    return {
      inputValidation: { status: "invalid", issues },
      pressureGradientConvention: "upstream-minus-downstream",
      observationMode: "linear",
      options,
      opening: noEvent("opening", "invalid-input"),
      closing: noEvent("closing", "invalid-input"),
      conductanceMidpoint: conductanceDiagnostic(samples, options.conductanceMidpoint01),
      claimBoundary: claimBoundary(),
    };
  }

  const pressure = samples.map((sample) => ({
    timeSec: sample.timeSec,
    value: pressureGradient(sample),
  }));
  const flow = samples.map((sample) => ({
    timeSec: sample.timeSec,
    value: sample.forwardFlowMlPerSec,
  }));
  const pressureCrossings = thresholdCrossings(
    pressure,
    0,
    options.pressureToleranceMmHg,
  );
  const flowCrossings = thresholdCrossings(
    flow,
    options.forwardFlowThresholdMlPerSec,
    options.flowToleranceMlPerSec,
  ).map((crossing): SustainedFlowCrossing => ({
    ...crossing,
    sustainStatus: verifySustain(
      flow,
      crossing,
      options.forwardFlowThresholdMlPerSec,
      options.sustainDurationSec,
      options.timeToleranceSec,
    ),
  }));

  return {
    inputValidation: { status: "valid", issues: [] },
    pressureGradientConvention: "upstream-minus-downstream",
    observationMode: "linear",
    options,
    opening: classifyEvent(
      "opening",
      pressure,
      flow,
      pressureCrossings,
      flowCrossings,
      options,
    ),
    closing: classifyEvent(
      "closing",
      pressure,
      flow,
      pressureCrossings,
      flowCrossings,
      options,
    ),
    conductanceMidpoint: conductanceDiagnostic(samples, options.conductanceMidpoint01),
    claimBoundary: claimBoundary(),
  };
}

/**
 * Periodic one-cycle wrapper. Three tiled copies provide complete pressure,
 * flow-sustain, and interpolation context across the phase seam; only events
 * whose operational flow time belongs to the center cycle are retained and
 * mapped back to [0, cycleLengthSec).
 */
export function detectPeriodicValvePhaseEventsV1(
  samples: readonly ValvePhaseEventSampleV1[],
  cycleLengthSec: number,
  optionOverrides: Partial<ValvePhaseEventOptionsV1> = {},
): ValvePhaseEventContractV1 {
  const options = resolveOptions(optionOverrides);
  const issues = validateInput(samples, options);
  if (!Number.isFinite(cycleLengthSec) || cycleLengthSec <= 0) {
    issues.push("cycleLengthSec must be finite and positive");
  }
  if (samples.length >= 2 && Number.isFinite(cycleLengthSec) && cycleLengthSec > 0) {
    const intervals = samples.slice(1).map((sample, index) =>
      sample.timeSec - samples[index]!.timeSec
    );
    const maximumIntervalSec = Math.max(...intervals);
    const seamIntervalSec = samples[0]!.timeSec + cycleLengthSec -
      samples.at(-1)!.timeSec;
    if (
      !Number.isFinite(seamIntervalSec) || seamIntervalSec <= 0 ||
      seamIntervalSec > maximumIntervalSec + options.timeToleranceSec
    ) {
      issues.push(
        "samples must cover one periodic cycle with a seam gap no larger than one sample interval plus time tolerance",
      );
    }
  }
  if (issues.length > 0) {
    return {
      inputValidation: { status: "invalid", issues },
      pressureGradientConvention: "upstream-minus-downstream",
      observationMode: "periodic-tiled-center-cycle",
      options,
      opening: noEvent("opening", "invalid-input"),
      closing: noEvent("closing", "invalid-input"),
      conductanceMidpoint: conductanceDiagnostic(
        samples,
        options.conductanceMidpoint01,
      ),
      claimBoundary: claimBoundary(),
    };
  }

  const tiled = [-cycleLengthSec, 0, cycleLengthSec].flatMap((shiftSec) =>
    samples.map((sample) => ({
      ...sample,
      timeSec: sample.timeSec + shiftSec,
    }))
  );
  const tiledResult = detectValvePhaseEventsV1(tiled, options);
  const windowStartSec = samples[0]!.timeSec;
  const windowEndSec = windowStartSec + cycleLengthSec;
  return {
    ...tiledResult,
    observationMode: "periodic-tiled-center-cycle",
    opening: selectPeriodicCenterEvent(
      tiledResult.opening,
      windowStartSec,
      windowEndSec,
      cycleLengthSec,
    ),
    closing: selectPeriodicCenterEvent(
      tiledResult.closing,
      windowStartSec,
      windowEndSec,
      cycleLengthSec,
    ),
    conductanceMidpoint: selectPeriodicConductanceCrossings(
      tiledResult.conductanceMidpoint,
      windowStartSec,
      windowEndSec,
      cycleLengthSec,
    ),
  };
}

function classifyEvent(
  kind: ValvePhaseEventKindV1,
  pressure: readonly ScalarSample[],
  flow: readonly ScalarSample[],
  pressureCrossings: readonly ThresholdCrossing[],
  flowCrossings: readonly SustainedFlowCrossing[],
  options: ValvePhaseEventOptionsV1,
): ValvePhaseEventResultV1 {
  const direction: Direction = kind === "opening" ? "rising" : "falling";
  const relevantPressure = pressureCrossings.filter((item) => item.direction === direction);
  const relevantFlow = flowCrossings.filter((item) => item.direction === direction);
  const verifiedFlow = relevantFlow.filter((item) => item.sustainStatus === "verified");
  const candidates = associatePressureAndFlow(
    kind,
    relevantPressure,
    verifiedFlow,
    pressure[0]!.timeSec,
    pressure[pressure.length - 1]!.timeSec,
    options,
  );

  if (candidates.length === 1) {
    return {
      kind,
      status: "measurable",
      reason: "one-qualified-pressure-flow-event",
      event: candidates[0]!,
    };
  }
  if (candidates.length > 1) {
    return {
      kind,
      status: "ambiguous",
      reason: "multiple-qualified-pressure-flow-events",
      candidates,
    };
  }

  const rightCensoredFlow = relevantFlow.find(
    (item) => item.sustainStatus === "censored-right" &&
      hasAssociatedPressure(item, relevantPressure, options),
  );
  if (rightCensoredFlow) {
    const observationStartSec = flow[0]!.timeSec;
    const observationEndSec = flow[flow.length - 1]!.timeSec;
    return {
      kind,
      status: "censored",
      reason: "sustain-window-exceeds-observation",
      boundary: "right",
      uncertaintyIntervalSec: {
        lowerBoundSec: Math.max(
          observationStartSec,
          rightCensoredFlow.toleranceBracketSec.lowerBoundSec -
            options.timeToleranceSec,
        ),
        upperBoundSec: Math.min(
          observationEndSec,
          rightCensoredFlow.toleranceBracketSec.upperBoundSec +
            options.timeToleranceSec,
        ),
      },
    };
  }

  if (
    relevantPressure.length === 0 &&
    verifiedFlow.length > 0 &&
    startsOnPostPressureSide(kind, pressure, options)
  ) {
    const firstFlow = verifiedFlow[0]!;
    return {
      kind,
      status: "censored",
      reason: "pressure-crossover-precedes-observation",
      boundary: "left",
      uncertaintyIntervalSec: {
        lowerBoundSec: null,
        upperBoundSec: Math.min(
          flow[flow.length - 1]!.timeSec,
          firstFlow.toleranceBracketSec.upperBoundSec + options.timeToleranceSec,
        ),
      },
    };
  }

  if (
    relevantPressure.length === 0 &&
    relevantFlow.length === 0 &&
    startsOnPostPressureSide(kind, pressure, options) &&
    startsOnPostFlowSide(kind, flow, options) &&
    postFlowStateSustainedFromStart(kind, flow, options)
  ) {
    return {
      kind,
      status: "censored",
      reason: "event-precedes-observation",
      boundary: "left",
      uncertaintyIntervalSec: {
        lowerBoundSec: null,
        upperBoundSec: flow[0]!.timeSec + options.timeToleranceSec,
      },
    };
  }

  if (relevantPressure.length === 0) return noEvent(kind, "no-pressure-crossover");
  if (verifiedFlow.length === 0) return noEvent(kind, "no-sustained-flow-transition");
  return noEvent(kind, "pressure-flow-not-associated");
}

function associatePressureAndFlow(
  kind: ValvePhaseEventKindV1,
  pressureCrossings: readonly ThresholdCrossing[],
  flowCrossings: readonly SustainedFlowCrossing[],
  observationStartSec: number,
  observationEndSec: number,
  options: ValvePhaseEventOptionsV1,
): ValvePhaseEventCandidateV1[] {
  const candidates: ValvePhaseEventCandidateV1[] = [];
  for (const flow of flowCrossings) {
    const eligible = pressureCrossings
      .filter((pressure) => pressure.timeSec <= flow.timeSec + options.timeToleranceSec)
      .filter(
        (pressure) => flow.timeSec - pressure.timeSec <=
          options.maxPressureFlowSeparationSec + options.timeToleranceSec,
      )
      .sort(
        (left, right) =>
          Math.abs(flow.timeSec - left.timeSec) - Math.abs(flow.timeSec - right.timeSec),
      );
    const pressure = eligible[0];
    if (!pressure) continue;
    candidates.push({
      kind,
      eventTimeSec: flow.timeSec,
      pressureCrossoverTimeSec: pressure.timeSec,
      forwardFlowThresholdTimeSec: flow.timeSec,
      pressureToFlowDelaySec: flow.timeSec - pressure.timeSec,
      eventTimeUncertaintyIntervalSec: {
        lowerBoundSec: Math.max(
          observationStartSec,
          flow.toleranceBracketSec.lowerBoundSec - options.timeToleranceSec,
        ),
        upperBoundSec: Math.min(
          observationEndSec,
          flow.toleranceBracketSec.upperBoundSec + options.timeToleranceSec,
        ),
      },
      pressureFlowAssociationIntervalSec: {
        lowerBoundSec: Math.max(
          observationStartSec,
          Math.min(
            pressure.toleranceBracketSec.lowerBoundSec,
            flow.toleranceBracketSec.lowerBoundSec,
          ) - options.timeToleranceSec,
        ),
        upperBoundSec: Math.min(
          observationEndSec,
          Math.max(
            pressure.toleranceBracketSec.upperBoundSec,
            flow.toleranceBracketSec.upperBoundSec,
          ) + options.timeToleranceSec,
        ),
      },
      pressureCrossoverBracketSec: pressure.toleranceBracketSec,
      forwardFlowThresholdBracketSec: flow.toleranceBracketSec,
    });
  }
  return candidates;
}

function selectPeriodicCenterEvent(
  result: ValvePhaseEventResultV1,
  windowStartSec: number,
  windowEndSec: number,
  cycleLengthSec: number,
): ValvePhaseEventResultV1 {
  const candidates = result.status === "measurable"
    ? [result.event]
    : result.status === "ambiguous"
    ? result.candidates
    : [];
  const selected = candidates
    .filter((candidate) =>
      candidate.eventTimeSec >= windowStartSec &&
      candidate.eventTimeSec < windowEndSec
    )
    .map((candidate) => normalizePeriodicCandidate(candidate, cycleLengthSec));
  if (selected.length === 1) {
    return {
      kind: result.kind,
      status: "measurable",
      reason: "one-qualified-pressure-flow-event",
      event: selected[0]!,
    };
  }
  if (selected.length > 1) {
    return {
      kind: result.kind,
      status: "ambiguous",
      reason: "multiple-qualified-pressure-flow-events",
      candidates: selected,
    };
  }
  return result.status === "no-event"
    ? result
    : noEvent(result.kind, "pressure-flow-not-associated");
}

function normalizePeriodicCandidate(
  candidate: ValvePhaseEventCandidateV1,
  cycleLengthSec: number,
): ValvePhaseEventCandidateV1 {
  const cycleIndex = Math.floor(candidate.eventTimeSec / cycleLengthSec);
  const shiftSec = -cycleIndex * cycleLengthSec;
  const shiftBracket = (
    bracket: ValvePhaseTimeBracketV1,
  ): ValvePhaseTimeBracketV1 => ({
    lowerBoundSec: bracket.lowerBoundSec + shiftSec,
    upperBoundSec: bracket.upperBoundSec + shiftSec,
  });
  return {
    ...candidate,
    eventTimeSec: candidate.eventTimeSec + shiftSec,
    pressureCrossoverTimeSec:
      candidate.pressureCrossoverTimeSec + shiftSec,
    forwardFlowThresholdTimeSec:
      candidate.forwardFlowThresholdTimeSec + shiftSec,
    eventTimeUncertaintyIntervalSec: shiftBracket(
      candidate.eventTimeUncertaintyIntervalSec,
    ),
    pressureFlowAssociationIntervalSec: shiftBracket(
      candidate.pressureFlowAssociationIntervalSec,
    ),
    pressureCrossoverBracketSec: shiftBracket(
      candidate.pressureCrossoverBracketSec,
    ),
    forwardFlowThresholdBracketSec: shiftBracket(
      candidate.forwardFlowThresholdBracketSec,
    ),
  };
}

function selectPeriodicConductanceCrossings(
  diagnostic: ConductanceMidpointDiagnosticV1,
  windowStartSec: number,
  windowEndSec: number,
  cycleLengthSec: number,
): ConductanceMidpointDiagnosticV1 {
  const select = (
    crossings: readonly ConductanceMidpointCrossingV1[],
  ): ConductanceMidpointCrossingV1[] => crossings
    .filter((crossing) =>
      crossing.timeSec >= windowStartSec && crossing.timeSec < windowEndSec
    )
    .map((crossing) => {
      const cycleIndex = Math.floor(crossing.timeSec / cycleLengthSec);
      const shiftSec = -cycleIndex * cycleLengthSec;
      return {
        ...crossing,
        timeSec: crossing.timeSec + shiftSec,
        interpolationBracketSec: {
          lowerBoundSec:
            crossing.interpolationBracketSec.lowerBoundSec + shiftSec,
          upperBoundSec:
            crossing.interpolationBracketSec.upperBoundSec + shiftSec,
        },
      };
    });
  return {
    ...diagnostic,
    risingCrossings: select(diagnostic.risingCrossings),
    fallingCrossings: select(diagnostic.fallingCrossings),
  };
}

function hasAssociatedPressure(
  flow: ThresholdCrossing,
  pressureCrossings: readonly ThresholdCrossing[],
  options: ValvePhaseEventOptionsV1,
): boolean {
  return pressureCrossings.some(
    (pressure) => pressure.timeSec <= flow.timeSec + options.timeToleranceSec &&
      flow.timeSec - pressure.timeSec <=
        options.maxPressureFlowSeparationSec + options.timeToleranceSec,
  );
}

function thresholdCrossings(
  samples: readonly ScalarSample[],
  threshold: number,
  tolerance: number,
): ThresholdCrossing[] {
  const crossings: ThresholdCrossing[] = [];
  let previousDecisiveIndex: number | null = null;
  let previousSide: -1 | 1 | null = null;

  for (let index = 0; index < samples.length; index += 1) {
    const side = decisiveSide(samples[index]!.value, threshold, tolerance);
    if (side === 0) continue;
    if (previousDecisiveIndex === null || previousSide === null) {
      previousDecisiveIndex = index;
      previousSide = side;
      continue;
    }
    if (side === previousSide) {
      previousDecisiveIndex = index;
      continue;
    }

    const interpolation = findLocalInterpolationBracket(
      samples,
      previousDecisiveIndex,
      index,
      threshold,
    );
    crossings.push({
      direction: previousSide < side ? "rising" : "falling",
      timeSec: interpolateThresholdTime(interpolation.left, interpolation.right, threshold),
      interpolationBracketSec: {
        lowerBoundSec: interpolation.left.timeSec,
        upperBoundSec: interpolation.right.timeSec,
      },
      toleranceBracketSec: {
        lowerBoundSec: samples[previousDecisiveIndex]!.timeSec,
        upperBoundSec: samples[index]!.timeSec,
      },
    });
    previousDecisiveIndex = index;
    previousSide = side;
  }
  return crossings;
}

function verifySustain(
  samples: readonly ScalarSample[],
  crossing: ThresholdCrossing,
  threshold: number,
  sustainDurationSec: number,
  timeToleranceSec: number,
): SustainedFlowCrossing["sustainStatus"] {
  const sustainEndSec = crossing.timeSec + sustainDurationSec;
  const observationEndSec = samples[samples.length - 1]!.timeSec;
  if (sustainEndSec > observationEndSec + timeToleranceSec) return "censored-right";
  const boundedEndSec = Math.min(sustainEndSec, observationEndSec);
  for (const sample of samples) {
    if (sample.timeSec <= crossing.timeSec || sample.timeSec >= boundedEndSec) continue;
    if (crossing.direction === "rising" && sample.value <= threshold) return "failed";
    if (crossing.direction === "falling" && sample.value >= threshold) return "failed";
  }
  const endValue = interpolateScalarAtTime(samples, boundedEndSec);
  if (crossing.direction === "rising" && endValue <= threshold) return "failed";
  if (crossing.direction === "falling" && endValue >= threshold) return "failed";
  return "verified";
}

function conductanceDiagnostic(
  samples: readonly ValvePhaseEventSampleV1[],
  midpoint01: number,
): ConductanceMidpointDiagnosticV1 {
  const providedCount = samples.filter((sample) => sample.conductance01 !== undefined).length;
  if (providedCount === 0) {
    return {
      ...EMPTY_CONDUCTANCE_DIAGNOSTIC,
      midpoint01,
      status: "not-provided",
      reason: "conductance-not-provided",
    };
  }
  if (
    providedCount !== samples.length ||
    samples.some(
      (sample) => sample.conductance01 === undefined ||
        !Number.isFinite(sample.conductance01) ||
        sample.conductance01 < 0 ||
        sample.conductance01 > 1,
    )
  ) {
    return {
      ...EMPTY_CONDUCTANCE_DIAGNOSTIC,
      midpoint01,
      status: "not-measurable",
      reason: "incomplete-conductance-trace",
    };
  }

  const scalar = samples.map((sample) => ({
    timeSec: sample.timeSec,
    value: sample.conductance01!,
  }));
  const crossings = thresholdCrossings(scalar, midpoint01, 0);
  const mapped = crossings.map((crossing): ConductanceMidpointCrossingV1 => ({
    direction: crossing.direction,
    timeSec: crossing.timeSec,
    interpolationBracketSec: crossing.interpolationBracketSec,
  }));
  return {
    diagnosticName: "conductance-midpoint-crossing",
    anatomicalValveEventClaim: false,
    midpoint01,
    status: "measurable",
    reason: "complete-trace",
    risingCrossings: mapped.filter((crossing) => crossing.direction === "rising"),
    fallingCrossings: mapped.filter((crossing) => crossing.direction === "falling"),
  };
}

function resolveOptions(
  overrides: Partial<ValvePhaseEventOptionsV1>,
): ValvePhaseEventOptionsV1 {
  return {
    pressureToleranceMmHg:
      overrides.pressureToleranceMmHg ?? DEFAULT_VALVE_PHASE_EVENT_OPTIONS_V1.pressureToleranceMmHg,
    forwardFlowThresholdMlPerSec:
      overrides.forwardFlowThresholdMlPerSec ??
      DEFAULT_VALVE_PHASE_EVENT_OPTIONS_V1.forwardFlowThresholdMlPerSec,
    flowToleranceMlPerSec:
      overrides.flowToleranceMlPerSec ?? DEFAULT_VALVE_PHASE_EVENT_OPTIONS_V1.flowToleranceMlPerSec,
    sustainDurationSec:
      overrides.sustainDurationSec ?? DEFAULT_VALVE_PHASE_EVENT_OPTIONS_V1.sustainDurationSec,
    timeToleranceSec:
      overrides.timeToleranceSec ?? DEFAULT_VALVE_PHASE_EVENT_OPTIONS_V1.timeToleranceSec,
    maxPressureFlowSeparationSec:
      overrides.maxPressureFlowSeparationSec ??
      DEFAULT_VALVE_PHASE_EVENT_OPTIONS_V1.maxPressureFlowSeparationSec,
    conductanceMidpoint01:
      overrides.conductanceMidpoint01 ?? DEFAULT_VALVE_PHASE_EVENT_OPTIONS_V1.conductanceMidpoint01,
  };
}

function validateInput(
  samples: readonly ValvePhaseEventSampleV1[],
  options: ValvePhaseEventOptionsV1,
): string[] {
  const issues: string[] = [];
  if (samples.length < 2) issues.push("at least two samples are required");
  validateNonNegativeOption(issues, "pressureToleranceMmHg", options.pressureToleranceMmHg);
  validateNonNegativeOption(issues, "flowToleranceMlPerSec", options.flowToleranceMlPerSec);
  if (!Number.isFinite(options.sustainDurationSec) || options.sustainDurationSec <= 0) {
    issues.push("sustainDurationSec must be finite and positive");
  }
  validateNonNegativeOption(issues, "timeToleranceSec", options.timeToleranceSec);
  validateNonNegativeOption(
    issues,
    "maxPressureFlowSeparationSec",
    options.maxPressureFlowSeparationSec,
  );
  if (
    !Number.isFinite(options.forwardFlowThresholdMlPerSec) ||
    options.forwardFlowThresholdMlPerSec <= 0
  ) {
    issues.push("forwardFlowThresholdMlPerSec must be finite and positive");
  }
  if (
    Number.isFinite(options.forwardFlowThresholdMlPerSec) &&
    Number.isFinite(options.flowToleranceMlPerSec) &&
    options.flowToleranceMlPerSec >= options.forwardFlowThresholdMlPerSec
  ) {
    issues.push(
      "flowToleranceMlPerSec must be smaller than forwardFlowThresholdMlPerSec",
    );
  }
  if (
    !Number.isFinite(options.conductanceMidpoint01) ||
    options.conductanceMidpoint01 <= 0 ||
    options.conductanceMidpoint01 >= 1
  ) {
    issues.push("conductanceMidpoint01 must be strictly between zero and one");
  }

  samples.forEach((sample, index) => {
    if (!Number.isFinite(sample.timeSec)) issues.push(`samples[${index}].timeSec must be finite`);
    if (!Number.isFinite(sample.forwardFlowMlPerSec)) {
      issues.push(`samples[${index}].forwardFlowMlPerSec must be finite`);
    }
    const hasGradient = Number.isFinite(sample.pressureGradientMmHg);
    const hasPressurePair = Number.isFinite(sample.upstreamPressureMmHg) &&
      Number.isFinite(sample.downstreamPressureMmHg);
    if (!hasGradient && !hasPressurePair) {
      issues.push(
        `samples[${index}] requires a finite pressureGradientMmHg or both chamber pressures`,
      );
    }
    if (hasGradient && hasPressurePair) {
      const pairGradient = sample.upstreamPressureMmHg! -
        sample.downstreamPressureMmHg!;
      if (
        Math.abs(pairGradient - sample.pressureGradientMmHg!) >
          Math.max(options.pressureToleranceMmHg, 1e-12)
      ) {
        issues.push(
          `samples[${index}] pressureGradientMmHg conflicts with the pressure pair`,
        );
      }
    }
    if (index > 0 && !(sample.timeSec > samples[index - 1]!.timeSec)) {
      issues.push("sample times must be strictly increasing");
    }
  });
  return issues;
}

function validateNonNegativeOption(issues: string[], name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) issues.push(`${name} must be finite and non-negative`);
}

function pressureGradient(sample: ValvePhaseEventSampleV1): number {
  if (Number.isFinite(sample.pressureGradientMmHg)) return sample.pressureGradientMmHg!;
  return sample.upstreamPressureMmHg! - sample.downstreamPressureMmHg!;
}

function decisiveSide(value: number, threshold: number, tolerance: number): -1 | 0 | 1 {
  if (value < threshold - tolerance) return -1;
  if (value > threshold + tolerance) return 1;
  return 0;
}

function findLocalInterpolationBracket(
  samples: readonly ScalarSample[],
  startIndex: number,
  endIndex: number,
  threshold: number,
): { readonly left: ScalarSample; readonly right: ScalarSample } {
  for (let index = startIndex; index < endIndex; index += 1) {
    const left = samples[index]!;
    const right = samples[index + 1]!;
    if ((left.value - threshold) * (right.value - threshold) <= 0) return { left, right };
  }
  return { left: samples[startIndex]!, right: samples[endIndex]! };
}

function interpolateThresholdTime(
  left: ScalarSample,
  right: ScalarSample,
  threshold: number,
): number {
  const delta = right.value - left.value;
  if (delta === 0) return 0.5 * (left.timeSec + right.timeSec);
  const fraction = clamp01((threshold - left.value) / delta);
  return left.timeSec + fraction * (right.timeSec - left.timeSec);
}

function interpolateScalarAtTime(samples: readonly ScalarSample[], timeSec: number): number {
  if (timeSec <= samples[0]!.timeSec) return samples[0]!.value;
  if (timeSec >= samples[samples.length - 1]!.timeSec) return samples[samples.length - 1]!.value;
  let upperIndex = 1;
  while (samples[upperIndex]!.timeSec < timeSec) upperIndex += 1;
  const left = samples[upperIndex - 1]!;
  const right = samples[upperIndex]!;
  const fraction = (timeSec - left.timeSec) / (right.timeSec - left.timeSec);
  return left.value + fraction * (right.value - left.value);
}

function startsOnPostPressureSide(
  kind: ValvePhaseEventKindV1,
  pressure: readonly ScalarSample[],
  options: ValvePhaseEventOptionsV1,
): boolean {
  const side = decisiveSide(pressure[0]!.value, 0, options.pressureToleranceMmHg);
  return kind === "opening" ? side === 1 : side === -1;
}

function startsOnPostFlowSide(
  kind: ValvePhaseEventKindV1,
  flow: readonly ScalarSample[],
  options: ValvePhaseEventOptionsV1,
): boolean {
  const side = decisiveSide(
    flow[0]!.value,
    options.forwardFlowThresholdMlPerSec,
    options.flowToleranceMlPerSec,
  );
  return kind === "opening" ? side === 1 : side === -1;
}

function postFlowStateSustainedFromStart(
  kind: ValvePhaseEventKindV1,
  flow: readonly ScalarSample[],
  options: ValvePhaseEventOptionsV1,
): boolean {
  const targetTimeSec = flow[0]!.timeSec + options.sustainDurationSec;
  if (targetTimeSec > flow[flow.length - 1]!.timeSec + options.timeToleranceSec) return false;
  const boundedTargetSec = Math.min(targetTimeSec, flow[flow.length - 1]!.timeSec);
  const threshold = options.forwardFlowThresholdMlPerSec;
  for (const sample of flow) {
    if (sample.timeSec > boundedTargetSec) break;
    if (kind === "opening" && sample.value <= threshold) return false;
    if (kind === "closing" && sample.value >= threshold) return false;
  }
  const endValue = interpolateScalarAtTime(flow, boundedTargetSec);
  return kind === "opening" ? endValue > threshold : endValue < threshold;
}

function noEvent(
  kind: ValvePhaseEventKindV1,
  reason: Extract<ValvePhaseEventResultV1, { status: "no-event" }>["reason"],
): ValvePhaseEventResultV1 {
  return { kind, status: "no-event", reason };
}

function claimBoundary(): ValvePhaseEventContractV1["claimBoundary"] {
  return {
    reportOnly: true,
    modifiesSolverState: false,
    anatomicalLeafletTimingClaim: false,
  };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
