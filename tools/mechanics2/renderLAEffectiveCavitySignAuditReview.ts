import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  runFullLeftAVPlaneResidualRoutingBenchV1,
  runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1,
  type FullLeftAVPlaneResidualRoutingVariantIdV1,
} from "@/engine/mechanics2/benches/FullLeftAVPlaneResidualRoutingBench";
import {
  runLAEffectiveCavitySignAuditBenchV1,
  type LAEffectiveCavitySignAuditRowV1,
} from "@/engine/mechanics2/benches/LAEffectiveCavitySignAuditBench";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";
import type { LeftHeartSubsystemSampleV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outPath = resolve(repoRoot, "data/mechanics2/visuals/la-effective-cavity-sign-audit-review.svg");

const audit = runLAEffectiveCavitySignAuditBenchV1();
const routing = runFullLeftAVPlaneResidualRoutingBenchV1();
const rowByKey = new Map<string, LAEffectiveCavitySignAuditRowV1>(
  audit.rows.map((row) => [`${row.variantId}::${row.profileId}`, row] as const),
);
const panels = runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1(
  routing.summary.bestFullResidualVariantId,
  routing.summary.bestOverallVariantId,
  routing.summary.bestSmoothCoreVariantId,
  routing.summary.bestV2VariantId,
  routing.summary.bestV3VariantId,
  routing.summary.bestV4VariantId,
  routing.summary.bestV5VariantId,
  routing.summary.bestV6VariantId,
  routing.summary.bestV8VariantId,
  routing.summary.bestV9VariantId,
  routing.summary.bestV10VariantId,
);

const width = 1640;
const marginX = 36;
const marginY = 242;
const panelW = 770;
const panelH = 360;
const gapX = 28;
const gapY = 26;
const height = marginY + Math.ceil(panels.length / 2) * panelH + (Math.ceil(panels.length / 2) - 1) * gapY + 54;
const svg: string[] = [];

svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
svg.push(`<rect width="${width}" height="${height}" fill="#070b13"/>`);
svg.push(`<text x="34" y="34" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700">LA effective cavity sign audit</text>`);
svg.push(`<text x="34" y="60" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="13">Diagnostic only. Strict LA blood-volume PV remains authoritative. Capacity-axis / effective-cavity loops are hidden unless the corresponding blood-volume PV row passes phase and C1 checks.</text>`);
svg.push(`<text x="34" y="84" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="12">status: ${audit.summary.reviewStatus}; applied fixed-volume pass ${audit.summary.appliedFixedVolumeProbePass}/${audit.summary.totalRows}; counterfactual pass ${audit.summary.counterfactualFixedVolumeProbePass}/${audit.summary.totalRows}; positive-pressure-source rows ${audit.summary.avPlanePositivePressureSourceRows}</text>`);
svg.push(`<text x="34" y="104" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="12">max applied relief ${audit.summary.maxAppliedPressureReliefMmHg.toFixed(2)} mmHg; max counterfactual relief ${audit.summary.maxCounterfactualPressureReliefMmHg.toFixed(2)} mmHg; max reference capacity ${audit.summary.maxReferenceCapacityMl.toFixed(2)} mL</text>`);
svg.push(`<text x="34" y="124" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="12">strict blood phase+C1 rows ${audit.summary.strictBloodPhaseAndC1Rows}; capacity-axis rows hidden by strict blood gate ${audit.summary.capacityAxisHiddenRows}; plotted PV rows ${audit.summary.plottedOwnerSvgRows}</text>`);
legend(svg, 34, 154, "#f9a8d4", "V6 ref-capacity");
legend(svg, 212, 154, "#fb7185", "V8 ref-capacity + venous");
legend(svg, 448, 154, "#f8fafc", "V9 dynamic ref-pressure");
legend(svg, 704, 154, "#c084fc", "V10 separated capacity");
legend(svg, 950, 154, "#a855f7", "best full-left residual");
legend(svg, 1188, 154, "#f97316", "raw traction");
svg.push(`<text x="34" y="188" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">PV panel intentionally withholds elastance-rise / display-axis-only V-loop candidates. DeltaP panels still show sign diagnostics for rejected candidates.</text>`);
svg.push(`<circle cx="34" cy="214" r="4" fill="#f8fafc" stroke="#111827" stroke-width="1.2"/>`);
svg.push(`<text x="47" y="219" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="12">MV opening</text>`);
svg.push(`<circle cx="150" cy="214" r="4" fill="#111827" stroke="#f8fafc" stroke-width="1.5"/>`);
svg.push(`<text x="164" y="219" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="12">MV closure</text>`);
svg.push(`<path d="M278,210 L286,218 M286,210 L278,218" stroke="#ef4444" stroke-width="1.4"/>`);
svg.push(`<text x="294" y="219" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="12">tangent/C1 marker</text>`);

for (let i = 0; i < panels.length; i++) {
  const col = i % 2;
  const row = Math.floor(i / 2);
  renderPanel(svg, marginX + col * (panelW + gapX), marginY + row * (panelH + gapY), panelW, panelH, panels[i]!);
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
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#111827" stroke="#253044"/>`);
  out.push(`<text x="${x + 14}" y="${y + 25}" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="700">${panel.profileId}</text>`);
  const pw = (w - 58) / 3;
  const ph = 248;
  renderBloodPv(out, x + 16, y + 44, pw, ph, panel);
  renderDeltaPressure(out, x + 29 + pw, y + 44, pw, ph, panel);
  renderPressureAndCapacity(out, x + 42 + 2 * pw, y + 44, pw, ph, panel);
  renderRowBadges(out, x + 16, y + 316, panel);
}

function renderBloodPv(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  panel: ReturnType<typeof runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1>[number],
): void {
  axis(out, x, y, w, h, "strict LA blood PV");
  const traces = signAuditTraces(panel).filter((trace) => rowFor(trace.variantId, panel.profileId)?.plottedInOwnerSvg);
  if (traces.length === 0) {
    out.push(`<text x="${x + 9}" y="${y + 36}" fill="#fca5a5" font-family="Inter,Arial,sans-serif" font-size="10">no trace drawn</text>`);
    out.push(`<text x="${x + 9}" y="${y + 52}" fill="#fca5a5" font-family="Inter,Arial,sans-serif" font-size="10">all capacity/display V-loops rejected by blood-PV phase/C1 gate</text>`);
    return;
  }
  const all = traces.flatMap((trace) => trace.samples);
  const minV = Math.min(...all.map((sample) => sample.acceptedLaVolumeMl));
  const maxV = Math.max(...all.map((sample) => sample.acceptedLaVolumeMl));
  const minP = Math.min(...all.map((sample) => sample.lapMmHg));
  const maxP = Math.max(...all.map((sample) => sample.lapMmHg));
  const sx = (value: number) => x + (value - minV) / Math.max(maxV - minV, 1e-9) * w;
  const sy = (value: number) => y + h - (value - minP) / Math.max(maxP - minP, 1e-9) * h;
  for (const trace of traces) {
    out.push(`<path d="${pathForPv(trace.samples, sx, sy, (sample) => sample.acceptedLaVolumeMl)}" fill="none" stroke="${trace.color}" stroke-width="2.3" opacity="0.9"/>`);
    renderMarkers(out, trace.samples, sx, sy, trace.color);
  }
}

function renderDeltaPressure(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  panel: ReturnType<typeof runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1>[number],
): void {
  axis(out, x, y, w, h, "fixed-blood deltaP AV");
  const traces = signAuditTraces(panel).filter((trace) =>
    trace.role === "bestV8" || trace.role === "bestV9" || trace.role === "bestV10" || trace.role === "bestFull"
  );
  const series = traces.flatMap((trace) => {
    const row = rowFor(trace.variantId, panel.profileId);
    return trace.samples.flatMap((sample) => {
      const compliance = row?.inferredComplianceMlPerMmHg ?? null;
      return [
        deltaPressure(sample.laVolumeCoordinateReadback.pressureReferenceCapacityMl, compliance),
        deltaPressure(sample.laVolumeCoordinateReadback.avPlaneReferenceCapacityMl, compliance),
      ];
    });
  });
  const minY = Math.min(-0.2, ...series);
  const maxY = Math.max(0.2, ...series);
  const sx = (theta: number) => x + theta * w;
  const sy = (value: number) => y + h - (value - minY) / Math.max(maxY - minY, 1e-9) * h;
  out.push(`<line x1="${x}" y1="${sy(0).toFixed(1)}" x2="${x + w}" y2="${sy(0).toFixed(1)}" stroke="#64748b" stroke-width="1" stroke-dasharray="3 3"/>`);
  for (const trace of traces) {
    const row = rowFor(trace.variantId, panel.profileId);
    if (!row) continue;
    const compliance = row.inferredComplianceMlPerMmHg;
    out.push(`<path d="${pathForTrace(trace.samples, sx, sy, (sample) =>
      deltaPressure(sample.laVolumeCoordinateReadback.pressureReferenceCapacityMl, compliance)
    )}" fill="none" stroke="${trace.color}" stroke-width="2.1" opacity="0.9"/>`);
    out.push(`<path d="${pathForTrace(trace.samples, sx, sy, (sample) =>
      deltaPressure(sample.laVolumeCoordinateReadback.avPlaneReferenceCapacityMl, compliance)
    )}" fill="none" stroke="${trace.color}" stroke-width="1.3" opacity="0.58" stroke-dasharray="5 4"/>`);
  }
  out.push(`<text x="${x + 8}" y="${y + h - 8}" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="9">solid=applied, dashed=counterfactual; negative lowers LA pressure</text>`);
}

function renderPressureAndCapacity(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  panel: ReturnType<typeof runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1>[number],
): void {
  axis(out, x, y, w, h, "pressure/capacity traces");
  const traces = signAuditTraces(panel).filter((trace) =>
    trace.role === "bestV8" || trace.role === "bestV9" || trace.role === "bestV10"
  );
  const allP = traces.flatMap((trace) => trace.samples.map((sample) => sample.lapMmHg));
  const allC = traces.flatMap((trace) => trace.samples.map((sample) =>
    sample.laVolumeCoordinateReadback.avPlaneReferenceCapacityMl
  ));
  const minP = Math.min(...allP);
  const maxP = Math.max(...allP);
  const maxC = Math.max(1, ...allC);
  const sx = (theta: number) => x + theta * w;
  const syP = (value: number) => y + h - (value - minP) / Math.max(maxP - minP, 1e-9) * h;
  const syC = (value: number) => y + h - value / maxC * h;
  for (const trace of traces) {
    out.push(`<path d="${pathForTrace(trace.samples, sx, syP, (sample) => sample.lapMmHg)}" fill="none" stroke="${trace.color}" stroke-width="2.0" opacity="0.9"/>`);
    out.push(`<path d="${pathForTrace(trace.samples, sx, syC, (sample) =>
      sample.laVolumeCoordinateReadback.avPlaneReferenceCapacityMl
    )}" fill="none" stroke="${trace.color}" stroke-width="1.3" opacity="0.62" stroke-dasharray="4 4"/>`);
  }
  out.push(`<text x="${x + 8}" y="${y + h - 8}" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="9">solid=P_LA, dashed=AV reference capacity</text>`);
}

function renderRowBadges(
  out: string[],
  x: number,
  y: number,
  panel: ReturnType<typeof runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1>[number],
): void {
  const rows = signAuditTraces(panel)
    .map((trace) => rowFor(trace.variantId, panel.profileId))
    .filter((row): row is LAEffectiveCavitySignAuditRowV1 => row != null);
  const v8 = rows.find((row) => row.traceRole === "bestV8ReferenceCapacityVenous");
  const v9 = rows.find((row) => row.traceRole === "bestV9DynamicReferencePressure");
  const v10 = rows.find((row) => row.traceRole === "bestV10SeparatedCapacity");
  badge(out, x, y, `V8 cf relief ${format(v8?.fixedVolumeCounterfactualMaxPressureReliefMmHg)} mmHg; blood phase ${yn(v8?.bloodPvPhasePass)}`, "#fb7185");
  badge(out, x + 250, y, `V9 applied relief ${format(v9?.fixedVolumeProbeMaxPressureReliefMmHg)} mmHg; blood phase ${yn(v9?.bloodPvPhasePass)}`, "#f8fafc");
  badge(out, x + 520, y, `V10 relief ${format(v10?.fixedVolumeProbeMaxPressureReliefMmHg)} mmHg; source ${yn(v10?.sourceSurfacePass)}`, "#c084fc");
  const hiddenCount = rows.filter((row) => row.capacityAxisHiddenByStrictBloodGate).length;
  out.push(`<text x="${x}" y="${y + 28}" fill="#fca5a5" font-family="Inter,Arial,sans-serif" font-size="10">${hiddenCount} capacity-axis/display loop rows hidden by strict blood-PV gate</text>`);
}

function signAuditTraces(
  panel: ReturnType<typeof runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1>[number],
): readonly {
  readonly role: string;
  readonly variantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly samples: readonly LeftHeartSubsystemSampleV2[];
  readonly color: string;
}[] {
  return uniqueTraceSpecs([
    { role: "raw", variantId: "raw-traction-reference", samples: panel.rawTraction, color: "#f97316" },
    { role: "bestFull", variantId: panel.bestFullResidualVariantId, samples: panel.bestFullResidual, color: "#a855f7" },
    { role: "bestV6", variantId: panel.bestV6VariantId, samples: panel.bestV6, color: "#f9a8d4" },
    { role: "bestV8", variantId: panel.bestV8VariantId, samples: panel.bestV8, color: "#fb7185" },
    { role: "bestV9", variantId: panel.bestV9VariantId, samples: panel.bestV9, color: "#f8fafc" },
    { role: "bestV10", variantId: panel.bestV10VariantId, samples: panel.bestV10, color: "#c084fc" },
  ]);
}

function uniqueTraceSpecs<T extends { readonly variantId: string }>(traces: readonly T[]): readonly T[] {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const trace of traces) {
    if (seen.has(trace.variantId)) continue;
    seen.add(trace.variantId);
    unique.push(trace);
  }
  return unique;
}

