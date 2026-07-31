import type {
  ModelFamilyIdV2,
  ModelIdV2,
} from "./ids";
import type {
  ScenarioCaptureV2,
} from "./content";
import type {
  StudioJsonObjectV2,
  StudioJsonValueV2,
} from "./json";

export const STUDIO_REGISTERED_MODEL_PACKAGE_V2_SCHEMA_ID =
  "circleheart-studio-registered-model-package-v2" as const;

/**
 * The public model contract is an allowlisted identity/reference projection
 * for the V2 foundation. Registry package metadata, build identities, release
 * labels, and integrity values cannot be smuggled through extensible catalog
 * records. Renderer-facing labels, ranges, and richer control presentation
 * require a later explicit allowlisted schema; there is no arbitrary JSON
 * escape hatch here.
 */
export type ParameterDefinitionV2 = Readonly<{
  parameterId: string;
}>;
export type ControlDefinitionV2 = Readonly<{
  controlId: string;
  parameterIds: readonly string[];
}>;
export type GraphDefinitionV2 = Readonly<{
  graphId: string;
  outputIds: readonly string[];
}>;

export type SignalOutputDefinitionV2 = Readonly<{
  outputId: string;
  kind: "signal";
  unit: string;
  shape: "scalar" | "vector";
  sampling: "accepted-step" | "event";
}>;

export type MetricOutputDefinitionV2 = Readonly<{
  outputId: string;
  kind: "metric";
  unit: string;
  shape: "scalar" | "vector";
  scope: "instant" | "beat" | "window";
  dependencies: readonly string[];
}>;

export type OutputDefinitionV2 =
  | SignalOutputDefinitionV2
  | MetricOutputDefinitionV2;

/**
 * Public, hash-free model surface delivered by the trusted registry.
 *
 * `modelId` is the exact registered release identity. Integrity digests and
 * build identities are deliberately absent: they remain registry internals.
 */
export type ModelContractV2 = Readonly<{
  modelId: ModelIdV2;
  modelFamilyId: ModelFamilyIdV2;
  displayName: string;
  fixtureSchemaId: string;
  checkpointCodecId: string;
  snapshotGateId: string;
  parameterCatalog: readonly ParameterDefinitionV2[];
  controlCatalog: readonly ControlDefinitionV2[];
  outputCatalog: readonly OutputDefinitionV2[];
  graphCatalog: readonly GraphDefinitionV2[];
}>;

export type RegisteredModelFixtureSchemaV2 = Readonly<{
  fixtureSchemaId: string;
  definition: StudioJsonObjectV2;
}>;

export type RegisteredModelCheckpointCodecV2 = Readonly<{
  checkpointCodecId: string;
  definition: StudioJsonObjectV2;
}>;

export type RegisteredModelSnapshotGateV2 = Readonly<{
  snapshotGateId: string;
  definition: StudioJsonObjectV2;
}>;

export type RegisteredModelCatalogsV2 = Readonly<{
  parameterCatalog: readonly ParameterDefinitionV2[];
  controlCatalog: readonly ControlDefinitionV2[];
  outputCatalog: readonly OutputDefinitionV2[];
  graphCatalog: readonly GraphDefinitionV2[];
}>;

/**
 * The one normative, fail-closed source of truth admitted by the registry.
 * The public ModelContract is derived from this manifest; callers cannot
 * submit a second contract that might disagree with the package.
 */
export type RegisteredModelPackageManifestV2 = Readonly<{
  schemaId: typeof STUDIO_REGISTERED_MODEL_PACKAGE_V2_SCHEMA_ID;
  modelId: ModelIdV2;
  modelFamilyId: ModelFamilyIdV2;
  displayName: string;
  equations: StudioJsonObjectV2;
  runtime: StudioJsonObjectV2;
  solver: StudioJsonObjectV2;
  fixtureSchema: RegisteredModelFixtureSchemaV2;
  checkpointCodec: RegisteredModelCheckpointCodecV2;
  snapshotGate: RegisteredModelSnapshotGateV2;
  catalogs: RegisteredModelCatalogsV2;
}>;

