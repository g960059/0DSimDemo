import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";

import {
  PR467_LA_ACCEPTED_HISTORY_ACTIVE_REPLAY_BENCH_ID_V1,
  PR467_LA_ACCEPTED_HISTORY_ACTIVE_REPLAY_CLAIM_V1,
  replayPr467LaAcceptedHistoryV1,
  type Pr467LaAcceptedHistoryCandidateIdV1,
  type Pr467LaAcceptedHistorySampleV1,
  type Pr467LaAcceptedHistoryV1,
} from "@/engine/mechanics2/benches/Pr467LaAcceptedHistoryActiveReplayV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");

export const PR467_LA_ACCEPTED_HISTORY_ACTIVE_REPLAY_ARTIFACT_ID_V1 =
  "pr467-la-accepted-history-active-replay-report-v1" as const;

const defaultOutputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/pr467-la-accepted-history-active-replay-v1.json",
);

const CANDIDATE_IDS = Object.freeze([
  "ALG_SLS4",
  "ALG_SLS8",
  "LAG25_SLS4",
  "LAG25_SLS8",
] as const);

const IMPLEMENTATION_SOURCE_PATHS = Object.freeze([
  "engine/mechanics2/activation/Land2017ActiveOnlyV1.ts",
  "engine/mechanics2/activation/LandFormCaTroponinActivationV1.ts",
  "engine/mechanics2/constitutive/HillCeSeeSlsV1.ts",
  "engine/mechanics2/geometry/OneFiberVolumeGeometryV1.ts",
  "engine/mechanics2/benches/Pr467LaAcceptedHistoryActiveReplayV1.ts",
  "engine/myocardium/atrialLandNiederer2018.ts",
  "engine/myocardium/myofilament/land2017/equations.ts",
  "engine/myocardium/myofilament/land2017/index.ts",
  "engine/myocardium/myofilament/land2017/jacobian.ts",
  "engine/myocardium/myofilament/land2017/outputs.ts",
  "engine/myocardium/myofilament/land2017/parameterSets.ts",
  "engine/myocardium/myofilament/land2017/protocols.ts",
  "engine/myocardium/myofilament/land2017/residual.ts",
  "engine/myocardium/myofilament/land2017/sdirk2.ts",
  "engine/myocardium/myofilament/land2017/solver.ts",
  "engine/myocardium/myofilament/land2017/stabilization.ts",
  "engine/myocardium/myofilament/land2017/tangents.ts",
  "engine/myocardium/myofilament/land2017/types.ts",
  "package-lock.json",
] as const);

const HARNESS_SOURCE_PATHS = Object.freeze([
  "tools/mechanics2/runPr467LaAcceptedHistoryActiveReplayV1.ts",
] as const);

type SourceReportSample = {
  readonly timeSec: number;
  readonly beatIndex: number;
  readonly phase01: number;
  readonly volumesMl: {
    readonly leftAtriumMl: number;
    readonly leftVentricleMl: number;
  };
  readonly pressuresMmHg: {
    readonly la: number;
    readonly lv: number;
  };
  readonly flowsMlPerSec: { readonly mv: number };
  readonly freeCalciumUm: { readonly la: number };
  readonly wallReadback: {
    readonly la: {
      readonly totalStrain: number;
      readonly midpointFreeCalciumUm: number;
      readonly totalStressKPa: number;
      readonly seriesTensionKPa: number;
      readonly passiveStressKPa: number;
      readonly slsOverstressKPa: number;
      readonly forceVelocityFactor: number;
    };
  };
  readonly acceptedDynamicState: {
    readonly walls: {
      readonly leftAtrium: Pr467LaAcceptedHistorySampleV1["sourceAcceptedHillState"];
    };
  };
};

type SourceReport = {
  readonly status: "pass" | "fail";
  readonly failureReason: string | null;
  readonly dtSec: number;
  readonly parameterSnapshot: {
    readonly atria: {
      readonly left: {
        readonly geometry: Pr467LaAcceptedHistoryV1["geometry"];
        readonly material: Pr467LaAcceptedHistoryV1["sourceHillMaterial"];
      };
    };
  };
  readonly samples: readonly SourceReportSample[];
  readonly normalizedSha256: string;
};