function rowFor(
  variantId: FullLeftAVPlaneResidualRoutingVariantIdV1,
  profileId: FourChamberSubsystemProfileIdV1,
): LAEffectiveCavitySignAuditRowV1 | undefined {
  return rowByKey.get(`${variantId}::${profileId}`);
}

function deltaPressure(capacityMl: number, complianceMlPerMmHg: number | null): number {
  if (complianceMlPerMmHg == null || complianceMlPerMmHg <= 0) return 0;
  return -Math.max(0, capacityMl) / complianceMlPerMmHg;
}

function renderMarkers(
  out: string[],
  samples: readonly LeftHeartSubsystemSampleV2[],
  sx: (value: number) => number,
  sy: (value: number) => number,
  color: string,
): void {
  const openingIndex = findMvOpeningIndex(samples);
  const closureIndex = openingIndex == null ? null : findMvClosureIndexAfter(samples, openingIndex);
  if (openingIndex != null) {
    const sample = samples[openingIndex]!;
    out.push(`<circle cx="${sx(sample.acceptedLaVolumeMl).toFixed(1)}" cy="${sy(sample.lapMmHg).toFixed(1)}" r="3.6" fill="${color}" stroke="#0f172a" stroke-width="1.2"/>`);
  }
  if (closureIndex != null) {
    const sample = samples[closureIndex]!;
    out.push(`<circle cx="${sx(sample.acceptedLaVolumeMl).toFixed(1)}" cy="${sy(sample.lapMmHg).toFixed(1)}" r="3.8" fill="#111827" stroke="${color}" stroke-width="1.5"/>`);
  }
  if (openingIndex != null && closureIndex != null) {
    const open = samples[openingIndex]!;
    const close = samples[closureIndex]!;
    out.push(`<line x1="${sx(close.acceptedLaVolumeMl).toFixed(1)}" y1="${sy(close.lapMmHg).toFixed(1)}" x2="${sx(open.acceptedLaVolumeMl).toFixed(1)}" y2="${sy(open.lapMmHg).toFixed(1)}" stroke="${color}" stroke-width="1" stroke-dasharray="4 4" opacity="0.5"/>`);
  }
}

