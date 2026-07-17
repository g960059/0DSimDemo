import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_MANIFEST_PATH,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_V1_ASSET_PATH,
  OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_PATH,
  OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_SCHEMA_ID,
  loadOfficialScientificPresetCatalogV1,
} from "@/engine/scientific/presets";
import { canonicalJsonStringify } from "@/engine/scientific/release";
import {
  buildOfficialHealthyPeriodicCheckpointPresetV1,
} from "@/tools/scientific/officialHealthyPeriodicCheckpointPresetV1";

export async function generateOfficialHealthyPeriodicCheckpointPresetCliV1(
  args: readonly string[] = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  const checkOnly = args.includes("--check");
  const built = await buildOfficialHealthyPeriodicCheckpointPresetV1();
  const checkpointPath = path.resolve(
    rootDir,
    OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_V1_ASSET_PATH,
  );
  const documentPath = path.resolve(
    rootDir,
    OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_MANIFEST_PATH,
  );
  const documentBytes = Buffer.from(
    `${canonicalJsonStringify(built.document)}\n`,
    "utf8",
  );
  const documentRawFileSha256 = createHash("sha256")
    .update(documentBytes)
    .digest("hex");
  const catalog = loadOfficialScientificPresetCatalogV1({
    schema: {
      id: OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_SCHEMA_ID,
      version: 1,
    },
    entries: [{
      presetId: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID,
      presetVersion: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION,
      manifest: {
        path: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_MANIFEST_PATH,
        mediaType: "application/json",
        byteLength: documentBytes.byteLength,
        rawFileSha256: documentRawFileSha256,
        rawFileDigestSemantics: "raw-file-bytes-sha256",
      },
    }],
  });
  const catalogBytes = Buffer.from(
    `${canonicalJsonStringify(catalog)}\n`,
    "utf8",
  );
  const catalogPath = path.resolve(
    rootDir,
    OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_PATH,
  );
  if (checkOnly) {
    const checkpointMatches = readFileSync(checkpointPath)
      .equals(Buffer.from(built.checkpointBytes));
    const documentMatches = readFileSync(documentPath).equals(documentBytes);
    const catalogMatches = readFileSync(catalogPath).equals(catalogBytes);
    process.stdout.write(`${JSON.stringify({
      mode: "check",
      checkpointMatches,
      documentMatches,
      catalogMatches,
      completedBeatCount: built.document.protocol.result.completedBeatCount,
      rawFileSha256:
        built.document.initialization.checkpoint.rawFileSha256,
    }, null, 2)}\n`);
    return checkpointMatches && documentMatches && catalogMatches ? 0 : 1;
  }
  mkdirSync(path.dirname(checkpointPath), { recursive: true });
  mkdirSync(path.dirname(documentPath), { recursive: true });
  writeFileSync(checkpointPath, built.checkpointBytes);
  writeFileSync(documentPath, documentBytes);
  writeFileSync(catalogPath, catalogBytes);
  process.stdout.write(`${JSON.stringify({
    mode: "generated",
    checkpointPath: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_V1_ASSET_PATH,
    documentPath: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_MANIFEST_PATH,
    catalogPath: OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_PATH,
    completedBeatCount: built.document.protocol.result.completedBeatCount,
    rawFileSha256: built.document.initialization.checkpoint.rawFileSha256,
    checkpointEnvelopeSha256:
      built.document.initialization.checkpoint.checkpointEnvelopeSha256,
  }, null, 2)}\n`);
  return 0;
}

const entryPath = process.argv[1];
if (entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href) {
  generateOfficialHealthyPeriodicCheckpointPresetCliV1()
    .then((code) => { process.exitCode = code; })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
      process.exitCode = 1;
    });
}
