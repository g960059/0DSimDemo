import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const reportPath = resolve(
  repoRoot,
  "data/mechanics2/reports/pr467-la-accepted-history-active-replay-v1.json",
);
const templatePath = resolve(
  repoRoot,
  "tools/mechanics2/templates/pr467-la-accepted-history-active-replay-v1.html",
);
const outputPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/pr467-la-accepted-history-active-replay-v1.html",
);

const candidateLabels = Object.freeze({
  ALG_SLS4: "algebraic / SLS 4 kPa",
  ALG_SLS8: "algebraic / SLS 8 kPa",
  LAG25_SLS4: "lag 25 ms / SLS 4 kPa",
  LAG25_SLS8: "lag 25 ms / SLS 8 kPa",
});

type ReplayCandidateId = keyof typeof candidateLabels;

interface ReplayTracePoint {
  plotPhase01: number;
  laVolumeMl: number;
  laPressureMmHg: number;
  sourceHillActiveStressKPa: number;
  landActiveStressKPa: number;
  sourceHillProjectedActivePressureMmHg: number;
  landProjectedActivePressureMmHg: number;
  freeCalciumUm: number;
  totalFiberLogStrain: number;
  mitralFlowMlPerSec: number;
}

interface ReplayResult {
  candidateId: ReplayCandidateId;
  status: "pass" | "fail";
  sourceNormalizedSha256: string;
  summary: {
    sourceHillPeakActiveStressKPa: number;
    sourceHillPeakPhase01: number;
    landPeakActiveStressKPa: number;
    landPeakPhase01: number;
    landMinusHillPeakPhase01: number;
    landToHillPeakActiveStressRatio: number;
  };
  diagnostics: {
    maximumAbsoluteHillTotalStressClosurePa: number;
  };
  trace: ReplayTracePoint[];
}

interface ReplayReport {
  normalizedSha256: string;
  results: ReplayResult[];
}

interface PlotSeries {
  color: string;
  points: ReadonlyArray<readonly [number, number]>;
  width?: number;
  dash?: boolean;
}

interface PlotOptions {
  x: string;
  y: string;
  vline?: number;
}