/**
 * Server/loader package resolution returns the immutable manifest, never the
 * registry's content digest.
 */
export type ResolvedModelPackageV2 = Readonly<{
  contract: ModelContractV2;
  manifest: RegisteredModelPackageManifestV2;
}>;

/** Least-authority, hash-free contract lookup used by Studio applications. */
export interface RegisteredModelContractResolverPortV2 {
  resolveContract(modelId: ModelIdV2): ModelContractV2;
}

/** Server/loader lookup that may also materialize the registered package. */
export interface RegisteredModelResolverPortV2
extends RegisteredModelContractResolverPortV2 {
  resolvePackage(modelId: ModelIdV2): ResolvedModelPackageV2;
}

/**
 * Exact-model executable seam for opaque fixture/checkpoint validation.
 * Identity fields are checked against the registered public contract before
 * any validator is called.
 */
export type RegisteredModelCaptureAdapterV2 = Readonly<{
  modelId: ModelIdV2;
  fixtureSchemaId: string;
  checkpointCodecId: string;
  validateFixture(input: Readonly<{
    model: ModelContractV2;
    fixture: StudioJsonValueV2;
  }>): void;
  validateCapture(input: Readonly<{
    model: ModelContractV2;
    capture: ScenarioCaptureV2;
  }>): void;
}>;

export class ModelContractValidationErrorV2 extends Error {
  constructor(path: string, message: string) {
    super(`Studio V2 model contract rejected ${path}: ${message}`);
    this.name = "ModelContractValidationErrorV2";
  }
}

const MODEL_CONTRACT_KEYS_V2 = Object.freeze([
  "checkpointCodecId",
  "controlCatalog",
  "displayName",
  "fixtureSchemaId",
  "graphCatalog",
  "modelFamilyId",
  "modelId",
  "outputCatalog",
  "parameterCatalog",
  "snapshotGateId",
]);
const MODEL_MANIFEST_KEYS_V2 = Object.freeze([
  "catalogs",
  "checkpointCodec",
  "displayName",
  "equations",
  "fixtureSchema",
  "modelFamilyId",
  "modelId",
  "runtime",
  "schemaId",
  "snapshotGate",
  "solver",
]);
const MODEL_CATALOG_KEYS_V2 = Object.freeze([
  "controlCatalog",
  "graphCatalog",
  "outputCatalog",
  "parameterCatalog",
]);
const SIGNAL_OUTPUT_KEYS_V2 = Object.freeze([
  "kind",
  "outputId",
  "sampling",
  "shape",
  "unit",
]);
const METRIC_OUTPUT_KEYS_V2 = Object.freeze([
  "dependencies",
  "kind",
  "outputId",
  "scope",
  "shape",
  "unit",
]);
const PORTABLE_ID_V2 = /^[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,255}$/;
const MAXIMUM_PORTABLE_JSON_DEPTH_V2 = 256;

export function assertModelContractV2(
  value: unknown,
): asserts value is ModelContractV2 {
  assertPortableStudioJsonObjectV2(value, "$");
  assertExactKeysV2(value, "$", MODEL_CONTRACT_KEYS_V2);

  assertPortableModelIdentifierV2(value.modelId, "$.modelId");
  assertPortableModelIdentifierV2(
    value.modelFamilyId,
    "$.modelFamilyId",
  );
  assertNonEmptyTrimmedStringV2(
    value.displayName,
    "$.displayName",
    512,
  );
  assertPortableModelIdentifierV2(
    value.fixtureSchemaId,
    "$.fixtureSchemaId",
  );
  assertPortableModelIdentifierV2(
    value.checkpointCodecId,
    "$.checkpointCodecId",
  );
  assertPortableModelIdentifierV2(
    value.snapshotGateId,
    "$.snapshotGateId",
  );

  const parameterIds = assertCatalogV2(
    value.parameterCatalog,
    "$.parameterCatalog",
    "parameterId",
  );
  assertControlCatalogV2(
    value.controlCatalog,
    "$.controlCatalog",
    parameterIds,
  );
  const outputIds = assertOutputCatalogV2(
    value.outputCatalog,
    "$.outputCatalog",
  );
  assertGraphCatalogV2(
    value.graphCatalog,
    "$.graphCatalog",
    outputIds,
  );
}

