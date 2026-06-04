import { clamp, frac, sigmoid, smoothMax, smoothMin, softplus, solveQuadraticFlow } from "@/engine/math";
import {
  ActiveStressChamberModel,
  ElastanceChamberModel,
  defaultActiveLA,
  defaultActiveLV,
  defaultActiveRA,
  defaultActiveRV,
  type ActiveChamberParams,
  type Chamber,
  type ChamberCtx,
} from "@/engine/chambers";
import type {
  CoreRuntimeParams,
  ParameterPatch,
  SimMetrics,
  SimObservables,
  SimSample,
  SimulationHealth,
  SimulationHealthStatus,
  VenousGroupBalance,
  VenousGroupBalances,
} from "@/engine/protocol";
import { HARD_CLAMP, RUNTIME_CLAMP_KEYS } from "@/engine/protocol";
import {
  assessBeatRing,
  DEFAULT_SETTLE_POLICY,
  type BeatSummary,
  type SettlePolicy,
  type SettleStatus,
  type SignalKey,
} from "@/engine/settling";
import {
  pericardialPressure,
  type PericardiumParams,
} from "@/engine/mechanics/pericardium";
import {
  clampSeptalShift,
  septalForce,
  septalShiftDerivative,
  type SeptumParams,
} from "@/engine/mechanics/septum";

/** Mutable per-beat accumulator (reduced into a BeatSummary at the beat boundary). */
type BeatAccum = {
  beat: number;
  count: number;
  lastT: number;
  sumAoP: number; maxAoP: number; minAoP: number;
  sumPAP: number; maxPAP: number; minPAP: number;
  sumRAP: number; sumLAP: number;
  svL: number; svR: number; prevQAo: number; prevQPA: number; prevT: number; hasPrev: boolean;
  maxVLV: number; minVLV: number; maxVRV: number; minVRV: number;
  lvEdp: number; rvEdp: number; // LVP/RVP at end-diastole (max ventricular volume)
  tbv: number;
};

type NodeKind = "heartActive" | "heartElastance" | "arterial" | "linear" | "venousPressure";
type EdgeKind = "resistive" | "dynamic" | "valve";
type CoronaryTerritory = "LAD" | "LCx" | "RCA";
type CoronarySegment = "ostial" | "proximal" | "distal" | "venous" | "sinus";
type ExtKind =
  | "none"
  | "pth"
  | "palv"
  | "imLAD"
  | "imLCx"
  | "imRCA"
  | "imLADVen"
  | "imLCxVen"
  | "imRCAVen";

