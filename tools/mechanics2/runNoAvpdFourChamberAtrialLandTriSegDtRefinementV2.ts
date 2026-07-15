import { createHash, randomUUID } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";

import type { NoAvpdFourChamberAtrialLandBenchSampleV2 } from "@/engine/mechanics2/benches/NoAvpdFourChamberAtrialLandTriSegBenchV2";
import {
  currentNoAvpdFourChamberAtrialLandHarnessSha256V2,
  currentNoAvpdFourChamberAtrialLandImplementationSha256V2,
  DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_REPORT_PATH_V2,
  validateNoAvpdFourChamberAtrialLandTriSegReportV2,
  type NoAvpdFourChamberAtrialLandReportV2,
} from "@/tools/mechanics2/runNoAvpdFourChamberAtrialLandTriSegBenchV2";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
export const DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_DT_REFINEMENT_REPORT_PATH_V2 = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-four-chamber-atrial-land-triseg-dt-refinement-v2.json",
);

const fields = Object.freeze({
  laVolumeMl: (sample: NoAvpdFourChamberAtrialLandBenchSampleV2) =>
    sample.volumesMl.leftAtriumMl,
  lvVolumeMl: (sample: NoAvpdFourChamberAtrialLandBenchSampleV2) =>
    sample.volumesMl.leftVentricleMl,
  laPressureMmHg: (sample: NoAvpdFourChamberAtrialLandBenchSampleV2) =>
    sample.pressuresMmHg.la,
  lvPressureMmHg: (sample: NoAvpdFourChamberAtrialLandBenchSampleV2) =>
    sample.pressuresMmHg.lv,
  mitralFlowMlPerSec: (sample: NoAvpdFourChamberAtrialLandBenchSampleV2) =>
    sample.flowsMlPerSec.mv,
  pulmonaryVenousFlowMlPerSec:
    (sample: NoAvpdFourChamberAtrialLandBenchSampleV2) =>
      sample.flowsMlPerSec.pulmonaryVenous,
  laFreeCalciumUm: (sample: NoAvpdFourChamberAtrialLandBenchSampleV2) =>
    sample.freeCalciumUm.la,
  laActiveStressKPa: (sample: NoAvpdFourChamberAtrialLandBenchSampleV2) =>
    sample.leftAtrium.activeKirchhoffStressKPa,
  laPassiveStressKPa: (sample: NoAvpdFourChamberAtrialLandBenchSampleV2) =>
    sample.leftAtrium.passiveStressKPa,
  laSlsOverstressKPa: (sample: NoAvpdFourChamberAtrialLandBenchSampleV2) =>
    sample.leftAtrium.slsOverstressKPa,
  laTotalStressKPa: (sample: NoAvpdFourChamberAtrialLandBenchSampleV2) =>
    sample.leftAtrium.totalStressKPa,
});

