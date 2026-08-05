import {
  validateStudioArticleDraftV2,
} from "@/studio/application/authoring/StudioArticleDataV2";
import {
  validateExperimentPlacementAgainstSnapshotV2,
  validateExperimentContentV2,
  validateExperimentSnapshotV2,
  validateExperimentV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
import type { StudioArticleDraftV2 } from "@/studio/contracts/v2/article";
import type {
  ExperimentSnapshotV2,
  ExperimentV2,
} from "@/studio/contracts/v2/content";
import {
  requireOpaqueExperimentIdV3,
} from "@/studio/infrastructure/browser/StudioExperimentIdentityV3";
import {
  studioCanonicalJsonStringify,
} from "@/studio/infrastructure/json/StudioCanonicalJson";
import {
  assertStudioSimulationWorkerQualifiedSnapshotCommitV2,
  type StudioSimulationWorkerQualifiedSnapshotCommitV2,
} from "@/studio/workers/StudioSimulationWorkerClientV2";

/**
 * Fresh pre-release envelope. There is deliberately no compatibility reader:
 * every retired shape is deleted at construction so legacy concepts cannot
 * leak back into the authoring model.
 */
export const STUDIO_BROWSER_CONTENT_STORE_V3_KEY =
  "circleheart.studio.browser-content.v8";
export const STUDIO_BROWSER_CONTENT_STORE_V3_SCHEMA_ID =
  "circleheart-studio-browser-content-v8" as const;

const RETIRED_CONTENT_STORE_KEYS_V3 = Object.freeze([
  "circleheart.studio.browser-content.v2",
  "circleheart.studio.browser-content.v3",
  "circleheart.studio.browser-content.v3.binding-v1",
  "circleheart.studio.browser-content.v4",
  "circleheart.studio.browser-content.v5",
  "circleheart.studio.browser-content.v6",
  "circleheart.studio.browser-content.v7",
]);

export type StudioBrowserStoragePortV3 = Pick<
  Storage,
  "getItem" | "removeItem" | "setItem"
>;

type StudioBrowserContentEnvelopeV3 = Readonly<{
  schemaId: typeof STUDIO_BROWSER_CONTENT_STORE_V3_SCHEMA_ID;
  experiments: readonly ExperimentV2[];
  snapshots: readonly ExperimentSnapshotV2[];
  articles: readonly StudioArticleDraftV2[];
}>;

export type StudioBrowserPublicationSnapshotSourceV3 = Readonly<{
  experimentId: string;
  expectedVersion: number;
}>;

export class StudioBrowserContentStoreV3 {
  readonly #storage: StudioBrowserStoragePortV3;

  constructor(storage: StudioBrowserStoragePortV3 = window.localStorage) {
    this.#storage = storage;
    RETIRED_CONTENT_STORE_KEYS_V3.forEach((key) => this.#storage.removeItem(key));
  }

  listExperiments(): readonly ExperimentV2[] {
    return this.#read().experiments;
  }

  listSnapshots(): readonly ExperimentSnapshotV2[] {
    return this.#read().snapshots;
  }

  listArticles(): readonly StudioArticleDraftV2[] {
    return this.#read().articles;
  }

  readExperiment(experimentId: string): ExperimentV2 | null {
    requireOpaqueExperimentIdV3(experimentId);
    return this.#read().experiments.find((experiment) =>
      experiment.experimentId === experimentId) ?? null;
  }

  readSnapshot(snapshotId: string): ExperimentSnapshotV2 | null {
    return this.#read().snapshots.find((snapshot) =>
      snapshot.snapshotId === snapshotId) ?? null;
  }

  readArticle(articleId: string): StudioArticleDraftV2 | null {
    return this.#read().articles.find((article) =>
      article.articleId === articleId) ?? null;
  }

  /**
   * Deletes only the explicitly saved mutable Experiment. Immutable
   * publication/article Snapshots remain valid independently.
   */
  deleteExperiment(experimentId: string): boolean {
    requireOpaqueExperimentIdV3(experimentId);
    const current = this.#read();
    if (!current.experiments.some((experiment) =>
      experiment.experimentId === experimentId)) return false;
    this.#write({
      ...current,
      experiments: Object.freeze(current.experiments.filter((experiment) =>
        experiment.experimentId !== experimentId)),
    });
    return true;
  }

  saveExperiment(
    experimentValue: unknown,
    candidateContentValue: unknown,
  ): ExperimentV2 {
    const experiment = validateExperimentV2(experimentValue);
    const candidateContent = validateExperimentContentV2(
      candidateContentValue,
    );
    assertContentPreservesCandidateAuthoredContentV3(
      candidateContent,
      experiment.content,
      "Saved Experiment",
    );
    requireOpaqueExperimentIdV3(experiment.experimentId);
    const current = this.#read();
    const stored = current.experiments.find(({ experimentId }) =>
      experimentId === experiment.experimentId);
    if (stored === undefined) {
      assertInitialExperimentV3(experiment);
    } else {
      assertExperimentAdvanceV3(stored, experiment);
    }
    this.#write({
      ...current,
      experiments: replaceByIdV3(
        current.experiments,
        experiment,
        ({ experimentId }) => experimentId,
      ),
    });
    return experiment;
  }

  /**
   * Persists one independently qualified immutable Snapshot. Snapshot
   * creation never mutates or implicitly creates an Experiment.
   */
  saveSnapshotCommit(
    input: StudioSimulationWorkerQualifiedSnapshotCommitV2,
    candidateContentValue: unknown,
    publicationSource?: StudioBrowserPublicationSnapshotSourceV3,
  ): Readonly<{ snapshot: ExperimentSnapshotV2 }> {
    assertStudioSimulationWorkerQualifiedSnapshotCommitV2(input);
    const candidateContent = validateExperimentContentV2(
      candidateContentValue,
    );
    const snapshot = validateExperimentSnapshotV2(input.snapshot);
    assertContentPreservesCandidateAuthoredContentV3(
      candidateContent,
      snapshot.content,
      "Qualified Snapshot",
    );
    const current = this.#read();
    if (snapshot.kind === "publication") {
      assertPublicationSourceV3(
        publicationSource,
        candidateContent,
        current.experiments,
      );
    } else if (publicationSource !== undefined) {
      throw new Error(
        "Article Snapshot must not carry a Publication Experiment source",
      );
    }
    assertNewSnapshotV3(snapshot, current.snapshots);
    this.#write({
      ...current,
      snapshots: Object.freeze([...current.snapshots, snapshot]),
    });
    return Object.freeze({ snapshot });
  }

  saveArticle(articleValue: unknown): StudioArticleDraftV2 {
    const article = validateStudioArticleDraftV2(articleValue);
    const current = this.#read();
    assertArticlePlacementsV3(article, current.snapshots);
    const stored = current.articles.find(({ articleId }) =>
      articleId === article.articleId);
    assertArticleDraftAdvanceV3(stored, article);
    this.#write({
      ...current,
      articles: replaceByIdV3(
        current.articles,
        article,
        ({ articleId }) => articleId,
      ),
    });
    return article;
  }

  #read(): StudioBrowserContentEnvelopeV3 {
    const raw = this.#storage.getItem(STUDIO_BROWSER_CONTENT_STORE_V3_KEY);
    if (raw === null) return emptyEnvelopeV3();
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(
        `Stored Studio browser content is not JSON: ${errorMessageV3(error)}`,
      );
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Stored Studio browser content must be an object");
    }
    const record = parsed as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    const expected = ["articles", "experiments", "schemaId", "snapshots"];
    if (
      keys.length !== expected.length
      || keys.some((key, index) => key !== expected[index])
      || record.schemaId !== STUDIO_BROWSER_CONTENT_STORE_V3_SCHEMA_ID
      || !Array.isArray(record.experiments)
      || !Array.isArray(record.snapshots)
      || !Array.isArray(record.articles)
    ) {
      throw new Error("Stored Studio browser content schema is invalid");
    }
    const envelope: StudioBrowserContentEnvelopeV3 = Object.freeze({
      schemaId: STUDIO_BROWSER_CONTENT_STORE_V3_SCHEMA_ID,
      experiments: Object.freeze(record.experiments.map(validateExperimentV2)),
      snapshots: Object.freeze(record.snapshots.map(validateExperimentSnapshotV2)),
      articles: Object.freeze(record.articles.map(validateStudioArticleDraftV2)),
    });
    assertEnvelopeV3(envelope);
    return envelope;
  }

  #write(input: StudioBrowserContentEnvelopeV3): void {
    const envelope: StudioBrowserContentEnvelopeV3 = Object.freeze({
      schemaId: STUDIO_BROWSER_CONTENT_STORE_V3_SCHEMA_ID,
      experiments: Object.freeze(input.experiments.map(validateExperimentV2)),
      snapshots: Object.freeze(input.snapshots.map(validateExperimentSnapshotV2)),
      articles: Object.freeze(input.articles.map(validateStudioArticleDraftV2)),
    });
    assertEnvelopeV3(envelope);
    this.#storage.setItem(
      STUDIO_BROWSER_CONTENT_STORE_V3_KEY,
      studioCanonicalJsonStringify(envelope),
    );
  }
}

