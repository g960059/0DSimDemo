import type {
  MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type {
  MainWireIntegratedModelCompletedBeatMetricsV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_HEALTHY_REFERENCE_CONTEXT_V3,
  type MainWireIntegratedModelHealthyReferenceMetricIdV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelHealthyReferenceContextV3";

export const MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID =
  "main-wire-integrated-model-baseline-validation-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_POLICY_V1 =
  Object.freeze({
    pressureMorphology: Object.freeze({
      requiredForwardEpisodeCount: 1,
      requiredSignificantPeakCount: 1,
      maximumTotalVariationRatio: 2.2,
      minimumCentralRangeFraction: 0.08,
      maximumCentralRangeFraction: 0.35,
      minimumPeakPhase01: 0.2,
      maximumPeakPhase01: 0.8,
    }),
    aorticValveGradientMmHg: Object.freeze({
      mean: Object.freeze({ minimum: 0, maximum: 5 }),
      peak: Object.freeze({ minimum: 0, maximum: 10 }),
    }),
    aorticEjectionTimeSec: Object.freeze({ minimum: 0.24, maximum: 0.34 }),
    lvPressureRateMmHgPerSec: Object.freeze({
      maximum: Object.freeze({ minimum: 1_200, maximum: 2_500 }),
      minimum: Object.freeze({ minimum: -1_400, maximum: -700 }),
    }),
    mitralPeakEToA: Object.freeze({ minimum: 0.8, maximum: 2 }),
    ventricularTimingSec: Object.freeze({
      isovolumicContraction: Object.freeze({ minimum: 0.02, maximum: 0.07 }),
      isovolumicRelaxation: Object.freeze({ minimum: 0.059, maximum: 0.134 }),
      teiIndex: Object.freeze({ minimum: 0.29, maximum: 0.65 }),
    }),
    hemodynamicPressureMmHg: Object.freeze({
      // Broad resting-adult construction ranges. These are model-mint gates,
      // not diagnostic blood-pressure categories or patient-fit targets.
      aortic: Object.freeze({
        maximum: Object.freeze({ minimum: 90, maximum: 140 }),
        minimum: Object.freeze({ minimum: 60, maximum: 90 }),
      }),
      pulmonaryArtery: Object.freeze({
        maximum: Object.freeze({ minimum: 15, maximum: 35 }),
        minimum: Object.freeze({ minimum: 4, maximum: 15 }),
      }),
      centralVenousMean: Object.freeze({ minimum: 1, maximum: 8 }),
      pcwpSurrogateMean: Object.freeze({ minimum: 4, maximum: 13 }),
    }),
    indexedCardiacSizeAndFunction: Object.freeze({
      bodySurfaceAreaM2:
        MAIN_WIRE_INTEGRATED_MODEL_HEALTHY_REFERENCE_CONTEXT_V3
          .referenceSubject.bodySurfaceAreaM2,
      leftVentricularEndDiastolicVolumeIndexMlPerM2:
        healthyReferenceRangeV1("hemodynamics.lv.edv_index_ml_per_m2"),
      leftVentricularEndSystolicVolumeIndexMlPerM2:
        healthyReferenceRangeV1("hemodynamics.lv.esv_index_ml_per_m2"),
      leftVentricularEjectionFraction01:
        healthyReferenceRangeV1("hemodynamics.lv.ejection_fraction_01"),
      rightVentricularEndDiastolicVolumeIndexMlPerM2:
        healthyReferenceRangeV1("hemodynamics.rv.edv_index_ml_per_m2"),
      rightVentricularEndSystolicVolumeIndexMlPerM2:
        healthyReferenceRangeV1("hemodynamics.rv.esv_index_ml_per_m2"),
      rightVentricularEjectionFraction01:
        healthyReferenceRangeV1("hemodynamics.rv.ejection_fraction_01"),
      cardiacIndexLPerMinPerM2:
        healthyReferenceRangeV1(
          "hemodynamics.aortic.cardiac_index_l_per_min_per_m2",
        ),
      strokeVolumeIndexMlPerM2:
        healthyReferenceRangeV1(
          "hemodynamics.aortic.stroke_volume_index_ml_per_m2",
        ),
    }),
  });

export type MainWireIntegratedModelBaselineValidationCheckIdV1 =
  | "settlement.period1"
  | "waveform.LVP.single-peak-no-ringing"
  | "waveform.LVP.rounded-not-plateau"
  | "waveform.RVP.single-peak-no-ringing"
  | "waveform.RVP.rounded-not-plateau"
  | "aortic-valve.mean-gradient"
  | "aortic-valve.peak-gradient"
  | "aortic-valve.ejection-time"
  | "left-ventricle.maximum-dpdt"
  | "left-ventricle.minimum-dpdt"
  | "mitral-flow.peak-e-to-a"
  | "timing.ict"
  | "timing.irt"
  | "timing.tei-index"
  | "aortic-pressure.maximum"
  | "aortic-pressure.minimum"
  | "pulmonary-artery-pressure.maximum"
  | "pulmonary-artery-pressure.minimum"
  | "central-venous-pressure.mean"
  | "pcwp-surrogate.mean"
  | "left-ventricle.edv-index"
  | "left-ventricle.esv-index"
  | "left-ventricle.ejection-fraction"
  | "right-ventricle.edv-index"
  | "right-ventricle.esv-index"
  | "right-ventricle.ejection-fraction"
  | "systemic-forward-flow.cardiac-index"
  | "systemic-forward-flow.stroke-volume-index";

export type MainWireIntegratedModelBaselineValidationCheckV1 = Readonly<{
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1;
  status: "passed" | "failed";
  actual: number;
  minimum: number;
  maximum: number;
  unit: string;
}>;

export type MainWireIntegratedModelBaselineValidationMeasurementsV1 =
  Readonly<{
    LVP: PressureMorphologyV1;
    RVP: PressureMorphologyV1;
    aorticValve: Readonly<{
      ejectionTimeSec: number;
      meanGradientMmHg: number;
      peakGradientMmHg: number;
    }>;
    leftVentricle: Readonly<{
      maximumDpDtMmHgPerSec: number;
      minimumDpDtMmHgPerSec: number;
    }>;
    mitralFlow: Readonly<{
      peakEMlPerSec: number;
      peakAMlPerSec: number;
      peakEToA: number;
    }>;
    timing: Readonly<{
      ictSec: number;
      irtSec: number;
      teiIndex: number;
    }>;
    hemodynamicPressure: MainWireIntegratedModelBaselineHemodynamicPressureV1;
    cardiacSizeAndFunction: MainWireIntegratedModelBaselineCardiacSizeAndFunctionV1;
  }>;

export type MainWireIntegratedModelBaselineHemodynamicPressureV1 = Readonly<{
  aortic: Readonly<{ maximumMmHg: number; minimumMmHg: number }>;
  pulmonaryArtery: Readonly<{ maximumMmHg: number; minimumMmHg: number }>;
  centralVenousMeanMmHg: number;
  /** Mean LA pressure; the 0D model does not simulate a wedged catheter. */
  pcwpSurrogateMeanMmHg: number;
}>;

export type MainWireIntegratedModelBaselineCardiacSizeAndFunctionV1 =
  Readonly<{
    bodySurfaceAreaM2: number;
    leftVentricle: Readonly<{
      endDiastolicVolumeMl: number;
      endSystolicVolumeMl: number;
      endDiastolicVolumeIndexMlPerM2: number;
      endSystolicVolumeIndexMlPerM2: number;
      ejectionFraction01: number;
    }>;
    rightVentricle: Readonly<{
      endDiastolicVolumeMl: number;
      endSystolicVolumeMl: number;
      endDiastolicVolumeIndexMlPerM2: number;
      endSystolicVolumeIndexMlPerM2: number;
      ejectionFraction01: number;
    }>;
    systemicForwardFlow: Readonly<{
      strokeVolumeMl: number;
      strokeVolumeIndexMlPerM2: number;
      cardiacOutputLPerMin: number;
      cardiacIndexLPerMinPerM2: number;
    }>;
  }>;

type Sample = MainWireIntegratedModelPeriodicTerminalTraceSampleV3;
type ValveId = keyof Sample["valveFlowMlPerSec"];
type VentricularPressureId = "LV" | "RV";
export type MainWireIntegratedModelBaselineVentricularSideV1 =
  | "left"
  | "right";

export type MainWireIntegratedModelBaselineVentricularTimingAndInletFlowV1 =
  Readonly<{
    ejectionTimeSec: number;
    inletFlow: Readonly<{
      peakEMlPerSec: number;
      peakAMlPerSec: number;
      peakEToA: number;
    }>;
    timing: Readonly<{
      ictSec: number;
      irtSec: number;
      teiIndex: number;
    }>;
  }>;

type ForwardEpisodeV1 = Readonly<{
  start: number;
  end: number;
  count: number;
}>;

export type MainWireIntegratedModelPressureMorphologyV1 = Readonly<{
  forwardEpisodeCount: number;
  significantPeakCount: number;
  totalVariationRatio: number;
  centralRangeFraction: number;
  peakPhase01: number;
}>;

type PressureMorphologyV1 = MainWireIntegratedModelPressureMorphologyV1;

export function measureMainWireIntegratedModelBaselineValidationV1(
  samples: readonly Sample[],
  leftTimingAndInletOverride?: MainWireIntegratedModelBaselineVentricularTimingAndInletFlowV1,
): MainWireIntegratedModelBaselineValidationMeasurementsV1 {
  if (samples.length < 12) {
    throw new Error("baseline validation requires a complete accepted-step cycle");
  }
  const cycleLengthSec = samples.reduce(
    (sum, sample) => sum + requirePositiveFiniteV1(
      sample.acceptedDtSec,
      "acceptedDtSec",
    ),
    0,
  );
  const aorticEpisode = primaryForwardEpisodeV1(samples, "AoV");
  const pulmonaryEpisode = primaryForwardEpisodeV1(samples, "PV");
  const aorticSamples = cyclicSliceV1(
    samples,
    aorticEpisode.start,
    aorticEpisode.end,
  );
  const gradients = aorticSamples.map((sample) =>
    sample.absolutePressureMmHg.LV - sample.absolutePressureMmHg.Ao);
  const pressureRate = pressureRateExtremaV1(samples, "LV");
  const leftTimingAndInletFlow = leftTimingAndInletOverride === undefined
    ? measureMainWireIntegratedModelBaselineVentricularTimingAndInletFlowV1(
      samples,
      "left",
    )
    : validateAndOwnMainWireIntegratedModelBaselineTimingAndInletObservationV1(leftTimingAndInletOverride);
  const cardiacSizeAndFunction = cardiacSizeAndFunctionFromTraceV1(
    samples,
    cycleLengthSec,
  );
  const hemodynamicPressure = hemodynamicPressureFromTraceV1(samples);

  return Object.freeze({
    LVP: pressureMorphologyV1(samples, aorticEpisode, "LV"),
    RVP: pressureMorphologyV1(samples, pulmonaryEpisode, "RV"),
    aorticValve: Object.freeze({
      ejectionTimeSec: leftTimingAndInletOverride === undefined ? aorticSamples.reduce(
        (sum, sample) => sum + sample.acceptedDtSec,
        0,
      ) : leftTimingAndInletFlow.ejectionTimeSec,
      meanGradientMmHg: timeWeightedMeanV1(aorticSamples, gradients),
      peakGradientMmHg: Math.max(...gradients),
    }),
    leftVentricle: Object.freeze({
      maximumDpDtMmHgPerSec: pressureRate.maximum,
      minimumDpDtMmHgPerSec: pressureRate.minimum,
    }),
    mitralFlow: Object.freeze({
      ...leftTimingAndInletFlow.inletFlow,
    }),
    timing: Object.freeze({
      ...leftTimingAndInletFlow.timing,
    }),
    hemodynamicPressure,
    cardiacSizeAndFunction,
  });
}

/** Validate an explicit analysis observation without falling back to a different
 * extractor. This output is derived evidence, never an exact-state parameter. */
export function validateAndOwnMainWireIntegratedModelBaselineTimingAndInletObservationV1(
  input: MainWireIntegratedModelBaselineVentricularTimingAndInletFlowV1,
): MainWireIntegratedModelBaselineVentricularTimingAndInletFlowV1 {
  if (input === null || typeof input !== "object" || input.inletFlow == null || input.timing == null) {
    throw new Error("baseline timing/inlet override is unavailable");
  }
  const { ejectionTimeSec, inletFlow, timing } = input;
  const close = (left: number, right: number) => Math.abs(left - right)
    <= 128 * Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right));
  if (![ejectionTimeSec, inletFlow.peakEMlPerSec, inletFlow.peakAMlPerSec, inletFlow.peakEToA,
    timing.ictSec, timing.irtSec, timing.teiIndex].every(Number.isFinite)
    || !(ejectionTimeSec > 0) || !(inletFlow.peakEMlPerSec > 0) || !(inletFlow.peakAMlPerSec > 0)
    || timing.ictSec < 0 || timing.irtSec < 0
    || !close(inletFlow.peakEToA, inletFlow.peakEMlPerSec / inletFlow.peakAMlPerSec)
    || !close(timing.teiIndex, (timing.ictSec + timing.irtSec) / ejectionTimeSec)) {
    throw new Error("baseline timing/inlet override must have finite coherent phase durations and positive peaks");
  }
  return Object.freeze({ ejectionTimeSec,
    inletFlow: Object.freeze({ peakEMlPerSec: inletFlow.peakEMlPerSec,
      peakAMlPerSec: inletFlow.peakAMlPerSec, peakEToA: inletFlow.peakEToA }),
    timing: Object.freeze({ ictSec: timing.ictSec, irtSec: timing.irtSec, teiIndex: timing.teiIndex }),
  });
}