export function writeNoAvpdFourChamberAtrialLandTriSegDtRefinementV2(
  coarseReportPath: string,
  fineReportPath: string,
  destinationPath =
    DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_DT_REFINEMENT_REPORT_PATH_V2,
) {
  if (
    resolve(destinationPath) === resolve(coarseReportPath) ||
    resolve(destinationPath) === resolve(fineReportPath)
  ) {
    throw new Error("dt refinement output must differ from both source reports");
  }
  if (
    resolve(destinationPath) ===
        resolve(
          DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_DT_REFINEMENT_REPORT_PATH_V2,
        ) &&
    (!isRepositoryPath(coarseReportPath) || !isRepositoryPath(fineReportPath))
  ) {
    throw new Error(
      "canonical dt refinement artifact requires repository-owned source reports",
    );
  }
  const coarse = loadRefinementSourceReport(
    coarseReportPath,
  );
  const fine = loadRefinementSourceReport(
    fineReportPath,
  );
  validateComparable(coarse, fine);
  const aligned = alignCoarseToFine(coarse.lastBeatSamples, fine.lastBeatSamples);
  const fieldComparisons = Object.fromEntries(
    Object.entries(fields).map(([field, getter]) => [
      field,
      compareField(aligned, getter),
    ]),
  );
  const coarsePhysiology = coarse.reportOnlyPhysiology;
  const finePhysiology = fine.reportOnlyPhysiology;
  const body = Object.freeze({
    artifactId:
      "no-avpd-four-chamber-atrial-land-triseg-dt-refinement-report-v2" as const,
    statusScope: "report-only-time-step-refinement" as const,
    status: "report-only" as const,
    claim: Object.freeze({
      physiologyAcceptanceClaimed: false,
      morphologyAcceptanceClaimed: false,
      smoothingApplied: false,
      comparisonGrid: "coarse-final-beat-phases-exactly-matched-in-fine-final-beat",
      bothRunsRequiredStructurallyAccepted: true,
      bothRunsRequiredOneBeatReturnAtCallerTolerance: true,
      bothRunsRequiredIndependentColdStart: true,
      thresholdAppliedToWaveformDifferences: false,
    }),
    protocol: Object.freeze({
      coarseDtSec: coarse.protocol.dtSec,
      fineDtSec: fine.protocol.dtSec,
      refinementRatio: coarse.protocol.dtSec / fine.protocol.dtSec,
      commonRawVertexCount: aligned.length,
      parameterSha256: coarse.parameterSha256,
    }),
    sources: Object.freeze({
      coarse: sourceMetadata(coarseReportPath, coarse),
      fine: sourceMetadata(fineReportPath, fine),
    }),
    periodicity: Object.freeze({
      coarse: coarse.exactOneBeatFullStateReturnMap,
      fine: fine.exactOneBeatFullStateReturnMap,
    }),
    fieldComparisons,
    loopAreaComparisons: Object.freeze({
      laPv: compareLoopArea(
        coarse.lastBeatSamples,
        fine.lastBeatSamples,
        (sample) => [sample.volumesMl.leftAtriumMl, sample.pressuresMmHg.la],
      ),
      lvPv: compareLoopArea(
        coarse.lastBeatSamples,
        fine.lastBeatSamples,
        (sample) => [sample.volumesMl.leftVentricleMl, sample.pressuresMmHg.lv],
      ),
    }),
    eventAndPeakComparisons: Object.freeze({
      mitralOpeningPhaseAbsoluteDifference: absoluteDifference(
        coarsePhysiology?.mitralOpeningPhase01,
        finePhysiology?.mitralOpeningPhase01,
      ),
      mitralClosurePhaseAbsoluteDifference: absoluteDifference(
        coarsePhysiology?.mitralClosurePhase01,
        finePhysiology?.mitralClosurePhase01,
      ),
      ePeakPhaseAbsoluteDifference: absoluteDifference(
        coarsePhysiology?.ePeak?.phase01,
        finePhysiology?.ePeak?.phase01,
      ),
      ePeakFlowRelativeDifference: relativeDifference(
        coarsePhysiology?.ePeak?.flowMlPerSec,
        finePhysiology?.ePeak?.flowMlPerSec,
      ),
      aPeakPhaseAbsoluteDifference: absoluteDifference(
        coarsePhysiology?.aPeak?.phase01,
        finePhysiology?.aPeak?.phase01,
      ),
      aPeakFlowRelativeDifference: relativeDifference(
        coarsePhysiology?.aPeak?.flowMlPerSec,
        finePhysiology?.aPeak?.flowMlPerSec,
      ),
      eaPeakRatioAbsoluteDifference: absoluteDifference(
        coarsePhysiology?.eaPeakRatio,
        finePhysiology?.eaPeakRatio,
      ),
      lvEjectionFractionAbsoluteDifference: absoluteDifference(
        coarsePhysiology?.lvEjectionFraction01,
        finePhysiology?.lvEjectionFraction01,
      ),
    }),
    provenance: Object.freeze({
      harnessPath:
        "tools/mechanics2/runNoAvpdFourChamberAtrialLandTriSegDtRefinementV2.ts",
      harnessSha256: sha256(readFileSync(__filename)),
    }),
  });
  const artifact = Object.freeze({
    ...body,
    normalizedSha256: sha256(JSON.stringify(body)),
  });
  writeJsonAtomically(destinationPath, artifact);
  return artifact;
}

export type NoAvpdFourChamberAtrialLandTriSegDtRefinementReportV2 =
  ReturnType<typeof writeNoAvpdFourChamberAtrialLandTriSegDtRefinementV2>;

