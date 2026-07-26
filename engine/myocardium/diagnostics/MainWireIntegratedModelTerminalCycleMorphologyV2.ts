import type {
  MainWireIntegratedModelTerminalCycleTraceSampleV2,
  MainWireIntegratedModelTerminalCycleTraceV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelNumericalVerificationV2";
import type {
  RotaryPumpForwardFlowEvidenceStatusV1,
} from "@/engine/devices/typesV1";

export const MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_MORPHOLOGY_V2_ID =
  "main-wire-integrated-terminal-cycle-raw-morphology-v2" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_MORPHOLOGY_V2_CLAIM =
  Object.freeze({
    evidenceRole: "exploratory-raw-endpoint-morphology-and-flow-ledger" as const,
    rightEndpointTimeQuadrature: true as const,
    interpolationApplied: false as const,
    resamplingApplied: false as const,
    smoothingApplied: false as const,
    waveformOrParameterFittingApplied: false as const,
    closedPolygonAreaUsesRawTerminalToFirstClosureSegment: true as const,
    terminalCyclePeriodicityRequired: false as const,
    isovolumicPhasesRequiredForDeviceOnDescription: false as const,
    volumeExtremaRelabeledAsEdvOrEsv: false as const,
    lvefReported: false as const,
    thresholdTuningFromTraceApplied: false as const,
    physiologicalAcceptanceClaimed: false as const,
    shapeAcceptanceClaimed: false as const,
    clinicalValidationClaimed: false as const,
    releaseAcceptanceClaimed: false as const,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_STATIONS_V2 = Object.freeze({
  aorticPressure:
    "absolute pressure at noncoronary systemic aortic compliance node Ao",
  leftVentricularPressure:
    "absolute pressure at noncoronary left-ventricular chamber node LV",
  leftVentricularVolume:
    "blood volume at noncoronary left-ventricular chamber node LV",
  nativeAorticValve:
    "signed native aortic-valve flow from LV to Ao; positive is LV-to-Ao",
  mitralValve:
    "signed native mitral-valve flow from LA to LV; positive is LA-to-LV",
  lvad:
    "signed HeartMate-II verification-circuit flow from LV inlet to Ao outlet; positive is LV-to-Ao",
  lvadDeliveredHead:
    "pump-local delivered pressure rise from pre-pump station to post-pump station (post minus pre)",
  lvadCircuitPressureRise:
    "whole-circuit outlet-node minus inlet-node pressure (Ao minus LV); not pump-local delivered head",
  coronaryTotalInlet:
    "aggregate signed flow from systemic Ao into all coronary territory inlets",
  ladSubendocardialQm:
    "LAD subendocardial internal Qm segment flow; not a clinical epicardial velocity station",
});

const FORWARD_FLOW_EVIDENCE_STATUSES = Object.freeze([
  "not-declared",
  "non-forward-flow-not-applicable",
  "within-published-experimental-domain",
  "above-published-experimental-domain-within-advertised-capacity",
  "above-advertised-capacity",
] as const satisfies readonly RotaryPumpForwardFlowEvidenceStatusV1[]);

type LoopOrientationV2 = "counterclockwise" | "clockwise" | "degenerate";

type EndpointLocationV2 = Readonly<{
  acceptedStepIndexWithinCycle: number;
  acceptedTimeSec: number;
  cyclePhase01: number;
}>;

type LocatedValueV2 = EndpointLocationV2 & Readonly<{ value: number }>;

type ScalarSummaryV2 = Readonly<{
  unit: string;
  timeWeightedMean: number;
  minimum: LocatedValueV2;
  maximum: LocatedValueV2;
}>;

type ValveEventV2 = EndpointLocationV2 & Readonly<{
  valve: "MV" | "AoV";
  transition:
    | "positive-to-zero-opening-target"
    | "zero-to-positive-opening-target";
  endpointConvention:
    "first-accepted-endpoint-after-detected-opening-target-state-change-no-interpolation";
}>;

type EventDefinedVolumeV2 =
  | Readonly<{
    available: true;
    valueMl: number;
    event: ValveEventV2;
    definition: string;
  }>
  | Readonly<{
    available: false;
    valueMl: null;
    event: null;
    definition: string;
    reason: string;
  }>;

export type MainWireIntegratedModelTerminalCycleMorphologyV2 = Readonly<{
  descriptorId:
    typeof MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_MORPHOLOGY_V2_ID;
  claim:
    typeof MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_MORPHOLOGY_V2_CLAIM;
  stations: typeof MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_STATIONS_V2;
  cycleIndex: number;
  sampleCount: number;
  durationSec: number;
  pressure: Readonly<{
    aortic: ScalarSummaryV2;
    leftVentricular: ScalarSummaryV2;
    lvMinusAoCrossings: Readonly<{
      count: number;
      order: readonly (EndpointLocationV2 & Readonly<{
        direction: "LV-rises-above-Ao" | "LV-falls-below-Ao";
      }>)[];
      detection:
        "accepted-order-sign-change-first-endpoint-no-interpolation-no-cyclic-edge";
    }>;
  }>;
  valveEvents: Readonly<{
    ordered: readonly ValveEventV2[];
    systolicWindow: Readonly<{
      available: boolean;
      startMitralClosure: ValveEventV2 | null;
      aorticOpening: ValveEventV2 | null;
      aorticClosure: ValveEventV2 | null;
      endMitralOpening: ValveEventV2 | null;
      wrapsTraceBoundary: boolean;
      reason: string | null;
      definition:
        "MV-positive-to-zero through subsequent MV-zero-to-positive opening-target transitions";
    }>;
  }>;
  leftVentricularVolume: Readonly<{
    endDiastolic: EventDefinedVolumeV2;
    endSystolic: EventDefinedVolumeV2;
    rawExtremaOnly: ScalarSummaryV2;
    lvefReported: false;
    rawExtremaRelabeledAsEdvOrEsv: false;
  }>;
  pressureVolumeLoop: Readonly<{
    xStation: typeof MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_STATIONS_V2.leftVentricularVolume;
    yStation: typeof MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_STATIONS_V2.leftVentricularPressure;
    signedClosedPolygonAreaMmHgMl: number;
    absoluteClosedPolygonAreaMmHgMl: number;
    orientation: LoopOrientationV2;
    polygonClosure:
      "raw-terminal-endpoint-to-raw-first-endpoint-for-area-only-nonperiodic-allowed";
    selfIntersection: Readonly<{
      present: boolean;
      properOrTouchingNonadjacentSegmentPairCount: number;
      exactFloatingPointOrientationNoGeometricTolerance: true;
    }>;
  }>;
  flowLedger: Readonly<{
    nativeAorticValve: Readonly<{
      forwardStrokeVolumeMl: number;
      reverseVolumeMagnitudeMl: number;
      netStrokeVolumeMl: number;
    }>;
    lvad: Readonly<{
      signedBeatVolumeMl: number;
      forwardBeatVolumeMl: number;
      reverseBeatVolumeMagnitudeMl: number;
    }>;
    combined: Readonly<{
      forwardBeatVolumeMl: number;
      netBeatVolumeMl: number;
      forwardOutputLMin: number;
      netOutputLMin: number;
      lvadForwardSupportFraction01: number | null;
      supportFractionDefinition:
        "LVAD-forward-volume-divided-by-native-AoV-plus-LVAD-forward-volume";
    }>;
  }>;
  lvadFlow: Readonly<{
    unit: "mL/s";
    timeWeightedMeanMlPerSec: number;
    timeWeightedTemporalPopulationSdMlPerSec: number;
    minimumMlPerSec: number;
    maximumMlPerSec: number;
    forwardResidenceFraction01: number;
    zeroResidenceFraction01: number;
    reverseResidenceFraction01: number;
    literatureFlowResidenceFraction01: Readonly<{
      below3LMin: number;
      below3Point8LMin: number;
      above10LMin: number;
      comparisons:
        "signed-raw-endpoint-flow-times-right-endpoint-dt-strict-less-or-greater";
      thresholdsSource:
        "primary-literature-audit-predeclared-not-selected-from-this-trace";
    }>;
    rawPulsatilityIndex: number | null;
    rawPulsatilityFormula:
      "(raw-maximum-flow-minus-raw-minimum-flow)/time-weighted-mean-flow";
    commercialPumpPiClaimed: false;
    evidenceDomainResidenceFraction01: Readonly<Record<
      RotaryPumpForwardFlowEvidenceStatusV1,
      number
    >>;
    evidenceDomainResidenceDenominator: "whole-cycle-time";
    publishedExperimentalTraversalUpperLMin: number | null;
    advertisedCapacityLMin: number | null;
    pumpPressureReadback: Readonly<{
      prePump: ScalarSummaryV2;
      postPump: ScalarSummaryV2;
      deliveredPumpPressureRise: ScalarSummaryV2;
      maximumAbsolutePostMinusPreIdentityResidualMmHg: number;
      identity:
        "delivered-pump-pressure-rise-is-post-pump-minus-pre-pump-at-each-raw-endpoint";
    }>;
  }>;
  lvadHeadFlowLoop: Readonly<{
    signedClosedPolygonAreaMmHgMlPerSec: number;
    absoluteClosedPolygonAreaMmHgMlPerSec: number;
    orientation: LoopOrientationV2;
    polygonClosure:
      "raw-terminal-endpoint-to-raw-first-endpoint-for-area-only-nonperiodic-allowed";
    traversal: Readonly<{
      flowMinimumMlPerSec: number;
      flowMaximumMlPerSec: number;
      flowRangeMlPerSec: number;
      pressureRiseMinimumMmHg: number;
      pressureRiseMaximumMmHg: number;
      pressureRiseRangeMmHg: number;
      flowMinimumEndpoint: LocatedValueV2;
      flowMaximumEndpoint: LocatedValueV2;
      pressureRiseMinimumEndpoint: LocatedValueV2;
      pressureRiseMaximumEndpoint: LocatedValueV2;
      pressureMaximumMinusFlowMaximumLagSec: number;
      pressureMaximumMinusFlowMaximumLagPhase01: number;
      lagConvention:
        "raw-pressure-rise-maximum-endpoint-minus-raw-flow-maximum-endpoint-no-interpolation-no-wrapping";
      firstRawEndpoint: Readonly<{
        flowMlPerSec: number;
        pressureRiseMmHg: number;
      }>;
      terminalRawEndpoint: Readonly<{
        flowMlPerSec: number;
        pressureRiseMmHg: number;
      }>;
    }>;
  }>;
  coronaryPhaseLedger: Readonly<{
    aggregateAorticInlet: CoronaryPhaseStationLedgerV2;
    ladSubendocardialInternalQm: CoronaryPhaseStationLedgerV2;
    directCrossStationRatioOrAcceptanceAllowed: false;
    separationReason:
      "aggregate-aortic-inlet-flow-and-hidden-LAD-subendocardial-Qm-are-distinct-model-stations";
  }>;
  allReportedNumbersFinite: boolean;
  physiologicalAcceptanceEstablished: false;
  shapeAcceptanceEstablished: false;
}>;

type CoronaryPhaseStationLedgerV2 = Readonly<{
  station: string;
  available: boolean;
  systolicDurationSec: number | null;
  diastolicDurationSec: number | null;
  systolicSignedIntegralMl: number | null;
  diastolicSignedIntegralMl: number | null;
  systolicForwardIntegralMl: number | null;
  diastolicForwardIntegralMl: number | null;
  diastolicToSystolicMeanFlowRatio: number | null;
  dsvrDefinition:
    "time-mean-flow-at-this-exact-model-station-in-valve-event-diastole-divided-by-that-in-valve-event-systole";
  reason: string | null;
}>;

/**
 * Pure diagnostic over raw accepted endpoints. It changes no model state,
 * chooses no physiological threshold, and never interpolates a valve event.
 */
export function describeMainWireIntegratedModelTerminalCycleMorphologyV2(
  trace: MainWireIntegratedModelTerminalCycleTraceV2,
): MainWireIntegratedModelTerminalCycleMorphologyV2 {
  validateTrace(trace);
  const samples = trace.samples;
  const durationSec = trace.endTimeSec - trace.startTimeSec;
  const aorticPressure = summarize(samples,
    (sample) => sample.signal.aorticPressureMmHg, "mmHg", durationSec);
  const leftVentricularPressure = summarize(samples,
    (sample) => sample.signal.leftVentricularPressureMmHg, "mmHg", durationSec);
  const leftVentricularVolume = summarize(samples,
    (sample) => sample.signal.leftVentricularVolumeMl, "mL", durationSec);
  const pressureCrossings = pressureCrossingOrder(samples);
  const orderedValveEvents = valveEvents(samples);
  const systolicSequence = findSystolicSequence(
    orderedValveEvents,
    trace.sampleCount,
  );

  const endDiastolic = systolicSequence.startMitralClosure === null
    ? unavailableVolume(
      "LV volume at the first accepted endpoint after MV positive-to-zero opening-target transition",
      "a complete valve-event systolic sequence was not observed",
    )
    : availableVolume(
      samples[systolicSequence.startMitralClosure.acceptedStepIndexWithinCycle - 1]!
        .signal.leftVentricularVolumeMl,
      systolicSequence.startMitralClosure,
      "LV volume at the first accepted endpoint after MV positive-to-zero opening-target transition",
    );
  const endSystolic = systolicSequence.aorticClosure === null
    ? unavailableVolume(
      "LV volume at the first accepted endpoint after the subsequent AoV positive-to-zero opening-target transition",
      "a complete MV-closure/AoV-opening/AoV-closure sequence was not observed",
    )
    : availableVolume(
      samples[systolicSequence.aorticClosure.acceptedStepIndexWithinCycle - 1]!
        .signal.leftVentricularVolumeMl,
      systolicSequence.aorticClosure,
      "LV volume at the first accepted endpoint after the subsequent AoV positive-to-zero opening-target transition",
    );

  const pvPoints = samples.map((sample) => Object.freeze({
    x: sample.signal.leftVentricularVolumeMl,
    y: sample.signal.leftVentricularPressureMmHg,
  }));
  const pvSignedArea = closedPolygonSignedArea(pvPoints);
  const pvSelfIntersections = countClosedPolygonSelfIntersections(pvPoints);

  const nativeAorticValve = integrateSignedFlow(
    samples,
    (sample) => sample.valve.AoV.signedFlowMlPerSec,
  );
  const lvad = integrateSignedFlow(
    samples,
    (sample) => sample.signal.lvadFlowMlPerSec,
  );
  const combinedForwardBeatVolumeMl =
    nativeAorticValve.forwardVolumeMl + lvad.forwardVolumeMl;
  const combinedNetBeatVolumeMl =
    nativeAorticValve.netVolumeMl + lvad.netVolumeMl;
  const supportFraction = combinedForwardBeatVolumeMl === 0
    ? null
    : lvad.forwardVolumeMl / combinedForwardBeatVolumeMl;

  const lvadMean = lvad.netVolumeMl / durationSec;
  const lvadTemporalVariance = samples.reduce(
    (total, sample) => total + sample.acceptedDtSec
      * (sample.signal.lvadFlowMlPerSec - lvadMean) ** 2,
    0,
  ) / durationSec;
  const flowResidence = signedResidence(samples,
    (sample) => sample.signal.lvadFlowMlPerSec, durationSec);
  const evidenceResidence = evidenceDomainResidence(samples, durationSec);
  const evidenceLimits = consistentEvidenceLimits(samples);
  const literatureFlowResidence = literatureFlowResidenceFractions(
    samples,
    durationSec,
  );
  const lvadFlowSummary = summarize(samples,
    (sample) => sample.signal.lvadFlowMlPerSec, "mL/s", durationSec);
  const deliveredHeadSummary = summarize(samples,
    (sample) => sample.lvad.deliveredPumpPressureRiseMmHg,
    "mmHg", durationSec);
  const prePumpPressureSummary = summarize(samples,
    (sample) => sample.lvad.prePumpPressureMmHg, "mmHg", durationSec);
  const postPumpPressureSummary = summarize(samples,
    (sample) => sample.lvad.postPumpPressureMmHg, "mmHg", durationSec);
  const maximumPumpPressureIdentityResidualMmHg = Math.max(...samples.map(
    (sample) => Math.abs(
      sample.lvad.postPumpPressureMmHg - sample.lvad.prePumpPressureMmHg
        - sample.lvad.deliveredPumpPressureRiseMmHg,
    ),
  ));
  const hqPoints = samples.map((sample) => Object.freeze({
    x: sample.signal.lvadFlowMlPerSec,
    y: sample.lvad.deliveredPumpPressureRiseMmHg,
  }));
  const hqSignedArea = closedPolygonSignedArea(hqPoints);
  const flowValues = hqPoints.map((point) => point.x);
  const headValues = hqPoints.map((point) => point.y);
  const firstHq = hqPoints[0]!;
  const terminalHq = hqPoints.at(-1)!;
  const rawPulsatilityIndex = lvadMean === 0 ? null
    : (lvadFlowSummary.maximum.value - lvadFlowSummary.minimum.value)
      / lvadMean;
  const coronaryPhaseLedger = coronaryLedger(
    samples,
    durationSec,
    systolicSequence,
  );

  const descriptor = Object.freeze({
    descriptorId:
      MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_MORPHOLOGY_V2_ID,
    claim: MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_MORPHOLOGY_V2_CLAIM,
    stations: MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_STATIONS_V2,
    cycleIndex: trace.cycleIndex,
    sampleCount: trace.sampleCount,
    durationSec,
    pressure: Object.freeze({
      aortic: aorticPressure,
      leftVentricular: leftVentricularPressure,
      lvMinusAoCrossings: Object.freeze({
        count: pressureCrossings.length,
        order: Object.freeze(pressureCrossings),
        detection:
          "accepted-order-sign-change-first-endpoint-no-interpolation-no-cyclic-edge" as const,
      }),
    }),
    valveEvents: Object.freeze({
      ordered: Object.freeze(orderedValveEvents),
      systolicWindow: Object.freeze({
        available: systolicSequence.available,
        startMitralClosure: systolicSequence.startMitralClosure,
        aorticOpening: systolicSequence.aorticOpening,
        aorticClosure: systolicSequence.aorticClosure,
        endMitralOpening: systolicSequence.endMitralOpening,
        wrapsTraceBoundary: systolicSequence.wrapsTraceBoundary,
        reason: systolicSequence.reason,
        definition:
          "MV-positive-to-zero through subsequent MV-zero-to-positive opening-target transitions" as const,
      }),
    }),
    leftVentricularVolume: Object.freeze({
      endDiastolic,
      endSystolic,
      rawExtremaOnly: leftVentricularVolume,
      lvefReported: false as const,
      rawExtremaRelabeledAsEdvOrEsv: false as const,
    }),
    pressureVolumeLoop: Object.freeze({
      xStation:
        MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_STATIONS_V2.leftVentricularVolume,
      yStation:
        MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_STATIONS_V2.leftVentricularPressure,
      signedClosedPolygonAreaMmHgMl: pvSignedArea,
      absoluteClosedPolygonAreaMmHgMl: Math.abs(pvSignedArea),
      orientation: loopOrientation(pvSignedArea),
      polygonClosure:
        "raw-terminal-endpoint-to-raw-first-endpoint-for-area-only-nonperiodic-allowed" as const,
      selfIntersection: Object.freeze({
        present: pvSelfIntersections > 0,
        properOrTouchingNonadjacentSegmentPairCount: pvSelfIntersections,
        exactFloatingPointOrientationNoGeometricTolerance: true as const,
      }),
    }),
    flowLedger: Object.freeze({
      nativeAorticValve: Object.freeze({
        forwardStrokeVolumeMl: nativeAorticValve.forwardVolumeMl,
        reverseVolumeMagnitudeMl: nativeAorticValve.reverseVolumeMagnitudeMl,
        netStrokeVolumeMl: nativeAorticValve.netVolumeMl,
      }),
      lvad: Object.freeze({
        signedBeatVolumeMl: lvad.netVolumeMl,
        forwardBeatVolumeMl: lvad.forwardVolumeMl,
        reverseBeatVolumeMagnitudeMl: lvad.reverseVolumeMagnitudeMl,
      }),
      combined: Object.freeze({
        forwardBeatVolumeMl: combinedForwardBeatVolumeMl,
        netBeatVolumeMl: combinedNetBeatVolumeMl,
        forwardOutputLMin: combinedForwardBeatVolumeMl / durationSec * 0.06,
        netOutputLMin: combinedNetBeatVolumeMl / durationSec * 0.06,
        lvadForwardSupportFraction01: supportFraction,
        supportFractionDefinition:
          "LVAD-forward-volume-divided-by-native-AoV-plus-LVAD-forward-volume" as const,
      }),
    }),
    lvadFlow: Object.freeze({
      unit: "mL/s" as const,
      timeWeightedMeanMlPerSec: lvadMean,
      timeWeightedTemporalPopulationSdMlPerSec: Math.sqrt(lvadTemporalVariance),
      minimumMlPerSec: Math.min(...flowValues),
      maximumMlPerSec: Math.max(...flowValues),
      forwardResidenceFraction01: flowResidence.forward,
      zeroResidenceFraction01: flowResidence.zero,
      reverseResidenceFraction01: flowResidence.reverse,
      literatureFlowResidenceFraction01: literatureFlowResidence,
      rawPulsatilityIndex,
      rawPulsatilityFormula:
        "(raw-maximum-flow-minus-raw-minimum-flow)/time-weighted-mean-flow" as const,
      commercialPumpPiClaimed: false as const,
      evidenceDomainResidenceFraction01: evidenceResidence,
      evidenceDomainResidenceDenominator: "whole-cycle-time" as const,
      publishedExperimentalTraversalUpperLMin:
        evidenceLimits.publishedExperimentalTraversalUpperLMin,
      advertisedCapacityLMin: evidenceLimits.advertisedCapacityLMin,
      pumpPressureReadback: Object.freeze({
        prePump: prePumpPressureSummary,
        postPump: postPumpPressureSummary,
        deliveredPumpPressureRise: deliveredHeadSummary,
        maximumAbsolutePostMinusPreIdentityResidualMmHg:
          maximumPumpPressureIdentityResidualMmHg,
        identity:
          "delivered-pump-pressure-rise-is-post-pump-minus-pre-pump-at-each-raw-endpoint" as const,
      }),
    }),
    lvadHeadFlowLoop: Object.freeze({
      signedClosedPolygonAreaMmHgMlPerSec: hqSignedArea,
      absoluteClosedPolygonAreaMmHgMlPerSec: Math.abs(hqSignedArea),
      orientation: loopOrientation(hqSignedArea),
      polygonClosure:
        "raw-terminal-endpoint-to-raw-first-endpoint-for-area-only-nonperiodic-allowed" as const,
      traversal: Object.freeze({
        flowMinimumMlPerSec: Math.min(...flowValues),
        flowMaximumMlPerSec: Math.max(...flowValues),
        flowRangeMlPerSec: Math.max(...flowValues) - Math.min(...flowValues),
        pressureRiseMinimumMmHg: Math.min(...headValues),
        pressureRiseMaximumMmHg: Math.max(...headValues),
        pressureRiseRangeMmHg:
          Math.max(...headValues) - Math.min(...headValues),
        flowMinimumEndpoint: lvadFlowSummary.minimum,
        flowMaximumEndpoint: lvadFlowSummary.maximum,
        pressureRiseMinimumEndpoint: deliveredHeadSummary.minimum,
        pressureRiseMaximumEndpoint: deliveredHeadSummary.maximum,
        pressureMaximumMinusFlowMaximumLagSec:
          deliveredHeadSummary.maximum.acceptedTimeSec
            - lvadFlowSummary.maximum.acceptedTimeSec,
        pressureMaximumMinusFlowMaximumLagPhase01:
          deliveredHeadSummary.maximum.cyclePhase01
            - lvadFlowSummary.maximum.cyclePhase01,
        lagConvention:
          "raw-pressure-rise-maximum-endpoint-minus-raw-flow-maximum-endpoint-no-interpolation-no-wrapping" as const,
        firstRawEndpoint: Object.freeze({
          flowMlPerSec: firstHq.x,
          pressureRiseMmHg: firstHq.y,
        }),
        terminalRawEndpoint: Object.freeze({
          flowMlPerSec: terminalHq.x,
          pressureRiseMmHg: terminalHq.y,
        }),
      }),
    }),
    coronaryPhaseLedger,
    allReportedNumbersFinite: true,
    physiologicalAcceptanceEstablished: false as const,
    shapeAcceptanceEstablished: false as const,
  }) satisfies MainWireIntegratedModelTerminalCycleMorphologyV2;
  if (!numericLeaves(descriptor).every(Number.isFinite)) {
    throw new Error("terminal-cycle morphology produced a non-finite number");
  }
  return descriptor;
}

function summarize(
  samples: readonly MainWireIntegratedModelTerminalCycleTraceSampleV2[],
  value: (sample: MainWireIntegratedModelTerminalCycleTraceSampleV2) => number,
  unit: string,
  durationSec: number,
): ScalarSummaryV2 {
  let minimumIndex = 0;
  let maximumIndex = 0;
  let integral = 0;
  samples.forEach((sample, index) => {
    const current = value(sample);
    integral += current * sample.acceptedDtSec;
    if (current < value(samples[minimumIndex]!)) minimumIndex = index;
    if (current > value(samples[maximumIndex]!)) maximumIndex = index;
  });
  return Object.freeze({
    unit,
    timeWeightedMean: integral / durationSec,
    minimum: locatedValue(samples[minimumIndex]!, value(samples[minimumIndex]!)),
    maximum: locatedValue(samples[maximumIndex]!, value(samples[maximumIndex]!)),
  });
}

function locatedValue(
  sample: MainWireIntegratedModelTerminalCycleTraceSampleV2,
  value: number,
): LocatedValueV2 {
  return Object.freeze({ ...location(sample), value });
}

function location(
  sample: MainWireIntegratedModelTerminalCycleTraceSampleV2,
): EndpointLocationV2 {
  return Object.freeze({
    acceptedStepIndexWithinCycle: sample.acceptedStepIndexWithinCycle,
    acceptedTimeSec: sample.acceptedTimeSec,
    cyclePhase01: sample.cyclePhase01,
  });
}

function pressureCrossingOrder(
  samples: readonly MainWireIntegratedModelTerminalCycleTraceSampleV2[],
): Array<EndpointLocationV2 & Readonly<{
  direction: "LV-rises-above-Ao" | "LV-falls-below-Ao";
}>> {
  const order: Array<EndpointLocationV2 & Readonly<{
    direction: "LV-rises-above-Ao" | "LV-falls-below-Ao";
  }>> = [];
  let previousNonzeroSign = Math.sign(
    samples[0]!.signal.leftVentricularPressureMmHg
      - samples[0]!.signal.aorticPressureMmHg,
  );
  for (let index = 1; index < samples.length; index += 1) {
    const sample = samples[index]!;
    const currentSign = Math.sign(
      sample.signal.leftVentricularPressureMmHg
        - sample.signal.aorticPressureMmHg,
    );
    if (currentSign === 0) continue;
    if (previousNonzeroSign !== 0 && currentSign !== previousNonzeroSign) {
      order.push(Object.freeze({
        ...location(sample),
        direction: currentSign > 0
          ? "LV-rises-above-Ao" as const
          : "LV-falls-below-Ao" as const,
      }));
    }
    previousNonzeroSign = currentSign;
  }
  return order;
}

function valveEvents(
  samples: readonly MainWireIntegratedModelTerminalCycleTraceSampleV2[],
): ValveEventV2[] {
  const output: ValveEventV2[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]!;
    const current = samples[index]!;
    for (const valve of ["MV", "AoV"] as const) {
      const before = previous.valve[valve].openingDriveState;
      const after = current.valve[valve].openingDriveState;
      if (before === after) continue;
      output.push(Object.freeze({
        ...location(current),
        valve,
        transition: before === "positive-opening-target"
          ? "positive-to-zero-opening-target" as const
          : "zero-to-positive-opening-target" as const,
        endpointConvention:
          "first-accepted-endpoint-after-detected-opening-target-state-change-no-interpolation" as const,
      }));
    }
  }
  return output.sort((left, right) =>
    left.acceptedStepIndexWithinCycle - right.acceptedStepIndexWithinCycle
      || left.valve.localeCompare(right.valve));
}

type SystolicSequenceV2 = Readonly<{
  available: boolean;
  startMitralClosure: ValveEventV2 | null;
  aorticOpening: ValveEventV2 | null;
  aorticClosure: ValveEventV2 | null;
  endMitralOpening: ValveEventV2 | null;
  wrapsTraceBoundary: boolean;
  reason: string | null;
}>;

function findSystolicSequence(
  events: readonly ValveEventV2[],
  sampleCount: number,
): SystolicSequenceV2 {
  const closures = events.filter((event) =>
    event.valve === "MV"
      && event.transition === "positive-to-zero-opening-target");
  for (const startMitralClosure of closures) {
    const cyclic = events.map((event) => Object.freeze({
      event,
      offset: positiveCyclicStepOffset(
        event.acceptedStepIndexWithinCycle,
        startMitralClosure.acceptedStepIndexWithinCycle,
        sampleCount,
      ),
    })).filter(({ offset }) => offset > 0)
      .sort((left, right) => left.offset - right.offset);
    const aorticOpeningEntry = cyclic.find(({ event }) =>
      event.valve === "AoV"
        && event.transition === "zero-to-positive-opening-target");
    const aorticClosureEntry = aorticOpeningEntry === undefined
      ? undefined : cyclic.find(({ event, offset }) =>
        offset > aorticOpeningEntry.offset
          && event.valve === "AoV"
          && event.transition === "positive-to-zero-opening-target");
    const endMitralOpeningEntry = aorticClosureEntry === undefined
      ? undefined : cyclic.find(({ event, offset }) =>
        offset > aorticClosureEntry.offset
          && event.valve === "MV"
          && event.transition === "zero-to-positive-opening-target");
    if (aorticOpeningEntry !== undefined && aorticClosureEntry !== undefined
      && endMitralOpeningEntry !== undefined) {
      const endMitralOpening = endMitralOpeningEntry.event;
      return Object.freeze({
        available: true,
        startMitralClosure,
        aorticOpening: aorticOpeningEntry.event,
        aorticClosure: aorticClosureEntry.event,
        endMitralOpening,
        wrapsTraceBoundary:
          endMitralOpening.acceptedStepIndexWithinCycle
            < startMitralClosure.acceptedStepIndexWithinCycle,
        reason: null,
      });
    }
  }
  return Object.freeze({
    available: false,
    startMitralClosure: closures[0] ?? null,
    aorticOpening: null,
    aorticClosure: null,
    endMitralOpening: null,
    wrapsTraceBoundary: false,
    reason:
      "complete cyclic MV-closure, AoV-opening, AoV-closure, MV-opening endpoint sequence unavailable",
  });
}

function positiveCyclicStepOffset(
  candidateStep: number,
  originStep: number,
  sampleCount: number,
): number {
  const difference = candidateStep - originStep;
  return difference > 0 ? difference : difference + sampleCount;
}

function availableVolume(
  valueMl: number,
  event: ValveEventV2,
  definition: string,
): EventDefinedVolumeV2 {
  return Object.freeze({ available: true as const, valueMl, event, definition });
}

function unavailableVolume(
  definition: string,
  reason: string,
): EventDefinedVolumeV2 {
  return Object.freeze({
    available: false as const,
    valueMl: null,
    event: null,
    definition,
    reason,
  });
}

function integrateSignedFlow(
  samples: readonly MainWireIntegratedModelTerminalCycleTraceSampleV2[],
  flow: (sample: MainWireIntegratedModelTerminalCycleTraceSampleV2) => number,
): Readonly<{
  netVolumeMl: number;
  forwardVolumeMl: number;
  reverseVolumeMagnitudeMl: number;
}> {
  let netVolumeMl = 0;
  let forwardVolumeMl = 0;
  let reverseVolumeMagnitudeMl = 0;
  for (const sample of samples) {
    const q = flow(sample);
    const volume = q * sample.acceptedDtSec;
    netVolumeMl += volume;
    if (q > 0) forwardVolumeMl += volume;
    if (q < 0) reverseVolumeMagnitudeMl -= volume;
  }
  return Object.freeze({ netVolumeMl, forwardVolumeMl, reverseVolumeMagnitudeMl });
}

function signedResidence(
  samples: readonly MainWireIntegratedModelTerminalCycleTraceSampleV2[],
  value: (sample: MainWireIntegratedModelTerminalCycleTraceSampleV2) => number,
  durationSec: number,
): Readonly<{ forward: number; zero: number; reverse: number }> {
  let forward = 0;
  let zero = 0;
  let reverse = 0;
  for (const sample of samples) {
    const current = value(sample);
    if (current > 0) forward += sample.acceptedDtSec;
    else if (current < 0) reverse += sample.acceptedDtSec;
    else zero += sample.acceptedDtSec;
  }
  return Object.freeze({
    forward: forward / durationSec,
    zero: zero / durationSec,
    reverse: reverse / durationSec,
  });
}

function evidenceDomainResidence(
  samples: readonly MainWireIntegratedModelTerminalCycleTraceSampleV2[],
  durationSec: number,
): Readonly<Record<RotaryPumpForwardFlowEvidenceStatusV1, number>> {
  const residence = Object.fromEntries(
    FORWARD_FLOW_EVIDENCE_STATUSES.map((status) => [status, 0]),
  ) as Record<RotaryPumpForwardFlowEvidenceStatusV1, number>;
  for (const sample of samples) {
    residence[sample.lvad.forwardFlowEvidenceStatus] += sample.acceptedDtSec;
  }
  return Object.freeze(Object.fromEntries(
    FORWARD_FLOW_EVIDENCE_STATUSES.map((status) =>
      [status, residence[status] / durationSec]),
  )) as Readonly<Record<RotaryPumpForwardFlowEvidenceStatusV1, number>>;
}

function literatureFlowResidenceFractions(
  samples: readonly MainWireIntegratedModelTerminalCycleTraceSampleV2[],
  durationSec: number,
): MainWireIntegratedModelTerminalCycleMorphologyV2["lvadFlow"]["literatureFlowResidenceFraction01"] {
  let below3Sec = 0;
  let below3Point8Sec = 0;
  let above10Sec = 0;
  for (const sample of samples) {
    const flowLMin = sample.signal.lvadFlowMlPerSec * 0.06;
    if (flowLMin < 3) below3Sec += sample.acceptedDtSec;
    if (flowLMin < 3.8) below3Point8Sec += sample.acceptedDtSec;
    if (flowLMin > 10) above10Sec += sample.acceptedDtSec;
  }
  return Object.freeze({
    below3LMin: below3Sec / durationSec,
    below3Point8LMin: below3Point8Sec / durationSec,
    above10LMin: above10Sec / durationSec,
    comparisons:
      "signed-raw-endpoint-flow-times-right-endpoint-dt-strict-less-or-greater" as const,
    thresholdsSource:
      "primary-literature-audit-predeclared-not-selected-from-this-trace" as const,
  });
}

function consistentEvidenceLimits(
  samples: readonly MainWireIntegratedModelTerminalCycleTraceSampleV2[],
): Readonly<{
  publishedExperimentalTraversalUpperLMin: number | null;
  advertisedCapacityLMin: number | null;
}> {
  const first = samples[0]!.lvad;
  for (const sample of samples.slice(1)) {
    if (sample.lvad.forwardFlowPublishedExperimentalTraversalUpperLMin
        !== first.forwardFlowPublishedExperimentalTraversalUpperLMin
      || sample.lvad.forwardFlowAdvertisedCapacityLMin
        !== first.forwardFlowAdvertisedCapacityLMin) {
      throw new Error("LVAD forward-flow evidence limits changed within a trace");
    }
  }
  return Object.freeze({
    publishedExperimentalTraversalUpperLMin:
      first.forwardFlowPublishedExperimentalTraversalUpperLMin,
    advertisedCapacityLMin: first.forwardFlowAdvertisedCapacityLMin,
  });
}

function coronaryLedger(
  samples: readonly MainWireIntegratedModelTerminalCycleTraceSampleV2[],
  durationSec: number,
  sequence: SystolicSequenceV2,
): MainWireIntegratedModelTerminalCycleMorphologyV2["coronaryPhaseLedger"] {
  return Object.freeze({
    aggregateAorticInlet: coronaryStationLedger(
      samples,
      durationSec,
      sequence,
      MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_STATIONS_V2.coronaryTotalInlet,
      (sample) => sample.signal.totalCoronaryInletFlowMlPerSec,
    ),
    ladSubendocardialInternalQm: coronaryStationLedger(
      samples,
      durationSec,
      sequence,
      MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_STATIONS_V2.ladSubendocardialQm,
      (sample) => sample.signal.ladSubendocardialQmFlowMlPerSec,
    ),
    directCrossStationRatioOrAcceptanceAllowed: false as const,
    separationReason:
      "aggregate-aortic-inlet-flow-and-hidden-LAD-subendocardial-Qm-are-distinct-model-stations" as const,
  });
}

function coronaryStationLedger(
  samples: readonly MainWireIntegratedModelTerminalCycleTraceSampleV2[],
  durationSec: number,
  sequence: SystolicSequenceV2,
  station: string,
  flow: (sample: MainWireIntegratedModelTerminalCycleTraceSampleV2) => number,
): CoronaryPhaseStationLedgerV2 {
  if (!sequence.available || sequence.startMitralClosure === null
    || sequence.endMitralOpening === null) {
    return Object.freeze({
      station,
      available: false,
      systolicDurationSec: null,
      diastolicDurationSec: null,
      systolicSignedIntegralMl: null,
      diastolicSignedIntegralMl: null,
      systolicForwardIntegralMl: null,
      diastolicForwardIntegralMl: null,
      diastolicToSystolicMeanFlowRatio: null,
      dsvrDefinition:
        "time-mean-flow-at-this-exact-model-station-in-valve-event-diastole-divided-by-that-in-valve-event-systole",
      reason: sequence.reason,
    });
  }
  const systolicStartSec = sequence.startMitralClosure.acceptedTimeSec;
  const systolicEndSec = sequence.endMitralOpening.acceptedTimeSec;
  const traceStartSec = samples[0]!.acceptedTimeSec
    - samples[0]!.acceptedDtSec;
  const traceEndSec = samples.at(-1)!.acceptedTimeSec;
  let systolicDurationSec = 0;
  let systolicSignedIntegralMl = 0;
  let systolicForwardIntegralMl = 0;
  let totalSignedIntegralMl = 0;
  let totalForwardIntegralMl = 0;
  for (const sample of samples) {
    const intervalStart = sample.acceptedTimeSec - sample.acceptedDtSec;
    const intervalEnd = sample.acceptedTimeSec;
    const systolicOverlapSec = sequence.wrapsTraceBoundary
      ? intervalOverlapSec(intervalStart, intervalEnd,
        systolicStartSec, traceEndSec)
        + intervalOverlapSec(intervalStart, intervalEnd,
          traceStartSec, systolicEndSec)
      : intervalOverlapSec(intervalStart, intervalEnd,
        systolicStartSec, systolicEndSec);
    const q = flow(sample);
    systolicDurationSec += systolicOverlapSec;
    systolicSignedIntegralMl += q * systolicOverlapSec;
    systolicForwardIntegralMl += Math.max(q, 0) * systolicOverlapSec;
    totalSignedIntegralMl += q * sample.acceptedDtSec;
    totalForwardIntegralMl += Math.max(q, 0) * sample.acceptedDtSec;
  }
  const diastolicDurationSec = durationSec - systolicDurationSec;
  const diastolicSignedIntegralMl =
    totalSignedIntegralMl - systolicSignedIntegralMl;
  const diastolicForwardIntegralMl =
    totalForwardIntegralMl - systolicForwardIntegralMl;
  const systolicMean = systolicDurationSec === 0
    ? null
    : systolicSignedIntegralMl / systolicDurationSec;
  const diastolicMean = diastolicDurationSec === 0
    ? null
    : diastolicSignedIntegralMl / diastolicDurationSec;
  const dsvr = systolicMean === null || systolicMean === 0
    || diastolicMean === null ? null : diastolicMean / systolicMean;
  return Object.freeze({
    station,
    available: true,
    systolicDurationSec,
    diastolicDurationSec,
    systolicSignedIntegralMl,
    diastolicSignedIntegralMl,
    systolicForwardIntegralMl,
    diastolicForwardIntegralMl,
    diastolicToSystolicMeanFlowRatio: dsvr,
    dsvrDefinition:
      "time-mean-flow-at-this-exact-model-station-in-valve-event-diastole-divided-by-that-in-valve-event-systole",
    reason: dsvr === null
      ? "phase window exists but a nonzero finite systolic mean is unavailable"
      : null,
  });
}

function intervalOverlapSec(
  intervalStartSec: number,
  intervalEndSec: number,
  windowStartSec: number,
  windowEndSec: number,
): number {
  return Math.max(
    0,
    Math.min(intervalEndSec, windowEndSec)
      - Math.max(intervalStartSec, windowStartSec),
  );
}

function closedPolygonSignedArea(
  points: readonly Readonly<{ x: number; y: number }>[],
): number {
  if (points.length < 3) return 0;
  let twiceArea = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]!;
    const next = points[(index + 1) % points.length]!;
    twiceArea += current.x * next.y - next.x * current.y;
  }
  return twiceArea / 2;
}

