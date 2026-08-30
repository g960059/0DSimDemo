import { measureMainWireValveDiseaseCycleMetricsV1 } from "@/engine/myocardium/diagnostics/MainWireValveDiseaseCycleMetricsV1";
import type { MainWireNormalAdultFiveWallDiagnosticSampleV2 } from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import { MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10 } from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_DEFINITION_SENSITIVITY_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_DEFINITION_SENSITIVITY_V1_ID,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_FLOW_PEAK_FRACTIONS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_VOLUME_WINDOWS_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10EventDefinitionSensitivityV1";
import type { MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import { summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_DEFINITION_SENSITIVITY_ANALYSIS_V1_ID =
  "main-wire-aortic-outflow-v10-event-definition-sensitivity-analysis-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_DEFINITION_SENSITIVITY_ANALYSIS_CLAIM_V1 =
  Object.freeze({
    source: "fixed-V10-last-retained-complete-beat" as const,
    acceptedEndpointChronology:
      "each-diagnostic-sample-owns-the-preceding-to-current-backward-Euler-cell" as const,
    selectedBeatStartBoundary:
      "preceding-retained-beat-last-accepted-endpoint-when-available" as const,
    cyclicEpisodeSelection:
      "contiguous-active-episode-containing-global-positive-AoV-flow-peak" as const,
    sampledFlowBoundary:
      "first-active-and-first-subsequent-inactive-accepted-endpoints" as const,
    localPressureBoundary: "linear-zero-crossing-only-no-smoothing" as const,
    localPressureTimingSemantics:
      "MVC-to-local-gradient-start-plus-local-gradient-positive-duration-plus-local-gradient-end-to-MVO-surrogate-not-valve-events" as const,
    forwardVolumeBoundary:
      "uniform-allocation-within-backward-Euler-endpoint-cell" as const,
    mitralAnchorsHeldFixedAcrossAorticDefinitions: true as const,
    currentProxyAndCurrentValveEventKeptDistinct: true as const,
    pressureCrossingIsAValveEventClaim: false as const,
    volumeWindowsAreValveEvents: false as const,
    volumeWindowIctIvrtOrTeiComputed: false as const,
    interpretationEligibility:
      "periodic-steady-state-claimed-and-integration-completed-without-failure" as const,
    exactFrameMutation: false as const,
    smoothingApplied: false as const,
    parameterOptimizationOrFitApplied: false as const,
    clinicalValidationClaimed: false as const,
  });

export type MainWireAorticOutflowV10EventBoundaryV1 = Readonly<{
  cycleOffsetFromSelectedBeatStartSec: number;
  cyclePhase01: number;
  boundaryMethod:
    | "accepted-sample-endpoint"
    | "linear-zero-crossing-between-accepted-endpoints"
    | "backward-Euler-endpoint-cell-volume-quantile";
  previousAcceptedSampleIndex: number | null;
  currentAcceptedSampleIndex: number;
  interpolationFractionFromPreviousToCurrent01: number;
  previousEndpointSource:
    | "selected-beat-sample"
    | "preceding-retained-beat-last-sample"
    | "selected-beat-periodic-endpoint-surrogate"
    | "selected-beat-start-boundary-without-readback";
}>;

export type MainWireAorticOutflowV10EpisodeAuditV1 = Readonly<{
  cyclicEpisodeCount: number;
  totalActiveSampleCount: number;
  primaryEpisodeActiveSampleCount: number;
  extraActiveSampleCountOutsidePrimaryEpisode: number;
  primaryOpeningSampleIndex: number;
  primaryClosingSampleIndex: number;
  primaryContainsGlobalPositiveFlowPeak: boolean;
}>;

export type MainWireAorticOutflowV10EventPartitionV1 = Readonly<{
  startBoundary: MainWireAorticOutflowV10EventBoundaryV1;
  endBoundary: MainWireAorticOutflowV10EventBoundaryV1;
  durationSec: number;
  mvcToStartSec: number;
  endToMvoSec: number;
  mitralClosureToOpeningTimeSec: number;
  teiLike: number;
  intervalIdentityResidualSec: number;
  mvcStartEndMvoCyclicOrderSatisfied: boolean;
}>;

export type MainWireAorticOutflowV10FlowDefinitionIdV1 =
  | "strict-positive-flow"
  | "peak-fraction-0p1-percent"
  | "peak-fraction-0p5-percent"
  | "peak-fraction-1-percent-no-floor"
  | "peak-fraction-2-percent"
  | "peak-fraction-5-percent"
  | "legacy-1-percent-plus-1-mL-per-sec-floor";

export type MainWireAorticOutflowV10FlowDefinitionMeasurementV1 = Readonly<{
  definitionId: MainWireAorticOutflowV10FlowDefinitionIdV1;
  predicate:
    | "Q-greater-than-zero"
    | "Q-greater-than-fraction-times-positive-Qpeak"
    | "Q-greater-than-max-one-mL-per-second-one-percent-positive-Qpeak";
  peakFraction: number | null;
  absoluteFloorMlPerSec: number | null;
  thresholdMlPerSec: number;
  strictGreaterThanThreshold: true;
  episode: MainWireAorticOutflowV10EpisodeAuditV1;
  timing: MainWireAorticOutflowV10EventPartitionV1;
}>;

export type MainWireAorticOutflowV10VolumeWindowMeasurementV1 = Readonly<{
  windowId:
    "forward-volume-2p5-to-97p5-percent" | "forward-volume-5-to-95-percent";
  lowerQuantile01: number;
  upperQuantile01: number;
  startBoundary: MainWireAorticOutflowV10EventBoundaryV1;
  endBoundary: MainWireAorticOutflowV10EventBoundaryV1;
  centralForwardVolumeWindowDurationSec: number;
  totalForwardVolumeMl: number;
  centralForwardVolumeMl: number;
  centralForwardVolumeFraction01: number;
  targetCentralForwardVolumeFraction01: number;
  centralForwardVolumeIdentityResidualMl: number;
  chronologicalWithinSelectedBeatWithoutWrap: true;
  mvcToStartSec: null;
  endToMvoSec: null;
  teiLike: null;
  intervalIdentityResidualSec: null;
  valveEventTimingUnavailableReason: "central-forward-volume-window-boundaries-are-not-valve-events";
}>;

export type MainWireAorticOutflowV10EventDefinitionSensitivityV1 = Readonly<{
  methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_DEFINITION_SENSITIVITY_ANALYSIS_V1_ID;
  experimentId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_DEFINITION_SENSITIVITY_V1_ID;
  candidateId: typeof MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.candidateId;
  protocolIdentityHash: string;
  interpretationEligible: boolean;
  selectedBeat: Readonly<{
    beatIndex: number;
    sampleCount: number;
    dtSec: number;
    cycleLengthSec: number;
    precedingAcceptedSampleAvailable: boolean;
    precedingBeatIndex: number | null;
    backwardEulerCellCount: number;
    periodicSteadyStateClaimed: boolean;
    integrationCompletedWithoutFailure: boolean;
  }>;
  exactLocalPortReadbackAudit: Readonly<{
    availableSelectedBeatSampleCount: number;
    requiredSelectedBeatSampleCount: number;
    allSelectedBeatSamplesAvailable: true;
    precedingAcceptedSampleReadbackAvailable: boolean | null;
  }>;
  fixedCanonicalMitralAnchors: Readonly<{
    source: "existing-cycle-diagnostics-one-percent-positive-peak-plus-one-mL-per-second-floor";
    mitralOpenThresholdMlPerSec: number;
    mitralValveClosureSampleIndex: number;
    mitralValveOpeningSampleIndex: number;
    mitralClosureToOpeningTimeSec: number;
  }>;
  positiveAorticPeakFlowMlPerSec: number;
  flowDefinitions: readonly MainWireAorticOutflowV10FlowDefinitionMeasurementV1[];
  exactLocalPortPressureCrossing: Readonly<{
    definitionId: "exact-local-LV-minus-proximal-port-positive-gradient";
    predicate: "exact-local-gradient-greater-than-zero";
    interpolation: "linear-between-bracketing-accepted-endpoint-readbacks";
    timingSemantics: "local-gradient-boundary-timing-surrogate-not-valve-event";
    smoothingApplied: false;
    episode: MainWireAorticOutflowV10EpisodeAuditV1;
    timing: MainWireAorticOutflowV10EventPartitionV1;
  }>;
  forwardVolumeWindows: readonly MainWireAorticOutflowV10VolumeWindowMeasurementV1[];
  currentReferences: Readonly<{
    currentValveEventReference: Readonly<{
      source: "existing-cycle-diagnostics";
      predicate: "Q-greater-than-max-one-mL-per-second-one-percent-positive-Qpeak";
      thresholdMlPerSec: number;
      openingSampleIndex: number;
      closingSampleIndex: number;
      ejectionTimeSec: number;
      episode: MainWireAorticOutflowV10EpisodeAuditV1;
    }>;
    currentProxyReference: Readonly<{
      source: "main-wire-valve-disease-cycle-metrics-v1";
      predicate: "Q-positive-and-greater-than-or-equal-max-one-mL-per-second-one-percent-maximum-absolute-Q";
      thresholdMlPerSec: number;
      forwardEpisodeCount: number;
      allActiveSampleDurationSec: number;
      reconstructedAllActiveSampleDurationResidualSec: number;
      primaryEpisodeDurationSec: number;
      forwardVolumeMl: number;
      backwardEulerForwardVolumeResidualVersusWindowTotalMl: number;
      episode: MainWireAorticOutflowV10EpisodeAuditV1;
    }>;
    audit: Readonly<{
      legacyThresholdResidualVersusCurrentValveEventMlPerSec: number;
      legacyOpeningSampleIndexMatchesCurrentValveEvent: boolean;
      legacyClosingSampleIndexMatchesCurrentValveEvent: boolean;
      legacyEjectionTimeResidualVersusCurrentValveEventSec: number;
      currentProxyThresholdResidualVersusCurrentValveEventMlPerSec: number;
      currentProxyDurationResidualVersusCurrentValveEventSec: number;
      currentProxyEpisodeCountMatchesCurrentValveEvent: boolean;
      currentProxyPrimaryOpeningMatchesCurrentValveEvent: boolean;
      currentProxyPrimaryClosingMatchesCurrentValveEvent: boolean;
      legacyExactlyReproducesCurrentValveEvent: boolean;
    }>;
  }>;
  experimentClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_DEFINITION_SENSITIVITY_CLAIM_V1;
  analysisClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_DEFINITION_SENSITIVITY_ANALYSIS_CLAIM_V1;
}>;

type SelectedBeat =
  MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1["periodicResult"]["retainedCompleteBeats"][number];

type PrimaryEpisode = Readonly<{
  openingIndex: number;
  closingIndex: number;
  activeSampleCount: number;
  audit: MainWireAorticOutflowV10EpisodeAuditV1;
}>;

type FixedMitralAnchors = Readonly<{
  closureIndex: number;
  openingIndex: number;
  closureBoundary: MainWireAorticOutflowV10EventBoundaryV1;
  openingBoundary: MainWireAorticOutflowV10EventBoundaryV1;
  closureToOpeningSec: number;
  thresholdMlPerSec: number;
}>;

export function measureMainWireAorticOutflowV10EventDefinitionSensitivityV1(
  run: MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1,
): MainWireAorticOutflowV10EventDefinitionSensitivityV1 {
  assertFixedV10Run(run);
  const result = run.periodicResult;
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(
      "V10 event-definition sensitivity requires a complete beat",
    );
  }
  if (beat.samples.length !== result.stepsPerBeat) {
    throw new Error("V10 event-definition beat must match stepsPerBeat");
  }
  const dtSec = result.dtSec;
  finitePositive(dtSec, "dtSec");
  const cycleLengthSec = beat.samples.length * dtSec;
  const metadataCycleLengthSec = beat.endTimeSec - beat.startTimeSec;
  if (Math.abs(metadataCycleLengthSec - cycleLengthSec) > 1e-9) {
    throw new Error("V10 selected-beat metadata does not match dt chronology");
  }
  const precedingBeat = result.retainedCompleteBeats.at(-2);
  const precedingSample =
    precedingBeat !== undefined &&
    precedingBeat.beatIndex + 1 === beat.beatIndex
      ? (precedingBeat.samples.at(-1) ?? null)
      : null;
  const exactReadbacks = beat.samples.map((sample, index) => {
    const readback = sample.valveHydraulics.AoV.recoveredRootPortExactReadback;
    if (readback === undefined) {
      throw new Error(
        `V10 exact local-port readback missing at sample ${index}`,
      );
    }
    finite(
      readback.localValvePressureGradientMmHg,
      `sample ${index} exact local gradient`,
    );
    return readback;
  });
  const precedingExactReadback =
    precedingSample?.valveHydraulics.AoV.recoveredRootPortExactReadback;
  if (precedingSample !== null && precedingExactReadback === undefined) {
    throw new Error(
      "V10 preceding accepted sample lacks exact local-port readback",
    );
  }

  const summary = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(
    result,
    run.calciumDriveParams,
  );
  const canonicalCycle = summary.cyclePhysiology;
  if (canonicalCycle === null) {
    throw new Error("canonical one-percent valve events are not measurable");
  }
  const canonicalEvents = canonicalCycle.events;
  const mitralAnchors = fixedMitralAnchors(
    beat,
    dtSec,
    cycleLengthSec,
    canonicalEvents.mitralValveClosure.sampleIndex,
    canonicalEvents.mitralValveOpening.sampleIndex,
    canonicalEvents.mitralOpenThresholdMlPerSec,
    precedingSample !== null,
  );

  const flows = beat.samples.map((sample, index) => {
    const flow = sample.valveHydraulics.AoV.flowMlPerSec;
    finite(flow, `sample ${index} AoV flow`);
    return flow;
  });
  const positivePeakFlowMlPerSec = Math.max(...flows);
  finitePositive(positivePeakFlowMlPerSec, "positive AoV peak flow");
  const peakIndex = flows.indexOf(positivePeakFlowMlPerSec);

  const strictPositive = measureFlowDefinition(
    "strict-positive-flow",
    "Q-greater-than-zero",
    null,
    null,
    0,
    flows,
    peakIndex,
    beat,
    dtSec,
    cycleLengthSec,
    mitralAnchors,
    precedingSample !== null,
  );
  const fractionalDefinitions =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_FLOW_PEAK_FRACTIONS_V1.map((fraction) =>
      measureFlowDefinition(
        flowFractionDefinitionId(fraction),
        "Q-greater-than-fraction-times-positive-Qpeak",
        fraction,
        null,
        fraction * positivePeakFlowMlPerSec,
        flows,
        peakIndex,
        beat,
        dtSec,
        cycleLengthSec,
        mitralAnchors,
        precedingSample !== null,
      ),
    );
  const legacyThresholdMlPerSec = Math.max(1, 0.01 * positivePeakFlowMlPerSec);
  const legacy = measureFlowDefinition(
    "legacy-1-percent-plus-1-mL-per-sec-floor",
    "Q-greater-than-max-one-mL-per-second-one-percent-positive-Qpeak",
    0.01,
    1,
    legacyThresholdMlPerSec,
    flows,
    peakIndex,
    beat,
    dtSec,
    cycleLengthSec,
    mitralAnchors,
    precedingSample !== null,
  );
  const flowDefinitions = Object.freeze([
    strictPositive,
    ...fractionalDefinitions,
    legacy,
  ]);

  const localGradients = exactReadbacks.map(
    (readback) => readback.localValvePressureGradientMmHg,
  );
  const pressureMask = localGradients.map((gradient) => gradient > 0);
  const pressureEpisode = primaryEpisode(pressureMask, peakIndex);
  const pressureStartBoundary = zeroCrossingBoundary(
    "opening",
    pressureEpisode.openingIndex,
    localGradients,
    precedingExactReadback?.localValvePressureGradientMmHg ?? null,
    dtSec,
    cycleLengthSec,
  );
  const pressureEndBoundary = zeroCrossingBoundary(
    "closing",
    pressureEpisode.closingIndex,
    localGradients,
    precedingExactReadback?.localValvePressureGradientMmHg ?? null,
    dtSec,
    cycleLengthSec,
  );
  const pressureTiming = eventPartition(
    pressureStartBoundary,
    pressureEndBoundary,
    mitralAnchors,
    cycleLengthSec,
  );

  const forwardVolumeWindows = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_VOLUME_WINDOWS_V1.map((window) =>
      measureVolumeWindow(
        window,
        flows,
        beat,
        precedingSample,
        dtSec,
        cycleLengthSec,
      ),
    ),
  );

  const valveMetrics =
    measureMainWireValveDiseaseCycleMetricsV1(result).valves.AoV;
  const proxyThreshold = valveMetrics.episodeFlowThresholdMlPerSec;
  const proxyMask = flows.map((flow) => flow > 0 && flow >= proxyThreshold);
  const proxyEpisode = primaryEpisode(proxyMask, peakIndex);
  const proxyActiveSampleCount = countTrue(proxyMask);
  const proxyReconstructedDurationSec = proxyActiveSampleCount * dtSec;
  const currentValveEventMask = flows.map(
    (flow) => flow > canonicalEvents.aorticOpenThresholdMlPerSec,
  );
  const currentValveEventEpisode = episodeAuditFromBoundaries(
    currentValveEventMask,
    canonicalEvents.aorticValveOpening.sampleIndex,
    canonicalEvents.aorticValveClosure.sampleIndex,
    peakIndex,
  );
  const currentValveEvent = Object.freeze({
    source: "existing-cycle-diagnostics" as const,
    predicate:
      "Q-greater-than-max-one-mL-per-second-one-percent-positive-Qpeak" as const,
    thresholdMlPerSec: canonicalEvents.aorticOpenThresholdMlPerSec,
    openingSampleIndex: canonicalEvents.aorticValveOpening.sampleIndex,
    closingSampleIndex: canonicalEvents.aorticValveClosure.sampleIndex,
    ejectionTimeSec: canonicalCycle.leftVentricularPerformance.ejectionTimeSec,
    episode: currentValveEventEpisode,
  });
  const currentProxy = Object.freeze({
    source: "main-wire-valve-disease-cycle-metrics-v1" as const,
    predicate:
      "Q-positive-and-greater-than-or-equal-max-one-mL-per-second-one-percent-maximum-absolute-Q" as const,
    thresholdMlPerSec: proxyThreshold,
    forwardEpisodeCount: valveMetrics.forwardEpisodeCount,
    allActiveSampleDurationSec: valveMetrics.forwardEpisodeDurationSec,
    reconstructedAllActiveSampleDurationResidualSec:
      valveMetrics.forwardEpisodeDurationSec - proxyReconstructedDurationSec,
    primaryEpisodeDurationSec: proxyEpisode.activeSampleCount * dtSec,
    forwardVolumeMl: valveMetrics.forwardVolumeMl,
    backwardEulerForwardVolumeResidualVersusWindowTotalMl:
      valveMetrics.forwardVolumeMl -
      forwardVolumeWindows[0]!.totalForwardVolumeMl,
    episode: proxyEpisode.audit,
  });
  const legacyMatchesCurrent =
    Math.abs(
      legacy.thresholdMlPerSec - canonicalEvents.aorticOpenThresholdMlPerSec,
    ) <= 1e-12 &&
    legacy.episode.primaryOpeningSampleIndex ===
      canonicalEvents.aorticValveOpening.sampleIndex &&
    legacy.episode.primaryClosingSampleIndex ===
      canonicalEvents.aorticValveClosure.sampleIndex &&
    Math.abs(
      legacy.timing.durationSec -
        canonicalCycle.leftVentricularPerformance.ejectionTimeSec,
    ) <= 1e-12;

  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_DEFINITION_SENSITIVITY_ANALYSIS_V1_ID,
    experimentId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_DEFINITION_SENSITIVITY_V1_ID,
    candidateId: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.candidateId,
    protocolIdentityHash: result.protocolIdentityHash,
    interpretationEligible:
      result.periodicSteadyStateClaimed
      && result.integrationCompletedWithoutFailure,
    selectedBeat: Object.freeze({
      beatIndex: beat.beatIndex,
      sampleCount: beat.samples.length,
      dtSec,
      cycleLengthSec,
      precedingAcceptedSampleAvailable: precedingSample !== null,
      precedingBeatIndex:
        precedingSample === null ? null : precedingBeat!.beatIndex,
      backwardEulerCellCount: beat.samples.length,
      periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
      integrationCompletedWithoutFailure:
        result.integrationCompletedWithoutFailure,
    }),
    exactLocalPortReadbackAudit: Object.freeze({
      availableSelectedBeatSampleCount: exactReadbacks.length,
      requiredSelectedBeatSampleCount: beat.samples.length,
      allSelectedBeatSamplesAvailable: true as const,
      precedingAcceptedSampleReadbackAvailable:
        precedingSample === null ? null : precedingExactReadback !== undefined,
    }),
    fixedCanonicalMitralAnchors: Object.freeze({
      source:
        "existing-cycle-diagnostics-one-percent-positive-peak-plus-one-mL-per-second-floor" as const,
      mitralOpenThresholdMlPerSec: mitralAnchors.thresholdMlPerSec,
      mitralValveClosureSampleIndex: mitralAnchors.closureIndex,
      mitralValveOpeningSampleIndex: mitralAnchors.openingIndex,
      mitralClosureToOpeningTimeSec: mitralAnchors.closureToOpeningSec,
    }),
    positiveAorticPeakFlowMlPerSec: positivePeakFlowMlPerSec,
    flowDefinitions,
    exactLocalPortPressureCrossing: Object.freeze({
      definitionId:
        "exact-local-LV-minus-proximal-port-positive-gradient" as const,
      predicate: "exact-local-gradient-greater-than-zero" as const,
      interpolation:
        "linear-between-bracketing-accepted-endpoint-readbacks" as const,
      timingSemantics:
        "local-gradient-boundary-timing-surrogate-not-valve-event" as const,
      smoothingApplied: false as const,
      episode: pressureEpisode.audit,
      timing: pressureTiming,
    }),
    forwardVolumeWindows,
    currentReferences: Object.freeze({
      currentValveEventReference: currentValveEvent,
      currentProxyReference: currentProxy,
      audit: Object.freeze({
        legacyThresholdResidualVersusCurrentValveEventMlPerSec:
          legacy.thresholdMlPerSec -
          canonicalEvents.aorticOpenThresholdMlPerSec,
        legacyOpeningSampleIndexMatchesCurrentValveEvent:
          legacy.episode.primaryOpeningSampleIndex ===
          canonicalEvents.aorticValveOpening.sampleIndex,
        legacyClosingSampleIndexMatchesCurrentValveEvent:
          legacy.episode.primaryClosingSampleIndex ===
          canonicalEvents.aorticValveClosure.sampleIndex,
        legacyEjectionTimeResidualVersusCurrentValveEventSec:
          legacy.timing.durationSec -
          canonicalCycle.leftVentricularPerformance.ejectionTimeSec,
        currentProxyThresholdResidualVersusCurrentValveEventMlPerSec:
          proxyThreshold - canonicalEvents.aorticOpenThresholdMlPerSec,
        currentProxyDurationResidualVersusCurrentValveEventSec:
          valveMetrics.forwardEpisodeDurationSec -
          canonicalCycle.leftVentricularPerformance.ejectionTimeSec,
        currentProxyEpisodeCountMatchesCurrentValveEvent:
          valveMetrics.forwardEpisodeCount ===
          currentValveEventEpisode.cyclicEpisodeCount,
        currentProxyPrimaryOpeningMatchesCurrentValveEvent:
          proxyEpisode.openingIndex ===
          canonicalEvents.aorticValveOpening.sampleIndex,
        currentProxyPrimaryClosingMatchesCurrentValveEvent:
          proxyEpisode.closingIndex ===
          canonicalEvents.aorticValveClosure.sampleIndex,
        legacyExactlyReproducesCurrentValveEvent: legacyMatchesCurrent,
      }),
    }),
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_DEFINITION_SENSITIVITY_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_DEFINITION_SENSITIVITY_ANALYSIS_CLAIM_V1,
  });
}

