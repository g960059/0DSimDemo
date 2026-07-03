import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  runFullLeftAVPlaneResidualRoutingBenchV1,
  runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1,
} from "@/engine/mechanics2/benches/FullLeftAVPlaneResidualRoutingBench";
import type { LeftHeartSubsystemSampleV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/full-left-av-plane-residual-routing-review.svg",
);

const report = runFullLeftAVPlaneResidualRoutingBenchV1();
const rowByVariantProfile = new Map<string, (typeof report.rows)[number]>(
  report.rows.map((row) => [`${row.variantId}::${row.profileId}`, row] as const),
);
const panels = runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1(
  report.summary.bestFullResidualVariantId,
  report.summary.bestOverallVariantId,
  report.summary.bestSmoothCoreVariantId,
  report.summary.bestV2VariantId,
  report.summary.bestV3VariantId,
  report.summary.bestV4VariantId,
  report.summary.bestV5VariantId,
  report.summary.bestV6VariantId,
  report.summary.bestV8VariantId,
  report.summary.bestV9VariantId,
  report.summary.bestV10VariantId,
  report.summary.bestV11VariantId,
  report.summary.bestV12VariantId,
  report.summary.bestV13VariantId,
  report.summary.bestV14VariantId,
  report.summary.bestV15VariantId,
  report.summary.bestV16VariantId,
  report.summary.bestV17VariantId,
  report.summary.bestV18VariantId,
  report.summary.bestV19VariantId,
  report.summary.bestV20VariantId,
  report.summary.bestV21VariantId,
);

const width = 1900;
const panelWidth = 860;
const panelHeight = 372;
const marginX = 50;
const marginY = 170;
const gapX = 38;
const gapY = 28;
const height = marginY + 4 * panelHeight + 3 * gapY + 62;
const svg: string[] = [];
svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
svg.push(`<rect width="${width}" height="${height}" fill="#070b13"/>`);
svg.push(`<text x="34" y="34" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700">Full-left LA-AV-plane residual routing review</text>`);
svg.push(`<text x="34" y="58" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="13">Blood-volume LA PV is the only physiology-facing display here. Prime readbacks are ignored for the current SVG and morphology gate.</text>`);
svg.push(`<text x="34" y="82" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">Current visual prefilter: source surface, MVF, blood-volume PV phase, clean post-MV-opening conduit downstroke, hidden-volume cleanliness, and blood V-loop area.</text>`);
svg.push(`<text x="34" y="104" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="12">V17 ${report.summary.bestV17PhaseOrientedPvPass}/7 phase, source ${report.summary.bestV17SourceSurfacePass}/7, MVF ${report.summary.bestV17MvfClean}/7; V18 ${report.summary.bestV18PhaseOrientedPvPass}/7 phase, source ${report.summary.bestV18SourceSurfacePass}/7, MVF ${report.summary.bestV18MvfClean}/7; V19 ${report.summary.bestV19PhaseOrientedPvPass}/7 phase, source ${report.summary.bestV19SourceSurfacePass}/7, MVF ${report.summary.bestV19MvfClean}/7</text>`);
svg.push(`<text x="34" y="126" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="12">V20 ${report.summary.bestV20PhaseOrientedPvPass}/7 phase, source ${report.summary.bestV20SourceSurfacePass}/7, MVF ${report.summary.bestV20MvfClean}/7; V21 ${report.summary.bestV21PhaseOrientedPvPass}/7 phase, source ${report.summary.bestV21SourceSurfacePass}/7, MVF ${report.summary.bestV21MvfClean}/7. This is residual review, not morphology acceptance.</text>`);
legend(svg, 1540, 36, "#2dd4bf", "best V17 reservoir-conduit hysteresis");
legend(svg, 1540, 58, "#5eead4", "best V18 phase-asymmetric hysteresis");
legend(svg, 1540, 80, "#d946ef", "best V19 recoil hysteresis");
legend(svg, 1540, 102, "#f472b6", "best V20 stateful hysteresis");
legend(svg, 1540, 124, "#a78bfa", "best V21 branch receiver");
svg.push(`<circle cx="1780" cy="40" r="4.4" fill="#f8fafc" stroke="#111827" stroke-width="1.4"/>`);
svg.push(`<text x="1792" y="45" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="12">MV opening</text>`);
svg.push(`<circle cx="1780" cy="62" r="4.4" fill="#111827" stroke="#f8fafc" stroke-width="1.7"/>`);
svg.push(`<text x="1792" y="67" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="12">MV closure</text>`);
svg.push(`<path d="M1775,79 L1785,89 M1785,79 L1775,89" stroke="#ef4444" stroke-width="1.6"/>`);
svg.push(`<text x="1792" y="89" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="12">PV tangent kink marker</text>`);

