import React from "react";
import {
  Check,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  LayoutPanelTop,
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

type PaneAreaV3 = "graph" | "control" | "output";
type MobilePaneSheetModeV3 = "switch" | "add";

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
  const [outputPaneId, setOutputPaneId] = useReconciledPaneSelectionV3(
    outputPanes,
  );
  const [controlPaneId, setControlPaneId] = useReconciledPaneSelectionV3(
    controlPanes,
  );
  const activeGraphPane = graphPanes.find(
    ({ paneId }) => paneId === graphPaneId,
  ) ?? null;
  const activeOutputPane = outputPanes.find(
    ({ paneId }) => paneId === outputPaneId,
  ) ?? null;
  const activeControlPane = controlPanes.find(
    ({ paneId }) => paneId === controlPaneId,
  ) ?? null;
  const tabId = React.useId();

  const chooseTask = (task: WorkbenchMobileTaskV3) => {
    setActiveTask(task);
    setGraphFocused(false);
  };

  const addPane = (
    area: Exclude<PaneAreaV3, "graph">,
  ) => {
    const paneId = area === "control"
      ? onAddControlPane()
      : onAddOutputPane();
    if (paneId === undefined) return;
    if (area === "control") setControlPaneId(paneId);
    else setOutputPaneId(paneId);
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
        <MobilePaneToolbarV3
          area="graph"
          panes={graphPanes}
          selectedPaneId={graphPaneId}
          pickerLabel={t("workbench.live.mobileGraphPicker")}
          settingsLabel={t("workbench.live.paneSettings")}
          addOptions={graphAddOptions}
          onSelectPane={setGraphPaneId}
          onOpenPaneSettings={onOpenPaneSettings}
          onAddOption={(optionId) => {
            const paneId = onAddGraphPane(optionId);
            if (paneId !== undefined) setGraphPaneId(paneId);
          }}
          trailingAction={(
            <button
              type="button"
              className="workbench-mobile-toolbar-action"
              aria-label={t(
                graphFocused
                  ? "workbench.live.mobileShowTasks"
                  : "workbench.live.mobileFocusGraph",
              )}
              aria-pressed={graphFocused}
              onClick={() => setGraphFocused((current) => !current)}
            >
              {graphFocused
                ? <ChevronsUp className="h-4 w-4" aria-hidden="true" />
                : <ChevronsDown className="h-4 w-4" aria-hidden="true" />}
            </button>
          )}
        />
        <div className="min-h-0 flex-1 overflow-hidden bg-wb-canvas">
          {activeGraphPane === null
            ? (
              <MobileEmptyPaneV3
                message={t("workbench.editor.emptyPaneArea")}
              />
            )
            : renderGraphPane(activeGraphPane)}
        </div>
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

        {!graphFocused && activeTask !== "scenarios" && (
          <MobilePaneToolbarV3
            area={activeTask}
            panes={activeTask === "control" ? controlPanes : outputPanes}
            selectedPaneId={activeTask === "control"
              ? controlPaneId
              : outputPaneId}
            pickerLabel={t("workbench.live.mobilePanePicker", {
              area: t(`workbench.live.mobileTaskTabs.${activeTask}`),
            })}
            settingsLabel={t("workbench.live.paneSettings")}
            onSelectPane={activeTask === "control"
              ? setControlPaneId
              : setOutputPaneId}
            onOpenPaneSettings={onOpenPaneSettings}
            onAdd={() => addPane(activeTask)}
          />
        )}

        {!graphFocused && (
          <div
            id={`${tabId}-${activeTask}-panel`}
            role="tabpanel"
            aria-labelledby={`${tabId}-${activeTask}-tab`}
            className="workbench-mobile-task-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
            data-testid="workbench-mobile-task-scroll"
          >
            {activeTask === "control"
              ? activeControlPane === null
                ? <MobileEmptyPaneV3 message={t("workbench.editor.emptyPaneArea")} />
                : renderControlPane(activeControlPane)
              : activeTask === "output"
                ? activeOutputPane === null
                  ? <MobileEmptyPaneV3 message={t("workbench.editor.emptyPaneArea")} />
                  : renderOutputPane(activeOutputPane)
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

function MobilePaneToolbarV3({
  area,
  panes,
  selectedPaneId,
  pickerLabel,
  settingsLabel,
  addOptions = [],
  trailingAction,
  onSelectPane,
  onOpenPaneSettings,
  onAdd,
  onAddOption,
}: Readonly<{
  area: PaneAreaV3;
  panes: readonly WorkbenchPaneDefinitionV3[];
  selectedPaneId: string | null;
  pickerLabel: string;
  settingsLabel: string;
  addOptions?: readonly WorkbenchAddPaneOptionV3[];
  trailingAction?: React.ReactNode;
  onSelectPane: React.Dispatch<React.SetStateAction<string | null>>;
  onOpenPaneSettings: (paneId: string) => void;
  onAdd?: () => void;
  onAddOption?: (optionId: string) => void;
}>) {
  const { t } = useTranslation();
  const [sheetMode, setSheetMode] = React.useState<MobilePaneSheetModeV3 | null>(
    null,
  );
  const switcherRef = React.useRef<HTMLButtonElement | null>(null);
  const addRef = React.useRef<HTMLButtonElement | null>(null);
  const selectedPane = panes.find(({ paneId }) => paneId === selectedPaneId)
    ?? null;
  const selectedIndex = selectedPane === null
    ? -1
    : panes.findIndex(({ paneId }) => paneId === selectedPane.paneId);
  const paneSwitchingAvailable = panes.length > 1;
  const areaLabel = t(`workbench.live.mobilePaneAreas.${area}`);
  const switcherAriaLabel = t("workbench.live.mobileSwitchPane", {
    area: areaLabel,
    title: selectedPane?.title ?? "—",
  });
  const addAriaLabel = t("workbench.live.mobileAddPane", {
    area: areaLabel,
  });
  const returnFocusRef = sheetMode === "add" ? addRef : switcherRef;

  return (
    <>
      <div
        className="workbench-mobile-pane-toolbar"
        data-mobile-pane-toolbar={area}
      >
        <button
          ref={switcherRef}
          type="button"
          className="workbench-mobile-pane-switcher"
          aria-label={switcherAriaLabel}
          aria-haspopup="dialog"
          aria-expanded={sheetMode === "switch"}
          disabled={!paneSwitchingAvailable}
          data-switching-available={paneSwitchingAvailable ? "true" : "false"}
          onClick={() => setSheetMode("switch")}
        >
          <LayoutPanelTop
            className="h-4 w-4 shrink-0 text-wb-subtle"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate text-start">
            {selectedPane?.title ?? pickerLabel}
          </span>
          {paneSwitchingAvailable && (
            <>
              <span className="workbench-mobile-pane-count" aria-hidden="true">
                {selectedIndex + 1}/{panes.length}
              </span>
              <ChevronDown
                className="h-3.5 w-3.5 shrink-0 text-wb-subtle"
                aria-hidden="true"
              />
            </>
          )}
        </button>
        <button
          type="button"
          className="workbench-mobile-toolbar-action"
          aria-label={settingsLabel}
          disabled={selectedPaneId === null}
          onClick={() => {
            if (selectedPaneId !== null) onOpenPaneSettings(selectedPaneId);
          }}
        >
          <Settings2 className="h-4 w-4" aria-hidden="true" />
        </button>
        {addOptions.length > 0 && onAddOption !== undefined
          ? (
            <button
              ref={addRef}
              type="button"
              className="workbench-mobile-toolbar-action"
              aria-label={addAriaLabel}
              aria-haspopup="dialog"
              aria-expanded={sheetMode === "add"}
              onClick={() => setSheetMode("add")}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          )
          : onAdd !== undefined && (
          <button
            type="button"
            className="workbench-mobile-toolbar-action"
            aria-label={addAriaLabel}
            onClick={onAdd}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        {trailingAction}
      </div>
      <MobilePaneChooserSheetV3
        mode={sheetMode}
        areaLabel={areaLabel}
        panes={panes}
        selectedPaneId={selectedPaneId}
        addOptions={addOptions}
        returnFocusRef={returnFocusRef}
        onClose={() => setSheetMode(null)}
        onSelectPane={(paneId) => {
          onSelectPane(paneId);
          setSheetMode(null);
        }}
        onAddOption={(optionId) => {
          onAddOption?.(optionId);
          setSheetMode(null);
        }}
      />
    </>
  );
}

function MobilePaneChooserSheetV3({
  mode,
  areaLabel,
  panes,
  selectedPaneId,
  addOptions,
  returnFocusRef,
  onClose,
  onSelectPane,
  onAddOption,
}: Readonly<{
  mode: MobilePaneSheetModeV3 | null;
  areaLabel: string;
  panes: readonly WorkbenchPaneDefinitionV3[];
  selectedPaneId: string | null;
  addOptions: readonly WorkbenchAddPaneOptionV3[];
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onSelectPane: (paneId: string) => void;
  onAddOption: (optionId: string) => void;
}>) {
  const { t } = useTranslation();
  const dialogRef = React.useRef<HTMLElement | null>(null);
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;
  const [mounted, setMounted] = React.useState(mode !== null);
  const [visible, setVisible] = React.useState(false);
  const [renderedMode, setRenderedMode] =
    React.useState<MobilePaneSheetModeV3>(mode ?? "switch");
  const titleId = React.useId();
  const open = mode !== null;

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      setRenderedMode(mode ?? "switch");
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), 180);
    return () => window.clearTimeout(timer);
  }, [mode, open]);

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
  }, [mounted, open, renderedMode]);

  if (!mounted || typeof document === "undefined") return null;
  const switching = renderedMode === "switch";
  const choices = switching ? panes : addOptions;

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
              {t(
                switching
                  ? "workbench.live.mobilePaneSwitcherTitle"
                  : "workbench.live.mobileAddPaneTitle",
                { area: areaLabel },
              )}
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
          {choices.map((choice, index) => {
            const choiceId = switching
              ? (choice as WorkbenchPaneDefinitionV3).paneId
              : (choice as WorkbenchAddPaneOptionV3).id;
            const selected = switching && choiceId === selectedPaneId;
            return (
              <button
                key={choiceId}
                type="button"
                className="workbench-mobile-pane-choice"
                data-mobile-pane-selected={selected ? "true" : "false"}
                aria-current={selected ? "true" : undefined}
                onClick={() => {
                  if (switching) onSelectPane(choiceId);
                  else onAddOption(choiceId);
                }}
              >
                <span className="workbench-mobile-pane-choice-icon">
                  {switching
                    ? <LayoutPanelTop className="h-4 w-4" aria-hidden="true" />
                    : <Plus className="h-4 w-4" aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1 text-start">
                  <span className="block truncate">
                    {choice.label ?? (choice as WorkbenchPaneDefinitionV3).title}
                  </span>
                  <span className="mt-0.5 block text-[0.68rem] text-wb-subtle">
                    {switching
                      ? t("workbench.live.mobilePanePosition", {
                          current: index + 1,
                          total: panes.length,
                        })
                      : (choice as WorkbenchAddPaneOptionV3).description
                        ?? t("workbench.live.mobileCreatePane")}
                  </span>
                </span>
                {selected && (
                  <Check
                    className="h-4 w-4 shrink-0 text-wb-accent"
                    aria-hidden="true"
                  />
                )}
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
