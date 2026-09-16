import React from "react";
import { ChevronRight, Plus, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ExperimentSurfaceV2 } from "@/studio/contracts/v2/content";
import type { ModelContractV2 } from "@/studio/contracts/v2/model";
import type { StudioItemPresentationCategoryV1 } from "@/studio/presentation/StudioItemPresentationCatalogV1";
import { STUDIO_AS_OUTPUT_SELECTION_V1 } from "@/studio/presentation/StudioOutputSelectionSetsV1";
import {
  WorkbenchAnchoredDialogV3,
  type WorkbenchPopoverAnchorV3,
} from "./WorkbenchAnchoredDialogV3";
import {
  CommitTextInputV3,
  GraphDisplaySettingsV3,
  workbenchGraphDisplaySettingsAvailableV3,
  type WorkbenchPaneEditorStringsV3,
  type WorkbenchPaneEditorSectionV3,
} from "./WorkbenchPaneEditorV3";
import {
  WorkbenchPaneItemRowsV3,
  WorkbenchPaneTargetV3,
  WorkbenchTraceRowsV3,
} from "./WorkbenchPaneItemRowsV3";
import {
  addWorkbenchSurfacePaneV3,
  findWorkbenchSurfacePaneV3,
  updateWorkbenchSurfacePaneV3,
  type WorkbenchPaneIdentityV3,
  type WorkbenchSurfacePaneV3,
} from "./WorkbenchSurfacePaneOperationsV3";
import {
  canCommitWorkbenchPaneV3,
  finalizeWorkbenchPaneSelectionV3,
  rememberWorkbenchPaneItemsV3,
  rememberWorkbenchOutputMethodsV3,
  toggleWorkbenchPaneSelectionV3,
  workbenchPaneSelectionEntriesV3,
  workbenchPaneCatalogEntriesV3,
} from "./WorkbenchPaneSelectionV3";
import {
  workbenchGraphPaneOptionsForContractV3,
  type WorkbenchResolvedGraphPaneOptionV3,
} from "./WorkbenchSurfaceV3";
import { reconcileWorkbenchGraphColorsV3 } from "./presentation/WorkbenchGraphColorV3";
import { WorkbenchPaneCatalogV3 } from "./WorkbenchPaneCatalogV3";
import { readWorkbenchGraphAxisRangesV3 } from "./WorkbenchGraphAxisSettingsV3";

export type WorkbenchPanePickerRequestV3 = Readonly<{
  kind: WorkbenchPaneIdentityV3["kind"];
  paneId?: string;
  anchor: WorkbenchPopoverAnchorV3;
  initialSection?: WorkbenchPaneEditorSectionV3;
  initialItemIntent?: "add" | "manage";
  onCreated?: (paneId: string) => void;
}>;
type View = "items" | "catalog" | "display" | "binding";
const secondaryClass =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs text-wb-muted hover:bg-wb-hover focus-visible:ring-2 focus-visible:ring-wb-accent";
const primaryClass =
  "inline-flex min-h-10 items-center justify-center rounded-md bg-wb-primary px-4 text-xs font-semibold text-white hover:bg-wb-primary-hover focus-visible:ring-2 focus-visible:ring-wb-accent disabled:cursor-not-allowed disabled:opacity-40";

