import {
  loadMainWireScientificResolvedSessionInputV1,
  loadMainWireScientificSessionIntentV1,
  resolveMainWireScientificSessionInputV1,
  type MainWireScientificResolvedSessionInputV1,
  type MainWireScientificSessionIntentV1,
} from "@/engine/scientific/inputs/MainWireScientificResolvedSessionInputV1";
import {
  cloneAndFreezeCanonicalJson,
  canonicalJsonStringify,
  loadSimulationReleaseV1,
  sameSimulationReleaseRef,
  SHA256_HEX_PATTERN,
  sha256CanonicalJsonHex,
  simulationReleaseRefIssuesV1,
  type CanonicalJsonObject,
  type SimulationReleaseRef,
  type SimulationReleaseV1,
} from "@/engine/scientific/release";
import {
  MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V3_ID,
} from "@/engine/scientific/runtime/MainWireScientificExactCheckpointV3";
import {
  loadMainWireScientificPresetDocumentV1,
  mainWireScientificPresetDocumentRefIssuesV1,
  type MainWireScientificPresetDocumentRefV1,
} from "@/engine/scientific/documents/MainWireScientificPresetDocumentV1";

export const MAIN_WIRE_SCIENTIFIC_CASE_DOCUMENT_REF_V1_SCHEMA_ID =
  "circleheart-main-wire-scientific-case-document-ref-v1" as const;
export const MAIN_WIRE_SCIENTIFIC_CASE_DOCUMENT_CONTENT_V1_SCHEMA_ID =
  "circleheart-main-wire-scientific-case-document-content-v1" as const;

export type MainWireScientificCaseDocumentRefV1 = Readonly<{
  schemaId: typeof MAIN_WIRE_SCIENTIFIC_CASE_DOCUMENT_REF_V1_SCHEMA_ID;
  sha256: string;
}>;

/** The release-approved execution protocol. Its parameters live in the release. */
export type MainWireScientificCaseProtocolDescriptorV1 = Readonly<{
  protocolId: string;
  protocolVersion: string;
}>;

export type MainWireScientificCaseColdStartDescriptorV1 = Readonly<{
  kind: "release-resolved-cold-start";
  protocolId: string;
  protocolVersion: string;
}>;

export type MainWireScientificCaseExactCheckpointStartDescriptorV1 = Readonly<{
  kind: "exact-checkpoint-v3";
  checkpointId: typeof MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V3_ID;
  checkpointSha256: string;
  releaseRef: SimulationReleaseRef;
  sessionInputSha256: string;
}>;

export type MainWireScientificCaseStartDescriptorV1 =
  | MainWireScientificCaseColdStartDescriptorV1
  | MainWireScientificCaseExactCheckpointStartDescriptorV1;

/**
 * Lineage describes immutable case revisions without conferring catalog trust.
 * In particular, retaining sourcePresetRef after an edit does not make the new
 * case an official preset or an official case.
 */
export type MainWireScientificCaseLineageV1 =
  | Readonly<{
    kind: "root";
    sourcePresetRef: null;
    parentCaseRef: null;
  }>
  | Readonly<{
    kind: "preset-instantiation";
    sourcePresetRef: MainWireScientificPresetDocumentRefV1;
    parentCaseRef: null;
  }>
  | Readonly<{
    kind: "user-edit" | "user-fork";
    sourcePresetRef: MainWireScientificPresetDocumentRefV1 | null;
    parentCaseRef: MainWireScientificCaseDocumentRefV1;
  }>;

export type MainWireScientificCaseDocumentContentV1 = Readonly<{
  schemaId: typeof MAIN_WIRE_SCIENTIFIC_CASE_DOCUMENT_CONTENT_V1_SCHEMA_ID;
  schemaVersion: 1;
  releaseRef: SimulationReleaseRef;
  sourceIntent: MainWireScientificSessionIntentV1;
  resolvedSessionInput: MainWireScientificResolvedSessionInputV1;
  protocolDescriptor: MainWireScientificCaseProtocolDescriptorV1;
  startDescriptor: MainWireScientificCaseStartDescriptorV1;
  lineage: MainWireScientificCaseLineageV1;
}>;

export type MainWireScientificCaseDocumentV1 = Readonly<{
  ref: MainWireScientificCaseDocumentRefV1;
  content: MainWireScientificCaseDocumentContentV1;
}>;

