import React from "react";
import {
  ChevronsDown,
  ChevronsUp,
  Plus,
  Settings2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  WorkbenchAddPaneOptionV3,
  WorkbenchPaneDefinitionV3,
} from "@/components/workbench/WorkbenchDockview";

export type WorkbenchMobileTaskV3 = "control" | "output" | "scenarios";

type PaneAreaV3 = "graph" | "control" | "output";

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
          addLabel={t("workbench.editor.addPane")}
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
            addLabel={t("workbench.editor.addPane")}
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
  addLabel,
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
  addLabel: string;
  addOptions?: readonly WorkbenchAddPaneOptionV3[];
  trailingAction?: React.ReactNode;
  onSelectPane: React.Dispatch<React.SetStateAction<string | null>>;
  onOpenPaneSettings: (paneId: string) => void;
  onAdd?: () => void;
  onAddOption?: (optionId: string) => void;
}>) {
  return (
    <div
      className="workbench-mobile-pane-toolbar"
      data-mobile-pane-toolbar={area}
    >
      <select
        className="workbench-mobile-pane-picker"
        aria-label={pickerLabel}
        value={selectedPaneId ?? ""}
        disabled={panes.length === 0}
        onChange={(event) => onSelectPane(event.currentTarget.value)}
      >
        {panes.length === 0 && <option value="">—</option>}
        {panes.map((pane) => (
          <option key={pane.paneId} value={pane.paneId}>
            {pane.title}
          </option>
        ))}
      </select>
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
          <label className="workbench-mobile-toolbar-action relative">
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{addLabel}</span>
            <select
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label={addLabel}
              value=""
              onChange={(event) => {
                const optionId = event.currentTarget.value;
                if (optionId.length > 0) onAddOption(optionId);
              }}
            >
              <option value="" disabled>{addLabel}</option>
              {addOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )
        : onAdd !== undefined && (
          <button
            type="button"
            className="workbench-mobile-toolbar-action"
            aria-label={addLabel}
            onClick={onAdd}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      {trailingAction}
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