function measureFlowDefinition(
  definitionId: MainWireAorticOutflowV10FlowDefinitionIdV1,
  predicate: MainWireAorticOutflowV10FlowDefinitionMeasurementV1["predicate"],
  peakFraction: number | null,
  absoluteFloorMlPerSec: number | null,
  thresholdMlPerSec: number,
  flows: readonly number[],
  peakIndex: number,
  beat: SelectedBeat,
  dtSec: number,
  cycleLengthSec: number,
  mitralAnchors: FixedMitralAnchors,
  precedingAcceptedSampleAvailable: boolean,
): MainWireAorticOutflowV10FlowDefinitionMeasurementV1 {
  const mask = flows.map((flow) => flow > thresholdMlPerSec);
  const episode = primaryEpisode(mask, peakIndex);
  const startBoundary = sampledEndpointBoundary(
    episode.openingIndex,
    beat,
    dtSec,
    cycleLengthSec,
    precedingAcceptedSampleAvailable,
  );
  const endBoundary = sampledEndpointBoundary(
    episode.closingIndex,
    beat,
    dtSec,
    cycleLengthSec,
    precedingAcceptedSampleAvailable,
  );
  return Object.freeze({
    definitionId,
    predicate,
    peakFraction,
    absoluteFloorMlPerSec,
    thresholdMlPerSec,
    strictGreaterThanThreshold: true as const,
    episode: episode.audit,
    timing: eventPartition(
      startBoundary,
      endBoundary,
      mitralAnchors,
      cycleLengthSec,
    ),
  });
}

