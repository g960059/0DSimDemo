import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { SimulationParams, SimInstance, type ControllerItem, type PanelInstanceConfig } from '../types';
import type { SimulationHealth } from '../engine/protocol';
import { type ClinicalKnobs, KNOB_RANGES, neutralKnobs } from '../engine/knobs';
import { rawDisplayParams } from '../engine/instanceKnobs';
import { CONTROLLER_CATALOG, CONTROLLER_CATALOG_SECTIONS } from '../controllerCatalog';
import { buttonOptionsFromRange, normalizeControllerItems } from '../controllerItems';
import { defaultControllerItemFor, readingButtonOptionsFor } from '../knobMetadata';
import { rawParamCatalogEntry } from '../rawParameterCatalog';
import { HealthDot } from './HealthIndicators';
import { ControllerItemControl } from './controls/ControllerItemControl';
import { Slider, hasChanged } from './controls/Slider';
import { controllerOptionsWithLabelKeys, translatedControllerCategory, translatedControllerItemLabel, translatedControllerOptions, translatedKnobLabel } from '../i18nText';

interface ControlsProps {
  instances: SimInstance[];
  instanceHealth?: Record<string, SimulationHealth>;
  activeInstanceId: string;
  updateInstanceParams: (id: string, params: Partial<SimulationParams>) => void;
  updateInstanceKnobs: (id: string, knobs: ClinicalKnobs) => void;
  updateInstanceVolume: (id: string, vol: number) => void;
  isPaneMode?: boolean;
  paneConfig?: Record<string, PanelInstanceConfig>;
  presentationMode?: 'studio' | 'reading';
  controllerItems?: ControllerItem[];
}

type NumericKnobKey = Exclude<keyof ClinicalKnobs, 'baroreflexEnabled'>;
type ClinicalControlConfig = { key: NumericKnobKey; label: string; step: number; unit?: string };
const clinicalSections = CONTROLLER_CATALOG_SECTIONS;
const allClinicalControls = CONTROLLER_CATALOG;
const catalogByKey = new Map(CONTROLLER_CATALOG.map((entry) => [entry.key, entry]));

export function getChangedClinicalControls(
  knobs: ClinicalKnobs,
  baselineKnobs: ClinicalKnobs,
  controls: ClinicalControlConfig[],
): ClinicalControlConfig[] {
  return controls.filter(control =>
    hasChanged(knobs[control.key], baselineKnobs[control.key], control.step)
  );
}

export function resetClinicalKnobsToBaseline(
  knobs: ClinicalKnobs,
  baselineKnobs: ClinicalKnobs,
  controls: ClinicalControlConfig[],
): ClinicalKnobs {
  const nextKnobs: ClinicalKnobs = { ...knobs };
  for (const control of controls) {
    nextKnobs[control.key] = baselineKnobs[control.key];
  }
  return nextKnobs;
}

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

const GroupHeader = ({ title, isOpen, toggle, tone = 'raw', changedCount = 0, summary, onReset, changedLabel, resetLabel, resetTitle }: { title: string, isOpen: boolean, toggle: () => void, tone?: 'clinical' | 'raw', changedCount?: number, summary?: string, onReset?: () => void, changedLabel: string, resetLabel: string, resetTitle?: string }) => {
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
                {changedCount} {changedLabel}
              </span>
            )}
            {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />}
        </button>
        {onReset && changedCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="mr-1 flex h-6 shrink-0 items-center gap-1 rounded border border-blue-400/30 bg-blue-400/10 px-1.5 text-blue-100 transition-colors hover:bg-blue-400/20"
            title={resetTitle ?? resetLabel}
            aria-label={resetTitle ?? resetLabel}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold">{resetLabel}</span>
          </button>
        )}
    </div>
    );
};

