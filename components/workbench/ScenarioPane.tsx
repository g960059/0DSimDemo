import React from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { Check, Eye, EyeOff, LoaderCircle, MoreVertical, TriangleAlert } from 'lucide-react';
import type { SteadyUpdateStatus, SteadyUpdateStatusMap } from '../../engine/previewController';
import type { SimInstance } from '../../types';

export type ScenarioPaneInstance = Pick<SimInstance, 'id' | 'name' | 'color' | 'isVisible'> & Readonly<{
  /** Explicit reset capability for runtimes that do not expose legacy knob state. */
  canReset?: boolean;
  /** Retained for the legacy default reset-capability inference. */
  knobBaseline?: SimInstance['knobBaseline'];
}>;

export type ScenarioPresetCatalogEntry = Readonly<{
  id: string;
  label: string;
  detail?: string;
  disabledReason?: string;
}>;

export interface ScenarioPaneProps {
  instances: ScenarioPaneInstance[];
  addInstance: (sourceId?: string, presetId?: string) => void;
  removeInstance: (id: string) => void;
  updateInstanceName: (id: string, name: string) => void;
  updateInstanceColor: (id: string, color: string) => void;
  activeInstanceId?: string;
  setActiveInstanceId?: (id: string) => void;
  toggleScenarioGlobalVisibility?: (id: string) => void;
  resetInstanceKnobs?: (id: string) => void;
  steadyUpdateStatuses?: SteadyUpdateStatusMap;
  readOnly?: boolean;
}

export const getScenarioPresetMenuPosition = (x: number, y: number, width = 208, height = 180) => ({
  x: Math.max(8, Math.min(x, window.innerWidth - width)),
  y: Math.max(8, Math.min(y, window.innerHeight - height)),
});

export function ScenarioPresetMenu({
  position,
  onClose,
  onSelect,
  presets,
}: {
  position: { x: number; y: number };
  onClose: () => void;
  onSelect: (presetId: string) => void;
  presets?: readonly ScenarioPresetCatalogEntry[];
}) {
  const [legacyPresets, setLegacyPresets] = React.useState<
  readonly ScenarioPresetCatalogEntry[]>([]);
  React.useEffect(() => {
    if (presets !== undefined) return undefined;
    let active = true;
    void import('./legacyScenarioPresetCatalog').then((module) => {
      if (active) setLegacyPresets(module.LEGACY_SCENARIO_PRESET_CATALOG);
    });
    return () => { active = false; };
  }, [presets]);
  const resolvedPresets = presets ?? legacyPresets;
  return typeof document !== 'undefined' ? createPortal(
    <>
      <div className="fixed inset-0 z-[80]" onClick={onClose} />
      <div
        className="workbench-popover-menu fixed z-[90] w-52 rounded-md border py-1 shadow-xl"
        style={{ left: position.x, top: position.y }}
        onClick={(event) => event.stopPropagation()}
      >
        {resolvedPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            disabled={Boolean(preset.disabledReason)}
            onClick={() => onSelect(preset.id)}
            title={preset.disabledReason}
            className="workbench-popover-menu-item block w-full px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="block truncate text-xs font-semibold text-wb-text">{preset.label}</span>
            {(preset.detail || preset.disabledReason) && (
              <span className={`block truncate text-[10px] ${preset.disabledReason ? 'text-amber-300/80' : 'text-wb-subtle'}`}>
                {preset.disabledReason ?? preset.detail}
              </span>
            )}
          </button>
        ))}
      </div>
    </>,
    document.body,
  ) : null;
}