function fixedMitralAnchors(
  beat: SelectedBeat,
  dtSec: number,
  cycleLengthSec: number,
  closureIndex: number,
  openingIndex: number,
  thresholdMlPerSec: number,
  precedingAcceptedSampleAvailable: boolean,
): FixedMitralAnchors {
  const closureBoundary = sampledEndpointBoundary(
    closureIndex,
    beat,
    dtSec,
    cycleLengthSec,
    precedingAcceptedSampleAvailable,
  );
  const openingBoundary = sampledEndpointBoundary(
    openingIndex,
    beat,
    dtSec,
    cycleLengthSec,
    precedingAcceptedSampleAvailable,
  );
  return Object.freeze({
    closureIndex,
    openingIndex,
    closureBoundary,
    openingBoundary,
    closureToOpeningSec: cyclicDeltaSec(
      closureBoundary.cycleOffsetFromSelectedBeatStartSec,
      openingBoundary.cycleOffsetFromSelectedBeatStartSec,
      cycleLengthSec,
    ),
    thresholdMlPerSec,
  });
}

function primaryEpisode(
  active: readonly boolean[],
  peakIndex: number,
): PrimaryEpisode {
  if (active.length === 0 || peakIndex < 0 || peakIndex >= active.length) {
    throw new Error("primary episode requires a valid peak index");
  }
  if (!active[peakIndex]) {
    throw new Error("global positive-flow peak is inactive for definition");
  }
  if (active.every(Boolean)) {
    throw new Error("primary episode requires an inactive boundary sample");
  }
  let openingIndex = peakIndex;
  for (let guard = 0; guard < active.length; guard += 1) {
    const previous = positiveModulo(openingIndex - 1, active.length);
    if (!active[previous]) break;
    openingIndex = previous;
  }
  let closingIndex = openingIndex;
  let activeSampleCount = 0;
  for (let guard = 0; guard < active.length; guard += 1) {
    if (!active[closingIndex]) break;
    activeSampleCount += 1;
    closingIndex = positiveModulo(closingIndex + 1, active.length);
  }
  if (activeSampleCount === 0 || active[closingIndex]) {
    throw new Error("primary episode closing transition was not found");
  }
  const totalActiveSampleCount = countTrue(active);
  return Object.freeze({
    openingIndex,
    closingIndex,
    activeSampleCount,
    audit: Object.freeze({
      cyclicEpisodeCount: countCyclicEpisodes(active),
      totalActiveSampleCount,
      primaryEpisodeActiveSampleCount: activeSampleCount,
      extraActiveSampleCountOutsidePrimaryEpisode:
        totalActiveSampleCount - activeSampleCount,
      primaryOpeningSampleIndex: openingIndex,
      primaryClosingSampleIndex: closingIndex,
      primaryContainsGlobalPositiveFlowPeak: true as const,
    }),
  });
}

