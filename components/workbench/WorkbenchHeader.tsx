import React from 'react';
import { SimInstance, PanelType } from '../../types';
import { SimulationHealth } from '../../engine/protocol';
import { HealthBadge } from '../HealthIndicators';

interface WorkbenchHeaderProps {
  instances: SimInstance[];
  instanceHealth: Record<string, SimulationHealth>;
  getLiveHealth: (id: string) => SimulationHealth | undefined;
  onOpenScenarioManager: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImportFile: (file: File) => void;
  onExport: () => void;
  authoringMode: boolean;
  setAuthoringMode: React.Dispatch<React.SetStateAction<boolean>>;
  stepsDraftLength: number;
  openLessonDialog: () => void;
  onExitAuthoring: () => void;
  user: unknown;
  isAdmin: boolean;
  publishCurrentLesson: () => void;
  isPublishingLesson: boolean;
  savedLesson: { id: string; title: string } | null;
  publishedLesson: { id: string; title: string; url: string } | null;
  copyShareUrl: () => void;
  isPlaying: boolean;
  togglePlay: () => void;
  timeScale: number;
  setTimeScale: React.Dispatch<React.SetStateAction<number>>;
  paneMenuOpen: boolean;
  setPaneMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  addPanel: (type: PanelType) => void;
}

export function WorkbenchHeader({
  instances,
  instanceHealth,
  getLiveHealth,
  onOpenScenarioManager,
  fileInputRef,
  onImportFile,
  onExport,
  authoringMode,
  setAuthoringMode,
  stepsDraftLength,
  openLessonDialog,
  onExitAuthoring,
  user,
  isAdmin,
  publishCurrentLesson,
  isPublishingLesson,
  savedLesson,
  publishedLesson,
  copyShareUrl,
  isPlaying,
  togglePlay,
  timeScale,
  setTimeScale,
  paneMenuOpen,
  setPaneMenuOpen,
  addPanel,
}: WorkbenchHeaderProps) {
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 z-50 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4 min-w-0">
            <h1 className="text-sm font-bold text-slate-300">Workbench Controls</h1>
            {authoringMode && (
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded border border-amber-400/40 bg-amber-400/10 text-[10px] font-bold uppercase tracking-wide text-amber-200">
                    Authoring
                </span>
            )}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
             <HealthBadge items={instances.filter(i => instanceHealth[i.id]).map(i => ({ id: i.id, name: i.name, color: i.color, health: instanceHealth[i.id] }))} getLiveHealth={getLiveHealth} />
             <button onClick={onOpenScenarioManager} className="px-3 sm:px-4 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded text-[10px] sm:text-xs font-bold text-slate-300 transition-colors flex items-center gap-2">
                 <span>❖</span> Scenarios ({instances.length})
             </button>

             <input ref={fileInputRef} type="file" accept=".json,.hemosim.json,application/json" className="hidden"
                 onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = ''; }} />
             <button onClick={onExport} title="Export this scene as a .hemosim.json file" className="px-2 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded text-[10px] sm:text-xs font-bold text-slate-300 transition-colors flex items-center gap-1">
                 <span>↓</span> Save
             </button>
             <button onClick={() => fileInputRef.current?.click()} title="Load a .hemosim.json case file" className="px-2 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded text-[10px] sm:text-xs font-bold text-slate-300 transition-colors flex items-center gap-1">
                 <span>↑</span> Load
             </button>
             {!authoringMode ? (
                 <button onClick={() => setAuthoringMode(true)} title="Create or resume a lesson from this scene" className="px-2 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded text-[10px] sm:text-xs font-bold text-slate-300 transition-colors flex items-center gap-1 whitespace-nowrap">
                     <span>✎</span> {stepsDraftLength > 0 ? `Resume lesson (${stepsDraftLength})` : 'Create lesson'}
                 </button>
             ) : (
                 <div className="flex items-center gap-1 sm:gap-2">
                     <button onClick={openLessonDialog} title="Save this scene and note as a lesson" className="px-2 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-500 border border-blue-500/50 rounded text-[10px] sm:text-xs font-bold text-white transition-colors flex items-center gap-1 whitespace-nowrap">
                         <span>▣</span> Save as lesson
                     </button>
                     {(!user || isAdmin) && (
                         <button onClick={publishCurrentLesson} disabled={isPublishingLesson} title="Publish this lesson for sharing across devices" className="px-2 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded text-[10px] sm:text-xs font-bold text-slate-300 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                             {isPublishingLesson ? 'Publishing...' : 'Publish (share)'}
                         </button>
                     )}
                     <button onClick={onExitAuthoring} title="Exit lesson authoring" className="px-2 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded text-[10px] sm:text-xs font-bold text-slate-300 transition-colors whitespace-nowrap">
                         Exit authoring
                     </button>
                 </div>
             )}
             {savedLesson && (
                 <a href={`/lesson/${savedLesson.id}`} className="inline-flex px-2 sm:px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 rounded text-[10px] sm:text-xs font-bold text-emerald-200 transition-colors whitespace-nowrap">
                     Open lesson
                 </a>
             )}
             {publishedLesson && (
                 <div className="hidden lg:flex items-center gap-1 px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[10px] font-bold text-emerald-200">
                     <a href={publishedLesson.url} className="hover:text-emerald-100 transition-colors whitespace-nowrap">
                         Share URL
                     </a>
                     <button onClick={copyShareUrl} className="text-emerald-300 hover:text-emerald-100 transition-colors" title="Copy share URL">
                         Copy
                     </button>
                 </div>
             )}

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

             <div className="flex items-center gap-1 relative">
                 <button onClick={(e) => { e.stopPropagation(); setPaneMenuOpen((o) => !o); }} className={`px-2 sm:px-3 py-1.5 rounded text-[10px] sm:text-xs font-bold transition-colors flex items-center gap-1 sm:gap-2 ${paneMenuOpen ? 'bg-slate-700 text-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}>
                     <span>+ Pane</span>
                     <span className="text-[8px] sm:text-[10px]">▼</span>
                 </button>
                 {paneMenuOpen && (
                   <>
                     <div className="fixed inset-0 z-40 cursor-default" onClick={() => setPaneMenuOpen(false)} />
                     <div className="block absolute top-full right-0 mt-1 w-40 sm:w-48 bg-slate-800 border border-slate-700 shadow-xl rounded py-1 z-50">
                         <button onClick={() => { addPanel('NOTE'); setPaneMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-green-300">Notes (Interactive)</button>
                         <button onClick={() => { addPanel('PVLOOP'); setPaneMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-slate-300">PV Loop</button>
                         <button onClick={() => { addPanel('WAVEFORM'); setPaneMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-slate-300">Waveforms</button>
                         <button onClick={() => { addPanel('METRICS'); setPaneMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-slate-300">Metrics</button>
                         <button onClick={() => { addPanel('CONTROLS'); setPaneMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-blue-300">Controls</button>
                         <div className="h-px bg-slate-700 my-1"></div>
                         <button onClick={() => { addPanel('GUYTON_LEFT'); setPaneMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-slate-300">Guyton (L)</button>
                         <button onClick={() => { addPanel('GUYTON_RIGHT'); setPaneMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-slate-300">Guyton (R)</button>
                     </div>
                   </>
                 )}
             </div>
        </div>
    </header>
  );
}
