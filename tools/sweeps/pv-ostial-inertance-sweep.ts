import { defaultParams } from "@/engine/ModelCore";
import { measureConverged } from "@/engine/measure";
import { DEFAULT_SETTLE_POLICY } from "@/engine/settling";
import type { SimSample } from "@/engine/protocol";

console.warn = () => {};

function numbers(name: string, fallback: number[]) {
  return process.env[name]?.split(",").map(Number).filter(Number.isFinite) ?? fallback;
}

function paramsFor(r: number, l: number) {
  const p: any = defaultParams();
  p.nodeOverrides = {
    ...(p.nodeOverrides ?? {}),
    LA: {
      active: {
        ...(p.nodeOverrides?.LA?.active ?? {}),
        lambdaPas0: Number(process.env.LA_LAMBDA0 ?? 0.80),
        ...(process.env.LA_PRESSURE_FLOOR ? { pressureFloorMmHg: Number(process.env.LA_PRESSURE_FLOOR) } : {}),
        reservoirBranchGain: Number(process.env.RES_BRANCH_GAIN ?? 1),
        reservoirStrokeMl: Number(process.env.RES_STROKE ?? 20),
        reservoirSleeveVuMl: Number(process.env.RES_SLEEVE_VU ?? 0),
        reservoirSleeveCompliance: Number(process.env.RES_SLEEVE_C ?? 2.0),
        reservoirSleeveP0: Number(process.env.RES_SLEEVE_P0 ?? 0),
        reservoirSleeveMinVolumeMl: Number(process.env.RES_SLEEVE_MIN ?? 1),
        reservoirSleeveMaxVolumeMl: Number(process.env.RES_SLEEVE_MAX ?? 35),
        ...(process.env.RES_Q_PRESSURE_FLOOR_GUARD ? { reservoirQPressureFloorGuard: Number(process.env.RES_Q_PRESSURE_FLOOR_GUARD) } : {}),
        ...(process.env.RES_SLEEVE_MIN_PRESSURE_GUARD ? { reservoirSleeveMinPressureGuard: Number(process.env.RES_SLEEVE_MIN_PRESSURE_GUARD) } : {}),
        ...(process.env.RES_SLEEVE_MIN_PRESSURE_GUARD_WIDTH ? { reservoirSleeveMinPressureGuardWidthMl: Number(process.env.RES_SLEEVE_MIN_PRESSURE_GUARD_WIDTH) } : {}),
        reservoirTauFill: Number(process.env.RES_TAU_FILL ?? 0.10),
        reservoirTauRecoilIVR: Number(process.env.RES_TAU_RECOIL_IVR ?? 0.035),
      },
    },
  };
  p.edgeOverrides = {
    ...(p.edgeOverrides ?? {}),
    PVein_LA: {
      ...(p.edgeOverrides?.PVein_LA ?? {}),
      R: r,
      pvOstialResistanceR: r,
      pvOstialInertanceL: l,
      pvOstialQuadraticB: Number(process.env.PV_OSTIAL_B ?? 0),
    },
  };
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

function maxIn(rows: SimSample[], key: keyof SimSample, lo: number, hi: number) {
  const xs = rows.filter((s) => inPhase(s, lo, hi));
  const selected = xs.length > 0 ? xs : rows;
  return selected.reduce((best, s) => Number(s[key]) > Number(best[key]) ? s : best, selected[0]);
}

function trap(dt: number, a: number, b: number) {
  return 0.5 * dt * (a + b);
}

function mean(rows: SimSample[], key: keyof SimSample) {
  if (rows.length < 2) return rows.length === 1 ? Number(rows[0][key] ?? 0) : 0;
  let area = 0;
  let duration = 0;
  for (let i = 1; i < rows.length; i++) {
    const dt = rows[i].t - rows[i - 1].t;
    area += trap(dt, Number(rows[i - 1][key] ?? 0), Number(rows[i][key] ?? 0));
    duration += dt;
  }
  return duration > 0 ? area / duration : Number(rows.at(-1)?.[key] ?? 0);
}

function round(value: unknown): unknown {
  if (typeof value === "number") return Number(value.toFixed(4));
  if (Array.isArray(value)) return value.map(round);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, round(v)]));
  }
  return value;
}

function summarize(r: number, l: number, dt: number) {
  const m = measureConverged(paramsFor(r, l), {
    targetTBV: Number(process.env.TBV ?? 5600),
    dt,
    sampleHz: Number(process.env.SAMPLE_HZ ?? 1000),
    measureBeats: Number(process.env.BEATS ?? 3),
    settlePolicy: { ...DEFAULT_SETTLE_POLICY, capSeconds: Number(process.env.CAP ?? 180) },
    requireProjectorQuiet: false,
  });
  const rows = lastBeat(m.samples);
  const vPeak = maxIn(rows, "LAP", 0.25, 0.75);
  const aPeak = maxIn(rows, "LAP", 0.75, 0.15);
  const meanDrop = mean(rows, "P_PVein") - mean(rows, "LAP");
  const qMax = Math.max(...rows.map((s) => Math.abs(s.pvOstialQ ?? s.PVF)));
  const inertialDropMax = Math.max(...rows.map((s) => Math.abs(s.pvOstialInertialDrop ?? 0)));
  const branchFlags = [...new Set(rows.map((s) => s.twoBranchSolveFlag).filter(Boolean))].sort();
  return {
    r,
    l,
    dt,
    quiet: m.projectorQuiet,
    residual: m.venousBalances.maxResidualMl,
    correction: m.venousBalances.end.tbvCorrectionMagPerBeat,
    tbvDrift: m.tbvDriftMl,
    clamp: m.health.clampHitCount,
    netCODiff: m.netCODiffLMin,
    LA: [m.LA.volumeMax, m.LA.volumeMin],
    drop: meanDrop,
    qMax,
    inertialDropMax,
    branchFlags,
    vPeak: { p: vPeak.LAP, theta: phase(vPeak) },
    aPeak: { p: aPeak.LAP, theta: phase(aPeak) },
    vOverA: vPeak.LAP / Math.max(aPeak.LAP, 1e-9),
    vMinusA: vPeak.LAP - aPeak.LAP,
    passSafety: m.projectorQuiet && m.health.clampHitCount === 0 && m.netCODiffLMin < 0.01
      && m.venousBalances.maxResidualMl < 0.05 && Math.abs(m.tbvDriftMl) < 0.05
      && branchFlags.length === 1 && branchFlags[0] === "ok",
  };
}

const rs = numbers("PVO_R", [0.01, 0.015, 0.02]);
const ls = numbers("PVO_L", [0, 0.001, 0.002, 0.004, 0.008]);
const dts = numbers("DTS", [Number(process.env.DT ?? 0.001)]);

for (const dt of dts) {
  for (const r of rs) {
    for (const l of ls) {
      console.log(JSON.stringify({ kind: "row", ...(round(summarize(r, l, dt)) as Record<string, unknown>) }));
    }
  }
}
