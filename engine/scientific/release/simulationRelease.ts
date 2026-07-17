import {
  CANONICAL_JSON_ALGORITHM_V1,
  cloneAndFreezeCanonicalJson,
  type CanonicalJsonObject,
  type CanonicalJsonValue,
} from "@/engine/scientific/release/canonicalJson";
import {
  RELEASE_DIGEST_ALGORITHM_V1,
  SHA256_HEX_PATTERN,
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release/sha256";

export const SIMULATION_RELEASE_MANIFEST_V1_SCHEMA_ID =
  "circleheart-simulation-release-manifest-v1" as const;
export const SIMULATION_RELEASE_IDENTITY_POLICY_V1 = Object.freeze({
  canonicalJson: CANONICAL_JSON_ALGORITHM_V1,
  digest: RELEASE_DIGEST_ALGORITHM_V1,
  legacyStableHash32: "cache-only-never-release-identity" as const,
});

export const SIMULATION_RELEASE_LIFECYCLE_STATUS_VALUES_V1 = Object.freeze([
  "development",
  "candidate",
  "released",
  "retired",
] as const);
export type SimulationReleaseLifecycleStatusV1 =
  (typeof SIMULATION_RELEASE_LIFECYCLE_STATUS_VALUES_V1)[number];

export const SIMULATION_RELEASE_EVIDENCE_STATUS_VALUES_V1 = Object.freeze([
  "unverified",
  "verified-research",
  "clinically-validated",
] as const);
export type SimulationReleaseEvidenceStatusV1 =
  (typeof SIMULATION_RELEASE_EVIDENCE_STATUS_VALUES_V1)[number];

export type SimulationReleaseRefV1 = Readonly<{
  id: string;
  version: string;
  sha256: string;
}>;
export type SimulationReleaseRef = SimulationReleaseRefV1;

export type ScientificModelReleaseSectionV1 = Readonly<{
  modelId: string;
  modelVersion: string;
  assemblyId: string;
  assemblyVersion: string;
  snapshot: CanonicalJsonObject;
}>;

export type NumericalRuntimeReleaseSectionV1 = Readonly<{
  runtimeId: string;
  runtimeVersion: string;
  solverId: string;
  solverVersion: string;
  snapshot: CanonicalJsonObject;
}>;

export type StateSchemaReleaseSectionV1 = Readonly<{
  schemaId: string;
  schemaVersion: number;
  snapshot: CanonicalJsonObject;
}>;

export type ObservableSchemaReleaseSectionV1 = Readonly<{
  schemaId: string;
  schemaVersion: number;
  snapshot: CanonicalJsonObject;
}>;

export type ApprovedProtocolReleaseSectionV1 = Readonly<{
  protocolId: string;
  protocolVersion: string;
  snapshot: CanonicalJsonObject;
}>;

export type SimulationReleaseEvidenceSectionV1 = Readonly<{
  evidenceSetId: string;
  evidenceSetVersion: string;
  status: SimulationReleaseEvidenceStatusV1;
  snapshot: CanonicalJsonObject;
}>;

export type SimulationReleaseManifestV1 = Readonly<{
  schemaId: typeof SIMULATION_RELEASE_MANIFEST_V1_SCHEMA_ID;
  identityPolicy: typeof SIMULATION_RELEASE_IDENTITY_POLICY_V1;
  id: string;
  version: string;
  lifecycleStatus: SimulationReleaseLifecycleStatusV1;
  evidenceStatus: SimulationReleaseEvidenceStatusV1;
  evidence: SimulationReleaseEvidenceSectionV1;
  scientificModel: ScientificModelReleaseSectionV1;
  numericalRuntime: NumericalRuntimeReleaseSectionV1;
  stateSchema: StateSchemaReleaseSectionV1;
  observableSchema: ObservableSchemaReleaseSectionV1;
  approvedProtocols: readonly ApprovedProtocolReleaseSectionV1[];
  claims: readonly string[];
  limitations: readonly string[];
}>;

export type SimulationReleaseV1 = Readonly<{
  ref: SimulationReleaseRefV1;
  manifest: SimulationReleaseManifestV1;
}>;

type SnapshotInput = Readonly<{
  snapshot: unknown;
}>;

export type SimulationReleaseManifestInputV1 = Readonly<{
  id: string;
  version: string;
  lifecycleStatus: SimulationReleaseLifecycleStatusV1;
  evidenceStatus: SimulationReleaseEvidenceStatusV1;
  evidence: Omit<SimulationReleaseEvidenceSectionV1, "snapshot"> & SnapshotInput;
  scientificModel: Omit<ScientificModelReleaseSectionV1, "snapshot"> & SnapshotInput;
  numericalRuntime: Omit<NumericalRuntimeReleaseSectionV1, "snapshot"> & SnapshotInput;
  stateSchema: Omit<StateSchemaReleaseSectionV1, "snapshot"> & SnapshotInput;
  observableSchema: Omit<ObservableSchemaReleaseSectionV1, "snapshot"> & SnapshotInput;
  approvedProtocols: readonly (
    Omit<ApprovedProtocolReleaseSectionV1, "snapshot"> & SnapshotInput
  )[];
  claims?: readonly string[];
  limitations?: readonly string[];
}>;

export class SimulationReleaseValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    const immutableIssues = Object.freeze([...issues]);
    super(`simulation release rejected: ${immutableIssues.join("; ")}`);
    this.name = "SimulationReleaseValidationError";
    this.issues = immutableIssues;
  }
}

