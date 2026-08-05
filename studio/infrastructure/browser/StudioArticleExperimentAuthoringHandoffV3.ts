import {
  studioCanonicalJsonStringify,
} from "@/studio/infrastructure/json/StudioCanonicalJson";
export const STUDIO_ARTICLE_EXPERIMENT_AUTHORING_HANDOFF_V3_KEY =
  "circleheart.studio.article-experiment-authoring-handoff.v4";
export const STUDIO_ARTICLE_EXPERIMENT_AUTHORING_HANDOFF_V3_SCHEMA_ID =
  "circleheart-studio-article-experiment-authoring-handoff-v4" as const;

const RETIRED_ARTICLE_EXPERIMENT_AUTHORING_HANDOFF_KEYS_V3 = Object.freeze([
  "circleheart.studio.article-experiment-authoring-handoff.v3",
]);

export type StudioArticleExperimentAuthoringHandoffV3 = Readonly<{
  schemaId: typeof STUDIO_ARTICLE_EXPERIMENT_AUTHORING_HANDOFF_V3_SCHEMA_ID;
  articleId: string;
  sessionToken: string;
  insertionIndex: number;
  replacementBlockId: string | null;
  snapshotId: string | null;
}>;

export type StudioArticleExperimentHandoffStorageV3 = Pick<
  Storage,
  "getItem" | "removeItem" | "setItem"
>;

/** One-tab transport for the Article → Experiment → Snapshot round trip. */
export class StudioArticleExperimentAuthoringHandoffStoreV3 {
  readonly #storage: StudioArticleExperimentHandoffStorageV3;

  constructor(
    storage: StudioArticleExperimentHandoffStorageV3 = window.sessionStorage,
  ) {
    this.#storage = storage;
    RETIRED_ARTICLE_EXPERIMENT_AUTHORING_HANDOFF_KEYS_V3.forEach((key) =>
      this.#storage.removeItem(key));
  }

  begin(input: Readonly<{
    articleId: string;
    sessionToken: string;
    insertionIndex: number;
    replacementBlockId: string | null;
  }>): StudioArticleExperimentAuthoringHandoffV3 {
    const handoff = validateStudioArticleExperimentAuthoringHandoffV3({
      schemaId: STUDIO_ARTICLE_EXPERIMENT_AUTHORING_HANDOFF_V3_SCHEMA_ID,
      ...input,
      snapshotId: null,
    });
    this.#storage.setItem(
      STUDIO_ARTICLE_EXPERIMENT_AUTHORING_HANDOFF_V3_KEY,
      studioCanonicalJsonStringify(handoff),
    );
    return handoff;
  }

  read(): StudioArticleExperimentAuthoringHandoffV3 | null {
    const raw = this.#storage.getItem(
      STUDIO_ARTICLE_EXPERIMENT_AUTHORING_HANDOFF_V3_KEY,
    );
    if (raw === null) return null;
    try {
      return validateStudioArticleExperimentAuthoringHandoffV3(JSON.parse(raw));
    } catch {
      this.clear();
      return null;
    }
  }

  complete(input: Readonly<{
    sessionToken: string;
    snapshotId: string;
  }>): StudioArticleExperimentAuthoringHandoffV3 | null {
    const current = this.read();
    if (current === null || current.sessionToken !== input.sessionToken) {
      return null;
    }
    const completed = validateStudioArticleExperimentAuthoringHandoffV3({
      ...current,
      snapshotId: input.snapshotId,
    });
    this.#storage.setItem(
      STUDIO_ARTICLE_EXPERIMENT_AUTHORING_HANDOFF_V3_KEY,
      studioCanonicalJsonStringify(completed),
    );
    return completed;
  }

  clear(): void {
    this.#storage.removeItem(
      STUDIO_ARTICLE_EXPERIMENT_AUTHORING_HANDOFF_V3_KEY,
    );
  }
}

export function validateStudioArticleExperimentAuthoringHandoffV3(
  value: unknown,
): StudioArticleExperimentAuthoringHandoffV3 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Article Experiment handoff must be an object");
  }
  const record = value as Record<string, unknown>;
  const expected = [
    "articleId",
    "insertionIndex",
    "replacementBlockId",
    "schemaId",
    "sessionToken",
    "snapshotId",
  ];
  const keys = Object.keys(record).sort();
  if (
    keys.length !== expected.length
    || keys.some((key, index) => key !== expected[index])
    || record.schemaId
      !== STUDIO_ARTICLE_EXPERIMENT_AUTHORING_HANDOFF_V3_SCHEMA_ID
  ) {
    throw new Error("Article Experiment handoff schema is invalid");
  }
  const articleId = requiredPortableIdV3(record.articleId, "articleId");
  const sessionToken = requiredPortableIdV3(
    record.sessionToken,
    "sessionToken",
  );
  if (
    typeof record.insertionIndex !== "number"
    || !Number.isSafeInteger(record.insertionIndex)
    || record.insertionIndex < 0
  ) {
    throw new Error("Article Experiment handoff insertionIndex is invalid");
  }
  const replacementBlockId = record.replacementBlockId === null
    ? null
    : requiredPortableIdV3(record.replacementBlockId, "replacementBlockId");
  const snapshotId = record.snapshotId === null
    ? null
    : requiredPortableIdV3(record.snapshotId, "snapshotId");
  return Object.freeze({
    schemaId: STUDIO_ARTICLE_EXPERIMENT_AUTHORING_HANDOFF_V3_SCHEMA_ID,
    articleId,
    sessionToken,
    insertionIndex: record.insertionIndex,
    replacementBlockId,
    snapshotId,
  });
}

export function createArticleExperimentSessionTokenV3(): string {
  const token = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`;
  return requiredPortableIdV3(`session-${token}`, "sessionToken");
}

function requiredPortableIdV3(value: unknown, field: string): string {
  if (
    typeof value !== "string"
    || !/^[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,255}$/.test(value)
  ) {
    throw new Error(`Article Experiment handoff ${field} is invalid`);
  }
  return value;
}
