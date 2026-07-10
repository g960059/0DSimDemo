import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  runAtrialAVPlanePassiveBalanceBenchV2,
  runAtrialAVPlanePassiveBalanceTracesV2,
  type AtrialAVPlanePassiveBalanceVariantIdV2,
} from "@/engine/mechanics2/benches/AtrialAVPlanePassiveBalanceBenchV2";
import type { MechanisticAtrialSampleV1 } from
  "@/engine/mechanics2/benches/MechanisticAtrialOneFiberBench";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outputPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/atrial-av-plane-passive-balance-review-v2.svg",
);
const report = runAtrialAVPlanePassiveBalanceBenchV2();
const traces = runAtrialAVPlanePassiveBalanceTracesV2();
const selectedIds = [
  "v1-baseline",
  "passive-balance",
  "passive-balance-la-contractility-bracket",
  "topology-only-comparator",
] as const;
const selected = selectedIds.map((variantId) => ({
  variantId,
  result: traces.find((row) => row.variantId === variantId)!.result,
  summary: report.variants.find((row) => row.variantId === variantId)!,
}));
const width = 1600;
const height = 1580;
const svg: string[] = [];
const allSamples = selected.flatMap((row) => row.result.samples);
const volumeScale = scale(allSamples.map((sample) => sample.laVolumeMl), 0, 1);
const pressureScale = scale(allSamples.map((sample) => sample.laPressureMmHg), 0, 1);

svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
svg.push(`<rect width="${width}" height="${height}" fill="#08111f"/>`);
svg.push(text(38, 42, "AV-plane passive-balance V2 | common-solver comparison", 26, "#e7eef9", 700));
svg.push(text(38, 69, "Experimental sidecar. Candidate is not selected: physical force balance improves, but blood-volume PV topology and MVF do not pass jointly.", 14, "#fbbf24", 600));
svg.push(text(38, 94, "LA blood volume remains Q_PV - Q_MV. No P_mem, P_relief, P_LV_recv, hidden capacity state, or runtime wiring.", 13, "#94a3b8"));

selected.forEach((row, index) => {
  const x = index % 2 === 0 ? 38 : 820;
  const y = index < 2 ? 120 : 570;
  renderPvPanel(svg, x, y, 742, 420, row, volumeScale, pressureScale);
});

const baseline = selected[0]!;
const passive = selected[1]!;
const bracket = selected[2]!;
renderTimePanel(svg, 38, 1020, 490, 250, "AV-plane velocity (cm/s)", [
  series(baseline.result.samples, (sample) => sample.avPlaneVelocityCmPerSec, "#94a3b8", "V1"),
  series(passive.result.samples, (sample) => sample.avPlaneVelocityCmPerSec, "#38bdf8", "passive"),
  series(bracket.result.samples, (sample) => sample.avPlaneVelocityCmPerSec, "#c084fc", "T_A bracket"),
]);
renderTimePanel(svg, 555, 1020, 490, 250, "Mitral bulk velocity (cm/s)", [
  series(baseline.result.samples, (sample) => sample.mitralVelocityCmPerSec, "#94a3b8", "V1"),
  series(passive.result.samples, (sample) => sample.mitralVelocityCmPerSec, "#38bdf8", "passive"),
  series(bracket.result.samples, (sample) => sample.mitralVelocityCmPerSec, "#c084fc", "T_A bracket"),
]);
renderTimePanel(svg, 1072, 1020, 490, 250, "Passive candidate forces (N)", [
  series(passive.result.samples, (sample) =>
    sample.ventricularActiveForceN - sample.atrialActiveForceN, "#f87171", "active"),
  series(passive.result.samples, (sample) => sample.hydraulicForceN, "#60a5fa", "hydraulic"),
  series(passive.result.samples, (sample) => sample.springForceN, "#34d399", "spring"),
  series(passive.result.samples, (sample) => sample.dampingForceN, "#fbbf24", "damping"),
  series(passive.result.samples, (sample) => sample.inertialForceN, "#c084fc", "inertial"),
]);

