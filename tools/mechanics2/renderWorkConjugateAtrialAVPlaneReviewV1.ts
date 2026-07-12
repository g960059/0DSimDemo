import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  runWorkConjugateAtrialAVPlaneBenchV1,
  type WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1,
  type WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1,
  type WorkConjugateAtrialAVPlanePhaseAttributionCaseV1,
  type WorkConjugateAtrialAVPlanePhaseAttributionTraceSampleV1,
  type WorkConjugateAtrialAVPlaneProfileV1,
  type WorkConjugateAtrialAVPlaneSampleV1,
  type WorkConjugateAtrialAVPlaneVariantV1,
} from "@/engine/mechanics2/benches/WorkConjugateAtrialAVPlaneBenchV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const visualDir = resolve(repoRoot, "data/mechanics2/visuals");
const report = runWorkConjugateAtrialAVPlaneBenchV1();
const canonical = variant("canonical-quasistatic-wall-viscous");
const eventActivation = variant("event-driven-atrial-activation-ablation");

const outputs = [
  [
    "work-conjugate-atrial-av-plane-normal-hr75-review.svg",
    renderComposite(),
  ],
  [
    "work-conjugate-atrial-av-plane-normal-hr75-pv-loop.svg",
    renderPvOnly(),
  ],
  [
    "work-conjugate-atrial-av-plane-order-ablation-review.svg",
    renderAblation(),
  ],
  [
    "work-conjugate-atrial-av-plane-activation-ablation-review.svg",
    renderActivationAblation(),
  ],
  [
    "work-conjugate-atrial-av-plane-phase-attribution-review.svg",
    renderPhaseAttribution(),
  ],
  [
    "work-conjugate-atrial-av-plane-activation-avpd-interaction-review.svg",
    renderActivationAvpdInteraction(),
  ],
  [
    "work-conjugate-atrial-av-plane-lv-relaxation-phenotype-review.svg",
    renderLvRelaxationPhenotype(),
  ],
] as const;

mkdirSync(visualDir, { recursive: true });
for (const [filename, svg] of outputs) {
  writeFileSync(resolve(visualDir, filename), `${svg}\n`);
  console.log(`data/mechanics2/visuals/${filename}`);
}

function renderComposite(): string {
  const width = 1600;
  const height = 1320;
  const out = svgStart(width, height);
  const profile = canonical.profile;
  out.push(title(
    "Work-conjugate atrial AV-plane V1 | HR75 engineering-baseline sidecar",
    "Not LeftHeartSubsystemV2 runtime. No P_mem/P_relief/P_LV_recv; no independent AV spring K; no hidden volume/source. Morphology/MVF are diagnostics.",
  ));
  renderPvPanel(out, 36, 112, 720, 430, profile, true);
  renderTimePanel(out, 800, 112, 760, 230, "MVF / PVF", "flow Q (mL/s)", [
    series(profile.samples, "qMitralMlPerSec", "#60a5fa", "Q_MV"),
    series(profile.samples, "qPulmonaryVenousMlPerSec", "#f59e0b", "Q_PV"),
  ]);
  renderTimePanel(out, 800, 380, 760, 230, "LAP / LVP / AoP", "pressure P (mmHg)", [
    series(profile.samples, "laPressureMmHg", "#38bdf8", "LAP"),
    series(profile.samples, "lvPressureMmHg", "#f87171", "LVP"),
    series(profile.samples, "aorticPressureMmHg", "#fbbf24", "AoP"),
  ]);
  renderTimePanel(out, 36, 580, 720, 250, "z / u / activation", "z (cm), u (cm/s), activation (-)", [
    series(profile.samples, "avPlanePositionCm", "#22c55e", "z cm"),
    series(profile.samples, "avPlaneVelocityCmPerSec", "#a78bfa", "u cm/s"),
    series(profile.samples, "laActivation01", "#f472b6", "LA act"),
    series(profile.samples, "lvActivation01", "#fb7185", "LV act"),
  ]);
  renderTimePanel(out, 800, 628, 760, 250, "LA/LV z-force axis totals", "force F_z (N)", [
    customSeries(profile.samples, (sample) => sample.laZForceN.total, "#38bdf8", "LA Fz"),
    customSeries(profile.samples, (sample) => sample.lvZForceN.total, "#f87171", "LV Fz"),
    customSeries(profile.samples, (sample) => sample.avForce.wallForceSumN, "#fbbf24", "sum"),
    customSeries(profile.samples, (sample) => sample.avForce.forceResidualN, "#22c55e", "resid"),
  ]);
  renderSummary(out, 36, 890, 1524, 360);
  out.push(text(36, 1290, `Generated from ${report.reportId}; raw report values are unrounded, SVG labels are display-rounded.`, 12, "#64748b"));
  out.push("</svg>");
  return out.join("\n");
}

function renderPvOnly(): string {
  const width = 1200;
  const height = 900;
  const out = svgStart(width, height);
  out.push(title(
    "HR75 engineering-baseline LA blood-volume PV loop",
    "Sidecar diagnostic, not LeftHeartSubsystemV2 runtime. Phase colors are display diagnostics; true A/v lobe metrics come from LaPvLobeMeasurementV2.",
  ));
  renderPvPanel(out, 70, 115, 1060, 610, canonical.profile, true);
  const p = canonical.profile;
  const lobeStatus = p.laPvLobes.status === "measurable"
    ? "measurable (one true crossing)"
    : `not measurable (${p.laPvLobes.reason})`;
  const lobeMetrics = p.laPvLobes.status === "measurable"
    ? `A/v=${fmt(p.laPvLobes.aLoopAreaMmHgMl)}/${fmt(p.laPvLobes.vLoopAreaMmHgMl)} mmHg mL; ratio=${fmt(p.laPvLobes.aToVAreaRatio)}; angle=${fmt(p.laPvLobes.crossingAngleDeg)} deg`
    : "A/v metrics suppressed";
  out.push(text(70, 770, `true LA PV lobes: ${lobeStatus}; ${lobeMetrics}`, 16, "#e2e8f0", 700));
  out.push(text(70, 802, `conduit-below-reservoir=${pct(p.pathOrdering.conduitBeforeCrossingBelowReservoirPathFraction)}; pumping-above-reservoir=${pct(p.pathOrdering.pumpingAfterCrossingAboveReservoirPathFraction)}; x-depth=${fmt(p.xvyPressureReadback.xDescentDepthMmHg)} mmHg (limitation, not tuned)`, 14, "#cbd5e1"));
  out.push(text(70, 834, `${mitralEaLabel(p)}; PV S/D=${fmt(p.pulmonaryVenous.sToDRatio)}; z excursion=${fmt(p.zRangeCm[1] - p.zRangeCm[0])} cm`, 14, "#cbd5e1"));
  out.push("</svg>");
  return out.join("\n");
}

function renderAblation(): string {
  const width = 1500;
  const height = 920;
  const out = svgStart(width, height);
  out.push(title(
    "Order / control overlay",
    "Canonical and controls share the same work-conjugate sidecar; activation-timing-sensitivity is a transparent external-review hypothesis test, not acceptance.",
  ));
  const selected = report.variants;
  const samples = selected.flatMap((row) => row.profile.samples);
  const plot = { x: 142, y: 155, w: 788, h: 500 };
  const sx = linearScale(samples.map((sample) => sample.laVolumeMl), plot.x, plot.x + plot.w);
  const sy = linearScale(samples.map((sample) => sample.laPressureMmHg), plot.y + plot.h, plot.y);
  panel(out, 60, 105, 910, 610, "LA PV overlay");
  grid(out, plot.x, plot.y, plot.w, plot.h);
  renderAxes(
    out,
    plot,
    sx,
    sy,
    "LA blood volume V_LA (mL)",
    "LA pressure P_LA (mmHg)",
  );
  selected.forEach((row, index) => {
    drawLine(out, row.profile.samples, sx.map, sy.map, palette(index), 2.2, row.variantId === canonical.variantId ? 4 : 2.2);
  });
  selected.forEach((row, index) => {
    const y = 138 + index * 28;
    out.push(`<line x1="1000" y1="${y}" x2="1035" y2="${y}" stroke="${palette(index)}" stroke-width="4"/>`);
    out.push(text(1044, y + 5, row.variantId, 12, "#cbd5e1", row.variantId === canonical.variantId ? 700 : 400));
  });
  renderVariantTable(out, 1000, 330, 430, 420, selected);
  out.push(text(60, 860, "Legacy M=1.1 is retained as a nonperiodic negative control. Morphology rows are diagnostic pending owner visual review.", 13, "#94a3b8"));
  out.push("</svg>");
  return out.join("\n");
}

