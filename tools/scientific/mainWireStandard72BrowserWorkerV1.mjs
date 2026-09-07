// Isolated browser verification worker, served only by the companion harness.
import { createCircleHeartExactModelReleaseV1 } from "./artifact.mjs";

const release = createCircleHeartExactModelReleaseV1();
const adapter = release.executables.simulationAdapter;
const scenarioId = "baseline", sourceId = "72/browser/source", restoredId = "72/browser/restored";
let model, fixture, configuration;
const same = (a, b, label) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`Browser72 mismatch: ${label}`);
};
const frameValues = frame => ({ time: frame.acceptedTimeSec, revision: frame.acceptedRevision, outputs: frame.outputs });
async function capture(runtimeSessionId) {
  const frame = adapter.currentFrame({ runtimeSessionId, scenarioId });
  return release.executables.experimentCapture.captureAcceptedCandidate({ experimentId: "72/browser-local-verification", model,
    desiredContent: { modelId: model.modelId, surfaceSeriesId: configuration.surfaceSeriesId,
      scenarios: [{ scenarioId, label: "baseline", fixture }],
      surface: { graphPanes: [], outputPanes: [], controlPanes: [], note: { text: "" } } },
    correlation: { runtimeSessionId, scenarios: [{ scenarioId, expectedInputEpoch: frame.inputEpoch }] } });
}
self.onmessage = async ({ data }) => {
  try {
    if (data.command === "begin") {
      configuration = data.configuration;
      ({ model, fixture } = configuration);
      const scenarios = [{ scenarioId, fixture }];
      if (configuration.executionPlan) {
        const bound = release.executables.executionPlan.bind();
        await release.executables.executionPlan.createSession({ runtimeSessionId: sourceId, scenarios,
          boundExecutionPlans: new Map([[scenarioId, bound]]) });
      } else await adapter.createSession({ runtimeSessionId: sourceId, scenarios });
      const initial = adapter.currentFrame({ runtimeSessionId: sourceId, scenarioId });
      same({ time: initial.acceptedTimeSec, revision: initial.acceptedRevision }, configuration.launchClock, "own settled launch");
      if (configuration.afterControl) {
        await adapter.applyControl({ runtimeSessionId: sourceId, scenarioId,
          controlId: "hemodynamics.total-blood-volume-ml", value: 4940, expectedInputEpoch: initial.inputEpoch });
        fixture = { ...fixture, hemodynamicResearchInputs: { ...fixture.hemodynamicResearchInputs, totalBloodVolumeMl: 4940 } };
      }
      for (let step = 0; step < 8; step++) await adapter.advanceOnePresentationStep({ runtimeSessionId: sourceId, scenarioId });
      const before = adapter.currentFrame({ runtimeSessionId: sourceId, scenarioId });
      const captured = await capture(sourceId);
      same(adapter.currentFrame({ runtimeSessionId: sourceId, scenarioId }), before, "capture noninterference");
      if (captured.content.scenarios[0].capture.checkpoint.payload.coupledPredictor.historyDepth !== 4) throw new Error("Capture did not retain warm history4");
      self.postMessage({ status: "captured", content: captured.content });
      return;
    }
    if (data.command !== "continue" || !configuration) throw new Error("Unexpected browser verification command");
    // This content has left the worker, crossed structured clone, been JSON
    // serialized in the browser, and returned through structured clone.
    const saved = data.content.scenarios[0].capture;
    await release.executables.captureAdapter.validateCapture({ model, capture: saved });
    await adapter.createSession({ runtimeSessionId: restoredId, scenarios: [{ scenarioId, fixture: saved.fixture, checkpoint: saved.checkpoint }] });
    for (let step = 0; step < 1000; step++) {
      const a = await adapter.advanceOnePresentationStep({ runtimeSessionId: sourceId, scenarioId });
      const b = await adapter.advanceOnePresentationStep({ runtimeSessionId: restoredId, scenarioId });
      same(frameValues(b), frameValues(a), `continuation step ${step + 1}`);
    }
    const original = (await capture(sourceId)).content.scenarios[0].capture.checkpoint;
    const resumed = (await capture(restoredId)).content.scenarios[0].capture.checkpoint;
    same(resumed, original, "final full checkpoint including predictor and beat accumulators");
    const snapshot = await release.executables.snapshotGate.admitFrozenCandidate({ model, content: data.content });
    if (snapshot.status !== "passed") throw new Error(`Snapshot rejected: ${JSON.stringify(snapshot)}`);
    self.postMessage({ status: "passed", modelId: model.modelId,
      executionPlan: configuration.executionPlan, afterControl: configuration.afterControl,
      capturedHistoryDepth: 4, comparedSteps: 1000, finalCheckpointEqual: true,
      structuredCloneAndJsonRoundtrip: true, snapshotAdmission: snapshot.status,
      finalTimeSec: original.acceptedTimeSec, finalCheckpointSha256: original.payload.checkpointSha256,
      finalCompletedBeat: original.payload.baseStandardCheckpointV2.completedBeatMetrics });
  } catch (error) {
    self.postMessage({ status: "failed", message: error instanceof Error ? error.stack : String(error) });
  }
};
self.postMessage({ status: "ready" });
