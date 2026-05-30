import { clamp, frac, sigmoid, smoothMax, smoothMin, softplus, solveQuadraticFlow } from "@/engine/math";
import {
  ActiveStressChamberModel,
  ElastanceChamberModel,
  defaultActiveLV,
  defaultActiveRV,
  type ActiveChamberParams,
  type Chamber,
  type ChamberCtx,
} from "@/engine/chambers";
import type { ParameterPatch, SimMetrics, SimObservables, SimSample, SimulationHealth, SimulationHealthStatus, CoreRuntimeParams } from "@/engine/protocol";
import {
  assessBeatRing,
  DEFAULT_SETTLE_POLICY,
  type BeatSummary,
  type SettlePolicy,
  type SettleStatus,
  type SignalKey,
} from "@/engine/settling";

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
type ExtKind = "none" | "pth" | "palv";

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
  group?: "systemic" | "pulmonary" | "none";
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
  Aleak?: number;
  kOpen?: number;
  dP0?: number;
  tauOpen?: number;
  tauClose?: number;
  q0?: number;
  xi0?: number;
};

type PressurePack = {
  P: Float64Array;
  Ptm: Float64Array;
  Vphys: Float64Array;
};


const nodeNames = [
  "LV", "LA", "RV", "RA",
  "Ao", "SA", "Art", "Cap", "SV", "VC",
  "PA", "PArt", "PCap", "PVen", "PVein"
] as const;

const dynamicEdgeNames = ["MV", "AoV", "TV", "PV", "Ao_SA", "PA_PArt"] as const;
const valveNames = ["MV", "AoV", "TV", "PV"] as const;

type NodeName = typeof nodeNames[number];
type DynamicEdgeName = typeof dynamicEdgeNames[number];
type ValveName = typeof valveNames[number];

type StateIndex = {
  node: Record<NodeName, number>;
  q: Record<DynamicEdgeName, number>;
  xi: Record<ValveName, number>;
  phi: number;
  cLV: number;
  aLV: number;
  cRV: number;
  aRV: number;
  size: number;
};

function makeIndex(): StateIndex {
  let i = 0;
  const node = {} as Record<NodeName, number>;
  for (const n of nodeNames) node[n] = i++;
  const q = {} as Record<DynamicEdgeName, number>;
  for (const e of dynamicEdgeNames) q[e] = i++;
  const xi = {} as Record<ValveName, number>;
  for (const v of valveNames) xi[v] = i++;
  return {
    node,
    q,
    xi,
    phi: i++,
    cLV: i++,
    aLV: i++,
    cRV: i++,
    aRV: i++,
    size: i
  };
}


export function defaultParams(): CoreRuntimeParams {
  return {
    HR: 75,
    contractility: 1.0,
    relaxation: 1.0,
    // Calibrated operating point for the active-stress ventricle default.
    systemicResistance: 1.25,
    pulmonaryResistance: 1.0,
    venousTone: 0.2,
    arterialStiffness: 1.0,
    PEEP: 0,
    Pth0: 0,
    respAmpTh: 0,
    respAmpAlv: 0,
    respRate: 0.25,
    bleedRate: 0,
    fluidRate: 0,
    speed: 1,
    // LV/RV default to the single-fibre / active-stress model (§13).
    // Use `stableElastanceBaseline` to opt back into time-varying elastance.
    heartModel: "activeStress",
    useChiResistance: false,
    projectTBV: true,
    // Contractility multiplier on the (now folded-in) chamber Tmax0. 1.0 = baseline.
    lvTmaxScale: 1.0,
    rvTmaxScale: 1.0,
    lvGeomScale: 1,
    rvGeomScale: 1,
    caReleaseScale: 1,
    rvCaReleaseScale: 1,
    // Valve Defaults
    // MV
    MV_Amax: 5.0, MV_Aleak: 1e-4, MV_kOpen: 2.0, MV_tauOpen: 0.012, MV_tauClose: 0.025, MV_R: 0.002, MV_L: 0.0002,
    // AoV
    AoV_Amax: 3.5, AoV_Aleak: 1e-4, AoV_kOpen: 2.0, AoV_tauOpen: 0.010, AoV_tauClose: 0.030, AoV_R: 0.005, AoV_L: 0.001,
    // TV
    TV_Amax: 8.0, TV_Aleak: 1e-4, TV_kOpen: 2.0, TV_tauOpen: 0.012, TV_tauClose: 0.025, TV_R: 0.002, TV_L: 0.0002,
    // PV
    PV_Amax: 4.0, PV_Aleak: 1e-4, PV_kOpen: 2.0, PV_tauOpen: 0.010, PV_tauClose: 0.020, PV_R: 0.005, PV_L: 0.001
  };
}

