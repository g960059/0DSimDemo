import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_PARAMS } from "@/constants";
import type { StarlingSweepRequest } from "@/engine/guytonStarling";
import { buildWorkerBaseline, settleWorkerCore } from "@/engine/guytonStarlingWorkerCore";
import type { SerializedModelState } from "@/engine/stateContract";

type DebugOptions = {
  outDir: string;
  targetVolumeMl: number;
  deltasMl: number[];
};

type DebugPoint = {
  deltaVolumeMl: number;
  targetVolumeMl: number;
  seededFromDeltaMl: number | null;
  wallMs: number;
  settle: {
    settled: boolean;
    reason: string;
    periodBeats: 1 | 2;
    periodDelta: number;
    adjacentDelta: number;
    worstSignal: string | null;
    worstDelta: number;
    beats: number;
    actualSeconds: number | null;
  };
  health: {
    status: string;
    clampHitCount: number;
    leftRightFlowMismatchLMin: number;
    cycleMetricDelta: number;
    messages: string[];
  };
  periodMetrics: {
    LAPMean: number;
    RAPMean: number;
    CO_L: number;
    CO_R: number;
    pulmonaryVenousReturnLMin: number;
    systemicVenousReturnLMin: number;
    SV_L: number;
    SV_R: number;
    LVEDPApprox: number;
    RVEDPApprox: number;
  };
  lastBeatMetrics: {
    LAPMean: number;
    RAPMean: number;
    CO_L: number;
    CO_R: number;
    pulmonaryVenousReturnLMin: number;
    systemicVenousReturnLMin: number;
  };
  valveVolumesMl: {
    MVReverse: number;
    AoVReverse: number;
    TVReverse: number;
    PVReverse: number;
    MVForward: number;
    AoVForward: number;
    TVForward: number;
    PVForward: number;
  };
  observables: {
    P_PVein: number;
    Pperi: number;
    Ppc: number;
    VLVeff: number;
    VRVeff: number;
    PLVfw: number;
    PVI_LV: number;
    septumShiftMl: number;
  };
};

type DebugReport = {
  schemaVersion: 1;
  generatedAt: string;
  measurementMode: string;
  targetVolumeMl: number;
  deltasMl: number[];
  points: DebugPoint[];
  summary: {
    pointCount: number;
    period2Count: number;
    maxAdjacentDelta: number;
    maxPeriodDelta: number;
    maxValveReverseMl: number;
    maxClampHitCount: number;
  };
};

const DEFAULT_OUT_DIR = path.join(
  "artifacts",
  "starling-low-preload-debug",
  new Date().toISOString().replace(/[:.]/g, "-"),
);

const DEFAULT_DELTAS = [0, -900, -1000, -1125, -1250, -1375, -1500, -1625];

const options = parseArgs(process.argv.slice(2));
mkdirSync(options.outDir, { recursive: true });