export type MainWireScientificCaseDocumentInputV1 = Readonly<{
  sourceIntent: MainWireScientificSessionIntentV1;
  resolvedSessionInput: MainWireScientificResolvedSessionInputV1;
  protocolDescriptor: MainWireScientificCaseProtocolDescriptorV1;
  startDescriptor: MainWireScientificCaseStartDescriptorV1;
  lineage: MainWireScientificCaseLineageV1;
}>;

export type MainWireScientificCaseResolutionInputV1 = Omit<
  MainWireScientificCaseDocumentInputV1,
  "resolvedSessionInput"
>;

export class MainWireScientificCaseDocumentValidationErrorV1 extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    const immutable = Object.freeze([...issues]);
    super(`main-wire scientific case document rejected: ${immutable.join("; ")}`);
    this.name = "MainWireScientificCaseDocumentValidationErrorV1";
    this.issues = immutable;
  }
}

export function mainWireScientificColdStartDescriptorV1(
  resolved: MainWireScientificResolvedSessionInputV1,
): MainWireScientificCaseColdStartDescriptorV1 {
  return cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    kind: "release-resolved-cold-start",
    protocolId: resolved.initialization.protocolId,
    protocolVersion: resolved.initialization.protocolVersion,
  }) as unknown as MainWireScientificCaseColdStartDescriptorV1;
}

/** Resolves intent before constructing the fully explicit persisted case. */
export async function resolveMainWireScientificCaseDocumentV1(
  untrustedRelease: unknown,
  input: MainWireScientificCaseResolutionInputV1,
): Promise<MainWireScientificCaseDocumentV1> {
  const release = await loadRelease(untrustedRelease);
  const sourceIntent = loadIntent(input.sourceIntent);
  const resolvedSessionInput = await resolveMainWireScientificSessionInputV1(
    release,
    sourceIntent,
  );
  return createMainWireScientificCaseDocumentV1(release, {
    sourceIntent,
    resolvedSessionInput,
    protocolDescriptor: input.protocolDescriptor,
    startDescriptor: input.startDescriptor,
    lineage: input.lineage,
  });
}

/**
 * Constructs a case from already resolved data, revalidating and re-resolving
 * it to prevent stale, rehashed, or hand-edited runtime parameters.
 */
export async function createMainWireScientificCaseDocumentV1(
  untrustedRelease: unknown,
  input: MainWireScientificCaseDocumentInputV1,
): Promise<MainWireScientificCaseDocumentV1> {
  const release = await loadRelease(untrustedRelease);
  const safeInput = cloneCaseInput(input);
  const inputIssues = exactObjectIssues(safeInput, [
    "sourceIntent",
    "resolvedSessionInput",
    "protocolDescriptor",
    "startDescriptor",
    "lineage",
  ], "case input");
  if (inputIssues.length > 0) {
    throw new MainWireScientificCaseDocumentValidationErrorV1(inputIssues);
  }

  const sourceIntent = loadIntent(safeInput.sourceIntent);
  const resolvedSessionInput = await loadResolvedInput(
    release,
    safeInput.resolvedSessionInput,
  );
  assertIdentityChain(release, sourceIntent, resolvedSessionInput);
  assertProtocolDescriptor(
    release,
    resolvedSessionInput,
    safeInput.protocolDescriptor,
  );
  assertStartDescriptor(
    release,
    resolvedSessionInput,
    safeInput.startDescriptor,
  );
  assertLineage(safeInput.lineage);

  const content = cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    schemaId: MAIN_WIRE_SCIENTIFIC_CASE_DOCUMENT_CONTENT_V1_SCHEMA_ID,
    schemaVersion: 1,
    releaseRef: release.ref,
    sourceIntent,
    resolvedSessionInput,
    protocolDescriptor: safeInput.protocolDescriptor,
    startDescriptor: safeInput.startDescriptor,
    lineage: safeInput.lineage,
  }) as unknown as MainWireScientificCaseDocumentContentV1;
  const document = cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    ref: {
      schemaId: MAIN_WIRE_SCIENTIFIC_CASE_DOCUMENT_REF_V1_SCHEMA_ID,
      sha256: await sha256CanonicalJsonHex(content),
    },
    content,
  });
  return loadMainWireScientificCaseDocumentV1(release, document);
}

