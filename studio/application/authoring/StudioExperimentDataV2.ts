import {
  STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2,
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID,
  STUDIO_GRAPH_HISTORY_MAX_DEPTH_V2,
  STUDIO_GRAPH_HISTORY_MIN_DEPTH_V2,
  STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID,
  STUDIO_SWEEP_WINDOW_MAX_SEC_V2,
  STUDIO_SWEEP_WINDOW_MIN_SEC_V2,
  STUDIO_SWEEP_WINDOW_STEP_SEC_V2,
  type ExperimentContentV2,
  type ExperimentPlacementBriefingV2,
  type ExperimentPlacementV2,
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
const MAXIMUM_JSON_DEPTH_V2 = 256;

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
  clone(value: unknown): Promise<ScenarioCaptureV2>;
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
    async clone(value: unknown): Promise<ScenarioCaptureV2> {
      const preset = validateScenarioPresetV2(value);
      const runtime = models.resolveExactRuntime(preset.modelId);
      assertModelContractV2(runtime.contract);
      assertScenarioPresetMatchesModelV2(preset, runtime.contract);
      const capture = validateScenarioCaptureV2(preset.capture);
      await assertCaptureMatchesModelV2(
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
    scenarios: readonly Readonly<{ scenarioId: string }>[];
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
  const graphsById = new Map(
    model.graphCatalog.map((definition) => [definition.graphId, definition]),
  );
  const outputsById = new Map(
    model.outputCatalog.map((definition) => [definition.outputId, definition]),
  );
  const controlIds = new Set(
    model.controlCatalog.map(({ controlId }) => controlId),
  );
  content.surface.graphPanes.forEach((pane, paneIndex) => {
    const panePath = `${path}.surface.graphPanes[${paneIndex}]`;
    const graph = graphsById.get(pane.graphId);
    if (graph === undefined) {
      throw validationErrorV2(
        `${panePath}.graphId`,
        `unknown registered graph ${pane.graphId}`,
      );
    }
    if (graph.renderer === "structural-return") {
      if (pane.series.length !== 0) {
        throw validationErrorV2(
          `${panePath}.series`,
          "structural-return graphs must not configure series",
        );
      }
      if (pane.windowSec !== undefined) {
        throw validationErrorV2(
          `${panePath}.windowSec`,
          `${graph.renderer} graphs must not configure a waveform window`,
        );
      }
      if (pane.historyDepth === undefined) {
        throw validationErrorV2(
          `${panePath}.historyDepth`,
          "structural-return graphs must configure a history depth",
        );
      }
      return;
    }
    if (graph.renderer === "sweep" && pane.windowSec === undefined) {
      throw validationErrorV2(
        `${panePath}.windowSec`,
        "sweep graphs must configure an authored waveform window",
      );
    }
    if (graph.renderer !== "sweep" && pane.windowSec !== undefined) {
      throw validationErrorV2(
        `${panePath}.windowSec`,
        `${graph.renderer} graphs must not configure a waveform window`,
      );
    }
    if (graph.renderer === "sweep" && pane.historyDepth !== undefined) {
      throw validationErrorV2(
        `${panePath}.historyDepth`,
        "sweep graphs must not configure an explicit history depth",
      );
    }
    if (graph.renderer === "pressure-volume" && pane.historyDepth === undefined) {
      throw validationErrorV2(
        `${panePath}.historyDepth`,
        "pressure-volume graphs must configure a history depth",
      );
    }
    if (pane.series.length === 0) {
      throw validationErrorV2(
        `${panePath}.series`,
        `${graph.renderer} graphs must select at least one registered series`,
      );
    }
    const seriesById = new Map(
      graph.seriesCatalog.map((series) => [series.seriesId, series] as const),
    );
    pane.series.forEach((series, seriesIndex) => {
      if (!seriesById.has(series.seriesId)) {
        throw validationErrorV2(
          `${panePath}.series[${seriesIndex}].seriesId`,
          `unknown registered graph series ${series.seriesId}`,
        );
      }
    });
  });
  content.surface.outputPanes.forEach((pane, paneIndex) => {
    pane.items.forEach((item, itemIndex) => {
      if (!outputsById.has(item.outputId)) {
        throw validationErrorV2(
          `${path}.surface.outputPanes[${paneIndex}].items[${itemIndex}].outputId`,
          `unknown registered output ${item.outputId}`,
        );
      }
    });
  });
  content.surface.controlPanes.forEach((pane, paneIndex) => {
    pane.items.forEach((item, itemIndex) => {
      const itemPath = `${path}.surface.controlPanes[${paneIndex}].items[${itemIndex}]`;
      if (!controlIds.has(item.controlId)) {
        throw validationErrorV2(
          `${itemPath}.controlId`,
          `unknown registered control ${item.controlId}`,
        );
      }
    });
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
      const result = adapter.validateFixture(Object.freeze({
        model,
        fixture: scenario.capture.fixture,
      }));
      if (result !== undefined) {
        throw new Error("fixture validator must complete synchronously");
      }
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
      const result = adapter.validateFixture(Object.freeze({
        model,
        fixture: scenario.fixture,
      }));
      if (result !== undefined) {
        throw new Error("fixture validator must complete synchronously");
      }
    } catch (error) {
      throw validationErrorV2(
        `$.desiredContent.scenarios[${index}].fixture`,
        `registered model ${model.modelId} rejected fixture: ${errorMessageV2(error)}`,
      );
    }
  });
}

export async function assertExperimentCapturesMatchModelV2(
  content: ExperimentContentV2,
  model: ModelContractV2,
  adapter: RegisteredModelCaptureAdapterV2,
): Promise<void> {
  for (let index = 0; index < content.scenarios.length; index += 1) {
    const scenario = content.scenarios[index];
    await assertCaptureMatchesModelV2(
      scenario.capture,
      model,
      adapter,
      `$.content.scenarios[${index}].capture`,
    );
  }
}

async function assertCaptureMatchesModelV2(
  capture: ScenarioCaptureV2,
  model: ModelContractV2,
  adapter: RegisteredModelCaptureAdapterV2,
  path: string,
): Promise<void> {
  assertCaptureAdapterBindingV2(adapter, model);
  try {
    const fixtureResult = adapter.validateFixture(Object.freeze({
      model,
      fixture: capture.fixture,
    }));
    if (fixtureResult !== undefined) {
      throw new Error("fixture validator must complete synchronously");
    }
    await adapter.validateCapture(Object.freeze({ model, capture }));
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
  ], ["briefing"], "$.placement");
  if (placement.schemaId !== STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID) {
    throw validationErrorV2("$.placement.schemaId", "schema identity mismatch");
  }
  requiredPortableIdV2(placement.placementId, "$.placement.placementId");
  requiredPortableIdV2(placement.snapshotId, "$.placement.snapshotId");
  if (placement.caption !== null) {
    requiredTrimmedStringV2(placement.caption, "$.placement.caption");
  }
  if (hasOwnV2(placement, "briefing")) {
    assertPlacementBriefingV2(
      placement.briefing,
      "$.placement.briefing",
    );
  }
  return placement;
}

