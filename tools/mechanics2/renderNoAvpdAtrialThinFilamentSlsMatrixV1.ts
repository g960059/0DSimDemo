import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";

import type { NoAvpdFourChamberBenchResultV1 } from "@/engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1";
import type { NoAvpdAtrialThinFilamentSlsMatrixArtifactV1 } from "@/tools/mechanics2/runNoAvpdAtrialThinFilamentSlsMatrixV1";
import type { writeNoAvpdFourChamberHillTriSegReportV1 } from "@/tools/mechanics2/runNoAvpdFourChamberHillTriSegBenchV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const defaultInputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-atrial-thin-filament-sls-matrix-v1.json",
);
const defaultOutputPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/no-avpd-atrial-thin-filament-sls-matrix-v1.html",
);
const templatePath = resolve(
  repoRoot,
  "tools/mechanics2/templates/no-avpd-atrial-thin-filament-sls-matrix-v1.html",
);
const placeholder = "__NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_DATA__";

type SourceReportV1 = ReturnType<
  typeof writeNoAvpdFourChamberHillTriSegReportV1
>;
type CandidateArtifactV1 =
  NoAvpdAtrialThinFilamentSlsMatrixArtifactV1["candidates"][number];
type EventPointV1 = NonNullable<
  NoAvpdFourChamberBenchResultV1["reportOnlyEventResolvedDiagnostics"]["left"]
>["prescribedCalciumReleaseOnset"];

const candidateOrder = [
  "ALG_SLS4",
  "ALG_SLS8",
  "LAG25_SLS4",
  "LAG25_SLS8",
] as const;

const traceColumns = [
  "phase01",
  "laVolumeMl",
  "lapMmHg",
  "lvpMmHg",
  "mvFlowMlPerSec",
  "caTroponin01",
  "equilibriumGate01",
  "thinFilamentAvailability01",
  "seriesTensionKPa",
] as const;

export function renderNoAvpdAtrialThinFilamentSlsMatrixV1(
  artifact: NoAvpdAtrialThinFilamentSlsMatrixArtifactV1,
  sourceRoot = repoRoot,
): string {
  validateArtifact(artifact);
  const indexed = new Map(
    artifact.candidates.map((candidate) => [candidate.candidateId, candidate]),
  );
  const candidates = candidateOrder.map((candidateId) => {
    const candidate = indexed.get(candidateId);
    if (candidate == null)
      throw new Error(`missing matrix candidate: ${candidateId}`);
    const sourceReport = readAndValidateSourceReport(candidate, sourceRoot);
    return compactCandidate(candidate, sourceReport);
  });
  const template = readFileSync(templatePath, "utf8");
  if (template.split(placeholder).length !== 2) {
    throw new Error(
      "visual template must contain exactly one data placeholder",
    );
  }
  const compact = {
    artifactId: artifact.artifactId,
    sourceNormalizedSha256: artifact.normalizedSha256,
    evidenceStatus: artifact.evidenceStatus,
    protocol: {
      beats: artifact.protocol.beats,
      dtSec: artifact.protocol.dtSec,
      heartRateBpm: artifact.protocol.heartRateBpm,
      sampleEverySteps: artifact.protocol.sampleEverySteps,
      jacobianReuseMaxAcceptedSteps:
        artifact.protocol.fixedGlobalNewtonProtocol
          .jacobianReuseMaxAcceptedSteps,
      jacobianPolicy:
        artifact.protocol.fixedGlobalNewtonProtocol.jacobianPolicy,
      rawSampleTreatment:
        "every accepted 5 ms endpoint; straight segments; no smoothing or decimation",
      eaTreatment: artifact.protocol.eaTreatment,
      automaticWinnerSelection: artifact.protocol.automaticWinnerSelection,
      physiologyGateApplied: artifact.protocol.physiologyGateApplied,
    },
    traceColumns,
    candidates,
    matrixDiagnostics: artifact.matrixDiagnostics,
    visualizationProvenance: {
      sourceNormalizedSha256: artifact.normalizedSha256,
      rendererSha256: rendererSha256(),
      eachCandidateSourceNormalizedSha256: artifact.candidates.map(
        (candidate) => ({
          candidateId: candidate.candidateId,
          sha256: candidate.sourceNormalizedSha256,
        }),
      ),
      rawAcceptedStepVertices: true,
      smoothingApplied: false,
      decimationApplied: false,
      dataValueRoundingAppliedBeforeProjection: false,
      physiologicalCurveFittingApplied: false,
      failedCandidateWaveformsFabricated: false,
      failedCandidateSourceTreatment:
        "last-complete-accepted-cycle-when-available-otherwise-unclosed-accepted-interval",
      svgCoordinatePrecisionDigits: 2,
      ledgerOwnedLaBloodVolume: true,
      eaUsedForRankingOrGating: false,
    },
  };
  const safeJson = JSON.stringify(compact).replaceAll("<", "\\u003c");
  const fragment = template.replace(placeholder, safeJson);
  if (Buffer.byteLength(fragment) >= 2_000_000) {
    throw new Error("visual fragment exceeds the 2 MB inline limit");
  }
  return fragment;
}

