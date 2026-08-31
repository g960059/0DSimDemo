import {
  measureMainWireLeftVentricularFlowEventTimingV1,
  type MainWireLeftVentricularFlowEventTimingV1,
  type MainWireLeftVentricularModelFlowEventV1,
} from "@/analysis/methods/mainWire/MainWireLeftVentricularFlowEventTimingV1";
import {
  MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID,
  mainWireStandard66SelectedTraceLatestFlowTimingInputV1,
  type MainWireStandard66SelectedTraceEndpointV1,
  type MainWireStandard66SelectedTraceV1,
} from "@/analysis/runtime/MainWireStandard66SelectedTraceRunnerV1";
import {
  MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2,
  MAIN_WIRE_VALVE_PA_PER_MMHG_V2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_V1_ID =
  "main-wire-standard66-aortic-outflow-shape-active-eoa-diagnostic-v1" as const;

/**
 * Exploratory analysis only. It neither changes a registered validation
 * outcome nor claims equivalence to a clinical Doppler measurement.
 */
export const MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_CLAIM_V1 =
  Object.freeze({
    source:
      "latest-two-exact-atrial-captures-and-all-contiguous-accepted-endpoints" as const,
    actualTimeBasis: true as const,
    forwardFlowInterpolation:
      "piecewise-linear-with-exact-zero-crossing-splits" as const,
    activeEoaReconstruction:
      "positive-flow-accepted-endpoint-Q-divided-by-physical-vena-contracta-velocity" as const,
    physicalVenaContractaVelocity:
      "sqrt(2*Pa-per-mmHg*vena-contracta-Bernoulli-gradient/rho)" as const,
    maximumActiveEoaSampling:
      "maximum-over-positive-flow-accepted-endpoint-reconstructions" as const,
    flowWeightedActiveEoa:
      "positive-flow-volume-weighted-piecewise-linear-Q-times-reconstructed-EOA" as const,
    configuredMaximumEoaSemantics:
      "parameter-upper-bound-not-a-cycle-constant-instantaneous-area" as const,
    venaContractaMeanGradientSemantics:
      "piecewise-linear-gradient-time-mean-over-strictly-positive-modeled-aortic-flow" as const,
    modelFlowEjectionEpisode:
      "one-percent-of-same-beat-positive-aortic-flow-peak" as const,
    configuredMaximumCounterfactual:
      "same-retained-flow-only-no-closed-loop-rerun" as const,
    exactModelMutation: false as const,
    exactFrameOutputReserved: false as const,
    registryOrModelSurfaceChanged: false as const,
    preregisteredOutcomeChanged: false as const,
    causalAttributionClaimed: false as const,
    clinicalMeasurementEquivalenceClaimed: false as const,
  });

export type MainWireStandard66AorticOutflowShapeDiagnosticInputV1 = Readonly<{
  trace: MainWireStandard66SelectedTraceV1;
  /**
   * Must be the AoV maximumForwardEoaCm2 used to construct this trace. The
   * trace intentionally does not persist mechanism research inputs.
   */
  configuredMaximumForwardEoaCm2: number;
}>;

export type MainWireStandard66AorticOutflowShapeIdentityV1 = Readonly<{
  left: number;
  right: number;
  absoluteResidual: number;
  tolerance: number;
  passed: true;
}>;

export type MainWireStandard66AorticOutflowShapeCompletedBeatAlignmentV1 =
  | Readonly<{
      status: "cross-checked";
      aorticForwardVolumeMl: MainWireStandard66AorticOutflowShapeIdentityV1;
      positiveFlowDurationSec: MainWireStandard66AorticOutflowShapeIdentityV1;
      venaContractaTimeWeightedMeanGradientMmHg: MainWireStandard66AorticOutflowShapeIdentityV1;
      venaContractaPeakGradientMmHg: MainWireStandard66AorticOutflowShapeIdentityV1;
    }>
  | Readonly<{
      status: "not-cross-checked";
      reason: "completed-beat-readback-unavailable";
    }>;

export type MainWireStandard66AorticOutflowModelFlowEpisodeV1 =
  | Readonly<{
      status: "available";
      opening: MainWireLeftVentricularModelFlowEventV1;
      closure: MainWireLeftVentricularModelFlowEventV1;
      durationSec: number;
      thresholdMlPerSec: number;
      peakFlowMlPerSec: number;
      firstPeakActualTimeSec: number;
      timeFromOpeningToFirstPeakSec: number;
      timeFromOpeningToFirstPeakFraction01: number;
      forwardVolumeWithinEpisodeMl: number;
      flowCentroidFromOpeningSec: number;
      flowCentroidFromOpeningFraction01: number;
      forwardVolumeFractions: Readonly<{
        earlyThird: number;
        middleThird: number;
        lateThird: number;
        sum: number;
        sumMinusOneResidual: number;
      }>;
      thirdVolumeIdentity: MainWireStandard66AorticOutflowShapeIdentityV1;
    }>
  | Readonly<{
      status: "not-measurable";
      reason: "aortic-model-flow-episode-evidence-not-eligible";
    }>;

export type MainWireStandard66AorticOutflowShapeDiagnosticV1 = Readonly<{
  methodId: typeof MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_V1_ID;
  source: Readonly<{
    traceRunnerId: typeof MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID;
    startAtrialCaptureId: string;
    endAtrialCaptureId: string;
    startTimeSec: number;
    endTimeSec: number;
    startEndpointIndex: number;
    endEndpointIndex: number;
    contiguousAcceptedEndpointCount: number;
  }>;
  configuredMaximumForwardEoa: Readonly<{
    areaCm2: number;
    semantics: "parameter-upper-bound-not-cycle-constant-active-area";
  }>;
  reconstructedActiveEoa: Readonly<{
    positiveFlowAcceptedEndpointCount: number;
    maximumAcceptedEndpoint: Readonly<{
      areaCm2: number;
      fractionOfConfiguredMaximum01: number;
      actualTimeSec: number;
      aorticValveFlowMlPerSec: number;
      venaContractaBernoulliGradientMmHg: number;
      physicalVenaContractaVelocityMPerSec: number;
    }>;
    flowWeightedMeanAreaCm2: number;
    flowWeightedMeanFractionOfConfiguredMaximum01: number;
    configuredMaximumBoundAudit: Readonly<{
      maximumExcessCm2: number;
      toleranceCm2: number;
      passed: true;
    }>;
  }>;
  forwardFlowShape: Readonly<{
    positiveFlowDurationSec: number;
    strokeVolumeMl: number;
    timeWeightedMeanFlowMlPerSec: number;
    timeWeightedRmsFlowMlPerSec: number;
    peakFlowMlPerSec: number;
    firstPeakActualTimeSec: number;
    acceptedEndpointPeakMultiplicity: number;
    shapeFactors: Readonly<{
      peakToMean: number;
      rmsToMean: number;
      meanToPeak: number;
    }>;
    strokeVolumePositiveDurationIdentity: MainWireStandard66AorticOutflowShapeIdentityV1;
  }>;
  venaContractaGradientTimeWeighting: Readonly<{
    positiveFlowTimeIntegralMmHgSec: number;
    timeWeightedMeanMmHg: number;
    flowWeightedMeanMmHg: number;
    peakMmHg: number;
    gradientMeanTimesPositiveDurationIdentity: MainWireStandard66AorticOutflowShapeIdentityV1;
    physicalVelocityEquivalentRmsMPerSec: number;
    gradientFromVelocityEquivalentRmsMmHg: number;
    physicalVelocityGradientIdentity: MainWireStandard66AorticOutflowShapeIdentityV1;
  }>;
  sameRetainedFlowConfiguredMaximumEoaCounterfactual: Readonly<{
    /** Applies the square law continuously to the piecewise-linear Q path. */
    continuousFlowLawTimeWeightedMeanGradientMmHg: number;
    /** Transforms accepted endpoints first, then uses the metric's PL mean. */
    acceptedEndpointMetricConventionTimeWeightedMeanGradientMmHg: number;
    nonlinearInterpolationDifferenceMmHg: number;
    observedToAcceptedEndpointCounterfactualMeanGradientRatio: number;
    closedLoopFlowOrStateRecomputed: false;
    causalAttributionClaimed: false;
  }>;
  flowEventTimingEvidence: MainWireLeftVentricularFlowEventTimingV1;
  modelFlowEjectionEpisode: MainWireStandard66AorticOutflowModelFlowEpisodeV1;
  completedBeatAlignmentAudit: MainWireStandard66AorticOutflowShapeCompletedBeatAlignmentV1;
  claim: typeof MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_CLAIM_V1;
}>;

type PositiveFlowSubsegmentV1 = Readonly<{
  startTimeSec: number;
  endTimeSec: number;
  startFlowMlPerSec: number;
  endFlowMlPerSec: number;
  startGradientMmHg: number;
  endGradientMmHg: number;
}>;

type ReconstructedAreaSampleV1 = Readonly<{
  actualTimeSec: number;
  flowMlPerSec: number;
  gradientMmHg: number;
  velocityMPerSec: number;
  areaCm2: number;
}>;

/**
 * Pure secondary diagnostic over the latest exact capture-to-capture path.
 * The configured maximum is explicit because exact traces deliberately retain
 * numerical observations, not a second copy of mechanism configuration.
 */
export function measureMainWireStandard66AorticOutflowShapeDiagnosticV1(
  input: MainWireStandard66AorticOutflowShapeDiagnosticInputV1,
): MainWireStandard66AorticOutflowShapeDiagnosticV1 {
  const { trace } = input;
  if (trace.runnerId !== MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID) {
    throw new Error("Standard66 outflow-shape trace identity is invalid");
  }
  const configuredMaximumForwardEoaCm2 = input.configuredMaximumForwardEoaCm2;
  if (
    !Number.isFinite(configuredMaximumForwardEoaCm2) ||
    configuredMaximumForwardEoaCm2 <= 0
  ) {
    throw new Error(
      "Standard66 outflow-shape configured maximum AoV EOA is invalid",
    );
  }

  const captures = trace.capturedAtrialActivationBoundaries;
  if (captures.length < 2) {
    throw new Error(
      "Standard66 outflow-shape diagnostic requires two retained atrial captures",
    );
  }
  const startCapture = captures.at(-2)!;
  const endCapture = captures.at(-1)!;
  const timingInput =
    mainWireStandard66SelectedTraceLatestFlowTimingInputV1(trace);
  const endpoints = trace.endpoints.slice(
    startCapture.endpointIndex,
    endCapture.endpointIndex + 1,
  );
  assertCapturePairAndSignalsV1(
    endpoints,
    startCapture.endpointIndex,
    endCapture.endpointIndex,
    startCapture.capturedActivationId,
    endCapture.capturedActivationId,
    startCapture.activationTimeSec,
    endCapture.activationTimeSec,
  );

  const positiveSubsegments = buildPositiveFlowSubsegmentsV1(endpoints);
  if (positiveSubsegments.length === 0) {
    throw new Error(
      "Standard66 outflow-shape diagnostic has no positive aortic flow",
    );
  }
  const reconstructedAreas = Object.freeze(
    endpoints.flatMap((endpoint) => {
      const flow = endpoint.signals.aorticValveFlowMlPerSec;
      if (!(flow > 0)) return [];
      const gradient = requiredPositiveGradientV1(
        endpoint.signals.aorticVenaContractaBernoulliPressureMmHg,
        "positive-flow accepted endpoint",
      );
      return [reconstructActiveEoaV1(endpoint.actualTimeSec, flow, gradient)];
    }),
  );
  if (reconstructedAreas.length === 0) {
    throw new Error(
      "Standard66 outflow-shape diagnostic has no reconstructible active EOA",
    );
  }
  const maximumAreaSample = reconstructedAreas.reduce((maximum, sample) =>
    sample.areaCm2 > maximum.areaCm2 ? sample : maximum,
  );
  const configuredMaximumToleranceCm2 =
    512 *
    reconstructedAreas.length *
    Number.EPSILON *
    Math.max(1, configuredMaximumForwardEoaCm2, maximumAreaSample.areaCm2);
  const maximumExcessCm2 = Math.max(
    0,
    maximumAreaSample.areaCm2 - configuredMaximumForwardEoaCm2,
  );
  if (maximumExcessCm2 > configuredMaximumToleranceCm2) {
    throw new Error(
      "Standard66 outflow-shape reconstructed active EOA exceeds its supplied configured maximum",
    );
  }

  let positiveFlowDurationSec = 0;
  let strokeVolumeMl = 0;
  let squaredFlowIntegralMl2PerSec = 0;
  let venaContractaGradientIntegralMmHgSec = 0;
  let flowWeightedGradientNumeratorMmHgMl = 0;
  let flowWeightedAreaNumeratorCm2Ml = 0;
  let peakGradientMmHg = Number.NEGATIVE_INFINITY;
  let configuredEndpointCounterfactualGradientIntegralMmHgSec = 0;
  for (const segment of positiveSubsegments) {
    const durationSec = segment.endTimeSec - segment.startTimeSec;
    const q0 = segment.startFlowMlPerSec;
    const q1 = segment.endFlowMlPerSec;
    const g0 = segment.startGradientMmHg;
    const g1 = segment.endGradientMmHg;
    const volumeMl = 0.5 * (q0 + q1) * durationSec;
    positiveFlowDurationSec += durationSec;
    strokeVolumeMl += volumeMl;
    squaredFlowIntegralMl2PerSec +=
      (durationSec / 3) * (q0 * q0 + q0 * q1 + q1 * q1);
    venaContractaGradientIntegralMmHgSec += 0.5 * (g0 + g1) * durationSec;
    flowWeightedGradientNumeratorMmHgMl +=
      (durationSec / 6) * (2 * q0 * g0 + q0 * g1 + q1 * g0 + 2 * q1 * g1);
    const qArea0 =
      q0 === 0
        ? 0
        : q0 *
          reconstructActiveEoaV1(
            segment.startTimeSec,
            q0,
            requiredPositiveGradientV1(g0, "positive subsegment start"),
          ).areaCm2;
    const qArea1 =
      q1 === 0
        ? 0
        : q1 *
          reconstructActiveEoaV1(
            segment.endTimeSec,
            q1,
            requiredPositiveGradientV1(g1, "positive subsegment end"),
          ).areaCm2;
    flowWeightedAreaNumeratorCm2Ml += 0.5 * (qArea0 + qArea1) * durationSec;
    peakGradientMmHg = Math.max(peakGradientMmHg, g0, g1);
    configuredEndpointCounterfactualGradientIntegralMmHgSec +=
      0.5 *
      (bernoulliGradientFromFlowAndAreaV1(q0, configuredMaximumForwardEoaCm2) +
        bernoulliGradientFromFlowAndAreaV1(
          q1,
          configuredMaximumForwardEoaCm2,
        )) *
      durationSec;
  }
  if (
    !(positiveFlowDurationSec > 0) ||
    !(strokeVolumeMl > 0) ||
    !(squaredFlowIntegralMl2PerSec > 0) ||
    !Number.isFinite(peakGradientMmHg)
  ) {
    throw new Error(
      "Standard66 outflow-shape positive-flow integration is invalid",
    );
  }

  const meanFlowMlPerSec = strokeVolumeMl / positiveFlowDurationSec;
  const rmsFlowMlPerSec = Math.sqrt(
    squaredFlowIntegralMl2PerSec / positiveFlowDurationSec,
  );
  const positiveEndpointFlows = endpoints
    .map((endpoint) =>
      Object.freeze({
        flow: endpoint.signals.aorticValveFlowMlPerSec,
        time: endpoint.actualTimeSec,
      }),
    )
    .filter(({ flow }) => flow > 0);
  const peakFlowMlPerSec = positiveEndpointFlows.reduce(
    (maximum, { flow }) => Math.max(maximum, flow),
    0,
  );
  const peakFlowSamples = positiveEndpointFlows.filter(
    ({ flow }) => flow === peakFlowMlPerSec,
  );
  const firstPeakActualTimeSec = peakFlowSamples[0]!.time;
  const flowWeightedMeanAreaCm2 =
    flowWeightedAreaNumeratorCm2Ml / strokeVolumeMl;
  if (
    flowWeightedMeanAreaCm2 >
    maximumAreaSample.areaCm2 + configuredMaximumToleranceCm2
  ) {
    throw new Error(
      "Standard66 outflow-shape flow-weighted active EOA exceeds its sampled maximum",
    );
  }

  const timeWeightedMeanGradientMmHg =
    venaContractaGradientIntegralMmHgSec / positiveFlowDurationSec;
  const flowWeightedMeanGradientMmHg =
    flowWeightedGradientNumeratorMmHgMl / strokeVolumeMl;
  const velocityEquivalentRmsMPerSec = Math.sqrt(
    (2 * MAIN_WIRE_VALVE_PA_PER_MMHG_V2 * timeWeightedMeanGradientMmHg) /
      MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2,
  );
  const gradientFromVelocityEquivalentRmsMmHg =
    (MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2 *
      velocityEquivalentRmsMPerSec ** 2) /
    (2 * MAIN_WIRE_VALVE_PA_PER_MMHG_V2);
  const continuousCounterfactualMeanGradientMmHg =
    bernoulliGradientFromFlowAndAreaV1(
      rmsFlowMlPerSec,
      configuredMaximumForwardEoaCm2,
    );
  const acceptedEndpointCounterfactualMeanGradientMmHg =
    configuredEndpointCounterfactualGradientIntegralMmHgSec /
    positiveFlowDurationSec;

  const flowEventTiming =
    measureMainWireLeftVentricularFlowEventTimingV1(timingInput);
  const modelFlowEjectionEpisode = measureModelFlowEjectionEpisodeV1(
    endpoints,
    flowEventTiming,
  );
  const completedBeatAlignmentAudit = completedBeatAlignmentAuditV1(
    endpoints.at(-1)!,
    endpoints.length,
    strokeVolumeMl,
    positiveFlowDurationSec,
    timeWeightedMeanGradientMmHg,
    peakGradientMmHg,
  );

  const strokeVolumeIdentity = identityV1(
    strokeVolumeMl,
    meanFlowMlPerSec * positiveFlowDurationSec,
    endpoints.length,
    "stroke volume/positive duration",
  );
  const gradientMeanIdentity = identityV1(
    venaContractaGradientIntegralMmHgSec,
    timeWeightedMeanGradientMmHg * positiveFlowDurationSec,
    endpoints.length,
    "vena-contracta mean-gradient time weighting",
  );
  const velocityGradientIdentity = identityV1(
    timeWeightedMeanGradientMmHg,
    gradientFromVelocityEquivalentRmsMmHg,
    endpoints.length,
    "vena-contracta velocity-gradient",
  );

  return Object.freeze({
    methodId: MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_V1_ID,
    source: Object.freeze({
      traceRunnerId: MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID,
      startAtrialCaptureId: startCapture.capturedActivationId,
      endAtrialCaptureId: endCapture.capturedActivationId,
      startTimeSec: startCapture.activationTimeSec,
      endTimeSec: endCapture.activationTimeSec,
      startEndpointIndex: startCapture.endpointIndex,
      endEndpointIndex: endCapture.endpointIndex,
      contiguousAcceptedEndpointCount: endpoints.length,
    }),
    configuredMaximumForwardEoa: Object.freeze({
      areaCm2: configuredMaximumForwardEoaCm2,
      semantics:
        "parameter-upper-bound-not-cycle-constant-active-area" as const,
    }),
    reconstructedActiveEoa: Object.freeze({
      positiveFlowAcceptedEndpointCount: reconstructedAreas.length,
      maximumAcceptedEndpoint: Object.freeze({
        areaCm2: maximumAreaSample.areaCm2,
        fractionOfConfiguredMaximum01:
          maximumAreaSample.areaCm2 / configuredMaximumForwardEoaCm2,
        actualTimeSec: maximumAreaSample.actualTimeSec,
        aorticValveFlowMlPerSec: maximumAreaSample.flowMlPerSec,
        venaContractaBernoulliGradientMmHg: maximumAreaSample.gradientMmHg,
        physicalVenaContractaVelocityMPerSec: maximumAreaSample.velocityMPerSec,
      }),
      flowWeightedMeanAreaCm2,
      flowWeightedMeanFractionOfConfiguredMaximum01:
        flowWeightedMeanAreaCm2 / configuredMaximumForwardEoaCm2,
      configuredMaximumBoundAudit: Object.freeze({
        maximumExcessCm2,
        toleranceCm2: configuredMaximumToleranceCm2,
        passed: true as const,
      }),
    }),
    forwardFlowShape: Object.freeze({
      positiveFlowDurationSec,
      strokeVolumeMl,
      timeWeightedMeanFlowMlPerSec: meanFlowMlPerSec,
      timeWeightedRmsFlowMlPerSec: rmsFlowMlPerSec,
      peakFlowMlPerSec,
      firstPeakActualTimeSec,
      acceptedEndpointPeakMultiplicity: peakFlowSamples.length,
      shapeFactors: Object.freeze({
        peakToMean: peakFlowMlPerSec / meanFlowMlPerSec,
        rmsToMean: rmsFlowMlPerSec / meanFlowMlPerSec,
        meanToPeak: meanFlowMlPerSec / peakFlowMlPerSec,
      }),
      strokeVolumePositiveDurationIdentity: strokeVolumeIdentity,
    }),
    venaContractaGradientTimeWeighting: Object.freeze({
      positiveFlowTimeIntegralMmHgSec: venaContractaGradientIntegralMmHgSec,
      timeWeightedMeanMmHg: timeWeightedMeanGradientMmHg,
      flowWeightedMeanMmHg: flowWeightedMeanGradientMmHg,
      peakMmHg: peakGradientMmHg,
      gradientMeanTimesPositiveDurationIdentity: gradientMeanIdentity,
      physicalVelocityEquivalentRmsMPerSec: velocityEquivalentRmsMPerSec,
      gradientFromVelocityEquivalentRmsMmHg,
      physicalVelocityGradientIdentity: velocityGradientIdentity,
    }),
    sameRetainedFlowConfiguredMaximumEoaCounterfactual: Object.freeze({
      continuousFlowLawTimeWeightedMeanGradientMmHg:
        continuousCounterfactualMeanGradientMmHg,
      acceptedEndpointMetricConventionTimeWeightedMeanGradientMmHg:
        acceptedEndpointCounterfactualMeanGradientMmHg,
      nonlinearInterpolationDifferenceMmHg:
        acceptedEndpointCounterfactualMeanGradientMmHg -
        continuousCounterfactualMeanGradientMmHg,
      observedToAcceptedEndpointCounterfactualMeanGradientRatio:
        timeWeightedMeanGradientMmHg /
        acceptedEndpointCounterfactualMeanGradientMmHg,
      closedLoopFlowOrStateRecomputed: false as const,
      causalAttributionClaimed: false as const,
    }),
    flowEventTimingEvidence: flowEventTiming,
    modelFlowEjectionEpisode,
    completedBeatAlignmentAudit,
    claim: MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_CLAIM_V1,
  });
}

function assertCapturePairAndSignalsV1(
  endpoints: readonly MainWireStandard66SelectedTraceEndpointV1[],
  expectedStartEndpointIndex: number,
  expectedEndEndpointIndex: number,
  expectedStartCaptureId: string,
  expectedEndCaptureId: string,
  expectedStartTimeSec: number,
  expectedEndTimeSec: number,
): void {
  if (
    endpoints.length < 2 ||
    endpoints.length !==
      expectedEndEndpointIndex - expectedStartEndpointIndex + 1
  ) {
    throw new Error("Standard66 outflow-shape capture interval is incomplete");
  }
  for (let index = 0; index < endpoints.length; index += 1) {
    const endpoint = endpoints[index]!;
    if (
      endpoint.endpointIndex !== expectedStartEndpointIndex + index ||
      !Number.isFinite(endpoint.actualTimeSec) ||
      !Number.isSafeInteger(endpoint.acceptedRevision) ||
      !Number.isFinite(endpoint.signals.aorticValveFlowMlPerSec) ||
      !Number.isFinite(endpoint.signals.mitralValveFlowMlPerSec) ||
      endpoint.signals.aorticVenaContractaBernoulliPressureMmHg === null ||
      !Number.isFinite(
        endpoint.signals.aorticVenaContractaBernoulliPressureMmHg,
      )
    ) {
      throw new Error("Standard66 outflow-shape accepted endpoint is invalid");
    }
    if (index > 0) {
      const previous = endpoints[index - 1]!;
      if (
        endpoint.acceptedRevision !== previous.acceptedRevision + 1 ||
        !(endpoint.actualTimeSec > previous.actualTimeSec)
      ) {
        throw new Error(
          "Standard66 outflow-shape accepted endpoint chain is not contiguous",
        );
      }
    }
    if (
      index > 0 &&
      index < endpoints.length - 1 &&
      endpoint.capturedAtrialActivation?.chamber === "atrial"
    ) {
      throw new Error(
        "Standard66 outflow-shape retained captures are not consecutive",
      );
    }
  }
  const start = endpoints[0]!;
  const end = endpoints.at(-1)!;
  if (
    start.actualTimeSec !== expectedStartTimeSec ||
    start.capturedAtrialActivation?.chamber !== "atrial" ||
    start.capturedAtrialActivation.capturedActivationId !==
      expectedStartCaptureId ||
    end.actualTimeSec !== expectedEndTimeSec ||
    end.capturedAtrialActivation?.chamber !== "atrial" ||
    end.capturedAtrialActivation.capturedActivationId !== expectedEndCaptureId
  ) {
    throw new Error(
      "Standard66 outflow-shape capture endpoints are misaligned",
    );
  }
}

function buildPositiveFlowSubsegmentsV1(
  endpoints: readonly MainWireStandard66SelectedTraceEndpointV1[],
): readonly PositiveFlowSubsegmentV1[] {
  const segments: PositiveFlowSubsegmentV1[] = [];
  for (let index = 1; index < endpoints.length; index += 1) {
    const left = endpoints[index - 1]!;
    const right = endpoints[index]!;
    const q0 = left.signals.aorticValveFlowMlPerSec;
    const q1 = right.signals.aorticValveFlowMlPerSec;
    if (q0 <= 0 && q1 <= 0) continue;
    const t0 = left.actualTimeSec;
    const t1 = right.actualTimeSec;
    const sourceG0 = left.signals.aorticVenaContractaBernoulliPressureMmHg!;
    const sourceG1 = right.signals.aorticVenaContractaBernoulliPressureMmHg!;
    let startFraction01 = 0;
    let endFraction01 = 1;
    if (q0 <= 0) {
      startFraction01 = q0 / (q0 - q1);
    }
    if (q1 <= 0) {
      endFraction01 = q0 / (q0 - q1);
    }
    if (
      !Number.isFinite(startFraction01) ||
      !Number.isFinite(endFraction01) ||
      startFraction01 < 0 ||
      endFraction01 > 1 ||
      !(endFraction01 > startFraction01)
    ) {
      throw new Error(
        "Standard66 outflow-shape positive-flow zero crossing is invalid",
      );
    }
    const startFlow = interpolateV1(q0, q1, startFraction01);
    const endFlow = interpolateV1(q0, q1, endFraction01);
    const startGradient = normalizeNonnegativeGradientV1(
      interpolateV1(sourceG0, sourceG1, startFraction01),
      sourceG0,
      sourceG1,
    );
    const endGradient = normalizeNonnegativeGradientV1(
      interpolateV1(sourceG0, sourceG1, endFraction01),
      sourceG0,
      sourceG1,
    );
    if (
      (startFlow > 0 && !(startGradient > 0)) ||
      (endFlow > 0 && !(endGradient > 0))
    ) {
      throw new Error(
        "Standard66 outflow-shape positive flow lacks positive vena-contracta gradient",
      );
    }
    segments.push(
      Object.freeze({
        startTimeSec: interpolateV1(t0, t1, startFraction01),
        endTimeSec: interpolateV1(t0, t1, endFraction01),
        startFlowMlPerSec: startFlow <= 0 ? 0 : startFlow,
        endFlowMlPerSec: endFlow <= 0 ? 0 : endFlow,
        startGradientMmHg: startGradient,
        endGradientMmHg: endGradient,
      }),
    );
  }
  return Object.freeze(segments);
}

function normalizeNonnegativeGradientV1(
  value: number,
  source0: number,
  source1: number,
): number {
  const tolerance =
    128 * Number.EPSILON * Math.max(1, Math.abs(source0), Math.abs(source1));
  if (value < -tolerance) {
    throw new Error(
      "Standard66 outflow-shape vena-contracta gradient is negative during positive flow",
    );
  }
  return value < 0 ? 0 : value;
}

function requiredPositiveGradientV1(
  value: number | null,
  label: string,
): number {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    throw new Error(
      `Standard66 outflow-shape ${label} vena-contracta gradient must be positive`,
    );
  }
  return value;
}

