import {
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_VALVE_ORDER_V1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import { forwardPressureGradientIncrementV3 } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";

export const MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_BEAT_METRICS_V1_ID =
  "main-wire-aortic-recovered-root-port-beat-metrics-v1" as const;
export const MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_BEAT_ACCUMULATOR_CHECKPOINT_V1_ID =
  "main-wire-aortic-recovered-root-port-beat-accumulator-checkpoint-v1" as const;
export const MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_BEAT_METRICS_CLAIM_V1 =
  Object.freeze({
    acceptedHemodynamicStateAdded: false as const,
    analysisAccumulatorStateOnly: true as const,
    proximalPressureStation:
      "fixed-ascending-aortic-area-recovered-root-algebraic-constitutive-port" as const,
    proximalPressureDefinition:
      "Ao-compliance-node-plus-Zc-times-signed-AoV-flow" as const,
    proximalPressureIsAorticComplianceNode: false as const,
    catheterEquivalentPressureClaimed: false as const,
    forwardFlowDuration:
      "sum-of-linearly-interpolated-positive-aortic-valve-flow-intervals" as const,
    forwardFlowDurationIsClinicalLeftVentricularEjectionTime: false as const,
    venaContractaSignal:
      "model-vena-contracta-bernoulli-pressure-during-positive-flow" as const,
    measuredDopplerEquivalenceClaimed: false as const,
  });

const AORTIC_VALVE_READBACK_INDEX_V1 =
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_VALVE_ORDER_V1.indexOf("AoV");
if (AORTIC_VALVE_READBACK_INDEX_V1 < 0) {
  throw new Error("accepted numerical readback valve order is missing AoV");
}

export type MainWireAorticRecoveredRootPortPressureSummaryV1 = Readonly<{
  basis: "algebraic-proximal-constitutive-port-pressure";
  timeWeightedMeanMmHg: number;
  maximumMmHg: number;
  minimumMmHg: number;
  pulseMmHg: number;
}>;

export type MainWireAorticRecoveredRootPortForwardGradientSummaryV1 =
  Readonly<{
    basis:
      | "left-ventricular-minus-proximal-constitutive-port-pressure-during-positive-aortic-valve-flow"
      | "vena-contracta-bernoulli-pressure-during-positive-aortic-valve-flow";
    /**
     * Sum of linearly interpolated intervals with Q_AoV > 0. This is not a
     * valve-event or clinical left-ventricular ejection time.
     */
    forwardFlowDurationSec: number;
    timeWeightedMeanMmHg: number | null;
    peakMmHg: number | null;
  }>;

export type MainWireAorticRecoveredRootPortCompletedBeatMetricsV1 = Readonly<{
  metricsId: typeof MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_BEAT_METRICS_V1_ID;
  startAtrialCaptureId: string;
  endAtrialCaptureId: string;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  proximalConstitutivePortPressure:
    MainWireAorticRecoveredRootPortPressureSummaryV1;
  localValveForwardPressureGradient:
    MainWireAorticRecoveredRootPortForwardGradientSummaryV1;
  venaContractaBernoulliForwardPressureGradient:
    MainWireAorticRecoveredRootPortForwardGradientSummaryV1;
}>;

type AcceptedSampleV1 = Readonly<{
  timeSec: number;
  aorticValveFlowMlPerSec: number;
  algebraicProximalConstitutivePortPressureMmHg: number;
  localValvePressureGradientMmHg: number;
  venaContractaBernoulliPressureMmHg: number;
}>;

type ActiveBeatV1 = {
  startAtrialCaptureId: string;
  startTimeSec: number;
  previous: AcceptedSampleV1;
  proximalPressureIntegralMmHgSec: number;
  maximumProximalPressureMmHg: number;
  minimumProximalPressureMmHg: number;
  forwardFlowDurationSec: number;
  localGradientIntegralMmHgSec: number;
  localGradientPeakMmHg: number | null;
  venaContractaGradientIntegralMmHgSec: number;
  venaContractaGradientPeakMmHg: number | null;
};

export type MainWireAorticRecoveredRootPortBeatAccumulatorCheckpointV1 =
  Readonly<{
    checkpointId:
      typeof MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_BEAT_ACCUMULATOR_CHECKPOINT_V1_ID;
    schemaVersion: 1;
    active: Readonly<ActiveBeatV1> | null;
  }>;

/**
 * Selected-model sidecar for exact recovered-root aortic-port observables.
 * It retains five primitive values from the previous accepted readback, never
 * the borrowed 76-f64 buffer.
 */
export class MainWireAorticRecoveredRootPortBeatAccumulatorV1 {
  #active: ActiveBeatV1 | null = null;

  static restore(
    input: unknown,
  ): MainWireAorticRecoveredRootPortBeatAccumulatorV1 {
    const checkpoint = ownCheckpointV1(input);
    const accumulator =
      new MainWireAorticRecoveredRootPortBeatAccumulatorV1();
    accumulator.#active = checkpoint.active === null
      ? null
      : ownActiveBeatV1(checkpoint.active);
    return accumulator;
  }

  checkpoint(): MainWireAorticRecoveredRootPortBeatAccumulatorCheckpointV1 {
    return Object.freeze({
      checkpointId:
        MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_BEAT_ACCUMULATOR_CHECKPOINT_V1_ID,
      schemaVersion: 1 as const,
      active: this.#active === null
        ? null
        : freezeActiveBeatV1(ownActiveBeatV1(this.#active)),
    });
  }

  /** Consumes an exact selected-model 76-f64 accepted numerical readback. */
  acceptNumericalReadbackV3(
    readback: Float64Array,
    capturedAtrialActivationId: string | null,
  ): MainWireAorticRecoveredRootPortCompletedBeatMetricsV1 | null {
    const sample = sampleFromNumericalReadbackV1(readback);
    const captureId = capturedAtrialActivationId === null
      ? null
      : requiredCaptureIdV1(
        capturedAtrialActivationId,
        "selected aortic beat capture ID",
      );

    if (
      this.#active !== null
      && captureId === this.#active.startAtrialCaptureId
    ) {
      throw new Error("selected aortic beat capture ID did not advance");
    }
    if (this.#active !== null) integrateSampleV1(this.#active, sample);

    if (captureId === null) return null;
    const completed = this.#active === null
      ? null
      : completeBeatV1(this.#active, captureId, sample.timeSec);
    this.#active = beginBeatV1(captureId, sample);
    return completed;
  }
}

export function validateAndOwnMainWireAorticRecoveredRootPortCompletedBeatMetricsV1(
  input: unknown,
): MainWireAorticRecoveredRootPortCompletedBeatMetricsV1 {
  const label = "selected aortic completed beat metrics";
  const record = plainExactRecordV1(
    input,
    [
      "metricsId",
      "startAtrialCaptureId",
      "endAtrialCaptureId",
      "startTimeSec",
      "endTimeSec",
      "durationSec",
      "proximalConstitutivePortPressure",
      "localValveForwardPressureGradient",
      "venaContractaBernoulliForwardPressureGradient",
    ],
    label,
  );
  if (
    record.metricsId
    !== MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_BEAT_METRICS_V1_ID
  ) {
    throw new Error(`${label} identity is invalid`);
  }
  const startAtrialCaptureId = requiredCaptureIdV1(
    record.startAtrialCaptureId,
    `${label} start capture ID`,
  );
  const endAtrialCaptureId = requiredCaptureIdV1(
    record.endAtrialCaptureId,
    `${label} end capture ID`,
  );
  if (startAtrialCaptureId === endAtrialCaptureId) {
    throw new Error(`${label} capture ID did not advance`);
  }
  const startTimeSec = nonnegativeFiniteV1(
    record.startTimeSec,
    `${label} start time`,
  );
  const endTimeSec = nonnegativeFiniteV1(
    record.endTimeSec,
    `${label} end time`,
  );
  const durationSec = positiveFiniteV1(
    record.durationSec,
    `${label} duration`,
  );
  if (
    !(endTimeSec > startTimeSec)
    || endTimeSec - startTimeSec !== durationSec
  ) {
    throw new Error(`${label} clock is inconsistent`);
  }
  const proximalConstitutivePortPressure = ownProximalPressureSummaryV1(
    record.proximalConstitutivePortPressure,
    `${label} proximal pressure summary`,
  );
  const localValveForwardPressureGradient = ownForwardGradientSummaryV1(
    record.localValveForwardPressureGradient,
    "left-ventricular-minus-proximal-constitutive-port-pressure-during-positive-aortic-valve-flow",
    durationSec,
    `${label} local gradient summary`,
  );
  const venaContractaBernoulliForwardPressureGradient =
    ownForwardGradientSummaryV1(
      record.venaContractaBernoulliForwardPressureGradient,
      "vena-contracta-bernoulli-pressure-during-positive-aortic-valve-flow",
      durationSec,
      `${label} vena-contracta gradient summary`,
    );
  if (
    localValveForwardPressureGradient.forwardFlowDurationSec
    !== venaContractaBernoulliForwardPressureGradient.forwardFlowDurationSec
  ) {
    throw new Error(`${label} forward-gradient durations are inconsistent`);
  }
  return Object.freeze({
    metricsId: MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_BEAT_METRICS_V1_ID,
    startAtrialCaptureId,
    endAtrialCaptureId,
    startTimeSec,
    endTimeSec,
    durationSec,
    proximalConstitutivePortPressure,
    localValveForwardPressureGradient,
    venaContractaBernoulliForwardPressureGradient,
  });
}

function sampleFromNumericalReadbackV1(
  readback: Float64Array,
): AcceptedSampleV1 {
  if (
    !(readback instanceof Float64Array)
    || readback.length
      !== MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3
  ) {
    throw new RangeError(
      "selected aortic beat readback must contain exactly "
      + `${MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3} f64 values`,
    );
  }
  const historicalLayout =
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1;
  const selectedLayout =
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2;
  const sample = Object.freeze({
    timeSec: readback[historicalLayout.timeSec]!,
    aorticValveFlowMlPerSec:
      readback[
        historicalLayout.valveFlowMlPerSec + AORTIC_VALVE_READBACK_INDEX_V1
      ]!,
    algebraicProximalConstitutivePortPressureMmHg:
      readback[
        selectedLayout.algebraicProximalConstitutivePortPressureMmHg
      ]!,
    localValvePressureGradientMmHg:
      readback[selectedLayout.localValvePressureGradientMmHg]!,
    venaContractaBernoulliPressureMmHg:
      readback[selectedLayout.venaContractaBernoulliPressureMmHg]!,
  });
  ownSampleV1(sample, "selected aortic beat readback");
  return sample;
}

function beginBeatV1(
  startAtrialCaptureId: string,
  sample: AcceptedSampleV1,
): ActiveBeatV1 {
  return {
    startAtrialCaptureId,
    startTimeSec: sample.timeSec,
    previous: sample,
    proximalPressureIntegralMmHgSec: 0,
    maximumProximalPressureMmHg:
      sample.algebraicProximalConstitutivePortPressureMmHg,
    minimumProximalPressureMmHg:
      sample.algebraicProximalConstitutivePortPressureMmHg,
    forwardFlowDurationSec: 0,
    localGradientIntegralMmHgSec: 0,
    localGradientPeakMmHg: null,
    venaContractaGradientIntegralMmHgSec: 0,
    venaContractaGradientPeakMmHg: null,
  };
}

function integrateSampleV1(active: ActiveBeatV1, next: AcceptedSampleV1): void {
  const previous = active.previous;
  const dtSec = next.timeSec - previous.timeSec;
  if (!Number.isFinite(dtSec) || dtSec <= 0) {
    throw new Error("selected aortic beat sample clock did not advance");
  }
  const proximalPressureIncrementMmHgSec = 0.5
    * (
      previous.algebraicProximalConstitutivePortPressureMmHg
      + next.algebraicProximalConstitutivePortPressureMmHg
    )
    * dtSec;
  const localIncrement = forwardPressureGradientIncrementV3(
    previous.aorticValveFlowMlPerSec,
    next.aorticValveFlowMlPerSec,
    previous.localValvePressureGradientMmHg,
    next.localValvePressureGradientMmHg,
    dtSec,
  );
  const venaContractaIncrement = forwardPressureGradientIncrementV3(
    previous.aorticValveFlowMlPerSec,
    next.aorticValveFlowMlPerSec,
    previous.venaContractaBernoulliPressureMmHg,
    next.venaContractaBernoulliPressureMmHg,
    dtSec,
  );
  if (
    localIncrement.forwardFlowDurationSec
    !== venaContractaIncrement.forwardFlowDurationSec
  ) {
    throw new Error(
      "selected aortic forward-gradient durations are inconsistent",
    );
  }

  const nextProximalPressureIntegralMmHgSec =
    active.proximalPressureIntegralMmHgSec
    + proximalPressureIncrementMmHgSec;
  const nextForwardFlowDurationSec = active.forwardFlowDurationSec
    + localIncrement.forwardFlowDurationSec;
  const nextLocalGradientIntegralMmHgSec =
    active.localGradientIntegralMmHgSec
    + localIncrement.pressureIntegralMmHgSec;
  const nextVenaContractaGradientIntegralMmHgSec =
    active.venaContractaGradientIntegralMmHgSec
    + venaContractaIncrement.pressureIntegralMmHgSec;
  for (const [name, value] of Object.entries({
    proximalPressureIncrementMmHgSec,
    nextProximalPressureIntegralMmHgSec,
    nextForwardFlowDurationSec,
    nextLocalGradientIntegralMmHgSec,
    nextVenaContractaGradientIntegralMmHgSec,
  })) {
    if (!Number.isFinite(value)) {
      throw new Error(`selected aortic beat ${name} is not finite`);
    }
  }
  if (nextForwardFlowDurationSec < 0) {
    throw new Error("selected aortic forward-flow duration is negative");
  }

  active.proximalPressureIntegralMmHgSec =
    nextProximalPressureIntegralMmHgSec;
  active.maximumProximalPressureMmHg = Math.max(
    active.maximumProximalPressureMmHg,
    next.algebraicProximalConstitutivePortPressureMmHg,
  );
  active.minimumProximalPressureMmHg = Math.min(
    active.minimumProximalPressureMmHg,
    next.algebraicProximalConstitutivePortPressureMmHg,
  );
  active.forwardFlowDurationSec = nextForwardFlowDurationSec;
  active.localGradientIntegralMmHgSec =
    nextLocalGradientIntegralMmHgSec;
  active.localGradientPeakMmHg = updatePeakV1(
    active.localGradientPeakMmHg,
    localIncrement.peakMmHg,
  );
  active.venaContractaGradientIntegralMmHgSec =
    nextVenaContractaGradientIntegralMmHgSec;
  active.venaContractaGradientPeakMmHg = updatePeakV1(
    active.venaContractaGradientPeakMmHg,
    venaContractaIncrement.peakMmHg,
  );
  active.previous = next;
}

function completeBeatV1(
  active: ActiveBeatV1,
  endAtrialCaptureId: string,
  endTimeSec: number,
): MainWireAorticRecoveredRootPortCompletedBeatMetricsV1 {
  const durationSec = endTimeSec - active.startTimeSec;
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    throw new Error("selected aortic completed beat duration is invalid");
  }
  const forwardFlowDurationSec = active.forwardFlowDurationSec;
  const completeGradient = (
    basis: MainWireAorticRecoveredRootPortForwardGradientSummaryV1["basis"],
    pressureIntegralMmHgSec: number,
    peakMmHg: number | null,
  ): MainWireAorticRecoveredRootPortForwardGradientSummaryV1 =>
    Object.freeze({
      basis,
      forwardFlowDurationSec,
      timeWeightedMeanMmHg: forwardFlowDurationSec > 0
        ? pressureIntegralMmHgSec / forwardFlowDurationSec
        : null,
      peakMmHg: forwardFlowDurationSec > 0 ? peakMmHg : null,
    });
  return validateAndOwnMainWireAorticRecoveredRootPortCompletedBeatMetricsV1({
    metricsId: MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_BEAT_METRICS_V1_ID,
    startAtrialCaptureId: active.startAtrialCaptureId,
    endAtrialCaptureId,
    startTimeSec: active.startTimeSec,
    endTimeSec,
    durationSec,
    proximalConstitutivePortPressure: Object.freeze({
      basis: "algebraic-proximal-constitutive-port-pressure" as const,
      timeWeightedMeanMmHg:
        active.proximalPressureIntegralMmHgSec / durationSec,
      maximumMmHg: active.maximumProximalPressureMmHg,
      minimumMmHg: active.minimumProximalPressureMmHg,
      pulseMmHg:
        active.maximumProximalPressureMmHg
        - active.minimumProximalPressureMmHg,
    }),
    localValveForwardPressureGradient: completeGradient(
      "left-ventricular-minus-proximal-constitutive-port-pressure-during-positive-aortic-valve-flow",
      active.localGradientIntegralMmHgSec,
      active.localGradientPeakMmHg,
    ),
    venaContractaBernoulliForwardPressureGradient: completeGradient(
      "vena-contracta-bernoulli-pressure-during-positive-aortic-valve-flow",
      active.venaContractaGradientIntegralMmHgSec,
      active.venaContractaGradientPeakMmHg,
    ),
  });
}

function ownProximalPressureSummaryV1(
  input: unknown,
  label: string,
): MainWireAorticRecoveredRootPortPressureSummaryV1 {
  const record = plainExactRecordV1(
    input,
    [
      "basis",
      "timeWeightedMeanMmHg",
      "maximumMmHg",
      "minimumMmHg",
      "pulseMmHg",
    ],
    label,
  );
  if (record.basis !== "algebraic-proximal-constitutive-port-pressure") {
    throw new Error(`${label} basis is invalid`);
  }
  const timeWeightedMeanMmHg = finiteV1(
    record.timeWeightedMeanMmHg,
    `${label} time-weighted mean`,
  );
  const maximumMmHg = finiteV1(record.maximumMmHg, `${label} maximum`);
  const minimumMmHg = finiteV1(record.minimumMmHg, `${label} minimum`);
  const pulseMmHg = nonnegativeFiniteV1(record.pulseMmHg, `${label} pulse`);
  const expectedPulseMmHg = maximumMmHg - minimumMmHg;
  if (
    maximumMmHg < minimumMmHg
    || !Number.isFinite(expectedPulseMmHg)
    || !approximatelyEqualV1(pulseMmHg, expectedPulseMmHg)
    || timeWeightedMeanMmHg
      < minimumMmHg - numericToleranceV1(minimumMmHg)
    || timeWeightedMeanMmHg
      > maximumMmHg + numericToleranceV1(maximumMmHg)
  ) {
    throw new Error(`${label} values are inconsistent`);
  }
  return Object.freeze({
    basis: "algebraic-proximal-constitutive-port-pressure" as const,
    timeWeightedMeanMmHg,
    maximumMmHg,
    minimumMmHg,
    pulseMmHg,
  });
}

function ownForwardGradientSummaryV1(
  input: unknown,
  expectedBasis:
    MainWireAorticRecoveredRootPortForwardGradientSummaryV1["basis"],
  beatDurationSec: number,
  label: string,
): MainWireAorticRecoveredRootPortForwardGradientSummaryV1 {
  const record = plainExactRecordV1(
    input,
    [
      "basis",
      "forwardFlowDurationSec",
      "timeWeightedMeanMmHg",
      "peakMmHg",
    ],
    label,
  );
  if (record.basis !== expectedBasis) {
    throw new Error(`${label} basis is invalid`);
  }
  const forwardFlowDurationSec = nonnegativeFiniteV1(
    record.forwardFlowDurationSec,
    `${label} forward-flow duration`,
  );
  if (
    forwardFlowDurationSec
      > beatDurationSec + clockToleranceV1(beatDurationSec)
  ) {
    throw new Error(`${label} forward-flow duration exceeds beat duration`);
  }
  const timeWeightedMeanMmHg = nullableFiniteV1(
    record.timeWeightedMeanMmHg,
    `${label} time-weighted mean`,
  );
  const peakMmHg = nullableFiniteV1(record.peakMmHg, `${label} peak`);
  if (forwardFlowDurationSec === 0) {
    if (timeWeightedMeanMmHg !== null || peakMmHg !== null) {
      throw new Error(`${label} zero-flow availability is inconsistent`);
    }
  } else if (
    timeWeightedMeanMmHg === null
    || peakMmHg === null
    || timeWeightedMeanMmHg > peakMmHg + numericToleranceV1(peakMmHg)
  ) {
    throw new Error(`${label} positive-flow values are inconsistent`);
  }
  return Object.freeze({
    basis: expectedBasis,
    forwardFlowDurationSec,
    timeWeightedMeanMmHg,
    peakMmHg,
  });
}

function updatePeakV1(
  current: number | null,
  increment: number | null,
): number | null {
  if (increment === null) return current;
  if (!Number.isFinite(increment)) {
    throw new Error("selected aortic forward-gradient peak is not finite");
  }
  return current === null ? increment : Math.max(current, increment);
}

function ownCheckpointV1(
  input: unknown,
): MainWireAorticRecoveredRootPortBeatAccumulatorCheckpointV1 {
  const record = plainExactRecordV1(
    input,
    ["checkpointId", "schemaVersion", "active"],
    "selected aortic beat accumulator checkpoint",
  );
  if (
    record.checkpointId
      !== MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_BEAT_ACCUMULATOR_CHECKPOINT_V1_ID
    || record.schemaVersion !== 1
  ) {
    throw new Error("unsupported selected aortic beat accumulator checkpoint");
  }
  return Object.freeze({
    checkpointId:
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_BEAT_ACCUMULATOR_CHECKPOINT_V1_ID,
    schemaVersion: 1 as const,
    active: record.active === null
      ? null
      : freezeActiveBeatV1(ownActiveBeatV1(record.active)),
  });
}

function ownActiveBeatV1(input: unknown): ActiveBeatV1 {
  const label = "selected aortic active beat checkpoint";
  const record = plainExactRecordV1(
    input,
    [
      "startAtrialCaptureId",
      "startTimeSec",
      "previous",
      "proximalPressureIntegralMmHgSec",
      "maximumProximalPressureMmHg",
      "minimumProximalPressureMmHg",
      "forwardFlowDurationSec",
      "localGradientIntegralMmHgSec",
      "localGradientPeakMmHg",
      "venaContractaGradientIntegralMmHgSec",
      "venaContractaGradientPeakMmHg",
    ],
    label,
  );
  const startTimeSec = nonnegativeFiniteV1(
    record.startTimeSec,
    `${label} start time`,
  );
  const previous = ownSampleV1(record.previous, `${label} previous sample`);
  if (previous.timeSec < startTimeSec) {
    throw new Error(`${label} previous sample precedes its start`);
  }
  const elapsedSec = previous.timeSec - startTimeSec;
  const proximalPressureIntegralMmHgSec = finiteV1(
    record.proximalPressureIntegralMmHgSec,
    `${label} proximal pressure integral`,
  );
  const maximumProximalPressureMmHg = finiteV1(
    record.maximumProximalPressureMmHg,
    `${label} maximum proximal pressure`,
  );
  const minimumProximalPressureMmHg = finiteV1(
    record.minimumProximalPressureMmHg,
    `${label} minimum proximal pressure`,
  );
  if (
    maximumProximalPressureMmHg < minimumProximalPressureMmHg
    || previous.algebraicProximalConstitutivePortPressureMmHg
      > maximumProximalPressureMmHg
    || previous.algebraicProximalConstitutivePortPressureMmHg
      < minimumProximalPressureMmHg
  ) {
    throw new Error(`${label} proximal pressure extrema are inconsistent`);
  }
  const forwardFlowDurationSec = nonnegativeFiniteV1(
    record.forwardFlowDurationSec,
    `${label} forward-flow duration`,
  );
  if (forwardFlowDurationSec > elapsedSec + clockToleranceV1(elapsedSec)) {
    throw new Error(`${label} forward-flow duration exceeds elapsed time`);
  }
  const localGradientIntegralMmHgSec = finiteV1(
    record.localGradientIntegralMmHgSec,
    `${label} local gradient integral`,
  );
  const localGradientPeakMmHg = nullableFiniteV1(
    record.localGradientPeakMmHg,
    `${label} local gradient peak`,
  );
  const venaContractaGradientIntegralMmHgSec = finiteV1(
    record.venaContractaGradientIntegralMmHgSec,
    `${label} vena-contracta gradient integral`,
  );
  const venaContractaGradientPeakMmHg = nullableFiniteV1(
    record.venaContractaGradientPeakMmHg,
    `${label} vena-contracta gradient peak`,
  );
  if (forwardFlowDurationSec === 0) {
    if (
      localGradientIntegralMmHgSec !== 0
      || venaContractaGradientIntegralMmHgSec !== 0
      || localGradientPeakMmHg !== null
      || venaContractaGradientPeakMmHg !== null
    ) {
      throw new Error(`${label} zero-flow gradient ledger is inconsistent`);
    }
  } else if (
    localGradientPeakMmHg === null
    || venaContractaGradientPeakMmHg === null
  ) {
    throw new Error(`${label} positive-flow gradient peak is missing`);
  }
  if (forwardFlowDurationSec > 0) {
    const localMeanMmHg =
      localGradientIntegralMmHgSec / forwardFlowDurationSec;
    const venaContractaMeanMmHg =
      venaContractaGradientIntegralMmHgSec / forwardFlowDurationSec;
    if (
      !Number.isFinite(localMeanMmHg)
      || !Number.isFinite(venaContractaMeanMmHg)
      || localMeanMmHg
        > localGradientPeakMmHg! + numericToleranceV1(localGradientPeakMmHg!)
      || venaContractaMeanMmHg
        > venaContractaGradientPeakMmHg!
          + numericToleranceV1(venaContractaGradientPeakMmHg!)
    ) {
      throw new Error(`${label} positive-flow gradient ledger is inconsistent`);
    }
  }
  if (elapsedSec === 0) {
    if (
      proximalPressureIntegralMmHgSec !== 0
      || forwardFlowDurationSec !== 0
      || maximumProximalPressureMmHg
        !== previous.algebraicProximalConstitutivePortPressureMmHg
      || minimumProximalPressureMmHg
        !== previous.algebraicProximalConstitutivePortPressureMmHg
    ) {
      throw new Error(`${label} initial proximal pressure ledger is inconsistent`);
    }
  } else {
    const proximalMeanMmHg = proximalPressureIntegralMmHgSec / elapsedSec;
    if (
      !Number.isFinite(proximalMeanMmHg)
      || proximalMeanMmHg
        < minimumProximalPressureMmHg
          - numericToleranceV1(minimumProximalPressureMmHg)
      || proximalMeanMmHg
        > maximumProximalPressureMmHg
          + numericToleranceV1(maximumProximalPressureMmHg)
    ) {
      throw new Error(`${label} proximal pressure ledger is inconsistent`);
    }
  }

  return {
    startAtrialCaptureId: requiredCaptureIdV1(
      record.startAtrialCaptureId,
      `${label} start capture ID`,
    ),
    startTimeSec,
    previous,
    proximalPressureIntegralMmHgSec,
    maximumProximalPressureMmHg,
    minimumProximalPressureMmHg,
    forwardFlowDurationSec,
    localGradientIntegralMmHgSec,
    localGradientPeakMmHg,
    venaContractaGradientIntegralMmHgSec,
    venaContractaGradientPeakMmHg,
  };
}

function ownSampleV1(input: unknown, label: string): AcceptedSampleV1 {
  const record = plainExactRecordV1(
    input,
    [
      "timeSec",
      "aorticValveFlowMlPerSec",
      "algebraicProximalConstitutivePortPressureMmHg",
      "localValvePressureGradientMmHg",
      "venaContractaBernoulliPressureMmHg",
    ],
    label,
  );
  return Object.freeze({
    timeSec: nonnegativeFiniteV1(record.timeSec, `${label} time`),
    aorticValveFlowMlPerSec: finiteV1(
      record.aorticValveFlowMlPerSec,
      `${label} aortic valve flow`,
    ),
    algebraicProximalConstitutivePortPressureMmHg: finiteV1(
      record.algebraicProximalConstitutivePortPressureMmHg,
      `${label} proximal pressure`,
    ),
    localValvePressureGradientMmHg: finiteV1(
      record.localValvePressureGradientMmHg,
      `${label} local gradient`,
    ),
    venaContractaBernoulliPressureMmHg: finiteV1(
      record.venaContractaBernoulliPressureMmHg,
      `${label} vena-contracta pressure`,
    ),
  });
}

function freezeActiveBeatV1(active: ActiveBeatV1): Readonly<ActiveBeatV1> {
  return Object.freeze({ ...active, previous: Object.freeze(active.previous) });
}

function plainExactRecordV1(
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
  const actual = [...(ownKeys as string[])].sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`${label} has an unexpected field set`);
  }
  return input as Record<string, unknown>;
}

function requiredCaptureIdV1(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a nonempty string`);
  }
  return value;
}

function finiteV1(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
  return value;
}

function nonnegativeFiniteV1(value: unknown, label: string): number {
  const owned = finiteV1(value, label);
  if (owned < 0) throw new Error(`${label} must be nonnegative`);
  return owned;
}

function positiveFiniteV1(value: unknown, label: string): number {
  const owned = finiteV1(value, label);
  if (owned <= 0) throw new Error(`${label} must be positive`);
  return owned;
}

function nullableFiniteV1(value: unknown, label: string): number | null {
  return value === null ? null : finiteV1(value, label);
}

function clockToleranceV1(value: number): number {
  return numericToleranceV1(value);
}

function numericToleranceV1(value: number): number {
  return 1e-12 * Math.max(1, Math.abs(value));
}

function approximatelyEqualV1(left: number, right: number): boolean {
  return (
    Math.abs(left - right)
    <= 1e-12 * Math.max(1, Math.abs(left), Math.abs(right))
  );
}
