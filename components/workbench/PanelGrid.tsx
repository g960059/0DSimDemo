import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LessonAuthoring } from '../LessonAuthoring';
import WorkbenchDockview from './WorkbenchDockview';
import WorkbenchMobile from './WorkbenchMobile';
import { renderPaneBody } from './renderPaneBody';
import { ControllerItemsBuilder } from './ControllerItemsBuilder';
import { type ClinicalKnobs } from '../../engine/knobs';
import { SimulationHealth } from '../../engine/protocol';
import type { SteadyUpdateStatusMap } from '../../engine/previewController';
import {
  ChamberId,
  ControllerItem,
  type DockviewViewState,
  MetricType,
  PanelDef,
  PanelInstanceConfig,
  PanelType,
  PhysicsRefState,
  type LegendPosition,
  SignalType,
  SimInstance,
  SimulationParams,
  WorkbenchZoneId,
} from '../../types';
import type { LessonStep } from '../../lessonDoc';
import type { NoteContent } from '../../noteTypes';
import { flowPack } from '../../layoutPresets';
import { zoneOf } from '../../paneZone';
import { Activity, ArrowLeft, Brush, Eye, EyeOff, Layers, Search, Settings, SlidersHorizontal, Tags, Type as TypeIcon, X } from 'lucide-react';

export type PanelGridMode = 'learner' | 'author' | 'sandbox';
export type WorkbenchControlsSide = 'left' | 'right';

export interface WorkbenchLayoutState {
  controlsSide: WorkbenchControlsSide;
  controlsWidth: number;
  caseRailWidth: number;
  outputHeight: number;
}

interface PanelGridProps {
  authoringMode: boolean;
  publishedLesson: { id: string; title: string; url: string } | null;
  copyShareUrl: () => void;
  instances: SimInstance[];
  stepsDraft: LessonStep[];
  setStepsDraft: React.Dispatch<React.SetStateAction<LessonStep[]>>;
  panels: PanelDef[];
  layoutState: WorkbenchLayoutState;
  onLayoutStateChange: React.Dispatch<React.SetStateAction<WorkbenchLayoutState>>;
  dockviewLayoutKey?: string;
  dockviewViewStates?: Partial<Record<WorkbenchZoneId, DockviewViewState>>;
  onDockviewViewStateChange?: (zone: WorkbenchZoneId, viewState: DockviewViewState) => void;
  mode: PanelGridMode;
  isMobile: boolean;
  noteModes: Record<string, 'read' | 'edit'>;
  setNoteModes: React.Dispatch<React.SetStateAction<Record<string, 'read' | 'edit'>>>;
  physicsRefs: React.MutableRefObject<Map<string, PhysicsRefState>>;
  instanceHealth: Record<string, SimulationHealth>;
  steadyUpdateStatuses?: SteadyUpdateStatusMap;
  activeInstanceId: string;
  setActiveInstanceId: (id: string) => void;
  updateInstanceParams: (id: string, params: Partial<SimulationParams>) => void;
  updateInstanceKnobs: (id: string, knobs: ClinicalKnobs) => void;
  updateInstanceVolume: (id: string, vol: number) => void;
  updateInstanceColor: (id: string, color: string) => void;
  updateInstanceName: (id: string, name: string) => void;
  addInstance: (sourceId?: string, presetId?: string) => void;
  removeInstance: (id: string) => void;
  timeScale: number;
  setTimeScale: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  togglePlay: () => void;
  addPanel: (type: PanelType, zone?: WorkbenchZoneId) => void;
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
  updatePanelControllerItems: (panelId: string, items: ControllerItem[]) => void;
  updatePanelLegendPosition: (panelId: string, pos?: LegendPosition) => void;
  noteCaseKey: string;
  notes: Record<string, NoteContent>;
  onNoteChange: (panelId: string, blocks: NoteContent) => void;
  chambers: ChamberId[];
  signals: SignalType[];
  metrics: MetricType[];
  controlGroups: string[];
}

type PanelChromeMode = 'desktop' | 'mobile' | 'dockview';

export function getDockviewPaneTitle(panel: PanelDef): string {
  return panel.title;
}

export function openPanelSettingsIfClosed(
  panel: Pick<PanelDef, 'id' | 'isSettingsOpen'>,
  panelId: string,
  toggleSettings: (panelId: string) => void,
): void {
  if (panel.id !== panelId || panel.isSettingsOpen) return;
  toggleSettings(panelId);
}

interface PanelSettingsButtonProps {
  panel: PanelDef;
  instances: SimInstance[];
  activeInstanceId: string;
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
  updatePanelControllerItems: (panelId: string, items: ControllerItem[]) => void;
  chambers: ChamberId[];
  signals: SignalType[];
  metrics: MetricType[];
  controlGroups: string[];
}

type PanelSettingsControlsProps = Omit<PanelSettingsButtonProps, 'toggleSettings'>;

type SignalCategory = 'All' | 'Pressure' | 'Flow' | 'Volume' | 'Valve' | 'Coupling' | 'Derived';
type GraphSettingsSectionId = 'signals' | 'instances' | 'display' | 'style';
type ControlSettingsSectionId = 'targets' | 'items' | 'display' | 'custom';
type SettingsSectionBounds = { top: number; bottom: number };

