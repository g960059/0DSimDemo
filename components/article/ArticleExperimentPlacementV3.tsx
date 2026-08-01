import React from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  GripVertical,
  SlidersHorizontal,
  Trash2,
  Waves,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  StudioArticleExperimentBlockV2,
} from "@/studio/contracts/v2/article";
import type {
  ExperimentPlacementBriefingV2,
  ExperimentPlacementV2,
  ExperimentSnapshotV2,
} from "@/studio/contracts/v2/content";
import {
  articleSurfacePanesV3,
  resolveArticlePlacementPanesV3,
  type ArticleResolvedPaneV3,
  type ArticleSurfacePaneV3,
} from "./ArticleEditorStateV3";

export type ArticleExperimentPlacementV3Props = Readonly<{
  block: StudioArticleExperimentBlockV2;
  snapshot: ExperimentSnapshotV2 | null;
  index: number;
  total: number;
  onChange: (block: StudioArticleExperimentBlockV2) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}>;

export function ArticleExperimentPlacementV3({
  block,
  snapshot,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: ArticleExperimentPlacementV3Props) {
  const { t } = useTranslation();
  const [briefingOpen, setBriefingOpen] = React.useState(false);
  const placement = block.placement;

  const updatePlacement = React.useCallback((next: ExperimentPlacementV2) => {
    onChange(Object.freeze({ ...block, placement: next }));
  }, [block, onChange]);

  if (snapshot === null) {
    return (
      <section
        className="group my-8 rounded-xl bg-wb-danger-soft px-4 py-4"
        data-testid="article-experiment-placement-v3"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-wb-danger">
              {t("articleEditor.missingSnapshot.title")}
            </p>
            <p className="mt-1 break-all font-mono text-[10px] text-wb-muted">
              {placement.snapshotId}
            </p>
          </div>
          <PlacementBlockActionsV3
            index={index}
            total={total}
            onMove={onMove}
            onRemove={onRemove}
          />
        </div>
      </section>
    );
  }

  const resolvedPanes = resolveArticlePlacementPanesV3(placement, snapshot);
  const highestPriority = resolvedPanes.reduce(
    (highest, item) => Math.max(highest, item.priority),
    -1,
  );
  const visibleScenarios = placement.briefing?.scenarioIds === undefined
    ? snapshot.content.scenarios
    : snapshot.content.scenarios.filter(({ scenarioId }) =>
      placement.briefing?.scenarioIds?.includes(scenarioId));

  return (
    <section
      className="group relative my-8 rounded-2xl bg-wb-soft/70 px-4 py-4 sm:px-5 sm:py-5"
      data-testid="article-experiment-placement-v3"
      data-snapshot-id={snapshot.snapshotId}
      data-static-preview="true"
    >
      <header className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-wb-panel text-wb-accent">
          <Waves className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="truncate text-sm font-semibold tracking-tight">
              {visibleScenarios[0]?.label
                ?? snapshot.content.scenarios[0]?.label
                ?? snapshot.experimentId}
            </h2>
            <span className="rounded-full bg-wb-panel px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-wb-subtle">
              {t("articleEditor.pinned")}
            </span>
            <span className="rounded-full bg-wb-panel px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-wb-subtle">
              {t("articleEditor.staticPreview")}
            </span>
          </div>
          <p className="mt-1 truncate font-mono text-[9px] text-wb-subtle">
            {snapshot.snapshotId}
          </p>
        </div>
        <PlacementBlockActionsV3
          index={index}
          total={total}
          onMove={onMove}
          onRemove={onRemove}
        />
      </header>

      <div
        className="mt-4 grid grid-cols-1 gap-2.5 md:grid-cols-2"
        aria-label={t("articleEditor.previewLabel")}
      >
        {resolvedPanes.map((resolved) => (
          <ArticleStaticPanePreviewV3
            key={resolved.pane.paneId}
            resolved={resolved}
            prominent={resolved.priority === highestPriority}
          />
        ))}
        {resolvedPanes.length === 0 && (
          <p className="col-span-full py-8 text-center text-xs text-wb-subtle">
            {t("articleEditor.emptyBriefing")}
          </p>
        )}
      </div>

      {snapshot.content.surface.note.text.length > 0 && (
        <p className="mt-4 whitespace-pre-wrap text-xs leading-6 text-wb-muted">
          {snapshot.content.surface.note.text}
        </p>
      )}

      <label className="mt-4 block">
        <span className="sr-only">{t("articleEditor.caption")}</span>
        <input
          type="text"
          value={placement.caption ?? ""}
          onChange={(event) => updatePlacement(Object.freeze({
            ...placement,
            caption: event.currentTarget.value,
          }))}
          placeholder={t("articleEditor.captionPlaceholder")}
          className="w-full bg-transparent py-1 text-xs leading-5 text-wb-muted outline-none placeholder:text-wb-subtle focus:text-wb-text"
        />
      </label>

      <button
        type="button"
        aria-expanded={briefingOpen}
        onClick={() => setBriefingOpen((value) => !value)}
        className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-[11px] font-medium text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        {t("articleEditor.briefing.edit")}
        {briefingOpen
          ? <ChevronUp className="h-3.5 w-3.5" />
          : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {briefingOpen && (
        <ArticleBriefingEditorV3
          placement={placement}
          snapshot={snapshot}
          onChange={updatePlacement}
        />
      )}
    </section>
  );
}

function ArticleStaticPanePreviewV3({
  resolved,
  prominent,
}: Readonly<{
  resolved: ArticleResolvedPaneV3;
  prominent: boolean;
}>) {
  const { t } = useTranslation();
  const { pane, priority } = resolved;
  return (
    <article
      className={`min-w-0 rounded-xl bg-wb-panel p-3.5 ${prominent ? "md:col-span-2" : ""}`}
      style={pane.role === "graph"
        ? { boxShadow: `inset 2px 0 0 ${pane.colorHex}` }
        : undefined}
      data-pane-id={pane.paneId}
      data-pane-priority={priority}
      data-pane-role={pane.role}
    >
      <header className="flex items-center gap-2">
        {pane.role === "graph" && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: pane.colorHex }}
            aria-hidden="true"
          />
        )}
        <h3 className="min-w-0 flex-1 truncate text-[11px] font-semibold">
          {pane.label}
        </h3>
        <span className="text-[9px] tabular-nums text-wb-subtle">
          {t("articleEditor.briefing.priorityShort", { priority })}
        </span>
      </header>

      {pane.role === "graph" && (
        <div className="mt-3 rounded-lg bg-wb-app/55 px-3 py-4">
          <div className="flex min-h-12 flex-wrap content-center gap-x-3 gap-y-2">
            {(pane.series.length > 0 ? pane.series : [{
              outputId: pane.graphId,
              label: pane.label,
              colorHex: pane.colorHex,
              order: 0,
            }]).map((series) => (
              <span
                key={series.outputId}
                className="inline-flex items-center gap-1.5 text-[10px] text-wb-muted"
              >
                <span
                  className="h-px w-4"
                  style={{ backgroundColor: series.colorHex }}
                  aria-hidden="true"
                />
                {series.label}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[9px] text-wb-subtle">
            {t("articleEditor.staticDataNotice")}
          </p>
        </div>
      )}

      {pane.role === "output" && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          {pane.items.map((item) => (
            <div key={item.outputId} className="min-w-0">
              <dt className="flex items-center gap-1.5 truncate text-[9px] text-wb-muted">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.colorHex }}
                  aria-hidden="true"
                />
                {item.label}
              </dt>
              <dd className="mt-0.5 font-mono text-sm text-wb-subtle">—</dd>
            </div>
          ))}
        </dl>
      )}

      {pane.role === "control" && (
        <ul className="mt-3 grid gap-2">
          {pane.items.map((item) => (
            <li key={item.controlId} className="flex items-center gap-2 text-[10px] text-wb-muted">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.colorHex }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <span className="text-wb-subtle">
                {t("articleEditor.scenarioCount", { count: item.targetScenarioIds.length })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function ArticleBriefingEditorV3({
  placement,
  snapshot,
  onChange,
}: Readonly<{
  placement: ExperimentPlacementV2;
  snapshot: ExperimentSnapshotV2;
  onChange: (placement: ExperimentPlacementV2) => void;
}>) {
  const { t } = useTranslation();
  const panes = articleSurfacePanesV3(snapshot.content.surface);
  const briefing: ExperimentPlacementBriefingV2 = placement.briefing ?? {
    panePicks: panes.map(({ paneId, priority }) => ({ paneId, priority })),
  };
  const pickById = new Map(briefing.panePicks.map((pick) => [pick.paneId, pick]));

  const updateBriefing = (next: ExperimentPlacementBriefingV2) => {
    onChange(Object.freeze({ ...placement, briefing: Object.freeze(next) }));
  };

  const updatePanePick = (pane: ArticleSurfacePaneV3, enabled: boolean) => {
    updateBriefing({
      ...briefing,
      panePicks: enabled
        ? [...briefing.panePicks, { paneId: pane.paneId, priority: pane.priority }]
        : briefing.panePicks.filter(({ paneId }) => paneId !== pane.paneId),
    });
  };

  const updatePriority = (paneId: string, priority: number) => {
    const normalizedPriority = Number.isFinite(priority)
      ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.round(priority)))
      : 0;
    updateBriefing({
      ...briefing,
      panePicks: briefing.panePicks.map((pick) => pick.paneId === paneId
        ? { ...pick, priority: normalizedPriority }
        : pick),
    });
  };

  const selectedScenarioIds = briefing.scenarioIds
    ?? snapshot.content.scenarios.map(({ scenarioId }) => scenarioId);

  return (
    <div
      className="mt-3 rounded-xl bg-wb-panel px-3 py-3.5 sm:px-4"
      data-testid="article-briefing-editor-v3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold">{t("articleEditor.briefing.title")}</p>
          <p className="mt-1 text-[10px] leading-4 text-wb-subtle">
            {t("articleEditor.briefing.description")}
          </p>
        </div>
        <span className="shrink-0 text-[10px] tabular-nums text-wb-subtle">
          {t("articleEditor.briefing.selected", { count: briefing.panePicks.length })}
        </span>
      </div>

      <fieldset className="mt-3 grid gap-1.5">
        <legend className="sr-only">{t("articleEditor.briefing.panes")}</legend>
        {panes.map((pane) => {
          const pick = pickById.get(pane.paneId);
          return (
            <div
              key={pane.paneId}
              className="flex min-h-10 items-center gap-2 rounded-lg px-2 transition-colors duration-150 hover:bg-wb-hover"
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={pick !== undefined}
                  onChange={(event) => updatePanePick(pane, event.currentTarget.checked)}
                  className="h-3.5 w-3.5 accent-wb-accent"
                />
                {pane.role === "graph" && (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: pane.colorHex }}
                    aria-hidden="true"
                  />
                )}
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                  {pane.label}
                </span>
                <span className="shrink-0 text-[9px] uppercase tracking-wide text-wb-subtle">
                  {t(`articleEditor.role.${pane.role}`)}
                </span>
              </label>
              {pick !== undefined && (
                <div className="flex shrink-0 items-center gap-0.5">
                  <PriorityButtonV3
                    label={t("articleEditor.briefing.lowerPriority")}
                    disabled={pick.priority === 0}
                    onClick={() => updatePriority(pane.paneId, pick.priority - 1)}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </PriorityButtonV3>
                  <label className="sr-only" htmlFor={`priority-${placement.placementId}-${pane.paneId}`}>
                    {t("articleEditor.briefing.priorityFor", { label: pane.label })}
                  </label>
                  <input
                    id={`priority-${placement.placementId}-${pane.paneId}`}
                    type="number"
                    min={0}
                    step={1}
                    value={pick.priority}
                    onChange={(event) => updatePriority(
                      pane.paneId,
                      Number(event.currentTarget.value),
                    )}
                    className="h-7 w-10 rounded-md bg-wb-input px-1 text-center font-mono text-[10px] outline-none focus:ring-2 focus:ring-wb-accent"
                  />
                  <PriorityButtonV3
                    label={t("articleEditor.briefing.raisePriority")}
                    onClick={() => updatePriority(pane.paneId, pick.priority + 1)}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </PriorityButtonV3>
                </div>
              )}
            </div>
          );
        })}
      </fieldset>

      {snapshot.content.scenarios.length > 1 && (
        <fieldset className="mt-4 pt-3">
          <legend className="text-[10px] font-semibold uppercase tracking-[0.12em] text-wb-subtle">
            {t("articleEditor.briefing.scenarios")}
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {snapshot.content.scenarios.map((scenario) => (
              <label
                key={scenario.scenarioId}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-wb-soft px-2.5 py-1.5 text-[10px] text-wb-muted"
              >
                <input
                  type="checkbox"
                  checked={selectedScenarioIds.includes(scenario.scenarioId)}
                  onChange={(event) => {
                    const nextIds = event.currentTarget.checked
                      ? [...selectedScenarioIds, scenario.scenarioId]
                      : selectedScenarioIds.filter((id) => id !== scenario.scenarioId);
                    updateBriefing({ ...briefing, scenarioIds: nextIds });
                  }}
                  className="h-3 w-3 accent-wb-accent"
                />
                {scenario.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}

function PriorityButtonV3({
  children,
  label,
  disabled = false,
  onClick,
}: Readonly<{
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-wb-subtle transition-[color,background-color,transform] duration-150 hover:bg-wb-soft hover:text-wb-text active:scale-[0.96] disabled:pointer-events-none disabled:opacity-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
    >
      {children}
    </button>
  );
}

function PlacementBlockActionsV3({
  index,
  total,
  onMove,
  onRemove,
}: Readonly<{
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}>) {
  const { t } = useTranslation();
  return (
    <div className="flex shrink-0 items-center gap-0.5 text-wb-subtle">
      <GripVertical className="mr-0.5 hidden h-4 w-4 opacity-40 sm:block" aria-hidden="true" />
      <PlacementActionV3
        label={t("articleEditor.moveUp")}
        disabled={index === 0}
        onClick={() => onMove(-1)}
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </PlacementActionV3>
      <PlacementActionV3
        label={t("articleEditor.moveDown")}
        disabled={index === total - 1}
        onClick={() => onMove(1)}
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </PlacementActionV3>
      <PlacementActionV3 label={t("articleEditor.removeBlock")} onClick={onRemove}>
        <Trash2 className="h-3.5 w-3.5" />
      </PlacementActionV3>
    </div>
  );
}

function PlacementActionV3({
  children,
  label,
  disabled = false,
  onClick,
}: Readonly<{
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.96] disabled:pointer-events-none disabled:opacity-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
    >
      {children}
    </button>
  );
}