/** Convenience constructor with safe preset-instantiation lineage. */
export async function createMainWireScientificCaseFromPresetV1(
  untrustedRelease: unknown,
  untrustedPreset: unknown,
  protocolDescriptor: MainWireScientificCaseProtocolDescriptorV1,
): Promise<MainWireScientificCaseDocumentV1> {
  const release = await loadRelease(untrustedRelease);
  const preset = await loadMainWireScientificPresetDocumentV1(
    release,
    untrustedPreset,
  );
  const resolvedSessionInput = await resolveMainWireScientificSessionInputV1(
    release,
    preset.content.sourceIntent,
  );
  return createMainWireScientificCaseDocumentV1(release, {
    sourceIntent: preset.content.sourceIntent,
    resolvedSessionInput,
    protocolDescriptor,
    startDescriptor:
      mainWireScientificColdStartDescriptorV1(resolvedSessionInput),
    lineage: {
      kind: "preset-instantiation",
      sourcePresetRef: preset.ref,
      parentCaseRef: null,
    },
  });
}

/** Validates the complete digest and release/input/intent identity chain. */
export async function loadMainWireScientificCaseDocumentV1(
  untrustedRelease: unknown,
  value: unknown,
): Promise<MainWireScientificCaseDocumentV1> {
  const release = await loadRelease(untrustedRelease);
  const safe = cloneDocumentCandidate(value);
  const issues = caseDocumentEnvelopeIssuesV1(safe);
  if (issues.length > 0) {
    throw new MainWireScientificCaseDocumentValidationErrorV1(issues);
  }
  const typed = safe as unknown as MainWireScientificCaseDocumentV1;
  if (!sameSimulationReleaseRef(release.ref, typed.content.releaseRef)) {
    throw new MainWireScientificCaseDocumentValidationErrorV1([
      "case releaseRef does not match the supplied exact release",
    ]);
  }
  const sourceIntent = loadIntent(typed.content.sourceIntent);
  const resolvedSessionInput = await loadResolvedInput(
    release,
    typed.content.resolvedSessionInput,
  );
  assertIdentityChain(release, sourceIntent, resolvedSessionInput);
  assertProtocolDescriptor(
    release,
    resolvedSessionInput,
    typed.content.protocolDescriptor,
  );
  assertStartDescriptor(
    release,
    resolvedSessionInput,
    typed.content.startDescriptor,
  );
  assertLineage(typed.content.lineage);

  const expectedSha256 = await sha256CanonicalJsonHex(typed.content);
  if (typed.ref.sha256 !== expectedSha256) {
    throw new MainWireScientificCaseDocumentValidationErrorV1([
      "case ref.sha256 does not match the canonical content digest",
    ]);
  }
  return safe as unknown as MainWireScientificCaseDocumentV1;
}

export function mainWireScientificCaseDocumentRefIssuesV1(
  value: unknown,
  path = "case.ref",
): readonly string[] {
  const issues = exactObjectIssues(value, ["schemaId", "sha256"], path);
  if (!isRecord(value)) return Object.freeze(issues);
  if (value.schemaId !== MAIN_WIRE_SCIENTIFIC_CASE_DOCUMENT_REF_V1_SCHEMA_ID) {
    issues.push(`${path}.schemaId is unsupported`);
  }
  if (typeof value.sha256 !== "string" || !SHA256_HEX_PATTERN.test(value.sha256)) {
    issues.push(`${path}.sha256 must be a lowercase SHA-256 digest`);
  }
  return Object.freeze(issues);
}

function caseDocumentEnvelopeIssuesV1(value: unknown): string[] {
  const issues = exactObjectIssues(value, ["ref", "content"], "case");
  if (!isRecord(value)) return issues;
  issues.push(...mainWireScientificCaseDocumentRefIssuesV1(value.ref));
  issues.push(...exactObjectIssues(value.content, [
    "schemaId",
    "schemaVersion",
    "releaseRef",
    "sourceIntent",
    "resolvedSessionInput",
    "protocolDescriptor",
    "startDescriptor",
    "lineage",
  ], "case.content"));
  if (!isRecord(value.content)) return issues;
  if (value.content.schemaId
    !== MAIN_WIRE_SCIENTIFIC_CASE_DOCUMENT_CONTENT_V1_SCHEMA_ID) {
    issues.push("case.content.schemaId is unsupported");
  }
  if (value.content.schemaVersion !== 1) {
    issues.push("case.content.schemaVersion must be 1");
  }
  issues.push(...simulationReleaseRefIssuesV1(value.content.releaseRef)
    .map((issue) => `case.content.${issue}`));
  return issues;
}

