import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import {
  DockviewReact,
  type DockviewApi,
  type DockviewGroupPanel,
  type IDockviewHeaderActionsProps,
  type DockviewReadyEvent,
  type IDockviewPanelHeaderProps,
  type IDockviewPanelProps,
  type SerializedDockview,
} from 'dockview';
import { Columns2, Copy, MoreVertical, Pencil, Plus, Rows2, Trash2, X } from 'lucide-react';
import 'dockview/dist/styles/dockview.css';
import type { DockviewViewState, PanelDef, PanelRole, PanelType, WorkbenchZoneId } from '../../types';
import { roleOf } from '../../paneRole';
import type { GraphBoardLayout } from '../../features/workbench/viewSpec';
import {
  deriveGraphBoardLayoutFromDockviewState,
  graphBoardLayoutToDockviewInstructions,
  type GraphBoardAddPanelInstruction,
  type GraphBoardSplitDirection,
} from '../../features/workbench/graphBoardLayout';
import { WorkbenchEmptyState } from './WorkbenchEmptyState';

type DockPanelParams = {
  panelId: string;
  role: PanelRole;
};

type WorkbenchDockviewContextValue = {
  panelsById: Map<string, PanelDef>;
  renderPanel: (panel: PanelDef) => React.ReactNode;
  mode: WorkbenchDockviewProps['mode'];
  variant: NonNullable<WorkbenchDockviewProps['variant']>;
  onRemovePanel?: (panelId: string) => boolean | void;
  onEditPanel?: (panelId: string) => void;
  onToggleSettings?: (panelId: string) => void;
  onRenamePanel?: (panelId: string, title: string) => void;
  onDuplicatePanel?: (panelId: string) => PanelDef | undefined;
  onSplitPanel?: (panelId: string) => PanelDef | undefined;
  getPanelCloseBehavior?: (panelId: string) => 'close' | 'delete';
  zone: WorkbenchZoneId;
  getPanelTitle: (panel: PanelDef) => string;
  onAddPanel?: (type: PanelType, zone?: WorkbenchZoneId) => PanelDef | undefined;
  onCreatePanel?: (groupId?: string) => PanelDef | undefined;
  requestClosePanel: (panelId: string) => void;
  requestAddPanel: (type: PanelType, groupId?: string) => void;
  requestCreatePanel: (groupId?: string) => void;
  requestDuplicatePanel: (panelId: string, groupId?: string) => void;
  requestSplitPanel: (panelId: string, groupId: string, direction: GraphBoardSplitDirection) => void;
};

interface WorkbenchDockviewProps {
  panels: readonly PanelDef[];
  zone: WorkbenchZoneId;
  mode: 'learner' | 'author' | 'sandbox';
  variant?: 'graph' | 'metrics';
  renderPanel: (panel: PanelDef) => React.ReactNode;
  layoutKey?: string;
  viewState?: DockviewViewState;
  onViewStateChange?: (viewState: DockviewViewState) => void;
  graphBoardLayout?: GraphBoardLayout;
  onGraphBoardLayoutChange?: (layout: GraphBoardLayout | undefined) => void;
  onRemovePanel?: (panelId: string) => boolean | void;
  onEditPanel?: (panelId: string) => void;
  onToggleSettings?: (panelId: string) => void;
  onRenamePanel?: (panelId: string, title: string) => void;
  onAddPanel?: (type: PanelType, zone?: WorkbenchZoneId) => PanelDef | undefined;
  onCreatePanel?: (groupId?: string) => PanelDef | undefined;
  onDuplicatePanel?: (panelId: string) => PanelDef | undefined;
  onSplitPanel?: (panelId: string) => PanelDef | undefined;
  getPanelCloseBehavior?: (panelId: string) => 'close' | 'delete';
  getPanelTitle?: (panel: PanelDef) => string;
  renderEmptyState?: () => React.ReactNode;
  splitAxis?: 'both' | 'horizontal-only';
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

const ADD_OPTIONS: Array<{ type: PanelType; label: string }> = [
  { type: 'PVLOOP', label: 'PV Loop' },
  { type: 'WAVEFORM', label: 'Waveforms' },
  { type: 'GUYTON_LEFT', label: 'Guyton (L)' },
  { type: 'GUYTON_RIGHT', label: 'Guyton (R)' },
];

const defaultPanelTitle = (panel: PanelDef) => panel.title;
const TAB_MENU_WIDTH = 144;
const TAB_MENU_ESTIMATED_HEIGHT = 128;
type MenuPosition = { x: number; y: number };
type PendingDirectSplit = { panelId: string; groupId: string; direction: GraphBoardSplitDirection };

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

function samePanelIdSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const rightIds = new Set(right);
  return left.every((id) => rightIds.has(id));
}

