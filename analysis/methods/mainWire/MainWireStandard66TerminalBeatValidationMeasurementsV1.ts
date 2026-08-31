import {
  MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_V1_ID,
  measureMainWireLeftVentricularFlowEventTimingV1,
  type MainWireLeftVentricularFlowEventTimingAvailabilityV1,
  type MainWireLeftVentricularFlowEventTimingV1,
} from "@/analysis/methods/mainWire/MainWireLeftVentricularFlowEventTimingV1";
import {
  evaluateMainWireLeftVentricularPressureRateV1,
  mainWireLeftVentricularPressureRateConfigurationIdentityV1,
  type MainWireLeftVentricularPressureRateResultV1,
} from "@/analysis/methods/mainWire/MainWireLeftVentricularPressureRateV1";
import {
  MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID,
  mainWireStandard66SelectedTraceFlowTimingInputV1,
  type MainWireStandard66SelectedTraceEndpointV1,
  type MainWireStandard66SelectedTraceV1,
} from "@/analysis/runtime/MainWireStandard66SelectedTraceRunnerV1";
import {
  forwardPressureGradientIncrementV3,
  signedFlowVolumeIncrementV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATES_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_MEASUREMENT_BINDINGS_V1,
  deriveMainWireIntegratedModelStandard66ValidationAorticVmaxV1,
  type MainWireIntegratedModelStandard66ValidationDtMetricIdV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";

export const MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_V1_ID =
  "main-wire-standard66-terminal-beat-validation-measurements-v1" as const;

export const MAIN_WIRE_STANDARD66_TERMINAL_BEAT_PRESSURE_RATE_WINDOWS_SEC_V1 =
  Object.freeze([0.005, 0.01, 0.02] as const);

export const MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_CLAIM_V1 =
  Object.freeze({
    source: "latest-two-exact-atrial-captures-and-all-contiguous-accepted-endpoints" as const,
    completedBeatAlignment:
      "end-capture-output-cross-checked-by-independent-accepted-endpoint-reintegration" as const,
    aorticEjectionTiming:
      "one-percent-of-same-beat-positive-aortic-flow-peak" as const,
    positiveAorticFlowDurationReportedSeparately: true as const,
    primaryStrokeVolume: "completed-beat-aortic-forward-volume" as const,
    primaryMeanArterialPressure:
      "completed-beat-systemic-arterial-pressure" as const,
    primaryAorticVmax:
      "model-exact-vena-contracta-peak-gradient-conversion" as const,
    nominalAreaFlowVelocitySubstituted: false as const,
    leftVentricularPressureBasis: "absolute" as const,
    primaryPressureRateWindowSec: 0.01 as const,
    pressureRateSensitivityWindowsSec: Object.freeze([0.005, 0.02] as const),
    exactModelMutation: false as const,
    exactFrameOutputReserved: false as const,
    registryOrModelSurfaceChanged: false as const,
    outcomeThresholdsEvaluated: false as const,
    clinicalMeasurementEquivalenceClaimed: false as const,
  });

type AvailableMeasurementV1<T> = Extract<
  MainWireLeftVentricularFlowEventTimingAvailabilityV1<T>,
  { status: "available" }
>;

export type MainWireStandard66TerminalBeatNumericalCrossCheckV1 = Readonly<{
  completedBeatValue: number;
  reintegratedValue: number;
  absoluteResidual: number;
  tolerance: number;
  passed: true;
}>;

export type MainWireStandard66TerminalBeatRangeV1 = Readonly<{
  minimum: number;
  maximum: number;
  pulse: number;
}>;

export type MainWireStandard66TerminalBeatPressureRateWindowV1 = Readonly<{
  role: "sensitivity" | "primary";
  windowSec: 0.005 | 0.01 | 0.02;
  result: MainWireLeftVentricularPressureRateResultV1;
  maximumPositiveMmHgPerSec: number;
  minimumNegativeMmHgPerSec: number;
}>;

export type MainWireStandard66TerminalBeatValidationMeasurementsV1 = Readonly<{
  evaluatorId:
    typeof MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_V1_ID;
  source: Readonly<{
    traceRunnerId: typeof MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID;
    startAtrialCaptureId: string;
    endAtrialCaptureId: string;
    startTimeSec: number;
    endTimeSec: number;
    beatDurationSec: number;
    startEndpointIndex: number;
    endEndpointIndex: number;
    contiguousAcceptedEndpointCount: number;
  }>;
  flowEventTiming: MainWireLeftVentricularFlowEventTimingV1;
  requiredFlowEventMeasurements: Readonly<{
    aorticEjectionDurationSec: AvailableMeasurementV1<number>;
    isovolumicContractionDurationSec: AvailableMeasurementV1<number>;
    isovolumicRelaxationDurationSec: AvailableMeasurementV1<number>;
    teiLike: AvailableMeasurementV1<number>;
  }>;
  aorticFlowDurationAudit: Readonly<{
    positiveFlowDurationSec: number;
    onePercentPeakThresholdEjectionDurationSec: number;
    meaningsAreDistinct: true;
  }>;
  completedBeatMeasurements: Readonly<{
    aorticLocalHydraulicForwardGradient: Readonly<{
      meanMmHg: number;
      peakMmHg: number;
    }>;
    aorticVenaContractaBernoulliForwardGradient: Readonly<{
      meanMmHg: number;
      peakMmHg: number;
    }>;
    primaryStrokeVolumeAoVForwardMl: number;
    eventDefinedLeftVentricularStrokeVolumeAuditMl: number | null;
    extremaLeftVentricularStrokeVolumeAuditMl: number | null;
    primaryMeanSystemicArterialPressureMmHg: number;
    historicalMeanAorticNodePressureAuditMmHg: number | null;
    primaryModeledAorticVmaxMPerSec: number;
  }>;
  pressureRate: Readonly<{
    primaryWindowSec: 0.01;
    windows: readonly [
      MainWireStandard66TerminalBeatPressureRateWindowV1,
      MainWireStandard66TerminalBeatPressureRateWindowV1,
      MainWireStandard66TerminalBeatPressureRateWindowV1,
    ];
  }>;
  preregisteredDtGateValues: Readonly<
    Record<MainWireIntegratedModelStandard66ValidationDtMetricIdV1, number>
  >;
  waveformAudit: Readonly<{
    aorticValveFlowMlPerSec: Readonly<{
      minimum: number;
      maximum: number;
      peakForward: number;
    }>;
    absoluteLeftVentricularPressureMmHg:
      MainWireStandard66TerminalBeatRangeV1;
    absoluteHistoricalAorticNodePressureMmHg:
      MainWireStandard66TerminalBeatRangeV1;
    aorticProximalConstitutivePortPressureMmHg:
      MainWireStandard66TerminalBeatRangeV1;
    absoluteSystemicArterialPressureMmHg:
      MainWireStandard66TerminalBeatRangeV1;
    aorticLocalHydraulicGradientMmHg:
      MainWireStandard66TerminalBeatRangeV1;
    aorticVenaContractaBernoulliGradientMmHg:
      MainWireStandard66TerminalBeatRangeV1;
  }>;
  completedBeatAlignmentAudit: Readonly<{
    method:
      "independent-reintegration-of-the-same-capture-to-capture-accepted-endpoints";
    endCaptureEndpointCarriesExpectedActivation: true;
    allCrossChecksPassed: true;
    crossChecks: Readonly<{
      aorticForwardVolumeMl:
        MainWireStandard66TerminalBeatNumericalCrossCheckV1;
      aorticPositiveFlowDurationSec:
        MainWireStandard66TerminalBeatNumericalCrossCheckV1;
      aorticLocalMeanGradientMmHg:
        MainWireStandard66TerminalBeatNumericalCrossCheckV1;
      aorticLocalPeakGradientMmHg:
        MainWireStandard66TerminalBeatNumericalCrossCheckV1;
      aorticVenaContractaMeanGradientMmHg:
        MainWireStandard66TerminalBeatNumericalCrossCheckV1;
      aorticVenaContractaPeakGradientMmHg:
        MainWireStandard66TerminalBeatNumericalCrossCheckV1;
      meanSystemicArterialPressureMmHg:
        MainWireStandard66TerminalBeatNumericalCrossCheckV1;
      historicalMeanAorticNodePressureMmHg:
        MainWireStandard66TerminalBeatNumericalCrossCheckV1;
    }>;
  }>;
  claim:
    typeof MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_CLAIM_V1;
}>;

/**
 * Pure terminal-beat evaluator for Standard66 numerical validation.
 *
 * Registered completed-beat values are intentionally read only at the latest
 * retained end-capture endpoint. The same capture-to-capture accepted path is
 * then reintegrated here and must agree before any measurement is returned.
 * This makes stale or misaligned completed-beat output fail closed without
 * adding analysis placeholders to exact frames.
 */
export function measureMainWireStandard66TerminalBeatValidationV1(
  trace: MainWireStandard66SelectedTraceV1,
): MainWireStandard66TerminalBeatValidationMeasurementsV1 {
  if (trace.runnerId !== MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID) {
    throw new Error("Standard66 terminal measurement trace identity is invalid");
  }
  const captures = trace.capturedAtrialActivationBoundaries;
  if (captures.length < 2) {
    throw new Error(
      "Standard66 terminal measurement requires two retained atrial captures",
    );
  }
  const startCapture = captures.at(-2)!;
  const endCapture = captures.at(-1)!;
  if (!(endCapture.endpointIndex > startCapture.endpointIndex)) {
    throw new Error("Standard66 terminal measurement capture order is invalid");
  }
  const endpoints = trace.endpoints.slice(
    startCapture.endpointIndex,
    endCapture.endpointIndex + 1,
  );
  assertCaptureEndpointV1(
    endpoints[0],
    startCapture.endpointIndex,
    startCapture.capturedActivationId,
    startCapture.activationTimeSec,
    "start",
  );
  assertCaptureEndpointV1(
    endpoints.at(-1),
    endCapture.endpointIndex,
    endCapture.capturedActivationId,
    endCapture.activationTimeSec,
    "end",
  );
  assertContiguousAcceptedEndpointsV1(endpoints, startCapture.endpointIndex);
  for (const endpoint of endpoints.slice(1, -1)) {
    if (endpoint.capturedAtrialActivation?.chamber === "atrial") {
      throw new Error(
        "Standard66 terminal measurement latest captures are not consecutive",
      );
    }
  }

  const flowEventTiming = measureMainWireLeftVentricularFlowEventTimingV1(
    mainWireStandard66SelectedTraceFlowTimingInputV1(
      trace,
      startCapture.capturedActivationId,
      endCapture.capturedActivationId,
    ),
  );
  const ejection = requireAvailableFlowMeasurementV1(
    flowEventTiming.metrics.modelFlowEventAorticEjectionDurationSec,
    "aortic ejection duration",
  );
  const ict = requireAvailableFlowMeasurementV1(
    flowEventTiming.metrics.modelFlowEventIsovolumicContractionDurationSec,
    "isovolumic contraction duration",
  );
  const ivrt = requireAvailableFlowMeasurementV1(
    flowEventTiming.metrics.modelFlowEventIsovolumicRelaxationDurationSec,
    "isovolumic relaxation duration",
  );
  const teiLike = requireAvailableFlowMeasurementV1(
    flowEventTiming.metrics.modelFlowEventTeiLike,
    "Tei-like metric",
  );
  if (!flowEventTiming.interpretation.eligibleForModelFlowEventTimingInterpretation) {
    throw new Error(
      "Standard66 terminal measurement flow-event evidence is not interpretation-eligible",
    );
  }

  const endEndpoint = endpoints.at(-1)!;
  const metrics = endEndpoint.latestCompletedBeatMetrics;
  const completed = Object.freeze({
    localMean: requiredCompletedBeatValueV1(
      metrics.aorticMeanLocalHydraulicForwardGradientMmHg,
      "local mean gradient",
    ),
    localPeak: requiredCompletedBeatValueV1(
      metrics.aorticPeakLocalHydraulicForwardGradientMmHg,
      "local peak gradient",
    ),
    venaContractaMean: requiredCompletedBeatValueV1(
      metrics.aorticMeanVenaContractaBernoulliForwardGradientMmHg,
      "vena-contracta mean gradient",
    ),
    venaContractaPeak: requiredCompletedBeatValueV1(
      metrics.aorticPeakVenaContractaBernoulliForwardGradientMmHg,
      "vena-contracta peak gradient",
    ),
    aorticForwardVolume: requiredCompletedBeatValueV1(
      metrics.aorticForwardVolumeMl,
      "aortic forward volume",
    ),
    meanSystemicArterialPressure: requiredCompletedBeatValueV1(
      metrics.meanSystemicArterialPressureMmHg,
      "mean systemic arterial pressure",
    ),
    historicalMeanAorticNodePressure: requiredCompletedBeatValueV1(
      metrics.historicalMeanAorticNodePressureMmHg,
      "historical mean aortic-node pressure",
    ),
    positiveFlowDuration: requiredCompletedBeatValueV1(
      metrics.aorticPositiveFlowDurationSec,
      "aortic positive-flow duration",
    ),
  });
  const reintegrated = reintegrateCompletedBeatV1(endpoints);
  const crossChecks = Object.freeze({
    aorticForwardVolumeMl: crossCheckV1(
      completed.aorticForwardVolume,
      reintegrated.aorticForwardVolumeMl,
      endpoints.length,
      "aortic forward volume",
    ),
    aorticPositiveFlowDurationSec: crossCheckV1(
      completed.positiveFlowDuration,
      reintegrated.positiveFlowDurationSec,
      endpoints.length,
      "aortic positive-flow duration",
    ),
    aorticLocalMeanGradientMmHg: crossCheckV1(
      completed.localMean,
      reintegrated.localMeanGradientMmHg,
      endpoints.length,
      "aortic local mean gradient",
    ),
    aorticLocalPeakGradientMmHg: crossCheckV1(
      completed.localPeak,
      reintegrated.localPeakGradientMmHg,
      endpoints.length,
      "aortic local peak gradient",
    ),
    aorticVenaContractaMeanGradientMmHg: crossCheckV1(
      completed.venaContractaMean,
      reintegrated.venaContractaMeanGradientMmHg,
      endpoints.length,
      "aortic vena-contracta mean gradient",
    ),
    aorticVenaContractaPeakGradientMmHg: crossCheckV1(
      completed.venaContractaPeak,
      reintegrated.venaContractaPeakGradientMmHg,
      endpoints.length,
      "aortic vena-contracta peak gradient",
    ),
    meanSystemicArterialPressureMmHg: crossCheckV1(
      completed.meanSystemicArterialPressure,
      reintegrated.meanSystemicArterialPressureMmHg,
      endpoints.length,
      "mean systemic arterial pressure",
    ),
    historicalMeanAorticNodePressureMmHg: crossCheckV1(
      completed.historicalMeanAorticNodePressure,
      reintegrated.historicalMeanAorticNodePressureMmHg,
      endpoints.length,
      "historical mean aortic-node pressure",
    ),
  });

  const pressureRateWindows = Object.freeze(
    MAIN_WIRE_STANDARD66_TERMINAL_BEAT_PRESSURE_RATE_WINDOWS_SEC_V1.map(
      (windowSec) => pressureRateWindowV1(endpoints, windowSec),
    ),
  ) as MainWireStandard66TerminalBeatValidationMeasurementsV1["pressureRate"]["windows"];
  const primaryPressureRate = pressureRateWindows[1]!;
  const primaryModeledAorticVmaxMPerSec =
    deriveMainWireIntegratedModelStandard66ValidationAorticVmaxV1(
      completed.venaContractaPeak,
    );
  const preregisteredDtGateValues = freezeGateValuesV1({
    ejectionDurationSec: ejection.value,
    localMeanGradientMmHg: completed.localMean,
    localPeakGradientMmHg: completed.localPeak,
    venaContractaMeanGradientMmHg: completed.venaContractaMean,
    venaContractaPeakGradientMmHg: completed.venaContractaPeak,
    strokeVolumeMl: completed.aorticForwardVolume,
    meanArterialPressureMmHg: completed.meanSystemicArterialPressure,
    aorticVmaxMPerSec: primaryModeledAorticVmaxMPerSec,
    maximumDpDtMmHgPerSec: primaryPressureRate.maximumPositiveMmHgPerSec,
    minimumDpDtMmHgPerSec: primaryPressureRate.minimumNegativeMmHgPerSec,
  });

  const localGradientValues = endpoints.map((endpoint) =>
    requiredSignalValueV1(
      endpoint.signals.aorticLocalHydraulicPressureGradientMmHg,
      "local hydraulic gradient",
    ));
  const venaContractaValues = endpoints.map((endpoint) =>
    requiredSignalValueV1(
      endpoint.signals.aorticVenaContractaBernoulliPressureMmHg,
      "vena-contracta gradient",
    ));
  const proximalPressureValues = endpoints.map((endpoint) =>
    requiredSignalValueV1(
      endpoint.signals.aorticProximalConstitutivePortPressureMmHg,
      "aortic proximal constitutive-port pressure",
    ));
  const aorticFlowValues = endpoints.map(
    (endpoint) => endpoint.signals.aorticValveFlowMlPerSec,
  );

  return Object.freeze({
    evaluatorId:
      MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_V1_ID,
    source: Object.freeze({
      traceRunnerId: trace.runnerId,
      startAtrialCaptureId: startCapture.capturedActivationId,
      endAtrialCaptureId: endCapture.capturedActivationId,
      startTimeSec: startCapture.activationTimeSec,
      endTimeSec: endCapture.activationTimeSec,
      beatDurationSec:
        endCapture.activationTimeSec - startCapture.activationTimeSec,
      startEndpointIndex: startCapture.endpointIndex,
      endEndpointIndex: endCapture.endpointIndex,
      contiguousAcceptedEndpointCount: endpoints.length,
    }),
    flowEventTiming,
    requiredFlowEventMeasurements: Object.freeze({
      aorticEjectionDurationSec: ejection,
      isovolumicContractionDurationSec: ict,
      isovolumicRelaxationDurationSec: ivrt,
      teiLike,
    }),
    aorticFlowDurationAudit: Object.freeze({
      positiveFlowDurationSec: completed.positiveFlowDuration,
      onePercentPeakThresholdEjectionDurationSec: ejection.value,
      meaningsAreDistinct: true as const,
    }),
    completedBeatMeasurements: Object.freeze({
      aorticLocalHydraulicForwardGradient: Object.freeze({
        meanMmHg: completed.localMean,
        peakMmHg: completed.localPeak,
      }),
      aorticVenaContractaBernoulliForwardGradient: Object.freeze({
        meanMmHg: completed.venaContractaMean,
        peakMmHg: completed.venaContractaPeak,
      }),
      primaryStrokeVolumeAoVForwardMl: completed.aorticForwardVolume,
      eventDefinedLeftVentricularStrokeVolumeAuditMl:
        metrics.eventDefinedLeftVentricularStrokeVolumeMl,
      extremaLeftVentricularStrokeVolumeAuditMl:
        metrics.extremaLeftVentricularStrokeVolumeMl,
      primaryMeanSystemicArterialPressureMmHg:
        completed.meanSystemicArterialPressure,
      historicalMeanAorticNodePressureAuditMmHg:
        metrics.historicalMeanAorticNodePressureMmHg,
      primaryModeledAorticVmaxMPerSec,
    }),
    pressureRate: Object.freeze({
      primaryWindowSec: 0.01 as const,
      windows: pressureRateWindows,
    }),
    preregisteredDtGateValues,
    waveformAudit: Object.freeze({
      aorticValveFlowMlPerSec: Object.freeze({
        minimum: Math.min(...aorticFlowValues),
        maximum: Math.max(...aorticFlowValues),
        peakForward: Math.max(0, ...aorticFlowValues),
      }),
      absoluteLeftVentricularPressureMmHg: rangeV1(
        endpoints.map(
          (endpoint) => endpoint.signals.absoluteLeftVentricularPressureMmHg,
        ),
      ),
      absoluteHistoricalAorticNodePressureMmHg: rangeV1(
        endpoints.map(
          (endpoint) =>
            endpoint.signals.absoluteHistoricalAorticNodePressureMmHg,
        ),
      ),
      aorticProximalConstitutivePortPressureMmHg:
        rangeV1(proximalPressureValues),
      absoluteSystemicArterialPressureMmHg: rangeV1(
        endpoints.map(
          (endpoint) => endpoint.signals.absoluteSystemicArterialPressureMmHg,
        ),
      ),
      aorticLocalHydraulicGradientMmHg: rangeV1(localGradientValues),
      aorticVenaContractaBernoulliGradientMmHg:
        rangeV1(venaContractaValues),
    }),
    completedBeatAlignmentAudit: Object.freeze({
      method:
        "independent-reintegration-of-the-same-capture-to-capture-accepted-endpoints" as const,
      endCaptureEndpointCarriesExpectedActivation: true as const,
      allCrossChecksPassed: true as const,
      crossChecks,
    }),
    claim:
      MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_CLAIM_V1,
  });
}

function reintegrateCompletedBeatV1(
  endpoints: readonly MainWireStandard66SelectedTraceEndpointV1[],
) {
  let aorticForwardVolumeMl = 0;
  let positiveFlowDurationSec = 0;
  let localGradientIntegralMmHgSec = 0;
  let venaContractaGradientIntegralMmHgSec = 0;
  let localPeakGradientMmHg: number | null = null;
  let venaContractaPeakGradientMmHg: number | null = null;
  let systemicArterialPressureIntegralMmHgSec = 0;
  let historicalAorticNodePressureIntegralMmHgSec = 0;
  for (let index = 1; index < endpoints.length; index += 1) {
    const previous = endpoints[index - 1]!;
    const next = endpoints[index]!;
    const dtSec = next.actualTimeSec - previous.actualTimeSec;
    const previousFlow = previous.signals.aorticValveFlowMlPerSec;
    const nextFlow = next.signals.aorticValveFlowMlPerSec;
    aorticForwardVolumeMl += signedFlowVolumeIncrementV3(
      previousFlow,
      nextFlow,
      dtSec,
    ).forwardVolumeMl;
    const localIncrement = forwardPressureGradientIncrementV3(
      previousFlow,
      nextFlow,
      requiredSignalValueV1(
        previous.signals.aorticLocalHydraulicPressureGradientMmHg,
        "previous local hydraulic gradient",
      ),
      requiredSignalValueV1(
        next.signals.aorticLocalHydraulicPressureGradientMmHg,
        "next local hydraulic gradient",
      ),
      dtSec,
    );
    const venaContractaIncrement = forwardPressureGradientIncrementV3(
      previousFlow,
      nextFlow,
      requiredSignalValueV1(
        previous.signals.aorticVenaContractaBernoulliPressureMmHg,
        "previous vena-contracta gradient",
      ),
      requiredSignalValueV1(
        next.signals.aorticVenaContractaBernoulliPressureMmHg,
        "next vena-contracta gradient",
      ),
      dtSec,
    );
    if (localIncrement.forwardFlowDurationSec !== venaContractaIncrement.forwardFlowDurationSec) {
      throw new Error(
        "Standard66 terminal measurement gradient integration durations diverged",
      );
    }
    positiveFlowDurationSec += localIncrement.forwardFlowDurationSec;
    localGradientIntegralMmHgSec += localIncrement.pressureIntegralMmHgSec;
    venaContractaGradientIntegralMmHgSec +=
      venaContractaIncrement.pressureIntegralMmHgSec;
    localPeakGradientMmHg = updateNullablePeakV1(
      localPeakGradientMmHg,
      localIncrement.peakMmHg,
    );
    venaContractaPeakGradientMmHg = updateNullablePeakV1(
      venaContractaPeakGradientMmHg,
      venaContractaIncrement.peakMmHg,
    );
    systemicArterialPressureIntegralMmHgSec += 0.5
      * (
        previous.signals.absoluteSystemicArterialPressureMmHg
        + next.signals.absoluteSystemicArterialPressureMmHg
      )
      * dtSec;
    historicalAorticNodePressureIntegralMmHgSec += 0.5
      * (
        previous.signals.absoluteHistoricalAorticNodePressureMmHg
        + next.signals.absoluteHistoricalAorticNodePressureMmHg
      )
      * dtSec;
  }
  const durationSec =
    endpoints.at(-1)!.actualTimeSec - endpoints[0]!.actualTimeSec;
  if (
    !(positiveFlowDurationSec > 0)
    || localPeakGradientMmHg === null
    || venaContractaPeakGradientMmHg === null
  ) {
    throw new Error(
      "Standard66 terminal measurement has no completed-beat positive aortic flow",
    );
  }
  return Object.freeze({
    aorticForwardVolumeMl,
    positiveFlowDurationSec,
    localMeanGradientMmHg:
      localGradientIntegralMmHgSec / positiveFlowDurationSec,
    localPeakGradientMmHg,
    venaContractaMeanGradientMmHg:
      venaContractaGradientIntegralMmHgSec / positiveFlowDurationSec,
    venaContractaPeakGradientMmHg,
    meanSystemicArterialPressureMmHg:
      systemicArterialPressureIntegralMmHgSec / durationSec,
    historicalMeanAorticNodePressureMmHg:
      historicalAorticNodePressureIntegralMmHgSec / durationSec,
  });
}

function pressureRateWindowV1(
  endpoints: readonly MainWireStandard66SelectedTraceEndpointV1[],
  windowSec: 0.005 | 0.01 | 0.02,
): MainWireStandard66TerminalBeatPressureRateWindowV1 {
  const result = evaluateMainWireLeftVentricularPressureRateV1({
    samples: Object.freeze(endpoints.map((endpoint) => Object.freeze({
      actualTimeSec: endpoint.actualTimeSec,
      absoluteLeftVentricularPressureMmHg:
        endpoint.signals.absoluteLeftVentricularPressureMmHg,
    }))),
    windowSec,
  });
  if (
    result.availability !== "both-signs"
    || result.positiveExtremum.status !== "available"
    || result.negativeExtremum.status !== "available"
  ) {
    throw new Error(
      `Standard66 terminal measurement ${windowSec} s pressure rate lacks both signs`,
    );
  }
  return Object.freeze({
    role: windowSec === 0.01 ? "primary" as const : "sensitivity" as const,
    windowSec,
    result,
    maximumPositiveMmHgPerSec:
      result.positiveExtremum.extremum.pressureRateMmHgPerSec,
    minimumNegativeMmHgPerSec:
      result.negativeExtremum.extremum.pressureRateMmHgPerSec,
  });
}

function freezeGateValuesV1(input: Readonly<{
  ejectionDurationSec: number;
  localMeanGradientMmHg: number;
  localPeakGradientMmHg: number;
  venaContractaMeanGradientMmHg: number;
  venaContractaPeakGradientMmHg: number;
  strokeVolumeMl: number;
  meanArterialPressureMmHg: number;
  aorticVmaxMPerSec: number;
  maximumDpDtMmHgPerSec: number;
  minimumDpDtMmHgPerSec: number;
}>): Readonly<
  Record<MainWireIntegratedModelStandard66ValidationDtMetricIdV1, number>
> {
  const bindings =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_MEASUREMENT_BINDINGS_V1;
  const gradientGateMetricIds = bindings.aorticGradients.map(
    ({ gateMetricId }) => gateMetricId,
  );
  if (
    bindings.aorticEjectionTime.gateMetricId !== "aortic-ejection-time"
    || bindings.aorticEjectionTime.analysisMethodId
      !== MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_V1_ID
    || bindings.aorticEjectionTime.analysisMetric
      !== "modelFlowEventAorticEjectionDurationSec"
    || gradientGateMetricIds.length !== 4
    || gradientGateMetricIds[0]
      !== "aortic-local-hydraulic-mean-gradient"
    || gradientGateMetricIds[1]
      !== "aortic-local-hydraulic-peak-gradient"
    || gradientGateMetricIds[2]
      !== "aortic-vena-contracta-bernoulli-mean-gradient"
    || gradientGateMetricIds[3]
      !== "aortic-vena-contracta-bernoulli-peak-gradient"
    || bindings.strokeVolume.gateMetricId !== "stroke-volume"
    || bindings.strokeVolume.primaryOutputId
      !== "hemodynamics.valve-volume.forward.AoV"
    || bindings.meanArterialPressure.gateMetricId !== "mean-arterial-pressure"
    || bindings.meanArterialPressure.primaryOutputId
      !== "hemodynamics.pressure.mean.SA"
    || bindings.aorticVmax.gateMetricId !== "aortic-vmax"
    || bindings.aorticVmax.sourceOutputId
      !== "hemodynamics.pressure-gradient.valve.peak-vena-contracta-bernoulli-forward.AoV"
    || bindings.leftVentricularPressureRate.gateMetricIds[0]
      !== "lv-pressure-maximum-dp-dt"
    || bindings.leftVentricularPressureRate.gateMetricIds[1]
      !== "lv-pressure-minimum-dp-dt"
    || bindings.leftVentricularPressureRate.primaryWindowSec !== 0.01
    || bindings.leftVentricularPressureRate.primaryConfigurationIdentity
      !== mainWireLeftVentricularPressureRateConfigurationIdentityV1(0.01)
  ) {
    throw new Error("Standard66 terminal measurement preregistration drifted");
  }
  const values = Object.freeze({
    "aortic-ejection-time": input.ejectionDurationSec,
    "aortic-local-hydraulic-mean-gradient": input.localMeanGradientMmHg,
    "aortic-local-hydraulic-peak-gradient": input.localPeakGradientMmHg,
    "aortic-vena-contracta-bernoulli-mean-gradient":
      input.venaContractaMeanGradientMmHg,
    "aortic-vena-contracta-bernoulli-peak-gradient":
      input.venaContractaPeakGradientMmHg,
    "stroke-volume": input.strokeVolumeMl,
    "mean-arterial-pressure": input.meanArterialPressureMmHg,
    "aortic-vmax": input.aorticVmaxMPerSec,
    "lv-pressure-maximum-dp-dt": input.maximumDpDtMmHgPerSec,
    "lv-pressure-minimum-dp-dt": input.minimumDpDtMmHgPerSec,
  }) satisfies Readonly<
    Record<MainWireIntegratedModelStandard66ValidationDtMetricIdV1, number>
  >;
  const expectedIds = MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATES_V1
    .map(({ metricId }) => metricId);
  if (
    Object.keys(values).length !== expectedIds.length
    || expectedIds.some((metricId) => !Object.hasOwn(values, metricId))
  ) {
    throw new Error("Standard66 terminal measurement gate set is incomplete");
  }
  for (const [metricId, value] of Object.entries(values)) {
    if (!Number.isFinite(value)) {
      throw new Error(`Standard66 terminal measurement ${metricId} is not finite`);
    }
  }
  return values;
}

function assertCaptureEndpointV1(
  endpoint: MainWireStandard66SelectedTraceEndpointV1 | undefined,
  expectedEndpointIndex: number,
  expectedCaptureId: string,
  expectedTimeSec: number,
  label: "start" | "end",
): asserts endpoint is MainWireStandard66SelectedTraceEndpointV1 {
  if (
    endpoint === undefined
    || endpoint.endpointIndex !== expectedEndpointIndex
    || endpoint.actualTimeSec !== expectedTimeSec
    || endpoint.capturedAtrialActivation?.capturedActivationId
      !== expectedCaptureId
    || endpoint.capturedAtrialActivation.chamber !== "atrial"
  ) {
    throw new Error(
      `Standard66 terminal measurement ${label} capture endpoint is misaligned`,
    );
  }
}

function assertContiguousAcceptedEndpointsV1(
  endpoints: readonly MainWireStandard66SelectedTraceEndpointV1[],
  firstEndpointIndex: number,
): void {
  if (endpoints.length < 2) {
    throw new Error("Standard66 terminal measurement beat path is incomplete");
  }
  for (let index = 0; index < endpoints.length; index += 1) {
    const endpoint = endpoints[index]!;
    if (endpoint.endpointIndex !== firstEndpointIndex + index) {
      throw new Error(
        "Standard66 terminal measurement endpoint indices are not contiguous",
      );
    }
    if (index > 0) {
      const previous = endpoints[index - 1]!;
      if (
        endpoint.acceptedRevision !== previous.acceptedRevision + 1
        || !(endpoint.actualTimeSec > previous.actualTimeSec)
      ) {
        throw new Error(
          "Standard66 terminal measurement accepted commits are not contiguous",
        );
      }
    }
  }
}

function requireAvailableFlowMeasurementV1<T>(
  measurement: MainWireLeftVentricularFlowEventTimingAvailabilityV1<T>,
  label: string,
): AvailableMeasurementV1<T> {
  if (measurement.status !== "available") {
    throw new Error(
      `Standard66 terminal measurement ${label} is unavailable: ${measurement.reason}`,
    );
  }
  return measurement;
}

function requiredCompletedBeatValueV1(
  value: number | null,
  label: string,
): number {
  if (value === null || !Number.isFinite(value)) {
    throw new Error(
      `Standard66 terminal measurement completed-beat ${label} is unavailable`,
    );
  }
  return value;
}

function requiredSignalValueV1(value: number | null, label: string): number {
  if (value === null || !Number.isFinite(value)) {
    throw new Error(`Standard66 terminal measurement ${label} is unavailable`);
  }
  return value;
}

function crossCheckV1(
  completedBeatValue: number,
  reintegratedValue: number,
  endpointCount: number,
  label: string,
): MainWireStandard66TerminalBeatNumericalCrossCheckV1 {
  const absoluteResidual = Math.abs(completedBeatValue - reintegratedValue);
  const tolerance = 32 * endpointCount * Number.EPSILON * Math.max(
    1,
    Math.abs(completedBeatValue),
    Math.abs(reintegratedValue),
  );
  if (!Number.isFinite(absoluteResidual) || absoluteResidual > tolerance) {
    throw new Error(
      `Standard66 terminal measurement ${label} is not aligned with the end capture`,
    );
  }
  return Object.freeze({
    completedBeatValue,
    reintegratedValue,
    absoluteResidual,
    tolerance,
    passed: true as const,
  });
}

function updateNullablePeakV1(
  previous: number | null,
  next: number | null,
): number | null {
  if (next === null) return previous;
  return previous === null ? next : Math.max(previous, next);
}

function rangeV1(values: readonly number[]): MainWireStandard66TerminalBeatRangeV1 {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("Standard66 terminal measurement waveform range is unavailable");
  }
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  return Object.freeze({
    minimum,
    maximum,
    pulse: maximum - minimum,
  });
}
