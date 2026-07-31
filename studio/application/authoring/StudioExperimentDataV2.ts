import {
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID,
  STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID,
  type ExperimentContentV2,
  type ExperimentPlacementV2,
  type ExperimentPlacementViewV2,
  type ExperimentScenarioV2,
  type ExperimentSnapshotV2,
  type ExperimentSurfaceV2,
  type ScenarioCaptureV2,
  type ScenarioPresetV2,
  type ExperimentWorkspaceV2,
} from "@/studio/contracts/v2/content";
import type {
  ExperimentDraftCaptureConfirmationV2,
  ExperimentDraftCaptureCorrelationV2,
  ExperimentDesiredContentV2,
  ExperimentDesiredScenarioV2,
} from "@/studio/contracts/v2/authoring";
import {
  assertCaptureAdapterMatchesModelV2,
  assertModelContractV2,
  type RegisteredModelCaptureAdapterV2,
  type ModelContractV2,
} from "@/studio/contracts/v2/model";
import type {
  ExactModelRuntimeResolverPortV2,
} from "@/studio/contracts/v2/executable";

const PORTABLE_ID_V2 = /^[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,255}$/;
const MAXIMUM_PORTABLE_ID_LENGTH_V2 = 256;
const MAXIMUM_JSON_DEPTH_V2 = 128;

export class StudioExperimentDataValidationErrorV2 extends Error {
  constructor(path: string, message: string) {
    super(`Studio Experiment V2 rejected ${path}: ${message}`);
    this.name = "StudioExperimentDataValidationErrorV2";
  }
}

/**
 * Validates and takes ownership of a mutable Experiment workspace value.
 *
 * The returned graph shares no objects with the caller and is deeply frozen.
 */
export function validateExperimentWorkspaceV2(
  value: unknown,
): ExperimentWorkspaceV2 {
  const workspace = clonePortableJsonV2(
    value,
    "$.workspace",
  ) as ExperimentWorkspaceV2;
  assertExactKeysV2(workspace, [
    "schemaId",
    "experimentId",
    "draftVersion",
    "headSnapshotId",
    "basedOnSnapshotId",
    "content",
  ], "$.workspace");
  if (workspace.schemaId !== STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID) {
    throw validationErrorV2("$.workspace.schemaId", "schema identity mismatch");
  }
  requiredPortableIdV2(workspace.experimentId, "$.workspace.experimentId");
  nonnegativeSafeIntegerV2(
    workspace.draftVersion,
    "$.workspace.draftVersion",
  );
  nullablePortableIdV2(
    workspace.headSnapshotId,
    "$.workspace.headSnapshotId",
  );
  nullablePortableIdV2(
    workspace.basedOnSnapshotId,
    "$.workspace.basedOnSnapshotId",
  );
  assertExperimentContentV2(workspace.content, "$.workspace.content");
  return workspace;
}

/**
 * Validates and takes ownership of an immutable Experiment snapshot.
 *
 * Snapshot identity is opaque. It is never derived from a numeric revision,
 * content hash, model package, runtime build, or certification object.
 */
export function validateExperimentSnapshotV2(
  value: unknown,
): ExperimentSnapshotV2 {
  const snapshot = clonePortableJsonV2(
    value,
    "$.snapshot",
  ) as ExperimentSnapshotV2;
  assertRequiredOptionalKeysV2(snapshot, [
    "schemaId",
    "snapshotId",
    "experimentId",
    "parentSnapshotId",
    "content",
    "createdAt",
  ], ["createdBy"], "$.snapshot");
  if (snapshot.schemaId !== STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID) {
    throw validationErrorV2("$.snapshot.schemaId", "schema identity mismatch");
  }
  requiredPortableIdV2(snapshot.snapshotId, "$.snapshot.snapshotId");
  requiredPortableIdV2(snapshot.experimentId, "$.snapshot.experimentId");
  nullablePortableIdV2(
    snapshot.parentSnapshotId,
    "$.snapshot.parentSnapshotId",
  );
  if (snapshot.parentSnapshotId === snapshot.snapshotId) {
    throw validationErrorV2(
      "$.snapshot.parentSnapshotId",
      "must not reference the snapshot itself",
    );
  }
  assertExperimentContentV2(snapshot.content, "$.snapshot.content");
  isoTimestampV2(snapshot.createdAt, "$.snapshot.createdAt");
  if (hasOwnV2(snapshot, "createdBy")) {
    requiredPortableIdV2(snapshot.createdBy, "$.snapshot.createdBy");
  }
  return snapshot;
}

