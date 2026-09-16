import { deepStrictEqual } from "node:assert";
import type { ExperimentSnapshotV2, ScenarioCaptureV2 } from "@/studio/contracts/v2/content";
import type { ResolvedExactModelRuntimeV2 } from "@/studio/contracts/v2/executable";
import type { RegisteredModelPresentationBatchV2 } from "@/studio/contracts/v2/simulation";

export function assertAuthoredSuccessorBatchFiniteV1(batch: RegisteredModelPresentationBatchV2) {
  for (const values of [batch.acceptedRevisions, batch.acceptedTimesSec, batch.outputValues]) {
    if (values.length === 0 || !values.every(Number.isFinite)) throw new Error("Successor live audit requires finite accepted samples");
  }
  if (!Number.isFinite(batch.terminalFrame.acceptedTimeSec) || !Number.isSafeInteger(batch.terminalFrame.acceptedRevision))
    throw new Error("Successor live audit requires finite accepted clocks");
  for (const output of Object.values(batch.terminalFrame.outputs)) {
    if (output.value !== null && !(Array.isArray(output.value) ? output.value : [output.value]).every(value => typeof value === "number" && Number.isFinite(value)))
      throw new Error("Successor live audit requires finite terminal outputs");
  }
}

/** Additional transfer gate: execute the ordinary compiled presentation ABI,
 * which uses predictor history unlike the public-path Snapshot probe. Never
 * substitute the advanced capture for the authored migration payload. */
export async function validateAuthoredSuccessorLiveContinuationV1(snapshot: ExperimentSnapshotV2, runtime: ResolvedExactModelRuntimeV2) {
  const adapter = runtime.simulationAdapter;
  const stepSec = (runtime.executionPlan.descriptor as { updateSchedule?: { presentationStepSec?: number } })?.updateSchedule?.presentationStepSec;
  if (typeof stepSec !== "number" || !Number.isFinite(stepSec) || stepSec <= 0)
    throw new Error("Successor live audit requires the exact presentation schedule");
  const presentationOutputIds = ["hemodynamics.pressure.absolute.Ao", "hemodynamics.pressure.absolute.LV", "hemodynamics.volume.LV"];
  for (const [index, scenario] of snapshot.content.scenarios.entries()) {
    const fixture = scenario.capture.fixture as unknown as { hemodynamicResearchInputs: { heartRateBpm: number } };
    const heartRate = fixture.hemodynamicResearchInputs.heartRateBpm;
    if (!Number.isFinite(heartRate) || heartRate <= 0) throw new Error("Successor live audit requires a valid heart rate");
    const before = JSON.stringify(scenario.capture);
    const originalId = `successor-audit/${snapshot.snapshotId}/${index}/original`, restoredId = `successor-audit/${snapshot.snapshotId}/${index}/restored`;
    const initialize = (runtimeSessionId: string, capture: ScenarioCaptureV2) => adapter.createSession({ runtimeSessionId,
      scenarios: [{ scenarioId: scenario.scenarioId, ...capture }] });
    const batch = async (runtimeSessionId: string, stepCount: number) => {
      const result = await adapter.advancePresentationBatch({ runtimeSessionId, scenarioId: scenario.scenarioId, stepCount, presentationOutputIds });
      assertAuthoredSuccessorBatchFiniteV1(result);
      return result;
    };
    const capture = async (runtimeSessionId: string) => (await runtime.experimentCapture.captureAcceptedCandidate({
      experimentId: "successor-audit", model: runtime.contract,
      desiredContent: { modelId: snapshot.content.modelId, surfaceSeriesId: snapshot.content.surfaceSeriesId,
        scenarios: [{ scenarioId: scenario.scenarioId, label: scenario.label, fixture: scenario.capture.fixture }],
        surface: { graphPanes: [], outputPanes: [], controlPanes: [], note: { text: "" } } },
      correlation: { runtimeSessionId, scenarios: [{ scenarioId: scenario.scenarioId, expectedInputEpoch: 0 }] },
    })).content.scenarios[0]!.capture;
    try {
      await initialize(originalId, scenario.capture);
      const startedAt = adapter.currentFrame({ runtimeSessionId: originalId, scenarioId: scenario.scenarioId }).acceptedTimeSec;
      for (let remaining = Math.ceil(60 / heartRate / stepSec) + 1; remaining > 0;) {
        const count = Math.min(32, remaining); await batch(originalId, count); remaining -= count;
      }
      if (adapter.currentFrame({ runtimeSessionId: originalId, scenarioId: scenario.scenarioId }).acceptedTimeSec - startedAt < 60 / heartRate)
        throw new Error("Successor live audit did not cover a complete cardiac period");
      await initialize(restoredId, await capture(originalId));
      for (let i = 0; i < 2; i++) {
        const original = await batch(originalId, 32), restored = await batch(restoredId, 32);
        deepStrictEqual({ ...original, terminalFrame: { ...original.terminalFrame, runtimeSessionId: "audit" } },
          { ...restored, terminalFrame: { ...restored.terminalFrame, runtimeSessionId: "audit" } }, "successor restored presentation continuation");
      }
      deepStrictEqual(await capture(originalId), await capture(restoredId), "successor terminal capture");
      if (JSON.stringify(scenario.capture) !== before) throw new Error("Successor audit mutated authored capture");
    } finally { adapter.disposeSession(originalId); adapter.disposeSession(restoredId); }
  }
}
