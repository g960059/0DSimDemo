import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildLeftHeartDynamicReserveVariantEnvelopeV1 } from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  applyAtrialTwoStateReservoirTransactionVariantV1,
  ATRIAL_TWO_STATE_RESERVOIR_TRANSACTION_VARIANTS_V1,
} from "@/engine/mechanics2/benches/AtrialTwoStateReservoirTransactionBench";
import { runLeftHeartSubsystemV2, type LeftHeartSubsystemSampleV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/atrial-reservoir-topology-orientation-review.svg",
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

const selectedVariant = ATRIAL_TWO_STATE_RESERVOIR_TRANSACTION_VARIANTS_V1.find((variant) =>
  variant.variantId === "two-state-cap32-suction2-recoil4"
)!;
const baseParams = buildLeftHeartDynamicReserveVariantEnvelopeV1("active-length-mv-closure-stateful-root08");
const panels = profileIds.map((profileId, index) => {
  const run = runLeftHeartSubsystemV2(
    applyAtrialTwoStateReservoirTransactionVariantV1(baseParams[index]!, selectedVariant),
  );
  return { profileId, samples: run.finalBeatSamples };
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
svg.push(`<text x="34" y="34" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700">Atrial reservoir topology orientation review</text>`);
svg.push(`<text x="34" y="58" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="13">blood-volume axis fails opposed lobes; effective wall-stretch axis reveals the hidden orientation signal. Acceptance still requires blood/cavity volume coevolution.</text>`);
svg.push(`<line x1="34" y1="76" x2="76" y2="76" stroke="#cbd5e1" stroke-width="3"/>`);
svg.push(`<text x="84" y="80" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="13">blood volume</text>`);
svg.push(`<line x1="184" y1="76" x2="226" y2="76" stroke="#f59e0b" stroke-width="3"/>`);
svg.push(`<text x="234" y="80" fill="#f59e0b" font-family="Inter,Arial,sans-serif" font-size="13">effective stretch (blood - capacity)</text>`);

for (let i = 0; i < panels.length; i++) {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = marginX + col * (panelWidth + gapX);
  const y = marginY + row * (panelHeight + gapY);
  renderPanel(svg, x, y, panelWidth, panelHeight, panels[i]!.profileId, panels[i]!.samples);
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
  samples: readonly LeftHeartSubsystemSampleV2[],
): void {
  const pad = 42;
  const bloodX = samples.map((sample) => sample.acceptedLaVolumeMl);
  const stretchX = samples.map((sample) => sample.acceptedLaVolumeMl - sample.laReservoirGeometryDeltaMl);
  const p = samples.map((sample) => sample.lapMmHg);
  const minX = Math.min(...bloodX, ...stretchX);
  const maxX = Math.max(...bloodX, ...stretchX);
  const minP = Math.min(...p);
  const maxP = Math.max(...p);
  const sx = (value: number) => x + pad + (value - minX) / Math.max(maxX - minX, 1e-9) * (w - 2 * pad);
  const sy = (value: number) => y + h - pad - (value - minP) / Math.max(maxP - minP, 1e-9) * (h - 2 * pad);
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="#111827" stroke="#253044"/>`);
  out.push(`<text x="${x + 18}" y="${y + 28}" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="16" font-weight="700">${title}</text>`);
  out.push(`<line x1="${x + pad}" y1="${y + h - pad}" x2="${x + w - pad}" y2="${y + h - pad}" stroke="#334155"/>`);
  out.push(`<line x1="${x + pad}" y1="${y + pad}" x2="${x + pad}" y2="${y + h - pad}" stroke="#334155"/>`);
  out.push(`<text x="${x + pad}" y="${y + h - 13}" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="11">LA volume axis</text>`);
  out.push(`<text x="${x + 10}" y="${y + pad - 5}" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="11" transform="rotate(-90 ${x + 10},${y + pad - 5})">LAP</text>`);
  out.push(`<path d="${pathFor(bloodX, p, sx, sy)}" fill="none" stroke="#cbd5e1" stroke-width="3" opacity="0.86"/>`);
  out.push(`<path d="${pathFor(stretchX, p, sx, sy)}" fill="none" stroke="#f59e0b" stroke-width="3" opacity="0.9"/>`);
}

function pathFor(
  xs: readonly number[],
  ys: readonly number[],
  sx: (value: number) => number,
  sy: (value: number) => number,
): string {
  return xs.map((value, index) => `${index === 0 ? "M" : "L"}${sx(value).toFixed(1)},${sy(ys[index]!).toFixed(1)}`).join(" ");
}
