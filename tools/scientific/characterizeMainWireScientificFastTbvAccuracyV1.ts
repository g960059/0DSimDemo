import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  checkpointMainWireFiveWallNonCoronaryV1,
  restoreMainWireFiveWallNonCoronaryV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import { createCanonicalMainWireNormalAdultFiveWallProviderV1 } from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import { loadMainWireAdultFiveWallNonCoronaryReleaseV1 } from "@/engine/scientific/assembly";
import { createMainWireScientificFastTbvPreviewTargetsV1 } from "@/engine/scientific/protocols/MainWireScientificFastTbvPreviewV1";
import {
  type MainWireScientificPreloadOperatingPointV1,
  estimateMainWireScientificFastTbvPreviewPointV1,
  prepareMainWireScientificGuytonStarlingBaselineV2,
  refineMainWireScientificFastTbvPreviewPointV1,
  settleMainWireScientificContinuationPreloadPointV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicProtocolV1";
import { mainWireScientificHemodynamicJobSourceFingerprintV2 } from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import {
  buildMainWireScientificTbvAccuracyCharacterizationV1,
  type MainWireScientificTbvAccuracyObservationV1,
  type MainWireScientificTbvAccuracyPairInputV1,
} from "@/engine/scientific/protocols/MainWireScientificTbvAccuracyCharacterizationV1";
import { verifyOfficialHealthyPeriodicPresetBundleAssetsV1 } from "@/engine/scientific/presets";
import { restoreMainWireScientificSessionExactV2 } from "@/engine/scientific/runtime";

const requestedRapidNaturalBeatCount = rapidNaturalBeatCountFromArguments();
const benchmarkStartedMs = performance.now();
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
if (baseline.baselinePeriodicity !== "period1-converged") {
  throw new Error(
    `paired TBV accuracy characterization requires a canonical P1 baseline; received ${baseline.baselinePeriodicity}`,
  );
}
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

const pairs: MainWireScientificTbvAccuracyPairInputV1[] = [];
for (const lane of ["lower-volume", "higher-volume"] as const) {
  let rapidCurrentState = baseline.continuationSeedState;
  let rapidPreviousState: typeof rapidCurrentState | null = null;
  let rapidSourceEvidenceId = "source-period1-baseline";
  let canonicalCurrentP1State = baseline.continuationSeedState;
  let canonicalPreviousP1State: typeof canonicalCurrentP1State | null = null;

  for (const target of targets[lane]) {
    const rapidSourceState = rapidCurrentState;
    const rapidStartedMs = performance.now();
    const initialRapidResult = estimateMainWireScientificFastTbvPreviewPointV1(
      dependencies,
      rapidCurrentState,
      target,
      sourceFingerprint,
      rapidSourceEvidenceId,
      "adaptive-provisional-secant",
      rapidPreviousState,
    );
    let rapidEvidence = initialRapidResult.evidence;
    let rapidTerminalState = initialRapidResult.terminalState;
    const initialRapidTerminalState = initialRapidResult.terminalState;
    for (
      let requestedBeat = 3;
      requestedBeat <= requestedRapidNaturalBeatCount;
      requestedBeat += 1
    ) {
      if (
        rapidTerminalState === null
        || rapidEvidence.evidenceClass === "failure"
      ) break;
      const refined = refineMainWireScientificFastTbvPreviewPointV1(
        dependencies,
        rapidTerminalState,
        rapidEvidence,
      );
      // Match production fail-soft semantics: an optional refinement failure
      // stops refinement but never destroys the last valid emitted estimate.
      if (
        refined.terminalState === null
        || refined.evidence.evidenceClass === "failure"
      ) break;
      rapidEvidence = refined.evidence;
      rapidTerminalState = refined.terminalState;
    }
    const rapidWallClockMs = performance.now() - rapidStartedMs;
    // The next target in a lane deliberately continues from the initial
    // two-beat cursor. Later same-target refinements are presentation/accuracy
    // updates and must not retroactively change the already-streamed lane.
    if (initialRapidTerminalState !== null) {
      rapidPreviousState = rapidSourceState;
      rapidCurrentState = initialRapidTerminalState;
      rapidSourceEvidenceId = initialRapidResult.evidence.evidenceId;
    }

    const canonicalSeedState = canonicalCurrentP1State;
    const canonicalStartedMs = performance.now();
    const canonicalResult = settleMainWireScientificContinuationPreloadPointV2(
      dependencies,
      canonicalSeedState,
      target.totalBloodVolumeMl,
      target.targetScale,
      { previousPeriod1SeedState: canonicalPreviousP1State },
    );
    const canonicalWallClockMs = performance.now() - canonicalStartedMs;
    if (canonicalResult.continuationSeedState !== null) {
      canonicalPreviousP1State = canonicalSeedState;
      canonicalCurrentP1State = canonicalResult.continuationSeedState;
    }

    const rapidObservation =
      rapidEvidence.evidenceClass === "failure"
        ? null
        : observationFromRapid(rapidEvidence.observation);
    pairs.push(
      Object.freeze({
        pairId: `rapid-vs-canonical-${target.targetId}`,
        targetId: target.targetId,
        lane,
        targetOrdinal: target.targetOrdinal,
        targetScale: target.targetScale,
        fixedTotalBloodVolumeMl: target.totalBloodVolumeMl,
        rapid: Object.freeze({
          evidenceClass: rapidEvidence.evidenceClass,
          completedNaturalBeatCount:
            rapidEvidence.acquisition.completedNaturalBeatCountAfterPrediction,
          wallClockMs: rapidWallClockMs,
          latestPeriod1MaximumNormalizedDelta:
            rapidEvidence.evidenceClass === "failure"
              ? null
              : rapidEvidence.closure.latestPeriod1MaximumNormalizedDelta,
          failureReason:
            rapidEvidence.evidenceClass === "failure" ||
            rapidEvidence.evidenceClass === "finite-hold-unclassified"
              ? rapidEvidence.reason
              : null,
          observation: rapidObservation,
        }),
        canonical: Object.freeze({
          status: canonicalResult.point.status,
          acceptedForPeriod1Locus:
            canonicalResult.point.acceptedForPeriod1Locus,
          completedBeatCount: canonicalResult.point.completedBeatCount,
          wallClockMs: canonicalWallClockMs,
          latestPeriod1MaximumNormalizedDelta:
            canonicalResult.point.latestPeriod1MaximumNormalizedDelta,
          latestPeriod2MaximumNormalizedDelta:
            canonicalResult.point.latestPeriod2MaximumNormalizedDelta,
          failureReason: canonicalResult.point.failureReason,
          observation: observationFromCanonical(canonicalResult.point),
        }),
      }),
    );
  }
}

const report = buildMainWireScientificTbvAccuracyCharacterizationV1({
  sourceFingerprint,
  sourceSessionUnchanged:
    JSON.stringify(session.stateIdentity()) ===
    JSON.stringify(sourceSessionIdentity),
  benchmarkWallClockMs: performance.now() - benchmarkStartedMs,
  baseline: Object.freeze({
    role: "canonical-source-baseline-reference" as const,
    targetScale: 1 as const,
    fixedTotalBloodVolumeMl: baseline.source.fixedTotalBloodVolumeMl,
    canonicalStatus: "period1-converged" as const,
    completedBeatCount: baseline.baselinePoint.completedBeatCount,
    wallClockMs: baselineWallClockMs,
    observation: observationFromCanonical(baseline.baselinePoint),
  }),
  pairs,
});

const json = `${JSON.stringify(report, null, 2)}\n`;
const outputArgument = process.argv
  .find((argument) => argument.startsWith("--output="))
  ?.slice("--output=".length);
if (outputArgument) {
  const outputPath = resolve(process.cwd(), outputArgument);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, json, "utf8");
  console.error(`wrote ${outputPath}`);
}
process.stdout.write(json);

