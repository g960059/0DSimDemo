import React from 'react';
import { createPortal } from 'react-dom';
import { Check, LoaderCircle, MoreVertical, Plus, TriangleAlert } from 'lucide-react';
import { OFFICIAL_BASELINES } from '../../engine/caseBaselines';
import type { SteadyUpdateStatus, SteadyUpdateStatusMap } from '../../engine/previewController';
import type { SimInstance } from '../../types';

interface ScenarioPaneProps {
  instances: SimInstance[];
  addInstance: (sourceId?: string, presetId?: string) => void;
  removeInstance: (id: string) => void;
  updateInstanceName: (id: string, name: string) => void;
  updateInstanceColor: (id: string, color: string) => void;
  steadyUpdateStatuses?: SteadyUpdateStatusMap;
}

const scenarioPresets = Object.entries(OFFICIAL_BASELINES).map(([id, preset]) => ({
  id,
  label: preset.label.replace(/\s*\([^)]*\)\s*$/, ''),
  detail: preset.label,
}));

function SteadyStatusIndicator({ status }: { status?: SteadyUpdateStatus }) {
  if (!status) return null;
  if (status === 'computing') {
    return (
      <span
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-sky-300"
        title="Recomputing steady state"
        aria-label="Recomputing steady state"
        role="status"
      >
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-amber-300"
        title="Steady update failed"
        aria-label="Steady update failed"
        role="status"
      >
        <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-emerald-300"
      title="Steady state updated"
      aria-label="Steady state updated"
      role="status"
    >
      <Check className="h-3.5 w-3.5" aria-hidden="true" />
    </span>
  );
}

export function ScenarioPane({
  instances,
  addInstance,
  removeInstance,
  updateInstanceName,
  updateInstanceColor,
  steadyUpdateStatuses = {},
}: ScenarioPaneProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draftName, setDraftName] = React.useState('');
  const [menuState, setMenuState] = React.useState<{
    instanceId: string;
    x: number;
    y: number;
  } | null>(null);
  const [addMenuPosition, setAddMenuPosition] = React.useState<{ x: number; y: number } | null>(null);

  const getMenuPosition = (x: number, y: number, width = 152, height = 120) => ({
    x: Math.max(8, Math.min(x, window.innerWidth - width)),
    y: Math.max(8, Math.min(y, window.innerHeight - height)),
  });

  React.useEffect(() => {
    if (editingId && !instances.some((instance) => instance.id === editingId)) {
      setEditingId(null);
      setDraftName('');
    }
  }, [editingId, instances]);

  React.useEffect(() => {
    if (menuState && !instances.some((instance) => instance.id === menuState.instanceId)) {
      setMenuState(null);
    }
  }, [instances, menuState]);

  const beginRename = (instance: SimInstance) => {
    setMenuState(null);
    setEditingId(instance.id);
    setDraftName(instance.name);
  };

  const commitRename = (instance: SimInstance) => {
    const nextName = draftName.trim();
    if (nextName && nextName !== instance.name) {
      updateInstanceName(instance.id, nextName);
    }
    setEditingId(null);
    setDraftName('');
  };

  const cancelRename = () => {
    setEditingId(null);
    setDraftName('');
  };

  const openMenuAtCursor = (event: React.MouseEvent, instance: SimInstance) => {
    event.preventDefault();
    event.stopPropagation();
    setAddMenuPosition(null);
    setMenuState({ instanceId: instance.id, ...getMenuPosition(event.clientX, event.clientY) });
  };

  const openMenuForButton = (event: React.MouseEvent<HTMLButtonElement>, instance: SimInstance) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setAddMenuPosition(null);
    setMenuState({ instanceId: instance.id, ...getMenuPosition(rect.right - 144, rect.bottom + 4) });
  };

  const openAddMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuState(null);
    setAddMenuPosition((value) => (
      value
        ? null
        : getMenuPosition(rect.left, rect.bottom + 4, 208, 180)
    ));
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0B1120]">
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2 custom-scrollbar">
        {instances.map((instance) => {
          const isEditing = instance.id === editingId;
          const isMenuOpen = menuState?.instanceId === instance.id;
          return (
            <div
              key={instance.id}
              className={`group relative flex h-8 items-center gap-2 rounded px-2 text-xs transition-colors ${
                isMenuOpen
                  ? 'bg-slate-900/90 text-slate-200'
                  : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
              }`}
              onContextMenu={(event) => openMenuAtCursor(event, instance)}
              onDoubleClick={() => beginRename(instance)}
            >
              <label
                className="relative h-2.5 w-2.5 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-900/80"
                title="Change scenario color"
                onClick={(event) => event.stopPropagation()}
              >
                <span className="absolute inset-0" style={{ backgroundColor: instance.color }} />
                <input
                  type="color"
                  value={instance.color}
                  onChange={(event) => updateInstanceColor(instance.id, event.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label={`${instance.name} color`}
                />
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={draftName}
                  autoFocus
                  onClick={(event) => event.stopPropagation()}
                  onDoubleClick={(event) => event.stopPropagation()}
                  onBlur={() => commitRename(instance)}
                  onChange={(event) => setDraftName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') commitRename(instance);
                    if (event.key === 'Escape') cancelRename();
                  }}
                  className="h-6 min-w-0 flex-1 rounded border border-blue-400/60 bg-blue-950/40 px-1.5 text-xs font-semibold text-slate-100 outline-none"
                  placeholder="Scenario name"
                />
              ) : (
                <span className="min-w-0 flex-1 truncate font-medium">{instance.name}</span>
              )}
              <SteadyStatusIndicator status={steadyUpdateStatuses[instance.id]} />
              {!isEditing && (
                <button
                  type="button"
                  onClick={(event) => openMenuForButton(event, instance)}
                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-500 transition-opacity hover:bg-slate-800 hover:text-slate-100 ${
                    isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title="Scenario actions"
                  aria-label={`${instance.name} actions`}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              )}
              {isMenuOpen && typeof document !== 'undefined' && createPortal(
                <>
                  <div className="fixed inset-0 z-[80]" onClick={() => setMenuState(null)} />
                  <div
                    className="workbench-popover-menu fixed z-[90] w-36 rounded-md border py-1 shadow-xl"
                    style={{ left: menuState.x, top: menuState.y }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => beginRename(instance)}
                      className="workbench-popover-menu-item block w-full px-3 py-1.5 text-left text-xs font-medium"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        addInstance(instance.id);
                        setMenuState(null);
                      }}
                      className="workbench-popover-menu-item block w-full px-3 py-1.5 text-left text-xs font-medium"
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        removeInstance(instance.id);
                        setMenuState(null);
                      }}
                      disabled={instances.length <= 1}
                      className="workbench-popover-menu-item-danger block w-full px-3 py-1.5 text-left text-xs font-medium disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
                    >
                      Delete
                    </button>
                  </div>
                </>,
                document.body,
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={openAddMenu}
          className="group mt-1 flex h-8 w-full items-center gap-2 rounded px-2 text-left text-xs font-medium text-slate-500 transition-colors hover:bg-slate-900/80 hover:text-slate-200"
          aria-label="Add scenario from preset"
          title="Add scenario from preset"
        >
          <span className="inline-flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-600 text-slate-500 group-hover:border-slate-400 group-hover:text-slate-300">
            <Plus className="h-2 w-2" />
          </span>
          <span className="min-w-0 flex-1 truncate">Add from preset</span>
        </button>
        {addMenuPosition && typeof document !== 'undefined' && createPortal(
          <>
            <div className="fixed inset-0 z-[80]" onClick={() => setAddMenuPosition(null)} />
            <div
              className="workbench-popover-menu fixed z-[90] w-52 rounded-md border py-1 shadow-xl"
              style={{ left: addMenuPosition.x, top: addMenuPosition.y }}
              onClick={(event) => event.stopPropagation()}
            >
              {scenarioPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    addInstance(undefined, preset.id);
                    setAddMenuPosition(null);
                  }}
                  className="workbench-popover-menu-item block w-full px-3 py-2 text-left"
                >
                  <span className="block truncate text-xs font-semibold text-slate-200">{preset.label}</span>
                  <span className="block truncate text-[10px] text-slate-500">{preset.detail}</span>
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
      </div>
    </div>
  );
}
