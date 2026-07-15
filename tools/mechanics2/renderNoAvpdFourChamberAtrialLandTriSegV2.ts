import { createHash, randomUUID } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { NoAvpdFourChamberAtrialLandBenchSampleV2 } from "@/engine/mechanics2/benches/NoAvpdFourChamberAtrialLandTriSegBenchV2";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_REPORT_PATH_V2,
  loadNoAvpdFourChamberAtrialLandTriSegReportV2,
  type NoAvpdFourChamberAtrialLandReportV2,
} from "@/tools/mechanics2/runNoAvpdFourChamberAtrialLandTriSegBenchV2";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const templatePath = resolve(
  repoRoot,
  "tools/mechanics2/templates/no-avpd-four-chamber-atrial-land-triseg-v2.html",
);
const defaultOutputPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/no-avpd-four-chamber-atrial-land-triseg-v2.html",
);

type PlotSeries = {
  readonly className: string;
  readonly points: ReadonlyArray<readonly [number, number]>;
  readonly width?: number;
  readonly dash?: boolean;
};

type PlotEvent = {
  readonly x: number;
  readonly label: string;
  readonly labelRow?: number;
};

type PlotOptions = {
  readonly xLabel: string;
  readonly yLabel: string;
  readonly events?: readonly PlotEvent[];
};

type PhaseSegment = {
  readonly startPhase01: number;
  readonly endPhase01: number;
  readonly wrapsCycleBoundary: boolean;
};

type PressureTroughCandidates = {
  readonly x: NoAvpdFourChamberAtrialLandBenchSampleV2 | null;
  readonly y: NoAvpdFourChamberAtrialLandBenchSampleV2 | null;
} | null;

export function renderNoAvpdFourChamberAtrialLandTriSegV2(
  reportPath = DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_REPORT_PATH_V2,
  destinationPath = defaultOutputPath,
) {
  const report = loadNoAvpdFourChamberAtrialLandTriSegReportV2(reportPath);
  if (report.lastBeatSamples.length < 2) {
    throw new Error("V2 visual requires a complete final beat");
  }
  const template = readFileSync(templatePath, "utf8");
  const replacements = buildReplacements(report);
  let html = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    if (!html.includes(placeholder)) {
      throw new Error(`V2 visual template placeholder missing: ${placeholder}`);
    }
    html = html.replace(placeholder, () => value);
  }
  const unresolved = html.match(/__NO_AVPD_ATRIAL_LAND_V2_[A-Z_]+__/g);
  if (unresolved != null) {
    throw new Error(`V2 visual has unresolved placeholders: ${unresolved.join(", ")}`);
  }
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = `${destinationPath}.tmp-${process.pid}-${randomUUID()}`;
  try {
    writeFileSync(temporaryPath, html, { flag: "wx" });
    renameSync(temporaryPath, destinationPath);
  } finally {
    rmSync(temporaryPath, { force: true });
  }
  return Object.freeze({
    outputPath: relativeRepoPath(destinationPath),
    reportPath: relativeRepoPath(reportPath),
    reportNormalizedSha256: report.normalizedSha256,
    templateSha256: sha256(readFileSync(templatePath)),
    rendererSha256: sha256(readFileSync(__filename)),
    htmlSha256: sha256(html),
    byteLength: Buffer.byteLength(html),
    finalBeatRawVertexCount: report.lastBeatSamples.length,
  });
}

