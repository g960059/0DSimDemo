import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import WorkbenchDockview from './WorkbenchDockview';
import WorkbenchMobile from './WorkbenchMobile';
import { renderPaneBody } from './renderPaneBody';
import { ControllerItemsBuilder, type ControllerAuthoringCatalog } from './ControllerItemsBuilder';
import { getScenarioPresetMenuPosition, ScenarioPane, ScenarioPresetMenu, type ScenarioPresetCatalogEntry } from './ScenarioPane';
import { WorkbenchEmptyState } from './WorkbenchEmptyState';
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
  PvLoopDebugTraceMode,
  type LegendPosition,
  SignalType,
  SimInstance,
  SimulationParams,
  WorkbenchZoneId,
} from '../../types';
import type { CaseReadingManifest } from '../../caseDoc';
import type { NoteContent } from '../../noteTypes';
import { flowPack } from '../../layoutPresets';
import {
  effectiveGlobalConfig,
  firstPanelOfType,
  graphPanelsOnly,
} from '../../features/workbench/p1aStructuralHosts';
import {
  controllerViews,
  createControllerViewSpec,
  createMetricsViewSpec,
  metricsViewConfig,
  metricsViews,
  type AuthoredViewSpec,
} from '../../features/workbench/authoredViews';
import { resolveControllerTargetId } from '../../features/workbench/controllerBinding';
import { hasViewRefUsage, viewRefUsageForDeletion } from '../../features/workbench/noteViewRefs';
import type { ControllerViewSpec, GraphBoardLayout, MetricsViewSpec } from '../../features/workbench/viewSpec';
import type { WorkbenchThemeId } from './WorkbenchSidePanel';
import type { WorkbenchRuntimeRenderer } from '../../features/workbench/runtime/WorkbenchRuntimeRenderer';
import { Activity, Brush, Bug, Check, ChevronDown, ChevronRight, Copy, Eye, EyeOff, FileText, Layers, Pencil, Plus, RotateCcw, Search, Settings, SlidersHorizontal, Tags, Trash2, Type as TypeIcon, X } from 'lucide-react';

const LegacyControls = React.lazy(
  () => import('../Controls').then((module) => ({ default: module.Controls })),
);
const LegacyMetricsPanel = React.lazy(
  () => import('../Charts').then((module) => ({ default: module.MetricsPanel })),
);

export type PanelGridMode = 'learner' | 'sandbox';
export type RightRailView = 'scenarios' | 'inspector';
export type MetricsSpanMode = 'main' | 'full';

export interface WorkbenchLayoutState {
  controlsWidth: number;
  caseRailWidth: number;
  outputHeight: number;
  noteOpen: boolean;
  metricsOpen: boolean;
  rightRailVisible: boolean;
  rightRailView: RightRailView;
  selectedControllerViewId?: string;
  scenarioListCollapsed: boolean;
  scenarioListMaxRatio: number;
  scenarioListHeightPx?: number;
  metricsSpan: MetricsSpanMode;
}

export interface PanelGridProps {
  instances: SimInstance[];
  panels: PanelDef[];
  layoutState: WorkbenchLayoutState;
  onLayoutStateChange: React.Dispatch<React.SetStateAction<WorkbenchLayoutState>>;
  dockviewLayoutKey?: string;
  mainDockviewViewState?: DockviewViewState;
  onDockviewViewStateChange?: (zone: WorkbenchZoneId, viewState: DockviewViewState) => void;
  graphBoardLayout?: GraphBoardLayout;
  onGraphBoardLayoutChange?: (layout: GraphBoardLayout | undefined) => void;
  workbenchTheme?: WorkbenchThemeId;
  authoredViews?: AuthoredViewSpec[];
  reading?: CaseReadingManifest;
  createControllerView: (title: string, items?: ControllerItem[]) => ControllerViewSpec;
  createMetricsView: (title: string, metrics?: MetricType[]) => MetricsViewSpec;
  updateAuthoredView: (view: AuthoredViewSpec) => void;
  renameAuthoredView: (id: string, title: string) => void;
  restoreStandardViews: () => void;
  duplicateAuthoredView: (id: string) => AuthoredViewSpec | undefined;
  deleteAuthoredView: (id: string) => void;
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
  toggleScenarioGlobalVisibility: (id: string) => void;
  resetInstanceKnobs: (id: string) => void;
  addInstance: (sourceId?: string, presetId?: string) => void;
  removeInstance: (id: string) => void;
  timeScale: number;
  setTimeScale: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  togglePlay: () => void;
  addPanel: (type: PanelType, zone?: WorkbenchZoneId) => PanelDef | undefined;
  duplicatePanel: (panelId: string) => PanelDef | undefined;
  removePanel: (id: string) => void;
  updatePanelTitle: (id: string, newTitle: string) => void;
  toggleShowLegend: (id: string) => void;
  updatePanelInstanceColor: (panelId: string, instId: string, newColor: string) => void;
  updatePanelInstanceName: (panelId: string, instId: string, newName: string) => void;
  updatePanelSignalColor: (panelId: string, instId: string, sig: string, newColor: string) => void;
  updatePanelSignalName: (panelId: string, instId: string, sig: string, newName: string) => void;
  toggleSettings: (panelId: string) => void;
  togglePaneMembership: (panelId: string, instId: string) => void;
  updateInstanceSignals: (panelId: string, instId: string, signal: string) => void;
  toggleGuides: (panelId: string) => void;
  updateTimeWindow: (panelId: string, val: number) => void;
  togglePvDebugOverlay: (panelId: string) => void;
  updatePvDebugTraceMode: (panelId: string, mode: PvLoopDebugTraceMode) => void;
  updatePanelControllerItems: (panelId: string, items: ControllerItem[]) => void;
  updatePanelLegendPosition: (panelId: string, pos?: LegendPosition) => void;
  noteCaseKey: string;
  notes: Record<string, NoteContent>;
  onNoteChange: (panelId: string, blocks: NoteContent) => void;
  chambers: ChamberId[];
  signals: SignalType[];
  metrics: MetricType[];
  controlGroups: string[];
  runtimeRenderer?: WorkbenchRuntimeRenderer;
  /** Runtime-specific controller catalog; omitted for the legacy model. */
  controllerAuthoring?: ControllerAuthoringCatalog;
  /** Runtime-specific scenario presets; omitted for legacy OFFICIAL_BASELINES. */
  scenarioPresetCatalog?: readonly ScenarioPresetCatalogEntry[];
}

type PanelChromeMode = 'desktop' | 'mobile' | 'dockview';

const WB_FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent';

export function getDockviewPaneTitle(panel: PanelDef): string {
  return panel.title;
}

export interface MetricsDockviewPanelBinding {
  panelId: string;
  viewId: string;
}

function metricsPanelBindingSignature(bindings: readonly MetricsDockviewPanelBinding[]): string {
  return bindings.map((binding) => `${binding.panelId}:${binding.viewId}`).join('|');
}

function nextMetricsMirrorPanelId(viewId: string, usedPanelIds: ReadonlySet<string>): string {
  let index = 2;
  while (usedPanelIds.has(`${viewId}#${index}`)) index += 1;
  return `${viewId}#${index}`;
}

export function syncMetricsDockviewPanelBindings(
  currentBindings: readonly MetricsDockviewPanelBinding[],
  views: readonly MetricsViewSpec[],
): MetricsDockviewPanelBinding[] {
  const viewIds = new Set(views.map((view) => view.id));
  const usedPanelIds = new Set<string>();
  const next = currentBindings.filter((binding) => {
    if (!viewIds.has(binding.viewId) || usedPanelIds.has(binding.panelId)) return false;
    usedPanelIds.add(binding.panelId);
    return true;
  });
  const representedViewIds = new Set(next.map((binding) => binding.viewId));
  for (const view of views) {
    if (representedViewIds.has(view.id)) continue;
    const panelId = usedPanelIds.has(view.id) ? nextMetricsMirrorPanelId(view.id, usedPanelIds) : view.id;
    usedPanelIds.add(panelId);
    next.push({ panelId, viewId: view.id });
  }
  return next;
}

export function metricsViewToDockviewPanel(view: MetricsViewSpec, panelId = view.id): PanelDef {
  return {
    id: panelId,
    sourceViewId: view.id,
    type: 'METRICS',
    title: view.title ?? 'Metrics view',
    role: 'output',
    zone: 'bottomPanel',
    w: 4,
    h: 4,
    config: {},
    isSettingsOpen: false,
  };
}

export function metricsBindingsToDockviewPanels(
  bindings: readonly MetricsDockviewPanelBinding[],
  views: readonly MetricsViewSpec[],
): PanelDef[] {
  const viewsById = new Map(views.map((view) => [view.id, view]));
  return bindings
    .map((binding) => {
      const view = viewsById.get(binding.viewId);
      return view ? metricsViewToDockviewPanel(view, binding.panelId) : undefined;
    })
    .filter((panel): panel is PanelDef => Boolean(panel));
}

export function metricsViewsToDockviewPanels(views: readonly MetricsViewSpec[]): PanelDef[] {
  return metricsBindingsToDockviewPanels(syncMetricsDockviewPanelBindings([], views), views);
}

export function openPanelSettingsIfClosed(
  panel: Pick<PanelDef, 'id' | 'isSettingsOpen'>,
  panelId: string,
  toggleSettings: (panelId: string) => void,
): void {
  if (panel.id !== panelId || panel.isSettingsOpen) return;
  toggleSettings(panelId);
}

interface PanelSettingsControlsProps {
  panel: PanelDef;
  instances: SimInstance[];
  activeInstanceId: string;
  updatePanelTitle: (id: string, newTitle: string) => void;
  toggleShowLegend: (id: string) => void;
  updatePanelInstanceColor: (panelId: string, instId: string, newColor: string) => void;
  updatePanelInstanceName: (panelId: string, instId: string, newName: string) => void;
  updatePanelSignalColor: (panelId: string, instId: string, sig: string, newColor: string) => void;
  updatePanelSignalName: (panelId: string, instId: string, sig: string, newName: string) => void;
  togglePaneMembership: (panelId: string, instId: string) => void;
  updateInstanceSignals: (panelId: string, instId: string, signal: string) => void;
  toggleGuides: (panelId: string) => void;
  updateTimeWindow: (panelId: string, val: number) => void;
  togglePvDebugOverlay: (panelId: string) => void;
  updatePvDebugTraceMode: (panelId: string, mode: PvLoopDebugTraceMode) => void;
  updatePanelControllerItems: (panelId: string, items: ControllerItem[]) => void;
  chambers: ChamberId[];
  signals: SignalType[];
  metrics: MetricType[];
  controlGroups: string[];
  controllerAuthoring?: ControllerAuthoringCatalog;
}

interface PanelSettingsButtonProps {
  panel: PanelDef;
  toggleSettings: (panelId: string) => void;
}

interface PaneSettingsModalProps extends PanelSettingsControlsProps {
  toggleSettings: (panelId: string) => void;
}

type SignalCategory = 'All' | 'Pressure' | 'Flow' | 'Volume' | 'Valve' | 'Coupling' | 'Derived';
type GraphSettingsSectionId = 'signals' | 'instances' | 'display' | 'style';
type ControlSettingsSectionId = 'targets' | 'items' | 'display' | 'custom';
type SettingsSectionBounds = { top: number; bottom: number };
type PanelGridT = TFunction<'translation', undefined>;

