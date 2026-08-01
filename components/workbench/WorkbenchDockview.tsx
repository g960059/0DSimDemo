import React from "react";
import {
  DockviewReact,
  type DockviewApi,
  type DockviewReadyEvent,
  type IDockviewHeaderActionsProps,
  type IDockviewPanelHeaderProps,
  type IDockviewPanelProps,
} from "dockview";
import { Plus, Settings2 } from "lucide-react";
import "dockview/dist/styles/dockview.css";

export type WorkbenchPaneRoleV3 = "graph" | "output" | "control" | "note";
export type WorkbenchDockLayoutModeV3 = "split" | "tabs";

export type WorkbenchPaneDefinitionV3 = Readonly<{
  paneId: string;
  role: WorkbenchPaneRoleV3;
  title: string;
}>;

type WorkbenchDockPanelParametersV3 = Readonly<{
  paneId: string;
}>;

export type WorkbenchDockviewPropsV3 = Readonly<{
  ariaLabel: string;
  className?: string;
  panes: readonly WorkbenchPaneDefinitionV3[];
  role: WorkbenchPaneRoleV3;
  renderPane: (pane: WorkbenchPaneDefinitionV3) => React.ReactNode;
  onOpenPaneSettings?: (paneId: string) => void;
  paneSettingsLabel?: string;
  onAddPane?: () => void;
  addPaneLabel?: string;
  emptyPaneLabel?: string;
}>;

type WorkbenchDockviewContextV3 = Readonly<{
  onOpenPaneSettings?: (paneId: string) => void;
  paneSettingsLabel?: string;
  addPaneAnchorId?: string;
  addPaneLabel?: string;
  onAddPane?: () => void;
  paneById: ReadonlyMap<string, WorkbenchPaneDefinitionV3>;
  renderPane: WorkbenchDockviewPropsV3["renderPane"];
}>;

const WorkbenchDockContextV3 = React.createContext<
WorkbenchDockviewContextV3 | null
>(null);

function WorkbenchDockPanelV3(
  props: IDockviewPanelProps<WorkbenchDockPanelParametersV3>,
) {
  const context = React.useContext(WorkbenchDockContextV3);
  const pane = context?.paneById.get(props.params.paneId);
  const [isVisible, setIsVisible] = React.useState(() => props.api.isVisible);
  React.useEffect(() => {
    const update = () => setIsVisible(props.api.isVisible);
    const visible = props.api.onDidVisibilityChange(update);
    update();
    return () => {
      visible.dispose();
    };
  }, [props.api]);
  if (context === null || pane === undefined) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-wb-subtle">
        Pane unavailable
      </div>
    );
  }
  // Dockview's `onlyWhenVisible` detaches inactive panel DOM but keeps its
  // React portal mounted. Explicitly unmount expensive chart content so a
  // hidden tab cannot retain a live sample-store subscription or Canvas loop.
  if (!shouldRenderWorkbenchDockPanelV3(props.api.isActive, isVisible)) {
    return null;
  }
  return <>{context.renderPane(pane)}</>;
}

export function shouldRenderWorkbenchDockPanelV3(
  _isActive: boolean,
  isVisible: boolean,
): boolean {
  return isVisible;
}

