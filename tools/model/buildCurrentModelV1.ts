import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { buildMainWireRegistryReviewArtifactV1 as build } from "../registry/MainWireRegistryReviewArtifactV1";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";

const { values } = parseArgs({ options: { output: { type: "string" } } });
if (!values.output) throw new Error("Require a new --output directory");
selectHotPathIntegrityTierV1("hot-path-lean");
const directory = resolve(values.output);
await mkdir(directory);
const artifact = await build();
await writeFile(resolve(directory, "artifact.mjs.txt"), artifact.bytes, { flag: "wx" });
await writeFile(resolve(directory, "build.json"), JSON.stringify({
  manifest: artifact.source.manifest, surface: artifact.surface,
  artifactSha256: artifact.artifactSha256, artifactRevisionId: artifact.artifactRevisionId,
  deterministicBuilds: artifact.deterministicBuilds, sourceFiles: artifact.sourceFiles,
  qualification: "not-claimed", publication: false,
}, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ directory, modelId: artifact.source.manifest.modelId,
  artifactSha256: artifact.artifactSha256, artifactRevisionId: artifact.artifactRevisionId }));