function rapidNaturalBeatCountFromArguments(): 2 | 3 | 4 | 5 {
  const raw = process.argv
    .find((argument) => argument.startsWith("--rapid-beats="))
    ?.slice("--rapid-beats=".length);
  if (raw === undefined) return 2;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 2 || parsed > 5) {
    throw new Error("--rapid-beats must be an integer from 2 through 5");
  }
  return parsed as 2 | 3 | 4 | 5;
}

function observationFromRapid(
  observation: Readonly<{
    meanRapTransmuralMmHg: number;
    meanLapTransmuralMmHg: number;
    netCardiacOutputLMin: number;
    forwardCardiacOutputLMin: number;
    lvPressureVolume: Readonly<{
      endDiastolicVolumeMl: number;
      endDiastolicTransmuralPressureMmHg: number;
      endSystolicVolumeMl: number;
      endSystolicTransmuralPressureMmHg: number;
      strokeWorkMmHgMl: number;
    }> | null;
  }>,
): MainWireScientificTbvAccuracyObservationV1 {
  return Object.freeze({
    "mean-rap-transmural": observation.meanRapTransmuralMmHg,
    "mean-lap-transmural": observation.meanLapTransmuralMmHg,
    "net-cardiac-output": observation.netCardiacOutputLMin,
    "forward-cardiac-output": observation.forwardCardiacOutputLMin,
    "lv-end-diastolic-volume":
      observation.lvPressureVolume?.endDiastolicVolumeMl ?? null,
    "lv-end-diastolic-transmural-pressure":
      observation.lvPressureVolume?.endDiastolicTransmuralPressureMmHg ?? null,
    "lv-end-systolic-volume":
      observation.lvPressureVolume?.endSystolicVolumeMl ?? null,
    "lv-end-systolic-transmural-pressure":
      observation.lvPressureVolume?.endSystolicTransmuralPressureMmHg ?? null,
    "lv-stroke-work": observation.lvPressureVolume?.strokeWorkMmHgMl ?? null,
  });
}

function observationFromCanonical(
  point: MainWireScientificPreloadOperatingPointV1,
): MainWireScientificTbvAccuracyObservationV1 {
  return Object.freeze({
    "mean-rap-transmural": point.meanRapTransmuralMmHg,
    "mean-lap-transmural": point.meanLapTransmuralMmHg,
    "net-cardiac-output": point.netCardiacOutputLMin,
    "forward-cardiac-output": point.forwardCardiacOutputLMin,
    "lv-end-diastolic-volume": point.lvEndDiastolicVolumeMl,
    "lv-end-diastolic-transmural-pressure":
      point.lvPressureVolumeObservation?.endDiastolic
        .transmuralPressureMmHg ?? null,
    "lv-end-systolic-volume": point.lvEndSystolicVolumeMl,
    "lv-end-systolic-transmural-pressure":
      point.lvPressureVolumeObservation?.endSystolic
        .transmuralPressureMmHg ?? null,
    "lv-stroke-work": point.lvStrokeWorkMmHgMl,
  });
}