export function renderPr467LaAcceptedHistoryActiveReplayV1(
  destinationPath = outputPath,
) {
  const report = JSON.parse(readFileSync(reportPath, "utf8")) as ReplayReport;
  const { normalizedSha256, ...body } = report;
  const expectedHash = createHash("sha256")
    .update(JSON.stringify(body))
    .digest("hex");
  if (expectedHash !== normalizedSha256) {
    throw new Error("replay report normalized hash mismatch");
  }
  const template = readFileSync(templatePath, "utf8");
  const initial = report.results.find(
    (result) => result.candidateId === "ALG_SLS4",
  );
  if (!initial) {
    throw new Error("replay visual default candidate ALG_SLS4 missing");
  }
  const replacements = createInitialReplacements(report, initial);
  let html = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    if (!html.includes(placeholder)) {
      throw new Error(`replay visual template placeholder missing: ${placeholder}`);
    }
    html = html.replace(placeholder, () => value);
  }
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = `${destinationPath}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, html);
  renameSync(temporaryPath, destinationPath);
  return Object.freeze({
    outputPath: relativeRepoPath(destinationPath),
    reportNormalizedSha256: normalizedSha256 as string,
    templateSha256: createHash("sha256")
      .update(readFileSync(templatePath))
      .digest("hex"),
    htmlSha256: createHash("sha256").update(html).digest("hex"),
    byteLength: Buffer.byteLength(html),
  });
}

function createInitialReplacements(
  report: ReplayReport,
  result: ReplayResult,
): Readonly<Record<string, string>> {
  const trace = result.trace;
  const caPeak = Math.max(...trace.map((sample) => sample.freeCalciumUm));
  const strainScale =
    caPeak /
    Math.max(
      1e-12,
      ...trace.map((sample) => Math.abs(sample.totalFiberLogStrain)),
    );
  const flowScale =
    caPeak /
    Math.max(
      1e-12,
      ...trace.map((sample) => Math.abs(sample.mitralFlowMlPerSec)),
    );

  return Object.freeze({
    __PR467_LA_ACCEPTED_HISTORY_REPLAY_DATA__: JSON.stringify(report).replaceAll(
      "<",
      "\\u003c",
    ),
    __PR467_LA_REPLAY_CANDIDATE_OPTIONS__: Object.entries(candidateLabels)
      .map(
        ([candidateId, label]) =>
          `<option value="${candidateId}"${candidateId === result.candidateId ? " selected" : ""}>${escapeHtml(label)}</option>`,
      )
      .join(""),
    __PR467_LA_REPLAY_INITIAL_GATE__:
      result.status === "pass"
        ? '<b class="pass">replay gates: PASS</b>'
        : '<b class="warn">replay gates: FAIL</b>',
    __PR467_LA_REPLAY_INITIAL_LAPV__: renderPlotSvg(
      [
        {
          color: "#62b7ff",
          points: trace.map((sample) => [
            sample.laVolumeMl,
            sample.laPressureMmHg,
          ]),
          width: 2.3,
        },
        {
          color: "#ef6bb6",
          points: trace
            .filter((sample) => sample.plotPhase01 >= 0.75)
            .map((sample) => [sample.laVolumeMl, sample.laPressureMmHg]),
          width: 3,
        },
      ],
      { x: "LA volume (mL)", y: "LAP (mmHg)" },
    ),
    __PR467_LA_REPLAY_INITIAL_STRESS__: renderPlotSvg(
      [
        {
          color: "#ffb020",
          points: trace.map((sample) => [
            sample.plotPhase01,
            sample.sourceHillActiveStressKPa,
          ]),
          width: 2.3,
        },
        {
          color: "#72e39a",
          points: trace.map((sample) => [
            sample.plotPhase01,
            sample.landActiveStressKPa,
          ]),
          width: 2.3,
        },
      ],
      {
        x: "cardiac phase",
        y: "active Kirchhoff stress (kPa)",
        vline: 0.78,
      },
    ),
    __PR467_LA_REPLAY_INITIAL_ACTIVEPV__: renderPlotSvg(
      [
        {
          color: "#ffb020",
          points: trace.map((sample) => [
            sample.laVolumeMl,
            sample.sourceHillProjectedActivePressureMmHg,
          ]),
          width: 2.3,
        },
        {
          color: "#72e39a",
          points: trace.map((sample) => [
            sample.laVolumeMl,
            sample.landProjectedActivePressureMmHg,
          ]),
          width: 2.3,
        },
      ],
      { x: "LA volume (mL)", y: "projected active pressure (mmHg)" },
    ),
    __PR467_LA_REPLAY_INITIAL_FORCING__: renderPlotSvg(
      [
        {
          color: "#b49cff",
          points: trace.map((sample) => [
            sample.plotPhase01,
            sample.freeCalciumUm,
          ]),
          width: 2.2,
        },
        {
          color: "#ffffff",
          points: trace.map((sample) => [
            sample.plotPhase01,
            sample.totalFiberLogStrain * strainScale,
          ]),
          width: 1.8,
          dash: true,
        },
        {
          color: "#62b7ff",
          points: trace.map((sample) => [
            sample.plotPhase01,
            sample.mitralFlowMlPerSec * flowScale,
          ]),
          width: 1.8,
          dash: true,
        },
      ],
      {
        x: "cardiac phase",
        y: "Ca (uM); strain & MV flow scaled",
        vline: 0.78,
      },
    ),
    __PR467_LA_REPLAY_INITIAL_METRICS__: renderMetrics(result),
    __PR467_LA_REPLAY_INITIAL_FOOT__: escapeHtml(
      `Static baseline: ALG_SLS4. Candidate switching is enabled only when inline JavaScript is available. 201 raw final-beat vertices at 5 ms; straight segments; no smoothing. Source ${result.sourceNormalizedSha256.slice(0, 16)}…; replay ${report.normalizedSha256.slice(0, 16)}…`,
    ),
  });
}

function renderMetrics(result: ReplayResult): string {
  return (
    "<tr><th>source</th><th>Hill peak kPa</th><th>Hill peak phase</th><th>Land peak kPa</th><th>Land peak phase</th><th>cyclic phase shift</th><th>Land/Hill peak</th><th>Hill closure Pa</th></tr>" +
    `<tr><td>${escapeHtml(candidateLabels[result.candidateId])}</td><td>${formatNumber(result.summary.sourceHillPeakActiveStressKPa)}</td><td>${formatNumber(result.summary.sourceHillPeakPhase01)}</td><td>${formatNumber(result.summary.landPeakActiveStressKPa)}</td><td>${formatNumber(result.summary.landPeakPhase01)}</td><td>${formatNumber(result.summary.landMinusHillPeakPhase01)}</td><td>${formatNumber(result.summary.landToHillPeakActiveStressRatio)}</td><td>${result.diagnostics.maximumAbsoluteHillTotalStressClosurePa.toExponential(2)}</td></tr>`
  );
}

function renderPlotSvg(
  series: ReadonlyArray<PlotSeries>,
  options: PlotOptions,
): string {
  const width = 720;
  const height = 325;
  const margin = { left: 65, right: 18, top: 14, bottom: 48 };
  const finitePoints = series
    .flatMap((entry) => entry.points)
    .filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]));
  if (finitePoints.length === 0) {
    return '<text x="360" y="162" text-anchor="middle" fill="#9fb0c8">No finite data</text>';
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
    markup += `<line x1="${xPosition(x)}" y1="${margin.top}" x2="${xPosition(x)}" y2="${height - margin.bottom}" stroke="#2a3850"/><text x="${xPosition(x)}" y="${height - 25}" text-anchor="middle" fill="#9fb0c8">${formatNumber(x)}</text><line x1="${margin.left}" y1="${yPosition(y)}" x2="${width - margin.right}" y2="${yPosition(y)}" stroke="#2a3850"/><text x="${margin.left - 8}" y="${yPosition(y) + 4}" text-anchor="end" fill="#9fb0c8">${formatNumber(y)}</text>`;
  }
  if (options.vline != null) {
    markup += `<line x1="${xPosition(options.vline)}" y1="${margin.top}" x2="${xPosition(options.vline)}" y2="${height - margin.bottom}" stroke="#ef6bb6" stroke-dasharray="5 5"/><text x="${xPosition(options.vline) + 5}" y="${margin.top + 12}" fill="#9fb0c8">LA Ca onset</text>`;
  }
  for (const entry of series) {
    const path = entry.points
      .filter(
        (point) => Number.isFinite(point[0]) && Number.isFinite(point[1]),
      )
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"}${xPosition(point[0]).toFixed(2)},${yPosition(point[1]).toFixed(2)}`,
      )
      .join(" ");
    markup += `<path d="${path}" fill="none" stroke="${escapeHtml(entry.color)}" stroke-width="${entry.width ?? 2}"${entry.dash ? ' stroke-dasharray="7 5"' : ""}/>`;
  }
  markup += `<text x="${(margin.left + width - margin.right) / 2}" y="${height - 5}" text-anchor="middle" fill="#eef5ff">${escapeHtml(options.x)}</text><text transform="translate(16 ${(margin.top + height - margin.bottom) / 2}) rotate(-90)" text-anchor="middle" fill="#eef5ff">${escapeHtml(options.y)}</text>`;
  return markup;
}

function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(2);
  return value.toFixed(3);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function relativeRepoPath(absolutePath: string): string {
  return absolutePath.startsWith(`${repoRoot}/`)
    ? absolutePath.slice(repoRoot.length + 1)
    : absolutePath;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  console.log(JSON.stringify(renderPr467LaAcceptedHistoryActiveReplayV1(), null, 2));
}
