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

/**
 * Stamp issuance eligibility. Every reachable value must be frozen plain data,
 * and the stamps-disabled verification mode makes the verdict false.
 */
export function validationStampIssuanceEligibleV1(
  ...values: readonly unknown[]
): boolean {
  return reuseEnabled
    && values.every((value) => isTransitivelyFrozenPlainDataV1(value));
}

/**
 * True only for primitives and transitively frozen arrays/plain records whose
 * own properties are data properties. Functions are rejected explicitly:
 * their mutable object graph is otherwise hidden behind `typeof "function"`.
 */
export function isTransitivelyFrozenPlainDataV1(
  value: unknown,
): boolean {
  const visited = new Set<object>();
  const result = inspectTransitivelyFrozenPlainDataV1(
    value,
    new WeakSet<object>(),
    visited,
  );
  if (result) {
    for (const item of visited) {
      transitivelyFrozenPlainDataProofsV1.add(item);
    }
  }
  return result;
}

function inspectTransitivelyFrozenPlainDataV1(
  value: unknown,
  seen: WeakSet<object>,
  visited: Set<object>,
): boolean {
  if (value === null) return true;
  if (typeof value === "function") return false;
  if (typeof value !== "object") return true;
  if (transitivelyFrozenPlainDataProofsV1.has(value)) return true;
  if (seen.has(value)) return true;
  if (!Object.isFrozen(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (
    prototype !== null
    && prototype !== Object.prototype
    && prototype !== Array.prototype
  ) {
    return false;
  }
  seen.add(value);
  visited.add(value);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined
      || !("value" in descriptor)
      || !inspectTransitivelyFrozenPlainDataV1(
        descriptor.value,
        seen,
        visited,
      )
    ) {
      return false;
    }
  }
  return true;
}
