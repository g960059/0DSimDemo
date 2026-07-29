import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  buildMainWireIntegratedV3ModelSurfacePackageV1,
  MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MANIFEST_V1_ARTIFACT_PATH,
} from "@/engine/modelSurface/v1/MainWireIntegratedV3ModelSurfaceManifestV1";
import {
  canonicalJsonStringify,
} from "@/engine/scientific/release";

export async function generateMainWireIntegratedV3ModelSurfaceManifestCliV1(
  args: readonly string[] = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  const checkOnly = args.includes("--check");
  const modelSurfacePackage =
    await buildMainWireIntegratedV3ModelSurfacePackageV1();
  const artifactBytes = Buffer.from(
    `${canonicalJsonStringify(modelSurfacePackage)}\n`,
    "utf8",
  );
  const artifactPath = path.resolve(
    rootDir,
    MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MANIFEST_V1_ARTIFACT_PATH,
  );

  if (checkOnly) {
    let artifactMatches = false;
    try {
      artifactMatches = readFileSync(artifactPath).equals(artifactBytes);
    } catch {
      artifactMatches = false;
    }
    process.stdout.write(`${JSON.stringify({
      mode: "check",
      artifactMatches,
      artifactPath:
        MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MANIFEST_V1_ARTIFACT_PATH,
      manifestRef: modelSurfacePackage.ref,
      catalogCount: modelSurfacePackage.catalogs.length,
      byteLength: artifactBytes.byteLength,
    }, null, 2)}\n`);
    return artifactMatches ? 0 : 1;
  }

  mkdirSync(path.dirname(artifactPath), { recursive: true });
  writeFileSync(artifactPath, artifactBytes);
  process.stdout.write(`${JSON.stringify({
    mode: "generated",
    artifactPath:
      MAIN_WIRE_INTEGRATED_V3_MODEL_SURFACE_MANIFEST_V1_ARTIFACT_PATH,
    manifestRef: modelSurfacePackage.ref,
    catalogCount: modelSurfacePackage.catalogs.length,
    byteLength: artifactBytes.byteLength,
  }, null, 2)}\n`);
  return 0;
}

const entryPath = process.argv[1];
if (
  entryPath !== undefined
  && import.meta.url === pathToFileURL(entryPath).href
) {
  generateMainWireIntegratedV3ModelSurfaceManifestCliV1()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      process.stderr.write(
        `${error instanceof Error ? error.stack : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