export function validateScenarioCaptureV2(
  value: unknown,
): ScenarioCaptureV2 {
  const capture = clonePortableJsonV2(
    value,
    "$.capture",
  ) as ScenarioCaptureV2;
  assertScenarioCaptureV2(capture, "$.capture");
  return capture;
}

export function validateScenarioPresetV2(
  value: unknown,
): ScenarioPresetV2 {
  const preset = clonePortableJsonV2(
    value,
    "$.preset",
  ) as ScenarioPresetV2;
  assertExactKeysV2(preset, [
    "schemaId",
    "presetId",
    "modelId",
    "title",
    "description",
    "capture",
  ], "$.preset");
  if (preset.schemaId !== STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID) {
    throw validationErrorV2("$.preset.schemaId", "schema identity mismatch");
  }
  requiredPortableIdV2(preset.presetId, "$.preset.presetId");
  requiredPortableIdV2(preset.modelId, "$.preset.modelId");
  requiredTrimmedStringV2(preset.title, "$.preset.title");
  trimmedStringV2(preset.description, "$.preset.description");
  assertScenarioCaptureV2(preset.capture, "$.preset.capture");
  return preset;
}

export type ScenarioPresetCaptureClonerV2 = Readonly<{
  clone(value: unknown): ScenarioCaptureV2;
}>;

/**
 * Binds Preset application to the exact executable bundle admitted by the
 * registry. Callers cannot substitute a look-alike model contract or capture
 * validator.
 *
 * The returned capture is a second detached clone, not the capture object owned
 * by either the caller or the validated Preset. No qualification is inferred.
 */
export function createScenarioPresetCaptureClonerV2(
  models: ExactModelRuntimeResolverPortV2,
): ScenarioPresetCaptureClonerV2 {
  return Object.freeze({
    clone(value: unknown): ScenarioCaptureV2 {
      const preset = validateScenarioPresetV2(value);
      const runtime = models.resolveExactRuntime(preset.modelId);
      assertModelContractV2(runtime.contract);
      assertScenarioPresetMatchesModelV2(preset, runtime.contract);
      const capture = validateScenarioCaptureV2(preset.capture);
      assertCaptureMatchesModelV2(
        capture,
        runtime.contract,
        runtime.captureAdapter,
        "$.preset.capture",
      );
      return capture;
    },
  });
}

/**
 * Takes ownership of Experiment content and binds every model-owned reference
 * to one exact registered model contract.
 *
 * Opaque fixture/checkpoint payload validation remains the model adapter's
 * responsibility at capture and restore.
 */
export function validateExperimentContentForModelV2(
  value: unknown,
  modelValue: unknown,
): ExperimentContentV2 {
  const content = clonePortableJsonV2(
    value,
    "$.content",
  ) as ExperimentContentV2;
  assertExperimentContentV2(content, "$.content");
  assertModelContractV2(modelValue);
  assertExperimentContentMatchesModelV2(content, modelValue);
  return content;
}

/**
 * Validates and takes ownership of checkpoint-free Save intent.
 *
 * This shape cannot be persisted as an Experiment workspace. The model-owned
 * capture port must first turn every desired fixture into a complete atomic
 * fixture/checkpoint capture.
 */
export function validateExperimentDesiredContentForModelV2(
  value: unknown,
  modelValue: unknown,
): ExperimentDesiredContentV2 {
  const desiredContent = clonePortableJsonV2(
    value,
    "$.desiredContent",
  ) as ExperimentDesiredContentV2;
  assertExperimentDesiredContentV2(
    desiredContent,
    "$.desiredContent",
  );
  assertModelContractV2(modelValue);
  assertExperimentDesiredContentMatchesModelV2(
    desiredContent,
    modelValue,
  );
  return desiredContent;
}

export function validateDraftCaptureCorrelationV2(
  value: unknown,
  desiredContent: ExperimentDesiredContentV2,
): ExperimentDraftCaptureCorrelationV2 {
  const correlation = clonePortableJsonV2(
    value,
    "$.captureCorrelation",
  ) as ExperimentDraftCaptureCorrelationV2;
  assertExactKeysV2(correlation, [
    "runtimeSessionId",
    "scenarios",
  ], "$.captureCorrelation");
  requiredPortableIdV2(
    correlation.runtimeSessionId,
    "$.captureCorrelation.runtimeSessionId",
  );
  assertCaptureCorrelationScenariosV2(
    correlation.scenarios,
    desiredContent.scenarios.map(({ scenarioId }) => scenarioId),
    "$.captureCorrelation.scenarios",
  );
  return correlation;
}