for (let i = 0; i < panels.length; i++) {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = marginX + col * (panelWidth + gapX);
  const y = marginY + row * (panelHeight + gapY);
  renderPanel(svg, x, y, panelWidth, panelHeight, panels[i]!);
}

svg.push(`</svg>`);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${svg.join("\n")}\n`);
console.log(outPath.replace(`${repoRoot}/`, ""));

function renderPanel(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  panel: ReturnType<typeof runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1>[number],
): void {
  const padX = 26;
  const padTop = 48;
  const plotW = (w - 4 * padX) / 3;
  const plotH = h - 88;
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#111827" stroke="#253044"/>`);
  out.push(`<text x="${x + 16}" y="${y + 28}" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="700">${panel.profileId}</text>`);
  renderPv(out, x + padX, y + padTop, plotW, plotH, panel);
  renderFlow(out, x + 2 * padX + plotW, y + padTop, plotW, plotH, panel);
  renderPressure(out, x + 3 * padX + 2 * plotW, y + padTop, plotW, plotH, panel);
}

function renderPv(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  panel: ReturnType<typeof runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1>[number],
): void {
  const traces = [
    { variantId: "baseline-no-avp-compliance-node", samples: panel.baseline, color: "#22c55e" },
    { variantId: "raw-traction-reference", samples: panel.rawTraction, color: "#f97316" },
    { variantId: panel.bestFullResidualVariantId, samples: panel.bestFullResidual, color: "#a855f7" },
    { variantId: panel.bestOverallVariantId, samples: panel.bestOverall, color: "#38bdf8" },
    { variantId: panel.bestSmoothCoreVariantId, samples: panel.bestSmoothCore, color: "#eab308" },
    { variantId: panel.bestV2VariantId, samples: panel.bestV2, color: "#ec4899" },
    { variantId: panel.bestV3VariantId, samples: panel.bestV3, color: "#14b8a6" },
    { variantId: panel.bestV4VariantId, samples: panel.bestV4, color: "#f43f5e" },
    { variantId: panel.bestV5VariantId, samples: panel.bestV5, color: "#818cf8" },
    { variantId: panel.bestV6VariantId, samples: panel.bestV6, color: "#f9a8d4" },
    { variantId: panel.bestV8VariantId, samples: panel.bestV8, color: "#fb7185" },
    { variantId: panel.bestV9VariantId, samples: panel.bestV9, color: "#f8fafc" },
    { variantId: panel.bestV10VariantId, samples: panel.bestV10, color: "#c084fc" },
    { variantId: panel.bestV11VariantId, samples: panel.bestV11, color: "#93c5fd" },
    { variantId: panel.bestV12VariantId, samples: panel.bestV12, color: "#67e8f9" },
    { variantId: panel.bestV13VariantId, samples: panel.bestV13, color: "#34d399" },
    { variantId: panel.bestV14VariantId, samples: panel.bestV14, color: "#fbbf24" },
    { variantId: panel.bestV15VariantId, samples: panel.bestV15, color: "#fb7185" },
    { variantId: panel.bestV16VariantId, samples: panel.bestV16, color: "#c084fc" },
    { variantId: panel.bestV17VariantId, samples: panel.bestV17, color: "#2dd4bf" },
    { variantId: panel.bestV18VariantId, samples: panel.bestV18, color: "#5eead4" },
    { variantId: panel.bestV19VariantId, samples: panel.bestV19, color: "#d946ef" },
    { variantId: panel.bestV20VariantId, samples: panel.bestV20, color: "#f472b6" },
    { variantId: panel.bestV21VariantId, samples: panel.bestV21, color: "#a78bfa" },
  ].filter((trace) => shouldPlotPhysiologyPvCandidate(trace.variantId, panel.profileId));
  if (traces.length === 0) {
    axis(out, x, y, w, h, "LA blood PV (ledger audit)");
    out.push(`<text x="${x + 10}" y="${y + 38}" fill="#fca5a5" font-family="Inter,Arial,sans-serif" font-size="10">no plotted candidate: blood v-loop/MV-opening/source/MVF filter rejected all overlays</text>`);
    return;
  }
  const all = traces.flatMap((trace) => trace.samples);
  const xs = all.map((sample) => sample.acceptedLaVolumeMl);
  const ps = all.map((sample) => sample.lapMmHg);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minP = Math.min(...ps);
  const maxP = Math.max(...ps);
  const sx = (value: number) => x + (value - minX) / Math.max(maxX - minX, 1e-9) * w;
  const sy = (value: number) => y + h - (value - minP) / Math.max(maxP - minP, 1e-9) * h;
  axis(out, x, y, w, h, "LA blood PV (ledger audit)");
  for (const trace of traces) renderPvMarkers(out, trace.samples, sx, sy, trace.color);
  for (const trace of traces) {
    out.push(`<path d="${pathForPv(trace.samples, sx, sy)}" fill="none" stroke="${trace.color}" stroke-width="2.4" opacity="0.9"/>`);
  }
}

