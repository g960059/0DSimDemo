import type {
  MainWireIntegratedModelCompletedBeatMetricsV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  buildMainWireIntegratedModelBaselineValidationChecksV1,
  measureMainWireIntegratedModelBaselineVentricularTimingAndInletFlowV1,
  type MainWireIntegratedModelBaselineValidationCheckV1,
  type MainWireIntegratedModelBaselineValidationMeasurementsV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import type {
  MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID =
  "main-wire-integrated-model-standard70-baseline-validation-v1" as const;

/**
 * Broad construction sentinels, not clinical diagnostic intervals. The raw
 * PV gradient is RV-minus-PA node pressure during forward model flow. Right
 * timing is valve-event-defined and therefore is not a Doppler/TDI Tei value.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_POLICY_V1 =
  Object.freeze({
    pulmonaryValveGradientMmHg: Object.freeze({
      mean: Object.freeze({ minimum: 0, maximum: 5 }),
      peak: Object.freeze({ minimum: 0, maximum: 10 }),
    }),
    pulmonaryEjectionTimeSec: Object.freeze({ minimum: 0.22, maximum: 0.35 }),
    rvPressureRateMmHgPerSec: Object.freeze({
      maximum: Object.freeze({ minimum: 300, maximum: 1_000 }),
      minimum: Object.freeze({ minimum: -700, maximum: -150 }),
    }),
    tricuspidPeakEToA: Object.freeze({ minimum: 0.8, maximum: 2 }),
    ventricularTimingSec: Object.freeze({
      isovolumicContraction: Object.freeze({ minimum: 0.02, maximum: 0.09 }),
      isovolumicRelaxation: Object.freeze({ minimum: 0.03, maximum: 0.12 }),
      teiIndex: Object.freeze({ minimum: 0.25, maximum: 0.65 }),
    }),
  });

export type MainWireIntegratedModelStandard70RightHeartCheckIdV1 =
  | "pulmonary-valve.mean-gradient"
  | "pulmonary-valve.peak-gradient"
  | "pulmonary-valve.ejection-time"
  | "right-ventricle.maximum-dpdt"
  | "right-ventricle.minimum-dpdt"
  | "tricuspid-flow.peak-e-to-a"
  | "right-timing.ict"
  | "right-timing.irt"
  | "right-timing.tei-index";

export type MainWireIntegratedModelStandard70RightHeartCheckV1 = Readonly<{
  checkId: MainWireIntegratedModelStandard70RightHeartCheckIdV1;
  status: "passed" | "failed";
  actual: number;
  minimum: number;
  maximum: number;
  unit: string;
}>;

export type MainWireIntegratedModelStandard70BaselineMeasurementsV1 =
  MainWireIntegratedModelBaselineValidationMeasurementsV1 & Readonly<{
    pulmonaryValve: Readonly<{
      ejectionTimeSec: number;
      meanGradientMmHg: number;
      peakGradientMmHg: number;
    }>;
    rightVentricle: Readonly<{
      maximumDpDtMmHgPerSec: number;
      minimumDpDtMmHgPerSec: number;
    }>;
    tricuspidFlow: Readonly<{
      peakEMlPerSec: number;
      peakAMlPerSec: number;
      peakEToA: number;
    }>;
    rightTiming: Readonly<{
      ictSec: number;
      irtSec: number;
      teiIndex: number;
    }>;
  }>;

export type MainWireIntegratedModelStandard70BaselineCheckV1 =
  | MainWireIntegratedModelBaselineValidationCheckV1
  | MainWireIntegratedModelStandard70RightHeartCheckV1;

export function measureMainWireIntegratedModelStandard70BaselineV1(
  base: MainWireIntegratedModelBaselineValidationMeasurementsV1,
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
  completedBeat: MainWireIntegratedModelCompletedBeatMetricsV3,
): MainWireIntegratedModelStandard70BaselineMeasurementsV1 {
  const pulmonaryValve = completedBeat.valveForwardPressureGradients.PV;
  const rightPressureRate =
    completedBeat.ventricularAbsolutePressureRateExtrema.RV;
  if (
    pulmonaryValve.timeWeightedMeanMmHg === null
    || pulmonaryValve.peakMmHg === null
  ) {
    throw new Error("Standard70 pulmonary-valve beat metrics are incomplete");
  }
  const right =
    measureMainWireIntegratedModelBaselineVentricularTimingAndInletFlowV1(
      samples,
      "right",
    );
  return Object.freeze({
    ...base,
    pulmonaryValve: Object.freeze({
      ejectionTimeSec: pulmonaryValve.forwardFlowDurationSec,
      meanGradientMmHg: pulmonaryValve.timeWeightedMeanMmHg,
      peakGradientMmHg: pulmonaryValve.peakMmHg,
    }),
    rightVentricle: Object.freeze({
      maximumDpDtMmHgPerSec: rightPressureRate.maximumMmHgPerSec,
      minimumDpDtMmHgPerSec: rightPressureRate.minimumMmHgPerSec,
    }),
    tricuspidFlow: right.inletFlow,
    rightTiming: right.timing,
  });
}

export function buildMainWireIntegratedModelStandard70BaselineChecksV1(
  measurements: MainWireIntegratedModelStandard70BaselineMeasurementsV1,
  period1Established: boolean,
): readonly MainWireIntegratedModelStandard70BaselineCheckV1[] {
  const policy = MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_POLICY_V1;
  return Object.freeze([
    ...buildMainWireIntegratedModelBaselineValidationChecksV1(
      measurements,
      period1Established,
    ),
    rightRangeCheckV1(
      "pulmonary-valve.mean-gradient",
      measurements.pulmonaryValve.meanGradientMmHg,
      policy.pulmonaryValveGradientMmHg.mean,
      "mmHg",
    ),
    rightRangeCheckV1(
      "pulmonary-valve.peak-gradient",
      measurements.pulmonaryValve.peakGradientMmHg,
      policy.pulmonaryValveGradientMmHg.peak,
      "mmHg",
    ),
    rightRangeCheckV1(
      "pulmonary-valve.ejection-time",
      measurements.pulmonaryValve.ejectionTimeSec,
      policy.pulmonaryEjectionTimeSec,
      "s",
    ),
    rightRangeCheckV1(
      "right-ventricle.maximum-dpdt",
      measurements.rightVentricle.maximumDpDtMmHgPerSec,
      policy.rvPressureRateMmHgPerSec.maximum,
      "mmHg/s",
    ),
    rightRangeCheckV1(
      "right-ventricle.minimum-dpdt",
      measurements.rightVentricle.minimumDpDtMmHgPerSec,
      policy.rvPressureRateMmHgPerSec.minimum,
      "mmHg/s",
    ),
    rightRangeCheckV1(
      "tricuspid-flow.peak-e-to-a",
      measurements.tricuspidFlow.peakEToA,
      policy.tricuspidPeakEToA,
      "ratio",
    ),
    rightRangeCheckV1(
      "right-timing.ict",
      measurements.rightTiming.ictSec,
      policy.ventricularTimingSec.isovolumicContraction,
      "s",
    ),
    rightRangeCheckV1(
      "right-timing.irt",
      measurements.rightTiming.irtSec,
      policy.ventricularTimingSec.isovolumicRelaxation,
      "s",
    ),
    rightRangeCheckV1(
      "right-timing.tei-index",
      measurements.rightTiming.teiIndex,
      policy.ventricularTimingSec.teiIndex,
      "ratio",
    ),
  ]);
}

export function assertMainWireIntegratedModelStandard70BaselinePassedV1(
  checks: readonly MainWireIntegratedModelStandard70BaselineCheckV1[],
  measurements?: MainWireIntegratedModelStandard70BaselineMeasurementsV1,
): void {
  const failed = checks.filter(({ status }) => status !== "passed");
  if (failed.length > 0) {
    throw new Error(
      "Standard70 baseline validation gate rejected: "
        + failed.map((check) =>
          `${check.checkId}=${check.actual} outside `
            + `[${check.minimum}, ${check.maximum}]`
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

function rightRangeCheckV1(
  checkId: MainWireIntegratedModelStandard70RightHeartCheckIdV1,
  actual: number,
  range: Readonly<{ minimum: number; maximum: number }>,
  unit: string,
): MainWireIntegratedModelStandard70RightHeartCheckV1 {
  return Object.freeze({
    checkId,
    status:
      Number.isFinite(actual)
        && actual >= range.minimum
        && actual <= range.maximum
        ? "passed" as const
        : "failed" as const,
    actual,
    minimum: range.minimum,
    maximum: range.maximum,
    unit,
  });
}