/**
 * Analysis-owned valve-event timing and biphasic inflow measurement shared by
 * left- and right-heart mint qualification. It uses the same accepted-step
 * threshold and cyclic event convention on both sides.
 */
export function measureMainWireIntegratedModelBaselineVentricularTimingAndInletFlowV1(
  samples: readonly Sample[],
  side: MainWireIntegratedModelBaselineVentricularSideV1,
): MainWireIntegratedModelBaselineVentricularTimingAndInletFlowV1 {
  if (samples.length < 12) {
    throw new Error("baseline timing requires a complete accepted-step cycle");
  }
  const cycleLengthSec = samples.reduce(
    (sum, sample) => sum + requirePositiveFiniteV1(
      sample.acceptedDtSec,
      "acceptedDtSec",
    ),
    0,
  );
  const outletValveId = side === "left" ? "AoV" : "PV";
  const inletValveId = side === "left" ? "MV" : "TV";
  const outletEpisode = primaryForwardEpisodeV1(samples, outletValveId);
  const timing = ventricularTimingV1(
    samples,
    outletEpisode,
    cycleLengthSec,
    inletValveId,
  );
  const inlet = inletPeakEToAV1(samples, timing, inletValveId);
  return Object.freeze({
    ejectionTimeSec: timing.ejectionTimeSec,
    inletFlow: Object.freeze({
      peakEMlPerSec: inlet.peakE,
      peakAMlPerSec: inlet.peakA,
      peakEToA: inlet.peakE / inlet.peakA,
    }),
    timing: Object.freeze({
      ictSec: timing.ictSec,
      irtSec: timing.irtSec,
      teiIndex:
        (timing.ictSec + timing.irtSec) / timing.ejectionTimeSec,
    }),
  });
}

