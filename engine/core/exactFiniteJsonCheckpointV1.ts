/**
 * Canonical fingerprint for JSON checkpoint state.
 *
 * Unlike protocol hashes, state values are never rounded or sanitized. Every
 * finite JSON number is encoded with JSON.stringify(number), so even a change
 * smaller than 1e-12 is visible to the fingerprint. This is an integrity
 * checksum, not a cryptographic signature.
 */
export function exactFiniteJsonFingerprintV1(value: unknown): string {
  const text = exactFiniteJsonCanonicalStringV1(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function exactFiniteJsonCanonicalStringV1(value: unknown): string {
  return canonical(value, new Set<object>(), "$checkpoint");
}

export function requireCheckpointRecordV1(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || (Object.getPrototypeOf(value) !== Object.prototype
      && Object.getPrototypeOf(value) !== null)
  ) throw new Error(`${label} must be a plain JSON object`);
  return value as Record<string, unknown>;
}

export function requireExactCheckpointKeysV1(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (
    actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])
  ) throw new Error(`${label} has an unexpected checkpoint field set`);
}

function canonical(
  value: unknown,
  ancestors: Set<object>,
  path: string,
): string {
  if (
    value === null
    || typeof value === "boolean"
    || typeof value === "string"
  ) return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`${path} contains a non-finite checkpoint number`);
    }
    return JSON.stringify(value);
  }
  if (typeof value !== "object") {
    throw new Error(`${path} is not JSON serializable`);
  }
  if (ancestors.has(value)) throw new Error(`${path} contains a cycle`);
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return `[${value.map((child, index) =>
        canonical(child, ancestors, `${path}[${index}]`)).join(",")}]`;
    }
    const record = requireCheckpointRecordV1(value, path);
    if (Object.getOwnPropertySymbols(record).length !== 0) {
      throw new Error(`${path} contains a symbol checkpoint key`);
    }
    return `{${Object.keys(record).sort().map((key) =>
      `${JSON.stringify(key)}:${canonical(record[key], ancestors, `${path}.${key}`)}`
    ).join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}
