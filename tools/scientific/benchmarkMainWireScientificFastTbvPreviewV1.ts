import { readFile } from "node:fs/promises";

import {
  checkpointMainWireFiveWallNonCoronaryV1,
  restoreMainWireFiveWallNonCoronaryV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import { createCanonicalMainWireNormalAdultFiveWallProviderV1 } from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import { loadMainWireAdultFiveWallNonCoronaryReleaseV1 } from "@/engine/scientific/assembly";
import { mainWireScientificHemodynamicJobSourceFingerprintV2 } from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import { createMainWireScientificFastTbvPreviewTargetsV1 } from "@/engine/scientific/protocols/MainWireScientificFastTbvPreviewV1";
import {
  estimateMainWireScientificFastTbvPreviewPointV1,
  prepareMainWireScientificGuytonStarlingBaselineV2,
  settleMainWireScientificContinuationPreloadPointV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicProtocolV1";
import { verifyOfficialHealthyPeriodicPresetBundleAssetsV1 } from "@/engine/scientific/presets";
import { restoreMainWireScientificSessionExactV2 } from "@/engine/scientific/runtime";

const [release, catalogRawJson, presetRawJson, checkpointRawJson] =
  await Promise.all([
    loadMainWireAdultFiveWallNonCoronaryReleaseV1(),
    readFile(
      new URL("../../data/scientific/presets/catalog-v1.json", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../../data/scientific/presets/official-healthy-periodic-v1.json",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../../data/scientific/checkpoints/0.2.0/normal-adult-periodic-steady-v1.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
const preset = await verifyOfficialHealthyPeriodicPresetBundleAssetsV1(
  {
    presetId: "circleheart/official-healthy-periodic",
    presetVersion: "1.0.0",
  },
  release,
  { catalogRawJson, presetRawJson, checkpointRawJson },
);
const session = await restoreMainWireScientificSessionExactV2(
  preset.release,
  preset.checkpoint,
);
const sourceSessionIdentity = session.stateIdentity();
const capsule = session.createHemodynamicJobCapsuleV2();
const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1("on");
const sourceState = restoreMainWireFiveWallNonCoronaryV1(
  provider,
  capsule.transactionCheckpoint,
);
const dependencies = Object.freeze({
  provider,
  runtime: capsule.runtime,
  pericardium: capsule.pericardium,
  calciumDriveParams: capsule.calciumDriveParams,
});
const baselineStartedMs = performance.now();
const baseline = prepareMainWireScientificGuytonStarlingBaselineV2(
  dependencies,
  sourceState,
);
const baselineWallClockMs = performance.now() - baselineStartedMs;
const targets = createMainWireScientificFastTbvPreviewTargetsV1(
  baseline.source.fixedTotalBloodVolumeMl,
);
const sourceFingerprint =
  await mainWireScientificHemodynamicJobSourceFingerprintV2(
    Object.freeze({
      ...capsule,
      source: baseline.source,
      transactionCheckpoint: checkpointMainWireFiveWallNonCoronaryV1(
        provider,
        baseline.continuationSeedState,
      ),
    }),
  );
const settledScaleArgument = process.argv
  .find((argument) => argument.startsWith("--compare-settled="))
  ?.slice("--compare-settled=".length);
if (settledScaleArgument !== undefined) {
  const targetScale = Number(settledScaleArgument);
  if (!(targetScale > 0) || !Number.isFinite(targetScale)) {
    throw new Error("--compare-settled scale must be positive and finite");
  }
  const target = Object.freeze({
    targetId: `benchmark-fast-vs-settled-${targetScale}`,
    lane:
      targetScale < 1 ? ("lower-volume" as const) : ("higher-volume" as const),
    targetOrdinal: 1,
    targetScale,
    totalBloodVolumeMl: baseline.source.fixedTotalBloodVolumeMl * targetScale,
  });
  const fastStartedMs = performance.now();
  const fast = estimateMainWireScientificFastTbvPreviewPointV1(
    dependencies,
    baseline.continuationSeedState,
    target,
    sourceFingerprint,
  );
  const fastWallClockMs = performance.now() - fastStartedMs;
  const settledStartedMs = performance.now();
  const settled = settleMainWireScientificContinuationPreloadPointV2(
    dependencies,
    baseline.continuationSeedState,
    target.totalBloodVolumeMl,
    targetScale,
  );
  const settledWallClockMs = performance.now() - settledStartedMs;
  const fastObservation =
    "observation" in fast.evidence ? fast.evidence.observation : null;
  console.log(
    JSON.stringify(
      {
        benchmarkId: "main-wire-fast-vs-settled-tbv-point-v1",
        targetScale,
        baselineWallClockMs,
        fastWallClockMs,
        settledWallClockMs,
        speedup: settledWallClockMs / fastWallClockMs,
        fast: {
          evidenceClass: fast.evidence.evidenceClass,
          period1Residual:
            "closure" in fast.evidence
              ? fast.evidence.closure.latestPeriod1MaximumNormalizedDelta
              : null,
          rap: fastObservation?.meanRapTransmuralMmHg ?? null,
          lap: fastObservation?.meanLapTransmuralMmHg ?? null,
          cardiacOutput: fastObservation?.netCardiacOutputLMin ?? null,
        },
        settled: {
          status: settled.point.status,
          completedBeatCount: settled.point.completedBeatCount,
          rap: settled.point.meanRapTransmuralMmHg,
          lap: settled.point.meanLapTransmuralMmHg,
          cardiacOutput: settled.point.netCardiacOutputLMin,
        },
        absoluteErrors:
          fastObservation === null
            ? null
            : {
                rapMmHg:
                  settled.point.meanRapTransmuralMmHg === null
                    ? null
                    : Math.abs(
                        fastObservation.meanRapTransmuralMmHg -
                          settled.point.meanRapTransmuralMmHg,
                      ),
                lapMmHg:
                  settled.point.meanLapTransmuralMmHg === null
                    ? null
                    : Math.abs(
                        fastObservation.meanLapTransmuralMmHg -
                          settled.point.meanLapTransmuralMmHg,
                      ),
                cardiacOutputLMin:
                  settled.point.netCardiacOutputLMin === null
                    ? null
                    : Math.abs(
                        fastObservation.netCardiacOutputLMin -
                          settled.point.netCardiacOutputLMin,
                      ),
              },
      },
      null,
      2,
    ),
  );
  process.exit(0);
}
const initializerArgument =
  process.argv
    .find((argument) => argument.startsWith("--initializer="))
    ?.slice("--initializer=".length) ?? "adaptive-provisional-secant";
if (
  initializerArgument !== "adaptive-provisional-secant" &&
  initializerArgument !== "vascular-compliance-projection" &&
  initializerArgument !== "shared-sv-vc-pressure-offset"
)
  throw new Error("unknown --initializer strategy");

const laneResults = [];
for (const lane of ["lower-volume", "higher-volume"] as const) {
  const startedMs = performance.now();
  const points = [];
  let previewState = baseline.continuationSeedState;
  let previousPreviewState = null as typeof previewState | null;
  let sourceEvidenceId = "source-period1-baseline";
  for (const target of targets[lane]) {
    const pointStartedMs = performance.now();
    const sourceState = previewState;
    const evaluated = estimateMainWireScientificFastTbvPreviewPointV1(
      dependencies,
      previewState,
      target,
      sourceFingerprint,
      sourceEvidenceId,
      initializerArgument,
      previousPreviewState,
    );
    const evidence = evaluated.evidence;
    if (evaluated.terminalState !== null) {
      previousPreviewState = sourceState;
      previewState = evaluated.terminalState;
      sourceEvidenceId = evidence.evidenceId;
    }
    points.push({
      targetScale: target.targetScale,
      wallClockMs: performance.now() - pointStartedMs,
      evidenceClass: evidence.evidenceClass,
      rapidFiniteHoldLocus: evidence.eligibility.rapidFiniteHoldLocus,
      initializer: evidence.acquisition.initializer?.kind ?? null,
      fallbackUsed: evidence.acquisition.initializer?.fallbackUsed ?? null,
      period1Residual:
        "closure" in evidence
          ? evidence.closure.latestPeriod1MaximumNormalizedDelta
          : null,
      residualRatio:
        "closure" in evidence ? evidence.closure.residualRatio : null,
      rapTransmuralMmHg:
        "observation" in evidence
          ? evidence.observation.meanRapTransmuralMmHg
          : null,
      lapTransmuralMmHg:
        "observation" in evidence
          ? evidence.observation.meanLapTransmuralMmHg
          : null,
      cardiacOutputLMin:
        "observation" in evidence
          ? evidence.observation.netCardiacOutputLMin
          : null,
      reason:
        evidence.evidenceClass === "failure" ||
        evidence.evidenceClass === "finite-hold-unclassified"
          ? evidence.reason
          : null,
    });
  }
  laneResults.push({
    lane,
    wallClockMs: performance.now() - startedMs,
    points,
  });
}

console.log(
  JSON.stringify(
    {
      benchmarkId: "main-wire-scientific-fast-tbv-preview-v1",
      role: "wall-clock-and-residual-characterization-no-performance-acceptance-claim",
      sourceIdentity: session.stateIdentity(),
      sourceSessionUnchanged:
        JSON.stringify(session.stateIdentity()) ===
        JSON.stringify(sourceSessionIdentity),
      baselinePeriodicity: baseline.baselinePeriodicity,
      initializationStrategy: initializerArgument,
      baselineWallClockMs,
      laneResults,
      projectedTwoWorkerWallClockMs:
        baselineWallClockMs +
        Math.max(...laneResults.map(({ wallClockMs }) => wallClockMs)),
    },
    null,
    2,
  ),
);
