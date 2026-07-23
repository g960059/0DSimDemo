import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_ARTIFACT_PATH,
  MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_SHA256,
  assembleMainWireAdultFiveWallIntegratedPreviewReleaseV1,
} from "@/engine/scientific/assembly/mainWireAdultFiveWallIntegratedPreviewReleaseV1";
import { canonicalJsonStringify } from "@/engine/scientific/release";

const check = process.argv.includes("--check");
const outputPath = path.resolve(
  optionalArgument("--output")
    ?? MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_ARTIFACT_PATH,
);
const release =
  await assembleMainWireAdultFiveWallIntegratedPreviewReleaseV1();
const serialized = `${canonicalJsonStringify(release)}\n`;

if (check) {
  if (readFileSync(outputPath, "utf8") !== serialized) {
    throw new Error("checked-in integrated preview release artifact differs");
  }
  if (
    MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_SHA256
      !== release.ref.sha256
  ) {
    throw new Error("pinned integrated preview release SHA-256 differs");
  }
} else {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized, "utf8");
}
process.stdout.write(`${JSON.stringify({
  outputPath,
  releaseRef: release.ref,
  check,
})}\n`);

function optionalArgument(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}