export function validateDraftCaptureConfirmationV2(
  value: unknown,
  expected: Readonly<{
    experimentId: string;
    correlation: ExperimentDraftCaptureCorrelationV2;
  }>,
): ExperimentDraftCaptureConfirmationV2 {
  const confirmation = clonePortableJsonV2(
    value,
    "$.captureConfirmation",
  ) as ExperimentDraftCaptureConfirmationV2;
  assertExactKeysV2(confirmation, [
    "experimentId",
    "runtimeSessionId",
    "scenarios",
  ], "$.captureConfirmation");
  requiredPortableIdV2(
    confirmation.experimentId,
    "$.captureConfirmation.experimentId",
  );
  requiredPortableIdV2(
    confirmation.runtimeSessionId,
    "$.captureConfirmation.runtimeSessionId",
  );
  assertCaptureCorrelationScenariosV2(
    confirmation.scenarios,
    expected.correlation.scenarios.map(({ scenarioId }) => scenarioId),
    "$.captureConfirmation.scenarios",
  );
  if (
    confirmation.experimentId !== expected.experimentId
    || confirmation.runtimeSessionId !== expected.correlation.runtimeSessionId
    || confirmation.scenarios.some((scenario, index) =>
      scenario.expectedInputEpoch
        !== expected.correlation.scenarios[index]?.expectedInputEpoch)
  ) {
    throw validationErrorV2(
      "$.captureConfirmation",
      "must exactly confirm the requested Experiment, runtime session, Scenario order, and input epochs",
    );
  }
  return confirmation;
}

function assertCaptureCorrelationScenariosV2(
  value: readonly Readonly<{
    scenarioId: string;
    expectedInputEpoch: number;
  }>[] | unknown,
  expectedScenarioIds: readonly string[],
  path: string,
): void {
  if (!Array.isArray(value) || value.length !== expectedScenarioIds.length) {
    throw validationErrorV2(
      path,
      "must contain exactly one entry for every desired Scenario in order",
    );
  }
  value.forEach((scenario, index) => {
    assertExactKeysV2(scenario, [
      "scenarioId",
      "expectedInputEpoch",
    ], `${path}[${index}]`);
    requiredPortableIdV2(scenario.scenarioId, `${path}[${index}].scenarioId`);
    nonnegativeSafeIntegerV2(
      scenario.expectedInputEpoch,
      `${path}[${index}].expectedInputEpoch`,
    );
    if (scenario.scenarioId !== expectedScenarioIds[index]) {
      throw validationErrorV2(
        `${path}[${index}].scenarioId`,
        "must preserve desired Scenario identity and order",
      );
    }
  });
}

export function assertExperimentContentMatchesModelV2(
  content: ExperimentContentV2,
  model: ModelContractV2,
): void {
  assertExperimentModelAndSurfaceMatchV2(content, model, "$.content");
}

export function assertExperimentDesiredContentMatchesModelV2(
  desiredContent: ExperimentDesiredContentV2,
  model: ModelContractV2,
): void {
  assertExperimentModelAndSurfaceMatchV2(
    desiredContent,
    model,
    "$.desiredContent",
  );
}

function assertExperimentModelAndSurfaceMatchV2(
  content: Readonly<{
    modelId: string;
    surface: ExperimentSurfaceV2;
  }>,
  model: ModelContractV2,
  path: string,
): void {
  if (content.modelId !== model.modelId) {
    throw validationErrorV2(
      `${path}.modelId`,
      `must match registered model ${model.modelId}`,
    );
  }
  const graphIds = new Set(model.graphCatalog.map(({ graphId }) => graphId));
  const outputIds = new Set(
    model.outputCatalog.map(({ outputId }) => outputId),
  );
  const controlIds = new Set(
    model.controlCatalog.map(({ controlId }) => controlId),
  );
  content.surface.graphs.forEach((instance, index) => {
    if (!graphIds.has(instance.graphId)) {
      throw validationErrorV2(
        `${path}.surface.graphs[${index}].graphId`,
        `unknown registered graph ${instance.graphId}`,
      );
    }
  });
  content.surface.readouts.forEach((instance, index) => {
    if (!outputIds.has(instance.outputId)) {
      throw validationErrorV2(
        `${path}.surface.readouts[${index}].outputId`,
        `unknown registered output ${instance.outputId}`,
      );
    }
  });
  content.surface.controls.forEach((instance, index) => {
    if (!controlIds.has(instance.controlId)) {
      throw validationErrorV2(
        `${path}.surface.controls[${index}].controlId`,
        `unknown registered control ${instance.controlId}`,
      );
    }
  });
}