export type Pr467LaAcceptedHistoryActiveReplayArtifactV1 = ReturnType<
  typeof writePr467LaAcceptedHistoryActiveReplayV1
>;

export function writePr467LaAcceptedHistoryActiveReplayV1(
  destinationPath = defaultOutputPath,
) {
  const histories = CANDIDATE_IDS.map(loadHistory);
  const results = histories.map(replayPr467LaAcceptedHistoryV1);
  const body = Object.freeze({
    artifactId: PR467_LA_ACCEPTED_HISTORY_ACTIVE_REPLAY_ARTIFACT_ID_V1,
    benchId: PR467_LA_ACCEPTED_HISTORY_ACTIVE_REPLAY_BENCH_ID_V1,
    statusScope: "component-replay-structural-numerical-only" as const,
    status: results.every((result) => result.status === "pass")
      ? "pass" as const
      : "fail" as const,
    claim: PR467_LA_ACCEPTED_HISTORY_ACTIVE_REPLAY_CLAIM_V1,
    protocol: Object.freeze({
      candidateHistories: CANDIDATE_IDS,
      retainedSourceHistory:
        "two-complete-beats-plus-following-cycle-boundary" as const,
      analyzedTrace:
        "second-complete-beat-plus-closing-cycle-boundary" as const,
      sourceHistorySampling: "every-accepted-step-endpoint" as const,
      sourceDtSec: 0.005,
      landInitialization:
        "analytic-isometric-steady-state-at-first-retained-source-sample" as const,
      sourceHillInitialization:
        "exact-first-retained-accepted-wall-state" as const,
      closedLoopRerunPerformed: false as const,
      automaticWinnerSelection: false as const,
      physiologyGateApplied: false as const,
    }),
    provenance: Object.freeze({
      implementationSha256: hashFiles(IMPLEMENTATION_SOURCE_PATHS),
      harnessSha256: hashFiles(HARNESS_SOURCE_PATHS),
      implementationSourcePaths: IMPLEMENTATION_SOURCE_PATHS,
      harnessSourcePaths: HARNESS_SOURCE_PATHS,
      sourceFixtures: histories.map((history) => Object.freeze({
        candidateId: history.candidateId,
        sourceArtifactPath: history.sourceArtifactPath,
        sourceNormalizedSha256: history.sourceNormalizedSha256,
        sourceCompressedSha256: history.sourceCompressedSha256,
        sampleCount: history.samples.length,
      })),
    }),
    results,
    interpretationBoundary: Object.freeze({
      establishesLandClosedLoopBehavior: false as const,
      establishesNormalHumanAtrialPhysiology: false as const,
      establishesPatientFit: false as const,
      permissibleUse:
        "verify-state-and-work-mapping-on-real-pr467-accepted-input-histories-before-new-version-closed-loop-integration" as const,
    }),
  });
  const artifact = Object.freeze({
    ...body,
    normalizedSha256: sha256Json(body),
  });
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = `${destinationPath}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, `${JSON.stringify(artifact, null, 2)}\n`);
  renameSync(temporaryPath, destinationPath);
  return artifact;
}

export function pr467LaAcceptedHistoryActiveReplayCliExitCodeV1(
  artifact: Pr467LaAcceptedHistoryActiveReplayArtifactV1,
): 0 | 1 {
  return artifact.status === "pass" ? 0 : 1;
}

function loadHistory(
  candidateId: Pr467LaAcceptedHistoryCandidateIdV1,
): Pr467LaAcceptedHistoryV1 {
  const absolutePath = resolve(
    repoRoot,
    `data/mechanics2/reports/no-avpd-atrial-thin-filament-sls-matrix-v1/candidates/${candidateId}.json.gz`,
  );
  const compressed = readFileSync(absolutePath);
  const plain = gunzipSync(compressed);
  const report = JSON.parse(plain.toString("utf8")) as SourceReport;
  validateSourceReport(report, candidateId);
  const samples = report.samples.map((sample) => Object.freeze({
    timeSec: sample.timeSec,
    beatIndex: sample.beatIndex,
    phase01: sample.phase01,
    laVolumeMl: sample.volumesMl.leftAtriumMl,
    lvVolumeMl: sample.volumesMl.leftVentricleMl,
    laPressureMmHg: sample.pressuresMmHg.la,
    lvPressureMmHg: sample.pressuresMmHg.lv,
    mitralFlowMlPerSec: sample.flowsMlPerSec.mv,
    freeCalciumUm: sample.freeCalciumUm.la,
    midpointFreeCalciumUm: sample.wallReadback.la.midpointFreeCalciumUm,
    totalFiberLogStrain: sample.wallReadback.la.totalStrain,
    sourceAcceptedHillState: Object.freeze({
      ...sample.acceptedDynamicState.walls.leftAtrium,
    }),
    sourceHillTotalStressPa: sample.wallReadback.la.totalStressKPa * 1_000,
    sourceHillActiveStressPa:
      sample.wallReadback.la.seriesTensionKPa * 1_000,
    sourceHillPassiveStressPa:
      sample.wallReadback.la.passiveStressKPa * 1_000,
    sourceHillSlsOverstressPa:
      sample.wallReadback.la.slsOverstressKPa * 1_000,
    sourceHillForceVelocityFactor:
      sample.wallReadback.la.forceVelocityFactor,
  }));
  return Object.freeze({
    candidateId,
    sourceArtifactPath: relativeRepoPath(absolutePath),
    sourceNormalizedSha256: report.normalizedSha256,
    sourceCompressedSha256: sha256Bytes(compressed),
    dtSec: report.dtSec,
    geometry: Object.freeze({ ...report.parameterSnapshot.atria.left.geometry }),
    sourceHillMaterial: report.parameterSnapshot.atria.left.material,
    samples: Object.freeze(samples),
  });
}

function validateSourceReport(
  report: SourceReport,
  candidateId: Pr467LaAcceptedHistoryCandidateIdV1,
): void {
  if (report.status !== "pass") {
    throw new Error(
      `source candidate ${candidateId} is not structurally accepted: ${report.failureReason}`,
    );
  }
  const { normalizedSha256, ...body } = report;
  if (sha256Json(body) !== normalizedSha256) {
    throw new Error(`source normalized hash mismatch: ${candidateId}`);
  }
  if (report.dtSec !== 0.005 || report.samples.length !== 401) {
    throw new Error(`unexpected retained history protocol: ${candidateId}`);
  }
}

function hashFiles(paths: readonly string[]): string {
  const hash = createHash("sha256");
  for (const relativePath of paths) {
    hash.update(relativePath);
    hash.update("\0");
    hash.update(readFileSync(resolve(repoRoot, relativePath)));
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

function relativeRepoPath(absolutePath: string): string {
  return absolutePath.startsWith(`${repoRoot}/`)
    ? absolutePath.slice(repoRoot.length + 1)
    : absolutePath;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const artifact = writePr467LaAcceptedHistoryActiveReplayV1();
  console.log(JSON.stringify({
    artifactId: artifact.artifactId,
    status: artifact.status,
    normalizedSha256: artifact.normalizedSha256,
    outputPath: relativeRepoPath(defaultOutputPath),
    candidates: artifact.results.map((result) => ({
      candidateId: result.candidateId,
      status: result.status,
      hillClosurePa:
        result.diagnostics.maximumAbsoluteHillTotalStressClosurePa,
      landPeakPhase01: result.summary.landPeakPhase01,
      hillPeakPhase01: result.summary.sourceHillPeakPhase01,
      landToHillPeakActiveStressRatio:
        result.summary.landToHillPeakActiveStressRatio,
    })),
  }, null, 2));
  process.exitCode = pr467LaAcceptedHistoryActiveReplayCliExitCodeV1(artifact);
}
