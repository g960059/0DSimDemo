import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DockviewReact,
  type DockviewApi,
  type IDockviewHeaderActionsProps,
  type DockviewReadyEvent,
  type IDockviewPanelHeaderProps,
  type IDockviewPanelProps,
  type SerializedDockview,
} from 'dockview';
import { MoreVertical, Plus } from 'lucide-react';
import 'dockview/dist/styles/dockview.css';
import type { DockviewViewState, PanelDef, PanelRole, PanelType, WorkbenchZoneId } from '../../types';
import { roleOf } from '../../paneRole';

type DockPanelParams = {
  panelId: string;
  role: PanelRole;
};

type WorkbenchDockviewContextValue = {
  panelsById: Map<string, PanelDef>;
  renderPanel: (panel: PanelDef) => React.ReactNode;
  mode: WorkbenchDockviewProps['mode'];
  onRemovePanel?: (panelId: string) => void;
  onToggleSettings?: (panelId: string) => void;
  onRenamePanel?: (panelId: string, title: string) => void;
  zone: WorkbenchZoneId;
  getPanelTitle: (panel: PanelDef) => string;
  onAddPanel?: (type: PanelType, zone?: WorkbenchZoneId) => void;
  requestAddPanel: (type: PanelType, groupId?: string) => void;
};

interface WorkbenchDockviewProps {
  panels: readonly PanelDef[];
  zone: WorkbenchZoneId;
  mode: 'learner' | 'author' | 'sandbox';
  renderPanel: (panel: PanelDef) => React.ReactNode;
  layoutKey?: string;
  viewState?: DockviewViewState;
  onViewStateChange?: (viewState: DockviewViewState) => void;
  onRemovePanel?: (panelId: string) => void;
  onToggleSettings?: (panelId: string) => void;
  onRenamePanel?: (panelId: string, title: string) => void;
  onAddPanel?: (type: PanelType, zone?: WorkbenchZoneId) => void;
  getPanelTitle?: (panel: PanelDef) => string;
  className?: string;
}

const WorkbenchDockviewContext = createContext<WorkbenchDockviewContextValue | null>(null);

function panelRole(panel: PanelDef): PanelRole {
  return panel.role ?? roleOf(panel.type);
}

export function getDockviewStructureSignature(panels: readonly PanelDef[]): string {
  return panels.map((panel) => `${panel.id}:${panelRole(panel)}`).join('|');
}

function getDockviewMetadataSignature(panels: readonly PanelDef[]): string {
  return panels.map((panel) => `${panel.id}:${panel.title}:${panelRole(panel)}`).join('|');
}

const ZONE_LABELS: Record<WorkbenchZoneId, string> = {
  caseRail: 'Case',
  main: 'Main',
  sideRail: 'Controls',
  bottomPanel: 'Outputs',
};

const ADD_OPTIONS_BY_ZONE: Record<WorkbenchZoneId, Array<{ type: PanelType; label: string }>> = {
  caseRail: [
    { type: 'NOTE', label: 'Note' },
  ],
  main: [
    { type: 'PVLOOP', label: 'PV Loop' },
    { type: 'WAVEFORM', label: 'Waveforms' },
    { type: 'GUYTON_LEFT', label: 'Guyton (L)' },
    { type: 'GUYTON_RIGHT', label: 'Guyton (R)' },
    { type: 'NOTE', label: 'Note' },
  ],
  sideRail: [
    { type: 'SCENARIOS', label: 'Scenarios' },
    { type: 'CONTROLS', label: 'Controls' },
  ],
  bottomPanel: [
    { type: 'METRICS', label: 'Metrics' },
  ],
};

const defaultPanelTitle = (panel: PanelDef) => panel.title;
const TAB_MENU_WIDTH = 144;
const TAB_MENU_ESTIMATED_HEIGHT = 128;
type MenuPosition = { x: number; y: number };

