import {
  cloneAndFreezeCanonicalJson,
  SHA256_HEX_PATTERN,
  simulationReleaseRefIssuesV1,
  type CanonicalJsonObject,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";

export const OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_SCHEMA_ID =
  "circleheart-official-preset-document-v1" as const;
export const OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID =
  "circleheart/official-healthy-periodic" as const;
export const OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION =
  "1.0.0" as const;
export const OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_MANIFEST_PATH =
  "data/scientific/presets/official-healthy-periodic-v1.json" as const;
export const OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_SCHEMA_ID =
  "circleheart-official-preset-catalog-v1" as const;
export const OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_PATH =
  "data/scientific/presets/catalog-v1.json" as const;
export const OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_V1_ASSET_PATH =
  "data/scientific/checkpoints/0.2.0/normal-adult-periodic-steady-v1.json" as const;

/** Compile-time trust anchor mirrored by the bundled application catalog. */
export const OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING =
  Object.freeze({
    releaseRef: Object.freeze({
      id: "circleheart/adult-five-wall-noncoronary" as const,
      version: "0.2.0" as const,
      sha256:
        "75a4aac4458de6f03db4fe3d43a919a9d06ec34e5f18e2ae48fbf63475f9e7e4" as const,
    }),
    manifestByteLength: 4_263 as const,
    manifestRawFileSha256:
      "eb40d42aa4e8bde3b696eb1257428d2022826137e1f2c994c75f59188e451ca0" as const,
    checkpointByteLength: 20_763 as const,
    checkpointRawFileSha256:
      "dbe660999758177aa7c72f92ce8da3bf4378a69d11f42454724a4f923d767ea2" as const,
    checkpointSha256:
      "2f1c0b477905b07dfefc8a37ee7e1b7ab3d856d7f017770c6bc92a22fb529ff0" as const,
  });

export type OfficialHealthyPeriodicClosureSummaryV1 = Readonly<{
  elapsedTimeSec: number;
  maximumNormalizedDelta: number;
  worstGroup: string;
  worstPath: string;
}>;

export type OfficialHealthyPeriodicBeatEvidenceV1 = Readonly<{
  beatIndex: number;
  period1: OfficialHealthyPeriodicClosureSummaryV1;
  period2: OfficialHealthyPeriodicClosureSummaryV1 | null;
}>;

/**
 * Immutable catalog document external to SimulationRelease. The one-way
 * releaseRef -> checkpoint relation is intentionally absent from the release
 * manifest, avoiding a release/checkpoint digest cycle. A browser catalog may
 * fetch this small document first and lazily fetch the checkpoint bytes.
 */
export type OfficialHealthyPeriodicCheckpointPresetDocumentV1 = Readonly<{
  schema: Readonly<{
    id: typeof OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_SCHEMA_ID;
    version: 1;
  }>;
  preset: Readonly<{
    id: typeof OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID;
    version: typeof OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION;
    displayName: "Healthy periodic baseline";
    catalogVisibility: "official";
    caseClass: "healthy-reference";
  }>;
  releaseRef: SimulationReleaseRef;
  intent: Readonly<{
    role: "application-catalog-healthy-periodic-research-baseline";
    subject: "normal-adult-periodic-steady";
    modelScope: "five-wall-noncoronary";
  }>;
  parameterDocument: Readonly<{
    kind: "simulation-release-embedded-snapshot";
    releaseSection: "scientificModel.snapshot";
    fixedCanonicalParameterizationOnly: true;
    independentParameterOverridesApplied: false;
  }>;
  protocol: Readonly<{
    id: "main-wire-normal-adult-five-wall-periodic-steady-v1";
    version: "1.0.0";
    commandProgression:
      "advance-exactly-one-complete-beat-per-call-at-fixed-session-anchor-phase";
    dtSec: number;
    stepsPerBeat: number;
    maximumBeatCount: number;
    result: Readonly<{
      status: "period1-converged";
      periodicSteadyStateClaimed: true;
      period2OrbitSuspected: false;
      completedBeatCount: number;
      anchorAcceptedTimeSec: number;
      anchorPhase01: number;
      terminalAcceptedTimeSec: number;
      terminalRevision: number;
      evidenceBeatIndices: readonly number[];
      latestPeriod1MaximumNormalizedDelta: number;
      latestPeriod2MaximumNormalizedDelta: number | null;
      retainedBeatClosure: readonly OfficialHealthyPeriodicBeatEvidenceV1[];
      terminalTotalBloodVolumeErrorMl: number;
    }>;
  }>;
  initialization: Readonly<{
    kind: "exact-checkpoint";
    checkpoint: Readonly<{
      path: typeof OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_V1_ASSET_PATH;
      mediaType: "application/json";
      byteLength: number;
      rawFileSha256: string;
      rawFileDigestSemantics: "raw-file-bytes-sha256";
      checkpointId: "main-wire-scientific-session-exact-checkpoint-v2";
      checkpointSchemaVersion: 2;
      checkpointEnvelopeSha256: string;
    }>;
    compatibility: "identical-full-simulation-release-ref-only";
    semanticReresolutionAllowed: false;
    warmStart: false;
    periodicTrackerIncluded: true;
  }>;
  claims: Readonly<{
    officialDesignation: "application-catalog-only";
    numericalPeriod1ClassificationOnly: true;
    exactCheckpointContinuation: true;
    fixedCanonicalParameterizationOnly: true;
    diseasePresetGeneralizationAllowed: false;
    parameterizedCheckpointRequiresV3SessionInputSha256Binding: true;
    parameterSearchPerformed: false;
    parameterFittingPerformed: false;
    clinicalValidationClaimed: false;
    patientSpecificFitClaimed: false;
    populationReferenceRangeValidated: false;
  }>;
  limitations: readonly [
    "exact restore requires the identical complete SimulationReleaseRef",
    "numerical period-1 closure is not clinical validation",
    "no coronary circulation, device graph, or multipatch physiology",
    "not a patient-specific or population-reference fit",
    "checkpoint V2 must not be reused for valve-disease or other parameterized presets",
  ];
}>;

export type OfficialScientificPresetCatalogV1 = Readonly<{
  schema: Readonly<{
    id: typeof OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_SCHEMA_ID;
    version: 1;
  }>;
  entries: readonly [Readonly<{
    presetId: typeof OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID;
    presetVersion:
      typeof OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION;
    manifest: Readonly<{
      path:
        typeof OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_MANIFEST_PATH;
      mediaType: "application/json";
      byteLength: number;
      rawFileSha256: string;
      rawFileDigestSemantics: "raw-file-bytes-sha256";
    }>;
  }>];
}>;

export class OfficialHealthyPeriodicCheckpointPresetValidationErrorV1
  extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    const immutable = Object.freeze([...issues]);
    super(`official healthy periodic preset rejected: ${immutable.join("; ")}`);
    this.name = "OfficialHealthyPeriodicCheckpointPresetValidationErrorV1";
    this.issues = immutable;
  }
}

