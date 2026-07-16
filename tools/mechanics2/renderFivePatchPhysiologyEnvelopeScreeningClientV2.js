const runs = __EMBEDDED_FIVE_PATCH_PHYSIOLOGY_RUNS_V2__;
const root = document.getElementById("five-patch-physiology-screening-v2");
const splitter = document.getElementById("sidebar-splitter");
const tooltip = document.getElementById("screening-tooltip");
const SVG_NS = "http://www.w3.org/2000/svg";
const IDX = Object.freeze({
  phase: 0,
  laVolume: 1,
  lap: 2,
  lvVolume: 3,
  lvp: 4,
  qmv: 5,
  qpv: 6,
  pve: 7,
  aop: 8,
  passive: 9,
  active: 10,
  sls: 11,
  total: 12,
  caLa: 13,
  caRa: 14,
  caLv: 15,
  caSep: 16,
  caRv: 17,
  actLa: 18,
  actRa: 19,
  actLv: 20,
  actSep: 21,
  actRv: 22,
  laPvPhase: 23,
});

let selectedOrdinal = 0;

function svgElement(name, attributes = {}, text = null) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) {
    node.setAttribute(key, String(value));
  }
  if (text != null) node.textContent = text;
  return node;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "—";
  const absolute = Math.abs(value);
  if (absolute >= 1_000) return value.toFixed(0);
  if (absolute >= 100) return value.toFixed(1);
  if (absolute >= 10) return value.toFixed(2);
  if (absolute >= 1) return value.toFixed(3);
  if (absolute === 0) return "0";
  if (absolute >= 0.01) return value.toFixed(4);
  return value.toExponential(3);
}

function formatValue(value) {
  if (value == null) return "—";
  if (typeof value === "number") return formatNumber(value);
  if (typeof value === "boolean") return value ? "pass" : "fail";
  if (Array.isArray(value)) return value.map(formatValue).join(" – ");
  if (typeof value === "object") {
    if (Number.isFinite(value.minimum) && Number.isFinite(value.maximum)) {
      return `${formatNumber(value.minimum)} – ${formatNumber(value.maximum)}`;
    }
    return JSON.stringify(value);
  }
  return String(value);
}

function makeLabelButton(label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "label-button";
  button.textContent = label;
  button.dataset.tooltip = label;
  button.setAttribute("aria-label", label);
  return button;
}

function renderMetricRows(containerId, entries, mode = "metric") {
  const container = document.getElementById(containerId);
  container.replaceChildren();
  if (entries.length === 0) {
    const row = document.createElement("div");
    row.className = "metric-row muted";
    row.textContent = "Unavailable";
    container.append(row);
    return;
  }
  for (const entry of entries) {
    const row = document.createElement("div");
    row.className = "metric-row";
    row.append(makeLabelButton(entry.label));
    const value = document.createElement("span");
    value.className = "metric-value";
    if (mode === "gate") {
      value.classList.add(entry.passed ? "gate-pass" : "gate-fail");
      value.textContent = entry.passed ? "pass" : "fail";
      value.dataset.tooltip = `observed: ${formatValue(entry.observed)}; expected: ${formatValue(entry.expected)}`;
    } else {
      value.textContent = formatValue(entry.value);
      value.dataset.tooltip = `${entry.label}: ${formatValue(entry.value)}`;
    }
    row.append(value);
    container.append(row);
  }
}

function renderCandidates() {
  const container = document.getElementById("candidate-list");
  container.replaceChildren();
  for (const run of runs) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "candidate-button";
    button.dataset.ordinal = String(run.canonicalOrdinal);
    button.dataset.tooltip = `${run.candidateId}; ${run.status}; numerical ${run.numericalEligible ? "pass" : "fail"}; broad ${run.broadOperatingPointEligible ? "pass" : "fail"}`;
    button.setAttribute("aria-pressed", "false");
    button.setAttribute(
      "aria-label",
      `Canonical coordinate ${run.canonicalOrdinal}, LHS ${run.candidateIndex}`,
    );
    const index = document.createElement("span");
    index.textContent = `#${String(run.candidateIndex).padStart(2, "0")}`;
    const state = document.createElement("span");
    state.className = "candidate-state";
    state.textContent = run.combinedEligible
      ? "N+B"
      : run.numericalEligible
        ? "N only"
        : run.status === "integration-failure"
          ? "failed"
          : "not eligible";
    button.append(index, state);
    button.addEventListener("click", () => selectRun(run.canonicalOrdinal));
    container.append(button);
  }
}

