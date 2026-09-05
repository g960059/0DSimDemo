import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MainWireIntegratedModelStandard70TypedAuthoritySessionV1 } from
  "@/engine/vnext/MainWireIntegratedModelStandard70TypedAuthoritySessionV1";
import { MainWireIntegratedTypedAuthoritySessionV1 } from
  "@/engine/vnext/MainWireIntegratedTypedAuthoritySessionV1";
import { createMainWireIntegratedStudioAlgebraicPulmonaryRootCoreReleaseV1 } from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import { MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID } from
  "@/analysis/methods/mainWire/MainWireStructuralAnalysisContractV3";
import type { MainWireIntegratedModelStarlingLocusV3 } from
  "@/analysis/methods/mainWire/MainWireGuytonStarlingOrientationV3";
import launch from "@/data/model-baselines/standard70-launch-baseline.json";
import type { ScenarioCheckpointV2 } from "@/studio/contracts/v2/content";

// One isolated partition per process. Run low/high as two processes to measure
// actual parallel wall time; Promise.all inside this process is not CPU parallel.
const partition = process.argv[2] ?? "hypervolemic";
if (partition !== "hypovolemic" && partition !== "hypervolemic") {
  throw new Error("partition must be hypovolemic or hypervolemic");
}
// Optional adapter controls allow bounded HR/TBV/inotropy audits from the same
// verified launch. Syntax: partition report.json '[{"controlId":"…","value":60}]'
// --include-analysis retains the family for offline derivation comparisons.
const controls: readonly Readonly<{ controlId: string; value: number }>[] = JSON.parse(process.argv[4] ?? "[]");
if (!Array.isArray(controls) || controls.some((control) => control === null
  || typeof control.controlId !== "string" || !Number.isFinite(control.value))) {
  throw new Error("controls must be a JSON array of controlId/finite value pairs");
}
selectHotPathIntegrityTierV1("hot-path-lean");
let fullStateSnapshotCalls = 0;
const snapshot = MainWireIntegratedTypedAuthoritySessionV1.prototype.currentAcceptedState;
MainWireIntegratedTypedAuthoritySessionV1.prototype.currentAcceptedState = function () {
  fullStateSnapshotCalls += 1;
  return snapshot.call(this);
};
type ForkMeasurement = {
  kind: "active-source" | "fixed-tone";
  targetTbvMl: number;
  sourceAcceptedTimeSec: number;
  acceptedTimeSec: number;
  advanceCalls: number;
  advanceDurationMs: number;
  advanceFailure: string | null;
};
const forks: ForkMeasurement[] = [];
const prototype = MainWireIntegratedModelStandard70TypedAuthoritySessionV1.prototype;
for (const method of [
  "forkAtFixedGlobalTotalBloodVolume",
  "forkResponsiveStarlingAtFixedGlobalTotalBloodVolume",
] as const) {
  const fork = prototype[method];
  prototype[method] = function (targetTbvMl: number) {
    const branch = fork.call(this, targetTbvMl);
    const origin = branch.currentAcceptedState().acceptedTimeSec;
    const record: ForkMeasurement = {
      kind: method === "forkAtFixedGlobalTotalBloodVolume" ? "active-source" : "fixed-tone",
      targetTbvMl, sourceAcceptedTimeSec: origin, acceptedTimeSec: origin,
      advanceCalls: 0, advanceDurationMs: 0, advanceFailure: null,
    };
    forks.push(record);
    const advance = branch.advanceStructuralAnalysisToPresentationTimeV1.bind(branch);
    branch.advanceStructuralAnalysisToPresentationTimeV1 = (targetTimeSec) => {
      const start = performance.now();
      const result = advance(targetTimeSec);
      record.advanceCalls += 1;
      record.advanceDurationMs += performance.now() - start;
      record.acceptedTimeSec = result.acceptedTimeSec;
      if (result.status === "failed") record.advanceFailure = result.message;
      return result;
    };
    return branch;
  };
}

const adapter = createMainWireIntegratedStudioAlgebraicPulmonaryRootCoreReleaseV1()
  .executables.simulationAdapter;
const ids = { runtimeSessionId: "benchmark/structural", scenarioId: "baseline" };
await adapter.createSession({
  runtimeSessionId: ids.runtimeSessionId,
  scenarios: [{ scenarioId: ids.scenarioId, fixture: launch.capture.fixture,
    checkpoint: launch.capture.checkpoint as ScenarioCheckpointV2 }],
});
for (const control of controls) {
  await adapter.applyControl({ ...ids, ...control,
    expectedInputEpoch: adapter.currentInputEpoch(ids) });
}
const source = adapter.currentFrame(ids);
const progress: unknown[] = [];
const startedAt = performance.now();
const analysis = await adapter.requestAnalysis({
  ...ids,
  analysisId: MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
  expectedInputEpoch: source.inputEpoch,
  expectedAcceptedRevision: source.acceptedRevision,
  expectedAcceptedTimeSec: source.acceptedTimeSec,
  analysisPartition: partition,
  onProgress: (partial) => {
    const { left } = partial.payload as unknown as {
      left: { starlingLocus: MainWireIntegratedModelStarlingLocusV3 };
    };
    progress.push({ elapsedMs: performance.now() - startedAt,
      status: left.starlingLocus.status,
      points: left.starlingLocus.points.map((point) => ({
        tbvMl: point.totalBloodVolumeMl, completedBeatCount: point.completedBeatCount,
        maximumNormalizedBeatDelta: point.maximumNormalizedBeatDelta,
        acceptedMeasurementDurationSec: point.acceptedMeasurementDurationSec,
      })),
    });
  },
});
const durationMs = performance.now() - startedAt;
const sourceUnchanged = JSON.stringify(source) === JSON.stringify(adapter.currentFrame(ids));
adapter.disposeSession(ids.runtimeSessionId);
if (!sourceUnchanged) throw new Error("structural protocol mutated the source Scenario");
const sourcePaths = [
  "data/model-baselines/standard70-launch-baseline.json",
  "engine/vnext/MainWireIntegratedTypedAuthoritySessionV1.ts",
  "analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3.ts",
];
const report = {
  schemaId: "main-wire-structural-analysis-benchmark-v1",
  partition, controls, modelId: source.modelId, launchBaselineId: launch.baselineId,
  integrityTier: "hot-path-lean", sourceUnchanged, durationMs,
  fullStateSnapshotCalls, forks, progress,
  ...(process.argv[5] === "--include-analysis" ? { analysis } : {}),
  payloadSha256: createHash("sha256").update(JSON.stringify(analysis.payload)).digest("hex"),
  sourceSha256: Object.fromEntries(sourcePaths.map((path) => [path,
    createHash("sha256").update(readFileSync(resolve(path))).digest("hex")])),
};
if (process.argv[3]) writeFileSync(resolve(process.argv[3]), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