function episodeAuditFromBoundaries(
  active: readonly boolean[],
  openingIndex: number,
  closingIndex: number,
  peakIndex: number,
): MainWireAorticOutflowV10EpisodeAuditV1 {
  assertSampleIndex(openingIndex, active.length);
  assertSampleIndex(closingIndex, active.length);
  assertSampleIndex(peakIndex, active.length);
  if (!active[openingIndex] || active[closingIndex]) {
    throw new Error("referenced valve-event boundaries disagree with its mask");
  }
  let cursor = openingIndex;
  let activeSampleCount = 0;
  let containsPeak = false;
  for (let guard = 0; guard < active.length; guard += 1) {
    if (cursor === closingIndex) break;
    if (!active[cursor]) {
      throw new Error("referenced valve event contains an inactive sample");
    }
    if (cursor === peakIndex) containsPeak = true;
    activeSampleCount += 1;
    cursor = positiveModulo(cursor + 1, active.length);
  }
  if (cursor !== closingIndex || activeSampleCount === 0) {
    throw new Error("referenced valve-event closure was not reached");
  }
  const totalActiveSampleCount = countTrue(active);
  return Object.freeze({
    cyclicEpisodeCount: countCyclicEpisodes(active),
    totalActiveSampleCount,
    primaryEpisodeActiveSampleCount: activeSampleCount,
    extraActiveSampleCountOutsidePrimaryEpisode:
      totalActiveSampleCount - activeSampleCount,
    primaryOpeningSampleIndex: openingIndex,
    primaryClosingSampleIndex: closingIndex,
    primaryContainsGlobalPositiveFlowPeak: containsPeak,
  });
}

