import {
  stepCoronaryAutoregulationV1,
  validateCoronaryAutoregulationPriorV1,
  type CoronaryAutoregulationPriorV1,
} from "@/engine/coronary/autoregulationV1";
import {
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
  type CoronaryTopologyPriorV2,
} from "@/engine/coronary/topologyPriorV2";
import {
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryTerritoryLayerRecordV2,
  type CoronaryTerritoryRecordV2,
  type CoronaryToneStateV2,
} from "@/engine/coronary/typesV2";

export const NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2 = Object.freeze({
  // Chilian et al.: pharmacologic microvascular resistance fell 45 -> 4.
  // This is a dilation-reserve floor, not a fitted resting waveform knob.
  minimumResistanceScale: 4 / 45,
  maximumResistanceScale: 2,
  // Construction coefficient for this deliberately reduced integral
  // controller. It is not a conversion of a reported output t50 into a
  // first-order time constant, and the implementation does not reproduce the
  // Dankelman measurement station or protocol. Offline steady search may
  // accelerate iteration, but live accepted-time execution must not.
  responseTimeConstantSec: 25,
  // Retained for the legacy leaky-target ablation. The accepted integral law
  // deliberately has no steady pressure bias: away from a tone bound its only
  // equilibrium is Qm = demand. Myogenic feed-forward needs a separately
  // owned transient state before it can be reintroduced without shifting the
  // homeostatic operating point.
  referencePerfusionPressureMmHg: 85 * 0.68,
  myogenicPressureGain: 0,
  metabolicFlowErrorGain: 1,
  minimumSignalFraction: 0.05,
}) satisfies CoronaryAutoregulationPriorV1;

export type CoronaryAutoregulationLawV2 =
  | "leaky-target-v1"
  | "integral-flow-homeostasis-v2";

export type CoronaryAutoregulationAcceptedAggregateV2 = Readonly<{
  /** Accepted-cycle mean Qm, never an instantaneous or Newton-trial flow. */
  meanTissueFlowMlPerSecByTerritoryLayer:
    CoronaryTerritoryLayerRecordV2<number>;
  /** Mean post-focal-lesion pressure minus common CV pressure. */
  meanPerfusionPressureMmHgByTerritory: CoronaryTerritoryRecordV2<number>;
  /** Demand multiplier; 1 is the mass/flow-prior normal resting target. */
  demandScaleByTerritoryLayer: CoronaryTerritoryLayerRecordV2<number>;
  /** 0 endogenous regulation; 1 fixed maximal pharmacological dilation. */
  hyperemia01ByTerritoryLayer: CoronaryTerritoryLayerRecordV2<number>;
  acceptedWindowDurationSec: number;
}>;

export type CoronaryAutoregulationLayerStepV2 = Readonly<{
  achievedMeanTissueFlowMlPerSec: number;
  demandTargetFlowMlPerSec: number;
  meanPerfusionPressureMmHg: number;
  previousResistanceScale: number;
  targetResistanceScale: number;
  law: CoronaryAutoregulationLawV2;
  controlSignalLogPerTimeConstant: number;
  nextResistanceScale: number;
  tone01: number;
  relaxationFraction: number;
  boundedAt: "minimum" | "maximum" | "interior";
}>;

export type CoronaryAutoregulationAcceptedStepV2 = Readonly<{
  nextToneResistanceScaleByTerritoryLayer: CoronaryToneStateV2;
  layerStepByTerritoryLayer:
    CoronaryTerritoryLayerRecordV2<CoronaryAutoregulationLayerStepV2>;
  maximumAbsoluteLogToneChange: number;
}>;

/**
 * Advance the six slow layer-tone states from accepted cycle aggregates.
 *
 * The hydraulic solver remains purely passive during every Newton trial. This
 * operator runs only after an accepted averaging window and changes R1 tone;
 * C1/C2 volume, structural CMD, focal stenosis, and Rm/R2 are separate owners.
 */