function renderActivationAblation(): string {
  const width = 1560;
  const height = 1240;
  const out = svgStart(width, height);
  const baseline = canonical.profile;
  const candidate = eventActivation.profile;
  const sharedPvScaleSamples = [...baseline.samples, ...candidate.samples];
  out.push(title(
    "LA activation-model single-factor ablation | HR75 sidecar",
    "Same mechanics, load, event onset, LV activation, wall stress maxima, and 10-unknown solve. Only LA event-to-contractile-state law differs; no runtime/default promotion.",
  ));
  renderPvPanel(out, 36, 112, 720, 430, baseline, true, sharedPvScaleSamples);
  renderPvPanel(out, 804, 112, 720, 430, candidate, true, sharedPvScaleSamples);
  out.push(text(52, 100, "legacy rectangular + first-order | shared PV axes", 12, "#38bdf8", 700));
  out.push(text(820, 100, "event → Ca-like → bounded state | shared PV axes", 12, "#f472b6", 700));
  renderTimePanel(out, 36, 580, 720, 260, "Activation timing path", "normalized drive / state / P_act (-)", [
    customSeries(baseline.samples, (sample) => sample.laActivationDrive01, "#38bdf8", "legacy target"),
    customSeries(baseline.samples, (sample) => sample.laActivation01, "#60a5fa", "legacy state"),
    customSeries(candidate.samples, (sample) => sample.laCalciumDrive ?? 0, "#f59e0b", "Ca-like"),
    customSeries(candidate.samples, (sample) => sample.laActivationDrive01, "#c084fc", "Hill drive"),
    customSeries(candidate.samples, (sample) => sample.laActivation01, "#f472b6", "bounded state"),
    customSeries(candidate.samples, (sample) =>
      sample.laActiveTransmuralPressureMmHg /
      Math.max(candidate.activationReadback.laActiveTransmuralPressurePeakMmHg, 1e-9),
    "#22c55e", "P_act / peak"),
  ]);
  renderTimePanel(out, 804, 580, 720, 260, "Mitral / pulmonary venous flow", "flow Q (mL/s)", [
    customSeries(baseline.samples, (sample) => sample.qMitralMlPerSec, "#38bdf8", "base MV"),
    customSeries(candidate.samples, (sample) => sample.qMitralMlPerSec, "#f472b6", "event MV"),
    customSeries(baseline.samples, (sample) => sample.qPulmonaryVenousMlPerSec, "#60a5fa", "base PV"),
    customSeries(candidate.samples, (sample) => sample.qPulmonaryVenousMlPerSec, "#f59e0b", "event PV"),
  ]);
  renderActivationAblationSummary(out, 36, 878, 1488, 300);
  out.push(text(36, 1214, `Generated from ${report.reportId}; metrics are report-only diagnostics, not fitted clinical targets.`, 12, "#64748b"));
  out.push("</svg>");
  return out.join("\n");
}

function renderPhaseAttribution(): string {
  const width = 1680;
  const height = 1260;
  const out = svgStart(width, height);
  const attribution = report.phaseAttribution;
  const allCases = [
    attribution.reference,
    ...attribution.factors.flatMap((factor) => factor.cases),
  ];
  const sharedScaleTrace = allCases.flatMap((row) => row.trace);
  out.push(title(
    "HR75 phase attribution | one factor at a time",
    "Event-driven LA reference. Local engineering brackets only; morphology is report-only. Same 10-unknown sidecar, wall amplitudes, blood ledger, and runtime/default boundary.",
  ));
  attribution.factors.forEach((factor, index) => {
    renderAttributionPvPanel(
      out,
      30 + index * 550,
      105,
      520,
      405,
      factor,
      sharedScaleTrace,
    );
  });
  renderAttributionTable(out, 30, 540, 1620, 430);
  renderAttributionInterpretation(out, 30, 995, 1620, 210);
  out.push(text(
    30,
    1238,
    `Generated from ${report.reportId}; c-wave, IVRT, E/A, y, PV Ar, and topology rows are diagnostics rather than clinical validation.`,
    12,
    "#64748b",
  ));
  out.push("</svg>");
  return out.join("\n");
}

function renderActivationAvpdInteraction(): string {
  const width = 1680;
  const height = 1240;
  const out = svgStart(width, height);
  const interaction = report.activationAvpdInteraction;
  const allTrace = interaction.cases.flatMap((row) => row.trace);
  out.push(title(
    "HR75 activation × AVPD-driver interaction | free-coupled sidecar",
    "Center + four corners. AVPD is emergent from the shared wall-force coordinate: no prescribed z(t), no explicit cross-term, no new state, and no runtime/default promotion.",
  ));
  renderInteractionPvPanel(out, 30, 105, 520, 400, interaction.cases, allTrace);
  renderInteractionTimePanel(
    out,
    580,
    105,
    520,
    400,
    "Shared AV-plane position",
    "z (cm; + apexward)",
    interaction.cases,
    allTrace.map((sample) => sample.avPlanePositionCm),
    (sample) => sample.avPlanePositionCm,
  );
  renderInteractionTimePanel(
    out,
    1130,
    105,
    520,
    400,
    "Shared AV-plane velocity",
    "u (cm/s; + apexward)",
    interaction.cases,
    allTrace.map((sample) => sample.avPlaneVelocityCmPerSec),
    (sample) => sample.avPlaneVelocityCmPerSec,
  );
  renderInteractionTable(out, 30, 535, 1620, 340);
  renderInteractionInterpretation(out, 30, 900, 1620, 260);
  out.push(text(
    30,
    1215,
    `Generated from ${report.reportId}; interaction contrasts are local report-only diagnostics with no clinical magnitude threshold.`,
    12,
    "#64748b",
  ));
  out.push("</svg>");
  return out.join("\n");
}

function renderLvRelaxationPhenotype(): string {
  const width = 1680;
  const height = 1260;
  const out = svgStart(width, height);
  const screen = report.lvRelaxationPhenotypeScreen;
  const cases = screen.cases.filter((row) => row.readback !== null);
  const allTrace = cases.flatMap((row) => row.trace);
  out.push(title(
    "HR75 phenotype-normalized LV RT50 screen | report-only sidecar",
    "LA activation, wall/AVPD law, valves, circuit, and 10-unknown solve are fixed. LV bounded-state RT50 target alone changes; no runtime/default promotion.",
  ));
  renderLvPhenotypeTimePanel(
    out,
    30,
    105,
    520,
    380,
    "Prescribed LV contractile state",
    "activation a_LV (-)",
    cases,
    allTrace.map((sample) => sample.lvActivation01),
    (sample) => sample.lvActivation01,
  );
  renderLvPhenotypeTimePanel(
    out,
    580,
    105,
    520,
    380,
    "Mitral inflow",
    "Q_MV (mL/s)",
    cases,
    allTrace.map((sample) => sample.qMitralMlPerSec),
    (sample) => sample.qMitralMlPerSec,
  );
  renderLvPhenotypePvPanel(out, 1130, 105, 520, 380, cases, allTrace);
  renderLvPhenotypeTable(out, 30, 515, 1620, 300);
  renderLvPhenotypeInterpretation(out, 30, 845, 1620, 350);
  out.push(text(
    30,
    1235,
    `Generated from ${report.reportId}; dose factors are local mapper-convergence brackets, not normal-human ranges or patient-fit bounds.`,
    12,
    "#64748b",
  ));
  out.push("</svg>");
  return out.join("\n");
}

function lvPhenotypeColor(index: number): string {
  return ["#38bdf8", "#f8fafc", "#f472b6"][index % 3]!;
}

function lvPhenotypeLabel(
  row: WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1,
): string {
  return `${Math.round(row.rt50DoseFactor * 100)}% RT50`;
}

function renderLvPhenotypeTimePanel(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  titleValue: string,
  yAxisLabel: string,
  cases: readonly WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1[],
  sharedValues: readonly number[],
  valueOf: (
    sample: WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1["trace"][number],
  ) => number,
): void {
  panel(out, x, y, w, h, titleValue);
  legend(out, x + 18, y + 50, w - 36, cases.map((row, index) => [
    lvPhenotypeLabel(row),
    lvPhenotypeColor(index),
  ] as const));
  const plot = { x: x + 66, y: y + 74, w: w - 88, h: h - 124 };
  const sx = linearScale([0, 1], plot.x, plot.x + plot.w, 0);
  const sy = linearScale(sharedValues, plot.y + plot.h, plot.y);
  grid(out, plot.x, plot.y, plot.w, plot.h);
  renderAxes(out, plot, sx, sy, "cycle phase theta (-)", yAxisLabel);
  cases.forEach((row, index) => {
    drawLvPhenotypeTrace(
      out,
      row.trace,
      (sample) => sample.theta,
      valueOf,
      sx.map,
      sy.map,
      lvPhenotypeColor(index),
      index === 1 ? 3.2 : 2.4,
    );
  });
}