function assertIdentityChain(
  release: SimulationReleaseV1,
  sourceIntent: MainWireScientificSessionIntentV1,
  resolved: MainWireScientificResolvedSessionInputV1,
): void {
  const issues: string[] = [];
  if (!sameSimulationReleaseRef(release.ref, sourceIntent.releaseRef)) {
    issues.push("case sourceIntent.releaseRef does not match the supplied release");
  }
  if (!sameSimulationReleaseRef(release.ref, resolved.releaseRef)) {
    issues.push("case resolvedSessionInput.releaseRef does not match the supplied release");
  }
  if (canonicalJsonStringify(sourceIntent)
    !== canonicalJsonStringify(resolved.sourceIntent)) {
    issues.push("case sourceIntent does not match resolvedSessionInput.sourceIntent");
  }
  if (issues.length > 0) {
    throw new MainWireScientificCaseDocumentValidationErrorV1(issues);
  }
}

function assertProtocolDescriptor(
  release: SimulationReleaseV1,
  resolved: MainWireScientificResolvedSessionInputV1,
  value: unknown,
): asserts value is MainWireScientificCaseProtocolDescriptorV1 {
  const issues = exactObjectIssues(
    value,
    ["protocolId", "protocolVersion"],
    "case.content.protocolDescriptor",
  );
  if (isRecord(value)) {
    validatePortableId(
      value.protocolId,
      "case.content.protocolDescriptor.protocolId",
      issues,
    );
    validateSemver(
      value.protocolVersion,
      "case.content.protocolDescriptor.protocolVersion",
      issues,
    );
    const approved = release.manifest.approvedProtocols.some((candidate) =>
      candidate.protocolId === value.protocolId
      && candidate.protocolVersion === value.protocolVersion);
    if (!approved) issues.push("case execution protocol is not approved by the release");
    if (
      value.protocolId === resolved.initialization.protocolId
      && value.protocolVersion === resolved.initialization.protocolVersion
    ) issues.push("case execution protocol cannot be the cold-start initialization protocol");
  }
  if (issues.length > 0) {
    throw new MainWireScientificCaseDocumentValidationErrorV1(issues);
  }
}

function assertStartDescriptor(
  release: SimulationReleaseV1,
  resolved: MainWireScientificResolvedSessionInputV1,
  value: unknown,
): asserts value is MainWireScientificCaseStartDescriptorV1 {
  if (!isRecord(value)) {
    throw new MainWireScientificCaseDocumentValidationErrorV1([
      "case.content.startDescriptor must be an object",
    ]);
  }
  const issues: string[] = [];
  if (value.kind === "release-resolved-cold-start") {
    issues.push(...exactObjectIssues(value, [
      "kind", "protocolId", "protocolVersion",
    ], "case.content.startDescriptor"));
    if (
      value.protocolId !== resolved.initialization.protocolId
      || value.protocolVersion !== resolved.initialization.protocolVersion
    ) issues.push("case cold start does not match resolved initialization identity");
  } else if (value.kind === "exact-checkpoint-v3") {
    issues.push(...exactObjectIssues(value, [
      "kind",
      "checkpointId",
      "checkpointSha256",
      "releaseRef",
      "sessionInputSha256",
    ], "case.content.startDescriptor"));
    if (value.checkpointId
      !== MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V3_ID) {
      issues.push("case exact-checkpoint ID is unsupported");
    }
    validateSha256(
      value.checkpointSha256,
      "case.content.startDescriptor.checkpointSha256",
      issues,
    );
    issues.push(...simulationReleaseRefIssuesV1(value.releaseRef)
      .map((issue) => `case.content.startDescriptor.${issue}`));
    if (isRecord(value.releaseRef)
      && !sameSimulationReleaseRef(
        release.ref,
        value.releaseRef as unknown as SimulationReleaseRef,
      )) issues.push("case exact-checkpoint releaseRef mismatch");
    validateSha256(
      value.sessionInputSha256,
      "case.content.startDescriptor.sessionInputSha256",
      issues,
    );
    if (value.sessionInputSha256 !== resolved.sessionInputSha256) {
      issues.push("case exact-checkpoint session-input identity mismatch");
    }
  } else {
    issues.push("case.content.startDescriptor.kind is unsupported");
  }
  if (issues.length > 0) {
    throw new MainWireScientificCaseDocumentValidationErrorV1(issues);
  }
}