export function loadNoAvpdFourChamberAtrialLandTriSegDtRefinementV2(
  sourcePath =
    DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_DT_REFINEMENT_REPORT_PATH_V2,
  requireCurrentSources = false,
): NoAvpdFourChamberAtrialLandTriSegDtRefinementReportV2 {
  const parsed = JSON.parse(readFileSync(sourcePath, "utf8")) as unknown;
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("dt refinement artifact must be a JSON object");
  }
  const record = parsed as Record<string, unknown>;
  if (
    record.artifactId !==
      "no-avpd-four-chamber-atrial-land-triseg-dt-refinement-report-v2"
  ) {
    throw new Error("dt refinement artifact id is incompatible");
  }
  const normalizedSha256 = record.normalizedSha256;
  if (typeof normalizedSha256 !== "string") {
    throw new Error("dt refinement artifact has no normalized hash");
  }
  const { normalizedSha256: omitted, ...body } = record;
  void omitted;
  if (sha256(JSON.stringify(body)) !== normalizedSha256) {
    throw new Error("dt refinement artifact normalized hash does not match");
  }
  const artifact = parsed as NoAvpdFourChamberAtrialLandTriSegDtRefinementReportV2;
  if (requireCurrentSources) validateCurrentArtifactSources(artifact);
  return artifact;
}

function validateComparable(
  coarse: NoAvpdFourChamberAtrialLandReportV2,
  fine: NoAvpdFourChamberAtrialLandReportV2,
): void {
  const coarseGrid = validateNoAvpdFourChamberAtrialLandDtGridV2(coarse);
  const fineGrid = validateNoAvpdFourChamberAtrialLandDtGridV2(fine);
  if (coarse.parameterSha256 !== fine.parameterSha256) {
    throw new Error("dt refinement reports have different parameter hashes");
  }
  if (
    coarse.provenance.implementationSha256 !==
      fine.provenance.implementationSha256
  ) {
    throw new Error("dt refinement reports have different equations hashes");
  }
  if (coarse.provenance.harnessSha256 !== fine.provenance.harnessSha256) {
    throw new Error("dt refinement reports have different bench/runner hashes");
  }
  if (
    coarse.continuationProtocol.periodicToleranceMaxAbsDimensionless !==
      fine.continuationProtocol.periodicToleranceMaxAbsDimensionless
  ) {
    throw new Error("dt refinement reports use different one-beat return tolerances");
  }
  if (
    coarse.continuationProtocol.periodicClassification !==
      "within-caller-one-beat-return-tolerance" ||
    fine.continuationProtocol.periodicClassification !==
      "within-caller-one-beat-return-tolerance"
  ) {
    throw new Error("dt refinement requires both reports to meet their one-beat return tolerance");
  }
  if (
    coarse.protocol.initialization.mode !== "independent-cold-start" ||
    fine.protocol.initialization.mode !== "independent-cold-start"
  ) {
    throw new Error("dt refinement requires two independent cold-start runs");
  }
  const ratio = coarse.protocol.dtSec / fine.protocol.dtSec;
  if (!(ratio > 1) || Math.abs(ratio - Math.round(ratio)) > 1e-10) {
    throw new Error("coarse dt must be an integer multiple greater than fine dt");
  }
  if (fineGrid.stepsPerCycle !== coarseGrid.stepsPerCycle * Math.round(ratio)) {
    throw new Error("fine grid size does not equal the integer dt refinement ratio");
  }
  if (coarse.protocol.beatsRequested !== fine.protocol.beatsRequested) {
    throw new Error("dt refinement reports use different beat horizons");
  }
  for (const getter of Object.values(fields)) {
    for (const sample of [...coarse.lastBeatSamples, ...fine.lastBeatSamples]) {
      if (!Number.isFinite(getter(sample))) {
        throw new Error("dt refinement source contains a non-finite compared field");
      }
    }
  }
}