export function getDockviewTabMenuPosition({
  point,
  anchorRect,
  viewportWidth,
  viewportHeight,
}: {
  point?: MenuPosition | null;
  anchorRect?: Pick<DOMRectReadOnly, 'left' | 'bottom'> | null;
  viewportWidth: number;
  viewportHeight: number;
}): MenuPosition {
  const useAnchor = Boolean(anchorRect) && (!point || (point.x === 0 && point.y === 0));
  const rawX = useAnchor ? anchorRect!.left : (point?.x ?? 8);
  const rawY = useAnchor ? anchorRect!.bottom + 4 : (point?.y ?? 8);
  return {
    x: Math.max(8, Math.min(rawX, viewportWidth - TAB_MENU_WIDTH - 8)),
    y: Math.max(8, Math.min(rawY, viewportHeight - TAB_MENU_ESTIMATED_HEIGHT)),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isSerializedDockviewState(value: unknown): value is SerializedDockview {
  return isRecord(value) && isRecord(value.grid) && isRecord(value.panels);
}

function hasCompatibleSavedPanels(state: SerializedDockview, panels: readonly PanelDef[]) {
  const currentIds = new Set(panels.map((panel) => panel.id));
  return Object.keys(state.panels).every((id) => currentIds.has(id));
}

function addPanelToDockview(
  api: DockviewApi,
  panel: PanelDef,
  preferredGroupId?: string | null,
  positionOverride?: Parameters<DockviewApi['addPanel']>[0]['position'],
) {
  const role = panelRole(panel);
  const referenceGroup = (preferredGroupId ? api.getGroup(preferredGroupId) : undefined) ?? api.activeGroup ?? api.panels[0]?.group;
  const position = positionOverride ?? (referenceGroup ? { referenceGroup, direction: 'within' } as const : undefined);

  return api.addPanel<DockPanelParams>({
    id: panel.id,
    title: panel.title,
    component: 'workbench-panel',
    params: { panelId: panel.id, role },
    renderer: 'onlyWhenVisible',
    ...(position ? { position, floating: false } : {}),
  });
}

function syncDockviewPanelMetadata(api: DockviewApi, panels: readonly PanelDef[]) {
  for (const panel of panels) {
    const dockPanel = api.getPanel(panel.id);
    if (!dockPanel) continue;
    dockPanel.setTitle(panel.title);
    dockPanel.api.updateParameters({ panelId: panel.id, role: panelRole(panel) });
  }
}

function sideRailOrder(panel: PanelDef): number {
  if (panel.type === 'SCENARIOS') return 0;
  if (panel.type === 'CONTROLS') return 1;
  return 2;
}

function orderedPanelsForZone(panels: readonly PanelDef[], zone?: WorkbenchZoneId): PanelDef[] {
  const sorted = [...panels].sort((a, b) => {
    if (zone === 'sideRail') return sideRailOrder(a) - sideRailOrder(b);
    const order: Record<PanelRole, number> = { graph: 0, control: 1, note: 2, output: 3 };
    return order[panelRole(a)] - order[panelRole(b)];
  });
  return sorted;
}

function rebuildDockview(api: DockviewApi, panels: readonly PanelDef[], preferredGroupId?: string | null, zone?: WorkbenchZoneId) {
  api.clear();
  const sorted = orderedPanelsForZone(panels, zone);
  let firstGroup = undefined as ReturnType<DockviewApi['getGroup']>;
  for (const panel of sorted) {
    const position = zone === 'sideRail' && !preferredGroupId && firstGroup
      ? { referenceGroup: firstGroup, direction: 'below' } as const
      : undefined;
    const dockPanel = addPanelToDockview(api, panel, preferredGroupId, position);
    firstGroup ??= dockPanel.group;
  }
  syncDockviewPanelMetadata(api, panels);
}

function restoreDockview(
  api: DockviewApi,
  panels: readonly PanelDef[],
  viewState?: DockviewViewState,
  zone?: WorkbenchZoneId,
  preferredGroupId?: string | null,
) {
  if (viewState?.library !== 'dockview' || viewState.schemaVersion !== 1) return false;
  if (viewState.zone && zone && viewState.zone !== zone) return false;
  if (!isSerializedDockviewState(viewState.state)) return false;
  if (!hasCompatibleSavedPanels(viewState.state, panels)) return false;

  try {
    api.clear();
    api.fromJSON(viewState.state);
    const restoredIds = new Set(api.panels.map((panel) => panel.id));
    for (const panel of panels) {
      if (!restoredIds.has(panel.id)) {
        const referenceGroup = api.panels[0]?.group;
        const position = zone === 'sideRail' && referenceGroup
          ? { referenceGroup, direction: panel.type === 'SCENARIOS' ? 'above' : 'below' } as const
          : undefined;
        addPanelToDockview(api, panel, preferredGroupId, position);
      }
    }
    syncDockviewPanelMetadata(api, panels);
    return true;
  } catch {
    api.clear();
    return false;
  }
}

function applyDockviewLayout(
  api: DockviewApi,
  panels: readonly PanelDef[],
  viewState?: DockviewViewState,
  zone?: WorkbenchZoneId,
  preferredGroupId?: string | null,
) {
  if (restoreDockview(api, panels, viewState, zone, preferredGroupId)) return;
  rebuildDockview(api, panels, preferredGroupId, zone);
}

function captureDockviewViewState(api: DockviewApi, zone: WorkbenchZoneId): DockviewViewState {
  return {
    library: 'dockview',
    schemaVersion: 1,
    zone,
    state: api.toJSON(),
    updatedAt: Date.now(),
  };
}

function WorkbenchDockPanel(props: IDockviewPanelProps<DockPanelParams>) {
  const context = useContext(WorkbenchDockviewContext);
  const panel = context?.panelsById.get(props.params.panelId);
  if (!context || !panel) {
    return <div className="flex h-full items-center justify-center text-xs text-slate-500">Panel unavailable</div>;
  }
  return <>{context.renderPanel(panel)}</>;
}

function WorkbenchDockTab(props: IDockviewPanelHeaderProps<DockPanelParams>) {
  const context = useContext(WorkbenchDockviewContext);
  const [isActive, setIsActive] = useState(props.api.isActive);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const panel = context?.panelsById.get(props.params.panelId);
  const title = panel && context ? context.getPanelTitle(panel) : (props.api.title ?? props.params.panelId);

  useEffect(() => {
    setIsActive(props.api.isActive);
    const disposable = props.api.onDidActiveChange((event) => {
      setIsActive(event.isActive);
      if (!event.isActive) setMenuPosition(null);
    });
    return () => disposable.dispose();
  }, [props.api]);

  const canConfigure = context?.mode !== 'learner' && Boolean(panel) && panel?.type !== 'SCENARIOS' && Boolean(context?.onToggleSettings);
  const canRename = context?.mode !== 'learner' && Boolean(panel) && Boolean(context?.onRenamePanel);
  const canClose = context?.mode !== 'learner' && Boolean(context?.onRemovePanel);
  const hasMenu = canConfigure || canRename || canClose;

  useEffect(() => {
    if (!menuPosition) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setMenuPosition(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuPosition]);

  const getMenuPositionNearPoint = (point: MenuPosition, anchorRect?: DOMRect | null) => getDockviewTabMenuPosition({
    point,
    anchorRect,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  });

  const renamePanel = () => {
    if (!context?.onRenamePanel) return;
    const nextTitle = window.prompt('Rename pane', title);
    if (nextTitle === null) return;
    const trimmedTitle = nextTitle.trim();
    if (!trimmedTitle || trimmedTitle === title) return;
    context.onRenamePanel(props.params.panelId, trimmedTitle);
  };

  return (
    <div
      className={`workbench-dock-tab flex h-full min-w-0 items-center justify-between gap-2 px-2.5 text-xs font-semibold ${isActive ? 'text-slate-100' : 'text-slate-500'}`}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!hasMenu) return;
        setMenuPosition(getMenuPositionNearPoint(
          { x: event.clientX, y: event.clientY },
          event.currentTarget.getBoundingClientRect(),
        ));
      }}
    >
      <span className="min-w-0 flex-1 truncate">{title}</span>
      <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        {hasMenu && (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                const rect = event.currentTarget.getBoundingClientRect();
                setMenuPosition((value) => (
                  value
                    ? null
                    : getMenuPositionNearPoint({ x: rect.right - TAB_MENU_WIDTH, y: rect.bottom + 4 })
                ));
              }}
              className={`workbench-dock-tab-menu-button inline-flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-700/80 hover:text-slate-100 ${
                menuPosition ? 'opacity-100' : ''
              }`}
              aria-label={`${title} pane menu`}
              aria-haspopup="menu"
              aria-expanded={Boolean(menuPosition)}
              title="Pane menu"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
            {menuPosition && typeof document !== 'undefined' && createPortal(
              <>
                <div className="fixed inset-0 z-[80]" onClick={() => setMenuPosition(null)} />
                <div
                  role="menu"
                  className="workbench-popover-menu fixed z-[90] w-36 rounded-md border py-1 shadow-xl"
                  style={{ left: menuPosition.x, top: menuPosition.y }}
                >
                  {canRename && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setMenuPosition(null);
                        renamePanel();
                      }}
                      role="menuitem"
                      className="workbench-popover-menu-item block w-full px-3 py-1.5 text-left text-xs font-medium"
                    >
                      Rename
                    </button>
                  )}
                  {canConfigure && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        context?.onToggleSettings?.(props.params.panelId);
                        setMenuPosition(null);
                      }}
                      role="menuitem"
                      className="workbench-popover-menu-item block w-full px-3 py-1.5 text-left text-xs font-medium"
                    >
                      Pane settings
                    </button>
                  )}
                  {canClose && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        context?.onRemovePanel?.(props.params.panelId);
                        setMenuPosition(null);
                      }}
                      role="menuitem"
                      className="workbench-popover-menu-item-danger block w-full px-3 py-1.5 text-left text-xs font-medium"
                    >
                      Close pane
                    </button>
                  )}
                </div>
              </>,
              document.body,
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ZoneAddMenu({
  zone,
  onChoose,
}: {
  zone: WorkbenchZoneId;
  onChoose: (type: PanelType) => void;
}) {
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const options = ADD_OPTIONS_BY_ZONE[zone];

  const openMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition((value) => (
      value
        ? null
        : {
            x: Math.max(8, Math.min(rect.right - 160, window.innerWidth - 168)),
            y: Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - 160)),
          }
    ));
  };

  return (
    <div className="relative flex h-full items-center px-1">
      <button
        type="button"
        onClick={openMenu}
        className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-500 hover:bg-slate-800 hover:text-slate-100"
        aria-label={`Add ${ZONE_LABELS[zone]} pane`}
        title={`Add ${ZONE_LABELS[zone]} pane`}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      {menuPosition && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[80]" onClick={() => setMenuPosition(null)} />
          <div
            className="workbench-popover-menu fixed z-[90] w-40 rounded-md border py-1 shadow-xl"
            style={{ left: menuPosition.x, top: menuPosition.y }}
          >
            {options.map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onChoose(option.type);
                  setMenuPosition(null);
                }}
                className="workbench-popover-menu-item block w-full px-3 py-2 text-left text-xs font-medium"
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      , document.body)}
    </div>
  );
}

