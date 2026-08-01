import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import "@/i18n";
import {
  ArticleReaderExperimentV3,
  ArticleReaderControlV3,
  ArticleReaderOutputsV3,
  ArticleReaderStructuralReturnGraphV3,
  articleReaderPlacementAfterCenterExitV3,
  articleReaderBoundedHistoryV3,
  commonGraphUnitV3,
  selectedSweepOutputIdsV3,
} from "@/components/article/reader/ArticleReaderExperimentV3";
import type {
  StudioArticleExperimentBlockV2,
} from "@/studio/contracts/v2/article";
import {
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
  type ExperimentPlacementBriefingV2,
  type ExperimentSnapshotV2,
} from "@/studio/contracts/v2/content";
import type {
  ControlDefinitionV2,
  ModelContractV2,
} from "@/studio/contracts/v2/model";
import type { StudioSimulationAnalysisV2 } from
  "@/studio/contracts/v2/simulation";
import type { UseArticleReaderLiveRuntimeResultV3 } from
  "@/components/article/reader/useArticleReaderLiveRuntimeV3";
import {
  articleReaderAnalysisKeyV3,
} from "@/components/article/reader/ArticleReaderLiveRuntimeV3";
import {
  WorkbenchScenarioPresentationSampleStoreV3,
} from "@/components/workbench/v3/WorkbenchPresentationSampleStoreV3";

const NOOP = () => {};

function snapshotV3(): ExperimentSnapshotV2 {
  return {
    schemaId: STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
    snapshotId: "snapshot/reader",
    experimentId: "experiment/reader",
    parentSnapshotId: null,
    createdAt: "2026-08-02T00:00:00.000Z",
    content: {
      modelId: "model/exact-reader-v3",
      scenarios: [
        scenarioV3("scenario/baseline", "Baseline"),
        scenarioV3("scenario/comparison", "Comparison"),
        scenarioV3("scenario/excluded", "Excluded"),
      ],
      surface: {
        graphPanes: [{
          paneId: "pane/return",
          role: "graph",
          label: "Systemic return",
          order: 0,
          priority: 10,
          graphId: "graph/return",
          historyDepth: 1,
          series: [],
        }],
        outputPanes: [],
        controlPanes: [],
        note: { text: "" },
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

function briefingV3(): ExperimentPlacementBriefingV2 {
  return {
    scenarioScope: {
      visibleScenarioIds: ["scenario/comparison"],
      initialFocusScenarioId: "scenario/comparison",
    },
    graphs: [{
      paneId: "pane/return",
      order: 0,
      emphasis: "primary",
    }],
    outputs: [],
    controls: [],
  };
}

function blockV3(): StudioArticleExperimentBlockV2 {
  return {
    blockId: "block/reader",
    kind: "experiment",
    placement: {
      schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
      placementId: "placement/reader",
      snapshotId: "snapshot/reader",
      caption: null,
      briefing: briefingV3(),
    },
  };
}

function contractV3(): ModelContractV2 {
  return {
    modelId: "model/exact-reader-v3",
    modelFamilyId: "model-family/main-wire-v3",
    displayName: "Reader exact model",
    fixtureSchemaId: "fixture/reader-v3",
    checkpointCodecId: "checkpoint/reader-v3",
    snapshotGateId: "gate/reader-v3",
    controlCatalog: [],
    outputCatalog: [],
    graphCatalog: [{
      graphId: "graph/return",
      renderer: "structural-return",
      analysisId: "analysis/return",
      side: "right",
    }],
  };
}

function renderExperimentV3(input: Readonly<{
  block?: StudioArticleExperimentBlockV2;
  snapshot: ExperimentSnapshotV2 | null;
  contract?: ModelContractV2 | null;
  live?: boolean;
  forceInline?: boolean;
}>): string {
  return renderToStaticMarkup(
    <ArticleReaderExperimentV3
      block={input.block ?? blockV3()}
      snapshot={input.snapshot}
      contract={input.contract ?? null}
      live={input.live ?? false}
      expanded={false}
      forceInline={input.forceInline ?? false}
      onActivate={NOOP}
      onDeactivate={NOOP}
      onExpand={NOOP}
      onClose={NOOP}
    />,
  );
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
            label: "Pressure-volume loop",
            order: 1,
            priority: 9,
            graphId: "graph/pv",
            historyDepth: 1,
            series: [],
          },
        ],
      },
    },
  };
}