function renderLvPhenotypePvPanel(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  cases: readonly WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1[],
  sharedTrace: readonly WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1["trace"][number][],
): void {
  panel(out, x, y, w, h, "LA blood-volume PV | shared axes");
  legend(out, x + 18, y + 50, w - 36, cases.map((row, index) => [
    lvPhenotypeLabel(row),
    lvPhenotypeColor(index),
  ] as const));
  const plot = { x: x + 66, y: y + 74, w: w - 88, h: h - 124 };
  const sx = linearScale(
    sharedTrace.map((sample) => sample.laVolumeMl),
    plot.x,
    plot.x + plot.w,
  );
  const sy = linearScale(
    sharedTrace.map((sample) => sample.laPressureMmHg),
    plot.y + plot.h,
    plot.y,
  );
  grid(out, plot.x, plot.y, plot.w, plot.h);
  renderAxes(out, plot, sx, sy, "LA blood volume (mL)", "LA pressure (mmHg)");
  cases.forEach((row, index) => {
    drawLvPhenotypeTrace(
      out,
      row.trace,
      (sample) => sample.laVolumeMl,
      (sample) => sample.laPressureMmHg,
      sx.map,
      sy.map,
      lvPhenotypeColor(index),
      index === 1 ? 3.2 : 2.4,
    );
  });
}

function drawLvPhenotypeTrace(
  out: string[],
  samples: WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1["trace"],
  xValue: (
    sample: WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1["trace"][number],
  ) => number,
  yValue: (
    sample: WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1["trace"][number],
  ) => number,
  sx: (value: number) => number,
  sy: (value: number) => number,
  color: string,
  width: number,
): void {
  if (samples.length < 2) return;
  const d = samples.map((sample, index) =>
    `${index === 0 ? "M" : "L"}${sx(xValue(sample)).toFixed(2)},${sy(yValue(sample)).toFixed(2)}`
  ).join(" ");
  out.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/>`);
}

function renderLvPhenotypeTable(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  panel(out, x, y, w, h, "Fixed-dose readbacks | phenotype targets versus coupled mechanics");
  const columns = [
    ["dose", 18],
    ["target RT50", 160],
    ["real RT50", 285],
    ["TTP", 405],
    ["peak", 500],
    ["integral", 585],
    ["P-qualified Q proxy", 705],
    ["cond-mid proxy", 885],
    ["MV", 1045],
    ["y", 1165],
    ["r_Pa", 1280],
    ["CO", 1370],
    ["hard", 1480],
  ] as const;
  columns.forEach(([label, offset]) => {
    out.push(text(x + offset, y + 52, label, 11, "#94a3b8", 700));
  });
  report.lvRelaxationPhenotypeScreen.cases.forEach((row, index) => {
    const readback = row.readback;
    const yy = y + 90 + index * 56;
    out.push(text(x + 18, yy, lvPhenotypeLabel(row), 12, lvPhenotypeColor(index), 700));
    out.push(text(x + 160, yy, `${Math.round(row.targetPhenotype.relaxationTimeTo50Sec * 1000)} ms`, 11, "#cbd5e1"));
    if (readback === null || row.numerics === null) {
      out.push(text(x + 285, yy, `mapping ${row.calibration.status}; not installed`, 11, "#fca5a5", 700));
      return;
    }
    const phenotype = readback.realizedLvPhenotypeFromCoupledTrace;
    out.push(text(x + 285, yy, `${Math.round(phenotype.relaxationTimeTo50Sec * 1000)} ms`, 11, "#cbd5e1"));
    out.push(text(x + 405, yy, `${Math.round(phenotype.timeFromEventToPeakSec * 1000)} ms`, 11, "#cbd5e1"));
    out.push(text(x + 500, yy, fmt(phenotype.peakExcursion01), 11, "#cbd5e1"));
    out.push(text(x + 585, yy, `${fmt(phenotype.excursionIntegralSec)} s`, 11, "#cbd5e1"));
    out.push(text(x + 705, yy, nullableMs(readback.aorticClosingToMitralOpeningSec), 11, "#cbd5e1"));
    out.push(text(x + 885, yy, nullableMs(readback.aorticConductanceClosingToMitralConductanceOpeningSec), 11, "#cbd5e1"));
    out.push(text(x + 1045, yy, readback.mitralFusionClass, 10.5, "#cbd5e1"));
    out.push(text(x + 1165, yy, readback.yDescentMeasurementStatus === "interior-trough" ? fmt(readback.yDescentDepthMmHg) : `≥${fmt(readback.yDescentDepthMmHg)} cens.`, 10.5, "#cbd5e1"));
    out.push(text(x + 1280, yy, nullableFmt(readback.pressurePeakVolumePositionFraction), 11, "#cbd5e1"));
    out.push(text(x + 1370, yy, fmt(readback.cardiacOutputLPerMin), 11, "#cbd5e1"));
    out.push(text(x + 1480, yy, row.numerics.allHardGatesPass ? "pass" : "fail", 11, row.numerics.allHardGatesPass ? "#86efac" : "#fca5a5", 700));
  });
  out.push(text(
    x + 18,
    y + h - 18,
    "P-qualified Q proxy = Ao forward-flow-threshold cessation→MV sustained-flow-threshold onset. It and cond-mid are simulation proxies, not anatomical leaflet timing or clinical IVRT.",
    11,
    "#94a3b8",
  ));
}

function renderLvPhenotypeInterpretation(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  panel(out, x, y, w, h, "Result, failure boundary, and next experiment");
  const screen = report.lvRelaxationPhenotypeScreen;
  const center = screen.engineeringCenter.readback.phenotype;
  const low = screen.cases[0]!.readback;
  const high = screen.cases[2]!.readback;
  const lines = [
    `Legacy audit: target TTP/RT50=${Math.round(screen.legacyLvSubstitutionAudit.targetPhenotype.timeFromEventToPeakSec * 1000)}/${Math.round(screen.legacyLvSubstitutionAudit.targetPhenotype.relaxationTimeTo50Sec * 1000)} ms, peak=${fmt(screen.legacyLvSubstitutionAudit.targetPhenotype.peakExcursion01)}, integral=${fmt(screen.legacyLvSubstitutionAudit.targetPhenotype.excursionIntegralSec)} s; mapper=${screen.legacyLvSubstitutionAudit.calibration.status}. The legacy LV plateau was not installed.`,
    `Engineering center (not legacy-equivalent or a normal-human prior): TTP/RT50=${Math.round(center.timeFromEventToPeakSec * 1000)}/${Math.round(center.relaxationTimeTo50Sec * 1000)} ms, peak=${fmt(center.peakExcursion01)}, integral=${fmt(center.excursionIntegralSec)} s.`,
    "Dose policy: RT50 target 92/100/108%; effective onset, TTP, peak excursion, and activation integral stay fixed. Raw rise/decay/on/off coordinates remain private mapper details.",
    `P-qualified sustained-Q proxy changes ${low === null ? "n/m" : Math.round(low.aorticClosingToMitralOpeningSec! * 1000)}→${high === null ? "n/m" : Math.round(high.aorticClosingToMitralOpeningSec! * 1000)} ms (Ao threshold cessation→MV threshold onset). Neither it nor cond-mid is anatomical leaflet timing or clinical IVRT.`,
    `E/A progresses to ${high?.mitralFusionClass ?? "n/m"}, but diastasis remains ${high === null ? "n/m" : Math.round(high.diastasisDurationSec * 1000)} ms and there is no interior y in the tested local range. Partial fusion is not separation.`,
    `LA pumping apex r_Pa changes ${low === null ? "n/m" : fmt(low.pressurePeakVolumePositionFraction ?? Number.NaN)}→${high === null ? "n/m" : fmt(high.pressurePeakVolumePositionFraction ?? Number.NaN)}; this is coupled evidence, not a morphology fit or a monotonic LV-relaxation claim.`,
    "Decision: within this uncalibrated local range, LV RT50 alone did not resolve the morphology. Do not tune AVPD or loading before independent LV calibration.",
    "Next: fixed-dose LA TTP and LA RT50 screens with this pressure-flow contract; defer PV Ar boundary claims and final acceptance to measured pulmonary/right-heart or full four-chamber integration.",
  ];
  lines.forEach((line, index) => {
    out.push(text(
      x + 20,
      y + 52 + index * 34,
      line,
      12.5,
      index >= 6 ? "#fbbf24" : "#cbd5e1",
      index >= 6 ? 700 : 400,
    ));
  });
}

function interactionColor(index: number): string {
  return ["#f8fafc", "#38bdf8", "#f472b6", "#f59e0b", "#22c55e"]
    [index % 5]!;
}

function renderInteractionPvPanel(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  cases: readonly WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1[],
  sharedTrace: readonly WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1["trace"][number][],
): void {
  panel(out, x, y, w, h, "LA blood-volume PV | shared axes");
  legend(out, x + 18, y + 50, w - 36, cases.map((row, index) => [
    interactionCaseShortLabel(row),
    interactionColor(index),
  ] as const));
  const plot = { x: x + 66, y: y + 74, w: w - 88, h: h - 124 };
  const sx = linearScale(
    sharedTrace.map((sample) => sample.laVolumeMl),
    plot.x,
    plot.x + plot.w,
  );
  const sy = linearScale(
    sharedTrace.map((sample) => sample.laPressureMmHg),
    plot.y + plot.h,
    plot.y,
  );
  grid(out, plot.x, plot.y, plot.w, plot.h);
  renderAxes(out, plot, sx, sy, "LA blood volume (mL)", "LA pressure (mmHg)");
  cases.forEach((row, index) => {
    drawInteractionTrace(
      out,
      row.trace,
      (sample) => sample.laVolumeMl,
      (sample) => sample.laPressureMmHg,
      sx.map,
      sy.map,
      interactionColor(index),
      index === 0 ? 3.2 : 2.4,
    );
  });
}

function renderInteractionTimePanel(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  titleValue: string,
  yAxisLabel: string,
  cases: readonly WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1[],
  sharedValues: readonly number[],
  valueOf: (
    sample: WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1["trace"][number],
  ) => number,
): void {
  panel(out, x, y, w, h, titleValue);
  legend(out, x + 18, y + 50, w - 36, cases.map((row, index) => [
    interactionCaseShortLabel(row),
    interactionColor(index),
  ] as const));
  const plot = { x: x + 66, y: y + 74, w: w - 88, h: h - 124 };
  const sx = linearScale([0, 1], plot.x, plot.x + plot.w, 0);
  const sy = linearScale(sharedValues, plot.y + plot.h, plot.y);
  grid(out, plot.x, plot.y, plot.w, plot.h);
  renderAxes(out, plot, sx, sy, "cycle phase theta (-)", yAxisLabel);
  cases.forEach((row, index) => {
    drawInteractionTrace(
      out,
      row.trace,
      (sample) => sample.theta,
      valueOf,
      sx.map,
      sy.map,
      interactionColor(index),
      index === 0 ? 3.2 : 2.4,
    );
  });
}

function drawInteractionTrace(
  out: string[],
  samples: WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1["trace"],
  xValue: (
    sample: WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1["trace"][number],
  ) => number,
  yValue: (
    sample: WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1["trace"][number],
  ) => number,
  sx: (value: number) => number,
  sy: (value: number) => number,
  color: string,
  width: number,
): void {
  if (samples.length < 2) return;
  const d = samples.map((sample, index) =>
    `${index === 0 ? "M" : "L"}${sx(xValue(sample)).toFixed(2)},${sy(yValue(sample)).toFixed(2)}`
  ).join(" ");
  out.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/>`);
}

