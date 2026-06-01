import React, { Suspense, lazy, useMemo } from 'react';
import { Controls } from '../Controls';
import { PVLoopPanel, WaveformPanel, MetricsPanel, GuytonPanel } from '../Charts';
import { LessonAuthoring } from '../LessonAuthoring';
import { NotePanel } from '../NotePanel';
import { ErrorBoundary } from '../ErrorBoundary';
import { type ClinicalKnobs } from '../../engine/knobs';
import { SimulationHealth } from '../../engine/protocol';
import {
  ChamberId,
  MetricType,
  PanelDef,
  PanelInstanceConfig,
  PanelType,
  PhysicsRefState,
  SignalType,
  SimInstance,
  SimulationParams,
} from '../../types';
import type { LessonStep } from '../../lessonDoc';
import type { NoteContent } from '../../noteTypes';
import { flowPack, LAYOUT_PRESETS, type LayoutPresetName } from '../../layoutPresets';
import { movePane, resizePane } from '../../layoutOps';
import { roleOf } from '../../paneRole';

const PanelGridEditor = lazy(() => import('./PanelGridEditor'));

const EDITOR_ROW_HEIGHT = 50;

interface PanelGridProps {
  authoringMode: boolean;
  publishedLesson: { id: string; title: string; url: string } | null;
  copyShareUrl: () => void;
  instances: SimInstance[];
  stepsDraft: LessonStep[];
  setStepsDraft: React.Dispatch<React.SetStateAction<LessonStep[]>>;
  panels: PanelDef[];
  onPanelsChange: (panels: PanelDef[]) => void;
  layoutEditable: boolean;
  setLayoutEditable: React.Dispatch<React.SetStateAction<boolean>>;
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
  addPanel: (type: PanelType) => void;
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

interface PanelCardProps {
  panel: PanelDef;
  isMobile: boolean;
  isEditor: boolean;
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
  addPanel: (type: PanelType) => void;
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

function panelGridStyle(panel: PanelDef, isMobile: boolean): React.CSSProperties {
  if (isMobile) {
    return {
      gridColumn: 'span 12',
      gridRow: `span ${panel.type === 'METRICS' ? 5 : 7}`,
    };
  }

  return {
    gridColumn: `${(panel.x ?? 0) + 1} / span ${panel.w}`,
    gridRow: `${(panel.y ?? 0) + 1} / span ${panel.h}`,
  };
}

function applyPresetGeometry(panels: PanelDef[], presetName: LayoutPresetName): PanelDef[] {
  const preset = LAYOUT_PRESETS[presetName];
  const roleCounts: Record<string, number> = {};
  let next = flowPack(panels);

  for (const panel of next) {
    const role = panel.role ?? roleOf(panel.type);
    const roleIndex = roleCounts[role] ?? 0;
    roleCounts[role] = roleIndex + 1;
    const template = preset.filter((entry) => (entry.role ?? roleOf(entry.type)) === role)[roleIndex] ?? preset[roleIndex];
    if (!template) continue;
    next = movePane(next, panel.id, template.x ?? 0, template.y ?? 0);
    next = resizePane(next, panel.id, template.w, template.h);
  }

  return next;
}

function PanelCard({
  panel,
  isMobile,
  isEditor,
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
}: PanelCardProps) {
  return (
    <div
      style={isEditor ? undefined : panelGridStyle(panel, isMobile)}
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
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); toggleSettings(panel.id); }} className={`p-1 text-sm rounded flex items-center transition-colors relative z-50 ${panel.isSettingsOpen ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`} title="Settings">
              ⚙
            </button>
            {panel.isSettingsOpen && (
              <>
                <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); toggleSettings(panel.id); }} />
                <div className="absolute top-full right-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-3 z-50 cursor-default">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configuration</span>
                    <button onClick={() => toggleSettings(panel.id)} className="text-xs text-slate-500 hover:text-white transition-colors">✕</button>
                  </div>
                  <div className="mb-2 pb-2 border-b border-slate-700 flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Title:</span>
                    <input
                      type="text"
                      value={panel.title}
                      onChange={(e) => updatePanelTitle(panel.id, e.target.value)}
                      className="bg-slate-900 border border-slate-700 outline-none focus:border-slate-500 rounded px-1.5 py-0.5 text-xs font-medium text-slate-200 w-full"
                      placeholder="Panel Title"
                    />
                  </div>
                  {['PVLOOP', 'WAVEFORM'].includes(panel.type) && (
                    <div className="mb-2 pb-2 border-b border-slate-700 flex items-center gap-2">
                      <input type="checkbox" className="accent-blue-500 cursor-pointer" checked={panel.showLegend !== false} onChange={() => toggleShowLegend(panel.id)} />
                      <span className="text-xs text-slate-200 font-medium">Show Legend</span>
                    </div>
                  )}
                  {panel.type === 'PVLOOP' && (
                    <div className="mb-2 pb-2 border-b border-slate-700 flex items-center gap-2">
                      <input type="checkbox" className="accent-blue-500 cursor-pointer" checked={panel.showGuides} onChange={() => toggleGuides(panel.id)} />
                      <span className="text-xs text-slate-200 font-medium">Show Guides</span>
                    </div>
                  )}
                  {panel.type === 'WAVEFORM' && (
                    <div className="mb-3 pb-3 border-b border-slate-700">
                      <div className="flex justify-between text-[10px] font-medium text-slate-400 mb-2"><span>Window Size</span><span className="text-blue-400">{(panel.timeWindow || 10000) / 1000}s</span></div>
                      <input type="range" min={2000} max={20000} step={1000} value={panel.timeWindow || 10000} onChange={(e) => updateTimeWindow(panel.id, parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-blue-500" />
                    </div>
                  )}
                  <div className="max-h-64 overflow-y-auto space-y-3 custom-scrollbar">
                    {instances.map(inst => (
                      <div key={inst.id}>
                        <div className="flex items-center gap-2 mb-1">
                          <input type="checkbox" className="cursor-pointer accent-blue-500 flex-none" checked={panel.config[inst.id]?.visible || false} onChange={() => toggleInstanceVisibility(panel.id, inst.id)} />
                          <input type="color" className="w-[14px] h-[14px] p-0 border-0 cursor-pointer flex-none rounded appearance-none block bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded" value={panel.config[inst.id]?.customBaseColor ?? inst.color} onChange={(e) => updatePanelInstanceColor(panel.id, inst.id, e.target.value)} />
                          <input type="text" className="text-xs font-bold bg-transparent border-b border-transparent focus:border-slate-500 outline-none text-slate-300 w-full min-w-0" value={panel.config[inst.id]?.customName ?? inst.name} onChange={(e) => updatePanelInstanceName(panel.id, inst.id, e.target.value)} placeholder={inst.name} />
                        </div>
                        {panel.config[inst.id]?.visible && (panel.type !== 'GUYTON_RIGHT' && panel.type !== 'GUYTON_LEFT') && (
                          <div className="pl-5 grid grid-cols-1 gap-1">
                            {((panel.type === 'PVLOOP' ? chambers : (panel.type === 'WAVEFORM' ? signals : panel.type === 'METRICS' ? metrics : controlGroups))).map(sig => {
                              const isSelected = panel.config[inst.id].selectedSignals.includes(sig);
                              return (
                                <div key={sig} className="flex items-center gap-1 text-[10px] bg-slate-950/50 rounded px-1 py-0.5">
                                  <input type="checkbox" className="cursor-pointer accent-blue-500 flex-none w-3 h-3 m-0" checked={isSelected} onChange={() => updateInstanceSignals(panel.id, inst.id, sig)} />
                                  {isSelected && (
                                    <input type="color" className="w-3 h-3 p-0 border-0 cursor-pointer flex-none rounded appearance-none block bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded" value={panel.config[inst.id].customSignalColors?.[sig] || panel.config[inst.id].customBaseColor || inst.color} onChange={(e) => updatePanelSignalColor(panel.id, inst.id, sig, e.target.value)} />
                                  )}
                                  {isSelected ? (
                                    <input type="text" className="text-[10px] font-medium bg-transparent border-b border-transparent focus:border-slate-500 outline-none text-slate-300 w-full min-w-0" value={panel.config[inst.id].customSignalNames?.[sig] || sig} onChange={(e) => updatePanelSignalName(panel.id, inst.id, sig, e.target.value)} placeholder={sig} />
                                  ) : (
                                    <span className="text-slate-600 flex-1 truncate select-none">{sig}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          {isEditor && (
            <button onClick={() => removePanel(panel.id)} className="p-1 px-1.5 text-xs text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors" title="Close Panel">✕</button>
          )}
        </div>
      </div>
      <div className={`flex-1 min-h-0 w-full relative z-10 ${['WAVEFORM', 'GUYTON_RIGHT', 'GUYTON_LEFT'].includes(panel.type) ? '-mt-6' : ''} ${panel.type === 'PVLOOP' ? 'mb-4' : ''}`}>
        {panel.type === 'PVLOOP' && <PVLoopPanel physicsRefs={physicsRefs} instances={instances} config={panel.config} showGuides={panel.showGuides} showLegend={panel.showLegend} />}
        {panel.type === 'WAVEFORM' && <WaveformPanel physicsRefs={physicsRefs} instances={instances} timeWindow={panel.timeWindow || 10000} config={panel.config} showLegend={panel.showLegend} />}
        {panel.type === 'METRICS' && <MetricsPanel physicsRefs={physicsRefs} instances={instances} config={panel.config} />}
        {panel.type === 'CONTROLS' && <Controls isPaneMode paneConfig={panel.config} instances={instances} instanceHealth={instanceHealth} activeInstanceId={activeInstanceId} setActiveInstanceId={setActiveInstanceId} updateInstanceParams={updateInstanceParams} updateInstanceKnobs={updateInstanceKnobs} updateInstanceVolume={updateInstanceVolume} updateInstanceColor={updateInstanceColor} addInstance={addInstance} removeInstance={removeInstance} timeScale={timeScale} setTimeScale={setTimeScale} isPlaying={isPlaying} togglePlay={togglePlay} addPanel={addPanel} />}
        {(panel.type === 'GUYTON_RIGHT' || panel.type === 'GUYTON_LEFT') && <GuytonPanel physicsRefs={physicsRefs} instances={instances} config={panel.config} type={panel.type} />}
        {panel.type === 'NOTE' && (
          <ErrorBoundary>
            <NotePanel
              key={`${noteCaseKey}:${panel.id}`}
              mode={noteMode}
              content={notes[panel.id]}
              onChange={(blocks) => onNoteChange(panel.id, blocks)}
            />
          </ErrorBoundary>
        )}
      </div>
    </div>
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
  onPanelsChange,
  layoutEditable,
  setLayoutEditable,
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
  const canEditLayout = !isMobile;

  const renderPanel = (panel: PanelDef, isEditor: boolean) => (
    <PanelCard
      key={panel.id}
      panel={panel}
      isMobile={isMobile}
      isEditor={isEditor}
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
    />
  );

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-950 p-2">
        {authoringMode && publishedLesson && (
            <div className="mb-2 flex flex-col sm:flex-row sm:items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                <span className="font-bold">Share URL</span>
                <a href={publishedLesson.url} className="min-w-0 flex-1 truncate hover:text-emerald-50 transition-colors">
                    {publishedLesson.url}
                </a>
                <button onClick={copyShareUrl} className="self-start sm:self-auto rounded bg-emerald-500/15 px-2 py-1 font-bold text-emerald-100 hover:bg-emerald-500/25 transition-colors">
                    Copy
                </button>
            </div>
        )}
        {authoringMode && <LessonAuthoring instances={instances} stepsDraft={stepsDraft} setStepsDraft={setStepsDraft} />}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800 bg-slate-900/70 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Layout</span>
            <button
              type="button"
              disabled={!canEditLayout}
              onClick={() => setLayoutEditable((open) => !open)}
              className={`rounded px-3 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                layoutEditable
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {layoutEditable ? 'Done editing' : 'Edit layout'}
            </button>
          </div>
          {layoutEditable && (
            <div className="flex flex-wrap items-center gap-1">
              {(Object.keys(LAYOUT_PRESETS) as LayoutPresetName[]).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onPanelsChange(applyPresetGeometry(panels, name))}
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:border-slate-500 hover:text-slate-100"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
        {layoutEditable && canEditLayout ? (
          <Suspense fallback={<div className="mt-2 rounded border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">Loading layout editor...</div>}>
            <PanelGridEditor
              panels={presenterPanels}
              rowHeight={EDITOR_ROW_HEIGHT}
              onPanelsChange={onPanelsChange}
              renderPanel={(panel) => renderPanel(panel, true)}
            />
          </Suspense>
        ) : (
          <div
            className="grid grid-cols-12 gap-2 pb-20 mt-2"
            style={{ gridAutoRows: `${EDITOR_ROW_HEIGHT}px` }}
          >
            {presenterPanels.map((panel) => renderPanel(panel, false))}
          </div>
        )}
    </main>
  );
}
