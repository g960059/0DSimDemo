import type {
  OfficialExperimentRecipeV1,
  OfficialRecipeScenarioV1,
} from "@/studio/contracts/v2/content";
import {
  STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2,
  STUDIO_OFFICIAL_EXPERIMENT_RECIPE_V1_SCHEMA_ID,
} from "@/studio/contracts/v2/content";
import {
  assertPortableModelIdentifierV2,
  assertPortableStudioJsonObjectV2,
} from "@/studio/contracts/v2/model";
import { validateExperimentSurfaceV2 } from "./StudioExperimentDataV2";

export class StudioOfficialContentRecipeValidationErrorV1 extends Error {
  constructor(path: string, message: string) {
    super(`Studio official recipe rejected ${path}: ${message}`);
    this.name = "StudioOfficialContentRecipeValidationErrorV1";
  }
}

/**
 * Validates the model-independent source before a build binds it to one exact
 * modelId and Surface release. Mutable channels cannot enter this object.
 */
export function validateOfficialExperimentRecipeV1(
  value: unknown,
): OfficialExperimentRecipeV1 {
  assertPortableStudioJsonObjectV2(value, "$.recipe");
  const recipe = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  assertExactKeysV1(recipe, [
    "description",
    "modelFamilyId",
    "recipeId",
    "scenarios",
    "schemaId",
    "scientificAssertionIds",
    "surface",
    "title",
  ], "$.recipe");
  if (recipe.schemaId !== STUDIO_OFFICIAL_EXPERIMENT_RECIPE_V1_SCHEMA_ID) {
    throw recipeErrorV1("$.recipe.schemaId", "schema identity mismatch");
  }
  assertPortableModelIdentifierV2(recipe.recipeId, "$.recipe.recipeId");
  assertPortableModelIdentifierV2(
    recipe.modelFamilyId,
    "$.recipe.modelFamilyId",
  );
  const title = trimmedStringV1(recipe.title, "$.recipe.title", false);
  const description = trimmedStringV1(
    recipe.description,
    "$.recipe.description",
    true,
  );
  if (
    !Array.isArray(recipe.scenarios)
    || recipe.scenarios.length === 0
    || recipe.scenarios.length > STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2
  ) {
    throw recipeErrorV1(
      "$.recipe.scenarios",
      `must contain 1-${STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2} Scenarios`,
    );
  }
  const scenarioIds = new Set<string>();
  const scenarios = Object.freeze(recipe.scenarios.map((scenario, index) =>
    validateScenarioV1(scenario, index, scenarioIds)));
  const scientificAssertionIds = uniqueIdArrayV1(
    recipe.scientificAssertionIds,
    "$.recipe.scientificAssertionIds",
  );
  const surface = validateExperimentSurfaceV2(
    recipe.surface,
    scenarios.map(({ scenarioId }) => scenarioId),
  );
  return deepFreezeRecipeV1({
    schemaId: STUDIO_OFFICIAL_EXPERIMENT_RECIPE_V1_SCHEMA_ID,
    recipeId: recipe.recipeId,
    modelFamilyId: recipe.modelFamilyId,
    title,
    description,
    scenarios,
    surface,
    scientificAssertionIds,
  });
}

function validateScenarioV1(
  value: unknown,
  index: number,
  scenarioIds: Set<string>,
): OfficialRecipeScenarioV1 {
  const path = `$.recipe.scenarios[${index}]`;
  assertRecordV1(value, path);
  assertExactKeysV1(
    value,
    ["controlAssignments", "label", "scenarioId"],
    path,
  );
  assertPortableModelIdentifierV2(value.scenarioId, `${path}.scenarioId`);
  if (scenarioIds.has(value.scenarioId)) {
    throw recipeErrorV1(`${path}.scenarioId`, "must be unique");
  }
  scenarioIds.add(value.scenarioId);
  const label = trimmedStringV1(value.label, `${path}.label`, false);
  if (!Array.isArray(value.controlAssignments)) {
    throw recipeErrorV1(`${path}.controlAssignments`, "must be an array");
  }
  const controlIds = new Set<string>();
  const controlAssignments = Object.freeze(value.controlAssignments.map(
    (assignment, assignmentIndex) => {
      const assignmentPath = `${path}.controlAssignments[${assignmentIndex}]`;
      assertRecordV1(assignment, assignmentPath);
      assertExactKeysV1(assignment, ["controlId", "value"], assignmentPath);
      assertPortableModelIdentifierV2(
        assignment.controlId,
        `${assignmentPath}.controlId`,
      );
      if (controlIds.has(assignment.controlId)) {
        throw recipeErrorV1(
          `${assignmentPath}.controlId`,
          "must be unique within the Scenario",
        );
      }
      controlIds.add(assignment.controlId);
      if (
        typeof assignment.value !== "number"
        || !Number.isFinite(assignment.value)
        || Object.is(assignment.value, -0)
      ) {
        throw recipeErrorV1(
          `${assignmentPath}.value`,
          "must be a finite number and must not be negative zero",
        );
      }
      return Object.freeze({
        controlId: assignment.controlId,
        value: assignment.value,
      });
    },
  ));
  return Object.freeze({
    scenarioId: value.scenarioId,
    label,
    controlAssignments,
  });
}

function uniqueIdArrayV1(value: unknown, path: string): readonly string[] {
  if (!Array.isArray(value)) throw recipeErrorV1(path, "must be an array");
  const ids = new Set<string>();
  return Object.freeze(value.map((entry, index) => {
    assertPortableModelIdentifierV2(entry, `${path}[${index}]`);
    if (ids.has(entry)) throw recipeErrorV1(`${path}[${index}]`, "must be unique");
    ids.add(entry);
    return entry;
  }));
}

function trimmedStringV1(
  value: unknown,
  path: string,
  allowEmpty: boolean,
): string {
  if (
    typeof value !== "string"
    || value !== value.trim()
    || (!allowEmpty && value.length === 0)
    || value.length > 4_096
  ) {
    throw recipeErrorV1(path, "must be a trimmed string");
  }
  return value;
}

function assertRecordV1(
  value: unknown,
  path: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw recipeErrorV1(path, "must be an object");
  }
}

function assertExactKeysV1(
  value: unknown,
  expected: readonly string[],
  path: string,
): void {
  assertRecordV1(value, path);
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (
    actual.length !== sortedExpected.length
    || actual.some((key, index) => key !== sortedExpected[index])
  ) {
    throw recipeErrorV1(
      path,
      `keys must be exactly ${sortedExpected.join(", ")}`,
    );
  }
}

function recipeErrorV1(path: string, message: string): Error {
  return new StudioOfficialContentRecipeValidationErrorV1(path, message);
}

function deepFreezeRecipeV1<TValue>(value: TValue): TValue {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreezeRecipeV1(child);
    }
    Object.freeze(value);
  }
  return value;
}
