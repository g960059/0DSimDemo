import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  runWorkConjugateAtrialAVPlaneBenchV1,
  type WorkConjugateAtrialAVPlaneProfileV1,
  type WorkConjugateAtrialAVPlaneSampleV1,
  type WorkConjugateAtrialAVPlaneVariantV1,
} from "@/engine/mechanics2/benches/WorkConjugateAtrialAVPlaneBenchV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const visualDir = resolve(repoRoot, "data/mechanics2/visuals");
const report = runWorkConjugateAtrialAVPlaneBenchV1();
const canonical = variant("canonical-quasistatic-wall-viscous");

const outputs = [
  [
    "work-conjugate-atrial-av-plane-normal-hr75-review.svg",
    renderComposite(),
  ],
  [
    "work-conjugate-atrial-av-plane-normal-hr75-pv-loop.svg",
    renderPvOnly(),
  ],
  [
    "work-conjugate-atrial-av-plane-order-ablation-review.svg",
    renderAblation(),
  ],
] as const;

mkdirSync(visualDir, { recursive: true });
for (const [filename, svg] of outputs) {
  writeFileSync(resolve(visualDir, filename), `${svg}\n`);
  console.log(`data/mechanics2/visuals/${filename}`);
}

function renderComposite(): string {
  const width = 1600;
  const height = 1320;
  const out = svgStart(width, height);
  const profile = canonical.profile;
  out.push(title(
    "Work-conjugate atrial AV-plane V1 | canonical HR75 sidecar",
    "Not LeftHeartSubsystemV2 runtime. No P_mem/P_relief/P_LV_recv; no independent AV spring K; no hidden volume/source. Morphology/MVF are diagnostics.",
  ));
  renderPvPanel(out, 36, 112, 720, 430, profile, true);
  renderTimePanel(out, 800, 112, 760, 230, "MVF / PVF", "flow Q (mL/s)", [
    series(profile.samples, "qMitralMlPerSec", "#60a5fa", "Q_MV"),
    series(profile.samples, "qPulmonaryVenousMlPerSec", "#f59e0b", "Q_PV"),
  ]);
  renderTimePanel(out, 800, 380, 760, 230, "LAP / LVP / AoP", "pressure P (mmHg)", [
    series(profile.samples, "laPressureMmHg", "#38bdf8", "LAP"),
    series(profile.samples, "lvPressureMmHg", "#f87171", "LVP"),
    series(profile.samples, "aorticPressureMmHg", "#fbbf24", "AoP"),
  ]);
  renderTimePanel(out, 36, 580, 720, 250, "z / u / activation", "z (cm), u (cm/s), activation (-)", [
    series(profile.samples, "avPlanePositionCm", "#22c55e", "z cm"),
    series(profile.samples, "avPlaneVelocityCmPerSec", "#a78bfa", "u cm/s"),
    series(profile.samples, "laActivation01", "#f472b6", "LA act"),
    series(profile.samples, "lvActivation01", "#fb7185", "LV act"),
  ]);
  renderTimePanel(out, 800, 628, 760, 250, "LA/LV z-force axis totals", "force F_z (N)", [
    customSeries(profile.samples, (sample) => sample.laZForceN.total, "#38bdf8", "LA Fz"),
    customSeries(profile.samples, (sample) => sample.lvZForceN.total, "#f87171", "LV Fz"),
    customSeries(profile.samples, (sample) => sample.avForce.wallForceSumN, "#fbbf24", "sum"),
    customSeries(profile.samples, (sample) => sample.avForce.forceResidualN, "#22c55e", "resid"),
  ]);
  renderSummary(out, 36, 890, 1524, 360);
  out.push(text(36, 1290, `Generated from ${report.reportId}; raw report values are unrounded, SVG labels are display-rounded.`, 12, "#64748b"));
  out.push("</svg>");
  return out.join("\n");
}