export function stepCoronaryAutoregulationByTerritoryLayerV2(
  previousTone: CoronaryToneStateV2,
  aggregate: CoronaryAutoregulationAcceptedAggregateV2,
  options: Readonly<{
    topologyPrior?: CoronaryTopologyPriorV2;
    regulationPrior?: CoronaryAutoregulationPriorV1;
    law?: CoronaryAutoregulationLawV2;
    /** Layer-specific structural/CMD floor used to prevent hidden wind-up. */
    effectiveMinimumResistanceScaleByTerritoryLayer?:
      CoronaryTerritoryLayerRecordV2<number>;
  }> = {},
): CoronaryAutoregulationAcceptedStepV2 {
  const topologyPrior = options.topologyPrior
    ?? NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2;
  const regulationPrior = options.regulationPrior
    ?? NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2;
  const law = options.law ?? "integral-flow-homeostasis-v2";
  validateCoronaryAutoregulationPriorV1(regulationPrior);
  if (
    !Number.isFinite(aggregate.acceptedWindowDurationSec)
    || aggregate.acceptedWindowDurationSec < 0
  ) {
    throw new RangeError("acceptedWindowDurationSec must be finite and non-negative");
  }

  let maximumAbsoluteLogToneChange = 0;
  const layerStepByTerritoryLayer = Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V2.map((territoryId) => [territoryId,
      Object.freeze(Object.fromEntries(CORONARY_LAYER_IDS_V2.map((layerId) => {
        const achievedFlow = aggregate
          .meanTissueFlowMlPerSecByTerritoryLayer[territoryId][layerId];
        const demandScale = aggregate
          .demandScaleByTerritoryLayer[territoryId][layerId];
        const hyperemia01 = aggregate
          .hyperemia01ByTerritoryLayer[territoryId][layerId];
        if (!Number.isFinite(demandScale) || demandScale <= 0) {
          throw new RangeError(`${territoryId}.${layerId} demand scale must be positive`);
        }
        const targetFlow = topologyPrior.territories[territoryId]
          .targetRestingFlowMlPerMin / 60
          * topologyPrior.territories[territoryId].layers[layerId]
            .restingFlowFractionWithinTerritory01
          * demandScale;
        const previousResistanceScale = previousTone[territoryId][layerId];
        const meanPerfusionPressureMmHg =
          aggregate.meanPerfusionPressureMmHgByTerritory[territoryId];
        const suppliedMinimum = options
          .effectiveMinimumResistanceScaleByTerritoryLayer?.[territoryId][layerId]
          ?? regulationPrior.minimumResistanceScale;
        if (!Number.isFinite(suppliedMinimum) || suppliedMinimum <= 0) {
          throw new RangeError(
            `${territoryId}.${layerId} effective minimum tone must be positive`,
          );
        }
        const effectiveMinimum = Math.max(
          regulationPrior.minimumResistanceScale,
          suppliedMinimum,
        );
        if (effectiveMinimum >= regulationPrior.maximumResistanceScale) {
          throw new RangeError(
            `${territoryId}.${layerId} effective minimum tone must be below the maximum`,
          );
        }
        const layerRegulationPrior = effectiveMinimum
          === regulationPrior.minimumResistanceScale
          ? regulationPrior
          : Object.freeze({
            ...regulationPrior,
            minimumResistanceScale: effectiveMinimum,
          });
        const stepped = law === "leaky-target-v1"
          ? leakyTargetStepV2({
            previousResistanceScale,
            achievedFlow,
            targetFlow,
            meanPerfusionPressureMmHg,
            hyperemia01,
            stepDtSec: aggregate.acceptedWindowDurationSec,
          }, layerRegulationPrior)
          : integralHomeostaticStepV2({
            previousResistanceScale,
            achievedFlow,
            targetFlow,
            meanPerfusionPressureMmHg,
            hyperemia01,
            stepDtSec: aggregate.acceptedWindowDurationSec,
          }, layerRegulationPrior);
        maximumAbsoluteLogToneChange = Math.max(
          maximumAbsoluteLogToneChange,
          Math.abs(
            Math.log(stepped.nextResistanceScale)
            - Math.log(previousResistanceScale),
          ),
        );
        return [layerId, Object.freeze({
          achievedMeanTissueFlowMlPerSec: achievedFlow,
          demandTargetFlowMlPerSec: targetFlow,
          meanPerfusionPressureMmHg,
          previousResistanceScale,
          targetResistanceScale: stepped.targetResistanceScale,
          nextResistanceScale: stepped.nextResistanceScale,
          law,
          controlSignalLogPerTimeConstant:
            stepped.controlSignalLogPerTimeConstant,
          tone01: stepped.tone01,
          relaxationFraction: stepped.relaxationFraction,
          boundedAt: stepped.boundedAt,
        })];
      }))),
    ]),
  )) as CoronaryTerritoryLayerRecordV2<CoronaryAutoregulationLayerStepV2>;

  const nextToneResistanceScaleByTerritoryLayer = Object.freeze(
    Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
      territoryId,
      Object.freeze(Object.fromEntries(CORONARY_LAYER_IDS_V2.map((layerId) => [
        layerId,
        layerStepByTerritoryLayer[territoryId][layerId].nextResistanceScale,
      ]))),
    ])),
  ) as CoronaryToneStateV2;

  return Object.freeze({
    nextToneResistanceScaleByTerritoryLayer,
    layerStepByTerritoryLayer,
    maximumAbsoluteLogToneChange,
  });
}