export function assertRegisteredModelPackageManifestV2(
  value: unknown,
): asserts value is RegisteredModelPackageManifestV2 {
  assertPortableStudioJsonObjectV2(value, "$.manifest");
  assertExactKeysV2(value, "$.manifest", MODEL_MANIFEST_KEYS_V2);
  if (value.schemaId !== STUDIO_REGISTERED_MODEL_PACKAGE_V2_SCHEMA_ID) {
    throw new ModelContractValidationErrorV2(
      "$.manifest.schemaId",
      "schema identity mismatch",
    );
  }
  assertPortableModelIdentifierV2(value.modelId, "$.manifest.modelId");
  assertPortableModelIdentifierV2(
    value.modelFamilyId,
    "$.manifest.modelFamilyId",
  );
  assertNonEmptyTrimmedStringV2(
    value.displayName,
    "$.manifest.displayName",
    512,
  );
  assertNonEmptyDefinitionObjectV2(value.equations, "$.manifest.equations");
  assertNonEmptyDefinitionObjectV2(value.runtime, "$.manifest.runtime");
  assertNonEmptyDefinitionObjectV2(value.solver, "$.manifest.solver");
  assertManifestDefinitionV2(
    value.fixtureSchema,
    "$.manifest.fixtureSchema",
    "fixtureSchemaId",
  );
  assertManifestDefinitionV2(
    value.checkpointCodec,
    "$.manifest.checkpointCodec",
    "checkpointCodecId",
  );
  assertManifestDefinitionV2(
    value.snapshotGate,
    "$.manifest.snapshotGate",
    "snapshotGateId",
  );
  assertExactKeysV2(value.catalogs, "$.manifest.catalogs", MODEL_CATALOG_KEYS_V2);
  const catalogs = value.catalogs as unknown as RegisteredModelCatalogsV2;
  const parameterIds = assertCatalogV2(
    catalogs.parameterCatalog,
    "$.manifest.catalogs.parameterCatalog",
    "parameterId",
  );
  assertControlCatalogV2(
    catalogs.controlCatalog,
    "$.manifest.catalogs.controlCatalog",
    parameterIds,
  );
  const outputIds = assertOutputCatalogV2(
    catalogs.outputCatalog,
    "$.manifest.catalogs.outputCatalog",
  );
  assertGraphCatalogV2(
    catalogs.graphCatalog,
    "$.manifest.catalogs.graphCatalog",
    outputIds,
  );
}

export function deriveModelContractFromManifestV2(
  manifestValue: unknown,
): ModelContractV2 {
  assertRegisteredModelPackageManifestV2(manifestValue);
  const manifest = manifestValue;
  const contract: ModelContractV2 = Object.freeze({
    modelId: manifest.modelId,
    modelFamilyId: manifest.modelFamilyId,
    displayName: manifest.displayName,
    fixtureSchemaId: manifest.fixtureSchema.fixtureSchemaId,
    checkpointCodecId: manifest.checkpointCodec.checkpointCodecId,
    snapshotGateId: manifest.snapshotGate.snapshotGateId,
    parameterCatalog: Object.freeze(manifest.catalogs.parameterCatalog.map(
      ({ parameterId }) => Object.freeze({ parameterId }),
    )),
    controlCatalog: Object.freeze(manifest.catalogs.controlCatalog.map(
      ({ controlId, parameterIds }) => Object.freeze({
        controlId,
        parameterIds: Object.freeze([...parameterIds]),
      }),
    )),
    outputCatalog: Object.freeze(manifest.catalogs.outputCatalog.map(
      (output) => output.kind === "signal"
        ? Object.freeze({
          outputId: output.outputId,
          kind: output.kind,
          unit: output.unit,
          shape: output.shape,
          sampling: output.sampling,
        })
        : Object.freeze({
          outputId: output.outputId,
          kind: output.kind,
          unit: output.unit,
          shape: output.shape,
          scope: output.scope,
          dependencies: Object.freeze([...output.dependencies]),
        }),
    )),
    graphCatalog: Object.freeze(manifest.catalogs.graphCatalog.map(
      ({ graphId, outputIds }) => Object.freeze({
        graphId,
        outputIds: Object.freeze([...outputIds]),
      }),
    )),
  });
  assertModelContractV2(contract);
  return contract;
}