export function writeNoAvpdAtrialThinFilamentSlsMatrixVisualV1(
  sourcePath = defaultInputPath,
  destinationPath = defaultOutputPath,
): string {
  const artifact = JSON.parse(
    readFileSync(sourcePath, "utf8"),
  ) as NoAvpdAtrialThinFilamentSlsMatrixArtifactV1;
  const fragment = renderNoAvpdAtrialThinFilamentSlsMatrixV1(artifact);
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
  const written = writeNoAvpdAtrialThinFilamentSlsMatrixVisualV1(
    sourcePath,
    destinationPath,
  );
  console.log(
    JSON.stringify(
      {
        stage: "no-avpd-atrial-thin-filament-sls-matrix-visual-written",
        inputPath: sourcePath,
        outputPath: written,
        rendererSha256: rendererSha256(),
      },
      null,
      2,
    ),
  );
}

function validateArtifact(
  artifact: NoAvpdAtrialThinFilamentSlsMatrixArtifactV1,
): void {
  const { normalizedSha256, ...body } = artifact;
  if (sha256Json(body) !== normalizedSha256) {
    throw new Error("thin-filament/SLS matrix normalized hash does not match");
  }
  if (sha256Json(artifact.protocol) !== artifact.protocolSha256) {
    throw new Error("thin-filament/SLS matrix protocol hash does not match");
  }
  if (
    artifact.protocol.beats !== 32 ||
    artifact.protocol.dtSec !== 0.005 ||
    artifact.protocol.heartRateBpm !== 60 ||
    artifact.protocol.sampleEverySteps !== 1 ||
    artifact.protocol.fixedGlobalNewtonProtocol
      .jacobianReuseMaxAcceptedSteps !== 0 ||
    artifact.protocol.sampleRetention !== "last-two-complete-beats"
  ) {
    throw new Error("visualization requires the cold32 HR60 raw 5 ms protocol");
  }
  if (
    artifact.protocol.eaTreatment !==
      "continuous-report-only-never-an-objective-gate-or-ranking-term" ||
    artifact.protocol.automaticWinnerSelection !== false ||
    artifact.protocol.physiologyGateApplied !== false ||
    artifact.winnerSelection.promotedCandidateId !== null
  ) {
    throw new Error(
      "visualization requires the ungated, unranked matrix claim boundary",
    );
  }
  if (
    !artifact.parameterIsolation.nonFactorParametersIdentical ||
    !artifact.parameterIsolation.allCandidatesUseLumensDefaultMapping ||
    artifact.parameterIsolation.crossCandidateWarmStartUsed !== false
  ) {
    throw new Error(
      "matrix factor isolation or cold-start provenance is invalid",
    );
  }
  if (artifact.candidates.length !== 4) {
    throw new Error("visualization requires all four matrix candidates");
  }
}

