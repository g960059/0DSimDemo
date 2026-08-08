import type {
  OfficialExperimentRecipeV1,
} from "@/studio/contracts/v2/content";
import type {
  ExactModelKernelManifestV3,
  ModelSurfaceReleaseManifestV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  composeStandardModelContractV1,
} from "@/studio/contracts/v2/modelSurface";
import type {
  StudioScientificAssertionReportV1,
  StudioScientificScenarioEvidenceV1,
  StudioScientificAssertionV1,
} from "@/studio/contracts/v2/scientificAssertion";
import {
  validateStudioScientificAssertionReportV1,
  validateStudioScientificScenarioEvidenceSetV1,
} from "@/studio/contracts/v2/scientificAssertion";
import { studioNumericControlValueIssueV2 } from "@/studio/contracts/v2/control";
import {
  validateExperimentDesiredContentForModelV2,
} from "./StudioExperimentDataV2";
import {
  validateOfficialExperimentRecipeV1,
} from "./StudioOfficialContentRecipeV1";
import type {
  StudioScientificAssertionRegistryV1,
} from "./StudioScientificAssertionRegistryV1";

export type StudioOfficialExperimentBuildPlanV1 = Readonly<{
  recipe: OfficialExperimentRecipeV1;
  modelId: string;
  surfaceReleaseId: string;
  assertionIds: readonly string[];
}>;

export type StudioOfficialExperimentAssertionGateV1 = Readonly<{
  recipeId: string;
  modelId: string;
  surfaceReleaseId: string;
  status: "passed" | "rejected";
  reports: readonly StudioScientificAssertionReportV1[];
}>;

/**
 * Resolves every immutable source dependency before expensive settlement or
 * Snapshot work starts. This is deliberately a Standard-ABI-only boundary;
 * the legacy package manifest cannot be passed to it.
 */
export function prepareStudioOfficialExperimentBuildPlanV1(input: Readonly<{
  recipe: unknown;
  kernel: ExactModelKernelManifestV3 | unknown;
  surfaceRelease: ModelSurfaceReleaseManifestV1 | unknown;
  assertionRegistry: StudioScientificAssertionRegistryV1;
  studioCapabilities?: readonly string[];
}>): StudioOfficialExperimentBuildPlanV1 {
  const recipe = validateOfficialExperimentRecipeV1(input.recipe);
  const composed = composeStandardModelContractV1(
    input.kernel,
    input.surfaceRelease,
    input.studioCapabilities ?? Object.freeze([]),
  );
  if (recipe.modelFamilyId !== composed.contract.modelFamilyId) {
    throw new Error(
      `Official recipe ${recipe.recipeId} targets ${recipe.modelFamilyId}, `
        + `not ${composed.contract.modelFamilyId}`,
    );
  }

  // Reuse the ordinary authored-Surface validator. Fixtures are intentionally
  // empty here: the build target supplies and validates its registered default
  // fixture only after this dependency gate succeeds.
  validateExperimentDesiredContentForModelV2({
    modelId: composed.contract.modelId,
    scenarios: recipe.scenarios.map((scenario) => ({
      scenarioId: scenario.scenarioId,
      label: scenario.label,
      fixture: {},
    })),
    surface: recipe.surface,
  }, composed.contract);

  const controls = new Map(
    composed.contract.controlCatalog.map((control) => [
      control.controlId,
      control,
    ] as const),
  );
  recipe.scenarios.forEach((scenario, scenarioIndex) => {
    scenario.controlAssignments.forEach((assignment, assignmentIndex) => {
      const control = controls.get(assignment.controlId);
      const path = `$.recipe.scenarios[${scenarioIndex}]`
        + `.controlAssignments[${assignmentIndex}]`;
      if (control === undefined) {
        throw new Error(
          `${path}.controlId is unavailable in Surface `
            + composed.surface.surfaceReleaseId,
        );
      }
      const issue = studioNumericControlValueIssueV2(
        assignment.value,
        control,
      );
      if (issue !== undefined) {
        throw new Error(`${path}.value ${issue}`);
      }
    });
  });
  const assertions: readonly StudioScientificAssertionV1[] =
    input.assertionRegistry.resolveRecipe(
      recipe.scientificAssertionIds,
      recipe.modelFamilyId,
      recipe.scenarios.map(({ scenarioId }) => scenarioId),
    );
  return Object.freeze({
    recipe,
    modelId: composed.contract.modelId,
    surfaceReleaseId: composed.surface.surfaceReleaseId,
    assertionIds: Object.freeze(assertions.map(({ assertionId }) => assertionId)),
  });
}

/**
 * Executes the recipe's complete claim set against owned model evidence.
 * Snapshot admission and artifact emission may proceed only for `passed`.
 */
export function evaluateStudioOfficialExperimentAssertionsV1(input: Readonly<{
  plan: StudioOfficialExperimentBuildPlanV1;
  assertionRegistry: StudioScientificAssertionRegistryV1;
  scenarios: readonly StudioScientificScenarioEvidenceV1[] | unknown;
}>): StudioOfficialExperimentAssertionGateV1 {
  const scenarios = validateStudioScientificScenarioEvidenceSetV1(
    input.scenarios,
    input.plan.recipe.scenarios.map(({ scenarioId }) => scenarioId),
  );
  const reports = Object.freeze(input.plan.assertionIds.map((assertionId) => {
    const assertion = input.assertionRegistry.resolve(
      assertionId,
      input.plan.recipe.modelFamilyId,
    );
    return validateStudioScientificAssertionReportV1(
      assertion.evaluate({ recipe: input.plan.recipe, scenarios }),
      assertionId,
    );
  }));
  return Object.freeze({
    recipeId: input.plan.recipe.recipeId,
    modelId: input.plan.modelId,
    surfaceReleaseId: input.plan.surfaceReleaseId,
    status: reports.every(({ status }) => status === "passed")
      ? "passed" as const
      : "rejected" as const,
    reports,
  });
}
