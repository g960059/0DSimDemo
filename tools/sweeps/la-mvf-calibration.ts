import { measureConverged } from "@/engine/measure";
import { defaultParams } from "@/engine/ModelCore";
import type { CoreRuntimeParams, SimSample } from "@/engine/protocol";

type Point = { x: number; y: number };

const dt = Number(process.env.DT ?? 0.001);
const sampleHz = Number(process.env.SAMPLE_HZ ?? 1000);
const measureBeats = Number(process.env.MEASURE_BEATS ?? 3);
const tbvs = (process.env.TBVS ?? "5600,4800,6200")
  .split(",")
  .map((v) => Number(v.trim()))
  .filter((v) => Number.isFinite(v) && v > 0);

function envNumber(name: string): number | undefined {
  const raw = process.env[name];
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function paramsFromEnv(): CoreRuntimeParams {
  const p = defaultParams();
  const laActive: Record<string, number> = {};
  const raActive: Record<string, number> = {};

  const direct: Array<[string, keyof CoreRuntimeParams]> = [
    ["VENOUS_TONE", "venousTone"],
    ["PULM_R", "pulmonaryResistance"],
    ["SYS_R", "systemicResistance"],
    ["ART_STIFF", "arterialStiffness"],
    ["MV_R", "MV_R"],
    ["MV_L", "MV_L"],
    ["MV_B", "MV_B"],
    ["MV_TAU_OPEN", "MV_tauOpen"],
    ["MV_TAU_CLOSE", "MV_tauClose"],
  ];
  for (const [env, key] of direct) {
    const value = envNumber(env);
    if (value != null) (p[key] as number) = value;
  }

  const laMap: Array<[string, string]> = [
    ["LA_SIGMA", "sigmaPas0"],
    ["LA_BPAS", "bPas"],
    ["LA_LAMBDA0", "lambdaPas0"],
    ["LA_TMAX", "Tmax0"],
    ["LA_AREL", "Arel0"],
    ["LA_TREL", "Trel0"],
    ["LA_TAUCA", "tauCa0"],
    ["LA_AVP", "avPlaneGainMl"],
    ["LA_VREF", "Vref"],
    ["LA_VW", "Vw"],
    ["LA_KD", "Kd0"],
    ["LA_BETALAMBDA", "betaLambda"],
    ["LA_KON", "kOn"],
    ["LA_KOFF", "kOff"],
    ["LA_HILL", "hillN"],
  ];
  for (const [env, key] of laMap) {
    const value = envNumber(env);
    if (value != null) laActive[key] = value;
  }

  const raAvp = envNumber("RA_AVP");
  if (raAvp != null) raActive.avPlaneGainMl = raAvp;

  const nodeOverrides: NonNullable<CoreRuntimeParams["nodeOverrides"]> = {};
  if (Object.keys(laActive).length > 0) nodeOverrides.LA = { active: laActive };
  if (Object.keys(raActive).length > 0) nodeOverrides.RA = { active: raActive };
  if (Object.keys(nodeOverrides).length > 0) p.nodeOverrides = nodeOverrides;

  const pveinVu = envNumber("PVEIN_VU");
  const pvenVu = envNumber("PVEN_VU");
  const pcapVu = envNumber("PCAP_VU");
  const pvenC = envNumber("PVEN_C");
  const pcapC = envNumber("PCAP_C");
  if (pveinVu != null || pvenVu != null || pcapVu != null || pvenC != null || pcapC != null) {
    p.nodeOverrides = { ...(p.nodeOverrides ?? {}) };
    if (pcapVu != null || pcapC != null) {
      p.nodeOverrides.PCap = {
        ...(pcapVu != null ? { Vu: pcapVu } : {}),
        ...(pcapC != null ? { Copen: pcapC, Cdist: pcapC * 0.5, Ccoll: pcapC * 0.5 } : {}),
      };
    }
    if (pvenVu != null || pvenC != null) {
      p.nodeOverrides.PVen = {
        ...(pvenVu != null ? { Vu: pvenVu } : {}),
        ...(pvenC != null ? { Copen: pvenC, Cdist: pvenC * 0.5, Ccoll: pvenC * 0.5 } : {}),
      };
    }
    if (pveinVu != null || pvenC != null) {
      p.nodeOverrides.PVein = {
        ...(pveinVu != null ? { Vu: pveinVu } : {}),
        ...(pvenC != null ? { Copen: pvenC, Cdist: pvenC * 0.5, Ccoll: pvenC * 0.5 } : {}),
      };
    }
  }

  return p;
}

function phaseOf(s: SimSample): number {
  return s.phi - Math.floor(s.phi);
}

function signedDeltaTheta(theta: number, ref: number): number {
  let d = theta - ref;
  if (d > 0.5) d -= 1;
  if (d < -0.5) d += 1;
  return d;
}

function beatWindow(samples: SimSample[]): SimSample[] {
  if (samples.length < 3) return samples;
  const finalBeat = Math.floor(samples.at(-1)!.phi);
  const targetBeat = finalBeat - 1;
  const start = samples.findIndex((s) => Math.floor(s.phi) === targetBeat);
  if (start < 0) return samples;
  const after = samples.findIndex((s, i) => i > start && Math.floor(s.phi) > targetBeat);
  return samples.slice(start, after >= 0 ? after + 1 : undefined);
}

function inPhase(s: SimSample, lo: number, hi: number): boolean {
  const p = phaseOf(s);
  return lo <= hi ? p >= lo && p < hi : p >= lo || p < hi;
}

function maxBy<T>(xs: T[], fn: (x: T) => number): T {
  return xs.reduce((best, x) => fn(x) > fn(best) ? x : best, xs[0]);
}

function minBy<T>(xs: T[], fn: (x: T) => number): T {
  return xs.reduce((best, x) => fn(x) < fn(best) ? x : best, xs[0]);
}

function round(v: number, digits = 3): number | null {
  if (!Number.isFinite(v)) return null;
  const m = 10 ** digits;
  return Math.round(v * m) / m;
}

function polygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return Math.abs(area) / 2;
}

