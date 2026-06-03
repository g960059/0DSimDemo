import React, { useCallback, useMemo } from 'react';
import { Controls } from '../Controls';
import { PVLoopPanel, WaveformPanel, MetricsPanel, GuytonPanel } from '../Charts';
import { LessonAuthoring } from '../LessonAuthoring';
import { NotePanel } from '../NotePanel';
import { ErrorBoundary } from '../ErrorBoundary';
import WorkbenchDockview from './WorkbenchDockview';
import WorkbenchMobile from './WorkbenchMobile';
import { type ClinicalKnobs } from '../../engine/knobs';
import { SimulationHealth } from '../../engine/protocol';
import {
  ChamberId,
  type DockviewViewState,
  MetricType,
  PanelDef,
  PanelType,
  PhysicsRefState,
  SignalType,
  SimInstance,
  SimulationParams,
  WorkbenchZoneId,
} from '../../types';
import type { LessonStep } from '../../lessonDoc';
import type { NoteContent } from '../../noteTypes';
import { flowPack } from '../../layoutPresets';
import { zoneOf } from '../../paneZone';
import { ArrowLeft, Settings, X } from 'lucide-react';

export type PanelGridMode = 'learner' | 'author' | 'sandbox';

interface PanelGridProps {
  authoringMode: boolean;
  publishedLesson: { id: string; title: string; url: string } | null;
  copyShareUrl: () => void;
  instances: SimInstance[];
  stepsDraft: LessonStep[];
  setStepsDraft: React.Dispatch<React.SetStateAction<LessonStep[]>>;
  panels: PanelDef[];
  dockviewLayoutKey?: string;
  dockviewViewStates?: Partial<Record<WorkbenchZoneId, DockviewViewState>>;
  onDockviewViewStateChange?: (zone: WorkbenchZoneId, viewState: DockviewViewState) => void;
  mode: PanelGridMode;
  isMobile: boolean;
  noteModes: Record<string, 'read' | 'edit'>;
  setNoteModes: React.Dispatch<React.SetStateAction<Record<string, 'read' | 'edit'>>>;
  physicsRefs: React.MutableRefObject<Map<string, PhysicsRefState>>;
  instanceHealth: Record<string, SimulationHealth>;
  activeInstanceId: string;
  setActiveInstanceId: (id: string) => void;
  updateInstanceParams: (id: string, params: Partial<SimulationParams>) => void;
  updateInstanceKnobs: (id: string, knobs: ClinicalKnobs) => void;
  updateInstanceVolume: (id: string, vol: number) => void;
  updateInstanceColor: (id: string, color: string) => void;
  addInstance: (sourceId?: string) => void;
  removeInstance: (id: string) => void;
  timeScale: number;
  setTimeScale: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  togglePlay: () => void;
  addPanel: (type: PanelType, zone?: WorkbenchZoneId) => void;
  removePanel: (id: string) => void;
  updatePanelTitle: (id: string, newTitle: string) => void;
  toggleShowLegend: (id: string) => void;
  updatePanelInstanceColor: (panelId: string, instId: string, newColor: string) => void;
  updatePanelInstanceName: (panelId: string, instId: string, newName: string) => void;
  updatePanelSignalColor: (panelId: string, instId: string, sig: string, newColor: string) => void;
  updatePanelSignalName: (panelId: string, instId: string, sig: string, newName: string) => void;
  toggleSettings: (panelId: string) => void;
  toggleInstanceVisibility: (panelId: string, instId: string) => void;
  updateInstanceSignals: (panelId: string, instId: string, signal: string) => void;
  toggleGuides: (panelId: string) => void;
  updateTimeWindow: (panelId: string, val: number) => void;
  noteCaseKey: string;
  notes: Record<string, NoteContent>;
  onNoteChange: (panelId: string, blocks: NoteContent) => void;
  chambers: ChamberId[];
  signals: SignalType[];
  metrics: MetricType[];
  controlGroups: string[];
}

type PanelChromeMode = 'desktop' | 'mobile' | 'dockview';

export function getDockviewPaneTitle(panel: PanelDef): string {
  return panel.title;
}

