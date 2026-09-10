import { performance } from "node:perf_hooks";
import { createMainWireIntegratedStudioStaticCaseCoreReleaseV1 as release } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import { CURRENT_BASELINE_V1 as baseline } from "@/data/model-baselines/CurrentBaselineV1";
import { MainWireCardiacCycleCollectorV1 } from "@/analysis/methods/mainWire/MainWireCardiacCycleCollectorV1";
import { MAIN_WIRE_CARDIAC_CYCLE_REQUIRED_EXACT_OUTPUT_IDS_V1 as requiredIds } from "@/analysis/methods/mainWire/MainWireCardiacCycleMetricsV1";
import { projectStudioSimulationPresentationBatchV2 } from "@/studio/workers/StudioSimulationPresentationBatchV2";
import type { StudioSimulationAnalysisV2 } from "@/studio/contracts/v2/simulation";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";

// Local paired diagnostic, not a timing gate or a physical-device qualification.
selectHotPathIntegrityTierV1("hot-path-lean");
const graphIds = ["hemodynamics.pressure.absolute.LV", "hemodynamics.pressure.absolute.LA",
  "hemodynamics.pressure.absolute.Ao", "hemodynamics.volume.LV", "hemodynamics.pressure.transmural.LV", "rhythm.phase.regular-sinus"];
const observedIds = [...new Set([...graphIds, ...requiredIds])];
const identity = { runtimeSessionId: "beat-benchmark", scenarioId: "baseline" };
const seed = { runtimeSessionId: identity.runtimeSessionId, scenarios: [{ scenarioId: identity.scenarioId, ...baseline.capture }] };
const off = release().executables.simulationAdapter, on = release().executables.simulationAdapter;
const collector = new MainWireCardiacCycleCollectorV1();
const times = { off: [] as number[], on: [] as number[], collector: [] as number[], completedBeat: [] as number[] };
let latest: StudioSimulationAnalysisV2 | undefined;
const batchSteps = 16;
await off.createSession(seed); await on.createSession(seed);

const advance = async (enabled: boolean, measured: boolean) => {
  const start = performance.now();
  const batch = await (enabled ? on : off).advancePresentationBatch({ ...identity, stepCount: batchSteps,
    presentationOutputIds: enabled ? observedIds : graphIds });
  if (enabled) {
    const observeStart = performance.now();
    const result = collector.ingest(batch);
    const elapsed = performance.now() - observeStart;
    if (result) latest = result;
    if (measured) {
      times.collector.push(elapsed);
      if (result) times.completedBeat.push(elapsed);
    }
    projectStudioSimulationPresentationBatchV2(batch, graphIds);
  }
  if (measured) times[enabled ? "on" : "off"].push(performance.now() - start);
};
try {
  // Compile both paths and at least one complete-beat evaluation before measuring.
  for (let i = 0; i < 64; i++) { await advance(false, false); await advance(true, false); }
  for (let round = 0; round < 8; round++) {
    for (const enabled of round % 2 === 0 ? [false, true] : [true, false]) {
      for (let i = 0; i < 16; i++) await advance(enabled, true);
    }
  }
  if (JSON.stringify(off.currentFrame(identity)) !== JSON.stringify(on.currentFrame(identity))) {
    throw new Error("Observation changed the exact terminal frame");
  }
  const summarize = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const totalMs = values.reduce((sum, value) => sum + value, 0);
    return { count: values.length, totalMs, meanMs: totalMs / values.length,
      p95Ms: sorted[Math.ceil(sorted.length * .95) - 1], maximumMs: sorted.at(-1) };
  };
  const measured = Object.fromEntries(Object.entries(times).map(([key, values]) => [key, summarize(values)]));
  process.stdout.write(`${JSON.stringify({ schemaId: "main-wire-beat-metrics-paired-benchmark-v1", modelId: baseline.modelId,
    batchSteps, measuredSimulatedSecondsPerPath: times.off.length * batchSteps * .002,
    graphColumns: graphIds.length, observedColumns: observedIds.length, terminalFramesEqual: true,
    measurement: "local Node hot-path-lean execution; excludes browser transport/DOM and device throttling; alternating paired paths",
    measured, observedToUnobservedTotalRatio: measured.on!.totalMs / measured.off!.totalMs,
    latestBeat: latest?.payload }, null, 2)}\n`);
} finally { off.disposeSession(identity.runtimeSessionId); on.disposeSession(identity.runtimeSessionId); }
