import {
  validateStudioArticleDraftV2,
} from "@/studio/application/authoring/StudioArticleDataV2";
import {
  assertExperimentBriefingMatchesModelV2,
  assertExperimentContentMatchesModelV2,
  validateExperimentPlacementAgainstSnapshotV2,
  validateExperimentContentV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
import type { StudioArticleDraftV2 } from "@/studio/contracts/v2/article";
import type {
  ExperimentSurfaceV2,
  ExperimentSnapshotV2,
  ExperimentV2,
} from "@/studio/contracts/v2/content";
import type { ModelContractV2 } from "@/studio/contracts/v2/model";
import {
  assertPortableStudioJsonObjectV2,
} from "@/studio/contracts/v2/model";

export const STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID =
  "circleheart-studio-authoring-command-v1" as const;

export type StudioAuthoringCommandV1 =
  | Readonly<{
      schemaId: typeof STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID;
      commandId: string;
      action: "experiment.list" | "snapshot.list" | "article.list";
      input: Readonly<{ limit: number }>;
    }>
  | Readonly<{
      schemaId: typeof STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID;
      commandId: string;
      action: "experiment.read";
      input: Readonly<{ experimentId: string }>;
    }>
  | Readonly<{
      schemaId: typeof STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID;
      commandId: string;
      action: "snapshot.read";
      input: Readonly<{ snapshotId: string }>;
    }>
  | Readonly<{
      schemaId: typeof STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID;
      commandId: string;
      action: "article.read";
      input: Readonly<{ articleId: string }>;
    }>
  | Readonly<{
      schemaId: typeof STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID;
      commandId: string;
      action: "experiment.presentation.save";
      input: Readonly<{
        experimentId: string;
        expectedVersion: number;
        title: string;
        surface: ExperimentSurfaceV2;
      }>;
    }>
  | Readonly<{
      schemaId: typeof STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID;
      commandId: string;
      action: "experiment.publish";
      input: Readonly<{
        experimentId: string;
        expectedVersion: number;
        snapshotId: string;
        publicSlug: string;
      }>;
    }>
  | Readonly<{
      schemaId: typeof STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID;
      commandId: string;
      action: "article.save";
      input: Readonly<{
        articleId: string | null;
        expectedVersion: number | null;
        article: StudioArticleDraftV2;
      }>;
    }>
  | Readonly<{
      schemaId: typeof STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID;
      commandId: string;
      action: "article.publish";
      input: Readonly<{
        articleId: string;
        expectedVersion: number;
        publicSlug: string;
      }>;
    }>;

export interface StudioAuthoringRepositoryPortV1 {
  listMyExperiments(request: Readonly<{ limit: number }>): Promise<unknown>;
  listMySnapshots(request: Readonly<{ limit: number }>): Promise<unknown>;
  listMyArticles(request: Readonly<{ limit: number }>): Promise<unknown>;
  readMyExperiment(experimentId: string): Promise<Readonly<{
    experiment: ExperimentV2;
    title: string;
  }> | null>;
  readSnapshot(snapshotId: string): Promise<ExperimentSnapshotV2 | null>;
  readArticle(articleId: string): Promise<StudioArticleDraftV2 | null>;
  saveExperiment(input: Readonly<{
    experimentId: string | null;
    expectedVersion: number | null;
    title: string;
    content: ExperimentV2["content"];
  }>): Promise<ExperimentV2>;
  publishExperiment(input: Readonly<{
    experimentId: string;
    expectedVersion: number;
    snapshotId: string;
    publicSlug: string;
  }>): Promise<void>;
  saveArticle(input: Readonly<{
    articleId: string | null;
    expectedVersion: number | null;
    article: StudioArticleDraftV2;
  }>): Promise<StudioArticleDraftV2>;
  publishArticle(input: Readonly<{
    articleId: string;
    expectedVersion: number;
    publicSlug: string;
  }>): Promise<void>;
}

export interface StudioAuthoringModelPortV1 {
  resolveModel(input: Readonly<{
    modelId: string;
    surfaceSeriesId: string;
    /** Null resolves the mutable series; a value resolves an exact Snapshot Surface. */
    surfaceReleaseId: string | null;
  }>): Promise<ModelContractV2>;
}

/** Optional future confirmation/automation policy. Current local AI tooling
 * deliberately uses the allow policy; numerical and publication invariants
 * remain enforced by model validation, Snapshot admission, CAS, RLS and RPCs. */
export interface StudioAuthoringPolicyPortV1 {
  authorize(command: StudioAuthoringCommandV1): Promise<void> | void;
}

export const ALLOW_STUDIO_AUTHORING_POLICY_V1: StudioAuthoringPolicyPortV1 =
  Object.freeze({ authorize: () => undefined });

export function validateStudioAuthoringCommandV1(
  value: unknown,
): StudioAuthoringCommandV1 {
  assertPortableStudioJsonObjectV2(value, "$.command");
  const command = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  exactKeysV1(command, ["action", "commandId", "input", "schemaId"], "$.command");
  if (command.schemaId !== STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID) {
    throw new Error("Studio authoring command schema identity mismatch");
  }
  const commandId = uuidV1(command.commandId, "$.command.commandId");
  if (command.input === null || typeof command.input !== "object" || Array.isArray(command.input)) {
    throw new Error("$.command.input must be an object");
  }
  const input = command.input as Record<string, unknown>;
  const base = { schemaId: STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID, commandId };
  switch (command.action) {
    case "experiment.list":
    case "snapshot.list":
    case "article.list":
      exactKeysV1(input, ["limit"], "$.command.input");
      return deepFreezeV1({
        ...base,
        action: command.action,
        input: { limit: pageLimitV1(input.limit) },
      });
    case "experiment.read":
      exactKeysV1(input, ["experimentId"], "$.command.input");
      return deepFreezeV1({
        ...base,
        action: command.action,
        input: {
          experimentId: trimmedV1(
            input.experimentId,
            "$.command.input.experimentId",
          ),
        },
      });
    case "snapshot.read":
      exactKeysV1(input, ["snapshotId"], "$.command.input");
      return deepFreezeV1({
        ...base,
        action: command.action,
        input: {
          snapshotId: trimmedV1(
            input.snapshotId,
            "$.command.input.snapshotId",
          ),
        },
      });
    case "article.read":
      exactKeysV1(input, ["articleId"], "$.command.input");
      return deepFreezeV1({
        ...base,
        action: command.action,
        input: { articleId: trimmedV1(input.articleId, "$.command.input.articleId") },
      });
    case "experiment.presentation.save":
      exactKeysV1(
        input,
        ["expectedVersion", "experimentId", "surface", "title"],
        "$.command.input",
      );
      return deepFreezeV1({
        ...base,
        action: command.action,
        input: {
          experimentId: trimmedV1(input.experimentId, "$.command.input.experimentId"),
          expectedVersion: versionV1(input.expectedVersion, "$.command.input.expectedVersion"),
          title: trimmedV1(input.title, "$.command.input.title"),
          surface: input.surface as ExperimentSurfaceV2,
        },
      });
    case "experiment.publish":
      exactKeysV1(
        input,
        ["expectedVersion", "experimentId", "publicSlug", "snapshotId"],
        "$.command.input",
      );
      return deepFreezeV1({
        ...base,
        action: command.action,
        input: {
          experimentId: trimmedV1(input.experimentId, "$.command.input.experimentId"),
          expectedVersion: versionV1(input.expectedVersion, "$.command.input.expectedVersion"),
          snapshotId: trimmedV1(input.snapshotId, "$.command.input.snapshotId"),
          publicSlug: trimmedV1(input.publicSlug, "$.command.input.publicSlug"),
        },
      });
    case "article.save": {
      exactKeysV1(
        input,
        ["article", "articleId", "expectedVersion"],
        "$.command.input",
      );
      const articleId = nullableTrimmedV1(input.articleId, "$.command.input.articleId");
      const expectedVersion = nullableVersionV1(
        input.expectedVersion,
        "$.command.input.expectedVersion",
      );
      if ((articleId === null) !== (expectedVersion === null)) {
        throw new Error("New Article requires null identity and version; updates require both");
      }
      const article = validateStudioArticleDraftV2(input.article);
      if (
        articleId !== null
        && (
          article.articleId !== articleId
          || article.draftVersion !== expectedVersion
        )
      ) {
        throw new Error(
          "Article command identity/version must match its embedded draft",
        );
      }
      return deepFreezeV1({
        ...base,
        action: command.action,
        input: {
          articleId,
          expectedVersion,
          article,
        },
      });
    }
    case "article.publish":
      exactKeysV1(
        input,
        ["articleId", "expectedVersion", "publicSlug"],
        "$.command.input",
      );
      return deepFreezeV1({
        ...base,
        action: command.action,
        input: {
          articleId: trimmedV1(input.articleId, "$.command.input.articleId"),
          expectedVersion: versionV1(input.expectedVersion, "$.command.input.expectedVersion"),
          publicSlug: trimmedV1(input.publicSlug, "$.command.input.publicSlug"),
        },
      });
    default:
      throw new Error(`Unsupported Studio authoring action ${String(command.action)}`);
  }
}

export async function executeStudioAuthoringCommandV1(
  repository: StudioAuthoringRepositoryPortV1,
  models: StudioAuthoringModelPortV1,
  commandValue: StudioAuthoringCommandV1 | unknown,
  policy: StudioAuthoringPolicyPortV1 = ALLOW_STUDIO_AUTHORING_POLICY_V1,
): Promise<unknown> {
  const command = validateStudioAuthoringCommandV1(commandValue);
  await policy.authorize(command);
  switch (command.action) {
    case "experiment.list":
      return repository.listMyExperiments(command.input);
    case "snapshot.list":
      return repository.listMySnapshots(command.input);
    case "article.list":
      return repository.listMyArticles(command.input);
    case "experiment.read":
      return repository.readMyExperiment(command.input.experimentId);
    case "snapshot.read":
      return repository.readSnapshot(command.input.snapshotId);
    case "article.read":
      return repository.readArticle(command.input.articleId);
    case "experiment.presentation.save": {
      const current = await repository.readMyExperiment(command.input.experimentId);
      if (current === null) throw new Error("Experiment is unavailable");
      const content = validateExperimentContentV2({
        ...current.experiment.content,
        surface: command.input.surface,
      });
      const model = await models.resolveModel({
        modelId: content.modelId,
        surfaceSeriesId: content.surfaceSeriesId,
        surfaceReleaseId: null,
      });
      assertExperimentContentMatchesModelV2(content, model);
      return repository.saveExperiment({
        experimentId: command.input.experimentId,
        expectedVersion: command.input.expectedVersion,
        title: command.input.title,
        content,
      });
    }
    case "experiment.publish":
      await repository.publishExperiment(command.input);
      return Object.freeze({ published: true });
    case "article.save":
      await assertArticleMatchesAuthorityV1(
        command.input.article,
        repository,
        models,
      );
      return repository.saveArticle(command.input);
    case "article.publish":
      await repository.publishArticle(command.input);
      return Object.freeze({ published: true });
  }
}

async function assertArticleMatchesAuthorityV1(
  article: StudioArticleDraftV2,
  repository: StudioAuthoringRepositoryPortV1,
  models: StudioAuthoringModelPortV1,
): Promise<void> {
  const snapshotPromises = new Map<string, Promise<ExperimentSnapshotV2>>();
  const readSnapshot = (snapshotId: string): Promise<ExperimentSnapshotV2> => {
    const cached = snapshotPromises.get(snapshotId);
    if (cached !== undefined) return cached;
    const pending = repository.readSnapshot(snapshotId).then((snapshot) => {
      if (snapshot === null) {
        throw new Error(`Article Snapshot ${snapshotId} is unavailable`);
      }
      return snapshot;
    });
    snapshotPromises.set(snapshotId, pending);
    return pending;
  };
  await Promise.all(article.blocks.map(async (block) => {
    if (block.kind !== "experiment") return;
    const snapshot = await readSnapshot(block.placement.snapshotId);
    const placement = validateExperimentPlacementAgainstSnapshotV2(
      block.placement,
      snapshot,
    );
    const model = await models.resolveModel({
      modelId: snapshot.content.modelId,
      surfaceSeriesId: snapshot.content.surfaceSeriesId,
      surfaceReleaseId: snapshot.surfaceReleaseId,
    });
    assertExperimentContentMatchesModelV2(snapshot.content, model);
    assertExperimentBriefingMatchesModelV2(placement.briefing, model);
  }));
}

function exactKeysV1(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(`${path} keys must be exactly ${wanted.join(", ")}`);
  }
}

function trimmedV1(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) {
    throw new Error(`${path} must be a non-empty trimmed string`);
  }
  return value;
}

function uuidV1(value: unknown, path: string): string {
  const text = trimmedV1(value, path);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)) {
    throw new Error(`${path} must be a UUID`);
  }
  return text;
}

function nullableTrimmedV1(value: unknown, path: string): string | null {
  return value === null ? null : trimmedV1(value, path);
}

function versionV1(value: unknown, path: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(`${path} must be a nonnegative integer`);
  }
  return value as number;
}

function nullableVersionV1(value: unknown, path: string): number | null {
  return value === null ? null : versionV1(value, path);
}

function pageLimitV1(value: unknown): number {
  const limit = versionV1(value, "$.command.input.limit");
  if (limit < 1 || limit > 100) throw new Error("List limit must be between 1 and 100");
  return limit;
}

function deepFreezeV1<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreezeV1(child);
    }
    Object.freeze(value);
  }
  return value;
}