const GRAPH_SETTINGS_PANEL_TYPES = new Set<PanelType>(['WAVEFORM', 'PVLOOP', 'METRICS', 'GUYTON_LEFT', 'GUYTON_RIGHT', 'GUYTON_3D']);
const SIGNAL_CATEGORY_ORDER: SignalCategory[] = ['All', 'Pressure', 'Flow', 'Volume', 'Valve', 'Coupling', 'Derived'];
const GRAPH_SETTINGS_SECTIONS: Array<{
  id: GraphSettingsSectionId;
  label: string;
  compactLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'signals', label: 'Signals', compactLabel: 'Signals', description: 'Choose plotted sources for one instance.', icon: Activity },
  { id: 'instances', label: 'Instances', compactLabel: 'Instances', description: 'Visibility, base color, and display name.', icon: Layers },
  { id: 'display', label: 'Display', compactLabel: 'Display', description: 'Pane-level graph controls.', icon: SlidersHorizontal },
  { id: 'style', label: 'Style/Labels', compactLabel: 'Style', description: 'Focused color and label overrides.', icon: Brush },
];
const CONTROL_SETTINGS_SECTIONS: Array<{
  id: ControlSettingsSectionId;
  label: string;
  compactLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'targets', label: 'Targets', compactLabel: 'Targets', description: 'Instances this controller pane can edit.', icon: Layers },
  { id: 'items', label: 'Sections', compactLabel: 'Sections', description: 'Controller sections shown in the pane.', icon: SlidersHorizontal },
  { id: 'display', label: 'Display', compactLabel: 'Display', description: 'Pane label and target shortcut behavior.', icon: TypeIcon },
  { id: 'custom', label: 'Custom controls', compactLabel: 'Custom', description: 'Author custom clinical controls for this pane.', icon: SlidersHorizontal },
];
const GRAPH_SETTINGS_SECTION_IDS = GRAPH_SETTINGS_SECTIONS.map((section) => section.id);
const CONTROL_SETTINGS_SECTION_IDS = CONTROL_SETTINGS_SECTIONS.map((section) => section.id);
const DEFAULT_CHAMBER_OPTIONS: ChamberId[] = ['LV', 'LA', 'RV', 'RA'];
const DEFAULT_WAVEFORM_OPTIONS: SignalType[] = [
  'LVP', 'AoP', 'LAP', 'RVP', 'PAP', 'RAP',
  'QAo', 'QMV', 'QPA', 'QPV', 'QTV', 'PVF', 'SVF',
  'VRA', 'aRA', 'cRA', 'xiMV', 'xiAoV', 'xiTV', 'xiPV',
  'dP_MV', 'dP_AoV', 'dP_TV', 'dP_PV',
  'AoV_areaRatio', 'AoV_loss_R', 'AoV_loss_B', 'AoV_loss_residual',
  'LVPressureFloorHit01', 'RVPressureFloorHit01',
  'ELV_active', 'ERV_active', 'ELV_timeVarying', 'ERV_timeVarying',
  'Pperi', 'Ppc', 'VHeart', 'septumShiftMl', 'VLVeff', 'VRVeff',
  'PLVfw', 'PRVfw', 'PVI_LV', 'PVI_RV', 'septalForceMmHg',
];
const DEFAULT_METRIC_OPTIONS: MetricType[] = ['ABP', 'CVP', 'PAP', 'PCWP', 'SV', 'CO', 'LVEF', 'RVEF'];
const DEFAULT_CONTROL_GROUP_OPTIONS = ['clinical', 'Global', 'ventricles', 'atria', 'vascular', 'fluids', 'valves', 'resp'];
const CONTROL_GROUP_METADATA: Record<string, { label: string; description: string }> = {
  clinical: { label: 'Clinical knobs', description: 'Beginner-facing contractility, loading, rate, and valve-lesion controls.' },
  global: { label: 'Global physiology', description: 'Raw heart rate, blood volume, venous tone, and global multipliers.' },
  ventricles: { label: 'Ventricular mechanics', description: 'LV/RV mechanics, pericardium, and septal coupling parameters.' },
  atria: { label: 'Atrial mechanics', description: 'LA/RA baseline volume and elastance controls.' },
  vascular: { label: 'Vascular resistance', description: 'Systemic and pulmonary resistance/compliance controls.' },
  fluids: { label: 'Fluids & hemorrhage', description: 'Bleeding, infusion, and net volume-change controls.' },
  valves: { label: 'Valvular mechanics', description: 'Raw valve area, leak, resistance, inertance, and timing controls.' },
  resp: { label: 'Respiratory environment', description: 'PEEP, pleural pressure, and respiratory waveform controls.' },
};
const SIGNAL_METADATA: Record<string, { label: string; category: Exclude<SignalCategory, 'All'>; unit?: string }> = {
  LV: { label: 'Left ventricle', category: 'Volume' },
  LA: { label: 'Left atrium', category: 'Volume' },
  RV: { label: 'Right ventricle', category: 'Volume' },
  RA: { label: 'Right atrium', category: 'Volume' },
  LVP: { label: 'LV pressure', category: 'Pressure', unit: 'mmHg' },
  AoP: { label: 'Aortic pressure', category: 'Pressure', unit: 'mmHg' },
  LAP: { label: 'LA pressure', category: 'Pressure', unit: 'mmHg' },
  RVP: { label: 'RV pressure', category: 'Pressure', unit: 'mmHg' },
  PAP: { label: 'Pulmonary artery pressure', category: 'Pressure', unit: 'mmHg' },
  RAP: { label: 'RA pressure', category: 'Pressure', unit: 'mmHg' },
  QAo: { label: 'Aortic flow', category: 'Flow' },
  QMV: { label: 'Mitral flow', category: 'Flow' },
  QPA: { label: 'Pulmonary artery flow', category: 'Flow' },
  QPV: { label: 'Pulmonic valve flow', category: 'Flow' },
  QTV: { label: 'Tricuspid flow', category: 'Flow' },
  PVF: { label: 'Pulmonary venous flow (S/D/Ar)', category: 'Flow' },
  SVF: { label: 'Systemic venous flow', category: 'Flow' },
  VRA: { label: 'RA volume', category: 'Volume', unit: 'mL' },
  VHeart: { label: 'Heart volume', category: 'Volume', unit: 'mL' },
  VLVeff: { label: 'Effective LV volume', category: 'Volume', unit: 'mL' },
  VRVeff: { label: 'Effective RV volume', category: 'Volume', unit: 'mL' },
  xiMV: { label: 'Mitral valve state', category: 'Valve' },
  xiAoV: { label: 'Aortic valve state', category: 'Valve' },
  xiTV: { label: 'Tricuspid valve state', category: 'Valve' },
  xiPV: { label: 'Pulmonary valve state', category: 'Valve' },
  dP_MV: { label: 'Mitral valve gradient', category: 'Valve', unit: 'mmHg' },
  dP_AoV: { label: 'Aortic valve gradient', category: 'Valve', unit: 'mmHg' },
  dP_TV: { label: 'Tricuspid valve gradient', category: 'Valve', unit: 'mmHg' },
  dP_PV: { label: 'Pulmonary valve gradient', category: 'Valve', unit: 'mmHg' },
  AoV_areaRatio: { label: 'Aortic valve area ratio', category: 'Valve' },
  AoV_loss_R: { label: 'Aortic valve R drop', category: 'Valve', unit: 'mmHg' },
  AoV_loss_B: { label: 'Aortic valve B drop', category: 'Valve', unit: 'mmHg' },
  AoV_loss_residual: { label: 'Aortic valve residual drop', category: 'Valve', unit: 'mmHg' },
  LVPressureFloorHit01: { label: 'LV floor hit', category: 'Valve' },
  RVPressureFloorHit01: { label: 'RV floor hit', category: 'Valve' },
  ELV_active: { label: 'LV apparent elastance (active)', category: 'Derived', unit: 'mmHg/mL' },
  ERV_active: { label: 'RV apparent elastance (active)', category: 'Derived', unit: 'mmHg/mL' },
  ELV_timeVarying: { label: 'LV TVE reference elastance', category: 'Derived', unit: 'mmHg/mL' },
  ERV_timeVarying: { label: 'RV TVE reference elastance', category: 'Derived', unit: 'mmHg/mL' },
  Pperi: { label: 'Pericardial pressure', category: 'Coupling', unit: 'mmHg' },
  Ppc: { label: 'Pleural pressure', category: 'Coupling', unit: 'mmHg' },
  septumShiftMl: { label: 'Septal shift', category: 'Coupling', unit: 'mL' },
  PLVfw: { label: 'LV free-wall pressure', category: 'Coupling', unit: 'mmHg' },
  PRVfw: { label: 'RV free-wall pressure', category: 'Coupling', unit: 'mmHg' },
  PVI_LV: { label: 'LV interaction pressure', category: 'Coupling', unit: 'mmHg' },
  PVI_RV: { label: 'RV interaction pressure', category: 'Coupling', unit: 'mmHg' },
  septalForceMmHg: { label: 'Septal force', category: 'Coupling', unit: 'mmHg' },
  aRA: { label: 'RA a-wave', category: 'Derived' },
  cRA: { label: 'RA c-wave', category: 'Derived' },
  ABP: { label: 'Arterial BP', category: 'Pressure', unit: 'mmHg' },
  CVP: { label: 'Central venous pressure', category: 'Pressure', unit: 'mmHg' },
  PCWP: { label: 'Wedge pressure', category: 'Pressure', unit: 'mmHg' },
  SV: { label: 'Stroke volume', category: 'Volume', unit: 'mL' },
  CO: { label: 'Cardiac output', category: 'Flow', unit: 'L/min' },
  LVEF: { label: 'LV ejection fraction', category: 'Derived', unit: '%' },
  RVEF: { label: 'RV ejection fraction', category: 'Derived', unit: '%' },
  Default: { label: 'Guyton curve', category: 'Derived' },
};

function isGraphSettingsPanel(type: PanelType): boolean {
  return GRAPH_SETTINGS_PANEL_TYPES.has(type);
}

function isBoardSettingsPanel(type: PanelType): boolean {
  return isGraphSettingsPanel(type) || type === 'CONTROLS';
}

function getPanelItemOptions(
  panel: PanelDef,
  chambers: ChamberId[],
  signals: SignalType[],
  metrics: MetricType[],
  controlGroups: string[],
): string[] {
  const selected = Object.values(panel.config).flatMap((cfg) => cfg.selectedSignals);
  let base: string[];
  if (panel.type === 'PVLOOP') base = chambers.length > 0 ? chambers : DEFAULT_CHAMBER_OPTIONS;
  else if (panel.type === 'WAVEFORM') base = signals.length > 0 ? signals : DEFAULT_WAVEFORM_OPTIONS;
  else if (panel.type === 'METRICS') base = metrics.length > 0 ? metrics : DEFAULT_METRIC_OPTIONS;
  else if (panel.type === 'GUYTON_RIGHT' || panel.type === 'GUYTON_LEFT' || panel.type === 'GUYTON_3D') base = ['Default'];
  else base = controlGroups;
  return Array.from(new Set([...base, ...selected]));
}

function signalMetadata(signal: string) {
  return SIGNAL_METADATA[signal] ?? { label: signal, category: 'Derived' as const };
}

function normalizeControlGroupId(group: string) {
  return group.trim().toLowerCase();
}

function controlGroupMetadata(group: string) {
  return CONTROL_GROUP_METADATA[normalizeControlGroupId(group)] ?? {
    label: group,
    description: 'Custom controller section.',
  };
}

function getControlGroupOptions(panel: PanelDef, controlGroups: string[]): string[] {
  const selected = Object.values(panel.config).flatMap((cfg) => cfg.selectedSignals);
  const base = controlGroups.length > 0 ? controlGroups : DEFAULT_CONTROL_GROUP_OPTIONS;
  const seen = new Set<string>();
  const options: string[] = [];
  for (const group of [...base, ...selected]) {
    const key = normalizeControlGroupId(group);
    if (key === 'advanced') continue;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    options.push(group);
  }
  return options;
}

function configHasControlGroup(config: PanelInstanceConfig | undefined, group: string): boolean {
  if (!config) return false;
  const normalized = normalizeControlGroupId(group);
  return config.selectedSignals.some((signal) => normalizeControlGroupId(signal) === normalized);
}

export function getActiveSettingsSectionId<T extends string>(
  sectionIds: readonly T[],
  sectionBounds: Partial<Record<T, SettingsSectionBounds>>,
  markerY: number,
): T {
  const firstSection = sectionIds[0];
  if (!firstSection) {
    throw new Error('At least one settings section is required.');
  }

  let nextSection = firstSection;
  for (const sectionId of sectionIds) {
    const bounds = sectionBounds[sectionId];
    if (!bounds) continue;
    if (bounds.top <= markerY) nextSection = sectionId;
    if (bounds.top <= markerY && bounds.bottom > markerY) break;
  }
  return nextSection;
}

function getActiveSettingsSectionFromScroll<T extends string>(
  sectionIds: readonly T[],
  sectionRefs: Partial<Record<T, HTMLElement | null>>,
  scrollEl: HTMLElement,
): T {
  const markerY = scrollEl.getBoundingClientRect().top + 48;
  const sectionBounds: Partial<Record<T, SettingsSectionBounds>> = {};
  sectionIds.forEach((sectionId) => {
    const node = sectionRefs[sectionId];
    if (!node) return;
    const rect = node.getBoundingClientRect();
    sectionBounds[sectionId] = { top: rect.top, bottom: rect.bottom };
  });
  return getActiveSettingsSectionId(sectionIds, sectionBounds, markerY);
}

function PanelSettingsControls(props: PanelSettingsControlsProps) {
  if (isGraphSettingsPanel(props.panel.type)) {
    return <GraphPanelSettingsBoard {...props} />;
  }
  if (props.panel.type === 'CONTROLS') {
    return <ControlPanelSettingsBoard {...props} />;
  }
  return <LegacyPanelSettingsControls {...props} />;
}

