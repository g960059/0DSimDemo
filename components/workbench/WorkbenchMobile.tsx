import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, BarChart3, ChevronDown, ChevronUp, SlidersHorizontal, StickyNote } from 'lucide-react';
import type { PanelDef } from '../../types';
import { ErrorBoundary } from '../ErrorBoundary';

export type WorkbenchPanelRole = 'graph' | 'output' | 'control' | 'note';

export type MobilePanelDef = PanelDef & {
  role?: WorkbenchPanelRole;
};

type RenderContext = {
  role: WorkbenchPanelRole;
  isActive: boolean;
};

export interface WorkbenchMobileProps {
  panels: readonly MobilePanelDef[];
  renderPanel: (panel: MobilePanelDef, context: RenderContext) => React.ReactNode;
  className?: string;
  title?: string;
  activeGraphId?: string;
  onActiveGraphChange?: (panelId: string) => void;
  activeNoteId?: string;
  onActiveNoteChange?: (panelId: string) => void;
  controlsOpen?: boolean;
  onControlsOpenChange?: (open: boolean) => void;
  emptyState?: React.ReactNode;
}

type PanelGroups = Record<WorkbenchPanelRole, MobilePanelDef[]>;

function inferRole(panel: MobilePanelDef): WorkbenchPanelRole {
  if (panel.role) return panel.role;
  if (panel.type === 'METRICS') return 'output';
  if (panel.type === 'CONTROLS') return 'control';
  if (panel.type === 'NOTE') return 'note';
  return 'graph';
}

function groupPanels(panels: readonly MobilePanelDef[]): PanelGroups {
  return panels.reduce<PanelGroups>(
    (groups, panel) => {
      groups[inferRole(panel)].push(panel);
      return groups;
    },
    {
      graph: [],
      output: [],
      control: [],
      note: [],
    },
  );
}

function pickActivePanel(
  panels: readonly MobilePanelDef[],
  requestedId: string | undefined,
): MobilePanelDef | undefined {
  return panels.find((panel) => panel.id === requestedId) ?? panels[0];
}

function MobilePaneBoundary({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <ErrorBoundary fallback={<div className="p-3 text-xs text-rose-200">{t('workbench.mobile.panelRenderError')}</div>}>
      {children}
    </ErrorBoundary>
  );
}

