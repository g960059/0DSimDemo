import { CoreRuntimeParams, SimulationHealthStatus } from './engine/protocol';
import { ClinicalKnobs } from './engine/knobs';

export type SimulationParams = CoreRuntimeParams;

export type ChamberId = 'LV' | 'LA' | 'RV' | 'RA';
export type SignalType =
  | 'LVP' | 'AoP' | 'LAP' | 'RVP' | 'PAP' | 'RAP'
  | 'QAo' | 'QMV' | 'QPA' | 'QPV' | 'QTV' | 'PVF' | 'SVF'
  | 'VRA' | 'aRA' | 'cRA' | 'xiTV' | 'xiPV' | 'dP_TV' | 'dP_PV'
  | 'Pperi' | 'Ppc' | 'VHeart' | 'septumShiftMl' | 'VLVeff' | 'VRVeff'
  | 'PLVfw' | 'PRVfw' | 'PVI_LV' | 'PVI_RV' | 'septalForceMmHg'
  | 'Default';
export type MetricType = 'ABP' | 'CVP' | 'PAP' | 'PCWP' | 'SV' | 'CO' | 'LVEF' | 'RVEF';

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

export interface PanelDef {
    id: string;
    type: PanelType;
    title: string;
    w: number;
    h: number;
    config: Record<string, PanelInstanceConfig>; // keyed by instance id
    isSettingsOpen: boolean;
    showGuides?: boolean;
    timeWindow?: number;
    showLegend?: boolean;
}

import { ModelCore } from './engine/ModelCore';
import { SimSample } from './engine/protocol';

export interface PhysicsRefState {
    core: ModelCore;
    buffer: SimSample[];
    lastRenderX: number;
}
