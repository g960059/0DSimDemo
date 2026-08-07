import type {
  ControlDefinitionV2,
  GraphDefinitionV2,
  MetricOutputDefinitionV2,
  ModelContractV2,
  RegisteredModelCheckpointCodecV2,
  RegisteredModelFixtureSchemaV2,
  SignalOutputDefinitionV2,
} from "./model";
import {
  assertControlCatalogV2,
  assertGraphCatalogV2,
  assertOutputCatalogV2,
  assertPortableModelIdentifierV2,
  assertPortableStudioJsonObjectV2,
} from "./model";
import { studioNumericControlValueIssueV2 } from "./control";
import type { StudioJsonObjectV2 } from "./json";

export const STUDIO_EXACT_MODEL_KERNEL_V3_SCHEMA_ID =
  "circleheart-studio-exact-model-kernel-v3" as const;
export const STUDIO_MODEL_SURFACE_RELEASE_V1_SCHEMA_ID =
  "circleheart-studio-model-surface-release-v1" as const;

export type StudioReleaseStageV1 = "dev" | "stable" | "retired";
export type StudioReleaseChannelV1 = "default" | "research";

/**
 * Exact numerical identity for the standard ABI after development-36.
 *
 * Presentation catalogs and Snapshot admission are deliberately impossible to
 * encode in this shape. Adding either would fail exact-key validation rather
 * than silently churning modelId for ordinary Studio product work.
 */
export type ExactModelKernelManifestV3 = Readonly<{
  schemaId: typeof STUDIO_EXACT_MODEL_KERNEL_V3_SCHEMA_ID;
  modelId: string;
  modelFamilyId: string;
  displayName: string;
  equations: StudioJsonObjectV2;
  runtime: StudioJsonObjectV2;
  solver: StudioJsonObjectV2;
  fixtureSchema: RegisteredModelFixtureSchemaV2;
  checkpointCodec: RegisteredModelCheckpointCodecV2;
  primitiveControlCatalog: readonly ControlDefinitionV2[];
  primitiveSignalCatalog: readonly SignalOutputDefinitionV2[];
  capabilities: readonly string[];
}>;

export type ModelSurfaceControlDefinitionV1 = Readonly<{
  controlId: string;
  preferredPresentation: "slider" | "buttons";
}>;

export type ModelSurfaceDerivedOutputDefinitionV1 =
  MetricOutputDefinitionV2 & Readonly<{
    derivationId: string;
  }>;

export type ModelSurfaceKnobTargetV1 = Readonly<{
  controlId: string;
  scale: number;
  offset: number;
}>;

export type ModelSurfaceKnobDefinitionV1 = Readonly<{
  knobId: string;
  unit: string;
  minimum: number;
  maximum: number;
  step: number;
  defaultValue: number;
  targets: readonly ModelSurfaceKnobTargetV1[];
}>;

export type ModelSurfaceProtocolActionV1 = Readonly<{
  controlId: string;
  value: number;
}>;

export type ModelSurfaceProtocolStepV1 = Readonly<{
  atSec: number;
  actions: readonly ModelSurfaceProtocolActionV1[];
}>;

export type ModelSurfaceProtocolDefinitionV1 = Readonly<{
  protocolId: string;
  steps: readonly ModelSurfaceProtocolStepV1[];
}>;

/**
 * Immutable authoring/analysis surface compatible with one model family.
 * Locale strings and authored labels/colors stay outside this semantic row.
 */
export type ModelSurfaceReleaseManifestV1 = Readonly<{
  schemaId: typeof STUDIO_MODEL_SURFACE_RELEASE_V1_SCHEMA_ID;
  surfaceReleaseId: string;
  modelFamilyId: string;
  displayName: string;
  requiredCapabilities: readonly string[];
  controlCatalog: readonly ModelSurfaceControlDefinitionV1[];
  derivedOutputCatalog: readonly ModelSurfaceDerivedOutputDefinitionV1[];
  graphCatalog: readonly GraphDefinitionV2[];
  knobCatalog: readonly ModelSurfaceKnobDefinitionV1[];
  protocolCatalog: readonly ModelSurfaceProtocolDefinitionV1[];
}>;

