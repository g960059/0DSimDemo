import type { SimSample } from "@/engine/protocol";
import {
  contiguousFillingRuns,
  lastCompleteBeat,
  localExtrema,
  phaseInWindow,
  phaseOf,
  positiveValvePeaksDetailed,
  positiveValvePeakInWindow,
  pulmonaryVenousShape,
} from "@/engine/verification/shapeMetrics";
import type { GateResult } from "@/engine/verification/gates";
import {
  VERIFICATION_PV_LOOP_PANELS,
  VERIFICATION_WAVEFORM_PANELS,
} from "@/engine/verification/panels";
import type { VerificationReport } from "@/engine/verification/report";

export type VerificationSvgArtifacts = {
  "waveforms.svg": string;
  "pv-loops.svg": string;
};

type Series = {
  label: string;
  key: keyof SimSample;
  color: string;
};

const SVG_NS = "http://www.w3.org/2000/svg";

export function generateVerificationSvgs(report: VerificationReport): VerificationSvgArtifacts {
  const samples = report.measurement ? lastCompleteBeat(report.measurement.samples) : [];
  return {
    "waveforms.svg": waveformsSvg(report, samples),
    "pv-loops.svg": pvLoopsSvg(report, samples),
  };
}

function waveformsSvg(report: VerificationReport, samples: SimSample[]): string {
  const width = 1200;
  const panelH = 230;
  const margin = { left: 70, right: 28, top: 42, bottom: 34 };
  const panels = [
    {
      ...VERIFICATION_WAVEFORM_PANELS[0],
      series: [
        { label: "LVP", key: "LVP", color: "#a855f7" },
        { label: "AoP", key: "AoP", color: "#f472b6" },
        { label: "LAP", key: "LAP", color: "#4f46e5" },
      ] satisfies Series[],
    },
    {
      ...VERIFICATION_WAVEFORM_PANELS[1],
      series: [
        { label: "QMV", key: "QMV", color: "#a855f7" },
        { label: "QTV", key: "QTV", color: "#22c55e" },
      ] satisfies Series[],
    },
    {
      ...VERIFICATION_WAVEFORM_PANELS[2],
      series: [
        { label: "PVF", key: "PVF", color: "#38bdf8" },
      ] satisfies Series[],
    },
    {
      ...VERIFICATION_WAVEFORM_PANELS[3],
      series: [
        { label: "MV gradient", key: "dP_MV", color: "#f59e0b" },
      ] satisfies Series[],
    },
    {
      ...VERIFICATION_WAVEFORM_PANELS[4],
      series: [
        { label: "ELV active", key: "ELV_active", color: "#a855f7" },
        { label: "ELV TVE", key: "ELV_timeVarying", color: "#f472b6" },
      ] satisfies Series[],
    },
  ];
  const height = panelH * panels.length + 88;
  const out: string[] = [svgOpen(width, height)];
  out.push(header(report, width, "Verification Waveforms"));
  if (samples.length === 0) {
    out.push(text(40, 110, "No complete beat available.", 18, "#e2e8f0"));
    out.push("</svg>");
    return out.join("\n");
  }
  panels.forEach((panel, index) => {
    const y = 68 + index * panelH;
    out.push(`<g id="${escapeXml(panel.id)}">`);
    out.push(panelFrame(24, y, width - 48, panelH - 16, panel.title, failedGateCount(report.gates, panel.gateIds)));
    out.push(plotWaveform(samples, panel.series, 24, y, width - 48, panelH - 16, margin));
    out.push(legend(panel.series, width - 330, y + 24));
    out.push(gateBadges(report.gates, panel.gateIds, 40, y + panelH - 34, width - 80));
    if (panel.id === "pressures") out.push(lapExtremaMarkers(samples, 24, y, width - 48, panelH - 16, margin));
    if (panel.title.startsWith("QMV")) out.push(inflowMarkers(samples, 24, y, width - 48, panelH - 16, margin));
    if (panel.title.startsWith("PVF")) out.push(pvfMarkers(samples, 24, y, width - 48, panelH - 16, margin));
    if (panel.title.startsWith("Transmitral")) out.push(phaseWindowBands(24, y, width - 48, panelH - 16, margin, [
      { lo: 0.30, hi: 0.75, label: "E window" },
      { lo: 0.85, hi: 1.00, label: "A window" },
      { lo: 0.00, hi: 0.08, label: "A window" },
    ]));
    out.push("</g>");
  });
  out.push("</svg>");
  return out.join("\n");
}