/**
 * Resolves only against the immutable snapshot explicitly pinned by Placement.
 *
 * Briefing references are role-specific and must resolve entirely inside the
 * pinned Snapshot. No lookup against a mutable Experiment workspace is
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
  if (placement.briefing === undefined) return placement;

  const briefing = placement.briefing;
  const surface = snapshot.content.surface;
  assertKnownSubsetV2(
    briefing.scenarioScope.visibleScenarioIds,
    snapshot.content.scenarios.map(({ scenarioId }) => scenarioId),
    "$.placement.briefing.scenarioScope.visibleScenarioIds",
  );
  if (!briefing.scenarioScope.visibleScenarioIds.includes(
    briefing.scenarioScope.initialFocusScenarioId,
  )) {
    throw validationErrorV2(
      "$.placement.briefing.scenarioScope.initialFocusScenarioId",
      "must be included in visibleScenarioIds",
    );
  }

  const graphPanesById = new Map(
    surface.graphPanes.map((pane) => [pane.paneId, pane] as const),
  );
  briefing.graphs.forEach((graph, graphIndex) => {
    const graphPath = `$.placement.briefing.graphs[${graphIndex}]`;
    const sourcePane = graphPanesById.get(graph.paneId);
    if (sourcePane === undefined) {
      throw validationErrorV2(
        `${graphPath}.paneId`,
        `unknown graph pane ${graph.paneId}`,
      );
    }
    const overrides = graph.overrides;
    if (overrides?.series !== undefined) {
      if (sourcePane.series.length > 0 && overrides.series.length === 0) {
        throw validationErrorV2(
          `${graphPath}.overrides.series`,
          "must select at least one source graph series",
        );
      }
      assertKnownSubsetV2(
        overrides.series.map(({ seriesId }) => seriesId),
        sourcePane.series.map(({ seriesId }) => seriesId),
        `${graphPath}.overrides.series`,
        "seriesId",
      );
    }
    if (
      overrides?.windowSec !== undefined
      && sourcePane.windowSec === undefined
    ) {
      throw validationErrorV2(
        `${graphPath}.overrides.windowSec`,
        "source graph pane does not support a waveform window",
      );
    }
    if (
      overrides?.historyDepth !== undefined
      && sourcePane.historyDepth === undefined
    ) {
      throw validationErrorV2(
        `${graphPath}.overrides.historyDepth`,
        "source graph pane does not support graph history",
      );
    }
  });

  const availableOutputIds = new Set(
    surface.outputPanes.flatMap(({ items }) =>
      items.map(({ outputId }) => outputId)),
  );
  briefing.outputs.forEach((output, index) => {
    if (!availableOutputIds.has(output.outputId)) {
      throw validationErrorV2(
        `$.placement.briefing.outputs[${index}].outputId`,
        `unknown Surface output ${output.outputId}`,
      );
    }
  });

  const availableControlIds = new Set(
    surface.controlPanes.flatMap(({ items }) =>
      items.map(({ controlId }) => controlId)),
  );
  briefing.controls.forEach((control, index) => {
    const controlPath = `$.placement.briefing.controls[${index}]`;
    if (!availableControlIds.has(control.controlId)) {
      throw validationErrorV2(
        `${controlPath}.controlId`,
        `unknown Surface control ${control.controlId}`,
      );
    }
    const targetScenarioIds = control.binding.mode === "reader-focus"
      ? control.binding.allowedScenarioIds
      : control.binding.scenarioIds;
    assertKnownSubsetV2(
      targetScenarioIds,
      briefing.scenarioScope.visibleScenarioIds,
      `${controlPath}.binding.${control.binding.mode === "reader-focus"
        ? "allowedScenarioIds"
        : "scenarioIds"}`,
    );
  });
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
  if (content.scenarios.length > STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2) {
    throw validationErrorV2(
      `${path}.scenarios`,
      `must contain at most ${STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2} Scenarios`,
    );
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
  if (desiredContent.scenarios.length > STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2) {
    throw validationErrorV2(
      `${path}.scenarios`,
      `must contain at most ${STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2} Scenarios`,
    );
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
    "graphPanes",
    "outputPanes",
    "controlPanes",
    "note",
  ], path);
  arrayV2(surface.graphPanes, `${path}.graphPanes`);
  arrayV2(surface.outputPanes, `${path}.outputPanes`);
  arrayV2(surface.controlPanes, `${path}.controlPanes`);

  const paneIds = new Set<string>();
  const assertPane = (
    pane: Record<string, unknown>,
    panePath: string,
    role: "graph" | "output" | "control",
    roleOrders: Set<number>,
  ): void => {
    const paneId = requiredPortableIdV2(pane.paneId, `${panePath}.paneId`);
    assertUniqueIdV2(paneIds, paneId, `${panePath}.paneId`);
    if (pane.role !== role) {
      throw validationErrorV2(`${panePath}.role`, `must be ${role}`);
    }
    requiredTrimmedStringV2(pane.label, `${panePath}.label`);
    semanticOrderV2(pane.order, `${panePath}.order`);
    if (roleOrders.has(pane.order as number)) {
      throw validationErrorV2(
        `${panePath}.order`,
        `duplicate ${role} pane order ${String(pane.order)}`,
      );
    }
    roleOrders.add(pane.order as number);
    semanticPriorityV2(pane.priority, `${panePath}.priority`);
  };
  const assertLabeledOutputItems = (
    items: readonly unknown[],
    itemsPath: string,
  ): void => {
    const outputIds = new Set<string>();
    const orders = new Set<number>();
    items.forEach((item, index) => {
      const itemPath = `${itemsPath}[${index}]`;
      assertExactKeysV2(item, ["outputId", "label", "order"], itemPath);
      const outputId = requiredPortableIdV2(item.outputId, `${itemPath}.outputId`);
      assertUniqueIdV2(outputIds, outputId, `${itemPath}.outputId`);
      requiredTrimmedStringV2(item.label, `${itemPath}.label`);
      semanticOrderV2(item.order, `${itemPath}.order`);
      assertUniqueOrderV2(orders, item.order as number, `${itemPath}.order`);
    });
  };

  const graphOrders = new Set<number>();
  surface.graphPanes.forEach((pane, index) => {
    const panePath = `${path}.graphPanes[${index}]`;
    assertRequiredOptionalKeysV2(
      pane,
      ["paneId", "role", "label", "order", "priority", "graphId", "series"],
      ["windowSec", "historyDepth"],
      panePath,
    );
    assertPane(
      pane as unknown as Record<string, unknown>,
      panePath,
      "graph",
      graphOrders,
    );
    requiredPortableIdV2(pane.graphId, `${panePath}.graphId`);
    if (pane.windowSec !== undefined) {
      sweepWindowSecV2(pane.windowSec, `${panePath}.windowSec`);
    }
    if (pane.historyDepth !== undefined) {
      graphHistoryDepthV2(pane.historyDepth, `${panePath}.historyDepth`);
    }
    arrayV2(pane.series, `${panePath}.series`);
    const seriesIds = new Set<string>();
    const seriesOrders = new Set<number>();
    pane.series.forEach((series, seriesIndex) => {
      const seriesPath = `${panePath}.series[${seriesIndex}]`;
      assertExactKeysV2(
        series,
        ["seriesId", "label", "colorHex", "order"],
        seriesPath,
      );
      const seriesId = requiredPortableIdV2(
        series.seriesId,
        `${seriesPath}.seriesId`,
      );
      assertUniqueIdV2(seriesIds, seriesId, `${seriesPath}.seriesId`);
      requiredTrimmedStringV2(series.label, `${seriesPath}.label`);
      canonicalColorHexV2(series.colorHex, `${seriesPath}.colorHex`);
      semanticOrderV2(series.order, `${seriesPath}.order`);
      assertUniqueOrderV2(
        seriesOrders,
        series.order,
        `${seriesPath}.order`,
      );
    });
  });

  const outputOrders = new Set<number>();
  surface.outputPanes.forEach((pane, index) => {
    const panePath = `${path}.outputPanes[${index}]`;
    assertExactKeysV2(
      pane,
      ["paneId", "role", "label", "order", "priority", "items"],
      panePath,
    );
    assertPane(
      pane as unknown as Record<string, unknown>,
      panePath,
      "output",
      outputOrders,
    );
    arrayV2(pane.items, `${panePath}.items`);
    assertLabeledOutputItems(pane.items, `${panePath}.items`);
  });

  const controlOrders = new Set<number>();
  surface.controlPanes.forEach((pane, paneIndex) => {
    const panePath = `${path}.controlPanes[${paneIndex}]`;
    assertExactKeysV2(
      pane,
      ["paneId", "role", "label", "order", "priority", "items"],
      panePath,
    );
    assertPane(
      pane as unknown as Record<string, unknown>,
      panePath,
      "control",
      controlOrders,
    );
    arrayV2(pane.items, `${panePath}.items`);
    const controlIds = new Set<string>();
    const itemOrders = new Set<number>();
    pane.items.forEach((item, itemIndex) => {
      const itemPath = `${panePath}.items[${itemIndex}]`;
      assertExactKeysV2(item, [
        "controlId",
        "label",
        "order",
      ], itemPath);
      const controlId = requiredPortableIdV2(
        item.controlId,
        `${itemPath}.controlId`,
      );
      assertUniqueIdV2(controlIds, controlId, `${itemPath}.controlId`);
      requiredTrimmedStringV2(item.label, `${itemPath}.label`);
      semanticOrderV2(item.order, `${itemPath}.order`);
      assertUniqueOrderV2(itemOrders, item.order, `${itemPath}.order`);
    });
  });

  assertExactKeysV2(surface.note, ["text"], `${path}.note`);
  trimmedStringV2(surface.note.text, `${path}.note.text`);
}

function assertPlacementBriefingV2(
  briefing: ExperimentPlacementBriefingV2 | undefined,
  path: string,
): asserts briefing is ExperimentPlacementBriefingV2 {
  if (briefing === undefined) {
    throw validationErrorV2(path, "must be an object when present");
  }
  assertExactKeysV2(briefing, [
    "scenarioScope",
    "graphs",
    "outputs",
    "controls",
  ], path);

  const scopePath = `${path}.scenarioScope`;
  assertExactKeysV2(briefing.scenarioScope, [
    "visibleScenarioIds",
    "initialFocusScenarioId",
  ], scopePath);
  arrayV2(
    briefing.scenarioScope.visibleScenarioIds,
    `${scopePath}.visibleScenarioIds`,
  );
  if (briefing.scenarioScope.visibleScenarioIds.length === 0) {
    throw validationErrorV2(
      `${scopePath}.visibleScenarioIds`,
      "must contain at least one Scenario",
    );
  }
  const visibleScenarioIds = new Set<string>();
  briefing.scenarioScope.visibleScenarioIds.forEach((value, index) => {
    const scenarioId = requiredPortableIdV2(
      value,
      `${scopePath}.visibleScenarioIds[${index}]`,
    );
    assertUniqueIdV2(
      visibleScenarioIds,
      scenarioId,
      `${scopePath}.visibleScenarioIds[${index}]`,
    );
  });
  requiredPortableIdV2(
    briefing.scenarioScope.initialFocusScenarioId,
    `${scopePath}.initialFocusScenarioId`,
  );

  arrayV2(briefing.graphs, `${path}.graphs`);
  const graphPaneIds = new Set<string>();
  const graphOrders = new Set<number>();
  briefing.graphs.forEach((graph, index) => {
    const graphPath = `${path}.graphs[${index}]`;
    assertRequiredOptionalKeysV2(
      graph,
      ["paneId", "order", "emphasis"],
      ["overrides"],
      graphPath,
    );
    const paneId = requiredPortableIdV2(
      graph.paneId,
      `${graphPath}.paneId`,
    );
    assertUniqueIdV2(graphPaneIds, paneId, `${graphPath}.paneId`);
    semanticOrderV2(graph.order, `${graphPath}.order`);
    assertUniqueOrderV2(graphOrders, graph.order, `${graphPath}.order`);
    if (graph.emphasis !== "primary" && graph.emphasis !== "supporting") {
      throw validationErrorV2(
        `${graphPath}.emphasis`,
        "must be primary or supporting",
      );
    }
    if (hasOwnV2(graph, "overrides")) {
      assertGraphBriefingOverridesV2(
        graph.overrides,
        `${graphPath}.overrides`,
      );
    }
  });

  arrayV2(briefing.outputs, `${path}.outputs`);
  const outputIds = new Set<string>();
  const outputOrders = new Set<number>();
  briefing.outputs.forEach((output, index) => {
    const outputPath = `${path}.outputs[${index}]`;
    assertExactKeysV2(output, ["outputId", "label", "order"], outputPath);
    const outputId = requiredPortableIdV2(
      output.outputId,
      `${outputPath}.outputId`,
    );
    assertUniqueIdV2(outputIds, outputId, `${outputPath}.outputId`);
    requiredTrimmedStringV2(output.label, `${outputPath}.label`);
    semanticOrderV2(output.order, `${outputPath}.order`);
    assertUniqueOrderV2(outputOrders, output.order, `${outputPath}.order`);
  });

  arrayV2(briefing.controls, `${path}.controls`);
  const controlIds = new Set<string>();
  const controlOrders = new Set<number>();
  briefing.controls.forEach((control, index) => {
    const controlPath = `${path}.controls[${index}]`;
    assertExactKeysV2(control, [
      "controlId",
      "label",
      "order",
      "presentation",
      "binding",
    ], controlPath);
    const controlId = requiredPortableIdV2(
      control.controlId,
      `${controlPath}.controlId`,
    );
    assertUniqueIdV2(controlIds, controlId, `${controlPath}.controlId`);
    requiredTrimmedStringV2(control.label, `${controlPath}.label`);
    semanticOrderV2(control.order, `${controlPath}.order`);
    assertUniqueOrderV2(controlOrders, control.order, `${controlPath}.order`);
    assertControlBriefingPresentationV2(
      control.presentation,
      `${controlPath}.presentation`,
    );
    assertControlBriefingBindingV2(
      control.binding,
      `${controlPath}.binding`,
    );
  });
}

function assertGraphBriefingOverridesV2(
  overrides: unknown,
  path: string,
): void {
  assertRequiredOptionalKeysV2(overrides, [], [
    "label",
    "legend",
    "series",
    "windowSec",
    "historyDepth",
  ], path);
  if (hasOwnV2(overrides, "label")) {
    requiredTrimmedStringV2(overrides.label, `${path}.label`);
  }
  if (
    hasOwnV2(overrides, "legend")
    && overrides.legend !== "auto"
    && overrides.legend !== "hidden"
    && overrides.legend !== "compact"
    && overrides.legend !== "full"
  ) {
    throw validationErrorV2(
      `${path}.legend`,
      "must be auto, hidden, compact, or full",
    );
  }
  if (hasOwnV2(overrides, "windowSec")) {
    sweepWindowSecV2(overrides.windowSec, `${path}.windowSec`);
  }
  if (hasOwnV2(overrides, "historyDepth")) {
    graphHistoryDepthV2(overrides.historyDepth, `${path}.historyDepth`);
  }
  if (!hasOwnV2(overrides, "series")) return;

  arrayV2(overrides.series, `${path}.series`);
  const seriesIds = new Set<string>();
  const seriesOrders = new Set<number>();
  overrides.series.forEach((series, index) => {
    const seriesPath = `${path}.series[${index}]`;
    assertExactKeysV2(
      series,
      ["seriesId", "label", "colorHex", "order"],
      seriesPath,
    );
    const seriesId = requiredPortableIdV2(
      series.seriesId,
      `${seriesPath}.seriesId`,
    );
    assertUniqueIdV2(seriesIds, seriesId, `${seriesPath}.seriesId`);
    requiredTrimmedStringV2(series.label, `${seriesPath}.label`);
    canonicalColorHexV2(series.colorHex, `${seriesPath}.colorHex`);
    semanticOrderV2(series.order, `${seriesPath}.order`);
    assertUniqueOrderV2(
      seriesOrders,
      series.order as number,
      `${seriesPath}.order`,
    );
  });
}

function assertControlBriefingPresentationV2(
  presentation: unknown,
  path: string,
): void {
  recordV2(presentation, path);
  if (presentation.kind === "slider") {
    assertExactKeysV2(presentation, ["kind"], path);
    return;
  }
  if (presentation.kind !== "buttons") {
    throw validationErrorV2(`${path}.kind`, "must be slider or buttons");
  }
  assertExactKeysV2(presentation, ["kind", "options"], path);
  arrayV2(presentation.options, `${path}.options`);
  if (presentation.options.length === 0) {
    throw validationErrorV2(
      `${path}.options`,
      "button presentation must contain at least one option",
    );
  }
  const labels = new Set<string>();
  const values = new Set<number>();
  presentation.options.forEach((option, index) => {
    const optionPath = `${path}.options[${index}]`;
    assertExactKeysV2(option, ["label", "value"], optionPath);
    requiredTrimmedStringV2(option.label, `${optionPath}.label`);
    const label = option.label as string;
    if (labels.has(label)) {
      throw validationErrorV2(
        `${optionPath}.label`,
        `duplicate button label ${label}`,
      );
    }
    labels.add(label);
    finiteNumberV2(option.value, `${optionPath}.value`);
    const value = option.value as number;
    if (values.has(value)) {
      throw validationErrorV2(
        `${optionPath}.value`,
        `duplicate button value ${String(value)}`,
      );
    }
    values.add(value);
  });
}

function assertControlBriefingBindingV2(
  binding: unknown,
  path: string,
): void {
  recordV2(binding, path);
  if (binding.mode === "reader-focus") {
    assertExactKeysV2(binding, ["mode", "allowedScenarioIds"], path);
    assertNonemptyUniquePortableIdsV2(
      binding.allowedScenarioIds,
      `${path}.allowedScenarioIds`,
    );
    return;
  }
  if (binding.mode !== "fixed") {
    throw validationErrorV2(
      `${path}.mode`,
      "must be reader-focus or fixed",
    );
  }
  assertExactKeysV2(binding, ["mode", "scenarioIds", "application"], path);
  if (binding.application !== "absolute") {
    throw validationErrorV2(
      `${path}.application`,
      "must be absolute",
    );
  }
  assertNonemptyUniquePortableIdsV2(
    binding.scenarioIds,
    `${path}.scenarioIds`,
  );
}

function assertNonemptyUniquePortableIdsV2(
  value: unknown,
  path: string,
): void {
  arrayV2(value, path);
  if (value.length === 0) {
    throw validationErrorV2(path, "must contain at least one Scenario");
  }
  const seen = new Set<string>();
  value.forEach((candidate, index) => {
    const id = requiredPortableIdV2(candidate, `${path}[${index}]`);
    assertUniqueIdV2(seen, id, `${path}[${index}]`);
  });
}

function assertKnownSubsetV2(
  subset: readonly string[],
  available: readonly string[],
  path: string,
  memberField?: string,
): void {
  const availableIds = new Set(available);
  subset.forEach((id, index) => {
    if (!availableIds.has(id)) {
      throw validationErrorV2(
        `${path}[${index}]${memberField === undefined ? "" : `.${memberField}`}`,
        `unknown id ${id}`,
      );
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

function assertUniqueOrderV2(
  seen: Set<number>,
  value: number,
  path: string,
): void {
  if (seen.has(value)) {
    throw validationErrorV2(path, `duplicate order ${value}`);
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

function canonicalColorHexV2(value: unknown, path: string): void {
  if (typeof value !== "string" || !/^#[0-9a-f]{6}$/.test(value)) {
    throw validationErrorV2(
      path,
      "must be a canonical lowercase #rrggbb color",
    );
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

function finiteNumberV2(value: unknown, path: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw validationErrorV2(path, "must be a finite number");
  }
}

function sweepWindowSecV2(value: unknown, path: string): void {
  if (
    typeof value !== "number"
    || !Number.isFinite(value)
    || value < STUDIO_SWEEP_WINDOW_MIN_SEC_V2
    || value > STUDIO_SWEEP_WINDOW_MAX_SEC_V2
    || Math.abs(
      (value - STUDIO_SWEEP_WINDOW_MIN_SEC_V2)
        / STUDIO_SWEEP_WINDOW_STEP_SEC_V2
      - Math.round(
        (value - STUDIO_SWEEP_WINDOW_MIN_SEC_V2)
          / STUDIO_SWEEP_WINDOW_STEP_SEC_V2,
      ),
    ) > 1e-9
  ) {
    throw validationErrorV2(
      path,
      `must be ${STUDIO_SWEEP_WINDOW_MIN_SEC_V2}–${STUDIO_SWEEP_WINDOW_MAX_SEC_V2} `
        + `seconds in ${STUDIO_SWEEP_WINDOW_STEP_SEC_V2} second steps`,
    );
  }
}

function graphHistoryDepthV2(value: unknown, path: string): void {
  if (
    !Number.isSafeInteger(value)
    || (value as number) < STUDIO_GRAPH_HISTORY_MIN_DEPTH_V2
    || (value as number) > STUDIO_GRAPH_HISTORY_MAX_DEPTH_V2
  ) {
    throw validationErrorV2(
      path,
      `must be an integer from ${STUDIO_GRAPH_HISTORY_MIN_DEPTH_V2} to `
        + `${STUDIO_GRAPH_HISTORY_MAX_DEPTH_V2}`,
    );
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
