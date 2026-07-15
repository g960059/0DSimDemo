import {
  assertCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  PHASE_B1_PAIRED_TERMINAL_WAVEFORM_ARTIFACT_V1_ID,
} from "@/tools/myocardium/phaseB1PairedTerminalWaveformArtifactV1";

const CHAMBERS = Object.freeze(["LA", "LV", "RA", "RV"] as const);
const VALVES = Object.freeze(["Q_MV", "Q_AoV", "Q_TV", "Q_PuV"] as const);
const MODES = Object.freeze(["off", "on"] as const);

type ChamberId = (typeof CHAMBERS)[number];
type ValveId = (typeof VALVES)[number];
type Mode = (typeof MODES)[number];
type JsonRecord = Record<string, unknown>;

type ReviewWaveform = Readonly<{
  phaseSec: readonly number[];
  chamberBloodVolumeM3: Readonly<Record<ChamberId, readonly number[]>>;
  chamberAbsolutePressurePa: Readonly<Record<ChamberId, readonly number[]>>;
  valveFlowM3PerSec: Readonly<Record<ValveId, readonly number[]>>;
}>;

type ReviewInput = Readonly<{
  artifactId: string;
  artifactContentSha256: string;
  pair: Readonly<{
    nominalDtSec: number;
    canonicalCycleLengthSec: number;
  }>;
  commonSourceHashes: Readonly<Record<string, string>>;
  modeSourceHashes: Readonly<Record<Mode, Readonly<Record<string, string>>>>;
  waveforms: Readonly<Record<Mode, ReviewWaveform>>;
}>;

/**
 * Verifies the canonical payload hash of a serialized paired artifact, then
 * builds a self-contained visual-QA document. Builder-issued WeakSet identity
 * deliberately is not (and cannot be) reconstructed after JSON serialization.
 *
 * Display conversion is performed only by the generated browser script. The
 * source SI arrays and caller-owned artifact object are never modified.
 */
