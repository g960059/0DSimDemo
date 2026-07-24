import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
  type MainWireScientificObservableDefinitionV1,
  type MainWireScientificObservableFrameV1,
  type MainWireScientificObservableIdV1,
  type MainWireScientificObservableValueV1,
  type ScientificObservableQualityV1,
} from "@/engine/scientific/observables";
import {
  loadSimulationReleaseRefV1,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";
import type {
  RuntimeObservablePointV1,
} from "@/studio/contracts/v1";

export class ScientificProductStudioObservableFrameProjectionErrorV1
  extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScientificProductStudioObservableFrameProjectionErrorV1";
  }
}

export type RuntimeObservablePointFrameProjectionInputV1 = Readonly<{
  point: RuntimeObservablePointV1;
  releaseRef: SimulationReleaseRef;
}>;

const OBSERVABLE_DEFINITIONS_BY_ID_V1 = new Map(
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.map((definition) => [
    definition.observableId,
    definition,
  ]),
);

/**
 * Presentation-only projection for reusing the existing scientific charts.
 *
 * The runtime point carries only available numeric values. This projection
 * restores the complete observable catalog without evaluating new science or
 * changing runtime state.
 */
export function projectRuntimeObservablePointToMainWireScientificObservableFrameV1(
  input: RuntimeObservablePointFrameProjectionInputV1,
): MainWireScientificObservableFrameV1 {
  if (!isRecordV1(input)) {
    throw projectionErrorV1("projection input must be an object");
  }
  const point = loadRuntimeObservablePointV1(input.point);
  const releaseRef = loadReleaseRefV1(input.releaseRef);
  const suppliedValues = loadSuppliedObservableValuesV1(point.values);

  const values = Object.fromEntries(
    MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.map((definition) => [
      definition.observableId,
      projectObservableValueV1(definition, suppliedValues),
    ]),
  ) as Record<
    MainWireScientificObservableIdV1,
    MainWireScientificObservableValueV1
  >;

  return Object.freeze({
    frameId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
    registryId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
    schemaVersion:
      MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
    releaseRef,
    sourceObservationId: "main-wire-scientific-session-observation-v1",
    source: "accepted-step",
    revision: point.sequence,
    acceptedTimeSec: point.simulationTimeSec,
    values: Object.freeze(values),
  });
}

function loadRuntimeObservablePointV1(
  value: unknown,
): RuntimeObservablePointV1 {
  if (!isRecordV1(value)) {
    throw projectionErrorV1("runtime observable point must be an object");
  }
  if (
    !Number.isSafeInteger(value.sequence)
    || (value.sequence as number) < 0
  ) {
    throw projectionErrorV1(
      "runtime observable point sequence must be a non-negative safe integer",
    );
  }
  if (
    typeof value.simulationTimeSec !== "number"
    || !Number.isFinite(value.simulationTimeSec)
    || value.simulationTimeSec < 0
  ) {
    throw projectionErrorV1(
      "runtime observable point time must be a non-negative finite number",
    );
  }
  if (
    value.phase01 !== null
    && (
      typeof value.phase01 !== "number"
      || !Number.isFinite(value.phase01)
      || value.phase01 < 0
      || value.phase01 >= 1
    )
  ) {
    throw projectionErrorV1(
      "runtime observable point phase must be null or a finite number in [0, 1)",
    );
  }
  if (!isRecordV1(value.values)) {
    throw projectionErrorV1(
      "runtime observable point values must be an object",
    );
  }

  return value as RuntimeObservablePointV1;
}

function loadReleaseRefV1(value: unknown): SimulationReleaseRef {
  try {
    return loadSimulationReleaseRefV1(value);
  } catch (error) {
    throw projectionErrorV1(
      `simulation release reference is invalid: ${errorMessageV1(error)}`,
    );
  }
}

function loadSuppliedObservableValuesV1(
  value: Readonly<Record<string, number>>,
): ReadonlyMap<MainWireScientificObservableIdV1, number> {
  const supplied = new Map<MainWireScientificObservableIdV1, number>();
  for (const [observableId, observableValue] of Object.entries(value)) {
    const definition = OBSERVABLE_DEFINITIONS_BY_ID_V1.get(
      observableId as MainWireScientificObservableIdV1,
    );
    if (definition === undefined) {
      throw projectionErrorV1(
        `runtime observable point contains unknown observable ${observableId}`,
      );
    }
    if (
      typeof observableValue !== "number"
      || !Number.isFinite(observableValue)
    ) {
      throw projectionErrorV1(
        `runtime observable ${observableId} must be finite`,
      );
    }
    if (definition.modelingStatus === "not-modeled") {
      throw projectionErrorV1(
        `runtime observable ${observableId} is cataloged as not-modeled`,
      );
    }
    supplied.set(definition.observableId, observableValue);
  }
  return supplied;
}

function projectObservableValueV1(
  definition: MainWireScientificObservableDefinitionV1<
    MainWireScientificObservableIdV1
  >,
  suppliedValues: ReadonlyMap<MainWireScientificObservableIdV1, number>,
): MainWireScientificObservableValueV1 {
  const suppliedValue = suppliedValues.get(definition.observableId);
  if (suppliedValue !== undefined) {
    return Object.freeze({
      observableId: definition.observableId,
      value: suppliedValue,
      availability: "available",
      quality: qualityForSourceKindV1(definition),
    });
  }
  return Object.freeze({
    observableId: definition.observableId,
    value: null,
    availability: definition.modelingStatus === "not-modeled"
      ? "not-modeled"
      : "not-evaluated-at-accepted-state",
    quality: "not-assessed",
  });
}

function qualityForSourceKindV1(
  definition: MainWireScientificObservableDefinitionV1,
): Exclude<ScientificObservableQualityV1, "not-assessed"> {
  switch (definition.sourceKind) {
    case "accepted-state":
      return "authoritative-state";
    case "accepted-step-readback":
      return "accepted-derived";
    case "solver-diagnostic":
      return "solver-diagnostic";
    case "capability-placeholder":
      throw projectionErrorV1(
        `runtime observable ${definition.observableId} cannot be available`,
      );
  }
}

function isRecordV1(
  value: unknown,
): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function projectionErrorV1(
  message: string,
): ScientificProductStudioObservableFrameProjectionErrorV1 {
  return new ScientificProductStudioObservableFrameProjectionErrorV1(message);
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