renderReadback(svg, 38, 1300, 1524, 220);
svg.push(text(38, 1554, `Generated from ${report.reportId} | all accepted comparison rows periodic and conservative | joint candidate gate: fail`, 12, "#64748b"));
svg.push(`</svg>`);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${svg.join("\n")}\n`);
console.log(outputPath.replace(`${repoRoot}/`, ""));

function renderPvPanel(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  row: typeof selected[number],
  commonVolume: (value: number) => number,
  commonPressure: (value: number) => number,
): void {
  panel(out, x, y, w, h, titleFor(row.variantId));
  const plot = { x: x + 58, y: y + 58, w: w - 84, h: h - 98 };
  const sx = (value: number) => plot.x + commonVolume(value) * plot.w;
  const sy = (value: number) => plot.y + plot.h - commonPressure(value) * plot.h;
  grid(out, plot.x, plot.y, plot.w, plot.h);
  const phases = phasePaths(row.result.samples, row.result.events);
  drawPath(out, phases.reservoir, sx, sy, "#60a5fa", 3.5);
  drawPath(out, phases.conduit, sx, sy, "#fb923c", 3.5);
  drawPath(out, phases.pumping, sx, sy, "#a8b2c1", 3.5);
  mark(out, nearest(row.result.samples, row.result.events.mitralOpeningTheta), sx, sy, "#fbbf24");
  mark(out, nearest(row.result.samples, row.result.events.mitralClosureTheta), sx, sy, "#22c55e");
  out.push(text(
    x + 17,
    y + 49,
    `AVPD ${row.summary.profile.avPlaneDisplacementCm.toFixed(2)} cm | x ${row.summary.profile.xDescentDepthMmHg.toFixed(2)} | E/A ${row.summary.profile.mitralPeakVelocityEToARatio.toFixed(2)} | A/v ${(row.summary.profile.aLoopAreaMmHgMl / Math.max(row.summary.profile.vLoopAreaMmHgMl, 1e-9)).toFixed(2)}`,
    12,
    "#b8c5d8",
  ));
  out.push(text(
    x + 17,
    y + h - 13,
    `cross ${row.summary.profile.figureEightCrossingPhase}; conduit-below ${pct(row.summary.profile.conduitBeforeCrossingBelowReservoirPathFraction)}; pumping-above ${pct(row.summary.profile.pumpingAfterCrossingAboveReservoirPathFraction)}`,
    12,
    row.summary.profile.figureEightCrossingInPreferredWindow ? "#94a3b8" : "#fca5a5",
  ));
}

function renderReadback(out: string[], x: number, y: number, w: number, h: number): void {
  panel(out, x, y, w, h, "Decision readback");
  const passive = report.variants.find((row) => row.variantId === "passive-balance")!;
  const bracket = report.variants.find((row) =>
    row.variantId === "passive-balance-la-contractility-bracket"
  )!;
  const columns = [
    {
      title: "Mechanics signal, not model acceptance",
      lines: [
        `M/D/K ${passive.params.avPlane.inertiaNSec2PerCm.toFixed(1)} / ${passive.params.avPlane.dampingNSecPerCm.toFixed(0)} / ${passive.params.avPlane.stiffnessNPerCm.toFixed(0)}`,
        `quasi-static AVP ${passFail(passive.diastasis.quasiStaticAvPlanePass)}; flow ${pct(passive.diastasis.mitralFlowFractionOfPeak)} peak`,
        `hydraulic ${passive.diastasis.hydraulicForceN.toFixed(2)} N; spring ${passive.diastasis.springForceN.toFixed(2)} N; residual ${passive.diastasis.quasiStaticResidualN.toFixed(2)} N`,
        `x gain ${report.comparisons.passiveCandidateXDepthGainMmHg.toFixed(2)} mmHg; AVPD gain ${report.comparisons.passiveCandidateAvpdGainCm.toFixed(2)} cm`,
        `peak LV active ${report.comparisons.passiveCandidatePeakVentricularActiveForceRatioToV1.toFixed(2)}x V1; input-bracket advisory ${passFail(report.supportingEvidence.activeForceProjectionWithinPublishedInputBracket)}`,
      ],
    },
    {
      title: "Unresolved normal morphology",
      lines: [
        `passive E/A ${passive.profile.mitralPeakVelocityEToARatio.toFixed(2)}: ${passFail(report.gates.passiveCandidateMitralWavePass)}`,
        `passive conduit ordering ${pct(passive.profile.conduitBeforeCrossingBelowReservoirPathFraction)}: ${passFail(report.gates.passiveCandidateBloodVolumeTopologyPass)}`,
        `T_A=${bracket.params.laWall.activeStressMaxKPa.toFixed(0)} kPa restores E/A ${bracket.profile.mitralPeakVelocityEToARatio.toFixed(2)} but crossing ${bracket.profile.figureEightCrossingPhase}`,
        `joint physical + PV + MVF gate: ${passFail(report.gates.jointMechanisticCandidatePass)}`,
      ],
    },
    {
      title: "Boundary and next step",
      lines: [
        `normal/dt/envelope numerics ${passFail(report.envelopeDiagnostics.allNumerical)}; topology ${report.envelopeDiagnostics.morphologyPassCount}/${report.envelopeDiagnostics.caseCount}`,
        `neutral shift changes LA midpoint ${report.comparisons.neutralShiftLaVolumeMidpointChangeMl.toFixed(1)} mL with <=${pct(report.comparisons.neutralShiftShapeMaxRelativeDifference)} shape drift`,
        "absolute chamber volume and AV-plane coordinate data are needed to identify z0",
        "test valve/receiver loading in full circulation before adding any state",
      ],
    },
  ];
  columns.forEach((column, index) => {
    const cx = x + 18 + index * (w - 36) / 3;
    out.push(text(cx, y + 56, column.title, 13, "#e2e8f0", 700));
    column.lines.forEach((line, lineIndex) => {
      out.push(text(cx, y + 84 + lineIndex * 28, line, 12, "#b8c5d8"));
    });
  });
}

type PlotSeries = {
  readonly values: readonly { readonly theta: number; readonly value: number }[];
  readonly color: string;
  readonly label: string;
};

function series(
  samples: readonly MechanisticAtrialSampleV1[],
  valueFor: (sample: MechanisticAtrialSampleV1) => number,
  color: string,
  label: string,
): PlotSeries {
  return { values: samples.map((sample) => ({ theta: sample.theta, value: valueFor(sample) })), color, label };
}

function renderTimePanel(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  titleValue: string,
  rows: readonly PlotSeries[],
): void {
  panel(out, x, y, w, h, titleValue);
  const plot = { x: x + 38, y: y + 48, w: w - 58, h: h - 72 };
  const syNorm = scale(rows.flatMap((row) => row.values.map((point) => point.value)), 0, 1);
  const sx = (theta: number) => plot.x + theta * plot.w;
  const sy = (value: number) => plot.y + plot.h - syNorm(value) * plot.h;
  grid(out, plot.x, plot.y, plot.w, plot.h);
  rows.forEach((row) => {
    const d = row.values.map((point, index) =>
      `${index === 0 ? "M" : "L"}${sx(point.theta).toFixed(2)},${sy(point.value).toFixed(2)}`
    ).join(" ");
    out.push(`<path d="${d}" fill="none" stroke="${row.color}" stroke-width="2" stroke-linejoin="round"/>`);
  });
  rows.forEach((row, index) => {
    const lx = x + 18 + index * 90;
    out.push(`<line x1="${lx}" y1="${y + 31}" x2="${lx + 18}" y2="${y + 31}" stroke="${row.color}" stroke-width="3"/>`);
    out.push(text(lx + 23, y + 35, row.label, 10, "#cbd5e1"));
  });
}

function phasePaths(
  samples: readonly MechanisticAtrialSampleV1[],
  events: { readonly mitralClosureTheta: number; readonly mitralOpeningTheta: number; readonly preATheta: number },
) {
  return {
    reservoir: samples.filter((sample) =>
      sample.theta >= events.mitralClosureTheta && sample.theta <= events.mitralOpeningTheta
    ),
    conduit: samples.filter((sample) =>
      sample.theta >= events.mitralOpeningTheta && sample.theta <= events.preATheta
    ),
    pumping: [
      ...samples.filter((sample) => sample.theta >= events.preATheta),
      ...samples.filter((sample) => sample.theta <= events.mitralClosureTheta),
    ],
  };
}

function panel(out: string[], x: number, y: number, w: number, h: number, titleValue: string) {
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#0f1a2b" stroke="#26364c"/>`);
  out.push(text(x + 16, y + 27, titleValue, 14, "#d8e2f0", 700));
}

