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
  "engine/ModelCore.ts",
]);
const forbiddenPathRules = [
  {
    pattern: /^components\/[^/]+Page\.tsx$/,
    message: "route pages must live in a product-area directory",
  },
  {
    pattern: /^components\/article\/ArticleEditor(?:Page|Policy|BlocksV3|ChromeV3|RichBlocksV3|UtilitiesV3)\.(?:ts|tsx)$/,
    message: "Article editor implementation belongs in its feature directory",
  },
];
// These are architectural anchors, not a catalog of current implementation
// files. IDs, formulas, releases, and worker mechanics remain discoverable
// from their owning source and tests.
const requiredBoundaryPaths = [
  "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.artifact.mjs",
  "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.client.json",
  "studio/integrations/mainWireIntegratedV3/model-surface-workbench-analysis-v1.json",
  "studio/integrations/mainWireIntegratedV3/standard-registry-admission-lock.json",
  "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1.artifact.mjs",
  "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1.client.json",
  "studio/integrations/mainWireIntegratedV3/model-surface-selected-aortic-outflow-standard66-v1.json",
  "studio/integrations/mainWireIntegratedV3/selected-aortic-outflow-standard66-registry-admission-lock.json",
];
const portableTextExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);
const sourceExtensions = new Set([".js", ".mjs", ".ts", ".tsx"]);
const forbiddenSourcePatterns = [
  {
    pattern: /(?:from\s*|import\s*\()\s*["'][^"']*engine\/ModelCore(?:\.ts)?["']/,
    message: "the retired ModelCore runtime must not regain an importer",
  },
];
const architectureImportRules = [
  {
    appliesTo: (trackedPath) =>
      trackedPath.startsWith("engine/") || trackedPath.startsWith("runtime/"),
    pattern:
      /(?:from\s*|import\s*\()\s*["'](?:@\/|(?:\.\.\/)+)(?:components|studio|server|supabase)\//,
    message: "exact numerics and runtime must not depend on UI, Studio, or infrastructure",
  },
  {
    appliesTo: (trackedPath) => trackedPath.startsWith("studio/contracts/"),
    pattern:
      /(?:from\s*|import\s*\()\s*["'](?:@\/components\/|@\/studio\/(?:application|analysis|composition|infrastructure|integrations|presentation|workers)\/|@\/(?:server|supabase)\/|(?:\.\.\/)+(?:application|analysis|composition|infrastructure|integrations|presentation|workers)\/)/,
    message: "portable contracts must not depend on implementations",
  },
  {
    appliesTo: (trackedPath) =>
      trackedPath.startsWith("analysis/registry/"),
    pattern:
      /(?:from\s*|import\s*\()\s*["'](?:@\/components\/|@\/studio\/(?:application|composition|infrastructure|integrations|presentation|workers)\/|@\/(?:server|supabase)\/|(?:\.\.\/)+(?:application|composition|infrastructure|integrations|presentation|workers|components|server|supabase)\/)/,
    message: "analysis code must not depend on UI or concrete infrastructure",
  },
  {
    appliesTo: (trackedPath) =>
      trackedPath === "components/article/editor/ArticleEditorPolicy.ts",
    pattern:
      /(?:from\s*|import\s*\()\s*["'](?:@\/studio\/infrastructure\/|@\/(?:server|supabase)\/)/,
    message: "Article editor policy must depend on a repository port, not concrete infrastructure",
  },
  {
    appliesTo: (trackedPath) =>
      trackedPath.startsWith("components/workbench/")
      || trackedPath.startsWith("components/article/reader/"),
    pattern:
      /(?:from\s*|import\s*\()\s*["']@\/studio\/integrations\//,
    message: "model-facing presentation must consume the resolved client composition",
  },
  {
    appliesTo: (trackedPath) => trackedPath.startsWith("studio/registry/"),
    pattern:
      /(?:from\s*|import\s*\()\s*["'](?:@\/components\/|@\/studio\/infrastructure\/|@\/(?:server|supabase)\/)/,
    message: "code registries must not depend on UI or concrete infrastructure",
  },
];
const machineLocalPathPatterns = [
  /\/Users\/[^/]+\//,
  /\/home\/[^/]+\//,
  /[A-Za-z]:\\Users\\[^\\]+\\/,
];

const failures = [];
const trackedPathSet = new Set(trackedPaths);
for (const requiredPath of requiredBoundaryPaths) {
  if (!trackedPathSet.has(requiredPath)) {
    failures.push(
      `${requiredPath}: required Studio foundation source is not tracked`,
    );
  }
}

for (const trackedPath of trackedPaths) {
  const absolutePath = path.join(repositoryRoot, trackedPath);
  if (!existsSync(absolutePath)) continue;
  if (forbiddenExactPaths.has(trackedPath)) {
    failures.push(
      `${trackedPath}: the retired ModelCore runtime belongs in Git history`,
    );
  }
  const forbiddenPathRule = forbiddenPathRules.find(({ pattern }) =>
    pattern.test(trackedPath));
  if (forbiddenPathRule !== undefined) {
    failures.push(`${trackedPath}: ${forbiddenPathRule.message}`);
  }
  if (portableTextExtensions.has(path.extname(trackedPath))) {
    const text = readFileSync(absolutePath, "utf8");
    if (machineLocalPathPatterns.some((pattern) => pattern.test(text))) {
      failures.push(
        `${trackedPath}: tracked portable content must not contain a machine-local absolute path`,
      );
    }
    if (
      trackedPath !== "tools/repository/checkRepositoryHygiene.mjs"
      && sourceExtensions.has(path.extname(trackedPath))
    ) {
      for (const { pattern, message } of forbiddenSourcePatterns) {
        if (pattern.test(text)) failures.push(`${trackedPath}: ${message}`);
      }
      for (const { appliesTo, pattern, message } of architectureImportRules) {
        if (appliesTo(trackedPath) && pattern.test(text)) {
          failures.push(`${trackedPath}: ${message}`);
        }
      }
    }
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
