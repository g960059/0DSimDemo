import { readFile } from "node:fs/promises";

import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  verifyOfficialHealthyPeriodicPresetBundleAssetsV1,
} from "@/engine/scientific/presets";
import {
  restoreMainWireScientificSessionExactV2,
} from "@/engine/scientific/runtime";

const [release, catalogRawJson, presetRawJson, checkpointRawJson] =
  await Promise.all([
    loadMainWireAdultFiveWallNonCoronaryReleaseV1(),
    readFile(new URL("../../data/scientific/presets/catalog-v1.json", import.meta.url), "utf8"),
    readFile(new URL("../../data/scientific/presets/official-healthy-periodic-v1.json", import.meta.url), "utf8"),
    readFile(new URL("../../data/scientific/checkpoints/0.2.0/normal-adult-periodic-steady-v1.json", import.meta.url), "utf8"),
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
const sourceIdentity = session.stateIdentity();

const guytonStartedMs = performance.now();
const guyton = session.runGuytonStarlingProtocolV1();
const guytonCompletedMs = performance.now();

console.log(JSON.stringify({
  benchmarkId: "main-wire-scientific-guyton-starling-v1-wall-clock-smoke",
  role: "measurement-and-protocol-QC-only-no-performance-acceptance-claim",
  sourceIdentity,
  finalSourceIdentity: session.stateIdentity(),
  sourceSessionUnchanged:
    JSON.stringify(sourceIdentity) === JSON.stringify(session.stateIdentity()),
  wallClockMs: {
    guytonStarling: guytonCompletedMs - guytonStartedMs,
    total: guytonCompletedMs - guytonStartedMs,
  },
  guytonStarling: {
    baselinePeriodicity: guyton.baselinePeriodicity,
    preloadPointCount: guyton.preloadOperatingPoints.length,
    p1PointCount: guyton.preloadOperatingLocus.p1Points.length,
    p2PointCount: guyton.preloadOperatingLocus.period2Points.length,
    failedPointCount: guyton.preloadOperatingLocus.failedPoints.length,
    points: guyton.preloadOperatingPoints.map((point) => ({
      targetScale: point.targetScale,
      status: point.status,
      completedBeatCount: point.completedBeatCount,
      rapTransmuralMmHg: point.meanRapTransmuralMmHg,
      lapTransmuralMmHg: point.meanLapTransmuralMmHg,
      cardiacOutputLMin: point.netCardiacOutputLMin,
      latestPeriod1MaximumNormalizedDelta:
        point.latestPeriod1MaximumNormalizedDelta,
      latestPeriod2MaximumNormalizedDelta:
        point.latestPeriod2MaximumNormalizedDelta,
      failureReason: point.failureReason,
    })),
  },
}, null, 2));
