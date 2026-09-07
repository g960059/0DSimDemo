import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { CORONARY_CONSERVED_VOLUME_NODE_IDS_V2 } from "@/engine/coronary/typesV2";
import { MainWireIntegratedModelStandard71TypedAuthoritySessionV1 as Session } from "@/engine/vnext/MainWireIntegratedModelStandard71TypedAuthoritySessionV1";
import launchCheckpoint from "@/studio/integrations/mainWireIntegratedV3/standard71-launch-checkpoint.json";

// Diagnostic only: no acceptance threshold, physiological reclassification,
// checkpoint upgrade, or numerical implementation change.
const { values } = parseArgs({ options: { output: { type: "string" } } });
if (!values.output) throw new Error("--output NEW_FILE is required");
selectHotPathIntegrityTierV1("hot-path-lean");
type Differences = Record<string, { differingSteps: number; maximumAbsoluteDifference: number | null }>;
function compare(a: unknown, b: unknown, into: Differences, path = ""): void {
  if (Object.is(a, b)) return;
  if (a !== null && b !== null && typeof a === "object" && typeof b === "object") {
    const left = a as Record<string, unknown>, right = b as Record<string, unknown>;
    for (const key of new Set([...Object.keys(left), ...Object.keys(right)])) {
      compare(left[key], right[key], into, `${path}.${key}`);
    }
    return;
  }
  const previous = into[path];
  into[path] = {
    differingSteps: (previous?.differingSteps ?? 0) + 1,
    maximumAbsoluteDifference: typeof a === "number" && typeof b === "number"
      ? Math.max(previous?.maximumAbsoluteDifference ?? 0, Math.abs(a - b)) : null,
  };
}
const results = [];
for (const initial of ["cold", "settled"] as const) {
  const source = initial === "cold" ? await Session.create()
    : await Session.restoreStandard71ExactCheckpoint(launchCheckpoint);
  const initialTick = Math.round(source.currentAcceptedState().acceptedTimeSec / .002);
  // An ordinary, history-populated boundary, not just a cycle/valve reset.
  for (let tick = initialTick + 1; tick <= initialTick + 5; tick++) {
    if (source.advanceStructuralAnalysisToPresentationTimeV1(tick * .002).status !== "advanced") throw new Error("warmup failed");
  }
  const saved = await source.checkpointStandard71Exact();
  const restored = await Session.restoreStandard71ExactCheckpoint(saved);
  const twin = await Session.restoreStandard71ExactCheckpoint(saved);
  const sourcePredictor = source.coupledPredictorReport(), restoredPredictor = restored.coupledPredictorReport();
  const initialDifferences: Differences = {};
  compare(source.currentAcceptedState(), restored.currentAcceptedState(), initialDifferences);
  if (Object.keys(initialDifferences).length) throw new Error("initial restore differs");
  const stateDifferences: Differences = {}, completedBeatDifferences: Differences = {};
  let maximumVolumeConservationErrorMl = 0;
  for (let step = 1; step <= 500; step++) {
    const time = (initialTick + 5 + step) * .002;
    for (const session of [source, restored, twin]) {
      if (session.advanceStructuralAnalysisToPresentationTimeV1(time).status !== "advanced") throw new Error(`advance failed at ${time}`);
      const state = session.currentAcceptedState();
      const totalVolumeMl = state.coronary.circulation.totalBloodVolumeMl
        + CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.reduce((sum, id) => sum + state.coronary.coronary.volumeMlByNode[id], 0);
      maximumVolumeConservationErrorMl = Math.max(maximumVolumeConservationErrorMl,
        Math.abs(state.coronary.fixedGlobalTotalBloodVolumeMl - totalVolumeMl));
    }
    const twinDifferences: Differences = {};
    compare(restored.currentAcceptedState(), twin.currentAcceptedState(), twinDifferences, "state");
    compare(restored.observe().completedBeatMetrics, twin.observe().completedBeatMetrics, twinDifferences, "completedBeat");
    if (Object.keys(twinDifferences).length) {
      throw new Error(`independent restarts disagree at ${time}`);
    }
    compare(source.currentAcceptedState(), restored.currentAcceptedState(), stateDifferences);
    compare(source.observe().completedBeatMetrics, restored.observe().completedBeatMetrics, completedBeatDifferences);
  }
  results.push({ initial, checkpointSha256: saved.checkpointSha256, acceptedTimeSec: saved.acceptedTimeSec,
    sourcePredictor, restoredPredictor, durationSec: 1, comparedPresentationSteps: 500,
    independentRestartsBitIdentical: true, stateDifferences, completedBeatDifferences,
    maximumVolumeConservationErrorMl });
}
const report = { schemaId: "standard71-physical-restart-diagnostic-v1", adopted: false,
  clinicalValidationClaimed: false, numericalCodeChanged: false, results };
await writeFile(values.output, JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify(results.map(({ initial, stateDifferences, completedBeatDifferences, ...rest }) => ({ initial,
  ...rest, differingStateFields: Object.keys(stateDifferences).length,
  differingCompletedBeatFields: Object.keys(completedBeatDifferences).length }))));
