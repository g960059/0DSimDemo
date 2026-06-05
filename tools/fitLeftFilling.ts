import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_PARAMS } from "@/constants";
import type { CoreRuntimeParams, ParameterPatch } from "@/engine/protocol";
import { mergeParameterPatch } from "@/engine/fitting/parameterSpace";
import { reportToMarkdown, runVerification, toVerificationArtifact } from "@/engine/verification/report";
import type { VerificationMode } from "@/engine/verification/profiles";
import { lastCompleteBeat, phaseOf, sampleInWindowBy } from "@/engine/verification/shapeMetrics";

type Candidate = {
  id: string;
  patch: ParameterPatch;
};

type CliOptions = {
  profile: VerificationMode;
  outDir: string;
  writeArtifacts: boolean;
};

const RINGING_GATE_IDS = [
  "qmv-extra-peaks",
  "lap-oscillation-index",
  "lap-prominent-extrema",
  "lv-filling-edge-roughness",
  "lv-filling-edge-excess",
  "lv-filling-edge-curvature",
  "lv-filling-edge-reversals",
  "pvf-reverse-fraction",
  "mv-gradient-e-peak",
  "mv-gradient-a-peak",
] as const;

const options = parseArgs(process.argv.slice(2));
const rows = candidates().map((candidate) => evaluate(candidate, options.profile));
rows.sort((a, b) => {
  if (a.hardFailures !== b.hardFailures) return a.hardFailures - b.hardFailures;
  if (a.softFailures !== b.softFailures) return a.softFailures - b.softFailures;
  if (a.ringingFailures !== b.ringingFailures) return a.ringingFailures - b.ringingFailures;
  return b.score - a.score;
});

mkdirSync(options.outDir, { recursive: true });
writeFileSync(path.join(options.outDir, "left-filling-candidates.json"), `${JSON.stringify(rows, null, 2)}\n`);
writeFileSync(path.join(options.outDir, "left-filling-candidates.csv"), csv(rows));

if (options.writeArtifacts) {
  for (const row of rows.slice(0, 5)) {
    const report = runVerification(row.params, { profile: options.profile, gateSet: "normalBaseline" });
    const candidateDir = path.join(options.outDir, row.id);
    mkdirSync(candidateDir, { recursive: true });
    writeFileSync(path.join(candidateDir, "report.json"), `${JSON.stringify(toVerificationArtifact(report), null, 2)}\n`);
    writeFileSync(path.join(candidateDir, "report.md"), reportToMarkdown(report));
  }
}

// eslint-disable-next-line no-console
console.log(`left-filling sweep wrote ${rows.length} candidates to ${options.outDir}`);
// eslint-disable-next-line no-console
console.table(rows.slice(0, 8).map((row) => ({
  id: row.id,
  hard: row.hardFailures,
  soft: row.softFailures,
  ringing: row.ringingFailures,
  score: row.score.toFixed(3),
  qmvExtra: row.gates["qmv-extra-peaks"],
  lapOsc: row.gates["lap-oscillation-index"],
  lvRough: row.gates["lv-filling-edge-roughness"],
  lvExcess: row.gates["lv-filling-edge-excess"],
  pvfRev: row.gates["pvf-reverse-fraction"],
  pvfDOverS: row.pvfDOverSPeak?.toFixed(3),
  rvEf: row.efRight?.toFixed(3),
  mvEGrad: row.gates["mv-gradient-e-peak"],
})));

function evaluate(candidate: Candidate, profile: VerificationMode) {
  const params = mergeParameterPatch(DEFAULT_PARAMS, candidate.patch) as Partial<CoreRuntimeParams>;
  const report = runVerification(params, { profile, gateSet: "normalBaseline" });
  const gates = Object.fromEntries(report.gates.map((gate) => [gate.id, gate]));
  const beat = report.measurement ? lastCompleteBeat(report.measurement.samples) : [];
  const sPeak = beat.length > 0 ? sampleInWindowBy(beat, "PVF", 0.05, 0.45, "max") : null;
  const dPeak = beat.length > 0 ? sampleInWindowBy(beat, "PVF", 0.45, 0.80, "max") : null;
  const ringingFailures = RINGING_GATE_IDS
    .filter((id) => gates[id]?.severity === "hard" && gates[id]?.status === "fail")
    .length;
  return {
    id: candidate.id,
    params,
    pass: report.summary.pass,
    hardFailures: report.summary.hardFailures,
    softFailures: report.summary.softFailures,
    ringingFailures,
    score: report.summary.score,
    efRight: report.metrics?.EF_RApprox ?? null,
    pvfDOverSPeak: sPeak && dPeak && sPeak.PVF > 1e-9 ? dPeak.PVF / sPeak.PVF : null,
    pvfSPeakTheta: sPeak ? phaseOf(sPeak) : null,
    pvfDPeakTheta: dPeak ? phaseOf(dPeak) : null,
    gates: Object.fromEntries(RINGING_GATE_IDS.map((id) => [id, gates[id]?.value ?? null])),
    failedGateIds: report.gates.filter((gate) => gate.status === "fail").map((gate) => gate.id),
  };
}

