import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  runMechanisticAtrialOneFiberBenchV1,
  type MechanisticAtrialSampleV1,
} from "@/engine/mechanics2/benches/MechanisticAtrialOneFiberBench";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outputPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/mechanistic-atrial-one-fiber-normal-hr75.svg",
);

const report = runMechanisticAtrialOneFiberBenchV1();
const row = report.profiles.find((profile) => profile.profileId === "normal-hr75")!;
const samples = row.samples;
const reservoir = samples.filter((sample) =>
  sample.theta >= row.events.mitralClosureTheta && sample.theta <= row.events.mitralOpeningTheta
);
const conduit = samples.filter((sample) =>
  sample.theta >= row.events.mitralOpeningTheta && sample.theta <= row.events.preATheta
);
const pumping = [
  ...samples.filter((sample) => sample.theta >= row.events.preATheta),
  ...samples.filter((sample) => sample.theta <= row.events.mitralClosureTheta),
];
const closure = nearest(samples, row.events.mitralClosureTheta);
const opening = nearest(samples, row.events.mitralOpeningTheta);
const xTrough = minimum(reservoir, (sample) => sample.laPressureMmHg);
const vPeak = maximum(reservoir.slice(reservoir.indexOf(xTrough)), (sample) => sample.laPressureMmHg);
const yTrough = minimum(conduit, (sample) => sample.laPressureMmHg);

const width = 1500;
const height = 1110;
const svg: string[] = [];
svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
svg.push(`<rect width="${width}" height="${height}" fill="#08111f"/>`);
svg.push(`<text x="38" y="42" fill="#e7eef9" font-family="Inter,Arial,sans-serif" font-size="26" font-weight="700">Mechanistic atrial one-fiber + shared AV-plane | normal HR75</text>`);
svg.push(`<text x="38" y="68" fill="#94a3b8" font-family="Inter,Arial,sans-serif" font-size="13">Periodic steady-state sidecar evidence. LA blood volume owns the PV axis; no P_mem, P_relief, P_LV_recv, hidden reservoir state, or branch pressure offset.</text>`);
svg.push(`<text x="38" y="91" fill="#94a3b8" font-family="Inter,Arial,sans-serif" font-size="13">MVF velocity readbacks use the fixed-open-area bulk-flow surrogate; no PW-Doppler equivalence is claimed.</text>`);
svg.push(`<text x="38" y="114" fill="#94a3b8" font-family="Inter,Arial,sans-serif" font-size="13">Not runtime wiring, a full four-chamber circuit, morphology acceptance, patient-specific validation, or default selection.</text>`);

renderPvPanel(svg, 38, 122, 760, 650);
renderTimePanel(svg, 830, 122, 632, 190, "LAP / LVP (mmHg)", [
  { color: "#60a5fa", values: samples.map((sample) => sample.laPressureMmHg), width: 2.4 },
  { color: "#f87171", values: samples.map((sample) => sample.lvPressureMmHg), width: 1.7 },
]);
renderTimePanel(svg, 830, 338, 632, 190, "QMV / QPV (mL/s)", [
  { color: "#fb923c", values: samples.map((sample) => sample.qMitralMlPerSec), width: 2.4 },
  { color: "#34d399", values: samples.map((sample) => sample.qPulmonaryVenousMlPerSec), width: 1.8, dash: "7 5" },
]);
renderTimePanel(svg, 830, 554, 632, 218, "AV-plane z (cm), apexward positive", [
  { color: "#c084fc", values: samples.map((sample) => sample.avPlanePositionCm), width: 2.4 },
]);

