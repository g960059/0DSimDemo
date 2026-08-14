import type {
  MainWireIntegratedModelObservationV3,
  MainWireIntegratedModelPresentationAdvanceV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_ABSOLUTE_PRESSURE_ORDER_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_CHAMBER_ORDER_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_VALVE_ORDER_V1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";

export const MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_ID =
  "main-wire-integrated-model-output-registry-v5" as const;
export const MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_SCHEMA_VERSION =
  3 as const;
export const MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_FRAME_V3_ID =
  "main-wire-integrated-model-output-frame-v5" as const;

export type MainWireIntegratedModelOutputUnitV3 =
  | "1"
  | "bpm"
  | "L/min"
  | "mL"
  | "mmHg"
  | "mL/s";

export type MainWireIntegratedModelOutputQuantityKindV3 =
  | "volume"
  | "pressure"
  | "flow"
  | "phase"
  | "rate"
  | "derived";

export type MainWireIntegratedModelOutputSourceKindV3 =
  | "accepted-state"
  | "accepted-step-readback"
  | "completed-beat";

export type MainWireIntegratedModelOutputDefinitionV3<
  TId extends string = string,
> = Readonly<{
  outputId: TId;
  kind: "signal" | "metric";
  quantityKind: MainWireIntegratedModelOutputQuantityKindV3;
  unit: MainWireIntegratedModelOutputUnitV3;
  modelingStatus: "modeled";
  sourceKind: MainWireIntegratedModelOutputSourceKindV3;
  sourcePath: string;
  scope?: "beat";
  dependencies?: readonly string[];
}>;

export const MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3 = Object.freeze([
  ...(["LA", "LV", "RA", "RV"] as const).map((chamber) => definition(
    `hemodynamics.volume.${chamber}` as const,
    "volume",
    "mL",
    "accepted-state",
    `accepted.coronary.circulation.nodeVolumesMl.${chamber}`,
  )),
  ...(["LA", "LV", "RA", "RV"] as const).map((chamber) => definition(
    `hemodynamics.pressure.absolute.${chamber}` as const,
    "pressure",
    "mmHg",
    "accepted-step-readback",
    `step.coronaryStep.baseStep.circulationTrial.nodeAbsolutePressuresMmHg.${chamber}`,
  )),
  ...(["LA", "LV", "RA", "RV"] as const).map((chamber) => definition(
    `hemodynamics.pressure.transmural.${chamber}` as const,
    "pressure",
    "mmHg",
    "accepted-step-readback",
    `step.coronaryStep.baseStep.mechanicsTrial.transmuralPressuresMmHg.${chamber}`,
  )),
  ...(["Ao", "SA", "PA", "PVein", "VC"] as const).map((vessel) => definition(
    `hemodynamics.pressure.absolute.${vessel}` as const,
    "pressure",
    "mmHg",
    "accepted-step-readback",
    `step.coronaryStep.baseStep.circulationTrial.nodeAbsolutePressuresMmHg.${vessel}`,
  )),
  ...(["MV", "AoV", "TV", "PV"] as const).map((valve) => definition(
    `hemodynamics.flow.valve.${valve}` as const,
    "flow",
    "mL/s",
    "accepted-step-readback",
    `step.coronaryStep.baseStep.circulationTrial.valveEvaluations.${valve}.flowMlPerSec`,
  )),
  definition(
    "hemodynamics.flow.systemic.SA_Art",
    "flow",
    "mL/s",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.circulationTrial.edgeFlowsMlPerSec.SA_Art",
  ),
  definition(
    "hemodynamics.flow.pulmonary.PA_PArt",
    "flow",
    "mL/s",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.circulationTrial.edgeFlowsMlPerSec.PA_PArt",
  ),
  definition(
    "hemodynamics.flow.venous.VC_RA",
    "flow",
    "mL/s",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.circulationTrial.edgeFlowsMlPerSec.VC_RA",
  ),
  definition(
    "hemodynamics.flow.venous.PVein_LA",
    "flow",
    "mL/s",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.circulationTrial.edgeFlowsMlPerSec.PVein_LA",
  ),
  definition(
    "pericardium.pressure.excess",
    "pressure",
    "mmHg",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.pericardium.excessPressureMmHg",
  ),
  definition(
    "respiration.pressure.pleural",
    "pressure",
    "mmHg",
    "accepted-state",
    "observation.runtimeSignals.pleuralPressureMmHg",
  ),
  definition(
    "respiration.pressure.alveolar",
    "pressure",
    "mmHg",
    "accepted-state",
    "observation.runtimeSignals.alveolarPressureMmHg",
  ),
  definition(
    "rhythm.heart-rate.instantaneous",
    "rate",
    "bpm",
    "accepted-state",
    "derive.60/accepted.composedRhythm.regularAtrialSourceState.configuration.cycleLengthSec",
  ),
  definition(
    "coronary.flow.total",
    "flow",
    "mL/s",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.totalInletFlowMlPerSec",
  ),
  definition(
    "coronary.flow.inlet.LAD",
    "flow",
    "mL/s",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.inletFlowMlPerSecByTerritory.LAD",
  ),
  definition(
    "coronary.flow.inlet.LCx",
    "flow",
    "mL/s",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.inletFlowMlPerSecByTerritory.LCx",
  ),
  definition(
    "coronary.flow.inlet.RCA",
    "flow",
    "mL/s",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.inletFlowMlPerSecByTerritory.RCA",
  ),
  definition(
    "device.LVAD.flow",
    "flow",
    "mL/s",
    "accepted-state",
    "accepted.dynamicMechanicalSupport.acceptedFlowMlPerSec.LVAD",
  ),
  definition(
    "rhythm.phase.regular-sinus",
    "phase",
    "1",
    "accepted-state",
    "derive.regularSinusPhase01(accepted.composedRhythm.acceptedTimeSec,accepted.composedRhythm.regularAtrialSourceState.nextActivationTimeSec,accepted.composedRhythm.regularAtrialSourceState.configuration.cycleLengthSec)",
  ),
  metricDefinition(
    "hemodynamics.pressure.mean.Ao",
    "pressure",
    "mmHg",
    ["hemodynamics.pressure.absolute.Ao"],
    "completedBeatMetrics.meanAorticPressureMmHg",
  ),
  metricDefinition(
    "hemodynamics.pressure.systolic.Ao",
    "pressure",
    "mmHg",
    ["hemodynamics.pressure.absolute.Ao"],
    "completedBeatMetrics.systolicAorticPressureMmHg",
  ),
  metricDefinition(
    "hemodynamics.pressure.diastolic.Ao",
    "pressure",
    "mmHg",
    ["hemodynamics.pressure.absolute.Ao"],
    "completedBeatMetrics.diastolicAorticPressureMmHg",
  ),
  metricDefinition(
    "hemodynamics.pressure.pulse.Ao",
    "pressure",
    "mmHg",
    [
      "hemodynamics.pressure.systolic.Ao",
      "hemodynamics.pressure.diastolic.Ao",
    ],
    "completedBeatMetrics.pulseAorticPressureMmHg",
  ),
  metricDefinition(
    "hemodynamics.pressure.mean.PA",
    "pressure",
    "mmHg",
    ["hemodynamics.pressure.absolute.PA"],
    "completedBeatMetrics.meanPulmonaryArterialPressureMmHg",
  ),
  metricDefinition(
    "hemodynamics.pressure.mean.LA",
    "pressure",
    "mmHg",
    ["hemodynamics.pressure.absolute.LA"],
    "completedBeatMetrics.meanLeftAtrialPressureMmHg",
  ),
  metricDefinition(
    "hemodynamics.pressure.mean.RA",
    "pressure",
    "mmHg",
    ["hemodynamics.pressure.absolute.RA"],
    "completedBeatMetrics.meanRightAtrialPressureMmHg",
  ),
  metricDefinition(
    "hemodynamics.volume.maximum.LV",
    "volume",
    "mL",
    ["hemodynamics.volume.LV"],
    "completedBeatMetrics.maximumLeftVentricularVolumeMl",
  ),
  metricDefinition(
    "hemodynamics.volume.minimum.LV",
    "volume",
    "mL",
    ["hemodynamics.volume.LV"],
    "completedBeatMetrics.minimumLeftVentricularVolumeMl",
  ),
  metricDefinition(
    "hemodynamics.stroke-volume.LV-extrema",
    "derived",
    "mL",
    [
      "hemodynamics.volume.maximum.LV",
      "hemodynamics.volume.minimum.LV",
    ],
    "completedBeatMetrics.extremaLeftVentricularStrokeVolumeMl",
  ),
  metricDefinition(
    "hemodynamics.ejection-fraction.LV-extrema",
    "derived",
    "1",
    [
      "hemodynamics.volume.maximum.LV",
      "hemodynamics.volume.minimum.LV",
    ],
    "completedBeatMetrics.extremaLeftVentricularEjectionFraction01",
  ),
  metricDefinition(
    "hemodynamics.output.native-left",
    "flow",
    "L/min",
    ["hemodynamics.flow.valve.AoV"],
    "completedBeatMetrics.nativeLeftCardiacOutputLPerMin",
  ),
  metricDefinition(
    "hemodynamics.output.systemic-tissue",
    "flow",
    "L/min",
    ["hemodynamics.flow.systemic.SA_Art"],
    "completedBeatMetrics.systemicTissueOutputLPerMin",
  ),
  metricDefinition(
    "hemodynamics.output.pulmonary",
    "flow",
    "L/min",
    ["hemodynamics.flow.pulmonary.PA_PArt"],
    "completedBeatMetrics.pulmonaryOutputLPerMin",
  ),
] as const);

export type MainWireIntegratedModelOutputIdV3 =
  (typeof MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3)[number][
    "outputId"
  ];

export const MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3 = Object.freeze(
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.map(
    ({ outputId }) => outputId,
  ),
) as readonly MainWireIntegratedModelOutputIdV3[];

/**
 * Runtime status fields remain outside the output catalog and durable data.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_STATUS_FIELDS_V3 = Object.freeze([
  "model-time",
  "accepted-revision",
  "internal-substep-count",
  "atrial-capture-count",
  "ventricular-capture-count",
  "rhythm-label",
  "mcs-label",
  "pacing-state",
] as const);

export type MainWireIntegratedModelOutputValueV3 = Readonly<{
  outputId: MainWireIntegratedModelOutputIdV3;
  value: number | null;
  availability: "available" | "not-evaluated-at-accepted-state";
  quality: "authoritative-state" | "accepted-derived" | "not-assessed";
}>;

/**
 * Model time, accepted revision, substep and capture counts, rhythm and MCS
 * labels, and pacing belong to runtime status. This frame does not publish
 * them.
 */
export type MainWireIntegratedModelOutputFrameV3 = Readonly<{
  frameId: typeof MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_FRAME_V3_ID;
  registryId: typeof MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_ID;
  schemaVersion:
    typeof MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_SCHEMA_VERSION;
  values: Readonly<Record<
    MainWireIntegratedModelOutputIdV3,
    MainWireIntegratedModelOutputValueV3
  >>;
}>;

export const MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_SNAPSHOT_V3 =
  Object.freeze({
    registryId: MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_ID,
    schemaVersion:
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_SCHEMA_VERSION,
    frameId: MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_FRAME_V3_ID,
    catalog: MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3,
    unavailableValuePolicy: "null-never-zero" as const,
    availabilityAndQualityAreSeparate: true as const,
  });

export class MainWireIntegratedModelOutputProjectionErrorV3 extends Error {
  constructor(message: string) {
    super(`Main Wire Integrated V3 output projection rejected: ${message}`);
    this.name = "MainWireIntegratedModelOutputProjectionErrorV3";
  }
}

/**
 * Projects the session's retained observation. Cold and restored observations
 * have no accepted-step readback, so only accepted-state values are available.
 */
export function projectMainWireIntegratedModelObservationV3(
  observation: MainWireIntegratedModelObservationV3,
): MainWireIntegratedModelOutputFrameV3 {
  const values = projectMainWireIntegratedModelSelectedValuesV3(
    observation,
    MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
  ) as Readonly<Record<
    MainWireIntegratedModelOutputIdV3,
    MainWireIntegratedModelOutputValueV3
  >>;

  return Object.freeze({
    frameId: MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_FRAME_V3_ID,
    registryId: MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_ID,
    schemaVersion:
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_SCHEMA_VERSION,
    values: Object.freeze(values),
  });
}

/**
 * Projects only the exact scalar signals requested by the presentation owner.
 * It shares the same projector as the complete frame, so adding autonomic,
 * oxygen-delivery or multipatch outputs does not force hidden signals into the
 * live hot path and cannot create a second numerical meaning.
 */
export function projectMainWireIntegratedModelSelectedValuesV3(
  observation: MainWireIntegratedModelObservationV3,
  outputIds: readonly MainWireIntegratedModelOutputIdV3[],
): Readonly<Record<string, MainWireIntegratedModelOutputValueV3>> {
  assertObservationReadbackPairV3(observation);
  const values: Record<string, MainWireIntegratedModelOutputValueV3> = {};
  const seen = new Set<MainWireIntegratedModelOutputIdV3>();
  for (const outputId of outputIds) {
    if (seen.has(outputId)) {
      throw new MainWireIntegratedModelOutputProjectionErrorV3(
        `selected output ${outputId} is duplicated`,
      );
    }
    seen.add(outputId);
    values[outputId] = projectMainWireIntegratedModelOutputValueV3(
      observation.acceptedState,
      observation.runtimeSignals,
      observation.completedBeatMetrics,
      observation.lastAcceptedStep,
      null,
      outputId,
    );
  }
  return Object.freeze(values);
}

export type MainWireIntegratedModelNumericalProjectionInputV1 = Readonly<{
  acceptedTimeSec: number;
  regularSinusCycleLengthSec: number;
  regularSinusNextActivationTimeSec: number;
  dynamicMechanicalSupportLvadFlowMlPerSec: number;
  runtimeSignals: MainWireIntegratedModelObservationV3["runtimeSignals"];
  completedBeatMetrics:
    MainWireIntegratedModelObservationV3["completedBeatMetrics"];
  /** Borrowed selected-root readback; projection never retains this buffer. */
  acceptedNumericalReadback: Float64Array;
}>;

/**
 * Projects directly from the admitted fixed readback. No public accepted-step
 * trial or coronary hydraulic diagnostic graph is required.
 */
export function projectMainWireIntegratedModelSelectedValuesFromNumericalReadbackV1(
  input: MainWireIntegratedModelNumericalProjectionInputV1,
  outputIds: readonly MainWireIntegratedModelOutputIdV3[],
): Readonly<Record<string, MainWireIntegratedModelOutputValueV3>> {
  const readback = input.acceptedNumericalReadback;
  if (
    !(readback instanceof Float64Array)
    || readback.length
      !== MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1
  ) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      "accepted numerical readback must contain exactly 32 f64 values",
    );
  }
  const acceptedTimeSec = input.acceptedTimeSec;
  if (
    !Number.isFinite(acceptedTimeSec)
    || readback[MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1.timeSec]
      !== acceptedTimeSec
  ) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      "accepted numerical readback clock differs from typed presentation state",
    );
  }
  const values: Record<string, MainWireIntegratedModelOutputValueV3> = {};
  const seen = new Set<MainWireIntegratedModelOutputIdV3>();
  for (const outputId of outputIds) {
    if (seen.has(outputId)) {
      throw new MainWireIntegratedModelOutputProjectionErrorV3(
        `selected output ${outputId} is duplicated`,
      );
    }
    seen.add(outputId);
    values[outputId] = projectMainWireIntegratedModelOutputValueV3(
      undefined,
      input.runtimeSignals,
      input.completedBeatMetrics,
      null,
      readback,
      outputId,
      Object.freeze({
        acceptedTimeSec,
        regularSinusCycleLengthSec: input.regularSinusCycleLengthSec,
        regularSinusNextActivationTimeSec:
          input.regularSinusNextActivationTimeSec,
        dynamicMechanicalSupportLvadFlowMlPerSec:
          input.dynamicMechanicalSupportLvadFlowMlPerSec,
      }),
    );
  }
  return Object.freeze(values);
}