function assertContentPreservesCandidateAuthoredContentV3(
  candidate: ReturnType<typeof validateExperimentContentV2>,
  persisted: ReturnType<typeof validateExperimentContentV2>,
  subject: string,
): void {
  if (
    candidate.modelId !== persisted.modelId
    || studioCanonicalJsonStringify(candidate.surface)
      !== studioCanonicalJsonStringify(persisted.surface)
    || candidate.scenarios.length !== persisted.scenarios.length
  ) {
    throw new Error(
      `${subject} changed the candidate model, Surface, or Scenario count`,
    );
  }
  candidate.scenarios.forEach((scenario, index) => {
    const qualified = persisted.scenarios[index];
    if (
      qualified === undefined
      || scenario.scenarioId !== qualified.scenarioId
      || scenario.label !== qualified.label
      || studioCanonicalJsonStringify(scenario.capture.fixture)
        !== studioCanonicalJsonStringify(qualified.capture.fixture)
    ) {
      throw new Error(
        `${subject} changed authored Scenario ${scenario.scenarioId}`,
      );
    }
  });
}

function assertPublicationSourceV3(
  source: StudioBrowserPublicationSnapshotSourceV3 | undefined,
  candidate: ReturnType<typeof validateExperimentContentV2>,
  experiments: readonly ExperimentV2[],
): void {
  if (source === undefined) {
    throw new Error(
      "Publication Snapshot requires a saved Experiment source",
    );
  }
  requireOpaqueExperimentIdV3(
    source.experimentId,
    "Publication source experimentId",
  );
  if (!Number.isSafeInteger(source.expectedVersion) || source.expectedVersion < 0) {
    throw new Error("Publication source expectedVersion must be non-negative");
  }
  const experiment = experiments.find(({ experimentId }) =>
    experimentId === source.experimentId);
  if (experiment === undefined) {
    throw new Error("Publication source Experiment is not saved");
  }
  if (experiment.version !== source.expectedVersion) {
    throw new Error(
      `Publication source expected version ${source.expectedVersion}, `
        + `found ${experiment.version}`,
    );
  }
  assertContentPreservesCandidateAuthoredContentV3(
    experiment.content,
    candidate,
    "Publication candidate",
  );
}

