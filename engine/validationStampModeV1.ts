/**
 * Verification control for persistent validation stamps.
 *
 * The default mode permits an exact identity that has already earned a stamp
 * to reuse that proof. The disabled mode makes every eligibility check miss
 * and prevents new stamps from being issued, so verification runs take the
 * complete validators on every re-entry. This control changes validation work
 * only; it must not change accepted numbers.
 */

export const VALIDATION_STAMP_MODES_V1 = Object.freeze([
  "validation-stamps-enabled",
  "validation-stamps-disabled",
] as const);

export type ValidationStampModeV1 =
  (typeof VALIDATION_STAMP_MODES_V1)[number];

export const DEFAULT_VALIDATION_STAMP_MODE_V1: ValidationStampModeV1 =
  "validation-stamps-enabled";

function environmentValidationStampModeV1(): ValidationStampModeV1 {
  if (typeof process === "undefined") {
    return DEFAULT_VALIDATION_STAMP_MODE_V1;
  }
  const raw = process.env?.CIRCLEHEART_VALIDATION_STAMPS;
  return raw === "disabled" || raw === "validation-stamps-disabled"
    ? "validation-stamps-disabled"
    : DEFAULT_VALIDATION_STAMP_MODE_V1;
}

let selectedMode = environmentValidationStampModeV1();
let reuseEnabled = selectedMode === "validation-stamps-enabled";

// A successfully proved graph is immutable by construction: every reachable
// object is frozen, plain data, and exposes data properties only. Retaining
// that proof by identity is therefore safe for the lifetime of this module and
// avoids walking the same large, static configuration graph on every accepted
// numerical step. Failed and partially visited graphs are never cached.
const transitivelyFrozenPlainDataProofsV1 = new WeakSet<object>();

/** The effective validation-stamp mode for this module instance. */
export function validationStampModeV1(): ValidationStampModeV1 {
  return selectedMode;
}

/** True exactly when the verification mode has disabled stamp reuse. */
export function validationStampsDisabledV1(): boolean {
  return !reuseEnabled;
}

/** Selects stamp reuse for a process-owned module instance or verification. */
export function selectValidationStampModeV1(
  mode: ValidationStampModeV1,
): void {
  if (!VALIDATION_STAMP_MODES_V1.includes(mode)) {
    throw new Error(`unknown validation-stamp mode ${String(mode)}`);
  }
  selectedMode = mode;
  reuseEnabled = mode === "validation-stamps-enabled";
}

/**
 * Stamp lookup eligibility. Call only at an identity-stamp reuse boundary.
 */
export function validationStampReuseEligibleV1(): boolean {
  return reuseEnabled;
}

export function validationStampIssuanceEligibleV1(...values: readonly unknown[]): boolean {
  if (!validationStampReuseEligibleV1()) return false;
  for (const value of values) if (!isTransitivelyFrozenPlainDataV1(value)) return false;
  return true;
}

export function isTransitivelyFrozenPlainDataV1(value: unknown): boolean {
  if (value === null) return true;
  if (typeof value !== "object") return typeof value !== "function";
  const reuse = validationStampReuseEligibleV1();
  // Most step-boundary checks revisit a configuration transitivelyFrozenPlainDataProofsV1 at admission.
  // Do not allocate traversal collections for these already immutable roots.
  if (reuse && transitivelyFrozenPlainDataProofsV1.has(value)) return true;
  const visited = new Set<object>();
  if (!inspect(value, reuse, visited)) return false;
  // A failed traversal must not bless a partially inspected cyclic graph.
  if (reuse) for (const item of visited) transitivelyFrozenPlainDataProofsV1.add(item);
  return true;
}

function inspect(item: unknown, reuse: boolean, visited: Set<object>): boolean {
  if (item === null) return true;
  if (typeof item !== "object") return typeof item !== "function";
  if ((reuse && transitivelyFrozenPlainDataProofsV1.has(item)) || visited.has(item)) return true;
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