function readAndValidateSourceReport(
  candidate: CandidateArtifactV1,
  sourceRoot: string,
): SourceReportV1 {
  const compressed = readFileSync(
    resolve(sourceRoot, candidate.compressedSourceReportPath),
  );
  if (sha256Bytes(compressed) !== candidate.sourceCompressedSha256) {
    throw new Error(
      `compressed source hash mismatch: ${candidate.candidateId}`,
    );
  }
  const sourceBytes = gunzipSync(compressed);
  if (
    sha256Bytes(sourceBytes) !== candidate.completeSourceReportSha256 ||
    sha256Bytes(sourceBytes) !== candidate.sourcePlaintextSha256
  ) {
    throw new Error(`plaintext source hash mismatch: ${candidate.candidateId}`);
  }
  const report = JSON.parse(sourceBytes.toString("utf8")) as SourceReportV1;
  const { normalizedSha256, ...normalizedBody } = report;
  if (
    normalizedSha256 !== candidate.sourceNormalizedSha256 ||
    sha256Json(normalizedBody) !== normalizedSha256
  ) {
    throw new Error(
      `source normalized hash mismatch: ${candidate.candidateId}`,
    );
  }
  if (
    report.parameterSha256 !== candidate.parameterSha256 ||
    sha256Json(report.parameterSnapshot) !== report.parameterSha256
  ) {
    throw new Error(`source parameter hash mismatch: ${candidate.candidateId}`);
  }
  if (
    report.status !== candidate.structuralStatus ||
    report.failureReason !== candidate.failureReason ||
    report.dtSec !== 0.005 ||
    report.runProtocol.sampleEverySteps !== 1 ||
    report.parameterSnapshot.solver.jacobianReuse.maxAcceptedSteps !== 0 ||
    report.runProtocol.sampleRetention !== "last-two-complete-beats"
  ) {
    throw new Error(
      `candidate raw 5 ms source status mismatch: ${candidate.candidateId}`,
    );
  }
  if (
    (report.status === "pass") !== report.hardDiagnostics.allStepsAccepted ||
    (report.status === "pass") !== (candidate.failureReason == null)
  ) {
    throw new Error(
      `candidate structural readback mismatch: ${candidate.candidateId}`,
    );
  }
  if (
    candidate.diagnostics.rawSourceContract.rawNoSmoothing !== true ||
    candidate.diagnostics.rawSourceContract.rawNoDecimation !== true ||
    candidate.diagnostics.rawSourceContract.sampleIntervalSec !== 0.005
  ) {
    throw new Error(
      `candidate raw source contract mismatch: ${candidate.candidateId}`,
    );
  }
  return report;
}

function compactCandidate(
  candidate: CandidateArtifactV1,
  report: SourceReportV1,
) {
  const retainedCycle = finalAcceptedCycle(report, candidate.candidateId);
  const activation =
    report.parameterSnapshot.atria.left.material.calciumTroponinActivation;
  const gate = (caTroponin01: number) => {
    const exponent = activation.thinFilamentCooperativity;
    const midpointPower = activation.thinFilamentHalfActivation01 ** exponent;
    const occupancyPower = caTroponin01 ** exponent;
    return (
      ((1 + midpointPower) * occupancyPower) / (occupancyPower + midpointPower)
    );
  };
  const trace = retainedCycle.points.map(({ phase01, sample }) => {
    const caTroponin01 = sample.wallReadback.la.caTroponin01;
    return [
      phase01,
      sample.volumesMl.leftAtriumMl,
      sample.pressuresMmHg.la,
      sample.pressuresMmHg.lv,
      sample.flowsMlPerSec.mv,
      caTroponin01,
      gate(caTroponin01),
      sample.wallReadback.la.thinFilamentAvailability01,
      sample.wallReadback.la.seriesTensionKPa,
    ] as const;
  });
  const left = report.reportOnlyEventResolvedDiagnostics.left;
  const pv = left?.pressureVolumeEvents ?? null;
  const valve = left?.valveTransitions.modelHalfOpen ?? null;
  const inflow = left?.inflowEvents ?? null;
  const morphology = candidate.diagnostics.morphology;
  const aLoop = morphology.aLoopMorphology;
  const matched = morphology.matchedVolume;
  const hard = candidate.hardDiagnostics;
  return {
    candidateId: candidate.candidateId,
    shortLabel:
      candidate.factors.thinFilament === "algebraic-equilibrium"
        ? `ALG · SLS ${candidate.factors.laSlsModulusPa / 1_000} kPa`
        : `lag 25 ms · SLS ${candidate.factors.laSlsModulusPa / 1_000} kPa`,
    label: candidate.label,
    factors: candidate.factors,
    structuralStatus: candidate.structuralStatus,
    failureReason: candidate.failureReason,
    rawCycleStatus: retainedCycle.status,
    trace,
    events: {
      mvo: compactEvent(valve?.opening ?? null),
      mvc: compactEvent(valve?.closure ?? null),
      calciumRelease: compactEvent(left?.prescribedCalciumReleaseOnset ?? null),
      volumeMinimum: compactEvent(pv?.volumeMinimum ?? null),
      aPeak: compactEvent(pv?.aPeak ?? null),
      xTrough: compactEvent(pv?.xTrough ?? null),
      vPeak: compactEvent(pv?.vPeak ?? null),
      yTrough: compactEvent(pv?.yTrough ?? null),
      ePeak: compactEvent(inflow?.ePeak ?? null),
      interpeakMinimum: compactEvent(inflow?.aStartInterpeakMinimum ?? null),
      aFlowPeak: compactEvent(inflow?.aPeak ?? null),
    },
    metrics: {
      structuralStatus: candidate.structuralStatus,
      rawCycleStatus: retainedCycle.status,
      failureReason: candidate.failureReason,
      aOnsetToPrimaryPeakMs:
        aLoop?.onsetToPrimaryRiseKinetics.onsetToPrimaryPeakMs ?? null,
      aPrimaryPeakRemainingVolumeFraction01:
        candidate.diagnostics.metricVector
          .aLoopPrimaryPeakRemainingVolumeFraction01,
      thinFilamentRise10To90Ms:
        candidate.diagnostics.metricVector.thinFilamentRise10To90Ms,
      lapRise10To90Ms: candidate.diagnostics.metricVector.lapRise10To90Ms,
      aLoopPrimaryCornerDeg:
        candidate.diagnostics.metricVector.aLoopPrimaryCornerDeg,
      aLoopReboundAmplitudeMmHg:
        candidate.diagnostics.metricVector.aLoopReboundAmplitudeMmHg,
      matchedVolumeGapAreaMmHgMl:
        candidate.diagnostics.metricVector.matchedVolumeGapAreaMmHgMl,
      matchedVolumeMeanGapMmHg:
        candidate.diagnostics.metricVector.matchedVolumeMeanGapMmHg,
      matchedVolumeOverlapWidthMl: matched?.overlapWidthMl ?? null,
      matchedVolumePositiveGapFraction01:
        matched?.positiveGapFraction01 ?? null,
      laPressureRangeMmHg:
        candidate.diagnostics.metricVector.laPressureRangeMmHg,
      laVolumeRangeMl: candidate.diagnostics.metricVector.laVolumeRangeMl,
      oneBeatNormalizedMax:
        candidate.diagnostics.orbitReadback.oneBeatNormalizedMax,
      maxGlobalScaledResidual: hard.maxGlobalScaledResidual,
      maxTriSegRelativeResidual: hard.maxTriSegRelativeResidual,
      maxSerialEquilibriumResidualPa: hard.maxSerialEquilibriumResidualPa,
      maxSlsOrSerialWorkResidual: Math.max(
        hard.maxSlsBalanceResidualJPerM3,
        hard.maxSerialWorkBalanceResidualJPerM3,
      ),
      maxAbsTotalBloodVolumeDriftMl: hard.maxAbsTotalBloodVolumeDriftMl,
      eToA: candidate.diagnostics.continuousEaReadback?.eToA ?? null,
      interpeakMinimumOverE:
        candidate.diagnostics.continuousEaReadback?.interpeakMinimumOverE ??
        null,
    },
    sourceHashes: {
      normalizedSha256: candidate.sourceNormalizedSha256,
      plaintextSha256: candidate.sourcePlaintextSha256,
      compressedSha256: candidate.sourceCompressedSha256,
    },
  };
}

