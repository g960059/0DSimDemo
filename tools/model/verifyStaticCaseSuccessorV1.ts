import { deepStrictEqual as same } from "node:assert";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parseArgs } from "node:util";
import { importExactExecutableArtifactModuleV2 as load } from "@/runtime/ExactExecutableArtifactModuleLoaderV2";
import { MainWireStaticCaseSessionV1 as SourceSession } from "@/engine/vnext/MainWireStaticCaseSessionV1";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";

const { values } = parseArgs({ options: { reference: { type: "string" }, artifact: { type: "string" }, launches: { type: "string" }, output: { type: "string" } } });
if (!values.reference || !values.artifact || !values.launches || !values.output) throw new Error("Require --reference, --artifact, --launches, --output");
selectHotPathIntegrityTierV1("hot-path-lean");
const bytes = await Promise.all([values.reference, values.artifact].map(path => readFile(path)));
type Module = { ExactSessionV1: typeof SourceSession; ControlCandidateSessionV1: typeof SourceSession & { restoreWithStepRecovery: typeof SourceSession.restore };
  createCircleHeartExactModelReleaseV1: () => { manifest: Record<string, unknown> } };
const modules = await Promise.all(bytes.map(async b => await load(b) as unknown as Module));
const manifests = modules.map(m => m.createCircleHeartExactModelReleaseV1().manifest);
if (manifests[0]!.modelId === manifests[1]!.modelId) throw new Error("Successor must have its own identity");
const withoutIdentity = ({ modelId: _, ...m }: Record<string, unknown>) => m;
same(withoutIdentity(manifests[1]!), withoutIdentity(manifests[0]!), "Only the exact identity may change during candidate consolidation");
const launches = JSON.parse(await readFile(values.launches, "utf8")) as { presets: { capture: { fixture: {
  anatomyId: Parameters<typeof SourceSession.restore>[1]; hemodynamicResearchInputs: NonNullable<Parameters<typeof SourceSession.restore>[2]>;
  mechanismResearchInputs: Parameters<typeof SourceSession.restore>[4] }; checkpoint: { payload: unknown } } }[] };
const restores = [modules[0]!.ControlCandidateSessionV1.restoreWithStepRecovery, modules[1]!.ExactSessionV1.restore, SourceSession.restore];
const outputIds = ["hemodynamics.pressure.absolute.LV", "hemodynamics.pressure.absolute.Ao", "hemodynamics.pressure.absolute.RA", "hemodynamics.volume.LV", "hemodynamics.flow.valve.AoV"] as const;
let ticks = 0, checkpoints = 0;
for (const [index, preset] of launches.presets.entries()) {
  const f = preset.capture.fixture;
  let owners = await Promise.all(restores.map(restore => restore(preset.capture.checkpoint.payload, f.anatomyId, f.hemodynamicResearchInputs, 1, f.mechanismResearchInputs)));
  const stages: { ticks: number; tbv?: number; hr?: number }[] = index === 0
    ? [{ ticks: 500 }, { ticks: 1500, tbv: 6000 }, { ticks: 2500, tbv: 4200 }, { ticks: 500, tbv: 7000 }]
    : [{ ticks: 500 }, { ticks: 500, tbv: f.hemodynamicResearchInputs.totalBloodVolumeMl + 100 }];
  stages.push({ ticks: 500, hr: f.hemodynamicResearchInputs.heartRateBpm + 10 });
  for (const stage of stages) {
    const inputs = { ...f.hemodynamicResearchInputs, ...(stage.tbv === undefined ? {} : { totalBloodVolumeMl: stage.tbv }),
      ...(stage.hr === undefined ? {} : { heartRateBpm: stage.hr }) };
    if (stage.tbv !== undefined || stage.hr !== undefined) owners = owners.map(s => s.warmStart(inputs));
    const origin = owners[0]!.currentAcceptedState().acceptedTimeSec;
    for (let tick = 1; tick <= stage.ticks; tick++) {
      const target = (Math.round(origin / .002) + tick) * .002;
      const results = owners.map(s => s.advanceToPresentationTimeWithSelectedOutputProjectionV1(target, outputIds));
      if (results[0]!.advance.status !== "advanced") throw new Error("Reference did not advance");
      for (const r of results.slice(1)) { same(r.advance, results[0]!.advance); same(r.projectedValues, results[0]!.projectedValues); }
      ticks++;
      if (tick === Math.floor(stage.ticks / 2) || tick === stage.ticks) {
        const captures = await Promise.all(owners.map(s => s.checkpoint()));
        same(captures[1], captures[0]); same(captures[2], captures[0]); checkpoints++;
        if (tick !== stage.ticks) owners[1] = await restores[1]!(captures[1], f.anatomyId, inputs, 1, f.mechanismResearchInputs);
      }
    }
  }
  console.log(JSON.stringify({ preset: index, ticks, checkpoints, status: "bit-identical" }));
}
const report = { schemaId: "static-case-successor-continuation-v1", referenceModelId: manifests[0]!.modelId, modelId: manifests[1]!.modelId,
  artifactSha256: bytes.map(b => createHash("sha256").update(b).digest("hex")), cases: launches.presets.length,
  ticks, checkpoints, status: "bit-identical", sourceCompiledAndReferenceEqual: true, independentColdQualification: "separate" };
await writeFile(values.output, JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify(report));
