import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_PARAMS } from './constants';
import { SimulationParams, SimInstance, PhysicsRefState, PanelDef, PanelType, PanelInstanceConfig, ChamberId, SignalType, MetricType } from './types';
import { ModelCore } from './engine/ModelCore';
import { SimSample } from './engine/protocol';
import { stableElastanceBaseline, experimentalActiveStressCandidate } from './engine/presets';
import { Controls } from './components/Controls';
import { ScenarioManager } from './components/ScenarioManager';
import { PVLoopPanel, WaveformPanel, MetricsPanel, GuytonPanel } from './components/Charts';
import { NotePanel } from './components/NotePanel';

import { ErrorBoundary } from './components/ErrorBoundary';

// Colors for instances
const INSTANCE_COLORS = ['#a855f7', '#f472b6', '#22c55e', '#38bdf8', '#fbbf24'];

const ALL_CHAMBERS: ChamberId[] = ['LV', 'LA', 'RV', 'RA'];
const ALL_SIGNALS: SignalType[] = ['LVP', 'AoP', 'LAP', 'RVP', 'PAP', 'RAP', 'QAo', 'QMV', 'QPA', 'QTV'];
const ALL_METRICS: MetricType[] = ['ABP', 'CVP', 'PAP', 'PCWP', 'SV', 'CO', 'LVEF'];
const ALL_CONTROL_GROUPS: string[] = ['Global', 'ventricles', 'atria', 'vascular', 'valves', 'resp', 'advanced'];

