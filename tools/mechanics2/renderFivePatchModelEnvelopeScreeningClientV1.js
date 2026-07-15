const NS = "http://www.w3.org/2000/svg";
let selected = 0;

function extent(values) {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return [0, 1];
  let lo = Math.min(...finite);
  let hi = Math.max(...finite);
  if (lo === hi) {
    const pad = Math.max(1, Math.abs(lo) * 0.05);
    lo -= pad;
    hi += pad;
  }
  const padding = (hi - lo) * 0.08;
  return [lo - padding, hi + padding];
}

function scale(domain, range) {
  return (value) =>
    range[0] +
    ((value - domain[0]) / (domain[1] - domain[0])) *
      (range[1] - range[0]);
}

function el(name, attrs = {}, text = "") {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, String(value));
  }
  if (text) node.textContent = text;
  return node;
}

function axes(svg, xDomain, yDomain, xLabel, yLabel) {
  svg.replaceChildren();
  const width = 520;
  const height = 330;
  const margin = { left: 58, right: 18, top: 14, bottom: 48 };
  const x = scale(xDomain, [margin.left, width - margin.right]);
  const y = scale(yDomain, [height - margin.bottom, margin.top]);
  for (let index = 0; index <= 4; index += 1) {
    const xValue = xDomain[0] + ((xDomain[1] - xDomain[0]) * index) / 4;
    const yValue = yDomain[0] + ((yDomain[1] - yDomain[0]) * index) / 4;
    svg.append(
      el("line", {
        x1: x(xValue),
        x2: x(xValue),
        y1: margin.top,
        y2: height - margin.bottom,
        class: "gridline",
      }),
      el("line", {
        x1: margin.left,
        x2: width - margin.right,
        y1: y(yValue),
        y2: y(yValue),
        class: "gridline",
      }),
      el(
        "text",
        {
          x: x(xValue),
          y: height - margin.bottom + 18,
          "text-anchor": "middle",
          class: "tick",
        },
        format(xValue),
      ),
      el(
        "text",
        {
          x: margin.left - 8,
          y: y(yValue) + 3,
          "text-anchor": "end",
          class: "tick",
        },
        format(yValue),
      ),
    );
  }
  svg.append(
    el("line", {
      x1: margin.left,
      x2: width - margin.right,
      y1: height - margin.bottom,
      y2: height - margin.bottom,
      class: "axis",
    }),
    el("line", {
      x1: margin.left,
      x2: margin.left,
      y1: margin.top,
      y2: height - margin.bottom,
      class: "axis",
    }),
    el(
      "text",
      {
        x: (margin.left + width - margin.right) / 2,
        y: height - 8,
        "text-anchor": "middle",
        class: "label",
      },
      xLabel,
    ),
    el(
      "text",
      {
        x: 15,
        y: (margin.top + height - margin.bottom) / 2,
        transform: `rotate(-90 15 ${(margin.top + height - margin.bottom) / 2})`,
        "text-anchor": "middle",
        class: "label",
      },
      yLabel,
    ),
  );
  return { x, y };
}

function rawPath(points, x, y, className) {
  if (!points.length) return null;
  return el("path", {
    d: points
      .map(
        (point, index) =>
          `${index ? "L" : "M"}${x(point[0]).toFixed(3)},${y(point[1]).toFixed(3)}`,
      )
      .join(" "),
    class: `raw-path ${className}`,
  });
}

function empty(svg, message) {
  svg.replaceChildren(
    el(
      "text",
      { x: 260, y: 165, "text-anchor": "middle", class: "tick" },
      message,
    ),
  );
}

function drawLinePanel(id, series, xLabel, yLabel) {
  const svg = document.getElementById(id);
  const finiteSeries = series.map((item) => ({
    ...item,
    points: item.points.filter(
      (point) => Number.isFinite(point[0]) && Number.isFinite(point[1]),
    ),
  }));
  const all = finiteSeries.flatMap((item) => item.points);
  if (all.length < 2) {
    empty(svg, "No retained raw endpoints");
    return;
  }
  const xDomain = extent(all.map((point) => point[0]));
  const yDomain = extent(all.map((point) => point[1]));
  const scaled = axes(svg, xDomain, yDomain, xLabel, yLabel);
  for (const item of finiteSeries) {
    const path = rawPath(item.points, scaled.x, scaled.y, item.className);
    if (path) svg.append(path);
  }
  if (yDomain[0] < 0 && yDomain[1] > 0) {
    svg.append(
      el("line", {
        x1: scaled.x(xDomain[0]),
        x2: scaled.x(xDomain[1]),
        y1: scaled.y(0),
        y2: scaled.y(0),
        class: "zero",
      }),
    );
  }
}

