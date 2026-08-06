import type {
  MainWireIntegratedModelStepSuccessV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";

type SuccessfulStep = MainWireIntegratedModelStepSuccessV3<
  MainWireNormalAdultFiveWallMechanicsStateV1
>;

export const MAIN_WIRE_INTEGRATED_MODEL_BEAT_METRICS_V3_ID =
  "main-wire-integrated-model-accepted-step-beat-metrics-v1" as const;

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

type BeatSampleV3 = Readonly<{
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
  previous: BeatSampleV3;
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

/**
 * Full accepted-step accumulator. It consumes every event-clipped numerical
 * commit inside a presentation interval, so beat metrics never depend on UI
 * frame decimation or rendering cadence.
 */
export class MainWireIntegratedModelBeatAccumulatorV3 {
  #active: ActiveBeatV3 | null = null;

  accept(step: SuccessfulStep): MainWireIntegratedModelCompletedBeatMetricsV3 | null {
    const sample = sampleFromStepV3(step);
    if (this.#active !== null) integrateSampleV3(this.#active, sample);

    const capture = step.composedRhythmCandidate.capturedAtrialActivation;
    if (capture === null) return null;

    const completed = this.#active === null
      ? null
      : completeBeatV3(this.#active, capture.capturedActivationId, sample.timeSec);
    this.#active = beginBeatV3(capture.capturedActivationId, sample);
    return completed;
  }
}

function sampleFromStepV3(step: SuccessfulStep): BeatSampleV3 {
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

function beginBeatV3(
  startAtrialCaptureId: string,
  sample: BeatSampleV3,
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

function integrateSampleV3(active: ActiveBeatV3, next: BeatSampleV3): void {
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
  sample: BeatSampleV3,
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

function interpolateValveClosureV3(
  previous: BeatSampleV3,
  next: BeatSampleV3,
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