export class ModelSurfaceValidationErrorV1 extends Error {
  constructor(path: string, message: string) {
    super(`Studio model surface rejected ${path}: ${message}`);
    this.name = "ModelSurfaceValidationErrorV1";
  }
}

const KERNEL_KEYS_V3 = Object.freeze([
  "capabilities",
  "checkpointCodec",
  "displayName",
  "equations",
  "fixtureSchema",
  "modelFamilyId",
  "modelId",
  "primitiveControlCatalog",
  "primitiveSignalCatalog",
  "runtime",
  "schemaId",
  "solver",
]);

const SURFACE_KEYS_V1 = Object.freeze([
  "controlCatalog",
  "derivedOutputCatalog",
  "displayName",
  "graphCatalog",
  "knobCatalog",
  "modelFamilyId",
  "protocolCatalog",
  "requiredCapabilities",
  "schemaId",
  "surfaceReleaseId",
]);

export function assertStudioReleaseStageV1(
  value: unknown,
  path = "$.stage",
): asserts value is StudioReleaseStageV1 {
  if (value !== "dev" && value !== "stable" && value !== "retired") {
    throw new ModelSurfaceValidationErrorV1(
      path,
      'must be "dev", "stable", or "retired"',
    );
  }
}

export function assertStudioReleaseChannelV1(
  value: unknown,
  path = "$.channel",
): asserts value is StudioReleaseChannelV1 {
  if (value !== "default" && value !== "research") {
    throw new ModelSurfaceValidationErrorV1(
      path,
      'must be "default" or "research"',
    );
  }
}

export function assertExactModelKernelManifestV3(
  value: unknown,
): asserts value is ExactModelKernelManifestV3 {
  assertPortableStudioJsonObjectV2(value, "$.kernel");
  assertExactKeysV1(value, KERNEL_KEYS_V3, "$.kernel");
  const kernel = value as unknown as Record<string, unknown>;
  if (kernel.schemaId !== STUDIO_EXACT_MODEL_KERNEL_V3_SCHEMA_ID) {
    throw new ModelSurfaceValidationErrorV1(
      "$.kernel.schemaId",
      "schema identity mismatch",
    );
  }
  assertPortableModelIdentifierV2(kernel.modelId, "$.kernel.modelId");
  assertPortableModelIdentifierV2(
    kernel.modelFamilyId,
    "$.kernel.modelFamilyId",
  );
  assertDisplayNameV1(kernel.displayName, "$.kernel.displayName");
  assertNonemptyObjectV1(kernel.equations, "$.kernel.equations");
  assertNonemptyObjectV1(kernel.runtime, "$.kernel.runtime");
  assertNonemptyObjectV1(kernel.solver, "$.kernel.solver");
  assertDefinitionV1(
    kernel.fixtureSchema,
    "fixtureSchemaId",
    "$.kernel.fixtureSchema",
  );
  assertDefinitionV1(
    kernel.checkpointCodec,
    "checkpointCodecId",
    "$.kernel.checkpointCodec",
  );
  assertControlCatalogV2(
    kernel.primitiveControlCatalog,
    "$.kernel.primitiveControlCatalog",
  );
  const signals = kernel.primitiveSignalCatalog;
  assertOutputCatalogV2(signals, "$.kernel.primitiveSignalCatalog");
  if (!Array.isArray(signals) || signals.some((signal) =>
    signal === null
    || typeof signal !== "object"
    || (signal as Record<string, unknown>).kind !== "signal")) {
    throw new ModelSurfaceValidationErrorV1(
      "$.kernel.primitiveSignalCatalog",
      "must contain primitive signals only",
    );
  }
  const capabilities = assertUniqueIdArrayV1(
    kernel.capabilities,
    "$.kernel.capabilities",
  );
  const required = [
    ...(kernel.primitiveControlCatalog as readonly ControlDefinitionV2[])
      .map(({ controlId }) => controlCapabilityV1(controlId)),
    ...(signals as readonly SignalOutputDefinitionV2[])
      .map(({ outputId }) => outputCapabilityV1(outputId)),
  ];
  for (const capability of required) {
    if (!capabilities.has(capability)) {
      throw new ModelSurfaceValidationErrorV1(
        "$.kernel.capabilities",
        `must declare primitive capability ${capability}`,
      );
    }
  }
}