export function resolveControlsPaneTarget(
  instances: SimInstance[],
  config: PanelDef['config'],
  activeInstanceId: string,
): SimInstance | null {
  const availableInstances = instances.filter((inst) => inst.isVisible !== false);
  const visibleInstances = availableInstances.filter((inst) => config[inst.id]?.visible);
  return visibleInstances.find((inst) => inst.id === activeInstanceId) ?? visibleInstances[0] ?? availableInstances[0] ?? instances[0] ?? null;
}

interface PanelSettingsButtonProps {
  panel: PanelDef;
  instances: SimInstance[];
  updatePanelTitle: (id: string, newTitle: string) => void;
  toggleShowLegend: (id: string) => void;
  updatePanelInstanceColor: (panelId: string, instId: string, newColor: string) => void;
  updatePanelInstanceName: (panelId: string, instId: string, newName: string) => void;
  updatePanelSignalColor: (panelId: string, instId: string, sig: string, newColor: string) => void;
  updatePanelSignalName: (panelId: string, instId: string, sig: string, newName: string) => void;
  toggleSettings: (panelId: string) => void;
  toggleInstanceVisibility: (panelId: string, instId: string) => void;
  updateInstanceSignals: (panelId: string, instId: string, signal: string) => void;
  toggleGuides: (panelId: string) => void;
  updateTimeWindow: (panelId: string, val: number) => void;
  chambers: ChamberId[];
  signals: SignalType[];
  metrics: MetricType[];
  controlGroups: string[];
}

type PanelSettingsControlsProps = Omit<PanelSettingsButtonProps, 'toggleSettings'>;

