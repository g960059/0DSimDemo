import React from "react";
import { WorkbenchPaneSettingsButtonV3 } from "./WorkbenchPaneSettingsButtonV3";
import {
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Plus,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  WorkbenchAddPaneOptionV3,
  WorkbenchPaneAddRequestV3,
  WorkbenchPaneDefinitionV3,
} from "@/components/workbench/WorkbenchDockview";

export type WorkbenchMobileTaskV3 = "control" | "output" | "scenarios";

type WorkbenchMobileStageDeckPropsV3 = Readonly<{
  graphPanes: readonly WorkbenchPaneDefinitionV3[];
  outputPanes: readonly WorkbenchPaneDefinitionV3[];
  controlPanes: readonly WorkbenchPaneDefinitionV3[];
  graphAddOptions: readonly WorkbenchAddPaneOptionV3[];
  scenarioContent: React.ReactNode;
  scenarioError?: React.ReactNode;
  renderGraphPane: (pane: WorkbenchPaneDefinitionV3) => React.ReactNode;
  renderOutputPane: (pane: WorkbenchPaneDefinitionV3) => React.ReactNode;
  renderControlPane: (pane: WorkbenchPaneDefinitionV3) => React.ReactNode;
  onOpenPaneSettings: (paneId: string, section?: "items" | "binding", intent?: "add" | "manage", anchor?: HTMLElement) => void;
  onAddGraphPane: WorkbenchPaneAddRequestV3;
  onAddOutputPane: WorkbenchPaneAddRequestV3;
  onAddControlPane: WorkbenchPaneAddRequestV3;
}>;

const firstPaneIdV3 = (
  panes: readonly WorkbenchPaneDefinitionV3[],
): string | null => panes[0]?.paneId ?? null;

function useReconciledPaneSelectionV3(
  panes: readonly WorkbenchPaneDefinitionV3[],
): readonly [string | null, React.Dispatch<React.SetStateAction<string | null>>] {
  const paneIdSignature = JSON.stringify(panes.map(({ paneId }) => paneId));
  const [paneId, setPaneId] = React.useState<string | null>(() =>
    firstPaneIdV3(panes));
  React.useEffect(() => {
    setPaneId((current) =>
      current !== null && panes.some((pane) => pane.paneId === current)
        ? current
        : firstPaneIdV3(panes));
  }, [paneIdSignature]);
  return [paneId, setPaneId] as const;
}

function useReconciledPaneExpansionV3(
  panes: readonly WorkbenchPaneDefinitionV3[],
): readonly [ReadonlySet<string>, (paneId: string) => void, (paneId: string) => void] {
  const paneIdSignature = JSON.stringify(panes.map(({ paneId }) => paneId));
  const knownPaneIdsRef = React.useRef<ReadonlySet<string>>(
    new Set(panes.map(({ paneId }) => paneId)),
  );
  const [expandedPaneIds, setExpandedPaneIds] = React.useState<ReadonlySet<string>>(
    () => new Set(panes.map(({ paneId }) => paneId)),
  );

  React.useEffect(() => {
    const currentPaneIds = new Set(panes.map(({ paneId }) => paneId));
    const previouslyKnownPaneIds = knownPaneIdsRef.current;
    knownPaneIdsRef.current = currentPaneIds;
    setExpandedPaneIds((current) => {
      const next = new Set(
        [...current].filter((paneId) => currentPaneIds.has(paneId)),
      );
      for (const paneId of currentPaneIds) {
        if (!previouslyKnownPaneIds.has(paneId)) next.add(paneId);
      }
      return next;
    });
  }, [paneIdSignature]);

  const togglePane = React.useCallback((paneId: string) => {
    setExpandedPaneIds((current) => {
      const next = new Set(current);
      if (next.has(paneId)) next.delete(paneId);
      else next.add(paneId);
      return next;
    });
  }, []);
  const expandPane = React.useCallback((paneId: string) => {
    setExpandedPaneIds((current) => {
      if (current.has(paneId)) return current;
      return new Set([...current, paneId]);
    });
  }, []);

  return [expandedPaneIds, togglePane, expandPane] as const;
}