function pvLoopsSvg(report: VerificationReport, samples: SimSample[]): string {
  const width = 1200;
  const height = 840;
  const out: string[] = [svgOpen(width, height), header(report, width, "Verification PV Loops")];
  if (samples.length === 0) {
    out.push(text(40, 110, "No complete beat available.", 18, "#e2e8f0"));
    out.push("</svg>");
    return out.join("\n");
  }
  const panels = [
    { ...VERIFICATION_PV_LOOP_PANELS[0], x: "VLV", y: "LVP", color: "#a855f7" },
    { ...VERIFICATION_PV_LOOP_PANELS[1], x: "VRV", y: "RVP", color: "#22c55e" },
    { ...VERIFICATION_PV_LOOP_PANELS[2], x: "VLA", y: "LAP", color: "#38bdf8" },
    { ...VERIFICATION_PV_LOOP_PANELS[3], x: "VRA", y: "RAP", color: "#f59e0b" },
  ] as const;
  panels.forEach((panel, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 34 + col * 590;
    const y = 76 + row * 390;
    out.push(`<g id="${escapeXml(panel.id)}">`);
    out.push(panelFrame(x, y, 556, 350, panel.title, failedGateCount(report.gates, panel.gateIds)));
    out.push(plotLoop(samples, panel.x, panel.y, panel.color, x, y, 556, 350, panel.id === "lv-pv-loop"));
    out.push(gateBadges(report.gates, panel.gateIds, x + 16, y + 315, 520));
    out.push("</g>");
  });
  out.push("</svg>");
  return out.join("\n");
}

function plotWaveform(
  samples: SimSample[],
  series: Series[],
  x: number,
  y: number,
  width: number,
  height: number,
  margin: { left: number; right: number; top: number; bottom: number },
): string {
  const plot = plotRect(x, y, width, height, margin);
  const values = series.flatMap((s) => samples.map((sample) => Number(sample[s.key])));
  const [minY, maxY] = paddedRange(values);
  const out: string[] = [grid(plot.x, plot.y, plot.w, plot.h, minY, maxY)];
  for (const s of series) {
    const points = samples
      .map((sample) => `${scale(phaseOf(sample), 0, 1, plot.x, plot.x + plot.w)},${scale(Number(sample[s.key]), minY, maxY, plot.y + plot.h, plot.y)}`)
      .join(" ");
    out.push(`<polyline points="${points}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`);
  }
  out.push(axisLabels(plot.x, plot.y, plot.w, plot.h, minY, maxY));
  return out.join("\n");
}

function plotLoop(
  samples: SimSample[],
  xKey: keyof SimSample,
  yKey: keyof SimSample,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number,
  showFillingEdge = false,
): string {
  const plot = plotRect(x, y, width, height, { left: 58, right: 24, top: 42, bottom: 44 });
  const xs = samples.map((sample) => Number(sample[xKey]));
  const ys = samples.map((sample) => Number(sample[yKey]));
  const [minX, maxX] = paddedRange(xs);
  const [minY, maxY] = paddedRange(ys);
  const points = samples
    .map((sample) => `${scale(Number(sample[xKey]), minX, maxX, plot.x, plot.x + plot.w)},${scale(Number(sample[yKey]), minY, maxY, plot.y + plot.h, plot.y)}`)
    .join(" ");
  const last = samples.at(-1)!;
  const markerX = scale(Number(last[xKey]), minX, maxX, plot.x, plot.x + plot.w);
  const markerY = scale(Number(last[yKey]), minY, maxY, plot.y + plot.h, plot.y);
  return [
    grid(plot.x, plot.y, plot.w, plot.h, minY, maxY),
    `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`,
    showFillingEdge ? fillingEdgeOverlay(samples, plot, minX, maxX, minY, maxY) : "",
    `<circle cx="${markerX}" cy="${markerY}" r="4" fill="${color}"/>`,
    text(plot.x + plot.w / 2 - 48, y + height - 15, "Volume (mL)", 12, "#94a3b8"),
    text(x + 12, plot.y + 18, "Pressure (mmHg)", 12, "#94a3b8"),
  ].join("\n");
}

