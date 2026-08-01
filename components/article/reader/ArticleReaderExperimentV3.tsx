import React from "react";
import { createPortal } from "react-dom";
import {
  ChevronRight,
  CircleAlert,
  Pause,
  Play,
  RefreshCw,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import {
  resolveArticlePlacementBriefingV3,
} from "@/components/article/ArticleEditorStateV3";
import {
  PressureVolumeLoopCanvasV3,
  SweepingWaveformCanvasV3,
  GuytonStarlingOrientationCanvasV3,
  structuralReturnOrientationFromPayloadV3,
  useWorkbenchScenarioExactOrbitSamplesV3,
  useWorkbenchScenarioOrbitHistoryV3,
  useWorkbenchScenarioPresentationSamplesV3,
} from "@/components/workbench/v3";
import type {
  StudioArticleExperimentBlockV2,
} from "@/studio/contracts/v2/article";
import type {
  ExperimentPlacementBriefingControlV2,
  ExperimentPlacementBriefingGraphV2,
  ExperimentPlacementBriefingV2,
  ExperimentScenarioV2,
  ExperimentSnapshotV2,
  ExperimentSurfaceGraphPaneV2,
} from "@/studio/contracts/v2/content";
import type {
  ControlDefinitionV2,
  ModelContractV2,
  StructuralReturnGraphDefinitionV2,
  SweepGraphDefinitionV2,
} from "@/studio/contracts/v2/model";
import { studioNumericControlValueIssueV2 } from
  "@/studio/contracts/v2/control";
import {
  mainWireIntegratedStudioControlValueFromFixtureV3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioFixtureControlProjectionV3";
import {
  articleReaderAnalysisKeyV3,
  type ArticleReaderStructuralAnalysisRequestV3,
} from "./ArticleReaderLiveRuntimeV3";
import { useArticleReaderLiveRuntimeV3 } from
  "./useArticleReaderLiveRuntimeV3";

export type ArticleReaderExperimentV3Props = Readonly<{
  block: StudioArticleExperimentBlockV2;
  snapshot: ExperimentSnapshotV2 | null;
  contract: ModelContractV2 | null;
  live: boolean;
  expanded: boolean;
  forceInline?: boolean;
  snapshotHref?: string;
  onActivate(): void;
  onDeactivate(): void;
  onExpand(): void;
  onClose(): void;
}>;

type ArticleReaderPresentationV3 = "inflow" | "peek" | "fullscreen";

export function articleReaderPlacementAfterCenterExitV3(
  activePlacementId: string | null,
  exitedPlacementId: string,
): string | null {
  return activePlacementId === exitedPlacementId ? null : activePlacementId;
}

/**
 * Borderless article anchor. The live owner is mounted only for the single
 * Placement selected by the Reader page; within that Placement every visible
 * Scenario remains live in its own persistent Worker lane.
 */
export function ArticleReaderExperimentV3({
  block,
  snapshot,
  contract,
  live,
  expanded,
  forceInline = false,
  snapshotHref,
  onActivate,
  onDeactivate,
  onExpand,
  onClose,
}: ArticleReaderExperimentV3Props) {
  const { t } = useTranslation();
  const rootRef = React.useRef<HTMLElement>(null);
  const onActivateRef = React.useRef(onActivate);
  const onDeactivateRef = React.useRef(onDeactivate);

  React.useEffect(() => {
    onActivateRef.current = onActivate;
    onDeactivateRef.current = onDeactivate;
  }, [onActivate, onDeactivate]);

  React.useEffect(() => {
    const element = rootRef.current;
    if (element === null) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      onActivateRef.current();
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        onActivateRef.current();
      } else {
        onDeactivateRef.current();
      }
    }, {
      rootMargin: "-32% 0px -42% 0px",
      threshold: 0,
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (snapshot === null) {
    return (
      <section
        ref={rootRef}
        id={`placement-${block.placement.placementId}`}
        className="my-12"
        data-reader-placement-id={block.placement.placementId}
      >
        <p className="flex items-center gap-2 text-sm text-wb-danger" role="alert">
          <CircleAlert className="h-4 w-4" aria-hidden="true" />
          {t("articleReader.unavailableSnapshot")}
        </p>
      </section>
    );
  }

  let briefing: ExperimentPlacementBriefingV2;
  try {
    briefing = resolveArticlePlacementBriefingV3(block.placement, snapshot);
  } catch {
    return (
      <section
        ref={rootRef}
        id={`placement-${block.placement.placementId}`}
        className="my-12"
        data-reader-placement-id={block.placement.placementId}
      >
        <p className="flex items-center gap-2 text-sm text-wb-danger" role="alert">
          <CircleAlert className="h-4 w-4" aria-hidden="true" />
          {t("articleReader.invalidBriefing")}
        </p>
      </section>
    );
  }
  const presentation = readerPresentationV3(briefing);
  const modelShortLabel = readerModelShortLabelV3(
    contract,
    snapshot.content.modelId,
    t("articleReader.modelMainWireV3"),
    t("articleReader.modelExact"),
  );

  return (
    <section
      ref={rootRef}
      id={`placement-${block.placement.placementId}`}
      className="my-12 scroll-mt-24"
      data-reader-placement-id={block.placement.placementId}
      data-reader-placement-live={live}
    >
      <header className="mb-3 flex items-center gap-3">
        {contract === null ? (
          <span className="min-w-0 truncate text-xs font-semibold text-wb-muted">
            {t("articleReader.experiment")}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              onActivate();
              onExpand();
            }}
            className="group inline-flex min-w-0 items-center gap-1.5 text-left text-xs font-semibold text-wb-muted transition-[color,transform] duration-150 hover:text-wb-text active:scale-[0.99] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
            aria-label={t("articleReader.openExperiment")}
          >
            <span className="truncate">{t("articleReader.experiment")}</span>
            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        )}
        {snapshotHref === undefined ? (
          <span
            className="shrink-0 text-[9px] font-semibold text-wb-subtle"
            title={snapshot.content.modelId}
          >
            {modelShortLabel}
          </span>
        ) : (
          <Link
            to={snapshotHref}
            className="shrink-0 rounded text-[9px] font-semibold text-wb-subtle transition-colors hover:text-wb-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
            title={`${t("articleReader.openSnapshot")} · ${snapshot.content.modelId}`}
            aria-label={t("articleReader.openSnapshot")}
          >
            {modelShortLabel}
          </Link>
        )}
      </header>

      {live && contract !== null ? (
        <ArticleReaderLiveOwnerV3
          briefing={briefing}
          contract={contract}
          expanded={expanded}
          forceInline={forceInline}
          presentation={presentation}
          snapshot={snapshot}
          onExpand={onExpand}
          onClose={onClose}
        />
      ) : (
        <ArticleReaderStaticExperimentV3
          briefing={briefing}
          interactive={contract !== null}
          presentation={presentation}
          snapshot={snapshot}
          onActivate={onActivate}
          onOpen={() => {
            onActivate();
            onExpand();
          }}
        />
      )}

      {block.placement.caption !== null && block.placement.caption.trim().length > 0 && (
        <p className="mt-3 text-xs leading-6 text-wb-muted">
          {block.placement.caption}
        </p>
      )}
    </section>
  );
}

function ArticleReaderStaticExperimentV3({
  briefing,
  interactive,
  presentation,
  snapshot,
  onActivate,
  onOpen,
}: Readonly<{
  briefing: ExperimentPlacementBriefingV2;
  interactive: boolean;
  presentation: ArticleReaderPresentationV3;
  snapshot: ExperimentSnapshotV2;
  onActivate(): void;
  onOpen(): void;
}>) {
  const { t } = useTranslation();
  const graphs = [...briefing.graphs].sort(compareOrderV3);
  if (!interactive) {
    const graphLabels = graphs.flatMap((graph) => {
      const pane = graphPaneForBriefingV3(snapshot, graph);
      return pane === null ? [] : [graph.overrides?.label ?? pane.label];
    });
    return (
      <div className="py-5" data-reader-model-unavailable="true">
        <p className="text-sm font-semibold tracking-tight text-wb-text">
          {graphLabels.join(" · ") || t("articleReader.experiment")}
        </p>
        <p className="mt-2 text-xs leading-5 text-wb-subtle">
          {t("articleReader.unavailableModel")}
        </p>
      </div>
    );
  }
  if (presentation !== "inflow") {
    return (
      <ArticleReaderPeekAnchorV3
        briefing={briefing}
        presentation={presentation}
        snapshot={snapshot}
        status={t("articleReader.noLiveData")}
        onOpen={onOpen}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={onActivate}
      className="block w-full rounded-lg py-1 text-left transition-[background-color,transform] duration-150 hover:bg-wb-hover/40 active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
    >
      {graphs.length === 0 ? (
        <span className="block py-8 text-sm text-wb-subtle">
          {t("articleReader.noGraphs")}
        </span>
      ) : (
        <span className={`grid gap-7 ${graphs.length > 1 ? "md:grid-cols-2" : ""}`}>
          {graphs.slice(0, 4).map((graph) => {
            const pane = graphPaneForBriefingV3(snapshot, graph);
            if (pane === null) return null;
            return (
              <span key={graph.paneId} className={graph.emphasis === "primary" && graphs.length > 2 ? "md:col-span-2" : ""}>
                <span className="block text-sm font-semibold tracking-tight text-wb-text">
                  {graph.overrides?.label ?? pane.label}
                </span>
                <span className="mt-4 flex min-h-32 items-center justify-center bg-[linear-gradient(to_bottom,transparent_31%,var(--wb-grid)_32%,transparent_33%,transparent_65%,var(--wb-grid)_66%,transparent_67%)] px-4">
                  <span className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                    {briefingGraphSeriesV3(pane, graph).map((series) => (
                      <span key={series.seriesId} className="inline-flex items-center gap-1.5 text-[10px] text-wb-muted">
                        <span className="h-0.5 w-5 rounded-full" style={{ backgroundColor: series.colorHex }} aria-hidden="true" />
                        {series.label}
                      </span>
                    ))}
                  </span>
                </span>
              </span>
            );
          })}
        </span>
      )}
      <span className="mt-2 block text-[10px] text-wb-subtle">
        {t("articleReader.noLiveData")}
      </span>
    </button>
  );
}

function ArticleReaderLiveOwnerV3({
  briefing,
  contract,
  expanded,
  forceInline,
  presentation,
  snapshot,
  onExpand,
  onClose,
}: Readonly<{
  briefing: ExperimentPlacementBriefingV2;
  contract: ModelContractV2;
  expanded: boolean;
  forceInline: boolean;
  presentation: ArticleReaderPresentationV3;
  snapshot: ExperimentSnapshotV2;
  onExpand(): void;
  onClose(): void;
}>) {
  const { t } = useTranslation();
  const structuralAnalyses = readerStructuralAnalysisRequestsV3(
    briefing,
    snapshot,
    contract,
  );
  const runtime = useArticleReaderLiveRuntimeV3(
    snapshot,
    briefing.scenarioScope.initialFocusScenarioId,
    briefing.scenarioScope.visibleScenarioIds,
    structuralAnalyses,
  );
  const detail = (
    <ArticleReaderLiveDetailV3
      briefing={briefing}
      contract={contract}
      inline={presentation === "inflow" && !expanded}
      runtime={runtime}
      snapshot={snapshot}
    />
  );

  React.useEffect(() => {
    if (!expanded) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded, onClose]);

  if (!expanded) {
    if (forceInline || presentation === "inflow") return detail;
    return (
      <ArticleReaderPeekAnchorV3
        briefing={briefing}
        presentation={presentation}
        snapshot={snapshot}
        status={runtime.state.status === "failed"
          ? t("articleReader.failed")
          : runtime.state.status === "playing"
            ? t("articleReader.live")
            : runtime.state.status === "paused"
              ? t("articleReader.paused")
              : t("articleReader.starting")}
        onOpen={onExpand}
      />
    );
  }
  if (typeof document === "undefined") return null;
  return createPortal(
    <ArticleReaderExperimentDrawerV3
      fullscreen={presentation === "fullscreen"}
      onClose={onClose}
    >
      {detail}
    </ArticleReaderExperimentDrawerV3>,
    document.body,
  );
}

function ArticleReaderPeekAnchorV3({
  briefing,
  presentation,
  snapshot,
  status,
  onOpen,
}: Readonly<{
  briefing: ExperimentPlacementBriefingV2;
  presentation: Exclude<ArticleReaderPresentationV3, "inflow">;
  snapshot: ExperimentSnapshotV2;
  status: string;
  onOpen(): void;
}>) {
  const { t } = useTranslation();
  const graphLabels = [...briefing.graphs]
    .sort(compareOrderV3)
    .flatMap((graph) => {
      const pane = graphPaneForBriefingV3(snapshot, graph);
      return pane === null ? [] : [graph.overrides?.label ?? pane.label];
    });
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t("articleReader.openExperiment")}
      className="group flex w-full items-center gap-4 rounded-lg px-1 py-5 text-left transition-[color,background-color,transform] duration-150 hover:bg-wb-hover/40 active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
      data-reader-presentation={presentation}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-semibold tracking-tight text-wb-text">
          {graphLabels.join(" · ") || t("articleReader.experiment")}
        </span>
        <span className="mt-1 block text-[11px] text-wb-subtle">
          {status}
        </span>
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-wb-subtle transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-wb-text"
        aria-hidden="true"
      />
    </button>
  );
}