/**
 * Exact completed-beat pressure projection used by release qualification.
 * CVP is the mean RA node pressure. PCWP is represented only by mean LA
 * pressure and therefore remains explicitly labelled as a surrogate.
 */
export function measureMainWireIntegratedModelExactBaselineHemodynamicPressureV1(
  completedBeat: MainWireIntegratedModelCompletedBeatMetricsV3,
): MainWireIntegratedModelBaselineHemodynamicPressureV1 {
  const pressure = completedBeat.pressureSummaries;
  return Object.freeze({
    aortic: Object.freeze({
      maximumMmHg: pressure.Ao.maximumMmHg,
      minimumMmHg: pressure.Ao.minimumMmHg,
    }),
    pulmonaryArtery: Object.freeze({
      maximumMmHg: pressure.PA.maximumMmHg,
      minimumMmHg: pressure.PA.minimumMmHg,
    }),
    centralVenousMeanMmHg: pressure.RA.timeWeightedMeanMmHg,
    pcwpSurrogateMeanMmHg: pressure.LA.timeWeightedMeanMmHg,
  });
}

/**
 * Exact release-gate projection. EDV and ESV use valve-closure landmarks,
 * while SVI and CI use forward native aortic flow. This remains an
 * analysis-owned derivation and is not reserved in exact presentation frames.
 */
