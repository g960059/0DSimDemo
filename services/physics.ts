
import { SimulationParams, StateVector, SimulationOutput } from '../types';

// Helper: Activation function
function e_func(_t: number, Tmax: number, tau: number, HR: number): number {
  const T = 60000.0 / HR;
  const t = _t % T;
  if (t < Tmax) {
    const base = Math.exp(-(T - 1.5 * Tmax) / tau) / 2.0;
    return ((-Math.cos(Math.PI * t / Tmax) + 1.0) / 2.0) * (1.0 - base) + base;
  }
  if (t < 9.0 * Tmax / 8.0) {
    return (Math.cos(2.0 * Math.PI * t / Tmax) + 1.0) / 2.0;
  }
  return Math.exp(-(t - 9.0 * Tmax / 8.0) / tau) * (2.0 + Math.sqrt(2.0)) / 4.0;
}

// Helper: Pressure in chamber
function P_ch(V: number, t: number, Ees: number, V0: number, alpha: number, beta: number, Tmax: number, tau: number, AV_delay: number, HR: number): number {
  const Ped = beta * (Math.exp(alpha * (V - V0)) - 1.0);
  const Pes = Ees * (V - V0);
  return Ped + e_func(t - AV_delay, Tmax, tau, HR) * (Pes - Ped);
}

// Helper: Valve flow
function valve_flow(deltaP: number, R: number, Rs: number, Rr: number): number {
  if (deltaP > 0) {
    if (Rs === 0) {
      return deltaP / R;
    }
    return (-R + Math.sqrt(R * R + 4.0 * Rs * deltaP)) / (2.0 * Rs);
  } else {
    if (Rr >= 100000) {
      return deltaP / (R + Rr);
    }
    const disc = R * R - 4.0 * Rr * deltaP;
    return (-R - Math.sqrt(disc)) / (2.0 * Rr);
  }
}

// Right-Hand Side of ODEs
// y = [Qvs, Qas, Qap, Qvp, Qlv, Qla, Qrv, Qra, Qas_prox, Qda, Qap_prox, Qtube]
function rhs(t: number, y: StateVector, p: SimulationParams): { dy: StateVector, aux: any } {
  const [Qvs, Qas, Qap, Qvp, Qlv, Qla, Qrv, Qra, Qas_prox, Qda, Qap_prox] = y;
  // Qtube is y[11], but unused in derivative calc (constant)

  const HR = p.HR;

  const Plv = P_ch(Qlv, t, p.LV_Ees, p.LV_V0, p.LV_alpha, p.LV_beta, p.LV_Tmax, p.LV_tau, p.LV_AV_delay, HR);
  const Pla = P_ch(Qla, t, p.LA_Ees, p.LA_V0, p.LA_alpha, p.LA_beta, p.LA_Tmax, p.LA_tau, p.LA_AV_delay, HR);
  const Prv = P_ch(Qrv, t, p.RV_Ees, p.RV_V0, p.RV_alpha, p.RV_beta, p.RV_Tmax, p.RV_tau, p.RV_AV_delay, HR);
  const Pra = P_ch(Qra, t, p.RA_Ees, p.RA_V0, p.RA_alpha, p.RA_beta, p.RA_Tmax, p.RA_tau, p.RA_AV_delay, HR);

  const Paop = Qas_prox / p.Cas_prox;
  const PAP = Qap_prox / p.Cap_prox;
  const Pda = Qda / p.Cda;
  const Pas = Qas / p.Cas;
  const Pvs = Qvs / p.Cvs;
  const Pvp = Qvp / p.Cvp;
  const Pap = Qap / p.Cap;

  const Ida = (Paop - Pda) / p.Rda;
  const Ias = (Pda - Pas) / p.Ras;
  const Ics = (Pas - Pvs) / p.Rcs;
  const Ivs = (Pvs - Pra) / p.Rvs;

  const Ivp = (Pvp - Pla) / p.Rvp;
  const Iap = (Pap - Pvp) / p.Rap;
  const Icp = (PAP - Pap) / p.Rcp;

  const Itv = valve_flow(Pra - Prv, p.Rtv, p.Rtvs, p.Rtvr);
  const Imv = valve_flow(Pla - Plv, p.Rmv, p.Rmvs, p.Rmvr);
  const Iasp = valve_flow(Plv - Paop, p.Ras_prox, p.Ravs, p.Ravr);
  const Iapp = valve_flow(Prv - PAP, p.Rap_prox, p.Rpvs, p.Rpvr);

  const dQvs = Ics - Ivs;
  const dQas = Ias - Ics;
  const dQap = Icp - Iap;
  const dQvp = Iap - Ivp;

  const dQlv = Imv - Iasp;
  const dQla = Ivp - Imv;
  const dQrv = Itv - Iapp
  const dQra = Ivs - Itv;

  const dQas_prox = Iasp - Ida;
  const dQda = Ida - Ias;
  const dQap_prox = Iapp - Icp;
  const dQtube = 0.0;

  const dy = [dQvs, dQas, dQap, dQvp, dQlv, dQla, dQrv, dQra, dQas_prox, dQda, dQap_prox, dQtube];
  const aux = { Plv, Pla, Prv, Pra, AoP: Paop, PAP, Imv, Iasp };
  return { dy, aux };
}

// RK4 Integration Step
export function stepRK4(t: number, y: StateVector, dt: number, p: SimulationParams): { tNext: number, yNext: StateVector, aux: any } {
  const { dy: k1, aux: aux } = rhs(t, y, p); // Capture aux from start of step for plotting
  
  // k2
  const y_k2 = y.map((val, i) => val + dt * k1[i] / 2.0);
  const { dy: k2 } = rhs(t + dt / 2.0, y_k2, p);

  // k3
  const y_k3 = y.map((val, i) => val + dt * k2[i] / 2.0);
  const { dy: k3 } = rhs(t + dt / 2.0, y_k3, p);

  // k4
  const y_k4 = y.map((val, i) => val + dt * k3[i]);
  const { dy: k4 } = rhs(t + dt, y_k4, p);

  const yNext = y.map((val, i) => val + dt * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) / 6.0);
  
  return {
    tNext: t + dt,
    yNext,
    aux
  };
}

export function getTotalVolume(y: StateVector): number {
    return y.reduce((acc, val) => acc + val, 0);
}