function useReconciledSinglePaneExpansionV3(
  panes: readonly WorkbenchPaneDefinitionV3[],
): readonly [string | null, React.Dispatch<React.SetStateAction<string | null>>] {
  const paneIdSignature = JSON.stringify(panes.map(({ paneId }) => paneId));
  const knownPaneIdsRef = React.useRef<ReadonlySet<string>>(
    new Set(panes.map(({ paneId }) => paneId)),
  );
  const [expandedPaneId, setExpandedPaneId] = React.useState<string | null>(
    () => firstPaneIdV3(panes),
  );

  React.useEffect(() => {
    const currentPaneIds = new Set(panes.map(({ paneId }) => paneId));
    const previouslyKnownPaneIds = knownPaneIdsRef.current;
    knownPaneIdsRef.current = currentPaneIds;
    setExpandedPaneId((current) => {
      if (current !== null && currentPaneIds.has(current)) return current;
      const newlyAddedPane = panes.find(
        ({ paneId }) => !previouslyKnownPaneIds.has(paneId),
      );
      if (newlyAddedPane !== undefined) return newlyAddedPane.paneId;
      return current === null ? null : firstPaneIdV3(panes);
    });
  }, [paneIdSignature]);

  return [expandedPaneId, setExpandedPaneId] as const;
}

/**
 * Smartphone presentation shell. It intentionally owns no numerical or
 * durable Experiment state: it projects the same panes and callbacks used by
 * the desktop Workbench while replacing Dockview and nested scroll regions.
 */
export function WorkbenchMobileStageDeckV3({
  graphPanes,
  outputPanes,
  controlPanes,
  graphAddOptions,
  scenarioContent,
  scenarioError,
  renderGraphPane,
  renderOutputPane,
  renderControlPane,
  onOpenPaneSettings,
  onAddGraphPane,
  onAddOutputPane,
  onAddControlPane,
}: WorkbenchMobileStageDeckPropsV3) {
  const { t } = useTranslation();
  const [activeTask, setActiveTask] = React.useState<WorkbenchMobileTaskV3>(
    "control",
  );
  const [graphFocused, setGraphFocused] = React.useState(false);
  const [graphPaneId, setGraphPaneId] = useReconciledPaneSelectionV3(
    graphPanes,
  );
  const [expandedControlPaneId, setExpandedControlPaneId] =
    useReconciledSinglePaneExpansionV3(
      controlPanes,
    );
  const [expandedOutputPaneIds, toggleOutputPane, expandOutputPane] =
    useReconciledPaneExpansionV3(outputPanes);
  const activeGraphPane = graphPanes.find(
    ({ paneId }) => paneId === graphPaneId,
  ) ?? null;
  const tabId = React.useId();

  const chooseTask = (task: WorkbenchMobileTaskV3) => {
    setActiveTask(task);
    setGraphFocused(false);
  };

  const addPane = (area: "control" | "output", anchor: HTMLElement) => {
    const request = area === "control" ? onAddControlPane : onAddOutputPane;
    request(anchor, paneId => {
      if (area === "control") setExpandedControlPaneId(paneId);
      else expandOutputPane(paneId);
    });
  };

  return (
    <main
      className="workbench-mobile-stage-deck min-h-0 flex-1"
      data-graph-focused={graphFocused ? "true" : "false"}
      data-testid="workbench-mobile-stage-deck"
    >
      <section
        className="workbench-mobile-stage min-h-0 overflow-hidden"
        aria-label={t("workbench.live.graphArea")}
        data-testid="workbench-mobile-stage"
      >
        <div
          id={`${tabId}-graph-panel`}
          role="tabpanel"
          aria-labelledby={graphPaneId === null
            ? undefined
            : `${tabId}-graph-${graphPaneId}`}
          className="min-h-0 flex-1 overflow-hidden bg-wb-canvas"
        >
          {activeGraphPane === null
            ? (
              <MobileEmptyPaneV3
                message={t("workbench.editor.emptyPaneArea")}
              />
            )
            : renderGraphPane(activeGraphPane)}
        </div>
        <MobileGraphViewRailV3
          tabId={tabId}
          panes={graphPanes}
          selectedPaneId={graphPaneId}
          addOptions={graphAddOptions}
          onSelectPane={setGraphPaneId}
          onAddOption={anchor => onAddGraphPane(anchor, setGraphPaneId)}
          graphFocused={graphFocused}
          onToggleGraphFocus={() => setGraphFocused((current) => !current)}
        />
      </section>

      <section
        className="workbench-mobile-task-deck min-h-0 overflow-hidden"
        aria-label={t("workbench.live.mobileTaskDeck")}
        data-testid="workbench-mobile-task-deck"
      >
        <div
          className="workbench-mobile-task-tabs"
          role="tablist"
          aria-label={t("workbench.live.mobileTaskDeck")}
        >
          {(["control", "output", "scenarios"] as const).map((task) => (
            <button
              key={task}
              id={`${tabId}-${task}-tab`}
              type="button"
              role="tab"
              aria-controls={`${tabId}-${task}-panel`}
              aria-selected={activeTask === task}
              className="workbench-mobile-task-tab"
              onClick={() => chooseTask(task)}
            >
              {t(`workbench.live.mobileTaskTabs.${task}`)}
            </button>
          ))}
        </div>

        {!graphFocused && (
          <div
            id={`${tabId}-${activeTask}-panel`}
            role="tabpanel"
            aria-labelledby={`${tabId}-${activeTask}-tab`}
            className="workbench-mobile-task-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
            data-testid="workbench-mobile-task-scroll"
          >
            {activeTask === "control"
              ? (
                <MobilePaneGroupCollectionV3
                  area="control"
                  panes={controlPanes}
                  expandedPaneIds={new Set(
                    expandedControlPaneId === null
                      ? []
                      : [expandedControlPaneId],
                  )}
                  renderPane={renderControlPane}
                  onTogglePane={(paneId) =>
                    setExpandedControlPaneId((current) =>
                      current === paneId ? null : paneId)}
                  onOpenPaneSettings={onOpenPaneSettings}
                  onAddPane={anchor => addPane("control", anchor)}
                />
              )
              : activeTask === "output"
                ? (
                  <MobilePaneGroupCollectionV3
                    area="output"
                    panes={outputPanes}
                    expandedPaneIds={expandedOutputPaneIds}
                    renderPane={renderOutputPane}
                    onTogglePane={toggleOutputPane}
                    onOpenPaneSettings={onOpenPaneSettings}
                    onAddPane={anchor => addPane("output", anchor)}
                  />
                )
                : (
                  <div className="min-h-full">
                    {scenarioError}
                    {scenarioContent}
                  </div>
                )}
          </div>
        )}
      </section>
    </main>
  );
}