function loopOrientation(area: number): LoopOrientationV2 {
  return area > 0 ? "counterclockwise"
    : area < 0 ? "clockwise" : "degenerate";
}

function countClosedPolygonSelfIntersections(
  points: readonly Readonly<{ x: number; y: number }>[],
): number {
  if (points.length < 4) return 0;
  let count = 0;
  for (let left = 0; left < points.length; left += 1) {
    const leftNext = (left + 1) % points.length;
    for (let right = left + 1; right < points.length; right += 1) {
      const rightNext = (right + 1) % points.length;
      if (left === right || leftNext === right || rightNext === left) continue;
      if (segmentsIntersect(
        points[left]!, points[leftNext]!, points[right]!, points[rightNext]!,
      )) count += 1;
    }
  }
  return count;
}

function segmentsIntersect(
  a: Readonly<{ x: number; y: number }>,
  b: Readonly<{ x: number; y: number }>,
  c: Readonly<{ x: number; y: number }>,
  d: Readonly<{ x: number; y: number }>,
): boolean {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  if (o1 === 0 && onSegment(a, b, c)) return true;
  if (o2 === 0 && onSegment(a, b, d)) return true;
  if (o3 === 0 && onSegment(c, d, a)) return true;
  if (o4 === 0 && onSegment(c, d, b)) return true;
  return Math.sign(o1) !== Math.sign(o2) && Math.sign(o3) !== Math.sign(o4);
}