function projectMainWireIntegratedModelOutputValueV3(
  accepted: MainWireIntegratedModelObservationV3["acceptedState"] | undefined,
  runtimeSignals: MainWireIntegratedModelObservationV3["runtimeSignals"],
  completedBeatMetrics:
    MainWireIntegratedModelObservationV3["completedBeatMetrics"],
  step: MainWireIntegratedModelObservationV3["lastAcceptedStep"],
  numericalReadback: Float64Array | null,
  outputId: MainWireIntegratedModelOutputIdV3,
  typedState?: Readonly<{
    acceptedTimeSec: number;
    regularSinusCycleLengthSec: number;
    regularSinusNextActivationTimeSec: number;
    dynamicMechanicalSupportLvadFlowMlPerSec: number;
  }>,
): MainWireIntegratedModelOutputValueV3 {
  const layout = MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1;
  switch (outputId) {
    case "hemodynamics.volume.LA":
    case "hemodynamics.volume.LV":
    case "hemodynamics.volume.RA":
    case "hemodynamics.volume.RV": {
      const chamber = outputId.slice(-2) as "LA" | "LV" | "RA" | "RV";
      const readbackIndex =
        MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_CHAMBER_ORDER_V1
          .indexOf(chamber);
      return availableValue(
        outputId,
        numericalReadback === null
          ? requiredAcceptedStateV3(accepted)
            .coronary.circulation.nodeVolumesMl[chamber]
          : numericalReadback[layout.chamberVolumeMl + readbackIndex]!,
        "authoritative-state",
      );
    }
    case "hemodynamics.pressure.absolute.LA":
    case "hemodynamics.pressure.absolute.LV":
    case "hemodynamics.pressure.absolute.RA":
    case "hemodynamics.pressure.absolute.RV":
    case "hemodynamics.pressure.absolute.Ao":
    case "hemodynamics.pressure.absolute.SA":
    case "hemodynamics.pressure.absolute.PA":
    case "hemodynamics.pressure.absolute.PVein":
    case "hemodynamics.pressure.absolute.VC": {
      const node = outputId.slice("hemodynamics.pressure.absolute.".length) as
        "LA" | "LV" | "RA" | "RV" | "Ao" | "SA" | "PA" | "PVein" | "VC";
      return readbackValue(
        outputId,
        numericalReadback === null
          ? step?.coronaryStep.baseStep.circulationTrial
            .nodeAbsolutePressuresMmHg[node]
          : numericalReadback[
            layout.absolutePressureMmHg
              + MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_ABSOLUTE_PRESSURE_ORDER_V1
                .indexOf(node)
          ],
      );
    }
    case "hemodynamics.pressure.transmural.LA":
    case "hemodynamics.pressure.transmural.LV":
    case "hemodynamics.pressure.transmural.RA":
    case "hemodynamics.pressure.transmural.RV": {
      const chamber = outputId.slice(-2) as "LA" | "LV" | "RA" | "RV";
      return readbackValue(
        outputId,
        numericalReadback === null
          ? step?.coronaryStep.baseStep.mechanicsTrial
            .transmuralPressuresMmHg[chamber]
          : numericalReadback[
            layout.transmuralPressureMmHg
              + MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_CHAMBER_ORDER_V1
                .indexOf(chamber)
          ],
      );
    }
    case "hemodynamics.flow.valve.MV":
    case "hemodynamics.flow.valve.AoV":
    case "hemodynamics.flow.valve.TV":
    case "hemodynamics.flow.valve.PV": {
      const valve = outputId.slice("hemodynamics.flow.valve.".length) as
        "MV" | "AoV" | "TV" | "PV";
      return readbackValue(
        outputId,
        numericalReadback === null
          ? step?.coronaryStep.baseStep.circulationTrial
            .valveEvaluations[valve].flowMlPerSec
          : numericalReadback[
            layout.valveFlowMlPerSec
              + MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_VALVE_ORDER_V1
                .indexOf(valve)
          ],
      );
    }
    case "hemodynamics.flow.systemic.SA_Art":
      return readbackValue(
        outputId,
        numericalReadback?.[layout.systemicTissueFlowMlPerSec]
          ?? step?.coronaryStep.baseStep.circulationTrial
            .edgeFlowsMlPerSec.SA_Art,
      );
    case "hemodynamics.flow.pulmonary.PA_PArt":
      return readbackValue(
        outputId,
        numericalReadback?.[layout.pulmonaryFlowMlPerSec]
          ?? step?.coronaryStep.baseStep.circulationTrial
            .edgeFlowsMlPerSec.PA_PArt,
      );
    case "hemodynamics.flow.venous.VC_RA":
      return readbackValue(
        outputId,
        numericalReadback?.[layout.systemicVenousFlowMlPerSec]
          ?? step?.coronaryStep.baseStep.circulationTrial
            .edgeFlowsMlPerSec.VC_RA,
      );
    case "hemodynamics.flow.venous.PVein_LA":
      return readbackValue(
        outputId,
        numericalReadback?.[layout.pulmonaryVenousFlowMlPerSec]
          ?? step?.coronaryStep.baseStep.circulationTrial
            .edgeFlowsMlPerSec.PVein_LA,
      );
    case "pericardium.pressure.excess":
      return readbackValue(
        outputId,
        numericalReadback?.[layout.pericardialExcessPressureMmHg]
          ?? step?.coronaryStep.baseStep.pericardium.excessPressureMmHg,
      );
    case "respiration.pressure.pleural":
      return availableValue(
        outputId,
        runtimeSignals.pleuralPressureMmHg,
        "accepted-derived",
      );
    case "respiration.pressure.alveolar":
      return availableValue(
        outputId,
        runtimeSignals.alveolarPressureMmHg,
        "accepted-derived",
      );
    case "rhythm.heart-rate.instantaneous":
      return availableValue(
        outputId,
        typedState?.regularSinusCycleLengthSec === undefined
          ? regularSinusHeartRateBpmV3(
              requiredAcceptedStateV3(accepted).composedRhythm,
            )
          : 60 / positiveCycleLengthSecV3(
              typedState.regularSinusCycleLengthSec,
            ),
        "accepted-derived",
      );
    case "coronary.flow.total":
      return readbackValue(
        outputId,
        numericalReadback?.[layout.coronaryFlowMlPerSec]
          ?? step?.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics
            .totalInletFlowMlPerSec,
      );
    case "coronary.flow.inlet.LAD":
    case "coronary.flow.inlet.LCx":
    case "coronary.flow.inlet.RCA": {
      const territory = outputId.slice("coronary.flow.inlet.".length) as
        "LAD" | "LCx" | "RCA";
      const territoryIndex = territory === "LAD" ? 0
        : territory === "LCx" ? 1 : 2;
      return readbackValue(
        outputId,
        numericalReadback?.[layout.coronaryFlowMlPerSec + 1 + territoryIndex]
          ?? step?.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics
            .inletFlowMlPerSecByTerritory[territory],
      );
    }
    case "device.LVAD.flow":
      return availableValue(
        outputId,
        typedState?.dynamicMechanicalSupportLvadFlowMlPerSec
          ?? requiredAcceptedStateV3(accepted)
            .dynamicMechanicalSupport.acceptedFlowMlPerSec.LVAD,
        "authoritative-state",
      );
    case "rhythm.phase.regular-sinus":
      return availableValue(
        outputId,
        typedState?.regularSinusCycleLengthSec === undefined
          || typedState.regularSinusNextActivationTimeSec === undefined
          ? regularSinusPhase01V3(
              requiredAcceptedStateV3(accepted).composedRhythm,
            )
          : regularSinusPhaseFromClockV3(
              typedState.acceptedTimeSec,
              typedState.regularSinusCycleLengthSec,
              typedState.regularSinusNextActivationTimeSec,
            ),
        "accepted-derived",
      );
    case "hemodynamics.pressure.mean.Ao":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.meanAorticPressureMmHg,
      );
    case "hemodynamics.pressure.systolic.Ao":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.systolicAorticPressureMmHg,
      );
    case "hemodynamics.pressure.diastolic.Ao":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.diastolicAorticPressureMmHg,
      );
    case "hemodynamics.pressure.pulse.Ao":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.pulseAorticPressureMmHg,
      );
    case "hemodynamics.pressure.mean.PA":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.meanPulmonaryArterialPressureMmHg,
      );
    case "hemodynamics.pressure.mean.LA":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.meanLeftAtrialPressureMmHg,
      );
    case "hemodynamics.pressure.mean.RA":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.meanRightAtrialPressureMmHg,
      );
    case "hemodynamics.volume.maximum.LV":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.maximumLeftVentricularVolumeMl,
      );
    case "hemodynamics.volume.minimum.LV":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.minimumLeftVentricularVolumeMl,
      );
    case "hemodynamics.stroke-volume.LV-extrema":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.extremaLeftVentricularStrokeVolumeMl,
      );
    case "hemodynamics.ejection-fraction.LV-extrema":
      return beatMetricValue(
        outputId,
        completedBeatMetrics
          ?.extremaLeftVentricularEjectionFraction01,
      );
    case "hemodynamics.output.native-left":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.nativeLeftCardiacOutputLPerMin,
      );
    case "hemodynamics.output.systemic-tissue":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.systemicTissueOutputLPerMin,
      );
    case "hemodynamics.output.pulmonary":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.pulmonaryOutputLPerMin,
      );
  }
}

