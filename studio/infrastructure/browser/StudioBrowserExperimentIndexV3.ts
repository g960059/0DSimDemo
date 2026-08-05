import {
  studioCanonicalJsonStringify,
} from "@/studio/infrastructure/json/StudioCanonicalJson";
import {
  requireOpaqueExperimentIdV3,
} from "@/studio/infrastructure/browser/StudioExperimentIdentityV3";

export const STUDIO_BROWSER_EXPERIMENT_INDEX_V3_KEY =
  "circleheart.studio.browser-experiment-index.v5";
export const STUDIO_BROWSER_EXPERIMENT_INDEX_V3_SCHEMA_ID =
  "circleheart-studio-browser-experiment-index-v5" as const;
export const STUDIO_BROWSER_EXPERIMENT_RECORD_V3_SCHEMA_ID =
  "circleheart-studio-browser-experiment-record-v5" as const;

const RETIRED_EXPERIMENT_INDEX_KEYS_V3 = Object.freeze([
  "circleheart.studio.browser-experiment-index.v4",
]);

export type StudioBrowserExperimentRecordV3 = Readonly<{
  schemaId: typeof STUDIO_BROWSER_EXPERIMENT_RECORD_V3_SCHEMA_ID;
  experimentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  /** The immutable Snapshot currently exposed as this Experiment's release. */
  publishedSnapshotId: string | null;
}>;

type StudioBrowserExperimentIndexEnvelopeV3 = Readonly<{
  schemaId: typeof STUDIO_BROWSER_EXPERIMENT_INDEX_V3_SCHEMA_ID;
  experiments: readonly StudioBrowserExperimentRecordV3[];
}>;

export type StudioBrowserExperimentIndexStorageV3 = Pick<
  Storage,
  "getItem" | "removeItem" | "setItem"
>;

/**
 * Browser-backed resource index for Experiment metadata.
 *
 * The numerical Experiment remains owned by StudioBrowserContentStoreV3. Title,
 * activity time, and the publication pointer do not enter a simulation Worker
 * and can later move to an authenticated backend without changing Snapshot
 * identity or numerical authoring contracts.
 */
export class StudioBrowserExperimentIndexV3 {
  readonly #storage: StudioBrowserExperimentIndexStorageV3;

  constructor(
    storage: StudioBrowserExperimentIndexStorageV3 = window.localStorage,
  ) {
    this.#storage = storage;
    RETIRED_EXPERIMENT_INDEX_KEYS_V3.forEach((key) =>
      this.#storage.removeItem(key));
  }

  list(): readonly StudioBrowserExperimentRecordV3[] {
    return this.#read().experiments;
  }

  read(experimentId: string): StudioBrowserExperimentRecordV3 | null {
    requireOpaqueExperimentIdV3(experimentId);
    return this.#read().experiments.find((record) =>
      record.experimentId === experimentId) ?? null;
  }