function WorkbenchDockHeaderActions(props: IDockviewHeaderActionsProps) {
  const context = useContext(WorkbenchDockviewContext);
  if (!context || context.mode === 'learner' || !context.onAddPanel) return null;

  return (
    <ZoneAddMenu
      zone={context.zone}
      onChoose={(type) => context.requestAddPanel(type, props.group.id)}
    />
  );
}

function EmptyDockview({
  zone,
  mode,
  onAddPanel,
}: Pick<WorkbenchDockviewProps, 'zone' | 'mode' | 'onAddPanel'>) {
  const canAdd = mode !== 'learner' && Boolean(onAddPanel);
  return (
    <div className="relative flex h-full items-center justify-center bg-[#0B1120] text-sm text-slate-600">
      {canAdd && (
        <div className="absolute right-2 top-2">
          <ZoneAddMenu zone={zone} onChoose={(type) => onAddPanel?.(type, zone)} />
        </div>
      )}
      No panels
    </div>
  );
}

function StaticDockviewFallback({
  panels,
  renderPanel,
  zone,
  mode,
  onAddPanel,
}: Pick<WorkbenchDockviewProps, 'panels' | 'renderPanel' | 'zone' | 'mode' | 'onAddPanel'>) {
  if (panels.length === 0) return <EmptyDockview zone={zone} mode={mode} onAddPanel={onAddPanel} />;
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-2">
      {panels.map((panel) => (
        <div key={panel.id} className="min-h-0 overflow-hidden border-r border-slate-800/70 bg-[#0B1120] last:border-r-0">
          {renderPanel(panel)}
        </div>
      ))}
    </div>
  );
}