export function assertCaptureAdapterMatchesModelV2(
  adapter: RegisteredModelCaptureAdapterV2,
  model: ModelContractV2,
): void {
  if (
    adapter === null
    || typeof adapter !== "object"
    || adapter.modelId !== model.modelId
    || adapter.fixtureSchemaId !== model.fixtureSchemaId
    || adapter.checkpointCodecId !== model.checkpointCodecId
    || typeof adapter.validateFixture !== "function"
    || typeof adapter.validateCapture !== "function"
  ) {
    throw new ModelContractValidationErrorV2(
      "$.captureAdapter",
      `must exactly match model ${model.modelId}, fixture schema `
        + `${model.fixtureSchemaId}, and checkpoint codec `
        + model.checkpointCodecId,
    );
  }
}

export function assertPortableModelIdentifierV2(
  value: unknown,
  path = "$.modelId",
): asserts value is string {
  if (typeof value !== "string" || !PORTABLE_ID_V2.test(value)) {
    throw new ModelContractValidationErrorV2(
      path,
      "must be a 1-256 character portable opaque ID",
    );
  }
}

export function assertPortableStudioJsonObjectV2(
  value: unknown,
  path = "$",
): asserts value is StudioJsonObjectV2 {
  assertPortableStudioJsonValueV2(
    value,
    path,
    new Set<object>(),
    0,
  );
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ModelContractValidationErrorV2(
      path,
      "must be a portable JSON object",
    );
  }
}

function assertPortableStudioJsonValueV2(
  value: unknown,
  path: string,
  ancestors: Set<object>,
  depth: number,
): asserts value is StudioJsonValueV2 {
  if (depth > MAXIMUM_PORTABLE_JSON_DEPTH_V2) {
    throw new ModelContractValidationErrorV2(
      path,
      "portable JSON nesting limit exceeded",
    );
  }
  if (
    value === null
    || typeof value === "boolean"
  ) {
    return;
  }
  if (typeof value === "string") {
    assertUnicodeScalarSequenceV2(value, path);
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      throw new ModelContractValidationErrorV2(
        path,
        "portable JSON numbers must be finite and must not be negative zero",
      );
    }
    return;
  }
  if (typeof value !== "object") {
    throw new ModelContractValidationErrorV2(
      path,
      `${typeof value} is outside the portable JSON data model`,
    );
  }
  if (ancestors.has(value)) {
    throw new ModelContractValidationErrorV2(
      path,
      "portable JSON must not be cyclic",
    );
  }

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      assertPortableArrayV2(value, path, ancestors, depth);
      return;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new ModelContractValidationErrorV2(
        path,
        "portable JSON objects must be plain objects",
      );
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") {
        throw new ModelContractValidationErrorV2(
          path,
          "portable JSON must not contain symbol properties",
        );
      }
      assertUnicodeScalarSequenceV2(key, `${path} property name`);
      const descriptor = descriptors[key];
      if (
        descriptor === undefined
        || !descriptor.enumerable
        || !("value" in descriptor)
      ) {
        throw new ModelContractValidationErrorV2(
          propertyPathV2(path, key),
          "portable JSON properties must be enumerable data",
        );
      }
      assertPortableStudioJsonValueV2(
        descriptor.value,
        propertyPathV2(path, key),
        ancestors,
        depth + 1,
      );
    }
  } finally {
    ancestors.delete(value);
  }
}