function reconstructActiveEoaV1(
  actualTimeSec: number,
  flowMlPerSec: number,
  gradientMmHg: number,
): ReconstructedAreaSampleV1 {
  if (
    !Number.isFinite(actualTimeSec) ||
    !(flowMlPerSec > 0) ||
    !Number.isFinite(flowMlPerSec) ||
    !(gradientMmHg > 0) ||
    !Number.isFinite(gradientMmHg)
  ) {
    throw new Error(
      "Standard66 outflow-shape active EOA reconstruction input is invalid",
    );
  }
  const velocityMPerSec = Math.sqrt(
    (2 * MAIN_WIRE_VALVE_PA_PER_MMHG_V2 * gradientMmHg) /
      MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2,
  );
  const areaCm2 = (0.01 * flowMlPerSec) / velocityMPerSec;
  if (!(velocityMPerSec > 0) || !(areaCm2 > 0) || !Number.isFinite(areaCm2)) {
    throw new Error(
      "Standard66 outflow-shape active EOA reconstruction is non-finite",
    );
  }
  return Object.freeze({
    actualTimeSec,
    flowMlPerSec,
    gradientMmHg,
    velocityMPerSec,
    areaCm2,
  });
}

function bernoulliGradientFromFlowAndAreaV1(
  flowMlPerSec: number,
  areaCm2: number,
): number {
  if (
    !Number.isFinite(flowMlPerSec) ||
    flowMlPerSec < 0 ||
    !Number.isFinite(areaCm2) ||
    areaCm2 <= 0
  ) {
    throw new Error(
      "Standard66 outflow-shape Bernoulli counterfactual input is invalid",
    );
  }
  const velocityMPerSec = (0.01 * flowMlPerSec) / areaCm2;
  return (
    (MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2 * velocityMPerSec ** 2) /
    (2 * MAIN_WIRE_VALVE_PA_PER_MMHG_V2)
  );
}

