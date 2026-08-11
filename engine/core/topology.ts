import {
  defaultActiveLA,
  defaultActiveLV,
  defaultActiveRA,
  defaultActiveRV,
  type ActiveChamberParams,
  type Chamber,
} from "@/engine/chambers";

export type NodeKind = "heartActive" | "heartElastance" | "arterial" | "linear" | "venousPressure";
export type EdgeKind = "resistive" | "dynamic" | "valve";
export type CoronaryTerritory = "LAD" | "LCx" | "RCA";
export type CoronarySegment = "ostial" | "proximal" | "distal" | "venous" | "sinus";
export type ExtKind =
  | "none"
  | "pth"
  | "palv"
  | "imLAD"
  | "imLCx"
  | "imRCA"
  | "imLADVen"
  | "imLCxVen"
  | "imRCAVen";

export const CORONARY_TERRITORIES: CoronaryTerritory[] = ["LAD", "LCx", "RCA"];
export const CORONARY_SPECS: Record<CoronaryTerritory, {
  gammaLv: number;
  gammaRv: number;
  venousExternalFraction: number;
  proximalCompressionK: number;
  distalCompressionK: number;
  restingShare: number;
  stenosisKey: "LADStenosis" | "LCxStenosis" | "RCAStenosis";
}> = {
  LAD: {
    gammaLv: 0.65,
    gammaRv: 0.00,
    venousExternalFraction: 0.45,
    proximalCompressionK: 0.5,
    distalCompressionK: 2.0,
    restingShare: 0.42,
    stenosisKey: "LADStenosis",
  },
  LCx: {
    gammaLv: 0.55,
    gammaRv: 0.05,
    venousExternalFraction: 0.45,
    proximalCompressionK: 0.5,
    distalCompressionK: 1.8,
    restingShare: 0.28,
    stenosisKey: "LCxStenosis",
  },
  RCA: {
    gammaLv: 0.20,
    gammaRv: 0.45,
    venousExternalFraction: 0.45,
    proximalCompressionK: 0.3,
    distalCompressionK: 1.0,
    restingShare: 0.30,
    stenosisKey: "RCAStenosis",
  },
};

export type NodeSpec = {
  name: string;
  kind: NodeKind;
  chamber?: Chamber;
  ext?: ExtKind;
  Vu?: number;
  venousToneGain?: number;
  P0?: number;
  Vs?: number;
  C?: number;
  Ccoll?: number;
  Copen?: number;
  Cdist?: number;
  Popen?: number;
  Pstiff?: number;
  dOpen?: number;
  dStiff?: number;
  V0?: number;
  alpha?: number;
  beta?: number;
  Ees?: number;
  x0: number;
  active?: ActiveChamberParams;
};

export type EdgeSpec = {
  name: string;
  up: string;
  down: string;
  kind: EdgeKind;
  R: number;
  L?: number;
  B?: number;
  group?: "systemic" | "pulmonary" | "coronary" | "none";
  coronaryTerritory?: CoronaryTerritory;
  coronarySegment?: CoronarySegment;
  ext?: ExtKind;
  waterfall?: boolean;
  Pcrit?: number;
  useChiResistance?: boolean;
  useChiQuadratic?: boolean;
  chiMin?: number;
  chiWidth?: number;
  chiRExp?: number;
  chiBExp?: number;
  Amax?: number;
  Aref?: number;
  Aleak?: number;
  kOpen?: number;
  dP0?: number;
  tauOpen?: number;
  tauClose?: number;
  q0?: number;
  xi0?: number;
  pvOstialInertanceL?: number;
  pvOstialResistanceR?: number;
  pvOstialQuadraticB?: number;
};

