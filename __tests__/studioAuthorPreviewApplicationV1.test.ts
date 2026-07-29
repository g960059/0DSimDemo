import { describe, expect, it } from "vitest";

import {
  SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_AUTHOR_DRAFT_V1,
  SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_EXPERIMENT_ID_V1,
  SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_READER_BRIEF_ID_V1,
  SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SCENARIO_ID_V1,
  SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SOURCE_ID_V1,
} from "@/components/scientificProduct/ScientificProductSampleAfterloadArticleV1";
import {
  readerPreviewEntryIdsAbsentFromManifestV1,
  readerPreviewErrorMessageV1,
} from "@/components/studio/StudioAuthorPreviewProviderV1";
import {
  MainWireScientificWorkerLaneErrorV1,
} from "@/engine/scientificBrowser/MainWireScientificWorkerLaneSchedulerV1";
import {
  StudioAuthorPreviewApplicationV1,
  StudioAuthorPreviewRevisionConflictErrorV1,
  StudioAuthorPreviewValidationErrorV1,
} from "@/studio/application/content";
import {
  STUDIO_GRAPH_PANE_V1_SCHEMA_ID,
  STUDIO_RESOLVED_READER_EXPERIMENT_V1_SCHEMA_ID,
  type StudioAuthorDraftV1,
  type StudioDocumentBlockV1,
  type StudioGraphPaneSpecV1,
} from "@/studio/contracts/v1";
import enTranslation from "@/locales/en/translation.json";
import jaTranslation from "@/locales/ja/translation.json";

