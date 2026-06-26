import type { ModelInstancePath } from "@/engine/myocardium/contracts";
import { compareCanonicalStrings } from "@/engine/myocardium/canonicalOrder";

const MODEL_INSTANCE_PATH_FIELDS = [
  "chamber",
  "wallId",
  "regionId",
  "patchId",
  "moduleId",
  "instanceId",
] as const satisfies readonly (keyof ModelInstancePath)[];

const CHAMBER_IDS = new Set(["LV", "RV", "LA", "RA"]);

type ModelInstancePathField = (typeof MODEL_INSTANCE_PATH_FIELDS)[number];

export function validateModelInstancePath(path: ModelInstancePath): ModelInstancePath {
  validateRequiredSegment(path.moduleId, "moduleId");
  validateRequiredSegment(path.instanceId, "instanceId");
  validateOptionalSegment(path.wallId, "wallId");
  validateOptionalSegment(path.regionId, "regionId");
  validateOptionalSegment(path.patchId, "patchId");

  if (path.chamber !== undefined && !CHAMBER_IDS.has(path.chamber)) {
    throw new Error(`ModelInstancePath chamber must be one of LV, RV, LA, RA`);
  }

  return path;
}

export function serializeModelInstancePath(path: ModelInstancePath): string {
  validateModelInstancePath(path);

  const parts: string[] = [];
  for (const field of MODEL_INSTANCE_PATH_FIELDS) {
    const value = path[field];
    if (value !== undefined) {
      parts.push(`${field}=${encodePathSegment(value)}`);
    }
  }
  return parts.join("|");
}

export function parseModelInstancePath(serialized: string): ModelInstancePath {
  if (typeof serialized !== "string" || serialized.length === 0) {
    throw new Error("Serialized ModelInstancePath must be a non-empty string");
  }

  const allowedFields = new Set<ModelInstancePathField>(MODEL_INSTANCE_PATH_FIELDS);
  const seenFields = new Set<ModelInstancePathField>();
  const parsed: Partial<Record<ModelInstancePathField, string>> = {};

  for (const part of serialized.split("|")) {
    if (part.length === 0) throw new Error("Serialized ModelInstancePath contains an empty field");
    const separatorIndex = part.indexOf("=");
    if (separatorIndex <= 0) {
      throw new Error(`Serialized ModelInstancePath field is missing a key/value separator: ${part}`);
    }

    const key = part.slice(0, separatorIndex) as ModelInstancePathField;
    if (!allowedFields.has(key)) {
      throw new Error(`Serialized ModelInstancePath contains unknown field: ${key}`);
    }
    if (seenFields.has(key)) {
      throw new Error(`Serialized ModelInstancePath contains duplicate field: ${key}`);
    }

    seenFields.add(key);
    parsed[key] = decodePathSegment(part.slice(separatorIndex + 1), key);
  }

  const path = {
    chamber: parsed.chamber as ModelInstancePath["chamber"],
    wallId: parsed.wallId,
    regionId: parsed.regionId,
    patchId: parsed.patchId,
    moduleId: parsed.moduleId ?? "",
    instanceId: parsed.instanceId ?? "",
  } satisfies ModelInstancePath;

  return stripUndefinedOptionalFields(validateModelInstancePath(path));
}

export function compareModelInstancePath(left: ModelInstancePath, right: ModelInstancePath): number {
  return compareCanonicalStrings(serializeModelInstancePath(left), serializeModelInstancePath(right));
}

function validateRequiredSegment(value: unknown, field: "moduleId" | "instanceId"): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`ModelInstancePath ${field} is required`);
  }
}

function validateOptionalSegment(value: unknown, field: "wallId" | "regionId" | "patchId"): void {
  if (value === undefined) return;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`ModelInstancePath ${field} must be a non-empty string when provided`);
  }
}

function encodePathSegment(value: string): string {
  return encodeURIComponent(value);
}

function decodePathSegment(value: string, field: string): string {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    throw new Error(`Serialized ModelInstancePath ${field} has invalid percent encoding: ${(error as Error).message}`);
  }
}

function stripUndefinedOptionalFields(path: ModelInstancePath): ModelInstancePath {
  return Object.fromEntries(Object.entries(path).filter(([, value]) => value !== undefined)) as ModelInstancePath;
}
