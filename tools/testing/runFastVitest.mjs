import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const DEFAULT_FAST_SUITE_WALL_BUDGET_MS = 60_000;
const suiteLabel = process.env.CIRCLEHEART_TEST_SUITE_LABEL || "Fast suite";
const configFile = process.env.CIRCLEHEART_VITEST_CONFIG || "vitest.fast.config.ts";

const configuredBudget = Number(process.env.CIRCLEHEART_FAST_TEST_BUDGET_MS);
const budgetMs = Number.isFinite(configuredBudget) && configuredBudget > 0
  ? configuredBudget
  : DEFAULT_FAST_SUITE_WALL_BUDGET_MS;
const startedAt = Date.now();
const vitestEntry = path.resolve("node_modules/vitest/vitest.mjs");
const usesProcessGroup = process.platform !== "win32";
const child = spawn(
  process.execPath,
  [vitestEntry, "run", "--config", configFile, ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: process.env,
    // Vitest fans out into worker processes. A dedicated process group lets a
    // wall-budget timeout terminate the complete worker tree instead of
    // leaving CPU-consuming orphans behind.
    detached: usesProcessGroup,
  },
);

let exceededBudget = false;
let escalationTimer;

const terminateChildTree = (signal) => {
  if (!child.pid) return;

  try {
    if (usesProcessGroup) {
      process.kill(-child.pid, signal);
    } else {
      child.kill(signal);
    }
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }
};

const timer = setTimeout(() => {
  exceededBudget = true;
  console.error(`\n${suiteLabel} exceeded its ${(budgetMs / 1000).toFixed(0)} s wall-clock budget.`);
  terminateChildTree("SIGTERM");
  escalationTimer = setTimeout(() => terminateChildTree("SIGKILL"), 2_000);
  escalationTimer.unref();
}, budgetMs);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => terminateChildTree(signal));
}

child.on("error", (error) => {
  clearTimeout(timer);
  console.error(`Unable to start Vitest: ${error.message}`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  clearTimeout(timer);
  clearTimeout(escalationTimer);
  const elapsedSeconds = (Date.now() - startedAt) / 1000;

  if (exceededBudget) {
    process.exitCode = 124;
    return;
  }

  if (signal) {
    console.error(`${suiteLabel} terminated by ${signal} after ${elapsedSeconds.toFixed(2)} s.`);
    process.exitCode = 1;
    return;
  }

  if (code === 0) {
    console.log(`${suiteLabel} completed in ${elapsedSeconds.toFixed(2)} s (budget ${(budgetMs / 1000).toFixed(0)} s).`);
  }
  process.exitCode = code ?? 1;
});
