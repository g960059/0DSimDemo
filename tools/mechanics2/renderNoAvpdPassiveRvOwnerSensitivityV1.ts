import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { NoAvpdPassiveRvOwnerSensitivityArtifactV1 } from "@/tools/mechanics2/runNoAvpdPassiveRvOwnerSensitivityV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const defaultInputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-passive-rv-owner-sensitivity-v1.json",
);
const defaultOutputPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/no-avpd-passive-rv-owner-sensitivity-v1.html",
);
const templatePath = resolve(
  repoRoot,
  "tools/mechanics2/templates/no-avpd-passive-rv-owner-sensitivity-v1.html",
);
const placeholder = "__NO_AVPD_PASSIVE_RV_OWNER_SENSITIVITY_DATA__";

type ArtifactCandidate =
  NoAvpdPassiveRvOwnerSensitivityArtifactV1["families"][number]["candidates"][number];
type ArtifactFamily =
  NoAvpdPassiveRvOwnerSensitivityArtifactV1["families"][number];

export function renderNoAvpdPassiveRvOwnerSensitivityV1(
  artifact: NoAvpdPassiveRvOwnerSensitivityArtifactV1,
): string {
  validateArtifactAndIndexCandidates(artifact);
  const loadFamily = requireFamily(
    artifact,
    "prescribed-rv-transmural-pressure",
  );
  const stiffnessFamily = requireFamily(
    artifact,
    "rv-free-wall-passive-tangent-modulus",
  );
  const loadReference = requireFamilyReference(loadFamily);
  const stiffnessReference = requireFamilyReference(stiffnessFamily);
  const loadCandidates = loadFamily.candidates
    .filter(
      (candidate) => candidate.declaration.role === "sensitivity-candidate",
    )
    .sort(
      (left, right) =>
        left.declaration.targetRvTransmuralPressureMmHg -
        right.declaration.targetRvTransmuralPressureMmHg,
    );
  const stiffnessCandidates = stiffnessFamily.candidates
    .filter(
      (candidate) => candidate.declaration.role === "sensitivity-candidate",
    )
    .sort(
      (left, right) =>
        left.declaration.rightFreeWallPassiveTangentModulusScale -
        right.declaration.rightFreeWallPassiveTangentModulusScale,
    );
  if (loadCandidates.length !== 2 || stiffnessCandidates.length !== 2) {
    throw new Error(
      "visualization requires two sensitivity candidates plus one reference per family",
    );
  }
  if (
    JSON.stringify(loadReference.edpvr) !==
    JSON.stringify(stiffnessReference.edpvr)
  ) {
    throw new Error(
      "duplicated 5-mmHg / 1x reference EDPVR reports are not identical",
    );
  }

  const compact = {
    artifactId: artifact.artifactId,
    sourceNormalizedSha256: artifact.normalizedSha256,
    protocol: {
      evidenceStatus: artifact.protocol.evidenceStatus,
      familyIsolation: artifact.protocol.familyIsolation,
      scalarWinnerSelected: artifact.protocol.scalarWinnerSelected,
      physiologyGateApplied: artifact.protocol.physiologyGateApplied,
      claimBoundary: artifact.protocol.claimBoundary,
    },
    referenceIdentity: {
      visualSeriesId: "shared-reference",
      loadFamilyCandidateId: loadReference.declaration.candidateId,
      stiffnessFamilyCandidateId: stiffnessReference.declaration.candidateId,
      completeEdpvrReportsByteIdentical: true,
      label: "5 mmHg / 1x shared reference",
    },
    series: [
      compactSeries(
        loadCandidates[0]!,
        "load-candidate-1",
        `RV load ${formatCandidateNumber(loadCandidates[0]!.declaration.targetRvTransmuralPressureMmHg)} mmHg`,
        "load",
        "circle",
      ),
      compactSeries(
        loadCandidates[1]!,
        "load-candidate-2",
        `RV load ${formatCandidateNumber(loadCandidates[1]!.declaration.targetRvTransmuralPressureMmHg)} mmHg`,
        "load",
        "square",
      ),
      compactSeries(
        loadReference,
        "shared-reference",
        "5 mmHg / 1x shared reference",
        "shared-reference",
        "diamond",
        [
          loadReference.declaration.candidateId,
          stiffnessReference.declaration.candidateId,
        ],
      ),
      compactSeries(
        stiffnessCandidates[0]!,
        "stiffness-candidate-1",
        `RVFW passive tangent ${formatCandidateNumber(stiffnessCandidates[0]!.declaration.rightFreeWallPassiveTangentModulusScale)}x`,
        "stiffness",
        "triangle",
      ),
      compactSeries(
        stiffnessCandidates[1]!,
        "stiffness-candidate-2",
        `RVFW passive tangent ${formatCandidateNumber(stiffnessCandidates[1]!.declaration.rightFreeWallPassiveTangentModulusScale)}x`,
        "stiffness",
        "cross",
      ),
    ],
    visualizationProvenance: {
      sourceNormalizedSha256: artifact.normalizedSha256,
      rendererSha256: rendererSha256(),
      fullRequestedLvVolumeGridRetainedPerVisualSeries: true,
      duplicatedReferenceRenderedOnce: true,
      rawIndependentEquilibriumPoints: true,
      smoothingApplied: false,
      decimationApplied: false,
      derivativeRecalculated: false,
      dataValueRoundingAppliedBeforeProjection: false,
      svgCoordinatePrecisionDigits: 2,
    },
  };
  const template = readFileSync(templatePath, "utf8");
  if (template.split(placeholder).length !== 2) {
    throw new Error(
      "visual template must contain exactly one data placeholder",
    );
  }
  return template.replace(
    placeholder,
    JSON.stringify(compact).replaceAll("<", "\\u003c"),
  );
}

