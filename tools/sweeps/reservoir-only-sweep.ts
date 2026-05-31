import { defaultParams } from "@/engine/ModelCore";
import { measureConverged } from "@/engine/measure";
import { DEFAULT_SETTLE_POLICY } from "@/engine/settling";
import type { SimSample } from "@/engine/protocol";

console.warn = () => {};

type Params = ReturnType<typeof defaultParams>;

function numbers(name: string, fallback: number[]) {
  return process.env[name]?.split(",").map(Number).filter(Number.isFinite) ?? fallback;
}

function pulmonaryVuOverride() {
  const values = numbers("PULM_VU", []);
  if (values.length !== 3) return {};
  return {
    PCap: { Vu: values[0] },
    PVen: { Vu: values[1] },
    PVein: { Vu: values[2] },
  };
}

function paramsForStroke(stroke: number): Params {
  const p: any = defaultParams();
  const vu = pulmonaryVuOverride();
  p.nodeOverrides = {
    ...(p.nodeOverrides ?? {}),
    PCap: { Ccoll: 2.4, Copen: 4.8, Cdist: 2.4, ...vu.PCap },
    PVen: { Ccoll: 2.4, Copen: 4.8, Cdist: 2.4, ...vu.PVen },
    PVein: { Ccoll: 2.4, Copen: 4.8, Cdist: 2.4, ...vu.PVein },
    LA: {
      active: {
        ...(p.nodeOverrides?.LA?.active ?? {}),
        reservoirStrokeMl: stroke,
        reservoirTauFill: Number(process.env.RES_TAU_FILL ?? 0.10),
        reservoirTauRecoil: Number(process.env.RES_TAU_RECOIL ?? 0.15),
        ...(process.env.RES_TAU_RECOIL_IVR ? { reservoirTauRecoilIVR: Number(process.env.RES_TAU_RECOIL_IVR) } : {}),
        reservoirReleaseTheta: Number(process.env.RES_RELEASE_THETA ?? 0.55),
        ...(process.env.RES_VALVE_THRESHOLD ? { reservoirValveThreshold: Number(process.env.RES_VALVE_THRESHOLD) } : {}),
        ...(process.env.LA_SIGMA ? { sigmaPas0: Number(process.env.LA_SIGMA) } : {}),
        ...(process.env.LA_B ? { bPas: Number(process.env.LA_B) } : {}),
        ...(process.env.LA_LAMBDA0 ? { lambdaPas0: Number(process.env.LA_LAMBDA0) } : {}),
        ...(process.env.LA_LEAD ? { atrialLeadSec: Number(process.env.LA_LEAD) } : {}),
        ...(process.env.LA_AREL ? { Arel0: Number(process.env.LA_AREL) } : {}),
        ...(process.env.LA_TMAX ? { Tmax0: Number(process.env.LA_TMAX) } : {}),
        ...(process.env.LA_TAUCA ? { tauCa0: Number(process.env.LA_TAUCA) } : {}),
        ...(process.env.LA_TREL ? { Trel0: Number(process.env.LA_TREL) } : {}),
      },
    },
  };
  if (process.env.PVEIN_LA_R) {
    p.edgeOverrides = {
      ...(p.edgeOverrides ?? {}),
      PVein_LA: { R: Number(process.env.PVEIN_LA_R) },
    };
  }
  return p;
}

function phase(s: SimSample) {
  return s.phi - Math.floor(s.phi);
}

function inPhase(s: SimSample, lo: number, hi: number) {
  const p = phase(s);
  return lo <= hi ? p >= lo && p < hi : p >= lo || p < hi;
}

function lastBeat(samples: SimSample[]) {
  const beat = Math.floor(samples.at(-1)!.phi) - 1;
  const rows = samples.filter((s) => Math.floor(s.phi) === beat);
  return rows.length > 8 ? rows : samples;
}

function trap(dt: number, a: number, b: number) {
  return 0.5 * dt * (a + b);
}

function maxIn(rows: SimSample[], key: keyof SimSample, lo: number, hi: number) {
  const xs = rows.filter((s) => inPhase(s, lo, hi));
  const selected = xs.length > 0 ? xs : rows;
  return selected.reduce((best, s) => Number(s[key]) > Number(best[key]) ? s : best, selected[0]);
}

function minIn(rows: SimSample[], key: keyof SimSample, lo: number, hi: number) {
  const xs = rows.filter((s) => inPhase(s, lo, hi));
  const selected = xs.length > 0 ? xs : rows;
  return selected.reduce((best, s) => Number(s[key]) < Number(best[key]) ? s : best, selected[0]);
}

