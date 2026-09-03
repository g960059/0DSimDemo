import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";

import {
  runMainWireStandard70BaselineLocalRecoveryV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineLocalRecoveryV1";

const { values } = parseArgs({ options: {
  coarse: { type: "string" }, refined: { type: "string" },
  attribution: { type: "string" }, stage: { type: "string" },
  tbv: { type: "string" }, active: { type: "string" },
  output: { type: "string" }, help: { type: "boolean" },
} });
if (values.help) {
  process.stdout.write(
    "Usage: npm run recover:scientific:main-wire-baseline-local-v1 -- "
    + "--coarse FILE --refined FILE --attribution FILE --stage FILE "
    + "--tbv ML --active SCALE [--output NEW_FILE]\n"
    + "Synthetic one-step control only; no baseline adoption or model mint. "
    + "Requires a clean worktree. Output files are never overwritten.\n",
  );
  process.exit(0);
}
function requiredV1(name: keyof typeof values): string {
  const value = values[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`--${name} is required`);
  }
  return value;
}
const paths = ["coarse", "refined", "attribution", "stage"] as const;
const inputPaths = paths.map(requiredV1);
const syntheticTruthValues = [
  Number(requiredV1("tbv")), Number(requiredV1("active")),
] as const;
if (values.output !== undefined && existsSync(values.output)) {
  throw new Error("local recovery output already exists; choose a new file");
}
if (execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()) {
  throw new Error("local recovery requires a clean worktree for execution provenance");
}
const executionCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const [coarseArtifact, refinedArtifact, perturbationAttributionArtifact, stageArtifact] =
  await Promise.all(inputPaths.map(async (path) => JSON.parse(await readFile(path, "utf8")) as unknown));
const startedAt = performance.now();
const result = await runMainWireStandard70BaselineLocalRecoveryV1({
  referenceId: "baseline",
  sourceArtifacts: { coarseArtifact, refinedArtifact,
    perturbationAttributionArtifact, stageArtifact },
  syntheticTruthValues,
}, (phase) => process.stderr.write(`[baseline local recovery] ${phase}\n`));
const artifact = { executionCommit, wallTimeMs: performance.now() - startedAt, result };
const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
if (values.output === undefined) {
  process.stdout.write(serialized);
} else {
  await writeFile(values.output, serialized, { encoding: "utf8", flag: "wx" });
  process.stdout.write(`${values.output}\n`);
}
if (result.status !== "replayed") process.exitCode = 1;
