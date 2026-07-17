import type {
  MainWireScientificSessionObservationV1,
  MainWireScientificSessionSignalAvailabilityV1,
} from "@/engine/scientific/runtime/MainWireScientificSessionV1";
import type {
  SimulationReleaseRef,
} from "@/engine/scientific/release";

export const MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID =
  "main-wire-scientific-observable-registry-v1" as const;
export const MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION =
  1 as const;
export const MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID =
  "main-wire-scientific-observable-frame-v1" as const;

export const SCIENTIFIC_OBSERVABLE_AVAILABILITY_VALUES_V1 = Object.freeze([
  "available",
  "not-modeled",
  "not-measurable",
  "not-converged",
  "not-evaluated-at-accepted-state",
] as const);
export type ScientificObservableAvailabilityV1 =
  (typeof SCIENTIFIC_OBSERVABLE_AVAILABILITY_VALUES_V1)[number];

export const SCIENTIFIC_OBSERVABLE_QUALITY_VALUES_V1 = Object.freeze([
  "authoritative-state",
  "accepted-derived",
  "solver-diagnostic",
  "not-assessed",
] as const);
export type ScientificObservableQualityV1 =
  (typeof SCIENTIFIC_OBSERVABLE_QUALITY_VALUES_V1)[number];

export type ScientificObservableUnitV1 =
  | "mL"
  | "mmHg"
  | "mL/s"
  | "1"
  | "count";

export type ScientificObservableQuantityKindV1 =
  | "volume"
  | "pressure"
  | "flow"
  | "fraction"
  | "solver-residual"
  | "count"
  | "conservation-error";

export type ScientificObservableModelingStatusV1 =
  | "modeled"
  | "not-modeled";

export type ScientificObservableSourceKindV1 =
  | "accepted-state"
  | "accepted-step-readback"
  | "solver-diagnostic"
  | "capability-placeholder";

export type MainWireScientificObservableDefinitionV1<
  TId extends string = string,
> = Readonly<{
  observableId: TId;
  quantityKind: ScientificObservableQuantityKindV1;
  unit: ScientificObservableUnitV1;
  modelingStatus: ScientificObservableModelingStatusV1;
  sourceKind: ScientificObservableSourceKindV1;
}>;

export const MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1 = Object.freeze([
  definition("hemodynamics.volume.LA", "volume", "mL", "modeled", "accepted-state"),
  definition("hemodynamics.volume.RA", "volume", "mL", "modeled", "accepted-state"),
  definition("hemodynamics.volume.LV", "volume", "mL", "modeled", "accepted-state"),
  definition("hemodynamics.volume.RV", "volume", "mL", "modeled", "accepted-state"),

  definition("hemodynamics.pressure.absolute.LA", "pressure", "mmHg", "modeled", "accepted-step-readback"),
  definition("hemodynamics.pressure.absolute.RA", "pressure", "mmHg", "modeled", "accepted-step-readback"),
  definition("hemodynamics.pressure.absolute.LV", "pressure", "mmHg", "modeled", "accepted-step-readback"),
  definition("hemodynamics.pressure.absolute.RV", "pressure", "mmHg", "modeled", "accepted-step-readback"),
  definition("hemodynamics.pressure.transmural.LA", "pressure", "mmHg", "modeled", "accepted-step-readback"),
  definition("hemodynamics.pressure.transmural.RA", "pressure", "mmHg", "modeled", "accepted-step-readback"),
  definition("hemodynamics.pressure.transmural.LV", "pressure", "mmHg", "modeled", "accepted-step-readback"),
  definition("hemodynamics.pressure.transmural.RV", "pressure", "mmHg", "modeled", "accepted-step-readback"),
  definition("hemodynamics.pressure.absolute.Ao", "pressure", "mmHg", "modeled", "accepted-step-readback"),
  definition("hemodynamics.pressure.absolute.PA", "pressure", "mmHg", "modeled", "accepted-step-readback"),
  definition("hemodynamics.pressure.absolute.PVein", "pressure", "mmHg", "modeled", "accepted-step-readback"),

  definition("valve.MV.flow", "flow", "mL/s", "modeled", "accepted-step-readback"),
  definition("valve.AoV.flow", "flow", "mL/s", "modeled", "accepted-step-readback"),
  definition("valve.TV.flow", "flow", "mL/s", "modeled", "accepted-step-readback"),
  definition("valve.PV.flow", "flow", "mL/s", "modeled", "accepted-step-readback"),
  definition("valve.MV.opening_fraction", "fraction", "1", "modeled", "accepted-state"),
  definition("valve.AoV.opening_fraction", "fraction", "1", "modeled", "accepted-state"),
  definition("valve.TV.opening_fraction", "fraction", "1", "modeled", "accepted-state"),
  definition("valve.PV.opening_fraction", "fraction", "1", "modeled", "accepted-state"),
  definition("hemodynamics.flow.pulmonary_venous", "flow", "mL/s", "modeled", "accepted-step-readback"),

  definition("solver.mechanics.residual_norm", "solver-residual", "1", "modeled", "solver-diagnostic"),
  definition("solver.mechanics.iterations", "count", "count", "modeled", "solver-diagnostic"),
  definition("solver.circulation.scaled_residual_infinity_norm", "solver-residual", "1", "modeled", "solver-diagnostic"),
  definition("solver.continuity.maximum_residual", "conservation-error", "mL", "modeled", "solver-diagnostic"),
  definition("conservation.total_blood_volume.error", "conservation-error", "mL", "modeled", "solver-diagnostic"),
  definition("solver.mechanics.callback_count", "count", "count", "modeled", "solver-diagnostic"),
  definition("solver.mechanics.callback_cache_hits", "count", "count", "modeled", "solver-diagnostic"),
  definition("pericardium.excess_pressure", "pressure", "mmHg", "modeled", "solver-diagnostic"),

  definition("coronary.flow.total", "flow", "mL/s", "not-modeled", "capability-placeholder"),
  definition("device.LVAD.flow", "flow", "mL/s", "not-modeled", "capability-placeholder"),
] as const);

