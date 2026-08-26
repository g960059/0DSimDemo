import React from "react";
import { createPortal } from "react-dom";
import {
  ChevronRight,
  CircleAlert,
  FlaskConical,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "@/appTheme";
import { ModelLimitations } from "@/components/ModelLimitations";
import { WorkbenchPlaybackControlV3 } from "@/components/workbench/WorkbenchPlaybackControlV3";
import type { StudioClientCompositionV2 } from "@/studio/composition/StudioDefaultCompositionV2";

import {
  articleBriefingPresentationV3,
  resolveArticlePlacementBriefingV3,
  resolveArticlePlacementTitleV3,
} from "@/studio/application/article/ArticleExperimentPlacementV3";
import {
  isWorkbenchGraphTraceExcludedV3,
  resolveWorkbenchGraphScenarioIdsV3,
} from "@/components/workbench/WorkbenchSurfaceV3";
import {
  ExperimentGraphPresentationV3,
  ExperimentNumericControlV3,
  ExperimentOutputGridV3,
} from "@/components/workbench/ExperimentPanePresentationV3";
import {
  PressureVolumeLoopCanvasV3,
  SweepingWaveformCanvasV3,
  GuytonStarlingComparisonCanvasV3,
  resolveWorkbenchAutomaticGraphColorV3,
  resolveWorkbenchGraphTraceStyleV3,
  structuralReturnOrientationFromPayloadV3,
  useWorkbenchOptionalSampledGraphPresentationSamplesV3,
  useWorkbenchScenarioPresentationSamplesV3,
  type WorkbenchPressureVolumeTraceV3,
} from "@/components/workbench/v3";
import { MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID } from "@/analysis/methods/mainWire/MainWireStructuralAnalysisContractV3";
import {
  type MainWirePeriodicPvaV1,
} from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";
import {
  MAIN_WIRE_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1,
  MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1,
  type MainWirePeriodicPvaDerivationV1,
} from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import type { StudioArticleExperimentBlockV2 } from "@/studio/contracts/v2/article";
import type {
  ExperimentPlacementBriefingControlV2,
  ExperimentPlacementBriefingGraphOverridesV2,
  ExperimentPlacementBriefingGraphSeriesV2,
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
import type { ExactModelFixtureProjectionV1 } from
  "@/studio/application/model/ExactModelFixtureProjectionV1";
import { resolveExactModelControlValueV1 } from
  "@/studio/application/model/ExactModelControlValuesV1";
import {
  articleReaderAnalysisKeyV3,
  type ArticleReaderStructuralAnalysisRequestV3,
} from "./ArticleReaderLiveRuntimeV3";
import { articleReaderPresentationOutputSelectionV3 } from "./ArticleReaderPresentationOutputSelectionV3";
import { useArticleReaderLiveRuntimeV3 } from "./useArticleReaderLiveRuntimeV3";

export type ArticleReaderExperimentV3Props = Readonly<{
  block: StudioArticleExperimentBlockV2;
  snapshot: ExperimentSnapshotV2 | null;
  contract: ModelContractV2 | null;
  contractAvailability?: "loading" | "ready" | "unavailable";
  runtimeComposition?: StudioClientCompositionV2 | null;
  live: boolean;
  expandedPresentation: ArticleReaderExpandedPresentationV3 | null;
  peekPortalHost?: HTMLElement | null;
  peekMaximized?: boolean;
  forceInline?: boolean;
  onActivate(): void;
  onDeactivate(): void;
  onExpand(presentation: ArticleReaderExpandedPresentationV3): void;
  onClose(): void;
  onOpenExperimentSession?(): void;
  onPeekMaximizedChange?(maximized: boolean): void;
  onTitleCommit?(title: string): void;
}>;

type ArticleReaderPresentationV3 = "inflow" | "peek" | "fullscreen";
const ARTICLE_READER_PERIODIC_PVA_OUTPUT_ID_SET_V3 = new Set<string>(
  MAIN_WIRE_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1,
);
export type ArticleReaderExpandedPresentationV3 = Exclude<
  ArticleReaderPresentationV3,
  "inflow"
>;

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
  contractAvailability = contract === null ? "unavailable" : "ready",
  runtimeComposition = null,
  live,
  expandedPresentation,
  peekPortalHost = null,
  peekMaximized = false,
  forceInline = false,
  onActivate,
  onDeactivate,
  onExpand,
  onClose,
  onOpenExperimentSession,
  onPeekMaximizedChange,
  onTitleCommit,
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
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onActivateRef.current();
        } else {
          onDeactivateRef.current();
        }
      },
      {
        rootMargin: "-32% 0px -42% 0px",
        threshold: 0,
      },
    );
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
        <p
          className="flex items-center gap-2 text-sm text-wb-danger"
          role="alert"
        >
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
        <p
          className="flex items-center gap-2 text-sm text-wb-danger"
          role="alert"
        >
          <CircleAlert className="h-4 w-4" aria-hidden="true" />
          {t("articleReader.invalidBriefing")}
        </p>
      </section>
    );
  }
  const presentation = articleBriefingPresentationV3(briefing);
  const title = resolveArticlePlacementTitleV3(block.placement, briefing);

  return (
    <section
      ref={rootRef}
      id={`placement-${block.placement.placementId}`}
      className={`article-reader-placement my-12 min-w-0 scroll-mt-24 ${
        presentation === "inflow" ? "article-reader-inflow-placement" : ""
      }`}
      data-reader-placement-id={block.placement.placementId}
      data-reader-placement-live={live}
      data-reader-presentation={forceInline ? undefined : presentation}
    >
      {live && contract !== null ? (
        <ArticleReaderLiveOwnerV3
          briefing={briefing}
          contract={contract}
          runtimeComposition={runtimeComposition}
          expandedPresentation={expandedPresentation}
          forceInline={forceInline}
          peekPortalHost={peekPortalHost}
          peekMaximized={peekMaximized}
          presentation={presentation}
          snapshot={snapshot}
          title={title}
          onTitleCommit={onTitleCommit}
          onExpand={onExpand}
          onClose={onClose}
          onOpenExperimentSession={onOpenExperimentSession}
          onPeekMaximizedChange={onPeekMaximizedChange}
        />
      ) : (
        <ArticleReaderStaticExperimentV3
          briefing={briefing}
          availability={contractAvailability}
          presentation={presentation}
          snapshot={snapshot}
          title={title}
          onActivate={onActivate}
          onOpen={() => {
            onActivate();
            onExpand(presentation === "fullscreen" ? "fullscreen" : "peek");
          }}
        />
      )}

      {block.placement.caption !== null &&
        block.placement.caption.trim().length > 0 && (
          <p className="mt-3 text-xs leading-6 text-wb-muted">
            {block.placement.caption}
          </p>
        )}
    </section>
  );
}

