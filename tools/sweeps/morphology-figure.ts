// Canonical morphology figure generator.
// Uses engine/measure.ts measureConverged so settle, measurement window, and
// phase landmarks match the verified harness.
import { mkdirSync, writeFileSync } from "fs";
import { measureConverged, type SteadyMeasurement } from "@/engine/measure";
import { defaultParams } from "@/engine/ModelCore";
import type { SimSample } from "@/engine/protocol";

const dt = Number(process.env.DT ?? 0.001);
const sampleHz = Number(process.env.SAMPLE_HZ ?? 240);
const measureBeats = Number(process.env.MEASURE_BEATS ?? 3);
const tbvs = (process.env.TBVS ?? "5600,4800,6200")
  .split(",")
  .map((v) => Number(v.trim()))
  .filter((v) => Number.isFinite(v) && v > 0);

const outDir = "tools/sweeps/morphology-figures";
mkdirSync(outDir, { recursive: true });

type Point = [number, number];

function phaseOf(s: SimSample): number {
  return s.phi - Math.floor(s.phi);
}

function signedDeltaTheta(theta: number, ref: number): number {
  let d = theta - ref;
  if (d > 0.5) d -= 1;
  if (d < -0.5) d += 1;
  return d;
}

function beatWindow(samples: SimSample[]): SimSample[] {
  if (samples.length < 3) return samples;
  const finalBeat = Math.floor(samples.at(-1)!.phi);
  const targetBeat = finalBeat - 1;
  const start = samples.findIndex((s) => Math.floor(s.phi) === targetBeat);
  if (start < 0) return samples;
  const after = samples.findIndex((s, i) => i > start && Math.floor(s.phi) > targetBeat);
  return samples.slice(start, after >= 0 ? after + 1 : undefined);
}

function inPhase(s: SimSample, lo: number, hi: number): boolean {
  const p = phaseOf(s);
  return lo <= hi ? p >= lo && p < hi : p >= lo || p < hi;
}

function maxBy<T>(xs: T[], value: (x: T) => number): T {
  return xs.reduce((best, x) => value(x) > value(best) ? x : best, xs[0]);
}

function minMax(values: number[]): [number, number] {
  return [Math.min(...values), Math.max(...values)];
}

function padRange([min, max]: [number, number], frac = 0.08, minPad = 1): [number, number] {
  const span = Math.max(max - min, minPad);
  const pad = Math.max(span * frac, minPad);
  return [min - pad, max + pad];
}

function scaler(dmin: number, dmax: number, pmin: number, pmax: number) {
  const span = dmax - dmin || 1;
  return (v: number) => pmin + ((v - dmin) / span) * (pmax - pmin);
}

function poly(points: Point[], stroke: string, width = 1.8, dash = ""): string {
  const dashAttr = dash ? ` stroke-dasharray="${dash}"` : "";
  return `<polyline fill="none" stroke="${stroke}" stroke-width="${width}"${dashAttr} points="${points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}"/>`;
}

function dot(x: number, y: number, color: string, label: string, dx = 6, dy = -6): string {
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${color}"/><text x="${(x + dx).toFixed(1)}" y="${(y + dy).toFixed(1)}" class="label" fill="${color}">${label}</text>`;
}

