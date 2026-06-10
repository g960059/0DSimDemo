import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  runLowPreloadDebug,
  selectSuspiciousPointIndices,
  type LambdaActScope,
} from "@/tools/debugStarlingLowPreload";

type DebugReport = ReturnType<typeof runLowPreloadDebug>;
type DebugPoint = DebugReport["points"][number];

type MatrixOptions = {
  outDir: string;
  targetVolumeMl: number;
  deltasMl: number[];
  dtValues: number[];
  lambdaActTauSecValues: number[];
  lambdaActScopes: LambdaActScope[];
  maxReturnMapPoints: number;
  traceBeats: number;
  sampleHz: number;
  includeAllScope: boolean;
};

type MatrixScenario = {
  dt: number;
  lambdaActTauSec: number;
  lambdaActScope: LambdaActScope;
  selectedDeltasMl: number[];
  branchSummary: DebugReport["summary"];
  returnMapSummary: DebugReport["summary"];
  points: DebugPoint[];
};

type MatrixReport = {
  schemaVersion: 1;
  generatedAt: string;
  measurementMode: string;
  targetVolumeMl: number;
  deltasMl: number[];
  dtValues: number[];
  lambdaActTauSecValues: number[];
  lambdaActScopes: LambdaActScope[];
  maxReturnMapPoints: number;
  traceBeats: number;
  sampleHz: number;
  scenarios: MatrixScenario[];
  summary: {
    scenarioCount: number;
    maxBranchAmplitudeFractionCOL: number;
    maxBranchAmplitudeFractionEDVL: number;
    maxClampHitCount: number;
    selectedReturnMapPointCount: number;
  };
};

const DEFAULT_DELTAS = [0, -900, -1000, -1100, -1200, -1250, -1300, -1400, -1500, -1600];
const DEFAULT_DT_VALUES = [0.001, 0.0005];
const DEFAULT_TAU_VALUES = [0, 0.05, 0.1, 0.15, 0.2, 0.4];
const DEFAULT_SCOPES: LambdaActScope[] = ["lv", "ventricles"];

export function runLowPreloadMatrix(opts: MatrixOptions): MatrixReport {
  const scopes = opts.includeAllScope
    ? Array.from(new Set([...opts.lambdaActScopes, "all" as LambdaActScope]))
    : opts.lambdaActScopes;
  const scenarios: MatrixScenario[] = [];
  for (const lambdaActScope of scopes) {
    for (const lambdaActTauSec of opts.lambdaActTauSecValues) {
      for (const dt of opts.dtValues) {
        const branchReport = runLowPreloadDebug({
          outDir: "unused",
          targetVolumeMl: opts.targetVolumeMl,
          deltasMl: opts.deltasMl,
          dtValues: [dt],
          lambdaActTauSecValues: [lambdaActTauSec],
          lambdaActScope,
          traceBeats: opts.traceBeats,
          sampleHz: opts.sampleHz,
          returnMapMode: "none",
          quietClampLog: true,
        });
        const selectedIndices = selectSuspiciousPointIndices(branchReport.points, opts.maxReturnMapPoints);
        const selectedDeltasMl = selectedIndices.map((index) => branchReport.points[index]?.deltaVolumeMl).filter(isFiniteNumber);
        const returnMapReport = runLowPreloadDebug({
          outDir: "unused",
          targetVolumeMl: opts.targetVolumeMl,
          deltasMl: opts.deltasMl,
          dtValues: [dt],
          lambdaActTauSecValues: [lambdaActTauSec],
          lambdaActScope,
          traceBeats: opts.traceBeats,
          sampleHz: opts.sampleHz,
          returnMapMode: "both",
          returnMapDeltasMl: selectedDeltasMl,
          quietClampLog: true,
        });
        scenarios.push({
          dt,
          lambdaActTauSec,
          lambdaActScope,
          selectedDeltasMl,
          branchSummary: branchReport.summary,
          returnMapSummary: returnMapReport.summary,
          points: returnMapReport.points,
        });
      }
    }
  }
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    measurementMode: "branch-only broad low-preload matrix followed by selected EDV-section return-map diagnostics",
    targetVolumeMl: opts.targetVolumeMl,
    deltasMl: opts.deltasMl,
    dtValues: opts.dtValues,
    lambdaActTauSecValues: opts.lambdaActTauSecValues,
    lambdaActScopes: scopes,
    maxReturnMapPoints: opts.maxReturnMapPoints,
    traceBeats: opts.traceBeats,
    sampleHz: opts.sampleHz,
    scenarios,
    summary: {
      scenarioCount: scenarios.length,
      maxBranchAmplitudeFractionCOL: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxBranchAmplitudeFractionCOL)),
      maxBranchAmplitudeFractionEDVL: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxBranchAmplitudeFractionEDVL)),
      maxClampHitCount: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxClampHitCount)),
      selectedReturnMapPointCount: scenarios.reduce((sum, scenario) => sum + scenario.selectedDeltasMl.length, 0),
    },
  };
}

