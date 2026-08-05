import type {
  MainWireIntegratedModelObservationV3,
  MainWireIntegratedModelPresentationAdvanceV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";

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
  const accepted = observation.acceptedState;
  const step = observation.lastAcceptedStep;
  assertObservationReadbackPairV3(observation);

  const values = {
    "hemodynamics.volume.LA": availableValue(
      "hemodynamics.volume.LA",
      accepted.coronary.circulation.nodeVolumesMl.LA,
      "authoritative-state",
    ),
    "hemodynamics.volume.LV": availableValue(
      "hemodynamics.volume.LV",
      accepted.coronary.circulation.nodeVolumesMl.LV,
      "authoritative-state",
    ),
    "hemodynamics.volume.RA": availableValue(
      "hemodynamics.volume.RA",
      accepted.coronary.circulation.nodeVolumesMl.RA,
      "authoritative-state",
    ),
    "hemodynamics.volume.RV": availableValue(
      "hemodynamics.volume.RV",
      accepted.coronary.circulation.nodeVolumesMl.RV,
      "authoritative-state",
    ),
    "hemodynamics.pressure.absolute.LA": readbackValue(
      "hemodynamics.pressure.absolute.LA",
      step?.coronaryStep.baseStep.circulationTrial
        .nodeAbsolutePressuresMmHg.LA,
    ),
    "hemodynamics.pressure.absolute.LV": readbackValue(
      "hemodynamics.pressure.absolute.LV",
      step?.coronaryStep.baseStep.circulationTrial
        .nodeAbsolutePressuresMmHg.LV,
    ),
    "hemodynamics.pressure.absolute.RA": readbackValue(
      "hemodynamics.pressure.absolute.RA",
      step?.coronaryStep.baseStep.circulationTrial
        .nodeAbsolutePressuresMmHg.RA,
    ),
    "hemodynamics.pressure.absolute.RV": readbackValue(
      "hemodynamics.pressure.absolute.RV",
      step?.coronaryStep.baseStep.circulationTrial
        .nodeAbsolutePressuresMmHg.RV,
    ),
    "hemodynamics.pressure.transmural.LA": readbackValue(
      "hemodynamics.pressure.transmural.LA",
      step?.coronaryStep.baseStep.mechanicsTrial
        .transmuralPressuresMmHg.LA,
    ),
    "hemodynamics.pressure.transmural.LV": readbackValue(
      "hemodynamics.pressure.transmural.LV",
      step?.coronaryStep.baseStep.mechanicsTrial
        .transmuralPressuresMmHg.LV,
    ),
    "hemodynamics.pressure.transmural.RA": readbackValue(
      "hemodynamics.pressure.transmural.RA",
      step?.coronaryStep.baseStep.mechanicsTrial
        .transmuralPressuresMmHg.RA,
    ),
    "hemodynamics.pressure.transmural.RV": readbackValue(
      "hemodynamics.pressure.transmural.RV",
      step?.coronaryStep.baseStep.mechanicsTrial
        .transmuralPressuresMmHg.RV,
    ),
    "hemodynamics.pressure.absolute.Ao": readbackValue(
      "hemodynamics.pressure.absolute.Ao",
      step?.coronaryStep.baseStep.circulationTrial
        .nodeAbsolutePressuresMmHg.Ao,
    ),
    "hemodynamics.pressure.absolute.SA": readbackValue(
      "hemodynamics.pressure.absolute.SA",
      step?.coronaryStep.baseStep.circulationTrial
        .nodeAbsolutePressuresMmHg.SA,
    ),
    "hemodynamics.pressure.absolute.PA": readbackValue(
      "hemodynamics.pressure.absolute.PA",
      step?.coronaryStep.baseStep.circulationTrial
        .nodeAbsolutePressuresMmHg.PA,
    ),
    "hemodynamics.pressure.absolute.PVein": readbackValue(
      "hemodynamics.pressure.absolute.PVein",
      step?.coronaryStep.baseStep.circulationTrial
        .nodeAbsolutePressuresMmHg.PVein,
    ),
    "hemodynamics.pressure.absolute.VC": readbackValue(
      "hemodynamics.pressure.absolute.VC",
      step?.coronaryStep.baseStep.circulationTrial
        .nodeAbsolutePressuresMmHg.VC,
    ),
    "hemodynamics.flow.valve.MV": readbackValue(
      "hemodynamics.flow.valve.MV",
      step?.coronaryStep.baseStep.circulationTrial
        .valveEvaluations.MV.flowMlPerSec,
    ),
    "hemodynamics.flow.valve.AoV": readbackValue(
      "hemodynamics.flow.valve.AoV",
      step?.coronaryStep.baseStep.circulationTrial
        .valveEvaluations.AoV.flowMlPerSec,
    ),
    "hemodynamics.flow.valve.TV": readbackValue(
      "hemodynamics.flow.valve.TV",
      step?.coronaryStep.baseStep.circulationTrial
        .valveEvaluations.TV.flowMlPerSec,
    ),
    "hemodynamics.flow.valve.PV": readbackValue(
      "hemodynamics.flow.valve.PV",
      step?.coronaryStep.baseStep.circulationTrial
        .valveEvaluations.PV.flowMlPerSec,
    ),
    "hemodynamics.flow.systemic.SA_Art": readbackValue(
      "hemodynamics.flow.systemic.SA_Art",
      step?.coronaryStep.baseStep.circulationTrial
        .edgeFlowsMlPerSec.SA_Art,
    ),
    "hemodynamics.flow.pulmonary.PA_PArt": readbackValue(
      "hemodynamics.flow.pulmonary.PA_PArt",
      step?.coronaryStep.baseStep.circulationTrial
        .edgeFlowsMlPerSec.PA_PArt,
    ),
    "hemodynamics.flow.venous.VC_RA": readbackValue(
      "hemodynamics.flow.venous.VC_RA",
      step?.coronaryStep.baseStep.circulationTrial
        .edgeFlowsMlPerSec.VC_RA,
    ),
    "hemodynamics.flow.venous.PVein_LA": readbackValue(
      "hemodynamics.flow.venous.PVein_LA",
      step?.coronaryStep.baseStep.circulationTrial
        .edgeFlowsMlPerSec.PVein_LA,
    ),
    "pericardium.pressure.excess": readbackValue(
      "pericardium.pressure.excess",
      step?.coronaryStep.baseStep.pericardium.excessPressureMmHg,
    ),
    "respiration.pressure.pleural": availableValue(
      "respiration.pressure.pleural",
      observation.runtimeSignals.pleuralPressureMmHg,
      "accepted-derived",
    ),
    "respiration.pressure.alveolar": availableValue(
      "respiration.pressure.alveolar",
      observation.runtimeSignals.alveolarPressureMmHg,
      "accepted-derived",
    ),
    "rhythm.heart-rate.instantaneous": availableValue(
      "rhythm.heart-rate.instantaneous",
      regularSinusHeartRateBpmV3(accepted.composedRhythm),
      "accepted-derived",
    ),
    "coronary.flow.total": readbackValue(
      "coronary.flow.total",
      step?.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics
        .totalInletFlowMlPerSec,
    ),
    "coronary.flow.inlet.LAD": readbackValue(
      "coronary.flow.inlet.LAD",
      step?.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics
        .inletFlowMlPerSecByTerritory.LAD,
    ),
    "coronary.flow.inlet.LCx": readbackValue(
      "coronary.flow.inlet.LCx",
      step?.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics
        .inletFlowMlPerSecByTerritory.LCx,
    ),
    "coronary.flow.inlet.RCA": readbackValue(
      "coronary.flow.inlet.RCA",
      step?.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics
        .inletFlowMlPerSecByTerritory.RCA,
    ),
    "device.LVAD.flow": availableValue(
      "device.LVAD.flow",
      accepted.dynamicMechanicalSupport.acceptedFlowMlPerSec.LVAD,
      "authoritative-state",
    ),
    "rhythm.phase.regular-sinus": availableValue(
      "rhythm.phase.regular-sinus",
      regularSinusPhase01V3(accepted.composedRhythm),
      "accepted-derived",
    ),
    "hemodynamics.pressure.mean.Ao": beatMetricValue(
      "hemodynamics.pressure.mean.Ao",
      observation.completedBeatMetrics?.meanAorticPressureMmHg,
    ),
    "hemodynamics.pressure.systolic.Ao": beatMetricValue(
      "hemodynamics.pressure.systolic.Ao",
      observation.completedBeatMetrics?.systolicAorticPressureMmHg,
    ),
    "hemodynamics.pressure.diastolic.Ao": beatMetricValue(
      "hemodynamics.pressure.diastolic.Ao",
      observation.completedBeatMetrics?.diastolicAorticPressureMmHg,
    ),
    "hemodynamics.pressure.pulse.Ao": beatMetricValue(
      "hemodynamics.pressure.pulse.Ao",
      observation.completedBeatMetrics?.pulseAorticPressureMmHg,
    ),
    "hemodynamics.pressure.mean.PA": beatMetricValue(
      "hemodynamics.pressure.mean.PA",
      observation.completedBeatMetrics?.meanPulmonaryArterialPressureMmHg,
    ),
    "hemodynamics.pressure.mean.LA": beatMetricValue(
      "hemodynamics.pressure.mean.LA",
      observation.completedBeatMetrics?.meanLeftAtrialPressureMmHg,
    ),
    "hemodynamics.pressure.mean.RA": beatMetricValue(
      "hemodynamics.pressure.mean.RA",
      observation.completedBeatMetrics?.meanRightAtrialPressureMmHg,
    ),
    "hemodynamics.volume.maximum.LV": beatMetricValue(
      "hemodynamics.volume.maximum.LV",
      observation.completedBeatMetrics?.maximumLeftVentricularVolumeMl,
    ),
    "hemodynamics.volume.minimum.LV": beatMetricValue(
      "hemodynamics.volume.minimum.LV",
      observation.completedBeatMetrics?.minimumLeftVentricularVolumeMl,
    ),
    "hemodynamics.stroke-volume.LV-extrema": beatMetricValue(
      "hemodynamics.stroke-volume.LV-extrema",
      observation.completedBeatMetrics?.extremaLeftVentricularStrokeVolumeMl,
    ),
    "hemodynamics.ejection-fraction.LV-extrema": beatMetricValue(
      "hemodynamics.ejection-fraction.LV-extrema",
      observation.completedBeatMetrics
        ?.extremaLeftVentricularEjectionFraction01,
    ),
    "hemodynamics.output.native-left": beatMetricValue(
      "hemodynamics.output.native-left",
      observation.completedBeatMetrics?.nativeLeftCardiacOutputLPerMin,
    ),
    "hemodynamics.output.systemic-tissue": beatMetricValue(
      "hemodynamics.output.systemic-tissue",
      observation.completedBeatMetrics?.systemicTissueOutputLPerMin,
    ),
    "hemodynamics.output.pulmonary": beatMetricValue(
      "hemodynamics.output.pulmonary",
      observation.completedBeatMetrics?.pulmonaryOutputLPerMin,
    ),
  } satisfies Record<
    MainWireIntegratedModelOutputIdV3,
    MainWireIntegratedModelOutputValueV3
  >;

  return Object.freeze({
    frameId: MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_FRAME_V3_ID,
    registryId: MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_ID,
    schemaVersion:
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_SCHEMA_VERSION,
    values: Object.freeze(values),
  });
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
