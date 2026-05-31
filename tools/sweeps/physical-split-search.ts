import { ModelCore, defaultParams } from "@/engine/ModelCore";
import { DEFAULT_SETTLE_POLICY } from "@/engine/settling";

console.warn = () => {};

const nodeNames = [
  "LV", "LA", "RV", "RA", "Ao", "SA", "Art", "Cap", "SV", "VC",
  "PA", "PArt", "PCap", "PVen", "PVein",
] as const;
const edgeNames = [
  "MV", "AoV", "TV", "PV", "Ao_SA", "SA_Art", "Art_Cap", "Cap_SV", "SV_VC", "VC_RA",
  "PA_PArt", "PArt_PCap", "PCap_PVen", "PVen_PVein", "PVein_LA",
] as const;
const ni = Object.fromEntries(nodeNames.map((n, i) => [n, i])) as Record<(typeof nodeNames)[number], number>;
const ei = Object.fromEntries(edgeNames.map((n, i) => [n, i])) as Record<(typeof edgeNames)[number], number>;

type Candidate = {
  name: string;
  pvVu: [number, number, number];
  pvC: [number, number, number];
  pveinLaR: number;
  pcapR?: number;
  pvenR?: number;
  laA?: number;
  laT?: number;
  raA?: number;
  raT?: number;
  mvR?: number;
  tvR?: number;
  vcRaR?: number;
  laPassive?: { sigmaPas0: number; bPas: number; Vref?: number; lambdaPas0?: number };
  raPassive?: { sigmaPas0: number; bPas: number; Vref?: number; lambdaPas0?: number };
};

