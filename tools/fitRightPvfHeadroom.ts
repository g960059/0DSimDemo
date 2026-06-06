import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_PARAMS } from "@/constants";
import {
  buildHeadroomReview,
  headroomReviewToMarkdown,
  type HeadroomGateSnapshot,
} from "@/engine/fitting/headroomReview";
import { evaluateObjective, summarizeObjective } from "@/engine/fitting/objective";
import { mergeParameterPatch } from "@/engine/fitting/parameterSpace";
import type { CoreRuntimeParams, ParameterPatch } from "@/engine/protocol";
import { generateVerificationSvgs } from "@/engine/verification/artifacts";
import { reportToMarkdown, runVerification, toVerificationArtifact } from "@/engine/verification/report";
import type { VerificationMode } from "@/engine/verification/profiles";

type Candidate = {
  id: string;
  patch: ParameterPatch;
};

type CliOptions = {
  profile: VerificationMode;
  outDir: string;
  writeArtifacts: boolean;
};

const GUARD_GATE_IDS = [
  "ef-right",
  "rv-stroke-fraction",
  "pvf-s-fraction",
  "pvf-s-over-d",
  "pvf-reverse-fraction",
  "pap-mean",
  "rvp-max",
  "rv-edp-presystolic",
  "ra-figure-eight",
  "qmv-extra-peaks",
  "lap-oscillation-index",
  "lv-filling-edge-curvature",
  "mv-gradient-e-peak",
] as const;

const options = parseArgs(process.argv.slice(2));
const rows = candidates().map((candidate) => evaluate(candidate, options.profile));
rows.sort(compareRows);

mkdirSync(options.outDir, { recursive: true });
writeFileSync(path.join(options.outDir, "right-pvf-headroom-candidates.json"), `${JSON.stringify(rows, null, 2)}\n`);
writeFileSync(path.join(options.outDir, "right-pvf-headroom-candidates.csv"), csv(rows));
const review = buildHeadroomReview(rows, {
  title: "Right Heart / PVF Headroom Candidate Review",
  topN: 5,
});
writeFileSync(path.join(options.outDir, "right-pvf-headroom-review.json"), `${JSON.stringify(review, null, 2)}\n`);
writeFileSync(path.join(options.outDir, "right-pvf-headroom-review.md"), headroomReviewToMarkdown(review));

if (options.writeArtifacts) {
  for (const [index, row] of rows.slice(0, 5).entries()) {
    const report = runVerification(row.params, { profile: options.profile, gateSet: "normalBaseline" });
    const candidateDir = path.join(options.outDir, `${String(index + 1).padStart(2, "0")}-${safePathSegment(row.id)}`);
    mkdirSync(candidateDir, { recursive: true });
    const svgs = generateVerificationSvgs(report);
    writeFileSync(path.join(candidateDir, "metadata.json"), `${JSON.stringify({
      rank: index + 1,
      id: row.id,
      patch: row.patch,
      profile: options.profile,
      gateSet: "normalBaseline",
      summary: report.summary,
      headroom: {
        rvEfHeadroom: row.rvEfHeadroom,
        pvfSFractionHeadroom: row.pvfSFractionHeadroom,
        limitingHeadroom: row.limitingHeadroom,
        cappedHeadroomScore: row.cappedHeadroomScore,
      },
      objective: row.objective,
      failedGateIds: row.failedGateIds,
      failureLocations: report.failureLocations,
      artifactFiles: ["metadata.json", "report.json", "report.md", ...Object.keys(svgs)],
    }, null, 2)}\n`);
    writeFileSync(path.join(candidateDir, "report.json"), `${JSON.stringify(toVerificationArtifact(report), null, 2)}\n`);
    writeFileSync(path.join(candidateDir, "report.md"), reportToMarkdown(report));
    for (const [filename, svg] of Object.entries(svgs)) {
      writeFileSync(path.join(candidateDir, filename), svg);
    }
  }
}

// eslint-disable-next-line no-console
console.log(`right/PVF headroom sweep wrote ${rows.length} candidates to ${options.outDir}`);
// eslint-disable-next-line no-console
console.table(rows.slice(0, 10).map((row) => ({
  id: row.id,
  hard: row.hardFailures,
  soft: row.softFailures,
  rvEf: row.efRight?.toFixed(3),
  pvfS: row.pvfSFraction?.toFixed(3),
  pvfSD: row.pvfSOverD?.toFixed(3),
  pvfRev: row.pvfReverseFraction?.toFixed(3),
  limiting: row.limitingHeadroom?.toFixed(3),
  score: row.score.toFixed(3),
  steady: row.steadyStatus ?? "n/a",
  objective: row.objectiveTotalLoss.toFixed(3),
  failed: row.failedGateIds.join(" "),
})));

