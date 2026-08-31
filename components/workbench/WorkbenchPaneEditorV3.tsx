import React from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  GripVertical,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useAppTheme } from "@/appTheme";

import type {
  ExperimentSurfaceControlItemV2,
  ExperimentSurfaceControlPaneV2,
  ExperimentSurfaceGraphPaneV2,
  ExperimentSurfaceGraphSeriesV2,
  ExperimentSurfaceOutputItemV2,
  ExperimentSurfaceOutputPaneV2,
  ExperimentSurfaceV2,
} from "@/studio/contracts/v2/content";
import type {
  GraphDefinitionV2,
  ModelContractV2,
} from "@/studio/contracts/v2/model";
import {
  STUDIO_OUTPUT_PRESSURE_SUMMARIES_V1,
  resolveStudioItemPresentationV1,
  resolveStudioOutputPressureSummaryStoredLabelV1,
  resolveStudioSurfaceItemLabelV1,
  studioItemPresentationMatchesQueryV1,
  type ResolvedStudioItemPresentationV1,
  type StudioItemPresentationCatalogFactsV1,
  type StudioItemPresentationCategoryV1,
} from "@/studio/presentation/StudioItemPresentationCatalogV1";
import {
  controlLabelV3,
  graphSeriesLabelV3,
  outputLabelV3,
  WORKBENCH_PRESSURE_VOLUME_ANALYSIS_DEFAULT_MODE_V3,
  WORKBENCH_PRESSURE_VOLUME_ENVELOPE_DEFAULT_VISIBLE_V3,
  WORKBENCH_SWEEP_WINDOW_DEFAULT_SEC_V3,
  WORKBENCH_SWEEP_WINDOW_MAX_SEC_V3,
  WORKBENCH_SWEEP_WINDOW_MIN_SEC_V3,
  WORKBENCH_SWEEP_WINDOW_STEP_SEC_V3,
} from "./WorkbenchSurfaceV3";
import {
  reconcileWorkbenchGraphColorsV3,
  resolveWorkbenchGraphTraceStyleV3,
  workbenchScenarioColorSeedV3,
} from "./presentation/WorkbenchGraphColorV3";
import { ExperimentPaneAddItemButtonV3 } from "./ExperimentPanePresentationV3";
import { WorkbenchPaneBindingEditorV3 } from "./WorkbenchPaneBindingV3";
import {
  resolveWorkbenchGraphSeriesPresentationV3,
} from "./WorkbenchItemPresentation";
import {
  findWorkbenchSurfacePaneV3,
  updateWorkbenchSurfacePaneV3,
  type WorkbenchPaneIdentityV3,
  type WorkbenchSurfacePaneV3,
} from "./WorkbenchSurfacePaneOperationsV3";

const FOCUSABLE_SELECTOR_V3 = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const CANONICAL_COLOR_HEX_V3 = /^#[0-9a-f]{6}$/;

type PaneEditorDrawerContextValueV3 = Readonly<{
  host: HTMLDivElement | null;
  registerCloseHandler: (handler: (() => void) | null) => void;
  setOpen: (open: boolean) => void;
}>;

const PaneEditorDrawerContextV3 =
  React.createContext<PaneEditorDrawerContextValueV3 | null>(null);

export type WorkbenchPaneEditorSectionV3 = "binding" | "items";
export type WorkbenchPaneEditorItemIntentV3 = "add" | "manage";

type PaneItemCatalogCategoryV3 = StudioItemPresentationCategoryV1;

export type WorkbenchPaneEditorStringsV3 = Readonly<{
  addCatalogItem: string;
  backToCatalog: string;
  availableItems: string;
  cancel: string;
  close: string;
  chooseItem: string;
  bindingSection: string;
  activeSlotBinding: string;
  activeSlotBindingHint: string;
  outputActiveSlotBindingHint: string;
  fixedBinding: string;
  fixedBindingHint: string;
  outputFixedBindingHint: string;
  controlPresentation: string;
  sliderPresentation: string;
  buttonsPresentation: string;
  buttonLabel: string;
  buttonValue: string;
  addButtonOption: string;
  removeButtonOption: string;
  controlCatalog: string;
  catalogAdded: string;
  catalogCategories: Readonly<Record<PaneItemCatalogCategoryV3, string>>;
  catalogDrawerTitle: string;
  closeDrawer: string;
  dataSection: string;
  displaySection: string;
  done: string;
  emptyCatalog: string;
  editItem: string;
  generalSection: string;
  pressureEnvelopeOverlay: string;
  pressureEnvelopeOverlayHint: string;
  label: string;
  itemsSection: string;
  moveDown: string;
  moveUp: string;
  manageItems: string;
  noCatalogMatches: string;
  noConfigurableSeries: string;
  outputCatalog: string;
  paneKinds: Readonly<Record<WorkbenchPaneIdentityV3["kind"], string>>;
  seriesCatalog: string;
  scenarioColors: string;
  scenarioColorsHint: string;
  traceVisibility: string;
  traceVisibilityHint: string;
  resetColor: string;
  removeItem: string;
  preview: string;
  reorderItem: string;
  searchCatalog: string;
  selectedItems: string;
  title: string;
  windowSec: string;
  windowSecHint: string;
}>;

export const DEFAULT_WORKBENCH_PANE_EDITOR_STRINGS_V3: WorkbenchPaneEditorStringsV3 =
  Object.freeze({
    addCatalogItem: "Add item",
    backToCatalog: "Back to catalog",
    availableItems: "Available",
    cancel: "Cancel",
    close: "Close pane settings",
    chooseItem: "Choose an item to edit its presentation.",
    bindingSection: "Scenario",
    activeSlotBinding: "Follow selected scenario",
    activeSlotBindingHint:
      "This pane controls whichever Scenario is selected in Scenario Manager.",
    outputActiveSlotBindingHint:
      "This pane displays the Scenario selected in Scenario Manager.",
    fixedBinding: "Fix Scenario",
    fixedBindingHint:
      "Every parameter in this pane applies the same absolute value to the selected Scenarios.",
    outputFixedBindingHint: "This pane always displays one selected Scenario.",
    controlPresentation: "Control presentation",
    sliderPresentation: "Slider",
    buttonsPresentation: "Custom buttons",
    buttonLabel: "Button label",
    buttonValue: "Value",
    addButtonOption: "Add button",
    removeButtonOption: "Remove button",
    controlCatalog: "Parameters",
    catalogAdded: "In pane",
    catalogCategories: Object.freeze({
      advanced: "Advanced / raw parameters",
      coronary: "Coronary",
      hemodynamics: "Hemodynamics",
      mechanicalSupport: "Mechanical support",
      myocardium: "Myocardium",
      oxygen: "Oxygen transport",
      pericardium: "Pericardium",
      rhythm: "Rhythm",
      valves: "Valves",
      ventilation: "Ventilation",
    }),
    catalogDrawerTitle: "Add items",
    closeDrawer: "Close panel",
    dataSection: "Data",
    displaySection: "Display",
    done: "Done",
    emptyCatalog: "No registered items are available.",
    editItem: "Edit item",
    generalSection: "General",
    pressureEnvelopeOverlay: "Envelope",
    pressureEnvelopeOverlayHint:
      "A reference curve joining the maximum pressure found at each volume. It shows the ventricle's upper pressure capability and is not used to calculate PVA.",
    label: "Label",
    itemsSection: "Items",
    moveDown: "Move down",
    moveUp: "Move up",
    manageItems: "Manage items",
    noCatalogMatches: "No matching registered items.",
    noConfigurableSeries:
      "This graph owns its structural axes and has no configurable series.",
    outputCatalog: "Outputs",
    paneKinds: Object.freeze({
      control: "Controller pane",
      graph: "Graph pane",
      output: "Output pane",
    }),
    seriesCatalog: "Waveform series",
    scenarioColors: "Scenario colors",
    scenarioColorsHint:
      "Each existing trace keeps its allocated color. Change only the exact Scenario/item you need.",
    traceVisibility: "Trace visibility",
    traceVisibilityHint:
      "All visible Scenarios are shown by default. Adjust individual Scenario/item traces only when needed.",
    resetColor: "Use automatic color",
    removeItem: "Remove from pane",
    preview: "Preview",
    reorderItem: "Reorder item",
    searchCatalog: "Search by name, ID, or unit",
    selectedItems: "In this pane",
    title: "Pane settings",
    windowSec: "Waveform window",
    windowSecHint: "1–6 seconds in 0.5 second steps",
  });

export function canonicalWorkbenchColorHexV3(
  value: string,
  fallback = "#64748b",
): string {
  const candidate = value.toLowerCase();
  return CANONICAL_COLOR_HEX_V3.test(candidate)
    ? candidate
    : fallback.toLowerCase();
}

export function workbenchGraphDisplaySettingsAvailableV3(
  renderer: GraphDefinitionV2["renderer"] | undefined,
  periodicPvaSupported: boolean,
  pressureVolumeAnalysisMode?:
    ExperimentSurfaceGraphPaneV2["pressureVolumeAnalysisMode"],
): boolean {
  return renderer === "sweep" ||
    (renderer === "pressure-volume" &&
      periodicPvaSupported &&
      pressureVolumeAnalysisMode !== "raw-exact-orbit");
}

