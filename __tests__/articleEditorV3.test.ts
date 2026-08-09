import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import {
  articleEditorRouteHydratedV3,
  articleEditorRouteKeyV3,
  insertArticleBlockV3,
  resolveArticleEditorRouteDraftV3,
  synchronizeRemoteArticlePublicationV3,
} from "@/components/ArticleEditorV3Page";
import {
  ArticleBriefingEditorV3,
  ArticleExperimentPlacementV3,
} from "@/components/article/ArticleExperimentPlacementV3";
import {
  articleBriefingPresentationV3,
  createArticleExperimentBlockV3,
  defaultArticleBriefingV3,
  portableEditorIdV3,
  resolveArticlePlacementBriefingV3,
} from "@/components/article/ArticleEditorStateV3";
import {
  STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID,
  type StudioArticleDraftV2,
} from "@/studio/contracts/v2/article";
import {
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
  type ExperimentSnapshotV2,
  type ExperimentPlacementBriefingV2,
  type ExperimentPlacementV2,
} from "@/studio/contracts/v2/content";
function snapshotV3(): ExperimentSnapshotV2 {
  return {
    schemaId: STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
    snapshotId: "snapshot/article-preview",
    surfaceReleaseId: "surface/article-preview-v1",
    createdAt: "2026-08-01T00:00:00.000Z",
    content: {
      modelId: "model/exact-v3",
      surfaceSeriesId: "surface-series/article-preview",
      scenarios: [
        scenarioV3("scenario/baseline", "Baseline"),
        scenarioV3("scenario/comparison", "Comparison"),
      ],
      surface: {
        graphPanes: [{
          paneId: "pane/pressure",
          role: "graph",
          label: "Pressure",
          order: 0,
          priority: 6,
          graphId: "graph/pressure",
          scenarioScope: { mode: "visible-scenarios" },
          excludedTraces: [],
          windowSec: 2,
          series: [{
            seriesId: "series/lv-pressure",
            label: "LV",
            order: 0,
          }],
        }],
        outputPanes: [{
          paneId: "pane/outputs",
          role: "output",
          label: "Outputs",
          order: 0,
          priority: 3,
          binding: { mode: "active-slot" },
          items: [{ outputId: "output/map", label: "MAP", order: 0 }],
        }],
        controlPanes: [{
          paneId: "pane/controls",
          role: "control",
          label: "Controls",
          order: 0,
          priority: 2,
          binding: { mode: "active-slot" },
          items: [{
            controlId: "control/svr",
            label: "SVR",
            order: 0,
            presentation: { kind: "slider" },
          }],
        }],
        note: { text: "Pinned note" },
      },
    },
  };
}

function twoGraphSnapshotV3(): ExperimentSnapshotV2 {
  const snapshot = snapshotV3();
  return {
    ...snapshot,
    content: {
      ...snapshot.content,
      surface: {
        ...snapshot.content.surface,
        graphPanes: [
          ...snapshot.content.surface.graphPanes,
          {
            paneId: "pane/pv",
            role: "graph",
            label: "PV loop",
            order: 1,
            priority: 5,
            graphId: "graph/pv",
            scenarioScope: { mode: "visible-scenarios" },
            excludedTraces: [],
            historyDepth: 1,
            series: [],
          },
        ],
      },
    },
  };
}

function scenarioV3(scenarioId: string, label: string) {
  return {
    scenarioId,
    label,
    capture: {
      fixture: {},
      checkpoint: {
        acceptedRevision: 4,
        acceptedTimeSec: 0.008,
        payload: {},
      },
    },
  };
}

function focusedBriefingV3(): ExperimentPlacementBriefingV2 {
  return {
    defaultTitle: "Focused experiment",
    scenarioScope: {
      visibleScenarioIds: ["scenario/comparison"],
      initialFocusScenarioId: "scenario/comparison",
    },
    graphs: [{
      paneId: "pane/pressure",
      order: 0,
      emphasis: "primary",
      overrides: {
        label: "Focused pressure",
        legend: "compact",
        series: [{
          seriesId: "series/lv-pressure",
          label: "LV pressure",
          order: 0,
        }],
        traceColors: [{
          scenarioId: "scenario/comparison",
          seriesId: "series/lv-pressure",
          colorHex: "#dc2626",
        }],
        windowSec: 3,
      },
    }],
    outputs: [{
      sourcePaneId: "pane/outputs",
      outputId: "output/map",
      scenarioId: "scenario/comparison",
      label: "Mean pressure",
      order: 0,
    }],
    controls: [{
      sourcePaneId: "pane/controls",
      controlId: "control/svr",
      label: "Resistance",
      order: 0,
      presentation: { kind: "slider" },
      binding: {
        mode: "reader-focus",
        allowedScenarioIds: ["scenario/comparison"],
      },
    }],
  };
}