type ArticleReaderRuntimeHookV3 = ReturnType<
  typeof useArticleReaderLiveRuntimeV3
>;

function ArticleReaderLiveDetailV3({
  briefing,
  contract,
  inline,
  runtime,
  snapshot,
}: Readonly<{
  briefing: ExperimentPlacementBriefingV2;
  contract: ModelContractV2;
  inline: boolean;
  runtime: ArticleReaderRuntimeHookV3;
  snapshot: ExperimentSnapshotV2;
}>) {
  const { t } = useTranslation();
  const visibleScenarios = snapshot.content.scenarios.filter(({ scenarioId }) =>
    briefing.scenarioScope.visibleScenarioIds.includes(scenarioId));
  const playing = runtime.state.status === "playing";
  const unavailable = runtime.state.status === "idle"
    || runtime.state.status === "starting";
  const scenarioSelectionDisabled = unavailable
    || runtime.state.status === "applying-control"
    || runtime.state.status === "requesting-analysis"
    || runtime.state.status === "failed"
    || runtime.state.status === "disposed";

  return (
    <div className={inline ? "min-w-0" : "min-w-0 px-4 pb-10 sm:px-6"}>
      <div className={`flex flex-wrap items-center gap-2 ${inline ? "mb-3" : "mb-5"}`}>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {visibleScenarios.map((scenario) => (
            <button
              key={scenario.scenarioId}
              type="button"
              disabled={scenarioSelectionDisabled}
              onClick={() => runtime.selectScenario(scenario.scenarioId)}
              aria-pressed={runtime.state.activeScenarioId === scenario.scenarioId}
              className={`min-h-8 rounded-lg px-2.5 text-[11px] font-medium transition-[color,background-color,transform] duration-150 active:scale-[0.97] disabled:cursor-wait disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent ${
                runtime.state.activeScenarioId === scenario.scenarioId
                  ? "bg-wb-active text-wb-text"
                  : "text-wb-muted hover:bg-wb-hover hover:text-wb-text"
              }`}
            >
              {scenario.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-wb-subtle" role="status">
          {runtime.state.status === "failed"
            ? t("articleReader.failed")
            : unavailable
              ? t("articleReader.starting")
              : runtime.state.status === "requesting-analysis"
                ? t("workbench.live.analysisRunning")
              : playing
                ? t("articleReader.live")
                : t("articleReader.paused")}
        </span>
        <button
          type="button"
          disabled={unavailable
            || runtime.state.status === "failed"
            || runtime.state.status === "applying-control"
            || runtime.state.status === "requesting-analysis"}
          onClick={() => playing ? void runtime.pause() : runtime.play()}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          aria-label={playing ? t("articleReader.pause") : t("articleReader.play")}
          title={playing ? t("articleReader.pause") : t("articleReader.play")}
        >
          {playing
            ? <Pause className="h-3.5 w-3.5" aria-hidden="true" />
            : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
        </button>
      </div>

      {runtime.state.status === "failed" ? (
        <p className="my-8 text-sm text-wb-danger" role="alert">
          {runtime.state.error?.message ?? t("articleReader.failed")}
        </p>
      ) : (
        <>
          {briefing.controls.length > 0 && (
            <ArticleReaderControlsV3
              briefing={briefing}
              contract={contract}
              runtime={runtime}
              snapshot={snapshot}
            />
          )}

          <div className={`min-w-0 gap-9 ${
            !inline && briefing.graphs.length > 1
              ? "-mx-4 flex snap-x snap-mandatory overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 xl:mx-0 xl:grid xl:grid-cols-2 xl:overflow-visible xl:px-0"
              : "grid"
          }`}>
            {[...briefing.graphs].sort(compareOrderV3).map((graph) => (
              <div
                key={graph.paneId}
                className={!inline && briefing.graphs.length > 1
                  ? "w-[88vw] max-w-[720px] shrink-0 snap-center xl:w-auto xl:max-w-none"
                  : "min-w-0"}
              >
                <ArticleReaderLiveGraphV3
                  activeScenarioId={runtime.state.activeScenarioId}
                  briefing={graph}
                  contract={contract}
                  playbackRunning={playing}
                  runtime={runtime}
                  snapshot={snapshot}
                  visibleScenarioIds={briefing.scenarioScope.visibleScenarioIds}
                />
              </div>
            ))}
          </div>

          {briefing.graphs.length === 0 && (
            <p className="py-12 text-sm text-wb-subtle">{t("articleReader.noGraphs")}</p>
          )}

          {briefing.outputs.length > 0 && (
            <ArticleReaderOutputsV3
              briefing={briefing}
              contract={contract}
              scenarioId={runtime.state.activeScenarioId}
              sampleStore={runtime.sampleStore}
            />
          )}
        </>
      )}
    </div>
  );
}

function ArticleReaderLiveGraphV3({
  activeScenarioId,
  briefing,
  contract,
  playbackRunning,
  runtime,
  snapshot,
  visibleScenarioIds,
}: Readonly<{
  activeScenarioId: string;
  briefing: ExperimentPlacementBriefingGraphV2;
  contract: ModelContractV2;
  playbackRunning: boolean;
  runtime: ArticleReaderRuntimeHookV3;
  snapshot: ExperimentSnapshotV2;
  visibleScenarioIds: readonly string[];
}>) {
  const sampleStore = runtime.sampleStore;
  const samples = useWorkbenchScenarioPresentationSamplesV3(sampleStore);
  const exactOrbits = useWorkbenchScenarioExactOrbitSamplesV3(sampleStore);
  const orbitHistory = useWorkbenchScenarioOrbitHistoryV3(sampleStore);
  const pane = graphPaneForBriefingV3(snapshot, briefing);
  if (pane === null) return null;
  const graph = contract.graphCatalog.find(({ graphId }) => graphId === pane.graphId);
  if (graph === undefined) return null;
  const series = briefingGraphSeriesV3(pane, briefing);
  const visibleScenarios = snapshot.content.scenarios.filter(({ scenarioId }) =>
    visibleScenarioIds.includes(scenarioId));

  if (graph.renderer === "structural-return") {
    return (
      <figure
        className="min-w-0"
        data-reader-legend={briefing.overrides?.legend ?? "auto"}
      >
        <figcaption className="mb-2 text-sm font-semibold tracking-tight">
          {briefing.overrides?.label ?? pane.label}
        </figcaption>
        <ArticleReaderStructuralReturnGraphV3
          graph={graph}
          historyDepth={briefing.overrides?.historyDepth
            ?? pane.historyDepth
            ?? 1}
          runtime={runtime}
          visibleScenarios={visibleScenarios}
        />
      </figure>
    );
  }

  return (
    <figure
      className="min-w-0"
      data-reader-legend={briefing.overrides?.legend ?? "auto"}
    >
      <figcaption className="mb-2 text-sm font-semibold tracking-tight">
        {briefing.overrides?.label ?? pane.label}
      </figcaption>
      {graph.renderer === "pressure-volume" ? (
        <div className="h-[clamp(17rem,43vw,31rem)] min-w-0">
          <PressureVolumeLoopCanvasV3
            traces={visibleScenarios.flatMap((scenario, scenarioStyleIndex) => {
              const scenarioSamples = exactOrbits[scenario.scenarioId] ?? [];
              if (scenarioSamples.length === 0) return [];
              return series.flatMap((selectedSeries) => {
                const binding = graph.seriesCatalog.find(({ seriesId }) =>
                  seriesId === selectedSeries.seriesId);
                if (binding === undefined) return [];
                const historyDepth = briefing.overrides?.historyDepth
                  ?? pane.historyDepth
                  ?? 1;
                return [{
                  scenarioId: scenario.scenarioId,
                  scenarioLabel: scenario.label,
                  scenarioStatus: playbackRunning ? "Live" : "Paused",
                  scenarioStyleIndex,
                  samples: scenarioSamples,
                  historySampleSets: articleReaderBoundedHistoryV3(
                    orbitHistory[scenario.scenarioId] ?? [],
                    historyDepth,
                  )
                    .map((entry) => entry.samples),
                  volumeOutputId: binding.volumeOutputId,
                  pressureOutputId: binding.pressureOutputId,
                  pressureBasis: binding.pressureBasis,
                  cyclePhaseOutputId: binding.cyclePhaseOutputId,
                  chamberId: binding.seriesId,
                  chamberLabel: selectedSeries.label,
                  chamberColor: selectedSeries.colorHex,
                  showSingleBeatOrientationGuides:
                    scenario.scenarioId === activeScenarioId
                    && binding.guideMode === "lv-single-beat-orientation",
                }];
              });
            })}
          />
        </div>
      ) : graph.renderer === "sweep" ? (
        <div className="h-[clamp(16rem,39vw,28rem)] min-w-0">
          <SweepingWaveformCanvasV3
            activeScenarioId={activeScenarioId}
            traces={visibleScenarios.flatMap((scenario, scenarioStyleIndex) => {
              const scenarioSamples = samples[scenario.scenarioId] ?? [];
              if (scenarioSamples.length === 0) return [];
              return series.flatMap((selectedSeries) => {
                const binding = graph.seriesCatalog.find(({ seriesId }) =>
                  seriesId === selectedSeries.seriesId);
                return binding === undefined ? [] : [{
                  scenarioId: scenario.scenarioId,
                  scenarioLabel: scenario.label,
                  scenarioStatus: playbackRunning ? "Live" : "Paused",
                  scenarioStyleIndex,
                  samples: scenarioSamples,
                  outputId: binding.outputId,
                  signalLabel: selectedSeries.label,
                  signalColor: selectedSeries.colorHex,
                }];
              });
            })}
            unitLabel={commonGraphUnitV3(
              contract,
              selectedSweepOutputIdsV3(graph, series),
            )}
            windowSec={briefing.overrides?.windowSec ?? pane.windowSec ?? 2}
          />
        </div>
      ) : null}
    </figure>
  );
}

export function ArticleReaderStructuralReturnGraphV3({
  graph,
  historyDepth,
  runtime,
  visibleScenarios,
}: Readonly<{
  graph: StructuralReturnGraphDefinitionV2;
  historyDepth: number;
  runtime: ArticleReaderRuntimeHookV3;
  visibleScenarios: readonly ExperimentScenarioV2[];
}>) {
  const { t } = useTranslation();
  const scenarioIds = visibleScenarios.map(({ scenarioId }) => scenarioId);
  const analysisKeys = scenarioIds.map((scenarioId) =>
    articleReaderAnalysisKeyV3(scenarioId, graph.analysisId));
  const missingScenarioIds = scenarioIds.filter((scenarioId, index) => {
    const key = analysisKeys[index]!;
    return runtime.state.analysisByKey[key] === undefined
      && runtime.state.analysisErrorByKey[key] === undefined
      && !runtime.state.pendingAnalysisKeys.includes(key);
  });
  const canRequest = runtime.state.status === "playing"
    || runtime.state.status === "paused";
  const missingScenarioKey = JSON.stringify(missingScenarioIds);

  React.useEffect(() => {
    if (!canRequest || missingScenarioIds.length === 0) return;
    void runtime.requestAnalysis({
      analysisId: graph.analysisId,
      scenarioIds: missingScenarioIds,
    }).catch(() => {
      // The runtime publishes a per-Scenario recoverable error for the graph.
    });
  }, [
    canRequest,
    graph.analysisId,
    missingScenarioKey,
    runtime.requestAnalysis,
  ]);

  const pending = analysisKeys.some((key) =>
    runtime.state.pendingAnalysisKeys.includes(key));
  return (
    <div className="relative min-w-0">
      <div className={`grid min-w-0 gap-6 ${
        visibleScenarios.length > 1 ? "lg:grid-cols-2" : ""
      }`}>
        {visibleScenarios.map((scenario) => {
          const key = articleReaderAnalysisKeyV3(
            scenario.scenarioId,
            graph.analysisId,
          );
          const analysis = runtime.state.analysisByKey[key];
          const error = runtime.state.analysisErrorByKey[key] ?? null;
          const orientation = structuralReturnOrientationFromPayloadV3(
            analysis?.payload,
            graph.side,
          );
          const historyOrientations = articleReaderBoundedHistoryV3(
            runtime.state.analysisHistoryByKey[key] ?? [],
            historyDepth,
          ).flatMap((historical) => {
            const candidate = structuralReturnOrientationFromPayloadV3(
              historical.payload,
              graph.side,
            );
            return candidate === null ? [] : [candidate];
          });
          const scenarioPending = runtime.state.pendingAnalysisKeys.includes(key);
          return (
            <section
              key={scenario.scenarioId}
              className="min-w-0"
              data-reader-structural-scenario-id={scenario.scenarioId}
            >
              <h4 className="mb-2 text-[11px] font-medium text-wb-muted">
                {scenario.label}
              </h4>
              <div className="h-[clamp(17rem,43vw,31rem)] min-w-0">
                {orientation === null ? (
                  <div
                    className="flex h-full min-h-56 items-center justify-center px-5 text-center text-xs leading-6 text-wb-subtle"
                    role={error === null ? "status" : "alert"}
                  >
                    {scenarioPending
                      ? t("workbench.live.analysisRunning")
                      : error ?? t("workbench.live.analysisUnavailable")}
                  </div>
                ) : (
                  <GuytonStarlingOrientationCanvasV3
                    orientation={orientation}
                    historyOrientations={historyOrientations}
                  />
                )}
              </div>
              {analysis !== undefined && (
                <p
                  className="mt-1 font-mono text-[9px] text-wb-subtle"
                  data-reader-analysis-input-epoch={analysis.inputEpoch}
                >
                  {t(runtime.state.status === "paused"
                    ? "workbench.live.analysisCurrentBoundary"
                    : "workbench.live.analysisStaleBoundary", {
                    revision: analysis.sourceAcceptedRevision,
                    time: analysis.sourceAcceptedTimeSec.toFixed(3),
                  })}
                </p>
              )}
            </section>
          );
        })}
      </div>
      <button
        type="button"
        className="absolute right-1 top-0 inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[10px] font-semibold text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        disabled={!canRequest || pending}
        onClick={() => {
          void runtime.requestAnalysis({
            analysisId: graph.analysisId,
            scenarioIds,
          }).catch(() => {
            // The runtime owns the recoverable per-Scenario error state.
          });
        }}
        aria-label={t("workbench.live.refreshAnalysis")}
      >
        <RefreshCw className={`h-3 w-3 ${pending ? "animate-spin" : ""}`} />
        {t("workbench.live.refreshAnalysis")}
      </button>
    </div>
  );
}

export function ArticleReaderOutputsV3({
  briefing,
  contract,
  scenarioId,
  sampleStore,
}: Readonly<{
  briefing: ExperimentPlacementBriefingV2;
  contract: ModelContractV2;
  scenarioId: string;
  sampleStore: ArticleReaderRuntimeHookV3["sampleStore"];
}>) {
  const { t } = useTranslation();
  const samples = useWorkbenchScenarioPresentationSamplesV3(sampleStore);
  const latest = samples[scenarioId]?.at(-1);
  return (
    <section className="mt-8" aria-label={t("articleReader.outputs")}>
      <dl className="grid grid-cols-1 gap-x-7 gap-y-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {[...briefing.outputs].sort(compareOrderV3).map((output) => {
          const definition = contract.outputCatalog.find(({ outputId }) =>
            outputId === output.outputId);
          const value = latest?.values[output.outputId];
          return (
            <div key={output.outputId} className="min-w-0">
              <dt className="truncate text-[11px] font-medium text-wb-muted">{output.label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-wb-text">
                {typeof value === "number" && Number.isFinite(value)
                  ? formatReaderValueV3(value)
                  : "—"}
              </dd>
              <span className="text-[10px] text-wb-subtle">{definition?.unit ?? ""}</span>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

function ArticleReaderControlsV3({
  briefing,
  contract,
  runtime,
  snapshot,
}: Readonly<{
  briefing: ExperimentPlacementBriefingV2;
  contract: ModelContractV2;
  runtime: ArticleReaderRuntimeHookV3;
  snapshot: ExperimentSnapshotV2;
}>) {
  const { t } = useTranslation();
  return (
    <section className="mb-7" aria-label={t("articleReader.controls")}>
      <div className="grid gap-x-7 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
        {[...briefing.controls].sort(compareOrderV3).map((control) => {
          const definition = contract.controlCatalog.find(({ controlId }) =>
            controlId === control.controlId);
          if (definition === undefined) return null;
          return (
            <ArticleReaderControlV3
              key={control.controlId}
              briefing={briefing}
              control={control}
              definition={definition}
              runtime={runtime}
              snapshot={snapshot}
            />
          );
        })}
      </div>
    </section>
  );
}

export function ArticleReaderControlV3({
  briefing,
  control,
  definition,
  runtime,
  snapshot,
}: Readonly<{
  briefing: ExperimentPlacementBriefingV2;
  control: ExperimentPlacementBriefingControlV2;
  definition: ControlDefinitionV2;
  runtime: ArticleReaderRuntimeHookV3;
  snapshot: ExperimentSnapshotV2;
}>) {
  const { t } = useTranslation();
  const targetIds = controlTargetScenarioIdsV3(control, runtime.state.activeScenarioId);
  const primaryTargetId = targetIds[0]
    ?? briefing.scenarioScope.initialFocusScenarioId;
  const committedRuntimeValue = runtime.state.committedControlValues[
    primaryTargetId
  ]?.[control.controlId];
  const initialValue = committedRuntimeValue ?? readerControlInitialValueV3(
    snapshot,
    primaryTargetId,
    definition,
  );
  const [value, setValue] = React.useState(initialValue);
  const [error, setError] = React.useState<string | null>(null);
  const committedRef = React.useRef(initialValue);
  const commitInFlightRef = React.useRef(false);

  React.useEffect(() => {
    const next = committedRuntimeValue ?? readerControlInitialValueV3(
      snapshot,
      primaryTargetId,
      definition,
    );
    setValue(next);
    committedRef.current = next;
  }, [committedRuntimeValue, definition, primaryTargetId, snapshot]);

  const commit = async (next: number) => {
    if (next === committedRef.current || commitInFlightRef.current) return;
    commitInFlightRef.current = true;
    setError(null);
    try {
      await runtime.applyControl({
        controlId: control.controlId,
        scenarioIds: targetIds,
        value: next,
      });
      committedRef.current = next;
    } catch (cause) {
      setValue(committedRef.current);
      throw cause;
    } finally {
      commitInFlightRef.current = false;
    }
  };
  const pending = runtime.state.pendingControlId === control.controlId;
  const controlsDisabled = runtime.state.status === "idle"
    || runtime.state.status === "starting"
    || runtime.state.status === "applying-control"
    || runtime.state.status === "requesting-analysis"
    || runtime.state.status === "failed"
    || runtime.state.status === "disposed"
    || targetIds.length === 0;
  const targetLabels = targetIds.flatMap((scenarioId) => {
    const scenario = snapshot.content.scenarios.find((candidate) =>
      candidate.scenarioId === scenarioId);
    return scenario === undefined ? [] : [scenario.label];
  });

  return (
    <div className="min-w-0">
      <div className="flex items-baseline gap-3">
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-wb-muted">
          {control.label}
          {targetLabels.length > 0 && (
            <span className="ml-1 font-normal text-wb-subtle">
              · {targetLabels.join(", ")}
            </span>
          )}
          {targetLabels.length === 0 && control.binding.mode === "reader-focus" && (
            <span className="ml-1 font-normal text-wb-subtle">
              · {t("articleReader.noControlTarget")}
            </span>
          )}
        </span>
        <output className="font-mono text-xs font-semibold tabular-nums text-wb-text">
          {formatReaderValueV3(value)} {definition.unit}
        </output>
      </div>
      {control.presentation.kind === "slider" ? (
        <input
          type="range"
          min={definition.minimum}
          max={definition.maximum}
          step={definition.step}
          value={value}
          disabled={controlsDisabled || pending}
          onChange={(event) => setValue(Number(event.currentTarget.value))}
          onPointerUp={() => void commit(value).catch((cause) =>
            setError(readerErrorMessageV3(cause)))}
          onKeyUp={() => void commit(value).catch((cause) =>
            setError(readerErrorMessageV3(cause)))}
          onBlur={() => void commit(value).catch((cause) =>
            setError(readerErrorMessageV3(cause)))}
          className="mt-2 h-5 w-full cursor-pointer accent-wb-accent disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={control.label}
        />
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {control.presentation.options.map((option) => (
            (() => {
              const optionIssue = studioNumericControlValueIssueV2(
                option.value,
                definition,
              );
              return (
                <button
                  key={`${option.label}:${option.value}`}
                  type="button"
                  disabled={controlsDisabled || pending || optionIssue !== undefined}
                  title={optionIssue}
                  onClick={() => {
                    setValue(option.value);
                    void commit(option.value).catch((cause) =>
                      setError(readerErrorMessageV3(cause)));
                  }}
                  className={`min-h-8 rounded-lg px-2.5 text-[11px] font-medium transition-[color,background-color,transform] duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent ${
                    value === option.value
                      ? "bg-wb-active text-wb-text"
                      : "text-wb-muted hover:bg-wb-hover hover:text-wb-text"
                  }`}
                >
                  {option.label}
                </button>
              );
            })()
          ))}
        </div>
      )}
      {(runtime.state.controlErrorById[control.controlId] ?? error) !== null && (
        <p className="mt-1 text-[10px] text-wb-danger" role="alert">
          {runtime.state.controlErrorById[control.controlId] ?? error}
        </p>
      )}
    </div>
  );
}

function ArticleReaderExperimentDrawerV3({
  children,
  fullscreen,
  onClose,
}: Readonly<{
  children: React.ReactNode;
  fullscreen: boolean;
  onClose(): void;
}>) {
  const { t } = useTranslation();
  const dialogRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return undefined;
    const opener = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const readerRoot = document.querySelector<HTMLElement>(
      '[data-testid="article-reader-v3"]',
    );
    const previousOverflow = document.body.style.overflow;
    const previousInert = readerRoot?.inert ?? false;
    document.body.style.overflow = "hidden";
    if (readerRoot !== null) readerRoot.inert = true;
    dialog.querySelector<HTMLElement>("[data-reader-drawer-close]")?.focus();
    const focusable = () => [...dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )].filter((element) => !element.hidden);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const candidates = focusable();
      if (candidates.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = candidates[0]!;
      const last = candidates[candidates.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", onKeyDown);
    return () => {
      dialog.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (readerRoot !== null) readerRoot.inert = previousInert;
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <div className="fixed inset-0 z-[90]" data-testid="article-reader-experiment-drawer-v3">
      <div
        aria-hidden="true"
        className="article-reader-drawer-backdrop absolute inset-0 bg-[#03101f]/55 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="article-reader-drawer-title-v3"
        tabIndex={-1}
        className={`article-reader-drawer absolute inset-y-0 right-0 flex w-full flex-col overflow-hidden bg-wb-panel text-wb-text shadow-[-18px_0_55px_rgba(2,12,25,0.24)] ${fullscreen ? "max-w-none" : "max-w-[820px] sm:border-l sm:border-wb-line"}`}
        data-reader-presentation={fullscreen ? "fullscreen" : "peek"}
      >
        <header className="flex h-12 shrink-0 items-center gap-3 px-3 sm:px-5">
          <h2 id="article-reader-drawer-title-v3" className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">
            {t("articleReader.drawerTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            data-reader-drawer-close
            aria-label={t("articleReader.closeDrawer")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto pt-2">
          {children}
        </div>
      </aside>
    </div>
  );
}

function readerPresentationV3(
  briefing: ExperimentPlacementBriefingV2,
): ArticleReaderPresentationV3 {
  if (briefing.graphs.length <= 1) return "inflow";
  if (briefing.graphs.length <= 4) return "peek";
  return "fullscreen";
}

function readerModelShortLabelV3(
  contract: ModelContractV2 | null,
  modelId: string,
  mainWireLabel: string,
  exactModelLabel: string,
): string {
  if (
    contract?.modelFamilyId.includes("main-wire")
    || modelId.includes("main-wire-integrated-transaction-v3")
  ) return mainWireLabel;
  return contract?.displayName ?? exactModelLabel;
}

function graphPaneForBriefingV3(
  snapshot: ExperimentSnapshotV2,
  briefing: ExperimentPlacementBriefingGraphV2,
): ExperimentSurfaceGraphPaneV2 | null {
  return snapshot.content.surface.graphPanes.find(({ paneId }) =>
    paneId === briefing.paneId) ?? null;
}

export function readerStructuralAnalysisRequestsV3(
  briefing: ExperimentPlacementBriefingV2,
  snapshot: ExperimentSnapshotV2,
  contract: ModelContractV2,
): readonly ArticleReaderStructuralAnalysisRequestV3[] {
  const historyDepthByAnalysisId = new Map<string, number>();
  for (const pickedGraph of briefing.graphs) {
    const pane = graphPaneForBriefingV3(snapshot, pickedGraph);
    if (pane === null) continue;
    const graph = contract.graphCatalog.find(({ graphId }) =>
      graphId === pane.graphId);
    if (graph?.renderer !== "structural-return") continue;
    const historyDepth = pickedGraph.overrides?.historyDepth
      ?? pane.historyDepth
      ?? 1;
    historyDepthByAnalysisId.set(
      graph.analysisId,
      Math.max(
        historyDepthByAnalysisId.get(graph.analysisId) ?? 0,
        historyDepth,
      ),
    );
  }
  return Object.freeze([...historyDepthByAnalysisId].map(([
    analysisId,
    historyDepth,
  ]) => Object.freeze({ analysisId, historyDepth })));
}

function briefingGraphSeriesV3(
  pane: ExperimentSurfaceGraphPaneV2,
  briefing: ExperimentPlacementBriefingGraphV2,
) {
  return [...(briefing.overrides?.series ?? pane.series)].sort(compareOrderV3);
}

function controlTargetScenarioIdsV3(
  control: ExperimentPlacementBriefingControlV2,
  activeScenarioId: string,
): readonly string[] {
  if (control.binding.mode === "fixed") return control.binding.scenarioIds;
  return control.binding.allowedScenarioIds.includes(activeScenarioId)
    ? [activeScenarioId]
    : [];
}

function readerControlInitialValueV3(
  snapshot: ExperimentSnapshotV2,
  scenarioId: string,
  definition: ControlDefinitionV2,
): number {
  const fixture = snapshot.content.scenarios.find((scenario) =>
    scenario.scenarioId === scenarioId)?.capture.fixture;
  return mainWireIntegratedStudioControlValueFromFixtureV3(
    fixture,
    definition.controlId,
  ) ?? definition.defaultValue;
}

export function selectedSweepOutputIdsV3(
  graph: SweepGraphDefinitionV2,
  selectedSeries: readonly Readonly<{ seriesId: string }>[],
): readonly string[] {
  const selectedIds = new Set(selectedSeries.map(({ seriesId }) => seriesId));
  return Object.freeze(graph.seriesCatalog.flatMap((series) =>
    selectedIds.has(series.seriesId) ? [series.outputId] : []));
}

export function commonGraphUnitV3(
  contract: ModelContractV2,
  outputIds: readonly string[],
): string | undefined {
  const units = outputIds.flatMap((outputId) => {
    const output = contract.outputCatalog.find((candidate) =>
      candidate.outputId === outputId);
    return output === undefined ? [] : [output.unit];
  });
  return units.length > 0 && units.every((unit) => unit === units[0])
    ? units[0]
    : undefined;
}

function compareOrderV3(
  left: Readonly<{ order: number }>,
  right: Readonly<{ order: number }>,
): number {
  return left.order - right.order;
}

function formatReaderValueV3(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude >= 1000) return value.toFixed(0);
  if (magnitude >= 100) return value.toFixed(1);
  if (magnitude >= 10) return value.toFixed(2);
  return value.toFixed(3);
}

function readerErrorMessageV3(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

export function articleReaderBoundedHistoryV3<T>(
  history: readonly T[],
  depth: number,
): readonly T[] {
  if (depth <= 0) return [];
  return history.slice(-depth);
}