export function WorkbenchPaneEditorV3({
  initialItemIntent,
  initialSection,
  locale,
  open,
  periodicPvaSupported = true,
  selectedPane,
  contract,
  surface,
  scenarios,
  strings,
  onChange,
  onClose,
}: Readonly<{
  open: boolean;
  initialItemIntent?: WorkbenchPaneEditorItemIntentV3;
  initialSection?: WorkbenchPaneEditorSectionV3;
  locale: "en" | "ja";
  periodicPvaSupported?: boolean;
  selectedPane: WorkbenchPaneIdentityV3;
  contract: ModelContractV2;
  surface: ExperimentSurfaceV2;
  scenarios: readonly Readonly<{ scenarioId: string; label: string }>[];
  strings: WorkbenchPaneEditorStringsV3;
  onChange: (surface: ExperimentSurfaceV2) => void;
  onClose: () => void;
}>) {
  const { appTheme } = useAppTheme();
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const onCloseRef = React.useRef(onClose);
  const titleId = React.useId();
  const descriptionId = React.useId();
  const [draftSurface, setDraftSurface] = React.useState(surface);
  const [drawerHost, setDrawerHost] = React.useState<HTMLDivElement | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [activeSectionId, setActiveSectionId] = React.useState(
    "pane-settings-general-v3",
  );
  const drawerCloseRef = React.useRef<(() => void) | null>(null);
  const registerDrawerCloseHandler = React.useCallback(
    (handler: (() => void) | null) => {
      drawerCloseRef.current = handler;
    },
    [],
  );
  const drawerContext = React.useMemo<PaneEditorDrawerContextValueV3>(
    () => ({
      host: drawerHost,
      registerCloseHandler: registerDrawerCloseHandler,
      setOpen: setDrawerOpen,
    }),
    [drawerHost, registerDrawerCloseHandler],
  );
  onCloseRef.current = onClose;

  React.useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const returnFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const animationFrame = window.requestAnimationFrame(() => {
      const initialFocus = dialogRef.current?.querySelector<HTMLElement>(
        "[data-pane-editor-initial-focus]",
      );
      (initialFocus ?? dialogRef.current)?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (drawerCloseRef.current !== null) {
          drawerCloseRef.current();
          return;
        }
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
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [open]);

  const scrollToSection = React.useCallback(
    (targetId: string, behavior: ScrollBehavior = "smooth") => {
      const root = contentRef.current;
      const target = root?.querySelector<HTMLElement>(`#${targetId}`);
      if (root === null || target === null || target === undefined) return;
      const rootTop = root.getBoundingClientRect().top;
      const targetTop = target.getBoundingClientRect().top;
      root.scrollTo({
        top: root.scrollTop + targetTop - rootTop,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : behavior,
      });
      setActiveSectionId(targetId);
    },
    [],
  );

  React.useEffect(() => {
    if (!open || initialSection === undefined) return undefined;
    let nestedFrame = 0;
    const animationFrame = window.requestAnimationFrame(() => {
      nestedFrame = window.requestAnimationFrame(() => {
        scrollToSection(paneSettingsTargetIdV3(initialSection), "auto");
      });
    });
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(nestedFrame);
    };
  }, [initialSection, open, scrollToSection]);

  React.useEffect(() => {
    if (!open) return undefined;
    const root = contentRef.current;
    if (root === null) return undefined;
    let animationFrame = 0;
    const updateActiveSection = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const activationLine = root.getBoundingClientRect().top + 12;
        const sections = Array.from(
          root.querySelectorAll<HTMLElement>(
            ".workbench-pane-settings-section[id]",
          ),
        );
        const active = sections.reduce<HTMLElement | null>(
          (current, section) =>
            section.getBoundingClientRect().top <= activationLine
              ? section
              : current,
          sections[0] ?? null,
        );
        if (active !== null) setActiveSectionId(active.id);
      });
    };
    updateActiveSection();
    root.addEventListener("scroll", updateActiveSection, { passive: true });
    return () => {
      window.cancelAnimationFrame(animationFrame);
      root.removeEventListener("scroll", updateActiveSection);
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;
  const pane = findWorkbenchSurfacePaneV3(draftSurface, selectedPane);
  const graphDefinition =
    pane?.role === "graph"
      ? contract.graphCatalog.find(({ graphId }) => graphId === pane.graphId)
      : undefined;
  const dataSectionTitle =
    pane?.role === "output"
      ? strings.outputCatalog
      : pane?.role === "control"
        ? strings.controlCatalog
        : pane?.role === "graph" &&
            graphDefinition?.renderer !== "structural-return"
          ? strings.seriesCatalog
          : strings.dataSection;
  const graphDisplaySettingsAvailable =
    workbenchGraphDisplaySettingsAvailableV3(
      graphDefinition?.renderer,
      periodicPvaSupported,
      pane?.role === "graph" ? pane.pressureVolumeAnalysisMode : undefined,
    );

  const updateSelectedPane = (
    update: (candidate: WorkbenchSurfacePaneV3) => WorkbenchSurfacePaneV3,
  ) => {
    setDraftSurface((current) =>
      reconcileWorkbenchGraphColorsV3(
        updateWorkbenchSurfacePaneV3(current, selectedPane, update),
        scenarios,
      ),
    );
  };

  const finishEditing = () => {
    onChange(draftSurface);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/35 sm:items-center sm:p-4"
      data-testid="workbench-pane-editor-v3"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={strings.title}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="workbench-pane-editor workbench-sheet-enter flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-wb-panel text-wb-text shadow-2xl outline-none sm:h-auto sm:max-h-[min(92dvh,58rem)] sm:max-w-6xl sm:rounded-xl sm:ring-1 sm:ring-wb-line"
      >
        <PaneEditorDrawerContextV3.Provider value={drawerContext}>
          <header className="workbench-pane-editor-header flex min-h-16 shrink-0 items-center gap-3 border-b border-wb-line px-4 py-3 sm:px-5">
            <div className="min-w-0 flex-1">
              <p id={descriptionId} className="workbench-pane-editor-kicker">
                {strings.paneKinds[selectedPane.kind]}
              </p>
              <h2 id={titleId} className="workbench-pane-editor-title truncate">
                {pane?.label ?? strings.title}
              </h2>
            </div>
            <button
              type="button"
              data-pane-editor-initial-focus
              className="workbench-pane-editor-close inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors duration-150 hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              aria-label={strings.close}
              onClick={onClose}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div
            className="workbench-pane-editor-body relative isolate flex min-h-0 flex-1"
            data-context-drawer-open={drawerOpen ? "true" : "false"}
          >
            <nav
              className="workbench-pane-editor-nav hidden min-h-0 w-44 shrink-0 border-r border-wb-line px-3 py-4 sm:block"
              aria-label={strings.title}
            >
              <PaneSettingsJumpV3
                active={activeSectionId === "pane-settings-general-v3"}
                targetId="pane-settings-general-v3"
                label={strings.generalSection}
                onNavigate={scrollToSection}
              />
              {pane?.role === "graph" && graphDisplaySettingsAvailable && (
                <PaneSettingsJumpV3
                  active={activeSectionId === "pane-settings-display-v3"}
                  targetId="pane-settings-display-v3"
                  label={strings.displaySection}
                  onNavigate={scrollToSection}
                />
              )}
              {(pane?.role === "output" || pane?.role === "control") && (
                <PaneSettingsJumpV3
                  active={activeSectionId === "pane-settings-binding-v3"}
                  targetId="pane-settings-binding-v3"
                  label={strings.bindingSection}
                  onNavigate={scrollToSection}
                />
              )}
              <PaneSettingsJumpV3
                active={activeSectionId === "pane-settings-data-v3"}
                targetId="pane-settings-data-v3"
                label={dataSectionTitle}
                onNavigate={scrollToSection}
              />
              {pane?.role === "graph" && (
                <PaneSettingsJumpV3
                  active={activeSectionId === "pane-settings-color-v3"}
                  targetId="pane-settings-color-v3"
                  label={strings.scenarioColors}
                  onNavigate={scrollToSection}
                />
              )}
            </nav>
            <div
              ref={contentRef}
              className="workbench-pane-editor-content min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pb-6 pt-0 sm:px-6 sm:pt-0"
            >
              {pane !== undefined && (
                <div className="workbench-pane-settings-sections">
                  <section
                    id="pane-settings-general-v3"
                    className="workbench-pane-settings-section space-y-3"
                  >
                    <EditorSectionHeadingV3>
                      {strings.generalSection}
                    </EditorSectionHeadingV3>
                    <PanePresentationEditorV3
                      label={pane.label}
                      strings={strings}
                      onLabelChange={(label) =>
                        updateSelectedPane((candidate) => ({
                          ...candidate,
                          label,
                        }))
                      }
                    />
                  </section>

                  {pane.role === "graph" && (
                    <GraphPaneEditorV3
                      appTheme={appTheme}
                      contract={contract}
                      locale={locale}
                      pane={pane}
                      periodicPvaSupported={periodicPvaSupported}
                      scenarios={scenarios}
                      surface={draftSurface}
                      strings={strings}
                      dataSectionTitle={dataSectionTitle}
                      onChange={(nextPane) =>
                        updateSelectedPane(() => nextPane)
                      }
                    />
                  )}
                  {pane.role === "output" && (
                    <OutputPaneEditorV3
                      contract={contract}
                      initialItemIntent={initialItemIntent}
                      locale={locale}
                      pane={pane}
                      scenarios={scenarios}
                      strings={strings}
                      dataSectionTitle={dataSectionTitle}
                      onChange={(nextPane) =>
                        updateSelectedPane(() => nextPane)
                      }
                    />
                  )}
                  {pane.role === "control" && (
                    <ControlPaneEditorV3
                      contract={contract}
                      initialItemIntent={initialItemIntent}
                      locale={locale}
                      pane={pane}
                      scenarios={scenarios}
                      strings={strings}
                      dataSectionTitle={dataSectionTitle}
                      onChange={(nextPane) =>
                        updateSelectedPane(() => nextPane)
                      }
                    />
                  )}
                </div>
              )}
            </div>
            <div
              ref={setDrawerHost}
              className="workbench-pane-context-host pointer-events-none relative min-h-0 shrink-0 self-stretch overflow-hidden"
              data-open={drawerOpen ? "true" : "false"}
              data-testid="pane-settings-drawer-host-v3"
            />
          </div>

          <footer className="workbench-pane-editor-footer flex shrink-0 items-center justify-end gap-2 border-t border-wb-line px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5">
            <button
              type="button"
              data-testid="pane-settings-cancel-v3"
              className="inline-flex min-h-9 items-center justify-center rounded-md px-3 text-xs font-medium text-wb-muted transition-colors duration-150 hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              onClick={onClose}
            >
              {strings.cancel}
            </button>
            <button
              type="button"
              data-testid="pane-settings-done-v3"
              className="inline-flex min-h-9 min-w-16 items-center justify-center rounded-md bg-wb-primary px-3 text-xs font-semibold text-white transition-colors duration-150 hover:bg-wb-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-wb-panel"
              disabled={pane === undefined}
              onClick={finishEditing}
            >
              {strings.done}
            </button>
          </footer>
        </PaneEditorDrawerContextV3.Provider>
      </div>
    </div>,
    document.body,
  );
}

function PaneSettingsJumpV3({
  active,
  label,
  onNavigate,
  targetId,
}: Readonly<{
  active: boolean;
  label: string;
  onNavigate: (targetId: string) => void;
  targetId: string;
}>) {
  return (
    <button
      type="button"
      aria-current={active ? "location" : undefined}
      data-active={active ? "true" : "false"}
      className="workbench-pane-editor-nav-item block min-h-9 w-full rounded-lg px-2.5 text-left hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
      onClick={() => onNavigate(targetId)}
    >
      {label}
    </button>
  );
}

function paneSettingsTargetIdV3(section: WorkbenchPaneEditorSectionV3): string {
  return section === "items"
    ? "pane-settings-data-v3"
    : "pane-settings-binding-v3";
}

function PanePresentationEditorV3({
  label,
  strings,
  onLabelChange,
}: Readonly<{
  label: string;
  strings: WorkbenchPaneEditorStringsV3;
  onLabelChange: (label: string) => void;
}>) {
  return (
    <div className="grid grid-cols-1">
      <CommitTextInputV3
        label={strings.label}
        value={label}
        onCommit={onLabelChange}
      />
    </div>
  );
}