function grid(out: string[], x: number, y: number, w: number, h: number): void {
  for (let index = 0; index <= 4; index += 1) {
    const gx = x + index * w / 4;
    const gy = y + index * h / 4;
    out.push(`<line x1="${gx}" y1="${y}" x2="${gx}" y2="${y + h}" stroke="#223147"/>`);
    out.push(`<line x1="${x}" y1="${gy}" x2="${x + w}" y2="${gy}" stroke="#223147"/>`);
  }
}

function drawPath(
  out: string[],
  values: readonly MechanisticAtrialSampleV1[],
  sx: (value: number) => number,
  sy: (value: number) => number,
  color: string,
  widthValue: number,
): void {
  const d = values.map((sample, index) =>
    `${index === 0 ? "M" : "L"}${sx(sample.laVolumeMl).toFixed(2)},${sy(sample.laPressureMmHg).toFixed(2)}`
  ).join(" ");
  out.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${widthValue}" stroke-linecap="round" stroke-linejoin="round"/>`);
}

function mark(
  out: string[],
  sample: MechanisticAtrialSampleV1,
  sx: (value: number) => number,
  sy: (value: number) => number,
  color: string,
): void {
  out.push(`<circle cx="${sx(sample.laVolumeMl)}" cy="${sy(sample.laPressureMmHg)}" r="4" fill="${color}" stroke="#08111f" stroke-width="2"/>`);
}