function pathForPv(
  samples: readonly LeftHeartSubsystemSampleV2[],
  sx: (value: number) => number,
  sy: (value: number) => number,
  volume: (sample: LeftHeartSubsystemSampleV2) => number,
): string {
  return samples.map((sample, index) => {
    const command = index === 0 ? "M" : "L";
    return `${command}${sx(volume(sample)).toFixed(1)},${sy(sample.lapMmHg).toFixed(1)}`;
  }).join(" ");
}

function pathForTrace(
  samples: readonly LeftHeartSubsystemSampleV2[],
  sx: (theta: number) => number,
  sy: (value: number) => number,
  value: (sample: LeftHeartSubsystemSampleV2) => number,
): string {
  return samples.map((sample, index) => {
    const command = index === 0 ? "M" : "L";
    return `${command}${sx(sample.theta).toFixed(1)},${sy(value(sample)).toFixed(1)}`;
  }).join(" ");
}

function axis(out: string[], x: number, y: number, w: number, h: number, title: string): void {
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0b1220" stroke="#223047"/>`);
  for (let i = 1; i < 4; i++) {
    const gx = x + (w * i) / 4;
    const gy = y + (h * i) / 4;
    out.push(`<line x1="${gx}" y1="${y}" x2="${gx}" y2="${y + h}" stroke="#1f2937" stroke-width="1"/>`);
    out.push(`<line x1="${x}" y1="${gy}" x2="${x + w}" y2="${gy}" stroke="#1f2937" stroke-width="1"/>`);
  }
  out.push(`<text x="${x + 8}" y="${y + 17}" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="11">${title}</text>`);
}