export const nodeNames = [
  "LV", "LA", "RV", "RA",
  "Ao", "SA", "Art", "Cap", "SV", "VC",
  "PA", "PArt", "PCap", "PVen", "PVein",
  "LAD_Art", "LAD_IM", "LAD_Ven",
  "LCx_Art", "LCx_IM", "LCx_Ven",
  "RCA_Art", "RCA_IM", "RCA_Ven",
  "CS"
] as const;
export const tbvCorrectionNodeNames = ["SV", "VC", "PCap", "PVen", "PVein"] as const;
export const systemicVenousNodeNames = ["SV", "VC"] as const;
export const pulmonaryVenousNodeNames = ["PCap", "PVen", "PVein"] as const;

export const dynamicEdgeNames = ["MV", "AoV", "TV", "PV", "Ao_SA", "PA_PArt", "PVein_LA"] as const;
export const valveNames = ["MV", "AoV", "TV", "PV"] as const;
export const DYNAMIC_FLOW_CLAMP_ML_PER_S = 1500;
export const MV_PRESSURE_DEADBAND_MMHG = 0.60;

export type NodeName = typeof nodeNames[number];
export type DynamicEdgeName = typeof dynamicEdgeNames[number];
export type ValveName = typeof valveNames[number];

export function activeChambersFromNodes(nodes: NodeSpec[]): Chamber[] {
  const chambers: Chamber[] = [];
  const seen = new Set<Chamber>();
  for (const n of nodes) {
    if (n.kind !== "heartActive" || !n.chamber || !n.active || seen.has(n.chamber)) continue;
    chambers.push(n.chamber);
    seen.add(n.chamber);
  }
  return chambers;
}

export function buildNodes(): NodeSpec[] {
  return [
    { name: "LV", kind: "heartActive", chamber: "LV", V0: 10, alpha: 0.015, beta: 0.8, Ees: 1.6, x0: 130, active: defaultActiveLV },
    { name: "LA", kind: "heartActive", chamber: "LA", V0: 5, alpha: 0.05, beta: 0.4, Ees: 0.25, x0: 45, active: defaultActiveLA },
    { name: "RV", kind: "heartActive", chamber: "RV", V0: 15, alpha: 0.012, beta: 0.5, Ees: 0.85, x0: 140, active: defaultActiveRV },
    { name: "RA", kind: "heartActive", chamber: "RA", V0: 5, alpha: 0.05, beta: 0.35, Ees: 0.22, x0: 55, active: defaultActiveRA },

    { name: "Ao", kind: "arterial", Vu: 0, P0: 50, Vs: 150, x0: 150 * Math.log1p(90 / 50) },
    { name: "SA", kind: "arterial", Vu: 0, P0: 50, Vs: 400, x0: 400 * Math.log1p(85 / 50) },
    { name: "Art", kind: "arterial", Vu: 0, P0: 45, Vs: 120, x0: 120 * Math.log1p(70 / 45) },
    { name: "Cap", kind: "linear", Vu: 0, C: 15, x0: 15 * 25 },
    // Preserve effective Vu exactly at the canonical venous tone (0.15),
    // while exposing a finite systemic venous reserve for intervention work.
    { name: "SV", kind: "venousPressure", Vu: 1653.909, venousToneGain: 770, Ccoll: 15, Copen: 130, Cdist: 35, Popen: -2, Pstiff: 16, dOpen: 1.5, dStiff: 4, x0: 6 },
    { name: "VC", kind: "venousPressure", ext: "pth", Vu: 169.591, venousToneGain: 130, Ccoll: 5, Copen: 45, Cdist: 12, Popen: -1, Pstiff: 12, dOpen: 1, dStiff: 3, x0: 4 },

    { name: "PA", kind: "arterial", ext: "pth", Vu: 0, P0: 20, Vs: 60, x0: 60 * Math.log1p(16 / 20) },
    { name: "PArt", kind: "arterial", ext: "pth", Vu: 0, P0: 20, Vs: 90, x0: 90 * Math.log1p(13 / 20) },
    { name: "PCap", kind: "venousPressure", ext: "palv", Vu: 105, Ccoll: 1.0, Copen: 2.0, Cdist: 1.0, Popen: 0, Pstiff: 14, dOpen: 1, dStiff: 3, x0: 8 },
    { name: "PVen", kind: "venousPressure", ext: "pth", Vu: 160, Ccoll: 1.2, Copen: 3.0, Cdist: 1.2, Popen: -1, Pstiff: 14, dOpen: 1, dStiff: 3, x0: 6 },
    { name: "PVein", kind: "venousPressure", ext: "pth", Vu: 215, Ccoll: 1.5, Copen: 4.0, Cdist: 1.5, Popen: -1, Pstiff: 14, dOpen: 1, dStiff: 3, x0: 5 },

    { name: "LAD_Art", kind: "linear", ext: "pth", Vu: 3, C: 0.030, x0: 3 + 0.030 * 85 },
    { name: "LAD_IM", kind: "linear", ext: "imLAD", Vu: 8, C: 0.090, x0: 8 + 0.090 * 15 },
    { name: "LAD_Ven", kind: "linear", ext: "imLADVen", Vu: 6, C: 0.120, x0: 6 + 0.120 * 8 },
    { name: "LCx_Art", kind: "linear", ext: "pth", Vu: 2, C: 0.020, x0: 2 + 0.020 * 85 },
    { name: "LCx_IM", kind: "linear", ext: "imLCx", Vu: 5, C: 0.060, x0: 5 + 0.060 * 15 },
    { name: "LCx_Ven", kind: "linear", ext: "imLCxVen", Vu: 4, C: 0.080, x0: 4 + 0.080 * 8 },
    { name: "RCA_Art", kind: "linear", ext: "pth", Vu: 2, C: 0.025, x0: 2 + 0.025 * 70 },
    { name: "RCA_IM", kind: "linear", ext: "imRCA", Vu: 6, C: 0.070, x0: 6 + 0.070 * 12 },
    { name: "RCA_Ven", kind: "linear", ext: "imRCAVen", Vu: 5, C: 0.100, x0: 5 + 0.100 * 7 },
    { name: "CS", kind: "linear", ext: "pth", Vu: 18, C: 1.5, x0: 18 + 1.5 * 5 }
  ];
}

