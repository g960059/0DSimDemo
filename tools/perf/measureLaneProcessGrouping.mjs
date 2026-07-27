/**
 * Measures the real product's live lanes at a fixed total lane count while
 * changing only how those lanes are grouped into renderer processes.
 *
 * Four lanes in one page and four lanes in four pages run the same number of
 * busy worker threads on the same machine, so anything that differs between
 * them is a per-renderer-process effect rather than a machine-level one.
 *
 * Requires a production build in dist/ and a static server on --base-url.
 *
 * Usage:
 *   npx vite preview --host 127.0.0.1 --port 4173 --strictPort &
 *   node tools/perf/measureLaneProcessGrouping.mjs [--lanes=4] [--window-ms=30000]
 *       [--layouts=4|1,1,1,1|2,2] [--count-allocations]
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

const BASE_URL = args.get("base-url") ?? "http://127.0.0.1:4173";
const WINDOW_MS = Number(args.get("window-ms") ?? 30000);
const WARMUP_MS = Number(args.get("warmup-ms") ?? 20000);
const COUNT_ALLOCATIONS = args.get("count-allocations") === "true";
const LAYOUTS = (args.get("layouts") ?? "4|1,1,1,1")
  .split("|")
  .map((entry) => entry.split(",").map(Number));

const EVIDENCE = '[data-testid="scientific-product-frame-evidence-v1"]';

async function openLanes(context, laneCount) {
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("circleheart.modelLimitations.ack.v1", "1");
  });
  const workerAllocationCounters = [];
  if (COUNT_ALLOCATIONS) {
    page.on("worker", (worker) => {
      workerAllocationCounters.push(worker);
      worker.evaluate(() => {
        const histogram = new Map();
        let constructions = 0;
        let bytes = 0;
        let external = 0;
        const stacks = new Map();
        const wrap = (name) => {
          const Original = globalThis[name];
          globalThis[name] = new Proxy(Original, {
            construct(target, argumentsList, newTarget) {
              const created = Reflect.construct(target, argumentsList, newTarget);
              constructions += 1;
              bytes += created.byteLength;
              histogram.set(
                created.byteLength,
                (histogram.get(created.byteLength) ?? 0) + 1,
              );
              // V8 keeps typed arrays of at most 64 bytes on the V8 heap; a
              // larger one takes a backing store from the process-wide
              // ArrayBuffer allocator.
              if (created.byteLength > 64) {
                external += 1;
                if (external % 5000 === 0) {
                  const site = new Error().stack?.split("\n").slice(2, 5).join(" | ")
                    ?? "";
                  stacks.set(site, (stacks.get(site) ?? 0) + 1);
                }
              }
              return created;
            },
          });
        };
        wrap("Float64Array");
        wrap("Float32Array");
        globalThis.__typedArrayProbe = () => ({
          constructions,
          bytes,
          external,
          histogram: [...histogram.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12),
          stacks: [...stacks.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
        });
      }).catch(() => undefined);
    });
  }
  await page.goto(`${BASE_URL}/ja/workbench`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="scientific-product-workbench-host-v1"]', {
    timeout: 120000,
  });
  await page.waitForFunction(
    (selector) =>
      document.querySelector(selector)?.getAttribute("data-studio-live-playback")
        === "running",
    EVIDENCE,
    { timeout: 120000 },
  );
  for (let index = 1; index < laneCount; index += 1) {
    await page.locator('button[aria-label="Healthy periodic baselineの操作"]')
      .first().click();
    await page.getByRole("button", { name: "複製", exact: true }).click();
    await page.waitForFunction(
      (expected) =>
        document.querySelector(
          '[data-testid="scientific-product-workbench-host-v1"]',
        )?.getAttribute("data-scenario-count") === String(expected),
      index + 1,
      { timeout: 120000 },
    );
    await page.waitForFunction(
      (selector) =>
        document.querySelector(selector)?.getAttribute("data-studio-live-playback")
          === "running",
      EVIDENCE,
      { timeout: 120000 },
    );
  }
  return { page, workerAllocationCounters };
}

async function readEvidence(page) {
  return await page.evaluate((selector) => {
    const node = document.querySelector(selector);
    if (node === null) return null;
    return {
      revision: Number(node.getAttribute("data-scientific-final-revision")),
      mode: node.getAttribute("data-studio-live-pacing-mode"),
      achievedRate: Number(
        node.getAttribute("data-studio-live-pacing-achieved-rate"),
      ),
      epochLagMs: Number(node.getAttribute("data-studio-live-pacing-epoch-lag-ms")),
      playback: node.getAttribute("data-studio-live-playback"),
      now: performance.now(),
    };
  }, EVIDENCE);
}

/**
 * Fraction of wall time the page's single main thread is unavailable.
 *
 * A message posted to a MessageChannel port runs as its own task, so the delay
 * before it runs is time some other task held the thread. Summing those delays
 * over a window gives main-thread occupancy without any product instrumentation.
 */
async function mainThreadOccupancy(page, durationMs) {
  return await page.evaluate(async (windowMs) => {
    return await new Promise((resolve) => {
      const channel = new MessageChannel();
      const started = performance.now();
      let postedAt = performance.now();
      let occupied = 0;
      let tasks = 0;
      let worstMs = 0;
      channel.port1.onmessage = () => {
        const now = performance.now();
        const delay = now - postedAt;
        occupied += delay;
        worstMs = Math.max(worstMs, delay);
        tasks += 1;
        if (now - started >= windowMs) {
          resolve({
            occupancy: occupied / (now - started),
            tasks,
            worstMs,
            windowMs: now - started,
          });
          return;
        }
        postedAt = performance.now();
        channel.port2.postMessage(0);
      };
      channel.port2.postMessage(0);
    });
  }, durationMs);
}

