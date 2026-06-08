import type {
    CoreRuntimeParams,
    SimMetrics,
    SimObservables,
    SimSample,
    SimulationHealth,
    SimulationHealthStatus,
} from './engine/protocol';
import type { ClinicalKnobs, KnobKey } from './engine/knobs';
import type { GuytonSide } from './engine/guytonStarling';
import type { VascularReturnSnapshot } from './engine/guytonVascular';

export type SimulationParams = CoreRuntimeParams;

export type ChamberId = 'LV' | 'LA' | 'RV' | 'RA';
export type SignalType =
  | 'LVP' | 'AoP' | 'LAP' | 'RVP' | 'PAP' | 'RAP'
  | 'QAo' | 'QMV' | 'QPA' | 'QPV' | 'QTV' | 'PVF' | 'SVF'
  | 'QCorLAD' | 'QCorLCx' | 'QCorRCA' | 'QCorTotal' | 'QCS'
  | 'PimLAD' | 'PimLCx' | 'PimRCA' | 'PLADArt' | 'PLCxArt' | 'PRCAArt' | 'PCS'
  | 'VRA' | 'aRA' | 'cRA' | 'xiMV' | 'xiAoV' | 'xiTV' | 'xiPV'
  | 'dP_MV' | 'dP_AoV' | 'dP_TV' | 'dP_PV'
  | 'AoV_areaRatio' | 'AoV_loss_R' | 'AoV_loss_B' | 'AoV_loss_residual'
  | 'LVPressureFloorHit01' | 'RVPressureFloorHit01'
  | 'ELV_active' | 'ERV_active' | 'ELV_timeVarying' | 'ERV_timeVarying'
  | 'Pperi' | 'Ppc' | 'VHeart' | 'septumShiftMl' | 'VLVeff' | 'VRVeff'
  | 'PLVfw' | 'PRVfw' | 'PVI_LV' | 'PVI_RV' | 'septalForceMmHg'
  | 'Default';
export type MetricType =
  | 'ABP' | 'CVP' | 'PAP' | 'PCWP' | 'SV' | 'CO' | 'LVEF' | 'RVEF'
  | 'COR' | 'COR_PCT' | 'LAD_DF' | 'LCx_DF' | 'RCA_DF'
  | 'FFR_LAD' | 'FFR_LCx' | 'FFR_RCA' | 'COR_SDI_L' | 'COR_SDI_R';

export interface SimInstance {
    id: string;
    name: string;
    color: string;
    params: SimulationParams;
    targetVolume: number;
    isVisible: boolean;
    // Clinical knob layer (M4-lite). When present, the instance is knob-primary:
    // `params` is DERIVED via applyKnobs(knobBaseline, knobs). `knobs` are the
    // clinical deviations; `knobBaseline` is the authored raw start point that
    // the advanced (raw) controls edit. Absent until the first clinical-knob
    // edit, so legacy raw-only instances are unchanged.
    knobs?: ClinicalKnobs;
    knobBaseline?: SimulationParams;
}

export interface PanelInstanceConfig {
    visible: boolean;
    selectedSignals: string[];
    customBaseColor?: string;
    customName?: string;
    customSignalColors?: Record<string, string>;
    customSignalNames?: Record<string, string>;
}

export type PanelType = 'PVLOOP' | 'WAVEFORM' | 'METRICS' | 'GUYTON_RIGHT' | 'GUYTON_LEFT' | 'GUYTON_3D' | 'SCENARIOS' | 'CONTROLS' | 'NOTE';
export type PanelRole = 'graph' | 'output' | 'control' | 'note';
export type WorkbenchZoneId = 'caseRail' | 'main' | 'sideRail' | 'bottomPanel';

export type PanelItemId = ChamberId | SignalType | MetricType | KnobKey | string;

export interface PanelItemPresentation {
    visible?: boolean;
    label?: string;
    color?: string;
}

export interface PanelInstancePresentation {
    visible?: boolean;
    label?: string;
    color?: string;
    items?: Record<PanelItemId, PanelItemPresentation>;
}

export interface LegendPosition {
    xPct: number;
    yPct: number;
}

