import {
  CORONARY_TERRITORY_IDS_V1,
  type CoronaryTerritoryRecordV1,
} from "@/engine/coronary/typesV1";

export type CoronaryAutoregulationPriorV1 = Readonly<{
  minimumResistanceScale: number;
  maximumResistanceScale: number;
  responseTimeConstantSec: number;
  referencePerfusionPressureMmHg: number;
  myogenicPressureGain: number;
  metabolicFlowErrorGain: number;
  minimumSignalFraction: number;
}>;

export type CoronaryToneAcceptedStateV1 = Readonly<{
  resistanceScale: number;
}>;

export type CoronaryAutoregulationAcceptedInputV1 = Readonly<{
  stepDtSec: number;
  /** Slowly averaged forward flow, not instantaneous phasic flow. */
  acceptedMeanFlowMlPerSec: number;
  demandTargetFlowMlPerSec: number;
  /** Mean pressure available across the regulated microvascular bed. */
  acceptedMeanPerfusionPressureMmHg: number;
  /** 0 = endogenous tone; 1 = fixed maximal pharmacological dilation. */
  hyperemia01: number;
}>;

export type CoronaryAutoregulationStepV1 = Readonly<{
  state: CoronaryToneAcceptedStateV1;
  targetResistanceScale: number;
  tone01: number;
  relaxationFraction: number;
  boundedAt: "minimum" | "maximum" | "interior";
}>;

export function initialCoronaryToneStateV1(
  resistanceScale = 1,
): CoronaryToneAcceptedStateV1 {
  if (!Number.isFinite(resistanceScale) || resistanceScale <= 0) {
    throw new RangeError("initial coronary resistance scale must be positive and finite");
  }
  return Object.freeze({ resistanceScale });
}

/**
 * Pure accepted-state update of slow coronary tone.
 *
 * Low achieved flow relative to demand dilates (lower scale); high perfusion
 * pressure evokes myogenic constriction. The state relaxes in log-resistance
 * space, preserving positivity and exact first-order time-step composition.
 */
