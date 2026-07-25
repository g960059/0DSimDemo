import {
  STUDIO_AUTHOR_DRAFT_V1_SCHEMA_ID,
  STUDIO_DOCUMENT_REVISION_V1_SCHEMA_ID,
  STUDIO_EXPERIMENT_REVISION_V1_SCHEMA_ID,
  STUDIO_GRAPH_PANE_V1_SCHEMA_ID,
  STUDIO_READER_BRIEF_V1_SCHEMA_ID,
  STUDIO_READER_PREVIEW_MANIFEST_V1_SCHEMA_ID,
  STUDIO_RESOLVED_READER_EXPERIMENT_V1_SCHEMA_ID,
  STUDIO_RESOLVED_READER_DOCUMENT_V1_SCHEMA_ID,
  type ExperimentScenarioRuntimeSourceV1,
  type ExperimentRevisionV1,
  type ReaderBriefV1,
  type ReaderPreviewManifestV1,
  type ResolvedReaderExperimentV1,
  type ReaderControlSpecV1,
  type ReaderInstantaneousReadbackSpecV1,
  type ResolvedReaderDocumentV1,
  type StudioExperimentPlacementBlockV1,
  type ResolvedReaderExperimentPlacementV1,
  type StudioAuthorDraftV1,
  type StudioDocumentBlockV1,
  type StudioGraphPaneSpecV1,
  type StudioReaderPreviewIdV1,
} from "@/studio/contracts/v1";

const MAXIMUM_SERIALIZABLE_DEPTH_V1 = 128;
const PORTABLE_IDENTIFIER_PATTERN_V1 =
  /^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/;

export class StudioAuthorPreviewValidationErrorV1 extends Error {
  constructor(path: string, message: string) {
    super(`Studio author preview rejected ${path}: ${message}`);
    this.name = "StudioAuthorPreviewValidationErrorV1";
  }
}

export class StudioAuthorPreviewRevisionConflictErrorV1 extends Error {
  constructor(expectedRevision: number, actualRevision: number) {
    super(
      "Studio author draft revision conflict: expected "
      + `${expectedRevision}, actual ${actualRevision}`,
    );
    this.name = "StudioAuthorPreviewRevisionConflictErrorV1";
  }
}

export type StudioAuthorPreviewIdFactoryV1 =
  () => StudioReaderPreviewIdV1;

export type UpdateStudioAuthorTitleCommandV1 = Readonly<{
  expectedRevision: number;
  title: string;
}>;

export type UpdateStudioAuthorTextBlockCommandV1 = Readonly<{
  expectedRevision: number;
  blockId: string;
  text: string;
}>;

export type ReplaceStudioAuthorDocumentContentCommandV1 = Readonly<{
  expectedRevision: number;
  title: string;
  blocks: readonly StudioDocumentBlockV1[];
}>;

export type ReplaceStudioAuthorReaderBriefGraphPanesCommandV1 = Readonly<{
  expectedRevision: number;
  experimentId: string;
  briefId: string;
  graphPanes: readonly StudioGraphPaneSpecV1[];
}>;

export type ReplaceStudioAuthorReaderBriefSelectionCommandV1 = Readonly<{
  expectedRevision: number;
  experimentId: string;
  briefId: string;
  instantaneousReadbacks: readonly ReaderInstantaneousReadbackSpecV1[];
  controls: readonly ReaderControlSpecV1[];
}>;

export type MaterializeStudioReaderPreviewCommandV1 = Readonly<{
  expectedRevision: number;
}>;

/**
 * Session-local authoring seam for draft Reader Preview.
 *
 * This application intentionally has no persistence, publication, or sharing
 * methods. Every preview is detached from the editable draft and exists only
 * in this application instance.
 */
export class StudioAuthorPreviewApplicationV1 {
  private draft: StudioAuthorDraftV1;
  private readonly previews =
    new Map<StudioReaderPreviewIdV1, ReaderPreviewManifestV1>();
  private readonly idFactory: StudioAuthorPreviewIdFactoryV1;
  private documentHistory: readonly Readonly<{
    title: string;
    blocks: readonly StudioDocumentBlockV1[];
  }>[];
  private documentHistoryIndex: number;

  constructor(input: Readonly<{
    initialDraft: StudioAuthorDraftV1;
    idFactory?: StudioAuthorPreviewIdFactoryV1;
  }>) {
    this.draft = cloneThenDeepFreezeSerializableV1(
      input.initialDraft,
      "$.initialDraft",
    );
    this.idFactory = input.idFactory ?? (() =>
      `reader-preview-${globalThis.crypto.randomUUID()}`);
    this.documentHistory = [{
      title: this.draft.document.title,
      blocks: this.draft.document.blocks,
    }];
    this.documentHistoryIndex = 0;
  }

  getDraftSnapshot(): StudioAuthorDraftV1 {
    return this.draft;
  }

  updateTitle(
    command: UpdateStudioAuthorTitleCommandV1,
  ): StudioAuthorDraftV1 {
    this.assertExpectedRevision(command.expectedRevision);
    draftTextV1(command.title, "$.command.title");
    this.draft = cloneThenDeepFreezeSerializableV1({
      ...this.draft,
      revision: nextRevisionV1(this.draft.revision, "$.draft.revision"),
      document: {
        ...this.draft.document,
        revision: nextRevisionV1(
          this.draft.document.revision,
          "$.draft.document.revision",
        ),
        title: command.title,
      },
    }, "$.draft");
    return this.draft;
  }

  updateTextBlock(
    command: UpdateStudioAuthorTextBlockCommandV1,
  ): StudioAuthorDraftV1 {
    this.assertExpectedRevision(command.expectedRevision);
    requiredPortableIdV1(command.blockId, "$.command.blockId");
    draftTextV1(command.text, "$.command.text");
    let found = false;
    const blocks = this.draft.document.blocks.map((block) => {
      if (block.blockId !== command.blockId) return block;
      found = true;
      if (block.kind === "experiment-placement") {
        throw validationErrorV1(
          "$.command.blockId",
          "experiment placements are not editable text blocks",
        );
      }
      return { ...block, text: command.text };
    });
    if (!found) {
      throw validationErrorV1(
        "$.command.blockId",
        `unknown text block ${command.blockId}`,
      );
    }
    this.draft = cloneThenDeepFreezeSerializableV1({
      ...this.draft,
      revision: nextRevisionV1(this.draft.revision, "$.draft.revision"),
      document: {
        ...this.draft.document,
        revision: nextRevisionV1(
          this.draft.document.revision,
          "$.draft.document.revision",
        ),
        blocks,
      },
    }, "$.draft");
    return this.draft;
  }