export function buildPhaseB1PairedTerminalWaveformReviewHtmlV1(
  serializedArtifact: unknown,
  sha256Hex: CanonicalSha256HexProvider,
): string {
  const review = validateSerializedArtifact(serializedArtifact, sha256Hex);
  const embeddedReview = escapeJsonForInlineScript(review);
  const sourceHashRows = buildSourceHashRows(review);

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'">
  <title>Phase B1 paired terminal waveform visual QA</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f7f8fa;
      --surface: #ffffff;
      --text: #17202a;
      --muted: #59636e;
      --border: #d5d9df;
      --grid: #d9dde3;
      --off: #1769aa;
      --on: #c55a11;
      --focus: #7454c8;
      --warning-bg: #fff3cd;
      --warning-text: #5d4700;
      --tooltip-bg: #17202a;
      --tooltip-text: #ffffff;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #111315;
        --surface: #191c1f;
        --text: #eef1f4;
        --muted: #aab2bb;
        --border: #343a40;
        --grid: #353b42;
        --off: #69b7f4;
        --on: #ff9a57;
        --focus: #b7a2ff;
        --warning-bg: #3a3216;
        --warning-text: #ffe59a;
        --tooltip-bg: #f4f6f8;
        --tooltip-text: #15191d;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      line-height: 1.45;
    }
    main { width: min(1600px, 100%); margin: 0 auto; padding: 24px; }
    h1 { margin: 0 0 6px; font-size: 22px; font-weight: 600; }
    h2 { margin: 28px 0 10px; font-size: 17px; font-weight: 600; }
    p { margin: 4px 0; }
    .meta, .boundary { color: var(--muted); }
    .boundary {
      margin: 16px 0;
      padding: 10px 12px;
      border-left: 4px solid var(--on);
      background: var(--warning-bg);
      color: var(--warning-text);
    }
    .legend { display: flex; flex-wrap: wrap; gap: 18px; margin: 12px 0 4px; }
    .legend-item { display: inline-flex; align-items: center; gap: 7px; }
    .legend-line { width: 30px; height: 0; border-top: 3px solid; }
    .legend-line.off { border-color: var(--off); }
    .legend-line.on { border-color: var(--on); border-top-style: dashed; }
    .chart-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(285px, 1fr));
      gap: 14px;
    }
    figure {
      margin: 0;
      min-width: 0;
      padding: 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      break-inside: avoid;
    }
    figcaption { margin-bottom: 6px; font-weight: 600; }
    .plot-wrap { position: relative; width: 100%; aspect-ratio: 1.55; }
    .plot-wrap svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .axis, .tick { stroke: var(--muted); stroke-width: 1; }
    .gridline { stroke: var(--grid); stroke-width: 1; }
    .axis-text, .axis-label { fill: var(--muted); font-size: 10px; }
    .axis-label { font-size: 11px; }
    .series { fill: none; stroke-width: 2.2; vector-effect: non-scaling-stroke; }
    .series.off { stroke: var(--off); }
    .series.on { stroke: var(--on); stroke-dasharray: 7 4; }
    .hit-target { fill: transparent; pointer-events: all; }
    .hover-marker { fill: var(--surface); stroke-width: 2; pointer-events: none; }
    .hover-marker.off { stroke: var(--off); }
    .hover-marker.on { stroke: var(--on); }
    .tooltip {
      position: absolute;
      z-index: 2;
      display: none;
      max-width: 190px;
      padding: 6px 8px;
      border-radius: 5px;
      background: var(--tooltip-bg);
      color: var(--tooltip-text);
      font-size: 12px;
      line-height: 1.35;
      pointer-events: none;
      white-space: nowrap;
    }
    details { margin-top: 24px; }
    summary { cursor: pointer; font-weight: 600; }
    .hash-table { width: 100%; margin-top: 10px; border-collapse: collapse; }
    .hash-table th, .hash-table td {
      padding: 6px 8px;
      border-bottom: 1px solid var(--border);
      text-align: left;
      vertical-align: top;
    }
    .hash-table th { color: var(--muted); font-weight: 500; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; overflow-wrap: anywhere; }
    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
    }
    @media (max-width: 620px) {
      main { padding: 14px; }
      .chart-grid { grid-template-columns: 1fr; }
    }
    @media print {
      :root {
        color-scheme: light;
        --bg: #ffffff; --surface: #ffffff; --text: #000000; --muted: #424242;
        --border: #a7a7a7; --grid: #d0d0d0; --off: #1769aa; --on: #b44d0b;
        --warning-bg: #ffffff; --warning-text: #000000;
      }
      @page { size: A4 landscape; margin: 9mm; }
      body { font-size: 10px; }
      main { width: 100%; padding: 0; }
      h2 { margin-top: 15px; }
      .chart-grid { grid-template-columns: repeat(4, 1fr); gap: 7px; }
      figure { padding: 7px; border-radius: 0; }
      details { break-before: page; }
      details > * { display: block; }
    }
  </style>