function GraphPaneEditorV3({
  appTheme,
  contract,
  dataSectionTitle,
  locale,
  pane,
  periodicPvaSupported,
  scenarios,
  surface,
  strings,
  onChange,
}: Readonly<{
  appTheme: "light" | "dark";
  contract: ModelContractV2;
  dataSectionTitle: string;
  locale: "en" | "ja";
  pane: ExperimentSurfaceGraphPaneV2;
  periodicPvaSupported: boolean;
  scenarios: readonly Readonly<{ scenarioId: string; label: string }>[];
  surface: ExperimentSurfaceV2;
  strings: WorkbenchPaneEditorStringsV3;
  onChange: (pane: ExperimentSurfaceGraphPaneV2) => void;
}>) {
  const graph = contract.graphCatalog.find(
    ({ graphId }) => graphId === pane.graphId,
  );
  return (
    <>
      {workbenchGraphDisplaySettingsAvailableV3(
        graph?.renderer,
        periodicPvaSupported,
        pane.pressureVolumeAnalysisMode,
      ) && (
        <section
          id="pane-settings-display-v3"
          className="workbench-pane-settings-section space-y-4"
        >
          <EditorSectionHeadingV3>
            {strings.displaySection}
          </EditorSectionHeadingV3>
          {graph?.renderer === "sweep" && (
            <div className="grid gap-1.5">
              <PaneRangeInputV3
                label={strings.windowSec}
                value={pane.windowSec ?? WORKBENCH_SWEEP_WINDOW_DEFAULT_SEC_V3}
                minimum={WORKBENCH_SWEEP_WINDOW_MIN_SEC_V3}
                maximum={WORKBENCH_SWEEP_WINDOW_MAX_SEC_V3}
                step={WORKBENCH_SWEEP_WINDOW_STEP_SEC_V3}
                unit="s"
                onCommit={(windowSec) => onChange({ ...pane, windowSec })}
              />
              <p className="text-[10px] text-wb-subtle">
                {strings.windowSecHint}
              </p>
            </div>
          )}
          {graph?.renderer === "pressure-volume" &&
            periodicPvaSupported &&
            pane.pressureVolumeAnalysisMode !== "raw-exact-orbit" && (
              <button
                type="button"
                aria-pressed={
                  pane.showPressureEnvelope ??
                  WORKBENCH_PRESSURE_VOLUME_ENVELOPE_DEFAULT_VISIBLE_V3
                }
                className={`block w-full rounded-xl px-3 py-3 text-left transition-colors ${
                  (pane.showPressureEnvelope ??
                  WORKBENCH_PRESSURE_VOLUME_ENVELOPE_DEFAULT_VISIBLE_V3)
                    ? "bg-wb-selected text-wb-text"
                    : "bg-wb-soft/55 text-wb-muted hover:bg-wb-hover hover:text-wb-text"
                }`}
                onClick={() =>
                  onChange({
                    ...pane,
                    showPressureEnvelope: !(
                      pane.showPressureEnvelope ??
                      WORKBENCH_PRESSURE_VOLUME_ENVELOPE_DEFAULT_VISIBLE_V3
                    ),
                  })
                }
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium">
                    {strings.pressureEnvelopeOverlay}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`relative h-4 w-7 rounded-full transition-colors ${
                      (pane.showPressureEnvelope ??
                      WORKBENCH_PRESSURE_VOLUME_ENVELOPE_DEFAULT_VISIBLE_V3)
                        ? "bg-wb-accent"
                        : "bg-wb-border"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
                        (pane.showPressureEnvelope ??
                        WORKBENCH_PRESSURE_VOLUME_ENVELOPE_DEFAULT_VISIBLE_V3)
                          ? "translate-x-3.5"
                          : "translate-x-0.5"
                      }`}
                    />
                  </span>
                </span>
                <span className="mt-1 block text-[10px] leading-4 text-wb-subtle">
                  {strings.pressureEnvelopeOverlayHint}
                </span>
              </button>
            )}
        </section>
      )}

      <section
        id="pane-settings-data-v3"
        className="workbench-pane-settings-section space-y-4"
      >
        <EditorSectionHeadingV3>{dataSectionTitle}</EditorSectionHeadingV3>
        {graph !== undefined && scenarios.length > 0 && (
          <GraphTraceVisibilityEditorV3
            contract={contract}
            graph={graph}
            locale={locale}
            pane={pane}
            scenarios={scenarios}
            strings={strings}
            onChange={onChange}
          />
        )}
        {graph !== undefined && graph.renderer !== "structural-return" ? (
          <CatalogSelectionV3
            emptyText={strings.emptyCatalog}
            entries={graph.seriesCatalog.map((series) => {
              const selectedItem = pane.series.find(
                ({ seriesId }) => seriesId === series.seriesId,
              );
              const presentation = resolveGraphSeriesPresentationV3({
                contract,
                graph,
                locale,
                seriesId: series.seriesId,
                storedLabel: selectedItem?.label,
              });
              return {
                id: series.seriesId,
                defaultLabel: graphSeriesLabelV3(series.seriesId),
                ...(presentation === undefined
                  ? {}
                  : { description: presentation.description }),
                label: presentation?.label ?? selectedItem?.label,
                selected: selectedItem !== undefined,
                disableDeselect:
                  selectedItem !== undefined && pane.series.length === 1,
              };
            })}
            strings={strings}
            onToggle={(seriesId) => {
              const existing = pane.series.find(
                (series) => series.seriesId === seriesId,
              );
              if (existing !== undefined) {
                if (pane.series.length === 1) return;
                onChange({
                  ...pane,
                  series: pane.series.filter(
                    (series) => series.seriesId !== seriesId,
                  ),
                  traceColors: pane.traceColors?.filter(
                    (trace) => trace.seriesId !== seriesId,
                  ),
                  excludedTraces: pane.excludedTraces.filter(
                    (trace) => trace.seriesId !== seriesId,
                  ),
                });
                return;
              }
              const next: ExperimentSurfaceGraphSeriesV2 = {
                seriesId,
                label: graphSeriesLabelV3(seriesId),
                order: nextOrderV3(pane.series),
              };
              onChange({ ...pane, series: [...pane.series, next] });
            }}
            onLabelChange={(seriesId, label) =>
              onChange({
                ...pane,
                series: pane.series.map((series) =>
                  series.seriesId === seriesId ? { ...series, label } : series,
                ),
              })
            }
          />
        ) : (
          <p className="rounded-lg bg-wb-soft px-3 py-3 text-xs leading-5 text-wb-muted">
            {strings.noConfigurableSeries}
          </p>
        )}
      </section>
      {graph !== undefined && scenarios.length > 0 && (
        <section
          id="pane-settings-color-v3"
          className="workbench-pane-settings-section space-y-3"
        >
          <EditorSectionHeadingV3>
            {strings.scenarioColors}
          </EditorSectionHeadingV3>
          <ScenarioTraceColorEditorV3
            appTheme={appTheme}
            contract={contract}
            graph={graph}
            locale={locale}
            pane={pane}
            scenarios={scenarios}
            strings={strings}
            surface={surface}
            onChange={onChange}
          />
        </section>
      )}
    </>
  );
}

function resolveGraphSeriesPresentationV3(
  input: Readonly<{
    contract: ModelContractV2;
    graph: GraphDefinitionV2;
    locale: "en" | "ja";
    seriesId: string;
    storedLabel: string | undefined;
  }>,
): ResolvedStudioItemPresentationV1 | undefined {
  if (!("seriesCatalog" in input.graph)) return undefined;
  const binding = input.graph.seriesCatalog.find(
    ({ seriesId }) => seriesId === input.seriesId,
  );
  if (binding === undefined || !("outputId" in binding)) return undefined;
  return resolveWorkbenchGraphSeriesPresentationV3({
    definition: input.contract.outputCatalog.find(
      ({ outputId }) => outputId === binding.outputId,
    ),
    locale: input.locale,
    outputId: binding.outputId,
    seriesId: binding.seriesId,
    storedLabel: input.storedLabel,
  });
}