function candidates(): Candidate[] {
  const pvein = [
    ["baseline-pvein", {}],
    ["pvein-resistive-r030", pveinPatch(0.030, 0, 0)],
    ["pvein-resistive-r032", pveinPatch(0.032, 0, 0)],
    ["pvein-resistive-r035", pveinPatch(0.035, 0, 0)],
    ["pvein-resistive-r040", pveinPatch(0.040, 0, 0)],
    ["pvein-low-l-r032", pveinPatch(0.032, 0.0002, 1e-5)],
    ["pvein-low-l-r040", pveinPatch(0.040, 0.0003, 2e-5)],
    ["pvein-low-l-r050", pveinPatch(0.050, 0.0003, 2e-5)],
  ] as const;
  const mv = [
    ["baseline-mv", {}],
    ["mv-low-r002", { MV_Amax: 5.5, MV_R: 0.002, MV_L: 0.0003, MV_B: 5e-6, MV_tauOpen: 0.022, MV_tauClose: 0.014 }],
    ["mv-damped-r0027", { MV_R: 0.0027, MV_L: 0.0005, MV_B: 8e-6, MV_tauOpen: 0.024, MV_tauClose: 0.016 }],
    ["mv-damped-r0025", { MV_R: 0.0025, MV_L: 0.00045, MV_B: 7.5e-6, MV_tauOpen: 0.022, MV_tauClose: 0.014, MV_kOpen: 1.6 }],
    ["mv-damped-r003", { MV_R: 0.003, MV_L: 0.0005, MV_B: 1e-5, MV_tauOpen: 0.024, MV_tauClose: 0.016 }],
    ["mv-damped-r004", { MV_R: 0.004, MV_L: 0.0008, MV_B: 2e-5, MV_tauOpen: 0.028, MV_tauClose: 0.020, MV_kOpen: 1.2 }],
  ] as const;
  const out: Candidate[] = [{ id: "baseline", patch: {} }];
  for (const [pveinId, pveinCandidate] of pvein) {
    for (const [mvId, mvCandidate] of mv) {
      if (pveinId === "baseline-pvein" && mvId === "baseline-mv") continue;
      out.push({
        id: `${pveinId}__${mvId}`,
        patch: mergeParameterPatch(pveinCandidate, mvCandidate),
      });
    }
  }
  return out;
}

function pveinPatch(R: number, L: number, B: number): ParameterPatch {
  return {
    edgeOverrides: {
      PVein_LA: {
        R,
        pvOstialResistanceR: R,
        L,
        pvOstialInertanceL: L,
        B,
        pvOstialQuadraticB: B,
      },
    },
  };
}

function csv(rows: ReturnType<typeof evaluate>[]): string {
  const fields = [
    "id",
    "pass",
    "hardFailures",
    "softFailures",
    "ringingFailures",
    "score",
    ...RINGING_GATE_IDS,
    "failedGateIds",
  ];
  return [
    fields.join(","),
    ...rows.map((row) => fields.map((field) => csvValue(field === "failedGateIds"
      ? row.failedGateIds.join("|")
      : field in row
        ? (row as any)[field]
        : row.gates[field as keyof typeof row.gates])).join(",")),
  ].join("\n");
}

function csvValue(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function parseArgs(args: string[]): CliOptions {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const opts: CliOptions = {
    profile: "fitFast",
    outDir: path.join("artifacts", "verification", `left-filling-${timestamp}`),
    writeArtifacts: false,
  };
  for (const arg of args) {
    const [key, value] = arg.split("=", 2);
    if (key === "--profile" && isVerificationMode(value)) opts.profile = value;
    else if (key === "--out" && value) opts.outDir = value;
    else if (key === "--artifacts") opts.writeArtifacts = true;
    else if (key === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return opts;
}

function isVerificationMode(value: string | undefined): value is VerificationMode {
  return value === "preview" || value === "fitFast" || value === "verifyAccurate";
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log([
    "Usage: npm run fit:left-filling -- [--profile=fitFast|verifyAccurate|preview] [--out=DIR] [--artifacts]",
    "",
    "Examples:",
    "  npm run fit:left-filling",
    "  npm run fit:left-filling -- --profile=verifyAccurate --artifacts --out=artifacts/verification/left-filling",
  ].join("\n"));
}
