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

  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({
      general: true,
      cardiac: true,
      vascular: true,
      resp: false,
      model: false,
      valves: false,
      advanced: false
  });

  const toggleGroup = (key: string) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const update = (key: keyof SimulationParams, val: any) => {
      if (activeInstance) {
        updateInstanceParams(activeInstance.id, { [key]: val });
      }
  };

  const updateNode = (node: string, key: string, value: number) => {
    const newOverrides = { ...(params.nodeOverrides || {}) };
    if (!newOverrides[node]) newOverrides[node] = {};
    newOverrides[node] = { ...newOverrides[node], [key]: value };
    update('nodeOverrides', newOverrides as any);
  };
  
  const updateEdge = (edge: string, key: string, value: number) => {
    const newOverrides = { ...(params.edgeOverrides || {}) };
    if (!newOverrides[edge]) newOverrides[edge] = {};
    newOverrides[edge] = { ...newOverrides[edge], [key]: value };
    update('edgeOverrides', newOverrides as any);
  };

  if (!params) return null;

  return (
    <div className="flex flex-col gap-2">
      {/* Playback Controls */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg mb-2">
         <div className="flex justify-between items-center mb-4">
             <span className="text-sm font-bold text-slate-300">Engine Output</span>
             <button 
                onClick={togglePlay}
                className={`px-4 py-1 rounded text-xs font-bold transition-colors ${isPlaying ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
             >
                 {isPlaying ? 'PAUSE' : 'RESUME'}
             </button>
         </div>
         <Slider label="Time Scale" value={timeScale} min={0.1} max={5.0} step={0.1} onChange={setTimeScale} unit="x" />
      </div>

      {/* Instance Selector */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg mb-2">
          <div className="flex justify-between items-center mb-2">
             <span className="text-sm font-bold text-slate-300">Instances</span>
             <button onClick={addInstance} className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-2 py-1 rounded">+</button>
          </div>
          <div className="flex flex-col gap-2">
             {instances.map(inst => (
                 <div 
                    key={inst.id} 
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${activeInstanceId === inst.id ? 'bg-slate-800 border-slate-600' : 'bg-transparent border-transparent hover:bg-slate-800/50'}`}
                    onClick={() => setActiveInstanceId(inst.id)}
                 >
                     <input 
                         type="color" 
                         value={inst.color} 
                         onChange={(e) => updateInstanceColor(inst.id, e.target.value)}
                         className="w-4 h-4 border-none p-0 bg-transparent cursor-pointer"
                         onClick={(e) => e.stopPropagation()}
                     />
                     <span className="text-xs font-bold flex-1 truncate">{inst.name}</span>
                     {instances.length > 1 && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); removeInstance(inst.id); }}
                            className="text-slate-500 hover:text-red-400 px-1"
                         >×</button>
                     )}
                 </div>
             ))}
          </div>
      </div>

      {/* Panels Menu */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg mb-4 text-xs">
          <span className="block text-sm font-bold text-slate-300 mb-2">Display</span>
          <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addPanel('PVLOOP')} className="bg-slate-800 hover:bg-slate-700 py-1 rounded">PV Loop</button>
              <button onClick={() => addPanel('WAVEFORM')} className="bg-slate-800 hover:bg-slate-700 py-1 rounded">Waveforms</button>
              <button onClick={() => addPanel('METRICS')} className="bg-slate-800 hover:bg-slate-700 py-1 rounded">Metrics</button>
              <button onClick={() => addPanel('GUYTON_LEFT')} className="bg-slate-800 hover:bg-slate-700 py-1 rounded">Guyton (L)</button>
              <button onClick={() => addPanel('GUYTON_RIGHT')} className="bg-slate-800 hover:bg-slate-700 py-1 rounded">Guyton (R)</button>
          </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <h2 className="text-sm font-bold text-slate-300 mb-2">Parameters</h2>
          
          <GroupHeader title="General" isOpen={openGroups.general} toggle={() => toggleGroup('general')} />
          {openGroups.general && (
              <div className="mt-2 pl-2 border-l-2 border-slate-800">
                  <Slider label="Heart Rate" value={params.HR} min={30} max={180} step={1} onChange={(v) => update('HR', v)} unit="bpm" />
                  <Slider label="Total Blood Vol" value={activeInstance.targetVolume} min={2000} max={8000} step={50} onChange={(v) => updateInstanceVolume(activeInstance.id, v)} unit="mL" />
                  <Slider label="Venous Tone" value={params.venousTone} min={0} max={1} step={0.05} onChange={(v) => update('venousTone', v)} unit="" />
              </div>
          )}

          <GroupHeader title="Cardiac" isOpen={openGroups.cardiac} toggle={() => toggleGroup('cardiac')} />
          {openGroups.cardiac && (
              <div className="mt-2 pl-2 border-l-2 border-slate-800">
                  <Slider label="Contractility" value={params.contractility} min={0.25} max={2.5} step={0.05} onChange={(v) => update('contractility', v)} unit="x" />
                  <Slider label="Relaxation" value={params.relaxation} min={0.25} max={2.5} step={0.05} onChange={(v) => update('relaxation', v)} unit="x" />
                  <span className="text-xs font-bold text-slate-300 block mt-3 mb-1">Chamber Baseline (V0)</span>
                  <Slider label="LV V0" value={params.nodeOverrides?.LV?.V0 ?? 10} min={0} max={100} step={1} onChange={(v) => updateNode('LV', 'V0', v)} unit="mL" />
                  <Slider label="RV V0" value={params.nodeOverrides?.RV?.V0 ?? 15} min={0} max={100} step={1} onChange={(v) => updateNode('RV', 'V0', v)} unit="mL" />
                  <Slider label="LA V0" value={params.nodeOverrides?.LA?.V0 ?? 5} min={0} max={50} step={1} onChange={(v) => updateNode('LA', 'V0', v)} unit="mL" />
                  <Slider label="RA V0" value={params.nodeOverrides?.RA?.V0 ?? 5} min={0} max={50} step={1} onChange={(v) => updateNode('RA', 'V0', v)} unit="mL" />

                  <span className="text-xs font-bold text-slate-300 block mt-3 mb-1">Elastance (Ees)</span>
                  <Slider label="LV Ees" value={params.nodeOverrides?.LV?.Ees ?? 2.4} min={0.2} max={10} step={0.1} onChange={(v) => updateNode('LV', 'Ees', v)} />
                  <Slider label="RV Ees" value={params.nodeOverrides?.RV?.Ees ?? 0.85} min={0.1} max={5} step={0.05} onChange={(v) => updateNode('RV', 'Ees', v)} />
              </div>
          )}

          <GroupHeader title="Vascular" isOpen={openGroups.vascular} toggle={() => toggleGroup('vascular')} />
          {openGroups.vascular && (
              <div className="mt-2 pl-2 border-l-2 border-slate-800">
                  <Slider label="Systemic Resistance" value={params.systemicResistance} min={0.2} max={3.5} step={0.05} onChange={(v) => update('systemicResistance', v)} unit="x" />
                  <Slider label="Pulm Resistance" value={params.pulmonaryResistance} min={0.2} max={4.0} step={0.05} onChange={(v) => update('pulmonaryResistance', v)} unit="x" />
                  <Slider label="Arterial Stiffness" value={params.arterialStiffness} min={0.4} max={3.0} step={0.05} onChange={(v) => update('arterialStiffness', v)} unit="x" />

                  <span className="text-xs font-bold text-slate-300 block mt-3 mb-1">Systemic Segment R</span>
                  <Slider label="Ao → SA" value={params.edgeOverrides?.Ao_SA?.R ?? 0.05} min={0.01} max={0.5} step={0.01} onChange={(v) => updateEdge('Ao_SA', 'R', v)} />
                  <Slider label="SA → Art" value={params.edgeOverrides?.SA_Art?.R ?? 0.08} min={0.01} max={0.5} step={0.01} onChange={(v) => updateEdge('SA_Art', 'R', v)} />
                  <Slider label="Art → Cap" value={params.edgeOverrides?.Art_Cap?.R ?? 0.65} min={0.1} max={3.0} step={0.05} onChange={(v) => updateEdge('Art_Cap', 'R', v)} />
                  <Slider label="Cap → SV" value={params.edgeOverrides?.Cap_SV?.R ?? 0.15} min={0.01} max={1.0} step={0.01} onChange={(v) => updateEdge('Cap_SV', 'R', v)} />
                  <Slider label="SV → VC" value={params.edgeOverrides?.SV_VC?.R ?? 0.05} min={0.01} max={0.5} step={0.01} onChange={(v) => updateEdge('SV_VC', 'R', v)} />
                  <Slider label="VC → RA" value={params.edgeOverrides?.VC_RA?.R ?? 0.04} min={0.01} max={0.3} step={0.01} onChange={(v) => updateEdge('VC_RA', 'R', v)} />

                  <span className="text-xs font-bold text-slate-300 block mt-3 mb-1">Pulmonary Segment R</span>
                  <Slider label="PA → PArt" value={params.edgeOverrides?.PA_PArt?.R ?? 0.01} min={0.001} max={0.1} step={0.001} onChange={(v) => updateEdge('PA_PArt', 'R', v)} />
                  <Slider label="PArt → PCap" value={params.edgeOverrides?.PArt_PCap?.R ?? 0.04} min={0.01} max={0.3} step={0.01} onChange={(v) => updateEdge('PArt_PCap', 'R', v)} />
                  <Slider label="PCap → PVen" value={params.edgeOverrides?.PCap_PVen?.R ?? 0.03} min={0.01} max={0.3} step={0.01} onChange={(v) => updateEdge('PCap_PVen', 'R', v)} />
                  <Slider label="PVen → PVein" value={params.edgeOverrides?.PVen_PVein?.R ?? 0.01} min={0.001} max={0.1} step={0.001} onChange={(v) => updateEdge('PVen_PVein', 'R', v)} />
                  <Slider label="PVein → LA" value={params.edgeOverrides?.PVein_LA?.R ?? 0.02} min={0.001} max={0.2} step={0.001} onChange={(v) => updateEdge('PVein_LA', 'R', v)} />
              </div>
          )}

          <GroupHeader title="Respiratory" isOpen={openGroups.resp} toggle={() => toggleGroup('resp')} />
          {openGroups.resp && (
              <div className="mt-2 pl-2 border-l-2 border-slate-800">
                  <Slider label="PEEP" value={params.PEEP} min={0} max={25} step={1} onChange={(v) => update('PEEP', v)} unit="cmH2O" />
                  <Slider label="Pth0" value={params.Pth0} min={-20} max={30} step={1} onChange={(v) => update('Pth0', v)} unit="cmH2O" />
                  <Slider label="Resp Amp (Th)" value={params.respAmpTh} min={-20} max={20} step={1} onChange={(v) => update('respAmpTh', v)} unit="cmH2O" />
                  <Slider label="Resp Amp (Alv)" value={params.respAmpAlv} min={-20} max={20} step={1} onChange={(v) => update('respAmpAlv', v)} unit="cmH2O" />
                  <Slider label="Resp Rate" value={params.respRate} min={0} max={1.0} step={0.05} onChange={(v) => update('respRate', v)} unit="Hz" />
              </div>
          )}
                    <GroupHeader title="Model settings" isOpen={openGroups.model} toggle={() => toggleGroup('model')} />
          {openGroups.model && (
              <div className="mt-2 pl-2 border-l-2 border-slate-800">
                  <Slider label="LV Tmax Scale" value={params.lvTmaxScale} min={0.25} max={8} step={0.1} onChange={(v) => update('lvTmaxScale', v)} />
                  <Slider label="RV Tmax Scale" value={params.rvTmaxScale} min={0.25} max={12} step={0.1} onChange={(v) => update('rvTmaxScale', v)} />
                  <Slider label="LV Geom Scale" value={params.lvGeomScale} min={0.5} max={2.5} step={0.1} onChange={(v) => update('lvGeomScale', v)} />
                  <Slider label="RV Geom Scale" value={params.rvGeomScale} min={0.5} max={3.0} step={0.1} onChange={(v) => update('rvGeomScale', v)} />
                  <Slider label="LV Ca²⁺ Release Scale" value={params.caReleaseScale} min={0.25} max={6} step={0.1} onChange={(v) => update('caReleaseScale', v)} />
                  <Slider label="RV Ca²⁺ Release Scale" value={params.rvCaReleaseScale} min={0.25} max={8} step={0.1} onChange={(v) => update('rvCaReleaseScale', v)} />
                  <div className="flex items-center gap-2 mt-4 text-xs">
                     <input type="checkbox" checked={params.useChiResistance} onChange={(e) => update('useChiResistance', e.target.checked)} />
                     <span className="text-slate-300">Use dynamic Starling resistance</span>
                  </div>
              </div>
          )}

          <GroupHeader title="Valves" isOpen={openGroups.valves} toggle={() => toggleGroup('valves')} />
          {openGroups.valves && (
              <div className="mt-2 pl-2 border-l-2 border-slate-800 flex flex-col gap-2">
                 {['MV', 'AoV', 'TV', 'PV'].map(vName => (
                     <div key={vName} className="mb-2 p-2 bg-slate-800/50 rounded">
                         <span className="text-xs font-bold text-slate-300 block mb-2">{vName} Parameters</span>
                         <Slider label={`Amax`} value={(params as any)[`${vName}_Amax`]} min={0.1} max={10.0} step={0.1} onChange={(v) => update(`${vName}_Amax` as any, v)} unit="cm²" />
                         <Slider label={`Aleak`} value={(params as any)[`${vName}_Aleak`]} min={0.00000} max={1.0} step={0.001} onChange={(v) => update(`${vName}_Aleak` as any, v)} unit="cm²" />
                         <Slider label={`Resistance`} value={(params as any)[`${vName}_R`]} min={0.0005} max={0.05} step={0.0005} onChange={(v) => update(`${vName}_R` as any, v)} />
                         <Slider label={`Inertance`} value={(params as any)[`${vName}_L`]} min={0.0001} max={0.01} step={0.0001} onChange={(v) => update(`${vName}_L` as any, v)} />
                         <Slider label={`kOpen`} value={(params as any)[`${vName}_kOpen`]} min={0.1} max={10.0} step={0.1} onChange={(v) => update(`${vName}_kOpen` as any, v)} />
                         <Slider label={`tauOpen`} value={(params as any)[`${vName}_tauOpen`]} min={0.001} max={0.1} step={0.001} onChange={(v) => update(`${vName}_tauOpen` as any, v)} />
                         <Slider label={`tauClose`} value={(params as any)[`${vName}_tauClose`]} min={0.001} max={0.1} step={0.001} onChange={(v) => update(`${vName}_tauClose` as any, v)} />
                     </div>
                 ))}
              </div>
          )}
      </div>
    </div>
  );
};
