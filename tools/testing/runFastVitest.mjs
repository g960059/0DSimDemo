import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const DEFAULT_FAST_SUITE_WALL_BUDGET_MS = 60_000;

const configuredBudget = Number(process.env.CIRCLEHEART_FAST_TEST_BUDGET_MS);
const budgetMs = Number.isFinite(configuredBudget) && configuredBudget > 0
  ? configuredBudget
  : DEFAULT_FAST_SUITE_WALL_BUDGET_MS;
const startedAt = Date.now();
const vitestEntry = path.resolve("node_modules/vitest/vitest.mjs");
const child = spawn(
  process.execPath,
  [vitestEntry, "run", "--config", "vitest.fast.config.ts", ...process.argv.slice(2)],
  { stdio: "inherit", env: process.env },
);

let exceededBudget = false;
const timer = setTimeout(() => {
  exceededBudget = true;
  console.error(`\nFast suite exceeded its ${(budgetMs / 1000).toFixed(0)} s wall-clock budget.`);
  child.kill("SIGTERM");
}, budgetMs);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", (error) => {
  clearTimeout(timer);
  console.error(`Unable to start Vitest: ${error.message}`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  clearTimeout(timer);
  const elapsedSeconds = (Date.now() - startedAt) / 1000;

  if (exceededBudget) {
    process.exitCode = 124;
    return;
  }

  if (signal) {
    console.error(`Fast suite terminated by ${signal} after ${elapsedSeconds.toFixed(2)} s.`);
    process.exitCode = 1;
    return;
  }

  if (code === 0) {
    console.log(`Fast suite completed in ${elapsedSeconds.toFixed(2)} s (budget ${(budgetMs / 1000).toFixed(0)} s).`);
  }
  process.exitCode = code ?? 1;
});