function WorkbenchDockTabV3(
  props: IDockviewPanelHeaderProps<WorkbenchDockPanelParametersV3>,
) {
  const context = React.useContext(WorkbenchDockContextV3);
  const pane = context?.paneById.get(props.params.paneId);
  const title = pane?.title ?? props.params.paneId;
  const settingsLabel = context?.paneSettingsLabel ?? "Pane settings";

  return (
    <div
      className="workbench-dock-tab flex h-full min-w-0 items-center gap-2 px-2.5 text-xs font-semibold text-wb-muted"
      onClick={() => props.api.setActive()}
    >
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {pane !== undefined && context?.onOpenPaneSettings !== undefined && (
        <button
          type="button"
          className="workbench-dock-tab-settings inline-flex h-7 w-7 shrink-0 touch-manipulation items-center justify-center rounded-md text-wb-subtle transition-colors duration-150 hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          aria-label={`${settingsLabel}: ${title}`}
          title={settingsLabel}
          draggable={false}
          onClick={(event) => {
            event.stopPropagation();
            context.onOpenPaneSettings?.(pane.paneId);
          }}
        >
          <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function WorkbenchDockAddPaneActionV3(
  props: IDockviewHeaderActionsProps,
) {
  const context = React.useContext(WorkbenchDockContextV3);
  if (
    context?.onAddPane === undefined
    || !workbenchGroupOwnsAddPaneActionV3(
      context.addPaneAnchorId,
      props.panels.map(({ id }) => id),
    )
  ) return null;
  return (
    <button
      type="button"
      className="workbench-dock-add-pane inline-flex h-full min-w-9 touch-manipulation items-center justify-center text-wb-subtle transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-wb-accent"
      aria-label={context.addPaneLabel ?? "Add pane"}
      title={context.addPaneLabel ?? "Add pane"}
      onClick={context.onAddPane}
    >
      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );
}

function addPaneV3(
  api: DockviewApi,
  pane: WorkbenchPaneDefinitionV3,
  placement: "first" | "right" | "within",
): void {
  const referenceGroup = placement === "within"
    ? api.panels.at(-1)?.group
    : api.panels[0]?.group;
  api.addPanel<WorkbenchDockPanelParametersV3>({
    id: pane.paneId,
    title: pane.title,
    component: "workbench-pane-v3",
    params: { paneId: pane.paneId },
    renderer: "onlyWhenVisible",
    ...(placement === "first" || referenceGroup === undefined
      ? {}
      : {
        position: {
          referenceGroup,
          direction: placement,
        },
        floating: false,
      }),
  });
}

function applyPanesV3(
  api: DockviewApi,
  panes: readonly WorkbenchPaneDefinitionV3[],
  layoutMode: WorkbenchDockLayoutModeV3,
): void {
  const activePaneId = api.activePanel?.id;
  api.clear();
  panes.forEach((pane, index) => {
    addPaneV3(
      api,
      pane,
      workbenchPanePlacementV3(index, layoutMode),
    );
  });
  const paneToActivate = activePaneId !== undefined
    && panes.some(({ paneId }) => paneId === activePaneId)
    ? activePaneId
    : panes[0]?.paneId;
  if (paneToActivate !== undefined) {
    api.getPanel?.(paneToActivate)?.api?.setActive?.();
  }
}

export function workbenchPanePlacementV3(
  index: number,
  layoutMode: WorkbenchDockLayoutModeV3,
): "first" | "right" | "within" {
  if (index === 0) return "first";
  // Desktop split is intentionally bounded to two columns: pane 2 starts the
  // right-hand group and panes 3+ join that group's tab strip. New panes and
  // the role-owned add action therefore stay in the same spatial location.
  return layoutMode === "split" && index === 1 ? "right" : "within";
}

export function workbenchAddPaneAnchorIdV3(
  panes: readonly WorkbenchPaneDefinitionV3[],
): string | undefined {
  return panes.at(-1)?.paneId;
}

export function workbenchGroupOwnsAddPaneActionV3(
  addPaneAnchorId: string | undefined,
  groupPanelIds: readonly string[],
): boolean {
  return addPaneAnchorId !== undefined
    && groupPanelIds.includes(addPaneAnchorId);
}

export function getWorkbenchPaneSignatureV3(
  panes: readonly WorkbenchPaneDefinitionV3[],
  layoutMode: WorkbenchDockLayoutModeV3 = "split",
): string {
  // Titles and pane-specific selections flow through React context. Only the
  // ordered Dockview membership and role require structural reconciliation.
  return JSON.stringify(
    [layoutMode, panes.map(({ paneId, role }) => [paneId, role])],
  );
}

export function reconcileWorkbenchPanesV3(
  api: DockviewApi,
  panes: readonly WorkbenchPaneDefinitionV3[],
  appliedSignature: string | null,
  layoutMode: WorkbenchDockLayoutModeV3 = "split",
): string {
  const nextSignature = getWorkbenchPaneSignatureV3(panes, layoutMode);
  if (nextSignature === appliedSignature) return appliedSignature;
  applyPanesV3(api, panes, layoutMode);
  return nextSignature;
}

export function getWorkbenchPaneTitleSignatureV3(
  panes: readonly WorkbenchPaneDefinitionV3[],
): string {
  return JSON.stringify(
    panes.map(({ paneId, title }) => [paneId, title]),
  );
}

export function reconcileWorkbenchPaneTitlesV3(
  api: DockviewApi,
  panes: readonly WorkbenchPaneDefinitionV3[],
  appliedSignature: string | null,
): string {
  const nextSignature = getWorkbenchPaneTitleSignatureV3(panes);
  if (nextSignature === appliedSignature) return appliedSignature;
  for (const pane of panes) {
    api.getPanel(pane.paneId)?.setTitle(pane.title);
  }
  return nextSignature;
}

export function resetWorkbenchDockviewTrackingV3(
  apiRef: { current: DockviewApi | null },
  appliedSignatureRef: { current: string | null },
  appliedTitleSignatureRef: { current: string | null },
): void {
  apiRef.current = null;
  appliedSignatureRef.current = null;
  appliedTitleSignatureRef.current = null;
}

/**
 * Dockview is presentation infrastructure only. Its split geometry and active
 * tab stay ephemeral; durable Experiment data stores semantic groups/order and
 * never serializes Dockview state.
 */
export function WorkbenchDockview({
  ariaLabel,
  className = "",
  panes,
  role,
  renderPane,
  onOpenPaneSettings,
  paneSettingsLabel,
  onAddPane,
  addPaneLabel = "Add pane",
  emptyPaneLabel = "No panes selected",
}: WorkbenchDockviewPropsV3) {
  for (const pane of panes) {
    if (pane.role !== role) {
      throw new Error(
        `Workbench ${role} area cannot host ${pane.role} pane ${pane.paneId}`,
      );
    }
  }

  const apiRef = React.useRef<DockviewApi | null>(null);
  const narrowViewport = useNarrowWorkbenchDockviewV3();
  const layoutMode: WorkbenchDockLayoutModeV3 = role === "graph"
    && narrowViewport
    ? "tabs"
    : "split";
  const latestPanesRef = React.useRef(panes);
  latestPanesRef.current = panes;
  const latestLayoutModeRef = React.useRef(layoutMode);
  latestLayoutModeRef.current = layoutMode;
  const appliedPaneSignatureRef = React.useRef<string | null>(null);
  const appliedPaneTitleSignatureRef = React.useRef<string | null>(null);
  const paneSignature = React.useMemo(
    () => getWorkbenchPaneSignatureV3(panes, layoutMode),
    [layoutMode, panes],
  );
  const paneTitleSignature = React.useMemo(
    () => getWorkbenchPaneTitleSignatureV3(panes),
    [panes],
  );
  const paneById = React.useMemo(
    () => new Map(panes.map((pane) => [pane.paneId, pane])),
    [panes],
  );
  const context = React.useMemo<WorkbenchDockviewContextV3>(
    () => ({
      addPaneAnchorId: workbenchAddPaneAnchorIdV3(panes),
      addPaneLabel,
      onAddPane,
      paneById,
      renderPane,
      onOpenPaneSettings,
      paneSettingsLabel,
    }),
    [
      addPaneLabel,
      onAddPane,
      onOpenPaneSettings,
      paneById,
      paneSettingsLabel,
      panes,
      renderPane,
    ],
  );
  const components = React.useMemo(
    () => ({ "workbench-pane-v3": WorkbenchDockPanelV3 }),
    [],
  );
  const dockviewElementRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      if (element !== null) return;
      // DockviewReact owns API disposal. Its forwarded element ref tells us
      // when that framework-managed instance leaves the tree, including empty
      // state.
      resetWorkbenchDockviewTrackingV3(
        apiRef,
        appliedPaneSignatureRef,
        appliedPaneTitleSignatureRef,
      );
    },
    [],
  );

  React.useEffect(() => {
    const api = apiRef.current;
    if (api === null) return;
    appliedPaneSignatureRef.current = reconcileWorkbenchPanesV3(
      api,
      latestPanesRef.current,
      appliedPaneSignatureRef.current,
      latestLayoutModeRef.current,
    );
  }, [paneSignature]);

  React.useEffect(() => {
    const api = apiRef.current;
    if (api === null) return;
    appliedPaneTitleSignatureRef.current = reconcileWorkbenchPaneTitlesV3(
      api,
      latestPanesRef.current,
      appliedPaneTitleSignatureRef.current,
    );
  }, [paneTitleSignature]);

  if (panes.length === 0) {
    return (
      <section
        className={`flex h-full min-h-0 items-center justify-center bg-wb-aux text-xs text-wb-subtle ${className}`}
        aria-label={ariaLabel}
        data-workbench-role-area={role}
      >
        <div className="grid justify-items-center gap-2">
          <span>{emptyPaneLabel}</span>
          {onAddPane !== undefined && (
            <button
              type="button"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              onClick={onAddPane}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {addPaneLabel}
            </button>
          )}
        </div>
      </section>
    );
  }

  if (typeof window === "undefined") {
    return (
      <section
        className={`grid h-full min-h-0 grid-cols-1 overflow-hidden bg-wb-aux ${className}`}
        aria-label={ariaLabel}
        data-workbench-role-area={role}
      >
        {panes.map((pane) => (
          <div key={pane.paneId} className="min-h-0 overflow-hidden">
            {renderPane(pane)}
          </div>
        ))}
      </section>
    );
  }

  return (
    <WorkbenchDockContextV3.Provider value={context}>
      <section
        className={`workbench-dockview dockview-theme-dark h-full min-h-0 overflow-hidden bg-wb-aux ${className}`}
        aria-label={ariaLabel}
        data-workbench-role-area={role}
      >
        <DockviewReact
          ref={dockviewElementRef}
          components={components}
          defaultTabComponent={WorkbenchDockTabV3}
          leftHeaderActionsComponent={WorkbenchDockAddPaneActionV3}
          defaultRenderer="onlyWhenVisible"
          disableFloatingGroups
          getTabContextMenuItems={() => []}
          getTabGroupChipContextMenuItems={() => []}
          onReady={(event: DockviewReadyEvent) => {
            apiRef.current = event.api;
            appliedPaneSignatureRef.current = reconcileWorkbenchPanesV3(
              event.api,
              latestPanesRef.current,
              null,
              latestLayoutModeRef.current,
            );
            appliedPaneTitleSignatureRef.current =
              reconcileWorkbenchPaneTitlesV3(
                event.api,
                latestPanesRef.current,
                null,
              );
          }}
        />
      </section>
    </WorkbenchDockContextV3.Provider>
  );
}

function useNarrowWorkbenchDockviewV3(): boolean {
  const query = "(max-width: 1023px)";
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

export default WorkbenchDockview;
