export type CanonicalJsonValue =
  | null
  | boolean
  | number
  | string
  | readonly CanonicalJsonValue[]
  | { readonly [key: string]: CanonicalJsonValue };

export type CanonicalSha256HexProvider = (canonicalJsonUtf8: string) => string;

export function canonicalizeJson(value: unknown): string {
  return canonicalizeValue(value, "$", new Set<object>());
}

export function computeCanonicalSha256(
  value: unknown,
  sha256Hex: CanonicalSha256HexProvider,
): string {
  const digest = sha256Hex(canonicalizeJson(value));
  if (!/^[0-9a-f]{64}$/.test(digest)) {
    throw new Error("SHA-256 provider must return a lowercase 64-hex digest");
  }
  return digest;
}

export function assertCanonicalSha256(
  value: unknown,
  expectedSha256: string,
  sha256Hex: CanonicalSha256HexProvider,
  field = "contentSha256",
): void {
  if (!/^[0-9a-f]{64}$/.test(expectedSha256)) {
    throw new Error(`${field} must be a lowercase 64-hex SHA-256 digest`);
  }
  const actual = computeCanonicalSha256(value, sha256Hex);
  if (actual !== expectedSha256) {
    throw new Error(`${field} does not match the canonical manifest payload`);
  }
}

function canonicalizeValue(value: unknown, path: string, ancestors: Set<object>): string {
  if (value === null) return "null";
  if (typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${path} must not contain a non-finite number`);
    return JSON.stringify(value);
  }
  if (typeof value !== "object") {
    throw new Error(`${path} contains unsupported JSON value type ${typeof value}`);
  }
  if (ancestors.has(value)) throw new Error(`${path} contains a cyclic reference`);
  ancestors.add(value);

  try {
    if (Array.isArray(value)) {
      assertClosedArray(value, path);
      const children: string[] = [];
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.hasOwn(value, index)) throw new Error(`${path} must not contain sparse-array holes`);
        children.push(canonicalizeValue(value[index], `${path}[${index}]`, ancestors));
      }
      return `[${children.join(",")}]`;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error(`${path} must contain only plain JSON objects`);
    }
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") throw new Error(`${path} must not contain symbol keys`);
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || !descriptor.enumerable || !("value" in descriptor)) {
        throw new Error(`${path}.${key} must be an enumerable data property`);
      }
    }
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, child]) => `${JSON.stringify(key)}:${canonicalizeValue(child, `${path}.${key}`, ancestors)}`);
    return `{${entries.join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}

function assertClosedArray(value: readonly unknown[], path: string): void {
  if (Object.getPrototypeOf(value) !== Array.prototype) {
    throw new Error(`${path} must use the plain Array prototype`);
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string") throw new Error(`${path} must not contain symbol keys`);
    if (key === "length") continue;
    if (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length) {
      throw new Error(`${path} contains an extra unhashed array property ${key}`);
    }
    if (!Object.prototype.propertyIsEnumerable.call(value, key)) {
      throw new Error(`${path}[${key}] must be enumerable`);
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) {
      throw new Error(`${path}[${key}] must be a data property`);
    }
  }
}
