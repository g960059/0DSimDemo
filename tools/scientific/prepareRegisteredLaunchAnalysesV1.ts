import { mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { CURRENT_MODEL_PRESETS_V1 } from "@/data/model-releases/CurrentModelReleaseV1";
import lock from "@/data/model-releases/standard73/publication.json";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV5";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { prepareMainWireSurfaceAnalysisV1, PreparedSurfaceAnalysisErrorV1 } from "../registry/PrepareMainWireSurfaceAnalysisV1";
import { beginFittingSourceSnapshotV1 } from "./FittingSourceSnapshotV1";
import { writeFittingRunJsonV1 as write } from "./FittingRunFilesV1";
import { loadRegisteredMainWireReviewArtifactV1 as buildArtifact, verifyMainWireReviewContinuationV1 as continuation } from "../registry/MainWireRegistryReviewArtifactV1";

/** Re-prepare already qualified launch cases without repeating fitting. New
 * candidates go through fit:registry:prepare instead. No publication/mint. */
async function main() {
  const { values } = parseArgs({ options: { output: { type: "string" }, case: { type: "string" } } });
  if (!values.output) throw new Error("Require --output NEW_DIRECTORY [--case PRESET_ID]");
  const presets = CURRENT_MODEL_PRESETS_V1
    .filter(p => !values.case || p.presetId === values.case);
  if (!presets.length) throw new Error("No matching registered launch case");
  const output = resolve(values.output); await mkdir(output);
  const source = await beginFittingSourceSnapshotV1(join(output, "execution"));
  const files: string[] = [], rows = [];
  selectHotPathIntegrityTierV1("hot-path-lean");
  try {
    const artifact = await buildArtifact();
    if (artifact.artifactRevisionId !== lock.artifactRevisionId) throw new Error("Registered exact artifact changed");
    for (const preset of presets) {
      const started = performance.now();
      try {
        const checked = await continuation(artifact, preset);
        const result = await prepareMainWireSurfaceAnalysisV1({ preset, surface,
          artifactRevisionId: lock.artifactRevisionId, preparationSourceSha256: source.sourceSha256 });
        const file = `${result.captureSha256}.json`;
        files.push(await write(output, file, result));
        rows.push({ presetId: preset.presetId, title: preset.title, file, bytes: JSON.stringify(result).length,
          elapsedMs: performance.now() - started, assessment: result.assessment, continuation: checked, status: "complete" });
      } catch (error) {
        const rawAnalysisFile = error instanceof PreparedSurfaceAnalysisErrorV1 ? `held-${rows.length}-surface-analysis.json` : null;
        if (rawAnalysisFile && error instanceof PreparedSurfaceAnalysisErrorV1) files.push(await write(output, rawAnalysisFile,
          { analysis: error.analysis, reason: error.message, preparationSourceSha256: source.sourceSha256 }));
        rows.push({ presetId: preset.presetId, status: "held", error: String(error), rawAnalysisFile, elapsedMs: performance.now() - started });
      }
      process.stdout.write(JSON.stringify(rows.at(-1)) + "\n");
    }
    files.push(await write(output, "report.json", { surfaceReleaseId: surface.surfaceReleaseId, rows, publicPromotionAuthorized: false }));
    if (rows.some(row => row.status === "held")) process.exitCode = 1;
  } finally { await source.finish(files); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