</head>
<body>
  <main data-source-artifact-sha256="${review.artifactContentSha256}">
    <h1>四腔 SLS-off / SLS-on paired terminal waveform</h1>
    <p class="meta">Project-synthetic · test-only · physiology unverified</p>
    <p class="meta">dt = ${formatNumber(review.pair.nominalDtSec * 1000)} ms · cycle = ${formatNumber(review.pair.canonicalCycleLengthSec)} s · source artifact <code>${review.artifactContentSha256}</code></p>
    <p class="boundary"><strong>解釈境界:</strong> SLS-offで8の字トポロジーを保持することは合否条件ではありません。この表示はpaired visual QAであり、生理学的妥当性、SLSの因果効果、matched-volume attributionを確立しません。serialized JSONからbuilder-issued in-process identityを再認証せず、canonical payload hashのみ検証しています。</p>
    <div class="legend" aria-label="系列の凡例">
      <span class="legend-item"><span class="legend-line off" aria-hidden="true"></span>SLS-off（実線）</span>
      <span class="legend-item"><span class="legend-line on" aria-hidden="true"></span>SLS-on（破線）</span>
    </div>

    <section aria-labelledby="pv-heading">
      <h2 id="pv-heading">心房・心室 pressure–volume loops</h2>
      <div id="pv-grid" class="chart-grid"></div>
    </section>
    <section aria-labelledby="pressure-heading">
      <h2 id="pressure-heading">Four-chamber pressure waveforms</h2>
      <div id="pressure-grid" class="chart-grid"></div>
    </section>
    <section aria-labelledby="flow-heading">
      <h2 id="flow-heading">Four-valve signed flow waveforms</h2>
      <div id="flow-grid" class="chart-grid"></div>
    </section>

    <details open>
      <summary>Source hashes（canonical payloadで検証済み）</summary>
      <table class="hash-table">
        <thead><tr><th>scope</th><th>field</th><th>SHA-256</th></tr></thead>
        <tbody>${sourceHashRows}</tbody>
      </table>
    </details>
  </main>
  <script>
  (() => {
    "use strict";
    const source = ${embeddedReview};
    const chambers = ["LA", "LV", "RA", "RV"];
    const valves = ["Q_MV", "Q_AoV", "Q_TV", "Q_PuV"];
    const modes = ["off", "on"];
    const PA_PER_MMHG = 133.322387415;
    const M3_TO_ML = 1e6;
    const M3_PER_SEC_TO_ML_PER_SEC = 1e6;
    const labels = { LA: "LA", LV: "LV", RA: "RA", RV: "RV", Q_MV: "Mitral", Q_AoV: "Aortic", Q_TV: "Tricuspid", Q_PuV: "Pulmonary" };
    const svgns = "http://www.w3.org/2000/svg";

    function convert(mode) {
      const raw = source.waveforms[mode];
      const volume = {};
      const pressure = {};
      const flow = {};
      chambers.forEach((id) => {
        volume[id] = raw.chamberBloodVolumeM3[id].map((value) => value * M3_TO_ML);
        pressure[id] = raw.chamberAbsolutePressurePa[id].map((value) => value / PA_PER_MMHG);
      });
      valves.forEach((id) => {
        flow[id] = raw.valveFlowM3PerSec[id].map((value) => value * M3_PER_SEC_TO_ML_PER_SEC);
      });
      return { phase: raw.phaseSec.slice(), volume, pressure, flow };
    }
    const display = { off: convert("off"), on: convert("on") };

    function svgElement(tag, attrs = {}) {
      const node = document.createElementNS(svgns, tag);
      Object.entries(attrs).forEach(([name, value]) => node.setAttribute(name, String(value)));
      return node;
    }

    function extent(series) {
      let lo = Infinity;
      let hi = -Infinity;
      series.forEach((values) => values.forEach((value) => {
        if (value < lo) lo = value;
        if (value > hi) hi = value;
      }));
      if (lo === hi) {
        const delta = Math.max(Math.abs(lo) * 0.05, 1);
        lo -= delta;
        hi += delta;
      }
      const pad = (hi - lo) * 0.06;
      return [lo - pad, hi + pad];
    }

    function tickValues(domain, count = 4) {
      const values = [];
      for (let i = 0; i < count; i += 1) values.push(domain[0] + (domain[1] - domain[0]) * i / (count - 1));
      return values;
    }

    function nice(value) {
      const magnitude = Math.abs(value);
      if (magnitude >= 1000) return value.toFixed(0);
      if (magnitude >= 100) return value.toFixed(1);
      if (magnitude >= 10) return value.toFixed(2);
      return value.toFixed(3).replace(/0+$/, "").replace(/\\.$/, "");
    }

    function buildChart(config) {
      const figure = document.createElement("figure");
      const caption = document.createElement("figcaption");
      caption.textContent = config.title;
      figure.appendChild(caption);
      const wrap = document.createElement("div");
      wrap.className = "plot-wrap";
      const tooltip = document.createElement("div");
      tooltip.className = "tooltip";
      tooltip.setAttribute("role", "status");
      const svg = svgElement("svg", { viewBox: "0 0 360 230", role: "img", "aria-label": config.ariaLabel });
      const title = svgElement("title");
      title.textContent = config.ariaLabel;
      svg.appendChild(title);
      const desc = svgElement("desc");
      desc.textContent = "SLS-off solid line and SLS-on dashed line. Hover for the nearest sampled point.";
      svg.appendChild(desc);

      const margin = { left: 58, right: 14, top: 10, bottom: 42 };
      const width = 360 - margin.left - margin.right;
      const height = 230 - margin.top - margin.bottom;
      const xDomain = extent(modes.map((mode) => config.points(mode).map((point) => point.x)));
      const yDomain = extent(modes.map((mode) => config.points(mode).map((point) => point.y)));
      const x = (value) => margin.left + (value - xDomain[0]) / (xDomain[1] - xDomain[0]) * width;
      const y = (value) => margin.top + height - (value - yDomain[0]) / (yDomain[1] - yDomain[0]) * height;

      tickValues(xDomain).forEach((value) => {
        const px = x(value);
        svg.appendChild(svgElement("line", { x1: px, y1: margin.top, x2: px, y2: margin.top + height, class: "gridline" }));
        const text = svgElement("text", { x: px, y: margin.top + height + 17, "text-anchor": "middle", class: "axis-text" });
        text.textContent = nice(value);
        svg.appendChild(text);
      });
      tickValues(yDomain).forEach((value) => {
        const py = y(value);
        svg.appendChild(svgElement("line", { x1: margin.left, y1: py, x2: margin.left + width, y2: py, class: "gridline" }));
        const text = svgElement("text", { x: margin.left - 8, y: py + 3, "text-anchor": "end", class: "axis-text" });
        text.textContent = nice(value);
        svg.appendChild(text);
      });
      svg.appendChild(svgElement("line", { x1: margin.left, y1: margin.top + height, x2: margin.left + width, y2: margin.top + height, class: "axis" }));
      svg.appendChild(svgElement("line", { x1: margin.left, y1: margin.top, x2: margin.left, y2: margin.top + height, class: "axis" }));
      const xLabel = svgElement("text", { x: margin.left + width / 2, y: 225, "text-anchor": "middle", class: "axis-label" });
      xLabel.textContent = config.xLabel;
      svg.appendChild(xLabel);
      const yLabel = svgElement("text", { x: 13, y: margin.top + height / 2, transform: "rotate(-90 13 " + (margin.top + height / 2) + ")", "text-anchor": "middle", class: "axis-label" });
      yLabel.textContent = config.yLabel;
      svg.appendChild(yLabel);

      const scaled = {};
      const markers = {};
      modes.forEach((mode) => {
        const rawPoints = config.points(mode);
        scaled[mode] = rawPoints.map((point) => ({ ...point, px: x(point.x), py: y(point.y) }));
        const d = scaled[mode].map((point, index) => (index === 0 ? "M" : "L") + point.px.toFixed(3) + "," + point.py.toFixed(3)).join(" ");
        svg.appendChild(svgElement("path", { d, class: "series " + mode, "data-mode": mode }));
        const marker = svgElement("circle", { r: 4, class: "hover-marker " + mode, visibility: "hidden" });
        markers[mode] = marker;
        svg.appendChild(marker);
      });

      const hit = svgElement("rect", { x: margin.left, y: margin.top, width, height, class: "hit-target" });
      hit.addEventListener("pointermove", (event) => {
        const rect = svg.getBoundingClientRect();
        const pointerX = (event.clientX - rect.left) * 360 / rect.width;
        const pointerY = (event.clientY - rect.top) * 230 / rect.height;
        let best = null;
        modes.forEach((mode) => scaled[mode].forEach((point) => {
          const distance = (point.px - pointerX) ** 2 + (point.py - pointerY) ** 2;
          if (best === null || distance < best.distance) best = { ...point, mode, distance };
        }));
        if (best === null) return;
        modes.forEach((mode) => markers[mode].setAttribute("visibility", mode === best.mode ? "visible" : "hidden"));
        markers[best.mode].setAttribute("cx", String(best.px));
        markers[best.mode].setAttribute("cy", String(best.py));
        tooltip.innerHTML = "<strong>SLS-" + best.mode + "</strong><br>" + config.xTooltip + ": " + nice(best.x) + " " + config.xUnit + "<br>" + config.yTooltip + ": " + nice(best.y) + " " + config.yUnit + "<br>t: " + nice(best.phase) + " s";
        tooltip.style.display = "block";
        const wrapRect = wrap.getBoundingClientRect();
        const markerLeft = best.px / 360 * wrapRect.width;
        const markerTop = best.py / 230 * wrapRect.height;
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        tooltip.style.left = Math.max(0, Math.min(wrapRect.width - tooltipWidth, markerLeft + 8)) + "px";
        tooltip.style.top = Math.max(0, Math.min(wrapRect.height - tooltipHeight, markerTop - tooltipHeight - 8)) + "px";
      });
      hit.addEventListener("pointerleave", () => {
        tooltip.style.display = "none";
        modes.forEach((mode) => markers[mode].setAttribute("visibility", "hidden"));
      });
      svg.appendChild(hit);
      wrap.append(svg, tooltip);
      figure.appendChild(wrap);
      return figure;
    }

    chambers.forEach((id) => {
      document.getElementById("pv-grid").appendChild(buildChart({
        title: id + " pressure–volume loop",
        ariaLabel: id + " pressure-volume loop comparing SLS-off and SLS-on",
        xLabel: "Volume (mL)", yLabel: "Pressure (mmHg)",
        xTooltip: "Volume", yTooltip: "Pressure", xUnit: "mL", yUnit: "mmHg",
        points: (mode) => display[mode].phase.map((phase, index) => ({ phase, x: display[mode].volume[id][index], y: display[mode].pressure[id][index] })),
      }));
      document.getElementById("pressure-grid").appendChild(buildChart({
        title: id + " pressure",
        ariaLabel: id + " pressure waveform comparing SLS-off and SLS-on",
        xLabel: "Phase (s)", yLabel: "Pressure (mmHg)",
        xTooltip: "Phase", yTooltip: "Pressure", xUnit: "s", yUnit: "mmHg",
        points: (mode) => display[mode].phase.map((phase, index) => ({ phase, x: phase, y: display[mode].pressure[id][index] })),
      }));
    });
    valves.forEach((id) => {
      document.getElementById("flow-grid").appendChild(buildChart({
        title: labels[id] + " valve flow",
        ariaLabel: labels[id] + " valve signed flow waveform comparing SLS-off and SLS-on",
        xLabel: "Phase (s)", yLabel: "Signed flow (mL/s)",
        xTooltip: "Phase", yTooltip: "Flow", xUnit: "s", yUnit: "mL/s",
        points: (mode) => display[mode].phase.map((phase, index) => ({ phase, x: phase, y: display[mode].flow[id][index] })),
      }));
    });
  })();
  </script>