function renderPvOnly(): string {
  const width = 1200;
  const height = 900;
  const out = svgStart(width, height);
  out.push(title(
    "Canonical HR75 LA blood-volume PV loop",
    "Sidecar diagnostic, not LeftHeartSubsystemV2 runtime. Phase colors are display diagnostics; true A/v lobe metrics come from LaPvLobeMeasurementV2.",
  ));
  renderPvPanel(out, 70, 115, 1060, 610, canonical.profile, true);
  const p = canonical.profile;
  const lobeStatus = p.laPvLobes.status === "measurable"
    ? "measurable (one true crossing)"
    : `not measurable (${p.laPvLobes.reason})`;
  out.push(text(70, 770, `true LA PV lobes: ${lobeStatus}; A/v=${fmt(p.laPvLobes.aLoopAreaMmHgMl)}/${fmt(p.laPvLobes.vLoopAreaMmHgMl)} mmHg mL; ratio=${fmt(p.laPvLobes.aToVAreaRatio)}; angle=${fmt(p.laPvLobes.crossingAngleDeg)} deg`, 16, "#e2e8f0", 700));
  out.push(text(70, 802, `conduit-below-reservoir=${pct(p.pathOrdering.conduitBeforeCrossingBelowReservoirPathFraction)}; pumping-above-reservoir=${pct(p.pathOrdering.pumpingAfterCrossingAboveReservoirPathFraction)}; x-depth=${fmt(p.xvyPressureReadback.xDescentDepthMmHg)} mmHg (limitation, not tuned)`, 14, "#cbd5e1"));
  out.push(text(70, 834, `MV E/A peak=${fmt(p.mitral.peakEToARatio)}; E/A VTI=${fmt(p.mitral.vtiEToARatio)}; PV S/D=${fmt(p.pulmonaryVenous.sToDRatio)}; z excursion=${fmt(p.zRangeCm[1] - p.zRangeCm[0])} cm`, 14, "#cbd5e1"));
  out.push("</svg>");
  return out.join("\n");
}

function renderAblation(): string {
  const width = 1500;
  const height = 920;
  const out = svgStart(width, height);
  out.push(title(
    "Order / control overlay",
    "Canonical and controls share the same work-conjugate sidecar; activation-timing-sensitivity is a transparent external-review hypothesis test, not acceptance.",
  ));
  const selected = report.variants;
  const samples = selected.flatMap((row) => row.profile.samples);
  const plot = { x: 142, y: 155, w: 788, h: 500 };
  const sx = linearScale(samples.map((sample) => sample.laVolumeMl), plot.x, plot.x + plot.w);
  const sy = linearScale(samples.map((sample) => sample.laPressureMmHg), plot.y + plot.h, plot.y);
  panel(out, 60, 105, 910, 610, "LA PV overlay");
  grid(out, plot.x, plot.y, plot.w, plot.h);
  renderAxes(
    out,
    plot,
    sx,
    sy,
    "LA blood volume V_LA (mL)",
    "LA pressure P_LA (mmHg)",
  );
  selected.forEach((row, index) => {
    drawLine(out, row.profile.samples, sx.map, sy.map, palette(index), 2.2, row.variantId === canonical.variantId ? 4 : 2.2);
  });
  selected.forEach((row, index) => {
    const y = 138 + index * 28;
    out.push(`<line x1="1000" y1="${y}" x2="1035" y2="${y}" stroke="${palette(index)}" stroke-width="4"/>`);
    out.push(text(1044, y + 5, row.variantId, 12, "#cbd5e1", row.variantId === canonical.variantId ? 700 : 400));
  });
  renderVariantTable(out, 1000, 330, 430, 420, selected);
  out.push(text(60, 860, "Legacy M=1.1 is retained as a nonperiodic negative control. Morphology rows are diagnostic pending owner visual review.", 13, "#94a3b8"));
  out.push("</svg>");
  return out.join("\n");
}