export function assertExperimentFixturesMatchModelV2(
  content: ExperimentContentV2,
  model: ModelContractV2,
  adapter: RegisteredModelCaptureAdapterV2,
): void {
  assertCaptureAdapterBindingV2(adapter, model);
  content.scenarios.forEach((scenario, index) => {
    try {
      adapter.validateFixture(Object.freeze({
        model,
        fixture: scenario.capture.fixture,
      }));
    } catch (error) {
      throw validationErrorV2(
        `$.content.scenarios[${index}].capture.fixture`,
        `registered model ${model.modelId} rejected fixture: ${errorMessageV2(error)}`,
      );
    }
  });
}

export function assertExperimentDesiredFixturesMatchModelV2(
  desiredContent: ExperimentDesiredContentV2,
  model: ModelContractV2,
  adapter: RegisteredModelCaptureAdapterV2,
): void {
  assertCaptureAdapterBindingV2(adapter, model);
  desiredContent.scenarios.forEach((scenario, index) => {
    try {
      adapter.validateFixture(Object.freeze({
        model,
        fixture: scenario.fixture,
      }));
    } catch (error) {
      throw validationErrorV2(
        `$.desiredContent.scenarios[${index}].fixture`,
        `registered model ${model.modelId} rejected fixture: ${errorMessageV2(error)}`,
      );
    }
  });
}

export function assertExperimentCapturesMatchModelV2(
  content: ExperimentContentV2,
  model: ModelContractV2,
  adapter: RegisteredModelCaptureAdapterV2,
): void {
  content.scenarios.forEach((scenario, index) =>
    assertCaptureMatchesModelV2(
      scenario.capture,
      model,
      adapter,
      `$.content.scenarios[${index}].capture`,
    ));
}

function assertCaptureMatchesModelV2(
  capture: ScenarioCaptureV2,
  model: ModelContractV2,
  adapter: RegisteredModelCaptureAdapterV2,
  path: string,
): void {
  assertCaptureAdapterBindingV2(adapter, model);
  try {
    adapter.validateFixture(Object.freeze({
      model,
      fixture: capture.fixture,
    }));
    adapter.validateCapture(Object.freeze({ model, capture }));
  } catch (error) {
    throw validationErrorV2(
      path,
      `registered model ${model.modelId} rejected capture: ${errorMessageV2(error)}`,
    );
  }
}

function assertCaptureAdapterBindingV2(
  adapter: RegisteredModelCaptureAdapterV2,
  model: ModelContractV2,
): void {
  try {
    assertCaptureAdapterMatchesModelV2(adapter, model);
  } catch (error) {
    throw validationErrorV2(
      "$.captureAdapter",
      errorMessageV2(error),
    );
  }
}

function assertScenarioPresetMatchesModelV2(
  preset: ScenarioPresetV2,
  model: ModelContractV2,
): void {
  if (preset.modelId !== model.modelId) {
    throw validationErrorV2(
      "$.preset.modelId",
      `must match registered model ${model.modelId}`,
    );
  }
}

export function validateExperimentPlacementV2(
  value: unknown,
): ExperimentPlacementV2 {
  const placement = clonePortableJsonV2(
    value,
    "$.placement",
  ) as ExperimentPlacementV2;
  assertRequiredOptionalKeysV2(placement, [
    "schemaId",
    "placementId",
    "snapshotId",
    "caption",
  ], ["view"], "$.placement");
  if (placement.schemaId !== STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID) {
    throw validationErrorV2("$.placement.schemaId", "schema identity mismatch");
  }
  requiredPortableIdV2(placement.placementId, "$.placement.placementId");
  requiredPortableIdV2(placement.snapshotId, "$.placement.snapshotId");
  if (placement.caption !== null) {
    requiredTrimmedStringV2(placement.caption, "$.placement.caption");
  }
  if (hasOwnV2(placement, "view")) {
    assertPlacementViewV2(placement.view, "$.placement.view");
  }
  return placement;
}