/**
 * Presentation calls emit a frame only for an advanced result. Already-at-
 * target and failed calls do not represent a newly accepted sample.
 */
export function projectMainWireIntegratedModelAdvancedFrameV3(
  advance: MainWireIntegratedModelPresentationAdvanceV3,
): MainWireIntegratedModelOutputFrameV3 {
  if (advance.status !== "advanced") {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      `${advance.status} presentation advance has no new sample`,
    );
  }
  return projectMainWireIntegratedModelObservationV3(advance.observation);
}

function definition<TId extends string>(
  outputId: TId,
  quantityKind: MainWireIntegratedModelOutputQuantityKindV3,
  unit: MainWireIntegratedModelOutputUnitV3,
  sourceKind: MainWireIntegratedModelOutputSourceKindV3,
  sourcePath: string,
): MainWireIntegratedModelOutputDefinitionV3<TId> {
  return Object.freeze({
    outputId,
    kind: "signal" as const,
    quantityKind,
    unit,
    modelingStatus: "modeled" as const,
    sourceKind,
    sourcePath,
  });
}

function metricDefinition<TId extends string>(
  outputId: TId,
  quantityKind: MainWireIntegratedModelOutputQuantityKindV3,
  unit: MainWireIntegratedModelOutputUnitV3,
  dependencies: readonly string[],
  sourcePath: string,
): MainWireIntegratedModelOutputDefinitionV3<TId> {
  return Object.freeze({
    outputId,
    kind: "metric" as const,
    quantityKind,
    unit,
    modelingStatus: "modeled" as const,
    sourceKind: "completed-beat" as const,
    sourcePath,
    scope: "beat" as const,
    dependencies: Object.freeze([...dependencies]),
  });
}