/**
 * Builds an immutable release from detached canonical snapshots. The digest is
 * over the complete manifest only; the external ref is therefore small while
 * the internal model/runtime/schema/protocol locks remain independently auditable.
 */
export async function createSimulationReleaseV1(
  input: SimulationReleaseManifestInputV1,
): Promise<SimulationReleaseV1> {
  let safeInput: CanonicalJsonObject;
  try {
    safeInput = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(input);
  } catch (error) {
    throw new SimulationReleaseValidationError([
      error instanceof Error ? error.message : "manifest input is not canonical JSON data",
    ]);
  }
  const inputIssues = simulationReleaseManifestInputIssues(safeInput);
  if (inputIssues.length > 0) {
    throw new SimulationReleaseValidationError(inputIssues);
  }
  const approvedProtocols = [...safeInput.approvedProtocols as CanonicalJsonValue[]]
    .sort(compareProtocolValues);
  const manifest = cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    schemaId: SIMULATION_RELEASE_MANIFEST_V1_SCHEMA_ID,
    identityPolicy: SIMULATION_RELEASE_IDENTITY_POLICY_V1,
    id: safeInput.id,
    version: safeInput.version,
    lifecycleStatus: safeInput.lifecycleStatus,
    evidenceStatus: safeInput.evidenceStatus,
    evidence: safeInput.evidence,
    scientificModel: safeInput.scientificModel,
    numericalRuntime: safeInput.numericalRuntime,
    stateSchema: safeInput.stateSchema,
    observableSchema: safeInput.observableSchema,
    approvedProtocols,
    claims: normalizedStringSet(safeInput.claims ?? []),
    limitations: normalizedStringSet(safeInput.limitations ?? []),
  });
  const issues = simulationReleaseManifestIssuesV1(manifest);
  if (issues.length > 0) throw new SimulationReleaseValidationError(issues);

  const typedManifest = manifest as unknown as SimulationReleaseManifestV1;
  const ref = cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    id: typedManifest.id,
    version: typedManifest.version,
    sha256: await sha256CanonicalJsonHex(typedManifest),
  }) as unknown as SimulationReleaseRefV1;
  return cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    ref,
    manifest: typedManifest,
  }) as unknown as SimulationReleaseV1;
}

/** Validates, digest-checks, detaches, and freezes an untrusted persisted release. */
export async function loadSimulationReleaseV1(
  value: unknown,
): Promise<SimulationReleaseV1> {
  let safe: CanonicalJsonObject;
  try {
    safe = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(value);
  } catch (error) {
    throw new SimulationReleaseValidationError([
      error instanceof Error ? error.message : "release is not canonical JSON data",
    ]);
  }

  const rootIssues = exactObjectIssues(safe, ["ref", "manifest"], "release");
  const ref = safe.ref;
  const manifest = safe.manifest;
  const issues = [
    ...rootIssues,
    ...simulationReleaseRefIssuesV1(ref),
    ...simulationReleaseManifestIssuesV1(manifest),
  ];
  if (isRecord(ref) && isRecord(manifest)) {
    if (ref.id !== manifest.id) issues.push("ref.id must match manifest.id");
    if (ref.version !== manifest.version) {
      issues.push("ref.version must match manifest.version");
    }
  }
  if (issues.length > 0) throw new SimulationReleaseValidationError(issues);

  const typedRef = ref as unknown as SimulationReleaseRefV1;
  const typedManifest = manifest as unknown as SimulationReleaseManifestV1;
  const expectedSha256 = await sha256CanonicalJsonHex(typedManifest);
  if (typedRef.sha256 !== expectedSha256) {
    throw new SimulationReleaseValidationError([
      "ref.sha256 does not match the canonical manifest digest",
    ]);
  }
  return safe as unknown as SimulationReleaseV1;
}