function renderPvPanel(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  profile: WorkConjugateAtrialAVPlaneProfileV1,
  annotateEvents: boolean,
): void {
  panel(out, x, y, w, h, "LA blood-volume PV phases");
  legend(out, x + 20, y + 54, w - 40, [
    ["reservoir", "#38bdf8"],
    ["conduit", "#f59e0b"],
    ["pumping", "#f472b6"],
  ]);
  const plot = { x: x + 84, y: y + 82, w: w - 116, h: h - 170 };
  const sx = linearScale(
    profile.samples.map((sample) => sample.laVolumeMl),
    plot.x,
    plot.x + plot.w,
  );
  const sy = linearScale(
    profile.samples.map((sample) => sample.laPressureMmHg),
    plot.y + plot.h,
    plot.y,
  );
  grid(out, plot.x, plot.y, plot.w, plot.h);
  renderAxes(
    out,
    plot,
    sx,
    sy,
    "LA blood volume V_LA (mL)",
    "LA pressure P_LA (mmHg)",
  );
  const phases = phasePaths(profile);
  drawLine(out, phases.reservoir, sx.map, sy.map, "#38bdf8", 4);
  drawLine(out, phases.conduit, sx.map, sy.map, "#f59e0b", 4);
  drawLine(out, phases.pumping, sx.map, sy.map, "#f472b6", 4);
  if (annotateEvents) {
    marker(out, nearestTheta(profile.samples, profile.xvyPressureReadback.mvcTheta), sx.map, sy.map, "#22c55e", "MVC");
    marker(out, nearestTheta(profile.samples, profile.xvyPressureReadback.mvoTheta), sx.map, sy.map, "#fbbf24", "MVO");
    for (const crossing of profile.laPvLobes.crossings.slice(0, 3)) {
      out.push(`<circle cx="${sx.map(crossing.volumeMl)}" cy="${sy.map(crossing.pressureMmHg)}" r="6" fill="none" stroke="#e2e8f0" stroke-width="2"/>`);
    }
  }
  out.push(text(x + 20, y + h - 16, `A/v ${fmt(profile.laPvLobes.aLoopAreaMmHgMl)} / ${fmt(profile.laPvLobes.vLoopAreaMmHgMl)} | E/A ${fmt(profile.mitral.peakEToARatio)} | x ${fmt(profile.xvyPressureReadback.xDescentDepthMmHg)} mmHg`, 12, "#cbd5e1"));
}

function renderTimePanel(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  titleValue: string,
  yAxisLabel: string,
  rows: readonly PlotSeries[],
): void {
  panel(out, x, y, w, h, titleValue);
  legend(out, x + 18, y + 52, w - 36, rows.map((row) => [row.label, row.color]));
  const plot = { x: x + 66, y: y + 72, w: w - 88, h: h - 116 };
  const sx = linearScale([0, 1], plot.x, plot.x + plot.w, 0);
  const sy = linearScale(
    rows.flatMap((row) => row.values.map((point) => point.value)),
    plot.y + plot.h,
    plot.y,
  );
  grid(out, plot.x, plot.y, plot.w, plot.h);
  renderAxes(out, plot, sx, sy, "cycle phase theta (-)", yAxisLabel);
  rows.forEach((row) => {
    const d = row.values.map((point, index) =>
      `${index === 0 ? "M" : "L"}${sx.map(point.theta).toFixed(2)},${sy.map(point.value).toFixed(2)}`
    ).join(" ");
    out.push(`<path d="${d}" fill="none" stroke="${row.color}" stroke-width="2.2" stroke-linejoin="round"/>`);
  });
}