function axisBox(x: number, y: number, w: number, h: number, title: string): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#101827" stroke="#314056"/>
  <text x="${x + 12}" y="${y + 22}" class="title">${title}</text>`;
}

function phaseMsRows(samples: SimSample[], refTheta: number, beatMs: number): Array<SimSample & { relMs: number }> {
  return samples
    .map((s) => ({ ...s, relMs: signedDeltaTheta(phaseOf(s), refTheta) * beatMs }))
    .sort((a, b) => a.relMs - b.relMs);
}

function maxInPhase(samples: SimSample[], key: keyof SimSample, lo: number, hi: number): SimSample {
  const selected = samples.filter((s) => inPhase(s, lo, hi));
  return maxBy(selected.length > 0 ? selected : samples, (s) => Number(s[key]));
}

function minInPhase(samples: SimSample[], key: keyof SimSample, lo: number, hi: number): SimSample {
  const selected = samples.filter((s) => inPhase(s, lo, hi));
  return (selected.length > 0 ? selected : samples).reduce((best, s) => Number(s[key]) < Number(best[key]) ? s : best);
}

function render(tbv: number, measurement: SteadyMeasurement): { svg: string; summary: Record<string, unknown> } {
  const beatMs = 60000 / Math.max(measurement.core.p.HR, 1);
  const samples = beatWindow(measurement.samples);
  const phaseTiming = measurement.phaseTiming;
  const refTheta = 0;
  const rows = phaseMsRows(samples, refTheta, beatMs);
  const xDomain: [number, number] = [-430, 360];

  const pressureAPeak = maxInPhase(samples, "LAP", 0.75, 0.15);
  const vPeak = maxInPhase(samples, "LAP", 0.25, 0.75);
  const xTrough = minInPhase(samples, "LAP", 0.25, 0.85);
  const ePeak = maxBy(rows.filter((s) => s.relMs > -430 && s.relMs < -300), (s) => Math.max(0, s.QMV));
  const aFlowPeak = maxBy(rows.filter((s) => s.relMs > -300 && s.relMs < 20), (s) => Math.max(0, s.QMV));
  const sPeak = maxInPhase(samples, "PVF", 0.05, 0.55);
  const dPeak = maxInPhase(samples, "PVF", 0.55, 0.80);
  const bodyAvailable = samples.some((s) => typeof s.VLABodyMl === "number");

  const W = 1280;
  const H = 930;
  const M = 56;
  const gap = 28;
  const topH = 310;
  const flowH = 190;
  const loopH = 270;
  const colW = (W - 2 * M - gap) / 2;
  const c = {
    bg: "#f8fafc",
    panel: "#101827",
    grid: "#314056",
    text: "#d9e2ef",
    muted: "#93a4b8",
    lap: "#f43f5e",
    lvp: "#7c3aed",
    qmv: "#0284c7",
    la: "#e11d48",
    body: "#fb7185",
    ra: "#16a34a",
    mark: "#f59e0b",
    pvf: "#0891b2",
  };

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>
    .title{font:600 15px system-ui,sans-serif;fill:${c.text}}
    .label{font:12px system-ui,sans-serif}
    .small{font:11px system-ui,sans-serif;fill:${c.muted}}
    .metric{font:12px ui-monospace,SFMono-Regular,Menlo,monospace;fill:${c.text}}
  </style>
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  <text x="${M}" y="30" style="font:700 20px system-ui,sans-serif;fill:#0f172a">Canonical atrial morphology, TBV ${tbv} mL</text>
  <text x="${M + 430}" y="30" style="font:13px ui-monospace,SFMono-Regular,Menlo,monospace;fill:#334155">measureConverged harness; dt=${dt}, sampleHz=${sampleHz}, beats=${measureBeats}</text>`;

  const ax = M, ay = 48, aw = W - 2 * M, ah = topH;
  svg += axisBox(ax, ay, aw, ah, `A. LAP and LVP overlay (independent y-scales); LAP a-wave timing vs LV upstroke`);
  const x = scaler(xDomain[0], xDomain[1], ax + 52, ax + aw - 22);
  const [lapMin, lapMax] = padRange(minMax(rows.map((s) => s.LAP)), 0.15, 0.5);
  const [lvpMin, lvpMax] = padRange([0, Math.max(...rows.map((s) => s.LVP))], 0.05, 5);
  const lapY = scaler(lapMin, lapMax, ay + ah - 36, ay + 42);
  const lvpY = scaler(lvpMin, lvpMax, ay + ah - 36, ay + 42);
  for (const ms of [-300, -200, -100, 0, 100, 200, 300, 400]) {
    const xx = x(ms);
    svg += `<line x1="${xx}" y1="${ay + 38}" x2="${xx}" y2="${ay + ah - 30}" stroke="${c.grid}" stroke-width="0.8" opacity="0.55"/><text x="${xx - 12}" y="${ay + ah - 12}" class="small">${ms}</text>`;
  }
  svg += `<text x="${ax + 12}" y="${ay + 46}" class="label" fill="${c.lap}">LAP auto-scale ${lapMin.toFixed(1)}..${lapMax.toFixed(1)} mmHg</text>`;
  svg += `<text x="${ax + aw - 230}" y="${ay + 46}" class="label" fill="${c.lvp}">LVP scale ${lvpMin.toFixed(0)}..${lvpMax.toFixed(0)} mmHg</text>`;
  svg += poly(rows.map((s) => [x(s.relMs), lvpY(s.LVP)]), c.lvp, 1.8);
  svg += poly(rows.map((s) => [x(s.relMs), lapY(s.LAP)]), c.lap, 2.2);
  const aRel = signedDeltaTheta(phaseOf(pressureAPeak), refTheta) * beatMs;
  const dPdtRel = phaseTiming.msFromVentricularPhaseZero.dPdtMax.LV ?? 0;
  svg += `<line x1="${x(0)}" y1="${ay + 38}" x2="${x(0)}" y2="${ay + ah - 30}" stroke="${c.mark}" stroke-width="1.2"/><text x="${x(0) + 4}" y="${ay + 62}" class="label" fill="${c.mark}">phase 0</text>`;
  svg += `<line x1="${x(dPdtRel)}" y1="${ay + 38}" x2="${x(dPdtRel)}" y2="${ay + ah - 30}" stroke="${c.mark}" stroke-width="1.2" stroke-dasharray="2 4"/><text x="${x(dPdtRel) + 4}" y="${ay + 78}" class="label" fill="${c.mark}">LV dP/dt max</text>`;
  svg += `<line x1="${x(aRel)}" y1="${ay + 38}" x2="${x(aRel)}" y2="${ay + ah - 30}" stroke="${c.mark}" stroke-width="1.2" stroke-dasharray="5 4"/>`;
  svg += dot(x(aRel), lapY(pressureAPeak.LAP), c.mark, `a ${aRel.toFixed(0)} ms`, 8, -8);
  svg += `<text x="${ax + 12}" y="${ay + ah - 12}" class="metric">pressure aPeak=${phaseTiming.msFromVentricularPhaseZero.pressureAPeak.LA?.toFixed(1) ?? "n/a"} ms, active aPeak=${phaseTiming.msFromVentricularPhaseZero.activeAPeak.LA?.toFixed(1) ?? "n/a"} ms</text>`;

  const bx = M, by = ay + ah + gap, bw = W - 2 * M, bh = flowH;
  svg += axisBox(bx, by, bw, bh, `B. Mitral valve flow QMV (MVF): E/A=${(Math.max(0, ePeak.QMV) / Math.max(Math.max(0, aFlowPeak.QMV), 1e-9)).toFixed(2)}`);
  const [qMin, qMax] = padRange(minMax(rows.map((s) => s.QMV)), 0.12, 20);
  const qY = scaler(qMin, qMax, by + bh - 34, by + 40);
  svg += `<line x1="${x(xDomain[0])}" y1="${qY(0)}" x2="${x(xDomain[1])}" y2="${qY(0)}" stroke="${c.grid}" stroke-width="1"/>`;
  svg += poly(rows.map((s) => [x(s.relMs), qY(s.QMV)]), c.qmv, 2);
  svg += dot(x(ePeak.relMs), qY(ePeak.QMV), c.qmv, `E ${ePeak.QMV.toFixed(0)}`, 8, -8);
  svg += dot(x(aFlowPeak.relMs), qY(aFlowPeak.QMV), c.mark, `A ${aFlowPeak.QMV.toFixed(0)}`, 8, -8);
  svg += `<text x="${bx + 12}" y="${by + bh - 12}" class="metric">PVF S=${sPeak.PVF.toFixed(1)}, D=${dPeak.PVF.toFixed(1)}, S>=D=${sPeak.PVF >= dPeak.PVF}</text>`;

  const cy = by + bh + gap;
  const cx = M;
  const dx = M + colW + gap;
  svg += axisBox(cx, cy, colW, loopH, `C. LA PV loop: total VLA vs LAP (body + reservoir sleeve)`);
  const [vlaMin, vlaMax] = padRange(minMax(samples.map((s) => s.VLA)), 0.08, 2);
  const [plaMin, plaMax] = padRange(minMax(samples.map((s) => s.LAP)), 0.15, 0.5);
  const laX = scaler(vlaMin, vlaMax, cx + 54, cx + colW - 20);
  const laY = scaler(plaMin, plaMax, cy + loopH - 38, cy + 42);
  svg += poly(samples.map((s) => [laX(s.VLA), laY(s.LAP)]), c.la, 2.1);
  svg += dot(laX(vPeak.VLA), laY(vPeak.LAP), c.la, `v ${vPeak.LAP.toFixed(1)}`, 8, -8);
  svg += dot(laX(pressureAPeak.VLA), laY(pressureAPeak.LAP), c.mark, `a ${pressureAPeak.LAP.toFixed(1)}`, 8, 14);
  const bodyRangeText = bodyAvailable
    ? `; body ${Math.min(...samples.map((s) => s.VLABodyMl ?? Infinity)).toFixed(1)}..${Math.max(...samples.map((s) => s.VLABodyMl ?? -Infinity)).toFixed(1)} mL`
    : "";
  svg += `<text x="${cx + 16}" y="${cy + loopH - 13}" class="metric">total VLA ${measurement.LA.volumeMin.toFixed(1)}..${measurement.LA.volumeMax.toFixed(1)} mL${bodyRangeText}, LAEF=${measurement.LA.emptyingFraction.toFixed(2)}, v/a=${(measurement.LA.vPeak / Math.max(measurement.LA.aPeak, 1e-9)).toFixed(2)}</text>`;

  svg += axisBox(dx, cy, colW, loopH, `D. RA PV loop: total VRA vs RAP`);
  const [vraMin, vraMax] = padRange(minMax(samples.map((s) => s.VRA)), 0.08, 2);
  const [praMin, praMax] = padRange(minMax(samples.map((s) => s.RAP)), 0.15, 0.5);
  const raX = scaler(vraMin, vraMax, dx + 54, dx + colW - 20);
  const raY = scaler(praMin, praMax, cy + loopH - 38, cy + 42);
  svg += poly(samples.map((s) => [raX(s.VRA), raY(s.RAP)]), c.ra, 2.1);
  svg += `<text x="${dx + 16}" y="${cy + loopH - 13}" class="metric">VRA ${measurement.RA.volumeMin.toFixed(1)}..${measurement.RA.volumeMax.toFixed(1)} mL, RAEF=${measurement.RA.emptyingFraction.toFixed(2)}, selfX=${measurement.RA.selfIntersections}</text>`;

  svg += `<text x="${M}" y="${H - 20}" style="font:12px system-ui,sans-serif;fill:#475569">Volume note: LA loop uses total VLA (body + reservoir sleeve), the conserved chamber blood volume; VLABodyMl is reported separately.</text>
  </svg>`;

  const summary = {
    tbv,
    outputVolumeDefinition: "LA PV loop uses total VLA=body+sleeve; VLABodyMl range is reported separately when available.",
    settle: measurement.settleStatus,
    metrics: {
      LAPMean: round(measurement.metrics.LAPMean, 3),
      RAPMean: round(measurement.metrics.RAPMean, 3),
      CO_L: round(measurement.metrics.CO_L, 3),
      CO_R: round(measurement.metrics.CO_R, 3),
      LAEF: round(measurement.LA.emptyingFraction, 4),
      RAEF: round(measurement.RA.emptyingFraction, 4),
      vOverA: round(measurement.LA.vPeak / Math.max(measurement.LA.aPeak, 1e-9), 4),
      vMinusA: round(measurement.LA.vPeak - measurement.LA.aPeak, 4),
      pressureAPeakMs: round(phaseTiming.msFromVentricularPhaseZero.pressureAPeak.LA ?? NaN, 3),
      activeAPeakMs: round(phaseTiming.msFromVentricularPhaseZero.activeAPeak.LA ?? NaN, 3),
      dPdtMaxMs: round(phaseTiming.msFromVentricularPhaseZero.dPdtMax.LV ?? NaN, 3),
      qmvE: round(ePeak.QMV, 3),
      qmvA: round(aFlowPeak.QMV, 3),
      qmvEOverA: round(Math.max(0, ePeak.QMV) / Math.max(Math.max(0, aFlowPeak.QMV), 1e-9), 4),
      pvfS: round(sPeak.PVF, 3),
      pvfD: round(dPeak.PVF, 3),
      pvfSPeakGeDPeak: sPeak.PVF >= dPeak.PVF,
      totalVLA: [round(measurement.LA.volumeMin, 3), round(measurement.LA.volumeMax, 3)],
      vlaBody: bodyAvailable ? [round(Math.min(...samples.map((s) => s.VLABodyMl ?? Infinity)), 3), round(Math.max(...samples.map((s) => s.VLABodyMl ?? -Infinity)), 3)] : null,
      totalVRA: [round(measurement.RA.volumeMin, 3), round(measurement.RA.volumeMax, 3)],
      laSelfIntersections: measurement.LA.selfIntersections,
      raSelfIntersections: measurement.RA.selfIntersections,
      projectorQuiet: measurement.projectorQuiet,
      tbvDriftMl: round(measurement.tbvDriftMl, 6),
      venousResidualMl: round(measurement.venousBalances.maxResidualMl, 6),
    },
  };
  return { svg, summary };
}

function round(v: number, digits = 3): number | null {
  if (!Number.isFinite(v)) return null;
  const m = 10 ** digits;
  return Math.round(v * m) / m;
}

const summaries: Record<string, unknown>[] = [];
for (const tbv of tbvs) {
  const measurement = measureConverged(defaultParams(), { targetTBV: tbv, dt, sampleHz, measureBeats });
  const { svg, summary } = render(tbv, measurement);
  const svgPath = `${outDir}/canonical-morphology-tbv${tbv}.svg`;
  writeFileSync(svgPath, svg);
  summaries.push({ ...summary, svgPath });
}

const summaryPath = `${outDir}/canonical-morphology-summary.json`;
writeFileSync(summaryPath, `${JSON.stringify(summaries, null, 2)}\n`);
console.log(JSON.stringify({ outDir, summaryPath, summaries }, null, 2));
