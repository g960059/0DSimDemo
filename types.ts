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
import type { MainWireScientificDerivedMetricIdV1 } from './engine/scientific/metrics';

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
  | 'AoV_qNextPreDiode' | 'AoV_qNextPostDiode' | 'AoV_qNextPreFlowClamp'
  | 'AoV_qNextPostFlowClamp' | 'AoV_qDotPreDiode' | 'AoV_qDotPostDiode'
  | 'AoV_qDotPreFlowClamp' | 'AoV_qDotRaw' | 'AoV_qDotPost'
  | 'AoV_qDotClampHit01' | 'AoV_qDotClampImpulse' | 'AoV_diodeImpulse'
  | 'AoV_flowClampImpulse'
  | 'LVPressureFloorHit01' | 'RVPressureFloorHit01'
  | 'ELV_active' | 'ERV_active' | 'ELV_timeVarying' | 'ERV_timeVarying'
  | 'Pperi' | 'Ppc' | 'VHeart' | 'septumShiftMl' | 'VLVeff' | 'VRVeff'
  | 'PLVfw' | 'PRVfw' | 'PVI_LV' | 'PVI_RV' | 'septalForceMmHg'
  | 'Default';
export type LegacyMetricType =
  | 'ABP' | 'CVP' | 'PAP' | 'PCWP' | 'SV' | 'CO' | 'LVEF' | 'RVEF'
  | 'COR' | 'COR_PCT' | 'LAD_DF' | 'LCx_DF' | 'RCA_DF'
  | 'FFR_LAD' | 'FFR_LCx' | 'FFR_RCA' | 'COR_SDI_L' | 'COR_SDI_R';
export type MetricType = LegacyMetricType | MainWireScientificDerivedMetricIdV1;

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
export type PvLoopDebugTraceMode = 'raw' | 'resampled' | 'both';

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

export type PvLoopHistoryMode = 'fade' | 'persistent';
export type PvLoopParameterHistoryCount = 0 | 1 | 3 | 5 | 6;
export type PvRelationDisplayMode = 'off' | 'standard' | 'research';
export type PvRelationPressureBasis = 'intracavitary' | 'transmural';
export type HemodynamicDetailMode = 'standard' | 'settled-reference' | 'compare';
export type HemodynamicParameterHistoryCount = 0 | 1 | 3 | 5;

export const DEFAULT_HEMODYNAMIC_DETAIL_MODE: HemodynamicDetailMode = 'standard';
export const DEFAULT_HEMODYNAMIC_PARAMETER_HISTORY_COUNT:
  HemodynamicParameterHistoryCount = 5;
export const DEFAULT_HEMODYNAMIC_ALLOW_NEGATIVE_FILLING_PRESSURE = false;
export const DEFAULT_PV_LOOP_HISTORY_BEATS = 4;
export const DEFAULT_PV_LOOP_PARAMETER_HISTORY_COUNT:
  PvLoopParameterHistoryCount = 0;
export const DEFAULT_PV_RELATION_DISPLAY_MODE: PvRelationDisplayMode = 'off';
export const DEFAULT_PV_RELATION_PRESSURE_BASIS: PvRelationPressureBasis =
  'intracavitary';

export interface HemodynamicResponsePanelSettings {
    detailMode: HemodynamicDetailMode;
    parameterHistoryCount: HemodynamicParameterHistoryCount;
    allowNegativeFillingPressure: boolean;
}

export interface PvRelationPanelSettings {
    displayMode: PvRelationDisplayMode;
    pressureBasis: PvRelationPressureBasis;
    showSamplePoints: boolean;
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
    pvDebugOverlay?: boolean;
    pvDebugTraceMode?: PvLoopDebugTraceMode;
    pvHistoryBeats?: number;
    pvHistoryMode?: PvLoopHistoryMode;
    pvParameterHistoryCount?: PvLoopParameterHistoryCount;
    pvRelationDisplayMode?: PvRelationDisplayMode;
    pvRelationPressureBasis?: PvRelationPressureBasis;
    pvRelationShowSamplePoints?: boolean;
    hemodynamicDetailMode?: HemodynamicDetailMode;
    hemodynamicParameterHistoryCount?: HemodynamicParameterHistoryCount;
    hemodynamicAllowNegativeFillingPressure?: boolean;
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
    labelKey?: string;
    min?: number;
    max?: number;
    step?: number;
    options?: { label: string; value: number; labelKey?: string }[];
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

export interface DockviewViewState {
    library: 'dockview';
    schemaVersion: 1;
    zone?: WorkbenchZoneId;
    state: unknown;
    updatedAt?: number;
}

export type WorkbenchMetricsSpan = 'main' | 'full';

export interface WorkbenchNoteHostState {
    open: boolean;
}

export interface WorkbenchRightRailHostState {
    open: boolean;
    scenarioListCollapsed?: boolean;
}

export interface WorkbenchMetricsHostState {
    open: boolean;
    span?: WorkbenchMetricsSpan;
}

export interface WorkbenchMainHostState {
    dockviewState?: DockviewViewState;
}

export interface WorkbenchWorkspaceHosts {
    note: WorkbenchNoteHostState;
    rightRail: WorkbenchRightRailHostState;
    metrics: WorkbenchMetricsHostState;
    main: WorkbenchMainHostState;
}

export interface WorkbenchWorkspace {
    schemaVersion: 2;
    hosts: WorkbenchWorkspaceHosts;
    learnerLocked?: boolean;
}

export interface PanelDef {
    id: string;
    sourceViewId?: string;
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
    pvDebugOverlay?: boolean;
    pvDebugTraceMode?: PvLoopDebugTraceMode;
    pvHistoryBeats?: number;
    pvHistoryMode?: PvLoopHistoryMode;
    pvParameterHistoryCount?: PvLoopParameterHistoryCount;
    /** LV protocol-derived pressure-volume relation presentation settings. */
    pvRelationDisplayMode?: PvRelationDisplayMode;
    pvRelationPressureBasis?: PvRelationPressureBasis;
    pvRelationShowSamplePoints?: boolean;
    /** GUYTON_LEFT / GUYTON_RIGHT response-locus presentation settings. */
    hemodynamicDetailMode?: HemodynamicDetailMode;
    hemodynamicParameterHistoryCount?: HemodynamicParameterHistoryCount;
    hemodynamicAllowNegativeFillingPressure?: boolean;
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
