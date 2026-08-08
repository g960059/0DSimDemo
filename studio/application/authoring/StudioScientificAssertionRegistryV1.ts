import type {
  StudioScientificAssertionV1,
} from "@/studio/contracts/v2/scientificAssertion";
import { assertPortableModelIdentifierV2 } from "@/studio/contracts/v2/model";

export class StudioScientificAssertionRegistryErrorV1 extends Error {
  constructor(message: string) {
    super(`Studio scientific assertion registry rejected: ${message}`);
    this.name = "StudioScientificAssertionRegistryErrorV1";
  }
}

/** Immutable registry. Released assertion IDs cannot be rebound or omitted. */
export class StudioScientificAssertionRegistryV1 {
  readonly #byId: ReadonlyMap<string, StudioScientificAssertionV1>;

  constructor(assertions: readonly StudioScientificAssertionV1[]) {
    if (!Array.isArray(assertions)) {
      throw new StudioScientificAssertionRegistryErrorV1(
        "assertions must be an array",
      );
    }
    const byId = new Map<string, StudioScientificAssertionV1>();
    assertions.forEach((assertion, index) => {
      if (
        assertion === null
        || typeof assertion !== "object"
        || Array.isArray(assertion)
      ) {
        throw new StudioScientificAssertionRegistryErrorV1(
          `assertions[${index}] must be an object`,
        );
      }
      try {
        assertPortableModelIdentifierV2(
          assertion.assertionId,
          `$.assertions[${index}].assertionId`,
        );
        assertPortableModelIdentifierV2(
          assertion.modelFamilyId,
          `$.assertions[${index}].modelFamilyId`,
        );
      } catch (error) {
        throw new StudioScientificAssertionRegistryErrorV1(
          error instanceof Error ? error.message : String(error),
        );
      }
      if (byId.has(assertion.assertionId)) {
        throw new StudioScientificAssertionRegistryErrorV1(
          `duplicate assertionId ${assertion.assertionId}`,
        );
      }
      if (
        !Array.isArray(assertion.requiredScenarioIds)
        || assertion.requiredScenarioIds.length === 0
        || new Set(assertion.requiredScenarioIds).size
          !== assertion.requiredScenarioIds.length
      ) {
        throw new StudioScientificAssertionRegistryErrorV1(
          `${assertion.assertionId} must declare unique required Scenarios`,
        );
      }
      assertion.requiredScenarioIds.forEach((scenarioId, scenarioIndex) => {
        try {
          assertPortableModelIdentifierV2(
            scenarioId,
            `$.assertions[${index}].requiredScenarioIds[${scenarioIndex}]`,
          );
        } catch (error) {
          throw new StudioScientificAssertionRegistryErrorV1(
            error instanceof Error ? error.message : String(error),
          );
        }
      });
      if (typeof assertion.evaluate !== "function") {
        throw new StudioScientificAssertionRegistryErrorV1(
          `${assertion.assertionId} must provide an evaluator`,
        );
      }
      byId.set(assertion.assertionId, Object.freeze({
        assertionId: assertion.assertionId,
        modelFamilyId: assertion.modelFamilyId,
        requiredScenarioIds: Object.freeze([
          ...assertion.requiredScenarioIds,
        ]),
        evaluate: assertion.evaluate,
      }));
    });
    this.#byId = byId;
    Object.freeze(this);
  }

  resolve(
    assertionId: string,
    modelFamilyId: string,
  ): StudioScientificAssertionV1 {
    const assertion = this.#byId.get(assertionId);
    if (assertion === undefined) {
      throw new StudioScientificAssertionRegistryErrorV1(
        `unknown assertionId ${assertionId}`,
      );
    }
    if (assertion.modelFamilyId !== modelFamilyId) {
      throw new StudioScientificAssertionRegistryErrorV1(
        `${assertionId} belongs to ${assertion.modelFamilyId}, not ${modelFamilyId}`,
      );
    }
    return assertion;
  }

  resolveRecipe(
    assertionIds: readonly string[],
    modelFamilyId: string,
    scenarioIds: readonly string[],
  ): readonly StudioScientificAssertionV1[] {
    const availableScenarios = new Set(scenarioIds);
    return Object.freeze(assertionIds.map((assertionId) => {
      const assertion = this.resolve(assertionId, modelFamilyId);
      const missing = assertion.requiredScenarioIds.find(
        (scenarioId) => !availableScenarios.has(scenarioId),
      );
      if (missing !== undefined) {
        throw new StudioScientificAssertionRegistryErrorV1(
          `${assertionId} requires missing Scenario ${missing}`,
        );
      }
      return assertion;
    }));
  }
}