  /**
   * Commits one canonical Document Editor transaction.
   *
   * The complete candidate graph is validated before the owned draft changes,
   * so a title edit, block edit, and reorder either advance together by one
   * revision or leave the previous draft untouched.
   */
  /**
   * Undo is a forward command, never a rewind.
   *
   * The audit trail is append-only, so undoing re-issues the previous content
   * as a new content replacement. The revision therefore always advances, and
   * an undone edit is as recoverable as any other.
   */
  canUndoDocumentContent(): boolean {
    return this.documentHistoryIndex > 0;
  }

  canRedoDocumentContent(): boolean {
    return this.documentHistoryIndex < this.documentHistory.length - 1;
  }

  undoDocumentContent(): StudioAuthorDraftV1 {
    if (!this.canUndoDocumentContent()) return this.draft;
    this.documentHistoryIndex -= 1;
    return this.applyDocumentHistoryV1();
  }

  redoDocumentContent(): StudioAuthorDraftV1 {
    if (!this.canRedoDocumentContent()) return this.draft;
    this.documentHistoryIndex += 1;
    return this.applyDocumentHistoryV1();
  }

  private applyDocumentHistoryV1(): StudioAuthorDraftV1 {
    const entry = this.documentHistory[this.documentHistoryIndex]!;
    this.replaceDocumentContent({
      expectedRevision: this.draft.revision,
      title: entry.title,
      blocks: entry.blocks,
    }, { recordHistory: false });
    return this.draft;
  }

  replaceDocumentContent(
    command: ReplaceStudioAuthorDocumentContentCommandV1,
    options: Readonly<{ recordHistory?: boolean }> = {},
  ): StudioAuthorDraftV1 {
    this.assertExpectedRevision(command.expectedRevision);
    const candidateAtCurrentRevision = validateStudioAuthorDraftV1({
      ...this.draft,
      document: {
        ...this.draft.document,
        title: command.title,
        blocks: command.blocks,
      },
    });
    if (
      candidateAtCurrentRevision.document.title === this.draft.document.title
      && sameDocumentBlocksV1(
        candidateAtCurrentRevision.document.blocks,
        this.draft.document.blocks,
      )
    ) {
      return this.draft;
    }

    this.draft = validateStudioAuthorDraftV1({
      ...candidateAtCurrentRevision,
      revision: nextRevisionV1(
        this.draft.revision,
        "$.draft.revision",
      ),
      document: {
        ...candidateAtCurrentRevision.document,
        revision: nextRevisionV1(
          this.draft.document.revision,
          "$.draft.document.revision",
        ),
      },
    });
    if (options.recordHistory !== false) {
      this.documentHistory = [
        ...this.documentHistory.slice(0, this.documentHistoryIndex + 1),
        {
          title: this.draft.document.title,
          blocks: this.draft.document.blocks,
        },
      ];
      this.documentHistoryIndex = this.documentHistory.length - 1;
    }
    return this.draft;
  }

  /**
   * Replaces the detached graph presentation captured for one Reader brief.
   *
   * A Brief belongs to its Experiment aggregate, so this advances the draft
   * and Experiment revisions together while leaving the Document revision
   * unchanged. Validation and cloning occur before the owned draft changes.
   */
  replaceReaderBriefGraphPanes(
    command: ReplaceStudioAuthorReaderBriefGraphPanesCommandV1,
  ): StudioAuthorDraftV1 {
    this.assertExpectedRevision(command.expectedRevision);
    requiredPortableIdV1(
      command.experimentId,
      "$.command.experimentId",
    );
    requiredPortableIdV1(command.briefId, "$.command.briefId");
    const experimentIndex = this.draft.experiments.findIndex(
      ({ experimentId }) => experimentId === command.experimentId,
    );
    if (experimentIndex < 0) {
      throw validationErrorV1(
        "$.command.experimentId",
        `unknown experiment ${command.experimentId}`,
      );
    }
    const currentExperiment = this.draft.experiments[experimentIndex]!;
    const briefIndex = currentExperiment.readerBriefs.findIndex(
      ({ briefId }) => briefId === command.briefId,
    );
    if (briefIndex < 0) {
      throw validationErrorV1(
        "$.command.briefId",
        `unknown Reader brief ${command.briefId}`,
      );
    }

    const candidateAtCurrentRevision = validateStudioAuthorDraftV1({
      ...this.draft,
      experiments: this.draft.experiments.map((experiment, index) =>
        index !== experimentIndex
          ? experiment
          : {
              ...experiment,
              readerBriefs: experiment.readerBriefs.map((brief, index) =>
                index !== briefIndex
                  ? brief
                  : {
                      ...brief,
                      graphPanes: command.graphPanes,
                    }),
            }),
    });
    const candidateExperiment =
      candidateAtCurrentRevision.experiments[experimentIndex]!;
    const candidateBrief = candidateExperiment.readerBriefs[briefIndex]!;
    const currentBrief = currentExperiment.readerBriefs[briefIndex]!;
    if (
      sameSerializableValueV1(
        candidateBrief.graphPanes,
        currentBrief.graphPanes,
      )
    ) {
      return this.draft;
    }

    this.draft = validateStudioAuthorDraftV1({
      ...candidateAtCurrentRevision,
      revision: nextRevisionV1(
        this.draft.revision,
        "$.draft.revision",
      ),
      experiments: candidateAtCurrentRevision.experiments.map(
        (experiment, index) =>
          index !== experimentIndex
            ? experiment
            : {
                ...experiment,
                revision: nextRevisionV1(
                  currentExperiment.revision,
                  `$.draft.experiments[${experimentIndex}].revision`,
                ),
              },
      ),
    });
    return this.draft;
  }

