import type { IabpConfigV1, IabpEvaluationV1 } from "@/engine/devices/typesV1";

export function evaluateIabpV1(
  config: IabpConfigV1,
  input: Readonly<{
    cyclePhase01: number;
    beatIndex: number;
    heartRateBpm: number;
  }>,
): IabpEvaluationV1 {
  validateIabpConfigV1(config);
  const phase = wrap01(input.cyclePhase01);
  const beatIndex = Math.floor(finite(input.beatIndex, "beatIndex"));
  const heartRateBpm = positive(input.heartRateBpm, "heartRateBpm");
  const assistedBeat = config.enabled
    && positiveModulo(beatIndex, config.assistRatio) === 0;
  if (!assistedBeat) {
    return Object.freeze({
      enabled: config.enabled,
      assistedBeat: false,
      assistRatio: config.assistRatio,
      cyclePhase01: phase,
      activation01: 0,
      balloonVolumeMl: 0,
      placementNode: config.placementNode,
    });
  }
  const cycleDurationSec = 60 / heartRateBpm;
  const maximumTransitionWidth = Math.max(
    (1 - config.inflationPhase01) / 2,
    1e-6,
  );
  const inflationWidth = Math.min(
    config.inflationDurationSec / cycleDurationSec,
    maximumTransitionWidth,
  );
  const deflationWidth = Math.min(
    config.deflationDurationSec / cycleDurationSec,
    maximumTransitionWidth,
  );
  const deflationOnsetPhase01 = Math.min(
    config.deflationPhase01,
    1 - deflationWidth,
  );
  const inflation = smoothstep01(
    (phase - config.inflationPhase01) / Math.max(inflationWidth, 1e-6),
  );
  const deflation = 1 - smoothstep01(
    (phase - deflationOnsetPhase01) / Math.max(deflationWidth, 1e-6),
  );
  const activation01 = Math.min(inflation, deflation);
  return Object.freeze({
    enabled: true,
    assistedBeat: true,
    assistRatio: config.assistRatio,
    cyclePhase01: phase,
    activation01,
    balloonVolumeMl: config.balloonVolumeMl * activation01,
    placementNode: config.placementNode,
  });
}

export function validateIabpConfigV1(config: IabpConfigV1): void {
  if (typeof config.enabled !== "boolean") throw new Error("iabp.enabled must be boolean");
  if (![1, 2, 3].includes(config.assistRatio)) {
    throw new Error("iabp.assistRatio must be 1, 2, or 3");
  }
  nonnegative(config.balloonVolumeMl, "iabp.balloonVolumeMl");
  if (!(config.inflationPhase01 >= 0 && config.inflationPhase01 < 1)) {
    throw new Error("iabp.inflationPhase01 must be in [0, 1)");
  }
  if (!(config.deflationPhase01 > 0 && config.deflationPhase01 <= 1)) {
    throw new Error("iabp.deflationPhase01 must be in (0, 1]");
  }
  if (config.inflationPhase01 >= config.deflationPhase01) {
    throw new Error("iabp inflation must precede deflation in the same beat");
  }
  positive(config.inflationDurationSec, "iabp.inflationDurationSec");
  positive(config.deflationDurationSec, "iabp.deflationDurationSec");
  if (config.placementNode !== "SA") throw new Error("iabp placementNode must be SA");
}

function smoothstep01(value: number): number {
  const x = Math.min(1, Math.max(0, value));
  return x * x * (3 - 2 * x);
}

function wrap01(value: number): number {
  finite(value, "cyclePhase01");
  return ((value % 1) + 1) % 1;
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function positive(value: number, label: string): number {
  finite(value, label);
  if (!(value > 0)) throw new Error(`${label} must be positive`);
  return value;
}

function nonnegative(value: number, label: string): number {
  finite(value, label);
  if (value < 0) throw new Error(`${label} must be nonnegative`);
  return value;
}