function renderPvMarkers(
  out: string[],
  samples: readonly LeftHeartSubsystemSampleV2[],
  sx: (value: number) => number,
  sy: (value: number) => number,
  color: string,
): void {
  const openingIndex = findMvOpeningIndex(samples.map((sample) => sample.mvOpen01));
  const closureIndex = openingIndex == null
    ? null
    : findMvClosureIndexAfter(samples.map((sample) => sample.mvOpen01), openingIndex);
  if (openingIndex == null || closureIndex == null) return;
  const opening = samples[openingIndex]!;
  const closure = samples[closureIndex]!;
  out.push(`<line x1="${sx(closure.acceptedLaVolumeMl).toFixed(1)}" y1="${sy(closure.lapMmHg).toFixed(1)}" x2="${sx(opening.acceptedLaVolumeMl).toFixed(1)}" y2="${sy(opening.lapMmHg).toFixed(1)}" stroke="${color}" stroke-width="1.1" stroke-dasharray="4 4" opacity="0.52"/>`);
  out.push(`<circle cx="${sx(opening.acceptedLaVolumeMl).toFixed(1)}" cy="${sy(opening.lapMmHg).toFixed(1)}" r="3.4" fill="${color}" stroke="#0f172a" stroke-width="1.2"/>`);
  out.push(`<circle cx="${sx(closure.acceptedLaVolumeMl).toFixed(1)}" cy="${sy(closure.lapMmHg).toFixed(1)}" r="3.5" fill="#111827" stroke="${color}" stroke-width="1.6"/>`);
  for (const kinkIndex of pvKinkMarkerIndices(samples, openingIndex)) {
    const sample = samples[kinkIndex]!;
    const kx = sx(sample.acceptedLaVolumeMl);
    const ky = sy(sample.lapMmHg);
    out.push(`<path d="M${(kx - 4).toFixed(1)},${(ky - 4).toFixed(1)} L${(kx + 4).toFixed(1)},${(ky + 4).toFixed(1)} M${(kx + 4).toFixed(1)},${(ky - 4).toFixed(1)} L${(kx - 4).toFixed(1)},${(ky + 4).toFixed(1)}" stroke="#ef4444" stroke-width="1.4" opacity="0.78"/>`);
  }
}

