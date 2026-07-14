import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import type {
  NoAvpdDtRefinementArtifactV1,
} from "@/tools/mechanics2/runNoAvpdFourChamberDtRefinementV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const defaultInputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-four-chamber-hill-triseg-dt-refinement-v1.json",
);
const defaultOutputPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/no-avpd-four-chamber-hill-triseg-dt-refinement-v1.html",
);
const templatePath = resolve(
  repoRoot,
  "tools/mechanics2/templates/no-avpd-four-chamber-dt-refinement-v1.html",
);
const placeholder = "__NO_AVPD_DT_REFINEMENT_DATA__";

export function renderNoAvpdFourChamberDtRefinementV1(
  artifact: NoAvpdDtRefinementArtifactV1,
): string {
  validateArtifactHash(artifact);
  const template = readFileSync(templatePath, "utf8");
  if (template.split(placeholder).length !== 2) {
    throw new Error("visual template must contain exactly one data placeholder");
  }
  const embedded = {
    ...artifact,
    visualizationProvenance: {
      sourceNormalizedSha256: artifact.normalizedSha256,
      rendererSha256: rendererSha256(),
      rawAcceptedStepVertices: true,
      smoothingApplied: false,
      decimationApplied: false,
      dataValueRoundingAppliedBeforeProjection: false,
      svgCoordinatePrecisionDigits: 2,
    },
  };
  const safeJson = JSON.stringify(embedded).replaceAll("<", "\\u003c");
  return template.replace(placeholder, safeJson);
}

export function writeNoAvpdFourChamberDtRefinementVisualV1(
  sourcePath = defaultInputPath,
  destinationPath = defaultOutputPath,
): string {
  const artifact = JSON.parse(readFileSync(sourcePath, "utf8")) as
    NoAvpdDtRefinementArtifactV1;
  const fragment = renderNoAvpdFourChamberDtRefinementV1(artifact);
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = `${destinationPath}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, fragment);
  renameSync(temporaryPath, destinationPath);
  return destinationPath;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const sourcePath = resolve(repoRoot, stringArgument("--input") ?? defaultInputPath);
  const destinationPath = resolve(repoRoot, stringArgument("--output") ?? defaultOutputPath);
  const written = writeNoAvpdFourChamberDtRefinementVisualV1(
    sourcePath,
    destinationPath,
  );
  console.log(JSON.stringify({
    stage: "dt-refinement-visual-written",
    inputPath: sourcePath,
    outputPath: written,
    rendererSha256: rendererSha256(),
  }, null, 2));
}

function validateArtifactHash(artifact: NoAvpdDtRefinementArtifactV1): void {
  const { normalizedSha256, ...body } = artifact;
  if (sha256Json(body) !== normalizedSha256) {
    throw new Error("dt-refinement artifact normalized hash does not match its contents");
  }
  if (artifact.diagnostics.sampleTreatment
    !== "complete-event-anchor-cycle-every-accepted-step-no-smoothing-no-decimation") {
    throw new Error("visualization requires the declared raw no-decimation sample contract");
  }
  if (sha256Json(artifact.diagnostics.commonProvenance.parameterSnapshot)
    !== artifact.diagnostics.commonProvenance.parameterSha256) {
    throw new Error("dt-refinement parameter snapshot hash does not match");
  }
}

function rendererSha256(): string {
  const hash = createHash("sha256");
  for (const path of [__filename, templatePath]) {
    hash.update(path.replace(`${repoRoot}/`, ""));
    hash.update("\0");
    hash.update(readFileSync(path));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function stringArgument(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (value == null || value.startsWith("--") || value.length === 0) {
    throw new Error(`${flag} must be followed by a value`);
  }
  return value;
}