function buildReplacements(
  report: NoAvpdFourChamberAtrialLandReportV2,
): Readonly<Record<string, string>> {
  const samples = report.lastBeatSamples;
  const physiology = report.reportOnlyPhysiology;
  const phaseSegmentation = physiology?.phaseSegmentation.status ===
      "identified-from-pressure-crossings-and-la-activation"
    ? physiology.phaseSegmentation
    : null;
  const pressureTroughCandidates = phaseSegmentation == null
    ? null
    : identifyPressureTroughCandidates(samples, phaseSegmentation);
  const pressureCrossingEvents = physiology == null
    ? []
    : [
        event(physiology.mitralOpeningPhase01, "MVO proxy", 0),
        event(physiology.leftAtrialActivationOnsetPhase01, "LA Ca onset", 1),
        event(physiology.mitralClosurePhase01, "MVC proxy", 0),
      ].filter((entry): entry is PlotEvent => entry != null);
  const activationEvents = physiology == null
    ? []
    : [event(physiology.leftAtrialActivationOnsetPhase01, "LA Ca onset", 0)]
      .filter((entry): entry is PlotEvent => entry != null);
  const lapEvents = [
    ...pressureCrossingEvents,
    event(pressureTroughCandidates?.x?.phase01 ?? null, "x?", 2),
    event(pressureTroughCandidates?.y?.phase01 ?? null, "y?", 2),
  ].filter((entry): entry is PlotEvent => entry != null);
  const laPvSeries = phaseSegmentation == null
    ? [series("series-total", samples, laPvPoint)]
    : [
        series(
          "series-reservoir",
          samplesInSegment(samples, phaseSegmentation.reservoir),
          laPvPoint,
          2.6,
        ),
        series(
          "series-conduit",
          samplesInSegment(samples, phaseSegmentation.conduitEarlyFilling),
          laPvPoint,
          2.6,
        ),
        series(
          "series-pumping",
          samplesInSegment(samples, phaseSegmentation.atrialPumping),
          laPvPoint,
          2.8,
        ),
      ];

  return Object.freeze({
    __NO_AVPD_ATRIAL_LAND_V2_SUMMARY__: renderSummary(report),
    __NO_AVPD_ATRIAL_LAND_V2_LA_PV__: renderPlotSvg(laPvSeries, {
      xLabel: "LA blood volume (mL)",
      yLabel: "LAP (mmHg)",
    }),
    __NO_AVPD_ATRIAL_LAND_V2_LV_PV__: renderPlotSvg(
      [series("series-land", samples, (sample) => [
        sample.volumesMl.leftVentricleMl,
        sample.pressuresMmHg.lv,
      ])],
      { xLabel: "LV blood volume (mL)", yLabel: "LVP (mmHg)" },
    ),
    __NO_AVPD_ATRIAL_LAND_V2_FLOWS__: renderPlotSvg(
      [
        series("series-reservoir", samples, (sample) => [
          sample.phase01,
          sample.flowsMlPerSec.mv,
        ]),
        series("series-violet", samples, (sample) => [
          sample.phase01,
          sample.flowsMlPerSec.pulmonaryVenous,
        ], 1.8, true),
      ],
      {
        xLabel: "cardiac phase",
        yLabel: "flow (mL/s)",
        events: pressureCrossingEvents,
      },
    ),
    __NO_AVPD_ATRIAL_LAND_V2_PRESSURES__: renderPlotSvg(
      [
        series("series-reservoir", samples, (sample) => [
          sample.phase01,
          sample.pressuresMmHg.la,
        ]),
        series("series-conduit", samples, (sample) => [
          sample.phase01,
          sample.pressuresMmHg.lv,
        ]),
      ],
      {
        xLabel: "cardiac phase",
        yLabel: "pressure (mmHg)",
        events: pressureCrossingEvents,
      },
    ),
    __NO_AVPD_ATRIAL_LAND_V2_LAP_ZOOM__: renderPlotSvg(
      [series("series-reservoir", samples, (sample) => [
        sample.phase01,
        sample.pressuresMmHg.la,
      ], 2.5)],
      {
        xLabel: "cardiac phase",
        yLabel: "LAP (mmHg)",
        events: lapEvents,
      },
    ),
    __NO_AVPD_ATRIAL_LAND_V2_STRESS__: renderPlotSvg(
      [
        series("series-pumping", samples, (sample) => [
          sample.phase01,
          sample.leftAtrium.activeKirchhoffStressKPa,
        ]),
        series("series-land", samples, (sample) => [
          sample.phase01,
          sample.leftAtrium.passiveStressKPa,
        ]),
        series("series-violet", samples, (sample) => [
          sample.phase01,
          sample.leftAtrium.slsOverstressKPa,
        ], 1.8, true),
        series("series-total", samples, (sample) => [
          sample.phase01,
          sample.leftAtrium.totalStressKPa,
        ], 1.8),
      ],
      {
        xLabel: "cardiac phase",
        yLabel: "Kirchhoff stress (kPa)",
        events: activationEvents,
      },
    ),
    __NO_AVPD_ATRIAL_LAND_V2_CALCIUM__: renderPlotSvg(
      [series("series-violet", samples, (sample) => [
        sample.phase01,
        sample.freeCalciumUm.la,
      ], 2.4)],
      {
        xLabel: "cardiac phase",
        yLabel: "free Ca (uM)",
        events: activationEvents,
      },
    ),
    __NO_AVPD_ATRIAL_LAND_V2_PHYSIOLOGY__: renderPhysiologyTable(
      report,
      pressureTroughCandidates,
    ),
    __NO_AVPD_ATRIAL_LAND_V2_NUMERICS__: renderNumericsTable(report),
    __NO_AVPD_ATRIAL_LAND_V2_FOOT__: escapeHtml(
      `${samples.length} raw final-beat accepted endpoints at ${formatNumber(report.protocol.dtSec * 1_000)} ms; no smoothing or resampling; raw endpoints joined by straight display segments. MVO/MVC markers are linearly interpolated LAP-LVP zero-crossing proxies. Report ${report.normalizedSha256.slice(0, 16)}…; implementation ${report.provenance.implementationSha256.slice(0, 16)}…`,
    ),
  });
}