function statusBadge(label, passed) {
  const badge = document.createElement("span");
  badge.className = `badge ${passed ? "pass" : "fail"}`;
  badge.textContent = `${label}: ${passed ? "pass" : "fail"}`;
  return badge;
}

function selectRun(ordinal) {
  selectedOrdinal = ordinal;
  const run = runs[ordinal];
  document.querySelectorAll(".candidate-button").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      Number(button.dataset.ordinal) === ordinal ? "true" : "false",
    );
  });
  document.getElementById("selected-title").textContent =
    `Canonical #${run.canonicalOrdinal} · LHS ${run.candidateIndex}`;
  document.getElementById("selected-subtitle").textContent =
    `${run.status} · periodicity ${run.periodicityStatus} · ${run.retainedEndpointCount} raw endpoints`;
  const failure = document.getElementById("selected-failure");
  failure.className = run.failureReasons.length ? "small gate-fail" : "small muted";
  failure.textContent = run.failureReasons.length
    ? run.failureReasons.join("; ")
    : "No recorded integration failure reason.";
  const status = document.getElementById("selection-status");
  status.replaceChildren(
    statusBadge("numerical", run.numericalEligible),
    statusBadge("broad", run.broadOperatingPointEligible),
    statusBadge("combined", run.combinedEligible),
  );
  renderMetricRows(
    "parameter-list",
    run.parameterRows.map((row) => ({ label: row.label, value: row.value })),
  );
  renderMetricRows(
    "numerical-list",
    run.numericalGateRows.map((row) => ({
      label: row.id,
      passed: row.passed,
      observed: row.observed,
      expected: row.expected,
    })),
    "gate",
  );
  renderMetricRows(
    "broad-list",
    run.broadGateRows.map((row) => ({
      label: row.id,
      passed: row.passed,
      observed: row.observed,
      expected: row.expected,
    })),
    "gate",
  );
  renderMetricRows(
    "physiology-list",
    Object.entries(run.physiologyMetrics).map(([label, value]) => ({
      label,
      value,
    })),
  );
  renderMetricRows(
    "vloop-list",
    Object.entries(run.vLoopMetrics).map(([label, value]) => ({ label, value })),
  );
  drawSelectedCharts(run.samples);
}

function extent(series) {
  const values = [];
  for (const line of series) {
    for (const point of line.points) {
      if (Number.isFinite(point[0]) && Number.isFinite(point[1])) {
        values.push(point);
      }
    }
  }
  if (values.length === 0) return null;
  let xMin = Math.min(...values.map((point) => point[0]));
  let xMax = Math.max(...values.map((point) => point[0]));
  let yMin = Math.min(...values.map((point) => point[1]));
  let yMax = Math.max(...values.map((point) => point[1]));
  if (xMax === xMin) {
    const pad = Math.max(1, Math.abs(xMin) * 0.05);
    xMin -= pad;
    xMax += pad;
  }
  if (yMax === yMin) {
    const pad = Math.max(1, Math.abs(yMin) * 0.05);
    yMin -= pad;
    yMax += pad;
  }
  const xPad = (xMax - xMin) * 0.04;
  const yPad = (yMax - yMin) * 0.07;
  return {
    xMin: xMin - xPad,
    xMax: xMax + xPad,
    yMin: yMin - yPad,
    yMax: yMax + yPad,
  };
}