const candidates: Candidate[] = [
  { name: "vu520-c8-r030-atriaSoft", pvVu: [120, 170, 230], pvC: [8, 8, 8], pveinLaR: 0.03, laA: 0.08, laT: 7000, raA: 0.08, raT: 7000 },
  { name: "vu560-c6-r035-atriaSoft", pvVu: [130, 180, 250], pvC: [6, 6, 6], pveinLaR: 0.035, laA: 0.08, laT: 7000, raA: 0.08, raT: 7000 },
  { name: "vu600-c5-r040-atriaSoft", pvVu: [140, 200, 260], pvC: [5, 5, 5], pveinLaR: 0.04, laA: 0.08, laT: 7000, raA: 0.08, raT: 7000 },
  { name: "vu560-c4-r050-atriaSoft", pvVu: [130, 180, 250], pvC: [4, 4, 4], pveinLaR: 0.05, laA: 0.08, laT: 7000, raA: 0.08, raT: 7000 },
  { name: "vu560-c6-r050-atriaVerySoft", pvVu: [130, 180, 250], pvC: [6, 6, 6], pveinLaR: 0.05, laA: 0.04, laT: 4000, raA: 0.04, raT: 4000 },
  { name: "vu520-c8-r050-mvTight", pvVu: [120, 170, 230], pvC: [8, 8, 8], pveinLaR: 0.05, laA: 0.06, laT: 5000, raA: 0.06, raT: 5000, mvR: 0.006, tvR: 0.006 },
  { name: "vu600-c6-r050-mvTight", pvVu: [140, 200, 260], pvC: [6, 6, 6], pveinLaR: 0.05, laA: 0.06, laT: 5000, raA: 0.06, raT: 5000, mvR: 0.006, tvR: 0.006 },
  { name: "vu520-c6-r040-laStiff1", pvVu: [120, 170, 230], pvC: [6, 6, 6], pveinLaR: 0.04, laA: 0.06, laT: 5000, raA: 0.08, raT: 7000, laPassive: { sigmaPas0: 500, bPas: 12 } },
  { name: "vu520-c6-r040-laStiff2", pvVu: [120, 170, 230], pvC: [6, 6, 6], pveinLaR: 0.04, laA: 0.06, laT: 5000, raA: 0.08, raT: 7000, laPassive: { sigmaPas0: 1000, bPas: 14 } },
  { name: "vu500-c5-r050-laStiff2", pvVu: [110, 165, 225], pvC: [5, 5, 5], pveinLaR: 0.05, laA: 0.06, laT: 5000, raA: 0.08, raT: 7000, laPassive: { sigmaPas0: 1000, bPas: 14 } },
  { name: "vu500-c5-r070-laStiff2", pvVu: [110, 165, 225], pvC: [5, 5, 5], pveinLaR: 0.07, laA: 0.06, laT: 5000, raA: 0.08, raT: 7000, laPassive: { sigmaPas0: 1000, bPas: 14 } },
  { name: "vu500-c4-r070-laStiff3", pvVu: [110, 165, 225], pvC: [4, 4, 4], pveinLaR: 0.07, laA: 0.04, laT: 3000, raA: 0.08, raT: 7000, laPassive: { sigmaPas0: 2000, bPas: 14 } },
  { name: "vu480-c4-r090-laStiff3", pvVu: [105, 160, 215], pvC: [4, 4, 4], pveinLaR: 0.09, laA: 0.04, laT: 3000, raA: 0.08, raT: 7000, laPassive: { sigmaPas0: 2000, bPas: 14 } },
  { name: "vu500-c4-r070-laStiff3-raSoft1", pvVu: [110, 165, 225], pvC: [4, 4, 4], pveinLaR: 0.07, laA: 0.04, laT: 3000, raA: 0.06, raT: 5000, laPassive: { sigmaPas0: 2000, bPas: 14 }, raPassive: { sigmaPas0: 200, bPas: 12, Vref: 45 } },
  { name: "vu500-c4-r070-laStiff3-raSoft2", pvVu: [110, 165, 225], pvC: [4, 4, 4], pveinLaR: 0.07, laA: 0.04, laT: 3000, raA: 0.04, raT: 3500, laPassive: { sigmaPas0: 2000, bPas: 14 }, raPassive: { sigmaPas0: 120, bPas: 10, Vref: 50 } },
  { name: "vu480-c4-r090-laStiff3-raSoft1", pvVu: [105, 160, 215], pvC: [4, 4, 4], pveinLaR: 0.09, laA: 0.04, laT: 3000, raA: 0.06, raT: 5000, laPassive: { sigmaPas0: 2000, bPas: 14 }, raPassive: { sigmaPas0: 200, bPas: 12, Vref: 45 } },
  { name: "vu500-c4-r070-laStiff3-raMid1", pvVu: [110, 165, 225], pvC: [4, 4, 4], pveinLaR: 0.07, laA: 0.04, laT: 3000, raA: 0.08, raT: 6000, laPassive: { sigmaPas0: 2000, bPas: 14 }, raPassive: { sigmaPas0: 250, bPas: 16, Vref: 38 } },
  { name: "vu500-c4-r070-laStiff3-raMid2", pvVu: [110, 165, 225], pvC: [4, 4, 4], pveinLaR: 0.07, laA: 0.04, laT: 3000, raA: 0.08, raT: 6000, laPassive: { sigmaPas0: 2000, bPas: 14 }, raPassive: { sigmaPas0: 220, bPas: 18, Vref: 36 } },
  { name: "vu500-c4-r070-laStiff3-raMid3", pvVu: [110, 165, 225], pvC: [4, 4, 4], pveinLaR: 0.07, laA: 0.04, laT: 3000, raA: 0.08, raT: 6000, laPassive: { sigmaPas0: 2000, bPas: 14 }, raPassive: { sigmaPas0: 180, bPas: 20, Vref: 34 } },
  { name: "vu500-c4-r070-laStiff3-raMid2Boost", pvVu: [110, 165, 225], pvC: [4, 4, 4], pveinLaR: 0.07, laA: 0.04, laT: 3000, raA: 0.12, raT: 10000, laPassive: { sigmaPas0: 2000, bPas: 14 }, raPassive: { sigmaPas0: 220, bPas: 18, Vref: 36 } },
  { name: "vu500-c4-r070-laStiff3-raMid4", pvVu: [110, 165, 225], pvC: [4, 4, 4], pveinLaR: 0.07, laA: 0.04, laT: 3000, raA: 0.1, raT: 8000, laPassive: { sigmaPas0: 2000, bPas: 14 }, raPassive: { sigmaPas0: 210, bPas: 19, Vref: 35 } },
  { name: "vu480-c4-r070-laStiff3-raMid4", pvVu: [105, 160, 215], pvC: [4, 4, 4], pveinLaR: 0.07, laA: 0.04, laT: 3000, raA: 0.1, raT: 8000, laPassive: { sigmaPas0: 2000, bPas: 14 }, raPassive: { sigmaPas0: 210, bPas: 19, Vref: 35 } },
];