function renderSummary(out: string[], x: number, y: number, w: number, h: number): void {
  panel(out, x, y, w, h, "Hard-gate and diagnostic readback");
  const p = canonical.profile;
  const lines = [
    `hard gates: ${canonical.hardGates.allHardGatesPass ? "pass" : "fail"} | numeric=${p.allFinite} solver=${p.allStepsConverged} accepted=${p.allAcceptedSteps} periodic=${canonical.hardGates.periodicity} mass=${canonical.hardGates.closedVolumeMass} hidden=${canonical.hardGates.hiddenSourceExactlyZero}`,
    `residuals: max norm=${sci(p.residualExtrema.maxNormalizedEquationResidual)}; mass=${sci(p.residualExtrema.maxAbsMassResidualMl)} mL; wall raw=${sci(p.residualExtrema.maxAbsWallRawPowerResidualW)} W; AV force=${sci(p.residualExtrema.maxAbsAvPlaneForceResidualN)} N`,
    `pressure-area=${sci(p.residualExtrema.maxAbsPressureAreaIdentityResidualN)} N; coupled power=${sci(p.residualExtrema.maxAbsCoupledRawPowerResidualW)} W; total volume drift=${sci(p.residualExtrema.maxAbsTotalVolumeDriftMl)} mL`,
    `static passive reference dF/dz=${fmt(p.staticPassiveReference.netForceDerivativeNPerCm)} N/cm (<0 required); hidden source=${p.residualExtrema.maxHiddenBloodVolumeSourceMl}`,
    `MV: E/A peak=${fmt(p.mitral.peakEToARatio)}, VTI=${fmt(p.mitral.vtiEToARatio)}, separation=${fmt(p.mitral.eaPeakSeparationSec)} s, diastasis=${fmt(p.mitral.diastasisDurationSec)} s, rise/decay=${fmt(p.mitral.eRiseMonotoneFraction)}/${fmt(p.mitral.eDecayMonotoneFraction)}`,
    `PVF: S/D=${fmt(p.pulmonaryVenous.sToDRatio)}; z excursion=${fmt(p.zRangeCm[1] - p.zRangeCm[0])} cm; |u|max=${fmt(Math.max(Math.abs(p.uRangeCmPerSec[0]), Math.abs(p.uRangeCmPerSec[1])))} cm/s`,
    `activation sensitivity: E/A=${fmt(variant("activation-timing-sensitivity").profile.mitral.peakEToARatio)}, MVO theta=${fmt(variant("activation-timing-sensitivity").profile.xvyPressureReadback.mvoTheta)}, A/v=${fmt(variant("activation-timing-sensitivity").profile.laPvLobes.aLoopAreaMmHgMl)}/${fmt(variant("activation-timing-sensitivity").profile.laPvLobes.vLoopAreaMmHgMl)}; diagnostic only`,
  ];
  lines.forEach((line, index) => {
    out.push(text(x + 22, y + 58 + index * 36, line, 13, index === 0 ? "#e2e8f0" : "#cbd5e1", index === 0 ? 700 : 400));
  });
}

function renderVariantTable(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  rows: readonly WorkConjugateAtrialAVPlaneVariantV1[],
): void {
  panel(out, x, y, w, h, "Variant diagnostics");
  const columns = ["row", "A/v", "E/A", "x", "periodic"];
  columns.forEach((label, index) => {
    out.push(text(x + 18 + index * 82, y + 48, label, 11, "#94a3b8", 700));
  });
  rows.forEach((row, index) => {
    const p = row.profile;
    const yy = y + 76 + index * 48;
    out.push(text(x + 18, yy, shortId(row.variantId), 10.5, "#e2e8f0", row.variantId === canonical.variantId ? 700 : 400));
    out.push(text(x + 100, yy, `${fmt(p.laPvLobes.aLoopAreaMmHgMl)}/${fmt(p.laPvLobes.vLoopAreaMmHgMl)}`, 10.5, "#cbd5e1"));
    out.push(text(x + 182, yy, fmt(p.mitral.peakEToARatio), 10.5, "#cbd5e1"));
    out.push(text(x + 264, yy, fmt(p.xvyPressureReadback.xDescentDepthMmHg), 10.5, "#cbd5e1"));
    out.push(text(x + 346, yy, p.periodicSteadyState ? "yes" : "no", 10.5, p.periodicSteadyState ? "#86efac" : "#fca5a5"));
  });
}

type PlotSeries = {
  readonly values: readonly { readonly theta: number; readonly value: number }[];
  readonly color: string;
  readonly label: string;
};

type PlotRect = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
};

type LinearScale = {
  readonly domainMin: number;
  readonly domainMax: number;
  readonly map: (value: number) => number;
};

function series(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  key: keyof WorkConjugateAtrialAVPlaneSampleV1,
  color: string,
  label: string,
): PlotSeries {
  return customSeries(samples, (sample) => Number(sample[key]), color, label);
}