/** Browser-neutral fail-closed loader for later Worker catalog wiring. */
export function loadOfficialHealthyPeriodicCheckpointPresetDocumentV1(
  value: unknown,
): OfficialHealthyPeriodicCheckpointPresetDocumentV1 {
  let safe: CanonicalJsonObject;
  try {
    safe = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(value);
  } catch (error) {
    throw new OfficialHealthyPeriodicCheckpointPresetValidationErrorV1([
      error instanceof Error ? error.message : "document is not canonical JSON data",
    ]);
  }
  const issues = documentIssues(safe);
  if (issues.length > 0) {
    throw new OfficialHealthyPeriodicCheckpointPresetValidationErrorV1(issues);
  }
  return safe as unknown as OfficialHealthyPeriodicCheckpointPresetDocumentV1;
}

/** Small external root reference; it deliberately contains no self digest. */
export function loadOfficialScientificPresetCatalogV1(
  value: unknown,
): OfficialScientificPresetCatalogV1 {
  let safe: CanonicalJsonObject;
  try {
    safe = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(value);
  } catch (error) {
    throw new OfficialHealthyPeriodicCheckpointPresetValidationErrorV1([
      error instanceof Error ? error.message : "catalog is not canonical JSON data",
    ]);
  }
  const issues = catalogIssues(safe);
  if (issues.length > 0) {
    throw new OfficialHealthyPeriodicCheckpointPresetValidationErrorV1(issues);
  }
  return safe as unknown as OfficialScientificPresetCatalogV1;
}

