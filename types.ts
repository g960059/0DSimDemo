import type {
    CoreRuntimeParams,
    SimMetrics,
    SimObservables,
    SimSample,
    SimulationHealth,
    SimulationHealthStatus,
} from './engine/protocol';
import type { ClinicalKnobs } from './engine/knobs';

export type SimulationParams = CoreRuntimeParams;

export type ChamberId = 'LV' | 'LA' | 'RV' | 'RA';
export type SignalType =
  | 'LVP' | 'AoP' | 'LAP' | 'RVP' | 'PAP' | 'RAP'
  | 'QAo' | 'QMV' | 'QPA' | 'QPV' | 'QTV' | 'PVF' | 'SVF'
  | 'QCorLAD' | 'QCorLCx' | 'QCorRCA' | 'QCorTotal' | 'QCS'
  | 'PimLAD' | 'PimLCx' | 'PimRCA' | 'PLADArt' | 'PLCxArt' | 'PRCAArt' | 'PCS'
  | 'VRA' | 'aRA' | 'cRA' | 'xiTV' | 'xiPV' | 'dP_TV' | 'dP_PV'
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

export type PanelType = 'PVLOOP' | 'WAVEFORM' | 'METRICS' | 'GUYTON_RIGHT' | 'GUYTON_LEFT' | 'GUYTON_3D' | 'CONTROLS' | 'NOTE';
export type PanelRole = 'graph' | 'output' | 'control' | 'note';

export interface PanelDef {
    id: string;
    type: PanelType;
    title: string;
    role?: PanelRole;
    x?: number;
    y?: number;
    w: number;
    h: number;
    config: Record<string, PanelInstanceConfig>; // keyed by instance id
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
}

export interface PhysicsRefState {
    core: PreviewCoreFacade;
    buffer: SimSample[];
    lastRenderX: number;
    isSettling?: boolean;
    settleProgress?: number;
}
