import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import "@/i18n";
import {
  ArticleReaderExperimentPeekPanelV3,
  ArticleReaderExperimentV3,
  ArticleReaderControlV3,
  ArticleReaderOutputsV3,
  ArticleReaderStructuralReturnGraphV3,
  articleReaderPlacementAfterCenterExitV3,
  articleReaderBoundedHistoryV3,
  commonGraphUnitV3,
  resolveArticleReaderGraphPresentationV3,
  readerStructuralAnalysisRequestsV3,
  selectedSweepOutputIdsV3,
} from "@/components/article/reader/ArticleReaderExperimentV3";
import {
  articleReaderPeekFractionForPointerV3,
  clampArticleReaderPeekFractionV3,
} from "@/components/ArticleReaderV3Page";
import type { StudioArticleExperimentBlockV2 } from "@/studio/contracts/v2/article";
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
import type { StudioClientCompositionV2 } from "@/studio/composition/StudioDefaultCompositionV2";
import type { StudioSimulationAnalysisV2 } from "@/studio/contracts/v2/simulation";
import type { UseArticleReaderLiveRuntimeResultV3 } from "@/components/article/reader/useArticleReaderLiveRuntimeV3";
import { articleReaderAnalysisKeyV3 } from "@/components/article/reader/ArticleReaderLiveRuntimeV3";
import { articleReaderPresentationOutputSelectionV3 } from "@/components/article/reader/ArticleReaderPresentationOutputSelectionV3";
import { WorkbenchScenarioPresentationSampleStoreV3 } from "@/components/workbench/v3/WorkbenchPresentationSampleStoreV3";
import {
  STANDARD_TEST_RELEASE_TICKET_V1,
  STANDARD_TEST_SURFACE_RELEASE_ID_V1,
  STANDARD_TEST_SURFACE_SERIES_ID_V1,
} from "@/__tests__/helpers/standardReleaseTicketV1";
import { MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID } from "@/engine/myocardium/MainWireIntegratedModelAnalysisContractV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1 } from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";

const NOOP = () => {};