function measureModelFlowEjectionEpisodeV1(
  endpoints: readonly MainWireStandard66SelectedTraceEndpointV1[],
  timing: MainWireLeftVentricularFlowEventTimingV1,
): MainWireStandard66AorticOutflowModelFlowEpisodeV1 {
  const openingAvailability = timing.events.aorticValveOpening;
  const closureAvailability = timing.events.aorticValveClosure;
  const threshold = timing.evidence.aortic.threshold.thresholdMlPerSec;
  const peak = timing.evidence.aortic.threshold.positivePeakFlowMlPerSec;
  if (
    openingAvailability.status !== "available" ||
    closureAvailability.status !== "available" ||
    timing.evidence.aortic.threshold.thresholdEpisodeCount !== 1 ||
    timing.evidence.aortic
      .extraActiveAcceptedEndpointCountOutsidePrimaryEpisode !== 0 ||
    threshold === null ||
    peak === null
  ) {
    return Object.freeze({
      status: "not-measurable" as const,
      reason: "aortic-model-flow-episode-evidence-not-eligible" as const,
    });
  }
  const opening = openingAvailability.value;
  const closure = closureAvailability.value;
  const durationSec = closure.timeSec - opening.timeSec;
  if (!(durationSec > 0)) {
    throw new Error(
      "Standard66 outflow-shape model-flow ejection duration is invalid",
    );
  }
  const total = integrateFlowWindowV1(
    endpoints,
    opening.timeSec,
    closure.timeSec,
    opening.timeSec,
  );
  if (!(total.volumeMl > 0)) {
    throw new Error(
      "Standard66 outflow-shape model-flow ejection volume is invalid",
    );
  }
  const oneThirdSec = durationSec / 3;
  const early = integrateFlowWindowV1(
    endpoints,
    opening.timeSec,
    opening.timeSec + oneThirdSec,
    opening.timeSec,
  );
  const middle = integrateFlowWindowV1(
    endpoints,
    opening.timeSec + oneThirdSec,
    opening.timeSec + 2 * oneThirdSec,
    opening.timeSec,
  );
  const late = integrateFlowWindowV1(
    endpoints,
    opening.timeSec + 2 * oneThirdSec,
    closure.timeSec,
    opening.timeSec,
  );
  const thirdVolumeSumMl = early.volumeMl + middle.volumeMl + late.volumeMl;
  const thirdVolumeIdentity = identityV1(
    total.volumeMl,
    thirdVolumeSumMl,
    endpoints.length,
    "model-flow ejection thirds",
  );
  const peakPoint = firstMaximumFlowPointInWindowV1(
    endpoints,
    opening.timeSec,
    closure.timeSec,
  );
  const timeFromOpeningToFirstPeakSec =
    peakPoint.actualTimeSec - opening.timeSec;
  const earlyFraction = early.volumeMl / total.volumeMl;
  const middleFraction = middle.volumeMl / total.volumeMl;
  const lateFraction = late.volumeMl / total.volumeMl;
  const fractionSum = earlyFraction + middleFraction + lateFraction;
  return Object.freeze({
    status: "available" as const,
    opening,
    closure,
    durationSec,
    thresholdMlPerSec: threshold,
    peakFlowMlPerSec: peakPoint.flowMlPerSec,
    firstPeakActualTimeSec: peakPoint.actualTimeSec,
    timeFromOpeningToFirstPeakSec,
    timeFromOpeningToFirstPeakFraction01:
      timeFromOpeningToFirstPeakSec / durationSec,
    forwardVolumeWithinEpisodeMl: total.volumeMl,
    flowCentroidFromOpeningSec: total.firstMomentMlSec / total.volumeMl,
    flowCentroidFromOpeningFraction01:
      total.firstMomentMlSec / total.volumeMl / durationSec,
    forwardVolumeFractions: Object.freeze({
      earlyThird: earlyFraction,
      middleThird: middleFraction,
      lateThird: lateFraction,
      sum: fractionSum,
      sumMinusOneResidual: fractionSum - 1,
    }),
    thirdVolumeIdentity,
  });
}