function renderSummary(report: NoAvpdFourChamberAtrialLandReportV2): string {
  const statusClass = report.status === "pass" ? "pass" : "fail";
  const returnMap = report.exactOneBeatFullStateReturnMap;
  const periodicMetric = returnMap == null
    ? "unavailable"
    : `${returnMap.maxAbsDimensionless.toExponential(3)} / ${report.continuationProtocol.periodicToleranceMaxAbsDimensionless.toExponential(1)}`;
  return [
    `<b class="${statusClass}">structural gates: ${report.status.toUpperCase()}</b>`,
    `<span>${report.protocol.beatsRequested} beats · HR ${formatNumber(report.protocol.heartRateBpm)} · dt ${formatNumber(report.protocol.dtSec * 1_000)} ms</span>`,
    `<span>one-beat return caller gate: ${escapeHtml(report.continuationProtocol.periodicClassification)} (metric / threshold ${periodicMetric})</span>`,
    '<span class="warn">morphology: report-only</span>',
  ].join("");
}

function renderPhysiologyTable(
  report: NoAvpdFourChamberAtrialLandReportV2,
  pressureTroughCandidates: PressureTroughCandidates,
): string {
  const physiology = report.reportOnlyPhysiology;
  if (physiology == null) return row("status", "not available");
  return [
    row("LA volume min / max", `${formatNumber(physiology.laVolumeRangeMl.minimum)} / ${formatNumber(physiology.laVolumeRangeMl.maximum)} mL`),
    row("LV volume min / max", `${formatNumber(physiology.lvVolumeRangeMl.minimum)} / ${formatNumber(physiology.lvVolumeRangeMl.maximum)} mL`),
    row("LV EF", formatNumber(physiology.lvEjectionFraction01)),
    row("maximum LAP", `${formatNumber(physiology.maximumLaPressureMmHg)} mmHg @ ${formatNumber(physiology.maximumLaPressurePhase01)}`),
    row("MVO proxy / LA Ca onset / MVC proxy", `${formatNumber(physiology.mitralOpeningPhase01)} / ${formatNumber(physiology.leftAtrialActivationOnsetPhase01)} / ${formatNumber(physiology.mitralClosurePhase01)}`),
    row("phase proxy definitions", "reservoir: MVC→MVO (wrap); conduit: MVO→Ca onset; pumping window: Ca onset→MVC"),
    row("MV inflow", physiology.mitralInflowIdentification.status),
    row("E peak", peakText(physiology.ePeak)),
    row("A peak", peakText(physiology.aPeak)),
    row("E/A peak", formatNumber(physiology.eaPeakRatio)),
    row(
      "x? reservoir-window minimum",
      troughText(pressureTroughCandidates?.x ?? null),
    ),
    row(
      "y? conduit-window minimum",
      troughText(pressureTroughCandidates?.y ?? null),
    ),
    row("x/y status", "report-only event-window extrema; not validated wave landmarks"),
  ].join("");
}

function renderNumericsTable(
  report: NoAvpdFourChamberAtrialLandReportV2,
): string {
  const gateRows = Object.entries(report.numericalGates).map(([name, pass]) =>
    row(name, pass ? '<span class="pass">PASS</span>' : '<span class="fail">FAIL</span>', false)
  );
  return [
    ...gateRows,
    row(
      "full-state return map metric / caller threshold",
      report.exactOneBeatFullStateReturnMap == null
        ? "—"
        : `${report.exactOneBeatFullStateReturnMap.maxAbsDimensionless.toExponential(6)} / ${report.continuationProtocol.periodicToleranceMaxAbsDimensionless.toExponential(1)}`,
    ),
    row("global scaled residual max", report.hardDiagnostics.maximumGlobalScaledResidual.toExponential(3)),
    row("blood-volume drift max", `${report.hardDiagnostics.maximumAbsoluteTotalBloodVolumeDriftMl.toExponential(3)} mL`),
    row("minimum compartment volume", `${formatNumber(report.hardDiagnostics.minimumCompartmentVolumeMl)} mL (${report.hardDiagnostics.minimumCompartmentVolumePath})`),
    row("max Newton iterations / step", String(report.solverWork.maximumGlobalIterationsPerStep)),
  ].join("");
}

