import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalJsonStringify } from "@/engine/integrity";
import {
  validateOfficialExperimentRecipeV1,
} from "@/studio/application/authoring/StudioOfficialContentRecipeV1";
import {
  buildMainWireOfficialExperimentV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedOfficialContentRunnerV1";
import {
  createCircleHeartExactModelReleaseV1,
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1";
import mainWireIntegratedStandardSurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-standard-v1.json";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const options = parseArgumentsV1(process.argv.slice(2));
const recipe = validateOfficialExperimentRecipeV1(
  readRepositoryJsonV1(options.recipePath, "Official recipe"),
);

process.stdout.write(
  `Building ${recipe.recipeId} against the Standard exact-model ABI…\n`,
);
const result = await buildMainWireOfficialExperimentV1({
  recipe,
  exactRelease: createCircleHeartExactModelReleaseV1(),
  surfaceRelease: mainWireIntegratedStandardSurfaceV1,
  defaultFixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
  createdAt: options.createdAt,
});
const outputPath = repositoryPathV1(options.outputPath, "Build output");
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${canonicalJsonStringify(result)}\n`, "utf8");

process.stdout.write(
  `Official Experiment built: ${result.snapshot.snapshotId}\n`
    + `  Scenarios: ${result.scenarioRuns.length}\n`
    + `  Assertions: ${result.assertionGate.reports.length} passed\n`
    + `  Output: ${path.relative(repositoryRoot, outputPath)}\n`,
);

type OptionsV1 = Readonly<{
  recipePath: string;
  outputPath: string;
  createdAt: string;
}>;

function parseArgumentsV1(args: readonly string[]): OptionsV1 {
  if (args.length !== 6) throw usageErrorV1();
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (
      flag === undefined
      || value === undefined
      || values.has(flag)
      || !["--recipe", "--output", "--created-at"].includes(flag)
    ) {
      throw usageErrorV1();
    }
    values.set(flag, value);
  }
  const recipePath = values.get("--recipe");
  const outputPath = values.get("--output");
  const createdAt = values.get("--created-at");
  if (
    recipePath === undefined
    || outputPath === undefined
    || createdAt === undefined
    || Number.isNaN(Date.parse(createdAt))
    || new Date(createdAt).toISOString() !== createdAt
  ) {
    throw usageErrorV1();
  }
  return Object.freeze({ recipePath, outputPath, createdAt });
}

function usageErrorV1(): Error {
  return new Error(
    "Usage: --recipe <repo-relative.json> --output <repo-relative.json> "
      + "--created-at <ISO-8601>",
  );
}

function readRepositoryJsonV1(inputPath: string, label: string): unknown {
  return JSON.parse(readFileSync(repositoryPathV1(inputPath, label), "utf8"));
}

function repositoryPathV1(inputPath: string, label: string): string {
  const absolutePath = path.resolve(repositoryRoot, inputPath);
  const relativePath = path.relative(repositoryRoot, absolutePath);
  if (
    relativePath.length === 0
    || relativePath.startsWith("..")
    || path.isAbsolute(relativePath)
  ) {
    throw new Error(`${label} must be inside the repository`);
  }
  return absolutePath;
}