function Workbench() {
  // --- State ---
  const [timeScale, setTimeScale] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  
  // Instance Management
  const [instances, setInstances] = useState<SimInstance[]>([
      { 
          id: '1', name: 'Heart A', color: INSTANCE_COLORS[0], 
          params: { ...DEFAULT_PARAMS }, 
          targetVolume: 5600, 
          isVisible: true 
      }
  ]);
  const [activeInstanceId, setActiveInstanceId] = useState<string>('1');
  const [isScenarioManagerOpen, setIsScenarioManagerOpen] = useState<boolean>(false);

  // --- Panel Management State ---
  const [panels, setPanels] = useState<PanelDef[]>([
      {
          id: 'p_note', type: 'NOTE', title: 'Interactive Notes', w: 4, h: 10,
          config: {},
          isSettingsOpen: false
      },
      {
          id: 'p1', type: 'WAVEFORM', title: 'Waveforms', w: 5, h: 6,
          config: { '1': { visible: true, selectedSignals: ['LVP', 'AoP'] } },
          isSettingsOpen: false, timeWindow: 5000
      },
      {
          id: 'p2', type: 'PVLOOP', title: 'PV Loop', w: 3, h: 6,
          config: { '1': { visible: true, selectedSignals: ['LV'] } },
          isSettingsOpen: false, showGuides: true
      },
      {
          id: 'p4', type: 'CONTROLS', title: 'Controls', w: 4, h: 4,
          config: { '1': { visible: true, selectedSignals: ['Global', 'ventricles'] } },
          isSettingsOpen: false
      },
      {
          id: 'p3', type: 'METRICS', title: 'Metrics', w: 4, h: 4,
          config: { '1': { visible: true, selectedSignals: ['ABP', 'CO', 'CVP'] } },
          isSettingsOpen: false
      }
  ]);

  // --- Refs for Physics Loop ---
  const timeScaleRef = useRef(timeScale);
  const isPlayingRef = useRef(isPlaying);
  const physicsRefs = useRef<Map<string, PhysicsRefState>>(new Map());
  const instanceRefs = useRef<SimInstance[]>(instances);
  
  // Physics Timing Refs
  const lastFrameTimeRef = useRef<number>(0);

  useEffect(() => { timeScaleRef.current = timeScale; }, [timeScale]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { instanceRefs.current = instances; }, [instances]);

  // Window Resize Hook for Mobile Detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Init physics refs
  useEffect(() => {
      instances.forEach(inst => {
          if (!physicsRefs.current.has(inst.id)) {
              
              const core = new ModelCore(inst.params);
              core.initializeVenousPressuresForTargetTBV(inst.targetVolume);
              core.runFor(3.0, 0.001, 120); // pre-settle
              
              let maxT = 0;
              physicsRefs.current.forEach(ref => {
                  if (ref.core.t > maxT) maxT = ref.core.t;
              });
              if (maxT > 0) {
                  core.t = maxT;
              }
              
              physicsRefs.current.set(inst.id, {
                  core,
                  buffer: [], 
                  lastRenderX: 0
              });
              
              setPanels(prev => prev.map(p => {
                 if (p.config[inst.id]) return p;
                 const newConfig = { ...p.config };
                 
                 let defaultSigs: string[] = [];
                 if (p.type === 'PVLOOP') defaultSigs = ['LV'];
                 else if (p.type === 'WAVEFORM') defaultSigs = ['LVP', 'AoP'];
                 else if (p.type === 'METRICS') defaultSigs = ['ABP', 'CO'];
                 else if (p.type === 'GUYTON_RIGHT' || p.type === 'GUYTON_LEFT' || p.type === 'GUYTON_3D') defaultSigs = ['Default'];

                 newConfig[inst.id] = { 
                     visible: true, 
                     selectedSignals: defaultSigs
                 };
                 return { ...p, config: newConfig };
              }));
          }
      });
      const currentIds = new Set(instances.map(i => i.id));
      for (const id of physicsRefs.current.keys()) {
          if (!currentIds.has(id)) physicsRefs.current.delete(id);
      }
  }, [instances]);

  // --- Physics Loop (Delta-Time Based) ---
  useEffect(() => {
    let animationFrameId: number;

    const loop = (now: number) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = now;
      let deltaTimeMs = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      if (!isPlayingRef.current) {
          animationFrameId = requestAnimationFrame(loop);
          return;
      }
      
      if (deltaTimeMs > 100) deltaTimeMs = 100;

      const simSeconds = (deltaTimeMs / 1000) * timeScaleRef.current;
      
      instanceRefs.current.forEach(uiInst => {
          const phys = physicsRefs.current.get(uiInst.id);
          if (!phys) return;
          
          phys.core.setImmediateParameters(uiInst.params);
          
          const samples = phys.core.runFor(simSeconds, 0.001, 120);

          phys.buffer.push(...samples);
          const cutoffTime = phys.core.t - (20000 / 1000); // keep 20s
          while (phys.buffer.length > 0 && phys.buffer[0].t < cutoffTime) {
             phys.buffer.shift();
          }
      });
      
      animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const updateInstanceParams = (id: string, newParams: Partial<SimulationParams>) => {
      setInstances(prev => prev.map(inst => {
          if (inst.id !== id) return inst;
          return { ...inst, params: { ...inst.params, ...newParams } };
      }));
  };
  
  const updateInstanceVolume = (id: string, vol: number) => {
      setInstances(prev => prev.map(inst => 
          inst.id === id ? { ...inst, targetVolume: vol } : inst
      ));
      const pRef = physicsRefs.current.get(id);
      if (pRef) pRef.core.initializeVenousPressuresForTargetTBV(vol);
  }

  const updateInstanceColor = (id: string, color: string) => {
      setInstances(prev => prev.map(inst => 
        inst.id === id ? { ...inst, color: color } : inst
    ));
  }
  
  const addInstance = (sourceId?: string) => {
      const newId = Date.now().toString();
      const color = INSTANCE_COLORS[instances.length % INSTANCE_COLORS.length];
      const sourceInstance = instances.find(i => i.id === (typeof sourceId === 'string' ? sourceId : activeInstanceId));
      const initialParams = sourceInstance ? JSON.parse(JSON.stringify(sourceInstance.params)) : { ...DEFAULT_PARAMS };
      const initialVol = sourceInstance ? sourceInstance.targetVolume : 5600;

      const baseName = sourceInstance ? sourceInstance.name : 'New Scenario';
      const name = `${baseName} (Copy)`;

      setInstances(prev => [...prev, {
          id: newId, 
          name: name,
          color, 
          params: initialParams, 
          targetVolume: initialVol,
          isVisible: true
      }]);
      
      setPanels(prev => prev.map(p => {
          let defaultSigs: string[] = [];
          if (p.type === 'PVLOOP') defaultSigs = ['LV'];
          else if (p.type === 'WAVEFORM') defaultSigs = ['LVP', 'AoP'];
          else if (p.type === 'METRICS') defaultSigs = ['ABP', 'CO'];
          else if (p.type === 'CONTROLS') defaultSigs = ['Global'];
          else if (p.type === 'GUYTON_RIGHT' || p.type === 'GUYTON_LEFT' || p.type === 'GUYTON_3D') defaultSigs = ['Default'];
          
          return {
              ...p,
              config: {
                  ...p.config,
                  [newId]: { visible: true, selectedSignals: defaultSigs }
              }
          };
      }));
      
      setActiveInstanceId(newId);
  };
  
  const removeInstance = (id: string) => {
      setInstances(prev => prev.filter(i => i.id !== id));
      if (activeInstanceId === id) setActiveInstanceId(instances[0]?.id || '');
  };

  const updateInstanceName = (id: string, name: string) => {
      setInstances(prev => prev.map(inst => inst.id === id ? { ...inst, name } : inst));
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const [addingPanelType, setAddingPanelType] = useState<PanelType | null>(null);
  const [addingPanelConfig, setAddingPanelConfig] = useState<Record<string, PanelInstanceConfig>>({});

  const addPanel = (type: PanelType) => {
      const newConfig: Record<string, PanelInstanceConfig> = {};
      instances.forEach(i => {
          let defaultSigs: string[] = [];
          if (type === 'PVLOOP') defaultSigs = ['LV'];
          else if (type === 'WAVEFORM') defaultSigs = ['LVP', 'AoP'];
          else if (type === 'METRICS') defaultSigs = ['ABP', 'CO'];
          else if (type === 'CONTROLS') defaultSigs = ['Global'];
          else if (type === 'GUYTON_RIGHT' || type === 'GUYTON_LEFT' || type === 'GUYTON_3D') defaultSigs = ['Default'];
          newConfig[i.id] = { visible: true, selectedSignals: defaultSigs };
      });
      setAddingPanelConfig(newConfig);
      setAddingPanelType(type);
  };
  
  const confirmAddPanel = () => {
      if (!addingPanelType) return;
      const type = addingPanelType;
      const newPanel: PanelDef = {
          id: Date.now().toString(), type, 
          title: type === 'PVLOOP' ? 'PV Loop' : type === 'WAVEFORM' ? 'Waveforms' : type === 'METRICS' ? 'Metrics' : type === 'CONTROLS' ? 'Controls' : type === 'NOTE' ? 'Interactive Note' : 'Guyton',
          w: type === 'NOTE' ? 6 : type === 'METRICS' ? 4 : type === 'CONTROLS' ? 4 : 6, h: type === 'NOTE' ? 10 : type === 'METRICS' ? 6 : type === 'CONTROLS' ? 10 : 8,
          config: addingPanelConfig, isSettingsOpen: false,
          showGuides: type === 'PVLOOP', timeWindow: type === 'WAVEFORM' ? 5000 : undefined
      };
      setPanels(prev => [...prev, newPanel]);
      setAddingPanelType(null);
  };

  const removePanel = (id: string) => setPanels(prev => prev.filter(p => p.id !== id));
  
  const resizeState = useRef<{ panelId: string, startX: number, startY: number, startW: number, startH: number } | null>(null);
  const startResize = (e: React.MouseEvent, panel: PanelDef) => {
      e.stopPropagation(); e.preventDefault();
      resizeState.current = { panelId: panel.id, startX: e.clientX, startY: e.clientY, startW: panel.w, startH: panel.h };
      document.addEventListener('mousemove', onResizeMove);
      document.addEventListener('mouseup', onResizeEnd);
  };
  const onResizeMove = (e: MouseEvent) => {
      if (!resizeState.current) return;
      const { panelId, startX, startY, startW, startH } = resizeState.current;
      const newW = Math.max(2, Math.min(12, startW + Math.round((e.clientX - startX) / 50))); 
      const newH = Math.max(4, Math.min(20, startH + Math.round((e.clientY - startY) / 50))); 
      setPanels(prev => prev.map(p => p.id === panelId ? { ...p, w: newW, h: newH } : p));
  };
  const onResizeEnd = () => {
      resizeState.current = null;
      document.removeEventListener('mousemove', onResizeMove);
      document.removeEventListener('mouseup', onResizeEnd);
  };

  const toggleSettings = (panelId: string) => setPanels(prev => prev.map(p => p.id === panelId ? { ...p, isSettingsOpen: !p.isSettingsOpen } : { ...p, isSettingsOpen: false }));
  const toggleInstanceVisibility = (panelId: string, instId: string) => setPanels(prev => prev.map(p => p.id === panelId ? { ...p, config: { ...p.config, [instId]: { ...p.config[instId], visible: !p.config[instId].visible } } } : p));
  const updateInstanceSignals = (panelId: string, instId: string, signal: string) => setPanels(prev => prev.map(p => {
      if (p.id !== panelId) return p;
      const currentSigs = new Set(p.config[instId].selectedSignals);
      if (currentSigs.has(signal)) currentSigs.delete(signal); else currentSigs.add(signal);
      return { ...p, config: { ...p.config, [instId]: { ...p.config[instId], selectedSignals: Array.from(currentSigs) } } };
  }));
  const toggleGuides = (panelId: string) => setPanels(prev => prev.map(p => p.id === panelId ? { ...p, showGuides: !p.showGuides } : p));
  const updateTimeWindow = (panelId: string, val: number) => setPanels(prev => prev.map(p => p.id === panelId ? { ...p, timeWindow: val } : p));

  const dragItemRef = useRef<number | null>(null);
  const dragOverItemRef = useRef<number | null>(null);
  const onDragStart = (e: React.DragEvent, index: number) => { dragItemRef.current = index; e.dataTransfer.effectAllowed = "move"; };
  const onDragEnter = (e: React.DragEvent, index: number) => { dragOverItemRef.current = index; };
  const onDragEnd = () => {
    const srcIdx = dragItemRef.current, dstIdx = dragOverItemRef.current;
    if (srcIdx !== null && dstIdx !== null && srcIdx !== dstIdx) {
       setPanels(prev => { const next = [...prev]; next.splice(dstIdx, 0, next.splice(srcIdx, 1)[0]); return next; });
    }
    dragItemRef.current = dragOverItemRef.current = null;
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
      <header className="h-14 bg-slate-900 border-b border-slate-800 z-50 flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-4">
              <h1 className="text-sm font-bold text-slate-300">Workbench Controls</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
               <button onClick={() => setIsScenarioManagerOpen(true)} className="px-3 sm:px-4 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded text-[10px] sm:text-xs font-bold text-slate-300 transition-colors flex items-center gap-2">
                   <span>❖</span> Scenarios ({instances.length})
               </button>
               
               <div className="hidden sm:block h-6 w-px bg-slate-700 mx-1"></div>

               <button onClick={togglePlay} className={`px-3 sm:px-4 py-1.5 rounded text-[10px] sm:text-xs font-bold transition-colors ${isPlaying ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'}`}>
                   {isPlaying ? 'PAUSE' : 'PLAY'}
               </button>
               
               <div className="hidden sm:block h-6 w-px bg-slate-700 mx-1"></div>
               
               <div className="hidden sm:flex items-center gap-2">
                   <span className="text-xs text-slate-400">Speed:</span>
                   <select className="bg-slate-800 border border-slate-700 rounded text-xs px-2 py-1 outline-none text-slate-200" value={timeScale} onChange={(e) => setTimeScale(parseFloat(e.target.value))}>
                       <option value={0.1}>0.1x</option>
                       <option value={0.5}>0.5x</option>
                       <option value={1.0}>1.0x</option>
                       <option value={2.0}>2.0x</option>
                       <option value={5.0}>5.0x</option>
                   </select>
               </div>

               <div className="h-6 w-px bg-slate-700 mx-1"></div>

               <div className="flex items-center gap-1 group relative">
                   <button className="px-2 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] sm:text-xs font-bold text-slate-300 transition-colors flex items-center gap-1 sm:gap-2">
                       <span>+ Pane</span>
                       <span className="text-[8px] sm:text-[10px]">▼</span>
                   </button>
                   <div className="hidden group-hover:block absolute top-full right-0 mt-1 w-40 sm:w-48 bg-slate-800 border border-slate-700 shadow-xl rounded py-1 z-50">
                       <button onClick={() => addPanel('NOTE')} className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-green-300">Notes (Interactive)</button>
                       <button onClick={() => addPanel('PVLOOP')} className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-slate-300">PV Loop</button>
                       <button onClick={() => addPanel('WAVEFORM')} className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-slate-300">Waveforms</button>
                       <button onClick={() => addPanel('METRICS')} className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-slate-300">Metrics</button>
                       <button onClick={() => addPanel('CONTROLS')} className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-blue-300">Controls</button>
                       <div className="h-px bg-slate-700 my-1"></div>
                       <button onClick={() => addPanel('GUYTON_LEFT')} className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-slate-300">Guyton (L)</button>
                       <button onClick={() => addPanel('GUYTON_RIGHT')} className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-slate-300">Guyton (R)</button>
                   </div>
               </div>
          </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-950 p-2">
          <div className="grid grid-cols-12 gap-2 auto-rows-[50px] grid-flow-dense pb-20 mt-2">
              {panels.map((panel, index) => {
                  const gridColStyle = isMobile ? { gridColumn: 'span 12' } : { gridColumn: `span ${panel.w}` };
                  const rowSpan = isMobile ? (panel.type === 'METRICS' ? 5 : 7) : panel.h;

                  return (
                  <div key={panel.id} onDragEnter={(e) => onDragEnter(e, index)} onDragEnd={onDragEnd} onDragOver={(e) => e.preventDefault()} style={{ ...gridColStyle, gridRow: `span ${rowSpan}` }} className={`relative bg-[#0B1120] rounded-xl border border-slate-800 shadow-sm flex flex-col group transition-all ${panel.isSettingsOpen ? 'z-50' : 'z-10'}`}>
                      <div className="flex-none px-3 pt-1.5 pb-0 flex justify-between items-center pointer-events-auto rounded-t-xl z-20 relative">
                            <div draggable={!isMobile} onDragStart={(e) => onDragStart(e, index)} className="flex-1 cursor-move flex items-center group/header">
                                <span className="text-[11px] font-medium text-slate-500 select-none flex items-center gap-1.5 transition-colors group-hover/header:text-slate-400 tracking-wide drop-shadow-md">
                                    <span className="opacity-0 group-hover/header:opacity-40 transition-opacity">⋮⋮</span> {panel.title}
                                </span>
                            </div>
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
                                                            <input type="checkbox" className="cursor-pointer accent-blue-500" checked={panel.config[inst.id]?.visible || false} onChange={() => toggleInstanceVisibility(panel.id, inst.id)} />
                                                            <span className="w-2 h-2 rounded-full" style={{backgroundColor: inst.color}}></span>
                                                            <span className="text-xs font-bold text-slate-300 truncate flex-1">{inst.name}</span>
                                                        </div>
                                                        {panel.config[inst.id]?.visible && (panel.type !== 'GUYTON_RIGHT' && panel.type !== 'GUYTON_LEFT') && (
                                                            <div className="pl-5 grid grid-cols-1 gap-1">
                                                                {((panel.type === 'PVLOOP' ? ALL_CHAMBERS : (panel.type === 'WAVEFORM' ? ALL_SIGNALS : panel.type === 'METRICS' ? ALL_METRICS : ALL_CONTROL_GROUPS))).map(sig => (
                                                                    <div key={sig} className="flex items-center justify-between text-[10px] bg-slate-950/50 rounded px-1 py-0.5">
                                                                        <button onClick={() => updateInstanceSignals(panel.id, inst.id, sig)} className={`flex-1 text-left ${panel.config[inst.id].selectedSignals.includes(sig) ? 'text-slate-200' : 'text-slate-600'}`}>{sig}</button>
                                                                    </div>
                                                                ))}
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
                          {panel.type === 'PVLOOP' && <PVLoopPanel physicsRefs={physicsRefs} instances={instances} config={panel.config} showGuides={panel.showGuides} />}
                          {panel.type === 'WAVEFORM' && <WaveformPanel physicsRefs={physicsRefs} instances={instances} timeWindow={panel.timeWindow || 10000} config={panel.config} />}
                          {panel.type === 'METRICS' && <MetricsPanel physicsRefs={physicsRefs} instances={instances} config={panel.config} />}
                          {panel.type === 'CONTROLS' && <Controls isPaneMode paneConfig={panel.config} instances={instances} activeInstanceId={activeInstanceId} setActiveInstanceId={setActiveInstanceId} updateInstanceParams={updateInstanceParams} updateInstanceVolume={updateInstanceVolume} updateInstanceColor={updateInstanceColor} addInstance={addInstance} removeInstance={removeInstance} timeScale={timeScale} setTimeScale={setTimeScale} isPlaying={isPlaying} togglePlay={togglePlay} addPanel={addPanel} />}
                          {(panel.type === 'GUYTON_RIGHT' || panel.type === 'GUYTON_LEFT') && <GuytonPanel physicsRefs={physicsRefs} instances={instances} config={panel.config} type={panel.type} />}
                          {panel.type === 'NOTE' && <ErrorBoundary><NotePanel /></ErrorBoundary>}
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

      <ScenarioManager 
          isOpen={isScenarioManagerOpen} 
          onClose={() => setIsScenarioManagerOpen(false)} 
          instances={instances} 
          addInstance={addInstance} 
          removeInstance={removeInstance} 
          updateInstanceName={updateInstanceName} 
          updateInstanceColor={updateInstanceColor} 
      />

      {addingPanelType && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-6 w-full max-w-lg">
                  <h2 className="text-lg font-bold text-slate-200 mb-4 tracking-tight">Configure {addingPanelType} Panel</h2>
                  
                  <div className="max-h-[60vh] overflow-y-auto space-y-4 mb-6 custom-scrollbar pr-2">
                       {instances.map(inst => (
                           <div key={inst.id} className="bg-slate-800/50 p-3 rounded border border-slate-700">
                               <div className="flex items-center justify-between mb-2">
                                   <div className="flex items-center gap-3">
                                       <input 
                                         type="checkbox" 
                                         className="w-4 h-4 cursor-pointer accent-blue-500"
                                         checked={addingPanelConfig[inst.id]?.visible || false} 
                                         onChange={() => setAddingPanelConfig(prev => ({
                                             ...prev, [inst.id]: { ...prev[inst.id], visible: !prev[inst.id]?.visible }
                                         }))} 
                                       />
                                       <div className="flex items-center gap-2">
                                           <span className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: inst.color}}></span>
                                           <span className="text-sm font-bold text-slate-300">{inst.name}</span>
                                       </div>
                                   </div>
                               </div>
                               {addingPanelConfig[inst.id]?.visible && addingPanelType !== 'GUYTON_RIGHT' && addingPanelType !== 'GUYTON_LEFT' && (
                                   <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-700/50">
                                        {((addingPanelType === 'PVLOOP' ? ALL_CHAMBERS : (addingPanelType === 'WAVEFORM' ? ALL_SIGNALS : addingPanelType === 'METRICS' ? ALL_METRICS : ALL_CONTROL_GROUPS))).map(sig => {
                                             const isSelected = addingPanelConfig[inst.id]?.selectedSignals.includes(sig);
                                             return (
                                                <button 
                                                    key={sig} 
                                                    onClick={() => {
                                                        setAddingPanelConfig(prev => {
                                                            const currentSigs = new Set(prev[inst.id].selectedSignals);
                                                            if (currentSigs.has(sig)) currentSigs.delete(sig); else currentSigs.add(sig);
                                                            return { ...prev, [inst.id]: { ...prev[inst.id], selectedSignals: Array.from(currentSigs) } };
                                                        });
                                                    }}
                                                    className={`py-1.5 px-2 text-xs rounded transition-colors text-center font-mono ${isSelected ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50' : 'bg-slate-950 text-slate-500 border border-slate-800 hover:border-slate-600'}`}
                                                >
                                                    {sig}
                                                </button>
                                             );
                                        })}
                                   </div>
                               )}
                           </div>
                       ))}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                      <button onClick={() => setAddingPanelType(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
                      <button onClick={confirmAddPanel} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded shadow transition-colors">Add Panel</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}

export default Workbench;