export function matrixReportToMarkdown(report: MatrixReport): string {
  const lines: string[] = [];
  lines.push("# Starling low-preload branch/return-map matrix");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Measurement: ${report.measurementMode}`);
  lines.push("");
  lines.push("## Scenario summary");
  lines.push("");
  lines.push("| scope | tau s | dt | selected deltas | period-2 | max CO branch frac | max EDV branch frac | max clamp hits | max one-beat EDV slope | max two-beat EDV slope |");
  lines.push("| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const scenario of report.scenarios) {
    lines.push([
      scenario.lambdaActScope,
      round(scenario.lambdaActTauSec, 4),
      round(scenario.dt, 5),
      scenario.selectedDeltasMl.join(", "),
      scenario.returnMapSummary.period2Count,
      round(scenario.returnMapSummary.maxBranchAmplitudeFractionCOL, 4),
      round(scenario.returnMapSummary.maxBranchAmplitudeFractionEDVL, 4),
      scenario.returnMapSummary.maxClampHitCount,
      round(scenario.returnMapSummary.maxAbsReturnMapSlopeEDVL, 4),
      round(scenario.returnMapSummary.maxAbsTwoBeatReturnMapSlopeEDVL, 4),
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  lines.push("");
  lines.push("## Selected return-map points");
  lines.push("");
  lines.push("| scope | tau s | dt | delta | return-map | branch CO frac | branch EDV frac | one-beat EDV slope | two-beat EDV slope | clamps |");
  lines.push("| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: |");
  for (const scenario of report.scenarios) {
    for (const point of scenario.points.filter((p) => p.returnMap.status !== "skipped")) {
      lines.push([
        scenario.lambdaActScope,
        round(scenario.lambdaActTauSec, 4),
        round(scenario.dt, 5),
        point.deltaVolumeMl,
        point.returnMap.status,
        round(point.returnMap.branchAmplitudeFraction.CO_L ?? NaN, 4),
        round(point.returnMap.branchAmplitudeFraction.EDV_L ?? NaN, 4),
        round(point.returnMap.features.EDV_L?.centralSlope ?? NaN, 4),
        round(point.returnMap.twoBeatSamePhase?.features.EDV_L?.centralSlope ?? NaN, 4),
        point.health.clampHitCount,
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- Broad branch passes run with `return-map-mode=none`; return-map diagnostics are computed only for selected suspicious deltas.");
  lines.push("- Selection prioritizes high branch amplitude fraction, clamp activity, the lowest finite low-preload point, and the baseline `-1250 mL` representative when present.");
  lines.push("- `lambdaAct` remains off by default. This matrix compares scopes and tau values for diagnosis only.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

export function matrixReportToCsv(report: MatrixReport): string {
  const columns = [
    "lambdaActScope",
    "lambdaActTauSec",
    "dt",
    "deltaVolumeMl",
    "periodBeats",
    "CO_L",
    "LAPMean",
    "branchAmplitudeFractionCO_L",
    "branchAmplitudeFractionEDV_L",
    "clampHitCount",
    "returnMapSelected",
    "returnMapStatus",
    "oneBeatEDVSlope",
    "twoBeatEDVSlope",
  ];
  const rows = [columns.join(",")];
  for (const scenario of report.scenarios) {
    const selected = new Set(scenario.selectedDeltasMl.map(String));
    for (const point of scenario.points) {
      rows.push([
        scenario.lambdaActScope,
        scenario.lambdaActTauSec,
        scenario.dt,
        point.deltaVolumeMl,
        point.settle.periodBeats ?? 1,
        point.periodMetrics.CO_L,
        point.periodMetrics.LAPMean,
        point.returnMap.branchAmplitudeFraction.CO_L ?? "",
        point.returnMap.branchAmplitudeFraction.EDV_L ?? "",
        point.health.clampHitCount,
        selected.has(String(point.deltaVolumeMl)) ? "yes" : "no",
        point.returnMap.status,
        point.returnMap.features.EDV_L?.centralSlope ?? "",
        point.returnMap.twoBeatSamePhase?.features.EDV_L?.centralSlope ?? "",
      ].map(csvCell).join(","));
    }
  }
  return `${rows.join("\n")}\n`;
}

export function parseLowPreloadMatrixArgs(args: string[]): MatrixOptions {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const opts: MatrixOptions = {
    outDir: path.join("artifacts", "starling-low-preload-debug", timestamp),
    targetVolumeMl: 5600,
    deltasMl: DEFAULT_DELTAS,
    dtValues: DEFAULT_DT_VALUES,
    lambdaActTauSecValues: DEFAULT_TAU_VALUES,
    lambdaActScopes: DEFAULT_SCOPES,
    includeAllScope: false,
    maxReturnMapPoints: 6,
    traceBeats: 10,
    sampleHz: 120,
  };
  for (const arg of args) {
    const [key, value] = arg.split("=", 2);
    if (key === "--out" && value) opts.outDir = value;
    else if (key === "--target-volume" && value) opts.targetVolumeMl = Number(value);
    else if (key === "--deltas" && value) opts.deltasMl = parseNumberList(value);
    else if (key === "--dt" && value) opts.dtValues = parseNumberList(value);
    else if (key === "--lambda-act-tau" && value) opts.lambdaActTauSecValues = parseNumberList(value);
    else if (key === "--lambda-act-scope" && value) opts.lambdaActScopes = parseScopes(value);
    else if (key === "--include-all-scope") opts.includeAllScope = true;
    else if (key === "--max-return-map-points" && value) opts.maxReturnMapPoints = Math.max(0, Math.floor(Number(value)));
    else if (key === "--trace-beats" && value) opts.traceBeats = Math.max(2, Math.floor(Number(value)));
    else if (key === "--sample-hz" && value) opts.sampleHz = Math.max(20, Math.floor(Number(value)));
    else if (key === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return opts;
}

function parseScopes(value: string): LambdaActScope[] {
  const scopes = value.split(",").map((entry) => entry.trim()).filter(Boolean);
  for (const scope of scopes) {
    if (scope !== "lv" && scope !== "ventricles" && scope !== "all") throw new Error(`Invalid lambdaAct scope: ${scope}`);
  }
  return scopes as LambdaActScope[];
}

function parseNumberList(value: string): number[] {
  return value.split(",").map((v) => Number(v.trim())).filter(Number.isFinite);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function round(value: number, digits: number): number {
  if (!Number.isFinite(value)) return value;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function csvCell(value: unknown): string {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log([
    "Usage: npm run verify:starling-low-preload-matrix -- [--out=DIR]",
    "       [--deltas=0,-900,-1250] [--dt=0.001,0.0005] [--lambda-act-tau=0,0.15]",
    "       [--lambda-act-scope=lv,ventricles] [--include-all-scope] [--max-return-map-points=6]",
    "",
    "Example:",
    "  npm run verify:starling-low-preload-matrix -- --deltas=0,-1250,-1400 --dt=0.001 --lambda-act-tau=0,0.15 --lambda-act-scope=lv,ventricles --max-return-map-points=2",
  ].join("\n"));
}

function main(): void {
  const options = parseLowPreloadMatrixArgs(process.argv.slice(2));
  mkdirSync(options.outDir, { recursive: true });
  const report = runLowPreloadMatrix(options);
  writeFileSync(path.join(options.outDir, "matrix-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(path.join(options.outDir, "matrix-report.md"), matrixReportToMarkdown(report));
  writeFileSync(path.join(options.outDir, "branch-table.csv"), matrixReportToCsv(report));

  // eslint-disable-next-line no-console
  console.log(`Wrote Starling low-preload matrix report to ${options.outDir}`);
  // eslint-disable-next-line no-console
  console.log(
    `scenarios=${report.summary.scenarioCount} selectedReturnMapPoints=${report.summary.selectedReturnMapPointCount} ` +
    `maxBranchCOFrac=${round(report.summary.maxBranchAmplitudeFractionCOL, 4)}`,
  );
}

if (process.env.STARLING_LOW_PRELOAD_MATRIX_MAIN === "1") main();