function assertLineage(value: unknown): asserts value is MainWireScientificCaseLineageV1 {
  const path = "case.content.lineage";
  const issues = exactObjectIssues(
    value,
    ["kind", "sourcePresetRef", "parentCaseRef"],
    path,
  );
  if (isRecord(value)) {
    if (value.kind === "root") {
      if (value.sourcePresetRef !== null || value.parentCaseRef !== null) {
        issues.push("root case lineage cannot have preset or parent references");
      }
    } else if (value.kind === "preset-instantiation") {
      issues.push(...mainWireScientificPresetDocumentRefIssuesV1(
        value.sourcePresetRef,
        `${path}.sourcePresetRef`,
      ));
      if (value.parentCaseRef !== null) {
        issues.push("preset-instantiation lineage cannot have a parent case");
      }
    } else if (value.kind === "user-edit" || value.kind === "user-fork") {
      if (value.sourcePresetRef !== null) {
        issues.push(...mainWireScientificPresetDocumentRefIssuesV1(
          value.sourcePresetRef,
          `${path}.sourcePresetRef`,
        ));
      }
      issues.push(...mainWireScientificCaseDocumentRefIssuesV1(
        value.parentCaseRef,
        `${path}.parentCaseRef`,
      ));
    } else {
      issues.push(`${path}.kind is unsupported`);
    }
  }
  if (issues.length > 0) {
    throw new MainWireScientificCaseDocumentValidationErrorV1(issues);
  }
}

function loadIntent(value: unknown): MainWireScientificSessionIntentV1 {
  try {
    return loadMainWireScientificSessionIntentV1(value);
  } catch (error) {
    throw new MainWireScientificCaseDocumentValidationErrorV1([
      `invalid source intent: ${error instanceof Error ? error.message : String(error)}`,
    ]);
  }
}

async function loadResolvedInput(
  release: SimulationReleaseV1,
  value: unknown,
): Promise<MainWireScientificResolvedSessionInputV1> {
  try {
    return await loadMainWireScientificResolvedSessionInputV1(release, value);
  } catch (error) {
    throw new MainWireScientificCaseDocumentValidationErrorV1([
      `invalid resolved session input: ${error instanceof Error ? error.message : String(error)}`,
    ]);
  }
}

async function loadRelease(value: unknown): Promise<SimulationReleaseV1> {
  try {
    return await loadSimulationReleaseV1(value);
  } catch (error) {
    throw new MainWireScientificCaseDocumentValidationErrorV1([
      `invalid release: ${error instanceof Error ? error.message : String(error)}`,
    ]);
  }
}

function cloneCaseInput(value: unknown): CanonicalJsonObject {
  try {
    return cloneAndFreezeCanonicalJson<CanonicalJsonObject>(value);
  } catch (error) {
    throw new MainWireScientificCaseDocumentValidationErrorV1([
      `non-canonical case input: ${error instanceof Error ? error.message : String(error)}`,
    ]);
  }
}

function cloneDocumentCandidate(value: unknown): CanonicalJsonObject {
  try {
    return cloneAndFreezeCanonicalJson<CanonicalJsonObject>(value);
  } catch (error) {
    throw new MainWireScientificCaseDocumentValidationErrorV1([
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

function validateSha256(value: unknown, path: string, issues: string[]): void {
  if (typeof value !== "string" || !SHA256_HEX_PATTERN.test(value)) {
    issues.push(`${path} must be a lowercase SHA-256 digest`);
  }
}

function validatePortableId(value: unknown, path: string, issues: string[]): void {
  if (
    typeof value !== "string"
    || !/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(value)
  ) issues.push(`${path} must be a portable identifier`);
}

function validateSemver(value: unknown, path: string, issues: string[]): void {
  if (typeof value !== "string" || !/^\d+\.\d+\.\d+$/.test(value)) {
    issues.push(`${path} must be a semantic version`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