type ScalarStepInputV2 = Readonly<{
  previousResistanceScale: number;
  achievedFlow: number;
  targetFlow: number;
  meanPerfusionPressureMmHg: number;
  hyperemia01: number;
  stepDtSec: number;
}>;

type ScalarStepResultV2 = Readonly<{
  nextResistanceScale: number;
  targetResistanceScale: number;
  controlSignalLogPerTimeConstant: number;
  tone01: number;
  relaxationFraction: number;
  boundedAt: "minimum" | "maximum" | "interior";
}>;

function leakyTargetStepV2(
  input: ScalarStepInputV2,
  prior: CoronaryAutoregulationPriorV1,
): ScalarStepResultV2 {
  const stepped = stepCoronaryAutoregulationV1(
    Object.freeze({ resistanceScale: input.previousResistanceScale }),
    {
      stepDtSec: input.stepDtSec,
      acceptedMeanFlowMlPerSec: input.achievedFlow,
      demandTargetFlowMlPerSec: input.targetFlow,
      acceptedMeanPerfusionPressureMmHg: input.meanPerfusionPressureMmHg,
      hyperemia01: input.hyperemia01,
    },
    prior,
  );
  return Object.freeze({
    nextResistanceScale: stepped.state.resistanceScale,
    targetResistanceScale: stepped.targetResistanceScale,
    controlSignalLogPerTimeConstant:
      Math.log(stepped.targetResistanceScale)
      - Math.log(input.previousResistanceScale),
    tone01: stepped.tone01,
    relaxationFraction: stepped.relaxationFraction,
    boundedAt: stepped.boundedAt,
  });
}

/**
 * Minimal supply-demand integrator in log R1.
 *
 * Unlike the V1 leaky target law, a held flow error continues to recruit
 * reserve until Qm meets demand (or a physiological tone bound is reached).
 * This is deliberately a reduced organ-level controller, not a claim that
 * flow itself is the sensed metabolite. Mean perfusion pressure remains an
 * accepted diagnostic and determines when the resistance floor exhausts
 * reserve, but it does not shift the interior steady-flow target. Focal loss,
 * CMD, and any future myogenic feed-forward state remain separate owners.
 */