export function assertModelSurfaceReleaseManifestV1(
  value: unknown,
): asserts value is ModelSurfaceReleaseManifestV1 {
  assertPortableStudioJsonObjectV2(value, "$.surfaceRelease");
  assertExactKeysV1(value, SURFACE_KEYS_V1, "$.surfaceRelease");
  const surface = value as unknown as Record<string, unknown>;
  if (surface.schemaId !== STUDIO_MODEL_SURFACE_RELEASE_V1_SCHEMA_ID) {
    throw new ModelSurfaceValidationErrorV1(
      "$.surfaceRelease.schemaId",
      "schema identity mismatch",
    );
  }
  assertPortableModelIdentifierV2(
    surface.surfaceReleaseId,
    "$.surfaceRelease.surfaceReleaseId",
  );
  assertPortableModelIdentifierV2(
    surface.modelFamilyId,
    "$.surfaceRelease.modelFamilyId",
  );
  assertDisplayNameV1(surface.displayName, "$.surfaceRelease.displayName");
  assertUniqueIdArrayV1(
    surface.requiredCapabilities,
    "$.surfaceRelease.requiredCapabilities",
  );
  assertSurfaceControlCatalogV1(surface.controlCatalog);
  assertDerivedOutputCatalogV1(surface.derivedOutputCatalog);
  assertSurfaceGraphCatalogV1(
    surface.graphCatalog,
    surface.derivedOutputCatalog,
  );
  const requiredCapabilities = new Set(
    surface.requiredCapabilities as readonly string[],
  );
  (surface.derivedOutputCatalog as readonly ModelSurfaceDerivedOutputDefinitionV1[])
    .forEach((output, index) => {
      const capability = derivationCapabilityV1(output.derivationId);
      if (!requiredCapabilities.has(capability)) {
        throw new ModelSurfaceValidationErrorV1(
          `$.surfaceRelease.derivedOutputCatalog[${index}].derivationId`,
          `requires capability ${capability}`,
        );
      }
    });
  (surface.graphCatalog as readonly GraphDefinitionV2[]).forEach(
    (graph, index) => {
      if (
        graph.renderer === "structural-return"
        && !requiredCapabilities.has(analysisCapabilityV1(graph.analysisId))
      ) {
        throw new ModelSurfaceValidationErrorV1(
          `$.surfaceRelease.graphCatalog[${index}].analysisId`,
          `requires capability ${analysisCapabilityV1(graph.analysisId)}`,
        );
      }
    },
  );
  assertKnobCatalogV1(surface.knobCatalog);
  assertProtocolCatalogV1(surface.protocolCatalog);
}

/** Capabilities projected from the legacy V2 public contract. */
export function modelCapabilitiesFromContractV1(
  model: ModelContractV2,
  additional: readonly string[] = [],
): ReadonlySet<string> {
  const capabilities = new Set<string>(additional);
  model.controlCatalog.forEach(({ controlId }) => {
    capabilities.add(controlCapabilityV1(controlId));
  });
  model.outputCatalog.forEach(({ outputId }) => {
    capabilities.add(outputCapabilityV1(outputId));
  });
  model.graphCatalog.forEach((graph) => {
    if (graph.renderer === "structural-return") {
      capabilities.add(analysisCapabilityV1(graph.analysisId));
    }
  });
  return capabilities;
}