const report = runLowPreloadDebug(options);
writeFileSync(path.join(options.outDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(path.join(options.outDir, "report.md"), reportToMarkdown(report));

// eslint-disable-next-line no-console
console.log(`Wrote Starling low-preload debug report to ${options.outDir}`);
// eslint-disable-next-line no-console
console.log(
  `points=${report.summary.pointCount} period2=${report.summary.period2Count} ` +
  `maxAdjacentDelta=${round(report.summary.maxAdjacentDelta, 4)} maxReverseMl=${round(report.summary.maxValveReverseMl, 6)}`,
);

function runLowPreloadDebug(opts: DebugOptions): DebugReport {
  const req: StarlingSweepRequest = {
    requestId: "debug-starling-low-preload",
    signature: "debug-starling-low-preload",
    instanceId: "debug",
    params: DEFAULT_PARAMS,
    targetVolumeMl: opts.targetVolumeMl,
    deltasMl: opts.deltasMl,
    sweepMode: "adaptive",
  };
  const baseline = buildWorkerBaseline(req);
  const points: DebugPoint[] = [];
  let seedState: SerializedModelState | undefined = baseline.state;
  let seededFromDeltaMl = 0;
  for (const delta of opts.deltasMl) {
    const run = delta === 0
      ? baseline
      : settleWorkerCore(req, opts.targetVolumeMl + delta, seedState, { seededFromDeltaMl });
    const lastBeatMetrics = run.core.metrics({ windowBeats: 1 });
    points.push({
      deltaVolumeMl: delta,
      targetVolumeMl: opts.targetVolumeMl + delta,
      seededFromDeltaMl: delta === 0 ? null : seededFromDeltaMl,
      wallMs: run.wallMs,
      settle: {
        settled: run.settle.settled,
        reason: run.settle.reason,
        periodBeats: run.settle.periodBeats ?? 1,
        periodDelta: run.settle.periodDelta,
        adjacentDelta: run.settle.adjacentDelta,
        worstSignal: run.settle.worstSignal,
        worstDelta: run.settle.worstDelta,
        beats: run.settle.beats,
        actualSeconds: run.settle.actualSeconds ?? null,
      },
      health: {
        status: run.health.status,
        clampHitCount: run.health.clampHitCount,
        leftRightFlowMismatchLMin: run.health.leftRightFlowMismatchLMin,
        cycleMetricDelta: run.health.cycleMetricDelta,
        messages: run.health.messages,
      },
      periodMetrics: {
        LAPMean: run.metrics.LAPMean,
        RAPMean: run.metrics.RAPMean,
        CO_L: run.metrics.CO_L,
        CO_R: run.metrics.CO_R,
        pulmonaryVenousReturnLMin: run.metrics.pulmonaryVenousReturnLMin,
        systemicVenousReturnLMin: run.metrics.systemicVenousReturnLMin,
        SV_L: run.metrics.SV_L,
        SV_R: run.metrics.SV_R,
        LVEDPApprox: run.metrics.LVEDPApprox,
        RVEDPApprox: run.metrics.RVEDPApprox,
      },
      lastBeatMetrics: {
        LAPMean: lastBeatMetrics.LAPMean,
        RAPMean: lastBeatMetrics.RAPMean,
        CO_L: lastBeatMetrics.CO_L,
        CO_R: lastBeatMetrics.CO_R,
        pulmonaryVenousReturnLMin: lastBeatMetrics.pulmonaryVenousReturnLMin,
        systemicVenousReturnLMin: lastBeatMetrics.systemicVenousReturnLMin,
      },
      valveVolumesMl: {
        MVReverse: run.metrics.MVReverseVolumeMl,
        AoVReverse: run.metrics.AoVReverseVolumeMl,
        TVReverse: run.metrics.TVReverseVolumeMl,
        PVReverse: run.metrics.PVReverseVolumeMl,
        MVForward: run.metrics.MVForwardVolumeMl,
        AoVForward: run.metrics.AoVForwardVolumeMl,
        TVForward: run.metrics.TVForwardVolumeMl,
        PVForward: run.metrics.PVForwardVolumeMl,
      },
      observables: {
        P_PVein: run.observables.P_PVein,
        Pperi: run.observables.Pperi,
        Ppc: run.observables.Ppc,
        VLVeff: run.observables.VLVeff,
        VRVeff: run.observables.VRVeff,
        PLVfw: run.observables.PLVfw,
        PVI_LV: run.observables.PVI_LV,
        septumShiftMl: run.observables.septumShiftMl,
      },
    });
    seedState = run.state;
    seededFromDeltaMl = delta;
  }
  const maxValveReverseMl = Math.max(0, ...points.flatMap((p) => [
    p.valveVolumesMl.MVReverse,
    p.valveVolumesMl.AoVReverse,
    p.valveVolumesMl.TVReverse,
    p.valveVolumesMl.PVReverse,
  ]));
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    measurementMode: "continuous low-preload march; period-aware metrics; last-beat metrics retained for comparison",
    targetVolumeMl: opts.targetVolumeMl,
    deltasMl: opts.deltasMl,
    points,
    summary: {
      pointCount: points.length,
      period2Count: points.filter((p) => p.settle.periodBeats === 2).length,
      maxAdjacentDelta: Math.max(0, ...points.map((p) => p.settle.adjacentDelta)),
      maxPeriodDelta: Math.max(0, ...points.map((p) => p.settle.periodDelta)),
      maxValveReverseMl,
      maxClampHitCount: Math.max(0, ...points.map((p) => p.health.clampHitCount)),
    },
  };
}

function reportToMarkdown(report: DebugReport): string {
  const lines: string[] = [];
  lines.push("# Starling low-preload debug report");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Measurement: ${report.measurementMode}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| points | period-2 | max adjacent delta | max period delta | max valve reverse mL | max clamp hits |");
  lines.push("| ---: | ---: | ---: | ---: | ---: | ---: |");
  lines.push(
    `| ${report.summary.pointCount} | ${report.summary.period2Count} | ${round(report.summary.maxAdjacentDelta, 4)} | ` +
    `${round(report.summary.maxPeriodDelta, 4)} | ${round(report.summary.maxValveReverseMl, 6)} | ${report.summary.maxClampHitCount} |`,
  );
  lines.push("");
  lines.push("## Points");
  lines.push("");
  lines.push("| delta | target TBV | seed | period | reason | adj delta | period delta | LAP | CO_L period | CO_L last beat | CO_R period | PV return | clamp hits | valve reverse max |");
  lines.push("| ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const p of report.points) {
    lines.push([
      p.deltaVolumeMl,
      p.targetVolumeMl,
      p.seededFromDeltaMl ?? "",
      `period-${p.settle.periodBeats}`,
      p.settle.reason,
      round(p.settle.adjacentDelta, 4),
      round(p.settle.periodDelta, 4),
      round(p.periodMetrics.LAPMean, 3),
      round(p.periodMetrics.CO_L, 3),
      round(p.lastBeatMetrics.CO_L, 3),
      round(p.periodMetrics.CO_R, 3),
      round(p.periodMetrics.pulmonaryVenousReturnLMin, 3),
      p.health.clampHitCount,
      round(Math.max(
        p.valveVolumesMl.MVReverse,
        p.valveVolumesMl.AoVReverse,
        p.valveVolumesMl.TVReverse,
        p.valveVolumesMl.PVReverse,
      ), 6),
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  lines.push("");
  lines.push("## Notes for model review");
  lines.push("");
  lines.push("- `CO_L last beat` is intentionally shown next to period-aware `CO_L period`; large separation is expected in period-2 alternans.");
  lines.push("- Nominal valve reverse volumes should remain near zero. Non-zero reverse volume would point to valve-direction artifacts rather than active-stress alternans.");
  lines.push("- `clamp hits` are aggregate health counters; node-specific clamp attribution still needs local instrumentation.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function parseArgs(args: string[]): DebugOptions {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const opts: DebugOptions = {
    outDir: path.join("artifacts", "starling-low-preload-debug", timestamp),
    targetVolumeMl: 5600,
    deltasMl: DEFAULT_DELTAS,
  };
  for (const arg of args) {
    const [key, value] = arg.split("=", 2);
    if (key === "--out" && value) opts.outDir = value;
    else if (key === "--target-volume" && value) opts.targetVolumeMl = Number(value);
    else if (key === "--deltas" && value) opts.deltasMl = value.split(",").map((v) => Number(v.trim())).filter(Number.isFinite);
    else if (key === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return opts;
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log([
    "Usage: npm run debug:starling-low-preload -- [--out=DIR] [--target-volume=5600] [--deltas=0,-900,-1000,-1125,-1250]",
    "",
    "Examples:",
    "  npm run debug:starling-low-preload",
    "  npm run debug:starling-low-preload -- --out=artifacts/starling-low-preload-debug/manual",
  ].join("\n"));
}

function round(value: number, digits: number): number {
  if (!Number.isFinite(value)) return value;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
