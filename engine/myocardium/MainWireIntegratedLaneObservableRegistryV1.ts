import type {
  MainWireIntegratedLaneObservationV1,
  MainWireIntegratedLanePresentationAdvanceV1,
} from "@/engine/myocardium/MainWireIntegratedLaneSessionV1";

export const MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_V1_ID =
  "main-wire-integrated-v3-experimental-observable-registry-v1" as const;
export const MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION =
  1 as const;
export const MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_FRAME_V1_ID =
  "main-wire-integrated-v3-experimental-observable-frame-v1" as const;

export type MainWireIntegratedLaneObservableUnitV1 =
  | "mL"
  | "mmHg"
  | "mL/s";

export type MainWireIntegratedLaneObservableQuantityKindV1 =
  | "volume"
  | "pressure"
  | "flow";

export type MainWireIntegratedLaneObservableSourceKindV1 =
  | "accepted-state"
  | "accepted-step-readback";

export type MainWireIntegratedLaneObservableDefinitionV1<
  TId extends string = string,
> = Readonly<{
  observableId: TId;
  quantityKind: MainWireIntegratedLaneObservableQuantityKindV1;
  unit: MainWireIntegratedLaneObservableUnitV1;
  modelingStatus: "modeled";
  sourceKind: MainWireIntegratedLaneObservableSourceKindV1;
  sourcePath: string;
}>;

export const MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_CATALOG_V1 = Object.freeze([
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

export type MainWireIntegratedLaneObservableIdV1 =
  (typeof MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_CATALOG_V1)[number][
    "observableId"
  ];

export const MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_IDS_V1 = Object.freeze(
  MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_CATALOG_V1.map(
    ({ observableId }) => observableId,
  ),
) as readonly MainWireIntegratedLaneObservableIdV1[];

/**
 * Lane-envelope status fields. This metadata is intentionally outside the
 * observable registry snapshot and therefore outside its content hash.
 */
export const MAIN_WIRE_INTEGRATED_LANE_STATUS_FIELDS_V1 = Object.freeze([
  "model-time",
  "accepted-revision",
  "internal-substep-count",
  "atrial-capture-count",
  "ventricular-capture-count",
  "rhythm-label",
  "mcs-label",
  "pacing-state",
] as const);

export type MainWireIntegratedLaneObservableValueV1 = Readonly<{
  observableId: MainWireIntegratedLaneObservableIdV1;
  value: number | null;
  availability: "available" | "not-evaluated-at-accepted-state";
  quality: "authoritative-state" | "accepted-derived" | "not-assessed";
}>;

/**
 * Model time, accepted revision, substep and capture counts, rhythm and MCS
 * labels, and pacing belong to lane status. This frame does not publish them.
 */
export type MainWireIntegratedLaneObservableFrameV1 = Readonly<{
  frameId: typeof MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_FRAME_V1_ID;
  registryId: typeof MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_V1_ID;
  schemaVersion:
    typeof MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION;
  values: Readonly<Record<
    MainWireIntegratedLaneObservableIdV1,
    MainWireIntegratedLaneObservableValueV1
  >>;
}>;

export const MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_SNAPSHOT_V1 =
  Object.freeze({
    registryId: MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_V1_ID,
    schemaVersion:
      MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
    frameId: MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_FRAME_V1_ID,
    catalog: MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_CATALOG_V1,
    unavailableValuePolicy: "null-never-zero" as const,
    availabilityAndQualityAreSeparate: true as const,
  });

export class MainWireIntegratedLaneObservableProjectionErrorV1 extends Error {
  constructor(message: string) {
    super(`integrated lane observable projection rejected: ${message}`);
    this.name = "MainWireIntegratedLaneObservableProjectionErrorV1";
  }
}

/**
 * Projects the session's retained observation. Cold and restored observations
 * have no accepted-step readback, so only accepted-state values are available.
 */
export function projectMainWireIntegratedLaneObservationV1(
  observation: MainWireIntegratedLaneObservationV1,
): MainWireIntegratedLaneObservableFrameV1 {
  const accepted = observation.acceptedState;
  const step = observation.lastAcceptedStep;
  assertObservationReadbackPairV1(observation);

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
    MainWireIntegratedLaneObservableIdV1,
    MainWireIntegratedLaneObservableValueV1
  >;

  return Object.freeze({
    frameId: MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_FRAME_V1_ID,
    registryId: MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_V1_ID,
    schemaVersion:
      MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
    values: Object.freeze(values),
  });
}

/**
 * Presentation calls emit a frame only for an advanced result. Already-at-
 * target and failed calls do not represent a newly accepted sample.
 */
export function projectMainWireIntegratedLaneAdvancedFrameV1(
  advance: MainWireIntegratedLanePresentationAdvanceV1,
): MainWireIntegratedLaneObservableFrameV1 {
  if (advance.status !== "advanced") {
    throw new MainWireIntegratedLaneObservableProjectionErrorV1(
      `${advance.status} presentation advance has no new sample`,
    );
  }
  return projectMainWireIntegratedLaneObservationV1(advance.observation);
}

function definition<TId extends string>(
  observableId: TId,
  quantityKind: MainWireIntegratedLaneObservableQuantityKindV1,
  unit: MainWireIntegratedLaneObservableUnitV1,
  sourceKind: MainWireIntegratedLaneObservableSourceKindV1,
  sourcePath: string,
): MainWireIntegratedLaneObservableDefinitionV1<TId> {
  return Object.freeze({
    observableId,
    quantityKind,
    unit,
    modelingStatus: "modeled" as const,
    sourceKind,
    sourcePath,
  });
}

function availableValue(
  observableId: MainWireIntegratedLaneObservableIdV1,
  value: number,
  quality: "authoritative-state" | "accepted-derived",
): MainWireIntegratedLaneObservableValueV1 {
  if (!Number.isFinite(value)) {
    throw new MainWireIntegratedLaneObservableProjectionErrorV1(
      `${observableId} is available but is not finite`,
    );
  }
  return Object.freeze({
    observableId,
    value,
    availability: "available" as const,
    quality,
  });
}

function readbackValue(
  observableId: MainWireIntegratedLaneObservableIdV1,
  value: number | undefined,
): MainWireIntegratedLaneObservableValueV1 {
  return value === undefined
    ? Object.freeze({
        observableId,
        value: null,
        availability: "not-evaluated-at-accepted-state" as const,
        quality: "not-assessed" as const,
      })
    : availableValue(observableId, value, "accepted-derived");
}

function assertObservationReadbackPairV1(
  observation: MainWireIntegratedLaneObservationV1,
): void {
  if (
    observation.source === "presentation-target"
    && observation.lastAcceptedStep === null
  ) {
    throw new MainWireIntegratedLaneObservableProjectionErrorV1(
      "presentation observation lacks its accepted-step readback",
    );
  }
  if (
    observation.source !== "presentation-target"
    && observation.lastAcceptedStep !== null
  ) {
    throw new MainWireIntegratedLaneObservableProjectionErrorV1(
      `${observation.source} observation unexpectedly carries a step readback`,
    );
  }
}
