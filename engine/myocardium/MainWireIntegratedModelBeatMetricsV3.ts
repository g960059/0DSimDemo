import type {
  MainWireIntegratedModelStepSuccessV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";

type SuccessfulStep = MainWireIntegratedModelStepSuccessV3<
  MainWireNormalAdultFiveWallMechanicsStateV1
>;

export const MAIN_WIRE_INTEGRATED_MODEL_BEAT_METRICS_V3_ID =
  "main-wire-integrated-model-accepted-step-beat-metrics-v1" as const;
export const MAIN_WIRE_INTEGRATED_MODEL_BEAT_ACCUMULATOR_CHECKPOINT_V3_ID =
  "main-wire-integrated-model-beat-accumulator-checkpoint-v1" as const;

export type MainWireIntegratedModelPressureVolumeLandmarkV3 = Readonly<{
  volumeMl: number;
  pressureMmHg: number;
  event:
    | "maximum-volume"
    | "semilunar-valve-closure"
    | "minimum-volume-fallback";
}>;

export type MainWireIntegratedModelVentricularPressureVolumeLandmarksV3 =
  Readonly<{
    pressureBasis: "transmural";
    endDiastolic: MainWireIntegratedModelPressureVolumeLandmarkV3 &
      Readonly<{ event: "maximum-volume" }>;
    endSystolic: MainWireIntegratedModelPressureVolumeLandmarkV3 & Readonly<{
      event: "semilunar-valve-closure" | "minimum-volume-fallback";
    }>;
  }>;

export type MainWireIntegratedModelCompletedBeatMetricsV3 = Readonly<{
  metricsId: typeof MAIN_WIRE_INTEGRATED_MODEL_BEAT_METRICS_V3_ID;
  startAtrialCaptureId: string;
  endAtrialCaptureId: string;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  meanAorticPressureMmHg: number;
  systolicAorticPressureMmHg: number;
  diastolicAorticPressureMmHg: number;
  pulseAorticPressureMmHg: number;
  meanPulmonaryArterialPressureMmHg: number;
  meanLeftAtrialPressureMmHg: number;
  meanRightAtrialPressureMmHg: number;
  maximumLeftVentricularVolumeMl: number;
  minimumLeftVentricularVolumeMl: number;
  leftVentricularPressureVolumeLandmarks:
    MainWireIntegratedModelVentricularPressureVolumeLandmarksV3;
  rightVentricularPressureVolumeLandmarks:
    MainWireIntegratedModelVentricularPressureVolumeLandmarksV3;
  extremaLeftVentricularStrokeVolumeMl: number;
  extremaLeftVentricularEjectionFraction01: number;
  nativeLeftCardiacOutputLPerMin: number;
  nativeRightCardiacOutputLPerMin: number;
  systemicVenousReturnLPerMin: number;
  pulmonaryVenousReturnLPerMin: number;
  systemicTissueOutputLPerMin: number;
  pulmonaryOutputLPerMin: number;
}>;

export type MainWireIntegratedModelAcceptedBeatSampleV3 = Readonly<{
  timeSec: number;
  aorticPressureMmHg: number;
  pulmonaryArterialPressureMmHg: number;
  leftAtrialPressureMmHg: number;
  rightAtrialPressureMmHg: number;
  leftVentricularVolumeMl: number;
  rightVentricularVolumeMl: number;
  leftVentricularTransmuralPressureMmHg: number;
  rightVentricularTransmuralPressureMmHg: number;
  aorticValveFlowMlPerSec: number;
  pulmonaryValveFlowMlPerSec: number;
  systemicVenousReturnMlPerSec: number;
  pulmonaryVenousReturnMlPerSec: number;
  systemicTissueFlowMlPerSec: number;
  pulmonaryFlowMlPerSec: number;
}>;

type ActiveBeatV3 = {
  startAtrialCaptureId: string;
  startTimeSec: number;
  previous: MainWireIntegratedModelAcceptedBeatSampleV3;
  aorticPressureIntegralMmHgSec: number;
  pulmonaryArterialPressureIntegralMmHgSec: number;
  leftAtrialPressureIntegralMmHgSec: number;
  rightAtrialPressureIntegralMmHgSec: number;
  forwardAorticVolumeMl: number;
  forwardPulmonaryValveVolumeMl: number;
  systemicVenousReturnVolumeMl: number;
  pulmonaryVenousReturnVolumeMl: number;
  systemicTissueVolumeMl: number;
  pulmonaryVolumeMl: number;
  maximumAorticPressureMmHg: number;
  minimumAorticPressureMmHg: number;
  maximumLeftVentricularVolumeMl: number;
  minimumLeftVentricularVolumeMl: number;
  maximumLeftVentricularLandmark: MainWireIntegratedModelPressureVolumeLandmarkV3;
  minimumLeftVentricularLandmark: MainWireIntegratedModelPressureVolumeLandmarkV3;
  maximumRightVentricularLandmark: MainWireIntegratedModelPressureVolumeLandmarkV3;
  minimumRightVentricularLandmark: MainWireIntegratedModelPressureVolumeLandmarkV3;
  leftSemilunarClosureLandmark:
    MainWireIntegratedModelPressureVolumeLandmarkV3 | null;
  rightSemilunarClosureLandmark:
    MainWireIntegratedModelPressureVolumeLandmarkV3 | null;
};

export type MainWireIntegratedModelBeatAccumulatorCheckpointV3 = Readonly<{
  checkpointId:
    typeof MAIN_WIRE_INTEGRATED_MODEL_BEAT_ACCUMULATOR_CHECKPOINT_V3_ID;
  schemaVersion: 1;
  active: Readonly<ActiveBeatV3> | null;
}>;

/**
 * Full accepted-step accumulator. It consumes every event-clipped numerical
 * commit inside a presentation interval, so beat metrics never depend on UI
 * frame decimation or rendering cadence.
 */
export class MainWireIntegratedModelBeatAccumulatorV3 {
  #active: ActiveBeatV3 | null = null;

  static restore(
    input: unknown,
  ): MainWireIntegratedModelBeatAccumulatorV3 {
    const checkpoint = ownBeatAccumulatorCheckpointV3(input);
    const accumulator = new MainWireIntegratedModelBeatAccumulatorV3();
    accumulator.#active = checkpoint.active === null
      ? null
      : ownActiveBeatV3(checkpoint.active);
    return accumulator;
  }

  checkpoint(): MainWireIntegratedModelBeatAccumulatorCheckpointV3 {
    return Object.freeze({
      checkpointId:
        MAIN_WIRE_INTEGRATED_MODEL_BEAT_ACCUMULATOR_CHECKPOINT_V3_ID,
      schemaVersion: 1 as const,
      active: this.#active === null
        ? null
        : Object.freeze(ownActiveBeatV3(this.#active)),
    });
  }

  accept(step: SuccessfulStep): MainWireIntegratedModelCompletedBeatMetricsV3 | null {
    const sample = sampleFromStepV3(step);
    return this.acceptSample(
      sample,
      step.composedRhythmCandidate.capturedAtrialActivation
        ?.capturedActivationId ?? null,
    );
  }

  /**
   * Consumes the model-owned fixed readback only after its wider integrated
   * transaction has committed. The input is borrowed and never retained.
   */
  acceptNumericalReadback(
    readback: Float64Array,
    capturedAtrialActivationId: string | null,
  ): MainWireIntegratedModelCompletedBeatMetricsV3 | null {
    return this.acceptSample(
      sampleFromNumericalReadbackV1(readback),
      capturedAtrialActivationId,
    );
  }

  private acceptSample(
    sample: MainWireIntegratedModelAcceptedBeatSampleV3,
    capturedAtrialActivationId: string | null,
  ): MainWireIntegratedModelCompletedBeatMetricsV3 | null {
    if (this.#active !== null) integrateSampleV3(this.#active, sample);

    if (capturedAtrialActivationId === null) return null;

    const completed = this.#active === null
      ? null
      : completeBeatV3(
        this.#active,
        capturedAtrialActivationId,
        sample.timeSec,
      );
    this.#active = beginBeatV3(capturedAtrialActivationId, sample);
    return completed;
  }
}

export function validateAndOwnMainWireIntegratedModelCompletedBeatMetricsV3(
  input: unknown,
): MainWireIntegratedModelCompletedBeatMetricsV3 {
  const record = plainExactRecordV3(input, [
    "metricsId",
    "startAtrialCaptureId",
    "endAtrialCaptureId",
    "startTimeSec",
    "endTimeSec",
    "durationSec",
    "meanAorticPressureMmHg",
    "systolicAorticPressureMmHg",
    "diastolicAorticPressureMmHg",
    "pulseAorticPressureMmHg",
    "meanPulmonaryArterialPressureMmHg",
    "meanLeftAtrialPressureMmHg",
    "meanRightAtrialPressureMmHg",
    "maximumLeftVentricularVolumeMl",
    "minimumLeftVentricularVolumeMl",
    "leftVentricularPressureVolumeLandmarks",
    "rightVentricularPressureVolumeLandmarks",
    "extremaLeftVentricularStrokeVolumeMl",
    "extremaLeftVentricularEjectionFraction01",
    "nativeLeftCardiacOutputLPerMin",
    "nativeRightCardiacOutputLPerMin",
    "systemicVenousReturnLPerMin",
    "pulmonaryVenousReturnLPerMin",
    "systemicTissueOutputLPerMin",
    "pulmonaryOutputLPerMin",
  ], "integrated V3 completed beat metrics");
  if (record.metricsId !== MAIN_WIRE_INTEGRATED_MODEL_BEAT_METRICS_V3_ID) {
    throw new Error("integrated V3 completed beat metrics identity is invalid");
  }
  const startAtrialCaptureId = requiredStringV3(
    record.startAtrialCaptureId,
    "integrated V3 completed beat start capture ID",
  );
  const endAtrialCaptureId = requiredStringV3(
    record.endAtrialCaptureId,
    "integrated V3 completed beat end capture ID",
  );
  const startTimeSec = nonnegativeFiniteV3(
    record.startTimeSec,
    "integrated V3 completed beat start time",
  );
  const endTimeSec = nonnegativeFiniteV3(
    record.endTimeSec,
    "integrated V3 completed beat end time",
  );
  const durationSec = positiveFiniteV3(
    record.durationSec,
    "integrated V3 completed beat duration",
  );
  if (endTimeSec <= startTimeSec || endTimeSec - startTimeSec !== durationSec) {
    throw new Error("integrated V3 completed beat clocks are inconsistent");
  }
  return Object.freeze({
    metricsId: MAIN_WIRE_INTEGRATED_MODEL_BEAT_METRICS_V3_ID,
    startAtrialCaptureId,
    endAtrialCaptureId,
    startTimeSec,
    endTimeSec,
    durationSec,
    meanAorticPressureMmHg: finiteV3(
      record.meanAorticPressureMmHg,
      "integrated V3 completed beat mean aortic pressure",
    ),
    systolicAorticPressureMmHg: finiteV3(
      record.systolicAorticPressureMmHg,
      "integrated V3 completed beat systolic aortic pressure",
    ),
    diastolicAorticPressureMmHg: finiteV3(
      record.diastolicAorticPressureMmHg,
      "integrated V3 completed beat diastolic aortic pressure",
    ),
    pulseAorticPressureMmHg: finiteV3(
      record.pulseAorticPressureMmHg,
      "integrated V3 completed beat pulse aortic pressure",
    ),
    meanPulmonaryArterialPressureMmHg: finiteV3(
      record.meanPulmonaryArterialPressureMmHg,
      "integrated V3 completed beat mean pulmonary pressure",
    ),
    meanLeftAtrialPressureMmHg: finiteV3(
      record.meanLeftAtrialPressureMmHg,
      "integrated V3 completed beat mean left atrial pressure",
    ),
    meanRightAtrialPressureMmHg: finiteV3(
      record.meanRightAtrialPressureMmHg,
      "integrated V3 completed beat mean right atrial pressure",
    ),
    maximumLeftVentricularVolumeMl: finiteV3(
      record.maximumLeftVentricularVolumeMl,
      "integrated V3 completed beat maximum LV volume",
    ),
    minimumLeftVentricularVolumeMl: finiteV3(
      record.minimumLeftVentricularVolumeMl,
      "integrated V3 completed beat minimum LV volume",
    ),
    leftVentricularPressureVolumeLandmarks: ownVentricularLandmarksV3(
      record.leftVentricularPressureVolumeLandmarks,
      "integrated V3 completed beat left ventricular landmarks",
    ),
    rightVentricularPressureVolumeLandmarks: ownVentricularLandmarksV3(
      record.rightVentricularPressureVolumeLandmarks,
      "integrated V3 completed beat right ventricular landmarks",
    ),
    extremaLeftVentricularStrokeVolumeMl: finiteV3(
      record.extremaLeftVentricularStrokeVolumeMl,
      "integrated V3 completed beat LV stroke volume",
    ),
    extremaLeftVentricularEjectionFraction01: finiteV3(
      record.extremaLeftVentricularEjectionFraction01,
      "integrated V3 completed beat LV ejection fraction",
    ),
    nativeLeftCardiacOutputLPerMin: finiteV3(
      record.nativeLeftCardiacOutputLPerMin,
      "integrated V3 completed beat native left output",
    ),
    nativeRightCardiacOutputLPerMin: finiteV3(
      record.nativeRightCardiacOutputLPerMin,
      "integrated V3 completed beat native right output",
    ),
    systemicVenousReturnLPerMin: finiteV3(
      record.systemicVenousReturnLPerMin,
      "integrated V3 completed beat systemic venous return",
    ),
    pulmonaryVenousReturnLPerMin: finiteV3(
      record.pulmonaryVenousReturnLPerMin,
      "integrated V3 completed beat pulmonary venous return",
    ),
    systemicTissueOutputLPerMin: finiteV3(
      record.systemicTissueOutputLPerMin,
      "integrated V3 completed beat systemic tissue output",
    ),
    pulmonaryOutputLPerMin: finiteV3(
      record.pulmonaryOutputLPerMin,
      "integrated V3 completed beat pulmonary output",
    ),
  });
}

function sampleFromStepV3(
  step: SuccessfulStep,
): MainWireIntegratedModelAcceptedBeatSampleV3 {
  const circulation = step.coronaryStep.baseStep.circulationTrial;
  const coronary = step.coronaryStep.baseStep.coronaryTrial.diagnostics
    .hydraulics;
  const sample = Object.freeze({
    timeSec: step.acceptedState.acceptedTimeSec,
    aorticPressureMmHg: circulation.nodeAbsolutePressuresMmHg.Ao,
    pulmonaryArterialPressureMmHg:
      circulation.nodeAbsolutePressuresMmHg.PA,
    leftAtrialPressureMmHg: circulation.nodeAbsolutePressuresMmHg.LA,
    rightAtrialPressureMmHg: circulation.nodeAbsolutePressuresMmHg.RA,
    leftVentricularVolumeMl:
      step.acceptedState.coronary.circulation.nodeVolumesMl.LV,
    rightVentricularVolumeMl:
      step.acceptedState.coronary.circulation.nodeVolumesMl.RV,
    leftVentricularTransmuralPressureMmHg:
      step.coronaryStep.baseStep.mechanicsTrial.transmuralPressuresMmHg.LV,
    rightVentricularTransmuralPressureMmHg:
      step.coronaryStep.baseStep.mechanicsTrial.transmuralPressuresMmHg.RV,
    aorticValveFlowMlPerSec:
      circulation.valveEvaluations.AoV.flowMlPerSec,
    pulmonaryValveFlowMlPerSec:
      circulation.valveEvaluations.PV.flowMlPerSec,
    systemicVenousReturnMlPerSec:
      circulation.edgeFlowsMlPerSec.VC_RA
      + coronary.commonCoronaryVenousOutletFlowMlPerSec,
    pulmonaryVenousReturnMlPerSec:
      circulation.edgeFlowsMlPerSec.PVein_LA,
    systemicTissueFlowMlPerSec: circulation.edgeFlowsMlPerSec.SA_Art,
    pulmonaryFlowMlPerSec: circulation.edgeFlowsMlPerSec.PA_PArt,
  });
  for (const [name, value] of Object.entries(sample)) {
    if (!Number.isFinite(value)) {
      throw new Error(`integrated V3 beat sample ${name} is not finite`);
    }
  }
  return sample;
}

export function sampleMainWireIntegratedModelBeatFromNumericalReadbackV1(
  readback: Float64Array,
): MainWireIntegratedModelAcceptedBeatSampleV3 {
  return sampleFromNumericalReadbackV1(readback);
}

function sampleFromNumericalReadbackV1(
  readback: Float64Array,
): MainWireIntegratedModelAcceptedBeatSampleV3 {
  if (
    !(readback instanceof Float64Array)
    || readback.length
      !== MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1
  ) {
    throw new RangeError(
      "integrated V3 beat readback must contain exactly 32 f64 values",
    );
  }
  const layout = MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1;
  const sample = Object.freeze({
    timeSec: readback[layout.timeSec]!,
    aorticPressureMmHg: readback[layout.absolutePressureMmHg + 4]!,
    pulmonaryArterialPressureMmHg:
      readback[layout.absolutePressureMmHg + 6]!,
    leftAtrialPressureMmHg: readback[layout.absolutePressureMmHg]!,
    rightAtrialPressureMmHg: readback[layout.absolutePressureMmHg + 2]!,
    leftVentricularVolumeMl: readback[layout.chamberVolumeMl + 1]!,
    rightVentricularVolumeMl: readback[layout.chamberVolumeMl + 3]!,
    leftVentricularTransmuralPressureMmHg:
      readback[layout.transmuralPressureMmHg + 1]!,
    rightVentricularTransmuralPressureMmHg:
      readback[layout.transmuralPressureMmHg + 3]!,
    aorticValveFlowMlPerSec: readback[layout.valveFlowMlPerSec + 1]!,
    pulmonaryValveFlowMlPerSec: readback[layout.valveFlowMlPerSec + 3]!,
    systemicVenousReturnMlPerSec:
      readback[layout.systemicVenousFlowMlPerSec]!
      + readback[layout.coronaryVenousOutletFlowMlPerSec]!,
    pulmonaryVenousReturnMlPerSec:
      readback[layout.pulmonaryVenousFlowMlPerSec]!,
    systemicTissueFlowMlPerSec:
      readback[layout.systemicTissueFlowMlPerSec]!,
    pulmonaryFlowMlPerSec: readback[layout.pulmonaryFlowMlPerSec]!,
  });
  for (const [name, value] of Object.entries(sample)) {
    if (!Number.isFinite(value)) {
      throw new Error(`integrated V3 beat readback ${name} is not finite`);
    }
  }
  return sample;
}

function beginBeatV3(
  startAtrialCaptureId: string,
  sample: MainWireIntegratedModelAcceptedBeatSampleV3,
): ActiveBeatV3 {
  const leftLandmark = pressureVolumeLandmarkFromSampleV3(
    sample,
    "left",
    "maximum-volume",
  );
  const rightLandmark = pressureVolumeLandmarkFromSampleV3(
    sample,
    "right",
    "maximum-volume",
  );
  return {
    startAtrialCaptureId,
    startTimeSec: sample.timeSec,
    previous: sample,
    aorticPressureIntegralMmHgSec: 0,
    pulmonaryArterialPressureIntegralMmHgSec: 0,
    leftAtrialPressureIntegralMmHgSec: 0,
    rightAtrialPressureIntegralMmHgSec: 0,
    forwardAorticVolumeMl: 0,
    forwardPulmonaryValveVolumeMl: 0,
    systemicVenousReturnVolumeMl: 0,
    pulmonaryVenousReturnVolumeMl: 0,
    systemicTissueVolumeMl: 0,
    pulmonaryVolumeMl: 0,
    maximumAorticPressureMmHg: sample.aorticPressureMmHg,
    minimumAorticPressureMmHg: sample.aorticPressureMmHg,
    maximumLeftVentricularVolumeMl: sample.leftVentricularVolumeMl,
    minimumLeftVentricularVolumeMl: sample.leftVentricularVolumeMl,
    maximumLeftVentricularLandmark: leftLandmark,
    minimumLeftVentricularLandmark: Object.freeze({
      ...leftLandmark,
      event: "minimum-volume-fallback" as const,
    }),
    maximumRightVentricularLandmark: rightLandmark,
    minimumRightVentricularLandmark: Object.freeze({
      ...rightLandmark,
      event: "minimum-volume-fallback" as const,
    }),
    leftSemilunarClosureLandmark: null,
    rightSemilunarClosureLandmark: null,
  };
}

function integrateSampleV3(
  active: ActiveBeatV3,
  next: MainWireIntegratedModelAcceptedBeatSampleV3,
): void {
  const previous = active.previous;
  const dtSec = next.timeSec - previous.timeSec;
  if (!Number.isFinite(dtSec) || dtSec <= 0) {
    throw new Error("integrated V3 beat sample clock did not advance");
  }
  active.aorticPressureIntegralMmHgSec += trapezoidV3(
    previous.aorticPressureMmHg,
    next.aorticPressureMmHg,
    dtSec,
  );
  active.pulmonaryArterialPressureIntegralMmHgSec += trapezoidV3(
    previous.pulmonaryArterialPressureMmHg,
    next.pulmonaryArterialPressureMmHg,
    dtSec,
  );
  active.leftAtrialPressureIntegralMmHgSec += trapezoidV3(
    previous.leftAtrialPressureMmHg,
    next.leftAtrialPressureMmHg,
    dtSec,
  );
  active.rightAtrialPressureIntegralMmHgSec += trapezoidV3(
    previous.rightAtrialPressureMmHg,
    next.rightAtrialPressureMmHg,
    dtSec,
  );
  active.forwardAorticVolumeMl += trapezoidV3(
    Math.max(0, previous.aorticValveFlowMlPerSec),
    Math.max(0, next.aorticValveFlowMlPerSec),
    dtSec,
  );
  active.forwardPulmonaryValveVolumeMl += trapezoidV3(
    Math.max(0, previous.pulmonaryValveFlowMlPerSec),
    Math.max(0, next.pulmonaryValveFlowMlPerSec),
    dtSec,
  );
  active.systemicVenousReturnVolumeMl += trapezoidV3(
    previous.systemicVenousReturnMlPerSec,
    next.systemicVenousReturnMlPerSec,
    dtSec,
  );
  active.pulmonaryVenousReturnVolumeMl += trapezoidV3(
    previous.pulmonaryVenousReturnMlPerSec,
    next.pulmonaryVenousReturnMlPerSec,
    dtSec,
  );
  active.systemicTissueVolumeMl += trapezoidV3(
    previous.systemicTissueFlowMlPerSec,
    next.systemicTissueFlowMlPerSec,
    dtSec,
  );
  active.pulmonaryVolumeMl += trapezoidV3(
    previous.pulmonaryFlowMlPerSec,
    next.pulmonaryFlowMlPerSec,
    dtSec,
  );
  active.maximumAorticPressureMmHg = Math.max(
    active.maximumAorticPressureMmHg,
    next.aorticPressureMmHg,
  );
  active.minimumAorticPressureMmHg = Math.min(
    active.minimumAorticPressureMmHg,
    next.aorticPressureMmHg,
  );
  active.maximumLeftVentricularVolumeMl = Math.max(
    active.maximumLeftVentricularVolumeMl,
    next.leftVentricularVolumeMl,
  );
  active.minimumLeftVentricularVolumeMl = Math.min(
    active.minimumLeftVentricularVolumeMl,
    next.leftVentricularVolumeMl,
  );
  if (
    next.leftVentricularVolumeMl >
      active.maximumLeftVentricularLandmark.volumeMl
  ) {
    active.maximumLeftVentricularLandmark =
      pressureVolumeLandmarkFromSampleV3(
        next,
        "left",
        "maximum-volume",
      );
  }
  if (
    next.leftVentricularVolumeMl <
      active.minimumLeftVentricularLandmark.volumeMl
  ) {
    active.minimumLeftVentricularLandmark =
      pressureVolumeLandmarkFromSampleV3(
        next,
        "left",
        "minimum-volume-fallback",
      );
  }
  if (
    next.rightVentricularVolumeMl >
      active.maximumRightVentricularLandmark.volumeMl
  ) {
    active.maximumRightVentricularLandmark =
      pressureVolumeLandmarkFromSampleV3(
        next,
        "right",
        "maximum-volume",
      );
  }
  if (
    next.rightVentricularVolumeMl <
      active.minimumRightVentricularLandmark.volumeMl
  ) {
    active.minimumRightVentricularLandmark =
      pressureVolumeLandmarkFromSampleV3(
        next,
        "right",
        "minimum-volume-fallback",
      );
  }
  if (
    previous.aorticValveFlowMlPerSec > 1e-6
    && next.aorticValveFlowMlPerSec <= 1e-6
  ) {
    active.leftSemilunarClosureLandmark = interpolateValveClosureV3(
      previous,
      next,
      "left",
      previous.aorticValveFlowMlPerSec,
      next.aorticValveFlowMlPerSec,
    );
  }
  if (
    previous.pulmonaryValveFlowMlPerSec > 1e-6
    && next.pulmonaryValveFlowMlPerSec <= 1e-6
  ) {
    active.rightSemilunarClosureLandmark = interpolateValveClosureV3(
      previous,
      next,
      "right",
      previous.pulmonaryValveFlowMlPerSec,
      next.pulmonaryValveFlowMlPerSec,
    );
  }
  active.previous = next;
}

function completeBeatV3(
  active: ActiveBeatV3,
  endAtrialCaptureId: string,
  endTimeSec: number,
): MainWireIntegratedModelCompletedBeatMetricsV3 {
  const durationSec = endTimeSec - active.startTimeSec;
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    throw new Error("integrated V3 completed beat duration is invalid");
  }
  const strokeVolumeMl = active.maximumLeftVentricularVolumeMl
    - active.minimumLeftVentricularVolumeMl;
  const ejectionFraction01 = strokeVolumeMl
    / active.maximumLeftVentricularVolumeMl;
  const meanFlowToLPerMin = (volumeMl: number) =>
    volumeMl / durationSec * 60 / 1_000;
  const completed = Object.freeze({
    metricsId: MAIN_WIRE_INTEGRATED_MODEL_BEAT_METRICS_V3_ID,
    startAtrialCaptureId: active.startAtrialCaptureId,
    endAtrialCaptureId,
    startTimeSec: active.startTimeSec,
    endTimeSec,
    durationSec,
    meanAorticPressureMmHg:
      active.aorticPressureIntegralMmHgSec / durationSec,
    systolicAorticPressureMmHg: active.maximumAorticPressureMmHg,
    diastolicAorticPressureMmHg: active.minimumAorticPressureMmHg,
    pulseAorticPressureMmHg:
      active.maximumAorticPressureMmHg - active.minimumAorticPressureMmHg,
    meanPulmonaryArterialPressureMmHg:
      active.pulmonaryArterialPressureIntegralMmHgSec / durationSec,
    meanLeftAtrialPressureMmHg:
      active.leftAtrialPressureIntegralMmHgSec / durationSec,
    meanRightAtrialPressureMmHg:
      active.rightAtrialPressureIntegralMmHgSec / durationSec,
    maximumLeftVentricularVolumeMl:
      active.maximumLeftVentricularVolumeMl,
    minimumLeftVentricularVolumeMl:
      active.minimumLeftVentricularVolumeMl,
    leftVentricularPressureVolumeLandmarks: Object.freeze({
      pressureBasis: "transmural" as const,
      endDiastolic:
        active.maximumLeftVentricularLandmark as
          MainWireIntegratedModelVentricularPressureVolumeLandmarksV3["endDiastolic"],
      endSystolic:
        (active.leftSemilunarClosureLandmark
        ?? active.minimumLeftVentricularLandmark) as
          MainWireIntegratedModelVentricularPressureVolumeLandmarksV3["endSystolic"],
    }),
    rightVentricularPressureVolumeLandmarks: Object.freeze({
      pressureBasis: "transmural" as const,
      endDiastolic:
        active.maximumRightVentricularLandmark as
          MainWireIntegratedModelVentricularPressureVolumeLandmarksV3["endDiastolic"],
      endSystolic:
        (active.rightSemilunarClosureLandmark
        ?? active.minimumRightVentricularLandmark) as
          MainWireIntegratedModelVentricularPressureVolumeLandmarksV3["endSystolic"],
    }),
    extremaLeftVentricularStrokeVolumeMl: strokeVolumeMl,
    extremaLeftVentricularEjectionFraction01: ejectionFraction01,
    nativeLeftCardiacOutputLPerMin:
      meanFlowToLPerMin(active.forwardAorticVolumeMl),
    nativeRightCardiacOutputLPerMin:
      meanFlowToLPerMin(active.forwardPulmonaryValveVolumeMl),
    systemicVenousReturnLPerMin:
      meanFlowToLPerMin(active.systemicVenousReturnVolumeMl),
    pulmonaryVenousReturnLPerMin:
      meanFlowToLPerMin(active.pulmonaryVenousReturnVolumeMl),
    systemicTissueOutputLPerMin:
      meanFlowToLPerMin(active.systemicTissueVolumeMl),
    pulmonaryOutputLPerMin: meanFlowToLPerMin(active.pulmonaryVolumeMl),
  });
  for (const [name, value] of Object.entries(completed)) {
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new Error(`integrated V3 completed beat metric ${name} is not finite`);
    }
  }
  return completed;
}

function trapezoidV3(left: number, right: number, dtSec: number): number {
  return 0.5 * (left + right) * dtSec;
}

function pressureVolumeLandmarkFromSampleV3(
  sample: MainWireIntegratedModelAcceptedBeatSampleV3,
  side: "left" | "right",
  event: MainWireIntegratedModelPressureVolumeLandmarkV3["event"],
): MainWireIntegratedModelPressureVolumeLandmarkV3 {
  return Object.freeze({
    volumeMl: side === "left"
      ? sample.leftVentricularVolumeMl
      : sample.rightVentricularVolumeMl,
    pressureMmHg: side === "left"
      ? sample.leftVentricularTransmuralPressureMmHg
      : sample.rightVentricularTransmuralPressureMmHg,
    event,
  });
}

function ownBeatAccumulatorCheckpointV3(
  input: unknown,
): MainWireIntegratedModelBeatAccumulatorCheckpointV3 {
  const record = plainExactRecordV3(input, [
    "checkpointId",
    "schemaVersion",
    "active",
  ], "integrated V3 beat accumulator checkpoint");
  if (
    record.checkpointId
      !== MAIN_WIRE_INTEGRATED_MODEL_BEAT_ACCUMULATOR_CHECKPOINT_V3_ID
    || record.schemaVersion !== 1
  ) {
    throw new Error("unsupported integrated V3 beat accumulator checkpoint");
  }
  return Object.freeze({
    checkpointId:
      MAIN_WIRE_INTEGRATED_MODEL_BEAT_ACCUMULATOR_CHECKPOINT_V3_ID,
    schemaVersion: 1 as const,
    active: record.active === null ? null : ownActiveBeatV3(record.active),
  });
}

function ownActiveBeatV3(input: unknown): ActiveBeatV3 {
  const record = plainExactRecordV3(input, [
    "startAtrialCaptureId",
    "startTimeSec",
    "previous",
    "aorticPressureIntegralMmHgSec",
    "pulmonaryArterialPressureIntegralMmHgSec",
    "leftAtrialPressureIntegralMmHgSec",
    "rightAtrialPressureIntegralMmHgSec",
    "forwardAorticVolumeMl",
    "forwardPulmonaryValveVolumeMl",
    "systemicVenousReturnVolumeMl",
    "pulmonaryVenousReturnVolumeMl",
    "systemicTissueVolumeMl",
    "pulmonaryVolumeMl",
    "maximumAorticPressureMmHg",
    "minimumAorticPressureMmHg",
    "maximumLeftVentricularVolumeMl",
    "minimumLeftVentricularVolumeMl",
    "maximumLeftVentricularLandmark",
    "minimumLeftVentricularLandmark",
    "maximumRightVentricularLandmark",
    "minimumRightVentricularLandmark",
    "leftSemilunarClosureLandmark",
    "rightSemilunarClosureLandmark",
  ], "integrated V3 active beat checkpoint");
  const startTimeSec = nonnegativeFiniteV3(
    record.startTimeSec,
    "integrated V3 active beat start time",
  );
  const previous = ownBeatSampleV3(record.previous);
  if (previous.timeSec < startTimeSec) {
    throw new Error("integrated V3 active beat sample precedes its start");
  }
  return {
    startAtrialCaptureId: requiredStringV3(
      record.startAtrialCaptureId,
      "integrated V3 active beat capture ID",
    ),
    startTimeSec,
    previous,
    aorticPressureIntegralMmHgSec: finiteV3(
      record.aorticPressureIntegralMmHgSec,
      "integrated V3 active beat aortic pressure integral",
    ),
    pulmonaryArterialPressureIntegralMmHgSec: finiteV3(
      record.pulmonaryArterialPressureIntegralMmHgSec,
      "integrated V3 active beat pulmonary pressure integral",
    ),
    leftAtrialPressureIntegralMmHgSec: finiteV3(
      record.leftAtrialPressureIntegralMmHgSec,
      "integrated V3 active beat left atrial pressure integral",
    ),
    rightAtrialPressureIntegralMmHgSec: finiteV3(
      record.rightAtrialPressureIntegralMmHgSec,
      "integrated V3 active beat right atrial pressure integral",
    ),
    forwardAorticVolumeMl: finiteV3(
      record.forwardAorticVolumeMl,
      "integrated V3 active beat forward aortic volume",
    ),
    forwardPulmonaryValveVolumeMl: finiteV3(
      record.forwardPulmonaryValveVolumeMl,
      "integrated V3 active beat forward pulmonary volume",
    ),
    systemicVenousReturnVolumeMl: finiteV3(
      record.systemicVenousReturnVolumeMl,
      "integrated V3 active beat systemic venous return volume",
    ),
    pulmonaryVenousReturnVolumeMl: finiteV3(
      record.pulmonaryVenousReturnVolumeMl,
      "integrated V3 active beat pulmonary venous return volume",
    ),
    systemicTissueVolumeMl: finiteV3(
      record.systemicTissueVolumeMl,
      "integrated V3 active beat systemic tissue volume",
    ),
    pulmonaryVolumeMl: finiteV3(
      record.pulmonaryVolumeMl,
      "integrated V3 active beat pulmonary volume",
    ),
    maximumAorticPressureMmHg: finiteV3(
      record.maximumAorticPressureMmHg,
      "integrated V3 active beat maximum aortic pressure",
    ),
    minimumAorticPressureMmHg: finiteV3(
      record.minimumAorticPressureMmHg,
      "integrated V3 active beat minimum aortic pressure",
    ),
    maximumLeftVentricularVolumeMl: finiteV3(
      record.maximumLeftVentricularVolumeMl,
      "integrated V3 active beat maximum LV volume",
    ),
    minimumLeftVentricularVolumeMl: finiteV3(
      record.minimumLeftVentricularVolumeMl,
      "integrated V3 active beat minimum LV volume",
    ),
    maximumLeftVentricularLandmark: ownPressureVolumeLandmarkV3(
      record.maximumLeftVentricularLandmark,
      "integrated V3 active beat maximum LV landmark",
      ["maximum-volume"],
    ),
    minimumLeftVentricularLandmark: ownPressureVolumeLandmarkV3(
      record.minimumLeftVentricularLandmark,
      "integrated V3 active beat minimum LV landmark",
      ["minimum-volume-fallback"],
    ),
    maximumRightVentricularLandmark: ownPressureVolumeLandmarkV3(
      record.maximumRightVentricularLandmark,
      "integrated V3 active beat maximum RV landmark",
      ["maximum-volume"],
    ),
    minimumRightVentricularLandmark: ownPressureVolumeLandmarkV3(
      record.minimumRightVentricularLandmark,
      "integrated V3 active beat minimum RV landmark",
      ["minimum-volume-fallback"],
    ),
    leftSemilunarClosureLandmark:
      record.leftSemilunarClosureLandmark === null
        ? null
        : ownPressureVolumeLandmarkV3(
          record.leftSemilunarClosureLandmark,
          "integrated V3 active beat left semilunar closure",
          ["semilunar-valve-closure"],
        ),
    rightSemilunarClosureLandmark:
      record.rightSemilunarClosureLandmark === null
        ? null
        : ownPressureVolumeLandmarkV3(
          record.rightSemilunarClosureLandmark,
          "integrated V3 active beat right semilunar closure",
          ["semilunar-valve-closure"],
        ),
  };
}

function ownBeatSampleV3(
  input: unknown,
): MainWireIntegratedModelAcceptedBeatSampleV3 {
  const record = plainExactRecordV3(input, [
    "timeSec",
    "aorticPressureMmHg",
    "pulmonaryArterialPressureMmHg",
    "leftAtrialPressureMmHg",
    "rightAtrialPressureMmHg",
    "leftVentricularVolumeMl",
    "rightVentricularVolumeMl",
    "leftVentricularTransmuralPressureMmHg",
    "rightVentricularTransmuralPressureMmHg",
    "aorticValveFlowMlPerSec",
    "pulmonaryValveFlowMlPerSec",
    "systemicVenousReturnMlPerSec",
    "pulmonaryVenousReturnMlPerSec",
    "systemicTissueFlowMlPerSec",
    "pulmonaryFlowMlPerSec",
  ], "integrated V3 beat sample checkpoint");
  return Object.freeze({
    timeSec: nonnegativeFiniteV3(
      record.timeSec,
      "integrated V3 beat sample time",
    ),
    aorticPressureMmHg: finiteV3(record.aorticPressureMmHg, "aortic pressure"),
    pulmonaryArterialPressureMmHg: finiteV3(
      record.pulmonaryArterialPressureMmHg,
      "pulmonary arterial pressure",
    ),
    leftAtrialPressureMmHg: finiteV3(
      record.leftAtrialPressureMmHg,
      "left atrial pressure",
    ),
    rightAtrialPressureMmHg: finiteV3(
      record.rightAtrialPressureMmHg,
      "right atrial pressure",
    ),
    leftVentricularVolumeMl: finiteV3(
      record.leftVentricularVolumeMl,
      "left ventricular volume",
    ),
    rightVentricularVolumeMl: finiteV3(
      record.rightVentricularVolumeMl,
      "right ventricular volume",
    ),
    leftVentricularTransmuralPressureMmHg: finiteV3(
      record.leftVentricularTransmuralPressureMmHg,
      "left ventricular transmural pressure",
    ),
    rightVentricularTransmuralPressureMmHg: finiteV3(
      record.rightVentricularTransmuralPressureMmHg,
      "right ventricular transmural pressure",
    ),
    aorticValveFlowMlPerSec: finiteV3(
      record.aorticValveFlowMlPerSec,
      "aortic valve flow",
    ),
    pulmonaryValveFlowMlPerSec: finiteV3(
      record.pulmonaryValveFlowMlPerSec,
      "pulmonary valve flow",
    ),
    systemicVenousReturnMlPerSec: finiteV3(
      record.systemicVenousReturnMlPerSec,
      "systemic venous return",
    ),
    pulmonaryVenousReturnMlPerSec: finiteV3(
      record.pulmonaryVenousReturnMlPerSec,
      "pulmonary venous return",
    ),
    systemicTissueFlowMlPerSec: finiteV3(
      record.systemicTissueFlowMlPerSec,
      "systemic tissue flow",
    ),
    pulmonaryFlowMlPerSec: finiteV3(
      record.pulmonaryFlowMlPerSec,
      "pulmonary flow",
    ),
  });
}

function ownVentricularLandmarksV3(
  input: unknown,
  label: string,
): MainWireIntegratedModelVentricularPressureVolumeLandmarksV3 {
  const record = plainExactRecordV3(
    input,
    ["pressureBasis", "endDiastolic", "endSystolic"],
    label,
  );
  if (record.pressureBasis !== "transmural") {
    throw new Error(`${label} pressure basis is invalid`);
  }
  return Object.freeze({
    pressureBasis: "transmural" as const,
    endDiastolic: ownPressureVolumeLandmarkV3(
      record.endDiastolic,
      `${label} end diastolic`,
      ["maximum-volume"],
    ) as MainWireIntegratedModelVentricularPressureVolumeLandmarksV3["endDiastolic"],
    endSystolic: ownPressureVolumeLandmarkV3(
      record.endSystolic,
      `${label} end systolic`,
      ["semilunar-valve-closure", "minimum-volume-fallback"],
    ) as MainWireIntegratedModelVentricularPressureVolumeLandmarksV3["endSystolic"],
  });
}

function ownPressureVolumeLandmarkV3(
  input: unknown,
  label: string,
  allowedEvents: readonly MainWireIntegratedModelPressureVolumeLandmarkV3["event"][],
): MainWireIntegratedModelPressureVolumeLandmarkV3 {
  const record = plainExactRecordV3(
    input,
    ["volumeMl", "pressureMmHg", "event"],
    label,
  );
  if (!allowedEvents.includes(
    record.event as MainWireIntegratedModelPressureVolumeLandmarkV3["event"],
  )) {
    throw new Error(`${label} event is invalid`);
  }
  return Object.freeze({
    volumeMl: finiteV3(record.volumeMl, `${label} volume`),
    pressureMmHg: finiteV3(record.pressureMmHg, `${label} pressure`),
    event: record.event as
      MainWireIntegratedModelPressureVolumeLandmarkV3["event"],
  });
}

function plainExactRecordV3(
  input: unknown,
  keys: readonly string[],
  label: string,
): Record<string, unknown> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`${label} must be a plain object`);
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${label} must be a plain object`);
  }
  const ownKeys = Reflect.ownKeys(input);
  if (ownKeys.some((key) => typeof key !== "string")) {
    throw new Error(`${label} contains a non-string key`);
  }
  const actual = [...ownKeys as string[]].sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`${label} has an unexpected field set`);
  }
  return input as Record<string, unknown>;
}

function requiredStringV3(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a nonempty string`);
  }
  return value;
}