function inflowMarkers(samples: SimSample[], x: number, y: number, width: number, height: number, margin: any): string {
  const plot = plotRect(x, y, width, height, margin);
  const [minY, maxY] = paddedRange(samples.flatMap((sample) => [sample.QMV, sample.QTV]));
  const qmvE = positiveValvePeakInWindow(samples, "QMV", 0.30, 0.75);
  const qmvA = positiveValvePeakInWindow(samples, "QMV", 0.85, 0.08);
  const qtvE = positiveValvePeakInWindow(samples, "QTV", 0.30, 0.75);
  const qtvA = positiveValvePeakInWindow(samples, "QTV", 0.85, 0.08);
  const qmvPeaks = positiveValvePeaksDetailed(samples, "QMV", 0.12, 20);
  const ePeak = qmvPeaks.filter((peak) => phaseInWindow(peak.theta, 0.30, 0.75)).sort((a, b) => b.value - a.value)[0];
  const aPeak = qmvPeaks.filter((peak) => phaseInWindow(peak.theta, 0.85, 0.08)).sort((a, b) => b.value - a.value)[0];
  const extraQmvPeaks = qmvPeaks.filter((peak) => peak !== ePeak && peak !== aPeak);
  return [
    marker(plot, minY, maxY, qmvE, "MV E", "#a855f7"),
    marker(plot, minY, maxY, qmvA, "MV A", "#a855f7"),
    marker(plot, minY, maxY, qtvE, "TV E", "#22c55e"),
    marker(plot, minY, maxY, qtvA, "TV A", "#22c55e"),
    ...extraQmvPeaks.map((peak, index) => marker(plot, minY, maxY, peak, `extra ${index + 1}`, "#fb923c")),
  ].join("\n");
}

function lapExtremaMarkers(samples: SimSample[], x: number, y: number, width: number, height: number, margin: any): string {
  const plot = plotRect(x, y, width, height, margin);
  const [minY, maxY] = paddedRange(samples.flatMap((sample) => [sample.LVP, sample.AoP, sample.LAP]));
  const lapRange = Math.max(...samples.map((sample) => sample.LAP)) - Math.min(...samples.map((sample) => sample.LAP));
  const prominence = Math.max(0.35, 0.12 * lapRange);
  const peaks = localExtrema(samples, "LAP", "max", prominence);
  const troughs = localExtrema(samples, "LAP", "min", prominence);
  return [
    ...peaks.map((peak, index) => marker(plot, minY, maxY, peak, `LAP peak ${index + 1}`, "#818cf8")),
    ...troughs.map((peak, index) => marker(plot, minY, maxY, peak, `LAP trough ${index + 1}`, "#818cf8")),
  ].join("\n");
}

function fillingEdgeOverlay(
  samples: SimSample[],
  plot: { x: number; y: number; w: number; h: number },
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
): string {
  const runs = contiguousFillingRuns(samples).filter((run) => run.length >= 5);
  return runs.map((run, index) => {
    const points = run
      .map((sample) => `${scale(sample.VLV, minX, maxX, plot.x, plot.x + plot.w)},${scale(sample.LVP, minY, maxY, plot.y + plot.h, plot.y)}`)
      .join(" ");
    const first = run[0];
    const labelX = scale(first.VLV, minX, maxX, plot.x, plot.x + plot.w);
    const labelY = scale(first.LVP, minY, maxY, plot.y + plot.h, plot.y);
    return [
      `<polyline points="${points}" fill="none" stroke="#facc15" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" opacity="0.75"><title>LV filling edge run ${index + 1}</title></polyline>`,
      text(labelX + 6, labelY - 6, `fill ${index + 1}`, 11, "#facc15"),
    ].join("\n");
  }).join("\n");
}