describe("Article Editor V3 briefing", () => {
  it("adopts publication authority after moving the Article pointer", async () => {
    const saved = Object.freeze({
      schemaId: STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID,
      articleId: "6368328d-c852-4440-aa15-07dea45f7753",
      draftVersion: 2,
      visibility: "draft" as const,
      locale: "ja",
      title: "Publication readback",
      blocks: Object.freeze([]),
    });
    const published = Object.freeze({
      ...saved,
      visibility: "public" as const,
    });
    const repository = {
      publishArticle: vi.fn().mockResolvedValue(undefined),
      readArticle: vi.fn().mockResolvedValue(published),
      unpublishArticle: vi.fn().mockResolvedValue(undefined),
    };

    const result = await synchronizeRemoteArticlePublicationV3({
      repository,
      saved,
      candidate: { ...saved, visibility: "public" },
      wasPublished: false,
    });

    expect(repository.publishArticle).toHaveBeenCalledWith({
      articleId: saved.articleId,
      expectedVersion: saved.draftVersion,
      publicSlug: "article-6368328d-c852-4440-aa15-07dea45f7753",
    });
    expect(repository.readArticle).toHaveBeenCalledWith(saved.articleId);
    expect(result).toEqual({ article: published, published: true });
  });

  it("keeps an existing Article inert until its exact route is hydrated", () => {
    expect(articleEditorRouteHydratedV3(null, "article-existing")).toBe(false);
    expect(articleEditorRouteHydratedV3("new", "article-existing")).toBe(false);
    expect(articleEditorRouteHydratedV3(
      "article-existing",
      "article-existing",
    )).toBe(true);
    expect(articleEditorRouteHydratedV3("new", "new")).toBe(true);
  });

  it("shares graph-count presentation rules between Editor and Reader", () => {
    expect(articleBriefingPresentationV3({ graphs: [] })).toBe("inflow");
    expect(articleBriefingPresentationV3({ graphs: [{}] as never })).toBe("inflow");
    expect(articleBriefingPresentationV3({ graphs: [{}, {}] as never })).toBe("peek");
    expect(articleBriefingPresentationV3({
      graphs: [{}, {}, {}, {}, {}] as never,
    })).toBe("fullscreen");
  });

  it("renders a two-graph Editor placement as the same compact Peek anchor", () => {
    const snapshot = twoGraphSnapshotV3();
    const block = createArticleExperimentBlockV3(
      snapshot,
      (kind) => `${kind}/editor-peek`,
    );
    const html = renderToStaticMarkup(React.createElement(
      ArticleExperimentPlacementV3,
      {
        block,
        snapshot,
        index: 0,
        total: 1,
        blockEditorLayout: true,
        showBlockActions: false,
        onChange: () => undefined,
        onEdit: () => undefined,
        onRemove: () => undefined,
        onMove: () => undefined,
      },
    ));

    expect(html).toContain('data-reader-presentation="peek"');
    expect(html).toContain("Baseline");
    expect(html).not.toContain(i18n.t("articleEditor.staticDataNotice"));
  });

  it("inserts a Notion-style block at the requested document boundary", () => {
    const first = {
      blockId: "block/first",
      kind: "paragraph" as const,
      text: "First",
    };
    const second = {
      blockId: "block/second",
      kind: "heading" as const,
      level: 2 as const,
      text: "Second",
    };
    const inserted = {
      blockId: "block/inserted",
      kind: "paragraph" as const,
      text: "Inserted",
    };

    const result = insertArticleBlockV3([first, second], 1, inserted);
    expect(result.map(({ blockId }) => blockId)).toEqual([
      "block/first",
      "block/inserted",
      "block/second",
    ]);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("renders the shared Briefing editor from Snapshot and Briefing values only", () => {
    const html = renderToStaticMarkup(React.createElement(
      ArticleBriefingEditorV3,
      {
        snapshot: snapshotV3(),
        briefing: focusedBriefingV3(),
        onChange: () => undefined,
      },
    ));

    expect(html).toContain("data-testid=\"article-briefing-editor-v3\"");
    expect(html).toContain("Focused pressure");
    expect(html).toContain("Mean pressure");
    expect(html).toContain("Resistance");

    const embeddedHtml = renderToStaticMarkup(React.createElement(
      ArticleBriefingEditorV3,
      {
        snapshot: snapshotV3(),
        briefing: focusedBriefingV3(),
        showIntro: false,
        testId: "workbench-briefing-editor-v3",
        onChange: () => undefined,
      },
    ));
    expect(embeddedHtml).toContain(
      "data-testid=\"workbench-briefing-editor-v3\"",
    );
    expect(embeddedHtml).not.toContain(i18n.t("articleEditor.briefing.title"));
  });

  it("does not replace an authored new-Article Draft when its route effect reruns", () => {
    const snapshot = snapshotV3();
    const authored = {
      schemaId: STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID,
      articleId: "article-initial-save-race",
      draftVersion: 0,
      visibility: "draft",
      locale: "ja",
      title: "AS briefing",
      blocks: [createArticleExperimentBlockV3(
        snapshot,
        (kind) => `${kind}/initial-save-race`,
      )],
    } satisfies StudioArticleDraftV2;
    const resolution = resolveArticleEditorRouteDraftV3({
      currentDraft: authored,
      hydratedRouteKey: articleEditorRouteKeyV3("new"),
      locale: "ja",
      readArticle: () => {
        throw new Error("same-route initialization must not read storage");
      },
      routeArticleId: "new",
      untitledTitle: "名称未設定の記事",
    });

    expect(resolution.routeChanged).toBe(false);
    expect(resolution.draft).toBe(authored);
    expect(resolution.draft.blocks).toHaveLength(1);

    const afterUiLocaleSwitch = resolveArticleEditorRouteDraftV3({
      currentDraft: authored,
      hydratedRouteKey: articleEditorRouteKeyV3("new"),
      locale: "en",
      readArticle: () => {
        throw new Error("changing UI locale must not rehydrate an edited Draft");
      },
      routeArticleId: "new",
      untitledTitle: "Untitled article",
    });
    expect(afterUiLocaleSwitch.routeChanged).toBe(false);
    expect(afterUiLocaleSwitch.draft).toBe(authored);

    const canonical = resolveArticleEditorRouteDraftV3({
      currentDraft: authored,
      hydratedRouteKey: articleEditorRouteKeyV3("new"),
      locale: "ja",
      readArticle: (articleId) => articleId === authored.articleId
        ? authored
        : null,
      routeArticleId: authored.articleId,
      untitledTitle: "名称未設定の記事",
    });
    expect(canonical.routeChanged).toBe(true);
    expect(canonical.draft).toBe(authored);
    expect(canonical.draft.blocks).toHaveLength(1);
  });

  it("creates independent placements with a complete explicit Reader projection", () => {
    const snapshot = snapshotV3();
    let sequence = 0;
    const createId = (kind: "block" | "placement") => `${kind}/${++sequence}`;
    const first = createArticleExperimentBlockV3(snapshot, createId);
    const second = createArticleExperimentBlockV3(snapshot, createId);

    expect(first.placement.snapshotId).toBe(snapshot.snapshotId);
    expect(first.blockId).not.toBe(second.blockId);
    expect(first.placement.placementId).not.toBe(second.placement.placementId);
    expect(first.placement.briefing).toEqual({
      defaultTitle: "Baseline",
      scenarioScope: {
        visibleScenarioIds: ["scenario/baseline", "scenario/comparison"],
        initialFocusScenarioId: "scenario/baseline",
      },
      graphs: [{ paneId: "pane/pressure", order: 0, emphasis: "primary" }],
      outputs: [{
        sourcePaneId: "pane/outputs",
        outputId: "output/map",
        scenarioId: "scenario/baseline",
        label: "MAP",
        order: 0,
      }],
      controls: [{
        sourcePaneId: "pane/controls",
        controlId: "control/svr",
        label: "SVR",
        order: 0,
        presentation: { kind: "slider" },
        binding: {
          mode: "fixed",
          scenarioIds: ["scenario/baseline"],
          application: "absolute",
        },
      }],
    });
  });

  it("resolves role-specific selections and authored graph overrides", () => {
    const snapshot = snapshotV3();
    const focusedSnapshot = snapshot;
    const placement: ExperimentPlacementV2 = {
      schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
      placementId: "placement/article-preview",
      snapshotId: snapshot.snapshotId,
      briefing: focusedBriefingV3(),
      titleOverride: null,
      caption: null,
    };

    expect(resolveArticlePlacementBriefingV3(placement, focusedSnapshot)).toEqual(
      focusedBriefingV3(),
    );
  });

  it("preserves explicit empty role selections without allowing empty Scenario scope", () => {
    const snapshot = snapshotV3();
    const emptyRoles: ExperimentPlacementBriefingV2 = {
      defaultTitle: "Empty experiment",
      scenarioScope: {
        visibleScenarioIds: ["scenario/baseline"],
        initialFocusScenarioId: "scenario/baseline",
      },
      graphs: [],
      outputs: [],
      controls: [],
    };
    const emptySnapshot = snapshot;
    const placement: ExperimentPlacementV2 = {
      schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
      placementId: "placement/empty-preview",
      snapshotId: snapshot.snapshotId,
      briefing: emptyRoles,
      titleOverride: null,
      caption: null,
    };

    expect(resolveArticlePlacementBriefingV3(placement, emptySnapshot)).toEqual(emptyRoles);
    expect(createArticleExperimentBlockV3(
      emptySnapshot,
      emptyRoles,
      (kind) => `${kind}/empty-briefing`,
    ).placement).toEqual({
      schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
      placementId: "placement/empty-briefing",
      snapshotId: emptySnapshot.snapshotId,
      briefing: emptyRoles,
      titleOverride: null,
      caption: null,
    });
  });

  it("keeps generated Article IDs URL-safe", () => {
    expect(portableEditorIdV3("article")).toMatch(/^article-[A-Za-z0-9-]+$/);
  });

  it("builds the same default projection through the dedicated helper", () => {
    const snapshot = snapshotV3();
    expect(createArticleExperimentBlockV3(snapshot).placement.briefing)
      .toEqual(defaultArticleBriefingV3(snapshot));
  });

  it("keeps controller-pane identity while normalizing default graph order", () => {
    const base = snapshotV3();
    const snapshot: ExperimentSnapshotV2 = {
      ...base,
      content: {
        ...base.content,
        surface: {
          ...base.content.surface,
          graphPanes: [
            { ...base.content.surface.graphPanes[0]!, order: 7 },
          ],
          outputPanes: [
            ...base.content.surface.outputPanes,
            {
              paneId: "pane/outputs-duplicate",
              role: "output",
              label: "Repeated outputs",
              order: 1,
              priority: 1,
              binding: { mode: "active-slot" },
              items: [{ outputId: "output/map", label: "MAP duplicate", order: 0 }],
            },
          ],
          controlPanes: [
            ...base.content.surface.controlPanes,
            {
              paneId: "pane/controls-duplicate",
              role: "control",
              label: "Repeated controls",
              order: 1,
              priority: 1,
              binding: { mode: "active-slot" },
              items: [{
                controlId: "control/svr",
                label: "SVR duplicate",
                order: 0,
                presentation: { kind: "slider" },
              }],
            },
          ],
        },
      },
    };

    const briefing = defaultArticleBriefingV3(snapshot);
    expect(briefing.graphs.map(({ order }) => order)).toEqual([0]);
    expect(briefing.outputs).toEqual([
      {
        sourcePaneId: "pane/outputs",
        outputId: "output/map",
        scenarioId: "scenario/baseline",
        label: "MAP",
        order: 0,
      },
      {
        sourcePaneId: "pane/outputs-duplicate",
        outputId: "output/map",
        scenarioId: "scenario/baseline",
        label: "MAP duplicate",
        order: 1,
      },
    ]);
    expect(briefing.controls.map(({ sourcePaneId }) => sourcePaneId)).toEqual([
      "pane/controls",
      "pane/controls-duplicate",
    ]);
    expect(createArticleExperimentBlockV3(
      snapshot,
      (kind) => `${kind}/deduplicated-default`,
    ).placement.snapshotId).toEqual(snapshot.snapshotId);
  });

  it("captures a Surface custom-button presentation by value", () => {
    const base = snapshotV3();
    const snapshot: ExperimentSnapshotV2 = {
      ...base,
      content: {
        ...base.content,
        surface: {
          ...base.content.surface,
          controlPanes: base.content.surface.controlPanes.map((pane) => ({
            ...pane,
            items: pane.items.map((item) => ({
              ...item,
              presentation: {
                kind: "buttons" as const,
                options: [
                  { label: "Low", value: 0.8 },
                  { label: "High", value: 1.2 },
                ],
              },
            })),
          })),
        },
      },
    };

    const briefing = defaultArticleBriefingV3(snapshot);
    expect(briefing.controls[0]?.presentation).toEqual({
      kind: "buttons",
      options: [
        { label: "Low", value: 0.8 },
        { label: "High", value: 1.2 },
      ],
    });
    expect(briefing.controls[0]?.presentation).not.toBe(
      snapshot.content.surface.controlPanes[0]?.items[0]?.presentation,
    );
  });
});
