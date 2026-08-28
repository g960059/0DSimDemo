import {
  MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_REFERENCE_CONTEXT_V1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireValveDiseaseCycleMetricsV1,
} from "@/engine/myocardium/diagnostics/MainWireValveDiseaseCycleMetricsV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_KINEMATIC_FLOOR_V1_ID =
  "main-wire-aortic-outflow-kinematic-floor-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_KINEMATIC_FLOOR_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat" as const,
    forwardEpisode: "all-strictly-positive-AoV-flow-samples" as const,
    integration:
      "accepted-end-step-rectangles-with-fixed-dt-no-interpolation" as const,
    velocityConversion:
      "q-mL-per-sec-divided-by-100-times-EOA-cm2" as const,
    simplifiedDopplerGradient: "four-times-velocity-squared" as const,
    kinematicFloorFormula:
      "4-times-forward-volume-over-100-Amax-forward-time-squared" as const,
    proof:
      "A-of-t-no-greater-than-Amax-plus-time-mean-q-squared-no-less-than-time-mean-q-all-squared" as const,
    fullOpenWaveformCounterfactualChangesExactModel: false as const,
    healthyLvetContextUsedAsClinicalPassFail: false as const,
    modelAndReferenceDurationDefinitionsInterchangeable: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterFittingOrOptimization: false as const,
  });

export type MainWireAorticOutflowKinematicFloorProjectionV1 = Readonly<{
  durationContext: "healthy-lower-95PI" | "healthy-mean" | "healthy-upper-95PI";
  durationSec: number;
  uniformFullOpenVelocityMPerSec: number;
  meanAndPeakGradientFloorMmHg: number;
}>;

export type MainWireAorticOutflowKinematicFloorV1 = Readonly<{
  methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_KINEMATIC_FLOOR_V1_ID;
  source: Readonly<{
    protocolIdentityHash: string;
    beatIndex: number;
    dtSec: number;
    positiveFlowSampleCount: number;
    forwardVolumeMl: number;
    forwardFlowTimeSec: number;
    configuredMaximumForwardEoaCm2: number;
    meanForwardFlowMlPerSec: number;
    maximumForwardFlowMlPerSec: number;
    observedMeanDopplerGradientMmHg: number;
    observedPeakDopplerGradientMmHg: number;
  }>;
  currentDuration: Readonly<{
    uniformFullOpenVelocityMPerSec: number;
    meanAndPeakGradientFloorMmHg: number;
    fullOpenActualWaveformMeanGradientMmHg: number;
    flowNonuniformityFactor: number;
    timeVaryingOpeningPenaltyFactor: number;
    observedToKinematicFloorFactor: number;
    multiplicativeReconstructionResidualMmHg: number;
    peakToMeanForwardFlowRatio: number;
    cauchySchwarzFloorSatisfied: boolean;
    timeVaryingAreaFloorSatisfied: boolean;
    observedPeakNoLowerThanObservedMean: boolean;
  }>;
  healthyLvetContext: Readonly<{
    measurementContext: string;
    sampleCount: number;
    doi: string;
    modelForwardFlowDurationGapToLower95PiSec: number;
    projections: readonly MainWireAorticOutflowKinematicFloorProjectionV1[];
  }>;
  claim: typeof MAIN_WIRE_AORTIC_OUTFLOW_KINEMATIC_FLOOR_CLAIM_V1;
}>;