function pvfMarkers(samples: SimSample[], x: number, y: number, width: number, height: number, margin: any): string {
  const plot = plotRect(x, y, width, height, margin);
  const [minY, maxY] = paddedRange(samples.map((sample) => sample.PVF));
  const pvf = pulmonaryVenousShape(samples);
  const out = [
    phaseWindowBands(x, y, width, height, margin, [
      { lo: 0.05, hi: 0.45, label: "S window" },
      { lo: 0.45, hi: 0.80, label: "D window" },
      { lo: 0.84, hi: 0.98, label: "Ar window" },
    ]),
    marker(plot, minY, maxY, pvf.sPeak, "S", "#38bdf8"),
    marker(plot, minY, maxY, pvf.dPeak, "D", "#38bdf8"),
    marker(plot, minY, maxY, pvf.arTrough, "Ar", "#38bdf8"),
  ];
  return out.join("\n");
}

function phaseWindowBands(
  x: number,
  y: number,
  width: number,
  height: number,
  margin: { left: number; right: number; top: number; bottom: number },
  bands: Array<{ lo: number; hi: number; label: string }>,
): string {
  const plot = plotRect(x, y, width, height, margin);
  return bands.map((band) => {
    const x1 = scale(band.lo, 0, 1, plot.x, plot.x + plot.w);
    const x2 = scale(band.hi, 0, 1, plot.x, plot.x + plot.w);
    const w = Math.max(2, x2 - x1);
    return `<rect x="${x1}" y="${plot.y}" width="${w}" height="${plot.h}" fill="#475569" opacity="0.12"><title>${escapeXml(band.label)}</title></rect>`;
  }).join("\n");
}

function marker(
  plot: { x: number; y: number; w: number; h: number },
  minY: number,
  maxY: number,
  peak: { theta: number; value: number } | null,
  label: string,
  color: string,
): string {
  if (!peak) return "";
  const cx = scale(peak.theta, 0, 1, plot.x, plot.x + plot.w);
  const cy = scale(peak.value, minY, maxY, plot.y + plot.h, plot.y);
  return `<circle cx="${cx}" cy="${cy}" r="4" fill="${color}"/><text x="${cx + 6}" y="${cy - 6}" fill="${color}" font-size="11">${escapeXml(label)}</text>`;
}

function gateBadges(gates: GateResult[], ids: readonly string[], x: number, y: number, maxWidth: number): string {
  let cx = x;
  let cy = y;
  const out: string[] = [];
  for (const id of ids) {
    const gate = gates.find((g) => g.id === id);
    if (!gate) continue;
    const label = `${gate.status.toUpperCase()} ${gate.id}`;
    const w = Math.min(maxWidth, 8 * label.length + 18);
    if (cx + w > x + maxWidth) {
      cx = x;
      cy += 24;
    }
    const fill = gate.status === "pass" ? "#064e3b" : "#7f1d1d";
    const stroke = gate.status === "pass" ? "#34d399" : "#f87171";
    out.push(`<rect x="${cx}" y="${cy - 15}" width="${w}" height="19" rx="4" fill="${fill}" stroke="${stroke}" opacity="0.9"><title>${escapeXml(gate.message)} value=${escapeXml(String(gate.value ?? ""))} threshold=${escapeXml(gate.threshold ?? "")}</title></rect>`);
    out.push(text(cx + 8, cy - 1, label, 10, "#e2e8f0"));
    cx += w + 6;
  }
  return out.join("\n");
}