function customSeries(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  value: (sample: WorkConjugateAtrialAVPlaneSampleV1) => number,
  color: string,
  label: string,
): PlotSeries {
  return { values: samples.map((sample) => ({ theta: sample.theta, value: value(sample) })), color, label };
}

function phasePaths(profile: WorkConjugateAtrialAVPlaneProfileV1) {
  const samples = profile.samples;
  const closure = indexAtTheta(samples, profile.xvyPressureReadback.mvcTheta);
  const opening = indexAtTheta(samples, profile.xvyPressureReadback.mvoTheta);
  const preA = indexAtTheta(samples, profile.mitral.activationOnsetTheta);
  return {
    reservoir: samples.slice(closure, opening + 1),
    conduit: samples.slice(opening, preA + 1),
    pumping: [...samples.slice(preA), ...samples.slice(0, closure + 1)],
  };
}

function drawLine(
  out: string[],
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  sx: (value: number) => number,
  sy: (value: number) => number,
  color: string,
  width: number,
  opacityWidth = width,
): void {
  if (samples.length < 2) return;
  const d = samples.map((sample, index) =>
    `${index === 0 ? "M" : "L"}${sx(sample.laVolumeMl).toFixed(2)},${sy(sample.laPressureMmHg).toFixed(2)}`
  ).join(" ");
  out.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${opacityWidth}" stroke-linejoin="round" stroke-linecap="round" opacity="${width < 3 ? "0.78" : "0.95"}"/>`);
}

function marker(
  out: string[],
  sample: WorkConjugateAtrialAVPlaneSampleV1,
  sx: (value: number) => number,
  sy: (value: number) => number,
  color: string,
  label: string,
): void {
  const x = sx(sample.laVolumeMl);
  const y = sy(sample.laPressureMmHg);
  out.push(`<circle cx="${x}" cy="${y}" r="5" fill="${color}"/>`);
  out.push(text(x + 8, y - 8, label, 10, color, 700));
}

function panel(out: string[], x: number, y: number, w: number, h: number, titleValue: string): void {
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#0f172a" stroke="#26364c"/>`);
  out.push(text(x + 16, y + 28, titleValue, 14, "#e2e8f0", 700));
}

function grid(out: string[], x: number, y: number, w: number, h: number): void {
  for (let index = 0; index <= 4; index += 1) {
    const gx = x + index * w / 4;
    const gy = y + index * h / 4;
    out.push(`<line x1="${gx}" y1="${y}" x2="${gx}" y2="${y + h}" stroke="#22314a"/>`);
    out.push(`<line x1="${x}" y1="${gy}" x2="${x + w}" y2="${gy}" stroke="#22314a"/>`);
  }
}

function renderAxes(
  out: string[],
  plot: PlotRect,
  xScale: LinearScale,
  yScale: LinearScale,
  xLabel: string,
  yLabel: string,
): void {
  out.push(`<line x1="${plot.x}" y1="${plot.y + plot.h}" x2="${plot.x + plot.w}" y2="${plot.y + plot.h}" stroke="#64748b"/>`);
  out.push(`<line x1="${plot.x}" y1="${plot.y}" x2="${plot.x}" y2="${plot.y + plot.h}" stroke="#64748b"/>`);
  const divisions = 4;
  for (let index = 0; index <= divisions; index += 1) {
    const progress = index / divisions;
    const xValue = xScale.domainMin + progress *
      (xScale.domainMax - xScale.domainMin);
    const yValue = yScale.domainMin + progress *
      (yScale.domainMax - yScale.domainMin);
    const px = plot.x + progress * plot.w;
    const py = plot.y + plot.h - progress * plot.h;
    out.push(text(
      px,
      plot.y + plot.h + 15,
      formatAxisTick(xValue, xScale.domainMax - xScale.domainMin),
      9.5,
      "#94a3b8",
      400,
      "middle",
    ));
    out.push(text(
      plot.x - 8,
      py + 3,
      formatAxisTick(yValue, yScale.domainMax - yScale.domainMin),
      9.5,
      "#94a3b8",
      400,
      "end",
    ));
  }
  out.push(text(
    plot.x + plot.w / 2,
    plot.y + plot.h + 32,
    xLabel,
    10.5,
    "#cbd5e1",
    600,
    "middle",
  ));
  out.push(rotatedText(
    plot.x - 58,
    plot.y + plot.h / 2,
    yLabel,
    10.5,
    "#cbd5e1",
    600,
  ));
}