function LegacyPanelSettingsControls({
  panel,
  instances,
  updatePanelTitle,
  toggleShowLegend,
  updatePanelInstanceColor,
  updatePanelInstanceName,
  updatePanelSignalColor,
  updatePanelSignalName,
  toggleInstanceVisibility,
  updateInstanceSignals,
  toggleGuides,
  updateTimeWindow,
  chambers,
  signals,
  metrics,
  controlGroups,
}: PanelSettingsControlsProps) {
  const itemOptions = getPanelItemOptions(panel, chambers, signals, metrics, controlGroups);

  return (
    <>
      <div className="mb-2 flex items-center gap-2 border-b border-slate-700 pb-2">
        <span className="text-xs font-medium text-slate-400">Title:</span>
        <input
          type="text"
          value={panel.title}
          onChange={(e) => updatePanelTitle(panel.id, e.target.value)}
          className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-xs font-medium text-slate-200 outline-none focus:border-slate-500"
          placeholder="Panel Title"
        />
      </div>
      {['PVLOOP', 'WAVEFORM'].includes(panel.type) && (
        <div className="mb-2 flex items-center gap-2 border-b border-slate-700 pb-2">
          <input type="checkbox" className="cursor-pointer accent-blue-500" checked={panel.showLegend !== false} onChange={() => toggleShowLegend(panel.id)} />
          <span className="text-xs font-medium text-slate-200">Show Legend</span>
        </div>
      )}
      {panel.type === 'PVLOOP' && (
        <div className="mb-2 flex items-center gap-2 border-b border-slate-700 pb-2">
          <input type="checkbox" className="cursor-pointer accent-blue-500" checked={panel.showGuides} onChange={() => toggleGuides(panel.id)} />
          <span className="text-xs font-medium text-slate-200">Show Guides</span>
        </div>
      )}
      {panel.type === 'WAVEFORM' && (
        <div className="mb-3 border-b border-slate-700 pb-3">
          <div className="mb-2 flex justify-between text-[10px] font-medium text-slate-400">
            <span>Window Size</span>
            <span className="text-blue-400">{(panel.timeWindow || 10000) / 1000}s</span>
          </div>
          <input type="range" min={2000} max={20000} step={1000} value={panel.timeWindow || 10000} onChange={(e) => updateTimeWindow(panel.id, parseFloat(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-900 accent-blue-500" />
        </div>
      )}
      <div className="space-y-3">
        {instances.map(inst => {
          const cfg = panel.config[inst.id];
          return (
            <div key={inst.id}>
              <div className="mb-1 flex items-center gap-2">
                <input type="checkbox" className="flex-none cursor-pointer accent-blue-500" checked={cfg?.visible || false} onChange={() => toggleInstanceVisibility(panel.id, inst.id)} />
                <input type="color" className="block h-[14px] w-[14px] flex-none cursor-pointer appearance-none rounded border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-none" value={cfg?.customBaseColor ?? inst.color} onChange={(e) => updatePanelInstanceColor(panel.id, inst.id, e.target.value)} />
                <input type="text" className="w-full min-w-0 border-b border-transparent bg-transparent text-xs font-bold text-slate-300 outline-none focus:border-slate-500" value={cfg?.customName ?? inst.name} onChange={(e) => updatePanelInstanceName(panel.id, inst.id, e.target.value)} placeholder={inst.name} />
              </div>
              {cfg?.visible && (panel.type !== 'GUYTON_RIGHT' && panel.type !== 'GUYTON_LEFT') && (
                <div className="grid grid-cols-1 gap-1 pl-5">
                  {itemOptions.map(sig => {
                    const isSelected = cfg.selectedSignals.includes(sig);
                    return (
                      <div key={sig} className="flex items-center gap-1 rounded bg-slate-950/50 px-1 py-0.5 text-[10px]">
                        <input type="checkbox" className="m-0 h-3 w-3 flex-none cursor-pointer accent-blue-500" checked={isSelected} onChange={() => updateInstanceSignals(panel.id, inst.id, sig)} />
                        {isSelected && (
                          <input type="color" className="block h-3 w-3 flex-none cursor-pointer appearance-none rounded border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-none" value={cfg.customSignalColors?.[sig] || cfg.customBaseColor || inst.color} onChange={(e) => updatePanelSignalColor(panel.id, inst.id, sig, e.target.value)} />
                        )}
                        {isSelected ? (
                          <input type="text" className="w-full min-w-0 border-b border-transparent bg-transparent text-[10px] font-medium text-slate-300 outline-none focus:border-slate-500" value={cfg.customSignalNames?.[sig] || sig} onChange={(e) => updatePanelSignalName(panel.id, inst.id, sig, e.target.value)} placeholder={sig} />
                        ) : (
                          <span className="flex-1 select-none truncate text-slate-600">{sig}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function GraphPanelSettingsBoard({
  panel,
  instances,
  updatePanelTitle,
  toggleShowLegend,
  updatePanelInstanceColor,
  updatePanelInstanceName,
  updatePanelSignalColor,
  updatePanelSignalName,
  toggleInstanceVisibility,
  updateInstanceSignals,
  toggleGuides,
  updateTimeWindow,
  chambers,
  signals,
  metrics,
  controlGroups,
}: PanelSettingsControlsProps) {
  const [activeInstanceId, setActiveInstanceId] = useState(() => instances.find((inst) => panel.config[inst.id])?.id ?? instances[0]?.id ?? '');
  const [activeSection, setActiveSection] = useState<GraphSettingsSectionId>('signals');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SignalCategory>('All');
  const [focusedItemId, setFocusedItemId] = useState('');
  const sectionRefs = useRef<Partial<Record<GraphSettingsSectionId, HTMLElement | null>>>({});
  const settingsScrollRef = useRef<HTMLDivElement | null>(null);
  const itemOptions = getPanelItemOptions(panel, chambers, signals, metrics, controlGroups);
  const activeInstance = instances.find((inst) => inst.id === activeInstanceId) ?? instances.find((inst) => panel.config[inst.id]) ?? instances[0];
  const activeCfg = activeInstance ? panel.config[activeInstance.id] : undefined;
  const activeSelected = new Set(activeCfg?.selectedSignals ?? []);
  const selectedItems = itemOptions.filter((sig) => activeSelected.has(sig));
  const focusedItem = selectedItems.includes(focusedItemId) ? focusedItemId : selectedItems[0] ?? '';
  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<SignalCategory, number>> = { All: itemOptions.length };
    itemOptions.forEach((sig) => {
      const signalCategory = signalMetadata(sig).category;
      counts[signalCategory] = (counts[signalCategory] ?? 0) + 1;
    });
    return counts;
  }, [itemOptions]);
  const visibleCategories = SIGNAL_CATEGORY_ORDER.filter((chip) => (categoryCounts[chip] ?? 0) > 0);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = itemOptions.filter((sig) => {
    const meta = signalMetadata(sig);
    const matchesCategory = category === 'All' || meta.category === category;
    const customName = activeCfg?.customSignalNames?.[sig] ?? '';
    const matchesQuery = normalizedQuery.length === 0
      || sig.toLowerCase().includes(normalizedQuery)
      || meta.label.toLowerCase().includes(normalizedQuery)
      || customName.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });
  const sourceLabel = panel.type === 'PVLOOP'
    ? 'Chambers'
    : panel.type === 'METRICS'
      ? 'Metrics'
      : panel.type === 'WAVEFORM'
        ? 'Signals'
        : 'Curve';
  const sourceLabelLower = sourceLabel.toLowerCase();
  const visibleInstanceCount = instances.filter((inst) => panel.config[inst.id]?.visible).length;
  const selectedItemCount = Object.values(panel.config).reduce((sum, cfg) => sum + cfg.selectedSignals.length, 0);
  const updateActiveSectionFromScroll = useCallback(() => {
    const scrollEl = settingsScrollRef.current;
    if (!scrollEl) return;
    const nextSection = getActiveSettingsSectionFromScroll(GRAPH_SETTINGS_SECTION_IDS, sectionRefs.current, scrollEl);
    setActiveSection((prev) => (prev === nextSection ? prev : nextSection));
  }, []);
  useEffect(() => {
    const scrollEl = settingsScrollRef.current;
    if (!scrollEl) return undefined;
    let previousScrollTop = scrollEl.scrollTop;
    const syncFromCurrentScroll = () => {
      if (scrollEl.scrollTop !== previousScrollTop) {
        previousScrollTop = scrollEl.scrollTop;
        updateActiveSectionFromScroll();
      }
    };
    updateActiveSectionFromScroll();
    scrollEl.addEventListener('scroll', updateActiveSectionFromScroll, { passive: true });
    const interval = window.setInterval(syncFromCurrentScroll, 120);
    return () => {
      scrollEl.removeEventListener('scroll', updateActiveSectionFromScroll);
      window.clearInterval(interval);
    };
  }, [updateActiveSectionFromScroll]);
  const jumpToSection = (sectionId: GraphSettingsSectionId) => {
    setActiveSection(sectionId);
    sectionRefs.current[sectionId]?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const renderInstancePicker = () => (
    <div className="flex flex-none gap-1 overflow-x-auto pb-1 custom-scrollbar" aria-label="Choose instance to edit">
      {instances.map((inst) => {
        const cfg = panel.config[inst.id];
        const isActive = activeInstance?.id === inst.id;
        return (
          <button
            key={inst.id}
            type="button"
            onClick={() => setActiveInstanceId(inst.id)}
            className={`inline-flex h-8 max-w-[12rem] flex-none items-center gap-2 rounded border px-2 text-xs font-bold transition-colors ${isActive ? 'border-sky-500/50 bg-sky-500/15 text-sky-100' : 'border-slate-700 bg-slate-950/65 text-slate-400 hover:text-slate-200'}`}
          >
            <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ backgroundColor: cfg?.customBaseColor ?? inst.color }} />
            <span className="truncate">{cfg?.customName ?? inst.name}</span>
            <span className={`rounded px-1 py-0.5 text-[9px] uppercase ${cfg?.visible ? 'bg-emerald-500/15 text-emerald-200' : 'bg-slate-800 text-slate-500'}`}>
              {cfg?.visible ? 'On' : 'Off'}
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderSignalBoard = (layout: 'wide' | 'document' = 'wide') => {
    if (panel.type === 'GUYTON_LEFT' || panel.type === 'GUYTON_RIGHT' || panel.type === 'GUYTON_3D') {
      return (
        <div className="flex min-h-[5rem] items-center justify-center rounded bg-slate-950/25 p-4 text-center">
          <div>
            <div className="text-sm font-bold text-slate-200">Standard Guyton curve</div>
            <div className="mt-1 max-w-md text-xs font-medium leading-5 text-slate-500">
              Guyton panes render the built-in curve for visible instances. Use Instances for visibility and Style/Labels for per-instance presentation.
            </div>
          </div>
        </div>
      );
    }

    if (!activeInstance || !activeCfg) {
      return (
        <div className="flex min-h-[5rem] items-center justify-center rounded bg-slate-950/25 text-xs font-semibold text-slate-500">
          Select an instance to configure {sourceLabelLower}.
        </div>
      );
    }

    return (
      <>
        {renderInstancePicker()}
        {panel.type === 'WAVEFORM' && (
          <div className="flex flex-none flex-wrap items-center gap-2">
            <label className="flex h-9 min-w-[13rem] flex-1 items-center gap-2 rounded border border-slate-700/80 bg-slate-950/70 px-2">
              <Search className="h-3.5 w-3.5 flex-none text-slate-500" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-200 outline-none placeholder:text-slate-600"
                placeholder="Search signals"
              />
            </label>
            {layout === 'wide' ? (
              <div className="flex flex-wrap gap-1">
                {visibleCategories.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setCategory(chip)}
                    className={`h-7 rounded-full border px-2 text-[10px] font-bold transition-colors ${category === chip ? 'border-sky-500/50 bg-sky-500/15 text-sky-100' : 'border-slate-700 bg-slate-950/55 text-slate-400 hover:text-slate-200'}`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            ) : (
              <label className="flex h-9 min-w-[10rem] items-center gap-2 rounded border border-slate-700/80 bg-slate-950/70 px-2">
                <span className="text-[10px] font-bold uppercase text-slate-500">Type</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SignalCategory)}
                  className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-200 outline-none"
                  aria-label="Signal category"
                >
                  {visibleCategories.map((chip) => (
                    <option key={chip} value={chip}>{chip}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}
        <div className="rounded bg-slate-950/20 p-2">
          {filteredItems.length > 0 ? (
            <div className={`grid gap-1.5 ${panel.type === 'PVLOOP' ? 'grid-cols-[repeat(auto-fill,minmax(6.75rem,1fr))]' : 'grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]'}`}>
              {filteredItems.map((sig) => {
                const meta = signalMetadata(sig);
                const isSelected = activeSelected.has(sig);
                const signalColor = activeCfg.customSignalColors?.[sig] || activeCfg.customBaseColor || activeInstance.color;
                return (
                  <button
                    key={sig}
                    type="button"
                    onClick={() => updateInstanceSignals(panel.id, activeInstance.id, sig)}
                    className={`rounded px-2 py-1.5 text-left transition-colors ${isSelected ? 'bg-sky-500/10 text-slate-100 ring-1 ring-sky-500/35' : 'bg-slate-900/35 text-slate-400 hover:bg-slate-900/70 hover:text-slate-200'}`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ backgroundColor: isSelected ? signalColor : 'rgba(100,116,139,0.55)' }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold">{sig}</span>
                        <span className="block truncate text-[10px] font-semibold text-slate-500">{meta.label}</span>
                      </span>
                      {panel.type === 'WAVEFORM' && (
                        <span className="rounded bg-slate-950/70 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500">{meta.category}</span>
                      )}
                    </div>
                    {meta.unit && <div className="mt-0.5 pl-4 text-[10px] font-semibold text-slate-600">{meta.unit}</div>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[5rem] items-center justify-center text-xs font-semibold text-slate-500">
              No matching {sourceLabelLower}.
            </div>
          )}
        </div>
      </>
    );
  };

  const renderInstances = () => (
    <div className="rounded bg-slate-950/20 p-2">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-1.5">
        {instances.map((inst) => {
          const cfg = panel.config[inst.id];
          const selectedCount = cfg?.selectedSignals.length ?? 0;
          return (
            <div key={inst.id} className="rounded bg-slate-900/35 p-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 flex-none cursor-pointer accent-sky-500"
                  checked={cfg?.visible || false}
                  onChange={() => toggleInstanceVisibility(panel.id, inst.id)}
                  aria-label={`${inst.name} visibility`}
                />
                <input
                  type="color"
                  className="block h-6 w-6 flex-none cursor-pointer appearance-none rounded border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-none"
                  value={cfg?.customBaseColor ?? inst.color}
                  onChange={(e) => updatePanelInstanceColor(panel.id, inst.id, e.target.value)}
                  aria-label={`${inst.name} base color`}
                />
                <input
                  type="text"
                  className="min-w-0 flex-1 rounded border border-slate-700/70 bg-slate-950/60 px-2 py-1 text-xs font-bold text-slate-200 outline-none focus:border-slate-500"
                  value={cfg?.customName ?? inst.name}
                  onChange={(e) => updatePanelInstanceName(panel.id, inst.id, e.target.value)}
                  placeholder={inst.name}
                  aria-label={`${inst.name} graph display name`}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                <span>{cfg?.visible ? 'Visible' : 'Hidden'}</span>
                <span>{selectedCount} {sourceLabelLower}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDisplay = () => {
    const hasLegend = panel.type === 'PVLOOP' || panel.type === 'WAVEFORM';
    const hasGuides = panel.type === 'PVLOOP';
    const hasWindow = panel.type === 'WAVEFORM';
    return (
      <div className="space-y-2">
        <label className="grid gap-2 rounded bg-slate-900/25 p-2 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center">
          <span className="text-[10px] font-bold uppercase text-slate-500">Pane title</span>
          <input
            type="text"
            value={panel.title}
            onChange={(e) => updatePanelTitle(panel.id, e.target.value)}
            className="h-9 w-full rounded border border-slate-700/70 bg-slate-950/70 px-2 text-sm font-bold text-slate-100 outline-none focus:border-slate-500"
            placeholder="Graph"
          />
        </label>
        <div className="divide-y divide-slate-800/70 rounded bg-slate-950/20">
          {hasLegend && (
            <button
              type="button"
              onClick={() => toggleShowLegend(panel.id)}
              className={`flex w-full items-center gap-3 px-2 py-2 text-left transition-colors ${panel.showLegend !== false ? 'text-sky-100' : 'text-slate-400 hover:text-slate-200'}`}
              aria-pressed={panel.showLegend !== false}
            >
              {panel.showLegend !== false ? <Eye className="h-4 w-4 flex-none" /> : <EyeOff className="h-4 w-4 flex-none" />}
              <span>
                <span className="block text-sm font-bold">Legend</span>
                <span className="block text-xs font-medium text-slate-500">Show graph labels.</span>
              </span>
            </button>
          )}
          {hasGuides && (
            <button
              type="button"
              onClick={() => toggleGuides(panel.id)}
              className={`flex w-full items-center gap-3 px-2 py-2 text-left transition-colors ${panel.showGuides ? 'text-emerald-100' : 'text-slate-400 hover:text-slate-200'}`}
              aria-pressed={Boolean(panel.showGuides)}
            >
              <Tags className="h-4 w-4 flex-none" />
              <span>
                <span className="block text-sm font-bold">PV loop guides</span>
                <span className="block text-xs font-medium text-slate-500">Reference overlays.</span>
              </span>
            </button>
          )}
          {hasWindow && (
            <label className="block px-2 py-2">
              <span className="flex items-center justify-between gap-3">
                <span className="block text-sm font-bold text-slate-100">Waveform time window</span>
                <span className="text-sm font-bold text-sky-200">{(panel.timeWindow || 10000) / 1000}s</span>
              </span>
              <input
                type="range"
                min={2000}
                max={20000}
                step={1000}
                value={panel.timeWindow || 10000}
                onChange={(e) => updateTimeWindow(panel.id, parseFloat(e.target.value))}
                className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-sky-400"
              />
            </label>
          )}
        </div>
        {!hasLegend && !hasGuides && !hasWindow && (
          <div className="px-1 text-xs font-semibold text-slate-500">
            Instance visibility and labels are still configurable in the adjacent sections.
          </div>
        )}
      </div>
    );
  };

  const renderStyle = () => {
    if (!activeInstance || !activeCfg) {
      return (
        <div className="flex min-h-[5rem] items-center justify-center rounded bg-slate-950/25 text-xs font-semibold text-slate-500">
          Select an instance to edit labels and colors.
        </div>
      );
    }
    if (selectedItems.length === 0 || panel.type === 'GUYTON_LEFT' || panel.type === 'GUYTON_RIGHT' || panel.type === 'GUYTON_3D') {
      return (
        <div className="flex min-h-[5rem] items-center justify-center rounded bg-slate-950/25 p-4 text-center">
          <div>
            <div className="text-sm font-bold text-slate-200">Instance styling only</div>
            <div className="mt-1 max-w-md text-xs font-medium leading-5 text-slate-500">
              Use Instances to rename this pane's visible scenarios and set their base colors. Select {sourceLabelLower} before editing trace-specific labels.
            </div>
          </div>
        </div>
      );
    }
    const meta = signalMetadata(focusedItem);
    const signalColor = activeCfg.customSignalColors?.[focusedItem] || activeCfg.customBaseColor || activeInstance.color;
    const displayName = activeCfg.customSignalNames?.[focusedItem] || focusedItem;
    return (
      <div className="grid gap-2 md:grid-cols-[minmax(10rem,13rem)_minmax(0,1fr)]">
        <div className="rounded bg-slate-950/20 p-2">
          <div className="mb-2 px-1 text-[10px] font-bold uppercase text-slate-500">Selected {sourceLabel}</div>
          <div className="space-y-1">
            {selectedItems.map((sig) => (
              <button
                key={sig}
                type="button"
                onClick={() => setFocusedItemId(sig)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-bold transition-colors ${focusedItem === sig ? 'bg-sky-500/10 text-sky-100 ring-1 ring-sky-500/35' : 'bg-slate-900/35 text-slate-400 hover:text-slate-200'}`}
              >
                <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ backgroundColor: activeCfg.customSignalColors?.[sig] || activeCfg.customBaseColor || activeInstance.color }} />
                <span className="truncate">{activeCfg.customSignalNames?.[sig] || sig}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="rounded bg-slate-900/35 p-3">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-100">{focusedItem}</div>
              <div className="text-xs font-semibold text-slate-500">{meta.label}</div>
            </div>
            <span className="rounded bg-slate-950/70 px-2 py-1 text-[10px] font-bold uppercase text-slate-500">{meta.category}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-[6rem_minmax(0,1fr)]">
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Color</span>
              <input
                type="color"
                className="block h-9 w-full cursor-pointer appearance-none rounded border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-none"
                value={signalColor}
                onChange={(e) => updatePanelSignalColor(panel.id, activeInstance.id, focusedItem, e.target.value)}
                aria-label={`${focusedItem} color`}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Label</span>
              <input
                type="text"
                className="h-9 w-full rounded border border-slate-700/70 bg-slate-950/70 px-2 text-xs font-semibold text-slate-200 outline-none focus:border-slate-500"
                value={displayName}
                onChange={(e) => updatePanelSignalName(panel.id, activeInstance.id, focusedItem, e.target.value)}
                placeholder={focusedItem}
              />
            </label>
          </div>
        </div>
      </div>
    );
  };

  const renderSectionContent = (sectionId: GraphSettingsSectionId, layout: 'wide' | 'document' = 'wide') => {
    if (sectionId === 'instances') return renderInstances();
    if (sectionId === 'display') return renderDisplay();
    if (sectionId === 'style') return renderStyle();
    return renderSignalBoard(layout);
  };

  return (
    <div className="@container h-full min-h-0 w-full text-slate-200">
      <div className="flex h-full min-h-0 w-full flex-col @min-[760px]:grid @min-[760px]:grid-cols-[minmax(10rem,12rem)_minmax(0,1fr)] @min-[760px]:gap-4">
      <div className="hidden min-h-0 @min-[760px]:block">
        <aside className="h-full min-h-0 overflow-y-auto py-1 pr-1 custom-scrollbar" aria-label="Settings categories">
          <div className="space-y-1">
            {GRAPH_SETTINGS_SECTIONS.map((section) => {
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => jumpToSection(section.id)}
                  className={`block w-full border-l-2 px-3 py-1.5 text-left text-xs font-semibold transition-colors ${activeSection === section.id ? 'border-slate-300 text-slate-100' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  <span className="min-w-0 truncate">{section.label}</span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
      <div ref={settingsScrollRef} onScroll={updateActiveSectionFromScroll} className="min-h-0 w-full flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <div className="mb-3 flex flex-none items-center justify-between gap-3 px-1 pb-1">
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-100">
              {panel.type === 'PVLOOP' ? 'PV loop pane' : panel.type === 'WAVEFORM' ? 'Waveform pane' : panel.type === 'METRICS' ? 'Metrics pane' : 'Guyton pane'}
            </div>
          </div>
          <div className="flex flex-none items-center gap-2 text-[10px] font-bold text-slate-500">
            <span>{visibleInstanceCount} visible</span>
            <span>{selectedItemCount} selected</span>
          </div>
        </div>
        {GRAPH_SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <section
              key={section.id}
              ref={(node) => { sectionRefs.current[section.id] = node; }}
              className="relative scroll-mt-2 border-b border-slate-800/70 pb-4 last:border-b-0 last:pb-1"
            >
              <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-800/70 bg-[#0B1120]/95 px-1 py-1 backdrop-blur">
                <Icon className="h-3.5 w-3.5 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-100">{section.label}</h3>
              </div>
              <div className="min-h-0 pt-2">
                {renderSectionContent(section.id, 'wide')}
              </div>
            </section>
          );
        })}
      </div>
      </div>
    </div>
  );
}

function ControlPanelSettingsBoard({
  panel,
  instances,
  activeInstanceId,
  updatePanelTitle,
  updatePanelInstanceColor,
  updatePanelInstanceName,
  toggleInstanceVisibility,
  updateInstanceSignals,
  updatePanelControllerItems,
  controlGroups,
}: PanelSettingsControlsProps) {
  const [activeSection, setActiveSection] = useState<ControlSettingsSectionId>('targets');
  const sectionRefs = useRef<Partial<Record<ControlSettingsSectionId, HTMLElement | null>>>({});
  const settingsScrollRef = useRef<HTMLDivElement | null>(null);
  const groupOptions = getControlGroupOptions(panel, controlGroups);
  const configuredInstances = instances.filter((inst) => panel.config[inst.id]);
  const configuredCount = configuredInstances.length;
  const updateActiveSectionFromScroll = useCallback(() => {
    const scrollEl = settingsScrollRef.current;
    if (!scrollEl) return;
    const nextSection = getActiveSettingsSectionFromScroll(CONTROL_SETTINGS_SECTION_IDS, sectionRefs.current, scrollEl);
    setActiveSection((prev) => (prev === nextSection ? prev : nextSection));
  }, []);
  useEffect(() => {
    const scrollEl = settingsScrollRef.current;
    if (!scrollEl) return undefined;
    let previousScrollTop = scrollEl.scrollTop;
    const syncFromCurrentScroll = () => {
      if (scrollEl.scrollTop !== previousScrollTop) {
        previousScrollTop = scrollEl.scrollTop;
        updateActiveSectionFromScroll();
      }
    };
    updateActiveSectionFromScroll();
    scrollEl.addEventListener('scroll', updateActiveSectionFromScroll, { passive: true });
    const interval = window.setInterval(syncFromCurrentScroll, 120);
    return () => {
      scrollEl.removeEventListener('scroll', updateActiveSectionFromScroll);
      window.clearInterval(interval);
    };
  }, [updateActiveSectionFromScroll]);
  const jumpToSection = (sectionId: ControlSettingsSectionId) => {
    setActiveSection(sectionId);
    sectionRefs.current[sectionId]?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const toggleGroupForPane = (group: string) => {
    if (configuredInstances.length === 0) return;
    const selectedEverywhere = configuredInstances.every((inst) => configHasControlGroup(panel.config[inst.id], group));
    const shouldSelect = !selectedEverywhere;
    configuredInstances.forEach((inst) => {
      const cfg = panel.config[inst.id];
      if (!cfg) return;
      const existing = cfg.selectedSignals.find((signal) => normalizeControlGroupId(signal) === normalizeControlGroupId(group));
      if (shouldSelect && !existing) {
        updateInstanceSignals(panel.id, inst.id, group);
      }
      if (!shouldSelect && existing) {
        updateInstanceSignals(panel.id, inst.id, existing);
      }
    });
  };

  const renderTargets = () => (
    <div className="divide-y divide-slate-800/70 rounded bg-slate-950/20">
      {instances.map((inst) => {
        const cfg = panel.config[inst.id];
        const isEnabled = Boolean(cfg?.visible);
        return (
          <div
            key={inst.id}
            className={`grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2 px-2 py-1.5 transition-colors ${isEnabled ? 'text-slate-100' : 'text-slate-500'}`}
          >
            <input
              type="checkbox"
              className="h-3.5 w-3.5 cursor-pointer accent-sky-500"
              checked={isEnabled}
              disabled={!cfg}
              onChange={() => cfg && toggleInstanceVisibility(panel.id, inst.id)}
              aria-label={`${inst.name} controller target`}
            />
            <input
              type="color"
              className="block h-5 w-5 cursor-pointer appearance-none rounded border-0 bg-transparent p-0 disabled:opacity-40 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-none"
              value={cfg?.customBaseColor ?? inst.color}
              disabled={!cfg}
              onChange={(e) => updatePanelInstanceColor(panel.id, inst.id, e.target.value)}
              aria-label={`${inst.name} controller color`}
            />
            <input
              type="text"
              className="min-w-0 bg-transparent text-xs font-bold text-slate-200 outline-none disabled:text-slate-500"
              value={cfg?.customName ?? inst.name}
              disabled={!cfg}
              onChange={(e) => updatePanelInstanceName(panel.id, inst.id, e.target.value)}
              placeholder={inst.name}
              aria-label={`${inst.name} controller display name`}
            />
          </div>
        );
      })}
    </div>
  );

  const renderItems = () => (
    <div className="divide-y divide-slate-800/70 rounded bg-slate-950/20">
      {groupOptions.map((group) => {
        const meta = controlGroupMetadata(group);
        const selectedCount = configuredInstances.filter((inst) => configHasControlGroup(panel.config[inst.id], group)).length;
        const isSelected = configuredCount > 0 && selectedCount === configuredCount;
        const isPartial = selectedCount > 0 && !isSelected;
        return (
          <button
            key={normalizeControlGroupId(group)}
            type="button"
            onClick={() => toggleGroupForPane(group)}
            className={`grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 px-2 py-1.5 text-left transition-colors ${
              isSelected
                ? 'text-sky-100'
                : isPartial
                  ? 'text-amber-100'
                  : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-pressed={isSelected}
            aria-label={`${meta.label}: ${isSelected ? 'selected for all targets' : isPartial ? 'selected for some targets' : 'not selected'}; ${selectedCount} of ${configuredCount || instances.length} targets`}
          >
            <span className={`h-3.5 w-3.5 rounded border ${isSelected ? 'border-sky-300 bg-sky-400' : isPartial ? 'border-amber-300 bg-amber-400/60' : 'border-slate-600 bg-slate-950'}`} />
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold">{meta.label}</span>
              <span className="hidden truncate text-[10px] font-medium text-slate-500 sm:block">{meta.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderDisplay = () => (
    <div className="divide-y divide-slate-800/70 rounded bg-slate-950/20">
      <label className="grid gap-2 px-2 py-2 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center">
        <span className="text-[10px] font-bold uppercase text-slate-500">Pane title</span>
        <input
          type="text"
          value={panel.title}
          onChange={(e) => updatePanelTitle(panel.id, e.target.value)}
          className="h-9 w-full rounded border border-slate-700/70 bg-slate-950/70 px-2 text-sm font-bold text-slate-100 outline-none focus:border-slate-500"
          placeholder="Controls"
        />
      </label>
    </div>
  );

  const renderSectionContent = (sectionId: ControlSettingsSectionId) => {
    if (sectionId === 'items') return renderItems();
    if (sectionId === 'display') return renderDisplay();
    if (sectionId === 'custom') {
      return (
        <ControllerItemsBuilder
          panel={panel}
          instances={instances}
          activeInstanceId={activeInstanceId}
          updatePanelControllerItems={updatePanelControllerItems}
        />
      );
    }
    return renderTargets();
  };

  return (
    <div className="@container h-full min-h-0 w-full text-slate-200">
      <div className="flex h-full min-h-0 w-full flex-col @min-[760px]:grid @min-[760px]:grid-cols-[minmax(10rem,12rem)_minmax(0,1fr)] @min-[760px]:gap-4">
      <div className="hidden min-h-0 @min-[760px]:block">
        <aside className="h-full min-h-0 overflow-y-auto py-1 pr-1 custom-scrollbar" aria-label="Controller settings categories">
          <div className="space-y-1">
            {CONTROL_SETTINGS_SECTIONS.map((section) => {
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => jumpToSection(section.id)}
                  className={`block w-full border-l-2 px-3 py-1.5 text-left text-xs font-semibold transition-colors ${activeSection === section.id ? 'border-slate-300 text-slate-100' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  <span className="min-w-0 truncate">{section.label}</span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
      <div ref={settingsScrollRef} onScroll={updateActiveSectionFromScroll} className="min-h-0 w-full flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <div className="mb-3 flex flex-none items-center justify-between gap-3 px-1 pb-1">
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-100">Controller pane</div>
          </div>
        </div>
        {CONTROL_SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <section
              key={section.id}
              ref={(node) => { sectionRefs.current[section.id] = node; }}
              className="relative scroll-mt-2 border-b border-slate-800/70 pb-4 last:border-b-0 last:pb-1"
            >
              <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-800/70 bg-[#0B1120]/95 px-1 py-1 backdrop-blur">
                <Icon className="h-3.5 w-3.5 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-100">{section.label}</h3>
              </div>
              <div className="min-h-0 pt-2">
                {renderSectionContent(section.id)}
              </div>
            </section>
          );
        })}
      </div>
      </div>
    </div>
  );
}

function PanelSettingsButton({ toggleSettings, ...settingsProps }: PanelSettingsButtonProps) {
  const { panel } = settingsProps;
  const usesBoardSettings = isBoardSettingsPanel(panel.type);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); toggleSettings(panel.id); }}
        className={`relative z-50 flex h-7 w-7 items-center justify-center rounded border border-slate-800/70 transition-colors ${panel.isSettingsOpen ? 'bg-slate-700 text-slate-200' : 'bg-slate-950/75 text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
        title="Pane settings"
        aria-label={`${panel.title} pane settings`}
      >
        <Settings className="h-3.5 w-3.5" />
      </button>
      {panel.isSettingsOpen && (
        <>
          <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); toggleSettings(panel.id); }} />
          <div className={`absolute top-full right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-3 z-50 cursor-default ${usesBoardSettings ? 'w-[min(42rem,calc(100vw-2rem))]' : 'w-56'}`}>
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configuration</span>
              <button
                type="button"
                onClick={() => toggleSettings(panel.id)}
                className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-700 hover:text-white"
                aria-label="Close pane settings"
                title="Close settings"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className={`${usesBoardSettings ? 'h-[min(32rem,calc(100vh-10rem))]' : 'max-h-64 space-y-3'} overflow-y-auto custom-scrollbar`}>
              <PanelSettingsControls {...settingsProps} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PanelSettingsView({ toggleSettings, ...settingsProps }: PanelSettingsButtonProps) {
  const { panel } = settingsProps;
  const usesBoardSettings = isBoardSettingsPanel(panel.type);
  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-[#0B1120]">
      <div className="flex flex-none items-center gap-3 px-3 py-2">
        <button
          type="button"
          onClick={() => toggleSettings(panel.id)}
          className="inline-flex min-w-0 flex-none items-center gap-1.5 py-1 text-xs font-semibold text-slate-300 transition-colors hover:text-slate-100"
          aria-label={`Back to ${panel.title}`}
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Back to {panel.title}</span>
        </button>
      </div>
      <div className={`min-h-0 flex-1 ${usesBoardSettings ? 'overflow-hidden px-1 pb-2' : 'overflow-y-auto custom-scrollbar p-3'}`}>
        {!usesBoardSettings && (
          <div className="mb-3 border-b border-slate-700 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Customizations
          </div>
        )}
        <PanelSettingsControls {...settingsProps} />
      </div>
    </div>
  );
}

interface PanelCardProps {
  panel: PanelDef;
  isEditor: boolean;
  chromeMode?: 'desktop' | 'mobile' | 'dockview';
  instances: SimInstance[];
  noteMode: 'read' | 'edit';
  setNoteModes: React.Dispatch<React.SetStateAction<Record<string, 'read' | 'edit'>>>;
  physicsRefs: React.MutableRefObject<Map<string, PhysicsRefState>>;
  instanceHealth: Record<string, SimulationHealth>;
  steadyUpdateStatuses?: SteadyUpdateStatusMap;
  activeInstanceId: string;
  setActiveInstanceId: (id: string) => void;
  updateInstanceParams: (id: string, params: Partial<SimulationParams>) => void;
  updateInstanceKnobs: (id: string, knobs: ClinicalKnobs) => void;
  updateInstanceVolume: (id: string, vol: number) => void;
  updateInstanceColor: (id: string, color: string) => void;
  updateInstanceName: (id: string, name: string) => void;
  addInstance: (sourceId?: string, presetId?: string) => void;
  removeInstance: (id: string) => void;
  timeScale: number;
  setTimeScale: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  togglePlay: () => void;
  addPanel: (type: PanelType, zone?: WorkbenchZoneId) => void;
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
  updatePanelControllerItems: (panelId: string, items: ControllerItem[]) => void;
  updatePanelLegendPosition: (panelId: string, pos?: LegendPosition) => void;
  noteCaseKey: string;
  notes: Record<string, NoteContent>;
  onNoteChange: (panelId: string, blocks: NoteContent) => void;
  chambers: ChamberId[];
  signals: SignalType[];
  metrics: MetricType[];
  controlGroups: string[];
  canConfigure?: boolean;
}

function PanelCard({
  panel,
  isEditor,
  chromeMode = 'desktop',
  instances,
  noteMode,
  setNoteModes,
  physicsRefs,
  instanceHealth,
  steadyUpdateStatuses,
  activeInstanceId,
  setActiveInstanceId,
  updateInstanceParams,
  updateInstanceKnobs,
  updateInstanceVolume,
  updateInstanceColor,
  updateInstanceName,
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
  updatePanelControllerItems,
  updatePanelLegendPosition,
  noteCaseKey,
  notes,
  onNoteChange,
  chambers,
  signals,
  metrics,
  controlGroups,
  canConfigure = isEditor,
}: PanelCardProps) {
  const bodyClassName = chromeMode === 'mobile' || chromeMode === 'dockview'
    ? 'relative h-full min-h-16 w-full'
    : `flex-1 min-h-0 w-full relative z-10 ${['WAVEFORM', 'GUYTON_RIGHT', 'GUYTON_LEFT'].includes(panel.type) ? '-mt-6' : ''} ${panel.type === 'PVLOOP' ? 'mb-4' : ''}`;
  const canOpenSettingsFromLegend = chromeMode === 'dockview' && canConfigure;
  const openSettingsFromLegend = canOpenSettingsFromLegend
    ? (panelId: string) => openPanelSettingsIfClosed(panel, panelId, toggleSettings)
    : undefined;
  const changeLegendPosition = canOpenSettingsFromLegend ? updatePanelLegendPosition : undefined;
  const dockviewNoteModeSwitch = chromeMode === 'dockview' && panel.type === 'NOTE' && canConfigure ? (
    <div className="flex shrink-0 items-center justify-end border-b border-slate-800/70 bg-slate-950/35 px-2 py-1">
      <div className="flex items-center rounded border border-slate-700 bg-slate-900 p-0.5">
        <button
          type="button"
          onClick={() => setNoteModes(prev => ({ ...prev, [panel.id]: 'read' }))}
          className={`rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${noteMode === 'read' ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => setNoteModes(prev => ({ ...prev, [panel.id]: 'edit' }))}
          className={`rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${noteMode === 'edit' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Edit
        </button>
      </div>
    </div>
  ) : null;
  const panelBody = (
    <div className={bodyClassName}>
      {renderPaneBody(panel, {
        instances,
        physicsRefs,
        instanceHealth,
        steadyUpdateStatuses,
        activeInstanceId,
        updateInstanceParams,
        updateInstanceKnobs,
        updateInstanceVolume,
        noteMode,
        notes,
        noteCaseKey,
        onNoteChange,
        noteHeader: dockviewNoteModeSwitch,
        addInstance,
        removeInstance,
        updateInstanceName,
        updateInstanceColor,
        canConfigure: canOpenSettingsFromLegend,
        onOpenSettings: openSettingsFromLegend,
        legendPosition: panel.view?.kind === 'graph' ? panel.view.legendPosition : undefined,
        onLegendPositionChange: changeLegendPosition,
      })}
    </div>
  );

  if (chromeMode === 'dockview' && canConfigure && panel.type !== 'SCENARIOS' && panel.isSettingsOpen) {
    return (
      <PanelSettingsView
        panel={panel}
        instances={instances}
        activeInstanceId={activeInstanceId}
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
        updatePanelControllerItems={updatePanelControllerItems}
        chambers={chambers}
        signals={signals}
        metrics={metrics}
        controlGroups={controlGroups}
      />
    );
  }

  if (chromeMode === 'mobile' || chromeMode === 'dockview') {
    return (
      <div className="group relative h-full min-h-0 w-full overflow-hidden bg-[#0B1120]">
        {panelBody}
      </div>
    );
  }

  return (
    <div
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
          <PanelSettingsButton
            panel={panel}
            instances={instances}
            activeInstanceId={activeInstanceId}
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
            updatePanelControllerItems={updatePanelControllerItems}
            chambers={chambers}
            signals={signals}
            metrics={metrics}
            controlGroups={controlGroups}
          />
          {isEditor && (
            <button onClick={() => removePanel(panel.id)} className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-400" title="Close Panel" aria-label={`Close ${panel.title}`}>
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {panelBody}
    </div>
  );
}

const ZONE_LABELS: Record<WorkbenchZoneId, string> = {
  caseRail: 'Case',
  main: 'Main',
  sideRail: 'Controls',
  bottomPanel: 'Outputs',
};

function getZoneSurfaceClass(zone: WorkbenchZoneId, hasCaseRail: boolean): string {
  const divider = 'border-slate-800/60';
  switch (zone) {
    case 'caseRail':
      return `workbench-zone-aux border ${divider} rounded-r-lg`;
    case 'sideRail':
      return `workbench-zone-aux border ${divider} rounded-lg shadow-[0_10px_28px_rgba(2,6,23,0.2)]`;
    case 'bottomPanel':
      return hasCaseRail
        ? `workbench-zone-aux border ${divider} rounded-lg shadow-[0_-8px_24px_rgba(2,6,23,0.18)]`
        : `workbench-zone-aux border ${divider} rounded-lg shadow-[0_-8px_24px_rgba(2,6,23,0.18)]`;
    case 'main':
    default:
      return 'workbench-zone-main';
  }
}

function getZoneSurfaceClassForLayout(
  zone: WorkbenchZoneId,
  hasCaseRail: boolean,
  _controlsSide: WorkbenchControlsSide,
): string {
  const divider = 'border-slate-800/60';
  if (zone === 'sideRail') {
    return `workbench-zone-aux border ${divider} rounded-lg shadow-[0_10px_28px_rgba(2,6,23,0.2)]`;
  }
  return getZoneSurfaceClass(zone, hasCaseRail);
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function ZoneShell({
  zone,
  panels,
  mode,
  hasCaseRail,
  controlsSide,
  layoutKey,
  viewState,
  onViewStateChange,
  addPanel,
  removePanel,
  updatePanelTitle,
  toggleSettings,
  renderPanel,
  getPanelTitle,
  className = '',
  style,
}: {
  zone: WorkbenchZoneId;
  panels: PanelDef[];
  mode: PanelGridMode;
  hasCaseRail: boolean;
  controlsSide: WorkbenchControlsSide;
  layoutKey?: string;
  viewState?: DockviewViewState;
  onViewStateChange?: (zone: WorkbenchZoneId, viewState: DockviewViewState) => void;
  addPanel: (type: PanelType, zone?: WorkbenchZoneId) => void;
  removePanel: (id: string) => void;
  updatePanelTitle: (id: string, newTitle: string) => void;
  toggleSettings: (panelId: string) => void;
  renderPanel: (panel: PanelDef) => React.ReactNode;
  getPanelTitle: (panel: PanelDef) => string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section className={`flex min-h-0 flex-col overflow-hidden bg-[#0B1120] ${getZoneSurfaceClassForLayout(zone, hasCaseRail, controlsSide)} ${className}`} style={style} aria-label={`${ZONE_LABELS[zone]} zone`}>
      <WorkbenchDockview
        panels={panels}
        zone={zone}
        mode={mode}
        layoutKey={`${layoutKey ?? 'default'}:${zone}`}
        viewState={viewState}
        onViewStateChange={(next) => onViewStateChange?.(zone, next)}
        onRemovePanel={removePanel}
        onToggleSettings={toggleSettings}
        onRenamePanel={updatePanelTitle}
        onAddPanel={addPanel}
        getPanelTitle={getPanelTitle}
        className={`workbench-dockview workbench-dockview-${zone} flex-1`}
        renderPanel={renderPanel}
      />
    </section>
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
  layoutState,
  onLayoutStateChange,
  dockviewLayoutKey,
  dockviewViewStates,
  onDockviewViewStateChange,
  mode,
  isMobile,
  noteModes,
  setNoteModes,
  physicsRefs,
  instanceHealth,
  steadyUpdateStatuses,
  activeInstanceId,
  setActiveInstanceId,
  updateInstanceParams,
  updateInstanceKnobs,
  updateInstanceVolume,
  updateInstanceColor,
  updateInstanceName,
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
  updatePanelControllerItems,
  updatePanelLegendPosition,
  noteCaseKey,
  notes,
  onNoteChange,
  chambers,
  signals,
  metrics,
  controlGroups,
}: PanelGridProps) {
  const presenterPanels = useMemo(() => flowPack(panels), [panels]);
  const panelsByZone = useMemo<Record<WorkbenchZoneId, PanelDef[]>>(() => ({
    caseRail: presenterPanels.filter((panel) => zoneOf(panel) === 'caseRail'),
    main: presenterPanels.filter((panel) => zoneOf(panel) === 'main'),
    sideRail: presenterPanels.filter((panel) => zoneOf(panel) === 'sideRail'),
    bottomPanel: presenterPanels.filter((panel) => zoneOf(panel) === 'bottomPanel'),
  }), [presenterPanels]);
  const hasCaseRail = panelsByZone.caseRail.length > 0;
  const shareBanner = authoringMode && publishedLesson ? (
    <div className="mb-2 flex flex-col gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100 sm:flex-row sm:items-center">
      <span className="font-bold">Share URL</span>
      <a href={publishedLesson.url} className="min-w-0 flex-1 truncate transition-colors hover:text-emerald-50">
        {publishedLesson.url}
      </a>
      <button onClick={copyShareUrl} className="self-start rounded bg-emerald-500/15 px-2 py-1 font-bold text-emerald-100 transition-colors hover:bg-emerald-500/25 sm:self-auto">
        Copy
      </button>
    </div>
  ) : null;

  const getPanelTitle = useCallback(getDockviewPaneTitle, []);
  const beginResize = useCallback((
    event: React.PointerEvent<HTMLDivElement>,
    target: 'caseRail' | 'controls' | 'output',
  ) => {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startLayout = layoutState;
    const onMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      onLayoutStateChange((prev) => {
        if (target === 'caseRail') {
          return { ...prev, caseRailWidth: clamp(startLayout.caseRailWidth + dx, 200, 560) };
        }
        if (target === 'controls') {
          const signedDelta = startLayout.controlsSide === 'left' ? dx : -dx;
          return { ...prev, controlsWidth: clamp(startLayout.controlsWidth + signedDelta, 240, 620) };
        }
        return { ...prev, outputHeight: clamp(startLayout.outputHeight - dy, 140, 320) };
      });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }, [layoutState, onLayoutStateChange]);

  const resizeWithKeyboard = useCallback((
    event: React.KeyboardEvent<HTMLDivElement>,
    target: 'caseRail' | 'controls' | 'output',
  ) => {
    const fineStep = 10;
    const coarseStep = 40;
    const key = event.key;
    const isHome = key === 'Home';
    const isEnd = key === 'End';
    const isCoarseIncrease = key === 'PageUp';
    const isCoarseDecrease = key === 'PageDown';
    const handled = isHome || isEnd || isCoarseIncrease || isCoarseDecrease
      || (target !== 'output' && (key === 'ArrowLeft' || key === 'ArrowRight'))
      || (target === 'output' && (key === 'ArrowUp' || key === 'ArrowDown'));
    if (!handled) return;
    event.preventDefault();

    onLayoutStateChange((prev) => {
      if (target === 'caseRail') {
        const delta = isCoarseIncrease ? coarseStep : isCoarseDecrease ? -coarseStep : key === 'ArrowRight' ? fineStep : key === 'ArrowLeft' ? -fineStep : 0;
        const next = isHome ? 200 : isEnd ? 560 : prev.caseRailWidth + delta;
        return { ...prev, caseRailWidth: clamp(next, 200, 560) };
      }
      if (target === 'controls') {
        const expandsWithKey = prev.controlsSide === 'left' ? 'ArrowRight' : 'ArrowLeft';
        const shrinksWithKey = prev.controlsSide === 'left' ? 'ArrowLeft' : 'ArrowRight';
        const delta = isCoarseIncrease ? coarseStep : isCoarseDecrease ? -coarseStep : key === expandsWithKey ? fineStep : key === shrinksWithKey ? -fineStep : 0;
        const next = isHome ? 240 : isEnd ? 620 : prev.controlsWidth + delta;
        return { ...prev, controlsWidth: clamp(next, 240, 620) };
      }
      const delta = isCoarseIncrease ? coarseStep : isCoarseDecrease ? -coarseStep : key === 'ArrowUp' ? fineStep : key === 'ArrowDown' ? -fineStep : 0;
      const next = isHome ? 140 : isEnd ? 320 : prev.outputHeight + delta;
      return { ...prev, outputHeight: clamp(next, 140, 320) };
    });
  }, [onLayoutStateChange]);

  const renderPanel = (panel: PanelDef, isEditor: boolean, chromeMode: PanelChromeMode = 'desktop') => (
    <PanelCard
      key={panel.id}
      panel={panel}
      isEditor={isEditor}
      chromeMode={chromeMode}
      instances={instances}
      noteMode={noteModes[panel.id] ?? 'read'}
      setNoteModes={setNoteModes}
      physicsRefs={physicsRefs}
      instanceHealth={instanceHealth}
      steadyUpdateStatuses={steadyUpdateStatuses}
      activeInstanceId={activeInstanceId}
      setActiveInstanceId={setActiveInstanceId}
      updateInstanceParams={updateInstanceParams}
      updateInstanceKnobs={updateInstanceKnobs}
      updateInstanceVolume={updateInstanceVolume}
      updateInstanceColor={updateInstanceColor}
      updateInstanceName={updateInstanceName}
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
      updatePanelControllerItems={updatePanelControllerItems}
      updatePanelLegendPosition={updatePanelLegendPosition}
      noteCaseKey={noteCaseKey}
      notes={notes}
      onNoteChange={onNoteChange}
      chambers={chambers}
      signals={signals}
      metrics={metrics}
      controlGroups={controlGroups}
      canConfigure={mode !== 'learner'}
    />
  );

  const sashClassName = 'z-20 bg-[#08111f] transition-colors hover:bg-slate-800/45 focus-visible:bg-slate-700/70 focus-visible:outline focus-visible:outline-1 focus-visible:outline-sky-400 data-[dragging=true]:bg-slate-700/70';
  const gridTemplateColumns = hasCaseRail
    ? layoutState.controlsSide === 'left'
      ? `${layoutState.caseRailWidth}px 3px ${layoutState.controlsWidth}px 3px minmax(320px,1fr)`
      : `${layoutState.caseRailWidth}px 3px minmax(320px,1fr) 3px ${layoutState.controlsWidth}px`
    : layoutState.controlsSide === 'left'
      ? `${layoutState.controlsWidth}px 3px minmax(320px,1fr)`
      : `minmax(320px,1fr) 3px ${layoutState.controlsWidth}px`;
  const gridTemplateRows = `minmax(0,1fr) 3px ${layoutState.outputHeight}px`;
  const caseRailStyle = { gridColumn: '1', gridRow: '1 / 4' };
  const caseRailSashStyle = { gridColumn: '2', gridRow: '1 / 4' };
  const mainStyle = hasCaseRail
    ? { gridColumn: layoutState.controlsSide === 'left' ? '5' : '3', gridRow: '1' }
    : { gridColumn: layoutState.controlsSide === 'left' ? '3' : '1', gridRow: '1' };
  const sideRailStyle = hasCaseRail
    ? { gridColumn: layoutState.controlsSide === 'left' ? '3' : '5', gridRow: '1' }
    : { gridColumn: layoutState.controlsSide === 'left' ? '1' : '3', gridRow: '1' };
  const controlSashStyle = hasCaseRail
    ? { gridColumn: '4', gridRow: '1' }
    : { gridColumn: '2', gridRow: '1' };
  const outputSashStyle = hasCaseRail
    ? { gridColumn: '3 / 6', gridRow: '2' }
    : { gridColumn: '1 / 4', gridRow: '2' };
  const bottomPanelStyle = hasCaseRail
    ? { gridColumn: '3 / 6', gridRow: '3' }
    : { gridColumn: '1 / 4', gridRow: '3' };

  if (isMobile) {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-950 p-2">
        {shareBanner}
        {authoringMode && <LessonAuthoring instances={instances} stepsDraft={stepsDraft} setStepsDraft={setStepsDraft} />}
        <WorkbenchMobile
          panels={presenterPanels}
          title="Workbench"
          className="min-h-0 flex-1"
          renderPanel={(panel) => renderPanel(panel, false, 'mobile')}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-950 p-0">
        {shareBanner}
        {authoringMode && <LessonAuthoring instances={instances} stepsDraft={stepsDraft} setStepsDraft={setStepsDraft} />}
        <div
          className="grid min-h-0 flex-1 gap-0 overflow-hidden"
          style={{ gridTemplateColumns, gridTemplateRows }}
        >
          {hasCaseRail && (
            <>
              <ZoneShell
                zone="caseRail"
                panels={panelsByZone.caseRail}
                mode={mode}
                hasCaseRail={hasCaseRail}
                controlsSide={layoutState.controlsSide}
                layoutKey={dockviewLayoutKey}
                viewState={dockviewViewStates?.caseRail}
                onViewStateChange={onDockviewViewStateChange}
                addPanel={addPanel}
                removePanel={removePanel}
                updatePanelTitle={updatePanelTitle}
                toggleSettings={toggleSettings}
                className=""
                style={caseRailStyle}
                getPanelTitle={getPanelTitle}
                renderPanel={(panel) => renderPanel(panel, false, 'dockview')}
              />
              <div
                role="separator"
                aria-label="Resize case area"
                aria-orientation="vertical"
                aria-valuemin={200}
                aria-valuemax={560}
                aria-valuenow={layoutState.caseRailWidth}
                tabIndex={0}
                className={`${sashClassName} cursor-col-resize`}
                style={caseRailSashStyle}
                onPointerDown={(event) => beginResize(event, 'caseRail')}
                onKeyDown={(event) => resizeWithKeyboard(event, 'caseRail')}
              />
            </>
          )}
          <ZoneShell
            zone="main"
            panels={panelsByZone.main}
            mode={mode}
            hasCaseRail={hasCaseRail}
            controlsSide={layoutState.controlsSide}
            layoutKey={dockviewLayoutKey}
            viewState={dockviewViewStates?.main}
            onViewStateChange={onDockviewViewStateChange}
            addPanel={addPanel}
            removePanel={removePanel}
            updatePanelTitle={updatePanelTitle}
            toggleSettings={toggleSettings}
            className=""
            style={mainStyle}
            getPanelTitle={getPanelTitle}
            renderPanel={(panel) => renderPanel(panel, false, 'dockview')}
          />
          <ZoneShell
            zone="sideRail"
            panels={panelsByZone.sideRail}
            mode={mode}
            hasCaseRail={hasCaseRail}
            controlsSide={layoutState.controlsSide}
            layoutKey={dockviewLayoutKey}
            viewState={dockviewViewStates?.sideRail}
            onViewStateChange={onDockviewViewStateChange}
            addPanel={addPanel}
            removePanel={removePanel}
            updatePanelTitle={updatePanelTitle}
            toggleSettings={toggleSettings}
            className=""
            style={sideRailStyle}
            getPanelTitle={getPanelTitle}
            renderPanel={(panel) => renderPanel(panel, false, 'dockview')}
          />
          <div
            role="separator"
            aria-label="Resize controls area"
            aria-orientation="vertical"
            aria-valuemin={240}
            aria-valuemax={620}
            aria-valuenow={layoutState.controlsWidth}
            tabIndex={0}
            className={`${sashClassName} cursor-col-resize`}
            style={controlSashStyle}
            onPointerDown={(event) => beginResize(event, 'controls')}
            onKeyDown={(event) => resizeWithKeyboard(event, 'controls')}
          />
          <div
            role="separator"
            aria-label="Resize output area"
            aria-orientation="horizontal"
            aria-valuemin={140}
            aria-valuemax={320}
            aria-valuenow={layoutState.outputHeight}
            tabIndex={0}
            className={`${sashClassName} cursor-row-resize`}
            style={outputSashStyle}
            onPointerDown={(event) => beginResize(event, 'output')}
            onKeyDown={(event) => resizeWithKeyboard(event, 'output')}
          />
          <ZoneShell
            zone="bottomPanel"
            panels={panelsByZone.bottomPanel}
            mode={mode}
            hasCaseRail={hasCaseRail}
            controlsSide={layoutState.controlsSide}
            layoutKey={dockviewLayoutKey}
            viewState={dockviewViewStates?.bottomPanel}
            onViewStateChange={onDockviewViewStateChange}
            addPanel={addPanel}
            removePanel={removePanel}
            updatePanelTitle={updatePanelTitle}
            toggleSettings={toggleSettings}
            className=""
            style={bottomPanelStyle}
            getPanelTitle={getPanelTitle}
            renderPanel={(panel) => renderPanel(panel, false, 'dockview')}
          />
        </div>
    </main>
  );
}