function renderInteractionTable(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  panel(out, x, y, w, h, "Free-coupled readbacks (morphology remains report-only)");
  const columns = [
    ["row", 18],
    ["TTP/RT50", 235],
    ["z cycle", 390],
    ["z syst", 485],
    ["u syst", 575],
    ["r_Pa", 690],
    ["x' cand", 770],
    ["y", 850],
    ["A/v", 955],
    ["fig8 phase", 1050],
    ["cross", 1230],
    ["MV", 1300],
    ["Ar", 1420],
    ["hard", 1510],
  ] as const;
  columns.forEach(([label, offset]) => {
    out.push(text(x + offset, y + 52, label, 11, "#94a3b8", 700));
  });
  report.activationAvpdInteraction.cases.forEach((row, index) => {
    const readback = row.readback;
    const yy = y + 84 + index * 45;
    const color = index === 0 ? "#f8fafc" : "#e2e8f0";
    out.push(text(x + 18, yy, interactionCaseTableLabel(row), 11, color, index === 0 ? 700 : 400));
    out.push(text(x + 235, yy, `${Math.round(readback.laEventToContractilePeakSec * 1000)}/${readback.laContractileRt50Sec === null ? "n/m" : Math.round(readback.laContractileRt50Sec * 1000)} ms`, 11, "#cbd5e1"));
    out.push(text(x + 390, yy, `${fmt(readback.avPlaneCycleExcursionCm)} cm`, 11, "#cbd5e1"));
    out.push(text(x + 485, yy, readback.mitralClosingMidpointToAorticFlowEndDisplacementCm === null ? "n/m" : `${fmt(readback.mitralClosingMidpointToAorticFlowEndDisplacementCm)} cm`, 11, "#cbd5e1"));
    out.push(text(x + 575, yy, readback.mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec === null ? "n/m" : `${fmt(readback.mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec)} cm/s`, 11, "#cbd5e1"));
    out.push(text(x + 690, yy, nullableFmt(readback.pressurePeakVolumePositionFraction), 11, "#cbd5e1"));
    out.push(text(x + 770, yy, nullableFmt(readback.cToXDepthMmHg), 11, "#cbd5e1"));
    out.push(text(x + 850, yy, interactionYLabel(row), 11, "#cbd5e1"));
    out.push(text(x + 955, yy, readback.laPvLobeStatus === "measurable" ? fmt(readback.aToVAreaRatio) : "n/m", 11, "#cbd5e1"));
    out.push(text(x + 1050, yy, readback.figureEightCrossingPhase, 10.5, "#cbd5e1"));
    out.push(text(x + 1230, yy, String(readback.laPvRawSelfIntersectionCount), 11, "#cbd5e1"));
    out.push(text(x + 1300, yy, readback.mitralFusionClass, 10.5, "#cbd5e1"));
    out.push(text(x + 1420, yy, readback.pulmonaryVenousAtrialReversalStatus, 10.5, "#cbd5e1"));
    out.push(text(x + 1510, yy, row.numerics.allHardGatesPass ? "pass" : "fail", 11, row.numerics.allHardGatesPass ? "#86efac" : "#fca5a5", 700));
  });
  out.push(text(
    x + 18,
    y + h - 18,
    "z syst = MV-close conductance midpoint to aortic forward-flow end; + is apexward. x' is a c-like candidate diagnostic, not a resolved physiological c wave.",
    11,
    "#94a3b8",
  ));
}

function renderInteractionInterpretation(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  panel(out, x, y, w, h, "Interaction result and fitting boundary");
  const interaction = report.activationAvpdInteraction;
  const fastLow = interaction.cases[1]!;
  const fastHigh = interaction.cases[2]!;
  const slowLow = interaction.cases[3]!;
  const slowHigh = interaction.cases[4]!;
  const contrast = interaction.interactionContrast;
  const normalized = contrast.cornerRangeNormalizedMagnitude;
  const dtSigns = interaction.discretizationRobustness.signStableAcrossDt;
  const corners = [fastLow, fastHigh, slowLow, slowHigh];
  const fusionClasses = [...new Set(corners.map((row) =>
    row.readback.mitralFusionClass
  ))];
  const reversalStatuses = [...new Set(corners.map((row) =>
    row.readback.pulmonaryVenousAtrialReversalStatus
  ))];
  const yStatuses = [...new Set(corners.map((row) =>
    row.readback.yDescentMeasurementStatus
  ))];
  const lines = [
    "Design: Ca-like rise tau 40/80 ms × LV longitudinal/circumferential activeStressMax ratio 0.45/0.65, plus the 60 ms/0.55 center; these are engineering brackets.",
    "Only two declared leaves change. LV circumferential activeStressMax stays 55 kPa; z(t) remains a solved shared work coordinate.",
    `TTP spans ${Math.round(fastLow.readback.laEventToContractilePeakSec * 1000)}–${Math.round(slowHigh.readback.laEventToContractilePeakSec * 1000)} ms and peak activation ${fmt(fastLow.readback.laContractilePeak01)}–${fmt(slowHigh.readback.laContractilePeak01)}; rise tau is not timing-only.`,
    `Primary AVPD Difference-of-differences: z_syst=${nullableFmt(contrast.mitralClosingMidpointToAorticFlowEndDisplacementCm)} cm, u_syst=${nullableFmt(contrast.mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec)} cm/s; whole-cycle z=${fmt(contrast.avPlaneCycleExcursionCm)} cm.`,
    `Normalized |I|/corner range: z_syst=${nullablePct(normalized.mitralClosingMidpointToAorticFlowEndDisplacementCm)}, u_syst=${nullablePct(normalized.mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec)}, r_Pa=${nullablePct(normalized.pressurePeakVolumePositionFraction)}, x'_candidate=${nullablePct(normalized.cToXDepthMmHg)}; dt-sign stable z/u/r_Pa=${dtSigns.mitralClosingMidpointToAorticFlowEndDisplacementCm}/${dtSigns.mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec}/${dtSigns.pressurePeakVolumePositionFraction}.`,
    `Corners: c=${contrast.cToXContrastStatus}; MV=${fusionClasses.join("/")}; Ar=${reversalStatuses.join("/")}; y=${yStatuses.join("/")} (event-censored) and I_y=n/m.`,
    `Fast/low has one crossing but A/v=${fmt(fastLow.readback.aToVAreaRatio)} and phase=${fastLow.readback.figureEightCrossingPhase}; it is not a morphology success.`,
    "LA PV shape alone is insufficient. Recommended joint-fit data include AVPD, activation timing, LA P+V, LV P+V, aortic load, full MV E/A and PV S/D/Ar; sufficiency is not proven.",
  ];
  lines.forEach((line, index) => {
    out.push(text(
      x + 20,
      y + 50 + index * 28,
      line,
      12,
      index >= lines.length - 2 ? "#fbbf24" : "#cbd5e1",
      index >= lines.length - 2 ? 700 : 400,
    ));
  });
}