function PanelSettingsControls({
  panel,
  instances,
  updatePanelTitle,
  toggleShowLegend,
  updatePanelInstanceColor,
  updatePanelInstanceName,
  updatePanelSignalColor,
  updatePanelSignalName,
  toggleInstanceVisibility,
  updateInstanceSignals,
  toggleGuides,
  updateTimeWindow,
  chambers,
  signals,
  metrics,
  controlGroups,
}: PanelSettingsControlsProps) {
  const itemOptions = panel.type === 'PVLOOP'
    ? chambers
    : panel.type === 'WAVEFORM'
      ? signals
      : panel.type === 'METRICS'
        ? metrics
        : controlGroups;

  return (
    <>
      <div className="mb-2 flex items-center gap-2 border-b border-slate-700 pb-2">
        <span className="text-xs font-medium text-slate-400">Title:</span>
        <input
          type="text"
          value={panel.title}
          onChange={(e) => updatePanelTitle(panel.id, e.target.value)}
          className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-xs font-medium text-slate-200 outline-none focus:border-slate-500"
          placeholder="Panel Title"
        />
      </div>
      {['PVLOOP', 'WAVEFORM'].includes(panel.type) && (
        <div className="mb-2 flex items-center gap-2 border-b border-slate-700 pb-2">
          <input type="checkbox" className="cursor-pointer accent-blue-500" checked={panel.showLegend !== false} onChange={() => toggleShowLegend(panel.id)} />
          <span className="text-xs font-medium text-slate-200">Show Legend</span>
        </div>
      )}
      {panel.type === 'PVLOOP' && (
        <div className="mb-2 flex items-center gap-2 border-b border-slate-700 pb-2">
          <input type="checkbox" className="cursor-pointer accent-blue-500" checked={panel.showGuides} onChange={() => toggleGuides(panel.id)} />
          <span className="text-xs font-medium text-slate-200">Show Guides</span>
        </div>
      )}
      {panel.type === 'WAVEFORM' && (
        <div className="mb-3 border-b border-slate-700 pb-3">
          <div className="mb-2 flex justify-between text-[10px] font-medium text-slate-400">
            <span>Window Size</span>
            <span className="text-blue-400">{(panel.timeWindow || 10000) / 1000}s</span>
          </div>
          <input type="range" min={2000} max={20000} step={1000} value={panel.timeWindow || 10000} onChange={(e) => updateTimeWindow(panel.id, parseFloat(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-900 accent-blue-500" />
        </div>
      )}
      <div className="space-y-3">
        {instances.map(inst => {
          const cfg = panel.config[inst.id];
          return (
            <div key={inst.id}>
              <div className="mb-1 flex items-center gap-2">
                <input type="checkbox" className="flex-none cursor-pointer accent-blue-500" checked={cfg?.visible || false} onChange={() => toggleInstanceVisibility(panel.id, inst.id)} />
                <input type="color" className="block h-[14px] w-[14px] flex-none cursor-pointer appearance-none rounded border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-none" value={cfg?.customBaseColor ?? inst.color} onChange={(e) => updatePanelInstanceColor(panel.id, inst.id, e.target.value)} />
                <input type="text" className="w-full min-w-0 border-b border-transparent bg-transparent text-xs font-bold text-slate-300 outline-none focus:border-slate-500" value={cfg?.customName ?? inst.name} onChange={(e) => updatePanelInstanceName(panel.id, inst.id, e.target.value)} placeholder={inst.name} />
              </div>
              {cfg?.visible && (panel.type !== 'GUYTON_RIGHT' && panel.type !== 'GUYTON_LEFT') && (
                <div className="grid grid-cols-1 gap-1 pl-5">
                  {itemOptions.map(sig => {
                    const isSelected = cfg.selectedSignals.includes(sig);
                    return (
                      <div key={sig} className="flex items-center gap-1 rounded bg-slate-950/50 px-1 py-0.5 text-[10px]">
                        <input type="checkbox" className="m-0 h-3 w-3 flex-none cursor-pointer accent-blue-500" checked={isSelected} onChange={() => updateInstanceSignals(panel.id, inst.id, sig)} />
                        {isSelected && (
                          <input type="color" className="block h-3 w-3 flex-none cursor-pointer appearance-none rounded border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-none" value={cfg.customSignalColors?.[sig] || cfg.customBaseColor || inst.color} onChange={(e) => updatePanelSignalColor(panel.id, inst.id, sig, e.target.value)} />
                        )}
                        {isSelected ? (
                          <input type="text" className="w-full min-w-0 border-b border-transparent bg-transparent text-[10px] font-medium text-slate-300 outline-none focus:border-slate-500" value={cfg.customSignalNames?.[sig] || sig} onChange={(e) => updatePanelSignalName(panel.id, inst.id, sig, e.target.value)} placeholder={sig} />
                        ) : (
                          <span className="flex-1 select-none truncate text-slate-600">{sig}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function PanelSettingsButton({ toggleSettings, ...settingsProps }: PanelSettingsButtonProps) {
  const { panel } = settingsProps;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); toggleSettings(panel.id); }}
        className={`relative z-50 flex h-7 w-7 items-center justify-center rounded border border-slate-800/70 transition-colors ${panel.isSettingsOpen ? 'bg-slate-700 text-slate-200' : 'bg-slate-950/75 text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
        title="Pane settings"
        aria-label={`${panel.title} pane settings`}
      >
        <Settings className="h-3.5 w-3.5" />
      </button>
      {panel.isSettingsOpen && (
        <>
          <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); toggleSettings(panel.id); }} />
          <div className="absolute top-full right-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-3 z-50 cursor-default">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configuration</span>
              <button
                type="button"
                onClick={() => toggleSettings(panel.id)}
                className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-700 hover:text-white"
                aria-label="Close pane settings"
                title="Close settings"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-3 custom-scrollbar">
              <PanelSettingsControls {...settingsProps} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PanelSettingsView({ toggleSettings, ...settingsProps }: PanelSettingsButtonProps) {
  const { panel } = settingsProps;
  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-[#0B1120]">
      <div className="flex flex-none items-center border-b border-slate-800 px-3 py-2">
        <button
          type="button"
          onClick={() => toggleSettings(panel.id)}
          className="inline-flex min-w-0 items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
          aria-label={`Back to ${panel.title}`}
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Back to {panel.title}</span>
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 custom-scrollbar">
        <div className="mb-3 border-b border-slate-700 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Customizations
        </div>
        <PanelSettingsControls {...settingsProps} />
      </div>
    </div>
  );
}

interface PanelCardProps {
  panel: PanelDef;
  isEditor: boolean;
  chromeMode?: 'desktop' | 'mobile' | 'dockview';
  instances: SimInstance[];
  noteMode: 'read' | 'edit';
  setNoteModes: React.Dispatch<React.SetStateAction<Record<string, 'read' | 'edit'>>>;
  physicsRefs: React.MutableRefObject<Map<string, PhysicsRefState>>;
  instanceHealth: Record<string, SimulationHealth>;
  activeInstanceId: string;
  setActiveInstanceId: (id: string) => void;
  updateInstanceParams: (id: string, params: Partial<SimulationParams>) => void;
  updateInstanceKnobs: (id: string, knobs: ClinicalKnobs) => void;
  updateInstanceVolume: (id: string, vol: number) => void;
  updateInstanceColor: (id: string, color: string) => void;
  addInstance: (sourceId?: string) => void;
  removeInstance: (id: string) => void;
  timeScale: number;
  setTimeScale: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  togglePlay: () => void;
  addPanel: (type: PanelType, zone?: WorkbenchZoneId) => void;
  removePanel: (id: string) => void;
  updatePanelTitle: (id: string, newTitle: string) => void;
  toggleShowLegend: (id: string) => void;
  updatePanelInstanceColor: (panelId: string, instId: string, newColor: string) => void;
  updatePanelInstanceName: (panelId: string, instId: string, newName: string) => void;
  updatePanelSignalColor: (panelId: string, instId: string, sig: string, newColor: string) => void;
  updatePanelSignalName: (panelId: string, instId: string, sig: string, newName: string) => void;
  toggleSettings: (panelId: string) => void;
  toggleInstanceVisibility: (panelId: string, instId: string) => void;
  updateInstanceSignals: (panelId: string, instId: string, signal: string) => void;
  toggleGuides: (panelId: string) => void;
  updateTimeWindow: (panelId: string, val: number) => void;
  noteCaseKey: string;
  notes: Record<string, NoteContent>;
  onNoteChange: (panelId: string, blocks: NoteContent) => void;
  chambers: ChamberId[];
  signals: SignalType[];
  metrics: MetricType[];
  controlGroups: string[];
  canConfigure?: boolean;
}

function PanelCard({
  panel,
  isEditor,
  chromeMode = 'desktop',
  instances,
  noteMode,
  setNoteModes,
  physicsRefs,
  instanceHealth,
  activeInstanceId,
  setActiveInstanceId,
  updateInstanceParams,
  updateInstanceKnobs,
  updateInstanceVolume,
  updateInstanceColor,
  addInstance,
  removeInstance,
  timeScale,
  setTimeScale,
  isPlaying,
  togglePlay,
  addPanel,
  removePanel,
  updatePanelTitle,
  toggleShowLegend,
  updatePanelInstanceColor,
  updatePanelInstanceName,
  updatePanelSignalColor,
  updatePanelSignalName,
  toggleSettings,
  toggleInstanceVisibility,
  updateInstanceSignals,
  toggleGuides,
  updateTimeWindow,
  noteCaseKey,
  notes,
  onNoteChange,
  chambers,
  signals,
  metrics,
  controlGroups,
  canConfigure = isEditor,
}: PanelCardProps) {
  const bodyClassName = chromeMode === 'mobile' || chromeMode === 'dockview'
    ? 'relative h-full min-h-16 w-full'
    : `flex-1 min-h-0 w-full relative z-10 ${['WAVEFORM', 'GUYTON_RIGHT', 'GUYTON_LEFT'].includes(panel.type) ? '-mt-6' : ''} ${panel.type === 'PVLOOP' ? 'mb-4' : ''}`;
  const controlsTarget = useMemo(() => {
    if (panel.type !== 'CONTROLS' || chromeMode !== 'dockview') return null;
    return resolveControlsPaneTarget(instances, panel.config, activeInstanceId);
  }, [activeInstanceId, chromeMode, instances, panel.config, panel.type]);
  const controlsActiveInstanceId = controlsTarget?.id ?? activeInstanceId;
  const dockviewNoteModeSwitch = chromeMode === 'dockview' && panel.type === 'NOTE' && canConfigure ? (
    <div className="flex shrink-0 items-center justify-end border-b border-slate-800/70 bg-slate-950/35 px-2 py-1">
      <div className="flex items-center rounded border border-slate-700 bg-slate-900 p-0.5">
        <button
          type="button"
          onClick={() => setNoteModes(prev => ({ ...prev, [panel.id]: 'read' }))}
          className={`rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${noteMode === 'read' ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => setNoteModes(prev => ({ ...prev, [panel.id]: 'edit' }))}
          className={`rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${noteMode === 'edit' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Edit
        </button>
      </div>
    </div>
  ) : null;
  const panelBody = (
    <div className={bodyClassName}>
      {panel.type === 'PVLOOP' && <PVLoopPanel physicsRefs={physicsRefs} instances={instances} config={panel.config} showGuides={panel.showGuides} showLegend={panel.showLegend} />}
      {panel.type === 'WAVEFORM' && <WaveformPanel physicsRefs={physicsRefs} instances={instances} timeWindow={panel.timeWindow || 10000} config={panel.config} showLegend={panel.showLegend} />}
      {panel.type === 'METRICS' && <MetricsPanel physicsRefs={physicsRefs} instances={instances} config={panel.config} />}
      {panel.type === 'CONTROLS' && <Controls isPaneMode paneConfig={panel.config} instances={instances} instanceHealth={instanceHealth} activeInstanceId={controlsActiveInstanceId} setActiveInstanceId={setActiveInstanceId} updateInstanceParams={updateInstanceParams} updateInstanceKnobs={updateInstanceKnobs} updateInstanceVolume={updateInstanceVolume} updateInstanceColor={updateInstanceColor} addInstance={addInstance} removeInstance={removeInstance} timeScale={timeScale} setTimeScale={setTimeScale} isPlaying={isPlaying} togglePlay={togglePlay} addPanel={addPanel} />}
      {(panel.type === 'GUYTON_RIGHT' || panel.type === 'GUYTON_LEFT') && <GuytonPanel physicsRefs={physicsRefs} instances={instances} config={panel.config} type={panel.type} />}
      {panel.type === 'NOTE' && (
        <ErrorBoundary>
          <div className="flex h-full min-h-0 flex-col">
            {dockviewNoteModeSwitch}
            <div className="min-h-0 flex-1">
              <NotePanel
                key={`${noteCaseKey}:${panel.id}`}
                mode={noteMode}
                content={notes[panel.id]}
                onChange={(blocks) => onNoteChange(panel.id, blocks)}
              />
            </div>
          </div>
        </ErrorBoundary>
      )}
    </div>
  );

  if (chromeMode === 'dockview' && canConfigure && panel.isSettingsOpen) {
    return (
      <PanelSettingsView
        panel={panel}
        instances={instances}
        updatePanelTitle={updatePanelTitle}
        toggleShowLegend={toggleShowLegend}
        updatePanelInstanceColor={updatePanelInstanceColor}
        updatePanelInstanceName={updatePanelInstanceName}
        updatePanelSignalColor={updatePanelSignalColor}
        updatePanelSignalName={updatePanelSignalName}
        toggleSettings={toggleSettings}
        toggleInstanceVisibility={toggleInstanceVisibility}
        updateInstanceSignals={updateInstanceSignals}
        toggleGuides={toggleGuides}
        updateTimeWindow={updateTimeWindow}
        chambers={chambers}
        signals={signals}
        metrics={metrics}
        controlGroups={controlGroups}
      />
    );
  }

  if (chromeMode === 'mobile' || chromeMode === 'dockview') {
    return (
      <div className="group relative h-full min-h-0 w-full overflow-hidden bg-[#0B1120]">
        {panelBody}
      </div>
    );
  }

  return (
    <div
      className={`relative bg-[#0B1120] rounded-xl border border-slate-800 shadow-sm flex flex-col group transition-all h-full ${panel.isSettingsOpen ? 'z-50' : 'z-10'}`}
    >
      <div className="flex-none px-3 pt-1.5 pb-0 flex justify-between items-center pointer-events-auto rounded-t-xl z-20 relative">
        <div className={`flex-1 flex items-center min-w-0 ${isEditor ? 'panel-grid-drag-handle cursor-move' : ''}`}>
          <span className="text-[11px] font-medium text-slate-500 select-none flex items-center gap-1.5 transition-colors group-hover:text-slate-400 tracking-wide drop-shadow-md min-w-0">
            {isEditor && <span className="opacity-40">::</span>}
            <span className="truncate">{panel.title}</span>
          </span>
        </div>
        {panel.type === 'NOTE' && (
          <div className="mr-2 flex items-center rounded border border-slate-700 bg-slate-900 p-0.5">
            <button
              onClick={() => setNoteModes(prev => ({ ...prev, [panel.id]: 'read' }))}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${noteMode === 'read' ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Preview
            </button>
            <button
              onClick={() => setNoteModes(prev => ({ ...prev, [panel.id]: 'edit' }))}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${noteMode === 'edit' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Edit
            </button>
          </div>
        )}
        <div className={`flex items-center gap-1.5 transition-opacity ${panel.isSettingsOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <PanelSettingsButton
            panel={panel}
            instances={instances}
            updatePanelTitle={updatePanelTitle}
            toggleShowLegend={toggleShowLegend}
            updatePanelInstanceColor={updatePanelInstanceColor}
            updatePanelInstanceName={updatePanelInstanceName}
            updatePanelSignalColor={updatePanelSignalColor}
            updatePanelSignalName={updatePanelSignalName}
            toggleSettings={toggleSettings}
            toggleInstanceVisibility={toggleInstanceVisibility}
            updateInstanceSignals={updateInstanceSignals}
            toggleGuides={toggleGuides}
            updateTimeWindow={updateTimeWindow}
            chambers={chambers}
            signals={signals}
            metrics={metrics}
            controlGroups={controlGroups}
          />
          {isEditor && (
            <button onClick={() => removePanel(panel.id)} className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-400" title="Close Panel" aria-label={`Close ${panel.title}`}>
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {panelBody}
    </div>
  );
}

const ZONE_LABELS: Record<WorkbenchZoneId, string> = {
  caseRail: 'Case',
  main: 'Main',
  sideRail: 'Controls',
  bottomPanel: 'Outputs',
};

function getZoneSurfaceClass(zone: WorkbenchZoneId, hasCaseRail: boolean): string {
  const divider = 'border-slate-800/80';
  switch (zone) {
    case 'caseRail':
      return `workbench-zone-aux border ${divider} rounded-l-md`;
    case 'sideRail':
      return `workbench-zone-aux border-t border-r border-l ${divider} rounded-tr-md`;
    case 'bottomPanel':
      return hasCaseRail
        ? `workbench-zone-aux border-t border-r border-b border-l ${divider} rounded-br-md`
        : `workbench-zone-aux border-t border-r border-b border-l ${divider} rounded-b-md`;
    case 'main':
    default:
      return 'workbench-zone-main';
  }
}

function ZoneShell({
  zone,
  panels,
  mode,
  hasCaseRail,
  layoutKey,
  viewState,
  onViewStateChange,
  addPanel,
  removePanel,
  toggleSettings,
  renderPanel,
  getPanelTitle,
  className = '',
}: {
  zone: WorkbenchZoneId;
  panels: PanelDef[];
  mode: PanelGridMode;
  hasCaseRail: boolean;
  layoutKey?: string;
  viewState?: DockviewViewState;
  onViewStateChange?: (zone: WorkbenchZoneId, viewState: DockviewViewState) => void;
  addPanel: (type: PanelType, zone?: WorkbenchZoneId) => void;
  removePanel: (id: string) => void;
  toggleSettings: (panelId: string) => void;
  renderPanel: (panel: PanelDef) => React.ReactNode;
  getPanelTitle: (panel: PanelDef) => string;
  className?: string;
}) {
  return (
    <section className={`flex min-h-0 flex-col overflow-hidden bg-[#0B1120] ${getZoneSurfaceClass(zone, hasCaseRail)} ${className}`} aria-label={`${ZONE_LABELS[zone]} zone`}>
      <WorkbenchDockview
        panels={panels}
        zone={zone}
        mode={mode}
        layoutKey={`${layoutKey ?? 'default'}:${zone}`}
        viewState={viewState}
        onViewStateChange={(next) => onViewStateChange?.(zone, next)}
        onRemovePanel={removePanel}
        onToggleSettings={toggleSettings}
        onAddPanel={addPanel}
        getPanelTitle={getPanelTitle}
        className={`workbench-dockview workbench-dockview-${zone} flex-1`}
        renderPanel={renderPanel}
      />
    </section>
  );
}

export function PanelGrid({
  authoringMode,
  publishedLesson,
  copyShareUrl,
  instances,
  stepsDraft,
  setStepsDraft,
  panels,
  dockviewLayoutKey,
  dockviewViewStates,
  onDockviewViewStateChange,
  mode,
  isMobile,
  noteModes,
  setNoteModes,
  physicsRefs,
  instanceHealth,
  activeInstanceId,
  setActiveInstanceId,
  updateInstanceParams,
  updateInstanceKnobs,
  updateInstanceVolume,
  updateInstanceColor,
  addInstance,
  removeInstance,
  timeScale,
  setTimeScale,
  isPlaying,
  togglePlay,
  addPanel,
  removePanel,
  updatePanelTitle,
  toggleShowLegend,
  updatePanelInstanceColor,
  updatePanelInstanceName,
  updatePanelSignalColor,
  updatePanelSignalName,
  toggleSettings,
  toggleInstanceVisibility,
  updateInstanceSignals,
  toggleGuides,
  updateTimeWindow,
  noteCaseKey,
  notes,
  onNoteChange,
  chambers,
  signals,
  metrics,
  controlGroups,
}: PanelGridProps) {
  const presenterPanels = useMemo(() => flowPack(panels), [panels]);
  const panelsByZone = useMemo<Record<WorkbenchZoneId, PanelDef[]>>(() => ({
    caseRail: presenterPanels.filter((panel) => zoneOf(panel) === 'caseRail'),
    main: presenterPanels.filter((panel) => zoneOf(panel) === 'main'),
    sideRail: presenterPanels.filter((panel) => zoneOf(panel) === 'sideRail'),
    bottomPanel: presenterPanels.filter((panel) => zoneOf(panel) === 'bottomPanel'),
  }), [presenterPanels]);
  const hasCaseRail = panelsByZone.caseRail.length > 0;
  const shareBanner = authoringMode && publishedLesson ? (
    <div className="mb-2 flex flex-col gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100 sm:flex-row sm:items-center">
      <span className="font-bold">Share URL</span>
      <a href={publishedLesson.url} className="min-w-0 flex-1 truncate transition-colors hover:text-emerald-50">
        {publishedLesson.url}
      </a>
      <button onClick={copyShareUrl} className="self-start rounded bg-emerald-500/15 px-2 py-1 font-bold text-emerald-100 transition-colors hover:bg-emerald-500/25 sm:self-auto">
        Copy
      </button>
    </div>
  ) : null;

  const getPanelTitle = useCallback(getDockviewPaneTitle, []);

  const renderPanel = (panel: PanelDef, isEditor: boolean, chromeMode: PanelChromeMode = 'desktop') => (
    <PanelCard
      key={panel.id}
      panel={panel}
      isEditor={isEditor}
      chromeMode={chromeMode}
      instances={instances}
      noteMode={noteModes[panel.id] ?? 'read'}
      setNoteModes={setNoteModes}
      physicsRefs={physicsRefs}
      instanceHealth={instanceHealth}
      activeInstanceId={activeInstanceId}
      setActiveInstanceId={setActiveInstanceId}
      updateInstanceParams={updateInstanceParams}
      updateInstanceKnobs={updateInstanceKnobs}
      updateInstanceVolume={updateInstanceVolume}
      updateInstanceColor={updateInstanceColor}
      addInstance={addInstance}
      removeInstance={removeInstance}
      timeScale={timeScale}
      setTimeScale={setTimeScale}
      isPlaying={isPlaying}
      togglePlay={togglePlay}
      addPanel={addPanel}
      removePanel={removePanel}
      updatePanelTitle={updatePanelTitle}
      toggleShowLegend={toggleShowLegend}
      updatePanelInstanceColor={updatePanelInstanceColor}
      updatePanelInstanceName={updatePanelInstanceName}
      updatePanelSignalColor={updatePanelSignalColor}
      updatePanelSignalName={updatePanelSignalName}
      toggleSettings={toggleSettings}
      toggleInstanceVisibility={toggleInstanceVisibility}
      updateInstanceSignals={updateInstanceSignals}
      toggleGuides={toggleGuides}
      updateTimeWindow={updateTimeWindow}
      noteCaseKey={noteCaseKey}
      notes={notes}
      onNoteChange={onNoteChange}
      chambers={chambers}
      signals={signals}
      metrics={metrics}
      controlGroups={controlGroups}
      canConfigure={mode !== 'learner'}
    />
  );

  if (isMobile) {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-950 p-2">
        {shareBanner}
        {authoringMode && <LessonAuthoring instances={instances} stepsDraft={stepsDraft} setStepsDraft={setStepsDraft} />}
        <WorkbenchMobile
          panels={presenterPanels}
          title="Workbench"
          className="min-h-0 flex-1"
          renderPanel={(panel) => renderPanel(panel, false, 'mobile')}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-950 p-2">
        {shareBanner}
        {authoringMode && <LessonAuthoring instances={instances} stepsDraft={stepsDraft} setStepsDraft={setStepsDraft} />}
        <div className={`mt-2 grid min-h-0 flex-1 gap-0 overflow-auto ${
          hasCaseRail
            ? 'grid-cols-[minmax(220px,280px)_minmax(480px,1fr)_minmax(260px,320px)] grid-rows-[minmax(0,1fr)_190px]'
            : 'grid-cols-[minmax(480px,1fr)_minmax(260px,320px)] grid-rows-[minmax(0,1fr)_190px]'
        }`}>
          {hasCaseRail && (
            <ZoneShell
              zone="caseRail"
              panels={panelsByZone.caseRail}
              mode={mode}
              hasCaseRail={hasCaseRail}
              layoutKey={dockviewLayoutKey}
              viewState={dockviewViewStates?.caseRail}
              onViewStateChange={onDockviewViewStateChange}
              addPanel={addPanel}
              removePanel={removePanel}
              toggleSettings={toggleSettings}
              className="col-start-1 row-span-2"
              getPanelTitle={getPanelTitle}
              renderPanel={(panel) => renderPanel(panel, false, 'dockview')}
            />
          )}
          <ZoneShell
            zone="main"
            panels={panelsByZone.main}
            mode={mode}
            hasCaseRail={hasCaseRail}
            layoutKey={dockviewLayoutKey}
            viewState={dockviewViewStates?.main}
            onViewStateChange={onDockviewViewStateChange}
            addPanel={addPanel}
            removePanel={removePanel}
            toggleSettings={toggleSettings}
            className={hasCaseRail ? 'col-start-2 row-start-1' : 'col-start-1 row-start-1'}
            getPanelTitle={getPanelTitle}
            renderPanel={(panel) => renderPanel(panel, false, 'dockview')}
          />
          <ZoneShell
            zone="sideRail"
            panels={panelsByZone.sideRail}
            mode={mode}
            hasCaseRail={hasCaseRail}
            layoutKey={dockviewLayoutKey}
            viewState={dockviewViewStates?.sideRail}
            onViewStateChange={onDockviewViewStateChange}
            addPanel={addPanel}
            removePanel={removePanel}
            toggleSettings={toggleSettings}
            className={hasCaseRail ? 'col-start-3 row-start-1' : 'col-start-2 row-start-1'}
            getPanelTitle={getPanelTitle}
            renderPanel={(panel) => renderPanel(panel, false, 'dockview')}
          />
          <ZoneShell
            zone="bottomPanel"
            panels={panelsByZone.bottomPanel}
            mode={mode}
            hasCaseRail={hasCaseRail}
            layoutKey={dockviewLayoutKey}
            viewState={dockviewViewStates?.bottomPanel}
            onViewStateChange={onDockviewViewStateChange}
            addPanel={addPanel}
            removePanel={removePanel}
            toggleSettings={toggleSettings}
            className={hasCaseRail ? 'col-start-2 col-span-2 row-start-2' : 'col-start-1 col-span-2 row-start-2'}
            getPanelTitle={getPanelTitle}
            renderPanel={(panel) => renderPanel(panel, false, 'dockview')}
          />
        </div>
    </main>
  );
}