export function measureMainWireIntegratedModelExactBaselineCardiacSizeAndFunctionV1(
  completedBeat: MainWireIntegratedModelCompletedBeatMetricsV3,
): MainWireIntegratedModelBaselineCardiacSizeAndFunctionV1 {
  const left = completedBeat.leftVentricularValveEventMetrics;
  const right = completedBeat.rightVentricularValveEventMetrics;
  if (
    left.endDiastolic === null
    || left.endSystolic === null
    || left.eventDefinedEjectionFraction01 === null
    || right.endDiastolic === null
    || right.endSystolic === null
    || right.eventDefinedEjectionFraction01 === null
  ) {
    throw new Error(
      "baseline indexed size/function requires complete ventricular valve landmarks",
    );
  }
  return cardiacSizeAndFunctionV1({
    leftEndDiastolicVolumeMl: left.endDiastolic.volumeMl,
    leftEndSystolicVolumeMl: left.endSystolic.volumeMl,
    leftEjectionFraction01: left.eventDefinedEjectionFraction01,
    rightEndDiastolicVolumeMl: right.endDiastolic.volumeMl,
    rightEndSystolicVolumeMl: right.endSystolic.volumeMl,
    rightEjectionFraction01: right.eventDefinedEjectionFraction01,
    systemicForwardStrokeVolumeMl:
      completedBeat.valveFlowVolumes.AoV.forwardVolumeMl,
    systemicForwardCardiacOutputLPerMin:
      completedBeat.nativeLeftCardiacOutputLPerMin,
  });
}