export function shouldReapplyDockviewLayout({
  livePanelIds,
  statePanelIds,
  layoutIdentityChanged,
  imperativePanelChangePending,
  forceGraphBoardLayout,
}: {
  livePanelIds: readonly string[];
  statePanelIds: readonly string[];
  layoutIdentityChanged: boolean;
  imperativePanelChangePending: boolean;
  forceGraphBoardLayout: boolean;
}): boolean {
  if (layoutIdentityChanged) return true;
  const panelIdsAlreadyMatch = samePanelIdSet(livePanelIds, statePanelIds);
  if (imperativePanelChangePending && panelIdsAlreadyMatch) return false;
  if (forceGraphBoardLayout) return true;
  return !panelIdsAlreadyMatch;
}

export function isDockviewHorizontalOnlyDropAllowed(position: string): boolean {
  return position !== 'top' && position !== 'bottom';
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

function orderedPanels(panels: readonly PanelDef[]): PanelDef[] {
  const sorted = [...panels].sort((a, b) => {
    const order: Record<PanelRole, number> = { graph: 0, control: 1, note: 2, output: 3 };
    return order[panelRole(a)] - order[panelRole(b)];
  });
  return sorted;
}

function addInstructionPosition(
  api: DockviewApi,
  instruction: GraphBoardAddPanelInstruction,
): Parameters<DockviewApi['addPanel']>[0]['position'] | undefined {
  if (instruction.placement === 'first') return undefined;
  const referenceGroup = instruction.referencePanelId ? api.getPanel(instruction.referencePanelId)?.group : undefined;
  if (!referenceGroup) return undefined;
  if (instruction.placement === 'within') return { referenceGroup, direction: 'within' } as const;
  return { referenceGroup, direction: instruction.direction === 'below' ? 'below' : 'right' } as const;
}

function applyInstructionSize(
  dockPanel: ReturnType<DockviewApi['addPanel']>,
  instruction: GraphBoardAddPanelInstruction,
  api: DockviewApi,
) {
  if (instruction.placement !== 'split' || !instruction.sizeRatio || instruction.sizeRatio <= 0) return;
  const referencePanel = instruction.referencePanelId ? api.getPanel(instruction.referencePanelId) : undefined;
  if (!referencePanel) return;
  const ratio = Math.max(0.05, Math.min(0.95, instruction.sizeRatio));
  if (instruction.direction === 'below') {
    const total = Math.max(1, (referencePanel.group.height ?? 0) + (dockPanel.group.height ?? 0));
    dockPanel.group.api.setSize({ height: total * ratio });
    return;
  }
  const total = Math.max(1, (referencePanel.group.width ?? 0) + (dockPanel.group.width ?? 0));
  dockPanel.group.api.setSize({ width: total * ratio });
}

function rebuildDockview(api: DockviewApi, panels: readonly PanelDef[], preferredGroupId?: string | null) {
  api.clear();
  const sorted = orderedPanels(panels);
  let firstGroup = undefined as ReturnType<DockviewApi['getGroup']>;
  for (const panel of sorted) {
    const dockPanel = addPanelToDockview(api, panel, preferredGroupId);
    firstGroup ??= dockPanel.group;
  }
  syncDockviewPanelMetadata(api, panels);
}

function rebuildDockviewFromGraphBoardLayout(
  api: DockviewApi,
  panels: readonly PanelDef[],
  graphBoardLayout?: GraphBoardLayout,
) {
  const instructions = graphBoardLayoutToDockviewInstructions(graphBoardLayout, panels);
  const panelById = new Map(panels.map((panel) => [panel.id, panel]));
  api.clear();
  for (const instruction of instructions) {
    const panel = panelById.get(instruction.panelId);
    if (!panel) continue;
    const dockPanel = addPanelToDockview(api, panel, undefined, addInstructionPosition(api, instruction));
    applyInstructionSize(dockPanel, instruction, api);
  }
  syncDockviewPanelMetadata(api, panels);
}

function restoreDockview(
  api: DockviewApi,
  panels: readonly PanelDef[],
  viewState?: DockviewViewState,
  zone?: WorkbenchZoneId,
  preferredGroupId?: string | null,
  pendingDirectSplit?: PendingDirectSplit | null,
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
        const splitReferenceGroup = pendingDirectSplit?.panelId === panel.id ? api.getGroup(pendingDirectSplit.groupId) : undefined;
        const position = splitReferenceGroup
          ? { referenceGroup: splitReferenceGroup, direction: pendingDirectSplit!.direction === 'below' ? 'below' : 'right' } as const
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
  pendingDirectSplit?: PendingDirectSplit | null,
  graphBoardLayout?: GraphBoardLayout,
  forceGraphBoardLayout?: boolean,
) {
  if (graphBoardLayout && forceGraphBoardLayout && !pendingDirectSplit) {
    rebuildDockviewFromGraphBoardLayout(api, panels, graphBoardLayout);
    return;
  }
  if (restoreDockview(api, panels, viewState, zone, preferredGroupId, pendingDirectSplit)) return;
  if (graphBoardLayout && !pendingDirectSplit) {
    rebuildDockviewFromGraphBoardLayout(api, panels, graphBoardLayout);
    return;
  }
  rebuildDockview(api, panels, preferredGroupId);
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

export function deriveGraphBoardLayoutChange(
  viewState: DockviewViewState,
  panelIds: readonly string[],
): GraphBoardLayout | undefined {
  return deriveGraphBoardLayoutFromDockviewState(viewState.state, panelIds);
}

function layoutSignature(layout: GraphBoardLayout | undefined): string {
  return layout ? JSON.stringify(layout) : '';
}

function WorkbenchDockPanel(props: IDockviewPanelProps<DockPanelParams>) {
  const { t } = useTranslation();
  const context = useContext(WorkbenchDockviewContext);
  const panel = context?.panelsById.get(props.params.panelId);
  if (!context || !panel) {
    return <div className="flex h-full items-center justify-center text-xs text-wb-subtle">{t('workbench.dockview.panelUnavailable')}</div>;
  }
  return <>{context.renderPanel(panel)}</>;
}

function WorkbenchDockTab(props: IDockviewPanelHeaderProps<DockPanelParams>) {
  const { t } = useTranslation();
  const context = useContext(WorkbenchDockviewContext);
  const [isActive, setIsActive] = useState(props.api.isActive);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
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

  const isMetricsHost = context?.variant === 'metrics';
  const canEdit = context?.mode !== 'learner' && Boolean(panel) && isMetricsHost && Boolean(context?.onEditPanel);
  const canConfigure = context?.mode !== 'learner' && Boolean(panel) && !isMetricsHost && panel?.type !== 'SCENARIOS' && Boolean(context?.onToggleSettings);
  const canRename = context?.mode !== 'learner' && Boolean(panel) && Boolean(context?.onRenamePanel);
  const canDuplicate = context?.mode !== 'learner' && Boolean(panel) && isMetricsHost && Boolean(context?.onDuplicatePanel);
  const canClose = context?.mode !== 'learner' && Boolean(panel) && Boolean(context?.onRemovePanel);
  const closeBehavior = panel && context ? (context.getPanelCloseBehavior?.(panel.id) ?? (isMetricsHost ? 'delete' : 'close')) : 'close';
  const canSplit = context?.mode !== 'learner' && context?.zone === 'main' && !isMetricsHost && Boolean(panel);
  const hasMenu = canEdit || canConfigure || canRename || canDuplicate || canClose || canSplit;

  useEffect(() => {
    if (canRename) return;
    setIsRenaming(false);
    setRenameDraft('');
  }, [canRename]);

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

  const beginRenamePanel = () => {
    if (!context?.onRenamePanel) return;
    setMenuPosition(null);
    setIsRenaming(true);
    setRenameDraft(title);
  };

  const commitRenamePanel = () => {
    if (!context?.onRenamePanel) return;
    const trimmedTitle = renameDraft.trim();
    if (trimmedTitle && trimmedTitle !== title) {
      context.onRenamePanel(props.params.panelId, trimmedTitle);
    }
    setIsRenaming(false);
    setRenameDraft('');
  };

  const cancelRenamePanel = () => {
    setIsRenaming(false);
    setRenameDraft('');
  };

  return (
    <div
      className={`workbench-dock-tab flex h-full min-w-0 items-center justify-between gap-2 px-2.5 text-xs font-semibold ${isActive ? 'text-wb-text' : 'text-wb-subtle'}`}
      onClick={() => props.api.setActive()}
      onDoubleClick={() => {
        if (!isRenaming && canRename) beginRenamePanel();
      }}
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
      {isRenaming ? (
        <input
          type="text"
          value={renameDraft}
          autoFocus
          onFocus={(event) => event.currentTarget.select()}
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
          onBlur={commitRenamePanel}
          onChange={(event) => setRenameDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitRenamePanel();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              cancelRenamePanel();
            }
          }}
          className="h-6 min-w-0 flex-1 rounded border border-wb-accent bg-wb-input px-1.5 text-xs font-semibold text-wb-text outline-none focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
          aria-label={t('common.rename')}
        />
      ) : (
        <span className="min-w-0 flex-1 truncate">{title}</span>
      )}
      <div
        className="workbench-dock-tab-actions relative flex h-5 shrink-0 items-center justify-center gap-0.5"
        onDoubleClick={(event) => event.stopPropagation()}
      >
        {canClose && (
          <button
            type="button"
            draggable={false}
            onClick={(event) => {
              event.stopPropagation();
              context?.requestClosePanel(props.params.panelId);
              setMenuPosition(null);
            }}
            className="workbench-dock-tab-close-button inline-flex h-5 w-5 items-center justify-center rounded text-wb-muted hover:bg-wb-hover hover:text-wb-danger focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
            aria-label={t('workbench.panelGrid.closePanelAria', { title })}
            title={t('workbench.panelGrid.closePanelAria', { title })}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
        {hasMenu && (
          <>
            <button
              type="button"
              draggable={false}
              onClick={(event) => {
                event.stopPropagation();
                const rect = event.currentTarget.getBoundingClientRect();
                setMenuPosition((value) => (
                  value
                    ? null
                    : getMenuPositionNearPoint({ x: rect.right - TAB_MENU_WIDTH, y: rect.bottom + 4 })
                ));
              }}
              className={`workbench-dock-tab-menu-button inline-flex h-5 w-5 items-center justify-center rounded text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent ${
                menuPosition ? 'opacity-100' : ''
              }`}
              aria-label={t('workbench.dockview.paneMenuAria', { title })}
              aria-haspopup="menu"
              aria-expanded={Boolean(menuPosition)}
              title={t('workbench.dockview.paneMenu')}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
            {menuPosition && typeof document !== 'undefined' && createPortal(
              <>
                <div className="fixed inset-0 z-[80]" onClick={() => setMenuPosition(null)} />
                <div
                  role="menu"
                  className="workbench-popover-menu fixed z-[90] w-40 rounded-md border py-1 shadow-xl"
                  style={{ left: menuPosition.x, top: menuPosition.y }}
                >
                  {canEdit && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        context?.onEditPanel?.(props.params.panelId);
                        setMenuPosition(null);
                      }}
                      role="menuitem"
                      className="workbench-popover-menu-item flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t('common.edit')}</span>
                    </button>
                  )}
                  {canRename && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        beginRenamePanel();
                      }}
                      role="menuitem"
                      className="workbench-popover-menu-item block w-full px-3 py-1.5 text-left text-xs font-medium"
                    >
                      {t('common.rename')}
                    </button>
                  )}
                  {canDuplicate && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        context?.requestDuplicatePanel(props.params.panelId, props.api.group.id);
                        setMenuPosition(null);
                      }}
                      role="menuitem"
                      className="workbench-popover-menu-item flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium"
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t('workbench.viewManagement.duplicate')}</span>
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
                      {t('workbench.panelGrid.paneSettings')}
                    </button>
                  )}
                  {canSplit && panel && (
                    <>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          context?.requestSplitPanel(panel.id, props.api.group.id, 'right');
                          setMenuPosition(null);
                        }}
                        role="menuitem"
                        className="workbench-popover-menu-item flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium"
                      >
                        <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t('workbench.dockview.splitRight')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          context?.requestSplitPanel(panel.id, props.api.group.id, 'below');
                          setMenuPosition(null);
                        }}
                        role="menuitem"
                        className="workbench-popover-menu-item flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium"
                      >
                        <Rows2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t('workbench.dockview.splitDown')}</span>
                      </button>
                    </>
                  )}
                  {canClose && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        context?.requestClosePanel(props.params.panelId);
                        setMenuPosition(null);
                      }}
                      role="menuitem"
                      className="workbench-popover-menu-item-danger flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium"
                    >
                      {isMetricsHost && closeBehavior === 'delete' && <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
                      <span>{isMetricsHost && closeBehavior === 'delete' ? t('common.delete') : t('workbench.dockview.closePane')}</span>
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
  buttonClassName,
  iconClassName = 'h-3.5 w-3.5',
  label,
}: {
  zone: WorkbenchZoneId;
  onChoose: (type: PanelType) => void;
  buttonClassName?: string;
  iconClassName?: string;
  label?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const options = ADD_OPTIONS;

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
        className={buttonClassName ?? 'inline-flex h-5 w-5 items-center justify-center rounded text-wb-subtle hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent'}
        aria-label={t('workbench.dockview.addPaneAria', { zone: t(`workbench.zones.${zone}`) })}
        title={t('workbench.dockview.addPaneAria', { zone: t(`workbench.zones.${zone}`) })}
      >
        <Plus className={iconClassName} />
        {label}
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
                {t(`workbench.panelTypes.${option.type}`)}
              </button>
            ))}
          </div>
        </>
      , document.body)}
    </div>
  );
}