  /**
   * Replaces the readbacks and controls a Reader brief exposes.
   *
   * These are selections over the same brief aggregate as its graph panes, so
   * this advances the draft and Experiment revisions together and leaves the
   * Document revision alone. Referential closure (every readback signal backed
   * by a pinned waveform item) is enforced by draft validation.
   */
  replaceReaderBriefSelection(
    command: ReplaceStudioAuthorReaderBriefSelectionCommandV1,
  ): StudioAuthorDraftV1 {
    this.assertExpectedRevision(command.expectedRevision);
    requiredPortableIdV1(command.experimentId, "$.command.experimentId");
    requiredPortableIdV1(command.briefId, "$.command.briefId");
    const experimentIndex = this.draft.experiments.findIndex(
      ({ experimentId }) => experimentId === command.experimentId,
    );
    if (experimentIndex < 0) {
      throw validationErrorV1(
        "$.command.experimentId",
        `unknown experiment ${command.experimentId}`,
      );
    }
    const currentExperiment = this.draft.experiments[experimentIndex]!;
    const briefIndex = currentExperiment.readerBriefs.findIndex(
      ({ briefId }) => briefId === command.briefId,
    );
    if (briefIndex < 0) {
      throw validationErrorV1(
        "$.command.briefId",
        `unknown Reader brief ${command.briefId}`,
      );
    }

    const candidateAtCurrentRevision = validateStudioAuthorDraftV1({
      ...this.draft,
      experiments: this.draft.experiments.map((experiment, index) =>
        index !== experimentIndex
          ? experiment
          : {
              ...experiment,
              readerBriefs: experiment.readerBriefs.map((brief, index) =>
                index !== briefIndex
                  ? brief
                  : {
                      ...brief,
                      instantaneousReadbacks: command.instantaneousReadbacks,
                      controls: command.controls,
                    }),
            }),
    });
    const candidateBrief =
      candidateAtCurrentRevision.experiments[experimentIndex]!
        .readerBriefs[briefIndex]!;
    const currentBrief = currentExperiment.readerBriefs[briefIndex]!;
    if (
      sameSerializableSelectionV1(
        candidateBrief.instantaneousReadbacks,
        currentBrief.instantaneousReadbacks,
      )
      && sameSerializableSelectionV1(
        candidateBrief.controls,
        currentBrief.controls,
      )
    ) {
      return this.draft;
    }

    this.draft = validateStudioAuthorDraftV1({
      ...candidateAtCurrentRevision,
      revision: nextRevisionV1(this.draft.revision, "$.draft.revision"),
      experiments: candidateAtCurrentRevision.experiments.map(
        (experiment, index) =>
          index !== experimentIndex
            ? experiment
            : {
                ...experiment,
                revision: nextRevisionV1(
                  currentExperiment.revision,
                  `$.draft.experiments[${experimentIndex}].revision`,
                ),
              },
      ),
    });
    return this.draft;
  }

  materializePreview(
    command: MaterializeStudioReaderPreviewCommandV1,
  ): ReaderPreviewManifestV1 {
    this.assertExpectedRevision(command.expectedRevision);
    const sourceDraft = validateStudioAuthorDraftV1(this.draft);
    const previewId = requiredPortableIdV1(
      this.idFactory(),
      "$.previewId",
    );
    if (this.previews.has(previewId)) {
      throw validationErrorV1(
        "$.previewId",
        `duplicate session preview id ${previewId}`,
      );
    }

    const { placements, runtimeBindings } =
      this.resolvePlacementsV1(sourceDraft);

    // sourceDraft is already a clone of the live application draft. Clone the
    // complete manifest once more before freezing so no stored preview can
    // alias either the editable aggregate or a caller-owned value.
    const manifest = cloneThenDeepFreezeSerializableV1<
      ReaderPreviewManifestV1
    >({
      schemaId: STUDIO_READER_PREVIEW_MANIFEST_V1_SCHEMA_ID,
      previewId,
      trust: "draft-preview-uncertified",
      sharePolicy: "session-only",
      publicationManifestRef: null,
      source: {
        kind: "draft-revision",
        draftId: sourceDraft.draftId,
        revision: sourceDraft.revision,
      },
      runtimeBindings: Object.fromEntries(runtimeBindings),
      resolvedReaderDocument: {
        schemaId: STUDIO_RESOLVED_READER_DOCUMENT_V1_SCHEMA_ID,
        document: sourceDraft.document,
        placements,
      },
    }, "$.manifest");
    this.previews.set(previewId, manifest);
    return manifest;
  }

  /**
   * Resolves the current draft into publication-neutral Reader input.
   *
   * The unified document surface renders this on every edit so an author sees
   * the real Reader output while writing. It intentionally mints no preview
   * id: a materialized preview stays the immutable, session-only artifact.
   */
  resolveDocument(): ResolvedReaderDocumentV1 {
    const sourceDraft = validateStudioAuthorDraftV1(this.draft);
    const { placements } = this.resolvePlacementsV1(sourceDraft);
    return cloneThenDeepFreezeSerializableV1<ResolvedReaderDocumentV1>({
      schemaId: STUDIO_RESOLVED_READER_DOCUMENT_V1_SCHEMA_ID,
      document: sourceDraft.document,
      placements,
    }, "$.resolvedReaderDocument");
  }

  private resolvePlacementsV1(sourceDraft: StudioAuthorDraftV1): Readonly<{
    placements: readonly ResolvedReaderExperimentPlacementV1[];
    runtimeBindings: ReadonlyMap<string, ExperimentScenarioRuntimeSourceV1>;
  }> {
    const experiments = new Map<string, ExperimentRevisionV1>(
      sourceDraft.experiments.map((experiment) => [
        experiment.experimentId,
        experiment,
      ]),
    );
    const placements: ResolvedReaderExperimentPlacementV1[] = [];
    const runtimeBindings = new Map<
      string,
      ExperimentScenarioRuntimeSourceV1
    >();
    for (const block of sourceDraft.document.blocks) {
      if (block.kind !== "experiment-placement") continue;
      const experiment = experiments.get(block.experimentId);
      if (experiment === undefined) {
        throw validationErrorV1(
          `$.document.blocks[${block.blockId}]`,
          `dangling experiment ${block.experimentId}`,
        );
      }
      const readerBrief = experiment.readerBriefs.find(
        (brief) => brief.briefId === block.readerBriefId,
      );
      if (readerBrief === undefined) {
        throw validationErrorV1(
          `$.document.blocks[${block.blockId}]`,
          `dangling reader brief ${block.readerBriefId}`,
        );
      }
      const resolvedExperiment: ResolvedReaderExperimentV1 = {
        schemaId: STUDIO_RESOLVED_READER_EXPERIMENT_V1_SCHEMA_ID,
        experimentId: experiment.experimentId,
        revision: experiment.revision,
        modelRef: experiment.modelRef,
        scenarios: experiment.scenarios.map((scenario) => {
          const currentBinding = runtimeBindings.get(scenario.scenarioId);
          if (
            currentBinding !== undefined
            && !sameRuntimeSourceV1(currentBinding, scenario.runtimeSource)
          ) {
            throw validationErrorV1(
              `$.runtimeBindings.${scenario.scenarioId}`,
              "conflicting preview runtime sources",
            );
          }
          runtimeBindings.set(scenario.scenarioId, scenario.runtimeSource);
          return {
            scenarioId: scenario.scenarioId,
            label: scenario.label,
          };
        }),
        readerBriefs: experiment.readerBriefs,
      };
      placements.push({
        placementBlockId: block.blockId,
        experiment: resolvedExperiment,
        readerBrief,
        inlineMode: block.inlineMode,
        localCaption: block.localCaption,
      });
    }

    return { placements, runtimeBindings };
  }

  resolvePreview(
    previewId: StudioReaderPreviewIdV1,
  ): ReaderPreviewManifestV1 | null {
    if (
      typeof previewId !== "string"
      || !PORTABLE_IDENTIFIER_PATTERN_V1.test(previewId)
    ) return null;
    return this.previews.get(previewId) ?? null;
  }