function twoGraphBlockV3(): StudioArticleExperimentBlockV2 {
  const block = blockV3();
  return {
    ...block,
    placement: {
      ...block.placement,
      briefing: {
        ...block.placement.briefing,
        graphs: [
          ...block.placement.briefing.graphs,
          { paneId: "pane/pv", order: 1, emphasis: "supporting" },
        ],
      },
    },
  };
}

function structuralAnalysisV3(
  scenarioId: string,
): StudioSimulationAnalysisV2 {
  return Object.freeze({
    modelId: "model/exact-reader-v3",
    runtimeSessionId: `runtime/${scenarioId}`,
    scenarioId,
    inputEpoch: 0,
    sourceAcceptedRevision: 4,
    sourceAcceptedTimeSec: 0.008,
    analysisId: "analysis/return",
    payload: Object.freeze({
      status: "available",
      right: Object.freeze({
        side: "right",
        semantics:
          "frozen-accepted-step-volume-constrained-structural-orientation-not-simulated-response",
        pressureBasis: "absolute",
        sourceAcceptedRevision: 4,
        sourceAcceptedTimeSec: 0.008,
        downstreamNode: "RA",
        downstreamPressureLabel: "RAP",
        fillingPressureLabel: "Pmsf orientation",
        fillingPressureMmHg: 7,
        operatingPoint: Object.freeze({
          downstreamPressureMmHg: 3,
          returnFlowLPerMin: 5,
          returnPath: "VC_RA",
        }),
        curve: Object.freeze([
          Object.freeze({
            downstreamPressureMmHg: 0,
            returnFlowLPerMin: 7,
            flowLimited: false,
          }),
          Object.freeze({
            downstreamPressureMmHg: 7,
            returnFlowLPerMin: 0,
            flowLimited: false,
          }),
        ]),
        starlingLocus: Object.freeze({
          status: "requires-protocol",
          requirement:
            "independent-fixed-tbv-fixture-forks-with-per-point-settlement-and-numerical-qualification",
          points: Object.freeze([]),
        }),
        limitations: Object.freeze([]),
      }),
    }),
  });
}

function readerRuntimeStubV3(
  stateOverrides: Partial<UseArticleReaderLiveRuntimeResultV3["state"]> = {},
): UseArticleReaderLiveRuntimeResultV3 {
  const sampleStore = new WorkbenchScenarioPresentationSampleStoreV3();
  return Object.freeze({
    state: Object.freeze({
      status: "paused" as const,
      snapshotId: "snapshot/reader",
      scenarioIds: Object.freeze([
        "scenario/baseline",
        "scenario/comparison",
      ]),
      activeScenarioId: "scenario/baseline",
      pendingControlId: null,
      pendingAnalysisKeys: Object.freeze([]),
      committedControlValues: Object.freeze({}),
      analysisByKey: Object.freeze({}),
      analysisHistoryByKey: Object.freeze({}),
      analysisErrorByKey: Object.freeze({}),
      controlErrorById: Object.freeze({}),
      error: null,
      ...stateOverrides,
    }),
    sampleStore,
    play: NOOP,
    pause: async () => undefined,
    selectScenario: NOOP,
    requestAnalysis: async () => undefined,
    applyControl: async () => undefined,
  });
}

