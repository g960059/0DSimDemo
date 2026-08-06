import type { SupabaseClient } from "@supabase/supabase-js";

import {
  validateStudioArticleDraftV2,
} from "@/studio/application/authoring/StudioArticleDataV2";
import {
  validateExperimentContentV2,
  validateExperimentSnapshotV2,
  validateExperimentV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
import {
  STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID,
  type StudioArticleDraftV2,
} from "@/studio/contracts/v2/article";
import {
  STUDIO_EXPERIMENT_V2_SCHEMA_ID,
  type ExperimentContentV2,
  type ExperimentSnapshotV2,
  type ExperimentV2,
} from "@/studio/contracts/v2/content";
import {
  studioCanonicalJsonStringify,
} from "@/studio/infrastructure/json/StudioCanonicalJson";
import {
  assertStudioSimulationWorkerAdmittedSnapshotCommitV2,
  type StudioSimulationWorkerAdmittedSnapshotCommitV2,
} from "@/studio/workers/StudioSimulationWorkerClientV2";
import { ensureStudioAuthenticatedForSaveV1 } from "./StudioSupabaseAuthV1";
import { studioSupabaseClientV1 } from "./StudioSupabaseClientV1";

export type StudioRemoteExperimentResourceV1 = Readonly<{
  experiment: ExperimentV2;
  title: string;
  createdAt: string;
  updatedAt: string;
  publishedSnapshotId: string | null;
  publicSlug: string | null;
}>;

export type StudioRemoteArticleResourceV1 = Readonly<{
  article: StudioArticleDraftV2;
  createdAt: string;
  updatedAt: string;
  publicSlug: string | null;
}>;

export type StudioPublicExperimentResourceV1 = Readonly<{
  experimentId: string;
  title: string;
  publicSlug: string;
  publishedAt: string;
  snapshot: ExperimentSnapshotV2;
}>;

export function createStudioSupabaseContentRepositoryV1():
  StudioSupabaseContentRepositoryV1 | null {
  const client = studioSupabaseClientV1();
  return client === null ? null : new StudioSupabaseContentRepositoryV1(client);
}

export class StudioSupabaseContentRepositoryV1 {
  readonly #client: SupabaseClient;

  constructor(client: SupabaseClient | null = studioSupabaseClientV1()) {
    if (client === null) throw new Error("Supabase is not configured");
    this.#client = client;
  }

  async saveExperiment(input: Readonly<{
    experimentId: string | null;
    expectedVersion: number | null;
    title: string;
    content: ExperimentContentV2;
  }>): Promise<ExperimentV2> {
    await ensureStudioAuthenticatedForSaveV1(this.#client);
    const content = validateExperimentContentV2(input.content);
    const data = await this.#rpc("save_experiment_v1", {
      p_operation_id: operationIdV1(),
      p_experiment_id: input.experimentId,
      p_expected_version: input.expectedVersion,
      p_title: requiredTrimmedV1(input.title, "Experiment title"),
      p_model_id: content.modelId,
      p_content: content,
    });
    const result = recordV1(data, "save_experiment_v1 result");
    return validateExperimentV2({
      schemaId: STUDIO_EXPERIMENT_V2_SCHEMA_ID,
      experimentId: requiredStringV1(result.experimentId, "experimentId"),
      version: nonnegativeIntegerV1(result.version, "version"),
      content: result.content,
    });
  }

  async commitSnapshot(input: Readonly<{
    admitted: StudioSimulationWorkerAdmittedSnapshotCommitV2;
    sourceExperiment?: Readonly<{
      experimentId: string;
      expectedVersion: number;
    }>;
  }>): Promise<ExperimentSnapshotV2> {
    await ensureStudioAuthenticatedForSaveV1(this.#client);
    assertStudioSimulationWorkerAdmittedSnapshotCommitV2(input.admitted);
    const candidate = input.admitted.snapshot;
    const data = await this.#rpc("commit_admitted_experiment_snapshot_v1", {
      p_operation_id: operationIdV1(),
      // Persistence owns durable identity; the Worker's ID seals admission
      // correlation only and is intentionally not reused as a database key.
      p_snapshot_id: null,
      p_model_id: candidate.content.modelId,
      p_content: candidate.content,
      p_source_experiment_id: input.sourceExperiment?.experimentId ?? null,
      p_expected_experiment_version:
        input.sourceExperiment?.expectedVersion ?? null,
    });
    const snapshot = validateExperimentSnapshotV2(data);
    if (
      studioCanonicalJsonStringify(snapshot.content)
      !== studioCanonicalJsonStringify(candidate.content)
    ) {
      throw new Error("Snapshot persistence changed the admitted candidate");
    }
    return snapshot;
  }

  async saveArticle(input: Readonly<{
    articleId: string | null;
    expectedVersion: number | null;
    article: StudioArticleDraftV2;
  }>): Promise<StudioArticleDraftV2> {
    await ensureStudioAuthenticatedForSaveV1(this.#client);
    const article = validateStudioArticleDraftV2(input.article);
    const data = await this.#rpc("save_article_v1", {
      p_operation_id: operationIdV1(),
      p_article_id: input.articleId,
      p_expected_version: input.expectedVersion,
      p_locale: article.locale,
      p_title: article.title,
      p_blocks: article.blocks,
    });
    const result = recordV1(data, "save_article_v1 result");
    return validateStudioArticleDraftV2({
      schemaId: STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID,
      articleId: requiredStringV1(result.articleId, "articleId"),
      draftVersion: nonnegativeIntegerV1(result.version, "version"),
      visibility: article.visibility,
      locale: result.locale,
      title: result.title,
      blocks: result.blocks,
    });
  }

  async publishExperiment(input: Readonly<{
    experimentId: string;
    expectedVersion: number;
    snapshotId: string;
    publicSlug: string;
  }>): Promise<void> {
    await this.#rpc("publish_experiment_v1", {
      p_operation_id: operationIdV1(),
      p_experiment_id: input.experimentId,
      p_expected_version: input.expectedVersion,
      p_snapshot_id: input.snapshotId,
      p_public_slug: input.publicSlug,
    });
  }

  async publishArticle(input: Readonly<{
    articleId: string;
    expectedVersion: number;
    publicSlug: string;
  }>): Promise<void> {
    await this.#rpc("publish_article_v1", {
      p_operation_id: operationIdV1(),
      p_article_id: input.articleId,
      p_expected_version: input.expectedVersion,
      p_public_slug: input.publicSlug,
    });
  }

  async unpublishExperiment(experimentId: string, expectedVersion: number): Promise<void> {
    await this.#rpc("unpublish_experiment_v1", {
      p_operation_id: operationIdV1(),
      p_experiment_id: experimentId,
      p_expected_version: expectedVersion,
    });
  }

  async unpublishArticle(articleId: string, expectedVersion: number): Promise<void> {
    await this.#rpc("unpublish_article_v1", {
      p_operation_id: operationIdV1(),
      p_article_id: articleId,
      p_expected_version: expectedVersion,
    });
  }

  async deleteExperiment(experimentId: string, expectedVersion: number): Promise<void> {
    await this.#rpc("delete_experiment_v1", {
      p_operation_id: operationIdV1(),
      p_experiment_id: experimentId,
      p_expected_version: expectedVersion,
    });
  }

  async deleteArticle(articleId: string, expectedVersion: number): Promise<void> {
    await this.#rpc("delete_article_v1", {
      p_operation_id: operationIdV1(),
      p_article_id: articleId,
      p_expected_version: expectedVersion,
    });
  }

  async listMyExperiments(): Promise<readonly StudioRemoteExperimentResourceV1[]> {
    const session = await this.#client.auth.getSession();
    if (session.error !== null) throw session.error;
    if (session.data.session === null) return Object.freeze([]);
    const data = await this.#rpc("list_my_experiments_v1", {});
    return Object.freeze(arrayV1(data, "list_my_experiments_v1 result").map(
      validateExperimentResourceV1,
    ));
  }

  async readMyExperiment(experimentId: string): Promise<StudioRemoteExperimentResourceV1 | null> {
    const session = await this.#client.auth.getSession();
    if (session.error !== null) throw session.error;
    if (session.data.session === null) return null;
    const data = await this.#rpc("read_my_experiment_v1", {
      p_experiment_id: experimentId,
    });
    return data === null ? null : validateExperimentResourceV1(data);
  }

  async listMySnapshots(): Promise<readonly ExperimentSnapshotV2[]> {
    const session = await this.#client.auth.getSession();
    if (session.error !== null) throw session.error;
    if (session.data.session === null) return Object.freeze([]);
    const data = await this.#rpc("list_my_experiment_snapshots_v1", {});
    return Object.freeze(arrayV1(data, "snapshot list").map(
      validateExperimentSnapshotV2,
    ));
  }

  async readSnapshot(snapshotId: string): Promise<ExperimentSnapshotV2 | null> {
    const data = await this.#rpc("read_experiment_snapshot_v1", {
      p_snapshot_id: snapshotId,
    });
    return data === null ? null : validateExperimentSnapshotV2(data);
  }

  async listMyArticles(): Promise<readonly StudioRemoteArticleResourceV1[]> {
    const session = await this.#client.auth.getSession();
    if (session.error !== null) throw session.error;
    if (session.data.session === null) return Object.freeze([]);
    const data = await this.#rpc("list_my_articles_v1", {});
    return Object.freeze(arrayV1(data, "article list").map(
      validateArticleResourceV1,
    ));
  }

  async readArticle(articleId: string): Promise<StudioArticleDraftV2 | null> {
    const data = await this.#rpc("read_article_v1", { p_article_id: articleId });
    return data === null ? null : validateStudioArticleDraftV2(data);
  }

  async listPublicExperiments(): Promise<readonly StudioPublicExperimentResourceV1[]> {
    const data = await this.#rpc("list_public_experiments_v1", {});
    return Object.freeze(arrayV1(data, "public Experiment list").map((value) => {
      const record = recordV1(value, "public Experiment");
      return Object.freeze({
        experimentId: requiredStringV1(record.experimentId, "experimentId"),
        title: requiredStringV1(record.title, "title"),
        publicSlug: requiredStringV1(record.publicSlug, "publicSlug"),
        publishedAt: isoTimestampV1(record.publishedAt, "publishedAt"),
        snapshot: validateExperimentSnapshotV2(record.snapshot),
      });
    }));
  }

  async listPublicArticles(): Promise<readonly StudioArticleDraftV2[]> {
    const data = await this.#rpc("list_public_articles_v1", {});
    return Object.freeze(arrayV1(data, "public Article list").map(
      validateStudioArticleDraftV2,
    ));
  }

  async #rpc(functionName: string, args: Record<string, unknown>): Promise<unknown> {
    const result = await this.#client.rpc(functionName, args);
    if (result.error !== null) throw result.error;
    return result.data;
  }
}