function sampledEndpointBoundary(
  sampleIndex: number,
  beat: SelectedBeat,
  dtSec: number,
  cycleLengthSec: number,
  precedingAcceptedSampleAvailable: boolean,
): MainWireAorticOutflowV10EventBoundaryV1 {
  assertSampleIndex(sampleIndex, beat.samples.length);
  return Object.freeze({
    cycleOffsetFromSelectedBeatStartSec: normalizeCycleOffset(
      (sampleIndex + 1) * dtSec,
      cycleLengthSec,
    ),
    cyclePhase01: beat.samples[sampleIndex]!.cyclePhase01,
    boundaryMethod: "accepted-sample-endpoint" as const,
    previousAcceptedSampleIndex: sampleIndex === 0 ? null : sampleIndex - 1,
    currentAcceptedSampleIndex: sampleIndex,
    interpolationFractionFromPreviousToCurrent01: 1,
    previousEndpointSource:
      sampleIndex === 0
        ? precedingAcceptedSampleAvailable
          ? ("preceding-retained-beat-last-sample" as const)
          : ("selected-beat-start-boundary-without-readback" as const)
        : ("selected-beat-sample" as const),
  });
}

function zeroCrossingBoundary(
  transition: "opening" | "closing",
  currentIndex: number,
  gradients: readonly number[],
  precedingGradient: number | null,
  dtSec: number,
  cycleLengthSec: number,
): MainWireAorticOutflowV10EventBoundaryV1 {
  assertSampleIndex(currentIndex, gradients.length);
  const previousIndex = positiveModulo(currentIndex - 1, gradients.length);
  const usePrecedingEndpoint = currentIndex === 0 && precedingGradient !== null;
  const previous = usePrecedingEndpoint
    ? precedingGradient
    : gradients[previousIndex]!;
  const current = gradients[currentIndex]!;
  if (
    (transition === "opening" && !(previous <= 0 && current > 0)) ||
    (transition === "closing" && !(previous > 0 && current <= 0))
  ) {
    throw new Error(`local-gradient ${transition} does not bracket zero`);
  }
  const interpolationFraction = -previous / (current - previous);
  if (
    !Number.isFinite(interpolationFraction) ||
    interpolationFraction < 0 ||
    interpolationFraction > 1
  )
    throw new Error(`invalid local-gradient ${transition} interpolation`);
  const previousOffsetSec =
    currentIndex === 0 ? cycleLengthSec : currentIndex * dtSec;
  const unwrappedOffsetSec = previousOffsetSec + interpolationFraction * dtSec;
  const normalizedOffsetSec = normalizeCycleOffset(
    unwrappedOffsetSec,
    cycleLengthSec,
  );
  return Object.freeze({
    cycleOffsetFromSelectedBeatStartSec: normalizedOffsetSec,
    cyclePhase01: normalizedOffsetSec / cycleLengthSec,
    boundaryMethod: "linear-zero-crossing-between-accepted-endpoints" as const,
    previousAcceptedSampleIndex: usePrecedingEndpoint ? null : previousIndex,
    currentAcceptedSampleIndex: currentIndex,
    interpolationFractionFromPreviousToCurrent01: interpolationFraction,
    previousEndpointSource: usePrecedingEndpoint
      ? ("preceding-retained-beat-last-sample" as const)
      : currentIndex === 0
        ? ("selected-beat-periodic-endpoint-surrogate" as const)
        : ("selected-beat-sample" as const),
  });
}