function evaluate(candidate: Candidate, profile: VerificationMode) {
  const params = mergeParameterPatch(DEFAULT_PARAMS, candidate.patch) as Partial<CoreRuntimeParams>;
  const report = runVerification(params, { profile, gateSet: "normalBaseline" });
  const gates = Object.fromEntries(report.gates.map((gate) => [gate.id, gate]));
  const efRight = report.metrics?.EF_RApprox ?? null;
  const pvfSFraction = report.shape?.pvfSFraction ?? null;
  const pvfSOverD = report.shape?.pvfSOverD ?? null;
  const pvfReverseFraction = report.shape?.pvfReverseFraction ?? null;
  const rvEfHeadroom = finiteOrNull(efRight == null ? null : efRight - 0.50);
  const pvfSFractionHeadroom = finiteOrNull(pvfSFraction == null ? null : pvfSFraction - 0.40);
  const objective = summarizeObjective(evaluateObjective(report));
  const limitingHeadroom = rvEfHeadroom == null || pvfSFractionHeadroom == null
    ? null
    : Math.min(rvEfHeadroom, pvfSFractionHeadroom);
  return {
    id: candidate.id,
    params,
    patch: candidate.patch,
    pass: report.summary.pass,
    hardFailures: report.summary.hardFailures,
    softFailures: report.summary.softFailures,
    score: report.summary.score,
    objective,
    steadyStatus: objective.steadyStatus,
    objectiveTotalLoss: objective.objectiveTotalLoss,
    convergencePenalty: objective.convergencePenalty,
    residualPenalty: objective.residualPenalty,
    paramsHash: objective.paramsHash,
    efRight,
    pvfSFraction,
    pvfSOverD,
    pvfReverseFraction,
    rvEfHeadroom,
    pvfSFractionHeadroom,
    limitingHeadroom,
    cappedHeadroomScore: cappedHeadroomScore(efRight, pvfSFraction),
    gates: Object.fromEntries(GUARD_GATE_IDS.map((id) => [id, gateSnapshot(gates[id])])),
    failedGateIds: report.gates.filter((gate) => gate.status === "fail").map((gate) => gate.id),
  };
}

function compareRows(a: ReturnType<typeof evaluate>, b: ReturnType<typeof evaluate>): number {
  if (a.hardFailures !== b.hardFailures) return a.hardFailures - b.hardFailures;
  if (numericSort(a.limitingHeadroom, b.limitingHeadroom) !== 0) {
    return numericSort(a.limitingHeadroom, b.limitingHeadroom);
  }
  if (numericSort(a.cappedHeadroomScore, b.cappedHeadroomScore) !== 0) {
    return numericSort(a.cappedHeadroomScore, b.cappedHeadroomScore);
  }
  if (a.softFailures !== b.softFailures) return a.softFailures - b.softFailures;
  if (a.score !== b.score) return b.score - a.score;
  return a.id.localeCompare(b.id);
}

function candidates(): Candidate[] {
  const rvTmax = [1.0, 1.03, 1.06, 1.09, 1.12];
  const laAvPlane = [10, 11, 12, 13];
  const pulmonaryResistance = [0.65, 0.625, 0.60];
  const pveinR = [0.03025, 0.031, 0.032];
  const out: Candidate[] = [{ id: "baseline", patch: {} }];

  for (const rv of rvTmax) {
    out.push({ id: `rv-tmax-${idNumber(rv)}`, patch: { rvTmaxScale: rv } });
  }
  for (const avp of laAvPlane) {
    out.push({ id: `la-avplane-${idNumber(avp)}`, patch: laAvPlanePatch(avp) });
  }
  for (const resistance of pulmonaryResistance) {
    out.push({ id: `pulm-r-${idNumber(resistance)}`, patch: { pulmonaryResistance: resistance } });
  }
  for (const r of pveinR) {
    out.push({ id: `pvein-r-${idNumber(r)}`, patch: pveinPatch(r) });
  }
  for (const rv of [1.03, 1.06, 1.09]) {
    for (const avp of [11, 12]) {
      out.push({
        id: `rv-${idNumber(rv)}__la-avp-${idNumber(avp)}`,
        patch: mergeParameterPatch({ rvTmaxScale: rv }, laAvPlanePatch(avp)),
      });
    }
  }
  for (const rv of [1.03, 1.06]) {
    for (const resistance of [0.625, 0.60]) {
      out.push({
        id: `rv-${idNumber(rv)}__pulm-r-${idNumber(resistance)}`,
        patch: { rvTmaxScale: rv, pulmonaryResistance: resistance },
      });
    }
  }
  for (const avp of [11, 12]) {
    for (const r of [0.031, 0.032]) {
      out.push({
        id: `la-avp-${idNumber(avp)}__pvein-r-${idNumber(r)}`,
        patch: mergeParameterPatch(laAvPlanePatch(avp), pveinPatch(r)),
      });
    }
  }
  for (const rv of [1.0, 1.03]) {
    for (const avp of [11, 12]) {
      for (const mv of mvLightPatches()) {
        out.push({
          id: `rv-${idNumber(rv)}__la-avp-${idNumber(avp)}__${mv.id}`,
          patch: mergeParameterPatch(
            mergeParameterPatch({ rvTmaxScale: rv }, laAvPlanePatch(avp)),
            mv.patch,
          ),
        });
      }
    }
  }
  return dedupeCandidates(out);
}

