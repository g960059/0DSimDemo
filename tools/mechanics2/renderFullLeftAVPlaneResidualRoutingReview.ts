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
);

const width = 1900;
const panelWidth = 860;
const panelHeight = 372;
const marginX = 50;
const marginY = 446;
const gapX = 38;
const gapY = 28;
const height = marginY + 4 * panelHeight + 3 * gapY + 62;
const svg: string[] = [];
svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
svg.push(`<rect width="${width}" height="${height}" fill="#070b13"/>`);
svg.push(`<text x="34" y="34" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700">Full-left LA-AV-plane residual routing review</text>`);
svg.push(`<text x="34" y="58" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="13">Effective-cavity LA PV is the visual candidate axis; blood-volume PV remains a mass-ledger audit. This SVG hides rows unless capacity/effective PV phase+C1 and hidden-volume hygiene pass.</text>`);
svg.push(`<text x="34" y="82" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best full residual: ${report.summary.bestFullResidualVariantId}; source+phase ${report.summary.bestFullResidualSourcePreservingPhasePv}/7, phase ${report.summary.bestFullResidualPhaseOrientedPvPass}/7, source ${report.summary.bestFullResidualSourceSurfacePass}/7</text>`);
svg.push(`<text x="34" y="102" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best overall: ${report.summary.bestOverallVariantId}; source+phase ${report.summary.bestOverallSourcePreservingPhasePv}/7, phase ${report.summary.bestOverallPhaseOrientedPvPass}/7, source ${report.summary.bestOverallSourceSurfacePass}/7</text>`);
svg.push(`<text x="34" y="122" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best smooth core: ${report.summary.bestSmoothCoreVariantId}; source+phase ${report.summary.bestSmoothCoreSourcePreservingPhasePv}/7, phase ${report.summary.bestSmoothCorePhaseOrientedPvPass}/7, source ${report.summary.bestSmoothCoreSourceSurfacePass}/7, prime ${report.summary.bestSmoothCorePrimeWaveformPass}/7</text>`);
svg.push(`<text x="660" y="82" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best V2: ${report.summary.bestV2VariantId}; source+phase ${report.summary.bestV2SourcePreservingPhasePv}/7, phase ${report.summary.bestV2PhaseOrientedPvPass}/7, source ${report.summary.bestV2SourceSurfacePass}/7, MVF ${report.summary.bestV2MvfClean}/7, prime ${report.summary.bestV2PrimeWaveformPass}/7</text>`);
svg.push(`<text x="660" y="102" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best V3: ${report.summary.bestV3VariantId}; source+phase ${report.summary.bestV3SourcePreservingPhasePv}/7, phase ${report.summary.bestV3PhaseOrientedPvPass}/7, source ${report.summary.bestV3SourceSurfacePass}/7, MVF ${report.summary.bestV3MvfClean}/7, prime ${report.summary.bestV3PrimeWaveformPass}/7</text>`);
svg.push(`<text x="660" y="122" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best V4: ${report.summary.bestV4VariantId}; source+phase ${report.summary.bestV4SourcePreservingPhasePv}/7, phase ${report.summary.bestV4PhaseOrientedPvPass}/7, source ${report.summary.bestV4SourceSurfacePass}/7, MVF ${report.summary.bestV4MvfClean}/7, prime ${report.summary.bestV4PrimeWaveformPass}/7</text>`);
svg.push(`<text x="660" y="142" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best V5: ${report.summary.bestV5VariantId}; source+phase ${report.summary.bestV5SourcePreservingPhasePv}/7, phase ${report.summary.bestV5PhaseOrientedPvPass}/7, source ${report.summary.bestV5SourceSurfacePass}/7, MVF ${report.summary.bestV5MvfClean}/7, prime ${report.summary.bestV5PrimeWaveformPass}/7</text>`);
svg.push(`<text x="660" y="162" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best V6 ref-cap: ${report.summary.bestV6VariantId}; source+phase ${report.summary.bestV6SourcePreservingPhasePv}/7, phase ${report.summary.bestV6PhaseOrientedPvPass}/7, source ${report.summary.bestV6SourceSurfacePass}/7, MVF ${report.summary.bestV6MvfClean}/7, prime ${report.summary.bestV6PrimeWaveformPass}/7</text>`);
svg.push(`<text x="660" y="182" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best V8 ref-cap+venous: ${report.summary.bestV8VariantId}; blood phase ${report.summary.bestV8PhaseOrientedPvPass}/7, capacity phase ${report.summary.bestV8CapacityAxisPhaseOrientedPvPass}/7, capacity source+phase ${report.summary.bestV8SourcePreservingCapacityAxisPhasePv}/7, source ${report.summary.bestV8SourceSurfacePass}/7, MVF ${report.summary.bestV8MvfClean}/7</text>`);
svg.push(`<text x="660" y="202" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best V9 dynamic ref-pressure: ${report.summary.bestV9VariantId}; blood phase ${report.summary.bestV9PhaseOrientedPvPass}/7, capacity phase ${report.summary.bestV9CapacityAxisPhaseOrientedPvPass}/7, source+phase ${report.summary.bestV9SourcePreservingPhasePv}/7, source ${report.summary.bestV9SourceSurfacePass}/7, MVF ${report.summary.bestV9MvfClean}/7</text>`);
svg.push(`<text x="660" y="222" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best V9 separated coordinates: AV-ref ${report.summary.bestV9MaxReferenceCapacityShiftMl.toFixed(2)} mL, pressure-ref ${report.summary.bestV9MaxPressureReferenceCapacityMl.toFixed(2)} mL, effective-cavity +${report.summary.bestV9MaxEffectiveCavityCapacityMl.toFixed(2)} mL</text>`);
svg.push(`<text x="660" y="242" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best V9 fixed-blood pressure probe: counterfactual relief ${report.summary.bestV9MaxCounterfactualFixedBloodPressureReliefMmHg.toFixed(2)} mmHg, applied relief ${report.summary.bestV9MaxAppliedFixedBloodPressureReliefMmHg.toFixed(2)} mmHg, blood x-descent ${report.summary.bestV9MaxBloodXDescentPressureDropMmHg.toFixed(2)} mmHg</text>`);
svg.push(`<text x="660" y="262" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best V10 separated capacity residual: ${report.summary.bestV10VariantId}; blood phase ${report.summary.bestV10PhaseOrientedPvPass}/7, capacity phase ${report.summary.bestV10CapacityAxisPhaseOrientedPvPass}/7, source ${report.summary.bestV10SourceSurfacePass}/7, MVF ${report.summary.bestV10MvfClean}/7, prime ${report.summary.bestV10PrimeWaveformPass}/7</text>`);
svg.push(`<text x="660" y="282" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best V11 accepted-state residual: ${report.summary.bestV11VariantId}; blood phase ${report.summary.bestV11PhaseOrientedPvPass}/7, source+phase ${report.summary.bestV11SourcePreservingPhasePv}/7, source ${report.summary.bestV11SourceSurfacePass}/7, MVF ${report.summary.bestV11MvfClean}/7, prime ${report.summary.bestV11PrimeWaveformPass}/7</text>`);
svg.push(`<text x="660" y="302" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best V12 effective-cavity pressure law: ${report.summary.bestV12VariantId}; blood phase ${report.summary.bestV12PhaseOrientedPvPass}/7, capacity phase ${report.summary.bestV12CapacityAxisPhaseOrientedPvPass}/7, capacity source+phase ${report.summary.bestV12SourcePreservingCapacityAxisPhasePv}/7, source ${report.summary.bestV12SourceSurfacePass}/7, MVF ${report.summary.bestV12MvfClean}/7</text>`);
svg.push(`<text x="660" y="322" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best V12 fixed-blood pressure probe: counterfactual relief ${report.summary.bestV12MaxCounterfactualFixedBloodPressureReliefMmHg.toFixed(2)} mmHg, applied relief ${report.summary.bestV12MaxAppliedFixedBloodPressureReliefMmHg.toFixed(2)} mmHg, blood x-descent ${report.summary.bestV12MaxBloodXDescentPressureDropMmHg.toFixed(2)} mmHg</text>`);
svg.push(`<text x="660" y="342" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best V13 accepted-coordinate C1 law: ${report.summary.bestV13VariantId}; capacity phase ${report.summary.bestV13CapacityAxisPhaseOrientedPvPass}/7, capacity source+phase ${report.summary.bestV13SourcePreservingCapacityAxisPhasePv}/7, source ${report.summary.bestV13SourceSurfacePass}/7, MVF ${report.summary.bestV13MvfClean}/7, prime ${report.summary.bestV13PrimeWaveformPass}/7</text>`);
svg.push(`<text x="660" y="362" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best V14 continuous trajectory law: ${report.summary.bestV14VariantId}; capacity phase ${report.summary.bestV14CapacityAxisPhaseOrientedPvPass}/7, capacity source+phase ${report.summary.bestV14SourcePreservingCapacityAxisPhasePv}/7, source ${report.summary.bestV14SourceSurfacePass}/7, MVF ${report.summary.bestV14MvfClean}/7, prime ${report.summary.bestV14PrimeWaveformPass}/7</text>`);
svg.push(`<text x="660" y="382" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best V15 MV-coupled trajectory law: ${report.summary.bestV15VariantId}; capacity phase ${report.summary.bestV15CapacityAxisPhaseOrientedPvPass}/7, capacity source+phase ${report.summary.bestV15SourcePreservingCapacityAxisPhasePv}/7, source ${report.summary.bestV15SourceSurfacePass}/7, MVF ${report.summary.bestV15MvfClean}/7, prime ${report.summary.bestV15PrimeWaveformPass}/7</text>`);
svg.push(`<text x="660" y="402" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best V16 implicit MV-state trajectory law: ${report.summary.bestV16VariantId}; capacity phase ${report.summary.bestV16CapacityAxisPhaseOrientedPvPass}/7, capacity source+phase ${report.summary.bestV16SourcePreservingCapacityAxisPhasePv}/7, source ${report.summary.bestV16SourceSurfacePass}/7, MVF ${report.summary.bestV16MvfClean}/7, prime ${report.summary.bestV16PrimeWaveformPass}/7</text>`);
legend(svg, 1540, 36, "#22c55e", "baseline no AV-plane");
legend(svg, 1540, 58, "#f97316", "raw traction reference");
legend(svg, 1540, 80, "#a855f7", "best full-left residual");
legend(svg, 1540, 102, "#38bdf8", "best overall route");
legend(svg, 1540, 124, "#eab308", "best smooth core");
legend(svg, 1540, 146, "#ec4899", "best V2 coord residual");
legend(svg, 1540, 168, "#14b8a6", "best V3 MV loss");
legend(svg, 1540, 190, "#f43f5e", "best V4 velocity target");
legend(svg, 1540, 212, "#818cf8", "best V5 phase-owned");
legend(svg, 1540, 234, "#f9a8d4", "best V6 ref-capacity");
legend(svg, 1540, 256, "#fb7185", "best V8 ref-cap+venous");
legend(svg, 1540, 278, "#f8fafc", "best V9 dynamic ref-pressure");
legend(svg, 1540, 300, "#c084fc", "best V10 separated capacity");
legend(svg, 1540, 322, "#93c5fd", "best V11 accepted-state");
legend(svg, 1540, 344, "#67e8f9", "best V12 eff-cavity pressure law");
legend(svg, 1540, 366, "#34d399", "best V13 coordinate C1 law");
legend(svg, 1540, 388, "#fbbf24", "best V14 continuous trajectory");
legend(svg, 1540, 410, "#fb7185", "best V15 MV-coupled trajectory");
legend(svg, 1540, 432, "#c084fc", "best V16 implicit MV state");
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
  const plotW = (w - 6 * padX) / 5;
  const plotH = h - 88;
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#111827" stroke="#253044"/>`);
  out.push(`<text x="${x + 16}" y="${y + 28}" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="700">${panel.profileId}</text>`);
  renderPv(out, x + padX, y + padTop, plotW, plotH, panel);
  renderCapacityPv(out, x + 2 * padX + plotW, y + padTop, plotW, plotH, panel);
  renderFlow(out, x + 3 * padX + 2 * plotW, y + padTop, plotW, plotH, panel);
  renderPressure(out, x + 4 * padX + 3 * plotW, y + padTop, plotW, plotH, panel);
  renderPrime(out, x + 5 * padX + 4 * plotW, y + padTop, plotW, plotH, panel);
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
  ].filter((trace) => shouldPlotPhysiologyPvCandidate(trace.variantId, panel.profileId));
  if (traces.length === 0) {
    axis(out, x, y, w, h, "LA blood PV (ledger audit)");
    out.push(`<text x="${x + 10}" y="${y + 38}" fill="#fca5a5" font-family="Inter,Arial,sans-serif" font-size="10">no plotted candidate: effective/capacity PV filter rejected all overlays</text>`);
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

function renderCapacityPv(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  panel: ReturnType<typeof runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1>[number],
): void {
  const traces = [
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
  ].filter((trace) => shouldPlotPhysiologyPvCandidate(trace.variantId, panel.profileId));
  if (traces.length === 0) {
    axis(out, x, y, w, h, "LA effective-cavity PV");
    out.push(`<text x="${x + 8}" y="${y + 38}" fill="#fca5a5" font-family="Inter,Arial,sans-serif" font-size="10">hidden: effective/capacity phase or C1 failed</text>`);
    return;
  }
  const all = traces.flatMap((trace) => trace.samples);
  const xs = all.map((sample) => capacityAxisVolumeMl(sample));
  const ps = all.map((sample) => sample.lapMmHg);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minP = Math.min(...ps);
  const maxP = Math.max(...ps);
  const sx = (value: number) => x + (value - minX) / Math.max(maxX - minX, 1e-9) * w;
  const sy = (value: number) => y + h - (value - minP) / Math.max(maxP - minP, 1e-9) * h;
  axis(out, x, y, w, h, "LA effective-cavity PV");
  for (const trace of traces) {
    out.push(`<path d="${pathForPvAxis(trace.samples, sx, sy, capacityAxisVolumeMl)}" fill="none" stroke="${trace.color}" stroke-width="2.2" opacity="0.9"/>`);
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
  ].filter((trace) => shouldPlotPhysiologyPvCandidate(trace.variantId, panel.profileId));
  if (traces.length === 0) {
    axis(out, x, y, w, h, "QMV forward");
    out.push(`<text x="${x + 8}" y="${y + 38}" fill="#fca5a5" font-family="Inter,Arial,sans-serif" font-size="10">hidden with rejected effective/capacity PV candidates</text>`);
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
    out.push(`<text x="${x + 8}" y="${y + 38}" fill="#fca5a5" font-family="Inter,Arial,sans-serif" font-size="10">hidden: no effective/capacity PV candidate</text>`);
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
  out.push(`<text x="${x + 6}" y="${y + h - 7}" fill="#c4b5fd" font-family="Inter,Arial,sans-serif" font-size="10">LAP</text>`);
  out.push(`<text x="${x + 38}" y="${y + h - 7}" fill="#fde68a" font-family="Inter,Arial,sans-serif" font-size="10">LVP</text>`);
  out.push(`<text x="${x + 72}" y="${y + h - 7}" fill="#bfdbfe" font-family="Inter,Arial,sans-serif" font-size="10">PV</text>`);
}

function renderPrime(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  panel: ReturnType<typeof runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1>[number],
): void {
  const trace = physiologyDiagnosticTrace(panel);
  if (trace == null) {
    axis(out, x, y, w, h, "physiology candidate s/e/a'");
    out.push(`<text x="${x + 8}" y="${y + 38}" fill="#fca5a5" font-family="Inter,Arial,sans-serif" font-size="10">hidden with rejected effective/capacity PV candidates</text>`);
    return;
  }
  const samples = trace.samples;
  const values = samples.flatMap((sample) => [
    sample.avPlaneGeometryReadback.sPrimeProxyCmPerSec ?? 0,
    sample.avPlaneGeometryReadback.ePrimeProxyCmPerSec ?? 0,
    sample.avPlaneGeometryReadback.aPrimeProxyCmPerSec ?? 0,
  ]);
  const maxAbsValue = Math.max(1, ...values.map((value) => Math.abs(value)));
  const sx = (theta: number) => x + theta * w;
  const sy = (value: number) => y + h / 2 - value / maxAbsValue * (h * 0.44);
  axis(out, x, y, w, h, `${trace.label} s/e/a'`);
  out.push(`<line x1="${x}" y1="${y + h / 2}" x2="${x + w}" y2="${y + h / 2}" stroke="#334155" stroke-width="1"/>`);
  out.push(`<path d="${pathForPrime(samples, sx, sy, "sPrimeProxyCmPerSec")}" fill="none" stroke="#22c55e" stroke-width="2.0" opacity="0.9"/>`);
  out.push(`<path d="${pathForPrime(samples, sx, sy, "ePrimeProxyCmPerSec")}" fill="none" stroke="#38bdf8" stroke-width="2.0" opacity="0.9"/>`);
  out.push(`<path d="${pathForPrime(samples, sx, sy, "aPrimeProxyCmPerSec")}" fill="none" stroke="#f97316" stroke-width="2.0" opacity="0.9"/>`);
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

function capacityAxisVolumeMl(sample: LeftHeartSubsystemSampleV2): number {
  return sample.laVolumeCoordinateReadback.effectiveCavityVolumeMl;
}

function shouldPlotPhysiologyPvCandidate(
  variantId: string,
  profileId: string,
): boolean {
  const row = rowByVariantProfile.get(`${variantId}::${profileId}`);
  return !!row?.capacityAxisPhaseOrientedPvPass
    && !!row.capacityAxisPhaseC1Pass
    && !!row.hiddenVolumeClean;
}

function physiologyDiagnosticTrace(panel: ReturnType<typeof runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1>[number]): {
  readonly variantId: string;
  readonly label: string;
  readonly samples: readonly LeftHeartSubsystemSampleV2[];
} | null {
  const candidates = [
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

function pathForPrime(
  samples: readonly LeftHeartSubsystemSampleV2[],
  sx: (theta: number) => number,
  sy: (value: number) => number,
  key: keyof LeftHeartSubsystemSampleV2["avPlaneGeometryReadback"],
): string {
  return samples.map((sample, index) => {
    const raw = sample.avPlaneGeometryReadback[key];
    const value = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
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
