/**
 * Controlled probe: are N heavily-allocating worker isolates slower when they
 * share one renderer process than when they are spread over N renderer
 * processes?
 *
 * This deliberately contains no product code. It answers whether the residual
 * per-renderer-process factor observed on the product's live lanes is a generic
 * V8/renderer property of running N allocating isolates in one process, or
 * something specific to the product's workload. Every configuration runs the
 * same total number of busy worker threads, so machine-level thread contention
 * is held constant and only the process grouping changes.
 *
 * Usage:
 *   node tools/perf/isolateContentionProbe.mjs [--js-flags=...] [--workers=4]
 *       [--repeats=9] [--only=arith,object,typed,mixed]
 */
import { chromium } from "@playwright/test";

const args = new Map(
  process.argv.slice(2).map((raw) => {
    const index = raw.indexOf("=");
    return index === -1
      ? [raw.replace(/^--/, ""), "true"]
      : [raw.slice(2, index), raw.slice(index + 1)];
  }),
);

const WORKERS = Number(args.get("workers") ?? 4);
const REPEATS = Number(args.get("repeats") ?? 9);
const ONLY = (args.get("only") ?? "arith,object,typed,mixed").split(",");
const JS_FLAGS = args.get("js-flags") ?? "";

const PROBE_WORKER_SOURCE = `
const PERCENTILE = (values, q) => {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(q * sorted.length));
  return sorted[index];
};

// Pure scalar arithmetic. No allocation, no write barriers, no GC. Isolates
// thread speed: if this degrades, the machine is scheduling us worse.
function arith(iterations) {
  let a = 0.1, b = 0.2, c = 0.3;
  for (let i = 0; i < iterations; i += 1) {
    a = a * 1.0000001 + 0.5;
    b = Math.sqrt(a * a + b * b + 1);
    c = c + a / (b + 1);
    a = a - Math.floor(a);
  }
  return a + b + c;
}

// Short-lived small objects: young-generation allocation and scavenging.
function object(iterations) {
  let sum = 0;
  let sink = null;
  for (let i = 0; i < iterations; i += 1) {
    const frame = {
      t: i * 0.002,
      lv: i * 1.1,
      la: i * 0.9,
      ao: i * 1.3,
      parts: [i, i + 1, i + 2, i + 3],
    };
    sum += frame.lv + frame.parts[2];
    sink = frame;
  }
  return sum + (sink === null ? 0 : 1);
}

// Typed-array backing stores: a different allocation path (array buffer
// allocator / external memory accounting) from plain objects.
function typed(iterations) {
  let sum = 0;
  for (let i = 0; i < iterations; i += 1) {
    const buffer = new Float64Array(64);
    buffer[0] = i;
    buffer[63] = i * 2;
    sum += buffer[0] + buffer[63];
  }
  return sum;
}

// Retained + discarded mix: forces old-generation promotion and major GC work,
// which is where concurrent marking helper threads are actually used.
function mixed(iterations) {
  let sum = 0;
  const retained = [];
  for (let i = 0; i < iterations; i += 1) {
    const frame = { t: i * 0.002, values: [i, i + 1, i + 2, i + 3, i + 4] };
    sum += frame.values[4];
    if ((i & 63) === 0) {
      retained.push(frame);
      if (retained.length > 4096) retained.shift();
    }
  }
  return sum + retained.length;
}

// Same byte volume as \`typed\`, but the buffer is allocated once and reused.
// This is the candidate fix expressed as a probe.
function typedReuse(iterations) {
  const buffer = new Float64Array(64);
  let sum = 0;
  for (let i = 0; i < iterations; i += 1) {
    buffer[0] = i;
    buffer[63] = i * 2;
    sum += buffer[0] + buffer[63];
  }
  return sum;
}

// A plain JS array of the same length. Ordinary V8 heap allocation, not an
// ArrayBuffer backing store. Separates "allocation" from "ArrayBuffer".
function jsArray(iterations) {
  let sum = 0;
  for (let i = 0; i < iterations; i += 1) {
    const values = new Array(64);
    values[0] = i;
    values[63] = i * 2;
    sum += values[0] + values[63];
  }
  return sum;
}

function makeTypedSize(elements) {
  return (iterations) => {
    let sum = 0;
    for (let i = 0; i < iterations; i += 1) {
      const buffer = new Float64Array(elements);
      buffer[0] = i;
      buffer[elements - 1] = i * 2;
      sum += buffer[0] + buffer[elements - 1];
    }
    return sum;
  };
}

// The product's live lanes allocate exactly two typed-array shapes: about
// sixty Float64Array(6) (48 bytes) for every one Float64Array(15) (120 bytes).
// V8 keeps a typed array of at most 64 bytes inside the V8 heap; anything
// larger takes a backing store from the renderer-process-wide ArrayBuffer
// allocator. This kernel reproduces that mix, and the two halves of it isolate
// which side of the 64-byte boundary carries the cost.
function productMix(iterations) {
  let sum = 0;
  for (let i = 0; i < iterations; i += 1) {
    for (let inner = 0; inner < 60; inner += 1) {
      const state = new Float64Array(6);
      state[0] = i;
      state[5] = inner;
      sum += state[0] + state[5];
    }
    const rates = new Float64Array(15);
    rates[0] = i;
    rates[14] = i * 2;
    sum += rates[0] + rates[14];
  }
  return sum;
}

function productMixOnHeapOnly(iterations) {
  let sum = 0;
  for (let i = 0; i < iterations; i += 1) {
    for (let inner = 0; inner < 60; inner += 1) {
      const state = new Float64Array(6);
      state[0] = i;
      state[5] = inner;
      sum += state[0] + state[5];
    }
  }
  return sum;
}

function productMixExternalOnly(iterations) {
  let sum = 0;
  for (let i = 0; i < iterations; i += 1) {
    const rates = new Float64Array(15);
    rates[0] = i;
    rates[14] = i * 2;
    sum += rates[0] + rates[14];
  }
  return sum;
}

const KERNELS = {
  arith,
  object,
  typed,
  mixed,
  typedReuse,
  jsArray,
  productMix,
  productMixOnHeapOnly,
  productMixExternalOnly,
  typed2: makeTypedSize(2),
  // 48 bytes: the largest shape V8 still keeps on its own heap.
  typedAtBoundary: makeTypedSize(6),
  // 72 bytes: the smallest shape past the boundary, so the only difference
  // from typedAtBoundary is where the bytes come from.
  typedPastBoundary: makeTypedSize(9),
  typed512: makeTypedSize(512),
  typed8192: makeTypedSize(8192),
};
const ITERATIONS = {
  arith: 4000000,
  object: 400000,
  typed: 200000,
  mixed: 400000,
  typedReuse: 200000,
  jsArray: 200000,
  productMix: 5000,
  productMixOnHeapOnly: 5000,
  productMixExternalOnly: 5000,
  typed2: 200000,
  typedAtBoundary: 200000,
  typedPastBoundary: 200000,
  typed512: 50000,
  typed8192: 10000,
};

self.onmessage = (event) => {
  const { kernel, repeats, id } = event.data;
  const run = KERNELS[kernel];
  const iterations = ITERATIONS[kernel];
  // Warm up so we measure steady state, not tier-up.
  for (let i = 0; i < 3; i += 1) run(iterations);
  const durations = [];
  let checksum = 0;
  for (let i = 0; i < repeats; i += 1) {
    const started = performance.now();
    checksum += run(iterations);
    durations.push(performance.now() - started);
  }
  self.postMessage({
    id,
    kernel,
    checksum,
    p50: PERCENTILE(durations, 0.5),
    p90: PERCENTILE(durations, 0.9),
    max: Math.max(...durations),
    min: Math.min(...durations),
    mean: durations.reduce((a, b) => a + b, 0) / durations.length,
    durations,
  });
};
`;