export function buildEdges(): EdgeSpec[] {
  const q0 = 80;
  return [
    { name: "MV", up: "LA", down: "LV", kind: "valve", R: 0.0027, L: 0.0005, B: 8e-6, Aref: 5.0, Amax: 5.5, Aleak: 0, kOpen: 2.0, tauOpen: 0.024, tauClose: 0.016, q0, xi0: 0.2 },
    { name: "AoV", up: "LV", down: "Ao", kind: "valve", R: 0.0015, L: 0.00025, B: 1e-6, Aref: 3.5, Amax: 3.5, Aleak: 0, kOpen: 3.0, tauOpen: 0.006, tauClose: 0.008, q0, xi0: 0.2 },
    { name: "TV", up: "RA", down: "RV", kind: "valve", R: 0.0035, L: 0.0008, B: 1e-5, Aref: 8.0, Amax: 8.0, Aleak: 0, kOpen: 2.0, tauOpen: 0.018, tauClose: 0.010, q0, xi0: 0.2 },
    { name: "PV", up: "RV", down: "PA", kind: "valve", R: 0.005, L: 0.001, B: 2e-6, Aref: 4.0, Amax: 4.0, Aleak: 0, kOpen: 2.0, tauOpen: 0.010, tauClose: 0.006, q0, xi0: 0.2 },

    { name: "Ao_SA", up: "Ao", down: "SA", kind: "dynamic", R: 0.0465088, L: 0.002, B: 0, group: "systemic", q0 },
    { name: "SA_Art", up: "SA", down: "Art", kind: "resistive", R: 0.07441408, B: 0, group: "systemic" },
    { name: "Art_Cap", up: "Art", down: "Cap", kind: "resistive", R: 0.6046144, B: 0, group: "systemic" },
    { name: "Cap_SV", up: "Cap", down: "SV", kind: "resistive", R: 0.15, B: 0 },
    { name: "SV_VC", up: "SV", down: "VC", kind: "resistive", R: 0.05, B: 0 },
    { name: "VC_RA", up: "VC", down: "RA", kind: "resistive", R: 0.04, B: 0, ext: "pth", waterfall: true, Pcrit: 0, useChiResistance: true, useChiQuadratic: false },

    { name: "PA_PArt", up: "PA", down: "PArt", kind: "dynamic", R: 0.01, L: 0.004, B: 0, group: "pulmonary", q0 },
    { name: "PArt_PCap", up: "PArt", down: "PCap", kind: "resistive", R: 0.04, B: 0, group: "pulmonary" },
    { name: "PCap_PVen", up: "PCap", down: "PVen", kind: "resistive", R: 0.03, B: 0, ext: "palv", waterfall: true, Pcrit: 0, useChiResistance: true, useChiQuadratic: false },
    { name: "PVen_PVein", up: "PVen", down: "PVein", kind: "resistive", R: 0.01, B: 0 },
    {
      name: "PVein_LA",
      up: "PVein",
      down: "LA",
      kind: "resistive",
      R: 0.03025,
      B: 0,
      q0,
      pvOstialResistanceR: 0.03025,
      pvOstialInertanceL: 0,
      pvOstialQuadraticB: 0,
    },

    { name: "Ao_LAD", up: "Ao", down: "LAD_Art", kind: "resistive", R: 1.0, B: 0, group: "coronary", coronaryTerritory: "LAD", coronarySegment: "ostial" },
    { name: "LAD_Art_IM", up: "LAD_Art", down: "LAD_IM", kind: "resistive", R: 12, B: 0, group: "coronary", coronaryTerritory: "LAD", coronarySegment: "proximal" },
    { name: "LAD_IM_Ven", up: "LAD_IM", down: "LAD_Ven", kind: "resistive", R: 33, B: 0, group: "coronary", coronaryTerritory: "LAD", coronarySegment: "distal" },
    { name: "LAD_Ven_CS", up: "LAD_Ven", down: "CS", kind: "resistive", R: 2, B: 0, group: "coronary", coronaryTerritory: "LAD", coronarySegment: "venous" },

    { name: "Ao_LCx", up: "Ao", down: "LCx_Art", kind: "resistive", R: 1.5, B: 0, group: "coronary", coronaryTerritory: "LCx", coronarySegment: "ostial" },
    { name: "LCx_Art_IM", up: "LCx_Art", down: "LCx_IM", kind: "resistive", R: 22, B: 0, group: "coronary", coronaryTerritory: "LCx", coronarySegment: "proximal" },
    { name: "LCx_IM_Ven", up: "LCx_IM", down: "LCx_Ven", kind: "resistive", R: 56, B: 0, group: "coronary", coronaryTerritory: "LCx", coronarySegment: "distal" },
    { name: "LCx_Ven_CS", up: "LCx_Ven", down: "CS", kind: "resistive", R: 3, B: 0, group: "coronary", coronaryTerritory: "LCx", coronarySegment: "venous" },

    { name: "Ao_RCA", up: "Ao", down: "RCA_Art", kind: "resistive", R: 1.5, B: 0, group: "coronary", coronaryTerritory: "RCA", coronarySegment: "ostial" },
    { name: "RCA_Art_IM", up: "RCA_Art", down: "RCA_IM", kind: "resistive", R: 20, B: 0, group: "coronary", coronaryTerritory: "RCA", coronarySegment: "proximal" },
    { name: "RCA_IM_Ven", up: "RCA_IM", down: "RCA_Ven", kind: "resistive", R: 43, B: 0, group: "coronary", coronaryTerritory: "RCA", coronarySegment: "distal" },
    { name: "RCA_Ven_CS", up: "RCA_Ven", down: "CS", kind: "resistive", R: 3, B: 0, group: "coronary", coronaryTerritory: "RCA", coronarySegment: "venous" },

    { name: "CS_RA", up: "CS", down: "RA", kind: "resistive", R: 1.0, B: 0, group: "coronary", coronarySegment: "sinus" }
  ];
}
