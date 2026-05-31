import { ModelCore, defaultParams } from "@/engine/ModelCore";
import { DEFAULT_SETTLE_POLICY } from "@/engine/settling";

console.warn = () => {};

type Row = ReturnType<ModelCore["sample"]>;

function numbers(name: string, fallback: number[]) {
  return (process.env[name]?.split(",").map(Number).filter(Number.isFinite) ?? fallback);
}

function frac(x: number) {
  return x - Math.floor(x);
}

function phaseDiffMs(aTheta: number, refTheta: number, beatMs: number) {
  let d = refTheta - aTheta;
  if (d < -0.5) d += 1;
  if (d > 0.5) d -= 1;
  return d * beatMs;
}

function trap(dt: number, a: number, b: number) {
  return 0.5 * dt * (a + b);
}

function maxBy<T>(xs: T[], f: (x: T, i: number) => number) {
  let best = xs[0], value = -Infinity, index = 0;
  xs.forEach((x, i) => {
    const v = f(x, i);
    if (v > value) { best = x; value = v; index = i; }
  });
  return { item: best, value, index };
}

function smooth(values: number[], radius = 3) {
  return values.map((_v, i) => {
    let sum = 0, n = 0;
    for (let j = Math.max(0, i - radius); j <= Math.min(values.length - 1, i + radius); j++) {
      sum += values[j];
      n++;
    }
    return sum / Math.max(n, 1);
  });
}

function localBump(rows: Row[], key: "LAP" | "RAP") {
  const pressures = smooth(rows.map((r) => Number(r[key])));
  const late = rows
    .map((r, i) => ({ theta: frac(r.phi), i }))
    .filter(({ theta, i }) => theta >= 0.80 && theta < 0.995 && i > 0 && i < rows.length - 1);
  const fallback = maxBy(late, ({ i }) => Number(rows[i][key]));
  let best: { index: number; prominence: number } | null = null;
  for (const { i, theta } of late) {
    if (!(pressures[i - 1] < pressures[i] && pressures[i] >= pressures[i + 1])) continue;
    const left = late.filter((x) => x.theta >= Math.max(0.80, theta - 0.18) && x.i <= i);
    const right = late.filter((x) => x.i >= i && x.theta <= Math.min(0.995, theta + 0.12));
    const prominence = pressures[i] - Math.max(
      Math.min(...left.map((x) => pressures[x.i])),
      Math.min(...right.map((x) => pressures[x.i])),
    );
    if (prominence < 0.05) continue;
    if (!best || prominence > best.prominence) best = { index: i, prominence };
  }
  if (!best) return { row: rows[fallback.item.i], local: false, prominence: 0 };
  return { row: rows[best.index], local: true, prominence: best.prominence };
}

function crossing(rows: Row[], key: "QMV" | "QTV") {
  for (let i = 1; i < rows.length; i++) {
    if (rows[i - 1][key] > 0 && rows[i][key] <= 0) return rows[i];
  }
  return null;
}

function params(lead: number, arel: number, tmax: number, tauCa: number) {
  const p: any = defaultParams();
  p.nodeOverrides = {
    PCap: { Ccoll: 2.4, Copen: 4.8, Cdist: 2.4 },
    PVen: { Ccoll: 2.4, Copen: 4.8, Cdist: 2.4 },
    PVein: { Ccoll: 2.4, Copen: 4.8, Cdist: 2.4 },
    RA: { active: { atrialLeadSec: lead, Arel0: arel, Tmax0: tmax, tauCa0: tauCa } },
  };
  return p;
}

