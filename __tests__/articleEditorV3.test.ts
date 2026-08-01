import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import i18n from "@/i18n";
import {
  articleEditorRouteKeyV3,
  resolveArticleEditorRouteDraftV3,
} from "@/components/ArticleEditorV3Page";
import {
  ArticleBriefingEditorV3,
} from "@/components/article/ArticleExperimentPlacementV3";
import {
  createArticleExperimentBlockV3,
  defaultArticleBriefingV3,
  portableEditorIdV3,
  resolveArticleBriefingHandoffV3,
  resolveArticlePlacementBriefingV3,
} from "@/components/article/ArticleEditorStateV3";
import {
  STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID,
  type StudioArticleDraftV2,
} from "@/studio/contracts/v2/article";
import {
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
  type ExperimentPlacementBriefingV2,
  type ExperimentPlacementV2,
  type ExperimentSnapshotV2,
} from "@/studio/contracts/v2/content";
import {
  StudioSnapshotBriefingHandoffV3,
  studioSnapshotBriefingHandoffKeyV3,
} from "@/studio/infrastructure/browser/StudioSnapshotBriefingHandoffV3";

class MemorySessionStorageV3 {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

function snapshotV3(): ExperimentSnapshotV2 {
  return {
    schemaId: STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
    snapshotId: "snapshot/article-preview",
    experimentId: "experiment/article-preview",
    parentSnapshotId: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    content: {
      modelId: "model/exact-v3",
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
          windowSec: 2,
          series: [{
            seriesId: "series/lv-pressure",
            label: "LV",
            colorHex: "#ef4444",
            order: 0,
          }],
        }],
        outputPanes: [{
          paneId: "pane/outputs",
          role: "output",
          label: "Outputs",
          order: 0,
          priority: 3,
          items: [{ outputId: "output/map", label: "MAP", order: 0 }],
        }],
        controlPanes: [{
          paneId: "pane/controls",
          role: "control",
          label: "Controls",
          order: 0,
          priority: 2,
          items: [{ controlId: "control/svr", label: "SVR", order: 0 }],
        }],
        note: { text: "Pinned note" },
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
          colorHex: "#dc2626",
          order: 0,
        }],
        windowSec: 3,
      },
    }],
    outputs: [{ outputId: "output/map", label: "Mean pressure", order: 0 }],
    controls: [{
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
      locale: "ja",
      title: "AS briefing",
      blocks: [createArticleExperimentBlockV3(
        snapshot,
        undefined,
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
    const first = createArticleExperimentBlockV3(snapshot, undefined, createId);
    const second = createArticleExperimentBlockV3(snapshot, undefined, createId);

    expect(first.placement.snapshotId).toBe(snapshot.snapshotId);
    expect(first.blockId).not.toBe(second.blockId);
    expect(first.placement.placementId).not.toBe(second.placement.placementId);
    expect(first.placement.briefing).toEqual({
      scenarioScope: {
        visibleScenarioIds: ["scenario/baseline", "scenario/comparison"],
        initialFocusScenarioId: "scenario/baseline",
      },
      graphs: [{ paneId: "pane/pressure", order: 0, emphasis: "primary" }],
      outputs: [{ outputId: "output/map", label: "MAP", order: 0 }],
      controls: [{
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
    const placement: ExperimentPlacementV2 = {
      schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
      placementId: "placement/article-preview",
      snapshotId: snapshot.snapshotId,
      caption: null,
      briefing: focusedBriefingV3(),
    };

    expect(resolveArticlePlacementBriefingV3(placement, snapshot)).toEqual(
      focusedBriefingV3(),
    );
  });

  it("preserves explicit empty role selections without allowing empty Scenario scope", () => {
    const snapshot = snapshotV3();
    const emptyRoles: ExperimentPlacementBriefingV2 = {
      scenarioScope: {
        visibleScenarioIds: ["scenario/baseline"],
        initialFocusScenarioId: "scenario/baseline",
      },
      graphs: [],
      outputs: [],
      controls: [],
    };
    const placement: ExperimentPlacementV2 = {
      schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
      placementId: "placement/empty-preview",
      snapshotId: snapshot.snapshotId,
      caption: null,
      briefing: emptyRoles,
    };

    expect(resolveArticlePlacementBriefingV3(placement, snapshot)).toEqual(emptyRoles);
    expect(createArticleExperimentBlockV3(
      snapshot,
      emptyRoles,
      (kind) => `${kind}/empty-briefing`,
    ).placement.briefing).toEqual(emptyRoles);
  });

  it("hands the complete role-specific Briefing across exact Snapshot identity", () => {
    const snapshot = snapshotV3();
    const storage = new MemorySessionStorageV3();
    const handoff = new StudioSnapshotBriefingHandoffV3(storage);
    const source = focusedBriefingV3();

    const written = handoff.write(snapshot.snapshotId, source);
    const handedOff = handoff.read(snapshot.snapshotId);

    expect(storage.values.has(
      studioSnapshotBriefingHandoffKeyV3(snapshot.snapshotId),
    )).toBe(true);
    expect(Object.isFrozen(written)).toBe(true);
    expect(handedOff).toEqual(source);
    expect(resolveArticleBriefingHandoffV3(snapshot, handedOff)).toEqual(source);
  });

  it("discards corrupt or stale role-specific session handoffs", () => {
    const snapshot = snapshotV3();
    const storage = new MemorySessionStorageV3();
    const handoff = new StudioSnapshotBriefingHandoffV3(storage);
    const key = studioSnapshotBriefingHandoffKeyV3(snapshot.snapshotId);

    storage.setItem(key, "{not-json");
    expect(handoff.read(snapshot.snapshotId)).toBeNull();
    expect(storage.values.has(key)).toBe(false);

    const stale: ExperimentPlacementBriefingV2 = {
      ...focusedBriefingV3(),
      graphs: [{
        paneId: "pane/removed-after-snapshot",
        order: 0,
        emphasis: "primary",
      }],
    };
    handoff.write(snapshot.snapshotId, stale);
    const structurallyValid = handoff.read(snapshot.snapshotId);
    expect(structurallyValid).not.toBeNull();
    expect(resolveArticleBriefingHandoffV3(snapshot, structurallyValid)).toBeNull();
  });

  it("keeps generated Article IDs URL-safe", () => {
    expect(portableEditorIdV3("article")).toMatch(/^article-[A-Za-z0-9-]+$/);
  });

  it("builds the same default projection through the dedicated helper", () => {
    const snapshot = snapshotV3();
    expect(defaultArticleBriefingV3(snapshot)).toEqual(
      createArticleExperimentBlockV3(
        snapshot,
        undefined,
        (kind) => `${kind}/default`,
      ).placement.briefing,
    );
  });

  it("deduplicates repeated Surface items and normalizes default graph order", () => {
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
              items: [{ controlId: "control/svr", label: "SVR duplicate", order: 0 }],
            },
          ],
        },
      },
    };

    const briefing = defaultArticleBriefingV3(snapshot);
    expect(briefing.graphs.map(({ order }) => order)).toEqual([0]);
    expect(briefing.outputs).toEqual([
      { outputId: "output/map", label: "MAP", order: 0 },
    ]);
    expect(briefing.controls).toHaveLength(1);
    expect(createArticleExperimentBlockV3(
      snapshot,
      undefined,
      (kind) => `${kind}/deduplicated-default`,
    ).placement.briefing).toEqual(briefing);
  });
});
