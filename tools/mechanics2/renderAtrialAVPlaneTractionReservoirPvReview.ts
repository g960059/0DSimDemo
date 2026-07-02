import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildLeftHeartDynamicReserveVariantEnvelopeV1 } from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  applyAtrialAVPlaneTractionReservoirTransactionVariantV1,
  runAtrialAVPlaneTractionReservoirTransactionBenchV1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneTractionReservoirTransactionBench";
import { runLeftHeartSubsystemV2, type LeftHeartSubsystemSampleV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/atrial-av-plane-traction-reservoir-pv-review.svg",
);

const profileIds: readonly FourChamberSubsystemProfileIdV1[] = [
  "normal-hr75",
  "normal-hr90",
  "preload-low",
  "preload-high",
  "afterload-high",
  "contractility-low",
  "contractility-high",
];

const report = runAtrialAVPlaneTractionReservoirTransactionBenchV1();
const bestVariant = report.variants.find((variant) =>
  variant.variantId === report.summary.bestTopologyVariantId
)!;
const baselineVariant = report.variants.find((variant) => variant.variantId === "compliance-node-no-avplane")!;
const baseParams = buildLeftHeartDynamicReserveVariantEnvelopeV1("active-length-mv-closure-stateful-root08");
const panels = profileIds.map((profileId, index) => {
  const baselineRun = runLeftHeartSubsystemV2(
    applyAtrialAVPlaneTractionReservoirTransactionVariantV1(baseParams[index]!, baselineVariant),
  );
  const bestRun = runLeftHeartSubsystemV2(
    applyAtrialAVPlaneTractionReservoirTransactionVariantV1(baseParams[index]!, bestVariant),
  );
  return { profileId, baseline: baselineRun.finalBeatSamples, best: bestRun.finalBeatSamples };
});

const width = 980;
const panelWidth = 430;
const panelHeight = 270;
const marginX = 52;
const marginY = 92;
const gapX = 34;
const gapY = 26;
const height = marginY + 4 * panelHeight + 3 * gapY + 48;

const svg: string[] = [];
svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
svg.push(`<rect width="${width}" height="${height}" fill="#070b13"/>`);
svg.push(`<text x="34" y="34" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700">Atrial AV-plane traction reservoir PV review</text>`);
svg.push(`<text x="34" y="58" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="13">Best topology variant: ${report.summary.bestTopologyVariantId}. This is a sidecar topology signal, not morphology acceptance.</text>`);
svg.push(`<line x1="34" y1="76" x2="76" y2="76" stroke="#cbd5e1" stroke-width="3"/>`);
svg.push(`<text x="84" y="80" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="13">baseline</text>`);
svg.push(`<line x1="174" y1="76" x2="216" y2="76" stroke="#22c55e" stroke-width="3"/>`);
svg.push(`<text x="224" y="80" fill="#22c55e" font-family="Inter,Arial,sans-serif" font-size="13">AV-plane traction + accepted venous flow</text>`);

for (let i = 0; i < panels.length; i++) {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = marginX + col * (panelWidth + gapX);
  const y = marginY + row * (panelHeight + gapY);
  renderPanel(svg, x, y, panelWidth, panelHeight, panels[i]!.profileId, panels[i]!.baseline, panels[i]!.best);
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
  title: string,
  baseline: readonly LeftHeartSubsystemSampleV2[],
  best: readonly LeftHeartSubsystemSampleV2[],
): void {
  const pad = 42;
  const xs = [...baseline, ...best].map((sample) => sample.acceptedLaVolumeMl);
  const ps = [...baseline, ...best].map((sample) => sample.lapMmHg);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minP = Math.min(...ps);
  const maxP = Math.max(...ps);
  const sx = (value: number) => x + pad + (value - minX) / Math.max(maxX - minX, 1e-9) * (w - 2 * pad);
  const sy = (value: number) => y + h - pad - (value - minP) / Math.max(maxP - minP, 1e-9) * (h - 2 * pad);
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="#111827" stroke="#253044"/>`);
  out.push(`<text x="${x + 18}" y="${y + 28}" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="16" font-weight="700">${title}</text>`);
  out.push(`<line x1="${x + pad}" y1="${y + h - pad}" x2="${x + w - pad}" y2="${y + h - pad}" stroke="#334155"/>`);
  out.push(`<line x1="${x + pad}" y1="${y + pad}" x2="${x + pad}" y2="${y + h - pad}" stroke="#334155"/>`);
  out.push(`<text x="${x + pad}" y="${y + h - 13}" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="11">LA volume</text>`);
  out.push(`<text x="${x + 10}" y="${y + pad - 5}" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="11" transform="rotate(-90 ${x + 10},${y + pad - 5})">LAP</text>`);
  out.push(`<path d="${pathFor(baseline, sx, sy)}" fill="none" stroke="#cbd5e1" stroke-width="3" opacity="0.8"/>`);
  out.push(`<path d="${pathFor(best, sx, sy)}" fill="none" stroke="#22c55e" stroke-width="3" opacity="0.9"/>`);
}

function pathFor(
  samples: readonly LeftHeartSubsystemSampleV2[],
  sx: (value: number) => number,
  sy: (value: number) => number,
): string {
  return samples
    .map((sample, index) =>
      `${index === 0 ? "M" : "L"}${sx(sample.acceptedLaVolumeMl).toFixed(1)},${sy(sample.lapMmHg).toFixed(1)}`
    )
    .join(" ");
}