function availableValue(
  outputId: MainWireIntegratedModelOutputIdV3,
  value: number,
  quality: "authoritative-state" | "accepted-derived",
): MainWireIntegratedModelOutputValueV3 {
  if (!Number.isFinite(value)) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      `${outputId} is available but is not finite`,
    );
  }
  return Object.freeze({
    outputId,
    value,
    availability: "available" as const,
    quality,
  });
}

function readbackValue(
  outputId: MainWireIntegratedModelOutputIdV3,
  value: number | undefined,
): MainWireIntegratedModelOutputValueV3 {
  return value === undefined
    ? Object.freeze({
        outputId,
        value: null,
        availability: "not-evaluated-at-accepted-state" as const,
        quality: "not-assessed" as const,
      })
    : availableValue(outputId, value, "accepted-derived");
}

function beatMetricValue(
  outputId: MainWireIntegratedModelOutputIdV3,
  value: number | undefined,
): MainWireIntegratedModelOutputValueV3 {
  return value === undefined
    ? Object.freeze({
        outputId,
        value: null,
        availability: "not-evaluated-at-accepted-state" as const,
        quality: "not-assessed" as const,
      })
    : availableValue(outputId, value, "accepted-derived");
}

function regularSinusHeartRateBpmV3(
  state:
    MainWireIntegratedModelObservationV3["acceptedState"]["composedRhythm"],
): number {
  const source = state.regularAtrialSourceState;
  if (
    source === null
    || source.configuration.rhythmClass !== "sinus"
    || !(source.configuration.cycleLengthSec > 0)
  ) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      "regular-sinus heart rate is unavailable for the accepted rhythm state",
    );
  }
  return 60 / source.configuration.cycleLengthSec;
}