/** Validates and freezes a standalone case/preset reference without loading code. */
export function loadSimulationReleaseRefV1(value: unknown): SimulationReleaseRefV1 {
  let safe: CanonicalJsonObject;
  try {
    safe = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(value);
  } catch (error) {
    throw new SimulationReleaseValidationError([
      error instanceof Error ? error.message : "release ref is not canonical JSON data",
    ]);
  }
  const issues = simulationReleaseRefIssuesV1(safe);
  if (issues.length > 0) throw new SimulationReleaseValidationError(issues);
  return safe as unknown as SimulationReleaseRefV1;
}

export function simulationReleaseRefIssuesV1(value: unknown): readonly string[] {
  const issues = exactObjectIssues(value, ["id", "version", "sha256"], "ref");
  if (!isRecord(value)) return Object.freeze(issues);
  validateId(value.id, "ref.id", issues);
  validateSemver(value.version, "ref.version", issues);
  if (typeof value.sha256 !== "string" || !SHA256_HEX_PATTERN.test(value.sha256)) {
    issues.push("ref.sha256 must be a lowercase 64-character SHA-256 hex digest");
  }
  return Object.freeze(issues);
}

export function simulationReleaseManifestIssuesV1(
  value: unknown,
): readonly string[] {
  const issues = exactObjectIssues(value, [
    "schemaId",
    "identityPolicy",
    "id",
    "version",
    "lifecycleStatus",
    "evidenceStatus",
    "evidence",
    "scientificModel",
    "numericalRuntime",
    "stateSchema",
    "observableSchema",
    "approvedProtocols",
    "claims",
    "limitations",
  ], "manifest");
  if (!isRecord(value)) return Object.freeze(issues);

  if (value.schemaId !== SIMULATION_RELEASE_MANIFEST_V1_SCHEMA_ID) {
    issues.push(`manifest.schemaId must be ${SIMULATION_RELEASE_MANIFEST_V1_SCHEMA_ID}`);
  }
  issues.push(...identityPolicyIssues(value.identityPolicy));
  validateId(value.id, "manifest.id", issues);
  validateSemver(value.version, "manifest.version", issues);
  if (!SIMULATION_RELEASE_LIFECYCLE_STATUS_VALUES_V1.includes(
    value.lifecycleStatus as SimulationReleaseLifecycleStatusV1,
  )) {
    issues.push("manifest.lifecycleStatus is unsupported");
  }
  if (!SIMULATION_RELEASE_EVIDENCE_STATUS_VALUES_V1.includes(
    value.evidenceStatus as SimulationReleaseEvidenceStatusV1,
  )) {
    issues.push("manifest.evidenceStatus is unsupported");
  }
  issues.push(...evidenceSectionIssues(value.evidence));
  if (isRecord(value.evidence)
    && value.evidence.status !== value.evidenceStatus) {
    issues.push("manifest.evidence.status must match manifest.evidenceStatus");
  }
  issues.push(...scientificModelIssues(value.scientificModel));
  issues.push(...numericalRuntimeIssues(value.numericalRuntime));
  issues.push(...stateSchemaIssues(value.stateSchema));
  issues.push(...observableSchemaIssues(value.observableSchema));
  issues.push(...approvedProtocolsIssues(value.approvedProtocols));
  issues.push(...sortedStringSetIssues(value.claims, "manifest.claims"));
  issues.push(...sortedStringSetIssues(value.limitations, "manifest.limitations"));
  return Object.freeze(issues);
}

export function sameSimulationReleaseRefV1(
  left: SimulationReleaseRefV1,
  right: SimulationReleaseRefV1,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.sha256 === right.sha256;
}

export const sameSimulationReleaseRef = sameSimulationReleaseRefV1;

