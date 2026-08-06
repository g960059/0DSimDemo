import type { ExperimentIdV2 } from "@/studio/contracts/v2/ids";

const EXPERIMENT_ID_PREFIX_V3 = "experiment-";
const EXPERIMENT_ID_PATTERN_V3 = /^experiment-[A-Za-z0-9_-]{8,128}$/;
const SERVER_EXPERIMENT_ID_PATTERN_V3 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EXPERIMENT_ID_ALLOCATION_ATTEMPTS_V3 = 32;

export type ExperimentIdentityTokenFactoryV3 = () => string;
export type ExperimentAvailabilityV3 = "available" | "unavailable-model";

/**
 * Experiment identity is deliberately independent from model identity and the
 * currently configured default. `/experiments/new` has no Experiment identity;
 * allocation happens only inside the first explicit Save transaction.
 */
export function createOpaqueExperimentIdV3(
  tokenFactory: ExperimentIdentityTokenFactoryV3 = randomExperimentTokenV3,
): ExperimentIdV2 {
  const token = tokenFactory();
  if (!/^[A-Za-z0-9_-]{8,118}$/.test(token)) {
    throw new Error("Experiment identity token must be URL-safe and opaque");
  }
  return `${EXPERIMENT_ID_PREFIX_V3}${token}`;
}

export function allocateOpaqueExperimentIdV3(
  existingExperimentIds: Iterable<string>,
  tokenFactory: ExperimentIdentityTokenFactoryV3 = randomExperimentTokenV3,
): ExperimentIdV2 {
  const existing = new Set(existingExperimentIds);
  for (
    let attempt = 0;
    attempt < EXPERIMENT_ID_ALLOCATION_ATTEMPTS_V3;
    attempt += 1
  ) {
    const candidate = createOpaqueExperimentIdV3(tokenFactory);
    if (!existing.has(candidate)) return candidate;
  }
  throw new Error("Could not allocate a unique Experiment identity");
}

export function isOpaqueExperimentIdV3(
  value: unknown,
): value is ExperimentIdV2 {
  return typeof value === "string" && (
    SERVER_EXPERIMENT_ID_PATTERN_V3.test(value)
    // Kept only for the unconfigured browser repository used by isolated
    // development/tests. Configured clients receive UUID identities from the
    // Save transaction and never allocate this fallback form.
    || EXPERIMENT_ID_PATTERN_V3.test(value)
  );
}

export function requireOpaqueExperimentIdV3(
  value: unknown,
  path = "Experiment experimentId",
): ExperimentIdV2 {
  if (!isOpaqueExperimentIdV3(value)) {
    throw new Error(`${path} must be a URL-safe opaque Experiment identity`);
  }
  return value;
}

export function classifyExperimentAvailabilityV3(
  savedModelId: string,
  availableExactModelId: string,
): ExperimentAvailabilityV3 {
  return savedModelId === availableExactModelId
    ? "available"
    : "unavailable-model";
}

function randomExperimentTokenV3(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`;
}
