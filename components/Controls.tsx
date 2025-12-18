import React, { useState } from 'react';
import { SimulationParams, SimInstance, PanelType } from '../types';

interface ControlsProps {
  instances: SimInstance[];
  activeInstanceId: string;
  setActiveInstanceId: (id: string) => void;
  updateInstanceParams: (id: string, params: Partial<SimulationParams>) => void;
  updateInstanceVolume: (id: string, vol: number) => void;
  updateInstanceColor: (id: string, color: string) => void;
  addInstance: () => void;
  removeInstance: (id: string) => void;
  
  timeScale: number;
  setTimeScale: (v: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  
  addPanel: (type: PanelType) => void;
}

const Slider = ({ label, value, min, max, step, onChange, unit }: { label: string, value: number, min: number, max: number, step: number, onChange: (val: number) => void, unit?: string }) => (
  <div className="mb-3">
    <div className="flex justify-between text-xs text-slate-400 mb-1">
      <span>{label}</span>
      <span>{value.toFixed(2)} {unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
    />
  </div>
);

const GroupHeader = ({ title, isOpen, toggle }: { title: string, isOpen: boolean, toggle: () => void }) => (
    <div 
        onClick={toggle}
        className="flex justify-between items-center cursor-pointer bg-slate-800 p-2 rounded mt-2 hover:bg-slate-700 transition-colors"
    >
        <span className="text-xs font-bold text-slate-200 uppercase">{title}</span>
        <span className="text-xs text-slate-400">{isOpen ? '▼' : '▶'}</span>
    </div>
);

export const Controls: React.FC<ControlsProps> = ({ 
    instances, activeInstanceId, setActiveInstanceId, updateInstanceParams, updateInstanceVolume, updateInstanceColor, addInstance, removeInstance,
    timeScale, setTimeScale, isPlaying, togglePlay,
    addPanel
}) => {
  
  const activeInstance = instances.find(i => i.id === activeInstanceId) || instances[0];
  const params = activeInstance?.params;

  // Tab State
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({
      general: true,
      lv: true,
      sys: false,
      rv: false,
      pulm: false,
      la: false,
      ra: false
  });

  const toggleGroup = (key: string) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const update = (key: keyof SimulationParams, val: number) => {
      if (activeInstance) {
        updateInstanceParams(activeInstance.id, { [key]: val });
      }
  };

  // Helper for Macro Sliders
  // Systemic R components: Ras, Rcs, Rvs, Ras_prox, Rda
  const getSystemicR = () => params.Ras + params.Rcs + params.Rvs + params.Ras_prox + params.Rda;
  const setSystemicR = (newTotal: number) => {
      const currentTotal = getSystemicR();
      if(currentTotal === 0) return;
      const ratio = newTotal / currentTotal;
      updateInstanceParams(activeInstance.id, {
          Ras: params.Ras * ratio,
          Rcs: params.Rcs * ratio,
          Rvs: params.Rvs * ratio,
          Ras_prox: params.Ras_prox * ratio,
          Rda: params.Rda * ratio
      });
  };

  // Systemic C components: Cas, Cvs, Cas_prox, Cda
  const getSystemicC = () => params.Cas + params.Cvs + params.Cas_prox + params.Cda;
  const setSystemicC = (newTotal: number) => {
      const currentTotal = getSystemicC();
      if(currentTotal === 0) return;
      const ratio = newTotal / currentTotal;
      updateInstanceParams(activeInstance.id, {
          Cas: params.Cas * ratio,
          Cvs: params.Cvs * ratio,
          Cas_prox: params.Cas_prox * ratio,
          Cda: params.Cda * ratio
      });
  };

  // Pulmonary R: Rap, Rvp, Rap_prox, Rcp
  const getPulmR = () => params.Rap + params.Rvp + params.Rap_prox + params.Rcp;
  const setPulmR = (newTotal: number) => {
      const currentTotal = getPulmR();
      if(currentTotal === 0) return;
      const ratio = newTotal / currentTotal;
      updateInstanceParams(activeInstance.id, {
          Rap: params.Rap * ratio,
          Rvp: params.Rvp * ratio,
          Rap_prox: params.Rap_prox * ratio,
          Rcp: params.Rcp * ratio
      });
  };
  
  // Pulmonary C: Cap, Cvp, Cap_prox
  const getPulmC = () => params.Cap + params.Cvp + params.Cap_prox;
  const setPulmC = (newTotal: number) => {
      const currentTotal = getPulmC();
      if(currentTotal === 0) return;
      const ratio = newTotal / currentTotal;
      updateInstanceParams(activeInstance.id, {
          Cap: params.Cap * ratio,
          Cvp: params.Cvp * ratio,
          Cap_prox: params.Cap_prox * ratio
      });
  };


  return (
    <div className="space-y-6 pb-20">
      
      {/* Simulation Control */}
      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Global Physics</h3>
        
        <div className="mb-4 flex items-center gap-2">
            <button 
                onClick={togglePlay}
                className={`flex-1 py-2 rounded font-bold text-sm transition-colors ${isPlaying ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
            >
                {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>
        </div>

        <div className="mb-4">
             <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Sim Speed</span>
                <span>{timeScale.toFixed(1)}x</span>
            </div>
            <input
                type="range"
                min={0.1}
                max={2.0}
                step={0.1}
                value={timeScale}
                onChange={(e) => setTimeScale(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
        </div>
      </div>
      
      {/* Dashboard Layout */}
      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
         <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Layout</h3>
         <div className="grid grid-cols-2 gap-2">
            <button onClick={() => addPanel('PVLOOP')} className="p-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-slate-300 text-center">
               + PV Loop
            </button>
            <button onClick={() => addPanel('WAVEFORM')} className="p-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-slate-300 text-center">
               + Waveform
            </button>
            <button onClick={() => addPanel('GUYTON_RIGHT')} className="p-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-slate-300 text-center">
               + Guyton (Right)
            </button>
            <button onClick={() => addPanel('GUYTON_LEFT')} className="p-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-slate-300 text-center">
               + Guyton (Left)
            </button>
            <button onClick={() => addPanel('GUYTON_3D')} className="p-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-slate-300 text-center col-span-2">
               + Guyton 3D (Bi-V)
            </button>
            <button onClick={() => addPanel('METRICS')} className="p-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-slate-300 text-center col-span-2">
               + Metrics
            </button>
         </div>
      </div>

      {/* Instances Management */}
      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Models</h3>
            <button onClick={addInstance} className="text-xs bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded text-white">+ Duplicate</button>
          </div>
          <div className="space-y-2">
              {instances.map(inst => (
                  <div 
                    key={inst.id} 
                    className={`flex items-center justify-between p-2 rounded cursor-pointer border ${activeInstanceId === inst.id ? 'bg-slate-800 border-indigo-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                    onClick={() => setActiveInstanceId(inst.id)}
                  >
                      <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={inst.color}
                            onChange={(e) => updateInstanceColor(inst.id, e.target.value)}
                            className="w-4 h-4 rounded overflow-hidden border-none p-0 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-slate-200">{inst.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                          {instances.length > 1 && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); removeInstance(inst.id); }}
                                className="text-slate-500 hover:text-red-400 px-1"
                            >
                                ✕
                            </button>
                          )}
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* Params for Active Instance */}
      {params && (
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-full" style={{ backgroundColor: activeInstance.color }}></div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
                    {activeInstance.name} Config
                </h3>
                
                {/* General Group */}
                <GroupHeader title="General" isOpen={openGroups.general} toggle={() => toggleGroup('general')} />
                {openGroups.general && (
                    <div className="mt-3 pl-1 border-l-2 border-slate-700">
                        <Slider label="Heart Rate" value={params.HR} min={30} max={200} step={1} onChange={(v) => update('HR', v)} unit="bpm" />
                        <Slider label="Total Volume" value={activeInstance.targetVolume} min={1000} max={8000} step={50} onChange={(v) => updateInstanceVolume(activeInstance.id, v)} unit="mL" />
                    </div>
                )}

                {/* Left Ventricle */}
                <GroupHeader title="Left Ventricle" isOpen={openGroups.lv} toggle={() => toggleGroup('lv')} />
                {openGroups.lv && (
                    <div className="mt-3 pl-1 border-l-2 border-purple-500/30">
                        <Slider label="Ees (Contractility)" value={params.LV_Ees} min={0.5} max={10.0} step={0.1} onChange={(v) => update('LV_Ees', v)} unit="mmHg/mL" />
                        <Slider label="V0 (Unstressed Vol)" value={params.LV_V0} min={-50} max={100} step={5} onChange={(v) => update('LV_V0', v)} unit="mL" />
                        <Slider label="Alpha (Stiffness)" value={params.LV_alpha} min={0.01} max={0.1} step={0.001} onChange={(v) => update('LV_alpha', v)} unit="/mL" />
                        <Slider label="Beta (EDP Scale)" value={params.LV_beta} min={0.1} max={1.0} step={0.01} onChange={(v) => update('LV_beta', v)} unit="mmHg" />
                        <Slider label="Tau (Relaxation)" value={params.LV_tau} min={10} max={100} step={1} onChange={(v) => update('LV_tau', v)} unit="ms" />
                    </div>
                )}

                {/* Systemic */}
                <GroupHeader title="Systemic Circulation" isOpen={openGroups.sys} toggle={() => toggleGroup('sys')} />
                {openGroups.sys && (
                    <div className="mt-3 pl-1 border-l-2 border-blue-500/30">
                        {/* Default ~900 */}
                        <Slider label="Total Resistance" value={getSystemicR()} min={100} max={3000} step={50} onChange={setSystemicR} unit="R" />
                        {/* Default ~73 */}
                        <Slider label="Total Compliance" value={getSystemicC()} min={10} max={200} step={1} onChange={setSystemicC} unit="mL/mmHg" />
                    </div>
                )}

                 {/* Right Ventricle */}
                <GroupHeader title="Right Ventricle" isOpen={openGroups.rv} toggle={() => toggleGroup('rv')} />
                {openGroups.rv && (
                    <div className="mt-3 pl-1 border-l-2 border-teal-500/30">
                        <Slider label="Ees (Contractility)" value={params.RV_Ees} min={0.1} max={5.0} step={0.1} onChange={(v) => update('RV_Ees', v)} unit="mmHg/mL" />
                        <Slider label="V0 (Unstressed Vol)" value={params.RV_V0} min={-50} max={100} step={5} onChange={(v) => update('RV_V0', v)} unit="mL" />
                        <Slider label="Alpha (Stiffness)" value={params.RV_alpha} min={0.01} max={0.1} step={0.001} onChange={(v) => update('RV_alpha', v)} unit="/mL" />
                        <Slider label="Beta (EDP Scale)" value={params.RV_beta} min={0.1} max={1.0} step={0.01} onChange={(v) => update('RV_beta', v)} unit="mmHg" />
                        <Slider label="Tau (Relaxation)" value={params.RV_tau} min={10} max={100} step={1} onChange={(v) => update('RV_tau', v)} unit="ms" />
                    </div>
                )}

                {/* Pulmonary */}
                <GroupHeader title="Pulmonary Circulation" isOpen={openGroups.pulm} toggle={() => toggleGroup('pulm')} />
                {openGroups.pulm && (
                    <div className="mt-3 pl-1 border-l-2 border-cyan-500/30">
                         {/* Default ~53 */}
                        <Slider label="Total Resistance" value={getPulmR()} min={10} max={200} step={5} onChange={setPulmR} unit="R" />
                         {/* Default ~28 */}
                        <Slider label="Total Compliance" value={getPulmC()} min={5} max={100} step={1} onChange={setPulmC} unit="mL/mmHg" />
                    </div>
                )}
                
                 {/* Left Atrium */}
                <GroupHeader title="Left Atrium" isOpen={openGroups.la} toggle={() => toggleGroup('la')} />
                {openGroups.la && (
                    <div className="mt-3 pl-1 border-l-2 border-slate-700">
                        <Slider label="Ees" value={params.LA_Ees} min={0.1} max={2.0} step={0.05} onChange={(v) => update('LA_Ees', v)} unit="mmHg/mL" />
                        <Slider label="Beta" value={params.LA_beta} min={0.1} max={1.0} step={0.01} onChange={(v) => update('LA_beta', v)} unit="mmHg" />
                    </div>
                )}

                 {/* Right Atrium */}
                <GroupHeader title="Right Atrium" isOpen={openGroups.ra} toggle={() => toggleGroup('ra')} />
                {openGroups.ra && (
                    <div className="mt-3 pl-1 border-l-2 border-slate-700">
                         <Slider label="Ees" value={params.RA_Ees} min={0.1} max={2.0} step={0.05} onChange={(v) => update('RA_Ees', v)} unit="mmHg/mL" />
                         <Slider label="Beta" value={params.RA_beta} min={0.1} max={1.0} step={0.01} onChange={(v) => update('RA_beta', v)} unit="mmHg" />
                    </div>
                )}

          </div>
      )}
    </div>
  );
};