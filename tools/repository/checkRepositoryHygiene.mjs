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
  "engine/myocardium/MainWireIntegratedModelAnalysisContractV3.ts",
  "engine/myocardium/MainWireIntegratedModelGuytonStarlingOrientationV3.ts",
  "engine/myocardium/MainWireIntegratedModelResponsiveStarlingProtocolV3.ts",
  "tools/verifyBaseline.ts",
]);
const forbiddenPathRules = [
  {
    pattern: /^components\/[^/]+Page\.tsx$/,
    message: "route pages must live in a product-area directory",
  },
  {
    pattern:
      /^studio\/integrations\/mainWireIntegratedV3\/model-surface-workbench-v[12]\.json$/,
    message: "superseded pre-analysis Surfaces belong in Git history",
  },
  {
    pattern:
      /^studio\/infrastructure\/browser\/StudioBrowser(?:ContentStore|ExperimentIndex)V3\.ts$/,
    message: "current browser implementations must not carry product-generation names",
  },
  {
    pattern:
      /^(?:caseDoc|caseValidation|rawParameterCatalog|readingConversion|firebaseSetup|test_blocknote)\.ts$/,
    message: "retired root utilities belong in Git history",
  },
  {
    pattern:
      /^(?:firebase-applet-config|firebase-blueprint)\.json$|^(?:firestore\.rules|logs\.txt|mv_out\.txt|playwright\.e2e\.config\.ts|test_blocknote_esm\.mjs|vitest\.(?:archive|heavy|research)\.config\.ts)$/,
    message: "retired configuration or scratch output belongs in Git history",
  },
];
const forbiddenPrefixes = [
  "migrated_prompt_history/",
  "tools/sweeps/",
  "data/mechanics2/",
  "data/myocardium/protocols/",
  "docs/mechanics2/",
  "engine/myocardium/homogenization/",
  "engine/myocardium/kinematics/",
  "engine/myocardium/protocols/",
  "engine/myocardium/state/",
  "engine/myocardium/analysis/",
  "engine/diagnostics/morphology/",
  "engine/mechanics2/",
  "engine/verification/",
  "studio/adapters/mainWire/",
  "studio/application/content/",
  "studio/analysis/",
  "studio/contracts/v1/",
  "studio/infrastructure/json/",
  "studio/infrastructure/artifacts/",
  "tools/mechanics2/",
];
// These are architectural anchors, not a catalog of current implementation
// files. IDs, formulas, releases, and worker mechanics remain discoverable
// from their owning source and tests.
const requiredBoundaryPaths = [
  "analysis/contracts/AnalysisExecutionV1.ts",
  "analysis/contracts/AnalysisMethodRegistryV1.ts",
  "analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1.ts",
  "analysis/registry/RegisteredAnalysisMethodsV1.ts",
  "components/article/ArticleEditorPage.tsx",
  "components/article/ArticleEditorPolicy.ts",
  "components/workbench/WorkbenchPage.tsx",
  "components/workbench/WorkbenchSession.tsx",
  "domain/json/CanonicalJson.ts",
  "studio/application/modelSurface/ModelSurfacePresentationBundleV1.ts",
  "studio/contracts/v2/simulation.ts",
  "studio/infrastructure/browser/BrowserContentStore.ts",
  "studio/infrastructure/browser/BrowserExperimentIndex.ts",
  "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.ts",
  "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.artifact.mjs",
  "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.client.json",
  "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelIdentityV1.ts",
  "studio/integrations/mainWireIntegratedV3/model-surface-workbench-analysis-v1.json",
  "studio/integrations/mainWireIntegratedV3/standard-registry-admission-lock.json",
  "studio/workers/StudioSimulationWorkerProtocolV2.ts",
  "tools/registry/verifyMainWireIntegratedStudioModelV3.ts",
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
  {
    pattern: /\bmodel-core-compatible-fixed32\b/,
    message: "the admitted inverse policy must not be named after retired ModelCore",
  },
  {
    pattern: /\bStudioBrowser(?:ContentStore|ExperimentIndex)V3\b/,
    message: "current browser implementations must not regain product-generation names",
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
    appliesTo: (trackedPath) => trackedPath.startsWith("analysis/contracts/"),
    pattern:
      /(?:from\s*|import\s*\()\s*["'](?:@\/(?:analysis\/methods|components|engine|runtime|server|supabase)\/|@\/studio\/(?:application|analysis|composition|infrastructure|integrations|presentation|workers)\/|(?:\.\.\/)+(?:methods|components|engine|runtime|server|supabase|application|analysis|composition|infrastructure|integrations|presentation|workers)\/)/,
    message: "generic analysis contracts must not depend on model families or implementations",
  },
  {
    appliesTo: (trackedPath) =>
      trackedPath.startsWith("analysis/methods/")
      || trackedPath.startsWith("analysis/registry/")
      || trackedPath.startsWith("analysis/runtime/"),
    pattern:
      /(?:from\s*|import\s*\()\s*["'](?:@\/components\/|@\/studio\/(?:application|composition|infrastructure|integrations|presentation|workers)\/|@\/(?:server|supabase)\/|(?:\.\.\/)+(?:application|composition|infrastructure|integrations|presentation|workers|components|server|supabase)\/)/,
    message: "analysis code must not depend on UI or concrete infrastructure",
  },
  {
    appliesTo: (trackedPath) =>
      trackedPath.startsWith("studio/infrastructure/model/"),
    pattern:
      /(?:from\s*|import\s*\()\s*["'](?:@\/analysis\/methods\/|@\/studio\/integrations\/)/,
    message: "generic model infrastructure must resolve registries instead of importing a model family",
  },
  {
    appliesTo: (trackedPath) => trackedPath.startsWith("domain/"),
    pattern:
      /(?:from\s*|import\s*\()\s*["'](?:@\/(?:analysis|components|engine|runtime|server|studio|supabase)\/|(?:\.\.\/)+(?:analysis|components|engine|runtime|server|studio|supabase)\/)/,
    message: "domain primitives must not depend on model, application, UI, or infrastructure",
  },
  {
    appliesTo: (trackedPath) => trackedPath.startsWith("studio/application/"),
    pattern:
      /(?:from\s*|import\s*\()\s*["'](?:@\/components\/|@\/studio\/(?:infrastructure|integrations|presentation)\/|@\/(?:server|supabase)\/|(?:\.\.\/)+(?:components|infrastructure|integrations|presentation|server|supabase)\/)/,
    message: "Studio application code must depend on ports, not concrete infrastructure or UI",
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
  if (
    forbiddenExactPaths.has(trackedPath)
    || forbiddenPrefixes.some((prefix) => trackedPath.startsWith(prefix))
  ) {
    failures.push(
      `${trackedPath}: historical scratch output belongs in Git history, not the working tree`,
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