function renderFlow(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  panel: ReturnType<typeof runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1>[number],
): void {
  const traces = [
    { variantId: "baseline-no-avp-compliance-node", samples: panel.baseline, color: "#22c55e" },
    { variantId: "raw-traction-reference", samples: panel.rawTraction, color: "#f97316" },
    { variantId: panel.bestFullResidualVariantId, samples: panel.bestFullResidual, color: "#a855f7" },
    { variantId: panel.bestOverallVariantId, samples: panel.bestOverall, color: "#38bdf8" },
    { variantId: panel.bestSmoothCoreVariantId, samples: panel.bestSmoothCore, color: "#eab308" },
    { variantId: panel.bestV2VariantId, samples: panel.bestV2, color: "#ec4899" },
    { variantId: panel.bestV3VariantId, samples: panel.bestV3, color: "#14b8a6" },
    { variantId: panel.bestV4VariantId, samples: panel.bestV4, color: "#f43f5e" },
    { variantId: panel.bestV5VariantId, samples: panel.bestV5, color: "#818cf8" },
    { variantId: panel.bestV6VariantId, samples: panel.bestV6, color: "#f9a8d4" },
    { variantId: panel.bestV8VariantId, samples: panel.bestV8, color: "#fb7185" },
    { variantId: panel.bestV9VariantId, samples: panel.bestV9, color: "#f8fafc" },
    { variantId: panel.bestV10VariantId, samples: panel.bestV10, color: "#c084fc" },
    { variantId: panel.bestV11VariantId, samples: panel.bestV11, color: "#93c5fd" },
    { variantId: panel.bestV12VariantId, samples: panel.bestV12, color: "#67e8f9" },
    { variantId: panel.bestV13VariantId, samples: panel.bestV13, color: "#34d399" },
    { variantId: panel.bestV14VariantId, samples: panel.bestV14, color: "#fbbf24" },
    { variantId: panel.bestV15VariantId, samples: panel.bestV15, color: "#fb7185" },
    { variantId: panel.bestV16VariantId, samples: panel.bestV16, color: "#c084fc" },
    { variantId: panel.bestV17VariantId, samples: panel.bestV17, color: "#2dd4bf" },
    { variantId: panel.bestV18VariantId, samples: panel.bestV18, color: "#5eead4" },
    { variantId: panel.bestV19VariantId, samples: panel.bestV19, color: "#d946ef" },
    { variantId: panel.bestV20VariantId, samples: panel.bestV20, color: "#f472b6" },
    { variantId: panel.bestV21VariantId, samples: panel.bestV21, color: "#a78bfa" },
  ].filter((trace) => shouldPlotPhysiologyPvCandidate(trace.variantId, panel.profileId));
  if (traces.length === 0) {
    axis(out, x, y, w, h, "QMV forward");
    out.push(`<text x="${x + 8}" y="${y + 38}" fill="#fca5a5" font-family="Inter,Arial,sans-serif" font-size="10">hidden with rejected blood v-loop/MV-opening candidates</text>`);
    return;
  }
  const maxValue = Math.max(1, ...traces.flatMap((trace) => trace.samples.map((sample) => Math.max(0, sample.qMvMlPerSec))));
  const sx = (theta: number) => x + theta * w;
  const sy = (value: number) => y + h - Math.max(0, value) / maxValue * h;
  axis(out, x, y, w, h, "QMV forward");
  for (const trace of traces) {
    out.push(`<path d="${pathForTrace(trace.samples, sx, sy, "qMvMlPerSec")}" fill="none" stroke="${trace.color}" stroke-width="2.3" opacity="0.88"/>`);
  }
}