function identityPolicyIssues(value: unknown): string[] {
  const issues = exactObjectIssues(value, [
    "canonicalJson", "digest", "legacyStableHash32",
  ], "manifest.identityPolicy");
  if (!isRecord(value)) return issues;
  if (value.canonicalJson !== CANONICAL_JSON_ALGORITHM_V1) {
    issues.push("manifest.identityPolicy.canonicalJson is unsupported");
  }
  if (value.digest !== RELEASE_DIGEST_ALGORITHM_V1) {
    issues.push("manifest.identityPolicy.digest must be SHA-256");
  }
  if (value.legacyStableHash32 !== "cache-only-never-release-identity") {
    issues.push("manifest.identityPolicy must keep legacy stableHash cache-only");
  }
  return issues;
}

function simulationReleaseManifestInputIssues(value: unknown): string[] {
  const path = "manifest input";
  if (!isRecord(value)) return [`${path} must be an object`];
  const required = [
    "id",
    "version",
    "lifecycleStatus",
    "evidenceStatus",
    "evidence",
    "scientificModel",
    "numericalRuntime",
    "stateSchema",
    "observableSchema",
    "approvedProtocols",
  ] as const;
  const allowed = new Set([...required, "claims", "limitations"]);
  const issues: string[] = [];
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) {
      issues.push(`${path}.${key} is required`);
    }
  }
  for (const key of Object.keys(value)) {
    if (!allowed.has(key as typeof required[number] | "claims" | "limitations")) {
      issues.push(`${path}.${key} is not allowed`);
    }
  }
  if (!Array.isArray(value.approvedProtocols)) {
    issues.push(`${path}.approvedProtocols must be an array`);
  }
  return issues;
}

function evidenceSectionIssues(value: unknown): string[] {
  const path = "manifest.evidence";
  const issues = exactObjectIssues(
    value,
    ["evidenceSetId", "evidenceSetVersion", "status", "snapshot"],
    path,
  );
  if (!isRecord(value)) return issues;
  validateId(value.evidenceSetId, `${path}.evidenceSetId`, issues);
  validateSemver(value.evidenceSetVersion, `${path}.evidenceSetVersion`, issues);
  if (!SIMULATION_RELEASE_EVIDENCE_STATUS_VALUES_V1.includes(
    value.status as SimulationReleaseEvidenceStatusV1,
  )) {
    issues.push(`${path}.status is unsupported`);
  }
  validateSnapshot(value.snapshot, `${path}.snapshot`, issues);
  return issues;
}

function scientificModelIssues(value: unknown): string[] {
  const path = "manifest.scientificModel";
  const issues = exactObjectIssues(value, [
    "modelId", "modelVersion", "assemblyId", "assemblyVersion", "snapshot",
  ], path);
  if (!isRecord(value)) return issues;
  validateId(value.modelId, `${path}.modelId`, issues);
  validateSemver(value.modelVersion, `${path}.modelVersion`, issues);
  validateId(value.assemblyId, `${path}.assemblyId`, issues);
  validateSemver(value.assemblyVersion, `${path}.assemblyVersion`, issues);
  validateSnapshot(value.snapshot, `${path}.snapshot`, issues);
  return issues;
}

function numericalRuntimeIssues(value: unknown): string[] {
  const path = "manifest.numericalRuntime";
  const issues = exactObjectIssues(value, [
    "runtimeId", "runtimeVersion", "solverId", "solverVersion", "snapshot",
  ], path);
  if (!isRecord(value)) return issues;
  validateId(value.runtimeId, `${path}.runtimeId`, issues);
  validateSemver(value.runtimeVersion, `${path}.runtimeVersion`, issues);
  validateId(value.solverId, `${path}.solverId`, issues);
  validateSemver(value.solverVersion, `${path}.solverVersion`, issues);
  validateSnapshot(value.snapshot, `${path}.snapshot`, issues);
  return issues;
}

function stateSchemaIssues(value: unknown): string[] {
  return schemaSectionIssues(value, "manifest.stateSchema");
}

function observableSchemaIssues(value: unknown): string[] {
  return schemaSectionIssues(value, "manifest.observableSchema");
}

function schemaSectionIssues(value: unknown, path: string): string[] {
  const issues = exactObjectIssues(
    value,
    ["schemaId", "schemaVersion", "snapshot"],
    path,
  );
  if (!isRecord(value)) return issues;
  validateId(value.schemaId, `${path}.schemaId`, issues);
  if (!Number.isSafeInteger(value.schemaVersion) || (value.schemaVersion as number) < 1) {
    issues.push(`${path}.schemaVersion must be a positive safe integer`);
  }
  validateSnapshot(value.snapshot, `${path}.snapshot`, issues);
  return issues;
}