function GraphTraceVisibilityEditorV3({
  contract,
  graph,
  locale,
  pane,
  scenarios,
  strings,
  onChange,
}: Readonly<{
  contract: ModelContractV2;
  graph: GraphDefinitionV2;
  locale: "en" | "ja";
  pane: ExperimentSurfaceGraphPaneV2;
  scenarios: readonly Readonly<{ scenarioId: string; label: string }>[];
  strings: WorkbenchPaneEditorStringsV3;
  onChange: (pane: ExperimentSurfaceGraphPaneV2) => void;
}>) {
  const traceItems =
    graph.renderer === "structural-return"
      ? [{ seriesId: null, label: "Guyton / Starling" }]
      : [...pane.series]
          .sort((left, right) => left.order - right.order)
          .map(({ seriesId, label }) => ({
            seriesId,
            label:
              resolveGraphSeriesPresentationV3({
                contract,
                graph,
                locale,
                seriesId,
                storedLabel: label,
              })?.label ?? label,
          }));
  const visibleTraceCount = scenarios.reduce((count, scenario) => {
    return (
      count +
      traceItems.filter(
        ({ seriesId }) =>
          !pane.excludedTraces.some(
            (trace) =>
              trace.scenarioId === scenario.scenarioId &&
              trace.seriesId === seriesId,
          ),
      ).length
    );
  }, 0);

  const updateTrace = (
    scenarioId: string,
    seriesId: string | null,
    visible: boolean,
  ) => {
    const retained = pane.excludedTraces.filter(
      (trace) => trace.scenarioId !== scenarioId || trace.seriesId !== seriesId,
    );
    onChange({
      ...pane,
      excludedTraces: visible
        ? retained
        : [...retained, { scenarioId, seriesId }],
    });
  };

  return (
    <div className="grid gap-4 rounded-xl bg-wb-soft/55 px-3 py-3">
      <div>
        <p className="text-xs font-semibold text-wb-text">
          {strings.traceVisibility}
        </p>
        <p className="mt-1 text-[10px] leading-4 text-wb-subtle">
          {strings.traceVisibilityHint}
        </p>
        <div className="mt-3 grid gap-3">
          {scenarios.map((scenario) => {
            return (
              <fieldset
                key={scenario.scenarioId}
                className="grid gap-2 rounded-lg bg-wb-panel/70 px-3 py-2.5"
              >
                <legend className="px-1 text-[10px] font-semibold text-wb-muted">
                  {scenario.label}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {traceItems.map((item) => {
                    const excluded = pane.excludedTraces.some(
                      (trace) =>
                        trace.scenarioId === scenario.scenarioId &&
                        trace.seriesId === item.seriesId,
                    );
                    const visible = !excluded;
                    return (
                      <label
                        key={item.seriesId ?? "structural"}
                        className="inline-flex items-center gap-1.5 text-[10px] text-wb-muted"
                      >
                        <input
                          type="checkbox"
                          checked={visible}
                          disabled={visible && visibleTraceCount === 1}
                          onChange={(event) =>
                            updateTrace(
                              scenario.scenarioId,
                              item.seriesId,
                              event.currentTarget.checked,
                            )
                          }
                          className="accent-[var(--wb-accent)]"
                        />
                        {item.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function updateWorkbenchGraphTraceCustomColorV3(
  pane: ExperimentSurfaceGraphPaneV2,
  input: Readonly<{
    scenarioId: string;
    seriesId: string | null;
    colorHex: string | null;
  }>,
): ExperimentSurfaceGraphPaneV2 {
  let found = false;
  const next = (pane.traceColors ?? []).map((trace) => {
    if (
      trace.scenarioId !== input.scenarioId ||
      trace.seriesId !== input.seriesId
    )
      return trace;
    found = true;
    if (input.colorHex === null) {
      if (trace.customColorHex === undefined) return trace;
      const { customColorHex: _customColorHex, ...automatic } = trace;
      return Object.freeze(automatic);
    }
    return Object.freeze({
      ...trace,
      customColorHex: canonicalWorkbenchColorHexV3(input.colorHex),
    });
  });
  // Workbench surfaces are reconciled before editing. Failing closed here
  // prevents a color interaction from inventing an unreviewed automatic color.
  if (!found) return pane;
  return {
    ...pane,
    traceColors: next,
  };
}

function ScenarioTraceColorEditorV3({
  appTheme,
  contract,
  graph,
  locale,
  pane,
  scenarios,
  strings,
  surface,
  onChange,
}: Readonly<{
  appTheme: "light" | "dark";
  contract: ModelContractV2;
  graph: GraphDefinitionV2;
  locale: "en" | "ja";
  pane: ExperimentSurfaceGraphPaneV2;
  scenarios: readonly Readonly<{ scenarioId: string; label: string }>[];
  strings: WorkbenchPaneEditorStringsV3;
  surface: ExperimentSurfaceV2;
  onChange: (pane: ExperimentSurfaceGraphPaneV2) => void;
}>) {
  const series = [...pane.series].sort(
    (left, right) => left.order - right.order,
  );
  return (
    <div className="rounded-xl bg-wb-soft/55 px-3 py-3">
      <p className="pb-3 text-[10px] leading-4 text-wb-subtle">
        {strings.scenarioColorsHint}
      </p>
      <div className="grid gap-3">
        {scenarios.map((scenario, scenarioIndex) => {
          const scenarioTrace = pane.traceColors?.find(
            (trace) =>
              trace.scenarioId === scenario.scenarioId &&
              trace.seriesId === null,
          );
          const scenarioBaseColor = workbenchScenarioColorSeedV3({
            surface,
            scenarioId: scenario.scenarioId,
            scenarioIndex,
          });
          const structuralTraceColor = resolveWorkbenchGraphTraceStyleV3({
            pane,
            surface,
            renderer: graph.renderer,
            authoredScenarioCount: scenarios.length,
            scenarioId: scenario.scenarioId,
            scenarioIndex,
            seriesId: null,
            appTheme,
          }).color;
          return (
            <section
              key={scenario.scenarioId}
              className="rounded-lg bg-wb-panel/70 px-3 py-3"
            >
              <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold text-wb-text">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: scenarioBaseColor }}
                />
                {scenario.label}
              </h4>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {graph.renderer === "structural-return" && (
                  <TraceColorInputV3
                    colorHex={structuralTraceColor}
                    customized={scenarioTrace?.customColorHex !== undefined}
                    label="Guyton / Starling"
                    resetLabel={strings.resetColor}
                    onChange={(colorHex) =>
                      onChange(
                        updateWorkbenchGraphTraceCustomColorV3(pane, {
                          scenarioId: scenario.scenarioId,
                          seriesId: null,
                          colorHex,
                        }),
                      )
                    }
                    onReset={() =>
                      onChange(
                        updateWorkbenchGraphTraceCustomColorV3(pane, {
                          scenarioId: scenario.scenarioId,
                          seriesId: null,
                          colorHex: null,
                        }),
                      )
                    }
                  />
                )}
                {graph.renderer !== "structural-return" &&
                  series.map((item) => {
                    const exactTrace = pane.traceColors?.find(
                      (trace) =>
                        trace.scenarioId === scenario.scenarioId &&
                        trace.seriesId === item.seriesId,
                    );
                    const resolved = resolveWorkbenchGraphTraceStyleV3({
                      pane,
                      surface,
                      renderer: graph.renderer,
                      authoredScenarioCount: scenarios.length,
                      scenarioId: scenario.scenarioId,
                      scenarioIndex,
                      seriesId: item.seriesId,
                      seriesIndex: series.findIndex(
                        ({ seriesId }) => seriesId === item.seriesId,
                      ),
                      appTheme,
                    });
                    return (
                      <TraceColorInputV3
                        key={item.seriesId}
                        colorHex={resolved.color}
                        customized={exactTrace?.customColorHex !== undefined}
                        label={
                          resolveGraphSeriesPresentationV3({
                            contract,
                            graph,
                            locale,
                            seriesId: item.seriesId,
                            storedLabel: item.label,
                          })?.label ?? item.label
                        }
                        resetLabel={strings.resetColor}
                        onChange={(colorHex) =>
                          onChange(
                            updateWorkbenchGraphTraceCustomColorV3(pane, {
                              scenarioId: scenario.scenarioId,
                              seriesId: item.seriesId,
                              colorHex,
                            }),
                          )
                        }
                        onReset={() =>
                          onChange(
                            updateWorkbenchGraphTraceCustomColorV3(pane, {
                              scenarioId: scenario.scenarioId,
                              seriesId: item.seriesId,
                              colorHex: null,
                            }),
                          )
                        }
                      />
                    );
                  })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TraceColorInputV3({
  colorHex,
  customized,
  label,
  resetLabel,
  onChange,
  onReset,
}: Readonly<{
  colorHex: string;
  customized: boolean;
  label: string;
  resetLabel: string;
  onChange: (colorHex: string) => void;
  onReset: () => void;
}>) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_2rem] items-end gap-1">
      <ColorInputV3 label={label} value={colorHex} onChange={onChange} />
      <button
        type="button"
        disabled={!customized}
        aria-label={`${resetLabel}: ${label}`}
        title={resetLabel}
        className="mb-px inline-flex h-9 w-8 items-center justify-center rounded-md text-wb-subtle hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent disabled:invisible"
        onClick={onReset}
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

function OutputPaneEditorV3({
  contract,
  dataSectionTitle,
  initialItemIntent,
  locale,
  pane,
  scenarios,
  strings,
  onChange,
}: Readonly<{
  contract: ModelContractV2;
  dataSectionTitle: string;
  initialItemIntent?: WorkbenchPaneEditorItemIntentV3;
  locale: "en" | "ja";
  pane: ExperimentSurfaceOutputPaneV2;
  scenarios: readonly Readonly<{ scenarioId: string; label: string }>[];
  strings: WorkbenchPaneEditorStringsV3;
  onChange: (pane: ExperimentSurfaceOutputPaneV2) => void;
}>) {
  const pressureSummaryById = new Map(
    STUDIO_OUTPUT_PRESSURE_SUMMARIES_V1.map((summary) => [
      summary.presentationId,
      summary,
    ]),
  );
  const entries = outputPaneItemManagerEntriesV3({ contract, locale, pane });
  return (
    <>
      <section
        id="pane-settings-binding-v3"
        className="workbench-pane-settings-section space-y-4"
      >
        <EditorSectionHeadingV3>
          {strings.bindingSection}
        </EditorSectionHeadingV3>
        <WorkbenchPaneBindingEditorV3
          activeDescription={strings.outputActiveSlotBindingHint}
          activeLabel={strings.activeSlotBinding}
          allowMultipleFixed={false}
          fixedDescription={strings.outputFixedBindingHint}
          fixedLabel={strings.fixedBinding}
          fixedScenarioIds={
            pane.binding.mode === "fixed" ? [pane.binding.scenarioId] : []
          }
          groupLabel={strings.bindingSection}
          mode={pane.binding.mode}
          scenarios={scenarios}
          onChange={(mode, scenarioIds) =>
            onChange({
              ...pane,
              binding:
                mode === "active-slot"
                  ? { mode: "active-slot" }
                  : { mode: "fixed", scenarioId: scenarioIds[0]! },
            })
          }
        />
      </section>
      <PaneItemManagerV3
        sectionId="pane-settings-data-v3"
        initialItemIntent={initialItemIntent}
        title={dataSectionTitle}
        emptyText={strings.emptyCatalog}
        entries={entries}
        strings={strings}
        onAdd={(itemId) => {
          const summary = pressureSummaryById.get(itemId);
          const memberOutputIds = summary?.memberOutputIds ?? [itemId];
          const existingOutputIds = new Set(
            pane.items.map(({ outputId }) => outputId),
          );
          const availableMemberIds = memberOutputIds.filter((outputId) =>
            contract.outputCatalog.some(
              (candidate) => candidate.outputId === outputId,
            ),
          );
          const missingMemberIds = availableMemberIds.filter(
            (outputId) => !existingOutputIds.has(outputId),
          );
          if (missingMemberIds.length === 0) return;
          const firstOrder = nextOrderV3(pane.items);
          const canonicalGroupLabel =
            summary === undefined
              ? undefined
              : resolveStudioItemPresentationV1({
                  kind: "output",
                  itemId: summary.presentationId,
                  fallbackEnglishLabel: summary.presentationId,
                  locale: "en",
                }).canonicalEnglishLabel;
          const additions = missingMemberIds.map(
            (outputId, index): ExperimentSurfaceOutputItemV2 => ({
              outputId,
              label: canonicalGroupLabel ?? outputLabelV3(outputId),
              order: firstOrder + index,
            }),
          );
          onChange({ ...pane, items: [...pane.items, ...additions] });
        }}
        onRemove={(itemId) => {
          const summary = pressureSummaryById.get(itemId);
          const removedIds = new Set(summary?.memberOutputIds ?? [itemId]);
          onChange({
            ...pane,
            items: pane.items.filter(
              ({ outputId }) => !removedIds.has(outputId),
            ),
          });
        }}
        onReorder={(orderedIds) =>
          onChange({
            ...pane,
            items: reorderPaneItemsV3(
              pane.items,
              orderedIds.flatMap(
                (itemId) =>
                  pressureSummaryById.get(itemId)?.memberOutputIds ?? [itemId],
              ),
              (item) => item.outputId,
            ),
          })
        }
        onLabelChange={(itemId, label) =>
          onChange({
            ...pane,
            items: pane.items.map((item) => {
              const summary = pressureSummaryById.get(itemId);
              const matches =
                summary?.memberOutputIds.includes(item.outputId) ??
                item.outputId === itemId;
              return matches ? { ...item, label } : item;
            }),
          })
        }
      />
    </>
  );
}

function outputPaneItemManagerEntriesV3(
  input: Readonly<{
    contract: ModelContractV2;
    locale: "en" | "ja";
    pane: ExperimentSurfaceOutputPaneV2;
  }>,
): readonly PaneItemManagerEntryV3[] {
  const outputById = new Map(
    input.contract.outputCatalog.map((output) => [output.outputId, output]),
  );
  const selectedById = new Map(
    input.pane.items.map((item) => [item.outputId, item]),
  );
  const summaryStates = STUDIO_OUTPUT_PRESSURE_SUMMARIES_V1.map((summary) => {
    const definitions = summary.memberOutputIds.flatMap((outputId) => {
      const definition = outputById.get(outputId);
      return definition === undefined ? [] : [definition];
    });
    const selectedItems = summary.memberOutputIds.flatMap((outputId) => {
      const item = selectedById.get(outputId);
      return item === undefined ? [] : [item];
    });
    return { summary, definitions, selectedItems };
  });
  const groupedOutputIds = new Set(
    summaryStates.flatMap(({ summary, definitions, selectedItems }) => {
      const isPartialSelection =
        selectedItems.length > 0 &&
        selectedItems.length < summary.memberOutputIds.length;
      return definitions.length === summary.memberOutputIds.length &&
        !isPartialSelection
        ? summary.memberOutputIds
        : [];
    }),
  );
  const summaries = summaryStates.flatMap(
    ({ summary, definitions, selectedItems }) => {
      const isPartialSelection =
        selectedItems.length > 0 &&
        selectedItems.length < summary.memberOutputIds.length;
      if (
        definitions.length !== summary.memberOutputIds.length ||
        isPartialSelection
      )
        return [];
      return [
        {
          ...resolvePaneItemManagerPresentationV3({
            kind: "output",
            id: summary.presentationId,
            storedLabel: resolveStudioOutputPressureSummaryStoredLabelV1({
              summary,
              items: selectedItems,
              locale: input.locale,
              fallbackEnglishLabel: outputLabelV3,
            }),
            locale: input.locale,
            catalogFacts: {
              outputKind: "metric",
            },
          }),
          selected: selectedItems.length === summary.memberOutputIds.length,
          disableDeselect: false,
          order:
            selectedItems.length === 0
              ? undefined
              : Math.min(...selectedItems.map(({ order }) => order)),
        },
      ];
    },
  );
  const scalars = input.contract.outputCatalog
    .filter(({ outputId }) => !groupedOutputIds.has(outputId))
    .map((output): PaneItemManagerEntryV3 => {
      const selectedItem = selectedById.get(output.outputId);
      return {
        ...resolvePaneItemManagerPresentationV3({
          kind: "output",
          id: output.outputId,
          storedLabel: selectedItem?.label,
          locale: input.locale,
          catalogFacts: {
            outputKind: output.kind,
          },
        }),
        selected: selectedItem !== undefined,
        disableDeselect: false,
        order: selectedItem?.order,
      };
    });
  return [...summaries, ...scalars];
}

function ControlPaneEditorV3({
  contract,
  dataSectionTitle,
  initialItemIntent,
  locale,
  pane,
  scenarios,
  strings,
  onChange,
}: Readonly<{
  contract: ModelContractV2;
  dataSectionTitle: string;
  initialItemIntent?: WorkbenchPaneEditorItemIntentV3;
  locale: "en" | "ja";
  pane: ExperimentSurfaceControlPaneV2;
  scenarios: readonly Readonly<{ scenarioId: string; label: string }>[];
  strings: WorkbenchPaneEditorStringsV3;
  onChange: (pane: ExperimentSurfaceControlPaneV2) => void;
}>) {
  return (
    <>
      <section
        id="pane-settings-binding-v3"
        className="workbench-pane-settings-section space-y-4"
      >
        <EditorSectionHeadingV3>
          {strings.bindingSection}
        </EditorSectionHeadingV3>
        <WorkbenchPaneBindingEditorV3
          activeDescription={strings.activeSlotBindingHint}
          activeLabel={strings.activeSlotBinding}
          allowMultipleFixed
          fixedDescription={strings.fixedBindingHint}
          fixedLabel={strings.fixedBinding}
          fixedScenarioIds={
            pane.binding.mode === "fixed" ? pane.binding.scenarioIds : []
          }
          groupLabel={strings.bindingSection}
          mode={pane.binding.mode}
          scenarios={scenarios}
          onChange={(mode, scenarioIds) =>
            onChange({
              ...pane,
              binding:
                mode === "active-slot"
                  ? { mode: "active-slot" }
                  : { mode: "fixed", scenarioIds },
            })
          }
        />
      </section>

      <PaneItemManagerV3
        sectionId="pane-settings-data-v3"
        initialItemIntent={initialItemIntent}
        title={dataSectionTitle}
        emptyText={strings.emptyCatalog}
        entries={contract.controlCatalog.map((control) => {
          const selectedItem = pane.items.find(
            ({ controlId }) => controlId === control.controlId,
          );
          return {
            ...resolvePaneItemManagerPresentationV3({
              kind: "control",
              id: control.controlId,
              storedLabel: selectedItem?.label,
              locale,
              catalogFacts: {
                controlChangeSemantics: control.changeSemantics,
              },
            }),
            selected: selectedItem !== undefined,
            disableDeselect: false,
            order: selectedItem?.order,
          };
        })}
        strings={strings}
        onAdd={(controlId) => {
          if (pane.items.some((item) => item.controlId === controlId)) return;
          const next: ExperimentSurfaceControlItemV2 = {
            controlId,
            label: controlLabelV3(controlId),
            order: nextOrderV3(pane.items),
            presentation: { kind: "slider" },
          };
          onChange({ ...pane, items: [...pane.items, next] });
        }}
        onRemove={(controlId) =>
          onChange({
            ...pane,
            items: pane.items.filter((item) => item.controlId !== controlId),
          })
        }
        onReorder={(orderedIds) =>
          onChange({
            ...pane,
            items: reorderPaneItemsV3(
              pane.items,
              orderedIds,
              (item) => item.controlId,
            ),
          })
        }
        onLabelChange={(controlId, label) =>
          onChange({
            ...pane,
            items: pane.items.map((item) =>
              item.controlId === controlId ? { ...item, label } : item,
            ),
          })
        }
        renderItemEditor={(controlId) => {
          const item = pane.items.find(
            (candidate) => candidate.controlId === controlId,
          );
          const definition = contract.controlCatalog.find(
            (candidate) => candidate.controlId === controlId,
          );
          return item === undefined || definition === undefined ? null : (
            <ControlItemPresentationEditorV3
              definition={definition}
              item={item}
              strings={strings}
              onChange={(nextItem) =>
                onChange({
                  ...pane,
                  items: pane.items.map((candidate) =>
                    candidate.controlId === controlId ? nextItem : candidate,
                  ),
                })
              }
            />
          );
        }}
        renderItemPreview={(controlId) => {
          const item = pane.items.find(
            (candidate) => candidate.controlId === controlId,
          );
          const definition = contract.controlCatalog.find(
            (candidate) => candidate.controlId === controlId,
          );
          return item === undefined || definition === undefined ? null : (
            <ControlItemPreviewV3
              definition={definition}
              item={item}
              label={
                resolvePaneItemManagerPresentationV3({
                  kind: "control",
                  id: controlId,
                  storedLabel: item.label,
                  locale,
                }).label
              }
            />
          );
        }}
      />
    </>
  );
}

/*
 * Outputs and controls differ only in their numerical contract adapter. This
 * helper owns their shared presentation identity, localization, and legacy
 * label compatibility before both flow into PaneItemManagerV3.
 */
function resolvePaneItemManagerPresentationV3(
  input: Readonly<{
    kind: "control" | "output";
    id: string;
    storedLabel: string | undefined;
    locale: "en" | "ja";
    catalogFacts?: StudioItemPresentationCatalogFactsV1;
  }>,
): Pick<
  PaneItemManagerEntryV3,
  "id" | "defaultLabel" | "label" | "presentation"
> {
  const legacyDefaultLabel =
    input.kind === "output"
      ? outputLabelV3(input.id)
      : controlLabelV3(input.id);
  const presentation = resolveStudioItemPresentationV1({
    kind: input.kind,
    itemId: input.id,
    fallbackEnglishLabel: legacyDefaultLabel,
    locale: input.locale,
    catalogFacts: input.catalogFacts,
  });
  return {
    id: input.id,
    defaultLabel: presentation.label,
    label: resolveStudioSurfaceItemLabelV1({
      storedLabel: input.storedLabel,
      legacyDefaultLabel,
      presentation,
    }),
    presentation,
  };
}

function ControlItemPresentationEditorV3({
  definition,
  item,
  strings,
  onChange,
}: Readonly<{
  definition: ModelContractV2["controlCatalog"][number];
  item: ExperimentSurfaceControlItemV2;
  strings: WorkbenchPaneEditorStringsV3;
  onChange: (item: ExperimentSurfaceControlItemV2) => void;
}>) {
  const buttonPresentation =
    item.presentation.kind === "buttons" ? item.presentation : null;
  return (
    <div className="grid gap-3">
      <fieldset className="grid gap-1.5">
        <legend className="text-[10px] font-medium text-wb-subtle">
          {strings.controlPresentation}
        </legend>
        <div
          className="grid grid-cols-2 gap-1 rounded-lg bg-wb-input p-1"
          role="radiogroup"
        >
          {(["slider", "buttons"] as const).map((kind) => {
            const selected = item.presentation.kind === kind;
            const label =
              kind === "slider"
                ? strings.sliderPresentation
                : strings.buttonsPresentation;
            return (
              <button
                key={kind}
                type="button"
                role="radio"
                aria-checked={selected}
                className="workbench-selection-button min-h-8 rounded-md px-2.5 text-[10px] font-medium transition-[color,background-color,box-shadow,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                onClick={() =>
                  onChange({
                    ...item,
                    presentation:
                      kind === "buttons"
                        ? {
                            kind: "buttons",
                            options:
                              item.presentation.kind === "buttons"
                                ? item.presentation.options
                                : defaultWorkbenchControlButtonOptionsV3(
                                    definition,
                                  ),
                          }
                        : { kind: "slider" },
                  })
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>
      {buttonPresentation !== null && (
        <div className="grid gap-2">
          {buttonPresentation.options.map((option, optionIndex) => (
            <ControlButtonOptionEditorV3
              key={`${optionIndex}:${option.label}:${option.value}`}
              definition={definition}
              labelLabel={strings.buttonLabel}
              option={option}
              removeLabel={strings.removeButtonOption}
              valueLabel={`${strings.buttonValue} (${definition.unit})`}
              canRemove={buttonPresentation.options.length > 2}
              siblingOptions={buttonPresentation.options.filter(
                (_, index) => index !== optionIndex,
              )}
              onChange={(nextOption) =>
                onChange({
                  ...item,
                  presentation: {
                    kind: "buttons",
                    options: buttonPresentation.options.map(
                      (candidate, index) =>
                        index === optionIndex ? nextOption : candidate,
                    ),
                  },
                })
              }
              onRemove={() =>
                onChange({
                  ...item,
                  presentation: {
                    kind: "buttons",
                    options: buttonPresentation.options.filter(
                      (_, index) => index !== optionIndex,
                    ),
                  },
                })
              }
            />
          ))}
          <button
            type="button"
            disabled={buttonPresentation.options.length >= 6}
            className="inline-flex min-h-9 items-center justify-center rounded-md bg-wb-soft px-3 text-[10px] font-medium text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => {
              const next = nextWorkbenchControlButtonOptionV3(
                definition,
                buttonPresentation.options,
              );
              if (next === null) return;
              onChange({
                ...item,
                presentation: {
                  kind: "buttons",
                  options: [...buttonPresentation.options, next],
                },
              });
            }}
          >
            {strings.addButtonOption}
          </button>
        </div>
      )}
    </div>
  );
}

function ControlItemPreviewV3({
  definition,
  item,
  label,
}: Readonly<{
  definition: ModelContractV2["controlCatalog"][number];
  item: ExperimentSurfaceControlItemV2;
  label: string;
}>) {
  const value = definition.defaultValue;
  const progress =
    definition.maximum === definition.minimum
      ? 0
      : ((value - definition.minimum) /
          (definition.maximum - definition.minimum)) *
        100;
  return (
    <div className="workbench-control-inspector-preview">
      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <p className="truncate text-xs font-medium text-wb-text">{label}</p>
        <output
          className="shrink-0 font-mono text-xs text-wb-text"
          aria-label={`${value} ${definition.unit}`}
        >
          {value}
          <span className="ml-1 font-sans text-[10px] text-wb-subtle">
            {definition.unit}
          </span>
        </output>
      </div>
      {item.presentation.kind === "buttons" ? (
        <div className="workbench-control-segments mt-3" aria-hidden="true">
          {item.presentation.options.map((option) => (
            <span
              key={`${option.label}:${option.value}`}
              className="workbench-control-segment inline-flex items-center justify-center"
              data-active={option.value === value ? "true" : "false"}
            >
              {option.label}
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-3 flex h-7 items-center" aria-hidden="true">
          <span className="relative h-1 w-full rounded-full bg-wb-line-strong">
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-wb-accent"
              style={{ width: `${progress}%` }}
            />
            <span
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-wb-accent bg-wb-panel"
              style={{ left: `${progress}%` }}
            />
          </span>
        </div>
      )}
    </div>
  );
}

function ControlButtonOptionEditorV3({
  canRemove,
  definition,
  labelLabel,
  option,
  removeLabel,
  siblingOptions,
  valueLabel,
  onChange,
  onRemove,
}: Readonly<{
  canRemove: boolean;
  definition: ModelContractV2["controlCatalog"][number];
  labelLabel: string;
  option: Readonly<{ label: string; value: number }>;
  removeLabel: string;
  siblingOptions: readonly Readonly<{ label: string; value: number }>[];
  valueLabel: string;
  onChange: (option: Readonly<{ label: string; value: number }>) => void;
  onRemove: () => void;
}>) {
  const [labelDraft, setLabelDraft] = React.useState(option.label);
  const [valueDraft, setValueDraft] = React.useState(String(option.value));
  React.useEffect(() => setLabelDraft(option.label), [option.label]);
  React.useEffect(() => setValueDraft(String(option.value)), [option.value]);

  const commitLabel = () => {
    const label = labelDraft.trim();
    if (
      label.length === 0 ||
      siblingOptions.some((candidate) => candidate.label === label)
    ) {
      setLabelDraft(option.label);
      return;
    }
    setLabelDraft(label);
    if (label !== option.label) onChange({ ...option, label });
  };
  const commitValue = () => {
    const parsed = Number(valueDraft);
    if (!Number.isFinite(parsed)) {
      setValueDraft(String(option.value));
      return;
    }
    const value = normalizeWorkbenchControlOptionValueV3(parsed, definition);
    if (siblingOptions.some((candidate) => candidate.value === value)) {
      setValueDraft(String(option.value));
      return;
    }
    setValueDraft(String(value));
    if (value !== option.value) onChange({ ...option, value });
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,0.72fr)_2rem] items-end gap-2">
      <label className="grid min-w-0 gap-1 text-[10px] font-medium text-wb-subtle">
        <span>{labelLabel}</span>
        <input
          type="text"
          value={labelDraft}
          className="min-h-9 min-w-0 rounded-md bg-wb-input px-2.5 text-xs text-wb-text outline-none focus:ring-2 focus:ring-wb-accent"
          onChange={(event) => setLabelDraft(event.currentTarget.value)}
          onBlur={commitLabel}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") {
              setLabelDraft(option.label);
              event.currentTarget.blur();
            }
          }}
        />
      </label>
      <label className="grid min-w-0 gap-1 text-[10px] font-medium text-wb-subtle">
        <span>{valueLabel}</span>
        <input
          type="number"
          min={definition.minimum}
          max={definition.maximum}
          step={definition.step}
          value={valueDraft}
          className="min-h-9 min-w-0 rounded-md bg-wb-input px-2.5 font-mono text-xs text-wb-text outline-none focus:ring-2 focus:ring-wb-accent"
          onChange={(event) => setValueDraft(event.currentTarget.value)}
          onBlur={commitValue}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") {
              setValueDraft(String(option.value));
              event.currentTarget.blur();
            }
          }}
        />
      </label>
      <button
        type="button"
        disabled={!canRemove}
        aria-label={removeLabel}
        title={removeLabel}
        className="inline-flex h-9 w-8 items-center justify-center rounded-md text-wb-subtle transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent disabled:invisible"
        onClick={onRemove}
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

function defaultWorkbenchControlButtonOptionsV3(
  definition: ModelContractV2["controlCatalog"][number],
): readonly Readonly<{ label: string; value: number }>[] {
  const candidates = [
    definition.defaultValue - definition.step,
    definition.defaultValue,
    definition.defaultValue + definition.step,
    definition.minimum,
    definition.maximum,
  ].map((value) => normalizeWorkbenchControlOptionValueV3(value, definition));
  const values = [...new Set(candidates)].slice(0, 3);
  if (values.length < 2) values.push(definition.maximum);
  return values.map((value) =>
    Object.freeze({
      label: String(value),
      value,
    }),
  );
}

function nextWorkbenchControlButtonOptionV3(
  definition: ModelContractV2["controlCatalog"][number],
  options: readonly Readonly<{ label: string; value: number }>[],
): Readonly<{ label: string; value: number }> | null {
  const values = new Set(options.map(({ value }) => value));
  const labels = new Set(options.map(({ label }) => label));
  const anchor = options.at(-1)?.value ?? definition.defaultValue;
  const maximumSteps = Math.ceil(
    (definition.maximum - definition.minimum) / definition.step,
  );
  for (let distance = 1; distance <= maximumSteps; distance += 1) {
    for (const candidate of [
      anchor + distance * definition.step,
      anchor - distance * definition.step,
    ]) {
      const value = normalizeWorkbenchControlOptionValueV3(
        candidate,
        definition,
      );
      if (values.has(value)) continue;
      let label = String(value);
      let suffix = 2;
      while (labels.has(label)) {
        label = `${String(value)} ${suffix}`;
        suffix += 1;
      }
      return Object.freeze({ label, value });
    }
  }
  return null;
}

function normalizeWorkbenchControlOptionValueV3(
  value: number,
  definition: ModelContractV2["controlCatalog"][number],
): number {
  const clamped = Math.min(
    definition.maximum,
    Math.max(definition.minimum, value),
  );
  const steps = Math.round((clamped - definition.minimum) / definition.step);
  const normalized = definition.minimum + steps * definition.step;
  return Number(
    Math.min(
      definition.maximum,
      Math.max(definition.minimum, normalized),
    ).toPrecision(12),
  );
}

type PaneItemManagerEntryV3 = Readonly<{
  id: string;
  defaultLabel: string;
  label: string | undefined;
  presentation: ResolvedStudioItemPresentationV1;
  selected: boolean;
  disableDeselect: boolean;
  order: number | undefined;
}>;

type PaneItemDrawerViewV3 =
  | Readonly<{ kind: "catalog" }>
  | Readonly<{
      kind: "item";
      itemId: string;
      returnToCatalog: boolean;
    }>;

type PaneItemDrawerStateV3 = Readonly<{
  open: boolean;
  view: PaneItemDrawerViewV3;
}>;

type PaneItemCatalogTooltipStateV3 = Readonly<{
  description: string;
  itemId: string;
  label: string;
  left: number;
  placement: "above" | "below";
  top: number;
}>;

const PANE_ITEM_CATALOG_CATEGORY_ORDER_V3 = Object.freeze([
  "hemodynamics",
  "myocardium",
  "valves",
  "coronary",
  "oxygen",
  "pericardium",
  "rhythm",
  "ventilation",
  "mechanicalSupport",
  "advanced",
] as const satisfies readonly PaneItemCatalogCategoryV3[]);

const PANE_ITEM_CATALOG_DRAG_TYPE_V3 =
  "application/x-circleheart-pane-catalog-item-v3";

function PaneItemManagerV3({
  initialItemIntent,
  sectionId,
  title,
  emptyText,
  entries,
  strings,
  onAdd,
  onRemove,
  onReorder,
  onLabelChange,
  renderItemEditor,
  renderItemPreview,
}: Readonly<{
  initialItemIntent?: WorkbenchPaneEditorItemIntentV3;
  sectionId: string;
  title: string;
  emptyText: string;
  entries: readonly PaneItemManagerEntryV3[];
  strings: WorkbenchPaneEditorStringsV3;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (orderedIds: readonly string[]) => void;
  onLabelChange: (id: string, label: string) => void;
  renderItemEditor?: (id: string) => React.ReactNode;
  renderItemPreview?: (id: string) => React.ReactNode;
}>) {
  const drawerContext = React.useContext(PaneEditorDrawerContextV3);
  const [query, setQuery] = React.useState("");
  const [drawer, setDrawer] = React.useState<PaneItemDrawerStateV3>({
    open: false,
    view: { kind: "catalog" },
  });
  const [menuItemId, setMenuItemId] = React.useState<string | null>(null);
  const [catalogTooltip, setCatalogTooltip] =
    React.useState<PaneItemCatalogTooltipStateV3 | null>(null);
  const [catalogDraggedItemId, setCatalogDraggedItemId] = React.useState<
    string | null
  >(null);
  const [draggedItemId, setDraggedItemId] = React.useState<string | null>(null);
  const [dragTarget, setDragTarget] = React.useState<Readonly<{
    itemId: string;
    edge: "before" | "after";
  }> | null>(null);
  const [expandedCategories, setExpandedCategories] = React.useState(
    () => new Set<PaneItemCatalogCategoryV3>(),
  );
  const drawerRef = React.useRef<HTMLElement | null>(null);
  const returnFocusRef = React.useRef<HTMLElement | null>(null);
  const initialIntentHandledRef = React.useRef(false);
  const catalogTooltipId = React.useId();
  const catalogTooltipShowTimerRef = React.useRef<number | null>(null);
  const catalogTooltipWarmResetTimerRef = React.useRef<number | null>(null);
  const catalogTooltipWarmRef = React.useRef(false);
  const selected = entries
    .filter((entry) => entry.selected)
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
  const normalizedQuery = query.trim();
  const catalogMatches = entries.filter((entry) => {
    if (normalizedQuery.length === 0) return !entry.selected;
    return studioItemPresentationMatchesQueryV1(
      entry.presentation,
      normalizedQuery,
      [entry.defaultLabel, entry.label],
    );
  });
  const activeItemId = drawer.view.kind === "item" ? drawer.view.itemId : null;
  const active =
    activeItemId !== null
      ? (selected.find((entry) => entry.id === activeItemId) ?? null)
      : null;
  const activePreview =
    active === null ? null : (renderItemPreview?.(active.id) ?? null);

  const hideCatalogTooltip = React.useCallback(() => {
    if (catalogTooltipShowTimerRef.current !== null) {
      window.clearTimeout(catalogTooltipShowTimerRef.current);
      catalogTooltipShowTimerRef.current = null;
    }
    setCatalogTooltip(null);
    if (catalogTooltipWarmResetTimerRef.current !== null) {
      window.clearTimeout(catalogTooltipWarmResetTimerRef.current);
    }
    catalogTooltipWarmResetTimerRef.current = window.setTimeout(() => {
      catalogTooltipWarmRef.current = false;
      catalogTooltipWarmResetTimerRef.current = null;
    }, 500);
  }, []);

  const showCatalogTooltip = React.useCallback(
    (entry: PaneItemManagerEntryV3, anchor: HTMLElement) => {
      const description = entry.presentation.description;
      if (description.length === 0) return;
      if (catalogTooltipShowTimerRef.current !== null) {
        window.clearTimeout(catalogTooltipShowTimerRef.current);
      }
      if (catalogTooltipWarmResetTimerRef.current !== null) {
        window.clearTimeout(catalogTooltipWarmResetTimerRef.current);
        catalogTooltipWarmResetTimerRef.current = null;
      }
      const bounds = anchor.getBoundingClientRect();
      const tooltipWidth = Math.min(288, window.innerWidth - 32);
      const left = Math.max(
        16,
        Math.min(bounds.left, window.innerWidth - tooltipWidth - 16),
      );
      const placement =
        bounds.bottom + 96 > window.innerHeight ? "above" : "below";
      const present = () => {
        setCatalogTooltip({
          description,
          itemId: entry.id,
          label: entry.defaultLabel,
          left,
          placement,
          top: placement === "above" ? bounds.top - 6 : bounds.bottom + 6,
        });
        catalogTooltipWarmRef.current = true;
        catalogTooltipShowTimerRef.current = null;
      };
      if (catalogTooltipWarmRef.current) {
        present();
        return;
      }
      catalogTooltipShowTimerRef.current = window.setTimeout(present, 280);
    },
    [],
  );

  React.useEffect(
    () => () => {
      if (catalogTooltipShowTimerRef.current !== null) {
        window.clearTimeout(catalogTooltipShowTimerRef.current);
      }
      if (catalogTooltipWarmResetTimerRef.current !== null) {
        window.clearTimeout(catalogTooltipWarmResetTimerRef.current);
      }
    },
    [],
  );

  const closeDrawer = React.useCallback(() => {
    hideCatalogTooltip();
    setDrawer((current) => ({ ...current, open: false }));
    drawerContext?.setOpen(false);
    window.requestAnimationFrame(() => {
      const returnFocus = returnFocusRef.current;
      if (returnFocus?.isConnected) returnFocus.focus();
    });
  }, [drawerContext, hideCatalogTooltip]);

  React.useEffect(() => {
    const setOpen = drawerContext?.setOpen;
    setOpen?.(drawer.open);
    return () => setOpen?.(false);
  }, [drawer.open, drawerContext?.setOpen]);

  React.useEffect(() => {
    if (!drawer.open || drawerContext === null) return undefined;
    drawerContext.registerCloseHandler(closeDrawer);
    return () => drawerContext.registerCloseHandler(null);
  }, [closeDrawer, drawer.open, drawerContext]);

  React.useEffect(() => {
    if (!drawer.open) return undefined;
    const animationFrame = window.requestAnimationFrame(() => {
      if (
        drawer.view.kind === "catalog" &&
        window.matchMedia(
          "(min-width: 640px) and (hover: hover) and (pointer: fine)",
        ).matches
      ) {
        drawerRef.current
          ?.querySelector<HTMLElement>("[data-pane-drawer-search]")
          ?.focus();
        return;
      }
      const candidates = Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          "[data-pane-drawer-initial-focus]",
        ) ?? [],
      );
      candidates.find((candidate) => candidate.offsetParent !== null)?.focus();
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [drawer.open, drawer.view.kind, activeItemId]);

  React.useEffect(() => {
    if (
      !drawer.open ||
      activeItemId === null ||
      selected.some((entry) => entry.id === activeItemId)
    ) {
      return;
    }
    closeDrawer();
  }, [activeItemId, closeDrawer, drawer.open, selected]);

  React.useEffect(() => {
    if (menuItemId === null) return undefined;
    const closeMenu = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-pane-item-menu-root]") !== null
      ) {
        return;
      }
      setMenuItemId(null);
    };
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, [menuItemId]);

  const rememberReturnFocus = React.useCallback(() => {
    if (!drawer.open) {
      returnFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    }
  }, [drawer.open]);
  const openCatalog = React.useCallback(() => {
    rememberReturnFocus();
    setMenuItemId(null);
    drawerContext?.setOpen(true);
    setDrawer({ open: true, view: { kind: "catalog" } });
  }, [drawerContext, rememberReturnFocus]);

  React.useEffect(() => {
    if (initialIntentHandledRef.current || initialItemIntent !== "add") return;
    initialIntentHandledRef.current = true;
    openCatalog();
  }, [initialItemIntent, openCatalog]);

  const openInspector = (itemId: string, returnToCatalog = false) => {
    rememberReturnFocus();
    setMenuItemId(null);
    drawerContext?.setOpen(true);
    setDrawer({
      open: true,
      view: { kind: "item", itemId, returnToCatalog },
    });
  };
  const moveItem = (itemId: string, direction: -1 | 1) => {
    const orderedIds = selected.map((entry) => entry.id);
    const index = orderedIds.indexOf(itemId);
    const destination = index + direction;
    if (index < 0 || destination < 0 || destination >= orderedIds.length) {
      return;
    }
    orderedIds.splice(index, 1);
    orderedIds.splice(destination, 0, itemId);
    onReorder(orderedIds);
  };

  const renderCatalogEntry = (entry: PaneItemManagerEntryV3) => {
    const descriptionId = `${catalogTooltipId}-${entry.id}`;
    return (
      <div
        key={entry.id}
        draggable={!entry.selected}
        data-catalog-dragging={
          catalogDraggedItemId === entry.id ? "true" : "false"
        }
        className="workbench-pane-catalog-row group rounded-lg px-2 py-1.5 hover:bg-wb-hover"
        onPointerEnter={(event) =>
          showCatalogTooltip(entry, event.currentTarget)
        }
        onPointerLeave={hideCatalogTooltip}
        onFocusCapture={(event) =>
          showCatalogTooltip(entry, event.currentTarget)
        }
        onBlurCapture={(event) => {
          if (
            !(event.relatedTarget instanceof Node) ||
            !event.currentTarget.contains(event.relatedTarget)
          ) {
            hideCatalogTooltip();
          }
        }}
        onDragStart={(event) => {
          hideCatalogTooltip();
          if (entry.selected) {
            event.preventDefault();
            return;
          }
          event.dataTransfer.effectAllowed = "copy";
          event.dataTransfer.setData(PANE_ITEM_CATALOG_DRAG_TYPE_V3, entry.id);
          setCatalogDraggedItemId(entry.id);
        }}
        onDragEnd={() => {
          setCatalogDraggedItemId(null);
          hideCatalogTooltip();
        }}
      >
        <div className="flex min-h-10 items-center gap-2">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium text-wb-text">
              {entry.defaultLabel}
            </span>
          </span>
          {entry.presentation.description.length > 0 && (
            <span id={descriptionId} className="sr-only">
              {entry.presentation.description}
            </span>
          )}
          {entry.selected ? (
            <button
              type="button"
              className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-[10px] font-medium text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-active hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              aria-label={`${strings.editItem}: ${entry.label ?? entry.defaultLabel}`}
              aria-describedby={
                entry.presentation.description.length > 0
                  ? descriptionId
                  : undefined
              }
              onClick={() => {
                hideCatalogTooltip();
                openInspector(entry.id, true);
              }}
            >
              <Check
                className="h-3.5 w-3.5 text-wb-accent"
                aria-hidden="true"
              />
              {strings.catalogAdded}
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-wb-accent transition-[color,background-color,transform] duration-150 hover:bg-wb-active active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              aria-label={`${strings.addCatalogItem}: ${entry.defaultLabel}`}
              aria-describedby={
                entry.presentation.description.length > 0
                  ? descriptionId
                  : undefined
              }
              title={strings.addCatalogItem}
              onClick={() => {
                hideCatalogTooltip();
                onAdd(entry.id);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const catalogTooltipPortal =
    catalogTooltip === null || typeof document === "undefined"
      ? null
      : createPortal(
          <div
            id={`${catalogTooltipId}-visible`}
            role="tooltip"
            className="workbench-pane-catalog-tooltip"
            data-placement={catalogTooltip.placement}
            data-tooltip-item-id={catalogTooltip.itemId}
            style={{
              left: catalogTooltip.left,
              top: catalogTooltip.top,
            }}
          >
            <span className="sr-only">{catalogTooltip.label}: </span>
            {catalogTooltip.description}
          </div>,
          document.body,
        );

  const drawerPortal =
    drawerContext?.host === null || drawerContext?.host === undefined
      ? null
      : createPortal(
          <aside
            ref={drawerRef}
            aria-hidden={!drawer.open}
            aria-label={
              drawer.view.kind === "catalog"
                ? strings.catalogDrawerTitle
                : (active?.label ?? active?.defaultLabel ?? strings.editItem)
            }
            className="workbench-pane-context-drawer pointer-events-auto absolute inset-y-0 right-0 flex flex-col bg-wb-panel text-wb-text"
            data-open={drawer.open ? "true" : "false"}
            data-testid="pane-settings-context-drawer-v3"
            inert={!drawer.open}
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              event.stopPropagation();
              closeDrawer();
            }}
          >
            <header className="flex min-h-14 shrink-0 items-center gap-2 border-b border-wb-line px-3.5">
              {drawer.view.kind === "item" && drawer.view.returnToCatalog ? (
                <button
                  type="button"
                  data-pane-drawer-initial-focus
                  aria-label={strings.backToCatalog}
                  title={strings.backToCatalog}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                  onClick={() =>
                    setDrawer({
                      open: true,
                      view: { kind: "catalog" },
                    })
                  }
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  data-pane-drawer-initial-focus
                  aria-label={strings.closeDrawer}
                  title={strings.closeDrawer}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent sm:hidden"
                  onClick={closeDrawer}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold tracking-[-0.012em] text-wb-text">
                  {drawer.view.kind === "catalog"
                    ? strings.catalogDrawerTitle
                    : (active?.label ??
                      active?.defaultLabel ??
                      strings.editItem)}
                </p>
                {drawer.view.kind === "item" &&
                  active !== null &&
                  active.presentation.description.length > 0 && (
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-wb-subtle">
                      {active.presentation.description}
                    </p>
                  )}
              </div>
              <button
                type="button"
                {...(drawer.view.kind === "catalog" ||
                !drawer.view.returnToCatalog
                  ? { "data-pane-drawer-initial-focus": true }
                  : {})}
                aria-label={strings.closeDrawer}
                title={strings.closeDrawer}
                className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-md text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent sm:inline-flex"
                onClick={closeDrawer}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            {drawer.view.kind === "catalog" ? (
              <div
                className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-6 pt-3"
                onScroll={hideCatalogTooltip}
              >
                <label className="relative block">
                  <span className="sr-only">{strings.searchCatalog}</span>
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-wb-subtle"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    data-pane-drawer-search
                    value={query}
                    placeholder={strings.searchCatalog}
                    className="h-10 w-full rounded-lg bg-wb-input pl-9 pr-3 text-xs text-wb-text outline-none ring-1 ring-transparent placeholder:text-wb-subtle focus:ring-wb-accent"
                    onChange={(event) => setQuery(event.currentTarget.value)}
                  />
                </label>
                {catalogMatches.length === 0 ? (
                  <p className="px-2 py-6 text-xs text-wb-subtle">
                    {strings.noCatalogMatches}
                  </p>
                ) : normalizedQuery.length > 0 ? (
                  <div className="mt-3 grid gap-0.5">
                    {catalogMatches.map(renderCatalogEntry)}
                  </div>
                ) : (
                  <div className="mt-4 grid gap-2">
                    {PANE_ITEM_CATALOG_CATEGORY_ORDER_V3.map((category) => {
                      const categoryEntries = catalogMatches.filter(
                        (entry) => entry.presentation.category === category,
                      );
                      if (categoryEntries.length === 0) return null;
                      const expanded = expandedCategories.has(category);
                      return (
                        <details
                          key={category}
                          open={expanded}
                          className="group/category rounded-lg"
                          onToggle={(event) => {
                            const isOpen = event.currentTarget.open;
                            setExpandedCategories((current) => {
                              const next = new Set(current);
                              if (isOpen) next.add(category);
                              else next.delete(category);
                              return next;
                            });
                          }}
                        >
                          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-md bg-wb-soft/40 px-2.5 text-xs font-semibold text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent [&::-webkit-details-marker]:hidden">
                            <ChevronDown
                              className="h-3.5 w-3.5 transition-transform duration-150 group-open/category:rotate-180"
                              aria-hidden="true"
                            />
                            <span className="min-w-0 flex-1 truncate">
                              {strings.catalogCategories[category]}
                            </span>
                            <span className="inline-flex min-w-6 justify-center rounded-full bg-wb-panel px-1.5 py-0.5 font-mono text-[10px] font-medium text-wb-subtle">
                              {categoryEntries.length}
                            </span>
                          </summary>
                          <div className="ml-3 mt-1 grid gap-0.5 border-l border-wb-line pb-1 pl-2">
                            {categoryEntries.map(renderCatalogEntry)}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : active === null ? null : (
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-4">
                <div className="grid gap-5">
                  <CommitTextInputV3
                    label={strings.label}
                    value={active.label ?? active.defaultLabel}
                    onCommit={(label) => onLabelChange(active.id, label)}
                  />
                  {renderItemEditor?.(active.id)}
                  {activePreview !== null && (
                    <section className="grid gap-2.5 border-t border-wb-line pt-4">
                      <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-wb-subtle">
                        {strings.preview}
                      </h4>
                      {activePreview}
                    </section>
                  )}
                </div>
              </div>
            )}
          </aside>,
          drawerContext.host,
        );

  return (
    <section
      id={sectionId}
      className="workbench-pane-settings-section space-y-4"
    >
      <div className="workbench-settings-section-heading-row flex min-h-9 items-center justify-between gap-3">
        <EditorSectionHeadingV3>{title}</EditorSectionHeadingV3>
        {entries.length > 0 && (
          <button
            type="button"
            className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-[10px] font-medium text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
            onClick={openCatalog}
          >
            <Plus className="h-3.5 w-3.5 text-wb-accent" aria-hidden="true" />
            {strings.addCatalogItem}
          </button>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="rounded-lg bg-wb-soft px-3 py-3 text-xs text-wb-muted">
          {emptyText}
        </p>
      ) : (
        <div
          className="workbench-pane-items-dropzone space-y-2"
          data-catalog-drop-active={
            catalogDraggedItemId === null ? "false" : "true"
          }
          onDragOver={(event) => {
            if (
              !Array.from(event.dataTransfer.types).includes(
                PANE_ITEM_CATALOG_DRAG_TYPE_V3,
              )
            )
              return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(event) => {
            const itemId = event.dataTransfer.getData(
              PANE_ITEM_CATALOG_DRAG_TYPE_V3,
            );
            if (itemId.length === 0) return;
            event.preventDefault();
            onAdd(itemId);
            setCatalogDraggedItemId(null);
          }}
        >
          <div className="flex items-center justify-between gap-2 px-1">
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-wb-subtle">
              {strings.selectedItems}
            </h4>
            <span className="font-mono text-[9px] text-wb-subtle">
              {selected.length}
            </span>
          </div>
          {selected.length === 0 ? (
            <button
              type="button"
              className="flex min-h-16 w-full items-center justify-center rounded-lg bg-wb-soft/45 px-3 text-xs text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              onClick={openCatalog}
            >
              <Plus
                className="mr-2 h-3.5 w-3.5 text-wb-accent"
                aria-hidden="true"
              />
              {strings.addCatalogItem}
            </button>
          ) : (
            <div className="rounded-lg bg-wb-soft/35 p-1">
              {selected.map((entry, index) => {
                const label = entry.label ?? entry.defaultLabel;
                const activeItem =
                  drawer.open &&
                  drawer.view.kind === "item" &&
                  drawer.view.itemId === entry.id;
                const dropEdge =
                  dragTarget?.itemId === entry.id ? dragTarget.edge : undefined;
                return (
                  <div
                    key={entry.id}
                    data-pane-item-id={entry.id}
                    data-drop-edge={dropEdge}
                    data-dragging={
                      draggedItemId === entry.id ? "true" : "false"
                    }
                    className={`workbench-pane-item-row group relative flex min-h-12 items-center gap-1 rounded-md px-1 ${
                      menuItemId === entry.id ? "z-30" : "z-0"
                    } ${activeItem ? "bg-wb-selected" : "hover:bg-wb-hover"}`}
                    onDragOver={(event) => {
                      if (
                        draggedItemId === null ||
                        draggedItemId === entry.id
                      ) {
                        return;
                      }
                      event.preventDefault();
                      const bounds =
                        event.currentTarget.getBoundingClientRect();
                      setDragTarget({
                        itemId: entry.id,
                        edge:
                          event.clientY < bounds.top + bounds.height / 2
                            ? "before"
                            : "after",
                      });
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (draggedItemId === null || dragTarget === null) return;
                      onReorder(
                        reorderPaneItemIdsForDropV3(
                          selected.map((candidate) => candidate.id),
                          draggedItemId,
                          dragTarget.itemId,
                          dragTarget.edge,
                        ),
                      );
                      setDraggedItemId(null);
                      setDragTarget(null);
                    }}
                  >
                    <button
                      type="button"
                      draggable
                      aria-label={`${strings.reorderItem}: ${label}`}
                      title={strings.reorderItem}
                      className="inline-flex h-9 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-wb-subtle transition-colors duration-150 hover:bg-wb-hover hover:text-wb-muted active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                      onClick={(event) => event.stopPropagation()}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", entry.id);
                        setDraggedItemId(entry.id);
                        setMenuItemId(null);
                      }}
                      onDragEnd={() => {
                        setDraggedItemId(null);
                        setDragTarget(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowUp") {
                          event.preventDefault();
                          moveItem(entry.id, -1);
                        } else if (event.key === "ArrowDown") {
                          event.preventDefault();
                          moveItem(entry.id, 1);
                        }
                      }}
                    >
                      <GripVertical className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={label}
                      className="min-w-0 flex-1 rounded-md px-1.5 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                      onClick={() => openInspector(entry.id)}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-wb-text">
                          {label}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={entry.disableDeselect}
                      aria-label={`${strings.removeItem}: ${label}`}
                      title={strings.removeItem}
                      className="workbench-pane-item-direct-remove hidden h-9 w-8 shrink-0 items-center justify-center rounded-md text-wb-subtle hover:bg-wb-danger-soft hover:text-wb-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-danger disabled:invisible sm:inline-flex"
                      onClick={() => onRemove(entry.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <div className="relative shrink-0" data-pane-item-menu-root>
                      <button
                        type="button"
                        aria-expanded={menuItemId === entry.id}
                        aria-haspopup="menu"
                        aria-label={`${strings.editItem}: ${label}`}
                        className="inline-flex h-9 w-8 items-center justify-center rounded-md text-wb-subtle transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                        onClick={(event) => {
                          event.stopPropagation();
                          setMenuItemId((current) =>
                            current === entry.id ? null : entry.id,
                          );
                        }}
                      >
                        <MoreVertical className="h-4 w-4" aria-hidden="true" />
                      </button>
                      {menuItemId === entry.id && (
                        <div
                          role="menu"
                          aria-label={label}
                          className="absolute right-0 top-full z-20 mt-1 min-w-40 rounded-lg bg-wb-panel p-1 shadow-xl ring-1 ring-wb-line"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            role="menuitem"
                            className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-[10px] text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                            onClick={() => openInspector(entry.id)}
                          >
                            <Pencil
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {strings.editItem}
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            disabled={index === 0}
                            className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-[10px] text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent disabled:cursor-not-allowed disabled:opacity-35"
                            onClick={() => {
                              moveItem(entry.id, -1);
                              setMenuItemId(null);
                            }}
                          >
                            <ArrowUp
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {strings.moveUp}
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            disabled={index === selected.length - 1}
                            className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-[10px] text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent disabled:cursor-not-allowed disabled:opacity-35"
                            onClick={() => {
                              moveItem(entry.id, 1);
                              setMenuItemId(null);
                            }}
                          >
                            <ArrowDown
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {strings.moveDown}
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            disabled={entry.disableDeselect}
                            className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-[10px] text-wb-danger hover:bg-wb-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-danger disabled:cursor-not-allowed disabled:opacity-35"
                            onClick={() => {
                              onRemove(entry.id);
                              setMenuItemId(null);
                            }}
                          >
                            <Trash2
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {strings.removeItem}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {entries.length > 0 && selected.length > 0 && (
        <ExperimentPaneAddItemButtonV3
          label={strings.addCatalogItem}
          onClick={openCatalog}
          prominent
        />
      )}
      {drawerPortal}
      {catalogTooltipPortal}
    </section>
  );
}

function reorderPaneItemsV3<T extends Readonly<{ order: number }>>(
  items: readonly T[],
  orderedIds: readonly string[],
  itemIdOf: (item: T) => string,
): readonly T[] {
  const orderById = new Map(orderedIds.map((itemId, order) => [itemId, order]));
  return items.map((item) => {
    const order = orderById.get(itemIdOf(item));
    return order === undefined ? item : { ...item, order };
  });
}

function reorderPaneItemIdsForDropV3(
  orderedIds: readonly string[],
  draggedId: string,
  targetId: string,
  edge: "before" | "after",
): readonly string[] {
  if (draggedId === targetId) return orderedIds;
  const next = orderedIds.filter((itemId) => itemId !== draggedId);
  const targetIndex = next.indexOf(targetId);
  if (targetIndex < 0) return orderedIds;
  next.splice(targetIndex + (edge === "after" ? 1 : 0), 0, draggedId);
  return next;
}

type CatalogSelectionEntryV3 = Readonly<{
  id: string;
  defaultLabel: string;
  description?: string;
  label: string | undefined;
  selected: boolean;
  disableDeselect: boolean;
}>;

function CatalogSelectionV3({
  sectionId,
  emptyText,
  entries,
  strings,
  onToggle,
  onLabelChange,
}: Readonly<{
  sectionId?: string;
  emptyText: string;
  entries: readonly CatalogSelectionEntryV3[];
  strings: WorkbenchPaneEditorStringsV3;
  onToggle: (id: string) => void;
  onLabelChange: (id: string, label: string) => void;
}>) {
  return (
    <div id={sectionId} className="scroll-mt-4 space-y-2">
      {entries.length === 0 ? (
        <p className="rounded-lg bg-wb-soft px-3 py-3 text-xs text-wb-muted">
          {emptyText}
        </p>
      ) : (
        <div className="grid gap-1">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-lg px-2 py-2 transition-colors ${
                entry.selected ? "bg-wb-selected" : "hover:bg-wb-hover"
              }`}
            >
              <div className="flex min-h-9 items-center gap-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={entry.selected}
                  aria-label={entry.label ?? entry.defaultLabel}
                  disabled={entry.disableDeselect}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-wb-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent disabled:cursor-not-allowed"
                  onClick={() => onToggle(entry.id)}
                >
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded border ${
                      entry.selected
                        ? "border-wb-accent bg-wb-accent text-white"
                        : "border-wb-line-strong text-transparent"
                    }`}
                  >
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                </button>
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                  disabled={entry.disableDeselect}
                  title={entry.description}
                  onClick={() => onToggle(entry.id)}
                >
                  <span className="block truncate text-xs font-medium">
                    {entry.label ?? entry.defaultLabel}
                  </span>
                  <span className="line-clamp-2 block text-[9px] leading-4 text-wb-subtle">
                    {entry.description ?? entry.id}
                  </span>
                </button>
              </div>
              {entry.selected && entry.label !== undefined && (
                <div className="mt-2 grid grid-cols-1 pl-10">
                  <CommitTextInputV3
                    label={strings.label}
                    value={entry.label}
                    onCommit={(label) => onLabelChange(entry.id, label)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommitTextInputV3({
  label,
  value,
  onCommit,
}: Readonly<{
  label: string;
  value: string;
  onCommit: (value: string) => void;
}>) {
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value]);
  const commit = () => {
    const nextValue = draft.trim();
    if (nextValue.length === 0) {
      setDraft(value);
      return;
    }
    setDraft(nextValue);
    if (nextValue !== value) onCommit(nextValue);
  };
  return (
    <label className="grid min-w-0 gap-1 text-[10px] font-medium text-wb-subtle">
      <span>{label}</span>
      <input
        type="text"
        value={draft}
        className="min-h-9 min-w-0 rounded-md bg-wb-soft px-2.5 text-xs text-wb-text outline-none ring-1 ring-transparent focus:ring-wb-accent"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            event.stopPropagation();
            setDraft(value);
            event.currentTarget.blur();
          }
        }}
      />
    </label>
  );
}

function CommitNumberInputV3({
  label,
  value,
  minimum,
  maximum,
  step,
  onCommit,
}: Readonly<{
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  step: number;
  onCommit: (value: number) => void;
}>) {
  const [draft, setDraft] = React.useState(String(value));
  React.useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const candidate = Number(draft);
    if (!Number.isFinite(candidate)) {
      setDraft(String(value));
      return;
    }
    const steps = Math.round((candidate - minimum) / step);
    const normalized = Math.min(
      maximum,
      Math.max(minimum, minimum + steps * step),
    );
    setDraft(String(normalized));
    if (normalized !== value) onCommit(normalized);
  };
  return (
    <label className="grid min-w-0 gap-1 text-[10px] font-medium text-wb-subtle">
      <span>{label}</span>
      <input
        type="number"
        min={minimum}
        max={maximum}
        step={step}
        value={draft}
        className="min-h-9 min-w-0 rounded-md bg-wb-soft px-2.5 font-mono text-xs text-wb-text outline-none ring-1 ring-transparent focus:ring-wb-accent"
        onChange={(event) => setDraft(event.currentTarget.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            event.stopPropagation();
            setDraft(String(value));
            event.currentTarget.blur();
          }
        }}
      />
    </label>
  );
}

function PaneRangeInputV3({
  label,
  value,
  minimum,
  maximum,
  step,
  unit,
  onCommit,
}: Readonly<{
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  step: number;
  unit: string;
  onCommit: (value: number) => void;
}>) {
  const inputId = React.useId();
  const span = maximum - minimum;
  const progress =
    span > 0 ? Math.max(0, Math.min(100, ((value - minimum) / span) * 100)) : 0;
  return (
    <div className="workbench-pane-range-field">
      <div className="workbench-pane-range-heading">
        <label htmlFor={inputId}>{label}</label>
        <output htmlFor={inputId} className="workbench-pane-range-value">
          <span>{value}</span>
          <span className="workbench-pane-range-unit">{unit}</span>
        </output>
      </div>
      <input
        id={inputId}
        className="workbench-control-range"
        style={
          {
            "--workbench-control-progress": `${progress}%`,
          } as React.CSSProperties
        }
        type="range"
        min={minimum}
        max={maximum}
        step={step}
        value={value}
        aria-valuetext={`${value} ${unit}`}
        onChange={(event) => onCommit(Number(event.currentTarget.value))}
      />
    </div>
  );
}

function ColorInputV3({
  label,
  value,
  onChange,
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}>) {
  const canonicalValue = canonicalWorkbenchColorHexV3(value);
  return (
    <label className="grid gap-1 text-[10px] font-medium text-wb-subtle">
      <span>{label}</span>
      <span className="flex min-h-9 items-center gap-2 rounded-md bg-wb-soft px-2">
        <input
          type="color"
          value={canonicalValue}
          className="h-5 w-5 cursor-pointer appearance-none overflow-hidden rounded border-0 bg-transparent p-0"
          onChange={(event) =>
            onChange(
              canonicalWorkbenchColorHexV3(event.target.value, canonicalValue),
            )
          }
        />
        <span className="font-mono text-[10px] text-wb-muted">
          {canonicalValue}
        </span>
      </span>
    </label>
  );
}

function EditorSectionHeadingV3({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <h3 className="workbench-settings-section-heading">{children}</h3>;
}

function nextOrderV3(items: readonly Readonly<{ order: number }>[]): number {
  return items.reduce((highest, item) => Math.max(highest, item.order), -1) + 1;
}