renderEvidenceReadbacks(svg, 38, 805, 1424, 250);
svg.push(`<text x="38" y="1088" fill="#64748b" font-family="Inter,Arial,sans-serif" font-size="12">Generated from mechanistic-atrial-one-fiber-report-v1 | all ten implicit equations converged | closed-circuit volume conserved | periodic beat ${row.beatsSimulated}</text>`);
svg.push(`</svg>`);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${svg.join("\n")}\n`);
console.log(outputPath.replace(`${repoRoot}/`, ""));

function renderPvPanel(out: string[], x: number, y: number, w: number, h: number): void {
  panelFrame(out, x, y, w, h, "LA blood-volume PV (phase-resolved)");
  const plot = { x: x + 58, y: y + 48, w: w - 82, h: h - 92 };
  const sx = scale(samples.map((sample) => sample.laVolumeMl), plot.x, plot.w);
  const sy = scale(samples.map((sample) => sample.laPressureMmHg), plot.y + plot.h, -plot.h);
  grid(out, plot.x, plot.y, plot.w, plot.h);
  out.push(`<line x1="${sx(closure.laVolumeMl)}" y1="${sy(closure.laPressureMmHg)}" x2="${sx(opening.laVolumeMl)}" y2="${sy(opening.laPressureMmHg)}" stroke="#93c5fd" stroke-width="1.5" stroke-dasharray="7 6" opacity="0.65"/>`);
  drawPath(out, reservoir, sx, sy, "#60a5fa", 4.2);
  drawPath(out, conduit, sx, sy, "#fb923c", 4.2);
  drawPath(out, pumping, sx, sy, "#a8b2c1", 4.2);
  marker(out, closure, sx, sy, "#22c55e", "MVC", -12, -14);
  marker(out, opening, sx, sy, "#fbbf24", "MVO", 10, -12);
  marker(out, xTrough, sx, sy, "#38bdf8", "x", 8, 18);
  marker(out, vPeak, sx, sy, "#60a5fa", "v", -20, -12);
  marker(out, yTrough, sx, sy, "#fb923c", "y", 8, 18);
  out.push(`<text x="${plot.x + plot.w / 2}" y="${y + h - 13}" text-anchor="middle" fill="#94a3b8" font-family="Inter,Arial,sans-serif" font-size="13">V_LA,blood (mL)</text>`);
  out.push(`<text x="${x + 15}" y="${plot.y + plot.h / 2}" transform="rotate(-90 ${x + 15} ${plot.y + plot.h / 2})" text-anchor="middle" fill="#94a3b8" font-family="Inter,Arial,sans-serif" font-size="13">P_LA (mmHg)</text>`);
  const legend = [
    ["#60a5fa", "reservoir"],
    ["#fb923c", "conduit"],
    ["#a8b2c1", "pumping"],
  ] as const;
  legend.forEach(([color, label], index) => {
    const lx = x + 350 + index * 125;
    out.push(`<line x1="${lx}" y1="${y + 27}" x2="${lx + 22}" y2="${y + 27}" stroke="${color}" stroke-width="4"/>`);
    out.push(`<text x="${lx + 29}" y="${y + 31}" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="12">${label}</text>`);
  });
}

function renderEvidenceReadbacks(out: string[], x: number, y: number, w: number, h: number): void {
  panelFrame(out, x, y, w, h, "Current readbacks");
  const columns = [
    {
      title: "Normal signal",
      lines: [
        `LA ${rangeText(row.pressureRangeLaMmHg)} mmHg; LV ${rangeText(row.pressureRangeLvMmHg)} mmHg`,
        `CO ${row.cardiacOutputLPerMin.toFixed(2)} L/min; SV ${row.strokeVolumeMl.toFixed(1)} mL; AVPD ${row.avPlaneDisplacementCm.toFixed(2)} cm`,
        `x ${row.xDescentDepthMmHg.toFixed(2)} mmHg; v-rise ${row.vWaveRiseMmHg.toFixed(2)}; y ${row.yDescentDepthMmHg.toFixed(2)}`,
        `conduit ${row.conduitThroughputMl.toFixed(1)} mL (${pct(row.conduitFractionOfStrokeVolume)} of SV)`,
        `A/v ${(row.aLoopAreaMmHgMl / Math.max(row.vLoopAreaMmHgMl, 1e-9)).toFixed(3)}; opposed ${passFail(row.opposedLobeOrientation)}; reverse MV/Ao ${row.mitralReverseVolumeMl.toFixed(2)}/${row.aorticReverseVolumeMl.toFixed(2)} mL`,
      ],
    },
    {
      title: "MVF evidence",
      lines: [
        `fusion ${row.mitralWaveFusionClass}; applicability ${row.mitralGateReadback.measurementApplicability}`,
        `peak E/A ${row.mitralPeakVelocityEToARatio.toFixed(2)}; E-VTI/A-VTI ${row.mitralVtiEToARatio.toFixed(2)}; AFF ${pct(row.mitralAtrialFillingFraction)}`,
        `DT ${ms(row.mitralEDecelerationTimeSec)}; diastasis ${ms(row.mitralDiastasisDurationSec)}; E-at-A ${row.mitralVelocityAtAtrialActivationOnsetCmPerSec.toFixed(1)} cm/s`,
        `gates fusion ${row.mitralGateReadback.fusionEligibility}; peak ${row.mitralGateReadback.ageSpecificPeakEToA}; AFF ${row.mitralGateReadback.atrialFillingFraction}; DT ${row.mitralGateReadback.decelerationTime}`,
        `hard ${passFail(row.mitralGateReadback.hardAcceptancePass)}; support ${passFail(row.mitralGateReadback.supportiveDiagnosticsPass)}; fixed-area bulk surrogate`,
      ],
    },
    {
      title: "Topology and continuity",
      lines: [
        `selected crossing ${row.figureEightCrossingPhase} at ${pct(row.figureEightCrossingProgress01)} path; ${row.figureEightCrossingAngleDeg.toFixed(1)} deg`,
        `pre-cross conduit below reservoir ${pct(row.conduitBeforeCrossingBelowReservoirPathFraction)}`,
        `post-cross pumping above reservoir ${pct(row.pumpingAfterCrossingAboveReservoirPathFraction)}`,
        `pumping chord ${pct(row.pumpingAboveFigureEightChordFraction)}; min margin ${row.pumpingMinimumFigureEightChordMarginMmHg.toFixed(2)} mmHg`,
        `single-dt tangent diagnostic MVC ${row.mvcTangentJumpNorm.toFixed(3)} / MVO ${row.mvoTangentJumpNorm.toFixed(3)}; figure-eight gate ${passFail(report.gates.normalFigureEightPass)}`,
      ],
    },
  ];
  columns.forEach((column, index) => {
    const cx = x + 18 + index * ((w - 36) / 3);
    const cy = y + 58;
    out.push(`<text x="${cx}" y="${cy}" fill="#e2e8f0" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="700">${escapeXml(column.title)}</text>`);
    column.lines.forEach((line, lineIndex) => {
      out.push(`<text x="${cx}" y="${cy + 26 + lineIndex * 28}" fill="#b8c5d8" font-family="Inter,Arial,sans-serif" font-size="13">${escapeXml(line)}</text>`);
    });
  });
}

function renderTimePanel(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  series: readonly { readonly color: string; readonly values: readonly number[]; readonly width: number; readonly dash?: string }[],
): void {
  panelFrame(out, x, y, w, h, title);
  const plot = { x: x + 42, y: y + 40, w: w - 62, h: h - 58 };
  const sx = (theta: number) => plot.x + theta * plot.w;
  const sy = scale(series.flatMap((row) => row.values), plot.y + plot.h, -plot.h);
  grid(out, plot.x, plot.y, plot.w, plot.h);
  for (const row of series) {
    const path = samples.map((sample, index) =>
      `${index === 0 ? "M" : "L"}${sx(sample.theta).toFixed(2)},${sy(row.values[index]!).toFixed(2)}`
    ).join(" ");
    out.push(`<path d="${path}" fill="none" stroke="${row.color}" stroke-width="${row.width}" stroke-dasharray="${row.dash ?? ""}" stroke-linejoin="round"/>`);
  }
  out.push(`<line x1="${sx(row.events.mitralOpeningTheta)}" y1="${plot.y}" x2="${sx(row.events.mitralOpeningTheta)}" y2="${plot.y + plot.h}" stroke="#fbbf24" stroke-width="1" stroke-dasharray="4 5" opacity="0.7"/>`);
}

function panelFrame(out: string[], x: number, y: number, w: number, h: number, title: string): void {
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#0f1a2b" stroke="#26364c"/>`);
  out.push(`<text x="${x + 16}" y="${y + 27}" fill="#d8e2f0" font-family="Inter,Arial,sans-serif" font-size="14" font-weight="700">${escapeXml(title)}</text>`);
}