  private assertExpectedRevision(expectedRevision: number): void {
    if (
      !Number.isSafeInteger(expectedRevision)
      || expectedRevision < 0
    ) {
      throw validationErrorV1(
        "$.command.expectedRevision",
        "must be a nonnegative safe integer",
      );
    }
    if (expectedRevision !== this.draft.revision) {
      throw new StudioAuthorPreviewRevisionConflictErrorV1(
        expectedRevision,
        this.draft.revision,
      );
    }
  }
}

function sameRuntimeSourceV1(
  left: ExperimentScenarioRuntimeSourceV1,
  right: ExperimentScenarioRuntimeSourceV1,
): boolean {
  return left.kind === right.kind
    && left.sourceId === right.sourceId
    && left.qualification === right.qualification;
}

function sameSerializableSelectionV1(
  left: unknown,
  right: unknown,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sameDocumentBlocksV1(
  left: readonly StudioDocumentBlockV1[],
  right: readonly StudioDocumentBlockV1[],
): boolean {
  if (left.length !== right.length) return false;
  return left.every((block, index) => {
    const other = right[index];
    if (
      other === undefined
      || block.blockId !== other.blockId
      || block.kind !== other.kind
    ) {
      return false;
    }
    if (block.kind === "experiment-placement") {
      if (other.kind !== "experiment-placement") return false;
      // Adding a placement field must not silently drop out of this
      // comparison: an unnoticed omission reports a real edit as "unchanged".
      const compared: Readonly<
        Record<keyof StudioExperimentPlacementBlockV1, true>
      > = {
        blockId: true,
        kind: true,
        experimentId: true,
        readerBriefId: true,
        inlineMode: true,
        localCaption: true,
      };
      void compared;
      return block.experimentId === other.experimentId
        && block.readerBriefId === other.readerBriefId
        && block.inlineMode === other.inlineMode
        && block.localCaption === other.localCaption;
    }
    if (other.kind === "experiment-placement" || block.text !== other.text) {
      return false;
    }
    return block.kind === "paragraph"
      || (
        other.kind === "heading"
        && block.level === other.level
      );
  });
}

function sameSerializableValueV1(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (
    left === null
    || right === null
    || typeof left !== "object"
    || typeof right !== "object"
  ) {
    return false;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) =>
        sameSerializableValueV1(value, right[index]));
  }
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord);
  const rightKeys = Object.keys(rightRecord);
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) =>
      Object.prototype.hasOwnProperty.call(rightRecord, key)
      && sameSerializableValueV1(leftRecord[key], rightRecord[key]));
}

/**
 * Validates the complete draft graph and returns a detached, deeply frozen
 * value. This is the only ingress used by preview materialization.
 */
export function validateStudioAuthorDraftV1(
  value: unknown,
): StudioAuthorDraftV1 {
  const draft = cloneThenDeepFreezeSerializableV1<StudioAuthorDraftV1>(
    value,
    "$.draft",
  );
  assertExactKeysV1(draft, [
    "schemaId",
    "draftId",
    "revision",
    "document",
    "experiments",
  ], "$.draft");
  if (draft.schemaId !== STUDIO_AUTHOR_DRAFT_V1_SCHEMA_ID) {
    throw validationErrorV1("$.draft.schemaId", "schema identity mismatch");
  }
  requiredPortableIdV1(draft.draftId, "$.draft.draftId");
  nonnegativeRevisionV1(draft.revision, "$.draft.revision");
  validateDocumentV1(draft.document);
  if (!Array.isArray(draft.experiments)) {
    throw validationErrorV1("$.draft.experiments", "must be an array");
  }

  const experimentIds = new Set<string>();
  const scenarioIds = new Set<string>();
  draft.experiments.forEach((experiment, index) => {
    const path = `$.draft.experiments[${index}]`;
    validateExperimentV1(experiment, path, scenarioIds);
    assertUniqueIdV1(
      experimentIds,
      experiment.experimentId,
      `${path}.experimentId`,
    );
  });
  validatePlacementsV1(draft.document.blocks, draft.experiments);
  return draft;
}

function validateDocumentV1(
  document: StudioAuthorDraftV1["document"],
): void {
  assertExactKeysV1(document, [
    "schemaId",
    "documentId",
    "revision",
    "locale",
    "title",
    "blocks",
  ], "$.draft.document");
  if (document.schemaId !== STUDIO_DOCUMENT_REVISION_V1_SCHEMA_ID) {
    throw validationErrorV1(
      "$.draft.document.schemaId",
      "schema identity mismatch",
    );
  }
  requiredPortableIdV1(
    document.documentId,
    "$.draft.document.documentId",
  );
  nonnegativeRevisionV1(
    document.revision,
    "$.draft.document.revision",
  );
  requiredTrimmedStringV1(document.locale, "$.draft.document.locale");
  draftTextV1(document.title, "$.draft.document.title");
  if (!Array.isArray(document.blocks) || document.blocks.length === 0) {
    throw validationErrorV1(
      "$.draft.document.blocks",
      "must be a nonempty array",
    );
  }
  const blockIds = new Set<string>();
  document.blocks.forEach((block, index) => {
    const path = `$.draft.document.blocks[${index}]`;
    assertUniqueIdV1(
      blockIds,
      requiredPortableIdV1(block.blockId, `${path}.blockId`),
      `${path}.blockId`,
    );
    if (block.kind === "heading") {
      assertExactKeysV1(block, [
        "blockId",
        "kind",
        "level",
        "text",
      ], path);
      if (block.level !== 2 && block.level !== 3) {
        throw validationErrorV1(`${path}.level`, "must be 2 or 3");
      }
      draftTextV1(block.text, `${path}.text`);
      return;
    }
    if (block.kind === "paragraph") {
      assertExactKeysV1(block, ["blockId", "kind", "text"], path);
      draftTextV1(block.text, `${path}.text`);
      return;
    }
    if (block.kind === "experiment-placement") {
      assertExactKeysV1(block, [
        "blockId",
        "kind",
        "experimentId",
        "readerBriefId",
        "inlineMode",
        "localCaption",
      ], path);
      requiredPortableIdV1(block.experimentId, `${path}.experimentId`);
      requiredPortableIdV1(block.readerBriefId, `${path}.readerBriefId`);
      if (
        block.inlineMode !== "live"
        && block.inlineMode !== "compact"
        && block.inlineMode !== "launch"
      ) {
        throw validationErrorV1(
          `${path}.inlineMode`,
          "must be live, compact, or launch",
        );
      }
      if (block.localCaption !== null) {
        requiredTrimmedStringV1(
          block.localCaption,
          `${path}.localCaption`,
        );
      }
      return;
    }
    throw validationErrorV1(`${path}.kind`, "unsupported block kind");
  });
}

