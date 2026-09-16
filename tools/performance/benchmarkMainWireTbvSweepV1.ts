import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { Session as InspectorSession } from "node:inspector/promises";
import { resolve } from "node:path";
import { cpus } from "node:os";
import { importExactExecutableArtifactModuleV2 } from "@/runtime/ExactExecutableArtifactModuleLoaderV2";
import type { MainWireStaticCaseSessionV1 } from "@/engine/vnext/MainWireStaticCaseSessionV1";
import type { createMainWireIntegratedStudioStaticCaseCoreReleaseV1 } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import { wrapMainWirePressureCrossingSessionV1 } from "@/analysis/methods/mainWire/MainWirePressureCrossingSessionV1";
import { runMainWireIntegratedModelFormalPressureVolumeProtocolV3 } from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import candidate from "@/data/model-releases/standard74/publication.json";
import bundle from "@/data/model-releases/standard74/bundle.json";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";

// Run the current compiled exact model and complete protocol from saved warm
// captures. Reference comparison includes every progress result, not just the
// final curve. Profiling is optional: sampled timings are not speed benchmarks.
function option(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}
const launches = { modelId: bundle.manifest.modelId, presets: [bundle.baseline, ...bundle.presets] };
const selection = option("--preset", "all")!;
if (selection !== "all" && (!/^\d+$/.test(selection) || Number(selection) >= launches.presets.length))
  throw new Error(`--preset must be all or 0..${launches.presets.length - 1}`);
const directory = resolve(option("--output", "test-results/tbv-sweep")!);
const reference = option("--reference");
const artifactPath = option("--artifact");
const profiling = process.argv.includes("--profile");
await mkdir(directory, { recursive: true });
selectHotPathIntegrityTierV1("hot-path-lean");
const artifactBytes = await readFile(artifactPath ?? "data/model-releases/standard74/artifact.mjs.txt");
const module = await importExactExecutableArtifactModuleV2(artifactBytes) as unknown as {
  ExactSessionV1: typeof MainWireStaticCaseSessionV1;
  createCircleHeartExactModelReleaseV1: typeof createMainWireIntegratedStudioStaticCaseCoreReleaseV1;
};
if (module.createCircleHeartExactModelReleaseV1().manifest.modelId !== launches.modelId)
  throw new Error("Benchmark artifact and captured presets belong to different models");
const { ExactSessionV1: Owner } = module;
for (const [index, preset] of launches.presets.entries()) {
  if (selection !== "all" && index !== Number(selection)) continue;
  const fixture = preset.capture.fixture;
  const source = await Owner.restore(preset.capture.checkpoint.payload,
    fixture.anatomyId as never, fixture.hemodynamicResearchInputs as never, 1,
    fixture.mechanismResearchInputs as never);
  const progress: unknown[] = [];
  const progressTimings: { elapsedMs: number; advances: number }[] = [];
  const calls = { advances: 0, observations: 0, snapshots: 0 };
  const restore: (() => void)[] = [];
  // The public owner counts all ephemeral branches as well as the anchor.
  for (const key of ["advanceToPresentationTime", "advanceToPresentationTimeWithSelectedOutputProjectionV1",
    "advancePressureCrossingPresentationV1",
    "observe", "currentAcceptedState"] as const) {
    const method = Owner.prototype[key];
    if (typeof method !== "function") continue;
    Object.defineProperty(Owner.prototype, key, { configurable: true, writable: true,
      value: function(this: typeof source, ...args: unknown[]) {
        if (key.startsWith("advance")) calls.advances++;
        else if (key === "observe") calls.observations++;
        else calls.snapshots++;
        return Reflect.apply(method, this, args);
      } });
    restore.push(() => Object.defineProperty(Owner.prototype, key, { configurable: true, writable: true, value: method }));
  }
  const inspector = profiling ? new InspectorSession() : undefined;
  inspector?.connect();
  if (inspector) { await inspector.post("Profiler.enable"); await inspector.post("Profiler.start"); }
  const cpuStart = process.cpuUsage();
  const started = performance.now();
  let result;
  try {
    result = await runMainWireIntegratedModelFormalPressureVolumeProtocolV3(
      wrapMainWirePressureCrossingSessionV1(source), fixture.hemodynamicResearchInputs as never,
      value => {
        progress.push(value);
        progressTimings.push({ elapsedMs: performance.now() - started, advances: calls.advances });
      });
  } finally {
    for (const reset of restore) reset();
    if (inspector) {
      const { profile } = await inspector.post("Profiler.stop");
      inspector.disconnect();
      await writeFile(resolve(directory, `preset-${index}.cpuprofile`), JSON.stringify(profile));
    }
  }
  const elapsedMs = performance.now() - started;
  const cpu = process.cpuUsage(cpuStart);
  const data = JSON.stringify({ result, progress });
  const referenceMatched = reference
    ? data === await readFile(resolve(reference, `preset-${index}.json`), "utf8") : null;
  await writeFile(resolve(directory, `preset-${index}.json`), data);
  const report = { schemaId: "main-wire-tbv-sweep-benchmark-v1", index, title: preset.title,
    artifactRevisionId: artifactPath ? null : candidate.artifactRevisionId,
    artifactSha256: artifactBytes ? createHash("sha256").update(artifactBytes).digest("hex") : candidate.artifactSha256,
    captureJsonSha256: createHash("sha256").update(JSON.stringify(preset.capture)).digest("hex"),
    nodeVersion: process.version, architecture: process.arch, cpuModel: cpus()[0]?.model,
    profiling, elapsedMs, cpuMs: (cpu.user + cpu.system) / 1_000,
    meanMsPerAdvance: elapsedMs / calls.advances, ...calls, progressTimings,
    resultSha256: createHash("sha256").update(data).digest("hex"),
    referenceMatched };
  await writeFile(resolve(directory, `preset-${index}-timing.json`), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report));
  if (referenceMatched === false) throw new Error(`Full sweep changed for preset ${index} (${preset.title})`);
}