/**
 * Resolves only against the immutable snapshot explicitly pinned by Placement.
 *
 * Omitted subsets remain omitted and mean "all"; explicit empty arrays remain
 * empty and mean "none". No lookup against a mutable Experiment workspace is
 * permitted here.
 */
export function validateExperimentPlacementAgainstSnapshotV2(
  value: unknown,
  snapshotValue: unknown,
): ExperimentPlacementV2 {
  const placement = validateExperimentPlacementV2(value);
  const snapshot = validateExperimentSnapshotV2(snapshotValue);
  if (placement.snapshotId !== snapshot.snapshotId) {
    throw validationErrorV2(
      "$.placement.snapshotId",
      "does not match the pinned snapshot",
    );
  }
  if (placement.view === undefined) return placement;

  const view = placement.view;
  const surface = snapshot.content.surface;
  assertKnownSubsetV2(
    view.scenarioIds,
    snapshot.content.scenarios.map(({ scenarioId }) => scenarioId),
    "$.placement.view.scenarioIds",
  );
  assertKnownSubsetV2(
    view.graphInstanceIds,
    surface.graphs.map(({ instanceId }) => instanceId),
    "$.placement.view.graphInstanceIds",
  );
  assertKnownSubsetV2(
    view.readoutInstanceIds,
    surface.readouts.map(({ instanceId }) => instanceId),
    "$.placement.view.readoutInstanceIds",
  );
  assertKnownSubsetV2(
    view.controlInstanceIds,
    surface.controls.map(({ instanceId }) => instanceId),
    "$.placement.view.controlInstanceIds",
  );

  if (view.order !== undefined) {
    const selectedIds = [
      ...(view.graphInstanceIds
        ?? surface.graphs.map(({ instanceId }) => instanceId)),
      ...(view.readoutInstanceIds
        ?? surface.readouts.map(({ instanceId }) => instanceId)),
      ...(view.controlInstanceIds
        ?? surface.controls.map(({ instanceId }) => instanceId)),
      surface.note.instanceId,
    ];
    const selectedSet = new Set(selectedIds);
    if (
      view.order.length !== selectedIds.length
      || view.order.some((instanceId) => !selectedSet.has(instanceId))
    ) {
      throw validationErrorV2(
        "$.placement.view.order",
        "must be an exact permutation of the selected views and note",
      );
    }
  }
  return placement;
}

function assertExperimentContentV2(
  content: ExperimentContentV2,
  path: string,
): void {
  assertExactKeysV2(content, [
    "modelId",
    "scenarios",
    "surface",
  ], path);
  requiredPortableIdV2(content.modelId, `${path}.modelId`);
  if (!Array.isArray(content.scenarios) || content.scenarios.length === 0) {
    throw validationErrorV2(`${path}.scenarios`, "must be a nonempty array");
  }
  const scenarioIds = new Set<string>();
  content.scenarios.forEach((scenario, index) =>
    assertExperimentScenarioV2(
      scenario,
      `${path}.scenarios[${index}]`,
      scenarioIds,
    ));
  assertExperimentSurfaceV2(content.surface, `${path}.surface`);
}

function assertExperimentDesiredContentV2(
  desiredContent: ExperimentDesiredContentV2,
  path: string,
): void {
  assertExactKeysV2(desiredContent, [
    "modelId",
    "scenarios",
    "surface",
  ], path);
  requiredPortableIdV2(desiredContent.modelId, `${path}.modelId`);
  if (
    !Array.isArray(desiredContent.scenarios)
    || desiredContent.scenarios.length === 0
  ) {
    throw validationErrorV2(`${path}.scenarios`, "must be a nonempty array");
  }
  const scenarioIds = new Set<string>();
  desiredContent.scenarios.forEach((scenario, index) =>
    assertExperimentDesiredScenarioV2(
      scenario,
      `${path}.scenarios[${index}]`,
      scenarioIds,
    ));
  assertExperimentSurfaceV2(desiredContent.surface, `${path}.surface`);
}

function assertExperimentDesiredScenarioV2(
  scenario: ExperimentDesiredScenarioV2,
  path: string,
  scenarioIds: Set<string>,
): void {
  assertExactKeysV2(scenario, ["scenarioId", "label", "fixture"], path);
  const scenarioId = requiredPortableIdV2(
    scenario.scenarioId,
    `${path}.scenarioId`,
  );
  assertUniqueIdV2(scenarioIds, scenarioId, `${path}.scenarioId`);
  requiredTrimmedStringV2(scenario.label, `${path}.label`);
  // Fixture JSON portability was proven by clonePortableJsonV2.
  void scenario.fixture;
}

