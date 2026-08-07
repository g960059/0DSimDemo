import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  prepareStudioOfficialExperimentBuildPlanV1,
} from "@/studio/application/authoring/StudioOfficialContentBuildPlanV1";
import {
  validateOfficialExperimentRecipeV1,
} from "@/studio/application/authoring/StudioOfficialContentRecipeV1";
import type {
  StudioScientificAssertionRegistryV1,
} from "@/studio/application/authoring/StudioScientificAssertionRegistryV1";
import {
  mainWireIntegratedOfficialScientificAssertionRegistryV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedOfficialContentAssertionsV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelIdentityV3";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const options = parseArgumentsV1(process.argv.slice(2));
const recipeValue = readRepositoryJsonV1(options.recipePath, "Official recipe");
const recipe = validateOfficialExperimentRecipeV1(recipeValue);
const plan = prepareStudioOfficialExperimentBuildPlanV1({
  recipe,
  kernel: readRepositoryJsonV1(options.kernelPath, "Exact kernel manifest"),
  surfaceRelease: readRepositoryJsonV1(
    options.surfacePath,
    "Model Surface manifest",
  ),
  assertionRegistry: assertionRegistryV1(recipe.modelFamilyId),
});

process.stdout.write(
  `Official build dependencies resolved: ${plan.recipe.recipeId}\n`
    + `  exact model: ${plan.modelId}\n`
    + `  Surface: ${plan.surfaceReleaseId}\n`
    + `  assertions: ${plan.assertionIds.length}\n`,
);

type OptionsV1 = Readonly<{
  recipePath: string;
  kernelPath: string;
  surfacePath: string;
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
      || (flag !== "--recipe" && flag !== "--kernel" && flag !== "--surface")
    ) {
      throw usageErrorV1();
    }
    values.set(flag, value);
  }
  const recipePath = values.get("--recipe");
  const kernelPath = values.get("--kernel");
  const surfacePath = values.get("--surface");
  if (
    recipePath === undefined
    || kernelPath === undefined
    || surfacePath === undefined
  ) {
    throw usageErrorV1();
  }
  return Object.freeze({ recipePath, kernelPath, surfacePath });
}

function usageErrorV1(): Error {
  return new Error(
    "Usage: --recipe <repo-relative.json> --kernel <repo-relative.json> "
      + "--surface <repo-relative.json>",
  );
}

function readRepositoryJsonV1(inputPath: string, label: string): unknown {
  const absolutePath = path.resolve(repositoryRoot, inputPath);
  const relativePath = path.relative(repositoryRoot, absolutePath);
  if (
    relativePath.length === 0
    || relativePath.startsWith("..")
    || path.isAbsolute(relativePath)
  ) {
    throw new Error(`${label} must be inside the repository`);
  }
  return JSON.parse(readFileSync(absolutePath, "utf8"));
}

function assertionRegistryV1(
  modelFamilyId: string,
): StudioScientificAssertionRegistryV1 {
  if (modelFamilyId === MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3) {
    return mainWireIntegratedOfficialScientificAssertionRegistryV1;
  }
  throw new Error(
    `No official scientific assertion registry is registered for ${modelFamilyId}`,
  );
}
