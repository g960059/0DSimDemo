import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  buildMainWireAdultFiveWallNonCoronaryReleaseFromSourceV1,
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_ARTIFACT_PATH,
} from "@/engine/scientific/assembly/mainWireAdultFiveWallNonCoronaryReleaseV1";
import { canonicalJsonStringify } from "@/engine/scientific/release";

export async function generateMainWireAdultFiveWallNonCoronaryReleaseCliV1(
  args: readonly string[] = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  const checkOnly = args.includes("--check");
  const release =
    await buildMainWireAdultFiveWallNonCoronaryReleaseFromSourceV1();
  const releaseBytes = Buffer.from(
    `${canonicalJsonStringify(release)}\n`,
    "utf8",
  );
  const artifactPath = path.resolve(
    rootDir,
    MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_ARTIFACT_PATH,
  );

  if (checkOnly) {
    const artifactMatches = readFileSync(artifactPath).equals(releaseBytes);
    process.stdout.write(`${JSON.stringify({
      mode: "check",
      artifactMatches,
      artifactPath:
        MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_ARTIFACT_PATH,
      releaseRef: release.ref,
      byteLength: releaseBytes.byteLength,
    }, null, 2)}\n`);
    return artifactMatches ? 0 : 1;
  }

  mkdirSync(path.dirname(artifactPath), { recursive: true });
  writeFileSync(artifactPath, releaseBytes);
  process.stdout.write(`${JSON.stringify({
    mode: "generated",
    artifactPath:
      MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_ARTIFACT_PATH,
    releaseRef: release.ref,
    byteLength: releaseBytes.byteLength,
  }, null, 2)}\n`);
  return 0;
}

const entryPath = process.argv[1];
if (entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href) {
  generateMainWireAdultFiveWallNonCoronaryReleaseCliV1()
    .then((code) => { process.exitCode = code; })
    .catch((error) => {
      process.stderr.write(
        `${error instanceof Error ? error.stack : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