function regularSinusPhase01V3(
  state:
    MainWireIntegratedModelObservationV3["acceptedState"]["composedRhythm"],
): number {
  const source = state.regularAtrialSourceState;
  if (
    source === null
    || source.configuration.rhythmClass !== "sinus"
    || !(source.configuration.cycleLengthSec > 0)
  ) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      "regular-sinus phase is unavailable for the accepted rhythm state",
    );
  }
  const cycleLengthSec = source.configuration.cycleLengthSec;
  const previousActivationTimeSec = source.nextActivationTimeSec
    - cycleLengthSec;
  const elapsedSec = state.acceptedTimeSec - previousActivationTimeSec;
  const wrappedSec = ((elapsedSec % cycleLengthSec) + cycleLengthSec)
    % cycleLengthSec;
  const phase01 = wrappedSec / cycleLengthSec;
  if (!Number.isFinite(phase01) || phase01 < 0 || phase01 >= 1) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      "regular-sinus phase is outside [0,1)",
    );
  }
  return phase01;
}

function requiredAcceptedStateV3(
  accepted: MainWireIntegratedModelObservationV3["acceptedState"] | undefined,
): MainWireIntegratedModelObservationV3["acceptedState"] {
  if (accepted === undefined) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      "selected output requires an accepted-state readback",
    );
  }
  return accepted;
}