function catalogIssues(value: unknown): string[] {
  const issues = exactObjectIssues(value, ["schema", "entries"], "catalog");
  if (!isRecord(value)) return issues;
  issues.push(...fixedObjectIssues(value.schema, "catalog.schema", {
    id: OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_SCHEMA_ID,
    version: 1,
  }));
  if (!Array.isArray(value.entries) || value.entries.length !== 1) {
    issues.push("catalog.entries must contain the one current official preset");
    return issues;
  }
  const entry = value.entries[0];
  issues.push(...exactObjectIssues(
    entry,
    ["presetId", "presetVersion", "manifest"],
    "catalog.entries[0]",
  ));
  if (!isRecord(entry)) return issues;
  if (entry.presetId !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID) {
    issues.push("catalog.entries[0].presetId is unsupported");
  }
  if (entry.presetVersion
    !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION) {
    issues.push("catalog.entries[0].presetVersion is unsupported");
  }
  const manifestPath = "catalog.entries[0].manifest";
  issues.push(...exactObjectIssues(entry.manifest, [
    "path", "mediaType", "byteLength", "rawFileSha256",
    "rawFileDigestSemantics",
  ], manifestPath));
  if (!isRecord(entry.manifest)) return issues;
  if (entry.manifest.path
    !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_MANIFEST_PATH) {
    issues.push(`${manifestPath}.path is unsupported`);
  }
  if (entry.manifest.mediaType !== "application/json") {
    issues.push(`${manifestPath}.mediaType must be application/json`);
  }
  positiveSafeInteger(
    entry.manifest.byteLength,
    `${manifestPath}.byteLength`,
    issues,
  );
  if (typeof entry.manifest.rawFileSha256 !== "string"
    || !SHA256_HEX_PATTERN.test(entry.manifest.rawFileSha256)) {
    issues.push(`${manifestPath}.rawFileSha256 must be a SHA-256 digest`);
  }
  if (entry.manifest.rawFileDigestSemantics !== "raw-file-bytes-sha256") {
    issues.push(`${manifestPath}.rawFileDigestSemantics is unsupported`);
  }
  return issues;
}

function documentIssues(value: unknown): string[] {
  const issues = exactObjectIssues(value, [
    "schema",
    "preset",
    "releaseRef",
    "intent",
    "parameterDocument",
    "protocol",
    "initialization",
    "claims",
    "limitations",
  ], "document");
  if (!isRecord(value)) return issues;
  issues.push(...fixedObjectIssues(value.schema, "document.schema", {
    id: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_SCHEMA_ID,
    version: 1,
  }));
  issues.push(...fixedObjectIssues(value.preset, "document.preset", {
    id: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID,
    version: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION,
    displayName: "Healthy periodic baseline",
    catalogVisibility: "official",
    caseClass: "healthy-reference",
  }));
  issues.push(...simulationReleaseRefIssuesV1(value.releaseRef));
  issues.push(...fixedObjectIssues(value.intent, "document.intent", {
    role: "application-catalog-healthy-periodic-research-baseline",
    subject: "normal-adult-periodic-steady",
    modelScope: "five-wall-noncoronary",
  }));
  issues.push(...fixedObjectIssues(
    value.parameterDocument,
    "document.parameterDocument",
    {
      kind: "simulation-release-embedded-snapshot",
      releaseSection: "scientificModel.snapshot",
      fixedCanonicalParameterizationOnly: true,
      independentParameterOverridesApplied: false,
    },
  ));
  issues.push(...protocolIssues(value.protocol));
  issues.push(...initializationIssues(value.initialization));
  issues.push(...fixedObjectIssues(value.claims, "document.claims", {
    officialDesignation: "application-catalog-only",
    numericalPeriod1ClassificationOnly: true,
    exactCheckpointContinuation: true,
    fixedCanonicalParameterizationOnly: true,
    diseasePresetGeneralizationAllowed: false,
    parameterizedCheckpointRequiresV3SessionInputSha256Binding: true,
    parameterSearchPerformed: false,
    parameterFittingPerformed: false,
    clinicalValidationClaimed: false,
    patientSpecificFitClaimed: false,
    populationReferenceRangeValidated: false,
  }));
  const expectedLimitations = [
    "exact restore requires the identical complete SimulationReleaseRef",
    "numerical period-1 closure is not clinical validation",
    "no coronary circulation, device graph, or multipatch physiology",
    "not a patient-specific or population-reference fit",
    "checkpoint V2 must not be reused for valve-disease or other parameterized presets",
  ];
  if (!Array.isArray(value.limitations)
    || value.limitations.length !== expectedLimitations.length
    || value.limitations.some((entry, index) =>
      entry !== expectedLimitations[index])) {
    issues.push("document.limitations must match the bounded claim set");
  }
  return issues;
}