function interactionCaseShortLabel(
  row: WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1,
): string {
  if (row.position === "center") return "center";
  const rise = Math.round(row.activationCalciumRiseTauSec * 1000);
  return `${rise}/${row.lvLongitudinalToCircumferentialActiveStressMaxRatio.toFixed(2)}`;
}

function interactionCaseTableLabel(
  row: WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1,
): string {
  if (row.position === "center") return "center 60 ms / Tmax ratio 0.55";
  const rise = Math.round(row.activationCalciumRiseTauSec * 1000);
  return `${rise} ms / Tmax ratio ${row.lvLongitudinalToCircumferentialActiveStressMaxRatio.toFixed(2)}`;
}

function interactionYLabel(
  row: WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1,
): string {
  const depth = fmt(row.readback.yDescentDepthMmHg);
  if (row.readback.yDescentMeasurementStatus ===
    "not-measurable-mitral-opening-fallback") return "n/m";
  return row.readback.yDescentMeasurementStatus ===
      "right-censored-at-atrial-event"
    ? `≥${depth}`
    : depth;
}

function renderAttributionPvPanel(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  factor: (typeof report.phaseAttribution.factors)[number],
  sharedScaleTrace:
    readonly WorkConjugateAtrialAVPlanePhaseAttributionTraceSampleV1[],
): void {
  panel(out, x, y, w, h, attributionFactorLabel(factor.factorId));
  const rows = [report.phaseAttribution.reference, ...factor.cases];
  const colors = ["#94a3b8", "#38bdf8", "#f472b6"];
  const legendRows = rows.map((row, index) => [
    attributionCaseValueLabel(row, factor.referenceValue, factor.parameterUnit),
    colors[index]!,
  ] as const);
  legend(out, x + 18, y + 50, w - 36, legendRows);
  const plot = { x: x + 66, y: y + 74, w: w - 88, h: h - 142 };
  const sx = linearScale(
    sharedScaleTrace.map((sample) => sample.laVolumeMl),
    plot.x,
    plot.x + plot.w,
  );
  const sy = linearScale(
    sharedScaleTrace.map((sample) => sample.laPressureMmHg),
    plot.y + plot.h,
    plot.y,
  );
  grid(out, plot.x, plot.y, plot.w, plot.h);
  renderAxes(
    out,
    plot,
    sx,
    sy,
    "LA blood volume (mL) | shared axes",
    "LA pressure (mmHg)",
  );
  rows.forEach((row, index) => {
    drawAttributionTrace(out, row.trace, sx.map, sy.map, colors[index]!, index === 0 ? 2 : 3);
  });
  out.push(text(
    x + 18,
    y + h - 13,
    `changed only: ${shortAttributionPath(factor.parameterPath)}`,
    10.5,
    "#cbd5e1",
  ));
}

function renderAttributionTable(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  panel(out, x, y, w, h, "Emergent readbacks (no morphology hard gate)");
  const rows = attributionRows();
  const columns = [
    ["row", 18],
    ["r_Pa", 245],
    ["x' depth", 330],
    ["c→x mono", 430],
    ["AoEnd→MVmid", 540],
    ["y depth", 625],
    ["event/E", 770],
    ["PV nadir", 875],
    ["Ar", 985],
    ["A/v", 1055],
    ["cross", 1185],
    ["CO", 1270],
    ["numeric", 1370],
  ] as const;
  columns.forEach(([label, offset]) => {
    out.push(text(x + offset, y + 52, label, 11, "#94a3b8", 700));
  });
  rows.forEach((row, index) => {
    const readback = row.value.readback;
    const yy = y + 84 + index * 45;
    const rowColor = index === 0 ? "#f8fafc" : "#e2e8f0";
    out.push(text(x + 18, yy, row.label, 11, rowColor, index === 0 ? 700 : 400));
    out.push(text(x + 245, yy, nullableFmt(readback.pressurePeakVolumePositionFraction), 11, "#cbd5e1"));
    out.push(text(x + 330, yy, nullableFmt(readback.cToXDepthMmHg), 11, "#cbd5e1"));
    out.push(text(x + 430, yy, nullablePct(readback.cToXNonIncreasingFraction), 11, "#cbd5e1"));
    out.push(text(
      x + 540,
      yy,
      readback.aorticFlowEndToMitralConductanceOpeningMeasurementValid &&
          readback.aorticFlowEndToMitralConductanceOpeningSec !== null
        ? `${Math.round(readback.aorticFlowEndToMitralConductanceOpeningSec * 1000)} ms`
        : "n/m",
      11,
      "#cbd5e1",
    ));
    out.push(text(x + 625, yy, attributionYLabel(row.value), 11, "#cbd5e1"));
    out.push(text(x + 770, yy, fmt(readback.flowAtAtrialEventToEPeakRatio), 11, "#cbd5e1"));
    out.push(text(x + 875, yy, fmt(readback.pulmonaryVenousAtrialWindowNadirMlPerSec), 11, "#cbd5e1"));
    out.push(text(x + 985, yy, readback.pulmonaryVenousAtrialReversalStatus, 11, "#cbd5e1"));
    out.push(text(x + 1055, yy, readback.laPvLobeStatus === "measurable" ? "meas." : "n/m", 11, "#cbd5e1"));
    out.push(text(x + 1185, yy, String(readback.laPvRawSelfIntersectionCount), 11, "#cbd5e1"));
    out.push(text(x + 1270, yy, fmt(readback.cardiacOutputLPerMin), 11, "#cbd5e1"));
    out.push(text(
      x + 1370,
      yy,
      row.value.numerics.allHardGatesPass ? "pass" : "fail",
      11,
      row.value.numerics.allHardGatesPass ? "#86efac" : "#fca5a5",
      700,
    ));
  });
  out.push(text(
    x + 18,
    y + h - 18,
    "x' uses a c-like candidate from MV-close conductance midpoint to Ao-flow onset. AoEnd→MVmid uses QAo zero crossing to MV-open conductance midpoint; neither is clinical IVRT. Censored y is a lower bound.",
    11,
    "#94a3b8",
  ));
}

function renderAttributionInterpretation(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  panel(out, x, y, w, h, "Attribution result and stop/go boundary");
  const [delay, lvRelaxation, pulmonaryVenousResistance] =
    report.phaseAttribution.factors;
  const fastLv = lvRelaxation!.cases.find((row) => row.position === "lower")!;
  const highPvResistance = pulmonaryVenousResistance!.cases.find((row) =>
    row.position === "higher"
  )!;
  const lines = [
    `effective event→Ca-like delay: event boundary remains theta=${fmt(report.phaseAttribution.reference.readback.laEventOnsetTheta)}; ${delay!.cases.map((row) => `${Math.round((row.parameterValue ?? 0) * 1000)} ms=${row.readback.mitralFusionClass}/${row.readback.pulmonaryVenousAtrialReversalStatus} Ar`).join(", ")}. Delay alone does not separate E/A or generate Ar.`,
    `LV activation-state fall: 40→30 ms moves MV-conductance midpoint to theta=${fmt(fastLv.readback.mitralConductanceOpeningMidpointTheta)} and Ao-flow-end→MV-mid ${nullableMs(report.phaseAttribution.reference.readback.aorticFlowEndToMitralConductanceOpeningSec)}→${nullableMs(fastLv.readback.aorticFlowEndToMitralConductanceOpeningSec)}; y=${attributionYLabel(fastLv)}, MV=${fastLv.readback.mitralFusionClass}, A/v=${fastLv.readback.laPvLobeReason}.`,
    "The flow-end interval is neither clinical IVRT nor invasive LV pressure tau.",
    `PV series R: +25% gives x'=${fmt(highPvResistance.readback.cToXDepthMmHg)} mmHg and QPV nadir=${fmt(highPvResistance.readback.pulmonaryVenousAtrialWindowNadirMlPerSec)} mL/s, but Ar=${highPvResistance.readback.pulmonaryVenousAtrialReversalStatus}. Local R alone is insufficient; no C/L/source/MV compensation was applied.`,
    `Decision: the post-MV-close-conductance-midpoint rise resolves as ${report.phaseAttribution.reference.readback.cWaveCandidateStatus}; c→x monotonicity=${nullablePct(report.phaseAttribution.reference.readback.cToXNonIncreasingFraction)}.`,
    "Do not gate strict MV-close-conductance-midpoint→x monotonicity. The later pressure-flow contract separates event timing from conductance but still does not establish leaflet contact or clinical IVRT.",
  ];
  lines.forEach((line, index) => {
    out.push(text(
      x + 20,
      y + 51 + index * 28,
      line,
      12.5,
      index >= lines.length - 2 ? "#fbbf24" : "#cbd5e1",
      index >= lines.length - 2 ? 700 : 400,
    ));
  });
}