function params(c: Candidate) {
  const [c1, c2, c3] = c.pvC;
  return {
    ...defaultParams(),
    projectTBV: false,
    nodeOverrides: {
      PCap: { Vu: c.pvVu[0], Copen: c1, Cdist: Math.max(2, c1 * 0.45), Ccoll: Math.max(2, c1 * 0.35) },
      PVen: { Vu: c.pvVu[1], Copen: c2, Cdist: Math.max(2, c2 * 0.45), Ccoll: Math.max(2, c2 * 0.35) },
      PVein: { Vu: c.pvVu[2], Copen: c3, Cdist: Math.max(2, c3 * 0.45), Ccoll: Math.max(2, c3 * 0.35) },
      LA: { active: { Arel0: c.laA ?? 0.1, Tmax0: c.laT ?? 9000, ...(c.laPassive ?? {}) } },
      RA: { active: { Arel0: c.raA ?? 0.1, Tmax0: c.raT ?? 9000, ...(c.raPassive ?? {}) } },
    },
    edgeOverrides: {
      PVein_LA: { R: c.pveinLaR },
      ...(c.pcapR ? { PArt_PCap: { R: c.pcapR } } : {}),
      ...(c.pvenR ? { PVen_PVein: { R: c.pvenR } } : {}),
      ...(c.mvR ? { MV: { R: c.mvR } } : {}),
      ...(c.tvR ? { TV: { R: c.tvR } } : {}),
      ...(c.vcRaR ? { VC_RA: { R: c.vcRaR } } : {}),
    },
  };
}

function pack(core: any) { return core.computePressures(core.x); }
function flows(core: any, p: any) { return core.computeFlows(core.x, p); }

function applyFractionalTBVCorrection(core: any, targetTBV: number) {
  if (process.env.CORRECT !== "fractional") return;
  const pp = pack(core);
  const v = pp.Vphys as Float64Array;
  const total = Array.from(v).reduce((a, b) => a + b, 0);
  const err = targetTBV - total;
  if (Math.abs(err) < 1e-8) return;
  const names = ["SV", "VC", "PCap", "PVen", "PVein"] as const;
  const venTotal = names.reduce((acc, name) => acc + v[ni[name]], 0);
  for (const name of names) {
    const node = core.nodes[ni[name]];
    const ix = core.idx.node[name];
    const curVol = v[ni[name]];
    const targetVol = Math.max(1, curVol + err * (curVol / Math.max(venTotal, 1e-9)));
    let lo = -20, hi = 45;
    for (let iter = 0; iter < 32; iter++) {
      const mid = 0.5 * (lo + hi);
      const vol = core.effectiveVu(node) + core.venousStressedVolume(node, mid);
      if (vol < targetVol) lo = mid;
      else hi = mid;
    }
    core.x[ix] = 0.5 * (lo + hi);
  }
}

