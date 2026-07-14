import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { AtrialActiveLawShootoutReportV1 } from
  "@/engine/mechanics2/benches/AtrialActiveLawShootoutBenchV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const defaultInputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/atrial-active-law-shootout-v1.json",
);
const defaultOutputPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/atrial-active-law-shootout-v1.html",
);
const templatePath = resolve(
  repoRoot,
  "tools/mechanics2/templates/atrial-active-law-shootout-v1.html",
);
const placeholder = "__ATRIAL_ACTIVE_LAW_SHOOTOUT_DATA__";

type ArtifactV1 = AtrialActiveLawShootoutReportV1 & {
  readonly provenance: Record<string, unknown>;
  readonly normalizedSha256: string;
};

export function writeAtrialActiveLawShootoutVisualV1(
  sourcePath = defaultInputPath,
  destinationPath = defaultOutputPath,
): string {
  const artifact = JSON.parse(readFileSync(sourcePath, "utf8")) as ArtifactV1;
  const { normalizedSha256, ...body } = artifact;
  if (sha256Json(body) !== normalizedSha256) {
    throw new Error("active-law artifact normalized hash mismatch");
  }
  if (artifact.decision !== "no-winner-selected" ||
      artifact.claimBoundary.automaticWinnerSelection !== false) {
    throw new Error("visual requires an unranked report-only artifact");
  }
  const template = readFileSync(templatePath, "utf8");
  if (template.split(placeholder).length !== 2) {
    throw new Error("visual template must contain exactly one placeholder");
  }
  const compact = {
    benchId: artifact.benchId,
    evidenceStatus: artifact.evidenceStatus,
    decision: artifact.decision,
    protocol: artifact.protocol,
    variants: artifact.variants,
    factorialDesign: artifact.factorialDesign,
    factorialContrasts: artifact.factorialContrasts,
    numericalGates: artifact.numericalGates,
    interpretationBoundary: artifact.interpretationBoundary,
    normalizedSha256,
    results: artifact.results,
    dtRefinement: artifact.dtRefinement,
    visualizationProvenance: {
      rawAcceptedComponentVertices: true,
      smoothingApplied: false,
      interpolationAppliedBeforePlotting: false,
      spherePressureIsProjectionOnly: true,
      rendererSha256: createHash("sha256")
        .update(readFileSync(__filename))
        .digest("hex"),
      templateSha256: createHash("sha256").update(template).digest("hex"),
    },
  };
  const html = template.replace(
    placeholder,
    JSON.stringify(compact).replaceAll("<", "\\u003c"),
  );
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = `${destinationPath}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, html);
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
  console.log(JSON.stringify({
    stage: "atrial-active-law-shootout-visual-written",
    inputPath: sourcePath,
    outputPath: writeAtrialActiveLawShootoutVisualV1(
      sourcePath,
      destinationPath,
    ),
  }, null, 2));
}

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function stringArgument(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (value == null || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}
