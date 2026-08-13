import { performance } from "node:perf_hooks";

import {
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
  MainWireIntegratedStudioStandardRuntimeHostV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1";

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

const single = new MainWireIntegratedStudioStandardRuntimeHostV1();
const batch = new MainWireIntegratedStudioStandardRuntimeHostV1();
const runtimeSessionId = "benchmark/main-wire-presentation-batch-v1";
const scenarioId = "scenario/baseline";
const seed = [{
  scenarioId,
  fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
}] as const;

await single.createSession(runtimeSessionId, seed);
await batch.createSession(runtimeSessionId, seed);

for (let batchIndex = 0; batchIndex < WARMUP_BATCHES; batchIndex += 1) {
  for (let step = 0; step < BATCH_STEPS; step += 1) {
    single.advanceOnePresentationStep(runtimeSessionId, scenarioId);
  }
  batch.advancePresentationBatch(
    runtimeSessionId,
    scenarioId,
    BATCH_STEPS,
    SELECTED_OUTPUT_IDS,
  );
}

let singleDurationMs = 0;
let batchDurationMs = 0;
for (let round = 0; round < MEASURED_ROUNDS; round += 1) {
  const measureSingle = () => {
    const startedAt = performance.now();
    for (let batchIndex = 0; batchIndex < BATCHES_PER_ROUND; batchIndex += 1) {
      for (let step = 0; step < BATCH_STEPS; step += 1) {
        single.advanceOnePresentationStep(runtimeSessionId, scenarioId);
      }
    }
    singleDurationMs += performance.now() - startedAt;
  };
  const measureBatch = () => {
    const startedAt = performance.now();
    for (let batchIndex = 0; batchIndex < BATCHES_PER_ROUND; batchIndex += 1) {
      batch.advancePresentationBatch(
        runtimeSessionId,
        scenarioId,
        BATCH_STEPS,
        SELECTED_OUTPUT_IDS,
      );
    }
    batchDurationMs += performance.now() - startedAt;
  };
  // Alternate order so JIT/thermal drift does not systematically favor one path.
  if (round % 2 === 0) {
    measureSingle();
    measureBatch();
  } else {
    measureBatch();
    measureSingle();
  }
}

const singleFrame = single.currentFrame(runtimeSessionId, scenarioId);
const batchFrame = batch.currentFrame(runtimeSessionId, scenarioId);
if (JSON.stringify(singleFrame) !== JSON.stringify(batchFrame)) {
  throw new Error("presentation benchmark paths changed the exact terminal frame");
}

const measuredSteps = BATCH_STEPS * BATCHES_PER_ROUND * MEASURED_ROUNDS;
process.stdout.write(`${JSON.stringify({
  schemaId: "circleheart-main-wire-presentation-batch-benchmark-v1",
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

single.closeSession(runtimeSessionId);
batch.closeSession(runtimeSessionId);
