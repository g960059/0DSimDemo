const MAXIMUM_STUDIO_JSON_DEPTH = 256;

export class StudioCanonicalJsonError extends Error {
  constructor(path: string, message: string) {
    super(`Studio canonical JSON rejected ${path}: ${message}`);
    this.name = "StudioCanonicalJsonError";
  }
}

/**
 * Small Studio-owned canonical JSON implementation.
 *
 * It follows ECMAScript primitive serialization and lexicographic object-key
 * ordering while rejecting values JSON.stringify would silently omit/coerce.
 * Studio infrastructure uses this at portable JSON boundaries without
 * importing a model package. Registry package hashing stays private to the
 * registry implementation.
 */
export function studioCanonicalJsonStringify(value: unknown): string {
  return serialize(value, "$", new Set<object>(), 0);
}

export function cloneAndFreezeStudioJson<TValue>(
  value: unknown,
): Readonly<TValue> {
  const cloned = JSON.parse(
    studioCanonicalJsonStringify(value),
  ) as TValue;
  return deepFreeze(cloned);
}

function serialize(
  value: unknown,
  path: string,
  ancestors: Set<object>,
  depth: number,
): string {
  if (depth > MAXIMUM_STUDIO_JSON_DEPTH) {
    throw new StudioCanonicalJsonError(path, "nesting limit exceeded");
  }
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") {
    assertUnicodeScalarSequence(value, path);
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      throw new StudioCanonicalJsonError(
        path,
        "number must be finite and must not be negative zero",
      );
    }
    return JSON.stringify(value);
  }
  if (typeof value !== "object") {
    throw new StudioCanonicalJsonError(
      path,
      `${typeof value} is outside the JSON data model`,
    );
  }
  if (ancestors.has(value)) {
    throw new StudioCanonicalJsonError(path, "cyclic value");
  }

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      assertArrayShape(value, path);
      const serializedChildren: string[] = [];
      for (let index = 0; index < value.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(
          value,
          String(index),
        )!;
        serializedChildren.push(serialize(
          descriptor.value,
          `${path}[${index}]`,
          ancestors,
          depth + 1,
        ));
      }
      return `[${serializedChildren.join(",")}]`;
    }

    assertPlainObject(value, path);
    const descriptors = Object.getOwnPropertyDescriptors(value);
    return `{${Object.keys(descriptors).sort().map((key) => {
      const descriptor = descriptors[key]!;
      assertUnicodeScalarSequence(key, `${path} property name`);
      if (!descriptor.enumerable || !("value" in descriptor)) {
        throw new StudioCanonicalJsonError(
          propertyPath(path, key),
          "hidden/accessor properties are not data",
        );
      }
      return `${JSON.stringify(key)}:${serialize(
        descriptor.value,
        propertyPath(path, key),
        ancestors,
        depth + 1,
      )}`;
    }).join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}

function assertArrayShape(
  value: readonly unknown[],
  path: string,
): void {
  const expected = new Set<string>(["length"]);
  for (let index = 0; index < value.length; index += 1) {
    expected.add(String(index));
    if (!Object.prototype.hasOwnProperty.call(value, index)) {
      throw new StudioCanonicalJsonError(
        `${path}[${index}]`,
        "sparse arrays are not allowed",
      );
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (
      descriptor === undefined
      || !descriptor.enumerable
      || !("value" in descriptor)
    ) {
      throw new StudioCanonicalJsonError(
        `${path}[${index}]`,
        "hidden/accessor array values are not data",
      );
    }
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === "symbol" || !expected.has(key)) {
      throw new StudioCanonicalJsonError(
        path,
        "custom array properties are not allowed",
      );
    }
  }
}

function assertPlainObject(value: object, path: string): void {
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new StudioCanonicalJsonError(
      path,
      "only plain objects are allowed",
    );
  }
  if (Reflect.ownKeys(value).some((key) => typeof key === "symbol")) {
    throw new StudioCanonicalJsonError(
      path,
      "symbol properties are not allowed",
    );
  }
}

function assertUnicodeScalarSequence(
  value: string,
  path: string,
): void {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new StudioCanonicalJsonError(
          path,
          "unpaired high surrogate",
        );
      }
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      throw new StudioCanonicalJsonError(
        path,
        "unpaired low surrogate",
      );
    }
  }
}

function deepFreeze<TValue>(
  value: TValue,
): Readonly<TValue> {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function propertyPath(parent: string, key: string): string {
  return `${parent}[${JSON.stringify(key)}]`;
}