function integrateFlowWindowV1(
  endpoints: readonly MainWireStandard66SelectedTraceEndpointV1[],
  startTimeSec: number,
  endTimeSec: number,
  momentOriginTimeSec: number,
): Readonly<{ volumeMl: number; firstMomentMlSec: number }> {
  if (!(endTimeSec > startTimeSec)) {
    throw new Error("Standard66 outflow-shape integration window is invalid");
  }
  let volumeMl = 0;
  let firstMomentMlSec = 0;
  let coveredDurationSec = 0;
  for (let index = 1; index < endpoints.length; index += 1) {
    const left = endpoints[index - 1]!;
    const right = endpoints[index]!;
    const intervalStart = Math.max(startTimeSec, left.actualTimeSec);
    const intervalEnd = Math.min(endTimeSec, right.actualTimeSec);
    if (!(intervalEnd > intervalStart)) continue;
    const sourceDuration = right.actualTimeSec - left.actualTimeSec;
    const startFraction = (intervalStart - left.actualTimeSec) / sourceDuration;
    const endFraction = (intervalEnd - left.actualTimeSec) / sourceDuration;
    const qStart = interpolateV1(
      left.signals.aorticValveFlowMlPerSec,
      right.signals.aorticValveFlowMlPerSec,
      startFraction,
    );
    const qEnd = interpolateV1(
      left.signals.aorticValveFlowMlPerSec,
      right.signals.aorticValveFlowMlPerSec,
      endFraction,
    );
    const flowTolerance =
      128 * Number.EPSILON * Math.max(1, Math.abs(qStart), Math.abs(qEnd));
    if (qStart < -flowTolerance || qEnd < -flowTolerance) {
      throw new Error(
        "Standard66 outflow-shape model-flow episode contains negative flow",
      );
    }
    const qa = qStart < 0 ? 0 : qStart;
    const qb = qEnd < 0 ? 0 : qEnd;
    const ta = intervalStart - momentOriginTimeSec;
    const tb = intervalEnd - momentOriginTimeSec;
    const dtSec = intervalEnd - intervalStart;
    volumeMl += 0.5 * (qa + qb) * dtSec;
    firstMomentMlSec += (dtSec / 6) * ((2 * ta + tb) * qa + (ta + 2 * tb) * qb);
    coveredDurationSec += dtSec;
  }
  const coverageTolerance =
    128 *
    endpoints.length *
    Number.EPSILON *
    Math.max(1, Math.abs(startTimeSec), Math.abs(endTimeSec));
  if (
    Math.abs(coveredDurationSec - (endTimeSec - startTimeSec)) >
    coverageTolerance
  ) {
    throw new Error(
      "Standard66 outflow-shape model-flow episode is not fully retained",
    );
  }
  return Object.freeze({ volumeMl, firstMomentMlSec });
}