export function buildMainWireIntegratedModelBaselineValidationChecksV1(
  measurements: MainWireIntegratedModelBaselineValidationMeasurementsV1,
  period1Established: boolean,
): readonly MainWireIntegratedModelBaselineValidationCheckV1[] {
  const policy = MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_POLICY_V1;
  const checks = [
    exactCheckV1("settlement.period1", period1Established ? 1 : 0, 1, "bool"),
    boundedCheckV1(
      "waveform.LVP.single-peak-no-ringing",
      measurements.LVP.significantPeakCount ===
          policy.pressureMorphology.requiredSignificantPeakCount &&
        measurements.LVP.forwardEpisodeCount ===
          policy.pressureMorphology.requiredForwardEpisodeCount &&
        measurements.LVP.totalVariationRatio <=
          policy.pressureMorphology.maximumTotalVariationRatio
        ? 1
        : 0,
      1,
      1,
      "bool",
    ),
    morphologyRoundnessCheckV1("waveform.LVP.rounded-not-plateau", measurements.LVP),
    boundedCheckV1(
      "waveform.RVP.single-peak-no-ringing",
      measurements.RVP.significantPeakCount ===
          policy.pressureMorphology.requiredSignificantPeakCount &&
        measurements.RVP.forwardEpisodeCount ===
          policy.pressureMorphology.requiredForwardEpisodeCount &&
        measurements.RVP.totalVariationRatio <=
          policy.pressureMorphology.maximumTotalVariationRatio
        ? 1
        : 0,
      1,
      1,
      "bool",
    ),
    morphologyRoundnessCheckV1("waveform.RVP.rounded-not-plateau", measurements.RVP),
    rangeCheckV1(
      "aortic-valve.mean-gradient",
      measurements.aorticValve.meanGradientMmHg,
      policy.aorticValveGradientMmHg.mean,
      "mmHg",
    ),
    rangeCheckV1(
      "aortic-valve.peak-gradient",
      measurements.aorticValve.peakGradientMmHg,
      policy.aorticValveGradientMmHg.peak,
      "mmHg",
    ),
    rangeCheckV1(
      "aortic-valve.ejection-time",
      measurements.aorticValve.ejectionTimeSec,
      policy.aorticEjectionTimeSec,
      "s",
    ),
    rangeCheckV1(
      "left-ventricle.maximum-dpdt",
      measurements.leftVentricle.maximumDpDtMmHgPerSec,
      policy.lvPressureRateMmHgPerSec.maximum,
      "mmHg/s",
    ),
    rangeCheckV1(
      "left-ventricle.minimum-dpdt",
      measurements.leftVentricle.minimumDpDtMmHgPerSec,
      policy.lvPressureRateMmHgPerSec.minimum,
      "mmHg/s",
    ),
    rangeCheckV1(
      "mitral-flow.peak-e-to-a",
      measurements.mitralFlow.peakEToA,
      policy.mitralPeakEToA,
      "ratio",
    ),
    rangeCheckV1(
      "timing.ict",
      measurements.timing.ictSec,
      policy.ventricularTimingSec.isovolumicContraction,
      "s",
    ),
    rangeCheckV1(
      "timing.irt",
      measurements.timing.irtSec,
      policy.ventricularTimingSec.isovolumicRelaxation,
      "s",
    ),
    rangeCheckV1(
      "timing.tei-index",
      measurements.timing.teiIndex,
      policy.ventricularTimingSec.teiIndex,
      "ratio",
    ),
    rangeCheckV1(
      "aortic-pressure.maximum",
      measurements.hemodynamicPressure.aortic.maximumMmHg,
      policy.hemodynamicPressureMmHg.aortic.maximum,
      "mmHg",
    ),
    rangeCheckV1(
      "aortic-pressure.minimum",
      measurements.hemodynamicPressure.aortic.minimumMmHg,
      policy.hemodynamicPressureMmHg.aortic.minimum,
      "mmHg",
    ),
    rangeCheckV1(
      "pulmonary-artery-pressure.maximum",
      measurements.hemodynamicPressure.pulmonaryArtery.maximumMmHg,
      policy.hemodynamicPressureMmHg.pulmonaryArtery.maximum,
      "mmHg",
    ),
    rangeCheckV1(
      "pulmonary-artery-pressure.minimum",
      measurements.hemodynamicPressure.pulmonaryArtery.minimumMmHg,
      policy.hemodynamicPressureMmHg.pulmonaryArtery.minimum,
      "mmHg",
    ),
    rangeCheckV1(
      "central-venous-pressure.mean",
      measurements.hemodynamicPressure.centralVenousMeanMmHg,
      policy.hemodynamicPressureMmHg.centralVenousMean,
      "mmHg",
    ),
    rangeCheckV1(
      "pcwp-surrogate.mean",
      measurements.hemodynamicPressure.pcwpSurrogateMeanMmHg,
      policy.hemodynamicPressureMmHg.pcwpSurrogateMean,
      "mmHg",
    ),
    rangeCheckV1(
      "left-ventricle.edv-index",
      measurements.cardiacSizeAndFunction.leftVentricle
        .endDiastolicVolumeIndexMlPerM2,
      policy.indexedCardiacSizeAndFunction
        .leftVentricularEndDiastolicVolumeIndexMlPerM2,
      "mL/m2",
    ),
    rangeCheckV1(
      "left-ventricle.esv-index",
      measurements.cardiacSizeAndFunction.leftVentricle
        .endSystolicVolumeIndexMlPerM2,
      policy.indexedCardiacSizeAndFunction
        .leftVentricularEndSystolicVolumeIndexMlPerM2,
      "mL/m2",
    ),
    rangeCheckV1(
      "left-ventricle.ejection-fraction",
      measurements.cardiacSizeAndFunction.leftVentricle.ejectionFraction01,
      policy.indexedCardiacSizeAndFunction.leftVentricularEjectionFraction01,
      "ratio",
    ),
    rangeCheckV1(
      "right-ventricle.edv-index",
      measurements.cardiacSizeAndFunction.rightVentricle
        .endDiastolicVolumeIndexMlPerM2,
      policy.indexedCardiacSizeAndFunction
        .rightVentricularEndDiastolicVolumeIndexMlPerM2,
      "mL/m2",
    ),
    rangeCheckV1(
      "right-ventricle.esv-index",
      measurements.cardiacSizeAndFunction.rightVentricle
        .endSystolicVolumeIndexMlPerM2,
      policy.indexedCardiacSizeAndFunction
        .rightVentricularEndSystolicVolumeIndexMlPerM2,
      "mL/m2",
    ),
    rangeCheckV1(
      "right-ventricle.ejection-fraction",
      measurements.cardiacSizeAndFunction.rightVentricle.ejectionFraction01,
      policy.indexedCardiacSizeAndFunction.rightVentricularEjectionFraction01,
      "ratio",
    ),
    rangeCheckV1(
      "systemic-forward-flow.cardiac-index",
      measurements.cardiacSizeAndFunction.systemicForwardFlow
        .cardiacIndexLPerMinPerM2,
      policy.indexedCardiacSizeAndFunction.cardiacIndexLPerMinPerM2,
      "L/min/m2",
    ),
    rangeCheckV1(
      "systemic-forward-flow.stroke-volume-index",
      measurements.cardiacSizeAndFunction.systemicForwardFlow
        .strokeVolumeIndexMlPerM2,
      policy.indexedCardiacSizeAndFunction.strokeVolumeIndexMlPerM2,
      "mL/m2",
    ),
  ] satisfies MainWireIntegratedModelBaselineValidationCheckV1[];
  return Object.freeze(checks);
}

function hemodynamicPressureFromTraceV1(
  samples: readonly Sample[],
): MainWireIntegratedModelBaselineHemodynamicPressureV1 {
  const aortic = samples.map((sample) => sample.absolutePressureMmHg.Ao);
  const pulmonaryArtery = samples.map(
    (sample) => sample.absolutePressureMmHg.PA,
  );
  return Object.freeze({
    aortic: Object.freeze({
      maximumMmHg: Math.max(...aortic),
      minimumMmHg: Math.min(...aortic),
    }),
    pulmonaryArtery: Object.freeze({
      maximumMmHg: Math.max(...pulmonaryArtery),
      minimumMmHg: Math.min(...pulmonaryArtery),
    }),
    centralVenousMeanMmHg: timeWeightedMeanV1(
      samples,
      samples.map((sample) => sample.absolutePressureMmHg.RA),
    ),
    pcwpSurrogateMeanMmHg: timeWeightedMeanV1(
      samples,
      samples.map((sample) => sample.absolutePressureMmHg.LA),
    ),
  });
}

