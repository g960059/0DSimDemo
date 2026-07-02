import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  runAtrialReservoirTractionForcingBenchV1,
  runAtrialReservoirTractionForcingSeriesV1,
  type AtrialReservoirTractionForcingSeriesV1,
  type AtrialReservoirTractionProfileIdV1,
  type AtrialReservoirTractionVariantIdV1,
} from "@/engine/mechanics2/benches/AtrialReservoirTractionForcingBench";

const OUTPUT_PATH = "data/mechanics2/visuals/atrial-reservoir-traction-forcing-pv-review.svg" as const;

const PROFILES: readonly AtrialReservoirTractionProfileIdV1[] = [
  "normal-hr75",
  "normal-hr90",
  "venous-low",
  "venous-high",
  "avplane-low",
  "booster-high",
  "stiff-atrial-wall",
];

type Series = {
  readonly label: string;
  readonly color: string;
  readonly samples: AtrialReservoirTractionForcingSeriesV1;
};

type Panel = {
  readonly profileId: AtrialReservoirTractionProfileIdV1;
  readonly series: readonly Series[];
};

const report = runAtrialReservoirTractionForcingBenchV1();
const bestVariantId = report.summary.bestVariantId;
const panels = PROFILES.map((profileId): Panel => ({
  profileId,
  series: [
    {
      label: "no-traction",
      color: "#9aa4b2",
      samples: runAtrialReservoirTractionForcingSeriesV1(profileId, "no-traction"),
    },
    {
      label: bestVariantId,
      color: "#22c55e",
      samples: runAtrialReservoirTractionForcingSeriesV1(profileId, bestVariantId),
    },
  ],
}));

const svg = renderSvg(panels, bestVariantId);
mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${svg}\n`);
console.log(OUTPUT_PATH);

function renderSvg(
  inputPanels: readonly Panel[],
  bestVariantId: AtrialReservoirTractionVariantIdV1,
): string {
  const panelWidth = 360;
  const panelHeight = 260;
  const cols = 2;
  const rows = Math.ceil(inputPanels.length / cols);
  const margin = 28;
  const width = cols * panelWidth + margin * 2;
  const height = rows * panelHeight + margin * 2 + 72;
  const panelSvgs = inputPanels.map((panel, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    return renderPanel(panel, margin + col * panelWidth, margin + 48 + row * panelHeight, panelWidth, panelHeight);
  }).join("\n");
  const legend = [
    legendItem(34, 58, "#9aa4b2", "no-traction"),
    legendItem(154, 58, "#22c55e", bestVariantId),
  ].join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#0f172a"/>
  <text x="28" y="30" fill="#e5e7eb" font-family="Arial, sans-serif" font-size="18" font-weight="700">Atrial reservoir traction forcing PV review</text>
  <text x="28" y="48" fill="#94a3b8" font-family="Arial, sans-serif" font-size="12">Isolated prescribed-flow test: MV-closed AV-plane velocity traction must enlarge the reservoir v-loop without hidden volume.</text>
  ${legend}
  ${panelSvgs}
</svg>`;
}

function renderPanel(panel: Panel, x: number, y: number, width: number, height: number): string {
  const plotX = x + 48;
  const plotY = y + 26;
  const plotW = width - 76;
  const plotH = height - 66;
  const volumes = panel.series.flatMap((series) => [...series.samples.volumeMl]);
  const pressures = panel.series.flatMap((series) => [...series.samples.pressureMmHg]);
  const xMin = Math.min(...volumes);
  const xMax = Math.max(...volumes);
  const yMin = Math.min(...pressures);
  const yMax = Math.max(...pressures);
  const xPad = Math.max(1, 0.08 * (xMax - xMin));
  const yPad = Math.max(0.4, 0.12 * (yMax - yMin));
  const scaleX = (value: number) =>
    plotX + ((value - (xMin - xPad)) / Math.max((xMax + xPad) - (xMin - xPad), 1e-9)) * plotW;
  const scaleY = (value: number) =>
    plotY + plotH - ((value - (yMin - yPad)) / Math.max((yMax + yPad) - (yMin - yPad), 1e-9)) * plotH;
  const polylines = panel.series.map((series) => {
    const points = series.samples.volumeMl.map((volume, index) =>
      `${round(scaleX(volume))},${round(scaleY(series.samples.pressureMmHg[index]!))}`
    ).join(" ");
    return `<polyline points="${points}" fill="none" stroke="${series.color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
  }).join("\n");
  const axisColor = "#334155";
  return `<g>
    <rect x="${x + 12}" y="${y + 4}" width="${width - 24}" height="${height - 18}" rx="8" fill="#111827" stroke="#1f2937"/>
    <text x="${x + 22}" y="${y + 24}" fill="#e5e7eb" font-family="Arial, sans-serif" font-size="13" font-weight="700">${escapeXml(panel.profileId)}</text>
    <line x1="${plotX}" y1="${plotY + plotH}" x2="${plotX + plotW}" y2="${plotY + plotH}" stroke="${axisColor}"/>
    <line x1="${plotX}" y1="${plotY}" x2="${plotX}" y2="${plotY + plotH}" stroke="${axisColor}"/>
    <text x="${plotX}" y="${plotY + plotH + 22}" fill="#94a3b8" font-family="Arial, sans-serif" font-size="10">LA volume</text>
    <text x="${plotX - 38}" y="${plotY + 10}" fill="#94a3b8" font-family="Arial, sans-serif" font-size="10" transform="rotate(-90 ${plotX - 38} ${plotY + 10})">LAP</text>
    ${polylines}
  </g>`;
}

function legendItem(x: number, y: number, color: string, label: string): string {
  return `<g><line x1="${x}" y1="${y}" x2="${x + 28}" y2="${y}" stroke="${color}" stroke-width="3"/><text x="${x + 34}" y="${y + 4}" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="12">${escapeXml(label)}</text></g>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
