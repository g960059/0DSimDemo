import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { NoAvpdPhysiologyMatrixArtifactV1 } from "@/tools/mechanics2/runNoAvpdPhysiologyMatrixV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const defaultInputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-physiology-matrix-v1.json",
);
const defaultOutputPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/no-avpd-physiology-matrix-v1.html",
);
const templatePath = resolve(
  repoRoot,
  "tools/mechanics2/templates/no-avpd-physiology-matrix-v1.html",
);
const placeholder = "__NO_AVPD_PHYSIOLOGY_MATRIX_DATA__";
const REQUIRED_LA_MORPHOLOGY_TRACE_COLUMNS_V1 = [
  "leftAtriumSeriesTensionKPa",
  "leftAtriumThinFilament01",
  "leftAtriumForceVelocityFactor",
  "leftAtriumLengthFactor",
] as const;

export function renderNoAvpdPhysiologyMatrixV1(
  artifact: NoAvpdPhysiologyMatrixArtifactV1,
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
      rawAcceptedStepVertices: true,
      smoothingApplied: false,
      decimationApplied: false,
      dataValueRoundingAppliedBeforeProjection: false,
      structuralFailureWaveformsFabricated: false,
      svgCoordinatePrecisionDigits: 2,
    },
  };
  return template.replace(
    placeholder,
    JSON.stringify(embedded).replaceAll("<", "\\u003c"),
  );
}

export function writeNoAvpdPhysiologyMatrixVisualV1(
  sourcePath = defaultInputPath,
  destinationPath = defaultOutputPath,
): string {
  const artifact = JSON.parse(
    readFileSync(sourcePath, "utf8"),
  ) as NoAvpdPhysiologyMatrixArtifactV1;
  const fragment = renderNoAvpdPhysiologyMatrixV1(artifact);
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
  const written = writeNoAvpdPhysiologyMatrixVisualV1(
    sourcePath,
    destinationPath,
  );
  console.log(
    JSON.stringify(
      {
        stage: "no-avpd-physiology-matrix-visual-written",
        inputPath: sourcePath,
        outputPath: written,
        rendererSha256: rendererSha256(),
      },
      null,
      2,
    ),
  );
}

function validateArtifact(artifact: NoAvpdPhysiologyMatrixArtifactV1): void {
  const { normalizedSha256, ...body } = artifact;
  if (sha256Json(body) !== normalizedSha256) {
    throw new Error(
      "physiology matrix artifact normalized hash does not match",
    );
  }
  if (
    artifact.comparisonPolicy.rawTraceSmoothingApplied !== false ||
    artifact.comparisonPolicy.rawTraceDecimationApplied !== false
  ) {
    throw new Error(
      "visualization requires raw, unsmoothed, undecimated traces",
    );
  }
  for (const candidate of artifact.candidates) {
    if (sha256Json(candidate.parameterSnapshot) !== candidate.parameterSha256) {
      throw new Error(
        `parameter snapshot hash mismatch: ${candidate.candidateId}`,
      );
    }
    if (candidate.structuralStatus === "pass") {
      if (
        candidate.diagnostics.sampleTreatment !==
          "one-complete-anchor-cycle-every-accepted-step-raw-no-smoothing-no-decimation" ||
        candidate.diagnostics.compactRawAnchorCycle.length === 0
      ) {
        throw new Error(
          `passing candidate lacks its raw anchor cycle: ${candidate.candidateId}`,
        );
      }
      for (const column of REQUIRED_LA_MORPHOLOGY_TRACE_COLUMNS_V1) {
        if (!candidate.diagnostics.traceColumns.includes(column)) {
          throw new Error(
            `passing candidate lacks LA morphology trace column ${column}: ${candidate.candidateId}`,
          );
        }
      }
      if (
        candidate.diagnostics.pumpingMorphology == null ||
        candidate.diagnostics.matchedVolume?.componentDecomposition
          ?.availability !== "available"
      ) {
        throw new Error(
          `passing candidate lacks LA morphology diagnostics: ${candidate.candidateId}`,
        );
      }
    } else if (candidate.diagnostics.compactRawAnchorCycle.length !== 0) {
      throw new Error(
        `failed candidate must not expose a fabricated cycle: ${candidate.candidateId}`,
      );
    }
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
