import {
  createStudioFixtureReducerV2,
} from "@/studio/application/runtime/StudioFixtureReducerV2";
import {
  admitAndSealStudioSnapshotCommitV1,
  type StudioAdmittedSnapshotCommitV1,
} from "@/studio/application/authoring/StudioAdmittedSnapshotCommitV1";
import {
  assertCapturedDesiredContentV2,
  captureDesiredContentAtAcceptedBoundaryV2,
  StudioExperimentCaptureMutationErrorV2,
} from "@/studio/application/authoring/StudioExperimentAuthoringApplicationV2";
import {
  assertExperimentCapturesMatchModelV2,
  assertExperimentContentMatchesModelV2,
  validateExperimentSnapshotV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
import {
  STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2,
  STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
  type ExperimentContentV2,
  type ExperimentSnapshotV2,
  type ExperimentSurfaceV2,
  type ExperimentV2,
  type ScenarioCaptureV2,
} from "@/studio/contracts/v2/content";
import type {
  ResolvedExactModelRuntimeV2,
} from "@/studio/contracts/v2/executable";
import {
  assertBoundExecutionPlanV1,
  type BoundExecutionPlanV1,
} from "@/runtime/executionPlan/BoundExecutionPlanV1";
import type {
  StudioJsonObjectV2,
} from "@/studio/contracts/v2/json";
import type {
  ModelContractV2,
} from "@/studio/contracts/v2/model";
import type {
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import {
  studioCanonicalJsonStringify,
} from "@/studio/infrastructure/json/StudioCanonicalJson";

export const STUDIO_EXPERIMENT_APPLY_PLAN_V1_SCHEMA_ID =
  "circleheart-studio-experiment-apply-plan-v1" as const;

export type StudioAuthoringControlAssignmentV1 = Readonly<{
  controlId: string;
  value: number;
}>;

export type StudioAuthoringScenarioOperationV1 =
  | Readonly<{
      operation: "add";
      scenarioId: string;
      label: string;
      /** Null starts from the exact release default fixture. */
      sourceScenarioId: string | null;
      controls: readonly StudioAuthoringControlAssignmentV1[];
    }>
  | Readonly<{
      operation: "update";
      scenarioId: string;
      /** Null preserves the current label. */
      label: string | null;
      controls: readonly StudioAuthoringControlAssignmentV1[];
    }>
  | Readonly<{
      operation: "remove";
      scenarioId: string;
    }>;

export type StudioAuthoringPresentationSpecV1 = Readonly<{
  mode: "default" | "preserve";
  note: string;
}>;

export type StudioAuthoringExecutionBudgetV1 = Readonly<{
  advanceSeconds: number;
  maxPresentationSteps: number;
  wallClockTimeoutMs: number;
}>;

export type StudioAuthoringExactModelPinV1 = Readonly<{
  modelId: string;
  surfaceSeriesId: string;
  surfaceReleaseId: string;
}>;

export type StudioAuthoringResolvedNumericalModelV1 = Readonly<{
  contract: ModelContractV2;
  defaultFixture: StudioJsonObjectV2;
  runtime: ResolvedExactModelRuntimeV2;
  surfaceReleaseId: string;
  surfaceSeriesId: string;
}>;

export interface StudioAuthoringNumericalModelPortV1 {
  resolveActiveNumericalModel(): Promise<StudioAuthoringResolvedNumericalModelV1>;
  resolveLatestNumericalModel(input: Readonly<{
    modelId: string;
    surfaceSeriesId: string;
  }>): Promise<StudioAuthoringResolvedNumericalModelV1>;
  resolveExactNumericalModel(input: StudioAuthoringExactModelPinV1):
    Promise<StudioAuthoringResolvedNumericalModelV1>;
  prepareSurface(input: Readonly<{
    contract: ModelContractV2;
    currentSurface: ExperimentSurfaceV2 | null;
    scenarioIds: readonly string[];
    presentation: StudioAuthoringPresentationSpecV1;
  }>): ExperimentSurfaceV2;
}

export interface StudioNumericalAuthoringRepositoryPortV1 {
  readMyExperiment(experimentId: string): Promise<Readonly<{
    experiment: ExperimentV2;
    title: string;
  }> | null>;
  saveExperiment(input: Readonly<{
    experimentId: string | null;
    expectedVersion: number | null;
    title: string;
    content: ExperimentContentV2;
  }>): Promise<ExperimentV2>;
  commitSnapshot(input: Readonly<{
    admitted: StudioAdmittedSnapshotCommitV1;
    sourceExperiment?: Readonly<{
      experimentId: string;
      expectedVersion: number;
    }>;
  }>): Promise<ExperimentSnapshotV2>;
}

export type StudioExperimentPlanRequestV1 = Readonly<{
  experimentId: string | null;
  expectedVersion: number | null;
  title: string;
  scenarioOperations: readonly StudioAuthoringScenarioOperationV1[];
  presentation: StudioAuthoringPresentationSpecV1;
  executionBudget: StudioAuthoringExecutionBudgetV1;
  observeOutputIds: readonly string[] | null;
}>;

export type StudioExperimentApplyPlanV1 = Readonly<{
  schemaId: typeof STUDIO_EXPERIMENT_APPLY_PLAN_V1_SCHEMA_ID;
  planDigest: string;
  experimentId: string | null;
  expectedVersion: number | null;
  exactModel: StudioAuthoringExactModelPinV1;
  baseScenarioIds: readonly string[];
  title: string;
  scenarioOperations: readonly StudioAuthoringScenarioOperationV1[];
  presentation: StudioAuthoringPresentationSpecV1;
  executionBudget: StudioAuthoringExecutionBudgetV1;
  observeOutputIds: readonly string[] | null;
}>;

export type StudioSnapshotSealInputV1 = Readonly<{
  experimentId: string;
  expectedVersion: number;
  exactModel: StudioAuthoringExactModelPinV1;
  snapshotId: string;
  createdAt: string;
  observeOutputIds: readonly string[] | null;
}>;

export type StudioAuthoringExperimentSummaryV1 = Readonly<{
  experimentId: string;
  version: number;
  modelId: string;
  surfaceSeriesId: string;
  scenarioIds: readonly string[];
}>;

export type StudioAuthoringSnapshotSummaryV1 = Readonly<{
  snapshotId: string;
  modelId: string;
  surfaceSeriesId: string;
  surfaceReleaseId: string;
  scenarioIds: readonly string[];
  createdAt: string;
}>;

export type StudioAuthoringScenarioDiffV1 = Readonly<{
  addedScenarioIds: readonly string[];
  updatedScenarioIds: readonly string[];
  removedScenarioIds: readonly string[];
  /** Scenarios whose numerical state will advance during apply. */
  advancedScenarioIds: readonly string[];
  finalScenarioIds: readonly string[];
}>;

export type StudioAuthoringObservationV1 = Readonly<{
  scenarioId: string;
  acceptedRevision: number;
  acceptedTimeSec: number;
  inputEpoch: number;
  outputs: readonly Readonly<{
    outputId: string;
    value: number | readonly number[] | null;
    availability: string;
    quality: string;
  }>[];
}>;

type StudioResolvedScenarioSpecV1 = Readonly<{
  scenarioId: string;
  label: string;
  sourceScenarioId: string | null;
  controls: readonly StudioAuthoringControlAssignmentV1[];
}>;

type StudioPreparedExperimentCaptureV1 = Readonly<{
  content: ExperimentContentV2;
  observations: readonly StudioAuthoringObservationV1[];
}>;

export async function previewStudioExperimentPlanV1(
  repository: StudioNumericalAuthoringRepositoryPortV1,
  models: StudioAuthoringNumericalModelPortV1,
  input: StudioExperimentPlanRequestV1,
): Promise<Readonly<{
  plan: StudioExperimentApplyPlanV1;
  diff: StudioAuthoringScenarioDiffV1;
  observations: readonly StudioAuthoringObservationV1[];
}>> {
  const currentResource = await readAndAssertExperimentBaseV1(repository, input);
  const resolved = currentResource === null
    ? await models.resolveActiveNumericalModel()
    : await models.resolveLatestNumericalModel({
        modelId: currentResource.experiment.content.modelId,
        surfaceSeriesId: currentResource.experiment.content.surfaceSeriesId,
      });
  const exactModel = exactModelPinFromResolvedV1(resolved);
  const baseScenarioIds = currentResource?.experiment.content.scenarios.map(
    ({ scenarioId }) => scenarioId,
  ) ?? [];
  const core = Object.freeze({
    schemaId: STUDIO_EXPERIMENT_APPLY_PLAN_V1_SCHEMA_ID,
    experimentId: input.experimentId,
    expectedVersion: input.expectedVersion,
    exactModel,
    baseScenarioIds: Object.freeze([...baseScenarioIds]),
    title: input.title,
    scenarioOperations: input.scenarioOperations,
    presentation: input.presentation,
    executionBudget: input.executionBudget,
    observeOutputIds: input.observeOutputIds,
  });
  const plan = Object.freeze({
    ...core,
    planDigest: await sha256CanonicalV1(core),
  });
  const planned = applyScenarioOperationsV1(
    currentResource?.experiment ?? null,
    plan.scenarioOperations,
  );
  const prepared = await prepareExperimentCaptureV1(
    models,
    resolved,
    currentResource?.experiment ?? null,
    plan,
    planned.scenarios,
  );
  return Object.freeze({
    plan,
    diff: planned.diff,
    observations: prepared.observations,
  });
}

export async function applyStudioExperimentPlanV1(
  repository: StudioNumericalAuthoringRepositoryPortV1,
  models: StudioAuthoringNumericalModelPortV1,
  plan: StudioExperimentApplyPlanV1,
): Promise<Readonly<{
  savedExperiment: StudioAuthoringExperimentSummaryV1;
  observations: readonly StudioAuthoringObservationV1[];
}>> {
  await assertStudioExperimentPlanDigestV1(plan);
  const currentResource = await readAndAssertExperimentBaseV1(repository, plan);
  const current = currentResource?.experiment ?? null;
  const currentScenarioIds = current?.content.scenarios.map(({ scenarioId }) => scenarioId) ?? [];
  if (!sameStringsV1(currentScenarioIds, plan.baseScenarioIds)) {
    throw new Error("Experiment Scenario base changed after preview; create a new plan");
  }
  if (
    current !== null
    && (
      current.content.modelId !== plan.exactModel.modelId
      || current.content.surfaceSeriesId !== plan.exactModel.surfaceSeriesId
    )
  ) {
    throw new Error("Experiment exact model identity changed after preview");
  }
  const resolved = await models.resolveExactNumericalModel(plan.exactModel);
  assertResolvedMatchesPinV1(resolved, plan.exactModel);
  const planned = applyScenarioOperationsV1(current, plan.scenarioOperations);
  const prepared = await prepareExperimentCaptureV1(
    models,
    resolved,
    current,
    plan,
    planned.scenarios,
  );
  const experiment = await repository.saveExperiment({
    experimentId: plan.experimentId,
    expectedVersion: plan.expectedVersion,
    title: plan.title,
    content: prepared.content,
  });
  return Object.freeze({
    savedExperiment: summarizeExperimentV1(experiment),
    observations: prepared.observations,
  });
}

export async function sealStudioExperimentSnapshotV1(
  repository: StudioNumericalAuthoringRepositoryPortV1,
  models: StudioAuthoringNumericalModelPortV1,
  input: StudioSnapshotSealInputV1,
): Promise<Readonly<{
  sealedSnapshot: StudioAuthoringSnapshotSummaryV1;
  observations: readonly StudioAuthoringObservationV1[];
}>> {
  const currentResource = await repository.readMyExperiment(input.experimentId);
  if (currentResource === null) {
    throw new Error(`Experiment ${input.experimentId} is unavailable`);
  }
  const current = currentResource.experiment;
  if (current.version !== input.expectedVersion) {
    throw new Error(
      `Experiment version conflict: expected ${input.expectedVersion}, current ${current.version}`,
    );
  }
  if (
    current.content.modelId !== input.exactModel.modelId
    || current.content.surfaceSeriesId !== input.exactModel.surfaceSeriesId
  ) {
    throw new Error("Snapshot exact model pin does not match the Experiment");
  }
  const resolved = await models.resolveExactNumericalModel(input.exactModel);
  assertResolvedMatchesPinV1(resolved, input.exactModel);
  const runtimeSessionId = `authoring/seal/${crypto.randomUUID()}`;
  const adapter = resolved.runtime.simulationAdapter;
  const sessionCreateInput = Object.freeze({
    runtimeSessionId,
    scenarios: current.content.scenarios.map((scenario) => Object.freeze({
      scenarioId: scenario.scenarioId,
      fixture: scenario.capture.fixture,
      checkpoint: scenario.capture.checkpoint,
    })),
  });
  const scenarioIds = current.content.scenarios.map(
    ({ scenarioId }) => scenarioId,
  );
  const boundExecutionPlans = bindAuthoringExecutionPlansV1(
    resolved.runtime,
    scenarioIds,
  );
  await resolved.runtime.executionPlan.createSession(Object.freeze({
    ...sessionCreateInput,
    boundExecutionPlans,
  }));
  try {
    const frames = new Map(scenarioIds.map((scenarioId) => [scenarioId,
      adapter.currentFrame({ runtimeSessionId, scenarioId })]));
    // Observation selection is part of the command's validation boundary. It
    // must fail before admission/persistence so the error envelope can truthfully
    // report that no durable commit occurred.
    const observations = Object.freeze(scenarioIds.map((scenarioId) =>
      observationFromFrameV1(
        frames.get(scenarioId)!,
        input.observeOutputIds,
      )));
    const desiredContent = Object.freeze({
      modelId: current.content.modelId,
      surfaceSeriesId: current.content.surfaceSeriesId,
      scenarios: Object.freeze(current.content.scenarios.map((scenario) =>
        Object.freeze({
          scenarioId: scenario.scenarioId,
          label: scenario.label,
          fixture: scenario.capture.fixture,
        }))),
      surface: current.content.surface,
    });
    const content = await captureDesiredContentV1(
      resolved,
      runtimeSessionId,
      current.experimentId,
      desiredContent,
      scenarioIds,
      adapter,
    );
    const candidate = validateExperimentSnapshotV2({
      schemaId: STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
      snapshotId: input.snapshotId,
      surfaceReleaseId: input.exactModel.surfaceReleaseId,
      content,
      createdAt: input.createdAt,
    });
    const admitted = await admitAndSealStudioSnapshotCommitV1({
      snapshot: candidate,
      runtime: resolved.runtime,
    });
    const snapshot = await repository.commitSnapshot({
      admitted,
      sourceExperiment: Object.freeze({
        experimentId: current.experimentId,
        expectedVersion: current.version,
      }),
    });
    return Object.freeze({
      sealedSnapshot: summarizeSnapshotV1(snapshot),
      observations,
    });
  } finally {
    adapter.disposeSession(runtimeSessionId);
  }
}

async function prepareExperimentCaptureV1(
  models: StudioAuthoringNumericalModelPortV1,
  resolved: StudioAuthoringResolvedNumericalModelV1,
  current: ExperimentV2 | null,
  plan: StudioExperimentApplyPlanV1,
  scenarios: readonly StudioResolvedScenarioSpecV1[],
): Promise<StudioPreparedExperimentCaptureV1> {
  const currentById = new Map(
    current?.content.scenarios.map((scenario) =>
      [scenario.scenarioId, scenario] as const) ?? [],
  );
  const sources = scenarios.map((scenario) => {
    const source = scenario.sourceScenarioId === null
      ? null
      : currentById.get(scenario.sourceScenarioId) ?? null;
    if (scenario.sourceScenarioId !== null && source === null) {
      throw new Error(
        `Scenario source ${scenario.sourceScenarioId} is unavailable in the saved Experiment`,
      );
    }
    return Object.freeze({
      spec: scenario,
      fixture: source?.capture.fixture ?? resolved.defaultFixture,
      checkpoint: source?.capture.checkpoint,
    });
  });
  const surface = models.prepareSurface({
    contract: resolved.contract,
    currentSurface: current?.content.surface ?? null,
    scenarioIds: scenarios.map(({ scenarioId }) => scenarioId),
    presentation: plan.presentation,
  });
  const runtimeSessionId = `authoring/session/${crypto.randomUUID()}`;
  const adapter = resolved.runtime.simulationAdapter;
  const sessionCreateInput = Object.freeze({
    runtimeSessionId,
    scenarios: sources.map(({ spec, fixture, checkpoint }) => Object.freeze({
      scenarioId: spec.scenarioId,
      fixture,
      ...(checkpoint === undefined ? {} : { checkpoint }),
    })),
  });
  const boundExecutionPlans = bindAuthoringExecutionPlansV1(
    resolved.runtime,
    sources.map(({ spec }) => spec.scenarioId),
  );
  await resolved.runtime.executionPlan.createSession(Object.freeze({
    ...sessionCreateInput,
    boundExecutionPlans,
  }));
  try {
    const reducer = createStudioFixtureReducerV2(Object.freeze({
      resolveExactRuntime(modelId: string) {
        if (modelId !== resolved.contract.modelId) {
          throw new Error(`Unexpected exact model ${modelId}`);
        }
        return resolved.runtime;
      },
    }));
    const desiredFixtures = new Map<string, ScenarioCaptureV2["fixture"]>();
    for (const { spec, fixture } of sources) {
      let desiredFixture = fixture;
      for (const assignment of spec.controls) {
        desiredFixture = reducer.reduce({
          desiredFixture,
          context: Object.freeze({
            modelId: resolved.contract.modelId,
            scenarioId: spec.scenarioId,
          }),
          action: Object.freeze({
            kind: "control" as const,
            controlId: assignment.controlId,
            value: assignment.value,
          }),
        });
        await adapter.applyControl({
          runtimeSessionId,
          scenarioId: spec.scenarioId,
          controlId: assignment.controlId,
          value: assignment.value,
          expectedInputEpoch: adapter.currentInputEpoch({
            runtimeSessionId,
            scenarioId: spec.scenarioId,
          }),
        });
      }
      desiredFixtures.set(spec.scenarioId, desiredFixture);
    }
    const scenarioIds = scenarios.map(({ scenarioId }) => scenarioId);
    const advanceScenarioIds = plan.scenarioOperations.flatMap((operation) =>
      operation.operation === "add"
        || (operation.operation === "update" && operation.controls.length > 0)
        ? [operation.scenarioId]
        : []);
    const frames = await advanceAuthoringScenariosV1(
      adapter,
      runtimeSessionId,
      scenarioIds,
      advanceScenarioIds,
      plan.executionBudget,
    );
    const desiredContent = Object.freeze({
      modelId: resolved.contract.modelId,
      surfaceSeriesId: plan.exactModel.surfaceSeriesId,
      scenarios: Object.freeze(scenarios.map((scenario) => Object.freeze({
        scenarioId: scenario.scenarioId,
        label: scenario.label,
        fixture: desiredFixtures.get(scenario.scenarioId)!,
      }))),
      surface,
    });
    const content = await captureDesiredContentV1(
      resolved,
      runtimeSessionId,
      current?.experimentId ?? `experiment/plan/${plan.planDigest}`,
      desiredContent,
      scenarioIds,
      adapter,
    );
    return Object.freeze({
      content,
      observations: Object.freeze(scenarioIds.map((scenarioId) =>
        observationFromFrameV1(
          frames.get(scenarioId)!,
          plan.observeOutputIds,
        ))),
    });
  } finally {
    adapter.disposeSession(runtimeSessionId);
  }
}

async function captureDesiredContentV1(
  resolved: StudioAuthoringResolvedNumericalModelV1,
  runtimeSessionId: string,
  experimentId: string,
  desiredContent: Readonly<{
    modelId: string;
    surfaceSeriesId: string;
    scenarios: readonly Readonly<{
      scenarioId: string;
      label: string;
      fixture: ScenarioCaptureV2["fixture"];
    }>[];
    surface: ExperimentSurfaceV2;
  }>,
  scenarioIds: readonly string[],
  adapter: ResolvedExactModelRuntimeV2["simulationAdapter"],
): Promise<ExperimentContentV2> {
  const captureCorrelation = Object.freeze({
    runtimeSessionId,
    scenarios: Object.freeze(scenarioIds.map((scenarioId) => Object.freeze({
      scenarioId,
      expectedInputEpoch: adapter.currentInputEpoch({
        runtimeSessionId,
        scenarioId,
      }),
    }))),
  });
  const content = await captureDesiredContentAtAcceptedBoundaryV2({
    runtime: resolved.runtime,
    experimentId,
    desiredContent,
    captureCorrelation,
  });
  assertCapturedDesiredContentV2(
    desiredContent,
    content,
    (message) => new StudioExperimentCaptureMutationErrorV2(message),
  );
  assertExperimentContentMatchesModelV2(content, resolved.contract);
  await assertExperimentCapturesMatchModelV2(
    content,
    resolved.contract,
    resolved.runtime.captureAdapter,
  );
  return content;
}

async function readAndAssertExperimentBaseV1(
  repository: StudioNumericalAuthoringRepositoryPortV1,
  input: Readonly<{
    experimentId: string | null;
    expectedVersion: number | null;
  }>,
): Promise<Readonly<{ experiment: ExperimentV2; title: string }> | null> {
  const current = input.experimentId === null
    ? null
    : await repository.readMyExperiment(input.experimentId);
  if (input.experimentId !== null && current === null) {
    throw new Error(`Experiment ${input.experimentId} is unavailable`);
  }
  if (current !== null && current.experiment.version !== input.expectedVersion) {
    throw new Error(
      `Experiment version conflict: expected ${String(input.expectedVersion)}, current ${current.experiment.version}`,
    );
  }
  return current;
}

function applyScenarioOperationsV1(
  current: ExperimentV2 | null,
  operations: readonly StudioAuthoringScenarioOperationV1[],
): Readonly<{
  scenarios: readonly StudioResolvedScenarioSpecV1[];
  diff: StudioAuthoringScenarioDiffV1;
}> {
  const currentScenarios = current?.content.scenarios ?? [];
  const currentById = new Map(currentScenarios.map((scenario) =>
    [scenario.scenarioId, scenario] as const));
  const touched = new Set<string>();
  const removed = new Set<string>();
  const updated = new Map<string, Extract<StudioAuthoringScenarioOperationV1, {
    operation: "update";
  }>>();
  const added: Extract<StudioAuthoringScenarioOperationV1, {
    operation: "add";
  }>[] = [];
  for (const operation of operations) {
    if (touched.has(operation.scenarioId)) {
      throw new Error(`Scenario ${operation.scenarioId} has more than one operation`);
    }
    touched.add(operation.scenarioId);
    if (operation.operation === "add") {
      if (currentById.has(operation.scenarioId)) {
        throw new Error(`Scenario ${operation.scenarioId} already exists`);
      }
      if (
        operation.sourceScenarioId !== null
        && !currentById.has(operation.sourceScenarioId)
      ) {
        throw new Error(
          `Scenario source ${operation.sourceScenarioId} is unavailable`,
        );
      }
      added.push(operation);
    } else {
      if (!currentById.has(operation.scenarioId)) {
        throw new Error(`Scenario ${operation.scenarioId} is unavailable`);
      }
      if (operation.operation === "remove") removed.add(operation.scenarioId);
      else updated.set(operation.scenarioId, operation);
    }
  }
  const scenarios: StudioResolvedScenarioSpecV1[] = [];
  for (const scenario of currentScenarios) {
    if (removed.has(scenario.scenarioId)) continue;
    const update = updated.get(scenario.scenarioId);
    scenarios.push(Object.freeze({
      scenarioId: scenario.scenarioId,
      label: update?.label ?? scenario.label,
      sourceScenarioId: scenario.scenarioId,
      controls: update?.controls ?? Object.freeze([]),
    }));
  }
  for (const operation of added) {
    scenarios.push(Object.freeze({
      scenarioId: operation.scenarioId,
      label: operation.label,
      sourceScenarioId: operation.sourceScenarioId,
      controls: operation.controls,
    }));
  }
  if (scenarios.length === 0) {
    throw new Error("Experiment must retain at least one Scenario");
  }
  if (scenarios.length > STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2) {
    throw new Error(
      `Experiment supports at most ${STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2} Scenarios`,
    );
  }
  return Object.freeze({
    scenarios: Object.freeze(scenarios),
    diff: Object.freeze({
      addedScenarioIds: Object.freeze(added.map(({ scenarioId }) => scenarioId)),
      updatedScenarioIds: Object.freeze([...updated.keys()]),
      removedScenarioIds: Object.freeze([...removed]),
      advancedScenarioIds: Object.freeze([
        ...added.map(({ scenarioId }) => scenarioId),
        ...[...updated.values()]
          .filter(({ controls }) => controls.length > 0)
          .map(({ scenarioId }) => scenarioId),
      ]),
      finalScenarioIds: Object.freeze(scenarios.map(({ scenarioId }) => scenarioId)),
    }),
  });
}

export async function assertStudioExperimentPlanDigestV1(
  plan: StudioExperimentApplyPlanV1,
): Promise<void> {
  const { planDigest, ...core } = plan;
  if (!/^[0-9a-f]{64}$/.test(planDigest)) {
    throw new Error("Experiment plan digest must be lowercase SHA-256");
  }
  if (await sha256CanonicalV1(core) !== planDigest) {
    throw new Error("Experiment plan digest does not match its exact plan");
  }
}

async function advanceAuthoringScenariosV1(
  adapter: ResolvedExactModelRuntimeV2["simulationAdapter"],
  runtimeSessionId: string,
  scenarioIds: readonly string[],
  advanceScenarioIds: readonly string[],
  budget: StudioAuthoringExecutionBudgetV1,
): Promise<ReadonlyMap<string, StudioSimulationFrameV2>> {
  const frames = new Map<string, StudioSimulationFrameV2>();
  const targets = new Map<string, number>();
  for (const scenarioId of scenarioIds) {
    const frame = adapter.currentFrame({ runtimeSessionId, scenarioId });
    frames.set(scenarioId, frame);
  }
  for (const scenarioId of advanceScenarioIds) {
    const frame = frames.get(scenarioId);
    if (frame === undefined) {
      throw new Error(`Scenario selected for advance is unavailable: ${scenarioId}`);
    }
    targets.set(scenarioId, frame.acceptedTimeSec + budget.advanceSeconds);
  }
  const startedAt = performance.now();
  let steps = 0;
  let pending = advanceScenarioIds.filter((scenarioId) =>
    frames.get(scenarioId)!.acceptedTimeSec < targets.get(scenarioId)!);
  while (pending.length > 0) {
    if (steps >= budget.maxPresentationSteps) {
      throw new Error("Authoring numerical execution exceeded maxPresentationSteps");
    }
    if (performance.now() - startedAt >= budget.wallClockTimeoutMs) {
      throw new Error("Authoring numerical execution exceeded wallClockTimeoutMs");
    }
    for (const scenarioId of pending) {
      frames.set(scenarioId, await adapter.advanceOnePresentationStep({
        runtimeSessionId,
        scenarioId,
      }));
    }
    steps += 1;
    pending = pending.filter((scenarioId) =>
      frames.get(scenarioId)!.acceptedTimeSec < targets.get(scenarioId)!);
  }
  return frames;
}

function bindAuthoringExecutionPlansV1(
  runtime: ResolvedExactModelRuntimeV2,
  scenarioIds: readonly string[],
): ReadonlyMap<string, BoundExecutionPlanV1> {
  const executionPlan = runtime.executionPlan;
  const boundByScenario = new Map<string, BoundExecutionPlanV1>();
  for (const scenarioId of scenarioIds) {
    const boundExecutionPlan = executionPlan.bind();
    assertBoundExecutionPlanV1(
      boundExecutionPlan,
      executionPlan.descriptor,
    );
    boundByScenario.set(scenarioId, boundExecutionPlan);
  }
  return boundByScenario;
}

function observationFromFrameV1(
  frame: StudioSimulationFrameV2,
  selectedOutputIds: readonly string[] | null,
): StudioAuthoringObservationV1 {
  const selected = selectedOutputIds === null ? null : new Set(selectedOutputIds);
  const outputs = Object.values(frame.outputs).filter(({ outputId }) =>
    selected === null || selected.has(outputId));
  if (selected !== null && outputs.length !== selected.size) {
    const present = new Set(outputs.map(({ outputId }) => outputId));
    const missing = [...selected].filter((outputId) => !present.has(outputId));
    throw new Error(`Requested observation output is unavailable: ${missing.join(", ")}`);
  }
  return Object.freeze({
    scenarioId: frame.scenarioId,
    acceptedRevision: frame.acceptedRevision,
    acceptedTimeSec: frame.acceptedTimeSec,
    inputEpoch: frame.inputEpoch,
    outputs: Object.freeze(outputs.map((output) => Object.freeze({
      outputId: output.outputId,
      value: output.value,
      availability: output.availability,
      quality: output.quality,
    }))),
  });
}

function exactModelPinFromResolvedV1(
  resolved: StudioAuthoringResolvedNumericalModelV1,
): StudioAuthoringExactModelPinV1 {
  return Object.freeze({
    modelId: resolved.contract.modelId,
    surfaceSeriesId: resolved.surfaceSeriesId,
    surfaceReleaseId: resolved.surfaceReleaseId,
  });
}

function assertResolvedMatchesPinV1(
  resolved: StudioAuthoringResolvedNumericalModelV1,
  pin: StudioAuthoringExactModelPinV1,
): void {
  if (
    resolved.contract.modelId !== pin.modelId
    || resolved.surfaceSeriesId !== pin.surfaceSeriesId
    || resolved.surfaceReleaseId !== pin.surfaceReleaseId
  ) {
    throw new Error("Resolved numerical model does not match the exact plan pin");
  }
}

function summarizeExperimentV1(
  experiment: ExperimentV2,
): StudioAuthoringExperimentSummaryV1 {
  return Object.freeze({
    experimentId: experiment.experimentId,
    version: experiment.version,
    modelId: experiment.content.modelId,
    surfaceSeriesId: experiment.content.surfaceSeriesId,
    scenarioIds: Object.freeze(experiment.content.scenarios.map(
      ({ scenarioId }) => scenarioId,
    )),
  });
}

function summarizeSnapshotV1(
  snapshot: ExperimentSnapshotV2,
): StudioAuthoringSnapshotSummaryV1 {
  return Object.freeze({
    snapshotId: snapshot.snapshotId,
    modelId: snapshot.content.modelId,
    surfaceSeriesId: snapshot.content.surfaceSeriesId,
    surfaceReleaseId: snapshot.surfaceReleaseId,
    scenarioIds: Object.freeze(snapshot.content.scenarios.map(
      ({ scenarioId }) => scenarioId,
    )),
    createdAt: snapshot.createdAt,
  });
}

function sameStringsV1(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

async function sha256CanonicalV1(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(studioCanonicalJsonStringify(value)),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")).join("");
}