const GRAPH_SETTINGS_PANEL_TYPES = new Set<PanelType>(['WAVEFORM', 'PVLOOP', 'METRICS', 'GUYTON_LEFT', 'GUYTON_RIGHT', 'GUYTON_3D']);
const SIGNAL_CATEGORY_ORDER: SignalCategory[] = ['All', 'Pressure', 'Flow', 'Volume', 'Valve', 'Coupling', 'Derived'];
const GRAPH_SETTINGS_SECTIONS: Array<{
  id: GraphSettingsSectionId;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'signals', icon: Activity },
  { id: 'instances', icon: Layers },
  { id: 'display', icon: SlidersHorizontal },
  { id: 'style', icon: Brush },
];
const CONTROL_SETTINGS_SECTIONS: Array<{
  id: ControlSettingsSectionId;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'targets', icon: Layers },
  { id: 'items', icon: SlidersHorizontal },
  { id: 'display', icon: TypeIcon },
  { id: 'custom', icon: SlidersHorizontal },
];
const GRAPH_SETTINGS_SECTION_IDS = GRAPH_SETTINGS_SECTIONS.map((section) => section.id);
const CONTROL_SETTINGS_SECTION_IDS = CONTROL_SETTINGS_SECTIONS.map((section) => section.id);
const PV_DEBUG_TRACE_MODES: PvLoopDebugTraceMode[] = ['raw', 'resampled', 'both'];
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
  'hemodynamics.pressure.absolute.LA': { label: 'LA pressure', category: 'Pressure', unit: 'mmHg' },
  'hemodynamics.pressure.absolute.RA': { label: 'RA pressure', category: 'Pressure', unit: 'mmHg' },
  'hemodynamics.pressure.absolute.LV': { label: 'LV pressure', category: 'Pressure', unit: 'mmHg' },
  'hemodynamics.pressure.absolute.RV': { label: 'RV pressure', category: 'Pressure', unit: 'mmHg' },
  'hemodynamics.pressure.absolute.Ao': { label: 'Aortic pressure', category: 'Pressure', unit: 'mmHg' },
  'hemodynamics.pressure.absolute.PA': { label: 'Pulmonary artery pressure', category: 'Pressure', unit: 'mmHg' },
  'hemodynamics.pressure.absolute.PVein': { label: 'Pulmonary venous pressure', category: 'Pressure', unit: 'mmHg' },
  'valve.MV.flow': { label: 'Mitral flow', category: 'Flow', unit: 'mL/s' },
  'valve.AoV.flow': { label: 'Aortic flow', category: 'Flow', unit: 'mL/s' },
  'valve.TV.flow': { label: 'Tricuspid flow', category: 'Flow', unit: 'mL/s' },
  'valve.PV.flow': { label: 'Pulmonic flow', category: 'Flow', unit: 'mL/s' },
  'hemodynamics.flow.pulmonary_venous': { label: 'Pulmonary venous flow', category: 'Flow', unit: 'mL/s' },
  'valve.MV.opening_fraction': { label: 'Mitral opening', category: 'Valve' },
  'valve.AoV.opening_fraction': { label: 'Aortic opening', category: 'Valve' },
  'valve.TV.opening_fraction': { label: 'Tricuspid opening', category: 'Valve' },
  'valve.PV.opening_fraction': { label: 'Pulmonic opening', category: 'Valve' },
  'pericardium.excess_pressure': { label: 'Pericardial excess pressure', category: 'Coupling', unit: 'mmHg' },
  'hemodynamics.pressure.mean.LA': { label: 'Mean LA pressure', category: 'Pressure', unit: 'mmHg' },
  'hemodynamics.pressure.mean.RA': { label: 'Mean RA pressure', category: 'Pressure', unit: 'mmHg' },
  'hemodynamics.pressure.mean.Ao': { label: 'Mean aortic pressure', category: 'Pressure', unit: 'mmHg' },
  'hemodynamics.pressure.mean.PA': { label: 'Mean pulmonary artery pressure', category: 'Pressure', unit: 'mmHg' },
  'hemodynamics.volume.excursion.LV': { label: 'LV volume excursion', category: 'Volume', unit: 'mL' },
  'hemodynamics.ejection_fraction.LV': { label: 'LV ejection fraction', category: 'Derived', unit: '%' },
  'hemodynamics.volume.excursion.RV': { label: 'RV volume excursion', category: 'Volume', unit: 'mL' },
  'hemodynamics.ejection_fraction.RV': { label: 'RV ejection fraction', category: 'Derived', unit: '%' },
  'valve.AoV.cycle_volume.forward': { label: 'Aortic forward cycle volume', category: 'Volume', unit: 'mL' },
  'valve.AoV.cycle_volume.net': { label: 'Aortic net cycle volume', category: 'Volume', unit: 'mL' },
  'valve.AoV.cardiac_output.forward': { label: 'Aortic forward cardiac output', category: 'Flow', unit: 'L/min' },
  'valve.AoV.cardiac_output.net': { label: 'Aortic net cardiac output', category: 'Flow', unit: 'L/min' },
  'valve.PV.cycle_volume.forward': { label: 'Pulmonary forward cycle volume', category: 'Volume', unit: 'mL' },
  'valve.PV.cycle_volume.net': { label: 'Pulmonary net cycle volume', category: 'Volume', unit: 'mL' },
  'valve.PV.cardiac_output.forward': { label: 'Pulmonary forward cardiac output', category: 'Flow', unit: 'L/min' },
  'valve.PV.cardiac_output.net': { label: 'Pulmonary net cardiac output', category: 'Flow', unit: 'L/min' },
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

function signalCategoryLabel(t: PanelGridT, category: SignalCategory): string {
  const key = category.charAt(0).toLowerCase() + category.slice(1);
  return t(`workbench.panelGrid.signalCategories.${key}`);
}

function panelSourceKey(panelType: PanelType): 'chambers' | 'metrics' | 'signals' | 'curve' {
  if (panelType === 'PVLOOP') return 'chambers';
  if (panelType === 'METRICS') return 'metrics';
  if (panelType === 'WAVEFORM') return 'signals';
  return 'curve';
}

function panelSourceLabel(t: PanelGridT, panelType: PanelType, form: 'title' | 'sentence' = 'sentence'): string {
  return t(`workbench.panelGrid.sources.${panelSourceKey(panelType)}.${form}`);
}

function settingsSectionLabel(t: PanelGridT, kind: 'graph' | 'control', sectionId: GraphSettingsSectionId | ControlSettingsSectionId): string {
  return t(`workbench.panelGrid.settings.${kind}.${sectionId}.label`);
}

function normalizeControlGroupId(group: string) {
  return group.trim().toLowerCase();
}