function validateExperimentV1(
  experiment: ExperimentRevisionV1,
  path: string,
  globalScenarioIds: Set<string>,
): void {
  assertExactKeysV1(experiment, [
    "schemaId",
    "experimentId",
    "revision",
    "modelRef",
    "scenarios",
    "readerBriefs",
  ], path);
  if (experiment.schemaId !== STUDIO_EXPERIMENT_REVISION_V1_SCHEMA_ID) {
    throw validationErrorV1(`${path}.schemaId`, "schema identity mismatch");
  }
  requiredPortableIdV1(experiment.experimentId, `${path}.experimentId`);
  nonnegativeRevisionV1(experiment.revision, `${path}.revision`);
  requiredTrimmedStringV1(experiment.modelRef, `${path}.modelRef`);
  if (!Array.isArray(experiment.scenarios) || experiment.scenarios.length === 0) {
    throw validationErrorV1(`${path}.scenarios`, "must be a nonempty array");
  }
  const localScenarioIds = new Set<string>();
  experiment.scenarios.forEach((scenario, index) => {
    const scenarioPath = `${path}.scenarios[${index}]`;
    assertExactKeysV1(
      scenario,
      ["scenarioId", "label", "runtimeSource"],
      scenarioPath,
    );
    const scenarioId = requiredPortableIdV1(
      scenario.scenarioId,
      `${scenarioPath}.scenarioId`,
    );
    assertUniqueIdV1(
      localScenarioIds,
      scenarioId,
      `${scenarioPath}.scenarioId`,
    );
    assertUniqueIdV1(
      globalScenarioIds,
      scenarioId,
      `${scenarioPath}.scenarioId`,
    );
    requiredTrimmedStringV1(scenario.label, `${scenarioPath}.label`);
    assertExactKeysV1(
      scenario.runtimeSource,
      ["kind", "sourceId", "qualification"],
      `${scenarioPath}.runtimeSource`,
    );
    if (
      scenario.runtimeSource.kind !== "preview-bootstrap"
      || scenario.runtimeSource.qualification !== "uncertified-preview-only"
    ) {
      throw validationErrorV1(
        `${scenarioPath}.runtimeSource`,
        "must be an uncertified preview-bootstrap source",
      );
    }
    requiredPortableIdV1(
      scenario.runtimeSource.sourceId,
      `${scenarioPath}.runtimeSource.sourceId`,
    );
  });
  if (
    !Array.isArray(experiment.readerBriefs)
    || experiment.readerBriefs.length === 0
  ) {
    throw validationErrorV1(
      `${path}.readerBriefs`,
      "must be a nonempty array",
    );
  }
  const briefIds = new Set<string>();
  experiment.readerBriefs.forEach((brief, index) => {
    const briefPath = `${path}.readerBriefs[${index}]`;
    validateReaderBriefV1(brief, briefPath, localScenarioIds);
    assertUniqueIdV1(
      briefIds,
      brief.briefId,
      `${briefPath}.briefId`,
    );
  });
}

function validateReaderBriefV1(
  brief: ReaderBriefV1,
  path: string,
  scenarioIds: ReadonlySet<string>,
): void {
  assertExactKeysV1(brief, [
    "schemaId",
    "briefId",
    "extent",
    "graphPanes",
    "instantaneousReadbacks",
    "controls",
  ], path);
  if (brief.schemaId !== STUDIO_READER_BRIEF_V1_SCHEMA_ID) {
    throw validationErrorV1(`${path}.schemaId`, "schema identity mismatch");
  }
  requiredPortableIdV1(brief.briefId, `${path}.briefId`);
  if (
    brief.extent !== "inflow"
    && brief.extent !== "peek"
    && brief.extent !== "fullscreen"
  ) {
    throw validationErrorV1(
      `${path}.extent`,
      "must be inflow, peek, or fullscreen",
    );
  }
  if (!Array.isArray(brief.graphPanes)) {
    throw validationErrorV1(
      `${path}.graphPanes`,
      "must be an array",
    );
  }
  // A draft brief starts empty and is built by picking on the Workbench, so
  // no graphs is a legal drafting state — the same drafting-versus-publication
  // split that lets a block hold the text an author is still typing. Carrying
  // at least one graph is a gate on publishing a brief, not a rule that may
  // stop an author from clearing what they picked.
  const signalIds = validateGraphPanesV1(
    brief.graphPanes,
    `${path}.graphPanes`,
    scenarioIds,
  );
  if (!Array.isArray(brief.instantaneousReadbacks)) {
    throw validationErrorV1(
      `${path}.instantaneousReadbacks`,
      "must be an array",
    );
  }
  const readbackIds = new Set<string>();
  brief.instantaneousReadbacks.forEach((readback, index) => {
    const readbackPath = `${path}.instantaneousReadbacks[${index}]`;
    assertExactKeysV1(readback, [
      "readbackId",
      "signalId",
      "label",
      "unit",
      "sampling",
    ], readbackPath);
    const readbackId = requiredPortableIdV1(
      readback.readbackId,
      `${readbackPath}.readbackId`,
    );
    assertUniqueIdV1(
      readbackIds,
      readbackId,
      `${readbackPath}.readbackId`,
    );
    const signalId = requiredPortableIdV1(
      readback.signalId,
      `${readbackPath}.signalId`,
    );
    if (
      readback.sampling !== "beat"
      && !signalIds.has(signalId)
    ) {
      throw validationErrorV1(
        `${readbackPath}.signalId`,
        `dangling explicit signal ${signalId}`,
      );
    }
    requiredTrimmedStringV1(readback.label, `${readbackPath}.label`);
    requiredTrimmedStringV1(readback.unit, `${readbackPath}.unit`);
    if (
      readback.sampling !== "instantaneous"
      && readback.sampling !== "beat"
    ) {
      throw validationErrorV1(
        `${readbackPath}.sampling`,
        "must be instantaneous or beat",
      );
    }
  });
  if (!Array.isArray(brief.controls) || brief.controls.length > 2) {
    throw validationErrorV1(
      `${path}.controls`,
      "must contain zero to two controls",
    );
  }
  const controlIds = new Set<string>();
  brief.controls.forEach((control, index) => {
    const controlPath = `${path}.controls[${index}]`;
    assertExactKeysV1(control, [
      "controlId",
      "label",
      "unit",
      "allowedValues",
      "initialValue",
      "binding",
    ], controlPath);
    const controlId = requiredPortableIdV1(
      control.controlId,
      `${controlPath}.controlId`,
    );
    assertUniqueIdV1(
      controlIds,
      controlId,
      `${controlPath}.controlId`,
    );
    requiredTrimmedStringV1(control.label, `${controlPath}.label`);
    requiredTrimmedStringV1(control.unit, `${controlPath}.unit`);
    if (
      !Array.isArray(control.allowedValues)
      || control.allowedValues.length === 0
    ) {
      throw validationErrorV1(
        `${controlPath}.allowedValues`,
        "must be a nonempty array",
      );
    }
    const allowedValues = new Set<number>();
    control.allowedValues.forEach((allowed, valueIndex) => {
      if (!Number.isFinite(allowed)) {
        throw validationErrorV1(
          `${controlPath}.allowedValues[${valueIndex}]`,
          "must be finite",
        );
      }
      if (allowedValues.has(allowed)) {
        throw validationErrorV1(
          `${controlPath}.allowedValues[${valueIndex}]`,
          `duplicate value ${allowed}`,
        );
      }
      allowedValues.add(allowed);
    });
    if (
      typeof control.initialValue !== "number"
      || !Number.isFinite(control.initialValue)
      || !allowedValues.has(control.initialValue)
    ) {
      throw validationErrorV1(
        `${controlPath}.initialValue`,
        "must be finite and included in allowedValues",
      );
    }
    assertExactKeysV1(control.binding, [
      "parameterKey",
      "readbackSignalId",
      "target",
    ], `${controlPath}.binding`);
    requiredPortableIdV1(
      control.binding.parameterKey,
      `${controlPath}.binding.parameterKey`,
    );
    if (
      control.binding.readbackSignalId !== null
      && (
        typeof control.binding.readbackSignalId !== "string"
        || !signalIds.has(control.binding.readbackSignalId)
      )
    ) {
      throw validationErrorV1(
        `${controlPath}.binding.readbackSignalId`,
        "must be null or an explicit signal id",
      );
    }
    assertExactKeysV1(
      control.binding.target,
      ["scenarioIds", "application"],
      `${controlPath}.binding.target`,
    );
    if (control.binding.target.application !== "absolute") {
      throw validationErrorV1(
        `${controlPath}.binding.target.application`,
        "must be absolute",
      );
    }
    if (
      !Array.isArray(control.binding.target.scenarioIds)
      || control.binding.target.scenarioIds.length === 0
    ) {
      throw validationErrorV1(
        `${controlPath}.binding.target.scenarioIds`,
        "must explicitly name at least one scenario",
      );
    }
    const targetIds = new Set<string>();
    control.binding.target.scenarioIds.forEach((scenarioId, targetIndex) => {
      const targetPath =
        `${controlPath}.binding.target.scenarioIds[${targetIndex}]`;
      requiredPortableIdV1(scenarioId, targetPath);
      assertUniqueIdV1(targetIds, scenarioId, targetPath);
      if (!scenarioIds.has(scenarioId)) {
        throw validationErrorV1(
          targetPath,
          `dangling scenario target ${scenarioId}`,
        );
      }
    });
  });
}

