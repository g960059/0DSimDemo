import type {
  MainWireIntegratedModelObservationV3,
  MainWireIntegratedModelPresentationAdvanceV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";

export const MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_ID =
  "main-wire-integrated-model-output-registry-v3" as const;
export const MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_SCHEMA_VERSION =
  1 as const;
export const MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_FRAME_V3_ID =
  "main-wire-integrated-model-output-frame-v3" as const;

export type MainWireIntegratedModelOutputUnitV3 =
  | "mL"
  | "mmHg"
  | "mL/s";

export type MainWireIntegratedModelOutputQuantityKindV3 =
  | "volume"
  | "pressure"
  | "flow";

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
  definition(
    "hemodynamics.volume.LV",
    "volume",
    "mL",
    "accepted-state",
    "accepted.coronary.circulation.nodeVolumesMl.LV",
  ),
  definition(
    "hemodynamics.pressure.absolute.LV",
    "pressure",
    "mmHg",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.circulationTrial.nodeAbsolutePressuresMmHg.LV",
  ),
  definition(
    "hemodynamics.pressure.absolute.Ao",
    "pressure",
    "mmHg",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.circulationTrial.nodeAbsolutePressuresMmHg.Ao",
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
    "hemodynamics.volume.LV": availableValue(
      "hemodynamics.volume.LV",
      accepted.coronary.circulation.nodeVolumesMl.LV,
      "authoritative-state",
    ),
    "hemodynamics.pressure.absolute.LV": readbackValue(
      "hemodynamics.pressure.absolute.LV",
      step?.coronaryStep.baseStep.circulationTrial
        .nodeAbsolutePressuresMmHg.LV,
    ),
    "hemodynamics.pressure.absolute.Ao": readbackValue(
      "hemodynamics.pressure.absolute.Ao",
      step?.coronaryStep.baseStep.circulationTrial
        .nodeAbsolutePressuresMmHg.Ao,
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