function controlGroupMetadata(t: PanelGridT, group: string) {
  const groupId = normalizeControlGroupId(group);
  if (!['clinical', 'global', 'ventricles', 'atria', 'vascular', 'fluids', 'valves', 'resp'].includes(groupId)) {
    return {
      label: group,
      description: t('workbench.panelGrid.controlGroups.custom.description'),
    };
  }
  return {
    label: t(`workbench.panelGrid.controlGroups.${groupId}.label`),
    description: t(`workbench.panelGrid.controlGroups.${groupId}.description`),
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
  togglePaneMembership,
  updateInstanceSignals,
  toggleGuides,
  updateTimeWindow,
  chambers,
  signals,
  metrics,
  controlGroups,
}: PanelSettingsControlsProps) {
  const { t } = useTranslation();
  const itemOptions = getPanelItemOptions(panel, chambers, signals, metrics, controlGroups);

  return (
    <>
      <div className="mb-2 flex items-center gap-2 border-b border-wb-line pb-2">
        <span className="text-xs font-medium text-wb-muted">{t('common.title')}:</span>
        <input
          type="text"
          value={panel.title}
          onChange={(e) => updatePanelTitle(panel.id, e.target.value)}
          className="w-full rounded border border-wb-line bg-wb-panel px-1.5 py-0.5 text-xs font-medium text-wb-text outline-none focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
          placeholder={t('workbench.panelGrid.panelTitle')}
        />
      </div>
      {['PVLOOP', 'WAVEFORM'].includes(panel.type) && (
        <div className="mb-2 flex items-center gap-2 border-b border-wb-line pb-2">
          <input type="checkbox" className="cursor-pointer accent-wb-accent" checked={panel.showLegend !== false} onChange={() => toggleShowLegend(panel.id)} />
          <span className="text-xs font-medium text-wb-text">{t('workbench.panelGrid.showLegend')}</span>
        </div>
      )}
      {panel.type === 'PVLOOP' && (
        <div className="mb-2 flex items-center gap-2 border-b border-wb-line pb-2">
          <input type="checkbox" className="cursor-pointer accent-wb-accent" checked={panel.showGuides} onChange={() => toggleGuides(panel.id)} />
          <span className="text-xs font-medium text-wb-text">{t('workbench.panelGrid.showGuides')}</span>
        </div>
      )}
      {panel.type === 'WAVEFORM' && (
        <div className="mb-3 border-b border-wb-line pb-3">
          <div className="mb-2 flex justify-between text-[10px] font-medium text-wb-muted">
            <span>{t('workbench.panelGrid.windowSize')}</span>
            <span className="text-wb-accent">{(panel.timeWindow || 10000) / 1000}s</span>
          </div>
          <input type="range" min={2000} max={20000} step={1000} value={panel.timeWindow || 10000} onChange={(e) => updateTimeWindow(panel.id, parseFloat(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-wb-panel accent-wb-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent" />
        </div>
      )}
      <div className="space-y-3">
        {instances.map(inst => {
          const cfg = panel.config[inst.id];
          return (
            <div key={inst.id}>
              <div className="mb-1 flex items-center gap-2">
                <input type="checkbox" className="flex-none cursor-pointer accent-wb-accent" checked={cfg?.visible || false} onChange={() => togglePaneMembership(panel.id, inst.id)} />
                <input type="color" className="block h-[14px] w-[14px] flex-none cursor-pointer appearance-none rounded border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-none" value={cfg?.customBaseColor ?? inst.color} onChange={(e) => updatePanelInstanceColor(panel.id, inst.id, e.target.value)} />
                <input type="text" className="w-full min-w-0 border-b border-transparent bg-transparent text-xs font-bold text-wb-muted outline-none focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent" value={cfg?.customName ?? inst.name} onChange={(e) => updatePanelInstanceName(panel.id, inst.id, e.target.value)} placeholder={inst.name} />
              </div>
              {cfg?.visible && (panel.type !== 'GUYTON_RIGHT' && panel.type !== 'GUYTON_LEFT') && (
                <div className="grid grid-cols-1 gap-1 pl-5">
                  {itemOptions.map(sig => {
                    const isSelected = cfg.selectedSignals.includes(sig);
                    return (
                      <div key={sig} className="flex items-center gap-1 rounded bg-wb-strip px-1 py-0.5 text-[10px]">
                        <input type="checkbox" className="m-0 h-3 w-3 flex-none cursor-pointer accent-wb-accent" checked={isSelected} onChange={() => updateInstanceSignals(panel.id, inst.id, sig)} />
                        {isSelected && (
                          <input type="color" className="block h-3 w-3 flex-none cursor-pointer appearance-none rounded border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-none" value={cfg.customSignalColors?.[sig] || cfg.customBaseColor || inst.color} onChange={(e) => updatePanelSignalColor(panel.id, inst.id, sig, e.target.value)} />
                        )}
                        {isSelected ? (
                          <input type="text" className="w-full min-w-0 border-b border-transparent bg-transparent text-[10px] font-medium text-wb-muted outline-none focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent" value={cfg.customSignalNames?.[sig] || sig} onChange={(e) => updatePanelSignalName(panel.id, inst.id, sig, e.target.value)} placeholder={sig} />
                        ) : (
                          <span className="flex-1 select-none truncate text-wb-subtle">{sig}</span>
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
  togglePaneMembership,
  updateInstanceSignals,
  toggleGuides,
  updateTimeWindow,
  togglePvDebugOverlay,
  updatePvDebugTraceMode,
  chambers,
  signals,
  metrics,
  controlGroups,
}: PanelSettingsControlsProps) {
  const { t } = useTranslation();
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
  const sourceLabel = panelSourceLabel(t, panel.type, 'title');
  const sourceLabelSentence = panelSourceLabel(t, panel.type, 'sentence');
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
    <div className="flex flex-none gap-1 overflow-x-auto pb-1 custom-scrollbar" aria-label={t('workbench.panelGrid.chooseInstance')}>
      {instances.map((inst) => {
        const cfg = panel.config[inst.id];
        const isActive = activeInstance?.id === inst.id;
        return (
          <button
            key={inst.id}
            type="button"
            onClick={() => setActiveInstanceId(inst.id)}
            className={`wb-tab inline-flex h-8 max-w-[12rem] flex-none items-center gap-2 px-2.5 text-xs transition-colors ${isActive ? 'wb-tab-active' : ''}`}
          >
            <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ backgroundColor: cfg?.customBaseColor ?? inst.color }} />
            <span className="truncate">{cfg?.customName ?? inst.name}</span>
            <span className={`rounded px-1 py-0.5 text-[10px] ${cfg?.visible ? 'bg-emerald-500/15 text-emerald-200' : 'bg-wb-active text-wb-subtle'}`}>
              {cfg?.visible ? t('common.on') : t('common.off')}
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderSignalBoard = (layout: 'wide' | 'document' = 'wide') => {
    if (panel.type === 'GUYTON_LEFT' || panel.type === 'GUYTON_RIGHT' || panel.type === 'GUYTON_3D') {
      return (
        <div className="flex min-h-[5rem] items-center justify-center rounded bg-wb-strip p-4 text-center">
          <div>
            <div className="text-sm font-bold text-wb-text">{t('workbench.panelGrid.standardGuytonCurve')}</div>
            <div className="mt-1 max-w-md text-xs font-medium leading-5 text-wb-subtle">
              {t('workbench.panelGrid.guytonCurveDescription')}
            </div>
          </div>
        </div>
      );
    }

    if (!activeInstance || !activeCfg) {
      return (
        <div className="flex min-h-[5rem] items-center justify-center rounded bg-wb-strip text-xs font-semibold text-wb-subtle">
          {t('workbench.panelGrid.selectInstanceToConfigure', { source: sourceLabelSentence })}
        </div>
      );
    }

    return (
      <>
        {renderInstancePicker()}
        {panel.type === 'WAVEFORM' && (
          <div className="flex flex-none flex-wrap items-center gap-2">
            <label className="flex h-9 min-w-[13rem] flex-1 items-center gap-2 rounded border border-wb-line/80 bg-wb-input px-2">
              <Search className="h-3.5 w-3.5 flex-none text-wb-subtle" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 rounded bg-transparent text-xs font-semibold text-wb-text outline-none placeholder:text-wb-subtle focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
                placeholder={t('workbench.panelGrid.searchSignals')}
              />
            </label>
            {layout === 'wide' ? (
              <div className="flex flex-wrap gap-1">
                {visibleCategories.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setCategory(chip)}
                    className={`h-7 rounded-full border px-2 text-[10px] font-bold transition-colors ${category === chip ? 'border-wb-line bg-wb-active text-wb-text' : 'border-wb-line bg-wb-strip text-wb-muted hover:text-wb-text'}`}
                  >
                    {signalCategoryLabel(t, chip)}
                  </button>
                ))}
              </div>
            ) : (
              <label className="flex h-9 min-w-[10rem] items-center gap-2 rounded border border-wb-line/80 bg-wb-input px-2">
                <span className="text-[11px] font-medium text-wb-subtle">{t('workbench.panelGrid.type')}</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SignalCategory)}
                  className="min-w-0 flex-1 rounded bg-transparent text-xs font-semibold text-wb-text outline-none focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
                  aria-label={t('workbench.panelGrid.signalCategory')}
                >
                  {visibleCategories.map((chip) => (
                    <option key={chip} value={chip}>{signalCategoryLabel(t, chip)}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}
        <div className="rounded bg-wb-strip p-2">
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
                    className={`rounded px-2 py-1.5 text-left transition-colors ${isSelected ? 'bg-wb-active text-wb-text' : 'bg-wb-strip text-wb-muted hover:bg-wb-input hover:text-wb-text'}`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ backgroundColor: isSelected ? signalColor : 'rgba(100,116,139,0.55)' }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold">{sig}</span>
                        <span className="block truncate text-[10px] font-semibold text-wb-subtle">{meta.label}</span>
                      </span>
                      {panel.type === 'WAVEFORM' && (
                        <span className="rounded bg-wb-input px-1.5 py-0.5 text-[10px] font-medium text-wb-subtle">{signalCategoryLabel(t, meta.category)}</span>
                      )}
                    </div>
                    {meta.unit && <div className="mt-0.5 pl-4 text-[10px] font-semibold text-wb-subtle">{meta.unit}</div>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[5rem] items-center justify-center text-xs font-semibold text-wb-subtle">
              {t('workbench.panelGrid.noMatchingSource', { source: sourceLabelSentence })}
            </div>
          )}
        </div>
      </>
    );
  };

  const renderInstances = () => (
    <div className="rounded bg-wb-strip p-2">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-1.5">
        {instances.map((inst) => {
          const cfg = panel.config[inst.id];
          const selectedCount = cfg?.selectedSignals.length ?? 0;
          return (
            <div key={inst.id} className="rounded bg-wb-strip p-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 flex-none cursor-pointer accent-wb-accent"
                  checked={cfg?.visible || false}
                  onChange={() => togglePaneMembership(panel.id, inst.id)}
                  aria-label={t('workbench.panelGrid.toggleScenarioMembership', { name: inst.name })}
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
                  className="min-w-0 flex-1 rounded border border-wb-line/70 bg-wb-input px-2 py-1 text-xs font-bold text-wb-text outline-none focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
                  value={cfg?.customName ?? inst.name}
                  onChange={(e) => updatePanelInstanceName(panel.id, inst.id, e.target.value)}
                  placeholder={inst.name}
                  aria-label={`${inst.name} graph display name`}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold text-wb-subtle">
                <span>{cfg?.visible ? t('workbench.panelGrid.included') : t('workbench.panelGrid.excluded')}</span>
                <span>{t('workbench.panelGrid.selectedSourceCount', { count: selectedCount, source: sourceLabelSentence })}</span>
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
    const hasPvDebug = panel.type === 'PVLOOP';
    const hasWindow = panel.type === 'WAVEFORM';
    const debugTraceMode = panel.pvDebugTraceMode ?? 'raw';
    return (
      <div className="space-y-2">
        <label className="grid gap-2 rounded bg-wb-strip p-2 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center">
          <span className="text-[11px] font-medium text-wb-subtle">{t('workbench.panelGrid.paneTitle')}</span>
          <input
            type="text"
            value={panel.title}
            onChange={(e) => updatePanelTitle(panel.id, e.target.value)}
            className="h-9 w-full rounded border border-wb-line/70 bg-wb-input px-2 text-sm font-bold text-wb-text outline-none focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
            placeholder={t('workbench.panelGrid.graph')}
          />
        </label>
        <div className="divide-y divide-wb-line rounded bg-wb-strip">
          {hasLegend && (
            <button
              type="button"
              onClick={() => toggleShowLegend(panel.id)}
              className={`flex w-full items-center gap-3 px-2 py-2 text-left transition-colors ${panel.showLegend !== false ? 'text-wb-text' : 'text-wb-muted hover:text-wb-text'}`}
              aria-pressed={panel.showLegend !== false}
            >
              {panel.showLegend !== false ? <Eye className="h-4 w-4 flex-none" /> : <EyeOff className="h-4 w-4 flex-none" />}
              <span>
                <span className="block text-sm font-bold">{t('workbench.panelGrid.legend')}</span>
                <span className="block text-xs font-medium text-wb-subtle">{t('workbench.panelGrid.showGraphLabels')}</span>
              </span>
            </button>
          )}
          {hasGuides && (
            <button
              type="button"
              onClick={() => toggleGuides(panel.id)}
              className={`flex w-full items-center gap-3 px-2 py-2 text-left transition-colors ${panel.showGuides ? 'text-emerald-100' : 'text-wb-muted hover:text-wb-text'}`}
              aria-pressed={Boolean(panel.showGuides)}
            >
              <Tags className="h-4 w-4 flex-none" />
              <span>
                <span className="block text-sm font-bold">{t('workbench.panelGrid.pvLoopGuides')}</span>
                <span className="block text-xs font-medium text-wb-subtle">{t('workbench.panelGrid.referenceOverlays')}</span>
              </span>
            </button>
          )}
          {hasPvDebug && (
            <button
              type="button"
              onClick={() => togglePvDebugOverlay(panel.id)}
              className={`flex w-full items-center gap-3 px-2 py-2 text-left transition-colors ${panel.pvDebugOverlay ? 'text-amber-100' : 'text-wb-muted hover:text-wb-text'}`}
              aria-pressed={Boolean(panel.pvDebugOverlay)}
            >
              <Bug className="h-4 w-4 flex-none" />
              <span>
                <span className="block text-sm font-bold">{t('workbench.panelGrid.pvDebugOverlay')}</span>
                <span className="block text-xs font-medium text-wb-subtle">{t('workbench.panelGrid.pvDebugOverlayDescription')}</span>
              </span>
            </button>
          )}
          {hasPvDebug && panel.pvDebugOverlay && (
            <div className="px-2 py-2">
              <div className="text-[11px] font-medium text-wb-subtle">{t('workbench.panelGrid.pvDebugTraceMode')}</div>
              <div className="mt-2 grid grid-cols-3 gap-1">
                {PV_DEBUG_TRACE_MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updatePvDebugTraceMode(panel.id, mode)}
                    className={`h-8 rounded border px-2 text-xs font-bold transition-colors ${debugTraceMode === mode ? 'border-wb-line-strong bg-wb-active text-wb-text' : 'border-wb-line bg-wb-input text-wb-subtle hover:text-wb-text'}`}
                    aria-pressed={debugTraceMode === mode}
                  >
                    {t(`workbench.panelGrid.pvDebugTraceModes.${mode}`)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {hasWindow && (
            <label className="block px-2 py-2">
              <span className="flex items-center justify-between gap-3">
                <span className="block text-sm font-bold text-wb-text">{t('workbench.panelGrid.waveformTimeWindow')}</span>
                <span className="text-sm font-bold text-wb-text">{(panel.timeWindow || 10000) / 1000}s</span>
              </span>
              <input
                type="range"
                min={2000}
                max={20000}
                step={1000}
                value={panel.timeWindow || 10000}
                onChange={(e) => updateTimeWindow(panel.id, parseFloat(e.target.value))}
                className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-wb-active accent-wb-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
              />
            </label>
          )}
        </div>
        {!hasLegend && !hasGuides && !hasPvDebug && !hasWindow && (
          <div className="px-1 text-xs font-semibold text-wb-subtle">
            {t('workbench.panelGrid.adjacentSectionsConfigurable')}
          </div>
        )}
      </div>
    );
  };

  const renderStyle = () => {
    if (!activeInstance || !activeCfg) {
      return (
        <div className="flex min-h-[5rem] items-center justify-center rounded bg-wb-strip text-xs font-semibold text-wb-subtle">
          {t('workbench.panelGrid.selectInstanceForStyle')}
        </div>
      );
    }
    if (selectedItems.length === 0 || panel.type === 'GUYTON_LEFT' || panel.type === 'GUYTON_RIGHT' || panel.type === 'GUYTON_3D') {
      return (
        <div className="flex min-h-[5rem] items-center justify-center rounded bg-wb-strip p-4 text-center">
          <div>
            <div className="text-sm font-bold text-wb-text">{t('workbench.panelGrid.instanceStylingOnly')}</div>
            <div className="mt-1 max-w-md text-xs font-medium leading-5 text-wb-subtle">
              {t('workbench.panelGrid.instanceStylingDescription', { source: sourceLabelSentence })}
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
        <div className="rounded bg-wb-strip p-2">
          <div className="mb-2 px-1 text-[11px] font-medium text-wb-subtle">{t('workbench.panelGrid.selectedSource', { source: sourceLabel })}</div>
          <div className="space-y-1">
            {selectedItems.map((sig) => (
              <button
                key={sig}
                type="button"
                onClick={() => setFocusedItemId(sig)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-bold transition-colors ${focusedItem === sig ? 'bg-wb-active text-wb-text' : 'bg-wb-strip text-wb-muted hover:text-wb-text'}`}
              >
                <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ backgroundColor: activeCfg.customSignalColors?.[sig] || activeCfg.customBaseColor || activeInstance.color }} />
                <span className="truncate">{activeCfg.customSignalNames?.[sig] || sig}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="rounded bg-wb-strip p-3">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-wb-text">{focusedItem}</div>
              <div className="text-xs font-semibold text-wb-subtle">{meta.label}</div>
            </div>
            <span className="rounded bg-wb-input px-2 py-1 text-[11px] font-medium text-wb-subtle">{signalCategoryLabel(t, meta.category)}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-[6rem_minmax(0,1fr)]">
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-wb-subtle">{t('workbench.panelGrid.color')}</span>
              <input
                type="color"
                className="block h-9 w-full cursor-pointer appearance-none rounded border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-none"
                value={signalColor}
                onChange={(e) => updatePanelSignalColor(panel.id, activeInstance.id, focusedItem, e.target.value)}
                aria-label={`${focusedItem} color`}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-wb-subtle">{t('workbench.panelGrid.label')}</span>
              <input
                type="text"
                className="h-9 w-full rounded border border-wb-line/70 bg-wb-input px-2 text-xs font-semibold text-wb-text outline-none focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
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
    <div className="@container h-full min-h-0 w-full text-wb-text">
      <div className="flex h-full min-h-0 w-full flex-col @min-[760px]:grid @min-[760px]:grid-cols-[minmax(10rem,12rem)_minmax(0,1fr)] @min-[760px]:gap-4">
      <div className="hidden min-h-0 @min-[760px]:block">
        <aside className="h-full min-h-0 overflow-y-auto py-1 pr-1 custom-scrollbar" aria-label={t('workbench.panelGrid.settingsCategories')}>
          <div className="space-y-1">
            {GRAPH_SETTINGS_SECTIONS.map((section) => {
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => jumpToSection(section.id)}
                  className={`block w-full border-l-2 px-3 py-1.5 text-left text-xs font-semibold transition-colors ${activeSection === section.id ? 'border-wb-line-strong text-wb-text' : 'border-transparent text-wb-subtle hover:text-wb-muted'}`}
                >
                  <span className="min-w-0 truncate">{settingsSectionLabel(t, 'graph', section.id)}</span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
      <div ref={settingsScrollRef} onScroll={updateActiveSectionFromScroll} className="min-h-0 w-full flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <div className="mb-3 flex flex-none items-center justify-between gap-3 px-1 pb-1">
          <div className="min-w-0">
            <div className="text-sm font-bold text-wb-text">
              {t(`workbench.panelGrid.paneType.${panel.type === 'PVLOOP' ? 'pvLoop' : panel.type === 'WAVEFORM' ? 'waveform' : panel.type === 'METRICS' ? 'metrics' : 'guyton'}`)}
            </div>
          </div>
          <div className="flex flex-none items-center gap-2 text-[10px] font-bold text-wb-subtle">
            <span>{t('workbench.panelGrid.includedCount', { count: visibleInstanceCount })}</span>
            <span>{t('workbench.panelGrid.selectedCount', { count: selectedItemCount })}</span>
          </div>
        </div>
        {GRAPH_SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <section
              key={section.id}
              ref={(node) => { sectionRefs.current[section.id] = node; }}
              className="relative scroll-mt-2 border-b border-wb-line pb-4 last:border-b-0 last:pb-1"
            >
              <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-wb-line bg-wb-aux px-1 py-1 backdrop-blur">
                <Icon className="h-3.5 w-3.5 text-wb-subtle" />
                <h3 className="text-sm font-bold text-wb-text">{settingsSectionLabel(t, 'graph', section.id)}</h3>
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
  togglePaneMembership,
  updateInstanceSignals,
  updatePanelControllerItems,
  controlGroups,
  controllerAuthoring,
}: PanelSettingsControlsProps) {
  const { t } = useTranslation();
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
    <div className="divide-y divide-wb-line rounded bg-wb-strip">
      {instances.map((inst) => {
        const cfg = panel.config[inst.id];
        const isEnabled = Boolean(cfg?.visible);
        return (
          <div
            key={inst.id}
            className={`grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2 px-2 py-1.5 transition-colors ${isEnabled ? 'text-wb-text' : 'text-wb-subtle'}`}
          >
            <input
              type="checkbox"
              className="h-3.5 w-3.5 cursor-pointer accent-wb-accent"
              checked={isEnabled}
              disabled={!cfg}
              onChange={() => cfg && togglePaneMembership(panel.id, inst.id)}
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
              className="min-w-0 rounded bg-transparent text-xs font-bold text-wb-text outline-none disabled:text-wb-subtle focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
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
    <div className="divide-y divide-wb-line rounded bg-wb-strip">
      {groupOptions.map((group) => {
        const meta = controlGroupMetadata(t, group);
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
                ? 'text-wb-text'
                : isPartial
                  ? 'text-amber-100'
                  : 'text-wb-muted hover:text-wb-text'
            }`}
            aria-pressed={isSelected}
            aria-label={t('workbench.panelGrid.controlGroups.aria', {
              label: meta.label,
              status: isSelected
                ? t('workbench.panelGrid.controlGroups.selectedAll')
                : isPartial
                  ? t('workbench.panelGrid.controlGroups.selectedSome')
                  : t('workbench.panelGrid.controlGroups.notSelected'),
              selected: selectedCount,
              total: configuredCount || instances.length,
            })}
          >
            <span className={`h-3.5 w-3.5 rounded border ${isSelected ? 'border-wb-accent bg-wb-accent' : isPartial ? 'border-amber-300 bg-amber-400/60' : 'border-wb-line-strong bg-wb-panel'}`} />
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold">{meta.label}</span>
              <span className="hidden truncate text-[10px] font-medium text-wb-subtle sm:block">{meta.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderDisplay = () => (
    <div className="divide-y divide-wb-line rounded bg-wb-strip">
      <label className="grid gap-2 px-2 py-2 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center">
        <span className="text-[11px] font-medium text-wb-subtle">{t('workbench.panelGrid.paneTitle')}</span>
        <input
          type="text"
          value={panel.title}
          onChange={(e) => updatePanelTitle(panel.id, e.target.value)}
          className="h-9 w-full rounded border border-wb-line/70 bg-wb-input px-2 text-sm font-bold text-wb-text outline-none focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
          placeholder={t('workbench.panels.controls')}
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
          authoring={controllerAuthoring}
        />
      );
    }
    return renderTargets();
  };

  return (
    <div className="@container h-full min-h-0 w-full text-wb-text">
      <div className="flex h-full min-h-0 w-full flex-col @min-[760px]:grid @min-[760px]:grid-cols-[minmax(10rem,12rem)_minmax(0,1fr)] @min-[760px]:gap-4">
      <div className="hidden min-h-0 @min-[760px]:block">
        <aside className="h-full min-h-0 overflow-y-auto py-1 pr-1 custom-scrollbar" aria-label={t('workbench.panelGrid.controllerSettingsCategories')}>
          <div className="space-y-1">
            {CONTROL_SETTINGS_SECTIONS.map((section) => {
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => jumpToSection(section.id)}
                  className={`block w-full border-l-2 px-3 py-1.5 text-left text-xs font-semibold transition-colors ${activeSection === section.id ? 'border-wb-line-strong text-wb-text' : 'border-transparent text-wb-subtle hover:text-wb-muted'}`}
                >
                  <span className="min-w-0 truncate">{settingsSectionLabel(t, 'control', section.id)}</span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
      <div ref={settingsScrollRef} onScroll={updateActiveSectionFromScroll} className="min-h-0 w-full flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <div className="mb-3 flex flex-none items-center justify-between gap-3 px-1 pb-1">
          <div className="min-w-0">
            <div className="text-sm font-bold text-wb-text">{t('workbench.panelGrid.paneType.controller')}</div>
          </div>
        </div>
        {CONTROL_SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <section
              key={section.id}
              ref={(node) => { sectionRefs.current[section.id] = node; }}
              className="relative scroll-mt-2 border-b border-wb-line pb-4 last:border-b-0 last:pb-1"
            >
              <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-wb-line bg-wb-aux px-1 py-1 backdrop-blur">
                <Icon className="h-3.5 w-3.5 text-wb-subtle" />
                <h3 className="text-sm font-bold text-wb-text">{settingsSectionLabel(t, 'control', section.id)}</h3>
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

function PanelSettingsButton({ panel, toggleSettings }: PanelSettingsButtonProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); toggleSettings(panel.id); }}
      className={`relative z-50 flex h-7 w-7 items-center justify-center rounded border border-wb-line transition-colors ${panel.isSettingsOpen ? 'bg-wb-active text-wb-text' : 'bg-wb-panel text-wb-subtle hover:bg-wb-hover hover:text-wb-muted'}`}
      title={t('workbench.panelGrid.paneSettings')}
      aria-label={t('workbench.panelGrid.paneSettingsAria', { title: panel.title })}
      aria-pressed={panel.isSettingsOpen}
    >
      <Settings className="h-3.5 w-3.5" />
    </button>
  );
}

function settingsPaneTypeLabel(panel: PanelDef): string {
  if (panel.type === 'PVLOOP') return 'PV loop pane';
  if (panel.type === 'WAVEFORM') return 'Waveform pane';
  if (panel.type === 'METRICS') return 'Metrics pane';
  if (panel.type === 'CONTROLS') return 'Controller pane';
  if (panel.type === 'NOTE') return 'Note pane';
  if (panel.type === 'GUYTON_LEFT' || panel.type === 'GUYTON_RIGHT' || panel.type === 'GUYTON_3D') return 'Guyton pane';
  return 'Pane';
}

function paneSettingsFocusRestoreTarget(panel: PanelDef, preferred: HTMLElement | null): HTMLElement | null {
  if (preferred?.isConnected) return preferred;
  if (typeof document === 'undefined') return null;
  const labels = new Set([`${panel.title} pane menu`, `${panel.title} pane settings`]);
  return Array.from(document.querySelectorAll<HTMLElement>('button[aria-label]'))
    .find((node) => labels.has(node.getAttribute('aria-label') ?? '')) ?? null;
}

function PaneSettingsModal({ toggleSettings, ...settingsProps }: PaneSettingsModalProps) {
  const { t } = useTranslation();
  const { panel } = settingsProps;
  const usesBoardSettings = isBoardSettingsPanel(panel.type);
  const titleId = `pane-settings-title-${panel.id}`;
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const latestPanelRef = useRef(panel);
  const close = useCallback(() => toggleSettings(panel.id), [panel.id, toggleSettings]);
  latestPanelRef.current = panel;

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus({ preventScroll: true });
    return () => {
      paneSettingsFocusRestoreTarget(latestPanelRef.current, previousFocusRef.current)
        ?.focus({ preventScroll: true });
    };
  }, [panel.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter((node) => !node.hasAttribute('disabled') && node.tabIndex !== -1);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeElement = document.activeElement;
    if (!focusable.includes(activeElement as HTMLElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/65 p-0 text-wb-text backdrop-blur-sm sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={trapFocus}
        className="flex h-dvh w-full flex-col overflow-hidden bg-wb-panel shadow-2xl sm:h-[min(46rem,calc(100vh-2rem))] sm:max-h-[calc(100vh-2rem)] sm:w-[min(72rem,calc(100vw-2rem))] sm:rounded-lg sm:border sm:border-wb-line"
      >
        <div className="flex h-14 flex-none items-center justify-between gap-3 border-b border-wb-line px-4">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-sm font-bold text-wb-text">{t('workbench.panelGrid.paneSettings')}</h2>
            <div className="truncate text-[11px] font-semibold text-wb-subtle">
              {panel.title} · {settingsPaneTypeLabel(panel)}
            </div>
          </div>
          <div className="flex flex-none items-center gap-2">
            <button
              type="button"
              onClick={close}
              className="inline-flex h-8 items-center justify-center rounded bg-wb-primary px-3 text-xs font-bold text-white transition-colors hover:bg-wb-primary-hover"
            >
              {t('common.done')}
            </button>
            <button
              type="button"
              onClick={close}
              className="inline-flex h-8 w-8 items-center justify-center rounded text-wb-subtle transition-colors hover:bg-wb-hover hover:text-wb-text"
              aria-label={t('workbench.panelGrid.closePaneSettings')}
              title={t('workbench.panelGrid.closeSettings')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className={`min-h-0 flex-1 ${usesBoardSettings ? 'overflow-hidden p-3' : 'overflow-y-auto p-4 custom-scrollbar'}`}>
          {!usesBoardSettings && (
            <div className="mb-3 border-b border-wb-line pb-2 text-[11px] font-medium text-wb-muted">
              {t('workbench.panelGrid.customizations')}
            </div>
          )}
          <PanelSettingsControls {...settingsProps} />
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
}

type ViewEditorState =
  | { mode: 'create'; kind: 'controller' }
  | { mode: 'create'; kind: 'metrics' }
  | { mode: 'edit'; view: ControllerViewSpec | MetricsViewSpec };

type ViewEditorSave =
  | { kind: 'controller'; title: string; items: ControllerItem[] }
  | { kind: 'metrics'; title: string; metrics: MetricType[] };

function ViewSpecEditorModal({
  editor,
  instances,
  activeInstanceId,
  metrics,
  controllerAuthoring,
  onClose,
  onSave,
}: {
  editor: ViewEditorState;
  instances: SimInstance[];
  activeInstanceId: string;
  metrics: MetricType[];
  controllerAuthoring?: ControllerAuthoringCatalog;
  onClose: () => void;
  onSave: (draft: ViewEditorSave) => void;
}) {
  const { t } = useTranslation();
  const existing = editor.mode === 'edit' ? editor.view : undefined;
  const kind = editor.mode === 'edit' ? editor.view.kind : editor.kind;
  const titleId = `view-editor-title-${existing?.id ?? kind}`;
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [title, setTitle] = useState(existing?.title ?? (kind === 'controller' ? t('workbench.viewEditor.newControllerTitle') : t('workbench.viewEditor.newMetricsTitle')));
  const [items, setItems] = useState<ControllerItem[]>(
    existing?.kind === 'controller'
      ? existing.items
      : controllerAuthoring?.defaultItems
        ? controllerAuthoring.defaultItems.map((item) => ({ ...item, ...(item.options ? { options: item.options.map((option) => ({ ...option })) } : {}) }))
        : [],
  );
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>(existing?.kind === 'metrics' ? existing.metrics : []);
  const [metricSearch, setMetricSearch] = useState('');

  useEffect(() => {
    dialogRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const metricSections = useMemo(() => {
    const query = metricSearch.trim().toLowerCase();
    const available = metrics.length > 0 ? metrics : DEFAULT_METRIC_OPTIONS;
    const sections = new Map<string, MetricType[]>();
    for (const metric of available) {
      const meta = signalMetadata(metric);
      const label = meta.label;
      if (query && !metric.toLowerCase().includes(query) && !label.toLowerCase().includes(query)) continue;
      const key = meta.category;
      sections.set(key, [...(sections.get(key) ?? []), metric]);
    }
    return [...sections.entries()];
  }, [metricSearch, metrics]);

  const toggleMetric = (metric: MetricType) => {
    setSelectedMetrics((prev) => prev.includes(metric) ? prev.filter((item) => item !== metric) : [...prev, metric]);
  };

  const moveMetric = (metric: MetricType, direction: -1 | 1) => {
    setSelectedMetrics((prev) => {
      const index = prev.indexOf(metric);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const save = () => {
    const nextTitle = title.trim() || (kind === 'controller' ? t('workbench.viewEditor.newControllerTitle') : t('workbench.viewEditor.newMetricsTitle'));
    if (kind === 'controller') onSave({ kind, title: nextTitle, items });
    else onSave({ kind, title: nextTitle, metrics: selectedMetrics });
  };

  const modal = (
    <div className="fixed inset-0 z-[96] flex items-center justify-center bg-black/65 p-0 text-wb-text backdrop-blur-sm sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="flex h-dvh w-full flex-col overflow-hidden bg-wb-panel shadow-2xl sm:h-[min(46rem,calc(100vh-2rem))] sm:max-h-[calc(100vh-2rem)] sm:w-[min(72rem,calc(100vw-2rem))] sm:rounded-lg sm:border sm:border-wb-line"
      >
        <div className="flex h-14 flex-none items-center justify-between gap-3 border-b border-wb-line px-4">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-sm font-bold text-wb-text">
              {kind === 'controller' ? t('workbench.viewEditor.controllerTitle') : t('workbench.viewEditor.metricsTitle')}
            </h2>
            <div className="truncate text-[11px] font-semibold text-wb-subtle">
              {editor.mode === 'create' ? t('workbench.viewEditor.createMode') : t('workbench.viewEditor.editMode')}
            </div>
          </div>
          <div className="flex flex-none items-center gap-2">
            <button type="button" onClick={save} className="inline-flex h-8 items-center justify-center rounded bg-wb-primary px-3 text-xs font-bold text-white transition-colors hover:bg-wb-primary-hover">
              {t('common.done')}
            </button>
            <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded text-wb-subtle transition-colors hover:bg-wb-hover hover:text-wb-text" aria-label={t('workbench.viewEditor.close')} title={t('workbench.viewEditor.close')}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden p-3">
          <label className="grid gap-1 text-[11px] font-medium text-wb-subtle">
            {t('workbench.viewEditor.name')}
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-9 rounded bg-wb-input px-2.5 text-sm font-semibold normal-case text-wb-text outline-none transition-colors focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
            />
          </label>
          {kind === 'controller' ? (
            <ControllerItemsBuilder
              items={items}
              instances={instances}
              activeInstanceId={activeInstanceId}
              onItemsChange={setItems}
              authoring={controllerAuthoring}
            />
          ) : (
            <div className="grid min-h-0 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <div className="min-h-0 overflow-y-auto pr-4 custom-scrollbar">
                <div className="mb-2 flex h-9 items-center gap-2 border-b border-wb-line px-1">
                  <Search className="h-3.5 w-3.5 text-wb-subtle" />
                  <input
                    value={metricSearch}
                    onChange={(event) => setMetricSearch(event.target.value)}
                    placeholder={t('workbench.viewEditor.searchMetrics')}
                    className="min-w-0 flex-1 rounded bg-transparent text-xs font-medium text-wb-text outline-none placeholder:text-wb-subtle focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
                  />
                </div>
                <div className="space-y-1">
                  {metricSections.map(([category, categoryMetrics]) => (
                    <details key={category} open className="group">
                      <summary className="flex cursor-pointer select-none items-center gap-1.5 py-1.5 text-[11px] font-medium text-wb-subtle transition-colors hover:text-wb-muted [&::-webkit-details-marker]:hidden">
                        <ChevronDown className="h-3 w-3 shrink-0 transition-transform group-open:rotate-0 -rotate-90" />
                        {signalCategoryLabel(t, category as SignalCategory)}
                      </summary>
                      <div className="grid pb-1 sm:grid-cols-2">
	                        {categoryMetrics.map((metric) => {
	                          const selected = selectedMetrics.includes(metric);
                            const label = signalMetadata(metric).label;
	                          return (
	                            <button
	                              key={metric}
	                              type="button"
	                              onClick={() => toggleMetric(metric)}
                                title={`${label} — ${metric}`}
	                              className={`group/entry flex min-h-7 w-full items-center gap-2 rounded px-2 text-left text-xs transition-colors ${
	                                selected
	                                  ? 'text-wb-text'
                                  : 'text-wb-muted hover:bg-wb-hover hover:text-wb-text'
	                              }`}
	                            >
	                              <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
	                              {selected
	                                ? <Check className="h-3 w-3 shrink-0 text-wb-accent" />
                                : <Plus className="h-3.5 w-3.5 shrink-0 text-wb-subtle opacity-0 transition-opacity group-hover/entry:opacity-100" />}
                            </button>
                          );
                        })}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
              <div className="min-h-0 overflow-y-auto pl-4 lg:border-l lg:border-wb-line custom-scrollbar">
                <div className="mb-1 flex h-9 items-center text-[11px] font-medium text-wb-subtle">{t('workbench.viewEditor.selectedMetrics')}</div>
                {selectedMetrics.length === 0 ? (
                  <div className="px-1 py-3 text-xs text-wb-subtle">{t('workbench.viewEditor.noMetrics')}</div>
                ) : (
                  <div className="divide-y divide-wb-line">
                    {selectedMetrics.map((metric, index) => (
                      <div key={metric} className="group/row flex min-h-9 items-center gap-1 px-1">
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-wb-text">{signalMetadata(metric).label}</span>
                        <div className="flex shrink-0 items-center opacity-60 transition-opacity group-hover/row:opacity-100">
                          <button type="button" onClick={() => moveMetric(metric, -1)} disabled={index === 0} className="inline-flex h-7 w-6 items-center justify-center rounded text-wb-subtle transition-colors hover:bg-wb-hover hover:text-wb-text disabled:opacity-25" aria-label={t('workbench.viewEditor.moveUp')}>
                            <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                          </button>
                          <button type="button" onClick={() => moveMetric(metric, 1)} disabled={index === selectedMetrics.length - 1} className="inline-flex h-7 w-6 items-center justify-center rounded text-wb-subtle transition-colors hover:bg-wb-hover hover:text-wb-text disabled:opacity-25" aria-label={t('workbench.viewEditor.moveDown')}>
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => toggleMetric(metric)} className="inline-flex h-7 w-6 items-center justify-center rounded text-wb-subtle transition-colors hover:bg-wb-hover hover:text-wb-danger" aria-label={t('workbench.viewEditor.removeMetric')}>
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
}

type DeleteViewConfirmState = {
  view: AuthoredViewSpec;
  usage: ReturnType<typeof viewRefUsageForDeletion>;
};

function DeleteViewConfirmModal({
  state,
  onCancel,
  onConfirm,
}: {
  state: DeleteViewConfirmState;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const titleId = `view-delete-title-${state.view.id}`;
  const bodyId = `view-delete-body-${state.view.id}`;
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const hasRefs = hasViewRefUsage(state.usage);
  const body = t(hasRefs ? 'workbench.viewManagement.deleteReferencedConfirm' : 'workbench.viewManagement.deleteConfirm', {
    title: state.view.title ?? '',
    noteCount: state.usage.notes.length,
    readingCount: state.usage.reading ? 1 : 0,
  });

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    window.setTimeout(() => cancelButtonRef.current?.focus({ preventScroll: true }), 0);
    return () => {
      if (previousFocusRef.current?.isConnected) previousFocusRef.current.focus({ preventScroll: true });
    };
  }, [state.view.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter((node) => !node.hasAttribute('disabled') && node.tabIndex !== -1);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeElement = document.activeElement;
    if (!focusable.includes(activeElement as HTMLElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-[97] flex items-center justify-center bg-black/65 p-4 text-wb-text backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        onKeyDown={trapFocus}
        className="w-full max-w-md rounded-lg border border-wb-line bg-wb-panel p-4 shadow-2xl"
      >
        <h2 id={titleId} className="text-sm font-bold text-wb-text">{t('workbench.viewManagement.deleteModalTitle')}</h2>
        <p id={bodyId} className="mt-2 text-sm leading-6 text-wb-muted">{body}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="inline-flex h-8 items-center justify-center rounded px-3 text-xs font-bold text-wb-muted transition-colors hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-8 items-center justify-center rounded bg-wb-danger px-3 text-xs font-bold text-white transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
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
  toggleScenarioGlobalVisibility: (id: string) => void;
  resetInstanceKnobs: (id: string) => void;
  addInstance: (sourceId?: string, presetId?: string) => void;
  removeInstance: (id: string) => void;
  timeScale: number;
  setTimeScale: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  togglePlay: () => void;
  addPanel: (type: PanelType, zone?: WorkbenchZoneId) => PanelDef | undefined;
  duplicatePanel: (panelId: string) => PanelDef | undefined;
  removePanel: (id: string) => void;
  updatePanelTitle: (id: string, newTitle: string) => void;
  toggleShowLegend: (id: string) => void;
  updatePanelInstanceColor: (panelId: string, instId: string, newColor: string) => void;
  updatePanelInstanceName: (panelId: string, instId: string, newName: string) => void;
  updatePanelSignalColor: (panelId: string, instId: string, sig: string, newColor: string) => void;
  updatePanelSignalName: (panelId: string, instId: string, sig: string, newName: string) => void;
  toggleSettings: (panelId: string) => void;
  togglePaneMembership: (panelId: string, instId: string) => void;
  updateInstanceSignals: (panelId: string, instId: string, signal: string) => void;
  toggleGuides: (panelId: string) => void;
  updateTimeWindow: (panelId: string, val: number) => void;
  togglePvDebugOverlay: (panelId: string) => void;
  updatePvDebugTraceMode: (panelId: string, mode: PvLoopDebugTraceMode) => void;
  updatePanelControllerItems: (panelId: string, items: ControllerItem[]) => void;
  updatePanelLegendPosition: (panelId: string, pos?: LegendPosition) => void;
  noteCaseKey: string;
  notes: Record<string, NoteContent>;
  authoredViews: readonly AuthoredViewSpec[];
  onNoteChange: (panelId: string, blocks: NoteContent) => void;
  chambers: ChamberId[];
  signals: SignalType[];
  metrics: MetricType[];
  controlGroups: string[];
  canConfigure?: boolean;
  readOnly?: boolean;
  workbenchTheme?: WorkbenchThemeId;
  runtimeRenderer?: WorkbenchRuntimeRenderer;
}

function NoteModeToggleButton({
  noteMode,
  onToggle,
  t,
  className = '',
}: {
  noteMode: 'read' | 'edit';
  onToggle: () => void;
  t: PanelGridT;
  className?: string;
}) {
  const isEditing = noteMode === 'edit';
  const label = isEditing ? t('workbench.panelGrid.switchToPreview') : t('workbench.panelGrid.switchToEdit');
  const Icon = isEditing ? Eye : Pencil;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex h-7 w-7 items-center justify-center rounded text-wb-subtle transition-colors hover:bg-wb-hover hover:text-wb-text ${WB_FOCUS_RING} ${className}`}
      aria-label={label}
      aria-pressed={isEditing}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
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
  toggleScenarioGlobalVisibility,
  resetInstanceKnobs,
  addInstance,
  removeInstance,
  timeScale,
  setTimeScale,
  isPlaying,
  togglePlay,
  addPanel,
  duplicatePanel,
  removePanel,
  updatePanelTitle,
  toggleShowLegend,
  updatePanelInstanceColor,
  updatePanelInstanceName,
  updatePanelSignalColor,
  updatePanelSignalName,
  toggleSettings,
  togglePaneMembership,
  updateInstanceSignals,
  toggleGuides,
  updateTimeWindow,
  togglePvDebugOverlay,
  updatePvDebugTraceMode,
  updatePanelControllerItems,
  updatePanelLegendPosition,
  noteCaseKey,
  notes,
  authoredViews,
  onNoteChange,
  chambers,
  signals,
  metrics,
  controlGroups,
  canConfigure = isEditor,
  readOnly = false,
  workbenchTheme = 'dark',
  runtimeRenderer,
}: PanelCardProps) {
  const { t } = useTranslation();
  const bodyClassName = chromeMode === 'mobile' || chromeMode === 'dockview'
    ? 'relative h-full min-h-16 w-full'
    : `flex-1 min-h-0 w-full relative z-10 ${['WAVEFORM', 'GUYTON_RIGHT', 'GUYTON_LEFT'].includes(panel.type) ? '-mt-6' : ''} ${panel.type === 'PVLOOP' ? 'mb-4' : ''}`;
  const canOpenSettingsFromLegend = chromeMode === 'dockview' && canConfigure;
  const openSettingsFromLegend = canOpenSettingsFromLegend
    ? (panelId: string) => openPanelSettingsIfClosed(panel, panelId, toggleSettings)
    : undefined;
  const changeLegendPosition = canOpenSettingsFromLegend ? updatePanelLegendPosition : undefined;
  const effectiveNoteMode = readOnly ? 'read' : noteMode;
  const dockviewNoteModeSwitch = chromeMode === 'dockview' && panel.type === 'NOTE' && canConfigure ? (
    <div className="flex shrink-0 items-center justify-between border-b border-wb-line bg-wb-strip px-2 py-1">
      <div className="inline-flex items-center gap-1 text-[11px] font-medium text-wb-subtle">
        <FileText className="h-3.5 w-3.5" />
        {t('workbench.panelGrid.note')}
      </div>
      <NoteModeToggleButton
        noteMode={effectiveNoteMode}
        onToggle={() => setNoteModes(prev => ({ ...prev, [panel.id]: noteMode === 'edit' ? 'read' : 'edit' }))}
        t={t}
      />
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
        setActiveInstanceId,
        updateInstanceParams,
        updateInstanceKnobs,
        updateInstanceVolume,
        noteMode: effectiveNoteMode,
        notes,
        authoredViews,
        noteCaseKey,
        onNoteChange,
        noteHeader: dockviewNoteModeSwitch,
        workbenchTheme,
        addInstance,
        removeInstance,
        updateInstanceName,
        updateInstanceColor,
        toggleScenarioGlobalVisibility,
        resetInstanceKnobs,
        readOnly,
        canConfigure: canOpenSettingsFromLegend,
        onOpenSettings: openSettingsFromLegend,
        legendPosition: panel.view?.kind === 'graph' ? panel.view.legendPosition : undefined,
        onLegendPositionChange: changeLegendPosition,
        runtimeRenderer,
      })}
    </div>
  );

  if (chromeMode === 'mobile' || chromeMode === 'dockview') {
    return (
      <div className="group relative h-full min-h-0 w-full overflow-hidden bg-wb-aux">
        {panelBody}
      </div>
    );
  }

  return (
    <div
      className={`relative bg-wb-aux rounded-xl border border-wb-line shadow-sm flex flex-col group transition-all h-full ${panel.isSettingsOpen ? 'z-50' : 'z-10'}`}
    >
      <div className="flex-none px-3 pt-1.5 pb-0 flex justify-between items-center pointer-events-auto rounded-t-xl z-20 relative">
        <div className={`flex-1 flex items-center min-w-0 ${isEditor ? 'panel-grid-drag-handle cursor-move' : ''}`}>
          <span className="text-[11px] font-medium text-wb-subtle select-none flex items-center gap-1.5 transition-colors group-hover:text-wb-muted drop-shadow-md min-w-0">
            {isEditor && <span className="opacity-40">::</span>}
            <span className="truncate">{panel.title}</span>
          </span>
        </div>
        {panel.type === 'NOTE' && canConfigure && (
          <NoteModeToggleButton
            noteMode={effectiveNoteMode}
            onToggle={() => setNoteModes(prev => ({ ...prev, [panel.id]: noteMode === 'edit' ? 'read' : 'edit' }))}
            t={t}
            className="mr-2 h-6 w-6"
          />
        )}
        <div className={`flex items-center gap-1.5 transition-opacity ${panel.isSettingsOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {canConfigure && (
            <PanelSettingsButton
              panel={panel}
              toggleSettings={toggleSettings}
            />
          )}
          {isEditor && (
            <button onClick={() => removePanel(panel.id)} className="inline-flex h-6 w-6 items-center justify-center rounded text-wb-subtle transition-colors hover:bg-wb-hover hover:text-wb-danger" title={t('workbench.panelGrid.closePanel')} aria-label={t('workbench.panelGrid.closePanelAria', { title: panel.title })}>
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {panelBody}
    </div>
  );
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type ResizeSashOrientation = 'vertical' | 'horizontal';

interface ResizeSashProps {
  orientation: ResizeSashOrientation;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  valueFromDrag: (startValue: number, deltaPx: number) => number;
  valueFromKey: (key: string, currentValue: number) => number | undefined;
  getDragStartValue?: () => number | undefined;
  onDoubleClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

function ResizeSash({
  orientation,
  label,
  value,
  min,
  max,
  onChange,
  valueFromDrag,
  valueFromKey,
  getDragStartValue,
  onDoubleClick,
  className = '',
  style,
}: ResizeSashProps) {
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; startValue: number } | null>(null);
  const clampedValue = clamp(value, min, max);
  const isVertical = orientation === 'vertical';

  const commitValue = (nextValue: number) => onChange(clamp(nextValue, min, max));

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation={orientation}
      aria-label={label}
      aria-valuemin={Math.round(min)}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(clampedValue)}
      title={label}
              className={`group flex shrink-0 items-center justify-center bg-wb-strip outline-none transition-colors hover:bg-wb-hover focus-visible:bg-wb-hover focus-visible:ring-1 focus-visible:ring-wb-accent ${
        isVertical ? 'cursor-col-resize' : 'cursor-row-resize'
      } ${className}`}
      style={style}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          startValue: clamp(getDragStartValue?.() ?? clampedValue, min, max),
        };
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        const deltaPx = isVertical ? event.clientX - drag.startX : event.clientY - drag.startY;
        commitValue(valueFromDrag(drag.startValue, deltaPx));
      }}
      onPointerUp={(event) => {
        if (dragRef.current?.pointerId !== event.pointerId) return;
        dragRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={(event) => {
        if (dragRef.current?.pointerId !== event.pointerId) return;
        dragRef.current = null;
      }}
      onLostPointerCapture={() => {
        dragRef.current = null;
      }}
      onKeyDown={(event) => {
        const nextValue = valueFromKey(event.key, clampedValue);
        if (nextValue === undefined) return;
        event.preventDefault();
        commitValue(nextValue);
      }}
      onDoubleClick={(event) => {
        if (!onDoubleClick) return;
        event.preventDefault();
        onDoubleClick();
      }}
    >
      <span
        aria-hidden="true"
        className={`rounded-full bg-wb-active transition-colors group-hover:bg-wb-accent group-focus-visible:bg-wb-accent ${
          isVertical ? 'h-10 w-px' : 'h-px w-10'
        }`}
      />
    </div>
  );
}

function ZoneShell({
  zone,
  panels,
  mode,
  layoutKey,
  viewState,
  onViewStateChange,
  graphBoardLayout,
  onGraphBoardLayoutChange,
  addPanel,
  duplicatePanel,
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
  layoutKey?: string;
  viewState?: DockviewViewState;
  onViewStateChange?: (zone: WorkbenchZoneId, viewState: DockviewViewState) => void;
  graphBoardLayout?: GraphBoardLayout;
  onGraphBoardLayoutChange?: (layout: GraphBoardLayout | undefined) => void;
  addPanel: (type: PanelType, zone?: WorkbenchZoneId) => PanelDef | undefined;
  duplicatePanel: (panelId: string) => PanelDef | undefined;
  removePanel: (id: string) => void;
  updatePanelTitle: (id: string, newTitle: string) => void;
  toggleSettings: (panelId: string) => void;
  renderPanel: (panel: PanelDef) => React.ReactNode;
  getPanelTitle: (panel: PanelDef) => string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { t } = useTranslation();
  return (
    <section className={`workbench-zone-main flex min-h-0 flex-col overflow-hidden bg-wb-aux ${className}`} style={style} aria-label={t('workbench.panelGrid.zoneAria', { zone: t(`workbench.zones.${zone}`) })}>
      <WorkbenchDockview
        panels={panels}
        zone={zone}
        mode={mode}
        layoutKey={`${layoutKey ?? 'default'}:${zone}`}
        viewState={viewState}
        onViewStateChange={(next) => onViewStateChange?.(zone, next)}
        graphBoardLayout={graphBoardLayout}
        onGraphBoardLayoutChange={onGraphBoardLayoutChange}
        onRemovePanel={removePanel}
        onToggleSettings={toggleSettings}
        onRenamePanel={updatePanelTitle}
        onAddPanel={addPanel}
        onDuplicatePanel={duplicatePanel}
        getPanelTitle={getPanelTitle}
        className={`workbench-dockview workbench-dockview-${zone} flex-1`}
        renderPanel={renderPanel}
      />
    </section>
  );
}

export function PanelGrid({
  instances,
  panels,
  layoutState,
  onLayoutStateChange,
  dockviewLayoutKey,
  mainDockviewViewState,
  onDockviewViewStateChange,
  graphBoardLayout,
  onGraphBoardLayoutChange,
  workbenchTheme = 'dark',
  authoredViews = [],
  reading,
  createControllerView,
  createMetricsView,
  updateAuthoredView,
  renameAuthoredView,
  restoreStandardViews,
  duplicateAuthoredView,
  deleteAuthoredView,
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
  toggleScenarioGlobalVisibility,
  resetInstanceKnobs,
  addInstance,
  removeInstance,
  timeScale,
  setTimeScale,
  isPlaying,
  togglePlay,
  addPanel,
  duplicatePanel,
  removePanel,
  updatePanelTitle,
  toggleShowLegend,
  updatePanelInstanceColor,
  updatePanelInstanceName,
  updatePanelSignalColor,
  updatePanelSignalName,
  toggleSettings,
  togglePaneMembership,
  updateInstanceSignals,
  toggleGuides,
  updateTimeWindow,
  togglePvDebugOverlay,
  updatePvDebugTraceMode,
  updatePanelControllerItems,
  updatePanelLegendPosition,
  noteCaseKey,
  notes,
  onNoteChange,
  chambers,
  signals,
  metrics,
  controlGroups,
  runtimeRenderer,
  controllerAuthoring,
  scenarioPresetCatalog,
}: PanelGridProps) {
  const { t } = useTranslation();
  const isReadOnly = mode === 'learner';
  const presenterPanels = useMemo(() => flowPack(panels), [panels]);
  const mainGraphPanels = useMemo(() => graphPanelsOnly(presenterPanels), [presenterPanels]);
  const notePanel = useMemo(() => firstPanelOfType(presenterPanels, 'NOTE'), [presenterPanels]);
  const authoredControllerViews = useMemo(() => controllerViews(authoredViews), [authoredViews]);
  const authoredMetricViews = useMemo(() => metricsViews(authoredViews), [authoredViews]);
  const metricsViewsById = useMemo(() => new Map(authoredMetricViews.map((view) => [view.id, view])), [authoredMetricViews]);
  const [metricsPanelBindings, setMetricsPanelBindings] = useState<MetricsDockviewPanelBinding[]>([]);
  const syncedMetricsPanelBindings = useMemo(
    () => syncMetricsDockviewPanelBindings(metricsPanelBindings, authoredMetricViews),
    [authoredMetricViews, metricsPanelBindings],
  );
  const syncedMetricsPanelBindingSignature = metricsPanelBindingSignature(syncedMetricsPanelBindings);
  const metricsDockviewPanels = useMemo(
    () => metricsBindingsToDockviewPanels(syncedMetricsPanelBindings, authoredMetricViews),
    [authoredMetricViews, syncedMetricsPanelBindingSignature],
  );
  const metricsDockviewPanelsById = useMemo(() => new Map(metricsDockviewPanels.map((panel) => [panel.id, panel])), [metricsDockviewPanels]);
  const [metricsDockviewViewState, setMetricsDockviewViewState] = useState<DockviewViewState | undefined>(undefined);
  const [openControllerMenu, setOpenControllerMenu] = useState(false);
  const [renamingViewId, setRenamingViewId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [viewEditor, setViewEditor] = useState<ViewEditorState | null>(null);
  const [deleteViewConfirm, setDeleteViewConfirm] = useState<DeleteViewConfirmState | null>(null);
  const [scenarioAddMenuPosition, setScenarioAddMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const requestedControllerViewId = layoutState.selectedControllerViewId;
  const selectedControllerView = authoredControllerViews.find((view) => view.id === requestedControllerViewId) ?? authoredControllerViews[0];
  const selectedControllerEntryId = selectedControllerView?.id;
  useEffect(() => {
    if (!requestedControllerViewId || authoredControllerViews.some((view) => view.id === requestedControllerViewId)) return;
    onLayoutStateChange((prev) => ({ ...prev, selectedControllerViewId: undefined }));
  }, [authoredControllerViews, onLayoutStateChange, requestedControllerViewId]);
  useEffect(() => {
    setMetricsPanelBindings((prev) => (
      metricsPanelBindingSignature(prev) === syncedMetricsPanelBindingSignature ? prev : syncedMetricsPanelBindings
    ));
  }, [syncedMetricsPanelBindingSignature, syncedMetricsPanelBindings]);
  useEffect(() => {
    if (!renamingViewId || authoredViews.some((view) => view.id === renamingViewId)) return;
    setRenamingViewId(null);
    setRenameDraft('');
  }, [authoredViews, renamingViewId]);
  const hasCaseRail = Boolean(notePanel && layoutState.noteOpen);

  const getPanelTitle = useCallback(getDockviewPaneTitle, []);
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
      toggleScenarioGlobalVisibility={toggleScenarioGlobalVisibility}
      resetInstanceKnobs={resetInstanceKnobs}
      addInstance={addInstance}
      removeInstance={removeInstance}
      timeScale={timeScale}
      setTimeScale={setTimeScale}
      isPlaying={isPlaying}
      togglePlay={togglePlay}
      addPanel={addPanel}
      duplicatePanel={duplicatePanel}
      removePanel={removePanel}
      updatePanelTitle={updatePanelTitle}
      toggleShowLegend={toggleShowLegend}
      updatePanelInstanceColor={updatePanelInstanceColor}
      updatePanelInstanceName={updatePanelInstanceName}
      updatePanelSignalColor={updatePanelSignalColor}
      updatePanelSignalName={updatePanelSignalName}
      toggleSettings={toggleSettings}
      togglePaneMembership={togglePaneMembership}
      updateInstanceSignals={updateInstanceSignals}
      toggleGuides={toggleGuides}
      updateTimeWindow={updateTimeWindow}
      togglePvDebugOverlay={togglePvDebugOverlay}
      updatePvDebugTraceMode={updatePvDebugTraceMode}
      updatePanelControllerItems={updatePanelControllerItems}
      updatePanelLegendPosition={updatePanelLegendPosition}
      noteCaseKey={noteCaseKey}
      notes={notes}
      authoredViews={authoredViews}
      onNoteChange={onNoteChange}
      chambers={chambers}
      signals={signals}
      metrics={metrics}
      controlGroups={controlGroups}
      canConfigure={mode !== 'learner'}
      readOnly={isReadOnly}
      workbenchTheme={workbenchTheme}
      runtimeRenderer={runtimeRenderer}
    />
  );

  const activeSettingsPanel = mode === 'learner'
    ? undefined
    : mainGraphPanels.find((panel) => panel.isSettingsOpen);
  const paneSettingsModal = activeSettingsPanel ? (
    <PaneSettingsModal
      panel={activeSettingsPanel}
      instances={instances}
      activeInstanceId={activeInstanceId}
      updatePanelTitle={updatePanelTitle}
      toggleShowLegend={toggleShowLegend}
      updatePanelInstanceColor={updatePanelInstanceColor}
      updatePanelInstanceName={updatePanelInstanceName}
      updatePanelSignalColor={updatePanelSignalColor}
      updatePanelSignalName={updatePanelSignalName}
      toggleSettings={toggleSettings}
      togglePaneMembership={togglePaneMembership}
      updateInstanceSignals={updateInstanceSignals}
      toggleGuides={toggleGuides}
      updateTimeWindow={updateTimeWindow}
      togglePvDebugOverlay={togglePvDebugOverlay}
      updatePvDebugTraceMode={updatePvDebugTraceMode}
      updatePanelControllerItems={updatePanelControllerItems}
      chambers={chambers}
      signals={signals}
      metrics={metrics}
      controlGroups={controlGroups}
      controllerAuthoring={controllerAuthoring}
    />
  ) : null;
  const viewEditorModal = !isReadOnly && viewEditor ? (
    <ViewSpecEditorModal
      editor={viewEditor}
      instances={instances}
      activeInstanceId={activeInstanceId}
      metrics={metrics}
      controllerAuthoring={controllerAuthoring}
      onClose={() => setViewEditor(null)}
      onSave={(draft) => {
        if (viewEditor.mode === 'edit') {
          const source = viewEditor.view;
          if (draft.kind === 'controller') {
            updateAuthoredView(controllerAuthoring && source.kind === 'controller'
              ? { ...source, title: draft.title, items: draft.items }
              : createControllerViewSpec(source.id, draft.title, draft.items));
          } else {
            updateAuthoredView(createMetricsViewSpec(source.id, draft.title, draft.metrics, instances, source.kind === 'metrics' ? source.membership : undefined));
          }
        } else if (draft.kind === 'controller') {
          const view = createControllerView(draft.title, draft.items);
          onLayoutStateChange((prev) => ({ ...prev, selectedControllerViewId: view.id }));
        } else {
          createMetricsView(draft.title, draft.metrics);
        }
        setViewEditor(null);
      }}
    />
  ) : null;
  const deleteViewConfirmModal = !isReadOnly && deleteViewConfirm ? (
    <DeleteViewConfirmModal
      state={deleteViewConfirm}
      onCancel={() => setDeleteViewConfirm(null)}
      onConfirm={confirmDeleteView}
    />
  ) : null;

  const rightRailWidth = clamp(layoutState.controlsWidth, 280, 460);
  const noteWidth = hasCaseRail ? clamp(layoutState.caseRailWidth, 280, 560) : 0;
  const metricsHeight = layoutState.metricsOpen ? clamp(layoutState.outputHeight, 120, 400) : 0;
  const hasRightRail = layoutState.rightRailVisible;
  const columnTracks: string[] = [];
  let nextGridColumn = 1;
  const noteColumn = hasCaseRail ? String(nextGridColumn++) : undefined;
  if (hasCaseRail) columnTracks.push(`${noteWidth}px`, '6px');
  if (hasCaseRail) nextGridColumn += 1;
  const noteSashColumn = hasCaseRail ? String(Number(noteColumn) + 1) : undefined;
  const mainColumn = String(nextGridColumn++);
  columnTracks.push('minmax(320px,1fr)');
  const rightRailSashColumn = hasRightRail ? String(nextGridColumn++) : undefined;
  if (hasRightRail) columnTracks.push('6px');
  const rightRailColumn = hasRightRail ? String(nextGridColumn++) : undefined;
  if (hasRightRail) columnTracks.push(`${rightRailWidth}px`);
  const gridTemplateColumns = columnTracks.join(' ');
  const gridTemplateRows = layoutState.metricsOpen ? `minmax(0,1fr) 6px ${metricsHeight}px` : 'minmax(0,1fr)';
  const auxiliaryGridRow = layoutState.metricsOpen && layoutState.metricsSpan === 'main' ? '1 / 4' : '1';
  const metricsGridColumn = layoutState.metricsSpan === 'full' ? '1 / -1' : mainColumn;
  const metricsSashGridColumn = metricsGridColumn;
  const scenarioListMaxRatio = clamp(layoutState.scenarioListMaxRatio ?? 0.4, 0.25, 0.65);
  const scenarioListExpandedMinHeight = 36 + 16 + 32;
  const scenarioInspectorMinHeight = 160;
  const rightRailRef = useRef<HTMLDivElement | null>(null);
  const scenarioListTierRef = useRef<HTMLDivElement | null>(null);
  const rightRailHeight = rightRailRef.current?.getBoundingClientRect().height;
  const scenarioListExplicitMaxHeight = rightRailHeight
    ? Math.max(scenarioListExpandedMinHeight, rightRailHeight - scenarioInspectorMinHeight)
    : undefined;
  const scenarioListExplicitHeight = layoutState.scenarioListHeightPx === undefined
    ? undefined
    : clamp(
      layoutState.scenarioListHeightPx,
      scenarioListExpandedMinHeight,
      scenarioListExplicitMaxHeight ?? Math.max(layoutState.scenarioListHeightPx, scenarioListExpandedMinHeight),
    );
  const scenarioListTierStyle: React.CSSProperties = layoutState.scenarioListCollapsed
    ? { height: 36, minHeight: 36, maxHeight: 36 }
    : scenarioListExplicitHeight === undefined
      ? {
          minHeight: scenarioListExpandedMinHeight,
          maxHeight: `calc(100% * ${scenarioListMaxRatio})`,
        }
      : {
          height: scenarioListExplicitHeight,
          minHeight: scenarioListExpandedMinHeight,
          maxHeight: scenarioListExplicitMaxHeight,
          flex: '0 0 auto',
        };
  const scenarioListResizeMax = scenarioListExplicitMaxHeight ?? 10000;
  const scenarioListResizeValue = scenarioListExplicitHeight
    ?? scenarioListTierRef.current?.getBoundingClientRect().height
    ?? scenarioListExpandedMinHeight;
  const selectedControllerTargetId = selectedControllerView
    ? resolveControllerTargetId(selectedControllerView.binding, activeInstanceId, instances)
    : activeInstanceId;
  const activeInstance = instances.find((instance) => instance.id === selectedControllerTargetId);
  const inspectorInstances = instances.map((instance) => (
    instance.id === selectedControllerTargetId ? { ...instance, isVisible: true } : instance
  ));
  const inspectorConfig = selectedControllerTargetId
    ? { [selectedControllerTargetId]: { visible: true, selectedSignals: ['clinical'] } }
    : {};
  const noteMode = notePanel && !isReadOnly ? (noteModes[notePanel.id] ?? 'read') : 'read';
  const noteHeader = notePanel ? (
    <div className="flex shrink-0 items-center justify-between border-b border-wb-line bg-wb-strip px-2 py-1">
      <div className="inline-flex items-center gap-1 text-[11px] font-medium text-wb-subtle">
        <FileText className="h-3.5 w-3.5" />
        {t('workbench.panelGrid.note')}
      </div>
      {!isReadOnly && (
        <NoteModeToggleButton
          noteMode={noteMode}
          onToggle={() => setNoteModes(prev => ({ ...prev, [notePanel.id]: noteMode === 'edit' ? 'read' : 'edit' }))}
          t={t}
        />
      )}
    </div>
  ) : null;

  const selectControllerEntry = (id: string) => {
    onLayoutStateChange((prev) => ({ ...prev, selectedControllerViewId: id }));
    setOpenControllerMenu(false);
  };

  const openScenarioAddMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setScenarioAddMenuPosition((position) => (
      position
        ? null
        : getScenarioPresetMenuPosition(rect.right - 208, rect.bottom + 4)
    ));
  };

  const beginRenameView = (view: AuthoredViewSpec) => {
    if (isReadOnly) return;
    setRenamingViewId(view.id);
    setRenameDraft(view.title ?? '');
  };

  const commitRenameView = (view: AuthoredViewSpec) => {
    const nextTitle = renameDraft.trim();
    if (nextTitle && nextTitle !== view.title) {
      renameAuthoredView(view.id, nextTitle);
    }
    setRenamingViewId(null);
    setRenameDraft('');
  };

  const cancelRenameView = () => {
    setRenamingViewId(null);
    setRenameDraft('');
  };

  const duplicateView = (view: AuthoredViewSpec) => {
    if (isReadOnly) return;
    const copy = duplicateAuthoredView(view.id);
    if (!copy) return;
    if (copy.kind === 'controller') {
      onLayoutStateChange((prev) => ({ ...prev, selectedControllerViewId: copy.id }));
    }
  };

  const requestDeleteView = (view: AuthoredViewSpec): boolean => {
    if (isReadOnly) return false;
    const usage = viewRefUsageForDeletion(view.id, notes, reading);
    setDeleteViewConfirm({ view, usage });
    return false;
  };

  function confirmDeleteView() {
    if (!deleteViewConfirm) return;
    const { view } = deleteViewConfirm;
    deleteAuthoredView(view.id);
    if (view.kind === 'metrics') {
      setMetricsPanelBindings((prev) => prev.filter((binding) => binding.viewId !== view.id));
    } else if (view.kind === 'controller' && selectedControllerEntryId === view.id) {
      onLayoutStateChange((prev) => ({ ...prev, selectedControllerViewId: undefined }));
    }
    setDeleteViewConfirm(null);
    setOpenControllerMenu(false);
  }

  const metricsSourceViewIdForPanelId = (panelId: string): string => metricsDockviewPanelsById.get(panelId)?.sourceViewId ?? panelId;

  const editMetricsPanel = (panelId: string) => {
    if (isReadOnly) return;
    const view = metricsViewsById.get(metricsSourceViewIdForPanelId(panelId));
    if (view) setViewEditor({ mode: 'edit', view });
  };

  const renameMetricsPanel = (panelId: string, title: string) => {
    if (isReadOnly) return;
    renameAuthoredView(metricsSourceViewIdForPanelId(panelId), title);
  };

  const duplicateMetricsPanel = (panelId: string): PanelDef | undefined => {
    if (isReadOnly) return undefined;
    const copy = duplicateAuthoredView(metricsSourceViewIdForPanelId(panelId));
    if (copy?.kind !== 'metrics') return undefined;
    setMetricsPanelBindings((prev) => [...prev, { panelId: copy.id, viewId: copy.id }]);
    return metricsViewToDockviewPanel(copy);
  };

  const mirrorMetricsPanel = (panelId: string): PanelDef | undefined => {
    if (isReadOnly) return undefined;
    const viewId = metricsSourceViewIdForPanelId(panelId);
    const view = metricsViewsById.get(viewId);
    if (!view) return undefined;
    const usedPanelIds = new Set(metricsDockviewPanels.map((panel) => panel.id));
    const mirrorPanelId = nextMetricsMirrorPanelId(viewId, usedPanelIds);
    setMetricsPanelBindings((prev) => [...prev, { panelId: mirrorPanelId, viewId }]);
    return metricsViewToDockviewPanel(view, mirrorPanelId);
  };

  const deleteMetricsPanel = (panelId: string): boolean => {
    if (isReadOnly) return false;
    const viewId = metricsSourceViewIdForPanelId(panelId);
    const view = metricsViewsById.get(viewId);
    if (!view) return false;
    const panelsForView = metricsDockviewPanels.filter((panel) => panel.sourceViewId === viewId);
    if (panelsForView.length > 1) {
      setMetricsPanelBindings((prev) => prev.filter((binding) => binding.panelId !== panelId));
      return true;
    }
    return requestDeleteView(view);
  };

  const getMetricsPanelCloseBehavior = (panelId: string): 'close' | 'delete' => {
    const viewId = metricsSourceViewIdForPanelId(panelId);
    return metricsDockviewPanels.filter((panel) => panel.sourceViewId === viewId).length > 1 ? 'close' : 'delete';
  };

  const renderMetricsDockviewPanel = (panel: PanelDef) => {
    const view = metricsViewsById.get(panel.sourceViewId ?? panel.id);
    if (!view) {
      return (
        <WorkbenchEmptyState
          description={t('workbench.dockview.panelUnavailable')}
        />
      );
    }
    const runtimeBody = runtimeRenderer?.renderAuthoredView(view, {
      instances,
      activeInstanceId,
      presentationMode: 'studio',
    });
    return (
      <div className="relative h-full min-h-0 overflow-hidden">
        {runtimeBody ?? (
          <React.Suspense fallback={<div className="h-full bg-wb-aux" />}>
            <LegacyMetricsPanel
              physicsRefs={physicsRefs}
              instances={instances}
              config={effectiveGlobalConfig(metricsViewConfig(view, instances), instances)}
            />
          </React.Suspense>
        )}
      </div>
    );
  };

  const renderMetricsEmptyState = () => (
    <WorkbenchEmptyState
      description={t('workbench.viewManagement.metricsEmptyHint')}
      primaryAction={isReadOnly ? undefined : {
        label: t('workbench.viewManagement.newMetricsShort'),
        onClick: () => setViewEditor({ mode: 'create', kind: 'metrics' }),
        icon: <Plus className="h-3.5 w-3.5" />,
        ariaLabel: t('workbench.viewManagement.newMetrics'),
      }}
      secondaryAction={isReadOnly ? undefined : {
        label: t('workbench.viewManagement.restoreStandard'),
        onClick: restoreStandardViews,
        icon: <RotateCcw className="h-3.5 w-3.5" />,
      }}
    />
  );

  if (isMobile) {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-wb-panel p-2">
        <WorkbenchMobile
          panels={presenterPanels}
          title="Workbench"
          className="min-h-0 flex-1"
          renderPanel={(panel) => renderPanel(panel, false, 'mobile')}
        />
        {paneSettingsModal}
        {viewEditorModal}
        {deleteViewConfirmModal}
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-wb-panel p-0">
        <div
          className="grid min-h-0 flex-1 gap-0 overflow-hidden"
          style={{ gridTemplateColumns, gridTemplateRows }}
        >
          {hasCaseRail && notePanel && (
            <section
              className="workbench-zone-aux flex min-h-0 flex-col overflow-hidden border-r border-wb-line bg-wb-aux"
              style={{ gridColumn: noteColumn, gridRow: auxiliaryGridRow }}
              aria-label={t('workbench.panelGrid.noteDrawer')}
            >
              {renderPaneBody(notePanel, {
                instances,
                physicsRefs,
                instanceHealth,
                steadyUpdateStatuses,
                activeInstanceId,
                setActiveInstanceId,
                updateInstanceParams,
                updateInstanceKnobs,
                updateInstanceVolume,
                noteMode,
                notes,
                authoredViews,
                noteCaseKey,
                onNoteChange,
                noteHeader,
                workbenchTheme,
                addInstance,
                removeInstance,
                updateInstanceName,
                updateInstanceColor,
                toggleScenarioGlobalVisibility,
                resetInstanceKnobs,
                readOnly: isReadOnly,
                runtimeRenderer,
              })}
            </section>
          )}
          {hasCaseRail && noteSashColumn && (
            <ResizeSash
              orientation="vertical"
              label={t('workbench.panelGrid.resizeNoteDrawer')}
              value={noteWidth}
              min={280}
              max={560}
              onChange={(caseRailWidth) => onLayoutStateChange((prev) => ({ ...prev, caseRailWidth }))}
              valueFromDrag={(startValue, deltaPx) => startValue + deltaPx}
              valueFromKey={(key, currentValue) => {
                if (key === 'ArrowLeft') return currentValue - 10;
                if (key === 'ArrowRight') return currentValue + 10;
                return undefined;
              }}
              className="min-h-0"
              style={{ gridColumn: noteSashColumn, gridRow: auxiliaryGridRow }}
            />
          )}
          <ZoneShell
            zone="main"
            panels={mainGraphPanels}
            mode={mode}
            layoutKey={dockviewLayoutKey}
            viewState={mainDockviewViewState}
            onViewStateChange={onDockviewViewStateChange}
            graphBoardLayout={graphBoardLayout}
            onGraphBoardLayoutChange={onGraphBoardLayoutChange}
            addPanel={addPanel}
            removePanel={removePanel}
            updatePanelTitle={updatePanelTitle}
            toggleSettings={toggleSettings}
            duplicatePanel={duplicatePanel}
            className=""
            style={{ gridColumn: mainColumn, gridRow: '1' }}
            getPanelTitle={getPanelTitle}
            renderPanel={(panel) => renderPanel(panel, false, 'dockview')}
          />
          {hasRightRail && rightRailSashColumn && (
            <ResizeSash
              orientation="vertical"
              label={t('workbench.panelGrid.resizeRightRail')}
              value={rightRailWidth}
              min={280}
              max={460}
              onChange={(controlsWidth) => onLayoutStateChange((prev) => ({ ...prev, controlsWidth }))}
              valueFromDrag={(startValue, deltaPx) => startValue - deltaPx}
              valueFromKey={(key, currentValue) => {
                if (key === 'ArrowLeft') return currentValue + 10;
                if (key === 'ArrowRight') return currentValue - 10;
                return undefined;
              }}
              className="min-h-0"
              style={{ gridColumn: rightRailSashColumn, gridRow: auxiliaryGridRow }}
            />
          )}
          {hasRightRail && (
            <section
              ref={rightRailRef}
              className="workbench-zone-aux flex min-h-0 flex-col overflow-hidden bg-wb-aux"
              style={{ gridColumn: rightRailColumn, gridRow: auxiliaryGridRow }}
              aria-label={t('workbench.panelGrid.railAria')}
            >
              <div
                ref={scenarioListTierRef}
                className="flex min-h-0 shrink-0 flex-col overflow-hidden"
                style={scenarioListTierStyle}
              >
                <div className="group flex h-9 shrink-0 items-center bg-wb-strip px-2 text-xs font-bold text-wb-muted transition-colors hover:bg-wb-input hover:text-wb-text">
                  <button
                    type="button"
                    onClick={() => onLayoutStateChange((prev) => ({ ...prev, scenarioListCollapsed: !prev.scenarioListCollapsed }))}
                    className={`flex h-full min-w-0 flex-1 items-center gap-2 text-left ${WB_FOCUS_RING}`}
                    aria-expanded={!layoutState.scenarioListCollapsed}
                  >
                    {layoutState.scenarioListCollapsed ? <ChevronRight className="h-3.5 w-3.5 text-wb-subtle" /> : <ChevronDown className="h-3.5 w-3.5 text-wb-subtle" />}
                    <span className="min-w-0 flex-1 truncate">{t('workbench.panelGrid.scenariosCount', { count: instances.length })}</span>
                  </button>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={openScenarioAddMenu}
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-wb-subtle opacity-70 transition-colors hover:bg-wb-hover hover:text-wb-text group-hover:opacity-100 ${WB_FOCUS_RING}`}
                      title={t('workbench.scenarioPane.addScenario')}
                      aria-label={t('workbench.scenarioPane.addScenario')}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {scenarioAddMenuPosition && !isReadOnly && (
                    <ScenarioPresetMenu
                      position={scenarioAddMenuPosition}
                      presets={scenarioPresetCatalog}
                      onClose={() => setScenarioAddMenuPosition(null)}
                      onSelect={(presetId) => {
                        addInstance(undefined, presetId);
                        setScenarioAddMenuPosition(null);
                      }}
                    />
                  )}
                </div>
                {!layoutState.scenarioListCollapsed && (
                  <div className="flex min-h-0 flex-1 overflow-hidden">
                    <ScenarioPane
                      instances={instances}
                      addInstance={addInstance}
                      removeInstance={removeInstance}
                      updateInstanceName={updateInstanceName}
                      updateInstanceColor={updateInstanceColor}
                      activeInstanceId={activeInstanceId}
                      setActiveInstanceId={setActiveInstanceId}
                      toggleScenarioGlobalVisibility={toggleScenarioGlobalVisibility}
                      resetInstanceKnobs={resetInstanceKnobs}
                      steadyUpdateStatuses={steadyUpdateStatuses}
                      readOnly={isReadOnly}
                    />
                  </div>
                )}
              </div>
              {!layoutState.scenarioListCollapsed && (
                <ResizeSash
                  orientation="horizontal"
                  label={t('workbench.panelGrid.resizeScenarioList')}
                  value={scenarioListResizeValue}
                  min={scenarioListExpandedMinHeight}
                  max={scenarioListResizeMax}
                  onChange={(scenarioListHeightPx) => onLayoutStateChange((prev) => {
                    const railHeight = rightRailRef.current?.getBoundingClientRect().height;
                    const maxHeight = railHeight
                      ? Math.max(scenarioListExpandedMinHeight, railHeight - scenarioInspectorMinHeight)
                      : Math.max(scenarioListHeightPx, scenarioListExpandedMinHeight);
                    return {
                      ...prev,
                      scenarioListCollapsed: false,
                      scenarioListHeightPx: clamp(scenarioListHeightPx, scenarioListExpandedMinHeight, maxHeight),
                    };
                  })}
                  valueFromDrag={(startValue, deltaPx) => startValue + deltaPx}
                  valueFromKey={(key, currentValue) => {
                    if (key === 'ArrowUp') return currentValue - 10;
                    if (key === 'ArrowDown') return currentValue + 10;
                    return undefined;
                  }}
                  getDragStartValue={() => scenarioListTierRef.current?.getBoundingClientRect().height}
                  onDoubleClick={() => onLayoutStateChange((prev) => ({
                    ...prev,
                    scenarioListCollapsed: false,
                    scenarioListHeightPx: undefined,
                  }))}
                  className="h-2"
                />
              )}
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="relative flex h-9 shrink-0 items-center gap-2 bg-wb-strip px-2">
                  <button
                    type="button"
                    onClick={() => setOpenControllerMenu((open) => !open)}
                    className={`inline-flex min-w-0 flex-1 items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs font-bold text-wb-muted transition-colors hover:bg-wb-hover hover:text-wb-text ${WB_FOCUS_RING}`}
                    aria-expanded={openControllerMenu}
                  >
                    <span className="min-w-0 truncate">
                      {selectedControllerView ? selectedControllerView.title : t('workbench.viewManagement.noControllerViews')}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-wb-subtle" />
                  </button>
                  {activeInstance && selectedControllerView && !isReadOnly && (
                    <button
                      type="button"
                      onClick={() => setViewEditor({ mode: 'edit', view: selectedControllerView })}
                      className={`ml-auto inline-flex min-w-0 cursor-pointer items-center gap-1.5 rounded border border-wb-line bg-wb-panel px-2 py-0.5 text-[10px] font-semibold text-wb-muted transition-colors hover:border-wb-line-strong hover:bg-wb-hover hover:text-wb-text ${WB_FOCUS_RING}`}
                      title={t('common.edit')}
                    >
                      {t('workbench.panelGrid.editingScenario')}
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: activeInstance.color }} />
                      <span className="min-w-0 max-w-28 truncate text-wb-text">{activeInstance.name}</span>
                    </button>
                  )}
                  {openControllerMenu && (
                    <div className="absolute left-2 right-2 top-10 z-40 rounded border border-wb-line bg-wb-panel p-1 shadow-2xl">
                      {authoredControllerViews.length === 0 && !isReadOnly && (
                        <WorkbenchEmptyState
                          description={t('workbench.viewManagement.controllerEmptyHint')}
                          primaryAction={{
                            label: t('workbench.viewManagement.newController'),
                            onClick: () => {
                              setOpenControllerMenu(false);
                              setViewEditor({ mode: 'create', kind: 'controller' });
                            },
                            icon: <Plus className="h-3.5 w-3.5" />,
                          }}
                          secondaryAction={{
                            label: t('workbench.viewManagement.restoreStandard'),
                            onClick: () => {
                              restoreStandardViews();
                              setOpenControllerMenu(false);
                            },
                            icon: <RotateCcw className="h-3.5 w-3.5" />,
                          }}
                          className="py-2"
                        />
                      )}
	                      {authoredControllerViews.map((view) => {
	                        const isRenaming = renamingViewId === view.id;
	                        return (
	                          <div key={view.id} className={`group flex h-8 items-center gap-1 rounded px-2 ${selectedControllerEntryId === view.id ? 'bg-wb-active' : 'hover:bg-wb-hover'}`}>
	                            {isRenaming ? (
	                              <input
	                                type="text"
	                                value={renameDraft}
	                                autoFocus
	                                onFocus={(event) => event.currentTarget.select()}
	                                onClick={(event) => event.stopPropagation()}
	                                onBlur={() => commitRenameView(view)}
	                                onChange={(event) => setRenameDraft(event.target.value)}
	                                onKeyDown={(event) => {
	                                  if (event.key === 'Enter') {
	                                    event.preventDefault();
	                                    commitRenameView(view);
	                                  }
	                                  if (event.key === 'Escape') {
	                                    event.preventDefault();
	                                    cancelRenameView();
	                                  }
	                                }}
	                                className="h-6 min-w-0 flex-1 rounded border border-wb-accent bg-wb-input px-1.5 text-xs font-semibold text-wb-text outline-none focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
	                                aria-label={t('workbench.viewManagement.rename')}
	                              />
	                            ) : (
	                              <button
	                                type="button"
	                                onClick={() => selectControllerEntry(view.id)}
	                                onDoubleClick={() => beginRenameView(view)}
	                                className={`min-w-0 flex-1 truncate rounded text-left text-xs font-semibold ${WB_FOCUS_RING} ${selectedControllerEntryId === view.id ? 'text-wb-text' : 'text-wb-muted group-hover:text-wb-text'}`}
	                              >
	                                {view.title}
	                              </button>
	                            )}
                              {!isReadOnly && (
                                <>
                                  <button type="button" onClick={() => setViewEditor({ mode: 'edit', view })} className={`inline-flex h-6 w-6 items-center justify-center rounded text-wb-subtle hover:bg-wb-hover hover:text-wb-text ${WB_FOCUS_RING}`} aria-label={t('common.edit')}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button type="button" onClick={() => beginRenameView(view)} className={`inline-flex h-6 w-6 items-center justify-center rounded text-wb-subtle hover:bg-wb-hover hover:text-wb-text ${WB_FOCUS_RING}`} aria-label={t('workbench.viewManagement.rename')}>
                                    <TypeIcon className="h-3.5 w-3.5" />
                                  </button>
                                  <button type="button" onClick={() => duplicateView(view)} className={`inline-flex h-6 w-6 items-center justify-center rounded text-wb-subtle hover:bg-wb-hover hover:text-wb-text ${WB_FOCUS_RING}`} aria-label={t('workbench.viewManagement.duplicate')}>
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                  <button type="button" onClick={() => requestDeleteView(view)} className={`inline-flex h-6 w-6 items-center justify-center rounded text-wb-subtle hover:bg-wb-hover hover:text-wb-danger ${WB_FOCUS_RING}`} aria-label={t('common.delete')}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
	                          </div>
	                        );
	                      })}
                      {!isReadOnly && <div className="mt-1 grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenControllerMenu(false);
                            setViewEditor({ mode: 'create', kind: 'controller' });
                          }}
                          className={`flex h-8 items-center justify-center gap-2 rounded border border-wb-line px-2 text-xs font-bold text-wb-text transition-colors hover:border-wb-line-strong hover:bg-wb-hover ${WB_FOCUS_RING}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span className="truncate">{t('workbench.viewManagement.newController')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            restoreStandardViews();
                            setOpenControllerMenu(false);
                          }}
                          className={`flex h-8 items-center justify-center gap-2 rounded border border-wb-line px-2 text-xs font-semibold text-wb-muted transition-colors hover:border-wb-line-strong hover:bg-wb-hover hover:text-wb-text ${WB_FOCUS_RING}`}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span className="truncate">{t('workbench.viewManagement.restoreStandard')}</span>
                        </button>
                      </div>}
                    </div>
                  )}
                </div>
                <div className="relative min-h-0 flex-1">
                  {selectedControllerView ? (
                    runtimeRenderer?.renderAuthoredView(selectedControllerView, {
                      instances,
                      activeInstanceId: selectedControllerTargetId,
                      presentationMode: 'studio',
                    }) ?? (
                      <React.Suspense fallback={<div className="h-full bg-wb-aux" />}>
                        <LegacyControls
                          isPaneMode
                          paneConfig={inspectorConfig}
                          instances={inspectorInstances}
                          instanceHealth={instanceHealth}
                          activeInstanceId={selectedControllerTargetId}
                          updateInstanceParams={updateInstanceParams}
                          updateInstanceKnobs={updateInstanceKnobs}
                          updateInstanceVolume={updateInstanceVolume}
                          presentationMode="studio"
                          controllerItems={selectedControllerView.items}
                        />
                      </React.Suspense>
                    )
                  ) : (
                    <WorkbenchEmptyState
                      description={t('workbench.viewManagement.controllerEmptyHint')}
                      primaryAction={isReadOnly ? undefined : {
                        label: t('workbench.viewManagement.newController'),
                        onClick: () => setViewEditor({ mode: 'create', kind: 'controller' }),
                        icon: <Plus className="h-3.5 w-3.5" />,
                      }}
                      secondaryAction={isReadOnly ? undefined : {
                        label: t('workbench.viewManagement.restoreStandard'),
                        onClick: restoreStandardViews,
                        icon: <RotateCcw className="h-3.5 w-3.5" />,
                      }}
                    />
                  )}
                </div>
              </div>
            </section>
          )}
          {layoutState.metricsOpen && (
            <ResizeSash
              orientation="horizontal"
              label={t('workbench.panelGrid.resizeMetricsHost')}
              value={metricsHeight}
              min={120}
              max={400}
              onChange={(outputHeight) => onLayoutStateChange((prev) => ({ ...prev, outputHeight }))}
              valueFromDrag={(startValue, deltaPx) => startValue - deltaPx}
              valueFromKey={(key, currentValue) => {
                if (key === 'ArrowUp') return currentValue + 10;
                if (key === 'ArrowDown') return currentValue - 10;
                return undefined;
              }}
              className="min-w-0"
              style={{ gridColumn: metricsSashGridColumn, gridRow: '2' }}
            />
          )}
          {layoutState.metricsOpen && (
            <section
              className="workbench-zone-aux flex min-h-0 flex-col overflow-hidden border-t border-wb-line bg-wb-aux"
              style={{ gridColumn: metricsGridColumn, gridRow: '3' }}
              aria-label={t('workbench.panelGrid.metricsHost')}
            >
              <WorkbenchDockview
                panels={metricsDockviewPanels}
                zone="bottomPanel"
                mode={mode}
                variant="metrics"
                layoutKey={`${dockviewLayoutKey ?? 'default'}:metrics`}
                viewState={metricsDockviewViewState}
                onViewStateChange={setMetricsDockviewViewState}
                onCreatePanel={() => {
                  setViewEditor({ mode: 'create', kind: 'metrics' });
                  return undefined;
                }}
                onEditPanel={editMetricsPanel}
                onRenamePanel={renameMetricsPanel}
                onDuplicatePanel={duplicateMetricsPanel}
                onSplitPanel={mirrorMetricsPanel}
                onRemovePanel={deleteMetricsPanel}
                getPanelCloseBehavior={getMetricsPanelCloseBehavior}
                getPanelTitle={getPanelTitle}
                renderPanel={renderMetricsDockviewPanel}
                renderEmptyState={renderMetricsEmptyState}
                splitAxis="horizontal-only"
                className="workbench-dockview workbench-dockview-metrics flex-1"
              />
            </section>
          )}
        </div>
        {paneSettingsModal}
        {viewEditorModal}
        {deleteViewConfirmModal}
    </main>
  );
}
