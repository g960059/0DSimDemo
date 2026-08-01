import { describe, expect, it } from "vitest";

import {
  createArticleExperimentBlockV3,
  resolveArticleBriefingHandoffV3,
  resolveArticlePlacementPanesV3,
} from "@/components/article/ArticleEditorStateV3";
import {
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
  type ExperimentPlacementV2,
  type ExperimentSnapshotV2,
} from "@/studio/contracts/v2/content";
import {
  StudioSnapshotBriefingHandoffV3,
  studioSnapshotBriefingHandoffKeyV3,
} from "@/studio/infrastructure/browser/StudioSnapshotBriefingHandoffV3";

class MemorySessionStorageV3 {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
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
      scenarios: [{
        scenarioId: "scenario/baseline",
        label: "Baseline",
        capture: {
          fixture: {},
          checkpoint: {
            acceptedRevision: 4,
            acceptedTimeSec: 0.008,
            payload: {},
          },
        },
      }],
      surface: {
        graphPanes: [{
          paneId: "pane/pressure",
          role: "graph",
          label: "Pressure",
          colorHex: "#ef4444",
          order: 0,
          priority: 6,
          graphId: "graph/pressure",
          windowSec: 2,
          series: [{
            outputId: "output/lv-pressure",
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
          items: [{
            outputId: "output/map",
            label: "MAP",
            colorHex: "#3b82f6",
            order: 0,
          }],
        }],
        controlPanes: [],
        note: { text: "Pinned note" },
      },
    },
  };
}

describe("Article Editor V3 briefing", () => {
  it("creates independent placements so one Snapshot can be placed repeatedly", () => {
    const snapshot = snapshotV3();
    let sequence = 0;
    const createId = (kind: "block" | "placement") => `${kind}/${++sequence}`;
    const first = createArticleExperimentBlockV3(snapshot, undefined, createId);
    const second = createArticleExperimentBlockV3(snapshot, undefined, createId);

    expect(first.placement.snapshotId).toBe(snapshot.snapshotId);
    expect(second.placement.snapshotId).toBe(snapshot.snapshotId);
    expect(first.blockId).not.toBe(second.blockId);
    expect(first.placement.placementId).not.toBe(second.placement.placementId);
    expect(first.placement.briefing?.panePicks).toEqual([
      { paneId: "pane/pressure", priority: 6 },
      { paneId: "pane/outputs", priority: 3 },
    ]);
  });

  it("uses placement priority for prominence without copying pane labels or colors", () => {
    const snapshot = snapshotV3();
    const placement: ExperimentPlacementV2 = {
      schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
      placementId: "placement/article-preview",
      snapshotId: snapshot.snapshotId,
      caption: null,
      briefing: {
        panePicks: [
          { paneId: "pane/pressure", priority: 1 },
          { paneId: "pane/outputs", priority: 9 },
        ],
      },
    };

    expect(resolveArticlePlacementPanesV3(placement, snapshot).map((item) => ({
      paneId: item.pane.paneId,
      label: item.pane.label,
      colorHex: item.pane.role === "graph" ? item.pane.colorHex : undefined,
      priority: item.priority,
    }))).toEqual([
      {
        paneId: "pane/outputs",
        label: "Outputs",
        colorHex: undefined,
        priority: 9,
      },
      {
        paneId: "pane/pressure",
        label: "Pressure",
        colorHex: "#ef4444",
        priority: 1,
      },
    ]);
  });

  it("preserves an explicit empty briefing instead of falling back to all panes", () => {
    const snapshot = snapshotV3();
    const placement: ExperimentPlacementV2 = {
      schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
      placementId: "placement/empty-preview",
      snapshotId: snapshot.snapshotId,
      caption: null,
      briefing: { panePicks: [] },
    };

    expect(resolveArticlePlacementPanesV3(placement, snapshot)).toEqual([]);
    expect(createArticleExperimentBlockV3(
      snapshot,
      { scenarioIds: [], panePicks: [] },
      (kind) => `${kind}/empty-briefing`,
    ).placement.briefing).toEqual({ scenarioIds: [], panePicks: [] });
  });

  it("hands Workbench Briefing selection across the browser session by exact snapshotId", () => {
    const snapshot = snapshotV3();
    const storage = new MemorySessionStorageV3();
    const handoff = new StudioSnapshotBriefingHandoffV3(storage);
    const source = {
      scenarioIds: ["scenario/baseline"],
      panePicks: [{ paneId: "pane/outputs", priority: 11 }],
    };

    const written = handoff.write(snapshot.snapshotId, source);
    source.panePicks[0]!.priority = 1;

    expect(storage.values.has(
      studioSnapshotBriefingHandoffKeyV3(snapshot.snapshotId),
    )).toBe(true);
    expect(Object.isFrozen(written)).toBe(true);
    const handedOff = handoff.read(snapshot.snapshotId);
    expect(handedOff).toEqual({
      scenarioIds: ["scenario/baseline"],
      panePicks: [{ paneId: "pane/outputs", priority: 11 }],
    });
    const resolved = resolveArticleBriefingHandoffV3(snapshot, handedOff);
    expect(createArticleExperimentBlockV3(
      snapshot,
      resolved ?? undefined,
      (kind) => `${kind}/handoff`,
    ).placement.briefing).toEqual(handedOff);
  });

  it("discards corrupt or stale session handoffs instead of widening Snapshot data", () => {
    const snapshot = snapshotV3();
    const storage = new MemorySessionStorageV3();
    const handoff = new StudioSnapshotBriefingHandoffV3(storage);
    const key = studioSnapshotBriefingHandoffKeyV3(snapshot.snapshotId);

    storage.setItem(key, "{not-json");
    expect(handoff.read(snapshot.snapshotId)).toBeNull();
    expect(storage.values.has(key)).toBe(false);

    handoff.write(snapshot.snapshotId, {
      panePicks: [{ paneId: "pane/removed-after-snapshot", priority: 1 }],
    });
    const structurallyValid = handoff.read(snapshot.snapshotId);
    expect(structurallyValid).not.toBeNull();
    expect(resolveArticleBriefingHandoffV3(snapshot, structurallyValid))
      .toBeNull();
  });
});
