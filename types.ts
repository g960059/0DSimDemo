
export interface SimulationParams {
    // Resistances
    Ras: number;
    Rcs: number;
    Rvs: number;
    Ras_prox: number;
    Rcp: number;
    Rap: number;
    Rvp: number;
    Rap_prox: number;
    Rmv: number;
    Rtv: number;
    Rda: number;
  
    // Compliances
    Cas: number;
    Cvs: number;
    Cas_prox: number;
    Cap: number;
    Cvp: number;
    Cap_prox: number;
    Cda: number;
  
    // Left Ventricle
    LV_Ees: number;
    LV_V0: number;
    LV_alpha: number;
    LV_beta: number;
    LV_Tmax: number;
    LV_tau: number;
    LV_AV_delay: number;
  
    // Left Atrium
    LA_Ees: number;
    LA_V0: number;
    LA_alpha: number;
    LA_beta: number;
    LA_Tmax: number;
    LA_tau: number;
    LA_AV_delay: number;
  
    // Right Ventricle
    RV_Ees: number;
    RV_V0: number;
    RV_alpha: number;
    RV_beta: number;
    RV_Tmax: number;
    RV_tau: number;
    RV_AV_delay: number;
  
    // Right Atrium
    RA_Ees: number;
    RA_V0: number;
    RA_alpha: number;
    RA_beta: number;
    RA_Tmax: number;
    RA_tau: number;
    RA_AV_delay: number;
  
    // General
    HR: number;
  
    // Valve Regurgitation (Resistance backward)
    Ravr: number;
    Ravs: number;
    Rmvr: number;
    Rmvs: number;
    Rpvr: number;
    Rpvs: number;
    Rtvr: number;
    Rtvs: number;
}
  
export interface SimulationState {
    Qvs: number;
    Qas: number;
    Qap: number;
    Qvp: number;
    Qlv: number;
    Qla: number;
    Qrv: number;
    Qra: number;
    Qas_prox: number;
    Qda: number;
    Qap_prox: number;
    Qtube: number;
}
  
export interface SimulationOutput {
    t: number;
    y: SimulationState;
    aux: {
      Plv: number;
      Pla: number;
      Prv: number;
      Pra: number;
      AoP: number;
      PAP: number;
    };
}

export type StateVector = number[];

export type ChamberId = 'LV' | 'LA' | 'RV' | 'RA';

// Instance management
export interface SimInstance {
    id: string;
    name: string;
    color: string;
    params: SimulationParams;
    targetVolume: number; // New: Target Total Volume
    isVisible: boolean; 
}

// Internal Physics State (Mutable Ref Object)
export interface PhysicsRefState {
    t: number;
    y: StateVector;
    buffer: SimulationOutput[]; 
    lastRenderX: number;
    
    // The parameters currently being used by the physics engine.
    // These are updated from the instance.params at specific cardiac phases.
    activeParams: SimulationParams; 
}

export type SignalType = 'Plv' | 'Pla' | 'Prv' | 'Pra' | 'AoP' | 'PAP';
export type MetricType = 'ABP' | 'CVP' | 'PAP' | 'PCWP' | 'SV' | 'CO' | 'Ea_LV';

export type PanelType = 'PVLOOP' | 'WAVEFORM' | 'METRICS' | 'GUYTON_RIGHT' | 'GUYTON_LEFT' | 'GUYTON_3D';

export interface PanelInstanceConfig {
    [instanceId: string]: {
        visible: boolean;
        selectedSignals: string[]; 
        customColors?: { [key: string]: string }; 
    }
}

export interface PanelDef {
    id: string;
    type: PanelType;
    title: string;
    w: number; 
    h: number; 
    config: PanelInstanceConfig;
    isSettingsOpen?: boolean;
    showGuides?: boolean; 
    timeWindow?: number; 
}