describe("Article Reader V3 experiment anchor", () => {
  it("clears only the Placement that actually left the Reader center band", () => {
    expect(articleReaderPlacementAfterCenterExitV3("placement/a", "placement/a"))
      .toBeNull();
    expect(articleReaderPlacementAfterCenterExitV3("placement/b", "placement/a"))
      .toBe("placement/b");
  });

  it("treats history depth zero as no previous structural states", () => {
    const history = ["oldest", "older", "newest"];
    expect(articleReaderBoundedHistoryV3(history, 0)).toEqual([]);
    expect(articleReaderBoundedHistoryV3(history, 1)).toEqual(["newest"]);
    expect(articleReaderBoundedHistoryV3(history, 2))
      .toEqual(["older", "newest"]);
  });

  it("derives sweep units from the selected series rather than hidden catalog entries", () => {
    const graph = {
      graphId: "graph/mixed",
      renderer: "sweep" as const,
      defaultSeriesIds: ["series/pressure"],
      seriesCatalog: [
        { kind: "scalar" as const, seriesId: "series/pressure", outputId: "output/pressure" },
        { kind: "scalar" as const, seriesId: "series/flow", outputId: "output/flow" },
      ],
    };
    const contract: ModelContractV2 = {
      ...contractV3(),
      outputCatalog: [
        {
          outputId: "output/pressure",
          kind: "signal",
          unit: "mmHg",
          shape: "scalar",
          sampling: "accepted-step",
        },
        {
          outputId: "output/flow",
          kind: "signal",
          unit: "mL/s",
          shape: "scalar",
          sampling: "accepted-step",
        },
      ],
    };
    const selectedOutputIds = selectedSweepOutputIdsV3(graph, [
      { seriesId: "series/pressure" },
    ]);

    expect(selectedOutputIds).toEqual(["output/pressure"]);
    expect(commonGraphUnitV3(contract, selectedOutputIds)).toBe("mmHg");
    expect(commonGraphUnitV3(contract, graph.seriesCatalog.map(({ outputId }) =>
      outputId))).toBeUndefined();
  });

  it("renders a borderless inflow anchor with an explicit live activation path", () => {
    const html = renderExperimentV3({
      snapshot: snapshotV3(),
      contract: contractV3(),
    });
    const root = html.match(/^<section[^>]+>/)?.[0];

    expect(root).toContain('data-reader-placement-id="placement/reader"');
    expect(root).toContain('id="placement-placement/reader"');
    expect(root).not.toMatch(/\bborder(?:-|\b)/);
    expect(root).not.toMatch(/\bbg-/);
    expect(html).toContain(">MW V3</span>");
    expect(html).toMatch(/<button type="button"[^>]+aria-label="[^"]+"/);
    expect(html.match(/<button type="button"/g)?.length).toBeGreaterThanOrEqual(2);
    const inflowButton = html.match(
      /<button type="button"[^>]*class="block w-full[^>]*>.*?<\/button>/s,
    )?.[0];
    expect(inflowButton).toBeDefined();
    expect(inflowButton).not.toMatch(/<(?:div|p)(?:\s|>)/);
  });

  it("renders an exact-model-unavailable explanation without a dead preview button", () => {
    const html = renderExperimentV3({ snapshot: snapshotV3() });

    expect(html).toContain('data-reader-model-unavailable="true"');
    expect(html).not.toContain('data-reader-presentation="peek"');
    expect(html).not.toContain('<button type="button"');
  });

  it("admits one selected graph to the inline live structure", () => {
    const html = renderExperimentV3({
      snapshot: snapshotV3(),
      contract: contractV3(),
      live: true,
    });

    expect(html).toContain('data-reader-placement-live="true"');
    expect(html).toMatch(/<figure class="min-w-0"(?:\s[^>]*)?>/);
    expect(html).not.toContain("article-reader-experiment-drawer-v3");
    expect(html).not.toContain("min-w-0 px-4 pb-10");
  });

  it("renders one labeled structural canvas for every visible Scenario", () => {
    const snapshot = snapshotV3();
    const scenarios = snapshot.content.scenarios.slice(0, 2);
    const analysisByKey = Object.fromEntries(scenarios.map((scenario) => [
      articleReaderAnalysisKeyV3(scenario.scenarioId, "analysis/return"),
      structuralAnalysisV3(scenario.scenarioId),
    ]));
    const runtime = readerRuntimeStubV3({ analysisByKey });
    const graph = contractV3().graphCatalog[0]!;
    if (graph.renderer !== "structural-return") {
      throw new Error("expected structural graph");
    }

    const html = renderToStaticMarkup(
      <ArticleReaderStructuralReturnGraphV3
        graph={graph}
        historyDepth={1}
        runtime={runtime}
        visibleScenarios={scenarios}
      />,
    );

    expect(html.match(/data-chart-kind="guyton-starling-structural-orientation-v3"/g))
      .toHaveLength(2);
    expect(html).toContain('data-reader-structural-scenario-id="scenario/baseline"');
    expect(html).toContain('data-reader-structural-scenario-id="scenario/comparison"');
    expect(html).toContain("Baseline");
    expect(html).toContain("Comparison");
    expect(html).not.toContain("Open this experiment to start");
  });

  it("keeps Reader outputs vertical on the mobile base breakpoint", () => {
    const store = new WorkbenchScenarioPresentationSampleStoreV3();
    const briefing: ExperimentPlacementBriefingV2 = {
      ...briefingV3(),
      outputs: [{ outputId: "output/co", label: "CO", order: 0 }],
    };
    const contract: ModelContractV2 = {
      ...contractV3(),
      outputCatalog: [{
        outputId: "output/co",
        kind: "metric",
        unit: "L/min",
        shape: "scalar",
        scope: "instant",
        dependencies: [],
      }],
    };
    const html = renderToStaticMarkup(
      <ArticleReaderOutputsV3
        briefing={briefing}
        contract={contract}
        scenarioId="scenario/comparison"
        sampleStore={store}
      />,
    );

    expect(html).toContain("grid grid-cols-1");
    expect(html).toContain("sm:grid-cols-2");
    expect(html).not.toContain("grid grid-cols-2 gap");
  });

  it("disables authored control buttons outside the registered step lattice", () => {
    const definition: ControlDefinitionV2 = {
      controlId: "control/svr",
      valueType: "number",
      unit: "WU",
      minimum: 0,
      maximum: 2,
      step: 1,
      defaultValue: 1,
      changeSemantics: "reset",
    };
    const briefing: ExperimentPlacementBriefingV2 = {
      ...briefingV3(),
      controls: [{
        controlId: "control/svr",
        label: "SVR",
        order: 0,
        presentation: {
          kind: "buttons",
          options: [
            { label: "Valid", value: 1 },
            { label: "Invalid", value: 1.25 },
          ],
        },
        binding: {
          mode: "fixed",
          scenarioIds: ["scenario/comparison"],
          application: "absolute",
        },
      }],
    };
    const html = renderToStaticMarkup(
      <ArticleReaderControlV3
        briefing={briefing}
        control={briefing.controls[0]!}
        definition={definition}
        runtime={readerRuntimeStubV3({
          activeScenarioId: "scenario/comparison",
        })}
        snapshot={snapshotV3()}
      />,
    );

    const invalidButton = html.match(/<button[^>]*>Invalid<\/button>/)?.[0];
    expect(invalidButton).toContain("disabled");
    expect(invalidButton).toContain("step lattice");
  });

  it("derives a compact right-peek anchor for two to four selected graphs", () => {
    const html = renderExperimentV3({
      block: twoGraphBlockV3(),
      snapshot: twoGraphSnapshotV3(),
      contract: contractV3(),
      live: true,
    });

    expect(html).toContain('data-reader-presentation="peek"');
    expect(html).toContain("Systemic return · Pressure-volume loop");
    expect(html).not.toContain("<figure");
  });

  it("renders the dedicated exact-Snapshot view inline instead of running behind an anchor", () => {
    const html = renderExperimentV3({
      block: twoGraphBlockV3(),
      snapshot: twoGraphSnapshotV3(),
      contract: contractV3(),
      live: true,
      forceInline: true,
    });

    expect(html).toContain("<figure");
    expect(html).not.toContain('data-reader-presentation="peek"');
  });

  it("renders only the authored Briefing Scenario scope and focuses its initial Scenario", () => {
    const html = renderExperimentV3({
      snapshot: snapshotV3(),
      contract: contractV3(),
      live: true,
    });

    expect(html).toContain(">Comparison</button>");
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain(">Baseline</button>");
    expect(html).not.toContain(">Excluded</button>");
  });

  it("fails closed when the pinned Snapshot cannot be resolved", () => {
    const html = renderExperimentV3({
      snapshot: null,
      contract: contractV3(),
      live: true,
    });

    expect(html).toContain('role="alert"');
    expect(html).toContain('data-reader-placement-id="placement/reader"');
    expect(html).not.toContain("data-reader-placement-live");
    expect(html).not.toContain("<figure");
    expect(html).not.toContain('<button type="button"');
  });

  it("fails only the inconsistent Placement closed instead of crashing the Article", () => {
    const block = blockV3();
    const html = renderExperimentV3({
      block: {
        ...block,
        placement: {
          ...block.placement,
          briefing: {
            ...block.placement.briefing,
            graphs: [{
              paneId: "pane/missing",
              order: 0,
              emphasis: "primary",
            }],
          },
        },
      },
      snapshot: snapshotV3(),
      contract: contractV3(),
      live: true,
    });

    expect(html).toContain('role="alert"');
    expect(html).toContain('data-reader-placement-id="placement/reader"');
    expect(html).not.toContain("data-reader-placement-live");
    expect(html).not.toContain("<figure");
  });
});
