import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const trackedPaths = execFileSync(
  "git",
  ["ls-files"],
  { cwd: repositoryRoot, encoding: "utf8" },
)
  .split("\n")
  .filter(Boolean);

const forbiddenExactPaths = new Set([
  "logs.txt",
  "mv_out.txt",
  "test_blocknote.ts",
  "test_blocknote_esm.mjs",
]);
const forbiddenPrefixes = [
  "migrated_prompt_history/",
  "tools/sweeps/",
];
const requiredTrackedPaths = [
  "studio/adapters/mainWire/MainWireBrowserWorkerSessionHostV1.ts",
  "studio/adapters/mainWire/MainWireSimulationRuntimeAdapterV1.ts",
  "studio/adapters/mainWire/MainWireStudioSessionHostV1.ts",
  "studio/adapters/mainWire/MainWireStudioSnapshotEnvelopeV1.ts",
  "studio/adapters/mainWire/MainWireStudioTargetResolverV1.ts",
  "studio/adapters/mainWire/index.ts",
  "studio/application/runtime/SimulationSessionCoordinatorV1.ts",
  "studio/infrastructure/artifacts/InMemoryContentAddressedArtifactStoreV1.ts",
  "studio/infrastructure/artifacts/studioCanonicalJsonV1.ts",
];

const failures = [];
const trackedPathSet = new Set(trackedPaths);
for (const requiredPath of requiredTrackedPaths) {
  if (!trackedPathSet.has(requiredPath)) {
    failures.push(
      `${requiredPath}: required Studio foundation source is not tracked`,
    );
  }
}

for (const trackedPath of trackedPaths) {
  if (!existsSync(path.join(repositoryRoot, trackedPath))) continue;
  if (
    forbiddenExactPaths.has(trackedPath)
    || forbiddenPrefixes.some((prefix) => trackedPath.startsWith(prefix))
  ) {
    failures.push(
      `${trackedPath}: historical scratch output belongs in Git history, not the working tree`,
    );
  }
}

const studioIndexPath = path.join(repositoryRoot, "docs/studio/README.md");
const studioIndex = readFileSync(studioIndexPath, "utf8");
for (const trackedPath of trackedPaths) {
  if (
    !existsSync(path.join(repositoryRoot, trackedPath))
    || !trackedPath.startsWith("docs/studio/")
    || !trackedPath.endsWith(".md")
    || trackedPath === "docs/studio/README.md"
  ) {
    continue;
  }
  const relativePath = trackedPath.slice("docs/studio/".length);
  if (!studioIndex.includes(`(${relativePath})`)) {
    failures.push(
      `${trackedPath}: every Studio document must be classified in docs/studio/README.md`,
    );
  }
}

if (failures.length > 0) {
  console.error("Repository hygiene check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `Repository hygiene check passed (${trackedPaths.length} tracked paths).`,
  );
}