function assertExperimentScenarioV2(
  scenario: ExperimentScenarioV2,
  path: string,
  scenarioIds: Set<string>,
): void {
  assertExactKeysV2(scenario, ["scenarioId", "label", "capture"], path);
  const scenarioId = requiredPortableIdV2(
    scenario.scenarioId,
    `${path}.scenarioId`,
  );
  assertUniqueIdV2(scenarioIds, scenarioId, `${path}.scenarioId`);
  requiredTrimmedStringV2(scenario.label, `${path}.label`);
  assertScenarioCaptureV2(scenario.capture, `${path}.capture`);
}

function assertScenarioCaptureV2(
  capture: ScenarioCaptureV2,
  path: string,
): void {
  assertExactKeysV2(capture, ["fixture", "checkpoint"], path);
  const checkpoint = capture.checkpoint;
  assertExactKeysV2(checkpoint, [
    "acceptedRevision",
    "acceptedTimeSec",
    "payload",
  ], `${path}.checkpoint`);
  nonnegativeSafeIntegerV2(
    checkpoint.acceptedRevision,
    `${path}.checkpoint.acceptedRevision`,
  );
  nonnegativeFiniteNumberV2(
    checkpoint.acceptedTimeSec,
    `${path}.checkpoint.acceptedTimeSec`,
  );
  // Fixture and payload JSON portability was proven by clonePortableJsonV2.
  void capture.fixture;
  void checkpoint.payload;
}

function assertExperimentSurfaceV2(
  surface: ExperimentSurfaceV2,
  path: string,
): void {
  assertExactKeysV2(surface, [
    "groups",
    "graphs",
    "readouts",
    "controls",
    "note",
  ], path);
  arrayV2(surface.groups, `${path}.groups`);
  arrayV2(surface.graphs, `${path}.graphs`);
  arrayV2(surface.readouts, `${path}.readouts`);
  arrayV2(surface.controls, `${path}.controls`);

  const groupIds = new Set<string>();
  const groupOrders = new Set<number>();
  surface.groups.forEach((group, index) => {
    const groupPath = `${path}.groups[${index}]`;
    assertExactKeysV2(group, [
      "groupId",
      "label",
      "order",
      "priority",
    ], groupPath);
    const groupId = requiredPortableIdV2(
      group.groupId,
      `${groupPath}.groupId`,
    );
    assertUniqueIdV2(groupIds, groupId, `${groupPath}.groupId`);
    requiredTrimmedStringV2(group.label, `${groupPath}.label`);
    semanticOrderV2(group.order, `${groupPath}.order`);
    if (groupOrders.has(group.order)) {
      throw validationErrorV2(
        `${groupPath}.order`,
        `duplicate semantic order ${group.order}`,
      );
    }
    groupOrders.add(group.order);
    semanticPriorityV2(group.priority, `${groupPath}.priority`);
  });

  const instanceIds = new Set<string>();
  const ordersByGroup = new Map<string, Set<number>>();
  const assertInstance = (
    instance: Record<string, unknown>,
    path: string,
    definitionKey: "graphId" | "outputId" | "controlId" | null,
  ): void => {
    assertExactKeysV2(instance, definitionKey === null
      ? ["instanceId", "text", "groupId", "order", "priority"]
      : ["instanceId", definitionKey, "groupId", "order", "priority"], path);
    const instanceId = requiredPortableIdV2(
      instance.instanceId,
      `${path}.instanceId`,
    );
    assertUniqueIdV2(instanceIds, instanceId, `${path}.instanceId`);
    if (definitionKey === null) {
      trimmedStringV2(instance.text, `${path}.text`);
    } else {
      requiredPortableIdV2(
        instance[definitionKey],
        `${path}.${definitionKey}`,
      );
    }
    const groupId = requiredPortableIdV2(
      instance.groupId,
      `${path}.groupId`,
    );
    if (!groupIds.has(groupId)) {
      throw validationErrorV2(
        `${path}.groupId`,
        `unknown semantic group ${groupId}`,
      );
    }
    semanticOrderV2(instance.order, `${path}.order`);
    semanticPriorityV2(instance.priority, `${path}.priority`);
    const groupOrders = ordersByGroup.get(groupId) ?? new Set<number>();
    if (groupOrders.has(instance.order as number)) {
      throw validationErrorV2(
        `${path}.order`,
        `duplicate order ${String(instance.order)} in group ${groupId}`,
      );
    }
    groupOrders.add(instance.order as number);
    ordersByGroup.set(groupId, groupOrders);
  };

  surface.graphs.forEach((instance, index) =>
    assertInstance(
      instance as unknown as Record<string, unknown>,
      `${path}.graphs[${index}]`,
      "graphId",
    ));
  surface.readouts.forEach((instance, index) =>
    assertInstance(
      instance as unknown as Record<string, unknown>,
      `${path}.readouts[${index}]`,
      "outputId",
    ));
  surface.controls.forEach((instance, index) =>
    assertInstance(
      instance as unknown as Record<string, unknown>,
      `${path}.controls[${index}]`,
      "controlId",
    ));
  assertInstance(
    surface.note as unknown as Record<string, unknown>,
    `${path}.note`,
    null,
  );
}