function firstMaximumFlowPointInWindowV1(
  endpoints: readonly MainWireStandard66SelectedTraceEndpointV1[],
  startTimeSec: number,
  endTimeSec: number,
): Readonly<{ actualTimeSec: number; flowMlPerSec: number }> {
  const candidates: Array<
    Readonly<{
      actualTimeSec: number;
      flowMlPerSec: number;
    }>
  > = [];
  candidates.push(
    Object.freeze({
      actualTimeSec: startTimeSec,
      flowMlPerSec: interpolateFlowAtTimeV1(endpoints, startTimeSec),
    }),
  );
  for (const endpoint of endpoints) {
    if (
      endpoint.actualTimeSec > startTimeSec &&
      endpoint.actualTimeSec < endTimeSec
    ) {
      candidates.push(
        Object.freeze({
          actualTimeSec: endpoint.actualTimeSec,
          flowMlPerSec: endpoint.signals.aorticValveFlowMlPerSec,
        }),
      );
    }
  }
  candidates.push(
    Object.freeze({
      actualTimeSec: endTimeSec,
      flowMlPerSec: interpolateFlowAtTimeV1(endpoints, endTimeSec),
    }),
  );
  if (candidates.length === 0) {
    throw new Error("Standard66 outflow-shape peak candidate set is empty");
  }
  return candidates.reduce((firstMaximum, candidate) =>
    candidate.flowMlPerSec > firstMaximum.flowMlPerSec
      ? candidate
      : firstMaximum,
  );
}

