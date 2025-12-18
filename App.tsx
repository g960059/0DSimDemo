import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_STATE_VECTOR, INITIAL_TIME, DEFAULT_PARAMS } from './constants';
import { SimulationParams, SimulationOutput, SimInstance, PhysicsRefState, PanelDef, PanelType, PanelInstanceConfig, ChamberId, SignalType, MetricType } from './types';
import { stepRK4, getTotalVolume } from './services/physics';
import { Controls } from './components/Controls';
import { PVLoopPanel, WaveformPanel, MetricsPanel, GuytonPanel } from './components/Charts';

// Colors for instances
const INSTANCE_COLORS = ['#a855f7', '#f472b6', '#22c55e', '#38bdf8', '#fbbf24'];

const ALL_CHAMBERS: ChamberId[] = ['LV', 'LA', 'RV', 'RA'];
const ALL_SIGNALS: SignalType[] = ['Plv', 'AoP', 'Pla', 'Prv', 'PAP', 'Pra'];
const ALL_METRICS: MetricType[] = ['ABP', 'CVP', 'PAP', 'PCWP', 'SV', 'CO', 'Ea_LV'];

function App() {
  // --- State ---
  const [timeScale, setTimeScale] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  
  // Instance Management
  const [instances, setInstances] = useState<SimInstance[]>([
      { 
          id: '1', name: 'Heart A', color: INSTANCE_COLORS[0], 
          params: { ...DEFAULT_PARAMS }, 
          targetVolume: getTotalVolume(INITIAL_STATE_VECTOR), 
          isVisible: true 
      }
  ]);
  const [activeInstanceId, setActiveInstanceId] = useState<string>('1');

  // --- Panel Management State ---
  // Initial Layout: Guyton (Right), Guyton (Left), Metrics
  const [panels, setPanels] = useState<PanelDef[]>([
      {
          id: 'p1', type: 'GUYTON_RIGHT', title: 'Guyton (Right)', w: 6, h: 8,
          config: { '1': { visible: true, selectedSignals: ['Default'] } },
          isSettingsOpen: false
      },
      {
          id: 'p2', type: 'GUYTON_LEFT', title: 'Guyton (Left)', w: 6, h: 8,
          config: { '1': { visible: true, selectedSignals: ['Default'] } },
          isSettingsOpen: false
      },
      {
          id: 'p3', type: 'METRICS', title: 'Metrics', w: 12, h: 4,
          config: { '1': { visible: true, selectedSignals: ['ABP', 'CO', 'CVP', 'PCWP', 'SV', 'Ea_LV'] } },
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
  const residueTimeRef = useRef<number>(0);

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
              let syncTime = INITIAL_TIME;
              if (physicsRefs.current.size > 0) {
                  for (const p of physicsRefs.current.values()) {
                      if (p.t > syncTime) syncTime = p.t;
                  }
              }
              physicsRefs.current.set(inst.id, {
                  t: syncTime, 
                  y: [...INITIAL_STATE_VECTOR], 
                  buffer: [], 
                  lastRenderX: 0,
                  activeParams: { ...inst.params } 
              });
              
              setPanels(prev => prev.map(p => {
                 if (p.config[inst.id]) return p;
                 const newConfig = { ...p.config };
                 
                 // Default config for new instance based on panel type
                 let defaultSigs: string[] = [];
                 if (p.type === 'PVLOOP') defaultSigs = ['LV'];
                 else if (p.type === 'WAVEFORM') defaultSigs = ['Plv', 'AoP'];
                 else if (p.type === 'METRICS') defaultSigs = ['ABP', 'CO'];
                 else if (p.type === 'GUYTON_RIGHT' || p.type === 'GUYTON_LEFT' || p.type === 'GUYTON_3D') defaultSigs = ['default'];

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
    const PHYSICS_DT = 2.0; // Fixed physics step size (ms)
    const MAX_STEPS_PER_FRAME = 20; // Prevent spiral of death on lag spikes

    const loop = (now: number) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = now;
      const deltaTimeMs = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      if (!isPlayingRef.current) {
          residueTimeRef.current = 0; // Reset accumulated time if paused
          animationFrameId = requestAnimationFrame(loop);
          return;
      }

      // Add time to accumulator, scaled by playback speed
      residueTimeRef.current += deltaTimeMs * timeScaleRef.current;
      
      // Calculate how many fixed steps fit in the accumulated time
      let stepsToRun = Math.floor(residueTimeRef.current / PHYSICS_DT);
      
      // Prevent freeze if tab was backgrounded or huge lag spike
      if (stepsToRun > MAX_STEPS_PER_FRAME) {
          stepsToRun = MAX_STEPS_PER_FRAME;
          residueTimeRef.current = 0; // Reset residue to avoid endless catch-up
      } else {
          residueTimeRef.current -= stepsToRun * PHYSICS_DT;
      }
      
      for (let i = 0; i < stepsToRun; i++) {
         instanceRefs.current.forEach(uiInst => {
             const phys = physicsRefs.current.get(uiInst.id);
             if (!phys) return;
             
             const T = 60000.0 / phys.activeParams.HR; 
             const prevPhase = (phys.t - PHYSICS_DT) % T;
             const currPhase = phys.t % T;
             
             const isEndDiastole = currPhase < prevPhase;
             const tMax = phys.activeParams.LV_Tmax;
             const isEndSystole = prevPhase < tMax && currPhase >= tMax;

             if (isEndDiastole) {
                 const p = uiInst.params;
                 const ap = phys.activeParams;
                 
                 ap.HR = p.HR;
                 
                 ap.Ras = p.Ras; ap.Rcs = p.Rcs; ap.Rvs = p.Rvs; ap.Ras_prox = p.Ras_prox; ap.Rda = p.Rda;
                 ap.Rap = p.Rap; ap.Rvp = p.Rvp; ap.Rap_prox = p.Rap_prox; ap.Rcp = p.Rcp;
                 ap.Rmv = p.Rmv; ap.Rtv = p.Rtv;

                 ap.Cas = p.Cas; ap.Cvs = p.Cvs; ap.Cas_prox = p.Cas_prox; ap.Cda = p.Cda;
                 ap.Cap = p.Cap; ap.Cvp = p.Cvp; ap.Cap_prox = p.Cap_prox;

                 ap.LV_Ees = p.LV_Ees; ap.LV_V0 = p.LV_V0;
                 ap.RV_Ees = p.RV_Ees; ap.RV_V0 = p.RV_V0;
                 ap.LA_Ees = p.LA_Ees; ap.LA_V0 = p.LA_V0;
                 ap.RA_Ees = p.RA_Ees; ap.RA_V0 = p.RA_V0;
                 
                 const currentTotal = getTotalVolume(phys.y);
                 const targetTotal = uiInst.targetVolume;
                 const diff = targetTotal - currentTotal;
                 const maxDelta = 500; 
                 const delta = Math.max(-maxDelta, Math.min(maxDelta, diff));
                 
                 if (Math.abs(delta) > 1.0) {
                     phys.y[0] += delta;
                 }
             }

             if (isEndSystole) {
                 const p = uiInst.params;
                 const ap = phys.activeParams;

                 ap.LV_alpha = p.LV_alpha; ap.LV_beta = p.LV_beta; ap.LV_tau = p.LV_tau; ap.LV_Tmax = p.LV_Tmax;
                 ap.RV_alpha = p.RV_alpha; ap.RV_beta = p.RV_beta; ap.RV_tau = p.RV_tau; ap.RV_Tmax = p.RV_Tmax;
                 ap.LA_alpha = p.LA_alpha; ap.LA_beta = p.LA_beta; ap.LA_tau = p.LA_tau;
                 ap.RA_alpha = p.RA_alpha; ap.RA_beta = p.RA_beta; ap.RA_tau = p.RA_tau;
             }
             
             const { tNext, yNext, aux } = stepRK4(phys.t, phys.y, PHYSICS_DT, phys.activeParams);
             phys.t = tNext;
             phys.y = yNext;

             const bufferRequiredMs = 21000;
             const output: SimulationOutput = {
                t: tNext,
                y: {
                    Qvs: yNext[0], Qas: yNext[1], Qap: yNext[2], Qvp: yNext[3],
                    Qlv: yNext[4], Qla: yNext[5], Qrv: yNext[6], Qra: yNext[7],
                    Qas_prox: yNext[8], Qda: yNext[9], Qap_prox: yNext[10], Qtube: yNext[11]
                },
                aux
            };
            phys.buffer.push(output);
            const cutoffTime = tNext - bufferRequiredMs;
            if (phys.buffer.length > 0 && phys.buffer[0].t < cutoffTime) {
                phys.buffer.shift();
            }
         });
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // --- Handlers ---
  const updateInstanceParams = (id: string, newParams: Partial<SimulationParams>) => {
      setInstances(prev => prev.map(inst => 
          inst.id === id ? { ...inst, params: { ...inst.params, ...newParams } } : inst
      ));
  };
  
  const updateInstanceVolume = (id: string, vol: number) => {
      setInstances(prev => prev.map(inst => 
          inst.id === id ? { ...inst, targetVolume: vol } : inst
      ));
  }

  const updateInstanceColor = (id: string, color: string) => {
      setInstances(prev => prev.map(inst => 
        inst.id === id ? { ...inst, color: color } : inst
    ));
  }
  const addInstance = () => {
      const newId = Date.now().toString();
      const color = INSTANCE_COLORS[instances.length % INSTANCE_COLORS.length];
      
      // Clone params from active instance or use default
      const sourceInstance = instances.find(i => i.id === activeInstanceId);
      const initialParams = sourceInstance ? JSON.parse(JSON.stringify(sourceInstance.params)) : { ...DEFAULT_PARAMS };
      const initialVol = sourceInstance ? sourceInstance.targetVolume : getTotalVolume(INITIAL_STATE_VECTOR);

      setInstances(prev => [...prev, {
          id: newId, name: `Heart ${String.fromCharCode(65 + instances.length)}`,
          color, 
          params: initialParams, 
          targetVolume: initialVol,
          isVisible: true
      }]);
      setActiveInstanceId(newId);
  };
  const removeInstance = (id: string) => {
      setInstances(prev => prev.filter(i => i.id !== id));
      if (activeInstanceId === id) setActiveInstanceId(instances[0]?.id || '');
  };

  // --- Panel Handlers ---
  const addPanel = (type: PanelType) => {
      const newConfig: PanelInstanceConfig = {};
      instances.forEach(i => {
          let defaultSigs: string[] = [];
          if (type === 'PVLOOP') defaultSigs = ['LV'];
          else if (type === 'WAVEFORM') defaultSigs = ['Plv', 'AoP'];
          else if (type === 'METRICS') defaultSigs = ['ABP', 'CO'];
          else if (type === 'GUYTON_RIGHT' || type === 'GUYTON_LEFT' || type === 'GUYTON_3D') defaultSigs = ['Default'];

          newConfig[i.id] = {
              visible: true,
              selectedSignals: defaultSigs
          };
      });

      let title = 'Panel';
      if (type === 'PVLOOP') title = 'PV Loop';
      else if (type === 'WAVEFORM') title = 'Waveforms';
      else if (type === 'METRICS') title = 'Metrics';
      else if (type === 'GUYTON_RIGHT') title = 'Guyton (Right/Sys)';
      else if (type === 'GUYTON_LEFT') title = 'Guyton (Left/Pulm)';
      else if (type === 'GUYTON_3D') title = 'Guyton 3D (Bi-V)';

      const newPanel: PanelDef = {
          id: Date.now().toString(),
          type,
          title,
          w: type === 'METRICS' ? 4 : 6, 
          h: type === 'METRICS' ? 6 : 8,
          config: newConfig,
          showGuides: type === 'PVLOOP',
          timeWindow: type === 'WAVEFORM' ? 5000 : undefined,
          isSettingsOpen: false
      };
      setPanels(prev => [...prev, newPanel]);
      // On mobile, close sidebar after adding panel
      if (isMobile) setIsSidebarOpen(false);
  };

  const removePanel = (id: string) => {
      setPanels(prev => prev.filter(p => p.id !== id));
  };

  const resizeState = useRef<{ panelId: string, startX: number, startY: number, startW: number, startH: number } | null>(null);

  const startResize = (e: React.MouseEvent, panel: PanelDef) => {
      e.stopPropagation();
      e.preventDefault();
      resizeState.current = {
          panelId: panel.id,
          startX: e.clientX,
          startY: e.clientY,
          startW: panel.w,
          startH: panel.h
      };
      document.addEventListener('mousemove', onResizeMove);
      document.addEventListener('mouseup', onResizeEnd);
  };

  const onResizeMove = (e: MouseEvent) => {
      if (!resizeState.current) return;
      const { panelId, startX, startY, startW, startH } = resizeState.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const wDelta = Math.round(dx / 50);
      const hDelta = Math.round(dy / 50);
      const newW = Math.max(2, Math.min(12, startW + wDelta)); 
      const newH = Math.max(4, Math.min(20, startH + hDelta)); 

      setPanels(prev => prev.map(p => 
          p.id === panelId ? { ...p, w: newW, h: newH } : p
      ));
  };

  const onResizeEnd = () => {
      resizeState.current = null;
      document.removeEventListener('mousemove', onResizeMove);
      document.removeEventListener('mouseup', onResizeEnd);
  };


  // --- Config Logic ---
  const toggleSettings = (panelId: string) => {
      setPanels(prev => prev.map(p => 
        p.id === panelId ? { ...p, isSettingsOpen: !p.isSettingsOpen } : { ...p, isSettingsOpen: false }
      ));
  };

  const toggleInstanceVisibility = (panelId: string, instId: string) => {
      setPanels(prev => prev.map(p => {
          if (p.id !== panelId) return p;
          const prevCfg = p.config[instId];
          return {
              ...p,
              config: {
                  ...p.config,
                  [instId]: { ...prevCfg, visible: !prevCfg.visible }
              }
          };
      }));
  };

  const updateInstanceSignals = (panelId: string, instId: string, signal: string) => {
      setPanels(prev => prev.map(p => {
          if (p.id !== panelId) return p;
          const prevCfg = p.config[instId];
          const currentSigs = new Set(prevCfg.selectedSignals);
          if (currentSigs.has(signal)) currentSigs.delete(signal); else currentSigs.add(signal);
          
          return {
              ...p,
              config: {
                  ...p.config,
                  [instId]: { ...prevCfg, selectedSignals: Array.from(currentSigs) }
              }
          };
      }));
  };

  const updateCustomColor = (panelId: string, instId: string, signal: string, color: string) => {
      setPanels(prev => prev.map(p => {
          if (p.id !== panelId) return p;
          const prevCfg = p.config[instId];
          return {
              ...p,
              config: {
                  ...p.config,
                  [instId]: { 
                      ...prevCfg, 
                      customColors: { ...prevCfg.customColors, [signal]: color } 
                  }
              }
          };
      }));
  }
  
  const toggleGuides = (panelId: string) => {
     setPanels(prev => prev.map(p => p.id === panelId ? { ...p, showGuides: !p.showGuides } : p));
  }

  const updateTimeWindow = (panelId: string, val: number) => {
      setPanels(prev => prev.map(p => p.id === panelId ? { ...p, timeWindow: val } : p));
  }

  // --- Drag & Drop ---
  const dragItemRef = useRef<number | null>(null);
  const dragOverItemRef = useRef<number | null>(null);

  const onDragStart = (e: React.DragEvent, index: number) => {
    dragItemRef.current = index;
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragEnter = (e: React.DragEvent, index: number) => {
    dragOverItemRef.current = index;
  };
  const onDragEnd = () => {
    const srcIdx = dragItemRef.current;
    const dstIdx = dragOverItemRef.current;
    if (srcIdx !== null && dstIdx !== null && srcIdx !== dstIdx) {
       setPanels(prev => {
           const next = [...prev];
           const [removed] = next.splice(srcIdx, 1);
           next.splice(dstIdx, 0, removed);
           return next;
       });
    }
    dragItemRef.current = null;
    dragOverItemRef.current = null;
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 z-50 flex items-center px-4 justify-between">
          <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            HemoSim 0D
          </h1>
          <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="text-slate-300 p-2 hover:bg-slate-800 rounded"
          >
             {isSidebarOpen ? '✕' : '☰'}
          </button>
      </div>

      {/* Sidebar - Desktop: Fixed left, Mobile: Fixed Overlay (Right side) */}
      <aside 
        className={`
            fixed inset-y-0 right-0 bg-slate-900 overflow-y-auto z-40 shadow-xl transition-transform duration-300 ease-in-out w-80
            md:border-r md:border-slate-800
            ${isMobile ? 'top-14 border-l border-slate-800' : 'top-0'}
            ${isMobile && !isSidebarOpen ? 'translate-x-full' : 'translate-x-0'}
            md:relative md:translate-x-0 md:top-0 md:left-0 md:right-auto
        `}
      >
        <div className="p-5 pb-20">
          {!isMobile && (
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-6">
                HemoSim 0D
              </h1>
          )}
          <Controls 
            instances={instances}
            activeInstanceId={activeInstanceId}
            setActiveInstanceId={setActiveInstanceId}
            updateInstanceParams={updateInstanceParams}
            updateInstanceVolume={updateInstanceVolume}
            updateInstanceColor={updateInstanceColor}
            addInstance={addInstance}
            removeInstance={removeInstance}
            
            timeScale={timeScale} setTimeScale={setTimeScale}
            isPlaying={isPlaying} togglePlay={() => setIsPlaying(!isPlaying)}
            
            addPanel={addPanel}
          />
        </div>
      </aside>
      
      {/* Mobile Overlay Backdrop */}
      {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30" 
            onClick={() => setIsSidebarOpen(false)}
          />
      )}

      <main className={`flex-1 h-full overflow-y-auto overflow-x-hidden bg-slate-950 p-2 ${isMobile ? 'pt-16' : ''}`}>
          {/* Grid Container */}
          <div className="grid grid-cols-12 gap-2 auto-rows-[50px] grid-flow-dense pb-20">
              {panels.map((panel, index) => {
                  // Mobile: Force span 12 (full width). Desktop: Use panel.w
                  const gridColStyle = isMobile ? { gridColumn: 'span 12' } : { gridColumn: `span ${panel.w}` };
                  // Mobile: Use fixed rows for better aspect ratio (Metrics smaller, Charts larger). Desktop: Use panel.h
                  const mobileRowSpan = panel.type === 'METRICS' ? 5 : 7;
                  const rowSpan = isMobile ? mobileRowSpan : panel.h;

                  return (
                  <div 
                    key={panel.id} 
                    draggable={!isMobile} // Disable drag on mobile to prevent scroll issues
                    onDragStart={(e) => onDragStart(e, index)}
                    onDragEnter={(e) => onDragEnter(e, index)}
                    onDragEnd={onDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    style={{ ...gridColStyle, gridRow: `span ${rowSpan}` }}
                    className="relative bg-slate-900/50 rounded-lg border border-slate-800 shadow-inner flex flex-col overflow-visible group hover:border-slate-600 transition-colors"
                  >
                      {/* Panel Header */}
                      <div className="absolute top-2 left-2 z-30 flex gap-2 items-center pointer-events-auto">
                           <div className="bg-slate-950/90 px-2 py-1 rounded border border-slate-700 backdrop-blur-sm shadow-sm flex items-center gap-2 cursor-move">
                                <span className="text-xs font-bold text-slate-300 select-none">⋮⋮ {panel.title}</span>
                                <div className="h-3 w-[1px] bg-slate-700 mx-1"></div>
                                
                                {/* Settings Toggle (Click-based) */}
                                <div className="relative">
                                    <button 
                                        onClick={() => toggleSettings(panel.id)}
                                        className={`text-[10px] px-1 flex items-center gap-1 rounded hover:bg-slate-800 ${panel.isSettingsOpen ? 'text-blue-400 bg-slate-800' : 'text-slate-400'}`}
                                    >
                                        <span className="w-3 h-3 border border-current rounded-sm flex items-center justify-center">
                                            <span className="text-[8px]">⚙</span>
                                        </span>
                                    </button>
                                    
                                    {/* Dropdown Content */}
                                    {panel.isSettingsOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded shadow-2xl p-3 z-50">
                                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">Configuration</span>
                                                <button onClick={() => toggleSettings(panel.id)} className="text-xs text-slate-400 hover:text-white">✕</button>
                                            </div>

                                            {/* Panel Specific Settings */}
                                            {panel.type === 'PVLOOP' && (
                                                <div className="mb-2 pb-2 border-b border-slate-800 flex items-center gap-2">
                                                    <input type="checkbox" checked={panel.showGuides} onChange={() => toggleGuides(panel.id)} />
                                                    <span className="text-xs text-slate-300">Show Guides</span>
                                                </div>
                                            )}
                                            {panel.type === 'WAVEFORM' && (
                                                <div className="mb-2 pb-2 border-b border-slate-800">
                                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                                        <span>Window</span>
                                                        <span>{(panel.timeWindow || 10000) / 1000}s</span>
                                                    </div>
                                                    <input 
                                                        type="range" min={2000} max={20000} step={1000} 
                                                        value={panel.timeWindow || 10000}
                                                        onChange={(e) => updateTimeWindow(panel.id, parseFloat(e.target.value))}
                                                        className="w-full h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-blue-500"
                                                    />
                                                </div>
                                            )}

                                            <div className="max-h-64 overflow-y-auto space-y-3 custom-scrollbar">
                                                {instances.map(inst => (
                                                    <div key={inst.id}>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={panel.config[inst.id]?.visible || false}
                                                                onChange={() => toggleInstanceVisibility(panel.id, inst.id)}
                                                            />
                                                            <span className="w-2 h-2 rounded-full" style={{backgroundColor: inst.color}}></span>
                                                            <span className="text-xs font-bold text-slate-300 truncate flex-1">{inst.name}</span>
                                                        </div>
                                                        {/* Sub Signals & Colors */}
                                                        {panel.config[inst.id]?.visible && (panel.type !== 'GUYTON_RIGHT' && panel.type !== 'GUYTON_LEFT' && panel.type !== 'GUYTON_3D') && (
                                                            <div className="pl-5 grid grid-cols-1 gap-1">
                                                                {((panel.type === 'PVLOOP' ? ALL_CHAMBERS : (panel.type === 'WAVEFORM' ? ALL_SIGNALS : ALL_METRICS))).map(sig => {
                                                                    const isSelected = panel.config[inst.id].selectedSignals.includes(sig);
                                                                    const customColor = panel.config[inst.id].customColors?.[sig];
                                                                    
                                                                    return (
                                                                    <div key={sig} className="flex items-center justify-between text-[10px] bg-slate-950/50 rounded px-1 py-0.5">
                                                                        <button 
                                                                            onClick={() => updateInstanceSignals(panel.id, inst.id, sig)}
                                                                            className={`flex-1 text-left ${isSelected ? 'text-slate-200' : 'text-slate-600'}`}
                                                                        >
                                                                            {sig}
                                                                        </button>
                                                                        {isSelected && panel.type !== 'METRICS' && (
                                                                            <input 
                                                                                type="color" 
                                                                                className="w-3 h-3 border-none p-0 bg-transparent cursor-pointer"
                                                                                value={customColor || inst.color} 
                                                                                onChange={(e) => updateCustomColor(panel.id, inst.id, sig, e.target.value)}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                )})}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button onClick={() => removePanel(panel.id)} className="text-slate-500 hover:text-red-400 ml-1">✕</button>
                           </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-h-0 w-full p-1 pt-2">
                          {panel.type === 'PVLOOP' && (
                              <PVLoopPanel 
                                physicsRefs={physicsRefs}
                                instances={instances}
                                config={panel.config}
                                showGuides={panel.showGuides}
                              />
                          )}
                          {panel.type === 'WAVEFORM' && (
                              <WaveformPanel 
                                physicsRefs={physicsRefs}
                                instances={instances}
                                timeWindow={panel.timeWindow || 10000}
                                config={panel.config}
                              />
                          )}
                          {panel.type === 'METRICS' && (
                               <MetricsPanel 
                                  physicsRefs={physicsRefs}
                                  instances={instances}
                                  config={panel.config}
                               />
                          )}
                          {(panel.type === 'GUYTON_RIGHT' || panel.type === 'GUYTON_LEFT' || panel.type === 'GUYTON_3D') && (
                                <GuytonPanel 
                                    physicsRefs={physicsRefs}
                                    instances={instances}
                                    config={panel.config}
                                    type={panel.type as any}
                                />
                          )}
                      </div>

                      {/* Resize Handle - Hide on mobile */}
                      {!isMobile && (
                        <div 
                            onMouseDown={(e) => startResize(e, panel)}
                            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 z-40 group/handle"
                        >
                            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-slate-600 group-hover/handle:border-b-blue-500"></div>
                        </div>
                      )}
                  </div>
              )})}
          </div>
      </main>
    </div>
  );
}

export default App;