describe("StudioAuthorPreviewApplicationV1", () => {
  it("applies title and text-block commands with optimistic revision locking", () => {
    const application = createApplicationV1();

    const titleUpdate = application.updateTitle({
      expectedRevision: 0,
      title: "後負荷を波形で考える",
    });
    expect(titleUpdate).toMatchObject({
      revision: 1,
      document: {
        revision: 1,
        title: "後負荷を波形で考える",
      },
    });

    expect(() => application.updateTextBlock({
      expectedRevision: 0,
      blockId: "afterload-introduction",
      text: "古い画面からの変更",
    })).toThrow(StudioAuthorPreviewRevisionConflictErrorV1);

    const blockUpdate = application.updateTextBlock({
      expectedRevision: 1,
      blockId: "afterload-introduction",
      text: "全身血管抵抗と後負荷の関係を、二つの圧波形で観察します。",
    });
    expect(blockUpdate.revision).toBe(2);
    expect(blockUpdate.document.revision).toBe(2);
    expect(blockUpdate.document.blocks[0]).toMatchObject({
      kind: "paragraph",
      text: "全身血管抵抗と後負荷の関係を、二つの圧波形で観察します。",
    });
  });

  it("atomically replaces canonical document content in one revision", () => {
    let previewOrdinal = 0;
    const application = new StudioAuthorPreviewApplicationV1({
      initialDraft: populatedDraftV1(),
      idFactory: () => `document-editor-preview-${++previewOrdinal}`,
    });
    const originalPreview = application.materializePreview({
      expectedRevision: 0,
    });
    const sourceBlocks = structuredClone(
      application.getDraftSnapshot().document.blocks,
    ) as StudioDocumentBlockV1[];
    const placement = sourceBlocks.find(
      (block) => block.kind === "experiment-placement",
    )!;
    const remaining = sourceBlocks
      .filter((block) => block.blockId !== placement.blockId)
      .map((block) =>
        block.blockId === "afterload-introduction"
          ? {
              ...block,
              text: "Atomic Document Editorで更新した導入文です。",
            }
          : block);
    const commandBlocks: StudioDocumentBlockV1[] = [
      {
        blockId: "document-editor-added-heading",
        kind: "heading",
        level: 2,
        text: "追加した観察項目",
      },
      placement,
      ...remaining,
    ];

    const next = application.replaceDocumentContent({
      expectedRevision: 0,
      title: "Atomic Document Editorの題名",
      blocks: commandBlocks,
    });

    expect(next).toMatchObject({
      revision: 1,
      document: {
        revision: 1,
        title: "Atomic Document Editorの題名",
      },
    });
    expect(next.document.blocks.map(({ blockId }) => blockId).slice(0, 3))
      .toEqual([
        "document-editor-added-heading",
        "afterload-experiment-placement",
        "afterload-introduction",
      ]);
    expect(Object.isFrozen(next)).toBe(true);
    expect(Object.isFrozen(next.document.blocks)).toBe(true);

    commandBlocks[0] = {
      blockId: "caller-mutated-after-commit",
      kind: "paragraph",
      text: "The stored draft must not alias this value.",
    };
    expect(application.getDraftSnapshot().document.blocks[0]).toMatchObject({
      blockId: "document-editor-added-heading",
      text: "追加した観察項目",
    });

    const unchanged = application.replaceDocumentContent({
      expectedRevision: 1,
      title: next.document.title,
      blocks: next.document.blocks,
    });
    expect(unchanged).toBe(next);
    expect(unchanged.revision).toBe(1);

    const revisedPreview = application.materializePreview({
      expectedRevision: 1,
    });
    expect(revisedPreview.source.revision).toBe(1);
    expect(revisedPreview.resolvedReaderDocument.document.blocks[0])
      .toMatchObject({
        blockId: "document-editor-added-heading",
      });
    expect(originalPreview.source.revision).toBe(0);
    expect(originalPreview.resolvedReaderDocument.document.title)
      .toBe(
        "全身血管抵抗を変えると左室と大動脈の圧はどう動くか",
      );
  });

  it("rejects an invalid or stale atomic document transaction without partial mutation", () => {
    const application = createApplicationV1();
    const original = application.getDraftSnapshot();
    const duplicateBlocks = [
      ...original.document.blocks,
      original.document.blocks[0]!,
    ];

    expect(() => application.replaceDocumentContent({
      expectedRevision: 0,
      title: "重複blockを含む更新",
      blocks: duplicateBlocks,
    })).toThrow(StudioAuthorPreviewValidationErrorV1);
    expect(() => application.replaceDocumentContent({
      expectedRevision: 0,
      title: "重複blockを含む更新",
      blocks: duplicateBlocks,
    })).toThrow(/duplicate id/);
    expect(application.getDraftSnapshot()).toBe(original);

    const next = application.replaceDocumentContent({
      expectedRevision: 0,
      title: "有効なatomic更新",
      blocks: original.document.blocks,
    });
    expect(next.revision).toBe(1);
    expect(() => application.replaceDocumentContent({
      expectedRevision: 0,
      title: "古いEditorからの上書き",
      blocks: next.document.blocks,
    })).toThrow(StudioAuthorPreviewRevisionConflictErrorV1);
    expect(application.getDraftSnapshot()).toBe(next);
  });

  it("atomically replaces detached Reader brief graph panes without revising the document", () => {
    let previewOrdinal = 0;
    const application = new StudioAuthorPreviewApplicationV1({
      initialDraft: populatedDraftV1(),
      idFactory: () => `brief-graph-preview-${++previewOrdinal}`,
    });
    const before = application.getDraftSnapshot();
    const originalPreview = application.materializePreview({
      expectedRevision: 0,
    });
    const sourcePanes =
      before.experiments[0]!.readerBriefs[0]!.graphPanes;
    const replacementPanes: StudioGraphPaneSpecV1[] = sourcePanes.map(
      (pane, index) =>
        index !== 0
          ? structuredClone(pane)
          : {
              ...structuredClone(pane),
              title: "Authorが固定した5秒の圧波形",
              presentation: {
                ...structuredClone(pane.presentation),
                showLegend: false,
                legendPosition: null,
                timeWindowMs: 5_500,
              },
            },
    );

    const next = application.replaceReaderBriefGraphPanes({
      expectedRevision: 0,
      experimentId:
        SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_EXPERIMENT_ID_V1,
      briefId:
        SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_READER_BRIEF_ID_V1,
      graphPanes: replacementPanes,
    });

    expect(next.revision).toBe(1);
    expect(next.document.revision).toBe(0);
    expect(next.experiments[0]!.revision).toBe(1);
    expect(
      next.experiments[0]!.readerBriefs[0]!.graphPanes[0],
    ).toMatchObject({
      title: "Authorが固定した5秒の圧波形",
      presentation: {
        showLegend: false,
        legendPosition: null,
        timeWindowMs: 5_500,
      },
    });
    replacementPanes[0] = structuredClone(replacementPanes[1]!);
    expect(
      application.getDraftSnapshot()
        .experiments[0]!.readerBriefs[0]!.graphPanes[0]!.title,
    ).toBe("Authorが固定した5秒の圧波形");

    const unchanged = application.replaceReaderBriefGraphPanes({
      expectedRevision: 1,
      experimentId:
        SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_EXPERIMENT_ID_V1,
      briefId:
        SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_READER_BRIEF_ID_V1,
      graphPanes:
        next.experiments[0]!.readerBriefs[0]!.graphPanes,
    });
    expect(unchanged).toBe(next);

    const revisedPreview = application.materializePreview({
      expectedRevision: 1,
    });
    expect(
      revisedPreview.resolvedReaderDocument.placements[0]!
        .readerBrief.graphPanes[0]!.title,
    ).toBe("Authorが固定した5秒の圧波形");
    expect(
      originalPreview.resolvedReaderDocument.placements[0]!
        .readerBrief.graphPanes[0]!.title,
    ).toBe("左室圧と大動脈圧");

    const invalidPanes = structuredClone(
      next.experiments[0]!.readerBriefs[0]!.graphPanes,
    ) as unknown as Array<Record<string, unknown>>;
    const invalidPresentation = (
      invalidPanes[0]!.presentation as Record<string, unknown>
    );
    invalidPresentation.unexpectedDefault = true;
    expect(() => application.replaceReaderBriefGraphPanes({
      expectedRevision: 1,
      experimentId:
        SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_EXPERIMENT_ID_V1,
      briefId:
        SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_READER_BRIEF_ID_V1,
      graphPanes:
        invalidPanes as unknown as readonly StudioGraphPaneSpecV1[],
    })).toThrow(/keys must be exactly/);
    expect(application.getDraftSnapshot()).toBe(next);
  });

  it("materializes a detached deeply frozen Reader input and preserves old previews", () => {
    const callerDraft = mutableDraftV1();
    let ordinal = 0;
    const application = new StudioAuthorPreviewApplicationV1({
      initialDraft: callerDraft as unknown as StudioAuthorDraftV1,
      idFactory: () => `preview-${++ordinal}`,
    });

    callerDraft.document.title = "呼び出し側で後から壊した題名";
    callerDraft.experiments[0]!.readerBriefs[0]!.controls[0]!
      .allowedValues[0] = 99;
    const first = application.materializePreview({ expectedRevision: 0 });

    expect(first).toMatchObject({
      previewId: "preview-1",
      trust: "draft-preview-uncertified",
      sharePolicy: "session-only",
      publicationManifestRef: null,
      source: {
        kind: "draft-revision",
        draftId: "draft/sample-afterload-reader-preview",
        revision: 0,
      },
      runtimeBindings: {
        [SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SCENARIO_ID_V1]: {
          kind: "preview-bootstrap",
          sourceId: SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SOURCE_ID_V1,
          qualification: "uncertified-preview-only",
        },
      },
      resolvedReaderDocument: {
        document: {
          title:
            "全身血管抵抗を変えると左室と大動脈の圧はどう動くか",
        },
        placements: [
          {
            placementBlockId: "afterload-experiment-placement",
            experiment: {
              schemaId: STUDIO_RESOLVED_READER_EXPERIMENT_V1_SCHEMA_ID,
              experimentId:
                SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_EXPERIMENT_ID_V1,
              scenarios: [
                {
                  scenarioId:
                    SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SCENARIO_ID_V1,
                },
              ],
            },
            readerBrief: {
              briefId:
                SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_READER_BRIEF_ID_V1,
              extent: "inflow",
            },
          },
        ],
      },
    });
    expect(
      first.resolvedReaderDocument.placements[0]!.readerBrief
        .controls[0]!.allowedValues,
    ).toEqual([0.75, 1, 1.5, 2]);
    const resolvedScenario =
      first.resolvedReaderDocument.placements[0]!.experiment.scenarios[0]!;
    expect("runtimeSource" in resolvedScenario).toBe(false);
    expect(JSON.stringify(first.resolvedReaderDocument))
      .not.toContain("preview-bootstrap");
    expect(Object.keys(first.runtimeBindings)).toEqual([
      SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SCENARIO_ID_V1,
    ]);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.runtimeBindings)).toBe(true);
    expect(Object.isFrozen(
      first.runtimeBindings[
        SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SCENARIO_ID_V1
      ],
    )).toBe(true);
    expect(Object.isFrozen(first.resolvedReaderDocument)).toBe(true);
    expect(Object.isFrozen(
      first.resolvedReaderDocument.placements[0]!.experiment.scenarios,
    )).toBe(true);
    expect(Object.isFrozen(
      first.resolvedReaderDocument.placements[0]!.readerBrief.controls[0]!
        .binding.target.scenarioIds,
    )).toBe(true);

    application.updateTitle({
      expectedRevision: 0,
      title: "更新後のdraft題名",
    });
    const second = application.materializePreview({ expectedRevision: 1 });
    expect(second.previewId).toBe("preview-2");
    expect(second.resolvedReaderDocument.document.title)
      .toBe("更新後のdraft題名");
    expect(first.resolvedReaderDocument.document.title)
      .toBe("全身血管抵抗を変えると左室と大動脈の圧はどう動くか");
    expect(first.source.revision).toBe(0);
    expect(application.resolvePreview(first.previewId)).toBe(first);

    const methods = application as unknown as Record<string, unknown>;
    expect(methods.save).toBeUndefined();
    expect(methods.publish).toBeUndefined();
    expect(methods.share).toBeUndefined();
  });

  it("uses an unguessable UUID capability for default preview ids", () => {
    const firstSession = new StudioAuthorPreviewApplicationV1({
      initialDraft: populatedDraftV1(),
    });
    const secondSession = new StudioAuthorPreviewApplicationV1({
      initialDraft: populatedDraftV1(),
    });

    const first = firstSession.materializePreview({ expectedRevision: 0 });
    const second = secondSession.materializePreview({ expectedRevision: 0 });
    const capabilityPattern =
      /^reader-preview-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

    expect(first.previewId).toMatch(capabilityPattern);
    expect(second.previewId).toMatch(capabilityPattern);
    expect(first.previewId).not.toBe(second.previewId);
    expect(firstSession.resolvePreview(second.previewId)).toBeNull();
    expect(secondSession.resolvePreview(first.previewId)).toBeNull();
  });

  it("rejects a prototype-sensitive scenario id before creating runtime bindings", () => {
    const draft = mutableDraftV1();
    draft.experiments[0]!.scenarios[0]!.scenarioId = "__proto__";
    controlV1(draft).binding.target.scenarioIds = ["__proto__"];
    const application = new StudioAuthorPreviewApplicationV1({
      initialDraft: draft as unknown as StudioAuthorDraftV1,
      idFactory: () => "prototype-key-preview",
    });

    expect(() => application.materializePreview({
      expectedRevision: 0,
    })).toThrow(StudioAuthorPreviewValidationErrorV1);
    expect(() => application.materializePreview({
      expectedRevision: 0,
    })).toThrow(/scenarioId: must be a portable identifier/);
    expect(application.resolvePreview("prototype-key-preview")).toBeNull();
    expect(Object.getPrototypeOf({})).toBe(Object.prototype);
  });

  it("clones prototype-sensitive own keys as data before rejecting unknown schema fields", () => {
    const draft = mutableDraftV1();
    Object.defineProperty(draft.document, "__proto__", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: { polluted: true },
    });
    const application = new StudioAuthorPreviewApplicationV1({
      initialDraft: draft as unknown as StudioAuthorDraftV1,
      idFactory: () => "prototype-data-preview",
    });
    const storedDocument = (
      application.getDraftSnapshot().document
    ) as unknown as Record<string, unknown>;

    expect(Object.getPrototypeOf(storedDocument)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(storedDocument, "__proto__"))
      .toBe(true);
    expect(Object.isFrozen(storedDocument)).toBe(true);
    expect(() => application.materializePreview({
      expectedRevision: 0,
    })).toThrow(/keys must be exactly/);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("keeps workspace-specific portable PV trajectory ids in the document contract", () => {
    const draft = mutableDraftV1();
    pvLoopItemV1(draft).itemId = "lv-primary";
    const application = new StudioAuthorPreviewApplicationV1({
      initialDraft: draft as unknown as StudioAuthorDraftV1,
      idFactory: () => "workspace-pv-preview",
    });

    const preview = application.materializePreview({
      expectedRevision: 0,
    });

    expect(
      preview.resolvedReaderDocument.placements[0]!
        .readerBrief.graphPanes
        .find(({ kind }) => kind === "pv-loop")!
        .scenarios[0]!.items[0]!.itemId,
    ).toBe("lv-primary");
  });

  it.each([
    {
      name: "a dangling experiment placement",
      mutate(draft: MutableDraftV1) {
        const placement = draft.document.blocks.find(
          (block) => block.kind === "experiment-placement",
        )!;
        placement.experimentId = "missing-experiment";
      },
      message: /dangling experiment/,
    },
    {
      name: "a dangling Reader brief placement",
      mutate(draft: MutableDraftV1) {
        const placement = draft.document.blocks.find(
          (block) => block.kind === "experiment-placement",
        )!;
        placement.readerBriefId = "missing-brief";
      },
      message: /dangling reader brief/,
    },
    {
      name: "an implicit or dangling control target",
      mutate(draft: MutableDraftV1) {
        controlV1(draft).binding.target.scenarioIds = ["active"];
      },
      message: /dangling scenario target active/,
    },
    {
      name: "a readback signal that is not explicitly specified",
      mutate(draft: MutableDraftV1) {
        controlV1(draft).binding.readbackSignalId =
          "hemodynamics.pressure.unlisted";
      },
      message: /explicit signal id/,
    },
    {
      name: "an initial value outside the finite allowed values",
      mutate(draft: MutableDraftV1) {
        controlV1(draft).initialValue = 1.25;
      },
      message: /included in allowedValues/,
    },
    {
      name: "an active binding field",
      mutate(draft: MutableDraftV1) {
        const binding = controlV1(draft).binding as Record<string, unknown>;
        binding.active = true;
      },
      message: /keys must be exactly/,
    },
    {
      name: "a non-portable PV-loop item id",
      mutate(draft: MutableDraftV1) {
        pvLoopItemV1(draft).itemId = "not a portable trajectory id";
      },
      message: /must be a portable identifier/,
    },
  ])("fails closed while materializing $name", ({ mutate, message }) => {
    const draft = mutableDraftV1();
    mutate(draft);
    const application = new StudioAuthorPreviewApplicationV1({
      initialDraft: draft as unknown as StudioAuthorDraftV1,
      idFactory: () => "invalid-preview",
    });

    expect(() => application.materializePreview({
      expectedRevision: 0,
    })).toThrow(StudioAuthorPreviewValidationErrorV1);
    expect(() => application.materializePreview({
      expectedRevision: 0,
    })).toThrow(message);
  });

  it("keeps preview lookup session-local", () => {
    const firstSession = createApplicationV1();
    const preview = firstSession.materializePreview({
      expectedRevision: 0,
    });
    const freshSession = createApplicationV1();

    expect(firstSession.resolvePreview(preview.previewId)).toBe(preview);
    expect(freshSession.resolvePreview(preview.previewId)).toBeNull();
  });

  it("rejects non-plain or non-finite draft input before it can alias the session", () => {
    const draft = mutableDraftV1();
    controlV1(draft).allowedValues[0] = Number.NaN;

    expect(() => new StudioAuthorPreviewApplicationV1({
      initialDraft: draft as unknown as StudioAuthorDraftV1,
    })).toThrow(StudioAuthorPreviewValidationErrorV1);
  });

  it("repoints a scenario at another case and records the brief's extent", () => {
    const application = createApplicationV1();
    const before = application.getDraftSnapshot();
    const experiment = before.experiments[0]!;

    const repointed = application.replaceExperimentRuntimeSource({
      expectedRevision: before.revision,
      experimentId: experiment.experimentId,
      scenarioId: experiment.scenarios[0]!.scenarioId,
      scenarioLabel: "another case",
      runtimeSource: Object.freeze({
        kind: "preview-bootstrap",
        sourceId: "main-wire/as-severe",
        qualification: "uncertified-preview-only",
      }),
    });
    expect(repointed.experiments[0]!.scenarios[0]).toMatchObject({
      label: "another case",
      runtimeSource: { sourceId: "main-wire/as-severe" },
    });
    // Which case an experiment reads is not a document edit, and the brief
    // survives it: the panes name observables, not a case.
    expect(repointed.document.revision).toBe(before.document.revision);
    expect(repointed.experiments[0]!.readerBriefs[0]!.graphPanes)
      .toEqual(experiment.readerBriefs[0]!.graphPanes);

    const widened = application.replaceReaderBriefExtent({
      expectedRevision: repointed.revision,
      experimentId: experiment.experimentId,
      briefId: experiment.readerBriefs[0]!.briefId,
      extent: "fullscreen",
    });
    expect(widened.experiments[0]!.readerBriefs[0]!.extent).toBe("fullscreen");
    expect(widened.document.revision).toBe(before.document.revision);
    // Re-recording the same extent is not a change.
    expect(
      application.replaceReaderBriefExtent({
        expectedRevision: widened.revision,
        experimentId: experiment.experimentId,
        briefId: experiment.readerBriefs[0]!.briefId,
        extent: "fullscreen",
      }),
    ).toBe(widened);
  });

  it("adds an experiment with an empty brief that a block can then place", () => {
    const application = createApplicationV1();
    const before = application.getDraftSnapshot();

    const next = application.createExperiment({
      expectedRevision: before.revision,
      experimentId: "experiment/second",
      modelRef: before.experiments[0]!.modelRef,
      scenarioId: "scenario/second",
      scenarioLabel: "second scenario",
      runtimeSource: before.experiments[0]!.scenarios[0]!.runtimeSource,
      readerBriefId: "reader-brief/second",
    });

    expect(next.experiments).toHaveLength(before.experiments.length + 1);
    expect(next.revision).toBe(before.revision + 1);
    // Placing an experiment is a separate, document-level edit.
    expect(next.document.revision).toBe(before.document.revision);
    const created = next.experiments.at(-1)!;
    // An experiment arrives uncomposed: its brief is what an author builds.
    expect(created.readerBriefs[0]).toMatchObject({
      briefId: "reader-brief/second",
      extent: "inflow",
      graphPanes: [],
      instantaneousReadbacks: [],
      controls: [],
    });

    expect(() =>
      application.createExperiment({
        expectedRevision: next.revision,
        experimentId: "experiment/second",
        modelRef: created.modelRef,
        scenarioId: "scenario/third",
        scenarioLabel: "third scenario",
        runtimeSource: created.scenarios[0]!.runtimeSource,
        readerBriefId: "reader-brief/third",
      })
    ).toThrow(/already exists/);
  });

  it("does not expose the internal live-lane exhaustion string to a reader", () => {
    const internal = new MainWireScientificWorkerLaneErrorV1(
      "scientific live-lane budget 4 is exhausted",
    );
    const enMessage = readerPreviewErrorMessageV1(
      internal,
      enTranslation.studioAuthorPreview.reader.liveLaneCapacityReached,
    );
    const jaMessage = readerPreviewErrorMessageV1(
      internal,
      jaTranslation.studioAuthorPreview.reader.liveLaneCapacityReached,
    );

    expect(enMessage).toBe(
      "This article has more live simulations than can run at once. "
      + "Close another live simulation or show fewer live placements, then "
      + "try again.",
    );
    expect(jaMessage).toBe(
      "この記事のライブ実験数が同時実行上限を超えています。別のライブ実験を"
      + "閉じるか、ライブ配置を減らしてから再試行してください。",
    );
    expect(enMessage).not.toContain("scientific live-lane budget");
    expect(jaMessage).not.toContain("scientific live-lane budget");
  });

  it("preserves unrelated reader-preview errors", () => {
    expect(readerPreviewErrorMessageV1(
      new Error("Manifest unavailable"),
      "localized capacity",
    ))
      .toBe("Manifest unavailable");
  });

  it("identifies a removed placement so its warm lane can be disposed", () => {
    const preview = createApplicationV1().materializePreview({
      expectedRevision: 0,
    });
    const retainedPlacementId =
      preview.resolvedReaderDocument.placements[0]!.placementBlockId;

    expect(readerPreviewEntryIdsAbsentFromManifestV1(
      [retainedPlacementId, "placement/removed"],
      new Set([retainedPlacementId]),
    )).toEqual(["placement/removed"]);
  });
});

