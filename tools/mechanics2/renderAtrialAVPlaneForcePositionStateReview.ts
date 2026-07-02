import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ATRIAL_AV_PLANE_FORCE_POSITION_STATE_VARIANTS_V1,
  runAtrialAVPlaneForcePositionStateReviewBenchV1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneForcePositionStateReviewBench";
import {
  applyAtrialAVPlaneWorkConjugateReviewVariantV1,
  ATRIAL_AV_PLANE_WORK_CONJUGATE_REVIEW_VARIANTS_V1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneWorkConjugateReviewBench";
import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  buildAVPlaneWorkCoordinateSeriesV1,
  type AVPlaneWorkCoordinateSampleV1,
} from "@/engine/mechanics2/core/AVPlaneWorkCoordinateStateV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/atrial-av-plane-force-position-state-review.svg",
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

const report = runAtrialAVPlaneForcePositionStateReviewBenchV1();
const rawVariant = ATRIAL_AV_PLANE_WORK_CONJUGATE_REVIEW_VARIANTS_V1.find((variant) =>
  variant.variantId === "raw-velocity-traction12-flow10-cap20"
)!;
const bestForceVariant = ATRIAL_AV_PLANE_FORCE_POSITION_STATE_VARIANTS_V1.find((variant) =>
  variant.variantId === report.summary.bestForceVariantId
)!;
const baseParams = buildLeftHeartDynamicReserveVariantEnvelopeV1("active-length-mv-closure-stateful-root08");
const panels = profileIds.map((profileId, index) => {
  const rawRun = runLeftHeartSubsystemV2(
    applyAtrialAVPlaneWorkConjugateReviewVariantV1(baseParams[index]!, rawVariant),
  );
  const forceRun = runLeftHeartSubsystemV2(applyForcePositionVariantForRender(baseParams[index]!, bestForceVariant));
  return {
    profileId,
    rawSamples: rawRun.finalBeatSamples,
    forceSamples: forceRun.finalBeatSamples,
    rawCoordinate: coordinateSamples(rawRun.finalBeatSamples, rawRun.params.sampleRateHz),
    forceCoordinate: coordinateSamples(forceRun.finalBeatSamples, forceRun.params.sampleRateHz),
  };
});

const width = 1240;
const panelWidth = 560;
const panelHeight = 270;
const marginX = 48;
const marginY = 108;
const gapX = 34;
const gapY = 26;
const height = marginY + 4 * panelHeight + 3 * gapY + 54;
const svg: string[] = [];
svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
svg.push(`<rect width="${width}" height="${height}" fill="#070b13"/>`);
svg.push(`<text x="34" y="34" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700">Atrial AV-plane force-position state review</text>`);
svg.push(`<text x="34" y="58" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="13">Mass-spring-damper AV-plane state compared with the raw velocity-traction v-loop topology reference.</text>`);
svg.push(`<text x="34" y="82" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best force-position: ${report.summary.bestForceVariantId}, source ${report.summary.bestForceSourceSurfacePass}/7, topology ${report.summary.bestForceTopologyPass}/7, MVF ${report.summary.bestForceMvfCleanCount}/7</text>`);
svg.push(`<line x1="820" y1="58" x2="862" y2="58" stroke="#22c55e" stroke-width="3"/>`);
svg.push(`<text x="870" y="62" fill="#22c55e" font-family="Inter,Arial,sans-serif" font-size="13">raw velocity traction</text>`);
svg.push(`<line x1="820" y1="80" x2="862" y2="80" stroke="#f97316" stroke-width="3"/>`);
svg.push(`<text x="870" y="84" fill="#f97316" font-family="Inter,Arial,sans-serif" font-size="13">force-position state</text>`);

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

function applyForcePositionVariantForRender(
  params: LeftHeartSubsystemParamsV2,
  variant: typeof ATRIAL_AV_PLANE_FORCE_POSITION_STATE_VARIANTS_V1[number],
): LeftHeartSubsystemParamsV2 {
  const rawParams = applyAtrialAVPlaneWorkConjugateReviewVariantV1(
    params,
    ATRIAL_AV_PLANE_WORK_CONJUGATE_REVIEW_VARIANTS_V1.find((candidate) =>
      candidate.variantId === "raw-velocity-traction12-flow10-cap20"
    )!,
  );
  return {
    ...rawParams,
    laLobeGeneratorMode: "av-plane-force-position-reservoir-transaction-v1",
    laEffectiveGeometryMode: "av-plane-force-position-reservoir-transaction-v1",
    laAVPlaneReservoirTractionGainMmHgPerNormPerSec: 0,
    laAVPlaneWorkCoordinateDriveForceN: variant.driveForceN,
    laAVPlaneWorkCoordinateStiffnessNPerNorm: variant.stiffnessNPerNorm,
    laAVPlaneWorkCoordinateDampingNsecPerNorm: variant.dampingNsecPerNorm,
    laAVPlaneWorkCoordinateMassKg: variant.massKg,
    laAVPlaneWorkCoordinateMaxVelocityNormPerSec: variant.maxVelocityNormPerSec,
  };
}