function finalAcceptedCycle(report: SourceReportV1, candidateId: string) {
  if (report.lastBeatSamples.length < 2) {
    throw new Error(`candidate lacks a complete final cycle: ${candidateId}`);
  }
  const first = report.lastBeatSamples[0]!;
  const last = report.lastBeatSamples[report.lastBeatSamples.length - 1]!;
  const boundary = report.samples.find(
    (sample) =>
      sample.timeSec > last.timeSec &&
      sample.beatIndex === first.beatIndex + 1 &&
      Math.abs(sample.phase01) <= 1e-12,
  );
  const startsAtPhaseZero = Math.abs(first.phase01) <= 1e-12;
  const expectedCount =
    Math.round(report.runProtocol.cycleLengthSec / report.dtSec) + 1;
  const points = [
    ...report.lastBeatSamples.map((sample) => ({
      phase01: sample.phase01,
      sample,
    })),
    ...(boundary == null ? [] : [{ phase01: 1, sample: boundary }]),
  ];
  const completeClosedCycle =
    startsAtPhaseZero && boundary != null && points.length === expectedCount;
  if (report.status === "pass" && !completeClosedCycle) {
    throw new Error(
      `passing candidate raw final cycle has ${points.length}, expected ${expectedCount}: ${candidateId}`,
    );
  }
  if (points.length < 2) {
    throw new Error(
      `candidate lacks a plottable accepted interval: ${candidateId}`,
    );
  }
  return {
    status: completeClosedCycle
      ? ("complete-closed-accepted-cycle" as const)
      : ("partial-accepted-interval-after-cold-start-no-closure-imputed" as const),
    points,
  };
}

function compactEvent(point: EventPointV1 | null) {
  if (point == null) return null;
  return {
    phase01: point.phase01,
    volumeMl: point.atrialVolumeMl,
    pressureMmHg: point.atrialPressureMmHg,
    flowMlPerSec: point.atrioventricularFlowMlPerSec,
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

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function sha256Bytes(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
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