function validateGraphPanesV1(
  panes: readonly StudioGraphPaneSpecV1[],
  path: string,
  experimentScenarioIds: ReadonlySet<string>,
): Set<string> {
  const paneIds = new Set<string>();
  const waveformSignalIds = new Set<string>();
  panes.forEach((pane, paneIndex) => {
    const panePath = `${path}[${paneIndex}]`;
    assertExactKeysV1(pane, [
      "schemaId",
      "paneId",
      "title",
      "kind",
      "scenarios",
      "presentation",
    ], panePath);
    if (pane.schemaId !== STUDIO_GRAPH_PANE_V1_SCHEMA_ID) {
      throw validationErrorV1(
        `${panePath}.schemaId`,
        "schema identity mismatch",
      );
    }
    const paneId = requiredPortableIdV1(
      pane.paneId,
      `${panePath}.paneId`,
    );
    assertUniqueIdV1(paneIds, paneId, `${panePath}.paneId`);
    requiredTrimmedStringV1(pane.title, `${panePath}.title`);
    if (
      pane.kind !== "waveform"
      && pane.kind !== "pv-loop"
      && pane.kind !== "guyton-left"
      && pane.kind !== "guyton-right"
    ) {
      throw validationErrorV1(
        `${panePath}.kind`,
        "must be waveform, pv-loop, guyton-left, or guyton-right",
      );
    }
    if (!Array.isArray(pane.scenarios) || pane.scenarios.length === 0) {
      throw validationErrorV1(
        `${panePath}.scenarios`,
        "must explicitly contain at least one scenario",
      );
    }
    const paneScenarioIds = new Set<string>();
    pane.scenarios.forEach((scenario, scenarioIndex) => {
      const scenarioPath = `${panePath}.scenarios[${scenarioIndex}]`;
      assertExactKeysV1(scenario, [
        "scenarioId",
        "label",
        "color",
        "items",
      ], scenarioPath);
      const scenarioId = requiredPortableIdV1(
        scenario.scenarioId,
        `${scenarioPath}.scenarioId`,
      );
      assertUniqueIdV1(
        paneScenarioIds,
        scenarioId,
        `${scenarioPath}.scenarioId`,
      );
      if (!experimentScenarioIds.has(scenarioId)) {
        throw validationErrorV1(
          `${scenarioPath}.scenarioId`,
          `dangling graph scenario ${scenarioId}`,
        );
      }
      requiredTrimmedStringV1(
        scenario.label,
        `${scenarioPath}.label`,
      );
      requiredTrimmedStringV1(
        scenario.color,
        `${scenarioPath}.color`,
      );
      if (!Array.isArray(scenario.items)) {
        throw validationErrorV1(
          `${scenarioPath}.items`,
          "must be an array",
        );
      }
      const isGuyton =
        pane.kind === "guyton-left" || pane.kind === "guyton-right";
      if (isGuyton && scenario.items.length !== 0) {
        throw validationErrorV1(
          `${scenarioPath}.items`,
          "Guyton/Starling panes derive curves and must not carry signal items",
        );
      }
      if (!isGuyton && scenario.items.length === 0) {
        throw validationErrorV1(
          `${scenarioPath}.items`,
          "waveform and PV-loop panes must contain explicit items",
        );
      }
      const itemIds = new Set<string>();
      scenario.items.forEach((item, itemIndex) => {
        const itemPath = `${scenarioPath}.items[${itemIndex}]`;
        assertExactKeysV1(
          item,
          ["itemId", "label", "unit", "color"],
          itemPath,
        );
        const itemId = requiredPortableIdV1(
          item.itemId,
          `${itemPath}.itemId`,
        );
        assertUniqueIdV1(itemIds, itemId, `${itemPath}.itemId`);
        requiredTrimmedStringV1(item.label, `${itemPath}.label`);
        requiredTrimmedStringV1(item.color, `${itemPath}.color`);
        if (item.unit !== null) {
          requiredTrimmedStringV1(item.unit, `${itemPath}.unit`);
        } else if (pane.kind === "waveform") {
          throw validationErrorV1(
            `${itemPath}.unit`,
            "waveform items must carry an explicit unit",
          );
        }
        if (pane.kind === "waveform") waveformSignalIds.add(itemId);
      });
    });
    validateGraphPanePresentationV1(
      pane,
      `${panePath}.presentation`,
    );
  });
  return waveformSignalIds;
}