function legend(
  out: string[],
  x: number,
  y: number,
  width: number,
  rows: readonly (readonly [string, string])[],
): void {
  const cellWidth = width / Math.max(1, rows.length);
  rows.forEach(([label, color], index) => {
    const lx = x + index * cellWidth;
    out.push(`<line x1="${lx}" y1="${y}" x2="${lx + 18}" y2="${y}" stroke="${color}" stroke-width="4"/>`);
    out.push(text(lx + 24, y + 4, label, 10.5, "#cbd5e1"));
  });
}

function title(titleText: string, subtitle: string): string {
  return [
    text(36, 44, titleText, 24, "#f8fafc", 700),
    text(36, 72, subtitle, 13, "#fbbf24", 600),
  ].join("\n");
}

function text(
  x: number,
  y: number,
  value: string,
  size: number,
  color: string,
  weight = 400,
  anchor: "start" | "middle" | "end" = "start",
): string {
  return `<text x="${x}" y="${y}" fill="${color}" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${escapeXml(value)}</text>`;
}

function rotatedText(
  x: number,
  y: number,
  value: string,
  size: number,
  color: string,
  weight = 400,
): string {
  return `<text x="${x}" y="${y}" fill="${color}" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="middle" transform="rotate(-90 ${x} ${y})">${escapeXml(value)}</text>`;
}

function svgStart(width: number, height: number): string[] {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="#07111f"/>`,
  ];
}

function linearScale(
  values: readonly number[],
  outMin: number,
  outMax: number,
  padFraction = 0.08,
): LinearScale {
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const rawSpan = rawMax - rawMin;
  const pad = rawSpan > 0
    ? rawSpan * padFraction
    : Math.max(Math.abs(rawMin) * 0.08, 1e-6);
  const domainMin = rawMin - pad;
  const domainMax = rawMax + pad;
  return {
    domainMin,
    domainMax,
    map: (value: number) => outMin + (value - domainMin) /
      Math.max(domainMax - domainMin, 1e-9) * (outMax - outMin),
  };
}

function formatAxisTick(value: number, span: number): string {
  const scale = Math.max(Math.abs(value), Math.abs(span));
  if (scale >= 100) return value.toFixed(0);
  if (scale >= 10) return value.toFixed(1);
  if (scale >= 0.1) return value.toFixed(2);
  return value.toExponential(1);
}

function nearestTheta(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  theta: number,
): WorkConjugateAtrialAVPlaneSampleV1 {
  return samples[indexAtTheta(samples, theta)]!;
}

function indexAtTheta(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  theta: number,
): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  samples.forEach((sample, index) => {
    const distance = Math.abs(sample.theta - theta);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}

function variant(id: string): WorkConjugateAtrialAVPlaneVariantV1 {
  const found = report.variants.find((row) => row.variantId === id);
  if (!found) throw new Error(`missing variant ${id}`);
  return found;
}

function palette(index: number): string {
  return ["#38bdf8", "#22c55e", "#f87171", "#f59e0b", "#a78bfa", "#f472b6"][index % 6]!;
}

function shortId(id: string): string {
  return id
    .replace("canonical-quasistatic-wall-viscous", "canonical")
    .replace("legacy-inherited-inertia-m1p1-negative-control", "legacy-M1.1")
    .replace("higher-wall-viscosity-topology-control", "high-visc")
    .replace("activation-timing-sensitivity", "timing")
    .replace("physical-inertial-30g", "30g")
    .replace("atrial-active-off-control", "LA-off");
}

function fmt(value: number): string {
  return Number.isFinite(value) ? value.toFixed(Math.abs(value) >= 10 ? 1 : 3) : "n/a";
}

function sci(value: number): string {
  return Number.isFinite(value) ? value.toExponential(2) : "n/a";
}

function pct(value: number): string {
  return `${(100 * value).toFixed(1)}%`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