function protocolIssues(value: unknown): string[] {
  const path = "document.protocol";
  const issues = exactObjectIssues(value, [
    "id", "version", "commandProgression", "dtSec", "stepsPerBeat",
    "maximumBeatCount", "result",
  ], path);
  if (!isRecord(value)) return issues;
  if (value.id !== "main-wire-normal-adult-five-wall-periodic-steady-v1") {
    issues.push(`${path}.id is unsupported`);
  }
  if (value.version !== "1.0.0") issues.push(`${path}.version must be 1.0.0`);
  if (value.commandProgression
    !== "advance-exactly-one-complete-beat-per-call-at-fixed-session-anchor-phase") {
    issues.push(`${path}.commandProgression is unsupported`);
  }
  positiveFinite(value.dtSec, `${path}.dtSec`, issues);
  positiveSafeInteger(value.stepsPerBeat, `${path}.stepsPerBeat`, issues);
  positiveSafeInteger(value.maximumBeatCount, `${path}.maximumBeatCount`, issues);
  issues.push(...resultIssues(value.result));
  return issues;
}

function resultIssues(value: unknown): string[] {
  const path = "document.protocol.result";
  const issues = exactObjectIssues(value, [
    "status",
    "periodicSteadyStateClaimed",
    "period2OrbitSuspected",
    "completedBeatCount",
    "anchorAcceptedTimeSec",
    "anchorPhase01",
    "terminalAcceptedTimeSec",
    "terminalRevision",
    "evidenceBeatIndices",
    "latestPeriod1MaximumNormalizedDelta",
    "latestPeriod2MaximumNormalizedDelta",
    "retainedBeatClosure",
    "terminalTotalBloodVolumeErrorMl",
  ], path);
  if (!isRecord(value)) return issues;
  if (value.status !== "period1-converged") {
    issues.push(`${path}.status must be period1-converged`);
  }
  if (value.periodicSteadyStateClaimed !== true) {
    issues.push(`${path}.periodicSteadyStateClaimed must be true`);
  }
  if (value.period2OrbitSuspected !== false) {
    issues.push(`${path}.period2OrbitSuspected must be false`);
  }
  positiveSafeInteger(value.completedBeatCount, `${path}.completedBeatCount`, issues);
  nonNegativeFinite(value.anchorAcceptedTimeSec, `${path}.anchorAcceptedTimeSec`, issues);
  if (!isFiniteNumber(value.anchorPhase01)
    || value.anchorPhase01 < 0 || value.anchorPhase01 >= 1) {
    issues.push(`${path}.anchorPhase01 must be in [0, 1)`);
  }
  nonNegativeFinite(value.terminalAcceptedTimeSec, `${path}.terminalAcceptedTimeSec`, issues);
  nonNegativeSafeInteger(value.terminalRevision, `${path}.terminalRevision`, issues);
  if (!Array.isArray(value.evidenceBeatIndices)
    || value.evidenceBeatIndices.length === 0
    || value.evidenceBeatIndices.some((beat) =>
      !Number.isSafeInteger(beat) || beat <= 0)) {
    issues.push(`${path}.evidenceBeatIndices must contain positive beat indices`);
  }
  nonNegativeFinite(
    value.latestPeriod1MaximumNormalizedDelta,
    `${path}.latestPeriod1MaximumNormalizedDelta`,
    issues,
  );
  if (value.latestPeriod2MaximumNormalizedDelta !== null) {
    nonNegativeFinite(
      value.latestPeriod2MaximumNormalizedDelta,
      `${path}.latestPeriod2MaximumNormalizedDelta`,
      issues,
    );
  }
  if (!Array.isArray(value.retainedBeatClosure)
    || value.retainedBeatClosure.length === 0) {
    issues.push(`${path}.retainedBeatClosure must be a non-empty array`);
  } else {
    value.retainedBeatClosure.forEach((entry, index) => {
      issues.push(...beatEvidenceIssues(entry, `${path}.retainedBeatClosure[${index}]`));
    });
  }
  finite(value.terminalTotalBloodVolumeErrorMl, `${path}.terminalTotalBloodVolumeErrorMl`, issues);
  return issues;
}

function initializationIssues(value: unknown): string[] {
  const path = "document.initialization";
  const issues = exactObjectIssues(value, [
    "kind", "checkpoint", "compatibility", "semanticReresolutionAllowed",
    "warmStart", "periodicTrackerIncluded",
  ], path);
  if (!isRecord(value)) return issues;
  if (value.kind !== "exact-checkpoint") issues.push(`${path}.kind must be exact-checkpoint`);
  issues.push(...checkpointIssues(value.checkpoint));
  if (value.compatibility !== "identical-full-simulation-release-ref-only") {
    issues.push(`${path}.compatibility is unsupported`);
  }
  if (value.semanticReresolutionAllowed !== false) {
    issues.push(`${path}.semanticReresolutionAllowed must be false`);
  }
  if (value.warmStart !== false) issues.push(`${path}.warmStart must be false`);
  if (value.periodicTrackerIncluded !== true) {
    issues.push(`${path}.periodicTrackerIncluded must be true`);
  }
  return issues;
}