function drawLineChart(id, series, xLabel, yLabel) {
  const svg = document.getElementById(id);
  const title = svg.querySelector("title")?.cloneNode(true);
  const description = svg.querySelector("desc")?.cloneNode(true);
  svg.replaceChildren();
  if (title) svg.append(title);
  if (description) svg.append(description);
  const bounds = extent(series);
  const width = 560;
  const height = 340;
  const margin = { left: 68, right: 18, top: 18, bottom: 50 };
  if (bounds == null) {
    svg.append(svgElement(
      "text",
      { x: width / 2, y: height / 2, "text-anchor": "middle", class: "empty-plot" },
      "No retained finite endpoints",
    ));
    return;
  }
  const x = (value) => margin.left +
    ((value - bounds.xMin) / (bounds.xMax - bounds.xMin)) *
      (width - margin.left - margin.right);
  const y = (value) => height - margin.bottom -
    ((value - bounds.yMin) / (bounds.yMax - bounds.yMin)) *
      (height - margin.top - margin.bottom);
  for (let index = 0; index <= 4; index += 1) {
    const fraction = index / 4;
    const xValue = bounds.xMin + fraction * (bounds.xMax - bounds.xMin);
    const yValue = bounds.yMin + fraction * (bounds.yMax - bounds.yMin);
    svg.append(
      svgElement("line", {
        x1: x(xValue),
        x2: x(xValue),
        y1: margin.top,
        y2: height - margin.bottom,
        class: "gridline",
      }),
      svgElement("line", {
        x1: margin.left,
        x2: width - margin.right,
        y1: y(yValue),
        y2: y(yValue),
        class: "gridline",
      }),
      svgElement(
        "text",
        {
          x: x(xValue),
          y: height - margin.bottom + 20,
          "text-anchor": "middle",
          class: "tick",
        },
        formatNumber(xValue),
      ),
      svgElement(
        "text",
        {
          x: margin.left - 9,
          y: y(yValue) + 4,
          "text-anchor": "end",
          class: "tick",
        },
        formatNumber(yValue),
      ),
    );
  }
  svg.append(
    svgElement("line", {
      x1: margin.left,
      x2: width - margin.right,
      y1: height - margin.bottom,
      y2: height - margin.bottom,
      class: "axis",
    }),
    svgElement("line", {
      x1: margin.left,
      x2: margin.left,
      y1: margin.top,
      y2: height - margin.bottom,
      class: "axis",
    }),
  );
  if (bounds.yMin < 0 && bounds.yMax > 0) {
    svg.append(svgElement("line", {
      x1: margin.left,
      x2: width - margin.right,
      y1: y(0),
      y2: y(0),
      class: "axis",
    }));
  }
  for (const line of series) {
    let path = "";
    let hasPoint = false;
    for (const point of line.points) {
      if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
        hasPoint = false;
        continue;
      }
      path += `${hasPoint ? "L" : "M"}${x(point[0]).toFixed(3)},${y(point[1]).toFixed(3)}`;
      hasPoint = true;
    }
    if (path !== "") {
      svg.append(svgElement("path", {
        d: path,
        class: `raw-path ${line.className}`,
      }));
    }
  }
  svg.append(
    svgElement(
      "text",
      {
        x: (margin.left + width - margin.right) / 2,
        y: height - 11,
        "text-anchor": "middle",
        class: "axis-label",
      },
      xLabel,
    ),
    svgElement(
      "text",
      {
        x: 18,
        y: (margin.top + height - margin.bottom) / 2,
        transform: `rotate(-90 18 ${(margin.top + height - margin.bottom) / 2})`,
        "text-anchor": "middle",
        class: "axis-label",
      },
      yLabel,
    ),
  );
}

function phasePvSeries(samples) {
  const classNames = [
    "phase-reservoir",
    "phase-conduit",
    "phase-pumping",
    "phase-transition",
  ];
  const segments = [];
  let active = null;
  let previous = null;
  for (const sample of samples) {
    const code = sample[IDX.laPvPhase];
    const point = [sample[IDX.laVolume], sample[IDX.lap]];
    if (active == null || active.code !== code) {
      active = {
        code,
        className: classNames[code] ?? "phase-transition",
        points: previous == null ? [] : [[previous[IDX.laVolume], previous[IDX.lap]]],
      };
      segments.push(active);
    }
    active.points.push(point);
    previous = sample;
  }
  return segments;
}

function phaseLines(samples, indices, classes) {
  return indices.map((index, position) => ({
    className: classes[position],
    points: samples.map((sample) => [sample[IDX.phase], sample[index]]),
  }));
}