function WorkbenchDockHeaderLeftActions(props: IDockviewHeaderActionsProps) {
  const { t } = useTranslation();
  const context = useContext(WorkbenchDockviewContext);
  if (!context || context.mode === 'learner') return null;

  return (
    <div className="workbench-dock-header-actions flex h-full items-center">
      {context.variant === 'metrics' && context.onCreatePanel && (
        <button
          type="button"
          onClick={() => context.requestCreatePanel(props.group.id)}
          className="inline-flex h-5 w-5 items-center justify-center rounded text-wb-subtle hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
          aria-label={t('workbench.viewManagement.newMetrics')}
          title={t('workbench.viewManagement.newMetrics')}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
      {context.variant === 'graph' && context.onAddPanel && (
        <ZoneAddMenu
          zone={context.zone}
          onChoose={(type) => context.requestAddPanel(type, props.group.id)}
        />
      )}
    </div>
  );
}

function WorkbenchDockHeaderRightActions(props: IDockviewHeaderActionsProps) {
  const { t } = useTranslation();
  const context = useContext(WorkbenchDockviewContext);
  if (!context || context.mode === 'learner') return null;
  const activePanelId = props.activePanel?.id;
  const activePanel = activePanelId ? context.panelsById.get(activePanelId) : undefined;
  const canSplit = Boolean(activePanel) && (
    (context.variant === 'graph' && context.zone === 'main') ||
    (context.variant === 'metrics' && Boolean(context.onSplitPanel))
  );

  return (
    <div className="workbench-dock-header-actions flex h-full items-center">
      {canSplit && activePanelId && (
        <button
          type="button"
          draggable={false}
          onClick={() => context.requestSplitPanel(activePanelId, props.group.id, 'right')}
          className="inline-flex h-5 w-5 items-center justify-center rounded text-wb-subtle hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
          aria-label={t('workbench.dockview.splitRight')}
          title={t('workbench.dockview.splitRight')}
        >
          <Columns2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function EmptyDockview({
  zone,
  mode,
  onAddPanel,
  renderEmptyState,
}: Pick<WorkbenchDockviewProps, 'zone' | 'mode' | 'onAddPanel' | 'renderEmptyState'>) {
  const { t } = useTranslation();
  if (renderEmptyState) return <>{renderEmptyState()}</>;
  const canAdd = mode !== 'learner' && Boolean(onAddPanel);
  return (
    <div className="relative h-full bg-wb-aux">
      <WorkbenchEmptyState
        description={t('workbench.dockview.noPanels')}
        primaryAction={canAdd ? {
          label: t('workbench.dockview.addPane'),
          onClick: () => onAddPanel?.('PVLOOP', zone),
          icon: <Plus className="h-3.5 w-3.5" />,
          ariaLabel: t('workbench.dockview.addPaneAria', { zone: t(`workbench.zones.${zone}`) }),
        } : undefined}
      />
    </div>
  );
}

function StaticDockviewFallback({
  panels,
  renderPanel,
  zone,
  mode,
  onAddPanel,
  renderEmptyState,
}: Pick<WorkbenchDockviewProps, 'panels' | 'renderPanel' | 'zone' | 'mode' | 'onAddPanel' | 'renderEmptyState'>) {
  if (panels.length === 0) return <EmptyDockview zone={zone} mode={mode} onAddPanel={onAddPanel} renderEmptyState={renderEmptyState} />;
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-2">
      {panels.map((panel) => (
        <div key={panel.id} className="min-h-0 overflow-hidden border-r border-wb-line bg-wb-aux last:border-r-0">
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
  variant = 'graph',
  renderPanel,
  layoutKey = 'default',
  viewState,
  onViewStateChange,
  graphBoardLayout,
  onGraphBoardLayoutChange,
  onRemovePanel,
  onEditPanel,
  onToggleSettings,
  onRenamePanel,
  onAddPanel,
  onCreatePanel,
  onDuplicatePanel,
  onSplitPanel,
  getPanelCloseBehavior,
  getPanelTitle = defaultPanelTitle,
  renderEmptyState,
  splitAxis = 'both',
  className = '',
}: WorkbenchDockviewProps) {
  const apiRef = useRef<DockviewApi | null>(null);
  const pendingAddGroupIdRef = useRef<string | null>(null);
  const pendingDirectSplitRef = useRef<PendingDirectSplit | null>(null);
  const pendingImperativePanelChangeRef = useRef(false);
  const layoutSubscriptionRef = useRef<{ dispose: () => void } | null>(null);
  const didApplyInitialLayoutRef = useRef(false);
  const lastLayoutKeyRef = useRef(layoutKey);
  const lastZoneRef = useRef(zone);
  const lastEmittedGraphBoardLayoutRef = useRef('');
  const suppressChangeRef = useRef(false);
  const pendingEmitRef = useRef<number | null>(null);
  const onViewStateChangeRef = useRef(onViewStateChange);
  const onGraphBoardLayoutChangeRef = useRef(onGraphBoardLayoutChange);
  const panelsRef = useRef(panels);
  const dockviewRootRef = useRef<HTMLDivElement | null>(null);
  const structureSignature = useMemo(() => getDockviewStructureSignature(panels), [panels]);
  const lastStructureSignatureRef = useRef(structureSignature);
  const metadataSignature = useMemo(() => getDockviewMetadataSignature(panels), [panels]);
  const graphBoardLayoutSignature = useMemo(() => layoutSignature(graphBoardLayout), [graphBoardLayout]);
  const panelsById = useMemo(() => new Map(panels.map((panel) => [panel.id, panel])), [panels]);
  const contextValue = useMemo<WorkbenchDockviewContextValue>(
    () => ({
      panelsById,
      renderPanel,
      mode,
      variant,
      onRemovePanel,
      onEditPanel,
      onToggleSettings,
      onRenamePanel,
      onDuplicatePanel,
      onSplitPanel,
      getPanelCloseBehavior,
      zone,
      getPanelTitle,
      onAddPanel,
      onCreatePanel,
      requestClosePanel: (panelId) => {
        if (variant === 'metrics') {
          const shouldClose = onRemovePanel?.(panelId);
          if (shouldClose === false) return;
          const dockPanel = apiRef.current?.getPanel(panelId);
          if (dockPanel) {
            pendingImperativePanelChangeRef.current = true;
            dockPanel.api.close();
          }
          return;
        }
        const dockPanel = apiRef.current?.getPanel(panelId);
        if (dockPanel) {
          pendingImperativePanelChangeRef.current = true;
          dockPanel.api.close();
        }
        onRemovePanel?.(panelId);
      },
      requestAddPanel: (type, groupId) => {
        pendingDirectSplitRef.current = null;
        const api = apiRef.current;
        const referenceGroup = groupId ? api?.getGroup(groupId) : undefined;
        const newPanel = onAddPanel?.(type, zone);
        if (!api || !referenceGroup || !newPanel) {
          pendingAddGroupIdRef.current = groupId ?? null;
          return;
        }
        pendingAddGroupIdRef.current = groupId ?? null;
        pendingImperativePanelChangeRef.current = true;
        addPanelToDockview(api, newPanel, undefined, {
          referenceGroup: referenceGroup as DockviewGroupPanel,
          direction: 'within',
        });
        syncDockviewPanelMetadata(api, [...panelsRef.current, newPanel]);
      },
      requestCreatePanel: (groupId) => {
        pendingDirectSplitRef.current = null;
        const api = apiRef.current;
        const referenceGroup = groupId ? api?.getGroup(groupId) : undefined;
        const newPanel = onCreatePanel?.(groupId);
        if (!api || !referenceGroup || !newPanel) {
          pendingAddGroupIdRef.current = groupId ?? null;
          return;
        }
        pendingAddGroupIdRef.current = groupId ?? null;
        pendingImperativePanelChangeRef.current = true;
        addPanelToDockview(api, newPanel, undefined, {
          referenceGroup: referenceGroup as DockviewGroupPanel,
          direction: 'within',
        });
        syncDockviewPanelMetadata(api, [...panelsRef.current, newPanel]);
      },
      requestDuplicatePanel: (panelId, groupId) => {
        const api = apiRef.current;
        const referenceGroup = groupId ? api?.getGroup(groupId) : undefined;
        const newPanel = onDuplicatePanel?.(panelId);
        if (!api || !referenceGroup || !newPanel) return;
        pendingAddGroupIdRef.current = groupId ?? null;
        pendingDirectSplitRef.current = null;
        pendingImperativePanelChangeRef.current = true;
        addPanelToDockview(api, newPanel, undefined, {
          referenceGroup: referenceGroup as DockviewGroupPanel,
          direction: 'within',
        });
        syncDockviewPanelMetadata(api, [...panelsRef.current, newPanel]);
      },
      requestSplitPanel: (panelId, groupId, direction) => {
        const api = apiRef.current;
        const referenceGroup = api?.getGroup(groupId);
        const newPanel = (onSplitPanel ?? onDuplicatePanel)?.(panelId);
        if (!api || !referenceGroup || !newPanel) return;
        pendingAddGroupIdRef.current = null;
        pendingDirectSplitRef.current = { panelId: newPanel.id, groupId, direction };
        pendingImperativePanelChangeRef.current = true;
        addPanelToDockview(api, newPanel, undefined, {
          referenceGroup: referenceGroup as DockviewGroupPanel,
          direction: direction === 'below' ? 'below' : 'right',
        });
        syncDockviewPanelMetadata(api, [...panelsRef.current, newPanel]);
      },
    }),
    [getPanelCloseBehavior, getPanelTitle, mode, onAddPanel, onCreatePanel, onDuplicatePanel, onEditPanel, onRemovePanel, onRenamePanel, onSplitPanel, onToggleSettings, panelsById, renderPanel, variant, zone],
  );
  const components = useMemo(() => ({ 'workbench-panel': WorkbenchDockPanel }), []);
  useEffect(() => {
    onViewStateChangeRef.current = onViewStateChange;
  }, [onViewStateChange]);

  useEffect(() => {
    onGraphBoardLayoutChangeRef.current = onGraphBoardLayoutChange;
  }, [onGraphBoardLayoutChange]);

  useEffect(() => {
    panelsRef.current = panels;
  }, [panels]);

  useEffect(() => () => {
    layoutSubscriptionRef.current?.dispose();
    if (pendingEmitRef.current !== null) window.clearTimeout(pendingEmitRef.current);
  }, []);

  useEffect(() => {
    const root = dockviewRootRef.current;
    if (!root || typeof window === 'undefined') return;
    let pendingOverlayFrame: number | null = null;
    const clearInsertionIndicators = () => {
      if (pendingOverlayFrame !== null) {
        window.cancelAnimationFrame(pendingOverlayFrame);
        pendingOverlayFrame = null;
      }
      root.querySelectorAll<HTMLElement>('.wb-tab-insertion-target').forEach((node) => {
        node.classList.remove('wb-tab-insertion-target');
        node.style.removeProperty('--wb-tab-insertion-x');
      });
      root.querySelectorAll<HTMLElement>('.wb-tab-drop-target-overlay').forEach((node) => {
        node.classList.remove('wb-tab-drop-target-overlay');
      });
    };
    const startDragging = () => root.classList.add('wb-tab-dragging');
    const stopDragging = () => {
      root.classList.remove('wb-tab-dragging');
      clearInsertionIndicators();
    };
    const headerAtPoint = (event: DragEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const targetHeader = target?.closest('.dv-tabs-and-actions-container') as HTMLElement | null;
      if (targetHeader && root.contains(targetHeader)) return targetHeader;

      for (const header of Array.from(root.querySelectorAll<HTMLElement>('.dv-tabs-and-actions-container'))) {
        const rect = header.getBoundingClientRect();
        if (
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
        ) {
          return header;
        }
      }
      return null;
    };
    const updateDockviewHeaderOverlayScope = (header: HTMLElement) => {
      const headerRect = header.getBoundingClientRect();
      root.querySelectorAll<HTMLElement>('.dv-drop-target-anchor').forEach((overlay) => {
        const rect = overlay.getBoundingClientRect();
        const targetsHeader =
          rect.width > 0 &&
          rect.height > 0 &&
          rect.left < headerRect.right &&
          rect.right > headerRect.left &&
          rect.top < headerRect.bottom &&
          rect.bottom > headerRect.top;
        overlay.classList.toggle('wb-tab-drop-target-overlay', targetsHeader);
      });
    };
    const scheduleDockviewHeaderOverlayScopeUpdate = (header: HTMLElement) => {
      if (pendingOverlayFrame !== null) window.cancelAnimationFrame(pendingOverlayFrame);
      pendingOverlayFrame = window.requestAnimationFrame(() => {
        pendingOverlayFrame = null;
        updateDockviewHeaderOverlayScope(header);
      });
    };
    const updateInsertionIndicator = (event: DragEvent) => {
      if (!root.classList.contains('wb-tab-dragging')) return;
      const header = headerAtPoint(event);
      if (!header) {
        clearInsertionIndicators();
        return;
      }
      const tabsContainer = header.querySelector<HTMLElement>('.dv-tabs-container');
      if (!tabsContainer) {
        clearInsertionIndicators();
        return;
      }
      const headerRect = header.getBoundingClientRect();
      const tabs = Array.from(tabsContainer.querySelectorAll<HTMLElement>('.dv-tab:not(.dv-tab--dragging)'))
        .filter((tab) => tab.offsetParent !== null);
      let insertionClientX = tabs.length > 0 ? tabs[0].getBoundingClientRect().left : tabsContainer.getBoundingClientRect().left;
      for (const tab of tabs) {
        const rect = tab.getBoundingClientRect();
        if (event.clientX < rect.left + rect.width / 2) {
          insertionClientX = rect.left;
          break;
        }
        insertionClientX = rect.right;
      }
      const insertionX = Math.round(Math.max(0, Math.min(insertionClientX - headerRect.left, Math.max(0, headerRect.width - 2))));
      root.querySelectorAll<HTMLElement>('.wb-tab-insertion-target').forEach((node) => {
        if (node === header) return;
        node.classList.remove('wb-tab-insertion-target');
        node.style.removeProperty('--wb-tab-insertion-x');
      });
      header.classList.add('wb-tab-insertion-target');
      header.style.setProperty('--wb-tab-insertion-x', `${insertionX}px`);
      scheduleDockviewHeaderOverlayScopeUpdate(header);
    };
    const leaveRoot = (event: DragEvent) => {
      const relatedTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;
      if (!relatedTarget || !root.contains(relatedTarget)) clearInsertionIndicators();
    };
    root.addEventListener('dragstart', startDragging, true);
    root.addEventListener('dragover', updateInsertionIndicator, true);
    root.addEventListener('dragleave', leaveRoot, true);
    root.addEventListener('dragend', stopDragging, true);
    window.addEventListener('dragend', stopDragging, true);
    window.addEventListener('drop', stopDragging, true);
    return () => {
      root.removeEventListener('dragstart', startDragging, true);
      root.removeEventListener('dragover', updateInsertionIndicator, true);
      root.removeEventListener('dragleave', leaveRoot, true);
      root.removeEventListener('dragend', stopDragging, true);
      window.removeEventListener('dragend', stopDragging, true);
      window.removeEventListener('drop', stopDragging, true);
      stopDragging();
    };
  }, [panels.length]);

  const scheduleViewStateEmit = (api: DockviewApi) => {
    if ((!onViewStateChangeRef.current && !onGraphBoardLayoutChangeRef.current) || suppressChangeRef.current) return;
    if (pendingEmitRef.current !== null) window.clearTimeout(pendingEmitRef.current);
    pendingEmitRef.current = window.setTimeout(() => {
      pendingEmitRef.current = null;
      if (suppressChangeRef.current) return;
      const nextViewState = captureDockviewViewState(api, zone);
      const nextGraphBoardLayout = deriveGraphBoardLayoutChange(nextViewState, panelsRef.current.map((panel) => panel.id));
      onViewStateChangeRef.current?.(nextViewState);
      if (nextGraphBoardLayout) {
        lastEmittedGraphBoardLayoutRef.current = layoutSignature(nextGraphBoardLayout);
        onGraphBoardLayoutChangeRef.current?.(nextGraphBoardLayout);
      }
    }, 150);
  };

  const applyLayoutWithoutEmitting = (api: DockviewApi) => {
    suppressChangeRef.current = true;
    const layoutIdentityChanged = lastLayoutKeyRef.current !== layoutKey || lastZoneRef.current !== zone;
    if (layoutIdentityChanged) {
      didApplyInitialLayoutRef.current = false;
      lastLayoutKeyRef.current = layoutKey;
      lastZoneRef.current = zone;
    }
    const structureChanged = lastStructureSignatureRef.current !== structureSignature;
    const forceGraphBoardLayout = didApplyInitialLayoutRef.current
      && !structureChanged
      && graphBoardLayoutSignature.length > 0
      && graphBoardLayoutSignature !== lastEmittedGraphBoardLayoutRef.current;
    const shouldReapply = shouldReapplyDockviewLayout({
      livePanelIds: api.panels.map((panel) => panel.id),
      statePanelIds: panels.map((panel) => panel.id),
      layoutIdentityChanged,
      imperativePanelChangePending: pendingImperativePanelChangeRef.current || Boolean(pendingDirectSplitRef.current),
      forceGraphBoardLayout,
    });
    if (!shouldReapply) {
      syncDockviewPanelMetadata(api, panels);
      didApplyInitialLayoutRef.current = true;
      lastStructureSignatureRef.current = structureSignature;
      pendingAddGroupIdRef.current = null;
      pendingDirectSplitRef.current = null;
      pendingImperativePanelChangeRef.current = false;
      window.queueMicrotask(() => {
        suppressChangeRef.current = false;
      });
      return;
    }
    applyDockviewLayout(
      api,
      panels,
      viewState,
      zone,
      pendingAddGroupIdRef.current,
      pendingDirectSplitRef.current,
      graphBoardLayout,
      forceGraphBoardLayout,
    );
    didApplyInitialLayoutRef.current = true;
    lastStructureSignatureRef.current = structureSignature;
    pendingAddGroupIdRef.current = null;
    pendingDirectSplitRef.current = null;
    pendingImperativePanelChangeRef.current = false;
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
  }, [structureSignature, layoutKey, zone, graphBoardLayoutSignature]);

  useEffect(() => {
    if (!apiRef.current) return;
    syncDockviewPanelMetadata(apiRef.current, panels);
  }, [metadataSignature, panels]);

  if (typeof window === 'undefined') {
    return <StaticDockviewFallback panels={panels} renderPanel={renderPanel} zone={zone} mode={mode} onAddPanel={onAddPanel} renderEmptyState={renderEmptyState} />;
  }

  const isLearnerMode = mode === 'learner';

  if (panels.length === 0) {
    return (
      <div ref={dockviewRootRef} className={`dockview-theme-dark h-full min-h-0 overflow-hidden ${className}`}>
        <EmptyDockview zone={zone} mode={mode} onAddPanel={onAddPanel} renderEmptyState={renderEmptyState} />
      </div>
    );
  }

  return (
    <WorkbenchDockviewContext.Provider value={contextValue}>
      <div ref={dockviewRootRef} className={`dockview-theme-dark h-full min-h-0 overflow-hidden ${className}`}>
        <DockviewReact
          components={components}
          defaultTabComponent={WorkbenchDockTab}
          leftHeaderActionsComponent={WorkbenchDockHeaderLeftActions}
          rightHeaderActionsComponent={WorkbenchDockHeaderRightActions}
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
            const layoutChangeSubscription = event.api.onDidLayoutChange(() => scheduleViewStateEmit(event.api));
            const horizontalOverlaySubscription = splitAxis === 'horizontal-only'
              ? event.api.onWillShowOverlay((overlayEvent) => {
                  if (!isDockviewHorizontalOnlyDropAllowed(overlayEvent.position)) overlayEvent.preventDefault();
                })
              : undefined;
            const horizontalDropSubscription = splitAxis === 'horizontal-only'
              ? event.api.onWillDrop((dropEvent) => {
                  if (!isDockviewHorizontalOnlyDropAllowed(dropEvent.position)) dropEvent.preventDefault();
                })
              : undefined;
            layoutSubscriptionRef.current = {
              dispose: () => {
                layoutChangeSubscription.dispose();
                horizontalOverlaySubscription?.dispose();
                horizontalDropSubscription?.dispose();
              },
            };
          }}
        />
      </div>
    </WorkbenchDockviewContext.Provider>
  );
}

export default WorkbenchDockview;
