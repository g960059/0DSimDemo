import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  validateOfficialExperimentRecipeV1,
} from "@/studio/application/authoring/StudioOfficialContentRecipeV1";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== "--recipe" || args[1] === undefined) {
  throw new Error("Usage: --recipe <repo-relative.json>");
}
const absolutePath = path.resolve(repositoryRoot, args[1]);
const relativePath = path.relative(repositoryRoot, absolutePath);
if (
  relativePath.length === 0
  || relativePath.startsWith("..")
  || path.isAbsolute(relativePath)
) {
  throw new Error("Official recipe must be inside the repository");
}
const recipe = validateOfficialExperimentRecipeV1(
  JSON.parse(readFileSync(absolutePath, "utf8")),
);
process.stdout.write(
  `Official recipe verified: ${recipe.recipeId} `
    + `(${recipe.scenarios.length} Scenario${recipe.scenarios.length === 1 ? "" : "s"})\n`,
);
