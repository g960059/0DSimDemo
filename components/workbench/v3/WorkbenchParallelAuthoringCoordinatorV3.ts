import {
  STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID,
  STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID,
  type ExperimentScenarioV2,
  type ExperimentSnapshotV2,
  type ExperimentSurfaceV2,
  type ExperimentWorkspaceV2,
  type ScenarioPresetV2,
} from "@/studio/contracts/v2/content";
import {
  validateExperimentSnapshotV2,
  validateExperimentWorkspaceV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
import {
  StudioSimulationWorkerClientV2,
  type StudioSimulationWorkerQualifiedSnapshotCommitV2,
} from "@/studio/workers/StudioSimulationWorkerClientV2";

export type WorkbenchParallelAuthoringClientFactoryV3 =
  () => StudioSimulationWorkerClientV2;

export type WorkbenchParallelAuthoringInputV3 = Readonly<{
  modelId: string;
  /** Exact captures gathered from the live lane Workers, in UI order. */
  scenarios: readonly ExperimentScenarioV2[];
  activeScenarioId: string;
  surface: ExperimentSurfaceV2;
  workspace: ExperimentWorkspaceV2 | null;
  snapshots: readonly ExperimentSnapshotV2[];
  experimentId: string;
  runtimeSessionId: string;
}>;

type ValidatedAuthoringInputV3 = Readonly<{
  modelId: string;
  scenarios: readonly ExperimentScenarioV2[];
  activeScenario: ExperimentScenarioV2;
  surface: ExperimentSurfaceV2;
  workspace: ExperimentWorkspaceV2 | null;
  snapshots: readonly ExperimentSnapshotV2[];
  experimentId: string;
  runtimeSessionId: string;
}>;

/**
 * Reassembles parallel live lanes inside one short-lived authoring Worker.
 *
 * Live lane Workers remain the runtime authorities for their own Scenario.
 * This coordinator exists only across one explicit Save or Snapshot command;
 * it never persists runtime status, transport identity, or integrity metadata.
 */
export class WorkbenchParallelAuthoringCoordinatorV3 {
  readonly #createClient: WorkbenchParallelAuthoringClientFactoryV3;

  constructor(
    createClient: WorkbenchParallelAuthoringClientFactoryV3 =
      () => new StudioSimulationWorkerClientV2(),
  ) {
    this.#createClient = createClient;
  }

  async saveDraft(
    inputValue: WorkbenchParallelAuthoringInputV3,
  ): Promise<ExperimentWorkspaceV2> {
    const input = validateAuthoringInputV3(inputValue);
    const client = this.#createClient();
    try {
      if (input.workspace === null) {
        await initializeFirstSaveV3(client, input);
        return await client.saveDraft({
          runtimeSessionId: input.runtimeSessionId,
          scenarioId: input.activeScenario.scenarioId,
          experimentId: input.experimentId,
          surface: input.surface,
          expectedDraftVersion: null,
        });
      }

      const syntheticWorkspace = validateExperimentWorkspaceV2({
        ...input.workspace,
        content: {
          modelId: input.modelId,
          scenarios: input.scenarios,
          surface: input.surface,
        },
      });
      await initializeFromWorkspaceV3(
        client,
        input,
        syntheticWorkspace,
      );
      return await client.saveDraft({
        runtimeSessionId: input.runtimeSessionId,
        scenarioId: input.activeScenario.scenarioId,
        experimentId: input.experimentId,
        surface: input.surface,
        expectedDraftVersion: input.workspace.draftVersion,
      });
    } finally {
      client.terminate();
    }
  }

  async createSnapshot(
    inputValue: WorkbenchParallelAuthoringInputV3,
  ): Promise<StudioSimulationWorkerQualifiedSnapshotCommitV2> {
    const input = validateAuthoringInputV3(inputValue);
    const workspace = input.workspace;
    if (workspace === null) {
      throw new Error(
        "parallel authoring Snapshot requires a saved Draft workspace",
      );
    }
    const durableActiveScenario = workspace.content.scenarios.find(
      ({ scenarioId }) => scenarioId === input.activeScenario.scenarioId,
    );
    if (durableActiveScenario === undefined) {
      throw new Error(
        "parallel authoring active Scenario is not in the saved Draft workspace",
      );
    }

    const client = this.#createClient();
    try {
      await client.initialize({
        expectedModelId: input.modelId,
        runtimeSessionId: input.runtimeSessionId,
        scenarioId: durableActiveScenario.scenarioId,
        scenarioLabel: durableActiveScenario.label,
        fixture: durableActiveScenario.capture.fixture,
        checkpoint: durableActiveScenario.capture.checkpoint,
        authoringSeed: {
          workspace,
          snapshots: input.snapshots,
        },
      });
      // Return the Worker's original sealed object. Cloning or reconstructing
      // it would intentionally invalidate browser Snapshot persistence.
      return await client.createSnapshot({
        runtimeSessionId: input.runtimeSessionId,
        scenarioId: durableActiveScenario.scenarioId,
        experimentId: input.experimentId,
        expectedDraftVersion: workspace.draftVersion,
        expectedHeadSnapshotId: workspace.headSnapshotId,
      });
    } finally {
      client.terminate();
    }
  }
}

async function initializeFirstSaveV3(
  client: StudioSimulationWorkerClientV2,
  input: ValidatedAuthoringInputV3,
): Promise<void> {
  const firstScenario = input.scenarios[0]!;
  await client.initialize({
    expectedModelId: input.modelId,
    runtimeSessionId: input.runtimeSessionId,
    scenarioId: firstScenario.scenarioId,
    scenarioLabel: firstScenario.label,
    fixture: firstScenario.capture.fixture,
    checkpoint: firstScenario.capture.checkpoint,
  });

  let selectedScenarioId = firstScenario.scenarioId;
  for (let index = 1; index < input.scenarios.length; index += 1) {
    const scenario = input.scenarios[index]!;
    await client.addScenarioFromPreset({
      runtimeSessionId: input.runtimeSessionId,
      scenarioId: scenario.scenarioId,
      label: scenario.label,
      preset: transientPresetV3(input.modelId, scenario, index),
    });
    selectedScenarioId = scenario.scenarioId;
  }

  if (selectedScenarioId !== input.activeScenario.scenarioId) {
    await client.selectScenario({
      runtimeSessionId: input.runtimeSessionId,
      scenarioId: input.activeScenario.scenarioId,
    });
  }
}

async function initializeFromWorkspaceV3(
  client: StudioSimulationWorkerClientV2,
  input: ValidatedAuthoringInputV3,
  workspace: ExperimentWorkspaceV2,
): Promise<void> {
  await client.initialize({
    expectedModelId: input.modelId,
    runtimeSessionId: input.runtimeSessionId,
    scenarioId: input.activeScenario.scenarioId,
    scenarioLabel: input.activeScenario.label,
    fixture: input.activeScenario.capture.fixture,
    checkpoint: input.activeScenario.capture.checkpoint,
    authoringSeed: {
      workspace,
      snapshots: input.snapshots,
    },
  });
}

function transientPresetV3(
  modelId: string,
  scenario: ExperimentScenarioV2,
  index: number,
): ScenarioPresetV2 {
  return Object.freeze({
    schemaId: STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID,
    presetId: `transient/parallel-authoring/${index}`,
    modelId,
    title: scenario.label,
    description: "Transient exact capture for parallel authoring assembly.",
    capture: scenario.capture,
  });
}

function validateAuthoringInputV3(
  input: WorkbenchParallelAuthoringInputV3,
): ValidatedAuthoringInputV3 {
  if (input.scenarios.length === 0) {
    throw new Error("parallel authoring requires at least one Scenario capture");
  }
  if (input.workspace === null && input.snapshots.length > 0) {
    throw new Error(
      "parallel authoring cannot seed Snapshots without their Workspace",
    );
  }

  const workspace = input.workspace === null
    ? null
    : validateExperimentWorkspaceV2(input.workspace);
  if (workspace !== null) {
    if (workspace.experimentId !== input.experimentId) {
      throw new Error(
        "parallel authoring workspace Experiment identity mismatch",
      );
    }
    if (workspace.content.modelId !== input.modelId) {
      throw new Error("parallel authoring workspace exact modelId mismatch");
    }
  }

  // Reuse the durable validator as the single structural authority for the
  // ordered Scenario captures and Surface, even before a first Draft exists.
  const validatedContent = validateExperimentWorkspaceV2({
    schemaId: STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID,
    experimentId: input.experimentId,
    draftVersion: workspace?.draftVersion ?? 0,
    headSnapshotId: null,
    basedOnSnapshotId: null,
    content: {
      modelId: input.modelId,
      scenarios: input.scenarios,
      surface: input.surface,
    },
  }).content;
  const activeScenario = validatedContent.scenarios.find(
    ({ scenarioId }) => scenarioId === input.activeScenarioId,
  );
  if (activeScenario === undefined) {
    throw new Error(
      "parallel authoring active Scenario is not in the gathered captures",
    );
  }

  const snapshotIds = new Set<string>();
  const snapshots = Object.freeze(input.snapshots.map((snapshotValue) => {
    const snapshot = validateExperimentSnapshotV2(snapshotValue);
    if (snapshotIds.has(snapshot.snapshotId)) {
      throw new Error(
        `parallel authoring received duplicate Snapshot: ${snapshot.snapshotId}`,
      );
    }
    snapshotIds.add(snapshot.snapshotId);
    return snapshot;
  }));

  return Object.freeze({
    modelId: validatedContent.modelId,
    scenarios: validatedContent.scenarios,
    activeScenario,
    surface: validatedContent.surface,
    workspace,
    snapshots,
    experimentId: input.experimentId,
    runtimeSessionId: input.runtimeSessionId,
  });
}
