import { canonicalJsonStringify as serialize } from "./canonicalJson";
import { isTransitivelyFrozenPlainDataV1, validationStampReuseEligibleV1 } from "../validationStampModeV1";

export * from "./index";

// Candidate-owned integrity entry point. The published exact module keeps its
// original import closure until the candidate has qualified for admission.
// A weak key never retains a discarded scenario or its immutable settings.
const serialized = new WeakMap<object, string>();

/** Reuse a successful canonical encoding only for a proven immutable graph.
 * Mutable inputs, invalid JSON and stamps-disabled audits retain the original
 * serializer and its complete validation/error behavior. This changes neither
 * model arithmetic nor the canonical bytes used to compare configurations. */
export function canonicalJsonStringify(value: unknown): string {
  if (!validationStampReuseEligibleV1() || value === null || typeof value !== "object") return serialize(value);
  const cached = serialized.get(value);
  if (cached !== undefined) return cached;
  const result = serialize(value);
  if (Object.isFrozen(value) && isTransitivelyFrozenPlainDataV1(value)) serialized.set(value, result);
  return result;
}
