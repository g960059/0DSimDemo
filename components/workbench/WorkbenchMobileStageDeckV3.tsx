import React from "react";
import {
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Plus,
  Settings2,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import type {
  WorkbenchAddPaneOptionV3,
  WorkbenchPaneDefinitionV3,
} from "@/components/workbench/WorkbenchDockview";

export type WorkbenchMobileTaskV3 = "control" | "output" | "scenarios";

const FOCUSABLE_SELECTOR_V3 = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

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
  onOpenPaneSettings: (paneId: string) => void;
  onAddGraphPane: (optionId: string) => string | undefined;
  onAddOutputPane: () => string | undefined;
  onAddControlPane: () => string | undefined;
}>;

const firstPaneIdV3 = (
  panes: readonly WorkbenchPaneDefinitionV3[],
): string | null => panes[0]?.paneId ?? null;

function useReconciledPaneSelectionV3(
  panes: readonly WorkbenchPaneDefinitionV3[],
): readonly [string | null, React.Dispatch<React.SetStateAction<string | null>>] {
  const [paneId, setPaneId] = React.useState<string | null>(() =>
    firstPaneIdV3(panes));
  React.useEffect(() => {
    setPaneId((current) =>
      current !== null && panes.some((pane) => pane.paneId === current)
        ? current
        : firstPaneIdV3(panes));
  }, [panes]);
  return [paneId, setPaneId] as const;
}

function useReconciledPaneExpansionV3(
  panes: readonly WorkbenchPaneDefinitionV3[],
): readonly [ReadonlySet<string>, (paneId: string) => void, (paneId: string) => void] {
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
  }, [panes]);

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
  }, [panes]);

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

  const addPane = (area: "control" | "output") => {
    const paneId = area === "control"
      ? onAddControlPane()
      : onAddOutputPane();
    if (paneId === undefined) return;
    if (area === "control") setExpandedControlPaneId(paneId);
    else expandOutputPane(paneId);
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
          onOpenPaneSettings={onOpenPaneSettings}
          onAddOption={(optionId) => {
            const paneId = onAddGraphPane(optionId);
            if (paneId !== undefined) setGraphPaneId(paneId);
          }}
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
                  onAddPane={() => addPane("control")}
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
                    onAddPane={() => addPane("output")}
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
  onOpenPaneSettings,
  onAddOption,
  graphFocused,
  onToggleGraphFocus,
}: Readonly<{
  tabId: string;
  panes: readonly WorkbenchPaneDefinitionV3[];
  selectedPaneId: string | null;
  addOptions: readonly WorkbenchAddPaneOptionV3[];
  onSelectPane: (paneId: string) => void;
  onOpenPaneSettings: (paneId: string) => void;
  onAddOption: (optionId: string) => void;
  graphFocused: boolean;
  onToggleGraphFocus: () => void;
}>) {
  const { t } = useTranslation();
  const [addSheetOpen, setAddSheetOpen] = React.useState(false);
  const addRef = React.useRef<HTMLButtonElement | null>(null);
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
          <button
            type="button"
            className="workbench-mobile-graph-view-action"
            aria-label={t("workbench.live.mobileEditGraphView", {
              title: panes.find(({ paneId }) => paneId === selectedPaneId)?.title
                ?? "—",
            })}
            disabled={selectedPaneId === null}
            onClick={() => {
              if (selectedPaneId !== null) onOpenPaneSettings(selectedPaneId);
            }}
          >
            <Settings2 className="h-4 w-4" aria-hidden="true" />
          </button>
          {addOptions.length > 0 && (
            <button
              ref={addRef}
              type="button"
              className="workbench-mobile-graph-view-action"
              aria-label={t("workbench.live.mobileAddGraphView")}
              aria-haspopup="dialog"
              aria-expanded={addSheetOpen}
              onClick={() => setAddSheetOpen(true)}
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
      <MobileAddPaneSheetV3
        open={addSheetOpen}
        areaLabel={t("workbench.live.mobilePaneAreas.graph")}
        addOptions={addOptions}
        returnFocusRef={addRef}
        onClose={() => setAddSheetOpen(false)}
        onAddOption={(optionId) => {
          onAddOption(optionId);
          setAddSheetOpen(false);
        }}
      />
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
  onOpenPaneSettings: (paneId: string) => void;
  onAddPane: () => void;
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
              <button
                type="button"
                className="workbench-mobile-pane-group-settings"
                aria-label={t("workbench.live.mobileEditPaneGroup", {
                  title: pane.title,
                })}
                onClick={() => onOpenPaneSettings(pane.paneId)}
              >
                <Settings2 className="h-4 w-4" aria-hidden="true" />
              </button>
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
        onClick={onAddPane}
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

function MobileAddPaneSheetV3({
  open,
  areaLabel,
  addOptions,
  returnFocusRef,
  onClose,
  onAddOption,
}: Readonly<{
  open: boolean;
  areaLabel: string;
  addOptions: readonly WorkbenchAddPaneOptionV3[];
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onAddOption: (optionId: string) => void;
}>) {
  const { t } = useTranslation();
  const dialogRef = React.useRef<HTMLElement | null>(null);
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;
  const [mounted, setMounted] = React.useState(open);
  const [visible, setVisible] = React.useState(false);
  const titleId = React.useId();

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), 180);
    return () => window.clearTimeout(timer);
  }, [open]);

  React.useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (dialog === null) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR_V3),
      ).filter((element) => !element.hidden && element.tabIndex !== -1);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousBodyOverflow;
      returnFocusRef.current?.focus();
    };
  }, [open, returnFocusRef]);

  React.useLayoutEffect(() => {
    if (!open || !mounted || typeof document === "undefined") return undefined;
    const frame = window.requestAnimationFrame(() => {
      const selected = dialogRef.current?.querySelector<HTMLElement>(
        '[data-mobile-pane-selected="true"], .workbench-mobile-pane-choice',
      );
      (selected ?? dialogRef.current)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mounted, open]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="workbench-mobile-pane-sheet-backdrop"
      data-open={visible && open ? "true" : "false"}
      aria-hidden={!open}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-labelledby={titleId}
        tabIndex={-1}
        className="workbench-mobile-pane-sheet"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="workbench-mobile-sheet-handle" aria-hidden="true" />
        <header className="workbench-mobile-pane-sheet-header">
          <div className="min-w-0 flex-1">
            <p className="workbench-mobile-pane-sheet-kicker">
              {areaLabel}
            </p>
            <h2 id={titleId} className="workbench-mobile-pane-sheet-title">
              {t("workbench.live.mobileAddPaneTitle", { area: areaLabel })}
            </h2>
          </div>
          <button
            type="button"
            className="workbench-mobile-sheet-close"
            aria-label={t("workbench.live.mobileClosePanePicker")}
            onClick={() => onCloseRef.current()}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <div className="workbench-mobile-pane-choice-list">
          {addOptions.map((choice) => {
            const choiceId = choice.id;
            return (
              <button
                key={choiceId}
                type="button"
                className="workbench-mobile-pane-choice"
                onClick={() => onAddOption(choiceId)}
              >
                <span className="workbench-mobile-pane-choice-icon">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-start">
                  <span className="block truncate">
                    {choice.label}
                  </span>
                  <span className="mt-0.5 block text-[0.68rem] text-wb-subtle">
                    {choice.description ?? t("workbench.live.mobileCreatePane")}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>,
    document.body,
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