export function WorkbenchMobile({
  panels,
  renderPanel,
  className = '',
  title = 'Workbench',
  activeGraphId,
  onActiveGraphChange,
  activeNoteId,
  onActiveNoteChange,
  controlsOpen,
  onControlsOpenChange,
  emptyState,
}: WorkbenchMobileProps) {
  const { t } = useTranslation();
  const groups = useMemo(() => groupPanels(panels), [panels]);
  const [internalGraphId, setInternalGraphId] = useState<string | undefined>(groups.graph[0]?.id);
  const [internalNoteId, setInternalNoteId] = useState<string | undefined>(groups.note[0]?.id);
  const [internalControlsOpen, setInternalControlsOpen] = useState(false);

  const selectedGraphId = activeGraphId ?? internalGraphId;
  const selectedNoteId = activeNoteId ?? internalNoteId;
  const activeGraph = pickActivePanel(groups.graph, selectedGraphId);
  const activeNote = pickActivePanel(groups.note, selectedNoteId);
  const isControlsOpen = controlsOpen ?? internalControlsOpen;
  const hasPanels = panels.length > 0;

  useEffect(() => {
    if (!activeGraph && groups.graph[0]) {
      setInternalGraphId(groups.graph[0].id);
      onActiveGraphChange?.(groups.graph[0].id);
    }
  }, [activeGraph, groups.graph, onActiveGraphChange]);

  useEffect(() => {
    if (!activeNote && groups.note[0]) {
      setInternalNoteId(groups.note[0].id);
      onActiveNoteChange?.(groups.note[0].id);
    }
  }, [activeNote, groups.note, onActiveNoteChange]);

  const setActiveGraph = (panelId: string) => {
    setInternalGraphId(panelId);
    onActiveGraphChange?.(panelId);
  };

  const setActiveNote = (panelId: string) => {
    setInternalNoteId(panelId);
    onActiveNoteChange?.(panelId);
  };

  const setControlsOpen = (open: boolean) => {
    setInternalControlsOpen(open);
    onControlsOpenChange?.(open);
  };

  return (
    <section
      className={`relative flex min-h-dvh flex-col overflow-hidden bg-wb-panel text-wb-text ${className}`}
      style={{ touchAction: 'pan-y' }}
      aria-label={title}
    >
      <div className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between border-b border-wb-line bg-wb-panel px-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <Activity className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
          <h1 className="truncate text-sm font-semibold text-wb-text">{title}</h1>
        </div>
        {groups.control.length > 0 && (
          <button
            type="button"
            onClick={() => setControlsOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-wb-line bg-wb-panel text-wb-text active:bg-wb-active"
            aria-label={t('workbench.mobile.openControls')}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="sticky top-12 z-20 border-b border-wb-line bg-wb-panel px-3 py-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {groups.output.length > 0 ? (
            groups.output.map((panel) => (
              <div
                key={panel.id}
                className="min-w-[11rem] flex-1 rounded-md border border-wb-line bg-wb-strip p-2"
              >
                <div className="mb-1 truncate text-[11px] font-medium text-wb-muted">
                  {panel.title}
                </div>
                <div className="min-h-16">
                  <MobilePaneBoundary>
                    {renderPanel(panel, { role: 'output', isActive: true })}
                  </MobilePaneBoundary>
                </div>
              </div>
            ))
          ) : (
            <div className="min-h-16 w-full rounded-md border border-dashed border-wb-line bg-wb-strip p-3 text-xs text-wb-subtle">
              {t('workbench.mobile.noOutputPanel')}
            </div>
          )}
        </div>
      </div>

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-28 pt-3">
        {!hasPanels && (
          <div className="flex min-h-64 items-center justify-center rounded-md border border-dashed border-wb-line bg-wb-strip p-4 text-sm text-wb-muted">
            {emptyState ?? t('workbench.mobile.noPanelsAvailable')}
          </div>
        )}

        {groups.graph.length > 0 && (
          <section aria-label={t('workbench.mobile.charts')} className="flex min-h-[24rem] flex-col">
            <div className="mb-2 flex gap-1 overflow-x-auto rounded-md border border-wb-line bg-wb-panel p-1">
              {groups.graph.map((panel) => {
                const isActive = activeGraph?.id === panel.id;
                return (
                  <button
                    key={panel.id}
                    type="button"
                    onClick={() => setActiveGraph(panel.id)}
                    className={`inline-flex min-w-28 flex-1 items-center justify-center gap-1.5 rounded px-3 py-2 text-xs font-semibold ${
                      isActive
                        ? 'bg-wb-active text-wb-text'
                        : 'text-wb-muted active:bg-wb-active'
                    }`}
                    aria-pressed={isActive}
                  >
                    <BarChart3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{panel.title}</span>
                  </button>
                );
              })}
            </div>

            {activeGraph && (
              <div className="min-h-[20rem] flex-1 overflow-hidden rounded-md border border-wb-line bg-wb-panel">
                <MobilePaneBoundary>
                  {renderPanel(activeGraph, { role: 'graph', isActive: true })}
                </MobilePaneBoundary>
              </div>
            )}
          </section>
        )}

        {groups.note.length > 0 && (
          <section aria-label={t('workbench.mobile.notes')} className="mt-4">
            <div className="mb-2 flex gap-1 overflow-x-auto rounded-md border border-wb-line bg-wb-panel p-1">
              {groups.note.map((panel) => {
                const isActive = activeNote?.id === panel.id;
                return (
                  <button
                    key={panel.id}
                    type="button"
                    onClick={() => setActiveNote(panel.id)}
                    className={`inline-flex min-w-24 flex-1 items-center justify-center gap-1.5 rounded px-3 py-2 text-xs font-semibold ${
                      isActive
                        ? 'bg-wb-active text-wb-text'
                        : 'text-wb-muted active:bg-wb-active'
                    }`}
                    aria-pressed={isActive}
                  >
                    <StickyNote className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{panel.title}</span>
                  </button>
                );
              })}
            </div>

            {activeNote && (
              <div className="min-h-56 overflow-hidden rounded-md border border-wb-line bg-wb-panel">
                <MobilePaneBoundary>
                  {renderPanel(activeNote, { role: 'note', isActive: true })}
                </MobilePaneBoundary>
              </div>
            )}
          </section>
        )}
      </main>

      {groups.control.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3">
          <div className="pointer-events-auto w-full max-w-xl overflow-hidden rounded-t-md border border-wb-line bg-wb-panel shadow-2xl">
            <button
              type="button"
              onClick={() => setControlsOpen(!isControlsOpen)}
              className="flex h-12 w-full items-center justify-between bg-wb-panel px-3 text-left text-sm font-semibold text-wb-text active:bg-wb-active"
              aria-expanded={isControlsOpen}
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-wb-accent" aria-hidden="true" />
                <span className="truncate">{t('workbench.panels.controls')}</span>
              </span>
              {isControlsOpen ? (
                <ChevronDown className="h-4 w-4 text-wb-muted" aria-hidden="true" />
              ) : (
                <ChevronUp className="h-4 w-4 text-wb-muted" aria-hidden="true" />
              )}
            </button>

            {isControlsOpen && (
              <div className="max-h-[70dvh] overflow-y-auto border-t border-wb-line p-3">
                {groups.control.map((panel) => (
                  <div key={panel.id} className="mb-3 last:mb-0">
                    <MobilePaneBoundary>
                      {renderPanel(panel, { role: 'control', isActive: true })}
                    </MobilePaneBoundary>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default WorkbenchMobile;