function integralHomeostaticStepV2(
  input: ScalarStepInputV2,
  prior: CoronaryAutoregulationPriorV1,
): ScalarStepResultV2 {
  for (const [name, value] of [
    ["previousResistanceScale", input.previousResistanceScale],
    ["achievedFlow", input.achievedFlow],
    ["targetFlow", input.targetFlow],
    ["meanPerfusionPressureMmHg", input.meanPerfusionPressureMmHg],
    ["hyperemia01", input.hyperemia01],
    ["stepDtSec", input.stepDtSec],
  ] as const) {
    if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
  }
  if (input.previousResistanceScale <= 0 || input.targetFlow <= 0) {
    throw new RangeError("previous tone and demand flow must be positive");
  }
  if (input.achievedFlow < 0 || input.meanPerfusionPressureMmHg < 0) {
    throw new RangeError("accepted flow and perfusion pressure must be non-negative");
  }
  if (input.hyperemia01 < 0 || input.hyperemia01 > 1 || input.stepDtSec < 0) {
    throw new RangeError("hyperemia must lie in [0,1] and dt must be non-negative");
  }
  const minLog = Math.log(prior.minimumResistanceScale);
  const maxLog = Math.log(prior.maximumResistanceScale);
  const previousLog = clamp(
    Math.log(input.previousResistanceScale),
    minLog,
    maxLog,
  );
  const normalizedFlow = Math.max(
    input.achievedFlow / input.targetFlow,
    prior.minimumSignalFraction,
  );
  const controlSignalLogPerTimeConstant =
    prior.metabolicFlowErrorGain * Math.log(normalizedFlow);
  const normalizedDt = input.stepDtSec / prior.responseTimeConstantSec;
  const endogenousCandidateLog = previousLog
    + normalizedDt * controlSignalLogPerTimeConstant;
  const hyperemicCandidateLog = minLog
    + (previousLog - minLog) * Math.exp(-normalizedDt);
  const nextLog = clamp(
    (1 - input.hyperemia01) * endogenousCandidateLog
      + input.hyperemia01 * hyperemicCandidateLog,
    minLog,
    maxLog,
  );
  const targetLog = clamp(
    previousLog + controlSignalLogPerTimeConstant,
    minLog,
    maxLog,
  );
  const tolerance = 1e-12;
  return Object.freeze({
    // exp(log(bound)) can round one ULP outside a non-power-of-two bound
    // (notably 4/45). Re-project in the owned resistance domain so the
    // controller cannot produce a value rejected by its own exact bounds.
    nextResistanceScale: clamp(
      Math.exp(nextLog),
      prior.minimumResistanceScale,
      prior.maximumResistanceScale,
    ),
    // One time-constant held-signal projection, used only as a diagnostic.
    targetResistanceScale: clamp(
      Math.exp(targetLog),
      prior.minimumResistanceScale,
      prior.maximumResistanceScale,
    ),
    controlSignalLogPerTimeConstant,
    tone01: (nextLog - minLog) / (maxLog - minLog),
    relaxationFraction: normalizedDt,
    boundedAt: nextLog <= minLog + tolerance
      ? "minimum"
      : nextLog >= maxLog - tolerance
        ? "maximum"
        : "interior",
  });
}

export function unitCoronaryDemandScaleV2():
CoronaryTerritoryLayerRecordV2<number> {
  return constantLayerRecordV2(1);
}

export function zeroCoronaryHyperemiaDriveV2():
CoronaryTerritoryLayerRecordV2<number> {
  return constantLayerRecordV2(0);
}

function constantLayerRecordV2(
  value: number,
): CoronaryTerritoryLayerRecordV2<number> {
  return Object.freeze(Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map(
    (territoryId) => [territoryId, Object.freeze(Object.fromEntries(
      CORONARY_LAYER_IDS_V2.map((layerId) => [layerId, value]),
    ))],
  ))) as CoronaryTerritoryLayerRecordV2<number>;
}

function clamp(value: number, lower: number, upper: number): number {
  return Math.min(upper, Math.max(lower, value));
}