/**
 * A populated Reader brief.
 *
 * The shipped sample brief is deliberately empty — an author builds one by
 * picking on the Workbench — so the cases below carry their own selection
 * rather than asserting against whatever the product happens to seed.
 */
const POPULATED_READER_BRIEF_SELECTION_V1 = {
    graphPanes: [
      {
        schemaId: STUDIO_GRAPH_PANE_V1_SCHEMA_ID,
        paneId: "afterload-pressure-waveform",
        title: "左室圧と大動脈圧",
        kind: "waveform",
        scenarios: [
          {
            scenarioId:
              SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SCENARIO_ID_V1,
            label: "健康成人のexact periodic基準",
            color: "#38bdf8",
            items: [
              {
                itemId: "hemodynamics.pressure.absolute.LV",
                label: "左室圧",
                unit: "mmHg",
                color: "#38bdf8",
              },
              {
                itemId: "hemodynamics.pressure.absolute.Ao",
                label: "大動脈圧",
                unit: "mmHg",
                color: "#f97316",
              },
            ],
          },
        ],
        presentation: {
          showLegend: true,
          legendPosition: { xPct: 0.68, yPct: 0.06 },
          showGuides: false,
          timeWindowMs: 5_000,
          pvBeatHistoryCount: null,
          pvBeatHistoryMode: null,
          pvParameterHistoryCount: null,
          pvRelationDisplayMode: null,
          pvRelationPressureBasis: null,
          pvRelationShowSamplePoints: null,
          hemodynamicDetailMode: null,
          hemodynamicParameterHistoryCount: null,
          hemodynamicAllowNegativeFillingPressure: null,
        },
      },
      {
        schemaId: STUDIO_GRAPH_PANE_V1_SCHEMA_ID,
        paneId: "afterload-lv-pv-loop",
        title: "左室 pressure–volume loop",
        kind: "pv-loop",
        scenarios: [
          {
            scenarioId:
              SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SCENARIO_ID_V1,
            label: "健康成人のexact periodic基準",
            color: "#38bdf8",
            items: [
              {
                itemId: "lv",
                label: "LV pressure–volume loop",
                unit: null,
                color: "#a78bfa",
              },
            ],
          },
        ],
        presentation: {
          showLegend: true,
          legendPosition: { xPct: 0.63, yPct: 0.06 },
          showGuides: true,
          timeWindowMs: null,
          pvBeatHistoryCount: 8,
          pvBeatHistoryMode: "fade",
          pvParameterHistoryCount: 6,
          pvRelationDisplayMode: "off",
          pvRelationPressureBasis: "intracavitary",
          pvRelationShowSamplePoints: false,
          hemodynamicDetailMode: null,
          hemodynamicParameterHistoryCount: null,
          hemodynamicAllowNegativeFillingPressure: null,
        },
      },
      {
        schemaId: STUDIO_GRAPH_PANE_V1_SCHEMA_ID,
        paneId: "afterload-guyton-left",
        title: "左心 Guyton / Starling",
        kind: "guyton-left",
        scenarios: [
          {
            scenarioId:
              SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SCENARIO_ID_V1,
            label: "健康成人のexact periodic基準",
            color: "#38bdf8",
            items: [],
          },
        ],
        presentation: {
          showLegend: true,
          legendPosition: { xPct: 0.65, yPct: 0.06 },
          showGuides: false,
          timeWindowMs: null,
          pvBeatHistoryCount: null,
          pvBeatHistoryMode: null,
          pvParameterHistoryCount: null,
          pvRelationDisplayMode: null,
          pvRelationPressureBasis: null,
          pvRelationShowSamplePoints: null,
          hemodynamicDetailMode: "compare",
          hemodynamicParameterHistoryCount: 5,
          hemodynamicAllowNegativeFillingPressure: false,
        },
      },
    ],
    instantaneousReadbacks: [
      {
        readbackId: "instantaneous-left-ventricular-pressure",
        signalId: "hemodynamics.pressure.absolute.LV",
        label: "左室圧（瞬時値）",
        unit: "mmHg",
        sampling: "instantaneous",
      },
      {
        readbackId: "instantaneous-aortic-pressure",
        signalId: "hemodynamics.pressure.absolute.Ao",
        label: "大動脈圧（瞬時値）",
        unit: "mmHg",
        sampling: "instantaneous",
      },
    ],
    controls: [
      {
        controlId: "systemic-resistance-scale",
        label: "全身血管抵抗倍率",
        unit: "× release baseline",
        allowedValues: [0.75, 1, 1.5, 2],
        initialValue: 1,
        binding: {
          parameterKey:
            "circulation.systemic-vascular-resistance-scale",
          readbackSignalId: null,
          target: {
            scenarioIds: [
              SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SCENARIO_ID_V1,
            ],
            application: "absolute",
          },
        },
      },
    ],
} as const;