function shoelace(rows: SimSample[], lo: number, hi: number) {
  const xs = rows.filter((s) => inPhase(s, lo, hi));
  if (xs.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < xs.length; i++) {
    const a = xs[i], b = xs[(i + 1) % xs.length];
    area += a.VLA * b.LAP - b.VLA * a.LAP;
  }
  return 0.5 * area;
}

function phaseIntegral(rows: SimSample[], key: keyof SimSample, lo: number, hi: number, positiveOnly = false) {
  let total = 0;
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1], b = rows[i];
    if (!inPhase(b, lo, hi)) continue;
    const av = Number(a[key]);
    const bv = Number(b[key]);
    total += trap(b.t - a.t, positiveOnly ? Math.max(0, av) : av, positiveOnly ? Math.max(0, bv) : bv);
  }
  return total;
}

function mean(rows: SimSample[], key: keyof SimSample) {
  if (rows.length < 2) return rows.length === 1 ? Number(rows[0][key]) : 0;
  let area = 0;
  let duration = 0;
  for (let i = 1; i < rows.length; i++) {
    const dt = rows[i].t - rows[i - 1].t;
    area += trap(dt, Number(rows[i - 1][key]), Number(rows[i][key]));
    duration += dt;
  }
  return duration > 0 ? area / duration : Number(rows.at(-1)?.[key] ?? 0);
}

function pressureHysteresisWidth(rows: SimSample[]) {
  const fill = rows.filter((s) => inPhase(s, 0.05, 0.55));
  const empty = rows.filter((s) => inPhase(s, 0.55, 0.82));
  if (fill.length < 2 || empty.length < 2) return 0;
  const minV = Math.max(Math.min(...fill.map((s) => s.VLA)), Math.min(...empty.map((s) => s.VLA)));
  const maxV = Math.min(Math.max(...fill.map((s) => s.VLA)), Math.max(...empty.map((s) => s.VLA)));
  if (maxV <= minV) return 0;
  const bins = 16;
  let best = 0;
  for (let i = 0; i < bins; i++) {
    const lo = minV + (maxV - minV) * i / bins;
    const hi = minV + (maxV - minV) * (i + 1) / bins;
    const f = fill.filter((s) => s.VLA >= lo && s.VLA < hi);
    const e = empty.filter((s) => s.VLA >= lo && s.VLA < hi);
    if (f.length === 0 || e.length === 0) continue;
    const fp = f.reduce((sum, s) => sum + s.LAP, 0) / f.length;
    const ep = e.reduce((sum, s) => sum + s.LAP, 0) / e.length;
    best = Math.max(best, Math.abs(fp - ep));
  }
  return best;
}

function segmentsIntersect(
  ax: number, ay: number, bx: number, by: number,
  cx: number, cy: number, dx: number, dy: number,
) {
  const orient = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) =>
    (qx - px) * (ry - py) - (qy - py) * (rx - px);
  const o1 = orient(ax, ay, bx, by, cx, cy);
  const o2 = orient(ax, ay, bx, by, dx, dy);
  const o3 = orient(cx, cy, dx, dy, ax, ay);
  const o4 = orient(cx, cy, dx, dy, bx, by);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

function selfIntersections(rows: SimSample[]) {
  let count = 0;
  for (let i = 0; i < rows.length - 1; i++) {
    for (let j = i + 2; j < rows.length - 1; j++) {
      if (i === 0 && j === rows.length - 2) continue;
      if (segmentsIntersect(rows[i].VLA, rows[i].LAP, rows[i + 1].VLA, rows[i + 1].LAP, rows[j].VLA, rows[j].LAP, rows[j + 1].VLA, rows[j + 1].LAP)) count++;
    }
  }
  return count;
}

