import {
  loadMainWireScientificSessionIntentV1,
  resolveMainWireScientificSessionInputV1,
  type MainWireScientificSessionIntentV1,
} from "@/engine/scientific/inputs/MainWireScientificResolvedSessionInputV1";
import {
  cloneAndFreezeCanonicalJson,
  loadSimulationReleaseV1,
  sameSimulationReleaseRef,
  SHA256_HEX_PATTERN,
  sha256CanonicalJsonHex,
  simulationReleaseRefIssuesV1,
  type CanonicalJsonObject,
  type SimulationReleaseRef,
  type SimulationReleaseV1,
} from "@/engine/scientific/release";

export const MAIN_WIRE_SCIENTIFIC_PRESET_DOCUMENT_REF_V1_SCHEMA_ID =
  "circleheart-main-wire-scientific-preset-document-ref-v1" as const;
export const MAIN_WIRE_SCIENTIFIC_PRESET_DOCUMENT_CONTENT_V1_SCHEMA_ID =
  "circleheart-main-wire-scientific-preset-document-content-v1" as const;

export type MainWireScientificPresetDocumentRefV1 = Readonly<{
  schemaId: typeof MAIN_WIRE_SCIENTIFIC_PRESET_DOCUMENT_REF_V1_SCHEMA_ID;
  sha256: string;
}>;

/**
 * A preset is deliberately only immutable scientific intent. Display labels,
 * layout, catalog placement, and official trust are external concerns and are
 * therefore absent from the content-addressed document.
 */
export type MainWireScientificPresetDocumentContentV1 = Readonly<{
  schemaId: typeof MAIN_WIRE_SCIENTIFIC_PRESET_DOCUMENT_CONTENT_V1_SCHEMA_ID;
  schemaVersion: 1;
  releaseRef: SimulationReleaseRef;
  sourceIntent: MainWireScientificSessionIntentV1;
}>;

export type MainWireScientificPresetDocumentV1 = Readonly<{
  ref: MainWireScientificPresetDocumentRefV1;
  content: MainWireScientificPresetDocumentContentV1;
}>;

export class MainWireScientificPresetDocumentValidationErrorV1 extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    const immutable = Object.freeze([...issues]);
    super(`main-wire scientific preset document rejected: ${immutable.join("; ")}`);
    this.name = "MainWireScientificPresetDocumentValidationErrorV1";
    this.issues = immutable;
  }
}

/** Creates a content-addressed immutable intent preset for an exact release. */
export async function createMainWireScientificPresetDocumentV1(
  untrustedRelease: unknown,
  untrustedIntent: unknown,
): Promise<MainWireScientificPresetDocumentV1> {
  const release = await loadRelease(untrustedRelease);
  const sourceIntent = loadIntentForRelease(release, untrustedIntent);

  // Resolution proves that this is a supported main-wire intent for this exact
  // release. The resolved values intentionally do not become preset content.
  await resolveMainWireScientificSessionInputV1(release, sourceIntent);

  const content = cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    schemaId: MAIN_WIRE_SCIENTIFIC_PRESET_DOCUMENT_CONTENT_V1_SCHEMA_ID,
    schemaVersion: 1,
    releaseRef: release.ref,
    sourceIntent,
  }) as unknown as MainWireScientificPresetDocumentContentV1;
  const document = cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    ref: {
      schemaId: MAIN_WIRE_SCIENTIFIC_PRESET_DOCUMENT_REF_V1_SCHEMA_ID,
      sha256: await sha256CanonicalJsonHex(content),
    },
    content,
  });
  return loadMainWireScientificPresetDocumentV1(release, document);
}

/**
 * Strictly validates content identity and exact-release intent semantics.
 * Catalog provenance (including whether a preset is official) must be checked
 * by the caller's independently signed or pinned catalog SHA chain.
 */
