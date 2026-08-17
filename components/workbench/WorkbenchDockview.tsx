import React from "react";
import { createPortal } from "react-dom";
import {
  DockviewReact,
  type DockviewApi,
  type DockviewReadyEvent,
  type IDockviewHeaderActionsProps,
  type IDockviewPanelHeaderProps,
  type IDockviewPanelProps,
} from "dockview";
import {
  Columns2,
  GitCompareArrows,
  MoreVertical,
  Pencil,
  Plus,
  Rows2,
  Settings2,
  Trash2,
} from "lucide-react";
import "dockview/dist/styles/dockview.css";

export type WorkbenchPaneRoleV3 = "graph" | "output" | "control" | "note";
export type WorkbenchDockLayoutModeV3 = "dashboard" | "split" | "tabs";

export type WorkbenchPaneDefinitionV3 = Readonly<{
  paneId: string;
  role: WorkbenchPaneRoleV3;
  title: string;
}>;

export type WorkbenchAddPaneOptionV3 = Readonly<{
  id: string;
  label: string;
  description?: string;
}>;

export type WorkbenchPaneSplitDirectionV3 = "right" | "below";
export type WorkbenchDockDropPositionV3 =
  "top" | "bottom" | "left" | "right" | "center";

const GRAPH_SPLIT_DIRECTIONS_V3 = Object.freeze(["right", "below"] as const);
const OUTPUT_SPLIT_DIRECTIONS_V3 = Object.freeze(["right"] as const);
const CONTROL_SPLIT_DIRECTIONS_V3 = Object.freeze(["below"] as const);
const NO_SPLIT_DIRECTIONS_V3 = Object.freeze(
  [],
) as readonly WorkbenchPaneSplitDirectionV3[];

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
  onRenamePane?: (paneId: string, title: string) => void;
  renamePaneLabel?: string;
  onDeletePane?: (paneId: string) => void;
  deletePaneLabel?: string;
  onSplitPane?: (
    paneId: string,
    direction: WorkbenchPaneSplitDirectionV3,
  ) => string | undefined;
  splitRightLabel?: string;
  splitDownLabel?: string;
  onComparePane?: (paneId: string) => string | undefined;
  comparePaneLabel?: string;
  onAddPane?: (optionId?: string) => string | undefined;
  addPaneOptions?: readonly WorkbenchAddPaneOptionV3[];
  addPaneLabel?: string;
  emptyPaneLabel?: string;
}>;

type WorkbenchDockviewContextV3 = Readonly<{
  onOpenPaneSettings?: (paneId: string) => void;
  paneSettingsLabel?: string;
  addPaneLabel?: string;
  addPaneOptions?: readonly WorkbenchAddPaneOptionV3[];
  requestAddPane?: (anchorPaneId: string, optionId?: string) => void;
  onRenamePane?: (paneId: string, title: string) => void;
  renamePaneLabel?: string;
  onDeletePane?: (paneId: string) => void;
  deletePaneLabel?: string;
  requestSplitPane?: (
    paneId: string,
    direction: WorkbenchPaneSplitDirectionV3,
  ) => void;
  requestComparePane?: (paneId: string) => void;
  comparePaneLabel?: string;
  splitDirections: readonly WorkbenchPaneSplitDirectionV3[];
  splitRightLabel?: string;
  splitDownLabel?: string;
  paneById: ReadonlyMap<string, WorkbenchPaneDefinitionV3>;
  renderPane: WorkbenchDockviewPropsV3["renderPane"];
}>;