export function writeNoAvpdPassiveRvOwnerSensitivityVisualV1(
  sourcePath = defaultInputPath,
  destinationPath = defaultOutputPath,
): string {
  const artifact = JSON.parse(
    readFileSync(sourcePath, "utf8"),
  ) as NoAvpdPassiveRvOwnerSensitivityArtifactV1;
  const html = renderNoAvpdPassiveRvOwnerSensitivityV1(artifact);
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
  const written = writeNoAvpdPassiveRvOwnerSensitivityVisualV1(
    sourcePath,
    destinationPath,
  );
  console.log(
    JSON.stringify(
      {
        stage: "no-avpd-passive-rv-owner-sensitivity-visual-written",
        inputPath: sourcePath,
        outputPath: written,
        rendererSha256: rendererSha256(),
      },
      null,
      2,
    ),
  );
}

function validateArtifactAndIndexCandidates(
  artifact: NoAvpdPassiveRvOwnerSensitivityArtifactV1,
): ReadonlyMap<string, ArtifactCandidate> {
  const { normalizedSha256, ...body } = artifact;
  if (sha256Json(body) !== normalizedSha256) {
    throw new Error(
      "RV-owner sensitivity artifact normalized hash does not match",
    );
  }
  if (artifact.provenance.protocolSha256 !== sha256Json(artifact.protocol)) {
    throw new Error("RV-owner sensitivity protocol hash does not match");
  }
  if (
    artifact.provenance.rawPointTreatment !==
    "full-independent-lv-volume-grid-no-smoothing-no-decimation"
  ) {
    throw new Error("visualization requires the complete raw LV-volume grid");
  }
  if (
    artifact.protocol.scalarWinnerSelected !== false ||
    artifact.protocol.physiologyGateApplied !== false
  ) {
    throw new Error(
      "visualization is restricted to report-only, ungated matrices",
    );
  }
  const candidates = new Map<string, ArtifactCandidate>();
  for (const family of artifact.families) {
    for (const candidate of family.candidates) {
      const { hashes, ...candidateBody } = candidate;
      if (hashes.declarationSha256 !== sha256Json(candidate.declaration)) {
        throw new Error(
          `candidate declaration hash mismatch: ${candidate.declaration.candidateId}`,
        );
      }
      if (
        hashes.effectiveParameterSha256 !==
        sha256Json({
          boundary: candidate.edpvr.boundary,
          model: candidate.edpvr.parameterSnapshot,
        })
      ) {
        throw new Error(
          `candidate parameter hash mismatch: ${candidate.declaration.candidateId}`,
        );
      }
      if (hashes.completeCandidateReportSha256 !== sha256Json(candidateBody)) {
        throw new Error(
          `candidate report hash mismatch: ${candidate.declaration.candidateId}`,
        );
      }
      if (
        candidate.edpvr.points.length === 0 ||
        candidate.edpvr.points.some((point) => point.status !== "available")
      ) {
        throw new Error(
          `candidate lacks a complete available grid: ${candidate.declaration.candidateId}`,
        );
      }
      if (candidates.has(candidate.declaration.candidateId)) {
        throw new Error(
          `duplicate candidate id: ${candidate.declaration.candidateId}`,
        );
      }
      candidates.set(candidate.declaration.candidateId, candidate);
    }
  }
  return candidates;
}

function requireFamily(
  artifact: NoAvpdPassiveRvOwnerSensitivityArtifactV1,
  familyId: ArtifactFamily["declaration"]["familyId"],
): ArtifactFamily {
  const family = artifact.families.find(
    (candidateFamily) => candidateFamily.declaration.familyId === familyId,
  );
  if (family === undefined) throw new Error(`missing family: ${familyId}`);
  return family;
}

function requireFamilyReference(family: ArtifactFamily): ArtifactCandidate {
  const references = family.candidates.filter(
    (candidate) => candidate.declaration.role === "family-reference",
  );
  if (references.length !== 1) {
    throw new Error(
      `family ${family.declaration.familyId} must contain exactly one reference`,
    );
  }
  return references[0]!;
}

function compactSeries(
  candidate: ArtifactCandidate,
  seriesId: string,
  label: string,
  visualFamily: "load" | "stiffness" | "shared-reference",
  marker: "circle" | "square" | "diamond" | "triangle" | "cross",
  sourceCandidateIds: readonly string[] = [candidate.declaration.candidateId],
) {
  return {
    seriesId,
    label,
    visualFamily,
    marker,
    sourceCandidateIds,
    declaration: candidate.declaration,
    effectiveInputs: candidate.effectiveInputs,
    rootAvailability: candidate.summary.rootAvailability,
    points: candidate.edpvr.points.map((point) => {
      if (point.status !== "available") {
        throw new Error(
          `unexpected unavailable point in ${candidate.declaration.candidateId}`,
        );
      }
      return {
        lvVolumeMl: point.lvVolumeMl,
        requiredRvVolumeMl: point.rvVolumeMl,
        lvTransmuralPressureMmHg: point.lvTransmuralPressureMmHg,
        septalCapVolumeMl: point.triSegCoordinates.septalCapVolumeMl,
        centeredSecantPressureSlopeMmHgPerMl:
          point.centeredSecantPressureSlopeMmHgPerMl,
      };
    }),
  };
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

function formatCandidateNumber(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : String(value);
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
