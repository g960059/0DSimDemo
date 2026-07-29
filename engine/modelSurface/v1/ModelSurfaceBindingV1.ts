import {
  canonicalJsonStringify,
  type CanonicalJsonObject,
} from "@/engine/scientific/release";
import {
  modelSurfaceNonEmptyStringV1,
  modelSurfacePositiveIntegerV1,
} from "@/engine/modelSurface/v1/validationV1";

export type StableConceptIdV1 = string;
export type ModelSpecificBindingIdV1 = string;

export type ModelSpecificBindingV1 = Readonly<{
  conceptId: StableConceptIdV1;
  modelId: string;
  bindingId: ModelSpecificBindingIdV1;
  bindingVersion: number;
  publicationStatus: "draft" | "published";
  mapping: CanonicalJsonObject;
}>;

export class ModelSurfaceBindingEvolutionErrorV1 extends Error {
  constructor(message: string) {
    super(`model surface binding evolution rejected: ${message}`);
    this.name = "ModelSurfaceBindingEvolutionErrorV1";
  }
}

export function modelSpecificBindingIdV1(
  modelId: string,
  conceptId: StableConceptIdV1,
  bindingVersion: number,
): ModelSpecificBindingIdV1 {
  modelSurfaceNonEmptyStringV1(modelId, "binding.modelId");
  modelSurfaceNonEmptyStringV1(conceptId, "binding.conceptId");
  modelSurfacePositiveIntegerV1(
    bindingVersion,
    "binding.bindingVersion",
  );
  return `${modelId}/${conceptId}@${bindingVersion}`;
}

export function assertModelSpecificBindingV1(
  binding: ModelSpecificBindingV1,
): void {
  const expectedId = modelSpecificBindingIdV1(
    binding.modelId,
    binding.conceptId,
    binding.bindingVersion,
  );
  if (binding.bindingId !== expectedId) {
    throw new ModelSurfaceBindingEvolutionErrorV1(
      `bindingId ${binding.bindingId} must be ${expectedId}`,
    );
  }
  if (
    binding.publicationStatus !== "draft"
    && binding.publicationStatus !== "published"
  ) {
    throw new ModelSurfaceBindingEvolutionErrorV1(
      `binding ${binding.bindingId} has an unknown publication status`,
    );
  }
  canonicalJsonStringify(binding.mapping);
}

/**
 * A published binding is append-only. The next catalog must retain its exact
 * mapping under the exact ID. A changed mapping is a new binding whose version
 * is greater than every version already used by that model/concept pair.
 */
export function assertPublishedBindingEvolutionV1(
  previous: readonly ModelSpecificBindingV1[],
  next: readonly ModelSpecificBindingV1[],
): void {
  const previousById = bindingMapV1(previous, "previous");
  const nextById = bindingMapV1(next, "next");
  const maximumPreviousVersion = new Map<string, number>();

  for (const binding of previous) {
    const key = bindingConceptKeyV1(binding);
    maximumPreviousVersion.set(
      key,
      Math.max(
        maximumPreviousVersion.get(key) ?? 0,
        binding.bindingVersion,
      ),
    );
    if (binding.publicationStatus !== "published") continue;
    const retained = nextById.get(binding.bindingId);
    if (
      retained === undefined
      || retained.publicationStatus !== "published"
      || canonicalJsonStringify(retained.mapping)
        !== canonicalJsonStringify(binding.mapping)
      || retained.modelId !== binding.modelId
      || retained.conceptId !== binding.conceptId
      || retained.bindingVersion !== binding.bindingVersion
    ) {
      throw new ModelSurfaceBindingEvolutionErrorV1(
        `published binding ${binding.bindingId} must never be overwritten or removed`,
      );
    }
  }

  for (const binding of next) {
    if (previousById.has(binding.bindingId)) continue;
    const previousMaximum =
      maximumPreviousVersion.get(bindingConceptKeyV1(binding));
    if (
      previousMaximum !== undefined
      && binding.bindingVersion <= previousMaximum
    ) {
      throw new ModelSurfaceBindingEvolutionErrorV1(
        `changed mapping for ${binding.modelId}/${binding.conceptId} must increment the binding version above ${previousMaximum}`,
      );
    }
  }
}

function bindingMapV1(
  bindings: readonly ModelSpecificBindingV1[],
  label: string,
): Map<string, ModelSpecificBindingV1> {
  const result = new Map<string, ModelSpecificBindingV1>();
  for (const binding of bindings) {
    assertModelSpecificBindingV1(binding);
    if (result.has(binding.bindingId)) {
      throw new ModelSurfaceBindingEvolutionErrorV1(
        `${label} catalog repeats bindingId ${binding.bindingId}`,
      );
    }
    result.set(binding.bindingId, binding);
  }
  return result;
}

function bindingConceptKeyV1(binding: ModelSpecificBindingV1): string {
  return `${binding.modelId}\u0000${binding.conceptId}`;
}