function assertPortableArrayV2(
  value: readonly unknown[],
  path: string,
  ancestors: Set<object>,
  depth: number,
): void {
  const expectedKeys = new Set([
    "length",
    ...value.map((_, index) => String(index)),
  ]);
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(
      value,
      String(index),
    );
    if (
      descriptor === undefined
      || !descriptor.enumerable
      || !("value" in descriptor)
    ) {
      throw new ModelContractValidationErrorV2(
        `${path}[${index}]`,
        "portable JSON arrays must be dense enumerable data",
      );
    }
    assertPortableStudioJsonValueV2(
      descriptor.value,
      `${path}[${index}]`,
      ancestors,
      depth + 1,
    );
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !expectedKeys.has(key)) {
      throw new ModelContractValidationErrorV2(
        path,
        "portable JSON arrays must not have custom properties",
      );
    }
  }
}

function assertCatalogV2(
  value: unknown,
  path: string,
  idKey: "parameterId",
): ReadonlySet<string> {
  if (!Array.isArray(value)) {
    throw new ModelContractValidationErrorV2(path, "must be an array");
  }
  const ids = new Set<string>();
  for (let index = 0; index < value.length; index += 1) {
    const definition = value[index];
    if (
      definition === null
      || typeof definition !== "object"
      || Array.isArray(definition)
    ) {
      throw new ModelContractValidationErrorV2(
        `${path}[${index}]`,
        "catalog definitions must be objects",
      );
    }
    const id = (definition as Record<string, unknown>)[idKey];
    assertExactKeysV2(
      definition,
      `${path}[${index}]`,
      [idKey],
    );
    assertPortableModelIdentifierV2(
      id,
      `${path}[${index}].${idKey}`,
    );
    if (ids.has(id)) {
      throw new ModelContractValidationErrorV2(
        `${path}[${index}].${idKey}`,
        `duplicate catalog ID ${id}`,
      );
    }
    ids.add(id);
  }
  return ids;
}

function assertControlCatalogV2(
  value: unknown,
  path: string,
  parameterIds: ReadonlySet<string>,
): void {
  if (!Array.isArray(value)) {
    throw new ModelContractValidationErrorV2(path, "must be an array");
  }
  const controlIds = new Set<string>();
  for (let index = 0; index < value.length; index += 1) {
    const definition = value[index];
    const definitionPath = `${path}[${index}]`;
    if (
      definition === null
      || typeof definition !== "object"
      || Array.isArray(definition)
    ) {
      throw new ModelContractValidationErrorV2(
        definitionPath,
        "control definitions must be objects",
      );
    }
    const control = definition as Record<string, unknown>;
    assertExactKeysV2(
      definition,
      definitionPath,
      ["controlId", "parameterIds"],
    );
    const controlId = control.controlId;
    assertPortableModelIdentifierV2(
      controlId,
      `${definitionPath}.controlId`,
    );
    if (controlIds.has(controlId)) {
      throw new ModelContractValidationErrorV2(
        `${definitionPath}.controlId`,
        `duplicate catalog ID ${controlId}`,
      );
    }
    controlIds.add(controlId);
    assertKnownIdArrayV2(
      control.parameterIds,
      `${definitionPath}.parameterIds`,
      parameterIds,
      "parameter",
    );
  }
}