function attributionRows(): readonly {
  readonly label: string;
  readonly value: WorkConjugateAtrialAVPlanePhaseAttributionCaseV1;
}[] {
  const attribution = report.phaseAttribution;
  return [
    { label: "reference event activation", value: attribution.reference },
    ...attribution.factors.flatMap((factor) =>
      factor.cases.map((row) => ({
        label: `${attributionFactorShortLabel(factor.factorId)} ${attributionCaseValueLabel(row, factor.referenceValue, factor.parameterUnit)}`,
        value: row,
      }))
    ),
  ];
}

function attributionFactorLabel(
  factorId: (typeof report.phaseAttribution.factors)[number]["factorId"],
): string {
  if (factorId === "effective-event-to-calcium-delay") {
    return "Effective event → Ca-like delay";
  }
  if (factorId === "lv-activation-fall-time") {
    return "LV activation-state fall time";
  }
  return "Pulmonary venous series resistance";
}

function attributionFactorShortLabel(
  factorId: (typeof report.phaseAttribution.factors)[number]["factorId"],
): string {
  if (factorId === "effective-event-to-calcium-delay") return "delay";
  if (factorId === "lv-activation-fall-time") return "LV fall";
  return "PV R";
}

function attributionCaseValueLabel(
  row: WorkConjugateAtrialAVPlanePhaseAttributionCaseV1,
  referenceValue: number,
  unit: "s" | "mmHg s/mL",
): string {
  const value = row.position === "reference"
    ? referenceValue
    : row.parameterValue ?? referenceValue;
  return unit === "s"
    ? `${row.position === "reference" ? "ref " : ""}${Math.round(value * 1000)} ms`
    : `${row.position === "reference" ? "ref " : ""}${value.toFixed(3)}`;
}

function attributionYLabel(
  row: WorkConjugateAtrialAVPlanePhaseAttributionCaseV1,
): string {
  const depth = fmt(row.readback.yDescentDepthMmHg);
  if (row.readback.yDescentMeasurementStatus ===
    "not-measurable-mitral-opening-fallback") return "n/m (MV fallback)";
  return row.readback.yDescentMeasurementStatus ===
      "right-censored-at-atrial-event"
    ? `≥${depth} cens.`
    : `${depth} interior`;
}

function shortAttributionPath(path: string): string {
  return path
    .replace("activationModel.params.", "activation.")
    .replace("params.activation.", "activation.")
    .replace("params.", "");
}

function nullableFmt(value: number | null): string {
  return value === null ? "n/m" : fmt(value);
}

function nullablePct(value: number | null): string {
  return value === null ? "n/m" : pct(value);
}

function nullableMs(value: number | null): string {
  return value === null ? "n/m" : `${Math.round(value * 1000)} ms`;
}

function drawAttributionTrace(
  out: string[],
  samples: readonly WorkConjugateAtrialAVPlanePhaseAttributionTraceSampleV1[],
  sx: (value: number) => number,
  sy: (value: number) => number,
  color: string,
  width: number,
): void {
  if (samples.length < 2) return;
  const d = samples.map((sample, index) =>
    `${index === 0 ? "M" : "L"}${sx(sample.laVolumeMl).toFixed(2)},${sy(sample.laPressureMmHg).toFixed(2)}`
  ).join(" ");
  out.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" opacity="${width < 3 ? "0.72" : "0.92"}"/>`);
}

function renderPvPanel(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  profile: WorkConjugateAtrialAVPlaneProfileV1,
  annotateEvents: boolean,
  scaleSamples: readonly WorkConjugateAtrialAVPlaneSampleV1[] = profile.samples,
): void {
  panel(out, x, y, w, h, "LA blood-volume PV phases");
  legend(out, x + 20, y + 54, w - 40, [
    ["reservoir", "#38bdf8"],
    ["conduit", "#f59e0b"],
    ["pumping", "#f472b6"],
  ]);
  const plot = { x: x + 84, y: y + 82, w: w - 116, h: h - 170 };
  const sx = linearScale(
    scaleSamples.map((sample) => sample.laVolumeMl),
    plot.x,
    plot.x + plot.w,
  );
  const sy = linearScale(
    scaleSamples.map((sample) => sample.laPressureMmHg),
    plot.y + plot.h,
    plot.y,
  );
  grid(out, plot.x, plot.y, plot.w, plot.h);
  renderAxes(
    out,
    plot,
    sx,
    sy,
    "LA blood volume V_LA (mL)",
    "LA pressure P_LA (mmHg)",
  );
  const phases = phasePaths(profile);
  drawLine(out, phases.reservoir, sx.map, sy.map, "#38bdf8", 4);
  drawLine(out, phases.conduit, sx.map, sy.map, "#f59e0b", 4);
  drawLine(out, phases.pumping, sx.map, sy.map, "#f472b6", 4);
  if (annotateEvents) {
    marker(out, nearestTheta(
      profile.samples,
      profile.xvyPressureReadback.mitralClosingConductanceMidpointTheta,
    ), sx.map, sy.map, "#22c55e", "MV close mid");
    marker(out, nearestTheta(
      profile.samples,
      profile.xvyPressureReadback.mitralOpeningConductanceMidpointTheta,
    ), sx.map, sy.map, "#fbbf24", "MV open mid");
    for (const crossing of profile.laPvLobes.crossings.slice(0, 3)) {
      out.push(`<circle cx="${sx.map(crossing.volumeMl)}" cy="${sy.map(crossing.pressureMmHg)}" r="6" fill="none" stroke="#e2e8f0" stroke-width="2"/>`);
    }
  }
  out.push(text(x + 20, y + h - 16, `${laPvLobeLabel(profile)} | ${mitralEaCompactLabel(profile)} | x ${fmt(profile.xvyPressureReadback.xDescentDepthMmHg)} mmHg`, 12, "#cbd5e1"));
}

function renderTimePanel(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  titleValue: string,
  yAxisLabel: string,
  rows: readonly PlotSeries[],
): void {
  panel(out, x, y, w, h, titleValue);
  legend(out, x + 18, y + 52, w - 36, rows.map((row) => [row.label, row.color]));
  const plot = { x: x + 66, y: y + 72, w: w - 88, h: h - 116 };
  const sx = linearScale([0, 1], plot.x, plot.x + plot.w, 0);
  const sy = linearScale(
    rows.flatMap((row) => row.values.map((point) => point.value)),
    plot.y + plot.h,
    plot.y,
  );
  grid(out, plot.x, plot.y, plot.w, plot.h);
  renderAxes(out, plot, sx, sy, "cycle phase theta (-)", yAxisLabel);
  rows.forEach((row) => {
    const d = row.values.map((point, index) =>
      `${index === 0 ? "M" : "L"}${sx.map(point.theta).toFixed(2)},${sy.map(point.value).toFixed(2)}`
    ).join(" ");
    out.push(`<path d="${d}" fill="none" stroke="${row.color}" stroke-width="2.2" stroke-linejoin="round"/>`);
  });
}