function cardiacSizeAndFunctionFromTraceV1(
  samples: readonly Sample[],
  cycleLengthSec: number,
): MainWireIntegratedModelBaselineCardiacSizeAndFunctionV1 {
  const leftVolumes = samples.map((sample) => sample.chamberVolumeMl.LV);
  const rightVolumes = samples.map((sample) => sample.chamberVolumeMl.RV);
  const leftEndDiastolicVolumeMl = Math.max(...leftVolumes);
  const leftEndSystolicVolumeMl = Math.min(...leftVolumes);
  const rightEndDiastolicVolumeMl = Math.max(...rightVolumes);
  const rightEndSystolicVolumeMl = Math.min(...rightVolumes);
  const systemicForwardStrokeVolumeMl = samples.reduce(
    (sum, sample) =>
      sum + Math.max(0, sample.valveFlowMlPerSec.AoV) * sample.acceptedDtSec,
    0,
  );
  return cardiacSizeAndFunctionV1({
    leftEndDiastolicVolumeMl,
    leftEndSystolicVolumeMl,
    leftEjectionFraction01:
      (leftEndDiastolicVolumeMl - leftEndSystolicVolumeMl)
      / leftEndDiastolicVolumeMl,
    rightEndDiastolicVolumeMl,
    rightEndSystolicVolumeMl,
    rightEjectionFraction01:
      (rightEndDiastolicVolumeMl - rightEndSystolicVolumeMl)
      / rightEndDiastolicVolumeMl,
    systemicForwardStrokeVolumeMl,
    systemicForwardCardiacOutputLPerMin:
      systemicForwardStrokeVolumeMl * 60 / cycleLengthSec / 1_000,
  });
}

function cardiacSizeAndFunctionV1(input: Readonly<{
  leftEndDiastolicVolumeMl: number;
  leftEndSystolicVolumeMl: number;
  leftEjectionFraction01: number;
  rightEndDiastolicVolumeMl: number;
  rightEndSystolicVolumeMl: number;
  rightEjectionFraction01: number;
  systemicForwardStrokeVolumeMl: number;
  systemicForwardCardiacOutputLPerMin: number;
}>): MainWireIntegratedModelBaselineCardiacSizeAndFunctionV1 {
  const bodySurfaceAreaM2 =
    MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_POLICY_V1
      .indexedCardiacSizeAndFunction.bodySurfaceAreaM2;
  return Object.freeze({
    bodySurfaceAreaM2,
    leftVentricle: Object.freeze({
      endDiastolicVolumeMl: input.leftEndDiastolicVolumeMl,
      endSystolicVolumeMl: input.leftEndSystolicVolumeMl,
      endDiastolicVolumeIndexMlPerM2:
        input.leftEndDiastolicVolumeMl / bodySurfaceAreaM2,
      endSystolicVolumeIndexMlPerM2:
        input.leftEndSystolicVolumeMl / bodySurfaceAreaM2,
      ejectionFraction01: input.leftEjectionFraction01,
    }),
    rightVentricle: Object.freeze({
      endDiastolicVolumeMl: input.rightEndDiastolicVolumeMl,
      endSystolicVolumeMl: input.rightEndSystolicVolumeMl,
      endDiastolicVolumeIndexMlPerM2:
        input.rightEndDiastolicVolumeMl / bodySurfaceAreaM2,
      endSystolicVolumeIndexMlPerM2:
        input.rightEndSystolicVolumeMl / bodySurfaceAreaM2,
      ejectionFraction01: input.rightEjectionFraction01,
    }),
    systemicForwardFlow: Object.freeze({
      strokeVolumeMl: input.systemicForwardStrokeVolumeMl,
      strokeVolumeIndexMlPerM2:
        input.systemicForwardStrokeVolumeMl / bodySurfaceAreaM2,
      cardiacOutputLPerMin: input.systemicForwardCardiacOutputLPerMin,
      cardiacIndexLPerMinPerM2:
        input.systemicForwardCardiacOutputLPerMin / bodySurfaceAreaM2,
    }),
  });
}

function healthyReferenceRangeV1(
  metricId: MainWireIntegratedModelHealthyReferenceMetricIdV3,
): Readonly<{ minimum: number; maximum: number }> {
  const gate = MAIN_WIRE_INTEGRATED_MODEL_HEALTHY_REFERENCE_CONTEXT_V3.gates
    .find((candidate) => candidate.metricId === metricId);
  if (gate === undefined) {
    throw new Error(`missing healthy reference gate for ${metricId}`);
  }
  return Object.freeze({
    minimum: gate.lowerInclusive,
    maximum: gate.upperInclusive,
  });
}

export function assertMainWireIntegratedModelBaselineValidationPassedV1(
  checks: readonly MainWireIntegratedModelBaselineValidationCheckV1[],
  measurements?: MainWireIntegratedModelBaselineValidationMeasurementsV1,
): void {
  const failed = checks.filter(({ status }) => status !== "passed");
  if (failed.length > 0) {
    throw new Error(
      "baseline validation gate rejected: " + failed.map((check) =>
        `${check.checkId}=${check.actual} outside [${check.minimum}, ${check.maximum}]`,
      ).join("; ")
      + (measurements === undefined
        ? ""
        : `; pressure morphology=${JSON.stringify({
            LVP: measurements.LVP,
            RVP: measurements.RVP,
          })}`),
    );
  }
}

function pressureMorphologyV1(
  samples: readonly Sample[],
  episode: ForwardEpisodeV1,
  pressureId: VentricularPressureId,
): PressureMorphologyV1 {
  const values = cyclicSliceV1(samples, episode.start, episode.end).map(
    (sample) => sample.absolutePressureMmHg[pressureId],
  );
  const peakIndex = values.indexOf(Math.max(...values));
  const central = values.slice(
    Math.floor(0.25 * values.length),
    Math.ceil(0.75 * values.length),
  );
  const range = Math.max(...values) - Math.min(...values);
  return Object.freeze({
    forwardEpisodeCount: episode.count,
    significantPeakCount:
      countMainWireIntegratedModelSignificantPressurePeaksV1(values),
    totalVariationRatio: totalVariationRatioV1(values),
    centralRangeFraction: range > 0
      ? (Math.max(...central) - Math.min(...central)) / range
      : 0,
    peakPhase01: peakIndex / Math.max(1, values.length - 1),
  });
}

