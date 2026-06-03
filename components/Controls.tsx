import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { SimulationParams, SimInstance, type PanelInstanceConfig } from '../types';
import type { SimulationHealth } from '../engine/protocol';
import { type ClinicalKnobs, KNOB_RANGES, neutralKnobs } from '../engine/knobs';
import { rawDisplayParams } from '../engine/instanceKnobs';
import { HealthDot } from './HealthIndicators';

interface ControlsProps {
  instances: SimInstance[];
  instanceHealth?: Record<string, SimulationHealth>;
  activeInstanceId: string;
  updateInstanceParams: (id: string, params: Partial<SimulationParams>) => void;
  updateInstanceKnobs: (id: string, knobs: ClinicalKnobs) => void;
  updateInstanceVolume: (id: string, vol: number) => void;
  isPaneMode?: boolean;
  paneConfig?: Record<string, PanelInstanceConfig>;
}

type NumericKnobKey = Exclude<keyof ClinicalKnobs, 'baroreflexEnabled'>;

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  unit?: string;
  baseline?: number;
  onReset?: () => void;
}

interface ClinicalControlConfig {
  key: NumericKnobKey;
  label: string;
  step: number;
  unit?: string;
}

const clinicalSections: { title: string; controls: ClinicalControlConfig[] }[] = [
  {
    title: 'Cardiac Function',
    controls: [
      { key: 'contractility', label: 'LV Contractility', step: 0.05, unit: 'x' },
      { key: 'contractilityRV', label: 'RV Contractility', step: 0.05, unit: 'x' },
      { key: 'relaxation', label: 'Relaxation', step: 0.05, unit: 'x' },
      { key: 'diastolicStiffness', label: 'Diastolic Stiffness', step: 0.05, unit: 'x' },
    ],
  },
  {
    title: 'Load & Rate',
    controls: [
      { key: 'HR', label: 'Heart Rate', step: 1, unit: 'bpm' },
      { key: 'afterload', label: 'Afterload (SVR)', step: 0.05, unit: 'x' },
      { key: 'arterialStiffness', label: 'Arterial Stiffness', step: 0.05, unit: 'x' },
      { key: 'pulmonaryResistance', label: 'Pulmonary Resistance', step: 0.05, unit: 'x' },
      { key: 'venousTone', label: 'Venous Tone', step: 0.05 },
      { key: 'peep', label: 'PEEP', step: 1, unit: 'cmH2O' },
    ],
  },
  {
    title: 'Valve Lesions',
    controls: [
      { key: 'aorticStenosis', label: 'Aortic Stenosis', step: 0.05 },
      { key: 'aorticRegurgitation', label: 'Aortic Regurgitation', step: 0.05 },
      { key: 'mitralStenosis', label: 'Mitral Stenosis', step: 0.05 },
      { key: 'mitralRegurgitation', label: 'Mitral Regurgitation', step: 0.05 },
      { key: 'tricuspidRegurgitation', label: 'Tricuspid Regurgitation', step: 0.05 },
      { key: 'pulmonicStenosis', label: 'Pulmonic Stenosis', step: 0.05 },
    ],
  },
];

const allClinicalControls = clinicalSections.flatMap(section => section.controls);

const hasChanged = (value: number, baseline: number | undefined, step: number) =>
  baseline !== undefined && Math.abs(value - baseline) > Math.max(step / 2, 0.000001);