function MobileGraphViewRailV3({
  tabId,
  panes,
  selectedPaneId,
  addOptions,
  onSelectPane,
  onAddOption,
  graphFocused,
  onToggleGraphFocus,
}: Readonly<{
  tabId: string;
  panes: readonly WorkbenchPaneDefinitionV3[];
  selectedPaneId: string | null;
  addOptions: readonly WorkbenchAddPaneOptionV3[];
  onSelectPane: (paneId: string) => void;
  onAddOption: (anchor: HTMLElement) => void;
  graphFocused: boolean;
  onToggleGraphFocus: () => void;
}>) {
  const { t } = useTranslation();
  const tabRefs = React.useRef(new Map<string, HTMLButtonElement>());

  React.useEffect(() => {
    if (selectedPaneId === null) return;
    tabRefs.current.get(selectedPaneId)?.scrollIntoView({
      behavior: "auto",
      block: "nearest",
      inline: "nearest",
    });
  }, [selectedPaneId]);

  const moveSelection = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    paneIndex: number,
  ) => {
    if (panes.length === 0) return;
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (paneIndex + 1) % panes.length;
    else if (event.key === "ArrowLeft") {
      nextIndex = (paneIndex - 1 + panes.length) % panes.length;
    } else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = panes.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const paneId = panes[nextIndex]!.paneId;
    onSelectPane(paneId);
    tabRefs.current.get(paneId)?.focus();
  };

  return (
    <>
      <div
        className="workbench-mobile-graph-view-rail"
        data-testid="workbench-mobile-graph-view-rail"
      >
        <div
          className="workbench-mobile-graph-view-tabs"
          role="tablist"
          aria-label={t("workbench.live.mobileGraphViews")}
        >
          {panes.map((pane, paneIndex) => {
            const selected = pane.paneId === selectedPaneId;
            return (
              <button
                key={pane.paneId}
                ref={(element) => {
                  if (element === null) tabRefs.current.delete(pane.paneId);
                  else tabRefs.current.set(pane.paneId, element);
                }}
                id={`${tabId}-graph-${pane.paneId}`}
                type="button"
                role="tab"
                aria-controls={`${tabId}-graph-panel`}
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                className="workbench-mobile-graph-view-tab"
                onClick={() => onSelectPane(pane.paneId)}
                onKeyDown={(event) => moveSelection(event, paneIndex)}
              >
                <span className="truncate">{pane.title}</span>
              </button>
            );
          })}
        </div>
        <div className="workbench-mobile-graph-view-actions">
          {addOptions.length > 0 && (
            <button
              type="button"
              className="workbench-mobile-graph-view-action"
              aria-label={t("workbench.live.mobileAddGraphView")}
              aria-haspopup="dialog"
              onClick={event => onAddOption(event.currentTarget)}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className="workbench-mobile-graph-view-action"
            aria-label={t(
              graphFocused
                ? "workbench.live.mobileShowTasks"
                : "workbench.live.mobileFocusGraph",
            )}
            aria-pressed={graphFocused}
            onClick={onToggleGraphFocus}
          >
            {graphFocused
              ? <ChevronsDown className="h-4 w-4" aria-hidden="true" />
              : <ChevronsUp className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

    </>
  );
}

function MobilePaneGroupCollectionV3({
  area,
  panes,
  expandedPaneIds,
  renderPane,
  onTogglePane,
  onOpenPaneSettings,
  onAddPane,
}: Readonly<{
  area: "control" | "output";
  panes: readonly WorkbenchPaneDefinitionV3[];
  expandedPaneIds: ReadonlySet<string>;
  renderPane: (pane: WorkbenchPaneDefinitionV3) => React.ReactNode;
  onTogglePane: (paneId: string) => void;
  onOpenPaneSettings: (paneId: string, section?: "items" | "binding", intent?: "add" | "manage", anchor?: HTMLElement) => void;
  onAddPane: (anchor: HTMLElement) => void;
}>) {
  const { t } = useTranslation();
  const collectionLabel = t(
    area === "control"
      ? "workbench.live.mobileControlGroups"
      : "workbench.live.mobileMetricGroups",
  );

  return (
    <div
      className="workbench-mobile-pane-groups"
      data-mobile-pane-groups={area}
      role="group"
      aria-label={collectionLabel}
    >
      {panes.length === 0 && (
        <MobileEmptyPaneV3 message={t("workbench.editor.emptyPaneArea")} />
      )}
      {panes.map((pane) => {
        const expanded = expandedPaneIds.has(pane.paneId);
        const headingId = `mobile-pane-${pane.paneId}-heading`;
        const bodyId = `mobile-pane-${pane.paneId}-body`;
        return (
          <section
            key={pane.paneId}
            className="workbench-mobile-pane-group"
            data-mobile-pane-group-role={area}
            data-expanded={expanded ? "true" : "false"}
            aria-labelledby={headingId}
          >
            <header className="workbench-mobile-pane-group-header">
              <button
                id={headingId}
                type="button"
                className="workbench-mobile-pane-group-toggle"
                aria-controls={bodyId}
                aria-expanded={expanded}
                onClick={() => onTogglePane(pane.paneId)}
              >
                <ChevronRight
                  className="workbench-mobile-pane-group-chevron h-4 w-4"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-start">
                  {pane.title}
                </span>
              </button>
              {!expanded && <WorkbenchPaneSettingsButtonV3 title={pane.title} onOpen={anchor => onOpenPaneSettings(pane.paneId, "items", "manage", anchor)} />}
            </header>
            <div
              id={bodyId}
              className="workbench-mobile-pane-group-body"
              hidden={!expanded}
            >
              {expanded && renderPane(pane)}
            </div>
          </section>
        );
      })}
      <button
        type="button"
        className="workbench-mobile-pane-group-add"
        aria-haspopup="dialog"
        onClick={event => onAddPane(event.currentTarget)}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        <span>
          {t(
            area === "control"
              ? "workbench.live.mobileAddControlGroup"
              : "workbench.live.mobileAddMetricGroup",
          )}
        </span>
      </button>
    </div>
  );
}

function MobileEmptyPaneV3({ message }: Readonly<{ message: string }>) {
  return (
    <div className="grid min-h-full place-items-center p-6 text-xs text-wb-subtle">
      {message}
    </div>
  );
}

export function useMobileWorkbenchShellV3(): boolean {
  const query = "(max-width: 767px)";
  const [matches, setMatches] = React.useState(() =>
    typeof window !== "undefined" && window.matchMedia(query).matches);
  React.useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return matches;
}