</body>
</html>
`;
}

function validateSerializedArtifact(
  value: unknown,
  sha256Hex: CanonicalSha256HexProvider,
): ReviewInput {
  const artifact = requireRecord(value, "artifact");
  const contentSha256 = requireSha256(artifact.contentSha256, "artifact.contentSha256");
  const { contentSha256: _contentSha256, ...payload } = artifact;
  assertCanonicalSha256(payload, contentSha256, sha256Hex, "artifact.contentSha256");

  if (artifact.artifactId !== PHASE_B1_PAIRED_TERMINAL_WAVEFORM_ARTIFACT_V1_ID) {
    throw new Error("input is not the Phase B1 paired terminal waveform artifact V1");
  }
  if (artifact.testOnly !== true) throw new Error("paired waveform artifact must remain test-only");
  if (artifact.hashAlgorithm !== "sha256-canonical-json-v1") {
    throw new Error("paired waveform artifact hash algorithm drifted");
  }
  const units = requireRecord(artifact.units, "artifact.units");
  if (
    units.phase !== "s"
    || units.volume !== "m3"
    || units.absolutePressure !== "Pa"
    || units.signedFlow !== "m3/s"
    || units.valuesConvertedForPresentation !== false
  ) {
    throw new Error("paired waveform artifact raw-SI unit contract drifted");
  }
  const sourceAuthentication = requireRecord(
    artifact.sourceAuthentication,
    "artifact.sourceAuthentication",
  );
  if (sourceAuthentication.builderIssuedAuthenticationSurvivesSerialization !== false) {
    throw new Error("serialized builder-issued authentication boundary drifted");
  }
  const interpretationBoundary = requireRecord(
    artifact.interpretationBoundary,
    "artifact.interpretationBoundary",
  );
  if (
    interpretationBoundary.visualQaProjectionOnly !== true
    || interpretationBoundary.pairOutcomeUsedAsPassFailGate !== false
    || interpretationBoundary.atrialPvTopologyPreservationRequired !== false
    || interpretationBoundary.matchedVolumeAttributionComputed !== false
    || interpretationBoundary.serializationReauthenticationSupported !== false
  ) {
    throw new Error("paired waveform visual-QA interpretation boundary drifted");
  }
  const negativeClaims = requireRecord(artifact.negativeClaims, "artifact.negativeClaims");
  if (negativeClaims.physiologicalValidationPass !== false) {
    throw new Error("paired waveform artifact must not claim physiological validation");
  }
  const pairRecord = requireRecord(artifact.pair, "artifact.pair");
  const modeOrder = pairRecord.modeOrder;
  if (
    !Array.isArray(modeOrder)
    || modeOrder.length !== 2
    || modeOrder[0] !== "off"
    || modeOrder[1] !== "on"
    || pairRecord.sameNominalGridAndCanonicalCycle !== true
    || pairRecord.slsOffPhysicalSlsEnabled !== false
    || pairRecord.slsOnPhysicalSlsEnabled !== true
  ) {
    throw new Error("paired waveform off/on mode contract drifted");
  }
  const pair = {
    nominalDtSec: requireFinite(pairRecord.nominalDtSec, "artifact.pair.nominalDtSec"),
    canonicalCycleLengthSec: requireFinite(
      pairRecord.canonicalCycleLengthSec,
      "artifact.pair.canonicalCycleLengthSec",
    ),
  };
  if (!(pair.nominalDtSec > 0) || !(pair.canonicalCycleLengthSec > 0)) {
    throw new Error("paired waveform grid and cycle must be positive");
  }

  const rawWaveforms = requireRecord(artifact.waveforms, "artifact.waveforms");
  const waveforms = Object.fromEntries(MODES.map((mode) => [
    mode,
    validateWaveform(rawWaveforms[mode], `artifact.waveforms.${mode}`),
  ])) as Record<Mode, ReviewWaveform>;
  const commonSourceHashes = validateHashRecord(
    artifact.commonSourceHashes,
    "artifact.commonSourceHashes",
  );
  const rawModeHashes = requireRecord(artifact.modeSourceHashes, "artifact.modeSourceHashes");
  const modeSourceHashes = Object.fromEntries(MODES.map((mode) => [
    mode,
    validateHashRecord(rawModeHashes[mode], `artifact.modeSourceHashes.${mode}`),
  ])) as Record<Mode, Readonly<Record<string, string>>>;

  return Object.freeze({
    artifactId: String(artifact.artifactId),
    artifactContentSha256: contentSha256,
    pair: Object.freeze(pair),
    commonSourceHashes: Object.freeze(commonSourceHashes),
    modeSourceHashes: Object.freeze(modeSourceHashes),
    waveforms: Object.freeze(waveforms),
  });
}

function validateWaveform(value: unknown, path: string): ReviewWaveform {
  const record = requireRecord(value, path);
  const phaseSec = requireFiniteArray(record.phaseSec, `${path}.phaseSec`);
  if (phaseSec.length < 2) throw new Error(`${path}.phaseSec needs at least two samples`);
  phaseSec.forEach((phase, index) => {
    if (index > 0 && !(phase > phaseSec[index - 1])) {
      throw new Error(`${path}.phaseSec must strictly increase`);
    }
  });
  const volumeRecord = requireRecord(
    record.chamberBloodVolumeM3,
    `${path}.chamberBloodVolumeM3`,
  );
  const pressureRecord = requireRecord(
    record.compartmentAbsolutePressurePa,
    `${path}.compartmentAbsolutePressurePa`,
  );
  const flowRecord = requireRecord(record.valveFlowM3PerSec, `${path}.valveFlowM3PerSec`);
  const chamberBloodVolumeM3 = Object.fromEntries(CHAMBERS.map((id) => [
    id,
    requireMatchedSeries(volumeRecord[id], phaseSec.length, `${path}.chamberBloodVolumeM3.${id}`),
  ])) as Record<ChamberId, readonly number[]>;
  const chamberAbsolutePressurePa = Object.fromEntries(CHAMBERS.map((id) => [
    id,
    requireMatchedSeries(pressureRecord[id], phaseSec.length, `${path}.compartmentAbsolutePressurePa.${id}`),
  ])) as Record<ChamberId, readonly number[]>;
  const valveFlowM3PerSec = Object.fromEntries(VALVES.map((id) => [
    id,
    requireMatchedSeries(flowRecord[id], phaseSec.length, `${path}.valveFlowM3PerSec.${id}`),
  ])) as Record<ValveId, readonly number[]>;
  return Object.freeze({
    phaseSec: Object.freeze(phaseSec),
    chamberBloodVolumeM3: Object.freeze(chamberBloodVolumeM3),
    chamberAbsolutePressurePa: Object.freeze(chamberAbsolutePressurePa),
    valveFlowM3PerSec: Object.freeze(valveFlowM3PerSec),
  });
}

function requireMatchedSeries(
  value: unknown,
  length: number,
  path: string,
): readonly number[] {
  const series = requireFiniteArray(value, path);
  if (series.length !== length) {
    throw new Error(`${path} length must match phaseSec`);
  }
  return Object.freeze(series);
}

function requireFiniteArray(value: unknown, path: string): number[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  return value.map((entry, index) => requireFinite(entry, `${path}[${index}]`));
}

function requireFinite(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${path} must be finite`);
  }
  return value;
}