async function mainThreadLagMs(page) {
  return await page.evaluate(async () => {
    const samples = [];
    await new Promise((resolve) => {
      let remaining = 60;
      let previous = performance.now();
      const tick = () => {
        const now = performance.now();
        samples.push(now - previous - 16.67);
        previous = now;
        remaining -= 1;
        if (remaining <= 0) resolve(undefined);
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const sorted = samples.map((value) => Math.max(0, value)).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  });
}

/**
 * Exact main-thread occupancy, from the renderer's own accounting.
 *
 * `Performance.getMetrics` reports cumulative seconds the main thread spent
 * inside tasks, script, layout and style. Differencing it across a wall-clock
 * window gives the fraction of that thread the page is using, with no probe
 * task competing for the thread it is trying to measure.
 */
async function mainThreadMetrics(client) {
  const { metrics } = await client.send("Performance.getMetrics");
  const read = (name) => metrics.find((entry) => entry.name === name)?.value ?? 0;
  return {
    wallSec: read("Timestamp"),
    taskSec: read("TaskDuration"),
    scriptSec: read("ScriptDuration"),
    layoutSec: read("LayoutDuration"),
    styleSec: read("RecalcStyleDuration"),
  };
}

function occupancyBetween(before, after) {
  const wall = after.wallSec - before.wallSec;
  return {
    wallSec: wall,
    task: (after.taskSec - before.taskSec) / wall,
    script: (after.scriptSec - before.scriptSec) / wall,
    layout: (after.layoutSec - before.layoutSec) / wall,
    style: (after.styleSec - before.styleSec) / wall,
  };
}

async function runLayout(browser, layout) {
  const label = `${layout.reduce((a, b) => a + b, 0)} lanes over ${layout.length} page(s) [${layout.join(",")}]`;
  const contexts = [];
  const opened = [];
  for (const laneCount of layout) {
    const context = await browser.newContext();
    contexts.push(context);
    opened.push(await openLanes(context, laneCount));
  }

  await new Promise((resolve) => setTimeout(resolve, WARMUP_MS));

  const clients = [];
  for (const { page } of opened) {
    const client = await page.context().newCDPSession(page);
    await client.send("Performance.enable");
    clients.push(client);
  }
  const metricsBefore = await Promise.all(clients.map(mainThreadMetrics));
  const before = await Promise.all(opened.map(({ page }) => readEvidence(page)));
  await new Promise((resolve) => setTimeout(resolve, WINDOW_MS));
  const after = await Promise.all(opened.map(({ page }) => readEvidence(page)));
  const metricsAfter = await Promise.all(clients.map(mainThreadMetrics));
  const occupancy = metricsBefore.map((entry, index) =>
    occupancyBetween(entry, metricsAfter[index])
  );
  const lag = await mainThreadLagMs(opened[0].page);

  const perPage = before.map((start, index) => {
    const end = after[index];
    return {
      revisionsPerSecond: (end.revision - start.revision)
        / ((end.now - start.now) / 1000),
      mode: end.mode,
      achievedRate: end.achievedRate,
      epochLagMs: end.epochLagMs,
      playback: end.playback,
    };
  });

  let allocations = null;
  if (COUNT_ALLOCATIONS) {
    const counted = [];
    for (const { page } of opened) {
      for (const worker of page.workers()) {
        try {
          const value = await worker.evaluate(
            () => globalThis.__typedArrayProbe?.() ?? null,
          );
          if (value !== null) counted.push(value);
        } catch {
          // A worker can be torn down while we read it; that is not a result.
        }
      }
    }
    allocations = counted;
  }

  for (const context of contexts) await context.close();
  return { label, perPage, mainThreadLagP50Ms: lag, occupancy, allocations };
}

const browser = await chromium.launch();
console.log(
  `lane process grouping: window=${WINDOW_MS}ms warmup=${WARMUP_MS}ms base=${BASE_URL}`,
);
const results = [];
for (const layout of LAYOUTS) {
  const result = await runLayout(browser, layout);
  results.push(result);
  console.log(`\n== ${result.label} ==`);
  for (const [index, page] of result.perPage.entries()) {
    console.log(
      `  page ${index}: ${page.revisionsPerSecond.toFixed(1)} revisions/s  mode=${page.mode}  achievedRate=${page.achievedRate}  epochLag=${page.epochLagMs}ms  playback=${page.playback}`,
    );
  }
  console.log(`  main-thread rAF lag p50: ${result.mainThreadLagP50Ms.toFixed(2)} ms`);
  for (const [index, entry] of result.occupancy.entries()) {
    console.log(
      `  page ${index} main thread: task ${(entry.task * 100).toFixed(1)}%  script ${(entry.script * 100).toFixed(1)}%  layout ${(entry.layout * 100).toFixed(1)}%  style ${(entry.style * 100).toFixed(1)}%`,
    );
  }
  if (result.allocations !== null) {
    for (const [index, entry] of result.allocations.entries()) {
      console.log(
        `  worker ${index}: typed-array constructions=${entry.constructions} externalBackingStores=${entry.external} bytes=${entry.bytes}`,
      );
      console.log(
        `    byteLength histogram: ${entry.histogram.map(([size, count]) => `${size}B x${count}`).join(", ")}`,
      );
      for (const [site, count] of entry.stacks) {
        console.log(`    site x${count}: ${site}`);
      }
    }
  }
}
if (results.length >= 2) {
  const median = (values) =>
    [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const rate = (result) =>
    median(result.perPage.map((page) => page.revisionsPerSecond));
  console.log(
    `\n-> grouped/spread revision-rate ratio: ${(rate(results[1]) / rate(results[0])).toFixed(3)}x faster when spread`,
  );
}
await browser.close();