function eventPartition(
  startBoundary: MainWireAorticOutflowV10EventBoundaryV1,
  endBoundary: MainWireAorticOutflowV10EventBoundaryV1,
  mitralAnchors: FixedMitralAnchors,
  cycleLengthSec: number,
): MainWireAorticOutflowV10EventPartitionV1 {
  const mvc = mitralAnchors.closureBoundary.cycleOffsetFromSelectedBeatStartSec;
  const mvo = mitralAnchors.openingBoundary.cycleOffsetFromSelectedBeatStartSec;
  const start = startBoundary.cycleOffsetFromSelectedBeatStartSec;
  const end = endBoundary.cycleOffsetFromSelectedBeatStartSec;
  const mvcToStartSec = cyclicDeltaSec(mvc, start, cycleLengthSec);
  const durationSec = cyclicDeltaSec(start, end, cycleLengthSec);
  const endToMvoSec = cyclicDeltaSec(end, mvo, cycleLengthSec);
  if (!(durationSec > 0)) throw new Error("event duration must be positive");
  const identityResidualSec =
    mitralAnchors.closureToOpeningSec -
    mvcToStartSec -
    durationSec -
    endToMvoSec;
  const orderToleranceSec = Math.max(1e-12, cycleLengthSec * 1e-10);
  return Object.freeze({
    startBoundary,
    endBoundary,
    durationSec,
    mvcToStartSec,
    endToMvoSec,
    mitralClosureToOpeningTimeSec: mitralAnchors.closureToOpeningSec,
    teiLike: (mvcToStartSec + endToMvoSec) / durationSec,
    intervalIdentityResidualSec: identityResidualSec,
    mvcStartEndMvoCyclicOrderSatisfied:
      Math.abs(identityResidualSec) <= orderToleranceSec,
  });
}

