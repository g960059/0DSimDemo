import type {
  MainWireIntegratedModelObservationV3,
  MainWireIntegratedModelPresentationAdvanceV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";

export const MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_ID =
  "main-wire-integrated-model-output-registry-v4" as const;
export const MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_SCHEMA_VERSION =
  2 as const;
export const MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_FRAME_V3_ID =
  "main-wire-integrated-model-output-frame-v4" as const;

export type MainWireIntegratedModelOutputUnitV3 =
  | "1"
  | "mL"
  | "mmHg"
  | "mL/s";

export type MainWireIntegratedModelOutputQuantityKindV3 =
  | "volume"
  | "pressure"
  | "flow"
  | "phase";

export type MainWireIntegratedModelOutputSourceKindV3 =
  | "accepted-state"
  | "accepted-step-readback";

export type MainWireIntegratedModelOutputDefinitionV3<
  TId extends string = string,
> = Readonly<{
  outputId: TId;
  quantityKind: MainWireIntegratedModelOutputQuantityKindV3;
  unit: MainWireIntegratedModelOutputUnitV3;
  modelingStatus: "modeled";
  sourceKind: MainWireIntegratedModelOutputSourceKindV3;
  sourcePath: string;
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
    quantityKind,
    unit,
    modelingStatus: "modeled" as const,
    sourceKind,
    sourcePath,
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