export function validateNoAvpdFourChamberAtrialLandDtGridV2(
  report: Pick<
    NoAvpdFourChamberAtrialLandReportV2,
    "protocol" | "parameterSnapshot" | "lastBeatSamples"
  >,
): { readonly stepsPerCycle: number; readonly cycleLengthSec: number } {
  const dtSec = report.protocol.dtSec;
  const cycleLengthSec = report.parameterSnapshot.cycleLengthSec;
  const exactSteps = cycleLengthSec / dtSec;
  const stepsPerCycle = Math.round(exactSteps);
  if (
    !Number.isFinite(exactSteps) ||
    stepsPerCycle < 1 ||
    Math.abs(exactSteps - stepsPerCycle) > 1e-10 ||
    report.protocol.stepsPerCycle !== stepsPerCycle
  ) {
    throw new Error("dt refinement source protocol has an incoherent time grid");
  }
  if (report.lastBeatSamples.length !== stepsPerCycle + 1) {
    throw new Error("dt refinement source does not retain every final-beat endpoint");
  }
  const startTimeSec = report.lastBeatSamples[0]!.timeSec;
  for (let index = 0; index <= stepsPerCycle; index += 1) {
    const sample = report.lastBeatSamples[index]!;
    const expectedPhase = index / stepsPerCycle;
    const expectedTimeSec = startTimeSec + index * dtSec;
    if (
      !Number.isFinite(sample.phase01) ||
      !Number.isFinite(sample.timeSec) ||
      Math.abs(sample.phase01 - expectedPhase) > 1e-12 ||
      Math.abs(sample.timeSec - expectedTimeSec) > 1e-9
    ) {
      throw new Error(`dt refinement source grid mismatch at endpoint ${index}`);
    }
    if (
      index > 0 &&
      sample.phase01 <= report.lastBeatSamples[index - 1]!.phase01
    ) {
      throw new Error("dt refinement source phases must be strictly increasing");
    }
  }
  return Object.freeze({ stepsPerCycle, cycleLengthSec });
}

type AlignedPair = readonly [
  NoAvpdFourChamberAtrialLandBenchSampleV2,
  NoAvpdFourChamberAtrialLandBenchSampleV2,
];

function alignCoarseToFine(
  coarse: readonly NoAvpdFourChamberAtrialLandBenchSampleV2[],
  fine: readonly NoAvpdFourChamberAtrialLandBenchSampleV2[],
): readonly AlignedPair[] {
  const ratio = (fine.length - 1) / (coarse.length - 1);
  if (!Number.isInteger(ratio) || ratio <= 1) {
    throw new Error("fine grid does not have an integer number of substeps");
  }
  return Object.freeze(coarse.map((sample, index) => {
    const match = fine[index * ratio];
    if (
      match == null ||
      Math.abs(match.phase01 - sample.phase01) > 1e-12
    ) {
      throw new Error(`fine report has no exact phase ${sample.phase01}`);
    }
    return Object.freeze([sample, match] as const);
  }));
}

function compareField(
  aligned: readonly AlignedPair[],
  getter: (sample: NoAvpdFourChamberAtrialLandBenchSampleV2) => number,
) {
  const differences = aligned.map(([coarse, fine]) =>
    getter(coarse) - getter(fine)
  );
  const fineValues = aligned.map(([, fine]) => getter(fine));
  const maximumAbsoluteDifference = Math.max(
    ...differences.map((value) => Math.abs(value)),
  );
  const rmsDifference = Math.sqrt(
    differences.reduce((sum, value) => sum + value * value, 0) /
      differences.length,
  );
  const fineScale = Math.max(1e-12, ...fineValues.map((value) => Math.abs(value)));
  return Object.freeze({
    maximumAbsoluteDifference,
    rmsDifference,
    fineMaximumAbsoluteScale: fineScale,
    maximumDifferenceRelativeToFineMaximum: maximumAbsoluteDifference / fineScale,
    rmsDifferenceRelativeToFineMaximum: rmsDifference / fineScale,
  });
}

function compareLoopArea(
  coarse: readonly NoAvpdFourChamberAtrialLandBenchSampleV2[],
  fine: readonly NoAvpdFourChamberAtrialLandBenchSampleV2[],
  point: (
    sample: NoAvpdFourChamberAtrialLandBenchSampleV2,
  ) => readonly [number, number],
) {
  const coarseSignedArea = signedLoopArea(coarse.map(point));
  const fineSignedArea = signedLoopArea(fine.map(point));
  return Object.freeze({
    coarseSignedArea,
    fineSignedArea,
    absoluteDifference: Math.abs(coarseSignedArea - fineSignedArea),
    relativeDifference: Math.abs(coarseSignedArea - fineSignedArea) /
      Math.max(1e-12, Math.abs(fineSignedArea)),
  });
}

