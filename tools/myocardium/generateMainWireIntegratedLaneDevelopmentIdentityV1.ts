import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_ARTIFACT_PATH,
  buildMainWireIntegratedLaneDevelopmentIdentityV1,
} from "@/engine/myocardium/MainWireIntegratedLaneDevelopmentIdentityV1";
import { canonicalJsonStringify } from "@/engine/scientific/release";

export async function generateMainWireIntegratedLaneDevelopmentIdentityCliV1(
  args: readonly string[] = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  const checkOnly = args.includes("--check");
  const identity = await buildMainWireIntegratedLaneDevelopmentIdentityV1();
  const artifactBytes = Buffer.from(
    `${canonicalJsonStringify(identity)}\n`,
    "utf8",
  );
  const artifactPath = path.resolve(
    rootDir,
    MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_ARTIFACT_PATH,
  );

  if (checkOnly) {
    const artifactMatches = readFileSync(artifactPath).equals(artifactBytes);
    process.stdout.write(`${JSON.stringify({
      mode: "check",
      artifactMatches,
      artifactPath:
        MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_ARTIFACT_PATH,
      identityRef: identity.ref,
      byteLength: artifactBytes.byteLength,
    }, null, 2)}\n`);
    return artifactMatches ? 0 : 1;
  }

  mkdirSync(path.dirname(artifactPath), { recursive: true });
  writeFileSync(artifactPath, artifactBytes);
  process.stdout.write(`${JSON.stringify({
    mode: "generated",
    artifactPath:
      MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_ARTIFACT_PATH,
    identityRef: identity.ref,
    byteLength: artifactBytes.byteLength,
  }, null, 2)}\n`);
  return 0;
}

const entryPath = process.argv[1];
if (
  entryPath !== undefined
  && import.meta.url === pathToFileURL(entryPath).href
) {
  generateMainWireIntegratedLaneDevelopmentIdentityCliV1()
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