/**
 * Fail-closed compatibility check used before a Surface can appear in an
 * authoring menu. It does not mutate or widen the exact model contract.
 */
export function assertModelSurfaceCompatibleV1(
  surface: ModelSurfaceReleaseManifestV1,
  model: ModelContractV2,
  additionalCapabilities: readonly string[] = [],
): void {
  assertModelSurfaceReleaseManifestV1(surface);
  if (surface.modelFamilyId !== model.modelFamilyId) {
    throw new ModelSurfaceValidationErrorV1(
      "$.surfaceRelease.modelFamilyId",
      `must match model family ${model.modelFamilyId}`,
    );
  }
  const capabilities = modelCapabilitiesFromContractV1(
    model,
    additionalCapabilities,
  );
  for (const required of surface.requiredCapabilities) {
    if (!capabilities.has(required)) {
      throw new ModelSurfaceValidationErrorV1(
        "$.surfaceRelease.requiredCapabilities",
        `model lacks capability ${required}`,
      );
    }
  }
  const controls = new Map(
    model.controlCatalog.map((definition) => [definition.controlId, definition]),
  );
  surface.controlCatalog.forEach(({ controlId }, index) => {
    if (!controls.has(controlId)) {
      throw new ModelSurfaceValidationErrorV1(
        `$.surfaceRelease.controlCatalog[${index}].controlId`,
        `unknown primitive control ${controlId}`,
      );
    }
  });
  surface.knobCatalog.forEach((knob, knobIndex) => {
    knob.targets.forEach(({ controlId }, targetIndex) => {
      if (!controls.has(controlId)) {
        throw new ModelSurfaceValidationErrorV1(
          `$.surfaceRelease.knobCatalog[${knobIndex}].targets[${targetIndex}].controlId`,
          `unknown primitive control ${controlId}`,
        );
      }
    });
  });
  surface.protocolCatalog.forEach((protocol, protocolIndex) => {
    protocol.steps.forEach((step, stepIndex) => {
      step.actions.forEach((action, actionIndex) => {
        const control = controls.get(action.controlId);
        const path = `$.surfaceRelease.protocolCatalog[${protocolIndex}]`
          + `.steps[${stepIndex}].actions[${actionIndex}]`;
        if (control === undefined) {
          throw new ModelSurfaceValidationErrorV1(
            `${path}.controlId`,
            `unknown primitive control ${action.controlId}`,
          );
        }
        const issue = studioNumericControlValueIssueV2(action.value, control);
        if (issue !== undefined) {
          throw new ModelSurfaceValidationErrorV1(`${path}.value`, issue);
        }
      });
    });
  });
  const outputs = [
    ...model.outputCatalog,
    ...surface.derivedOutputCatalog.map(stripDerivationV1),
  ];
  const outputCatalog = assertOutputCatalogV2(
    outputs,
    "$.surfaceRelease.composedOutputCatalog",
  );
  assertGraphCatalogV2(
    surface.graphCatalog,
    "$.surfaceRelease.graphCatalog",
    outputCatalog,
  );
}