/** Creation, selection and presentation share one isolated draft and one dialog. */
export function WorkbenchPanePickerV3({
  request,
  contract,
  surface,
  scenarios,
  locale,
  periodicPvaSupported,
  strings,
  onCommit,
  onClose,
}: Readonly<{
  request: WorkbenchPanePickerRequestV3;
  contract: ModelContractV2;
  surface: ExperimentSurfaceV2;
  scenarios: readonly Readonly<{
    scenarioId: string;
    label: string;
    visible?: boolean;
  }>[];
  locale: "en" | "ja";
  periodicPvaSupported: boolean;
  strings: WorkbenchPaneEditorStringsV3;
  onCommit: (pane: WorkbenchSurfacePaneV3, creating: boolean) => void;
  onClose: () => void;
}>) {
  const { t } = useTranslation();
  const creating = request.paneId === undefined;
  const [initial] = React.useState(() =>
    request.paneId !== undefined
      ? {
          surface,
          selectedPane: { kind: request.kind, paneId: request.paneId },
        }
      : request.kind === "graph"
        ? { surface, selectedPane: null }
        : addWorkbenchSurfacePaneV3(
            surface,
            request.kind,
            contract,
            undefined,
            undefined,
            { emptyItems: true, periodicPvaSupported },
          ),
  );
  const [draftSurface, setDraftSurface] = React.useState(() =>
    reconcileWorkbenchGraphColorsV3(initial.surface, scenarios),
  );
  const [selectedPane, setSelectedPane] =
    React.useState<WorkbenchPaneIdentityV3 | null>(initial.selectedPane);
  const [view, setView] = React.useState<View>(
    request.initialSection === "binding"
      ? "binding"
      : creating || request.initialItemIntent === "add"
        ? "catalog"
        : "items",
  );
  const [query, setQuery] = React.useState("");
  const [axisValid, setAxisValid] = React.useState(true);
  const [automaticRanges] = React.useState(() => readWorkbenchGraphAxisRangesV3(
    typeof document === "undefined" || !request.paneId ? null : document.querySelector(`[data-workbench-graph-pane="${CSS.escape(request.paneId)}"]`),
  ));
  const [expandedCategories, setExpandedCategories] = React.useState<
    ReadonlySet<StudioItemPresentationCategoryV1>
  >(() => new Set());
  const drafts = React.useRef(
    new Map<
      string,
      { surface: ExperimentSurfaceV2; selectedPane: WorkbenchPaneIdentityV3 }
    >(),
  );
  const [graphOptionId, setGraphOptionId] = React.useState<string | null>(null);
  const pane = selectedPane
    ? findWorkbenchSurfacePaneV3(draftSurface, selectedPane)
    : undefined;
  const originals = React.useRef(new Map<string, WorkbenchSurfacePaneV3>());
  const outputMethodChoices = React.useRef(new Map<string, ReadonlyMap<string, readonly string[]>>());
  if (pane && !originals.current.has(pane.paneId))
    originals.current.set(pane.paneId, pane);
  if (pane) outputMethodChoices.current.set(pane.paneId, rememberWorkbenchOutputMethodsV3(outputMethodChoices.current.get(pane.paneId) ?? new Map(), pane));
  const entries = pane
    ? workbenchPaneSelectionEntriesV3(pane, contract, locale)
    : [];
  const hasItems = pane?.role !== "graph" || entries.length > 0;
  const graph =
    pane?.role === "graph"
      ? contract.graphCatalog.find((graph) => graph.graphId === pane.graphId)
      : undefined;
  const currentView = !hasItems ? "display" : view;
  const contentRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (currentView !== "catalog") return;
    const frame = requestAnimationFrame(() => {
      const search = window.matchMedia("(min-width: 640px)").matches
        ? searchRef.current
        : null;
      (
        search ??
        contentRef.current?.querySelector<HTMLElement>(
          'input[type="checkbox"], button[aria-expanded]',
        )
      )?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [currentView, selectedPane?.paneId]);
  const displayAvailable =
    pane?.role === "graph" &&
    workbenchGraphDisplaySettingsAvailableV3(
      graph?.renderer,
    );
  const title = pane
    ? creating
      ? pane.role === "graph"
        ? pane.label
        : t(`workbench.editor.panePicker.add.${pane.role}`)
      : pane.label
    : t("workbench.editor.panePicker.add.graph");
  const commitLabel = creating
    ? request.kind === "graph"
      ? t("workbench.editor.panePicker.show")
      : t("workbench.editor.panePicker.addSelected")
    : t("workbench.editor.panePicker.apply");
  const commit = (candidate: WorkbenchSurfacePaneV3) => {
    if (!canCommitWorkbenchPaneV3(candidate, contract, creating)) return;
    if (creating) request.onCreated?.(candidate.paneId);
    onCommit(finalizeWorkbenchPaneSelectionV3(candidate), creating);
    onClose();
  };
  const update = (candidate: WorkbenchSurfacePaneV3) =>
    setDraftSurface((current) => {
      const previous = findWorkbenchSurfacePaneV3(current, selectedPane!)!;
      originals.current.set(
        candidate.paneId,
        rememberWorkbenchPaneItemsV3(
          originals.current.get(candidate.paneId) ?? previous,
          previous,
        ),
      );
      return reconcileWorkbenchGraphColorsV3(
        updateWorkbenchSurfacePaneV3(current, selectedPane!, () => candidate),
        scenarios,
      );
    });
  const toggle = (id: string) => {
    if (!pane) return;
    const memory = rememberWorkbenchPaneItemsV3(
      originals.current.get(pane.paneId) ?? pane,
      pane,
    );
    originals.current.set(pane.paneId, memory);
    update(toggleWorkbenchPaneSelectionV3(pane, id, memory, outputMethodChoices.current.get(pane.paneId)?.get(id)));
  };
  const chooseGraph = (option: WorkbenchResolvedGraphPaneOptionV3) => {
    const result =
      drafts.current.get(option.optionId) ??
      addWorkbenchSurfacePaneV3(
        surface,
        "graph",
        contract,
        option.graphId,
        option.structuralSide,
        { emptyItems: true, periodicPvaSupported },
      );
    if (!result.selectedPane) return;
    const candidate = findWorkbenchSurfacePaneV3(
      result.surface,
      result.selectedPane,
    )!;
    const graph = contract.graphCatalog.find(
      (graph) => graph.graphId === option.graphId,
    )!;
    if (!("seriesCatalog" in graph)) {
      commit(candidate);
      return;
    }
    setDraftSurface(reconcileWorkbenchGraphColorsV3(result.surface, scenarios));
    setSelectedPane(result.selectedPane);
    setGraphOptionId(option.optionId);
    setQuery("");
    setExpandedCategories(new Set());
    setView("catalog");
  };
  const back =
    pane && currentView === "catalog"
      ? () => setView("items")
      : creating && request.kind === "graph" && selectedPane
        ? () => {
            if (graphOptionId)
              drafts.current.set(graphOptionId, {
                surface: draftSurface,
                selectedPane,
              });
            setSelectedPane(null);
            setQuery("");
            setExpandedCategories(new Set());
          }
        : undefined;
  const tabs = pane
    ? [
        ...(hasItems
          ? [{ id: "items", label: locale === "ja" ? "項目" : "Items" }]
          : []),
        ...(displayAvailable || !hasItems
          ? [{ id: "display", label: locale === "ja" ? "表示" : "Display" }]
          : []),
        ...(pane.role !== "graph"
          ? [{ id: "binding", label: locale === "ja" ? "対象" : "Scenario" }]
          : []),
      ]
    : [];
  return (
    <WorkbenchAnchoredDialogV3
      anchor={request.anchor}
      title={title}
      closeLabel={t("common.close")}
      onClose={onClose}
      width={440}
      testId="workbench-pane-picker-v3"
      focusKey={selectedPane?.paneId ?? "kinds"}
      backLabel={t("workbench.editor.presetPicker.back")}
      onBack={back}
      footer={
        pane ? (
          <>
            <button type="button" className={secondaryClass} onClick={onClose}>
              {strings.cancel}
            </button>
            <button
              type="button"
              className={primaryClass}
              disabled={!axisValid || !canCommitWorkbenchPaneV3(pane, contract, creating)}
              onClick={() => commit(pane)}
            >
              {commitLabel}
            </button>
          </>
        ) : undefined
      }
    >
      {tabs.length > 1 && (
        <div
          className="flex shrink-0 gap-1 border-b border-wb-line px-3"
          role="tablist"
          aria-label={strings.title}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`pane-editor-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-controls="pane-editor-content-v3"
              aria-selected={
                currentView === tab.id ||
                (currentView === "catalog" && tab.id === "items")
              }
              tabIndex={
                currentView === tab.id ||
                (currentView === "catalog" && tab.id === "items")
                  ? 0
                  : -1
              }
              onKeyDown={(event) => {
                const direction =
                  event.key === "ArrowRight"
                    ? 1
                    : event.key === "ArrowLeft"
                      ? -1
                      : 0;
                if (!direction && event.key !== "Home" && event.key !== "End")
                  return;
                event.preventDefault();
                const index =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? tabs.length - 1
                      : (tabs.indexOf(tab) + direction + tabs.length) %
                        tabs.length;
                const next = tabs[index]!;
                setView(next.id as View);
                document.getElementById(`pane-editor-tab-${next.id}`)?.focus();
              }}
              className={`${secondaryClass} rounded-none border-b-2 ${currentView === tab.id || (currentView === "catalog" && tab.id === "items") ? "border-wb-accent text-wb-text" : "border-transparent"}`}
              onClick={() => setView(tab.id as View)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      {pane && currentView === "catalog" && entries.length > 8 && (
        <div className="shrink-0 px-3 pt-3">
          <label className="flex items-center gap-2 rounded-lg border border-wb-line bg-wb-soft px-3 text-wb-muted focus-within:ring-2 focus-within:ring-wb-accent">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              aria-label={strings.searchCatalog}
              placeholder={strings.searchCatalog}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                contentRef.current?.scrollTo({ top: 0 });
              }}
              className="h-10 min-w-0 flex-1 bg-transparent text-base text-wb-text outline-none sm:text-sm"
            />
          </label>
        </div>
      )}
      <div
        id="pane-editor-content-v3"
        ref={contentRef}
        role={tabs.length > 1 ? "tabpanel" : undefined}
        aria-labelledby={
          tabs.length > 1
            ? `pane-editor-tab-${currentView === "catalog" ? "items" : currentView}`
            : undefined
        }
        className="min-h-0 overflow-y-auto overscroll-contain p-3"
        data-testid="workbench-pane-picker-list-v3"
      >
        {!pane ? (
          workbenchGraphPaneOptionsForContractV3(contract).map((option) => {
            const graph = contract.graphCatalog.find(
              (graph) => graph.graphId === option.graphId,
            )!;
            return (
              <button
                key={option.optionId}
                type="button"
                data-graph-option-id={option.optionId}
                onClick={() => chooseGraph(option)}
                className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-wb-text hover:bg-wb-hover focus-visible:ring-2 focus-visible:ring-wb-accent"
              >
                <span>
                  {t(`workbench.editor.graphPaneKinds.${option.kind}`)}
                </span>
                {"seriesCatalog" in graph ? (
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-wb-subtle"
                    aria-hidden="true"
                  />
                ) : (
                  <Plus
                    className="h-4 w-4 shrink-0 text-wb-subtle"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })
        ) : currentView === "items" ? (
          <WorkbenchPaneItemRowsV3
            pane={pane}
            contract={contract}
            entries={entries}
            scenarios={scenarios}
            surface={draftSurface}
            strings={strings}
            locale={locale}
            onChange={update}
            onRemove={toggle}
            onAddMethod={toggle}
            onAdd={() => {
              setQuery("");
              setView("catalog");
            }}
          />
        ) : currentView === "display" ? (
          <div className="space-y-4">
            <CommitTextInputV3
              label={locale === "ja" ? "Pane名" : "Pane name"}
              value={pane.label}
              onCommit={(label) => update({ ...pane, label })}
            />
            {pane.role === "graph" && (
              <GraphDisplaySettingsV3
                key={pane.paneId}
                graph={graph}
                pane={pane}
                automaticRanges={automaticRanges}
                onValidityChange={setAxisValid}
                waveformUnit={graph?.renderer === "sweep" ? contract.outputCatalog.find(output =>
                  output.outputId === graph.seriesCatalog.find(series => pane.series.some(item => item.seriesId === series.seriesId))?.outputId)?.unit : undefined}
                periodicPvaSupported={periodicPvaSupported}
                strings={strings}
                onChange={update}
              />
            )}
            {!hasItems && pane.role === "graph" && graph && (
              <WorkbenchTraceRowsV3
                pane={pane}
                graph={graph}
                seriesId={null}
                scenarios={scenarios}
                surface={draftSurface}
                strings={strings}
                locale={locale}
                onChange={update}
              />
            )}
          </div>
        ) : currentView === "binding" && pane.role !== "graph" ? (
          <div className="space-y-4">
            <CommitTextInputV3
              label={locale === "ja" ? "Pane名" : "Pane name"}
              value={pane.label}
              onCommit={(label) => update({ ...pane, label })}
            />
            <WorkbenchPaneTargetV3
              pane={pane}
              scenarios={scenarios}
              strings={strings}
              onChange={update}
            />
          </div>
        ) : (
          <>
            {pane.role === "output" &&
              !query &&
              STUDIO_AS_OUTPUT_SELECTION_V1.every((id) =>
                contract.outputCatalog.some((o) => o.outputId === id),
              ) &&
              STUDIO_AS_OUTPUT_SELECTION_V1.some(
                (id) => !pane.items.some((item) => item.outputId === id),
              ) && (
                <button
                  type="button"
                  className={`${secondaryClass} mb-2 w-full justify-start`}
                  onClick={() => {
                    let next: WorkbenchSurfacePaneV3 = pane;
                    for (const id of STUDIO_AS_OUTPUT_SELECTION_V1)
                      if (
                        next.role === "output" &&
                        !next.items.some((item) => item.outputId === id)
                      )
                        next = toggleWorkbenchPaneSelectionV3(
                          next,
                          id,
                          originals.current.get(pane.paneId) ?? pane,
                        );
                    update(next);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  {locale === "ja"
                    ? "AS関連の5項目を追加"
                    : "Add 5 AS-related outputs"}
                </button>
              )}
            <WorkbenchPaneCatalogV3
              entries={workbenchPaneCatalogEntriesV3(entries)}
              query={query}
              expandedCategories={expandedCategories}
              onExpandedCategoriesChange={setExpandedCategories}
              strings={strings}
              locale={locale}
              onToggle={toggle}
            />{" "}
          </>
        )}
      </div>
    </WorkbenchAnchoredDialogV3>
  );
}