function measureVolumeWindow(
  window: (typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_VOLUME_WINDOWS_V1)[number],
  flows: readonly number[],
  beat: SelectedBeat,
  precedingSample: MainWireNormalAdultFiveWallDiagnosticSampleV2 | null,
  dtSec: number,
  cycleLengthSec: number,
): MainWireAorticOutflowV10VolumeWindowMeasurementV1 {
  const incrementsMl = flows.map((flow) => Math.max(flow, 0) * dtSec);
  const totalForwardVolumeMl = incrementsMl.reduce(
    (sum, increment) => sum + increment,
    0,
  );
  finitePositive(totalForwardVolumeMl, "forward volume");
  const startBoundary = volumeQuantileBoundary(
    window.lowerQuantile01,
    incrementsMl,
    totalForwardVolumeMl,
    beat,
    precedingSample,
    dtSec,
    cycleLengthSec,
  );
  const endBoundary = volumeQuantileBoundary(
    window.upperQuantile01,
    incrementsMl,
    totalForwardVolumeMl,
    beat,
    precedingSample,
    dtSec,
    cycleLengthSec,
  );
  const targetCentralFraction = window.upperQuantile01 - window.lowerQuantile01;
  const cumulativeForwardVolumeAtStartMl =
    cumulativeForwardVolumeAtBoundary(startBoundary, incrementsMl);
  const cumulativeForwardVolumeAtEndMl =
    cumulativeForwardVolumeAtBoundary(endBoundary, incrementsMl);
  const centralForwardVolumeMl =
    cumulativeForwardVolumeAtEndMl - cumulativeForwardVolumeAtStartMl;
  const durationSec =
    endBoundary.cycleOffsetFromSelectedBeatStartSec -
    startBoundary.cycleOffsetFromSelectedBeatStartSec;
  if (!(durationSec > 0)) {
    throw new Error(
      `${window.windowId} must have positive chronological width`,
    );
  }
  return Object.freeze({
    windowId: window.windowId,
    lowerQuantile01: window.lowerQuantile01,
    upperQuantile01: window.upperQuantile01,
    startBoundary,
    endBoundary,
    centralForwardVolumeWindowDurationSec: durationSec,
    totalForwardVolumeMl,
    centralForwardVolumeMl,
    centralForwardVolumeFraction01:
      centralForwardVolumeMl / totalForwardVolumeMl,
    targetCentralForwardVolumeFraction01: targetCentralFraction,
    centralForwardVolumeIdentityResidualMl:
      centralForwardVolumeMl - targetCentralFraction * totalForwardVolumeMl,
    chronologicalWithinSelectedBeatWithoutWrap: true as const,
    mvcToStartSec: null,
    endToMvoSec: null,
    teiLike: null,
    intervalIdentityResidualSec: null,
    valveEventTimingUnavailableReason:
      "central-forward-volume-window-boundaries-are-not-valve-events" as const,
  });
}

function cumulativeForwardVolumeAtBoundary(
  boundary: MainWireAorticOutflowV10EventBoundaryV1,
  incrementsMl: readonly number[],
): number {
  const currentIndex = boundary.currentAcceptedSampleIndex;
  assertSampleIndex(currentIndex, incrementsMl.length);
  const cumulativeBeforeMl = incrementsMl.slice(0, currentIndex).reduce(
    (sum, incrementMl) => sum + incrementMl,
    0,
  );
  return cumulativeBeforeMl
    + boundary.interpolationFractionFromPreviousToCurrent01
      * incrementsMl[currentIndex]!;
}