function buildNodes(): NodeSpec[] {
  return [
    { name: "LV", kind: "heartActive", chamber: "LV", V0: 10, alpha: 0.015, beta: 0.8, Ees: 2.4, x0: 130, active: defaultActiveLV },
    { name: "LA", kind: "heartElastance", chamber: "LA", V0: 5, alpha: 0.05, beta: 0.4, Ees: 0.25, x0: 60 },
    { name: "RV", kind: "heartActive", chamber: "RV", V0: 15, alpha: 0.012, beta: 0.5, Ees: 0.85, x0: 140, active: defaultActiveRV },
    { name: "RA", kind: "heartElastance", chamber: "RA", V0: 5, alpha: 0.05, beta: 0.35, Ees: 0.22, x0: 60 },

    { name: "Ao", kind: "arterial", Vu: 0, P0: 50, Vs: 150, x0: 150 * Math.log1p(90 / 50) },
    { name: "SA", kind: "arterial", Vu: 0, P0: 50, Vs: 400, x0: 400 * Math.log1p(85 / 50) },
    { name: "Art", kind: "arterial", Vu: 0, P0: 45, Vs: 120, x0: 120 * Math.log1p(70 / 45) },
    { name: "Cap", kind: "linear", Vu: 0, C: 15, x0: 15 * 25 },
    { name: "SV", kind: "venousPressure", Vu: 2500, venousToneGain: 350, Ccoll: 15, Copen: 130, Cdist: 35, Popen: -2, Pstiff: 16, dOpen: 1.5, dStiff: 4, x0: 6 },
    { name: "VC", kind: "venousPressure", ext: "pth", Vu: 250, venousToneGain: 60, Ccoll: 5, Copen: 45, Cdist: 12, Popen: -1, Pstiff: 12, dOpen: 1, dStiff: 3, x0: 4 },

    { name: "PA", kind: "arterial", ext: "pth", Vu: 0, P0: 20, Vs: 60, x0: 60 * Math.log1p(16 / 20) },
    { name: "PArt", kind: "arterial", ext: "pth", Vu: 0, P0: 20, Vs: 90, x0: 90 * Math.log1p(13 / 20) },
    { name: "PCap", kind: "venousPressure", ext: "palv", Vu: 60, Ccoll: 3, Copen: 22, Cdist: 8, Popen: 0, Pstiff: 14, dOpen: 1, dStiff: 3, x0: 8 },
    { name: "PVen", kind: "venousPressure", ext: "pth", Vu: 90, Ccoll: 4, Copen: 28, Cdist: 10, Popen: -1, Pstiff: 14, dOpen: 1, dStiff: 3, x0: 6 },
    { name: "PVein", kind: "venousPressure", ext: "pth", Vu: 120, Ccoll: 5, Copen: 40, Cdist: 14, Popen: -1, Pstiff: 14, dOpen: 1, dStiff: 3, x0: 5 }
  ];
}

function buildEdges(): EdgeSpec[] {
  const q0 = 80;
  return [
    { name: "MV", up: "LA", down: "LV", kind: "valve", R: 0.002, L: 0.0002, B: 0, Amax: 1, Aleak: 1e-5, kOpen: 2.0, tauOpen: 0.012, tauClose: 0.025, q0, xi0: 0.2 },
    { name: "AoV", up: "LV", down: "Ao", kind: "valve", R: 0.005, L: 0.002, B: 1e-5, Amax: 1, Aleak: 1e-5, kOpen: 2.0, tauOpen: 0.010, tauClose: 0.030, q0, xi0: 0.2 },
    { name: "TV", up: "RA", down: "RV", kind: "valve", R: 0.002, L: 0.0002, B: 0, Amax: 1, Aleak: 1e-5, kOpen: 2.0, tauOpen: 0.012, tauClose: 0.025, q0, xi0: 0.2 },
    { name: "PV", up: "RV", down: "PA", kind: "valve", R: 0.005, L: 0.001, B: 1e-5, Amax: 1, Aleak: 1e-5, kOpen: 2.0, tauOpen: 0.010, tauClose: 0.020, q0, xi0: 0.2 },

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
    { name: "PVein_LA", up: "PVein", down: "LA", kind: "resistive", R: 0.02, B: 0 }
  ];
}