function interpolateFlowAtTimeV1(
  endpoints: readonly MainWireStandard66SelectedTraceEndpointV1[],
  timeSec: number,
): number {
  const exact = endpoints.find(
    (endpoint) => endpoint.actualTimeSec === timeSec,
  );
  if (exact !== undefined) return exact.signals.aorticValveFlowMlPerSec;
  for (let index = 1; index < endpoints.length; index += 1) {
    const left = endpoints[index - 1]!;
    const right = endpoints[index]!;
    if (left.actualTimeSec < timeSec && timeSec < right.actualTimeSec) {
      return interpolateV1(
        left.signals.aorticValveFlowMlPerSec,
        right.signals.aorticValveFlowMlPerSec,
        (timeSec - left.actualTimeSec) /
          (right.actualTimeSec - left.actualTimeSec),
      );
    }
  }
  throw new Error(
    "Standard66 outflow-shape interpolation time is not retained",
  );
}

function completedBeatAlignmentAuditV1(
  endEndpoint: MainWireStandard66SelectedTraceEndpointV1,
  endpointCount: number,
  strokeVolumeMl: number,
  positiveFlowDurationSec: number,
  meanGradientMmHg: number,
  peakGradientMmHg: number,
): MainWireStandard66AorticOutflowShapeCompletedBeatAlignmentV1 {
  const metrics = endEndpoint.latestCompletedBeatMetrics;
  const values = [
    metrics.aorticForwardVolumeMl,
    metrics.aorticPositiveFlowDurationSec,
    metrics.aorticMeanVenaContractaBernoulliForwardGradientMmHg,
    metrics.aorticPeakVenaContractaBernoulliForwardGradientMmHg,
  ] as const;
  if (values.every((value) => value === null)) {
    return Object.freeze({
      status: "not-cross-checked" as const,
      reason: "completed-beat-readback-unavailable" as const,
    });
  }
  if (values.some((value) => value === null || !Number.isFinite(value))) {
    throw new Error(
      "Standard66 outflow-shape completed-beat alignment readback is partial",
    );
  }
  return Object.freeze({
    status: "cross-checked" as const,
    aorticForwardVolumeMl: identityV1(
      values[0]!,
      strokeVolumeMl,
      endpointCount,
      "completed-beat aortic forward volume",
    ),
    positiveFlowDurationSec: identityV1(
      values[1]!,
      positiveFlowDurationSec,
      endpointCount,
      "completed-beat positive-flow duration",
    ),
    venaContractaTimeWeightedMeanGradientMmHg: identityV1(
      values[2]!,
      meanGradientMmHg,
      endpointCount,
      "completed-beat vena-contracta mean gradient",
    ),
    venaContractaPeakGradientMmHg: identityV1(
      values[3]!,
      peakGradientMmHg,
      endpointCount,
      "completed-beat vena-contracta peak gradient",
    ),
  });
}

function identityV1(
  left: number,
  right: number,
  endpointCount: number,
  label: string,
): MainWireStandard66AorticOutflowShapeIdentityV1 {
  const absoluteResidual = Math.abs(left - right);
  const tolerance =
    64 *
    endpointCount *
    Number.EPSILON *
    Math.max(1, Math.abs(left), Math.abs(right));
  if (
    !Number.isFinite(left) ||
    !Number.isFinite(right) ||
    !Number.isFinite(absoluteResidual) ||
    absoluteResidual > tolerance
  ) {
    throw new Error(`Standard66 outflow-shape ${label} identity failed`);
  }
  return Object.freeze({
    left,
    right,
    absoluteResidual,
    tolerance,
    passed: true as const,
  });
}

function interpolateV1(
  left: number,
  right: number,
  fraction01: number,
): number {
  return left + fraction01 * (right - left);
}