function renderPlotSvg(
  seriesEntries: readonly PlotSeries[],
  options: PlotOptions,
): string {
  const width = 720;
  const height = 325;
  const margin = { left: 67, right: 18, top: 22, bottom: 48 };
  const entries = seriesEntries.map((entry) => ({
    ...entry,
    points: entry.points.filter((point) =>
      Number.isFinite(point[0]) && Number.isFinite(point[1])
    ),
  }));
  const finitePoints = entries.flatMap((entry) => entry.points);
  if (finitePoints.length === 0) {
    return '<text x="360" y="162" text-anchor="middle" class="tick-label">No finite data</text>';
  }
  let xMin = Math.min(...finitePoints.map((point) => point[0]));
  let xMax = Math.max(...finitePoints.map((point) => point[0]));
  let yMin = Math.min(...finitePoints.map((point) => point[1]));
  let yMax = Math.max(...finitePoints.map((point) => point[1]));
  if (xMin === xMax) xMax = xMin + 1;
  if (yMin === yMax) yMax = yMin + 1;
  const xPadding = (xMax - xMin) * 0.03;
  const yPadding = (yMax - yMin) * 0.08;
  xMin -= xPadding;
  xMax += xPadding;
  yMin -= yPadding;
  yMax += yPadding;
  const xPosition = (value: number) =>
    margin.left +
    ((value - xMin) / (xMax - xMin)) * (width - margin.left - margin.right);
  const yPosition = (value: number) =>
    height -
    margin.bottom -
    ((value - yMin) / (yMax - yMin)) *
      (height - margin.top - margin.bottom);

  let markup = "";
  for (let index = 0; index <= 4; index += 1) {
    const x = xMin + ((xMax - xMin) * index) / 4;
    const y = yMin + ((yMax - yMin) * index) / 4;
    markup += `<line x1="${xPosition(x)}" y1="${margin.top}" x2="${xPosition(x)}" y2="${height - margin.bottom}" class="gridline"/><text x="${xPosition(x)}" y="${height - 25}" text-anchor="middle" class="tick-label">${formatNumber(x)}</text><line x1="${margin.left}" y1="${yPosition(y)}" x2="${width - margin.right}" y2="${yPosition(y)}" class="gridline"/><text x="${margin.left - 8}" y="${yPosition(y) + 4}" text-anchor="end" class="tick-label">${formatNumber(y)}</text>`;
  }
  for (const marker of options.events ?? []) {
    if (!Number.isFinite(marker.x) || marker.x < xMin || marker.x > xMax) continue;
    const x = xPosition(marker.x);
    const y = margin.top + 12 + (marker.labelRow ?? 0) * 14;
    markup += `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${height - margin.bottom}" class="event-line"/><text x="${x + 4}" y="${y}" class="event-label">${escapeHtml(marker.label)}</text>`;
  }
  for (const entry of entries) {
    if (entry.points.length === 0) continue;
    const path = entry.points.map((point, index) =>
      `${index === 0 ? "M" : "L"}${xPosition(point[0]).toFixed(2)},${yPosition(point[1]).toFixed(2)}`
    ).join(" ");
    markup += `<path d="${path}" class="series ${escapeHtml(entry.className)}${entry.dash ? " series-dash" : ""}"${entry.width == null ? "" : ` stroke-width="${entry.width}"`}/>`;
  }
  markup += `<text x="${(margin.left + width - margin.right) / 2}" y="${height - 5}" text-anchor="middle" class="axis-label">${escapeHtml(options.xLabel)}</text><text transform="translate(17 ${(margin.top + height - margin.bottom) / 2}) rotate(-90)" text-anchor="middle" class="axis-label">${escapeHtml(options.yLabel)}</text>`;
  return markup;
}

