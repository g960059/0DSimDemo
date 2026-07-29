import { SHA256_HEX_PATTERN } from "@/engine/scientific/release";

export class ModelSurfaceSchemaErrorV1 extends Error {
  constructor(message: string) {
    super(`model surface schema rejected: ${message}`);
    this.name = "ModelSurfaceSchemaErrorV1";
  }
}

export function modelSurfaceRecordV1(
  value: unknown,
  label: string,
): Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ModelSurfaceSchemaErrorV1(`${label} must be an object`);
  }
  return value as Readonly<Record<string, unknown>>;
}

export function assertModelSurfaceExactKeysV1(
  value: Readonly<Record<string, unknown>>,
  required: readonly string[],
  optional: readonly string[],
  label: string,
): void {
  const requiredSet = new Set(required);
  const allowed = new Set([...required, ...optional]);
  const missing = required.filter((key) => !Object.hasOwn(value, key));
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (missing.length > 0) {
    throw new ModelSurfaceSchemaErrorV1(
      `${label} is missing ${missing.join(", ")}`,
    );
  }
  if (unknown.length > 0) {
    throw new ModelSurfaceSchemaErrorV1(
      `${label} has unknown field ${unknown.join(", ")}`,
    );
  }
  for (const key of requiredSet) {
    if (!Object.prototype.propertyIsEnumerable.call(value, key)) {
      throw new ModelSurfaceSchemaErrorV1(
        `${label}.${key} must be enumerable`,
      );
    }
  }
}

export function modelSurfaceNonEmptyStringV1(
  value: unknown,
  label: string,
): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ModelSurfaceSchemaErrorV1(
      `${label} must be a non-empty string`,
    );
  }
  return value;
}

export function modelSurfacePositiveIntegerV1(
  value: unknown,
  label: string,
): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw new ModelSurfaceSchemaErrorV1(
      `${label} must be a positive safe integer`,
    );
  }
  return value as number;
}

export function modelSurfaceSha256V1(
  value: unknown,
  label: string,
): string {
  if (typeof value !== "string" || !SHA256_HEX_PATTERN.test(value)) {
    throw new ModelSurfaceSchemaErrorV1(
      `${label} must be a lowercase SHA-256 hex digest`,
    );
  }
  return value;
}

export function modelSurfaceArrayV1(
  value: unknown,
  label: string,
): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new ModelSurfaceSchemaErrorV1(`${label} must be an array`);
  }
  return value;
}