function drawScatter() {
  const svg = document.getElementById("scatter");
  const points = runs.filter(
    (run) =>
      run.evaluationEligible &&
      Number.isFinite(run.aLobeAreaMmHgMl) &&
      Number.isFinite(run.vLobeAreaMmHgMl),
  );
  const width = 660;
  const height = 390;
  const margin = { left: 70, right: 22, top: 18, bottom: 55 };
  svg.replaceChildren();
  if (!points.length) {
    svg.append(
      el(
        "text",
        { x: width / 2, y: height / 2, "text-anchor": "middle", class: "tick" },
        "No evaluation-eligible true-lobe pairs",
      ),
    );
    return;
  }
  const xDomain = extent(points.map((point) => point.vLobeAreaMmHgMl));
  const yDomain = extent(points.map((point) => point.aLobeAreaMmHgMl));
  const x = scale(xDomain, [margin.left, width - margin.right]);
  const y = scale(yDomain, [height - margin.bottom, margin.top]);
  for (let index = 0; index <= 4; index += 1) {
    const xValue = xDomain[0] + ((xDomain[1] - xDomain[0]) * index) / 4;
    const yValue = yDomain[0] + ((yDomain[1] - yDomain[0]) * index) / 4;
    svg.append(
      el("line", {
        x1: x(xValue),
        x2: x(xValue),
        y1: margin.top,
        y2: height - margin.bottom,
        class: "gridline",
      }),
      el("line", {
        x1: margin.left,
        x2: width - margin.right,
        y1: y(yValue),
        y2: y(yValue),
        class: "gridline",
      }),
      el(
        "text",
        {
          x: x(xValue),
          y: height - margin.bottom + 18,
          "text-anchor": "middle",
          class: "tick",
        },
        format(xValue),
      ),
      el(
        "text",
        {
          x: margin.left - 8,
          y: y(yValue) + 3,
          "text-anchor": "end",
          class: "tick",
        },
        format(yValue),
      ),
    );
  }
  svg.append(
    el(
      "text",
      {
        x: (margin.left + width - margin.right) / 2,
        y: height - 10,
        "text-anchor": "middle",
        class: "label",
      },
      "V-lobe absolute area (mmHg·mL)",
    ),
    el(
      "text",
      {
        x: 17,
        y: (margin.top + height - margin.bottom) / 2,
        transform: `rotate(-90 17 ${(margin.top + height - margin.bottom) / 2})`,
        "text-anchor": "middle",
        class: "label",
      },
      "A-lobe absolute area (mmHg·mL)",
    ),
  );
  for (const run of points) {
    const mark = el("circle", {
      cx: x(run.vLobeAreaMmHgMl),
      cy: y(run.aLobeAreaMmHgMl),
      r: 5,
      class: `scatter-point${run.canonicalOrdinal === selected ? " selected-point" : ""}`,
      stroke: run.armColor,
      fill: run.armColor,
      "data-ordinal": run.canonicalOrdinal,
    });
    mark.append(
      el(
        "title",
        {},
        `#${run.canonicalOrdinal} ${run.armLabel} LHS ${run.candidateIndex}; A ${format(run.aLobeAreaMmHgMl)}, V ${format(run.vLobeAreaMmHgMl)}`,
      ),
    );
    mark.addEventListener("click", () => selectRun(run.canonicalOrdinal));
    svg.append(mark);
  }
}

function format(value) {
  if (!Number.isFinite(value)) return "—";
  const absolute = Math.abs(value);
  return absolute >= 100
    ? value.toFixed(0)
    : absolute >= 10
      ? value.toFixed(1)
      : value.toFixed(2);
}