export const Controls: React.FC<ControlsProps> = ({
    instances, instanceHealth, activeInstanceId, updateInstanceParams, updateInstanceKnobs, updateInstanceVolume,
    isPaneMode, paneConfig, presentationMode = 'studio', controllerItems
}) => {
  const { t } = useTranslation();
  const isStudioMode = presentationMode === 'studio';
  const isReadingMode = presentationMode === 'reading';
  const authored = useMemo(() => normalizeControllerItems(controllerItems ?? []).items, [controllerItems]);
  const hasAuthored = authored.length > 0;
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
  const changedCandidateClinicalControls = hasAuthored
    ? authored.filter((item) => catalogByKey.has(item.paramKey as NumericKnobKey)).map((item) => {
        const meta = catalogByKey.get(item.paramKey as NumericKnobKey);
        return {
          key: item.paramKey as NumericKnobKey,
          label: translatedControllerItemLabel(t, item, meta?.label ?? item.paramKey),
          step: item.step ?? meta?.step ?? 0.01,
          unit: meta?.unit,
        } satisfies ClinicalControlConfig;
      })
    : isReadingMode
      ? allClinicalControls.filter(control => readingButtonOptionsFor(control.key, baselineKnobs[control.key]) != null)
      : allClinicalControls;
  const changedClinicalControls = getChangedClinicalControls(knobs, baselineKnobs, changedCandidateClinicalControls);
  const changedClinicalCount = changedClinicalControls.length;
  const changedClinicalSummary = changedClinicalControls.slice(0, 2).map(control => control.label).join(', ');
  const clinicalBodyClass = "mt-1 mb-2 border-l border-blue-500/25 pl-1.5";
  const rawBodyClass = "mt-1 mb-2 border-l border-slate-700/45 pl-1.5";
  const resetClinicalKnobs = () => {
    if (!activeInstance || changedClinicalCount === 0) return;
    updateInstanceKnobs(activeInstance.id, resetClinicalKnobsToBaseline(knobs, baselineKnobs, changedClinicalControls));
  };

  const showGroup = (key: string) => {
    if (isPaneMode && paneConfig && paneConfig[currentActiveId]) {
      const selectedSignals = paneConfig[currentActiveId].selectedSignals ?? [];
      return selectedSignals.includes(key) || selectedSignals.some((sig: string) => sig.toLowerCase() === key.toLowerCase());
    }
    return true;
  };

  const authoredControls = hasAuthored ? (
    <div className="grid gap-1.5">
      {authored.map((item) => {
        const key = item.paramKey as NumericKnobKey;
        const meta = catalogByKey.get(key);
        const rawMeta = rawParamCatalogEntry(item.paramKey);
        const isClinical = meta != null;
        const rawValue = rawView[item.paramKey as keyof SimulationParams];
        const value = isClinical
          ? knobs[key]
          : (typeof rawValue === 'number' ? rawValue : item.min ?? rawMeta?.min ?? 0);
        const baseline = isClinical ? baselineKnobs[key] : undefined;
        const readingOptions = item.kind === 'buttonGroup' && item.options
          ? translatedControllerOptions(t, item.options)
          : translatedControllerOptions(t, controllerOptionsWithLabelKeys(item, readingButtonOptionsFor(item.paramKey, baseline ?? value) ?? buttonOptionsFromRange(item), baseline ?? value));
        const displayItem: ControllerItem = isReadingMode
          ? { ...item, kind: 'buttonGroup', label: translatedControllerItemLabel(t, item, meta?.label ?? rawMeta?.label ?? item.paramKey), options: readingOptions }
          : { ...item, label: translatedControllerItemLabel(t, item, meta?.label ?? rawMeta?.label ?? item.paramKey), ...(item.options ? { options: translatedControllerOptions(t, item.options) } : {}) };
        return (
          <ControllerItemControl
            key={item.paramKey}
            item={displayItem}
            value={value}
            baseline={baseline}
            onChange={(v) => isClinical ? updateKnob(key, v) : update(item.paramKey as keyof SimulationParams, v)}
            onReset={isClinical ? () => updateKnob(key, baselineKnobs[key]) : undefined}
            unit={meta?.unit ?? rawMeta?.unit}
          />
        );
      })}
    </div>
  ) : null;

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
                <HealthDot status={instanceHealth?.[inst.id]?.status ?? 'ok'} title={t('health.instanceHealth', { name: inst.name })} />
            </button>
         ))}
      </div>
      )}

      {/* Pane content - edits apply to the pane-local target in pane mode. */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">

          {hasAuthored && authoredControls}

          {!hasAuthored && (isReadingMode || showGroup('clinical')) && (
            <>
              <GroupHeader title={t('workbench.controls.groups.clinical')} isOpen={openGroups.clinical} toggle={() => toggleGroup('clinical')} tone="clinical" changedCount={changedClinicalCount} summary={changedClinicalSummary} onReset={resetClinicalKnobs} changedLabel={t('workbench.controls.changed')} resetLabel={t('workbench.controls.reset')} resetTitle={t('workbench.controls.resetClinicalBaseline')} />
              {openGroups.clinical && (
                  <div className={clinicalBodyClass}>
                      {clinicalSections.map(section => {
                          const visibleControls = isReadingMode
                            ? section.controls
                                .map(control => ({
                                  control,
                                  options: readingButtonOptionsFor(control.key, baselineKnobs[control.key]),
                                }))
                                .filter((entry): entry is { control: (typeof section.controls)[number]; options: { label: string; value: number }[] } => entry.options != null)
                            : section.controls.map(control => ({ control, options: null }));
                          const sectionChangedCount = visibleControls.filter(({ control }) =>
                            hasChanged(knobs[control.key], baselineKnobs[control.key], control.step)
                          ).length;
                          if (visibleControls.length === 0) return null;
                          return (
                            <React.Fragment key={section.title}>
                              <ControlGrid tone="clinical">
                                <SectionLabel changedCount={sectionChangedCount}>{translatedControllerCategory(t, section.title)}</SectionLabel>
                                {visibleControls.map(({ control, options }) => {
                                  const [min, max] = kr(control.key);
                                  return (
                                    <ControllerItemControl
                                      key={control.key}
                                      item={{
                                        ...defaultControllerItemFor(control.key),
                                        kind: isReadingMode ? 'buttonGroup' : 'slider',
                                        label: translatedKnobLabel(t, control.key, control.label),
                                        min,
                                        max,
                                        step: control.step,
                                        ...(options ? { options: translatedControllerOptions(t, controllerOptionsWithLabelKeys(defaultControllerItemFor(control.key), options, baselineKnobs[control.key])) } : {}),
                                      }}
                                      value={knobs[control.key]}
                                      baseline={baselineKnobs[control.key]}
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

          {!hasAuthored && isStudioMode && showGroup('global') && (
            <>
              <GroupHeader title={t('workbench.controls.groups.global')} isOpen={openGroups.global} toggle={() => toggleGroup('global')} changedLabel={t('workbench.controls.changed')} resetLabel={t('workbench.controls.reset')} />
              {openGroups.global && (
                  <div className={rawBodyClass}>
                    <ControlGrid>
                      <Slider label={t('workbench.controls.raw.heartRate')} value={rawView.HR} min={30} max={180} step={1} onChange={(v) => update('HR', v)} unit="bpm" />
                      <Slider label={t('workbench.controls.raw.avDelay')} value={rawView.avDelaySec} min={0.04} max={0.30} step={0.005} onChange={(v) => update('avDelaySec', v)} unit="s" />
                      <Slider label={t('workbench.controls.raw.totalBloodVolume')} value={activeInstance.targetVolume} min={2000} max={8000} step={50} onCommit={(v) => updateInstanceVolume(activeInstance.id, v)} unit="mL" />
                      <Slider label={t('workbench.controls.raw.globalVenousTone')} value={rawView.venousTone} min={0} max={1} step={0.05} onChange={(v) => update('venousTone', v)} />
                      <Slider label={t('workbench.controls.raw.globalContractility')} value={rawView.contractility} min={0.25} max={2.5} step={0.05} onChange={(v) => update('contractility', v)} unit="x" />
                      <Slider label={t('workbench.controls.raw.globalRelaxation')} value={rawView.relaxation} min={0.25} max={2.5} step={0.05} onChange={(v) => update('relaxation', v)} unit="x" />
                    </ControlGrid>
              </div>
          )}
          </>
      )}

          {!hasAuthored && isStudioMode && showGroup('ventricles') && (
            <>
              <GroupHeader title={t('workbench.controls.groups.ventricles')} isOpen={openGroups.ventricles} toggle={() => toggleGroup('ventricles')} changedLabel={t('workbench.controls.changed')} resetLabel={t('workbench.controls.reset')} />
              {openGroups.ventricles && (
                  <div className={rawBodyClass}>
                      <div className="mb-3">
                          <span className="text-[11px] font-medium text-slate-400 block mb-1">{t('workbench.controls.raw.ventricleModel')}</span>
                          <div className="flex gap-1 bg-slate-950 rounded p-0.5 border border-slate-800">
                              {([['activeStress', t('workbench.controls.raw.activeStress')], ['elastance', t('workbench.controls.raw.elastance')]] as const).map(([mode, label]) => (
                                  <button
                                      key={mode}
                                      onClick={() => update('heartModel', mode)}
                                      className={`flex-1 py-1 text-[11px] font-semibold rounded transition-colors ${params.heartModel === mode ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500 hover:text-slate-300'}`}
                                      title={mode === 'activeStress' ? t('workbench.controls.raw.activeStressTitle') : t('workbench.controls.raw.elastanceTitle')}
                                  >
                                      {label}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <ControlGrid>
                      <Subhead>{t('workbench.controls.raw.leftVentricle')}</Subhead>
                      <Slider label={t('workbench.controls.raw.lvBaselineVolume')} value={nodeNum('LV', 'V0', 10)} min={0} max={100} step={1} onChange={(v) => updateNode('LV', 'V0', v)} unit="mL" />
                      <Slider label={t('workbench.controls.raw.lvTveEes')} value={nodeNum('LV', 'Ees', 1.6)} min={0.4} max={4.0} step={0.05} onChange={(v) => updateNode('LV', 'Ees', v)} unit="mmHg/mL" />
                      <Slider label={t('workbench.controls.raw.lvTmaxScale')} value={rawView.lvTmaxScale} min={0.05} max={2.5} step={0.05} onChange={(v) => update('lvTmaxScale', v)} unit="x" />
                      <Slider label={t('workbench.controls.raw.lvCaReleaseScale')} value={rawView.caReleaseScale} min={0.25} max={6} step={0.1} onChange={(v) => update('caReleaseScale', v)} unit="x" />
                      <Slider label={t('workbench.controls.raw.lvGeometryScale')} value={rawView.lvGeomScale} min={0.5} max={2.5} step={0.1} onChange={(v) => update('lvGeomScale', v)} unit="x" />

                      <Subhead>{t('workbench.controls.raw.rightVentricle')}</Subhead>
                      <Slider label={t('workbench.controls.raw.rvBaselineVolume')} value={nodeNum('RV', 'V0', 15)} min={0} max={100} step={1} onChange={(v) => updateNode('RV', 'V0', v)} unit="mL" />
                      <Slider label={t('workbench.controls.raw.rvTveEes')} value={nodeNum('RV', 'Ees', 0.85)} min={0.2} max={2.0} step={0.05} onChange={(v) => updateNode('RV', 'Ees', v)} unit="mmHg/mL" />
                      <Slider label={t('workbench.controls.raw.rvTmaxScale')} value={rawView.rvTmaxScale} min={0.05} max={3.0} step={0.05} onChange={(v) => update('rvTmaxScale', v)} unit="x" />
                      <Slider label={t('workbench.controls.raw.rvCaReleaseScale')} value={rawView.rvCaReleaseScale} min={0.25} max={8} step={0.1} onChange={(v) => update('rvCaReleaseScale', v)} unit="x" />
                      <Slider label={t('workbench.controls.raw.rvGeometryScale')} value={rawView.rvGeomScale} min={0.5} max={3.0} step={0.1} onChange={(v) => update('rvGeomScale', v)} unit="x" />

                      <Subhead>{t('workbench.controls.raw.pericardiumSeptum')}</Subhead>
                      <div className="col-span-full flex items-center gap-2 rounded border border-slate-800/60 bg-slate-900/35 px-2 py-1.5 text-xs">
                         <input type="checkbox" checked={rawView.pericardiumEnabled} onChange={(e) => update('pericardiumEnabled', e.target.checked)} />
                         <span className="text-slate-300">{t('workbench.controls.raw.pericardialConstraintEnabled')}</span>
                      </div>
                      <Slider label={t('workbench.controls.raw.pericardialConstraint')} value={rawView.pericardialPressureScaleMmHg} min={0} max={12} step={0.25} onChange={(v) => update('pericardialPressureScaleMmHg', v)} unit="mmHg" />
                      <Slider label={t('workbench.controls.raw.pericardialEffusion')} value={rawView.pericardialFluidMl} min={0} max={500} step={10} onChange={(v) => update('pericardialFluidMl', v)} unit="mL" />
                      <Slider label={t('workbench.controls.raw.pericardialSlackVolume')} value={rawView.pericardialSlackVolumeMl} min={220} max={600} step={10} onChange={(v) => update('pericardialSlackVolumeMl', v)} unit="mL" />
                      <div className="col-span-full flex items-center gap-2 rounded border border-slate-800/60 bg-slate-900/35 px-2 py-1.5 text-xs">
                         <input type="checkbox" checked={rawView.septalCouplingEnabled} onChange={(e) => update('septalCouplingEnabled', e.target.checked)} />
                         <span className="text-slate-300">{t('workbench.controls.raw.septalVolumeShiftEnabled')}</span>
                      </div>
                      <Slider label={t('workbench.controls.raw.septalStiffness')} value={rawView.septalStiffnessScale} min={0.25} max={3.0} step={0.05} onChange={(v) => update('septalStiffnessScale', v)} unit="x" />
                      <Slider label={t('workbench.controls.raw.septalMaxShift')} value={rawView.septalMaxShiftMl} min={0} max={50} step={1} onChange={(v) => update('septalMaxShiftMl', v)} unit="mL" />
                      <Slider label={t('workbench.controls.raw.septalLvForceWeight')} value={rawView.septalLvPressureWeight} min={0} max={1} step={0.02} onChange={(v) => update('septalLvPressureWeight', v)} />
                      </ControlGrid>
                  </div>
              )}
            </>
          )}

          {!hasAuthored && isStudioMode && showGroup('atria') && (
            <>
              <GroupHeader title={t('workbench.controls.groups.atria')} isOpen={openGroups.atria} toggle={() => toggleGroup('atria')} changedLabel={t('workbench.controls.changed')} resetLabel={t('workbench.controls.reset')} />
              {openGroups.atria && (
                  <div className={rawBodyClass}>
                    <ControlGrid>
                      <Subhead>{t('workbench.controls.raw.leftAtrium')}</Subhead>
                      <Slider label={t('workbench.controls.raw.laBaselineVolume')} value={nodeNum('LA', 'V0', 5)} min={0} max={50} step={1} onChange={(v) => updateNode('LA', 'V0', v)} unit="mL" />
                      <Slider label={t('workbench.controls.raw.laElastance')} value={nodeNum('LA', 'Ees', 0.25)} min={0.05} max={2.0} step={0.05} onChange={(v) => updateNode('LA', 'Ees', v)} />

                      <Subhead>{t('workbench.controls.raw.rightAtrium')}</Subhead>
                      <Slider label={t('workbench.controls.raw.raBaselineVolume')} value={nodeNum('RA', 'V0', 5)} min={0} max={50} step={1} onChange={(v) => updateNode('RA', 'V0', v)} unit="mL" />
                      <Slider label={t('workbench.controls.raw.raElastance')} value={nodeNum('RA', 'Ees', 0.22)} min={0.05} max={2.0} step={0.05} onChange={(v) => updateNode('RA', 'Ees', v)} />
                    </ControlGrid>
                  </div>
              )}
            </>
          )}

          {!hasAuthored && isStudioMode && showGroup('vascular') && (
            <>
              <GroupHeader title={t('workbench.controls.groups.vascular')} isOpen={openGroups.vascular} toggle={() => toggleGroup('vascular')} changedLabel={t('workbench.controls.changed')} resetLabel={t('workbench.controls.reset')} />
              {openGroups.vascular && (
                  <div className={rawBodyClass}>
                    <ControlGrid>
                      <Subhead>{t('workbench.controls.raw.globalScaleMultipliers')}</Subhead>
                      <Slider label={t('workbench.controls.raw.systemicResistance')} value={rawView.systemicResistance} min={0.2} max={3.5} step={0.05} onChange={(v) => update('systemicResistance', v)} unit="x" />
                      <Slider label={t('workbench.controls.raw.pulmonaryResistance')} value={rawView.pulmonaryResistance} min={0.2} max={4.0} step={0.05} onChange={(v) => update('pulmonaryResistance', v)} unit="x" />
                      <Slider label={t('workbench.controls.raw.globalArterialStiffness')} value={rawView.arterialStiffness} min={0.4} max={3.0} step={0.05} onChange={(v) => update('arterialStiffness', v)} unit="x" />

                      <Subhead>{t('workbench.controls.raw.systemicSegmentResistance')}</Subhead>
                      <Slider label="Ao → SA" value={rawView.edgeOverrides?.Ao_SA?.R ?? 0.05} min={0.01} max={0.5} step={0.01} onChange={(v) => updateEdge('Ao_SA', 'R', v)} />
                      <Slider label="SA → Art" value={rawView.edgeOverrides?.SA_Art?.R ?? 0.08} min={0.01} max={0.5} step={0.01} onChange={(v) => updateEdge('SA_Art', 'R', v)} />
                      <Slider label="Art → Cap" value={rawView.edgeOverrides?.Art_Cap?.R ?? 0.65} min={0.1} max={3.0} step={0.05} onChange={(v) => updateEdge('Art_Cap', 'R', v)} />
                      <Slider label="Cap → SV" value={rawView.edgeOverrides?.Cap_SV?.R ?? 0.15} min={0.01} max={1.0} step={0.01} onChange={(v) => updateEdge('Cap_SV', 'R', v)} />
                      <Slider label="SV → VC" value={rawView.edgeOverrides?.SV_VC?.R ?? 0.05} min={0.01} max={0.5} step={0.01} onChange={(v) => updateEdge('SV_VC', 'R', v)} />
                      <Slider label="VC → RA" value={rawView.edgeOverrides?.VC_RA?.R ?? 0.04} min={0.01} max={0.3} step={0.01} onChange={(v) => updateEdge('VC_RA', 'R', v)} />

                      <Subhead>{t('workbench.controls.raw.pulmonarySegmentResistance')}</Subhead>
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

          {!hasAuthored && isStudioMode && showGroup('coronary') && (
            <>
              <GroupHeader title={t('workbench.controls.groups.coronary')} isOpen={openGroups.coronary} toggle={() => toggleGroup('coronary')} changedLabel={t('workbench.controls.changed')} resetLabel={t('workbench.controls.reset')} />
              {openGroups.coronary && (
                  <div className="mt-2 pl-3 border-l-2 border-slate-700/30 ml-2 mb-4">
                      <div className="flex items-center gap-2 mt-2 mb-2 text-xs">
                         <input type="checkbox" checked={rawView.coronaryEnabled} onChange={(e) => update('coronaryEnabled', e.target.checked)} />
                         <span className="text-slate-300">{t('workbench.controls.raw.coronaryBedEnabled')}</span>
                      </div>
                      <Slider label={t('workbench.controls.raw.coronaryResistance')} value={rawView.coronaryResistanceScale} min={0.2} max={5.0} step={0.05} onChange={(v) => update('coronaryResistanceScale', v)} unit="x" />
                      <Slider label={t('workbench.controls.raw.myocardialCompression')} value={rawView.coronaryCompressionScale} min={0} max={2.0} step={0.05} onChange={(v) => update('coronaryCompressionScale', v)} unit="x" />
                      <Slider label={t('workbench.controls.raw.hyperemiaVasodilator')} value={rawView.coronaryVasodilator} min={0} max={1} step={0.05} onChange={(v) => update('coronaryVasodilator', v)} />
                      <Slider label={t('workbench.controls.raw.reserveMax')} value={rawView.coronaryReserveMax} min={1} max={5} step={0.1} onChange={(v) => update('coronaryReserveMax', v)} unit="x" />

                      <span className="text-xs font-bold text-slate-300 block mt-4 mb-1">{t('workbench.controls.raw.epicardialDiameterStenosis')}</span>
                      <Slider label={t('workbench.controls.raw.ladStenosis')} value={rawView.LADStenosis} min={0} max={0.95} step={0.01} onChange={(v) => update('LADStenosis', v)} />
                      <Slider label={t('workbench.controls.raw.lcxStenosis')} value={rawView.LCxStenosis} min={0} max={0.95} step={0.01} onChange={(v) => update('LCxStenosis', v)} />
                      <Slider label={t('workbench.controls.raw.rcaStenosis')} value={rawView.RCAStenosis} min={0} max={0.95} step={0.01} onChange={(v) => update('RCAStenosis', v)} />
                  </div>
              )}
            </>
          )}

          {!hasAuthored && isStudioMode && showGroup('fluids') && (
            <>
              <GroupHeader title={t('workbench.controls.groups.fluids')} isOpen={openGroups.fluids} toggle={() => toggleGroup('fluids')} changedLabel={t('workbench.controls.changed')} resetLabel={t('workbench.controls.reset')} />
              {openGroups.fluids && (
                  <div className={rawBodyClass}>
                    <ControlGrid>
                      <Slider label={t('workbench.controls.raw.hemorrhageRate')} value={rawView.bleedRate} min={0} max={1500} step={25} onChange={(v) => update('bleedRate', v)} unit="mL/min" />
                      <Slider label={t('workbench.controls.raw.fluidTransfusionRate')} value={rawView.fluidRate} min={0} max={1500} step={25} onChange={(v) => update('fluidRate', v)} unit="mL/min" />
                      <span className="col-span-full block text-[10px] text-slate-500">{t('workbench.controls.raw.netVolumeNote')}</span>
                    </ControlGrid>
                  </div>
              )}
            </>
          )}

          {!hasAuthored && isStudioMode && showGroup('valves') && (
            <>
              <GroupHeader title={t('workbench.controls.groups.valves')} isOpen={openGroups.valves} toggle={() => toggleGroup('valves')} changedLabel={t('workbench.controls.changed')} resetLabel={t('workbench.controls.reset')} />
              {openGroups.valves && (
                  <div className={`${rawBodyClass} flex flex-col gap-0`}>
                     {['MV', 'AoV', 'TV', 'PV'].map(vName => (
                         <div key={vName} className="mb-1.5 rounded border border-slate-800/70 bg-slate-900/35 p-1.5">
                             <span className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">{t('workbench.controls.raw.valveParameters', { valve: vName })}</span>
                             <ControlGrid>
                             <Slider label={t('workbench.controls.raw.arefHealthyArea')} value={(params as any)[`${vName}_Aref`]} min={0.1} max={10.0} step={0.1} onChange={(v) => update(`${vName}_Aref` as any, v)} unit="cm²" />
                             <Slider label={t('workbench.controls.raw.amaxMaxArea')} value={(params as any)[`${vName}_Amax`]} min={0.1} max={10.0} step={0.1} onChange={(v) => update(`${vName}_Amax` as any, v)} unit="cm²" />
                             <Slider label={t('workbench.controls.raw.aleakLeakArea')} value={(params as any)[`${vName}_Aleak`]} min={0.00000} max={1.0} step={0.001} onChange={(v) => update(`${vName}_Aleak` as any, v)} unit="cm²" />
                             <Slider label={t('workbench.controls.raw.resistance')} value={(params as any)[`${vName}_R`]} min={0.0005} max={0.05} step={0.0005} onChange={(v) => update(`${vName}_R` as any, v)} />
                             <Slider label={t('workbench.controls.raw.inertance')} value={(params as any)[`${vName}_L`]} min={0.0001} max={0.01} step={0.0001} onChange={(v) => update(`${vName}_L` as any, v)} />
                             <Slider label={t('workbench.controls.raw.quadraticLoss')} value={(params as any)[`${vName}_B`]} min={0} max={0.001} step={0.000001} onChange={(v) => update(`${vName}_B` as any, v)} />
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

          {!hasAuthored && isStudioMode && showGroup('resp') && (
            <>
              <GroupHeader title={t('workbench.controls.groups.resp')} isOpen={openGroups.resp} toggle={() => toggleGroup('resp')} changedLabel={t('workbench.controls.changed')} resetLabel={t('workbench.controls.reset')} />
              {openGroups.resp && (
                  <div className={rawBodyClass}>
                    <ControlGrid>
                      <Slider label="PEEP" value={rawView.PEEP} min={0} max={25} step={1} onChange={(v) => update('PEEP', v)} unit="cmH2O" />
                      <Slider label={t('workbench.controls.raw.basePleuralP')} value={rawView.Pth0} min={-20} max={30} step={1} onChange={(v) => update('Pth0', v)} unit="cmH2O" />
                      <Slider label={t('workbench.controls.raw.respAmpPleural')} value={rawView.respAmpTh} min={-20} max={20} step={1} onChange={(v) => update('respAmpTh', v)} unit="cmH2O" />
                      <Slider label={t('workbench.controls.raw.respAmpAlveolar')} value={rawView.respAmpAlv} min={-20} max={20} step={1} onChange={(v) => update('respAmpAlv', v)} unit="cmH2O" />
                      <Slider label={t('workbench.controls.raw.respiratoryRate')} value={rawView.respRate} min={0} max={1.0} step={0.05} onChange={(v) => update('respRate', v)} unit="Hz" />
                    </ControlGrid>
                  </div>
              )}
            </>
          )}

          {!hasAuthored && isStudioMode && showGroup('advanced') && (
            <>
              <GroupHeader title={t('workbench.controls.groups.advanced')} isOpen={openGroups.advanced} toggle={() => toggleGroup('advanced')} changedLabel={t('workbench.controls.changed')} resetLabel={t('workbench.controls.reset')} />
              {openGroups.advanced && (
                  <div className={rawBodyClass}>
                      <div className="flex items-center gap-2 rounded border border-slate-800/60 bg-slate-900/35 px-2 py-1.5 text-xs">
                         <input type="checkbox" checked={params.useChiResistance} onChange={(e) => update('useChiResistance', e.target.checked)} />
                         <span className="text-slate-300">{t('workbench.controls.raw.useDynamicStarling')}</span>
                      </div>
                  </div>
              )}
            </>
          )}

      </div>
    </div>
  );
};