function assertPlacementViewV2(
  view: ExperimentPlacementViewV2 | undefined,
  path: string,
): asserts view is ExperimentPlacementViewV2 {
  if (view === undefined) {
    throw validationErrorV2(path, "must be an object when present");
  }
  assertRequiredOptionalKeysV2(view, [], [
    "scenarioIds",
    "graphInstanceIds",
    "readoutInstanceIds",
    "controlInstanceIds",
    "order",
  ], path);
  for (const field of [
    "scenarioIds",
    "graphInstanceIds",
    "readoutInstanceIds",
    "controlInstanceIds",
    "order",
  ] as const) {
    if (!hasOwnV2(view, field)) continue;
    const values = view[field];
    if (!Array.isArray(values)) {
      throw validationErrorV2(`${path}.${field}`, "must be an array");
    }
    const seen = new Set<string>();
    values.forEach((value, index) => {
      const id = requiredPortableIdV2(
        value,
        `${path}.${field}[${index}]`,
      );
      assertUniqueIdV2(seen, id, `${path}.${field}[${index}]`);
    });
  }
}

function assertKnownSubsetV2(
  subset: readonly string[] | undefined,
  available: readonly string[],
  path: string,
): void {
  if (subset === undefined) return;
  const availableIds = new Set(available);
  subset.forEach((id, index) => {
    if (!availableIds.has(id)) {
      throw validationErrorV2(`${path}[${index}]`, `unknown id ${id}`);
    }
  });
}

function assertExactKeysV2(
  value: unknown,
  expected: readonly string[],
  path: string,
): asserts value is Record<string, unknown> {
  recordV2(value, path);
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (
    actual.length !== required.length
    || actual.some((key, index) => key !== required[index])
  ) {
    throw validationErrorV2(
      path,
      `keys must be exactly ${required.join(", ")}`,
    );
  }
}

function assertRequiredOptionalKeysV2(
  value: unknown,
  required: readonly string[],
  optional: readonly string[],
  path: string,
): asserts value is Record<string, unknown> {
  recordV2(value, path);
  const actual = Object.keys(value);
  const allowed = new Set([...required, ...optional]);
  const missing = required.filter((key) => !hasOwnV2(value, key));
  const unknown = actual.filter((key) => !allowed.has(key));
  if (missing.length > 0 || unknown.length > 0) {
    throw validationErrorV2(
      path,
      `field set mismatch (missing: ${missing.join(", ") || "none"}; `
        + `unknown: ${unknown.join(", ") || "none"})`,
    );
  }
}

function recordV2(
  value: unknown,
  path: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw validationErrorV2(path, "must be an object");
  }
}

function arrayV2(
  value: unknown,
  path: string,
): asserts value is readonly unknown[] {
  if (!Array.isArray(value)) {
    throw validationErrorV2(path, "must be an array");
  }
}

