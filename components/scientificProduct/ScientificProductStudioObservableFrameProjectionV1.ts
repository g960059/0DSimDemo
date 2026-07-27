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
  RuntimePresentationSampleV1,
} from "@/studio/contracts/v1";
import {
  RUNTIME_PRESENTATION_COVERAGE_V1,
} from "@/studio/contracts/v1";

export class ScientificProductStudioObservableFrameProjectionErrorV1
  extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScientificProductStudioObservableFrameProjectionErrorV1";
  }
}

export type RuntimePresentationSampleFrameProjectionInputV1 = Readonly<{
  sample: RuntimePresentationSampleV1;
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
 * The runtime sample carries only retained presentation values. This
 * projection restores catalog-shaped chart values without restoring omitted
 * observations, exact cadence, or exact-beat evidence.
 */
export function projectRuntimePresentationSampleToMainWireScientificObservableFrameV1(
  input: RuntimePresentationSampleFrameProjectionInputV1,
): MainWireScientificObservableFrameV1 {
  if (!isRecordV1(input)) {
    throw projectionErrorV1("projection input must be an object");
  }
  const sample = loadRuntimePresentationSampleV1(input.sample);
  const releaseRef = loadReleaseRefV1(input.releaseRef);
  const suppliedValues = loadSuppliedObservableValuesV1(sample.values);

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
    revision: sample.acceptedRevision,
    acceptedTimeSec: sample.acceptedTimeSec,
    values: Object.freeze(values),
  });
}

function loadRuntimePresentationSampleV1(
  value: unknown,
): RuntimePresentationSampleV1 {
  if (!isRecordV1(value)) {
    throw projectionErrorV1("runtime presentation sample must be an object");
  }
  if (
    value.coverage !== RUNTIME_PRESENTATION_COVERAGE_V1
    || !Number.isSafeInteger(value.presentationOrdinal)
    || (value.presentationOrdinal as number) < 0
  ) {
    throw projectionErrorV1(
      "runtime presentation sample identity is invalid",
    );
  }
  if (
    !Number.isSafeInteger(value.acceptedRevision)
    || (value.acceptedRevision as number) < 0
    || typeof value.acceptedTimeSec !== "number"
    || !Number.isFinite(value.acceptedTimeSec)
    || value.acceptedTimeSec < 0
    || !Number.isSafeInteger(value.acceptedStepSpanFromPrevious)
    || (value.acceptedStepSpanFromPrevious as number) < 0
  ) {
    throw projectionErrorV1(
      "runtime presentation accepted-state identity is invalid",
    );
  }
  if (
    typeof value.phase !== "number"
    || !Number.isFinite(value.phase)
    || value.phase < 0
    || value.phase >= 1
  ) {
    throw projectionErrorV1(
      "runtime presentation phase must be a finite number in [0, 1)",
    );
  }
  if (
    value.retentionReason !== "stream-boundary"
    && value.retentionReason !== "observation-stride"
    && value.retentionReason !== "geometry-feature"
    && value.retentionReason !== "command-boundary"
    && value.retentionReason !== "canonical-beat-boundary"
  ) throw projectionErrorV1("runtime presentation retention reason is invalid");
  if (!isRecordV1(value.values)) {
    throw projectionErrorV1(
      "runtime presentation sample values must be an object",
    );
  }

  return value as RuntimePresentationSampleV1;
}

/**
 * Validation-result cache keyed by the caller's own reference identity.
 *
 * Every projected sample carries the same release ref object for the lifetime
 * of a scenario, but validating it canonicalises, reparses, and deep-freezes
 * the value. Repeating that work for every retained sample is unnecessary
 * because the answer cannot change while the identity is unchanged.
 *
 * Only frozen identities are cached. An unfrozen object can be mutated behind
 * its identity, so a cached verdict for it would outlive the data it was made
 * about: mutating a validated ref into invalid data, or into a different valid
 * ref, would keep emitting the old answer. Such callers are revalidated every
 * time. The live path stores an already-validated frozen ref, so it still hits
 * the cache.
 */
const VALIDATED_RELEASE_REF_BY_IDENTITY_V1 = new WeakMap<
  object,
  SimulationReleaseRef
>();

function loadReleaseRefV1(value: unknown): SimulationReleaseRef {
  const cacheable = typeof value === "object"
      && value !== null
      && Object.isFrozen(value)
    ? value
    : null;
  if (cacheable !== null) {
    const cached = VALIDATED_RELEASE_REF_BY_IDENTITY_V1.get(cacheable);
    if (cached !== undefined) return cached;
  }
  try {
    const loaded = loadSimulationReleaseRefV1(value);
    if (cacheable !== null) {
      VALIDATED_RELEASE_REF_BY_IDENTITY_V1.set(cacheable, loaded);
    }
    return loaded;
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
        `runtime presentation sample contains unknown observable ${observableId}`,
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
