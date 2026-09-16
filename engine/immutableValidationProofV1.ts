import { validationStampReuseEligibleV1 } from "./validationStampModeV1";

export * from "./validationStampModeV1";

// Candidate-only implementation. The published model keeps its own import
// closure; verification mode is shared, never shadowed by this cache.
const proved = new WeakSet<object>();

export function validationStampIssuanceEligibleV1(...values: readonly unknown[]): boolean {
  if (!validationStampReuseEligibleV1()) return false;
  for (const value of values) if (!isTransitivelyFrozenPlainDataV1(value)) return false;
  return true;
}

export function isTransitivelyFrozenPlainDataV1(value: unknown): boolean {
  if (value === null) return true;
  if (typeof value !== "object") return typeof value !== "function";
  const reuse = validationStampReuseEligibleV1();
  // Most step-boundary checks revisit a configuration proved at admission.
  // Do not allocate traversal collections for these already immutable roots.
  if (reuse && proved.has(value)) return true;
  const visited = new Set<object>();
  if (!inspect(value, reuse, visited)) return false;
  // A failed traversal must not bless a partially inspected cyclic graph.
  if (reuse) for (const item of visited) proved.add(item);
  return true;
}

function inspect(item: unknown, reuse: boolean, visited: Set<object>): boolean {
  if (item === null) return true;
  if (typeof item !== "object") return typeof item !== "function";
  if ((reuse && proved.has(item)) || visited.has(item)) return true;
  if (!Object.isFrozen(item)) return false;
  const prototype = Object.getPrototypeOf(item);
  if (prototype !== null && prototype !== Object.prototype && prototype !== Array.prototype) return false;
  visited.add(item);
  for (const key of Reflect.ownKeys(item)) {
    const descriptor = Object.getOwnPropertyDescriptor(item, key);
    if (!descriptor || !("value" in descriptor) || !inspect(descriptor.value, reuse, visited)) return false;
  }
  return true;
}