function escapeText(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

function selectRun(ordinal) {
  selected = ordinal;
  const run = runs[ordinal];
  const samples = run.samples;
  document.querySelectorAll("tr[data-ordinal]").forEach((row) =>
    row.classList.toggle(
      "selected-row",
      Number(row.dataset.ordinal) === ordinal,
    ),
  );
  const lobeText = run.evaluationEligible
    ? `true lobes: A ${format(run.aLobeAreaMmHgMl)} / V ${format(run.vLobeAreaMmHgMl)} mmHg·mL`
    : "true-lobe morphology display suppressed until evaluation-eligible";
  document.getElementById("selection-summary").innerHTML =
    `<p><strong>canonical #${run.canonicalOrdinal}</strong> · ${escapeText(run.armLabel)} · LHS ${run.candidateIndex}</p>` +
    `<p>status: ${escapeText(run.status)} · periodicity: ${escapeText(run.periodicityStatus)}</p>` +
    `<p>${lobeText} · retained endpoints ${run.retainedEndpointCount}</p>` +
    `<p>mechanism traces: ${escapeText(run.mechanismTraceStatus)} · component closure max |residual| ${format(run.maximumAbsoluteLaPressureComponentClosureResidualMmHg)} mmHg</p>` +
    `<p>matched-volume reservoir−conduit: ${escapeText(run.matchedVolumeReservoirMinusConduitStatus)}</p>` +
    (run.failureReasons.length
      ? `<p class="status-failure">${escapeText(run.failureReasons.join("; "))}</p>`
      : "");
  const warning = document.getElementById("selected-warning");
  if (run.status === "numerical-failure") {
    warning.className = "status-failure";
    warning.textContent =
      "Numerical failure: any retained trace is partial or pre-failure evidence only.";
  } else if (!run.evaluationEligible) {
    warning.className = "status-warning";
    warning.textContent =
      "Settle-and-assess return maps are not evaluation-eligible: raw numerical trace only.";
  } else {
    warning.className = "";
    warning.textContent =
      "Settle-and-assess return maps are evaluation-eligible; morphology remains report-only.";
  }
  drawLinePanel(
    "la-pv",
    [{ points: samples.map((sample) => [sample[1], sample[2]]), className: "single" }],
    "LA blood volume (mL)",
    "LAP (mmHg)",
  );
  drawLinePanel(
    "mv-flow",
    [{ points: samples.map((sample) => [sample[0], sample[4]]), className: "single" }],
    "cardiac phase",
    "MV flow (mL/s)",
  );
  drawLinePanel(
    "pressures",
    [
      { points: samples.map((sample) => [sample[0], sample[2]]), className: "lap" },
      { points: samples.map((sample) => [sample[0], sample[3]]), className: "lvp" },
      { points: samples.map((sample) => [sample[0], sample[5]]), className: "ppv" },
    ],
    "cardiac phase",
    "pressure (mmHg)",
  );
  drawLinePanel(
    "la-pressure-components",
    [
      { points: samples.map((sample) => [sample[0], sample[7]]), className: "passive" },
      { points: samples.map((sample) => [sample[0], sample[8]]), className: "active" },
      { points: samples.map((sample) => [sample[0], sample[9]]), className: "sls" },
      { points: samples.map((sample) => [sample[0], sample[10]]), className: "total" },
    ],
    "cardiac phase",
    "LA pressure contribution (mmHg)",
  );
  drawLinePanel(
    "pv-mv-flow",
    [
      { points: samples.map((sample) => [sample[0], sample[6]]), className: "qpv" },
      { points: samples.map((sample) => [sample[0], sample[4]]), className: "qmv" },
    ],
    "cardiac phase",
    "flow (mL/s)",
  );
  drawLinePanel(
    "la-strain",
    [{ points: samples.map((sample) => [sample[0], sample[11]]), className: "single" }],
    "cardiac phase",
    "fiber log strain",
  );
  drawLinePanel(
    "la-strain-rate",
    [{ points: samples.map((sample) => [sample[0], sample[12]]), className: "single" }],
    "cardiac phase",
    "backward difference strain rate (1/s)",
  );
  drawLinePanel(
    "mv-gradient",
    [{ points: samples.map((sample) => [sample[0], sample[13]]), className: "single" }],
    "cardiac phase",
    "LAP − LVP (mmHg)",
  );
  drawLinePanel(
    "mv-open",
    [{ points: samples.map((sample) => [sample[0], sample[14]]), className: "single" }],
    "cardiac phase",
    "open fraction (0–1)",
  );
  drawLinePanel(
    "lv-pressure-rate",
    [
      { points: samples.map((sample) => [sample[0], sample[15]]), className: "rate" },
      { points: samples.map((sample) => [sample[0], sample[16]]), className: "decay" },
    ],
    "cardiac phase",
    "LV pressure rate (mmHg/s)",
  );
  drawScatter();
}

document.querySelectorAll("tr[data-ordinal]").forEach((row) =>
  row.addEventListener("click", () => selectRun(Number(row.dataset.ordinal))),
);
document.querySelectorAll("button[data-ordinal]").forEach((button) =>
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    selectRun(Number(button.dataset.ordinal));
  }),
);
selectRun(0);