function evaluate(tbv: number, lead: number, arel: number, tmax: number, tauCa: number) {
  const dt = Number(process.env.DT ?? 0.001);
  const sampleHz = Number(process.env.SAMPLE_HZ ?? 1000);
  const measureBeats = Number(process.env.BEATS ?? 3);
  const core: any = new ModelCore(params(lead, arel, tmax, tauCa));
  core.initializeVenousPressuresForTargetTBV(tbv);
  const status = core.settleToSteady({ ...DEFAULT_SETTLE_POLICY, capSeconds: 180 }, dt, sampleHz);
  if (!status.settled) throw new Error(`not settled: ${JSON.stringify({ tbv, lead, arel, tmax, tauCa, status })}`);

  const startBeat = Math.floor(core.sample().phi);
  while (Math.floor(core.sample().phi) === startBeat) core.runFor(Math.min(0.01, dt * 10), dt, sampleHz);
  core.setTBVCorrectionEnabled(false);
  core.resetTBVCorrectionCounters();
  const balance0 = core.debugVenousGroupBalances();
  const rows: Row[] = [core.sample(), ...core.runFor(measureBeats * 60 / core.p.HR, dt, sampleHz)];
  const balance1 = core.debugVenousGroupBalances();

  let sysNet = 0, pvNet = 0, netAo = 0, netPa = 0, sumLAP = 0, sumRAP = 0;
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1], b = rows[i], d = b.t - a.t;
    sysNet += trap(d, a.QCapSV - a.SVF, b.QCapSV - b.SVF);
    pvNet += trap(d, a.QPArtPCap - a.PVF, b.QPArtPCap - b.PVF);
    netAo += trap(d, a.QAo, b.QAo);
    netPa += trap(d, a.QPA, b.QPA);
    sumLAP += b.LAP;
    sumRAP += b.RAP;
  }
  const duration = rows.at(-1)!.t - rows[0].t;
  const sysResidual = (balance1.systemicVenous.volume - balance0.systemicVenous.volume) - sysNet;
  const pvResidual = (balance1.pulmonaryVenous.volume - balance0.pulmonaryVenous.volume) - pvNet;

  const lastBeat = Math.floor(rows.at(-1)!.phi) - 1;
  const beatRows = rows.filter((r) => Math.floor(r.phi) === lastBeat);
  const beatMs = 60000 / core.p.HR;
  const ra = localBump(beatRows, "RAP");
  const rvpRise = maxBy(beatRows.slice(1), (r, i) => {
    const a = beatRows[i], b = r;
    return (b.RVP - a.RVP) / Math.max(b.t - a.t, 1e-9);
  }).item;
  const tvClose = crossing(beatRows, "QTV") ?? rvpRise;
  const health = core.health();
  return {
    tbv,
    local: ra.local,
    theta: frac(ra.row.phi),
    leadMs: phaseDiffMs(frac(ra.row.phi), frac(rvpRise.phi), beatMs),
    closeMs: phaseDiffMs(frac(ra.row.phi), frac(tvClose.phi), beatMs),
    prominence: ra.prominence,
    residual: Math.max(Math.abs(sysResidual), Math.abs(pvResidual)),
    netDiff: Math.abs(netAo - netPa) * 60 / (1000 * duration),
    grad: (sumLAP - sumRAP) / Math.max(rows.length - 1, 1),
    RA: [Math.max(...rows.map((r) => r.VRA)), Math.min(...rows.map((r) => r.VRA))],
    quiet: Math.max(Math.abs(sysResidual), Math.abs(pvResidual)) < 0.05 && health.clampHitCount === 0,
    clamps: health.clampHitCount,
  };
}

const leads = numbers("RA_LEADS", [0.26, 0.28, 0.30, 0.32]);
const arels = numbers("RA_ARELS", [0.14, 0.16, 0.18, 0.20]);
const tmaxes = numbers("RA_TMAXES", [8000, 10000, 12000]);
const taus = numbers("RA_TAUS", [0.06, 0.08]);
const tbvs = numbers("TBVS", [4800, 5600, 6200]);
const rows = [];

for (const lead of leads) {
  for (const arel of arels) {
    for (const tmax of tmaxes) {
      for (const tauCa of taus) {
        const perTbv = tbvs.map((tbv) => evaluate(tbv, lead, arel, tmax, tauCa));
        const score =
          perTbv.filter((r) => r.local).length * 1000 +
          perTbv.filter((r) => r.quiet).length * 100 -
          Math.max(...perTbv.map((r) => r.residual)) * 100 -
          Math.max(...perTbv.map((r) => Math.abs(r.leadMs - 125)));
        rows.push({ lead, arel, tmax, tauCa, score, perTbv });
      }
    }
  }
}

rows.sort((a, b) => b.score - a.score);
for (const r of rows.slice(0, Number(process.env.TOP ?? 12))) {
  console.log(JSON.stringify({
    p: { lead: r.lead, arel: r.arel, tmax: r.tmax, tauCa: r.tauCa },
    score: Number(r.score.toFixed(2)),
    tbv: r.perTbv.map((x) => ({
      tbv: x.tbv,
      local: x.local,
      theta: Number(x.theta.toFixed(4)),
      leadMs: Number(x.leadMs.toFixed(1)),
      closeMs: Number(x.closeMs.toFixed(1)),
      prom: Number(x.prominence.toFixed(3)),
      residual: Number(x.residual.toFixed(4)),
      netDiff: Number(x.netDiff.toFixed(4)),
      grad: Number(x.grad.toFixed(3)),
      RA: x.RA.map((v) => Number(v.toFixed(2))),
      quiet: x.quiet,
      clamps: x.clamps,
    })),
  }));
}