/** Existing semantic IDs must remain byte-equivalent; only additions survive. */
export function assertAdditiveModelSurfaceUpgradeV1(
  previous: ModelSurfaceReleaseManifestV1,
  next: ModelSurfaceReleaseManifestV1,
): void {
  assertModelSurfaceReleaseManifestV1(previous);
  assertModelSurfaceReleaseManifestV1(next);
  if (previous.modelFamilyId !== next.modelFamilyId) {
    throw new ModelSurfaceValidationErrorV1(
      "$.surfaceRelease.modelFamilyId",
      "an additive Surface upgrade cannot change model family",
    );
  }
  const nextCapabilities = new Set(next.requiredCapabilities);
  previous.requiredCapabilities.forEach((capability) => {
    if (!nextCapabilities.has(capability)) {
      throw new ModelSurfaceValidationErrorV1(
        "$.surfaceRelease.requiredCapabilities",
        `cannot remove capability ${capability}`,
      );
    }
  });
  assertCatalogExtensionV1(
    previous.controlCatalog,
    next.controlCatalog,
    "controlId",
    "controlCatalog",
  );
  assertCatalogExtensionV1(
    previous.derivedOutputCatalog,
    next.derivedOutputCatalog,
    "outputId",
    "derivedOutputCatalog",
  );
  assertCatalogExtensionV1(
    previous.graphCatalog,
    next.graphCatalog,
    "graphId",
    "graphCatalog",
  );
  assertCatalogExtensionV1(
    previous.knobCatalog,
    next.knobCatalog,
    "knobId",
    "knobCatalog",
  );
  assertCatalogExtensionV1(
    previous.protocolCatalog,
    next.protocolCatalog,
    "protocolId",
    "protocolCatalog",
  );
}

export function controlCapabilityV1(controlId: string): string {
  return `control/${controlId}`;
}

export function outputCapabilityV1(outputId: string): string {
  return `output/${outputId}`;
}

export function analysisCapabilityV1(analysisId: string): string {
  return `analysis/${analysisId}`;
}

/** Immutable implementation supplied by the trusted Studio derivation registry. */
export function derivationCapabilityV1(derivationId: string): string {
  return `derivation/${derivationId}`;
}

function assertSurfaceControlCatalogV1(value: unknown): void {
  if (!Array.isArray(value)) {
    throw new ModelSurfaceValidationErrorV1(
      "$.surfaceRelease.controlCatalog",
      "must be an array",
    );
  }
  const ids = new Set<string>();
  value.forEach((entry, index) => {
    const path = `$.surfaceRelease.controlCatalog[${index}]`;
    assertRecordV1(entry, path);
    assertExactKeysV1(entry, ["controlId", "preferredPresentation"], path);
    assertPortableModelIdentifierV2(entry.controlId, `${path}.controlId`);
    assertUniqueCatalogIdV1(ids, entry.controlId, `${path}.controlId`);
    if (
      entry.preferredPresentation !== "slider"
      && entry.preferredPresentation !== "buttons"
    ) {
      throw new ModelSurfaceValidationErrorV1(
        `${path}.preferredPresentation`,
        'must be "slider" or "buttons"',
      );
    }
  });
}

function assertDerivedOutputCatalogV1(value: unknown): void {
  if (!Array.isArray(value)) {
    throw new ModelSurfaceValidationErrorV1(
      "$.surfaceRelease.derivedOutputCatalog",
      "must be an array",
    );
  }
  const ids = new Set<string>();
  value.forEach((entry, index) => {
    const path = `$.surfaceRelease.derivedOutputCatalog[${index}]`;
    assertRecordV1(entry, path);
    assertExactKeysV1(entry, [
      "dependencies",
      "derivationId",
      "kind",
      "outputId",
      "scope",
      "shape",
      "unit",
    ], path);
    assertPortableModelIdentifierV2(entry.outputId, `${path}.outputId`);
    assertPortableModelIdentifierV2(entry.derivationId, `${path}.derivationId`);
    assertUniqueCatalogIdV1(ids, entry.outputId, `${path}.outputId`);
    if (entry.kind !== "metric") {
      throw new ModelSurfaceValidationErrorV1(`${path}.kind`, 'must be "metric"');
    }
    if (!Array.isArray(entry.dependencies)) {
      throw new ModelSurfaceValidationErrorV1(
        `${path}.dependencies`,
        "must be an array",
      );
    }
    entry.dependencies.forEach((dependency, dependencyIndex) => {
      assertPortableModelIdentifierV2(
        dependency,
        `${path}.dependencies[${dependencyIndex}]`,
      );
    });
    assertNonemptyStringV1(entry.unit, `${path}.unit`, 128);
    if (entry.shape !== "scalar" && entry.shape !== "vector") {
      throw new ModelSurfaceValidationErrorV1(
        `${path}.shape`,
        'must be "scalar" or "vector"',
      );
    }
    if (
      entry.scope !== "instant"
      && entry.scope !== "beat"
      && entry.scope !== "window"
    ) {
      throw new ModelSurfaceValidationErrorV1(
        `${path}.scope`,
        'must be "instant", "beat", or "window"',
      );
    }
  });
}

