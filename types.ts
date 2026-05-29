import { CoreRuntimeParams, SimHealthStatus } from './engine/protocol';

export type SimulationParams = CoreRuntimeParams;

export type ChamberId = 'LV' | 'LA' | 'RV' | 'RA';
export type SignalType = 'LVP' | 'AoP' | 'LAP' | 'RVP' | 'PAP' | 'RAP' | 'QAo' | 'QMV' | 'QPA' | 'QTV' | 'Default';
export type MetricType = 'ABP' | 'CVP' | 'PAP' | 'PCWP' | 'SV' | 'CO' | 'LVEF' | 'RVEF';

export interface SimInstance {
    id: string;
    name: string;
    color: string;
    params: SimulationParams;
    targetVolume: number;
    isVisible: boolean; 
}

export interface PanelInstanceConfig {
    visible: boolean;
    selectedSignals: string[];
}

export type PanelType = 'PVLOOP' | 'WAVEFORM' | 'METRICS' | 'GUYTON_RIGHT' | 'GUYTON_LEFT' | 'GUYTON_3D';

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
}

import { ModelCore } from './engine/ModelCore';
import { SimSample } from './engine/protocol';

export interface PhysicsRefState {
    core: ModelCore;
    buffer: SimSample[];
    lastRenderX: number;
}
