import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { runMechanisticAtrialEnvelopeBenchV1 } from
  "@/engine/mechanics2/benches/MechanisticAtrialEnvelopeBench";
import type { MechanisticAtrialSampleV1 } from
  "@/engine/mechanics2/benches/MechanisticAtrialOneFiberBench";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outputPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/mechanistic-atrial-envelope-pv-matrix.svg",
);
const report = runMechanisticAtrialEnvelopeBenchV1();
const dtHalf = caseResult("normal-dt0p5");
const dtReference = caseResult("normal-dt1");
const dtDouble = caseResult("normal-dt2");
const maxDtRelativeError = Math.max(...Object.values(report.dtRelativeErrors));
const allSamples = report.cases.flatMap(({ result }) => result.samples);
const width = 1800;
const height = 1780;
const columns = 3;
const panelWidth = 560;
const panelHeight = 286;
const gapX = 24;
const gapY = 20;
const originX = 36;
const originY = 198;
const sxGlobal = normalizedScale(allSamples.map((sample) => sample.laVolumeMl));
const syGlobal = normalizedScale(allSamples.map((sample) => sample.laPressureMmHg));
const svg: string[] = [];

svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
svg.push(`<rect width="${width}" height="${height}" fill="#08111f"/>`);
svg.push(`<text x="36" y="42" fill="#e7eef9" font-family="Inter,Arial,sans-serif" font-size="25" font-weight="700">Mechanistic atrial scout envelope | LA blood-volume PV only</text>`);
svg.push(`<text x="36" y="69" fill="#94a3b8" font-family="Inter,Arial,sans-serif" font-size="13">Common V/P axes across all 15 cases. Blue: reservoir, orange: conduit, gray: pumping. Sidecar robustness evidence only; no pathology validation or PW-Doppler equivalence.</text>`);
svg.push(`<text x="36" y="94" fill="#94a3b8" font-family="Inter,Arial,sans-serif" font-size="13">Gate status: ${gateStatusText(["numericalPass", "broadEnvelopePass", "boundaryAndValveBurdenPass", "directionalResponsePass", "dtParityPass"])}</text>`);
svg.push(`<text x="36" y="119" fill="#94a3b8" font-family="Inter,Arial,sans-serif" font-size="13">Normal/dt retention: ${gateStatusText(["smoothValveEventPass", "normalMitralWaveformRetentionPass", "moderateTopologyRetentionPass"])}</text>`);
svg.push(`<text x="36" y="144" fill="#94a3b8" font-family="Inter,Arial,sans-serif" font-size="13">dt-refinement continuity: MVC tangent ${dtHalf.mvcTangentJumpNorm.toFixed(3)} -> ${dtReference.mvcTangentJumpNorm.toFixed(3)} -> ${dtDouble.mvcTangentJumpNorm.toFixed(3)}, MVO ${dtHalf.mvoTangentJumpNorm.toFixed(3)} -> ${dtReference.mvoTangentJumpNorm.toFixed(3)} -> ${dtDouble.mvoTangentJumpNorm.toFixed(3)}; max readback relative error ${pct(maxDtRelativeError)}.</text>`);
svg.push(`<text x="36" y="169" fill="#94a3b8" font-family="Inter,Arial,sans-serif" font-size="13">MVF readbacks use fixed-open-area bulk velocity. H/S are hard/supportive MVF gates; diagnostic axes are not standalone acceptance claims.</text>`);