function laAvPlanePatch(avPlaneGainMl: number): ParameterPatch {
  return {
    nodeOverrides: {
      LA: { active: { avPlaneGainMl } },
    },
  };
}

function pveinPatch(R: number): ParameterPatch {
  return {
    edgeOverrides: {
      PVein_LA: {
        R,
        pvOstialResistanceR: R,
        L: 0,
        pvOstialInertanceL: 0,
        B: 0,
        pvOstialQuadraticB: 0,
      },
    },
  };
}

function mvLightPatches(): Candidate[] {
  return [
    { id: "mv-r0026", patch: { MV_R: 0.0026 } },
    { id: "mv-r0025", patch: { MV_R: 0.0025 } },
    { id: "mv-r0025-b7e-6", patch: { MV_R: 0.0025, MV_B: 7e-6 } },
    { id: "mv-r0026-a58", patch: { MV_R: 0.0026, MV_Amax: 5.8 } },
    { id: "mv-r0025-a58", patch: { MV_R: 0.0025, MV_Amax: 5.8 } },
  ];
}

function cappedHeadroomScore(efRight: number | null, pvfSFraction: number | null): number | null {
  if (efRight == null || pvfSFraction == null || !Number.isFinite(efRight) || !Number.isFinite(pvfSFraction)) return null;
  const rv = clamp01((efRight - 0.50) / (0.58 - 0.50));
  const pvf = clamp01((pvfSFraction - 0.40) / (0.55 - 0.40));
  return Math.min(rv, pvf) + 0.25 * (rv + pvf);
}

function csv(rows: ReturnType<typeof evaluate>[]): string {
  const fields = [
    "id",
    "pass",
    "hardFailures",
    "softFailures",
    "score",
    "steadyStatus",
    "objectiveTotalLoss",
    "convergencePenalty",
    "residualPenalty",
    "paramsHash",
    "efRight",
    "pvfSFraction",
    "pvfSOverD",
    "pvfReverseFraction",
    "rvEfHeadroom",
    "pvfSFractionHeadroom",
    "limitingHeadroom",
    "cappedHeadroomScore",
    ...GUARD_GATE_IDS,
    "failedGateIds",
  ];
  return [
    fields.join(","),
    ...rows.map((row) => fields.map((field) => csvValue(field === "failedGateIds"
      ? row.failedGateIds.join("|")
      : field in row
        ? (row as any)[field]
        : row.gates[field as keyof typeof row.gates]?.value)).join(",")),
  ].join("\n");
}

function gateSnapshot(gate: ReturnType<typeof runVerification>["gates"][number] | undefined): HeadroomGateSnapshot | null {
  if (!gate) return null;
  return {
    value: gate.value,
    status: gate.status,
    severity: gate.severity,
    threshold: gate.threshold,
    score: gate.score,
  };
}

function dedupeCandidates(candidates: Candidate[]): Candidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.id)) return false;
    seen.add(candidate.id);
    return true;
  });
}

function numericSort(a: number | null, b: number | null): number {
  const aa = typeof a === "number" && Number.isFinite(a) ? a : -Infinity;
  const bb = typeof b === "number" && Number.isFinite(b) ? b : -Infinity;
  return bb - aa;
}

function finiteOrNull(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function idNumber(value: number): string {
  return String(value).replace(".", "p");
}

function safePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 100) || "candidate";
}

function csvValue(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function parseArgs(args: string[]): CliOptions {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const opts: CliOptions = {
    profile: "verifyAccurate",
    outDir: path.join("artifacts", "verification", `right-pvf-headroom-${timestamp}`),
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
    "Usage: npm run fit:right-pvf-headroom -- [--profile=verifyAccurate|fitFast|preview] [--out=DIR] [--artifacts]",
    "",
    "Examples:",
    "  npm run fit:right-pvf-headroom",
    "  npm run fit:right-pvf-headroom -- --profile=verifyAccurate --artifacts --out=artifacts/verification/right-pvf-headroom",
  ].join("\n"));
}