function ArticleReaderStaticExperimentV3({
  briefing,
  availability,
  presentation,
  snapshot,
  title,
  onActivate,
  onOpen,
}: Readonly<{
  briefing: ExperimentPlacementBriefingV2;
  availability: "loading" | "ready" | "unavailable";
  presentation: ArticleReaderPresentationV3;
  snapshot: ExperimentSnapshotV2;
  title: string;
  onActivate(): void;
  onOpen(): void;
}>) {
  const { t } = useTranslation();
  const { appTheme } = useAppTheme();
  const graphs = [...briefing.graphs].sort(compareOrderV3);
  if (availability === "loading") {
    return (
      <div className="py-5" data-reader-model-loading="true" aria-live="polite">
        <p className="text-sm font-semibold tracking-tight text-wb-text">
          {title}
        </p>
        <div className="mt-3 h-1.5 w-36 overflow-hidden rounded-full bg-wb-soft">
          <span className="block h-full w-1/2 animate-pulse rounded-full bg-wb-accent/55 motion-reduce:animate-none" />
        </div>
        <p className="mt-2 text-xs leading-5 text-wb-subtle">
          {t("articleReader.preparingSimulation")}
        </p>
      </div>
    );
  }
  if (availability === "unavailable") {
    return (
      <div className="py-5" data-reader-model-unavailable="true">
        <p className="text-sm font-semibold tracking-tight text-wb-text">
          {title}
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
        presentation={presentation}
        title={title}
        status={t("articleReader.noLiveData")}
        onOpen={onOpen}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={onActivate}
      aria-label={t("articleReader.openExperiment")}
      className="block w-full rounded-xl bg-wb-canvas p-3 text-left transition-[background-color,transform] duration-150 hover:bg-wb-hover/40 active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
    >
      {graphs.length === 0 ? (
        <span className="block py-8 text-sm text-wb-subtle">
          {t("articleReader.noGraphs")}
        </span>
      ) : (
        <span
          className={`grid gap-7 ${graphs.length > 1 ? "md:grid-cols-2" : ""}`}
        >
          {graphs.slice(0, 4).map((graph) => {
            const resolved = resolveArticleReaderGraphPresentationV3(
              snapshot,
              graph,
            );
            if (resolved === null) return null;
            const { pane } = resolved;
            return (
              <span
                key={graph.paneId}
                className={
                  graph.emphasis === "primary" && graphs.length > 2
                    ? "md:col-span-2"
                    : ""
                }
              >
                <span className="block text-sm font-semibold tracking-tight text-wb-text">
                  {resolved.label}
                </span>
                <span className="mt-4 flex min-h-32 items-center justify-center bg-[linear-gradient(to_bottom,transparent_31%,var(--wb-grid)_32%,transparent_33%,transparent_65%,var(--wb-grid)_66%,transparent_67%)] px-4">
                  <span className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                    {resolved.series.map((series) => {
                      const scenarioId =
                        briefing.scenarioScope.initialFocusScenarioId;
                      const source = pane.traceColors?.find(
                        (trace) =>
                          trace.scenarioId === scenarioId &&
                          trace.seriesId === series.seriesId,
                      );
                      const customColor =
                        articleBriefingTraceColorV3(
                          graph,
                          scenarioId,
                          series.seriesId,
                        ) ?? source?.customColorHex;
                      const color =
                        customColor ??
                        resolveWorkbenchAutomaticGraphColorV3({
                          colorHex: source?.automaticColorHex ?? "#64748b",
                          appTheme,
                        });
                      return (
                        <span
                          key={series.seriesId}
                          className="inline-flex items-center gap-1.5 text-[11px] text-wb-muted"
                        >
                          <span
                            className="h-0.5 w-5 rounded-full"
                            style={{ backgroundColor: color }}
                            aria-hidden="true"
                          />
                          {series.label}
                        </span>
                      );
                    })}
                  </span>
                </span>
              </span>
            );
          })}
        </span>
      )}
      <span className="mt-2 block text-[11px] text-wb-subtle">
        {t("articleReader.noLiveData")}
      </span>
    </button>
  );
}

function ArticleReaderLiveOwnerV3({
  briefing,
  contract,
  runtimeComposition,
  expandedPresentation,
  forceInline,
  peekPortalHost,
  peekMaximized,
  presentation,
  snapshot,
  title,
  onExpand,
  onClose,
  onOpenExperimentSession,
  onPeekMaximizedChange,
  onTitleCommit,
}: Readonly<{
  briefing: ExperimentPlacementBriefingV2;
  contract: ModelContractV2;
  runtimeComposition: StudioClientCompositionV2 | null;
  expandedPresentation: ArticleReaderExpandedPresentationV3 | null;
  forceInline: boolean;
  peekPortalHost: HTMLElement | null;
  peekMaximized: boolean;
  presentation: ArticleReaderPresentationV3;
  snapshot: ExperimentSnapshotV2;
  title: string;
  onExpand(presentation: ArticleReaderExpandedPresentationV3): void;
  onClose(): void;
  onOpenExperimentSession?(): void;
  onPeekMaximizedChange?(maximized: boolean): void;
  onTitleCommit?(title: string): void;
}>) {
  const { t } = useTranslation();
  const structuralAnalyses = readerStructuralAnalysisRequestsV3(
    briefing,
    snapshot,
    contract,
  );
  const presentationOutputIds = React.useMemo(
    () =>
      articleReaderPresentationOutputSelectionV3(contract, snapshot, briefing),
    [briefing, contract, snapshot],
  );
  const runtime = useArticleReaderLiveRuntimeV3(
    snapshot,
    requiredArticleReaderRuntimeCompositionV3(runtimeComposition),
    briefing.scenarioScope.initialFocusScenarioId,
    briefing.scenarioScope.visibleScenarioIds,
    structuralAnalyses,
    presentationOutputIds,
  );
  const detail = (
    <ArticleReaderLiveDetailV3
      briefing={briefing}
      contract={contract}
      inline={presentation === "inflow" && expandedPresentation === null}
      runtime={runtime}
      snapshot={snapshot}
      title={title}
    />
  );
  const anchorStatus =
    runtime.state.status === "failed"
      ? t("articleReader.failed")
      : runtime.state.status === "playing"
        ? t("articleReader.live")
        : runtime.state.status === "paused"
          ? t("articleReader.paused")
          : t("articleReader.starting");

  React.useEffect(() => {
    if (expandedPresentation === null) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (
        expandedPresentation === "peek" &&
        peekMaximized &&
        onPeekMaximizedChange !== undefined
      ) {
        onPeekMaximizedChange(false);
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expandedPresentation, onClose, onPeekMaximizedChange, peekMaximized]);

  if (expandedPresentation === null) {
    if (forceInline || presentation === "inflow") return detail;
    return (
      <ArticleReaderPeekAnchorV3
        presentation={presentation}
        title={title}
        status={anchorStatus}
        onOpen={() =>
          onExpand(presentation === "fullscreen" ? "fullscreen" : "peek")
        }
      />
    );
  }
  if (typeof document === "undefined") return null;
  if (expandedPresentation === "peek") {
    if (peekPortalHost === null) return null;
    return (
      <>
        <ArticleReaderPeekAnchorV3
          active
          presentation={presentation === "fullscreen" ? "fullscreen" : "peek"}
          title={title}
          status={anchorStatus}
          onOpen={onClose}
        />
        {createPortal(
          <ArticleReaderExperimentPeekPanelV3
            maximized={peekMaximized}
            title={title}
            onClose={onClose}
            onOpenExperimentSession={onOpenExperimentSession}
            onToggleMaximized={
              onPeekMaximizedChange === undefined
                ? undefined
                : () => onPeekMaximizedChange(!peekMaximized)
            }
            onTitleCommit={onTitleCommit}
          >
            {detail}
          </ArticleReaderExperimentPeekPanelV3>,
          peekPortalHost,
        )}
      </>
    );
  }
  return createPortal(
    <ArticleReaderExperimentDrawerV3
      onClose={onClose}
      onOpenExperimentSession={onOpenExperimentSession}
    >
      {detail}
    </ArticleReaderExperimentDrawerV3>,
    document.body,
  );
}

function ArticleReaderPeekAnchorV3({
  active = false,
  presentation,
  status,
  title,
  onOpen,
}: Readonly<{
  active?: boolean;
  presentation: Exclude<ArticleReaderPresentationV3, "inflow">;
  status: string;
  title: string;
  onOpen(): void;
}>) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t(
        active ? "articleReader.closeDrawer" : "articleReader.openExperiment",
      )}
      aria-controls="article-reader-experiment-companion-v3"
      aria-expanded={active}
      className="article-reader-peek-anchor article-reader-peek-surface group flex min-h-20 w-full max-w-full items-center gap-3.5 rounded-xl px-4 py-4 text-left outline-none sm:px-5"
      data-reader-peek-active={active ? "true" : "false"}
      data-reader-presentation={presentation}
    >
      <span className="article-link-card-leading" aria-hidden="true">
        <FlaskConical className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold leading-6 tracking-[-0.012em] text-wb-text sm:text-base">
          {title}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs leading-5 text-wb-subtle">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              active ? "bg-wb-accent" : "bg-wb-subtle"
            }`}
            aria-hidden="true"
          />
          <span className="truncate">{status}</span>
        </span>
      </span>
      <span className="article-reader-peek-action hidden min-h-8 items-center gap-1.5 rounded-lg border border-wb-line px-2.5 text-xs font-semibold text-wb-muted sm:inline-flex">
        {t(
          active ? "articleReader.closeDrawer" : "articleReader.openExperiment",
        )}
        <ChevronRight
          className="article-reader-peek-anchor-icon h-3.5 w-3.5 shrink-0 text-wb-subtle"
          aria-hidden="true"
        />
      </span>
      <ChevronRight
        className="article-reader-peek-anchor-icon h-4 w-4 shrink-0 text-wb-subtle sm:hidden"
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
  title,
}: Readonly<{
  briefing: ExperimentPlacementBriefingV2;
  contract: ModelContractV2;
  inline: boolean;
  runtime: ArticleReaderRuntimeHookV3;
  snapshot: ExperimentSnapshotV2;
  title: string;
}>) {
  const { t } = useTranslation();
  const [modelDisclosureOpen, setModelDisclosureOpen] = React.useState(false);
  const visibleScenarios = snapshot.content.scenarios.filter(({ scenarioId }) =>
    briefing.scenarioScope.visibleScenarioIds.includes(scenarioId),
  );
  const playing = runtime.state.status === "playing";
  const unavailable =
    runtime.state.status === "idle" || runtime.state.status === "starting";
  const scenarioSelectionDisabled =
    unavailable ||
    runtime.state.status === "applying-control" ||
    runtime.state.status === "requesting-analysis" ||
    runtime.state.status === "failed" ||
    runtime.state.status === "disposed";

  return (
    <div
      className={
        inline
          ? "article-reader-inflow min-w-0 rounded-2xl border border-wb-line/70 bg-wb-floating/35 p-3 sm:p-4"
          : "min-w-0 px-4 pb-10 sm:px-6"
      }
    >
      {inline && (
        <p className="mb-2 truncate text-sm font-semibold tracking-[-0.012em] text-wb-text">
          {title}
        </p>
      )}
      <div
        className={`flex flex-wrap items-center gap-2 ${inline ? "mb-3" : "mb-5"}`}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {visibleScenarios.map((scenario) => (
            <button
              key={scenario.scenarioId}
              type="button"
              disabled={scenarioSelectionDisabled}
              onClick={() => runtime.selectScenario(scenario.scenarioId)}
              aria-pressed={
                runtime.state.activeScenarioId === scenario.scenarioId
              }
              className="workbench-selection-button min-h-8 rounded-lg px-2.5 text-xs font-medium transition-[color,background-color,transform] duration-150 active:scale-[0.97] disabled:cursor-wait disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
            >
              {scenario.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-wb-muted" role="status">
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
          onClick={() => setModelDisclosureOpen(true)}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          aria-label={t("workbench.editor.validationAndLimitations")}
          title={t("workbench.editor.validationAndLimitations")}
        >
          <FlaskConical className="h-3 w-3 text-wb-accent" aria-hidden="true" />
          MW V3
        </button>
        <ModelLimitations
          acknowledgementScope={`${contract.modelId}:disclosure-v1`}
          autoOpenUnacknowledged={false}
          open={modelDisclosureOpen}
          onOpenChange={setModelDisclosureOpen}
          showTrigger={false}
        />
        <WorkbenchPlaybackControlV3
          disabled={
            unavailable ||
            runtime.state.status === "failed" ||
            runtime.state.status === "applying-control" ||
            runtime.state.status === "requesting-analysis"
          }
          playing={playing}
          rate={runtime.state.playbackRate}
          onPlaybackToggle={() =>
            playing ? void runtime.pause() : runtime.play()
          }
          onRateChange={runtime.setPlaybackRate}
        />
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
              compact={inline}
              contract={contract}
              runtime={runtime}
              snapshot={snapshot}
            />
          )}

          <div
            className={`min-w-0 gap-9 ${
              !inline && briefing.graphs.length > 1
                ? "-mx-4 flex snap-x snap-mandatory overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 xl:mx-0 xl:grid xl:grid-cols-2 xl:overflow-visible xl:px-0"
                : "grid"
            }`}
          >
            {[...briefing.graphs].sort(compareOrderV3).map((graph) => (
              <ArticleReaderLiveGraphViewportV3
                key={graph.paneId}
                className={
                  !inline && briefing.graphs.length > 1
                    ? "w-[88vw] max-w-[720px] shrink-0 snap-center xl:w-auto xl:max-w-none"
                    : "min-w-0"
                }
                activeScenarioId={runtime.state.activeScenarioId}
                briefing={graph}
                contract={contract}
                inline={inline}
                playbackRunning={playing}
                runtime={runtime}
                snapshot={snapshot}
                visibleScenarioIds={briefing.scenarioScope.visibleScenarioIds}
              />
            ))}
          </div>

          {briefing.graphs.length === 0 && (
            <p className="py-12 text-sm text-wb-subtle">
              {t("articleReader.noGraphs")}
            </p>
          )}

          {briefing.outputs.length > 0 && (
            <ArticleReaderOutputsV3
              briefing={briefing}
              compact={inline}
              contract={contract}
              runtime={runtime}
            />
          )}
        </>
      )}
    </div>
  );
}

function ArticleReaderLiveGraphViewportV3({
  activeScenarioId,
  briefing,
  className,
  contract,
  inline,
  playbackRunning,
  runtime,
  snapshot,
  visibleScenarioIds,
}: Readonly<{
  activeScenarioId: string;
  briefing: ExperimentPlacementBriefingGraphV2;
  className: string;
  contract: ModelContractV2;
  inline: boolean;
  playbackRunning: boolean;
  runtime: ArticleReaderRuntimeHookV3;
  snapshot: ExperimentSnapshotV2;
  visibleScenarioIds: readonly string[];
}>) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const observerAvailable = typeof IntersectionObserver !== "undefined";
  const [renderActive, setRenderActive] = React.useState(!observerAvailable);

  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setRenderActive(true);
      return undefined;
    }
    const element = rootRef.current;
    if (element === null) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries.some(
          (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.12,
        );
        setRenderActive((current) => (current === active ? current : active));
      },
      {
        rootMargin: "80px 0px",
        threshold: [0, 0.12],
      },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const label =
    resolveArticleReaderGraphPresentationV3(snapshot, briefing)?.label ??
    "Graph";
  return (
    <div
      ref={rootRef}
      className={className}
      data-reader-graph-render-active={renderActive ? "true" : "false"}
    >
      {renderActive ? (
        <ArticleReaderLiveGraphV3
          activeScenarioId={activeScenarioId}
          briefing={briefing}
          contract={contract}
          inline={inline}
          playbackRunning={playbackRunning}
          runtime={runtime}
          snapshot={snapshot}
          visibleScenarioIds={visibleScenarioIds}
        />
      ) : (
        <div
          className={
            inline
              ? "article-reader-inflow-graph"
              : "min-h-[clamp(18rem,43vw,32rem)]"
          }
          aria-label={label}
          data-reader-graph-placeholder="true"
        />
      )}
    </div>
  );
}

function ArticleReaderLiveGraphV3({
  activeScenarioId,
  briefing,
  contract,
  inline,
  playbackRunning,
  runtime,
  snapshot,
  visibleScenarioIds,
}: Readonly<{
  activeScenarioId: string;
  briefing: ExperimentPlacementBriefingGraphV2;
  contract: ModelContractV2;
  inline: boolean;
  playbackRunning: boolean;
  runtime: ArticleReaderRuntimeHookV3;
  snapshot: ExperimentSnapshotV2;
  visibleScenarioIds: readonly string[];
}>) {
  const { appTheme } = useAppTheme();
  const sampleStore = runtime.sampleStore;
  const resolved = resolveArticleReaderGraphPresentationV3(snapshot, briefing);
  const pane = resolved?.pane;
  const graph =
    pane === undefined
      ? undefined
      : contract.graphCatalog.find(({ graphId }) => graphId === pane.graphId);
  const sampledPresentation =
    useWorkbenchOptionalSampledGraphPresentationSamplesV3(
      sampleStore,
      graph?.renderer === "sweep" || graph?.renderer === "pressure-volume"
        ? graph.renderer
        : null,
    );
  if (resolved === null || pane === undefined || graph === undefined)
    return null;
  const series = resolved.series;
  const paneScenarioIds = resolveWorkbenchGraphScenarioIdsV3(
    pane,
    visibleScenarioIds,
  );
  const visibleScenarios = snapshot.content.scenarios.filter(({ scenarioId }) =>
    paneScenarioIds.includes(scenarioId),
  );

  if (graph.renderer === "structural-return") {
    const structuralVisibleScenarios = visibleScenarios.filter(
      ({ scenarioId }) =>
        !isWorkbenchGraphTraceExcludedV3(pane, scenarioId, null),
    );
    return (
      <ExperimentGraphPresentationV3
        variant="article"
        label={resolved.label}
        data-reader-legend={resolved.legend}
      >
        <ArticleReaderStructuralReturnGraphV3
          authoredScenarios={snapshot.content.scenarios}
          graph={graph}
          historyDepth={resolved.historyDepth}
          inline={inline}
          runtime={runtime}
          pane={pane}
          surface={snapshot.content.surface}
          traceColorOverrides={briefing.overrides?.traceColors}
          structuralSide={
            pane.structuralSide ?? (graph.side === "left" ? "left" : "right")
          }
          visibleScenarios={structuralVisibleScenarios}
        />
      </ExperimentGraphPresentationV3>
    );
  }

  const authoredScenarioCount = snapshot.content.scenarios.length;
  const cyclePhaseOutputId = articleReaderModelCyclePhaseOutputIdV3(contract);
  const scenarioIndexV3 = (scenarioId: string) =>
    snapshot.content.scenarios.findIndex(
      (scenario) => scenario.scenarioId === scenarioId,
    );
  if (graph.renderer === "pressure-volume") {
    if (sampledPresentation?.renderer !== "pressure-volume") return null;
    const exactOrbits = sampledPresentation.exactOrbitSamplesByScenarioId;
    const orbitHistory = sampledPresentation.orbitHistoryByScenarioId;
    const bindings = series.flatMap((selectedSeries) => {
      const binding = graph.seriesCatalog.find(
        ({ seriesId }) => seriesId === selectedSeries.seriesId,
      );
      return binding === undefined ? [] : [{ binding, selectedSeries }];
    });
    const tracesForBindings = (selected: typeof bindings) =>
      visibleScenarios.flatMap((scenario) => {
        const scenarioStyleIndex = scenarioIndexV3(scenario.scenarioId);
        const scenarioSamples = exactOrbits[scenario.scenarioId] ?? [];
        if (scenarioStyleIndex < 0 || scenarioSamples.length === 0) return [];
        return selected.flatMap(({ binding, selectedSeries }) => {
          if (
            isWorkbenchGraphTraceExcludedV3(
              pane,
              scenario.scenarioId,
              selectedSeries.seriesId,
            )
          )
            return [];
          const style = resolveWorkbenchGraphTraceStyleV3({
            pane,
            surface: snapshot.content.surface,
            renderer: graph.renderer,
            authoredScenarioCount,
            scenarioId: scenario.scenarioId,
            scenarioIndex: scenarioStyleIndex,
            seriesId: selectedSeries.seriesId,
            seriesIndex: series.findIndex(
              ({ seriesId }) => seriesId === selectedSeries.seriesId,
            ),
            appTheme,
          });
          const color =
            articleBriefingTraceColorV3(
              briefing,
              scenario.scenarioId,
              selectedSeries.seriesId,
            ) ?? style.color;
          return [
            {
              scenarioId: scenario.scenarioId,
              scenarioLabel: scenario.label,
              scenarioStatus: playbackRunning ? "Live" : "Paused",
              scenarioStyleIndex,
              samples: scenarioSamples,
              historySampleSets: articleReaderBoundedHistoryV3(
                orbitHistory[scenario.scenarioId] ?? [],
                resolved.historyDepth,
              ).map((entry) => entry.samples),
              volumeOutputId: binding.volumeOutputId,
              pressureOutputId: binding.pressureOutputId,
              pressureBasis: binding.pressureBasis,
              cyclePhaseOutputId: binding.cyclePhaseOutputId,
              chamberId: binding.seriesId,
              chamberLabel: selectedSeries.label,
              chamberColor: color,
            },
          ];
        });
      });
    const traces = tracesForBindings(bindings);
    return (
      <ExperimentGraphPresentationV3
        variant="article"
        label={resolved.label}
        data-reader-legend={resolved.legend}
        canvasClassName={
          inline
            ? "article-reader-inflow-graph min-w-0"
            : "h-[clamp(17rem,43vw,31rem)] min-w-0"
        }
      >
        <ArticleReaderPressureVolumeCanvasV3
          analysisId={
            MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID
          }
          runtime={runtime}
          traces={traces}
          showPressureEnvelope={pane.showPressureEnvelope}
        />
      </ExperimentGraphPresentationV3>
    );
  }
  if (graph.renderer !== "sweep") return null;
  if (sampledPresentation?.renderer !== "sweep") return null;
  const samples = sampledPresentation.samplesByScenarioId;
  const bindings = series.flatMap((selectedSeries) => {
    const binding = graph.seriesCatalog.find(
      ({ seriesId }) => seriesId === selectedSeries.seriesId,
    );
    return binding === undefined ? [] : [{ binding, selectedSeries }];
  });
  const tracesForScenarios = (selected: readonly ExperimentScenarioV2[]) =>
    selected.flatMap((scenario) => {
      const scenarioStyleIndex = scenarioIndexV3(scenario.scenarioId);
      const scenarioSamples = samples[scenario.scenarioId] ?? [];
      if (scenarioStyleIndex < 0 || scenarioSamples.length === 0) return [];
      return bindings.flatMap(({ binding, selectedSeries }) => {
        if (
          isWorkbenchGraphTraceExcludedV3(
            pane,
            scenario.scenarioId,
            selectedSeries.seriesId,
          )
        )
          return [];
        const style = resolveWorkbenchGraphTraceStyleV3({
          pane,
          surface: snapshot.content.surface,
          renderer: graph.renderer,
          authoredScenarioCount,
          scenarioId: scenario.scenarioId,
          scenarioIndex: scenarioStyleIndex,
          seriesId: selectedSeries.seriesId,
          seriesIndex: series.findIndex(
            ({ seriesId }) => seriesId === selectedSeries.seriesId,
          ),
          appTheme,
        });
        const color =
          articleBriefingTraceColorV3(
            briefing,
            scenario.scenarioId,
            selectedSeries.seriesId,
          ) ?? style.color;
        return [
          {
            scenarioId: scenario.scenarioId,
            scenarioLabel: scenario.label,
            scenarioStatus: playbackRunning ? "Live" : "Paused",
            scenarioStyleIndex,
            samples: scenarioSamples,
            outputId: binding.outputId,
            signalLabel: selectedSeries.label,
            signalColor: color,
            ...(cyclePhaseOutputId === undefined ? {} : { cyclePhaseOutputId }),
          },
        ];
      });
    });
  const selectedOutputIds = selectedSweepOutputIdsV3(graph, series);
  const selectedOutputs = contract.outputCatalog.filter(({ outputId }) =>
    selectedOutputIds.includes(outputId),
  );
  const unitLabel = commonGraphUnitV3(contract, selectedOutputIds);
  const includeZero = selectedOutputs.every(
    ({ outputId }) => outputId.includes(".flow.") || outputId.endsWith(".flow"),
  );
  const windowSec = resolved.windowSec ?? 2;
  const traces = tracesForScenarios(visibleScenarios);
  return (
    <ExperimentGraphPresentationV3
      variant="article"
      label={resolved.label}
      data-reader-legend={resolved.legend}
      canvasClassName={
        inline
          ? "article-reader-inflow-graph min-w-0"
          : "h-[clamp(16rem,39vw,28rem)] min-w-0"
      }
    >
      <SweepingWaveformCanvasV3
        activeScenarioId={activeScenarioId}
        includeZero={includeZero}
        traces={traces}
        unitLabel={unitLabel}
        windowSec={windowSec}
      />
    </ExperimentGraphPresentationV3>
  );
}

function ArticleReaderPressureVolumeCanvasV3({
  analysisId,
  showPressureEnvelope,
  runtime,
  traces,
}: Readonly<{
  analysisId: string;
  showPressureEnvelope: ExperimentSurfaceGraphPaneV2["showPressureEnvelope"];
  runtime: ArticleReaderRuntimeHookV3;
  traces: readonly WorkbenchPressureVolumeTraceV3[];
}>) {
  const scenarioIds = React.useMemo(
    () =>
      Object.freeze([
        ...new Set(
          traces
            .filter(({ chamberId }) => chamberId === "LV" || chamberId === "RV")
            .map(({ scenarioId }) => scenarioId),
        ),
      ]),
    [traces],
  );
  const missingScenarioIds = scenarioIds.filter((scenarioId) => {
    const key = articleReaderAnalysisKeyV3(scenarioId, analysisId);
    return (
      runtime.state.analysisByKey[key] === undefined &&
      runtime.state.analysisErrorByKey[key] === undefined &&
      !runtime.state.pendingAnalysisKeys.includes(key)
    );
  });
  const missingKey = JSON.stringify(missingScenarioIds);
  const canRequest =
    runtime.state.status === "playing" || runtime.state.status === "paused";
  React.useEffect(() => {
    if (!canRequest || missingScenarioIds.length === 0) return;
    void runtime
      .requestAnalysis({
        analysisId,
        scenarioIds: missingScenarioIds,
      })
      .catch(() => {
        // The runtime publishes recoverable per-Scenario analysis errors.
      });
  }, [analysisId, canRequest, missingKey, runtime.requestAnalysis]);

  const enrichedTraces = React.useMemo(
    () =>
      Object.freeze(
        traces.map((trace) => {
          const side = pressureVolumeRelationSideV3(trace.chamberId);
          if (side === null) return trace;
          const key = articleReaderAnalysisKeyV3(trace.scenarioId, analysisId);
          const periodicPva = periodicPvaFromPayloadV3(
            runtime.state.analysisByKey[key]?.payload,
            side,
            runtime.periodicPvaDerivation,
          );
          return Object.freeze({
            ...trace,
            ...(periodicPva === undefined ? {} : { periodicPva }),
            ...(runtime.state.analysisErrorByKey[key] === undefined
              ? {}
              : {
                  periodicPvaAnalysisError:
                    runtime.state.analysisErrorByKey[key],
                }),
            periodicPvaAnalysisPending:
              runtime.state.pendingAnalysisKeys.includes(key),
          });
        }),
      ),
    [
      analysisId,
      runtime.state.analysisByKey,
      runtime.state.analysisErrorByKey,
      runtime.state.pendingAnalysisKeys,
      traces,
    ],
  );
  return (
    <PressureVolumeLoopCanvasV3
      traces={enrichedTraces}
      showPressureEnvelope={showPressureEnvelope}
    />
  );
}

function pressureVolumeRelationSideV3(
  chamberId: string,
): "left" | "right" | null {
  if (chamberId === "LV") return "left";
  if (chamberId === "RV") return "right";
  return null;
}

function periodicPvaFromPayloadV3(
  payload: unknown,
  side: "left" | "right",
  derivation: MainWirePeriodicPvaDerivationV1 | null,
): MainWirePeriodicPvaV1 | undefined {
  if (derivation === null) return undefined;
  const orientation = structuralReturnOrientationFromPayloadV3(payload, side);
  if (orientation === null) return undefined;
  try {
    return derivation.build(
      orientation.starlingLocus,
      side === "left" ? "LV" : "RV",
    );
  } catch {
    return undefined;
  }
}

function articleReaderModelCyclePhaseOutputIdV3(
  contract: ModelContractV2,
): string | undefined {
  for (const graph of contract.graphCatalog) {
    if (graph.renderer !== "pressure-volume") continue;
    const cyclePhaseOutputId = graph.seriesCatalog[0]?.cyclePhaseOutputId;
    if (cyclePhaseOutputId !== undefined) return cyclePhaseOutputId;
  }
  return undefined;
}

export function ArticleReaderStructuralReturnGraphV3({
  authoredScenarios,
  graph,
  historyDepth,
  inline = false,
  pane,
  runtime,
  surface,
  traceColorOverrides,
  structuralSide,
  visibleScenarios,
}: Readonly<{
  authoredScenarios: readonly ExperimentScenarioV2[];
  graph: StructuralReturnGraphDefinitionV2;
  historyDepth: number;
  inline?: boolean;
  pane: ExperimentSurfaceGraphPaneV2;
  runtime: ArticleReaderRuntimeHookV3;
  surface: ExperimentSnapshotV2["content"]["surface"];
  traceColorOverrides?: ExperimentPlacementBriefingGraphOverridesV2["traceColors"];
  structuralSide: "left" | "right";
  visibleScenarios: readonly ExperimentScenarioV2[];
}>) {
  const { t } = useTranslation();
  const { appTheme } = useAppTheme();
  const analysisId =
    MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID;
  const scenarioIds = visibleScenarios.map(({ scenarioId }) => scenarioId);
  const analysisKeys = scenarioIds.map((scenarioId) =>
    articleReaderAnalysisKeyV3(scenarioId, analysisId),
  );
  const missingScenarioIds = scenarioIds.filter((scenarioId, index) => {
    const key = analysisKeys[index]!;
    return (
      runtime.state.analysisByKey[key] === undefined &&
      runtime.state.analysisErrorByKey[key] === undefined &&
      !runtime.state.pendingAnalysisKeys.includes(key)
    );
  });
  const canRequest =
    runtime.state.status === "playing" || runtime.state.status === "paused";
  const missingScenarioKey = JSON.stringify(missingScenarioIds);

  React.useEffect(() => {
    if (!canRequest || missingScenarioIds.length === 0) return;
    void runtime
      .requestAnalysis({
        analysisId,
        scenarioIds: missingScenarioIds,
      })
      .catch(() => {
        // The runtime publishes a per-Scenario recoverable error for the graph.
      });
  }, [canRequest, analysisId, missingScenarioKey, runtime.requestAnalysis]);

  const pending = analysisKeys.some((key) =>
    runtime.state.pendingAnalysisKeys.includes(key),
  );
  const traces = visibleScenarios.map((scenario) => {
    const key = articleReaderAnalysisKeyV3(scenario.scenarioId, analysisId);
    const scenarioIndex = authoredScenarios.findIndex(
      ({ scenarioId }) => scenarioId === scenario.scenarioId,
    );
    const traceStyle = resolveWorkbenchGraphTraceStyleV3({
      pane,
      surface,
      renderer: graph.renderer,
      authoredScenarioCount: authoredScenarios.length,
      scenarioId: scenario.scenarioId,
      scenarioIndex,
      seriesId: null,
      appTheme,
    });
    const articleColor = traceColorOverrides?.find(
      (trace) =>
        trace.scenarioId === scenario.scenarioId && trace.seriesId === null,
    )?.colorHex;
    const analysisPending = runtime.state.pendingAnalysisKeys.includes(key);
    return Object.freeze({
      scenario,
      key,
      color: articleColor ?? traceStyle.color,
      analysis: runtime.state.analysisByKey[key],
      history: articleReaderBoundedHistoryV3(
        runtime.state.analysisHistoryByKey[key] ?? [],
        analysisPending ? Math.max(1, historyDepth) : historyDepth,
      ),
      pending: analysisPending,
      error: runtime.state.analysisErrorByKey[key] ?? null,
    });
  });
  const comparisonTraces = Object.freeze(
    traces.flatMap((trace) => {
      const currentOrientation = structuralReturnOrientationFromPayloadV3(
        trace.analysis?.payload,
        structuralSide,
      );
      const historyOrientations = Object.freeze(
        trace.history.flatMap((historical) => {
          const candidate = structuralReturnOrientationFromPayloadV3(
            historical.payload,
            structuralSide,
          );
          return candidate === null ? [] : [candidate];
        }),
      );
      const fallbackOrientation =
        trace.pending && currentOrientation === null
          ? (historyOrientations.at(-1) ?? null)
          : null;
      const orientation = currentOrientation ?? fallbackOrientation;
      if (orientation === null) return [];
      return [
        Object.freeze({
          scenarioId: trace.scenario.scenarioId,
          scenarioLabel: trace.scenario.label,
          color: trace.color,
          orientation,
          orientationAlpha: fallbackOrientation === null ? 1 : 0.34,
          pending: trace.pending,
          historyOrientations:
            fallbackOrientation === null
              ? historyOrientations
              : Object.freeze(historyOrientations.slice(0, -1)),
        }),
      ];
    }),
  );
  const firstError = traces.find(({ error }) => error !== null)?.error ?? null;
  return (
    <div
      className={`grid min-w-0 ${
        inline ? "article-reader-inflow-graph" : "h-[clamp(17rem,32vw,27rem)]"
      }`}
      data-reader-structural-scenario-count={visibleScenarios.length}
    >
      {comparisonTraces.length === 0 ? (
        <div
          className="flex h-full min-h-56 items-center justify-center px-5 text-center text-xs leading-6 text-wb-subtle"
          role={firstError === null ? "status" : "alert"}
        >
          {pending
            ? t("workbench.live.analysisRunning")
            : (firstError ?? t("workbench.live.analysisUnavailable"))}
        </div>
      ) : (
        <GuytonStarlingComparisonCanvasV3
          recalculatingLabel={t("workbench.live.analysisRecalculating")}
          traces={comparisonTraces}
        />
      )}
      <div className="sr-only">
        {traces.map(({ analysis, scenario }) =>
          analysis === undefined ? null : (
            <span
              key={scenario.scenarioId}
              data-reader-analysis-input-epoch={analysis.inputEpoch}
              data-reader-structural-scenario-id={scenario.scenarioId}
            >
              {scenario.label}: {analysis.sourceAcceptedRevision}@
              {analysis.sourceAcceptedTimeSec.toFixed(3)}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

export function ArticleReaderOutputsV3({
  briefing,
  compact = false,
  contract,
  runtime,
  sampleStore,
}: Readonly<{
  briefing: ExperimentPlacementBriefingV2;
  compact?: boolean;
  contract: ModelContractV2;
  runtime?: ArticleReaderRuntimeHookV3;
  /** @deprecated Direct rendering tests may provide a store without a runtime. */
  sampleStore?: ArticleReaderRuntimeHookV3["sampleStore"];
}>) {
  const { t } = useTranslation();
  const ownedSampleStore = runtime?.sampleStore ?? sampleStore;
  if (ownedSampleStore === undefined) {
    throw new Error("Article Reader outputs require a sample store");
  }
  const samples = useWorkbenchScenarioPresentationSamplesV3(ownedSampleStore);
  const analysisScenarioIds = React.useMemo(
    () =>
      Object.freeze([
        ...new Set(
          briefing.outputs.flatMap(({ outputId, scenarioId }) =>
            ARTICLE_READER_PERIODIC_PVA_OUTPUT_ID_SET_V3.has(outputId)
              ? [scenarioId]
              : [],
          ),
        ),
      ]),
    [briefing.outputs],
  );
  const analysisId =
    MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID;
  const missingAnalysisScenarioIds = analysisScenarioIds.filter(
    (scenarioId) => {
      if (runtime === undefined) return false;
      const key = articleReaderAnalysisKeyV3(scenarioId, analysisId);
      return (
        runtime.state.analysisByKey[key] === undefined &&
        runtime.state.analysisErrorByKey[key] === undefined &&
        !runtime.state.pendingAnalysisKeys.includes(key)
      );
    },
  );
  const missingAnalysisKey = JSON.stringify(missingAnalysisScenarioIds);
  const canRequestAnalysis =
    runtime?.state.status === "playing" || runtime?.state.status === "paused";
  React.useEffect(() => {
    if (
      runtime === undefined ||
      !canRequestAnalysis ||
      missingAnalysisScenarioIds.length === 0
    )
      return;
    void runtime
      .requestAnalysis({
        analysisId,
        scenarioIds: missingAnalysisScenarioIds,
      })
      .catch(() => {
        // Per-Scenario errors are rendered as unavailable outputs below.
      });
  }, [
    analysisId,
    canRequestAnalysis,
    missingAnalysisKey,
    runtime?.requestAnalysis,
  ]);
  return (
    <section
      className={`${compact ? "mt-5" : "mt-8"} rounded-xl bg-wb-inspector p-3`}
      aria-label={t("articleReader.outputs")}
    >
      <ExperimentOutputGridV3
        variant="article"
        items={[...briefing.outputs].sort(compareOrderV3).map((output) => {
          const definition = contract.outputCatalog.find(
            ({ outputId }) => outputId === output.outputId,
          );
          const latest = samples[output.scenarioId]?.at(-1);
          const analysisKey = articleReaderAnalysisKeyV3(
            output.scenarioId,
            analysisId,
          );
          const periodicPva =
            runtime !== undefined &&
            ARTICLE_READER_PERIODIC_PVA_OUTPUT_ID_SET_V3.has(output.outputId)
              ? periodicPvaFromPayloadV3(
                  runtime.state.analysisByKey[analysisKey]?.payload,
                  "left",
                  runtime.periodicPvaDerivation,
                )
              : undefined;
          const value = ARTICLE_READER_PERIODIC_PVA_OUTPUT_ID_SET_V3.has(
            output.outputId,
          )
            ? articleReaderPeriodicPvaScalarV3(periodicPva, output.outputId)
            : latest?.values[output.outputId];
          const scalar =
            typeof value === "number" && Number.isFinite(value) ? value : null;
          return {
            itemId: `${output.sourcePaneId}:${output.outputId}:${output.scenarioId}`,
            label: output.label,
            value: scalar,
            unit: definition?.unit ?? "",
            significantDigits: definition?.significantDigits,
            availability: scalar === null ? "unavailable" : "available",
            quality: scalar === null ? "not-assessed" : "assessed",
          };
        })}
      />
    </section>
  );
}

function articleReaderPeriodicPvaScalarV3(
  periodicPva: MainWirePeriodicPvaV1 | undefined,
  outputId: string,
): number | null {
  const projection =
    periodicPva?.status === "available"
      ? periodicPva
      : periodicPva?.status === "collecting"
        ? periodicPva.preview
        : null;
  if (projection === null) return null;
  switch (outputId) {
    case MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1.potentialEnergyMilliJoule:
      return projection.potentialEnergy?.joule === undefined
        ? null
        : projection.potentialEnergy.joule * 1e3;
    case MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1.pressureVolumeAreaMilliJoule:
      return projection.pva?.joule === undefined
        ? null
        : projection.pva.joule * 1e3;
    case MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1.estimatedMvo2PerBeatPer100G:
      return projection.estimatedMvo2?.status === "available"
        ? projection.estimatedMvo2.oxygenDemand.totalMlO2PerBeatPer100G
        : null;
    case MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1.estimatedMvo2PerMinPer100G:
      return projection.estimatedMvo2?.status === "available"
        ? projection.estimatedMvo2.oxygenDemand.totalMlO2PerMinPer100G
        : null;
    default:
      return null;
  }
}

function ArticleReaderControlsV3({
  briefing,
  compact = false,
  contract,
  runtime,
  snapshot,
}: Readonly<{
  briefing: ExperimentPlacementBriefingV2;
  compact?: boolean;
  contract: ModelContractV2;
  runtime: ArticleReaderRuntimeHookV3;
  snapshot: ExperimentSnapshotV2;
}>) {
  const { t } = useTranslation();
  return (
    <section
      className={`workbench-control-pane rounded-xl bg-wb-inspector p-3 ${compact ? "mb-5" : "mb-7"}`}
      aria-label={t("articleReader.controls")}
    >
      <div className="workbench-control-list">
        {[...briefing.controls].sort(compareOrderV3).map((control) => {
          const definition = contract.controlCatalog.find(
            ({ controlId }) => controlId === control.controlId,
          );
          if (definition === undefined) return null;
          return (
            <ArticleReaderControlV3
              key={`${control.sourcePaneId}:${control.controlId}`}
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
  const targetIds = controlTargetScenarioIdsV3(
    control,
    runtime.state.activeScenarioId,
  );
  const primaryTargetId =
    targetIds[0] ?? briefing.scenarioScope.initialFocusScenarioId;
  const targetValues = targetIds.map(
    (scenarioId) =>
      runtime.state.committedControlValues[scenarioId]?.[control.controlId] ??
      readerControlInitialValueV3(
        snapshot,
        scenarioId,
        definition,
        runtime.fixtureProjection,
      ),
  );
  const committedRuntimeValue =
    runtime.state.committedControlValues[primaryTargetId]?.[control.controlId];
  const initialValue =
    committedRuntimeValue ??
    readerControlInitialValueV3(
      snapshot,
      primaryTargetId,
      definition,
      runtime.fixtureProjection,
    );
  const [value, setValue] = React.useState(initialValue);
  const [error, setError] = React.useState<string | null>(null);
  const committedRef = React.useRef(initialValue);
  const commitInFlightRef = React.useRef(false);
  const controlInstanceId = articleReaderControlInstanceIdV3(control);
  const mixed =
    targetValues.length > 1 &&
    targetValues.some((candidate) => candidate !== targetValues[0]);

  React.useEffect(() => {
    const next =
      committedRuntimeValue ??
      readerControlInitialValueV3(
        snapshot,
        primaryTargetId,
        definition,
        runtime.fixtureProjection,
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
        controlInstanceId,
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
  const pending = runtime.state.pendingControlInstanceId === controlInstanceId;
  const controlsDisabled =
    runtime.state.status === "idle" ||
    runtime.state.status === "starting" ||
    runtime.state.status === "applying-control" ||
    runtime.state.status === "requesting-analysis" ||
    runtime.state.status === "failed" ||
    runtime.state.status === "disposed" ||
    targetIds.length === 0;
  const targetLabels = targetIds.flatMap((scenarioId) => {
    const scenario = snapshot.content.scenarios.find(
      (candidate) => candidate.scenarioId === scenarioId,
    );
    return scenario === undefined ? [] : [scenario.label];
  });
  const contextLabel =
    targetLabels.length > 0
      ? targetLabels.join(", ")
      : control.binding.mode === "reader-focus"
        ? t("articleReader.noControlTarget")
        : undefined;
  const controlError =
    runtime.state.controlErrorByInstanceId[controlInstanceId] ?? error;

  return (
    <ExperimentNumericControlV3
      contextLabel={contextLabel}
      control={definition}
      disabled={controlsDisabled || pending}
      error={controlError}
      label={control.label}
      mixed={mixed}
      pending={pending}
      presentation={control.presentation}
      value={value}
      onCommit={async (next) => {
        try {
          await commit(next);
          setValue(next);
          return true;
        } catch (cause) {
          setError(readerErrorMessageV3(cause));
          return false;
        }
      }}
    />
  );
}

export function articleReaderControlInstanceIdV3(
  control: Pick<
    ExperimentPlacementBriefingControlV2,
    "sourcePaneId" | "controlId"
  >,
): string {
  return `${control.sourcePaneId}\u001f${control.controlId}`;
}

/**
 * Non-modal Reader companion surface. The page owns its width and motion so
 * opening Peek changes the available article measure instead of covering it.
 */
export function ArticleReaderExperimentPeekPanelV3({
  children,
  maximized,
  title,
  onClose,
  onOpenExperimentSession,
  onToggleMaximized,
  onTitleCommit,
}: Readonly<{
  children: React.ReactNode;
  maximized: boolean;
  title: string;
  onClose(): void;
  onOpenExperimentSession?(): void;
  onToggleMaximized?(): void;
  onTitleCommit?(title: string): void;
}>) {
  const { t } = useTranslation();
  const panelRef = React.useRef<HTMLElement>(null);
  const titleInputRef = React.useRef<HTMLInputElement>(null);
  const [draftTitle, setDraftTitle] = React.useState(title);
  React.useEffect(() => {
    if (document.activeElement !== titleInputRef.current) setDraftTitle(title);
  }, [title]);
  React.useEffect(() => {
    const panel = panelRef.current;
    if (panel === null) return undefined;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    panel.querySelector<HTMLElement>("[data-reader-peek-close]")?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <section
      ref={panelRef}
      id="article-reader-experiment-companion-v3"
      role="region"
      aria-labelledby="article-reader-peek-title-v3"
      className="flex h-full min-w-0 flex-col bg-wb-floating text-wb-text"
      data-testid="article-reader-experiment-peek-v3"
      data-reader-presentation="peek"
      data-peek-maximized={maximized ? "true" : "false"}
    >
      <header className="flex h-12 shrink-0 items-center gap-3 px-4">
        {onTitleCommit === undefined ? (
          <h2
            id="article-reader-peek-title-v3"
            className="min-w-0 flex-1 truncate text-sm font-semibold tracking-[-0.012em]"
          >
            {title}
          </h2>
        ) : (
          <input
            ref={titleInputRef}
            id="article-reader-peek-title-v3"
            value={draftTitle}
            maxLength={240}
            aria-label={t("articleReader.drawerTitle")}
            className="min-w-0 flex-1 truncate border-0 bg-transparent p-0 text-sm font-semibold tracking-[-0.012em] text-wb-text outline-none ring-0 selection:bg-wb-accent/25 focus:outline-none focus:ring-0"
            style={{ caretColor: "var(--wb-accent)" }}
            onChange={(event) => setDraftTitle(event.currentTarget.value)}
            onBlur={() => {
              const normalized = draftTitle.trim();
              onTitleCommit(normalized);
              setDraftTitle(normalized.length > 0 ? normalized : title);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              } else if (event.key === "Escape") {
                event.preventDefault();
                setDraftTitle(title);
                event.currentTarget.blur();
              }
            }}
          />
        )}
        {onOpenExperimentSession !== undefined && (
          <button
            type="button"
            onClick={onOpenExperimentSession}
            aria-label={
              onTitleCommit === undefined
                ? t("articleReader.openExperimentSession")
                : t("articleReader.editBriefing")
            }
            title={
              onTitleCommit === undefined
                ? t("articleReader.openExperimentSession")
                : t("articleReader.editBriefing")
            }
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          >
            <FlaskConical className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        {onToggleMaximized !== undefined && (
          <button
            type="button"
            onClick={onToggleMaximized}
            aria-pressed={maximized}
            aria-label={
              maximized
                ? t("articleReader.restoreSplitView")
                : t("articleReader.openFullscreen")
            }
            title={
              maximized
                ? t("articleReader.restoreSplitView")
                : t("articleReader.openFullscreen")
            }
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          >
            {maximized ? (
              <Minimize2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          data-reader-peek-close
          aria-label={t("articleReader.closeDrawer")}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto pt-2">{children}</div>
    </section>
  );
}

function ArticleReaderExperimentDrawerV3({
  children,
  onClose,
  onOpenExperimentSession,
}: Readonly<{
  children: React.ReactNode;
  onClose(): void;
  onOpenExperimentSession?(): void;
}>) {
  const { t } = useTranslation();
  const dialogRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return undefined;
    const opener =
      document.activeElement instanceof HTMLElement
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
    const focusable = () =>
      [
        ...dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((element) => !element.hidden);
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
    <div
      className="fixed inset-0 z-[90]"
      data-testid="article-reader-experiment-drawer-v3"
    >
      <div
        aria-hidden="true"
        className="article-reader-drawer-backdrop absolute inset-0 bg-[#03101f]/55 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside
        ref={dialogRef}
        id="article-reader-experiment-companion-v3"
        role="dialog"
        aria-modal="true"
        aria-labelledby="article-reader-drawer-title-v3"
        tabIndex={-1}
        className="article-reader-drawer absolute inset-y-0 right-0 flex w-full flex-col overflow-hidden bg-wb-floating text-wb-text shadow-[-18px_0_55px_rgba(2,12,25,0.24)]"
        data-reader-presentation="fullscreen"
      >
        <header className="flex h-12 shrink-0 items-center gap-3 px-3 sm:px-5">
          <h2
            id="article-reader-drawer-title-v3"
            className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight"
          >
            {t("articleReader.drawerTitle")}
          </h2>
          {onOpenExperimentSession !== undefined && (
            <button
              type="button"
              onClick={onOpenExperimentSession}
              aria-label={t("articleReader.openExperimentSession")}
              title={t("articleReader.openExperimentSession")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
            >
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
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
        <div className="min-h-0 flex-1 overflow-y-auto pt-2">{children}</div>
      </aside>
    </div>
  );
}

export type ArticleReaderResolvedGraphPresentationV3 = Readonly<{
  /** Exact graph pane pinned by the Snapshot and Placement Briefing. */
  pane: ExperimentSurfaceGraphPaneV2;
  label: string;
  legend: "auto" | "hidden" | "compact" | "full";
  series: readonly ExperimentPlacementBriefingGraphSeriesV2[];
  windowSec: number | undefined;
  historyDepth: number;
}>;

/**
 * Materializes the single graph contract consumed by inflow, Peek, and
 * fullscreen. Presentation extent may change, but renderer semantics never do.
 */
export function resolveArticleReaderGraphPresentationV3(
  snapshot: ExperimentSnapshotV2,
  briefing: ExperimentPlacementBriefingGraphV2,
): ArticleReaderResolvedGraphPresentationV3 | null {
  const pane = graphPaneForBriefingV3(snapshot, briefing);
  if (pane === null) return null;
  return Object.freeze({
    pane,
    label: briefing.overrides?.label ?? pane.label,
    legend: briefing.overrides?.legend ?? "auto",
    series: briefingGraphSeriesV3(pane, briefing),
    windowSec: briefing.overrides?.windowSec ?? pane.windowSec,
    historyDepth: briefing.overrides?.historyDepth ?? pane.historyDepth ?? 1,
  });
}

function graphPaneForBriefingV3(
  snapshot: ExperimentSnapshotV2,
  briefing: ExperimentPlacementBriefingGraphV2,
): ExperimentSurfaceGraphPaneV2 | null {
  return (
    snapshot.content.surface.graphPanes.find(
      ({ paneId }) => paneId === briefing.paneId,
    ) ?? null
  );
}

export function readerStructuralAnalysisRequestsV3(
  briefing: ExperimentPlacementBriefingV2,
  snapshot: ExperimentSnapshotV2,
  contract: ModelContractV2,
): readonly ArticleReaderStructuralAnalysisRequestV3[] {
  const historyDepthByAnalysisId = new Map<string, number>();
  for (const pickedGraph of briefing.graphs) {
    const resolved = resolveArticleReaderGraphPresentationV3(
      snapshot,
      pickedGraph,
    );
    if (resolved === null) continue;
    const { pane } = resolved;
    const graph = contract.graphCatalog.find(
      ({ graphId }) => graphId === pane.graphId,
    );
    const { historyDepth } = resolved;
    const analysisId =
      graph?.renderer === "structural-return"
        ? MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID
        : graph?.renderer === "pressure-volume"
          ? MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID
          : null;
    if (analysisId === null) continue;
    historyDepthByAnalysisId.set(
      analysisId,
      Math.max(historyDepthByAnalysisId.get(analysisId) ?? 0, historyDepth),
    );
  }
  if (
    briefing.outputs.some(({ outputId }) =>
      ARTICLE_READER_PERIODIC_PVA_OUTPUT_ID_SET_V3.has(outputId),
    )
  ) {
    historyDepthByAnalysisId.set(
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
      historyDepthByAnalysisId.get(
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
      ) ?? 0,
    );
  }
  return Object.freeze(
    [...historyDepthByAnalysisId].map(([analysisId, historyDepth]) =>
      Object.freeze({ analysisId, historyDepth }),
    ),
  );
}

function briefingGraphSeriesV3(
  pane: ExperimentSurfaceGraphPaneV2,
  briefing: ExperimentPlacementBriefingGraphV2,
) {
  return Object.freeze(
    [...(briefing.overrides?.series ?? pane.series)].sort(compareOrderV3),
  );
}

function articleBriefingTraceColorV3(
  briefing: ExperimentPlacementBriefingGraphV2,
  scenarioId: string,
  seriesId: string | null,
): string | null {
  return (
    briefing.overrides?.traceColors?.find(
      (trace) => trace.scenarioId === scenarioId && trace.seriesId === seriesId,
    )?.colorHex ?? null
  );
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
  projection: ExactModelFixtureProjectionV1,
): number {
  const fixture = snapshot.content.scenarios.find(
    (scenario) => scenario.scenarioId === scenarioId,
  )?.capture.fixture;
  return resolveExactModelControlValueV1(definition, fixture, projection);
}

export function selectedSweepOutputIdsV3(
  graph: SweepGraphDefinitionV2,
  selectedSeries: readonly Readonly<{ seriesId: string }>[],
): readonly string[] {
  const selectedIds = new Set(selectedSeries.map(({ seriesId }) => seriesId));
  return Object.freeze(
    graph.seriesCatalog.flatMap((series) =>
      selectedIds.has(series.seriesId) ? [series.outputId] : [],
    ),
  );
}

export function commonGraphUnitV3(
  contract: ModelContractV2,
  outputIds: readonly string[],
): string | undefined {
  const units = outputIds.flatMap((outputId) => {
    const output = contract.outputCatalog.find(
      (candidate) => candidate.outputId === outputId,
    );
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

function readerErrorMessageV3(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

function requiredArticleReaderRuntimeCompositionV3(
  composition: StudioClientCompositionV2 | null,
): Readonly<{
  releaseTicket:
    StudioClientCompositionV2["exactModel"]["workerReleaseTicket"];
  fixtureProjection:
    StudioClientCompositionV2["exactModel"]["fixtureProjection"];
  resolveAnalysisExecutionPlan:
    StudioClientCompositionV2["modelSurface"]["analysis"]["resolveExecutionPlan"];
  periodicPvaDerivation:
    StudioClientCompositionV2["modelSurface"]["analysis"]["periodicPvaDerivation"];
}> {
  if (composition === null) {
    throw new Error(
      "Article Reader Standard runtime composition is unavailable",
    );
  }
  return Object.freeze({
    releaseTicket: composition.exactModel.workerReleaseTicket,
    fixtureProjection: composition.exactModel.fixtureProjection,
    resolveAnalysisExecutionPlan: composition.modelSurface.analysis.resolveExecutionPlan,
    periodicPvaDerivation: composition.modelSurface.analysis.periodicPvaDerivation,
  });
}

export function articleReaderBoundedHistoryV3<T>(
  history: readonly T[],
  depth: number,
): readonly T[] {
  if (depth <= 0) return [];
  return history.slice(-depth);
}