function assertEnvelopeV3(envelope: StudioBrowserContentEnvelopeV3): void {
  assertUniqueV3(
    envelope.experiments.map(({ experimentId }) => experimentId),
    "Experiment",
  );
  assertUniqueV3(
    envelope.snapshots.map(({ snapshotId }) => snapshotId),
    "Snapshot",
  );
  assertUniqueV3(
    envelope.articles.map(({ articleId }) => articleId),
    "Article",
  );
  envelope.experiments.forEach((experiment) => {
    requireOpaqueExperimentIdV3(
      experiment.experimentId,
      "Browser Experiment experimentId",
    );
  });
  envelope.articles.forEach((article) =>
    assertArticlePlacementsV3(article, envelope.snapshots));
}

function assertInitialExperimentV3(experiment: ExperimentV2): void {
  if (experiment.version !== 0) {
    throw new Error(
      "Browser content store initial Experiment must start at version 0",
    );
  }
}

function assertExperimentAdvanceV3(
  current: ExperimentV2,
  next: ExperimentV2,
): void {
  if (next.version !== current.version + 1) {
    throw new Error(
      "Browser content store Experiment version must advance by exactly one",
    );
  }
  if (next.content.modelId !== current.content.modelId) {
    throw new Error("Browser content store Experiment cannot change modelId");
  }
}

function assertNewSnapshotV3(
  snapshot: ExperimentSnapshotV2,
  snapshots: readonly ExperimentSnapshotV2[],
): void {
  if (snapshots.some(({ snapshotId }) => snapshotId === snapshot.snapshotId)) {
    throw new Error(
      `Browser content store immutable snapshotId already exists: ${snapshot.snapshotId}`,
    );
  }
}

function assertArticlePlacementsV3(
  article: StudioArticleDraftV2,
  snapshots: readonly ExperimentSnapshotV2[],
): void {
  const byId = new Map(snapshots.map((snapshot) =>
    [snapshot.snapshotId, snapshot] as const));
  article.blocks.forEach((block) => {
    if (block.kind !== "experiment") return;
    const snapshot = byId.get(block.placement.snapshotId);
    if (snapshot === undefined) {
      throw new Error(
        `Browser content store Article placement Snapshot not found: ${block.placement.snapshotId}`,
      );
    }
    validateExperimentPlacementAgainstSnapshotV2(block.placement, snapshot);
  });
}

function assertArticleDraftAdvanceV3(
  current: StudioArticleDraftV2 | undefined,
  next: StudioArticleDraftV2,
): void {
  if (current === undefined) {
    if (next.draftVersion !== 0) {
      throw new Error(
        "Browser content store initial Article must start at draftVersion 0",
      );
    }
    return;
  }
  if (next.draftVersion !== current.draftVersion + 1) {
    throw new Error(
      "Browser content store Article draftVersion must advance by exactly one",
    );
  }
}

function emptyEnvelopeV3(): StudioBrowserContentEnvelopeV3 {
  return Object.freeze({
    schemaId: STUDIO_BROWSER_CONTENT_STORE_V3_SCHEMA_ID,
    experiments: Object.freeze([]),
    snapshots: Object.freeze([]),
    articles: Object.freeze([]),
  });
}

function replaceByIdV3<TValue>(
  values: readonly TValue[],
  next: TValue,
  id: (value: TValue) => string,
): readonly TValue[] {
  const nextId = id(next);
  const found = values.some((value) => id(value) === nextId);
  return Object.freeze(found
    ? values.map((value) => id(value) === nextId ? next : value)
    : [...values, next]);
}

function assertUniqueV3(ids: readonly string[], kind: string): void {
  if (new Set(ids).size !== ids.length) {
    throw new Error(`Stored Studio browser content has duplicate ${kind} identity`);
  }
}

function errorMessageV3(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
