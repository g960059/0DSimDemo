import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { NoAvpdPassiveLvEdpvrArtifactV1 } from "@/tools/mechanics2/runNoAvpdPassiveLvEdpvrV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const defaultInputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-passive-lv-edpvr-v1.json",
);
const defaultOutputPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/no-avpd-passive-lv-edpvr-v1.html",
);
const templatePath = resolve(
  repoRoot,
  "tools/mechanics2/templates/no-avpd-passive-lv-edpvr-v1.html",
);
const placeholder = "__NO_AVPD_PASSIVE_LV_EDPVR_DATA__";

export function renderNoAvpdPassiveLvEdpvrV1(
  artifact: NoAvpdPassiveLvEdpvrArtifactV1,
): string {
  validateArtifact(artifact);
  const template = readFileSync(templatePath, "utf8");
  if (template.split(placeholder).length !== 2) {
    throw new Error(
      "visual template must contain exactly one data placeholder",
    );
  }
  const embedded = {
    ...artifact,
    visualizationProvenance: {
      sourceNormalizedSha256: artifact.normalizedSha256,
      rendererSha256: rendererSha256(),
      rawIndependentEquilibriumPoints: true,
      smoothingApplied: false,
      decimationApplied: false,
      derivativeRecalculated: false,
      dataValueRoundingAppliedBeforeProjection: false,
      svgCoordinatePrecisionDigits: 2,
    },
  };
  return template.replace(
    placeholder,
    JSON.stringify(embedded).replaceAll("<", "\\u003c"),
  );
}

export function writeNoAvpdPassiveLvEdpvrVisualV1(
  sourcePath = defaultInputPath,
  destinationPath = defaultOutputPath,
): string {
  const artifact = JSON.parse(
    readFileSync(sourcePath, "utf8"),
  ) as NoAvpdPassiveLvEdpvrArtifactV1;
  const fragment = renderNoAvpdPassiveLvEdpvrV1(artifact);
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = `${destinationPath}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, fragment);
  renameSync(temporaryPath, destinationPath);
  return destinationPath;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const sourcePath = resolve(
    repoRoot,
    stringArgument("--input") ?? defaultInputPath,
  );
  const destinationPath = resolve(
    repoRoot,
    stringArgument("--output") ?? defaultOutputPath,
  );
  const written = writeNoAvpdPassiveLvEdpvrVisualV1(
    sourcePath,
    destinationPath,
  );
  console.log(
    JSON.stringify(
      {
        stage: "no-avpd-passive-lv-edpvr-visual-written",
        inputPath: sourcePath,
        outputPath: written,
        rendererSha256: rendererSha256(),
      },
      null,
      2,
    ),
  );
}

function validateArtifact(artifact: NoAvpdPassiveLvEdpvrArtifactV1): void {
  const { normalizedSha256, ...body } = artifact;
  if (sha256Json(body) !== normalizedSha256) {
    throw new Error("passive LV EDPVR artifact normalized hash does not match");
  }
  if (artifact.provenance.parameterSha256 !== sha256Json(artifact.parameters)) {
    throw new Error("passive LV EDPVR parameter hash does not match");
  }
  if (artifact.provenance.protocolSha256 !== sha256Json(artifact.protocol)) {
    throw new Error("passive LV EDPVR protocol hash does not match");
  }
  if (
    artifact.provenance.rawPointTreatment !==
    "all-independent-volume-equilibrium-points-no-smoothing-no-decimation"
  ) {
    throw new Error(
      "visualization requires raw independent equilibrium points",
    );
  }
  if (artifact.points.some((point) => point.status !== "available")) {
    throw new Error("visualization requires all requested EDPVR points");
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
