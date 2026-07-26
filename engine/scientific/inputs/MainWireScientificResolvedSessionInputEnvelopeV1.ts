import type {
  MainWireScientificResolvedSessionInputV1,
} from "./MainWireScientificResolvedSessionInputV1";
import {
  MAIN_WIRE_SCIENTIFIC_RESOLVED_SESSION_INPUT_V1_SCHEMA_ID,
  MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_RESOLVER_V1_ID,
  MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_V1_DIGEST_SEMANTICS,
  MAIN_WIRE_SCIENTIFIC_SESSION_INTENT_V1_SCHEMA_ID,
} from "./MainWireScientificResolvedSessionInputV1";
import {
  canonicalJsonStringify,
  cloneAndFreezeCanonicalJson,
  sameSimulationReleaseRef,
  sha256CanonicalJsonHex,
  simulationReleaseRefIssuesV1,
  type CanonicalJsonObject,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";

const SHA256_HEX_PATTERN_V1 = /^[0-9a-f]{64}$/;

/**
 * Lightweight transport/CAS validation for an already-resolved input.
 *
 * This deliberately does not re-resolve model parameters. The browser Worker
 * remains the authority that loads the full release and re-resolves every
 * parameter before restore. Main-thread callers use this function only to
 * prove canonical integrity and bind the portable envelope to an exact release
 * and checkpoint without importing the model package.
 */
export async function loadMainWireScientificResolvedSessionInputEnvelopeV1(
  value: unknown,
  expectedReleaseRef?: SimulationReleaseRef,
): Promise<MainWireScientificResolvedSessionInputV1> {
  let safe: CanonicalJsonObject;
  try {
    safe = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(value);
  } catch (error) {
    throw envelopeErrorV1(
      `input is not canonical JSON: ${errorMessageV1(error)}`,
    );
  }
  assertExactKeysV1(safe, [
    "schemaId",
    "schemaVersion",
    "releaseRef",
    "resolver",
    "sourceIntent",
    "resolvedParameters",
    "initialization",
    "claims",
    "sessionInputSha256",
  ], "resolved session input");
  if (
    safe.schemaId !== MAIN_WIRE_SCIENTIFIC_RESOLVED_SESSION_INPUT_V1_SCHEMA_ID
    || safe.schemaVersion !== 1
  ) throw envelopeErrorV1("schema identity mismatch");
  const releaseRef = loadReleaseRefV1(
    safe.releaseRef,
    "resolved session input.releaseRef",
  );
  if (
    expectedReleaseRef !== undefined
    && !sameSimulationReleaseRef(releaseRef, expectedReleaseRef)
  ) throw envelopeErrorV1("releaseRef does not match the expected release");

  const resolver = recordV1(safe.resolver, "resolved session input.resolver");
  assertExactKeysV1(resolver, [
    "id",
    "version",
    "digestSemantics",
  ], "resolved session input.resolver");
  if (
    resolver.id !== MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_RESOLVER_V1_ID
    || resolver.version !== "1.0.0"
    || resolver.digestSemantics
      !== MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_V1_DIGEST_SEMANTICS
  ) throw envelopeErrorV1("resolver identity mismatch");

  const sourceIntent = recordV1(
    safe.sourceIntent,
    "resolved session input.sourceIntent",
  );
  assertExactKeysV1(sourceIntent, [
    "schemaId",
    "schemaVersion",
    "releaseRef",
    "parameterOperations",
    "initialization",
  ], "resolved session input.sourceIntent");
  if (
    sourceIntent.schemaId !== MAIN_WIRE_SCIENTIFIC_SESSION_INTENT_V1_SCHEMA_ID
    || sourceIntent.schemaVersion !== 1
  ) throw envelopeErrorV1("source intent schema identity mismatch");
  const intentReleaseRef = loadReleaseRefV1(
    sourceIntent.releaseRef,
    "resolved session input.sourceIntent.releaseRef",
  );
  if (!sameSimulationReleaseRef(releaseRef, intentReleaseRef)) {
    throw envelopeErrorV1("source intent releaseRef mismatch");
  }
  if (!Array.isArray(sourceIntent.parameterOperations)) {
    throw envelopeErrorV1("source intent parameterOperations must be an array");
  }
  recordV1(safe.resolvedParameters, "resolved session input.resolvedParameters");
  recordV1(safe.initialization, "resolved session input.initialization");
  recordV1(safe.claims, "resolved session input.claims");

  const sessionInputSha256 = safe.sessionInputSha256;
  if (
    typeof sessionInputSha256 !== "string"
    || !SHA256_HEX_PATTERN_V1.test(sessionInputSha256)
  ) throw envelopeErrorV1("sessionInputSha256 is invalid");
  const {
    sessionInputSha256: _claimedSha256,
    ...payload
  } = safe;
  const expectedSha256 = await sha256CanonicalJsonHex(payload);
  if (sessionInputSha256 !== expectedSha256) {
    throw envelopeErrorV1(
      "sessionInputSha256 does not match the canonical payload",
    );
  }
  return safe as unknown as MainWireScientificResolvedSessionInputV1;
}

export class MainWireScientificResolvedSessionInputEnvelopeErrorV1
  extends Error {
  constructor(message: string) {
    super(`main-wire resolved input envelope rejected: ${message}`);
    this.name = "MainWireScientificResolvedSessionInputEnvelopeErrorV1";
  }
}

function loadReleaseRefV1(
  value: unknown,
  path: string,
): SimulationReleaseRef {
  const issues = simulationReleaseRefIssuesV1(value);
  if (issues.length > 0) {
    throw envelopeErrorV1(`${path}: ${issues.join("; ")}`);
  }
  return Object.freeze({
    ...(value as SimulationReleaseRef),
  });
}

function assertExactKeysV1(
  value: Readonly<Record<string, unknown>>,
  keys: readonly string[],
  path: string,
): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (canonicalJsonStringify(actual) !== canonicalJsonStringify(expected)) {
    throw envelopeErrorV1(
      `${path} must contain exactly keys ${expected.join(", ")}`,
    );
  }
}

function recordV1(
  value: unknown,
  path: string,
): Readonly<Record<string, unknown>> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
  ) throw envelopeErrorV1(`${path} must be an object`);
  return value as Readonly<Record<string, unknown>>;
}

function envelopeErrorV1(
  message: string,
): MainWireScientificResolvedSessionInputEnvelopeErrorV1 {
  return new MainWireScientificResolvedSessionInputEnvelopeErrorV1(message);
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