export type MainWireScientificObservableIdV1 =
  (typeof MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1)[number]["observableId"];

export const MAIN_WIRE_SCIENTIFIC_OBSERVABLE_IDS_V1 = Object.freeze(
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.map(({ observableId }) =>
    observableId),
) as readonly MainWireScientificObservableIdV1[];

export type MainWireScientificObservableValueV1 = Readonly<{
  observableId: MainWireScientificObservableIdV1;
  value: number | null;
  availability: ScientificObservableAvailabilityV1;
  quality: ScientificObservableQualityV1;
}>;

export type MainWireScientificObservableFrameV1 = Readonly<{
  frameId: typeof MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID;
  registryId: typeof MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID;
  schemaVersion:
    typeof MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION;
  releaseRef: SimulationReleaseRef;
  sourceObservationId: MainWireScientificSessionObservationV1["observationId"];
  source: MainWireScientificSessionObservationV1["source"];
  revision: number;
  acceptedTimeSec: number;
  values: Readonly<Record<
    MainWireScientificObservableIdV1,
    MainWireScientificObservableValueV1
  >>;
}>;

export const MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_SNAPSHOT_V1 =
  Object.freeze({
    registryId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
    schemaVersion:
      MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
    availabilityValues: SCIENTIFIC_OBSERVABLE_AVAILABILITY_VALUES_V1,
    qualityValues: SCIENTIFIC_OBSERVABLE_QUALITY_VALUES_V1,
    catalog: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
    unavailableValuePolicy: "null-never-zero" as const,
    availabilityAndQualityAreSeparate: true as const,
    frameProvenance: "exact-simulation-release-ref-required" as const,
    frameReplayPolicy:
      "frame-is-a-release-bound-sample-run-artifact-also-requires-session-origin-and-command-ledger" as const,
  });

