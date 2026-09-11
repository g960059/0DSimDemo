import {
  assertStudioAuthoringResolvedNumericalModelMatchesPinV1,
  bindAuthoringExecutionPlansV1,
  type StudioAuthoringExactModelPinV1,
  type StudioAuthoringNumericalModelPortV1,
  type StudioNumericalAuthoringRepositoryPortV1,
} from "./StudioNumericalAuthoringV1";

export type StudioAuthoringTraceInputV1 = Readonly<{
  experimentId: string;
  expectedVersion: number;
  exactModel: StudioAuthoringExactModelPinV1;
  scenarioIds: readonly string[];
  outputIds: readonly string[];
  /** Model-owned presentation steps; returned accepted clocks define physical time. */
  stepCount: number;
  sampleStride: number;
  wallClockTimeoutMs: number;
}>;

export function assertStudioAuthoringTraceSamplingV1(input: StudioAuthoringTraceInputV1): void {
  const distinct = (ids: readonly string[], maximum: number) =>
    ids.length > 0 && ids.length <= maximum && new Set(ids).size === ids.length;
  if (!distinct(input.scenarioIds, 4) || !distinct(input.outputIds, 32)
    || !Number.isSafeInteger(input.stepCount) || input.stepCount < 1 || input.stepCount > 20_000
    || !Number.isSafeInteger(input.sampleStride) || input.sampleStride < 1 || input.sampleStride > 1_000
    || !Number.isSafeInteger(input.wallClockTimeoutMs) || input.wallClockTimeoutMs < 1_000
    || input.wallClockTimeoutMs > 600_000
    || Math.ceil(input.stepCount / input.sampleStride) * input.scenarioIds.length * input.outputIds.length > 500_000) {
    throw new Error("$.command.input trace selection must stay within its sampling budget and contain no duplicates");
  }
}

/** Ephemeral measurements from saved captures. Never advances the saved head. */
export async function traceStudioExperimentV1(
  repository: Pick<StudioNumericalAuthoringRepositoryPortV1, "readMyExperiment">,
  models: StudioAuthoringNumericalModelPortV1,
  input: StudioAuthoringTraceInputV1,
) {
  assertStudioAuthoringTraceSamplingV1(input);
  const saved = await repository.readMyExperiment(input.experimentId);
  if (saved === null) throw new Error("Experiment is unavailable");
  if (saved.experiment.version !== input.expectedVersion) {
    throw new Error(`Experiment version conflict: expected ${input.expectedVersion}, current ${saved.experiment.version}`);
  }
  const content = saved.experiment.content;
  if (content.modelId !== input.exactModel.modelId || content.surfaceSeriesId !== input.exactModel.surfaceSeriesId) {
    throw new Error("$.command.input.exactModel does not match the saved Experiment");
  }
  const scenarios = input.scenarioIds.map(scenarioId => {
    const scenario = content.scenarios.find(item => item.scenarioId === scenarioId);
    if (!scenario) throw new Error(`$.command.input.scenarioIds contains an unavailable Scenario: ${scenarioId}`);
    return scenario;
  });
  const resolved = await models.resolveExactNumericalModel(input.exactModel);
  assertStudioAuthoringResolvedNumericalModelMatchesPinV1(resolved, input.exactModel);
  for (const outputId of input.outputIds) {
    const output = resolved.runtime.exactContract.outputCatalog.find(item => item.outputId === outputId);
    if (!output || output.shape !== "scalar") {
      throw new Error(`$.command.input.outputIds must select exact scalar outputs: ${outputId}`);
    }
  }
  const runtimeSessionId = `authoring/trace/${crypto.randomUUID()}`;
  const adapter = resolved.runtime.simulationAdapter;
  const deadline = performance.now() + input.wallClockTimeoutMs;
  const assertBudget = () => {
    if (performance.now() > deadline) throw new Error("Authoring numerical execution exceeded trace wallClockTimeoutMs");
  };
  try {
    await resolved.runtime.executionPlan.createSession({
      runtimeSessionId,
      scenarios: scenarios.map(({ scenarioId, capture }) => ({ scenarioId, ...capture })),
      boundExecutionPlans: bindAuthoringExecutionPlansV1(resolved.runtime, input.scenarioIds),
    });
    const traces = [];
    for (const { scenarioId } of scenarios) {
      const initial = adapter.currentFrame({ runtimeSessionId, scenarioId });
      const samples: { acceptedTimeSec: number; acceptedRevision: number; values: (number | null)[]; states: number[] }[] = [];
      let previousTime = initial.acceptedTimeSec;
      let previousRevision = initial.acceptedRevision;
      for (let offset = 0; offset < input.stepCount; offset += 64) {
        assertBudget();
        const count = Math.min(64, input.stepCount - offset);
        const batch = await adapter.advancePresentationBatch({
          runtimeSessionId, scenarioId, stepCount: count, presentationOutputIds: input.outputIds,
        });
        assertBudget();
        if (batch.outputIds.length !== input.outputIds.length
          || batch.outputIds.some((id, i) => id !== input.outputIds[i])
          || batch.acceptedTimesSec.length !== count || batch.acceptedRevisions.length !== count
          || batch.outputStates.length !== count * input.outputIds.length
          || batch.outputValues.length !== count * input.outputIds.length
          || batch.terminalFrame.inputEpoch !== initial.inputEpoch) {
          throw new Error("Exact trace batch contract mismatch");
        }
        for (let row = 0; row < count; row++) {
          const time = batch.acceptedTimesSec[row]!;
          const revision = batch.acceptedRevisions[row]!;
          if (!Number.isFinite(time) || time <= previousTime || !Number.isSafeInteger(revision) || revision <= previousRevision) {
            throw new Error("Exact trace accepted clock did not advance");
          }
          previousTime = time;
          previousRevision = revision;
          const step = offset + row + 1;
          if (step % input.sampleStride !== 0 && step !== input.stepCount) continue;
          const states = Array.from(batch.outputStates.slice(row * input.outputIds.length, (row + 1) * input.outputIds.length));
          const values = states.map((state, column) => {
            if (state < 0 || state > 5) throw new Error("Exact trace output state is invalid");
            const value = batch.outputValues[row * input.outputIds.length + column]!;
            if (state >= 3) return null;
            if (!Number.isFinite(value)) throw new Error("Exact trace available scalar is not finite");
            return value;
          });
          samples.push({ acceptedTimeSec: time, acceptedRevision: revision, values, states });
        }
      }
      traces.push({ scenarioId, inputEpoch: initial.inputEpoch,
        startAcceptedTimeSec: initial.acceptedTimeSec, startAcceptedRevision: initial.acceptedRevision, samples });
    }
    return { source: { experimentId: input.experimentId, version: input.expectedVersion, exactModel: input.exactModel },
      stepCount: input.stepCount, sampleStride: input.sampleStride, outputIds: input.outputIds, traces };
  } finally {
    adapter.disposeSession(runtimeSessionId);
  }
}