function assertSurfaceGraphCatalogV1(
  value: unknown,
  derivedValue: unknown,
): void {
  if (!Array.isArray(value) || !Array.isArray(derivedValue)) {
    throw new ModelSurfaceValidationErrorV1(
      "$.surfaceRelease.graphCatalog",
      "must be an array",
    );
  }
  const referenced = graphOutputIdsV1(value);
  const derived = derivedValue as readonly ModelSurfaceDerivedOutputDefinitionV1[];
  const derivedIds = new Set(derived.map(({ outputId }) => outputId));
  const primitiveDependencies = new Set<string>([
    ...referenced,
    ...derived.flatMap(({ dependencies }) => dependencies),
  ]);
  const syntheticInputs: SignalOutputDefinitionV2[] = [...primitiveDependencies]
    .filter((outputId) => !derivedIds.has(outputId))
    .map((outputId) => Object.freeze({
      outputId,
      kind: "signal" as const,
      unit: "1",
      shape: "scalar" as const,
      sampling: "accepted-step" as const,
    }));
  const outputs = [
    ...syntheticInputs,
    ...derived.map(stripDerivationV1),
  ];
  const catalog = assertOutputCatalogV2(
    outputs,
    "$.surfaceRelease.graphValidationOutputs",
  );
  assertGraphCatalogV2(value, "$.surfaceRelease.graphCatalog", catalog);
}

function assertKnobCatalogV1(value: unknown): void {
  if (!Array.isArray(value)) {
    throw new ModelSurfaceValidationErrorV1(
      "$.surfaceRelease.knobCatalog",
      "must be an array",
    );
  }
  const ids = new Set<string>();
  value.forEach((entry, index) => {
    const path = `$.surfaceRelease.knobCatalog[${index}]`;
    assertRecordV1(entry, path);
    assertExactKeysV1(entry, [
      "defaultValue",
      "knobId",
      "maximum",
      "minimum",
      "step",
      "targets",
      "unit",
    ], path);
    assertPortableModelIdentifierV2(entry.knobId, `${path}.knobId`);
    assertUniqueCatalogIdV1(ids, entry.knobId, `${path}.knobId`);
    assertControlCatalogV2([{
      controlId: entry.knobId,
      valueType: "number",
      unit: entry.unit,
      minimum: entry.minimum,
      maximum: entry.maximum,
      step: entry.step,
      defaultValue: entry.defaultValue,
      changeSemantics: "accepted-state-warm-start",
    }], path);
    if (!Array.isArray(entry.targets) || entry.targets.length === 0) {
      throw new ModelSurfaceValidationErrorV1(
        `${path}.targets`,
        "must be a nonempty array",
      );
    }
    const targetIds = new Set<string>();
    entry.targets.forEach((target, targetIndex) => {
      const targetPath = `${path}.targets[${targetIndex}]`;
      assertRecordV1(target, targetPath);
      assertExactKeysV1(target, ["controlId", "offset", "scale"], targetPath);
      assertPortableModelIdentifierV2(target.controlId, `${targetPath}.controlId`);
      assertUniqueCatalogIdV1(targetIds, target.controlId, `${targetPath}.controlId`);
      assertFiniteNumberV1(target.scale, `${targetPath}.scale`);
      assertFiniteNumberV1(target.offset, `${targetPath}.offset`);
    });
  });
}