/** Pure host-neutral projection; it never evaluates or feeds back into science. */
export function projectMainWireScientificObservationV1(
  observation: MainWireScientificSessionObservationV1,
): MainWireScientificObservableFrameV1 {
  const values = Object.fromEntries(
    MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.map((entry) => [
      entry.observableId,
      observableValue(
        entry.observableId,
        null,
        entry.modelingStatus === "not-modeled"
          ? "not-modeled"
          : "not-evaluated-at-accepted-state",
        "not-assessed",
      ),
    ]),
  ) as Record<MainWireScientificObservableIdV1,
  MainWireScientificObservableValueV1>;

  const set = (
    observableId: MainWireScientificObservableIdV1,
    value: number | null,
    availability: ScientificObservableAvailabilityV1,
    quality: Exclude<ScientificObservableQualityV1, "not-assessed">,
  ): void => {
    values[observableId] = observableValue(
      observableId,
      value,
      availability,
      availability === "available" ? quality : "not-assessed",
    );
  };

  for (const chamber of ["LA", "RA", "LV", "RV"] as const) {
    const source = observation.chamber[chamber];
    set(
      `hemodynamics.volume.${chamber}`,
      source.volumeMl,
      "available",
      "authoritative-state",
    );
    set(
      `hemodynamics.pressure.absolute.${chamber}`,
      source.absolutePressureMmHg,
      sourceAvailability(source.pressureAvailability),
      "accepted-derived",
    );
    set(
      `hemodynamics.pressure.transmural.${chamber}`,
      source.transmuralPressureMmHg,
      sourceAvailability(source.pressureAvailability),
      "accepted-derived",
    );
  }

  for (const node of ["Ao", "PA", "PVein"] as const) {
    const source = observation.vascularPressure[node];
    set(
      `hemodynamics.pressure.absolute.${node}`,
      source.absolutePressureMmHg,
      sourceAvailability(source.pressureAvailability),
      "accepted-derived",
    );
  }

  for (const valve of ["MV", "AoV", "TV", "PV"] as const) {
    const source = observation.valve[valve];
    set(
      `valve.${valve}.flow`,
      source.flowMlPerSec,
      sourceAvailability(source.flowAvailability),
      "accepted-derived",
    );
    set(
      `valve.${valve}.opening_fraction`,
      source.openingFraction01,
      "available",
      "authoritative-state",
    );
  }

  set(
    "hemodynamics.flow.pulmonary_venous",
    observation.pulmonaryVenousFlowMlPerSec,
    sourceAvailability(observation.pulmonaryVenousFlowAvailability),
    "accepted-derived",
  );
  setDiagnostic(values, "solver.mechanics.residual_norm",
    observation.diagnostics.mechanicsResidualNorm);
  setDiagnostic(values, "solver.mechanics.iterations",
    observation.diagnostics.mechanicsIterations);
  setDiagnostic(values, "solver.circulation.scaled_residual_infinity_norm",
    observation.diagnostics.circulationScaledResidualInfinityNorm);
  setDiagnostic(values, "solver.continuity.maximum_residual",
    observation.diagnostics.maximumContinuityResidualMl);
  setDiagnostic(values, "conservation.total_blood_volume.error",
    observation.diagnostics.totalBloodVolumeErrorMl);
  setDiagnostic(values, "solver.mechanics.callback_count",
    observation.diagnostics.mechanicsCallbackCount);
  setDiagnostic(values, "solver.mechanics.callback_cache_hits",
    observation.diagnostics.mechanicsCallbackCacheHits);
  setDiagnostic(values, "pericardium.excess_pressure",
    observation.diagnostics.commonPericardialExcessPressureMmHg);

  return Object.freeze({
    frameId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
    registryId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
    schemaVersion:
      MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
    releaseRef: Object.freeze({ ...observation.releaseRef }),
    sourceObservationId: observation.observationId,
    source: observation.source,
    revision: observation.revision,
    acceptedTimeSec: observation.acceptedTimeSec,
    values: Object.freeze(values),
  });
}

function definition<TId extends string>(
  observableId: TId,
  quantityKind: ScientificObservableQuantityKindV1,
  unit: ScientificObservableUnitV1,
  modelingStatus: ScientificObservableModelingStatusV1,
  sourceKind: ScientificObservableSourceKindV1,
): MainWireScientificObservableDefinitionV1<TId> {
  return Object.freeze({
    observableId,
    quantityKind,
    unit,
    modelingStatus,
    sourceKind,
  });
}

function sourceAvailability(
  availability: MainWireScientificSessionSignalAvailabilityV1,
): ScientificObservableAvailabilityV1 {
  return availability;
}

function setDiagnostic(
  values: Record<MainWireScientificObservableIdV1,
  MainWireScientificObservableValueV1>,
  observableId: MainWireScientificObservableIdV1,
  value: number | null,
): void {
  const availability = value === null
    ? "not-evaluated-at-accepted-state" as const
    : "available" as const;
  values[observableId] = observableValue(
    observableId,
    value,
    availability,
    value === null ? "not-assessed" : "solver-diagnostic",
  );
}

function observableValue(
  observableId: MainWireScientificObservableIdV1,
  value: number | null,
  availability: ScientificObservableAvailabilityV1,
  quality: ScientificObservableQualityV1,
): MainWireScientificObservableValueV1 {
  if (availability === "available") {
    if (value === null || !Number.isFinite(value)) {
      throw new Error(`${observableId} is available but lacks a finite value`);
    }
    if (quality === "not-assessed") {
      throw new Error(`${observableId} is available but quality is not assessed`);
    }
  } else {
    if (value !== null) {
      throw new Error(`${observableId} is unavailable but carries a value`);
    }
    if (quality !== "not-assessed") {
      throw new Error(`${observableId} is unavailable but carries value quality`);
    }
  }
  return Object.freeze({ observableId, value, availability, quality });
}