function validateGraphPanePresentationV1(
  pane: StudioGraphPaneSpecV1,
  path: string,
): void {
  const presentation = pane.presentation;
  assertExactKeysV1(presentation, [
    "showLegend",
    "legendPosition",
    "showGuides",
    "timeWindowMs",
    "pvBeatHistoryCount",
    "pvBeatHistoryMode",
    "pvParameterHistoryCount",
    "pvRelationDisplayMode",
    "pvRelationPressureBasis",
    "pvRelationShowSamplePoints",
    "hemodynamicDetailMode",
    "hemodynamicParameterHistoryCount",
    "hemodynamicAllowNegativeFillingPressure",
  ], path);
  requiredBooleanV1(presentation.showLegend, `${path}.showLegend`);
  requiredBooleanV1(presentation.showGuides, `${path}.showGuides`);
  if (presentation.legendPosition !== null) {
    assertExactKeysV1(
      presentation.legendPosition,
      ["xPct", "yPct"],
      `${path}.legendPosition`,
    );
    unitIntervalNumberV1(
      presentation.legendPosition.xPct,
      `${path}.legendPosition.xPct`,
    );
    unitIntervalNumberV1(
      presentation.legendPosition.yPct,
      `${path}.legendPosition.yPct`,
    );
  }
  nullableNonnegativeSafeIntegerV1(
    presentation.pvBeatHistoryCount,
    `${path}.pvBeatHistoryCount`,
  );
  if (
    presentation.pvParameterHistoryCount !== null
    && presentation.pvParameterHistoryCount !== 0
    && presentation.pvParameterHistoryCount !== 1
    && presentation.pvParameterHistoryCount !== 3
    && presentation.pvParameterHistoryCount !== 5
    && presentation.pvParameterHistoryCount !== 6
  ) {
    throw validationErrorV1(
      `${path}.pvParameterHistoryCount`,
      "must be null, 0, 1, 3, 5, or 6",
    );
  }
  if (
    presentation.pvBeatHistoryMode !== null
    && presentation.pvBeatHistoryMode !== "fade"
    && presentation.pvBeatHistoryMode !== "persistent"
  ) {
    throw validationErrorV1(
      `${path}.pvBeatHistoryMode`,
      "must be null, fade, or persistent",
    );
  }
  if (
    presentation.pvRelationDisplayMode !== null
    && presentation.pvRelationDisplayMode !== "off"
    && presentation.pvRelationDisplayMode !== "standard"
    && presentation.pvRelationDisplayMode !== "research"
  ) {
    throw validationErrorV1(
      `${path}.pvRelationDisplayMode`,
      "must be null, off, standard, or research",
    );
  }
  if (
    presentation.pvRelationPressureBasis !== null
    && presentation.pvRelationPressureBasis !== "intracavitary"
    && presentation.pvRelationPressureBasis !== "transmural"
  ) {
    throw validationErrorV1(
      `${path}.pvRelationPressureBasis`,
      "must be null, intracavitary, or transmural",
    );
  }
  nullableBooleanV1(
    presentation.pvRelationShowSamplePoints,
    `${path}.pvRelationShowSamplePoints`,
  );
  if (
    presentation.hemodynamicDetailMode !== null
    && presentation.hemodynamicDetailMode !== "standard"
    && presentation.hemodynamicDetailMode !== "settled-reference"
    && presentation.hemodynamicDetailMode !== "compare"
  ) {
    throw validationErrorV1(
      `${path}.hemodynamicDetailMode`,
      "must be null, standard, settled-reference, or compare",
    );
  }
  if (
    presentation.hemodynamicParameterHistoryCount !== null
    && presentation.hemodynamicParameterHistoryCount !== 0
    && presentation.hemodynamicParameterHistoryCount !== 1
    && presentation.hemodynamicParameterHistoryCount !== 3
    && presentation.hemodynamicParameterHistoryCount !== 5
  ) {
    throw validationErrorV1(
      `${path}.hemodynamicParameterHistoryCount`,
      "must be null, 0, 1, 3, or 5",
    );
  }
  nullableBooleanV1(
    presentation.hemodynamicAllowNegativeFillingPressure,
    `${path}.hemodynamicAllowNegativeFillingPressure`,
  );

  if (pane.kind === "waveform") {
    positiveFiniteNumberV1(
      presentation.timeWindowMs,
      `${path}.timeWindowMs`,
    );
    assertNullPresentationFieldsV1(presentation, path, [
      "pvBeatHistoryCount",
      "pvBeatHistoryMode",
      "pvParameterHistoryCount",
      "pvRelationDisplayMode",
      "pvRelationPressureBasis",
      "pvRelationShowSamplePoints",
      "hemodynamicDetailMode",
      "hemodynamicParameterHistoryCount",
      "hemodynamicAllowNegativeFillingPressure",
    ]);
    return;
  }
  if (presentation.timeWindowMs !== null) {
    throw validationErrorV1(
      `${path}.timeWindowMs`,
      "must be null outside waveform panes",
    );
  }
  if (pane.kind === "pv-loop") {
    if (
      presentation.pvBeatHistoryCount === null
      || presentation.pvBeatHistoryMode === null
      || presentation.pvParameterHistoryCount === null
      || presentation.pvRelationDisplayMode === null
      || presentation.pvRelationPressureBasis === null
      || presentation.pvRelationShowSamplePoints === null
    ) {
      throw validationErrorV1(
        path,
        "PV-loop presentation fields must be explicit",
      );
    }
    assertNullPresentationFieldsV1(presentation, path, [
      "hemodynamicDetailMode",
      "hemodynamicParameterHistoryCount",
      "hemodynamicAllowNegativeFillingPressure",
    ]);
    return;
  }
  assertNullPresentationFieldsV1(presentation, path, [
    "pvBeatHistoryCount",
    "pvBeatHistoryMode",
    "pvParameterHistoryCount",
    "pvRelationDisplayMode",
    "pvRelationPressureBasis",
    "pvRelationShowSamplePoints",
  ]);
  if (
    presentation.hemodynamicDetailMode === null
    || presentation.hemodynamicParameterHistoryCount === null
    || presentation.hemodynamicAllowNegativeFillingPressure === null
  ) {
    throw validationErrorV1(
      path,
      "Guyton/Starling presentation fields must be explicit",
    );
  }
}

type StudioGraphPanePresentationV1 =
  StudioGraphPaneSpecV1["presentation"];

function assertNullPresentationFieldsV1(
  presentation: StudioGraphPanePresentationV1,
  path: string,
  keys: readonly (keyof StudioGraphPanePresentationV1)[],
): void {
  for (const key of keys) {
    if (presentation[key] !== null) {
      throw validationErrorV1(
        `${path}.${key}`,
        "must be null for this graph pane kind",
      );
    }
  }
}

function requiredBooleanV1(value: unknown, path: string): void {
  if (typeof value !== "boolean") {
    throw validationErrorV1(path, "must be a boolean");
  }
}