function legend(out: string[], x: number, y: number, color: string, label: string): void {
  out.push(`<line x1="${x}" y1="${y}" x2="${x + 28}" y2="${y}" stroke="${color}" stroke-width="3"/>`);
  out.push(`<text x="${x + 36}" y="${y + 4}" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="12">${label}</text>`);
}

function badge(out: string[], x: number, y: number, label: string, color: string): void {
  out.push(`<rect x="${x}" y="${y - 14}" width="232" height="20" rx="4" fill="#0b1220" stroke="${color}" stroke-width="1" opacity="0.9"/>`);
  out.push(`<text x="${x + 7}" y="${y}" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="10">${label}</text>`);
}

function findMvOpeningIndex(samples: readonly LeftHeartSubsystemSampleV2[]): number | null {
  for (let i = 1; i < samples.length; i++) {
    if (samples[i - 1]!.mvOpen01 < 0.5 && samples[i]!.mvOpen01 >= 0.5) return i;
  }
  let best: number | null = null;
  let bestValue = 0;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i]!.mvOpen01 > bestValue) {
      best = i;
      bestValue = samples[i]!.mvOpen01;
    }
  }
  return bestValue > 0.5 ? best : null;
}

function findMvClosureIndexAfter(samples: readonly LeftHeartSubsystemSampleV2[], openingIndex: number): number | null {
  for (let offset = 1; offset < samples.length; offset++) {
    const prev = samples[(openingIndex + offset - 1) % samples.length]!;
    const nextIndex = (openingIndex + offset) % samples.length;
    const next = samples[nextIndex]!;
    if (prev.mvOpen01 >= 0.5 && next.mvOpen01 < 0.5) return nextIndex;
  }
  return null;
}

function format(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return "n/a";
  return value.toFixed(2);
}

function yn(value: boolean | undefined): string {
  return value ? "pass" : "fail";
}