function positiveCycleLengthSecV3(value: number): number {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      "regular-sinus cycle length is invalid",
    );
  }
  return value;
}

function regularSinusPhaseFromClockV3(
  acceptedTimeSec: number,
  cycleLengthSec: number,
  nextActivationTimeSec: number,
): number {
  const cycle = positiveCycleLengthSecV3(cycleLengthSec);
  if (
    !Number.isFinite(acceptedTimeSec)
    || acceptedTimeSec < 0
    || !Number.isFinite(nextActivationTimeSec)
    || !(nextActivationTimeSec > acceptedTimeSec)
  ) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      "regular-sinus accepted/activation clock is invalid",
    );
  }
  const previousActivationTimeSec = nextActivationTimeSec - cycle;
  const elapsedSec = acceptedTimeSec - previousActivationTimeSec;
  const wrappedSec = ((elapsedSec % cycle) + cycle) % cycle;
  return wrappedSec / cycle;
}

function assertObservationReadbackPairV3(
  observation: MainWireIntegratedModelObservationV3,
): void {
  if (
    observation.source === "presentation-target"
    && observation.lastAcceptedStep === null
  ) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      "presentation observation lacks its accepted-step readback",
    );
  }
  if (
    observation.source !== "presentation-target"
    && observation.lastAcceptedStep !== null
  ) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      `${observation.source} observation unexpectedly carries a step readback`,
    );
  }
}
