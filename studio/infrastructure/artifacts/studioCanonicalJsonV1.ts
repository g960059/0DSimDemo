import type {
  StudioJsonValueV1,
} from "@/studio/contracts/v1";

const MAXIMUM_STUDIO_JSON_DEPTH_V1 = 256;

export class StudioCanonicalJsonErrorV1 extends Error {
  constructor(path: string, message: string) {
    super(`Studio canonical JSON rejected ${path}: ${message}`);
    this.name = "StudioCanonicalJsonErrorV1";
  }
}

/**
 * Small Studio-owned canonical JSON implementation.
 *
 * It follows ECMAScript primitive serialization and lexicographic object-key
 * ordering while rejecting values JSON.stringify would silently omit/coerce.
 * Studio infrastructure must not import a model package merely to hash its own
 * artifact envelopes.
 */
export function studioCanonicalJsonStringifyV1(value: unknown): string {
  return serializeV1(value, "$", new Set<object>(), 0);
}

export function cloneAndFreezeStudioJsonV1<
  TValue extends StudioJsonValueV1,
>(value: unknown): Readonly<TValue> {
  const cloned = JSON.parse(
    studioCanonicalJsonStringifyV1(value),
  ) as TValue;
  return deepFreezeV1(cloned);
}

export async function sha256StudioJsonHexV1(
  value: unknown,
): Promise<string> {
  return sha256StudioTextHexV1(
    studioCanonicalJsonStringifyV1(value),
  );
}

export async function sha256StudioTextHexV1(
  value: string,
): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (subtle === undefined) {
    throw new StudioCanonicalJsonErrorV1(
      "$",
      "Web Crypto subtle.digest is required",
    );
  }
  const bytes = new TextEncoder().encode(value);
  const digest = await subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")).join("");
}

function serializeV1(
  value: unknown,
  path: string,
  ancestors: Set<object>,
  depth: number,
): string {
  if (depth > MAXIMUM_STUDIO_JSON_DEPTH_V1) {
    throw new StudioCanonicalJsonErrorV1(path, "nesting limit exceeded");
  }
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") {
    assertUnicodeScalarSequenceV1(value, path);
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new StudioCanonicalJsonErrorV1(path, "number must be finite");
    }
    return JSON.stringify(value);
  }
  if (typeof value !== "object") {
    throw new StudioCanonicalJsonErrorV1(
      path,
      `${typeof value} is outside the JSON data model`,
    );
  }
  if (ancestors.has(value)) {
    throw new StudioCanonicalJsonErrorV1(path, "cyclic value");
  }

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      assertArrayShapeV1(value, path);
      return `[${value.map((child, index) =>
        serializeV1(child, `${path}[${index}]`, ancestors, depth + 1)
      ).join(",")}]`;
    }

    assertPlainObjectV1(value, path);
    const descriptors = Object.getOwnPropertyDescriptors(value);
    return `{${Object.keys(descriptors).sort().map((key) => {
      const descriptor = descriptors[key]!;
      assertUnicodeScalarSequenceV1(key, `${path} property name`);
      if (!descriptor.enumerable || !("value" in descriptor)) {
        throw new StudioCanonicalJsonErrorV1(
          propertyPathV1(path, key),
          "hidden/accessor properties are not data",
        );
      }
      return `${JSON.stringify(key)}:${serializeV1(
        descriptor.value,
        propertyPathV1(path, key),
        ancestors,
        depth + 1,
      )}`;
    }).join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}

function assertArrayShapeV1(
  value: readonly unknown[],
  path: string,
): void {
  const expected = new Set([
    "length",
    ...value.map((_, index) => String(index)),
  ]);
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.prototype.hasOwnProperty.call(value, index)) {
      throw new StudioCanonicalJsonErrorV1(
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
      throw new StudioCanonicalJsonErrorV1(
        `${path}[${index}]`,
        "hidden/accessor array values are not data",
      );
    }
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === "symbol" || !expected.has(key)) {
      throw new StudioCanonicalJsonErrorV1(
        path,
        "custom array properties are not allowed",
      );
    }
  }
}

function assertPlainObjectV1(value: object, path: string): void {
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new StudioCanonicalJsonErrorV1(
      path,
      "only plain objects are allowed",
    );
  }
  if (Reflect.ownKeys(value).some((key) => typeof key === "symbol")) {
    throw new StudioCanonicalJsonErrorV1(
      path,
      "symbol properties are not allowed",
    );
  }
}

function assertUnicodeScalarSequenceV1(
  value: string,
  path: string,
): void {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new StudioCanonicalJsonErrorV1(
          path,
          "unpaired high surrogate",
        );
      }
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      throw new StudioCanonicalJsonErrorV1(
        path,
        "unpaired low surrogate",
      );
    }
  }
}

function deepFreezeV1<TValue extends StudioJsonValueV1>(
  value: TValue,
): Readonly<TValue> {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreezeV1(child);
    Object.freeze(value);
  }
  return value;
}

function propertyPathV1(parent: string, key: string): string {
  return `${parent}[${JSON.stringify(key)}]`;
}