function signedLoopArea(points: readonly (readonly [number, number])[]): number {
  let twiceArea = 0;
  for (let index = 1; index < points.length; index += 1) {
    const left = points[index - 1]!;
    const right = points[index]!;
    twiceArea += left[0] * right[1] - right[0] * left[1];
  }
  return 0.5 * twiceArea;
}

function sourceMetadata(
  path: string,
  report: NoAvpdFourChamberAtrialLandReportV2,
) {
  const bytes = readFileSync(path);
  return Object.freeze({
    path: relativeRepoPath(path),
    contentEncoding: isGzip(bytes) ? "gzip" as const : "identity" as const,
    fileByteLength: bytes.byteLength,
    fileSha256: sha256(bytes),
    normalizedSha256: report.normalizedSha256,
    dtSec: report.protocol.dtSec,
    beats: report.protocol.beatsRequested,
    initialization: report.protocol.initialization.mode,
  });
}

function loadRefinementSourceReport(
  path: string,
): NoAvpdFourChamberAtrialLandReportV2 {
  const bytes = readFileSync(path);
  const jsonBytes = isGzip(bytes) ? gunzipSync(bytes) : bytes;
  const parsed = JSON.parse(jsonBytes.toString("utf8")) as unknown;
  return validateNoAvpdFourChamberAtrialLandTriSegReportV2(parsed, {
    requireAcceptedStructuralRun: true,
  });
}

function isGzip(bytes: Buffer): boolean {
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

function validateCurrentArtifactSources(
  artifact: NoAvpdFourChamberAtrialLandTriSegDtRefinementReportV2,
): void {
  const currentImplementation =
    currentNoAvpdFourChamberAtrialLandImplementationSha256V2();
  const currentHarness = currentNoAvpdFourChamberAtrialLandHarnessSha256V2();
  for (const source of [artifact.sources.coarse, artifact.sources.fine]) {
    if (source.path.startsWith("/") || source.path.includes("..")) {
      throw new Error("dt refinement source path must be repository-relative");
    }
    const absolutePath = resolve(repoRoot, source.path);
    const bytes = readFileSync(absolutePath);
    if (sha256(bytes) !== source.fileSha256) {
      throw new Error(`dt refinement source file hash mismatch: ${source.path}`);
    }
    const report = loadRefinementSourceReport(absolutePath);
    if (report.normalizedSha256 !== source.normalizedSha256) {
      throw new Error(
        `dt refinement source normalized hash mismatch: ${source.path}`,
      );
    }
    if (
      report.provenance.implementationSha256 !== currentImplementation ||
      report.provenance.harnessSha256 !== currentHarness
    ) {
      throw new Error(`dt refinement source is stale: ${source.path}`);
    }
  }
}

function absoluteDifference(
  left: number | null | undefined,
  right: number | null | undefined,
): number | null {
  return left == null || right == null ? null : Math.abs(left - right);
}

function relativeDifference(
  left: number | null | undefined,
  right: number | null | undefined,
): number | null {
  return left == null || right == null
    ? null
    : Math.abs(left - right) / Math.max(1e-12, Math.abs(right));
}

function writeJsonAtomically(destinationPath: string, value: unknown): void {
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = `${destinationPath}.tmp-${process.pid}-${randomUUID()}`;
  try {
    writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, {
      flag: "wx",
    });
    renameSync(temporaryPath, destinationPath);
  } finally {
    rmSync(temporaryPath, { force: true });
  }
}

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function relativeRepoPath(absolutePath: string): string {
  return absolutePath.startsWith(`${repoRoot}/`)
    ? absolutePath.slice(repoRoot.length + 1)
    : absolutePath;
}

function isRepositoryPath(path: string): boolean {
  const absolutePath = resolve(path);
  return absolutePath.startsWith(`${repoRoot}/`);
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

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const coarse = resolve(
    repoRoot,
    stringArgument("--coarse") ??
      DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_REPORT_PATH_V2,
  );
  const fineArgument = stringArgument("--fine");
  if (fineArgument == null) throw new Error("--fine report path is required");
  const fine = resolve(repoRoot, fineArgument);
  const output = resolve(
    repoRoot,
    stringArgument("--output") ??
      DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_DT_REFINEMENT_REPORT_PATH_V2,
  );
  const report = writeNoAvpdFourChamberAtrialLandTriSegDtRefinementV2(
    coarse,
    fine,
    output,
  );
  console.log(JSON.stringify(report, null, 2));
}
