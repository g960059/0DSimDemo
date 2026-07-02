import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  applyAVPlaneVenousReservoirCoEvolutionVariantV1,
  AV_PLANE_VENOUS_RESERVOIR_COEVOLUTION_VARIANTS_V1,
  runAVPlaneVenousReservoirCoEvolutionBenchV1,
  type AVPlaneVenousReservoirCoEvolutionVariantIdV1,
} from "@/engine/mechanics2/benches/AVPlaneVenousReservoirCoEvolutionBench";
import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

const OUTPUT_PATH =
  "data/mechanics2/visuals/av-plane-venous-reservoir-coevolution-pv-review.svg" as const;

const LEFT_VARIANT_ID = "active-length-mv-closure-stateful-root08" as const;
const PROFILES: readonly FourChamberSubsystemProfileIdV1[] = [
  "normal-hr75",
  "normal-hr90",
  "preload-low",
  "preload-high",
  "afterload-high",
  "contractility-low",
  "contractility-high",
];

type Series = {
  readonly label: string;
  readonly color: string;
  readonly samples: readonly LeftHeartSubsystemSampleV2[];
};

type Panel = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly series: readonly Series[];
};

const report = runAVPlaneVenousReservoirCoEvolutionBenchV1();
const bestVariantId = report.summary.bestVariantId;
const bestVariant = variantById(bestVariantId);
const baselineVariant = variantById("compliance-node-no-avplane");
const baseParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);

const panels = PROFILES.map((profileId, index): Panel => {
  const params = baseParams[index]!;
  return {
    profileId,
    series: [
      {
        label: "baseline",
        color: "#9aa4b2",
        samples: runLeftHeartSubsystemV2(
          applyAVPlaneVenousReservoirCoEvolutionVariantV1(params, baselineVariant),
        ).finalBeatSamples,
      },
      {
        label: bestVariantId,
        color: "#22c55e",
        samples: runLeftHeartSubsystemV2(
          applyAVPlaneVenousReservoirCoEvolutionVariantV1(params, bestVariant),
        ).finalBeatSamples,
      },
    ],
  };
});

const svg = renderSvg(panels, bestVariantId);
mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${svg}\n`);
console.log(OUTPUT_PATH);

function variantById(
  variantId: AVPlaneVenousReservoirCoEvolutionVariantIdV1,
) {
  const variant = AV_PLANE_VENOUS_RESERVOIR_COEVOLUTION_VARIANTS_V1.find((candidate) =>
    candidate.variantId === variantId
  );
  if (!variant) throw new Error(`Unknown variant: ${variantId}`);
  return variant;
}

function renderSvg(
  inputPanels: readonly Panel[],
  bestVariantId: AVPlaneVenousReservoirCoEvolutionVariantIdV1,
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
    legendItem(34, 58, "#9aa4b2", "baseline"),
    legendItem(154, 58, "#22c55e", bestVariantId),
  ].join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#0f172a"/>
  <text x="28" y="30" fill="#e5e7eb" font-family="Arial, sans-serif" font-size="18" font-weight="700">AV-plane venous-reservoir co-evolution PV review</text>
  <text x="28" y="48" fill="#94a3b8" font-family="Arial, sans-serif" font-size="12">LA pressure-volume loops; acceptance requires opposed a/v lobes, not self-crossing alone.</text>
  ${legend}
  ${panelSvgs}
</svg>`;
}

function renderPanel(panel: Panel, x: number, y: number, width: number, height: number): string {
  const plotX = x + 48;
  const plotY = y + 26;
  const plotW = width - 76;
  const plotH = height - 66;
  const volumes = panel.series.flatMap((series) => series.samples.map(visibleLaVolumeMl));
  const pressures = panel.series.flatMap((series) => series.samples.map((sample) => sample.lapMmHg));
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
    const points = series.samples.map((sample) =>
      `${round(scaleX(visibleLaVolumeMl(sample)))},${round(scaleY(sample.lapMmHg))}`
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

function visibleLaVolumeMl(sample: LeftHeartSubsystemSampleV2): number {
  return sample.acceptedLaVolumeMl + sample.laEffectiveGeometryDeltaMl;
}