export interface GraphPanelView {
    kind: 'graph';
    graphType: 'pvloop' | 'waveform' | 'guyton-right' | 'guyton-left' | 'guyton-3d';
    chambers?: ChamberId[];
    signals?: SignalType[];
    instances?: Record<string, PanelInstancePresentation>;
    labels?: Record<PanelItemId, string>;
    colors?: Record<PanelItemId, string>;
    timeWindow?: number;
    showGuides?: boolean;
    showLegend?: boolean;
    legendPosition?: LegendPosition;
}

export interface OutputPanelView {
    kind: 'output';
    metrics: MetricType[];
    mode?: 'compact' | 'full';
    labels?: Record<MetricType, string>;
    colors?: Record<MetricType, string>;
    instances?: Record<string, PanelInstancePresentation>;
}

export type ControllerItem = {
    paramKey: string;
    kind: 'slider' | 'buttonGroup' | 'knob' | 'custom';
    label?: string;
    min?: number;
    max?: number;
    step?: number;
    options?: { label: string; value: number }[];
};

export interface ControlPanelView {
    kind: 'control';
    groups?: string[];
    knobs?: KnobKey[];
    controllerItems?: ControllerItem[];
    editable?: boolean;
    labels?: Partial<Record<KnobKey, string>>;
    instances?: Record<string, PanelInstancePresentation>;
}

export interface ScenarioPanelView {
    kind: 'scenario';
    mode?: 'list' | 'compact';
    instances?: Record<string, PanelInstancePresentation>;
}

export interface NotePanelView {
    kind: 'note';
    noteId?: string;
    mode?: 'lesson' | 'scratch';
}

export type PanelViewConfig = GraphPanelView | OutputPanelView | ControlPanelView | ScenarioPanelView | NotePanelView;

export type WorkbenchRegionId = 'scenarios' | 'control' | 'graph' | 'output' | 'note';
export type WorkbenchRegionPosition = 'left' | 'right' | 'top' | 'bottom' | 'center' | 'hidden';
export type WorkbenchRegionVisibility = boolean | 'compact';
export type WorkbenchSplitMode = 'single' | 'two-up' | 'four-up' | 'custom';

export interface WorkbenchRegionState {
    visible?: WorkbenchRegionVisibility;
    position?: WorkbenchRegionPosition;
    panelIds?: string[];
    activePanelId?: string;
    split?: WorkbenchSplitMode;
    size?: number;
}

export interface DockviewViewState {
    library: 'dockview';
    schemaVersion: 1;
    zone?: WorkbenchZoneId;
    state: unknown;
    updatedAt?: number;
}

export interface WorkbenchWorkspace {
    schemaVersion: 1;
    mode?: 'learn' | 'compare' | 'tune' | 'research' | 'custom';
    regions: Partial<Record<WorkbenchRegionId, WorkbenchRegionState>>;
    learnerLocked?: boolean;
    viewState?: DockviewViewState;
    viewStates?: Partial<Record<WorkbenchZoneId, DockviewViewState>>;
}

export interface PanelDef {
    id: string;
    type: PanelType;
    title: string;
    role?: PanelRole;
    zone?: WorkbenchZoneId;
    x?: number;
    y?: number;
    w: number;
    h: number;
    config: Record<string, PanelInstanceConfig>; // keyed by instance id
    view?: PanelViewConfig;
    isSettingsOpen: boolean;
    showGuides?: boolean;
    timeWindow?: number;
    showLegend?: boolean;
}

export interface PreviewCoreFacade {
    t: number;
    p: CoreRuntimeParams;
    metrics(): SimMetrics;
    health(): SimulationHealth;
    debugObservables(): SimObservables;
    vascularReturnSnapshot?(side: GuytonSide): VascularReturnSnapshot;
    passivePressureAt(chamber: ChamberId, volumeMl: number): number;
    passivePressureVolumeCurve(chamber: ChamberId, volumeMinMl: number, volumeMaxMl: number, pointCount?: number): Array<{ v: number; p: number }>;
}

export interface PhysicsRefState {
    core: PreviewCoreFacade;
    buffer: SimSample[];
    lastRenderX: number;
    isSettling?: boolean;
    settleProgress?: number;
    displaySignature?: string;
    steadySignature?: string;
    waveformBreakT?: number;
    previousEpoch?: {
        buffer: SimSample[];
        capturedAtMs: number;
        wipeStartedAtT: number;
        retainUntilT: number;
    };
    transition?: {
        status: 'pending' | 'settling' | 'promoted';
        toSignature: string;
        startedAtMs: number;
        promotedAtMs?: number;
    };
}