function populatedDraftV1(): StudioAuthorDraftV1 {
  const draft = structuredClone(
    SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_AUTHOR_DRAFT_V1,
  ) as unknown as {
    experiments: Array<{ readerBriefs: Array<Record<string, unknown>> }>;
  };
  const brief = draft.experiments[0]!.readerBriefs[0]!;
  Object.assign(
    brief,
    structuredClone(POPULATED_READER_BRIEF_SELECTION_V1),
  );
  return draft as unknown as StudioAuthorDraftV1;
}

function createApplicationV1(): StudioAuthorPreviewApplicationV1 {
  return new StudioAuthorPreviewApplicationV1({
    initialDraft: populatedDraftV1(),
    idFactory: () => "session-preview",
  });
}

type MutableDraftV1 = {
  document: {
    title: string;
    blocks: Array<Record<string, unknown> & {
      kind: string;
      readerBriefId?: string;
    }>;
  };
  experiments: Array<{
    scenarios: Array<{
      scenarioId: string;
    }>;
    readerBriefs: Array<{
      graphPanes: Array<{
        kind: string;
        scenarios: Array<{
          items: Array<{
            itemId: string;
          }>;
        }>;
      }>;
      controls: Array<{
        allowedValues: number[];
        initialValue: number;
        binding: {
          parameterKey: string;
          readbackSignalId: string | null;
          target: {
            scenarioIds: string[];
            application: string;
          };
        };
      }>;
    }>;
  }>;
};

function mutableDraftV1(): MutableDraftV1 {
  return populatedDraftV1() as unknown as MutableDraftV1;
}

function controlV1(draft: MutableDraftV1) {
  return draft.experiments[0]!.readerBriefs[0]!.controls[0]!;
}

function pvLoopItemV1(draft: MutableDraftV1) {
  return draft.experiments[0]!.readerBriefs[0]!.graphPanes
    .find(({ kind }) => kind === "pv-loop")!
    .scenarios[0]!.items[0]!;
}