function series(
  className: string,
  samples: readonly NoAvpdFourChamberAtrialLandBenchSampleV2[],
  point: (
    sample: NoAvpdFourChamberAtrialLandBenchSampleV2,
  ) => readonly [number, number],
  width?: number,
  dash?: boolean,
): PlotSeries {
  return Object.freeze({
    className,
    points: samples.map(point),
    ...(width == null ? {} : { width }),
    ...(dash == null ? {} : { dash }),
  });
}

function samplesInSegment(
  samples: readonly NoAvpdFourChamberAtrialLandBenchSampleV2[],
  segment: PhaseSegment,
): readonly NoAvpdFourChamberAtrialLandBenchSampleV2[] {
  if (!segment.wrapsCycleBoundary) {
    return samples.filter((sample) =>
      sample.phase01 >= segment.startPhase01 &&
      sample.phase01 <= segment.endPhase01
    );
  }
  return [
    ...samples.filter((sample) => sample.phase01 >= segment.startPhase01),
    ...samples.filter((sample) => sample.phase01 <= segment.endPhase01),
  ];
}

function identifyPressureTroughCandidates(
  samples: readonly NoAvpdFourChamberAtrialLandBenchSampleV2[],
  segmentation: {
    readonly reservoir: PhaseSegment;
    readonly conduitEarlyFilling: PhaseSegment;
  },
): PressureTroughCandidates {
  const reservoir = samplesInSegment(samples, segmentation.reservoir);
  const conduit = samplesInSegment(samples, segmentation.conduitEarlyFilling);
  if (reservoir.length === 0 || conduit.length === 0) return null;
  const interiorLocalMinimum = (
    selected: readonly NoAvpdFourChamberAtrialLandBenchSampleV2[],
  ): NoAvpdFourChamberAtrialLandBenchSampleV2 | null => {
    const candidates = selected.slice(1, -1).filter((sample, index) => {
      const previous = selected[index]!;
      const next = selected[index + 2]!;
      const pressure = sample.pressuresMmHg.la;
      return pressure <= previous.pressuresMmHg.la &&
        pressure <= next.pressuresMmHg.la &&
        (pressure < previous.pressuresMmHg.la ||
          pressure < next.pressuresMmHg.la);
    });
    if (candidates.length === 0) return null;
    return candidates.reduce((best, sample) =>
      sample.pressuresMmHg.la < best.pressuresMmHg.la ? sample : best
    );
  };
  return Object.freeze({
    x: interiorLocalMinimum(reservoir),
    y: interiorLocalMinimum(conduit),
  });
}

function laPvPoint(
  sample: NoAvpdFourChamberAtrialLandBenchSampleV2,
): readonly [number, number] {
  return [sample.volumesMl.leftAtriumMl, sample.pressuresMmHg.la];
}

function event(
  value: number | null,
  label: string,
  labelRow: number,
): PlotEvent | null {
  return value == null ? null : Object.freeze({ x: value, label, labelRow });
}

function peakText(
  peak: { readonly phase01: number; readonly flowMlPerSec: number } | null,
): string {
  return peak == null
    ? "—"
    : `${formatNumber(peak.flowMlPerSec)} mL/s @ ${formatNumber(peak.phase01)}`;
}

function troughText(
  sample: NoAvpdFourChamberAtrialLandBenchSampleV2 | null,
): string {
  return sample == null
    ? "unresolved (no interior local minimum)"
    : `${formatNumber(sample.pressuresMmHg.la)} mmHg @ ${formatNumber(sample.phase01)}`;
}

function row(label: string, value: string, escapeValue = true): string {
  return `<tr><th>${escapeHtml(label)}</th><td>${escapeValue ? escapeHtml(value) : value}</td></tr>`;
}

function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(2);
  if (Math.abs(value) >= 1) return value.toFixed(3);
  return value.toFixed(4);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function relativeRepoPath(absolutePath: string): string {
  return absolutePath.startsWith(`${repoRoot}/`)
    ? absolutePath.slice(repoRoot.length + 1)
    : absolutePath;
}

function stringArgument(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (value == null || value.startsWith("--") || value.length === 0) {
    throw new Error(`${flag} must be followed by a value`);
  }
  return value;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const reportPath = resolve(
    repoRoot,
    stringArgument("--report") ??
      DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_REPORT_PATH_V2,
  );
  const outputPath = resolve(
    repoRoot,
    stringArgument("--output") ?? defaultOutputPath,
  );
  console.log(JSON.stringify(
    renderNoAvpdFourChamberAtrialLandTriSegV2(reportPath, outputPath),
    null,
    2,
  ));
}
