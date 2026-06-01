import React from 'react';
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

interface PanelGridProps {
  authoringMode: boolean;
  publishedLesson: { id: string; title: string; url: string } | null;
  copyShareUrl: () => void;
  instances: SimInstance[];
  stepsDraft: LessonStep[];
  setStepsDraft: React.Dispatch<React.SetStateAction<LessonStep[]>>;
  panels: PanelDef[];
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
  startResize: (e: React.MouseEvent, panel: PanelDef) => void;
  toggleSettings: (panelId: string) => void;
  toggleInstanceVisibility: (panelId: string, instId: string) => void;
  updateInstanceSignals: (panelId: string, instId: string, signal: string) => void;
  toggleGuides: (panelId: string) => void;
  updateTimeWindow: (panelId: string, val: number) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragEnter: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  noteCaseKey: string;
  notes: Record<string, NoteContent>;
  onNoteChange: (panelId: string, blocks: NoteContent) => void;
  chambers: ChamberId[];
  signals: SignalType[];
  metrics: MetricType[];
  controlGroups: string[];
}

export function PanelGrid({
  authoringMode,
  publishedLesson,
  copyShareUrl,
  instances,
  stepsDraft,
  setStepsDraft,
  panels,
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
  startResize,
  toggleSettings,
  toggleInstanceVisibility,
  updateInstanceSignals,
  toggleGuides,
  updateTimeWindow,
  onDragStart,
  onDragEnter,
  onDragEnd,
  noteCaseKey,
  notes,
  onNoteChange,
  chambers,
  signals,
  metrics,
  controlGroups,
}: PanelGridProps) {
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
        <div className="grid grid-cols-12 gap-2 auto-rows-[50px] grid-flow-dense pb-20 mt-2">
            {panels.map((panel, index) => {
                const gridColStyle = isMobile ? { gridColumn: 'span 12' } : { gridColumn: `span ${panel.w}` };
                const rowSpan = isMobile ? (panel.type === 'METRICS' ? 5 : 7) : panel.h;
                const noteMode = noteModes[panel.id] ?? 'read';

                return (
                <div key={panel.id} onDragEnter={(e) => onDragEnter(e, index)} onDragEnd={onDragEnd} onDragOver={(e) => e.preventDefault()} style={{ ...gridColStyle, gridRow: `span ${rowSpan}` }} className={`relative bg-[#0B1120] rounded-xl border border-slate-800 shadow-sm flex flex-col group transition-all ${panel.isSettingsOpen ? 'z-50' : 'z-10'}`}>
                    <div className="flex-none px-3 pt-1.5 pb-0 flex justify-between items-center pointer-events-auto rounded-t-xl z-20 relative">
                          <div draggable={!isMobile} onDragStart={(e) => onDragStart(e, index)} className="flex-1 cursor-move flex items-center group/header">
                              <span className="text-[11px] font-medium text-slate-500 select-none flex items-center gap-1.5 transition-colors group-hover/header:text-slate-400 tracking-wide drop-shadow-md">
                                  <span className="opacity-0 group-hover/header:opacity-40 transition-opacity">⋮⋮</span>
                                  {panel.title}
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
                                          <div 
                                              className="absolute top-full right-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-3 z-50 cursor-default"
                                          >
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
                              <button onClick={() => removePanel(panel.id)} className="p-1 px-1.5 text-xs text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors" title="Close Panel">✕</button>
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
                    {!isMobile && (
                      <div onMouseDown={(e) => startResize(e, panel)} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 z-40 group/handle">
                          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-slate-600 group-hover/handle:border-b-blue-500"></div>
                      </div>
                    )}
                </div>
            )})}
        </div>
    </main>
  );
}
