/**
 * CPU-profiles the renderer main thread of a page running N live lanes, and
 * reports the heaviest self-time frames.
 *
 * The main thread is the one resource every lane in a page shares, so its
 * per-lane cost sets how many lanes a single page can hold at 1x.
 *
 * Build with `npx vite build --sourcemap` to get original names; without a
 * source map the frames fall back to minified identifiers.
 *
 * Usage:
 *   npx vite build --sourcemap
 *   npx vite preview --host 127.0.0.1 --port 4173 --strictPort &
 *   node tools/perf/profileLaneMainThread.mjs [--lanes=4] [--seconds=15]
 */
import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { buildIndex, lookup } from "./sourceMapPositions.mjs";

const mapIndexCache = new Map();
function originOf(frame) {
  const file = frame.url.split("/").pop() ?? "";
  if (file === "") return null;
  const mapPath = `dist/assets/${file}.map`;
  if (!existsSync(mapPath)) return null;
  if (!mapIndexCache.has(mapPath)) mapIndexCache.set(mapPath, buildIndex(mapPath));
  const found = lookup(mapIndexCache.get(mapPath), frame.lineNumber, frame.columnNumber);
  return found === null ? null : `${found.source.replace(/^.*\/(node_modules|engine|studio|components)\//, "$1/")}:${found.originalLine}${found.name ? ` (${found.name})` : ""}`;
}

const args = new Map(
  process.argv.slice(2).map((raw) => {
    const index = raw.indexOf("=");
    return index === -1
      ? [raw.replace(/^--/, ""), "true"]
      : [raw.slice(2, index), raw.slice(index + 1)];
  }),
);
const BASE_URL = args.get("base-url") ?? "http://127.0.0.1:4173";
const LANES = Number(args.get("lanes") ?? 4);
const SECONDS = Number(args.get("seconds") ?? 15);
const EVIDENCE = '[data-testid="scientific-product-frame-evidence-v1"]';

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
await page.addInitScript(() => {
  localStorage.setItem("circleheart.modelLimitations.ack.v1", "1");
});
await page.goto(`${BASE_URL}/ja/workbench`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(
  '[data-testid="scientific-product-workbench-host-v1"]',
  { timeout: 120000 },
);
await page.waitForFunction(
  (selector) =>
    document.querySelector(selector)?.getAttribute("data-studio-live-playback")
      === "running",
  EVIDENCE,
  { timeout: 120000 },
);
for (let index = 1; index < LANES; index += 1) {
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
await new Promise((resolve) => setTimeout(resolve, 15000));

const client = await context.newCDPSession(page);
await client.send("Profiler.enable");
await client.send("Profiler.setSamplingInterval", { interval: 200 });
await client.send("Profiler.start");
await new Promise((resolve) => setTimeout(resolve, SECONDS * 1000));
const { profile } = await client.send("Profiler.stop");

const byId = new Map(profile.nodes.map((node) => [node.id, node]));
const selfTicks = new Map();
for (const node of profile.nodes) {
  selfTicks.set(node.id, node.hitCount ?? 0);
}
const totalTicks = [...selfTicks.values()].reduce((a, b) => a + b, 0);
const wallMs = (profile.endTime - profile.startTime) / 1000;

const label = (node) => {
  const frame = node.callFrame;
  const name = frame.functionName || "(anonymous)";
  const resolved = originOf(frame);
  if (resolved !== null) return `${name} @ ${resolved}`;
  const url = frame.url.split("/").pop() ?? "";
  return `${name} @ ${url}:${frame.lineNumber + 1}`;
};

const rows = [...selfTicks.entries()]
  .filter(([, ticks]) => ticks > 0)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 30);

console.log(
  `main-thread profile: lanes=${LANES} window=${wallMs.toFixed(0)}ms samples=${totalTicks}`,
);
console.log("\nheaviest self time:");
for (const [id, ticks] of rows) {
  const share = ticks / totalTicks;
  console.log(
    `  ${(share * 100).toFixed(1).padStart(5)}%  ${label(byId.get(id))}`,
  );
}

// Roll self time up to the nearest named non-anonymous ancestor so that the
// large "(anonymous)"/"(garbage collector)" leaves get attributed to something
// actionable.
const parentOf = new Map();
for (const node of profile.nodes) {
  for (const child of node.children ?? []) parentOf.set(child, node.id);
}
const attributed = new Map();
for (const [id, ticks] of selfTicks) {
  if (ticks === 0) continue;
  let cursor = id;
  let depth = 0;
  while (cursor !== undefined && depth < 40) {
    const node = byId.get(cursor);
    const name = node?.callFrame.functionName ?? "";
    if (name !== "" && !name.startsWith("(")) break;
    cursor = parentOf.get(cursor);
    depth += 1;
  }
  const key = cursor === undefined ? "(root)" : label(byId.get(cursor));
  attributed.set(key, (attributed.get(key) ?? 0) + ticks);
}
console.log("\nself time rolled up to the nearest named frame:");
for (const [key, ticks] of [...attributed.entries()]
  .sort((a, b) => b[1] - a[1]).slice(0, 25)) {
  console.log(`  ${((ticks / totalTicks) * 100).toFixed(1).padStart(5)}%  ${key}`);
}
// Attribute every sample to the outermost named frame under the root, which is
// the task entry point: a rAF/draw callback, a React commit, or a message
// handler. This says what *drives* the work, not just where it lands.
const childOfRoot = new Map();
const rootId = profile.nodes[0]?.id;
for (const [id] of selfTicks) {
  let cursor = id;
  let chain = [];
  let depth = 0;
  while (cursor !== undefined && depth < 60) {
    chain.push(cursor);
    if (parentOf.get(cursor) === rootId || parentOf.get(cursor) === undefined) break;
    cursor = parentOf.get(cursor);
    depth += 1;
  }
  const named = chain.reverse().find((candidate) => {
    const name = byId.get(candidate)?.callFrame.functionName ?? "";
    return name !== "" && !name.startsWith("(");
  });
  childOfRoot.set(id, named ?? cursor);
}
const entryTicks = new Map();
for (const [id, ticks] of selfTicks) {
  if (ticks === 0) continue;
  const key = label(byId.get(childOfRoot.get(id)) ?? byId.get(id));
  entryTicks.set(key, (entryTicks.get(key) ?? 0) + ticks);
}
console.log("\nself time by task entry point:");
for (const [key, ticks] of [...entryTicks.entries()]
  .sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${((ticks / totalTicks) * 100).toFixed(1).padStart(5)}%  ${key}`);
}
await browser.close();