const WorkbenchDockContextV3 =
  React.createContext<WorkbenchDockviewContextV3 | null>(null);

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
  const [menuPosition, setMenuPosition] = React.useState<Readonly<{
    x: number;
    y: number;
  }> | null>(null);
  const [renaming, setRenaming] = React.useState(false);
  const [draftTitle, setDraftTitle] = React.useState(title);
  const [isActive, setIsActive] = React.useState(() => props.api.isActive);
  const [isVisible, setIsVisible] = React.useState(() => props.api.isVisible);
  const hasMenu =
    pane !== undefined &&
    (context?.onOpenPaneSettings !== undefined ||
      context?.onRenamePane !== undefined ||
      context?.onDeletePane !== undefined ||
      context?.requestComparePane !== undefined ||
      (context?.requestSplitPane !== undefined &&
        context.splitDirections.length > 0));

  React.useEffect(() => setDraftTitle(title), [title]);
  React.useEffect(() => {
    const active = props.api.onDidActiveChange(({ isActive: nextActive }) => {
      setIsActive(nextActive);
      if (!nextActive) setMenuPosition(null);
    });
    const visible = props.api.onDidVisibilityChange(
      ({ isVisible: nextVisible }) => setIsVisible(nextVisible),
    );
    setIsActive(props.api.isActive);
    setIsVisible(props.api.isVisible);
    return () => {
      active.dispose();
      visible.dispose();
    };
  }, [props.api]);
  React.useEffect(() => {
    if (menuPosition === null) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuPosition(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuPosition]);

  const openMenu = (x: number, y: number) =>
    setMenuPosition({
      x: Math.max(8, Math.min(x, window.innerWidth - 208)),
      y: Math.max(8, Math.min(y, window.innerHeight - 340)),
    });
  const beginRename = () => {
    setMenuPosition(null);
    setDraftTitle(title);
    setRenaming(true);
  };
  const commitRename = () => {
    const nextTitle = draftTitle.trim();
    if (pane !== undefined && nextTitle.length > 0 && nextTitle !== title)
      context?.onRenamePane?.(pane.paneId, nextTitle);
    setRenaming(false);
    setDraftTitle(nextTitle.length > 0 ? nextTitle : title);
  };

  return (
    <div
      className="workbench-dock-tab relative flex h-full min-w-[7.5rem] items-center gap-1.5 overflow-hidden px-2.5 text-wb-muted"
      data-visible={isVisible ? "true" : "false"}
      onClick={() => props.api.setActive()}
      onDoubleClick={() => {
        if (context?.onRenamePane !== undefined) beginRename();
      }}
      onContextMenu={(event) => {
        if (!hasMenu) return;
        event.preventDefault();
        event.stopPropagation();
        props.api.setActive();
        openMenu(event.clientX, event.clientY);
      }}
    >
      {renaming ? (
        <input
          type="text"
          autoFocus
          value={draftTitle}
          aria-label={context?.renamePaneLabel ?? "Rename pane"}
          className="h-7 min-w-20 flex-1 rounded-md bg-wb-soft px-2 text-xs font-semibold text-wb-text outline-none ring-1 ring-wb-accent"
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => setDraftTitle(event.target.value)}
          onBlur={commitRename}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") {
              event.stopPropagation();
              setDraftTitle(title);
              setRenaming(false);
            }
          }}
        />
      ) : (
        <span className="min-w-0 flex-1 truncate">{title}</span>
      )}
      {hasMenu && !renaming && (
        <button
          type="button"
          className="workbench-dock-tab-settings relative z-10 inline-flex h-7 w-7 shrink-0 touch-manipulation items-center justify-center rounded-md text-wb-subtle transition-colors duration-150 hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          aria-label={`${context?.paneSettingsLabel ?? "Pane menu"}: ${title}`}
          aria-haspopup="menu"
          aria-expanded={menuPosition !== null}
          tabIndex={isActive ? 0 : -1}
          title={context?.paneSettingsLabel ?? "Pane menu"}
          draggable={false}
          onClick={(event) => {
            event.stopPropagation();
            const rect = event.currentTarget.getBoundingClientRect();
            if (menuPosition === null) {
              openMenu(rect.right - 196, rect.bottom + 4);
            } else {
              setMenuPosition(null);
            }
          }}
        >
          <MoreVertical className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
      {menuPosition !== null &&
      pane !== undefined &&
      typeof document !== "undefined"
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-[79] cursor-default"
                aria-label="Close pane menu"
                onClick={() => setMenuPosition(null)}
              />
              <div
                role="menu"
                aria-label={title}
                className="fixed z-[80] max-h-[calc(100dvh-1rem)] w-48 overflow-y-auto rounded-xl bg-wb-panel p-1.5 text-xs text-wb-text shadow-2xl ring-1 ring-wb-line"
                style={{ left: menuPosition.x, top: menuPosition.y }}
                onClick={(event) => event.stopPropagation()}
              >
                {context?.onRenamePane !== undefined && (
                  <PaneMenuButtonV3
                    icon={<Pencil className="h-3.5 w-3.5" />}
                    label={context.renamePaneLabel ?? "Rename"}
                    onClick={beginRename}
                  />
                )}
                {context?.onOpenPaneSettings !== undefined && (
                  <PaneMenuButtonV3
                    icon={<Settings2 className="h-3.5 w-3.5" />}
                    label={context.paneSettingsLabel ?? "Pane settings"}
                    onClick={() => {
                      setMenuPosition(null);
                      context.onOpenPaneSettings?.(pane.paneId);
                    }}
                  />
                )}
                {context?.requestSplitPane !== undefined && (
                  <>
                    {context.splitDirections.includes("right") && (
                      <PaneMenuButtonV3
                        icon={<Columns2 className="h-3.5 w-3.5" />}
                        label={context.splitRightLabel ?? "Split right"}
                        onClick={() => {
                          setMenuPosition(null);
                          context.requestSplitPane?.(pane.paneId, "right");
                        }}
                      />
                    )}
                    {context.splitDirections.includes("below") && (
                      <PaneMenuButtonV3
                        icon={<Rows2 className="h-3.5 w-3.5" />}
                        label={context.splitDownLabel ?? "Split down"}
                        onClick={() => {
                          setMenuPosition(null);
                          context.requestSplitPane?.(pane.paneId, "below");
                        }}
                      />
                    )}
                  </>
                )}
                {context?.requestComparePane !== undefined && (
                  <PaneMenuButtonV3
                    icon={<GitCompareArrows className="h-3.5 w-3.5" />}
                    label={context.comparePaneLabel ?? "Compare Scenarios"}
                    onClick={() => {
                      setMenuPosition(null);
                      context.requestComparePane?.(pane.paneId);
                    }}
                  />
                )}
                {context?.onDeletePane !== undefined && (
                  <PaneMenuButtonV3
                    destructive
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    label={context.deletePaneLabel ?? "Delete pane"}
                    onClick={() => {
                      setMenuPosition(null);
                      context.onDeletePane?.(pane.paneId);
                    }}
                  />
                )}
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}

function PaneMenuButtonV3({
  destructive = false,
  icon,
  label,
  onClick,
}: Readonly<{
  destructive?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 ${
        destructive
          ? "text-wb-danger hover:bg-wb-danger-soft focus-visible:ring-wb-danger"
          : "text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:ring-wb-accent"
      }`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function WorkbenchDockAddPaneActionV3(props: IDockviewHeaderActionsProps) {
  const context = React.useContext(WorkbenchDockContextV3);
  const anchorPaneId = workbenchAddPaneAnchorForGroupV3(
    props.panels.map(({ id }) => id),
  );
  if (context?.requestAddPane === undefined || anchorPaneId === undefined) {
    return null;
  }
  return (
    <WorkbenchAddPaneButtonV3
      label={context.addPaneLabel ?? "Add pane"}
      onAddPane={(optionId) => context.requestAddPane?.(anchorPaneId, optionId)}
      options={context.addPaneOptions ?? []}
      className="workbench-dock-add-pane inline-flex h-full min-w-9 touch-manipulation items-center justify-center text-wb-subtle transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-wb-accent"
    />
  );
}

function WorkbenchAddPaneButtonV3({
  className,
  label,
  onAddPane,
  options,
  showLabel = false,
}: Readonly<{
  className: string;
  label: string;
  onAddPane: (optionId?: string) => void;
  options: readonly WorkbenchAddPaneOptionV3[];
  showLabel?: boolean;
}>) {
  const [menuPosition, setMenuPosition] = React.useState<Readonly<{
    x: number;
    y: number;
  }> | null>(null);
  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={label}
        aria-haspopup={options.length > 0 ? "menu" : undefined}
        aria-expanded={options.length > 0 ? menuPosition !== null : undefined}
        title={label}
        onClick={(event) => {
          if (options.length === 0) {
            onAddPane();
            return;
          }
          const rect = event.currentTarget.getBoundingClientRect();
          setMenuPosition((current) =>
            current === null
              ? {
                  x: Math.max(
                    8,
                    Math.min(rect.right - 224, window.innerWidth - 232),
                  ),
                  y: Math.max(
                    8,
                    Math.min(rect.bottom + 4, window.innerHeight - 260),
                  ),
                }
              : null,
          );
        }}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        {showLabel && <span>{label}</span>}
      </button>
      {menuPosition !== null && typeof document !== "undefined"
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-[79] cursor-default"
                aria-label="Close add pane menu"
                onClick={() => setMenuPosition(null)}
              />
              <div
                role="menu"
                aria-label={label}
                className="fixed z-[80] w-56 overflow-hidden rounded-xl bg-wb-panel p-1.5 text-xs shadow-2xl ring-1 ring-wb-line"
                style={{ left: menuPosition.x, top: menuPosition.y }}
              >
                {options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="menuitem"
                    className="block min-h-10 w-full rounded-lg px-3 py-2 text-left text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                    onClick={() => {
                      setMenuPosition(null);
                      onAddPane(option.id);
                    }}
                  >
                    <span className="block font-semibold">{option.label}</span>
                    {option.description !== undefined && (
                      <span className="mt-0.5 block text-[10px] leading-4 text-wb-subtle">
                        {option.description}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}

function addPaneV3(
  api: DockviewApi,
  pane: WorkbenchPaneDefinitionV3,
  placement: "first" | "right" | "within",
): void {
  const referenceGroup =
    placement === "within" ? api.panels.at(-1)?.group : api.panels[0]?.group;
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

function addPaneRelativeToPanelV3(
  api: DockviewApi,
  pane: WorkbenchPaneDefinitionV3,
  referencePaneId: string,
  direction: WorkbenchPaneSplitDirectionV3 | "within",
): boolean {
  const referenceGroup = api.getPanel(referencePaneId)?.group;
  if (referenceGroup === undefined) return false;
  api.addPanel<WorkbenchDockPanelParametersV3>({
    id: pane.paneId,
    title: pane.title,
    component: "workbench-pane-v3",
    params: { paneId: pane.paneId },
    renderer: "onlyWhenVisible",
    position: { referenceGroup, direction },
    floating: false,
  });
  return true;
}

/**
 * The desktop teaching default keeps two analytic views above one full-width
 * time-domain view. Adding the lower pane before splitting the upper group is
 * what makes the lower row span both columns in Dockview's split tree.
 */
function addWorkbenchDashboardPanesV3(
  api: DockviewApi,
  panes: readonly WorkbenchPaneDefinitionV3[],
): void {
  const [upperLeft, upperRight, lower, ...additional] = panes;
  if (upperLeft === undefined) return;
  addPaneV3(api, upperLeft, "first");
  if (upperRight === undefined) return;
  if (lower === undefined) {
    addPaneRelativeToPanelV3(api, upperRight, upperLeft.paneId, "right");
    return;
  }
  if (!addPaneRelativeToPanelV3(api, lower, upperLeft.paneId, "below")) {
    addPaneV3(api, lower, "within");
  }
  if (!addPaneRelativeToPanelV3(api, upperRight, upperLeft.paneId, "right")) {
    addPaneV3(api, upperRight, "right");
  }
  for (const pane of additional) {
    if (!addPaneRelativeToPanelV3(api, pane, upperRight.paneId, "within")) {
      addPaneV3(api, pane, "within");
    }
  }
}

export function applyWorkbenchPanesV3(
  api: DockviewApi,
  panes: readonly WorkbenchPaneDefinitionV3[],
  layoutMode: WorkbenchDockLayoutModeV3,
  pendingSplit?: Readonly<{
    paneId: string;
    sourcePaneId: string;
    direction: WorkbenchPaneSplitDirectionV3;
  }> | null,
  pendingAdd?: Readonly<{
    paneId: string;
    anchorPaneId: string;
  }> | null,
): void {
  const activePaneId = api.activePanel?.id;
  if (
    pendingAdd !== undefined &&
    pendingAdd !== null &&
    applyWorkbenchPaneAdditionToAnchorGroupV3(
      api,
      panes,
      pendingAdd.paneId,
      pendingAdd.anchorPaneId,
    )
  )
    return;
  api.clear();
  const exceptionalPaneIds = new Set([
    ...(pendingSplit === undefined || pendingSplit === null
      ? []
      : [pendingSplit.paneId]),
    ...(pendingAdd === undefined || pendingAdd === null
      ? []
      : [pendingAdd.paneId]),
  ]);
  const ordinaryPanes =
    exceptionalPaneIds.size === 0
      ? panes
      : panes.filter(({ paneId }) => !exceptionalPaneIds.has(paneId));
  if (layoutMode === "dashboard" && ordinaryPanes.length >= 3) {
    addWorkbenchDashboardPanesV3(api, ordinaryPanes);
  } else {
    ordinaryPanes.forEach((pane, index) => {
      addPaneV3(api, pane, workbenchPanePlacementV3(index, layoutMode));
    });
  }
  if (pendingSplit !== undefined && pendingSplit !== null) {
    const pane = panes.find(({ paneId }) => paneId === pendingSplit.paneId);
    const referenceGroup = api.getPanel(pendingSplit.sourcePaneId)?.group;
    if (pane !== undefined && referenceGroup !== undefined) {
      api.addPanel<WorkbenchDockPanelParametersV3>({
        id: pane.paneId,
        title: pane.title,
        component: "workbench-pane-v3",
        params: { paneId: pane.paneId },
        renderer: "onlyWhenVisible",
        position: {
          referenceGroup,
          direction: pendingSplit.direction,
        },
        floating: false,
      });
    } else if (pane !== undefined) {
      addPaneV3(api, pane, "within");
    }
  }
  if (pendingAdd !== undefined && pendingAdd !== null) {
    const pane = panes.find(({ paneId }) => paneId === pendingAdd.paneId);
    const referenceGroup = api.getPanel(pendingAdd.anchorPaneId)?.group;
    if (pane !== undefined && referenceGroup !== undefined) {
      api.addPanel<WorkbenchDockPanelParametersV3>({
        id: pane.paneId,
        title: pane.title,
        component: "workbench-pane-v3",
        params: { paneId: pane.paneId },
        renderer: "onlyWhenVisible",
        position: {
          referenceGroup,
          direction: "within",
        },
        floating: false,
      });
    } else if (pane !== undefined) {
      addPaneV3(api, pane, "within");
    }
  }
  const requestedPaneId = pendingAdd?.paneId ?? pendingSplit?.paneId;
  const paneToActivate =
    requestedPaneId !== undefined
      ? requestedPaneId
      : activePaneId !== undefined &&
          panes.some(({ paneId }) => paneId === activePaneId)
        ? activePaneId
        : panes[0]?.paneId;
  if (paneToActivate !== undefined) {
    api.getPanel?.(paneToActivate)?.api?.setActive?.();
  }
}

/**
 * Reconciles pane membership without rebuilding Dockview's live group tree.
 *
 * Dockview owns presentation-only tab/split geometry. Clearing and replaying
 * the Surface order after a delete would silently replace that geometry with
 * the default two-column layout. Remove only stale panels and add only new
 * panels so every surviving group, sash position, and active tab is retained.
 */
export function reconcileWorkbenchPaneMembershipV3(
  api: DockviewApi,
  panes: readonly WorkbenchPaneDefinitionV3[],
  layoutMode: WorkbenchDockLayoutModeV3,
  pendingSplit?: Readonly<{
    paneId: string;
    sourcePaneId: string;
    direction: WorkbenchPaneSplitDirectionV3;
  }> | null,
  pendingAdd?: Readonly<{
    paneId: string;
    anchorPaneId: string;
  }> | null,
): void {
  if (api.panels.length === 0) {
    applyWorkbenchPanesV3(api, panes, layoutMode, pendingSplit, pendingAdd);
    return;
  }

  const nextPaneIds = new Set(panes.map(({ paneId }) => paneId));
  for (const panel of [...api.panels]) {
    if (!nextPaneIds.has(panel.id)) api.removePanel(panel);
  }

  const addPendingPane = (
    request: Readonly<{
      paneId: string;
      sourcePaneId: string;
      direction: WorkbenchPaneSplitDirectionV3;
    }>,
  ): boolean => {
    const pane = panes.find(({ paneId }) => paneId === request.paneId);
    if (pane === undefined || api.getPanel(pane.paneId) !== undefined) {
      return false;
    }
    const referenceGroup = api.getPanel(request.sourcePaneId)?.group;
    if (referenceGroup === undefined) return false;
    api.addPanel<WorkbenchDockPanelParametersV3>({
      id: pane.paneId,
      title: pane.title,
      component: "workbench-pane-v3",
      params: { paneId: pane.paneId },
      renderer: "onlyWhenVisible",
      position: {
        referenceGroup,
        direction: request.direction,
      },
      floating: false,
    });
    return true;
  };

  let requestedPaneId: string | undefined;
  if (pendingAdd !== undefined && pendingAdd !== null) {
    requestedPaneId = pendingAdd.paneId;
    applyWorkbenchPaneAdditionToAnchorGroupV3(
      api,
      panes,
      pendingAdd.paneId,
      pendingAdd.anchorPaneId,
    );
  }
  if (pendingSplit !== undefined && pendingSplit !== null) {
    requestedPaneId = pendingSplit.paneId;
    addPendingPane(pendingSplit);
  }

  // Surface hydration or an out-of-band add has no clicked anchor. Join the
  // last surviving group as a tab; only an explicit Split action may create a
  // new group after initial layout.
  for (const pane of panes) {
    if (api.getPanel(pane.paneId) === undefined) {
      addPaneV3(api, pane, api.panels.length === 0 ? "first" : "within");
    }
  }

  if (requestedPaneId !== undefined) {
    api.getPanel(requestedPaneId)?.api.setActive();
  }
}

/**
 * Applies the common one-pane add path without rebuilding Dockview. Keeping
 * the live group object is what makes the clicked group's adjacent add action
 * authoritative even after users have rearranged or split the tab layout.
 */
export function applyWorkbenchPaneAdditionToAnchorGroupV3(
  api: DockviewApi,
  panes: readonly WorkbenchPaneDefinitionV3[],
  paneId: string,
  anchorPaneId: string,
): boolean {
  const pane = panes.find((candidate) => candidate.paneId === paneId);
  if (pane === undefined || api.getPanel(paneId) !== undefined) return false;

  const existingPaneIds = new Set(api.panels.map(({ id }) => id));
  const expectedExistingPaneIds = panes
    .filter((candidate) => candidate.paneId !== paneId)
    .map((candidate) => candidate.paneId);
  if (
    existingPaneIds.size !== expectedExistingPaneIds.length ||
    expectedExistingPaneIds.some((id) => !existingPaneIds.has(id))
  )
    return false;

  const referenceGroup = api.getPanel(anchorPaneId)?.group;
  if (referenceGroup === undefined) return false;
  api.addPanel<WorkbenchDockPanelParametersV3>({
    id: pane.paneId,
    title: pane.title,
    component: "workbench-pane-v3",
    params: { paneId: pane.paneId },
    renderer: "onlyWhenVisible",
    position: {
      referenceGroup,
      direction: "within",
    },
    floating: false,
  });
  api.getPanel(pane.paneId)?.api.setActive();
  return true;
}

export function workbenchPanePlacementV3(
  index: number,
  layoutMode: WorkbenchDockLayoutModeV3,
): "first" | "right" | "within" {
  if (index === 0) return "first";
  // Split and dashboard fall back to two columns for fewer than three panes;
  // the full dashboard split tree is applied as a unit by applyWorkbenchPanes.
  return layoutMode !== "tabs" && index === 1 ? "right" : "within";
}

/**
 * Split axes follow the physical shape of each role area. Output panes share a
 * wide horizontal strip, while parameter controllers occupy a tall rail.
 */
export function workbenchPaneSplitDirectionsForRoleV3(
  role: WorkbenchPaneRoleV3,
): readonly WorkbenchPaneSplitDirectionV3[] {
  if (role === "output") return OUTPUT_SPLIT_DIRECTIONS_V3;
  if (role === "control") return CONTROL_SPLIT_DIRECTIONS_V3;
  if (role === "note") return NO_SPLIT_DIRECTIONS_V3;
  return GRAPH_SPLIT_DIRECTIONS_V3;
}

export function workbenchDockLayoutModeForRoleV3(
  role: WorkbenchPaneRoleV3,
  narrowViewport: boolean,
): WorkbenchDockLayoutModeV3 {
  if (role === "control") return "tabs";
  if (role === "graph" && narrowViewport) return "tabs";
  if (role === "graph") return "dashboard";
  return "split";
}

export function workbenchDockDropPositionAllowedForRoleV3(
  role: WorkbenchPaneRoleV3,
  position: WorkbenchDockDropPositionV3,
): boolean {
  if (position === "center") return true;
  if (role === "output") return position === "left" || position === "right";
  if (role === "control") return position === "top" || position === "bottom";
  return role === "graph";
}

/** Every Dockview group owns an adjacent add action anchored to its last tab. */
export function workbenchAddPaneAnchorForGroupV3(
  groupPanelIds: readonly string[],
): string | undefined {
  return groupPanelIds.at(-1);
}

export function getWorkbenchPaneSignatureV3(
  panes: readonly WorkbenchPaneDefinitionV3[],
  layoutMode: WorkbenchDockLayoutModeV3 = "split",
): string {
  // Titles and pane-specific selections flow through React context. Only the
  // ordered Dockview membership and role require structural reconciliation.
  return JSON.stringify([
    layoutMode,
    panes.map(({ paneId, role }) => [paneId, role]),
  ]);
}

function workbenchLayoutModeFromPaneSignatureV3(
  signature: string | null,
): WorkbenchDockLayoutModeV3 | null {
  if (signature === null) return null;
  try {
    const parsed = JSON.parse(signature) as unknown;
    if (!Array.isArray(parsed)) return null;
    const mode = parsed[0];
    return mode === "dashboard" || mode === "split" || mode === "tabs"
      ? mode
      : null;
  } catch {
    return null;
  }
}

export function reconcileWorkbenchPanesV3(
  api: DockviewApi,
  panes: readonly WorkbenchPaneDefinitionV3[],
  appliedSignature: string | null,
  layoutMode: WorkbenchDockLayoutModeV3 = "split",
): string {
  const nextSignature = getWorkbenchPaneSignatureV3(panes, layoutMode);
  if (nextSignature === appliedSignature) return appliedSignature;
  if (
    appliedSignature !== null &&
    workbenchLayoutModeFromPaneSignatureV3(appliedSignature) !== layoutMode
  ) {
    // A responsive desktop-layout→tabs transition is the sole structural
    // rebuild. Pane membership edits must preserve the user's live group tree.
    applyWorkbenchPanesV3(api, panes, layoutMode);
  } else {
    reconcileWorkbenchPaneMembershipV3(api, panes, layoutMode);
  }
  return nextSignature;
}

export function getWorkbenchPaneTitleSignatureV3(
  panes: readonly WorkbenchPaneDefinitionV3[],
): string {
  return JSON.stringify(panes.map(({ paneId, title }) => [paneId, title]));
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
  onRenamePane,
  renamePaneLabel,
  onDeletePane,
  deletePaneLabel,
  onSplitPane,
  splitRightLabel,
  splitDownLabel,
  onComparePane,
  comparePaneLabel,
  onAddPane,
  addPaneOptions = [],
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
  const pendingSplitRef = React.useRef<Readonly<{
    paneId: string;
    sourcePaneId: string;
    direction: WorkbenchPaneSplitDirectionV3;
  }> | null>(null);
  const pendingAddRef = React.useRef<Readonly<{
    paneId: string;
    anchorPaneId: string;
  }> | null>(null);
  const narrowViewport = useNarrowWorkbenchDockviewV3();
  const layoutMode = workbenchDockLayoutModeForRoleV3(role, narrowViewport);
  const splitDirections = workbenchPaneSplitDirectionsForRoleV3(role);
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
      addPaneLabel,
      addPaneOptions,
      requestAddPane:
        onAddPane === undefined
          ? undefined
          : (anchorPaneId, optionId) => {
              const paneId = onAddPane(optionId);
              if (paneId === undefined) return;
              pendingAddRef.current = { paneId, anchorPaneId };
            },
      onDeletePane,
      deletePaneLabel,
      onRenamePane,
      renamePaneLabel,
      requestSplitPane:
        onSplitPane === undefined
          ? undefined
          : (sourcePaneId, direction) => {
              if (!splitDirections.includes(direction)) return;
              const paneId = onSplitPane(sourcePaneId, direction);
              if (paneId === undefined) return;
              pendingSplitRef.current = { paneId, sourcePaneId, direction };
            },
      requestComparePane:
        onComparePane === undefined
          ? undefined
          : (sourcePaneId) => {
              const paneId = onComparePane(sourcePaneId);
              if (paneId === undefined) return;
              pendingSplitRef.current = {
                paneId,
                sourcePaneId,
                direction: "right",
              };
            },
      comparePaneLabel,
      splitDownLabel,
      splitDirections,
      splitRightLabel,
      paneById,
      renderPane,
      onOpenPaneSettings,
      paneSettingsLabel,
    }),
    [
      addPaneLabel,
      addPaneOptions,
      deletePaneLabel,
      onAddPane,
      onDeletePane,
      onComparePane,
      onOpenPaneSettings,
      onRenamePane,
      onSplitPane,
      paneById,
      paneSettingsLabel,
      renamePaneLabel,
      renderPane,
      comparePaneLabel,
      splitDownLabel,
      splitDirections,
      splitRightLabel,
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
    const nextSignature = getWorkbenchPaneSignatureV3(
      latestPanesRef.current,
      latestLayoutModeRef.current,
    );
    if (nextSignature === appliedPaneSignatureRef.current) return;
    if (
      appliedPaneSignatureRef.current !== null &&
      workbenchLayoutModeFromPaneSignatureV3(
        appliedPaneSignatureRef.current,
      ) !== latestLayoutModeRef.current
    ) {
      applyWorkbenchPanesV3(
        api,
        latestPanesRef.current,
        latestLayoutModeRef.current,
        pendingSplitRef.current,
        pendingAddRef.current,
      );
    } else {
      reconcileWorkbenchPaneMembershipV3(
        api,
        latestPanesRef.current,
        latestLayoutModeRef.current,
        pendingSplitRef.current,
        pendingAddRef.current,
      );
    }
    pendingSplitRef.current = null;
    pendingAddRef.current = null;
    appliedPaneSignatureRef.current = nextSignature;
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
            <WorkbenchAddPaneButtonV3
              showLabel
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              label={addPaneLabel}
              onAddPane={onAddPane}
              options={addPaneOptions}
            />
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
          onWillDrop={(event) => {
            if (
              !workbenchDockDropPositionAllowedForRoleV3(role, event.position)
            )
              event.preventDefault();
          }}
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
  const [matches, setMatches] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
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
