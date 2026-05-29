import React, { useState } from 'react';
import { SimulationParams, SimInstance, PanelType } from '../types';

interface ControlsProps {
  instances: SimInstance[];
  activeInstanceId: string;
  setActiveInstanceId: (id: string) => void;
  updateInstanceParams: (id: string, params: Partial<SimulationParams>) => void;
  updateInstanceVolume: (id: string, vol: number) => void;
  updateInstanceColor: (id: string, color: string) => void;
  addInstance: (sourceId?: string) => void;
  removeInstance: (id: string) => void;
  
  timeScale: number;
  setTimeScale: (v: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  
  addPanel: (type: PanelType) => void;
  isPaneMode?: boolean;
  paneConfig?: any;
}

const Slider = ({ label, value, min, max, step, onChange, unit }: { label: string, value: number, min: number, max: number, step: number, onChange: (val: number) => void, unit?: string }) => {
  const decimals = step < 0.01 ? 3 : (step < 0.1 ? 2 : (step < 1 ? 1 : 0));
  return (
  <div className="mb-2">
    <div className="flex justify-between items-baseline mb-0.5">
      <span className="text-[11px] font-medium text-slate-400 truncate pr-2">{label}</span>
      <span className="text-[11px] font-mono text-slate-200 flex-shrink-0">
         {value.toFixed(decimals)}
         {unit && <span className="text-[9px] text-slate-500 ml-0.5">{unit}</span>}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 focus:outline-none"
    />
  </div>
  );
};

const GroupHeader = ({ title, isOpen, toggle }: { title: string, isOpen: boolean, toggle: () => void }) => {
    return (
    <div 
        onClick={toggle}
        className="flex justify-between items-center cursor-pointer hover:bg-slate-700 bg-slate-800/80 border border-slate-700/50 p-2 rounded mt-2 transition-colors"
    >
        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
           {title}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">{isOpen ? '▼' : '▶'}</span>
    </div>
    );
};

export const Controls: React.FC<ControlsProps> = ({ 
    instances, activeInstanceId, setActiveInstanceId, updateInstanceParams, updateInstanceVolume, updateInstanceColor, addInstance, removeInstance,
    timeScale, setTimeScale, isPlaying, togglePlay,
    addPanel, isPaneMode, paneConfig
}) => {
  
  // If in pane mode, filter visible instances based on paneConfig
  const visibleInstances = isPaneMode && paneConfig 
    ? instances.filter(i => paneConfig[i.id]?.visible)
    : instances;
    
  const currentActiveId = activeInstanceId;
  const activeInstance = instances.find(i => i.id === currentActiveId) || instances[0];
  const params = activeInstance?.params;

  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({
      global: true,
      ventricles: true,
      atria: false,
      vascular: false,
      valves: false,
      resp: false,
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

  const showGroup = (key: string) => {
      if (isPaneMode && paneConfig && paneConfig[currentActiveId]) {
          return paneConfig[currentActiveId].selectedSignals.includes(key);
      }
      return true;
  };

  return (
    <div className="absolute inset-0 flex flex-col gap-0 h-full bg-transparent overflow-hidden">
      
      {instances.length > 1 && (
      <div className="flex overflow-x-auto custom-scrollbar gap-1 items-end bg-transparent border-b border-slate-800/60 pt-2 px-2 shrink-0">
         {instances.filter(i => i.isVisible !== false).map(inst => (
            <button
                key={inst.id}
                onClick={() => setActiveInstanceId(inst.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${currentActiveId === inst.id ? 'bg-slate-800 border-blue-500 text-slate-200' : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-800/40 hover:text-slate-400'}`}
            >
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: inst.color, boxShadow: `0 0 6px ${inst.color}`}}></div>
                {inst.name}
            </button>
         ))}
      </div>
      )}

      {/* Pane content - global instance is active instance */}
      <div className="p-3 overflow-y-auto flex-1 custom-scrollbar">

          {showGroup('Global') && (
            <>
              <GroupHeader title="Global Physiology" isOpen={openGroups.global} toggle={() => toggleGroup('global')} />
              {openGroups.global && (
                  <div className="mt-2 pl-3 border-l-2 border-slate-700/30 ml-2 mb-4">
                  <Slider label="Heart Rate" value={params.HR} min={30} max={180} step={1} onChange={(v) => update('HR', v)} unit="bpm" />
                  <Slider label="Total Blood Volume" value={activeInstance.targetVolume} min={2000} max={8000} step={50} onChange={(v) => updateInstanceVolume(activeInstance.id, v)} unit="mL" />
                  <Slider label="Global Venous Tone" value={params.venousTone} min={0} max={1} step={0.05} onChange={(v) => update('venousTone', v)} />
                  <Slider label="Global Contractility" value={params.contractility} min={0.25} max={2.5} step={0.05} onChange={(v) => update('contractility', v)} unit="x" />
                  <Slider label="Global Relaxation" value={params.relaxation} min={0.25} max={2.5} step={0.05} onChange={(v) => update('relaxation', v)} unit="x" />
              </div>
          )}
          </>
      )}

          {showGroup('ventricles') && (
            <>
              <GroupHeader title="Ventricular Mechanics" isOpen={openGroups.ventricles} toggle={() => toggleGroup('ventricles')} />
              {openGroups.ventricles && (
                  <div className="mt-2 pl-3 border-l-2 border-slate-700/30 ml-2 mb-4">
                      <span className="text-xs font-bold text-slate-300 block mb-1 mt-1">Left Ventricle (LV)</span>
                      <Slider label="LV Baseline Volume (V0)" value={params.nodeOverrides?.LV?.V0 ?? 10} min={0} max={100} step={1} onChange={(v) => updateNode('LV', 'V0', v)} unit="mL" />
                      <Slider label="LV Tmax Scale (Force)" value={params.lvTmaxScale} min={0.25} max={8} step={0.1} onChange={(v) => update('lvTmaxScale', v)} unit="x" />
                      <Slider label="LV Ca²⁺ Release Scale" value={params.caReleaseScale} min={0.25} max={6} step={0.1} onChange={(v) => update('caReleaseScale', v)} unit="x" />
                      <Slider label="LV Geometry Scale" value={params.lvGeomScale} min={0.5} max={2.5} step={0.1} onChange={(v) => update('lvGeomScale', v)} unit="x" />

                      <span className="text-xs font-bold text-slate-300 block mt-4 mb-1">Right Ventricle (RV)</span>
                      <Slider label="RV Baseline Volume (V0)" value={params.nodeOverrides?.RV?.V0 ?? 15} min={0} max={100} step={1} onChange={(v) => updateNode('RV', 'V0', v)} unit="mL" />
                      <Slider label="RV Tmax Scale (Force)" value={params.rvTmaxScale} min={0.25} max={12} step={0.1} onChange={(v) => update('rvTmaxScale', v)} unit="x" />
                      <Slider label="RV Ca²⁺ Release Scale" value={params.rvCaReleaseScale} min={0.25} max={8} step={0.1} onChange={(v) => update('rvCaReleaseScale', v)} unit="x" />
                      <Slider label="RV Geometry Scale" value={params.rvGeomScale} min={0.5} max={3.0} step={0.1} onChange={(v) => update('rvGeomScale', v)} unit="x" />
                  </div>
              )}
            </>
          )}

          {showGroup('atria') && (
            <>
              <GroupHeader title="Atrial Mechanics" isOpen={openGroups.atria} toggle={() => toggleGroup('atria')} />
              {openGroups.atria && (
                  <div className="mt-2 pl-3 border-l-2 border-slate-700/30 ml-2 mb-4">
                      <span className="text-xs font-bold text-slate-300 block mb-1 mt-1">Left Atrium (LA)</span>
                      <Slider label="LA Baseline Volume (V0)" value={params.nodeOverrides?.LA?.V0 ?? 5} min={0} max={50} step={1} onChange={(v) => updateNode('LA', 'V0', v)} unit="mL" />
                      <Slider label="LA Elastance (Ees)" value={params.nodeOverrides?.LA?.Ees ?? 0.25} min={0.05} max={2.0} step={0.05} onChange={(v) => updateNode('LA', 'Ees', v)} />

                      <span className="text-xs font-bold text-slate-300 block mt-4 mb-1">Right Atrium (RA)</span>
                      <Slider label="RA Baseline Volume (V0)" value={params.nodeOverrides?.RA?.V0 ?? 5} min={0} max={50} step={1} onChange={(v) => updateNode('RA', 'V0', v)} unit="mL" />
                      <Slider label="RA Elastance (Ees)" value={params.nodeOverrides?.RA?.Ees ?? 0.22} min={0.05} max={2.0} step={0.05} onChange={(v) => updateNode('RA', 'Ees', v)} />
                  </div>
              )}
            </>
          )}

          {showGroup('vascular') && (
            <>
              <GroupHeader title="Vascular Resistance & Compliance" isOpen={openGroups.vascular} toggle={() => toggleGroup('vascular')} />
              {openGroups.vascular && (
                  <div className="mt-2 pl-3 border-l-2 border-slate-700/30 ml-2 mb-4">
                      <span className="text-xs font-bold text-slate-300 block mt-1 mb-1">Global Scale Multipliers</span>
                      <Slider label="Systemic Resistance" value={params.systemicResistance} min={0.2} max={3.5} step={0.05} onChange={(v) => update('systemicResistance', v)} unit="x" />
                      <Slider label="Pulmonary Resistance" value={params.pulmonaryResistance} min={0.2} max={4.0} step={0.05} onChange={(v) => update('pulmonaryResistance', v)} unit="x" />
                      <Slider label="Global Arterial Stiffness" value={params.arterialStiffness} min={0.4} max={3.0} step={0.05} onChange={(v) => update('arterialStiffness', v)} unit="x" />

                      <span className="text-xs font-bold text-slate-300 block mt-4 mb-1">Systemic Segment Resistance</span>
                      <Slider label="Ao → SA" value={params.edgeOverrides?.Ao_SA?.R ?? 0.05} min={0.01} max={0.5} step={0.01} onChange={(v) => updateEdge('Ao_SA', 'R', v)} />
                      <Slider label="SA → Art" value={params.edgeOverrides?.SA_Art?.R ?? 0.08} min={0.01} max={0.5} step={0.01} onChange={(v) => updateEdge('SA_Art', 'R', v)} />
                      <Slider label="Art → Cap" value={params.edgeOverrides?.Art_Cap?.R ?? 0.65} min={0.1} max={3.0} step={0.05} onChange={(v) => updateEdge('Art_Cap', 'R', v)} />
                      <Slider label="Cap → SV" value={params.edgeOverrides?.Cap_SV?.R ?? 0.15} min={0.01} max={1.0} step={0.01} onChange={(v) => updateEdge('Cap_SV', 'R', v)} />
                      <Slider label="SV → VC" value={params.edgeOverrides?.SV_VC?.R ?? 0.05} min={0.01} max={0.5} step={0.01} onChange={(v) => updateEdge('SV_VC', 'R', v)} />
                      <Slider label="VC → RA" value={params.edgeOverrides?.VC_RA?.R ?? 0.04} min={0.01} max={0.3} step={0.01} onChange={(v) => updateEdge('VC_RA', 'R', v)} />

                      <span className="text-xs font-bold text-slate-300 block mt-4 mb-1">Pulmonary Segment Resistance</span>
                      <Slider label="PA → PArt" value={params.edgeOverrides?.PA_PArt?.R ?? 0.01} min={0.001} max={0.1} step={0.001} onChange={(v) => updateEdge('PA_PArt', 'R', v)} />
                      <Slider label="PArt → PCap" value={params.edgeOverrides?.PArt_PCap?.R ?? 0.04} min={0.01} max={0.3} step={0.01} onChange={(v) => updateEdge('PArt_PCap', 'R', v)} />
                      <Slider label="PCap → PVen" value={params.edgeOverrides?.PCap_PVen?.R ?? 0.03} min={0.01} max={0.3} step={0.01} onChange={(v) => updateEdge('PCap_PVen', 'R', v)} />
                      <Slider label="PVen → PVein" value={params.edgeOverrides?.PVen_PVein?.R ?? 0.01} min={0.001} max={0.1} step={0.001} onChange={(v) => updateEdge('PVen_PVein', 'R', v)} />
                      <Slider label="PVein → LA" value={params.edgeOverrides?.PVein_LA?.R ?? 0.02} min={0.001} max={0.2} step={0.001} onChange={(v) => updateEdge('PVein_LA', 'R', v)} />
                  </div>
              )}
            </>
          )}

          {showGroup('valves') && (
            <>
              <GroupHeader title="Valvular Mechanics" isOpen={openGroups.valves} toggle={() => toggleGroup('valves')} />
              {openGroups.valves && (
                  <div className="mt-1 flex flex-col gap-0 pl-3 border-l-2 border-slate-700/30 ml-2 mb-4">
                     {['MV', 'AoV', 'TV', 'PV'].map(vName => (
                         <div key={vName} className="mb-2 p-2 bg-slate-800/50 rounded">
                             <span className="text-xs font-bold text-slate-300 block mb-2">{vName} Parameters</span>
                             <Slider label={`Amax (Max Area)`} value={(params as any)[`${vName}_Amax`]} min={0.1} max={10.0} step={0.1} onChange={(v) => update(`${vName}_Amax` as any, v)} unit="cm²" />
                             <Slider label={`Aleak (Leak Area)`} value={(params as any)[`${vName}_Aleak`]} min={0.00000} max={1.0} step={0.001} onChange={(v) => update(`${vName}_Aleak` as any, v)} unit="cm²" />
                             <Slider label={`Resistance`} value={(params as any)[`${vName}_R`]} min={0.0005} max={0.05} step={0.0005} onChange={(v) => update(`${vName}_R` as any, v)} />
                             <Slider label={`Inertance`} value={(params as any)[`${vName}_L`]} min={0.0001} max={0.01} step={0.0001} onChange={(v) => update(`${vName}_L` as any, v)} />
                             <Slider label={`kOpen`} value={(params as any)[`${vName}_kOpen`]} min={0.1} max={10.0} step={0.1} onChange={(v) => update(`${vName}_kOpen` as any, v)} />
                             <Slider label={`tauOpen`} value={(params as any)[`${vName}_tauOpen`]} min={0.001} max={0.1} step={0.001} onChange={(v) => update(`${vName}_tauOpen` as any, v)} />
                             <Slider label={`tauClose`} value={(params as any)[`${vName}_tauClose`]} min={0.001} max={0.1} step={0.001} onChange={(v) => update(`${vName}_tauClose` as any, v)} />
                         </div>
                     ))}
                  </div>
              )}
            </>
          )}

          {showGroup('resp') && (
            <>
              <GroupHeader title="Respiratory & Environment" isOpen={openGroups.resp} toggle={() => toggleGroup('resp')} />
              {openGroups.resp && (
                  <div className="mt-2 pl-3 border-l-2 border-slate-700/30 ml-2 mb-4">
                      <Slider label="PEEP" value={params.PEEP} min={0} max={25} step={1} onChange={(v) => update('PEEP', v)} unit="cmH2O" />
                      <Slider label="Base Pleural P (Pth0)" value={params.Pth0} min={-20} max={30} step={1} onChange={(v) => update('Pth0', v)} unit="cmH2O" />
                      <Slider label="Resp Amp (Pleural)" value={params.respAmpTh} min={-20} max={20} step={1} onChange={(v) => update('respAmpTh', v)} unit="cmH2O" />
                      <Slider label="Resp Amp (Alveolar)" value={params.respAmpAlv} min={-20} max={20} step={1} onChange={(v) => update('respAmpAlv', v)} unit="cmH2O" />
                      <Slider label="Respiratory Rate" value={params.respRate} min={0} max={1.0} step={0.05} onChange={(v) => update('respRate', v)} unit="Hz" />
                  </div>
              )}
            </>
          )}

          {showGroup('advanced') && (
            <>
              <GroupHeader title="Advanced Engine" isOpen={openGroups.advanced} toggle={() => toggleGroup('advanced')} />
              {openGroups.advanced && (
                  <div className="mt-2 pl-3 border-l-2 border-slate-700/30 ml-2 mb-4">
                      <div className="flex items-center gap-2 mt-2 mb-4 text-xs">
                         <input type="checkbox" checked={params.useChiResistance} onChange={(e) => update('useChiResistance', e.target.checked)} />
                         <span className="text-slate-300">Use dynamic Starling resistance (χ) for waterfall collapse</span>
                      </div>
                  </div>
              )}
            </>
          )}

      </div>
    </div>
  );
};