export function measureMainWireAorticOutflowKinematicFloorV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireAorticOutflowKinematicFloorV1 {
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error("aortic outflow kinematic floor requires a retained beat");
  }
  const valveMetrics = measureMainWireValveDiseaseCycleMetricsV1(result)
    .valves.AoV;
  const positiveFlows = beat.samples.flatMap((sample) => {
    const flow = sample.valveHydraulics.AoV.flowMlPerSec;
    return flow > 0 ? [flow] : [];
  });
  if (positiveFlows.length === 0) {
    throw new Error("aortic outflow kinematic floor requires forward flow");
  }
  const dtSec = result.dtSec;
  const forwardVolumeMl = sum(positiveFlows) * dtSec;
  const forwardFlowTimeSec = positiveFlows.length * dtSec;
  const maximumEoaCm2 = valveMetrics.configuredMaximumForwardEoaCm2;
  const meanFlow = forwardVolumeMl / forwardFlowTimeSec;
  const maximumFlow = maximum(positiveFlows);
  const uniformVelocity = meanFlow / (100 * maximumEoaCm2);
  const floorGradient = 4 * uniformVelocity ** 2;
  const fullOpenWaveformMeanGradient = mean(positiveFlows.map((flow) =>
    4 * (flow / (100 * maximumEoaCm2)) ** 2));
  const observedMean =
    valveMetrics.forwardFlowTimeMeanSimplifiedDopplerGradientMmHg;
  const observedPeak = valveMetrics.peakSimplifiedDopplerGradientMmHg;
  const flowNonuniformityFactor = fullOpenWaveformMeanGradient / floorGradient;
  const openingPenaltyFactor = observedMean / fullOpenWaveformMeanGradient;
  const reconstructedMean = floorGradient
    * flowNonuniformityFactor
    * openingPenaltyFactor;
  const tolerance = 1e-10 * Math.max(1, observedMean);
  const volumeResidual = forwardVolumeMl - valveMetrics.forwardVolumeMl;
  if (Math.abs(volumeResidual) > 1e-10 * Math.max(1, forwardVolumeMl)) {
    throw new Error("aortic outflow kinematic floor volume identity mismatch");
  }
  const durationResidual =
    forwardFlowTimeSec - valveMetrics.forwardFlowTimeSec;
  if (Math.abs(durationResidual) > 1e-12) {
    throw new Error("aortic outflow kinematic floor duration identity mismatch");
  }

  const reference =
    MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_REFERENCE_CONTEXT_V1
      .leftVentricularEjectionTime;
  const projection = (
    durationContext:
      MainWireAorticOutflowKinematicFloorProjectionV1["durationContext"],
    durationSec: number,
  ): MainWireAorticOutflowKinematicFloorProjectionV1 => {
    const velocity = forwardVolumeMl / (100 * maximumEoaCm2 * durationSec);
    return Object.freeze({
      durationContext,
      durationSec,
      uniformFullOpenVelocityMPerSec: velocity,
      meanAndPeakGradientFloorMmHg: 4 * velocity ** 2,
    });
  };
  const projections = Object.freeze([
    projection("healthy-lower-95PI", reference.predictionInterval95Sec[0]),
    projection("healthy-mean", reference.meanSec),
    projection("healthy-upper-95PI", reference.predictionInterval95Sec[1]),
  ]);

  return Object.freeze({
    methodId: MAIN_WIRE_AORTIC_OUTFLOW_KINEMATIC_FLOOR_V1_ID,
    source: Object.freeze({
      protocolIdentityHash: result.protocolIdentityHash,
      beatIndex: beat.beatIndex,
      dtSec,
      positiveFlowSampleCount: positiveFlows.length,
      forwardVolumeMl,
      forwardFlowTimeSec,
      configuredMaximumForwardEoaCm2: maximumEoaCm2,
      meanForwardFlowMlPerSec: meanFlow,
      maximumForwardFlowMlPerSec: maximumFlow,
      observedMeanDopplerGradientMmHg: observedMean,
      observedPeakDopplerGradientMmHg: observedPeak,
    }),
    currentDuration: Object.freeze({
      uniformFullOpenVelocityMPerSec: uniformVelocity,
      meanAndPeakGradientFloorMmHg: floorGradient,
      fullOpenActualWaveformMeanGradientMmHg:
        fullOpenWaveformMeanGradient,
      flowNonuniformityFactor,
      timeVaryingOpeningPenaltyFactor: openingPenaltyFactor,
      observedToKinematicFloorFactor: observedMean / floorGradient,
      multiplicativeReconstructionResidualMmHg:
        observedMean - reconstructedMean,
      peakToMeanForwardFlowRatio: maximumFlow / meanFlow,
      cauchySchwarzFloorSatisfied:
        fullOpenWaveformMeanGradient + tolerance >= floorGradient,
      timeVaryingAreaFloorSatisfied:
        observedMean + tolerance >= fullOpenWaveformMeanGradient,
      observedPeakNoLowerThanObservedMean:
        observedPeak + tolerance >= observedMean,
    }),
    healthyLvetContext: Object.freeze({
      measurementContext: reference.measurementContext,
      sampleCount: reference.sampleCount,
      doi: reference.doi,
      modelForwardFlowDurationGapToLower95PiSec:
        reference.predictionInterval95Sec[0] - forwardFlowTimeSec,
      projections,
    }),
    claim: MAIN_WIRE_AORTIC_OUTFLOW_KINEMATIC_FLOOR_CLAIM_V1,
  });
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function mean(values: readonly number[]): number {
  if (values.length === 0) throw new Error("mean requires values");
  return sum(values) / values.length;
}

function maximum(values: readonly number[]): number {
  let result = Number.NEGATIVE_INFINITY;
  for (const value of values) result = Math.max(result, value);
  if (!Number.isFinite(result)) throw new Error("maximum requires values");
  return result;
}