function nearest(values: readonly MechanisticAtrialSampleV1[], theta: number) {
  return values.reduce((best, sample) =>
    Math.abs(sample.theta - theta) < Math.abs(best.theta - theta) ? sample : best
  );
}

function scale(values: readonly number[], offset: number, span: number) {
  const low = Math.min(...values);
  const high = Math.max(...values);
  const padding = Math.max(0.08 * (high - low), 1e-6);
  return (value: number) => offset + (value - low + padding) /
    Math.max(high - low + 2 * padding, 1e-9) * span;
}

function titleFor(variantId: AtrialAVPlanePassiveBalanceVariantIdV2): string {
  return ({
    "v1-baseline": "V1 baseline | damping-dominant",
    "passive-balance": "V2 passive balance | mechanics signal, morphology fail",
    "passive-balance-la-contractility-bracket": "V2 + T_A bracket | MVF pass, crossing fail",
    "topology-only-comparator": "Topology-only comparator | passive-force sign fail",
    "k0-negative-control": "K=0 negative control",
    "passive-neutral-shift-control": "z0 shift identifiability control",
  } as const)[variantId];
}

function text(x: number, y: number, value: string, size: number, fill: string, weight = 400): string {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="Inter,Arial,sans-serif" font-size="${size}" font-weight="${weight}">${escapeXml(value)}</text>`;
}

function pct(value: number): string {
  return `${(100 * value).toFixed(1)}%`;
}

function passFail(value: boolean): "pass" | "fail" {
  return value ? "pass" : "fail";
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&apos;",
  }[character]!));
}