function validateExperimentResourceV1(value: unknown): StudioRemoteExperimentResourceV1 {
  const record = recordV1(value, "Experiment resource");
  return Object.freeze({
    experiment: validateExperimentV2(record.experiment),
    title: requiredStringV1(record.title, "title"),
    createdAt: isoTimestampV1(record.createdAt, "createdAt"),
    updatedAt: isoTimestampV1(record.updatedAt, "updatedAt"),
    publishedSnapshotId: nullableStringV1(
      record.publishedSnapshotId,
      "publishedSnapshotId",
    ),
    publicSlug: nullableStringV1(record.publicSlug, "publicSlug"),
  });
}

function validateArticleResourceV1(value: unknown): StudioRemoteArticleResourceV1 {
  const record = recordV1(value, "Article resource");
  return Object.freeze({
    article: validateStudioArticleDraftV2(record.article),
    createdAt: isoTimestampV1(record.createdAt, "createdAt"),
    updatedAt: isoTimestampV1(record.updatedAt, "updatedAt"),
    publicSlug: nullableStringV1(record.publicSlug, "publicSlug"),
  });
}

function operationIdV1(): string {
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new Error("This browser cannot create an idempotent operation ID");
  }
  return globalThis.crypto.randomUUID();
}

function recordV1(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function arrayV1(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function requiredStringV1(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a nonempty string`);
  }
  return value;
}

function requiredTrimmedV1(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > 240) {
    throw new Error(`${label} must contain 1–240 characters`);
  }
  return normalized;
}

function nullableStringV1(value: unknown, label: string): string | null {
  return value === null ? null : requiredStringV1(value, label);
}

function nonnegativeIntegerV1(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(`${label} must be a nonnegative integer`);
  }
  return value as number;
}

function isoTimestampV1(value: unknown, label: string): string {
  const timestamp = requiredStringV1(value, label);
  if (!Number.isFinite(Date.parse(timestamp))) {
    throw new Error(`${label} must be an ISO timestamp`);
  }
  return timestamp;
}
