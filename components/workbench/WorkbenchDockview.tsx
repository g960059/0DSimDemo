import React from "react";
import {
  DockviewReact,
  type DockviewApi,
  type DockviewReadyEvent,
  type IDockviewPanelHeaderProps,
  type IDockviewPanelProps,
} from "dockview";
import { Settings2 } from "lucide-react";
import "dockview/dist/styles/dockview.css";

export type WorkbenchPaneRoleV3 = "graph" | "output" | "control" | "note";

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
}>;

type WorkbenchDockviewContextV3 = Readonly<{
  onOpenPaneSettings?: (paneId: string) => void;
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
  if (context === null || pane === undefined) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-wb-subtle">
        Pane unavailable
      </div>
    );
  }
  return <>{context.renderPane(pane)}</>;
}

function WorkbenchDockTabV3(
  props: IDockviewPanelHeaderProps<WorkbenchDockPanelParametersV3>,
) {
  const context = React.useContext(WorkbenchDockContextV3);
  const pane = context?.paneById.get(props.params.paneId);
  const title = pane?.title ?? props.params.paneId;

  return (
    <div
      className="workbench-dock-tab flex h-full min-w-0 items-center gap-2 px-2.5 text-xs font-semibold text-wb-muted"
      onClick={() => props.api.setActive()}
    >
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {pane !== undefined && context?.onOpenPaneSettings !== undefined && (
        <button
          type="button"
          className="workbench-dock-tab-settings inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-wb-subtle hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
          aria-label={`Open ${title} pane settings`}
          title="Pane settings"
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

function addPaneV3(
  api: DockviewApi,
  pane: WorkbenchPaneDefinitionV3,
  placement: "first" | "right" | "within",
): void {
  const referenceGroup = api.panels[0]?.group;
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
): void {
  api.clear();
  panes.forEach((pane, index) => {
    addPaneV3(
      api,
      pane,
      index === 0 ? "first" : index === 1 ? "right" : "within",
    );
  });
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
}: WorkbenchDockviewPropsV3) {
  for (const pane of panes) {
    if (pane.role !== role) {
      throw new Error(
        `Workbench ${role} area cannot host ${pane.role} pane ${pane.paneId}`,
      );
    }
  }

  const apiRef = React.useRef<DockviewApi | null>(null);
  const paneSignature = React.useMemo(
    () => panes.map(({ paneId, title }) => `${paneId}:${title}`).join("|"),
    [panes],
  );
  const paneById = React.useMemo(
    () => new Map(panes.map((pane) => [pane.paneId, pane])),
    [panes],
  );
  const context = React.useMemo<WorkbenchDockviewContextV3>(
    () => ({ paneById, renderPane, onOpenPaneSettings }),
    [onOpenPaneSettings, paneById, renderPane],
  );
  const components = React.useMemo(
    () => ({ "workbench-pane-v3": WorkbenchDockPanelV3 }),
    [],
  );

  React.useEffect(() => {
    const api = apiRef.current;
    if (api === null) return;
    applyPanesV3(api, panes);
  }, [paneSignature, panes]);

  if (panes.length === 0) {
    return (
      <section
        className={`flex h-full min-h-0 items-center justify-center bg-wb-aux text-xs text-wb-subtle ${className}`}
        aria-label={ariaLabel}
        data-workbench-role-area={role}
      >
        No panes selected
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
          components={components}
          defaultTabComponent={WorkbenchDockTabV3}
          defaultRenderer="onlyWhenVisible"
          disableFloatingGroups
          getTabContextMenuItems={() => []}
          getTabGroupChipContextMenuItems={() => []}
          onReady={(event: DockviewReadyEvent) => {
            apiRef.current = event.api;
            applyPanesV3(event.api, panes);
          }}
        />
      </section>
    </WorkbenchDockContextV3.Provider>
  );
}

export default WorkbenchDockview;