export async function loadMainWireScientificPresetDocumentV1(
  untrustedRelease: unknown,
  value: unknown,
): Promise<MainWireScientificPresetDocumentV1> {
  const release = await loadRelease(untrustedRelease);
  const safe = cloneDocumentCandidate(value);
  const issues = presetDocumentEnvelopeIssuesV1(safe);
  if (issues.length > 0) {
    throw new MainWireScientificPresetDocumentValidationErrorV1(issues);
  }

  const typed = safe as unknown as MainWireScientificPresetDocumentV1;
  if (!sameSimulationReleaseRef(release.ref, typed.content.releaseRef)) {
    throw new MainWireScientificPresetDocumentValidationErrorV1([
      "preset releaseRef does not match the supplied exact release",
    ]);
  }
  const sourceIntent = loadIntentForRelease(release, typed.content.sourceIntent);
  await resolveMainWireScientificSessionInputV1(release, sourceIntent);

  const expectedSha256 = await sha256CanonicalJsonHex(typed.content);
  if (typed.ref.sha256 !== expectedSha256) {
    throw new MainWireScientificPresetDocumentValidationErrorV1([
      "preset ref.sha256 does not match the canonical content digest",
    ]);
  }
  return safe as unknown as MainWireScientificPresetDocumentV1;
}

export function mainWireScientificPresetDocumentRefIssuesV1(
  value: unknown,
  path = "preset.ref",
): readonly string[] {
  const issues = exactObjectIssues(value, ["schemaId", "sha256"], path);
  if (!isRecord(value)) return Object.freeze(issues);
  if (value.schemaId !== MAIN_WIRE_SCIENTIFIC_PRESET_DOCUMENT_REF_V1_SCHEMA_ID) {
    issues.push(`${path}.schemaId is unsupported`);
  }
  if (typeof value.sha256 !== "string" || !SHA256_HEX_PATTERN.test(value.sha256)) {
    issues.push(`${path}.sha256 must be a lowercase SHA-256 digest`);
  }
  return Object.freeze(issues);
}

function presetDocumentEnvelopeIssuesV1(value: unknown): string[] {
  const issues = exactObjectIssues(value, ["ref", "content"], "preset");
  if (!isRecord(value)) return issues;
  issues.push(...mainWireScientificPresetDocumentRefIssuesV1(value.ref));
  issues.push(...exactObjectIssues(value.content, [
    "schemaId",
    "schemaVersion",
    "releaseRef",
    "sourceIntent",
  ], "preset.content"));
  if (!isRecord(value.content)) return issues;
  if (value.content.schemaId
    !== MAIN_WIRE_SCIENTIFIC_PRESET_DOCUMENT_CONTENT_V1_SCHEMA_ID) {
    issues.push("preset.content.schemaId is unsupported");
  }
  if (value.content.schemaVersion !== 1) {
    issues.push("preset.content.schemaVersion must be 1");
  }
  issues.push(...simulationReleaseRefIssuesV1(value.content.releaseRef)
    .map((issue) => `preset.content.${issue}`));
  return issues;
}

function loadIntentForRelease(
  release: SimulationReleaseV1,
  value: unknown,
): MainWireScientificSessionIntentV1 {
  const intent = loadMainWireScientificSessionIntentV1(value);
  if (!sameSimulationReleaseRef(release.ref, intent.releaseRef)) {
    throw new MainWireScientificPresetDocumentValidationErrorV1([
      "preset sourceIntent.releaseRef does not match the supplied exact release",
    ]);
  }
  return intent;
}

async function loadRelease(value: unknown): Promise<SimulationReleaseV1> {
  try {
    return await loadSimulationReleaseV1(value);
  } catch (error) {
    throw new MainWireScientificPresetDocumentValidationErrorV1([
      `invalid release: ${error instanceof Error ? error.message : String(error)}`,
    ]);
  }
}

function cloneDocumentCandidate(value: unknown): CanonicalJsonObject {
  try {
    return cloneAndFreezeCanonicalJson<CanonicalJsonObject>(value);
  } catch (error) {
    throw new MainWireScientificPresetDocumentValidationErrorV1([
      `non-canonical JSON input: ${error instanceof Error ? error.message : String(error)}`,
    ]);
  }
}

function exactObjectIssues(
  value: unknown,
  expectedKeys: readonly string[],
  path: string,
): string[] {
  if (!isRecord(value)) return [`${path} must be an object`];
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  return JSON.stringify(actual) === JSON.stringify(expected)
    ? []
    : [`${path} must contain exactly keys ${expected.join(", ")}`];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