function assertOutputCatalogV2(
  value: unknown,
  path: string,
): ReadonlySet<string> {
  if (!Array.isArray(value)) {
    throw new ModelContractValidationErrorV2(path, "must be an array");
  }
  const ids = new Set<string>();
  const metricDependencies: Array<Readonly<{
    outputId: string;
    path: string;
    dependencies: readonly string[];
  }>> = [];
  for (let index = 0; index < value.length; index += 1) {
    const definition = value[index];
    const definitionPath = `${path}[${index}]`;
    if (
      definition === null
      || typeof definition !== "object"
      || Array.isArray(definition)
    ) {
      throw new ModelContractValidationErrorV2(
        definitionPath,
        "output definitions must be objects",
      );
    }
    const output = definition as Record<string, unknown>;
    assertPortableModelIdentifierV2(
      output.outputId,
      `${definitionPath}.outputId`,
    );
    if (ids.has(output.outputId)) {
      throw new ModelContractValidationErrorV2(
        `${definitionPath}.outputId`,
        `duplicate output ID ${output.outputId}`,
      );
    }
    ids.add(output.outputId);
    assertNonEmptyTrimmedStringV2(
      output.unit,
      `${definitionPath}.unit`,
      128,
    );
    if (output.shape !== "scalar" && output.shape !== "vector") {
      throw new ModelContractValidationErrorV2(
        `${definitionPath}.shape`,
        'must be "scalar" or "vector"',
      );
    }

    if (output.kind === "signal") {
      assertExactKeysV2(
        definition,
        definitionPath,
        SIGNAL_OUTPUT_KEYS_V2,
      );
      if (
        output.sampling !== "accepted-step"
        && output.sampling !== "event"
      ) {
        throw new ModelContractValidationErrorV2(
          `${definitionPath}.sampling`,
          'must be "accepted-step" or "event"',
        );
      }
      continue;
    }
    if (output.kind === "metric") {
      assertExactKeysV2(
        definition,
        definitionPath,
        METRIC_OUTPUT_KEYS_V2,
      );
      if (
        output.scope !== "instant"
        && output.scope !== "beat"
        && output.scope !== "window"
      ) {
        throw new ModelContractValidationErrorV2(
          `${definitionPath}.scope`,
          'must be "instant", "beat", or "window"',
        );
      }
      if (!Array.isArray(output.dependencies)) {
        throw new ModelContractValidationErrorV2(
          `${definitionPath}.dependencies`,
          "must be an array",
        );
      }
      const dependencies = new Set<string>();
      for (
        let dependencyIndex = 0;
        dependencyIndex < output.dependencies.length;
        dependencyIndex += 1
      ) {
        const dependency = output.dependencies[dependencyIndex];
        assertPortableModelIdentifierV2(
          dependency,
          `${definitionPath}.dependencies[${dependencyIndex}]`,
        );
        if (dependencies.has(dependency)) {
          throw new ModelContractValidationErrorV2(
            `${definitionPath}.dependencies[${dependencyIndex}]`,
            `duplicate dependency ${dependency}`,
          );
        }
        dependencies.add(dependency);
      }
      metricDependencies.push({
        outputId: output.outputId,
        path: `${definitionPath}.dependencies`,
        dependencies: [...dependencies],
      });
      continue;
    }
    throw new ModelContractValidationErrorV2(
      `${definitionPath}.kind`,
      'must be "signal" or "metric"',
    );
  }
  for (const metric of metricDependencies) {
    metric.dependencies.forEach((dependency, index) => {
      if (!ids.has(dependency)) {
        throw new ModelContractValidationErrorV2(
          `${metric.path}[${index}]`,
          `unknown output dependency ${dependency}`,
        );
      }
    });
  }
  assertAcyclicMetricDependenciesV2(metricDependencies);
  return ids;
}

function assertGraphCatalogV2(
  value: unknown,
  path: string,
  outputIds: ReadonlySet<string>,
): void {
  if (!Array.isArray(value)) {
    throw new ModelContractValidationErrorV2(path, "must be an array");
  }
  const graphIds = new Set<string>();
  for (let index = 0; index < value.length; index += 1) {
    const definition = value[index];
    const definitionPath = `${path}[${index}]`;
    if (
      definition === null
      || typeof definition !== "object"
      || Array.isArray(definition)
    ) {
      throw new ModelContractValidationErrorV2(
        definitionPath,
        "graph definitions must be objects",
      );
    }
    const graph = definition as Record<string, unknown>;
    assertExactKeysV2(
      definition,
      definitionPath,
      ["graphId", "outputIds"],
    );
    const graphId = graph.graphId;
    assertPortableModelIdentifierV2(
      graphId,
      `${definitionPath}.graphId`,
    );
    if (graphIds.has(graphId)) {
      throw new ModelContractValidationErrorV2(
        `${definitionPath}.graphId`,
        `duplicate catalog ID ${graphId}`,
      );
    }
    graphIds.add(graphId);
    assertKnownIdArrayV2(
      graph.outputIds,
      `${definitionPath}.outputIds`,
      outputIds,
      "output",
    );
  }
}