export function stepCoronaryAutoregulationV1(
  previousAcceptedState: CoronaryToneAcceptedStateV1,
  input: CoronaryAutoregulationAcceptedInputV1,
  prior: CoronaryAutoregulationPriorV1,
): CoronaryAutoregulationStepV1 {
  validateCoronaryAutoregulationPriorV1(prior);
  if (
    !Number.isFinite(previousAcceptedState.resistanceScale)
    || previousAcceptedState.resistanceScale <= 0
  ) {
    throw new RangeError("accepted coronary resistance scale must be positive and finite");
  }
  for (const [name, value] of [
    ["stepDtSec", input.stepDtSec],
    ["acceptedMeanFlowMlPerSec", input.acceptedMeanFlowMlPerSec],
    ["demandTargetFlowMlPerSec", input.demandTargetFlowMlPerSec],
    ["acceptedMeanPerfusionPressureMmHg", input.acceptedMeanPerfusionPressureMmHg],
    ["hyperemia01", input.hyperemia01],
  ] as const) {
    if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
  }
  if (input.stepDtSec < 0) throw new RangeError("stepDtSec must be non-negative");
  if (input.acceptedMeanFlowMlPerSec < 0) {
    throw new RangeError("accepted mean coronary flow must be non-negative");
  }
  if (input.demandTargetFlowMlPerSec <= 0) {
    throw new RangeError("coronary demand target flow must be positive");
  }
  if (input.acceptedMeanPerfusionPressureMmHg < 0) {
    throw new RangeError("mean coronary perfusion pressure must be non-negative");
  }
  if (input.hyperemia01 < 0 || input.hyperemia01 > 1) {
    throw new RangeError("hyperemia01 must lie in [0, 1]");
  }

  const signalFloor = prior.minimumSignalFraction;
  const normalizedFlow = Math.max(
    input.acceptedMeanFlowMlPerSec / input.demandTargetFlowMlPerSec,
    signalFloor,
  );
  const normalizedPressure = Math.max(
    input.acceptedMeanPerfusionPressureMmHg
      / prior.referencePerfusionPressureMmHg,
    signalFloor,
  );
  const endogenousTargetLogScale =
    prior.metabolicFlowErrorGain * Math.log(normalizedFlow)
    + prior.myogenicPressureGain * Math.log(normalizedPressure);
  const minLog = Math.log(prior.minimumResistanceScale);
  const maxLog = Math.log(prior.maximumResistanceScale);
  const boundedEndogenousTargetLog = clamp(
    endogenousTargetLogScale,
    minLog,
    maxLog,
  );
  const targetLogScale =
    (1 - input.hyperemia01) * boundedEndogenousTargetLog
    + input.hyperemia01 * minLog;
  const relaxationFraction = input.stepDtSec === 0
    ? 0
    : -Math.expm1(-input.stepDtSec / prior.responseTimeConstantSec);
  const previousLogScale = clamp(
    Math.log(previousAcceptedState.resistanceScale),
    minLog,
    maxLog,
  );
  const nextLogScale = clamp(
    previousLogScale
      + relaxationFraction * (targetLogScale - previousLogScale),
    minLog,
    maxLog,
  );
  const resistanceScale = Math.exp(nextLogScale);
  const targetResistanceScale = Math.exp(targetLogScale);
  const tone01 = (nextLogScale - minLog) / (maxLog - minLog);
  const tolerance = 1e-12;
  const boundedAt = nextLogScale <= minLog + tolerance
    ? "minimum"
    : nextLogScale >= maxLog - tolerance
      ? "maximum"
      : "interior";
  return Object.freeze({
    state: Object.freeze({ resistanceScale }),
    targetResistanceScale,
    tone01,
    relaxationFraction,
    boundedAt,
  });
}

export function stepCoronaryAutoregulationByTerritoryV1(
  previousAcceptedState: CoronaryTerritoryRecordV1<CoronaryToneAcceptedStateV1>,
  input: CoronaryTerritoryRecordV1<CoronaryAutoregulationAcceptedInputV1>,
  prior: CoronaryTerritoryRecordV1<CoronaryAutoregulationPriorV1>,
): CoronaryTerritoryRecordV1<CoronaryAutoregulationStepV1> {
  return Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V1.map((territoryId) => [
      territoryId,
      stepCoronaryAutoregulationV1(
        previousAcceptedState[territoryId],
        input[territoryId],
        prior[territoryId],
      ),
    ]),
  )) as CoronaryTerritoryRecordV1<CoronaryAutoregulationStepV1>;
}

export function validateCoronaryAutoregulationPriorV1(
  prior: CoronaryAutoregulationPriorV1,
): void {
  for (const [name, value] of [
    ["minimumResistanceScale", prior.minimumResistanceScale],
    ["maximumResistanceScale", prior.maximumResistanceScale],
    ["responseTimeConstantSec", prior.responseTimeConstantSec],
    ["referencePerfusionPressureMmHg", prior.referencePerfusionPressureMmHg],
    ["minimumSignalFraction", prior.minimumSignalFraction],
  ] as const) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} must be positive and finite`);
    }
  }
  if (prior.minimumResistanceScale >= prior.maximumResistanceScale) {
    throw new RangeError("minimum coronary resistance scale must be below maximum");
  }
  if (prior.minimumSignalFraction >= 1) {
    throw new RangeError("minimum signal fraction must be below one");
  }
  for (const [name, value] of [
    ["myogenicPressureGain", prior.myogenicPressureGain],
    ["metabolicFlowErrorGain", prior.metabolicFlowErrorGain],
  ] as const) {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(`${name} must be finite and non-negative`);
    }
  }
}

function clamp(value: number, lower: number, upper: number): number {
  return Math.min(upper, Math.max(lower, value));
}