function renderSummary(out: string[], x: number, y: number, w: number, h: number): void {
  panel(out, x, y, w, h, "Hard-gate and diagnostic readback");
  const p = canonical.profile;
  const lines = [
    `hard gates: ${canonical.hardGates.allHardGatesPass ? "pass" : "fail"} | numeric=${p.allFinite} solver=${p.allStepsConverged} accepted=${p.allAcceptedSteps} periodic=${canonical.hardGates.periodicity} mass=${canonical.hardGates.closedVolumeMass} hidden=${canonical.hardGates.hiddenSourceExactlyZero}`,
    `residuals: max norm=${sci(p.residualExtrema.maxNormalizedEquationResidual)}; mass=${sci(p.residualExtrema.maxAbsMassResidualMl)} mL; wall raw=${sci(p.residualExtrema.maxAbsWallRawPowerResidualW)} W; AV force=${sci(p.residualExtrema.maxAbsAvPlaneForceResidualN)} N`,
    `pressure-area=${sci(p.residualExtrema.maxAbsPressureAreaIdentityResidualN)} N; coupled power=${sci(p.residualExtrema.maxAbsCoupledRawPowerResidualW)} W; total volume drift=${sci(p.residualExtrema.maxAbsTotalVolumeDriftMl)} mL`,
    `static passive reference dF/dz=${fmt(p.staticPassiveReference.netForceDerivativeNPerCm)} N/cm (<0 required); hidden source=${p.residualExtrema.maxHiddenBloodVolumeSourceMl}`,
    `${mitralEaLabel(p)}, separation=${fmt(p.mitral.eaPeakSeparationSec)} s, diastasis=${fmt(p.mitral.diastasisDurationSec)} s, rise/decay=${fmt(p.mitral.eRiseMonotoneFraction)}/${fmt(p.mitral.eDecayMonotoneFraction)}`,
    `PVF: S/D=${fmt(p.pulmonaryVenous.sToDRatio)}; z excursion=${fmt(p.zRangeCm[1] - p.zRangeCm[0])} cm; |u|max=${fmt(Math.max(Math.abs(p.uRangeCmPerSec[0]), Math.abs(p.uRangeCmPerSec[1])))} cm/s`,
    `event activation: TTP/RT50=${ms(eventActivation.profile.activationReadback.laEventToContractilePeakSec)}/${ms(eventActivation.profile.activationReadback.laContractileRt50Sec)} ms, r_Pa=${fmt(eventActivation.profile.activationReadback.pressurePeakVolumePosition.fractionFromMinimumToEventVolume ?? Number.NaN)}, topology=${eventActivation.profile.laPvLobes.reason}; diagnostic only`,
  ];
  lines.forEach((line, index) => {
    out.push(text(x + 22, y + 58 + index * 36, line, 13, index === 0 ? "#e2e8f0" : "#cbd5e1", index === 0 ? 700 : 400));
  });
}

function renderActivationAblationSummary(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  panel(out, x, y, w, h, "Activation attribution and remaining limitations");
  const b = canonical.profile;
  const c = eventActivation.profile;
  const br = b.activationReadback;
  const cr = c.activationReadback;
  const dt = report.activationDtSensitivity.coarseToFineAbsoluteDifference;
  const lines = [
    `contractile timing: legacy TTP/RT50=${ms(br.laEventToContractilePeakSec)}/${ms(br.laContractileRt50Sec)} ms; event model=${ms(cr.laEventToContractilePeakSec)}/${ms(cr.laContractileRt50Sec)} ms; LA activation at MV-close conductance midpoint ${fmt(br.laActivationAtMitralClosingConductanceMidpoint01)} → ${fmt(cr.laActivationAtMitralClosingConductanceMidpoint01)}`,
    `pressure apex: theta ${fmt(br.laPressurePeakTheta)} → ${fmt(cr.laPressurePeakTheta)}; r_Pa ${fmt(br.pressurePeakVolumePosition.fractionFromMinimumToEventVolume ?? Number.NaN)} → ${fmt(cr.pressurePeakVolumePosition.fractionFromMinimumToEventVolume ?? Number.NaN)} (higher means pressure peak occurs at a larger pumping-window volume)`,
    `x/y: MV-close-mid→x ${fmt(b.xvyPressureReadback.xDescentDepthMmHg)} → ${fmt(c.xvyPressureReadback.xDescentDepthMmHg)} mmHg; c→x' ${nullableFmt(b.xvyPressureReadback.cWaveCandidate.cToXDepthMmHg)} → ${nullableFmt(c.xvyPressureReadback.cWaveCandidate.cToXDepthMmHg)} mmHg (${c.xvyPressureReadback.cWaveCandidate.status}); Ao-flow-end→MV-open-mid ${nullableMs(b.xvyPressureReadback.aorticFlowEndToMitralConductanceOpeningSec)} → ${nullableMs(c.xvyPressureReadback.aorticFlowEndToMitralConductanceOpeningSec)}; y ${yDepthLabel(b)} → ${yDepthLabel(c)}`,
    `topology: legacy=${b.laPvLobes.reason}, event=${c.laPvLobes.reason}; Q_PV atrial reversal legacy/event=${br.pulmonaryVenousAtrialReversal.status}/${cr.pulmonaryVenousAtrialReversal.status}. Activation alone is therefore insufficient for acceptance.`,
    `robustness: 0.01-cm sign-change scan found one stable AV-plane root in ${report.staticRootEnvelope.uniqueStableRootCaseCount}/${report.staticRootEnvelope.caseCount} cases (not a global proof); dt 1.0→0.25 ms changes peak activation by ${sci(dt.laContractilePeak01)} and r_Pa by ${sci(dt.pressurePeakVolumePositionFraction ?? Number.NaN)}.`,
    `${mitralEaLabel(b)} (legacy); ${mitralEaLabel(c)} (event). Fused waves are labeled not measurable rather than promoted as E/A targets.`,
  ];
  lines.forEach((line, index) => {
    out.push(text(
      x + 22,
      y + 58 + index * 37,
      line,
      13,
      index === 3 ? "#fbbf24" : "#cbd5e1",
      index === 3 ? 700 : 400,
    ));
  });
}

function renderVariantTable(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  rows: readonly WorkConjugateAtrialAVPlaneVariantV1[],
): void {
  panel(out, x, y, w, h, "Variant diagnostics");
  const columns = ["row", "A/v", "E/A", "x", "periodic"];
  columns.forEach((label, index) => {
    out.push(text(x + 18 + index * 82, y + 48, label, 11, "#94a3b8", 700));
  });
  rows.forEach((row, index) => {
    const p = row.profile;
    const yy = y + 76 + index * 48;
    out.push(text(x + 18, yy, shortId(row.variantId), 10.5, "#e2e8f0", row.variantId === canonical.variantId ? 700 : 400));
    out.push(text(x + 100, yy, p.laPvLobes.status === "measurable"
      ? `${fmt(p.laPvLobes.aLoopAreaMmHgMl)}/${fmt(p.laPvLobes.vLoopAreaMmHgMl)}`
      : "n/m", 10.5, "#cbd5e1"));
    out.push(text(x + 182, yy, p.mitral.measurementValid
      ? fmt(p.mitral.peakEToARatio)
      : "n/m", 10.5, "#cbd5e1"));
    out.push(text(x + 264, yy, fmt(p.xvyPressureReadback.xDescentDepthMmHg), 10.5, "#cbd5e1"));
    out.push(text(x + 346, yy, p.periodicSteadyState ? "yes" : "no", 10.5, p.periodicSteadyState ? "#86efac" : "#fca5a5"));
  });
}

type PlotSeries = {
  readonly values: readonly { readonly theta: number; readonly value: number }[];
  readonly color: string;
  readonly label: string;
};

type PlotRect = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
};

type LinearScale = {
  readonly domainMin: number;
  readonly domainMax: number;
  readonly map: (value: number) => number;
};

function series(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  key: keyof WorkConjugateAtrialAVPlaneSampleV1,
  color: string,
  label: string,
): PlotSeries {
  return customSeries(samples, (sample) => Number(sample[key]), color, label);
}

function customSeries(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  value: (sample: WorkConjugateAtrialAVPlaneSampleV1) => number,
  color: string,
  label: string,
): PlotSeries {
  return { values: samples.map((sample) => ({ theta: sample.theta, value: value(sample) })), color, label };
}

function phasePaths(profile: WorkConjugateAtrialAVPlaneProfileV1) {
  const samples = profile.samples;
  const closure = indexAtTheta(
    samples,
    profile.xvyPressureReadback.mitralClosingConductanceMidpointTheta,
  );
  const opening = indexAtTheta(
    samples,
    profile.xvyPressureReadback.mitralOpeningConductanceMidpointTheta,
  );
  const preA = indexAtTheta(samples, profile.mitral.activationOnsetTheta);
  return {
    reservoir: samples.slice(closure, opening + 1),
    conduit: samples.slice(opening, preA + 1),
    pumping: [...samples.slice(preA), ...samples.slice(0, closure + 1)],
  };
}

function drawLine(
  out: string[],
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  sx: (value: number) => number,
  sy: (value: number) => number,
  color: string,
  width: number,
  opacityWidth = width,
): void {
  if (samples.length < 2) return;
  const d = samples.map((sample, index) =>
    `${index === 0 ? "M" : "L"}${sx(sample.laVolumeMl).toFixed(2)},${sy(sample.laPressureMmHg).toFixed(2)}`
  ).join(" ");
  out.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${opacityWidth}" stroke-linejoin="round" stroke-linecap="round" opacity="${width < 3 ? "0.78" : "0.95"}"/>`);
}

