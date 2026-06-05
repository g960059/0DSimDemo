import type { SimSample } from "@/engine/protocol";
import {
  lastCompleteBeat,
  phaseOf,
  positiveValvePeakInWindow,
  pulmonaryVenousShape,
  transmitralGradientStats,
} from "@/engine/verification/shapeMetrics";
import type { GateResult } from "@/engine/verification/gates";
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
      title: "LVP / AoP / LAP (mmHg)",
      series: [
        { label: "LVP", key: "LVP", color: "#a855f7" },
        { label: "AoP", key: "AoP", color: "#f472b6" },
        { label: "LAP", key: "LAP", color: "#4f46e5" },
      ] satisfies Series[],
      gates: ["lvp-aop-peak-gap", "lvp-diastolic-min", "lv-pressure-floor"],
    },
    {
      title: "QMV / QTV model flow (mL/s)",
      series: [
        { label: "QMV", key: "QMV", color: "#a855f7" },
        { label: "QTV", key: "QTV", color: "#22c55e" },
      ] satisfies Series[],
      gates: ["qmv-e-peak", "qmv-a-peak", "qmv-a-over-e", "qtv-e-peak", "qtv-a-peak", "qtv-a-over-e"],
    },
    {
      title: "PVF model flow (mL/s, not Doppler velocity)",
      series: [
        { label: "PVF", key: "PVF", color: "#38bdf8" },
      ] satisfies Series[],
      gates: ["pvf-s-peak", "pvf-d-peak", "pvf-ar-present", "pvf-s-fraction", "pvf-s-over-d", "pvf-reverse-fraction"],
    },
    {
      title: "Transmitral gradient (LAP - LVP, mmHg)",
      series: [
        { label: "MV gradient", key: "dP_MV", color: "#f59e0b" },
      ] satisfies Series[],
      gates: ["mv-gradient-forward-count", "mv-gradient-all-mean", "mv-gradient-e-mean", "mv-gradient-e-peak", "mv-gradient-a-mean", "mv-gradient-a-peak"],
    },
    {
      title: "Apparent elastance reference comparison",
      series: [
        { label: "ELV active", key: "ELV_active", color: "#a855f7" },
        { label: "ELV TVE", key: "ELV_timeVarying", color: "#f472b6" },
      ] satisfies Series[],
      gates: ["lv-active-elastance-shape"],
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
    out.push(panelFrame(24, y, width - 48, panelH - 16, panel.title));
    out.push(plotWaveform(samples, panel.series, 24, y, width - 48, panelH - 16, margin));
    out.push(legend(panel.series, width - 330, y + 24));
    out.push(gateBadges(report.gates, panel.gates, 40, y + panelH - 34, width - 80));
    if (panel.title.startsWith("QMV")) out.push(inflowMarkers(samples, 24, y, width - 48, panelH - 16, margin));
    if (panel.title.startsWith("PVF")) out.push(pvfMarkers(samples, 24, y, width - 48, panelH - 16, margin));
    if (panel.title.startsWith("Transmitral")) out.push(phaseWindowBands(24, y, width - 48, panelH - 16, margin, [
      { lo: 0.30, hi: 0.75, label: "E window" },
      { lo: 0.85, hi: 1.00, label: "A window" },
      { lo: 0.00, hi: 0.08, label: "A window" },
    ]));
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
    { title: "LV PV loop", x: "VLV", y: "LVP", color: "#a855f7", gates: ["lvp-aop-peak-gap", "lvp-diastolic-min"] },
    { title: "RV PV loop", x: "VRV", y: "RVP", color: "#22c55e", gates: ["rv-edp-presystolic", "rv-stroke-fraction", "rvp-max"] },
    { title: "LA PV loop", x: "VLA", y: "LAP", color: "#38bdf8", gates: ["la-figure-eight"] },
    { title: "RA PV loop", x: "VRA", y: "RAP", color: "#f59e0b", gates: ["ra-figure-eight", "ra-volume-max", "ra-volume-min", "ra-emptying-fraction"] },
  ] as const;
  panels.forEach((panel, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 34 + col * 590;
    const y = 76 + row * 390;
    out.push(panelFrame(x, y, 556, 350, panel.title));
    out.push(plotLoop(samples, panel.x, panel.y, panel.color, x, y, 556, 350));
    out.push(gateBadges(report.gates, panel.gates, x + 16, y + 315, 520));
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
  return [
    marker(plot, minY, maxY, qmvE, "MV E", "#a855f7"),
    marker(plot, minY, maxY, qmvA, "MV A", "#a855f7"),
    marker(plot, minY, maxY, qtvE, "TV E", "#22c55e"),
    marker(plot, minY, maxY, qtvA, "TV A", "#22c55e"),
  ].join("\n");
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

function panelFrame(x: number, y: number, width: number, height: number, title: string): string {
  return [
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="#0f172a" stroke="#334155"/>`,
    text(x + 18, y + 25, title, 16, "#e2e8f0"),
  ].join("\n");
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