export function WorkbenchDockview({
  panels,
  zone,
  mode,
  renderPanel,
  layoutKey = 'default',
  viewState,
  onViewStateChange,
  onRemovePanel,
  onToggleSettings,
  onRenamePanel,
  onAddPanel,
  getPanelTitle = defaultPanelTitle,
  className = '',
}: WorkbenchDockviewProps) {
  const apiRef = useRef<DockviewApi | null>(null);
  const pendingAddGroupIdRef = useRef<string | null>(null);
  const layoutSubscriptionRef = useRef<{ dispose: () => void } | null>(null);
  const suppressChangeRef = useRef(false);
  const pendingEmitRef = useRef<number | null>(null);
  const onViewStateChangeRef = useRef(onViewStateChange);
  const structureSignature = useMemo(() => getDockviewStructureSignature(panels), [panels]);
  const metadataSignature = useMemo(() => getDockviewMetadataSignature(panels), [panels]);
  const panelsById = useMemo(() => new Map(panels.map((panel) => [panel.id, panel])), [panels]);
  const contextValue = useMemo<WorkbenchDockviewContextValue>(
    () => ({
      panelsById,
      renderPanel,
      mode,
      onRemovePanel,
      onToggleSettings,
      onRenamePanel,
      zone,
      getPanelTitle,
      onAddPanel,
      requestAddPanel: (type, groupId) => {
        pendingAddGroupIdRef.current = groupId ?? null;
        onAddPanel?.(type, zone);
      },
    }),
    [getPanelTitle, mode, onAddPanel, onRemovePanel, onRenamePanel, onToggleSettings, panelsById, renderPanel, zone],
  );
  const components = useMemo(() => ({ 'workbench-panel': WorkbenchDockPanel }), []);
  useEffect(() => {
    onViewStateChangeRef.current = onViewStateChange;
  }, [onViewStateChange]);

  useEffect(() => () => {
    layoutSubscriptionRef.current?.dispose();
    if (pendingEmitRef.current !== null) window.clearTimeout(pendingEmitRef.current);
  }, []);

  const scheduleViewStateEmit = (api: DockviewApi) => {
    if (!onViewStateChangeRef.current || suppressChangeRef.current) return;
    if (pendingEmitRef.current !== null) window.clearTimeout(pendingEmitRef.current);
    pendingEmitRef.current = window.setTimeout(() => {
      pendingEmitRef.current = null;
      if (!onViewStateChangeRef.current || suppressChangeRef.current) return;
      onViewStateChangeRef.current(captureDockviewViewState(api, zone));
    }, 150);
  };

  const applyLayoutWithoutEmitting = (api: DockviewApi) => {
    suppressChangeRef.current = true;
    applyDockviewLayout(api, panels, viewState, zone, pendingAddGroupIdRef.current);
    pendingAddGroupIdRef.current = null;
    window.queueMicrotask(() => {
      suppressChangeRef.current = false;
    });
  };

  useEffect(() => {
    if (!apiRef.current) return;
    applyLayoutWithoutEmitting(apiRef.current);
    // Only re-apply Dockview structure when the case/load key or panel identity
    // changes. `viewState` changes emitted by this component must not feed back
    // into an immediate fromJSON call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureSignature, layoutKey, zone]);

  useEffect(() => {
    if (!apiRef.current) return;
    syncDockviewPanelMetadata(apiRef.current, panels);
  }, [metadataSignature, panels]);

  if (typeof window === 'undefined') {
    return <StaticDockviewFallback panels={panels} renderPanel={renderPanel} zone={zone} mode={mode} onAddPanel={onAddPanel} />;
  }

  const isLearnerMode = mode === 'learner';

  if (panels.length === 0) {
    return (
      <div className={`dockview-theme-dark h-full min-h-0 overflow-hidden ${className}`}>
        <EmptyDockview zone={zone} mode={mode} onAddPanel={onAddPanel} />
      </div>
    );
  }

  return (
    <WorkbenchDockviewContext.Provider value={contextValue}>
      <div className={`dockview-theme-dark h-full min-h-0 overflow-hidden ${className}`}>
        <DockviewReact
          components={components}
          defaultTabComponent={WorkbenchDockTab}
          rightHeaderActionsComponent={WorkbenchDockHeaderActions}
          defaultRenderer="onlyWhenVisible"
          disableDnd={isLearnerMode}
          disableFloatingGroups
          noPanelsOverlay="emptyGroup"
          getTabContextMenuItems={() => []}
          getTabGroupChipContextMenuItems={() => []}
          onReady={(event: DockviewReadyEvent) => {
            apiRef.current = event.api;
            applyLayoutWithoutEmitting(event.api);
            layoutSubscriptionRef.current?.dispose();
            layoutSubscriptionRef.current = event.api.onDidLayoutChange(() => scheduleViewStateEmit(event.api));
          }}
        />
      </div>
    </WorkbenchDockviewContext.Provider>
  );
}

export default WorkbenchDockview;
