import { performance } from "node:perf_hooks";

import { createMainWireIntegratedStudioStaticCaseCoreReleaseV1 as createRelease } from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import { CURRENT_BASELINE_V1 } from "@/data/model-baselines/CurrentBaselineV1";

const BATCH_STEPS = 16;
const WARMUP_BATCHES = 8;
const MEASURED_ROUNDS = 6;
const BATCHES_PER_ROUND = 16;
const SELECTED_OUTPUT_IDS = Object.freeze([
  "hemodynamics.pressure.absolute.LV",
  "hemodynamics.pressure.absolute.LA",
  "hemodynamics.pressure.absolute.Ao",
  "hemodynamics.volume.LV",
  "hemodynamics.pressure.transmural.LV",
  "rhythm.phase.regular-sinus",
]);

const single = createRelease().executables.simulationAdapter;
const batch = createRelease().executables.simulationAdapter;
const runtimeSessionId = "benchmark/main-wire-presentation-batch-v1";
const scenarioId = "scenario/baseline";
const seed = [{
  scenarioId,
  ...CURRENT_BASELINE_V1.capture,
}] as const;

const ids = { runtimeSessionId, scenarioId };
await single.createSession({ runtimeSessionId, scenarios: seed });
await batch.createSession({ runtimeSessionId, scenarios: seed });

for (let batchIndex = 0; batchIndex < WARMUP_BATCHES; batchIndex += 1) {
  for (let step = 0; step < BATCH_STEPS; step += 1) {
    await single.advanceOnePresentationStep(ids);
  }
  await batch.advancePresentationBatch({ ...ids, stepCount: BATCH_STEPS, presentationOutputIds: SELECTED_OUTPUT_IDS });
}

let singleDurationMs = 0;
let batchDurationMs = 0;
for (let round = 0; round < MEASURED_ROUNDS; round += 1) {
  const measureSingle = async () => {
    const startedAt = performance.now();
    for (let batchIndex = 0; batchIndex < BATCHES_PER_ROUND; batchIndex += 1) {
      for (let step = 0; step < BATCH_STEPS; step += 1) {
        await single.advanceOnePresentationStep(ids);
      }
    }
    singleDurationMs += performance.now() - startedAt;
  };
  const measureBatch = async () => {
    const startedAt = performance.now();
    for (let batchIndex = 0; batchIndex < BATCHES_PER_ROUND; batchIndex += 1) {
      await batch.advancePresentationBatch({ ...ids, stepCount: BATCH_STEPS, presentationOutputIds: SELECTED_OUTPUT_IDS });
    }
    batchDurationMs += performance.now() - startedAt;
  };
  // Alternate order so JIT/thermal drift does not systematically favor one path.
  if (round % 2 === 0) {
    await measureSingle();
    await measureBatch();
  } else {
    await measureBatch();
    await measureSingle();
  }
}

const singleFrame = single.currentFrame(ids);
const batchFrame = batch.currentFrame(ids);
if (JSON.stringify(singleFrame) !== JSON.stringify(batchFrame)) {
  throw new Error("presentation benchmark paths changed the exact terminal frame");
}

const measuredSteps = BATCH_STEPS * BATCHES_PER_ROUND * MEASURED_ROUNDS;
process.stdout.write(`${JSON.stringify({
  schemaId: "circleheart-main-wire-presentation-batch-benchmark-v1",
  modelId: CURRENT_BASELINE_V1.modelId,
  baselineId: CURRENT_BASELINE_V1.baselineId,
  measuredSteps,
  selectedOutputCount: SELECTED_OUTPUT_IDS.length,
  single: {
    totalMs: singleDurationMs,
    meanMsPerStep: singleDurationMs / measuredSteps,
  },
  batch: {
    totalMs: batchDurationMs,
    meanMsPerStep: batchDurationMs / measuredSteps,
  },
  speedup: singleDurationMs / batchDurationMs,
}, null, 2)}\n`);

single.disposeSession(runtimeSessionId);
batch.disposeSession(runtimeSessionId);