function finiteV3(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
  return value;
}

function nonnegativeFiniteV3(value: unknown, label: string): number {
  const owned = finiteV3(value, label);
  if (owned < 0) throw new Error(`${label} must be nonnegative`);
  return owned;
}

function positiveFiniteV3(value: unknown, label: string): number {
  const owned = finiteV3(value, label);
  if (owned <= 0) throw new Error(`${label} must be positive`);
  return owned;
}

function interpolateValveClosureV3(
  previous: MainWireIntegratedModelAcceptedBeatSampleV3,
  next: MainWireIntegratedModelAcceptedBeatSampleV3,
  side: "left" | "right",
  previousFlowMlPerSec: number,
  nextFlowMlPerSec: number,
): MainWireIntegratedModelPressureVolumeLandmarkV3 {
  const denominator = previousFlowMlPerSec - nextFlowMlPerSec;
  const ratio = denominator > 1e-12
    ? Math.max(0, Math.min(1, previousFlowMlPerSec / denominator))
    : 1;
  const interpolate = (left: number, right: number) =>
    left + ratio * (right - left);
  return Object.freeze({
    volumeMl: side === "left"
      ? interpolate(
          previous.leftVentricularVolumeMl,
          next.leftVentricularVolumeMl,
        )
      : interpolate(
          previous.rightVentricularVolumeMl,
          next.rightVentricularVolumeMl,
        ),
    pressureMmHg: side === "left"
      ? interpolate(
          previous.leftVentricularTransmuralPressureMmHg,
          next.leftVentricularTransmuralPressureMmHg,
        )
      : interpolate(
          previous.rightVentricularTransmuralPressureMmHg,
          next.rightVentricularTransmuralPressureMmHg,
        ),
    event: "semilunar-valve-closure" as const,
  });
}