export class ModelCore {
  private readonly idx = makeIndex();
  private nodes = buildNodes();
  private edges = buildEdges();
  private readonly nodeIndex = new Map<string, number>();
  private readonly dynamicEdgeIndex = new Map<string, number>();
  private readonly valveIndex = new Map<string, number>();

  // Heart chamber models (ROADMAP S2). Active LV/RV use fixed default params
  // (matching the previous hard-coded behavior); elastance models track node params.
  private readonly activeModels: Record<"LV" | "RV", ActiveStressChamberModel> = {
    LV: new ActiveStressChamberModel(defaultActiveLV),
    RV: new ActiveStressChamberModel(defaultActiveRV),
  };
  private elastanceModels = new Map<string, ElastanceChamberModel>();

  t = 0;
  x: Float64Array;
  p: CoreRuntimeParams;
  pTarget: CoreRuntimeParams;
  private dVu = new Float64Array(nodeNames.length);
  private lastSample: SimSample | null = null;
  private history: SimSample[] = [];
  private rhsDt = 0.001;
  private initialTBV = 0;
  // Expected TBV ledger (M5a): initialTBV + integral of (fluidRate - bleedRate).
  // The projector follows this, and health compares mass conservation against it.
  private expectedTBV = 0;
  private clampHitCount = 0;

  // Steady-state detection (engine/settling.ts). The detector keeps its OWN
  // small ring of per-beat fingerprints, independent of the 1200-sample raw
  // history (which only spans ~10s), so it works across a 35-60s settle.
  private beatRing: BeatSummary[] = [];
  private beatAccum: BeatAccum | null = null;
  private totalBeats = 0;
  private opSig = ""; // operating-point signature; a change re-arms beat tracking

  constructor(initial?: Partial<CoreRuntimeParams>) {
    this.p = { ...defaultParams() };
    this.pTarget = { ...this.p };
    this.x = new Float64Array(this.idx.size);
    nodeNames.forEach((n, i) => this.nodeIndex.set(n, i));
    dynamicEdgeNames.forEach((n, i) => this.dynamicEdgeIndex.set(n, i));
    valveNames.forEach((n, i) => this.valveIndex.set(n, i));
    this.rebuildElastanceModels();
    if (initial) {
        this.setImmediateParameters(initial);
    }
    this.reset();
  }

  reset() {
    this.x.fill(0);
    for (const n of this.nodes) {
      this.x[this.idx.node[n.name as NodeName]] = n.x0;
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
    const lv0 = this.activeModels.LV.initialInternal();
    const rv0 = this.activeModels.RV.initialInternal();
    this.x[this.idx.cLV] = lv0.c;
    this.x[this.idx.aLV] = lv0.a;
    this.x[this.idx.cRV] = rv0.c;
    this.x[this.idx.aRV] = rv0.a;
    this.t = 0;
    this.history = [];
    this.lastSample = this.sample();
    this.initialTBV = this.lastSample.TBV;
    this.expectedTBV = this.initialTBV;
    this.clampHitCount = 0;
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
        if (this.p.edgeOverrides?.[e.name]) {
            return { ...e, ...this.p.edgeOverrides[e.name] };
        }
        return e;
    });