function requireRecord(value: unknown, path: string): JsonRecord {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || (Object.getPrototypeOf(value) !== Object.prototype
      && Object.getPrototypeOf(value) !== null)
  ) {
    throw new Error(`${path} must be a plain record`);
  }
  return value as JsonRecord;
}

function requireSha256(value: unknown, path: string): string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${path} must be a lowercase SHA-256 digest`);
  }
  return value;
}

function validateHashRecord(value: unknown, path: string): Record<string, string> {
  const record = requireRecord(value, path);
  if (Object.keys(record).length === 0) throw new Error(`${path} must not be empty`);
  return Object.fromEntries(Object.entries(record).sort(([left], [right]) =>
    left.localeCompare(right)).map(([field, digest]) => [
      field,
      requireSha256(digest, `${path}.${field}`),
    ]));
}

function buildSourceHashRows(review: ReviewInput): string {
  const rows: string[] = [
    `<tr><td>artifact</td><td>contentSha256</td><td><code>${review.artifactContentSha256}</code></td></tr>`,
  ];
  Object.entries(review.commonSourceHashes).forEach(([field, digest]) => {
    rows.push(`<tr><td>common</td><td>${escapeHtml(field)}</td><td><code>${digest}</code></td></tr>`);
  });
  MODES.forEach((mode) => {
    Object.entries(review.modeSourceHashes[mode]).forEach(([field, digest]) => {
      rows.push(`<tr><td>${mode}</td><td>${escapeHtml(field)}</td><td><code>${digest}</code></td></tr>`);
    });
  });
  return rows.join("\n");
}

function escapeJsonForInlineScript(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(value);
}