function legend(series: Series[], x: number, y: number): string {
  return series.map((s, i) => {
    const yy = y + i * 18;
    return `<line x1="${x}" y1="${yy}" x2="${x + 18}" y2="${yy}" stroke="${s.color}" stroke-width="3"/><text x="${x + 26}" y="${yy + 4}" fill="#cbd5e1" font-size="12">${escapeXml(s.label)}</text>`;
  }).join("\n");
}

function panelFrame(x: number, y: number, width: number, height: number, title: string, failedCount = 0): string {
  const badge = failedCount > 0
    ? `<rect x="${x + width - 92}" y="${y + 10}" width="74" height="22" rx="4" fill="#7f1d1d" stroke="#f87171"/><text x="${x + width - 82}" y="${y + 26}" fill="#fee2e2" font-family="Inter, system-ui, sans-serif" font-size="11">${failedCount} failed</text>`
    : "";
  return [
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="#0f172a" stroke="#334155"/>`,
    text(x + 18, y + 25, title, 16, "#e2e8f0"),
    badge,
  ].join("\n");
}

function failedGateCount(gates: GateResult[], ids: readonly string[]): number {
  return ids.filter((id) => gates.some((gate) => gate.id === id && gate.status === "fail")).length;
}

function header(report: VerificationReport, width: number, title: string): string {
  return [
    `<rect x="0" y="0" width="${width}" height="56" fill="#020617"/>`,
    text(24, 34, `${title} - ${report.profile.mode} / ${report.gateSet}`, 20, "#f8fafc"),
    text(width - 360, 34, `Generated ${escapeXml(report.generatedAt)}`, 12, "#94a3b8"),
  ].join("\n");
}

function grid(x: number, y: number, width: number, height: number, minY: number, maxY: number): string {
  const out: string[] = [];
  for (let i = 0; i <= 4; i++) {
    const yy = y + (height * i) / 4;
    out.push(`<line x1="${x}" y1="${yy}" x2="${x + width}" y2="${yy}" stroke="#334155" stroke-width="1"/>`);
    out.push(text(x - 44, yy + 4, String(round(scale(yy, y + height, y, minY, maxY), 1)), 11, "#94a3b8"));
  }
  for (let i = 0; i <= 4; i++) {
    const xx = x + (width * i) / 4;
    out.push(`<line x1="${xx}" y1="${y}" x2="${xx}" y2="${y + height}" stroke="#1e293b" stroke-width="1"/>`);
    out.push(text(xx - 8, y + height + 18, String(round(i / 4, 2)), 11, "#94a3b8"));
  }
  return out.join("\n");
}

function axisLabels(x: number, y: number, width: number, height: number, minY: number, maxY: number): string {
  return [
    text(x + width - 70, y + height + 18, "phase", 11, "#94a3b8"),
    text(x - 50, y + 12, `${round(maxY, 1)}`, 11, "#94a3b8"),
    text(x - 50, y + height, `${round(minY, 1)}`, 11, "#94a3b8"),
  ].join("\n");
}

function plotRect(x: number, y: number, width: number, height: number, margin: { left: number; right: number; top: number; bottom: number }) {
  return {
    x: x + margin.left,
    y: y + margin.top,
    w: width - margin.left - margin.right,
    h: height - margin.top - margin.bottom,
  };
}

function paddedRange(values: number[]): [number, number] {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return [0, 1];
  let min = Math.min(...finite);
  let max = Math.max(...finite);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = 0.08 * (max - min);
  return [min - pad, max + pad];
}

function scale(value: number, srcMin: number, srcMax: number, dstMin: number, dstMax: number): number {
  if (srcMax === srcMin) return 0.5 * (dstMin + dstMax);
  return dstMin + ((value - srcMin) / (srcMax - srcMin)) * (dstMax - dstMin);
}

function svgOpen(width: number, height: number): string {
  return `<svg xmlns="${SVG_NS}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="verification artifact"><rect width="100%" height="100%" fill="#020617"/>`;
}

function text(x: number, y: number, value: string, size: number, fill: string): string {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="Inter, system-ui, sans-serif" font-size="${size}">${escapeXml(value)}</text>`;
}

function round(value: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