async function runConfiguration(browser, label, pageLayout, kernel, repeats) {
  const contexts = [];
  const pages = [];
  for (const workersOnPage of pageLayout) {
    const context = await browser.newContext();
    contexts.push(context);
    const page = await context.newPage();
    await page.goto("about:blank");
    pages.push({ page, workersOnPage });
  }

  const results = await Promise.all(pages.map(({ page, workersOnPage }, pageIndex) =>
    page.evaluate(
      async ({ source, count, kernel: k, repeats: r, base }) => {
        const url = URL.createObjectURL(
          new Blob([source], { type: "text/javascript" }),
        );
        const workers = Array.from({ length: count }, () => new Worker(url));
        const settled = workers.map((worker, index) =>
          new Promise((resolve) => {
            worker.onmessage = (event) => resolve(event.data);
            worker.postMessage({ kernel: k, repeats: r, id: base + index });
          })
        );
        const out = await Promise.all(settled);
        for (const worker of workers) worker.terminate();
        URL.revokeObjectURL(url);
        return out;
      },
      {
        source: PROBE_WORKER_SOURCE,
        count: workersOnPage,
        kernel,
        repeats,
        base: pageIndex * 100,
      },
    )
  ));

  for (const context of contexts) await context.close();

  const flat = results.flat();
  const p50s = flat.map((entry) => entry.p50).sort((a, b) => a - b);
  const median = p50s[Math.floor(p50s.length / 2)];
  return {
    label,
    kernel,
    isolates: flat.length,
    medianOfWorkerP50: median,
    workerP50s: p50s.map((value) => Number(value.toFixed(2))),
    worstWorkerP50: p50s[p50s.length - 1],
  };
}

const layouts = [
  { label: `1 isolate, 1 process (idle-machine reference)`, layout: [1] },
  {
    label: `${WORKERS} isolates, 1 process`,
    layout: [WORKERS],
  },
  {
    label: `${WORKERS} isolates, ${WORKERS} processes`,
    layout: Array.from({ length: WORKERS }, () => 1),
  },
];
if (WORKERS % 2 === 0 && WORKERS > 2) {
  layouts.push({
    label: `${WORKERS} isolates, 2 processes`,
    layout: [WORKERS / 2, WORKERS / 2],
  });
}

const launchArgs = [];
if (JS_FLAGS) launchArgs.push(`--js-flags=${JS_FLAGS}`);

const browser = await chromium.launch({ args: launchArgs });
console.log(
  `isolate contention probe: workers=${WORKERS} repeats=${REPEATS} jsFlags=${JS_FLAGS || "(none)"}`,
);
for (const kernel of ONLY) {
  console.log(`\n== kernel: ${kernel} ==`);
  const rows = [];
  for (const { label, layout } of layouts) {
    // Interleave nothing: each configuration runs alone on the machine.
    const row = await runConfiguration(browser, label, layout, kernel, REPEATS);
    rows.push(row);
    console.log(
      `${label.padEnd(42)} median worker p50 ${row.medianOfWorkerP50.toFixed(2)} ms  worst ${row.worstWorkerP50.toFixed(2)} ms  [${row.workerP50s.join(", ")}]`,
    );
  }
  const onePage = rows.find((row) => row.label.includes(`${WORKERS} isolates, 1 process`));
  const manyPages = rows.find((row) =>
    row.label.includes(`${WORKERS} isolates, ${WORKERS} processes`)
  );
  if (onePage && manyPages) {
    console.log(
      `-> per-process penalty (1 process / ${WORKERS} processes): ${(onePage.medianOfWorkerP50 / manyPages.medianOfWorkerP50).toFixed(3)}x`,
    );
  }
}
await browser.close();