report.cases.forEach(({ caseId, result }, index) => {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const x = originX + column * (panelWidth + gapX);
  const y = originY + row * (panelHeight + gapY);
  const plot = { x: x + 38, y: y + 132, w: panelWidth - 58, h: panelHeight - 154 };
  const sx = (value: number) => plot.x + sxGlobal(value) * plot.w;
  const sy = (value: number) => plot.y + (1 - syGlobal(value)) * plot.h;
  svg.push(`<rect x="${x}" y="${y}" width="${panelWidth}" height="${panelHeight}" rx="6" fill="#0f1a2b" stroke="${caseStroke(result)}"/>`);
  svg.push(`<text x="${x + 14}" y="${y + 23}" fill="#d8e2f0" font-family="Inter,Arial,sans-serif" font-size="14" font-weight="700">${escapeXml(caseId)}</text>`);
  svg.push(`<text x="${x + 14}" y="${y + 42}" fill="#8797ad" font-family="Inter,Arial,sans-serif" font-size="10.5">CO ${result.cardiacOutputLPerMin.toFixed(2)} L/min | LAmax ${result.pressureRangeLaMmHg[1].toFixed(1)} | AVPD ${result.avPlaneDisplacementCm.toFixed(2)} | x/y ${result.xDescentDepthMmHg.toFixed(1)}/${result.yDescentDepthMmHg.toFixed(1)}</text>`);
  svg.push(`<text x="${x + 14}" y="${y + 60}" fill="#aebbd0" font-family="Inter,Arial,sans-serif" font-size="10.5">MVF ${result.mitralWaveFusionClass}; ${result.mitralGateReadback.measurementApplicability}; H/S ${passFail(result.mitralGateReadback.hardAcceptancePass)}/${passFail(result.mitralGateReadback.supportiveDiagnosticsPass)}</text>`);
  svg.push(`<text x="${x + 14}" y="${y + 78}" fill="#aebbd0" font-family="Inter,Arial,sans-serif" font-size="10.5">peak E/A ${result.mitralPeakVelocityEToARatio.toFixed(2)} | E-VTI/A-VTI ${result.mitralVtiEToARatio.toFixed(2)} | AFF ${pct(result.mitralAtrialFillingFraction)} | DT ${ms(result.mitralEDecelerationTimeSec)}</text>`);
  svg.push(`<text x="${x + 14}" y="${y + 96}" fill="#aebbd0" font-family="Inter,Arial,sans-serif" font-size="10.5">diastasis ${ms(result.mitralDiastasisDurationSec)} | E-at-A ${result.mitralVelocityAtAtrialActivationOnsetCmPerSec.toFixed(1)} cm/s | X ${result.figureEightCrossingPhase} ${pct(result.figureEightCrossingProgress01)} ${result.figureEightCrossingAngleDeg.toFixed(1)} deg</text>`);
  svg.push(`<text x="${x + 14}" y="${y + 114}" fill="#aebbd0" font-family="Inter,Arial,sans-serif" font-size="10.5">pre/post branch order ${pct(result.conduitBeforeCrossingBelowReservoirPathFraction)}/${pct(result.pumpingAfterCrossingAboveReservoirPathFraction)} | tangent MVC/MVO ${result.mvcTangentJumpNorm.toFixed(3)}/${result.mvoTangentJumpNorm.toFixed(3)}</text>`);
  grid(svg, plot.x, plot.y, plot.w, plot.h);
  const reservoir = result.samples.filter((sample) =>
    sample.theta >= result.events.mitralClosureTheta && sample.theta <= result.events.mitralOpeningTheta
  );
  const conduit = result.samples.filter((sample) =>
    sample.theta >= result.events.mitralOpeningTheta && sample.theta <= result.events.preATheta
  );
  const pumping = [
    ...result.samples.filter((sample) => sample.theta >= result.events.preATheta),
    ...result.samples.filter((sample) => sample.theta <= result.events.mitralClosureTheta),
  ];
  path(svg, reservoir, sx, sy, "#60a5fa");
  path(svg, conduit, sx, sy, "#fb923c");
  path(svg, pumping, sx, sy, "#a8b2c1");
  const opening = nearest(result.samples, result.events.mitralOpeningTheta);
  svg.push(`<circle cx="${sx(opening.laVolumeMl)}" cy="${sy(opening.laPressureMmHg)}" r="3.5" fill="#fbbf24" stroke="#08111f" stroke-width="1.5"/>`);
});

svg.push(`<text x="36" y="1758" fill="#64748b" font-family="Inter,Arial,sans-serif" font-size="12">Generated from mechanistic-atrial-envelope-report-v1 | common axes | closed-circuit periodic solutions | dt continuity from 0.5/1/2 ms replicas</text>`);
svg.push(`</svg>`);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${svg.join("\n")}\n`);
console.log(outputPath.replace(`${repoRoot}/`, ""));

function path(
  out: string[],
  samples: readonly MechanisticAtrialSampleV1[],
  sx: (value: number) => number,
  sy: (value: number) => number,
  color: string,
): void {
  const data = samples.map((sample, index) =>
    `${index === 0 ? "M" : "L"}${sx(sample.laVolumeMl).toFixed(2)},${sy(sample.laPressureMmHg).toFixed(2)}`
  ).join(" ");
  out.push(`<path d="${data}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`);
}

function grid(out: string[], x: number, y: number, w: number, h: number): void {
  for (let index = 0; index <= 3; index += 1) {
    const gx = x + index * w / 3;
    const gy = y + index * h / 3;
    out.push(`<line x1="${gx}" y1="${y}" x2="${gx}" y2="${y + h}" stroke="#213047"/>`);
    out.push(`<line x1="${x}" y1="${gy}" x2="${x + w}" y2="${gy}" stroke="#213047"/>`);
  }
}

function normalizedScale(values: readonly number[]): (value: number) => number {
  const low = Math.min(...values);
  const high = Math.max(...values);
  const padding = Math.max((high - low) * 0.04, 1e-6);
  return (value: number) => (value - low + padding) / Math.max(high - low + 2 * padding, 1e-9);
}

function caseResult(caseId: string) {
  return report.cases.find((row) => row.caseId === caseId)!.result;
}

function gateStatusText(keys: readonly (keyof typeof report.gates)[]): string {
  return keys.map((key) => `${key}=${passFail(report.gates[key])}`).join(" | ");
}

function caseStroke(result: (typeof report.cases)[number]["result"]): string {
  if (!result.mitralGateReadback.hardAcceptancePass) return "#fb7185";
  if (!result.mitralGateReadback.supportiveDiagnosticsPass) return "#fbbf24";
  return "#26364c";
}

function pct(value: number): string {
  return `${(100 * value).toFixed(1)}%`;
}

function ms(valueSec: number): string {
  return `${Math.round(valueSec * 1000)} ms`;
}

function passFail(value: boolean): "pass" | "fail" {
  return value ? "pass" : "fail";
}

function nearest(values: readonly MechanisticAtrialSampleV1[], theta: number): MechanisticAtrialSampleV1 {
  return values.reduce((best, sample) =>
    Math.abs(sample.theta - theta) < Math.abs(best.theta - theta) ? sample : best
  );
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&apos;",
  }[character]!));
}