function renderPressure(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  panel: ReturnType<typeof runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1>[number],
): void {
  const trace = physiologyDiagnosticTrace(panel);
  if (trace == null) {
    axis(out, x, y, w, h, "physiology candidate pressure");
    out.push(`<text x="${x + 8}" y="${y + 38}" fill="#fca5a5" font-family="Inter,Arial,sans-serif" font-size="10">hidden: no blood v-loop/MV-opening candidate</text>`);
    return;
  }
  const samples = trace.samples;
  const values = samples.flatMap((sample) => [sample.lapMmHg, sample.lvpMmHg, sample.pulmonaryVenousPressureMmHg]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const sx = (theta: number) => x + theta * w;
  const sy = (value: number) => y + h - (value - minValue) / Math.max(maxValue - minValue, 1e-9) * h;
  axis(out, x, y, w, h, `${trace.label} pressure`);
  out.push(`<path d="${pathForTrace(samples, sx, sy, "lapMmHg")}" fill="none" stroke="#f8fafc" stroke-width="2.2" opacity="0.9"/>`);
  out.push(`<path d="${pathForTrace(samples, sx, sy, "lvpMmHg")}" fill="none" stroke="#facc15" stroke-width="1.7" opacity="0.72"/>`);
  out.push(`<path d="${pathForTrace(samples, sx, sy, "pulmonaryVenousPressureMmHg")}" fill="none" stroke="#60a5fa" stroke-width="1.7" opacity="0.72"/>`);
  renderXDescentMarkers(out, samples, sx, sy);
  out.push(`<text x="${x + 6}" y="${y + h - 7}" fill="#c4b5fd" font-family="Inter,Arial,sans-serif" font-size="10">LAP</text>`);
  out.push(`<text x="${x + 38}" y="${y + h - 7}" fill="#fde68a" font-family="Inter,Arial,sans-serif" font-size="10">LVP</text>`);
  out.push(`<text x="${x + 72}" y="${y + h - 7}" fill="#bfdbfe" font-family="Inter,Arial,sans-serif" font-size="10">PV</text>`);
}

function renderXDescentMarkers(
  out: string[],
  samples: readonly LeftHeartSubsystemSampleV2[],
  sx: (theta: number) => number,
  sy: (value: number) => number,
): void {
  const openingIndex = findMvOpeningIndex(samples.map((sample) => sample.mvOpen01));
  const closureIndex = openingIndex == null
    ? null
    : findMvClosureIndexAfter(samples.map((sample) => sample.mvOpen01), openingIndex);
  if (openingIndex == null || closureIndex == null) return;
  const reservoirIndices = circularIndexRange(closureIndex, openingIndex, samples.length);
  if (reservoirIndices.length === 0) return;
  let troughIndex = reservoirIndices[0]!;
  for (const index of reservoirIndices) {
    if (samples[index]!.lapMmHg < samples[troughIndex]!.lapMmHg) troughIndex = index;
  }
  const closure = samples[closureIndex]!;
  const trough = samples[troughIndex]!;
  const opening = samples[openingIndex]!;
  out.push(`<line x1="${sx(closure.theta).toFixed(1)}" y1="${sy(closure.lapMmHg).toFixed(1)}" x2="${sx(closure.theta).toFixed(1)}" y2="${sy(trough.lapMmHg).toFixed(1)}" stroke="#f8fafc" stroke-width="1.1" stroke-dasharray="3 3" opacity="0.6"/>`);
  out.push(`<line x1="${sx(opening.theta).toFixed(1)}" y1="${sy(opening.lapMmHg).toFixed(1)}" x2="${sx(opening.theta).toFixed(1)}" y2="${sy(trough.lapMmHg).toFixed(1)}" stroke="#f8fafc" stroke-width="1.1" stroke-dasharray="3 3" opacity="0.42"/>`);
  out.push(`<circle cx="${sx(closure.theta).toFixed(1)}" cy="${sy(closure.lapMmHg).toFixed(1)}" r="3.0" fill="#111827" stroke="#f8fafc" stroke-width="1.4"/>`);
  out.push(`<circle cx="${sx(trough.theta).toFixed(1)}" cy="${sy(trough.lapMmHg).toFixed(1)}" r="3.0" fill="#0f172a" stroke="#22c55e" stroke-width="1.5"/>`);
  out.push(`<circle cx="${sx(opening.theta).toFixed(1)}" cy="${sy(opening.lapMmHg).toFixed(1)}" r="3.0" fill="#f8fafc" stroke="#111827" stroke-width="1.2"/>`);
}

function axis(out: string[], x: number, y: number, w: number, h: number, label: string): void {
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0b1220" stroke="#1f2937"/>`);
  out.push(`<line x1="${x}" y1="${y + h / 2}" x2="${x + w}" y2="${y + h / 2}" stroke="#1f2937" stroke-width="1"/>`);
  out.push(`<line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="#1f2937" stroke-width="1"/>`);
  out.push(`<text x="${x + 7}" y="${y + 16}" fill="#94a3b8" font-family="Inter,Arial,sans-serif" font-size="10">${label}</text>`);
}

function legend(out: string[], x: number, y: number, color: string, label: string): void {
  out.push(`<line x1="${x}" y1="${y}" x2="${x + 34}" y2="${y}" stroke="${color}" stroke-width="3"/>`);
  out.push(`<text x="${x + 44}" y="${y + 5}" fill="${color}" font-family="Inter,Arial,sans-serif" font-size="12">${escapeXml(label)}</text>`);
}

function pathForPv(
  samples: readonly LeftHeartSubsystemSampleV2[],
  sx: (value: number) => number,
  sy: (value: number) => number,
): string {
  return samples.map((sample, index) => {
    const command = index === 0 ? "M" : "L";
    return `${command}${sx(sample.acceptedLaVolumeMl).toFixed(1)},${sy(sample.lapMmHg).toFixed(1)}`;
  }).join(" ");
}

function pathForPvAxis(
  samples: readonly LeftHeartSubsystemSampleV2[],
  sx: (value: number) => number,
  sy: (value: number) => number,
  axisVolume: (sample: LeftHeartSubsystemSampleV2) => number,
): string {
  return samples.map((sample, index) => {
    const command = index === 0 ? "M" : "L";
    return `${command}${sx(axisVolume(sample)).toFixed(1)},${sy(sample.lapMmHg).toFixed(1)}`;
  }).join(" ");
}

function shouldPlotPhysiologyPvCandidate(
  variantId: string,
  profileId: string,
): boolean {
  const row = rowByVariantProfile.get(`${variantId}::${profileId}`);
  if (row == null) return false;
  const currentReservoirConduitFamily =
    row.family === "full-left-reservoir-conduit-hysteresis-v17"
    || row.family === "full-left-reservoir-conduit-hysteresis-v18"
    || row.family === "full-left-reservoir-conduit-hysteresis-v19"
    || row.family === "full-left-reservoir-conduit-hysteresis-v20"
    || row.family === "full-left-reservoir-conduit-hysteresis-v21";
  return currentReservoirConduitFamily
    && !!row.phaseOrientedPvPass
    && !!row.sourceSurfacePass
    && !!row.mvfClean
    && !!row.phaseC1Pass
    && !!row.hiddenVolumeClean
    && !!row.phasePv.mvOpeningTransitionPass
    && !!row.phasePv.mvOpeningDownstrokePass
    && !!row.phasePv.bloodVLoopAreaPass;
}

function physiologyDiagnosticTrace(panel: ReturnType<typeof runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1>[number]): {
  readonly variantId: string;
  readonly label: string;
  readonly samples: readonly LeftHeartSubsystemSampleV2[];
} | null {
  const candidates = [
    { variantId: panel.bestV21VariantId, label: "best V21", samples: panel.bestV21 },
    { variantId: panel.bestV20VariantId, label: "best V20", samples: panel.bestV20 },
    { variantId: panel.bestV19VariantId, label: "best V19", samples: panel.bestV19 },
    { variantId: panel.bestV18VariantId, label: "best V18", samples: panel.bestV18 },
    { variantId: panel.bestV17VariantId, label: "best V17", samples: panel.bestV17 },
    { variantId: panel.bestV16VariantId, label: "best V16", samples: panel.bestV16 },
    { variantId: panel.bestV15VariantId, label: "best V15", samples: panel.bestV15 },
    { variantId: panel.bestV14VariantId, label: "best V14", samples: panel.bestV14 },
    { variantId: panel.bestV13VariantId, label: "best V13", samples: panel.bestV13 },
    { variantId: panel.bestV12VariantId, label: "best V12", samples: panel.bestV12 },
    { variantId: panel.bestV11VariantId, label: "best V11", samples: panel.bestV11 },
    { variantId: panel.bestV10VariantId, label: "best V10", samples: panel.bestV10 },
    { variantId: panel.bestV9VariantId, label: "best V9", samples: panel.bestV9 },
    { variantId: panel.bestV8VariantId, label: "best V8", samples: panel.bestV8 },
    { variantId: panel.bestV6VariantId, label: "best V6", samples: panel.bestV6 },
    { variantId: panel.bestOverallVariantId, label: "best overall", samples: panel.bestOverall },
    { variantId: panel.bestFullResidualVariantId, label: "best full", samples: panel.bestFullResidual },
  ];
  return candidates.find((candidate) =>
    shouldPlotPhysiologyPvCandidate(candidate.variantId, panel.profileId)
  ) ?? null;
}

function pathForTrace<K extends keyof LeftHeartSubsystemSampleV2>(
  samples: readonly LeftHeartSubsystemSampleV2[],
  sx: (theta: number) => number,
  sy: (value: number) => number,
  key: K,
): string {
  return samples.map((sample, index) => {
    const value = typeof sample[key] === "number" ? sample[key] as number : 0;
    const command = index === 0 ? "M" : "L";
    return `${command}${sx(sample.theta).toFixed(1)},${sy(value).toFixed(1)}`;
  }).join(" ");
}

function findMvOpeningIndex(mvOpen: readonly number[]): number | null {
  const threshold = 0.45;
  for (let i = 0; i < mvOpen.length; i++) {
    const previous = mvOpen[(i + mvOpen.length - 1) % mvOpen.length]!;
    const current = mvOpen[i]!;
    if (previous < threshold && current >= threshold) return i;
  }
  return null;
}

function findMvClosureIndexAfter(mvOpen: readonly number[], openingIndex: number): number | null {
  const threshold = 0.45;
  for (let step = 1; step <= mvOpen.length; step++) {
    const index = (openingIndex + step) % mvOpen.length;
    const previous = mvOpen[(index + mvOpen.length - 1) % mvOpen.length]!;
    const current = mvOpen[index]!;
    if (previous >= threshold && current < threshold) return index;
  }
  return null;
}

function circularIndexRange(startIndex: number, endIndex: number, length: number): number[] {
  const indices: number[] = [];
  for (let step = 0; step <= length; step++) {
    const index = (startIndex + step) % length;
    indices.push(index);
    if (index === endIndex) break;
  }
  return indices;
}

function pvKinkMarkerIndices(samples: readonly LeftHeartSubsystemSampleV2[], openingIndex: number): readonly number[] {
  const volumes = samples.map((sample) => sample.acceptedLaVolumeMl);
  const pressures = samples.map((sample) => sample.lapMmHg);
  const jumps = tangentAngleJumpsDeg(volumes, pressures);
  const marked = jumps
    .filter((jump) => jump.angleJumpDeg > 74 && Math.abs(jump.index - openingIndex) <= 3)
    .map((jump) => jump.index);
  if (marked.length > 0) return marked;
  return jumps.filter((jump) => jump.angleJumpDeg > 118).slice(0, 2).map((jump) => jump.index);
}

function tangentAngleJumpsDeg(
  x: readonly number[],
  y: readonly number[],
): readonly { readonly index: number; readonly angleJumpDeg: number }[] {
  const out: { index: number; angleJumpDeg: number }[] = [];
  if (x.length < 5 || y.length < 5) return out;
  const xScale = Math.max(Math.max(...x) - Math.min(...x), 1e-9);
  const yScale = Math.max(Math.max(...y) - Math.min(...y), 1e-9);
  for (let i = 1; i < x.length - 1; i++) {
    const prevAngle = Math.atan2((y[i]! - y[i - 1]!) / yScale, (x[i]! - x[i - 1]!) / xScale);
    const nextAngle = Math.atan2((y[i + 1]! - y[i]!) / yScale, (x[i + 1]! - x[i]!) / xScale);
    out.push({ index: i, angleJumpDeg: Math.abs(wrapAngleRad(nextAngle - prevAngle)) * 180 / Math.PI });
  }
  return out;
}

function wrapAngleRad(value: number): number {
  let out = value;
  while (out > Math.PI) out -= 2 * Math.PI;
  while (out < -Math.PI) out += 2 * Math.PI;
  return out;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