function primaryForwardEpisodeV1(
  samples: readonly Sample[],
  valveId: ValveId,
): ForwardEpisodeV1 {
  const flows = samples.map((sample) => sample.valveFlowMlPerSec[valveId]);
  const threshold = Math.max(1, 0.01 * Math.max(...flows));
  const open = flows.map((flow) => flow > threshold);
  const runs: Array<{ start: number; end: number }> = [];
  let start: number | null = null;
  for (let index = 0; index < open.length; index += 1) {
    if (open[index] && start === null) start = index;
    if (!open[index] && start !== null) {
      runs.push({ start, end: index - 1 });
      start = null;
    }
  }
  if (start !== null) runs.push({ start, end: open.length - 1 });
  if (
    runs.length > 1 && runs[0]!.start === 0 &&
    runs.at(-1)!.end === open.length - 1
  ) {
    const first = runs.shift()!;
    const last = runs.pop()!;
    runs.unshift({ start: last.start, end: first.end + open.length });
  }
  if (runs.length === 0) {
    throw new Error(`baseline validation found no ${valveId} forward episode`);
  }
  const primary = [...runs].sort((left, right) =>
    episodeForwardVolumeV1(flows, right) - episodeForwardVolumeV1(flows, left),
  )[0]!;
  return Object.freeze({
    start: primary.start,
    end: primary.end,
    count: runs.length,
  });
}

function episodeForwardVolumeV1(
  flows: readonly number[],
  run: Readonly<{ start: number; end: number }>,
): number {
  let total = 0;
  for (let index = run.start; index <= run.end; index += 1) {
    total += Math.max(0, flows[index % flows.length]!);
  }
  return total;
}

function ventricularTimingV1(
  samples: readonly Sample[],
  outlet: ForwardEpisodeV1,
  cycleLengthSec: number,
  inletValveId: "MV" | "TV",
) {
  const inletPeak = Math.max(...samples.map((sample) =>
    sample.valveFlowMlPerSec[inletValveId]));
  const inletThreshold = Math.max(1, 0.01 * inletPeak);
  const inletOpen = samples.map((sample) =>
    sample.valveFlowMlPerSec[inletValveId] > inletThreshold);
  const outletStart = outlet.start % samples.length;
  const outletEnd = outlet.end % samples.length;
  const inletClosure = previousTransitionV1(
    inletOpen,
    outletStart,
    true,
    false,
  );
  const outletClosure = (outletEnd + 1) % samples.length;
  const inletOpening = nextTransitionV1(
    inletOpen,
    outletClosure,
    false,
    true,
  );
  return Object.freeze({
    inletClosure,
    inletOpening,
    ictSec: cyclicTimeDeltaV1(samples, inletClosure, outletStart, cycleLengthSec),
    irtSec: cyclicTimeDeltaV1(samples, outletClosure, inletOpening, cycleLengthSec),
    ejectionTimeSec: cyclicSliceV1(samples, outlet.start, outlet.end).reduce(
      (sum, sample) => sum + sample.acceptedDtSec,
      0,
    ),
  });
}

function inletPeakEToAV1(
  samples: readonly Sample[],
  timing: Readonly<{ inletClosure: number; inletOpening: number }>,
  inletValveId: "MV" | "TV",
) {
  const fillingIndices = cyclicHalfOpenIndicesV1(
    samples.length,
    timing.inletOpening,
    timing.inletClosure,
  );
  const filling = fillingIndices.map((index) =>
    samples[index]!.valveFlowMlPerSec[inletValveId]);
  const candidates = filling.flatMap((flow, index) =>
    index > 0 && index < filling.length - 1
      && flow > filling[index - 1]!
      && flow >= filling[index + 1]!
      && flow > 0
      ? [Object.freeze({ index, flow })]
      : []);
  const minimumSeparation = Math.max(2, Math.floor(0.15 * filling.length));
  let best: Readonly<{
    first: Readonly<{ index: number; flow: number }>;
    second: Readonly<{ index: number; flow: number }>;
    score: number;
  }> | null = null;
  for (let first = 0; first < candidates.length; first += 1) {
    for (let second = first + 1; second < candidates.length; second += 1) {
      const left = candidates[first]!;
      const right = candidates[second]!;
      if (right.index - left.index < minimumSeparation) continue;
      const score = left.flow + right.flow;
      if (best === null || score > best.score) {
        best = Object.freeze({ first: left, second: right, score });
      }
    }
  }
  const peakE = best?.first.flow ?? 0;
  const peakA = best?.second.flow ?? 0;
  if (!(peakE > 0) || !(peakA > 0)) {
    throw new Error(
      `baseline validation could not resolve two separated positive ${inletValveId} E/A peaks`,
    );
  }
  return Object.freeze({ peakE, peakA });
}

function cyclicTimeDeltaV1(
  samples: readonly Sample[],
  from: number,
  to: number,
  cycleLengthSec: number,
): number {
  const direct = samples[to]!.acceptedTimeSec - samples[from]!.acceptedTimeSec;
  return direct >= 0 ? direct : cycleLengthSec + direct;
}

function cyclicHalfOpenIndicesV1(
  length: number,
  start: number,
  end: number,
): readonly number[] {
  const indices: number[] = [];
  for (let index = start; index !== end; index = (index + 1) % length) {
    indices.push(index);
    if (indices.length > length) {
      throw new Error("baseline validation cyclic window did not terminate");
    }
  }
  return indices;
}