function summarize(tbv: number, stroke: number) {
  const m = measureConverged(paramsForStroke(stroke), {
    targetTBV: tbv,
    dt: Number(process.env.DT ?? 0.001),
    sampleHz: Number(process.env.SAMPLE_HZ ?? 1000),
    measureBeats: Number(process.env.BEATS ?? 3),
    settlePolicy: { ...DEFAULT_SETTLE_POLICY, capSeconds: Number(process.env.CAP ?? 180) },
    requireProjectorQuiet: false,
  });
  const rows = lastBeat(m.samples);
  const vPeak = maxIn(rows, "LAP", 0.25, 0.75);
  const aPeak = maxIn(rows, "LAP", 0.75, 0.15);
  const xTrough = minIn(rows, "LAP", 0.25, 0.85);
  const sPeak = maxIn(rows, "PVF", 0.05, 0.55);
  const dPeak = maxIn(rows, "PVF", 0.55, 0.80);
  const arMin = minIn(rows, "PVF", 0.75, 0.10);
  const obs = m.core.debugObservables();
  const meanLAP = mean(rows, "LAP");
  const meanRAP = mean(rows, "RAP");
  return {
    tbv,
    stroke,
    settle: m.settleStatus.actualSeconds,
    quiet: m.projectorQuiet,
    residual: m.venousBalances.maxResidualMl,
    correction: m.venousBalances.end.tbvCorrectionMagPerBeat,
    tbvDrift: m.tbvDriftMl,
    clamp: m.health.clampHitCount,
    netCO: [m.netCO_L, m.netCO_R, m.netCODiffLMin],
    grad: [meanLAP, meanRAP, meanLAP - meanRAP],
    LA: [m.LA.volumeMax, m.LA.volumeMin],
    RA: [m.RA.volumeMax, m.RA.volumeMin],
    pvVol: obs.pulmonaryVenousVolume,
    pVeinDrop: obs.P_PVein - meanLAP,
    rLA: [Math.max(...rows.map((s) => s.rLA)), Math.min(...rows.map((s) => s.rLA))],
    vPeak: { p: vPeak.LAP, theta: phase(vPeak) },
    aPeak: { p: aPeak.LAP, theta: phase(aPeak) },
    xTrough: { p: xTrough.LAP, theta: phase(xTrough) },
    vMinusA: vPeak.LAP - aPeak.LAP,
    vOverA: vPeak.LAP / Math.max(aPeak.LAP, 1e-9),
    aAmp: aPeak.LAP - xTrough.LAP,
    pvf: {
      sPeak: sPeak.PVF,
      dPeak: dPeak.PVF,
      arMin: arMin.PVF,
      sIntegral: phaseIntegral(rows, "PVF", 0.05, 0.55, true),
      dIntegral: phaseIntegral(rows, "PVF", 0.55, 0.80, true),
    },
    loop: {
      selfIntersections: selfIntersections(rows),
      reservoirArea: Math.abs(shoelace(rows, 0.25, 0.75)),
      boosterArea: Math.abs(shoelace(rows, 0.75, 0.15)),
      fullArea: Math.abs(shoelace(rows, 0, 1)),
      hysteresisWidth: pressureHysteresisWidth(rows),
    },
    phaseTiming: m.phaseTiming.msFromVentricularPhaseZero,
  };
}

function round(value: unknown): unknown {
  if (typeof value === "number") return Number(value.toFixed(4));
  if (Array.isArray(value)) return value.map(round);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, round(v)]));
  }
  return value;
}

function monotone(xs: number[], dir: "inc" | "dec" = "inc") {
  for (let i = 1; i < xs.length; i++) {
    if (dir === "inc" ? xs[i] + 1e-6 < xs[i - 1] : xs[i] - 1e-6 > xs[i - 1]) return false;
  }
  return true;
}

const tbvs = numbers("TBVS", [4800, 5600, 6200]);
const strokes = numbers("STROKES", [0, 5, 10, 15, 20]);
const results = [];

for (const tbv of tbvs) {
  const perTbv = [];
  for (const stroke of strokes) {
    const row = summarize(tbv, stroke);
    perTbv.push(row);
    results.push(row);
    console.log(JSON.stringify({ kind: "row", ...(round(row) as Record<string, unknown>) }));
  }
  console.log(JSON.stringify({
    kind: "summary",
    tbv,
    monotone: {
      vPeak: monotone(perTbv.map((r) => r.vPeak.p)),
      vOverA: monotone(perTbv.map((r) => r.vOverA)),
      reservoirArea: monotone(perTbv.map((r) => r.loop.reservoirArea)),
      pvfSIntegral: monotone(perTbv.map((r) => r.pvf.sIntegral)),
      hysteresisWidth: monotone(perTbv.map((r) => r.loop.hysteresisWidth)),
    },
    passSafety: perTbv.every((r) => r.quiet && r.clamp === 0 && r.netCO[2] < 0.01 && r.rLA[0] <= r.stroke + 1e-6 && r.rLA[1] >= -1e-6),
    stroke20: round(perTbv.at(-1)),
  }));
}
