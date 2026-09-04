import { strict as assert } from "node:assert";
import { execFileSync, spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: { request: { type: "string" }, output: { type: "string" } } });
if (!values.request || !values.output) throw new Error("--request FILE --output NEW_DIRECTORY");
if (execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()) throw new Error("benchmark requires a clean committed worktree");
const executionCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const output = resolve(values.output);
await mkdir(output);
await writeFile(resolve(output, "request.json"), await readFile(values.request), { flag: "wx" });
const order = ["full-invariant", "hot-path-lean", "hot-path-lean", "full-invariant"];
await writeFile(resolve(output, "protocol.json"), JSON.stringify({ executionCommit, order,
  comparison: "deep equality of entire evaluation excluding wallTimeMs", performanceIsMachineLocalAndNonGating: true }, null, 2), { flag: "wx" });
let reference;
const runs = [];
for (const [index, tier] of order.entries()) {
  const resultPath = resolve(output, `${index}-${tier}.json`);
  const startedAt = performance.now();
  await new Promise((done, fail) => {
    const child = spawn(process.execPath, ["node_modules/vite-node/vite-node.mjs", "--script",
      "tools/scientific/runMainWireBaselineOperatingPointDesignV1.ts", "--worker", resolve(output, "request.json"),
      "--output", resultPath, "--integrity-tier", tier], {
      env: { ...process.env, CIRCLEHEART_HOT_PATH_INTEGRITY: tier, VITE_CIRCLEHEART_HOT_PATH_INTEGRITY: tier },
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (data) => { stderr += String(data); });
    child.on("error", fail);
    child.on("exit", (code) => code === 0 && stderr.includes(`[execution-tier] ${tier}\n`)
      ? done() : fail(new Error(`tier execution failed: ${stderr}`)));
  });
  const wallTimeMs = performance.now() - startedAt;
  const evaluation = JSON.parse(await readFile(resultPath, "utf8"));
  assert.equal(evaluation.status, "accepted");
  const { wallTimeMs: evaluationWallTimeMs, ...science } = evaluation;
  reference ??= science;
  assert.deepEqual(science, reference, `execution tier changed scientific evidence in run ${index}`);
  runs.push({ index, tier, wallTimeMs, evaluationWallTimeMs, scientificEvidenceExactlyEqual: true });
  process.stderr.write(`[tier-benchmark] ${tier}: ${(wallTimeMs / 1000).toFixed(2)} s\n`);
}
const mean = (tier) => runs.filter((r) => r.tier === tier).reduce((s, r) => s + r.wallTimeMs, 0) / 2;
const result = { executionCommit, runs, fullToLeanWallTimeRatio: mean("full-invariant") / mean("hot-path-lean"),
  scientificEvidenceExactlyEqual: true, performanceIsMachineLocalAndNonGating: true };
await writeFile(resolve(output, "result.json"), JSON.stringify(result, null, 2), { flag: "wx" });
process.stdout.write(`${output}/result.json\n`);