    this.rebuildElastanceModels();
    this.smoothParams(0); // Applies clamps
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
    this.projectVenousPressuresToTargetTBV(targetTBV);
    this.clearBeatTracking(); // volume change re-arms steady-state detection
    this.lastSample = this.sample();
    this.initialTBV = this.lastSample.TBV;
    this.expectedTBV = this.initialTBV;
  }

  step(dt: number) {
    this.rhsDt = Math.max(dt, 1e-6);
    const pBefore = { ...this.p };
    const vuBefore = this.effectiveVuAll(pBefore);
    this.smoothParams(dt);
    const vuAfter = this.effectiveVuAll(this.p);
    for (let i = 0; i < this.dVu.length; i++) {
      this.dVu[i] = (vuAfter[i] - vuBefore[i]) / Math.max(dt, 1e-9);
    }

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
    if (this.p.projectTBV) this.projectVenousPressuresToTargetTBV(this.expectedTBV);
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
        if (this.history.length > 1200) this.history.shift();
        sampleAt += sampleInterval;
      }
    }
    return samples;
  }

  sample(): SimSample {
    const pack = this.computePressures(this.x);
    const flows = this.computeFlows(this.x, pack);
    const s: SimSample = {
      t: this.t,
      AoP: pack.P[this.nodeIndex.get("Ao")!],
      PAP: pack.P[this.nodeIndex.get("PA")!],
      LAP: pack.P[this.nodeIndex.get("LA")!],
      RAP: pack.P[this.nodeIndex.get("RA")!],
      LVP: pack.P[this.nodeIndex.get("LV")!],
      RVP: pack.P[this.nodeIndex.get("RV")!],
      QAo: flows[this.edgeIndex("AoV")],
      QPA: flows[this.edgeIndex("PV")],
      QMV: flows[this.edgeIndex("MV")],
      QTV: flows[this.edgeIndex("TV")],
      VLV: pack.Vphys[this.nodeIndex.get("LV")!],
      VRV: pack.Vphys[this.nodeIndex.get("RV")!],
      VLA: pack.Vphys[this.nodeIndex.get("LA")!],
      VRA: pack.Vphys[this.nodeIndex.get("RA")!],
      phi: this.x[this.idx.phi],
      aLV: clamp(this.x[this.idx.aLV], 0, 1),
      aRV: clamp(this.x[this.idx.aRV], 0, 1),
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
    const vals: Record<SignalKey, number> = {
      aopMean: a.sumAoP / n, aopSys: a.maxAoP, aopDia: a.minAoP,
      papMean: a.sumPAP / n, papSys: a.maxPAP, papDia: a.minPAP,
      rapMean: a.sumRAP / n, lapMean: a.sumLAP / n,
      svL: a.svL, svR: a.svR,
      edvL: a.maxVLV, esvL: a.minVLV, edvR: a.maxVRV, esvR: a.minVRV,
      lvEdp: a.lvEdp, rvEdp: a.rvEdp,
      pmsf: this.debugObservables().Pmsf, tbv: a.tbv,
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
    const SV_L = integratePositive("QAo");
    const SV_R = integratePositive("QPA");
    const EDV_L = max("VLV");
    const ESV_L = min("VLV");
    const EDV_R = max("VRV");
    const ESV_R = min("VRV");
    const lvEdSample = data.reduce((best, sample) => sample.VLV > best.VLV ? sample : best, data[0]);
    const rvEdSample = data.reduce((best, sample) => sample.VRV > best.VRV ? sample : best, data[0]);
    const obs = this.debugObservables();
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
      SV_L,
      SV_R,
      CO_L: (SV_L * this.p.HR) / 1000,
      CO_R: (SV_R * this.p.HR) / 1000,
      EF_LApprox: EDV_L > 1e-6 ? clamp((EDV_L - ESV_L) / EDV_L, 0, 1) : 0,
      EF_RApprox: EDV_R > 1e-6 ? clamp((EDV_R - ESV_R) / EDV_R, 0, 1) : 0,
      TBV: avg("TBV"),
      Pmsf: obs.Pmsf,
      vrGradient: obs.vrGradient,
      stressedVolumeSystemic: obs.stressedVolumeSystemic,
      unstressedVolumeSystemic: obs.unstressedVolumeSystemic
    };
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
        const Ceff = this.venousCompliance(n, pack.Ptm[ni]);
        dy[stateIndex] = clamp((balance[ni] - this.dVu[ni]) / Ceff, -50, 50);
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
      if (e.kind === "valve" || e.useChiResistance) {
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
    const lv = this.activeModels.LV.internalDerivatives(
      x[this.idx.node.LV], { c: x[this.idx.cLV], a: x[this.idx.aLV] }, this.chamberCtx("LV", x));
    const rv = this.activeModels.RV.internalDerivatives(
      x[this.idx.node.RV], { c: x[this.idx.cRV], a: x[this.idx.aRV] }, this.chamberCtx("RV", x));
    dy[this.idx.cLV] = lv.cDot;
    dy[this.idx.aLV] = lv.aDot;
    dy[this.idx.cRV] = rv.cDot;
    dy[this.idx.aRV] = rv.aDot;

    return dy;
  }

  private computePressures(x: Float64Array): PressurePack {
    const P = new Float64Array(nodeNames.length);
    const Ptm = new Float64Array(nodeNames.length);
    const Vphys = new Float64Array(nodeNames.length);
    const Pperi = this.Pth();

    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      const xi = this.idx.node[n.name as NodeName];
      const Pext = this.externalPressure(n.ext ?? "none");

      if (n.kind === "venousPressure") {
        const ptm = clamp(x[xi], -30, 60);
        Ptm[i] = ptm;
        Vphys[i] = this.effectiveVu(n) + this.venousStressedVolume(n, ptm);
        P[i] = Pext + ptm;
        continue;
      }

      const V = clamp(x[xi], 1, 1000);
      Vphys[i] = V;
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
      } else if (n.kind === "heartElastance" || (n.kind === "heartActive" && this.p.heartModel === "elastance")) {
        const ctx = this.chamberCtx(n.chamber ?? "LV", x);
        const ptm = this.elastanceModels.get(n.name)!.pressure(V, { c: 0, a: 0 }, ctx);
        Ptm[i] = ptm;
        P[i] = Pperi + ptm;
      } else if (n.kind === "heartActive") {
        const ch = n.chamber as "LV" | "RV";
        const internal = {
          c: ch === "LV" ? x[this.idx.cLV] : x[this.idx.cRV],
          a: ch === "LV" ? x[this.idx.aLV] : x[this.idx.aRV],
        };
        const ptm = this.activeModels[ch].pressure(V, internal, this.chamberCtx(ch, x));
        Ptm[i] = ptm;
        P[i] = Pperi + ptm;
      }
    }
    return { P, Ptm, Vphys };
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
        flows[ei] = clamp(x[this.idx.q[e.name as DynamicEdgeName]], -1200, 1200);
      } else {
        const { R, B } = this.effectiveLosses(e, Pu, Pd, x);
        flows[ei] = solveQuadraticFlow(Pu - PdEff, R, B);
      }
    }
    return flows;
  }

  /** Evaluation context handed to a ChamberModel for the given chamber. */
  private chamberCtx(chamber: Chamber, x: Float64Array): ChamberCtx {
    const isLV = chamber === "LV";
    return {
      HR: this.p.HR,
      contractility: this.p.contractility,
      relaxation: this.p.relaxation,
      phi: x[this.idx.phi],
      tmaxScale: isLV ? this.p.lvTmaxScale : this.p.rvTmaxScale,
      geomScale: isLV ? this.p.lvGeomScale : this.p.rvGeomScale,
      caReleaseScale: isLV ? this.p.caReleaseScale : this.p.rvCaReleaseScale,
    };
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

    if (e.kind === "valve") {
      const pName = e.name as ValveName;
      const vAmax = (this.p as any)[`${pName}_Amax`] ?? e.Amax ?? 1;
      const vAleak = (this.p as any)[`${pName}_Aleak`] ?? e.Aleak ?? 1e-4;
      const vR = (this.p as any)[`${pName}_R`] ?? e.R;
      const xi = clamp(x[this.idx.xi[pName]], 0, 1);
      areaRatio = Math.max(vAleak + xi * (vAmax - vAleak), 1e-4) / Math.max(vAmax, 1e-6);
      R = vR / (areaRatio * areaRatio);
      B = (e.B ?? 0) / (areaRatio * areaRatio);
    } else if ((e.useChiResistance || e.useChiQuadratic) && this.p.useChiResistance) {
      const chi = this.edgeChi(e, Pu, Pd);
      areaRatio = chi;
      if (e.useChiResistance) R = R * Math.pow(chi, -(e.chiRExp ?? 2));
      if (e.useChiQuadratic) B = B * Math.pow(chi, -(e.chiBExp ?? 2));
    }
    return { R: Math.max(R, 1e-8), B: Math.max(B, 0), areaRatio };
  }

  private edgeChi(e: EdgeSpec, Pu: number, Pd: number): number {
    const Pext = this.externalPressure(e.ext ?? "none");
    const Ptube = smoothMin(Pu - Pext, Pd - Pext, 0.25);
    const z = (Ptube - (e.Pcrit ?? 0)) / Math.max(e.chiWidth ?? 1, 1e-6);
    const chiMin = e.chiMin ?? 0.08;
    return chiMin + (1 - chiMin) * sigmoid(z);
  }

  private externalPressure(ext: ExtKind): number {
    if (ext === "pth") return this.Pth();
    if (ext === "palv") return this.Palv();
    return 0;
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

  private effectiveVuAll(params: CoreRuntimeParams): Float64Array {
    const out = new Float64Array(nodeNames.length);
    for (let i = 0; i < this.nodes.length; i++) out[i] = this.effectiveVu(this.nodes[i], params);
    return out;
  }

  private smoothParams(dt: number) {
    const tau = 0.25;
    const alpha = dt === 0 ? 1 : (1 - Math.exp(-dt / tau));
    const nums: (keyof CoreRuntimeParams)[] = [
      "HR", "contractility", "relaxation", "systemicResistance", "pulmonaryResistance",
      "venousTone", "arterialStiffness", "PEEP", "Pth0", "respAmpTh", "respAmpAlv", "speed", "lvTmaxScale", "rvTmaxScale", "lvGeomScale", "rvGeomScale", "caReleaseScale", "rvCaReleaseScale"
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
    this.p.HR = clamp(this.p.HR, 30, 180);
    this.p.contractility = clamp(this.p.contractility, 0.25, 2.5);
    this.p.relaxation = clamp(this.p.relaxation, 0.25, 2.5);
    this.p.systemicResistance = clamp(this.p.systemicResistance, 0.2, 3.5);
    this.p.pulmonaryResistance = clamp(this.p.pulmonaryResistance, 0.2, 4.0);
    this.p.venousTone = clamp(this.p.venousTone, 0, 1);
    this.p.arterialStiffness = clamp(this.p.arterialStiffness, 0.4, 3.0);
    this.p.PEEP = clamp(this.p.PEEP, 0, 25);
    // Rates are not smoothed but must be copied from the target so the
    // setTargetParameters() API path works, not just setImmediateParameters().
    this.p.bleedRate = clamp(this.pTarget.bleedRate, 0, 2000);
    this.p.fluidRate = clamp(this.pTarget.fluidRate, 0, 2000);
    this.p.speed = clamp(this.p.speed, 0.1, 10);
    // Range re-centered on the new 1.0 baseline (after folding the legacy 4.5
    // into Tmax0). Low floor preserves/extends the depressed-contractility
    // (cardiogenic shock) regime, which is a primary abnormal-case use.
    this.p.lvTmaxScale = clamp(this.p.lvTmaxScale, 0.05, 2.5);
    this.p.rvTmaxScale = clamp(this.p.rvTmaxScale, 0.05, 3.0);
    this.p.lvGeomScale = clamp(this.p.lvGeomScale, 0.5, 2.5);
    this.p.rvGeomScale = clamp(this.p.rvGeomScale, 0.5, 3.0);
    this.p.caReleaseScale = clamp(this.p.caReleaseScale, 0.25, 6);
    this.p.rvCaReleaseScale = clamp(this.p.rvCaReleaseScale, 0.25, 8);
  }

  private sanitizeState(x: Float64Array) {
    for (const name of nodeNames) {
      const n = this.nodes[this.nodeIndex.get(name)!];
      const ix = this.idx.node[name];
      const before = x[ix];
      if (n.kind === "venousPressure") {
        x[ix] = clamp(x[ix], -20, 45);
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
    for (const e of dynamicEdgeNames) x[this.idx.q[e]] = clamp(x[this.idx.q[e]], -1200, 1200);
    for (const v of valveNames) x[this.idx.xi[v]] = clamp(x[this.idx.xi[v]], 0, 1);
    x[this.idx.phi] = x[this.idx.phi] > 1e6 ? frac(x[this.idx.phi]) : x[this.idx.phi];
    x[this.idx.cLV] = clamp(x[this.idx.cLV], 0, 5);
    x[this.idx.aLV] = clamp(x[this.idx.aLV], 0, 1);
    x[this.idx.cRV] = clamp(x[this.idx.cRV], 0, 5);
    x[this.idx.aRV] = clamp(x[this.idx.aRV], 0, 1);
  }

  private projectVenousPressuresToTargetTBV(targetTBV: number): void {
    if (!Number.isFinite(targetTBV) || targetTBV <= 0) return;
    let lo = -30;
    let hi = 30;
    const volumeWithOffset = (off: number) => {
      let total = 0;
      for (let i = 0; i < this.nodes.length; i++) {
        const n = this.nodes[i];
        const ix = this.idx.node[n.name as NodeName];
        if (n.kind === "venousPressure") {
          const ptm = clamp(this.x[ix] + off, -20, 45);
          total += this.effectiveVu(n) + this.venousStressedVolume(n, ptm);
        } else {
          total += clamp(this.x[ix], 1, 1000);
        }
      }
      return total;
    };
    for (let i = 0; i < 5 && volumeWithOffset(lo) > targetTBV; i++) lo *= 1.5;
    for (let i = 0; i < 5 && volumeWithOffset(hi) < targetTBV; i++) hi *= 1.5;
    if (volumeWithOffset(lo) > targetTBV || volumeWithOffset(hi) < targetTBV) return;
    for (let iter = 0; iter < 28; iter++) {
      const mid = 0.5 * (lo + hi);
      if (volumeWithOffset(mid) < targetTBV) lo = mid;
      else hi = mid;
    }
    const off = 0.5 * (lo + hi);
    if (Math.abs(off) < 1e-7) return;
    for (const n of this.nodes) {
      if (n.kind !== "venousPressure") continue;
      const ix = this.idx.node[n.name as NodeName];
      this.x[ix] = clamp(this.x[ix] + off, -20, 45);
    }
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
    let stressed = 0;
    let compliance = 0;
    let unstressed = 0;
    let venStressed = 0;
    let venUnstressed = 0;
    for (const name of systemic) {
      const i = this.nodeIndex.get(name)!;
      const n = this.nodes[i];
      const ptm = pack.Ptm[i];
      const vu = this.effectiveVu(n);
      unstressed += vu;
      if (n.kind === "venousPressure") {
        const s = this.venousStressedVolume(n, ptm);
        stressed += s;
        compliance += this.venousCompliance(n, ptm);
        venStressed += s;
        venUnstressed += vu;
      } else if (n.kind === "arterial") {
        const VsEff = Math.max((n.Vs ?? 100) / Math.max(this.p.arterialStiffness, 0.25), 1);
        stressed += pack.Vphys[i] - vu;
        compliance += VsEff / Math.max((n.P0 ?? 50) + ptm, 1e-6);
      } else if (n.kind === "linear") {
        stressed += pack.Vphys[i] - vu;
        compliance += Math.max(n.C ?? 1, 1e-6);
      }
    }
    const Pmsf = compliance > 1e-9 ? stressed / compliance : 0;
    const RAP = pack.P[this.nodeIndex.get("RA")!];
    return {
      Pmsf,
      vrGradient: Pmsf - RAP,
      RAP,
      stressedVolumeSystemic: stressed,
      unstressedVolumeSystemic: unstressed,
      venousStressedVolume: venStressed,
      venousUnstressedVolume: venUnstressed,
      Pth: this.Pth(),
      Palv: this.Palv(),
      Q_VC_RA: flows[this.edgeIndex("VC_RA")],
      Q_PCap_PVen: flows[this.edgeIndex("PCap_PVen")],
      P_SV: pack.P[this.nodeIndex.get("SV")!],
      P_VC: pack.P[this.nodeIndex.get("VC")!],
      P_PVen: pack.P[this.nodeIndex.get("PVen")!],
      P_PVein: pack.P[this.nodeIndex.get("PVein")!],
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