const Slider = ({ label, value, min, max, step, onChange, unit, baseline, onReset }: SliderProps) => {
  const decimals = step < 0.01 ? 3 : (step < 0.1 ? 2 : (step < 1 ? 1 : 0));
  const isChanged = hasChanged(value, baseline, step);
  const valueText = value.toFixed(decimals);
  return (
  <div className={`rounded-md border px-2 py-1.5 transition-colors ${isChanged ? 'border-blue-400/30 bg-blue-500/10' : 'border-transparent hover:border-slate-800/80 hover:bg-slate-900/40'}`}>
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1.5">
      <span className={`min-w-0 truncate text-[11px] font-medium ${isChanged ? 'text-blue-100' : 'text-slate-300'}`}>{label}</span>
      <span
        className={`rounded border px-1.5 py-0.5 text-[10px] font-mono leading-none ${isChanged ? 'border-blue-400/40 bg-blue-400/15 text-blue-100' : 'border-slate-700/60 bg-slate-950/60 text-slate-200'}`}
        title={isChanged ? `Baseline ${baseline?.toFixed(decimals)}${unit ? ` ${unit}` : ''}` : undefined}
      >
        {valueText}
        {unit && <span className="ml-0.5 text-[9px] text-slate-400">{unit}</span>}
      </span>
      <button
        type="button"
        onClick={onReset}
        disabled={!isChanged || !onReset}
        className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${isChanged && onReset ? 'border-blue-400/30 bg-blue-400/10 text-blue-100 hover:bg-blue-400/20' : 'pointer-events-none border-transparent text-transparent'}`}
        title={isChanged && baseline !== undefined ? `Reset to ${baseline.toFixed(decimals)}${unit ? ` ${unit}` : ''}` : undefined}
        aria-label={`Reset ${label}`}
      >
        <RotateCcw className="h-3 w-3" />
      </button>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      aria-label={label}
      aria-valuetext={`${valueText}${unit ? ` ${unit}` : ''}`}
      className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded bg-slate-800 accent-blue-500 hover:accent-blue-400 focus:outline-none"
    />
  </div>
  );
};

const ControlGrid = ({ children, tone = 'raw' }: { children: React.ReactNode; tone?: 'clinical' | 'raw' }) => (
  <div className={`grid gap-1.5 [grid-template-columns:repeat(auto-fit,minmax(11rem,1fr))] ${tone === 'clinical' ? 'mb-2' : ''}`}>
    {children}
  </div>
);

const SectionLabel = ({ children, changedCount = 0 }: { children: React.ReactNode; changedCount?: number }) => (
  <div className="col-span-full mb-0.5 mt-2 flex items-center gap-2 first:mt-0">
    <span className="text-[10px] font-semibold uppercase text-slate-400">{children}</span>
    {changedCount > 0 && (
      <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-blue-100">
        {changedCount}
      </span>
    )}
    <span className="h-px flex-1 bg-slate-800/80" />
  </div>
);

const Subhead = ({ children }: { children: React.ReactNode }) => (
  <span className="col-span-full mt-2 block text-[10px] font-semibold uppercase text-slate-400 first:mt-0">{children}</span>
);

const GroupHeader = ({ title, isOpen, toggle, tone = 'raw', changedCount = 0, summary, onReset }: { title: string, isOpen: boolean, toggle: () => void, tone?: 'clinical' | 'raw', changedCount?: number, summary?: string, onReset?: () => void }) => {
    const isClinical = tone === 'clinical';
    return (
    <div className={`mt-1.5 flex h-8 w-full items-center border-y transition-colors ${isClinical ? 'border-blue-500/20 bg-blue-500/10 text-blue-100' : 'border-slate-800/80 bg-slate-900/25 text-slate-300'}`}>
        <button
            type="button"
            onClick={toggle}
            className={`flex h-full min-w-0 flex-1 items-center gap-2 px-2 text-left transition-colors ${isClinical ? 'hover:bg-blue-500/15' : 'hover:bg-slate-800/45'}`}
        >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isClinical ? 'bg-blue-300' : 'bg-slate-500'}`} />
            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold uppercase">
               {title}
            </span>
            {summary && <span className="hidden truncate text-[10px] font-medium normal-case text-slate-500 min-[420px]:inline">{summary}</span>}
            {changedCount > 0 && (
              <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-blue-100">
                {changedCount} changed
              </span>
            )}
            {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />}
        </button>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            disabled={changedCount === 0}
            className={`mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded border transition-colors ${changedCount > 0 ? 'border-blue-400/30 bg-blue-400/10 text-blue-100 hover:bg-blue-400/20' : 'border-transparent text-slate-600'}`}
            title={changedCount > 0 ? 'Reset clinical knobs to baseline' : 'Clinical knobs are at baseline'}
            aria-label="Reset clinical knobs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
    </div>
    );
};