function countSelfIntersections(points: Point[]): number {
  let count = 0;
  for (let i = 0; i < points.length - 1; i++) {
    for (let j = i + 2; j < points.length - 1; j++) {
      if (i === 0 && j === points.length - 2) continue;
      if (segmentsIntersect(points[i], points[i + 1], points[j], points[j + 1])) count++;
    }
  }
  return count;
}

function figureEightLobes(samples: SimSample[]): { reservoirArea: number; boosterArea: number; lobes: Array<{ area: number; meanPhase: number }> } {
  const points = samples.map((s) => ({ x: s.VLA, y: s.LAP }));
  let best: { total: number; reservoirArea: number; boosterArea: number; lobes: Array<{ area: number; meanPhase: number }> } | null = null;
  for (let i = 0; i < points.length - 1; i++) {
    for (let j = i + 2; j < points.length - 1; j++) {
      if (i === 0 && j === points.length - 2) continue;
      const hit = segmentIntersectionPoint(points[i], points[i + 1], points[j], points[j + 1]);
      if (!hit) continue;
      const pathA = [hit, ...points.slice(i + 1, j + 1), hit];
      const phasesA = samples.slice(i + 1, j + 1).map(phaseOf);
      const pathB = [hit, ...points.slice(j + 1), ...points.slice(0, i + 1), hit];
      const phasesB = [...samples.slice(j + 1), ...samples.slice(0, i + 1)].map(phaseOf);
      const areaA = polygonArea(pathA);
      const areaB = polygonArea(pathB);
      const meanPhaseA = circularMeanPhase(phasesA);
      const meanPhaseB = circularMeanPhase(phasesB);
      const aIsReservoir = isReservoirPhase(meanPhaseA);
      const reservoirArea = aIsReservoir ? areaA : areaB;
      const boosterArea = aIsReservoir ? areaB : areaA;
      const total = areaA + areaB;
      if (!best || total > best.total) {
        best = {
          total,
          reservoirArea,
          boosterArea,
          lobes: [
            { area: areaA, meanPhase: meanPhaseA },
            { area: areaB, meanPhase: meanPhaseB },
          ].sort((a, b) => b.area - a.area),
        };
      }
    }
  }
  return best ?? { reservoirArea: 0, boosterArea: 0, lobes: [] };
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

function segmentIntersectionPoint(a: Point, b: Point, c: Point, d: Point): Point | null {
  if (!segmentsIntersect(a, b, c, d)) return null;
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const denom = cross(r, s);
  if (Math.abs(denom) < 1e-12) return null;
  const t = cross({ x: c.x - a.x, y: c.y - a.y }, s) / denom;
  return { x: a.x + t * r.x, y: a.y + t * r.y };
}

function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

function orient(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function circularMeanPhase(phases: number[]): number {
  if (phases.length === 0) return 0;
  let x = 0;
  let y = 0;
  for (const phase of phases) {
    x += Math.cos(2 * Math.PI * phase);
    y += Math.sin(2 * Math.PI * phase);
  }
  const angle = Math.atan2(y, x) / (2 * Math.PI);
  return angle < 0 ? angle + 1 : angle;
}

function isReservoirPhase(phase: number): boolean {
  return phase >= 0.20 && phase <= 0.75;
}

function positiveFlowPeaks(samples: SimSample[]): Array<{ phase: number; relMs: number; q: number }> {
  if (samples.length < 5) return [];
  const beatMs = 60000 / 75;
  const q = samples.map((s) => Math.max(0, s.QMV));
  const maxQ = Math.max(...q);
  const threshold = Math.max(25, maxQ * 0.10);
  const raw: Array<{ i: number; q: number }> = [];
  for (let i = 2; i < samples.length - 2; i++) {
    if (q[i] < threshold) continue;
    if (q[i] >= q[i - 1] && q[i] > q[i + 1] && q[i] >= q[i - 2] && q[i] > q[i + 2]) {
      raw.push({ i, q: q[i] });
    }
  }
  raw.sort((a, b) => b.q - a.q);
  const selected: Array<{ i: number; q: number }> = [];
  const minSepTheta = 0.06;
  for (const peak of raw) {
    const theta = phaseOf(samples[peak.i]);
    if (selected.every((p) => Math.abs(signedDeltaTheta(theta, phaseOf(samples[p.i]))) >= minSepTheta)) {
      selected.push(peak);
    }
  }
  selected.sort((a, b) => signedDeltaTheta(phaseOf(samples[a.i]), 0) - signedDeltaTheta(phaseOf(samples[b.i]), 0));
  return selected.map((peak) => {
    const phase = phaseOf(samples[peak.i]);
    return { phase, relMs: signedDeltaTheta(phase, 0) * beatMs, q: peak.q };
  });
}

function summarize(tbv: number, params: CoreRuntimeParams) {
  const measurement = measureConverged(params, { targetTBV: tbv, dt, sampleHz, measureBeats });
  const samples = beatWindow(measurement.samples);
  const laPoints = samples.map((s) => ({ x: s.VLA, y: s.LAP }));
  const lobes = figureEightLobes(samples);
  const vPeak = maxBy(samples.filter((s) => inPhase(s, 0.25, 0.75)), (s) => s.LAP);
  const aWindow = samples.filter((s) => inPhase(s, 0.70, 0.15));
  const aPeak = maxBy(aWindow, (s) => s.LAP);
  const aTrough = minBy(aWindow, (s) => s.LAP);
  const flows = positiveFlowPeaks(samples);
  const eCandidates = samples.filter((s) => inPhase(s, 0.35, 0.70));
  const aCandidates = samples.filter((s) => inPhase(s, 0.70, 0.15));
  const e = maxBy(eCandidates, (s) => Math.max(0, s.QMV));
  const a = maxBy(aCandidates, (s) => Math.max(0, s.QMV));
  return {
    tbv,
    settleBeats: measurement.settleStatus.beats,
    LAPMean: round(measurement.metrics.LAPMean),
    RAPMean: round(measurement.metrics.RAPMean),
    PAPMean: round(measurement.metrics.PAPMean),
    AoPMean: round(measurement.metrics.AoPMean),
    CO_L: round(measurement.metrics.CO_L),
    CO_R: round(measurement.metrics.CO_R),
    LAVmin: round(measurement.LA.volumeMin),
    LAVmax: round(measurement.LA.volumeMax),
    LAEF: round(measurement.LA.emptyingFraction, 4),
    LAPmin: round(Math.min(...samples.map((s) => s.LAP))),
    LAPmax: round(Math.max(...samples.map((s) => s.LAP))),
    vPeak: round(vPeak.LAP),
    aPeak: round(aPeak.LAP),
    aAmp: round(aPeak.LAP - aTrough.LAP),
    vMinusA: round(vPeak.LAP - aPeak.LAP),
    selfCrossings: countSelfIntersections(laPoints),
    reservoirArea: round(lobes.reservoirArea),
    boosterArea: round(lobes.boosterArea),
    lobes: lobes.lobes.map((lobe) => ({ area: round(lobe.area), meanPhase: round(lobe.meanPhase, 4) })),
    qmvE: round(Math.max(0, e.QMV)),
    qmvA: round(Math.max(0, a.QMV)),
    qmvEOverA: round(Math.max(0, e.QMV) / Math.max(Math.max(0, a.QMV), 1e-9), 4),
    qmvPeakCount: flows.length,
    qmvPeaks: flows.map((p) => ({ phase: round(p.phase, 4), relMs: round(p.relMs), q: round(p.q) })),
    projectorQuiet: measurement.projectorQuiet,
    tbvDriftMl: round(measurement.tbvDriftMl, 6),
    venousResidualMl: round(measurement.venousBalances.maxResidualMl, 6),
  };
}

const params = paramsFromEnv();
const result = {
  params: {
    venousTone: params.venousTone,
    pulmonaryResistance: params.pulmonaryResistance,
    systemicResistance: params.systemicResistance,
    arterialStiffness: params.arterialStiffness,
    MV_R: params.MV_R,
    MV_L: params.MV_L,
    MV_B: params.MV_B,
    MV_tauOpen: params.MV_tauOpen,
    MV_tauClose: params.MV_tauClose,
    nodeOverrides: params.nodeOverrides,
  },
  tbv: tbvs.map((tbv) => summarize(tbv, params)),
};

console.log(JSON.stringify(result, null, 2));