function drawSelectedCharts(samples) {
  drawLineChart(
    "la-pv",
    phasePvSeries(samples),
    "LA blood volume (mL)",
    "LAP (mmHg)",
  );
  drawLineChart(
    "lv-pv",
    [{
      className: "series-4",
      points: samples.map((sample) => [sample[IDX.lvVolume], sample[IDX.lvp]]),
    }],
    "LV blood volume (mL)",
    "LVP (mmHg)",
  );
  drawLineChart(
    "flows",
    phaseLines(samples, [IDX.qmv, IDX.qpv], ["series-1", "series-3"]),
    "cardiac phase",
    "flow (mL/s)",
  );
  drawLineChart(
    "low-pressures",
    phaseLines(samples, [IDX.lap, IDX.pve], ["series-1", "series-3"]),
    "cardiac phase",
    "pressure (mmHg)",
  );
  drawLineChart(
    "high-pressures",
    phaseLines(samples, [IDX.lvp, IDX.aop], ["series-2", "series-4"]),
    "cardiac phase",
    "pressure (mmHg)",
  );
  drawLineChart(
    "components",
    phaseLines(
      samples,
      [IDX.passive, IDX.active, IDX.sls, IDX.total],
      ["series-1", "series-2", "series-3", "series-4"],
    ),
    "cardiac phase",
    "LA pressure contribution (mmHg)",
  );
  drawLineChart(
    "calcium",
    phaseLines(
      samples,
      [IDX.caLa, IDX.caRa, IDX.caLv, IDX.caSep, IDX.caRv],
      ["series-1", "series-2", "series-3", "series-4", "series-5"],
    ),
    "cardiac phase",
    "free calcium (µM)",
  );
  drawLineChart(
    "activation",
    phaseLines(
      samples,
      [IDX.actLa, IDX.actRa, IDX.actLv, IDX.actSep, IDX.actRv],
      ["series-1", "series-2", "series-3", "series-4", "series-5"],
    ),
    "cardiac phase",
    "activation (0–1)",
  );
}

function clampSidebarWidth(value) {
  return Math.max(280, Math.min(720, value));
}

function setSidebarWidth(value) {
  const width = clampSidebarWidth(value);
  root.style.setProperty("--sidebar-width", `${width}px`);
  splitter.setAttribute("aria-valuenow", String(Math.round(width)));
}

let dragStart = null;
splitter.addEventListener("pointerdown", (event) => {
  dragStart = {
    pointerId: event.pointerId,
    startX: event.clientX,
    width: parseFloat(getComputedStyle(root).getPropertyValue("--sidebar-width")),
  };
  splitter.setPointerCapture(event.pointerId);
});
splitter.addEventListener("pointermove", (event) => {
  if (dragStart == null || event.pointerId !== dragStart.pointerId) return;
  setSidebarWidth(dragStart.width + event.clientX - dragStart.startX);
});
splitter.addEventListener("pointerup", (event) => {
  if (dragStart != null && event.pointerId === dragStart.pointerId) {
    splitter.releasePointerCapture(event.pointerId);
    dragStart = null;
  }
});
splitter.addEventListener("keydown", (event) => {
  const current = parseFloat(
    getComputedStyle(root).getPropertyValue("--sidebar-width"),
  );
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    setSidebarWidth(current - 16);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    setSidebarWidth(current + 16);
  } else if (event.key === "Home") {
    event.preventDefault();
    setSidebarWidth(280);
  } else if (event.key === "End") {
    event.preventDefault();
    setSidebarWidth(720);
  }
});

let activeTooltipTarget = null;
function showTooltip(target) {
  const text = target.dataset.tooltip;
  if (!text) return;
  activeTooltipTarget = target;
  tooltip.textContent = text;
  tooltip.classList.add("visible");
  const targetBox = target.getBoundingClientRect();
  const box = tooltip.getBoundingClientRect();
  const left = Math.max(
    8,
    Math.min(window.innerWidth - box.width - 8, targetBox.left),
  );
  const topCandidate = targetBox.bottom + 6;
  const top = topCandidate + box.height <= window.innerHeight - 8
    ? topCandidate
    : Math.max(8, targetBox.top - box.height - 6);
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hideTooltip(target) {
  if (activeTooltipTarget !== target) return;
  activeTooltipTarget = null;
  tooltip.classList.remove("visible");
}

document.addEventListener("pointerover", (event) => {
  const target = event.target.closest?.("[data-tooltip]");
  if (target) showTooltip(target);
});
document.addEventListener("pointerout", (event) => {
  const target = event.target.closest?.("[data-tooltip]");
  if (target) hideTooltip(target);
});
document.addEventListener("focusin", (event) => {
  const target = event.target.closest?.("[data-tooltip]");
  if (target) showTooltip(target);
});
document.addEventListener("focusout", (event) => {
  const target = event.target.closest?.("[data-tooltip]");
  if (target) hideTooltip(target);
});

renderCandidates();
selectRun(selectedOrdinal);