function run(c: Candidate, tbv: number) {
  const dt = Number(process.env.DT ?? 0.002);
  const seconds = Number(process.env.SECONDS ?? 180);
  const core: any = new ModelCore(params(c) as any);
  core.initializeVenousPressuresForTargetTBV(tbv);
  const beatSec = 60 / defaultParams().HR;
  const windowSec = 5 * beatSec;
  const beats: any[] = [];
  let lastPhi = core.sample().phi;
  while (core.t < seconds - 1e-12) {
    core.step(dt);
    applyFractionalTBVCorrection(core, tbv);
    const s = core.sample();
    const pp = pack(core);
    const ff = flows(core, pp);
    const V = pp.Vphys as Float64Array;
    const phiFloor = Math.floor(s.phi);
    if (phiFloor > Math.floor(lastPhi)) {
      beats.push({ V: new Float64Array(V), pv: V[ni.PCap] + V[ni.PVen] + V[ni.PVein], total: Array.from(V).reduce((a, b) => a + b, 0) });
      if (beats.length > 20) beats.shift();
    }
    lastPhi = s.phi;
  }
  const boundary = Math.floor(core.sample().phi);
  while (Math.floor(core.sample().phi) === boundary) core.step(dt);
  const measureBeat = Math.floor(core.sample().phi);
  const data: any[] = [];
  while (Math.floor(core.sample().phi) === measureBeat) {
    const s = core.sample();
    const pp = pack(core);
    const ff = flows(core, pp);
    data.push({
      t: core.t, AoP: s.AoP, PAP: s.PAP, LAP: s.LAP, RAP: s.RAP, QAo: s.QAo, QPA: s.QPA,
      VLA: s.VLA, VRA: s.VRA, qInPV: ff[ei.PArt_PCap], qOutPV: ff[ei.PVein_LA],
    });
    core.step(dt);
  }
  data.push({
    t: core.t,
    ...(() => {
      const s = core.sample();
      const pp = pack(core);
      const ff = flows(core, pp);
      return {
        AoP: s.AoP, PAP: s.PAP, LAP: s.LAP, RAP: s.RAP, QAo: s.QAo, QPA: s.QPA,
        VLA: s.VLA, VRA: s.VRA, qInPV: ff[ei.PArt_PCap], qOutPV: ff[ei.PVein_LA],
      };
    })(),
  });
  let areaAo = 0, areaPA = 0, netAo = 0, netPA = 0, areaPV = 0;
  let sumAoP = 0, sumPAP = 0, sumLAP = 0, sumRAP = 0;
  for (let i = 1; i < data.length; i++) {
    const a = data[i - 1], b = data[i], d = b.t - a.t;
    areaAo += 0.5 * d * (Math.max(0, a.QAo) + Math.max(0, b.QAo));
    areaPA += 0.5 * d * (Math.max(0, a.QPA) + Math.max(0, b.QPA));
    netAo += 0.5 * d * (a.QAo + b.QAo);
    netPA += 0.5 * d * (a.QPA + b.QPA);
    areaPV += 0.5 * d * ((a.qInPV - a.qOutPV) + (b.qInPV - b.qOutPV));
    sumAoP += b.AoP; sumPAP += b.PAP; sumLAP += b.LAP; sumRAP += b.RAP;
  }
  const w = data.at(-1)!.t - data[0]!.t;
  const last = beats.at(-1), prev = beats.at(-2);
  const obs = core.debugObservables();
  const status = core.assessSteadyState({ ...DEFAULT_SETTLE_POLICY, tolPrimary: 1e-4, tolShape: 2e-4, capSeconds: seconds });
  const vlaMax = Math.max(...data.map((r) => r.VLA));
  const vlaMin = Math.min(...data.map((r) => r.VLA));
  const vraMax = Math.max(...data.map((r) => r.VRA));
  const vraMin = Math.min(...data.map((r) => r.VRA));
  const totalDelta = last && prev ? last.total - prev.total : NaN;
  const pvDelta = last && prev ? last.pv - prev.pv : NaN;
  const maxNodeDrift = last && prev ? Math.max(...Array.from(last.V as Float64Array).map((v, i) => Math.abs(v - prev.V[i]))) : NaN;
  return {
    name: c.name, tbv,
    settled: status.settled, reason: status.reason, worst: status.worstSignal, worstDelta: status.worstDelta,
    CO_L: (areaAo / w) * 60 / 1000,
    CO_R: (areaPA / w) * 60 / 1000,
    netCO_L: (netAo / w) * 60 / 1000,
    netCO_R: (netPA / w) * 60 / 1000,
    LAP: sumLAP / Math.max(data.length - 1, 1),
    RAP: sumRAP / Math.max(data.length - 1, 1),
    AoP: sumAoP / Math.max(data.length - 1, 1),
    PAP: sumPAP / Math.max(data.length - 1, 1),
    VLAmax: vlaMax, VLAmin: vlaMin,
    VRAmax: vraMax, VRAmin: vraMin,
    PVvol: obs.pulmonaryVenousVolume,
    PVein: obs.P_PVein,
    VC: obs.P_VC,
    PVeinVC: obs.pVeinVcGradient,
    totalDelta,
    pvResidual: pvDelta - areaPV * (beatSec / w),
    maxNodeDrift,
    health: core.health(),
  };
}

const tbvs = (process.env.TBVS ?? "5600").split(",").map(Number);
const nameFilter = new Set((process.env.NAMES ?? "").split(",").filter(Boolean));
for (const c of candidates) {
  if (nameFilter.size > 0 && !nameFilter.has(c.name)) continue;
  for (const tbv of tbvs) {
    const r = run(c, tbv);
    console.log(JSON.stringify({
      name: r.name, tbv: r.tbv,
      settled: [r.settled, r.reason, r.worst, Number(r.worstDelta.toExponential(2))],
      CO: [r.CO_L, r.CO_R, Math.abs(r.CO_L - r.CO_R), r.netCO_L, r.netCO_R, Math.abs(r.netCO_L - r.netCO_R)].map((x) => Number(x.toFixed(3))),
      P: [r.LAP, r.RAP, r.LAP - r.RAP, r.AoP, r.PAP].map((x) => Number(x.toFixed(2))),
      LA: [r.VLAmax, r.VLAmin].map((x) => Number(x.toFixed(1))),
      RA: [r.VRAmax, r.VRAmin].map((x) => Number(x.toFixed(1))),
      PVvol: Number(r.PVvol.toFixed(1)),
      PVeinVC: [r.PVein, r.VC, r.PVeinVC].map((x) => Number(x.toFixed(2))),
      drift: [r.totalDelta, r.pvResidual, r.maxNodeDrift].map((x) => Number(x.toFixed(4))),
      health: [r.health.status, Number(r.health.tbvDriftMl.toFixed(1)), Number(r.health.leftRightFlowMismatchLMin.toFixed(3)), r.health.clampHitCount],
    }));
  }
}