function coordinateSamples(
  samples: readonly LeftHeartSubsystemSampleV2[],
  sampleRateHz: number,
): readonly AVPlaneWorkCoordinateSampleV1[] {
  return buildAVPlaneWorkCoordinateSeriesV1(samples.map((sample) => ({
    theta: sample.theta,
    zAvNorm: sample.avPlaneGeometryReadback.zAvNorm,
    atrialGeometryDeltaMl: sample.laReservoirGeometryDeltaMl,
    tractionPressureMmHg: sample.laAVPlaneReservoirTractionPressureMmHg,
    hiddenBloodVolumeSourceMl: sample.laEffectiveGeometryHiddenBloodVolumeSourceMl,
  })), 1 / Math.max(sampleRateHz, 1e-9), {
    side: "left",
    annularAreaCm2: 20 / 1.2,
    maxDisplacementMm: 12,
  }).samples;
}

function renderPanel(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  panel: {
    readonly profileId: string;
    readonly rawSamples: readonly LeftHeartSubsystemSampleV2[];
    readonly forceSamples: readonly LeftHeartSubsystemSampleV2[];
    readonly rawCoordinate: readonly AVPlaneWorkCoordinateSampleV1[];
    readonly forceCoordinate: readonly AVPlaneWorkCoordinateSampleV1[];
  },
): void {
  const padX = 36;
  const padTop = 42;
  const plotW = (w - 4 * padX) / 3;
  const plotH = h - 72;
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#111827" stroke="#253044"/>`);
  out.push(`<text x="${x + 16}" y="${y + 27}" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="700">${panel.profileId}</text>`);
  renderPv(out, x + padX, y + padTop, plotW, plotH, panel.rawSamples, panel.forceSamples);
  renderCoordinateTrace(out, x + 2 * padX + plotW, y + padTop, plotW, plotH, panel.rawCoordinate, panel.forceCoordinate);
  renderPowerTrace(out, x + 3 * padX + 2 * plotW, y + padTop, plotW, plotH, panel.rawCoordinate, panel.forceCoordinate);
}

function renderPv(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  raw: readonly LeftHeartSubsystemSampleV2[],
  force: readonly LeftHeartSubsystemSampleV2[],
): void {
  const xs = [...raw, ...force].map((sample) => sample.acceptedLaVolumeMl);
  const ps = [...raw, ...force].map((sample) => sample.lapMmHg);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minP = Math.min(...ps);
  const maxP = Math.max(...ps);
  const sx = (value: number) => x + (value - minX) / Math.max(maxX - minX, 1e-9) * w;
  const sy = (value: number) => y + h - (value - minP) / Math.max(maxP - minP, 1e-9) * h;
  axis(out, x, y, w, h, "LA PV");
  out.push(`<path d="${pathForPv(raw, sx, sy)}" fill="none" stroke="#22c55e" stroke-width="2.4" opacity="0.9"/>`);
  out.push(`<path d="${pathForPv(force, sx, sy)}" fill="none" stroke="#f97316" stroke-width="2.4" opacity="0.9"/>`);
}

function renderCoordinateTrace(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  raw: readonly AVPlaneWorkCoordinateSampleV1[],
  force: readonly AVPlaneWorkCoordinateSampleV1[],
): void {
  const maxValue = Math.max(1, ...[...raw, ...force].map((sample) => sample.displacementMm));
  const sx = (theta: number) => x + theta * w;
  const sy = (value: number) => y + h - value / maxValue * h;
  axis(out, x, y, w, h, "s_av displacement");
  out.push(`<path d="${pathForCoordinate(raw, sx, sy, "displacementMm")}" fill="none" stroke="#22c55e" stroke-width="2.4" opacity="0.9"/>`);
  out.push(`<path d="${pathForCoordinate(force, sx, sy, "displacementMm")}" fill="none" stroke="#f97316" stroke-width="2.4" opacity="0.9"/>`);
}

function renderPowerTrace(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  raw: readonly AVPlaneWorkCoordinateSampleV1[],
  force: readonly AVPlaneWorkCoordinateSampleV1[],
): void {
  const maxValue = Math.max(1e-6, ...[...raw, ...force].map((sample) => sample.positivePowerW));
  const sx = (theta: number) => x + theta * w;
  const sy = (value: number) => y + h - value / maxValue * h;
  axis(out, x, y, w, h, "positive power");
  out.push(`<path d="${pathForCoordinate(raw, sx, sy, "positivePowerW")}" fill="none" stroke="#22c55e" stroke-width="2.4" opacity="0.9"/>`);
  out.push(`<path d="${pathForCoordinate(force, sx, sy, "positivePowerW")}" fill="none" stroke="#f97316" stroke-width="2.4" opacity="0.9"/>`);
}

function axis(out: string[], x: number, y: number, w: number, h: number, label: string): void {
  out.push(`<text x="${x}" y="${y - 8}" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="10">${label}</text>`);
  out.push(`<line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h}" stroke="#334155"/>`);
  out.push(`<line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="#334155"/>`);
}

function pathForPv(
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

function pathForCoordinate(
  samples: readonly AVPlaneWorkCoordinateSampleV1[],
  sx: (theta: number) => number,
  sy: (value: number) => number,
  key: "displacementMm" | "positivePowerW",
): string {
  return samples
    .map((sample, index) =>
      `${index === 0 ? "M" : "L"}${sx(sample.theta).toFixed(1)},${sy(sample[key]).toFixed(1)}`
    )
    .join(" ");
}
