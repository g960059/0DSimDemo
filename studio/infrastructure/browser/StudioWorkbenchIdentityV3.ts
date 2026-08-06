import type { ExperimentIdV2 } from "@/studio/contracts/v2/ids";

const WORKBENCH_ID_PREFIX_V3 = "workbench-";
const WORKBENCH_ID_PATTERN_V3 = /^workbench-[A-Za-z0-9_-]{8,128}$/;
const WORKBENCH_ID_ALLOCATION_ATTEMPTS_V3 = 32;

export type WorkbenchIdentityTokenFactoryV3 = () => string;
export type WorkbenchAvailabilityV3 = "available" | "unavailable-model";

/**
 * Workbench identity is deliberately independent from model identity and the
 * currently configured default. The generated value is also one URL segment,
 * so route identity never needs a lossy model-derived codec.
 */
export function createOpaqueWorkbenchIdV3(
  tokenFactory: WorkbenchIdentityTokenFactoryV3 = randomWorkbenchTokenV3,
): ExperimentIdV2 {
  const token = tokenFactory();
  if (!/^[A-Za-z0-9_-]{8,118}$/.test(token)) {
    throw new Error("Workbench identity token must be URL-safe and opaque");
  }
  return `${WORKBENCH_ID_PREFIX_V3}${token}`;
}

export function allocateOpaqueWorkbenchIdV3(
  existingExperimentIds: Iterable<string>,
  tokenFactory: WorkbenchIdentityTokenFactoryV3 = randomWorkbenchTokenV3,
): ExperimentIdV2 {
  const existing = new Set(existingExperimentIds);
  for (let attempt = 0; attempt < WORKBENCH_ID_ALLOCATION_ATTEMPTS_V3; attempt += 1) {
    const candidate = createOpaqueWorkbenchIdV3(tokenFactory);
    if (!existing.has(candidate)) return candidate;
  }
  throw new Error("Could not allocate a unique Workbench identity");
}

export function isOpaqueWorkbenchIdV3(value: unknown): value is ExperimentIdV2 {
  return typeof value === "string" && WORKBENCH_ID_PATTERN_V3.test(value);
}

export function requireOpaqueWorkbenchIdV3(
  value: unknown,
  path = "Workbench experimentId",
): ExperimentIdV2 {
  if (!isOpaqueWorkbenchIdV3(value)) {
    throw new Error(`${path} must be a URL-safe opaque Workbench identity`);
  }
  return value;
}

export function classifyWorkbenchAvailabilityV3(
  savedModelId: string,
  availableExactModelId: string,
): WorkbenchAvailabilityV3 {
  return savedModelId === availableExactModelId
    ? "available"
    : "unavailable-model";
}

function randomWorkbenchTokenV3(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`;
}