  ensure(input: Readonly<{
    experimentId: string;
    title: string;
    nowIso: string;
  }>): StudioBrowserExperimentRecordV3 {
    const stored = this.read(input.experimentId);
    if (stored !== null) return stored;
    const created = validateStudioBrowserExperimentRecordV3({
      schemaId: STUDIO_BROWSER_EXPERIMENT_RECORD_V3_SCHEMA_ID,
      experimentId: input.experimentId,
      title: input.title,
      createdAt: input.nowIso,
      updatedAt: input.nowIso,
      publishedSnapshotId: null,
    });
    const current = this.#read();
    this.#write({
      ...current,
      experiments: Object.freeze([...current.experiments, created]),
    });
    return created;
  }

  rename(input: Readonly<{
    experimentId: string;
    title: string;
    nowIso: string;
  }>): StudioBrowserExperimentRecordV3 {
    return this.#replace(input.experimentId, (current) => ({
      ...current,
      title: input.title,
      updatedAt: input.nowIso,
    }));
  }

  touch(experimentId: string, nowIso: string): StudioBrowserExperimentRecordV3 {
    return this.#replace(experimentId, (current) => ({
      ...current,
      updatedAt: nowIso,
    }));
  }

  publish(input: Readonly<{
    experimentId: string;
    snapshotId: string;
    nowIso: string;
  }>): StudioBrowserExperimentRecordV3 {
    return this.#replace(input.experimentId, (current) => ({
      ...current,
      publishedSnapshotId: requiredPortableIdV3(
        input.snapshotId,
        "publishedSnapshotId",
      ),
      updatedAt: input.nowIso,
    }));
  }

  delete(experimentId: string): boolean {
    requireOpaqueExperimentIdV3(experimentId);
    const current = this.#read();
    if (!current.experiments.some((record) =>
      record.experimentId === experimentId)) return false;
    this.#write({
      ...current,
      experiments: Object.freeze(current.experiments.filter((record) =>
        record.experimentId !== experimentId)),
    });
    return true;
  }

  #replace(
    experimentId: string,
    update: (
      current: StudioBrowserExperimentRecordV3,
    ) => StudioBrowserExperimentRecordV3,
  ): StudioBrowserExperimentRecordV3 {
    requireOpaqueExperimentIdV3(experimentId);
    const current = this.#read();
    const stored = current.experiments.find((record) =>
      record.experimentId === experimentId);
    if (stored === undefined) {
      throw new Error(`Browser Experiment record not found: ${experimentId}`);
    }
    const replacement = validateStudioBrowserExperimentRecordV3(update(stored));
    this.#write({
      ...current,
      experiments: Object.freeze(current.experiments.map((record) =>
        record.experimentId === experimentId ? replacement : record)),
    });
    return replacement;
  }

  #read(): StudioBrowserExperimentIndexEnvelopeV3 {
    const raw = this.#storage.getItem(STUDIO_BROWSER_EXPERIMENT_INDEX_V3_KEY);
    if (raw === null) return emptyExperimentIndexV3();
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(
        `Stored browser Experiment index is not JSON: ${errorMessageV3(error)}`,
      );
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Stored browser Experiment index must be an object");
    }
    const record = parsed as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    if (
      keys.length !== 2
      || keys[0] !== "experiments"
      || keys[1] !== "schemaId"
      || record.schemaId !== STUDIO_BROWSER_EXPERIMENT_INDEX_V3_SCHEMA_ID
      || !Array.isArray(record.experiments)
    ) {
      throw new Error("Stored browser Experiment index schema is invalid");
    }
    const experiments = Object.freeze(record.experiments.map(
      validateStudioBrowserExperimentRecordV3,
    ));
    const identities = new Set<string>();
    for (const experiment of experiments) {
      if (identities.has(experiment.experimentId)) {
        throw new Error(
          `Stored browser Experiment index has duplicate identity: ${experiment.experimentId}`,
        );
      }
      identities.add(experiment.experimentId);
    }
    return Object.freeze({
      schemaId: STUDIO_BROWSER_EXPERIMENT_INDEX_V3_SCHEMA_ID,
      experiments,
    });
  }

  #write(input: StudioBrowserExperimentIndexEnvelopeV3): void {
    const envelope = Object.freeze({
      schemaId: STUDIO_BROWSER_EXPERIMENT_INDEX_V3_SCHEMA_ID,
      experiments: Object.freeze(input.experiments.map(
        validateStudioBrowserExperimentRecordV3,
      )),
    });
    this.#storage.setItem(
      STUDIO_BROWSER_EXPERIMENT_INDEX_V3_KEY,
      studioCanonicalJsonStringify(envelope),
    );
  }
}

export function validateStudioBrowserExperimentRecordV3(
  value: unknown,
): StudioBrowserExperimentRecordV3 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Browser Experiment record must be an object");
  }
  const record = value as Record<string, unknown>;
  const expected = [
    "createdAt",
    "experimentId",
    "publishedSnapshotId",
    "schemaId",
    "title",
    "updatedAt",
  ];
  const keys = Object.keys(record).sort();
  if (
    keys.length !== expected.length
    || keys.some((key, index) => key !== expected[index])
    || record.schemaId !== STUDIO_BROWSER_EXPERIMENT_RECORD_V3_SCHEMA_ID
  ) {
    throw new Error("Browser Experiment record schema is invalid");
  }
  const experimentId = requireOpaqueExperimentIdV3(
    record.experimentId,
    "Browser Experiment record experimentId",
  );
  const title = requiredTitleV3(record.title);
  const createdAt = requiredIsoTimestampV3(record.createdAt, "createdAt");
  const updatedAt = requiredIsoTimestampV3(record.updatedAt, "updatedAt");
  if (updatedAt < createdAt) {
    throw new Error("Browser Experiment record updatedAt precedes createdAt");
  }
  const publishedSnapshotId = record.publishedSnapshotId === null
    ? null
    : requiredPortableIdV3(record.publishedSnapshotId, "publishedSnapshotId");
  return Object.freeze({
    schemaId: STUDIO_BROWSER_EXPERIMENT_RECORD_V3_SCHEMA_ID,
    experimentId,
    title,
    createdAt,
    updatedAt,
    publishedSnapshotId,
  });
}

function emptyExperimentIndexV3(): StudioBrowserExperimentIndexEnvelopeV3 {
  return Object.freeze({
    schemaId: STUDIO_BROWSER_EXPERIMENT_INDEX_V3_SCHEMA_ID,
    experiments: Object.freeze([]),
  });
}

function requiredTitleV3(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Browser Experiment title must be a string");
  }
  const title = value.trim();
  if (title.length === 0 || title.length > 240) {
    throw new Error("Browser Experiment title must contain 1-240 characters");
  }
  return title;
}

function requiredIsoTimestampV3(value: unknown, field: string): string {
  if (
    typeof value !== "string"
    || !Number.isFinite(Date.parse(value))
    || new Date(value).toISOString() !== value
  ) {
    throw new Error(`Browser Experiment ${field} must be an ISO timestamp`);
  }
  return value;
}

function requiredPortableIdV3(value: unknown, field: string): string {
  if (
    typeof value !== "string"
    || !/^[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,255}$/.test(value)
  ) {
    throw new Error(`Browser Experiment ${field} must be a portable ID`);
  }
  return value;
}

function errorMessageV3(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