function approvedProtocolsIssues(value: unknown): string[] {
  const path = "manifest.approvedProtocols";
  if (!Array.isArray(value)) return [`${path} must be an array`];
  if (value.length === 0) return [`${path} must contain at least one protocol`];
  const issues: string[] = [];
  const identities = new Set<string>();
  value.forEach((protocol, index) => {
    const itemPath = `${path}[${index}]`;
    issues.push(...exactObjectIssues(
      protocol,
      ["protocolId", "protocolVersion", "snapshot"],
      itemPath,
    ));
    if (!isRecord(protocol)) return;
    validateId(protocol.protocolId, `${itemPath}.protocolId`, issues);
    validateSemver(protocol.protocolVersion, `${itemPath}.protocolVersion`, issues);
    validateSnapshot(protocol.snapshot, `${itemPath}.snapshot`, issues);
    if (typeof protocol.protocolId === "string"
      && typeof protocol.protocolVersion === "string") {
      const identity = `${protocol.protocolId}\u0000${protocol.protocolVersion}`;
      if (identities.has(identity)) issues.push(`${itemPath} duplicates a protocol identity`);
      identities.add(identity);
    }
  });
  for (let index = 1; index < value.length; index += 1) {
    if (compareProtocolValues(value[index - 1], value[index]) > 0) {
      issues.push(`${path} must be sorted by protocolId and protocolVersion`);
      break;
    }
  }
  return issues;
}

function sortedStringSetIssues(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) return [`${path} must be an array`];
  const issues: string[] = [];
  value.forEach((item, index) => {
    if (typeof item !== "string" || item.trim() === "") {
      issues.push(`${path}[${index}] must be a non-empty string`);
    } else if (item !== item.trim()) {
      issues.push(`${path}[${index}] must not contain surrounding whitespace`);
    }
  });
  if (new Set(value).size !== value.length) issues.push(`${path} must not contain duplicates`);
  const sorted = [...value].sort(compareStrings);
  if (value.some((item, index) => item !== sorted[index])) {
    issues.push(`${path} must be sorted`);
  }
  return issues;
}

function exactObjectIssues(
  value: unknown,
  expectedKeys: readonly string[],
  path: string,
): string[] {
  if (!isRecord(value)) return [`${path} must be an object`];
  const expected = new Set(expectedKeys);
  const actual = Object.keys(value);
  const issues: string[] = [];
  for (const key of expectedKeys) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) {
      issues.push(`${path}.${key} is required`);
    }
  }
  for (const key of actual) {
    if (!expected.has(key)) issues.push(`${path}.${key} is not allowed`);
  }
  return issues;
}

function validateId(value: unknown, path: string, issues: string[]): void {
  if (typeof value !== "string"
    || !/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(value)) {
    issues.push(`${path} must be a non-empty portable identifier`);
  }
}

function validateSemver(value: unknown, path: string, issues: string[]): void {
  if (typeof value !== "string" || !SEMVER_PATTERN.test(value)) {
    issues.push(`${path} must be an exact semantic version`);
  }
}

function validateSnapshot(value: unknown, path: string, issues: string[]): void {
  if (!isRecord(value)) issues.push(`${path} must be a JSON object snapshot`);
}

function normalizedStringSet(value: CanonicalJsonValue): readonly string[] {
  if (!Array.isArray(value)) return value as unknown as readonly string[];
  return [...new Set(value as unknown as readonly string[])].sort(compareStrings);
}

function compareProtocolValues(left: unknown, right: unknown): number {
  const leftRecord = isRecord(left) ? left : {};
  const rightRecord = isRecord(right) ? right : {};
  const leftId = typeof leftRecord.protocolId === "string" ? leftRecord.protocolId : "";
  const rightId = typeof rightRecord.protocolId === "string" ? rightRecord.protocolId : "";
  const idOrder = compareStrings(leftId, rightId);
  if (idOrder !== 0) return idOrder;
  const leftVersion = typeof leftRecord.protocolVersion === "string"
    ? leftRecord.protocolVersion : "";
  const rightVersion = typeof rightRecord.protocolVersion === "string"
    ? rightRecord.protocolVersion : "";
  return compareStrings(leftVersion, rightVersion);
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
