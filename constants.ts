import { SimulationParams } from './types';

// Matches the python DEFAULT_DATA first 12 entries
export const INITIAL_STATE_VECTOR = [
  749.9842973712131, // Qvs
  149.3527787113375, // Qas
  405.08061599015554, // Qap
  135.97317102061024, // Qvp
  144.32186565319813, // Qlv
  75.34345155268299, // Qla
  117.70495107318685, // Qrv
  73.76400781737635, // Qra
  68.42882775454605, // Qas_prox
  42.75963410693713, // Qda
  20.28639894876003, // Qap_prox
  10 // Qtube
];

export const INITIAL_TIME = 954.931700000081;

export const DEFAULT_PARAMS: SimulationParams = {
  Ras: 20, Rcs: 830, Rvs: 25, Ras_prox: 30,
  Rcp: 10, Rap: 13, Rvp: 15, Rap_prox: 15,
  Rmv: 2.5, Rtv: 2.5,
  Cas: 1.83, Cvs: 70, Cas_prox: 0.54,
  Cap: 20, Cvp: 7, Cap_prox: 1.0,
  Rda: 3, Cda: 0.52,

  LV_Ees: 2.21, LV_V0: 5, LV_alpha: 0.029, LV_beta: 0.34, LV_Tmax: 300, LV_tau: 25, LV_AV_delay: 160,
  LA_Ees: 0.48, LA_V0: 10, LA_alpha: 0.058, LA_beta: 0.44, LA_Tmax: 125, LA_tau: 20, LA_AV_delay: 0,
  RV_Ees: 0.74, RV_V0: 5, RV_alpha: 0.028, RV_beta: 0.34, RV_Tmax: 300, RV_tau: 25, RV_AV_delay: 160,
  RA_Ees: 0.38, RA_V0: 10, RA_alpha: 0.046, RA_beta: 0.44, RA_Tmax: 125, RA_tau: 20, RA_AV_delay: 0,

  HR: 60,

  Ravr: 100000, Ravs: 0,
  Rmvr: 100000, Rmvs: 0,
  Rpvr: 100000, Rpvs: 0,
  Rtvr: 100000, Rtvs: 0,
};