export const Controls: React.FC<ControlsProps> = ({
    instances, instanceHealth, activeInstanceId, updateInstanceParams, updateInstanceKnobs, updateInstanceVolume,
    isPaneMode, paneConfig
}) => {
  const targetInstances = useMemo(() => {
    const availableInstances = instances.filter(i => i.isVisible !== false);
    if (isPaneMode && paneConfig) {
      return availableInstances.filter(i => paneConfig[i.id]?.visible);
    }
    return availableInstances.length > 0 ? availableInstances : instances;
  }, [instances, isPaneMode, paneConfig]);

  const [paneTargetId, setPaneTargetId] = useState(activeInstanceId);

  useEffect(() => {
    const targetIds = new Set(targetInstances.map(i => i.id));
    if (targetIds.has(paneTargetId)) return;
    setPaneTargetId(targetIds.has(activeInstanceId) ? activeInstanceId : targetInstances[0]?.id ?? '');
  }, [activeInstanceId, paneTargetId, targetInstances]);

  const selectedTargetId = paneTargetId;
  const activeInstance = targetInstances.find(i => i.id === selectedTargetId) || targetInstances[0] || (!isPaneMode ? instances[0] : undefined);
  const currentActiveId = activeInstance?.id ?? activeInstanceId;
  const params = activeInstance?.params;
  // RAW advanced sliders display/edit the authored baseline on a knob-primary
  // instance (the clinical knobs multiply on top), so the slider value matches
  // what an edit sets. Absolute-knob params (HR/venousTone/PEEP) show the live
  // derived value. Identical to `params` for legacy raw-only instances.
  const rawView = params
    ? rawDisplayParams({ params, knobs: activeInstance?.knobs, knobBaseline: activeInstance?.knobBaseline })
    : params;

  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({
      clinical: true,   // beginner-facing primary surface, open by default
      global: false,    // raw groups are advanced -> collapsed so beginners aren't overwhelmed
      ventricles: false,
      atria: false,
      vascular: false,
      coronary: false,
      fluids: false,
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
    const newOverrides = { ...(rawView.nodeOverrides || {}) };
    if (!newOverrides[node]) newOverrides[node] = {};
    newOverrides[node] = { ...newOverrides[node], [key]: value };
    update('nodeOverrides', newOverrides as any);
  };
  
  const updateEdge = (edge: string, key: string, value: number) => {
    const newOverrides = { ...(rawView.edgeOverrides || {}) };
    if (!newOverrides[edge]) newOverrides[edge] = {};
    newOverrides[edge] = { ...newOverrides[edge], [key]: value };
    update('edgeOverrides', newOverrides as any);
  };

  // Read a FLAT numeric node override (these sliders never edit the nested
  // `active` chamber sub-block, which can be a Record rather than a number).
  const nodeNum = (node: string, key: string, fallback: number): number => {
    const v = rawView.nodeOverrides?.[node]?.[key];
    return typeof v === "number" ? v : fallback;
  };

  if (!params) return null;

  // Clinical knob layer (M4-lite). Lazily neutral until the instance has its own
  // knobs; editing a knob makes the instance knob-primary (params become derived).
  const knobs: ClinicalKnobs = activeInstance.knobs ?? neutralKnobs(params);
  const baselineKnobs = neutralKnobs(activeInstance.knobBaseline ?? params);
  const updateKnob = (key: keyof ClinicalKnobs, val: number) => {
      if (activeInstance) updateInstanceKnobs(activeInstance.id, { ...knobs, [key]: val });
  };
  const kr = (key: keyof ClinicalKnobs): [number, number] => KNOB_RANGES[key] ?? [0, 1];
  const changedClinicalControls = allClinicalControls.filter(control =>
    hasChanged(knobs[control.key], baselineKnobs[control.key], control.step)
  );
  const changedClinicalCount = changedClinicalControls.length;
  const changedClinicalSummary = changedClinicalControls.slice(0, 2).map(control => control.label).join(', ');
  const clinicalBodyClass = "mt-1 mb-2 border-l border-blue-500/25 pl-1.5";
  const rawBodyClass = "mt-1 mb-2 border-l border-slate-700/45 pl-1.5";
  const resetClinicalKnobs = () => {
    if (!activeInstance || changedClinicalCount === 0) return;
    const nextKnobs: ClinicalKnobs = { ...knobs };
    for (const control of changedClinicalControls) {
      nextKnobs[control.key] = baselineKnobs[control.key];
    }
    updateInstanceKnobs(activeInstance.id, nextKnobs);
  };

  const showGroup = (key: string) => {
      if (isPaneMode && paneConfig && paneConfig[currentActiveId]) {
          const selectedSignals = paneConfig[currentActiveId].selectedSignals ?? [];
          return selectedSignals.includes(key) || selectedSignals.some((sig: string) => sig.toLowerCase() === key.toLowerCase());
      }
      return true;
  };

  return (
    <div className="absolute inset-0 flex flex-col gap-0 h-full bg-transparent overflow-hidden">
      
      {targetInstances.length > 1 && (
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-800/60 bg-transparent px-2 py-1.5 custom-scrollbar">
         {targetInstances.map(inst => (
            <button
                key={inst.id}
                onClick={() => setPaneTargetId(inst.id)}
                className={`flex h-7 items-center gap-1.5 rounded border px-2 text-[11px] font-semibold transition-colors whitespace-nowrap ${currentActiveId === inst.id ? 'border-blue-400/45 bg-blue-400/15 text-blue-100' : 'border-slate-800/70 bg-slate-900/35 text-slate-500 hover:border-slate-700 hover:text-slate-300'}`}
            >
                <div className="h-2 w-2 rounded-full" style={{backgroundColor: inst.color, boxShadow: currentActiveId === inst.id ? `0 0 6px ${inst.color}` : undefined}}></div>
                {inst.name}
                <HealthDot status={instanceHealth?.[inst.id]?.status ?? 'ok'} title={`${inst.name} health`} />
            </button>
         ))}
      </div>
      )}

      {/* Pane content - edits apply to the pane-local target in pane mode. */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">

          {showGroup('clinical') && (
            <>
              <GroupHeader title="Clinical Knobs" isOpen={openGroups.clinical} toggle={() => toggleGroup('clinical')} tone="clinical" changedCount={changedClinicalCount} summary={changedClinicalSummary} onReset={resetClinicalKnobs} />
              {openGroups.clinical && (
                  <div className={clinicalBodyClass}>
                      {clinicalSections.map(section => {
                        const sectionChangedCount = section.controls.filter(control =>
                          hasChanged(knobs[control.key], baselineKnobs[control.key], control.step)
                        ).length;
                        return (
                          <React.Fragment key={section.title}>
                            <ControlGrid tone="clinical">
                              <SectionLabel changedCount={sectionChangedCount}>{section.title}</SectionLabel>
                              {section.controls.map(control => {
                                const [min, max] = kr(control.key);
                                return (
                                  <Slider
                                    key={control.key}
                                    label={control.label}
                                    value={knobs[control.key]}
                                    baseline={baselineKnobs[control.key]}
                                    min={min}
                                    max={max}
                                    step={control.step}
                                    onChange={(v) => updateKnob(control.key, v)}
                                    onReset={() => updateKnob(control.key, baselineKnobs[control.key])}
                                    unit={control.unit}
                                  />
                                );
                              })}
                            </ControlGrid>
                          </React.Fragment>
                        );
                      })}
                  </div>
              )}
            </>
          )}

          {showGroup('global') && (
            <>
              <GroupHeader title="Global Physiology" isOpen={openGroups.global} toggle={() => toggleGroup('global')} />
              {openGroups.global && (
                  <div className={rawBodyClass}>
                    <ControlGrid>
                      <Slider label="Heart Rate" value={rawView.HR} min={30} max={180} step={1} onChange={(v) => update('HR', v)} unit="bpm" />
                      <Slider label="Total Blood Volume" value={activeInstance.targetVolume} min={2000} max={8000} step={50} onChange={(v) => updateInstanceVolume(activeInstance.id, v)} unit="mL" />
                      <Slider label="Global Venous Tone" value={rawView.venousTone} min={0} max={1} step={0.05} onChange={(v) => update('venousTone', v)} />
                      <Slider label="Global Contractility" value={rawView.contractility} min={0.25} max={2.5} step={0.05} onChange={(v) => update('contractility', v)} unit="x" />
                      <Slider label="Global Relaxation" value={rawView.relaxation} min={0.25} max={2.5} step={0.05} onChange={(v) => update('relaxation', v)} unit="x" />
                    </ControlGrid>
              </div>
          )}
          </>
      )}

          {showGroup('ventricles') && (
            <>
              <GroupHeader title="Ventricular Mechanics" isOpen={openGroups.ventricles} toggle={() => toggleGroup('ventricles')} />
              {openGroups.ventricles && (
                  <div className={rawBodyClass}>
                      <div className="mb-3">
                          <span className="text-[11px] font-medium text-slate-400 block mb-1">Ventricle Model</span>
                          <div className="flex gap-1 bg-slate-950 rounded p-0.5 border border-slate-800">
                              {([['activeStress', 'Active-stress'], ['elastance', 'Elastance']] as const).map(([mode, label]) => (
                                  <button
                                      key={mode}
                                      onClick={() => update('heartModel', mode)}
                                      className={`flex-1 py-1 text-[11px] font-semibold rounded transition-colors ${params.heartModel === mode ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500 hover:text-slate-300'}`}
                                      title={mode === 'activeStress' ? 'Single-fibre active-stress LV/RV (default)' : 'Time-varying elastance fallback'}
                                  >
                                      {label}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <ControlGrid>
                      <Subhead>Left Ventricle (LV)</Subhead>
                      <Slider label="LV Baseline Volume (V0)" value={nodeNum('LV', 'V0', 10)} min={0} max={100} step={1} onChange={(v) => updateNode('LV', 'V0', v)} unit="mL" />
                      <Slider label="LV Tmax Scale (Force)" value={rawView.lvTmaxScale} min={0.05} max={2.5} step={0.05} onChange={(v) => update('lvTmaxScale', v)} unit="x" />
                      <Slider label="LV Ca²⁺ Release Scale" value={rawView.caReleaseScale} min={0.25} max={6} step={0.1} onChange={(v) => update('caReleaseScale', v)} unit="x" />
                      <Slider label="LV Geometry Scale" value={rawView.lvGeomScale} min={0.5} max={2.5} step={0.1} onChange={(v) => update('lvGeomScale', v)} unit="x" />

                      <Subhead>Right Ventricle (RV)</Subhead>
                      <Slider label="RV Baseline Volume (V0)" value={nodeNum('RV', 'V0', 15)} min={0} max={100} step={1} onChange={(v) => updateNode('RV', 'V0', v)} unit="mL" />
                      <Slider label="RV Tmax Scale (Force)" value={rawView.rvTmaxScale} min={0.05} max={3.0} step={0.05} onChange={(v) => update('rvTmaxScale', v)} unit="x" />
                      <Slider label="RV Ca²⁺ Release Scale" value={rawView.rvCaReleaseScale} min={0.25} max={8} step={0.1} onChange={(v) => update('rvCaReleaseScale', v)} unit="x" />
                      <Slider label="RV Geometry Scale" value={rawView.rvGeomScale} min={0.5} max={3.0} step={0.1} onChange={(v) => update('rvGeomScale', v)} unit="x" />

                      <Subhead>Pericardium & Septum</Subhead>
                      <div className="col-span-full flex items-center gap-2 rounded border border-slate-800/60 bg-slate-900/35 px-2 py-1.5 text-xs">
                         <input type="checkbox" checked={rawView.pericardiumEnabled} onChange={(e) => update('pericardiumEnabled', e.target.checked)} />
                         <span className="text-slate-300">Pericardial constraint enabled</span>
                      </div>
                      <Slider label="Pericardial Constraint" value={rawView.pericardialPressureScaleMmHg} min={0} max={12} step={0.25} onChange={(v) => update('pericardialPressureScaleMmHg', v)} unit="mmHg" />
                      <Slider label="Pericardial Effusion" value={rawView.pericardialFluidMl} min={0} max={500} step={10} onChange={(v) => update('pericardialFluidMl', v)} unit="mL" />
                      <Slider label="Pericardial Slack Volume" value={rawView.pericardialSlackVolumeMl} min={220} max={600} step={10} onChange={(v) => update('pericardialSlackVolumeMl', v)} unit="mL" />
                      <div className="col-span-full flex items-center gap-2 rounded border border-slate-800/60 bg-slate-900/35 px-2 py-1.5 text-xs">
                         <input type="checkbox" checked={rawView.septalCouplingEnabled} onChange={(e) => update('septalCouplingEnabled', e.target.checked)} />
                         <span className="text-slate-300">Septal volume-shift enabled</span>
                      </div>
                      <Slider label="Septal Stiffness" value={rawView.septalStiffnessScale} min={0.25} max={3.0} step={0.05} onChange={(v) => update('septalStiffnessScale', v)} unit="x" />
                      <Slider label="Septal Max Shift" value={rawView.septalMaxShiftMl} min={0} max={50} step={1} onChange={(v) => update('septalMaxShiftMl', v)} unit="mL" />
                      <Slider label="Septal LV Force Weight" value={rawView.septalLvPressureWeight} min={0} max={1} step={0.02} onChange={(v) => update('septalLvPressureWeight', v)} />
                      </ControlGrid>
                  </div>
              )}
            </>
          )}

          {showGroup('atria') && (
            <>
              <GroupHeader title="Atrial Mechanics" isOpen={openGroups.atria} toggle={() => toggleGroup('atria')} />
              {openGroups.atria && (
                  <div className={rawBodyClass}>
                    <ControlGrid>
                      <Subhead>Left Atrium (LA)</Subhead>
                      <Slider label="LA Baseline Volume (V0)" value={nodeNum('LA', 'V0', 5)} min={0} max={50} step={1} onChange={(v) => updateNode('LA', 'V0', v)} unit="mL" />
                      <Slider label="LA Elastance (Ees)" value={nodeNum('LA', 'Ees', 0.25)} min={0.05} max={2.0} step={0.05} onChange={(v) => updateNode('LA', 'Ees', v)} />

                      <Subhead>Right Atrium (RA)</Subhead>
                      <Slider label="RA Baseline Volume (V0)" value={nodeNum('RA', 'V0', 5)} min={0} max={50} step={1} onChange={(v) => updateNode('RA', 'V0', v)} unit="mL" />
                      <Slider label="RA Elastance (Ees)" value={nodeNum('RA', 'Ees', 0.22)} min={0.05} max={2.0} step={0.05} onChange={(v) => updateNode('RA', 'Ees', v)} />
                    </ControlGrid>
                  </div>
              )}
            </>
          )}

          {showGroup('vascular') && (
            <>
              <GroupHeader title="Vascular Resistance & Compliance" isOpen={openGroups.vascular} toggle={() => toggleGroup('vascular')} />
              {openGroups.vascular && (
                  <div className={rawBodyClass}>
                    <ControlGrid>
                      <Subhead>Global Scale Multipliers</Subhead>
                      <Slider label="Systemic Resistance" value={rawView.systemicResistance} min={0.2} max={3.5} step={0.05} onChange={(v) => update('systemicResistance', v)} unit="x" />
                      <Slider label="Pulmonary Resistance" value={rawView.pulmonaryResistance} min={0.2} max={4.0} step={0.05} onChange={(v) => update('pulmonaryResistance', v)} unit="x" />
                      <Slider label="Global Arterial Stiffness" value={rawView.arterialStiffness} min={0.4} max={3.0} step={0.05} onChange={(v) => update('arterialStiffness', v)} unit="x" />

                      <Subhead>Systemic Segment Resistance</Subhead>
                      <Slider label="Ao → SA" value={rawView.edgeOverrides?.Ao_SA?.R ?? 0.05} min={0.01} max={0.5} step={0.01} onChange={(v) => updateEdge('Ao_SA', 'R', v)} />
                      <Slider label="SA → Art" value={rawView.edgeOverrides?.SA_Art?.R ?? 0.08} min={0.01} max={0.5} step={0.01} onChange={(v) => updateEdge('SA_Art', 'R', v)} />
                      <Slider label="Art → Cap" value={rawView.edgeOverrides?.Art_Cap?.R ?? 0.65} min={0.1} max={3.0} step={0.05} onChange={(v) => updateEdge('Art_Cap', 'R', v)} />
                      <Slider label="Cap → SV" value={rawView.edgeOverrides?.Cap_SV?.R ?? 0.15} min={0.01} max={1.0} step={0.01} onChange={(v) => updateEdge('Cap_SV', 'R', v)} />
                      <Slider label="SV → VC" value={rawView.edgeOverrides?.SV_VC?.R ?? 0.05} min={0.01} max={0.5} step={0.01} onChange={(v) => updateEdge('SV_VC', 'R', v)} />
                      <Slider label="VC → RA" value={rawView.edgeOverrides?.VC_RA?.R ?? 0.04} min={0.01} max={0.3} step={0.01} onChange={(v) => updateEdge('VC_RA', 'R', v)} />

                      <Subhead>Pulmonary Segment Resistance</Subhead>
                      <Slider label="PA → PArt" value={rawView.edgeOverrides?.PA_PArt?.R ?? 0.01} min={0.001} max={0.1} step={0.001} onChange={(v) => updateEdge('PA_PArt', 'R', v)} />
                      <Slider label="PArt → PCap" value={rawView.edgeOverrides?.PArt_PCap?.R ?? 0.04} min={0.01} max={0.3} step={0.01} onChange={(v) => updateEdge('PArt_PCap', 'R', v)} />
                      <Slider label="PCap → PVen" value={rawView.edgeOverrides?.PCap_PVen?.R ?? 0.03} min={0.01} max={0.3} step={0.01} onChange={(v) => updateEdge('PCap_PVen', 'R', v)} />
                      <Slider label="PVen → PVein" value={rawView.edgeOverrides?.PVen_PVein?.R ?? 0.01} min={0.001} max={0.1} step={0.001} onChange={(v) => updateEdge('PVen_PVein', 'R', v)} />
                      <Slider label="PVein → LA" value={rawView.edgeOverrides?.PVein_LA?.R ?? 0.02} min={0.001} max={0.2} step={0.001} onChange={(v) => updateEdge('PVein_LA', 'R', v)} />
                    </ControlGrid>
                  </div>
              )}
            </>
          )}

          {showGroup('coronary') && (
            <>
              <GroupHeader title="Coronary Circulation" isOpen={openGroups.coronary} toggle={() => toggleGroup('coronary')} />
              {openGroups.coronary && (
                  <div className="mt-2 pl-3 border-l-2 border-slate-700/30 ml-2 mb-4">
                      <div className="flex items-center gap-2 mt-2 mb-2 text-xs">
                         <input type="checkbox" checked={rawView.coronaryEnabled} onChange={(e) => update('coronaryEnabled', e.target.checked)} />
                         <span className="text-slate-300">Coronary bed enabled</span>
                      </div>
                      <Slider label="Coronary Resistance" value={rawView.coronaryResistanceScale} min={0.2} max={5.0} step={0.05} onChange={(v) => update('coronaryResistanceScale', v)} unit="x" />
                      <Slider label="Myocardial Compression" value={rawView.coronaryCompressionScale} min={0} max={2.0} step={0.05} onChange={(v) => update('coronaryCompressionScale', v)} unit="x" />
                      <Slider label="Hyperemia / Vasodilator" value={rawView.coronaryVasodilator} min={0} max={1} step={0.05} onChange={(v) => update('coronaryVasodilator', v)} />
                      <Slider label="Reserve Max" value={rawView.coronaryReserveMax} min={1} max={5} step={0.1} onChange={(v) => update('coronaryReserveMax', v)} unit="x" />

                      <span className="text-xs font-bold text-slate-300 block mt-4 mb-1">Epicardial Diameter Stenosis</span>
                      <Slider label="LAD Stenosis" value={rawView.LADStenosis} min={0} max={0.95} step={0.01} onChange={(v) => update('LADStenosis', v)} />
                      <Slider label="LCx Stenosis" value={rawView.LCxStenosis} min={0} max={0.95} step={0.01} onChange={(v) => update('LCxStenosis', v)} />
                      <Slider label="RCA Stenosis" value={rawView.RCAStenosis} min={0} max={0.95} step={0.01} onChange={(v) => update('RCAStenosis', v)} />
                  </div>
              )}
            </>
          )}

          {showGroup('fluids') && (
            <>
              <GroupHeader title="Fluids & Hemorrhage" isOpen={openGroups.fluids} toggle={() => toggleGroup('fluids')} />
              {openGroups.fluids && (
                  <div className={rawBodyClass}>
                    <ControlGrid>
                      <Slider label="Hemorrhage Rate" value={rawView.bleedRate} min={0} max={1500} step={25} onChange={(v) => update('bleedRate', v)} unit="mL/min" />
                      <Slider label="Fluid / Transfusion Rate" value={rawView.fluidRate} min={0} max={1500} step={25} onChange={(v) => update('fluidRate', v)} unit="mL/min" />
                      <span className="col-span-full block text-[10px] text-slate-500">Net volume change is integrated over time; no autonomic compensation (baroreflex is a later phase).</span>
                    </ControlGrid>
                  </div>
              )}
            </>
          )}

          {showGroup('valves') && (
            <>
              <GroupHeader title="Valvular Mechanics" isOpen={openGroups.valves} toggle={() => toggleGroup('valves')} />
              {openGroups.valves && (
                  <div className={`${rawBodyClass} flex flex-col gap-0`}>
                     {['MV', 'AoV', 'TV', 'PV'].map(vName => (
                         <div key={vName} className="mb-1.5 rounded border border-slate-800/70 bg-slate-900/35 p-1.5">
                             <span className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">{vName} Parameters</span>
                             <ControlGrid>
                             <Slider label={`Amax (Max Area)`} value={(params as any)[`${vName}_Amax`]} min={0.1} max={10.0} step={0.1} onChange={(v) => update(`${vName}_Amax` as any, v)} unit="cm²" />
                             <Slider label={`Aleak (Leak Area)`} value={(params as any)[`${vName}_Aleak`]} min={0.00000} max={1.0} step={0.001} onChange={(v) => update(`${vName}_Aleak` as any, v)} unit="cm²" />
                             <Slider label={`Resistance`} value={(params as any)[`${vName}_R`]} min={0.0005} max={0.05} step={0.0005} onChange={(v) => update(`${vName}_R` as any, v)} />
                             <Slider label={`Inertance`} value={(params as any)[`${vName}_L`]} min={0.0001} max={0.01} step={0.0001} onChange={(v) => update(`${vName}_L` as any, v)} />
                             <Slider label={`kOpen`} value={(params as any)[`${vName}_kOpen`]} min={0.1} max={10.0} step={0.1} onChange={(v) => update(`${vName}_kOpen` as any, v)} />
                             <Slider label={`tauOpen`} value={(params as any)[`${vName}_tauOpen`]} min={0.001} max={0.1} step={0.001} onChange={(v) => update(`${vName}_tauOpen` as any, v)} />
                             <Slider label={`tauClose`} value={(params as any)[`${vName}_tauClose`]} min={0.001} max={0.1} step={0.001} onChange={(v) => update(`${vName}_tauClose` as any, v)} />
                             </ControlGrid>
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
                  <div className={rawBodyClass}>
                    <ControlGrid>
                      <Slider label="PEEP" value={rawView.PEEP} min={0} max={25} step={1} onChange={(v) => update('PEEP', v)} unit="cmH2O" />
                      <Slider label="Base Pleural P (Pth0)" value={rawView.Pth0} min={-20} max={30} step={1} onChange={(v) => update('Pth0', v)} unit="cmH2O" />
                      <Slider label="Resp Amp (Pleural)" value={rawView.respAmpTh} min={-20} max={20} step={1} onChange={(v) => update('respAmpTh', v)} unit="cmH2O" />
                      <Slider label="Resp Amp (Alveolar)" value={rawView.respAmpAlv} min={-20} max={20} step={1} onChange={(v) => update('respAmpAlv', v)} unit="cmH2O" />
                      <Slider label="Respiratory Rate" value={rawView.respRate} min={0} max={1.0} step={0.05} onChange={(v) => update('respRate', v)} unit="Hz" />
                    </ControlGrid>
                  </div>
              )}
            </>
          )}

          {showGroup('advanced') && (
            <>
              <GroupHeader title="Advanced Engine" isOpen={openGroups.advanced} toggle={() => toggleGroup('advanced')} />
              {openGroups.advanced && (
                  <div className={rawBodyClass}>
                      <div className="flex items-center gap-2 rounded border border-slate-800/60 bg-slate-900/35 px-2 py-1.5 text-xs">
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