function hasOwnV2(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function requiredPortableIdV2(value: unknown, path: string): string {
  if (
    typeof value !== "string"
    || value.length > MAXIMUM_PORTABLE_ID_LENGTH_V2
    || !PORTABLE_ID_V2.test(value)
  ) {
    throw validationErrorV2(path, "must be a portable opaque ID");
  }
  return value;
}

function nullablePortableIdV2(value: unknown, path: string): void {
  if (value !== null) requiredPortableIdV2(value, path);
}

function assertUniqueIdV2(
  seen: Set<string>,
  value: string,
  path: string,
): void {
  if (seen.has(value)) {
    throw validationErrorV2(path, `duplicate id ${value}`);
  }
  seen.add(value);
}

function requiredTrimmedStringV2(value: unknown, path: string): void {
  if (
    typeof value !== "string"
    || value.length === 0
    || value.trim() !== value
  ) {
    throw validationErrorV2(path, "must be a nonempty trimmed string");
  }
}

function trimmedStringV2(value: unknown, path: string): void {
  if (typeof value !== "string" || value.trim() !== value) {
    throw validationErrorV2(path, "must be a trimmed string");
  }
}

function nonnegativeSafeIntegerV2(value: unknown, path: string): void {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw validationErrorV2(path, "must be a nonnegative safe integer");
  }
}

function nonnegativeFiniteNumberV2(value: unknown, path: string): void {
  if (
    typeof value !== "number"
    || !Number.isFinite(value)
    || value < 0
  ) {
    throw validationErrorV2(path, "must be a nonnegative finite number");
  }
}

function semanticOrderV2(value: unknown, path: string): void {
  nonnegativeSafeIntegerV2(value, path);
}

function semanticPriorityV2(value: unknown, path: string): void {
  nonnegativeSafeIntegerV2(value, path);
}

function isoTimestampV2(value: unknown, path: string): void {
  const parsed = typeof value === "string" ? Date.parse(value) : Number.NaN;
  if (
    typeof value !== "string"
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
    || !Number.isFinite(parsed)
    || new Date(parsed).toISOString() !== value
  ) {
    throw validationErrorV2(
      path,
      "must be a canonical, calendar-valid ISO-8601 UTC timestamp",
    );
  }
}

function clonePortableJsonV2(
  value: unknown,
  path: string,
  ancestors: Set<object> = new Set<object>(),
  depth = 0,
): unknown {
  if (depth > MAXIMUM_JSON_DEPTH_V2) {
    throw validationErrorV2(path, "JSON nesting limit exceeded");
  }
  if (
    value === null
    || typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "string") {
    assertUnicodeScalarSequenceV2(value, path);
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      throw validationErrorV2(
        path,
        "JSON number must be finite and must not be negative zero",
      );
    }
    return value;
  }
  if (typeof value !== "object") {
    throw validationErrorV2(path, "must be portable JSON");
  }
  if (ancestors.has(value)) {
    throw validationErrorV2(path, "cyclic JSON is not supported");
  }

  const nextAncestors = new Set(ancestors);
  nextAncestors.add(value);
  if (Array.isArray(value)) {
    const expectedKeys = new Set([
      "length",
      ...Array.from({ length: value.length }, (_, index) => String(index)),
    ]);
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string" || !expectedKeys.has(key)) {
        throw validationErrorV2(
          path,
          "JSON arrays must be dense and have no custom properties",
        );
      }
    }
    const clone: unknown[] = [];
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
        throw validationErrorV2(
          `${path}[${index}]`,
          "JSON array entries must be enumerable data properties",
        );
      }
      clone.push(clonePortableJsonV2(
        descriptor.value,
        `${path}[${index}]`,
        nextAncestors,
        depth + 1,
      ));
    }
    return Object.freeze(clone);
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw validationErrorV2(path, "JSON objects must be plain objects");
  }
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key !== "string")) {
    throw validationErrorV2(path, "JSON objects cannot have symbol keys");
  }
  const clone: Record<string, unknown> = {};
  for (const key of ownKeys as string[]) {
    assertUnicodeScalarSequenceV2(key, `${path} property name`);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined
      || !descriptor.enumerable
      || !("value" in descriptor)
    ) {
      throw validationErrorV2(
        `${path}.${key}`,
        "JSON properties must be enumerable data properties",
      );
    }
    Object.defineProperty(clone, key, {
      value: clonePortableJsonV2(
        descriptor.value,
        `${path}.${key}`,
        nextAncestors,
        depth + 1,
      ),
      enumerable: true,
      configurable: false,
      writable: false,
    });
  }
  return Object.freeze(clone);
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
        throw validationErrorV2(path, "contains an unpaired high surrogate");
      }
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      throw validationErrorV2(path, "contains an unpaired low surrogate");
    }
  }
}

function validationErrorV2(
  path: string,
  message: string,
): StudioExperimentDataValidationErrorV2 {
  return new StudioExperimentDataValidationErrorV2(path, message);
}

function errorMessageV2(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