function nullableBooleanV1(value: unknown, path: string): void {
  if (value !== null && typeof value !== "boolean") {
    throw validationErrorV1(path, "must be null or a boolean");
  }
}

function unitIntervalNumberV1(value: unknown, path: string): void {
  if (
    typeof value !== "number"
    || !Number.isFinite(value)
    || value < 0
    || value > 1
  ) {
    throw validationErrorV1(path, "must be finite and between 0 and 1");
  }
}

function positiveFiniteNumberV1(value: unknown, path: string): void {
  if (
    typeof value !== "number"
    || !Number.isFinite(value)
    || value <= 0
  ) {
    throw validationErrorV1(path, "must be a positive finite number");
  }
}

function nullableNonnegativeSafeIntegerV1(
  value: unknown,
  path: string,
): void {
  if (
    value !== null
    && (!Number.isSafeInteger(value) || (value as number) < 0)
  ) {
    throw validationErrorV1(
      path,
      "must be null or a nonnegative safe integer",
    );
  }
}

function validatePlacementsV1(
  blocks: readonly StudioDocumentBlockV1[],
  experiments: readonly ExperimentRevisionV1[],
): void {
  const byId = new Map(
    experiments.map((experiment) => [
      experiment.experimentId,
      experiment,
    ]),
  );
  blocks.forEach((block, index) => {
    if (block.kind !== "experiment-placement") return;
    const experiment = byId.get(block.experimentId);
    if (experiment === undefined) {
      throw validationErrorV1(
        `$.draft.document.blocks[${index}].experimentId`,
        `dangling experiment ${block.experimentId}`,
      );
    }
    if (
      !experiment.readerBriefs.some(
        (brief) => brief.briefId === block.readerBriefId,
      )
    ) {
      throw validationErrorV1(
        `$.draft.document.blocks[${index}].readerBriefId`,
        `dangling reader brief ${block.readerBriefId}`,
      );
    }
  });
}

function cloneThenDeepFreezeSerializableV1<TValue>(
  value: unknown,
  path: string,
): TValue {
  const clone = cloneSerializableNodeV1(
    value,
    path,
    new Set<object>(),
    0,
  ) as TValue;
  return deepFreezeV1(clone);
}

function cloneSerializableNodeV1(
  value: unknown,
  path: string,
  ancestors: Set<object>,
  depth: number,
): unknown {
  if (depth > MAXIMUM_SERIALIZABLE_DEPTH_V1) {
    throw validationErrorV1(path, "nesting limit exceeded");
  }
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw validationErrorV1(path, "number must be finite");
    }
    return value;
  }
  if (typeof value !== "object") {
    throw validationErrorV1(
      path,
      `${typeof value} is outside the plain serializable data model`,
    );
  }
  if (ancestors.has(value)) {
    throw validationErrorV1(path, "cyclic values are unsupported");
  }

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const ownNames = Object.getOwnPropertyNames(value);
      if (
        ownNames.some((name) =>
          name !== "length"
          && (!/^(0|[1-9][0-9]*)$/.test(name) || Number(name) >= value.length))
        || Object.getOwnPropertySymbols(value).length > 0
      ) {
        throw validationErrorV1(path, "array must be dense and unadorned");
      }
      const output: unknown[] = [];
      for (let index = 0; index < value.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(
          value,
          String(index),
        );
        if (
          descriptor === undefined
          || !descriptor.enumerable
          || !("value" in descriptor)
        ) {
          throw validationErrorV1(
            `${path}[${index}]`,
            "array must be dense data",
          );
        }
        output.push(cloneSerializableNodeV1(
          descriptor.value,
          `${path}[${index}]`,
          ancestors,
          depth + 1,
        ));
      }
      return output;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw validationErrorV1(path, "must be a plain object");
    }
    if (Object.getOwnPropertySymbols(value).length > 0) {
      throw validationErrorV1(path, "symbol properties are unsupported");
    }
    const output: Record<string, unknown> = {};
    for (
      const [key, descriptor]
      of Object.entries(Object.getOwnPropertyDescriptors(value))
    ) {
      if (!descriptor.enumerable || !("value" in descriptor)) {
        throw validationErrorV1(
          `${path}.${key}`,
          "hidden/accessor properties are unsupported",
        );
      }
      Object.defineProperty(output, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: cloneSerializableNodeV1(
          descriptor.value,
          `${path}.${key}`,
          ancestors,
          depth + 1,
        ),
      });
    }
    return output;
  } finally {
    ancestors.delete(value);
  }
}

function deepFreezeV1<TValue>(value: TValue): TValue {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreezeV1(child);
    Object.freeze(value);
  }
  return value;
}

function draftTextV1(
  value: unknown,
  path: string,
): string {
  // A draft must be able to hold the block an author is about to type into,
  // exactly as typed. Requiring prose would make "press Enter, then write"
  // impossible, and requiring a trimmed string would reject the trailing
  // space that exists between any two words: the commit made on blur would be
  // discarded and the edit lost. Non-empty trimmed text is a publication
  // gate, not a drafting one.
  if (typeof value !== "string") {
    throw validationErrorV1(path, "must be a string");
  }
  return value;
}

function requiredTrimmedStringV1(
  value: unknown,
  path: string,
): string {
  if (
    typeof value !== "string"
    || value.length === 0
    || value.trim() !== value
  ) {
    throw validationErrorV1(path, "must be a nonempty trimmed string");
  }
  return value;
}

function requiredPortableIdV1(
  value: unknown,
  path: string,
): string {
  if (
    typeof value !== "string"
    || !PORTABLE_IDENTIFIER_PATTERN_V1.test(value)
  ) {
    throw validationErrorV1(path, "must be a portable identifier");
  }
  return value;
}

function nonnegativeRevisionV1(value: unknown, path: string): void {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw validationErrorV1(path, "must be a nonnegative safe integer");
  }
}

function nextRevisionV1(value: number, path: string): number {
  nonnegativeRevisionV1(value, path);
  if (value === Number.MAX_SAFE_INTEGER) {
    throw validationErrorV1(path, "revision is exhausted");
  }
  return value + 1;
}

function assertUniqueIdV1(
  seen: Set<string>,
  value: string,
  path: string,
): void {
  if (seen.has(value)) {
    throw validationErrorV1(path, `duplicate id ${value}`);
  }
  seen.add(value);
}

function assertExactKeysV1(
  value: unknown,
  expected: readonly string[],
  path: string,
): asserts value is Record<string, unknown> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
  ) {
    throw validationErrorV1(path, "must be a plain object");
  }
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (
    actual.length !== required.length
    || actual.some((key, index) => key !== required[index])
  ) {
    throw validationErrorV1(
      path,
      `keys must be exactly ${required.join(", ")}`,
    );
  }
}

function validationErrorV1(
  path: string,
  message: string,
): StudioAuthorPreviewValidationErrorV1 {
  return new StudioAuthorPreviewValidationErrorV1(path, message);
}