const CORONARY_TERRITORIES: CoronaryTerritory[] = ["LAD", "LCx", "RCA"];
const CORONARY_SPECS: Record<CoronaryTerritory, {
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

type NodeSpec = {
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

type EdgeSpec = {
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

type PressurePack = {
  P: Float64Array;
  Ptm: Float64Array;
  Vphys: Float64Array;
  Pperi: number;
  Ppc: number;
  VHeart: number;
  septumShiftMl: number;
  VLVeff: number;
  VRVeff: number;
  PLVfw: number;
  PRVfw: number;
  PLVfwRaw: number;
  PRVfwRaw: number;
  PVI_LV: number;
  PVI_RV: number;
  septalForceMmHg: number;
  PimLAD: number;
  PimLCx: number;
  PimRCA: number;
  PimLADVen: number;
  PimLCxVen: number;
  PimRCAVen: number;
};

type CoronaryExternalPressures = {
  imLAD: number;
  imLCx: number;
  imRCA: number;
  imLADVen: number;
  imLCxVen: number;
  imRCAVen: number;
};


const nodeNames = [
  "LV", "LA", "RV", "RA",
  "Ao", "SA", "Art", "Cap", "SV", "VC",
  "PA", "PArt", "PCap", "PVen", "PVein",
  "LAD_Art", "LAD_IM", "LAD_Ven",
  "LCx_Art", "LCx_IM", "LCx_Ven",
  "RCA_Art", "RCA_IM", "RCA_Ven",
  "CS"
] as const;
const tbvCorrectionNodeNames = ["SV", "VC", "PCap", "PVen", "PVein"] as const;
const systemicVenousNodeNames = ["SV", "VC"] as const;
const pulmonaryVenousNodeNames = ["PCap", "PVen", "PVein"] as const;

const dynamicEdgeNames = ["MV", "AoV", "TV", "PV", "Ao_SA", "PA_PArt", "PVein_LA"] as const;
const valveNames = ["MV", "AoV", "TV", "PV"] as const;
const DYNAMIC_FLOW_CLAMP_ML_PER_S = 1500;

type NodeName = typeof nodeNames[number];
type DynamicEdgeName = typeof dynamicEdgeNames[number];
type ValveName = typeof valveNames[number];

type StateIndex = {
  node: Record<NodeName, number>;
  q: Record<DynamicEdgeName, number>;
  xi: Record<ValveName, number>;
  phi: number;
  septumShift: number;
  activeInternal: Partial<Record<Chamber, { c: number; a: number; r: number }>>;
  size: number;
};

function activeChambersFromNodes(nodes: NodeSpec[]): Chamber[] {
  const chambers: Chamber[] = [];
  const seen = new Set<Chamber>();
  for (const n of nodes) {
    if (n.kind !== "heartActive" || !n.chamber || !n.active || seen.has(n.chamber)) continue;
    chambers.push(n.chamber);
    seen.add(n.chamber);
  }
  return chambers;
}

function makeIndex(): StateIndex {
  let i = 0;
  const node = {} as Record<NodeName, number>;
  for (const n of nodeNames) node[n] = i++;
  const q = {} as Record<DynamicEdgeName, number>;
  for (const e of dynamicEdgeNames) q[e] = i++;
  const xi = {} as Record<ValveName, number>;
  for (const v of valveNames) xi[v] = i++;
  const phi = i++;
  const septumShift = i++;
  const activeInternal: Partial<Record<Chamber, { c: number; a: number; r: number }>> = {};
  for (const ch of activeChambersFromNodes(buildNodes())) {
    activeInternal[ch] = { c: i++, a: i++, r: i++ };
  }
  return {
    node,
    q,
    xi,
    phi,
    septumShift,
    activeInternal,
    size: i
  };
}


export function defaultParams(): CoreRuntimeParams {
  return {
    HR: 75,
    contractility: 1.0,
    relaxation: 1.0,
    // Calibrated operating point for the active-stress ventricle default.
    // M12-proper #1 Phase-1 (LA preload, see docs/research/m12-la-preload-design.md):
    // RV/RA refit: lower SVR/PVR/venous tone keep AoP/PAP/LAP normal after the
    // stronger right-heart calibration raises effective forward flow.
    systemicResistance: 0.80,
    pulmonaryResistance: 0.65,
    venousTone: 0.15,
    arterialStiffness: 0.75, // M12-proper #1 Phase-1: more arterial compliance to hold pulse pressure normal
    PEEP: 0,
    Pth0: 0,
    respAmpTh: 0,
    respAmpAlv: 0,
    respRate: 0.25,
    bleedRate: 0,
    fluidRate: 0,
    speed: 1,
    avDelaySec: 0.16,
    atrialElectromechanicalDelaySec: 0.00,
    ventricularElectromechanicalDelaySec: 0.05,
    // LV/RV default to the single-fibre / active-stress model (§13).
    // Use `stableElastanceBaseline` to opt back into time-varying elastance.
    heartModel: "activeStress",
    useChiResistance: false,
    projectTBV: true,
    // Contractility multiplier on the (now folded-in) chamber Tmax0. 1.0 = raw
    // fibre ceiling; default is lower so the normal LV does not out-run the
    // aortic root / dynamic-flow envelope and appear AS-like.
    lvTmaxScale: 0.70,
    rvTmaxScale: 1.0,
    lvGeomScale: 1,
    rvGeomScale: 1,
    caReleaseScale: 1,
    rvCaReleaseScale: 1,
    // Pericardial pressure and septal volume-shift coupling. The baseline is
    // deliberately light-touch (Ppc ~0 at average resting heart volume) so the
    // calibrated normal physiology remains stable, while effusion/constraint and
    // RV pressure overload have a real mechanical pathway.
    pericardiumEnabled: true,
    pericardialPressureScaleMmHg: 1.0,
    pericardialSlackVolumeMl: 340,
    pericardialVolumeScaleMl: 45,
    pericardialSoftnessMl: 8,
    pericardialBiasMmHg: 0,
    pericardialFluidMl: 0,
    septalCouplingEnabled: true,
    septalStiffnessScale: 1,
    septalK1MmHgPerMl: 1.4,
    septalK3MmHgPerMl3: 0.006,
    septalDampingMmHgSecPerMl: 4.0,
    septalMaxShiftMl: 25,
    septalLvPressureWeight: 0.28,
    coronaryEnabled: true,
    coronaryResistanceScale: 1,
    coronaryCompressionScale: 1.5,
    coronaryVasodilator: 0,
    coronaryReserveMax: 3.5,
    LADStenosis: 0,
    LCxStenosis: 0,
    RCAStenosis: 0,
    // Valve Defaults
    // MV
    MV_Aref: 5.0, MV_Amax: 5.0, MV_Aleak: 0, MV_kOpen: 2.0, MV_tauOpen: 0.020, MV_tauClose: 0.012, MV_R: 0.004, MV_L: 0.0003, MV_B: 2e-5,
    // AoV
    AoV_Aref: 3.5, AoV_Amax: 3.5, AoV_Aleak: 0, AoV_kOpen: 3.0, AoV_tauOpen: 0.006, AoV_tauClose: 0.005, AoV_R: 0.0015, AoV_L: 0.00025, AoV_B: 1e-6,
    // TV
    TV_Aref: 8.0, TV_Amax: 8.0, TV_Aleak: 0, TV_kOpen: 2.0, TV_tauOpen: 0.018, TV_tauClose: 0.010, TV_R: 0.0035, TV_L: 0.0008, TV_B: 1e-5,
    // PV
    PV_Aref: 4.0, PV_Amax: 4.0, PV_Aleak: 0, PV_kOpen: 2.0, PV_tauOpen: 0.010, PV_tauClose: 0.006, PV_R: 0.005, PV_L: 0.001, PV_B: 2e-6
  };
}

function buildNodes(): NodeSpec[] {
  return [
    { name: "LV", kind: "heartActive", chamber: "LV", V0: 10, alpha: 0.015, beta: 0.8, Ees: 1.6, x0: 130, active: defaultActiveLV },
    { name: "LA", kind: "heartActive", chamber: "LA", V0: 5, alpha: 0.05, beta: 0.4, Ees: 0.25, x0: 45, active: defaultActiveLA },
    { name: "RV", kind: "heartActive", chamber: "RV", V0: 15, alpha: 0.012, beta: 0.5, Ees: 0.85, x0: 140, active: defaultActiveRV },
    { name: "RA", kind: "heartActive", chamber: "RA", V0: 5, alpha: 0.05, beta: 0.35, Ees: 0.22, x0: 55, active: defaultActiveRA },

    { name: "Ao", kind: "arterial", Vu: 0, P0: 50, Vs: 150, x0: 150 * Math.log1p(90 / 50) },
    { name: "SA", kind: "arterial", Vu: 0, P0: 50, Vs: 400, x0: 400 * Math.log1p(85 / 50) },
    { name: "Art", kind: "arterial", Vu: 0, P0: 45, Vs: 120, x0: 120 * Math.log1p(70 / 45) },
    { name: "Cap", kind: "linear", Vu: 0, C: 15, x0: 15 * 25 },
    { name: "SV", kind: "venousPressure", Vu: 1590.909, venousToneGain: 350, Ccoll: 15, Copen: 130, Cdist: 35, Popen: -2, Pstiff: 16, dOpen: 1.5, dStiff: 4, x0: 6 },
    { name: "VC", kind: "venousPressure", ext: "pth", Vu: 159.091, venousToneGain: 60, Ccoll: 5, Copen: 45, Cdist: 12, Popen: -1, Pstiff: 12, dOpen: 1, dStiff: 3, x0: 4 },

    { name: "PA", kind: "arterial", ext: "pth", Vu: 0, P0: 20, Vs: 60, x0: 60 * Math.log1p(16 / 20) },
    { name: "PArt", kind: "arterial", ext: "pth", Vu: 0, P0: 20, Vs: 90, x0: 90 * Math.log1p(13 / 20) },
    { name: "PCap", kind: "venousPressure", ext: "palv", Vu: 105, Ccoll: 0.75, Copen: 1.5, Cdist: 0.75, Popen: 0, Pstiff: 14, dOpen: 1, dStiff: 3, x0: 8 },
    { name: "PVen", kind: "venousPressure", ext: "pth", Vu: 160, Ccoll: 0.75, Copen: 1.5, Cdist: 0.75, Popen: -1, Pstiff: 14, dOpen: 1, dStiff: 3, x0: 6 },
    { name: "PVein", kind: "venousPressure", ext: "pth", Vu: 215, Ccoll: 0.75, Copen: 1.5, Cdist: 0.75, Popen: -1, Pstiff: 14, dOpen: 1, dStiff: 3, x0: 5 },

    // Coronary circulation: small compliant epicardial, intramyocardial, and
    // venous compartments. Volumes are small enough not to become a systemic
    // reservoir; intramyocardial nodes receive territory-specific external
    // pressure from the ventricular free-wall pressures below.
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

function buildEdges(): EdgeSpec[] {
  const q0 = 80;
  return [
    { name: "MV", up: "LA", down: "LV", kind: "valve", R: 0.004, L: 0.0003, B: 2e-5, Aref: 5.0, Amax: 5.0, Aleak: 0, kOpen: 2.0, tauOpen: 0.020, tauClose: 0.012, q0, xi0: 0.2 },
    { name: "AoV", up: "LV", down: "Ao", kind: "valve", R: 0.0015, L: 0.00025, B: 1e-6, Aref: 3.5, Amax: 3.5, Aleak: 0, kOpen: 3.0, tauOpen: 0.006, tauClose: 0.005, q0, xi0: 0.2 },
    { name: "TV", up: "RA", down: "RV", kind: "valve", R: 0.0035, L: 0.0008, B: 1e-5, Aref: 8.0, Amax: 8.0, Aleak: 0, kOpen: 2.0, tauOpen: 0.018, tauClose: 0.010, q0, xi0: 0.2 },
    { name: "PV", up: "RV", down: "PA", kind: "valve", R: 0.005, L: 0.001, B: 2e-6, Aref: 4.0, Amax: 4.0, Aleak: 0, kOpen: 2.0, tauOpen: 0.010, tauClose: 0.006, q0, xi0: 0.2 },

    { name: "Ao_SA", up: "Ao", down: "SA", kind: "dynamic", R: 0.05, L: 0.002, B: 0, group: "systemic", q0 },
    { name: "SA_Art", up: "SA", down: "Art", kind: "resistive", R: 0.08, B: 0, group: "systemic" },
    { name: "Art_Cap", up: "Art", down: "Cap", kind: "resistive", R: 0.65, B: 0, group: "systemic" },
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
      R: 0.010,
      B: 0,
      q0,
      pvOstialResistanceR: 0.010,
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

export class ModelCore {
  private readonly idx = makeIndex();
  private nodes = buildNodes();
  private edges = buildEdges();
  private readonly nodeIndex = new Map<string, number>();
  private readonly dynamicEdgeIndex = new Map<string, number>();
  private readonly valveIndex = new Map<string, number>();

  // Heart chamber models (ROADMAP S2). Active models track node.active params.
  private readonly activeModels: Partial<Record<Chamber, ActiveStressChamberModel>> = {};
  private elastanceModels = new Map<string, ElastanceChamberModel>();

  t = 0;
  x: Float64Array;
  p: CoreRuntimeParams;
  pTarget: CoreRuntimeParams;
  private lastSample: SimSample | null = null;
  private history: SimSample[] = [];
  private rhsDt = 0.001;
  private initialTBV = 0;
  // Expected TBV ledger (M5a): initialTBV + integral of (fluidRate - bleedRate).
  // The projector follows this, and health compares mass conservation against it.
  private expectedTBV = 0;
  private clampHitCount = 0;
  private tbvCorrectionMagThisBeat = 0;
  private tbvCorrectionMagLastBeat = 0;
  private tbvCorrectionLastStepMl = 0;
  private tbvCorrectionEnabled = true;

  // Steady-state detection (engine/settling.ts). The detector keeps its OWN
  // small ring of per-beat fingerprints, independent of the 1200-sample raw
  // history (which only spans ~10s), so it works across a 35-60s settle.
  private beatRing: BeatSummary[] = [];
  private beatAccum: BeatAccum | null = null;
  private totalBeats = 0;
  private opSig = ""; // operating-point signature; a change re-arms beat tracking
  // Observables snapshot taken at the last beat boundary (phi ~ integer). Used by
  // metrics() so Pmsf/vrGradient/volumes are phi-aligned (stop-phase independent)
  // like the rest of the metrics, rather than sampled at an arbitrary stop phase.
  private lastBeatObs: SimObservables | null = null;

  constructor(initial?: Partial<CoreRuntimeParams>) {
    this.p = { ...defaultParams() };
    this.pTarget = { ...this.p };
    this.x = new Float64Array(this.idx.size);
    nodeNames.forEach((n, i) => this.nodeIndex.set(n, i));
    dynamicEdgeNames.forEach((n, i) => this.dynamicEdgeIndex.set(n, i));
    valveNames.forEach((n, i) => this.valveIndex.set(n, i));
    this.rebuildActiveModels();
    this.rebuildElastanceModels();
    if (initial) {
        this.setImmediateParameters(initial);
    }
    this.reset();
  }

  reset() {
    this.x.fill(0);
    for (const n of this.nodes) {
      this.x[this.idx.node[n.name as NodeName]] = n.kind === "venousPressure"
        ? this.venousVolumeFromPtm(n, n.x0)
        : n.x0;
    }
    for (const e of this.edges) {
      if (e.kind === "dynamic" || e.kind === "valve") {
        this.x[this.idx.q[e.name as DynamicEdgeName]] = e.q0 ?? 0;
      }
      if (e.kind === "valve") {
        this.x[this.idx.xi[e.name as ValveName]] = e.xi0 ?? 0;
      }
    }
    this.x[this.idx.phi] = 0;
    this.x[this.idx.septumShift] = 0;
    for (const n of this.activeChamberNodes()) {
      const ch = n.chamber!;
      const internalIndex = this.activeInternalIndex(ch);
      const initial = this.activeModel(ch).initialInternal();
      this.x[internalIndex.c] = initial.c;
      this.x[internalIndex.a] = initial.a;
      this.x[internalIndex.r] = initial.r;
    }
    this.t = 0;
    this.history = [];
    this.lastSample = this.sample();
    this.initialTBV = this.lastSample.TBV;
    this.expectedTBV = this.initialTBV;
    this.clampHitCount = 0;
    this.tbvCorrectionMagThisBeat = 0;
    this.tbvCorrectionMagLastBeat = 0;
    this.tbvCorrectionLastStepMl = 0;
    this.clearBeatTracking();
  }

  setTargetParameters(patch: ParameterPatch) {
    this.pTarget = { ...this.pTarget, ...patch };
    if (patch.nodeOverrides || patch.edgeOverrides) {
        this.setImmediateParameters({ nodeOverrides: patch.nodeOverrides, edgeOverrides: patch.edgeOverrides });
    }
  }

  get speed() {
    return this.pTarget.speed;
  }

  setImmediateParameters(patch: ParameterPatch) {
    this.p = { ...this.p, ...patch };
    this.pTarget = { ...this.pTarget, ...patch };
    
    // Apply advanced overrides to nodes and edges by deep merging
    this.nodes = buildNodes().map(n => {
        if (this.p.nodeOverrides?.[n.name]) {
            const overrides = this.p.nodeOverrides[n.name];
            const updated = { ...n, ...overrides };
            if (n.active && overrides.active) {
                updated.active = { ...n.active, ...(overrides.active as any) };
            }
            return updated;
        }
        return n;
    });

    this.edges = buildEdges().map(e => {
        const edge = this.p.edgeOverrides?.[e.name] ? { ...e, ...this.p.edgeOverrides[e.name] } : e;
        return this.configurePVOstialEdge(edge);
    });

    this.rebuildActiveModels();
    this.rebuildElastanceModels();
    this.smoothParams(0); // Applies clamps
    if (this.lastSample) this.sanitizeState(this.x);
    // Re-arm steady-state detection if the operating point actually changed, so
    // isSettled() never reports settled from a previous operating point (§2.4).
    // Unchanged params (the live loop re-applies the same patch every frame) do
    // not clear, so the live sim can still reach "settled".
    const sig = JSON.stringify({ ...this.p, speed: 0 });
    if (sig !== this.opSig) {
      this.opSig = sig;
      this.clearBeatTracking();
    }
  }

  initializeVenousPressuresForTargetTBV(targetTBV: number) {
    if (Number.isFinite(targetTBV) && targetTBV > 0) {
      this.expectedTBV = targetTBV;
      this.correctVenousPressuresToExpectedTBV({
        gain: 1,
        maxTotalCorrectionMl: Infinity,
        maxNodeVolumeMl: Infinity,
      });
      for (let i = 0; i < 16; i++) {
        const err = targetTBV - this.totalBloodVolume(this.computePressures(this.x));
        if (Math.abs(err) < 1e-6) break;
        this.correctVenousPressuresToExpectedTBV({
          gain: 1,
          maxTotalCorrectionMl: Infinity,
          maxNodeVolumeMl: Infinity,
        });
      }
    }
    this.clearBeatTracking(); // volume change re-arms steady-state detection
    this.lastSample = this.sample();
    this.initialTBV = this.lastSample.TBV;
    this.expectedTBV = this.initialTBV;
    this.tbvCorrectionMagThisBeat = 0;
    this.tbvCorrectionMagLastBeat = 0;
    this.tbvCorrectionLastStepMl = 0;
  }

  step(dt: number) {
    this.rhsDt = Math.max(dt, 1e-6);
    this.smoothParams(dt);

    // Hemorrhage / fluid ledger (M5a): mL/min -> mL/s. Clamped to a safe range.
    // Only advances when projectTBV is on, since the projector is the only thing
    // that applies the ledger to the state; otherwise bleed/fluid is a no-op and
    // we must not drift expectedTBV away from the (conserved) actual TBV.
    if (this.p.projectTBV) {
      const netFlowMlPerS = (this.p.fluidRate - this.p.bleedRate) / 60;
      this.expectedTBV = clamp(this.expectedTBV + netFlowMlPerS * dt, 1000, 12000);
    }

    const k1 = this.rhs(this.x);
    const pred = new Float64Array(this.x.length);
    for (let i = 0; i < this.x.length; i++) pred[i] = this.x[i] + dt * k1[i];
    this.sanitizeState(pred);
    const k2 = this.rhs(pred);
    for (let i = 0; i < this.x.length; i++) this.x[i] += 0.5 * dt * (k1[i] + k2[i]);
    this.t += dt;
    this.sanitizeState(this.x);
    if (this.p.projectTBV && this.tbvCorrectionEnabled) this.correctVenousPressuresToExpectedTBV();
  }

  setTBVCorrectionEnabled(enabled: boolean): void {
    this.tbvCorrectionEnabled = enabled;
  }

  resetTBVCorrectionCounters(): void {
    this.tbvCorrectionMagThisBeat = 0;
    this.tbvCorrectionMagLastBeat = 0;
    this.tbvCorrectionLastStepMl = 0;
  }

  runFor(seconds: number, dt = 0.001, sampleHz = 60): SimSample[] {
    const samples: SimSample[] = [];
    const sampleInterval = 1 / sampleHz;
    let sampleAt = Math.floor((this.t + 1e-9) / sampleInterval) * sampleInterval + sampleInterval;
    const tEnd = this.t + seconds - 1e-9;
    while (this.t < tEnd) {
      this.step(dt);
      if (this.t >= sampleAt) {
        const s = this.sample();
        samples.push(s);
        this.history.push(s);
        if (this.history.length > 12000) this.history.shift();
        sampleAt += sampleInterval;
      }
    }
    return samples;
  }

  sample(): SimSample {
    const pack = this.computePressures(this.x);
    const flows = this.computeFlows(this.x, pack);
    const laReservoir = this.laReservoirDebugFields(this.x, pack.Vphys[this.nodeIndex.get("LA")!]);
    const pvOstial = this.pvOstialDebugFields(this.x, pack, flows);
    const lvInternal = this.activeInternalIndex("LV");
    const rvInternal = this.activeInternalIndex("RV");
    const laInternal = this.activeInternalIndex("LA");
    const raInternal = this.activeInternalIndex("RA");
    const qAo = flows[this.edgeIndex("AoV")];
    const qMV = flows[this.edgeIndex("MV")];
    const tvFlow = flows[this.edgeIndex("TV")];
    const pvFlow = flows[this.edgeIndex("PV")];
    const pLv = pack.P[this.nodeIndex.get("LV")!];
    const pAo = pack.P[this.nodeIndex.get("Ao")!];
    const lap = pack.P[this.nodeIndex.get("LA")!];
    const qLAD = flows[this.edgeIndex("Ao_LAD")];
    const qLCx = flows[this.edgeIndex("Ao_LCx")];
    const qRCA = flows[this.edgeIndex("Ao_RCA")];
    const rap = pack.P[this.nodeIndex.get("RA")!];
    const rvp = pack.P[this.nodeIndex.get("RV")!];
    const pap = pack.P[this.nodeIndex.get("PA")!];
    const aovLoss = this.effectiveLosses(this.edges[this.edgeIndex("AoV")], pLv, pAo, this.x);
    const aovResistiveDrop = aovLoss.R * qAo;
    const aovQuadraticDrop = aovLoss.B * qAo * Math.abs(qAo);
    const lvPressureTerms = this.p.heartModel === "activeStress"
      ? this.activeModel("LV").debugPressureTerms(pack.VLVeff, { c: this.x[lvInternal.c], a: this.x[lvInternal.a], r: this.x[lvInternal.r] }, this.chamberCtx("LV", this.x))
      : undefined;
    const rvPressureTerms = this.p.heartModel === "activeStress"
      ? this.activeModel("RV").debugPressureTerms(pack.VRVeff, { c: this.x[rvInternal.c], a: this.x[rvInternal.a], r: this.x[rvInternal.r] }, this.chamberCtx("RV", this.x))
      : undefined;
    const lvElastance = this.ventricularElastanceSignals("LV", pack.VLVeff, pack.PLVfw, this.x);
    const rvElastance = this.ventricularElastanceSignals("RV", pack.VRVeff, pack.PRVfw, this.x);
    const s: SimSample = {
      t: this.t,
      AoP: pack.P[this.nodeIndex.get("Ao")!],
      PAP: pap,
      LAP: lap,
      RAP: rap,
      LVP: pLv,
      RVP: rvp,
      QAo: qAo,
      QPA: pvFlow,
      QPV: pvFlow,
      QMV: qMV,
      QTV: tvFlow,
      PVF: flows[this.edgeIndex("PVein_LA")],
      SVF: flows[this.edgeIndex("VC_RA")],
      QCapSV: flows[this.edgeIndex("Cap_SV")],
      QPArtPCap: flows[this.edgeIndex("PArt_PCap")],
      QCorLAD: qLAD,
      QCorLCx: qLCx,
      QCorRCA: qRCA,
      QCorTotal: qLAD + qLCx + qRCA,
      QCS: flows[this.edgeIndex("CS_RA")],
      VLV: pack.Vphys[this.nodeIndex.get("LV")!],
      VRV: pack.Vphys[this.nodeIndex.get("RV")!],
      VLA: pack.Vphys[this.nodeIndex.get("LA")!],
      VRA: pack.Vphys[this.nodeIndex.get("RA")!],
      VSystemicVenous: pack.Vphys[this.nodeIndex.get("SV")!] + pack.Vphys[this.nodeIndex.get("VC")!],
      VPulmonaryVenous: pack.Vphys[this.nodeIndex.get("PCap")!] + pack.Vphys[this.nodeIndex.get("PVen")!] + pack.Vphys[this.nodeIndex.get("PVein")!],
      P_PVein: pack.P[this.nodeIndex.get("PVein")!],
      phi: this.x[this.idx.phi],
      aLV: clamp(this.x[this.activeInternalIndex("LV").a], 0, 1),
      aRV: clamp(this.x[this.activeInternalIndex("RV").a], 0, 1),
      aLA: clamp(this.x[laInternal.a], 0, 1),
      aRA: clamp(this.x[raInternal.a], 0, 1),
      cRA: Math.max(this.x[raInternal.c], 0),
      rLA: clamp(this.x[laInternal.r], 0, Math.max(this.activeModel("LA").ap.reservoirStrokeMl ?? 0, 0)),
      rRA: clamp(this.x[raInternal.r], 0, Math.max(this.activeModel("RA").ap.reservoirStrokeMl ?? 0, 0)),
      xiMV: clamp(this.x[this.idx.xi.MV], 0, 1),
      xiAoV: clamp(this.x[this.idx.xi.AoV], 0, 1),
      xiTV: clamp(this.x[this.idx.xi.TV], 0, 1),
      xiPV: clamp(this.x[this.idx.xi.PV], 0, 1),
      dP_MV: lap - pLv,
      dP_AoV: pLv - pAo,
      dP_TV: rap - rvp,
      dP_PV: rvp - pap,
      AoV_areaRatio: aovLoss.areaRatio,
      AoV_loss_R: aovResistiveDrop,
      AoV_loss_B: aovQuadraticDrop,
      AoV_loss_residual: (pLv - pAo) - aovResistiveDrop - aovQuadraticDrop,
      LVPressureFloorHit01: lvPressureTerms?.pressureFloorHit01 ?? 0,
      RVPressureFloorHit01: rvPressureTerms?.pressureFloorHit01 ?? 0,
      ELV_active: lvElastance.active,
      ERV_active: rvElastance.active,
      ELV_timeVarying: lvElastance.timeVarying,
      ERV_timeVarying: rvElastance.timeVarying,
      ...pvOstial,
      ...laReservoir,
      Pperi: pack.Pperi,
      Ppc: pack.Ppc,
      VHeart: pack.VHeart,
      septumShiftMl: pack.septumShiftMl,
      VLVeff: pack.VLVeff,
      VRVeff: pack.VRVeff,
      PLVfw: pack.PLVfw,
      PRVfw: pack.PRVfw,
      PVI_LV: pack.PVI_LV,
      PVI_RV: pack.PVI_RV,
      septalForceMmHg: pack.septalForceMmHg,
      PLADArt: pack.P[this.nodeIndex.get("LAD_Art")!],
      PLCxArt: pack.P[this.nodeIndex.get("LCx_Art")!],
      PRCAArt: pack.P[this.nodeIndex.get("RCA_Art")!],
      PCS: pack.P[this.nodeIndex.get("CS")!],
      PimLAD: pack.PimLAD,
      PimLCx: pack.PimLCx,
      PimRCA: pack.PimRCA,
      TBV: this.totalBloodVolume(pack)
    };
    this.trackBeat(s);
    this.lastSample = s;
    return s;
  }

  /** Feed a sample to the per-beat fingerprint accumulator (steady-state detection). */
  private trackBeat(s: SimSample): void {
    // Ignore a repeated sample at the same t (e.g. a bare sample() with no step),
    // which would otherwise double-count into the current beat.
    if (this.beatAccum !== null && s.t === this.beatAccum.lastT) return;
    const beat = Math.floor(s.phi);
    if (this.beatAccum === null) {
      this.beatAccum = this.newBeatAccum(beat, s);
    } else if (beat > this.beatAccum.beat && this.beatAccum.count >= 8) {
      // Close the completed beat into a fingerprint and start a fresh one.
      if (beat - this.beatAccum.beat > 1 && this.clampHitCount < 1000) {
        console.warn(`Settling: skipped beat(s) ${this.beatAccum.beat}->${beat}; sampleHz too low for HR?`);
      }
      this.beatRing.push(this.finalizeBeat(this.beatAccum));
      if (this.beatRing.length > 8) this.beatRing.shift();
      this.totalBeats++;
      this.tbvCorrectionMagLastBeat = this.tbvCorrectionMagThisBeat;
      this.tbvCorrectionMagThisBeat = 0;
      this.beatAccum = this.newBeatAccum(beat, s);
    }
    const a = this.beatAccum;
    a.count++;
    a.lastT = s.t;
    a.sumAoP += s.AoP; a.maxAoP = Math.max(a.maxAoP, s.AoP); a.minAoP = Math.min(a.minAoP, s.AoP);
    a.sumPAP += s.PAP; a.maxPAP = Math.max(a.maxPAP, s.PAP); a.minPAP = Math.min(a.minPAP, s.PAP);
    a.sumRAP += s.RAP; a.sumLAP += s.LAP;
    if (s.VLV > a.maxVLV) { a.maxVLV = s.VLV; a.lvEdp = s.LVP; } // EDP = pressure at end-diastole
    a.minVLV = Math.min(a.minVLV, s.VLV);
    if (s.VRV > a.maxVRV) { a.maxVRV = s.VRV; a.rvEdp = s.RVP; }
    a.minVRV = Math.min(a.minVRV, s.VRV);
    a.tbv = s.TBV;
    // Stroke volume = trapezoidal integral of positive valve flow over the beat.
    if (a.hasPrev) {
      const dt = s.t - a.prevT;
      a.svL += 0.5 * (Math.max(0, a.prevQAo) + Math.max(0, s.QAo)) * dt;
      a.svR += 0.5 * (Math.max(0, a.prevQPA) + Math.max(0, s.QPA)) * dt;
    }
    a.prevQAo = s.QAo; a.prevQPA = s.QPA; a.prevT = s.t; a.hasPrev = true;
  }

  private newBeatAccum(beat: number, s: SimSample): BeatAccum {
    return {
      beat, count: 0, lastT: NaN,
      sumAoP: 0, maxAoP: -Infinity, minAoP: Infinity,
      sumPAP: 0, maxPAP: -Infinity, minPAP: Infinity,
      sumRAP: 0, sumLAP: 0,
      svL: 0, svR: 0, prevQAo: s.QAo, prevQPA: s.QPA, prevT: s.t, hasPrev: false,
      maxVLV: -Infinity, minVLV: Infinity, maxVRV: -Infinity, minVRV: Infinity,
      lvEdp: s.LVP, rvEdp: s.RVP,
      tbv: s.TBV,
    };
  }

  private finalizeBeat(a: BeatAccum): BeatSummary {
    const n = Math.max(a.count, 1);
    // Snapshot observables at the beat boundary once: reused for the fingerprint
    // below AND by metrics() (phi-aligned, stop-phase independent).
    const obs = this.debugObservables();
    this.lastBeatObs = obs;
    const vals: Record<SignalKey, number> = {
      aopMean: a.sumAoP / n, aopSys: a.maxAoP, aopDia: a.minAoP,
      papMean: a.sumPAP / n, papSys: a.maxPAP, papDia: a.minPAP,
      rapMean: a.sumRAP / n, lapMean: a.sumLAP / n,
      svL: a.svL, svR: a.svR,
      edvL: a.maxVLV, esvL: a.minVLV, edvR: a.maxVRV, esvR: a.minVRV,
      lvEdp: a.lvEdp, rvEdp: a.rvEdp,
      pmsf: obs.Pmsf, tbv: a.tbv,
    };
    return { beat: a.beat, vals };
  }

  /** Reset the steady-state beat tracker. Call after an external clock jump
   *  (e.g. aligning core.t to another instance), since that breaks the in-flight
   *  beat's trapezoidal-dt and would corrupt one fingerprint. */
  clearBeatTracking(): void {
    this.beatRing = [];
    this.beatAccum = null;
    this.totalBeats = 0;
    this.lastBeatObs = null;
  }

  /** Periodic steady-state assessment (read-only). Hemorrhage/fluid => forced-trend.
   *  The 0.5 mL/min threshold matches the ledger's practical "no-op" floor: a
   *  smaller net flow advances expectedTBV by <0.005 mL/beat, far below the TBV
   *  convergence band, so it is intentionally allowed to settle. */
  assessSteadyState(policy: SettlePolicy = DEFAULT_SETTLE_POLICY): SettleStatus {
    if (this.p.projectTBV && Math.abs(this.p.fluidRate - this.p.bleedRate) > 0.5) {
      return { settled: false, reason: "forced-trend", beats: this.totalBeats, worstSignal: null, worstDelta: NaN };
    }
    return assessBeatRing(this.beatRing, this.totalBeats, policy);
  }

  isSettled(policy: SettlePolicy = DEFAULT_SETTLE_POLICY): boolean {
    return this.assessSteadyState(policy).settled;
  }

  /**
   * Advance the model until it reaches periodic steady state, or the cap, or a
   * forced trend. Deterministic for a given dt/platform (fixed-step integration,
   * no Date/random); the cap bounds elapsed sim time.
   */
  settleToSteady(policy: SettlePolicy = DEFAULT_SETTLE_POLICY, dt = 0.001, sampleHz = 120): SettleStatus {
    const startT = this.t;
    const forced = this.assessSteadyState(policy);
    if (forced.reason === "forced-trend") {
      return { ...forced, actualSeconds: 0 };
    }
    // Bound on elapsed SIM time so the cap is robust for any dt (and the loop
    // runs the same number of steps for a given dt on a given platform).
    const sliceSeconds = 0.25;
    while (this.t - startT < policy.capSeconds) {
      this.runFor(sliceSeconds, dt, sampleHz);
      const st = this.assessSteadyState(policy);
      if (st.settled) {
        // Run a phase-margin beat or two past convergence.
        const beatSeconds = (60 / Math.max(this.p.HR, 1)) * policy.postSettleBeats;
        this.runFor(beatSeconds, dt, sampleHz);
        return { ...st, actualSeconds: this.t - startT };
      }
    }
    return { ...this.assessSteadyState(policy), reason: "cap", settled: false, actualSeconds: this.t - startT };
  }

  /**
   * Phi-aligned measurement window: the most recent FULLY-completed cardiac beat
   * (samples spanning phi in [b, b+1], b = floor(phi_now) - 1, closed by the
   * first sample of the in-progress beat). This makes metrics() independent of
   * the stop phase — a window anchored to `t` instead includes a phase-dependent
   * slice of two beats, which jitters SV/EDP at the sample-grid level and breaks
   * fingerprint reproducibility across save/load. Falls back to the in-progress
   * beat, then the last sample, when <1 complete beat of history exists.
   */
  private lastCompleteBeatWindow(): SimSample[] {
    const h = this.history;
    if (h.length < 2) return this.lastSample ? [this.lastSample] : [...h];
    const curBeat = Math.floor(h[h.length - 1].phi);
    const target = curBeat - 1;
    let start = -1;
    let end = -1;
    for (let i = 0; i < h.length; i++) {
      const b = Math.floor(h[i].phi);
      if (start === -1 && b === target) start = i;
      else if (start !== -1 && b > target) { end = i; break; } // first sample of next beat = closing boundary
    }
    if (start !== -1 && end !== -1 && end - start >= 5) return h.slice(start, end + 1);
    const cur = h.filter((sample) => Math.floor(sample.phi) === curBeat);
    if (cur.length >= 5) return cur;
    return this.lastSample ? [this.lastSample] : [h[h.length - 1]];
  }

  metrics(): SimMetrics {
    const data = this.lastCompleteBeatWindow();
    const avg = (key: keyof SimSample) => data.reduce((acc, sample) => acc + Number(sample[key]), 0) / Math.max(data.length, 1);
    const min = (key: keyof SimSample) => Math.min(...data.map((sample) => Number(sample[key])));
    const max = (key: keyof SimSample) => Math.max(...data.map((sample) => Number(sample[key])));
    const integratePositive = (key: keyof SimSample) => {
      if (data.length < 2) return 0;
      let area = 0;
      for (let i = 1; i < data.length; i++) {
        const dt = data[i].t - data[i - 1].t;
        area += 0.5 * dt * (Math.max(0, Number(data[i][key])) + Math.max(0, Number(data[i - 1][key])));
      }
      return area;
    };
    const integratePositiveWhen = (key: keyof SimSample, predicate: (sample: SimSample) => boolean) => {
      if (data.length < 2) return 0;
      let area = 0;
      for (let i = 1; i < data.length; i++) {
        if (!predicate(data[i]) || !predicate(data[i - 1])) continue;
        const dt = data[i].t - data[i - 1].t;
        area += 0.5 * dt * (Math.max(0, Number(data[i][key])) + Math.max(0, Number(data[i - 1][key])));
      }
      return area;
    };
    const diastolicFraction = (key: keyof SimSample) => {
      const total = integratePositive(key);
      if (total <= 1e-9) return 0;
      return clamp(integratePositiveWhen(key, (sample) => sample.QAo <= 5) / total, 0, 1);
    };
    const SV_L = integratePositive("QAo");
    const SV_R = integratePositive("QPA");
    const CO_L = (SV_L * this.p.HR) / 1000;
    const CO_R = (SV_R * this.p.HR) / 1000;
    const EDV_L = max("VLV");
    const ESV_L = min("VLV");
    const EDV_R = max("VRV");
    const ESV_R = min("VRV");
    const lvEdSample = data.reduce((best, sample) => sample.VLV > best.VLV ? sample : best, data[0]);
    const rvEdSample = data.reduce((best, sample) => sample.VRV > best.VRV ? sample : best, data[0]);
    const aovEjection = data.filter((sample) => sample.QAo > 50 && sample.xiAoV > 0.8);
    const aovMeanGradient = aovEjection.length > 0
      ? aovEjection.reduce((acc, sample) => acc + sample.dP_AoV, 0) / aovEjection.length
      : 0;
    const aovPeakGradient = aovEjection.length > 0
      ? Math.max(...aovEjection.map((sample) => sample.dP_AoV))
      : 0;
    // Observables from the last beat boundary (phi-aligned) so Pmsf/vrGradient/
    // volumes are stop-phase independent like the rest of metrics; fall back to a
    // live read only before the first beat closes (e.g. a bare step() loop).
    const obs = this.lastBeatObs ?? this.debugObservables();
    const corLAD = avg("QCorLAD") * 60;
    const corLCx = avg("QCorLCx") * 60;
    const corRCA = avg("QCorRCA") * 60;
    const corTotal = avg("QCorTotal") * 60;
    const corPctCO = CO_L > 1e-9 ? 100 * corTotal / (CO_L * 1000) : 0;
    const totalCorExpected = Math.max(CO_L * 1000 * 0.05, 1);
    const leftDemand = (this.p.HR / 75)
      * (this.p.lvTmaxScale / 0.70)
      * Math.pow(Math.max(avg("LVP"), 1) / 90, 0.4);
    const rightDemand = (this.p.HR / 75)
      * this.p.rvTmaxScale
      * Math.pow(Math.max(avg("RVP"), 1) / 25, 0.4);
    const leftExpected = totalCorExpected * (CORONARY_SPECS.LAD.restingShare + CORONARY_SPECS.LCx.restingShare);
    const rightExpected = totalCorExpected * CORONARY_SPECS.RCA.restingShare;
    return {
      HR: this.p.HR,
      AoPMean: avg("AoP"),
      AoPSys: max("AoP"),
      AoPDia: min("AoP"),
      PAPMean: avg("PAP"),
      RAPMean: avg("RAP"),
      LAPMean: avg("LAP"),
      LVEDPApprox: lvEdSample?.LVP ?? avg("LVP"),
      RVEDPApprox: rvEdSample?.RVP ?? avg("RVP"),
      AoVMeanGradient: aovMeanGradient,
      AoVPeakGradient: aovPeakGradient,
      SV_L,
      SV_R,
      CO_L,
      CO_R,
      EF_LApprox: EDV_L > 1e-6 ? clamp((EDV_L - ESV_L) / EDV_L, 0, 1) : 0,
      EF_RApprox: EDV_R > 1e-6 ? clamp((EDV_R - ESV_R) / EDV_R, 0, 1) : 0,
      TBV: avg("TBV"),
      Pmsf: obs.Pmsf,
      vrGradient: obs.vrGradient,
      stressedVolumeSystemic: obs.stressedVolumeSystemic,
      unstressedVolumeSystemic: obs.unstressedVolumeSystemic,
      CorFlowLADMlMin: corLAD,
      CorFlowLCxMlMin: corLCx,
      CorFlowRCAMlMin: corRCA,
      CorFlowTotalMlMin: corTotal,
      CorPctCO: corPctCO,
      CorDiastolicFractionLAD: diastolicFraction("QCorLAD"),
      CorDiastolicFractionLCx: diastolicFraction("QCorLCx"),
      CorDiastolicFractionRCA: diastolicFraction("QCorRCA"),
      FFR_LAD: avg("AoP") > 1e-9 ? avg("PLADArt") / avg("AoP") : 0,
      FFR_LCx: avg("AoP") > 1e-9 ? avg("PLCxArt") / avg("AoP") : 0,
      FFR_RCA: avg("AoP") > 1e-9 ? avg("PRCAArt") / avg("AoP") : 0,
      CorSupplyDemandL: (corLAD + corLCx) / Math.max(leftExpected * leftDemand, 1),
      CorSupplyDemandR: corRCA / Math.max(rightExpected * rightDemand, 1),
    };
  }

  passivePressureAt(chamber: Chamber, volumeMl: number): number {
    if (this.p.heartModel !== "activeStress") return 0;
    const pack = this.computePressures(this.x);
    return pack.Pperi + this.activeModel(chamber).passivePressure(volumeMl, this.chamberCtx(chamber, this.x));
  }

  passivePressureVolumeCurve(
    chamber: Chamber,
    volumeMinMl: number,
    volumeMaxMl: number,
    pointCount = 64,
  ): Array<{ v: number; p: number }> {
    const n = Math.max(2, Math.floor(pointCount));
    const lo = Math.min(volumeMinMl, volumeMaxMl);
    const hi = Math.max(volumeMinMl, volumeMaxMl);
    const points: Array<{ v: number; p: number }> = [];
    for (let i = 0; i < n; i++) {
      const alpha = n === 1 ? 0 : i / (n - 1);
      const v = lo + alpha * (hi - lo);
      points.push({ v, p: this.passivePressureAt(chamber, v) });
    }
    return points;
  }

  health(): SimulationHealth {
    const m = this.metrics();
    // Use the CURRENT state TBV (not a possibly-stale lastSample), so a bare
    // step() loop still reports mass conservation correctly. Compared against the
    // EXPECTED TBV (ledger) so intended hemorrhage/fluid is not flagged — only
    // true integrator drift is. (Meaningful mainly with projectTBV=false; with
    // the projector on, actual TBV is pinned to expectedTBV by construction.)
    const currentTBV = this.totalBloodVolume(this.computePressures(this.x));
    const tbvDriftMl = currentTBV - this.expectedTBV;
    const tbvDriftPercent = this.expectedTBV > 0 ? 100 * tbvDriftMl / this.expectedTBV : 0;
    const leftRightFlowMismatchLMin = Math.abs(m.CO_L - m.CO_R);
    const cycleMetricDelta = this.computeCycleMetricDelta();
    const messages: string[] = [];

    let numericalStability: SimulationHealthStatus = "ok";
    for (const value of this.x) {
      if (!Number.isFinite(value)) {
        numericalStability = "failed";
        messages.push("Non-finite state detected.");
        break;
      }
    }
    if (this.clampHitCount > 0) messages.push(`State clamp used ${this.clampHitCount} times.`);

    let massConservation: SimulationHealthStatus = "ok";
    if (Math.abs(tbvDriftPercent) > 1.0) {
      massConservation = "failed";
      messages.push(`TBV drift ${tbvDriftMl.toFixed(2)} mL (${tbvDriftPercent.toFixed(3)}%).`);
    } else if (Math.abs(tbvDriftPercent) > 0.2) {
      massConservation = "warning";
      messages.push(`TBV drift warning ${tbvDriftMl.toFixed(2)} mL (${tbvDriftPercent.toFixed(3)}%).`);
    }

    let flowBalance: SimulationHealthStatus = "ok";
    if (leftRightFlowMismatchLMin > 2.0) {
      flowBalance = "failed";
      messages.push(`Left/right CO mismatch ${leftRightFlowMismatchLMin.toFixed(2)} L/min.`);
    } else if (leftRightFlowMismatchLMin > 1.0) {
      flowBalance = "warning";
      messages.push(`Left/right CO mismatch warning ${leftRightFlowMismatchLMin.toFixed(2)} L/min.`);
    }

    // Health means MODEL/NUMERICAL validity, NOT physiological normalcy.
    // Simulating abnormal (e.g. shock, hypertension) states is a primary use
    // case, so being outside the normal-adult range is never a warning.
    const physiologicalRange: SimulationHealthStatus = "ok";

    if (cycleMetricDelta > 0.25) messages.push(`Cycle-to-cycle metric delta ${cycleMetricDelta.toFixed(3)}; not settled.`);

    const status: SimulationHealthStatus = [numericalStability, massConservation, flowBalance].includes("failed")
      ? "failed"
      : ([numericalStability, massConservation, flowBalance].includes("warning") || cycleMetricDelta > 0.25 || this.clampHitCount > 0)
        ? "warning"
        : "ok";

    return {
      status,
      tbvDriftMl,
      tbvDriftPercent,
      leftRightFlowMismatchLMin,
      cycleMetricDelta,
      clampHitCount: this.clampHitCount,
      numericalStability,
      massConservation,
      flowBalance,
      physiologicalRange,
      messages
    };
  }

  private computeCycleMetricDelta(): number {
    const T = 60 / Math.max(this.p.HR, 1);
    const a = this.history.filter((sample) => sample.t >= this.t - T);
    const b = this.history.filter((sample) => sample.t < this.t - T && sample.t >= this.t - 2 * T);
    if (a.length < 5 || b.length < 5) return 0;
    const mean = (xs: SimSample[], key: keyof SimSample) => xs.reduce((acc, sample) => acc + Number(sample[key]), 0) / xs.length;
    const denom = (Math.abs(mean(a, "AoP")) + Math.abs(mean(b, "AoP")) + 1);
    const dMap = Math.abs(mean(a, "AoP") - mean(b, "AoP")) / denom;
    const dLap = Math.abs(mean(a, "LAP") - mean(b, "LAP")) / (Math.abs(mean(a, "LAP")) + Math.abs(mean(b, "LAP")) + 1);
    return Math.max(dMap, dLap);
  }

  private rhs(x: Float64Array): Float64Array {
    const dy = new Float64Array(x.length);
    const pack = this.computePressures(x);
    const flows = this.computeFlows(x, pack);
    const balance = new Float64Array(nodeNames.length);

    for (let ei = 0; ei < this.edges.length; ei++) {
      const e = this.edges[ei];
      const q = flows[ei];
      balance[this.nodeIndex.get(e.up)!] -= q;
      balance[this.nodeIndex.get(e.down)!] += q;
    }

    for (let ni = 0; ni < this.nodes.length; ni++) {
      const n = this.nodes[ni];
      const stateIndex = this.idx.node[n.name as NodeName];
      if (n.kind === "venousPressure") {
        dy[stateIndex] = balance[ni];
      } else {
        dy[stateIndex] = clamp(balance[ni], -2500, 2500);
      }
    }

    for (const e of this.edges) {
      if (e.kind !== "dynamic" && e.kind !== "valve") continue;
      const qi = this.idx.q[e.name as DynamicEdgeName];
      const up = this.nodeIndex.get(e.up)!;
      const down = this.nodeIndex.get(e.down)!;
      const Pu = pack.P[up];
      const Pd = pack.P[down];
      const PdEff = this.downstreamEffective(e, Pd);
      const q = x[qi];
      const { R, B, areaRatio } = this.effectiveLosses(e, Pu, Pd, x);
      let L = e.kind === "valve" ? Math.max((this.p as any)[`${e.name}_L`] ?? e.L ?? 0.001, 1e-6) : Math.max(e.L ?? 0.001, 1e-6);
      if (e.kind !== "valve" && e.useChiResistance) {
        L = L / Math.max(areaRatio, 1e-6);
      }
      const h = Math.max(this.rhsDt, 1e-6);
      const Reff = R + B * Math.abs(q);
      let qNext = (q + (h / L) * (Pu - PdEff)) / (1 + (h * Reff) / L);
      
      dy[qi] = clamp((qNext - q) / h, -40000, 40000);
    }

    for (const vName of valveNames) {
      const e = this.edges[this.edgeIndex(vName)];
      const xiIndex = this.idx.xi[vName];
      const dP = pack.P[this.nodeIndex.get(e.up)!] - pack.P[this.nodeIndex.get(e.down)!];
      const kOpen = (this.p as any)[`${vName}_kOpen`] ?? e.kOpen ?? 2.0;
      const tauOpen = (this.p as any)[`${vName}_tauOpen`] ?? e.tauOpen ?? 0.012;
      const tauClose = (this.p as any)[`${vName}_tauClose`] ?? e.tauClose ?? 0.025;
      
      const xiEq = sigmoid(kOpen * (dP - (e.dP0 ?? 0)));
      const tau = dP > 0 ? tauOpen : tauClose;
      dy[xiIndex] = clamp((xiEq - x[xiIndex]) / Math.max(tau, 1e-5), -80, 80);
    }

    dy[this.idx.phi] = this.p.HR / 60;
    for (const n of this.activeChamberNodes()) {
      const ch = n.chamber!;
      const internalIndex = this.activeInternalIndex(ch);
      const nodeIndex = this.idx.node[n.name as NodeName];
      const internal = { c: x[internalIndex.c], a: x[internalIndex.a], r: x[internalIndex.r] };
      const chamberVolume = ch === "LV"
        ? pack.VLVeff
        : ch === "RV"
          ? pack.VRVeff
          : x[nodeIndex];
      const dInternal = this.activeModel(ch).internalDerivatives(chamberVolume, internal, this.chamberCtx(ch, x));
      dy[internalIndex.c] = dInternal.cDot;
      dy[internalIndex.a] = dInternal.aDot;
      dy[internalIndex.r] = dInternal.rDot;
    }

    const shiftState = x[this.idx.septumShift];
    dy[this.idx.septumShift] = clamp(septalShiftDerivative({
      VLV: pack.Vphys[this.nodeIndex.get("LV")!],
      VRV: pack.Vphys[this.nodeIndex.get("RV")!],
      shiftMl: this.p.septalCouplingEnabled ? pack.septumShiftMl : shiftState,
      PLVfw: pack.PLVfw,
      PRVfw: pack.PRVfw,
    }, this.septumParams()), -400, 400);

    return dy;
  }

  private computePressures(x: Float64Array): PressurePack {
    const P = new Float64Array(nodeNames.length);
    const Ptm = new Float64Array(nodeNames.length);
    const Vphys = new Float64Array(nodeNames.length);
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      const xi = this.idx.node[n.name as NodeName];
      Vphys[i] = n.kind === "venousPressure" ? x[xi] : clamp(x[xi], 1, 1000);
    }

    const lvNode = this.nodes[this.nodeIndex.get("LV")!];
    const rvNode = this.nodes[this.nodeIndex.get("RV")!];
    const VLV = Vphys[this.nodeIndex.get("LV")!];
    const VRV = Vphys[this.nodeIndex.get("RV")!];
    const VLA = Vphys[this.nodeIndex.get("LA")!];
    const VRA = Vphys[this.nodeIndex.get("RA")!];
    const peri = pericardialPressure({
      VLV,
      VRV,
      VLA,
      VRA,
      Pth: this.Pth(),
    }, this.pericardiumParams());
    const sepParams = this.septumParams();
    const septumShiftMl = sepParams.enabled
      ? clampSeptalShift(x[this.idx.septumShift], {
        VLV,
        VRV,
        V0LV: lvNode.V0 ?? 0,
        V0RV: rvNode.V0 ?? 0,
      }, sepParams)
      : 0;
    const VLVeff = VLV + septumShiftMl;
    const VRVeff = VRV - septumShiftMl;
    const PLVfwRaw = this.heartTransmuralPressure(lvNode, VLV, x);
    const PRVfwRaw = this.heartTransmuralPressure(rvNode, VRV, x);
    const PLVfw = this.heartTransmuralPressure(lvNode, VLVeff, x);
    const PRVfw = this.heartTransmuralPressure(rvNode, VRVeff, x);
    const septalForceMmHg = septalForce({ VLV, VRV, shiftMl: septumShiftMl, PLVfw, PRVfw }, sepParams);
    const coronaryExt = this.coronaryExternalPressures(peri.Pperi, PLVfw, PRVfw);

    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      const xi = this.idx.node[n.name as NodeName];
      const Pext = this.externalPressure(n.ext ?? "none", coronaryExt);

      if (n.kind === "venousPressure") {
        const volume = x[xi];
        const ptm = this.venousPtmFromVolume(n, volume);
        Ptm[i] = ptm;
        Vphys[i] = volume;
        P[i] = Pext + ptm;
        continue;
      }

      const V = Vphys[i];
      if (n.kind === "arterial") {
        const VsEff = Math.max((n.Vs ?? 100) / Math.max(this.p.arterialStiffness, 0.25), 1);
        const s = clamp((V - this.effectiveVu(n)) / VsEff, -30, 5);
        const ptm = (n.P0 ?? 50) * (Math.exp(s) - 1);
        Ptm[i] = ptm;
        P[i] = Pext + ptm;
      } else if (n.kind === "linear") {
        const ptm = (V - this.effectiveVu(n)) / Math.max(n.C ?? 1, 1e-6);
        Ptm[i] = ptm;
        P[i] = Pext + ptm;
      } else if (n.kind === "heartElastance" || n.kind === "heartActive") {
        const ptm = n.chamber === "LV" ? PLVfw : n.chamber === "RV" ? PRVfw : this.heartTransmuralPressure(n, V, x);
        Ptm[i] = ptm;
        P[i] = peri.Pperi + ptm;
      }
    }
    return {
      P,
      Ptm,
      Vphys,
      Pperi: peri.Pperi,
      Ppc: peri.Ppc,
      VHeart: peri.Vheart,
      septumShiftMl,
      VLVeff,
      VRVeff,
      PLVfw,
      PRVfw,
      PLVfwRaw,
      PRVfwRaw,
      PVI_LV: PLVfw - PLVfwRaw,
      PVI_RV: PRVfw - PRVfwRaw,
      septalForceMmHg,
      PimLAD: coronaryExt.imLAD,
      PimLCx: coronaryExt.imLCx,
      PimRCA: coronaryExt.imRCA,
      PimLADVen: coronaryExt.imLADVen,
      PimLCxVen: coronaryExt.imLCxVen,
      PimRCAVen: coronaryExt.imRCAVen,
    };
  }

  private pericardiumParams(): PericardiumParams {
    return {
      enabled: this.p.pericardiumEnabled,
      pressureScaleMmHg: this.p.pericardialPressureScaleMmHg,
      slackVolumeMl: this.p.pericardialSlackVolumeMl,
      volumeScaleMl: this.p.pericardialVolumeScaleMl,
      softnessMl: this.p.pericardialSoftnessMl,
      biasMmHg: this.p.pericardialBiasMmHg,
      fluidMl: this.p.pericardialFluidMl,
    };
  }

  private septumParams(): SeptumParams {
    return {
      enabled: this.p.septalCouplingEnabled,
      stiffnessScale: this.p.septalStiffnessScale,
      k1MmHgPerMl: this.p.septalK1MmHgPerMl,
      k3MmHgPerMl3: this.p.septalK3MmHgPerMl3,
      dampingMmHgSecPerMl: this.p.septalDampingMmHgSecPerMl,
      maxShiftMl: this.p.septalMaxShiftMl,
      lvPressureWeight: this.p.septalLvPressureWeight,
    };
  }

  private heartTransmuralPressure(n: NodeSpec, volumeMl: number, x: Float64Array): number {
    if (!n.chamber) throw new Error(`Missing chamber for heart node ${n.name}`);
    if (this.useElastancePressure(n)) {
      return this.elastanceModels.get(n.name)!.pressure(volumeMl, { c: 0, a: 0, r: 0 }, this.chamberCtx(n.chamber, x));
    }
    if (n.kind !== "heartActive") throw new Error(`Node ${n.name} is not a heart chamber`);
    const internalIndex = this.activeInternalIndex(n.chamber);
    const internal = { c: x[internalIndex.c], a: x[internalIndex.a], r: x[internalIndex.r] };
    return this.activeModel(n.chamber).pressure(volumeMl, internal, this.chamberCtx(n.chamber, x));
  }

  private useElastancePressure(n: NodeSpec): boolean {
    if (n.kind === "heartElastance") return true;
    return n.kind === "heartActive" && this.p.heartModel === "elastance";
  }

  private computeFlows(x: Float64Array, pack: PressurePack): Float64Array {
    const flows = new Float64Array(this.edges.length);
    for (let ei = 0; ei < this.edges.length; ei++) {
      const e = this.edges[ei];
      const up = this.nodeIndex.get(e.up)!;
      const down = this.nodeIndex.get(e.down)!;
      const Pu = pack.P[up];
      const Pd = pack.P[down];
      const PdEff = this.downstreamEffective(e, Pd);
      if (e.kind === "dynamic" || e.kind === "valve") {
        flows[ei] = clamp(x[this.idx.q[e.name as DynamicEdgeName]], -DYNAMIC_FLOW_CLAMP_ML_PER_S, DYNAMIC_FLOW_CLAMP_ML_PER_S);
      } else {
        const { R, B } = this.effectiveLosses(e, Pu, Pd, x);
        flows[ei] = solveQuadraticFlow(Pu - PdEff, R, B);
      }
    }
    return flows;
  }

  /** Evaluation context handed to a ChamberModel for the given chamber. */
  private chamberCtx(chamber: Chamber, x: Float64Array): ChamberCtx {
    const isRV = chamber === "RV";
    const side: "left" | "right" = chamber === "RA" || chamber === "RV" ? "right" : "left";
    const lvVolume = x[this.idx.node.LV];
    const lvEd = 115;
    const lvEs = 45;
    const rvVolume = x[this.idx.node.RV];
    const rvEd = 135;
    const rvEs = 55;
    const pairedVentricleVolume = side === "right" ? rvVolume : lvVolume;
    const pairedEd = side === "right" ? rvEd : lvEd;
    const pairedEs = side === "right" ? rvEs : lvEs;
    const inletValve = side === "right" ? "TV" : "MV";
    const outletValve = side === "right" ? "PV" : "AoV";
    return {
      HR: this.p.HR,
      contractility: this.p.contractility,
      relaxation: this.p.relaxation,
      phi: x[this.idx.phi],
      chamber,
      avDelaySec: this.p.avDelaySec,
      atrialElectromechanicalDelaySec: this.p.atrialElectromechanicalDelaySec,
      ventricularElectromechanicalDelaySec: this.p.ventricularElectromechanicalDelaySec,
      tmaxScale: chamber === "LV" ? this.p.lvTmaxScale : isRV ? this.p.rvTmaxScale : 1,
      geomScale: chamber === "LV" ? this.p.lvGeomScale : isRV ? this.p.rvGeomScale : 1,
      caReleaseScale: chamber === "LV" ? this.p.caReleaseScale : isRV ? this.p.rvCaReleaseScale : 1,
      pairedVentricleVolumeMl: pairedVentricleVolume,
      pairedVentricleShortening01: clamp((pairedEd - pairedVentricleVolume) / Math.max(pairedEd - pairedEs, 1e-6), 0, 1),
      inletValveOpen01: clamp(x[this.idx.xi[inletValve]], 0, 1),
      outletValveOpen01: clamp(x[this.idx.xi[outletValve]], 0, 1),
      side,
      lvVolumeMl: lvVolume,
      lvShortening01: clamp((lvEd - lvVolume) / Math.max(lvEd - lvEs, 1e-6), 0, 1),
      mvOpen01: clamp(x[this.idx.xi.MV], 0, 1),
      aovOpen01: clamp(x[this.idx.xi.AoV], 0, 1),
    };
  }

  private laReservoirDebugFields(x: Float64Array, VLA: number): Partial<SimSample> | undefined {
    const model = this.activeModel("LA");
    const ap = model.ap;
    if ((ap.reservoirBranchGain ?? 0) <= 0 || (ap.reservoirStrokeMl ?? 0) <= 0) return undefined;
    const internalIndex = this.activeInternalIndex("LA");
    const internal = { c: x[internalIndex.c], a: x[internalIndex.a], r: x[internalIndex.r] };
    const state = model.reservoirBranchState(VLA, internal, this.chamberCtx("LA", x));
    return {
      qLAReservoirMl: state.qMl,
      VLABodyMl: state.vBodyMl,
      VLAReservoirMl: state.vReservoirMl,
      PLABodyMmHg: state.pBodyMmHg,
      PLAReservoirMmHg: state.pReservoirMmHg,
      PLAEquilibriumErrorMmHg: state.equilibriumErrorMmHg,
      twoBranchSolveFlag: state.solveFlag,
      reservoirSleeveOverMax01: state.sleeveOverMax01,
    };
  }

  private configurePVOstialEdge(edge: EdgeSpec): EdgeSpec {
    if (edge.name !== "PVein_LA") return edge;
    const L = Math.max(edge.pvOstialInertanceL ?? 0, 0);
    if (L <= 0) return { ...edge, kind: "resistive", L: undefined, B: edge.B ?? 0 };
    return {
      ...edge,
      kind: "dynamic",
      R: Math.max(edge.pvOstialResistanceR ?? edge.R, 1e-8),
      L,
      B: Math.max(edge.pvOstialQuadraticB ?? 0, 0),
      group: "none",
      waterfall: false,
      useChiResistance: false,
      useChiQuadratic: false,
    };
  }

  private pvOstialDebugFields(x: Float64Array, pack: PressurePack, flows: Float64Array): Partial<SimSample> | undefined {
    const edge = this.edges[this.edgeIndex("PVein_LA")];
    const q = flows[this.edgeIndex("PVein_LA")];
    if (edge.kind !== "dynamic" || Math.max(edge.L ?? 0, 0) <= 0) {
      return { PVFOstial: q };
    }
    const pVein = pack.P[this.nodeIndex.get("PVein")!];
    const lap = pack.P[this.nodeIndex.get("LA")!];
    const resistiveDrop = edge.R * q + (edge.B ?? 0) * q * Math.abs(q);
    return {
      PVFOstial: q,
      pvOstialQ: x[this.idx.q.PVein_LA],
      pvOstialResistiveDrop: resistiveDrop,
      pvOstialInertialDrop: (pVein - lap) - resistiveDrop,
    };
  }

  private activeChamberNodes(): NodeSpec[] {
    return this.nodes.filter((n) => n.kind === "heartActive" && n.chamber && n.active);
  }

  private activeInternalIndex(chamber: Chamber): { c: number; a: number; r: number } {
    const idx = this.idx.activeInternal[chamber];
    if (!idx) throw new Error(`Missing active internal state index for ${chamber}`);
    return idx;
  }

  private activeModel(chamber: Chamber): ActiveStressChamberModel {
    const model = this.activeModels[chamber];
    if (!model) throw new Error(`Missing active chamber model for ${chamber}`);
    return model;
  }

  private ventricularElastanceSignals(
    chamber: "LV" | "RV",
    effectiveVolumeMl: number,
    transmuralPressureMmHg: number,
    x: Float64Array,
  ): { active: number; timeVarying: number } {
    const node = this.nodes[this.nodeIndex.get(chamber)!];
    const unstressedVolume = node.V0 ?? 0;
    const distendingVolume = Math.max(effectiveVolumeMl - unstressedVolume, 1);
    const active = Math.max(transmuralPressureMmHg, 0) / distendingVolume;
    const fallbackPressure = this.elastanceModels
      .get(chamber)!
      .pressure(effectiveVolumeMl, { c: 0, a: 0, r: 0 }, this.chamberCtx(chamber, x));
    return {
      active,
      timeVarying: Math.max(fallbackPressure, 0) / distendingVolume,
    };
  }

  private rebuildActiveModels() {
    for (const ch of Object.keys(this.activeModels) as Chamber[]) delete this.activeModels[ch];
    for (const n of this.activeChamberNodes()) {
      const active = n.chamber === "LA" ? n.active! : { ...n.active!, reservoirBranchGain: 0, reservoirStrokeMl: 0 };
      this.activeModels[n.chamber!] = new ActiveStressChamberModel(active);
    }
  }

  /** (Re)build per-node elastance models from current node params. */
  private rebuildElastanceModels() {
    this.elastanceModels.clear();
    for (const n of this.nodes) {
      if (n.kind === "heartElastance" || n.kind === "heartActive") {
        this.elastanceModels.set(n.name, new ElastanceChamberModel({
          V0: n.V0 ?? 0,
          alpha: n.alpha ?? 0.015,
          beta: n.beta ?? 0.5,
          Ees: n.Ees ?? 1.0,
          chamber: n.chamber ?? "LV",
        }));
      }
    }
  }

  private venousCompliance(n: NodeSpec, Ptm: number): number {
    const c = (n.Ccoll ?? 5)
      + ((n.Copen ?? 50) - (n.Ccoll ?? 5)) * sigmoid((Ptm - (n.Popen ?? -1)) / Math.max(n.dOpen ?? 1, 1e-6))
      - ((n.Copen ?? 50) - (n.Cdist ?? 15)) * sigmoid((Ptm - (n.Pstiff ?? 14)) / Math.max(n.dStiff ?? 3, 1e-6));
    return Math.max(c, 1e-4);
  }

  private venousStressedVolume(n: NodeSpec, Ptm: number): number {
    const Ccoll = n.Ccoll ?? 5;
    const Copen = n.Copen ?? 50;
    const Cdist = n.Cdist ?? 15;
    const Popen = n.Popen ?? -1;
    const Pstiff = n.Pstiff ?? 14;
    const dOpen = n.dOpen ?? 1;
    const dStiff = n.dStiff ?? 3;
    return Ccoll * Ptm
      + (Copen - Ccoll) * dOpen * (softplus((Ptm - Popen) / dOpen) - softplus((0 - Popen) / dOpen))
      - (Copen - Cdist) * dStiff * (softplus((Ptm - Pstiff) / dStiff) - softplus((0 - Pstiff) / dStiff));
  }

  private venousVolumeFromPtm(n: NodeSpec, Ptm: number, params: CoreRuntimeParams = this.p): number {
    return this.effectiveVu(n, params) + this.venousStressedVolume(n, Ptm);
  }

  private venousVolumeBounds(n: NodeSpec): { min: number; max: number } {
    return {
      min: this.venousVolumeFromPtm(n, -20),
      max: this.venousVolumeFromPtm(n, 45),
    };
  }

  private venousPtmFromVolume(n: NodeSpec, targetVolume: number): number {
    const targetStressed = targetVolume - this.effectiveVu(n);
    let lo = -20;
    let hi = 45;
    const volumeAt = (ptm: number) => this.venousStressedVolume(n, ptm);
    if (targetStressed <= volumeAt(lo)) return lo;
    if (targetStressed >= volumeAt(hi)) return hi;
    for (let iter = 0; iter < 32; iter++) {
      const mid = 0.5 * (lo + hi);
      if (volumeAt(mid) < targetStressed) lo = mid;
      else hi = mid;
    }
    return 0.5 * (lo + hi);
  }

  private downstreamEffective(e: EdgeSpec, Pd: number): number {
    if (!e.waterfall) return Pd;
    const Pcoll = this.externalPressure(e.ext ?? "none") + (e.Pcrit ?? 0);
    return smoothMax(Pd, Pcoll, 0.25);
  }

  private effectiveLosses(e: EdgeSpec, Pu: number, Pd: number, x: Float64Array): { R: number; B: number; areaRatio: number } {
    let R = e.R;
    let B = e.B ?? 0;
    let areaRatio = 1.0;
    if (e.group === "systemic") R *= this.p.systemicResistance;
    if (e.group === "pulmonary") R *= this.p.pulmonaryResistance;
    if (e.group === "coronary") {
      if (!this.p.coronaryEnabled) {
        R *= 1e8;
        B = 0;
      } else {
        const segment = e.coronarySegment;
        if (segment !== "sinus") R *= this.p.coronaryResistanceScale;

        if (e.coronaryTerritory && (segment === "proximal" || segment === "distal")) {
          const spec = CORONARY_SPECS[e.coronaryTerritory];
          const activation = this.coronaryCompressionActivation(e.coronaryTerritory, x);
          const k = segment === "proximal" ? spec.proximalCompressionK : spec.distalCompressionK;
          R *= 1 + this.p.coronaryCompressionScale * k * activation;

          const reserve = 1 + (Math.max(this.p.coronaryReserveMax, 1) - 1) * clamp(this.p.coronaryVasodilator, 0, 1);
          R /= Math.max(reserve, 1e-6);
        }

        if (e.coronaryTerritory && segment === "ostial") {
          const spec = CORONARY_SPECS[e.coronaryTerritory];
          const diameterStenosis = clamp(this.p[spec.stenosisKey], 0, 0.95);
          const diameterRatio = Math.max(1 - diameterStenosis, 0.05);
          const stenosisAreaRatio = Math.max(diameterRatio * diameterRatio, 0.0025);
          const stenosisLoss = Math.min(Math.pow(stenosisAreaRatio, -2), 5000);
          R *= stenosisLoss;
          B += 0.06 * (stenosisLoss - 1);
          areaRatio = Math.min(areaRatio, stenosisAreaRatio);
        }
      }
    }

    if (e.kind === "valve") {
      const pName = e.name as ValveName;
      const vAmax = (this.p as any)[`${pName}_Amax`] ?? e.Amax ?? 1;
      const vAref = (this.p as any)[`${pName}_Aref`] ?? e.Aref ?? vAmax;
      const vAleak = (this.p as any)[`${pName}_Aleak`] ?? e.Aleak ?? 1e-4;
      const vR = (this.p as any)[`${pName}_R`] ?? e.R;
      const vB = (this.p as any)[`${pName}_B`] ?? e.B ?? 0;
      const xi = clamp(x[this.idx.xi[pName]], 0, 1);
      const valveArea = Math.max(vAleak + xi * (vAmax - vAleak), 1e-4);
      areaRatio = valveArea / Math.max(vAref, 1e-6);
      const areaLoss = Math.pow(Math.max(areaRatio, 1e-4), -2);
      R = vR * areaLoss;
      B = vB * areaLoss;
    } else if ((e.useChiResistance || e.useChiQuadratic) && this.p.useChiResistance) {
      const chi = this.edgeChi(e, Pu, Pd);
      areaRatio = chi;
      if (e.useChiResistance) R = R * Math.pow(chi, -(e.chiRExp ?? 2));
      if (e.useChiQuadratic) B = B * Math.pow(chi, -(e.chiBExp ?? 2));
    }
    return { R: Math.max(R, 1e-8), B: Math.max(B, 0), areaRatio };
  }

  private coronaryCompressionActivation(territory: CoronaryTerritory, x: Float64Array): number {
    const lvA = clamp(x[this.activeInternalIndex("LV").a], 0, 1);
    const rvA = clamp(x[this.activeInternalIndex("RV").a], 0, 1);
    if (territory === "RCA") return clamp(0.45 * lvA + 0.55 * rvA, 0, 1);
    return lvA;
  }

  private edgeChi(e: EdgeSpec, Pu: number, Pd: number): number {
    const Pext = this.externalPressure(e.ext ?? "none");
    const Ptube = smoothMin(Pu - Pext, Pd - Pext, 0.25);
    const z = (Ptube - (e.Pcrit ?? 0)) / Math.max(e.chiWidth ?? 1, 1e-6);
    const chiMin = e.chiMin ?? 0.08;
    return chiMin + (1 - chiMin) * sigmoid(z);
  }

  private externalPressure(ext: ExtKind, coronaryExt?: CoronaryExternalPressures): number {
    if (ext === "pth") return this.Pth();
    if (ext === "palv") return this.Palv();
    if (ext === "imLAD") return coronaryExt?.imLAD ?? this.Pth();
    if (ext === "imLCx") return coronaryExt?.imLCx ?? this.Pth();
    if (ext === "imRCA") return coronaryExt?.imRCA ?? this.Pth();
    if (ext === "imLADVen") return coronaryExt?.imLADVen ?? this.Pth();
    if (ext === "imLCxVen") return coronaryExt?.imLCxVen ?? this.Pth();
    if (ext === "imRCAVen") return coronaryExt?.imRCAVen ?? this.Pth();
    return 0;
  }

  private coronaryExternalPressures(Pperi: number, PLVtm: number, PRVtm: number): CoronaryExternalPressures {
    const scale = Math.max(this.p.coronaryCompressionScale, 0);
    const lv = Math.max(PLVtm, 0);
    const rv = Math.max(PRVtm, 0);
    const full = (territory: CoronaryTerritory) => {
      const spec = CORONARY_SPECS[territory];
      return Pperi + scale * (spec.gammaLv * lv + spec.gammaRv * rv);
    };
    const ven = (territory: CoronaryTerritory) => {
      const spec = CORONARY_SPECS[territory];
      return Pperi + scale * spec.venousExternalFraction * (spec.gammaLv * lv + spec.gammaRv * rv);
    };
    return {
      imLAD: full("LAD"),
      imLCx: full("LCx"),
      imRCA: full("RCA"),
      imLADVen: ven("LAD"),
      imLCxVen: ven("LCx"),
      imRCAVen: ven("RCA"),
    };
  }

  private Pth(): number {
    return this.p.Pth0 + 0.20 * this.p.PEEP + this.p.respAmpTh * Math.sin(2 * Math.PI * this.p.respRate * this.t);
  }

  private Palv(): number {
    return this.p.PEEP + this.p.respAmpAlv * Math.sin(2 * Math.PI * this.p.respRate * this.t);
  }

  private effectiveVu(n: NodeSpec, params: CoreRuntimeParams = this.p): number {
    return (n.Vu ?? 0) - (n.venousToneGain ?? 0) * params.venousTone;
  }

  private smoothParams(dt: number) {
    const tau = 0.25;
    const alpha = dt === 0 ? 1 : (1 - Math.exp(-dt / tau));
    const nums: (keyof CoreRuntimeParams)[] = [
      "HR", "contractility", "relaxation", "systemicResistance", "pulmonaryResistance",
      "venousTone", "arterialStiffness", "PEEP", "Pth0", "respAmpTh", "respAmpAlv",
      "speed", "avDelaySec", "atrialElectromechanicalDelaySec", "ventricularElectromechanicalDelaySec",
      "lvTmaxScale", "rvTmaxScale",
      "lvGeomScale", "rvGeomScale", "caReleaseScale", "rvCaReleaseScale",
      "pericardialPressureScaleMmHg", "pericardialSlackVolumeMl",
      "pericardialVolumeScaleMl", "pericardialSoftnessMl",
      "pericardialBiasMmHg", "pericardialFluidMl",
      "septalStiffnessScale", "septalK1MmHgPerMl", "septalK3MmHgPerMl3",
      "septalDampingMmHgSecPerMl", "septalMaxShiftMl", "septalLvPressureWeight",
      "coronaryResistanceScale", "coronaryCompressionScale", "coronaryVasodilator",
      "coronaryReserveMax", "LADStenosis", "LCxStenosis", "RCAStenosis",
    ];
    for (const k of nums) {
      const current = this.p[k];
      const target = this.pTarget[k];
      if (typeof current === "number" && typeof target === "number") {
        (this.p[k] as number) = current + alpha * (target - current);
      }
    }
    this.p.heartModel = this.pTarget.heartModel;
    this.p.useChiResistance = this.pTarget.useChiResistance;
    this.p.pericardiumEnabled = this.pTarget.pericardiumEnabled;
    this.p.septalCouplingEnabled = this.pTarget.septalCouplingEnabled;
    this.p.coronaryEnabled = this.pTarget.coronaryEnabled;
    // Rates are not smoothed but must be copied from the target so the
    // setTargetParameters() API path works, not just setImmediateParameters().
    this.p.bleedRate = this.pTarget.bleedRate;
    this.p.fluidRate = this.pTarget.fluidRate;
    // Hard clamps sourced from the SHARED protocol.HARD_CLAMP table, so the
    // integrated parameter set is exactly what sanitizeParams() produced — no
    // divergent re-clamp that would silently move deep-scale / rate edits.
    for (const k of RUNTIME_CLAMP_KEYS) {
      const r = HARD_CLAMP[k];
      if (r && typeof this.p[k] === "number") (this.p[k] as number) = clamp(this.p[k] as number, r[0], r[1]);
    }
  }

  private sanitizeState(x: Float64Array) {
    for (const name of nodeNames) {
      const n = this.nodes[this.nodeIndex.get(name)!];
      const ix = this.idx.node[name];
      const before = x[ix];
      if (n.kind === "venousPressure") {
        const bounds = this.venousVolumeBounds(n);
        x[ix] = clamp(x[ix], bounds.min, bounds.max);
      } else if (n.kind === "heartActive" || n.kind === "heartElastance") {
        x[ix] = clamp(x[ix], 3, 450);
      } else {
        x[ix] = clamp(x[ix], 1, 3000);
      }
      if (Math.abs(x[ix] - before) > 1e-9) {
          if (this.clampHitCount < 10) console.warn(`Clamp hit on node ${name}: from ${before.toFixed(3)} to ${x[ix].toFixed(3)} at t=${this.t.toFixed(3)}`);
          this.clampHitCount++;
      }
    }
    for (const e of dynamicEdgeNames) x[this.idx.q[e]] = clamp(x[this.idx.q[e]], -DYNAMIC_FLOW_CLAMP_ML_PER_S, DYNAMIC_FLOW_CLAMP_ML_PER_S);
    for (const v of valveNames) x[this.idx.xi[v]] = clamp(x[this.idx.xi[v]], 0, 1);
    x[this.idx.phi] = x[this.idx.phi] > 1e6 ? frac(x[this.idx.phi]) : x[this.idx.phi];
    x[this.idx.septumShift] = clampSeptalShift(x[this.idx.septumShift], {
      VLV: clamp(x[this.idx.node.LV], 1, 1000),
      VRV: clamp(x[this.idx.node.RV], 1, 1000),
      V0LV: this.nodes[this.nodeIndex.get("LV")!].V0 ?? 0,
      V0RV: this.nodes[this.nodeIndex.get("RV")!].V0 ?? 0,
    }, this.septumParams());
    for (const active of Object.values(this.idx.activeInternal)) {
      if (!active) continue;
      x[active.c] = clamp(x[active.c], 0, 5);
      x[active.a] = clamp(x[active.a], 0, 1);
      x[active.r] = clamp(x[active.r], 0, this.maxReservoirStrokeForInternal(active));
    }
  }

  private maxReservoirStrokeForInternal(active: { c: number; a: number; r: number }): number {
    for (const [ch, idx] of Object.entries(this.idx.activeInternal) as [Chamber, { c: number; a: number; r: number }][]) {
      if (idx?.r !== active.r) continue;
      return Math.max(this.activeModels[ch]?.ap.reservoirStrokeMl ?? 0, 0);
    }
    return 0;
  }

  private correctVenousPressuresToExpectedTBV(options: {
    gain?: number;
    maxTotalCorrectionMl?: number;
    maxNodeVolumeMl?: number;
  } = {}): void {
    if (!Number.isFinite(this.expectedTBV) || this.expectedTBV <= 0) return;
    const pack = this.computePressures(this.x);
    const currentTBV = this.totalBloodVolume(pack);
    const error = this.expectedTBV - currentTBV;
    const gain = options.gain ?? 0.35;
    const maxTotal = options.maxTotalCorrectionMl ?? 0.25;
    const correction = clamp(error * gain, -maxTotal, maxTotal);
    this.tbvCorrectionLastStepMl = Math.abs(correction);
    if (Math.abs(correction) < 1e-9) return;

    const entries = tbvCorrectionNodeNames.map((name) => {
      const node = this.nodes[this.nodeIndex.get(name)!];
      const ix = this.idx.node[name];
      const volume = pack.Vphys[this.nodeIndex.get(name)!];
      const compliance = this.venousCompliance(node, pack.Ptm[this.nodeIndex.get(name)!]);
      const bounds = this.venousVolumeBounds(node);
      return { node, ix, volume, compliance, bounds };
    });
    let applied = 0;
    let remaining = correction;
    const maxNode = options.maxNodeVolumeMl ?? 0.1;
    for (let iter = 0; iter < entries.length && Math.abs(remaining) > 1e-9; iter++) {
      const candidates = entries.filter((e) => {
        if (remaining > 0) return this.x[e.ix] < e.bounds.max - 1e-9;
        return this.x[e.ix] > e.bounds.min + 1e-9;
      });
      const volumeTotal = candidates.reduce((sum, e) => sum + Math.max(e.volume, 0), 0);
      const complianceTotal = candidates.reduce((sum, e) => sum + Math.max(e.compliance, 0), 0);
      const denom = volumeTotal > 1e-9 ? volumeTotal : complianceTotal;
      if (denom <= 1e-9) break;

      let iterApplied = 0;
      for (const e of candidates) {
        const rawWeight = volumeTotal > 1e-9 ? Math.max(e.volume, 0) : Math.max(e.compliance, 0);
        const share = remaining * (rawWeight / denom);
        const delta = clamp(share, -maxNode, maxNode);
        if (Math.abs(delta) < 1e-12) continue;
        const beforeVolume = this.x[e.ix];
        this.x[e.ix] = clamp(beforeVolume + delta, e.bounds.min, e.bounds.max);
        iterApplied += this.x[e.ix] - beforeVolume;
      }
      applied += iterApplied;
      remaining -= iterApplied;
      if (Math.abs(iterApplied) < 1e-12) break;
    }
    this.tbvCorrectionLastStepMl = Math.abs(applied);
    this.tbvCorrectionMagThisBeat += Math.abs(applied);
  }

  /**
   * Read-only snapshot of valve opening fractions (xi). Additive observability
   * helper; does not touch dynamics, so the frozen baseline behavior is unchanged.
   */
  /**
   * Instantaneous Phase A observables (read-only). Pmsf uses the textbook
   * approximation: systemic-vascular stressed volume / total effective
   * compliance, over the systemic vasculature only (heart and pulmonary excluded).
   */
  debugObservables(): SimObservables {
    const pack = this.computePressures(this.x);
    const flows = this.computeFlows(this.x, pack);
    const systemic = ["Ao", "SA", "Art", "Cap", "SV", "VC"] as const;
    const pulmonaryVenous = ["PCap", "PVen", "PVein"] as const;
    let stressed = 0;
    let compliance = 0;
    let externalWeighted = 0;
    let unstressed = 0;
    let venStressed = 0;
    let venUnstressed = 0;
    let pulmonaryVenousStressed = 0;
    let pulmonaryVenousUnstressed = 0;
    let pulmonaryVenousCompliance = 0;
    let pulmonaryVenousExternalWeighted = 0;
    for (const name of systemic) {
      const i = this.nodeIndex.get(name)!;
      const n = this.nodes[i];
      const ptm = pack.Ptm[i];
      const vu = this.effectiveVu(n);
      unstressed += vu;
      let cEff = 0;
      if (n.kind === "venousPressure") {
        const s = pack.Vphys[i] - vu;
        stressed += s;
        cEff = this.venousCompliance(n, ptm);
        compliance += cEff;
        venStressed += s;
        venUnstressed += vu;
      } else if (n.kind === "arterial") {
        const VsEff = Math.max((n.Vs ?? 100) / Math.max(this.p.arterialStiffness, 0.25), 1);
        stressed += pack.Vphys[i] - vu;
        cEff = VsEff / Math.max((n.P0 ?? 50) + ptm, 1e-6);
        compliance += cEff;
      } else if (n.kind === "linear") {
        stressed += pack.Vphys[i] - vu;
        cEff = Math.max(n.C ?? 1, 1e-6);
        compliance += cEff;
      }
      externalWeighted += cEff * this.externalPressure(n.ext ?? "none");
    }
    for (const name of pulmonaryVenous) {
      const i = this.nodeIndex.get(name)!;
      const n = this.nodes[i];
      const ptm = pack.Ptm[i];
      const vu = this.effectiveVu(n);
      const cEff = n.kind === "venousPressure"
        ? this.venousCompliance(n, ptm)
        : Math.max(n.C ?? 1, 1e-6);
      pulmonaryVenousUnstressed += vu;
      pulmonaryVenousStressed += pack.Vphys[i] - vu;
      pulmonaryVenousCompliance += cEff;
      pulmonaryVenousExternalWeighted += cEff * this.externalPressure(n.ext ?? "none");
    }
    const Pmsf = compliance > 1e-9 ? stressed / compliance : 0;
    const systemicExternalPressureWeighted = compliance > 1e-9 ? externalWeighted / compliance : 0;
    const PmsfAbs = Pmsf + systemicExternalPressureWeighted;
    const Pmpf = pulmonaryVenousCompliance > 1e-9 ? pulmonaryVenousStressed / pulmonaryVenousCompliance : 0;
    const pulmonaryVenousExternalPressureWeighted = pulmonaryVenousCompliance > 1e-9
      ? pulmonaryVenousExternalWeighted / pulmonaryVenousCompliance
      : 0;
    const PmpfAbs = Pmpf + pulmonaryVenousExternalPressureWeighted;
    const RAP = pack.P[this.nodeIndex.get("RA")!];
    const LAP = pack.P[this.nodeIndex.get("LA")!];
    const RVP = pack.P[this.nodeIndex.get("RV")!];
    const PAP = pack.P[this.nodeIndex.get("PA")!];
    const P_VC = pack.P[this.nodeIndex.get("VC")!];
    const P_PVein = pack.P[this.nodeIndex.get("PVein")!];
    const qLAD = flows[this.edgeIndex("Ao_LAD")];
    const qLCx = flows[this.edgeIndex("Ao_LCx")];
    const qRCA = flows[this.edgeIndex("Ao_RCA")];
    const AoP = pack.P[this.nodeIndex.get("Ao")!];
    const actualTBV = this.totalBloodVolume(pack);
    const laReservoir = this.laReservoirDebugFields(this.x, pack.Vphys[this.nodeIndex.get("LA")!]);
    const pvOstial = this.pvOstialDebugFields(this.x, pack, flows);
    return {
      Pmsf,
      PmsfTm: Pmsf,
      PmsfAbs,
      vrGradient: Pmsf - RAP,
      RAP,
      stressedVolumeSystemic: stressed,
      unstressedVolumeSystemic: unstressed,
      systemicComplianceEff: compliance,
      systemicExternalPressureWeighted,
      venousStressedVolume: venStressed,
      venousUnstressedVolume: venUnstressed,
      pulmonaryVenousVolume: pulmonaryVenousStressed + pulmonaryVenousUnstressed,
      pulmonaryVenousStressedVolume: pulmonaryVenousStressed,
      pulmonaryVenousUnstressedVolume: pulmonaryVenousUnstressed,
      pulmonaryVenousComplianceEff: pulmonaryVenousCompliance,
      pulmonaryVenousExternalPressureWeighted,
      Pmpf,
      PmpfTm: Pmpf,
      PmpfAbs,
      pulmonaryVenousReturnGradient: PmpfAbs - LAP,
      pVeinVcGradient: P_PVein - P_VC,
      tbvCorrectionMagPerBeat: this.tbvCorrectionMagLastBeat,
      tbvCorrectionLastStepMl: this.tbvCorrectionLastStepMl,
      expectedTBV: this.expectedTBV,
      tbvErrorMl: this.expectedTBV - actualTBV,
      Pth: this.Pth(),
      Palv: this.Palv(),
      Q_VC_RA: flows[this.edgeIndex("VC_RA")],
      Q_TV: flows[this.edgeIndex("TV")],
      Q_PV: flows[this.edgeIndex("PV")],
      Q_PCap_PVen: flows[this.edgeIndex("PCap_PVen")],
      xiTV: clamp(this.x[this.idx.xi.TV], 0, 1),
      xiPV: clamp(this.x[this.idx.xi.PV], 0, 1),
      dP_TV: RAP - RVP,
      dP_PV: RVP - PAP,
      P_SV: pack.P[this.nodeIndex.get("SV")!],
      P_VC,
      P_PVen: pack.P[this.nodeIndex.get("PVen")!],
      P_PVein,
      Pperi: pack.Pperi,
      Ppc: pack.Ppc,
      VHeart: pack.VHeart,
      septumShiftMl: pack.septumShiftMl,
      VLVeff: pack.VLVeff,
      VRVeff: pack.VRVeff,
      PLVfw: pack.PLVfw,
      PRVfw: pack.PRVfw,
      PVI_LV: pack.PVI_LV,
      PVI_RV: pack.PVI_RV,
      septalForceMmHg: pack.septalForceMmHg,
      Q_LAD: qLAD,
      Q_LCx: qLCx,
      Q_RCA: qRCA,
      Q_Cor_total: qLAD + qLCx + qRCA,
      Q_CS_RA: flows[this.edgeIndex("CS_RA")],
      P_LAD_Art: pack.P[this.nodeIndex.get("LAD_Art")!],
      P_LCx_Art: pack.P[this.nodeIndex.get("LCx_Art")!],
      P_RCA_Art: pack.P[this.nodeIndex.get("RCA_Art")!],
      P_CS: pack.P[this.nodeIndex.get("CS")!],
      PimLAD: pack.PimLAD,
      PimLCx: pack.PimLCx,
      PimRCA: pack.PimRCA,
      FFR_LAD: AoP > 1e-9 ? pack.P[this.nodeIndex.get("LAD_Art")!] / AoP : 0,
      FFR_LCx: AoP > 1e-9 ? pack.P[this.nodeIndex.get("LCx_Art")!] / AoP : 0,
      FFR_RCA: AoP > 1e-9 ? pack.P[this.nodeIndex.get("RCA_Art")!] / AoP : 0,
      ...pvOstial,
      ...laReservoir,
    };
  }

  debugVenousGroupBalances(): VenousGroupBalances {
    const pack = this.computePressures(this.x);
    const flows = this.computeFlows(this.x, pack);
    const group = (
      names: readonly NodeName[],
      inflowEdge: string,
      outflowEdge: string,
    ): VenousGroupBalance => {
      let volume = 0;
      let stressedVolume = 0;
      let unstressedVolume = 0;
      for (const name of names) {
        const i = this.nodeIndex.get(name)!;
        const n = this.nodes[i];
        const vu = this.effectiveVu(n);
        const stressedNodeVolume = pack.Vphys[i] - vu;
        volume += pack.Vphys[i];
        stressedVolume += stressedNodeVolume;
        unstressedVolume += vu;
      }
      const inflowMlPerS = flows[this.edgeIndex(inflowEdge)];
      const outflowMlPerS = flows[this.edgeIndex(outflowEdge)];
      return {
        volume,
        stressedVolume,
        unstressedVolume,
        inflowMlPerS,
        outflowMlPerS,
        netFlowMlPerS: inflowMlPerS - outflowMlPerS,
      };
    };
    const totalBloodVolume = this.totalBloodVolume(pack);
    return {
      systemicVenous: group(systemicVenousNodeNames, "Cap_SV", "VC_RA"),
      pulmonaryVenous: group(pulmonaryVenousNodeNames, "PArt_PCap", "PVein_LA"),
      totalBloodVolume,
      expectedTBV: this.expectedTBV,
      tbvErrorMl: this.expectedTBV - totalBloodVolume,
      tbvCorrectionMagPerBeat: this.tbvCorrectionMagLastBeat,
      tbvCorrectionLastStepMl: this.tbvCorrectionLastStepMl,
    };
  }

  debugValveOpenings(): Record<ValveName, number> {
    const out = {} as Record<ValveName, number>;
    for (const v of valveNames) out[v] = this.x[this.idx.xi[v]];
    return out;
  }

  private edgeIndex(name: string): number {
    const idx = this.edges.findIndex((e) => e.name === name);
    if (idx < 0) throw new Error(`Unknown edge ${name}`);
    return idx;
  }

  private totalBloodVolume(pack: PressurePack): number {
    let tbv = 0;
    for (let i = 0; i < pack.Vphys.length; i++) tbv += pack.Vphys[i];
    return tbv;
  }
}