function SteadyStatusIndicator({ status }: { status?: SteadyUpdateStatus }) {
  const { t } = useTranslation();
  if (!status) return null;
  if (status === 'computing') {
    return (
      <span
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-wb-accent"
        title={t('workbench.scenarioPane.steadyComputing')}
        aria-label={t('workbench.scenarioPane.steadyComputing')}
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
        title={t('workbench.scenarioPane.steadyFailed')}
        aria-label={t('workbench.scenarioPane.steadyFailed')}
        role="status"
      >
        <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-emerald-300"
      title={t('workbench.scenarioPane.steadyUpdated')}
      aria-label={t('workbench.scenarioPane.steadyUpdated')}
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
  activeInstanceId,
  setActiveInstanceId,
  toggleScenarioGlobalVisibility,
  resetInstanceKnobs,
  steadyUpdateStatuses = {},
  readOnly = false,
}: ScenarioPaneProps) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draftName, setDraftName] = React.useState('');
  const [menuState, setMenuState] = React.useState<{
    instanceId: string;
    x: number;
    y: number;
  } | null>(null);

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

  const beginRename = (instance: ScenarioPaneInstance) => {
    if (readOnly) return;
    setMenuState(null);
    setEditingId(instance.id);
    setDraftName(instance.name);
  };

  const commitRename = (instance: ScenarioPaneInstance) => {
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

  const openMenuAtCursor = (event: React.MouseEvent, instance: ScenarioPaneInstance) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuState({ instanceId: instance.id, ...getMenuPosition(event.clientX, event.clientY) });
  };

  const openMenuForButton = (event: React.MouseEvent<HTMLButtonElement>, instance: ScenarioPaneInstance) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuState({ instanceId: instance.id, ...getMenuPosition(rect.right - 144, rect.bottom + 4) });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-wb-aux">
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2 custom-scrollbar">
        {instances.map((instance) => {
          const isEditing = instance.id === editingId;
          const isMenuOpen = menuState?.instanceId === instance.id;
          const isActive = instance.id === activeInstanceId;
          const isHidden = instance.isVisible === false;
          return (
            <div
              key={instance.id}
              role="button"
              tabIndex={isEditing ? -1 : 0}
              className={`group relative flex min-h-8 items-center gap-2 rounded-sm px-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent ${
                isActive
                  ? 'bg-wb-active text-wb-text'
                  : isMenuOpen
                    ? 'text-wb-text'
                    : 'text-wb-muted hover:bg-wb-hover hover:text-wb-text'
              }`}
              onClick={() => setActiveInstanceId?.(instance.id)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                setActiveInstanceId?.(instance.id);
              }}
              onContextMenu={(event) => openMenuAtCursor(event, instance)}
              onDoubleClick={() => beginRename(instance)}
            >
              <label
                className={`relative h-2.5 w-2.5 shrink-0 overflow-hidden rounded-full ring-1 ring-wb-line-strong ${readOnly ? '' : 'cursor-pointer'}`}
                title={readOnly ? instance.name : t('workbench.scenarioPane.changeColor')}
                onClick={(event) => event.stopPropagation()}
              >
                <span className="absolute inset-0" style={{ backgroundColor: instance.color }} />
                {!readOnly && (
                  <input
                    type="color"
                    value={instance.color}
                    onChange={(event) => updateInstanceColor(instance.id, event.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
                    aria-label={t('workbench.scenarioPane.colorAria', { name: instance.name })}
                  />
                )}
              </label>
              {isEditing ? (
                <input
                  type="text"
	                  value={draftName}
	                  autoFocus
                    onFocus={(event) => event.currentTarget.select()}
	                  onClick={(event) => event.stopPropagation()}
                  onDoubleClick={(event) => event.stopPropagation()}
                  onBlur={() => commitRename(instance)}
                  onChange={(event) => setDraftName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') commitRename(instance);
                    if (event.key === 'Escape') cancelRename();
                  }}
                  className="h-6 min-w-0 flex-1 rounded border border-wb-accent bg-wb-input px-1.5 text-xs font-semibold text-wb-text outline-none focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
                  placeholder={t('workbench.scenarioPane.scenarioName')}
                />
              ) : (
                <span className="min-w-0 flex-1 truncate font-medium">
                  {instance.name}
                  {isActive && isHidden && <span className="ml-1 text-[10px] font-bold text-wb-subtle">{t('workbench.scenarioPane.hiddenHint')}</span>}
                </span>
              )}
              <SteadyStatusIndicator status={steadyUpdateStatuses[instance.id]} />
              {!isEditing && (
                <div className="ml-auto flex shrink-0 items-center gap-1">
                  {toggleScenarioGlobalVisibility && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleScenarioGlobalVisibility(instance.id);
                      }}
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent ${
                        isHidden
                          ? 'text-wb-subtle hover:bg-wb-hover hover:text-wb-muted'
                          : 'text-wb-muted hover:bg-wb-hover hover:text-wb-text'
                      }`}
                      title={isHidden ? t('workbench.scenarioPane.showScenario') : t('workbench.scenarioPane.hideScenario')}
                      aria-label={isHidden ? t('workbench.scenarioPane.showScenarioAria', { name: instance.name }) : t('workbench.scenarioPane.hideScenarioAria', { name: instance.name })}
                      aria-pressed={!isHidden}
                    >
                      {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(event) => openMenuForButton(event, instance)}
                    className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-wb-subtle transition-opacity hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent ${
                      isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title={t('workbench.scenarioPane.actions')}
                    aria-label={t('workbench.scenarioPane.actionsAria', { name: instance.name })}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {isMenuOpen && typeof document !== 'undefined' && createPortal(
                <>
                  <div className="fixed inset-0 z-[80]" onClick={() => setMenuState(null)} />
                  <div
                    className="workbench-popover-menu fixed z-[90] w-36 rounded-md border py-1 shadow-xl"
                    style={{ left: menuState.x, top: menuState.y }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {!readOnly && (
                      <>
                        <button
                          type="button"
                          onClick={() => beginRename(instance)}
                          className="workbench-popover-menu-item block w-full px-3 py-1.5 text-left text-xs font-medium"
                        >
                          {t('common.rename')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            addInstance(instance.id);
                            setMenuState(null);
                          }}
                          className="workbench-popover-menu-item block w-full px-3 py-1.5 text-left text-xs font-medium"
                        >
                          {t('common.duplicate')}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        resetInstanceKnobs?.(instance.id);
                        setMenuState(null);
                      }}
                      disabled={!resetInstanceKnobs || !(instance.canReset ?? Boolean(instance.knobBaseline))}
                      className="workbench-popover-menu-item block w-full px-3 py-1.5 text-left text-xs font-medium disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
                    >
                      {t('workbench.scenarioPane.reset')}
                    </button>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          removeInstance(instance.id);
                          setMenuState(null);
                        }}
                        disabled={instances.length <= 1}
                        className="workbench-popover-menu-item-danger block w-full px-3 py-1.5 text-left text-xs font-medium disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
                      >
                        {t('common.delete')}
                      </button>
                    )}
                  </div>
                </>,
                document.body,
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