function assertProtocolCatalogV1(value: unknown): void {
  if (!Array.isArray(value)) {
    throw new ModelSurfaceValidationErrorV1(
      "$.surfaceRelease.protocolCatalog",
      "must be an array",
    );
  }
  const ids = new Set<string>();
  value.forEach((entry, index) => {
    const path = `$.surfaceRelease.protocolCatalog[${index}]`;
    assertRecordV1(entry, path);
    assertExactKeysV1(entry, ["protocolId", "steps"], path);
    assertPortableModelIdentifierV2(entry.protocolId, `${path}.protocolId`);
    assertUniqueCatalogIdV1(ids, entry.protocolId, `${path}.protocolId`);
    if (!Array.isArray(entry.steps) || entry.steps.length === 0) {
      throw new ModelSurfaceValidationErrorV1(
        `${path}.steps`,
        "must be a nonempty array",
      );
    }
    let priorAtSec = -1;
    entry.steps.forEach((step, stepIndex) => {
      const stepPath = `${path}.steps[${stepIndex}]`;
      assertRecordV1(step, stepPath);
      assertExactKeysV1(step, ["actions", "atSec"], stepPath);
      const atSec = assertFiniteNumberV1(step.atSec, `${stepPath}.atSec`);
      if (atSec < 0 || atSec <= priorAtSec) {
        throw new ModelSurfaceValidationErrorV1(
          `${stepPath}.atSec`,
          "must be nonnegative and strictly increasing",
        );
      }
      priorAtSec = atSec;
      if (!Array.isArray(step.actions) || step.actions.length === 0) {
        throw new ModelSurfaceValidationErrorV1(
          `${stepPath}.actions`,
          "must be a nonempty array",
        );
      }
      const controls = new Set<string>();
      step.actions.forEach((action, actionIndex) => {
        const actionPath = `${stepPath}.actions[${actionIndex}]`;
        assertRecordV1(action, actionPath);
        assertExactKeysV1(action, ["controlId", "value"], actionPath);
        assertPortableModelIdentifierV2(action.controlId, `${actionPath}.controlId`);
        assertUniqueCatalogIdV1(controls, action.controlId, `${actionPath}.controlId`);
        assertFiniteNumberV1(action.value, `${actionPath}.value`);
      });
    });
  });
}

function graphOutputIdsV1(graphs: readonly unknown[]): Set<string> {
  const result = new Set<string>();
  graphs.forEach((graph, graphIndex) => {
    const path = `$.surfaceRelease.graphCatalog[${graphIndex}]`;
    assertRecordV1(graph, path);
    if (graph.renderer === "structural-return") return;
    if (!Array.isArray(graph.seriesCatalog)) {
      throw new ModelSurfaceValidationErrorV1(
        `${path}.seriesCatalog`,
        "must be an array",
      );
    }
    graph.seriesCatalog.forEach((series, seriesIndex) => {
      const seriesPath = `${path}.seriesCatalog[${seriesIndex}]`;
      assertRecordV1(series, seriesPath);
      if (graph.renderer === "sweep") {
        if (typeof series.outputId === "string") result.add(series.outputId);
      } else if (graph.renderer === "pressure-volume") {
        if (typeof series.volumeOutputId === "string") result.add(series.volumeOutputId);
        if (typeof series.pressureOutputId === "string") result.add(series.pressureOutputId);
        if (typeof series.cyclePhaseOutputId === "string") {
          result.add(series.cyclePhaseOutputId);
        }
      }
    });
  });
  return result;
}

function stripDerivationV1(
  value: ModelSurfaceDerivedOutputDefinitionV1,
): MetricOutputDefinitionV2 {
  return Object.freeze({
    outputId: value.outputId,
    kind: "metric",
    unit: value.unit,
    shape: value.shape,
    scope: value.scope,
    dependencies: Object.freeze([...value.dependencies]),
  });
}