function previousTransitionV1(
  values: readonly boolean[],
  before: number,
  from: boolean,
  to: boolean,
): number {
  for (let offset = 0; offset < values.length; offset += 1) {
    const index = (before - offset + values.length) % values.length;
    const prior = (index - 1 + values.length) % values.length;
    if (values[prior] === from && values[index] === to) return index;
  }
  throw new Error("baseline validation prior valve transition is unresolved");
}

function nextTransitionV1(
  values: readonly boolean[],
  after: number,
  from: boolean,
  to: boolean,
): number {
  for (let offset = 0; offset < values.length; offset += 1) {
    const index = (after + offset) % values.length;
    const prior = (index - 1 + values.length) % values.length;
    if (values[prior] === from && values[index] === to) return index;
  }
  throw new Error("baseline validation next valve transition is unresolved");
}

function cyclicSliceV1<T>(
  values: readonly T[],
  start: number,
  end: number,
): readonly T[] {
  const result: T[] = [];
  for (let index = start; index <= end; index += 1) {
    result.push(values[index % values.length]!);
  }
  return result;
}

function timeWeightedMeanV1(
  samples: readonly Sample[],
  values: readonly number[],
): number {
  const duration = samples.reduce((sum, sample) =>
    sum + sample.acceptedDtSec, 0);
  return values.reduce((sum, value, index) =>
    sum + value * samples[index]!.acceptedDtSec, 0) / duration;
}

function pressureRateExtremaV1(
  samples: readonly Sample[],
  chamber: VentricularPressureId,
) {
  const rates = samples.map((sample, index) =>
    (sample.absolutePressureMmHg[chamber] -
      samples[(index - 1 + samples.length) % samples.length]!
        .absolutePressureMmHg[chamber]) /
    sample.acceptedDtSec);
  return Object.freeze({
    maximum: Math.max(...rates),
    minimum: Math.min(...rates),
  });
}

/**
 * Counts topographically prominent interior maxima. Each candidate descends
 * until a higher summit or the episode boundary, so tiny ripples around one
 * broad summit cannot hide that summit by partitioning its prominence among
 * adjacent local maxima.
 */
export function countMainWireIntegratedModelSignificantPressurePeaksV1(
  values: readonly number[],
): number {
  if (values.length < 3 || values.some((value) => !Number.isFinite(value))) {
    return 0;
  }
  const prominenceThreshold = Math.max(
    0.5,
    0.05 * (Math.max(...values) - Math.min(...values)),
  );
  const peaks: number[] = [];
  for (let index = 1; index < values.length - 1; index += 1) {
    if (
      values[index]! > values[index - 1]! &&
      values[index]! >= values[index + 1]!
    ) peaks.push(index);
  }
  return peaks.filter((index) => {
    const peak = values[index]!;
    let leftMinimum = peak;
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      const value = values[cursor]!;
      leftMinimum = Math.min(leftMinimum, value);
      if (value > peak) break;
    }
    let rightMinimum = peak;
    for (let cursor = index + 1; cursor < values.length; cursor += 1) {
      const value = values[cursor]!;
      rightMinimum = Math.min(rightMinimum, value);
      if (value > peak) break;
    }
    const prominence = peak - Math.max(leftMinimum, rightMinimum);
    return prominence >= prominenceThreshold;
  }).length;
}

function totalVariationRatioV1(values: readonly number[]): number {
  const range = Math.max(...values) - Math.min(...values);
  if (range <= 0) return Number.POSITIVE_INFINITY;
  return values.slice(1).reduce((sum, value, index) =>
    sum + Math.abs(value - values[index]!), 0) / range;
}

function morphologyRoundnessCheckV1(
  checkId:
    | "waveform.LVP.rounded-not-plateau"
    | "waveform.RVP.rounded-not-plateau",
  measurement: PressureMorphologyV1,
): MainWireIntegratedModelBaselineValidationCheckV1 {
  const policy =
    MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_POLICY_V1
      .pressureMorphology;
  const passed =
    measurement.centralRangeFraction >= policy.minimumCentralRangeFraction &&
    measurement.centralRangeFraction <= policy.maximumCentralRangeFraction &&
    measurement.peakPhase01 >= policy.minimumPeakPhase01 &&
    measurement.peakPhase01 <= policy.maximumPeakPhase01;
  return Object.freeze({
    checkId,
    status: passed ? "passed" as const : "failed" as const,
    actual: measurement.centralRangeFraction,
    minimum: policy.minimumCentralRangeFraction,
    maximum: policy.maximumCentralRangeFraction,
    unit: "fraction",
  });
}

function exactCheckV1(
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1,
  actual: number,
  expected: number,
  unit: string,
): MainWireIntegratedModelBaselineValidationCheckV1 {
  return boundedCheckV1(checkId, actual, expected, expected, unit);
}

function rangeCheckV1(
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1,
  actual: number,
  range: Readonly<{ minimum: number; maximum: number }>,
  unit: string,
): MainWireIntegratedModelBaselineValidationCheckV1 {
  return boundedCheckV1(
    checkId,
    actual,
    range.minimum,
    range.maximum,
    unit,
  );
}

function boundedCheckV1(
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1,
  actual: number,
  minimum: number,
  maximum: number,
  unit: string,
): MainWireIntegratedModelBaselineValidationCheckV1 {
  const status = Number.isFinite(actual) && actual >= minimum && actual <= maximum
    ? "passed" as const
    : "failed" as const;
  return Object.freeze({ checkId, status, actual, minimum, maximum, unit });
}

function requirePositiveFiniteV1(value: number, label: string): number {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`baseline validation ${label} must be positive finite`);
  }
  return value;
}