function assertKnownIdArrayV2(
  value: unknown,
  path: string,
  knownIds: ReadonlySet<string>,
  kind: "parameter" | "output",
): void {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ModelContractValidationErrorV2(
      path,
      `must be a nonempty array of ${kind} IDs`,
    );
  }
  const seen = new Set<string>();
  value.forEach((candidate, index) => {
    assertPortableModelIdentifierV2(candidate, `${path}[${index}]`);
    if (!knownIds.has(candidate)) {
      throw new ModelContractValidationErrorV2(
        `${path}[${index}]`,
        `unknown ${kind} ID ${candidate}`,
      );
    }
    if (seen.has(candidate)) {
      throw new ModelContractValidationErrorV2(
        `${path}[${index}]`,
        `duplicate ${kind} ID ${candidate}`,
      );
    }
    seen.add(candidate);
  });
}

function assertAcyclicMetricDependenciesV2(
  metrics: readonly Readonly<{
    outputId: string;
    path: string;
    dependencies: readonly string[];
  }>[],
): void {
  const dependenciesByMetric = new Map(
    metrics.map((metric) => [metric.outputId, metric.dependencies]),
  );
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (outputId: string): void => {
    if (visited.has(outputId)) return;
    if (visiting.has(outputId)) {
      const metric = metrics.find((candidate) =>
        candidate.outputId === outputId);
      throw new ModelContractValidationErrorV2(
        metric?.path ?? "$.outputCatalog",
        `cyclic metric dependency involving ${outputId}`,
      );
    }
    visiting.add(outputId);
    for (const dependency of dependenciesByMetric.get(outputId) ?? []) {
      if (dependenciesByMetric.has(dependency)) visit(dependency);
    }
    visiting.delete(outputId);
    visited.add(outputId);
  };
  metrics.forEach(({ outputId }) => visit(outputId));
}

function assertManifestDefinitionV2(
  value: unknown,
  path: string,
  idKey: "fixtureSchemaId" | "checkpointCodecId" | "snapshotGateId",
): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ModelContractValidationErrorV2(path, "must be an object");
  }
  assertExactKeysV2(value, path, ["definition", idKey].sort());
  const record = value as Record<string, unknown>;
  assertPortableModelIdentifierV2(record[idKey], `${path}.${idKey}`);
  assertNonEmptyDefinitionObjectV2(record.definition, `${path}.definition`);
}

function assertNonEmptyDefinitionObjectV2(
  value: unknown,
  path: string,
): asserts value is StudioJsonObjectV2 {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || Object.keys(value).length === 0
  ) {
    throw new ModelContractValidationErrorV2(
      path,
      "must be a non-empty portable JSON object",
    );
  }
}

function assertExactKeysV2(
  value: unknown,
  path: string,
  expectedKeys: readonly string[],
): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ModelContractValidationErrorV2(path, "must be an object");
  }
  const actualKeys = Object.keys(value).sort();
  if (
    actualKeys.length !== expectedKeys.length
    || actualKeys.some((key, index) => key !== expectedKeys[index])
  ) {
    throw new ModelContractValidationErrorV2(
      path,
      `must contain exactly: ${expectedKeys.join(", ")}`,
    );
  }
}

function assertNonEmptyTrimmedStringV2(
  value: unknown,
  path: string,
  maximumLength: number,
): asserts value is string {
  if (
    typeof value !== "string"
    || value.length === 0
    || value.length > maximumLength
    || value.trim() !== value
  ) {
    throw new ModelContractValidationErrorV2(
      path,
      `must be a non-empty trimmed string up to ${maximumLength} characters`,
    );
  }
}

function assertUnicodeScalarSequenceV2(
  value: string,
  path: string,
): void {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new ModelContractValidationErrorV2(
          path,
          "contains an unpaired high surrogate",
        );
      }
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      throw new ModelContractValidationErrorV2(
        path,
        "contains an unpaired low surrogate",
      );
    }
  }
}

function propertyPathV2(parent: string, key: string): string {
  return `${parent}[${JSON.stringify(key)}]`;
}