function snapshotV3(): ExperimentSnapshotV2 {
  return {
    schemaId: STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
    snapshotId: "snapshot/reader",
    surfaceReleaseId: STANDARD_TEST_SURFACE_RELEASE_ID_V1,
    createdAt: "2026-08-02T00:00:00.000Z",
    content: {
      modelId: STANDARD_TEST_RELEASE_TICKET_V1.modelId,
      surfaceSeriesId: STANDARD_TEST_SURFACE_SERIES_ID_V1,
      scenarios: [
        scenarioV3("scenario/baseline", "Baseline"),
        scenarioV3("scenario/comparison", "Comparison"),
        scenarioV3("scenario/excluded", "Excluded"),
      ],
      surface: {
        graphPanes: [
          {
            paneId: "pane/return",
            role: "graph",
            label: "Systemic return",
            order: 0,
            priority: 10,
            graphId: "graph/return",
            scenarioScope: { mode: "visible-scenarios" },
            excludedTraces: [],
            historyDepth: 1,
            structuralSide: "right",
            series: [],
          },
        ],
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
    defaultTitle: "Reader experiment",
    scenarioScope: {
      visibleScenarioIds: ["scenario/comparison"],
      initialFocusScenarioId: "scenario/comparison",
    },
    graphs: [
      {
        paneId: "pane/return",
        order: 0,
        emphasis: "primary",
      },
    ],
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
      briefing: briefingV3(),
      titleOverride: null,
      caption: null,
    },
  };
}

function contractV3(): ModelContractV2 {
  return {
    modelId: STANDARD_TEST_RELEASE_TICKET_V1.modelId,
    modelFamilyId: STANDARD_TEST_RELEASE_TICKET_V1.manifest.modelFamilyId,
    displayName: "Reader exact model",
    fixtureSchemaId:
      STANDARD_TEST_RELEASE_TICKET_V1.manifest.fixtureSchema.fixtureSchemaId,
    checkpointCodecId:
      STANDARD_TEST_RELEASE_TICKET_V1.manifest.checkpointCodec
        .checkpointCodecId,
    snapshotGateId: "gate/reader-v3",
    controlCatalog: [],
    outputCatalog: [],
    graphCatalog: [
      {
        graphId: "graph/return",
        renderer: "structural-return",
        analysisId: "analysis/return",
        side: "right",
      },
    ],
  };
}

function runtimeCompositionV3(): StudioClientCompositionV2 {
  const contract = contractV3();
  return Object.freeze({
    defaultModelId: contract.modelId,
    releaseStage: "stable",
    defaultFixture: Object.freeze({}),
    contract,
    analysisExecutionPlan: () => null,
    workerReleaseTicket: STANDARD_TEST_RELEASE_TICKET_V1,
    surfaceReleaseId: STANDARD_TEST_SURFACE_RELEASE_ID_V1,
    surfaceSeriesId: STANDARD_TEST_SURFACE_SERIES_ID_V1,
    surfaceStage: "stable",
  });
}

function renderExperimentV3(
  input: Readonly<{
    block?: StudioArticleExperimentBlockV2;
    snapshot: ExperimentSnapshotV2 | null;
    contract?: ModelContractV2 | null;
    contractAvailability?: "loading" | "ready" | "unavailable";
    live?: boolean;
    forceInline?: boolean;
  }>,
): string {
  return renderToStaticMarkup(
    <ArticleReaderExperimentV3
      block={input.block ?? blockV3()}
      snapshot={input.snapshot}
      contract={input.contract ?? null}
      contractAvailability={input.contractAvailability}
      runtimeComposition={runtimeCompositionV3()}
      live={input.live ?? false}
      expandedPresentation={null}
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

function structuralAnalysisV3(scenarioId: string): StudioSimulationAnalysisV2 {
  return Object.freeze({
    modelId: STANDARD_TEST_RELEASE_TICKET_V1.modelId,
    runtimeSessionId: `runtime/${scenarioId}`,
    scenarioId,
    inputEpoch: 0,
    sourceAcceptedRevision: 4,
    sourceAcceptedTimeSec: 0.008,
    analysisId:
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
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
          returnPath: "VC_RA+CS_RA",
        }),
        anchoring: Object.freeze({
          status: "accepted-step-readback",
          method: "none",
          downstreamPressureOffsetMmHg: 0,
          volumeResidualMl: null,
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
            "persistent-fixed-tone-preload-reduction-chain-with-complete-beat-period1-settlement",
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
      scenarioIds: Object.freeze(["scenario/baseline", "scenario/comparison"]),
      activeScenarioId: "scenario/baseline",
      pendingControlInstanceId: null,
      pendingAnalysisKeys: Object.freeze([]),
      committedControlValues: Object.freeze({}),
      analysisByKey: Object.freeze({}),
      analysisHistoryByKey: Object.freeze({}),
      analysisErrorByKey: Object.freeze({}),
      controlErrorByInstanceId: Object.freeze({}),
      error: null,
      playbackRate: Object.freeze({
        playbackRate: 0.5,
        maximumRate: null,
        calibrating: true,
        userSelected: false,
        performanceLimited: false,
      }),
      ...stateOverrides,
    }),
    sampleStore,
    play: NOOP,
    pause: async () => undefined,
    setPlaybackRate: NOOP,
    selectScenario: NOOP,
    requestAnalysis: async () => undefined,
    applyControl: async () => undefined,
  });
}

describe("Article Reader V3 experiment anchor", () => {
  it("selects only graph and output-card histories for one Placement", () => {
    const snapshot = snapshotV3();
    const selectedSnapshot: ExperimentSnapshotV2 = {
      ...snapshot,
      content: {
        ...snapshot.content,
        surface: {
          ...snapshot.content.surface,
          graphPanes: [
            {
              paneId: "pane/sweep",
              role: "graph",
              label: "Pressure",
              order: 0,
              priority: 10,
              graphId: "graph/sweep",
              scenarioScope: { mode: "visible-scenarios" },
              excludedTraces: [],
              windowSec: 2,
              series: [
                {
                  seriesId: "series/pressure",
                  label: "Pressure",
                  order: 0,
                },
              ],
            },
          ],
          outputPanes: [],
          controlPanes: [],
          note: { text: "" },
        },
      },
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
          outputId: "output/co",
          kind: "metric",
          unit: "L/min",
          shape: "scalar",
          scope: "instant",
          dependencies: [],
        },
        {
          outputId: "output/vector",
          kind: "metric",
          unit: "1",
          shape: "vector",
          scope: "instant",
          dependencies: [],
        },
      ],
      graphCatalog: [
        {
          graphId: "graph/sweep",
          renderer: "sweep",
          defaultSeriesIds: ["series/pressure"],
          seriesCatalog: [
            {
              kind: "scalar",
              seriesId: "series/pressure",
              outputId: "output/pressure",
            },
          ],
        },
      ],
    };
    const briefing: ExperimentPlacementBriefingV2 = {
      ...briefingV3(),
      graphs: [{ paneId: "pane/sweep", order: 0, emphasis: "primary" }],
      outputs: [
        {
          sourcePaneId: "pane/outputs",
          outputId: "output/co",
          scenarioId: "scenario/comparison",
          label: "CO",
          order: 0,
        },
        {
          sourcePaneId: "pane/outputs",
          outputId: "output/vector",
          scenarioId: "scenario/comparison",
          label: "Vector",
          order: 1,
        },
      ],
    };

    expect(
      [
        ...articleReaderPresentationOutputSelectionV3(
          contract,
          selectedSnapshot,
          briefing,
        ),
      ].sort(),
    ).toEqual(["output/co", "output/pressure"]);
  });

  it("separates in-place Peek maximization from Experiment Session navigation", () => {
    const splitHtml = renderToStaticMarkup(
      <ArticleReaderExperimentPeekPanelV3
        maximized={false}
        title="Hemodynamic comparison"
        onClose={NOOP}
        onOpenExperimentSession={NOOP}
        onToggleMaximized={NOOP}
      >
        <p>Live detail</p>
      </ArticleReaderExperimentPeekPanelV3>,
    );
    const maximizedHtml = renderToStaticMarkup(
      <ArticleReaderExperimentPeekPanelV3
        maximized
        title="Hemodynamic comparison"
        onClose={NOOP}
        onOpenExperimentSession={NOOP}
        onToggleMaximized={NOOP}
        onTitleCommit={NOOP}
      >
        <p>Live detail</p>
      </ArticleReaderExperimentPeekPanelV3>,
    );

    expect(splitHtml).toContain('data-peek-maximized="false"');
    expect(splitHtml).toContain('aria-pressed="false"');
    expect(splitHtml).toContain("シミュレーションを詳しく開く");
    expect(splitHtml).toContain("シミュレーションを画面いっぱいに表示");
    expect(maximizedHtml).toContain('data-peek-maximized="true"');
    expect(maximizedHtml).toContain('aria-pressed="true"');
    expect(maximizedHtml).toContain("記事との分割表示に戻す");
    expect(maximizedHtml).toContain("ExperimentSessionでBriefingを編集");
  });

  it("keeps Peek resizing bounded while tracking the divider one-to-one", () => {
    expect(articleReaderPeekFractionForPointerV3(100, 1_000, 600)).toBe(0.5);
    expect(articleReaderPeekFractionForPointerV3(100, 1_000, -500)).toBe(0.64);
    expect(articleReaderPeekFractionForPointerV3(100, 1_000, 1_500)).toBe(0.3);
    expect(clampArticleReaderPeekFractionV3(Number.NaN)).toBe(0.46);
  });

  it("resolves one sealed graph presentation for every Reader extent", () => {
    const snapshot = snapshotV3();
    const pane = snapshot.content.surface.graphPanes[0]!;
    const resolved = resolveArticleReaderGraphPresentationV3(snapshot, {
      paneId: pane.paneId,
      order: 0,
      emphasis: "primary",
      overrides: {
        label: "Reader-facing return",
        legend: "hidden",
        historyDepth: 0,
        windowSec: 4,
        series: [{ seriesId: "series/custom", label: "Custom", order: 0 }],
      },
    });

    expect(resolved).toEqual({
      pane,
      label: "Reader-facing return",
      legend: "hidden",
      historyDepth: 0,
      windowSec: 4,
      series: [{ seriesId: "series/custom", label: "Custom", order: 0 }],
    });
    expect(resolved?.pane.structuralSide).toBe("right");
  });

  it("clears only the Placement that actually left the Reader center band", () => {
    expect(
      articleReaderPlacementAfterCenterExitV3("placement/a", "placement/a"),
    ).toBeNull();
    expect(
      articleReaderPlacementAfterCenterExitV3("placement/b", "placement/a"),
    ).toBe("placement/b");
  });

  it("treats history depth zero as no previous structural states", () => {
    const history = ["oldest", "older", "newest"];
    expect(articleReaderBoundedHistoryV3(history, 0)).toEqual([]);
    expect(articleReaderBoundedHistoryV3(history, 1)).toEqual(["newest"]);
    expect(articleReaderBoundedHistoryV3(history, 2)).toEqual([
      "older",
      "newest",
    ]);
  });

  it("derives sweep units from the selected series rather than hidden catalog entries", () => {
    const graph = {
      graphId: "graph/mixed",
      renderer: "sweep" as const,
      defaultSeriesIds: ["series/pressure"],
      seriesCatalog: [
        {
          kind: "scalar" as const,
          seriesId: "series/pressure",
          outputId: "output/pressure",
        },
        {
          kind: "scalar" as const,
          seriesId: "series/flow",
          outputId: "output/flow",
        },
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
    expect(
      commonGraphUnitV3(
        contract,
        graph.seriesCatalog.map(({ outputId }) => outputId),
      ),
    ).toBeUndefined();
  });

  it("renders a borderless inflow anchor without a second model link", () => {
    const html = renderExperimentV3({
      snapshot: snapshotV3(),
      contract: contractV3(),
    });
    const root = html.match(/^<section[^>]+>/)?.[0];

    expect(root).toContain('data-reader-placement-id="placement/reader"');
    expect(root).toContain('id="placement-placement/reader"');
    expect(root).not.toMatch(/\bborder(?:-|\b)/);
    expect(root).not.toMatch(/\bbg-/);
    expect(html).not.toContain("Live experiment");
    expect(html).not.toContain("MW V3");
    expect(html).toMatch(/<button type="button"[^>]+aria-label="[^"]+"/);
    expect(html.match(/<button type="button"/g)?.length).toBe(1);
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

  it("keeps model resolution quiet while the simulation is still loading", () => {
    const html = renderExperimentV3({
      snapshot: snapshotV3(),
      contractAvailability: "loading",
    });

    expect(html).toContain('data-reader-model-loading="true"');
    expect(html).toContain("シミュレーションを準備しています。");
    expect(html).not.toContain('data-reader-model-unavailable="true"');
    expect(html).not.toContain('<button type="button"');
  });

  it("admits one selected graph to the inline live structure", () => {
    const html = renderExperimentV3({
      snapshot: snapshotV3(),
      contract: contractV3(),
      live: true,
    });

    expect(html).toContain('data-reader-placement-live="true"');
    expect(html).toContain('<figure class="min-w-0 rounded-xl bg-wb-canvas');
    expect(html).toContain('data-experiment-graph-presentation="article"');
    expect(html).not.toContain("article-reader-experiment-drawer-v3");
    expect(html).not.toContain("min-w-0 px-4 pb-10");
  });

  it("overlays every visible Scenario in one structural comparison canvas", () => {
    const snapshot = snapshotV3();
    const scenarios = snapshot.content.scenarios.slice(0, 2);
    const analysisByKey = Object.fromEntries(
      scenarios.map((scenario) => [
        articleReaderAnalysisKeyV3(
          scenario.scenarioId,
          MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
        ),
        structuralAnalysisV3(scenario.scenarioId),
      ]),
    );
    const runtime = readerRuntimeStubV3({ analysisByKey });
    const graph = contractV3().graphCatalog[0]!;
    if (graph.renderer !== "structural-return") {
      throw new Error("expected structural graph");
    }
    const pane = snapshot.content.surface.graphPanes[0]!;

    const html = renderToStaticMarkup(
      <ArticleReaderStructuralReturnGraphV3
        authoredScenarios={snapshot.content.scenarios}
        graph={graph}
        historyDepth={1}
        pane={pane}
        runtime={runtime}
        surface={snapshot.content.surface}
        structuralSide={pane.structuralSide!}
        visibleScenarios={scenarios}
      />,
    );

    expect(
      html.match(
        /data-chart-kind="guyton-starling-structural-orientation-v3"/g,
      ),
    ).toHaveLength(1);
    expect(html).toContain('data-scenario-count="2"');
    expect(html).toContain('data-chart-legend="scenario-only"');
    expect(html).toContain(
      'data-reader-structural-scenario-id="scenario/baseline"',
    );
    expect(html).toContain(
      'data-reader-structural-scenario-id="scenario/comparison"',
    );
    expect(html).toContain("Baseline");
    expect(html).toContain("Comparison");
    expect(html).not.toContain("Pmpf orientation");
    expect(html).not.toContain("Refresh analysis");
    expect(html).not.toContain("Open this experiment to start");
  });

  it("omits the structural legend when only one Scenario is visible", () => {
    const snapshot = snapshotV3();
    const scenario = snapshot.content.scenarios[0]!;
    const graph = contractV3().graphCatalog[0]!;
    if (graph.renderer !== "structural-return") {
      throw new Error("expected structural graph");
    }
    const runtime = readerRuntimeStubV3({
      analysisByKey: {
        [articleReaderAnalysisKeyV3(
          scenario.scenarioId,
          MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
        )]: structuralAnalysisV3(scenario.scenarioId),
      },
    });
    const html = renderToStaticMarkup(
      <ArticleReaderStructuralReturnGraphV3
        authoredScenarios={snapshot.content.scenarios}
        graph={graph}
        historyDepth={1}
        pane={snapshot.content.surface.graphPanes[0]!}
        runtime={runtime}
        surface={snapshot.content.surface}
        structuralSide="right"
        visibleScenarios={[scenario]}
      />,
    );

    expect(html).toContain('data-scenario-count="1"');
    expect(html).not.toContain('data-chart-legend="scenario-only"');
  });

  it("keeps the last complete structural curve visible while its Scenario recalculates", () => {
    const snapshot = snapshotV3();
    const scenario = snapshot.content.scenarios[0]!;
    const graph = contractV3().graphCatalog[0]!;
    if (graph.renderer !== "structural-return") {
      throw new Error("expected structural graph");
    }
    const key = articleReaderAnalysisKeyV3(
      scenario.scenarioId,
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
    );
    const runtime = readerRuntimeStubV3({
      pendingAnalysisKeys: [key],
      analysisHistoryByKey: {
        [key]: [structuralAnalysisV3(scenario.scenarioId)],
      },
    });
    const html = renderToStaticMarkup(
      <ArticleReaderStructuralReturnGraphV3
        authoredScenarios={snapshot.content.scenarios}
        graph={graph}
        historyDepth={0}
        pane={snapshot.content.surface.graphPanes[0]!}
        runtime={runtime}
        surface={snapshot.content.surface}
        structuralSide="right"
        visibleScenarios={[scenario]}
      />,
    );

    expect(html).toContain(
      'data-chart-kind="guyton-starling-structural-orientation-v3"',
    );
    expect(html).toContain('data-pending-scenario-count="1"');
    expect(html).toContain('data-starling-pending="true"');
    expect(html).toContain("再計算中");
  });

  it("keeps Reader outputs vertical on the mobile base breakpoint", () => {
    const store = new WorkbenchScenarioPresentationSampleStoreV3();
    const briefing: ExperimentPlacementBriefingV2 = {
      ...briefingV3(),
      outputs: [
        {
          sourcePaneId: "pane/outputs",
          outputId: "output/co",
          scenarioId: "scenario/comparison",
          label: "CO",
          order: 0,
        },
      ],
    };
    const contract: ModelContractV2 = {
      ...contractV3(),
      outputCatalog: [
        {
          outputId: "output/co",
          kind: "metric",
          unit: "L/min",
          shape: "scalar",
          scope: "instant",
          dependencies: [],
        },
      ],
    };
    const html = renderToStaticMarkup(
      <ArticleReaderOutputsV3
        briefing={briefing}
        contract={contract}
        sampleStore={store}
      />,
    );

    expect(html).toContain("grid article-output-grid");
    expect(html).toContain('data-experiment-output-presentation="article"');
    expect(html).toContain("workbench-output-item");
    expect(html).toContain("gap-x-2 gap-y-2");
  });

  it("requests the shared settled relation analysis for output-only PVA briefings", () => {
    const briefing: ExperimentPlacementBriefingV2 = {
      ...briefingV3(),
      graphs: [],
      outputs: [
        {
          sourcePaneId: "pane/outputs",
          outputId:
            MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1.pressureVolumeAreaMilliJoule,
          scenarioId: "scenario/comparison",
          label: "PVA",
          order: 0,
        },
      ],
    };

    expect(
      readerStructuralAnalysisRequestsV3(briefing, snapshotV3(), contractV3()),
    ).toEqual([
      {
        analysisId:
          MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
        historyDepth: 0,
      },
    ]);
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
      changeSemantics: "accepted-state-warm-start",
    };
    const briefing: ExperimentPlacementBriefingV2 = {
      ...briefingV3(),
      controls: [
        {
          sourcePaneId: "pane/controls",
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
        },
      ],
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
    expect(html).toContain("workbench-control-row");
    expect(html).toContain("workbench-control-segments");
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
    expect(html).toContain("article-reader-peek-anchor");
    expect(html).toContain('data-reader-peek-active="false"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain(
      'aria-controls="article-reader-experiment-companion-v3"',
    );
    expect(html).toContain("Reader experiment");
    expect(html).not.toContain("Live experiment");
    expect(html).not.toContain("MW V3");
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
    const snapshot = snapshotV3();
    const html = renderExperimentV3({
      block: {
        ...block,
        placement: {
          ...block.placement,
          briefing: {
            ...block.placement.briefing,
            graphs: [
              {
                paneId: "pane/missing",
                order: 0,
                emphasis: "primary",
              },
            ],
          },
        },
      },
      snapshot,
      contract: contractV3(),
      live: true,
    });

    expect(html).toContain('role="alert"');
    expect(html).toContain('data-reader-placement-id="placement/reader"');
    expect(html).not.toContain("data-reader-placement-live");
    expect(html).not.toContain("<figure");
  });
});