function grid(out: string[], x: number, y: number, w: number, h: number): void {
  for (let index = 0; index <= 4; index += 1) {
    const gx = x + index * w / 4;
    const gy = y + index * h / 4;
    out.push(`<line x1="${gx}" y1="${y}" x2="${gx}" y2="${y + h}" stroke="#223147" stroke-width="1"/>`);
    out.push(`<line x1="${x}" y1="${gy}" x2="${x + w}" y2="${gy}" stroke="#223147" stroke-width="1"/>`);
  }
}

function drawPath(
  out: string[],
  values: readonly MechanisticAtrialSampleV1[],
  sx: (value: number) => number,
  sy: (value: number) => number,
  color: string,
  width: number,
): void {
  const path = values.map((sample, index) =>
    `${index === 0 ? "M" : "L"}${sx(sample.laVolumeMl).toFixed(2)},${sy(sample.laPressureMmHg).toFixed(2)}`
  ).join(" ");
  out.push(`<path d="${path}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`);
}

function marker(
  out: string[],
  sample: MechanisticAtrialSampleV1,
  sx: (value: number) => number,
  sy: (value: number) => number,
  color: string,
  label: string,
  dx: number,
  dy: number,
): void {
  const cx = sx(sample.laVolumeMl);
  const cy = sy(sample.laPressureMmHg);
  out.push(`<circle cx="${cx}" cy="${cy}" r="5" fill="${color}" stroke="#08111f" stroke-width="2"/>`);
  out.push(`<text x="${cx + dx}" y="${cy + dy}" fill="${color}" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="700">${label}</text>`);
}

function scale(values: readonly number[], offset: number, span: number): (value: number) => number {
  const low = Math.min(...values);
  const high = Math.max(...values);
  const padding = Math.max((high - low) * 0.08, 1e-6);
  return (value: number) => offset + (value - (low - padding)) /
    Math.max(high - low + 2 * padding, 1e-9) * span;
}

function rangeText(range: readonly [number, number]): string {
  return `${range[0].toFixed(1)}-${range[1].toFixed(1)}`;
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

function minimum(
  values: readonly MechanisticAtrialSampleV1[],
  valueFor: (sample: MechanisticAtrialSampleV1) => number,
): MechanisticAtrialSampleV1 {
  return values.reduce((best, sample) => valueFor(sample) < valueFor(best) ? sample : best);
}

function maximum(
  values: readonly MechanisticAtrialSampleV1[],
  valueFor: (sample: MechanisticAtrialSampleV1) => number,
): MechanisticAtrialSampleV1 {
  return values.reduce((best, sample) => valueFor(sample) > valueFor(best) ? sample : best);
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