function assertCatalogExtensionV1<
  TEntry extends Readonly<Record<TKey, string>>,
  TKey extends string,
>(
  previous: readonly TEntry[],
  next: readonly TEntry[],
  idKey: TKey,
  catalogName: string,
): void {
  const nextById = new Map(next.map((entry) => [entry[idKey], entry]));
  previous.forEach((entry) => {
    const replacement = nextById.get(entry[idKey]);
    if (replacement === undefined) {
      throw new ModelSurfaceValidationErrorV1(
        `$.surfaceRelease.${catalogName}`,
        `cannot remove ${entry[idKey]}`,
      );
    }
    if (!samePortableValueV1(entry, replacement)) {
      throw new ModelSurfaceValidationErrorV1(
        `$.surfaceRelease.${catalogName}`,
        `cannot change existing definition ${entry[idKey]}`,
      );
    }
  });
}

function samePortableValueV1(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((entry, index) => samePortableValueV1(entry, right[index]));
  }
  if (
    left === null
    || right === null
    || typeof left !== "object"
    || typeof right !== "object"
  ) return false;
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) =>
      key === rightKeys[index]
      && samePortableValueV1(leftRecord[key], rightRecord[key]));
}

function assertDefinitionV1(
  value: unknown,
  idKey: "fixtureSchemaId" | "checkpointCodecId",
  path: string,
): void {
  assertRecordV1(value, path);
  assertExactKeysV1(value, ["definition", idKey], path);
  assertPortableModelIdentifierV2(value[idKey], `${path}.${idKey}`);
  assertNonemptyObjectV1(value.definition, `${path}.definition`);
}

function assertUniqueIdArrayV1(
  value: unknown,
  path: string,
): Set<string> {
  if (!Array.isArray(value)) {
    throw new ModelSurfaceValidationErrorV1(path, "must be an array");
  }
  const result = new Set<string>();
  value.forEach((entry, index) => {
    assertPortableModelIdentifierV2(entry, `${path}[${index}]`);
    assertUniqueCatalogIdV1(result, entry, `${path}[${index}]`);
  });
  return result;
}

function assertUniqueCatalogIdV1(
  ids: Set<string>,
  id: string,
  path: string,
): void {
  if (ids.has(id)) {
    throw new ModelSurfaceValidationErrorV1(path, `duplicate ID ${id}`);
  }
  ids.add(id);
}

function assertRecordV1(
  value: unknown,
  path: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ModelSurfaceValidationErrorV1(path, "must be an object");
  }
}

function assertExactKeysV1(
  value: unknown,
  keys: readonly string[],
  path: string,
): void {
  assertRecordV1(value, path);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])
  ) {
    throw new ModelSurfaceValidationErrorV1(
      path,
      `keys must be exactly ${expected.join(", ")}`,
    );
  }
}

function assertDisplayNameV1(value: unknown, path: string): void {
  assertNonemptyStringV1(value, path, 160);
}

function assertNonemptyStringV1(
  value: unknown,
  path: string,
  maximumLength: number,
): asserts value is string {
  if (
    typeof value !== "string"
    || value.length === 0
    || value !== value.trim()
    || value.length > maximumLength
  ) {
    throw new ModelSurfaceValidationErrorV1(
      path,
      `must be a nonempty trimmed string of at most ${maximumLength} characters`,
    );
  }
}

function assertNonemptyObjectV1(value: unknown, path: string): void {
  assertPortableStudioJsonObjectV2(value, path);
  if (Object.keys(value).length === 0) {
    throw new ModelSurfaceValidationErrorV1(path, "must not be empty");
  }
}

function assertFiniteNumberV1(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || Object.is(value, -0)) {
    throw new ModelSurfaceValidationErrorV1(
      path,
      "must be a finite number and must not be negative zero",
    );
  }
  return value;
}