function marker(
  out: string[],
  sample: WorkConjugateAtrialAVPlaneSampleV1,
  sx: (value: number) => number,
  sy: (value: number) => number,
  color: string,
  label: string,
): void {
  const x = sx(sample.laVolumeMl);
  const y = sy(sample.laPressureMmHg);
  out.push(`<circle cx="${x}" cy="${y}" r="5" fill="${color}"/>`);
  out.push(text(x + 8, y - 8, label, 10, color, 700));
}

function panel(out: string[], x: number, y: number, w: number, h: number, titleValue: string): void {
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#0f172a" stroke="#26364c"/>`);
  out.push(text(x + 16, y + 28, titleValue, 14, "#e2e8f0", 700));
}

function grid(out: string[], x: number, y: number, w: number, h: number): void {
  for (let index = 0; index <= 4; index += 1) {
    const gx = x + index * w / 4;
    const gy = y + index * h / 4;
    out.push(`<line x1="${gx}" y1="${y}" x2="${gx}" y2="${y + h}" stroke="#22314a"/>`);
    out.push(`<line x1="${x}" y1="${gy}" x2="${x + w}" y2="${gy}" stroke="#22314a"/>`);
  }
}

function renderAxes(
  out: string[],
  plot: PlotRect,
  xScale: LinearScale,
  yScale: LinearScale,
  xLabel: string,
  yLabel: string,
): void {
  out.push(`<line x1="${plot.x}" y1="${plot.y + plot.h}" x2="${plot.x + plot.w}" y2="${plot.y + plot.h}" stroke="#64748b"/>`);
  out.push(`<line x1="${plot.x}" y1="${plot.y}" x2="${plot.x}" y2="${plot.y + plot.h}" stroke="#64748b"/>`);
  const divisions = 4;
  for (let index = 0; index <= divisions; index += 1) {
    const progress = index / divisions;
    const xValue = xScale.domainMin + progress *
      (xScale.domainMax - xScale.domainMin);
    const yValue = yScale.domainMin + progress *
      (yScale.domainMax - yScale.domainMin);
    const px = plot.x + progress * plot.w;
    const py = plot.y + plot.h - progress * plot.h;
    out.push(text(
      px,
      plot.y + plot.h + 15,
      formatAxisTick(xValue, xScale.domainMax - xScale.domainMin),
      9.5,
      "#94a3b8",
      400,
      "middle",
    ));
    out.push(text(
      plot.x - 8,
      py + 3,
      formatAxisTick(yValue, yScale.domainMax - yScale.domainMin),
      9.5,
      "#94a3b8",
      400,
      "end",
    ));
  }
  out.push(text(
    plot.x + plot.w / 2,
    plot.y + plot.h + 32,
    xLabel,
    10.5,
    "#cbd5e1",
    600,
    "middle",
  ));
  out.push(rotatedText(
    plot.x - 58,
    plot.y + plot.h / 2,
    yLabel,
    10.5,
    "#cbd5e1",
    600,
  ));
}

function legend(
  out: string[],
  x: number,
  y: number,
  width: number,
  rows: readonly (readonly [string, string])[],
): void {
  const cellWidth = width / Math.max(1, rows.length);
  rows.forEach(([label, color], index) => {
    const lx = x + index * cellWidth;
    out.push(`<line x1="${lx}" y1="${y}" x2="${lx + 18}" y2="${y}" stroke="${color}" stroke-width="4"/>`);
    out.push(text(lx + 24, y + 4, label, 10.5, "#cbd5e1"));
  });
}

function title(titleText: string, subtitle: string): string {
  return [
    text(36, 44, titleText, 24, "#f8fafc", 700),
    text(36, 72, subtitle, 13, "#fbbf24", 600),
  ].join("\n");
}

function text(
  x: number,
  y: number,
  value: string,
  size: number,
  color: string,
  weight = 400,
  anchor: "start" | "middle" | "end" = "start",
): string {
  return `<text x="${x}" y="${y}" fill="${color}" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${escapeXml(value)}</text>`;
}

function rotatedText(
  x: number,
  y: number,
  value: string,
  size: number,
  color: string,
  weight = 400,
): string {
  return `<text x="${x}" y="${y}" fill="${color}" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="middle" transform="rotate(-90 ${x} ${y})">${escapeXml(value)}</text>`;
}

function svgStart(width: number, height: number): string[] {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="#07111f"/>`,
  ];
}

function linearScale(
  values: readonly number[],
  outMin: number,
  outMax: number,
  padFraction = 0.08,
): LinearScale {
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const rawSpan = rawMax - rawMin;
  const pad = rawSpan > 0
    ? rawSpan * padFraction
    : Math.max(Math.abs(rawMin) * 0.08, 1e-6);
  const domainMin = rawMin - pad;
  const domainMax = rawMax + pad;
  return {
    domainMin,
    domainMax,
    map: (value: number) => outMin + (value - domainMin) /
      Math.max(domainMax - domainMin, 1e-9) * (outMax - outMin),
  };
}

function formatAxisTick(value: number, span: number): string {
  const scale = Math.max(Math.abs(value), Math.abs(span));
  if (scale >= 100) return value.toFixed(0);
  if (scale >= 10) return value.toFixed(1);
  if (scale >= 0.1) return value.toFixed(2);
  return value.toExponential(1);
}

function nearestTheta(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  theta: number,
): WorkConjugateAtrialAVPlaneSampleV1 {
  return samples[indexAtTheta(samples, theta)]!;
}

function indexAtTheta(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  theta: number,
): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  samples.forEach((sample, index) => {
    const distance = Math.abs(sample.theta - theta);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}

function variant(id: string): WorkConjugateAtrialAVPlaneVariantV1 {
  const found = report.variants.find((row) => row.variantId === id);
  if (!found) throw new Error(`missing variant ${id}`);
  return found;
}

function palette(index: number): string {
  const colors = [
    "#38bdf8",
    "#22c55e",
    "#f87171",
    "#f59e0b",
    "#a78bfa",
    "#f472b6",
    "#eab308",
  ];
  return colors[index % colors.length]!;
}

function shortId(id: string): string {
  return id
    .replace("canonical-quasistatic-wall-viscous", "canonical")
    .replace("legacy-inherited-inertia-m1p1-negative-control", "legacy-M1.1")
    .replace("higher-wall-viscosity-topology-control", "high-visc")
    .replace("activation-timing-sensitivity", "timing")
    .replace("event-driven-atrial-activation-ablation", "event-act")
    .replace("physical-inertial-30g", "30g")
    .replace("atrial-active-off-control", "LA-off");
}

function fmt(value: number): string {
  return Number.isFinite(value) ? value.toFixed(Math.abs(value) >= 10 ? 1 : 3) : "n/a";
}

function ms(valueSec: number | null): string {
  return valueSec === null ? "n/a" : (1000 * valueSec).toFixed(1);
}

function mitralEaLabel(profile: WorkConjugateAtrialAVPlaneProfileV1): string {
  return profile.mitral.measurementValid
    ? `MV E/A peak=${fmt(profile.mitral.peakEToARatio)}; E/A VTI=${fmt(profile.mitral.vtiEToARatio)}`
    : `MV E/A not measurable (${profile.mitral.fusionClass})`;
}

function mitralEaCompactLabel(
  profile: WorkConjugateAtrialAVPlaneProfileV1,
): string {
  return profile.mitral.measurementValid
    ? `E/A ${fmt(profile.mitral.peakEToARatio)}`
    : `E/A n/m (${profile.mitral.fusionClass})`;
}

function laPvLobeLabel(profile: WorkConjugateAtrialAVPlaneProfileV1): string {
  return profile.laPvLobes.status === "measurable"
    ? `A/v ${fmt(profile.laPvLobes.aLoopAreaMmHgMl)} / ${fmt(profile.laPvLobes.vLoopAreaMmHgMl)}`
    : `A/v not measurable (${profile.laPvLobes.reason})`;
}

function yDepthLabel(profile: WorkConjugateAtrialAVPlaneProfileV1): string {
  const depth = fmt(profile.xvyPressureReadback.yDescentDepthMmHg);
  if (profile.xvyPressureReadback.yDescentMeasurementStatus ===
    "not-measurable-mitral-opening-fallback") return "n/m (MV fallback)";
  return profile.xvyPressureReadback.yDescentMeasurementStatus ===
    "right-censored-at-atrial-event"
    ? `≥${depth} (event-censored)`
    : depth;
}

function sci(value: number): string {
  return Number.isFinite(value) ? value.toExponential(2) : "n/a";
}

function pct(value: number): string {
  return `${(100 * value).toFixed(1)}%`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