function orientation(
  a: Readonly<{ x: number; y: number }>,
  b: Readonly<{ x: number; y: number }>,
  c: Readonly<{ x: number; y: number }>,
): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function onSegment(
  a: Readonly<{ x: number; y: number }>,
  b: Readonly<{ x: number; y: number }>,
  p: Readonly<{ x: number; y: number }>,
): boolean {
  return p.x >= Math.min(a.x, b.x) && p.x <= Math.max(a.x, b.x)
    && p.y >= Math.min(a.y, b.y) && p.y <= Math.max(a.y, b.y);
}

function validateTrace(trace: MainWireIntegratedModelTerminalCycleTraceV2): void {
  if (trace === null || typeof trace !== "object" || Array.isArray(trace)) {
    throw new TypeError("terminal-cycle morphology trace must be an object");
  }
  if (!Number.isSafeInteger(trace.cycleIndex) || trace.cycleIndex <= 0) {
    throw new Error("terminal-cycle morphology cycleIndex must be positive");
  }
  if (!Number.isFinite(trace.startTimeSec)
    || !Number.isFinite(trace.endTimeSec)
    || !(trace.endTimeSec > trace.startTimeSec)) {
    throw new Error("terminal-cycle morphology time bounds are invalid");
  }
  if (!Number.isSafeInteger(trace.sampleCount) || trace.sampleCount < 1
    || !Array.isArray(trace.samples)
    || trace.samples.length !== trace.sampleCount) {
    throw new Error("terminal-cycle morphology samples must match sampleCount");
  }
  if (trace.retainedForGraphShapeInspection !== true
    || trace.eligibleForNumericalOrPhysiologicalShapeGate !== false
    || trace.interpretation
      !== "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance") {
    throw new Error("terminal-cycle morphology provenance is invalid");
  }
  let summedDtSec = 0;
  let previousTimeSec = trace.startTimeSec;
  for (const [index, sample] of trace.samples.entries()) {
    const label = `samples[${index}]`;
    if (sample.acceptedStepIndexWithinCycle !== index + 1
      || sample.cycleIndex !== trace.cycleIndex) {
      throw new Error(`${label} identity is inconsistent`);
    }
    if (!Number.isFinite(sample.acceptedTimeSec)
      || !Number.isFinite(sample.acceptedDtSec)
      || !(sample.acceptedDtSec > 0)
      || !(sample.acceptedTimeSec > previousTimeSec)) {
      throw new Error(`${label} accepted clock is invalid`);
    }
    requireClose(sample.acceptedTimeSec - previousTimeSec,
      sample.acceptedDtSec, `${label} acceptedDtSec`);
    for (const value of Object.values(sample.signal) as number[]) {
      requireFinite(value, label);
    }
    for (const valveId of ["MV", "AoV"] as const) {
      const valve = sample.valve[valveId];
      for (const value of [
        valve.signedFlowMlPerSec,
        valve.leafletOpeningFraction01,
        valve.openingTarget01,
        valve.activeEffectiveOrificeAreaCm2,
        valve.forwardEffectiveOrificeAreaCm2,
        valve.reverseEffectiveOrificeAreaCm2,
      ]) requireFinite(value, `${label}.${valveId}`);
      if (valve.leafletOpeningFraction01 < 0
        || valve.leafletOpeningFraction01 > 1
        || valve.openingTarget01 < 0 || valve.openingTarget01 > 1
        || valve.activeEffectiveOrificeAreaCm2 < 0
        || valve.forwardEffectiveOrificeAreaCm2 < 0
        || valve.reverseEffectiveOrificeAreaCm2 < 0) {
        throw new Error(`${label}.${valveId} valve state is out of range`);
      }
      const expectedOpeningState = valve.openingTarget01 === 0
        ? "zero-opening-target" : "positive-opening-target";
      if (valve.openingDriveState !== expectedOpeningState) {
        throw new Error(`${label}.${valveId} openingDriveState is inconsistent`);
      }
      if (!["forward", "reverse", "zero-gradient"].includes(
        valve.activeDirection,
      )) throw new Error(`${label}.${valveId} activeDirection is invalid`);
    }
    if (!FORWARD_FLOW_EVIDENCE_STATUSES.includes(
      sample.lvad.forwardFlowEvidenceStatus,
    )) throw new Error(`${label} forwardFlowEvidenceStatus is invalid`);
    for (const pressure of [
      sample.lvad.prePumpPressureMmHg,
      sample.lvad.postPumpPressureMmHg,
      sample.lvad.deliveredPumpPressureRiseMmHg,
    ]) requireFinite(pressure, `${label} pump pressure readback`);
    requireClose(
      sample.lvad.postPumpPressureMmHg - sample.lvad.prePumpPressureMmHg,
      sample.lvad.deliveredPumpPressureRiseMmHg,
      `${label} post-minus-pre delivered pump pressure rise`,
    );
    for (const limit of [
      sample.lvad.forwardFlowPublishedExperimentalTraversalUpperLMin,
      sample.lvad.forwardFlowAdvertisedCapacityLMin,
    ]) {
      if (limit !== null && (!Number.isFinite(limit) || !(limit > 0))) {
        throw new Error(`${label} forward-flow evidence limit is invalid`);
      }
    }
    const forwardDomainDeclared =
      sample.lvad.forwardFlowPublishedExperimentalTraversalUpperLMin !== null
      && sample.lvad.forwardFlowAdvertisedCapacityLMin !== null;
    if (forwardDomainDeclared
      && sample.signal.lvadFlowMlPerSec <= 0
      && sample.lvad.forwardFlowEvidenceStatus
        !== "non-forward-flow-not-applicable") {
      throw new Error(`${label} non-forward LVAD flow cannot be assigned to a forward evidence domain`);
    }
    if (forwardDomainDeclared
      && sample.signal.lvadFlowMlPerSec > 0
      && sample.lvad.forwardFlowEvidenceStatus
        === "non-forward-flow-not-applicable") {
      throw new Error(`${label} positive LVAD flow has a non-forward evidence status`);
    }
    if (!forwardDomainDeclared
      && sample.lvad.forwardFlowEvidenceStatus !== "not-declared") {
      throw new Error(`${label} undeclared LVAD evidence domain has an invalid status`);
    }
    summedDtSec += sample.acceptedDtSec;
    previousTimeSec = sample.acceptedTimeSec;
  }
  requireClose(previousTimeSec, trace.endTimeSec, "terminal trace end time");
  requireClose(summedDtSec, trace.endTimeSec - trace.startTimeSec,
    "terminal trace duration sum");
}

function requireFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} contains non-finite data`);
}

function requireClose(actual: number, expected: number, label: string): void {
  const tolerance = 1e-10 * Math.max(1, Math.abs(actual), Math.abs(expected));
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label} is inconsistent`);
  }
}

function numericLeaves(value: unknown): number[] {
  const output: number[] = [];
  const visit = (current: unknown): void => {
    if (typeof current === "number") output.push(current);
    else if (Array.isArray(current)) current.forEach(visit);
    else if (current !== null && typeof current === "object") {
      Object.values(current).forEach(visit);
    }
  };
  visit(value);
  return output;
}