function checkpointIssues(value: unknown): string[] {
  const path = "document.initialization.checkpoint";
  const issues = exactObjectIssues(value, [
    "path", "mediaType", "byteLength", "rawFileSha256",
    "rawFileDigestSemantics", "checkpointId", "checkpointSchemaVersion",
    "checkpointEnvelopeSha256",
  ], path);
  if (!isRecord(value)) return issues;
  if (value.path !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_V1_ASSET_PATH) {
    issues.push(`${path}.path is unsupported`);
  }
  if (value.mediaType !== "application/json") {
    issues.push(`${path}.mediaType must be application/json`);
  }
  positiveSafeInteger(value.byteLength, `${path}.byteLength`, issues);
  if (typeof value.rawFileSha256 !== "string"
    || !SHA256_HEX_PATTERN.test(value.rawFileSha256)) {
    issues.push(`${path}.rawFileSha256 must be a lowercase SHA-256 digest`);
  }
  if (value.rawFileDigestSemantics !== "raw-file-bytes-sha256") {
    issues.push(`${path}.rawFileDigestSemantics is unsupported`);
  }
  if (value.checkpointId !== "main-wire-scientific-session-exact-checkpoint-v2") {
    issues.push(`${path}.checkpointId is unsupported`);
  }
  if (value.checkpointSchemaVersion !== 2) {
    issues.push(`${path}.checkpointSchemaVersion must be 2`);
  }
  if (typeof value.checkpointEnvelopeSha256 !== "string"
    || !SHA256_HEX_PATTERN.test(value.checkpointEnvelopeSha256)) {
    issues.push(`${path}.checkpointEnvelopeSha256 must be a SHA-256 digest`);
  }
  return issues;
}

function beatEvidenceIssues(value: unknown, path: string): string[] {
  const issues = exactObjectIssues(value, ["beatIndex", "period1", "period2"], path);
  if (!isRecord(value)) return issues;
  positiveSafeInteger(value.beatIndex, `${path}.beatIndex`, issues);
  issues.push(...closureSummaryIssues(value.period1, `${path}.period1`));
  if (value.period2 !== null) {
    issues.push(...closureSummaryIssues(value.period2, `${path}.period2`));
  }
  return issues;
}

function closureSummaryIssues(value: unknown, path: string): string[] {
  const issues = exactObjectIssues(value, [
    "elapsedTimeSec", "maximumNormalizedDelta", "worstGroup", "worstPath",
  ], path);
  if (!isRecord(value)) return issues;
  positiveFinite(value.elapsedTimeSec, `${path}.elapsedTimeSec`, issues);
  nonNegativeFinite(value.maximumNormalizedDelta, `${path}.maximumNormalizedDelta`, issues);
  if (typeof value.worstGroup !== "string" || value.worstGroup.length === 0) {
    issues.push(`${path}.worstGroup must be a non-empty string`);
  }
  if (typeof value.worstPath !== "string" || value.worstPath.length === 0) {
    issues.push(`${path}.worstPath must be a non-empty string`);
  }
  return issues;
}

function fixedObjectIssues(
  value: unknown,
  path: string,
  expected: Readonly<Record<string, string | number | boolean>>,
): string[] {
  const issues = exactObjectIssues(value, Object.keys(expected), path);
  if (!isRecord(value)) return issues;
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (value[key] !== expectedValue) issues.push(`${path}.${key} is unsupported`);
  }
  return issues;
}

function exactObjectIssues(
  value: unknown,
  keys: readonly string[],
  path: string,
): string[] {
  if (!isRecord(value)) return [`${path} must be an object`];
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
    ? []
    : [`${path} must have exactly keys ${expected.join(", ")}`];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function finite(value: unknown, path: string, issues: string[]): void {
  if (!isFiniteNumber(value)) issues.push(`${path} must be finite`);
}

function positiveFinite(value: unknown, path: string, issues: string[]): void {
  if (!isFiniteNumber(value) || value <= 0) issues.push(`${path} must be positive and finite`);
}

function nonNegativeFinite(value: unknown, path: string, issues: string[]): void {
  if (!isFiniteNumber(value) || value < 0) {
    issues.push(`${path} must be non-negative and finite`);
  }
}

function positiveSafeInteger(value: unknown, path: string, issues: string[]): void {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    issues.push(`${path} must be a positive safe integer`);
  }
}

function nonNegativeSafeInteger(value: unknown, path: string, issues: string[]): void {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    issues.push(`${path} must be a non-negative safe integer`);
  }
}