function volumeQuantileBoundary(
  quantile01: number,
  incrementsMl: readonly number[],
  totalForwardVolumeMl: number,
  beat: SelectedBeat,
  precedingSample: MainWireNormalAdultFiveWallDiagnosticSampleV2 | null,
  dtSec: number,
  cycleLengthSec: number,
): MainWireAorticOutflowV10EventBoundaryV1 {
  if (!(quantile01 > 0 && quantile01 < 1)) {
    throw new Error("volume quantile must be strictly inside (0, 1)");
  }
  const targetMl = quantile01 * totalForwardVolumeMl;
  let cumulativeBeforeMl = 0;
  for (let index = 0; index < incrementsMl.length; index += 1) {
    const incrementMl = incrementsMl[index]!;
    const cumulativeAfterMl = cumulativeBeforeMl + incrementMl;
    if (incrementMl > 0 && targetMl <= cumulativeAfterMl) {
      const fraction = (targetMl - cumulativeBeforeMl) / incrementMl;
      const offsetSec = index * dtSec + fraction * dtSec;
      return Object.freeze({
        cycleOffsetFromSelectedBeatStartSec: offsetSec,
        cyclePhase01: offsetSec / cycleLengthSec,
        boundaryMethod: "backward-Euler-endpoint-cell-volume-quantile" as const,
        previousAcceptedSampleIndex: index === 0 ? null : index - 1,
        currentAcceptedSampleIndex: index,
        interpolationFractionFromPreviousToCurrent01: fraction,
        previousEndpointSource:
          index === 0
            ? precedingSample === null
              ? ("selected-beat-start-boundary-without-readback" as const)
              : ("preceding-retained-beat-last-sample" as const)
            : ("selected-beat-sample" as const),
      });
    }
    cumulativeBeforeMl = cumulativeAfterMl;
  }
  throw new Error("forward-volume quantile boundary was not found");
}

function assertFixedV10Run(
  run: MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1,
): void {
  const candidate = MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10;
  const mismatches: string[] = [];
  const check = (
    actual: string | null | undefined,
    expected: string,
    name: string,
  ) => {
    if (actual !== expected) mismatches.push(`${name}=${actual ?? "null"}`);
  };
  check(run.kuwProfile.profileId, candidate.kuwProfileId, "kuw");
  check(
    run.sourceTraceProfile.profileId,
    candidate.calciumProfileId,
    "calcium source trace",
  );
  check(
    run.complianceProfile.profileId,
    candidate.complianceProfileId,
    "compliance",
  );
  check(
    run.placementProfile?.profileId,
    candidate.characteristicResistancePlacementProfileId,
    "characteristic placement",
  );
  check(
    run.rootInertanceProfile?.profileId,
    candidate.rootInertanceProfileId,
    "root inertance",
  );
  check(
    run.sarcomereReferenceProfile.profileId,
    candidate.sarcomereReferenceProfileId,
    "sarcomere reference",
  );
  check(
    run.calciumSensitivityLengthProfile.profileId,
    candidate.calciumSensitivityLengthProfileId,
    "calcium sensitivity length",
  );
  check(
    run.sourceTwitchRetentionCandidate.candidateId,
    candidate.twitchRetentionCandidateId,
    "twitch retention",
  );
  check(
    run.trefForceLoadProfile.profileId,
    candidate.trefForceLoadProfileId,
    "Tref force load",
  );
  check(
    run.sourceVelocityDistortionProfile.profileId,
    candidate.sourceVelocityDistortionProfileId,
    "source velocity distortion",
  );
  check(
    run.strongBridgeDeactivationExitProfile.profileId,
    candidate.strongBridgeDeactivationExitProfileId,
    "strong-bridge exit",
  );
  check(
    run.atrioventricularDelayProfile.profileId,
    candidate.atrioventricularDelayProfileId,
    "atrioventricular delay",
  );
  check(
    run.aorticValveResearchProfile?.profileId,
    candidate.pressureRecoveryProfileId,
    "pressure recovery",
  );
  check(
    run.recoveredRootPortValveProfile?.profileId,
    candidate.recoveredRootPortValveProfileId,
    "recovered root port",
  );
  if (
    run.periodicResult.valveResearchInput.valves.AoV.maximumForwardEoaCm2 !==
    candidate.aorticMaximumForwardEoaCm2
  )
    mismatches.push("aortic maximum forward EOA");
  if (mismatches.length > 0) {
    throw new Error(
      `event-definition analysis requires fixed V10: ${mismatches.join("; ")}`,
    );
  }
}

function flowFractionDefinitionId(
  fraction: (typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_FLOW_PEAK_FRACTIONS_V1)[number],
): Exclude<
  MainWireAorticOutflowV10FlowDefinitionIdV1,
  "strict-positive-flow" | "legacy-1-percent-plus-1-mL-per-sec-floor"
> {
  switch (fraction) {
    case 0.001:
      return "peak-fraction-0p1-percent";
    case 0.005:
      return "peak-fraction-0p5-percent";
    case 0.01:
      return "peak-fraction-1-percent-no-floor";
    case 0.02:
      return "peak-fraction-2-percent";
    case 0.05:
      return "peak-fraction-5-percent";
  }
}

function countCyclicEpisodes(active: readonly boolean[]): number {
  if (!active.some(Boolean)) return 0;
  if (active.every(Boolean)) return 1;
  let count = 0;
  for (let index = 0; index < active.length; index += 1) {
    const previous = positiveModulo(index - 1, active.length);
    if (active[index] && !active[previous]) count += 1;
  }
  return count;
}

function countTrue(values: readonly boolean[]): number {
  return values.reduce((count, value) => count + (value ? 1 : 0), 0);
}

function cyclicDeltaSec(from: number, to: number, cycleLengthSec: number) {
  return normalizeCycleOffset(to - from, cycleLengthSec);
}

function normalizeCycleOffset(value: number, cycleLengthSec: number) {
  const normalized =
    ((value % cycleLengthSec) + cycleLengthSec) % cycleLengthSec;
  return normalized >= cycleLengthSec - 1e-14 ? 0 : normalized;
}

function positiveModulo(value: number, modulus: number) {
  return ((value % modulus) + modulus) % modulus;
}

function assertSampleIndex(index: number, sampleCount: number) {
  if (!Number.isInteger(index) || index < 0 || index >= sampleCount) {
    throw new Error(`invalid sample index ${index}`);
  }
}

function finite(value: number, name: string) {
  if (!Number.isFinite(value)) throw new Error(`${name} must be finite`);
}

function finitePositive(value: number, name: string) {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${name} must be finite and positive`);
  }
}
