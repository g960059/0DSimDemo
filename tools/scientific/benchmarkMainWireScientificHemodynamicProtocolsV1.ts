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
const selectedProtocol = process.argv.find((argument) =>
  argument.startsWith("--protocol="))?.slice("--protocol=".length) ?? "both";
if (!["both", "guyton-starling", "pv-relations"].includes(selectedProtocol)) {
  throw new Error("--protocol must be both, guyton-starling, or pv-relations");
}

const guytonStartedMs = performance.now();
const guyton = selectedProtocol === "pv-relations"
  ? null
  : session.runGuytonStarlingProtocolV1();
const guytonCompletedMs = performance.now();
const pvRelations = selectedProtocol === "guyton-starling"
  ? null
  : session.runPvRelationsProtocolV1();
const pvRelationsCompletedMs = performance.now();

console.log(JSON.stringify({
  benchmarkId: "main-wire-scientific-hemodynamic-protocols-v1-wall-clock-smoke",
  role: "measurement-and-protocol-QC-only-no-performance-acceptance-claim",
  sourceIdentity,
  finalSourceIdentity: session.stateIdentity(),
  sourceSessionUnchanged:
    JSON.stringify(sourceIdentity) === JSON.stringify(session.stateIdentity()),
  wallClockMs: {
    guytonStarling: guyton === null ? null : guytonCompletedMs - guytonStartedMs,
    pvRelations: pvRelations === null ? null : pvRelationsCompletedMs - guytonCompletedMs,
    total: pvRelationsCompletedMs - guytonStartedMs,
  },
  guytonStarling: {
    baselinePeriodicity: guyton?.baselinePeriodicity ?? null,
    preloadPointCount: guyton?.preloadOperatingPoints.length ?? null,
    p1PointCount: guyton?.preloadOperatingLocus.p1Points.length ?? null,
    p2PointCount: guyton?.preloadOperatingLocus.period2Points.length ?? null,
    failedPointCount: guyton?.preloadOperatingLocus.failedPoints.length ?? null,
    points: guyton?.preloadOperatingPoints.map((point) => ({
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
    })) ?? [],
  },
  pvRelations: {
    baselinePeriodicity: pvRelations?.baselinePeriodicity ?? null,
    beatCount: pvRelations?.rampBeats.length ?? null,
    beatClassifications: pvRelations?.rampBeats.map((beat) => ({
      beatIndex: beat.beatIndex,
      resistanceScale: beat.vcRaResistanceScaleEnd,
      classification: beat.classification,
      valid: beat.valid,
      edvMl: beat.endDiastolic?.volumeMl ?? null,
      edpTransmuralMmHg:
        beat.endDiastolic?.pressureTransmuralMmHg ?? null,
      esvMl: beat.endSystolic?.volumeMl ?? null,
      espTransmuralMmHg:
        beat.endSystolic?.pressureTransmuralMmHg ?? null,
      strokeWorkMmHgMl: beat.strokeWorkMmHgMl,
      rejectionReason: beat.rejectionReason,
    })) ?? [],
    fitStatus: pvRelations === null ? null : {
      espvr: pvRelations.analysis.espvr.status,
      edpvr: pvRelations.analysis.edpvr.status,
      prsw: pvRelations.analysis.prsw.status,
    },
    fitReadback: pvRelations === null ? null : {
      edpvrReference: pvRelations.edpvrReference,
      espvr: pvRelations.analysis.espvr.fit,
      edpvr: pvRelations.analysis.edpvr.fit,
      prsw: pvRelations.analysis.prsw.fit,
      espvrRejectReasons: pvRelations.analysis.espvr.rejectReasons,
    },
    recovery: pvRelations?.recovery ?? null,
  },
}, null, 2));
